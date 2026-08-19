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
  Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SCHOOL_SUBJECTS = [
  'Physics',
  'Chemistry',
  'Maths',
  'Biology'
];

const EXAM_OPTIONS = [
  {
    id: 'school',
    title: 'School Level',
    description: 'Class 11 & 12 school examination papers',
    icon: GraduationCap
  },
  {
    id: 'jee',
    title: 'JEE',
    description: 'JEE previous year question papers',
    icon: BookOpen
  },
  {
    id: 'neet',
    title: 'NEET',
    description: 'NEET previous year question papers',
    icon: BookOpen
  }
];

export default function PYQPage() {
  const { user } = useAuth();

  const [subjects, setSubjects] = useState([]);
  const [allPYQs, setAllPYQs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [papersLoading, setPapersLoading] = useState(false);

  // Main navigation
  const [section, setSection] = useState('');

  // School navigation
  const [schoolClass, setSchoolClass] = useState('');
  const [schoolSubject, setSchoolSubject] = useState('');

  // Competitive exam navigation
  const [competitiveExam, setCompetitiveExam] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');

  /*
   * Load subjects from your existing backend.
   */
  useEffect(() => {
    contentAPI
      .getSubjects()
      .then((res) => {
        setSubjects(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error loading subjects:', err);
        setLoading(false);
      });
  }, []);

  /*
   * Find a subject ID from the subject name.
   */
  const findSubjectId = (subjectName) => {
    if (!subjectName) return '';

    const found = subjects.find(
      (subject) =>
        String(subject.name || '').toLowerCase() ===
        subjectName.toLowerCase()
    );

    return found?._id || '';
  };

  /*
   * Load PYQs for one subject.
   */
  const loadSubjectPYQs = async (subjectName) => {
    const subjectId = findSubjectId(subjectName);

    if (!subjectId) {
      setAllPYQs([]);
      return;
    }

    try {
      setPapersLoading(true);

      const res = await contentAPI.getPYQs(subjectId);

      setAllPYQs(res.data || []);
    } catch (error) {
      console.error('Error loading PYQs:', error);
      setAllPYQs([]);
    } finally {
      setPapersLoading(false);
    }
  };

  /*
   * Load all PYQs.
   *
   * This is used for JEE and NEET because those sections
   * need to show papers from all subjects.
   */
  const loadCompetitivePYQs = async (examName) => {
    try {
      setPapersLoading(true);
      setAllPYQs([]);

      if (!subjects.length) {
        return;
      }

      const responses = await Promise.all(
        subjects.map((subject) =>
          contentAPI
            .getPYQs(subject._id)
            .then((res) => res.data || [])
            .catch(() => [])
        )
      );

      const combined = responses.flat();

      /*
       * Remove duplicate papers.
       */
      const uniquePapers = Array.from(
        new Map(
          combined.map((paper) => [paper._id, paper])
        ).values()
      );

      /*
       * Filter JEE / NEET papers.
       *
       * This checks examName and also exam fields
       * so it works with slightly different backend data.
       */
      const filtered = uniquePapers.filter((paper) => {
        const exam =
          paper.examName ||
          paper.exam ||
          paper.examType ||
          '';

        return String(exam).toLowerCase() ===
          examName.toLowerCase();
      });

      setAllPYQs(filtered);
    } catch (error) {
      console.error('Error loading competitive PYQs:', error);
      setAllPYQs([]);
    } finally {
      setPapersLoading(false);
    }
  };

  /*
   * When a school subject is selected,
   * load that subject's papers.
   */
  useEffect(() => {
    if (section === 'school' && schoolSubject) {
      loadSubjectPYQs(schoolSubject);
    }
  }, [schoolSubject, section, subjects]);

  /*
   * When JEE or NEET is selected,
   * load all papers and filter by exam.
   */
  useEffect(() => {
    if (section === 'jee') {
      setCompetitiveExam('JEE');
      loadCompetitivePYQs('JEE');
    }

    if (section === 'neet') {
      setCompetitiveExam('NEET');
      loadCompetitivePYQs('NEET');
    }
  }, [section, subjects]);

  /*
   * Get available years from loaded papers.
   */
  const availableYears = useMemo(() => {
    const years = allPYQs
      .map((paper) => paper.year)
      .filter((year) => year !== undefined && year !== null)
      .map((year) => String(year));

    return [...new Set(years)].sort((a, b) => Number(b) - Number(a));
  }, [allPYQs]);

  /*
   * Filter papers by:
   * - School class
   * - Year
   */
  const displayedPYQs = useMemo(() => {
    let papers = [...allPYQs];

    /*
     * School class filter.
     */
    if (section === 'school' && schoolClass) {
      papers = papers.filter((paper) => {
        const classValue =
          paper.classLevel ||
          paper.class ||
          paper.className ||
          paper.grade ||
          '';

        const normalizedClass = String(classValue)
          .toLowerCase()
          .replace(/\s+/g, '');

        const selectedClass = schoolClass
          .toLowerCase()
          .replace(/\s+/g, '');

        return (
          normalizedClass === selectedClass ||
          normalizedClass.includes(selectedClass)
        );
      });
    }

    /*
     * Year filter for JEE / NEET.
     */
    if (
      (section === 'jee' || section === 'neet') &&
      selectedYear !== 'all'
    ) {
      papers = papers.filter(
        (paper) => String(paper.year) === String(selectedYear)
      );
    }

    /*
     * Sort newest papers first.
     */
    papers.sort((a, b) => {
      return Number(b.year || 0) - Number(a.year || 0);
    });

    return papers;
  }, [
    allPYQs,
    section,
    schoolClass,
    selectedYear
  ]);

  /*
   * Reset everything and return to main PYQ menu.
   */
  const goHome = () => {
    setSection('');
    setSchoolClass('');
    setSchoolSubject('');
    setCompetitiveExam('');
    setSelectedYear('all');
    setAllPYQs([]);
  };

  /*
   * Go back one step.
   */
  const goBack = () => {
    if (section === 'school') {
      if (schoolSubject) {
        setSchoolSubject('');
        setAllPYQs([]);
        return;
      }

      if (schoolClass) {
        setSchoolClass('');
        return;
      }

      setSection('');
      return;
    }

    if (section === 'jee' || section === 'neet') {
      setSection('');
      setCompetitiveExam('');
      setSelectedYear('all');
      setAllPYQs([]);
    }
  };

  /*
   * Loading screen.
   */
  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  /*
   * MAIN PYQ MENU
   */
  if (!section) {
    return (
      <div className="space-y-8">

        {/* Header */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
              <FileText className="w-7 h-7" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                Past Year Papers (PYQs)
              </h1>

              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                Choose your examination category.
              </p>
            </div>
          </div>
        </div>

        {/* Three Sections */}
        <div className="grid md:grid-cols-3 gap-6">

          {EXAM_OPTIONS.map((option) => {
            const Icon = option.icon;

            return (
              <button
                key={option.id}
                onClick={() => {
                  setSection(option.id);
                  setSchoolClass('');
                  setSchoolSubject('');
                  setSelectedYear('all');
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
                <div className="flex items-center justify-between">

                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
                    <Icon className="w-7 h-7" />
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500 transition-colors" />
                </div>

                <h2 className="mt-6 text-lg font-bold text-slate-900 dark:text-white">
                  {option.title}
                </h2>

                <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
                  {option.description}
                </p>
              </button>
            );
          })}

        </div>

        {/* Teacher/Admin Upload */}
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <div className="flex justify-end">
            <Link
              to={
                user.role === 'teacher'
                  ? '/teacher'
                  : '/admin'
              }
            >
              <Button
                icon={PlusCircle}
                className="px-4 py-2.5 text-xs"
              >
                Upload Paper
              </Button>
            </Link>
          </div>
        )}

      </div>
    );
  }

  /*
   * SCHOOL CLASS SELECTION
   */
  if (
    section === 'school' &&
    !schoolClass
  ) {
    return (
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">

          <button
            onClick={goBack}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              School Level
            </h1>

            <p className="text-sm text-slate-400 mt-1">
              Select your class.
            </p>
          </div>
        </div>

        {/* Classes */}
        <div className="grid md:grid-cols-2 gap-6">

          {['11th', '12th'].map((className) => (
            <button
              key={className}
              onClick={() => setSchoolClass(className)}
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

              <div className="flex justify-between items-center">

                <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
                  <GraduationCap className="w-8 h-8" />
                </div>

                <ChevronRight className="w-6 h-6 text-slate-400 group-hover:text-primary-500" />

              </div>

              <h2 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">
                Class {className}
              </h2>

              <p className="text-sm text-slate-400 mt-2">
                View Class {className} previous year papers.
              </p>

            </button>
          ))}

        </div>

      </div>
    );
  }

  /*
   * SCHOOL SUBJECT SELECTION
   */
  if (
    section === 'school' &&
    schoolClass &&
    !schoolSubject
  ) {
    return (
      <div className="space-y-8">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-5">

          <button
            onClick={goBack}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Class {schoolClass}
            </h1>

            <p className="text-sm text-slate-400 mt-1">
              Select a subject.
            </p>
          </div>

        </div>

        {/* Subjects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          {SCHOOL_SUBJECTS.map((subject) => (
            <button
              key={subject}
              onClick={() => setSchoolSubject(subject)}
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

              <div className="flex justify-between items-center">

                <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
                  <BookOpen className="w-6 h-6" />
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-500" />

              </div>

              <h2 className="mt-5 font-bold text-slate-900 dark:text-white">
                {subject}
              </h2>

              <p className="text-xs text-slate-400 mt-2">
                Class {schoolClass} {subject} papers
              </p>

            </button>
          ))}

        </div>

      </div>
    );
  }

  /*
   * JEE / NEET PAGE
   */
  if (
    section === 'jee' ||
    section === 'neet'
  ) {
    return (
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">

          <div className="flex items-center gap-3">

            <button
              onClick={goBack}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" />
            </button>

            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
              <BookOpen className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {competitiveExam} Previous Year Papers
              </h1>

              <p className="text-xs text-slate-400 mt-1">
                Previous year {competitiveExam} question papers.
              </p>
            </div>

          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-2">

            <Calendar className="w-4 h-4 text-slate-400" />

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="
                px-4
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

              {availableYears.map((year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}

            </select>

          </div>

        </div>

        {/* Loading */}
        {papersLoading && (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          </div>
        )}

        {/* Papers */}
        {!papersLoading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {displayedPYQs.map((paper) => (
              <Card
                key={paper._id}
                className="hover:-translate-y-1 transition-all duration-200"
              >

                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 w-fit mb-4">
                  <FileText className="w-6 h-6" />
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                  {paper.title}
                </h3>

                {paper.chapter?.title && (
                  <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                    Chapter: {paper.chapter.title}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] text-slate-400">

                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Year {paper.year || 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    <span>
                      {paper.examName || competitiveExam}
                    </span>
                  </div>

                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40">

                  {paper.pdfUrl ? (
                    <a
                      href={paper.pdfUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button
                        variant="secondary"
                        icon={Download}
                        className="w-full text-xs py-2"
                      >
                        Download Questionnaire
                      </Button>
                    </a>
                  ) : (
                    <Button
                      variant="secondary"
                      disabled
                      className="w-full text-xs py-2"
                    >
                      No file attached
                    </Button>
                  )}

                </div>

              </Card>
            ))}

            {displayedPYQs.length === 0 && (
              <div className="col-span-full text-center py-16">

                <Search className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />

                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  No {competitiveExam} papers found
                </p>

                <p className="text-xs text-slate-400 mt-1">
                  Try selecting another year.
                </p>

              </div>
            )}

          </div>
        )}

      </div>
    );
  }

  /*
   * SCHOOL PAPERS
   */
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">

        <div className="flex items-center gap-3">

          <button
            onClick={goBack}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
          </button>

          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Class {schoolClass} {schoolSubject} PYQs
            </h1>

            <p className="text-xs text-slate-400 mt-1">
              Previous year school examination papers.
            </p>
          </div>

        </div>

        {/* Upload */}
        {(user?.role === 'teacher' || user?.role === 'admin') && (
          <Link
            to={
              user.role === 'teacher'
                ? '/teacher'
                : '/admin'
            }
          >
            <Button
              icon={PlusCircle}
              className="px-3.5 py-2.5 text-xs whitespace-nowrap"
            >
              Upload Paper
            </Button>
          </Link>
        )}

      </div>

      {/* Papers */}
      {papersLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {displayedPYQs.map((paper) => (
            <Card
              key={paper._id}
              className="hover:-translate-y-1 transition-all duration-200"
            >

              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 w-fit mb-4">
                <FileText className="w-6 h-6" />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                {paper.title}
              </h3>

              {paper.chapter?.title && (
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                  Chapter: {paper.chapter.title}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] text-slate-400">

                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    Year {paper.year || 'N/A'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>
                    {paper.examName || 'School'}
                  </span>
                </div>

              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40">

                {paper.pdfUrl ? (
                  <a
                    href={paper.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button
                      variant="secondary"
                      icon={Download}
                      className="w-full text-xs py-2"
                    >
                      Download Questionnaire
                    </Button>
                  </a>
                ) : (
                  <Button
                    variant="secondary"
                    disabled
                    className="w-full text-xs py-2"
                  >
                    No file attached
                  </Button>
                )}

              </div>

            </Card>
          ))}

          {displayedPYQs.length === 0 && (
            <div className="col-span-full text-center py-16">

              <FileText className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-3" />

              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                No papers found
              </p>

              <p className="text-xs text-slate-400 mt-1">
                No papers are currently available for Class {schoolClass} {schoolSubject}.
              </p>

            </div>
          )}

        </div>
      )}

    </div>
  );
}
