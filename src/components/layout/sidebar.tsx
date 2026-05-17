"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  LayoutDashboard,
  Users,
  CheckCircle,
  CalendarDays,
  Building2,
  RefreshCw,
  Share2,
  BarChart3,
  ScrollText,
  ChevronLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/constants";

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Target,
  Users,
  CheckCircle,
  CalendarDays,
  Building2,
  RefreshCw,
  Share2,
  BarChart3,
  ScrollText,
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  currentPath: string;
}

export function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, currentPath }: SidebarProps) {
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;
  const navItems = role ? NAV_ITEMS[role as keyof typeof NAV_ITEMS] || [] : [];

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col transition-all duration-300",
          collapsed ? "w-[72px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-bold text-lg gradient-text"
              >
                TrackFlow
              </motion.span>
            )}
          </Link>
          <button
            onClick={onToggle}
            className="hidden lg:flex w-7 h-7 rounded-md items-center justify-center hover:bg-sidebar-accent transition-colors"
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
          <button
            onClick={onMobileClose}
            className="lg:hidden w-7 h-7 rounded-md flex items-center justify-center hover:bg-sidebar-accent transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = iconMap[item.icon] || LayoutDashboard;
            const isActive = currentPath === item.href || currentPath.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-sidebar-primary/10 text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-sidebar-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon className={cn("w-5 h-5 shrink-0", isActive && "text-sidebar-primary")} />
                {!collapsed && (
                  <span className="truncate">{item.label}</span>
                )}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 rounded-md bg-popover text-popover-foreground text-xs font-medium shadow-lg border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        {session?.user && (
          <div className={cn("border-t border-sidebar-border p-3", collapsed ? "px-2" : "px-4")}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                {session.user.name?.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              {!collapsed && (
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate capitalize">
                    {role?.toLowerCase()}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
