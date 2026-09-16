"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Home,
  BarChart3,
  Bell,
  Search,
  Target,
  ChevronRight,
  Wallet,
  X,
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const navLinks = [
    { name: "Dashboard", href: "/dashboard", icon: <Home className="w-5 h-5" /> },
    { name: "Progress", href: "/progress", icon: <BarChart3 className="w-5 h-5" /> },
    { name: "Reminders", href: "/reminders", icon: <Bell className="w-5 h-5" /> },
    { name: "Expenses", href: "/expenses", icon: <Wallet className="w-5 h-5" /> }, 
    // { name: "Goals", href: "/goals", icon: <Target className="w-5 h-5" /> },
  ];

  const isActive = (href) => pathname === href || pathname.startsWith(href + "/");

  const SidebarContent = () => (
    <>
      {/* Mobile close button */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-sm">📊</span>
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-sm">
            Menu
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
          Menu
        </p>

        {navLinks.map((link) => {
          const active = isActive(link.href);
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={onClose}
              className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                {link.icon}
                <span>{link.name}</span>
              </div>
              {active && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* =========================
          DESKTOP SIDEBAR
      ========================= */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:top-16 lg:bottom-0 lg:w-64 z-20 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <SidebarContent />
      </aside>

      {/* =========================
          MOBILE DRAWER
      ========================= */}
      {isOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <aside className="lg:hidden fixed top-0 bottom-0 left-0 w-72 z-50 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
            <SidebarContent />
          </aside>
        </>
      )}
    </>
  );
}