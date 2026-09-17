"use client";
import { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  Volume2,
  Check,
  AlertCircle,
  Play,
  Square,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "./ui/drawer.jsx";

const SOUND_PATHS = {
  chime: "/sounds/chime.mp3",
  alarm: "/sounds/alarm.mp3",
  urgent: "/sounds/urgent.mp3",
  melody: "/sounds/melody.mp3",
};

export default function ReminderDrawer({ isOpen, onClose, onSave, initialData }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reminderDateTime, setReminderDateTime] = useState("");
  const [reminderType, setReminderType] = useState("custom");
  const [sound, setSound] = useState("chime");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringPattern, setRecurringPattern] = useState("daily");
  const [snoozeDuration, setSnoozeDuration] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);

  const audioRef = useRef(null);

  // Stop any playing audio when drawer closes
  useEffect(() => {
    if (!isOpen && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
      setIsPlaying(false);
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopPreview = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const playPreview = (soundType) => {
    if (soundType === "silent") return;

    // Stop any currently playing sound
    stopPreview();

    const path = SOUND_PATHS[soundType] || SOUND_PATHS.chime;
    try {
      const audio = new Audio(path);
      audio.volume = 0.6;

      audio.onended = () => {
        setIsPlaying(false);
        audioRef.current = null;
      };
      audio.onerror = () => {
        console.warn("Sound failed to load:", path);
        setIsPlaying(false);
        audioRef.current = null;
      };

      audioRef.current = audio;
      setIsPlaying(true);
      audio.play().catch((err) => {
        console.warn("Playback failed:", err.message);
        setIsPlaying(false);
        audioRef.current = null;
      });
    } catch (err) {
      console.warn("Audio init failed:", err.message);
      setIsPlaying(false);
    }
  };

  // Reset form on open
  useEffect(() => {
    if (!isOpen) return;
    setError("");
    stopPreview();

    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setReminderDateTime(
        new Date(initialData.reminderDateTime).toISOString().slice(0, 16)
      );
      setReminderType(initialData.reminderType || "custom");
      setSound(initialData.sound || "chime");
      setIsRecurring(initialData.isRecurring || false);
      setRecurringPattern(initialData.recurringPattern || "daily");
      setSnoozeDuration(initialData.snoozeDuration || 5);
    } else {
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      defaultTime.setMinutes(0);
      setTitle("");
      setDescription("");
      setReminderDateTime(defaultTime.toISOString().slice(0, 16));
      setReminderType("custom");
      setSound("chime");
      setIsRecurring(false);
      setRecurringPattern("daily");
      setSnoozeDuration(5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return setError("Title is required");
    if (!reminderDateTime) return setError("Date and time are required");

    stopPreview();
    setLoading(true);
    setError("");

    const data = {
      title: title.trim(),
      description: description.trim(),
      reminderDateTime: new Date(reminderDateTime).toISOString(),
      reminderType,
      sound,
      isRecurring,
      recurringPattern: isRecurring ? recurringPattern : null,
      snoozeDuration,
    };

    const result = await onSave(data);
    setLoading(false);

    if (result && result.success) {
      onClose();
    } else {
      setError(result?.message || "Failed to save reminder");
    }
  };

  const handleClose = () => {
    stopPreview();
    onClose();
  };

  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      direction="right"
    >
      <DrawerContent>
        <DrawerHeader className="!border-b-0">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle>
                {initialData ? "Edit Reminder" : "New Reminder"}
              </DrawerTitle>
              <DrawerDescription>
                {initialData
                  ? "Update this reminder"
                  : "Set a new reminder with sound"}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{error}</span>
              </div>
            )}

            {/* TITLE */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Reminder Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Team meeting, Workout time..."
                maxLength={100}
                autoFocus
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
              />
              <div className="text-right text-[10px] text-gray-400 mt-1">
                {title.length}/100
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add more details..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm resize-none"
              />
            </div>

            {/* DATE & TIME */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Date & Time *
              </label>
              <input
                type="datetime-local"
                value={reminderDateTime}
                onChange={(e) => setReminderDateTime(e.target.value)}
                onClick={(e) => e.currentTarget.showPicker?.()}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm cursor-pointer"
              />
            </div>

            {/* REMINDER TYPE */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reminder Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "meeting", label: "📅 Meeting" },
                  { value: "task", label: "✅ Task" },
                  { value: "activity", label: "🏋️ Activity" },
                  { value: "break", label: "☕ Break" },
                  { value: "custom", label: "📌 Custom" },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setReminderType(type.value)}
                    className={`px-2 py-2 text-xs rounded-lg border transition ${
                      reminderType === type.value
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SOUND */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5" />
                Notification Sound
              </label>
              <div className="flex gap-2">
                <select
                  value={sound}
                  onChange={(e) => setSound(e.target.value)}
                  className="flex-1 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                >
                  {[
                    { value: "chime", label: "🔔 Gentle Chime" },
                    { value: "alarm", label: "🔊 Standard Alarm" },
                    { value: "urgent", label: "🚨 Urgent Alert" },
                    { value: "melody", label: "🎵 Melody" },
                    { value: "silent", label: "🔇 Silent" },
                  ].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>

                {isPlaying ? (
                  <button
                    type="button"
                    onClick={stopPreview}
                    className="px-3 py-2.5 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition flex items-center gap-1"
                  >
                    <Square className="w-3 h-3" />
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => playPreview(sound)}
                    disabled={sound === "silent"}
                    className="px-3 py-2.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    Play
                  </button>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                Click Play to preview the sound. Click Stop to cancel.
              </p>
            </div>

            {/* RECURRING */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                Recurring Reminder
              </label>
              {isRecurring && (
                <div className="mt-3">
                  <select
                    value={recurringPattern}
                    onChange={(e) => setRecurringPattern(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              )}
            </div>

            {/* SNOOZE DURATION */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Snooze Duration
              </label>
              <select
                value={snoozeDuration}
                onChange={(e) => setSnoozeDuration(parseInt(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>

            {/* ACTIONS */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {initialData ? "Update" : "Create"} Reminder
              </button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}