"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Compass, Handshake, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();

  if (
    isLoading ||
    !user ||
    pathname === "/login" ||
    pathname === "/profile/setup"
  ) {
    return null;
  }

  const navItems = [
    { href: "/discover", icon: Compass, label: "Discover" },
    { href: "/matches", icon: Handshake, label: "Connections" },
    { href: "/my-team", icon: Users, label: "My Team" },
    { href: "/profile/edit", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-2xl border-t border-white/50 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
      <div className="w-full max-w-5xl mx-auto flex justify-around items-center px-6 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl transition-all duration-200 w-16",
                isActive
                  ? "text-gray-900"
                  : "text-gray-400 hover:text-gray-600",
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-gray-900")} />
              <span
                className={cn(
                  "text-[11px] font-semibold tracking-wide",
                  isActive && "text-gray-900",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
