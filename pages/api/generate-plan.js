// pages/api/generate-plan.js
//
// Builds the actual 7-day plan deterministically from our own recipe database
// (lib/recipes.js) — the SAME rule set as the personal app: no onion/garlic,
// season-aware, rotation-aware. OpenAI is used only to write a short, friendly
// personalization note based on the visitor's goal and household — it does
// NOT invent the recipes or combinations. This keeps the actual meal logic
// reliable (no hallucinated ingredient combos) and keeps the AI cost small
// (one short completion per request, not one per recipe).

const {
  SEED_RECIPES,
  RECIPE_BY_ID,
  ING_BY_ID,
  YOUTUBE_LINKS,
  generateWeek,
  getCurrentSeason,
  getMonday,
  scaleQty,
  formatQty,
  getDishEmoji,
} = require("../../lib/recipes");

const GOAL_LABELS = {
  weight_loss: "a weight-loss-friendly diet",
  protein_rich: "a protein-rich diet",
  balanced: "a balanced, everyday diet",
  gentle: "gentler, lower-oil food (e.g. for BP/cholesterol or older family members)",
};

function ageToHousehold(members) {
  // Website collects individual ages; our generator's portion model works in
  // adults/kids, so we bucket here. 13+ treated as adult-portion eaters.
  let adults = 0;
  let kids = 0;
  for (const m of members) {
    const age = Number(m.age) || 0;
    if (age >= 13) adults++;
    else kids++;
  }
  if (adults === 0 && kids === 0) adults = 2; // sane fallback
  return { adults: Math.max(adults, 1), kids, kidFactor: 0.5 };
}

async function getPersonalizationNote({ goal, customGoal, household, selectedMeals }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null; // caller falls back to a plain, non-AI note
  }

  const goalDescription = goal === "other" && customGoal ? customGoal : GOAL_LABELS[goal] || "a balanced diet";

  const system =
    "You write a SHORT (2-3 sentences), warm, practical note for visitors of an Indian " +
    "vegetarian meal-planning website. You are NOT choosing the recipes or meals — those " +
    "are already decided elsewhere. Only comment on their stated goal and household in a " +
    "friendly, encouraging way, and add one practical tip. Never give specific medical, " +
    "clinical, or dosage-style advice, even if the goal mentions a health condition — if " +
    "the goal sounds health-related, gently suggest checking with a doctor or dietitian " +
    "for anything specific to their condition. Do not mention onion, garlic, or oil rules " +
    "explicitly since the plan already follows those.";

  const user = `Household: ${household.adults} adult(s), ${household.kids} child(ren). Stated goal: ${goalDescription}. Meals requested: ${selectedMeals.join(", ")}.`;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 120,
        temperature: 0.7,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || null;
  } catch (e) {
    return null; // network/API issue — plan still works without the note
  }
}

function serializePlanForResponse(plan, adults, kids, kidFactor) {
  const out = {};
  for (const dayKey of Object.keys(plan)) {
    out[dayKey] = {};
    for (const slotKey of Object.keys(plan[dayKey])) {
      const val = plan[dayKey][slotKey];
      const ids = Array.isArray(val) ? val : [val];
      out[dayKey][slotKey] = ids
        .map((id) => RECIPE_BY_ID[id])
        .filter(Boolean)
        .map((rec) => ({
          id: rec.id,
          name: rec.name,
          emoji: getDishEmoji(rec),
          effort: rec.effort,
          oilLevel: rec.oilLevel,
          kidFriendly: rec.kidFriendly,
          youtubeUrl: YOUTUBE_LINKS[rec.id] || null, // filled in manually — see lib/recipes.js
          ingredients: rec.ingredients
            .map((ing) => ({ ing, meta: ING_BY_ID[ing.id] }))
            .filter(({ meta }) => meta && meta.category !== "spice" && meta.category !== "oil")
            .map(({ ing, meta }) => ({
              name: meta.name,
              qty: formatQty(scaleQty(ing.qty, adults, kids, kidFactor), meta.unit),
            })),
        }));
    }
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { goal, customGoal, members, selectedMeals } = req.body || {};

    if (!goal || !Array.isArray(members) || !Array.isArray(selectedMeals) || selectedMeals.length === 0) {
      res.status(400).json({ error: "Missing goal, members, or selectedMeals." });
      return;
    }

    const household = ageToHousehold(members);
    // "other" is presented to visitors as the old-age / BP / cholesterol-friendly
    // option, so it must map to the "gentle" hard low-oil filter — falling back to
    // "balanced" here would make that promise unreliable rather than guaranteed.
    const internalGoal =
      goal === "weight_loss" || goal === "protein_rich" || goal === "gentle" ? goal : goal === "other" ? "gentle" : "balanced";
    const season = getCurrentSeason();
    const weekStartDate = getMonday(new Date());

    const { plan, warnings } = generateWeek({
      recipes: SEED_RECIPES,
      season,
      goal: internalGoal,
      selectedMeals,
      weekStartDate,
    });

    const note = await getPersonalizationNote({ goal, customGoal, household, selectedMeals });

    res.status(200).json({
      season,
      household,
      warnings,
      note,
      plan: serializePlanForResponse(plan, household.adults, household.kids, household.kidFactor),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not generate a plan right now. Please try again." });
  }
}
