# TeamUp — Parallel Developer Tasklist (3-Developer Split)

This updated tasklist distributes tasks across 3 roles working in parallel to minimize merge conflicts and accelerate development.

---

## 👥 Roles & Division of Labor

* **Developer 1 (Dev 1): Backend, Security, & Queries**
  * *Focus*: Database schema migrations, RLS policies, query optimization (N+1 fixes), API pagination, and security headers.
* **Developer 2 (Dev 2): Frontend Logic, Refactoring, & Quality Assurance**
  * *Focus*: Decomposing large page components, removing duplicate utility code, fixing TypeScript `any` type holes, and setting up testing frameworks (Vitest).
* **Developer 3 (User): Design System, UI Refinement, & Styling**
  * *Focus*: CSS transitions, glassmorphic themes, responsive layout polishing, asset size optimization (videos/images), commitment UI design, and discover filter aesthetics.

---

## 🚦 Parallel Collaboration Guidelines (Conflict Prevention)
To prevent Git merge conflicts while editing in parallel:
1. **File Separation**: Dev 2 will refactor logic in components, while Dev 3 works primarily in CSS variables (`app/globals.css`) and design primitives/styling attributes.
2. **Database Schema Stability**: Dev 1 will write isolated migrations under `supabase/migrations/` rather than modifying existing migration files.
3. **Props Contracts**: Before Dev 2 refactors components, Dev 2 and Dev 3 should agree on component props (e.g., for filters or avatar grids) so styling and logic can progress independently.

---

## 🛠️ Developer 1 (Backend, Security, & Queries)

### Phase 1: Performance & Access Control (High Priority)
- [ ] **Fix Matches Page N+1 Queries**
  * *Description*: Optimize query structure in `lib/queries/matches.ts` to prefetch team and member details using Postgres relations instead of lazy fetching.
  * *Target Files*: [matches.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/matches.ts)
- [ ] **Fix Discover Teammate Query N+1**
  * *Description*: Update discover queries so that teammate profiles are prefetched in the main query rather than loaded individually per card.
  * *Target Files*: [TeammateAvatars.tsx](file:///d:/Course/Projects/graduation-mate/components/profile/TeammateAvatars.tsx), [profiles.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/profiles.ts)
- [ ] **Secure Profiles SELECT Policy**
  * *Description*: Restrict the open `USING (true)` policy on the `profiles` table to prevent anonymous scanning of student data.
  * *Target Files*: Database Migrations
- [ ] **Clean Up Dual Auth State & Latency**
  * *Description*: Connect `useCurrentUser.ts` directly to the Supabase Auth session or a React Context provider, eliminating redundant local storage calls.
  * *Target Files*: [useCurrentUser.ts](file:///d:/Course/Projects/graduation-mate/hooks/useCurrentUser.ts)

### Phase 2: Core Infrastructure (Medium Priority)
- [ ] **Implement Discover Pagination**
  * *Description*: Implement cursor-based or limit/offset pagination in query responses for student profiles.
  * *Target Files*: [profiles.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/profiles.ts)
- [ ] **Add Email Domain Enforcer (.edu)**
  * *Description*: Add checks restricting sign-up/onboarding strictly to verified university email domains.
  * *Target Files*: Auth routes & Supabase validation.
- [ ] **Implement Swipe Rate Limiting**
  * *Description*: Implement a rate-limiting check (e.g., via a postgres function/trigger) on the swipes table to deter bots.
  * *Target Files*: [swipes.ts](file:///d:/Course/Projects/graduation-mate/lib/queries/swipes.ts)
- [ ] **Graceful Account Deletion API**
  * *Description*: Ensure database triggers cleanly purge profile contacts, matches, and team data on account deletion.
  * *Target Files*: Database Migrations

---

## ⚙️ Developer 2 (Frontend Logic, Refactoring, & QA)

### Phase 1: Logic Restructuring & Type Safety (High Priority)
- [ ] **Decompose `profile/edit/page.tsx` Logic**
  * *Description*: Split the huge edit page file (~789 lines) into logical sub-components. Keep structural logic separate from design wrappers.
  * *Target Files*: [page.tsx](file:///d:/Course/Projects/graduation-mate/app/profile/edit/page.tsx)
- [ ] **Consolidate duplicated `getAvatarBg`**
  * *Description*: Relocate the four duplicates of the avatar background color generator into a shared utility file.
  * *Target Files*: `components/profile/ProfileCard.tsx`, `components/profile/TeammateAvatars.tsx`, `app/matches/page.tsx`, `app/my-team/page.tsx`, `lib/utils.ts`
- [ ] **Consolidate `TRACK_OPTIONS`**
  * *Description*: Move the track categories arrays from local component states to a central shared constants file.
  * *Target Files*: `app/profile/edit/page.tsx`, `StepTrack.tsx`
- [ ] **Type Cast `useState<any>` Refactoring**
  * *Description*: Replace loose/any types with concrete TS interfaces in the team and match detail states.
  * *Target Files*: [page.tsx](file:///d:/Course/Projects/graduation-mate/app/matches/page.tsx), [page.tsx](file:///d:/Course/Projects/graduation-mate/app/my-team/page.tsx)
- [ ] **Global Error Boundary Implementation**
  * *Description*: Add an `ErrorBoundary` wrapper at root level to prevent white-screen crashes on JS errors.
  * *Target Files*: [layout.tsx](file:///d:/Course/Projects/graduation-mate/app/layout.tsx)

### Phase 2: Testing Framework Setup (Medium Priority)
- [ ] **Set Up Testing Environment (Vitest + RTL)**
  * *Description*: Set up the test suite configuration, add helper testing commands to `package.json`, and write unit tests for critical custom hooks (`useSwipe`, `useCurrentUser`).
  * *Target Files*: `package.json`, new test specs

---

## 🎨 Developer 3 - User (Design System, UI Refinement, & Styling)

### Phase 1: Style System & Asset Optimization (High Priority)
- [ ] **Refine the Design Token System**
  * *Description*: Clean up visual styles, Tailwind 4 utilities, variables, and dark/light mode foundations inside `globals.css` to build a unified design system.
  * *Target Files*: [globals.css](file:///d:/Course/Projects/graduation-mate/app/globals.css)
- [ ] **Compress Background Videos & Setup Poster Images**
  * *Description*: Downsize large video backgrounds (2-5MB) and configure static fallback/poster images for browsers with low bandwidth or "prefers-reduced-motion" settings.
  * *Target Files*: Landing & Login pages
- [ ] **Add Custom Micro-Animations**
  * *Description*: Build interactive animations (e.g. hover states, card swipes, button triggers, tab transitions) to elevate visual polish.
  * *Target Files*: Component wrappers

### Phase 2: UI Feature Extensions (Medium Priority)
- [ ] **Build Discover Filters UI**
  * *Description*: Style the visual filter layout (search input, track badges, skills tags select box) on the discover feed.
  * *Target Files*: [page.tsx](file:///d:/Course/Projects/graduation-mate/app/discover/page.tsx)
- [ ] **Build Commitment Level Selection UI**
  * *Description*: Add a beautiful input selector (e.g. visual slider or segmented button group) to change commitment levels on the profile edit form.
  * *Target Files*: [page.tsx](file:///d:/Course/Projects/graduation-mate/app/profile/edit/page.tsx)
- [ ] **Accessibility & Responsive Audit**
  * *Description*: Test app layout across screen sizes down to 320px, and incorporate ARIA labels/keyboard nav shortcuts for interactive components.
  * *Target Files*: Core components
