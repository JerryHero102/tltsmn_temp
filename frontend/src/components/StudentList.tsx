'use client';

import React, { useState } from 'react';
import { Search, UserPlus, Edit, DollarSign, Eye, X, User, Phone, Calendar, Mail, MapPin, BookOpen, FileText, Filter, RotateCcw } from 'lucide-react';
import StudentModal from './StudentModal';
import { useAuth } from '@/context/AuthContext';
import { matchSearch } from '@/lib/api';

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
  current_level?: string;
  id_system: string;
}

interface StudentListProps {
  students: Student[];
  onRefresh: () => void;
  onOpenReceiptForStudent: (studentId: string) => void;
}

export default function StudentList({ students, onRefresh, onOpenReceiptForStudent }: StudentListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [scheduleFilter, setScheduleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>(undefined);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);

  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const filteredStudents = students.filter((st) => {
    const matchesSearch =
      matchSearch(st.fullname, searchTerm) ||
      matchSearch(st.phone_number, searchTerm) ||
      matchSearch(st.schedule, searchTerm);

    const matchesSchedule =
      scheduleFilter === 'all' || (st.schedule || '2-4-6') === scheduleFilter;

    return matchesSearch && matchesSchedule;
  });

  const countTotal = filteredStudents.length;
  const count246 = filteredStudents.filter((st) => (st.schedule || '2-4-6') === '2-4-6').length;
  const count357 = filteredStudents.filter((st) => st.schedule === '3-5-7').length;

  const handleOpenAdd = () => {
    setEditingStudent(undefined);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudent(st);
    setIsModalOpen(true);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setScheduleFilter('all');
  };

  return (
    <div className="space-y-4">
      {/* Search & Add Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl shadow-xs border border-slate-100">
        <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 w-full">
          {/* Search Input & Reset button */}
          <div className="relative flex-1 w-full flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên, SĐT (không dấu, dambaolinh...)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-slate-50/50 font-medium"
              />
            </div>
            {(searchTerm || scheduleFilter !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition-colors shrink-0 flex items-center gap-1"
                title="Xóa tất cả bộ lọc"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Xóa lọc</span>
              </button>
            )}
          </div>

          {/* Schedule Filter Dropdown */}
          <div className="relative w-full sm:w-44 shrink-0">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
            <select
              value={scheduleFilter}
              onChange={(e) => setScheduleFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-base sm:text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#014D2F] bg-white font-semibold text-slate-700"
            >
              <option value="all">Tất cả ca học</option>
              <option value="2-4-6">Ca 2-4-6</option>
              <option value="3-5-7">Ca 3-5-7</option>
              <option value="Khác">Ca Linh hoạt / Khác</option>
            </select>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-[#014D2F] hover:bg-[#013822] text-white font-semibold text-sm transition-all shadow-md shadow-emerald-900/10 hover:scale-[1.01] shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Thêm Học Viên</span>
          </button>
        )}
      </div>

      {/* MOBILE VIEW (Compact cards, no wrapping text) */}
      <div className="md:hidden space-y-2.5">
        {/* Mobile Summary Banner */}
        <div className="bg-[#014D2F]/10 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold text-[#014D2F] flex items-center justify-between">
          <span>Học viên: {countTotal}</span>
          <span>2-4-6: {count246}</span>
          <span>3-5-7: {count357}</span>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl text-center text-slate-400 text-sm border border-slate-100">
            Không tìm thấy học viên nào phù hợp.
          </div>
        ) : (
          filteredStudents.map((st, idx) => (
            <div
              key={st.profile_id}
              onClick={() => setViewingStudent(st)}
              className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-2 cursor-pointer hover:border-emerald-300 hover:shadow-sm transition-all"
            >
              {/* Header row: STT + Fullname (Single line, no line break) + Actions */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-slate-900 text-sm hover:text-[#014D2F] truncate text-left">
                    {st.fullname}
                  </span>
                </div>

                {/* Mobile action buttons */}
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setViewingStudent(st);
                    }}
                    title="Xem chi tiết"
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {isAdmin && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenReceiptForStudent(st.profile_id);
                        }}
                        title="Đóng học phí"
                        className="p-1.5 rounded-lg bg-emerald-50 text-[#014D2F] hover:bg-[#014D2F] hover:text-white transition-colors"
                      >
                        <DollarSign className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(st);
                        }}
                        title="Chỉnh sửa"
                        className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Sub-row: Gộp Giới tính, Năm sinh, Ca học, SĐT trên 1 dòng duy nhất */}
              <div className="flex items-center flex-wrap gap-1.5 text-xs text-slate-600 pt-1 border-t border-slate-50">
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700">
                  {st.gender || 'Nữ'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium text-slate-700">
                  {st.birth_year || (st.date_of_birth ? new Date(st.date_of_birth).getFullYear() : '2016')}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md font-semibold ${
                    st.schedule === '2-4-6'
                      ? 'bg-emerald-100 text-[#014D2F]'
                      : st.schedule === '3-5-7'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Ca {st.schedule || '3-5-7'}
                </span>
                {st.phone_number && (
                  <span className="font-mono text-slate-500 text-[11px] ml-auto">
                    📞 {st.phone_number}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {/* Stat Summary Row on top of table header */}
              <tr className="bg-[#014D2F]/5 border-b border-emerald-100/80 text-xs font-extrabold text-[#014D2F]">
                <th colSpan={9} className="py-2.5 px-4 text-left whitespace-nowrap">
                  Học viên: {countTotal} &nbsp;|&nbsp; 2-4-6: {count246} &nbsp;|&nbsp; 3-5-7: {count357}
                </th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-200/80 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">STT</th>
                <th className="py-3 px-6">Họ và Tên</th>
                <th className="py-3 px-4 text-center">Năm sinh</th>
                <th className="py-3 px-4 text-center">Ca học</th>
                <th className="py-3 px-4 text-center">Ngày nhập học</th>
                <th className="py-3 px-4">Cấp đai / Trình độ</th>
                <th className="py-3 px-4">SĐT</th>
                <th className="py-3 px-6">Ghi chú</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-800">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-sm">
                    Không tìm thấy thông tin học viên nào trong CSDL.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, idx) => (
                  <tr
                    key={st.profile_id}
                    onClick={() => setViewingStudent(st)}
                    className="hover:bg-emerald-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-4 px-4 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-900 hover:text-[#014D2F] hover:underline text-left">
                        {st.fullname}
                      </span>
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
                    <td className="py-4 px-4 text-center font-semibold text-slate-700">
                      {st.date_of_join ? st.date_of_join.split('-').reverse().join('/') : '10/01/2026'}
                    </td>
                    <td className="py-4 px-4 text-slate-700 font-medium">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold">
                        {st.current_level || 'Cấp 1 - Đai Trắng'}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-slate-700">{st.phone_number || '---'}</td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate">{st.notes || '---'}</td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingStudent(st);
                          }}
                          title="Xem chi tiết đầy đủ từ CSDL"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenReceiptForStudent(st.profile_id);
                              }}
                              title="Đóng học phí"
                              className="p-1.5 rounded-lg bg-emerald-50 text-[#014D2F] hover:bg-[#014D2F] hover:text-white transition-colors"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(st);
                              }}
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
                    <Calendar className="w-4 h-4 text-[#014D2F]" /> Ngày nhập học:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {viewingStudent.date_of_join ? viewingStudent.date_of_join.split('-').reverse().join('/') : '10/01/2026'}
                  </span>
                </div>

                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#014D2F]" /> Cấp đai / Trình độ:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {viewingStudent.current_level || 'Cấp 1 - Đai Trắng'}
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
