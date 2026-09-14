"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  Clock,
  AlertCircle,
  Trash,
  RefreshCw,
  CalendarClock,
  FileSpreadsheet,
} from "lucide-react";
import ImportActivitiesModal from "./ImportActivitiesModal";

export default function ActivityManager({
  activities,
  onActivityAdd,
  onActivityUpdate,
  onActivityDelete,
  onDeleteAllDefaults,
  onActivityImported,
  canComplete,
  timeRemaining,
  onClose,
  token,
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📋");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingDefaults, setIsDeletingDefaults] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const commonIcons = [
    "📋", "🏋️", "📚", "💼", "🧘", "🌅", "💧", "🥗", "📖", "😴",
    "🎯", "💪", "🧠", "❤️", "⭐", "🔥", "🎨", "🎵", "✍️", "🧹",
    "🏃", "🍽️", "🍲", "📱", "💻", "🎮", "🎬", "📷", "🎧", "✏️",
  ];

  const defaultActivities = activities.filter((a) => a.isDefault);
  const customActivities = activities.filter((a) => !a.isDefault);

  // =========================
  // SORT ACTIVITIES BY TIME
  // =========================
  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => {
      if (a.startTime && !b.startTime) return -1;
      if (!a.startTime && b.startTime) return 1;
      if (a.startTime && b.startTime) {
        return a.startTime.localeCompare(b.startTime);
      }
      return (a.order || 0) - (b.order || 0);
    });
  }, [activities]);

  // =========================
  // ADD ACTIVITY
  // =========================
  const handleAddActivity = async () => {
    if (!newName.trim()) {
      setError("Activity name is required");
      return;
    }
    if (newStartTime && newEndTime && newStartTime >= newEndTime) {
      setError("End time must be after start time");
      return;
    }
    setError("");
    setIsSubmitting(true);

    const result = await onActivityAdd(newName.trim(), newIcon, newStartTime, newEndTime);
    setIsSubmitting(false);

    if (result.success) {
      setNewName("");
      setNewIcon("📋");
      setNewStartTime("");
      setNewEndTime("");
      setShowAddForm(false);
    } else {
      setError(result.error || "Failed to add activity");
    }
  };

  // =========================
  // UPDATE ACTIVITY
  // =========================
  const handleUpdateActivity = async () => {
    if (!editingActivity) return;
    if (!newName.trim()) {
      setError("Activity name is required");
      return;
    }
    if (newStartTime && newEndTime && newStartTime >= newEndTime) {
      setError("End time must be after start time");
      return;
    }
    setError("");
    setIsSubmitting(true);

    const result = await onActivityUpdate(
      editingActivity.id,
      newName.trim(),
      newIcon,
      newStartTime,
      newEndTime
    );
    setIsSubmitting(false);

    if (result.success) {
      setEditingActivity(null);
      setNewName("");
      setNewIcon("📋");
      setNewStartTime("");
      setNewEndTime("");
    } else {
      setError(result.error || "Failed to update activity");
    }
  };

  // =========================
  // DELETE ACTIVITY
  // =========================
  const handleDeleteActivity = async (activity) => {
    if (window.confirm(`Delete "${activity.name}"?`)) {
      const result = await onActivityDelete(activity.id);
      if (!result.success) {
        setError(result.error || "Failed to delete activity");
      }
    }
  };

  // =========================
  // DELETE ALL DEFAULTS
  // =========================
  const handleDeleteAllDefaults = async () => {
    if (defaultActivities.length === 0) {
      setError("No default activities to delete");
      return;
    }

    if (
      window.confirm(
        `Delete all ${defaultActivities.length} default activities?\n\n` +
          "This will remove all default activities and you can create your own custom schedule."
      )
    ) {
      setIsDeletingDefaults(true);
      const result = await onDeleteAllDefaults();
      setIsDeletingDefaults(false);
      if (!result.success) {
        setError(result.error || "Failed to delete default activities");
      }
    }
  };

  // =========================
  // BULK IMPORT FROM EXCEL/CSV
  // =========================
  const handleBulkImport = async (activitiesArray) => {
    if (!token) return { success: false, error: "Not authenticated" };
    try {
      const res = await fetch("http://localhost:5000/api/activities/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activities: activitiesArray }),
      });
      const data = await res.json();

      if (res.ok) {
        // Refresh activities in the parent dashboard
        if (typeof onActivityImported === "function") {
          await onActivityImported();
        }
        return {
          success: true,
          imported: data.created,
          skipped: data.skipped || [],
        };
      }
      return { success: false, error: data.message || "Import failed" };
    } catch (err) {
      console.error("Bulk import error:", err);
      return { success: false, error: "Network error" };
    }
  };

  const startEdit = (activity) => {
    setEditingActivity(activity);
    setNewName(activity.name);
    setNewIcon(activity.icon || "📋");
    setNewStartTime(activity.startTime || "");
    setNewEndTime(activity.endTime || "");
    setError("");
    setShowAddForm(false);
  };

  const openAddForm = () => {
    setShowAddForm(true);
    setEditingActivity(null);
    setNewName("");
    setNewIcon("📋");
    setNewStartTime("");
    setNewEndTime("");
    setError("");
  };

  const closeForm = () => {
    setShowAddForm(false);
    setEditingActivity(null);
    setNewName("");
    setNewIcon("📋");
    setNewStartTime("");
    setNewEndTime("");
    setError("");
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      if (showAddForm || editingActivity) {
        closeForm();
      } else {
        onClose();
      }
    }
  };

  const handleMainClose = () => {
    if (showAddForm || editingActivity) {
      closeForm();
      setTimeout(onClose, 100);
    } else {
      onClose();
    }
  };

  const formatTime = (time) => {
    if (!time) return "Flexible";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  return (
    <>
      {/* MAIN BACKDROP */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={handleBackdropClick}
      />

      {/* MANAGE ACTIVITIES MODAL */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto border border-gray-200 dark:border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Manage Activities
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {activities.length} total · {defaultActivities.length} default ·{" "}
                {customActivities.length} custom
              </p>
            </div>
            <button
              onClick={handleMainClose}
              type="button"
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* BODY */}
          <div className="p-5 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* TIME STATUS */}
            {!canComplete && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>Time&apos;s up for today! Activities lock at midnight.</span>
              </div>
            )}

            {canComplete && timeRemaining && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-600 dark:text-green-400 text-xs">
                <Clock className="w-4 h-4 flex-shrink-0" />
                <span>
                  {timeRemaining.hours}h {timeRemaining.minutes}m remaining today
                </span>
              </div>
            )}

            {/* ERROR */}
            {error && !showAddForm && !editingActivity && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button
                  type="button"
                  onClick={() => setError("")}
                  className="p-0.5 hover:bg-red-100 dark:hover:bg-red-800/50 rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <button
                onClick={openAddForm}
                type="button"
                className="p-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Activity
              </button>

              <button
                onClick={() => setShowImport(true)}
                type="button"
                className="p-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Import from Excel / CSV
              </button>
            </div>

            {/* DELETE ALL DEFAULTS BUTTON */}
            {defaultActivities.length > 0 && (
              <button
                onClick={handleDeleteAllDefaults}
                disabled={isDeletingDefaults}
                className="w-full mb-5 p-3 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isDeletingDefaults ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash className="w-4 h-4" />
                )}
                {isDeletingDefaults
                  ? "Deleting..."
                  : `Clear Default Activities (${defaultActivities.length})`}
              </button>
            )}

            {/* ACTIVITY LIST HEADER */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Activities (Sorted by Time)
              </p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {sortedActivities.filter((a) => a.startTime).length} with time slots
              </p>
            </div>

            {/* ACTIVITY LIST */}
            <div className="space-y-2">
              {sortedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition"
                >
                  {/* Activity Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg text-xl flex-shrink-0">
                      {activity.icon || "📋"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.name}
                        </span>
                        {activity.isDefault && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <CalendarClock className="w-3 h-3" />
                        <span>
                          {activity.startTime ? formatTime(activity.startTime) : "No time"}
                          {activity.endTime && ` → ${formatTime(activity.endTime)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => startEdit(activity)}
                      type="button"
                      title="Edit"
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(activity)}
                      type="button"
                      title="Delete"
                      className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {/* EMPTY STATE */}
              {sortedActivities.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-3xl mb-2">📋</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    No activities yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Add one manually or import from Excel / CSV
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
            <button
              onClick={handleMainClose}
              type="button"
              className="px-5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* ADD / EDIT ACTIVITY POPUP */}
      {(showAddForm || editingActivity) && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/40"
            onClick={closeForm}
          />

          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* POPUP HEADER */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                    {editingActivity ? "Edit Activity" : "Add Activity"}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {editingActivity
                      ? "Update your activity details"
                      : "Create a new activity to track"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* POPUP BODY */}
              <div className="p-5 max-h-[60vh] overflow-y-auto">
                {/* Activity Name */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Activity Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Gym, Reading, Meditation..."
                    maxLength={50}
                    autoFocus
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                  />
                  <div className="text-right text-[10px] text-gray-400 mt-1">
                    {newName.length}/50
                  </div>
                </div>

                {/* Icon Selection */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Choose Icon
                  </label>
                  <div className="grid grid-cols-10 gap-1 max-h-28 overflow-y-auto p-0.5">
                    {commonIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewIcon(icon)}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg text-base transition ${
                          newIcon === icon
                            ? "bg-blue-100 dark:bg-blue-900/40 ring-2 ring-blue-500"
                            : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Selection */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Time Duration (Optional)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                      />
                    </div>
                  </div>
                  {newStartTime && newEndTime && newStartTime < newEndTime && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      <span>
                        {formatTime(newStartTime)} → {formatTime(newEndTime)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button
                      type="button"
                      onClick={() => setError("")}
                      className="p-0.5 hover:bg-red-100 dark:hover:bg-red-800/50 rounded"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Warning for default activity edit */}
                {editingActivity?.isDefault && (
                  <div className="mb-3 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400 text-[11px] flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Editing a default activity will rename it for you only.</span>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={closeForm}
                    className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={editingActivity ? handleUpdateActivity : handleAddActivity}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    {editingActivity ? "Update" : "Add"} Activity
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* IMPORT FROM EXCEL MODAL */}
      {showImport && (
        <ImportActivitiesModal
          onClose={() => setShowImport(false)}
          token={token}
          onImport={handleBulkImport}
        />
      )}
    </>
  );
}