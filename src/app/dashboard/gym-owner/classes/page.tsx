'use client';

import { useState } from 'react';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function GymOwnerClassesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const classes = [
    {
      id: 1,
      name: 'Morning Yoga',
      instructor: 'Sarah Johnson',
      schedule: 'Mon, Wed, Fri - 7:00 AM',
      duration: '60 min',
      capacity: 20,
      enrolled: 15,
      status: 'active',
    },
    {
      id: 2,
      name: 'HIIT Bootcamp',
      instructor: 'Mike Davis',
      schedule: 'Tue, Thu - 6:00 PM',
      duration: '45 min',
      capacity: 25,
      enrolled: 22,
      status: 'active',
    },
    {
      id: 3,
      name: 'Spin Class',
      instructor: 'Emily Brown',
      schedule: 'Daily - 5:30 PM',
      duration: '50 min',
      capacity: 30,
      enrolled: 28,
      status: 'active',
    },
    {
      id: 4,
      name: 'Pilates',
      instructor: 'Lisa Martinez',
      schedule: 'Mon, Wed - 10:00 AM',
      duration: '60 min',
      capacity: 15,
      enrolled: 8,
      status: 'active',
    },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-black text-foreground">Classes & Schedules</h1>
              <p className="text-foreground/60 mt-1">Manage fitness classes and instructor schedules</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="h-12 px-6 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Class
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total Classes</p>
              <p className="text-3xl font-black text-foreground mt-2">{classes.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total Enrollments</p>
              <p className="text-3xl font-black text-foreground mt-2">
                {classes.reduce((sum, c) => sum + c.enrolled, 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Average Attendance</p>
              <p className="text-3xl font-black text-foreground mt-2">
                {Math.round((classes.reduce((sum, c) => sum + (c.enrolled/c.capacity * 100), 0) / classes.length))}%
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Active Instructors</p>
              <p className="text-3xl font-black text-foreground mt-2">
                {new Set(classes.map(c => c.instructor)).size}
              </p>
            </div>
          </div>

          {/* Classes List */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Class Name</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Instructor</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Schedule</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Duration</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Capacity</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Enrolled</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {classes.map((classItem) => {
                    const utilizationPercent = (classItem.enrolled / classItem.capacity) * 100;
                    return (
                      <tr key={classItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">{classItem.name}</p>
                        </td>
                        <td className="px-6 py-4 text-foreground/60">{classItem.instructor}</td>
                        <td className="px-6 py-4 text-foreground/60">{classItem.schedule}</td>
                        <td className="px-6 py-4 text-foreground/60">{classItem.duration}</td>
                        <td className="px-6 py-4 font-semibold text-foreground">{classItem.capacity}</td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-foreground">{classItem.enrolled}/{classItem.capacity}</p>
                            <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  utilizationPercent >= 90 ? 'bg-red-500' :
                                  utilizationPercent >= 70 ? 'bg-accent-yellow-500' :
                                  'bg-primary-500'
                                }`}
                                style={{ width: `${utilizationPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                            {classItem.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button className="text-accent-blue-500 hover:text-accent-blue-700 text-sm font-medium">
                              Edit
                            </button>
                            <button className="text-red-500 hover:text-red-700 text-sm font-medium">
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Class Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-black text-foreground mb-6">Create New Class</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">Class Name</label>
                    <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500" placeholder="e.g., Morning Yoga" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">Instructor</label>
                      <select className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500">
                        <option>Select instructor...</option>
                        <option>Sarah Johnson</option>
                        <option>Mike Davis</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground/70 mb-2">Duration</label>
                      <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500" placeholder="60 min" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">Schedule</label>
                    <input type="text" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500" placeholder="Mon, Wed, Fri - 7:00 AM" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground/70 mb-2">Capacity</label>
                    <input type="number" className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500" placeholder="20" />
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-foreground font-semibold rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button className="flex-1 px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600">
                    Create Class
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
