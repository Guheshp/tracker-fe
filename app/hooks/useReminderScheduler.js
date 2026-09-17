"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSound } from "react-sounds";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const SOUND_PATHS = {
  chime: "/sounds/chime.mp3",
  alarm: "/sounds/alarm.mp3",
  urgent: "/sounds/urgent.mp3",
  melody: "/sounds/melody.mp3",
};

// Simple event bus for firing popups across pages
const listeners = new Set();
export const subscribeToReminderFire = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const emitReminderFire = (reminder) => {
  listeners.forEach((fn) => fn(reminder));
};

export function useReminderScheduler() {
  const { play: playChime } = useSound(SOUND_PATHS.chime);
  const { play: playAlarm } = useSound(SOUND_PATHS.alarm);
  const { play: playUrgent } = useSound(SOUND_PATHS.urgent);
  const { play: playMelody } = useSound(SOUND_PATHS.melody);

  const schedulerRunning = useRef(false);
  const [firedIds, setFiredIds] = useState(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const saved = localStorage.getItem("firedReminderIds");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const playSoundByType = useCallback(
    (type) => {
      try {
        switch (type) {
          case "alarm":
            return playAlarm();
          case "urgent":
            return playUrgent();
          case "melody":
            return playMelody();
          case "silent":
            return;
          case "chime":
          default:
            return playChime();
        }
      } catch (err) {
        console.warn("Sound playback failed:", err.message);
      }
    },
    [playChime, playAlarm, playUrgent, playMelody]
  );

  // Fire a reminder once
  const fireReminder = useCallback(
    (reminder) => {
      playSoundByType(reminder.sound || "chime");

      // Notify any mounted listener (popups, etc.)
      emitReminderFire(reminder);

      // Browser notification
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          try {
            new Notification(`🔔 ${reminder.title}`, {
              body: reminder.description || "It's time!",
              icon: "/favicon.ico",
              tag: reminder.id,
            });
          } catch (err) {
            console.warn("Notification failed:", err.message);
          }
        }
      }
    },
    [playSoundByType]
  );

  // Poll every 30s across the whole app
  useEffect(() => {
    const checkDue = async () => {
      if (schedulerRunning.current) return;
      schedulerRunning.current = true;

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(`${API_URL}/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success) return;

        const reminders = data.reminders || [];
        const now = new Date();

        const due = reminders.filter((r) => {
          if (firedIds.has(r.id)) return false;
          if (r.isCompleted) return false;
          if (r.snoozedUntil && new Date(r.snoozedUntil) > now) return false;
          const t = new Date(r.reminderDateTime);
          if (isNaN(t.getTime())) return false;
          const since = now - t;
          return since >= 0 && since < 10 * 60 * 1000;
        });

        if (due.length > 0) {
          due.forEach((r) => fireReminder(r));
          const next = new Set(firedIds);
          due.forEach((r) => next.add(r.id));
          setFiredIds(next);
          try {
            localStorage.setItem(
              "firedReminderIds",
              JSON.stringify([...next])
            );
          } catch {
            /* ignore */
          }
        }
      } catch (err) {
        console.warn("Scheduler fetch failed:", err.message);
      } finally {
        schedulerRunning.current = false;
      }
    };

    checkDue();
    const interval = setInterval(checkDue, 30000);
    return () => clearInterval(interval);
  }, [fireReminder, firedIds]);

  // Allow the reminders page to reset a fired flag when needed
  const clearFired = useCallback((id) => {
    setFiredIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      try {
        localStorage.setItem("firedReminderIds", JSON.stringify([...next]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { clearFired, playSoundByType };
}