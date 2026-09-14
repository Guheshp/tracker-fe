"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Bell, 
  Plus, 
  Clock, 
  Check, 
  X, 
  Volume2,
  Calendar,
  AlarmClock,
  Zap,
  Coffee,
  MoreVertical,
  Pause,
  Trash2,
  Users,
  Activity
} from "lucide-react";
import useAuthStore from "../../authStore";
import ReminderModal from "../../components/ReminderModal";


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
  const [activeReminder, setActiveReminder] = useState(null);
  const [showSoundSelector, setShowSoundSelector] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (user && token) {
      fetchReminders();
    }
  }, [user, isLoading, token]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const [todayRes, upcomingRes, allRes] = await Promise.all([
        fetch("http://localhost:5000/api/reminders/today", {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/reminders/upcoming", {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/reminders", {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const todayData = await todayRes.json();
      const upcomingData = await upcomingRes.json();
      const allData = await allRes.json();

      if (todayData.success) setTodayReminders(todayData.reminders);
      if (upcomingData.success) setUpcomingReminders(upcomingData.reminders);
      if (allData.success) setReminders(allData.reminders);
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async (data) => {
    try {
      const response = await fetch("http://localhost:5000/api/reminders", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
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
      const response = await fetch(`http://localhost:5000/api/reminders/${id}`, {
        method: "PUT",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      if (result.success) {
        await fetchReminders();
        setEditingReminder(null);
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
      const response = await fetch(`http://localhost:5000/api/reminders/${id}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
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
      const response = await fetch(`http://localhost:5000/api/reminders/${id}/snooze`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ snoozeDuration: duration })
      });
      const result = await response.json();
      if (result.success) {
        await fetchReminders();
        // Play snooze sound
        playSound('snooze');
      }
    } catch (error) {
      console.error("Error snoozing reminder:", error);
    }
  };

  const handleCompleteReminder = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/reminders/${id}/complete`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      if (result.success) {
        await fetchReminders();
        playSound('complete');
      }
    } catch (error) {
      console.error("Error completing reminder:", error);
    }
  };

  const playSound = (type) => {
    const audio = new Audio(`/sounds/${type}.mp3`);
    audio.play().catch(() => {});
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getTypeIcon = (type) => {
    const icons = {
      meeting: <Users className="w-4 h-4" />,
      task: <Check className="w-4 h-4" />,
      activity: <Activity className="w-4 h-4" />,
      break: <Coffee className="w-4 h-4" />,
      custom: <Bell className="w-4 h-4" />
    };
    return icons[type] || <Bell className="w-4 h-4" />;
  };

  const getTypeColor = (type) => {
    const colors = {
      meeting: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
      task: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
      activity: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
      break: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
      custom: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
    };
    return colors[type] || colors.custom;
  };



  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🔔 Reminders
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Never miss an important moment
            </p>
          </div>
          <button
            onClick={() => {
              setEditingReminder(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Reminder
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: "today", label: "Today", icon: <Clock className="w-4 h-4" /> },
            { id: "upcoming", label: "Upcoming", icon: <Calendar className="w-4 h-4" /> },
            { id: "all", label: "All", icon: <Bell className="w-4 h-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Reminders List */}
        <div className="space-y-3">
          {activeTab === "today" && todayReminders.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <Bell className="w-16 h-16 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p>No reminders for today</p>
              <p className="text-sm">All caught up! 🎉</p>
            </div>
          )}

          {(activeTab === "today" ? todayReminders : 
            activeTab === "upcoming" ? upcomingReminders : 
            reminders).map((reminder) => (
            <div
              key={reminder.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition hover:shadow-md ${
                reminder.snoozedUntil && new Date(reminder.snoozedUntil) > new Date()
                  ? "border-yellow-400 dark:border-yellow-600"
                  : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`p-1.5 rounded-lg ${getTypeColor(reminder.reminderType)}`}>
                      {getTypeIcon(reminder.reminderType)}
                    </span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {reminder.title}
                      </h3>
                      {reminder.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          {reminder.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(reminder.reminderDateTime)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(reminder.reminderDateTime)}
                    </span>
                    {reminder.snoozedUntil && (
                      <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                        <Pause className="w-3.5 h-3.5" />
                        Snoozed until {formatTime(reminder.snoozedUntil)}
                      </span>
                    )}
                    {reminder.isRecurring && (
                      <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5" />
                        {reminder.recurringPattern}
                      </span>
                    )}
                    {reminder.Activity && (
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        {reminder.Activity.icon} {reminder.Activity.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5" />
                      {reminder.sound}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSnoozeReminder(reminder.id)}
                    className="p-2 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="Snooze 5 min"
                  >
                    <Pause className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleCompleteReminder(reminder.id)}
                    className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="Mark as done"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingReminder(reminder);
                      setShowModal(true);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="Edit"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteReminder(reminder.id)}
                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reminder Modal */}
      {showModal && (
        <ReminderModal
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
      )}
    </div>
  );
}