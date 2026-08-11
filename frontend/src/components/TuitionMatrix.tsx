'use client';

import React, { useState } from 'react';
import { Search, CheckCircle, Plus, Info, X, ExternalLink, Calendar, Image as ImageIcon, Loader2 } from 'lucide-react';

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
  const [selectedReceipt, setSelectedReceipt] = useState<{
    fullname: string;
    month: number;
    receipt: MonthData;
  } | null>(null);

  const filteredMatrix = matrix.filter((row) =>
    row.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (row.phone_number && row.phone_number.includes(searchTerm)) ||
    (row.schedule && row.schedule.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Information Header & Explanations */}
      <div className="bg-emerald-50/80 border border-emerald-200/60 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3 text-xs text-emerald-900 leading-relaxed">
          <Info className="w-5 h-5 text-[#014D2F] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-950 text-sm">Hướng dẫn Quản Lý Học Phí:</p>
            <p>
              • <strong className="font-semibold">Lưu tức thì vào Local Storage:</strong> Nhấn "Xác nhận" sẽ lập tức ghi biên lai vào bộ nhớ máy trình duyệt trước (không mất dữ liệu kể cả khi tải lại trang), sau đó tự động tải ảnh lên Cloudinary & lưu CSDL.
            </p>
            <p>
              • <strong className="font-semibold">Đóng tiền học:</strong> Việc đóng tiền học vào ngày nào không phụ thuộc vào tháng đóng. Ví dụ: đóng vào ngày 11/08 có thể là nộp cho Tháng 7 hoặc Tháng 9.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên học viên, SĐT hoặc ca học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-slate-50/50"
          />
        </div>

        <div className="flex items-center space-x-4 text-xs font-semibold text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span> Đã đóng (CSDL)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span> Đã lưu máy (Chờ đồng bộ)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-200 border border-slate-300 inline-block"></span> Chưa đóng
          </span>
        </div>
      </div>

      {/* Matrix Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-3 text-center w-10">STT</th>
                <th className="py-4 px-4 sticky left-0 bg-slate-50 z-10 w-44 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  Họ và Tên
                </th>
                <th className="py-4 px-3 text-center w-24">Ca học</th>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <th key={m} className="py-4 px-2 text-center text-[11px] font-bold text-slate-600 w-16">
                    T{m}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-8 text-center text-slate-400 text-sm">
                    Không tìm thấy thông tin đóng học phí nào.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((row, idx) => (
                  <tr key={row.id_profile} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 text-center font-bold text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4 sticky left-0 bg-white z-10 font-bold text-slate-900 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] truncate">
                      {row.fullname}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
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
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const data = row.months[m];
                      return (
                        <td key={m} className="py-3 px-1 text-center">
                          {data ? (
                            <button
                              onClick={() =>
                                setSelectedReceipt({
                                  fullname: row.fullname,
                                  month: m,
                                  receipt: data,
                                })
                              }
                              className={`w-full py-1.5 px-1 rounded-lg text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-0.5 ${
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
                                  <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                                  <span className="hidden sm:inline">Lưu máy</span>
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3 h-3 shrink-0" />
                                  <span className="hidden sm:inline">Đóng</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => onOpenReceiptModal(row.id_profile, m)}
                              className="w-full py-1.5 px-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-[#014D2F] border border-slate-200 text-slate-400 text-xs font-medium transition-all flex items-center justify-center"
                              title={`Thêm biên lai cho Tháng ${m}`}
                            >
                              <Plus className="w-3.5 h-3.5" />
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
                <h4 className="font-bold text-base">Chi Tiết Biên Lai Học Phí</h4>
                <p className="text-xs text-emerald-100">
                  {selectedReceipt.fullname} - Học phí Tháng {selectedReceipt.month}
                </p>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-500 block">Số tiền:</span>
                  <span className="font-bold text-emerald-700 text-sm">
                    {Number(selectedReceipt.receipt.amount).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ngày nộp tiền:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#014D2F]" />
                    {selectedReceipt.receipt.receipt_date}
                  </span>
                </div>
              </div>

              {/* Receipt Cloudinary Image (Optimized f_auto,q_auto) */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#014D2F]" /> Hình ảnh biên lai (Tối ưu f_auto,q_auto):
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-900 max-h-80 flex items-center justify-center">
                  <img
                    src={getOptimizedImageUrl(selectedReceipt.receipt.image_url)}
                    alt="Biên lai học phí tối ưu Cloudinary"
                    className="w-full h-auto max-h-80 object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between">
              {selectedReceipt.receipt.image_url.startsWith('http') ? (
                <a
                  href={getOptimizedImageUrl(selectedReceipt.receipt.image_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-[#014D2F] hover:underline flex items-center gap-1"
                >
                  Mở link gốc Cloudinary (Optimized) <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <span className="text-xs text-amber-600 font-medium">Đang lưu bộ nhớ máy</span>
              )}
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
