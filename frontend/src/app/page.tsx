'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StudentList from '@/components/StudentList';
import TuitionMatrix from '@/components/TuitionMatrix';
import ReceiptModal from '@/components/ReceiptModal';
import { api } from '@/lib/api';
import { Loader2, RefreshCw, Users, Receipt as ReceiptIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'students' | 'tuition'>('students');
  const [students, setStudents] = useState<any[]>([]);
  const [tuitionMatrix, setTuitionMatrix] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Receipt Modal State
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [preselectedStudentId, setPreselectedStudentId] = useState<string | undefined>(undefined);
  const [preselectedMonth, setPreselectedMonth] = useState<number | undefined>(undefined);

  const fetchData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [studentsRes, matrixRes] = await Promise.all([
        api.getStudents(),
        api.getTuitionMatrix(),
      ]);

      const baseStudents = studentsRes || [];
      const baseMatrix = matrixRes || [];

      // Merge any pending local receipts from Local Storage into matrix display
      const pendingList = api.getPendingReceiptsLocally();
      if (pendingList.length > 0) {
        const updatedMatrix = baseMatrix.map((row: any) => {
          const studentPending = pendingList.filter((p: any) => p.id_profile === row.id_profile);
          if (studentPending.length === 0) return row;

          const mergedMonths = { ...row.months };
          for (const pendingItem of studentPending) {
            if (!mergedMonths[pendingItem.month]) {
              mergedMonths[pendingItem.month] = {
                receipt_id: -1,
                amount: pendingItem.amount,
                receipt_date: pendingItem.receipt_date,
                image_url: pendingItem.base64Image,
                is_pending_local: true,
              };
            }
          }
          return { ...row, months: mergedMonths };
        });

        setStudents(baseStudents);
        setTuitionMatrix(updatedMatrix);
      } else {
        setStudents(baseStudents);
        setTuitionMatrix(baseMatrix);
      }
    } catch (err: any) {
      console.error('Failed to load dashboard data', err);
      toast.error('Lỗi khi tải dữ liệu từ máy chủ');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    } else if (user) {
      fetchData();
      // Automatically sync any pending local storage receipts to Cloudinary & DB on load
      api.syncPendingReceipts(() => {
        fetchData();
      });
    }
  }, [user, loading, router, fetchData]);

  const handleOpenReceiptModal = (studentId?: string, month?: number) => {
    setPreselectedStudentId(studentId);
    setPreselectedMonth(month);
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={logout}
        onOpenReceiptModal={() => handleOpenReceiptModal()}
      />

      {/* Main Right Content - p-4 padding around context */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full space-y-4">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
              {activeTab === 'students' ? (
                <>
                  <Users className="w-7 h-7 text-[#014D2F]" />
                  <span>Quản Lý Thông Tin Học Viên</span>
                </>
              ) : (
                <>
                  <ReceiptIcon className="w-7 h-7 text-[#014D2F]" />
                  <span>Quản Lý Học Phí Hàng Tháng</span>
                </>
              )}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'students'
                ? `Danh sách tổng hợp ${students.length} học viên đang theo học`
                : 'Bảng theo dõi trạng thái đóng học phí 12 tháng'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                fetchData();
                api.syncPendingReceipts(fetchData);
              }}
              disabled={loadingData}
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs flex items-center gap-1.5 text-xs font-semibold"
              title="Làm mới & Đồng bộ"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              <span>Đồng bộ CSDL</span>
            </button>
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
        onClose={() => setIsReceiptModalOpen(false)}
        students={students}
        preselectedStudentId={preselectedStudentId}
        preselectedMonth={preselectedMonth}
        onSuccess={fetchData}
      />
    </div>
  );
}
