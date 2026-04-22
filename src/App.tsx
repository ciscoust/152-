/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Settings as SettingsIcon, 
  Plus, 
  ChevronRight, 
  ChevronLeft, 
  Bell, 
  BellOff, 
  Music, 
  Volume2, 
  VolumeX, 
  Trash2, 
  Download, 
  Upload, 
  CheckCircle2, 
  Clock,
  Camera,
  Info
} from 'lucide-react';
import { format, addDays, isWithinInterval, startOfDay, differenceInDays } from 'date-fns';
import { cn, convertTo12HourFormat, convertTo24HourFormat } from './lib/utils';
import type { AppData, Goal, Ritual, Entry, AppSettings, GoalID } from './types';

const STORAGE_KEY = 'Tahqeeq369_Data';

const PHASES = [
  { key: 'phase1', day: 1, title: "🧲 اطلق بوضوح", color: "#e74c3c", placeholder: "لقد حددت هدفي بوضوح مطلق وهو..." },
  { key: 'phase2', day: 6, title: "🌟 صدّق", color: "#f1c40f", placeholder: "أنا أؤمن وأصدق أنني أستحق هذا الهدف وهو يتحقق الآن..." },
  { key: 'phase3', day: 11, title: "🎁 استقبل", color: "#2ecc71", placeholder: "أنا منفتح ومستعد لاستقبال هدفي بأفضل صورة..." },
  { key: 'phase4', day: 16, title: "🔄 الإحساس", color: "#3498db", placeholder: "أشعر بمشاعر الفرح والبهجة لتحقق هدفي..." },
  { key: 'phase5', day: 21, title: "🙏 الامتنان", color: "#9b59b6", placeholder: "أنا ممتن لله على كل النعم وعلى هدفي الذي تحقق..." }
];

const INITIAL_SETTINGS: AppSettings = {
  notifications: true,
  defaultTimes: {
    morning: '08:00 AM',
    afternoon: '01:00 PM',
    evening: '09:00 PM'
  },
  audio: {
    sounds: { general: null, morning: null, afternoon: null, evening: null },
    music: { phase1: null, phase2: null, phase3: null, phase4: null, phase5: null }
  }
};

interface RitualItemProps {
  ritual: Ritual;
  goal: Goal;
  onAction: (text: string) => void;
}

const RitualItem: React.FC<RitualItemProps> = ({ ritual, goal, onAction }) => {
  const todayStr = new Date().toDateString();
  const entries = goal.entries.filter(e => e.ritualId === ritual.id && new Date(e.date).toDateString() === todayStr);
  const isDone = entries.length >= ritual.count;
  const [text, setText] = useState('');

  const today = startOfDay(new Date());
  const start = startOfDay(new Date(goal.startDate));
  const currentDay = differenceInDays(today, start) + 1;
  let currentPhase = PHASES[0];
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (currentDay >= PHASES[i].day) { currentPhase = PHASES[i]; break; }
  }

  const handleAction = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(50);
    onAction(text);
    setText('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-xl space-y-4 shadow-sm">
      <div className="flex justify-between items-center">
        <div className="space-y-1 text-right">
          <span className="font-bold text-slate-900 dark:text-white block text-sm">{ritual.name}</span>
          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
            <Clock className="w-3 h-3" />
            {ritual.time}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700">
          تم: <span className="text-primary">{entries.length}</span> / {ritual.count}
        </div>
      </div>

      {!isDone ? (
        <div className="space-y-3">
          <textarea 
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={currentPhase.placeholder}
            className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-lg text-xs md:text-sm border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none min-h-[80px] text-right transition-all"
          />
          <button 
            disabled={!text}
            onClick={handleAction}
            className="w-full bg-primary disabled:opacity-50 text-white font-semibold py-3 rounded-lg shadow-sm flex items-center justify-center gap-2 text-sm hover:bg-primary-hover transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            تسجيل التوكيد
          </button>
        </div>
      ) : (
        <div className="text-center py-4 text-green-600 font-bold bg-green-50 dark:bg-green-900/10 rounded-lg text-sm border border-green-100 dark:border-green-800/30">
          ✓ تم إكمال هذا الطقس لليوم بنجاح
        </div>
      )}

      {entries.length > 0 && (
        <div className="pt-2 space-y-2 max-h-[150px] overflow-y-auto">
          {entries.map(e => (
            <div key={e.id} className="text-[10px] text-gray-500 bg-white/50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100/50 text-right">
              • {e.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [appData, setAppData] = useState<AppData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          settings: { ...INITIAL_SETTINGS, ...parsed.settings }
        };
      } catch (e) {
        console.error('Error loading data', e);
      }
    }
    return { settings: INITIAL_SETTINGS, goals: [] };
  });

  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [activeGoalId, setActiveGoalId] = useState<GoalID | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  const alarmRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const [isAlarmPlaying, setIsAlarmPlaying] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
  }, [appData]);

  useEffect(() => {
    // Phase Music Logic
    if (activeGoal && activeTab === 'dashboard') {
      const today = startOfDay(new Date());
      const start = startOfDay(new Date(activeGoal.startDate));
      const end = startOfDay(new Date(activeGoal.endDate));
      
      if (today >= start && today <= end) {
        const currentDay = differenceInDays(today, start) + 1;
        let pKey = 'phase1';
        if (currentDay >= 21) pKey = 'phase5';
        else if (currentDay >= 16) pKey = 'phase4';
        else if (currentDay >= 11) pKey = 'phase3';
        else if (currentDay >= 6) pKey = 'phase2';

        const musicUrl = appData.settings.audio.music[pKey as keyof typeof appData.settings.audio.music];
        if (musicUrl && musicRef.current) {
          musicRef.current.src = musicUrl;
          musicRef.current.play().then(() => setIsMusicPlaying(true)).catch(() => setIsMusicPlaying(false));
        }
      }
    } else {
      if (musicRef.current) {
        musicRef.current.pause();
        setIsMusicPlaying(false);
      }
    }
  }, [activeGoalId, activeTab]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      checkReminders(now);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const checkReminders = (now: Date) => {
    if (!appData.settings.notifications) return;
    const timeStr = format(now, 'hh:mm a');
    const todayStr = format(now, 'yyyy-MM-dd');

    appData.goals.forEach(goal => {
      if (todayStr < goal.startDate || todayStr > goal.endDate) return;
      
      goal.rituals.forEach(r => {
        if (r.time === timeStr) {
          const flag = `notif_${goal.id}_${r.id}_${todayStr}`;
          if (sessionStorage.getItem(flag)) return;
          
          triggerAlarm(goal, r);
          sessionStorage.setItem(flag, 'true');
        }
      });
    });
  };

  const triggerAlarm = (goal: Goal, ritual: Ritual) => {
    if (Notification.permission === "granted") {
      new Notification(`⏰ ${goal.name}`, {
        body: `حان وقت طقوس ${ritual.name}`,
        icon: '/pwa-192x192.png',
      });
    }

    let soundKey: 'morning' | 'afternoon' | 'evening' | 'general' = 'general';
    if (ritual.id === 'm') soundKey = 'morning';
    else if (ritual.id === 'a') soundKey = 'afternoon';
    else if (ritual.id === 'e') soundKey = 'evening';

    const soundUrl = appData.settings.audio.sounds[soundKey] || appData.settings.audio.sounds.general;
    
    if (alarmRef.current) {
      alarmRef.current.src = soundUrl || "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";
      alarmRef.current.play().catch(console.error);
      setIsAlarmPlaying(true);
    }
  };

  const stopAlarm = () => {
    if (alarmRef.current) {
      alarmRef.current.pause();
      alarmRef.current.currentTime = 0;
      setIsAlarmPlaying(false);
    }
  };

  const activeGoal = appData.goals.find(g => g.id === activeGoalId);

  return (
    <div className="flex flex-col h-screen bg-bg-base dark:bg-slate-950 transition-colors duration-500 overflow-hidden" dir="rtl">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 px-4 py-3 flex justify-between items-center border-b border-border-subtle dark:border-slate-800 shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          {activeGoalId && (
            <button onClick={() => setActiveGoalId(null)} className="p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
          <h1 className="font-bold text-lg text-slate-900 dark:text-white truncate max-w-[200px] tracking-tight">
            {activeGoalId ? activeGoal?.name : 'تطبيق تحقيق 369'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {isMusicPlaying && (
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center"
            >
              <Music className="w-4 h-4 text-primary" />
            </motion.div>
          )}
          <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-lg font-mono text-xs md:text-sm font-bold flex items-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            <Clock className="w-4 h-4 text-slate-400" />
            {format(currentTime, 'hh:mm a')}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 relative">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && !activeGoalId && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl shadow-sm space-y-4 text-center border border-slate-200 dark:border-slate-800">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                  <span className="text-4xl text-primary">🎯</span>
                </div>
                <h2 className="text-2xl font-bold dark:text-white tracking-tight">أهدافك الحالية</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">حدد أهدافك بوضوح وابدأ رحلة التجلي الاحترافية</p>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full mt-4 bg-primary hover:bg-primary-hover text-white py-4 rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  إضافة هدف جديد
                </button>
              </div>

              <div className="grid gap-4">
                {appData.goals.map(goal => {
                  const today = startOfDay(new Date());
                  const start = startOfDay(new Date(goal.startDate));
                  const end = startOfDay(new Date(goal.endDate));
                  const totalDays = 25;
                  const elapsedDays = differenceInDays(today, start);
                  const progress = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
                  const isActive = isWithinInterval(today, { start, end });

                  return (
                    <button 
                      key={goal.id} 
                      onClick={() => setActiveGoalId(goal.id)}
                      className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center gap-4 text-right hover:border-primary/50 transition-all group"
                    >
                      <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden shrink-0 border border-slate-200 dark:border-slate-700">
                        {goal.image ? (
                          <img src={goal.image} alt={goal.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Camera className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn("font-bold text-lg truncate group-hover:text-primary transition-colors", isActive ? "text-primary" : "text-slate-500")}>
                          {goal.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-medium">الفترة: {goal.startDate} - {goal.endDate}</p>
                        <div className="mt-2 h-1.5 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-100 dark:border-slate-700">
                          <div 
                            className="h-full bg-primary transition-all duration-1000" 
                            style={{ width: `${progress}%` }} 
                          />
                        </div>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-slate-300" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeGoalId && activeGoal && (
            <motion.div 
              key="goal-detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Goal Cover */}
              <div 
                className="w-full h-48 bg-slate-200 dark:bg-slate-800 rounded-2xl overflow-hidden relative shadow-sm group cursor-pointer border border-slate-200 dark:border-slate-700"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev: any) => {
                        const newGoals = appData.goals.map(g => 
                          g.id === activeGoalId ? { ...g, image: ev.target.result } : g
                        );
                        setAppData({ ...appData, goals: newGoals });
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
              >
                {activeGoal.image ? (
                  <img src={activeGoal.image} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Camera className="w-10 h-10" />
                    <span className="text-sm font-medium">تغيير صورة الهدف</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 w-full bg-slate-900/80 backdrop-blur-md text-white py-2 text-center text-[10px] font-bold tracking-wider">
                  الفترة الزمنية: {activeGoal.startDate} ⟷ {activeGoal.endDate}
                </div>
              </div>

              {/* Progress Tracker */}
              <PhaseIndicator goal={activeGoal} />

              {/* Rituals Section */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-white tracking-tight">
                  <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                  طقوس التفعيل اليومية
                </h3>
                <div className="space-y-4">
                  {activeGoal.rituals.map((ritual: Ritual) => (
                    <RitualItem 
                      key={ritual.id} 
                      ritual={ritual} 
                      goal={activeGoal} 
                      onAction={(text) => {
                        const newEntry: Entry = {
                          id: Date.now(),
                          ritualId: ritual.id,
                          text,
                          date: new Date().toISOString()
                        };
                        const newGoals = appData.goals.map(g => 
                          g.id === activeGoalId ? { ...g, entries: [...g.entries, newEntry] } : g
                        );
                        setAppData({ ...appData, goals: newGoals });
                        showToast('تم تسجيل التوكيد بنجاح');
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <SettingsSection 
              settings={appData.settings} 
              onUpdate={(newSettings) => {
                setAppData({ ...appData, settings: newSettings });
              }}
              onReset={() => {
                if (confirm('هل أنت متأكد من حذف جميع البيانات؟')) {
                  localStorage.removeItem(STORAGE_KEY);
                  window.location.reload();
                }
              }}
              onSync={() => {
                const newGoals = appData.goals.map(goal => ({
                  ...goal,
                  rituals: goal.rituals.map(r => ({
                    ...r,
                    time: r.id === 'm' ? appData.settings.defaultTimes.morning : 
                          r.id === 'a' ? appData.settings.defaultTimes.afternoon : 
                          appData.settings.defaultTimes.evening
                  }))
                }));
                setAppData({ ...appData, goals: newGoals });
                showToast('تمت المزامنة بنجاح');
              }}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Navigation Bar */}
      <nav className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-3 fixed bottom-0 w-full flex justify-around items-center z-50 shadow-lg shrink-0">
        <button 
          onClick={() => { setActiveTab('dashboard'); setActiveGoalId(null); }}
          className={cn("flex flex-col items-center gap-1 transition-all px-8 py-2 rounded-xl", 
            activeTab === 'dashboard' ? "text-primary bg-primary/5" : "text-slate-400 hover:text-slate-600")}
        >
          <Home className="w-6 h-6" />
          <span className="text-[10px] font-bold">لوحة التحكم</span>
        </button>
        <button 
          onClick={() => { setActiveTab('settings'); setActiveGoalId(null); }}
          className={cn("flex flex-col items-center gap-1 transition-all px-8 py-2 rounded-xl", 
            activeTab === 'settings' ? "text-primary bg-primary/5" : "text-slate-400 hover:text-slate-600")}
        >
          <SettingsIcon className="w-6 h-6" />
          <span className="text-[10px] font-bold">إعدادات النظام</span>
        </button>
      </nav>

      {/* Alarm Overlay */}
      <AnimatePresence>
        {isAlarmPlaying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-10 text-center"
          >
             <Bell className="w-24 h-24 text-primary mb-8 animate-bounce" />
             <h2 className="text-3xl font-black text-white mb-4 tracking-tight">تنبيه النظام</h2>
             <p className="text-slate-400 mb-12 text-sm">حان وقت الطقوس المجدولة للتحقق</p>
             <button 
              onClick={stopAlarm}
              className="bg-primary text-white font-bold px-10 py-5 rounded-xl shadow-xl hover:scale-105 transition-all flex items-center gap-3"
             >
              <BellOff className="w-6 h-6" />
              إيقاف التنبيه الآن
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl p-8 shadow-2xl space-y-6 border border-slate-200 dark:border-slate-800"
            >
              <h2 className="text-2xl font-bold dark:text-white tracking-tight">إضافة مشروع تجلي</h2>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 mr-2 text-right block uppercase tracking-wider">عنوان الهدف</label>
                  <input 
                    id="goalName"
                    placeholder="أدخل عنواناً واضحاً لمشروعك"
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 focus:border-primary outline-none dark:text-white text-right font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 mr-2 text-right block uppercase tracking-wider">تاريخ البدء</label>
                  <input 
                    id="goalStart"
                    type="date"
                    defaultValue={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 focus:border-primary outline-none dark:text-white text-right"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 py-4 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  className="flex-[2] bg-primary text-white py-4 rounded-xl font-bold shadow-sm hover:bg-primary-hover transition-all"
                  onClick={() => {
                    const name = (document.getElementById('goalName') as HTMLInputElement).value;
                    const start = (document.getElementById('goalStart') as HTMLInputElement).value;
                    if (!name || !start) return showToast('يرجى إكمال البيانات', 'error');

                    const startDate = new Date(start);
                    const end = format(addDays(startDate, 24), 'yyyy-MM-dd');

                    const newGoal: Goal = {
                      id: Date.now().toString(),
                      name,
                      image: null,
                      startDate: start,
                      endDate: end,
                      rituals: [
                        { id: 'm', name: 'الصباح (3)', time: appData.settings.defaultTimes.morning, count: 3 },
                        { id: 'a', name: 'الظهر (6)', time: appData.settings.defaultTimes.afternoon, count: 6 },
                        { id: 'e', name: 'المساء (9)', time: appData.settings.defaultTimes.evening, count: 9 }
                      ],
                      entries: []
                    };

                    setAppData({ ...appData, goals: [...appData.goals, newGoal] });
                    setIsAddModalOpen(false);
                    showToast('تمت إضافة الهدف بنجاح');
                  }}
                >
                  حفظ البيانات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] bg-gray-900/90 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className={cn("w-2 h-2 rounded-full", toast.type === 'error' ? 'bg-red-500' : 'bg-green-500')} />
            <span className="text-sm font-bold">{toast.msg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={alarmRef} loop />
      <audio ref={musicRef} loop />
    </div>
  );
}

function PhaseIndicator({ goal }: { goal: Goal }) {
  const today = startOfDay(new Date());
  const start = startOfDay(new Date(goal.startDate));
  const end = startOfDay(new Date(goal.endDate));
  
  if (today < start || today > end) return null;

  const currentDay = differenceInDays(today, start) + 1;
  let currentPhase = PHASES[0];
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (currentDay >= PHASES[i].day) {
      currentPhase = PHASES[i];
      break;
    }
  }

  const nextPhaseDay = PHASES.find(p => p.day > currentPhase.day)?.day || 26;
  const daysInPhase = nextPhaseDay - currentPhase.day;
  const dayWithinPhase = currentDay - currentPhase.day + 1;
  const phaseProgress = (dayWithinPhase / daysInPhase) * 100;

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 border-r-8 flex items-center gap-4 transition-all" style={{ borderColor: currentPhase.color }}>
      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-slate-100 dark:border-slate-700">
        {currentPhase.title.split(' ')[0]}
      </div>
      <div className="flex-1 space-y-1 min-w-0 text-right">
        <h4 className="font-bold text-lg truncate tracking-tight" style={{ color: currentPhase.color }}>{currentPhase.title.split(' ')[1]}</h4>
        <p className="text-[10px] text-slate-500 font-medium tracking-wide italic">المرحلة الحالية: {dayWithinPhase} / {daysInPhase} يوماً</p>
        <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full mt-2 overflow-hidden border border-slate-100 dark:border-slate-700">
          <div className="h-full transition-all duration-1000" style={{ width: `${phaseProgress}%`, backgroundColor: currentPhase.color }} />
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ settings, onUpdate, onReset, onSync }: { settings: AppSettings, onUpdate: (s: AppSettings) => void, onReset: () => void, onSync: () => void }) {
  return (
    <div className="space-y-8 pb-10">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm space-y-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white tracking-tight">
          <SettingsIcon className="w-5 h-5 text-primary" />
          إصدار النظام والإعدادات
        </h3>

        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">إشعارات الدفع</p>
              <p className="text-[10px] text-slate-500 font-medium">تفعيل التنبيهات الذكية للطقوس</p>
            </div>
          </div>
          <button 
            onClick={() => onUpdate({ ...settings, notifications: !settings.notifications })}
            className={cn("w-12 h-6 rounded-full transition-all relative border border-slate-200 dark:border-slate-700", settings.notifications ? "bg-primary" : "bg-slate-300")}
          >
            <motion.div 
              animate={{ x: settings.notifications ? 24 : 0 }}
              className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm" 
            />
          </button>
        </div>

        <button 
          className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-all" 
          onClick={() => {
            if (Notification.permission !== "granted") {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                   new Notification("⚙️ إشعار تجريبي", { body: "نظام التنبيهات نشط وجاهز للإصدار" });
                }
              });
            } else {
               new Notification("⚙️ إشعار تجريبي", { body: "نظام التنبيهات نشط وجاهز للإصدار" });
            }
          }}
        >
          <Bell className="w-5 h-5 text-slate-400" />
          معاينة نظام التنبيهات
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm space-y-6 border border-slate-200 dark:border-slate-800">
        <h3 className="text-lg font-bold flex items-center gap-2 tracking-tight">
          <Clock className="w-5 h-5 text-primary" />
          جدولة المهام الافتراضية
        </h3>
        <p className="text-[10px] text-slate-400 text-right font-medium">تحديث معايير المزامنة لكافة الأهداف النشطة في النظام.</p>
        
        <button 
          onClick={onSync} 
          className="w-full bg-primary text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-primary-hover transition-all"
        >
          🔄 تحديث ومزامنة البيانات
        </button>

        <div className="space-y-4">
          {(['morning', 'afternoon', 'evening'] as const).map((key) => (
            <div key={key} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {key === 'morning' ? 'طقوس الصباح (API)' : key === 'afternoon' ? 'طقوس الظهر (API)' : 'طقوس المساء (API)'}
              </span>
              <input 
                type="time"
                defaultValue={convertTo24HourFormat(settings.defaultTimes[key])}
                onChange={(e) => {
                  const newTimes = { ...settings.defaultTimes, [key]: convertTo12HourFormat(e.target.value) };
                  onUpdate({ ...settings, defaultTimes: newTimes });
                }}
                className="bg-white dark:bg-slate-800 p-2 rounded-lg text-xs font-mono outline-none border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm space-y-6 border border-slate-200 dark:border-slate-800 border-b-8 border-b-red-600">
         <h3 className="text-lg font-bold flex items-center gap-2 text-red-600 tracking-tight">
          <Trash2 className="w-5 h-5" />
          تطهير البيانات (Danger Zone)
         </h3>
         <button onClick={onReset} className="w-full border border-red-200 text-red-600 font-bold py-4 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors bg-red-50/30">
            حذف كافة السجلات والمشاريع نهائياً
         </button>
      </div>
    </div>
  );
}

