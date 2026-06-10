import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { testEmailConfiguration, updateSubmissionStatus, updateSubmissionNotes, deleteSubmission, handleFirestoreError, OperationType } from '../lib/store';
import { Submission, ProjectStatus } from '../types';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { 
  Search, LayoutDashboard, X, LogOut, Send,
  Download, CheckCircle2, Circle, MoreVertical,
  Briefcase, Mail, Phone, MapPin, Globe, Database, User, MessageCircle
} from 'lucide-react';

import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AdminDashboard() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedSub, setSelectedSub] = useState<Submission | null>(null);
  const [isTestEmailLoading, setIsTestEmailLoading] = useState(false);
  const [isTestEmailModalOpen, setIsTestEmailModalOpen] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState('');
  const [testEmailResult, setTestEmailResult] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setSubmissions([]);
      return;
    }

    const q = query(collection(db, 'submissions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const subs: Submission[] = [];
      snapshot.forEach(doc => {
        subs.push(doc.data() as Submission);
      });
      setSubmissions(subs);
      
      // Update selected sub context if it was updated
      setSelectedSub(prevSelected => {
        if (!prevSelected) return null;
        return subs.find(s => s.id === prevSelected.id) || null;
      });
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'submissions');
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      alert('Login failed');
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  const filtered = submissions.filter(sub => {
    const matchesSearch = sub.businessName?.toLowerCase().includes(search.toLowerCase()) || 
      sub.ownerName?.toLowerCase().includes(search.toLowerCase()) ||
      sub.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || sub.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (id: string, status: ProjectStatus) => {
    await updateSubmissionStatus(id, status);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(submissions, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `submissions_${format(new Date(), 'yyyy-MM-dd')}.json`);
    dlAnchorElem.click();
  };

  const openTestEmailModal = () => {
    setTestEmailInput(currentUser?.email || '');
    setTestEmailResult(null);
    setIsTestEmailModalOpen(true);
  };

  const executeTestEmail = async () => {
    if (!testEmailInput) return;
    setIsTestEmailLoading(true);
    setTestEmailResult(null);
    try {
      const result = await testEmailConfiguration(testEmailInput);
      console.log("EmailJS API Responses:", result);
      
      let message = 'Test emails sent successfully! Check the specified inbox and the admin inbox. Please check your SPAM/Junk folders as well.';
      if (result.adminResult?.status === 200 || result.clientResult?.status === 200) {
        message += ' (API confirmed OK)';
      }
      setTestEmailResult({ type: 'success', message });
    } catch (e: any) {
      console.error(e);
      setTestEmailResult({ type: 'error', message: `Failed to send test emails: ${e.message}` });
    } finally {
      setIsTestEmailLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-white">
          <Database className="w-12 h-12 text-indigo-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-2">Admin Dashboard</h2>
          <p className="text-zinc-400 mb-8">Sign in with your Google account to access client submissions.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-white text-black py-3 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  if (currentUser.email !== 'nixxal54@gmail.com') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center text-white">
          <X className="w-12 h-12 text-red-500 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
          <p className="text-zinc-400 mb-8">Your account ({currentUser.email}) does not have admin permissions to view this dashboard.</p>
          <button 
            onClick={handleLogout}
            className="w-full bg-white text-black py-3 rounded-xl font-medium hover:bg-zinc-200 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 bg-zinc-950 fixed left-0 top-0 bottom-0 z-10 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-zinc-800/50">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-indigo-500" />
            Agency Core
          </h2>
        </div>
        <nav className="p-4 space-y-1 flex-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 bg-white/5 text-white rounded-lg text-sm font-medium">
            <Database className="w-4 h-4" /> Submissions
          </button>
        </nav>
        <div className="p-4 border-t border-zinc-800/50 flex items-center justify-between">
          <div className="text-xs text-zinc-400 truncate pr-2">
            Logged in as <br/>
            <span className="text-white font-medium truncate inline-block w-full">{currentUser.email}</span>
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-zinc-800 rounded-xl transition-colors shrink-0 text-zinc-400 hover:text-white" title="Log out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800 px-6 py-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Project Leads ({submissions.length})</h1>
            <p className="text-zinc-400 text-sm">Manage new client requirements requests.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search clients..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <button 
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              <Download className="w-4 h-4" /> 
              <span className="hidden sm:inline">Export</span>
            </button>
            <button 
              onClick={openTestEmailModal}
              disabled={isTestEmailLoading}
              className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-sm font-medium hover:bg-indigo-500/20 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" /> 
              <span className="hidden sm:inline">{isTestEmailLoading ? 'Sending...' : 'Test Email'}</span>
            </button>
          </div>
        </header>

        <div className="p-6 flex-1 bg-zinc-950">
          {submissions.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-500 border border-dashed border-zinc-800 rounded-2xl">
              <Database className="w-8 h-8 mb-3 opacity-50" />
              <p>No submissions found.</p>
              <p className="text-sm">Share the form to get started.</p>
            </div>
          ) : (
            <div className="grid gap-4 custom-grid">
              {filtered.map(sub => (
                <div 
                  key={sub.id} 
                  onClick={() => setSelectedSub(sub)}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 cursor-pointer hover:border-zinc-700 hover:bg-zinc-800/50 transition-all group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-3 items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                        {sub.businessName?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <h3 className="font-medium text-white group-hover:text-indigo-400 transition-colors">{sub.businessName || 'Unnamed Business'}</h3>
                        <p className="text-xs text-zinc-400">{sub.ownerName} • {formatDistanceToNow(new Date(sub.createdAt))} ago</p>
                      </div>
                    </div>
                    <StatusBadge status={sub.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Globe className="w-4 h-4 text-zinc-500" />
                      <span className="truncate">{sub.websiteType}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Briefcase className="w-4 h-4 text-zinc-500" />
                      <span className="truncate">{sub.designStyle}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Detail Overlay */}
      <AnimatePresence>
        {selectedSub && (
          <SubmissionDetail 
            sub={selectedSub} 
            onClose={() => setSelectedSub(null)} 
            onStatusChange={handleStatusChange}
            onUpdateNotes={updateSubmissionNotes}
            onDelete={async (id) => {
              await deleteSubmission(id);
              setSelectedSub(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Test Email Overlay */}
      <AnimatePresence>
        {isTestEmailModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsTestEmailModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Send Test Email</h2>
                <button onClick={() => setIsTestEmailModalOpen(false)} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Client Email Address</label>
                <input 
                  type="email" 
                  value={testEmailInput} 
                  onChange={e => setTestEmailInput(e.target.value)} 
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  placeholder="name@example.com"
                />
                <p className="text-xs text-zinc-500 mt-2">This will send an email to the provided address (simulating a client) and to the admin ({currentUser?.email}) simulating an alert.</p>
              </div>

              {testEmailResult && (
                <div className={`p-3 rounded-lg text-sm mb-4 ${testEmailResult.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {testEmailResult.message}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button 
                  onClick={() => setIsTestEmailModalOpen(false)} 
                  className="px-4 py-2 bg-zinc-900 text-zinc-300 text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeTestEmail}
                  disabled={isTestEmailLoading || !testEmailInput}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  {isTestEmailLoading ? 'Sending...' : 'Send Test Emails'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-grid {
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        }
      `}</style>
    </div>
  );
}

function StatusBadge({ status }: { status: ProjectStatus }) {
  if (status === 'New') return <span className="px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">New</span>;
  if (status === 'In Progress') return <span className="px-2.5 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">In Progress</span>;
  return <span className="px-2.5 py-1 text-xs font-medium bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">Completed</span>;
}

function SubmissionDetail({ 
  sub, 
  onClose, 
  onStatusChange,
  onUpdateNotes,
  onDelete
}: { 
  sub: Submission, 
  onClose: () => void, 
  onStatusChange: (id: string, s: ProjectStatus) => void,
  onUpdateNotes: (id: string, notes: string) => Promise<void>,
  onDelete: (id: string) => Promise<void>
}) {
  const [adminNotes, setAdminNotes] = useState(sub.adminNotes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await onUpdateNotes(sub.id, adminNotes);
    setIsSavingNotes(false);
  };
  
  const handleDownloadHTML = () => {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${sub.businessName} - Preferences</title>
        <style>
          body { font-family: sans-serif; padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6; color: #111827; }
          .section { margin-bottom: 2rem; padding: 1.5rem; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb; }
          h1 { color: #111827; margin-bottom: 0.5rem; }
          h2 { margin-top: 0; color: #374151; font-size: 1.25rem; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem; margin-bottom: 1rem; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
          .col-span-2 { grid-column: span 2; }
          .label { font-weight: 600; color: #6b7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.25rem; }
          .value { color: #111827; font-size: 0.95rem; white-space: pre-wrap; }
          img { max-width: 250px; flex-shrink: 0; border-radius: 8px; border: 1px solid #e5e7eb; padding: 0.5rem; background: white; }
          .meta { color: #6b7280; font-size: 0.875rem; margin-bottom: 2rem; }
        </style>
      </head>
      <body>
        <h1>${sub.businessName || 'Unnamed Business'} - Website Requirements</h1>
        <div class="meta">Submitted on: ${new Date(sub.createdAt).toLocaleString()}</div>
        
        <div class="section">
          <h2>Contact Information</h2>
          <div class="grid">
            <div><div class="label">Owner Name</div><div class="value">${sub.ownerName || 'N/A'}</div></div>
            <div><div class="label">Email</div><div class="value">${sub.email || 'N/A'}</div></div>
            <div><div class="label">Phone</div><div class="value">${sub.phone || 'N/A'}</div></div>
            <div><div class="label">WhatsApp</div><div class="value">${sub.whatsapp || 'N/A'}</div></div>
            <div class="col-span-2"><div class="label">Address</div><div class="value">${sub.address || 'N/A'}</div></div>
          </div>
        </div>

        <div class="section">
          <h2>Project Requirements</h2>
          <div class="grid">
            <div><div class="label">Website Type</div><div class="value">${sub.websiteType}</div></div>
            <div>
              <div class="label">Integrations & Features</div>
              <div class="value">
                ${sub.onlineOrdering ? '• E-Commerce / Online Ordering<br>' : ''}
                ${sub.whatsappIntegration ? '• WhatsApp Chat Integration<br>' : ''}
                ${sub.googleMaps ? '• Google Maps Embed<br>' : ''}
                ${!sub.onlineOrdering && !sub.whatsappIntegration && !sub.googleMaps ? 'None specified' : ''}
              </div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Design Preferences</h2>
          <div class="grid">
            <div><div class="label">Preferred Style</div><div class="value">${sub.designStyle}</div></div>
            <div><div class="label">Preferred Colors</div><div class="value">${sub.colors || 'None specified'}</div></div>
            <div class="col-span-2"><div class="label">Example Links (Inspiration)</div><div class="value"><a href="${sub.exampleLinks}" target="_blank" style="color: #4f46e5;">${sub.exampleLinks || 'None provided'}</a></div></div>
            <div class="col-span-2"><div class="label">Design Notes</div><div class="value">${sub.designNotes || 'None'}</div></div>
          </div>
        </div>

         <div class="section">
          <h2>Branding & Content</h2>
          <div class="grid">
            <div class="col-span-2"><div class="label">Tagline</div><div class="value">${sub.tagline || 'None'}</div></div>
            <div class="col-span-2"><div class="label">About the Business & Mission</div><div class="value">${sub.aboutBusiness || sub.brandDescription || 'None'}</div></div>
            <div class="col-span-2"><div class="label">Services / Products Offered</div><div class="value">${sub.services || 'None'}</div></div>
            <div><div class="label">Working Hours</div><div class="value">${sub.workingHours || 'None'}</div></div>
            <div><div class="label">Social Media Links</div><div class="value">${sub.socialMedia || 'None'}</div></div>
            ${sub.logo ? `<div class="col-span-2"><div class="label">Uploaded Logo</div><img src="${sub.logo}" alt="Logo" /></div>` : ''}
          </div>
        </div>

        <div class="section">
          <h2>Additional Details</h2>
          <div class="grid">
             <div class="col-span-2"><div class="label">Special Features Required</div><div class="value">${sub.specialFeatures || 'None'}</div></div>
             <div class="col-span-2"><div class="label">Extra Notes / Questions</div><div class="value">${sub.extraNotes || 'None'}</div></div>
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${sub.businessName || 'submission'}_requirements.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-3">
              {sub.businessName}
              <StatusBadge status={sub.status} />
            </h2>
            <p className="text-xs text-zinc-400 mt-1">Submitted on {format(new Date(sub.createdAt), 'PPpp')}</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleDownloadHTML}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" /> HTML
            </button>
            <select 
              value={sub.status} 
              onChange={e => onStatusChange(sub.id, e.target.value as ProjectStatus)}
              className="bg-zinc-900 border border-zinc-700 rounded-lg text-sm px-3 py-1.5 focus:outline-none cursor-pointer"
            >
              <option value="New">Mark New</option>
              <option value="In Progress">Mark In Progress</option>
              <option value="Completed">Mark Completed</option>
            </select>
            {isConfirmingDelete ? (
              <div className="flex items-center gap-2">
                <button onClick={() => onDelete(sub.id)} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg">Confirm</button>
                <button onClick={() => setIsConfirmingDelete(false)} className="px-3 py-1.5 bg-zinc-800 text-sm font-medium rounded-lg">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setIsConfirmingDelete(true)} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-sm font-medium rounded-lg transition-colors">
                Delete
              </button>
            )}
            <button onClick={onClose} className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid md:grid-cols-3 gap-8">
            
            {/* Left Col - Info */}
            <div className="space-y-6 md:col-span-1">
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Contact</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3"><User className="w-4 h-4 text-zinc-400 shrink-0"/> <span>{sub.ownerName || 'N/A'}</span></div>
                  <div className="flex gap-3"><Mail className="w-4 h-4 text-zinc-400 shrink-0"/> <a href={`mailto:${sub.email}`} className="hover:text-white transition-colors">{sub.email || 'N/A'}</a></div>
                  <div className="flex gap-3"><Phone className="w-4 h-4 text-zinc-400 shrink-0"/> <span>{sub.phone || 'N/A'}</span></div>
                  {sub.whatsapp && <div className="flex gap-3"><MessageCircle className="w-4 h-4 text-emerald-500 shrink-0"/> <span>{sub.whatsapp}</span></div>}
                  <div className="flex gap-3"><MapPin className="w-4 h-4 text-zinc-400 shrink-0"/> <span className="text-zinc-300">{sub.address || 'N/A'}</span></div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Requirements</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-zinc-400 block text-xs">Website Type</span>
                    <span className="font-medium">{sub.websiteType}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {sub.onlineOrdering && <span className="px-2 py-1 bg-zinc-800 rounded text-xs">E-Commerce</span>}
                    {sub.whatsappIntegration && <span className="px-2 py-1 bg-zinc-800 rounded text-xs">WhatsApp Chat</span>}
                    {sub.googleMaps && <span className="px-2 py-1 bg-zinc-800 rounded text-xs">Google Maps</span>}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2">Design Prefs</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-zinc-400 block text-xs">Style</span>
                    <span className="font-medium">{sub.designStyle}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400 block text-xs">Colors</span>
                    <span>{sub.colors || 'None specified'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col - Details */}
            <div className="space-y-6 md:col-span-2">
              
              {sub.logo && (
                <div>
                   <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-4 border-b border-zinc-800 pb-2 flex justify-between items-center">
                     Logo
                     <a href={sub.logo} download={`${sub.businessName || 'logo'}_logo`} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                       <Download className="w-3 h-3" /> Download
                     </a>
                   </h3>
                   <div className="w-32 h-32 bg-white/5 rounded-lg border border-zinc-800 flex items-center justify-center overflow-hidden p-2">
                     <img src={sub.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                   </div>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-6">
                 <div>
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">About & Mission</h3>
                    <div className="bg-zinc-900 rounded-xl p-4 text-sm text-zinc-300 min-h-[100px] border border-zinc-800/50">
                      {sub.aboutBusiness || sub.brandDescription || 'Not provided'}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Services / Products</h3>
                    <div className="bg-zinc-900 rounded-xl p-4 text-sm text-zinc-300 min-h-[100px] border border-zinc-800/50 whitespace-pre-wrap">
                      {sub.services || 'Not provided'}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Working Hours</h3>
                    <div className="bg-zinc-900 rounded-xl p-4 text-sm text-zinc-300 min-h-[100px] border border-zinc-800/50 whitespace-pre-wrap">
                      {sub.workingHours || 'Not provided'}
                    </div>
                 </div>
                 <div>
                    <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Social Media</h3>
                    <div className="bg-zinc-900 rounded-xl p-4 text-sm text-zinc-300 min-h-[100px] border border-zinc-800/50 whitespace-pre-wrap">
                      {sub.socialMedia || 'Not provided'}
                    </div>
                 </div>
              </div>

              {sub.tagline && (
                <div>
                  <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Tagline</h3>
                  <div className="bg-zinc-900 rounded-xl p-4 text-sm text-zinc-300 border border-zinc-800/50">
                    {sub.tagline}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Reference Links</h3>
                <div className="bg-zinc-900 rounded-xl p-4 text-sm text-blue-400 font-medium whitespace-pre-wrap break-all border border-zinc-800/50">
                  {sub.exampleLinks || 'No reference links'}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Special Notes & Features</h3>
                <div className="bg-zinc-900 rounded-xl p-4 text-sm text-zinc-300 whitespace-pre-wrap border border-zinc-800/50">
                  {sub.specialFeatures && <div className="mb-4"><strong>Features:</strong><br/>{sub.specialFeatures}</div>}
                  {sub.extraNotes && <div><strong>Notes:</strong><br/>{sub.extraNotes}</div>}
                  {sub.designNotes && <div><strong>Design Notes:</strong><br/>{sub.designNotes}</div>}
                  {(!sub.specialFeatures && !sub.extraNotes && !sub.designNotes) && 'No additional notes provided.'}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">Internal Admin Notes</h3>
                <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800/50">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add private notes for this project lead..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[100px] mb-3 text-zinc-200"
                  />
                  <div className="flex justify-end">
                     <button 
                       onClick={handleSaveNotes}
                       disabled={isSavingNotes || adminNotes === (sub.adminNotes || '')}
                       className="px-4 py-2 bg-indigo-500 disabled:opacity-50 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors"
                     >
                       {isSavingNotes ? 'Saving...' : 'Save Notes'}
                     </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
