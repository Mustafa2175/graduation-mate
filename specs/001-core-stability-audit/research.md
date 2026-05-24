# Research & Decisions: Core Architecture & Stability Audit

## 1. Authentication State Management

**Decision**: Convert `useCurrentUser` to a React Context (`AuthContext`).
**Rationale**: Eliminates the 5x redundant `getFreshUser()` network calls per navigation (PERF-03). A context-based approach ensures that the auth state is fetched once at the root level and shared across all consumers. This also resolves the `eslint-disable react-hooks/exhaustive-deps` issues (AUTH-01) by providing stable object references.
**Alternatives considered**:
- Jotai / Zustand: Overkill for just a single `user` object when Context API is built-in and sufficient for auth.
- SWR / React Query: Would solve deduplication and caching, but introduces a new dependency for something that can be handled natively.

## 2. Database Team Membership Cardinality

**Decision**: Enforce Strict Single Team membership via `UNIQUE(profile_id)` constraint on `team_members` and remove `profiles.team_id`.
**Rationale**: `profiles.team_id` and `team_members` represent dual sources of truth (DB-05), risking inconsistencies. By removing `team_id` from `profiles` and strictly relying on a unique constraint on `team_members`, we eliminate anomalies. This strictly enforces the "max 1 team per student" rule at the DB level, which matches the real-world use case.
**Alternatives considered**:
- Keep `profiles.team_id` and use triggers to sync with `team_members`: Too complex and adds latency to writes.

## 3. RLS Matches Safety

**Decision**: Restrict `matches` INSERT policy to `WITH CHECK ((select auth.uid()) = profile1_id OR (select auth.uid()) = profile2_id)`.
**Rationale**: Currently, any authenticated user can create a match between *any* two arbitrary profiles (DB-02). Restricting the insert policy ensures a user can only create a match where they are one of the participants.
**Alternatives considered**: None. The current open policy is a strict vulnerability that must be fixed.

## 4. Discover Pagination

**Decision**: Implement cursor-based pagination with Infinite Scroll on the Discover page.
**Rationale**: Loading all available profiles at once breaks at scale (SWIPE-01). Cursor-based pagination scales well, and fetching the next 20 profiles when the user is 5 cards away from the end provides a seamless experience for Tinder-style swiping.
**Alternatives considered**:
- Offset pagination: Subject to skipping or duplicating rows as items are added/removed. Cursor-based (e.g., using `created_at` or specific IDs) is much more robust.

## 5. Email Domain Enforcement

**Decision**: Configurable `.edu` validation enforced in production, but open in development.
**Rationale**: Real-world university apps require `.edu` email validation. However, local development shouldn't be blocked by this. A server-side environment variable toggle gives flexibility.
**Alternatives considered**:
- Hardcoded `.edu` check: Frustrating for local development.

## 6. Connections Page Performance

**Decision**: Resolve N+1 queries by batching team data fetching.
**Rationale**: The current `getConnections` creates 2 additional queries per connection (`getTeamById` + `getTeamMembers`), causing exponential slowdowns (PERF-01). Using a relation join or fetching all unique `team_ids` in a single query solves this issue.
**Alternatives considered**:
- Client-side parallel fetching (e.g., `Promise.all`): Reduces latency slightly, but still hits the database connection pool excessively. Batching in the primary query is significantly better.

## 7. Frontend Design System

**Decision**: Utilize the existing `DESIGN.md` as the single source of truth for the design system.
**Rationale**: `DESIGN.md` already contains comprehensive design tokens (colors, typography, spacing) and Tailwind v4 configuration. Integrating it prevents duplicated UI utilities and ensures UI consistency across all developers' work.
**Alternatives considered**:
- Create a new design system from scratch: Rejected because the existing one is highly detailed and fits the application's current brand perfectly.

## 8. Next.js Middleware for Server-Side Auth Guard

**Decision**: Implement `middleware.ts` at the project root using `@supabase/ssr` to intercept and validate sessions server-side.
**Rationale**: Relying entirely on client-side auth checks (via `useAuth()` + `router.replace`) causes unprotected UI elements (like loading skeletons) to flash before unauthenticated users are redirected. It also fails to refresh Supabase session cookies properly. A middleware validates the session securely on the edge/server and prevents unauthorized access to protected routes cleanly.
**Alternatives considered**:
- Continue with client-side only: Unacceptable for beta UX. The flash of protected UI skeletons is jarring.
- Server Components data fetching guard: Adding a check on every server component is redundant and error-prone compared to a single unified middleware.

## 9. resetSwipes Environment Gating

**Decision**: Conditionally render the "Reset Queue" button in `app/discover/page.tsx` based on `process.env.NODE_ENV === 'development'`.
**Rationale**: `resetSwipes` is a destructive action designed for development and testing. Exposing the UI button in production leads to unhandled errors (since the server action/query throws an error). It must be hidden from real users.
**Alternatives considered**:
- Remove the button entirely: Not ideal, as it's useful for developers testing the swipe mechanics without needing to manually clear DB tables.

## 10. Denormalized profiles.team_id Alignment

**Decision**: Maintain `profiles.team_id` as a denormalized convenience column updated exclusively through application-level mutations (`createTeam`, `joinTeam`, `leaveTeam` in `lib/queries/teams.ts`), without relying on database triggers.
**Rationale**: Dropping `profiles.team_id` completely would force complex and performance-costly nested joins/subqueries in reads throughout the application (such as in discover filtering, profile edit page, and discover cards). However, to avoid dual source-of-truth errors, all mutations that alter team membership must strictly keep `profiles.team_id` and `team_members` in perfect sync. Application-level synchronization keeps database complexity low (no triggers or SQL function maintenance) while preserving fast reads.
**Alternatives considered**:
- PostgreSQL Triggers: Rejected to maintain a simpler, more portable database schema. 
- Fully Normalize (drop column): Rejected due to read performance regressions on high-frequency pages (like Discover profiles queries).

## 11. Type Safety in my-team/page.tsx

**Decision**: Replace `any` typings for `team` and `teammates` in `app/my-team/page.tsx` with proper, centralized `Team` and `Profile` interfaces imported from `@/types`.
**Rationale**: Eliminating loose `any` types prevents silent runtime regression risks during future refactors or updates to the profiles or teams schema. Explicit typings leverage the full power of TypeScript compiling, ensuring autocomplete and type checking work seamlessly.
**Alternatives considered**:
- Inline typings: Declaring types inside the page component increases duplication. Importing from the centralized `@/types` folder is cleaner and adheres to the project's codebase patterns.
