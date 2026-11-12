import { useState } from "react";

export default function NavtaScoringSettings({ buildHeaders }) {
  const [policies, setPolicies] = useState(null);
  const [exam, setExam] = useState("Boards");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const policy = policies?.[exam];

  async function loadPolicies() {
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/navta-test/scoring-policies", { headers: buildHeaders() });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load marking rules.");
      setPolicies(data.policies);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(name, value) {
    setMessage("");
    setPolicies((previous) => ({ ...previous, [exam]: { ...previous[exam], [name]: value } }));
  }

  async function savePolicy(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch(`/api/navta-test/scoring-policies/${exam}`, {
        method: "PUT",
        headers: buildHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          correctMarks: Number(policy.correctMarks),
          incorrectPenalty: Number(policy.incorrectPenalty),
          partialCredit: policy.partialCredit,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not save marking rules.");
      setPolicies((previous) => ({ ...previous, [exam]: data.policy }));
      setMessage(`${exam} marking rules saved.`);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <details
      className="admin-navta-test-card"
      onToggle={(event) => {
        if (event.currentTarget.open && !policies && !loading) loadPolicies();
      }}
    >
      <summary className="cursor-pointer font-semibold">Standard test marking rules</summary>
      <p className="mt-3 text-sm">
        Set objective marks by preparation. Each new test uses the rules saved when it starts.
      </p>
      {loading && <p role="status" className="mt-3 text-sm">Loading marking rules…</p>}
      {!loading && !policies && (
        <button type="button" className="admin-navta-secondary-button mt-3" onClick={loadPolicies}>
          Load marking rules
        </button>
      )}
      {policy && (
        <form className="admin-navta-grid mt-4" onSubmit={savePolicy}>
          <label className="admin-navta-field">
            <span className="admin-navta-label">Preparation</span>
            <select
              className="admin-navta-select"
              value={exam}
              disabled={saving}
              onChange={(event) => { setExam(event.target.value); setMessage(""); }}
            >
              {Object.keys(policies).map((name) => <option key={name}>{name}</option>)}
            </select>
          </label>
          <label className="admin-navta-field">
            <span className="admin-navta-label">Marks for a correct answer</span>
            <input
              className="admin-navta-input"
              type="number"
              required
              step="0.01"
              min="0.01"
              max="100"
              disabled={saving}
              value={policy.correctMarks}
              onChange={(event) => updateField("correctMarks", event.target.value)}
            />
          </label>
          <label className="admin-navta-field">
            <span className="admin-navta-label">Marks deducted for a wrong answer</span>
            <input
              className="admin-navta-input"
              type="number"
              required
              step="0.01"
              min="0"
              max={policy.correctMarks}
              disabled={saving}
              value={policy.incorrectPenalty}
              onChange={(event) => updateField("incorrectPenalty", event.target.value)}
            />
          </label>
          <label className="admin-navta-field flex items-center gap-3">
            <input
              type="checkbox"
              checked={policy.partialCredit}
              disabled={saving}
              onChange={(event) => updateField("partialCredit", event.target.checked)}
            />
            <span>Give partial credit for a subset of correct choices</span>
          </label>
          <div className="admin-navta-field full">
            <button className="admin-navta-secondary-button" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save marking rules"}
            </button>
          </div>
        </form>
      )}
      {message && <p role="status" className="mt-3 text-sm">{message}</p>}
    </details>
  );
}
