'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [idSystem, setIdSystem] = useState('');
  const [password, setPassword] = useState('');
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  const { login, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If already logged in, redirect to dashboard immediately
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSystem || !password) {
      toast.error('Vui lòng nhập Mã người dùng và Mật khẩu');
      return;
    }

    try {
      setLoadingSubmit(true);
      await login(idSystem, password);
      toast.success('Đăng nhập thành công!');
    } catch (err: any) {
      toast.error(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin');
    } finally {
      setLoadingSubmit(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#014D2F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow Overlay */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#014D2F] rounded-full blur-3xl opacity-50" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-600 rounded-full blur-3xl opacity-30" />

      {/* Login Card */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 z-10 p-8 sm:p-10 space-y-8 animate-in fade-in zoom-in-95 duration-300">
        {/* Top Branding with Image Logo */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto shadow-lg shadow-emerald-900/20 border-2 border-emerald-600/30 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/sxotasqj/image/upload/v1786467529/logo_yyeqco.jpg"
              alt="TLTSMN Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">TLTSMN Management</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Hệ Thống Quản Lý Học Viên & Học Phí</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Mã Người Dùng (id_system)
            </label>
            <div className="relative">
              <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Nhập mã id_system hoặc SĐT"
                value={idSystem}
                onChange={(e) => setIdSystem(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-slate-50/50 font-mono text-slate-900"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Mật Khẩu
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-slate-50/50 font-mono text-slate-900"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loadingSubmit}
            className="w-full py-3.5 px-4 bg-[#014D2F] hover:bg-[#013822] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/20 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-70"
          >
            {loadingSubmit ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Đang xác thực...</span>
              </>
            ) : (
              <>
                <span>Đăng Nhập</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400 font-medium">
            © 2026 TLTSMN Management App
          </p>
        </div>
      </div>
    </div>
  );
}
