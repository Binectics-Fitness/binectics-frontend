"use client";

import { useState, useCallback } from "react";
import {
  formsService,
  type Form,
  type FormQuestion,
  type FormAnalytics,
  type FormResponse,
  type CreateFormRequest,
  type UpdateFormRequest,
  type CreateQuestionRequest,
  type UpdateQuestionRequest,
  type SubmitFormResponseRequest,
} from "@/lib/api/forms";
import { decodeObjectEntities } from "@/lib/utils";
import { pMap } from "@/utils/async";

/** Maximum concurrent getFormResponses requests to avoid API fan-out. */
const RESPONSE_COUNT_CONCURRENCY = 5;

/**
 * Hook for managing the forms list.
 * Encapsulates data fetching for the forms list page.
 */
export function useForms() {
  const [forms, setForms] = useState<Form[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadForms = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const response = await formsService.getMyForms();

    if (response.success && response.data) {
      setForms(decodeObjectEntities(response.data));

      const counts: Record<string, number> = {};
      await pMap(
        response.data,
        async (form) => {
          const responsesResponse = await formsService.getFormResponses(
            form._id,
          );
          if (responsesResponse.success && responsesResponse.data) {
            counts[form._id] = responsesResponse.data.length;
          } else {
            counts[form._id] = 0;
          }
        },
        RESPONSE_COUNT_CONCURRENCY,
      );
      setResponseCounts(counts);
    } else {
      setError(response.message || "Failed to load forms");
    }

    setIsLoading(false);
  }, []);

  const deleteForm = useCallback(
    async (formId: string): Promise<boolean> => {
      const response = await formsService.deleteForm(formId);
      if (response.success) {
        setForms((prev) => prev.filter((f) => f._id !== formId));
        return true;
      }
      return false;
    },
    [],
  );

  return { forms, responseCounts, isLoading, error, loadForms, deleteForm };
}

/**
 * Hook for form creation.
 * Encapsulates the create form API call.
 */
export function useFormCreate() {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createForm = useCallback(
    async (
      data: CreateFormRequest,
      organizationId?: string,
    ): Promise<Form | null> => {
      setIsCreating(true);
      setError(null);

      const response = organizationId
        ? await formsService.createOrgForm(organizationId, data)
        : await formsService.createForm(data);

      setIsCreating(false);

      if (response.success && response.data) {
        return response.data;
      }
      setError(response.message || "Failed to create form");
      return null;
    },
    [],
  );

  return { createForm, isCreating, error };
}

/**
 * Hook for loading a single form's details and questions.
 * Shared base hook used by analytics, responses, submit, and edit pages.
 */
export function useFormDetail(formId: string) {
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFormDetail = useCallback(async () => {
    if (!formId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [formRes, questionsRes] = await Promise.all([
        formsService.getFormById(formId),
        formsService.getFormQuestions(formId),
      ]);

      if (formRes.success && formRes.data) {
        setForm(decodeObjectEntities(formRes.data));
      } else {
        setError(formRes.message || "Failed to load form");
      }

      if (questionsRes.success && questionsRes.data) {
        setQuestions(decodeObjectEntities(questionsRes.data));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  return {
    form,
    setForm,
    questions,
    setQuestions,
    isLoading,
    error,
    loadFormDetail,
  };
}

/**
 * Hook for loading form analytics data.
 */
export function useFormAnalytics(formId: string) {
  const [form, setForm] = useState<Form | null>(null);
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!formId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [formRes, analyticsRes] = await Promise.all([
        formsService.getFormById(formId),
        formsService.getFormAnalytics(formId),
      ]);

      if (formRes.success && formRes.data) {
        setForm(decodeObjectEntities(formRes.data));
      } else {
        setError(formRes.message || "Failed to load form");
      }

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  return { form, analytics, isLoading, error, loadAnalytics };
}

/**
 * Hook for loading form responses.
 */
export function useFormResponses(formId: string) {
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResponses = useCallback(async () => {
    if (!formId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [formRes, questionsRes, responsesRes] = await Promise.all([
        formsService.getFormById(formId),
        formsService.getFormQuestions(formId),
        formsService.getFormResponses(formId),
      ]);

      if (formRes.success && formRes.data) {
        setForm(decodeObjectEntities(formRes.data));
      } else {
        setError(formRes.message || "Failed to load form");
      }

      if (questionsRes.success && questionsRes.data) {
        setQuestions(decodeObjectEntities(questionsRes.data));
      }

      if (responsesRes.success && responsesRes.data) {
        setResponses(responsesRes.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [formId]);

  return { form, questions, responses, isLoading, error, loadResponses };
}

/**
 * Hook for loading and submitting a form.
 */
export function useFormSubmission(formId: string) {
  const { form, questions, isLoading, error, loadFormDetail } =
    useFormDetail(formId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const submitForm = useCallback(
    async (data: SubmitFormResponseRequest): Promise<boolean> => {
      setIsSubmitting(true);
      setSubmitError(null);

      const response = await formsService.submitForm(formId, data);
      setIsSubmitting(false);

      if (response.success) {
        return true;
      }
      setSubmitError(response.message || "Failed to submit form");
      return false;
    },
    [formId],
  );

  return {
    form,
    questions,
    isLoading,
    error,
    loadFormDetail,
    isSubmitting,
    submitError,
    submitForm,
  };
}

/**
 * Hook for form editing operations.
 * Encapsulates all CRUD operations for form editing.
 */
export function useFormEditor(formId: string) {
  const {
    form,
    setForm,
    questions,
    setQuestions,
    isLoading,
    error,
    loadFormDetail,
  } = useFormDetail(formId);
  const [isSaving, setIsSaving] = useState(false);

  const updateForm = useCallback(
    async (data: UpdateFormRequest): Promise<boolean> => {
      setIsSaving(true);
      const response = await formsService.updateForm(formId, data);
      setIsSaving(false);
      if (response.success && response.data) {
        setForm(decodeObjectEntities(response.data));
        return true;
      }
      return false;
    },
    [formId, setForm],
  );

  const addQuestion = useCallback(
    async (data: CreateQuestionRequest): Promise<FormQuestion | null> => {
      const response = await formsService.addQuestion(formId, data);
      if (response.success && response.data) {
        const newQuestion = decodeObjectEntities(response.data);
        setQuestions((prev) => [...prev, newQuestion]);
        return newQuestion;
      }
      return null;
    },
    [formId, setQuestions],
  );

  const updateQuestion = useCallback(
    async (
      questionId: string,
      data: UpdateQuestionRequest,
    ): Promise<boolean> => {
      const response = await formsService.updateQuestion(questionId, data);
      if (response.success && response.data) {
        const updated = decodeObjectEntities(response.data);
        setQuestions((prev) =>
          prev.map((q) => (q._id === questionId ? updated : q)),
        );
        return true;
      }
      return false;
    },
    [setQuestions],
  );

  const deleteQuestion = useCallback(
    async (questionId: string): Promise<boolean> => {
      const response = await formsService.deleteQuestion(questionId);
      if (response.success) {
        setQuestions((prev) => prev.filter((q) => q._id !== questionId));
        return true;
      }
      return false;
    },
    [setQuestions],
  );

  const updateQuestionOrder = useCallback(
    async (
      orderedQuestions: Array<{ question_id: string; order_index: number }>,
    ): Promise<boolean> => {
      const response = await formsService.updateQuestionOrder(
        formId,
        orderedQuestions,
      );
      return response.success;
    },
    [formId],
  );

  const publishForm = useCallback(async (): Promise<boolean> => {
    const response = await formsService.publishForm(formId);
    if (response.success && response.data) {
      setForm(decodeObjectEntities(response.data));
      return true;
    }
    return false;
  }, [formId, setForm]);

  return {
    form,
    setForm,
    questions,
    setQuestions,
    isLoading,
    error,
    isSaving,
    loadFormDetail,
    updateForm,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    updateQuestionOrder,
    publishForm,
  };
}
