# TeamUp — Complete Product & UI/UX Audit

---

## 1. CRITICAL Issues (Must Fix Before Any Real User Touches This)

---

### 1.1 🔴 Plaintext Passwords Stored in Database
**Files:** [001_initial_schema.sql](file:///d:/Course/Projects/graduation-mate/supabase/migrations/001_initial_schema.sql#L18), [profiles.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/profiles.ts#L5-L12), [types/index.ts](file:///d:/Course/Projects/graduation-mate/types/index.ts#L12)

**Why it matters:** Passwords are stored as raw text in the `profiles` table (`password text NOT NULL`). The login function does a plain `.eq('password', password)` check. If anyone gains read access to this table — or if Supabase leaks — every user's password is exposed. This is the single most dangerous issue in the project.

**Fix:** Migrate to Supabase Auth (email+password via `auth.users`). Remove the `password` column entirely.

---

### 1.2 🔴 Row Level Security is Completely Disabled
**File:** [002_disable_rls.sql](file:///d:/Course/Projects/graduation-mate/supabase/migrations/002_disable_rls.sql)

**Why it matters:** Every table has `DISABLE ROW LEVEL SECURITY`. This means **any anonymous visitor** with the public `anon` key can read, update, and delete **every row** in every table — profiles, matches, teams, swipes, passwords. A student could trivially:
- Read all passwords
- Delete all profiles
- Swipe as someone else
- Forge matches

**Fix:** Enable RLS on all tables. Add policies scoped to `auth.uid()` after migrating to Supabase Auth.

---

### 1.3 🔴 Storage Bucket is Fully Open (Anyone Can Upload/Delete Any Avatar)
**File:** [005_storage_setup.sql](file:///d:/Course/Projects/graduation-mate/supabase/migrations/005_storage_setup.sql)

**Why it matters:** The avatar storage bucket allows **public insert, update, and delete** for any user. Anyone can overwrite another student's avatar with anything — including inappropriate content. There is zero abuse protection.

**Fix:** Restrict upload/update/delete policies to `auth.uid() = (path extracted from filename)`.

---

### 1.4 🔴 Auto-Mutual Swipe Fakes Every Match
**File:** [useSwipe.ts](file:///d:/Course/Projects/graduation-mate/hooks/useSwipe.ts#L50-L53)

```typescript
// Automatically simulate a return swipe right from the mock profile to create a match
await insertSwipe(profile.id, pid, 'RIGHT')
```

**Why it matters:** When you swipe right, the system **immediately inserts a fake right-swipe from the other person back to you**, then declares a "match." This means **every right-swipe creates an instant match**. The entire matching concept is a lie. Real users will figure this out in 30 seconds ("I matched with literally everyone I swiped on?") and lose trust in the product.

**Fix:** Remove the auto-swipe line. A match should only occur when **two separate users** independently swipe right on each other. For demo purposes, have a few seeded profiles that auto-swipe back — but don't do it for every profile.

---

### 1.5 🔴 Login Uses Name, Not Email — No Uniqueness Guarantee
**File:** [profiles.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/profiles.ts#L5-L12)

**Why it matters:** Login authenticates by `full_name` + `password`. There is no `UNIQUE` constraint on `full_name` in the schema. Two users named "Ahmed Ali" would collide — the query uses `.single()` which crashes if multiple rows match. There is also no email field for account recovery.

**Fix:** Use email as the identity key via Supabase Auth.

---

### 1.6 🔴 "Session" is Just localStorage — No Real Authentication
**File:** [useCurrentUser.ts](file:///d:/Course/Projects/graduation-mate/hooks/useCurrentUser.ts)

**Why it matters:** The entire auth system stores `{profileId, fullName}` in localStorage. Any user can open DevTools, change the `profileId` to someone else's UUID, and fully impersonate them — swipe as them, see their matches, join their teams, edit their profile. There is zero verification that the person making requests is who they claim to be.

**Fix:** Replace with Supabase Auth sessions using `@supabase/ssr`.

---

## 2. IMPORTANT Issues (Should Fix Before Launch)

---

### 2.1 🟠 Track Enum Mismatch — Cards Show "Other" for Everything
**Files:** [utils.ts](file:///d:/Course/Projects/graduation-mate/lib/utils.ts#L19-L35) vs [StepTrack.tsx](file:///d:/Course/Projects/graduation-mate/app/profile/setup/steps/StepTrack.tsx#L11-L62)

**Why it matters:** The `TRACK_LABELS` map in utils.ts defines keys like `AI`, `DATA_SCIENCE`, `CYBERSECURITY`, `WEB_DEV`, `MOBILE_DEV`, `OTHER`. But StepTrack.tsx saves free-text strings like `"Artificial Intelligence"`, `"Data Science"`, `"Cybersecurity"`. Since `"Artificial Intelligence" !== "AI"`, the ProfileCard falls through to `OTHER` for every user. Every discover card shows the gray "Other" badge — completely useless.

**Fix:** Either:
- (A) Map the free-text track values back to the enum keys before saving, or
- (B) Update `TRACK_LABELS` / `TRACK_COLORS` to use the full track strings as keys.

---

### 2.2 🟠 Seed Data Inserts Profiles Without Auth Users
**File:** [seed.mjs](file:///d:/Course/Projects/graduation-mate/seed.mjs)

**Why it matters:** The seed script inserts profiles directly with plaintext passwords. Once you move to Supabase Auth, these will all break — profiles won't have matching `auth.users` rows, and RLS policies based on `auth.uid()` will block access.

**Fix:** Update seed script to create auth users via `supabase.auth.admin.createUser()` and let the trigger populate profiles.

---

### 2.3 🟠 No Duplicate Profile Prevention
**File:** [profiles.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/profiles.ts#L62-L71)

**Why it matters:** The `upsertProfile` function calls `supabase.from('profiles').upsert(profile)` — but if no `id` is provided (like during signup), it always creates a new row. There's no check for existing names/emails. A user can click "Create Profile" 50 times and get 50 duplicate profiles in the discover feed.

**Fix:** After moving to Supabase Auth, the trigger ensures exactly one profile per `auth.users` row. The setup wizard should update the existing profile, not create a new one.

---

### 2.4 🟠 Team "Join" Mechanism Uses Profile ID — Confusing UX
**File:** [teams.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/teams.ts#L24-L47)

**Why it matters:** To join a team, you must paste a **teammate's Profile UUID** (not a Team ID). The placeholder says `"Teammate's Profile ID"` in the profile/edit page, but the invitation token in `/my-team` shows the **Team ID**. These are completely different UUIDs. A user who copies their team's invitation token and shares it will find it doesn't work in the join field.

Meanwhile the `joinTeam()` function does `supabase.from('profiles').select('team_id').eq('id', targetProfileIdToJoin)` — it looks up the target **profile's** team_id. So if someone pastes a team ID into that field, it fails silently.

**Fix:** Standardize on Team ID for joining. Change `joinTeam()` to accept a team UUID directly.

---

### 2.5 🟠 Onboarding "Team Member" Path Collects Invite Code but Never Uses It
**File:** [StepTeamSize.tsx](file:///d:/Course/Projects/graduation-mate/app/profile/setup/steps/StepTeamSize.tsx#L201)

**Why it matters:** When a user selects "Team Member (Already in a Team)" during onboarding, they're asked for a "Team Invite Code" and "My Role." But when the form submits, these values are **never passed to `onNext()`** — the `teamInviteCode` is discarded. The user thinks they joined a team, but nothing happened.

**Fix:** In `handleSubmit`, if `collaborationStatus === 'member'`, call `joinTeam(teamInviteCode, profileId)` to actually join.

---

### 2.6 🟠 `resetSwipes` Deletes Swipes but Not Associated Matches
**File:** [swipes.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/swipes.ts#L35-L40)

**Why it matters:** "Reset Queue & Swipe Again" deletes all swipe records but leaves the fake matches intact. So after reset, previously matched profiles reappear in discover. The user swipes right again, creating **duplicate matches**. The matches page accumulates duplicates.

**Fix:** Also delete matches when resetting, or deduplicate matches on insert.

---

### 2.7 🟠 Landing Page Hides the BottomNav — But Also Has No Way to Navigate In
**Files:** [BottomNav.tsx](file:///d:/Course/Projects/graduation-mate/components/ui/BottomNav.tsx#L21), [page.tsx](file:///d:/Course/Projects/graduation-mate/app/page.tsx)

**Why it matters:** The landing page `/` is a full-viewport cinematic experience with a fixed overlay (`fixed inset-0 z-[100]`). This covers the entire viewport and creates a `z-index: 100` stacking context. The bottom nav is at `z-50`, so it's hidden underneath. But the only CTA goes to `/login`. There's no way for a logged-in user who somehow lands on `/` to navigate back to `/discover` — they have to manually type the URL.

**Fix:** Either redirect authenticated users from `/` to `/discover`, or show the BottomNav on the landing page when logged in.

---

### 2.8 🟠 No Logout Functionality
**Files:** All pages, [BottomNav.tsx](file:///d:/Course/Projects/graduation-mate/components/ui/BottomNav.tsx)

**Why it matters:** There is no logout button anywhere in the app. Once logged in, a user cannot sign out. `clearCurrentUser()` exists in the hook but is never called from any UI. If a user wants to switch accounts or log out on a shared computer, they must manually clear localStorage.

**Fix:** Add a logout button in the profile/edit page or the BottomNav.

---

### 2.9 🟠 `looking_for_role` Column Overloaded with JSON
**Files:** [my-team/page.tsx](file:///d:/Course/Projects/graduation-mate/app/my-team/page.tsx#L78-L94), [teams/[id]/page.tsx](file:///d:/Course/Projects/graduation-mate/app/teams/%5Bid%5D/page.tsx#L52-L61)

**Why it matters:** The team's `looking_for_role` text column is being used to store serialized JSON (`{ description, technologies, rolesNeeded }`). Multiple places use `JSON.parse()` wrapped in try/catch with fallback. This is fragile — the team detail page tries to parse the JSON but falls back silently, potentially showing "Looking for a `{\"description\":...}`" as the subtitle text at line 197.

**Fix:** Add proper columns (`project_description`, `project_technologies`, `roles_needed`) to the teams table instead of overloading a text field.

---

### 2.10 🟠 Contact Details Visible on Swipe Cards (Bypasses Gated Contacts)
**File:** [ProfileCard.tsx](file:///d:/Course/Projects/graduation-mate/components/profile/ProfileCard.tsx#L180-L204)

**Why it matters:** The `ProfileCard` component has a `showActions` prop that renders WhatsApp and LinkedIn buttons directly. While it's `false` during swiping, the **bio text often contains contact information** (e.g., "Contact me at..."). More importantly, the profile data including `whatsapp_number` and `linkedin_url` is **sent to the client** via the discover query (since RLS is off). A technically savvy user can open the Network tab and read everyone's contact info without matching, defeating the entire gated contacts feature.

**Fix:** Exclude sensitive fields (`whatsapp_number`, `linkedin_url`) from the discover profiles query. Only include them in the matches query.

---

## 3. MINOR Issues

---

### 3.1 🟡 LinkedIn URL Required in Signup — Blocks Many Students
**File:** [StepSocial.tsx](file:///d:/Course/Projects/graduation-mate/app/profile/setup/steps/StepSocial.tsx#L13)

**Why it matters:** LinkedIn URL is validated as required (`z.string().url()`). Many freshman/sophomore students don't have LinkedIn. This blocks them from completing signup.

**Fix:** Make LinkedIn optional: `z.string().url().optional().or(z.literal(''))`.

---

### 3.2 🟡 No Input Validation on WhatsApp Number Format
**File:** [StepSocial.tsx](file:///d:/Course/Projects/graduation-mate/app/profile/setup/steps/StepSocial.tsx#L14)

**Why it matters:** The validation is just `z.string().min(1)`. Users can type "my number is blah" and it passes. Later, the WhatsApp link `https://wa.me/` will break.

**Fix:** Add a regex pattern: `z.string().regex(/^\+?\d{7,15}$/, 'Invalid phone number format')`.

---

### 3.3 🟡 `getAvatarBg()` Duplicated in 4 Files
**Files:** [ProfileCard.tsx](file:///d:/Course/Projects/graduation-mate/components/profile/ProfileCard.tsx#L22-L26), [TeammateAvatars.tsx](file:///d:/Course/Projects/graduation-mate/components/profile/TeammateAvatars.tsx#L23-L26), [my-team/page.tsx](file:///d:/Course/Projects/graduation-mate/app/my-team/page.tsx#L25-L40), [teams/[id]/page.tsx](file:///d:/Course/Projects/graduation-mate/app/teams/%5Bid%5D/page.tsx#L10-L25), [matches/page.tsx](file:///d:/Course/Projects/graduation-mate/app/matches/page.tsx#L16-L27)

**Why it matters:** Five different implementations of avatar background color generation, using different algorithms and color palettes. The same person gets different colors on different pages.

**Fix:** Extract to `lib/utils.ts` as a single shared utility.

---

### 3.4 🟡 `TeammateAvatars` Fires a Supabase Query Per Card in Discover
**File:** [TeammateAvatars.tsx](file:///d:/Course/Projects/graduation-mate/components/profile/TeammateAvatars.tsx#L35-L49)

**Why it matters:** Every profile card in the discover stack triggers a separate Supabase fetch for teammate avatars. With 10 profiles loaded, that's 10 extra DB queries — slowing initial load and burning through Supabase free tier limits.

**Fix:** The discover query in `profiles.ts` already joins `team_members(profiles(...))`. Pass the pre-fetched data through as a prop instead of re-fetching.

---

### 3.5 🟡 `commitment_level` Hardcoded to `'MEDIUM'` on Signup
**File:** [setup/page.tsx](file:///d:/Course/Projects/graduation-mate/app/profile/setup/page.tsx#L85)

**Why it matters:** The onboarding never asks for commitment level, but it's shown on every ProfileCard as a badge. Every user shows "Medium commitment" — the badge adds visual noise without information.

**Fix:** Either add commitment selection to the wizard, or remove the badge from ProfileCard until it's meaningful.

---

### 3.6 🟡 No Back-Navigation Protection on Multi-Step Wizard
**File:** [setup/page.tsx](file:///d:/Course/Projects/graduation-mate/app/profile/setup/page.tsx)

**Why it matters:** If a user is on Step 4 and accidentally refreshes the browser or hits the physical back button, all wizard state is lost. They restart from Step 1 with empty fields.

**Fix:** Persist draft state in `sessionStorage` or `localStorage` and restore on mount.

---

### 3.7 🟡 Match Count Not Shown on BottomNav
**File:** [BottomNav.tsx](file:///d:/Course/Projects/graduation-mate/components/ui/BottomNav.tsx)

**Why it matters:** Users have no visual indicator that they have new matches. Without a badge/counter on the "Matches" tab, they have to actively check. This reduces engagement.

**Fix:** Add an unread match count badge (a red dot or number) on the Heart icon.

---

### 3.8 🟡 Swipe Card Height Fixed to Container — Bio Gets Truncated Badly on Small Screens
**File:** [discover/page.tsx](file:///d:/Course/Projects/graduation-mate/app/discover/page.tsx#L77)

**Why it matters:** The swipe area has `min-h-[360px]` with `absolute inset-0` positioning. On small phones (320px width), the profile card overflows or gets severely clipped. Skills, bio, and team status become invisible.

**Fix:** Make the card scrollable within its container, or simplify the card to show only essential info (name, track, 3 skills, GPA).

---

## 4. Summary Tables

---

### 🚨 Must Fix Before Launch

| # | Issue | Severity |
|---|-------|----------|
| 1 | Plaintext passwords in DB | Critical |
| 2 | RLS completely disabled — entire DB is public | Critical |
| 3 | Storage bucket allows unrestricted uploads/deletes | Critical |
| 4 | Auto-mutual-swipe fakes every match | Critical |
| 5 | Login by name with no uniqueness constraint | Critical |
| 6 | localStorage "auth" — trivial impersonation | Critical |
| 7 | Track enum mismatch — all cards show "Other" | Important |
| 8 | Join team uses wrong ID type (Profile vs Team) | Important |
| 9 | Team invite code collected in onboarding but discarded | Important |
| 10 | No logout button anywhere | Important |
| 11 | Contact info exposed in discover API response | Important |

---

### ⏳ Can Wait Until Later

| # | Issue |
|---|-------|
| 1 | LinkedIn URL should be optional |
| 2 | WhatsApp number format validation |
| 3 | Avatar color function duplication |
| 4 | TeammateAvatars re-fetches per card |
| 5 | Match count badge on BottomNav |
| 6 | Wizard state lost on browser refresh |
| 7 | Swipe card mobile overflow |

---

### 🗑️ Unnecessary Complexity to Remove

| # | What | Why |
|---|------|-----|
| 1 | `commitment_level` hardcoded to MEDIUM | Never asked, always shows same badge — visual noise |
| 2 | `looking_for_role` JSON hack in teams | Should be separate columns; current approach causes bugs in team detail subtitle |
| 3 | `resetSwipes` feature | In a real product, swipe history should be permanent. Reset is a demo crutch that creates duplicate matches |
| 4 | Landing page video from CloudFront CDN | External video dependency slows load; replace with static hero image or remove for MVP |
| 5 | `team_size_needed` column on profiles | Team size is a team-level concept, not a per-profile field; causes confusion in team detail page where `max()` is taken across members |

---

### 💎 Most Valuable Improvements (After Fixing Critical Issues)

| # | Improvement | Impact |
|---|-------------|--------|
| 1 | **Migrate to Supabase Auth** — solves issues 1, 2, 5, 6 in one move | Foundational |
| 2 | **Fix track enum mapping** — instantly makes discover cards useful | High |
| 3 | **Standardize join-team on Team ID** — makes invitation flow actually work | High |
| 4 | **Add filter/search to discover** — students want to filter by department/track/skills | High |
| 5 | **Email notifications on match** — students won't check the app constantly | Medium |
| 6 | **Show match confirmation animation** — satisfying feedback on mutual interest | Medium |

---

## 5. Overall Launch Readiness Score

# 3 / 10

> [!CAUTION]
> **Do not launch this to real students in its current state.** The security model is nonexistent — plaintext passwords, no RLS, no real authentication. Any student with basic DevTools knowledge can impersonate others, read all data, and delete profiles. The fake auto-matching system will immediately destroy user trust. The track badge bug means the discover experience is broken on first use.

> [!TIP]
> **The good news:** The UI design, component architecture, and product vision are genuinely strong. The onboarding wizard is well thought out. The gated contacts concept is a smart differentiator. The codebase is clean and well-organized. With 2-3 focused days of work on Supabase Auth migration + the Important fixes, this could be a solid 7/10 and ready for a limited beta.

### Recommended Priority Order:
1. Supabase Auth migration (kills 6 critical issues at once)
2. Enable RLS with proper policies
3. Fix track enum mismatch
4. Remove auto-mutual-swipe
5. Fix join-team ID mismatch
6. Add logout button
7. Exclude contact fields from discover query
