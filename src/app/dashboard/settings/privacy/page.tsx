'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public' as 'public' | 'private' | 'members',
    showEmail: false,
    showPhone: false,
    showLocation: true,
    showProgress: false,
    allowActivityTracking: true,
    allowPerformanceAnalytics: true,
    shareDataWithProviders: true,
    allowDirectMessages: true,
    allowProviderMessages: true,
    allowMarketingEmails: false,
    shareWithThirdParties: false,
    allowAnonymousData: true,
  });

  const handleToggle = (key: keyof typeof privacy) => {
    if (typeof privacy[key] === 'boolean') {
      setPrivacy({ ...privacy, [key]: !privacy[key] as any });
    }
  };

  const handleVisibilityChange = (value: 'public' | 'private' | 'members') => {
    setPrivacy({ ...privacy, profileVisibility: value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMessage('');
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSuccessMessage('Privacy settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadData = () => {
    alert('Your data export has been requested. You will receive an email with a download link within 24 hours.');
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="bg-primary-50 border-2 border-primary-500 text-primary-900 rounded-lg p-4">
          <p className="font-semibold">{successMessage}</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h3 className="text-xl font-bold text-foreground">Profile Visibility</h3>
        </div>
        <div className="space-y-4 mb-6">
          <p className="text-sm text-foreground/70">Who can see your profile?</p>
          <div className="space-y-2">
            {[
              { value: 'public', title: 'Public', desc: 'Anyone can view your profile' },
              { value: 'members', title: 'Members Only', desc: 'Only Binectics members can view your profile' },
              { value: 'private', title: 'Private', desc: 'Only you can view your profile' },
            ].map((option) => (
              <label key={option.value} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
                <input type="radio" name="visibility" checked={privacy.profileVisibility === option.value} onChange={() => handleVisibilityChange(option.value as any)} className="w-4 h-4 text-primary-500 focus:ring-primary-500" />
                <div>
                  <p className="font-semibold text-foreground">{option.title}</p>
                  <p className="text-sm text-foreground/60">{option.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-4 pt-4 border-t border-gray-200">
          <PrivacyToggle label="Show Email Address" description="Display your email on your public profile" checked={privacy.showEmail} onChange={() => handleToggle('showEmail')} />
          <PrivacyToggle label="Show Phone Number" description="Display your phone number on your public profile" checked={privacy.showPhone} onChange={() => handleToggle('showPhone')} />
          <PrivacyToggle label="Show Location" description="Display your city and country on your profile" checked={privacy.showLocation} onChange={() => handleToggle('showLocation')} />
          <PrivacyToggle label="Show Fitness Progress" description="Allow others to see your workout stats and achievements" checked={privacy.showProgress} onChange={() => handleToggle('showProgress')} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-xl font-bold text-foreground">Activity & Data Tracking</h3>
        </div>
        <div className="space-y-4">
          <PrivacyToggle label="Activity Tracking" description="Track your workout sessions, check-ins, and engagement" checked={privacy.allowActivityTracking} onChange={() => handleToggle('allowActivityTracking')} />
          <PrivacyToggle label="Performance Analytics" description="Allow Binectics to analyze your performance data for insights" checked={privacy.allowPerformanceAnalytics} onChange={() => handleToggle('allowPerformanceAnalytics')} />
          <PrivacyToggle label="Share Data with Providers" description="Share your activity data with your trainers and gyms" checked={privacy.shareDataWithProviders} onChange={() => handleToggle('shareDataWithProviders')} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-xl font-bold text-foreground">Communication Preferences</h3>
        </div>
        <div className="space-y-4">
          <PrivacyToggle label="Allow Direct Messages" description="Let other members send you direct messages" checked={privacy.allowDirectMessages} onChange={() => handleToggle('allowDirectMessages')} />
          <PrivacyToggle label="Provider Messages" description="Receive messages from trainers, gyms, and dieticians" checked={privacy.allowProviderMessages} onChange={() => handleToggle('allowProviderMessages')} />
          <PrivacyToggle label="Marketing Communications" description="Receive marketing emails from Binectics partners" checked={privacy.allowMarketingEmails} onChange={() => handleToggle('allowMarketingEmails')} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 className="text-xl font-bold text-foreground">Data Sharing & Privacy</h3>
        </div>
        <div className="space-y-4">
          <PrivacyToggle label="Share with Third Parties" description="Allow Binectics to share your data with trusted third-party partners" checked={privacy.shareWithThirdParties} onChange={() => handleToggle('shareWithThirdParties')} />
          <PrivacyToggle label="Anonymous Data Collection" description="Contribute anonymous usage data to help improve Binectics" checked={privacy.allowAnonymousData} onChange={() => handleToggle('allowAnonymousData')} />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6">
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <h3 className="text-xl font-bold text-foreground">Data Management</h3>
        </div>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="font-semibold text-foreground mb-2">Download Your Data</p>
            <p className="text-sm text-foreground/70 mb-4">Request a copy of all your personal data stored on Binectics.</p>
            <button onClick={handleDownloadData} className="px-4 py-2 bg-accent-blue-500 text-foreground font-semibold rounded-lg hover:bg-accent-blue-600 transition-colors">Request Data Export</button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-primary-500 text-foreground font-semibold rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSaving ? 'Saving...' : 'Save Settings'}</button>
      </div>
    </div>
  );
}

function PrivacyToggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: () => void; }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0">
      <div className="flex-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-foreground/60 mt-1">{description}</p>
      </div>
      <button onClick={onChange} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${checked ? 'bg-primary-500' : 'bg-gray-200'}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}
