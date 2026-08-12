'use client';

import React, { useState } from 'react';
import { Search, CheckCircle, Plus, X, ExternalLink, Calendar, Image as ImageIcon, Loader2, Filter, RotateCcw, Users, DollarSign, Receipt } from 'lucide-react';

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
  onOpenReceiptModal: (studentId?: string, month?: number) => void;
}

function getOptimizedImageUrl(url: string): string {
  if (!url) return '';
  if (url.includes('res.cloudinary.com') && url.includes('/image/upload/') && !url.includes('/f_auto')) {
    return url.replace('/image/upload/', '/image/upload/f_auto,q_auto/');
  }
  return url;
}

export default function TuitionMatrix({ matrix, onOpenReceiptModal }: TuitionMatrixProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState<{
    fullname: string;
    month: number;
    receipt: MonthData;
  } | null>(null);

  const filteredMatrix = matrix.filter((row) => {
    const matchesSearch =
      row.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (row.phone_number && row.phone_number.includes(searchTerm)) ||
      (row.schedule && row.schedule.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSchedule =
      scheduleFilter === 'all' || (row.schedule || '2-4-6') === scheduleFilter;

    const matchesMonth =
      selectedMonth === 'all' || row.months[Number(selectedMonth)] !== undefined;

    return matchesSearch && matchesSchedule && matchesMonth;
  });

  const visibleMonths = selectedMonth === 'all' 
    ? Array.from({ length: 12 }, (_, i) => i + 1)
    : [Number(selectedMonth)];

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedMonth('all');
    setScheduleFilter('all');
  };

  // Automatic Statistics Calculation
  const totalStudents = matrix.length;
  const totalPaidReceiptsCount = matrix.reduce(
    (acc, row) => acc + Object.values(row.months).filter(Boolean).length,
    0
  );
  const totalRevenueCollected = matrix.reduce(
    (acc, row) =>
      acc +
      Object.values(row.months).reduce(
        (sum, m) => sum + (m ? Number(m.amount) || 0 : 0),
        0
      ),
    0
  );

  return (
    <div className="space-y-3">
      {/* Mini Auto Statistics Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#014D2F] flex items-center justify-center font-bold shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng Học Viên</p>
            <p className="text-base font-extrabold text-slate-900">{totalStudents} học sinh</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lượt Đóng Học Phí</p>
            <p className="text-base font-extrabold text-slate-900">{totalPaidReceiptsCount} lượt biên lai</p>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tổng Doanh Thu</p>
            <p className="text-base font-extrabold text-emerald-800">
              {totalRevenueCollected.toLocaleString('vi-VN')} VNĐ
            </p>
          </div>
        </div>
      </div>

      {/* Filter Header: Shortened Search + Xóa lọc button + Filter by Month + Filter by Schedule */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 w-full">
          {/* Shortened Search Input & Reset Filter button */}
          <div className="relative flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-slate-50/50 font-medium"
              />
            </div>
            {(searchTerm || selectedMonth !== 'all' || scheduleFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
                title="Xóa tất cả bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>

          {/* Filter by Month Dropdown */}
          <div className="relative w-full sm:w-44 shrink-0">
            <Calendar className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-white font-semibold text-slate-700"
            >
              <option value="all">Tất cả 12 tháng</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m.toString()}>Tháng {m}</option>
              ))}
            </select>
          </div>

          {/* Filter by Schedule Dropdown */}
          <div className="relative w-full sm:w-44 shrink-0">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-white font-semibold text-slate-700"
            >
              <option value="all">Tất cả ca học</option>
              <option value="2-4-6">Ca 2-4-6</option>
              <option value="3-5-7">Ca 3-5-7</option>
              <option value="Khác">Ca Linh hoạt / Khác</option>
            </select>
          </div>
        </div>

        {/* Legend Badges */}
        <div className="flex items-center space-x-3 text-[11px] font-semibold text-slate-600 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span> Đã đóng
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Lưu máy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300 inline-block"></span> Chưa đóng
          </span>
        </div>
      </div>

      {/* MOBILE VIEW (Compact student cards, single line, no line break) */}
      <div className="md:hidden space-y-2">
        {filteredMatrix.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center text-slate-400 text-sm border border-slate-100">
            Không tìm thấy thông tin đóng học phí nào.
          </div>
        ) : (
          filteredMatrix.map((row, idx) => (
            <div
              key={row.id_profile}
              className="bg-white p-3 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-2"
            >
              {/* Header: STT + Fullname (No wrapping line) + Schedule badge */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 text-sm truncate whitespace-nowrap">
                    {row.fullname}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap ${
                      row.schedule === '2-4-6'
                        ? 'bg-emerald-100 text-[#014D2F]'
                        : row.schedule === '3-5-7'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Ca {row.schedule || '2-4-6'}
                  </span>
                </div>
              </div>

              {/* Month Status Display */}
              {selectedMonth !== 'all' ? (
                (() => {
                  const m = Number(selectedMonth);
                  const data = row.months[m];
                  return (
                    <div className="flex items-center justify-between bg-slate-50/80 p-2 rounded-xl border border-slate-100">
                      <span className="font-bold text-xs text-slate-700 whitespace-nowrap">Tháng {m}:</span>
                      {data ? (
                        <button
                          onClick={() =>
                            setSelectedReceipt({
                              fullname: row.fullname,
                              month: m,
                              receipt: data,
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg text-white font-semibold text-xs transition-all shadow-xs flex items-center gap-1.5 whitespace-nowrap ${
                            data.is_pending_local
                              ? 'bg-amber-500 hover:bg-amber-600 animate-pulse'
                              : 'bg-emerald-600 hover:bg-[#014D2F]'
                          }`}
                        >
                          {data.is_pending_local ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Lưu máy (Đồng bộ)</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Đã đóng (Xem biên lai)</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => onOpenReceiptModal(row.id_profile, m)}
                          className="px-3 py-1.5 rounded-lg bg-[#014D2F] text-white hover:bg-[#013822] text-xs font-semibold transition-all shadow-xs flex items-center gap-1 whitespace-nowrap"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Đóng học phí T{m}</span>
                        </button>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                    const data = row.months[m];
                    return (
                      <button
                        key={m}
                        onClick={() => {
                          if (data) {
                            setSelectedReceipt({
                              fullname: row.fullname,
                              month: m,
                              receipt: data,
                            });
                          } else {
                            onOpenReceiptModal(row.id_profile, m);
                          }
                        }}
                        className={`px-2 py-1 rounded-lg font-bold text-[11px] shrink-0 transition-all whitespace-nowrap ${
                          data?.is_pending_local
                            ? 'bg-amber-500 text-white animate-pulse'
                            : data
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}
                        title={data ? `Tháng ${m}: Đã đóng` : `Tháng ${m}: Chưa đóng`}
                      >
                        T{m} {data && (data.is_pending_local ? '⌛' : '✓')}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* DESKTOP MATRIX TABLE VIEW - Strictly 1 single row header & clean icon-only + buttons */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Row 1: Thống kê số lượng học sinh đóng học tự động từng tháng */}
              <tr className="bg-[#014D2F]/5 border-b border-emerald-100/80 text-[11px] font-extrabold text-[#014D2F]">
                <th className="py-2 px-3 text-center whitespace-nowrap">TỔNG</th>
                <th className="py-2 px-4 sticky left-0 bg-[#014D2F]/10 z-10 font-extrabold text-[#014D2F] whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  Đã Đóng Học
                </th>
                <th className="py-2 px-3 text-center whitespace-nowrap">---</th>
                {visibleMonths.map((m) => {
                  const paidCount = filteredMatrix.filter((r) => r.months[m] !== null).length;
                  return (
                    <th key={m} className="py-2 px-1 text-center font-extrabold text-[#014D2F] whitespace-nowrap">
                      {paidCount > 0 ? `${paidCount} HS` : '0'}
                    </th>
                  );
                })}
              </tr>

              {/* Row 2: Cột Tháng T1..T12 */}
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-10 whitespace-nowrap">STT</th>
                <th className="py-3 px-4 sticky left-0 bg-slate-50 z-10 w-44 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">
                  Họ và Tên
                </th>
                <th className="py-3 px-3 text-center w-24 whitespace-nowrap">Ca học</th>
                {visibleMonths.map((m) => (
                  <th key={m} className="py-3 px-2 text-center text-xs font-bold text-slate-600 whitespace-nowrap min-w-[50px]">
                    T{m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan={visibleMonths.length + 3} className="py-8 text-center text-slate-400 text-sm">
                    Không tìm thấy thông tin đóng học phí nào.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((row, idx) => (
                  <tr key={row.id_profile} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400 text-xs whitespace-nowrap">{idx + 1}</td>
                    <td className="py-3 px-4 sticky left-0 bg-white z-10 font-bold text-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap truncate">
                      {row.fullname}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                          row.schedule === '2-4-6'
                            ? 'bg-emerald-100 text-[#014D2F]'
                            : row.schedule === '3-5-7'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {row.schedule || '2-4-6'}
                      </span>
                    </td>
                    {visibleMonths.map((m) => {
                      const data = row.months[m];
                      return (
                        <td key={m} className="py-2.5 px-1 text-center whitespace-nowrap">
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
                                  ? 'bg-amber-500 hover:bg-amber-600 animate-pulse'
                                  : 'bg-emerald-600 hover:bg-[#014D2F]'
                              }`}
                              title={
                                data.is_pending_local
                                  ? 'Đã lưu trong máy (Đang tự động đồng bộ CSDL)'
                                  : `Đã đóng ngày ${data.receipt_date} - Xem biên lai`
                              }
                            >
                              {data.is_pending_local ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                  <span>Lưu máy</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>Đóng</span>
                                </>
                              )}
                            </button>
                          ) : (
                            /* Icon + Only inside content table (bỏ chữ Tháng X) */
                            <button
                              onClick={() => onOpenReceiptModal(row.id_profile, m)}
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
                    src={getOptimizedImageUrl(selectedReceipt.receipt.image_url)}
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
                    {Number(selectedReceipt.receipt.amount).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ngày lập biên lai:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedReceipt.receipt.receipt_date}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Trạng thái đồng bộ:</span>
                  <span
                    className={`font-semibold ${
                      selectedReceipt.receipt.is_pending_local
                        ? 'text-amber-600 flex items-center gap-1'
                        : 'text-emerald-600'
                    }`}
                  >
                    {selectedReceipt.receipt.is_pending_local ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> Đã lưu máy (Chờ đồng bộ)
                      </>
                    ) : (
                      'Đã lưu thành công vào CSDL Postgres'
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                {selectedReceipt.receipt.image_url && (
                  <a
                    href={selectedReceipt.receipt.image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1.5 text-xs text-[#014D2F] font-semibold hover:underline"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Mở ảnh gốc trong tab mới</span>
                  </a>
                )}
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors ml-auto"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
