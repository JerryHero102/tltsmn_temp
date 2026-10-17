'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, CheckCircle2, Loader2, Search, Save } from 'lucide-react';
import { api, matchSearch } from '@/lib/api';
import { toast } from 'sonner';

interface Student {
  profile_id: string;
  fullname: string;
  phone_number?: string;
  schedule?: string;
}

export interface ExistingReceiptData {
  receipt_id?: number;
  amount?: number;
  receipt_date?: string;
  image_url?: string;
}

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  preselectedStudentId?: string;
  preselectedMonth?: number;
  existingReceipt?: ExistingReceiptData | null;
  onSuccess?: () => void;
  onSaveOptimistic?: (receipt: any) => void;
  onSilentRefresh?: () => void;
}

// Client-side image compressor for mobile & desktop to keep Base64 size lightweight (~50-100KB)
function compressImage(file: File, maxDimension = 1000, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedBase64);
        } else {
          resolve(rawDataUrl);
        }
      };
      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

function cleanDateForInput(val?: string | null): string {
  if (!val) return new Date().toISOString().split('T')[0];
  if (val.includes('T')) {
    const parts = val.split('T');
    return parts[0];
  }
  return val;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  students,
  preselectedStudentId,
  preselectedMonth,
  existingReceipt,
  onSuccess,
  onSaveOptimistic,
  onSilentRefresh,
}: ReceiptModalProps) {
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [receiptDate, setReceiptDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState<number>(300000);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Chỉ khởi tạo form 1 lần duy nhất khi mở modal (khi isOpen chuyển thành true)
  useEffect(() => {
    if (!isOpen) return;

    if (preselectedStudentId) {
      setSelectedStudentId(preselectedStudentId);
    } else if (students.length > 0 && !selectedStudentId) {
      setSelectedStudentId(students[0].profile_id);
    }

    if (preselectedMonth) {
      setMonth(preselectedMonth);
    } else {
      setMonth(new Date().getMonth() + 1);
    }

    if (existingReceipt) {
      if (existingReceipt.amount) setAmount(Number(existingReceipt.amount));
      setReceiptDate(cleanDateForInput(existingReceipt.receipt_date));
      if (existingReceipt.image_url) {
        setImagePreview(existingReceipt.image_url);
        setBase64Image(existingReceipt.image_url);
      }
    } else {
      setAmount(300000);
      setReceiptDate(new Date().toISOString().split('T')[0]);
      setImagePreview(null);
      setBase64Image(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);
    if (!isImage) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)');
      return;
    }

    try {
      setIsCompressing(true);
      // Tự động nén ảnh chụp điện thoại cho dung lượng siêu nhẹ ~50-100KB
      const compressedDataUrl = await compressImage(file, 1000, 0.72);
      if (compressedDataUrl) {
        setImagePreview(compressedDataUrl);
        setBase64Image(compressedDataUrl);
      } else {
        toast.error('Không thể đọc tệp hình ảnh');
      }
    } catch {
      toast.error('Lỗi khi xử lý hình ảnh');
    } finally {
      setIsCompressing(false);
      // Reset input value để có thể chọn lại cùng 1 file
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const filteredStudents = students.filter((s) =>
    matchSearch(s.fullname, searchQuery) ||
    (s.phone_number && matchSearch(s.phone_number, searchQuery))
  );

  const currentSelectedStudent = students.find((s) => s.profile_id === selectedStudentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      toast.error('Vui lòng chọn học viên');
      return;
    }

    if (!base64Image) {
      toast.error('Hình ảnh biên lai là bắt buộc! Vui lòng chọn hoặc chụp ảnh biên lai');
      return;
    }

    const payload = {
      id_profile: selectedStudentId,
      payer_name: currentSelectedStudent?.fullname || 'Học viên',
      month: Number(month),
      receipt_date: receiptDate,
      amount: Number(amount),
      schedule_note: currentSelectedStudent?.schedule || '2-4-6',
      payment_content: `Học phí tháng ${month}`,
      image_url: base64Image,
      base64Image: base64Image,
    };

    // 1. Lưu tức thì vào LocalStorage của trình duyệt
    api.savePendingReceiptLocally(payload);

    // 2. Cập nhật giao diện Optimistic ngay tại chỗ (không reload, không spinner)
    if (onSaveOptimistic) {
      onSaveOptimistic(payload);
    }

    // 3. Đóng dialog ngay lập tức (0ms - tức thì thiệc)
    onClose();

    // 4. Thông báo thành công tức thì
    toast.success(
      existingReceipt
        ? `Cập nhật biên lai Tháng ${month} (${currentSelectedStudent?.fullname}) thành công!`
        : `Đã lưu biên lai Tháng ${month} (${currentSelectedStudent?.fullname}) tức thì!`
    );

    // Reset form preview
    setImagePreview(null);
    setBase64Image(null);

    // 5. Âm thầm đồng bộ lên máy chủ ở chế độ nền (không load lại trang)
    api.syncPendingReceipts(() => {
      if (onSilentRefresh) {
        onSilentRefresh();
      } else if (onSuccess) {
        onSuccess();
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="bg-[#014D2F] px-6 py-5 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Save className="w-5 h-5 text-emerald-200" />
              <span>{existingReceipt ? 'Chỉnh Sửa Biên Lai Học Phí' : 'Thêm Biên Lai Học Phí'}</span>
            </h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              {existingReceipt
                ? 'Cập nhật lại số tiền, ngày lập hoặc hình ảnh biên lai'
                : 'Lưu trực tiếp vào hệ thống & CSDL máy chủ'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-800">
          {/* Student Search & Select */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Chọn Học Viên <span className="text-red-500">*</span>
            </label>

            {/* Filter Search Input */}
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm kiếm tên học viên hoặc SĐT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-slate-50"
              />
            </div>

            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-white font-medium text-slate-900"
              required
            >
              <option value="" disabled>-- Chọn học viên --</option>
              {filteredStudents.map((st) => (
                <option key={st.profile_id} value={st.profile_id}>
                  {st.fullname} {st.phone_number ? `(${st.phone_number})` : ''} - Ca: {st.schedule || '2-4-6'}
                </option>
              ))}
            </select>
          </div>

          {/* Month & Date Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Tháng Đóng <span className="text-red-500">*</span>
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full px-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-white font-medium text-slate-900"
                required
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    Tháng {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Ngày Đóng (Nộp) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={receiptDate}
                  onChange={(e) => setReceiptDate(e.target.value)}
                  className="w-full px-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-white font-medium text-slate-900"
                  required
                />
              </div>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Số Tiền (VNĐ) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              inputMode="numeric"
              pattern="[0-9]*"
              step="10000"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full px-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-white font-medium text-slate-900"
              required
            />
          </div>

          {/* Receipt Image Input (Mandatory) */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Hình Ảnh Biên Lai (Bắt Buộc) <span className="text-red-500">*</span>
            </label>

            <div className="flex gap-3 pt-1">
              {/* File Library Upload */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-emerald-600/40 hover:border-[#014D2F] bg-emerald-50/50 hover:bg-emerald-50 text-[#014D2F] py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-xs font-semibold"
              >
                <Upload className="w-5 h-5 text-[#014D2F]" />
                <span>Chọn từ máy</span>
              </button>

              {/* Camera Photo Take */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 border-2 border-dashed border-blue-600/40 hover:border-blue-700 bg-blue-50/50 hover:bg-blue-50 text-blue-700 py-3 px-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all text-xs font-semibold"
              >
                <Camera className="w-5 h-5 text-blue-700" />
                <span>Chụp ảnh mới</span>
              </button>

              {/* Hidden File & Camera Inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Compressing status indicator */}
            {isCompressing && (
              <div className="p-3 bg-amber-50 rounded-xl text-amber-700 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tự động nén ảnh cho dung lượng siêu nhẹ...</span>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-2 rounded-xl overflow-hidden border border-slate-200 aspect-16/9 bg-slate-100 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Xem trước biên lai" className="w-full h-full object-contain" />
                <div className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Đã chọn
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCompressing || !base64Image}
              className="px-6 py-2.5 rounded-xl bg-[#014D2F] hover:bg-[#013822] text-white font-semibold text-sm transition-all shadow-md shadow-emerald-900/10 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> Lưu Tức Thì
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
