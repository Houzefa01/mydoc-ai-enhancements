import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  authApi,
  creditsApi,
  documentsApi,
  exportsApi,
  outlineByType,
  profileApi,
  projectsApi,
  sourcesApi,
  settingsApi,
  type CreditBalance,
  type DocumentContent,
  type DocumentType,
  type DocumentVersion,
  type ExportFormat,
  type ExportJob,
  type Project,
  type Section,
  type SectionBlock,
  type SignUpInput,
  type SourceFile,
  type User,
} from "@/backend";
import { typeLabels } from "./labels";
import { exportCreditCost, generationCreditCost } from "./creditCosts";
import { DEFAULT_SETTINGS, type SystemSettings } from "@/backend/settings.types";

const emptyCredits: CreditBalance = { balance: 0, transactions: [] };

interface Store {
  user: User | null;
  ready: boolean;
  loading: boolean;

  projects: Project[];
  sourceFiles: SourceFile[];
  documents: Record<string, DocumentContent>;
  exports: ExportJob[];
  credits: CreditBalance;
  /** Paramètres système globaux (tarification, modèle IA actif). */
  settings: SystemSettings;

  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (input: SignUpInput) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  sendPasswordReset: (email: string) => Promise<string | null>;
  logout: () => Promise<void>;

  updateProfile: (patch: Partial<User>) => Promise<string | null>;
  uploadAvatar: (file: File) => Promise<string | null>;
  changePassword: (current: string, next: string) => Promise<string | null>;

  createProject: (input: {
    title: string;
    description: string;
    type: DocumentType;
    brief?: Record<string, string>;
  }) => Promise<Project | null>;
  deleteProject: (projectId: string) => Promise<void>;

  addSourceFile: (projectId: string, file: File, description?: string) => Promise<string | null>;
  updateSourceFileDescription: (fileId: string, description: string) => Promise<void>;
  removeSourceFile: (fileId: string) => Promise<void>;

  /** Renvoie un message d'erreur (crédits insuffisants…) ou null. */
  generateOutline: (projectId: string) => Promise<string | null>;
  updateSections: (projectId: string, sections: Section[]) => Promise<void>;
  regenerateSection: (projectId: string, sectionId: string) => Promise<void>;
  updateSectionTitle: (projectId: string, sectionId: string, title: string) => Promise<void>;
  updateSectionDescription: (
    projectId: string,
    sectionId: string,
    description: string,
  ) => Promise<void>;
  updateSectionParagraph: (
    projectId: string,
    sectionId: string,
    blockIndex: number,
    text: string,
  ) => Promise<void>;
  updateSectionBlocks: (
    projectId: string,
    sectionId: string,
    blocks: SectionBlock[],
  ) => Promise<void>;

  listVersions: (projectId: string) => Promise<DocumentVersion[]>;
  saveVersion: (projectId: string, label: string) => Promise<string | null>;
  restoreVersion: (projectId: string, version: number) => Promise<string | null>;

  requestExport: (projectId: string, format: ExportFormat) => Promise<string | null>;
  retryExport: (exportId: string) => Promise<string | null>;
  downloadExport: (exportId: string) => Promise<string | null>;
  deleteExport: (exportId: string) => Promise<void>;

  purchaseCredits: (packSize: number) => Promise<void>;
}

const StoreCtx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [sourceFiles, setSourceFiles] = useState<SourceFile[]>([]);
  const [documents, setDocuments] = useState<Record<string, DocumentContent>>({});
  const [exports, setExports] = useState<ExportJob[]>([]);
  const [credits, setCredits] = useState<CreditBalance>(emptyCredits);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);

  const avatarPath = useRef<string | null>(null);

  // ---- session ----
  useEffect(() => {
    const unsubscribe = authApi.onAuthStateChange((id) => {
      setUserId(id);
      if (!id) {
        setUser(null);
        setProjects([]);
        setSourceFiles([]);
        setDocuments({});
        setExports([]);
        setCredits(emptyCredits);
      }
      setReady(true);
    });

    void authApi.currentUserId().then((id) => {
      setUserId(id);
      setReady(true);
    });

    return unsubscribe;
  }, []);

  const loadAll = useCallback(async (uid: string) => {
    setLoading(true);
    const [profile, projectList, sources, docs, exportList, creditState, systemSettings] =
      await Promise.all([
      profileApi.get(uid),
      projectsApi.list(),
      sourcesApi.list(),
      documentsApi.list(),
      exportsApi.list(),
      creditsApi.get(uid),
      settingsApi.get(),
    ]);

    if (profile) {
      avatarPath.current = profile.avatarPath;
      setUser(profile.user);
    }
    setProjects(projectList);
    setSourceFiles(sources);
    setDocuments(docs);
    setExports(exportList);
    setCredits(creditState);
    setSettings(systemSettings);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (userId) void loadAll(userId);
  }, [userId, loadAll]);

  // ---- helpers ----
  const persistSections = useCallback(
    async (projectId: string, sections: Section[]) => {
      const doc = documents[projectId];
      if (!doc) return;
      const updatedAt = new Date().toISOString();
      setDocuments((d) => ({ ...d, [projectId]: { ...doc, sections, updatedAt } }));
      await documentsApi.saveSections(doc.id, sections, updatedAt);
    },
    [documents],
  );

  const refreshCredits = useCallback(async (uid: string) => {
    setCredits(await creditsApi.get(uid));
  }, []);

  const value: Store = useMemo<Store>(() => {
    const ensureDocument = async (projectId: string): Promise<DocumentContent | null> => {
      const existing = documents[projectId];
      if (existing) return existing;
      const project = projects.find((p) => p.id === projectId);
      if (!project || !userId) return null;
      const sections: Section[] = (outlineByType[project.type] ?? []).map((title) => ({
        id: crypto.randomUUID(),
        title,
        blocks: [],
      }));
      const doc = await documentsApi.create(userId, projectId, sections);
      if (!doc) return null;
      setDocuments((d) => ({ ...d, [projectId]: doc }));
      return doc;
    };

    const mapSections = async (
      projectId: string,
      fn: (sections: Section[]) => Section[],
    ): Promise<void> => {
      const doc = documents[projectId];
      if (!doc) return;
      await persistSections(projectId, fn(doc.sections));
    };

    return {
      user,
      ready,
      loading,
      projects,
      sourceFiles,
      documents,
      exports,
      credits,

      signIn: (email, password) => authApi.signIn(email, password),
*** unused
      signUp: (input) => authApi.signUp(input),
      signInWithGoogle: () => authApi.signInWithGoogle(),
      sendPasswordReset: (email) => authApi.sendPasswordReset(email),
      logout: () => authApi.signOut(),

      updateProfile: async (patch) => {
        if (!userId) return "Session expirée.";
        const error = await profileApi.update(userId, patch);
        if (error) return error;
        setUser((u) => (u ? { ...u, ...patch } : u));
        return null;
      },

      uploadAvatar: async (file) => {
        if (!userId) return "Session expirée.";
        const result = await profileApi.uploadAvatar(userId, file, avatarPath.current);
        if ("error" in result) return result.error;
        avatarPath.current = result.path;
        setUser((u) => (u ? { ...u, avatarUrl: result.url } : u));
        return null;
      },

      changePassword: async (current, next) => {
        if (!user?.email) return "Session expirée.";
        if (next.length < 8) return "Le nouveau mot de passe doit faire 8 caractères minimum.";
        return authApi.changePassword(user.email, current, next);
      },

      createProject: async (input) => {
        if (!userId) return null;
        const project = await projectsApi.create(userId, input);
        if (!project) return null;
        setProjects((p) => [project, ...p]);
        return project;
      },

      deleteProject: async (projectId) => {
        await projectsApi.remove(projectId);
        setProjects((p) => p.filter((x) => x.id !== projectId));
        setSourceFiles((s) => s.filter((f) => f.projectId !== projectId));
        setDocuments((d) => {
          const copy = { ...d };
          delete copy[projectId];
          return copy;
        });
      },

      addSourceFile: async (projectId, file, description) => {
        if (!userId) return "Session expirée.";
        const result = await sourcesApi.add(userId, projectId, file, description);
        if ("error" in result) return result.error;
        setSourceFiles((s) => [...s, result.file]);
        return null;
      },

      updateSourceFileDescription: async (fileId, description) => {
        setSourceFiles((s) => s.map((f) => (f.id === fileId ? { ...f, description } : f)));
        await sourcesApi.updateDescription(fileId, description);
      },

      removeSourceFile: async (fileId) => {
        await sourcesApi.remove(fileId);
        setSourceFiles((s) => s.filter((f) => f.id !== fileId));
      },

      generateOutline: async (projectId) => {
        const project = projects.find((p) => p.id === projectId);
        if (!project) return "Projet introuvable.";

        // Coût variable pour la correction : il dépend du volume de texte fourni.
        const sourceWords = sourceFiles
          .filter((f) => f.projectId === projectId)
          .reduce((n, f) => n + (f.extractedText ?? "").split(/\s+/).filter(Boolean).length, 0);
        const cost = generationCreditCost(project.type, sourceWords, settings.tokensPerCredit);

        if (userId && cost > 0) {
          if (credits.balance < cost)
            return `Crédits insuffisants : ${cost} crédits nécessaires, ${credits.balance} disponibles.`;
        }

        const doc = await ensureDocument(projectId);
        if (!doc) return "Génération impossible.";
        await projectsApi.setStatus(projectId, "plan_pret");
        setProjects((ps) =>
          ps.map((p) => (p.id === projectId ? { ...p, status: "plan_pret" } : p)),
        );

        if (userId && cost > 0) {
          await creditsApi.adjust(
            userId,
            -cost,
            `${project.type === "correction" ? "Correction" : "Génération"} — ${project.title}`,
            credits.balance,
          );
          await refreshCredits(userId);
        }
        return null;
      },

      updateSections: (projectId, sections) => persistSections(projectId, sections),

      regenerateSection: (projectId, sectionId) =>
        mapSections(projectId, (sections) =>
          sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  blocks:
                    s.blocks.length > 0 ? s.blocks : [{ kind: "paragraph" as const, text: "" }],
                }
              : s,
          ),
        ),

      updateSectionTitle: (projectId, sectionId, title) =>
        mapSections(projectId, (sections) =>
          sections.map((s) => (s.id === sectionId ? { ...s, title } : s)),
        ),

      updateSectionDescription: (projectId, sectionId, description) =>
        mapSections(projectId, (sections) =>
          sections.map((s) => (s.id === sectionId ? { ...s, description } : s)),
        ),

      updateSectionParagraph: (projectId, sectionId, blockIndex, text) =>
        mapSections(projectId, (sections) =>
          sections.map((s) =>
            s.id === sectionId
              ? {
                  ...s,
                  blocks: s.blocks.map((b, i) =>
                    i === blockIndex && b.kind === "paragraph" ? { ...b, text } : b,
                  ),
                }
              : s,
          ),
        ),

      updateSectionBlocks: (projectId, sectionId, blocks) =>
        mapSections(projectId, (sections) =>
          sections.map((s) => (s.id === sectionId ? { ...s, blocks } : s)),
        ),

      listVersions: async (projectId) => {
        const doc = documents[projectId];
        if (!doc) return [];
        return documentsApi.listVersions(doc.id);
      },

      saveVersion: async (projectId, label) => {
        const doc = documents[projectId];
        if (!doc || !userId) return "Aucun document à enregistrer.";
        const nextVersion = doc.version + 1;
        const error = await documentsApi.saveVersion(
          userId,
          doc.id,
          nextVersion,
          label || `Version ${nextVersion}`,
          doc.sections,
        );
        if (error) return error;
        setDocuments((d) => ({ ...d, [projectId]: { ...doc, version: nextVersion } }));
        return null;
      },

      restoreVersion: async (projectId, version) => {
        const doc = documents[projectId];
        if (!doc) return "Aucun document.";
        const sections = await documentsApi.getVersionSections(doc.id, version);
        if (!sections) return "Version introuvable.";
        await persistSections(projectId, sections);
        return null;
      },

      requestExport: async (projectId, format) => {
        if (!userId) return "Session expirée.";
        const doc = documents[projectId];
        const project = projects.find((p) => p.id === projectId);
        if (!doc || !project) return "Générez d'abord le plan du document.";

        const created = await exportsApi.createJob(userId, doc.id, format);
        if ("error" in created) return created.error;
        const job = created.job;
        setExports((e) => [job, ...e]);

        const result = await exportsApi.runJob(userId, job.id, format, {
          title: project.title,
          description: project.description,
          type: project.type,
          author: user?.name,
          sections: doc.sections,
        });

        if ("error" in result) {
          setExports((e) =>
            e.map((j) =>
              j.id === job.id ? { ...j, status: "echec", errorMessage: result.error } : j,
            ),
          );
          return result.error;
        }

        setExports((e) =>
          e.map((j) =>
            j.id === job.id
              ? { ...j, status: "pret", fileUrl: result.path, errorMessage: undefined }
              : j,
          ),
        );
        await creditsApi.adjust(
          userId,
          -exportCreditCost(settings.tokensPerCredit),
          `Export ${format.toUpperCase()} — ${project.title}`,
          credits.balance,
        );
        await refreshCredits(userId);
        return null;
      },

      retryExport: async (exportId): Promise<string | null> => {
        const job = exports.find((j) => j.id === exportId);
        if (!job) return "Export introuvable.";
        const entry = Object.values(documents).find((d) => d.id === job.documentId);
        if (!entry) return "Document introuvable.";
        await exportsApi.remove(exportId, job.fileUrl);
        setExports((e) => e.filter((j) => j.id !== exportId));
        return value.requestExport(entry.projectId, job.format);
      },

      downloadExport: async (exportId) => {
        const job = exports.find((j) => j.id === exportId);
        if (!job?.fileUrl) return "Fichier indisponible.";
        return exportsApi.download(job.fileUrl);
      },

      deleteExport: async (exportId) => {
        const job = exports.find((j) => j.id === exportId);
        await exportsApi.remove(exportId, job?.fileUrl);
        setExports((e) => e.filter((j) => j.id !== exportId));
      },

      purchaseCredits: async (packSize) => {
        if (!userId) return;
        await creditsApi.adjust(
          userId,
          packSize,
          `Achat — Pack ${packSize} crédits`,
          credits.balance,
        );
        await refreshCredits(userId);
      },
    };
  }, [
    user,
    userId,
    ready,
    loading,
    projects,
    sourceFiles,
    documents,
    exports,
    credits,
      settings,
    persistSections,
    refreshCredits,
  ]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export { typeLabels };
