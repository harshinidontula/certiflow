import React, { useState, useEffect } from 'react';
import {
  Building,
  User,
  Globe,
  Mail,
  Shield,
  Save,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SettingsViewProps {
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ showToast }) => {
  const { user, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || 'Alex Morgan');
  const [orgName, setOrgName] = useState(user?.organization?.name || 'Global Institute of Technology & Innovation');
  const [website, setWebsite] = useState(user?.organization?.website || 'https://giti.edu');
  const [contactEmail, setContactEmail] = useState(user?.organization?.contact_email || 'admin@giti.edu');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      if (user.organization) {
        setOrgName(user.organization.name);
        setWebsite(user.organization.website || '');
        setContactEmail(user.organization.contact_email || '');
      }
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        full_name: fullName,
        organization_name: orgName,
        website,
        contact_email: contactEmail,
      } as any);
      showToast('Organization settings updated successfully!', 'success');
    } catch (err) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn py-2">
      {/* Header */}
      <div className="pb-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">
          Organization & Profile Settings
        </h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Manage your organization identity, digital issuer signature, and platform preferences.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Information Card */}
        <div className="p-6 rounded-2xl border shadow-xs space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <Building className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">Organization Branding</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Organization / Institute Name</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Official Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourorganization.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Contact / Support Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="certificates@organization.edu"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Issuer Verification ID</label>
              <div className="relative">
                <Shield className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  disabled
                  value={`ORG-${user?.organization?.id || 101}-VERIFIED`}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-[var(--bg-surface)] text-[var(--text-muted)] font-mono opacity-80"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* User Account Details */}
        <div className="p-6 rounded-2xl border shadow-xs space-y-4"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        >
          <div className="flex items-center gap-2 pb-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <User className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-[var(--text-primary)]">User Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Admin Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-[var(--bg-surface)] text-[var(--text-primary)]"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-[var(--text-secondary)]">Account Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  disabled
                  value={user?.email || 'admin@certiflow.org'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-80"
                  style={{ borderColor: 'var(--border-color)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white shadow-md hover:opacity-95 active:scale-98 transition-all flex items-center gap-2 cursor-pointer"
            style={{ background: 'var(--primary-gradient)' }}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Organization Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
