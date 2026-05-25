# Before Release Fix Plan

Scope: MVP / portfolio demo release.

Do not add production-scale features. Do not implement email confirmation, advanced moderation, analytics, microservices, or enterprise onboarding. Focus only on fixes that prevent broken demo UX, data corruption, basic security issues, and deployment failures.

## General Rules For The Implementing AI

1. Work phase by phase in order.
2. Do not start a later phase until the current phase builds and tests pass.
3. Keep changes small and isolated.
4. Do not refactor unrelated UI.
5. Do not change visual design unless required to show an error or prevent a broken flow.
6. Prefer existing project patterns and Supabase client/query helpers.
7. After each phase, run:
   - `npm run build`
   - `npx vitest run`
8. If database migrations are changed, document the migration order and expected manual Supabase checks.

## Phase 0: Team Data Consistency

Goal: prevent team membership corruption.

### Problems

- Team create/join/leave operations update multiple tables from client code.
- `team_members` and `profiles.team_id` can become inconsistent.
- A failed intermediate step can leave orphan teams or stale profile team IDs.

### Files Likely Involved

- `lib/queries/teams.ts`
- `supabase/migrations/*`
- `app/profile/edit/page.tsx`
- `app/my-team/page.tsx`
- `lib/queries/profiles.ts`

### Required Fixes

1. Make team create/join/leave consistent.
   - Preferred MVP-safe option: add Supabase RPC functions for:
     - `create_team_for_profile`
     - `join_team_for_profile`
     - `leave_team_for_profile`
   - Each RPC must update `teams`, `team_members`, and `profiles.team_id` inside one transaction.

2. Keep single-team membership enforced.
   - Preserve the unique constraint on `team_members.profile_id`.
   - Handle unique constraint failures with a user-friendly error.

3. Update `lib/queries/teams.ts`.
   - `createTeam` should call the create RPC.
   - `joinTeam` should call the join RPC.
   - `leaveTeam` should call the leave RPC.
   - Do not leave multi-step table updates in client-side query functions.

4. Ensure empty teams are cleaned up.
   - If the last member leaves, delete the team inside the leave RPC.

### Acceptance Criteria

- Creating a team always results in:
  - one `teams` row
  - one matching `team_members` row
  - `profiles.team_id` set to the team ID
- Joining a team always results in:
  - one `team_members` row
  - `profiles.team_id` set to the joined team ID
- Leaving a team always results in:
  - no `team_members` row for that user
  - `profiles.team_id = null`
  - team deleted if it has no members
- User cannot join or create a second team.
- Build passes.
- Tests pass.

## Phase 1: Swipe And Match Reliability

Goal: prevent users from seeing successful swipe/match UI when the database write failed.

### Problems

- Swipe card advances before the database write is confirmed.
- Swipe insert failures are silently ignored.
- Match creation failures can be missed.

### Files Likely Involved

- `hooks/useSwipe.ts`
- `lib/queries/swipes.ts`
- `lib/queries/matches.ts`
- `app/discover/page.tsx`
- `hooks/__tests__/useSwipe.test.tsx`

### Required Fixes

1. Handle failed swipe insert.
   - If `insertSwipe` fails, show a toast error.
   - Restore or keep the swiped profile available to the user.
   - Do not silently ignore the error.

2. Handle duplicate swipe insert safely.
   - If Supabase returns duplicate key error `23505`, treat it as already handled.
   - Do not show a scary error for duplicate swipes.

3. Handle match creation failure.
   - If mutual swipe exists but `createMatch` fails, show a toast error.
   - Do not claim a match was created unless the insert succeeded or already exists.

4. Add/update hook tests.
   - Test failed swipe insert.
   - Test duplicate swipe insert.
   - Test match creation failure.

### Acceptance Criteria

- A failed swipe does not disappear silently.
- Duplicate swipe does not break the UI.
- Match success toast only appears when match creation succeeds or already exists.
- Build passes.
- Tests pass.

## Phase 2: Error States For Critical Pages

Goal: avoid showing false empty states when data failed to load.

### Problems

- Matches page can show empty tabs when loading failed.
- My Team page can show incorrect no-team state when loading failed.
- Team details page can hide query failures.

### Files Likely Involved

- `app/matches/page.tsx`
- `app/my-team/page.tsx`
- `app/teams/[id]/page.tsx`

### Required Fixes

1. Add simple page-level error state.
   - Use existing styling.
   - Include a retry button.
   - Keep UI minimal.

2. Replace important silent catches.
   - Matches load failure should show an error.
   - My Team load failure should show an error.
   - Team details load failure should show an error.

3. Keep user-action errors as toasts.
   - Save team details failure: toast.
   - Leave team failure: toast.
   - Accept/decline invite failure: toast and reload state.

### Acceptance Criteria

- Failed matches query shows retry UI.
- Failed team dashboard query shows retry UI.
- Failed team details query shows retry UI or team-not-found only when the query succeeded with no team.
- User-action failures show clear toast messages.
- Build passes.
- Tests pass.

## Phase 3: Signup Recovery And Demo Flow Stability

Goal: prevent broken onboarding if one step fails after auth signup.

### Problems

- Auth signup can succeed while profile/contact/team setup fails.
- User may be redirected without complete profile data.

### Files Likely Involved

- `app/profile/setup/page.tsx`
- `app/profile/edit/page.tsx`
- `hooks/useAuth.tsx`
- `lib/queries/profiles.ts`

### Required Fixes

1. Make setup retryable.
   - If profile update or contacts save fails, show a toast and keep user on setup page.
   - Do not redirect to discover unless required profile data saved successfully.

2. Handle existing auth user with incomplete profile.
   - If user is authenticated and visits setup, allow them to complete profile data instead of forcing a new signup.
   - Keep this simple for MVP.

3. Optional team join failure should not block profile creation.
   - Keep current behavior of showing an error if team join fails.
   - Make sure the user can still join later from profile edit.

### Acceptance Criteria

- Profile setup does not redirect to discover after failed required profile/contact save.
- Existing signed-in user with incomplete profile can recover through setup or edit.
- Optional invite failure leaves profile usable.
- Build passes.
- Tests pass.

## Phase 4: Basic Security And Deployment Checks

Goal: make sure the deployed demo does not fail due to config, RLS, or storage mistakes.

### Problems

- RLS behavior needs real deployed verification.
- Avatar storage policies need verification.
- External URLs/contact fields need basic validation.
- Environment variables and auth redirects can break deployment.

### Files Likely Involved

- `supabase/migrations/*`
- `components/profile/AvatarUpload.tsx`
- `app/profile/setup/page.tsx`
- `app/profile/edit/page.tsx`
- `app/matches/page.tsx`
- `.env.local.example` if created
- `README.md` or deployment notes

### Required Fixes

1. Verify RLS manually and document results.
   - Anonymous user cannot access protected app pages.
   - User can update only own profile.
   - User can create only own swipes.
   - User can join/leave only own team membership.
   - Contacts are visible only to self or intended matched users.

2. Verify avatar storage.
   - User can upload/update own avatar.
   - User cannot overwrite another user's avatar path.
   - Public read works if the app relies on public avatar URLs.

3. Normalize external links.
   - LinkedIn URL must be a valid `http` or `https` URL.
   - WhatsApp number should be normalized to digits plus optional leading `+`.
   - Avoid opening unvalidated arbitrary strings.

4. Add deployment checklist.
   - Supabase URL configured.
   - Supabase anon key configured.
   - Auth site URL configured.
   - Auth redirect URLs configured.
   - Storage bucket exists.
   - Migrations applied in order.
   - One complete deployed smoke test passed.

### Acceptance Criteria

- RLS manual check documented.
- Avatar upload works on deployed environment.
- Contact links do not break on malformed input.
- Deployment checklist exists.
- Build passes.
- Tests pass.

## Phase 5: Minimal Test And Script Cleanup

Goal: make the MVP safer to maintain without broad refactors.

### Problems

- Existing tests pass but there is no `npm test` script.
- Critical flows lack coverage.

### Files Likely Involved

- `package.json`
- `hooks/__tests__/*`
- New test files as needed

### Required Fixes

1. Add test script.
   - Add `"test": "vitest run"` to `package.json`.

2. Add focused tests only.
   - Team lifecycle query wrappers call expected RPCs.
   - Swipe failure behavior.
   - Match creation duplicate handling.
   - Invite accept/decline failure recovery if practical.

3. Avoid large test architecture changes.
   - Keep tests close to existing Vitest setup.

### Acceptance Criteria

- `npm test` works.
- Critical failure cases have focused tests.
- Build passes.
- Tests pass.

## Final Release Smoke Test

Run this after all phases.

1. Create a new account.
2. Complete profile setup.
3. Upload avatar.
4. Swipe right on another test user.
5. From second test user, accept or swipe right back.
6. Confirm match appears for both users.
7. Confirm contact links appear only after match.
8. Create a team.
9. Copy invite ID.
10. Join team from another user.
11. Confirm both users see the same team and members.
12. Leave team.
13. Confirm membership is removed correctly.
14. Refresh all pages after each major action.
15. Test deployed URL in a private/incognito browser.

## Definition Of Done

The MVP is ready for portfolio/demo release when:

- Team membership cannot become inconsistent during normal demo use.
- Swipe and match failures are visible and recoverable.
- Critical pages show errors instead of false empty states.
- Signup can recover from incomplete profile state.
- Supabase RLS/storage/deployment checks are documented.
- `npm run build` passes.
- `npm test` or `npx vitest run` passes.
