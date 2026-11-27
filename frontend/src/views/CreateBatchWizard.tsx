import React, { useState } from 'react';
import {
  FileBadge,
  FileSpreadsheet,
  Link2,
  Cpu,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { TemplateEditorStep } from './wizard/TemplateEditorStep';
import { ParticipantUploadStep } from './wizard/ParticipantUploadStep';
import { DataMappingStep } from './wizard/DataMappingStep';
import { GenerationStep } from './wizard/GenerationStep';
import { DistributionStep } from './wizard/DistributionStep';

interface CreateBatchWizardProps {
  initialTemplateId?: number;
  onNavigate: (tab: string, state?: any) => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const CreateBatchWizard: React.FC<CreateBatchWizardProps> = ({
  initialTemplateId,
  onNavigate,
  showToast,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Wizard Accumulated Data
  const [template, setTemplate] = useState<any>(null);
  const [participantData, setParticipantData] = useState<{ rows: any[]; columns: string[] }>({
    rows: [],
    columns: [],
  });
  const [mappingConfig, setMappingConfig] = useState<Record<string, string>>({});
  const [projectName, setProjectName] = useState('Certificate Batch');
  const [eventName, setEventName] = useState('National Hackathon 2026');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [projectResult, setProjectResult] = useState<any>(null);

  const steps = [
    { num: 1, title: 'Template Design', icon: FileBadge },
    { num: 2, title: 'Participant Data', icon: FileSpreadsheet },
    { num: 3, title: 'Data Mapping', icon: Link2 },
    { num: 4, title: 'Generation Engine', icon: Cpu },
    { num: 5, title: 'Distribution', icon: Share2 },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Step Progress Tracker */}
      <div
        className="p-4 sm:p-5 rounded-2xl border shadow-xs"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto relative">
          {/* Connecting Track Line */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-[var(--border-color)] z-0 hidden sm:block"></div>

          {steps.map((st) => {
            const Icon = st.icon;
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;

            return (
              <div
                key={st.num}
                className="relative z-10 flex flex-col items-center gap-1.5 cursor-pointer"
                onClick={() => {
                  if (st.num < currentStep) setCurrentStep(st.num);
                }}
              >
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'text-white scale-110 shadow-md shadow-indigo-500/25 ring-2 ring-indigo-500/30'
                      : 'border text-[var(--text-muted)] bg-[var(--bg-surface)]'
                  }`}
                  style={
                    isCurrent
                      ? { background: 'var(--primary-gradient)' }
                      : !isCompleted
                      ? { borderColor: 'var(--border-color)' }
                      : {}
                  }
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                </div>

                <span
                  className={`text-[11px] font-semibold text-center hidden md:block ${
                    isCurrent
                      ? 'text-[var(--text-primary)] font-bold'
                      : isCompleted
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {st.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Step View */}
      <div
        className="p-6 sm:p-8 rounded-2xl border shadow-xs"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
      >
        {currentStep === 1 && (
          <TemplateEditorStep
            initialTemplateId={initialTemplateId}
            showToast={showToast}
            onNext={(tmplData) => {
              setTemplate(tmplData);
              setCurrentStep(2);
            }}
          />
        )}

        {currentStep === 2 && (
          <ParticipantUploadStep
            initialRows={participantData.rows}
            showToast={showToast}
            onNext={(data) => {
              setParticipantData(data);
              setCurrentStep(3);
            }}
          />
        )}

        {currentStep === 3 && (
          <DataMappingStep
            template={template}
            participantData={participantData}
            showToast={showToast}
            onBack={() => setCurrentStep(2)}
            onNext={(mapping, pName, eName, iDate) => {
              setMappingConfig(mapping);
              setProjectName(pName);
              setEventName(eName);
              setIssueDate(iDate);
              setCurrentStep(4);
            }}
          />
        )}

        {currentStep === 4 && (
          <GenerationStep
            template={template}
            participantData={participantData}
            mappingConfig={mappingConfig}
            projectName={projectName}
            eventName={eventName}
            issueDate={issueDate}
            showToast={showToast}
            onNext={(res) => {
              setProjectResult(res);
              setCurrentStep(5);
            }}
          />
        )}

        {currentStep === 5 && (
          <DistributionStep
            projectResult={projectResult}
            showToast={showToast}
            onFinish={() => onNavigate('certificates', { projectId: projectResult?.project_id })}
          />
        )}
      </div>
    </div>
  );
};
