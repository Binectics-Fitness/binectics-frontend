'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function EditClassPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  // Mock existing class data
  const existingClass = {
    id: classId,
    name: 'Morning Yoga',
    instructor: 'Sarah Johnson',
    description: 'Start your day with a peaceful yoga session focused on flexibility and mindfulness.',
    capacity: 20,
    duration: 60,
    location: 'Studio A',
    level: 'All Levels',
    equipment: 'Yoga mat, blocks, straps (provided)',
    days: ['Monday', 'Wednesday', 'Friday'],
    time: '07:00',
  };

  const [formData, setFormData] = useState({
    name: existingClass.name,
    instructor: existingClass.instructor,
    description: existingClass.description,
    capacity: existingClass.capacity.toString(),
    duration: existingClass.duration.toString(),
    location: existingClass.location,
    level: existingClass.level,
    equipment: existingClass.equipment,
    days: existingClass.days,
    time: existingClass.time,
  });

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Redirect back to class detail
    router.push(`/dashboard/gym-owner/classes/${classId}`);
  };

  const toggleDay = (day: string) => {
    if (formData.days.includes(day)) {
      setFormData({
        ...formData,
        days: formData.days.filter((d) => d !== day),
      });
    } else {
      setFormData({
        ...formData,
        days: [...formData.days, day],
      });
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="text-accent-blue-500 hover:text-accent-blue-700 font-medium mb-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Class
          </button>

          <h1 className="text-3xl font-black text-foreground mb-8">Edit Class</h1>

          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-card p-8">
            {/* Basic Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Basic Information</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="e.g., Morning Yoga"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Instructor *
                  </label>
                  <input
                    type="text"
                    value={formData.instructor}
                    onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="e.g., Sarah Johnson"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Level *
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    required
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="All Levels">All Levels</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Capacity *
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="20"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="60"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Location *
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="e.g., Studio A"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Equipment
                  </label>
                  <input
                    type="text"
                    value={formData.equipment}
                    onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="e.g., Yoga mat, blocks"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    placeholder="Describe the class..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Schedule</h2>
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Days of Week *
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {daysOfWeek.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.days.includes(day)
                            ? 'bg-accent-blue-500 text-white'
                            : 'bg-gray-100 text-foreground hover:bg-gray-200'
                        }`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-accent-blue-500 focus:outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border-2 border-gray-300 text-foreground font-semibold rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
