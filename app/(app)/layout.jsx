"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import useAuthStore from "../authStore";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function AppLayout({ children }) {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950">
      <Navbar onMenuClick={() => setMobileMenuOpen(true)} />
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <main className="pt-16 lg:pl-64">
        <div className="min-h-[calc(100vh-4rem)]">{children}</div>
      </main>
    </div>
  );
}