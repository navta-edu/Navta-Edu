import React, { useEffect, useState } from 'react';
import { contentAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { BookOpen, Download, User, Info, FileText } from 'lucide-react';

export default function NotesPage() {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState('');
  const [notes, setNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch subjects on mount
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

  // Fetch chapters when subject changes
  useEffect(() => {
    if (selectedSubject) {
      contentAPI.getChapters(selectedSubject).then((res) => {
        setChapters(res.data || []);
        if (res.data?.length > 0) {
          setSelectedChapter(res.data[0]._id);
        } else {
          setChapters([]);
          setSelectedChapter('');
          setNotes([]);
          setSelectedNote(null);
        }
      });
    }
  }, [selectedSubject]);

  // Fetch notes when chapter changes
  useEffect(() => {
    if (selectedChapter) {
      contentAPI.getNotes(selectedChapter).then((res) => {
        setNotes(res.data || []);
        if (res.data?.length > 0) {
          setSelectedNote(res.data[0]);
        } else {
          setNotes([]);
          setSelectedNote(null);
        }
      });
    } else {
      setNotes([]);
      setSelectedNote(null);
    }
  }, [selectedChapter]);

  const renderNoteContent = (content) => {
    if (!content) return '';
    // Format basic headers and bullets
    return content.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h3 key={idx} className="text-base font-bold text-slate-900 dark:text-white mt-4 mb-2">{line.replace('### ', '')}</h3>;
      }
      if (line.startsWith('## ')) {
        return <h2 key={idx} className="text-lg font-bold text-slate-900 dark:text-white mt-5 mb-2">{line.replace('## ', '')}</h2>;
      }
      if (line.startsWith('* ') || line.startsWith('- ')) {
        return <li key={idx} className="ml-4 list-disc text-sm text-slate-600 dark:text-slate-400 my-1">{line.substring(2)}</li>;
      }
      if (line.match(/^\d+\.\s/)) {
        return <li key={idx} className="ml-4 list-decimal text-sm text-slate-600 dark:text-slate-400 my-1">{line.replace(/^\d+\.\s/, '')}</li>;
      }
      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed my-2">{line}</p>;
    });
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary-500" />
            Study Notes Library
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Access chapter summaries, equation cards, and downloads.
          </p>
        </div>

        {/* Subject Select */}
        <div className="w-full md:w-56">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:border-primary-500"
          >
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Study Note Layout */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Chapters Column */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">Chapters</h3>
          <div className="space-y-1 bg-white/50 dark:bg-slate-900/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/40">
            {chapters.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedChapter(c._id)}
                className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-all ${
                  selectedChapter === c._id
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Ch {c.chapterNumber}: {c.title}
              </button>
            ))}
            {chapters.length === 0 && (
              <p className="text-xs text-center text-slate-400 dark:text-slate-550 py-6">No chapters indexed yet.</p>
            )}
          </div>

          {notes.length > 0 && (
            <>
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1 mt-4">Notes List</h3>
              <div className="space-y-1 bg-white/50 dark:bg-slate-900/30 p-2 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                {notes.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => setSelectedNote(n)}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-semibold whitespace-nowrap overflow-hidden text-ellipsis transition-all flex items-center gap-2 ${
                      selectedNote?._id === n._id
                        ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400 border-l-4 border-primary-500'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" />
                    <span>{n.title}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Note Reader Panel */}
        <div className="lg:col-span-3">
          {selectedNote ? (
            <Card
              className="min-h-[500px]"
              title={selectedNote.title}
              subtitle={selectedNote.chapter?.title ? `Chapter: ${selectedNote.chapter.title}` : ''}
              action={
                selectedNote.pdfUrl && (
                  <a href={selectedNote.pdfUrl} target="_blank" rel="noreferrer">
                    <Button variant="secondary" className="px-3.5 py-2 text-xs" icon={Download}>
                      Download PDF
                    </Button>
                  </a>
                )
              }
            >
              <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-6 bg-slate-50 dark:bg-slate-800/20 w-fit px-3 py-1 rounded-full border border-slate-100 dark:border-slate-800/40">
                <User className="w-3 h-3" />
                <span>Uploaded by {selectedNote.uploadedBy?.name || 'Educator'}</span>
              </div>

              {/* Study notes details container */}
              <div className="border-t border-slate-100 dark:border-slate-800/40 pt-4">
                {renderNoteContent(selectedNote.content)}
              </div>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-6 bg-white/20 dark:bg-slate-900/10">
              <Info className="w-10 h-10 text-slate-300 dark:text-slate-650 mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">No Notes Selected</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Select a chapter and a note card from the sidebar checklist.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
