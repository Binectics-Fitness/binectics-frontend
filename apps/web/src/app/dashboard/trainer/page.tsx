'use client';

import { useState } from 'react';
import Link from 'next/link';
import TrainerSidebar from '@/components/TrainerSidebar';

export default function TrainerDashboard() {
  // Mock trainer data
  const trainerData = {
    name: 'Mike Chen',
    specialties: ['Strength Training', 'CrossFit', 'HIIT'],
    rating: 4.9,
    totalClients: 32,
    activeClients: 28,
    sessionsThisWeek: 18,
    totalSessions: 247,
  };

  // Stats cards
  const stats = [
    {
      label: 'Sessions Today',
      value: '4',
      subtext: '2 completed, 2 upcoming',
      icon: '📅',
      color: 'bg-accent-blue-100',
    },
    {
      label: 'Active Clients',
      value: trainerData.activeClients.toString(),
      subtext: `${trainerData.totalClients} total clients`,
      icon: '👥',
      color: 'bg-primary-100',
    },
    {
      label: 'This Week Earnings',
      value: '$1,440',
      subtext: '18 sessions completed',
      icon: '💰',
      color: 'bg-accent-yellow-100',
    },
    {
      label: 'Avg. Rating',
      value: trainerData.rating.toFixed(1),
      subtext: 'Based on 156 reviews',
      icon: '⭐',
      color: 'bg-accent-purple-100',
    },
  ];

  // Today's sessions
  const todaySessions = [
    {
      time: '10:00 AM',
      client: 'John Doe',
      type: 'Strength Training',
      duration: '60 min',
      status: 'upcoming',
      avatar: '👨',
    },
    {
      time: '11:30 AM',
      client: 'Sarah Johnson',
      type: 'HIIT',
      duration: '45 min',
      status: 'upcoming',
      avatar: '👩',
    },
    {
      time: '2:00 PM',
      client: 'Mike Wilson',
      type: 'CrossFit',
      duration: '60 min',
      status: 'completed',
      avatar: '👨',
    },
    {
      time: '4:00 PM',
      client: 'Emily Davis',
      type: 'Strength Training',
      duration: '45 min',
      status: 'completed',
      avatar: '👩',
    },
  ];

  // Recent client progress
  const clientProgress = [
    {
      name: 'John Doe',
      goal: 'Muscle Gain',
      progress: 75,
      lastSession: '1 day ago',
      avatar: '👨',
    },
    {
      name: 'Sarah Johnson',
      goal: 'Weight Loss',
      progress: 60,
      lastSession: '2 days ago',
      avatar: '👩',
    },
    {
      name: 'Mike Wilson',
      goal: 'Strength',
      progress: 85,
      lastSession: 'Today',
      avatar: '👨',
    },
    {
      name: 'Emily Davis',
      goal: 'Endurance',
      progress: 70,
      lastSession: 'Today',
      avatar: '👩',
    },
  ];

  // Quick actions
  const quickActions = [
    {
      label: 'Create Workout Plan',
      icon: '💪',
      href: '/dashboard/trainer/workouts/new',
      color: 'bg-primary-500',
    },
    {
      label: 'View All Clients',
      icon: '👥',
      href: '/dashboard/trainer/clients',
      color: 'bg-accent-blue-500',
    },
    {
      label: 'Check Schedule',
      icon: '📅',
      href: '/dashboard/trainer/sessions',
      color: 'bg-accent-yellow-500',
    },
    {
      label: 'Exercise Library',
      icon: '📚',
      href: '/dashboard/trainer/exercises',
      color: 'bg-accent-purple-500',
    },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <TrainerSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-3xl font-black text-foreground mb-2">
                Welcome back, {trainerData.name}! 💪
              </h1>
              <p className="text-foreground-secondary">
                {trainerData.specialties.join(' • ')} • {trainerData.totalSessions} sessions completed
              </p>
            </div>
            <Link
              href="/dashboard/trainer/settings"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-200 bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-50"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-2xl bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${stat.color} text-2xl`}>
                {stat.icon}
              </div>
              <p className="font-display text-2xl font-black text-foreground mb-1">{stat.value}</p>
              <p className="text-sm text-foreground-secondary mb-1">{stat.label}</p>
              <p className="text-xs text-foreground-tertiary">{stat.subtext}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <section className="mb-8">
          <h2 className="font-display text-xl font-black text-foreground mb-4">
            Quick Actions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className={`group rounded-xl ${action.color} p-6 text-center shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
              >
                <div className="text-4xl mb-3">{action.icon}</div>
                <p className="font-semibold text-white">{action.label}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Today's Sessions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-black text-foreground">
                Today's Sessions
              </h2>
              <Link
                href="/dashboard/trainer/sessions"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            <div className="rounded-2xl bg-background p-6 shadow-card">
              <ul className="space-y-4">
                {todaySessions.map((session, index) => (
                  <li key={index} className="flex items-center gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-2xl flex-shrink-0">
                      {session.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{session.client}</p>
                      <p className="text-sm text-foreground-secondary">{session.type} • {session.duration}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-foreground">{session.time}</p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        session.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {session.status === 'completed' ? 'Done' : 'Upcoming'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Client Progress */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-black text-foreground">
                Client Progress
              </h2>
              <Link
                href="/dashboard/trainer/progress"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            <div className="rounded-2xl bg-background p-6 shadow-card">
              <ul className="space-y-5">
                {clientProgress.map((client, index) => (
                  <li key={index} className="pb-5 border-b border-neutral-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-xl flex-shrink-0">
                        {client.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{client.name}</p>
                        <p className="text-xs text-foreground-tertiary">{client.lastSession}</p>
                      </div>
                      <span className="rounded-full bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-700 flex-shrink-0">
                        {client.goal}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-foreground-secondary">Progress</span>
                        <span className="font-semibold text-foreground">{client.progress}%</span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all duration-300"
                          style={{ width: `${client.progress}%` }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
