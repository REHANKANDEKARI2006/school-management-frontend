"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import {
  FeedbackModal,
  FeedbackModalState,
  FeedbackType,
} from "@/components/ui/feedback-modal";

// ─── Context Types ─────────────────────────────────────────────────────────────

interface FeedbackContextValue {
  /**
   * Show a success modal after a completed action.
   * @param title     Short result title  e.g. "Student Added Successfully"
   * @param message   Optional longer description
   * @param onClose   Optional callback when user dismisses
   */
  showSuccess: (title: string, message?: string, onClose?: () => void) => void;

  /**
   * Show an error modal explaining what went wrong.
   * @param title   e.g. "Upload Failed"
   * @param message e.g. "The file format is not supported."
   * @param detail  e.g. "Please use .xlsx or .csv format."
   * @param onRetry Optional: shows "Try Again" button and calls this handler
   * @param onClose Optional callback on dismiss
   */
  showError: (
    title: string,
    message?: string,
    detail?: string,
    onRetry?: () => void | Promise<void>,
    onClose?: () => void
  ) => void;

  /**
   * Show a warning modal before a dangerous/destructive action.
   * @param title       e.g. "Delete Student?"
   * @param message     e.g. "This action cannot be undone."
   * @param onConfirm   Called when user clicks "Proceed"
   * @param confirmText Optional override e.g. "Yes, Delete"
   */
  showWarning: (
    title: string,
    message?: string,
    onConfirm?: () => void | Promise<void>,
    confirmText?: string
  ) => void;

  /**
   * Show a confirmation modal before a major irreversible action.
   * @param title       e.g. "Promote Students?"
   * @param message     e.g. "All students will be moved to the next grade."
   * @param onConfirm   Called when user clicks "Confirm"
   * @param confirmText Optional override
   * @param cancelText  Optional override
   */
  showConfirm: (
    title: string,
    message?: string,
    onConfirm?: () => void | Promise<void>,
    confirmText?: string,
    cancelText?: string
  ) => void;

  /**
   * Show an informational modal (report ready, feature notice, etc.)
   * @param title   e.g. "Export Complete"
   * @param message e.g. "Your PDF is ready to download."
   * @param onClose Optional callback on dismiss
   */
  showInfo: (title: string, message?: string, onClose?: () => void) => void;
}

// ─── Context ───────────────────────────────────────────────────────────────────

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

const CLOSED_STATE: FeedbackModalState = {
  open: false,
  type: "info",
  title: "",
};

// ─── Provider ──────────────────────────────────────────────────────────────────

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [modal, setModal] = useState<FeedbackModalState>(CLOSED_STATE);

  const dismiss = useCallback(() => {
    setModal((prev) => ({ ...prev, open: false }));
  }, []);

  const showSuccess = useCallback(
    (title: string, message?: string, onClose?: () => void) => {
      setModal({ open: true, type: "success", title, message, onClose });
    },
    []
  );

  const showError = useCallback(
    (
      title: string,
      message?: string,
      detail?: string,
      onRetry?: () => void | Promise<void>,
      onClose?: () => void
    ) => {
      setModal({
        open: true,
        type: "error",
        title,
        message,
        detail,
        onConfirm: onRetry,
        confirmText: onRetry ? "Try Again" : "Close",
        onClose,
      });
    },
    []
  );

  const showWarning = useCallback(
    (
      title: string,
      message?: string,
      onConfirm?: () => void | Promise<void>,
      confirmText?: string
    ) => {
      setModal({
        open: true,
        type: "warning",
        title,
        message,
        onConfirm,
        confirmText,
      });
    },
    []
  );

  const showConfirm = useCallback(
    (
      title: string,
      message?: string,
      onConfirm?: () => void | Promise<void>,
      confirmText?: string,
      cancelText?: string
    ) => {
      setModal({
        open: true,
        type: "confirm",
        title,
        message,
        onConfirm,
        confirmText,
        cancelText,
      });
    },
    []
  );

  const showInfo = useCallback(
    (title: string, message?: string, onClose?: () => void) => {
      setModal({ open: true, type: "info", title, message, onClose });
    },
    []
  );

  return (
    <FeedbackContext.Provider
      value={{ showSuccess, showError, showWarning, showConfirm, showInfo }}
    >
      {children}
      {/* Single global modal instance — rendered once, driven by context state */}
      <FeedbackModal state={modal} onDismiss={dismiss} />
    </FeedbackContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback must be used within a <FeedbackProvider>");
  }
  return ctx;
}
