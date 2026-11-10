import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { SupportIssue, IssueCategory } from '../../types';
import {
  getLocalSupportIssues,
  syncSupportIssuesFromFirebase,
  submitSupportIssue as firestoreSubmitIssue,
  replySupportIssue as firestoreReplyIssue,
  subscribeToSupportIssues,
} from '../../services/firebase/firestoreService';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  FileWarning,
  MessageSquareText,
  Send,
  X,
} from 'lucide-react';

const ISSUE_CATEGORIES: IssueCategory[] = [
  'Login or Account',
  'Event Submission',
  'Certificate or Approval',
  'Profile Update',
  'Document Upload',
  'Other',
];

export const SupportIssuesView: React.FC = () => {
  const { currentUser } = useAuth();
  const [issues, setIssues] = useState<SupportIssue[]>(getLocalSupportIssues);
  const [category, setCategory] = useState<IssueCategory>('Login or Account');
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);

  useEffect(() => {
    void syncSupportIssuesFromFirebase().then(setIssues);
    const unsubscribe = subscribeToSupportIssues(setIssues);
    return () => unsubscribe();
  }, []);

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'MASTER_ADMIN';
  const visibleIssues = isAdmin
    ? issues
    : issues.filter(issue => issue.authorId === currentUser.uid || (
      !issue.authorId && issue.author === currentUser.displayName
    ));
  const selectedIssue = issues.find(issue => issue.id === selectedIssueId) || null;

  const submitIssue = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;

    const newIssue = await firestoreSubmitIssue({
      author: currentUser.displayName,
      authorId: currentUser.uid,
      role: currentUser.role,
      category,
      message: message.trim(),
    });

    setIssues(current => [newIssue, ...current]);
    setMessage('');
  };

  const sendReply = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedIssue || !reply.trim()) return;

    await firestoreReplyIssue(selectedIssue.id, reply.trim(), currentUser.displayName || 'Administrator');
    setIssues(current => current.map(issue => issue.id === selectedIssue.id
      ? { ...issue, reply: reply.trim(), repliedAt: new Date().toISOString(), repliedBy: currentUser.displayName }
      : issue
    ));
    setReply('');
    setSelectedIssueId(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <section className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertCircle size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              {isAdmin ? 'Requests & Issues' : 'Facing an Issue?'}
            </h1>
            <p className="text-xs text-slate-500">
              {isAdmin
                ? 'Select a request card to review it and send a reply.'
                : 'Choose the issue type, add your comments, and submit a request to the Master Admin.'}
            </p>
          </div>
        </div>

        {!isAdmin && (
          <form onSubmit={submitIssue} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                What type of issue are you facing? <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={event => setCategory(event.target.value as IssueCategory)}
                className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {ISSUE_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Comments <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={message}
                onChange={event => setMessage(event.target.value)}
                required
                rows={4}
                placeholder="Explain what happened or what help you need..."
                className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <button className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-2">
              <Send size={14} /> Submit Request
            </button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-900">
            {isAdmin ? 'Submitted Requests' : 'My Requests'}
          </h2>
          <span className="text-xs font-bold text-slate-400">{visibleIssues.length} request{visibleIssues.length === 1 ? '' : 's'}</span>
        </div>
        {visibleIssues.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            No issue requests submitted yet.
          </div>
        )}
        {visibleIssues.map(issue => (
          <button
            key={issue.id}
            type="button"
            onClick={() => isAdmin && setSelectedIssueId(issue.id)}
            className={`w-full text-left bg-white rounded-2xl border p-4 transition-colors ${
              isAdmin ? 'hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer' : ''
            } ${issue.reply ? 'border-emerald-200' : 'border-slate-200'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                issue.reply ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'
              }`}>
                {issue.reply ? <CheckCircle2 size={17} /> : <FileWarning size={17} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">{issue.category}</span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {issue.author} ({issue.role})
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{issue.message}</p>
                {issue.reply && (
                  <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                    <span className="font-bold">Admin reply:</span> {issue.reply}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-slate-400">{new Date(issue.createdAt).toLocaleString()}</span>
                {isAdmin && <ChevronRight size={17} className="text-slate-400" />}
              </div>
            </div>
          </button>
        ))}
      </section>

      {isAdmin && selectedIssue && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 p-4 flex items-center justify-center">
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-blue-600">Issue Request</p>
                <h2 className="mt-1 text-xl font-black text-slate-900">{selectedIssue.category}</h2>
                <p className="mt-1 text-xs text-slate-500">{selectedIssue.author} ({selectedIssue.role})</p>
              </div>
              <button type="button" onClick={() => setSelectedIssueId(null)} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <div className="mt-5 rounded-2xl bg-slate-50 border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student comments</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{selectedIssue.message}</p>
            </div>
            <form onSubmit={sendReply} className="mt-5 space-y-3">
              <label className="block text-xs font-bold text-slate-700">Reply to student</label>
              <textarea
                value={reply}
                onChange={event => setReply(event.target.value)}
                required
                rows={4}
                placeholder="Type a clear response or resolution..."
                className="w-full px-3.5 py-3 text-sm bg-slate-50 border border-slate-300 rounded-xl resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setSelectedIssueId(null)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2">
                  <MessageSquareText size={14} /> Send Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
