import { useState } from "react";
import { SEED_RECIPES } from "../../lib/recipes";

// NOTE on why this doesn't auto-save images to the live site:
// Vercel's serverless functions run on an ephemeral filesystem — writing a
// file here would not persist for other visitors or survive the next
// deploy. So each generated image is shown with a Download button; you save
// it into public/images/ yourself (e.g. via GitHub Desktop) the same way you
// would any other file, then push. This trades one extra manual step for not
// needing a separate paid storage service (like Vercel Blob or S3) in v1.

export default function AdminImages() {
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [results, setResults] = useState({}); // recipeId -> { loading, error, base64, filename }

  const generate = async (recipeId) => {
    setResults((r) => ({ ...r, [recipeId]: { loading: true } }));
    try {
      const res = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setResults((r) => ({ ...r, [recipeId]: { loading: false, base64: data.base64, filename: data.filename } }));
    } catch (err) {
      setResults((r) => ({ ...r, [recipeId]: { loading: false, error: err.message } }));
    }
  };

  if (!unlocked) {
    return (
      <div style={{ maxWidth: 400, margin: "80px auto", padding: 20 }}>
        <h2 className="serif">Admin — Dish Images</h2>
        <p style={{ fontSize: 14, color: "var(--charcoal-soft)" }}>
          This page costs money per image generated. Enter the admin password to continue.
        </p>
        <input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)", marginBottom: 10 }}
        />
        <button className="btn-primary" style={{ width: "100%" }} onClick={() => setUnlocked(true)} disabled={!password}>
          Continue
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h2 className="serif">Admin — Dish Images</h2>
      <p style={{ fontSize: 14, color: "var(--charcoal-soft)" }}>
        Click Generate for a dish, then Download the result and add it to <code>public/images/</code> in your repo
        with the exact filename shown (e.g. via GitHub Desktop → commit → push). Each click costs a small amount on
        your OpenAI account — check OpenAI's current image pricing before generating all of these.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginTop: 20 }}>
        {SEED_RECIPES.map((rec) => {
          const r = results[rec.id] || {};
          return (
            <div key={rec.id} style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>{rec.name}</div>
              <div style={{ fontSize: 12, color: "var(--charcoal-soft)", marginBottom: 8 }}>{rec.id}.jpg</div>
              {r.base64 && (
                <img
                  src={`data:image/png;base64,${r.base64}`}
                  alt={rec.name}
                  style={{ width: "100%", borderRadius: 8, marginBottom: 8 }}
                />
              )}
              {r.error && <div style={{ color: "var(--tomato-deep)", fontSize: 12, marginBottom: 8 }}>⚠ {r.error}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-secondary" onClick={() => generate(rec.id)} disabled={r.loading}>
                  {r.loading ? "Generating…" : r.base64 ? "Regenerate" : "Generate"}
                </button>
                {r.base64 && (
                  <a
                    className="btn-secondary"
                    style={{ display: "inline-flex", alignItems: "center" }}
                    href={`data:image/png;base64,${r.base64}`}
                    download={r.filename}
                  >
                    Download
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
