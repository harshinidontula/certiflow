import React, { useState, useEffect } from 'react';
import {
  FileText,
  FolderArchive,
  Cloud,
  Mail,
  Download,
  Share2,
  CheckCircle,
  ExternalLink,
  Lock,
  Plus,
  Send,
  RefreshCw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';

interface DistributionStepProps {
  projectResult: any;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  onFinish: () => void;
}

export const DistributionStep: React.FC<DistributionStepProps> = ({
  projectResult,
  showToast,
  onFinish,
}) => {
  const projectId = projectResult?.project_id || 1;

  // Option A: Combined PDF state
  const [combinedInfo, setCombinedInfo] = useState<any>(null);
  const [loadingCombined, setLoadingCombined] = useState(false);

  // Option C: ZIP state
  const [zipInfo, setZipInfo] = useState<any>(null);
  const [loadingZip, setLoadingZip] = useState(false);

  // Option B: Google Drive state
  const [driveStatus, setDriveStatus] = useState<any>(null);
  const [driveFolders, setDriveFolders] = useState<any[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [isPublicShare, setIsPublicShare] = useState(false);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveResult, setDriveResult] = useState<any>(null);

  // Email distribution state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailSubject, setEmailSubject] = useState('Your Certificate for {{event}}');
  const [emailBody, setEmailBody] = useState(
    'Dear {{name}},\n\nCongratulations on successfully participating in {{event}}! Please find your official certificate attached to this email.\n\nCertificate ID: {{certificate_id}}\n\nWarm regards,\nEvent Certification Committee'
  );
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<any>(null);

  useEffect(() => {
    fetchCombinedPdfInfo();
    fetchZipInfo();
    fetchDriveDetails();
  }, [projectId]);

  const fetchCombinedPdfInfo = async () => {
    try {
      setLoadingCombined(true);
      const res = await api.get(`/distribution/combined-pdf/${projectId}`);
      setCombinedInfo(res.data);
    } catch (err) {
      console.error('Failed to load combined PDF info', err);
    } finally {
      setLoadingCombined(false);
    }
  };

  const fetchZipInfo = async () => {
    try {
      setLoadingZip(true);
      const res = await api.get(`/distribution/zip-archive/${projectId}`);
      setZipInfo(res.data);
    } catch (err) {
      console.error('Failed to load zip info', err);
    } finally {
      setLoadingZip(false);
    }
  };

  const fetchDriveDetails = async () => {
    try {
      const statusRes = await api.get('/distribution/google-drive/status');
      setDriveStatus(statusRes.data);
      const foldersRes = await api.get('/distribution/google-drive/folders');
      setDriveFolders(foldersRes.data);
      if (foldersRes.data.length > 0) {
        setSelectedFolderId(foldersRes.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load drive details', err);
    }
  };

  const handleCreateDriveFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await api.post(`/distribution/google-drive/create-folder?folder_name=${encodeURIComponent(newFolderName)}`);
      setDriveFolders([res.data, ...driveFolders]);
      setSelectedFolderId(res.data.id);
      setNewFolderName('');
      showToast(`Created Drive folder "${res.data.name}"`, 'success');
    } catch (err) {
      showToast('Failed to create Drive folder', 'error');
    }
  };

  const handleUploadToDrive = async () => {
    setIsUploadingDrive(true);
    const folderObj = driveFolders.find((f) => f.id === selectedFolderId);
    const folderName = folderObj?.name || 'CertiFlow Certificates';

    try {
      const res = await api.post(`/distribution/google-drive/upload-batch/${projectId}`, {
        folder_name: folderName,
        is_public_share: isPublicShare,
      });
      setDriveResult(res.data);
      showToast(`Successfully uploaded ${res.data.total_uploaded} certificates to Google Drive!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Drive upload failed', 'error');
    } finally {
      setIsUploadingDrive(false);
    }
  };

  const handleDispatchEmails = async () => {
    setIsSendingEmail(true);
    try {
      const res = await api.post(`/distribution/email/dispatch-batch/${projectId}`, {
        subject: emailSubject,
        body_template: emailBody,
      });
      setEmailResult(res.data);
      showToast(`Sent ${res.data.sent_count} certificate emails!`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to dispatch emails', 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-1 shadow-md bg-emerald-500 text-white">
          <CheckCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Download & Distribution Options
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          Export your generated certificates as a single combined PDF, upload to Google Drive, download individual files, or email participants directly.
        </p>
      </div>

      {/* Distribution Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* OPTION A: Combined Multi-Page PDF */}
        <div
          className="p-6 rounded-2xl border shadow-xs flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">Option A: Combined PDF</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">All certificates in one document</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600">
                Primary
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Combines every participant certificate into a single multi-page PDF. Each certificate occupies a separate high-resolution page ready for printing.
            </p>

            <div className="p-3.5 rounded-xl border mb-6 space-y-2"
              style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Total Certificates:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {combinedInfo?.total_certificates || projectResult?.success_count || 0} Pages
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-muted)]">Estimated File Size:</span>
                <span className="font-bold text-[var(--text-primary)]">
                  {combinedInfo?.file_size_formatted || 'Calculating...'}
                </span>
              </div>
            </div>
          </div>

          <a
            href={combinedInfo?.download_url || '#'}
            download
            className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
            style={{ background: 'var(--primary-gradient)' }}
          >
            <Download className="w-4 h-4" />
            <span>Download Combined PDF</span>
          </a>
        </div>

        {/* OPTION B: Google Drive Distribution */}
        <div
          className="p-6 rounded-2xl border shadow-xs flex flex-col justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">Option B: Google Drive Distribution</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Automated cloud folder upload</p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                Connected
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
              Uploads individual certificates to your Google Drive named as <code className="text-[11px] px-1 py-0.5 rounded bg-[var(--border-subtle)] font-mono">ParticipantName_CertificateID.pdf</code>.
            </p>

            {/* Folder Selection & Permissions */}
            <div className="space-y-3 mb-6">
              <div>
                <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Target Drive Folder</label>
                <div className="flex gap-2">
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="flex-1 text-xs py-2 px-3 rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium"
                    style={{ borderColor: 'var(--border-color)' }}
                  >
                    {driveFolders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Create new folder inline */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Or create new folder name..."
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  style={{ borderColor: 'var(--border-color)' }}
                />
                <button
                  type="button"
                  onClick={handleCreateDriveFolder}
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-[var(--border-subtle)] cursor-pointer"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Privacy / Permissions toggle */}
              <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={isPublicShare}
                  onChange={(e) => setIsPublicShare(e.target.checked)}
                  className="rounded border-[var(--border-color)] accent-indigo-600"
                />
                <span>Generate public shareable link (uncheck for organization-only access)</span>
              </label>
            </div>

            {/* Drive Shareable Result Box */}
            {driveResult && (
              <div className="p-3 rounded-xl border mb-4 bg-emerald-500/10 border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Uploaded {driveResult.total_uploaded} files to Drive!</span>
                </div>
                <a
                  href={driveResult.shareable_link}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium underline inline-flex items-center gap-1"
                >
                  <span>Open Folder in Google Drive</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          <button
            onClick={handleUploadToDrive}
            disabled={isUploadingDrive}
            className="w-full py-2.5 rounded-xl font-bold text-xs border hover:bg-[var(--border-subtle)] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
          >
            {isUploadingDrive ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
                <span>Uploading to Drive...</span>
              </>
            ) : (
              <>
                <Cloud className="w-4 h-4 text-blue-500" />
                <span>Upload Batch to Google Drive</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Secondary Distribution Tools: ZIP Bundle & Email Dispatch */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ZIP Archive Card */}
        <div
          className="p-5 rounded-2xl border shadow-xs flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">ZIP Bundle Download</h4>
              <p className="text-[11px] text-[var(--text-muted)]">
                {zipInfo?.file_size_formatted || 'All Individual PDFs in .zip'}
              </p>
            </div>
          </div>

          <a
            href={zipInfo?.download_url || '#'}
            download
            className="px-4 py-2 rounded-xl border text-xs font-semibold hover:bg-[var(--border-subtle)] transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download ZIP</span>
          </a>
        </div>

        {/* Email Distribution Trigger Card */}
        <div
          className="p-5 rounded-2xl border shadow-xs flex items-center justify-between"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">Email Distribution</h4>
              <p className="text-[11px] text-[var(--text-muted)]">Send PDFs directly to recipient inboxes</p>
            </div>
          </div>

          <button
            onClick={() => setShowEmailModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs hover:opacity-95 transition-all flex items-center gap-1.5 cursor-pointer"
            style={{ background: 'var(--primary-gradient)' }}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Configure & Send</span>
          </button>
        </div>
      </div>

      {/* Email Distribution Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-lg p-6 rounded-2xl border shadow-2xl space-y-4"
            style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
          >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="font-bold text-sm text-[var(--text-primary)]">Email Distribution Dispatcher</h3>
              </div>
              <button onClick={() => setShowEmailModal(false)} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Subject Template</label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-[var(--bg-canvas)] text-[var(--text-primary)]"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Email Body</label>
                <textarea
                  rows={6}
                  value={emailBody}
                  onChange={(e) => setEmailBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border bg-[var(--bg-canvas)] text-[var(--text-primary)] font-mono text-xs"
                  style={{ borderColor: 'var(--border-color)' }}
                />
                <p className="text-[10px] text-[var(--text-muted)] mt-1">
                  Supported variables: <code className="font-mono">{"{{name}}"}</code>, <code className="font-mono">{"{{event}}"}</code>, <code className="font-mono">{"{{certificate_id}}"}</code>. Certificate PDF is attached automatically.
                </p>
              </div>

              {emailResult && (
                <div className="p-3 rounded-xl border bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <span className="font-bold">Dispatch Summary:</span> Sent {emailResult.sent_count} / {emailResult.total_dispatched} emails successfully.
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                Close
              </button>
              <button
                onClick={handleDispatchEmails}
                disabled={isSendingEmail}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                style={{ background: 'var(--primary-gradient)' }}
              >
                {isSendingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isSendingEmail ? 'Dispatching...' : 'Send to All Participants'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Done & Return to Dashboard CTA */}
      <div className="flex justify-center pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={onFinish}
          className="px-8 py-3 rounded-xl font-bold text-xs sm:text-sm text-white shadow-lg hover:opacity-95 active:scale-98 transition-all cursor-pointer"
          style={{ background: 'var(--primary-gradient)' }}
        >
          Finish & View in Generated Certificates
        </button>
      </div>
    </div>
  );
};
