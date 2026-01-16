'use client';

import { useState } from 'react';
import GymOwnerSidebar from '@/components/GymOwnerSidebar';

export default function GymOwnerFacilityPage() {
  const facilities = [
    { id: 1, name: 'Free Weights', category: 'Equipment', status: 'Available', condition: 'Excellent' },
    { id: 2, name: 'Cardio Machines', category: 'Equipment', status: 'Available', condition: 'Good' },
    { id: 3, name: 'Yoga Studio', category: 'Room', status: 'Available', condition: 'Excellent' },
    { id: 4, name: 'Sauna', category: 'Amenity', status: 'Maintenance', condition: 'Fair' },
    { id: 5, name: 'Locker Rooms', category: 'Amenity', status: 'Available', condition: 'Good' },
    { id: 6, name: 'Showers', category: 'Amenity', status: 'Available', condition: 'Excellent' },
    { id: 7, name: 'Juice Bar', category: 'Service', status: 'Available', condition: 'Excellent' },
    { id: 8, name: 'Parking', category: 'Amenity', status: 'Available', condition: 'Good' },
  ];

  const amenities = [
    { name: 'WiFi', enabled: true },
    { name: 'Towel Service', enabled: true },
    { name: 'Personal Training', enabled: true },
    { name: 'Group Classes', enabled: true },
    { name: 'Childcare', enabled: false },
    { name: '24/7 Access', enabled: true },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="ml-64 flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-foreground">Facilities & Amenities</h1>
            <p className="text-foreground/60 mt-1">Manage your gym's facilities and amenities</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Total Facilities</p>
              <p className="text-3xl font-black text-foreground mt-2">{facilities.length}</p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Available</p>
              <p className="text-3xl font-black text-primary-500 mt-2">
                {facilities.filter(f => f.status === 'Available').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Under Maintenance</p>
              <p className="text-3xl font-black text-accent-yellow-500 mt-2">
                {facilities.filter(f => f.status === 'Maintenance').length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">Active Amenities</p>
              <p className="text-3xl font-black text-foreground mt-2">
                {amenities.filter(a => a.enabled).length}
              </p>
            </div>
          </div>

          {/* Amenities Checklist */}
          <div className="bg-white rounded-xl shadow-card p-6 mb-8">
            <h3 className="text-lg font-bold text-foreground mb-4">Amenities</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {amenities.map((amenity) => (
                <div key={amenity.name} className="flex items-center gap-3 p-3 border-2 border-gray-200 rounded-lg">
                  <input
                    type="checkbox"
                    checked={amenity.enabled}
                    readOnly
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                  />
                  <span className="font-medium text-foreground">{amenity.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Facilities Table */}
          <div className="bg-white rounded-xl shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-foreground">Facilities</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Facility</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Category</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Condition</th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {facilities.map((facility) => (
                    <tr key={facility.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-semibold text-foreground">{facility.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                          {facility.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          facility.status === 'Available'
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {facility.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-foreground/60">{facility.condition}</td>
                      <td className="px-6 py-4">
                        <button className="text-accent-blue-500 hover:text-accent-blue-700 text-sm font-medium">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
