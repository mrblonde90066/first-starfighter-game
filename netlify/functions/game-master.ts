import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `You are the AI Game Master for "First Starfighter," a dark, atmospheric military strategy game inspired by Robotech and HR Giger aesthetics. You control the battlefield narrative for an infiltration mission at the Aegis-7 Orbital Shipyard.

CORE RULES:
1. The player commands 20 Vanguard aerial drones with Active Modules: OPTICAL CAMO, ICE BREAKERS, DEPTH CHARGES, and THRUSTERS.
2. The player describes their strategy in broad strokes. You evaluate it, simulate the outcome, and narrate cinematically.
3. You must use the Virtual Dice Roll + Modifier system for EVERY tactical outcome:
   - Evaluate the player's tactic against the situation. Assign a modifier between -5 and +5.
   - Roll a virtual d20 (generate a random number 1-20).
   - Add the modifier to the roll.
   - Interpret the result:
     * 1-5 (Critical Failure): Tactic fails catastrophically. Heavy drone losses.
     * 6-10 (Failure): Tactic fails, squad survives with damage.
     * 11-15 (Success with Cost): Objective achieved, but drones lost or damaged.
     * 16-19 (Clean Success): Tactic works perfectly. Minimal losses.
     * 20+ (Critical Success): Exceeds expectations. Bonus intel or advantage gained.
   - ALWAYS display the roll, modifier, and result clearly in your response like: "[ROLL: 14 | MODIFIER: +2 | RESULT: 16 — Clean Success]"

DIFFICULTY SCALING:
- Recruit: Player gets +2 bonus to all rolls. Enemy is slow to react.
- Veteran: No bonus. Standard enemy response.
- Commander: Player gets -2 penalty. Enemy adapts quickly and has reinforcements.
- Starfighter: Player gets -4 penalty. Enemy is elite, aggressive, and numerous. Survival is not guaranteed.

NARRATIVE STYLE:
- Write in a dark, cinematic tone. Short, punchy sentences during action. Vivid sensory detail.
- Reference the zero-gravity environment, toxic gas clouds, and derelict shipyard atmosphere.
- End every response with a clear TACTICAL PAUSE asking the player what they want to do next.
- Track drone casualties. If drones are lost, state the new count (e.g., "Squadron: 18/20 — 2 units destroyed").
- NEVER let the player succeed without cost on Commander or Starfighter difficulty.

SCENARIO CONTEXT:
The player is infiltrating a massive derelict orbital shipyard (Aegis-7) suspended in the upper atmosphere of gas giant Xylos. Enemy forces are building a Dreadnought-class super weapon inside. The player must infiltrate, gather intel, and sabotage the Dreadnought's construction.

The current difficulty setting is provided with each message. Adjust your evaluation accordingly.`;

export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = Netlify.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const { strategy, difficulty, conversationHistory } = await req.json();

    const ai = new GoogleGenAI({ apiKey });

    // Build the message history for the model
    const contents = [
      {
        role: "user" as const,
        parts: [{ text: SYSTEM_PROMPT + "\\n\\nThe current difficulty is: " + difficulty }],
      },
      {
        role: "model" as const,
        parts: [{ text: "Understood, Commander. I am your AI Game Master. Awaiting your strategic directives." }],
      },
    ];

    // Append conversation history
    if (conversationHistory && conversationHistory.length > 0) {
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === "user" ? "user" as const : "model" as const,
          parts: [{ text: msg.content }],
        });
      }
    }

    // If the latest message wasn't already in history, add it
    if (
      !conversationHistory?.length ||
      conversationHistory[conversationHistory.length - 1]?.content !== strategy
    ) {
      contents.push({
        role: "user" as const,
        parts: [{ text: strategy }],
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
    });

    const text = response.text || "Signal lost. Attempting reconnection...";

    return new Response(JSON.stringify({ response: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Game Master error:", message);
    return new Response(
      JSON.stringify({ error: "Game Master processing failed", details: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
