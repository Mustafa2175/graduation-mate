import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getMyTeamId,
  sendTeamInvitation,
  getPendingInvitationsReceived,
  getSentInvitations,
  acceptTeamInvitation,
  declineTeamInvitation,
} from '@/lib/queries/teamInvitations'
import { supabase } from '@/lib/supabase/client'

// ── Mock Supabase ──────────────────────────────────────────────────────────────

vi.mock('@/lib/supabase/client', () => {
  const chain: Record<string, any> = {}
  const builder = () => {
    const obj: Record<string, any> = {}
    const methods = [
      'from', 'select', 'insert', 'update', 'eq', 'order',
      'maybeSingle', 'single', 'rpc',
    ]
    methods.forEach(m => {
      obj[m] = vi.fn(() => obj)
    })
    return obj
  }
  return {
    supabase: {
      from: vi.fn(() => builder()),
      rpc: vi.fn(),
    },
  }
})

// ── Helpers ────────────────────────────────────────────────────────────────────

function mockFrom(returnValue: any) {
  const maybeSingleFn = vi.fn().mockResolvedValue(returnValue)
  const eqFn = vi.fn(() => ({ maybeSingle: maybeSingleFn, eq: eqFn }))
  const selectFn = vi.fn(() => ({ eq: eqFn }))
  const fromFn = vi.fn(() => ({ select: selectFn }))
  vi.mocked(supabase.from).mockImplementation(fromFn as any)
  return { fromFn, selectFn, eqFn, maybeSingleFn }
}

function mockInsert(returnValue: any) {
  const insertFn = vi.fn().mockResolvedValue(returnValue)
  const fromFn = vi.fn(() => ({ insert: insertFn }))
  vi.mocked(supabase.from).mockImplementation(fromFn as any)
  return { fromFn, insertFn }
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('teamInvitations queries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── getMyTeamId ───────────────────────────────────────────────────────────

  describe('getMyTeamId', () => {
    it('returns team_id when membership exists', async () => {
      mockFrom({ data: { team_id: 'team-abc' }, error: null })
      const result = await getMyTeamId('user-1')
      expect(result).toBe('team-abc')
    })

    it('returns null when no membership found', async () => {
      mockFrom({ data: null, error: null })
      const result = await getMyTeamId('user-1')
      expect(result).toBeNull()
    })

    it('throws on Supabase error', async () => {
      mockFrom({ data: null, error: { message: 'DB error' } })
      await expect(getMyTeamId('user-1')).rejects.toThrow('DB error')
    })
  })

  // ─── sendTeamInvitation ────────────────────────────────────────────────────

  describe('sendTeamInvitation', () => {
    it('calls from("team_invitations").insert with correct payload', async () => {
      const { insertFn } = mockInsert({ error: null })
      await sendTeamInvitation('team-1', 'sender-1', 'recipient-1')
      expect(insertFn).toHaveBeenCalledWith({
        team_id: 'team-1',
        sender_profile_id: 'sender-1',
        recipient_profile_id: 'recipient-1',
        status: 'PENDING',
      })
    })

    it('throws human-readable error on duplicate (23505)', async () => {
      mockInsert({ error: { code: '23505', message: 'unique constraint' } })
      await expect(
        sendTeamInvitation('team-1', 'sender-1', 'recipient-1')
      ).rejects.toThrow('You already sent a pending invite to this person.')
    })

    it('throws raw error on other DB error', async () => {
      mockInsert({ error: { code: '42000', message: 'RLS violation' } })
      await expect(
        sendTeamInvitation('team-1', 'sender-1', 'recipient-1')
      ).rejects.toThrow('RLS violation')
    })
  })

  // ─── acceptTeamInvitation ──────────────────────────────────────────────────

  describe('acceptTeamInvitation', () => {
    function mockChainedUpdate(resolvedValue: any) {
      // Supports .update({}).eq('id', ...).eq('recipient_profile_id', ...)
      const innerEq = vi.fn().mockResolvedValue(resolvedValue)
      const outerEq = vi.fn(() => ({ eq: innerEq }))
      const updateFn = vi.fn(() => ({ eq: outerEq }))
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any)
      return { updateFn, outerEq, innerEq }
    }

    it('updates status to ACCEPTED then calls join_team_for_profile RPC', async () => {
      mockChainedUpdate({ error: null })
      vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as any)

      await acceptTeamInvitation('inv-1', 'team-1', 'user-1')

      expect(supabase.rpc).toHaveBeenCalledWith('join_team_for_profile', {
        team_id_to_join: 'team-1',
        current_profile_id: 'user-1',
      })
    })

    it('throws user-friendly error when already in a team', async () => {
      // First call: ACCEPTED update succeeds
      // Second call (rollback): also succeeds
      const innerEq = vi.fn().mockResolvedValue({ error: null })
      const outerEq = vi.fn(() => ({ eq: innerEq }))
      const updateFn = vi.fn(() => ({ eq: outerEq }))
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any)

      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { message: 'Leave your current team before joining another one.', code: 'P0001' },
      } as any)

      await expect(
        acceptTeamInvitation('inv-1', 'team-1', 'user-1')
      ).rejects.toThrow('Leave your current team before accepting this invite.')
    })
  })

  // ─── declineTeamInvitation ─────────────────────────────────────────────────

  describe('declineTeamInvitation', () => {
    function mockChainedUpdate(resolvedValue: any) {
      const innerEq = vi.fn().mockResolvedValue(resolvedValue)
      const outerEq = vi.fn(() => ({ eq: innerEq }))
      const updateFn = vi.fn(() => ({ eq: outerEq }))
      vi.mocked(supabase.from).mockReturnValue({ update: updateFn } as any)
      return { updateFn, outerEq, innerEq }
    }

    it('updates status to DECLINED', async () => {
      const { updateFn } = mockChainedUpdate({ error: null })
      await declineTeamInvitation('inv-1', 'user-1')
      expect(updateFn).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'DECLINED' })
      )
    })

    it('throws on DB error', async () => {
      mockChainedUpdate({ error: { message: 'RLS denied' } })
      await expect(declineTeamInvitation('inv-1', 'user-1')).rejects.toThrow('RLS denied')
    })
  })

  // ─── getSentInvitations ────────────────────────────────────────────────────

  describe('getSentInvitations', () => {
    it('queries by sender_profile_id', async () => {
      const orderFn = vi.fn().mockResolvedValue({ data: [], error: null })
      const eqFn = vi.fn(() => ({ order: orderFn }))
      const selectFn = vi.fn(() => ({ eq: eqFn }))
      vi.mocked(supabase.from).mockReturnValue({ select: selectFn } as any)

      const result = await getSentInvitations('sender-1')
      expect(eqFn).toHaveBeenCalledWith('sender_profile_id', 'sender-1')
      expect(result).toEqual([])
    })
  })

  // ─── getPendingInvitationsReceived ─────────────────────────────────────────

  describe('getPendingInvitationsReceived', () => {
    it('queries by recipient_profile_id and PENDING status', async () => {
      const orderFn = vi.fn().mockResolvedValue({ data: [], error: null })
      const eq2Fn = vi.fn(() => ({ order: orderFn }))
      const eqFn = vi.fn(() => ({ eq: eq2Fn }))
      const selectFn = vi.fn(() => ({ eq: eqFn }))
      vi.mocked(supabase.from).mockReturnValue({ select: selectFn } as any)

      const result = await getPendingInvitationsReceived('user-1')
      expect(eqFn).toHaveBeenCalledWith('recipient_profile_id', 'user-1')
      expect(eq2Fn).toHaveBeenCalledWith('status', 'PENDING')
      expect(result).toEqual([])
    })
  })
})
