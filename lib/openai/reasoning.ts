import OpenAI from "openai";
import type { Team } from "@/types/world-cup";
import type { MatchPrediction } from "@/features/predictions/match-engine";

export async function enhancePredictionReasoning(
  home: Team,
  away: Team,
  base: MatchPrediction,
): Promise<{ reasons: string[]; risk: string }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { reasons: base.reasons, risk: base.risk };

  try {
    const client = new OpenAI({ apiKey });
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a World Cup pre-match analyst. Given structured stats, write 3 concise bullet reasons and one risk factor. Return JSON: { reasons: string[], risk: string }. Do not invent injuries not in the data.",
        },
        {
          role: "user",
          content: JSON.stringify({
            home: { name: home.name, elo: home.elo, form: home.form, xg: home.xg, host: home.host },
            away: { name: away.name, elo: away.elo, form: away.form, xg: away.xg, host: away.host },
            prediction: base,
          }),
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return { reasons: base.reasons, risk: base.risk };
    const parsed = JSON.parse(content) as { reasons?: string[]; risk?: string };
    return {
      reasons: parsed.reasons?.length ? parsed.reasons : base.reasons,
      risk: parsed.risk ?? base.risk,
    };
  } catch {
    return { reasons: base.reasons, risk: base.risk };
  }
}
