"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Database, Layers, Sparkles, Users } from "lucide-react";

const flow = [
  {
    title: "Construct Your Brand Vault",
    text: "Define your visual presets, typography guidelines, primary channels, and exact brand tone of voice.",
    color: "bg-ash-white",
  },
  {
    title: "Track Social Signals",
    text: "Scan trending conversations on Reddit and LinkedIn, mapped directly against your brand preferences.",
    color: "bg-pixel-glare",
  },
  {
    title: "Launch Cohesive Campaigns",
    text: "Generate on-brand visual carousels, social threads, and presentations in one collaborative workspace.",
    color: "bg-digital-orange",
    textColor: "text-pure-white",
    iconColor: "text-pure-white bg-abyssal-ink border-pure-white",
  },
];

const surfaces = [
  { label: "Brand Vault", value: "presets & voice DNA", icon: Database, bg: "bg-digital-orange", text: "text-pure-white" },
  { label: "Content Queue", value: "active carousel drafts", icon: Layers, bg: "bg-cyber-violet", text: "text-pure-white" },
  { label: "Team Space", value: "collaborators & exports", icon: Users, bg: "bg-pixel-glare", text: "text-abyssal-ink" },
];

function Navbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 px-4 pt-4">
      <nav className="mx-auto flex w-full max-w-5xl items-center justify-between rounded-[40px] border-4 border-abyssal-ink bg-ash-white px-6 py-4 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]">
        <Link href="/" className="font-wordmark text-2xl font-bold text-abyssal-ink tracking-tight hover:text-digital-orange transition-colors">
          GenieStudio
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="gm-btn gm-btn-secondary hidden sm:inline-flex"
          >
            Sign in
          </Link>
          <Link href="/profile/setup" className="gm-btn gm-btn-primary">
            Start Free
            <ArrowRight className="h-4 w-4 stroke-[3]" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

function RadarPanel() {
  return (
    <div className="relative min-h-[29rem] overflow-hidden p-6 sm:p-8 bg-ash-white border-4 border-abyssal-ink rounded-[40px] shadow-[6px_6px_0px_0px_rgba(7,6,7,1)] flex flex-col justify-between">
      {/* Dashed Arcade Radar Grid */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-dashed border-abyssal-ink" />
        <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-dashed border-abyssal-ink" />
        <div className="absolute left-1/2 top-1/2 h-[100px] w-[100px] -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-dashed border-abyssal-ink" />
        <div className="absolute left-1/2 top-0 h-full w-[4px] bg-abyssal-ink border-dashed" />
        <div className="absolute left-0 top-1/2 h-[4px] w-full bg-abyssal-ink border-dashed" />
      </div>

      <div className="relative z-10 flex flex-col h-full gap-4 justify-between flex-1">
        <div className="flex items-center justify-between font-mono text-xs text-abyssal-ink font-bold mb-2">
          <span>Creative Intelligence Queue</span>
          <span className="flex items-center gap-1.5 text-digital-orange font-bold">
            <span className="h-3.5 w-3.5 rounded-full bg-digital-orange border-2 border-abyssal-ink animate-pulse" />
            Live Engine
          </span>
        </div>
        
        <div className="space-y-4 flex-1 flex flex-col justify-center">
          {surfaces.map((surface, index) => {
            const Icon = surface.icon;
            return (
              <div
                key={surface.label}
                className="flex items-center gap-4 p-4 bg-pure-white border-4 border-abyssal-ink rounded-[24px] shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] transition-all duration-150"
                style={{ marginLeft: `${index * 6}%` }}
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-[14px] border-2 border-abyssal-ink ${surface.bg} ${surface.text}`}>
                  <Icon className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-lg tracking-wider text-abyssal-ink leading-tight">{surface.label}</p>
                  <p className="font-mono text-xs text-abyssal-ink/60 font-semibold">{surface.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 rounded-[24px] border-4 border-abyssal-ink bg-pixel-glare p-5 shadow-[4px_4px_0px_0px_rgba(7,6,7,1)]">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-abyssal-ink font-bold flex items-center gap-1">
            <Sparkles className="h-4 w-4 text-digital-orange fill-digital-orange" />
            Product Objective
          </p>
          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-abyssal-ink font-semibold">
            Stop guessing what content performs. Formulate your brand DNA, visual styles, and channel presets to generate cohesive campaigns.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-basalt-canvas text-abyssal-ink pb-12">
      {/* Decorative large background violet arcade block */}
      <div className="absolute right-0 top-0 -z-10 h-[500px] w-[350px] bg-cyber-violet opacity-10 rounded-bl-[160px] pointer-events-none" />
      <div className="absolute left-0 bottom-0 -z-10 h-[400px] w-[300px] bg-pixel-glare opacity-15 rounded-tr-[160px] pointer-events-none" />

      <Navbar />
      <section className="gm-container grid min-h-screen items-center gap-12 pt-32 lg:grid-cols-[1.1fr_0.9fr] pb-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          <div className="space-y-5">
            <div className="gm-badge">
              <span className="gm-status-dot" />
              <span>Creative Intelligence Workspace</span>
            </div>
            <h1 className="gm-title">
              Your Brand Voice.<br />
              <span className="text-digital-orange">Generated in Seconds.</span>
            </h1>
            <p className="gm-subtitle">
              GenieStudio is a focused creative intelligence workspace for brand directors, writers, and teams. Construct a unified style profile, curate active trends, and generate custom presentations, carousels, and decks without visual drift.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row pt-2">
            <Link href="/profile/setup" className="gm-btn gm-btn-primary px-8 py-6 text-md font-bold shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] transition-all">
              Build Brand Vault
              <ArrowRight className="h-5 w-5 stroke-[3]" />
            </Link>
            <Link href="/login" className="gm-btn gm-btn-secondary px-8 py-6 text-md font-bold shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(7,6,7,1)] transition-all">
              Sign in
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <RadarPanel />
        </motion.div>
      </section>

      <section className="gm-container grid gap-8 pb-20 md:grid-cols-3">
        {flow.map((item) => (
          <article
            key={item.title}
            className={`relative overflow-hidden border-4 border-abyssal-ink rounded-[40px] p-8 shadow-[6px_6px_0px_0px_rgba(7,6,7,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(7,6,7,1)] transition-all duration-200 ${item.color} ${item.textColor || "text-abyssal-ink"}`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 border-abyssal-ink mb-6 font-bold ${item.iconColor || "bg-pure-white text-emerald-600"}`}>
              <CheckCircle2 className="h-6 w-6 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-display tracking-wider uppercase leading-none mb-3">{item.title}</h2>
            <p className="text-sm leading-relaxed font-semibold opacity-90">{item.text}</p>
          </article>
        ))}
      </section>

      <footer className="gm-container border-t-4 border-abyssal-ink pt-8 pb-12 font-mono text-xs text-abyssal-ink/75 font-semibold">
        <div className="flex flex-col justify-between gap-3 sm:flex-row">
          <span>GenieStudio / AI brand-aligned creative engine</span>
          <span>Designed for modern creative teams</span>
        </div>
      </footer>
    </main>
  );
}
