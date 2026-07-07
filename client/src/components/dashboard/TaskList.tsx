import { motion } from 'framer-motion';
import { useState } from 'react';
import { CheckCircle2, Circle, Plus, Clock } from 'lucide-react';

interface Task {
  id: string;
  text: string;
  time: string;
  priority: 'high' | 'medium' | 'low';
  done: boolean;
}

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-red-400', medium: 'bg-yellow-400', low: 'bg-blue-400',
};

const initialTasks: Task[] = [
  { id: '1', text: 'Register FIR for reported vehicle theft', time: '09:00', priority: 'high', done: false },
  { id: '2', text: 'Collect CCTV footage from crime scene area', time: '10:30', priority: 'high', done: false },
  { id: '3', text: 'Record witness statements for Case JAI-2024-003', time: '11:00', priority: 'medium', done: true },
  { id: '4', text: 'Send evidence samples to FSL', time: '12:00', priority: 'medium', done: false },
  { id: '5', text: 'Review AI recommendations for open cases', time: '14:00', priority: 'low', done: false },
  { id: '6', text: 'File chargesheet — Case JAI-2024-001', time: '15:00', priority: 'high', done: false },
  { id: '7', text: 'Attend court hearing — Session Court', time: '16:30', priority: 'medium', done: false },
];

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [newTask, setNewTask] = useState('');

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, done: !t.done } : t));
  };

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((prev) => [...prev, {
      id: String(Date.now()),
      text: newTask.trim(),
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      priority: 'medium',
      done: false,
    }]);
    setNewTask('');
  };

  const completed = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const circumference = 2 * Math.PI * 24;
  const strokeDash = (pct / 100) * circumference;

  return (
    <div className="card h-full flex flex-col">
      <div className="card-header flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Today's Tasks</h2>
          <p className="text-xs text-slate-500 mt-0.5">{completed}/{total} completed</p>
        </div>

        {/* Progress circle */}
        <div className="relative w-14 h-14 flex-shrink-0">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 60 60">
            <circle cx="30" cy="30" r="24" fill="none" stroke="#1E293B" strokeWidth="4" />
            <motion.circle
              cx="30" cy="30" r="24" fill="none"
              stroke={pct === 100 ? '#22C55E' : '#3B82F6'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${circumference}`}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - strokeDash }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{pct}%</span>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto scroll-area p-3 space-y-1">
        {tasks.map((task, i) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                        transition-all duration-200 group
                        ${task.done ? 'opacity-50' : 'hover:bg-[#1A2332]'}`}
            onClick={() => toggleTask(task.id)}
          >
            <div className="flex-shrink-0 mt-0.5">
              {task.done
                ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                : <Circle className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-medium leading-snug ${task.done ? 'line-through text-slate-500' : 'text-slate-300 group-hover:text-white transition-colors'}`}>
                {task.text}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[task.priority]}`} />
                <span className="text-[10px] text-slate-600 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />{task.time}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add task input */}
      <div className="p-3 border-t border-[#1E293B]">
        <div className="flex items-center gap-2">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add task..."
            className="input py-2 text-xs flex-1"
          />
          <button
            onClick={addTask}
            className="btn-icon w-8 h-8 bg-primary-600/20 text-primary-400 border-primary-500/30
                       hover:bg-primary-600/30 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
