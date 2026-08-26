"use client";
import React, { useState } from "react";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

interface ConsolAdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function ConsolAdminLayout({
  children,
  title = "Console Admin",
  subtitle = "Dashboard Pengelolaan E-Tiket BNC 2026",
}: ConsolAdminLayoutProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    {
      href: "/consol_admin",
      label: "Dashboard",
      icon: "dashboard",
      exact: true,
    },
    {
      href: "/consol_admin/tickets",
      label: "Data Tiket",
      icon: "confirmation_number",
    },
    {
      href: "/consol_admin/orders",
      label: "Transaksi",
      icon: "receipt_long",
    },
    {
      href: "/consol_admin/events",
      label: "Pengaturan Acara",
      icon: "event",
    },
    {
      href: "/consol_admin/scan",
      label: "Scanner Gate",
      icon: "qr_code_scanner",
      external: false,
    },
    {
      href: "/consol_admin/settings",
      label: "Sistem & Integrasi",
      icon: "settings",
    },
  ];

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const res = await fetch("/api/admin/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Sesi admin berhasil diakhiri.");
        window.location.href = "/consol_admin";
      } else {
        toast.error("Gagal mengakhiri sesi admin.");
        setIsLoggingOut(false);
      }
    } catch {
      toast.error("Terjadi kendala jaringan.");
      setIsLoggingOut(false);
    }
  };

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return pathname === item.href || pathname === "/consol_admin/dashboard";
    }
    return pathname.startsWith(item.href);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col md:flex-row font-sans selection:bg-primary-container selection:text-on-primary-container">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-surface border-r border-outline-variant p-4 sticky top-0 h-screen z-30">
        {/* Logo / Brand */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-outline-variant mb-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"
            style={{ backgroundColor: "rgb(185, 239, 197)", color: "rgb(42, 91, 59)" }}
          >
            <span className="material-symbols-outlined text-2xl font-bold">admin_panel_settings</span>
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-on-surface leading-tight">BNC 2026</h2>
            <span className="text-[10px] font-bold text-primary block" style={{ color: "rgb(56, 105, 72)" }}>
              Admin Console
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-primary text-on-primary shadow-sm"
                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
                style={active ? { backgroundColor: "rgb(56, 105, 72)", color: "#ffffff" } : undefined}
              >
                <span className="material-symbols-outlined text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User & Logout */}
        <div className="pt-4 border-t border-outline-variant space-y-2">
          <div className="px-3 py-2 bg-surface-container-low rounded-xl flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-on-surface truncate">Admin Authenticated</p>
              <p className="text-[9px] text-on-surface-variant">Sesi Aktif (HTTP-Only)</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-sm">logout</span>
            )}
            <span>Keluar dari Console</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-surface border-b border-outline-variant px-4 py-3 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-on-primary"
            style={{ backgroundColor: "rgb(56, 105, 72)" }}
          >
            <span className="material-symbols-outlined text-lg">admin_panel_settings</span>
          </div>
          <div>
            <h2 className="text-xs font-bold text-on-surface">Console Admin</h2>
            <p className="text-[10px] text-on-surface-variant">BNC 2026</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/consol_admin/scan"
            className="p-2 rounded-lg bg-surface-container text-on-surface hover:opacity-80"
            title="Scan QR"
          >
            <span className="material-symbols-outlined text-lg">qr_code_scanner</span>
          </Link>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-surface-container text-on-surface"
          >
            <span className="material-symbols-outlined text-lg">
              {isMobileMenuOpen ? "close" : "menu"}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-surface border-b border-outline-variant p-4 space-y-2 z-30 shadow-lg">
          {navItems.map((item) => {
            const active = isActive(item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold ${
                  active
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-container"
                }`}
                style={active ? { backgroundColor: "rgb(56, 105, 72)", color: "#ffffff" } : undefined}
              >
                <span className="material-symbols-outlined text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
          <div className="pt-2 border-t border-outline-variant">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-600 text-xs font-bold"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span>Keluar dari Console</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar on desktop */}
        <header className="hidden md:flex items-center justify-between bg-surface border-b border-outline-variant px-8 py-4">
          <div>
            <h1 className="text-lg font-extrabold text-on-surface">{title}</h1>
            <p className="text-xs text-on-surface-variant">{subtitle}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/consol_admin/scan"
              className="py-2 px-3.5 rounded-xl text-on-primary text-xs font-bold flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all"
              style={{ backgroundColor: "rgb(56, 105, 72)" }}
            >
              <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
              <span>Scanner Gate</span>
            </Link>
            <Link
              href="/"
              target="_blank"
              className="py-2 px-3.5 rounded-xl border border-outline-variant text-on-surface text-xs font-bold flex items-center gap-1.5 hover:bg-surface-container transition-all"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              <span>Lihat Website</span>
            </Link>
          </div>
        </header>

        {/* Page Children Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto pb-24 md:pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
