'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User as UserIcon, LogOut, Package, Shield, ChevronDown } from 'lucide-react';
import { useCartSync } from '@/hooks/useCartSync';
import type { User } from '@/server/db/schema';

interface AccountMenuProps {
  user: User | null;
}

export function AccountMenu({ user }: AccountMenuProps) {
  useCartSync(Boolean(user));
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[var(--ivory)] hover:text-[var(--gold)] transition-colors py-2 px-3 rounded-md border border-[var(--gold)]/20 hover:border-[var(--gold)]/50"
      >
        <UserIcon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sign In</span>
      </Link>
    );
  }

  const initials = (user.name || user.email)
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-full hover:ring-1 hover:ring-[var(--gold)]/40 transition-all focus:outline-none"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User account menu"
      >
        {user.avatarUrl ? (
          <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[var(--gold)]/40">
            <Image
              src={user.avatarUrl}
              alt={user.name || 'User avatar'}
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-[var(--charcoal)] border border-[var(--gold)]/40 flex items-center justify-center text-[var(--gold)] text-xs font-semibold">
            {initials}
          </div>
        )}
        <span className="hidden md:inline text-xs font-medium text-[var(--ivory)] max-w-[120px] truncate">
          {user.name || user.email.split('@')[0]}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--muted)] hidden sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-60 bg-[var(--charcoal)] border border-[var(--gold)]/25 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 backdrop-blur-lg">
          {/* User profile info header */}
          <div className="px-4 py-3 border-b border-[var(--sand)]/10">
            <p className="text-xs font-medium text-[var(--ivory)] truncate">
              {user.name || 'Valued Client'}
            </p>
            <p className="text-[11px] text-[var(--muted)] truncate mt-0.5">{user.email}</p>
            {user.role === 'admin' && (
              <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30">
                <Shield className="w-2.5 h-2.5" />
                Store Admin
              </span>
            )}
          </div>

          {/* Menu links */}
          <div className="py-1.5 text-xs">
            {user.role === 'admin' && (
              <Link
                href="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2 text-[var(--sand)] hover:bg-[var(--ink)] hover:text-[var(--gold)] transition-colors"
              >
                <Shield className="w-3.5 h-3.5 text-[var(--gold)]" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            <Link
              href="/orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 text-[var(--sand)] hover:bg-[var(--ink)] hover:text-[var(--gold)] transition-colors"
            >
              <Package className="w-3.5 h-3.5" />
              <span>My Orders</span>
            </Link>
          </div>

          {/* Logout button */}
          <div className="pt-1.5 border-t border-[var(--sand)]/10">
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[var(--danger)] hover:bg-[var(--ink)] transition-colors text-left"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
