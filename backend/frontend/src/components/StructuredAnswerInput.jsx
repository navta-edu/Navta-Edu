import { useState } from "react";

export default function StructuredAnswerInput({
  question, disabled, onAnswer, renderContent, submitStyle,
}) {
  const [numeric, setNumeric] = useState("");
  const [choices, setChoices] = useState([]);
  const numericMode = question.answerMode === "numeric";
  const hasAnswer = numericMode
    ? numeric.trim() !== "" && Number.isFinite(Number(numeric))
    : choices.length > 0;

  function submit(event) {
    event.preventDefault();
    if (hasAnswer && !disabled) onAnswer(numericMode ? Number(numeric) : choices);
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={disabled} className="min-w-0 space-y-3">
        {numericMode ? (
          <label className="block">
            <span className="mb-2 block font-semibold">Numerical answer</span>
            <input
              className="navta-option"
              type="number"
              step="any"
              value={numeric}
              onChange={(event) => setNumeric(event.target.value)}
              required
            />
          </label>
        ) : (
          <div role="group" aria-label="Select all correct choices">
            {(question.options ?? []).map((option, index) => (
              <label className="navta-option" key={index}>
                <input
                  type="checkbox"
                  checked={choices.includes(index)}
                  onChange={(event) => setChoices((previous) => event.target.checked
                    ? [...previous, index]
                    : previous.filter((choice) => choice !== index))}
                />
                <span className="navta-option-content">{renderContent(option)}</span>
              </label>
            ))}
          </div>
        )}
        {!disabled && (
          <button type="submit" style={submitStyle} disabled={!hasAnswer}>
            Check answer
          </button>
        )}
      </fieldset>
    </form>
  );
}
