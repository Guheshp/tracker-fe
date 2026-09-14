"use client";
import { useState, useEffect } from "react";
import { X, Clock, Calendar, Bell, Volume2 } from "lucide-react";

export default function ReminderModal({ onClose, onSave, initialData }) {
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

  const soundOptions = [
    { value: 'chime', label: '🔔 Gentle Chime' },
    { value: 'alarm', label: '🔊 Standard Alarm' },
    { value: 'urgent', label: '🚨 Urgent Alert' },
    { value: 'melody', label: '🎵 Melody' },
    { value: 'silent', label: '🔇 Silent' }
  ];

  const reminderTypes = [
    { value: 'meeting', label: '📅 Meeting' },
    { value: 'task', label: '✅ Task' },
    { value: 'activity', label: '🏋️ Activity' },
    { value: 'break', label: '☕ Break' },
    { value: 'custom', label: '📌 Custom' }
  ];

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setDescription(initialData.description || "");
      setReminderDateTime(new Date(initialData.reminderDateTime).toISOString().slice(0, 16));
      setReminderType(initialData.reminderType || "custom");
      setSound(initialData.sound || "chime");
      setIsRecurring(initialData.isRecurring || false);
      setRecurringPattern(initialData.recurringPattern || "daily");
      setSnoozeDuration(initialData.snoozeDuration || 5);
    } else {
      // Set default time to current time + 1 hour
      const defaultTime = new Date();
      defaultTime.setHours(defaultTime.getHours() + 1);
      setReminderDateTime(defaultTime.toISOString().slice(0, 16));
    }
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!reminderDateTime) {
      setError("Date and time are required");
      return;
    }

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
      snoozeDuration
    };

    const result = await onSave(data);
    setLoading(false);

    if (result && result.success) {
      onClose();
    } else {
      setError(result?.message || "Failed to save reminder");
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {initialData ? "Edit Reminder" : "New Reminder"}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reminder Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Meeting with team, Time to exercise..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  maxLength={100}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add more details..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                  rows={2}
                />
              </div>

              {/* Date & Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={reminderDateTime}
                  onChange={(e) => setReminderDateTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Reminder Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reminder Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {reminderTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setReminderType(type.value)}
                      className={`px-3 py-2 text-sm rounded-lg border transition ${
                        reminderType === type.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                          : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Volume2 className="w-4 h-4 inline mr-1" />
                  Notification Sound
                </label>
                <select
                  value={sound}
                  onChange={(e) => setSound(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {soundOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Recurring */}
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  Recurring Reminder
                </label>
                {isRecurring && (
                  <div className="mt-2">
                    <select
                      value={recurringPattern}
                      onChange={(e) => setRecurringPattern(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Snooze Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Snooze Duration (minutes)
                </label>
                <select
                  value={snoozeDuration}
                  onChange={(e) => setSnoozeDuration(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value={5}>5 minutes</option>
                  <option value={10}>10 minutes</option>
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                  {initialData ? "Update" : "Create"} Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}