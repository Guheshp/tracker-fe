"use client";
import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Upload,
  X,
  FileSpreadsheet,
  AlertCircle,
  Check,
  Download,
  Trash2,
} from "lucide-react";

export default function ImportActivitiesModal({
  onClose,
  onImport, // async (activitiesArray, mode) => { success, imported, skipped, replaced }
  token,
}) {
  const [parsed, setParsed] = useState([]);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const [replaceMode, setReplaceMode] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);

  // ---------- CSV Template download ----------
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

  // ---------- Normalize time to HH:MM (24h) or return null ----------
  const normalizeTime = (val) => {
    if (!val) return null;
    const s = String(val).trim();

    // "7:00" or "07:00"
    const m = s.match(/^(\d{1,2}):(\d{2})/);
    if (m) {
      const h = String(Math.min(23, parseInt(m[1], 10))).padStart(2, "0");
      const min = String(Math.min(59, parseInt(m[2], 10))).padStart(2, "0");
      return `${h}:${min}`;
    }

    // Excel fraction of day (0.2916 = 7:00 AM)
    const num = Number(s);
    if (!isNaN(num) && num >= 0 && num < 1) {
      const totalMin = Math.round(num * 24 * 60);
      const h = String(Math.floor(totalMin / 60)).padStart(2, "0");
      const min = String(totalMin % 60).padStart(2, "0");
      return `${h}:${min}`;
    }

    return null;
  };

  // ---------- Parse uploaded file ----------
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setResult(null);
    setFileName(file.name);

    const validExt = /\.(csv|xlsx|xls)$/i.test(file.name);
    if (!validExt) {
      setError("Only .csv, .xlsx, or .xls files are supported");
      setParsed([]);
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("File too large — max 2MB");
      setParsed([]);
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

      if (rows.length === 0) {
        setError("The file is empty");
        setParsed([]);
        return;
      }

      const normalized = rows.map((row, i) => {
        const find = (keys) => {
          for (const k of Object.keys(row)) {
            if (keys.includes(k.toLowerCase().trim())) {
              return row[k];
            }
          }
          return "";
        };

        const name = String(find(["name", "activity", "task"])).trim();
        const startTime = normalizeTime(find(["starttime", "start", "from"]));
        const endTime = normalizeTime(find(["endtime", "end", "to"]));
        const icon = String(find(["icon", "emoji"])).trim() || "📋";

        const issues = [];
        if (!name) issues.push("missing name");
        if (startTime && endTime && startTime >= endTime) {
          issues.push("end time before start");
        }

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
      setError("Could not parse file — please check the format");
      setParsed([]);
    }
  };

  const removeRow = (rowNum) => {
    setParsed((prev) => prev.filter((r) => r._row !== rowNum));
  };

  const validRows = parsed.filter((r) => r.valid);
  const invalidRows = parsed.filter((r) => !r.valid);

  // ---------- Confirm import ----------
  const handleImport = async () => {
    if (validRows.length === 0) {
      setError("No valid activities to import");
      return;
    }

    // If replace mode, ask for a second explicit confirmation
    if (replaceMode && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }

    setImporting(true);
    setError("");

    const payload = validRows.map((r) => ({
      name: r.name,
      startTime: r.startTime,
      endTime: r.endTime,
      icon: r.icon,
    }));

    const mode = replaceMode ? "replace" : "merge";
    const res = await onImport(payload, mode);
    setImporting(false);

    if (res.success) {
      setResult({
        imported: res.imported,
        skipped: res.skipped || [],
        replaced: res.replaced,
      });
    } else {
      setError(res.error || "Import failed");
    }
  };

  const resetFile = () => {
    setParsed([]);
    setFileName("");
    setResult(null);
    setError("");
    setReplaceMode(false);
    setConfirmReplace(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50" onClick={onClose} />

      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  Import Activities
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Upload a CSV or Excel file with your schedule
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* BODY */}
          <div className="p-5 overflow-y-auto flex-1">
            {result ? (
              /* =========================
                 SUCCESS SCREEN
              ========================= */
              <div className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-green-700 dark:text-green-300">
                        {result.imported} activities imported successfully!
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        {result.replaced
                          ? "Your previous schedule was replaced."
                          : "You can find them in your dashboard, sorted by time."}
                      </p>
                    </div>
                  </div>
                </div>

                {result.skipped.length > 0 && (
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
                      {result.skipped.length} activities were skipped
                    </p>
                    <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
                      {result.skipped.slice(0, 5).map((s, i) => (
                        <li key={i}>
                          • <strong>{s.name}</strong> — {s.reason}
                        </li>
                      ))}
                      {result.skipped.length > 5 && (
                        <li>...and {result.skipped.length - 5} more</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button
                    onClick={resetFile}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
                  >
                    Import another file
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* =========================
                 UPLOAD / PREVIEW SCREEN
              ========================= */
              <>
                {/* Template + Upload (initial state) */}
                {parsed.length === 0 && (
                  <>
                    <button
                      onClick={downloadTemplate}
                      className="w-full flex items-center justify-between gap-3 p-4 mb-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-violet-400 dark:hover:border-violet-600 transition text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Download className="w-5 h-5 text-violet-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            Download template
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Use this sample CSV as a starting point
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-violet-600 dark:text-violet-400">
                        activity-template.csv
                      </span>
                    </button>

                    <label
                      htmlFor="file-upload"
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
                        id="file-upload"
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        className="hidden"
                        onChange={handleFile}
                      />
                    </label>
                  </>
                )}

                {/* Error */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{error}</span>
                    <button onClick={() => setError("")} className="p-0.5 hover:bg-red-100 dark:hover:bg-red-800/50 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Preview Table */}
                {parsed.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {fileName}
                        </span>
                      </div>
                      <button
                        onClick={resetFile}
                        className="text-xs text-gray-500 hover:text-red-500 transition"
                      >
                        Change file
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

                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                          <tr className="text-left">
                            <th className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">#</th>
                            <th className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">Name</th>
                            <th className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">Time</th>
                            <th className="px-3 py-2 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                            <th className="px-3 py-2"></th>
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
                              <td className="px-3 py-2 text-gray-500">{row._row}</td>
                              <td className="px-3 py-2">
                                <span className="mr-1.5">{row.icon}</span>
                                <span className="text-gray-900 dark:text-gray-100">
                                  {row.name || <em className="text-gray-400">—</em>}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                {row.startTime || "—"}
                                {row.endTime ? ` → ${row.endTime}` : ""}
                              </td>
                              <td className="px-3 py-2">
                                {row.valid ? (
                                  <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
                                    <Check className="w-3 h-3" /> OK
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-red-500">
                                    <AlertCircle className="w-3 h-3" />
                                    {row.issues.join(", ")}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 py-2 text-right">
                                <button
                                  onClick={() => removeRow(row._row)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* REPLACE MODE TOGGLE */}
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
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
                            Permanently deletes your current activities and their history,
                            then imports this file as a fresh schedule.
                          </p>
                        </div>
                      </label>
                    </div>

                    {/* SECOND CONFIRMATION */}
                    {confirmReplace && (
                      <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-800 rounded-xl">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                              Are you absolutely sure?
                            </p>
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              This will delete all existing activities and their history.
                              This action cannot be undone.
                            </p>
                            <div className="flex gap-2 mt-3">
                              <button
                                type="button"
                                onClick={() => setConfirmReplace(false)}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleImport}
                                disabled={importing}
                                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50"
                              >
                                {importing ? "Replacing..." : "Yes, replace everything"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* FOOTER */}
          {!result && parsed.length > 0 && !confirmReplace && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || validRows.length === 0}
                className={`px-4 py-2 text-white rounded-lg transition text-sm font-medium flex items-center gap-2 disabled:opacity-50 ${
                  replaceMode
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-violet-600 hover:bg-violet-700"
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
                      ? `Replace with ${validRows.length} activities`
                      : `Import ${validRows.length} activities`}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}