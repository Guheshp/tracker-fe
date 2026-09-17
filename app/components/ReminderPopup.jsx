"use client";
import { useEffect, useState } from "react";
import { Bell, Clock, Pause, Check, X } from "lucide-react";
import { subscribeToReminderFire } from "../hooks/useReminderScheduler";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function ReminderPopup() {
  const [activePopup, setActivePopup] = useState(null);
  const [queue, setQueue] = useState([]);

  // Subscribe to global reminder-fire events
  useEffect(() => {
    const unsub = subscribeToReminderFire((reminder) => {
      setQueue((prev) => [...prev, reminder]);
    });
    return () => unsub();
  }, []);

  // Show the next queued reminder if nothing is currently showing
  useEffect(() => {
    if (!activePopup && queue.length > 0) {
      const [next, ...rest] = queue;
      setActivePopup(next);
      setQueue(rest);
    }
  }, [activePopup, queue]);

  // Auto-dismiss after 30 seconds
  useEffect(() => {
    if (!activePopup) return;
    const timer = setTimeout(() => setActivePopup(null), 30000);
    return () => clearTimeout(timer);
  }, [activePopup]);

  const formatTime = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleSnooze = async (id, duration = 5) => {
    setActivePopup(null);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/reminders/${id}/snooze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ snoozeDuration: duration }),
      });
    } catch (err) {
      console.error("Snooze failed:", err);
    }
  };

  const handleComplete = async (id) => {
    setActivePopup(null);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/reminders/${id}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Complete failed:", err);
    }
  };

  if (!activePopup) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[150] w-[340px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-violet-300 dark:border-violet-700 overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
      {/* Accent bar */}
      <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />

      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {activePopup.title}
            </p>
            {activePopup.description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                {activePopup.description}
              </p>
            )}
            <p className="text-[11px] text-violet-600 dark:text-violet-400 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(activePopup.reminderDateTime)}
            </p>
          </div>

          <button
            onClick={() => setActivePopup(null)}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2 mt-3">
          <button
            onClick={() => handleSnooze(activePopup.id)}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-lg transition flex items-center justify-center gap-1"
          >
            <Pause className="w-3 h-3" />
            Snooze
          </button>
          <button
            onClick={() => handleComplete(activePopup.id)}
            className="flex-1 px-3 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center justify-center gap-1"
          >
            <Check className="w-3 h-3" />
            Mark done
          </button>
        </div>
      </div>
    </div>
  );
}