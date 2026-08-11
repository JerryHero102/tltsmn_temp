'use client';

import React, { useState } from 'react';
import { Search, UserPlus, Edit, DollarSign, Eye, X, User, Phone, Calendar, Mail, MapPin, BookOpen, FileText } from 'lucide-react';
import StudentModal from './StudentModal';
import { useAuth } from '@/context/AuthContext';

interface Student {
  profile_id: string;
  fullname: string;
  phone_number: string;
  gender: string;
  schedule: string;
  notes: string;
  date_of_birth: string;
  birth_year: number;
  email?: string;
  current_address?: string;
  date_of_join?: string;
  id_system: string;
}

interface StudentListProps {
  students: Student[];
  onRefresh: () => void;
  onOpenReceiptForStudent: (studentId: string) => void;
}

export default function StudentList({ students, onRefresh, onOpenReceiptForStudent }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const filteredStudents = students.filter(
    (st) =>
      st.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.phone_number && st.phone_number.includes(searchTerm)) ||
      (st.schedule && st.schedule.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingStudent(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudent(st);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Search & Add Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-xs border border-slate-100">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tên, số điện thoại, ca học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-slate-50/50"
          />
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#014D2F] hover:bg-[#013822] text-white font-semibold text-sm transition-all shadow-md shadow-emerald-900/10 hover:scale-[1.01]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Học Viên</span>
          </button>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-4 text-center w-12">STT</th>
                <th className="py-4 px-6">Họ và Tên</th>
                <th className="py-4 px-4 text-center">Năm sinh</th>
                <th className="py-4 px-4 text-center">Ca học</th>
                <th className="py-4 px-4">SĐT</th>
                <th className="py-4 px-6">Ghi chú</th>
                <th className="py-4 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">
                    Không tìm thấy thông tin học viên nào trong CSDL.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr key={st.profile_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => setViewingStudent(st)}
                        className="font-bold text-slate-900 hover:text-[#014D2F] hover:underline text-left"
                      >
                        {st.fullname}
                      </button>
                      <div className="text-[11px] text-slate-400 font-normal">
                        Giới tính: {st.gender || 'Nam'}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-medium text-slate-700">
                      {st.birth_year || (st.date_of_birth ? new Date(st.date_of_birth).getFullYear() : 'N/A')}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          st.schedule === '2-4-6'
                            ? 'bg-emerald-100 text-[#014D2F]'
                            : st.schedule === '3-5-7'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {st.schedule || '2-4-6'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-700">{st.phone_number || '---'}</td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate">{st.notes || '---'}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setViewingStudent(st)}
                          title="Xem chi tiết đầy đủ từ CSDL"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => onOpenReceiptForStudent(st.profile_id)}
                              title="Đóng học phí"
                              className="p-1.5 rounded-lg bg-emerald-50 text-[#014D2F] hover:bg-[#014D2F] hover:text-white transition-colors"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEdit(st)}
                              title="Chỉnh sửa"
                              className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full Student Details Modal (View all fields stored in DB) */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="bg-[#014D2F] px-6 py-5 text-white flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold text-lg">
                  {viewingStudent.fullname.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight">{viewingStudent.fullname}</h3>
                  <p className="text-xs text-emerald-100">Thông tin chi tiết lưu trong CSDL Postgres</p>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-3 text-sm text-slate-700">
              <div className="bg-slate-50 p-4 rounded-xl space-y-2.5 border border-slate-100">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#014D2F]" /> Họ và tên:
                  </span>
                  <span className="font-bold text-slate-900">{viewingStudent.fullname}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#014D2F]" /> Năm sinh:
                  </span>
                  <span className="font-semibold text-slate-900">{viewingStudent.birth_year || 'N/A'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-2">
                    <User className="w-4 h-4 text-[#014D2F]" /> Giới tính:
                  </span>
                  <span className="font-semibold text-slate-900">{viewingStudent.gender || 'Nam'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#014D2F]" /> Ca học:
                  </span>
                  <span className="font-semibold text-[#014D2F] bg-emerald-100 px-2 py-0.5 rounded-full text-xs">
                    {viewingStudent.schedule || '2-4-6'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#014D2F]" /> Số điện thoại:
                  </span>
                  <span className="font-mono font-semibold text-slate-900">{viewingStudent.phone_number || '---'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#014D2F]" /> Email:
                  </span>
                  <span className="font-semibold text-slate-900">{viewingStudent.email || '---'}</span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#014D2F]" /> Địa chỉ:
                  </span>
                  <span className="font-semibold text-slate-900">{viewingStudent.current_address || '---'}</span>
                </div>

                <div className="flex justify-between py-1">
                  <span className="text-slate-500 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#014D2F]" /> Ghi chú:
                  </span>
                  <span className="font-medium text-slate-800 text-right max-w-[200px]">{viewingStudent.notes || '---'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setViewingStudent(null)}
                className="px-5 py-2 rounded-xl bg-[#014D2F] text-white font-medium text-sm hover:bg-[#013822] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {isAdmin && (
        <StudentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          student={editingStudent}
          onSuccess={onRefresh}
        />
      )}
    </div>
  );
}
