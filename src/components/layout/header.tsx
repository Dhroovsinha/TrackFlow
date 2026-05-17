"use client";

import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Menu, Moon, Sun, Bell, LogOut, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="h-full flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="hidden md:block">
            <h2 className="text-sm font-medium text-muted-foreground">
              {role === "ADMIN" ? "Administration" : role === "MANAGER" ? "Team Management" : "My Workspace"}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="relative"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
              3
            </span>
          </Button>

          {/* User menu */}
          <div className="flex items-center gap-3 ml-2 pl-2 border-l border-border">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <div className="flex items-center gap-1.5 justify-end">
                <Badge variant={role === "ADMIN" ? "warning" : role === "MANAGER" ? "info" : "success"} className="text-[10px] py-0 h-4">
                  {role}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
