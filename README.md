# First Starfighter

A dark, atmospheric military strategy game where you command a fleet of aerial drones in high-stakes infiltration missions. Inspired by Robotech Shadow Mechs and HR Giger aesthetics.

## How It Works

You play as the Supreme Commander, issuing fluid strategic directives to your AI Game Master. Describe your tactics in broad strokes — the AI evaluates your strategy, rolls virtual dice with tactical modifiers, and narrates the cinematic outcome. Every decision carries risk.

## Tech Stack

- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Audio:** Procedural Web Audio API synthesizer (dark ambient drone)
- **AI Backend:** Netlify Serverless Functions → Google Gemini API
- **Hosting:** Netlify

## Local Development

```bash
npm install
npm run dev
```

## Environment Variables

For the AI Game Master to function, set `GEMINI_API_KEY` in your Netlify dashboard under **Site Settings → Environment Variables**.

## Game Modes

- **1P vs AI** — Single player against the AI Game Master
- **1v1 Local** — Coming soon

## Difficulty Levels

| Level | Description |
|-------|-------------|
| Recruit | High margin for error. Zero casualties likely. |
| Veteran | Moderate risk. Standard strategic evaluation. |
| Commander | High risk. Even perfect strategies incur cost. |
| Starfighter | Nightmare. Survival is not guaranteed. |
