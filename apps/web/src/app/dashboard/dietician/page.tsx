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
      icon: '📋',
      color: 'bg-accent-purple-100',
    },
    {
      label: 'Active Clients',
      value: dieticianData.activeClients.toString(),
      subtext: `${dieticianData.totalClients} total clients`,
      icon: '👥',
      color: 'bg-primary-100',
    },
    {
      label: 'This Week Earnings',
      value: '$1,760',
      subtext: '22 consultations completed',
      icon: '💰',
      color: 'bg-accent-yellow-100',
    },
    {
      label: 'Avg. Rating',
      value: dieticianData.rating.toFixed(1),
      subtext: 'Based on 189 reviews',
      icon: '⭐',
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
      avatar: '👩',
    },
    {
      time: '10:30 AM',
      client: 'John Doe',
      type: 'Sports Nutrition',
      duration: '60 min',
      status: 'upcoming',
      avatar: '👨',
    },
    {
      time: '1:00 PM',
      client: 'Mike Wilson',
      type: 'Meal Plan Review',
      duration: '30 min',
      status: 'completed',
      avatar: '👨',
    },
    {
      time: '3:00 PM',
      client: 'Emily Davis',
      type: 'Initial Consultation',
      duration: '60 min',
      status: 'completed',
      avatar: '👩',
    },
    {
      time: '5:00 PM',
      client: 'James Brown',
      type: 'Follow-up',
      duration: '30 min',
      status: 'completed',
      avatar: '👨',
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
      avatar: '👩',
    },
    {
      name: 'John Doe',
      goal: 'Muscle Gain',
      progress: 55,
      currentWeight: '170 lbs',
      targetWeight: '185 lbs',
      avatar: '👨',
    },
    {
      name: 'Mike Wilson',
      goal: 'Maintenance',
      progress: 90,
      currentWeight: '175 lbs',
      targetWeight: '175 lbs',
      avatar: '👨',
    },
    {
      name: 'Emily Davis',
      goal: 'Weight Loss',
      progress: 40,
      currentWeight: '160 lbs',
      targetWeight: '140 lbs',
      avatar: '👩',
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
      icon: '🍽️',
      href: '/dashboard/dietician/meal-plans/new',
      color: 'bg-primary-500',
    },
    {
      label: 'View All Clients',
      icon: '👥',
      href: '/dashboard/dietician/clients',
      color: 'bg-accent-purple-500',
    },
    {
      label: 'Check Schedule',
      icon: '📅',
      href: '/dashboard/dietician/consultations',
      color: 'bg-accent-yellow-500',
    },
    {
      label: 'Recipe Library',
      icon: '📚',
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
                Welcome back, {dieticianData.name}! 🍎
              </h1>
              <p className="text-foreground-secondary">
                {dieticianData.credentials} • {dieticianData.specialties.join(' • ')} • {dieticianData.totalConsultations} consultations completed
              </p>
            </div>
            <Link
              href="/dashboard/dietician/settings"
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
            <div className="rounded-2xl bg-background p-6 shadow-card">
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
                        <p className="text-xs text-foreground-tertiary">{client.currentWeight} → {client.targetWeight}</p>
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
              <div key={index} className="rounded-2xl bg-background p-6 shadow-card transition-all duration-300 hover:shadow-xl">
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
