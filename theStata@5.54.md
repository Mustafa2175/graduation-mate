TeamUp — Full Project Audit

## 1. Executive Summary

**Overall health: Cautiously stable. Beta-viable with targeted fixes.**

The app went through multiple stabilization sprints and is structurally sound for a closed university beta. The core loop — sign up → discover → swipe → match → see contact — is functional end-to-end. Auth state is coherent post-migration. The database schema is clean.

### Biggest Strengths

- Core swipe/match/contact-gating loop is correct and not race-prone at the UI level
- Middleware and session management are consistent post-stabilization
- RLS is enabled on all tables with reasonable policies
- Storage avatars are now owner-scoped
- Migration history is now in sync with the live DB
- Onboarding wizard UX is genuinely solid — track search, skill combobox, team preference card selection all feel real

### Biggest Risks

- **Contact data (`whatsapp_number`, `linkedin_url`) is readable by any authenticated user directly via the Supabase API**, not just through the controlled discover/matches queries. The contact-gating logic lives only in client queries, not in database policy.
- **`handle_new_user` is callable by anonymous and authenticated users** via the PostgREST RPC endpoint — a live Supabase security warning.
- **Any authenticated user can delete or rename any team** — team ownership is not enforced at the DB level.
- **`TRACK_OPTIONS` and `getAvatarBg` are duplicated across 4 files each** — maintenance debt that will cause divergence bugs.
- **N+1 query pattern on the matches page** — each match card fires 2 extra queries, totaling 36+ requests on a full matches page.
- **All 13 RLS policies re-evaluate `auth.uid()` per row** rather than per query — confirmed by Supabase performance advisor.

### Beta Readiness Assessment

**Ready for small closed beta (~50 users) if the Critical Issues below are fixed first.** Not ready for open/wide beta without addressing the contact data leakage issue.

---

## 2. Critical Issues — Must Fix Before Beta

### C1: Contact data not protected at database level

**Files:** `supabase/migrations/006_auth_migration.sql`, `lib/queries/profiles.ts`

The `profiles` SELECT policy is `USING (true)` — every field including `whatsapp_number` and `linkedin_url` is readable by any authenticated client, anonymously or directly through the Supabase JS client. The discover query carefully omits them, but any user can just run:

```graduation-mate/lib/queries/profiles.ts#L1-2
// Any client can call: supabase.from('profiles').select('whatsapp_number, linkedin_url')
// and get every user's contacts. No policy prevents this.
```

**Fix:** Add a new migration that creates a restricted view of profiles for the discover flow, or split contact fields into a separate `profile_contacts` table with its own RLS policy that only exposes data to matched users. The minimum viable fix is a DB-level column-masking policy.

---

### C2: `handle_new_user` callable via anonymous REST

**Source:** Supabase security advisor (confirmed live)

The `SECURITY DEFINER` function `public.handle_new_user()` is accessible at `/rest/v1/rpc/handle_new_user` by both `anon` and `authenticated` roles. Anyone can call it and potentially create a malformed profile row with a custom ID.

**Fix:** Apply this migration immediately:

```graduation-mate/supabase/migrations/010_secure_handle_new_user.sql#L1-6
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
-- The trigger itself uses SECURITY DEFINER and runs as the function owner,
-- so revoking public EXECUTE does not break the trigger.
```

---

### C3: Any authenticated user can delete or rename any team

**Files:** `supabase/migrations/006_auth_migration.sql`

Team UPDATE and DELETE policies use `USING (auth.uid() IS NOT NULL)` — literally any logged-in user. A student can rename or delete another team's entry.

**Fix:** Add a `team_members` ownership check or a `created_by` column. Minimum safe fix for beta:

```graduation-mate/supabase/migrations/011_team_owner_policies.sql#L1-12
-- Only allow team updates/deletes by members of that team
DROP POLICY IF EXISTS "Authenticated users can update teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can delete teams" ON public.teams;

CREATE POLICY "Team members can update their team"
  ON public.teams FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = teams.id AND profile_id = auth.uid()
  ));

CREATE POLICY "Team members can delete their team"
  ON public.teams FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = teams.id AND profile_id = auth.uid()
  ));
```

---

### C4: `middleware.ts` uses deprecated file convention

**File:** `graduation-mate/middleware.ts`

Every build emits: `The "middleware" file convention is deprecated. Please use "proxy" instead.` This is Next.js 16.2.6 — the file needs to be renamed to `proxy.ts` or the convention updated. This is not just cosmetic: the behavior of deprecated conventions in future patch releases is undefined.

**Fix:** Rename `middleware.ts` → `proxy.ts` and verify the `config.matcher` works as expected.

---

### C5: `matches` table has no UNIQUE constraint — race condition for duplicate matches

**File:** `lib/queries/matches.ts`

`createMatch` does a client-side check for duplicate matches before inserting. Two simultaneous mutual swipes could both pass the check before either inserts, creating two match rows for the same pair. There is no DB-level guard.

**Fix:**

```graduation-mate/supabase/migrations/012_matches_unique_constraint.sql#L1-8
-- Prevent duplicate matches regardless of order (A<->B and B<->A are the same match)
-- The simplest approach for the current schema:
ALTER TABLE public.matches
  ADD CONSTRAINT matches_no_duplicates
  UNIQUE (
    LEAST(profile1_id, profile2_id),
    GREATEST(profile1_id, profile2_id)
  );
```

---

## 3. Important Issues — Fix During or Before Closed Beta

### I1: All 13 RLS policies re-evaluate `auth.uid()` per row

**Source:** Supabase performance advisor (confirmed live — all 13 affected policies listed)

Every policy uses bare `auth.uid()` which PostgreSQL re-evaluates for each filtered row. The fix is a one-line wrapper. Example:

```graduation-mate/supabase/migrations/013_rls_perf_fix.sql#L1-4
-- Before:  USING (auth.uid() = from_profile_id)
-- After:   USING ((select auth.uid()) = from_profile_id)
-- This wraps the call in a subquery that initializes once per statement.
```

This needs to be applied to all 13 policies across `profiles`, `teams`, `team_members`, `swipes`, and `matches`.

---

### I2: `profiles.team_id` has no index — confirmed missing by advisor

**Source:** Supabase performance advisor (confirmed live)

`getDiscoverProfiles` fetches the current user's team and their teammates to build the exclude list. These queries filter by `team_id`. Without an index, they do full table scans.

```graduation-mate/supabase/migrations/014_index_profiles_team_id.sql#L1-2
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON public.profiles(team_id)
  WHERE team_id IS NOT NULL;
```

---

### I3: N+1 query pattern on Matches page

**File:** `graduation-mate/app/matches/page.tsx` lines 68–103

For every match returned, `loadMatches` fires two additional Supabase queries (team details + team members). With 18 current matches this is already 36 extra queries per page load. At 50+ users this will cause visible latency.

The root cause: `getMatchesForProfile` only selects `team_id` in the nested profile join but doesn't prefetch team data. This should be resolved at the query layer — either adding team data to the match query, or accepting that team info is optional and fetching it lazily only on expand.

---

### I4: `TeammateAvatars` component fires one query per profile card in discover

**File:** `graduation-mate/components/profile/TeammateAvatars.tsx`

Every profile card in discover that has a `team_id` fires a separate `team_members` query. At 20 profiles per page this is 20 extra requests. The discover query already fetches a `team_members` nested join (though its output is currently unused). Either feed the nested result through to `TeammateAvatars` as a prop, or batch the team queries.

---

### I5: Profile edit page uses inconsistent validation vs onboarding

**File:** `graduation-mate/app/profile/edit/page.tsx`

Three inconsistencies introduced during separate stabilization passes:

- `linkedin_url` is `z.string().url()` (required) in edit, but `z.union([z.string().url(), z.literal('')])` (optional) in `StepSocial`
- `whatsapp_number` is `z.string().min(1)` (no format check) in edit, but `/^\+?\d{7,15}$/` regex validated in `StepSocial`
- Edit page imports `upsertProfile` but should use `updateProfile` — upsert can accidentally overwrite with null if any field is missing from the form payload

---

### I6: Commitment level is visible in UI but not editable anywhere

**Files:** `components/profile/ProfileCard.tsx`, `app/profile/edit/page.tsx`

The discover card displays "Low/Medium/High commitment" badges prominently. But there is no UI anywhere to set this value. It defaults to `MEDIUM` at signup and cannot be changed. For student users this is a real trust issue — they may see everyone as "medium commitment" and assume the field is meaningless.

---

### I7: Debug console logs left in production logout path

**Files:** `hooks/useCurrentUser.ts`, `app/profile/edit/page.tsx`

`console.info("[auth] logout:start")`, `console.info("[auth] logout:supabase-session-cleared")`, and `[profile/edit] logout:*` were added as temporary debugging and left in. These appear in every user's browser console.

---

### I8: Middleware does not redirect authenticated users away from `/profile/setup`

**File:** `graduation-mate/middleware.ts`

An authenticated user who navigates directly to `/profile/setup` will successfully complete a second signup attempt (calling `supabase.auth.signUp` again on an existing email). This will error and confuse the user. The middleware lists `/profile/setup` as a public route with no authenticated redirect.

---

### I9: `profiles` SELECT RLS completely open — discovery of all users' data

**Related to C1.** Even beyond contact data, an anonymous user can query `profiles` with no auth token and see all names, departments, GPAs, tracks, bios, and avatar URLs. For a university app handling real student data, this is a broader privacy concern than just contact leakage.

---

## 4. Low Priority Cleanup — Nice to Have

### L1: `idx_profiles_available` and `idx_profiles_track` are unused

**Source:** Supabase performance advisor (confirmed live)

These indexes were created in `001_initial_schema.sql` but have never been hit. The actual discover query filters by `is_available = true` and `neq('id', ...)`, and Postgres may be using the primary key index instead. Consider dropping them after verifying the query plan.

---

### L2: Avatar bucket allows enumeration of all avatar file paths

**Source:** Supabase security advisor

The public SELECT policy lets any client list all files in the `avatars` bucket. This exposes the full set of user UUIDs (since paths follow `{uid}/avatar.ext`). Not an immediate threat, but worth restricting to `name` lookups only rather than broad listing.

---

### L3: Landing page "Sign up" button routes to `/login`

**File:** `graduation-mate/app/page.tsx` line 57

The CTA in the hero navbar says "Sign up" but links to `/login`. New users landing on the page and clicking "Sign up" will hit the login form and be confused. Should link to `/profile/setup`.

---

### L4: `TypingMessages` inline `messages` array causes unnecessary effect re-evaluation

**File:** `graduation-mate/app/page.tsx`

`const messages = [...]` is defined inside the component body and included in the `useEffect` dependency array. This creates a new array reference on every render. While not an infinite loop (state changes are gated), it's a subtle bug that should be `const messages = useMemo(() => [...], [])` or moved outside the component.

---

### L5: Leaked password protection disabled on Supabase Auth

**Source:** Supabase security advisor

HaveIBeenPwned integration is disabled. Easy one-click fix in the Supabase Auth dashboard under "Password Security". Prevents users from registering with known-compromised passwords.

---

### L6: No `poster` attribute on landing page video

**File:** `graduation-mate/app/page.tsx`

The hero background video has no `poster` fallback image. On slow connections the user sees a blank white screen for several seconds. The profile edit page correctly uses a `poster` attribute.

---

### L7: `profiles.track` defaults to `'OTHER'` in DB but 'OTHER' is not in `TRACK_OPTIONS`

**Files:** `supabase/migrations/001_initial_schema.sql`, `app/profile/setup/steps/StepTrack.tsx`

The trigger creates profiles with `track = 'OTHER'` but the onboarding step requires selecting from a validated list that doesn't include `'OTHER'`. This causes incorrect badge rendering in `getTrackBadge` for the window between trigger insert and profile update completion.

---

## 5. Dead Code / Legacy Cleanup List

| Item | File | Status |
|------|------|--------|
| `upsertProfile` re-exported from profiles | `lib/queries/profiles.ts` | Used in edit page, but should be `updateProfile` there |
| `Button` import in discover | `app/discover/page.tsx` | `Button` is imported but not used — removed already but worth verifying |
| `getInitials` import in discover | `app/discover/page.tsx` | Imported but not called in current JSX |
| Nested `team_members(profile_id, profiles(...))` in discover select | `lib/queries/profiles.ts` | Data fetched but never consumed — `TeammateAvatars` does its own query |
| `002_disable_rls.sql` migration | `supabase/migrations/002_disable_rls.sql` | Entirely superseded by `006_auth_migration.sql`. Safe to leave but confusing historically |
| `looking_for_role` on `teams` table | DB | Kept for backward compat but all new writes use `roles_needed`. Can be dropped in a future cleanup sprint |
| `STORAGE_KEY` constant duplicated between `useCurrentUser` reads | Internal | Minor — all reads go through `readCachedUser()` helper now |
| `LOGOUT_KEY` sentinel in localStorage | `hooks/useCurrentUser.ts` | Functional but `teamup_logout_in_progress` lingering in localStorage after session ends is confusing to inspect |

---

## 6. Refactor Opportunities

### Refactor Now

**Extract `TRACK_OPTIONS` to a shared constant file**

It is defined identically in `app/profile/edit/page.tsx` and `app/profile/setup/steps/StepTrack.tsx`. One update to one file won't be reflected in the other.

**Extract `getAvatarBg` to `lib/utils.ts`**

Four different implementations exist:
- `app/matches/page.tsx` — charcode, 6 flat colors
- `app/my-team/page.tsx` — hash, 6 gradient colors
- `app/teams/[id]/page.tsx` — hash, 6 gradient colors (same as my-team)
- `components/profile/ProfileCard.tsx` — charcode, 6 flat colors (different from matches)

The same person's avatar renders a different color depending on which page you're on. Extract one implementation to `lib/utils.ts`.

**Replace `updateProfile` with `updateProfile` in profile edit**

The edit page uses `upsertProfile` for saving changes. Replace with `updateProfile` to avoid potential partial-write edge cases and remove the stale import.

### Refactor Later (Post-Beta)

**Split `app/profile/edit/page.tsx` into sub-components**

This file is ~789 lines handling: profile form, avatar upload, track search, skill management, team creation/joining/leaving, team member display, and logout. It should be broken into focused components. Not urgent, but will become painful to modify.

**Move match data enrichment into a dedicated query function**

The `loadMatches` async function in `app/matches/page.tsx` does business logic (pairing profiles, fetching teams) that belongs in `lib/queries/matches.ts`. The page component should only drive UI state.

**Consider replacing the dual auth state (localStorage + Supabase cookies) with a single source**

The current `getFreshUser()` approach is functionally correct but architecturally awkward — it makes a network call to Supabase on every protected page mount. The right long-term solution is a React Context populated once from the Supabase session, propagated down. **Do not touch this before beta.**

---

## 7. Security Review

### Remaining Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Contact data readable by any auth'd user | **High** | Must fix — any user can query `whatsapp_number`, `linkedin_url` directly |
| `handle_new_user` callable via REST | **High** | Confirmed live — REVOKE EXECUTE needed |
| Any auth'd user can delete any team | **High** | Confirmed live — team policies too permissive |
| No email domain validation | Medium | Any email works — not `.edu` enforced |
| No rate limiting on swipes | Medium | Programmatic mass-swiping is possible |
| Avatar bucket allows path enumeration | Low | Exposes user UUIDs |
| Leaked password protection disabled | Low | Easy one-click fix in Supabase dashboard |
| No CSP or security headers | Low | Should be added in `next.config.ts` before wide beta |

### Abuse Vectors

- **Swipe bombing:** A script can authenticate and swipe right on all 20 seeded profiles in one loop, creating 20 matches instantly if any reciprocate.
- **Profile scraping:** The profiles SELECT policy + no rate limiting means all student profiles (names, departments, GPAs, bios, avatars) can be bulk-fetched with a single query.
- **Fake team join:** If a user knows another team's UUID (exposed via invitation token copy), they can try to join it via the REST API directly (bypassing the UI that limits team joining).

### Privacy Concerns

- GPAs stored in plain text, fully readable by all authenticated users.
- No data deletion flow — once a profile is created there's no way for a user to delete their account from the UI.

---

## 8. Architecture Review

### Current Weak Points

**Dual auth state is the central architectural risk.** `useCurrentUser.getUser()` (synchronous, localStorage) and `getFreshUser()` (async, Supabase network call) are both in use. Every page now uses `getFreshUser()` on mount, meaning every protected page makes a Supabase Auth network roundtrip before rendering anything. This is correct for correctness, but adds ~100–300ms to every initial page render.

**The `teamup_logout_in_progress` localStorage sentinel** is a band-aid for a race condition in the logout flow. It works but is fragile — a browser crash or tab close mid-logout would leave the flag set and prevent `getFreshUser()` from rehydrating the session on the next visit, locking the user in a weird state until they clear localStorage manually.

**No error boundary anywhere.** If any component throws a JavaScript error, the entire app crashes to a blank screen. A simple `<ErrorBoundary>` wrapper in `app/layout.tsx` would catch these.

### Temporary Compromises (Known, Acceptable)

- `any` types for team/match data — acceptable for beta, should be tightened post-beta with generated Supabase TypeScript types
- `eslint-disable react-hooks/exhaustive-deps` on multiple `useEffect` hooks — correct behavior in practice, but fragile as the components evolve
- `looking_for_role` kept in teams table alongside normalized columns — backward compat shim, remove in a post-beta migration

### Technical Debt to Track

- The middleware → proxy rename (required by framework)
- The contact data protection gap (architectural decision required)
- Commitment level being uneditable (product gap)
- No account deletion flow (GDPR concern for any real deployment)

---

## 9. Product / UX Review

### Likely Student Pain Points

**"Why is my discover empty?"**
A new user who has swiped everyone (or is the only user) sees "You've seen everyone!" which is indistinguishable from a bug at low user counts. The empty state copy doesn't mention *how many users are in the pool*.

**"What does commitment level mean and can I change it?"**
It shows on every card but can't be changed. Students will wonder if it's broken.

**"My team invite token is my profile UUID, not a team UUID"**
The profile edit page says "Copy Invite ID" and copies `profileId`. The my-team page displays `team.id` as the invitation token. These are different UUIDs. Confusing to students trying to share the correct token.

**"The logout button did nothing"** (was the previous bug — now fixed)

**"Sign up" links to login**
Landing page CTA sends new visitors to `/login` instead of `/profile/setup`.

### Retention Risks

- Users who create a profile but don't match with anyone have no feedback that anyone has swiped right on them (no notification, no counter)
- Users who match but neither person shares contacts see a locked card forever with no prompt to act
- No "bump" or re-engagement mechanism
- The 5-step wizard feels long for a beta — students may abandon before completing

### Confusion Risks

- Two separate places to configure team preferences: `profile/edit` (team status, looking_for_role on profile) and `my-team` (project description, tech stack, roles_needed on the team entity). Students don't understand which one affects what.
- The "Reset Queue" button is the only way to see users you've already swiped — no "undo" concept.

---

## 10. Performance Review

### Current Bottlenecks

| Issue | Location | Impact |
|-------|----------|--------|
| N+1 team queries in matches | `app/matches/page.tsx` | 36+ queries per full page load |
| Per-card teammate query in discover | `TeammateAvatars.tsx` | Up to 20 extra queries per discover load |
| All RLS policies re-eval `auth.uid()` per row | DB | Grows quadratically with table size |
| No index on `profiles.team_id` | DB | Full table scan on teammate exclusion query |
| `getFreshUser()` Supabase roundtrip on every mount | All protected pages | ~100–300ms added to every initial render |
| Large background videos (no preloading strategy) | Landing + edit pages | ~2–5 MB each, no bandwidth detection |
| Unused indexes `idx_profiles_available`, `idx_profiles_track` | DB | Overhead on writes |

### Scaling Concerns for Beta (50–200 users)

At 50–200 users this app will work fine. The real scaling cliff is:

- **Discover query**: fetches ALL available profiles minus swiped ones. No pagination. At 500+ users this becomes a large payload.
- **Swipes table**: with 200 users each swiping everyone, this is 200×200 = 40,000 rows. The `getSwipedIds` query returns all of them for the current user before the discover query runs. This should still be fast due to indexes.
- **Match team enrichment**: stays O(N) per matches page load but each query is sequential (not parallel).

---

## 11. Recommended Next Steps

### Phase 1 — Immediate (Before Beta Invite Goes Out)

1. **C2:** REVOKE EXECUTE on `handle_new_user` from anon and authenticated roles
2. **C3:** Restrict team UPDATE/DELETE to team members only
3. **C4:** Rename `middleware.ts` → `proxy.ts`
4. **C5:** Add UNIQUE constraint to `matches(LEAST, GREATEST profile_id)`
5. **I2:** Add `idx_profiles_team_id` index
6. **I1:** Apply the `(select auth.uid())` fix to all 13 RLS policies
7. **I5:** Align profile edit validation with onboarding (optional LinkedIn, phone regex)
8. **I7:** Remove debug `console.info` logs from logout path
9. **L3:** Fix "Sign up" CTA on landing page to link to `/profile/setup`

### Phase 2 — During Closed Beta (First 2–3 Weeks)

1. **C1:** Contact data protection — decide: column-masking policy or contacts table with match-gated RLS
2. **I3:** Fix N+1 queries on matches page
3. **I4:** Remove unused nested `team_members` join from discover query; feed data to `TeammateAvatars` as a prop instead
4. **I6:** Add commitment level selector to profile edit
5. **I8:** Redirect authenticated users from `/profile/setup` in proxy
6. **L5:** Enable leaked password protection in Supabase dashboard
7. **L6:** Add poster image to landing video
8. Extract `TRACK_OPTIONS` and `getAvatarBg` to shared files
9. Add `Error Boundary` to `app/layout.tsx`

### Phase 3 — After Real User Feedback

1. Paginate discover query
2. Add account deletion flow
3. Remove `looking_for_role` column from teams
4. Drop unused `idx_profiles_available` and `idx_profiles_track` indexes
5. Tighten `profiles` SELECT RLS — at minimum require authentication
6. Replace `useState<any>` with generated Supabase types
7. Add commitment level to discover filter UX

### Phase 4 — Long-Term Cleanup / Refactor

1. Migrate from dual auth state (localStorage + Supabase) to a single React Context
2. Split `profile/edit/page.tsx` into sub-components
3. Move match enrichment logic from page to query layer
4. Add CSP headers in `next.config.ts`
5. Resolve `proxy.ts` → proper Next.js Edge Middleware pattern

---

## 12. What NOT to Touch Right Now

**Leave these alone before and during closed beta:**

| Area | Why |
|------|-----|
| Auth architecture (dual-state) | It's working. Refactoring to a Context provider before beta adds risk for zero user-visible benefit |
| Swipe/match core logic | `checkMutualMatch` + `createMatch` works correctly and has been audited multiple times |
| Discover query structure | The exclusion logic (teammates + swiped) is correct — don't touch it while fixing performance |
| `useSwipe` hook internals | The loading state machine is stable — leave it |
| The 5-step onboarding wizard | Functional and polished — don't redesign it |
| `seed.mjs` | Admin-only tool — works, not user-facing |

**Dangerous refactors to avoid before beta:**

- Do not merge `updateProfile` and `upsertProfile` into one function yet — the behavioral difference matters until types are tightened
- Do not add a global auth Context — the `getFreshUser()` pattern is ugly but correct; a Context refactor mid-beta is high-risk
- Do not normalize `looking_for_role` out of the teams table yet — the backward-compat fallback logic in `my-team` and `teams/[id]` is still needed for old rows

**Areas that are genuinely good enough for beta:**

- Middleware session protection — correct
- Logout flow — now reliable after the recent fix
- Avatar storage security — owner-scoped with `foldername` check
- Onboarding validation — solid after Phase 3 sprint
- Match contact-gating UI — works correctly with both-must-share logic
- `BottomNav` auth state — deterministic after the recent fix
- Team schema normalization — migrated and backfilled