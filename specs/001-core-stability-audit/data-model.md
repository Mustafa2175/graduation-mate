# Data Model: Core Architecture & Stability Audit

## Entity Changes

### 1. `profiles`
The `profiles` table stores the core user data (name, university info, bio).

**Changes**:
- **DENORMALIZED COLUMN**: `team_id` is KEPT as a denormalized convenience column (migration 017). It must be strictly maintained in sync via application code inside `lib/queries/teams.ts` instead of using database triggers.
- **POLICY UPDATE**: The `SELECT` policy is restricted to prevent unauthenticated/unauthorized bulk harvesting (DB-01).

### 2. `team_members`
The `team_members` table stores the relationship between a user (`profile_id`) and a team (`team_id`).

**Changes**:
- **ADD CONSTRAINT**: `UNIQUE(profile_id)`. Ensures that a student can only belong to exactly one team at a time (DB-05).

### 3. `matches`
The `matches` table stores mutual connections between two profiles.

**Changes**:
- **POLICY UPDATE**: Modify the `INSERT` policy.
  - *Old*: `WITH CHECK (auth.uid() IS NOT NULL)`
  - *New*: `WITH CHECK ((select auth.uid()) = profile1_id OR (select auth.uid()) = profile2_id)`
  - This prevents an authenticated user from forging matches between two other arbitrary users (DB-02).

### 4. `swipes`
The `swipes` table records right/left swipes from one profile to another.

**Changes**:
- The demo-only `resetSwipes` database function/query that wipes this table completely will be removed or gated behind a development environment check (DB-03).
