'use client';

import Link from 'next/link';
import TrainerSidebar from '@/components/TrainerSidebar';
import DashboardLoading from '@/components/DashboardLoading';
import { useRoleGuard } from '@/hooks/useRequireAuth';

export default function TrainerDashboard() {
  const { user, isLoading, isAuthorized } = useRoleGuard('TRAINER');

  if (isLoading) return <DashboardLoading />;
  if (!isAuthorized) return null;
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
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
      color: 'bg-accent-blue-100',
    },
    {
      label: 'Active Clients',
      value: trainerData.activeClients.toString(),
      subtext: `${trainerData.totalClients} total clients`,
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>),
      color: 'bg-primary-100',
    },
    {
      label: 'This Week Earnings',
      value: '$1,440',
      subtext: '18 sessions completed',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
      color: 'bg-accent-yellow-100',
    },
    {
      label: 'Avg. Rating',
      value: trainerData.rating.toFixed(1),
      subtext: 'Based on 156 reviews',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>),
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
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      time: '11:30 AM',
      client: 'Sarah Johnson',
      type: 'HIIT',
      duration: '45 min',
      status: 'upcoming',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      time: '2:00 PM',
      client: 'Mike Wilson',
      type: 'CrossFit',
      duration: '60 min',
      status: 'completed',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      time: '4:00 PM',
      client: 'Emily Davis',
      type: 'Strength Training',
      duration: '45 min',
      status: 'completed',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
  ];

  // Recent client progress
  const clientProgress = [
    {
      name: 'John Doe',
      goal: 'Muscle Gain',
      progress: 75,
      lastSession: '1 day ago',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      name: 'Sarah Johnson',
      goal: 'Weight Loss',
      progress: 60,
      lastSession: '2 days ago',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      name: 'Mike Wilson',
      goal: 'Strength',
      progress: 85,
      lastSession: 'Today',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      name: 'Emily Davis',
      goal: 'Endurance',
      progress: 70,
      lastSession: 'Today',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
  ];

  // Quick actions
  const quickActions = [
    {
      label: 'Create Workout Plan',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>),
      href: '/dashboard/trainer/workouts/new',
      color: 'bg-primary-500',
    },
    {
      label: 'View All Clients',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>),
      href: '/dashboard/trainer/clients',
      color: 'bg-accent-blue-500',
    },
    {
      label: 'Check Schedule',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
      href: '/dashboard/trainer/sessions',
      color: 'bg-accent-yellow-500',
    },
    {
      label: 'Exercise Library',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>),
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
                Welcome back, {trainerData.name}!
              </h1>
              <p className="text-foreground-secondary">
                {trainerData.specialties.join(' • ')} • {trainerData.totalSessions} sessions completed
              </p>
            </div>
            <Link
              href="/dashboard/trainer/settings"
              className="inline-flex h-10 items-center justify-center border border-neutral-200 bg-background px-6 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-50"
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
              className="bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl"
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center  ${stat.color} text-2xl`}>
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
                className={`group  ${action.color} p-6 text-center shadow-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
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
            <div className="bg-background p-6 shadow-card">
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
            <div className="bg-background p-6 shadow-card">
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
                      <span className=" bg-primary-100 px-2 py-1 text-xs font-semibold text-primary-700 flex-shrink-0">
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
