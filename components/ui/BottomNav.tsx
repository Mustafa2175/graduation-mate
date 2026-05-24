"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Database, Layers, Sparkles, Users } from "lucide-react";
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
    { href: "/discover", icon: Sparkles, label: "Trend Lab" },
    { href: "/matches", icon: Layers, label: "Saved Drafts" },
    { href: "/my-team", icon: Users, label: "Workspace" },
    { href: "/profile/edit", icon: Database, label: "Brand Vault" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t-4 border-abyssal-ink bg-ash-white pb-safe backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-11 w-20 flex-col items-center justify-center gap-1 rounded-[20px] border-2 px-2 font-mono text-[9px] uppercase tracking-[0.06em] transition-all duration-150 active:scale-95",
                isActive
                  ? "border-abyssal-ink bg-pure-white text-digital-orange font-bold"
                  : "border-transparent text-abyssal-ink/65 hover:text-abyssal-ink hover:bg-basalt-canvas/40",
              )}
            >
              <Icon className="h-5 w-5 stroke-[2.5]" />
              <span className="leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
