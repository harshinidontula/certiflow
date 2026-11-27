import React, { useEffect, useState } from 'react';
import {
  Award,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ExternalLink,
  QrCode,
  Copy,
  Mail,
  ShieldCheck,
  X
} from 'lucide-react';
import api from '../api/client';

interface CertificatesViewProps {
  initialProjectId?: number;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onNavigate: (tab: string, state?: any) => void;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  initialProjectId,
  showToast,
  onNavigate,
}) => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [certIdFilter, setCertIdFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [previewCert, setPreviewCert] = useState<any>(null);

  useEffect(() => {
    fetchCertificates();
  }, [search, certIdFilter, statusFilter, initialProjectId]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (certIdFilter) params.cert_id = certIdFilter;
      if (statusFilter) params.status_filter = statusFilter;
      if (initialProjectId) params.project_id = initialProjectId;

      const res = await api.get('/certificates', { params });
      setCertificates(res.data);
    } catch (err) {
      console.error('Failed to load certificates', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (cert: any) => {
    const nextStatus = cert.status === 'valid' ? 'revoked' : 'valid';
    try {
      await api.patch(`/certificates/${cert.certificate_id}/status`, { status: nextStatus });
      setCertificates(
        certificates.map((c) => (c.id === cert.id ? { ...c, status: nextStatus } : c))
      );
      showToast(`Certificate status updated to ${nextStatus}`, 'success');
    } catch (err) {
      showToast('Failed to update certificate status', 'error');
    }
  };

  const handleRegenerate = async (certId: string) => {
    try {
      const res = await api.post(`/certificates/${certId}/regenerate`);
      showToast('Certificate regenerated successfully!', 'success');
      fetchCertificates();
    } catch (err) {
      showToast('Failed to regenerate certificate', 'error');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${text} to clipboard`, 'info');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Generated Certificates
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Search, filter, preview, regenerate, and manage status of issued participant certificates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('verify')}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold hover:bg-[var(--border-subtle)] transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Public Verification Portal</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Shelf */}
      <div
        className="p-4 rounded-2xl border shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {/* Name Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by participant name..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)]"
            style={{ borderColor: 'var(--border-color)' }}
          />
        </div>

        {/* Certificate ID Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={certIdFilter}
            onChange={(e) => setCertIdFilter(e.target.value)}
            placeholder="Filter by Certificate ID (CERT-2026-...)"
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)] font-mono"
            style={{ borderColor: 'var(--border-color)' }}
          />
        </div>

        {/* Status Dropdown */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full py-2 px-3 text-xs rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium"
            style={{ borderColor: 'var(--border-color)' }}
          >
            <option value="">All Statuses (Valid & Revoked)</option>
            <option value="valid">Status: Valid</option>
            <option value="revoked">Status: Revoked</option>
          </select>
        </div>
      </div>

      {/* Certificates Data Table */}
      <div
        className="rounded-2xl border shadow-xs overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[var(--bg-surface)] border-b" style={{ borderColor: 'var(--border-color)' }}>
              <tr>
                <th className="py-3 px-4 font-bold text-[var(--text-muted)]">Certificate ID</th>
                <th className="py-3 px-4 font-bold text-[var(--text-primary)]">Recipient</th>
                <th className="py-3 px-4 font-bold text-[var(--text-primary)]">Event & Date</th>
                <th className="py-3 px-4 font-bold text-[var(--text-muted)]">Verification Status</th>
                <th className="py-3 px-4 font-bold text-[var(--text-muted)]">Distribution</th>
                <th className="py-3 px-4 font-bold text-[var(--text-muted)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                    Loading certificates...
                  </td>
                </tr>
              ) : certificates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-muted)]">
                    No certificates found matching your filters.
                  </td>
                </tr>
              ) : (
                certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-[var(--border-subtle)] transition-colors">
                    {/* ID */}
                    <td className="py-3 px-4 font-mono font-semibold text-[var(--text-primary)]">
                      <div className="flex items-center gap-1.5">
                        <span>{cert.certificate_id}</span>
                        <button
                          onClick={() => copyToClipboard(cert.certificate_id)}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                          title="Copy ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Participant */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-[var(--text-primary)]">{cert.participant_name}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{cert.participant_email || 'No email registered'}</div>
                    </td>

                    {/* Event & Date */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-[var(--text-primary)]">{cert.event_name}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{cert.issue_date}</div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(cert)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-opacity hover:opacity-80 ${
                          cert.status === 'valid'
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-rose-500/10 text-rose-600'
                        }`}
                        title="Click to toggle status (Valid / Revoked)"
                      >
                        {cert.status === 'valid' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        <span className="uppercase">{cert.status}</span>
                      </button>
                    </td>

                    {/* Email Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        cert.email_status === 'sent' ? 'text-emerald-500' : 'text-[var(--text-muted)]'
                      }`}>
                        <Mail className="w-3.5 h-3.5" />
                        <span>{cert.email_status === 'sent' ? 'Emailed' : 'Not Emailed'}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Preview Modal Trigger */}
                        <button
                          onClick={() => setPreviewCert(cert)}
                          className="p-1.5 rounded-lg border hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                          title="Preview Certificate"
                          style={{ borderColor: 'var(--border-color)' }}
                        >
                          <Eye className="w-3.5 h-3.5 text-indigo-500" />
                        </button>

                        {/* Individual PDF Download */}
                        {cert.pdf_url && (
                          <a
                            href={cert.pdf_url}
                            download
                            className="p-1.5 rounded-lg border hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                            title="Download Individual PDF"
                            style={{ borderColor: 'var(--border-color)' }}
                          >
                            <Download className="w-3.5 h-3.5 text-emerald-500" />
                          </a>
                        )}

                        {/* Regenerate */}
                        <button
                          onClick={() => handleRegenerate(cert.certificate_id)}
                          className="p-1.5 rounded-lg border hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors cursor-pointer"
                          title="Regenerate Certificate"
                          style={{ borderColor: 'var(--border-color)' }}
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div
            className="w-full max-w-4xl p-6 rounded-2xl border shadow-2xl space-y-4 max-h-[90vh] flex flex-col justify-between"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h3 className="font-bold text-base text-[var(--text-primary)]">
                  Certificate Preview: {previewCert.participant_name}
                </h3>
                <p className="text-xs font-mono text-[var(--text-muted)]">ID: {previewCert.certificate_id}</p>
              </div>
              <button
                onClick={() => setPreviewCert(null)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Display Area */}
            <div className="flex-1 overflow-auto rounded-xl border bg-slate-900 flex items-center justify-center min-h-[360px]"
              style={{ borderColor: 'var(--border-color)' }}>
              {previewCert.pdf_url ? (
                <iframe
                  src={`${previewCert.pdf_url}#toolbar=0`}
                  title="Certificate PDF"
                  className="w-full h-[480px] rounded-lg"
                />
              ) : (
                <div className="text-center p-8 text-slate-400">
                  <Award className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>PDF rendering in progress...</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${
                  previewCert.status === 'valid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                }`}>
                  Status: {previewCert.status}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {previewCert.pdf_url && (
                  <a
                    href={previewCert.pdf_url}
                    download
                    className="px-4 py-2 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-1.5"
                    style={{ background: 'var(--primary-gradient)' }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PDF</span>
                  </a>
                )}
                <button
                  onClick={() => setPreviewCert(null)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
