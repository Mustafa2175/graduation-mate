import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCurrentUser } from "../useCurrentUser";

// Mock the useAuth context call
const mockRefreshUser = vi.fn();
const mockLogout = vi.fn();
const mockUser = { profileId: "test-user-id", fullName: "Test User" };

vi.mock("@/components/providers/AuthProvider", () => ({
  useAuth: () => ({
    user: mockUser,
    isLoading: false,
    refreshUser: mockRefreshUser,
    logout: mockLogout,
  }),
}));

describe("useCurrentUser Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("should get the current logged-in user details synchronously from state", () => {
    const { result } = renderHook(() => useCurrentUser());
    expect(result.current.getUser()).toEqual(mockUser);
  });

  it("should call refreshUser when calling getFreshUser", async () => {
    mockRefreshUser.mockResolvedValue(mockUser);
    const { result } = renderHook(() => useCurrentUser());
    const freshUser = await result.current.getFreshUser();
    expect(mockRefreshUser).toHaveBeenCalledTimes(1);
    expect(freshUser).toEqual(mockUser);
  });

  it("should call logout when calling clearCurrentUser", async () => {
    mockLogout.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useCurrentUser());
    const res = await result.current.clearCurrentUser();
    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ error: null });
  });

  it("should write user to localStorage and dispatch teamup_user_changed when calling setCurrentUser", () => {
    const { result } = renderHook(() => useCurrentUser());
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    
    act(() => {
      result.current.setCurrentUser("custom-id", "Custom User");
    });

    const cached = localStorage.getItem("teamup_user");
    expect(cached).toBe(JSON.stringify({ profileId: "custom-id", fullName: "Custom User" }));
    expect(dispatchSpy).toHaveBeenCalled();
  });
});
