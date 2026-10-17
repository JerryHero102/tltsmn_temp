'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StudentList from '@/components/StudentList';
import TuitionMatrix from '@/components/TuitionMatrix';
import ReceiptModal from '@/components/ReceiptModal';
import { api } from '@/lib/api';
import { Loader2, RefreshCw, Users, Receipt as ReceiptIcon, ArrowUp, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [activeLocation, setActiveLocation] = useState<'mn' | 'tsn'>('mn');
  const [activeTab, setActiveTab] = useState<'students' | 'tuition'>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [tuitionMatrix, setTuitionMatrix] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Receipt Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [preselectedStudentId, setPreselectedStudentId] = useState<string | undefined>(undefined);
  const [preselectedMonth, setPreselectedMonth] = useState<number | undefined>(undefined);

  const fetchData = useCallback(async (targetLoc?: 'mn' | 'tsn', isSilent = false) => {
    const loc = targetLoc || activeLocation;
    try {
      if (!isSilent) setLoadingData(true);
      const [studentsRes, matrixRes] = await Promise.all([
        api.getStudents(loc),
        api.getTuitionMatrix(loc),
      ]);

      const rawStudents = studentsRes || [];
      const rawMatrix = matrixRes || [];

      // Strictly isolate by location: 'tsn' only gets 'tsn', 'mn' only gets 'mn'
      const baseStudents = rawStudents.filter((s: any) => (s.location || 'mn') === loc);
      const baseMatrix = rawMatrix.filter((m: any) => (m.location || 'mn') === loc);

      // Merge any pending local receipts from Local Storage into matrix display
      const pendingList = api.getPendingReceiptsLocally();
      let mergedMatrix = baseMatrix;
      if (pendingList.length > 0) {
        mergedMatrix = baseMatrix.map((row: any) => {
          const studentPending = pendingList.filter((p: any) => p.id_profile === row.id_profile);
          if (studentPending.length === 0) return row;

          const mergedMonths = { ...row.months };
          for (const pendingItem of studentPending) {
            // Nếu server chưa có bản ghi hoặc bản ghi hiện tại là pending
            if (!mergedMonths[pendingItem.month] || mergedMonths[pendingItem.month]?.receipt_id === -1) {
              mergedMonths[pendingItem.month] = {
                receipt_id: -1,
                amount: pendingItem.amount,
                receipt_date: pendingItem.receipt_date,
                image_url: pendingItem.image_url || pendingItem.base64Image || '',
                is_pending_local: true,
              };
            }
          }
          return { ...row, months: mergedMonths };
        });
      }

      setStudents(baseStudents);
      setTuitionMatrix(mergedMatrix);
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
      if (!isSilent) toast.error('Lỗi khi tải dữ liệu từ máy chủ');
    } finally {
      if (!isSilent) setLoadingData(false);
    }
  }, [activeLocation]);

  // Cập nhật Optimistic tức thì tại chỗ khi nhấn Lưu
  const handleSaveOptimistic = useCallback((receiptPayload: any) => {
    setTuitionMatrix((prevMatrix) => {
      return prevMatrix.map((row) => {
        if (row.id_profile !== receiptPayload.id_profile) return row;
        const updatedMonths = { ...row.months };
        updatedMonths[receiptPayload.month] = {
          receipt_id: -1,
          amount: receiptPayload.amount,
          receipt_date: receiptPayload.receipt_date,
          image_url: receiptPayload.image_url || receiptPayload.base64Image || '',
          is_pending_local: true,
        };
        return { ...row, months: updatedMonths };
      });
    });
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (user) {
      fetchData(activeLocation);
      // Tự động âm thầm đồng bộ các biên lai pending nếu có khi mới mở app
      api.syncPendingReceipts(() => {
        fetchData(activeLocation, true);
      });
    }
  }, [user, loading, router, activeLocation, fetchData]);

  // Tối ưu cho 3 người sử dụng đồng thời: tự động cập nhật ngầm khi chuyển qua lại tab hoặc định kỳ 30s
  useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        api.syncPendingReceipts(() => {
          fetchData(activeLocation, true);
        });
        fetchData(activeLocation, true);
      }
    };

    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    const interval = setInterval(() => {
      api.syncPendingReceipts(() => {
        fetchData(activeLocation, true);
      });
      fetchData(activeLocation, true);
    }, 30000);

    return () => {
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [user, activeLocation, fetchData]);

  const handleNavigate = (loc: 'mn' | 'tsn', tab: 'students' | 'tuition') => {
    const locChanged = loc !== activeLocation;
    setActiveLocation(loc);
    setActiveTab(tab);
    if (locChanged) {
      fetchData(loc);
    }
  };

  const [editingReceiptData, setEditingReceiptData] = useState<any>(null);

  const handleOpenReceiptModal = (studentId?: string, month?: number, existingReceipt?: any) => {
    setPreselectedStudentId(studentId);
    setPreselectedMonth(month);
    setEditingReceiptData(existingReceipt || null);
    setIsReceiptModalOpen(true);
  };

  // Prevent flash of protected content before auth verification completes
  if (loading || (!user && typeof window !== 'undefined')) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 text-emerald-400 animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-300">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {/* Left Sidebar */}
      <Sidebar
        activeLocation={activeLocation}
        activeTab={activeTab}
        onNavigate={handleNavigate}
        user={user}
        onLogout={logout}
        onOpenReceiptModal={() => handleOpenReceiptModal()}
      />

      {/* Main Right Content - p-4 padding around context */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full space-y-4">
        {/* Header Title with Sync Button & Add Student Button on the far right of title line */}
        <div className="border-b border-slate-200/80 pb-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 min-w-0">
              {activeTab === 'students' ? (
                <>
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-[#014D2F] shrink-0" />
                  <span className="truncate flex items-center gap-2">
                    <span>Quản Lý Thông Tin Học Viên</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-lg font-bold border shrink-0 ${
                        activeLocation === 'mn'
                          ? 'bg-emerald-100 text-[#014D2F] border-emerald-200'
                          : 'bg-blue-100 text-blue-900 border-blue-200'
                      }`}
                    >
                      {activeLocation === 'mn' ? 'Miền Nam' : 'Tân Sơn Nhì'}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <ReceiptIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#014D2F] shrink-0" />
                  <span className="truncate flex items-center gap-2">
                    <span>Quản Lý Học Phí Hàng Tháng</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-lg font-bold border shrink-0 ${
                        activeLocation === 'mn'
                          ? 'bg-emerald-100 text-[#014D2F] border-emerald-200'
                          : 'bg-blue-100 text-blue-900 border-blue-200'
                      }`}
                    >
                      {activeLocation === 'mn' ? 'Miền Nam' : 'Tân Sơn Nhì'}
                    </span>
                  </span>
                </>
              )}
            </h1>

            <div className="flex items-center gap-2 shrink-0">
              {activeTab === 'students' && user?.role === 'admin' && (
                <button
                  onClick={() => setIsAddStudentModalOpen(true)}
                  className="px-3 py-2 sm:px-3.5 sm:py-2 rounded-xl bg-[#014D2F] hover:bg-[#013822] text-white font-bold text-xs sm:text-sm transition-all shadow-xs flex items-center gap-1.5 shrink-0 active:scale-95"
                  title="Thêm học viên mới"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Thêm</span>
                </button>
              )}

              <button
                onClick={() => {
                  fetchData();
                }}
                disabled={loadingData}
                className="p-2 sm:p-2.5 rounded-xl bg-white border border-slate-200 text-[#014D2F] hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-xs shrink-0 flex items-center justify-center active:scale-95"
                title="Làm mới dữ liệu"
                aria-label="Làm mới dữ liệu"
              >
                <RefreshCw className={`w-5 h-5 sm:w-5.5 sm:h-5.5 ${loadingData ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Content View */}
        {loadingData ? (
          <div className="py-20 flex justify-center items-center">
            <Loader2 className="w-8 h-8 text-[#014D2F] animate-spin" />
          </div>
        ) : activeTab === 'students' ? (
          <StudentList
            students={students}
            onRefresh={fetchData}
            onOpenReceiptForStudent={(stId) => handleOpenReceiptModal(stId)}
            isExternalAddModalOpen={isAddStudentModalOpen}
            onCloseExternalAddModal={() => setIsAddStudentModalOpen(false)}
            location={activeLocation}
          />
        ) : (
          <TuitionMatrix
            matrix={tuitionMatrix}
            onOpenReceiptModal={handleOpenReceiptModal}
          />
        )}
      </main>

      {/* Global Receipt Dialog */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setEditingReceiptData(null);
        }}
        students={students}
        preselectedStudentId={preselectedStudentId}
        preselectedMonth={preselectedMonth}
        existingReceipt={editingReceiptData}
        onSaveOptimistic={handleSaveOptimistic}
        onSilentRefresh={() => fetchData(activeLocation, true)}
        onSuccess={() => fetchData(activeLocation, true)}
      />

      {/* Floating Scroll-To-Top Button (Fixed Bottom-Right for all tabs on Laptop & Mobile) */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 sm:p-3.5 rounded-full bg-[#014D2F] text-white shadow-2xl hover:bg-[#013822] hover:scale-110 active:scale-95 transition-all flex items-center justify-center border-2 border-white/20 animate-in fade-in zoom-in duration-200"
          title="Lên đầu trang"
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}
    </div>
  );
}
