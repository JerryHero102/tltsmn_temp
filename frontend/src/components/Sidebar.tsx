"use client";

import React, { useState } from "react";
import {
  Users,
  Receipt,
  LogOut,
  PlusCircle,
  Shield,
  Menu,
  X,
  User,
} from "lucide-react";
import UserProfileModal from "./UserProfileModal";

interface SidebarProps {
  activeTab: "students" | "tuition";
  setActiveTab: (tab: "students" | "tuition") => void;
  user: any;
  onLogout: () => void;
  onOpenReceiptModal: () => void;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  onOpenReceiptModal,
}: SidebarProps) {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#014D2F] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white shadow-xs">
            <img
              src="https://res.cloudinary.com/sxotasqj/image/upload/v1786467529/logo_yyeqco.jpg"
              alt="TLTSMN Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-bold text-base tracking-wide">
            {isAdmin ? "TLTSMN Admin" : "TLTSMN Học Viên"}
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-emerald-800/60 hover:bg-emerald-800 text-white transition-colors"
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Backdrop for Mobile */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-40 w-64 h-screen bg-[#014D2F] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out shadow-xl md:shadow-none shrink-0 ${
          mobileMenuOpen
            ? "translate-x-0"
            : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Top Logo & Title */}
        <div>
          <div className="p-6 border-b border-emerald-800/80 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-white border border-white/20">
              <img
                src="https://res.cloudinary.com/sxotasqj/image/upload/v1786467529/logo_yyeqco.jpg"
                alt="TLTSMN Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-white leading-tight">
                TLTSMN
              </h1>
              <p className="text-[11px] text-emerald-200 uppercase tracking-wider font-medium">
                {isAdmin ? "Quản Lý Học Viên" : "Trang Học Viên"}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => {
                setActiveTab("students");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === "students"
                  ? "bg-white/15 text-white shadow-md border border-white/10 font-semibold"
                  : "text-emerald-100/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Users
                className={`w-5 h-5 ${activeTab === "students" ? "text-emerald-300" : "text-emerald-200"}`}
              />
              <span>
                {isAdmin ? "Thông tin học viên" : "Thông tin cá nhân"}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("tuition");
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === "tuition"
                  ? "bg-white/15 text-white shadow-md border border-white/10 font-semibold"
                  : "text-emerald-100/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Receipt
                className={`w-5 h-5 ${activeTab === "tuition" ? "text-emerald-300" : "text-emerald-200"}`}
              />
              <span>{isAdmin ? "Thông tin học phí" : "Học phí cá nhân"}</span>
            </button>

            {/* Quick Add Receipt Button (Admin Only) */}
            {isAdmin && (
              <div className="pt-4">
                <button
                  onClick={() => {
                    onOpenReceiptModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#014D2F] font-bold text-sm transition-all shadow-md shadow-emerald-900/30 hover:scale-[1.02]"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span>Thêm Biên Lai</span>
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Bottom User & Logout Section */}
        <div className="p-4 border-t border-emerald-800/80 space-y-2 bg-emerald-950/20">
          {/* User Fullname Button */}
          <button
            onClick={() => setIsProfileModalOpen(true)}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl hover:bg-white/10 transition-colors text-left group"
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm text-emerald-100 group-hover:bg-white/30 transition-colors">
              {user?.fullname ? (
                user.fullname.charAt(0).toUpperCase()
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate leading-tight">
                {user?.fullname || "Tài khoản"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    isAdmin
                      ? "bg-amber-400 text-amber-950"
                      : "bg-emerald-300 text-emerald-950"
                  }`}
                >
                  {isAdmin ? "Admin" : "Học viên"}
                </span>
                <span className="text-[11px] text-emerald-200/80 truncate">
                  ID: {user?.id_system || "N/A"}
                </span>
              </div>
            </div>
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-red-200 hover:bg-red-900/30 hover:text-red-100 font-medium text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Modal Profile Info */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
      />
    </>
  );
}
