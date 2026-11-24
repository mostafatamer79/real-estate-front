import { useEffect, useRef } from "react";

export interface Participant {
  id?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender?: {
    id?: string | number | null;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  } | null;
  createdAt?: string | null;
}

export function sanitizeParticipant(raw: unknown): Participant | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }

  const rec = raw as Record<string, unknown>;

  const id =
    typeof rec.id === "string" || typeof rec.id === "number"
      ? rec.id
      : null;

  const firstName =
    typeof rec.firstName === "string"
      ? rec.firstName.trim()
      : typeof rec.firstName === "number"
      ? String(rec.firstName)
      : null;

  const lastName =
    typeof rec.lastName === "string"
      ? rec.lastName.trim()
      : typeof rec.lastName === "number"
      ? String(rec.lastName)
      : null;

  const email =
    typeof rec.email === "string"
      ? rec.email.trim()
      : typeof rec.email === "number"
      ? String(rec.email)
      : null;

  const phone =
    typeof rec.phone === "string"
      ? rec.phone.trim()
      : typeof rec.phone === "number"
      ? String(rec.phone)
      : null;

  const role =
    typeof rec.role === "string"
      ? rec.role.trim()
      : typeof rec.role === "number"
      ? String(rec.role)
      : null;

  return {
    id,
    firstName,
    lastName,
    email,
    phone,
    role,
  };
}

export function sanitizeParticipants(rawList: unknown): Participant[] {
  if (!Array.isArray(rawList)) {
    return [];
  }
  const result: Participant[] = [];
  for (const item of rawList) {
    const sanitized = sanitizeParticipant(item);
    if (sanitized) {
      result.push(sanitized);
    }
  }
  return result;
}

export function safeParticipantName(
  participant: unknown,
  fallbackName?: unknown,
  defaultFallback = "مستخدم"
): string {
  if (participant && typeof participant === "object" && !Array.isArray(participant)) {
    const p = participant as Record<string, unknown>;
    const first =
      typeof p.firstName === "string"
        ? p.firstName.trim()
        : typeof p.firstName === "number"
        ? String(p.firstName)
        : "";
    const last =
      typeof p.lastName === "string"
        ? p.lastName.trim()
        : typeof p.lastName === "number"
        ? String(p.lastName)
        : "";
    const full = `${first} ${last}`.trim();
    if (full) return full;

    if (typeof p.email === "string" && p.email.trim()) return p.email.trim();
    if (typeof p.email === "number") return String(p.email);

    if (typeof p.phone === "string" && p.phone.trim()) return p.phone.trim();
    if (typeof p.phone === "number") return String(p.phone);
  }

  if (typeof fallbackName === "string" && fallbackName.trim()) {
    return fallbackName.trim();
  }
  if (typeof fallbackName === "number") {
    return String(fallbackName);
  }

  return defaultFallback;
}

export function getParticipantInitials(nameInput: unknown): string {
  if (!nameInput) return "";
  const name = String(nameInput).trim();
  if (!name) return "";

  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function normalizeSearchText(text: unknown): string {
  if (!text) return "";
  return String(text)
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .trim();
}

export function formatConversationTime(
  dateString?: string | null,
  isAr = true
): string {
  if (!dateString) return "";
  const parsed = Date.parse(dateString);
  if (!Number.isFinite(parsed)) return "";

  try {
    const date = new Date(parsed);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours >= 0 && diffInHours < 24) {
      return date.toLocaleTimeString(isAr ? "ar-SA" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (diffInHours >= 24 && diffInHours < 48) {
      return isAr ? "أمس" : "Yesterday";
    }
    return date.toLocaleDateString(isAr ? "ar-SA" : "en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * Focus trap hook for accessible modal dialogs.
 * Enforces initial focus, tab cycle containment, Escape key closure,
 * and restores focus to the trigger button when closed.
 */
export function useModalFocusTrap(
  isOpen: boolean,
  onClose: () => void,
  dialogRef: React.RefObject<HTMLElement | null>,
  triggerRef?: React.RefObject<HTMLElement | null>,
  options?: { disableEscape?: boolean }
) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (typeof document !== "undefined") {
      previousFocusRef.current = (document.activeElement as HTMLElement) || null;
    }

    const timer = setTimeout(() => {
      if (!dialogRef.current) return;
      const focusableSelector =
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
      );

      // Focus search input or first focusable element
      const searchInput = focusableElements.find((el) => el.tagName === "INPUT");
      if (searchInput) {
        searchInput.focus();
      } else if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else {
        dialogRef.current.focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!dialogRef.current) return;

      if (e.key === "Escape" && !options?.disableEscape) {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === "Tab") {
        const focusableSelector =
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector)
        );

        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusables[0];
        const lastElement = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || document.activeElement === dialogRef.current) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    const triggerEl = triggerRef?.current;

    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown, true);

      // Restore focus to trigger or previously active element
      const target = triggerEl || previousFocusRef.current;
      if (target && typeof target.focus === "function") {
        setTimeout(() => {
          target.focus();
        }, 10);
      }
    };
  }, [isOpen, onClose, dialogRef, triggerRef, options?.disableEscape]);
}
