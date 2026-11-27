import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { AuthModal } from './components/AuthModal';

import { DashboardView } from './views/DashboardView';
import { CreateBatchWizard } from './views/CreateBatchWizard';
import { ProjectsView } from './views/ProjectsView';
import { TemplatesGalleryView } from './views/TemplatesGalleryView';
import { CertificatesView } from './views/CertificatesView';
import { PublicVerificationView } from './views/PublicVerificationView';
import { SettingsView } from './views/SettingsView';

import {
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  FileBadge,
  Award,
  ShieldCheck,
  Settings
} from 'lucide-react';

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [tabParams, setTabParams] = useState<any>({});
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Check URL pathname for direct verification routing (e.g. /verify/CERT-2026-001)
  useEffect(() => {
    const pathname = window.location.pathname;
    if (pathname.startsWith('/verify')) {
      setCurrentTab('verify');
    }
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleNavigate = (tab: string, params?: any) => {
    setCurrentTab(tab);
    if (params) setTabParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const mobileNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'create', label: 'Batch', icon: PlusCircle },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'certificates', label: 'Certs', icon: Award },
    { id: 'verify', label: 'Verify', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors">
      {/* Desktop Sidebar */}
      <Sidebar currentTab={currentTab} setTab={handleNavigate} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          currentTab={currentTab}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenVerify={() => handleNavigate('verify')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
          {currentTab === 'create' && (
            <CreateBatchWizard
              initialTemplateId={tabParams?.templateId}
              onNavigate={handleNavigate}
              showToast={showToast}
            />
          )}
          {currentTab === 'projects' && (
            <ProjectsView onNavigate={handleNavigate} showToast={showToast} />
          )}
          {currentTab === 'templates' && (
            <TemplatesGalleryView onNavigate={handleNavigate} showToast={showToast} />
          )}
          {currentTab === 'certificates' && (
            <CertificatesView
              initialProjectId={tabParams?.projectId}
              showToast={showToast}
              onNavigate={handleNavigate}
            />
          )}
          {currentTab === 'verify' && (
            <PublicVerificationView initialCertId={tabParams?.certId} />
          )}
          {currentTab === 'settings' && <SettingsView showToast={showToast} />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t px-2 flex items-center justify-around z-40 backdrop-blur-lg"
        style={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)' }}
      >
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex flex-col items-center justify-center p-1 rounded-xl transition-all cursor-pointer ${
                isActive ? 'text-[var(--primary)] font-bold' : 'text-[var(--text-muted)]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals & Notifications */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        showToast={showToast}
      />
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
