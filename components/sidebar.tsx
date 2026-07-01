'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { NAVIGATION_ITEMS_ADMIN, NAVIGATION_ITEMS_USER } from '@/lib/constants';

interface SidebarProps {
  role: 'admin' | 'user';
  userName: string;
}

export function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const items = role === 'admin' ? NAVIGATION_ITEMS_ADMIN : NAVIGATION_ITEMS_USER;

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-40 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground md:hidden"
      >
        {isOpen ? 'Tutup' : 'Menu'}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-30 h-screen w-64 bg-sidebar text-sidebar-foreground transition-transform md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="border-b border-sidebar-border p-6">
            <div className="flex items-center gap-3">
              <Image
                src="/brand-logo.png"
                alt="Bengkel Raka Smart Queue"
                width={64}
                height={64}
                className="h-16 w-16 rounded-2xl object-contain"
              />
              <div>
                <h1 className="text-xl font-bold">BENGKEL RAKA</h1>
                <p className="mt-0.5 text-xs text-sidebar-foreground/60">Smart Queue</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="border-b border-sidebar-border px-6 py-4">
            <p className="text-sm font-medium text-sidebar-foreground/70">Halo,</p>
            <p className="mt-1 truncate text-sm font-semibold text-sidebar-foreground">{userName}</p>
            <span className="mt-2 inline-block rounded-full bg-sidebar-primary text-sidebar-primary-foreground px-2 py-1 text-xs font-medium">
              {role === 'admin' ? 'Admin' : 'User'}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent'
                  }`}
                >
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-sidebar-border p-4">
            <Link
              href="/login"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors"
            >
              <span>Keluar</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
