import React, {
  useEffect,
  useState
} from "react";

export default function QuestionPaperBuilder() {
  const [questions, setQuestions] =
    useState([]);

  const [selectedQuestions, setSelectedQuestions] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "/api/teacher/question-bank"
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load questions."
        );
      }

      setQuestions(
        data.questions || []
      );
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (question) => {
    setSelectedQuestions(
      (previous) => {
        const exists =
          previous.some(
            (item) =>
              item._id ===
              question._id
          );

        if (exists) {
          return previous.filter(
            (item) =>
              item._id !==
              question._id
          );
        }

        return [
          ...previous,
          question
        ];
      }
    );
  };

  if (loading) {
    return (
      <div>
        Loading question bank...
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px"
      }}
    >
      <h1>
        Question Paper Builder
      </h1>

      <p>
        Select questions from the NAVTA
        Admin Question Bank.
      </p>

      {error && (
        <p
          style={{
            color: "red"
          }}
        >
          {error}
        </p>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "2fr 1fr",
          gap: "20px",
          marginTop: "20px"
        }}
      >
        <div>
          <h2>
            Question Bank
          </h2>

          {questions.map(
            (question) => {
              const selected =
                selectedQuestions.some(
                  (item) =>
                    item._id ===
                    question._id
                );

              return (
                <div
                  key={question._id}
                  style={{
                    padding: "16px",
                    marginBottom:
                      "12px",
                    border:
                      selected
                        ? "2px solid #0ea5e9"
                        : "1px solid #ccc",
                    borderRadius:
                      "12px"
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      gap: "12px"
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={
                        selected
                      }
                      onChange={() =>
                        toggleQuestion(
                          question
                        )
                      }
                    />

                    <div>
                      <strong>
                        {
                          question.question
                        }
                      </strong>

                      <p>
                        {
                          question.subject
                        }{" "}
                        •{" "}
                        {
                          question.exam
                        }{" "}
                        •{" "}
                        {
                          question.classLevel
                        }
                      </p>

                      <p>
                        {
                          question.chapter
                        }{" "}
                        •{" "}
                        {
                          question.difficulty
                        }{" "}
                        •{" "}
                        {
                          question.questionType
                        }
                      </p>
                    </div>
                  </label>
                </div>
              );
            }
          )}
        </div>

        <div>
          <h2>
            Selected Questions
          </h2>

          <p>
            Total:{" "}
            {
              selectedQuestions.length
            }
          </p>

          {selectedQuestions.map(
            (
              question,
              index
            ) => (
              <div
                key={question._id}
                style={{
                  padding: "12px",
                  marginBottom:
                    "10px",
                  border:
                    "1px solid #ccc",
                  borderRadius:
                    "10px"
                }}
              >
                <strong>
                  {index + 1}.
                </strong>{" "}
                {
                  question.question
                }
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
