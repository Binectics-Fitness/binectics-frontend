'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

export default function BillingSettingsPage() {
  const { user } = useAuth();
  const [isAddingCard, setIsAddingCard] = useState(false);

  const paymentMethods = [
    { id: 1, type: 'Visa', last4: '4242', expiry: '12/25', isDefault: true },
    { id: 2, type: 'Mastercard', last4: '8888', expiry: '09/26', isDefault: false },
  ];

  const invoices = [
    { id: 1, date: '2025-01-15', amount: 49, status: 'Paid', description: 'Premium Membership - January 2025' },
    { id: 2, date: '2024-12-15', amount: 49, status: 'Paid', description: 'Premium Membership - December 2024' },
    { id: 3, date: '2024-11-15', amount: 49, status: 'Paid', description: 'Premium Membership - November 2024' },
  ];

  const subscriptions = [
    { id: 1, name: 'Binectics Premium', amount: 49, interval: 'month', nextBilling: '2025-02-15', status: 'Active' },
  ];

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-4 shadow-card sm:p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 sm:items-center">
            <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <h3 className="text-lg font-bold text-foreground sm:text-xl">Payment Methods</h3>
          </div>
          <button onClick={() => setIsAddingCard(!isAddingCard)} className="w-full rounded-lg bg-primary-500 px-4 py-2 font-semibold text-foreground transition-colors hover:bg-primary-600 sm:w-auto">
            Add Payment Method
          </button>
        </div>

        {isAddingCard && (
          <div className="mb-6 rounded-lg border-2 border-primary-200 bg-gray-50 p-4">
            <h4 className="font-bold text-foreground mb-4">Add New Card</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-2">Card Number</label>
                <input type="text" placeholder="1234 5678 9012 3456" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">Expiry Date</label>
                  <input type="text" placeholder="MM/YY" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/70 mb-2">CVC</label>
                  <input type="text" placeholder="123" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button onClick={() => { alert('Card added successfully!'); setIsAddingCard(false); }} className="w-full rounded-lg bg-primary-500 px-4 py-2 font-semibold text-foreground transition-colors hover:bg-primary-600 sm:w-auto">Save Card</button>
                <button onClick={() => setIsAddingCard(false)} className="w-full rounded-lg bg-gray-200 px-4 py-2 font-semibold text-foreground transition-colors hover:bg-gray-300 sm:w-auto">Cancel</button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex flex-col gap-4 rounded-lg border-2 border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4 sm:items-center">
                <div className="w-12 h-8 bg-gradient-to-r from-accent-blue-500 to-accent-purple-500 rounded flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{method.type} ending in {method.last4}</p>
                  <p className="text-sm text-foreground/60">Expires {method.expiry}</p>
                </div>
                {method.isDefault && <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">Default</span>}
              </div>
              <div className="flex flex-wrap gap-3 sm:justify-end">
                {!method.isDefault && <button className="text-sm text-accent-blue-500 hover:text-accent-blue-600 font-semibold">Make Default</button>}
                <button className="text-sm text-red-500 hover:text-red-600 font-semibold">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-card sm:p-6">
        <div className="mb-6 flex items-start gap-3 sm:items-center">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-lg font-bold text-foreground sm:text-xl">Active Subscriptions</h3>
        </div>
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="p-4 border-2 border-gray-200 rounded-lg">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-bold text-foreground text-lg">{sub.name}</p>
                  <p className="text-foreground/60 text-sm mt-1">Next billing: {sub.nextBilling}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-2xl font-black text-foreground">${sub.amount}</p>
                  <p className="text-sm text-foreground/60">per {sub.interval}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-gray-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">{sub.status}</span>
                <div className="flex flex-wrap gap-3">
                  <button className="text-sm text-accent-blue-500 hover:text-accent-blue-600 font-semibold">Change Plan</button>
                  <button className="text-sm text-red-500 hover:text-red-600 font-semibold">Cancel Subscription</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-card sm:p-6">
        <div className="mb-6 flex items-start gap-3 sm:items-center">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-bold text-foreground sm:text-xl">Billing History</h3>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-foreground/70 text-sm">Date</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground/70 text-sm">Description</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground/70 text-sm">Amount</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground/70 text-sm">Status</th>
                <th className="text-right py-3 px-4 font-semibold text-foreground/70 text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-foreground">{invoice.date}</td>
                  <td className="py-3 px-4 text-foreground">{invoice.description}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">${invoice.amount}</td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">{invoice.status}</span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="text-sm text-accent-blue-500 hover:text-accent-blue-600 font-semibold">Download</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-3 md:hidden">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-foreground">{invoice.description}</p>
                  <p className="mt-1 text-sm text-foreground/60">{invoice.date}</p>
                </div>
                <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">{invoice.status}</span>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                <p className="text-lg font-black text-foreground">${invoice.amount}</p>
                <button className="text-sm font-semibold text-accent-blue-500 hover:text-accent-blue-600">Download</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-card sm:p-6">
        <div className="mb-6 flex items-start gap-3 sm:items-center">
          <svg className="w-6 h-6 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-bold text-foreground sm:text-xl">Billing Preferences</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/70 mb-2">Billing Email</label>
            <input type="email" defaultValue={user.email} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
            <p className="text-xs text-foreground/60 mt-2">Invoices and receipts will be sent to this email</p>
          </div>
          <div className="flex flex-col gap-3 border-t border-gray-200 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="pr-2">
              <p className="font-semibold text-foreground">Auto-Renew Subscriptions</p>
              <p className="text-sm text-foreground/60 mt-1">Automatically renew subscriptions when they expire</p>
            </div>
            <button className="relative inline-flex h-6 w-11 flex-shrink-0 self-start cursor-pointer rounded-full border-2 border-transparent bg-primary-500 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:self-auto">
              <span className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
