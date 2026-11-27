import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  FileBadge,
  Award,
  ShieldCheck,
  Settings,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setTab }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create Certificates', icon: PlusCircle, badge: 'Batch' },
    { id: 'projects', label: 'My Projects', icon: FolderKanban },
    { id: 'templates', label: 'Templates', icon: FileBadge },
    { id: 'certificates', label: 'Generated Certificates', icon: Award },
    { id: 'verify', label: 'Verify Certificate', icon: ShieldCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className="w-64 border-r shrink-0 hidden md:flex flex-col justify-between transition-colors h-screen sticky top-0"
      style={{
        backgroundColor: 'var(--bg-sidebar)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 border-b px-6 flex items-center gap-3" style={{ borderColor: 'var(--border-color)' }}>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20"
            style={{ background: 'var(--primary-gradient)' }}
          >
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[var(--text-primary)]">CertiFlow</span>
              <span
                className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}
              >
                SaaS
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] -mt-0.5">Bulk Certificate Platform</p>
          </div>
        </div>

        {/* Quick Batch CTA */}
        <div className="p-4">
          <button
            onClick={() => setTab('create')}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition-all cursor-pointer group"
            style={{ background: 'var(--primary-gradient)' }}
          >
            <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12" />
            <span>Create New Batch</span>
          </button>
        </div>

        {/* Navigation List */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border-subtle)]'
                }`}
                style={
                  isActive
                    ? {
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                      }
                    : {}
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--primary)]' : 'text-[var(--text-muted)]'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: isActive ? 'var(--primary)' : 'var(--border-color)',
                      color: isActive ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t m-3 rounded-xl" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Engine Online</span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          High-fidelity PDF generation & instant QR verification ready.
        </p>
      </div>
    </aside>
  );
};
