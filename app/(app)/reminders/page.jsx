"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Plus, Clock, Check, Volume2, Calendar, Zap, Coffee,
  Edit2, Pause, Trash2, Users, Activity,
} from "lucide-react";
import useAuthStore from "../../authStore";
import ReminderDrawer from "../../components/ReminderDrawer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export default function RemindersPage() {
  const router = useRouter();
  const { user, token, isLoading, checkAuth } = useAuthStore();

  const [reminders, setReminders] = useState([]);
  const [todayReminders, setTodayReminders] = useState([]);
  const [upcomingReminders, setUpcomingReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [activeTab, setActiveTab] = useState("today");

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
    if (user && token) fetchReminders();
  }, [user, isLoading, token]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const [todayRes, upcomingRes, allRes] = await Promise.all([
        fetch(`${API_URL}/reminders/today`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/reminders/upcoming`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/reminders`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const todayData = await todayRes.json();
      const upcomingData = await upcomingRes.json();
      const allData = await allRes.json();

      if (todayData.success) setTodayReminders(todayData.reminders || []);
      if (upcomingData.success) setUpcomingReminders(upcomingData.reminders || []);
      if (allData.success) setReminders(allData.reminders || []);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (data) => {
    try {
      const response = await fetch(`${API_URL}/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        await fetchReminders();
        setShowModal(false);
      }
      return result;
    } catch (error) {
      console.error("Error creating reminder:", error);
      return { success: false, message: "Network error" };
    }
  };

  const handleUpdateReminder = async (id, data) => {
    try {
      const response = await fetch(`${API_URL}/reminders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.success) {
        await fetchReminders();
        setEditingReminder(null);
        const saved = localStorage.getItem("firedReminderIds");
        if (saved) {
          const next = new Set(JSON.parse(saved));
          next.delete(id);
          localStorage.setItem("firedReminderIds", JSON.stringify([...next]));
        }
      }
      return result;
    } catch (error) {
      console.error("Error updating reminder:", error);
      return { success: false, message: "Network error" };
    }
  };

  const handleDeleteReminder = async (id) => {
    if (!confirm("Delete this reminder?")) return;
    try {
      const response = await fetch(`${API_URL}/reminders/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) {
        await fetchReminders();
      }
    } catch (error) {
      console.error("Error deleting reminder:", error);
    }
  };

  const handleSnoozeReminder = async (id, duration = 5) => {
    try {
      const response = await fetch(`${API_URL}/reminders/${id}/snooze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ snoozeDuration: duration }),
      });
      const result = await response.json();
      if (result.success) await fetchReminders();
    } catch (error) {
      console.error("Error snoozing reminder:", error);
    }
  };

  const handleCompleteReminder = async (id) => {
    try {
      const response = await fetch(`${API_URL}/reminders/${id}/complete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) await fetchReminders();
    } catch (error) {
      console.error("Error completing reminder:", error);
    }
  };

  const formatTime = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (date) => {
    if (!date) return "—";
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getTypeIcon = (type) => {
    const icons = {
      meeting: <Users className="w-4 h-4" />,
      task: <Check className="w-4 h-4" />,
      activity: <Activity className="w-4 h-4" />,
      break: <Coffee className="w-4 h-4" />,
      custom: <Bell className="w-4 h-4" />,
    };
    return icons[type] || <Bell className="w-4 h-4" />;
  };

  const getTypeColor = (type) => {
    const colors = {
      meeting: "bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
      task: "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
      activity: "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400",
      break: "bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400",
      custom: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
    };
    return colors[type] || colors.custom;
  };

  const activeList =
    activeTab === "today"
      ? todayReminders
      : activeTab === "upcoming"
      ? upcomingReminders
      : reminders;

  const emptyMessages = {
    today: { icon: "🎉", title: "No reminders for today", subtitle: "All caught up!" },
    upcoming: { icon: "📅", title: "No upcoming reminders", subtitle: "Your schedule is clear for the next week." },
    all: { icon: "🔔", title: "No reminders yet", subtitle: "Create your first reminder to get started." },
  };

  const empty = emptyMessages[activeTab];

  return (
    <div className="p-2 lg:p-2">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🔔 Reminders
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Never miss an important moment
            </p>
          </div>
          <button
            onClick={() => {
              setEditingReminder(null);
              setShowModal(true);
            }}
            className="px-3 py-2 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            New Reminder
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto">
          {[
            { id: "today", label: "Today", icon: <Clock className="w-4 h-4" />, count: todayReminders.length },
            { id: "upcoming", label: "Upcoming", icon: <Calendar className="w-4 h-4" />, count: upcomingReminders.length },
            { id: "all", label: "All", icon: <Bell className="w-4 h-4" />, count: reminders.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-violet-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
          </div>
        ) : activeList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-4xl mb-3">{empty.icon}</div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {empty.title}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {empty.subtitle}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {activeList.map((reminder) => (
              <div
                key={reminder.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-3.5 transition hover:shadow-md ${
                  reminder.snoozedUntil &&
                  new Date(reminder.snoozedUntil) > new Date()
                    ? "border-yellow-400 dark:border-yellow-600"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`p-1.5 rounded-lg flex-shrink-0 ${getTypeColor(
                          reminder.reminderType
                        )}`}
                      >
                        {getTypeIcon(reminder.reminderType)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {reminder.title}
                        </h3>
                        {reminder.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {reminder.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTime(reminder.reminderDateTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(reminder.reminderDateTime)}
                      </span>
                      {reminder.snoozedUntil && (
                        <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                          <Pause className="w-3 h-3" />
                          Snoozed until {formatTime(reminder.snoozedUntil)}
                        </span>
                      )}
                      {reminder.isRecurring && (
                        <span className="text-violet-600 dark:text-violet-400 flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {reminder.recurringPattern}
                        </span>
                      )}
                      {reminder.Activity && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          {reminder.Activity.icon} {reminder.Activity.name}
                        </span>
                      )}
                      {reminder.sound && reminder.sound !== "silent" && (
                        <span className="flex items-center gap-1">
                          <Volume2 className="w-3 h-3" />
                          {reminder.sound}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button
                      onClick={() => handleSnoozeReminder(reminder.id)}
                      className="p-1.5 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      title="Snooze 5 min"
                    >
                      <Pause className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleCompleteReminder(reminder.id)}
                      className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      title="Mark as done"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setEditingReminder(reminder);
                        setShowModal(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reminder Drawer */}
      <ReminderDrawer
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingReminder(null);
        }}
        onSave={async (data) => {
          if (editingReminder) {
            return handleUpdateReminder(editingReminder.id, data);
          } else {
            return handleCreateReminder(data);
          }
        }}
        initialData={editingReminder}
      />
    </div>
  );
}