# Implementation Plan: Core Architecture & Stability Audit

**Branch**: `001-core-stability-audit` | **Date**: 2026-05-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-core-stability-audit/spec.md`

## Summary

Perform a full system stability and architecture audit of TeamUp, fixing critical DB/RLS safety issues, resolving N+1 queries, addressing frontend performance, and unifying the authentication state.

## Technical Context

**Language/Version**: TypeScript / Node.js

**Primary Dependencies**: Next.js, React, Supabase (@supabase/ssr), Tailwind CSS, Vitest, React Testing Library

**Storage**: PostgreSQL (via Supabase)

**Testing**: Vitest, React Testing Library (Unit & Integration)

**Target Platform**: Web (mobile-first UI)

**Project Type**: Web application

**Performance Goals**: Fast discover query performance (< 200ms p95), fast initial paint.

**Constraints**: Strict single team membership (max 1 team per user, enforced at DB level), configurable email domain enforcement.

**Scale/Scope**: ~1000+ users (Multi-Campus)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Test-First (NON-NEGOTIABLE)**: Tests for custom hooks (useSwipe, useCurrentUser) must be written before implementation changes if possible.
- **Observability**: Ensure console statements are cleaned up and errors are logged appropriately.

## Project Structure

### Documentation (this feature)

```text
specs/001-core-stability-audit/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks command)
```

### Source Code (repository root)

```text
# Option 2: Web application
app/
├── (auth)/
├── discover/
├── matches/
├── my-team/
├── profile/
└── teams/
components/
hooks/
lib/
supabase/
└── migrations/
```

**Structure Decision**: Standard Next.js App Router structure with Supabase migrations.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Phase 7: Deployment Blockers (Beta Readiness)

**Goal**: Resolve the final two deployment blockers to make the application fully ready for a real student beta.

### T030: Add Next.js Middleware
- Create `middleware.ts` in the project root.
- Implement `@supabase/ssr` `updateSession` logic.
- Protect all routes (`/discover`, `/matches`, `/my-team`, `/profile/*`) by redirecting unauthenticated users to `/login`.
- Redirect authenticated users trying to access `/login` to `/discover`.

### T031: Gate `resetSwipes` UI
- Modify `app/discover/page.tsx` to conditionally render the "Reset Queue & Swipe Again" button.
- Condition: `process.env.NODE_ENV === 'development'`.
- Ensure it does not break the empty state layout.

## Phase 8: Team Membership Integrity & My-Team Type Safety

**Goal**: Align application code with the denormalized `profiles.team_id` architecture and upgrade type safety on the My Team dashboard.

### T032: Verify/Ensure `profiles.team_id` Synchronization
- Audit `createTeam`, `joinTeam`, and `leaveTeam` inside `lib/queries/teams.ts` to confirm they strictly update `profiles.team_id` alongside `team_members` inserts/deletes.
- Ensure proper sequential executions and error bubble-ups.
- Document this application-level synchronization design in inline comments.

### T033: Upgrade Type Safety in my-team/page.tsx
- Import `Team` and `Profile` interfaces from `@/types`.
- Replace `useState<any>(null)` for `team` with `useState<Team | null>(null)`.
- Replace `useState<any[]>([]);` for `teammates` with `useState<Profile[]>([]);`.
- Resolve all compiler checks and TypeScript warnings resulting from strict typings.
- Remove loose typing and type-casting within `app/my-team/page.tsx`.
