'use client';

import React from 'react';
import { User, Phone, Calendar, ShieldCheck, Mail, X, BookOpen, FileText, Shield } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export default function UserProfileModal({ isOpen, onClose, user }: UserProfileModalProps) {
  if (!isOpen || !user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 transform transition-all">
        {/* Header with primary color #014D2F */}
        <div className="bg-[#014D2F] px-6 py-5 text-white flex justify-between items-center relative">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-xl backdrop-blur-md">
              {user.fullname ? user.fullname.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-lg font-bold leading-tight">{user.fullname || 'Người dùng'}</h3>
              <p className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" /> ID Hệ thống: <span className="font-mono font-semibold text-white">{user.id_system}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-sm text-slate-700">
          <div className="bg-slate-50 p-4 rounded-xl space-y-3 border border-slate-100">
            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#014D2F]" /> Quyền hệ thống
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  isAdmin ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {isAdmin ? 'Quản trị viên (Admin)' : 'Học viên (Student)'}
              </span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2">
                <User className="w-4 h-4 text-[#014D2F]" /> Họ và Tên
              </span>
              <span className="font-semibold text-slate-900">{user.fullname || 'Chưa cập nhật'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#014D2F]" /> Số điện thoại
              </span>
              <span className="font-semibold text-slate-900">{user.phone_number || 'Chưa cập nhật'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#014D2F]" /> Email
              </span>
              <span className="font-semibold text-slate-900">{user.email || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
              <span className="text-slate-500 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#014D2F]" /> Ca học
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-[#014D2F]">
                {user.schedule || '2-4-6'}
              </span>
            </div>

            {user.birth_year && (
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#014D2F]" /> Năm sinh
                </span>
                <span className="font-semibold text-slate-900">{user.birth_year}</span>
              </div>
            )}

            {user.notes && (
              <div className="flex items-start justify-between py-1">
                <span className="text-slate-500 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#014D2F]" /> Ghi chú
                </span>
                <span className="font-medium text-slate-800 text-right max-w-[200px]">{user.notes}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#014D2F] hover:bg-[#013822] text-white font-medium text-sm transition-all shadow-md shadow-emerald-900/10"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
