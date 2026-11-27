import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Image,
  AlertTriangle,
  Copy,
  Download,
  Plus,
  Trash2,
  Check,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import api from '../../api/client';

interface ParticipantUploadStepProps {
  onNext: (data: { rows: any[]; columns: string[] }) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  initialRows?: any[];
}

export const ParticipantUploadStep: React.FC<ParticipantUploadStepProps> = ({
  onNext,
  showToast,
  initialRows = [],
}) => {
  const [rows, setRows] = useState<any[]>(initialRows);
  const [columns, setColumns] = useState<string[]>([]);
  const [dupCount, setDupCount] = useState<number>(0);
  const [missingCount, setMissingCount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setFileName(file.name);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/participants/parse-file', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setRows(res.data.rows);
      setColumns(res.data.columns);
      setDupCount(res.data.duplicates_count);
      setMissingCount(res.data.missing_mandatory_count);
      showToast(`Successfully parsed ${res.data.total_extracted} records from ${file.name}`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to process document', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const loadSampleDataset = () => {
    const sample = [
      {
        _id: 1,
        Full_Name: 'Alexander Wright',
        Email_Address: 'alex.wright@example.com',
        Role: '1st Place Grand Winner',
        Event: 'National AI & Cloud Hackathon 2026',
        _is_duplicate: false,
        _is_missing_mandatory: false,
      },
      {
        _id: 2,
        Full_Name: 'Elena Rostova',
        Email_Address: 'elena.rostova@example.com',
        Role: 'Lead Innovator',
        Event: 'National AI & Cloud Hackathon 2026',
        _is_duplicate: false,
        _is_missing_mandatory: false,
      },
      {
        _id: 3,
        Full_Name: 'David Chen',
        Email_Address: 'david.chen@example.com',
        Role: 'Best Architecture Award',
        Event: 'National AI & Cloud Hackathon 2026',
        _is_duplicate: false,
        _is_missing_mandatory: false,
      },
      {
        _id: 4,
        Full_Name: 'Maya Patel',
        Email_Address: 'maya.patel@example.com',
        Role: 'Distinguished Participant',
        Event: 'National AI & Cloud Hackathon 2026',
        _is_duplicate: false,
        _is_missing_mandatory: false,
      },
      {
        _id: 5,
        Full_Name: 'Liam Johnson',
        Email_Address: 'liam.j@techcorp.io',
        Role: 'Special Mention',
        Event: 'National AI & Cloud Hackathon 2026',
        _is_duplicate: false,
        _is_missing_mandatory: false,
      },
    ];
    setRows(sample);
    setColumns(['Full_Name', 'Email_Address', 'Role', 'Event']);
    setDupCount(0);
    setMissingCount(0);
    setFileName('sample_hackathon_participants.xlsx');
    showToast('Loaded demo participant dataset', 'info');
  };

  const updateCell = (rowIndex: number, colName: string, val: string) => {
    const updated = [...rows];
    updated[rowIndex][colName] = val;

    // Recalculate missing name flag if this was name column
    if (colName.toLowerCase().includes('name')) {
      updated[rowIndex]._is_missing_mandatory = !val.trim();
    }
    setRows(updated);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
    showToast('Row removed', 'info');
  };

  const addRow = () => {
    const newRow: any = { _id: Date.now(), _is_duplicate: false, _is_missing_mandatory: false };
    columns.forEach((col) => {
      newRow[col] = '';
    });
    setRows([newRow, ...rows]);
    showToast('Added empty participant row', 'info');
  };

  const handleDownloadCleaned = async (format: 'csv' | 'xlsx') => {
    try {
      const res = await api.post(`/participants/export-cleaned?format=${format}`, { rows }, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cleaned_participants.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`Cleaned data downloaded as .${format}`, 'success');
    } catch (err) {
      showToast('Failed to export cleaned data', 'error');
    }
  };

  const handleProceed = () => {
    if (rows.length === 0) {
      showToast('Please upload or provide participant records to proceed', 'error');
      return;
    }
    onNext({ rows, columns });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
            Step 2: Participant Data Upload & Cleaning
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Upload Excel (.xlsx), CSV, Word (.docx), PDF, or image scans. Fix cells inline before generation.
          </p>
        </div>

        <button
          onClick={loadSampleDataset}
          className="px-3.5 py-1.5 rounded-xl border text-xs font-semibold hover:bg-[var(--border-subtle)] transition-colors flex items-center gap-1.5 cursor-pointer"
          style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Load Demo Dataset</span>
        </button>
      </div>

      {/* Upload Dropzone */}
      <div
        className="border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-colors hover:border-indigo-500/50"
        style={{
          borderColor: 'var(--border-color)',
          backgroundColor: 'var(--bg-card)',
        }}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">
              Drop your participant roster file here, or browse
            </h3>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Supports Excel (.xlsx, .xls), CSV, Word (.docx), PDF (.pdf), and Images (.png, .jpg)
            </p>
          </div>

          <label className="inline-flex px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 cursor-pointer items-center gap-2"
            style={{ background: 'var(--primary-gradient)' }}>
            <FileSpreadsheet className="w-4 h-4" />
            <span>{isProcessing ? 'Extracting Text & Tables...' : 'Select Participant File'}</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.docx,.pdf,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isProcessing}
            />
          </label>

          {fileName && (
            <div className="text-xs font-medium text-[var(--text-primary)] flex items-center justify-center gap-1.5 pt-1">
              <FileCheck className="w-4 h-4 text-emerald-500" />
              <span>Loaded: {fileName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Quality Stats & Audit Banner */}
      {rows.length > 0 && (
        <div className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4"
          style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div>
              <span className="text-[var(--text-muted)]">Total Records: </span>
              <span className="font-bold text-[var(--text-primary)]">{rows.length}</span>
            </div>
            <div className="h-4 w-px bg-[var(--border-color)]"></div>
            <div>
              <span className="text-[var(--text-muted)]">Detected Columns: </span>
              <span className="font-bold text-[var(--text-primary)]">{columns.join(', ') || 'N/A'}</span>
            </div>
            {dupCount > 0 && (
              <>
                <div className="h-4 w-px bg-[var(--border-color)]"></div>
                <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <Copy className="w-3.5 h-3.5" />
                  <span>{dupCount} Duplicate Records Detected</span>
                </div>
              </>
            )}
            {missingCount > 0 && (
              <>
                <div className="h-4 w-px bg-[var(--border-color)]"></div>
                <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{missingCount} Missing Required Fields</span>
                </div>
              </>
            )}
          </div>

          {/* Clean Data Download Options */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownloadCleaned('csv')}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--border-subtle)] transition-colors flex items-center gap-1 cursor-pointer"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              title="Download cleaned data as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cleaned CSV</span>
            </button>
            <button
              onClick={() => handleDownloadCleaned('xlsx')}
              className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-[var(--border-subtle)] transition-colors flex items-center gap-1 cursor-pointer"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              title="Download cleaned data as Excel"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Cleaned Excel</span>
            </button>
          </div>
        </div>
      )}

      {/* Editable Participant Data Table */}
      {rows.length > 0 && (
        <div className="rounded-2xl border shadow-xs overflow-hidden"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <h3 className="font-bold text-sm text-[var(--text-primary)]">Editable Data Grid</h3>
              <p className="text-[11px] text-[var(--text-muted)]">Click on any cell to edit or correct mistakes.</p>
            </div>
            <button
              onClick={addRow}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1 hover:bg-[var(--border-subtle)] transition-colors cursor-pointer"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Row</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-[var(--bg-surface)] z-10 border-b" style={{ borderColor: 'var(--border-color)' }}>
                <tr>
                  <th className="py-2.5 px-3 font-bold text-[var(--text-muted)] w-12 text-center">#</th>
                  {columns.map((col) => (
                    <th key={col} className="py-2.5 px-3 font-bold text-[var(--text-primary)] whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                  <th className="py-2.5 px-3 font-bold text-[var(--text-muted)] text-center w-24">Issues</th>
                  <th className="py-2.5 px-3 font-bold text-[var(--text-muted)] text-right w-16">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: 'var(--border-subtle)' }}>
                {rows.map((row, rIdx) => {
                  const isDup = row._is_duplicate;
                  const isMissing = row._is_missing_mandatory;

                  return (
                    <tr
                      key={row._id || rIdx}
                      className={`hover:bg-[var(--border-subtle)] transition-colors ${
                        isMissing ? 'bg-rose-500/5' : isDup ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-2 px-3 text-center text-[var(--text-muted)] font-mono">{rIdx + 1}</td>
                      {columns.map((col) => (
                        <td key={col} className="py-1 px-2">
                          <input
                            type="text"
                            value={row[col] ?? ''}
                            onChange={(e) => updateCell(rIdx, col, e.target.value)}
                            className="w-full px-2 py-1 rounded-md border text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-hidden bg-transparent"
                            style={{
                              borderColor: !row[col] && col.toLowerCase().includes('name') ? '#f43f5e' : 'var(--border-color)',
                              color: 'var(--text-primary)',
                            }}
                          />
                        </td>
                      ))}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {isMissing ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600">
                            Missing Name
                          </span>
                        ) : isDup ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600">
                            Duplicate
                          </span>
                        ) : (
                          <span className="text-emerald-500 text-[10px] font-bold">Valid</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => removeRow(rIdx)}
                          className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex justify-end pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={handleProceed}
          disabled={rows.length === 0}
          className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          style={{ background: 'var(--primary-gradient)' }}
        >
          <span>Continue to Data Mapping</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
