import React, { useEffect, useState } from 'react';
import { contentAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { FileText, Download, Calendar, Tag, PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PYQPage() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [pyqs, setPyqs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentAPI.getSubjects().then((res) => {
      setSubjects(res.data || []);
      if (res.data?.length > 0) {
        setSelectedSubject(res.data[0]._id);
      }
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      contentAPI.getPYQs(selectedSubject).then((res) => {
        setPyqs(res.data || []);
      }).catch(err => console.error(err));
    }
  }, [selectedSubject]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-500" />
            Past Year Papers (PYQs)
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Study official boards and competitive exam questionnaires.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Subject Filter */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full md:w-48 px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-primary-500"
          >
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>

          {/* Quick link for Teachers to upload */}
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <Link to={user.role === 'teacher' ? '/teacher' : '/admin'}>
              <Button icon={PlusCircle} className="px-3.5 py-2.5 text-xs whitespace-nowrap">Upload Paper</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Grid of PYQs */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pyqs.map((paper) => (
          <Card key={paper._id} className="hover:-translate-y-1 transition-all duration-200">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 w-fit mb-4">
              <FileText className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 truncate">{paper.title}</h3>
            
            {paper.chapter?.title && (
              <p className="text-[10px] text-slate-400 mt-1 font-semibold">Chapter: {paper.chapter.title}</p>
            )}

            <div className="flex flex-wrap items-center gap-3 mt-4 text-[10px] text-slate-400">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-350" />
                <span>Year {paper.year}</span>
              </div>
              <div className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-350" />
                <span>{paper.examName}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40">
              {paper.pdfUrl ? (
                <a href={paper.pdfUrl} target="_blank" rel="noreferrer">
                  <Button variant="secondary" icon={Download} className="w-full text-xs py-2">
                    Download Questionnaire
                  </Button>
                </a>
              ) : (
                <Button variant="secondary" disabled className="w-full text-xs py-2">
                  No file attached
                </Button>
              )}
            </div>
          </Card>
        ))}

        {pyqs.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="w-10 h-10 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">No PYQ Papers Found</p>
            <p className="text-xs text-slate-400 mt-1">Check back later for uploaded papers in this subject stream.</p>
          </div>
        )}
      </div>
    </div>
  );
}
