import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTeam, joinTeam, leaveTeam } from '@/lib/queries/teams';
import { supabase } from '@/lib/supabase/client';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          maybeSingle: vi.fn().mockResolvedValue({ data: { id: '123e4567-e89b-12d3-a456-426614174000' }, error: null }),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}));

describe('Team Queries (RPC tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTeam', () => {
    it('calls the create_team_for_profile RPC with correct arguments', async () => {
      // Setup mock return
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: 'new-team-id',
        error: null,
      } as any);

      const teamName = 'My Awesome Team';
      const creatorId = 'user-123';

      const result = await createTeam(teamName, creatorId);

      expect(supabase.rpc).toHaveBeenCalledWith('create_team_for_profile', {
        team_name: teamName,
        creator_profile_id: creatorId,
      });
      expect(result).toBe('new-team-id');
    });

    it('throws an error if the RPC fails', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      } as any);

      await expect(createTeam('Team', 'user-1')).rejects.toThrow('Database error');
    });
  });

  describe('joinTeam', () => {
    it('calls the join_team_for_profile RPC with correct arguments', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: true,
        error: null,
      } as any);

      const inviteCode = '123e4567-e89b-12d3-a456-426614174000';
      const userId = 'user-123';

      await joinTeam(inviteCode, userId);

      expect(supabase.rpc).toHaveBeenCalledWith('join_team_for_profile', {
        team_id_to_join: inviteCode,
        current_profile_id: userId,
      });
    });

    it('throws an error if the join RPC fails', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Team is full' },
      } as any);

      await expect(joinTeam('123e4567-e89b-12d3-a456-426614174000', 'user-1')).rejects.toThrow('Team is full');
    });
  });

  describe('leaveTeam', () => {
    it('calls the leave_team_for_profile RPC with correct arguments', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: true,
        error: null,
      } as any);

      const teamId = 'team-123';
      const userId = 'user-456';

      await leaveTeam(teamId, userId);

      expect(supabase.rpc).toHaveBeenCalledWith('leave_team_for_profile', {
        team_id_to_leave: teamId,
        current_profile_id: userId,
      });
    });

    it('throws an error if the leave RPC fails', async () => {
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Cannot leave team' },
      } as any);

      await expect(leaveTeam('team-id', 'user-1')).rejects.toThrow('Cannot leave team');
    });
  });
});
