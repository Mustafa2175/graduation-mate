# Feature Specification: Core Architecture & Stability Audit

**Feature Branch**: `001-core-stability-audit`

**Created**: 2026-05-23

**Status**: Complete

**Input**: Full system audit of TeamUp codebase — authentication, database/RLS, connections/swipe system, frontend architecture, UI/UX consistency, performance, and technical debt.

---

## Clarifications

### Session 2026-05-23
- Q: University Email Domain (.edu) Enforcement Scope → A: Configurable: allow all domains (like Gmail) for local development/testing, but enforce `.edu` in production.
- Q: Discover Pagination UX Pattern → A: Infinite Scroll: Pre-fetch next 20 profiles in background when user has 5 cards left in queue.
- Q: Team Membership Cardinality & Discovery Constraints → A: Strict Single Team (max 1 team membership enforced via UNIQUE(profile_id) on team_members; remove profiles.team_id). Being in a team does NOT block discovery, browsing, or sending/receiving collaboration requests, but does block creating or joining another team without leaving the current one first.
- Q: Discover Filters Query Execution → A: Server-side Querying (pass filters directly to Supabase queries; handles paging properly and fetches from the entire database rather than client-side memory; handles loading skeleton when filters are changed).
- Q: Testing Scope & Frameworks → A: Unit & Integration Only (configure Vitest and React Testing Library to write tests for custom hooks like useSwipe, useCurrentUser, and query helpers; defer E2E testing).

---

# Part 1: System Health Report

## 1. Authentication Architecture Audit

### Architecture Strengths
- Supabase Auth with `@supabase/ssr` is the correct modern approach
- Middleware (`proxy.ts`) correctly validates sessions server-side via `getUser()` before page render
- `LOGOUT_KEY` sentinel is a clever (if fragile) solution to the sign-out race condition where `getFreshUser()` could rehydrate localStorage during an active `signOut()` call
- `onUserChanged()` subscribes to three event sources (custom event, storage event, Supabase auth state change) — comprehensive cross-tab sync

### Issues Found

| ID | Severity | Issue | File | Line |
|----|----------|-------|------|------|
| AUTH-01 | **HIGH** | `useCurrentUser` is not a React hook — it creates new function references every call, causing `getFreshUser` to be a different reference on every render. Components that include it in dependency arrays will loop infinitely, which is why every page uses `eslint-disable react-hooks/exhaustive-deps` | [useCurrentUser.ts](file:///d:/Course/Projects/graduation-mate/hooks/useCurrentUser.ts#L60-L167) | 60-167 |
| AUTH-02 | **HIGH** | Every protected page independently calls `getFreshUser()` on mount (discover, matches, my-team, profile/edit, BottomNav). This means **5 simultaneous `supabase.auth.getUser()` network calls** fire on every navigation. No shared auth context. | Multiple pages | — |
| AUTH-03 | **MEDIUM** | `LOGOUT_KEY` sentinel persists in localStorage. If the browser crashes after `markLogoutInProgress()` but before `clearLogoutInProgress()`, the user is permanently locked out — `getFreshUser()` will always return null. | [useCurrentUser.ts](file:///d:/Course/Projects/graduation-mate/hooks/useCurrentUser.ts#L18-L31) | 18-31 |
| AUTH-04 | **MEDIUM** | `proxy.ts` lists `/profile/setup` as a public route, meaning unauthenticated users can access the setup wizard directly (though it would fail when trying to save). | [proxy.ts](file:///d:/Course/Projects/graduation-mate/proxy.ts#L38) | 38 |
| AUTH-05 | **LOW** | `clearCurrentUser` has a 10-second timeout race with `signOut()`, but the `timeoutId` is cleared in both the success path AND finally block — double-clear is harmless but indicates code uncertainty. | [useCurrentUser.ts](file:///d:/Course/Projects/graduation-mate/hooks/useCurrentUser.ts#L111-L146) | 111-146 |

---

## 2. Database & RLS Safety Audit

### Architecture Strengths
- Contact data correctly isolated in `profile_contacts` with match-gated RLS (migration 011)
- RLS uses `(select auth.uid())` pattern for performance (migration 015)
- Match uniqueness constraint prevents duplicate matches (migration 013)
- `handle_new_user` function is `SECURITY DEFINER` with REST access revoked (migration 010)
- Cascading deletes on `profile_contacts` when profile is deleted

### Issues Found

| ID | Severity | Issue | Migration/File |
|----|----------|-------|---------------|
| DB-01 | **CRITICAL** | `profiles` SELECT policy is `USING (true)` — any authenticated user can bulk-download all student names, GPAs, departments, bios, and avatar URLs. This is a **data harvesting risk**. | [006_auth_migration.sql](file:///d:/Course/Projects/graduation-mate/supabase/migrations/006_auth_migration.sql#L37-L38) |
| DB-02 | **HIGH** | `matches` INSERT policy is `WITH CHECK (auth.uid() IS NOT NULL)` — any authenticated user can create a match between ANY two profiles, not just involving themselves. A malicious user could forge matches. | [015_rls_perf_optimization.sql](file:///d:/Course/Projects/graduation-mate/supabase/migrations/015_rls_perf_optimization.sql#L88-L90) |
| DB-03 | **HIGH** | `resetSwipes` deletes ALL matches for a user (both as profile1 and profile2), plus all their swipes. This is a **destructive demo feature** left in production — a user could destroy their mutual connections. | [swipes.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/swipes.ts#L41-L48) |
| DB-04 | **MEDIUM** | No swipe rate limiting — a script could mass-swipe-right on every profile via the Supabase client. The unique constraint on swipes prevents duplicates but doesn't prevent 10,000 right-swipes in 1 second. | — |
| DB-05 | **MEDIUM** | `profiles.team_id` and `team_members` table create dual source of truth. Target design: Keep `team_members` as sole source of truth with `UNIQUE(profile_id)` to enforce single membership without blocking discovery. Remove `profiles.team_id` column. | [teams.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/teams.ts#L3-L47) |
| DB-06 | **MEDIUM** | `createMatch` performs 2 SELECT queries to check for existing matches, then an INSERT, then potentially 2 more SELECTs on `23505` conflict — up to **5 DB roundtrips** for a single match creation. | [matches.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/matches.ts#L38-L81) |
| DB-07 | **LOW** | Migration 002 (`disable_rls.sql`) was immediately superseded by 006 re-enabling RLS. Dead migration in history. | 002_disable_rls.sql |
| DB-08 | **LOW** | No email domain validation (`.edu` not enforced at DB or auth level). | — |

---

## 3. Connections / Swipe System Audit

### Architecture Strengths
- `checkMutualMatch` using `.limit(1).maybeSingle()` is efficient
- `getConnections` correctly categorizes connections into MUTUAL / INCOMING / OUTGOING
- Optimistic UI updates in `handleAccept` with proper rollback on error
- Unique constraint on swipes `(from_profile_id, to_profile_id)` prevents duplicate swipes

### Issues Found

| ID | Severity | Issue | File | Line |
|----|----------|-------|------|------|
| SWIPE-01 | **HIGH** | **No pagination on discover** — `getDiscoverProfiles` loads ALL available profiles in a single query. At 500+ users, this returns a massive payload. | [profiles.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/profiles.ts#L22-L71) | 22-71 |
| SWIPE-02 | **HIGH** | **Race condition on simultaneous right-swipes**: If User A and User B swipe right on each other at the exact same moment, both call `checkMutualMatch` → both find the other's swipe → both call `createMatch`. The `23505` conflict handling in `createMatch` catches this, but the match may be created with wrong `profile1_id`/`profile2_id` ordering. | [useSwipe.ts](file:///d:/Course/Projects/graduation-mate/hooks/useSwipe.ts#L72-L77) + [matches.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/matches.ts#L38-L81) | — |
| SWIPE-03 | **MEDIUM** | `getConnections` makes **3 DB calls** (matches, swipes, profiles) and then the `loadConnections` function in `matches/page.tsx` makes **2 additional calls per connection** (getTeamById + getTeamMembers). For 10 connections, that's 3 + 20 = **23 DB roundtrips**. | [matches.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/matches.ts#L94-L199) + [page.tsx](file:///d:/Course/Projects/graduation-mate/app/matches/page.tsx#L73-L90) | — |
| SWIPE-04 | **MEDIUM** | `outgoing` items use `matched_at: new Date().toISOString()` instead of the actual swipe timestamp, making the "sent X ago" display always show "Just now". | [matches.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/matches.ts#L175) | 175 |
| SWIPE-05 | **MEDIUM** | After accepting an invite, `loadConnections(false)` is called in background but will overwrite the optimistic state once it resolves — potential flash of stale data if the DB hasn't propagated yet. | [page.tsx](file:///d:/Course/Projects/graduation-mate/app/matches/page.tsx#L158) | 158 |
| SWIPE-06 | **LOW** | `resetSwipes` is a demo feature that deletes real match data — should be removed or gated behind a dev flag before beta. | [swipes.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/swipes.ts#L41-L48) | 41-48 |

---

## 4. Frontend Architecture Audit

### Architecture Strengths
- Clean file structure: route-based pages, separated components, query modules, typed hooks
- Zod validation on forms with react-hook-form integration
- Consistent use of loading skeletons, error states, and empty states across pages
- Utility functions properly centralized in `lib/utils.ts` (cn, getInitials, getTrackBadge)

### Issues Found

| ID | Severity | Issue | File | Lines |
|----|----------|-------|------|-------|
| FE-01 | **HIGH** | **No global Error Boundary** — any unhandled JS error crashes the entire app to a white screen. | [layout.tsx](file:///d:/Course/Projects/graduation-mate/app/layout.tsx) | — |
| FE-02 | **HIGH** | `getAvatarBg` duplicated **4 times** with slightly different color arrays — same person renders different colors on different pages. | matches/page.tsx:27, my-team/page.tsx:30, teams/[id]/page.tsx:10, ProfileCard.tsx:22 | — |
| FE-03 | **HIGH** | `useState<any>` used in **9 places** across 4 files — disables TypeScript safety for match, team, and teammate data. | matches/page.tsx:52-54, my-team/page.tsx:54-55, profile/edit/page.tsx:145-146, teams/[id]/page.tsx:33-34 | — |
| FE-04 | **MEDIUM** | `eslint-disable react-hooks/exhaustive-deps` on **5 files** — masks genuine dependency bugs in useEffect hooks. Root cause: `useCurrentUser` returns new references every render (AUTH-01). | discover, matches, my-team, profile/edit, BottomNav | — |
| FE-05 | **MEDIUM** | `profile/edit/page.tsx` is the largest file (~789 lines) — handles avatar upload, form editing, team CRUD, skill management, and logout. Should be decomposed into 4-5 sub-components. | [page.tsx](file:///d:/Course/Projects/graduation-mate/app/profile/edit/page.tsx) | — |
| FE-06 | **MEDIUM** | `matches/page.tsx` (404 lines) embeds the entire team-enrichment business logic, rendering logic for 3 tab types, and both accept/decline handlers. | [page.tsx](file:///d:/Course/Projects/graduation-mate/app/matches/page.tsx) | — |
| FE-07 | **LOW** | `useRef<any[]>([])` for swipe card refs in discover page — should be typed to the actual card API. | [page.tsx](file:///d:/Course/Projects/graduation-mate/app/discover/page.tsx#L24) | 24 |
| FE-08 | **LOW** | `timeAgo` function in matches/page.tsx is a local utility that should be extracted to `lib/utils.ts`. | [page.tsx](file:///d:/Course/Projects/graduation-mate/app/matches/page.tsx#L32-L46) | 32-46 |

---

## 5. UI/UX Consistency Audit

### Architecture Strengths
- Coherent design system with Instrument Serif + Inter font pairing
- Custom glassmorphism utilities (`.liquid-glass`, `.light-glass`) are well-crafted
- Atmospheric background animation adds life without distraction
- `prefers-reduced-motion` is handled for animations AND videos
- Bottom nav uses `pb-safe` for safe area padding on notched devices

### Issues Found

| ID | Severity | Issue | Detail |
|----|----------|-------|--------|
| UI-01 | **MEDIUM** | No dark mode support — only light theme defined in `:root`. | globals.css |
| UI-02 | **MEDIUM** | Video backgrounds have no `poster` fallback — users with `prefers-reduced-motion` see `display: none` instead of a static image. | Landing + Login pages |
| UI-03 | **MEDIUM** | Zero ARIA labels on interactive elements — no keyboard navigation, no screen reader support. | All components |
| UI-04 | **MEDIUM** | Color values are mixed between CSS variables (`var(--color-brand)`) and hardcoded Tailwind classes (`bg-violet-500`, `text-gray-900`). Inconsistent sourcing. | Across all pages |
| UI-05 | **LOW** | Spacing is generally consistent but some pages use `p-6` while others use `p-4 sm:p-6` — minor inconsistency. | discover vs matches |
| UI-06 | **LOW** | No responsive breakpoint below 375px tested — some card layouts may clip on 320px screens. | — |

---

## 6. Performance Audit

### Issues Found

| ID | Severity | Issue | Impact |
|----|----------|-------|--------|
| PERF-01 | **CRITICAL** | **N+1 queries on Connections page**: Each connection triggers 2 extra queries (`getTeamById` + `getTeamMembers`). 10 connections = 23 total DB calls. 50 connections = 103 calls. | Exponential slowdown |
| PERF-02 | **HIGH** | **No discover pagination**: All available profiles loaded at once. At 500 users (minus swiped), this could return 400+ profile objects with nested team_members. | Large payload, slow render |
| PERF-03 | **HIGH** | **`getFreshUser()` called 5x per navigation**: Every protected page + BottomNav calls `getFreshUser()` independently. Each call triggers `supabase.auth.getUser()` (network roundtrip). | ~500-1500ms wasted per page |
| PERF-04 | **MEDIUM** | All pages are `"use client"` — no Server Components leveraged for initial data fetching. Every page hydrates client-side then fetches. | Slower initial paint |
| PERF-05 | **MEDIUM** | Background videos (~2-5MB) have no lazy loading or preloading strategy. Landing page video starts downloading immediately even if user navigates away. | Bandwidth waste |
| PERF-06 | **LOW** | `TypingMessages` array in landing page creates new reference every render (defined inline). | Minor rerender |

### Scaling Projections

| Scale | Status | Bottleneck |
|-------|--------|------------|
| **50 users** | ✅ Works fine | No issues |
| **200 users** | ⚠️ Noticeable lag | Connections page N+1 queries start to hurt (40+ DB calls) |
| **500 users** | ❌ Degraded | Discover payload too large (400+ profiles), swipes table grows to ~125K rows |
| **1,000 users** | ❌ Broken UX | Connections page takes 5-10s to load, discover payload exceeds 1MB |
| **10,000 users** | ❌ Unusable | Everything breaks without pagination, caching, and query optimization |

---

## 7. Technical Debt Audit

### Console Statements in Production Code
- **17 `console.error` calls** across 7 files (hooks, pages, queries)
- **0 `console.log`** (good)
- **0 `console.info`** (good — previously cleaned)

### ESLint Suppressions
- **5 `eslint-disable react-hooks/exhaustive-deps`** across discover, matches, my-team, profile/edit, BottomNav

### Type Safety Gaps
- **9 `useState<any>`** across 4 files
- `updateTeamDetails(teamId: string, updates: any)` in [teams.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/teams.ts#L88)
- `getTeamMembers` returns `data?.map((d: any) => d.profiles)` in [teams.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/teams.ts#L76)

### Code Duplication
- `getAvatarBg`: 4 copies (matches/page, my-team/page, teams/[id]/page, ProfileCard)
- `TRACK_OPTIONS`: duplicated between profile/edit and StepTrack
- `resolveProfileContacts` pattern: similar flattening logic in profiles.ts and matches.ts

### Stale/Dead Code
- Migration `002_disable_rls.sql` — immediately reversed by 006
- `resetSwipes` — demo-only feature that destroys production data
- `looking_for_role` on `teams` table — superseded by `project_description`, `project_technologies`, `roles_needed`

---

# Part 2: Stability Risk Matrix

| ID | Issue | Severity | Probability | User Impact | Fix Complexity | Priority |
|----|-------|----------|-------------|-------------|---------------|----------|
| DB-02 | Match INSERT policy allows forging | CRITICAL | Low | High — fake matches | Low | **Immediate** |
| DB-01 | Profiles SELECT open to all | CRITICAL | High | High — data harvesting | Low | **Immediate** |
| PERF-01 | N+1 queries on Connections | HIGH | Certain at scale | High — page unusable | Medium | **Pre-Beta** |
| AUTH-01 | useCurrentUser not a real hook | HIGH | Already happening | Medium — eslint hacks | Medium | **Pre-Beta** |
| AUTH-02 | 5x getFreshUser per navigation | HIGH | Every page load | Medium — latency | Medium | **Pre-Beta** |
| FE-01 | No Error Boundary | HIGH | Any JS error | High — white screen | Low | **Immediate** |
| DB-03 | resetSwipes destroys data | HIGH | User clicks button | High — data loss | Low | **Immediate** |
| SWIPE-01 | No discover pagination | HIGH | 500+ users | High — broken UX | Medium | **Pre-Beta** |
| FE-02 | getAvatarBg duplicated 4x | MEDIUM | Every render | Low — visual inconsistency | Low | **Pre-Beta** |
| FE-03 | useState\<any\> in 9 places | MEDIUM | Any refactor | Medium — type errors | Low | **Pre-Beta** |
| DB-05 | Dual source of truth (team_id) | MEDIUM | Team operations | Medium — data inconsistency | Medium | **Post-Beta** |
| AUTH-03 | LOGOUT_KEY crash lockout | MEDIUM | Browser crash during logout | High — permanent lockout | Low | **Pre-Beta** |
| UI-03 | Zero accessibility | MEDIUM | Always | Medium — excludes users | Medium | **Post-Beta** |

---

# Part 3: Refactor Recommendations

### R1. Fix Match INSERT RLS Policy *(Immediate — Low effort)*
**Why**: Any authenticated user can forge matches between arbitrary profiles.
**Fix**: Change `WITH CHECK (auth.uid() IS NOT NULL)` to `WITH CHECK ((select auth.uid()) = profile1_id OR (select auth.uid()) = profile2_id)`.
**Risk**: Low — single SQL migration.

### R2. Add Error Boundary *(Immediate — Low effort)*
**Why**: A single JS error crashes the entire app to white screen.
**Fix**: Create `app/error.tsx` and `app/global-error.tsx` following Next.js conventions.
**Risk**: None.

### R3. Remove/Gate resetSwipes *(Immediate — Low effort)*
**Why**: Users can accidentally destroy all their matches and swipe history.
**Fix**: Remove the "Reset Queue" button from production, or gate behind `process.env.NODE_ENV === 'development'`.
**Risk**: None.

### R4. Convert useCurrentUser to React Context *(Pre-Beta — Medium effort)*
**Why**: Eliminates 5x redundant `getUser()` calls per navigation, fixes the root cause of all `eslint-disable` suppressions, and provides a single source of auth truth.
**Fix**: Create `AuthProvider` context in `layout.tsx`, call `getFreshUser()` once, share via context.
**Risk**: Low — all consumers switch from `useCurrentUser()` to `useAuth()`.

### R5. Fix N+1 on Connections Page *(Pre-Beta — Medium effort)*
**Why**: 23+ DB calls per page load at current scale, will be 100+ at beta.
**Fix**: Include team data in the `getConnections` Supabase query using relation joins, or batch-fetch all unique team_ids in a single query.
**Risk**: Low — query restructuring only.

### R6. Add Discover Pagination *(Pre-Beta — Medium effort)*
**Why**: Loading all profiles at once breaks at 500+ users.
**Fix**: Implement cursor-based pagination with Infinite Scroll (load 20 profiles at a time, pre-fetch next batch in background when user has 5 cards left).
**Risk**: Low-Medium — needs careful coordination with react-tinder-card state to prevent flashes/flickering.

### R7. Consolidate getAvatarBg *(Pre-Beta — Low effort)*
**Why**: Same person shows different avatar colors on different pages.
**Fix**: Move to `lib/utils.ts` with a single canonical color array.
**Risk**: None.

### R8. Add LOGOUT_KEY Expiry *(Pre-Beta — Low effort)*
**Why**: Browser crash during logout permanently locks user out.
**Fix**: Store timestamp with LOGOUT_KEY, auto-clear if older than 30 seconds.
**Risk**: None.

### R9. Type-safe useState *(Post-Beta — Low effort)*
**Why**: 9 `any` holes disable TypeScript protection.
**Fix**: Define `ConnectionItem`, `TeamWithMembers` interfaces, replace `useState<any>`.
**Risk**: None.

### R10. Restrict Profiles SELECT Policy *(Post-Beta — Medium effort)*
**Why**: Prevents bulk data harvesting of student info.
**Fix**: Restrict to only authenticated users who haven't been blocked, or limit selected fields.
**Risk**: Medium — needs careful testing to ensure discover still works.

---

# Part 4: Scalability Readiness Assessment

| Milestone | Readiness | Blocking Issues |
|-----------|-----------|-----------------|
| **MVP Demo** (50 users) | ✅ Ready | None — works today |
| **Campus Beta** (200-500 users) | ⚠️ Partially Ready | PERF-01 (N+1), SWIPE-01 (no pagination), DB-02 (match forging), DB-03 (resetSwipes) |
| **Multi-Campus** (1,000+ users) | ❌ Not Ready | All above + AUTH-02 (5x getUser), PERF-04 (no SSR), need caching layer |

### Likely Bottlenecks at Scale
1. **Connections page query explosion** — first thing that breaks at 200+ users
2. **Discover payload size** — breaks at 500+ profiles
3. **Supabase connection pooling** — 5 getUser() calls per navigation × 200 concurrent users = 1,000 concurrent connections
4. **Swipes table growth** — N² growth (500 users = 250K potential swipes)

---

# Part 5: Product Consistency Audit

### Verdict: **One coherent product with 3 minor stitching seams**

TeamUp genuinely feels like a unified consumer product. The visual language (glassmorphism, atmospheric backgrounds, Instrument Serif headings) is consistent. The navigation flow (discover → connections → my-team → profile) is logical.

### Stitching Seams Identified

1. **Avatar color inconsistency**: The same person's avatar shows different background colors across discover, connections, and team pages due to `getAvatarBg` duplication with different algorithms.

2. **Connections page design language**: The connections page uses a more "app-like" card grid layout, while discover uses a Tinder-style stacked card interface. The visual transition between these two is slightly jarring — the card styling, spacing, and information density differ noticeably.

3. **Landing page vs app pages**: The cinematic landing page (dark, video-heavy, liquid-glass) and the functional app pages (light, card-based, Aethera style) feel like two different design eras. This is intentional (marketing vs product) but the transition on login could be smoother.

### What Feels Unified
- Typography pairing is consistent throughout
- Bottom navigation is clean and predictable
- Loading/error/empty states follow the same pattern across all pages
- Brand color (`--color-brand: #0871E7`) is used consistently

---

# Part 6: Action Roadmap

## 🔴 Immediate (Before any new features)

- [ ] **Fix match INSERT RLS** — prevent match forging (R1)
- [ ] **Add Error Boundary** — prevent white screen crashes (R2)
- [ ] **Remove/gate resetSwipes** — prevent accidental data destruction (R3)
- [ ] **Add LOGOUT_KEY expiry** — prevent permanent lockout on crash (R8)

> Estimated effort: 1-2 hours total. All are single-file, low-risk changes.

## 🟡 Pre-Beta (Required before real student rollout)

- [ ] **Convert useCurrentUser to AuthContext** — eliminates 5x redundant auth calls, fixes all eslint-disable issues (R4)
- [ ] **Fix N+1 on Connections page** — batch team data fetching (R5)
- [ ] **Add discover pagination** — cursor-based, 20 profiles per batch (R6)
- [ ] **Consolidate getAvatarBg to lib/utils.ts** — single source of truth (R7)
- [ ] **Restrict profiles SELECT policy** — prevent data harvesting (R10)
- [ ] **Remove console.error from production** — replace with proper error reporting or silent handling

> Estimated effort: 3-5 days for a single developer. Can be parallelized across 2-3 developers.

## 🟢 Post-Beta (After live feedback)

- [ ] **Type-safe useState** — replace 9 `any` holes with proper interfaces (R9)
- [ ] **Decompose profile/edit page** — split 789-line file into sub-components
- [ ] **Decompose matches/page** — extract team-enrichment logic to query layer
- [ ] **Add accessibility** — ARIA labels, keyboard navigation, screen reader testing
- [ ] **Implement dark mode** — extend CSS variables with `prefers-color-scheme`
- [ ] **Add discover filters** — filter by track, skills, GPA range (server-side database querying integrated with infinite scroll pagination)
- [ ] **Resolve dual team_id source of truth** — remove `profiles.team_id`, use `team_members` with `UNIQUE(profile_id)` to enforce strict single membership (does not block discovery/requests, blocks joining/creating new team)

> Estimated effort: 2-3 weeks spread across post-beta iterations.

## 🔵 Future Scale (Only when growth justifies)

- [ ] **Server Components** — migrate read-heavy pages to SSR for faster initial paint
- [ ] **Swipe rate limiting** — Postgres function or Edge Function throttle
- [ ] **Email domain enforcement** — Configurable `.edu` validation on signup (disabled in dev, enforced in production)
- [ ] **Match notification system** — real-time via Supabase Realtime or email
- [ ] **Account deletion flow** — GDPR-compliant cascade delete
- [ ] **PWA support** — service worker for offline capability

---

## Assumptions

- The current Supabase project tier is sufficient for beta (no connection pool limits hit yet)
- The 16 migrations reflect the actual live database state
- The `ui-identity-polish` branch represents the latest codebase
- Video background assets are hosted alongside the app (not on a CDN)
- The target beta deployment is a single university campus (200-500 students)
