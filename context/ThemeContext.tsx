/**
 * ThemeContext - Compatibility shim
 *
 * Settings are now managed globally by SettingsContext.
 * This file re-exports useSettings as useTheme so that all existing
 * components that import { useTheme } continue to work without changes.
 */

export { useSettings as useTheme, SettingsProvider as ThemeProvider } from "./SettingsContext";
export type { GlobalSettings as ThemeSettings } from "./SettingsContext";
