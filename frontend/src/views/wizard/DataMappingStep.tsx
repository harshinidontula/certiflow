import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Link2,
  Eye,
  Plus,
  Sparkles,
  CheckCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  QrCode
} from 'lucide-react';
import type { FieldConfig } from './TemplateEditorStep';

interface DataMappingStepProps {
  template: any;
  participantData: { rows: any[]; columns: string[] };
  onBack: () => void;
  onNext: (mappingConfig: Record<string, string>, projectName: string, eventName: string, issueDate: string) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const DataMappingStep: React.FC<DataMappingStepProps> = ({
  template,
  participantData,
  onBack,
  onNext,
  showToast,
}) => {
  const [projectName, setProjectName] = useState('Certificate Batch');
  const [eventName, setEventName] = useState('National AI & Cloud Hackathon 2026');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [sampleRowIndex, setSampleRowIndex] = useState(0);

  // Mapping config: cert_field_key -> dataset_column_name
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const fields: FieldConfig[] = template?.fields_config || [];
  const columns = participantData.columns || [];
  const rows = participantData.rows || [];

  // Intelligent auto-mapping heuristics on mount
  useEffect(() => {
    const autoMap: Record<string, string> = {};

    fields.forEach((f) => {
      if (f.is_qr || f.field_key === 'certificate_id') return;

      const keyLower = f.field_key.toLowerCase();
      const labelLower = f.label.toLowerCase();

      // Find matching column
      const matched = columns.find((col) => {
        const colLower = col.toLowerCase();
        return (
          colLower.includes(keyLower) ||
          keyLower.includes(colLower) ||
          colLower.includes(labelLower) ||
          (keyLower === 'name' && (colLower.includes('name') || colLower.includes('participant') || colLower.includes('student'))) ||
          (keyLower === 'event_name' && (colLower.includes('event') || colLower.includes('course') || colLower.includes('workshop'))) ||
          (keyLower === 'issue_date' && (colLower.includes('date') || colLower.includes('completion'))) ||
          (keyLower === 'designation' && (colLower.includes('role') || colLower.includes('rank') || colLower.includes('position')))
        );
      });

      if (matched) {
        autoMap[f.field_key] = matched;
      }
    });

    setMapping(autoMap);
  }, [fields, columns]);

  const updateMapping = (fieldKey: string, colName: string) => {
    setMapping((prev) => ({ ...prev, [fieldKey]: colName }));
  };

  const currentSampleRow = rows[sampleRowIndex] || {};

  // Resolve preview text for a field using sample row data
  const getFieldPreviewValue = (f: FieldConfig): string => {
    if (f.field_key === 'certificate_id') return 'CERT-2026-X8K9M2';
    if (f.field_key === 'event_name') return eventName;
    if (f.field_key === 'issue_date') return issueDate;
    if (f.field_key === 'organization_name') return 'Global Institute of Technology';

    const mappedCol = mapping[f.field_key];
    if (mappedCol && currentSampleRow[mappedCol]) {
      return currentSampleRow[mappedCol];
    }
    return f.label;
  };

  const handleProceed = () => {
    if (!projectName.trim()) {
      showToast('Please provide a Project Name', 'error');
      return;
    }
    onNext(mapping, projectName, eventName, issueDate);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Step 3: Data Mapping & Live Sample Preview
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Connect your uploaded dataset columns to certificate fields and verify formatting in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold hover:bg-[var(--border-subtle)] transition-colors flex items-center gap-1.5 cursor-pointer"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Campaign Details Form */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Project Batch Name</label>
          <input
            type="text"
            required
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Convocation Batch 2026"
            className="w-full px-3 py-2 text-xs rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium"
            style={{ borderColor: 'var(--border-color)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Event / Course Name</label>
          <input
            type="text"
            required
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="AI Summit 2026"
            className="w-full px-3 py-2 text-xs rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium"
            style={{ borderColor: 'var(--border-color)' }}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-[var(--text-secondary)]">Certificate Issue Date</label>
          <input
            type="date"
            required
            value={issueDate}
            onChange={(e) => setIssueDate(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium"
            style={{ borderColor: 'var(--border-color)' }}
          />
        </div>
      </div>

      {/* Two Column Layout: Column Mapping UI & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Column Connectors */}
        <div className="p-5 rounded-2xl border shadow-xs space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Field Connectors</h3>
            </div>
            <span className="text-[11px] text-[var(--text-muted)]">
              {columns.length} columns available from dataset
            </span>
          </div>

          <div className="space-y-3">
            {fields
              .filter((f) => !f.is_qr && f.field_key !== 'certificate_id')
              .map((f) => {
                const currentVal = mapping[f.field_key] || '';
                const isAutoMapped = Boolean(currentVal);

                return (
                  <div
                    key={f.id}
                    className="p-3 rounded-xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: isAutoMapped ? 'var(--primary)' : 'var(--border-color)',
                    }}
                  >
                    <div>
                      <span className="font-bold text-xs text-[var(--text-primary)]">{f.label}</span>
                      <p className="text-[10px] text-[var(--text-muted)]">Key: {f.field_key}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={currentVal}
                        onChange={(e) => updateMapping(f.field_key, e.target.value)}
                        className="text-xs py-1.5 px-3 rounded-lg border font-medium bg-[var(--bg-canvas)] text-[var(--text-primary)]"
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <option value="">-- Fixed Text or Leave Default --</option>
                        {columns.map((col) => (
                          <option key={col} value={col}>
                            Column: {col}
                          </option>
                        ))}
                      </select>
                      {isAutoMapped && (
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right: Real-time Live Certificate Preview */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Live Certificate Preview</h3>
            </div>

            {/* Sample Participant Selector */}
            {rows.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[var(--text-muted)]">Previewing Row:</span>
                <button
                  onClick={() => setSampleRowIndex((prev) => Math.max(0, prev - 1))}
                  disabled={sampleRowIndex === 0}
                  className="p-1 rounded border hover:bg-[var(--border-subtle)] disabled:opacity-30 cursor-pointer"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="font-bold text-[var(--text-primary)] px-1">
                  {sampleRowIndex + 1} of {rows.length}
                </span>
                <button
                  onClick={() => setSampleRowIndex((prev) => Math.min(rows.length - 1, prev + 1))}
                  disabled={sampleRowIndex === rows.length - 1}
                  className="p-1 rounded border hover:bg-[var(--border-subtle)] disabled:opacity-30 cursor-pointer"
                  style={{ borderColor: 'var(--border-color)' }}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Rendered Live Certificate Card */}
          <div
            className="relative w-full aspect-[1123/794] rounded-2xl border shadow-lg overflow-hidden select-none bg-slate-50 dark:bg-slate-900"
            style={{ borderColor: 'var(--border-color)' }}
          >
            {/* Background Image */}
            {template?.background_preview_url && (
              <img
                src={template.background_preview_url}
                alt="Certificate"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              />
            )}

            {/* Interpolated Dynamic Elements */}
            {fields.map((f) => {
              const displayVal = getFieldPreviewValue(f);

              return (
                <div
                  key={f.id}
                  style={{
                    position: 'absolute',
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    transform: f.align === 'center' ? 'translate(-50%, -50%)' : f.align === 'right' ? 'translate(-100%, -50%)' : 'translate(0%, -50%)',
                    fontFamily: f.font_family,
                    fontSize: `${Math.max(9, f.font_size * 0.72)}px`,
                    color: f.color,
                    fontWeight: f.bold ? 'bold' : 'normal',
                    fontStyle: f.italic ? 'italic' : 'normal',
                    textAlign: f.align,
                  }}
                  className="pointer-events-none px-1"
                >
                  {f.is_qr ? (
                    <div
                      className="border border-indigo-500/40 rounded flex flex-col items-center justify-center p-1 bg-white shadow-xs"
                      style={{ width: `${(f.qr_size || 60) * 0.9}px`, height: `${(f.qr_size || 60) * 0.9}px` }}
                    >
                      <QrCode className="w-full h-full text-indigo-950" />
                    </div>
                  ) : (
                    <span>{displayVal}</span>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-[var(--text-muted)] text-center">
            Original background quality is preserved. Only the mapped dynamic fields are inserted.
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl border text-xs font-semibold hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          Back
        </button>
        <button
          onClick={handleProceed}
          className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
          style={{ background: 'var(--primary-gradient)' }}
        >
          <span>Start Batch Generation ({rows.length} Certificates)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
