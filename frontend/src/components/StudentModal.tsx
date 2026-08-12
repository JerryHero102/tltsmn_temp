"use client";

import React, { useState, useEffect } from "react";
import { X, UserPlus, Save, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: any;
  onSuccess: () => void;
}

export default function StudentModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}: StudentModalProps) {
  const [fullname, setFullname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [birthYear, setBirthYear] = useState<number | string>(2012);
  const [gender, setGender] = useState("Nam");
  const [schedule, setSchedule] = useState("2-4-6");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [dateOfJoin, setDateOfJoin] = useState("2026-01-10");
  const [currentLevel, setCurrentLevel] = useState<number | string>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (student) {
      setFullname(student.fullname || "");
      setPhoneNumber(student.phone_number || "");
      setBirthYear(student.birth_year || 2012);
      setGender(student.gender || "Nam");
      setSchedule(student.schedule || "2-4-6");
      setEmail(student.email || "");
      setAddress(student.current_address || student.address || "");
      setNotes(student.notes || "");
      setDateOfJoin(
        student.date_of_join
          ? student.date_of_join.split("T")[0]
          : "2026-01-10",
      );
      setCurrentLevel(
        student.current_level !== undefined && student.current_level !== null
          ? student.current_level
          : 0,
      );
    } else {
      setFullname("");
      setPhoneNumber("");
      setBirthYear(2000);
      setGender("Nam");
      setSchedule("2-4-6");
      setEmail("");
      setAddress("");
      setNotes("");
      setDateOfJoin("2026-01-10");
      setCurrentLevel(0);
    }
  }, [student, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullname || !birthYear) {
      toast.error('Vui lòng nhập Họ tên và Năm sinh');
      return;
    }

    if (phoneNumber && phoneNumber.trim() !== '') {
      const cleanPhone = phoneNumber.trim();
      if (!cleanPhone.startsWith('0')) {
        toast.error('Số điện thoại bắt buộc phải bắt đầu bằng số 0');
        return;
      }
      if (cleanPhone.length !== 10) {
        toast.error(`Số điện thoại phải có đúng 10 chữ số (Hiện tại: ${cleanPhone.length} số)`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const levelNum = currentLevel === "" ? 0 : Number(currentLevel);
      if (student) {
        await api.updateStudent(student.profile_id, {
          fullname,
          birth_year: Number(birthYear),
          phone_number: phoneNumber,
          gender,
          schedule,
          email,
          current_address: address,
          notes,
          date_of_join: dateOfJoin,
          current_level: levelNum,
        });
        toast.success("Cập nhật thông tin học viên thành công!");
      } else {
        await api.createStudent({
          fullname,
          birth_year: Number(birthYear),
          phone_number: phoneNumber,
          gender,
          schedule,
          email,
          current_address: address,
          notes,
          date_of_join: dateOfJoin,
          current_level: levelNum,
        });
        toast.success("Thêm học viên mới thành công!");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Có lỗi xảy ra khi lưu thông tin học viên");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 my-8">
        {/* Header */}
        <div className="bg-[#014D2F] px-6 py-5 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-200" />
            <h3 className="text-lg font-bold">
              {student
                ? "Chỉnh Sửa Thông Tin Học Viên"
                : "Thêm Thông Tin Học Viên Mới"}
            </h3>
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
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Họ và Tên Học Viên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Võ Đặng Cát Tường"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Năm Sinh <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="2000"
                min="1950"
                max="2026"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] font-medium"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Số Điện Thoại (SĐT)
              </label>
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="0903686779"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] font-medium font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Giới Tính
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] font-medium bg-white"
              >
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Ca Học <span className="text-red-500">*</span>
              </label>
              <select
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] font-medium bg-white"
              >
                <option value="2-4-6">2-4-6 (Thứ 2, 4, 6)</option>
                <option value="3-5-7">3-5-7 (Thứ 3, 5, 7)</option>
                <option value="Khác">Khác (Lịch linh hoạt)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Ngày Nhập Học
              </label>
              <input
                type="date"
                value={dateOfJoin}
                onChange={(e) => setDateOfJoin(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] font-medium bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Cấp Đai
              </label>
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min="0"
                placeholder="0"
                value={currentLevel}
                onChange={(e) =>
                  setCurrentLevel(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                placeholder="hocvien@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Địa Chỉ
              </label>
              <input
                type="text"
                placeholder="Quận 1, TP.HCM"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Ghi Chú
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú thêm thông tin về học viên..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] font-medium"
            />
          </div>

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
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#014D2F] hover:bg-[#013822] text-white font-semibold text-sm transition-all shadow-md shadow-emerald-900/10 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Lưu Thông Tin
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
