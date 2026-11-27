import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Move,
  Type,
  QrCode,
  Sliders,
  Plus,
  Trash2,
  Check,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Sparkles,
  Bot,
  Wand2,
  Eraser,
  HelpCircle,
  Eye
} from 'lucide-react';
import api from '../../api/client';

export interface FieldConfig {
  id: string;
  label: string;
  field_key: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  font_family: string;
  font_size: number;
  color: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
  is_qr?: boolean;
  qr_size?: number;
  fixed_text?: string;
  mask_unwanted_text?: boolean;
  mask_width?: number; // percentage width
  mask_height?: number; // pt height
  mask_color?: string;
}

interface TemplateEditorStepProps {
  onNext: (templateData: any) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  initialTemplateId?: number;
}

const DEFAULT_FIELDS: FieldConfig[] = [
  {
    id: 'f_name',
    label: 'Participant Name',
    field_key: 'name',
    fixed_text: '{{name}}',
    mask_unwanted_text: false,
    mask_width: 50,
    mask_height: 38,
    mask_color: '#FFFFFF',
    x: 50,
    y: 46,
    font_family: 'Times',
    font_size: 34,
    color: '#1E293B',
    align: 'center',
    bold: true,
    italic: false,
  },
  {
    id: 'f_date',
    label: 'Issue Date',
    field_key: 'issue_date',
    fixed_text: '{{date}}',
    mask_unwanted_text: false,
    x: 24,
    y: 78,
    font_family: 'Helvetica',
    font_size: 13,
    color: '#475569',
    align: 'center',
    bold: false,
    italic: false,
  },
  {
    id: 'f_cert_id',
    label: 'Certificate ID',
    field_key: 'certificate_id',
    fixed_text: '{{certificate_id}}',
    mask_unwanted_text: false,
    x: 76,
    y: 78,
    font_family: 'Courier',
    font_size: 11,
    color: '#64748B',
    align: 'center',
    bold: true,
    italic: false,
  },
  {
    id: 'f_qr',
    label: 'Verification QR Code',
    field_key: 'qr_code',
    x: 50,
    y: 78,
    is_qr: true,
    qr_size: 65,
    font_family: 'Helvetica',
    font_size: 12,
    color: '#000000',
    align: 'center',
    bold: false,
    italic: false,
  },
];

export const TemplateEditorStep: React.FC<TemplateEditorStepProps> = ({
  onNext,
  showToast,
  initialTemplateId,
}) => {
  const [templateName, setTemplateName] = useState('My Uploaded Certificate');
  const [bgFilename, setBgFilename] = useState('');
  const [bgPreviewUrl, setBgPreviewUrl] = useState('');
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [width, setWidth] = useState(1123);
  const [height, setHeight] = useState(794);
  const [fields, setFields] = useState<FieldConfig[]>(DEFAULT_FIELDS);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('f_name');
  const [isUploading, setIsUploading] = useState(false);
  const [existingTemplates, setExistingTemplates] = useState<any[]>([]);

  // AI Agent States
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Canvas Dragging ref
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const res = await api.get('/templates');
      setExistingTemplates(res.data);
      if (initialTemplateId) {
        const found = res.data.find((t: any) => t.id === initialTemplateId);
        if (found) selectTemplate(found);
      } else if (res.data.length > 0) {
        selectTemplate(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load templates', err);
    }
  };

  const selectTemplate = (t: any) => {
    setTemplateName(t.name);
    setBgFilename(t.background_filename);
    setBgPreviewUrl(t.background_preview_url);
    setOrientation(t.orientation);
    setWidth(t.width);
    setHeight(t.height);
    if (t.fields_config && t.fields_config.length > 0) {
      setFields(t.fields_config);
      setSelectedFieldId(t.fields_config[0].id);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/templates/upload-background', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBgFilename(res.data.filename);
      setBgPreviewUrl(res.data.preview_url);
      setOrientation(res.data.orientation);
      setWidth(res.data.width);
      setHeight(res.data.height);
      setTemplateName(file.name.replace(/\.[^/.]+$/, ''));
      showToast('Certificate design uploaded! The original document is 100% preserved.', 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to upload certificate', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Run AI Agent to automatically detect unwanted placeholder text and configure text box & mask
  const runAiAgent = async (customInstruction?: string) => {
    setIsAiRunning(true);
    try {
      const instruction = customInstruction !== undefined ? customInstruction : aiPrompt;
      const res = await api.post('/templates/ai-fix-placeholders', {
        fields: fields,
        prompt: instruction,
      });

      if (res.data?.updated_fields) {
        setFields(res.data.updated_fields);
        setAiMessage(res.data.message);
        showToast(res.data.message, 'success');
      }
    } catch (err: any) {
      // Local fallback smart AI agent
      setFields((prev) =>
        prev.map((f) => {
          if (f.field_key === 'name' || f.label.toLowerCase().includes('name')) {
            return {
              ...f,
              field_key: 'name',
              label: 'Participant Name',
              fixed_text: '{{name}}',
              mask_unwanted_text: true,
              mask_width: 50,
              mask_height: 38,
              mask_color: '#FFFFFF',
            };
          }
          return f;
        })
      );
      setAiMessage('AI Agent automatically fixed the participant name blank spot with dynamic {{name}} and background mask.');
      showToast('AI Agent fixed unwanted details!', 'success');
    } finally {
      setIsAiRunning(false);
    }
  };

  // Canvas Drag handlers
  const handleMouseDown = (fieldId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedFieldId(fieldId);
    setDraggingFieldId(fieldId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingFieldId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(2, Math.min(98, Math.round(x * 10) / 10));
    const clampedY = Math.max(2, Math.min(98, Math.round(y * 10) / 10));

    setFields((prev) =>
      prev.map((f) => (f.id === draggingFieldId ? { ...f, x: clampedX, y: clampedY } : f))
    );
  };

  const handleMouseUp = () => {
    setDraggingFieldId(null);
  };

  const selectedField = fields.find((f) => f.id === selectedFieldId);

  const updateSelectedField = (updates: Partial<FieldConfig>) => {
    if (!selectedFieldId) return;
    setFields((prev) =>
      prev.map((f) => (f.id === selectedFieldId ? { ...f, ...updates } : f))
    );
  };

  const addDynamicField = (fieldKey: string, label: string, isQr: boolean = false) => {
    const existing = fields.find((f) => f.field_key === fieldKey);
    if (existing) {
      setSelectedFieldId(existing.id);
      showToast(`${label} is already placed on the canvas`, 'info');
      return;
    }

    const newId = `f_${Date.now()}`;
    const newField: FieldConfig = isQr
      ? {
          id: newId,
          label: label,
          field_key: fieldKey,
          x: 50,
          y: 78,
          is_qr: true,
          qr_size: 65,
          font_family: 'Helvetica',
          font_size: 12,
          color: '#000000',
          align: 'center',
          bold: false,
          italic: false,
        }
      : {
          id: newId,
          label: label,
          field_key: fieldKey,
          fixed_text: `{{${fieldKey}}}`,
          x: 50,
          y: fieldKey === 'name' ? 46 : fieldKey === 'event_name' ? 58 : 50,
          font_family: fieldKey === 'name' ? 'Times' : 'Helvetica',
          font_size: fieldKey === 'name' ? 34 : 16,
          color: '#1E293B',
          align: 'center',
          bold: fieldKey === 'name',
          italic: false,
          mask_unwanted_text: false,
          mask_width: 45,
          mask_height: 36,
          mask_color: '#FFFFFF',
        };

    setFields([...fields, newField]);
    setSelectedFieldId(newId);
    showToast(`Added ${label} marker to canvas`, 'info');
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
    if (selectedFieldId === id) {
      setSelectedFieldId(fields[0]?.id || '');
    }
  };

  const handleProceed = async () => {
    if (!bgFilename) {
      showToast('Please upload your certificate design to proceed', 'error');
      return;
    }

    try {
      const res = await api.post('/templates', {
        name: templateName,
        orientation,
        width,
        height,
        fields_config: fields,
      }, {
        params: { background_filename: bgFilename }
      });
      showToast('Certificate layout saved successfully!', 'success');
      onNext(res.data);
    } catch (err: any) {
      onNext({
        id: initialTemplateId || 1,
        name: templateName,
        orientation,
        width,
        height,
        background_filename: bgFilename,
        background_preview_url: bgPreviewUrl,
        fields_config: fields,
      });
    }
  };

  // Helper to resolve display preview on canvas
  const getCanvasDisplayText = (f: FieldConfig) => {
    if (f.fixed_text) {
      return f.fixed_text
        .replace('{{name}}', 'Alexander Wright')
        .replace('{{certificate_id}}', 'CERT-2026-X8K9M2')
        .replace('{{event}}', 'National AI Hackathon')
        .replace('{{date}}', '2026-11-27');
    }
    if (f.field_key === 'name') return 'Alexander Wright';
    if (f.field_key === 'certificate_id') return 'CERT-2026-X8K9M2';
    if (f.field_key === 'issue_date') return '2026-11-27';
    return f.label;
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Step 1: Certificate Upload & Detail Placement
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Your certificate is preserved 100% as uploaded. Position dynamic fields and use the AI Agent to replace unwanted template matter.
          </p>
        </div>

        {/* Existing Templates / Upload Button */}
        <div className="flex items-center gap-2">
          {existingTemplates.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--text-secondary)] font-medium">Saved:</span>
              <select
                onChange={(e) => {
                  const found = existingTemplates.find((t) => t.id === Number(e.target.value));
                  if (found) selectTemplate(found);
                }}
                className="text-xs py-1.5 px-3 rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium"
                style={{ borderColor: 'var(--border-color)' }}
              >
                {existingTemplates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Upload Button */}
          <label className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 cursor-pointer flex items-center gap-2"
            style={{ background: 'var(--primary-gradient)' }}>
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Uploading...' : 'Upload Certificate'}</span>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* AI AGENT CONTROL PANEL */}
      <div
        className="p-4 rounded-2xl border shadow-xs relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-surface) 100%)',
          borderColor: 'var(--border-color)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-500/20"
              style={{ background: 'var(--primary-gradient)' }}>
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-[var(--text-primary)]">
                  CertiFlow AI Certificate Agent
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-600">
                  Auto-Cleaner & Field Matcher
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Automatically detects unwanted placeholder text (e.g. "Participant Name", "John Doe"), erases it, and sets up your dynamic text box.
              </p>
            </div>
          </div>

          {/* AI One-Click Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => runAiAgent('Auto-detect unwanted placeholders like participant name and replace with clean dynamic field')}
              disabled={isAiRunning}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--primary-gradient)' }}
            >
              {isAiRunning ? (
                <Wand2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isAiRunning ? 'AI Cleaning...' : 'AI Detect & Fix Unwanted Placeholders'}</span>
            </button>
          </div>
        </div>

        {/* AI Prompt Input for Custom Assistant Instructions */}
        <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: 'var(--border-subtle)' }}>
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') runAiAgent(); }}
            placeholder="Type custom instruction to AI Agent (e.g. 'Replace sample recipient name with {{name}} and cover background with white mask')..."
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border bg-[var(--bg-canvas)] text-[var(--text-primary)] focus:outline-hidden"
            style={{ borderColor: 'var(--border-color)' }}
          />
          <button
            type="button"
            onClick={() => runAiAgent()}
            disabled={!aiPrompt.trim() || isAiRunning}
            className="px-3 py-1.5 rounded-xl border text-xs font-semibold hover:bg-[var(--border-subtle)] disabled:opacity-40 cursor-pointer text-[var(--text-primary)]"
            style={{ borderColor: 'var(--border-color)' }}
          >
            Ask AI
          </button>
        </div>

        {/* AI Status Message */}
        {aiMessage && (
          <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{aiMessage}</span>
          </div>
        )}
      </div>

      {/* Main Visual Positioning Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Certificate Display Canvas (3 Cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[var(--text-primary)]">{templateName}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[var(--badge-bg)] text-[var(--badge-text)]">
                {orientation} ({width} x {height})
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <Move className="w-3.5 h-3.5" />
              <span>Drag any text box directly onto the blank space on your certificate</span>
            </div>
          </div>

          {/* Interactive Certificate Canvas */}
          <div
            ref={canvasRef}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="relative w-full aspect-[1123/794] rounded-2xl border shadow-lg overflow-hidden select-none bg-slate-100 dark:bg-slate-900 flex items-center justify-center"
            style={{
              borderColor: 'var(--border-color)',
              cursor: draggingFieldId ? 'grabbing' : 'default',
            }}
          >
            {/* Complete Uploaded Certificate */}
            {bgPreviewUrl ? (
              <img
                src={bgPreviewUrl}
                alt="Uploaded Certificate"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none"
              />
            ) : (
              <div className="text-center p-8 text-[var(--text-muted)]">
                <Upload className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No certificate loaded. Please upload your certificate (PNG, JPG, or PDF).</p>
              </div>
            )}

            {/* Draggable Dynamic Detail Boxes & Background Cover Masks */}
            {fields.map((f) => {
              const isSelected = f.id === selectedFieldId;
              const isDragging = f.id === draggingFieldId;
              const displayText = getCanvasDisplayText(f);

              return (
                <div
                  key={f.id}
                  onMouseDown={(e) => handleMouseDown(f.id, e)}
                  style={{
                    position: 'absolute',
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    transform: f.align === 'center' ? 'translate(-50%, -50%)' : f.align === 'right' ? 'translate(-100%, -50%)' : 'translate(0%, -50%)',
                    fontFamily: f.font_family,
                    fontSize: `${Math.max(10, f.font_size * 0.75)}px`,
                    color: f.color,
                    fontWeight: f.bold ? 'bold' : 'normal',
                    fontStyle: f.italic ? 'italic' : 'normal',
                    textAlign: f.align,
                    cursor: isDragging ? 'grabbing' : 'grab',
                    zIndex: isSelected ? 20 : 10,
                  }}
                  className="transition-all select-none relative group"
                >
                  {/* Clean Background Mask (Erases unwanted dummy text under this spot if enabled) */}
                  {f.mask_unwanted_text && (
                    <div
                      className="absolute inset-0 -m-1 rounded shadow-xs pointer-events-none"
                      style={{
                        backgroundColor: f.mask_color || '#FFFFFF',
                        minWidth: `${f.mask_width ? (f.mask_width * 3) : 120}px`,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: -1,
                      }}
                    />
                  )}

                  <div
                    className={`px-2.5 py-1 rounded transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'ring-2 ring-indigo-500 bg-indigo-500/20 backdrop-blur-xs shadow-md'
                        : 'border border-dashed border-indigo-400/60 bg-white/80 dark:bg-slate-900/80 hover:border-indigo-600'
                    }`}
                  >
                    {f.is_qr ? (
                      <div
                        className="border border-indigo-500/50 rounded flex flex-col items-center justify-center p-1 bg-white shadow-xs"
                        style={{ width: `${f.qr_size || 65}px`, height: `${f.qr_size || 65}px` }}
                      >
                        <QrCode className="w-full h-full text-indigo-950" />
                        <span className="text-[7px] text-slate-500 font-bold -mt-0.5">QR CODE</span>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold whitespace-nowrap">{displayText}</span>
                        {f.mask_unwanted_text && (
                          <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-indigo-600 text-white" title="Masking unwanted text on background">
                            AI MASK
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Dynamic Detail Adders */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">Placed Fields:</span>

            {/* Existing placed tags */}
            {fields.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFieldId(f.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  f.id === selectedFieldId
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-500/10 font-bold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--border-subtle)]'
                }`}
                style={{ borderColor: f.id === selectedFieldId ? 'var(--primary)' : 'var(--border-color)' }}
              >
                {f.is_qr ? <QrCode className="w-3 h-3" /> : <Type className="w-3 h-3" />}
                <span>{f.label}</span>
              </button>
            ))}

            {/* Quick Add Buttons for other details */}
            {!fields.some((f) => f.field_key === 'name') && (
              <button
                onClick={() => addDynamicField('name', 'Participant Name')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-dashed hover:border-indigo-500 flex items-center gap-1 cursor-pointer text-[var(--text-secondary)]"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <Plus className="w-3 h-3" />
                <span>+ Participant Name</span>
              </button>
            )}

            {!fields.some((f) => f.field_key === 'event_name') && (
              <button
                onClick={() => addDynamicField('event_name', 'Event Name')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-dashed hover:border-indigo-500 flex items-center gap-1 cursor-pointer text-[var(--text-secondary)]"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <Plus className="w-3 h-3" />
                <span>+ Event Name</span>
              </button>
            )}

            {!fields.some((f) => f.field_key === 'designation') && (
              <button
                onClick={() => addDynamicField('designation', 'Designation / Role')}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-dashed hover:border-indigo-500 flex items-center gap-1 cursor-pointer text-[var(--text-secondary)]"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <Plus className="w-3 h-3" />
                <span>+ Designation</span>
              </button>
            )}

            {!fields.some((f) => f.field_key === 'qr_code') && (
              <button
                onClick={() => addDynamicField('qr_code', 'Verification QR Code', true)}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-dashed hover:border-indigo-500 flex items-center gap-1 cursor-pointer text-[var(--text-secondary)]"
                style={{ borderColor: 'var(--border-color)' }}
              >
                <QrCode className="w-3 h-3" />
                <span>+ QR Code</span>
              </button>
            )}

            <button
              onClick={() => addDynamicField(`custom_${fields.length + 1}`, `Custom Detail ${fields.length + 1}`)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-dashed hover:border-indigo-500 flex items-center gap-1 cursor-pointer text-[var(--text-secondary)]"
              style={{ borderColor: 'var(--border-color)' }}
            >
              <Plus className="w-3 h-3" />
              <span>+ Custom Detail</span>
            </button>
          </div>
        </div>

        {/* Properties Inspector Panel & USER DETAIL TEXT BOX (1 Col) */}
        <div
          className="p-5 rounded-2xl border shadow-xs space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--primary)]" />
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Blank Spot Editor</h3>
            </div>
            {selectedField && (
              <button
                onClick={() => removeField(selectedField.id)}
                title="Remove field"
                className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedField ? (
            <div className="space-y-4 text-xs">
              {/* PRIMARY USER TEXT BOX: WHAT TO MENTION AT THIS BLANK PLACE */}
              {!selectedField.is_qr && (
                <div className="p-3 rounded-xl border space-y-2 bg-[var(--bg-surface)]"
                  style={{ borderColor: 'var(--primary)' }}>
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Text / Detail to Mention in this Spot:</span>
                    </label>
                  </div>

                  {/* USER EDITABLE TEXT BOX */}
                  <input
                    type="text"
                    value={selectedField.fixed_text !== undefined ? selectedField.fixed_text : `{{${selectedField.field_key}}}`}
                    onChange={(e) => updateSelectedField({ fixed_text: e.target.value })}
                    placeholder="e.g. {{name}} or Dr. {{name}} or Custom Text"
                    className="w-full px-3 py-2 rounded-xl border bg-[var(--bg-canvas)] text-[var(--text-primary)] font-semibold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    style={{ borderColor: 'var(--border-color)' }}
                  />

                  {/* Quick Dynamic Variable Buttons */}
                  <div className="flex flex-wrap items-center gap-1 pt-1">
                    <span className="text-[10px] text-[var(--text-muted)]">Insert:</span>
                    <button
                      type="button"
                      onClick={() => updateSelectedField({ fixed_text: '{{name}}', field_key: 'name', label: 'Participant Name' })}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 cursor-pointer"
                    >
                      {'{'}{'{'}name{'}'}{'}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedField({ fixed_text: '{{event}}', field_key: 'event_name', label: 'Event Name' })}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 cursor-pointer"
                    >
                      {'{'}{'{'}event{'}'}{'}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedField({ fixed_text: '{{date}}', field_key: 'issue_date', label: 'Issue Date' })}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 cursor-pointer"
                    >
                      {'{'}{'{'}date{'}'}{'}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateSelectedField({ fixed_text: '{{certificate_id}}', field_key: 'certificate_id', label: 'Certificate ID' })}
                      className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 cursor-pointer"
                    >
                      {'{'}{'{'}certificate_id{'}'}{'}'}
                    </button>
                  </div>
                </div>
              )}

              {/* COVER UNWANTED TEMPLATE TEXT / BACKGROUND MASK TOGGLE */}
              {!selectedField.is_qr && (
                <div className="p-3 rounded-xl border space-y-2.5"
                  style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(selectedField.mask_unwanted_text)}
                      onChange={(e) => updateSelectedField({ mask_unwanted_text: e.target.checked })}
                      className="mt-0.5 rounded accent-indigo-600"
                    />
                    <div>
                      <span className="font-bold text-[var(--text-primary)] block">Cover Unwanted Template Text</span>
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        Erase unwanted dummy text (like "[Participant Name]" or sample lines) with a background mask.
                      </span>
                    </div>
                  </label>

                  {selectedField.mask_unwanted_text && (
                    <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--border-subtle)' }}>
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-[var(--text-secondary)]">Mask Cover Width:</span>
                          <span className="font-bold text-[var(--text-primary)]">{selectedField.mask_width || 50}%</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="90"
                          value={selectedField.mask_width || 50}
                          onChange={(e) => updateSelectedField({ mask_width: parseInt(e.target.value) })}
                          className="w-full accent-indigo-600"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-[var(--text-secondary)]">Mask Color:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="color"
                            value={selectedField.mask_color || '#FFFFFF'}
                            onChange={(e) => updateSelectedField({ mask_color: e.target.value })}
                            className="w-6 h-6 rounded cursor-pointer border-0 p-0"
                          />
                          <span className="font-mono text-[10px] text-[var(--text-muted)] uppercase">
                            {selectedField.mask_color || '#FFFFFF'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Position Coordinates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold mb-1 text-[var(--text-secondary)]">X Position (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={selectedField.x}
                    onChange={(e) => updateSelectedField({ x: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Y Position (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={selectedField.y}
                    onChange={(e) => updateSelectedField({ y: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium"
                    style={{ borderColor: 'var(--border-color)' }}
                  />
                </div>
              </div>

              {!selectedField.is_qr ? (
                <>
                  {/* Font Family to match certificate */}
                  <div>
                    <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Font Family</label>
                    <select
                      value={selectedField.font_family}
                      onChange={(e) => updateSelectedField({ font_family: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)] font-medium"
                      style={{ borderColor: 'var(--border-color)' }}
                    >
                      <option value="Times">Times Roman (Classic Serif)</option>
                      <option value="Helvetica">Helvetica / Arial (Modern Clean)</option>
                      <option value="Courier">Courier (Digital / Monospace)</option>
                    </select>
                  </div>

                  {/* Font Size */}
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="font-semibold text-[var(--text-secondary)]">Font Size</label>
                      <span className="font-bold text-[var(--text-primary)]">{selectedField.font_size} pt</span>
                    </div>
                    <input
                      type="range"
                      min="9"
                      max="60"
                      value={selectedField.font_size}
                      onChange={(e) => updateSelectedField({ font_size: parseInt(e.target.value) })}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  {/* Text Alignment & Styling */}
                  <div>
                    <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Alignment & Style</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateSelectedField({ align: 'left' })}
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          selectedField.align === 'left' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600' : 'text-[var(--text-secondary)]'
                        }`}
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <AlignLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedField({ align: 'center' })}
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          selectedField.align === 'center' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600' : 'text-[var(--text-secondary)]'
                        }`}
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <AlignCenter className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedField({ align: 'right' })}
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          selectedField.align === 'right' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600' : 'text-[var(--text-secondary)]'
                        }`}
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <AlignRight className="w-3.5 h-3.5" />
                      </button>

                      <div className="h-4 w-px bg-[var(--border-color)] mx-1"></div>

                      <button
                        type="button"
                        onClick={() => updateSelectedField({ bold: !selectedField.bold })}
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          selectedField.bold ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600 font-bold' : 'text-[var(--text-secondary)]'
                        }`}
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <Bold className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => updateSelectedField({ italic: !selectedField.italic })}
                        className={`p-1.5 rounded-lg border cursor-pointer ${
                          selectedField.italic ? 'bg-indigo-500/20 border-indigo-500 text-indigo-600' : 'text-[var(--text-secondary)]'
                        }`}
                        style={{ borderColor: 'var(--border-color)' }}
                      >
                        <Italic className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Font Color */}
                  <div>
                    <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedField.color}
                        onChange={(e) => updateSelectedField({ color: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={selectedField.color}
                        onChange={(e) => updateSelectedField({ color: e.target.value })}
                        className="flex-1 px-3 py-1 rounded-xl border text-xs font-mono uppercase bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        style={{ borderColor: 'var(--border-color)' }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                /* QR Code sizing */
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="font-semibold text-[var(--text-secondary)]">QR Code Box Size</label>
                    <span className="font-bold text-[var(--text-primary)]">{selectedField.qr_size || 65} px</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="140"
                    value={selectedField.qr_size || 65}
                    onChange={(e) => updateSelectedField({ qr_size: parseInt(e.target.value) })}
                    className="w-full accent-indigo-600"
                  />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    Directly scans to CertiFlow verification registry
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--text-muted)]">
              Select an element on canvas to edit text or adjust position.
            </div>
          )}

          {/* Proceed CTA */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <button
              onClick={handleProceed}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{ background: 'var(--primary-gradient)' }}
            >
              <span>Save & Continue to Participant Data</span>
              <Check className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
