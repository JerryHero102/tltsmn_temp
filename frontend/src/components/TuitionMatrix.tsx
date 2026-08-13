"use client";

import React, { useState } from "react";
import {
  Search,
  CheckCircle,
  Plus,
  X,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  Loader2,
  Filter,
  RotateCcw,
  Edit3,
} from "lucide-react";
import { matchSearch } from "@/lib/api";

interface MonthData {
  receipt_id: number;
  amount: number;
  receipt_date: string;
  image_url: string;
  is_pending_local?: boolean;
}

interface TuitionRow {
  stt: number;
  id_profile: string;
  fullname: string;
  schedule: string;
  phone_number: string;
  months: Record<number, MonthData | null>;
}

interface TuitionMatrixProps {
  matrix: TuitionRow[];
  onOpenReceiptModal: (
    studentId?: string,
    month?: number,
    existingReceipt?: MonthData | null,
  ) => void;
}

function getOptimizedImageUrl(url: string): string {
  if (!url) return "";
  if (
    url.includes("res.cloudinary.com") &&
    url.includes("/image/upload/") &&
    !url.includes("/f_auto")
  ) {
    return url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
  }
  return url;
}

function cleanDisplayDate(val?: string | null): string {
  if (!val) return "";
  const dateOnly = val.split("T")[0];
  const parts = dateOnly.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateOnly;
}

function getReceiptPaymentMonth(receiptDateStr?: string | null): number {
  if (!receiptDateStr) return 0;
  const dateOnly = receiptDateStr.split("T")[0];
  const parts = dateOnly.split("-");
  if (parts.length >= 2) {
    return parseInt(parts[1], 10);
  }
  return 0;
}

function isLatePayment(
  forMonth: number,
  receiptDateStr?: string | null,
): boolean {
  const actualPaidMonth = getReceiptPaymentMonth(receiptDateStr);
  if (actualPaidMonth <= 0) return false;
  return actualPaidMonth > forMonth;
}

function isEarlyPayment(
  forMonth: number,
  receiptDateStr?: string | null,
): boolean {
  const actualPaidMonth = getReceiptPaymentMonth(receiptDateStr);
  if (actualPaidMonth <= 0) return false;
  return actualPaidMonth < forMonth;
}

function getActualPaidCountForMonth(
  matrixRows: TuitionRow[],
  calendarMonth: number,
): number {
  let count = 0;
  for (const row of matrixRows) {
    for (const [forMonthStr, monthData] of Object.entries(row.months)) {
      if (monthData && monthData.receipt_date) {
        const actualPaidMonth = getReceiptPaymentMonth(monthData.receipt_date);
        if (actualPaidMonth === calendarMonth) {
          count++;
        }
      }
    }
  }
  return count;
}

export default function TuitionMatrix({
  matrix,
  onOpenReceiptModal,
}: TuitionMatrixProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [scheduleFilter, setScheduleFilter] = useState("all");
  const [selectedReceipt, setSelectedReceipt] = useState<{
    fullname: string;
    month: number;
    receipt: MonthData;
  } | null>(null);

  const filteredMatrix = matrix.filter((row) => {
    const matchesSearch =
      matchSearch(row.fullname, searchTerm) ||
      matchSearch(row.phone_number, searchTerm) ||
      matchSearch(row.schedule, searchTerm);

    const matchesSchedule =
      scheduleFilter === "all" || (row.schedule || "2-4-6") === scheduleFilter;

    const targetMonth = Number(selectedMonth);
    const matchesMonth =
      selectedMonth === "all" ||
      row.months[targetMonth] !== null ||
      Object.values(row.months).some(
        (mObj) =>
          mObj && getReceiptPaymentMonth(mObj.receipt_date) === targetMonth,
      );

    return matchesSearch && matchesSchedule && matchesMonth;
  });

  const targetMonthNum = Number(selectedMonth);

  const visibleMonths =
    selectedMonth === "all"
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => {
          if (m === targetMonthNum) return true;
          return filteredMatrix.some((row) => {
            const mObj = row.months[m];
            return (
              mObj &&
              getReceiptPaymentMonth(mObj.receipt_date) === targetMonthNum
            );
          });
        });

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedMonth("all");
    setScheduleFilter("all");
  };

  // Student Counts Calculation
  const countTotal = filteredMatrix.length;
  const count246 = filteredMatrix.filter(
    (r) => (r.schedule || "2-4-6") === "2-4-6",
  ).length;
  const count357 = filteredMatrix.filter((r) => r.schedule === "3-5-7").length;

  return (
    <div className="space-y-3">
      {/* Filter Header: Search + Filter by Month + Filter by Schedule (1 Single Row) */}
      <div className="flex flex-col gap-2 bg-white p-2.5 sm:p-3 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex flex-row items-center gap-2 w-full">
          {/* Search Input */}
          <div className="relative flex-1 min-w-0">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên, SĐT (dambaolinh...)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-slate-50/50 font-medium"
            />
          </div>

          {/* Reset Filter Button */}
          {(searchTerm ||
            selectedMonth !== "all" ||
            scheduleFilter !== "all") && (
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
              title="Xóa tất cả bộ lọc"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Xóa lọc</span>
            </button>
          )}

          {/* Filter by Month Dropdown */}
          <div className="relative w-28 sm:w-36 shrink-0">
            <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-8 pr-2 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-white font-semibold text-slate-700"
            >
              <option value="all">Tất cả 12T</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m.toString()}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Schedule Dropdown */}
          <div className="relative w-28 sm:w-36 shrink-0">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
              className="w-full pl-8 pr-2 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-white font-semibold text-slate-700"
            >
              <option value="all">Tất cả ca</option>
              <option value="2-4-6">Ca 2-4-6</option>
              <option value="3-5-7">Ca 3-5-7</option>
              <option value="Khác">Ca Khác</option>
            </select>
          </div>
        </div>

        {/* Compact Legend Badges (text-[10px], no line wrap) & Mobile Scroll Hint */}
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[10px] font-semibold text-slate-600 pt-1.5 border-t border-slate-100">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block"></span>{" "}
              Đúng hạn
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-blue-600 inline-block"></span>{" "}
              Đóng sớm
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>{" "}
              Đóng bù / Lưu máy
            </span>
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-slate-200 border border-slate-300 inline-block"></span>{" "}
              Chưa đóng
            </span>
          </div>
          <div className="text-[10px] text-slate-400 italic md:hidden">
            ← Vuốt cuộn ngang →
          </div>
        </div>
      </div>

      {/* MOBILE VIEW Summary Banner (Matching StudentList.tsx UI) */}
      <div className="md:hidden bg-[#014D2F]/10 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold text-[#014D2F] flex items-center justify-between">
        <span>Học viên: {countTotal}</span>
        <span>2-4-6: {count246}</span>
        <span>3-5-7: {count357}</span>
      </div>

      {/* UNIFIED MATRIX TABLE VIEW (Mobile + Desktop) */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-auto max-h-[calc(100vh-220px)] scrollbar-thin">
          <table className="w-full text-left border-collapse min-w-162.5">
            <thead className="sticky top-0 z-20 shadow-xs bg-slate-100">
              {/* Desktop Stat Summary Row on top of table header (Matching StudentList.tsx) */}
              <tr className="hidden md:table-row bg-[#014D2F]/5 border-b border-emerald-100/80 text-xs font-extrabold text-[#014D2F]">
                <th
                  colSpan={visibleMonths.length + 2}
                  className="py-2.5 px-4 text-left whitespace-nowrap bg-emerald-50/90"
                >
                  Học viên: {countTotal} &nbsp;|&nbsp; 2-4-6: {count246}{" "}
                  &nbsp;|&nbsp; 3-5-7: {count357}
                </th>
              </tr>
              <tr className="bg-slate-100 border-b border-slate-200/90 text-xs font-bold text-slate-700 uppercase tracking-wider">
                <th className="py-2.5 px-1 text-center w-7 sticky left-0 bg-slate-100 z-30 whitespace-nowrap border-r border-slate-200/60">
                  STT
                </th>
                <th className="py-2.5 px-2.5 sticky left-7 bg-slate-100 z-30 min-w-31.25 max-w-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-200/60 whitespace-nowrap">
                  Họ và Tên
                </th>
                {visibleMonths.map((m) => {
                  const paidCount = getActualPaidCountForMonth(
                    filteredMatrix,
                    m,
                  );
                  return (
                    <th
                      key={m}
                      className="py-2 px-1 text-center whitespace-nowrap min-w-13.5 bg-slate-100/95 border-r border-slate-200/40"
                    >
                      <div className="text-xs font-extrabold text-slate-800">
                        T{m}
                      </div>
                      <div
                        className={`text-[10px] font-black rounded-md px-1 py-0.5 mt-0.5 inline-block ${
                          paidCount > 0
                            ? "bg-emerald-100 text-[#014D2F] border border-emerald-200"
                            : "bg-slate-200/60 text-slate-500"
                        }`}
                        title={`Số HS đã đóng trong tháng ${m}: ${paidCount}`}
                      >
                        {paidCount} HS
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleMonths.length + 2}
                    className="py-8 text-center text-slate-400 text-sm"
                  >
                    Không tìm thấy thông tin đóng học phí nào.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((row, idx) => (
                  <tr
                    key={row.id_profile}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* 1. Cố định Cột STT */}
                    <td className="py-2.5 px-1 text-center font-bold text-slate-400 text-xs sticky left-0 bg-white z-10 whitespace-nowrap w-7 border-r border-slate-100">
                      {idx + 1}
                    </td>

                    {/* 2. Cố định Cột Họ và Tên + Ca học thu nhỏ ở dưới tên */}
                    <td className="py-2.5 px-2.5 sticky left-7 bg-white z-10 min-w-31.25 max-w-40 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] border-r border-slate-100 whitespace-nowrap">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                        {row.fullname}
                      </div>
                      <div className="mt-0.5">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded inline-block ${
                            row.schedule === "2-4-6"
                              ? "bg-emerald-100 text-[#014D2F]"
                              : row.schedule === "3-5-7"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {row.schedule || "2-4-6"}
                        </span>
                      </div>
                    </td>

                    {/* 3. Các cột Tháng T1..T12 */}
                    {visibleMonths.map((m) => {
                      const data = row.months[m];
                      const isLate =
                        data && isLatePayment(m, data.receipt_date);
                      const isEarly =
                        data && isEarlyPayment(m, data.receipt_date);
                      return (
                        <td
                          key={m}
                          className="py-2 px-1 text-center whitespace-nowrap min-w-13"
                        >
                          {data ? (
                            <button
                              onClick={() =>
                                setSelectedReceipt({
                                  fullname: row.fullname,
                                  month: m,
                                  receipt: data,
                                })
                              }
                              className={`w-full py-1.5 px-1 rounded-lg text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1 whitespace-nowrap ${
                                data.is_pending_local
                                  ? "bg-amber-500 hover:bg-amber-600 animate-pulse"
                                  : isEarly
                                    ? "bg-blue-600 hover:bg-blue-700"
                                    : isLate
                                      ? "bg-amber-500 hover:bg-amber-600"
                                      : "bg-emerald-600 hover:bg-[#014D2F]"
                              }`}
                              title={
                                data.is_pending_local
                                  ? "Đã lưu trong máy (Đang tự động đồng bộ CSDL)"
                                  : isEarly
                                    ? `Đã đóng sớm vào ngày ${cleanDisplayDate(data.receipt_date)} - Xem biên lai`
                                    : isLate
                                      ? `Đã đóng bù vào ngày ${cleanDisplayDate(data.receipt_date)} - Xem biên lai`
                                      : `Đã đóng ngày ${cleanDisplayDate(data.receipt_date)} - Xem biên lai`
                              }
                            >
                              {data.is_pending_local ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                  <span>Lưu máy</span>
                                </>
                              ) : isEarly ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Sớm</span>
                                </>
                              ) : isLate ? (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Bù</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Đóng</span>
                                </>
                              )}
                            </button>
                          ) : (
                            /* Icon + Only inside content table */
                            <button
                              onClick={() =>
                                onOpenReceiptModal(row.id_profile, m)
                              }
                              className="w-full py-1.5 px-1 rounded-lg bg-slate-100/90 hover:bg-emerald-100 hover:text-[#014D2F] border border-slate-200/80 text-slate-400 text-xs font-bold transition-all flex items-center justify-center"
                              title={`Thêm biên lai Tháng ${m}`}
                            >
                              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Image Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="bg-[#014D2F] px-6 py-4 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold">Biên Lai Học Phí</h3>
                <p className="text-xs text-emerald-100">
                  {selectedReceipt.fullname} - Tháng {selectedReceipt.month}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center">
                {selectedReceipt.receipt.image_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getOptimizedImageUrl(
                      selectedReceipt.receipt.image_url,
                    )}
                    alt="Biên lai học phí"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-slate-400 text-xs flex flex-col items-center space-y-2">
                    <ImageIcon className="w-8 h-8 text-slate-300" />
                    <span>Không có hình ảnh biên lai</span>
                  </div>
                )}
              </div>

              <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Số tiền đóng:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {Number(selectedReceipt.receipt.amount).toLocaleString(
                      "vi-VN",
                    )}{" "}
                    VNĐ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày lập biên lai:</span>
                  <span className="font-semibold text-slate-800">
                    {cleanDisplayDate(selectedReceipt.receipt.receipt_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trạng thái đồng bộ:</span>
                  <span
                    className={`font-semibold ${
                      selectedReceipt.receipt.is_pending_local
                        ? "text-amber-600 flex items-center gap-1"
                        : "text-emerald-600"
                    }`}
                  >
                    {selectedReceipt.receipt.is_pending_local ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Đã lưu máy
                        (Chờ đồng bộ)
                      </>
                    ) : (
                      "Đã lưu thành công vào CSDL Postgres"
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 gap-2">
                {selectedReceipt.receipt.image_url && (
                  <a
                    href={selectedReceipt.receipt.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-[#014D2F] font-semibold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở ảnh gốc</span>
                  </a>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => {
                      const studentId = matrix.find(
                        (r) => r.fullname === selectedReceipt.fullname,
                      )?.id_profile;
                      const receiptToEdit = selectedReceipt.receipt;
                      const monthToEdit = selectedReceipt.month;
                      setSelectedReceipt(null);
                      onOpenReceiptModal(studentId, monthToEdit, receiptToEdit);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa biên lai</span>
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
