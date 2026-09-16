"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Calendar, Award, Target, TrendingUp } from "lucide-react";
import useAuthStore from "../../../authStore";

export default function UserProfile() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId;
  const { user, token, isLoading, checkAuth } = useAuthStore();
  const [profileUser, setProfileUser] = useState(null);
  const [activities, setActivities] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
   const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';


  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (user && userId) {
      fetchUserProfile();
    }
  }, [user, isLoading, userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `${API_URL}/users/profile/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      const data = await response.json();

      if (response.ok) {
        setProfileUser(data.user);
        setActivities(data.activities || []);
        setProgress(data.progress);
      } else {
        setError(data.message || "Failed to load profile");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:underline flex items-center gap-2 justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">User not found</p>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:underline flex items-center gap-2 justify-center"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  const weeklyProgress = progress?.weeks || [];
  const monthlyData = progress?.monthly || { completedDays: 0, totalDays: 0, completionRate: 0 };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-2">
      <div className="">
        {/* Back Button */}
        {/* <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Search
        </Link> */}

        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-2 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {profileUser.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {profileUser.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {profileUser.email}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Joined {new Date(profileUser.joinedAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4 text-yellow-500" />
                  {monthlyData.completionRate || 0}% Completion Rate
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Activities</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{activities.length || 10}</p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Days Completed</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {monthlyData.completedDays || 0} / {monthlyData.totalDays || 30}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Consistency</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {monthlyData.completionRate || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Progress */}
        {weeklyProgress.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-2 border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
              Weekly Progress
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {weeklyProgress.map((week) => (
                <div key={week.week} className="text-center p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                    Week {week.week}
                  </p>
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
          </div>
        )}

        {/* Activities */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-4">
            Activities Tracked
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(activities.length > 0 ? activities : [
              "Wake Up Early", "Exercise", "Healthy Food", "Drink Water", 
              "Study / Learn", "Work / Project", "Read", "Meditation", 
              "No Social Media", "Sleep on Time"
            ]).map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-lg"
              >
                <span className="text-lg">{activity.icon || '📋'}</span>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {activity.name || activity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}