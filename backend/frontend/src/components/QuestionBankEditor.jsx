import { useEffect, useRef, useState } from "react";
import QuestionAttachments, { getQuestionAttachments } from "./QuestionAttachments";

const choices = ["A", "B", "C", "D"];
const fieldClass = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900";

function EditField({ label, children }) {
  return <label className="block space-y-1 text-sm font-medium"><span>{label}</span>{children}</label>;
}

function makeDraft(question) {
  return {
    question: question.question || "",
    explanation: question.explanation || "",
    difficulty: question.difficulty || "Medium",
    options: choices.map((_, index) => question.options?.[index] || ""),
    correctAnswer: question.correctAnswer ?? "",
    correctAnswers: question.correctAnswers || [],
    value: question.numericAnswer?.value ?? "",
    tolerance: question.numericAnswer?.tolerance ?? 0,
    modelAnswer: question.modelAnswer || "",
    keyPoints: (question.keyPoints || []).join("\n"),
    maxMarks: question.maxMarks ?? 1,
    evaluationInstructions: question.evaluationInstructions || "",
  };
}

export default function QuestionBankEditor({ question, mode, onClose, onSave, renderQuestion, renderText }) {
  const dialog = useRef(null);
  const [draft, setDraft] = useState(() => makeDraft(question));
  const [attachments, setAttachments] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const written = ["short", "long"].includes(question.questionType);
  const answerMode = question.answerMode || "single";
  const preview = mode === "preview";

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  function update(field, value) {
    setDraft(current => ({ ...current, [field]: value }));
  }

  async function save(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const changes = {
      question: draft.question,
      explanation: draft.explanation,
      difficulty: draft.difficulty,
      maxMarks: Number(draft.maxMarks),
    };
    if (written) {
      changes.modelAnswer = draft.modelAnswer;
      changes.keyPoints = draft.keyPoints.split("\n");
      changes.evaluationInstructions = draft.evaluationInstructions;
    } else if (answerMode === "numeric") {
      changes.numericAnswer = { value: Number(draft.value), tolerance: Number(draft.tolerance) };
    } else {
      changes.options = draft.options;
      if (answerMode === "multiple") changes.correctAnswers = draft.correctAnswers;
      else changes.correctAnswer = Number(draft.correctAnswer);
    }

    try {
      await onSave(question, changes, attachments);
    } catch (failure) {
      setError(failure.message);
      setSaving(false);
    }
  }

  const feedback = written
    ? question.modelAnswer
    : answerMode === "numeric"
      ? `${question.numericAnswer?.value ?? "—"} ± ${question.numericAnswer?.tolerance ?? 0}`
      : answerMode === "multiple"
        ? (question.correctAnswers || []).map(index => choices[index]).join(", ")
        : choices[question.correctAnswer];

  return (
    <dialog
      ref={dialog}
      aria-labelledby="navta-question-dialog-title"
      onCancel={event => { event.preventDefault(); if (!saving) onClose(); }}
      className="m-auto max-h-[90vh] w-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-950/70 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="navta-question-dialog-title" className="text-xl font-bold">
          {preview ? "Student preview" : "Edit saved question"}
        </h2>
        <button type="button" className="admin-navta-secondary-button" onClick={onClose} disabled={saving}>Close</button>
      </div>

      {question.caseStudy?.passage && (
        <div className="mb-4 whitespace-pre-wrap rounded-xl border border-slate-300 p-3 dark:border-slate-700">
          <p className="mb-1 font-semibold">Case passage · Question {question.caseStudy.order + 1} of {question.caseStudy.size}</p>
          {renderText(question.caseStudy.passage)}
        </div>
      )}

      {preview ? (
        <div className="space-y-4">
          <div className="whitespace-pre-wrap">{renderQuestion(question)}</div>
          {written || answerMode === "numeric" ? (
            <EditField label={written ? "Your answer" : "Numerical answer"}>
              {written ? <textarea rows={4} className={fieldClass} /> : <input type="number" step="any" className={fieldClass} />}
            </EditField>
          ) : (
            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium">{answerMode === "multiple" ? "Select all that apply" : "Select one answer"}</legend>
              {(question.options || []).map((option, index) => (
                <label key={index} className="flex items-center gap-3 rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700">
                  <input name="preview-answer" type={answerMode === "multiple" ? "checkbox" : "radio"} />
                  <span>{option === choices[index] ? option : <>{choices[index]}. {renderText(option)}</>}</span>
                </label>
              ))}
            </fieldset>
          )}
          <button type="button" className="admin-navta-secondary-button" onClick={() => setShowFeedback(value => !value)}>
            {showFeedback ? "Hide answer and explanation" : "Show answer and explanation"}
          </button>
          {showFeedback && (
            <div className="space-y-2 whitespace-pre-wrap rounded-xl border border-slate-300 p-3 dark:border-slate-700">
              <p className="font-semibold">{written ? "Model answer" : "Correct answer"}</p>
              {renderText(feedback || "—")}
              {question.explanation && <p>{renderText(question.explanation)}</p>}
            </div>
          )}
        </div>
      ) : (
        <form className="space-y-4" onSubmit={save}>
          <EditField label="Question text">
            <textarea rows={4} className={fieldClass} value={draft.question} onChange={event => update("question", event.target.value)} required />
          </EditField>
          <QuestionAttachments images={attachments ?? getQuestionAttachments(question)} onChange={setAttachments} disabled={saving} />
          <EditField label="Explanation shown to students">
            <textarea rows={3} className={fieldClass} value={draft.explanation} onChange={event => update("explanation", event.target.value)} />
          </EditField>
          <div className="grid gap-3 sm:grid-cols-2">
            <EditField label="Difficulty">
              <select className={fieldClass} value={draft.difficulty} onChange={event => update("difficulty", event.target.value)} disabled={Boolean(question.caseStudy?.id)}>
                {['Easy', 'Medium', 'Hard'].map(value => <option key={value}>{value}</option>)}
              </select>
            </EditField>
            <EditField label="Maximum marks">
              <input type="number" min="1" step="any" className={fieldClass} value={draft.maxMarks} onChange={event => update("maxMarks", event.target.value)} required />
            </EditField>
          </div>
          {written && (
            <>
              <EditField label="Model answer"><textarea rows={3} className={fieldClass} value={draft.modelAnswer} onChange={event => update("modelAnswer", event.target.value)} required /></EditField>
              <EditField label="Key points (one per line)"><textarea rows={3} className={fieldClass} value={draft.keyPoints} onChange={event => update("keyPoints", event.target.value)} required /></EditField>
              <EditField label="Marking instructions"><textarea rows={3} className={fieldClass} value={draft.evaluationInstructions} onChange={event => update("evaluationInstructions", event.target.value)} /></EditField>
            </>
          )}
          {!written && answerMode === "numeric" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="Correct numerical answer"><input type="number" step="any" className={fieldClass} value={draft.value} onChange={event => update("value", event.target.value)} required /></EditField>
              <EditField label="Absolute tolerance"><input type="number" min="0" step="any" className={fieldClass} value={draft.tolerance} onChange={event => update("tolerance", event.target.value)} required /></EditField>
            </div>
          )}
          {!written && answerMode !== "numeric" && (
            <>
              {choices.map((letter, index) => (
                <EditField key={letter} label={`Choice ${letter}`}>
                  <textarea rows={2} className={fieldClass} value={draft.options[index]} onChange={event => update("options", draft.options.map((option, item) => item === index ? event.target.value : option))} required />
                </EditField>
              ))}
              {answerMode === "multiple" ? (
                <fieldset className="flex flex-wrap gap-3">
                  <legend className="mb-1 text-sm font-medium">Correct choices</legend>
                  {choices.map((letter, index) => (
                    <label key={letter} className="flex items-center gap-2">
                      <input type="checkbox" checked={draft.correctAnswers.includes(index)} onChange={event => update("correctAnswers", event.target.checked ? [...draft.correctAnswers, index] : draft.correctAnswers.filter(item => item !== index))} />{letter}
                    </label>
                  ))}
                </fieldset>
              ) : (
                <EditField label="Correct choice">
                  <select className={fieldClass} value={draft.correctAnswer} onChange={event => update("correctAnswer", event.target.value)} required>
                    <option value="">Select a choice</option>
                    {choices.map((letter, index) => <option key={letter} value={index}>{letter}</option>)}
                  </select>
                </EditField>
              )}
            </>
          )}
          {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
          <button className="admin-navta-submit" type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        </form>
      )}
    </dialog>
  );
}
