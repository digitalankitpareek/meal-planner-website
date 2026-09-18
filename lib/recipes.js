// Shared recipe data + weekly-plan generator for the public website.
// Ported from the personal Ghar ka Khana PWA (same 48-recipe base), with two
// differences for this context:
//   1. No kid-tiffin merge logic — the website asks generically for
//      Breakfast/Lunch/Dinner/Evening Snack, not a school-tiffin scenario.
//   2. Recipes can be scored by "goal" (weight loss / protein-rich / balanced /
//      gentle-on-oil for BP & cholesterol) — see scoreForGoal() below.
// This file has no React and no browser APIs, so it runs both in the Node
// serverless API route and (for constants like emoji/ingredient names) on
// the client.


const ING = [
  { id: "rice", name: "Rice", unit: "g", category: "grain" },
  { id: "wheat_flour", name: "Wheat flour (atta)", unit: "g", category: "grain", staple: true },
  { id: "besan", name: "Besan (gram flour)", unit: "g", category: "grain" },
  { id: "poha", name: "Poha (flattened rice)", unit: "g", category: "grain" },
  { id: "rava", name: "Rava (sooji)", unit: "g", category: "grain" },
  { id: "bread", name: "Bread", unit: "piece", category: "grain" },
  { id: "moong_dal", name: "Moong dal", unit: "g", category: "dal" },
  { id: "urad_dal", name: "Urad dal", unit: "g", category: "dal" },
  { id: "masoor_dal", name: "Masoor dal", unit: "g", category: "dal" },
  { id: "toor_dal", name: "Toor dal", unit: "g", category: "dal" },
  { id: "chana_dal", name: "Chana dal", unit: "g", category: "dal" },
  { id: "rajma", name: "Rajma", unit: "g", category: "dal" },
  { id: "sprouts", name: "Mixed sprouts", unit: "g", category: "dal" },
  { id: "roasted_chana", name: "Roasted chana", unit: "g", category: "dal", staple: true },
  { id: "curd", name: "Curd (dahi)", unit: "ml", category: "dairy" },
  { id: "paneer", name: "Paneer", unit: "g", category: "dairy" },
  { id: "milk", name: "Milk", unit: "ml", category: "dairy" },
  { id: "ghee", name: "Ghee", unit: "ml", category: "dairy", staple: true },
  { id: "tomato", name: "Tomato", unit: "g", category: "vegetable" },
  { id: "potato", name: "Potato", unit: "g", category: "vegetable" },
  { id: "bhindi", name: "Bhindi (okra)", unit: "g", category: "vegetable", season: ["summer", "monsoon"] },
  { id: "gobi", name: "Cauliflower", unit: "g", category: "vegetable", season: ["winter"] },
  { id: "lauki", name: "Lauki (bottle gourd)", unit: "g", category: "vegetable", season: ["summer", "monsoon"] },
  { id: "guvar", name: "Guvar fali", unit: "g", category: "vegetable", season: ["summer"] },
  { id: "palak", name: "Palak (spinach)", unit: "g", category: "vegetable", season: ["winter"] },
  { id: "methi", name: "Methi leaves", unit: "g", category: "vegetable", season: ["winter"] },
  { id: "peas", name: "Green peas", unit: "g", category: "vegetable", season: ["winter"] },
  { id: "cucumber", name: "Cucumber", unit: "g", category: "vegetable" },
  { id: "carrot", name: "Carrot", unit: "g", category: "vegetable", season: ["winter"] },
  { id: "beans", name: "French beans", unit: "g", category: "vegetable" },
  { id: "capsicum", name: "Capsicum", unit: "g", category: "vegetable" },
  { id: "corn", name: "Corn kernels", unit: "g", category: "vegetable", season: ["summer", "monsoon"] },
  { id: "tinda", name: "Tinda", unit: "g", category: "vegetable", season: ["summer"] },
  { id: "coriander_leaves", name: "Coriander leaves", unit: "bunch", category: "vegetable" },
  { id: "curry_leaves", name: "Curry leaves", unit: "bunch", category: "vegetable" },
  { id: "coconut", name: "Fresh coconut (grated)", unit: "g", category: "vegetable" },
  { id: "hing", name: "Hing (asafoetida)", unit: "g", category: "spice", staple: true },
  { id: "jeera", name: "Jeera (cumin seeds)", unit: "g", category: "spice", staple: true },
  { id: "oil", name: "Cooking oil", unit: "ml", category: "oil", staple: true },
];

const ING_BY_ID = Object.fromEntries(ING.map((i) => [i.id, i]));

const SEED_RECIPES = [
  // ---- breakfast ----
  r("brk_poha", "Poha", "breakfast", "generic", "hing_jeera",
    [i("poha", 200), i("potato", 100), i("peas", 50), i("oil", 15)],
    "low", "low", "all", true, true, 7,
    ["Soak poha 5 min, drain.", "Temper jeera + hing in oil.", "Add potato, peas, cook 5 min.", "Mix in poha, salt, coriander."]),
  r("brk_upma", "Vegetable Upma", "breakfast", "south", "hing_jeera",
    [i("rava", 200), i("carrot", 50), i("peas", 50), i("oil", 15)],
    "low", "low", "all", true, true, 7,
    ["Roast rava dry till aromatic.", "Temper jeera+hing, add veg, water.", "Stir in rava, cook covered 5 min."]),
  r("brk_besan_cheela", "Besan Cheela", "breakfast", "generic", "besan",
    [i("besan", 200), i("curd", 50), i("oil", 20)],
    "low", "medium", "all", true, true, 7,
    ["Whisk besan with water to batter.", "Pour thin on tawa, cook both sides with a little oil."]),
  r("brk_moong_cheela", "Moong Dal Cheela", "breakfast", "generic", "hing_jeera",
    [i("moong_dal", 200), i("oil", 20)],
    "medium", "medium", "all", true, true, 7,
    ["Soak & grind moong dal to batter.", "Season with hing, jeera, salt.", "Cook thin on tawa like a dosa."]),

  // ---- kid tiffin ----
  r("tif_aloo_paratha", "Aloo Paratha", "tiffin", "north", "hing_jeera",
    [i("wheat_flour", 150), i("potato", 150), i("ghee", 15)],
    "medium", "medium", "all", true, true, 7,
    ["Mash spiced boiled potato.", "Stuff in dough, roll, roast with ghee."]),
  r("tif_curd_rice_box", "Curd Rice Box", "tiffin", "south", "curd",
    [i("rice", 150), i("curd", 150), i("curry_leaves", 1)],
    "low", "low", "all", true, true, 7,
    ["Mash cooked rice with curd, milk.", "Temper curry leaves + jeera on top."]),
  r("tif_veg_cutlet", "Vegetable Cutlet (baked)", "tiffin", "generic", "hing_jeera",
    [i("potato", 150), i("peas", 50), i("carrot", 50), i("oil", 10)],
    "medium", "medium", "all", true, true, 10,
    ["Mash boiled veg with spices.", "Shape into cutlets, shallow-roast on tawa."]),
  r("tif_paneer_roti_roll", "Paneer Stuffed Roti", "tiffin", "north", "hing_jeera",
    [i("wheat_flour", 150), i("paneer", 100), i("oil", 10)],
    "medium", "medium", "all", true, true, 10,
    ["Crumble & spice paneer.", "Stuff in dough, roll, roast."]),
  r("tif_idli", "Steamed Idli", "tiffin", "south", "hing_jeera",
    [i("urad_dal", 100), i("rice", 200)],
    "medium", "low", "all", true, true, 10,
    ["Soak & grind urad dal + rice, ferment overnight.", "Steam in idli moulds 12 min."]),
  r("tif_veg_sandwich", "Grilled Vegetable Sandwich", "tiffin", "generic", "hing_jeera",
    [i("bread", 4), i("capsicum", 50), i("tomato", 50), i("oil", 10)],
    "low", "low", "all", true, true, 10,
    ["Layer sliced veg between bread.", "Grill or tawa-toast lightly with a little oil."]),
  r("tif_corn_chaat", "Boiled Corn Chaat", "tiffin", "generic", "hing_jeera",
    [i("corn", 150)],
    "low", "low", ["summer", "monsoon"], true, true, 7,
    ["Boil corn kernels till tender.", "Toss with lemon, chaat masala, coriander."]),
  r("tif_rava_toast", "Rava Toast", "tiffin", "south", "hing_jeera",
    [i("bread", 4), i("rava", 100), i("curd", 50), i("oil", 10)],
    "low", "medium", "all", true, true, 10,
    ["Make a thin rava-curd batter.", "Dip bread slices, shallow-fry lightly on tawa."]),

  // ---- sabzi dry ----
  r("sab_bhindi", "Bhindi Fry", "sabzi_dry", "north", "hing_jeera",
    [i("bhindi", 300), i("oil", 20)],
    "medium", "medium", ["summer", "monsoon"], true, false, 10,
    ["Slice bhindi, pat dry.", "Cook uncovered on medium flame with hing-jeera till non-sticky."]),
  r("sab_gobi_aloo", "Gobi Aloo", "sabzi_dry", "north", "hing_jeera",
    [i("gobi", 200), i("potato", 150), i("oil", 15)],
    "medium", "medium", ["winter"], true, false, 10,
    ["Temper jeera+hing.", "Add chopped gobi & potato, cover-cook till soft."]),
  r("sab_lauki", "Lauki Sabzi", "sabzi_dry", "generic", "hing_jeera",
    [i("lauki", 300), i("oil", 10)],
    "low", "low", ["summer", "monsoon"], true, false, 7,
    ["Peel & dice lauki.", "Cook with hing-jeera tempering, light water, till soft."]),
  r("sab_guvar", "Guvar Fali", "sabzi_dry", "rajasthani", "hing_jeera",
    [i("guvar", 250), i("oil", 15)],
    "medium", "medium", ["summer"], false, false, 10,
    ["Stringy guvar, chop fine.", "Cook slow with hing-jeera till tender."]),
  r("sab_palak", "Palak Sabzi (dry)", "sabzi_dry", "north", "hing_jeera",
    [i("palak", 300), i("oil", 10)],
    "low", "low", ["winter"], true, false, 7,
    ["Wash & chop palak.", "Wilt down with hing-jeera tempering, no extra water."]),
  r("sab_methi_aloo", "Methi Aloo", "sabzi_dry", "north", "hing_jeera",
    [i("methi", 200), i("potato", 150), i("oil", 15)],
    "medium", "medium", ["winter"], false, false, 10,
    ["Chop methi finely, squeeze bitterness with salt.", "Cook with potato and light tempering."]),
  r("sab_capsicum_besan", "Capsicum Besan Sabzi", "sabzi_dry", "north", "besan",
    [i("capsicum", 250), i("besan", 30), i("oil", 15)],
    "medium", "medium", "all", false, false, 10,
    ["Slice capsicum, cook with hing-jeera till soft.", "Sprinkle roasted besan, toss well."]),
  r("sab_carrot_beans", "Carrot Beans Sabzi", "sabzi_dry", "generic", "hing_jeera",
    [i("carrot", 150), i("beans", 150), i("oil", 10)],
    "low", "low", ["winter"], true, false, 10,
    ["Finely chop carrot & beans.", "Cook with hing-jeera tempering till just tender."]),
  r("sab_tinda", "Tinda Sabzi", "sabzi_dry", "generic", "hing_jeera",
    [i("tinda", 300), i("oil", 10)],
    "low", "low", ["summer"], false, false, 10,
    ["Peel & dice tinda.", "Cook with hing-jeera tempering, light water, till soft."]),

  // ---- sabzi gravy ----
  r("sab_mixveg_tomato", "Mixed Veg (tomato base)", "sabzi_gravy", "north", "tomato",
    [i("tomato", 200), i("carrot", 100), i("beans", 100), i("peas", 50), i("oil", 15)],
    "medium", "medium", "all", true, false, 10,
    ["Puree tomato for base.", "Cook mixed veg in tomato gravy with hing-jeera."]),
  r("sab_kadhi", "Curd Kadhi", "sabzi_gravy", "generic", "curd",
    [i("curd", 300), i("besan", 40), i("oil", 10)],
    "medium", "low", "all", true, false, 10,
    ["Whisk curd with besan, water.", "Simmer slowly with hing-jeera tempering till thick."]),
  r("sab_gatte", "Besan Gatte Curry", "sabzi_gravy", "rajasthani", "besan",
    [i("besan", 200), i("curd", 150), i("oil", 15)],
    "high", "medium", "all", false, false, 14,
    ["Steam besan rolls (gatte), slice.", "Simmer in curd-besan gravy."]),
  r("sab_tomato_paneer", "Tomato Paneer (low oil)", "sabzi_gravy", "north", "tomato",
    [i("paneer", 200), i("tomato", 250), i("oil", 15)],
    "medium", "medium", "all", true, false, 10,
    ["Simmer tomato puree with hing-jeera.", "Add paneer cubes, cook 5 min, don't overcook."]),
  r("sab_veg_kurma", "Vegetable Kurma (coconut)", "sabzi_gravy", "south", "coconut",
    [i("carrot", 100), i("beans", 100), i("peas", 50), i("coconut", 50), i("oil", 10)],
    "medium", "low", "all", true, false, 10,
    ["Cook mixed veg till tender.", "Grind coconut to a light paste, simmer veg in it with hing-jeera."]),

  // ---- dal ----
  r("dal_moong", "Moong Dal Tadka", "dal", "generic", "hing_jeera",
    [i("moong_dal", 200), i("tomato", 100), i("oil", 10)],
    "low", "low", "all", true, false, 3,
    ["Pressure cook dal with turmeric.", "Temper hing-jeera-tomato, pour over dal."]),
  r("dal_toor", "Toor Dal", "dal", "generic", "hing_jeera",
    [i("toor_dal", 200), i("tomato", 100), i("oil", 10)],
    "low", "low", "all", true, false, 3,
    ["Pressure cook toor dal.", "Simple hing-jeera tempering, tomato for tang."]),
  r("dal_chana", "Chana Dal", "dal", "generic", "hing_jeera",
    [i("chana_dal", 200), i("tomato", 100), i("oil", 10)],
    "medium", "low", "all", true, false, 4,
    ["Soak & pressure cook chana dal.", "Temper hing-jeera, simmer with tomato."]),
  r("dal_rajma", "Rajma (no-onion)", "dal", "north", "tomato",
    [i("rajma", 200), i("tomato", 200), i("oil", 15)],
    "high", "medium", "all", true, false, 14,
    ["Soak rajma overnight, pressure cook well.", "Simmer in tomato-hing gravy till thick."]),
  r("dal_masoor", "Masoor Dal", "dal", "generic", "hing_jeera",
    [i("masoor_dal", 200), i("tomato", 100), i("oil", 10)],
    "low", "low", "all", true, false, 3,
    ["Pressure cook masoor dal till soft.", "Temper hing-jeera-tomato, pour over dal."]),

  // ---- grain ----
  r("grn_rice", "Steamed Rice", "grain", "generic", "hing_jeera",
    [i("rice", 200)], "low", "low", "all", true, false, 1,
    ["Wash rice, cook 2:1 water ratio till fluffy."]),
  r("grn_roti", "Roti", "grain", "generic", "hing_jeera",
    [i("wheat_flour", 200)], "low", "low", "all", true, true, 1,
    ["Knead soft dough, rest 15 min.", "Roll thin, roast on tawa, puff on flame."]),
  r("grn_jeera_rice", "Jeera Rice", "grain", "north", "hing_jeera",
    [i("rice", 200), i("ghee", 10)], "low", "low", "all", true, false, 3,
    ["Temper jeera in ghee.", "Add soaked rice + water, cook till done."]),
  r("grn_missi_roti", "Missi Roti", "grain", "north", "besan",
    [i("wheat_flour", 150), i("besan", 50), i("oil", 10)],
    "medium", "low", "all", true, true, 3,
    ["Knead wheat flour with besan, spices.", "Roll and roast on tawa with a little oil."]),

  // ---- one pot ----
  r("op_khichdi", "Khichdi", "one_pot", "generic", "hing_jeera",
    [i("rice", 150), i("moong_dal", 100), i("oil", 10)],
    "low", "low", "all", true, false, 7,
    ["Pressure cook rice+dal together with turmeric.", "Top with ghee-hing-jeera tempering."]),
  r("op_pulao", "Vegetable Pulao (no-onion)", "one_pot", "north", "hing_jeera",
    [i("rice", 200), i("carrot", 50), i("peas", 50), i("beans", 50), i("ghee", 15)],
    "medium", "medium", "all", true, false, 10,
    ["Sauté veg in ghee with whole spices.", "Add rice + water, cook covered till done."]),
  r("op_veg_khichdi", "Vegetable Khichdi", "one_pot", "generic", "hing_jeera",
    [i("rice", 150), i("moong_dal", 100), i("carrot", 50), i("peas", 50), i("oil", 10)],
    "low", "low", "all", true, false, 7,
    ["Pressure cook rice, dal and chopped veg together with turmeric.", "Top with a light ghee-hing-jeera tempering."]),

  // ---- south indian ----
  r("sth_sambar", "Sambar", "south", "south", "tomato",
    [i("toor_dal", 150), i("tomato", 150), i("beans", 100), i("curry_leaves", 1), i("oil", 10)],
    "medium", "low", "all", true, false, 10,
    ["Cook toor dal soft.", "Add tamarind, veg, sambar masala, simmer.", "Temper curry leaves + hing."]),
  r("sth_rasam", "Rasam", "south", "south", "tomato",
    [i("tomato", 150), i("toor_dal", 50), i("curry_leaves", 1)],
    "low", "low", "all", true, false, 10,
    ["Boil tomato with tamarind, rasam powder.", "Add cooked dal water, simmer thin.", "Temper curry leaves."]),
  r("sth_curd_rice", "Curd Rice", "south", "south", "curd",
    [i("rice", 200), i("curd", 200), i("curry_leaves", 1)],
    "low", "low", "all", true, true, 10,
    ["Mash cooked rice with curd & milk.", "Temper mustard-curry leaves, mix in."]),
  r("sth_poriyal", "Vegetable Poriyal", "south", "south", "coconut",
    [i("beans", 200), i("coconut", 50), i("oil", 10)],
    "medium", "low", "all", true, false, 10,
    ["Chop veg fine, steam-cook.", "Toss with grated coconut & light tempering."]),

  // ---- snack ----
  r("snk_roasted_chana", "Roasted Chana Chaat", "snack", "generic", "hing_jeera",
    [i("roasted_chana", 150), i("tomato", 50), i("cucumber", 50)],
    "low", "low", "all", true, true, 7,
    ["Mix roasted chana with chopped veg, chaat masala, lemon."]),
  r("snk_sprouts_chaat", "Sprouts Chaat", "snack", "generic", "hing_jeera",
    [i("sprouts", 200), i("tomato", 50), i("cucumber", 50)],
    "low", "low", "all", true, true, 7,
    ["Steam sprouts lightly.", "Toss with chopped veg, lemon, chaat masala."]),

  // ---- accompaniment ----
  r("acc_raita", "Cucumber Raita", "accompaniment", "generic", "curd",
    [i("curd", 200), i("cucumber", 100)], "low", "low", "all", true, false, 2,
    ["Grate cucumber, mix into whisked curd with roasted jeera powder."]),
  r("acc_curd", "Plain Curd", "accompaniment", "generic", "curd",
    [i("curd", 200)], "low", "low", "all", true, false, 1, ["Serve chilled curd."]),
  r("acc_kachumber", "Kachumber Salad", "accompaniment", "generic", "hing_jeera",
    [i("cucumber", 100), i("tomato", 100), i("carrot", 50)], "low", "low", "all", true, true, 2,
    ["Dice all veg finely, toss with lemon and salt."]),
  r("acc_boondi_raita", "Boondi Raita", "accompaniment", "generic", "curd",
    [i("curd", 200), i("besan", 30), i("oil", 10)], "medium", "medium", "all", true, false, 7,
    ["Fry small besan boondi lightly.", "Soak in water, squeeze, mix into whisked curd with roasted jeera."]),
];

function i(id, qty) {
  return { id, qty };
}
function r(id, name, course, cuisine, flavourBase, ingredients, effort, oilLevel, seasonOk, kidFriendly, travelsWell, repeatGapDays, steps) {
  return { id, name, course, cuisine, flavourBase, ingredients, effort, oilLevel, seasonOk, kidFriendly, travelsWell, repeatGapDays, steps, servesAdults: 2 };
}

const RECIPE_BY_ID = Object.fromEntries(SEED_RECIPES.map((r) => [r.id, r]));

// Small dish visual. No hotlinked internet photos here on purpose — they'd be
// copyrighted, and links break over time. Emoji is a reliable, offline-safe
// default. If you want real photos later, drop a file named "<recipe id>.jpg"
// into an /images folder next to this app — DishIcon will use it automatically


const RECIPE_EMOJI = {
  brk_poha: "🍚",
  brk_upma: "🥣",
  brk_besan_cheela: "🫓",
  brk_moong_cheela: "🫓",
  tif_aloo_paratha: "🫓",
  tif_curd_rice_box: "🍚",
  tif_veg_cutlet: "🥔",
  tif_paneer_roti_roll: "🧀",
  tif_idli: "⚪",
  tif_veg_sandwich: "🥪",
  tif_corn_chaat: "🌽",
  tif_rava_toast: "🍞",
  sab_bhindi: "🥘",
  sab_gobi_aloo: "🥦",
  sab_lauki: "🥘",
  sab_guvar: "🥘",
  sab_palak: "🥬",
  sab_methi_aloo: "🥘",
  sab_capsicum_besan: "🫑",
  sab_carrot_beans: "🥕",
  sab_tinda: "🥘",
  sab_mixveg_tomato: "🍅",
  sab_kadhi: "🥣",
  sab_gatte: "🍛",
  sab_tomato_paneer: "🧀",
  sab_veg_kurma: "🥥",
  dal_moong: "🍛",
  dal_toor: "🍛",
  dal_chana: "🍛",
  dal_rajma: "🫘",
  dal_masoor: "🍛",
  grn_rice: "🍚",
  grn_roti: "🫓",
  grn_jeera_rice: "🍚",
  grn_missi_roti: "🫓",
  op_khichdi: "🍲",
  op_pulao: "🍛",
  op_veg_khichdi: "🍲",
  sth_sambar: "🍲",
  sth_rasam: "🥣",
  sth_curd_rice: "🍚",
  sth_poriyal: "🥗",
  snk_roasted_chana: "🥜",
  snk_sprouts_chaat: "🌱",
  acc_raita: "🥒",
  acc_curd: "🥛",
  acc_kachumber: "🥗",
  acc_boondi_raita: "🥣",
};
const COURSE_EMOJI = {
  breakfast: "🍽️",
  tiffin: "🍱",
  sabzi_dry: "🥘",
  sabzi_gravy: "🍛",
  dal: "🍛",
  grain: "🫓",
  one_pot: "🍲",
  south: "🍚",
  snack: "🥜",
  accompaniment: "🥗",
};

function getDishEmoji(rec) {
  return RECIPE_EMOJI[rec.id] || COURSE_EMOJI[rec.course] || "🍽️";
}

// Fill these in by hand with a trusted, authentic channel's video for that exact
// dish. Left blank on purpose — we don't auto-search YouTube, since an automated
// search could easily surface a video that uses onion/garlic or heavy oil,
// which would undercut the one thing this whole planner is built around.
// Format: recipe id -> full YouTube URL.
const YOUTUBE_LINKS = {
  sab_bhindi: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
};

// ---------------------------------------------------------------------------
// RECIPE_BLURBS — a short (~50-70 word), plain-language description per dish,
// written from the recipe's own ingredients/steps above (not invented).
// ---------------------------------------------------------------------------
const RECIPE_BLURBS = {
  brk_poha: "A quick North Indian breakfast of flattened rice, lightly tossed with soft potato and green peas. Poha is soaked and drained first, then simmered briefly with a mild jeera-hing tempering so it stays fluffy, not mushy. Finished with fresh coriander and a squeeze of lemon if you like, it's light, fast, and a common everyday start to the day across many Indian households.",
  brk_upma: "A South Indian breakfast staple made from dry-roasted semolina cooked with carrot and peas in a jeera-hing tempered base. The rava is toasted first for a nutty flavour, then simmered with water until it thickens into a soft, savoury porridge-like dish. Comforting, quick, and easy to scale for any number of people, it's a common weekday breakfast across South Indian households especially.",
  brk_besan_cheela: "A savoury gram-flour pancake, whisked into a thin batter with curd and a little water, then cooked on a hot tawa with a touch of oil until golden on both sides. Naturally protein-leaning thanks to the besan, it's a fast, filling breakfast that needs no fermentation or resting time — batter to plate in well under fifteen minutes, start to finish.",
  brk_moong_cheela: "A protein-rich pancake made by soaking and grinding moong dal into a smooth batter, seasoned simply with salt and mild spice, then cooked thin on a tawa like a dosa. No fermentation needed — just soak, blend, and cook. A lighter, dal-based alternative to a wheat-flour breakfast, especially good for a protein-focused goal, and naturally gluten-free too.",
  tif_aloo_paratha: "A classic stuffed flatbread: spiced mashed potato sealed inside wheat dough, rolled out, and roasted with a little ghee until crisp outside and soft within. Filling and satisfying, it travels well at room temperature, which is exactly why it doubles as a favourite school and office tiffin box staple across most of North India, usually served with curd or pickle on the side.",
  tif_curd_rice_box: "Cooked rice mashed with curd and a little milk until creamy, finished with a light curry-leaf and jeera tempering on top. Naturally cooling and mild, it travels well without spoiling quickly, making it a dependable South Indian tiffin choice that needs no reheating to taste good — in fact many people prefer it served cool straight from the box.",
  tif_veg_cutlet: "Boiled potato mashed with peas and carrot, lightly spiced, shaped into patties, and shallow-roasted on a tawa rather than deep-fried — keeping the oil level down. Firm enough to hold together in a tiffin box, they're a favourite way to use up leftover boiled vegetables, and just as good eaten cold as they are warm from the pan.",
  tif_paneer_roti_roll: "Soft wheat roti rolled around lightly spiced, crumbled paneer, then roasted with a touch of oil. A protein-forward twist on a stuffed paratha, it holds its shape well when rolled up, making it easy to pack and eat on the go without needing cutlery — a practical choice for a busy school or office day.",
  tif_idli: "Steamed rice-and-urad-dal cakes, made from a batter that's soaked, ground, and traditionally fermented overnight before steaming until light and fluffy. Naturally low in oil since nothing is fried, idli is soft, easy to digest, and a dependable South Indian tiffin option that travels well and reheats gently without drying out too much.",
  tif_veg_sandwich: "Sliced capsicum and tomato layered between bread and lightly toasted on a tawa with a little oil, rather than deep-fried. A quick, no-fuss tiffin option that needs almost no cooking skill, and one of the few dishes here that leans on bread instead of rice or wheat flour — handy on a morning when you're short on time.",
  tif_corn_chaat: "Boiled corn kernels tossed with lemon juice and chaat masala — nothing more. About as simple as tiffin food gets, with no cooking beyond boiling the corn. Naturally low oil and genuinely enjoyed by most kids, it's best made in corn season for the sweetest kernels, and keeps reasonably well in a sealed box for a few hours.",
  tif_rava_toast: "Bread slices dipped in a thin semolina-and-curd batter and shallow-fried lightly on a tawa, similar in spirit to a savoury French toast. A South Indian-inspired way to use bread, it's quick to make fresh in the morning and holds up reasonably well by lunchtime, especially if packed once fully cooled.",
  sab_bhindi: "Sliced okra cooked uncovered over medium heat with a jeera-hing tempering until it's tender and no longer sticky — the key trick to good bhindi fry. A classic North Indian everyday dry sabzi, simple, fast, and best made just before eating for the right texture, since reheated bhindi tends to turn soft rather than staying pleasantly firm.",
  sab_gobi_aloo: "Cauliflower and potato cooked together with a jeera-hing tempering until soft, a wintertime North Indian classic when cauliflower is in season and at its best. Straightforward to make with everyday pantry staples, it's a dependable weekday side that pairs with roti or rice equally well, and reheats without losing much of its texture.",
  sab_lauki: "Bottle gourd, peeled and diced, simmered gently with a light jeera-hing tempering and a little water until soft. One of the lightest, lowest-oil sabzis in the everyday rotation, it's especially suited to a gentle or weight-conscious goal thanks to its high water content and mild flavour, and cooks in well under twenty minutes.",
  sab_guvar: "Cluster beans, finely chopped and slow-cooked with a jeera-hing tempering until tender — guvar needs a little patience since it's naturally somewhat fibrous and benefits from a slower simmer. A Rajasthani favourite, it's less common outside the region but a genuine staple of Marwari home cooking, especially through the summer months when it's freshest.",
  sab_palak: "Fresh spinach, washed and chopped, wilted down with just a jeera-hing tempering and no extra water needed. A winter North Indian dry sabzi that comes together in minutes once the spinach is prepped, and a good source of iron alongside its mild, earthy flavour — best eaten the same day it's cooked, while the leaves are still bright.",
  sab_methi_aloo: "Fenugreek leaves, chopped fine and salted briefly to soften their natural bitterness, then cooked with potato and a light tempering. The bitterness mellows considerably once cooked, leaving a distinctive winter flavour that pairs particularly well with roti. A North Indian seasonal favourite, best made while fenugreek is fresh and tender rather than older and tougher.",
  sab_capsicum_besan: "Sliced capsicum cooked with a jeera-hing tempering until just softened, then finished with a sprinkle of roasted besan tossed through for texture and a subtly nutty flavour. A simple way to dress up capsicum beyond a plain stir-fry, popular in North Indian home kitchens, and a good option when you want a dry sabzi with a bit more body.",
  sab_carrot_beans: "Finely chopped carrot and French beans cooked together with a light jeera-hing tempering until just tender — not overcooked, so they keep some bite. A wintertime everyday sabzi that's naturally low oil and mild enough to suit most palates, including children, and pairs well alongside almost any dal-and-grain combination.",
  sab_tinda: "Tinda, peeled and diced, cooked gently with a jeera-hing tempering and a little water until soft, similar in method to lauki. A summer squash that's less well known outside North India but a genuine staple in many households when it's in season, and a good lighter alternative when you want a change from lauki.",
  sab_mixveg_tomato: "Carrot, beans, and peas simmered in a pureed tomato base with a jeera-hing tempering — the tomato replaces the onion-garlic gravy base entirely, staying true to that constraint while still giving real body and tang to the dish. A versatile North Indian mixed-vegetable curry that works equally well with rice or roti.",
  sab_kadhi: "A tangy, mildly spiced curd-and-besan curry, whisked together and simmered slowly with a jeera-hing tempering until it thickens. Needs a gentle hand and constant low heat to avoid the curd splitting. A comforting, naturally low-oil gravy dish that pairs classically with steamed rice, and is often served on days when a lighter meal is wanted.",
  sab_gatte: "Steamed rolls of spiced besan dough, sliced and simmered in a curd-besan gravy — a Rajasthani specialty that takes a bit more effort than most dishes here, but rewards it with a distinctive chewy texture you won't get from any quick weekday sabzi. Worth saving for a weekend when there's a little extra time to cook.",
  sab_tomato_paneer: "Paneer cubes simmered briefly in a tomato-hing gravy — kept deliberately short on the stove so the paneer stays soft rather than turning rubbery. A lighter, lower-oil take on paneer curry that skips the usual cream or cashew-based richness, relying instead on the natural tang and body of the tomato itself.",
  sab_veg_kurma: "Carrot, beans, and peas simmered in a light coconut paste with a jeera-hing tempering — a South Indian-style vegetable kurma that gets its richness from coconut rather than dairy or nuts. A gentle introduction to South Indian gravies for those used to North Indian cooking, and a nice change of pace mid-week.",
  dal_moong: "Moong dal, pressure-cooked soft with turmeric, finished with a simple jeera-hing-tomato tempering poured over the top. One of the quickest, lightest dals to make and digest, and a genuine everyday staple across most of India regardless of region — often the first dal introduced to children for exactly that reason.",
  dal_toor: "Toor dal, pressure-cooked until soft, finished with the same simple jeera-hing tempering and a little tomato for tang. A close cousin of moong dal in method but with a slightly richer, earthier flavour — arguably the most common dal in South and West Indian households, and the base for many regional dal preparations.",
  dal_chana: "Chana dal, soaked before cooking and pressure-cooked until tender, then simmered briefly with a jeera-hing tempering and tomato. Takes a touch longer than moong or toor dal due to the soaking step, but has a firmer bite and nuttier flavour worth the wait, and holds its shape well rather than turning fully mushy.",
  dal_rajma: "Red kidney beans, soaked overnight and cooked until completely soft, then simmered in a tomato-hing gravy until thick — done here without the usual onion-garlic base, relying on tomato and long cooking for depth instead. A heartier, more filling dal-family dish than most in the everyday rotation, and a good match for jeera rice.",
  dal_masoor: "Masoor dal, pressure-cooked until soft — it cooks faster than most dals since it needs no soaking — finished with a simple jeera-hing-tomato tempering. A lighter-textured, slightly sweeter dal that makes a good change of pace from the more common moong or toor dal, and a handy option on a busier weeknight.",
  grn_rice: "Plain steamed rice, washed and cooked in a roughly 2:1 water ratio until fluffy. About as simple as food gets, and the default grain base for most lunches and dinners in this plan when roti isn't the better fit — a neutral canvas that lets a gravy or dal be the star of the meal.",
  grn_roti: "Whole wheat flatbread, kneaded into a soft dough, rested, then rolled thin and roasted on a tawa until it puffs up over an open flame. The everyday bread of most North Indian households, made fresh for each meal rather than in advance, and best eaten warm straight off the tawa whenever that's possible.",
  grn_jeera_rice: "Steamed rice given a simple upgrade — soaked rice cooked with a jeera tempering in ghee before the water goes in, so the cumin flavour runs through every grain. A step up from plain rice for a dinner that deserves a little more effort, and a good match for a lighter curd-based gravy like kadhi.",
  grn_missi_roti: "Wheat flour kneaded together with besan and light spicing, then rolled and roasted like a regular roti. The besan adds both flavour and a bit more protein than a plain wheat roti, making it a worthwhile swap on days you want variety in the grain course, especially alongside a simple curd or pickle side.",
  op_khichdi: "Rice and moong dal pressure-cooked together with turmeric until soft and porridge-like, finished with a ghee-hing-jeera tempering on top. The definitive Indian comfort food — light, easy to digest, and a genuine one-pot meal needing nothing more than a spoon of ghee to finish it, often the first food reached for when unwell.",
  op_pulao: "Rice cooked together with carrot, peas, and beans in ghee with whole spices — a complete one-pot meal built without the usual onion base, relying on the whole spices and ghee for its flavour instead. A step up from plain rice for when the day calls for something a little more festive, without needing a separate sabzi.",
  op_veg_khichdi: "A vegetable-loaded version of classic khichdi — rice, moong dal, carrot, and peas pressure-cooked together with turmeric, finished with a light tempering. More filling and colourful than plain khichdi, while keeping the same easy, one-pot, low-oil character that makes the original such a dependable, no-fuss comfort meal on any night of the week.",
  sth_sambar: "Toor dal cooked soft, then simmered with tamarind, mixed vegetables, and sambar masala, finished with a curry-leaf and hing tempering. A South Indian staple eaten with rice, idli, or dosa — tangy, mildly spiced, and built around whatever vegetables are on hand, which is part of why it varies so much from kitchen to kitchen.",
  sth_rasam: "A thin, tangy South Indian soup made by boiling tomato with tamarind and rasam powder, loosened with a little cooked dal water, and finished with a curry-leaf tempering. Traditionally sipped on its own or poured over rice — light, warming, and good for a cold day, or whenever appetite is a little low.",
  sth_curd_rice: "Cooked rice mashed with curd and a little milk until smooth and cooling, finished with a mustard-and-curry-leaf tempering mixed through. A South Indian meal-ender in its own right, often eaten last in a thali to settle the stomach after spicier dishes, and just as good served slightly chilled on a hot day.",
  sth_poriyal: "Beans, finely chopped and steam-cooked until just tender, then tossed with grated coconut and a light tempering. A South Indian style of preparing vegetables that stays dry rather than saucy, letting the vegetable's own flavour lead rather than a gravy, and a good lighter counterpart to a heavier sambar or curry on the same plate.",
  snk_roasted_chana: "Roasted chana tossed with chopped tomato and cucumber, a squeeze of lemon, and chaat masala. No cooking involved beyond what's needed to assemble it — a genuinely fast, protein-leaning snack for the evening slot that needs no stove time at all, and travels well if you want to take it along somewhere.",
  snk_sprouts_chaat: "Lightly steamed mixed sprouts tossed with chopped tomato, cucumber, lemon, and chaat masala. A protein-forward evening snack that takes minutes to put together and works well when you want something substantial without reaching for anything fried — a good option to keep hunger in check before a later dinner.",
  acc_raita: "Grated cucumber folded into whisked curd, finished with a pinch of roasted jeera powder. A cooling side that balances out spicier main dishes, and one of the simplest accompaniments here — ready in the time it takes to grate the cucumber, and a natural pairing with biryani-style rice dishes or a spicier sabzi.",
  acc_curd: "Plain chilled curd, served as-is. About as simple as an accompaniment gets, but a genuine everyday presence on most Indian thalis — cooling, easy to digest, and a natural pairing with khichdi or any dal-rice combination, often the very last thing added to the plate before eating.",
  acc_kachumber: "Cucumber, tomato, and carrot finely diced and tossed with lemon juice and salt — a crunchy, entirely raw salad that needs no cooking. A refreshing side that adds texture to a meal that's otherwise mostly soft, cooked dishes, and a good way to work a little extra raw vegetable into the day.",
  acc_boondi_raita: "Small besan boondi, lightly fried, then soaked in water, squeezed, and mixed into whisked curd with roasted jeera. A slightly more involved raita than the plain cucumber version, with a distinctive texture from the soaked boondi running through it, and a popular choice alongside a festive or weekend meal.",
};

// ---------------------------------------------------------------------------
// PROTEIN_PER_100G — approximate grams of protein per 100g/100ml of the raw
// ingredient. These are common, widely-published reference figures (the kind
// found on standard nutrition labels or in general food-composition tables),
// NOT pulled from a single verified lab source like IFCT. Treat every number
// here as indicative only — cooking method, exact variety, and brand all
// shift the real figure. Verify from packaging or a nutrition database
// before relying on any of this for a specific dietary target.
// ---------------------------------------------------------------------------
const PROTEIN_PER_100G = {
  rice: 2.7, wheat_flour: 11, besan: 22, poha: 6.6, rava: 10.4,
  moong_dal: 24, toor_dal: 22, chana_dal: 20, rajma: 22, masoor_dal: 25,
  sprouts: 7, roasted_chana: 20, urad_dal: 25,
  curd: 3.5, paneer: 18, milk: 3.3, ghee: 0,
  tomato: 0.9, potato: 2, bhindi: 1.9, gobi: 2, lauki: 0.6, guvar: 3.2,
  palak: 2.9, methi: 4.4, peas: 5, cucumber: 0.7, carrot: 0.9, beans: 1.8,
  capsicum: 1, coriander_leaves: 2.1, curry_leaves: 6.1, coconut: 3.3,
  corn: 3.3, tinda: 0.6, bread: 9, oil: 0, hing: 4, jeera: 18,
};

function estimateProteinG(ingredientId, qtyGramsOrMl) {
  const per100 = PROTEIN_PER_100G[ingredientId];
  if (per100 === undefined || !qtyGramsOrMl) return null;
  return (per100 * qtyGramsOrMl) / 100;
}

/* ============================== DATE HELPERS ============================== */

function getCurrentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 6) return "summer";
  if (m >= 7 && m <= 9) return "monsoon";
  return "winter";
}
function toISODate(d) {
  return d.toISOString().slice(0, 10);
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function scaleQty(qty, adults, kids, kidFactor = 0.5) {
  const multiplier = (adults + kids * kidFactor) / 2; // base recipe serves 2 adults
  return qty * multiplier;
}
function formatQty(qty, unit) {
  if (unit === "g") return qty >= 1000 ? `${(qty / 1000).toFixed(1)} kg` : `${Math.round(qty)} g`;
  if (unit === "ml") return qty >= 1000 ? `${(qty / 1000).toFixed(1)} L` : `${Math.round(qty)} ml`;
  if (unit === "bunch") return `${Math.max(1, Math.round(qty))} bunch`;
  return `${Math.max(1, Math.round(qty))} pc`;
}

/* ============================== GENERIC SLOT TEMPLATES ============================== */
// Unlike the personal PWA (which merges breakfast+tiffin for a school context),
// the website asks visitors generically which meals they want, so slots are
// built dynamically from that selection. Valid meal keys: breakfast, lunch,
// dinner, snack.

const MEAL_SLOT_DEFS = {
  breakfast: { label: "Breakfast", groups: [["breakfast"]] },
  lunch: { label: "Lunch", groups: [["sabzi_dry", "sabzi_gravy"], ["dal"], ["grain"], ["accompaniment"]] },
  dinner: { label: "Dinner", groups: [["sabzi_gravy", "one_pot"], ["grain"], ["accompaniment"]] },
  snack: { label: "Evening Snack", groups: [["snack"]] },
};

function buildDaySlots(selectedMeals) {
  return selectedMeals.filter((m) => MEAL_SLOT_DEFS[m]).map((m) => ({ key: m, ...MEAL_SLOT_DEFS[m] }));
}

/* ============================== GOAL-BASED SCORING ============================== */
// GOAL is one of: "weight_loss" | "protein_rich" | "balanced" | "gentle"
// "gentle" covers the website's 4th option (old age / BP / cholesterol-friendly).
// This is a food-pattern filter only — plain lower-oil, less-fried selection.
// It is NOT medical advice and makes no claim to manage any health condition;
// the UI must carry a visible disclaimer wherever this goal is used.

const PROTEIN_HINT_INGREDIENTS = new Set([
  "paneer", "moong_dal", "toor_dal", "chana_dal", "rajma", "masoor_dal", "sprouts", "urad_dal", "roasted_chana",
]);

function goalAdjustedScore(rec, goal) {
  let bonus = 0;
  if (goal === "weight_loss") {
    if (rec.oilLevel === "low") bonus += 3;
    if (rec.oilLevel === "high" || rec.oilLevel === "fried") bonus -= 6;
    if (rec.course === "sabzi_dry" || rec.course === "dal") bonus += 1;
  } else if (goal === "protein_rich") {
    const hasProteinIng = rec.ingredients.some((i) => PROTEIN_HINT_INGREDIENTS.has(i.id));
    if (hasProteinIng) bonus += 4;
  } else if (goal === "gentle") {
    // BP / cholesterol / old-age friendly: oil is the main lever we can act on responsibly.
    if (rec.oilLevel === "high" || rec.oilLevel === "fried") bonus -= 100; // effectively excluded
    if (rec.oilLevel === "low") bonus += 2;
  }
  // "balanced" (or any unrecognised goal) gets no adjustment.
  return bonus;
}

/* ============================== GENERATOR ============================== */

function generateWeek({ recipes, season, goal = "balanced", oilCapPerWeek = 3, southIndianTarget = [1, 2], selectedMeals, weekStartDate }) {
  const plan = {};
  const lastUsed = {};
  let southCount = 0;
  let highOilCount = 0;
  const lastTwoFlavourBases = [];
  const warnings = [];

  const gapDaysFor = (rec, thisDate) => {
    const lastUsedDateStr = lastUsed[rec.id];
    if (!lastUsedDateStr) return Infinity;
    return daysBetween(thisDate, new Date(lastUsedDateStr));
  };

  for (let d = 0; d < 7; d++) {
    plan[d] = {};
    const templates = buildDaySlots(selectedMeals);
    const thisDate = addDays(weekStartDate, d);
    for (const slot of templates) {
      const chosenForSlot = [];
      const usedInThisSlot = new Set();
      let primaryCourse = null;

      for (const group of slot.groups) {
        const isRedundantWithOnePot = primaryCourse === "one_pot" && group.length === 1 && (group[0] === "grain" || group[0] === "dal");
        if (isRedundantWithOnePot) continue;

        const isWeekday = d <= 4;
        const baseFilter = (rec) => {
          if (!group.includes(rec.course)) return false;
          if (usedInThisSlot.has(rec.id)) return false;
          if (goal === "gentle" && (rec.oilLevel === "high" || rec.oilLevel === "fried")) return false;
          return true;
        };

        let candidates = recipes.filter(
          (rec) => baseFilter(rec) && (rec.seasonOk === "all" || rec.seasonOk.includes(season)) && !(isWeekday && rec.effort === "high") && gapDaysFor(rec, thisDate) >= rec.repeatGapDays
        );
        if (candidates.length === 0) {
          candidates = recipes.filter((rec) => baseFilter(rec) && (rec.seasonOk === "all" || rec.seasonOk.includes(season)));
        }
        if (candidates.length === 0) {
          candidates = recipes.filter((rec) => baseFilter(rec));
        }
        if (candidates.length === 0) {
          warnings.push(`Not enough recipes tagged for "${group.join("/")}" — add more to the recipe list.`);
          continue;
        }

        const scored = candidates.map((rec) => {
          let score = 0;
          const gap = gapDaysFor(rec, thisDate);
          score += Math.min(isFinite(gap) ? gap : 30, 30) * 0.3;
          if (rec.oilLevel === "high" || rec.oilLevel === "fried") {
            if (highOilCount >= oilCapPerWeek) score -= 5;
          }
          if (rec.oilLevel === "fried" && isWeekday) score -= 3;
          if (rec.cuisine === "south") {
            if (southCount < southIndianTarget[0]) score += 2;
            if (southCount >= southIndianTarget[1]) score -= 4;
          }
          if (lastTwoFlavourBases.includes(rec.flavourBase)) score -= 1;
          else score += 1;
          score += goalAdjustedScore(rec, goal);
          score += Math.random() * 1.5;
          return { rec, score };
        });
        scored.sort((a, b) => b.score - a.score);
        const top = scored.slice(0, Math.min(5, scored.length));
        const pick = top[Math.floor(Math.random() * top.length)].rec;

        if (primaryCourse === null) primaryCourse = pick.course;
        chosenForSlot.push(pick.id);
        usedInThisSlot.add(pick.id);
        lastUsed[pick.id] = toISODate(thisDate);
        if (pick.oilLevel === "high" || pick.oilLevel === "fried") highOilCount++;
        if (pick.cuisine === "south") southCount++;
        lastTwoFlavourBases.push(pick.flavourBase);
        if (lastTwoFlavourBases.length > 2) lastTwoFlavourBases.shift();
      }
      plan[d][slot.key] = chosenForSlot.length === 1 ? chosenForSlot[0] : chosenForSlot;
    }
  }

  return { plan, warnings };
}

module.exports = {
  ING,
  ING_BY_ID,
  SEED_RECIPES,
  RECIPE_BY_ID,
  RECIPE_EMOJI,
  COURSE_EMOJI,
  getDishEmoji,
  YOUTUBE_LINKS,
  RECIPE_BLURBS,
  PROTEIN_PER_100G,
  estimateProteinG,
  MEAL_SLOT_DEFS,
  buildDaySlots,
  generateWeek,
  goalAdjustedScore,
  scaleQty,
  formatQty,
  getCurrentSeason,
  getMonday,
  addDays,
  toISODate,
  daysBetween,
};
