import { useState } from "react";

let nextQuestionId = 0;
const newQuestion = () => ({
  id: nextQuestionId++,
  answerMode: "single",
  question: "",
  explanation: "",
  options: ["", "", "", ""],
  correctAnswer: "",
  correctAnswers: [],
  numericAnswer: { value: "", tolerance: "0" },
  leftColumn: "",
  rightColumn: "",
});

const choiceLetter = (index) => String.fromCharCode(65 + index);

function SelectField({ label, value, onChange, options, disabled }) {
  return (
    <label className="admin-navta-field">
      <span className="admin-navta-label">{label}</span>
      <select
        className="admin-navta-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        required
      >
        <option value="" disabled>Choose {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function QuestionFields({ item, mode, matching, update }) {
  const updateOptions = (index, value) => {
    update({ options: item.options.map((option, current) => current === index ? value : option) });
  };

  return (
    <div className="admin-navta-grid">
      <label className="admin-navta-field full">
        <span className="admin-navta-label">Question</span>
        <textarea
          className="admin-navta-textarea"
          value={item.question}
          onChange={(event) => update({ question: event.target.value })}
          required
        />
      </label>

      {matching && ["leftColumn", "rightColumn"].map((field, index) => (
        <label className="admin-navta-field" key={field}>
          <span className="admin-navta-label">Column {choiceLetter(index)}</span>
          <textarea
            className="admin-navta-textarea"
            placeholder="Enter one entry per line."
            value={item[field]}
            onChange={(event) => update({ [field]: event.target.value })}
            required
          />
        </label>
      ))}

      {mode === "numeric" ? (
        <>
          <label className="admin-navta-field">
            <span className="admin-navta-label">Correct numerical answer</span>
            <input
              className="admin-navta-input"
              type="number"
              step="any"
              value={item.numericAnswer.value}
              onChange={(event) => update({ numericAnswer: { ...item.numericAnswer, value: event.target.value } })}
              required
            />
          </label>
          <label className="admin-navta-field">
            <span className="admin-navta-label">Allowed difference from answer</span>
            <input
              className="admin-navta-input"
              type="number"
              min="0"
              step="any"
              value={item.numericAnswer.tolerance}
              onChange={(event) => update({ numericAnswer: { ...item.numericAnswer, tolerance: event.target.value } })}
              required
            />
          </label>
        </>
      ) : (
        <>
          {item.options.map((option, index) => (
            <label className="admin-navta-field" key={index}>
              <span className="admin-navta-label">Choice {choiceLetter(index)}</span>
              <input
                className="admin-navta-input"
                placeholder={matching ? "A–2, B–1" : undefined}
                value={option}
                onChange={(event) => updateOptions(index, event.target.value)}
                required
              />
            </label>
          ))}
          {mode === "multiple" ? (
            <fieldset className="admin-navta-field full min-w-0">
              <legend className="admin-navta-label">Correct choices</legend>
              <div className="flex flex-wrap gap-5">
                {item.options.map((_, index) => (
                  <label className="inline-flex items-center gap-2" key={index}>
                    <input
                      type="checkbox"
                      checked={item.correctAnswers.includes(index)}
                      onChange={(event) => update({
                        correctAnswers: event.target.checked
                          ? [...item.correctAnswers, index]
                          : item.correctAnswers.filter((answer) => answer !== index),
                      })}
                    />
                    {choiceLetter(index)}
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <SelectField
              label="Correct choice"
              options={item.options.map((_, index) => choiceLetter(index))}
              value={item.correctAnswer}
              onChange={(correctAnswer) => update({ correctAnswer })}
            />
          )}
        </>
      )}

      <label className="admin-navta-field full">
        <span className="admin-navta-label">Explanation</span>
        <textarea
          className="admin-navta-textarea"
          value={item.explanation}
          onChange={(event) => update({ explanation: event.target.value })}
          required
        />
      </label>
    </div>
  );
}

const prepareQuestion = (item) => ({
  ...item,
  correctAnswer: item.correctAnswer ? item.correctAnswer.charCodeAt(0) - 65 : null,
});

export default function AdvancedQuestionAuthoring({
  subjects,
  classes,
  chapters,
  difficulties,
  buildHeaders,
  onSaved,
}) {
  const [classification, setClassification] = useState({
    subject: "", exam: "", classLevel: "", chapter: "", difficulty: "",
  });
  const [format, setFormat] = useState("numeric");
  const [question, setQuestion] = useState(newQuestion);
  const [casePassage, setCasePassage] = useState("");
  const [questions, setQuestions] = useState(() => [newQuestion(), newQuestion()]);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const isCaseStudy = format === "case-study";

  const updateClassification = (patch) => setClassification((previous) => ({ ...previous, ...patch }));
  const updateItem = (id, patch) => {
    setQuestions((previous) => previous.map((item) => item.id === id ? { ...item, ...patch } : item));
  };

  async function save(event) {
    event.preventDefault();
    if (saving) return;
    setNotice(null);
    setSaving(true);

    try {
      const body = isCaseStudy
        ? { casePassage, questions: questions.map(prepareQuestion) }
        : prepareQuestion(question);
      const response = await fetch("/api/navta-test/questions/structured", {
        method: "POST",
        credentials: "include",
        headers: buildHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ...classification, ...body, format }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Unable to save the draft.");
      setNotice({
        text: result.duplicateCount
          ? `Draft saved. ${result.duplicateCount} question(s) may match an existing bank item.`
          : "Draft saved. Open the question bank to review and publish it.",
        type: "success",
      });
      if (isCaseStudy) {
        setCasePassage("");
        setQuestions([newQuestion(), newQuestion()]);
      } else {
        setQuestion(newQuestion());
      }
      onSaved();
    } catch (error) {
      setNotice({ text: error.message || "Unable to save the draft.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section id="advanced-question-entry" className="admin-navta-test-card scroll-mt-24">
      <h2 className="admin-navta-section-title">Advanced question formats</h2>
      <form onSubmit={save}>
        <fieldset className="min-w-0 space-y-5" disabled={saving}>
          <div className="admin-navta-grid">
            <SelectField label="Subject" value={classification.subject} options={Object.keys(subjects)}
              onChange={(subject) => updateClassification({ subject, exam: "", classLevel: "", chapter: "" })} />
            <SelectField label="Preparation" value={classification.exam} options={subjects[classification.subject] || []}
              onChange={(exam) => updateClassification({ exam })} disabled={!classification.subject} />
            <SelectField label="Class" value={classification.classLevel} options={classes}
              onChange={(classLevel) => updateClassification({ classLevel, chapter: "" })} disabled={!classification.subject} />
            <SelectField label="Chapter" value={classification.chapter}
              options={chapters[classification.subject]?.[classification.classLevel] || []}
              onChange={(chapter) => updateClassification({ chapter })} disabled={!classification.classLevel} />
            <SelectField label="Difficulty" value={classification.difficulty} options={difficulties}
              onChange={(difficulty) => updateClassification({ difficulty })} />
            <label className="admin-navta-field">
              <span className="admin-navta-label">Format</span>
              <select className="admin-navta-select" value={format} onChange={(event) => setFormat(event.target.value)}>
                <option value="numeric">Numerical answer</option>
                <option value="multiple">Multiple correct choices</option>
                <option value="matching">Match the columns</option>
                <option value="case-study">Case study with multiple questions</option>
              </select>
            </label>
          </div>

          {isCaseStudy ? (
            <>
              <label className="admin-navta-field">
                <span className="admin-navta-label">Shared passage</span>
                <textarea className="admin-navta-textarea" value={casePassage}
                  onChange={(event) => setCasePassage(event.target.value)} required />
              </label>
              {questions.map((item, index) => (
                <fieldset className="space-y-4 rounded-xl border border-current/20 p-4" key={item.id}>
                  <legend className="px-2 font-semibold">Question {index + 1}</legend>
                  <label className="admin-navta-field">
                    <span className="admin-navta-label">Answer type</span>
                    <select className="admin-navta-select" value={item.answerMode}
                      onChange={(event) => updateItem(item.id, { answerMode: event.target.value })}>
                      <option value="single">One correct choice</option>
                      <option value="multiple">Multiple correct choices</option>
                      <option value="numeric">Numerical answer</option>
                    </select>
                  </label>
                  <QuestionFields item={item} mode={item.answerMode} update={(patch) => updateItem(item.id, patch)} />
                  {questions.length > 2 && (
                    <button type="button" className="admin-navta-secondary-button"
                      onClick={() => setQuestions((previous) => previous.filter((candidate) => candidate.id !== item.id))}>
                      Remove question {index + 1}
                    </button>
                  )}
                </fieldset>
              ))}
              {questions.length < 10 && (
                <button type="button" className="admin-navta-secondary-button"
                  onClick={() => setQuestions((previous) => [...previous, newQuestion()])}>
                  Add a question to the passage
                </button>
              )}
            </>
          ) : (
            <QuestionFields item={question} mode={format} matching={format === "matching"}
              update={(patch) => setQuestion((previous) => ({ ...previous, ...patch }))} />
          )}

          <button type="submit" className="admin-navta-submit">
            {saving ? "Saving draft…" : "Save as draft"}
          </button>
        </fieldset>
      </form>
      {notice && <p role="status" className={`admin-navta-message ${notice.type}`}>{notice.text}</p>}
    </section>
  );
}
