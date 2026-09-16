"use client";
import { useEffect, useState } from "react";
import {
  TrendingUp,
  Award,
  Calendar,
  Flame,
  Target,
  Activity,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import useAuthStore from "../../authStore";

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#10b981", "#ef4444"];

export default function ProgressPage() {
  const { user, token, isLoading, checkAuth } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [heatmap, setHeatmap] = useState([]);
  const [trend, setTrend] = useState([]);
  const [insights, setInsights] = useState([]);
  const [milestones, setMilestones] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [trendDays, setTrendDays] = useState(30);
  const [loading, setLoading] = useState(true);
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';


  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user && token) fetchAllData();
  }, [user, token, selectedMonth, selectedYear, trendDays]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchStats(),
        fetchHeatmap(),
        fetchTrend(),
        fetchInsights(),
        fetchMilestones(),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const authHeaders = { Authorization: `Bearer ${token}` };

  const fetchStats = async () => {
    const res = await fetch(`${API_URL}/activities/stats`, { headers: authHeaders });
    const data = await res.json();
    if (data.success) setStats(data.stats);
  };

  const fetchHeatmap = async () => {
    const res = await fetch(
      `${API_URL}/activities/heatmap?month=${selectedMonth}&year=${selectedYear}`,
      { headers: authHeaders }
    );
    const data = await res.json();
    if (data.success) setHeatmap(data.heatmap);
  };

  const fetchTrend = async () => {
    const res = await fetch(
      `${API_URL}/activities/trend?days=${trendDays}`,
      { headers: authHeaders }
    );
    const data = await res.json();
    if (data.success) setTrend(data.trend);
  };

  const fetchInsights = async () => {
    const res = await fetch(`${API_URL}/activities/insights`, { headers: authHeaders });
    const data = await res.json();
    if (data.success) setInsights(data.insights);
  };

  const fetchMilestones = async () => {
    const res = await fetch(`${API_URL}/activities/milestones`, { headers: authHeaders });
    const data = await res.json();
    if (data.success) setMilestones(data);
  };

  const changeMonth = (delta) => {
    let m = selectedMonth + delta;
    let y = selectedYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Chart data preparation
  const trendChartData = trend.slice(-trendDays).map((d) => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    percentage: d.percentage,
    completed: d.completed,
    total: d.total,
  }));

  const insightsChartData = insights.slice(0, 8).map((a) => ({
    name: a.name.length > 18 ? a.name.substring(0, 18) + "…" : a.name,
    percentage: a.percentage,
    completed: a.completed,
    total: a.total,
  }));

  // Weekly completion distribution (for pie)
  const weeklyDistribution = (() => {
    const buckets = { "0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0 };
    heatmap.forEach((d) => {
      if (d.percentage <= 25) buckets["0-25%"]++;
      else if (d.percentage <= 50) buckets["26-50%"]++;
      else if (d.percentage <= 75) buckets["51-75%"]++;
      else buckets["76-100%"]++;
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  })();

  if (loading && !stats) {
    return (
      <div className="p-4 lg:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="h-8 w-56 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
          <div className="h-80 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 lg:p-2">
      <div className="max-w-7xl mx-auto space-y-2">

        {/* Header */}
        {/* <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Progress Analytics
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Visualize your journey and track your improvement over time
          </p>
        </div> */}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <StatCard
              title="Tracked Days"
              value={stats.trackedDays || 0}
              suffix={`/ ${stats.totalDays}`}
              icon={<Calendar className="w-5 h-5" />}
              color="blue"
              progress={(stats.trackedDays / stats.totalDays) * 100}
            />
            <StatCard
              title="Current Streak"
              value={stats.currentStreak || 0}
              suffix="days"
              icon={<Flame className="w-5 h-5" />}
              color="orange"
              subtitle={`Best: ${stats.bestStreak || 0} days`}
            />
            <StatCard
              title="Completion Rate"
              value={`${stats.completionRate || 0}%`}
              icon={<Target className="w-5 h-5" />}
              color="green"
              progress={stats.completionRate || 0}
            />
            <StatCard
              title="Activities"
              value={stats.activitiesCount || 0}
              icon={<Activity className="w-5 h-5" />}
              color="purple"
              subtitle="Tracked daily"
            />
          </div>
        )}

        {/* Trend Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-violet-500" />
                Completion Trend
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Daily completion percentage over time
              </p>
            </div>
            <div className="flex gap-2">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setTrendDays(d)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    trendDays === d
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          <div className="h-72">
            {trendChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData}>
                  <defs>
                    <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "12px",
                    }}
                    formatter={(value, name) => [
                      name === "percentage" ? `${value}%` : value,
                      name === "percentage" ? "Completion" : name,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="percentage"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#colorPct)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-400">
                No trend data yet
              </div>
            )}
          </div>
        </div>

        {/* Heatmap + Pie side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">

          {/* Heatmap */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Monthly Heatmap
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {heatmap.filter((d) => d.percentage > 0).length} active days
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeMonth(-1)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[120px] text-center">
                  {monthNames[selectedMonth - 1]} {selectedYear}
                </span>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-center text-[10px] font-medium text-gray-400 py-1">
                  {d}
                </div>
              ))}
              {heatmap.map((day, idx) => {
                const color =
                  day.percentage === 0 ? "bg-gray-100 dark:bg-gray-700/50 text-gray-400" :
                  day.percentage < 25 ? "bg-green-200 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                  day.percentage < 50 ? "bg-green-300 dark:bg-green-800/60 text-green-800 dark:text-green-200" :
                  day.percentage < 75 ? "bg-green-500 dark:bg-green-600 text-white" :
                  "bg-green-700 dark:bg-green-500 text-white";
                return (
                  <div
                    key={idx}
                    className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold transition-all hover:scale-110 cursor-default ${color}`}
                    title={`Day ${day.day}: ${day.completed}/${day.total} (${day.percentage}%)`}
                  >
                    {day.day}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-2 text-[10px] text-gray-500 mt-3">
              <span>Less</span>
              <div className="w-3 h-3 rounded bg-gray-100 dark:bg-gray-700/50"></div>
              <div className="w-3 h-3 rounded bg-green-200 dark:bg-green-900/40"></div>
              <div className="w-3 h-3 rounded bg-green-300 dark:bg-green-800/60"></div>
              <div className="w-3 h-3 rounded bg-green-500 dark:bg-green-600"></div>
              <div className="w-3 h-3 rounded bg-green-700 dark:bg-green-500"></div>
              <span>More</span>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-500" />
              Distribution
            </h2>
            <div className="h-56">
              {weeklyDistribution.some((d) => d.value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={weeklyDistribution}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {weeklyDistribution.map((entry, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1f2937",
                        border: "none",
                        borderRadius: "8px",
                        color: "white",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-gray-400">
                  No data
                </div>
              )}
            </div>
            <div className="space-y-1.5 mt-2">
              {weeklyDistribution.map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: COLORS[i % COLORS.length] }}
                    ></span>
                    <span className="text-gray-600 dark:text-gray-400">{entry.name}</span>
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">{entry.value} days</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Insights Bar Chart */}
        {insights.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Activity Performance
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Completion rate per activity — spot your strengths and weaknesses
              </p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={insightsChartData}
                  layout="vertical"
                  margin={{ left: 20, right: 30 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={130}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "white",
                      fontSize: "12px",
                    }}
                    formatter={(value) => [`${value}%`, "Completion"]}
                  />
                  <Bar dataKey="percentage" radius={[0, 6, 6, 0]}>
                    {insightsChartData.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.percentage >= 80 ? "#10b981" :
                          entry.percentage >= 50 ? "#f59e0b" :
                          "#ef4444"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Milestones */}
        {milestones && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  Milestones
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Achievements you've unlocked
                </p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current</p>
                  <p className="text-2xl font-bold text-orange-500">{milestones.currentStreak || 0} 🔥</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Best</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{milestones.bestStreak || 0}</p>
                </div>
              </div>
            </div>

            {milestones.nextMilestone && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  🎯 {milestones.nextMilestone.days} more days to <span className="font-semibold">{milestones.nextMilestone.title}</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {milestones.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-lg border text-center transition ${
                    m.achieved
                      ? "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
                      : "bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-700 opacity-60"
                  }`}
                >
                  <div className="text-3xl mb-2">{m.icon}</div>
                  <p className="text-xs font-semibold text-gray-900 dark:text-white">
                    {m.title}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    {m.description}
                  </p>
                  {m.achieved && (
                    <div className="mt-2 text-green-600 dark:text-green-400 text-[10px] font-semibold">
                      ✓ Unlocked
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

/* =========================
   Stat Card Component
========================= */
function StatCard({ title, value, suffix, icon, color, progress, subtitle }) {
  const colorClasses = {
    blue: "text-blue-600 dark:text-blue-400",
    orange: "text-orange-500 dark:text-orange-400",
    green: "text-green-600 dark:text-green-400",
    purple: "text-violet-600 dark:text-violet-400",
  };
  const barColors = {
    blue: "bg-blue-500",
    orange: "bg-orange-500",
    green: "bg-green-500",
    purple: "bg-violet-500",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <span className={colorClasses[color]}>{icon}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
        {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${barColors[color]}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          ></div>
        </div>
      )}
      {subtitle && (
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2">{subtitle}</p>
      )}
    </div>
  );
}