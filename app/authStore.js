"use client";
import { create } from "zustand";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  activities: [],
  totalDaysComplete: 0,
  error: null,

  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isLoading: false, user: null, token: null });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        set({ user: data.user, token, isLoading: false });
        await get().fetchActivities();
      } else {
        localStorage.removeItem("token");
        set({ user: null, token: null, isLoading: false });
      }
    } catch (error) {
      console.error("Check auth error:", error);
      localStorage.removeItem("token");
      set({ user: null, token: null, isLoading: false });
    }
  },

  register: async (name, email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        set({
          user: data.user,
          token: data.token,
          isLoading: false,
          error: null,
        });
        await get().fetchActivities();
        return { success: true };
      } else {
        set({ error: data.message || "Registration failed" });
        return { success: false, error: data.message || "Registration failed" };
      }
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        set({
          user: data.user,
          token: data.token,
          isLoading: false,
          error: null,
        });
        await get().fetchActivities();
        return { success: true };
      } else {
        set({ error: data.message || "Login failed" });
        return { success: false, error: data.message || "Login failed" };
      }
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  fetchActivities: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/activities`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        set({ activities: data.activities || [] });
        await get().fetchTodayProgress();
      } else {
        set({ activities: [] });
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      set({ activities: [] });
    }
  },

  fetchTodayProgress: async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const response = await fetch(
        `${API_URL}/activities/daily?date=${today}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        set({ totalDaysComplete: data.completed || 0 });
      }
    } catch (error) {
      console.error("Error fetching today progress:", error);
    }
  },

  toggleActivity: async (activityId) => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const week = Math.ceil(parseInt(today.split("-")[2]) / 7);
      const day = parseInt(today.split("-")[2]);

      const response = await fetch(`${API_URL}/activities/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activityId, date: today, week, day }),
      });

      if (response.ok) {
        await get().fetchActivities();
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error("Error toggling activity:", error);
      return { success: false, error: error.message };
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({
      user: null,
      token: null,
      activities: [],
      totalDaysComplete: 0,
      isLoading: false,
    });
  },

  resetDailyActivities: async () => {
    await get().fetchActivities();
  },
}));

export default useAuthStore;
