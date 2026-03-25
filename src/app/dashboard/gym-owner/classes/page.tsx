"use client";

import { useState } from "react";
import GymOwnerSidebar from "@/components/GymOwnerSidebar";
import { useConfirmationModal } from "@/hooks/useConfirmationModal";
import { showAlert } from "@/lib/ui/dialogs";

export default function GymOwnerClassesPage() {
  const { requestConfirmation, confirmationModal } = useConfirmationModal();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [classList, setClassList] = useState([
    {
      id: 1,
      name: "Morning Yoga",
      instructor: "Sarah Johnson",
      schedule: "Mon, Wed, Fri - 7:00 AM",
      duration: "60 min",
      capacity: 20,
      enrolled: 15,
      status: "active",
    },
    {
      id: 2,
      name: "HIIT Bootcamp",
      instructor: "Mike Davis",
      schedule: "Tue, Thu - 6:00 PM",
      duration: "45 min",
      capacity: 25,
      enrolled: 22,
      status: "active",
    },
    {
      id: 3,
      name: "Spin Class",
      instructor: "Emily Brown",
      schedule: "Daily - 5:30 PM",
      duration: "50 min",
      capacity: 30,
      enrolled: 28,
      status: "active",
    },
    {
      id: 4,
      name: "Pilates",
      instructor: "Lisa Martinez",
      schedule: "Mon, Wed - 10:00 AM",
      duration: "60 min",
      capacity: 15,
      enrolled: 8,
      status: "active",
    },
  ]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructor: "",
    category: "Strength Training",
    schedule: {
      days: [] as string[],
      startTime: "",
      endTime: "",
    },
    duration: "",
    capacity: "",
    price: "",
    startDate: "",
    endDate: "",
  });

  const categories = [
    "Strength Training",
    "Cardio",
    "Yoga",
    "Pilates",
    "HIIT",
    "Cycling",
    "Boxing",
    "Dance",
    "CrossFit",
    "Swimming",
    "Martial Arts",
    "Other",
  ];

  const daysOfWeek = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDayToggle = (day: string) => {
    const days = formData.schedule.days.includes(day)
      ? formData.schedule.days.filter((d) => d !== day)
      : [...formData.schedule.days, day];
    setFormData({ ...formData, schedule: { ...formData.schedule, days } });
  };

  const handleScheduleChange = (
    field: "startTime" | "endTime",
    value: string,
  ) => {
    setFormData({
      ...formData,
      schedule: { ...formData.schedule, [field]: value },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await showAlert("Class created successfully!");
      setShowCreateModal(false);
      setFormData({
        name: "",
        description: "",
        instructor: "",
        category: "Strength Training",
        schedule: { days: [], startTime: "", endTime: "" },
        duration: "",
        capacity: "",
        price: "",
        startDate: "",
        endDate: "",
      });
    } catch (error) {
      console.error("Error creating class:", error);
      await showAlert("Failed to create class. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClass = (classId: number, className: string) => {
    requestConfirmation({
      title: "Cancel class?",
      description: `Cancel \"${className}\"? This action cannot be undone.`,
      confirmLabel: "Cancel Class",
      onConfirm: async () => {
        setClassList(classList.filter((c) => c.id !== classId));
        await showAlert("Class cancelled successfully");
      },
    });
  };

  const classes = classList;

  return (
    <div className="flex min-h-screen bg-background">
      <GymOwnerSidebar />
      <main className="md:ml-64 flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                Classes & Schedules
              </h1>
              <p className="text-foreground/60 mt-1">
                Manage fitness classes and instructor schedules
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-accent-blue-500 px-6 font-semibold text-white hover:bg-accent-blue-600 sm:w-auto"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Class
            </button>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-6">
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">
                Total Classes
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {classes.length}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">
                Total Enrollments
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {classes.reduce((sum, c) => sum + c.enrolled, 0)}
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">
                Average Attendance
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {Math.round(
                  classes.reduce(
                    (sum, c) => sum + (c.enrolled / c.capacity) * 100,
                    0,
                  ) / classes.length,
                )}
                %
              </p>
            </div>
            <div className="bg-white rounded-xl shadow-card p-6">
              <p className="text-sm font-medium text-foreground/60">
                Active Instructors
              </p>
              <p className="text-3xl font-black text-foreground mt-2">
                {new Set(classes.map((c) => c.instructor)).size}
              </p>
            </div>
          </div>

          <div className="md:hidden space-y-3 mb-6">
            {classes.map((classItem) => {
              const utilizationPercent =
                (classItem.enrolled / classItem.capacity) * 100;
              return (
                <div
                  key={classItem.id}
                  className="rounded-xl border border-gray-100 bg-white p-4 shadow-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        {classItem.name}
                      </p>
                      <p className="mt-0.5 text-sm text-foreground/60">
                        {classItem.instructor}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                      {classItem.status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                    <p className="text-foreground/60">{classItem.schedule}</p>
                    <p className="text-foreground/60">{classItem.duration}</p>
                    <p className="text-foreground/60">
                      Capacity:{" "}
                      <span className="font-medium text-foreground">
                        {classItem.capacity}
                      </span>
                    </p>
                    <p className="text-foreground/60">
                      Enrolled:{" "}
                      <span className="font-medium text-foreground">
                        {classItem.enrolled}
                      </span>
                    </p>
                  </div>

                  <div className="mt-2 h-2 rounded-full bg-gray-200">
                    <div
                      className={`h-full rounded-full ${
                        utilizationPercent >= 90
                          ? "bg-red-500"
                          : utilizationPercent >= 70
                            ? "bg-accent-yellow-500"
                            : "bg-primary-500"
                      }`}
                      style={{ width: `${utilizationPercent}%` }}
                    />
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button className="flex-1 rounded-lg border border-accent-blue-200 px-3 py-2 text-sm font-medium text-accent-blue-600 hover:bg-accent-blue-50">
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        handleDeleteClass(classItem.id, classItem.name)
                      }
                      className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block bg-white rounded-xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Class Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Instructor
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Schedule
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Duration
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Capacity
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Enrolled
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {classes.map((classItem) => {
                    const utilizationPercent =
                      (classItem.enrolled / classItem.capacity) * 100;
                    return (
                      <tr key={classItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-foreground">
                            {classItem.name}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-foreground/60">
                          {classItem.instructor}
                        </td>
                        <td className="px-6 py-4 text-foreground/60">
                          {classItem.schedule}
                        </td>
                        <td className="px-6 py-4 text-foreground/60">
                          {classItem.duration}
                        </td>
                        <td className="px-6 py-4 font-semibold text-foreground">
                          {classItem.capacity}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-foreground">
                              {classItem.enrolled}/{classItem.capacity}
                            </p>
                            <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                              <div
                                className={`h-full rounded-full ${
                                  utilizationPercent >= 90
                                    ? "bg-red-500"
                                    : utilizationPercent >= 70
                                      ? "bg-accent-yellow-500"
                                      : "bg-primary-500"
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
                            <button
                              onClick={() =>
                                handleDeleteClass(classItem.id, classItem.name)
                              }
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
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

          {showCreateModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-4 sm:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-black text-foreground mb-6">
                  Create New Class
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-2">
                          Class Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                          placeholder="e.g., Morning Yoga Flow"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-2">
                          Description
                        </label>
                        <textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                          placeholder="Describe the class..."
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground/70 mb-2">
                            Category <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground/70 mb-2">
                            Instructor <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="instructor"
                            value={formData.instructor}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                            placeholder="Instructor name"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">
                      Schedule
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-2">
                          Days of Week <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {daysOfWeek.map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleDayToggle(day)}
                              className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${formData.schedule.days.includes(day) ? "bg-accent-blue-500 text-foreground" : "bg-gray-100 text-foreground/60 hover:bg-gray-200"}`}
                            >
                              {day.substring(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground/70 mb-2">
                            Start Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={formData.schedule.startTime}
                            onChange={(e) =>
                              handleScheduleChange("startTime", e.target.value)
                            }
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground/70 mb-2">
                            End Time <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="time"
                            value={formData.schedule.endTime}
                            onChange={(e) =>
                              handleScheduleChange("endTime", e.target.value)
                            }
                            required
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground/70 mb-2">
                            Duration (min)
                          </label>
                          <input
                            type="number"
                            name="duration"
                            value={formData.duration}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                            placeholder="60"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground/70 mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={formData.startDate}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-foreground/70 mb-2">
                            End Date (Optional)
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={formData.endDate}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-foreground mb-4">
                      Capacity & Pricing
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-2">
                          Maximum Capacity{" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="capacity"
                          value={formData.capacity}
                          onChange={handleInputChange}
                          required
                          min="1"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                          placeholder="20"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground/70 mb-2">
                          Price per Session ($)
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={formData.price}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-blue-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-6 py-3 bg-gray-200 text-foreground font-semibold rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 px-6 py-3 bg-accent-blue-500 text-white font-semibold rounded-lg hover:bg-accent-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? "Creating..." : "Create Class"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
      {confirmationModal}
    </div>
  );
}
