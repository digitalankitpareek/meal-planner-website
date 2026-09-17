// pages/api/swap-dish.js
//
// Swaps ONE dish in the plan for an alternative from the same course group
// (e.g. swapping a dal only ever offers another dal), respecting the same
// season and goal (oil-level) rules the original weekly generator used —
// so a swap can never reintroduce a high-oil dish into a "gentle" plan, or
// hand a non-tiffin-safe dish into a slot that needed one.

const {
  SEED_RECIPES,
  RECIPE_BY_ID,
  ING_BY_ID,
  YOUTUBE_LINKS,
  MEAL_SLOT_DEFS,
  goalAdjustedScore,
  getCurrentSeason,
  getDishEmoji,
  scaleQty,
  formatQty,
} = require("../../lib/recipes");

function serializeDish(rec, adults, kids, kidFactor) {
  return {
    id: rec.id,
    name: rec.name,
    course: rec.course,
    emoji: getDishEmoji(rec),
    effort: rec.effort,
    oilLevel: rec.oilLevel,
    kidFriendly: rec.kidFriendly,
    youtubeUrl: YOUTUBE_LINKS[rec.id] || null,
    ingredients: rec.ingredients
      .map((ing) => ({ ing, meta: ING_BY_ID[ing.id] }))
      .filter(({ meta }) => meta && meta.category !== "spice" && meta.category !== "oil")
      .map(({ ing, meta }) => {
        const rawQty = scaleQty(ing.qty, adults, kids, kidFactor);
        return {
          name: meta.name,
          category: meta.category,
          unit: meta.unit,
          qty: Math.round(rawQty * 100) / 100,
          display: formatQty(rawQty, meta.unit),
        };
      }),
  };
}

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { goal, mealKey, currentDishId, excludeIds, household } = req.body || {};
    const slotDef = MEAL_SLOT_DEFS[mealKey];
    const currentRec = RECIPE_BY_ID[currentDishId];

    if (!slotDef || !currentRec || !household) {
      res.status(400).json({ error: "Missing or invalid mealKey, currentDishId, or household." });
      return;
    }

    // Find which course-group this dish belongs to within its meal (e.g. lunch's
    // "sabzi" group vs its "dal" group), so the swap stays within the same role.
    const group = slotDef.groups.find((g) => g.includes(currentRec.course));
    if (!group) {
      res.status(400).json({ error: "Could not determine this dish's course group." });
      return;
    }

    const season = getCurrentSeason();
    const exclude = new Set(Array.isArray(excludeIds) ? excludeIds : []);
    const internalGoal = ["weight_loss", "protein_rich", "gentle"].includes(goal) ? goal : "balanced";

    const baseFilter = (rec) => {
      if (rec.id === currentDishId) return false;
      if (exclude.has(rec.id)) return false;
      if (!group.includes(rec.course)) return false;
      if (internalGoal === "gentle" && (rec.oilLevel === "high" || rec.oilLevel === "fried")) return false;
      return true;
    };

    let candidates = SEED_RECIPES.filter((rec) => baseFilter(rec) && (rec.seasonOk === "all" || rec.seasonOk.includes(season)));
    if (candidates.length === 0) {
      // relax season if that's the only thing blocking every option
      candidates = SEED_RECIPES.filter(baseFilter);
    }
    if (candidates.length === 0) {
      res.status(200).json({ dish: null, message: "No alternative available for this dish right now." });
      return;
    }

    const scored = candidates.map((rec) => ({
      rec,
      score: goalAdjustedScore(rec, internalGoal) + Math.random() * 3,
    }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, Math.min(5, scored.length));
    const pick = top[Math.floor(Math.random() * top.length)].rec;

    res.status(200).json({
      dish: serializeDish(pick, household.adults, household.kids, household.kidFactor),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Could not swap this dish right now." });
  }
}
