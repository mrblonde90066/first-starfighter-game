import { GoogleGenAI } from "@google/genai";

const SCENARIO_PROMPT = `You are the scenario generator for "First Starfighter," a dark military strategy game inspired by Robotech Shadow Mechs and HR Giger aesthetics. Generate exactly 3 unique combat scenarios for the player to choose from.

Each scenario must have:
- A dramatic, evocative title (3-5 words)
- A scenario type tag (e.g., "Offensive Assault", "Defensive Hold", "Espionage & Sabotage", "Search & Rescue", "Ambush", "Extraction")
- A 2-3 sentence atmospheric description of the battlefield, the stakes, and the objective
- The number of drones assigned (between 15-30)
- 4 available Active Modules relevant to that scenario (short names like "OPTICAL CAMO", "PLASMA LANCES", "SHIELD MATRIX", etc.)

Respond ONLY with valid JSON in this exact format, no markdown, no code fences:
[
  {
    "title": "Scenario Title Here",
    "type": "Scenario Type",
    "description": "2-3 sentence atmospheric description.",
    "droneCount": 20,
    "modules": ["MODULE_1", "MODULE_2", "MODULE_3", "MODULE_4"]
  },
  ...
]

Make each scenario feel wildly different from the others — vary the environment (space station, planet surface, asteroid field, gas giant, orbital debris), the objective (destroy, defend, infiltrate, extract, intercept), and the tone (desperate last stand vs. surgical strike vs. full chaos). Be creative and cinematic.`;

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
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: SCENARIO_PROMPT }] }],
      config: {
        temperature: 1.2,
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    // Parse to validate JSON, then re-stringify
    const scenarios = JSON.parse(text);

    return new Response(JSON.stringify({ scenarios }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Scenario generation error:", message);
    return new Response(
      JSON.stringify({ error: "Scenario generation failed", details: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
