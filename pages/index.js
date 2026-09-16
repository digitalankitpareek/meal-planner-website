import { useState } from "react";

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

function DishImage({ dish, size = 64 }) {
  const [failed, setFailed] = useState(false);
  const wrap = {
    width: size,
    height: size,
    borderRadius: 10,
    border: "1px solid var(--line)",
    flexShrink: 0,
    background: "var(--paper-deep)",
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
          <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>
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
      <h3 style={{ margin: "0 0 4px", fontSize: 16, color: "var(--chili-deep)" }}>{DAY_NAMES[dayIndex]}</h3>
      {selectedMeals.map((mealKey) => {
        const dishes = dayPlan[mealKey] || [];
        if (dishes.length === 0) return null;
        const label = MEAL_OPTIONS.find((m) => m.key === mealKey)?.label || mealKey;
        return (
          <div key={mealKey} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: 0.4, marginTop: 8 }}>
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

export default function Home() {
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
    <div style={{ maxWidth: 560, margin: "0 auto", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{ background: "var(--ink)", color: "var(--white)", padding: "22px 20px" }}>
        <h1 className="serif" style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>
          Ghar ka Khana
        </h1>
        <div style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}>
          Free weekly Indian vegetarian meal plan — no onion, no garlic, low oil.
        </div>
      </header>

      <main style={{ flex: 1, padding: 20 }}>
        {step === "goal" && (
          <section>
            <h2 style={{ fontSize: 19, marginBottom: 4 }}>What's your main goal?</h2>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 0 }}>We'll shape your weekly plan around this.</p>
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
                  border: `2px solid ${goal === g.key ? "var(--chili)" : "var(--line)"}`,
                  background: goal === g.key ? "var(--paper-deep)" : "var(--white)",
                }}
              >
                <div className="serif" style={{ fontSize: 16, fontWeight: 600 }}>
                  {g.label}
                </div>
                <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 2 }}>{g.blurb}</div>
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
                <div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 4 }}>
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
            <h2 style={{ fontSize: 19, marginBottom: 4 }}>Who are you cooking for?</h2>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 0 }}>Add each family member's age.</p>
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
                  <button onClick={() => removeMember(idx)} style={{ border: "none", background: "transparent", color: "var(--chili)", fontSize: 13 }}>
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
            <h2 style={{ fontSize: 19, marginBottom: 4 }}>Which meals do you want planned?</h2>
            <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 0 }}>Pick at least one.</p>
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
                  border: `2px solid ${selectedMeals.includes(m.key) ? "var(--chili)" : "var(--line)"}`,
                  background: selectedMeals.includes(m.key) ? "var(--paper-deep)" : "var(--white)",
                }}
              >
                <input type="checkbox" checked={selectedMeals.includes(m.key)} onChange={() => toggleMeal(m.key)} />
                <span style={{ fontSize: 15 }}>{m.label}</span>
              </label>
            ))}
            {genError && <div style={{ color: "var(--chili-deep)", fontSize: 13, marginBottom: 10 }}>⚠ {genError}</div>}
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
            <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 8 }}>Picking dishes that fit your goal and household.</div>
          </section>
        )}

        {(step === "preview" || step === "full") && planData && (
          <section>
            {planData.note && (
              <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 14 }}>
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
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "center",
                    paddingTop: 30,
                  }}
                >
                  <div style={{ background: "var(--white)", border: "1px solid var(--line)", borderRadius: 12, padding: 18, maxWidth: 420, width: "100%", boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
                    <div className="serif" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>
                      Unlock your full 7-day plan
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 14 }}>
                      Enter your details and we'll show the rest of the week right here.
                    </div>
                    <form onSubmit={handleLeadSubmit}>
                      <input
                        placeholder="Name (optional)"
                        value={lead.name}
                        onChange={(e) => setLead({ ...lead, name: e.target.value })}
                        style={inputStyle}
                      />
                      <input
                        placeholder="Phone number"
                        value={lead.phone}
                        onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                        style={inputStyle}
                        required
                      />
                      <input
                        placeholder="Email"
                        type="email"
                        value={lead.email}
                        onChange={(e) => setLead({ ...lead, email: e.target.value })}
                        style={inputStyle}
                        required
                      />
                      {leadError && <div style={{ color: "var(--chili-deep)", fontSize: 13, marginBottom: 8 }}>⚠ {leadError}</div>}
                      <PrimaryButton type="submit" disabled={leadSubmitting}>
                        {leadSubmitting ? "Saving…" : "Show my full week"}
                      </PrimaryButton>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {unlocked &&
              [1, 2, 3, 4, 5, 6].map((d) => (
                <DayPlan key={d} dayIndex={d} dayPlan={planData.plan[String(d)]} selectedMeals={selectedMeals} />
              ))}
          </section>
        )}
      </main>

      <footer style={{ padding: "16px 20px", fontSize: 12, color: "var(--ink-soft)", textAlign: "center" }}>
        General food suggestions only — not medical or dietary advice for any health condition.
      </footer>
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
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        flex: 1,
        padding: "12px 16px",
        borderRadius: 10,
        border: "none",
        background: disabled ? "var(--line)" : "var(--chili)",
        color: "var(--white)",
        fontSize: 15,
        fontWeight: 700,
        width: "100%",
      }}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "12px 16px",
        borderRadius: 10,
        border: "1px solid var(--line)",
        background: "transparent",
        color: "var(--ink)",
        fontSize: 15,
      }}
    >
      {children}
    </button>
  );
}
