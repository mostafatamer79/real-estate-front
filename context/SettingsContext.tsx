"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { fetchPublicSettings, getApiBaseUrl } from "@/lib/runtime-config";

export interface GlobalSettings {
    // Theme / Branding
    primary: string;
    background: string;
    foreground: string;
    accent: string;
    sidebar: string;
    soonBadgeBg: string;
    soonBadgeText: string;
    fontSize: string;
    fontFamily: string;
    cardBg: string;
    cardText: string;
    cardBorder: string;
    cardRadius: string;
    iconBg: string;
    iconColor: string;
    buttonRadius: string;
    appName: string;
    description: string;
    isDark: boolean;
    contactEmail: string;
    contactPhone: string;
    contactTwitter: string;
    logoWhiteUrl: string;
    logoBlackUrl: string;
    reportCoverUrl: string;
    logoHeight: number;

    // Custom Page Style Properties
    splashBg?: string;
    splashLogoHeight?: string;
    splashDuration?: string;
    loginBg?: string;
    loginCardBg?: string;
    loginFontSize?: string;
    csBg?: string;
    csCardBg?: string;
    csTextColor?: string;
    csFontSize?: string;
    csFontFamily?: string;
    csEnabled?: boolean;
    headerNotificationColor?: string;
    headerNotificationSize?: string;
    headerChatColor?: string;
    headerChatSize?: string;
    headerProfileColor?: string;
    headerProfileSize?: string;
    mapIconColor?: string;
    mapIconSize?: string;
    mapTitleColor?: string;
    mapTitleSize?: string;
    scanIconColor?: string;
    scanIconSize?: string;
    statsIconColor?: string;
    statsIconSize?: string;
    statsTitleColor?: string;
    statsTitleSize?: string;
    adsIconColor?: string;
    adsIconSize?: string;
    adsTitleColor?: string;
    adsTitleSize?: string;
    chartsIconColor?: string;
    chartsIconSize?: string;
    chartsTitleColor?: string;
    chartsTitleSize?: string;
    aboutIconColor?: string;
    aboutIconSize?: string;
    aboutTitleColor?: string;
    aboutTitleSize?: string;
    supportIconColor?: string;
    supportIconSize?: string;
    supportTitleColor?: string;
    supportTitleSize?: string;
    contactIconColor?: string;
    contactIconSize?: string;
    contactTitleColor?: string;
    contactTitleSize?: string;
    quickActionsIconColor?: string;
    quickActionsIconSize?: string;
    quickActionsTitleColor?: string;
    quickActionsTitleSize?: string;
    quickActionBg?: string;
    quickActionRadius?: string;
    quickActionFontSize?: string;

    // Pricing
    appointmentPrice: number;
    purchaseFeePercentage: number;
    taxPercentage: number;

    // Service Prices (key = service_price_category_service, value = price)
    servicePrices: Record<string, number>;

    // Text Overrides (key = language_translationKey, value = text)
    textOverrides: Record<string, string>;

    // Section feature flags: 'open' | 'closed'
    sectionFlags: Record<string, 'open' | 'closed' | 'hidden'>;

    // Per-section custom "coming soon" messages
    sectionMessages: Record<string, string>;

    // Module flags: enabled | soon | disabled
    moduleFlags: Record<string, 'enabled' | 'soon' | 'disabled'>;

    // Per-module custom "soon" messages
    moduleMessages: Record<string, string>;

    // Login method controls
    loginConfig: {
        emailEnabled: boolean;
        phoneEnabled: boolean;
        phoneLabel: string;
    };

    // UI element visibility flags
    uiFlags: Record<string, boolean>;

    // Details page parts: enabled | soon | hidden
    detailsPartFlags: Record<string, 'enabled' | 'soon' | 'hidden'>;

    // Per-details-part custom "soon" messages
    detailsPartMessages: Record<string, string>;
}

interface SettingsContextType {
    settings: GlobalSettings;
    updateSettings: (updates: Partial<GlobalSettings>) => void;
    saveSettings: (overrideSettings?: Partial<GlobalSettings>) => Promise<boolean>;
    refetch: () => Promise<void>;
    isLoading: boolean;
}

const defaultSettings: GlobalSettings = {
    primary: "oklch(0.2 0.02 264)",
    background: "oklch(0.99 0.002 264)",
    foreground: "oklch(0.15 0.01 264)",
    accent: "oklch(0.94 0.005 264)",
    sidebar: "oklch(1 0 0 / 95%)",
    soonBadgeBg: "#ffffff",
    soonBadgeText: "#000000",
    fontSize: "15px",
    fontFamily: "system-ui",
    cardBg: "#ffffff",
    cardText: "#0f172a",
    cardBorder: "#e2e8f0",
    cardRadius: "24px",
    iconBg: "#f8fafc",
    iconColor: "#0f172a",
    buttonRadius: "16px",
    appName: "الوساطة الرقمية",
    description: "الوساطة الرقمية - منصة عقارية شاملة",
    isDark: false,
    contactEmail: "info@digital-brokerage.com",
    contactPhone: "",
    contactTwitter: "@DigitalBrokerage",
    logoWhiteUrl: "/icons/white.png",
    logoBlackUrl: "/icons/black.png",
    reportCoverUrl: "",
    logoHeight: 40,

    // Custom Page Style Default Values
    splashBg: "#0b0f19",
    splashLogoHeight: "120",
    splashDuration: "3",
    loginBg: "#0b0f19",
    loginCardBg: "rgba(255,255,255,0.05)",
    loginFontSize: "15",
    csBg: "#f8fafc",
    csCardBg: "#ffffff",
    csFontSize: "15",
    headerNotificationColor: "#94a3b8",
    headerNotificationSize: "24",
    headerChatColor: "#94a3b8",
    headerChatSize: "24",
    headerProfileColor: "#cbd5e1",
    headerProfileSize: "14",
    mapIconColor: "#94a3b8",
    mapIconSize: "16",
    mapTitleColor: "#cbd5e1",
    mapTitleSize: "16",
    scanIconColor: "#cbd5e1",
    scanIconSize: "16",
    statsIconColor: "#94a3b8",
    statsIconSize: "16",
    statsTitleColor: "#cbd5e1",
    statsTitleSize: "16",
    adsIconColor: "#94a3b8",
    adsIconSize: "16",
    adsTitleColor: "#cbd5e1",
    adsTitleSize: "16",
    chartsIconColor: "#94a3b8",
    chartsIconSize: "16",
    chartsTitleColor: "#cbd5e1",
    chartsTitleSize: "16",
    aboutIconColor: "#94a3b8",
    aboutIconSize: "16",
    aboutTitleColor: "#cbd5e1",
    aboutTitleSize: "16",
    supportIconColor: "#94a3b8",
    supportIconSize: "16",
    supportTitleColor: "#cbd5e1",
    supportTitleSize: "16",
    contactIconColor: "#94a3b8",
    contactIconSize: "16",
    contactTitleColor: "#cbd5e1",
    contactTitleSize: "16",
    quickActionsIconColor: "#94a3b8",
    quickActionsIconSize: "40",
    quickActionsTitleColor: "#cbd5e1",
    quickActionsTitleSize: "16",
    quickActionBg: "rgba(51, 65, 85, 0.6)",
    quickActionRadius: "24",
    quickActionFontSize: "14",

    appointmentPrice: 0,
    purchaseFeePercentage: 2.5,
    taxPercentage: 15,
    servicePrices: {},
    textOverrides: {},
    sectionFlags: {},
    sectionMessages: {},
    moduleFlags: {},
    moduleMessages: {},
    loginConfig: {
        emailEnabled: true,
        phoneEnabled: false,
        phoneLabel: "قريباً",
    },
    uiFlags: {
        show_map_section: true,
        show_stats_cards: true,
        show_charts_section: true,
        show_quick_actions: true,
        show_quickaction_buildingmgmt: true,
        show_quickaction_wallet: true,
        show_quickaction_services: true,
        show_quickaction_offers: true,
        show_quickaction_orders: true,
        show_admin_stats: true,
        show_cs_faq: true,
        show_cs_channels: true,
        show_cs_form: true,
    },
    detailsPartFlags: {},
    detailsPartMessages: {},
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
    const [isLoading, setIsLoading] = useState(true);

    const applyTheme = useCallback((s: GlobalSettings) => {
        if (typeof document === "undefined") return;
        const root = document.documentElement;
        root.style.setProperty("--primary", s.primary);
        root.style.setProperty("--background", s.background);
        root.style.setProperty("--foreground", s.foreground);
        root.style.setProperty("--accent", s.accent);
        root.style.setProperty("--sidebar", s.sidebar);
        root.style.setProperty("--soon-badge-bg", s.soonBadgeBg);
        root.style.setProperty("--soon-badge-text", s.soonBadgeText);
        root.style.setProperty("--app-font-family", s.fontFamily);
        root.style.setProperty("--platform-card-bg", s.cardBg);
        root.style.setProperty("--platform-card-text", s.cardText);
        root.style.setProperty("--platform-card-border", s.cardBorder);
        root.style.setProperty("--platform-card-radius", s.cardRadius);
        root.style.setProperty("--platform-icon-bg", s.iconBg);
        root.style.setProperty("--platform-icon-color", s.iconColor);
        root.style.setProperty("--platform-button-radius", s.buttonRadius);
        root.style.setProperty("font-size", s.fontSize);
        if (s.isDark) {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }, []);

    const fetchSettings = useCallback(async () => {
        try {
            const allSettings = await fetchPublicSettings();
                const next = { ...defaultSettings };
                const services: Record<string, number> = {};
                const texts: Record<string, string> = {};
                const sectionFlags: Record<string, 'open' | 'closed'> = {};
                const sectionMessages: Record<string, string> = {};
                const moduleFlags: Record<string, 'enabled' | 'soon' | 'disabled'> = {};
                const moduleMessages: Record<string, string> = {};
                const uiFlags: Record<string, boolean> = { ...defaultSettings.uiFlags };
                const detailsPartFlags: Record<string, 'enabled' | 'soon' | 'hidden'> = {};
                const detailsPartMessages: Record<string, string> = {};
                const loginConfig = { ...defaultSettings.loginConfig };

                allSettings.forEach((s) => {
                    if (s.key.startsWith("theme_")) {
                        const key = s.key.replace("theme_", "");
                        if (key === "isDark") {
                            next.isDark = s.value === "true";
                        } else if (key === "contactEmail") {
                            next.contactEmail = s.value;
                        } else if (key === "contactPhone") {
                            next.contactPhone = s.value;
                        } else if (key in next) {
                            (next as any)[key] = s.value;
                        }
                    } else if (s.key === "appointment_price") {
                        next.appointmentPrice = parseFloat(s.value) || 0;
                    } else if (s.key === "purchase_service_fee_percentage") {
                        next.purchaseFeePercentage = parseFloat(s.value) || 2.5;
                    } else if (s.key === "tax_percentage") {
                        next.taxPercentage = parseFloat(s.value) || 15;
                    } else if (s.key.startsWith("service_price_")) {
                        services[s.key] = parseFloat(s.value) || 0;
                    } else if (s.key.startsWith("txt_")) {
                        texts[s.key.replace("txt_", "")] = s.value;
                    } else if (s.key.startsWith("section_") && !s.key.includes("_message")) {
                        // e.g. section_wallet => 'open' | 'closed'
                        const sectionKey = s.key.replace("section_", "");
                        sectionFlags[sectionKey] = s.value === 'closed' ? 'closed' : 'open';
                    } else if (s.key.startsWith("section_") && s.key.endsWith("_message")) {
                        // e.g. section_wallet_message
                        const sectionKey = s.key.replace("section_", "").replace("_message", "");
                        sectionMessages[sectionKey] = s.value;
                    } else if (s.key.startsWith("module_") && !s.key.endsWith("_message")) {
                        const moduleKey = s.key.replace("module_", "");
                        moduleFlags[moduleKey] = (s.value === 'soon' || s.value === 'disabled') ? (s.value as any) : 'enabled';
                    } else if (s.key.startsWith("module_") && s.key.endsWith("_message")) {
                        const moduleKey = s.key.replace("module_", "").replace("_message", "");
                        moduleMessages[moduleKey] = s.value;
                    } else if (s.key === "login_email_enabled") {
                        loginConfig.emailEnabled = s.value === 'true';
                    } else if (s.key === "login_phone_enabled") {
                        loginConfig.phoneEnabled = s.value === 'true';
                    } else if (s.key === "login_phone_label") {
                        loginConfig.phoneLabel = s.value;
                    } else if (s.key.startsWith("ui_show_")) {
                        const uiKey = s.key.replace("ui_show_", "show_");
                        uiFlags[uiKey] = s.value === 'true';
                    } else if (s.key.startsWith("details_part_") && !s.key.endsWith("_message")) {
                        const partKey = s.key.replace("details_part_", "");
                        detailsPartFlags[partKey] = s.value === 'soon' || s.value === 'hidden' ? (s.value as any) : 'enabled';
                    } else if (s.key.startsWith("details_part_") && s.key.endsWith("_message")) {
                        const partKey = s.key.replace("details_part_", "").replace("_message", "");
                        detailsPartMessages[partKey] = s.value;
                    }
                });

                next.servicePrices = services;
                next.textOverrides = texts;
                next.sectionFlags = sectionFlags;
                next.sectionMessages = sectionMessages;
                next.moduleFlags = moduleFlags;
                next.moduleMessages = moduleMessages;
                next.loginConfig = loginConfig;
                next.uiFlags = uiFlags;
                next.detailsPartFlags = detailsPartFlags;
                next.detailsPartMessages = detailsPartMessages;
                setSettings(next);
                applyTheme(next);
        } catch (error) {
            console.error("Failed to fetch settings", error);
        } finally {
            setIsLoading(false);
        }
    }, [applyTheme]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const updateSettings = (updates: Partial<GlobalSettings>) => {
        setSettings((prev) => {
            const next = { ...prev, ...updates };
            applyTheme(next);
            return next;
        });
    };

    const saveSettings = async (overrideSettings?: Partial<GlobalSettings>): Promise<boolean> => {
        try {
            const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
            const current = overrideSettings ? { ...settings, ...overrideSettings } : settings;
            const entries: Array<{ key: string; value: string; description?: string }> = [];

            // Theme / Identity keys
            const themeKeys = [
                "primary",
                "background",
                "foreground",
                "accent",
                "sidebar",
                "soonBadgeBg",
                "soonBadgeText",
                "fontSize",
                "fontFamily",
                "cardBg",
                "cardText",
                "cardBorder",
                "cardRadius",
                "iconBg",
                "iconColor",
                "buttonRadius",
                "appName",
                "isDark",
                "description",
                "contactEmail",
                "contactPhone",
                "contactTwitter",
                "logoWhiteUrl",
                "logoBlackUrl",
                "reportCoverUrl",
                "logoHeight",

                // Custom dynamic styling keys
                "splashBg",
                "splashLogoHeight",
                "splashDuration",
                "loginBg",
                "loginCardBg",
                "loginFontSize",
                "csBg",
                "csCardBg",
                "csFontSize",
                "headerNotificationColor",
                "headerNotificationSize",
                "headerChatColor",
                "headerChatSize",
                "headerProfileColor",
                "headerProfileSize",
                "mapIconColor",
                "mapIconSize",
                "mapTitleColor",
                "mapTitleSize",
                "scanIconColor",
                "scanIconSize",
                "statsIconColor",
                "statsIconSize",
                "statsTitleColor",
                "statsTitleSize",
                "adsIconColor",
                "adsIconSize",
                "adsTitleColor",
                "adsTitleSize",
                "chartsIconColor",
                "chartsIconSize",
                "chartsTitleColor",
                "chartsTitleSize",
                "aboutIconColor",
                "aboutIconSize",
                "aboutTitleColor",
                "aboutTitleSize",
                "supportIconColor",
                "supportIconSize",
                "supportTitleColor",
                "supportTitleSize",
                "contactIconColor",
                "contactIconSize",
                "contactTitleColor",
                "contactTitleSize",
                "quickActionsIconColor",
                "quickActionsIconSize",
                "quickActionsTitleColor",
                "quickActionsTitleSize",
                "quickActionBg",
                "quickActionRadius",
                "quickActionFontSize",
            ];
            themeKeys.forEach((key) => {
                if ((current as any)[key] !== undefined) {
                    entries.push({
                        key: `theme_${key}`,
                        value: String((current as any)[key]),
                        description: `Setting: ${key}`,
                    });
                }
            });

            // Pricing
            entries.push({ key: "appointment_price", value: String(current.appointmentPrice) });
            entries.push({ key: "purchase_service_fee_percentage", value: String(current.purchaseFeePercentage) });
            entries.push({ key: "tax_percentage", value: String(current.taxPercentage) });

            // Service prices
            Object.entries(current.servicePrices).forEach(([key, value]) => {
                entries.push({ key, value: String(value) });
            });

            // Text overrides
            Object.entries(current.textOverrides).forEach(([key, value]) => {
                entries.push({ key: `txt_${key}`, value, description: `Text override for ${key}` });
            });

            // Section flags
            Object.entries(current.sectionFlags).forEach(([key, value]) => {
                entries.push({ key: `section_${key}`, value, description: `Section flag: ${key}` });
            });

            // Section messages
            Object.entries(current.sectionMessages).forEach(([key, value]) => {
                entries.push({ key: `section_${key}_message`, value, description: `Coming soon message for ${key}` });
            });

            // Module flags + messages
            Object.entries(current.moduleFlags || {}).forEach(([key, value]) => {
                entries.push({ key: `module_${key}`, value, description: `Module flag: ${key}` });
            });
            Object.entries(current.moduleMessages || {}).forEach(([key, value]) => {
                entries.push({ key: `module_${key}_message`, value, description: `Module soon message: ${key}` });
            });

            // Login config
            entries.push({ key: 'login_email_enabled', value: String(current.loginConfig.emailEnabled) });
            entries.push({ key: 'login_phone_enabled', value: String(current.loginConfig.phoneEnabled) });
            entries.push({ key: 'login_phone_label', value: current.loginConfig.phoneLabel });

            // UI flags
            Object.entries(current.uiFlags).forEach(([key, value]) => {
                // key is like "show_map_section", persist as "ui_show_map_section"
                const persistKey = key.startsWith('show_') ? `ui_${key}` : key;
                entries.push({ key: persistKey, value: String(value), description: `UI flag: ${key}` });
            });

            // Details page parts (enabled | soon | hidden) + messages
            Object.entries(current.detailsPartFlags || {}).forEach(([key, value]) => {
                entries.push({ key: `details_part_${key}`, value, description: `Details part flag: ${key}` });
            });
            Object.entries(current.detailsPartMessages || {}).forEach(([key, value]) => {
                entries.push({ key: `details_part_${key}_message`, value, description: `Details part soon message: ${key}` });
            });

            const res = await fetch(`${getApiBaseUrl()}/settings/batch`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ settings: entries }),
            });

            return res.ok;
        } catch (error) {
            console.error("Failed to save settings", error);
            return false;
        }
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, saveSettings, refetch: fetchSettings, isLoading }}>
            {children}
        </SettingsContext.Provider>
    );
}

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
};
