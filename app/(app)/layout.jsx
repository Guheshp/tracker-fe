"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "../authStore";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AuthShimmer from "../components/AuthShimmer";
import ReminderPopup from "../components/ReminderPopup";
import { useReminderScheduler } from "../hooks/useReminderScheduler";

export default function AppLayout({ children }) {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global reminder scheduler — runs on every (app) page
  useReminderScheduler();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return <AuthShimmer />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <main className="pt-16 lg:pl-64">
        <div className="min-h-[calc(100vh-4rem)]">{children}</div>
      </main>

      {/* Global reminder popup — shows on any page */}
      <ReminderPopup />
    </div>
  );
}