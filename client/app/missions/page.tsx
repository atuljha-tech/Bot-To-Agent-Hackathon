'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { taskAPI, Task } from '@/lib/api';

// ─── Category config ──────────────────────────────────────────────────────────

const CAT = {
  dsa:         { label: 'DSA',         icon: '🧮', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  development: { label: 'Dev',         icon: '💻', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  learning:    { label: 'Learning',    icon: '📚', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'  },
  career:      { label: 'Career',      icon: '🚀', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  revision:    { label: 'Revision',    icon: '📝', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  other:       { label: 'Other',       icon: '⚡', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)'},
};

const PRI = {
  high:   { label: 'High',   color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  medium: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  low:    { label: 'Low',    color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
};

// ─── Mission Timer ────────────────────────────────────────────────────────────

function MissionTimer({ startedAt, estimatedMinutes }: { startedAt?: string; estimatedMinutes: number }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  const totalSecs = estimatedMinutes * 60;
  const pct = Math.min(100, (elapsed / totalSecs) * 100);
  const remaining = Math.max(0, totalSecs - elapsed);
  const overTime = elapsed > totalSecs;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="mt-3">
      <div className="flex justify-between text-[11px] mb-1.5" style={{ color: 'var(--text-muted)' }}>
        <span>⏱ {fmt(elapsed)} elapsed</span>
        <span style={{ color: overTime ? 'var(--red)' : 'var(--text-muted)' }}>
          {overTime ? `+${fmt(elapsed - totalSecs)} over` : `${fmt(remaining)} left`}
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface2)' }}>
        <div className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${pct}%`,
            background: overTime
              ? 'linear-gradient(90deg, #ef4444, #f97316)'
              : pct > 80
                ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
                : 'linear-gradient(90deg, var(--green), var(--cyan))',
          }} />
      </div>
    </div>
  );
}

// ─── Mission Card ─────────────────────────────────────────────────────────────

function MissionCard({
  task, index, isActive, onStart, onComplete, onSkip,
}: {
  task: Task; index: number; isActive: boolean;
  onStart: (t: Task) => void; onComplete: (t: Task) => void; onSkip: (t: Task) => void;
}) {
  const cat = CAT[task.category] || CAT.other;
  const pri = PRI[task.priority];
  const isDone = task.status === 'completed';
  const isSkipped = task.status === 'skipped';

  return (
      <div className={`glass-card rounded-2xl p-5 border transition-all duration-300 ${isActive ? 'ring-2' : ''} ${isDone ? 'opacity-60' : ''}`}
      style={{
        borderColor: isActive ? cat.color : 'var(--border-color)',
        boxShadow: isActive ? `0 0 24px ${cat.color}22` : undefined,
        outline: isActive ? `2px solid ${cat.color}` : undefined,
      }}>

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Order badge */}
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
          style={{ background: isActive ? cat.color : 'var(--surface2)', color: isActive ? 'white' : 'var(--text-muted)' }}>
          {isDone ? '✓' : isSkipped ? '—' : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: cat.bg, color: cat.color }}>
              {cat.icon} {cat.label}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: pri.bg, color: pri.color }}>
              {pri.label}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>⏱ {task.timeEstimate || `${task.estimatedMinutes}m`}</span>
            {isActive && (
              <span className="text-xs px-2 py-0.5 rounded-full font-bold animate-pulse"
                style={{ background: 'rgba(16,185,129,0.15)', color: 'var(--green)' }}>
                ● ACTIVE
              </span>
            )}
          </div>
          <h3 className={`text-sm font-bold leading-snug ${isDone ? 'line-through' : ''}`}
            style={{ color: isDone ? 'var(--text-muted)' : 'var(--text-primary)' }}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Timer (active only) */}
      {isActive && task.startedAt && (
        <MissionTimer startedAt={task.startedAt} estimatedMinutes={task.estimatedMinutes} />
      )}

      {/* Actions */}
      {!isDone && !isSkipped && (
        <div className="flex gap-2 mt-4">
          {!isActive ? (
            <button onClick={() => onStart(task)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}cc)` }}>
              ▶ START MISSION
            </button>
          ) : (
            <button onClick={() => onComplete(task)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
              ✓ COMPLETE
            </button>
          )}
          {!isActive && (
            <button onClick={() => onSkip(task)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
              style={{ background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
              Skip
            </button>
          )}
        </div>
      )}

      {isDone && (
        <div className="mt-3 text-xs font-semibold" style={{ color: 'var(--green)' }}>
          ✅ Completed {task.completedAt ? new Date(task.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
        </div>
      )}
    </div>
  );
}

// ─── Complete Modal ───────────────────────────────────────────────────────────

function CompleteModal({ task, nextTask, onNext, onBreak, onReorder, onClose }: {
  task: Task; nextTask?: Task | null;
  onNext: () => void; onBreak: () => void; onReorder: () => void; onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden slide-up"
        style={{ background: 'var(--surface)', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 24px 60px rgba(0,0,0,0.5)' }}>
        <div className="h-1" style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4)' }} />
        <div className="p-6 text-center">
          <div className="text-5xl mb-3">🎯</div>
          <h2 className="text-xl font-black mb-1" style={{ color: 'var(--text-primary)' }}>Mission Complete!</h2>
          <p className="text-sm mb-1" style={{ color: 'var(--green)' }}>+5 Productivity Score</p>
          <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{task.title}</strong> — done ✓
          </p>

          {nextTask && (
            <div className="p-3 rounded-xl mb-4 text-left" style={{ background: 'var(--surface2)', border: '1px solid var(--border-color)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>Next Mission</p>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{nextTask.title}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>⏱ {nextTask.timeEstimate || `${nextTask.estimatedMinutes}m`}</p>
            </div>
          )}

          <div className="space-y-2">
            {nextTask && (
              <button onClick={onNext}
                className="w-full py-3 rounded-2xl font-bold text-white transition-all hover:scale-[1.02]"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
                ▶ Start Next Mission
              </button>
            )}
            <button onClick={onBreak}
              className="w-full py-3 rounded-2xl font-bold transition-all hover:scale-[1.02]"
              style={{ background: 'var(--surface2)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              ☕ Take 10 Min Break
            </button>
            <button onClick={onReorder}
              className="w-full py-2.5 rounded-2xl text-sm font-semibold transition-all"
              style={{ color: 'var(--text-muted)' }}>
              🔀 Reorder Day
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reward Toast ─────────────────────────────────────────────────────────────

function RewardToast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 slide-up">
      <div className="px-6 py-3 rounded-2xl font-bold text-white text-sm flex items-center gap-3 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', boxShadow: '0 8px 32px rgba(245,158,11,0.4)' }}>
        <span className="text-xl">🔥</span>
        {message}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MissionsPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [adding, setAdding] = useState(false);
  const [replanning, setReplanning] = useState(false);
  const [completeModal, setCompleteModal] = useState<{ task: Task; next: Task | null } | null>(null);
  const [reward, setReward] = useState<string | null>(null);
  const [view, setView] = useState<'missions' | 'add'>('missions');
  const focusTimerRef = useRef<NodeJS.Timeout | null>(null);
  const focusStartRef = useRef<number | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('you2_user_id');
    if (!id) { router.push('/create-twin'); return; }
    setUserId(id);
    loadTasks(id);
  }, [router]);

  const loadTasks = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await taskAPI.getAll(id);
      setTasks(data.tasks || []);
    } catch {}
    finally { setLoading(false); }
  }, []);

  // Track productive focus time for rewards
  useEffect(() => {
    const activeTask = tasks.find(t => t.status === 'active');
    if (activeTask && !focusStartRef.current) {
      focusStartRef.current = Date.now();
      focusTimerRef.current = setTimeout(() => {
        setReward('Deep Work Streak 🔥 45 mins of pure focus! +1 Growth Score');
        focusStartRef.current = null;
      }, 45 * 60 * 1000);
    } else if (!activeTask) {
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusStartRef.current = null;
    }
    return () => { if (focusTimerRef.current) clearTimeout(focusTimerRef.current); };
  }, [tasks]);

  const handleAddTasks = async () => {
    if (!userId || !inputText.trim()) return;
    setAdding(true);
    try {
      const lines = inputText.split('\n').map(l => l.replace(/^[\d\.\-\*]+\s*/, '').trim()).filter(Boolean);
      const data = await taskAPI.addBulk(userId, lines);
      setTasks(data.tasks || []);
      setInputText('');
      setView('missions');
    } catch (e: any) {
      alert(e?.response?.data?.error || 'Failed to add tasks');
    } finally { setAdding(false); }
  };

  const handleStart = async (task: Task) => {
    if (!userId) return;

    // Deactivate any currently active task first
    const currentActive = tasks.find(t => t.status === 'active');
    if (currentActive && currentActive._id !== task._id) {
      await taskAPI.update(currentActive._id, { status: 'pending' });
    }

    // Mark this task as active
    await taskAPI.update(task._id, { status: 'active', startedAt: new Date().toISOString() });

    // Open the launch URL in a new tab
    const url = task.launchUrl;
    if (url && url !== 'http://localhost:3000/dashboard' && url !== '') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }

    // Reload tasks to reflect new state
    await loadTasks(userId);
  };

  const handleComplete = async (task: Task) => {
    if (!userId) return;
    await taskAPI.update(task._id, { status: 'completed', completed: true });
    const updated = await taskAPI.getAll(userId);
    const allTasks: Task[] = updated.tasks || [];
    setTasks(allTasks);
    const next = allTasks.find(t => t.status === 'pending') || null;
    setCompleteModal({ task, next });
  };

  const handleSkip = async (task: Task) => {
    if (!userId) return;
    await taskAPI.update(task._id, { status: 'skipped' });
    await loadTasks(userId);
  };

  const handleReplan = async () => {
    if (!userId) return;
    setReplanning(true);
    try {
      const data = await taskAPI.replan(userId);
      setTasks(data.tasks || []);
      if (data.message) setReward(data.message);
    } catch {}
    finally { setReplanning(false); }
  };

  const startNext = async () => {
    if (!completeModal?.next) return;
    setCompleteModal(null);
    await handleStart(completeModal.next);
  };

  const pending = tasks.filter(t => t.status === 'pending');
  const active  = tasks.find(t => t.status === 'active');
  const done    = tasks.filter(t => t.status === 'completed');
  const skipped = tasks.filter(t => t.status === 'skipped');
  const completionRate = tasks.length > 0 ? Math.round((done.length / tasks.length) * 100) : 0;

  return (
    <div className="min-h-screen py-8 px-4 md:px-6" style={{ background: 'var(--bg-primary)' }}>
      {/* Reward toast */}
      {reward && <RewardToast message={reward} onClose={() => setReward(null)} />}

      {/* Complete modal */}
      {completeModal && (
        <CompleteModal
          task={completeModal.task}
          nextTask={completeModal.next}
          onNext={startNext}
          onBreak={() => setCompleteModal(null)}
          onReorder={() => { setCompleteModal(null); handleReplan(); }}
          onClose={() => setCompleteModal(null)}
        />
      )}

      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>
              ⚡ Mission Center
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Your autonomous task execution agent
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleReplan} disabled={replanning}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
              style={{ background: 'rgba(139,92,246,0.1)', color: 'var(--purple)', border: '1px solid rgba(139,92,246,0.2)' }}>
              {replanning ? '⏳ Replanning…' : '🔀 Replan Day'}
            </button>
            <button onClick={() => setView(v => v === 'add' ? 'missions' : 'add')}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, var(--purple), var(--blue))' }}>
              {view === 'add' ? '← Back' : '+ Add Tasks'}
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Total', val: tasks.length, color: 'var(--text-primary)' },
              { label: 'Active', val: active ? 1 : 0, color: 'var(--green)' },
              { label: 'Done', val: done.length, color: 'var(--cyan)' },
              { label: 'Progress', val: `${completionRate}%`, color: 'var(--purple)' },
            ].map((s, i) => (
              <div key={i} className="glass-card p-3 rounded-2xl text-center border" style={{ borderColor: 'var(--border-color)' }}>
                <div className="text-xl font-black" style={{ color: s.color }}>{s.val}</div>
                <div className="text-[10px] mt-0.5 font-semibold" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Add Tasks View */}
        {view === 'add' && (
          <div className="glass-card rounded-3xl p-6 mb-6 slide-up">
            <h2 className="text-base font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Add Your Missions</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
              Enter one task per line. Your twin will prioritize, categorize, and find the right resource for each.
            </p>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              rows={10}
              placeholder={`Watch YouTube DSA Arrays playlist\nRead Striver Binary Search notes\nSolve 3 LeetCode questions\nGive HackerRank mock interview\nApply to internships on LinkedIn\nUpdate LinkedIn profile\nBuild portfolio on GitHub\nRead system design article\nRevise DBMS concepts\nPractice aptitude questions`}
              className="tm-input resize-none text-sm"
            />
            <div className="flex gap-3 mt-4">
              <button onClick={handleAddTasks} disabled={adding || !inputText.trim()}
                className="flex-1 py-3 rounded-2xl font-bold text-white transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, var(--purple), var(--blue))' }}>
                {adding ? '🧠 AI Prioritizing…' : '⚡ Create Missions'}
              </button>
              <button onClick={() => setView('missions')}
                className="px-6 py-3 rounded-2xl font-bold transition-all"
                style={{ background: 'var(--surface2)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Missions View */}
        {view === 'missions' && (
          <>
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="glass-card rounded-2xl p-5 border animate-pulse" style={{ borderColor: 'var(--border-color)' }}>
                    <div className="h-4 w-2/3 rounded bg-[var(--surface2)] mb-2" />
                    <div className="h-3 w-1/2 rounded bg-[var(--surface2)]" />
                  </div>
                ))}
              </div>
            ) : tasks.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center border" style={{ borderColor: 'var(--border-color)' }}>
                <div className="text-5xl mb-4">🎯</div>
                <h2 className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)' }}>No Missions Yet</h2>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  Add your tasks and let your twin convert them into executable missions.
                </p>
                <button onClick={() => setView('add')}
                  className="px-8 py-3 rounded-2xl font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--purple), var(--blue))' }}>
                  + Add Your First Missions
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active mission first */}
                {active && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--green)' }}>
                      ● Currently Active
                    </p>
                    <MissionCard
                      task={active} index={tasks.indexOf(active)}
                      isActive={true}
                      onStart={handleStart} onComplete={handleComplete} onSkip={handleSkip}
                    />
                  </div>
                )}

                {/* Pending missions */}
                {pending.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2 mt-4" style={{ color: 'var(--text-muted)' }}>
                      Pending ({pending.length})
                    </p>
                    <div className="space-y-3">
                      {pending.map((t, i) => (
                        <MissionCard key={t._id} task={t} index={i} isActive={false}
                          onStart={handleStart} onComplete={handleComplete} onSkip={handleSkip} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Completed */}
                {done.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2 mt-4" style={{ color: 'var(--text-muted)' }}>
                      Completed ({done.length})
                    </p>
                    <div className="space-y-3">
                      {done.map((t, i) => (
                        <MissionCard key={t._id} task={t} index={i} isActive={false}
                          onStart={handleStart} onComplete={handleComplete} onSkip={handleSkip} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Skipped */}
                {skipped.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-2 mt-4" style={{ color: 'var(--text-muted)' }}>
                      Skipped ({skipped.length})
                    </p>
                    <div className="space-y-3">
                      {skipped.map((t, i) => (
                        <MissionCard key={t._id} task={t} index={i} isActive={false}
                          onStart={handleStart} onComplete={handleComplete} onSkip={handleSkip} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
