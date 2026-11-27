import React, { useEffect, useState } from 'react';
import {
  FileBadge,
  PlusCircle,
  Edit,
  Trash2,
  Sparkles,
  ExternalLink,
  Layers
} from 'lucide-react';
import api from '../api/client';

interface TemplatesGalleryViewProps {
  onNavigate: (tab: string, state?: any) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const TemplatesGalleryView: React.FC<TemplatesGalleryViewProps> = ({
  onNavigate,
  showToast,
}) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await api.get('/templates');
      setTemplates(res.data);
    } catch (err) {
      console.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: number, name: string) => {
    if (!window.confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      await api.delete(`/templates/${id}`);
      setTemplates(templates.filter((t) => t.id !== id));
      showToast(`Template "${name}" deleted`, 'info');
    } catch (err) {
      showToast('Failed to delete template', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Certificate Design Templates
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Your saved certificate layouts with calibrated dynamic text and QR code coordinates.
          </p>
        </div>

        <button
          onClick={() => onNavigate('create')}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center gap-2 cursor-pointer self-start"
          style={{ background: 'var(--primary-gradient)' }}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload New Template</span>
        </button>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-[var(--text-muted)]">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <FileBadge className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="font-bold text-base text-[var(--text-primary)]">No Templates Saved Yet</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 mb-4 max-w-sm mx-auto">
            Upload your certificate design in PNG, JPG, or PDF format to create your first reusable template.
          </p>
          <button
            onClick={() => onNavigate('create')}
            className="px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md"
            style={{ background: 'var(--primary-gradient)' }}
          >
            Create New Template
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-2xl border shadow-xs flex flex-col justify-between group hover:shadow-md transition-all"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
            >
              <div>
                {/* Certificate Background Preview Card */}
                <div className="aspect-[1123/794] rounded-xl overflow-hidden border mb-3 relative bg-slate-100 dark:bg-slate-800" style={{ borderColor: 'var(--border-subtle)' }}>
                  {t.background_preview_url ? (
                    <img
                      src={t.background_preview_url}
                      alt={t.name}
                      className="w-full h-full object-fill group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">
                      <FileBadge className="w-10 h-10" />
                    </div>
                  )}

                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-black/60 text-white backdrop-blur-xs">
                    {t.orientation} ({t.width}x{t.height})
                  </span>

                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-indigo-600 text-white shadow-xs">
                    {t.fields_config?.length || 0} Dynamic Fields
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-sm text-[var(--text-primary)] truncate">{t.name}</h3>
                </div>

                <p className="text-[11px] text-[var(--text-secondary)] mb-4">
                  Created on {t.created_at}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <button
                  onClick={() => onNavigate('create', { templateId: t.id })}
                  className="flex-1 py-2 px-3 rounded-xl font-bold text-xs text-white shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  style={{ background: 'var(--primary-gradient)' }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Use in Batch</span>
                </button>

                <button
                  onClick={() => handleDeleteTemplate(t.id, t.name)}
                  className="p-2 rounded-xl border text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  style={{ borderColor: 'var(--border-color)' }}
                  title="Delete Template"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
