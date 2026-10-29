# myDoc IA — version la plus avancée

Plateforme web de **rédaction assistée par IA** : à partir des besoins de l'utilisateur
et de ses fichiers sources, elle génère des **rapports, résumés, mémoires et présentations**
(ainsi que CV et lettres), éditables, puis exportables en **PDF, DOCX, PPTX, LaTeX et Beamer**.
Modèle économique à **crédits**, consommés à la génération et à l'export.

## Stack

| Couche | Technologie |
|---|---|
| Framework | TanStack Start (React 19, SSR + server functions), TanStack Router (routage par fichiers) |
| UI | Tailwind CSS 4, Radix UI / shadcn, lucide-react |
| Données | Supabase (Postgres, Auth, migrations dans `supabase/`) |
| Build | Vite, TypeScript strict |

## Parcours

Connexion → tableau de bord des projets → **nouveau projet** (type, sources) →
**plan** généré par l'IA → **éditeur** avec sommaire vivant → **historique** des versions →
**export**. Pages `settings` et solde de crédits.
Espace **administration** (utilisateurs, exports, paramètres et rôles).

## Statut

Version la plus avancée du projet (après `document-craft` et
`remix-of-remix-of-document-craft`) : backend applicatif dans `src/backend/` (auth, projets,
sources, plans, documents, exports, crédits, rôles, IA côté serveur), migrations Supabase
et rôles administrateur.

`AUDIT-COMPLET.md` décrit précisément ce qui fonctionne, ce qui est encore simulé et la
liste ordonnée des travaux restants. Le cahier des charges d'origine est dans
`PROMPT_INITIAL.md`.

## Lancement

```bash
npm install
npm run dev
```

Variables (fichier `.env`) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`,
`VITE_SUPABASE_PROJECT_ID`.
