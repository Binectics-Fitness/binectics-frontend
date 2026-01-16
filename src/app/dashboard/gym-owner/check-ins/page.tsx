'use client';

import { useState, useEffect, useRef } from 'react';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';
import QRCode from 'qrcode';
import { useAuth } from '@/contexts/AuthContext';

export default function GymOwnerCheckInsPage() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code on mount
  useEffect(() => {
    if (user && canvasRef.current) {
      // Generate a unique check-in URL for this gym
      const gymId = user.id; // In real app, this would be the gym ID
      const checkInUrl = `${window.location.origin}/check-in/${gymId}`;

      QRCode.toCanvas(canvasRef.current, checkInUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#03314B',
          light: '#FFFFFF',
        },
      });

      // Also generate data URL for download
      QRCode.toDataURL(checkInUrl, { width: 512 })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err));
    }
  }, [user]);

  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.download = 'gym-checkin-qr-code.png';
      link.href = qrCodeUrl;
      link.click();
    }
  };

  const checkIns = [
    { id: 1, memberName: 'John Smith', time: '08:15 AM', date: '2024-01-16', avatar: 'JS' },
    { id: 2, memberName: 'Sarah Johnson', time: '09:30 AM', date: '2024-01-16', avatar: 'SJ' },
    { id: 3, memberName: 'Mike Davis', time: '10:45 AM', date: '2024-01-16', avatar: 'MD' },
    { id: 4, memberName: 'Emily Brown', time: '11:20 AM', date: '2024-01-16', avatar: 'EB' },
    { id: 5, memberName: 'Alex Wilson', time: '12:05 PM', date: '2024-01-16', avatar: 'AW' },
    { id: 6, memberName: 'Lisa Martinez', time: '01:30 PM', date: '2024-01-16', avatar: 'LM' },
    { id: 7, memberName: 'Tom Anderson', time: '02:15 PM', date: '2024-01-16', avatar: 'TA' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">QR Check-ins</h1>
            <p className="text-foreground/60 mt-1">Track member attendance and gym traffic</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Today's Check-ins</p>
              <p className="text-3xl font-black text-foreground mt-2">87</p>
              <p className="text-sm text-primary-500 mt-2">+12% from yesterday</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">This Week</p>
              <p className="text-3xl font-black text-foreground mt-2">456</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">This Month</p>
              <p className="text-3xl font-black text-foreground mt-2">1,847</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Peak Hour</p>
              <p className="text-3xl font-black text-foreground mt-2">6 PM</p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-accent-blue-50 border-2 border-accent-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Your Gym QR Code</h3>
              <div className="bg-white rounded-lg p-6 flex items-center justify-center mb-4">
                <canvas ref={canvasRef} />
              </div>
              <p className="text-sm text-foreground/60 text-center mb-4">
                Members scan this code to check in to your gym
              </p>
              <div className="space-y-2">
                <button
                  onClick={downloadQRCode}
                  className="w-full px-4 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR Code
                </button>
                <button
                  onClick={() => window.print()}
                  className="w-full px-4 py-3 border-2 border-accent-blue-500 text-accent-blue-500 font-semibold rounded-lg hover:bg-accent-blue-50 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print QR Code
                </button>
              </div>
              <div className="mt-4 p-3 bg-white rounded-lg">
                <p className="text-xs font-semibold text-foreground/70 mb-1">Check-in URL:</p>
                <p className="text-xs text-foreground/60 break-all">
                  {typeof window !== 'undefined' && `${window.location.origin}/check-in/${user?.id}`}
                </p>
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-card p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Recent Check-ins</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {checkIns.map((checkIn) => (
                  <div
                    key={checkIn.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-accent-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {checkIn.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{checkIn.memberName}</p>
                        <p className="text-sm text-foreground/60">Checked in via QR</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{checkIn.time}</p>
                      <p className="text-sm text-foreground/60">{checkIn.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Check-in History */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-foreground">Check-in History</h3>
              <div className="flex gap-2">
                {['today', 'week', 'month'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedPeriod === period
                        ? 'bg-accent-blue-500 text-white'
                        : 'bg-gray-100 text-foreground hover:bg-gray-200'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Hourly breakdown */}
            <div className="grid grid-cols-12 gap-2 mb-4">
              {Array.from({ length: 24 }, (_, i) => {
                const hour = i;
                const checkIns = Math.floor(Math.random() * 20);
                const height = Math.max(20, (checkIns / 20) * 100);
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className="w-full bg-gray-100 rounded-t-lg flex items-end" style={{ height: '100px' }}>
                      <div
                        className="w-full bg-accent-blue-500 rounded-t-lg"
                        style={{ height: `${height}%` }}
                        title={`${hour}:00 - ${checkIns} check-ins`}
                      />
                    </div>
                    <span className="text-xs text-foreground/60">{hour}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-sm text-foreground/60">Hourly check-in distribution</p>
          </div>
        </div>
      </main>
    </div>
  );
}
