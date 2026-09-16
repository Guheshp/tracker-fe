"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import useAuthStore from "../authStore";
import {
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Menu,
  Calendar as CalendarIcon,
  UserPlus,
  X,
} from "lucide-react";

export default function Navbar({ onMenuClick }) {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Calendar
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Feature popup
  const [showFeaturePopup, setShowFeaturePopup] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced user search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/users/search?query=${encodeURIComponent(searchQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (res.ok) setResults(data.users || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery, token]);

  const handleConnect = () => {
    // For now — show the "working on this feature" popup
    setShowFeaturePopup(true);
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // =========================
  // CALENDAR HELPERS
  // =========================
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const changeCalendarMonth = (delta) => {
    setCalendarDate(
      new Date(calendarDate.getFullYear(), calendarDate.getMonth() + delta, 1)
    );
  };

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const isToday = (date) => isSameDay(date, new Date());

  const buildCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day));
    }
    return cells;
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="h-full flex items-center justify-between gap-3 px-4 lg:px-6">
          {/* =========================
              LEFT — Hamburger + Logo
          ========================= */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>

            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <span className="text-base">📊</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  Activity Tracker
                </h1>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">
                  Track. Improve. Repeat.
                </p>
              </div>
            </Link>
          </div>

          {/* =========================
              RIGHT — Search + Calendar + Theme + User
          ========================= */}
          <div className="flex items-center gap-2 flex-shrink-0">

            {/* SEARCH */}
            <div ref={searchRef} className="relative hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
                  className="w-48 xl:w-64 pl-10 pr-10 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-violet-500 border-t-transparent"></div>
                  </div>
                )}
              </div>

              {/* Search results — with Connect button */}
              {showResults && searchQuery.length >= 2 && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto z-50">
                  {results.length > 0 ? (
                    results.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {u.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {u.email}
                          </p>
                        </div>
                        <button
                          onClick={handleConnect}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded-lg transition flex-shrink-0"
                        >
                          <UserPlus className="w-3 h-3" />
                          Connect
                        </button>
                      </div>
                    ))
                  ) : !isSearching ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                      No users found
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Mobile search */}
            <button
              onClick={() => router.push("/search")}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Search"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* CALENDAR */}
            <div ref={calendarRef} className="relative">
              <button
                onClick={() => setShowCalendar((v) => !v)}
                className="flex items-center gap-2 px-2.5 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                aria-label="Open calendar"
              >
                <CalendarIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <span className="hidden sm:inline text-xs font-medium text-gray-700 dark:text-gray-300">
                  {monthNames[selectedDate.getMonth()].slice(0, 3)}{" "}
                  {selectedDate.getDate()}
                </span>
              </button>

              {showCalendar && (
                <div className="absolute top-full right-0 mt-2 w-[320px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => changeCalendarMonth(-1)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {monthNames[calendarDate.getMonth()]}{" "}
                      {calendarDate.getFullYear()}
                    </span>
                    <button
                      onClick={() => changeCalendarMonth(1)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-3">
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                        <div
                          key={i}
                          className="text-[10px] font-semibold text-gray-400 text-center"
                        >
                          {d}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {buildCalendarDays().map((date, i) => {
                        if (!date) return <div key={i} />;

                        const selected = isSameDay(date, selectedDate);
                        const today = isToday(date);

                        let cellClass =
                          "aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition cursor-pointer";

                        if (selected) {
                          cellClass +=
                            " bg-violet-600 text-white shadow-md shadow-violet-500/30";
                        } else if (today) {
                          cellClass +=
                            " bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-1 ring-violet-400";
                        } else {
                          cellClass +=
                            " text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";
                        }

                        return (
                          <button
                            key={i}
                            onClick={() => {
                              setSelectedDate(date);
                              setShowCalendar(false);
                            }}
                            className={cellClass}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 px-3 py-2 flex items-center justify-between">
                    <button
                      onClick={() => {
                        const today = new Date();
                        setSelectedDate(today);
                        setCalendarDate(today);
                      }}
                      className="text-xs font-medium text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setShowCalendar(false)}
                      className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              aria-label="Toggle theme"
            >
              {mounted && theme === "dark" ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>

            {/* User dropdown */}
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">
                    {user?.name?.split(" ")[0]}
                  </p>
                </div>
                <ChevronDown
                  className={`hidden xl:block w-3.5 h-3.5 text-gray-400 transition-transform ${
                    showProfile ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showProfile && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold">
                        {user?.name?.charAt(0)?.toUpperCase() || "U"}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {user?.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    {/* My Profile → /profile/me */}
<Link
  href={`/profile/${user?.id}`}
  onClick={() => setShowProfile(false)}
  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
>
  <User className="w-4 h-4" />
  My Profile
</Link>
                    {/* <button
                      onClick={() => setShowProfile(false)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button> */}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* =========================
          FEATURE POPUP
      ========================= */}
      {showFeaturePopup && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/50"
            onClick={() => setShowFeaturePopup(false)}
          />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 pointer-events-none">
            <div
              className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Coming Soon
                </h3>
                <button
                  onClick={() => setShowFeaturePopup(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 text-center">
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-violet-500/30">
                  <UserPlus className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  Connect Feature
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  We're working on this feature. Soon you'll be able to send
                  connect requests, follow friends, and share your progress with
                  them.
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  Stay tuned! 🚀
                </p>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => setShowFeaturePopup(false)}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition text-sm font-medium"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}