// pages/api/admin/generate-image.js
//
// Generates ONE dish image on demand via OpenAI, called from the admin page.
// IMPORTANT LIMITATION: Vercel's serverless functions have an ephemeral
// filesystem — a file written here does NOT persist for other visitors or
// survive the next deploy. So this endpoint does not try to save the image
// to disk; it returns the image as base64, and the admin page shows it with
// a Download button. You save it to public/images/<id>.jpg yourself (via
// GitHub Desktop, same as any other file) — see the admin page for the
// exact filename to use.
//
// Protected by a shared password (ADMIN_PASSWORD env var) so a stranger who
// finds this URL can't run up your OpenAI bill.

const { RECIPE_BY_ID } = require("../../../lib/recipes");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { recipeId, password } = req.body || {};

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    res.status(500).json({ error: "ADMIN_PASSWORD isn't set on the server — see README.md." });
    return;
  }
  if (!password || password !== adminPassword) {
    res.status(401).json({ error: "Wrong password." });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "OPENAI_API_KEY isn't set on the server." });
    return;
  }

  const rec = RECIPE_BY_ID[recipeId];
  if (!rec) {
    res.status(400).json({ error: "Unknown recipe id." });
    return;
  }

  const prompt =
    `A appetizing, realistic photo of the Indian home-cooked vegetarian dish "${rec.name}", ` +
    `plated simply in a steel or ceramic bowl/plate on a home kitchen table, natural daylight, ` +
    `no text or watermark, no onion or garlic visible, home-style not restaurant-style.`;

  try {
    const openaiRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
      }),
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      console.error("OpenAI image error:", text);
      res.status(502).json({ error: "OpenAI couldn't generate this image. Check your API key and billing." });
      return;
    }

    const data = await openaiRes.json();
    const b64 = data.data?.[0]?.b64_json;
    if (!b64) {
      res.status(502).json({ error: "OpenAI returned no image data." });
      return;
    }

    res.status(200).json({ recipeId, filename: `${rec.id}.jpg`, base64: b64 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong generating this image." });
  }
}
