import React, {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Link
} from 'react-router-dom';

import {
  ArrowLeft,
  BookOpen,
  BrainCircuit,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Edit3,
  Filter,
  Lightbulb,
  Loader2,
  RefreshCcw,
  Save,
  Search,
  Sparkles,
  Target,
  Trash2,
  X,
  XCircle
} from 'lucide-react';

// =====================================================
// CONSTANTS
// =====================================================

const SUBJECTS = [
  'All',
  'Physics',
  'Chemistry',
  'Maths',
  'Mathematics',
  'Biology'
];

const STATUS_FILTERS = [
  {
    value: 'all',
    label: 'All Mistakes'
  },
  {
    value: 'revision',
    label: 'Need Revision'
  },
  {
    value: 'mastered',
    label: 'Mastered'
  }
];

// =====================================================
// AUTH HELPERS
// =====================================================

function getAuthToken() {
  return (
    localStorage.getItem('token') ||
    localStorage.getItem('authToken') ||
    localStorage.getItem('accessToken') ||
    ''
  );
}

function getAuthHeaders(
  extraHeaders = {}
) {
  const token = getAuthToken();

  return {
    ...extraHeaders,
    ...(token
      ? {
          Authorization:
            `Bearer ${token}`
        }
      : {})
  };
}

// =====================================================
// API HELPER
// =====================================================

async function apiRequest(
  url,
  options = {}
) {
  const response = await fetch(
    url,
    {
      credentials: 'include',

      ...options,

      headers: getAuthHeaders({
        ...(options.body
          ? {
              'Content-Type':
                'application/json'
            }
          : {}),

        ...(options.headers || {})
      })
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        `Request failed (${response.status})`
    );
  }

  return data;
}

// =====================================================
// HELPERS
// =====================================================

function getQuestionText(mistake) {
  return (
    mistake?.question?.questionText ||
    mistake?.question?.question ||
    'Question text is unavailable.'
  );
}

function getOptions(mistake) {
  return Array.isArray(
    mistake?.question?.options
  )
    ? mistake.question.options
    : [];
}

function getOptionText(
  options,
  answerIndex
) {
  if (
    answerIndex === null ||
    answerIndex === undefined
  ) {
    return 'Not answered';
  }

  const index = Number(answerIndex);

  if (
    Number.isNaN(index) ||
    index < 0 ||
    index >= options.length
  ) {
    return `Option ${
      Number(index) + 1
    }`;
  }

  return options[index];
}

function getAnswerLetter(
  answerIndex
) {
  if (
    answerIndex === null ||
    answerIndex === undefined
  ) {
    return '—';
  }

  const index = Number(answerIndex);

  if (
    Number.isNaN(index) ||
    index < 0
  ) {
    return '—';
  }

  return String.fromCharCode(
    65 + index
  );
}

function formatDate(date) {
  if (!date) {
    return 'Not reviewed yet';
  }

  try {
    return new Date(
      date
    ).toLocaleDateString(
      undefined,
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      }
    );
  } catch {
    return 'Unknown date';
  }
}

function normalizeSubject(
  subject
) {
  if (
    subject === 'Mathematics'
  ) {
    return 'Maths';
  }

  return subject || 'Unknown';
}

function sourceLabel(source) {
  if (source === 'boss') {
    return '⚔ Boss Battle';
  }

  if (source === 'revenge') {
    return '🔥 Revenge Battle';
  }

  return 'NAVTA Test';
}

function difficultyClass(
  difficulty
) {
  if (difficulty === 'Hard') {
    return `
      border-rose-200
      bg-rose-50
      text-rose-700

      dark:border-rose-500/20
      dark:bg-rose-500/10
      dark:text-rose-300
    `;
  }

  if (difficulty === 'Medium') {
    return `
      border-amber-200
      bg-amber-50
      text-amber-700

      dark:border-amber-500/20
      dark:bg-amber-500/10
      dark:text-amber-300
    `;
  }

  return `
    border-emerald-200
    bg-emerald-50
    text-emerald-700

    dark:border-emerald-500/20
    dark:bg-emerald-500/10
    dark:text-emerald-300
  `;
}

// =====================================================
// MAIN COMPONENT
// =====================================================

export default function MistakeNotebookPage() {
  const [mistakes, setMistakes] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  const [search, setSearch] =
    useState('');

  const [subject, setSubject] =
    useState('All');

  const [status, setStatus] =
    useState('all');

  const [
    difficulty,
    setDifficulty
  ] = useState('All');

  const [
    editingId,
    setEditingId
  ] = useState(null);

  const [
    editingNote,
    setEditingNote
  ] = useState('');

  const [
    savingNoteId,
    setSavingNoteId
  ] = useState(null);

  const [
    updatingMasteredId,
    setUpdatingMasteredId
  ] = useState(null);

  const [
    deletingId,
    setDeletingId
  ] = useState(null);

  const [
    expandedId,
    setExpandedId
  ] = useState(null);

  // ===================================================
  // LOAD NOTEBOOK
  // ===================================================

  const loadMistakes =
    useCallback(
      async (
        showLoader = true
      ) => {
        if (showLoader) {
          setLoading(true);
        }

        setError('');

        try {
          const data =
            await apiRequest(
              '/api/mistake-notebook'
            );

          setMistakes(
            Array.isArray(
              data?.mistakes
            )
              ? data.mistakes
              : []
          );
        } catch (requestError) {
          console.error(
            'Mistake Notebook Error:',
            requestError
          );

          setError(
            requestError?.message ||
              'Unable to load your Mistake Notebook.'
          );
        } finally {
          if (showLoader) {
            setLoading(false);
          }
        }
      },
      []
    );

  useEffect(() => {
    loadMistakes();
  }, [loadMistakes]);

  // ===================================================
  // STATS
  // ===================================================

  const stats =
    useMemo(() => {
      const total =
        mistakes.length;

      const mastered =
        mistakes.filter(
          (mistake) =>
            mistake?.isMastered
        ).length;

      const needRevision =
        total - mastered;

      const masteryPercentage =
        total > 0
          ? Math.round(
              (
                mastered /
                total
              ) * 100
            )
          : 0;

      return {
        total,
        mastered,
        needRevision,
        masteryPercentage
      };
    }, [mistakes]);

  // ===================================================
  // SUBJECT OPTIONS
  // ===================================================

  const availableSubjects =
    useMemo(() => {
      const subjects =
        new Set(
          mistakes
            .map(
              (mistake) =>
                normalizeSubject(
                  mistake?.subject
                )
            )
            .filter(Boolean)
        );

      return [
        'All',
        ...Array.from(
          subjects
        ).sort()
      ];
    }, [mistakes]);

  // ===================================================
  // FILTERED MISTAKES
  // ===================================================

  const filteredMistakes =
    useMemo(() => {
      const searchText =
        search
          .trim()
          .toLowerCase();

      return mistakes.filter(
        (mistake) => {
          const questionText =
            getQuestionText(
              mistake
            ).toLowerCase();

          const chapter =
            String(
              mistake?.chapter ||
                ''
            ).toLowerCase();

          const itemSubject =
            normalizeSubject(
              mistake?.subject
            );

          const matchesSearch =
            !searchText ||
            questionText.includes(
              searchText
            ) ||
            chapter.includes(
              searchText
            ) ||
            itemSubject
              .toLowerCase()
              .includes(
                searchText
              );

          const matchesSubject =
            subject === 'All' ||
            itemSubject ===
              subject;

          const matchesDifficulty =
            difficulty === 'All' ||
            mistake?.difficulty ===
              difficulty;

          let matchesStatus = true;

          if (
            status ===
            'revision'
          ) {
            matchesStatus =
              !mistake?.isMastered;
          }

          if (
            status ===
            'mastered'
          ) {
            matchesStatus =
              Boolean(
                mistake?.isMastered
              );
          }

          return (
            matchesSearch &&
            matchesSubject &&
            matchesDifficulty &&
            matchesStatus
          );
        }
      );
    }, [
      mistakes,
      search,
      subject,
      difficulty,
      status
    ]);

  // ===================================================
  // EDIT NOTE
  // ===================================================

  const startEditingNote = (
    mistake
  ) => {
    setEditingId(
      mistake._id
    );

    setEditingNote(
      mistake?.note || ''
    );
  };

  const cancelEditingNote =
    () => {
      setEditingId(null);
      setEditingNote('');
    };

  const saveNote =
    async (mistakeId) => {
      if (
        editingNote.length >
        2000
      ) {
        setError(
          'Your note cannot exceed 2000 characters.'
        );

        return;
      }

      setSavingNoteId(
        mistakeId
      );

      setError('');

      try {
        const data =
          await apiRequest(
            `/api/mistake-notebook/${mistakeId}/note`,
            {
              method: 'PUT',
              body: JSON.stringify({
                note: editingNote
              })
            }
          );

        setMistakes(
          (current) =>
            current.map(
              (mistake) =>
                mistake._id ===
                mistakeId
                  ? {
                      ...mistake,
                      ...(data?.mistake ||
                        {}),
                      note:
                        data?.mistake
                          ?.note ??
                        editingNote.trim()
                    }
                  : mistake
            )
        );

        setEditingId(null);
        setEditingNote('');
      } catch (requestError) {
        console.error(
          'Update note error:',
          requestError
        );

        setError(
          requestError?.message ||
            'Unable to update your note.'
        );
      } finally {
        setSavingNoteId(null);
      }
    };

  // ===================================================
  // MASTERED
  // ===================================================

  const toggleMastered =
    async (mistake) => {
      const newStatus =
        !mistake?.isMastered;

      setUpdatingMasteredId(
        mistake._id
      );

      setError('');

      try {
        const data =
          await apiRequest(
            `/api/mistake-notebook/${mistake._id}/mastered`,
            {
              method: 'PUT',
              body: JSON.stringify({
                isMastered:
                  newStatus
              })
            }
          );

        setMistakes(
          (current) =>
            current.map(
              (item) =>
                item._id ===
                mistake._id
                  ? {
                      ...item,
                      ...(data?.mistake ||
                        {}),
                      isMastered:
                        data?.mistake
                          ?.isMastered ??
                        newStatus
                    }
                  : item
            )
        );
      } catch (requestError) {
        console.error(
          'Mastered update error:',
          requestError
        );

        setError(
          requestError?.message ||
            'Unable to update this mistake.'
        );
      } finally {
        setUpdatingMasteredId(
          null
        );
      }
    };

  // ===================================================
  // DELETE
  // ===================================================

  const deleteMistake =
    async (mistake) => {
      const confirmed =
        window.confirm(
          'Remove this question from your Mistake Notebook?'
        );

      if (!confirmed) {
        return;
      }

      setDeletingId(
        mistake._id
      );

      setError('');

      try {
        await apiRequest(
          `/api/mistake-notebook/${mistake._id}`,
          {
            method: 'DELETE'
          }
        );

        setMistakes(
          (current) =>
            current.filter(
              (item) =>
                item._id !==
                mistake._id
            )
        );

        if (
          editingId ===
          mistake._id
        ) {
          cancelEditingNote();
        }
      } catch (requestError) {
        console.error(
          'Delete mistake error:',
          requestError
        );

        setError(
          requestError?.message ||
            'Unable to remove this mistake.'
        );
      } finally {
        setDeletingId(null);
      }
    };

  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const clearFilters = () => {
    setSearch('');
    setSubject('All');
    setStatus('all');
    setDifficulty('All');
  };

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div
        className="
          flex
          min-h-[75vh]
          items-center
          justify-center
        "
      >
        <div
          className="
            flex
            flex-col
            items-center
            gap-4
          "
        >
          <Loader2
            className="
              h-10
              w-10
              animate-spin
              text-rose-500
            "
          />

          <p
            className="
              text-sm
              font-semibold
              text-slate-500

              dark:text-slate-400
            "
          >
            Opening your Mistake
            Notebook...
          </p>
        </div>
      </div>
    );
  }

  // ===================================================
  // PAGE
  // ===================================================

  return (
    <div
      className="
        relative
        w-full
        min-w-0
        overflow-x-hidden
        text-slate-900

        dark:text-white
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-[1380px]
          space-y-5
        "
      >

        {/* =============================================
            BACK
        ============================================= */}

        <div>
          <Link
            to="/dashboard"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-bold
              text-slate-500
              transition
              hover:text-sky-600

              dark:text-slate-400
              dark:hover:text-sky-400
            "
          >
            <ArrowLeft
              className="
                h-4
                w-4
              "
            />

            Back to Dashboard
          </Link>
        </div>

        {/* =============================================
            HERO
        ============================================= */}

        <section
          className="
            relative
            overflow-hidden
            rounded-[28px]
            border
            border-rose-200/70
            bg-gradient-to-br
            from-rose-50
            via-white
            to-orange-50
            p-6
            shadow-[0_20px_70px_rgba(15,23,42,0.10)]
            sm:p-8

            dark:border-rose-500/20
            dark:from-[#160b17]
            dark:via-[#071224]
            dark:to-[#1b1008]
            dark:shadow-[0_24px_90px_rgba(244,63,94,0.10)]
          "
        >
          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-72
              w-72
              rounded-full
              bg-rose-300/20
              blur-[100px]

              dark:bg-rose-500/15
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-24
              left-[25%]
              h-64
              w-64
              rounded-full
              bg-orange-300/15
              blur-[100px]

              dark:bg-orange-500/10
            "
          />

          <div
            className="
              relative
              flex
              flex-col
              gap-6
              xl:flex-row
              xl:items-center
              xl:justify-between
            "
          >
            <div
              className="
                max-w-3xl
              "
            >
              <div
                className="
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-rose-200
                  bg-white/70
                  px-3
                  py-1.5
                  text-xs
                  font-black
                  text-rose-600
                  backdrop-blur

                  dark:border-rose-500/20
                  dark:bg-rose-500/10
                  dark:text-rose-300
                "
              >
                <Sparkles
                  className="
                    h-4
                    w-4
                  "
                />

                Smart Revision
              </div>

              <div
                className="
                  mt-5
                  flex
                  items-start
                  gap-4
                "
              >
                <div
                  className="
                    flex
                    h-14
                    w-14
                    shrink-0
                    items-center
                    justify-center
                    rounded-2xl
                    bg-rose-100
                    shadow-sm

                    dark:bg-rose-500/10
                  "
                >
                  <BookOpen
                    className="
                      h-7
                      w-7
                      text-rose-600

                      dark:text-rose-400
                    "
                  />
                </div>

                <div>
                  <h1
                    className="
                      text-3xl
                      font-black
                      tracking-tight
                      text-slate-950
                      sm:text-4xl
                      xl:text-5xl

                      dark:text-white
                    "
                  >
                    My Mistake Notebook
                  </h1>

                  <p
                    className="
                      mt-3
                      max-w-2xl
                      text-sm
                      leading-6
                      text-slate-600
                      sm:text-base

                      dark:text-slate-400
                    "
                  >
                    Review the questions
                    that challenged you,
                    understand why you
                    missed them, and turn
                    every mistake into
                    progress.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                loadMistakes(false)
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-slate-300
                bg-white/80
                px-4
                py-3
                text-sm
                font-bold
                text-slate-700
                shadow-sm
                transition
                hover:border-rose-300
                hover:text-rose-600

                dark:border-slate-700
                dark:bg-slate-950/60
                dark:text-slate-300
                dark:hover:border-rose-500/40
                dark:hover:text-rose-300
              "
            >
              <RefreshCcw
                className="
                  h-4
                  w-4
                "
              />

              Refresh
            </button>
          </div>
        </section>

        {/* =============================================
            STATS
        ============================================= */}

        <section
          className="
            grid
            grid-cols-2
            gap-3
            xl:grid-cols-4
          "
        >
          <StatCard
            icon={BookOpen}
            value={stats.total}
            label="Saved Mistakes"
            iconClass="text-rose-500"
            iconBg="
              bg-rose-100
              dark:bg-rose-500/10
            "
          />

          <StatCard
            icon={RefreshCcw}
            value={
              stats.needRevision
            }
            label="Need Revision"
            iconClass="text-amber-500"
            iconBg="
              bg-amber-100
              dark:bg-amber-500/10
            "
          />

          <StatCard
            icon={CheckCircle2}
            value={
              stats.mastered
            }
            label="Mastered"
            iconClass="text-emerald-500"
            iconBg="
              bg-emerald-100
              dark:bg-emerald-500/10
            "
          />

          <StatCard
            icon={Target}
            value={
              `${stats.masteryPercentage}%`
            }
            label="Mastery"
            iconClass="text-sky-500"
            iconBg="
              bg-sky-100
              dark:bg-sky-500/10
            "
          />
        </section>

        {/* =============================================
            MASTERY PROGRESS
        ============================================= */}

        {stats.total > 0 && (
          <section
            className="
              rounded-[24px]
              border
              border-slate-200/80
              bg-white/88
              p-5
              shadow-[0_18px_55px_rgba(15,23,42,0.08)]
              backdrop-blur-xl
              sm:p-6

              dark:border-slate-800
              dark:bg-[#081326]/92
              dark:shadow-xl
            "
          >
            <div
              className="
                flex
                flex-col
                gap-4
                sm:flex-row
                sm:items-center
                sm:justify-between
              "
            >
              <div>
                <p
                  className="
                    text-sm
                    font-black
                    text-slate-950

                    dark:text-white
                  "
                >
                  Notebook Mastery
                </p>

                <p
                  className="
                    mt-1
                    text-xs
                    text-slate-500

                    dark:text-slate-400
                  "
                >
                  Mark questions as
                  mastered when you are
                  confident with the
                  concept.
                </p>
              </div>

              <p
                className="
                  text-2xl
                  font-black
                  text-emerald-600

                  dark:text-emerald-400
                "
              >
                {
                  stats.masteryPercentage
                }
                %
              </p>
            </div>

            <div
              className="
                mt-4
                h-2
                overflow-hidden
                rounded-full
                bg-slate-200

                dark:bg-slate-800
              "
            >
              <div
                className="
                  h-full
                  rounded-full
                  bg-gradient-to-r
                  from-rose-500
                  via-amber-500
                  to-emerald-500
                  transition-all
                  duration-500
                "
                style={{
                  width:
                    `${stats.masteryPercentage}%`
                }}
              />
            </div>
          </section>
        )}

        {/* =============================================
            ERROR
        ============================================= */}

        {error && (
          <div
            className="
              flex
              items-start
              gap-3
              rounded-2xl
              border
              border-rose-200
              bg-rose-50
              p-4
              text-sm
              text-rose-700

              dark:border-rose-500/20
              dark:bg-rose-500/10
              dark:text-rose-300
            "
          >
            <XCircle
              className="
                mt-0.5
                h-5
                w-5
                shrink-0
              "
            />

            <div
              className="
                flex-1
              "
            >
              <p
                className="
                  font-bold
                "
              >
                Something went wrong
              </p>

              <p
                className="
                  mt-1
                  text-xs
                "
              >
                {error}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setError('')
              }
            >
              <X
                className="
                  h-4
                  w-4
                "
              />
            </button>
          </div>
        )}

        {/* =============================================
            FILTERS
        ============================================= */}

        <section
          className="
            rounded-[24px]
            border
            border-slate-200/80
            bg-white/88
            p-5
            shadow-[0_18px_55px_rgba(15,23,42,0.08)]
            backdrop-blur-xl
            sm:p-6

            dark:border-slate-800
            dark:bg-[#081326]/92
            dark:shadow-xl
          "
        >
          <div
            className="
              flex
              items-center
              gap-2
            "
          >
            <Filter
              className="
                h-5
                w-5
                text-sky-500
              "
            />

            <h2
              className="
                text-base
                font-black
                text-slate-950

                dark:text-white
              "
            >
              Find a Mistake
            </h2>
          </div>

          <div
            className="
              mt-4
              grid
              grid-cols-1
              gap-3
              md:grid-cols-2
              xl:grid-cols-4
            "
          >

            {/* SEARCH */}

            <div
              className="
                relative
              "
            >
              <Search
                className="
                  absolute
                  left-3
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-slate-400
                "
              />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search question or chapter..."
                className="
                  w-full
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50/80
                  py-3
                  pl-10
                  pr-4
                  text-sm
                  text-slate-900
                  outline-none
                  transition
                  placeholder:text-slate-400
                  focus:border-sky-400
                  focus:ring-2
                  focus:ring-sky-100

                  dark:border-slate-800
                  dark:bg-slate-950/40
                  dark:text-white
                  dark:focus:border-sky-500
                  dark:focus:ring-sky-500/10
                "
              />
            </div>

            {/* SUBJECT */}

            <SelectFilter
              value={subject}
              onChange={
                setSubject
              }
              options={
                availableSubjects
              }
            />

            {/* DIFFICULTY */}

            <SelectFilter
              value={difficulty}
              onChange={
                setDifficulty
              }
              options={[
                'All',
                'Easy',
                'Medium',
                'Hard'
              ]}
            />

            {/* STATUS */}

            <div
              className="
                relative
              "
            >
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="
                  w-full
                  appearance-none
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50/80
                  px-4
                  py-3
                  pr-10
                  text-sm
                  font-semibold
                  text-slate-700
                  outline-none
                  transition
                  focus:border-sky-400
                  focus:ring-2
                  focus:ring-sky-100

                  dark:border-slate-800
                  dark:bg-slate-950/40
                  dark:text-slate-300
                  dark:focus:border-sky-500
                  dark:focus:ring-sky-500/10
                "
              >
                {STATUS_FILTERS.map(
                  (item) => (
                    <option
                      key={
                        item.value
                      }
                      value={
                        item.value
                      }
                    >
                      {item.label}
                    </option>
                  )
                )}
              </select>

              <ChevronDown
                className="
                  pointer-events-none
                  absolute
                  right-3
                  top-1/2
                  h-4
                  w-4
                  -translate-y-1/2
                  text-slate-400
                "
              />
            </div>
          </div>

          <div
            className="
              mt-4
              flex
              flex-wrap
              items-center
              justify-between
              gap-3
            "
          >
            <p
              className="
                text-xs
                font-semibold
                text-slate-500

                dark:text-slate-400
              "
            >
              Showing{' '}
              <span
                className="
                  font-black
                  text-slate-900

                  dark:text-white
                "
              >
                {
                  filteredMistakes.length
                }
              </span>{' '}
              of{' '}
              {
                mistakes.length
              }{' '}
              mistakes
            </p>

            {(search ||
              subject !== 'All' ||
              status !== 'all' ||
              difficulty !==
                'All') && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="
                  text-xs
                  font-bold
                  text-sky-600
                  hover:underline

                  dark:text-sky-400
                "
              >
                Clear filters
              </button>
            )}
          </div>
        </section>

        {/* =============================================
            EMPTY NOTEBOOK
        ============================================= */}

        {mistakes.length ===
          0 && (
          <EmptyNotebook />
        )}

        {/* =============================================
            NO FILTER RESULTS
        ============================================= */}

        {mistakes.length > 0 &&
          filteredMistakes.length ===
            0 && (
            <section
              className="
                rounded-[24px]
                border
                border-slate-200/80
                bg-white/88
                px-6
                py-14
                text-center
                shadow-[0_18px_55px_rgba(15,23,42,0.08)]

                dark:border-slate-800
                dark:bg-[#081326]/92
              "
            >
              <Search
                className="
                  mx-auto
                  h-10
                  w-10
                  text-slate-300

                  dark:text-slate-700
                "
              />

              <h3
                className="
                  mt-4
                  text-lg
                  font-black
                  text-slate-900

                  dark:text-white
                "
              >
                No matching mistakes
              </h3>

              <p
                className="
                  mx-auto
                  mt-2
                  max-w-md
                  text-sm
                  leading-6
                  text-slate-500

                  dark:text-slate-400
                "
              >
                Try changing your
                subject, difficulty,
                status or search.
              </p>

              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="
                  mt-5
                  rounded-xl
                  bg-sky-500
                  px-5
                  py-2.5
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-sky-600
                "
              >
                Clear Filters
              </button>
            </section>
          )}

        {/* =============================================
            NOTEBOOK CARDS
        ============================================= */}

        {filteredMistakes.length >
          0 && (
          <section
            className="
              space-y-4
            "
          >
            {filteredMistakes.map(
              (mistake, index) => (
                <MistakeCard
                  key={
                    mistake._id
                  }
                  mistake={
                    mistake
                  }
                  number={
                    index + 1
                  }
                  expanded={
                    expandedId ===
                    mistake._id
                  }
                  onToggleExpanded={() =>
                    setExpandedId(
                      expandedId ===
                        mistake._id
                        ? null
                        : mistake._id
                    )
                  }
                  editing={
                    editingId ===
                    mistake._id
                  }
                  editingNote={
                    editingNote
                  }
                  setEditingNote={
                    setEditingNote
                  }
                  onStartEdit={() =>
                    startEditingNote(
                      mistake
                    )
                  }
                  onCancelEdit={
                    cancelEditingNote
                  }
                  onSaveNote={() =>
                    saveNote(
                      mistake._id
                    )
                  }
                  savingNote={
                    savingNoteId ===
                    mistake._id
                  }
                  onToggleMastered={() =>
                    toggleMastered(
                      mistake
                    )
                  }
                  updatingMastered={
                    updatingMasteredId ===
                    mistake._id
                  }
                  onDelete={() =>
                    deleteMistake(
                      mistake
                    )
                  }
                  deleting={
                    deletingId ===
                    mistake._id
                  }
                />
              )
            )}
          </section>
        )}
      </div>
    </div>
  );
}

// =====================================================
// MISTAKE CARD
// =====================================================

function MistakeCard({
  mistake,
  number,
  expanded,
  onToggleExpanded,
  editing,
  editingNote,
  setEditingNote,
  onStartEdit,
  onCancelEdit,
  onSaveNote,
  savingNote,
  onToggleMastered,
  updatingMastered,
  onDelete,
  deleting
}) {
  const options =
    getOptions(mistake);

  const selectedAnswer =
    mistake?.selectedAnswer;

  const correctAnswer =
    mistake?.correctAnswer;

  const explanation =
    mistake?.question
      ?.explanation ||
    'Explanation is not available for this question yet.';

  const questionType =
    mistake?.question
      ?.questionType ||
    'mcq';

  return (
    <article
      className={`
        overflow-hidden
        rounded-[24px]
        border
        bg-white/90
        shadow-[0_18px_55px_rgba(15,23,42,0.08)]
        backdrop-blur-xl
        transition

        dark:bg-[#081326]/92
        dark:shadow-xl

        ${
          mistake?.isMastered
            ? `
              border-emerald-200
              dark:border-emerald-500/20
            `
            : `
              border-slate-200/80
              dark:border-slate-800
            `
        }
      `}
    >
      {/* HEADER */}

      <div
        className="
          border-b
          border-slate-100
          p-5
          sm:p-6

          dark:border-slate-800
        "
      >
        <div
          className="
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-start
            lg:justify-between
          "
        >
          <div
            className="
              flex
              min-w-0
              items-start
              gap-3
            "
          >
            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-rose-100
                text-sm
                font-black
                text-rose-600

                dark:bg-rose-500/10
                dark:text-rose-300
              "
            >
              {number}
            </div>

            <div
              className="
                min-w-0
              "
            >
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <Badge>
                  {normalizeSubject(
                    mistake?.subject
                  )}
                </Badge>

                <Badge>
                  {mistake?.chapter ||
                    'Chapter'}
                </Badge>

                <span
                  className={`
                    rounded-full
                    border
                    px-2.5
                    py-1
                    text-[9px]
                    font-black
                    uppercase
                    tracking-wider

                    ${difficultyClass(
                      mistake?.difficulty
                    )}
                  `}
                >
                  {mistake?.difficulty ||
                    'Easy'}
                </span>

                <Badge>
                  {sourceLabel(
                    mistake?.source
                  )}
                </Badge>
              </div>

              <p
                className="
                  mt-2
                  text-[10px]
                  font-semibold
                  text-slate-400

                  dark:text-slate-500
                "
              >
                {mistake?.exam ||
                  'Practice'}

                {mistake?.classLevel
                  ? ` • Class ${mistake.classLevel}`
                  : ''}

                {' • '}

                Saved{' '}
                {formatDate(
                  mistake?.createdAt
                )}
              </p>
            </div>
          </div>

          <div
            className="
              flex
              flex-wrap
              gap-2
            "
          >
            {mistake?.isMastered && (
              <span
                className="
                  inline-flex
                  items-center
                  gap-1.5
                  rounded-full
                  bg-emerald-100
                  px-3
                  py-1.5
                  text-[10px]
                  font-black
                  text-emerald-700

                  dark:bg-emerald-500/10
                  dark:text-emerald-300
                "
              >
                <Check
                  className="
                    h-3.5
                    w-3.5
                  "
                />

                Mastered
              </span>
            )}

            <button
              type="button"
              onClick={
                onToggleExpanded
              }
              className="
                rounded-xl
                border
                border-slate-200
                bg-slate-50
                px-3
                py-2
                text-xs
                font-bold
                text-slate-600
                transition
                hover:border-sky-300
                hover:text-sky-600

                dark:border-slate-800
                dark:bg-slate-950/40
                dark:text-slate-300
                dark:hover:border-sky-500/30
                dark:hover:text-sky-300
              "
            >
              {expanded
                ? 'Hide Details'
                : 'Review'}
            </button>
          </div>
        </div>

        {/* QUESTION */}

        <div
          className="
            mt-5
          "
        >
          <p
            className="
              text-[10px]
              font-black
              uppercase
              tracking-[0.14em]
              text-slate-400

              dark:text-slate-500
            "
          >
            Question
          </p>

          <p
            className="
              mt-2
              text-sm
              font-bold
              leading-7
              text-slate-900
              sm:text-base

              dark:text-white
            "
          >
            {getQuestionText(
              mistake
            )}
          </p>
        </div>
      </div>

      {/* EXPANDED REVIEW */}

      {expanded && (
        <div
          className="
            space-y-5
            p-5
            sm:p-6
          "
        >

          {/* ANSWERS */}

          {questionType ===
            'mcq' && (
            <div
              className="
                grid
                grid-cols-1
                gap-3
                lg:grid-cols-2
              "
            >
              <AnswerBox
                wrong
                icon={XCircle}
                title="Your Answer"
                letter={
                  getAnswerLetter(
                    selectedAnswer
                  )
                }
                answer={
                  getOptionText(
                    options,
                    selectedAnswer
                  )
                }
              />

              <AnswerBox
                correct
                icon={CheckCircle2}
                title="Correct Answer"
                letter={
                  getAnswerLetter(
                    correctAnswer
                  )
                }
                answer={
                  getOptionText(
                    options,
                    correctAnswer
                  )
                }
              />
            </div>
          )}

          {/* EXPLANATION */}

          <div
            className="
              rounded-2xl
              border
              border-sky-200
              bg-sky-50/70
              p-4

              dark:border-sky-500/20
              dark:bg-sky-500/[0.06]
            "
          >
            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <Lightbulb
                className="
                  h-4
                  w-4
                  text-sky-600

                  dark:text-sky-400
                "
              />

              <p
                className="
                  text-xs
                  font-black
                  text-sky-700

                  dark:text-sky-300
                "
              >
                Explanation
              </p>
            </div>

            <p
              className="
                mt-3
                text-sm
                leading-6
                text-slate-700

                dark:text-slate-300
              "
            >
              {explanation}
            </p>
          </div>

          {/* PERSONAL NOTE */}

          <div
            className="
              rounded-2xl
              border
              border-violet-200
              bg-violet-50/60
              p-4

              dark:border-violet-500/20
              dark:bg-violet-500/[0.05]
            "
          >
            <div
              className="
                flex
                flex-wrap
                items-center
                justify-between
                gap-3
              "
            >
              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >
                <BrainCircuit
                  className="
                    h-4
                    w-4
                    text-violet-600

                    dark:text-violet-400
                  "
                />

                <p
                  className="
                    text-xs
                    font-black
                    text-violet-700

                    dark:text-violet-300
                  "
                >
                  My Note
                </p>
              </div>

              {!editing && (
                <button
                  type="button"
                  onClick={
                    onStartEdit
                  }
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    text-xs
                    font-bold
                    text-violet-600
                    hover:underline

                    dark:text-violet-300
                  "
                >
                  <Edit3
                    className="
                      h-3.5
                      w-3.5
                    "
                  />

                  {mistake?.note
                    ? 'Edit Note'
                    : 'Add Note'}
                </button>
              )}
            </div>

            {editing ? (
              <div
                className="
                  mt-3
                "
              >
                <textarea
                  value={
                    editingNote
                  }
                  onChange={(
                    event
                  ) =>
                    setEditingNote(
                      event.target
                        .value
                    )
                  }
                  maxLength={2000}
                  rows={4}
                  placeholder="Why did I get this wrong? Write the concept, formula or idea you want to remember..."
                  className="
                    w-full
                    resize-y
                    rounded-xl
                    border
                    border-violet-200
                    bg-white
                    p-3
                    text-sm
                    leading-6
                    text-slate-900
                    outline-none
                    transition
                    placeholder:text-slate-400
                    focus:border-violet-400
                    focus:ring-2
                    focus:ring-violet-100

                    dark:border-violet-500/20
                    dark:bg-slate-950/50
                    dark:text-white
                    dark:focus:border-violet-500
                    dark:focus:ring-violet-500/10
                  "
                />

                <div
                  className="
                    mt-2
                    flex
                    flex-col
                    gap-2
                    sm:flex-row
                    sm:items-center
                    sm:justify-between
                  "
                >
                  <p
                    className="
                      text-[9px]
                      text-slate-400
                    "
                  >
                    {
                      editingNote.length
                    }{' '}
                    / 2000
                  </p>

                  <div
                    className="
                      flex
                      gap-2
                    "
                  >
                    <button
                      type="button"
                      onClick={
                        onCancelEdit
                      }
                      disabled={
                        savingNote
                      }
                      className="
                        rounded-lg
                        border
                        border-slate-200
                        px-3
                        py-2
                        text-xs
                        font-bold
                        text-slate-600
                        transition
                        hover:bg-slate-50
                        disabled:opacity-50

                        dark:border-slate-700
                        dark:text-slate-300
                        dark:hover:bg-slate-800
                      "
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={
                        onSaveNote
                      }
                      disabled={
                        savingNote
                      }
                      className="
                        inline-flex
                        items-center
                        gap-1.5
                        rounded-lg
                        bg-violet-600
                        px-3
                        py-2
                        text-xs
                        font-bold
                        text-white
                        transition
                        hover:bg-violet-700
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >
                      {savingNote ? (
                        <Loader2
                          className="
                            h-3.5
                            w-3.5
                            animate-spin
                          "
                        />
                      ) : (
                        <Save
                          className="
                            h-3.5
                            w-3.5
                          "
                        />
                      )}

                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p
                className="
                  mt-3
                  whitespace-pre-wrap
                  text-sm
                  leading-6
                  text-slate-700

                  dark:text-slate-300
                "
              >
                {mistake?.note ||
                  'No personal note yet. Add what confused you so it is easier to remember next time.'}
              </p>
            )}
          </div>

          {/* REVIEW INFO */}

          <div
            className="
              flex
              flex-wrap
              items-center
              gap-x-5
              gap-y-2
              text-[10px]
              font-semibold
              text-slate-400

              dark:text-slate-500
            "
          >
            <span
              className="
                inline-flex
                items-center
                gap-1.5
              "
            >
              <RefreshCcw
                className="
                  h-3.5
                  w-3.5
                "
              />

              Reviewed{' '}
              {
                mistake?.reviewCount ||
                0
              }{' '}
              times
            </span>

            <span
              className="
                inline-flex
                items-center
                gap-1.5
              "
            >
              <Clock3
                className="
                  h-3.5
                  w-3.5
                "
              />

              Last review:{' '}
              {formatDate(
                mistake?.lastReviewedAt
              )}
            </span>
          </div>

          {/* ACTIONS */}

          <div
            className="
              flex
              flex-col
              gap-2
              border-t
              border-slate-100
              pt-5
              sm:flex-row
              sm:flex-wrap

              dark:border-slate-800
            "
          >
            <button
              type="button"
              onClick={
                onToggleMastered
              }
              disabled={
                updatingMastered
              }
              className={`
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                px-4
                py-2.5
                text-xs
                font-black
                transition
                disabled:cursor-not-allowed
                disabled:opacity-60

                ${
                  mistake?.isMastered
                    ? `
                      border
                      border-amber-200
                      bg-amber-50
                      text-amber-700
                      hover:bg-amber-100

                      dark:border-amber-500/20
                      dark:bg-amber-500/10
                      dark:text-amber-300
                    `
                    : `
                      bg-emerald-600
                      text-white
                      hover:bg-emerald-700
                    `
                }
              `}
            >
              {updatingMastered ? (
                <Loader2
                  className="
                    h-4
                    w-4
                    animate-spin
                  "
                />
              ) : (
                <CheckCircle2
                  className="
                    h-4
                    w-4
                  "
                />
              )}

              {mistake?.isMastered
                ? 'Move to Revision'
                : 'Mark Mastered'}
            </button>

            <Link
              to="/navta-test"
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-sky-200
                bg-sky-50
                px-4
                py-2.5
                text-xs
                font-black
                text-sky-700
                transition
                hover:bg-sky-100

                dark:border-sky-500/20
                dark:bg-sky-500/10
                dark:text-sky-300
                dark:hover:bg-sky-500/15
              "
            >
              <Target
                className="
                  h-4
                  w-4
                "
              />

              Practice Again
            </Link>

            <button
              type="button"
              onClick={
                onDelete
              }
              disabled={
                deleting
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-rose-200
                bg-white
                px-4
                py-2.5
                text-xs
                font-black
                text-rose-600
                transition
                hover:bg-rose-50
                disabled:cursor-not-allowed
                disabled:opacity-60

                dark:border-rose-500/20
                dark:bg-transparent
                dark:text-rose-300
                dark:hover:bg-rose-500/10
              "
            >
              {deleting ? (
                <Loader2
                  className="
                    h-4
                    w-4
                    animate-spin
                  "
                />
              ) : (
                <Trash2
                  className="
                    h-4
                    w-4
                  "
                />
              )}

              Remove
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

// =====================================================
// ANSWER BOX
// =====================================================

function AnswerBox({
  icon: Icon,
  title,
  letter,
  answer,
  wrong = false,
  correct = false
}) {
  return (
    <div
      className={`
        rounded-2xl
        border
        p-4

        ${
          wrong
            ? `
              border-rose-200
              bg-rose-50/70

              dark:border-rose-500/20
              dark:bg-rose-500/[0.06]
            `
            : ''
        }

        ${
          correct
            ? `
              border-emerald-200
              bg-emerald-50/70

              dark:border-emerald-500/20
              dark:bg-emerald-500/[0.06]
            `
            : ''
        }
      `}
    >
      <div
        className="
          flex
          items-center
          gap-2
        "
      >
        <Icon
          className={`
            h-4
            w-4

            ${
              wrong
                ? 'text-rose-500'
                : 'text-emerald-500'
            }
          `}
        />

        <p
          className={`
            text-xs
            font-black

            ${
              wrong
                ? `
                  text-rose-700
                  dark:text-rose-300
                `
                : `
                  text-emerald-700
                  dark:text-emerald-300
                `
            }
          `}
        >
          {title}
        </p>
      </div>

      <p
        className="
          mt-3
          text-sm
          font-bold
          leading-6
          text-slate-800

          dark:text-slate-200
        "
      >
        <span
          className="
            mr-1
            font-black
          "
        >
          {letter}.
        </span>

        {answer}
      </p>
    </div>
  );
}

// =====================================================
// BADGE
// =====================================================

function Badge({
  children
}) {
  return (
    <span
      className="
        rounded-full
        border
        border-slate-200
        bg-slate-50
        px-2.5
        py-1
        text-[9px]
        font-black
        text-slate-600

        dark:border-slate-800
        dark:bg-slate-950/40
        dark:text-slate-400
      "
    >
      {children}
    </span>
  );
}

// =====================================================
// SELECT FILTER
// =====================================================

function SelectFilter({
  value,
  onChange,
  options
}) {
  return (
    <div
      className="
        relative
      "
    >
      <select
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          w-full
          appearance-none
          rounded-xl
          border
          border-slate-200
          bg-slate-50/80
          px-4
          py-3
          pr-10
          text-sm
          font-semibold
          text-slate-700
          outline-none
          transition
          focus:border-sky-400
          focus:ring-2
          focus:ring-sky-100

          dark:border-slate-800
          dark:bg-slate-950/40
          dark:text-slate-300
          dark:focus:border-sky-500
          dark:focus:ring-sky-500/10
        "
      >
        {options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>

      <ChevronDown
        className="
          pointer-events-none
          absolute
          right-3
          top-1/2
          h-4
          w-4
          -translate-y-1/2
          text-slate-400
        "
      />
    </div>
  );
}

// =====================================================
// STAT CARD
// =====================================================

function StatCard({
  icon: Icon,
  value,
  label,
  iconClass,
  iconBg
}) {
  return (
    <div
      className="
        rounded-[22px]
        border
        border-slate-200/80
        bg-white/88
        p-4
        shadow-[0_14px_40px_rgba(15,23,42,0.08)]
        backdrop-blur-xl
        sm:p-5

        dark:border-slate-800
        dark:bg-[#081326]/92
        dark:shadow-xl
      "
    >
      <div
        className="
          flex
          items-center
          gap-3
        "
      >
        <div
          className={`
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl

            ${iconBg}
          `}
        >
          <Icon
            className={`
              h-5
              w-5

              ${iconClass}
            `}
          />
        </div>

        <div
          className="
            min-w-0
          "
        >
          <p
            className="
              text-xl
              font-black
              text-slate-950
              sm:text-2xl

              dark:text-white
            "
          >
            {value}
          </p>

          <p
            className="
              text-[9px]
              font-bold
              uppercase
              tracking-wider
              text-slate-400

              dark:text-slate-500
            "
          >
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// EMPTY NOTEBOOK
// =====================================================

function EmptyNotebook() {
  return (
    <section
      className="
        rounded-[28px]
        border
        border-slate-200/80
        bg-white/88
        px-6
        py-16
        text-center
        shadow-[0_18px_55px_rgba(15,23,42,0.08)]
        backdrop-blur-xl

        dark:border-slate-800
        dark:bg-[#081326]/92
      "
    >
      <div
        className="
          mx-auto
          flex
          h-16
          w-16
          items-center
          justify-center
          rounded-2xl
          bg-rose-100

          dark:bg-rose-500/10
        "
      >
        <BookOpen
          className="
            h-8
            w-8
            text-rose-500

            dark:text-rose-400
          "
        />
      </div>

      <h2
        className="
          mt-5
          text-xl
          font-black
          text-slate-950
          sm:text-2xl

          dark:text-white
        "
      >
        Your notebook is empty
      </h2>

      <p
        className="
          mx-auto
          mt-3
          max-w-lg
          text-sm
          leading-6
          text-slate-500

          dark:text-slate-400
        "
      >
        When you get a NAVTA TEST
        question wrong, choose
        “Add to Mistake Notebook”.
        Your saved questions and
        personal revision notes will
        appear here.
      </p>

      <Link
        to="/navta-test"
        className="
          mt-6
          inline-flex
          items-center
          justify-center
          gap-2
          rounded-xl
          bg-gradient-to-r
          from-rose-500
          to-orange-500
          px-5
          py-3
          text-sm
          font-black
          text-white
          shadow-lg
          transition
          hover:-translate-y-0.5
          hover:shadow-xl
        "
      >
        <Target
          className="
            h-4
            w-4
          "
        />

        Start NAVTA TEST
      </Link>
    </section>
  );
}
