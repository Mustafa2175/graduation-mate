TeamUp — Full UI/UX Audit

**Scope:** Code review of all app surfaces (landing, auth, onboarding, discover, matches, teams, profile edit).  
**Lens:** Pre–closed beta, mobile-first student product — clarity and trust over flash.  
**Overall grade:** **B− / “promising MVP, visually fragmented”** — usable core loop, but inconsistent identity and dating-app cues undermine trust before wider beta.

---

## 1. Executive UI Review

### Overall assessment

TeamUp has **real product thinking** in places (5-step onboarding, contact gating, team preference cards) but reads as **three different apps stitched together**:

| Surface | Visual language |
|--------|------------------|
| Landing | Cream + blue CTA, Instrument Serif, hero video |
| Login / setup | White + black glass, cinematic video |
| Discover / matches / my-team | Gray shell, orange accent `#ef4d23`, utilitarian cards |
| Profile edit | Dark navy `#00172B`, liquid glass, full-screen video |

A student opening the app after signup will feel a **tone shift** from “premium onboarding” to “generic swipe tool” to “dark creative portfolio” on profile edit.

### Biggest strengths

1. **Onboarding structure** — Segmented progress, step-scoped forms, team preference cards (solo / leader / member) are clear and student-relevant.
2. **Discover card content** — Track, skills, bio expand, team status pills give enough context to decide without opening a profile.
3. **Match contact gating** — Locked → waiting → unlocked states are understandable; copy (“Share My Contact”) matches the mental model.
4. **Touch targets on swipe actions** — 64×64px pass buttons are appropriately sized.
5. **Shell constraint** — `max-w-5xl` centered column works well for phone-in-browser and desktop preview.
6. **Empty / error states exist** — Discover empty queue, matches empty, discover load error are handled (not blank screens).

### Biggest visual weaknesses

1. **Brand schizophrenia** — “TeamUp” vs “Convix Matchmaking” on discover; landing blue vs app orange vs violet toggles.
2. **Dating-app metaphor overload** — Tinder card, heart like, “YES!” / “SKIP” stamps, Heart in bottom nav for “Matches.”
3. **Typography at illegible sizes** — Widespread `text-[9px]`–`text-[11px]` on matches and team UI (fails comfortable mobile reading).
4. **No design tokens** — Colors, radii, shadows copied per file; avatar background logic duplicated **four ways**.
5. **Safe area likely broken** — `pb-safe` on BottomNav with **no `safe-area` utility defined** in `globals.css`.
6. **Cinematic video everywhere** — Login, setup, profile edit, landing; hurts performance perception and `prefers-reduced-motion` users.

---

## 2. Critical UX Problems (must-fix before wider beta)

| # | Issue | Why it matters | Where |
|---|--------|----------------|--------|
| C1 | **“Convix Matchmaking” on Discover** | Wrong product name; looks like white-label or unfinished rebrand | `app/discover/page.tsx` — badge + headline area |
| C2 | **Dating-app interaction language** | Heart like, YES!/SKIP overlays, “Matches” with Heart icon — students may not trust it for academics | `SwipeCard`, `SwipeButtons`, `BottomNav` |
| C3 | **`pb-safe` not implemented** | Bottom nav can sit under iPhone home indicator; taps miss | `BottomNav.tsx` + missing CSS |
| C4 | **Contact share toggle too small** | ~36×20px switch; below 44×44px touch guideline | `app/matches/page.tsx` |
| C5 | **Match cards unreadable on phones** | 2-column grid + 9–11px type + dense sections = cognitive overload | `app/matches/page.tsx` |
| C6 | **Commitment badge shown, never set** | Everyone reads “Medium commitment”; erodes trust | `ProfileCard`, no edit UI |
| C7 | **Discover header eats vertical space** | Badge + 3xl/4xl headline leaves little room for card on short phones | `discover/page.tsx` |
| C8 | **Profile edit is a different product** | Dark full-bleed video vs light app — disorienting after every other screen | `app/profile/edit/page.tsx` |
| C9 | **No step labels in onboarding** | Users see 5 bars but not “Step 2 of 5 — Track” | `profile/setup/page.tsx` |
| C10 | **Authed users can still hit `/profile/setup`** | Duplicate signup confusion (UX, not just auth) | proxy public route |

---

## 3. Important UI Improvements (high-impact polish)

- **Unify primary brand color** — Pick one accent (recommend keeping `#ef4d23` OR landing `#0871E7`, not both) and apply to CTAs, active nav, links.
- **Rename / reframe swipe actions** — “Interested” / “Not now” instead of heart/X; remove YES!/SKIP stamps or replace with subtle “Team fit?” / “Pass”.
- **Matches: single column on mobile** — One card per row &lt; `sm`; keep 2+ cols from `md` up.
- **Add onboarding step titles** — e.g. “2 of 5 · Your track” under the progress bar.
- **Standardize page headers** — One pattern: title + 1-line subtitle + optional badge (discover currently over-indexed on marketing copy).
- **Extract avatar color helper** — One `getAvatarBg()` in `lib/utils.ts` (audit already flagged 4 implementations).
- **Reduce video on utility screens** — Static gradient or poster on login/setup; reserve motion for landing only.
- **Improve match contact gating copy** — “Share my WhatsApp/LinkedIn with this match” is clearer than generic “Share My Contact”.
- **Discover empty state** — “Reset queue” is game-like; reframe as “Review students again” with explanation of why queue ended.
- **Loading skeletons** — Match discover’s structured skeleton; apply same pattern to matches, my-team, profile edit.
- **Team invite UX** — Copy team ID is opaque; label as “Team code” with format hint and success toast (partially exists on my-team).

---

## 4. Mobile-First Audit

### Ergonomics

| Good | Problem |
|------|---------|
| Swipe buttons 64px | Nav items ~64px wide but only icon+10px label — tap target OK, label hard to read |
| Step team cards min-h 110px | Match contact toggle too small |
| Form inputs `py-3` (~48px height) | Custom toggle switches not using accessible `Toggle` component |

### Spacing

- Layout uses `pb-20` globally but pages also use `pb-28`, `h-[calc(100vh-80px)]` — **inconsistent bottom inset**; content can hide under nav.
- Discover: `p-3` outer + header `mb-5` + buttons `mt-6` — tight on iPhone SE.
- Onboarding: `pt-16` header + video inset `inset-[300px_0_0_0]` — video may not show on short screens (acceptable) but pushes form down.

### Touch targets

- Match card team link chevron ~28px — small.
- Skill remove “×” on chips — small.
- Bio “read more” text link — small tap area.

### Scrolling

- Matches page: `overflow-y-auto` inside fixed height — OK.
- Profile edit: long form + video background — scroll works but heavy.
- Landing: `fixed inset-0 z-[100]` — separate from app shell; fine for marketing.

### Keyboard

- Step 1 stacks email + password + department + GPA — **long first screen**; keyboard covers half on mobile.
- Track/role comboboxes use `onBlur` + 200ms timeout — can fight keyboard “Done” on iOS.
- No `inputMode` / `enterKeyHint` tuning for phone/email fields.

---

## 5. Desktop Adaptation Audit

### What works

- Centered `max-w-5xl` column prevents ultra-wide stretch.
- Discover swipe stack `max-w-sm mx-auto` — correct centering on desktop.
- Profile edit `lg:grid-cols-2` — sensible use of width.
- Onboarding `max-w-xl` — comfortable form width.

### What feels awkward

| Issue | Detail |
|-------|--------|
| **Bottom nav full viewport width** | On 1440px screens, nav spans entire width while content is 5xl — visually disconnected |
| **Matches 4-column grid** | Cards become postage stamps; contact UI unusable |
| **Hover states on touch-first controls** | `hover:scale-105` on swipe buttons irrelevant on desktop trackpad-only users |
| **Mouse drag on TinderCard** | Works but no affordance that cards are draggable except cursor-grab |
| **Landing hero** | Video full-bleed inside fixed container — fine; no desktop CTA to login (only Sign up) |

### Responsive improvements (without redesign)

- Cap match grid at `md:grid-cols-2 lg:grid-cols-3` with **min card width** (~280px).
- Optionally hide bottom nav on `lg+` and add top tabs (post-beta).
- Align bottom nav bar to `max-w-5xl` container width on desktop.

---

## 6. Visual Consistency Audit

### Colors (at least 4 primaries in use)

- Landing CTA: `#0871E7`
- App accent: `#ef4d23`
- Discover text: `#0b0f1a`
- Profile edit: `#00172B` + white glass
- Violet: `violet-600` (toggles, role highlights, StepTeamSize selected size)

### Radius

- `rounded-xl` (buttons, inputs)
- `rounded-2xl` (cards, nav items)
- `rounded-3xl` (panels, discover container)
- `rounded-full` (CTAs, swipe buttons)

**No documented scale** — feels arbitrary.

### Shadows

- `shadow-sm`, custom `shadow-[0_8px_30px...]`, `shadow-2xl` on login card — inconsistent depth language.

### Components

| Component | Inconsistency |
|-----------|----------------|
| **Button** | `Button.tsx` = gray rounded-xl full-width; login = black rounded-full; discover = orange rounded-full uppercase |
| **Input** | Default gray focus ring vs onboarding black focus ring via className overrides |
| **Badge** | Same component, good — but track colors from `getTrackBadge` vs inline commitment colors |
| **Glass** | `light-glass`, `liquid-glass`, ad-hoc `bg-white/90 backdrop-blur` |

### Duplicated logic (visual impact)

- `getAvatarBg` — flat colors (ProfileCard, matches) vs gradients (my-team, teams/[id]) vs lighter flat (TeammateAvatars)
- `TRACK_OPTIONS` — duplicated in edit + StepTrack (maintenance → visual drift)

---

## 7. Product Feel Audit

### Trustworthy?

**Mixed.**

- **Positive:** University email copy, department select, GPA optional, contact gating, team invite codes.
- **Negative:** Dating swipe metaphor, “everyone medium commitment,” reset queue gamification, wrong “Convix” branding, profile scraping concern not visible in UI but GPA on cards is sensitive for some students.

### Student-friendly?

**Partially.**

- Team preference cards with emoji icons are approachable.
- Department values like `CS_NATIONAL` are **admin codes**, not student language.
- Copy like “Shaping Teams of tomorrow” sounds like startup marketing, not campus peer tool.

### Too much like a dating app?

**Yes, especially Discover.**

```39:47:components/discover/SwipeCard.tsx
        {isTop && dragDir === 'RIGHT' && (
          <motion.span className="...">YES!</motion.span>
        )}
        {isTop && dragDir === 'LEFT' && (
          <motion.span className="...">SKIP</motion.span>
        )}
```

Plus heart button, mutual “matches,” and Heart nav icon. For graduation teams, reframing as **“Connect” / “Saved teammates” / “Pass”** would change perception quickly without changing logic.

### Empty / fake anywhere?

- Empty discover encourages **resetting swipes** — can feel artificial if same profiles repeat.
- Seed/demo data not distinguished in UI — fine for beta if labeled internally.
- Typing “Team not found.” on landing loop — clever but **off-brand** and slightly anxious for a team-finder.

---

## 8. Animation & Motion Audit

| Location | Motion | Verdict |
|----------|--------|---------|
| Landing hero | Framer scale-in | OK, once |
| TypingMessages | Infinite typewriter + blink | Charming but distracting; no `prefers-reduced-motion` |
| Login/setup video | `requestAnimationFrame` opacity loop | **Expensive**; runs entire session |
| SwipeCard | Tinder drag | Core interaction — keep |
| SwipeButtons | `scale-105` hover/active | OK on press; hover useless mobile |
| Matches waiting | `animate-pulse` on lock text | Acceptable; reduce if motion-sensitive |
| Onboarding | `animate-fade-rise` | Subtle, good |

**Recommendations:** Respect `prefers-reduced-motion: reduce`; replace rAF video fades with CSS `opacity` on `canplay` only; remove pulse on “waiting for response” or slow it down.

---

## 9. Accessibility Audit

| Area | Status | Notes |
|------|--------|-------|
| **Contrast** | ⚠️ | `text-gray-400` at 10px on white; amber/emerald status text borderline |
| **Touch size** | ⚠️ | Match toggle, small links |
| **Keyboard** | ⚠️ | Role comboboxes have arrow keys; many custom buttons lack focus styles |
| **Screen readers** | ⚠️ | Swipe buttons have `aria-label`; toggle doesn’t; stamps are visual only |
| **Color dependency** | ⚠️ | Availability dot, lock states use color + icon (OK-ish) |
| **Motion** | ❌ | No reduced-motion path |
| **Forms** | ✅ | Labels tied to inputs in `Input` component |
| **Images** | ✅ | Avatars generally have `alt` |

**Quick wins:** `aria-pressed` on contact toggle, `role="switch"`, larger hit slop, `text-xs` minimum for secondary copy (12px).

---

## 10. Recommended UI Roadmap

### Immediate visual fixes (1–3 days, pre–wider beta)

1. Fix branding: TeamUp everywhere; remove “Convix.”
2. Implement `env(safe-area-inset-bottom)` on BottomNav + layout padding.
3. Swipe UX copy: remove YES!/SKIP or soften; change heart → “Connect” iconography.
4. Matches: 1 column mobile; bump type to 12px minimum; enlarge contact toggle.
5. Add onboarding step label (“Step X of 5”).
6. Unify page background (pick light gray shell OR white — use on discover, matches, my-team).
7. Tone down discover marketing header (smaller title, more card space).
8. `prefers-reduced-motion` + disable rAF video loops on auth screens.

### Beta polish improvements (1–2 weeks)

1. **Mini design tokens in `globals.css`** — `--color-brand`, `--radius-card`, `--shadow-card`, `--text-caption`.
2. Consolidate `getAvatarBg` + button variants in shared components.
3. Align profile edit with app shell (light header, no full-screen video) — **visual only**, same fields.
4. Improve match contact gating microcopy + optional explainer tooltip.
5. Skeleton parity across matches, my-team, profile edit.
6. Desktop: constrain bottom nav to content width; cap match grid columns.
7. Landing: add “Log in” link; video `poster`; respect reduced motion.
8. Hide or relabel commitment badge until editable.

### Post-beta redesign opportunities (do not block beta)

- Top navigation on desktop; bottom nav mobile-only.
- Profile edit decomposition into subcomponents.
- Rich profile preview before swiping.
- Filter chips on discover (track, department).
- Illustration system for empty states (replace emoji-only).
- Optional “student mode” vs “demo mode” banner.

---

## 11. What NOT to redesign right now

| Keep stable | Reason |
|-------------|--------|
| 5-step onboarding **flow** | Works; only polish copy, spacing, labels |
| Swipe **mechanics** (TinderCard) | Core loop; re-skin only |
| Bottom nav **IA** (4 tabs) | Familiar mobile pattern |
| Contact gating **logic & layout sections** | Trust feature; clarify copy/size only |
| `max-w-5xl` app shell | Good responsive constraint |
| Team preference card pattern (solo/leader/member) | Strong UX |
| `Input` / `Button` base components | Extend variants, don’t rewrite |
| Discover **ProfileCard information architecture** | Density tweaks only |
| Auth pages **form structure** | No architecture change |

### Already good enough for closed beta

- Segmented progress bar on setup.
- Discover error state with retry.
- Match empty state + CTA to discover.
- Skill chips + combobox patterns in onboarding.
- Toast placement (`top-center`).
- GPA/track/skills on discover cards (with commitment caveat).

### Dangerous redesigns to avoid before beta

- Replacing swipe with list + buttons only (changes habit loop).
- Merging onboarding into single long form (increases drop-off).
- Full rebrand / new font system (high regression risk).
- Removing bottom nav for hamburger menu.
- Rebuilding match cards as chat-first UI.
- Enterprise design system (tokens + Storybook + etc.) — overkill for ~50 users.

---

## Screen-by-screen notes (condensed)

### Navigation (`BottomNav.tsx`)

- Heart for Matches reinforces dating metaphor → use `Users`, `Handshake`, or `Sparkles`.
- Active state = darker gray + icon fill — subtle; add top indicator dot or brand-color fill.
- `pb-safe` ineffective until CSS added.
- No badge for new matches count (optional polish).

### Discover

- Information density on `ProfileCard` is **high but acceptable** for beta; trim commitment if not real.
- `min-h-[360px]` may clip tall bios on small devices.
- Unused nested `team_members` in query while `TeammateAvatars` refetches — perf perception issue (not UI-only).

### Onboarding

- Strong step 4 team cards; step 1 is heaviest.
- Video + white gradient is pretty but competes with form on mobile.
- Final step bundles avatar + contacts + submit — appropriate climax.

### Matches & teams

- Contact unlock UX is **functionally clear**, visually cramped.
- “Connection unlocked!” is casual — good for students.
- Team block on match cards is valuable; chevron link is easy to miss.

### Visual design / landing

- Landing is the **most polished** screen; app interior doesn’t match that promise.
- Nokia font on typing widget is playful but inconsistent with Inter/Instrument elsewhere.

---

## Summary scorecard

| Dimension | Score | Note |
|-----------|-------|------|
| Mobile usability | 6.5/10 | Swipe good; matches grid and nav safe area hurt |
| Desktop usability | 7/10 | Shell works; match grid breaks |
| Visual consistency | 4/10 | Multiple products in one |
| Trust / student fit | 6/10 | Gating helps; dating metaphor hurts |
| Accessibility | 5/10 | Basics present; size/contrast/motion gaps |
| Polish / perceived quality | 6/10 | Peaks on landing/setup, valleys on discover/edit |

**Bottom line:** The product is **beta-viable for a small closed pilot** after fixing branding, dating-app cues, safe areas, and match readability. The highest ROI path is **one visual pass** (tokens + accent color + copy/icons) rather than a full redesign.

If you want to move into implementation next, a sensible order is: **(1) safe area + branding, (2) discover de-dating, (3) matches mobile layout + toggle size, (4) token + avatar helper consolidation** — all without touching auth or database.