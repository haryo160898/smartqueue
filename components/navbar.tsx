'use client';

import { Bell, Settings, LogOut, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ThemeToggle } from './theme-toggle';
import { apiClient } from '@/lib/api-client';

interface NavbarProps {
  userName: string;
  userRole: string;
}

export function Navbar({ userName, userRole }: NavbarProps) {
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await apiClient.get('/notifications/count');
        if (res?.success) {
          setUnreadCount(res.data?.count || 0);
        }
      } catch (error) {
        console.error('Fetch unread notification count error:', error);
      }
    };

    const handleNotificationCountUpdate = () => {
      fetchUnreadCount();
    };

    fetchUnreadCount();
    window.addEventListener('notificationCountUpdated', handleNotificationCountUpdate);
    const interval = window.setInterval(fetchUnreadCount, 10000);

    return () => {
      window.removeEventListener('notificationCountUpdated', handleNotificationCountUpdate);
      window.clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    toast.success('Berhasil logout');
    router.push('/login');
  };

  return (
    <nav className="fixed top-0 right-0 left-0 z-20 border-b border-border bg-card md:left-64 transition-colors duration-300">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="text-foreground/60">
          <p className="text-sm font-medium">Selamat datang kembali!</p>
        </div>

        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative p-2 text-foreground/60 hover:bg-muted rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>

          {/* Settings */}
          <Link
            href="/settings"
            className="p-2 text-foreground/60 hover:bg-muted rounded-lg transition-colors"
          >
            <Settings className="h-5 w-5" />
          </Link>

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-muted transition-colors"
            >
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground">{userName}</p>
                <p className="text-xs text-foreground/60 capitalize">{userRole}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <User className="h-4 w-4" />
                  Profil Saya
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Pengaturan
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/10 transition-colors border-t border-border"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
