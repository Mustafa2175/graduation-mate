# Quickstart: Core Architecture & Stability Audit

## Overview

This branch (`001-core-stability-audit`) focuses on critical stability, security, and performance improvements for the TeamUp application.

## Key Changes

1. **Auth Context**: Instead of using `useCurrentUser()` across multiple pages (which triggered multiple network calls), the app now uses a global `<AuthProvider>` wrapping the application, accessible via a unified `useAuth()` hook.
2. **Database Security**: Matches can only be inserted by users participating in the match. The `profiles` table is now protected against unauthorized bulk data harvesting.
3. **Performance**: Discover profiles are paginated via an Infinite Scroll pattern. The Connections page fetches data efficiently in a single batched query, preventing N+1 performance degradations.
4. **Data Integrity**: Team membership is now strictly enforced with a `UNIQUE(profile_id)` constraint on the `team_members` table, and the redundant `profiles.team_id` column has been removed.

## Development

1. Ensure the new database migrations are applied:
   ```bash
   npx supabase db push
   ```

2. Run the tests to verify hooks and data layers function properly:
   ```bash
   npm run test
   ```

3. If running locally, you can use any email domain. In production environments, ensure the `NEXT_PUBLIC_REQUIRE_EDU_EMAIL` environment variable is set to enforce `.edu` email requirements.
