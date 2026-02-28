"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  formsService,
  type Form,
  type FormQuestion,
  type CreateQuestionRequest,
  type UpdateFormRequest,
  QuestionType,
} from "@/lib/api/forms";
import DashboardLoading from "@/components/DashboardLoading";
import Breadcrumb from "@/components/Breadcrumb";
import PublishSuccessModal from "@/components/PublishSuccessModal";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { decodeObjectEntities } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Question type options
const QUESTION_TYPES = [
  { value: QuestionType.TEXT, label: "Short Text", icon: "📝" },
  { value: QuestionType.TEXTAREA, label: "Long Text", icon: "📄" },
  { value: QuestionType.MULTIPLE_CHOICE, label: "Multiple Choice", icon: "🔘" },
  { value: QuestionType.CHECKBOX, label: "Checkboxes", icon: "☑️" },
  { value: QuestionType.SELECT, label: "Dropdown", icon: "📋" },
  { value: QuestionType.NUMBER, label: "Number", icon: "🔢" },
  { value: QuestionType.DATE, label: "Date", icon: "📅" },
  { value: QuestionType.EMAIL, label: "Email", icon: "📧" },
  { value: QuestionType.PHONE, label: "Phone", icon: "📞" },
  { value: QuestionType.RATING, label: "Rating", icon: "⭐" },
];

// Sortable Question Item Component
interface SortableQuestionItemProps {
  question: FormQuestion;
  index: number;
  onEdit: (question: FormQuestion) => void;
  onDelete: (questionId: string) => void;
}

function SortableQuestionItem({
  question,
  index,
  onEdit,
  onDelete,
}: SortableQuestionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-xl shadow-card p-6"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors mt-3"
          title="Drag to reorder"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8h16M4 16h16"
            />
          </svg>
        </button>

        {/* Question Content */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">
              {QUESTION_TYPES.find((t) => t.value === question.type)?.icon ||
                "❓"}
            </span>
            <div>
              <h3 className="font-semibold text-foreground">
                {index + 1}. {question.label}
                {question.is_required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </h3>
              <p className="text-sm text-foreground-tertiary">
                {QUESTION_TYPES.find((t) => t.value === question.type)?.label}
              </p>
            </div>
          </div>
          {question.help_text && (
            <p className="text-sm text-foreground-secondary ml-11">
              {question.help_text}
            </p>
          )}
          {question.options && question.options.length > 0 && (
            <ul className="mt-3 ml-11 space-y-1">
              {question.options.map((opt, idx) => (
                <li key={idx} className="text-sm text-foreground-secondary">
                  • {opt.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(question)}
            className="p-2 text-primary-600 hover:bg-primary-50 rounded transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(question._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FormBuilderPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const formId = params.id as string;

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSettingsSaving, setIsSettingsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showFormSettings, setShowFormSettings] = useState(false);
  const [showBranding, setShowBranding] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<FormQuestion | null>(
    null,
  );

  const [formSettings, setFormSettings] = useState<UpdateFormRequest>({
    title: "",
    description: "",
    allow_multiple_submissions: false,
    require_authentication: true,
    custom_logo: "",
    custom_header_color: "",
    company_name: "",
    company_description: "",
  });

  // Question form state
  const [questionData, setQuestionData] = useState<CreateQuestionRequest>({
    type: QuestionType.TEXT,
    label: "",
    help_text: "",
    is_required: false,
    options: [],
    order_index: 0,
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Toast notification helper
  const showToast = (message: string, isError = false) => {
    if (typeof document === "undefined") return;
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.position = "fixed";
    toast.style.bottom = "1rem";
    toast.style.right = "1rem";
    toast.style.zIndex = "9999";
    toast.style.padding = "0.75rem 1rem";
    toast.style.borderRadius = "0.375rem";
    toast.style.fontSize = "0.875rem";
    toast.style.fontWeight = "500";
    toast.style.boxShadow =
      "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)";
    toast.style.backgroundColor = isError ? "#fef2f2" : "#ecfdf5"; // red-50 / green-50
    toast.style.color = isError ? "#b91c1c" : "#166534"; // red-700 / green-700
    toast.style.border = isError ? "1px solid #fecaca" : "1px solid #a7f3d0"; // red-200 / green-200
    document.body.appendChild(toast);
    window.setTimeout(() => {
      toast.remove();
    }, 3000);
  };

  // Handle drag end - reorder questions
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuestions((items) => {
        const oldIndex = items.findIndex((item) => item._id === active.id);
        const newIndex = items.findIndex((item) => item._id === over.id);

        const reordered = arrayMove(items, oldIndex, newIndex);

        // Recalculate order_index for all questions
        const updatedQuestions = reordered.map((q, index) => ({
          ...q,
          order_index: index,
        }));

        // Update backend with new order (batch update)
        void updateQuestionOrder(updatedQuestions);

        return updatedQuestions;
      });
    }
  };

  // Update question order in backend
  const updateQuestionOrder = async (reorderedQuestions: FormQuestion[]) => {
    // Prepare batch update payload
    const updates = reorderedQuestions.map((q) => ({
      question_id: q._id,
      order_index: q.order_index,
    }));

    try {
      const response = await formsService.updateQuestionOrder(formId, updates);
      if (!response.success) {
        console.error("Failed to update question order:", response.message);
        // Optionally reload to restore correct order
      }
    } catch (error) {
      console.error("Error updating question order:", error);
    }
  };

  const handleSaveSettings = async () => {
    setIsSettingsSaving(true);
    const response = await formsService.updateForm(formId, formSettings);
    if (response.success && response.data) {
      setForm(decodeObjectEntities(response.data));
      showToast("Form settings saved");
    } else {
      showToast(response.message || "Failed to save settings", true);
    }
    setIsSettingsSaving(false);
  };

  const loadFormData = async () => {
    setIsLoading(true);
    setError(null);

    const [formResponse, questionsResponse] = await Promise.all([
      formsService.getFormById(formId),
      formsService.getFormQuestions(formId),
    ]);

    if (formResponse.success && formResponse.data) {
      const f = decodeObjectEntities(formResponse.data);
      setForm(f);
      setFormSettings({
        title: f.title || "",
        description: f.description || "",
        allow_multiple_submissions: f.allow_multiple_submissions ?? false,
        require_authentication: f.require_authentication ?? true,
        custom_logo: f.custom_logo || "",
        custom_header_color: f.custom_header_color || "",
        company_name: f.company_name || "",
        company_description: f.company_description || "",
      });
    } else {
      setError(formResponse.message || "Failed to load form");
    }

    if (questionsResponse.success && questionsResponse.data) {
      setQuestions(decodeObjectEntities(questionsResponse.data));
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      void loadFormData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading, formId, router]);

  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionData({
      type: QuestionType.TEXT,
      label: "",
      help_text: "",
      is_required: false,
      options: [],
      order_index: questions.length,
    });
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (question: FormQuestion) => {
    setEditingQuestion(question);
    setQuestionData({
      type: question.type,
      label: question.label,
      help_text: question.help_text,
      is_required: question.is_required,
      options: question.options || [],
      order_index: question.order_index,
      min_value: question.min_value,
      max_value: question.max_value,
      min_length: question.min_length,
      max_length: question.max_length,
    });
    setShowQuestionModal(true);
  };

  const handleSaveQuestion = async () => {
    if (!questionData.label.trim()) {
      showToast("Question label is required", true);
      return;
    }

    // Validate options for choice-based questions
    const requiresOptions = [
      QuestionType.MULTIPLE_CHOICE,
      QuestionType.CHECKBOX,
      QuestionType.SELECT,
    ];
    if (
      requiresOptions.includes(questionData.type) &&
      (!questionData.options || questionData.options.length === 0)
    ) {
      showToast("Please add at least one option", true);
      return;
    }

    setIsSaving(true);

    let response;
    if (editingQuestion) {
      response = await formsService.updateQuestion(
        editingQuestion._id,
        questionData,
      );
    } else {
      response = await formsService.addQuestion(formId, questionData);
    }

    if (response.success) {
      await loadFormData();
      setShowQuestionModal(false);
    } else {
      showToast(response.message || "Failed to save question", true);
    }

    setIsSaving(false);
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) {
      return;
    }

    const response = await formsService.deleteQuestion(questionId);

    if (response.success) {
      setQuestions(questions.filter((q) => q._id !== questionId));
    } else {
      showToast(response.message || "Failed to delete question", true);
    }
  };

  const handlePublishForm = async () => {
    if (questions.length === 0) {
      showToast("Add at least one question before publishing", true);
      return;
    }

    const response = await formsService.publishForm(formId);

    if (response.success && response.data) {
      setForm(response.data);
      setShowPublishModal(true);
    } else {
      showToast(response.message || "Failed to publish form", true);
    }
  };

  const addOption = () => {
    setQuestionData({
      ...questionData,
      options: [...(questionData.options || []), { value: "", label: "" }],
    });
  };

  const updateOption = (
    index: number,
    field: "value" | "label",
    value: string,
  ) => {
    const options = [...(questionData.options || [])];
    options[index][field] = value;
    setQuestionData({ ...questionData, options });
  };

  const removeOption = (index: number) => {
    const options = [...(questionData.options || [])];
    options.splice(index, 1);
    setQuestionData({ ...questionData, options });
  };

  if (authLoading || isLoading) {
    return <DashboardLoading />;
  }

  if (!user || !form) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Forms", href: "/forms" },
            { label: "Edit Form", href: `/forms/${formId}/edit` },
          ]}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-black text-foreground mb-2">
              {form.title}
            </h1>
            <p className="text-foreground-secondary">
              {form.description || "Build your form by adding questions"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 text-sm font-semibold rounded ${
                form.is_published
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {form.is_published ? "Published" : "Draft"}
            </span>
            <button
              onClick={() => window.open(`/forms/${formId}/submit`, "_blank")}
              className="px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 transition-colors flex items-center gap-2 font-medium"
              title="Preview form in new tab"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              Preview
            </button>
            {!form.is_published && (
              <Button onClick={handlePublishForm}>Publish Form</Button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Questions List */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={questions.map((q) => q._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-4 mb-6">
              {questions.map((question, index) => (
                <SortableQuestionItem
                  key={question._id}
                  question={question}
                  index={index}
                  onEdit={handleEditQuestion}
                  onDelete={handleDeleteQuestion}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Add Question Button */}
        <button
          onClick={handleAddQuestion}
          className="w-full py-4 border-2 border-dashed border-neutral-300 rounded-xl text-foreground-secondary hover:border-primary-500 hover:text-primary-600 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Question
        </button>

        {/* Form Settings Panel */}
        <div className="mt-6 bg-white rounded-xl shadow-card overflow-hidden">
          <button
            type="button"
            onClick={() => setShowFormSettings(!showFormSettings)}
            className="w-full flex items-center justify-between p-5 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">⚙️</span>
              <div className="text-left">
                <p className="font-semibold text-foreground">Form Settings</p>
                <p className="text-sm text-foreground-secondary">
                  Edit title, description, branding and submission rules
                </p>
              </div>
            </div>
            <svg
              className={`w-5 h-5 text-foreground-secondary transition-transform ${showFormSettings ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showFormSettings && (
            <div className="border-t border-neutral-200 p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Form Title <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={formSettings.title || ""}
                  onChange={(e) =>
                    setFormSettings({ ...formSettings, title: e.target.value })
                  }
                  maxLength={255}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  value={formSettings.description || ""}
                  onChange={(e) =>
                    setFormSettings({
                      ...formSettings,
                      description: e.target.value,
                    })
                  }
                  maxLength={1000}
                />
              </div>

              {/* Submission Settings */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">
                      Allow Multiple Submissions
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      Users can submit more than one response
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formSettings.allow_multiple_submissions ?? false}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          allow_multiple_submissions: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">
                      Require Authentication
                    </p>
                    <p className="text-sm text-foreground-secondary">
                      Only logged-in users can submit
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formSettings.require_authentication ?? true}
                      onChange={(e) =>
                        setFormSettings({
                          ...formSettings,
                          require_authentication: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>

              {/* Branding Sub-section */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowBranding(!showBranding)}
                  className="w-full flex items-center justify-between p-4 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🎨</span>
                    <div className="text-left">
                      <p className="font-semibold text-foreground">Branding</p>
                      <p className="text-sm text-foreground-secondary">
                        Logo, company name, and header color
                      </p>
                    </div>
                  </div>
                  <svg
                    className={`w-5 h-5 text-foreground-secondary transition-transform ${showBranding ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showBranding && (
                  <div className="mt-4 space-y-4 p-4 border border-neutral-200 rounded-lg">
                    {/* Company Name */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Company / Brand Name
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., FitLife Nutrition"
                        value={formSettings.company_name || ""}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            company_name: e.target.value,
                          })
                        }
                        maxLength={255}
                      />
                    </div>

                    {/* Tagline */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Tagline / Description
                      </label>
                      <Input
                        type="text"
                        placeholder="e.g., Personalized nutrition for your goals"
                        value={formSettings.company_description || ""}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            company_description: e.target.value,
                          })
                        }
                        maxLength={500}
                      />
                    </div>

                    {/* Logo URL */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Logo URL
                      </label>
                      <Input
                        type="url"
                        placeholder="https://your-domain.com/logo.png"
                        value={formSettings.custom_logo || ""}
                        onChange={(e) =>
                          setFormSettings({
                            ...formSettings,
                            custom_logo: e.target.value,
                          })
                        }
                      />
                      {formSettings.custom_logo && (
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-xs text-foreground-secondary">
                            Preview:
                          </span>
                          <img
                            src={formSettings.custom_logo}
                            alt="Logo"
                            className="h-10 max-w-30 object-contain rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display =
                                "none";
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Header Color */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Header Background Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={formSettings.custom_header_color || "#00d991"}
                          onChange={(e) =>
                            setFormSettings({
                              ...formSettings,
                              custom_header_color: e.target.value,
                            })
                          }
                          className="w-10 h-10 rounded cursor-pointer border border-neutral-200"
                        />
                        <Input
                          type="text"
                          placeholder="#00d991"
                          value={formSettings.custom_header_color || ""}
                          onChange={(e) =>
                            setFormSettings({
                              ...formSettings,
                              custom_header_color: e.target.value,
                            })
                          }
                          maxLength={100}
                        />
                      </div>
                    </div>

                    {/* Preview Banner */}
                    {(formSettings.company_name ||
                      formSettings.custom_logo ||
                      formSettings.custom_header_color) && (
                      <div
                        className="rounded-lg p-4 mt-2"
                        style={{
                          backgroundColor:
                            formSettings.custom_header_color || "#00d991",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {formSettings.custom_logo && (
                            <img
                              src={formSettings.custom_logo}
                              alt="Logo"
                              className="h-10 max-w-25 object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                          )}
                          <div>
                            {formSettings.company_name && (
                              <p className="font-bold text-foreground text-sm">
                                {formSettings.company_name}
                              </p>
                            )}
                            {formSettings.company_description && (
                              <p className="text-xs text-foreground">
                                {formSettings.company_description}
                              </p>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-foreground mt-2 opacity-70">
                          ↑ Header preview
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-neutral-200">
                <Button
                  onClick={handleSaveSettings}
                  disabled={isSettingsSaving}
                >
                  {isSettingsSaving ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Question Modal */}
        {showQuestionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-neutral-200">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {editingQuestion ? "Edit Question" : "Add Question"}
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* Question Type */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Question Type
                  </label>
                  <select
                    value={questionData.type}
                    onChange={(e) =>
                      setQuestionData({
                        ...questionData,
                        type: e.target.value as QuestionType,
                      })
                    }
                    className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {QUESTION_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Question Label */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="What do you want to ask?"
                    value={questionData.label}
                    onChange={(e) =>
                      setQuestionData({
                        ...questionData,
                        label: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                {/* Help Text */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Help Text (optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Additional instructions..."
                    value={questionData.help_text || ""}
                    onChange={(e) =>
                      setQuestionData({
                        ...questionData,
                        help_text: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Options for choice-based questions */}
                {[
                  QuestionType.MULTIPLE_CHOICE,
                  QuestionType.CHECKBOX,
                  QuestionType.SELECT,
                ].includes(questionData.type) && (
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {questionData.options?.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            type="text"
                            placeholder={`Option ${index + 1}`}
                            value={option.label}
                            onChange={(e) => {
                              updateOption(index, "label", e.target.value);
                              updateOption(
                                index,
                                "value",
                                e.target.value
                                  .toLowerCase()
                                  .replace(/\s+/g, "_"),
                              );
                            }}
                          />
                          <button
                            onClick={() => removeOption(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addOption}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}

                {/* Number constraints */}
                {[QuestionType.NUMBER, QuestionType.RATING].includes(
                  questionData.type,
                ) && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Min Value
                      </label>
                      <Input
                        type="number"
                        value={questionData.min_value || ""}
                        onChange={(e) =>
                          setQuestionData({
                            ...questionData,
                            min_value: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">
                        Max Value
                      </label>
                      <Input
                        type="number"
                        value={questionData.max_value || ""}
                        onChange={(e) =>
                          setQuestionData({
                            ...questionData,
                            max_value: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                  </div>
                )}

                {/* Required Toggle */}
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-lg">
                  <span className="font-semibold text-foreground">
                    Required Question
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={questionData.is_required}
                      onChange={(e) =>
                        setQuestionData({
                          ...questionData,
                          is_required: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              </div>

              <div className="p-6 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowQuestionModal(false)}
                  className="px-6 py-3 text-foreground-secondary hover:text-foreground font-medium"
                >
                  Cancel
                </button>
                <Button onClick={handleSaveQuestion} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Question"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Publish Success Modal */}
        {form && (
          <PublishSuccessModal
            formId={formId}
            formTitle={form.title}
            isOpen={showPublishModal}
            onClose={() => {
              setShowPublishModal(false);
              void loadFormData(); // Reload form to get updated status
            }}
          />
        )}
      </div>
    </div>
  );
}
