"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components";
import { contactSchema, type ContactFormData } from "@/lib/schemas/contact";

interface ContactFormProps {
  categories: Array<{ value: string; label: string }>;
}

export function ContactForm({ categories }: ContactFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      category: "general",
      message: "",
    },
  });
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (data: ContactFormData) => {
    // In production, this would send to the backend
    setSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      reset();
      setSubmitted(false);
    }, 3000);
  };

  if (submitted) {
    return (
      <div className="rounded-(--r-3) border-2 border-signal/30 bg-signal-soft p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-signal-soft">
          <svg
            className="h-8 w-8 text-signal"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-xl font-bold text-signal-ink">
          Message sent successfully
        </h3>
        <p className="text-signal-ink">
          We&apos;ve received your message and will respond within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Input
          label="Your Name"
          type="text"
          {...register("name")}
          error={errors.name?.message}
          placeholder="John Doe"
        />
        <Input
          label="Email Address"
          type="email"
          {...register("email")}
          error={errors.email?.message}
          placeholder="john@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="category"
          className="mb-2 block text-sm font-medium text-fg"
        >
          Category
        </label>
        <select
          id="category"
          {...register("category")}
          className="w-full rounded-(--r-2) border border-border bg-bg px-4 py-3 text-fg transition-colors focus:border-signal focus:outline-none focus:ring-2 focus-visible:ring-signal/20"
        >
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Subject"
        type="text"
        {...register("subject")}
        error={errors.subject?.message}
        placeholder="How can we help you?"
      />

      <div>
        <label
          htmlFor="message"
          className="mb-2 block text-sm font-medium text-fg"
        >
          Message <span className="text-danger">*</span>
        </label>
        <textarea
          id="message"
          rows={6}
          {...register("message")}
          placeholder="Tell us more about your inquiry..."
          className={`w-full rounded-(--r-2) border ${
            errors.message
              ? "border-danger focus:border-danger focus:ring-danger/20"
              : "border-border focus:border-signal focus-visible:ring-signal/20"
          } bg-bg px-4 py-3 text-fg transition-colors focus:outline-none focus:ring-2`}
        />
        {errors.message && (
          <p className="mt-1 text-sm text-danger">{errors.message.message}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full rounded-(--r-2) bg-signal px-6 py-3 font-semibold text-bg transition-colors hover:bg-signal/90 focus:outline-none focus:ring-2 focus-visible:ring-signal/50"
      >
        Send Message
      </button>

      <p className="text-center text-sm text-fg-2">
        We typically respond within 24 hours during business days
      </p>
    </form>
  );
}
