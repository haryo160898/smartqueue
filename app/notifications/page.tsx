'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Trash2, CheckSquare } from 'lucide-react';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient } from '@/lib/api-client';
import { getStoredSession } from '@/lib/auth';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    const storedSession = getStoredSession();
    if (!storedSession) {
      router.push('/login');
      return;
    }

    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get('/notifications');
        if (!res.success) {
          toast.error(res.message || 'Gagal memuat notifikasi');
          return;
        }

        setNotifications((res.data || []).map((notification: any) => ({
          id: String(notification.id),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          read: Boolean(notification.read),
          createdAt: new Date(notification.created_at || notification.createdAt),
        })));
      } catch (error) {
        console.error('Fetch notifications error:', error);
        toast.error('Gagal memuat notifikasi');
      }
    };

    fetchNotifications();
  }, [router]);

  const filteredNotifications = filter === 'unread' 
    ? notifications.filter(n => !n.read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const res = await apiClient.post(`/notifications/${id}/read`, {});
      if (!res.success) {
        toast.error(res.message || 'Gagal menandai notifikasi sebagai dibaca');
        return;
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      window.dispatchEvent(new CustomEvent('notificationCountUpdated'));
      toast.success('Notifikasi ditandai sebagai dibaca');
    } catch (error) {
      console.error('Mark notification read error:', error);
      toast.error('Gagal menandai notifikasi sebagai dibaca');
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await apiClient.post('/notifications/read-all', {});
      if (!res.success) {
        toast.error(res.message || 'Gagal menandai semua notifikasi sebagai dibaca');
        return;
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      window.dispatchEvent(new CustomEvent('notificationCountUpdated'));
      toast.success('Semua notifikasi ditandai sebagai dibaca');
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      toast.error('Gagal menandai semua notifikasi sebagai dibaca');
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const res = await apiClient.delete(`/notifications/${id}`);
      if (!res.success) {
        toast.error(res.message || 'Gagal menghapus notifikasi');
        return;
      }

      setNotifications((prev) => prev.filter((n) => n.id !== id));
      window.dispatchEvent(new CustomEvent('notificationCountUpdated'));
      toast.success('Notifikasi dihapus');
    } catch (error) {
      console.error('Delete notification error:', error);
      toast.error('Gagal menghapus notifikasi');
    }
  };

  const deleteAllNotifications = async () => {
    try {
      const res = await apiClient.delete('/notifications');
      if (!res.success) {
        toast.error(res.message || 'Gagal menghapus semua notifikasi');
        return;
      }

      setNotifications([]);
      window.dispatchEvent(new CustomEvent('notificationCountUpdated'));
      toast.success('Semua notifikasi dihapus');
    } catch (error) {
      console.error('Delete all notifications error:', error);
      toast.error('Gagal menghapus semua notifikasi');
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-success/10 border-success/30 text-success';
      case 'warning':
        return 'bg-warning/10 border-warning/30 text-warning';
      case 'error':
        return 'bg-danger/10 border-danger/30 text-danger';
      default:
        return 'bg-primary/10 border-primary/30 text-primary';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✕';
      default:
        return 'ℹ';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifikasi</h1>
            <p className="mt-2 text-sm text-foreground/60">
              {unreadCount} notifikasi belum dibaca
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn-primary flex items-center gap-2"
            >
              <CheckSquare className="h-4 w-4" />
              Tandai Semua Dibaca
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b border-border">
          <button
            onClick={() => setFilter('all')}
            className={`pb-4 px-2 text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'border-b-2 border-primary text-primary'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Semua ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`pb-4 px-2 text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'border-b-2 border-primary text-primary'
                : 'text-foreground/60 hover:text-foreground'
            }`}
          >
            Belum Dibaca ({unreadCount})
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-foreground/60">
                {filter === 'unread' ? 'Tidak ada notifikasi belum dibaca' : 'Tidak ada notifikasi'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`card-base ${getTypeStyles(notification.type)} ${
                  !notification.read ? 'border-l-4' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-1 text-lg">{getTypeIcon(notification.type)}</div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">
                          {notification.title}
                        </h3>
                        <p className="mt-1 text-sm text-foreground/80">
                          {notification.message}
                        </p>
                        <p className="mt-2 text-xs text-foreground/50">
                          {notification.createdAt.toLocaleDateString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      {/* Status Badge */}
                      {!notification.read && (
                        <div className="flex-shrink-0 h-2 w-2 bg-primary rounded-full mt-2" />
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Tandai sebagai dibaca"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Hapus notifikasi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Delete All Button */}
        {notifications.length > 0 && (
          <div className="pt-4 border-t border-border">
            <button
              onClick={deleteAllNotifications}
              className="text-sm text-destructive hover:text-destructive/80 transition-colors"
            >
              Hapus Semua Notifikasi
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
