'use client';

import { useState } from 'react';
import Link from 'next/link';
import DieticianSidebar from '@/components/DieticianSidebar';

export default function DieticianDashboard() {
  // Mock dietician data
  const dieticianData = {
    name: 'Dr. Emily Wilson',
    credentials: 'RD, CDN, CSSD',
    specialties: ['Sports Nutrition', 'Weight Management', 'Meal Planning'],
    rating: 4.9,
    totalClients: 45,
    activeClients: 38,
    consultationsThisWeek: 22,
    totalConsultations: 315,
  };

  // Stats cards
  const stats = [
    {
      label: 'Consultations Today',
      value: '5',
      subtext: '3 completed, 2 upcoming',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>),
      color: 'bg-accent-purple-100',
    },
    {
      label: 'Active Clients',
      value: dieticianData.activeClients.toString(),
      subtext: `${dieticianData.totalClients} total clients`,
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>),
      color: 'bg-primary-100',
    },
    {
      label: 'This Week Earnings',
      value: '$1,760',
      subtext: '22 consultations completed',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
      color: 'bg-accent-yellow-100',
    },
    {
      label: 'Avg. Rating',
      value: dieticianData.rating.toFixed(1),
      subtext: 'Based on 189 reviews',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>),
      color: 'bg-accent-blue-100',
    },
  ];

  // Today's consultations
  const todayConsultations = [
    {
      time: '9:00 AM',
      client: 'Sarah Johnson',
      type: 'Weight Loss Plan',
      duration: '45 min',
      status: 'upcoming',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      time: '10:30 AM',
      client: 'John Doe',
      type: 'Sports Nutrition',
      duration: '60 min',
      status: 'upcoming',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      time: '1:00 PM',
      client: 'Mike Wilson',
      type: 'Meal Plan Review',
      duration: '30 min',
      status: 'completed',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      time: '3:00 PM',
      client: 'Emily Davis',
      type: 'Initial Consultation',
      duration: '60 min',
      status: 'completed',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      time: '5:00 PM',
      client: 'James Brown',
      type: 'Follow-up',
      duration: '30 min',
      status: 'completed',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
  ];

  // Client nutrition progress
  const clientProgress = [
    {
      name: 'Sarah Johnson',
      goal: 'Weight Loss',
      progress: 70,
      currentWeight: '145 lbs',
      targetWeight: '130 lbs',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      name: 'John Doe',
      goal: 'Muscle Gain',
      progress: 55,
      currentWeight: '170 lbs',
      targetWeight: '185 lbs',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      name: 'Mike Wilson',
      goal: 'Maintenance',
      progress: 90,
      currentWeight: '175 lbs',
      targetWeight: '175 lbs',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
    {
      name: 'Emily Davis',
      goal: 'Weight Loss',
      progress: 40,
      currentWeight: '160 lbs',
      targetWeight: '140 lbs',
      avatar: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>),
    },
  ];

  // Recent meal plans
  const recentMealPlans = [
    {
      name: 'High Protein Weight Loss',
      client: 'Sarah Johnson',
      calories: '1,500 kcal',
      macros: 'P: 40% C: 30% F: 30%',
      duration: '4 weeks',
    },
    {
      name: 'Muscle Building Plan',
      client: 'John Doe',
      calories: '2,800 kcal',
      macros: 'P: 30% C: 45% F: 25%',
      duration: '8 weeks',
    },
    {
      name: 'Balanced Maintenance',
      client: 'Mike Wilson',
      calories: '2,200 kcal',
      macros: 'P: 25% C: 50% F: 25%',
      duration: '12 weeks',
    },
  ];

  // Quick actions
  const quickActions = [
    {
      label: 'Create Meal Plan',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m0 0a2 2 0 100 4 2 2 0 000-4z" /></svg>),
      href: '/dashboard/dietician/meal-plans/new',
      color: 'bg-primary-500',
    },
    {
      label: 'View All Clients',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>),
      href: '/dashboard/dietician/clients',
      color: 'bg-accent-purple-500',
    },
    {
      label: 'Check Schedule',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
      href: '/dashboard/dietician/consultations',
      color: 'bg-accent-yellow-500',
    },
    {
      label: 'Recipe Library',
      icon: (<svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>),
      href: '/dashboard/dietician/recipes',
      color: 'bg-accent-blue-500',
    },
  ];

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <DieticianSidebar />

      {/* Main Content */}
      <main className="ml-64 flex-1 p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-3xl font-black text-foreground mb-2">
                Welcome back, {dieticianData.name}!
              </h1>
              <p className="text-foreground-secondary">
                {dieticianData.credentials} • {dieticianData.specialties.join(' • ')} • {dieticianData.totalConsultations} consultations completed
              </p>
            </div>
            <Link
              href="/dashboard/dietician/settings"
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
          {/* Today's Consultations */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-black text-foreground">
                Today's Consultations
              </h2>
              <Link
                href="/dashboard/dietician/consultations"
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            <div className="bg-background p-6 shadow-card">
              <ul className="space-y-4">
                {todayConsultations.map((consultation, index) => (
                  <li key={index} className="flex items-center gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-2xl flex-shrink-0">
                      {consultation.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">{consultation.client}</p>
                      <p className="text-sm text-foreground-secondary">{consultation.type} • {consultation.duration}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-foreground">{consultation.time}</p>
                      <span className={`inline-block mt-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        consultation.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {consultation.status === 'completed' ? 'Done' : 'Upcoming'}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Client Nutrition Progress */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-black text-foreground">
                Client Progress
              </h2>
              <Link
                href="/dashboard/dietician/progress"
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
                        <p className="text-xs text-foreground-tertiary">{client.currentWeight} → {client.targetWeight}</p>
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

        {/* Recent Meal Plans */}
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-black text-foreground">
              Recent Meal Plans
            </h2>
            <Link
              href="/dashboard/dietician/meal-plans"
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View All
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recentMealPlans.map((plan, index) => (
              <div key={index} className="bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl">
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-foreground-secondary mb-4">{plan.client}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-tertiary">Calories</span>
                    <span className="font-semibold text-foreground">{plan.calories}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-tertiary">Macros</span>
                    <span className="font-semibold text-foreground">{plan.macros}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-tertiary">Duration</span>
                    <span className="font-semibold text-foreground">{plan.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
