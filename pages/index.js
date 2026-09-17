import { useState } from "react";

const SITE_NAME = "Vegetarian Meal Planner";

const GOALS = [
  { key: "weight_loss", label: "Diet Plan (Weight loss)", blurb: "Lighter, low-oil meals focused on vegetables and dal." },
  { key: "protein_rich", label: "Protein-rich Diet", blurb: "More dal, paneer, rajma and sprouts across the week." },
  { key: "balanced", label: "Balanced Diet", blurb: "A well-rounded everyday mix — our default rotation." },
  { key: "other", label: "Other", blurb: "Old-age / BP / cholesterol-friendly, or tell us in your own words." },
];

const MEAL_OPTIONS = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Evening Snack" },
];

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const GROCERY_GROUP_LABELS = {
  vegetable: "Sabzi Mandi",
  grain: "Kirana (grains & flours)",
  dal: "Kirana (dals)",
  dairy: "Dairy",
  other: "Other",
};

/* ============================== BMI HELPERS ============================== */
// Standard formula, standard WHO adult categories. This is a general
// screening number, not a diagnosis — the UI says so wherever it appears.
// Note: BMI itself is weight/height only; gender does not change the number.

function computeBMI(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm) / 100;
  if (!w || !h) return null;
  return w / (h * h);
}
function bmiCategory(bmi) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal range";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

/* ============================== SHARED BITS ============================== */

function DishImage({ dish, size = 56 }) {
  const [failed, setFailed] = useState(false);
  const wrap = {
    width: size,
    height: size,
    borderRadius: 10,
    border: "1px solid var(--line)",
    flexShrink: 0,
    background: "var(--leaf-light)",
    overflow: "hidden",
  };
  if (failed) {
    return (
      <div style={{ ...wrap, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.5 }}>
        {dish.emoji}
      </div>
    );
  }
  return (
    <img
      src={`/images/${dish.id}.jpg`}
      alt={dish.name}
      onError={() => setFailed(true)}
      style={{ ...wrap, objectFit: "cover" }}
    />
  );
}

function DishRow({ dish, onSwap, swapping }) {
  return (
    <div className="dish-row">
      <DishImage dish={dish} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="serif" style={{ fontSize: 15, fontWeight: 600 }}>
          {dish.name}
        </div>
        {dish.ingredients.length > 0 && (
          <div style={{ fontSize: 12.5, color: "var(--charcoal-soft)", marginTop: 2 }}>
            {dish.ingredients.map((i) => `${i.name} (${i.display})`).join(", ")}
          </div>
        )}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 4 }}>
          {dish.youtubeUrl && (
            <a href={dish.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12.5, fontWeight: 600 }}>
              ▶ Recipe video
            </a>
          )}
          {onSwap && (
            <button className="dish-swap-btn" onClick={onSwap} disabled={swapping}>
              {swapping ? "Swapping…" : "🔄 Swap"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DayCard({ dayIndex, dayPlan, selectedMeals, onSwapDish, swappingKey }) {
  return (
    <div className="day-card">
      <h3>{DAY_NAMES[dayIndex]}</h3>
      {selectedMeals.map((mealKey) => {
        const dishes = dayPlan[mealKey] || [];
        if (dishes.length === 0) return null;
        const label = MEAL_OPTIONS.find((m) => m.key === mealKey)?.label || mealKey;
        return (
          <div key={mealKey} className="meal-block">
            <div className="meal-block-label">{label}</div>
            {dishes.map((d, dishIndex) => {
              const key = `${dayIndex}_${mealKey}_${dishIndex}`;
              return (
                <DishRow
                  key={d.id + dishIndex}
                  dish={d}
                  swapping={swappingKey === key}
                  onSwap={onSwapDish ? () => onSwapDish(dayIndex, mealKey, dishIndex) : null}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function GroceryList({ plan, selectedMeals }) {
  const [checked, setChecked] = useState({});
  const totals = {}; // key: `${category}|${name}|${unit}` -> qty

  for (const dayKey of Object.keys(plan)) {
    for (const mealKey of selectedMeals) {
      const dishes = plan[dayKey][mealKey] || [];
      for (const dish of dishes) {
        for (const ing of dish.ingredients) {
          const key = `${ing.category}|${ing.name}|${ing.unit}`;
          totals[key] = (totals[key] || 0) + ing.qty;
        }
      }
    }
  }

  const groups = {};
  for (const [key, qty] of Object.entries(totals)) {
    const [category, name, unit] = key.split("|");
    const groupLabel = GROCERY_GROUP_LABELS[category] || GROCERY_GROUP_LABELS.other;
    if (!groups[groupLabel]) groups[groupLabel] = [];
    const display = unit === "g" && qty >= 1000 ? `${(qty / 1000).toFixed(1)} kg` : unit === "ml" && qty >= 1000 ? `${(qty / 1000).toFixed(1)} L` : `${Math.round(qty)} ${unit === "piece" ? "pc" : unit}`;
    groups[groupLabel].push({ key, name, display });
  }
  for (const g of Object.keys(groups)) groups[g].sort((a, b) => a.name.localeCompare(b.name));

  const toggle = (key) => setChecked((c) => ({ ...c, [key]: !c[key] }));

  const copyText = async () => {
    let out = "Grocery list — this week\n\n";
    for (const [group, items] of Object.entries(groups)) {
      out += `${group}\n`;
      for (const it of items) out += `- ${it.name}: ${it.display}\n`;
      out += "\n";
    }
    try {
      await navigator.clipboard.writeText(out);
    } catch (e) {
      /* clipboard may be unavailable */
    }
  };

  return (
    <div className="grocery-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 20 }}>Your grocery list for the week</h3>
        <button className="btn-secondary" onClick={copyText}>
          Copy list
        </button>
      </div>
      <div className="grocery-grid">
        {Object.entries(groups).map(([group, items]) => (
          <div className="grocery-group" key={group}>
            <h4>{group}</h4>
            {items.map((it) => (
              <div key={it.key} className={`grocery-item ${checked[it.key] ? "checked" : ""}`} onClick={() => toggle(it.key)}>
                <span>{it.name}</span>
                <span>{it.display}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: "var(--charcoal-soft)", marginTop: 14 }}>
        Spices and oil aren't listed — check your pantry stock separately.
      </div>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  padding: 10,
  marginBottom: 10,
  borderRadius: 8,
  border: "1px solid var(--line)",
  fontSize: 14,
};

function PrimaryButton({ children, disabled, onClick, type = "button" }) {
  return (
    <button type={type} disabled={disabled} onClick={onClick} className="btn-primary" style={{ width: "100%" }}>
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <button onClick={onClick} className="btn-secondary">
      {children}
    </button>
  );
}

/* ============================== NAVBAR / HERO / HOW-IT-WORKS / FEATURES / FOOTER ============================== */

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <div className="navbar-logo">🥦 {SITE_NAME}</div>
        <nav className="navbar-links">
          <a href="#how-it-works">How it works</a>
          <a href="#why-us">Why us</a>
          <a href="#planner" className="navbar-cta">
            Get my free plan
          </a>
        </nav>
        <button className="navbar-toggle" onClick={() => setOpen(!open)} aria-label="Menu">
          ☰
        </button>
      </div>
      {open && (
        <div className="container" style={{ paddingBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <a href="#how-it-works" onClick={() => setOpen(false)}>How it works</a>
          <a href="#why-us" onClick={() => setOpen(false)}>Why us</a>
          <a href="#planner" onClick={() => setOpen(false)} className="navbar-cta" style={{ display: "inline-block", textAlign: "center" }}>
            Get my free plan
          </a>
        </div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div>
          <div className="hero-eyebrow">100% Vegetarian · No Onion · No Garlic</div>
          <h1>Your Weekly Indian Vegetarian Meal Plan, Personalized For You</h1>
          <p>
            Tell us your goal and your household — get a free 7-day plan built from real, low-oil, home-style Indian
            recipes. No account needed to see it.
          </p>
          <div className="hero-actions">
            <a href="#planner" className="btn-primary" style={{ display: "inline-block" }}>
              Get My Free Plan
            </a>
            <a href="#how-it-works" className="btn-secondary" style={{ display: "inline-block" }}>
              See how it works
            </a>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          🥗🍛🥕
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { n: 1, title: "Tell us your goal", body: "Weight loss, protein-rich, balanced, or gentle/low-oil for BP & cholesterol." },
    { n: 2, title: "Tell us your household", body: "Age, and optionally height/weight — we scale every portion to fit." },
    { n: 3, title: "Get your weekly plan", body: "A full 7-day plan with ingredients, swap options, and a grocery list." },
  ];
  return (
    <section className="section" id="how-it-works">
      <div className="container">
        <div className="section-heading">
          <h2>How it works</h2>
          <p>Three quick steps, no sign-up required to see your first day.</p>
        </div>
        <div className="steps-grid">
          {steps.map((s) => (
            <div className="step-card" key={s.n}>
              <div className="step-number">{s.n}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { emoji: "🧄", title: "No onion, no garlic", body: "Every recipe is built around this from the start, not filtered after the fact." },
    { emoji: "🫒", title: "Genuinely low oil", body: "Oil level is a hard constraint, not a suggestion — especially for gentler diets." },
    { emoji: "🔄", title: "Swap any dish", body: "Don't like today's sabzi? Swap it for another from the same category, instantly." },
    { emoji: "🛒", title: "Auto grocery list", body: "Every ingredient across your week, totalled and grouped by shop section." },
  ];
  return (
    <section className="section features" id="why-us">
      <div className="container">
        <div className="section-heading">
          <h2>Why this planner</h2>
          <p>Built around real Indian home cooking, not generic diet templates.</p>
        </div>
        <div className="features-grid">
          {items.map((f) => (
            <div className="feature-card" key={f.title}>
              <div className="emoji">{f.emoji}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="brand">🥦 {SITE_NAME}</div>
        <div className="disclaimer">
          General food suggestions only — not medical or dietary advice for any health condition. BMI shown is a
          standard screening number, not a diagnosis.
        </div>
      </div>
    </footer>
  );
}

/* ============================== PLANNER WIZARD ============================== */

const emptyMember = { age: "", gender: "", weightKg: "", heightCm: "" };

function PlannerWizard() {
  const [step, setStep] = useState("goal");
  const [goal, setGoal] = useState(null);
  const [customGoal, setCustomGoal] = useState("");
  const [members, setMembers] = useState([{ ...emptyMember }]);
  const [selectedMeals, setSelectedMeals] = useState(["breakfast", "lunch", "dinner"]);
  const [planData, setPlanData] = useState(null);
  const [genError, setGenError] = useState(null);
  const [lead, setLead] = useState({ name: "", phone: "", email: "" });
  const [leadError, setLeadError] = useState(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [swappingKey, setSwappingKey] = useState(null);

  const canContinueGoal = goal && (goal !== "other" || customGoal.trim().length > 0);
  const canContinueHousehold = members.length > 0 && members.every((m) => String(m.age).trim() !== "" && Number(m.age) > 0);
  const canGenerate = selectedMeals.length > 0;

  const updateMember = (idx, patch) => {
    const next = [...members];
    next[idx] = { ...next[idx], ...patch };
    setMembers(next);
  };
  const addMember = () => setMembers([...members, { ...emptyMember }]);
  const removeMember = (idx) => setMembers(members.filter((_, i) => i !== idx));

  const toggleMeal = (key) => {
    setSelectedMeals((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const handleGenerate = async () => {
    setStep("loading");
    setGenError(null);
    try {
      const res = await fetch("/api/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, customGoal, members, selectedMeals }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setPlanData(data);
      setStep("preview");
    } catch (err) {
      setGenError(err.message);
      setStep("meals");
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    setLeadError(null);
    setLeadSubmitting(true);
    try {
      const res = await fetch("/api/save-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...lead, goal: goal === "other" ? customGoal : goal, members }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save your details.");
      setUnlocked(true);
      setStep("full");
    } catch (err) {
      setLeadError(err.message);
    } finally {
      setLeadSubmitting(false);
    }
  };

  const handleSwapDish = async (dayIndex, mealKey, dishIndex) => {
    const key = `${dayIndex}_${mealKey}_${dishIndex}`;
    setSwappingKey(key);
    try {
      const currentDish = planData.plan[String(dayIndex)][mealKey][dishIndex];
      const excludeIds = [];
      for (const dayKey of Object.keys(planData.plan)) {
        for (const mk of Object.keys(planData.plan[dayKey])) {
          for (const d of planData.plan[dayKey][mk]) excludeIds.push(d.id);
        }
      }
      const res = await fetch("/api/swap-dish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: planData.goal,
          mealKey,
          currentDishId: currentDish.id,
          excludeIds,
          household: planData.household,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.dish) return; // silently keep the current dish if no alternative
      const next = JSON.parse(JSON.stringify(planData));
      next.plan[String(dayIndex)][mealKey][dishIndex] = data.dish;
      setPlanData(next);
    } finally {
      setSwappingKey(null);
    }
  };

  const showingPlan = step === "preview" || step === "full";

  return (
    <div className={`planner-card ${showingPlan ? "wide" : ""}`}>
      {step === "goal" && (
        <section style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>What's your main goal?</h2>
          <p style={{ fontSize: 14, color: "var(--charcoal-soft)", marginTop: 0 }}>We'll shape your weekly plan around this.</p>
          {GOALS.map((g) => (
            <button
              key={g.key}
              onClick={() => setGoal(g.key)}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: 14,
                marginBottom: 10,
                borderRadius: 12,
                border: `2px solid ${goal === g.key ? "var(--tomato)" : "var(--line)"}`,
                background: goal === g.key ? "var(--leaf-light)" : "var(--white)",
              }}
            >
              <div className="serif" style={{ fontSize: 16, fontWeight: 600 }}>
                {g.label}
              </div>
              <div style={{ fontSize: 13, color: "var(--charcoal-soft)", marginTop: 2 }}>{g.blurb}</div>
            </button>
          ))}
          {goal === "other" && (
            <div style={{ marginBottom: 14 }}>
              <textarea
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="Tell us more — e.g. 'old age, high BP and cholesterol'"
                rows={3}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid var(--line)", fontSize: 14 }}
              />
              <div style={{ fontSize: 12, color: "var(--charcoal-soft)", marginTop: 4 }}>
                This isn't medical advice — we'll keep meals gentle and low-oil, but please check anything specific to a
                health condition with a doctor or dietitian.
              </div>
            </div>
          )}
          <PrimaryButton disabled={!canContinueGoal} onClick={() => setStep("household")}>
            Continue
          </PrimaryButton>
        </section>
      )}

      {step === "household" && (
        <section style={{ maxWidth: 620, margin: "0 auto" }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Who are you cooking for?</h2>
          <p style={{ fontSize: 14, color: "var(--charcoal-soft)", marginTop: 0 }}>
            Age is required. Gender, weight and height are optional — if you add weight and height, we'll show a BMI
            reference for that member.
          </p>
          {members.map((m, idx) => {
            const bmi = computeBMI(m.weightKg, m.heightCm);
            const isAdult = Number(m.age) >= 18;
            return (
              <div className="member-row" key={idx}>
                <div className="member-row-header">
                  <strong style={{ fontSize: 14 }}>Member {idx + 1}</strong>
                  {members.length > 1 && (
                    <button onClick={() => removeMember(idx)} style={{ border: "none", background: "transparent", color: "var(--tomato)", fontSize: 13 }}>
                      Remove
                    </button>
                  )}
                </div>
                <div className="member-fields">
                  <input type="number" min="0" placeholder="Age" value={m.age} onChange={(e) => updateMember(idx, { age: e.target.value })} style={inputStyle} />
                  <select value={m.gender} onChange={(e) => updateMember(idx, { gender: e.target.value })} style={inputStyle}>
                    <option value="">Gender (optional)</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                  <input type="number" min="0" placeholder="Weight (kg)" value={m.weightKg} onChange={(e) => updateMember(idx, { weightKg: e.target.value })} style={inputStyle} />
                  <input type="number" min="0" placeholder="Height (cm)" value={m.heightCm} onChange={(e) => updateMember(idx, { heightCm: e.target.value })} style={inputStyle} />
                </div>
                {bmi && (
                  <div className={`bmi-note ${!isAdult ? "warn" : ""}`}>
                    {isAdult ? (
                      <>
                        BMI: <strong>{bmi.toFixed(1)}</strong> — {bmiCategory(bmi)}. This is a standard screening number
                        from weight and height only (gender doesn't change it) — not a diagnosis. Your goal above already
                        shapes the plan's oil level and dish mix; for a specific weight target, check with a doctor or
                        dietitian.
                      </>
                    ) : (
                      <>BMI categories for under-18s use age-and-sex growth charts, not adult thresholds — skipping a category here; ask a pediatrician if you'd like one.</>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button
            onClick={addMember}
            style={{ border: `1px dashed var(--line)`, background: "transparent", borderRadius: 8, padding: "8px 12px", fontSize: 13, marginBottom: 18 }}
          >
            + Add another member
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <SecondaryButton onClick={() => setStep("goal")}>Back</SecondaryButton>
            <PrimaryButton disabled={!canContinueHousehold} onClick={() => setStep("meals")}>
              Continue
            </PrimaryButton>
          </div>
        </section>
      )}

      {step === "meals" && (
        <section style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Which meals do you want planned?</h2>
          <p style={{ fontSize: 14, color: "var(--charcoal-soft)", marginTop: 0 }}>Pick at least one.</p>
          {MEAL_OPTIONS.map((m) => (
            <label
              key={m.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 12,
                marginBottom: 8,
                borderRadius: 10,
                border: `2px solid ${selectedMeals.includes(m.key) ? "var(--tomato)" : "var(--line)"}`,
                background: selectedMeals.includes(m.key) ? "var(--leaf-light)" : "var(--white)",
              }}
            >
              <input type="checkbox" checked={selectedMeals.includes(m.key)} onChange={() => toggleMeal(m.key)} />
              <span style={{ fontSize: 15 }}>{m.label}</span>
            </label>
          ))}
          {genError && <div style={{ color: "var(--tomato-deep)", fontSize: 13, marginBottom: 10 }}>⚠ {genError}</div>}
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <SecondaryButton onClick={() => setStep("household")}>Back</SecondaryButton>
            <PrimaryButton disabled={!canGenerate} onClick={handleGenerate}>
              Generate my plan
            </PrimaryButton>
          </div>
        </section>
      )}

      {step === "loading" && (
        <section style={{ textAlign: "center", padding: "60px 0" }}>
          <div className="serif" style={{ fontSize: 18 }}>Building your weekly plan…</div>
          <div style={{ fontSize: 13, color: "var(--charcoal-soft)", marginTop: 8 }}>Picking dishes that fit your goal and household.</div>
        </section>
      )}

      {showingPlan && planData && (
        <section>
          {planData.note && (
            <div style={{ background: "var(--leaf-light)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginBottom: 20, fontSize: 14, maxWidth: 720 }}>
              {planData.note}
            </div>
          )}

          {!unlocked && (
            <>
              <div className="week-grid" style={{ marginBottom: 20 }}>
                <DayCard dayIndex={0} dayPlan={planData.plan["0"]} selectedMeals={selectedMeals} onSwapDish={handleSwapDish} swappingKey={swappingKey} />
              </div>

              <div style={{ position: "relative" }}>
                <div className="week-grid" style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.55 }}>
                  {[1, 2, 3].map((d) => (
                    <DayCard key={d} dayIndex={d} dayPlan={planData.plan[String(d)]} selectedMeals={selectedMeals} />
                  ))}
                </div>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 30 }}>
                  <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: 12, padding: 18, maxWidth: 420, width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                    <div className="serif" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
                      Unlock your full 7-day plan
                    </div>
                    <div style={{ fontSize: 13, color: "var(--charcoal-soft)", marginBottom: 14 }}>
                      Enter your details and we'll show the rest of the week, plus your grocery list.
                    </div>
                    <form onSubmit={handleLeadSubmit}>
                      <input placeholder="Name (optional)" value={lead.name} onChange={(e) => setLead({ ...lead, name: e.target.value })} style={inputStyle} />
                      <input placeholder="Phone number" value={lead.phone} onChange={(e) => setLead({ ...lead, phone: e.target.value })} style={inputStyle} required />
                      <input placeholder="Email" type="email" value={lead.email} onChange={(e) => setLead({ ...lead, email: e.target.value })} style={inputStyle} required />
                      {leadError && <div style={{ color: "var(--tomato-deep)", fontSize: 13, marginBottom: 8 }}>⚠ {leadError}</div>}
                      <PrimaryButton type="submit" disabled={leadSubmitting}>
                        {leadSubmitting ? "Saving…" : "Show my full week"}
                      </PrimaryButton>
                    </form>
                  </div>
                </div>
              </div>
            </>
          )}

          {unlocked && (
            <>
              <div className="week-grid">
                {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                  <DayCard
                    key={d}
                    dayIndex={d}
                    dayPlan={planData.plan[String(d)]}
                    selectedMeals={selectedMeals}
                    onSwapDish={handleSwapDish}
                    swappingKey={swappingKey}
                  />
                ))}
              </div>
              <GroceryList plan={planData.plan} selectedMeals={selectedMeals} />
            </>
          )}
        </section>
      )}
    </div>
  );
}

/* ============================== PAGE ============================== */

export default function Home() {
  return (
    <div className="page">
      <Navbar />
      <Hero />
      <HowItWorks />
      <Features />
      <section className="planner-section" id="planner">
        <div className="container">
          <div className="section-heading">
            <h2>Build your plan</h2>
            <p>Takes under a minute — your first day is free to see right away.</p>
          </div>
          <PlannerWizard />
        </div>
      </section>
      <Footer />
    </div>
  );
}
