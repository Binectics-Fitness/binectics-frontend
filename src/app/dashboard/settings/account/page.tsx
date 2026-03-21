'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountSettingsPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const handlePasswordChange = async () => {
    setIsChangingPassword(true);
    // Simulate password change
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsChangingPassword(false);
    setPasswords({ current: '', new: '', confirm: '' });
    alert('Password changed successfully!');
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      await logout();
      router.push('/');
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="rounded-xl bg-white p-4 shadow-card sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-foreground sm:text-xl">Change Password</h3>
        <div className="max-w-xl space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={handlePasswordChange}
            disabled={isChangingPassword}
            className="w-full rounded-lg bg-primary-500 px-6 py-3 font-semibold text-foreground transition-colors hover:bg-primary-600 sm:w-auto"
          >
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border-2 border-red-200 bg-white p-4 shadow-card sm:p-6">
        <h3 className="mb-4 text-lg font-bold text-red-600 sm:text-xl">Danger Zone</h3>
        <p className="text-sm text-foreground/70 mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="w-full rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-red-700 sm:w-auto"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}
