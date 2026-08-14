import React, { useState } from "react";

const subjects = ["Physics", "Chemistry", "Maths", "Biology"];

const exams = ["NEET", "JEE", "Boards"];

const difficulties = ["Easy", "Medium", "Hard"];

const classes = ["Class 11", "Class 12"];

export default function AdminNavtaTest() {
  const [form, setForm] = useState({
    subject: "",
    exam: "",
    classLevel: "",
    chapter: "",
    difficulty: "",
    question: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "",
    explanation: "",
  });

  const [message, setMessage] = useState("");

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const submitQuestion = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(
        "/api/navta-test/questions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subject: form.subject,
            exam: form.exam,
            classLevel: form.classLevel,
            chapter: form.chapter,
            difficulty: form.difficulty,
            question: form.question,
            options: [
              form.optionA,
              form.optionB,
              form.optionC,
              form.optionD,
            ],
            correctAnswer: Number(form.correctAnswer),
            explanation: form.explanation,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to add question");
      }

      setMessage("Question added successfully!");

      setForm({
        subject: "",
        exam: "",
        classLevel: "",
        chapter: "",
        difficulty: "",
        question: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "",
        explanation: "",
      });
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px",
        background: "#0b1220",
        color: "#fff",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          margin: "auto",
        }}
      >
        <h1>Navta TEST - Admin</h1>

        <p style={{ color: "#94a3b8" }}>
          Add and manage questions for student tests.
        </p>

        <form onSubmit={submitQuestion}>
          <select
            value={form.subject}
            onChange={(e) =>
              updateField("subject", e.target.value)
            }
            required
          >
            <option value="">Select Subject</option>

            {subjects.map((subject) => (
              <option key={subject} value={subject}>
                {subject}
              </option>
            ))}
          </select>

          <select
            value={form.exam}
            onChange={(e) =>
              updateField("exam", e.target.value)
            }
            required
          >
            <option value="">Select Exam</option>

            {exams.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
              </option>
            ))}
          </select>

          <select
            value={form.classLevel}
            onChange={(e) =>
              updateField("classLevel", e.target.value)
            }
            required
          >
            <option value="">Select Class</option>

            {classes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <input
            placeholder="Chapter"
            value={form.chapter}
            onChange={(e) =>
              updateField("chapter", e.target.value)
            }
            required
          />

          <select
            value={form.difficulty}
            onChange={(e) =>
              updateField("difficulty", e.target.value)
            }
            required
          >
            <option value="">Select Difficulty</option>

            {difficulties.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Enter question"
            value={form.question}
            onChange={(e) =>
              updateField("question", e.target.value)
            }
            required
          />

          <input
            placeholder="Option A"
            value={form.optionA}
            onChange={(e) =>
              updateField("optionA", e.target.value)
            }
            required
          />

          <input
            placeholder="Option B"
            value={form.optionB}
            onChange={(e) =>
              updateField("optionB", e.target.value)
            }
            required
          />

          <input
            placeholder="Option C"
            value={form.optionC}
            onChange={(e) =>
              updateField("optionC", e.target.value)
            }
            required
          />

          <input
            placeholder="Option D"
            value={form.optionD}
            onChange={(e) =>
              updateField("optionD", e.target.value)
            }
            required
          />

          <select
            value={form.correctAnswer}
            onChange={(e) =>
              updateField(
                "correctAnswer",
                e.target.value
              )
            }
            required
          >
            <option value="">
              Select Correct Answer
            </option>

            <option value="0">Option A</option>
            <option value="1">Option B</option>
            <option value="2">Option C</option>
            <option value="3">Option D</option>
          </select>

          <textarea
            placeholder="Explanation (optional)"
            value={form.explanation}
            onChange={(e) =>
              updateField(
                "explanation",
                e.target.value
              )
            }
          />

          <button type="submit">
            Add Question
          </button>
        </form>

        {message && (
          <p style={{ marginTop: "20px" }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
