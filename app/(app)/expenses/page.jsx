"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Filter, Search, X } from "lucide-react";
import useAuthStore from "../../authStore";
import ExpenseDrawer from "../../components/ExpenseDrawer";
import ExpenseSummaryCards from "../../components/ExpenseSummaryCards";
import {
  getCategoryLabel,
  getCategoryIcon,
  getPaymentLabel,
  formatCurrency,
  formatDate,
  EXPENSE_CATEGORIES,
} from "../../../lib/expenseConstants";

export default function ExpensesPage() {
  const router = useRouter();
  const { user, token, isLoading, checkAuth } = useAuthStore();

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDrawer, setShowDrawer] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("all"); // all | 1 | 2
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
    if (user && token) {
      fetchExpenses();
    }
  }, [user, isLoading, token]);

  // ================================
  // API CALLS
  // ================================
  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/expenses/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user?.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setExpenses(data.data || []);
      }
    } catch (err) {
      console.error("Error fetching expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (payload) => {
    try {
      const res = await fetch(`${API_URL}/expenses/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchExpenses();
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const handleUpdateExpense = async (payload) => {
    try {
      const res = await fetch(`${API_URL}/expenses/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchExpenses();
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const res = await fetch(`${API_URL}/expenses/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user?.id, expenseId }),
      });
      const data = await res.json();
      if (res.ok) {
        await fetchExpenses();
        return { success: true };
      }
      return { success: false, error: data.message };
    } catch {
      return { success: false, error: "Network error" };
    }
  };

  // ================================
  // FILTERED LIST
  // ================================
  const filteredExpenses = useMemo(() => {
    let list = [...expenses];

    if (filterType !== "all") {
      list = list.filter((e) => e.type === Number(filterType));
    }

    if (filterCategory !== "all") {
      list = list.filter((e) => e.category === Number(filterCategory));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.description || "").toLowerCase().includes(q),
      );
    }

    return list;
  }, [expenses, filterType, filterCategory, searchQuery]);

  if (isLoading || !user) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  return (
    <div className="p-2 lg:p-2">
      <div className="max-w-5xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              💰 Expenses
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Track your income and spending
            </p>
          </div>

          <button
            onClick={() => setShowDrawer(true)}
            className="px-3 py-2 text-xs font-medium bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Manage Expenses
          </button>
        </div>

        {/* SUMMARY CARDS */}
        <ExpenseSummaryCards expenses={expenses} />

        {/* FILTERS */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-2">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:outline-none focus:border-violet-500 dark:text-white"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type filter */}
            <div className="flex items-center gap-1">
              {[
                { value: "all", label: "All" },
                { value: "1", label: "Income" },
                { value: "2", label: "Expense" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterType(opt.value)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition ${
                    filterType === opt.value
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 border-0 text-gray-700 dark:text-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">All Categories</option>
                {EXPENSE_CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* LIST */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">💰</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No expenses found
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {expenses.length === 0
                  ? "Add your first transaction to get started"
                  : "Try adjusting your filters"}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Expense
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Category
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    Payment
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    Date
                  </th>
                  <th className="px-4 py-2.5 text-right text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => {
                  const isIncome = expense.type === 1;
                  return (
                    <tr
                      key={expense.id}
                      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg flex-shrink-0">
                            {getCategoryIcon(expense.category)}
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {expense.title}
                            </p>
                            {expense.description && (
                              <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                {expense.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                        {getCategoryLabel(expense.category)}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400 hidden md:table-cell">
                        {getPaymentLabel(expense.paymentMethod)}
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                        {formatDate(expense.expenseDate)}
                      </td>
                      <td
                        className={`px-4 py-3 text-right text-sm font-bold ${
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isIncome ? "+" : "−"}
                        {formatCurrency(expense.amount)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DRAWER */}
      <ExpenseDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        expenses={expenses}
        onExpenseAdd={handleAddExpense}
        onExpenseUpdate={handleUpdateExpense}
        onExpenseDelete={handleDeleteExpense}
        userId={user?.id}
      />
    </div>
  );
}
