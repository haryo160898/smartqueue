'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ServiceHistory, User } from '@/lib/types';
import { getStoredSession } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import { DashboardLayout } from '@/components/dashboard-layout';

export default function ServiceHistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [history, setHistory] = useState<ServiceHistory[]>([]);

  useEffect(() => {
    const stored = getStoredSession();
    if (!stored) {
      router.push('/login');
      return;
    }

    // Normalize stored session user to match `User` type
    const u: any = stored.user;
    const normalizedUser = {
      ...u,
      id: String(u.id),
      created_at: u.created_at ? new Date(u.created_at) : u.createdAt ? new Date(u.createdAt) : new Date(),
      updated_at: u.updated_at ? new Date(u.updated_at) : u.updatedAt ? new Date(u.updatedAt) : undefined,
    } as any;
    setUser(normalizedUser);

    const fetchHistory = async () => {
      try {
        const result = await apiClient.get('/service-history');
        setHistory(
          (result.data || []).map((item: any) => ({
            id: String(item.id),
            queue_id: String(item.queue_id),
            completed_at: item.completed_at ? new Date(item.completed_at) : null,
            queue_number: item.queue_number || '',
            user_name: item.user_name || '',
            merk: item.merk || '',
            tipe: item.tipe || '',
            complaint: item.complaint || '',
          }))
        );
      } catch (error) {
        console.error('Fetch service history error:', error);
        toast.error('Gagal memuat riwayat service. Silakan login ulang.');
        router.push('/login');
      }
    };

    fetchHistory();
  }, [router]);

  if (!user) {
    return <p className="text-muted-foreground">Loading...</p>;
  }

  return (
    <DashboardLayout>
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Riwayat Service</h1>
          <p className="mt-2 text-foreground/60">Daftar service yang telah diselesaikan</p>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {history.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-foreground/60">Belum ada riwayat service</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Nomor Antrian
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Kendaraan
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Keluhan
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      Tanggal Selesai
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {item.queue_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground/60">
                        {item.merk ? `${item.merk} ${item.tipe}` : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground/60">
                        {item.complaint}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground/60">
                        {item.completed_at
                          ? new Date(item.completed_at).toLocaleDateString('id-ID')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
