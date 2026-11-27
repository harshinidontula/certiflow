import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  Award,
  Calendar,
  Building,
  User,
  Download,
  AlertTriangle,
  QrCode,
  Sparkles
} from 'lucide-react';
import api from '../api/client';

interface PublicVerificationViewProps {
  initialCertId?: string;
}

export const PublicVerificationView: React.FC<PublicVerificationViewProps> = ({
  initialCertId = '',
}) => {
  const [certId, setCertId] = useState(initialCertId);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    // If URL has /verify/:id or query param, auto check
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && lastPart.startsWith('CERT-')) {
      setCertId(lastPart);
      verifyId(lastPart);
    } else if (initialCertId) {
      verifyId(initialCertId);
    }
  }, [initialCertId]);

  const verifyId = async (idToVerify: string) => {
    if (!idToVerify.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await api.get(`/verify/${encodeURIComponent(idToVerify.trim())}`);
      setResult(res.data);
    } catch (err) {
      setResult({ verified: false, message: 'Server verification check failed.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyId(certId);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn py-4">
      {/* Verification Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-2 shadow-lg"
          style={{ background: 'var(--primary-gradient)', color: '#fff' }}>
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Official Certificate Verification
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Verify authenticity of credentials issued by colleges, universities, and organizations through the CertiFlow secure registry.
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleFormSubmit} className="relative shadow-md rounded-2xl overflow-hidden border"
        style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}>
        <div className="flex items-center px-4 py-2">
          <Search className="w-5 h-5 text-[var(--text-muted)] mr-3 shrink-0" />
          <input
            type="text"
            required
            value={certId}
            onChange={(e) => setCertId(e.target.value)}
            placeholder="Enter Certificate ID (e.g. CERT-2026-001)"
            className="w-full py-2 text-sm bg-transparent border-0 focus:outline-hidden font-mono text-[var(--text-primary)]"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md hover:opacity-95 active:scale-98 transition-all shrink-0 cursor-pointer ml-2"
            style={{ background: 'var(--primary-gradient)' }}
          >
            {loading ? 'Verifying...' : 'Verify Now'}
          </button>
        </div>
      </form>

      {/* Demo Quick Fill Tags */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--text-secondary)]">
        <span>Try Demo ID:</span>
        {['CERT-2026-001', 'CERT-2026-002', 'CERT-2026-003'].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setCertId(id);
              verifyId(id);
            }}
            className="px-2.5 py-1 rounded-lg border font-mono text-[11px] hover:border-indigo-500 hover:text-indigo-600 transition-colors cursor-pointer"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-card)' }}
          >
            {id}
          </button>
        ))}
      </div>

      {/* Verification Card Result */}
      {searched && (
        <div className="animate-fadeIn">
          {loading ? (
            <div className="p-8 text-center rounded-2xl border text-xs text-[var(--text-muted)]"
              style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              Querying verified credential registry...
            </div>
          ) : result?.verified ? (
            <div
              className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
                result.is_valid
                  ? 'border-emerald-500/30'
                  : 'border-rose-500/30'
              }`}
              style={{ backgroundColor: 'var(--bg-card)' }}
            >
              {/* Status Header Seal */}
              <div className="flex items-center justify-between pb-6 border-b mb-6" style={{ borderColor: 'var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md ${
                      result.is_valid ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'
                    }`}
                  >
                    {result.is_valid ? <CheckCircle2 className="w-7 h-7" /> : <XCircle className="w-7 h-7" />}
                  </div>
                  <div>
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full tracking-wider ${
                        result.is_valid
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {result.is_valid ? 'AUTHENTIC CERTIFIED RECORD' : 'RECORD REVOKED'}
                    </span>
                    <h3 className="text-xl font-black text-[var(--text-primary)] mt-1">
                      {result.is_valid ? 'Certificate is Valid & Active' : 'This Certificate Has Been Revoked'}
                    </h3>
                  </div>
                </div>

                <div className="hidden sm:block text-right">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider block font-bold">Certificate ID</span>
                  <span className="font-mono font-bold text-xs text-[var(--text-primary)]">{result.certificate_id}</span>
                </div>
              </div>

              {/* Verified Details Grid */}
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <User className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold block">Certificate Holder</span>
                    <span className="font-bold text-base text-[var(--text-primary)]">{result.holder_name}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <Building className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] font-semibold block">Issuing Organization</span>
                      <span className="font-bold text-[var(--text-primary)]">{result.organization_name}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
                    <Award className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] text-[var(--text-muted)] font-semibold block">Event / Course</span>
                      <span className="font-bold text-[var(--text-primary)]">{result.event_name}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
                  <Calendar className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[11px] text-[var(--text-muted)] font-semibold block">Issue Date</span>
                    <span className="font-bold text-[var(--text-primary)]">{result.issue_date}</span>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              {result.pdf_url && (
                <div className="mt-6 pt-6 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>Cryptographically verified on registry</span>
                  </span>

                  <a
                    href={result.pdf_url}
                    download
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 flex items-center gap-2 cursor-pointer"
                    style={{ background: 'var(--primary-gradient)' }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official PDF</span>
                  </a>
                </div>
              )}
            </div>
          ) : (
            /* Not Found Alert */
            <div className="p-8 text-center rounded-2xl border border-rose-500/20 bg-rose-500/5 space-y-2">
              <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
              <h3 className="font-bold text-base text-rose-600 dark:text-rose-400">Certificate Not Found</h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                {result?.message || 'No record matched this Certificate ID in the registry.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
