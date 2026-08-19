import React, { useEffect, useMemo, useState } from 'react';
import { contentAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

import {
  FileText,
  Download,
  Calendar,
  Tag,
  PlusCircle,
  GraduationCap,
  BookOpen,
  ChevronRight,
  ArrowLeft,
  Search,
  Clock
} from 'lucide-react';

import { Link } from 'react-router-dom';


// ======================================================
// SCHOOL SUBJECTS
// ======================================================

const SCHOOL_SUBJECTS = [
  'Physics',
  'Chemistry',
  'Maths',
  'Biology'
];


// ======================================================
// JEE YEARS
// JEE Main started in 2013
// ======================================================

const JEE_YEARS = [];

for (
  let year = 2013;
  year <= new Date().getFullYear();
  year++
) {
  JEE_YEARS.push(String(year));
}


// ======================================================
// NEET YEARS
//
// NEET-UG was first conducted in 2013.
// NEET was not conducted as NEET-UG in 2014.
// 2015 used AIPMT.
// NEET-UG resumed from 2016.
//
// Therefore:
// 2013, 2016, 2017, ... current year
// ======================================================

const NEET_YEARS = [
  '2013',
  ...Array.from(
    {
      length:
        new Date().getFullYear() - 2016 + 1
    },
    (_, index) =>
      String(2016 + index)
  )
];


// ======================================================
// MAIN SECTIONS
// ======================================================

const EXAM_OPTIONS = [
  {
    id: 'school',
    title: 'School Level',
    description:
      'Class 11 & 12 school examination papers',
    icon: GraduationCap
  },
  {
    id: 'jee',
    title: 'JEE',
    description:
      'JEE Main previous year question papers',
    icon: BookOpen
  },
  {
    id: 'neet',
    title: 'NEET',
    description:
      'NEET previous year question papers',
    icon: BookOpen
  }
];


// ======================================================
// HELPERS
// ======================================================

const normalize = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase();
};


const normalizeExam = (paper) => {
  return normalize(
    paper?.examName ||
      paper?.exam ||
      paper?.examType ||
      ''
  );
};


const getPaperSession = (paper) => {
  return normalize(
    paper?.session ||
      paper?.attempt ||
      paper?.phase ||
      ''
  );
};


const getPaperDate = (paper) => {
  return (
    paper?.examDate ||
    paper?.date ||
    paper?.paperDate ||
    ''
  );
};


const getPaperShift = (paper) => {
  return (
    paper?.shift ||
    paper?.shiftName ||
    ''
  );
};


const formatDate = (dateValue) => {
  if (!dateValue) {
    return 'Date not available';
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  );
};


// ======================================================
// MAIN COMPONENT
// ======================================================

export default function PYQPage() {

  const { user } = useAuth();


  // ====================================================
  // BACKEND DATA
  // ====================================================

  const [subjects, setSubjects] =
    useState([]);

  const [allPYQs, setAllPYQs] =
    useState([]);


  // ====================================================
  // LOADING
  // ====================================================

  const [loading, setLoading] =
    useState(true);

  const [papersLoading, setPapersLoading] =
    useState(false);


  // ====================================================
  // MAIN SECTION
  // ====================================================

  const [section, setSection] =
    useState('');


  // ====================================================
  // SCHOOL
  // ====================================================

  const [schoolClass, setSchoolClass] =
    useState('');

  const [schoolSubject, setSchoolSubject] =
    useState('');


  // ====================================================
  // COMPETITIVE EXAM
  // ====================================================

  const [competitiveExam, setCompetitiveExam] =
    useState('');

  const [selectedYear, setSelectedYear] =
    useState('all');


  // ====================================================
  // JEE FILTERS
  // ====================================================

  const [jeeSession, setJeeSession] =
    useState('all');

  const [jeeDate, setJeeDate] =
    useState('all');

  const [jeeShift, setJeeShift] =
    useState('all');


  // ====================================================
  // LOAD SUBJECTS
  // ====================================================

  useEffect(() => {

    contentAPI
      .getSubjects()
      .then((res) => {

        setSubjects(
          res.data || []
        );

        setLoading(false);

      })
      .catch((err) => {

        console.error(
          'Error loading subjects:',
          err
        );

        setLoading(false);

      });

  }, []);


  // ====================================================
  // FIND SUBJECT ID
  // ====================================================

  const findSubjectId = (
    subjectName
  ) => {

    if (!subjectName) {
      return '';
    }

    const found =
      subjects.find(
        (subject) =>
          normalize(
            subject.name
          ) ===
          normalize(
            subjectName
          )
      );

    return found?._id || '';
  };


  // ====================================================
  // LOAD SUBJECT PYQS
  // ====================================================

  const loadSubjectPYQs =
    async (subjectName) => {

      const subjectId =
        findSubjectId(
          subjectName
        );

      if (!subjectId) {

        setAllPYQs([]);

        return;
      }

      try {

        setPapersLoading(true);

        const res =
          await contentAPI.getPYQs(
            subjectId
          );

        setAllPYQs(
          res.data || []
        );

      } catch (error) {

        console.error(
          'Error loading PYQs:',
          error
        );

        setAllPYQs([]);

      } finally {

        setPapersLoading(false);

      }
    };


  // ====================================================
  // LOAD COMPETITIVE PYQS
  // ====================================================

  const loadCompetitivePYQs =
    async (examName) => {

      try {

        setPapersLoading(true);

        setAllPYQs([]);

        if (!subjects.length) {

          setPapersLoading(false);

          return;
        }


        const responses =
          await Promise.all(

            subjects.map(
              (subject) =>

                contentAPI
                  .getPYQs(
                    subject._id
                  )
                  .then(
                    (res) =>
                      res.data || []
                  )
                  .catch(
                    () => []
                  )
            )

          );


        const combined =
          responses.flat();


        const uniquePapers =
          Array.from(
            new Map(
              combined.map(
                (paper) => [
                  paper._id,
                  paper
                ]
              )
            ).values()
          );


        const filtered =
          uniquePapers.filter(
            (paper) => {

              const exam =
                normalizeExam(
                  paper
                );


              if (
                examName === 'JEE'
              ) {

                return exam.includes(
                  'jee'
                );

              }


              if (
                examName === 'NEET'
              ) {

                return exam.includes(
                  'neet'
                );

              }


              return false;

            }
          );


        setAllPYQs(
          filtered
        );

      } catch (error) {

        console.error(
          'Error loading competitive PYQs:',
          error
        );

        setAllPYQs([]);

      } finally {

        setPapersLoading(false);

      }
    };


  // ====================================================
  // SCHOOL SUBJECT CHANGE
  // ====================================================

  useEffect(() => {

    if (
      section === 'school' &&
      schoolSubject
    ) {

      loadSubjectPYQs(
        schoolSubject
      );

    }

  }, [
    schoolSubject,
    section,
    subjects
  ]);


  // ====================================================
  // JEE / NEET CHANGE
  // ====================================================

  useEffect(() => {

    if (
      section === 'jee'
    ) {

      setCompetitiveExam(
        'JEE'
      );

      setSelectedYear(
        'all'
      );

      setJeeSession(
        'all'
      );

      setJeeDate(
        'all'
      );

      setJeeShift(
        'all'
      );

      loadCompetitivePYQs(
        'JEE'
      );

    }


    if (
      section === 'neet'
    ) {

      setCompetitiveExam(
        'NEET'
      );

      setSelectedYear(
        'all'
      );

      setJeeSession(
        'all'
      );

      setJeeDate(
        'all'
      );

      setJeeShift(
        'all'
      );

      loadCompetitivePYQs(
        'NEET'
      );

    }

  }, [
    section,
    subjects
  ]);


  // ====================================================
  // YEAR LIST
  // ====================================================

  const availableYears =
    useMemo(() => {

      if (
        section === 'jee'
      ) {

        return JEE_YEARS;

      }


      if (
        section === 'neet'
      ) {

        return NEET_YEARS;

      }


      return [];

    }, [
      section
    ]);


  // ====================================================
  // JEE PAPERS FOR SELECTED YEAR
  // ====================================================

  const jeeYearPapers =
    useMemo(() => {

      if (
        section !== 'jee'
      ) {

        return [];

      }


      if (
        selectedYear === 'all'
      ) {

        return allPYQs;

      }


      return allPYQs.filter(
        (paper) =>
          String(
            paper.year
          ) ===
          String(
            selectedYear
          )
      );

    }, [
      allPYQs,
      selectedYear,
      section
    ]);


  // ====================================================
  // JEE SESSIONS
  // ====================================================

  const availableJeeSessions =
    useMemo(() => {

      const sessions =
        jeeYearPapers
          .map(
            (paper) =>
              getPaperSession(
                paper
              )
          )
          .filter(Boolean);


      const unique =
        [
          ...new Set(
            sessions
          )
        ];


      unique.sort(
        (a, b) => {

          const order = {

            january: 1,

            jan: 1,

            april: 2,

            apr: 2

          };

          return (
            (order[a] || 99) -
            (order[b] || 99)
          );

        }
      );


      return unique;

    }, [
      jeeYearPapers
    ]);


  // ====================================================
  // JEE DATES
  // ====================================================

  const availableJeeDates =
    useMemo(() => {

      let papers =
        [
          ...jeeYearPapers
        ];


      if (
        jeeSession !== 'all'
      ) {

        papers =
          papers.filter(
            (paper) =>
              getPaperSession(
                paper
              ) ===
              normalize(
                jeeSession
              )
          );

      }


      const dates =
        papers
          .map(
            (paper) =>
              getPaperDate(
                paper
              )
          )
          .filter(Boolean)
          .map(
            (date) =>
              String(date)
          );


      return [
        ...new Set(
          dates
        )
      ].sort(
        (a, b) => {

          const da =
            new Date(a);

          const db =
            new Date(b);

          return da - db;

        }
      );

    }, [
      jeeYearPapers,
      jeeSession
    ]);


  // ====================================================
  // JEE SHIFTS
  // ====================================================

  const availableJeeShifts =
    useMemo(() => {

      let papers =
        [
          ...jeeYearPapers
        ];


      if (
        jeeSession !== 'all'
      ) {

        papers =
          papers.filter(
            (paper) =>
              getPaperSession(
                paper
              ) ===
              normalize(
                jeeSession
              )
          );

      }


      if (
        jeeDate !== 'all'
      ) {

        papers =
          papers.filter(
            (paper) =>
              String(
                getPaperDate(
                  paper
                )
              ) ===
              String(
                jeeDate
              )
          );

      }


      const shifts =
        papers
          .map(
            (paper) =>
              getPaperShift(
                paper
              )
          )
          .filter(Boolean);


      return [
        ...new Set(
          shifts
        )
      ].sort();

    }, [
      jeeYearPapers,
      jeeSession,
      jeeDate
    ]);


  // ====================================================
  // DISPLAY PAPERS
  // ====================================================

  const displayedPYQs =
    useMemo(() => {

      let papers =
        [
          ...allPYQs
        ];


      // -----------------------------------------------
      // SCHOOL CLASS
      // -----------------------------------------------

      if (
        section === 'school' &&
        schoolClass
      ) {

        papers =
          papers.filter(
            (paper) => {

              const classValue =
                paper.classLevel ||
                paper.class ||
                paper.className ||
                paper.grade ||
                '';


              const normalizedClass =
                normalize(
                  classValue
                ).replace(
                  /\s+/g,
                  ''
                );


              const selectedClass =
                normalize(
                  schoolClass
                ).replace(
                  /\s+/g,
                  ''
                );


              return (
                normalizedClass ===
                  selectedClass ||
                normalizedClass.includes(
                  selectedClass
                )
              );

            }
          );

      }


      // -----------------------------------------------
      // YEAR
      // -----------------------------------------------

      if (
        (
          section === 'jee' ||
          section === 'neet'
        ) &&
        selectedYear !== 'all'
      ) {

        papers =
          papers.filter(
            (paper) =>
              String(
                paper.year
              ) ===
              String(
                selectedYear
              )
          );

      }


      // -----------------------------------------------
      // JEE SESSION
      // -----------------------------------------------

      if (
        section === 'jee' &&
        jeeSession !== 'all'
      ) {

        papers =
          papers.filter(
            (paper) =>
              getPaperSession(
                paper
              ) ===
              normalize(
                jeeSession
              )
          );

      }


      // -----------------------------------------------
      // JEE DATE
      // -----------------------------------------------

      if (
        section === 'jee' &&
        jeeDate !== 'all'
      ) {

        papers =
          papers.filter(
            (paper) =>
              String(
                getPaperDate(
                  paper
                )
              ) ===
              String(
                jeeDate
              )
          );

      }


      // -----------------------------------------------
      // JEE SHIFT
      // -----------------------------------------------

      if (
        section === 'jee' &&
        jeeShift !== 'all'
      ) {

        papers =
          papers.filter(
            (paper) =>
              String(
                getPaperShift(
                  paper
                )
              ) ===
              String(
                jeeShift
              )
          );

      }


      // -----------------------------------------------
      // SORT
      // -----------------------------------------------

      papers.sort(
        (a, b) => {

          const yearDifference =
            Number(
              b.year || 0
            ) -
            Number(
              a.year || 0
            );


          if (
            yearDifference !== 0
          ) {

            return yearDifference;

          }


          const dateA =
            new Date(
              getPaperDate(a)
            ).getTime() || 0;


          const dateB =
            new Date(
              getPaperDate(b)
            ).getTime() || 0;


          return (
            dateA - dateB
          );

        }
      );


      return papers;

    }, [
      allPYQs,
      section,
      schoolClass,
      selectedYear,
      jeeSession,
      jeeDate,
      jeeShift
    ]);


  // ====================================================
  // RESET
  // ====================================================

  const resetAll = () => {

    setSection('');

    setSchoolClass('');

    setSchoolSubject('');

    setCompetitiveExam('');

    setSelectedYear(
      'all'
    );

    setJeeSession(
      'all'
    );

    setJeeDate(
      'all'
    );

    setJeeShift(
      'all'
    );

    setAllPYQs([]);

  };


  // ====================================================
  // BACK
  // ====================================================

  const goBack = () => {

    // SCHOOL
    if (
      section === 'school'
    ) {

      if (
        schoolSubject
      ) {

        setSchoolSubject('');

        setAllPYQs([]);

        return;

      }


      if (
        schoolClass
      ) {

        setSchoolClass('');

        return;

      }


      setSection('');

      return;

    }


    // JEE
    if (
      section === 'jee'
    ) {

      setSection('');

      setCompetitiveExam('');

      setSelectedYear(
        'all'
      );

      setJeeSession(
        'all'
      );

      setJeeDate(
        'all'
      );

      setJeeShift(
        'all'
      );

      setAllPYQs([]);

      return;

    }


    // NEET
    if (
      section === 'neet'
    ) {

      setSection('');

      setCompetitiveExam('');

      setSelectedYear(
        'all'
      );

      setAllPYQs([]);

    }

  };


  // ====================================================
  // LOADING SCREEN
  // ====================================================

  if (loading) {

    return (

      <div
        className="
          flex
          h-[80vh]
          items-center
          justify-center
        "
      >

        <div
          className="
            h-8
            w-8
            animate-spin
            rounded-full
            border-4
            border-primary-500
            border-t-transparent
          "
        />

      </div>

    );

  }


  // ====================================================
  // MAIN PYQ MENU
  // ====================================================

  if (!section) {

    return (

      <div
        className="
          space-y-8
        "
      >

        <div
          className="
            border-b
            border-slate-200
            dark:border-slate-800
            pb-5
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
              className="
                p-3
                rounded-xl
                bg-indigo-50
                dark:bg-indigo-950/30
                text-indigo-500
              "
            >

              <FileText
                className="w-7 h-7"
              />

            </div>


            <div>

              <h1
                className="
                  text-2xl
                  font-extrabold
                  text-slate-900
                  dark:text-white
                "
              >
                Past Year Papers (PYQs)
              </h1>


              <p
                className="
                  text-sm
                  text-slate-400
                  mt-1
                "
              >
                Choose your examination category.
              </p>

            </div>

          </div>

        </div>


        {/* THREE OPTIONS */}

        <div
          className="
            grid
            md:grid-cols-3
            gap-6
          "
        >

          {EXAM_OPTIONS.map(
            (option) => {

              const Icon =
                option.icon;


              return (

                <button
                  key={option.id}
                  onClick={() => {

                    setSection(
                      option.id
                    );

                    setSchoolClass('');

                    setSchoolSubject('');

                    setSelectedYear(
                      'all'
                    );

                    setJeeSession(
                      'all'
                    );

                    setJeeDate(
                      'all'
                    );

                    setJeeShift(
                      'all'
                    );

                    setAllPYQs([]);

                  }}
                  className="
                    text-left
                    group
                    rounded-2xl
                    border
                    border-slate-200
                    dark:border-slate-800
                    bg-white
                    dark:bg-slate-900
                    p-6
                    hover:-translate-y-1
                    hover:border-primary-500
                    hover:shadow-xl
                    transition-all
                    duration-200
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <div
                      className="
                        p-3
                        rounded-xl
                        bg-indigo-50
                        dark:bg-indigo-950/30
                        text-indigo-500
                      "
                    >

                      <Icon
                        className="w-7 h-7"
                      />

                    </div>


                    <ChevronRight
                      className="
                        w-5
                        h-5
                        text-slate-400
                        group-hover:text-primary-500
                      "
                    />

                  </div>


                  <h2
                    className="
                      mt-6
                      text-lg
                      font-bold
                      text-slate-900
                      dark:text-white
                    "
                  >
                    {option.title}
                  </h2>


                  <p
                    className="
                      mt-2
                      text-sm
                      text-slate-400
                    "
                  >
                    {option.description}
                  </p>

                </button>

              );

            }
          )}

        </div>


        {/* ADMIN / TEACHER LINK */}

        {(user?.role === 'teacher' ||
          user?.role === 'admin') && (

          <div
            className="
              flex
              justify-end
            "
          >

            <Link
              to={
                user.role === 'teacher'
                  ? '/teacher'
                  : '/admin'
              }
            >

              <Button
                icon={PlusCircle}
                className="
                  px-4
                  py-2.5
                  text-xs
                "
              >
                Upload Paper
              </Button>

            </Link>

          </div>

        )}

      </div>

    );

  }


  // ====================================================
  // SCHOOL - SELECT CLASS
  // ====================================================

  if (
    section === 'school' &&
    !schoolClass
  ) {

    return (

      <div
        className="
          space-y-8
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
            border-b
            border-slate-200
            dark:border-slate-800
            pb-5
          "
        >

          <button
            onClick={goBack}
            className="
              p-2
              rounded-lg
              hover:bg-slate-100
              dark:hover:bg-slate-800
            "
          >

            <ArrowLeft
              className="w-5 h-5 text-slate-500"
            />

          </button>


          <div>

            <h1
              className="
                text-2xl
                font-extrabold
                text-slate-900
                dark:text-white
              "
            >
              School Level
            </h1>


            <p
              className="
                text-sm
                text-slate-400
                mt-1
              "
            >
              Select your class.
            </p>

          </div>

        </div>


        <div
          className="
            grid
            md:grid-cols-2
            gap-6
          "
        >

          {['11th', '12th'].map(
            (className) => (

              <button
                key={className}
                onClick={() =>
                  setSchoolClass(
                    className
                  )
                }
                className="
                  group
                  p-8
                  text-left
                  rounded-2xl
                  border
                  border-slate-200
                  dark:border-slate-800
                  bg-white
                  dark:bg-slate-900
                  hover:-translate-y-1
                  hover:border-primary-500
                  transition-all
                "
              >

                <div
                  className="
                    flex
                    justify-between
                    items-center
                  "
                >

                  <div
                    className="
                      p-4
                      rounded-xl
                      bg-indigo-50
                      dark:bg-indigo-950/30
                      text-indigo-500
                    "
                  >

                    <GraduationCap
                      className="w-8 h-8"
                    />

                  </div>


                  <ChevronRight
                    className="
                      w-6 h-6
                      text-slate-400
                    "
                  />

                </div>


                <h2
                  className="
                    mt-6
                    text-xl
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  Class {className}
                </h2>


                <p
                  className="
                    text-sm
                    text-slate-400
                    mt-2
                  "
                >
                  View Class {className} previous year papers.
                </p>

              </button>

            )
          )}

        </div>

      </div>

    );

  }


  // ====================================================
  // SCHOOL - SELECT SUBJECT
  // ====================================================

  if (
    section === 'school' &&
    schoolClass &&
    !schoolSubject
  ) {

    return (

      <div
        className="
          space-y-8
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
            border-b
            border-slate-200
            dark:border-slate-800
            pb-5
          "
        >

          <button
            onClick={goBack}
            className="
              p-2
              rounded-lg
              hover:bg-slate-100
              dark:hover:bg-slate-800
            "
          >

            <ArrowLeft
              className="w-5 h-5 text-slate-500"
            />

          </button>


          <div>

            <h1
              className="
                text-2xl
                font-extrabold
                text-slate-900
                dark:text-white
              "
            >
              Class {schoolClass}
            </h1>


            <p
              className="
                text-sm
                text-slate-400
                mt-1
              "
            >
              Select a subject.
            </p>

          </div>

        </div>


        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-5
          "
        >

          {SCHOOL_SUBJECTS.map(
            (subject) => (

              <button
                key={subject}
                onClick={() =>
                  setSchoolSubject(
                    subject
                  )
                }
                className="
                  group
                  p-6
                  text-left
                  rounded-2xl
                  border
                  border-slate-200
                  dark:border-slate-800
                  bg-white
                  dark:bg-slate-900
                  hover:-translate-y-1
                  hover:border-primary-500
                  transition-all
                "
              >

                <div
                  className="
                    flex
                    justify-between
                    items-center
                  "
                >

                  <div
                    className="
                      p-3
                      rounded-xl
                      bg-indigo-50
                      dark:bg-indigo-950/30
                      text-indigo-500
                    "
                  >

                    <BookOpen
                      className="w-6 h-6"
                    />

                  </div>


                  <ChevronRight
                    className="
                      w-5 h-5
                      text-slate-400
                    "
                  />

                </div>


                <h2
                  className="
                    mt-5
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {subject}
                </h2>


                <p
                  className="
                    text-xs
                    text-slate-400
                    mt-2
                  "
                >
                  Class {schoolClass} {subject} papers
                </p>

              </button>

            )
          )}

        </div>

      </div>

    );

  }


  // ====================================================
  // JEE / NEET
  // ====================================================

  if (
    section === 'jee' ||
    section === 'neet'
  ) {

    return (

      <div
        className="
          space-y-6
        "
      >

        {/* HEADER */}

        <div
          className="
            flex
            flex-col
            gap-4
            border-b
            border-slate-200
            dark:border-slate-800
            pb-5
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <button
              onClick={goBack}
              className="
                p-2
                rounded-lg
                hover:bg-slate-100
                dark:hover:bg-slate-800
              "
            >

              <ArrowLeft
                className="
                  w-5
                  h-5
                  text-slate-500
                "
              />

            </button>


            <div
              className="
                p-3
                rounded-xl
                bg-indigo-50
                dark:bg-indigo-950/30
                text-indigo-500
              "
            >

              <BookOpen
                className="w-6 h-6"
              />

            </div>


            <div>

              <h1
                className="
                  text-2xl
                  font-extrabold
                  text-slate-900
                  dark:text-white
                "
              >
                {competitiveExam} Previous Year Papers
              </h1>


              <p
                className="
                  text-xs
                  text-slate-400
                  mt-1
                "
              >
                Select a year to find previous year papers.
              </p>

            </div>

          </div>


          {/* FILTERS */}

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-4
              gap-3
            "
          >

            {/* YEAR */}

            <div>

              <label
                className="
                  block
                  text-xs
                  font-semibold
                  text-slate-500
                  mb-1.5
                "
              >
                Year
              </label>


              <select
                value={selectedYear}
                onChange={(e) => {

                  setSelectedYear(
                    e.target.value
                  );

                  setJeeSession(
                    'all'
                  );

                  setJeeDate(
                    'all'
                  );

                  setJeeShift(
                    'all'
                  );

                }}
                className="
                  w-full
                  px-3
                  py-2.5
                  rounded-xl
                  border
                  border-slate-200
                  dark:border-slate-800
                  dark:bg-slate-950
                  text-slate-800
                  dark:text-slate-100
                  text-sm
                  focus:outline-none
                  focus:border-primary-500
                "
              >

                <option value="all">
                  All Years
                </option>


                {availableYears.map(
                  (year) => (

                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>

                  )
                )}

              </select>

            </div>


            {/* JEE SESSION */}

            {section === 'jee' && (

              <div>

                <label
                  className="
                    block
                    text-xs
                    font-semibold
                    text-slate-500
                    mb-1.5
                  "
                >
                  Session
                </label>


                <select
                  value={jeeSession}
                  onChange={(e) => {

                    setJeeSession(
                      e.target.value
                    );

                    setJeeDate(
                      'all'
                    );

                    setJeeShift(
                      'all'
                    );

                  }}
                  className="
                    w-full
                    px-3
                    py-2.5
                    rounded-xl
                    border
                    border-slate-200
                    dark:border-slate-800
                    dark:bg-slate-950
                    text-slate-800
                    dark:text-slate-100
                    text-sm
                    focus:outline-none
                    focus:border-primary-500
                  "
                >

                  <option value="all">
                    All Sessions
                  </option>


                  {availableJeeSessions.map(
                    (session) => (

                      <option
                        key={session}
                        value={session}
                      >

                        {session === 'jan' ||
                        session === 'january'
                          ? 'January Session'
                          : session === 'apr' ||
                            session === 'april'
                          ? 'April Session'
                          : session}

                      </option>

                    )
                  )}

                </select>

              </div>

            )}


            {/* JEE DATE */}

            {section === 'jee' && (

              <div>

                <label
                  className="
                    block
                    text-xs
                    font-semibold
                    text-slate-500
                    mb-1.5
                  "
                >
                  Exam Date
                </label>


                <select
                  value={jeeDate}
                  onChange={(e) => {

                    setJeeDate(
                      e.target.value
                    );

                    setJeeShift(
                      'all'
                    );

                  }}
                  className="
                    w-full
                    px-3
                    py-2.5
                    rounded-xl
                    border
                    border-slate-200
                    dark:border-slate-800
                    dark:bg-slate-950
                    text-slate-800
                    dark:text-slate-100
                    text-sm
                    focus:outline-none
                    focus:border-primary-500
                  "
                >

                  <option value="all">
                    All Dates
                  </option>


                  {availableJeeDates.map(
                    (date) => (

                      <option
                        key={date}
                        value={date}
                      >
                        {formatDate(
                          date
                        )}
                      </option>

                    )
                  )}

                </select>

              </div>

            )}


            {/* JEE SHIFT */}

            {section === 'jee' && (

              <div>

                <label
                  className="
                    block
                    text-xs
                    font-semibold
                    text-slate-500
                    mb-1.5
                  "
                >
                  Shift
                </label>


                <select
                  value={jeeShift}
                  onChange={(e) =>
                    setJeeShift(
                      e.target.value
                    )
                  }
                  className="
                    w-full
                    px-3
                    py-2.5
                    rounded-xl
                    border
                    border-slate-200
                    dark:border-slate-800
                    dark:bg-slate-950
                    text-slate-800
                    dark:text-slate-100
                    text-sm
                    focus:outline-none
                    focus:border-primary-500
                  "
                >

                  <option value="all">
                    All Shifts
                  </option>


                  {availableJeeShifts.map(
                    (shift) => (

                      <option
                        key={shift}
                        value={shift}
                      >
                        {shift}
                      </option>

                    )
                  )}

                </select>

              </div>

            )}

          </div>

        </div>


        {/* JEE INFORMATION */}

        {section === 'jee' && (

          <div
            className="
              rounded-xl
              border
              border-blue-200
              dark:border-blue-900
              bg-blue-50
              dark:bg-blue-950/20
              p-4
            "
          >

            <div
              className="
                flex
                gap-3
              "
            >

              <Calendar
                className="
                  w-5
                  h-5
                  text-blue-500
                  mt-0.5
                "
              />


              <div>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-800
                    dark:text-slate-200
                  "
                >
                  JEE Main Previous Year Papers
                </p>


                <p
                  className="
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                    mt-1
                  "
                >
                  JEE years from 2013 onwards are available in the year selector.
                  January and April session dates and shifts appear when those
                  details are available in the existing paper data.
                </p>

              </div>

            </div>

          </div>

        )}


        {/* NEET INFORMATION */}

        {section === 'neet' && (

          <div
            className="
              rounded-xl
              border
              border-green-200
              dark:border-green-900
              bg-green-50
              dark:bg-green-950/20
              p-4
            "
          >

            <div
              className="
                flex
                gap-3
              "
            >

              <Calendar
                className="
                  w-5
                  h-5
                  text-green-500
                  mt-0.5
                "
              />


              <div>

                <p
                  className="
                    text-sm
                    font-semibold
                    text-slate-800
                    dark:text-slate-200
                  "
                >
                  NEET-UG Previous Year Papers
                </p>


                <p
                  className="
                    text-xs
                    text-slate-500
                    dark:text-slate-400
                    mt-1
                  "
                >
                  NEET-UG was first conducted in 2013.
                  The year selector includes 2013 and the NEET-UG years
                  from 2016 onwards.
                </p>

              </div>

            </div>

          </div>

        )}


        {/* LOADING */}

        {papersLoading && (

          <div
            className="
              flex
              justify-center
              py-12
            "
          >

            <div
              className="
                h-8
                w-8
                animate-spin
                rounded-full
                border-4
                border-primary-500
                border-t-transparent
              "
            />

          </div>

        )}


        {/* PAPERS */}

        {!papersLoading && (

          <div
            className="
              grid
              md:grid-cols-2
              lg:grid-cols-3
              gap-6
            "
          >

            {displayedPYQs.map(
              (paper) => (

                <Card
                  key={paper._id}
                  className="
                    hover:-translate-y-1
                    transition-all
                    duration-200
                  "
                >

                  <div
                    className="
                      p-3
                      rounded-2xl
                      bg-indigo-50
                      dark:bg-indigo-950/20
                      text-indigo-500
                      w-fit
                      mb-4
                    "
                  >

                    <FileText
                      className="w-6 h-6"
                    />

                  </div>


                  <h3
                    className="
                      text-base
                      font-bold
                      text-slate-900
                      dark:text-white
                      leading-snug
                    "
                  >
                    {paper.title}
                  </h3>


                  <div
                    className="
                      flex
                      flex-wrap
                      items-center
                      gap-3
                      mt-4
                      text-[10px]
                      text-slate-400
                    "
                  >

                    <div
                      className="
                        flex
                        items-center
                        gap-1
                      "
                    >

                      <Calendar
                        className="w-3.5 h-3.5"
                      />

                      <span>
                        Year {paper.year || 'N/A'}
                      </span>

                    </div>


                    <div
                      className="
                        flex
                        items-center
                        gap-1
                      "
                    >

                      <Tag
                        className="w-3.5 h-3.5"
                      />

                      <span>
                        {paper.examName ||
                          competitiveExam}
                      </span>

                    </div>

                  </div>


                  {/* JEE DETAILS */}

                  {section === 'jee' && (

                    <div
                      className="
                        mt-3
                        space-y-2
                      "
                    >

                      {getPaperSession(
                        paper
                      ) && (

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            text-xs
                            text-slate-500
                          "
                        >

                          <Calendar
                            className="w-3.5 h-3.5"
                          />

                          <span>
                            Session:{' '}
                            {
                              getPaperSession(
                                paper
                              )
                            }
                          </span>

                        </div>

                      )}


                      {getPaperDate(
                        paper
                      ) && (

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            text-xs
                            text-slate-500
                          "
                        >

                          <Calendar
                            className="w-3.5 h-3.5"
                          />

                          <span>
                            Date:{' '}
                            {formatDate(
                              getPaperDate(
                                paper
                              )
                            )}
                          </span>

                        </div>

                      )}


                      {getPaperShift(
                        paper
                      ) && (

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            text-xs
                            text-slate-500
                          "
                        >

                          <Clock
                            className="w-3.5 h-3.5"
                          />

                          <span>
                            {
                              getPaperShift(
                                paper
                              )
                            }
                          </span>

                        </div>

                      )}

                    </div>

                  )}


                  {/* DOWNLOAD */}

                  <div
                    className="
                      mt-6
                      pt-4
                      border-t
                      border-slate-100
                      dark:border-slate-800/40
                    "
                  >

                    {paper.pdfUrl ? (

                      <a
                        href={paper.pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                      >

                        <Button
                          variant="secondary"
                          icon={Download}
                          className="
                            w-full
                            text-xs
                            py-2
                          "
                        >
                          Download Questionnaire
                        </Button>

                      </a>

                    ) : (

                      <Button
                        variant="secondary"
                        disabled
                        className="
                          w-full
                          text-xs
                          py-2
                        "
                      >
                        No file attached
                      </Button>

                    )}

                  </div>

                </Card>

              )
            )}


            {/* EMPTY */}

            {displayedPYQs.length === 0 && (

              <div
                className="
                  col-span-full
                  text-center
                  py-16
                "
              >

                <Search
                  className="
                    w-10
                    h-10
                    text-slate-200
                    dark:text-slate-700
                    mx-auto
                    mb-3
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
                  No {competitiveExam} papers found
                </p>


                <p
                  className="
                    text-xs
                    text-slate-400
                    mt-1
                  "
                >
                  Try another year.
                </p>

              </div>

            )}

          </div>

        )}

      </div>

    );

  }


  // ====================================================
  // SCHOOL PAPERS
  // ====================================================

  return (

    <div
      className="
        space-y-6
      "
    >

      <div
        className="
          flex
          flex-col
          md:flex-row
          md:items-center
          justify-between
          gap-4
          border-b
          border-slate-200
          dark:border-slate-800
          pb-5
        "
      >

        <div
          className="
            flex
            items-center
            gap-3
          "
        >

          <button
            onClick={goBack}
            className="
              p-2
              rounded-lg
              hover:bg-slate-100
              dark:hover:bg-slate-800
            "
          >

            <ArrowLeft
              className="
                w-5
                h-5
                text-slate-500
              "
            />

          </button>


          <div>

            <h1
              className="
                text-2xl
                font-extrabold
                text-slate-900
                dark:text-white
              "
            >
              Class {schoolClass} {schoolSubject} PYQs
            </h1>


            <p
              className="
                text-xs
                text-slate-400
                mt-1
              "
            >
              Previous year school examination papers.
            </p>

          </div>

        </div>


        {/* EXISTING UPLOAD LINK */}

        {(user?.role === 'teacher' ||
          user?.role === 'admin') && (

          <Link
            to={
              user.role === 'teacher'
                ? '/teacher'
                : '/admin'
            }
          >

            <Button
              icon={PlusCircle}
              className="
                px-3.5
                py-2.5
                text-xs
              "
            >
              Upload Paper
            </Button>

          </Link>

        )}

      </div>


      {/* LOADING */}

      {papersLoading ? (

        <div
          className="
            flex
            justify-center
            py-12
          "
        >

          <div
            className="
              h-8
              w-8
              animate-spin
              rounded-full
              border-4
              border-primary-500
              border-t-transparent
            "
          />

        </div>

      ) : (

        <div
          className="
            grid
            md:grid-cols-2
            lg:grid-cols-3
            gap-6
          "
        >

          {displayedPYQs.map(
            (paper) => (

              <Card
                key={paper._id}
                className="
                  hover:-translate-y-1
                  transition-all
                  duration-200
                "
              >

                <div
                  className="
                    p-3
                    rounded-2xl
                    bg-indigo-50
                    dark:bg-indigo-950/20
                    text-indigo-500
                    w-fit
                    mb-4
                  "
                >

                  <FileText
                    className="w-6 h-6"
                  />

                </div>


                <h3
                  className="
                    text-base
                    font-bold
                    text-slate-900
                    dark:text-white
                  "
                >
                  {paper.title}
                </h3>


                {paper.chapter?.title && (

                  <p
                    className="
                      text-[10px]
                      text-slate-400
                      mt-1
                      font-semibold
                    "
                  >
                    Chapter: {paper.chapter.title}
                  </p>

                )}


                <div
                  className="
                    flex
                    flex-wrap
                    items-center
                    gap-3
                    mt-4
                    text-[10px]
                    text-slate-400
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      gap-1
                    "
                  >

                    <Calendar
                      className="w-3.5 h-3.5"
                    />

                    <span>
                      Year {paper.year || 'N/A'}
                    </span>

                  </div>


                  <div
                    className="
                      flex
                      items-center
                      gap-1
                    "
                  >

                    <Tag
                      className="w-3.5 h-3.5"
                    />

                    <span>
                      {paper.examName ||
                        'School'}
                    </span>

                  </div>

                </div>


                <div
                  className="
                    mt-6
                    pt-4
                    border-t
                    border-slate-100
                    dark:border-slate-800/40
                  "
                >

                  {paper.pdfUrl ? (

                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                    >

                      <Button
                        variant="secondary"
                        icon={Download}
                        className="
                          w-full
                          text-xs
                          py-2
                        "
                      >
                        Download Questionnaire
                      </Button>

                    </a>

                  ) : (

                    <Button
                      variant="secondary"
                      disabled
                      className="
                        w-full
                        text-xs
                        py-2
                      "
                    >
                      No file attached
                    </Button>

                  )}

                </div>

              </Card>

            )
          )}


          {/* NO PAPERS */}

          {displayedPYQs.length === 0 && (

            <div
              className="
                col-span-full
                text-center
                py-16
              "
            >

              <FileText
                className="
                  w-10
                  h-10
                  text-slate-200
                  dark:text-slate-700
                  mx-auto
                  mb-3
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
                No papers found
              </p>


              <p
                className="
                  text-xs
                  text-slate-400
                  mt-1
                "
              >
                No papers are currently available for Class {schoolClass} {schoolSubject}.
              </p>

            </div>

          )}

        </div>

      )}

    </div>

  );

}
