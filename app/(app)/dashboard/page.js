"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Edit2, Clock, Sunrise, Sun, Sunset, Moon } from "lucide-react";
import useAuthStore from "../../authStore";
import ActivityManager from "../../components/ActivityManager";

export default function Dashboard() {
  const router = useRouter();
  const { user, activities, totalDaysComplete, toggleActivity, isLoading, checkAuth, token, fetchActivities } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState("");
  const [currentYear, setCurrentYear] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [dayLogs, setDayLogs] = useState({});
  const [showActivityManager, setShowActivityManager] = useState(false);
  const [canComplete, setCanComplete] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0 });

  const today = new Date();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    setCurrentMonth(monthNames[currentDate.getMonth()]);
    setCurrentYear(currentDate.getFullYear().toString());

    if (activities && activities.length > 0) {
      setCompletedCount(activities.filter(a => a.completed).length);
    } else {
      setCompletedCount(0);
    }

    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
    const savedLogs = localStorage.getItem(`dayLogs_${monthKey}`);
    if (savedLogs) {
      setDayLogs(JSON.parse(savedLogs));
    } else {
      setDayLogs({});
    }
  }, [user, isLoading, activities, currentDate]);

  const fetchTodayActivities = async () => {
    if (!token) return;
    try {
      const response = await fetch('http://localhost:5000/api/activities/today', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setCanComplete(data.canComplete);
        setTimeRemaining(data.timeRemaining || { hours: 0, minutes: 0 });
      }
    } catch (error) {
      console.error('Error fetching today activities:', error);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchTodayActivities();
    }
  }, [user, token]);

  // =====================
  // ACTIVITY CRUD HANDLERS
  // =====================
  const handleAddActivity = async (name, icon, startTime, endTime) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const response = await fetch('http://localhost:5000/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, icon, startTime, endTime })
      });
      const data = await response.json();
      if (response.ok) {
        await fetchActivities();
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const handleUpdateActivity = async (id, name, icon, startTime, endTime) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const response = await fetch(`http://localhost:5000/api/activities/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, icon, startTime, endTime })
      });
      const data = await response.json();
      if (response.ok) {
        await fetchActivities();
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const response = await fetch(`http://localhost:5000/api/activities/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        await fetchActivities();
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const handleDeleteAllDefaults = async () => {
    if (!token) return { success: false, error: 'Not authenticated' };
    try {
      const response = await fetch('http://localhost:5000/api/activities/defaults/all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        await fetchActivities();
        return { success: true, deletedCount: data.deletedCount };
      }
      return { success: false, error: data.message };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  // =====================
  // NAVIGATION
  // =====================
  const goToPrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToCurrentMonth = () => setCurrentDate(new Date());

  // =====================
  // DATE HELPERS
  // =====================
  const isTodayDate = (dayIndex) => {
    return currentDate.getFullYear() === today.getFullYear() &&
           currentDate.getMonth() === today.getMonth() &&
           dayIndex + 1 === today.getDate();
  };

  const isPastDate = (dayIndex) => {
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayIndex + 1);
    dateToCheck.setHours(0, 0, 0, 0);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    todayMidnight.setHours(0, 0, 0, 0);
    return dateToCheck < todayMidnight;
  };

  const isFutureDate = (dayIndex) => {
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayIndex + 1);
    dateToCheck.setHours(0, 0, 0, 0);
    const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    todayMidnight.setHours(0, 0, 0, 0);
    return dateToCheck > todayMidnight;
  };

  const canToggleDay = (dayIndex) => isTodayDate(dayIndex) && canComplete;

  const handleDayToggle = (activityId, dayIndex) => {
    if (!canToggleDay(dayIndex)) {
      if (isPastDate(dayIndex)) alert("❌ Cannot modify past days. History is locked.");
      else if (isFutureDate(dayIndex)) alert("⏳ Cannot mark future days. You can only track today.");
      else if (!canComplete) alert("⏰ Time's up for today! Come back tomorrow.");
      return;
    }

    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}`;
    const logKey = `${activityId}-day-${dayIndex}`;

    setDayLogs(prev => {
      const newLogs = { ...prev, [logKey]: !prev[logKey] };
      localStorage.setItem(`dayLogs_${monthKey}`, JSON.stringify(newLogs));
      return newLogs;
    });
    toggleActivity(activityId);
  };

  // =====================
  // TIME FORMATTING
  // =====================
  const formatTime = (time) => {
    if (!time) return null;
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const getTimeOfDay = (time) => {
    if (!time) return { icon: <Clock className="w-3 h-3" />, color: "text-gray-400" };
    const hour = parseInt(time.split(':')[0]);
    if (hour < 6) return { icon: <Moon className="w-3 h-3" />, color: "text-indigo-500" };
    if (hour < 12) return { icon: <Sunrise className="w-3 h-3" />, color: "text-orange-500" };
    if (hour < 17) return { icon: <Sun className="w-3 h-3" />, color: "text-yellow-500" };
    if (hour < 20) return { icon: <Sunset className="w-3 h-3" />, color: "text-pink-500" };
    return { icon: <Moon className="w-3 h-3" />, color: "text-blue-500" };
  };

  // =====================
  // SORT ACTIVITIES BY TIME
  // =====================
  const sortedActivities = useMemo(() => {
    const list = activities || [];

    return [...list].sort((a, b) => {
      if (a.startTime && !b.startTime) return -1;
      if (!a.startTime && b.startTime) return 1;
      if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
      return (a.order || 0) - (b.order || 0);
    });
  }, [activities]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // =====================
  // CALCULATIONS
  // =====================
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());

  const weeks = [];
  const daysPerWeek = 7;
  let weekStart = 1;
  while (weekStart <= daysInMonth) {
    const weekEnd = Math.min(weekStart + daysPerWeek - 1, daysInMonth);
    weeks.push({
      label: `WEEK ${weeks.length + 1}`,
      days: `DAY ${weekStart} – ${weekEnd}`,
      start: weekStart - 1,
      end: weekEnd,
      total: weekEnd - weekStart + 1
    });
    weekStart = weekEnd + 1;
  }

  const weeklyProgress = weeks.map((week) => {
    let completed = 0;
    if (sortedActivities.length === 0) {
      return { ...week, completed: 0 };
    }
    for (let i = week.start; i < week.end; i++) {
      const allCompleted = sortedActivities.every(activity => {
        const logKey = `${activity.id}-day-${i}`;
        return dayLogs[logKey] || false;
      });
      if (allCompleted) completed++;
    }
    return { ...week, completed };
  });

  const monthlyTotalDays = daysInMonth;
  let monthlyCompletedDays = 0;
  if (sortedActivities.length > 0) {
    for (let i = 0; i < daysInMonth; i++) {
      const allCompleted = sortedActivities.every(activity => {
        const logKey = `${activity.id}-day-${i}`;
        return dayLogs[logKey] || false;
      });
      if (allCompleted) monthlyCompletedDays++;
    }
  }

  const isCurrentMonth = currentDate.getMonth() === new Date().getMonth() &&
                         currentDate.getFullYear() === new Date().getFullYear();

  return (
    <div className="p:2 lg:p-2">
      <div className="max-w-full mx-auto">
        {/* Month Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-2 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <button
              onClick={goToPrevMonth}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-300 flex items-center gap-2 text-sm"
            >
              <span>◀</span> Previous
            </button>

            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentMonth} {currentYear}
              </h2>
              {!isCurrentMonth && (
                <button
                  onClick={goToCurrentMonth}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Today
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowActivityManager(!showActivityManager)}
                className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Manage Activities
              </button>
              <button
                onClick={goToNextMonth}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition text-gray-700 dark:text-gray-300 flex items-center gap-2 text-sm"
              >
                Next <span>▶</span>
              </button>
            </div>
          </div>
        </div>

        {showActivityManager && (
          <ActivityManager
            activities={sortedActivities}
            onActivityAdd={handleAddActivity}
            onActivityUpdate={handleUpdateActivity}
            onActivityDelete={handleDeleteActivity}
            onDeleteAllDefaults={handleDeleteAllDefaults}
            canComplete={canComplete}
            timeRemaining={timeRemaining}
            onClose={() => setShowActivityManager(false)}
            token={token}
          />
        )}

        {/* Activity Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
             <thead>
  <tr className="bg-gray-50 dark:bg-gray-700/50">
    <th className="px-2 py-2 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-gray-50 dark:bg-gray-900 z-20 min-w-[180px]">
      ACTIVITY
    </th>
    {Array.from({ length: daysInMonth }, (_, i) => {
      const isToday = isTodayDate(i);
      const isPast = isPastDate(i);
      const isFuture = isFutureDate(i);
      return (
        <th
          key={`day-${i}`}
          className={`px-1 py-1 text-center text-[10px] font-bold border-r border-gray-200 dark:border-gray-700 min-w-[32px] ${
            isToday ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' : ''
          } ${isPast ? 'text-gray-400 dark:text-gray-600' : ''} ${isFuture ? 'text-gray-400 dark:text-gray-600' : ''}`}
        >
          {i + 1}
          {isToday && <span className="block text-[8px] text-blue-500">Today</span>}
        </th>
      );
    })}
  </tr>
  <tr className="bg-gray-100 dark:bg-gray-700/30">
    <th className="px-2 py-1 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-gray-100 dark:bg-gray-900 z-20">
      Week
    </th>
    {weeks.map((week, index) => (
      <th
        key={`week-${index}`}
        colSpan={week.total}
        className="px-1 py-1 text-center text-[10px] font-bold text-blue-600 dark:text-blue-400 border-r border-gray-200 dark:border-gray-700"
      >
        WEEK {index + 1}
      </th>
    ))}
  </tr>
</thead>
<tbody>
  {sortedActivities.length === 0 ? (
    <tr>
      <td colSpan={daysInMonth + 1} className="px-4 py-16 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl">📋</div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            No activities yet
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Click "Manage Activities" to add your first activity
          </p>
        </div>
      </td>
    </tr>
  ) : (
    sortedActivities.map((activity, index) => {
      const tod = getTimeOfDay(activity.startTime);
      const hasTime = activity.startTime || activity.endTime;
      const rowBg = index % 2 === 0
        ? 'bg-white dark:bg-gray-800'
        : 'bg-gray-50/50 dark:bg-gray-800/50';
      const stickyBg = index % 2 === 0
        ? 'bg-white dark:bg-gray-800'
        : 'bg-gray-50 dark:bg-gray-900';

      return (
        <tr
          key={activity.id}
          className={`border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 ${rowBg}`}
        >
          <td className={`px-2 py-1.5 text-xs text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700 sticky left-0 z-10 min-w-[180px] ${stickyBg}`}>
            <div className="flex items-start gap-1.5">
              <span className="text-sm mt-0.5">{activity.icon || '📋'}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{activity.name}</div>
                {hasTime ? (
                  <div className={`flex items-center gap-1 text-[10px] ${tod.color} mt-0.5`}>
                    {tod.icon}
                    <span>
                      {activity.startTime ? formatTime(activity.startTime) : ""}
                      {activity.endTime ? ` → ${formatTime(activity.endTime)}` : ""}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />
                    <span>No time set</span>
                  </div>
                )}
              </div>
            </div>
          </td>
          {Array.from({ length: daysInMonth }, (_, i) => {
            const logKey = `${activity.id}-day-${i}`;
            const isDayChecked = dayLogs[logKey] || false;
            const isPast = isPastDate(i);
            const isFuture = isFutureDate(i);
            const isToday = isTodayDate(i);
            const canToggle = isToday && canComplete;

            return (
              <td
                key={i}
                className={`px-1 py-1 text-center border-r border-gray-100 dark:border-gray-700 transition ${
                  isDayChecked ? 'bg-green-50 dark:bg-green-900/20' : ''
                } ${
                  canToggle ? 'cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20' : 'cursor-not-allowed opacity-50'
                } ${
                  isPast ? 'bg-gray-50 dark:bg-gray-800/50' : ''
                } ${
                  isToday ? 'ring-1 ring-blue-400' : ''
                }`}
                onClick={() => handleDayToggle(activity.id, i)}
                title={
                  isPast ? "Past days cannot be modified" :
                  isFuture ? "Future days cannot be modified" :
                  !canComplete ? "Time's up for today!" :
                  "Click to toggle"
                }
              >
                <span className="text-lg">
                  {isDayChecked ? "✅" : "☐"}
                </span>
              </td>
            );
          })}
        </tr>
      );
    })
  )}
</tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded"></span>
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-400 rounded"></span>
            <span className="text-gray-600 dark:text-gray-400">Today (clickable)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded"></span>
            <span className="text-gray-400">Past (locked)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded opacity-50"></span>
            <span className="text-gray-400">Future (locked)</span>
          </div>
          {!canComplete && (
            <div className="flex items-center gap-1.5 text-red-500">
              <span className="w-4 h-4 bg-red-50 dark:bg-red-900/20 border border-red-400 rounded"></span>
              <span>⏰ Time's up!</span>
            </div>
          )}
        </div>

        {/* Weekly Progress */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
          {weeklyProgress.map((week, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-3 border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs font-bold text-gray-600 dark:text-gray-400">{week.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{week.days}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {week.completed} <span className="text-sm font-normal text-gray-400">/ {week.total}</span>
              </p>
              <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(week.completed / week.total) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Monthly Consistency */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {monthlyCompletedDays}
                <span className="text-base font-normal text-gray-400 dark:text-gray-500"> / {monthlyTotalDays}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Days Complete This Month</p>
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${monthlyTotalDays > 0 ? (monthlyCompletedDays / monthlyTotalDays) * 100 : 0}%` }}
                ></div>
              </div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                {monthlyCompletedDays === 0
                  ? `Start your ${currentMonth} journey today!`
                  : `Keep going! You're doing great in ${currentMonth}.`}
              </p>
            </div>
          </div>
        </div>

        {/* Notes & Reflection */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">NOTES & REFLECTION</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <p className="text-xs text-gray-700 dark:text-gray-300">💡 Small steps</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">make big changes</p>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <p className="text-xs text-gray-700 dark:text-gray-300">✨ Be consistent</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Build good habits</p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
              <p className="text-xs text-gray-700 dark:text-gray-300">🌟 Create</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">The life you want</p>
            </div>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
              <p className="text-xs text-gray-700 dark:text-gray-300">📈 Track</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">Your progress daily</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}