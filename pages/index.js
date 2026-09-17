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

/* ============================== SHARED BITS ============================== */

function DishImage({ dish, size = 64 }) {
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

function DishCard({ dish }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid var(--line)" }}>
      <DishImage dish={dish} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="serif" style={{ fontSize: 16, fontWeight: 600 }}>
          {dish.name}
        </div>
        {dish.ingredients.length > 0 && (
          <div style={{ fontSize: 13, color: "var(--charcoal-soft)", marginTop: 2 }}>
            {dish.ingredients.map((i) => `${i.name} (${i.qty})`).join(", ")}
          </div>
        )}
        {dish.youtubeUrl && (
          <a href={dish.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, fontWeight: 600 }}>
            ▶ Watch recipe video
          </a>
        )}
      </div>
    </div>
  );
}

function DayPlan({ dayIndex, dayPlan, selectedMeals }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "var(--tomato-deep)" }}>{DAY_NAMES[dayIndex]}</h3>
      {selectedMeals.map((mealKey) => {
        const dishes = dayPlan[mealKey] || [];
        if (dishes.length === 0) return null;
        const label = MEAL_OPTIONS.find((m) => m.key === mealKey)?.label || mealKey;
        return (
          <div key={mealKey} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--charcoal-soft)", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 8 }}>
              {label}
            </div>
            {dishes.map((d) => (
              <DishCard key={d.id} dish={d} />
            ))}
          </div>
        );
      })}
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

/* ============================== NAVBAR ============================== */

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

/* ============================== HERO ============================== */

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

/* ============================== HOW IT WORKS ============================== */

function HowItWorks() {
  const steps = [
    { n: 1, title: "Tell us your goal", body: "Weight loss, protein-rich, balanced, or gentle/low-oil for BP & cholesterol." },
    { n: 2, title: "Tell us your household", body: "How many people, and their ages — we scale every portion to fit." },
    { n: 3, title: "Get your weekly plan", body: "A full 7-day plan with ingredients for each dish, ready to cook from." },
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

/* ============================== FEATURES ============================== */

function Features() {
  const items = [
    { emoji: "🧄", title: "No onion, no garlic", body: "Every recipe is built around this from the start, not filtered after the fact." },
    { emoji: "🫒", title: "Genuinely low oil", body: "Oil level is a hard constraint, not a suggestion — especially for gentler diets." },
    { emoji: "🌱", title: "Seasonal & rotating", body: "Recipes rotate through the week and the season so nothing repeats too soon." },
    { emoji: "🛒", title: "Ready-to-cook ingredients", body: "Every dish lists exactly what you need, scaled to your household size." },
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

/* ============================== FOOTER ============================== */

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="brand">🥦 {SITE_NAME}</div>
        <div className="disclaimer">
          General food suggestions only — not medical or dietary advice for any health condition.
        </div>
      </div>
    </footer>
  );
}

/* ============================== PLANNER WIZARD ============================== */

function PlannerWizard() {
  const [step, setStep] = useState("goal"); // goal -> household -> meals -> loading -> preview -> full
  const [goal, setGoal] = useState(null);
  const [customGoal, setCustomGoal] = useState("");
  const [members, setMembers] = useState([{ age: "" }]);
  const [selectedMeals, setSelectedMeals] = useState(["breakfast", "lunch", "dinner"]);
  const [planData, setPlanData] = useState(null);
  const [genError, setGenError] = useState(null);
  const [lead, setLead] = useState({ name: "", phone: "", email: "" });
  const [leadError, setLeadError] = useState(null);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const canContinueGoal = goal && (goal !== "other" || customGoal.trim().length > 0);
  const canContinueHousehold = members.length > 0 && members.every((m) => String(m.age).trim() !== "" && Number(m.age) > 0);
  const canGenerate = selectedMeals.length > 0;

  const updateMemberAge = (idx, age) => {
    const next = [...members];
    next[idx] = { age };
    setMembers(next);
  };
  const addMember = () => setMembers([...members, { age: "" }]);
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
        body: JSON.stringify({ ...lead, goal: goal === "other" ? customGoal : goal }),
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

  return (
    <div className="planner-card">
      {step === "goal" && (
        <section>
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
        <section>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Who are you cooking for?</h2>
          <p style={{ fontSize: 14, color: "var(--charcoal-soft)", marginTop: 0 }}>Add each family member's age.</p>
          {members.map((m, idx) => (
            <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 14, width: 74 }}>Member {idx + 1}</span>
              <input
                type="number"
                min="0"
                placeholder="Age"
                value={m.age}
                onChange={(e) => updateMemberAge(idx, e.target.value)}
                style={{ width: 90, padding: 8, borderRadius: 8, border: "1px solid var(--line)", fontSize: 14 }}
              />
              {members.length > 1 && (
                <button onClick={() => removeMember(idx)} style={{ border: "none", background: "transparent", color: "var(--tomato)", fontSize: 13 }}>
                  Remove
                </button>
              )}
            </div>
          ))}
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
        <section>
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

      {(step === "preview" || step === "full") && planData && (
        <section>
          {planData.note && (
            <div style={{ background: "var(--leaf-light)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 14 }}>
              {planData.note}
            </div>
          )}

          <DayPlan dayIndex={0} dayPlan={planData.plan["0"]} selectedMeals={selectedMeals} />

          {!unlocked && (
            <div style={{ position: "relative" }}>
              <div style={{ filter: "blur(4px)", pointerEvents: "none", userSelect: "none", opacity: 0.6 }}>
                {[1, 2, 3].map((d) => (
                  <DayPlan key={d} dayIndex={d} dayPlan={planData.plan[String(d)]} selectedMeals={selectedMeals} />
                ))}
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 30 }}>
                <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: 12, padding: 18, maxWidth: 420, width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                  <div className="serif" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
                    Unlock your full 7-day plan
                  </div>
                  <div style={{ fontSize: 13, color: "var(--charcoal-soft)", marginBottom: 14 }}>
                    Enter your details and we'll show the rest of the week right here.
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
          )}

          {unlocked &&
            [1, 2, 3, 4, 5, 6].map((d) => <DayPlan key={d} dayIndex={d} dayPlan={planData.plan[String(d)]} selectedMeals={selectedMeals} />)}
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
