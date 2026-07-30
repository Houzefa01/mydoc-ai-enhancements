/**
 * Backend layer — the ONLY place where the database, storage and auth
 * provider are touched. UI code (routes/components/store) must import from
 * here and never from `@/integrations/supabase/*` directly.
 */
export * from "./types";
export { authApi, type SignUpInput } from "./auth.api";
export { profileApi } from "./profile.api";
export { projectsApi } from "./projects.api";
export { sourcesApi } from "./sources.api";
export { documentsApi } from "./documents.api";
export { exportsApi } from "./exports.api";
export { creditsApi } from "./credits.api";
export { rolesApi, type AppRole } from "./roles.api";
export { settingsApi } from "./settings.api";
export type { SystemSettings, SettingsHistoryEntry } from "./settings.types";
export { outlineByType } from "./outlines";