import React, { useEffect, useState } from 'react';
import {
  FolderKanban,
  PlusCircle,
  FileText,
  Download,
  FolderArchive,
  ArrowRight,
  Sparkles,
  Calendar,
  Users
} from 'lucide-react';
import api from '../api/client';

interface ProjectsViewProps {
  onNavigate: (tab: string, state?: any) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onNavigate, showToast }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCombined = async (projectId: number, projectName: string) => {
    try {
      const res = await api.get(`/distribution/combined-pdf/${projectId}`);
      if (res.data.download_url) {
        window.open(res.data.download_url, '_blank');
        showToast(`Opening Combined PDF for ${projectName}`, 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Combined PDF not available yet', 'error');
    }
  };

  const handleDownloadZip = async (projectId: number, projectName: string) => {
    try {
      const res = await api.get(`/distribution/zip-archive/${projectId}`);
      if (res.data.download_url) {
        window.open(res.data.download_url, '_blank');
        showToast(`Downloading ZIP for ${projectName}`, 'success');
      }
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'ZIP archive not available yet', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            My Certificate Projects
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Manage your past and ongoing certificate generation batches and distribution files.
          </p>
        </div>

        <button
          onClick={() => onNavigate('create')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center gap-2 cursor-pointer self-start"
          style={{ background: 'var(--primary-gradient)' }}
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Certificate Batch</span>
        </button>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[var(--text-muted)]">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <FolderKanban className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="font-bold text-base text-[var(--text-primary)]">No Projects Created Yet</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4 max-w-sm mx-auto">
            Create your first batch of certificates by uploading a design template and participant data.
          </p>
          <button
            onClick={() => onNavigate('create')}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md"
            style={{ background: 'var(--primary-gradient)' }}
          >
            Create New Batch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              className="p-5 rounded-2xl border shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">{proj.name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">{proj.event_name}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase shrink-0 ${
                      proj.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : proj.status === 'generated'
                        ? 'bg-indigo-500/10 text-indigo-600'
                        : 'bg-amber-500/10 text-amber-600'
                    }`}
                  >
                    {proj.status}
                  </span>
                </div>

                <div className="space-y-2 py-3 border-y text-xs text-[var(--text-secondary)] mb-4" style={{ borderColor: 'var(--border-subtle)' }}>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>Issue Date: <span className="font-semibold text-[var(--text-primary)]">{proj.issue_date || 'N/A'}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>Generated: <span className="font-bold text-[var(--text-primary)]">{proj.generated_count}</span> of {proj.total_participants}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span>Template: <span className="font-medium text-[var(--text-primary)]">{proj.template_name}</span></span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={() => onNavigate('certificates', { projectId: proj.id })}
                  className="w-full py-2 px-3 rounded-xl font-bold text-xs text-white shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{ background: 'var(--primary-gradient)' }}
                >
                  <span>View Certificates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleDownloadCombined(proj.id, proj.name)}
                    className="py-1.5 px-2 rounded-lg border text-[11px] font-semibold hover:bg-[var(--border-subtle)] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    title="Download Combined Multi-page PDF"
                  >
                    <FileText className="w-3 h-3 text-indigo-500" />
                    <span>Combined PDF</span>
                  </button>
                  <button
                    onClick={() => handleDownloadZip(proj.id, proj.name)}
                    className="py-1.5 px-2 rounded-lg border text-[11px] font-semibold hover:bg-[var(--border-subtle)] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    title="Download individual PDFs in ZIP"
                  >
                    <FolderArchive className="w-3 h-3 text-amber-500" />
                    <span>ZIP Archive</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
