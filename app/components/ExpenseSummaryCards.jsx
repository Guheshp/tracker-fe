"use client";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatCurrency } from "../../lib/expenseConstants";

export default function ExpenseSummaryCards({ expenses = [] }) {
  // Compute totals
  const income = expenses
    .filter((e) => e.type === 1)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const spent = expenses
    .filter((e) => e.type === 2)
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const balance = income - spent;

  const cards = [
    {
      label: "Total Income",
      value: formatCurrency(income),
      icon: <TrendingUp className="w-5 h-5" />,
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      valueColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total Spent",
      value: formatCurrency(spent),
      icon: <TrendingDown className="w-5 h-5" />,
      iconBg: "bg-rose-100 dark:bg-rose-900/30",
      iconColor: "text-rose-600 dark:text-rose-400",
      valueColor: "text-rose-600 dark:text-rose-400",
    },
    {
      label: "Balance",
      value: formatCurrency(balance),
      icon: <Wallet className="w-5 h-5" />,
      iconBg: "bg-violet-100 dark:bg-violet-900/30",
      iconColor: "text-violet-600 dark:text-violet-400",
      valueColor:
        balance >= 0
          ? "text-violet-600 dark:text-violet-400"
          : "text-rose-600 dark:text-rose-400",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              {card.label}
            </p>
            <div className={`p-2 rounded-lg ${card.iconBg} ${card.iconColor}`}>
              {card.icon}
            </div>
          </div>
          <p className={`text-xl font-bold ${card.valueColor}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}