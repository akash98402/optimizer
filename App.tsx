
import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, SortField, Page, User, AppSettings, TaskCategory } from './types';
import { calculateStressAnalysis, getPriorityLevel, DEFAULT_SETTINGS, calculatePriorityScore } from './engine';
import TaskForm from './components/TaskForm';
import StressChart from './components/StressChart';
import { exportTasksToPDF } from './services/pdfService';

// --- Icons (Basic SVGs) ---
const DashboardIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>;
const TasksIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>;
const FinishedIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>;
const PlannerIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>;
const AnalyticsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>;
const ReportsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>;
const SettingsIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>;
const LogoutIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;

const App: React.FC = () => {
  const [user, setUser] = useState<User>(() => {
    const saved = localStorage.getItem('academic_user');
    return saved ? JSON.parse(saved) : { email: '', isLoggedIn: false };
  });

  const [currentPage, setCurrentPage] = useState<Page>(user.isLoggedIn ? 'dashboard' : 'login');
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('academic_optimizer_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('academic_optimizer_settings');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [sortBy, setSortBy] = useState<SortField>('priority');
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMsg, setAuthMsg] = useState<{ text: string, type: 'success' | 'error' | null }>({ text: '', type: null });

  useEffect(() => {
    localStorage.setItem('academic_optimizer_tasks', JSON.stringify(tasks));
    localStorage.setItem('academic_optimizer_settings', JSON.stringify(settings));
    localStorage.setItem('academic_user', JSON.stringify(user));
  }, [tasks, settings, user]);

  const handleLogout = () => {
    setUser({ email: '', isLoggedIn: false });
    setCurrentPage('login');
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const existingUsers = JSON.parse(localStorage.getItem('registered_users') || '[]');
    const userFound = existingUsers.find((u: any) => u.email === authEmail);

    if (userFound) {
      if (userFound.password === authPassword) {
        setUser({ email: authEmail, isLoggedIn: true });
        setAuthMsg({ text: 'Login successful!', type: 'success' });
        setTimeout(() => setCurrentPage('dashboard'), 800);
      } else {
        setAuthMsg({ text: 'Wrong password!', type: 'error' });
      }
    } else {
      const newUser = { email: authEmail, password: authPassword };
      localStorage.setItem('registered_users', JSON.stringify([...existingUsers, newUser]));
      setUser({ email: authEmail, isLoggedIn: true });
      setAuthMsg({ text: 'Account created successfully!', type: 'success' });
      setTimeout(() => setCurrentPage('dashboard'), 800);
    }
  };

  const saveTask = (task: Task) => {
    const priorityScore = calculatePriorityScore(task, settings);
    const taskWithScore = { ...task, priorityScore };
    
    if (editingTask) {
      setTasks(tasks.map(t => t.id === task.id ? taskWithScore : t));
    } else {
      setTasks([...tasks, taskWithScore]);
    }
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const filteredTasks = useMemo(() => {
    return tasks
      .filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = currentPage === 'finished' ? t.status === TaskStatus.COMPLETED : (filterStatus === 'all' || t.status === filterStatus);
        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') return b.priorityScore - a.priorityScore;
        if (sortBy === 'deadline') return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        if (sortBy === 'effort') return b.effortHours - a.effortHours;
        return 0;
      });
  }, [tasks, searchQuery, filterStatus, sortBy, currentPage]);

  const stressData = useMemo(() => calculateStressAnalysis(tasks, 14, settings.stressWindowDays), [tasks, settings.stressWindowDays]);

  const exportCSV = () => {
    const header = "Title,Category,Deadline,Effort,Weight,Score,Status\n";
    const rows = tasks.map(t => `"${t.title}","${t.category}","${t.deadline}",${t.effortHours},${t.academicWeight},${t.priorityScore},"${t.status}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academic-workflow-${new Date().toLocaleDateString()}.csv`;
    a.click();
  };

  if (currentPage === 'login') {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-3xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-8">
            <span className="text-5xl mb-3 block">🎓</span>
            <h2 className="text-3xl font-black text-[#111827]">Workflow Auth</h2>
            <p className="text-gray-500 text-sm mt-2">Sign in or create your account to optimize your studies.</p>
          </div>
          <form onSubmit={handleAuthSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                required 
                value={authEmail}
                onChange={e => setAuthEmail(e.target.value)}
                className="w-full bg-white text-black placeholder-gray-400 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="you@university.edu" 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-500 mb-1.5 uppercase tracking-widest">Password</label>
              <input 
                type="password" 
                required 
                value={authPassword}
                onChange={e => setAuthPassword(e.target.value)}
                className="w-full bg-white text-black placeholder-gray-400 border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="••••••••" 
              />
            </div>
            {authMsg.text && (
              <p className={`text-sm font-bold text-center ${authMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {authMsg.text}
              </p>
            )}
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 uppercase tracking-widest">
              Continue
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-gray-50 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest leading-relaxed">
              New email? Register automatically.<br/>Existing email? Log in directly.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FB]">
      <aside className="w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col fixed h-full z-20">
        <div className="p-8 border-b border-gray-100">
          <h1 className="text-xl font-black text-blue-600 flex items-center gap-2">
            <span className="text-2xl">📚</span> OPTIMIZER
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
            { id: 'tasks', label: 'Tasks', icon: <TasksIcon /> },
            { id: 'finished', label: 'Finished Tasks', icon: <FinishedIcon /> },
            { id: 'planner', label: 'Planner', icon: <PlannerIcon /> },
            { id: 'analytics', label: 'Analytics', icon: <AnalyticsIcon /> },
            { id: 'reports', label: 'Reports', icon: <ReportsIcon /> },
            { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id as Page)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold transition-all uppercase tracking-wide text-xs ${
                currentPage === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-bold uppercase tracking-wide text-xs transition-all">
            <LogoutIcon /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 p-4 lg:p-10 min-h-screen">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-black text-[#111827] capitalize tracking-tight">{currentPage.replace('_', ' ')}</h2>
            <p className="text-gray-500 font-medium">Student session: <span className="text-blue-600 font-bold">{user.email}</span></p>
          </div>
          <div className="flex gap-3">
            {currentPage === 'tasks' && (
              <button onClick={() => { setEditingTask(null); setIsFormOpen(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-95 transition-all uppercase text-xs tracking-widest">
                <span>+</span> Add Task
              </button>
            )}
            {currentPage === 'reports' && (
              <>
                <button onClick={exportCSV} className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-gray-50 transition-all uppercase text-xs tracking-widest">
                  CSV
                </button>
                <button onClick={() => exportTasksToPDF(tasks)} className="bg-red-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-red-100 hover:bg-red-700 transition-all uppercase text-xs tracking-widest">
                  PDF
                </button>
              </>
            )}
          </div>
        </header>

        {currentPage === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <button 
                onClick={() => { setCurrentPage('tasks'); setFilterStatus('all'); }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left hover:border-blue-300 hover:shadow-md transition-all active:scale-95"
              >
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Tasks</p>
                <h3 className="text-3xl font-black">{tasks.length}</h3>
              </button>
              <button 
                onClick={() => { setCurrentPage('tasks'); setFilterStatus(TaskStatus.PENDING); }}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left hover:border-blue-300 hover:shadow-md transition-all active:scale-95"
              >
                <p className="text-blue-500 text-[10px] font-black uppercase tracking-widest mb-1">Pending</p>
                <h3 className="text-3xl font-black text-blue-600">{tasks.filter(t => t.status === 'pending').length}</h3>
              </button>
              <button 
                onClick={() => setCurrentPage('analytics')}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left hover:border-red-300 hover:shadow-md transition-all active:scale-95"
              >
                <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mb-1">High Stress</p>
                <h3 className="text-3xl font-black text-red-600">{tasks.filter(t => t.priorityScore > 0.7).length}</h3>
              </button>
              <button 
                onClick={() => setCurrentPage('finished')}
                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm text-left hover:border-green-300 hover:shadow-md transition-all active:scale-95"
              >
                <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mb-1">Achieved</p>
                <h3 className="text-3xl font-black text-green-600">{tasks.filter(t => t.status === 'completed').length}</h3>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col min-h-[400px]">
                <h3 className="text-xl font-black mb-6 uppercase tracking-tight">Top Priority Queue</h3>
                <div className="space-y-4 flex-1">
                  {tasks.filter(t => t.status === 'pending').sort((a,b) => b.priorityScore - a.priorityScore).slice(0, 10).map(t => {
                    const pl = getPriorityLevel(t.priorityScore);
                    return (
                      <div key={t.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                        <div>
                          <p className="font-black text-[#111827]">{t.title}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{t.category} • {new Date(t.deadline).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${pl.color}`}>P: {t.priorityScore.toFixed(2)}</span>
                      </div>
                    );
                  })}
                  {tasks.filter(t => t.status === 'pending').length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                      <span className="text-4xl mb-2">🎉</span>
                      <p className="font-bold uppercase tracking-widest text-xs">Clear Workspace!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {(currentPage === 'tasks' || currentPage === 'finished') && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 flex flex-col lg:flex-row gap-5 items-center">
              <input 
                type="text" 
                placeholder="Search tasks..." 
                value={searchQuery} 
                onChange={e => setSearchQuery(e.target.value)} 
                className="w-full lg:w-1/2 px-5 py-3 bg-white text-black border border-gray-300 rounded-xl outline-none focus:ring-2 ring-blue-500 font-medium" 
              />
              <div className="flex gap-3 w-full lg:w-auto">
                {currentPage === 'tasks' && (
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)} className="flex-1 lg:w-40 bg-white border border-gray-300 px-4 py-3 rounded-xl outline-none text-sm font-bold uppercase tracking-wide">
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Done</option>
                  </select>
                )}
                <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="flex-1 lg:w-48 bg-white border border-gray-300 px-4 py-3 rounded-xl outline-none text-sm font-bold uppercase tracking-wide">
                  <option value="priority">Priority</option>
                  <option value="deadline">Deadline</option>
                  <option value="effort">Effort</option>
                </select>
              </div>
            </div>
            <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500 tracking-widest">Task Details</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500 tracking-widest">Category</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500 tracking-widest">Deadline</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500 tracking-widest">Priority</th>
                        <th className="px-8 py-5 text-[10px] font-black uppercase text-gray-500 tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredTasks.map(task => {
                         const p = getPriorityLevel(task.priorityScore);
                         const isCompleted = task.status === 'completed';
                         return (
                          <tr key={task.id} className={`${isCompleted ? 'bg-gray-50/50 grayscale' : 'hover:bg-blue-50/10'} transition-all`}>
                            <td className="px-8 py-6">
                              <p className={`font-black text-[#111827] ${isCompleted ? 'line-through text-gray-400' : ''}`}>{task.title}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-1">{task.effortHours}h effort • {Math.round(task.academicWeight*100)}% weight</p>
                            </td>
                            <td className="px-8 py-6">
                              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-gray-200">{task.category}</span>
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-gray-500">{new Date(task.deadline).toLocaleDateString()}</td>
                            <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.color}`}>{p.label} {task.priorityScore.toFixed(2)}</span>
                            </td>
                            <td className="px-8 py-6 text-right flex justify-end gap-3">
                              <button 
                                onClick={() => setTasks(tasks.map(t => t.id === task.id ? {...t, status: isCompleted ? TaskStatus.PENDING : TaskStatus.COMPLETED} : t))} 
                                className={`p-2.5 rounded-xl transition-all ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:text-green-600'}`}
                              >
                                {isCompleted ? <FinishedIcon /> : <DashboardIcon />}
                              </button>
                              <button onClick={() => { setEditingTask(task); setIsFormOpen(true); }} className="p-2.5 bg-gray-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">✎</button>
                              <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="p-2.5 bg-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">🗑</button>
                            </td>
                          </tr>
                         );
                      })}
                      {filteredTasks.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-8 py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                            {currentPage === 'finished' ? "No completed tasks yet. Keep grinding!" : "No tasks found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

        {currentPage === 'planner' && (
          <div className="max-w-3xl mx-auto space-y-10 animate-in zoom-in-95 duration-500">
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-xl relative">
              <div className="absolute top-0 right-0 p-8">
                <span className="text-4xl">🎯</span>
              </div>
              <h3 className="text-3xl font-black mb-3">Daily Study Strategy</h3>
              <p className="text-gray-500 font-medium mb-10">Optimized plan for your <span className="text-blue-600 font-black">{settings.maxStudyHoursPerDay}h study window</span> today.</p>
              
              <div className="space-y-5 mb-12">
                {tasks.filter(t => t.status === 'pending').sort((a,b) => b.priorityScore - a.priorityScore).reduce((acc: any[], t) => {
                   const currentSum = acc.reduce((s, x) => s + x.effortHours, 0);
                   if (currentSum + t.effortHours <= settings.maxStudyHoursPerDay) acc.push(t);
                   return acc;
                }, []).map((t, idx) => (
                  <div key={t.id} className="flex items-center gap-6 p-6 bg-[#F5F7FB] rounded-3xl border border-gray-100 group hover:border-blue-200 hover:bg-white hover:shadow-lg transition-all">
                    <span className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-blue-100">{idx + 1}</span>
                    <div className="flex-1">
                      <h4 className="font-black text-[#111827] text-lg">{t.title}</h4>
                      <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">{t.effortHours} Hours • {t.category} • Priority Focus</p>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'pending').length === 0 && (
                   <div className="text-center py-10 opacity-50">
                     <p className="font-black uppercase tracking-widest text-gray-400">Nothing scheduled. Enjoy the break!</p>
                   </div>
                )}
              </div>

              <div className="bg-gray-50 p-8 rounded-3xl border border-dashed border-gray-300">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">
                  Planner Note
              </h4>
              <p className="text-sm text-gray-700 leading-loose font-medium">
                 Complete tasks in priority order. If you finish early, start the next highest priority task.
              </p>
            </div>
            </div>
          </div>
        )}

        {currentPage === 'analytics' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-5 duration-500">
            <StressChart data={stressData} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                 <h4 className="font-black text-lg mb-4 uppercase tracking-tight">Workload Dynamics</h4>
                 <p className="text-sm text-gray-500 leading-relaxed font-medium">
                   We are currently monitoring a <span className="text-blue-600 font-black">{settings.stressWindowDays}-day sliding window</span>. This identifies overlapping deadlines that create "Stress Peaks".
                 </p>
                 <div className="mt-6 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Prediction Active</span>
                 </div>
              </div>
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                 <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Projected Critical Day</p>
                 <h4 className="text-4xl font-black text-red-600 mb-2">
                   {stressData.sort((a,b) => b.stressScore - a.stressScore)[0]?.date || 'N/A'}
                 </h4>
                 <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Highest Potential Overload</p>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'reports' && (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-[3rem] border border-gray-100 shadow-xl text-center animate-in zoom-in-95 duration-500">
            <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner">📄</div>
            <h3 className="text-3xl font-black mb-4">Generate Academic Report</h3>
            <p className="text-gray-500 font-medium mb-12 px-10">Compile your entire academic roadmap into a professional document for offline review or storage.</p>
            <div className="grid grid-cols-2 gap-6">
              <button onClick={exportCSV} className="group bg-gray-50 p-6 rounded-3xl border border-gray-100 hover:border-blue-300 hover:bg-white transition-all">
                <div className="text-2xl mb-2">📊</div>
                <p className="font-black uppercase text-xs tracking-widest text-gray-700">Export CSV</p>
              </button>
              <button onClick={() => exportTasksToPDF(tasks)} className="group bg-gray-50 p-6 rounded-3xl border border-gray-100 hover:border-red-300 hover:bg-white transition-all">
                <div className="text-2xl mb-2">📕</div>
                <p className="font-black uppercase text-xs tracking-widest text-gray-700">Export PDF</p>
              </button>
            </div>
            <p className="mt-12 text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{tasks.length} total records will be exported.</p>
          </div>
        )}

        {currentPage === 'settings' && (
          <div className="max-w-2xl bg-white p-10 rounded-3xl border border-gray-100 shadow-sm animate-in slide-in-from-right-5 duration-500">
             <h3 className="text-2xl font-black mb-8 uppercase tracking-tight">System Configuration</h3>
             <div className="space-y-10">
                <section>
                   <label className="block text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">Priority Algorithm Weights</label>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Urgency (w1)</span>
                        <input type="number" step="0.1" value={settings.wUrgency} onChange={e => setSettings({...settings, wUrgency: parseFloat(e.target.value)})} className="w-full bg-white border border-gray-300 p-3 rounded-xl font-bold outline-none focus:ring-2 ring-blue-500" />
                      </div>
                      <div className="space-y-1.5">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Weight (w2)</span>
                        <input type="number" step="0.1" value={settings.wWeight} onChange={e => setSettings({...settings, wWeight: parseFloat(e.target.value)})} className="w-full bg-white border border-gray-300 p-3 rounded-xl font-bold outline-none focus:ring-2 ring-blue-500" />
                      </div>
                   </div>
                </section>

                <section>
                  <label className="block text-xs font-black text-gray-400 mb-4 uppercase tracking-[0.2em]">Efficiency & Stress Metrics</label>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Max Study Hours / Day</span>
                      <input type="number" value={settings.maxStudyHoursPerDay} onChange={e => setSettings({...settings, maxStudyHoursPerDay: parseInt(e.target.value)})} className="w-full bg-white border border-gray-300 p-3 rounded-xl font-bold outline-none focus:ring-2 ring-blue-500" />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wide">Stress Window (Days)</span>
                      <input type="number" value={settings.stressWindowDays} onChange={e => setSettings({...settings, stressWindowDays: parseInt(e.target.value)})} className="w-full bg-white border border-gray-300 p-3 rounded-xl font-bold outline-none focus:ring-2 ring-blue-500" />
                    </div>
                  </div>
                </section>
                
                <div className="pt-6 border-t border-gray-100 flex items-center gap-3 text-green-600">
                  <span className="text-lg">✔</span>
                  <p className="text-xs font-black uppercase tracking-widest">Configuration synced with cloud profile</p>
                </div>
             </div>
          </div>
        )}

        {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-xl animate-in zoom-in-95 duration-300">
               <TaskForm 
                 onSave={saveTask}
                 onCancel={() => { setIsFormOpen(false); setEditingTask(null); }}
                 editingTask={editingTask}
               />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
