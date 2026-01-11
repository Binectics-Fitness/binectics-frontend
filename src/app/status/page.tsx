'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StatusPage() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleString('en-US', {
        timeZone: 'UTC',
        hour12: false,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const services = [
    {
      name: 'Web Application',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '234ms',
      description: 'Main website and web app',
    },
    {
      name: 'Mobile API',
      status: 'operational',
      uptime: '99.98%',
      responseTime: '89ms',
      description: 'iOS and Android app backend',
    },
    {
      name: 'QR Check-in System',
      status: 'operational',
      uptime: '99.97%',
      responseTime: '156ms',
      description: 'Gym check-in and verification',
    },
    {
      name: 'Booking System',
      status: 'operational',
      uptime: '99.96%',
      responseTime: '312ms',
      description: 'Trainer and dietician scheduling',
    },
    {
      name: 'Payment Processing',
      status: 'operational',
      uptime: '99.99%',
      responseTime: '445ms',
      description: 'Subscriptions and transactions',
    },
    {
      name: 'Email Service',
      status: 'operational',
      uptime: '99.95%',
      responseTime: '1.2s',
      description: 'Transactional and marketing emails',
    },
  ];

  const incidents = [
    {
      date: 'Jan 15, 2025',
      title: 'Scheduled Maintenance - Database Optimization',
      status: 'resolved',
      duration: '2 hours',
      impact: 'No service impact',
      description: 'We performed scheduled database optimization to improve query performance. All services remained operational during this maintenance window.',
    },
    {
      date: 'Jan 8, 2025',
      title: 'Partial Service Degradation - Booking System',
      status: 'resolved',
      duration: '45 minutes',
      impact: 'Minor',
      description: 'Some users experienced slower response times when booking trainer sessions. The issue was identified and resolved within 45 minutes.',
    },
    {
      date: 'Dec 28, 2024',
      title: 'Mobile App Update Deployed',
      status: 'resolved',
      duration: '15 minutes',
      impact: 'No service impact',
      description: 'Successfully deployed mobile app update v2.4.0 with new features and bug fixes. No user-facing issues reported.',
    },
  ];

  const upcomingMaintenance = [
    {
      date: 'Jan 25, 2025',
      time: '02:00 - 04:00 UTC',
      title: 'Infrastructure Upgrade',
      impact: 'Minimal - Service will remain available',
      description: 'We\'re upgrading our server infrastructure to improve performance and reliability.',
    },
  ];

  const metrics = [
    { label: 'Current Uptime', value: '99.98%', period: 'Last 30 days' },
    { label: 'Avg Response Time', value: '287ms', period: 'Last 24 hours' },
    { label: 'Active Users', value: '12,543', period: 'Right now' },
    { label: 'API Requests', value: '2.4M', period: 'Last hour' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'bg-accent-green-500';
      case 'degraded':
        return 'bg-accent-yellow-500';
      case 'outage':
        return 'bg-accent-red-500';
      default:
        return 'bg-neutral-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'operational':
        return 'All Systems Operational';
      case 'degraded':
        return 'Partial Service Degradation';
      case 'outage':
        return 'Service Outage';
      default:
        return 'Unknown Status';
    }
  };

  const overallStatus = 'operational';

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-background-secondary py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-4xl sm:text-5xl font-black text-foreground mb-4">
              System Status
            </h1>
            <p className="text-lg text-foreground-secondary">
              Current time: {currentTime} UTC
            </p>
          </div>

          {/* Overall Status */}
          <div className={`rounded-lg border-2 border-neutral-300 p-8 text-center ${
            overallStatus === 'operational' ? 'bg-accent-green-500 bg-opacity-10' : 'bg-background'
          }`}>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className={`h-4 w-4 rounded-full ${getStatusColor(overallStatus)}`} />
              <h2 className="font-display text-2xl font-black text-foreground">
                {getStatusText(overallStatus)}
              </h2>
            </div>
            <p className="text-foreground-secondary">
              All services are running smoothly
            </p>
          </div>
        </div>
      </section>

      {/* Metrics */}
      <section className="bg-background py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6 text-center"
              >
                <div className="text-3xl font-black text-primary-500 mb-2">
                  {metric.value}
                </div>
                <div className="font-bold text-foreground mb-1">
                  {metric.label}
                </div>
                <div className="text-sm text-foreground-secondary">
                  {metric.period}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Status */}
      <section className="bg-background-secondary py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-8">
            Service Status
          </h2>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`mt-1 h-3 w-3 rounded-full flex-shrink-0 ${getStatusColor(service.status)}`} />
                    <div>
                      <h3 className="font-bold text-foreground mb-1">
                        {service.name}
                      </h3>
                      <p className="text-sm text-foreground-secondary">
                        {service.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm sm:ml-7">
                    <div>
                      <div className="text-foreground-secondary mb-1">Uptime</div>
                      <div className="font-semibold text-foreground">{service.uptime}</div>
                    </div>
                    <div>
                      <div className="text-foreground-secondary mb-1">Response</div>
                      <div className="font-semibold text-foreground">{service.responseTime}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Maintenance */}
      {upcomingMaintenance.length > 0 && (
        <section className="bg-background py-12">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <h2 className="font-display text-3xl font-black text-foreground mb-8">
              Upcoming Maintenance
            </h2>
            <div className="space-y-4">
              {upcomingMaintenance.map((maintenance, index) => (
                <div
                  key={index}
                  className="rounded-lg border-2 border-accent-blue-500 bg-accent-blue-500 bg-opacity-10 p-6"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <svg className="h-6 w-6 text-accent-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h3 className="font-bold text-foreground mb-1">
                        {maintenance.title}
                      </h3>
                      <p className="text-sm text-foreground-secondary mb-3">
                        <span className="font-semibold text-foreground">{maintenance.date}</span> • {maintenance.time}
                      </p>
                      <p className="text-foreground-secondary mb-2">
                        {maintenance.description}
                      </p>
                      <div className="inline-flex items-center gap-2 rounded-full bg-background px-3 py-1 text-sm">
                        <span className="text-foreground-secondary">Expected Impact:</span>
                        <span className="font-semibold text-foreground">{maintenance.impact}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Incident History */}
      <section className="bg-background-secondary py-12">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-black text-foreground mb-8">
            Recent Incidents
          </h2>
          <div className="space-y-4">
            {incidents.map((incident, index) => (
              <div
                key={index}
                className="rounded-lg border-2 border-neutral-300 bg-background p-6"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="mt-1 h-3 w-3 rounded-full bg-accent-green-500 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                      <h3 className="font-bold text-foreground">
                        {incident.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-sm text-foreground-secondary">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {incident.date}
                      </span>
                    </div>
                    <p className="text-foreground-secondary mb-3">
                      {incident.description}
                    </p>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <span className="inline-flex items-center gap-1 text-foreground-secondary">
                        <strong>Duration:</strong> {incident.duration}
                      </span>
                      <span className="inline-flex items-center gap-1 text-foreground-secondary">
                        <strong>Impact:</strong> {incident.impact}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-green-500 bg-opacity-20 px-2 py-0.5 font-semibold text-accent-green-500">
                        Resolved
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscribe to Updates */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl font-black text-foreground mb-4">
            Get Status Updates
          </h2>
          <p className="text-lg text-foreground-secondary mb-8">
            Subscribe to receive notifications about incidents and maintenance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 rounded-lg border-2 border-neutral-300 bg-background px-4 py-3 text-foreground placeholder-foreground-secondary focus:border-primary-500 focus:outline-none"
            />
            <button className="rounded-lg bg-primary-500 px-6 py-3 font-semibold text-foreground shadow-button transition-colors hover:bg-primary-600 whitespace-nowrap">
              Subscribe
            </button>
          </div>
          <p className="text-sm text-foreground-secondary mt-4">
            We&apos;ll only email you about service updates. No spam, ever.
          </p>
        </div>
      </section>

      {/* Footer */}
    </div>
  );
}
