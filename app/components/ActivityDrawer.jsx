"use client";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import * as XLSX from "xlsx";
import EmojiPicker from "emoji-picker-react";
import {
  Plus,
  X,
  Check,
  Clock,
  AlertCircle,
  Trash,
  RefreshCw,
  CalendarClock,
  FileSpreadsheet,
  Download,
  Upload,
  ArrowLeft,
  Smile,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "../components/ui/drawer.jsx";

export default function ActivityDrawer({
  isOpen,
  onClose,
  activities,
  onActivityAdd,
  onDeleteAllDefaults,
  onActivityImported,
  canComplete,
  timeRemaining,
  token,
}) {
  // view: "menu" | "add" | "import"
  const [view, setView] = useState("menu");
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // ADD FORM
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📋");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingDefaults, setIsDeletingDefaults] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // IMPORT
  const [parsed, setParsed] = useState([]);
  const [fileName, setFileName] = useState("");
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  // Refs
  const emojiRef = useRef(null);
  const emojiButtonRef = useRef(null);

  const defaultActivities = activities.filter((a) => a.isDefault);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-close emoji picker when clicking outside of it
  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e) => {
      if (
        emojiRef.current &&
        !emojiRef.current.contains(e.target) &&
        (!emojiButtonRef.current || !emojiButtonRef.current.contains(e.target))
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  const formatTime = (time) => {
    if (!time) return "Flexible";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  };

  const resetAll = () => {
    setView("menu");
    setNewName("");
    setNewIcon("📋");
    setNewStartTime("");
    setNewEndTime("");
    setError("");
    setParsed([]);
    setFileName("");
    setImportError("");
    setImportResult(null);
    setReplaceMode(false);
    setConfirmReplace(false);
    setShowEmojiPicker(false);
  };

  const handleClose = () => {
    resetAll();
    onClose();
  };

  // =========================
  // ADD ACTIVITY
  // =========================
  const handleAddActivity = async () => {
    if (!newName.trim()) return setError("Activity name is required");
    if (newStartTime && newEndTime && newStartTime >= newEndTime)
      return setError("End time must be after start time");

    setError("");
    setIsSubmitting(true);
    const result = await onActivityAdd(newName.trim(), newIcon, newStartTime, newEndTime);
    setIsSubmitting(false);

    if (result.success) {
      setNewName("");
      setNewIcon("📋");
      setNewStartTime("");
      setNewEndTime("");
      setShowEmojiPicker(false);
      setView("menu");
    } else {
      setError(result.error || "Failed to add activity");
    }
  };

  // =========================
  // DELETE ALL DEFAULTS
  // =========================
  const handleDeleteAllDefaults = async () => {
    if (defaultActivities.length === 0) return setError("No default activities to delete");
    if (
      window.confirm(
        `Delete all ${defaultActivities.length} default activities?\n\nThis cannot be undone.`
      )
    ) {
      setIsDeletingDefaults(true);
      const result = await onDeleteAllDefaults();
      setIsDeletingDefaults(false);
      if (!result.success) setError(result.error || "Failed to delete");
    }
  };

  // =========================
  // CSV TEMPLATE
  // =========================
  const downloadTemplate = () => {
    const csv = [
      "name,startTime,endTime,icon",
      "Wake up early,06:00,06:30,🌅",
      "Morning walk,06:30,07:00,🏃",
      "Breakfast,07:30,08:00,🥗",
      "Deep work,09:00,12:00,💼",
      "Lunch,12:30,13:30,🍽️",
      "Evening workout,17:30,18:30,🏋️",
      "Reading,20:00,21:00,📖",
      "Sleep,22:30,23:00,😴",
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "activity-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // =========================
  // TIME NORMALIZER
  // =========================
  const normalizeTime = (val) => {
    if (!val) return null;
    const s = String(val).trim();
    const m = s.match(/^(\d{1,2}):(\d{2})/);
    if (m) {
      const h = String(Math.min(23, parseInt(m[1], 10))).padStart(2, "0");
      const min = String(Math.min(59, parseInt(m[2], 10))).padStart(2, "0");
      return `${h}:${min}`;
    }
    const num = Number(s);
    if (!isNaN(num) && num >= 0 && num < 1) {
      const totalMin = Math.round(num * 24 * 60);
      const h = String(Math.floor(totalMin / 60)).padStart(2, "0");
      const min = String(totalMin % 60).padStart(2, "0");
      return `${h}:${min}`;
    }
    return null;
  };

  // =========================
  // FILE PARSING
  // =========================
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError("");
    setImportResult(null);
    setFileName(file.name);

    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setImportError("Only .csv, .xlsx, or .xls files are supported");
      setParsed([]);
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setImportError("File too large — max 2MB");
      setParsed([]);
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rows.length === 0) {
        setImportError("The file is empty");
        setParsed([]);
        return;
      }

      const normalized = rows.map((row, i) => {
        const find = (keys) => {
          for (const k of Object.keys(row)) {
            if (keys.includes(k.toLowerCase().trim())) return row[k];
          }
          return "";
        };
        const name = String(find(["name", "activity", "task"])).trim();
        const startTime = normalizeTime(find(["starttime", "start", "from"]));
        const endTime = normalizeTime(find(["endtime", "end", "to"]));
        const icon = String(find(["icon", "emoji"])).trim() || "📋";

        const issues = [];
        if (!name) issues.push("missing name");
        if (startTime && endTime && startTime >= endTime) issues.push("end before start");

        return {
          _row: i + 2,
          name,
          startTime,
          endTime,
          icon,
          valid: issues.length === 0,
          issues,
        };
      });

      setParsed(normalized);
    } catch (err) {
      console.error(err);
      setImportError("Could not parse file — check the format");
      setParsed([]);
    }
  };

  const validRows = parsed.filter((r) => r.valid);
  const invalidRows = parsed.filter((r) => !r.valid);

  const handleImport = async () => {
    if (validRows.length === 0) return setImportError("No valid activities to import");
    if (replaceMode && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }

    setImporting(true);
    setImportError("");

    const payload = validRows.map((r) => ({
      name: r.name,
      startTime: r.startTime,
      endTime: r.endTime,
      icon: r.icon,
    }));

    const mode = replaceMode ? "replace" : "merge";
    try {
      const res = await fetch("http://localhost:5000/api/activities/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activities: payload, mode }),
      });
      const data = await res.json();
      setImporting(false);

      if (res.ok) {
        if (typeof onActivityImported === "function") await onActivityImported();
        setImportResult({
          imported: data.created,
          skipped: data.skipped || [],
          replaced: mode === "replace",
        });
      } else {
        setImportError(data.message || "Import failed");
      }
    } catch {
      setImporting(false);
      setImportError("Network error");
    }
  };

  // Preset time ranges
  const timePresets = [
    { label: "6–8 AM", start: "06:00", end: "08:00" },
    { label: "9–12 AM", start: "09:00", end: "12:00" },
    { label: "12–1 PM", start: "12:00", end: "13:00" },
    { label: "5–6 PM", start: "17:00", end: "18:00" },
    { label: "8–10 PM", start: "20:00", end: "22:00" },
  ];

  // =========================
  // RENDER
  // =========================
  return (
    <Drawer
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      direction="right"
    >
      <DrawerContent>
        {/* HEADER */}
        <DrawerHeader className="!border-b-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {view !== "menu" && (
                <button
                  onClick={() => {
                    setView("menu");
                    setError("");
                    setImportError("");
                    setImportResult(null);
                    setShowEmojiPicker(false);
                  }}
                  className="p-1.5 -ml-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <DrawerTitle>
                  {view === "menu" && "Manage Activities"}
                  {view === "add" && "Add Activity"}
                  {view === "import" && "Import Activities"}
                </DrawerTitle>
                <DrawerDescription>
                  {view === "menu" &&
                    `${activities.length} total · ${defaultActivities.length} default`}
                  {view === "add" && "Create a new activity to track"}
                  {view === "import" && "Upload a CSV or Excel file"}
                </DrawerDescription>
              </div>
            </div>
            <DrawerClose asChild>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">

          {/* =====================
              VIEW: MENU
          ===================== */}
          {view === "menu" && (
            <>
              {!canComplete && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>Time&apos;s up for today! Activities lock at midnight.</span>
                </div>
              )}
              {canComplete && timeRemaining && (
                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-600 dark:text-green-400 text-xs">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {timeRemaining.hours}h {timeRemaining.minutes}m remaining today
                  </span>
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                  <button
                    onClick={() => setError("")}
                    className="p-0.5 hover:bg-red-100 dark:hover:bg-red-800/50 rounded"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <button
                  onClick={() => setView("add")}
                  className="w-full flex items-center gap-4 p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition text-left"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg flex-shrink-0">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Add Activity</p>
                    <p className="text-xs opacity-80 mt-0.5">
                      Create a single activity manually
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setView("import")}
                  className="w-full flex items-center gap-4 p-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition text-left"
                >
                  <div className="w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg flex-shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">Import from Excel / CSV</p>
                    <p className="text-xs opacity-80 mt-0.5">
                      Upload a schedule file in bulk
                    </p>
                  </div>
                </button>

                {defaultActivities.length > 0 && (
                  <button
                    onClick={handleDeleteAllDefaults}
                    disabled={isDeletingDefaults}
                    className="w-full flex items-center gap-4 p-4 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-lg flex-shrink-0">
                      {isDeletingDefaults ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Trash className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">
                        {isDeletingDefaults ? "Deleting..." : "Clear Default Activities"}
                      </p>
                      <p className="text-xs opacity-80 mt-0.5">
                        Remove all {defaultActivities.length} default activities
                      </p>
                    </div>
                  </button>
                )}
              </div>
            </>
          )}

          {/* =====================
              VIEW: ADD
          ===================== */}
          {view === "add" && (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{error}</span>
                </div>
              )}

              {/* Name */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Activity Name *
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Gym, Reading, Meditation..."
                  maxLength={50}
                  autoFocus
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white text-sm"
                />
                <div className="text-right text-[10px] text-gray-400 mt-1">
                  {newName.length}/50
                </div>
              </div>

              {/* Icon (Emoji Picker) */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Choose Icon
                </label>

                <button
                  ref={emojiButtonRef}
                  type="button"
                  onClick={() => setShowEmojiPicker((v) => !v)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                >
                  <span className="text-2xl">{newIcon}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex-1">
                    {showEmojiPicker ? "Close picker" : "Click to change icon"}
                  </span>
                  <Smile className="w-4 h-4 text-gray-400" />
                </button>

                {showEmojiPicker && (
                  <div
                    ref={emojiRef}
                    className="mt-3 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    <EmojiPicker
                      onEmojiClick={(emojiData) => {
                        setNewIcon(emojiData.emoji);
                        setShowEmojiPicker(false);
                      }}
                      theme={mounted && theme === "dark" ? "dark" : "light"}
                      width="100%"
                      height={350}
                      lazyLoadEmojis
                      searchPlaceHolder="Search emoji..."
                      previewConfig={{ showPreview: false }}
                    />
                  </div>
                )}
              </div>

              {/* Time Duration */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5" />
                  Time Duration (Optional)
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      step="60"
                      value={newStartTime}
                      onChange={(e) => setNewStartTime(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      step="60"
                      value={newEndTime}
                      onChange={(e) => setNewEndTime(e.target.value)}
                      onClick={(e) => e.currentTarget.showPicker?.()}
                      className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white text-sm cursor-pointer"
                    />
                  </div>
                </div>

                {/* Preview */}
                {newStartTime && newEndTime && newStartTime < newEndTime && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-[11px] text-green-600 dark:text-green-400 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>
                      {formatTime(newStartTime)} → {formatTime(newEndTime)}
                    </span>
                  </div>
                )}

                {/* Quick-pick presets */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {timePresets.map((preset) => {
                    const active =
                      newStartTime === preset.start && newEndTime === preset.end;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setNewStartTime(preset.start);
                          setNewEndTime(preset.end);
                        }}
                        className={`px-2 py-1 text-[10px] font-medium rounded-md transition ${
                          active
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                  {(newStartTime || newEndTime) && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewStartTime("");
                        setNewEndTime("");
                      }}
                      className="px-2 py-1 text-[10px] font-medium rounded-md bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setView("menu");
                    setNewName("");
                    setNewIcon("📋");
                    setNewStartTime("");
                    setNewEndTime("");
                    setError("");
                    setShowEmojiPicker(false);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddActivity}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Add Activity
                </button>
              </div>
            </>
          )}

          {/* =====================
              VIEW: IMPORT
          ===================== */}
          {view === "import" && (
            <>
              {importResult ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                          {importResult.imported} activities imported!
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                          {importResult.replaced
                            ? "Your previous schedule was replaced."
                            : "They're now in your dashboard."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {importResult.skipped.length > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                        {importResult.skipped.length} skipped
                      </p>
                      <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
                        {importResult.skipped.slice(0, 5).map((s, i) => (
                          <li key={i}>
                            • <strong>{s.name}</strong> — {s.reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setImportResult(null);
                      setParsed([]);
                      setFileName("");
                      setReplaceMode(false);
                      setConfirmReplace(false);
                    }}
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
                  >
                    Import another file
                  </button>
                </div>
              ) : (
                <>
                  {parsed.length === 0 && (
                    <>
                      <button
                        onClick={downloadTemplate}
                        className="w-full flex items-center justify-between gap-3 p-4 mb-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-400 dark:hover:border-violet-600 transition text-left"
                      >
                        <div className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-violet-500" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Download template
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Sample CSV to get started
                            </p>
                          </div>
                        </div>
                      </button>

                      <label
                        htmlFor="file-upload-drawer"
                        className="w-full flex flex-col items-center justify-center gap-3 p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-violet-400 dark:hover:border-violet-600 cursor-pointer transition"
                      >
                        <Upload className="w-10 h-10 text-gray-400" />
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Click to upload file
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            .csv, .xlsx, .xls — max 2MB
                          </p>
                        </div>
                        <input
                          id="file-upload-drawer"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          onChange={handleFile}
                        />
                      </label>
                    </>
                  )}

                  {importError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="flex-1">{importError}</span>
                    </div>
                  )}

                  {parsed.length > 0 && (
                    <>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileSpreadsheet className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {fileName}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setParsed([]);
                            setFileName("");
                            setImportError("");
                          }}
                          className="text-xs text-gray-500 hover:text-red-500 transition flex-shrink-0"
                        >
                          Change
                        </button>
                      </div>

                      <div className="flex items-center gap-4 mb-3 text-xs">
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
                          <Check className="w-3.5 h-3.5" />
                          {validRows.length} valid
                        </span>
                        {invalidRows.length > 0 && (
                          <span className="flex items-center gap-1.5 text-red-500">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {invalidRows.length} invalid
                          </span>
                        )}
                      </div>

                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-56 overflow-y-auto mb-4">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                            <tr className="text-left">
                              <th className="px-2 py-2 font-semibold text-gray-600 dark:text-gray-400">
                                Name
                              </th>
                              <th className="px-2 py-2 font-semibold text-gray-600 dark:text-gray-400">
                                Time
                              </th>
                              <th className="px-2 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {parsed.map((row) => (
                              <tr
                                key={row._row}
                                className={`border-t border-gray-100 dark:border-gray-800 ${
                                  !row.valid ? "bg-red-50/50 dark:bg-red-900/10" : ""
                                }`}
                              >
                                <td className="px-2 py-2">
                                  <span className="mr-1.5">{row.icon}</span>
                                  <span className="text-gray-900 dark:text-gray-100">
                                    {row.name || <em className="text-gray-400">—</em>}
                                  </span>
                                </td>
                                <td className="px-2 py-2 text-gray-600 dark:text-gray-400">
                                  {row.startTime || "—"}
                                  {row.endTime ? ` → ${row.endTime}` : ""}
                                </td>
                                <td className="px-2 py-2 text-right">
                                  {row.valid ? (
                                    <Check className="w-3.5 h-3.5 text-green-500 inline" />
                                  ) : (
                                    <span className="text-red-500 text-[10px]">
                                      {row.issues.join(", ")}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={replaceMode}
                            onChange={(e) => {
                              setReplaceMode(e.target.checked);
                              if (!e.target.checked) setConfirmReplace(false);
                            }}
                            className="mt-0.5 w-4 h-4 text-red-600 rounded focus:ring-red-500"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Replace all existing activities
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              Deletes current activities and history, then imports fresh.
                            </p>
                          </div>
                        </label>
                      </div>

                      {confirmReplace && (
                        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-xl">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                Are you absolutely sure?
                              </p>
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                This will delete all existing activities and history. Cannot be undone.
                              </p>
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => setConfirmReplace(false)}
                                  className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleImport}
                                  disabled={importing}
                                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                                >
                                  {importing ? "Replacing..." : "Yes, replace"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {!confirmReplace && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setParsed([]);
                              setFileName("");
                            }}
                            className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleImport}
                            disabled={importing || validRows.length === 0}
                            className={`flex-1 px-4 py-3 text-white rounded-lg transition text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 ${
                              replaceMode
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-emerald-600 hover:bg-emerald-700"
                            }`}
                          >
                            {importing ? (
                              <>
                                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                                {replaceMode ? "Replacing..." : "Importing..."}
                              </>
                            ) : (
                              <>
                                <Check className="w-4 h-4" />
                                {replaceMode
                                  ? `Replace with ${validRows.length}`
                                  : `Import ${validRows.length}`}
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}