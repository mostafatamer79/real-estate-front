"use client";

import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/hooks/useAuth";

export function useSectionGuard(sectionKey: string) {
    const { settings } = useSettings();
    const { user } = useAuth();

    // Admins always bypass guards
    const isAdmin = (user as any)?.role === 'admin';

    const flag = settings.sectionFlags[sectionKey];
    // Default to closed. Only open if flag is explicitly 'open'.
    // Admins can bypass regardless of the flag state.
    const isOpen = isAdmin || (flag === 'open');
    const message = settings.sectionMessages[sectionKey] || '';

    return { isOpen, message, isAdmin };
}
