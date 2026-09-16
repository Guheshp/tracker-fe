// ================================
// EXPENSE ENUM MAPPINGS
// ================================

export const EXPENSE_TYPES = [
  { value: 1, label: "Income", color: "emerald" },
  { value: 2, label: "Expense", color: "rose" },
];

export const EXPENSE_CATEGORIES = [
  { value: 1, label: "Food" },
  { value: 2, label: "Transport" },
  { value: 3, label: "Shopping" },
  { value: 4, label: "Bills" },
  { value: 5, label: "Entertainment" },
  { value: 6, label: "Health" },
  { value: 7, label: "Education" },
  { value: 8, label: "Salary" },
  { value: 9, label: "Investment" },
  { value: 10, label: "Other" },
];

export const PAYMENT_METHODS = [
  { value: 1, label: "Cash" },
  { value: 2, label: "Card" },
  { value: 3, label: "UPI" },
  { value: 4, label: "Net Banking" },
  { value: 5, label: "Wallet" },
];

// Helper lookups
export const getTypeLabel = (v) =>
  EXPENSE_TYPES.find((t) => t.value === v)?.label || "Unknown";

export const getCategoryLabel = (v) =>
  EXPENSE_CATEGORIES.find((c) => c.value === v)?.label || "Uncategorized";

export const getPaymentLabel = (v) =>
  PAYMENT_METHODS.find((p) => p.value === v)?.label || "Unknown";

// Category icon map (visual sugar)
export const CATEGORY_ICONS = {
  1: "🍔",
  2: "🚕",
  3: "🛍️",
  4: "🧾",
  5: "🎬",
  6: "💊",
  7: "📚",
  8: "💰",
  9: "📈",
  10: "📦",
};

export const getCategoryIcon = (v) => CATEGORY_ICONS[v] || "📋";

// Currency formatter
export const formatCurrency = (amount) => {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(n);
};

// Date helpers
export const toDateInputValue = (ms) => {
  if (!ms) return "";
  const d = new Date(Number(ms));
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export const toTimestampMs = (dateStr) => {
  if (!dateStr) return Date.now();
  return new Date(dateStr).getTime();
};

export const formatDate = (ms) => {
  if (!ms) return "—";
  return new Date(Number(ms)).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};