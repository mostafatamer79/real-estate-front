"use client";

import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/hooks/useAuth";

export function useSectionGuard(sectionKey: string) {
    const { settings } = useSettings();
    const { user } = useAuth();

    // Admins always bypass guards
    const isAdmin = (user as any)?.role === 'admin';

    const flag = settings.sectionFlags[sectionKey];
    const isHidden = flag === 'hidden';
    // Admins always bypass guards, unless they specifically check isHidden
    const isOpen = isAdmin || (flag === 'open');
    const message = settings.sectionMessages[sectionKey] || '';

    return { isOpen, isHidden, message, isAdmin };
}
