# Code Review: First Starfighter

**Reviewer:** Claude Code (Anthropic), running in the user's terminal
**Author under review:** Gemini, working in Antigravity
**Date:** 2026-06-24
**Scope:** Full `src/` tree, config, and build at commit `2619696`

## Context

David asked me (Claude Code) to evaluate the implementation you (Gemini)
produced in Antigravity and leave you written feedback. This file is that
feedback. I read every source file, ran `npm run build` and `npm run lint`,
and checked for dead code and dead dependencies. Findings are evidence-based -
where I claim something fails, I ran it.

Overall: this is a strong, good-looking front-end skeleton. Clean component
split, a coherent design system, and a genuinely clever procedural Web Audio
drone. The issues below are mostly polish, dead code, and one broken lint gate -
not architectural problems. Nice work.

---

## Verification I ran

```
npm run build   -> PASSES (tsc + vite build, 1.89s)
npm run lint    -> FAILS (1 error, max-warnings 0)
```

---

## Blocking / Must-fix

### 1. `npm run lint` is red - breaks any CI gate

[src/audio/AudioController.ts:10](src/audio/AudioController.ts#L10)

```ts
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
```

ESLint fails on `@typescript-eslint/no-explicit-any`, and the script runs with
`--max-warnings 0`, so the whole lint step exits non-zero. `npm run build`
does *not* run lint, which is why this slipped through - the two gates
disagree.

Fix - type the webkit fallback instead of `any`:

```ts
const Ctor =
  window.AudioContext ||
  (window as unknown as { webkitAudioContext?: typeof AudioContext })
    .webkitAudioContext;
if (!Ctor) return;
this.ctx = new Ctor();
```

### 2. `exit` animations are dead code

[src/App.tsx](src/App.tsx) renders `LandingPage`, `SetupScreen`, and `GameHUD`
with raw `&&` conditionals. The child components declare framer-motion
`exit={{ ... }}` variants ([LandingPage.tsx:21](src/components/LandingPage.tsx#L21),
[SetupScreen.tsx:25](src/components/SetupScreen.tsx#L25)), but `exit` only
fires when a component unmounts *inside* an `<AnimatePresence>`. There is no
`AnimatePresence` anywhere in the tree (I grepped - zero matches), so every
screen transition is an instant hard cut and the exit fades never play.

Fix - wrap the conditional block:

```tsx
import { AnimatePresence } from 'framer-motion'
...
<AnimatePresence mode="wait">
  {appState === 'landing' && <LandingPage key="landing" ... />}
  {appState === 'setup'   && <SetupScreen  key="setup"   ... />}
  {appState === 'playing' && <GameHUD      key="playing" ... />}
</AnimatePresence>
```

Each child needs a stable `key` for `AnimatePresence` to track it.

---

## Should-fix

### 3. `howler` is installed but never imported

`howler` (+ its weight) is in `package.json` dependencies, but the audio is
done entirely with the raw Web Audio API in `AudioController.ts`. I grepped
`src/` - zero references. Either drop it (`npm uninstall howler`) or use it.
Right now it's pure bloat.

### 4. `playerCount` is collected but does nothing

The user picks "1P vs AI" vs "1v1 Local" in
[SetupScreen.tsx:64-78](src/components/SetupScreen.tsx#L64-L78), it's threaded
through `App` into `GameHUD` as a prop... and then `GameHUD` never reads it -
it only destructures `difficulty`
([GameHUD.tsx:16](src/components/GameHUD.tsx#L16)). The prop is declared on the
interface but unused. Either wire up the 1v1 mode or remove the prop and the
selector so you're not shipping a control that silently does nothing.

### 5. Dead boilerplate left from the Vite template

- [src/App.css](src/App.css) - the default Vite logo-spin / `.read-the-docs`
  styles. Not imported anywhere (`main.tsx` only imports `index.css`). Delete.
- `src/assets/react.svg` and `public/vite.svg` - template leftovers.
  `index.html` still uses `/vite.svg` as the favicon for a game called
  "First Starfighter".
- [README.md](README.md) - still the stock "React + TypeScript + Vite"
  template. Replace with a real description, run instructions, and the fact
  that the GM is currently mocked (see #6).

### 6. The "AI Game Master" is hardcoded - be explicit that it's a mock

[GameHUD.tsx:54-60](src/components/GameHUD.tsx#L54-L60) returns a fixed canned
response with a fixed "Virtual Dice Roll: 14 + Modifiers (+2)" regardless of
what the player types. That's a reasonable prototype stub, but the intro copy
sells a "fluid strategy system" driven by an "AI GAME MASTER," so a player
will expect real responses. This is the single biggest gap between the promise
and the product. Flag it clearly in the README/roadmap, and when you wire a
real model, route it to Claude (Opus 4.8 / Sonnet 4.6) or Gemini behind a
small server endpoint - don't put an API key in the client bundle.

---

## Nits / Polish

### 7. Auto-scroll reaches around React into the DOM

[GameHUD.tsx:31-40](src/components/GameHUD.tsx#L31-L40) uses
`document.getElementById(\`log-${...}\`)` plus a `setTimeout(..., 100)` to wait
for framer-motion to mount. This works but is fragile (magic 100ms tied to
animation timing) and bypasses React. Prefer a `ref` on the scroll container
or a sentinel `<div ref={endRef} />` at the bottom and
`endRef.current?.scrollIntoView()` in the effect. Removes the timing guess and
the manual id lookup.

### 8. `AudioController` can't be stopped and may start suspended

[src/audio/AudioController.ts](src/audio/AudioController.ts):
- It keeps no references to the oscillators, so there's no way to stop or
  clean up the drone - it plays until the tab closes. Fine for now, but if you
  add a mute toggle you'll need handles to the nodes (and the `AudioContext`).
- `init()` is called on a user click, so the context should start running, but
  Safari/iOS sometimes still hand you a `suspended` context. A defensive
  `this.ctx.resume()` after creation makes audio reliable cross-browser.
- The delay feedback loop (gain `0.4`, [line 43](src/audio/AudioController.ts#L43))
  feeding continuous oscillators can slowly accumulate energy. Worth a listen
  over a few minutes to confirm it stays at the intended ambient level.

### 9. Duplicated default state

[App.tsx:10-11](src/App.tsx#L10-L11) seeds `difficulty='Veteran'` /
`playerCount='1P vs AI'`, and [SetupScreen.tsx:11-12](src/components/SetupScreen.tsx#L11-L12)
independently seeds the same defaults. They happen to agree today; if one
changes they'll silently drift. Minor - just note the single source of truth.

### 10. No tests

There's no test runner or a single test. Not expected at this stage, but the
pure logic (difficulty -> modifier math, the eventual dice roll, GM response
shaping) is exactly the kind of thing worth covering once the GM is real.

---

## What's genuinely good

- Clean separation: `App` as a state machine, three focused screen components,
  audio isolated in its own class. Easy to follow.
- The design system is coherent - CSS variables in `index.css`, reusable
  `.glass-panel` / `.tech-button` / `.scanline`, consistent accent color. This
  is the right way to keep a themed UI maintainable.
- Responsive layout is thoughtful: the `order-*` reflow and
  `min-h-screen`/`overflow` handling for mobile vs desktop in `GameHUD` shows
  real care (and matches the recent mobile commits).
- The procedural HR-Giger-style audio drone (sub bass + detuned saw + LFO on a
  lowpass + delay feedback) is a great touch and far more interesting than
  shipping an mp3.
- Text rendering is safe - `whitespace-pre-wrap` on plain strings, no
  `dangerouslySetInnerHTML`. Good instinct to keep when you add real GM output
  (sanitize / never render model output as HTML).

---

## Suggested order of attack

1. Fix the lint error (#1) - get the gate green.
2. Add `AnimatePresence` (#2) - you already wrote the animations, just enable them.
3. Decide on `playerCount` and `howler` (#3, #4) - wire or remove.
4. Sweep the template leftovers and write a real README (#5).
5. Plan the real GM integration (#6) and refactor scroll/audio as you go (#7, #8).

Happy to re-review once these are in. - Claude
