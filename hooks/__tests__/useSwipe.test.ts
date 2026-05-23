import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSwipe } from "../useSwipe";
import { getDiscoverProfiles } from "@/lib/queries/profiles";
import {
  getSwipedIds,
  insertSwipe,
  checkMutualMatch,
  resetSwipes,
} from "@/lib/queries/swipes";
import { createMatch } from "@/lib/queries/matches";

// Mock the dependencies
vi.mock("../useCurrentUser", () => ({
  useCurrentUser: () => ({
    getFreshUser: async () => ({ profileId: "user-id", fullName: "User Name" }),
  }),
}));

vi.mock("@/lib/queries/profiles", () => ({
  getDiscoverProfiles: vi.fn(),
}));

vi.mock("@/lib/queries/swipes", () => ({
  getSwipedIds: vi.fn(),
  insertSwipe: vi.fn(),
  checkMutualMatch: vi.fn(),
  resetSwipes: vi.fn(),
}));

vi.mock("@/lib/queries/matches", () => ({
  createMatch: vi.fn(),
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("useSwipe Hook", () => {
  const mockProfiles = [
    { id: "1", full_name: "Profile 1", track: "AI", skills: [], is_available: true, team_status: "LOOKING" },
    { id: "2", full_name: "Profile 2", track: "Web", skills: [], is_available: true, team_status: "LOOKING" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should load profiles and set index on mount", async () => {
    vi.mocked(getSwipedIds).mockResolvedValue(["3"]);
    vi.mocked(getDiscoverProfiles).mockResolvedValue({ data: mockProfiles, error: null } as any);

    const { result } = renderHook(() => useSwipe());

    // Wait for the async useEffect to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(getSwipedIds).toHaveBeenCalledWith("user-id");
    expect(getDiscoverProfiles).toHaveBeenCalledWith("user-id", ["3"]);
    expect(result.current.profiles).toEqual(mockProfiles);
    expect(result.current.currentIndex).toBe(1);
    expect(result.current.isLoading).toBe(false);
  });

  it("should decrease currentIndex when swiping", async () => {
    vi.mocked(getSwipedIds).mockResolvedValue([]);
    vi.mocked(getDiscoverProfiles).mockResolvedValue({ data: mockProfiles, error: null } as any);

    const { result } = renderHook(() => useSwipe());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.handleSwipe("LEFT", mockProfiles[1] as any);
    });

    expect(insertSwipe).toHaveBeenCalledWith("user-id", "2", "LEFT");
    expect(result.current.currentIndex).toBe(0);
  });

  it("should create a match if mutual swiped RIGHT", async () => {
    vi.mocked(getSwipedIds).mockResolvedValue([]);
    vi.mocked(getDiscoverProfiles).mockResolvedValue({ data: mockProfiles, error: null } as any);
    vi.mocked(checkMutualMatch).mockResolvedValue(true);

    const { result } = renderHook(() => useSwipe());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.handleSwipe("RIGHT", mockProfiles[1] as any);
    });

    expect(insertSwipe).toHaveBeenCalledWith("user-id", "2", "RIGHT");
    expect(checkMutualMatch).toHaveBeenCalledWith("user-id", "2");
    expect(createMatch).toHaveBeenCalledWith("user-id", "2");
  });

  it("should clear swiped list and reload all profiles when resetting swipe queue", async () => {
    vi.mocked(getDiscoverProfiles).mockResolvedValue({ data: mockProfiles, error: null } as any);

    const { result } = renderHook(() => useSwipe());

    await act(async () => {
      await result.current.resetSwipeQueue();
    });

    expect(resetSwipes).toHaveBeenCalledWith("user-id");
    expect(getDiscoverProfiles).toHaveBeenLastCalledWith("user-id", []);
    expect(result.current.profiles).toEqual(mockProfiles);
    expect(result.current.currentIndex).toBe(1);
  });
});
