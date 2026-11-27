import React from 'react';
import { Award, User, LogOut, CheckCircle2 } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  currentTab: string;
  onOpenAuth: () => void;
  onOpenVerify: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenAuth, onOpenVerify }) => {
  const { user, logout } = useAuth();

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard': return 'Organization Dashboard';
      case 'create': return 'Batch Certificate Generator';
      case 'projects': return 'Certificate Projects';
      case 'templates': return 'Design Templates';
      case 'certificates': return 'Generated Certificates';
      case 'verify': return 'Certificate Verification Portal';
      case 'settings': return 'Organization Settings';
      default: return 'CertiFlow';
    }
  };

  return (
    <header
      className="sticky top-0 z-30 h-16 border-b px-4 sm:px-6 flex items-center justify-between backdrop-blur-md transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      {/* Left: Breadcrumb / Title */}
      <div className="flex items-center gap-3">
        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: 'var(--primary-gradient)' }}>
            <Award className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight">CertiFlow</span>
        </div>
        <div className="hidden md:flex flex-col">
          <h1 className="text-base font-bold tracking-tight text-[var(--text-primary)]">
            {getPageTitle(currentTab)}
          </h1>
          <span className="text-xs text-[var(--text-secondary)]">
            {user?.organization?.name || 'Bulk Certificate Platform'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Verification Portal Shortcut */}
        <button
          onClick={onOpenVerify}
          className="px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          title="Verify any certificate ID or QR code"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline">Verify Certificate</span>
        </button>

        {/* Half-Moon Theme Switcher */}
        <ThemeToggle />

        {/* User Profile / Auth */}
        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l" style={{ borderColor: 'var(--border-color)' }}>
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[var(--text-primary)] leading-tight">{user.full_name}</span>
              <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[120px]">{user.organization?.name || user.role}</span>
            </div>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs"
              style={{ background: 'var(--primary-gradient)' }}>
              {user.full_name.charAt(0)}
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 cursor-pointer flex items-center gap-1.5"
            style={{ background: 'var(--primary-gradient)' }}
          >
            <User className="w-3.5 h-3.5" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
