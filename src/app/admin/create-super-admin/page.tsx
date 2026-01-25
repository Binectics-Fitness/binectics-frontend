'use client';

import { useState } from 'react';
import { mockAuthService as authService } from '@/lib/api/mock-auth';

export default function CreateSuperAdminPage() {
  const [formData, setFormData] = useState({
    firstName: 'Super',
    lastName: 'Admin',
    email: 'admin@binectics.com',
    password: 'Admin@123456',
    country: 'United States',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const getEmailForRole = (role: string): string => {
    const baseEmail = formData.email.split('@');
    const username = baseEmail[0];
    const domain = baseEmail[1];

    switch (role) {
      case 'ADMIN':
        return `${username}@${domain}`;
      case 'GYM_OWNER':
        return `gym@${domain}`;
      case 'TRAINER':
        return `trainer@${domain}`;
      case 'DIETICIAN':
        return `dietician@${domain}`;
      case 'USER':
        return `user@${domain}`;
      default:
        return formData.email;
    }
  };

  const createAccount = async (role: 'USER' | 'GYM_OWNER' | 'TRAINER' | 'DIETICIAN' | 'ADMIN') => {
    setIsLoading(true);
    setMessage(null);

    try {
      const response = await authService.register({
        email: getEmailForRole(role),
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role,
        accept_tos: true,
        country_code: 'US',
      });

      if (response.success) {
        setMessage({
          type: 'success',
          text: `✓ ${role} account created successfully (${getEmailForRole(role)})`,
        });
      } else {
        setMessage({
          type: 'error',
          text: `✗ Failed to create ${role} account: ${response.message}`,
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `✗ Error creating ${role} account`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAllAccounts = async () => {
    const roles: Array<'USER' | 'GYM_OWNER' | 'TRAINER' | 'DIETICIAN' | 'ADMIN'> = [
      'ADMIN',
      'GYM_OWNER',
      'TRAINER',
      'DIETICIAN',
      'USER',
    ];

    setIsLoading(true);
    let successCount = 0;

    for (const role of roles) {
      try {
        const response = await authService.register({
          email: getEmailForRole(role),
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          role,
          accept_tos: true,
          country_code: 'US',
        });

        if (response.success) {
          successCount++;
        }
      } catch (error) {
        console.error(`Failed to create ${role} account`, error);
      }
      // Wait 300ms between requests
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    setIsLoading(false);
    setMessage({
      type: 'success',
      text: `✓ Successfully created ${successCount} accounts!`,
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-black text-foreground mb-2">
          Create Super Admin Account
        </h1>
        <p className="text-foreground/60 mb-8">
          This will create 5 accounts with the same credentials but different roles.
        </p>

        {/* Account Details */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Account Details (All use same password)</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-foreground/60">Password (all accounts):</span>
              <span className="font-semibold text-foreground">{formData.password}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Admin Email:</span>
              <span className="font-semibold text-foreground">{getEmailForRole('ADMIN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Gym Owner Email:</span>
              <span className="font-semibold text-foreground">{getEmailForRole('GYM_OWNER')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Trainer Email:</span>
              <span className="font-semibold text-foreground">{getEmailForRole('TRAINER')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Dietician Email:</span>
              <span className="font-semibold text-foreground">{getEmailForRole('DIETICIAN')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">User Email:</span>
              <span className="font-semibold text-foreground">{getEmailForRole('USER')}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-200">
              <span className="text-foreground/60">Name:</span>
              <span className="font-semibold text-foreground">
                {formData.firstName} {formData.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground/60">Country:</span>
              <span className="font-semibold text-foreground">{formData.country}</span>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Edit Details (Optional)</h2>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="First Name"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="text"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 col-span-2"
            />
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 col-span-2"
            />
            <input
              type="text"
              placeholder="Country"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 col-span-2"
            />
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={createAllAccounts}
            disabled={isLoading}
            className="w-full h-14 bg-primary-500 text-foreground font-semibold rounded-lg hover:bg-primary-500/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating Accounts...' : 'Create All 5 Accounts'}
          </button>

          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => createAccount('ADMIN')}
              disabled={isLoading}
              className="px-3 py-2 bg-foreground text-white font-semibold rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 text-sm"
            >
              Admin
            </button>
            <button
              onClick={() => createAccount('GYM_OWNER')}
              disabled={isLoading}
              className="px-3 py-2 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-500/90 transition-colors disabled:opacity-50 text-sm"
            >
              Gym
            </button>
            <button
              onClick={() => createAccount('TRAINER')}
              disabled={isLoading}
              className="px-3 py-2 bg-accent-yellow-500 text-foreground font-semibold rounded-lg hover:bg-accent-yellow-500/90 transition-colors disabled:opacity-50 text-sm"
            >
              Trainer
            </button>
            <button
              onClick={() => createAccount('DIETICIAN')}
              disabled={isLoading}
              className="px-3 py-2 bg-accent-purple-500 text-white font-semibold rounded-lg hover:bg-accent-purple-500/90 transition-colors disabled:opacity-50 text-sm"
            >
              Dietician
            </button>
            <button
              onClick={() => createAccount('USER')}
              disabled={isLoading}
              className="px-3 py-2 bg-primary-500 text-foreground font-semibold rounded-lg hover:bg-primary-500/90 transition-colors disabled:opacity-50 text-sm"
            >
              User
            </button>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-foreground/70 mb-3">
            <strong>Note:</strong> This creates 5 separate accounts with different emails but the same password.
          </p>
          <div className="text-xs text-foreground/60 space-y-1 font-mono">
            <p>• Admin: {getEmailForRole('ADMIN')} / {formData.password}</p>
            <p>• Gym: {getEmailForRole('GYM_OWNER')} / {formData.password}</p>
            <p>• Trainer: {getEmailForRole('TRAINER')} / {formData.password}</p>
            <p>• Dietician: {getEmailForRole('DIETICIAN')} / {formData.password}</p>
            <p>• User: {getEmailForRole('USER')} / {formData.password}</p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <a href="/" className="text-accent-blue-500 hover:underline font-medium">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
