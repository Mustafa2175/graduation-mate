# Project Review

Date: 2026-05-24  
Project: TeamUp / Graduation Mate

## Verification

- `npm run build` passed.
- `npx vitest run` passed: 2 test files, 6 tests.
- No files were changed during the review before this document was created.

## High-Level Summary

The main product flow is present and mostly coherent:

1. Landing page
2. Login or profile setup
3. Discover classmates
4. Swipe left/right
5. Accept incoming invites or view matches
6. Create, join, manage, or inspect teams

The codebase currently has no production build blocker. The larger risks are around data consistency, hidden failures, duplicated state, and user flows that can silently fail.

## Main Findings

### 1. Team Writes Are Not Atomic

Team creation, joining, and leaving are multi-step client-side operations across `teams`, `team_members`, and `profiles.team_id`.

Files:

- `lib/queries/teams.ts`

Risk:

- A team can be created but membership insert can fail.
- A membership can be inserted but `profiles.team_id` can fail to update.
- A user can leave a team in one table but still look joined in another.

Recommendation:

- Move `createTeam`, `joinTeam`, and `leaveTeam` into Postgres RPC functions.
- Or maintain `profiles.team_id` with database triggers instead of client code.

### 2. Team Membership Has Two Sources Of Truth

The app reads both:

- `profiles.team_id`
- `team_members`

This is dangerous because the two can drift apart.

Examples:

- Discover excludes teammates through `profiles.team_id`.
- Team pages read members through `team_members`.
- Team creation and joining manually update both.

Recommendation:

- Prefer `team_members` as the source of truth.
- If `profiles.team_id` must stay for performance, make it denormalized and trigger-maintained.

### 3. Swipe Failures Are Hidden

`useSwipe` moves the card index before the database write finishes. If the insert or match creation fails, the error is silently ignored.

Risk:

- A user thinks they swiped on someone, but the swipe was not saved.
- The profile may appear again later.
- A mutual match may not be created.

Recommendation:

- Track failed swipe operations.
- Show a toast or retry state.
- Consider only advancing permanently after the write succeeds, or maintain a retry queue.

### 4. Page Load Errors Often Look Like Empty States

Several pages catch errors silently.

Examples:

- `app/matches/page.tsx`
- `app/my-team/page.tsx`
- `app/teams/[id]/page.tsx`
- `hooks/useSwipe.ts`

Risk:

- A failed Supabase query can look like "No invites yet" or "No team yet".
- Debugging user reports becomes difficult.

Recommendation:

- Use visible error states for page-load failures.
- Use toast messages for user-action failures.
- Log errors consistently during development or through an app logger.

### 5. Signup Can Leave Partial Accounts

Profile setup performs several separate operations:

1. Supabase auth signup
2. Profile update
3. Contact upsert
4. Avatar upload
5. Optional team join

Risk:

- A user can be created in auth but fail profile completion.
- Contacts can fail after profile save.
- Team join can fail after signup, leaving confusing onboarding state.

Recommendation:

- Add a recoverable onboarding state.
- Make profile completion idempotent.
- Consider server-side/RPC orchestration for account setup.

### 6. Discover Pagination Can Skip Profiles

Discover pagination uses only `created_at` as a cursor.

Risk:

- Profiles with the same timestamp can be skipped.

Recommendation:

- Use a compound cursor: `created_at` plus `id`.

### 7. URL And Contact Handling Needs Hardening

Some external links are opened with `window.open`, and stored URLs are trusted.

Risk:

- Bad or malformed URLs may create poor UX or security concerns.

Recommendation:

- Normalize and validate URLs in both setup and edit flows.
- Prefer `<a target="_blank" rel="noopener noreferrer">`.

## User Flow Review

### Landing And Auth

The landing, login, and signup routes are wired correctly. Auth state is managed through Supabase plus a local cached user object.

Risk:

- The local cache adds complexity around logout and stale user state.

Recommendation:

- Keep local cache only as a display optimization.
- Treat Supabase auth as the actual source of truth.

### Profile Setup

The wizard is clear and pushes users into discover after account creation.

Risk:

- Multi-step submission can partially succeed.
- Avatar upload failure is handled, but other partial failures are more disruptive.

Recommendation:

- Add resume/edit handling for incomplete profiles.

### Discover

The swipe UI and infinite loading are implemented.

Risk:

- Failed swipe writes are silent.
- Cursor pagination can skip profiles.
- Reset queue only works in development because `resetSwipes` is guarded by `NODE_ENV`.

Recommendation:

- Hide or change reset behavior in production.
- Add retry/error handling for swipe writes.

### Matches And Invites

Incoming, outgoing, and mutual tabs are useful and map well to the product.

Risk:

- Errors during load are hidden.
- Optimistic accept/decline can temporarily show incorrect state.

Recommendation:

- Add explicit error UI.
- Add tests for accepting, declining, duplicate swipe handling, and match creation.

### Team Management

Users can create, join, leave, copy invites, and edit team details.

Risk:

- This is the highest-risk area because writes are not atomic.
- `profiles.team_id` and `team_members` can drift.

Recommendation:

- Make database-backed team lifecycle operations transactional.

## Code Cleaning Priorities

1. Replace silent catches with consistent error handling.
2. Reduce `any` usage in query result mapping.
3. Add typed Supabase row shapes for nested joins.
4. Add an npm `test` script.
5. Fix corrupted encoding/mojibake in UI text.
6. Extract repeated avatar/contact/team display UI into shared components.
7. Normalize contact and URL validation across setup and edit flows.

## Expected Bugs

- A user creates a team but still appears teamless.
- A user joins a team, but discover still shows their teammates.
- A user leaves a team, but other screens still think they are a member.
- A swipe appears successful but is not saved.
- A mutual swipe does not create a match.
- Connections page shows empty tabs when the real problem is a failed query.
- Signup creates an auth user but fails to complete the profile.
- Team detail pages show incomplete or stale member/contact data.
- Profiles can be skipped in discover pagination when timestamps collide.

## Recommended Fix Order

1. Make team create/join/leave atomic.
2. Decide the source of truth for team membership.
3. Add visible error states to matches, my-team, and team detail pages.
4. Improve swipe failure handling.
5. Add integration tests for team lifecycle and swipe-to-match lifecycle.
6. Clean up typing and repeated UI code.

## Current Status

The project is shippable only for controlled testing. Before a wider demo or real users, the team lifecycle and silent error handling should be fixed first.
