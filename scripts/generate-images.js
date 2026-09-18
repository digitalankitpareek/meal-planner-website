/**
 * Run this ONCE, locally, with your own OpenAI API key — not on the live site.
 * It generates one image per recipe and saves it to public/images/<id>.jpg.
 * The website then just serves these static files for every visitor, so
 * there's no per-visitor image-generation cost.
 *
 * Usage:
 *   export OPENAI_API_KEY=sk-...
 *   node scripts/generate-images.js
 *
 * Check OpenAI's current image-generation pricing before running this —
 * it costs money per image and this will generate ~48 images. If you only
 * want to (re)generate a few, edit the `onlyIds` array below.
 */

const fs = require("fs");
const path = require("path");
const { SEED_RECIPES } = require("../lib/recipes");

const OUT_DIR = path.join(__dirname, "..", "public", "images");
const onlyIds = null; // e.g. ["sab_bhindi", "dal_moong"] to limit a run; null = all

async function generateImage(rec) {
  const prompt =
    `A appetizing, realistic photo of the Indian home-cooked vegetarian dish "${rec.name}", ` +
    `plated simply in a steel or ceramic bowl/plate on a home kitchen table, natural daylight, ` +
    `no text or watermark, no onion or garlic visible, home-style not restaurant-style.`;

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024",
      output_format: "jpeg",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI image API error for ${rec.id}: ${res.status} ${text}`);
  }
  const data = await res.json();
  const b64 = data.data?.[0]?.b64_json;
  if (!b64) throw new Error(`No image data returned for ${rec.id}`);
  return Buffer.from(b64, "base64");
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Set OPENAI_API_KEY first.");
    process.exit(1);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const targets = onlyIds ? SEED_RECIPES.filter((r) => onlyIds.includes(r.id)) : SEED_RECIPES;
  console.log(`Generating ${targets.length} images...`);

  for (const rec of targets) {
    const outPath = path.join(OUT_DIR, `${rec.id}.jpg`);
    if (fs.existsSync(outPath)) {
      console.log(`skip (exists): ${rec.id}`);
      continue;
    }
    try {
      const buf = await generateImage(rec);
      fs.writeFileSync(outPath, buf);
      console.log(`done: ${rec.id}`);
    } catch (err) {
      console.error(`FAILED: ${rec.id} —`, err.message);
    }
    // Small delay to stay well under rate limits.
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log("All done. Review images in public/images/ before deploying.");
}

main();
