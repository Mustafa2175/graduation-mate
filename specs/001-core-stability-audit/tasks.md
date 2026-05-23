# Tasks: Core Architecture & Stability Audit (4-Developer Workflow)

**Input**: Design documents from `/specs/001-core-stability-audit/`
**Team Size**: 4 Developers (Dev A, Dev B, Dev C, Dev D)

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

---

## 🏗 Phase 1: Foundational Database Migrations
**Purpose**: Core infrastructure that MUST be complete before the frontend changes are applied.
**Assignment**: **Developer A** (while others wait, as these are foundational).

- [ ] T001 Create Supabase migration for team membership (`team_members` UNIQUE constraint, drop `profiles.team_id`)
- [ ] T002 Create Supabase migration for RLS Safety (Matches INSERT policy, Profiles SELECT policy)
- [ ] T003 Gate or remove `resetSwipes` database function
- [ ] T004 Run `supabase db push` and verify types generation

**Checkpoint**: Database is secure and consistent. Now all 4 developers can work in parallel on the following User Stories!

---

## 🔒 Phase 2: User Story 1 - Authentication State Refactor
**Goal**: Convert redundant `useCurrentUser` to a global Context to fix performance and infinite loop risks.
**Assignment**: **Developer A**
**Dependencies**: None. Can run in parallel with US2, US3, and US4.

- [ ] T005 [P] [US1] Create `AuthProvider` context in `hooks/useAuth.ts`
- [ ] T006 [P] [US1] Wrap the application with `AuthProvider` in `app/layout.tsx`
- [ ] T007 [P] [US1] Implement `LOGOUT_KEY` 30-second expiry logic in `hooks/useAuth.ts`
- [ ] T008 [US1] Refactor `app/discover/page.tsx` to use `useAuth()`
- [ ] T009 [US1] Refactor `app/matches/page.tsx` to use `useAuth()`
- [ ] T010 [US1] Refactor `app/my-team/page.tsx` to use `useAuth()`
- [ ] T011 [US1] Refactor `app/profile/edit/page.tsx` to use `useAuth()`

---

## 🚀 Phase 3: User Story 2 - Connections Page Performance
**Goal**: Resolve N+1 queries by batching team data fetching on the connections page.
**Assignment**: **Developer B**
**Dependencies**: None. Can run in parallel with US1, US3, and US4.

- [x] T012 [P] [US2] Update `getConnections` query in `lib/queries/matches.ts` to include relation joins for team data
- [x] T013 [P] [US2] Define type interfaces for the new batched connection response in `lib/queries/matches.ts`
- [x] T014 [US2] Refactor `app/matches/page.tsx` to remove the N+1 `getTeamById` calls and use the batched data directly

---

## 📜 Phase 4: User Story 3 - Discover Pagination
**Goal**: Implement cursor-based pagination and infinite scroll for the discover feed to handle 500+ users.
**Assignment**: **Developer C**
**Dependencies**: None. Can run in parallel with US1, US2, and US4.

- [x] T015 [P] [US3] Update `getDiscoverProfiles` in `lib/queries/profiles.ts` to accept `cursor` and `limit` parameters
- [x] T016 [P] [US3] Implement Infinite Scroll logic (pre-fetch next 20 profiles when 5 cards remain) in `app/discover/page.tsx`
- [x] T017 [US3] Add loading skeletons during pagination fetches in `app/discover/page.tsx`

---

## 🎨 Phase 5: User Story 4 - Frontend Consistency & UX
**Goal**: Integrate the existing `DESIGN.md` as the single source of truth, consolidate duplicate UI utilities, and add global error boundaries to prevent crashes.
**Assignment**: **Developer D**
**Dependencies**: None. Can run in parallel with US1, US2, and US3.

- [x] T018 [P] [US4] Migrate color and typography design tokens from `DESIGN.md` into `app/globals.css`
- [x] T019 [P] [US4] Replace hardcoded Tailwind classes (e.g., `bg-violet-500`, `--color-brand`) across components with official tokens
- [x] T020 [P] [US4] Create global Error Boundary in `app/error.tsx`
- [x] T021 [P] [US4] Create global not-found boundary in `app/global-error.tsx`
- [x] T022 [P] [US4] Extract `getAvatarBg` utility function into `lib/utils.ts` and ensure it maps exclusively to `DESIGN.md` tokens
- [x] T023 [US4] Refactor `app/matches/page.tsx` to use the unified `getAvatarBg`
- [x] T024 [US4] Refactor `app/my-team/page.tsx` to use the unified `getAvatarBg`
- [x] T025 [US4] Refactor `app/teams/[id]/page.tsx` to use the unified `getAvatarBg`
- [x] T026 [US4] Refactor `components/ProfileCard.tsx` to use the unified `getAvatarBg`

---

## 🧪 Phase 6: Testing & Observability (Polish)
**Goal**: Satisfy constitution mandates for Test-First custom hooks and Observability console cleanup.
**Assignment**: **Developer A/B**
**Dependencies**: Should be completed alongside or immediately following Phase 2 & 4.

- [x] T027 [P] [US1] Write unit tests for `useAuth` hook in `hooks/__tests__/useAuth.test.tsx`
- [x] T028 [P] [US3] Write unit tests for `useSwipe` hook in `hooks/__tests__/useSwipe.test.tsx`
- [x] T029 [P] Remove all 17 `console.error` statements from production hooks, pages, and queries, replacing them with proper error handling/silent catch blocks.

---

## 🤝 Dependencies & Execution Order for the 4 Developers

### 1. Sequential Phase (Day 1 Morning)
- **Developer A** takes the lead and executes **Phase 1**.
- **Developers B, C, D** wait until the DB migrations are merged into the development branch.
- **Why**: Phase 1 modifies the database schema and RLS policies. The frontend refactoring relies on these policies and constraints being active, so it is safer for everyone to pull the new database types and migrations before starting their frontend work.

### 2. Full Parallel Phase (Day 1 Afternoon & Day 2)
Once Phase 1 is merged, the team splits the remaining 4 user stories completely in parallel with zero blockers between them:
- **Developer A**: Owns the **Auth State Refactor (US1)**. Modifies layout and auth hooks.
- **Developer B**: Owns the **Connections Performance (US2)**. Modifies `matches.ts` and `matches/page.tsx`.
- **Developer C**: Owns the **Discover Pagination (US3)**. Modifies `profiles.ts` and `discover/page.tsx`.
- **Developer D**: Owns the **Frontend Consistency (US4)**. Adds global boundaries and cleans up `utils.ts` and avatar logic.

### 3. Integration & Merge
- The scopes of these 4 user stories are cleanly separated by file and concern.
- **Minor overlap warning**: Developer A and Developer B both touch `app/matches/page.tsx`. Developer A replaces `useCurrentUser` while Developer B replaces the query logic. Git will easily auto-merge these changes as they are in different parts of the file, but they should quickly communicate when opening their PRs.
