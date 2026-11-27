import React, { useEffect, useState } from 'react';
import {
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../api/client';

interface GenerationStepProps {
  template: any;
  participantData: { rows: any[]; columns: string[] };
  mappingConfig: Record<string, string>;
  projectName: string;
  eventName: string;
  issueDate: string;
  onNext: (projectResult: any) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const GenerationStep: React.FC<GenerationStepProps> = ({
  template,
  participantData,
  mappingConfig,
  projectName,
  eventName,
  issueDate,
  onNext,
  showToast,
}) => {
  const [progress, setProgress] = useState(0);
  const [isGenerating, setIsGenerating] = useState(true);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [records, setRecords] = useState<any[]>([]);
  const [projectResult, setProjectResult] = useState<any>(null);

  useEffect(() => {
    runGenerationProcess();
  }, []);

  const runGenerationProcess = async () => {
    setIsGenerating(true);
    setProgress(10);

    try {
      // 1. Create Project
      const projRes = await api.post('/projects', {
        name: projectName,
        event_name: eventName,
        issue_date: issueDate,
        description: `Generated on ${new Date().toLocaleDateString()}`,
        template_id: template.id,
      });
      const projectId = projRes.data.id;
      setProgress(25);

      // 2. Save Participants
      await api.post(`/projects/${projectId}/participants`, {
        rows: participantData.rows,
      });
      setProgress(45);

      // 3. Save Mapping
      await api.post(`/projects/${projectId}/mapping`, {
        mapping_config: mappingConfig,
      });
      setProgress(60);

      // 4. Trigger Batch Generation Engine
      const genRes = await api.post(`/certificates/generate-batch/${projectId}`);
      setProgress(100);
      setIsGenerating(false);

      setSuccessCount(genRes.data.success_count);
      setFailedCount(genRes.data.failed_count);
      setRecords(genRes.data.records);
      setProjectResult({
        ...genRes.data,
        project_name: projectName,
        event_name: eventName,
        issue_date: issueDate,
      });

      // Confetti burst on successful generation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      showToast(`Batch generation complete! ${genRes.data.success_count} certificates generated.`, 'success');
    } catch (err: any) {
      setIsGenerating(false);
      setProgress(100);
      showToast(err.response?.data?.detail || 'Generation failed. Please try again.', 'error');
    }
  };

  const handleRegenerateFailed = async (certId: string) => {
    try {
      await api.post(`/certificates/${certId}/regenerate`);
      showToast('Certificate regenerated successfully!', 'success');
      // Refresh list
      setRecords((prev) =>
        prev.map((r) => (r.certificate_id === certId ? { ...r, status: 'success' } : r))
      );
      setFailedCount((prev) => Math.max(0, prev - 1));
      setSuccessCount((prev) => prev + 1);
    } catch (e) {
      showToast('Failed to regenerate certificate', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-1 shadow-md"
          style={{ background: 'var(--primary-gradient)', color: '#fff' }}>
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
          {isGenerating ? 'Generating Certificates in Bulk' : 'Batch Certificate Generation Complete!'}
        </h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          {isGenerating
            ? 'Inserting participant details, generating unique IDs and embedding QR codes...'
            : 'All individual certificates have been rendered into high-resolution PDFs.'}
        </p>
      </div>

      {/* Progress Bar Container */}
      <div className="max-w-xl mx-auto p-6 rounded-2xl border shadow-sm"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex justify-between items-center text-xs font-semibold mb-2">
          <span className="text-[var(--text-secondary)]">
            {isGenerating ? 'Rendering PDF Certificates...' : 'Completed'}
          </span>
          <span className="font-bold text-[var(--text-primary)]">{progress}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[var(--border-color)] h-3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'var(--primary-gradient)',
            }}
          ></div>
        </div>

        {/* Summary Counter Metrics */}
        <div className="grid grid-cols-3 gap-2 mt-6 pt-4 border-t text-center" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <span className="text-[11px] text-[var(--text-muted)]">Total Processed</span>
            <p className="text-xl font-extrabold text-[var(--text-primary)]">
              {participantData.rows.length}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-[var(--text-muted)]">Successful</span>
            <p className="text-xl font-extrabold text-emerald-500">
              {successCount}
            </p>
          </div>
          <div>
            <span className="text-[11px] text-[var(--text-muted)]">Failed</span>
            <p className="text-xl font-extrabold text-rose-500">
              {failedCount}
            </p>
          </div>
        </div>
      </div>

      {/* Generation Audit Records Table */}
      {records.length > 0 && (
        <div className="max-w-3xl mx-auto rounded-2xl border shadow-xs overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Generation Audit Log</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Individual record status and direct preview</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
              <ShieldCheck className="w-4 h-4" />
              <span>Verifiable QR Code embedded</span>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
            {records.map((rec, i) => (
              <div key={i} className="p-3 px-4 flex items-center justify-between text-xs hover:bg-[var(--border-subtle)] transition-colors">
                <div className="flex items-center gap-3">
                  {rec.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold text-[var(--text-primary)]">{rec.name}</span>
                    <p className="text-[11px] font-mono text-[var(--text-muted)]">{rec.certificate_id || 'ID Pending'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {rec.status === 'success' ? (
                    <a
                      href={rec.pdf_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg border font-semibold hover:bg-[var(--border-color)] transition-colors flex items-center gap-1 cursor-pointer"
                      style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Preview PDF</span>
                      <ExternalLink className="w-3 h-3 text-[var(--text-muted)]" />
                    </a>
                  ) : (
                    <button
                      onClick={() => handleRegenerateFailed(rec.certificate_id)}
                      className="px-2.5 py-1 rounded-lg border text-rose-600 hover:bg-rose-500/10 transition-colors flex items-center gap-1 cursor-pointer font-semibold"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Regenerate</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Continue CTA */}
      {!isGenerating && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => onNext(projectResult)}
            className="px-8 py-3 rounded-xl font-bold text-sm text-white shadow-lg shadow-indigo-500/25 hover:opacity-95 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
            style={{ background: 'var(--primary-gradient)' }}
          >
            <span>Proceed to Download & Distribution</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
