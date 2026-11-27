import React, { useEffect, useState } from 'react';
import {
  Award,
  Users,
  FolderKanban,
  HardDrive,
  PlusCircle,
  ArrowRight,
  Sparkles,
  FileBadge,
  Clock,
  CheckCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import api from '../api/client';

interface DashboardStats {
  total_certificates: number;
  total_participants: number;
  total_projects: number;
  total_templates: number;
  storage_used_mb: number;
  storage_quota_mb: number;
  storage_percentage: number;
  recent_activities: any[];
  recent_projects: any[];
  saved_templates: any[];
}

interface DashboardViewProps {
  onNavigate: (tab: string, state?: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Top Banner & Quick Action */}
      <div
        className="rounded-2xl p-6 sm:p-8 border relative overflow-hidden shadow-sm"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-3"
            style={{ backgroundColor: 'var(--badge-bg)', color: 'var(--badge-text)' }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Automated Bulk Certificate SaaS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Empower your organization with verifiable bulk certificates
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] mt-2 leading-relaxed">
            Upload custom templates, import participant rosters from Excel, Word, or scanned PDFs, map fields visually, and distribute individually via Google Drive or multi-page combined PDF.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={() => onNavigate('create')}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg shadow-indigo-500/20 hover:opacity-95 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
              style={{ background: 'var(--primary-gradient)' }}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Certificate Batch</span>
            </button>
            <button
              onClick={() => onNavigate('templates')}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm border hover:bg-[var(--border-subtle)] transition-colors flex items-center gap-2 cursor-pointer"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            >
              <FileBadge className="w-4 h-4" />
              <span>Browse Templates</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div
          className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-30"
          style={{ background: 'var(--primary)' }}
        ></div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Certificates */}
        <div
          className="p-5 rounded-2xl border shadow-xs transition-transform hover:-translate-y-1"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Total Certificates</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}>
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {loading ? '...' : stats?.total_certificates ?? 0}
            </span>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Generated & securely recorded</p>
          </div>
        </div>

        {/* Total Participants */}
        <div
          className="p-5 rounded-2xl border shadow-xs transition-transform hover:-translate-y-1"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Participants Processed</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {loading ? '...' : stats?.total_participants ?? 0}
            </span>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Across all uploaded datasets</p>
          </div>
        </div>

        {/* Total Projects */}
        <div
          className="p-5 rounded-2xl border shadow-xs transition-transform hover:-translate-y-1"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Projects Created</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
              <FolderKanban className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {loading ? '...' : stats?.total_projects ?? 0}
            </span>
            <p className="text-[11px] text-[var(--text-muted)] mt-1">Active certificate campaigns</p>
          </div>
        </div>

        {/* Storage Usage */}
        <div
          className="p-5 rounded-2xl border shadow-xs transition-transform hover:-translate-y-1"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Storage Usage</span>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ background: 'linear-gradient(135deg, #ec4899 0%, #be123c 100%)' }}>
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-extrabold text-[var(--text-primary)]">
                {stats?.storage_used_mb ?? 0} MB
              </span>
              <span className="text-xs text-[var(--text-muted)]">of {stats?.storage_quota_mb ?? 1000} MB</span>
            </div>
            {/* Storage Progress Bar */}
            <div className="w-full bg-[var(--border-color)] h-2 rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(stats?.storage_percentage ?? 2, 2)}%`,
                  background: 'var(--primary-gradient)',
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Recent Projects & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects (2 Cols) */}
        <div
          className="lg:col-span-2 p-6 rounded-2xl border shadow-xs flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">Recent Projects</h3>
                <p className="text-xs text-[var(--text-secondary)]">Manage your certificate batches</p>
              </div>
              <button
                onClick={() => onNavigate('projects')}
                className="text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                style={{ color: 'var(--primary)' }}
              >
                <span>View All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">Loading projects...</div>
            ) : !stats?.recent_projects?.length ? (
              <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                No projects yet. Click "Create New Certificate Batch" to get started!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-[var(--text-muted)] font-semibold" style={{ borderColor: 'var(--border-color)' }}>
                      <th className="pb-3">Project & Event</th>
                      <th className="pb-3">Issue Date</th>
                      <th className="pb-3">Processed</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                    {stats.recent_projects.map((proj) => (
                      <tr key={proj.id} className="hover:bg-[var(--border-subtle)] transition-colors">
                        <td className="py-3 pr-3 font-semibold text-[var(--text-primary)]">
                          <div>{proj.name}</div>
                          <div className="text-[11px] font-normal text-[var(--text-muted)]">{proj.event_name}</div>
                        </td>
                        <td className="py-3 pr-3 text-[var(--text-secondary)]">{proj.issue_date || 'N/A'}</td>
                        <td className="py-3 pr-3">
                          <span className="font-medium text-[var(--text-primary)]">{proj.generated_count}</span>
                          <span className="text-[var(--text-muted)]"> / {proj.total_participants}</span>
                        </td>
                        <td className="py-3 pr-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              proj.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : proj.status === 'generated'
                                ? 'bg-indigo-500/10 text-indigo-600'
                                : 'bg-amber-500/10 text-amber-600'
                            }`}
                          >
                            {proj.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => onNavigate('certificates', { projectId: proj.id })}
                            className="font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                            style={{ color: 'var(--primary)' }}
                          >
                            <span>Manage</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities (1 Col) */}
        <div
          className="p-6 rounded-2xl border shadow-xs"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-[var(--text-primary)]">Recent Activities</h3>
              <p className="text-xs text-[var(--text-secondary)]">Audit trail & history</p>
            </div>
            <Clock className="w-4 h-4 text-[var(--text-muted)]" />
          </div>

          {!stats?.recent_activities?.length ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">No recent activity</div>
          ) : (
            <div className="space-y-4">
              {stats.recent_activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-[var(--text-primary)] leading-tight">
                      {act.project_name}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      Generated {act.count} certificates
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)]">{act.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Saved Templates Quick Shelf */}
      <div
        className="p-6 rounded-2xl border shadow-xs"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-[var(--text-primary)]">Saved Certificate Templates</h3>
            <p className="text-xs text-[var(--text-secondary)]">Pre-configured design layouts</p>
          </div>
          <button
            onClick={() => onNavigate('templates')}
            className="text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
            style={{ color: 'var(--primary)' }}
          >
            <span>Manage All Templates</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {stats?.saved_templates?.map((t) => (
            <div
              key={t.id}
              onClick={() => onNavigate('create', { templateId: t.id })}
              className="group border rounded-xl p-3 hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
            >
              <div className="aspect-[4/3] rounded-lg overflow-hidden border mb-2 relative bg-slate-100 dark:bg-slate-800" style={{ borderColor: 'var(--border-subtle)' }}>
                {t.preview_url ? (
                  <img src={t.preview_url} alt={t.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                    <FileBadge className="w-8 h-8" />
                  </div>
                )}
                <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-black/60 text-white backdrop-blur-xs">
                  {t.orientation}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-[var(--text-primary)] truncate">{t.name}</span>
                <ExternalLink className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}

          {/* Create Template Card */}
          <div
            onClick={() => onNavigate('create')}
            className="border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center hover:border-indigo-500/50 transition-colors cursor-pointer min-h-[140px]"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <PlusCircle className="w-6 h-6 text-[var(--text-muted)] mb-1" />
            <span className="text-xs font-bold text-[var(--text-primary)]">Upload New Template</span>
            <span className="text-[10px] text-[var(--text-muted)] mt-0.5">PNG, JPG, PDF supported</span>
          </div>
        </div>
      </div>
    </div>
  );
};
