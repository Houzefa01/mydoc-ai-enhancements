# Audit complet & dossier de reprise — myDoc IA

> Document de passation destiné à un agent externe (DeepSeek) chargé de **terminer** le projet.
> Il décrit l'état réel du code au 6 août 2026, ce qui fonctionne, ce qui est simulé,
> et la liste ordonnée des travaux restants avec les fichiers exacts à modifier.

---

## 1. Identité du produit

Application web de **rédaction assistée de documents** (rapport, résumé, mémoire, présentation,
CV, lettre de motivation, lettre de demande) et de **correction** de documents fournis par
l'utilisateur. Interface en français. Modèle économique : **crédits** consommés à la génération
et à l'export, rechargés par achat.

---

## 2. Pile technique

| Couche | Technologie |
|---|---|
| Framework | TanStack Start v1 (React 19, SSR + server functions) |
| Build | Vite 8, TypeScript 5.8 strict |
| Routage | TanStack Router — routage par fichiers dans `src/routes/` (`src/routeTree.gen.ts` est généré, ne jamais l'éditer) |
| État client | Contexte React unique — `src/lib/store.tsx` |
| Données | PostgreSQL 17.6 (Lovable Cloud / Supabase : API REST auto-générée, Auth, Storage) |
| UI | Tailwind CSS v4 (`src/styles.css`, tokens sémantiques) + shadcn/ui (`src/components/ui/`) |
| Notifications | `sonner` |
| Extraction de texte | `pdfjs-dist` (PDF), `mammoth` (DOCX) — **côté navigateur** |
| Exports | Génération de fichiers côté navigateur — `src/lib/exporters.ts`, `src/lib/zip.ts` |

Contraintes d'exécution serveur : le runtime est un **Worker edge (Cloudflare workerd)**.
Interdits en server function : `child_process`, `sharp`, `canvas`, `puppeteer`, tout binaire natif.
Autorisés : `fetch`, `crypto`, `Buffer`, `stream`, `path`, `zlib`.

---

## 3. Cartographie du code

```text
src/
  backend/            <- TOUTE la logique de données. L'UI n'appelle jamais la base directement.
    types.ts            types métier (DocumentType, Section, ExportJob, ...)
    mappers.ts          conversion ligne SQL (snake_case) -> objet métier (camelCase)
    auth.api.ts         inscription enrichie, connexion, déconnexion
    profile.api.ts      lecture/écriture du profil, avatar
    projects.api.ts     CRUD projets
    sources.api.ts      téléversement fichiers + appel extraction + extracted_text
    documents.api.ts    documents et versions (sections en jsonb)
    exports.api.ts      jobs d'export, upload vers le bucket, téléchargement signé
    credits.api.ts      solde et écriture des transactions
    roles.api.ts        lecture du rôle courant
    settings.api.ts     lecture des paramètres système côté client
    outlines.ts         PLANS TYPES STATIQUES par type de document
    admin.functions.ts  server functions admin (utilisateurs, crédits, exports, stats)
    settings.functions.ts server functions admin (tarifs, modèle IA, clés d'API)
    ai.server.ts        abstraction fournisseur IA — SERVEUR UNIQUEMENT
  lib/
    store.tsx           contexte applicatif (507 lignes) : orchestre backend/ + état UI
    creditCosts.ts      SOURCE UNIQUE des coûts (en tokens -> crédits)
    extractText.ts      extraction PDF / DOCX / TXT
    documentBriefs.ts   champs de brief par type de document
    labels.ts           libellés FR des types et statuts
    exporters.ts        construction des fichiers (docx, pdf, md, txt, html...)
    useSessionReady.ts  attend l'hydratation de la session avant les appels protégés
  routes/
    index.tsx           landing + auth (connexion / inscription)
    dashboard.tsx       liste des projets, filtres
    projects.new.tsx    création de projet, upload sources, estimation du coût
    projects.$id.plan.tsx / .editor.tsx / .history.tsx / .export.tsx
    settings.tsx        profil, crédits, achat (simulé)
    admin.tsx           layout admin + garde de rôle (ssr: false)
    admin.index.tsx     statistiques 30 jours
    admin.users.tsx     utilisateurs, ajustement crédits, suspension
    admin.exports.tsx   exports en échec + relance
    admin.settings.tsx  tarification, modèle IA, clés d'API, audit
  integrations/supabase/  GÉNÉRÉ — ne jamais modifier
```

**Règle d'architecture à respecter absolument** : aucune requête base de données dans `src/routes/`
ou `src/components/`. Tout passe par `src/backend/`, exposé à l'UI via `src/lib/store.tsx`.

---

## 4. Schéma de base de données

Toutes les tables sont dans `public`, avec **RLS activée** et `GRANT` explicites.

| Table | Rôle | Politique |
|---|---|---|
| `profiles` | profil étendu (nom, tél., adresse, ville, pays, bio, `suspended`) | propriétaire (`id = auth.uid()`) |
| `user_roles` | rôles (`app_role` = `user` \| `admin`) | lecture de son propre rôle ; écriture interdite au client |
| `credits` | solde par utilisateur | propriétaire |
| `credit_transactions` | historique des mouvements | propriétaire |
| `projects` | projet (titre, type, statut, `brief` jsonb) | propriétaire |
| `source_files` | fichiers sources + `extracted_text` | propriétaire |
| `documents` | document courant (`sections` jsonb, `version`) | propriétaire |
| `document_versions` | historique des versions | propriétaire |
| `export_jobs` | jobs d'export (`format`, `status`, `file_url`, `error_message`) | propriétaire |
| `system_settings` | ligne unique globale (tokens/crédit, prix, fournisseur, modèle) | lecture authentifiée, écriture admin uniquement |
| `system_settings_history` | audit des modifications de réglages et des tests de clés | lecture admin |
| `provider_api_keys` | clés d'API des fournisseurs | **aucun accès client** — `service_role` seulement |

Fonctions : `has_role(uuid, app_role)` (SECURITY DEFINER, utilisée par les politiques),
`handle_new_user()` (crée profil + rôle `user` + 100 crédits de bienvenue), `set_updated_at()`.

Buckets de stockage privés : `avatars`, `sources`, `exports` — accès restreint au dossier `uid/*`,
téléchargement par URL signée.

---

## 5. Modèle de coût (source unique : `src/lib/creditCosts.ts`)

Les coûts sont exprimés en **tokens**, puis convertis en crédits :
`crédits = ceil(tokens / tokens_par_crédit)` — `tokens_par_crédit` vient de `system_settings`
(modifiable par l'admin, défaut 8 000).

```
rapport 40 000 · mémoire 64 000 · présentation 32 000 · résumé 24 000 · CV 24 000
lettres 16 000 · correction 16 000 + 8 000 par tranche de 1 000 mots entamée
export 8 000 (tous formats)
```

`sourceWordCount()` est la formule partagée entre l'estimation affichée avant génération
(`projects.new.tsx`) et le décompte final (`store.tsx`). **Toute nouvelle logique de coût doit
passer par ce fichier — ne jamais coder un nombre de crédits en dur ailleurs.**

---

## 6. Sécurité — état actuel

Acquis :
- RLS par propriétaire sur toutes les tables utilisateur, `GRANT` cohérents avec les politiques.
- Rôles dans une table dédiée (`user_roles`), jamais sur `profiles` — pas d'escalade de privilège.
- `EXECUTE` révoqué pour `public`/`authenticated` sur les fonctions `SECURITY DEFINER`.
- Les clés d'API ne quittent jamais le serveur : l'UI ne reçoit qu'un aperçu masqué `••••1234`.
- Test de clé côté serveur, résultat tracé dans l'audit sans exposer la valeur.
- Buckets privés, chemins préfixés par l'`uid`.
- Comptes suspendus bloqués par un écran dédié dans `AppShell`.

Points de vigilance pour la suite :
- La suspension est aujourd'hui appliquée **côté UI**. Elle doit aussi être appliquée côté serveur
  (refus dans les server functions de génération/export) avant mise en production.
- `admin.tsx` est en `ssr: false` : la garde de rôle est côté client. Elle est doublée par les
  politiques RLS côté base, mais chaque nouvelle server function admin doit revérifier
  `has_role(auth.uid(), 'admin')` côté serveur.

---

## 7. Ce qui fonctionne réellement

- Inscription enrichie, connexion, déconnexion, session hydratée, thème clair/sombre.
- Création de projet, brief par type, téléversement de sources, extraction PDF/DOCX/TXT vérifiée.
- Estimation du coût de correction affichée avant génération (mots extraits × formule).
- Débit de crédits, historique des transactions, blocage si solde insuffisant.
- Éditeur de blocs, versions, historique, restauration.
- Export multi-formats construit dans le navigateur, stocké, retéléchargeable.
- Espace admin complet : statistiques 30 jours, utilisateurs (crédits + suspension),
  exports en échec + relance, paramètres système (tarifs, fournisseur, modèle, clés, audit).
- Comptes de démonstration : `admin@demo.fr` / `Admin123!` et `user@demo.fr` / `User123!`.

---

## 8. Ce qui reste à faire — plan de travail ordonné

### Tâche 1 — BRANCHER RÉELLEMENT L'IA (priorité absolue, bloquant produit)

**Constat** : `resolveGenerationConfig()` dans `src/backend/ai.server.ts` **n'est appelée nulle part**.
`store.tsx → generateOutline()` débite les crédits, change le statut du projet, mais **n'écrit aucun
contenu** : le plan vient de `src/backend/outlines.ts` (tableaux statiques). `regenerateSection()`
se contente d'insérer un paragraphe vide. Autrement dit, **l'application facture une génération
qu'elle ne produit pas**.

À faire :
1. Ajouter dans `ai.server.ts` une fonction `chatCompletion({ system, user, maxTokens })` qui
   utilise `resolveGenerationConfig()` (endpoint compatible OpenAI, `Bearer` côté serveur) et
   renvoie le texte **et** l'usage réel de tokens (`usage.prompt_tokens`, `usage.completion_tokens`).
2. Créer `src/backend/generation.functions.ts` (fichier **mince** : uniquement imports, types et
   déclarations `createServerFn` — toute logique dans un `*.server.ts` importé, sinon le
   découpage de bundle casse à l'exécution) exposant :
   - `generateOutlineFn({ projectId })` — construit le plan à partir du brief et du type.
   - `generateSectionFn({ projectId, sectionId })` — rédige une section.
   - `correctDocumentFn({ projectId })` — voir tâche 2.
   Chaque fonction : `.middleware([requireSupabaseAuth])`, vérifie la propriété du projet,
   refuse si `profiles.suspended`, vérifie le solde, appelle le modèle, écrit les sections,
   puis débite les crédits **d'après l'usage réel** renvoyé par le fournisseur.
3. Déplacer le débit de crédits de `store.tsx` vers ces server functions (le client ne doit pas
   décider du montant débité). `store.tsx` ne fait plus qu'appeler la fonction et rafraîchir l'état.
4. Prompts distincts par type de document, en français, injectant le brief
   (`src/lib/documentBriefs.ts`) et le résumé des sources.

### Tâche 2 — PROMPT DE CORRECTION

Le type `correction` a son coût, son upload obligatoire et son estimation, mais **pas son prompt**.
`correctDocumentFn` doit envoyer `source_files.extracted_text` avec une consigne de correction
(orthographe, grammaire, style, cohérence — sans réécrire le fond), respecter les champs de brief
(instructions, ton, contraintes) et renvoyer un document structuré :
texte corrigé, liste des corrections, remarques de style. Remplacer alors le squelette statique
de `outlines.ts → correction` par les sections réellement renvoyées.

### Tâche 3 — CLÉ D'API DU FOURNISSEUR

Aucune clé n'est enregistrée aujourd'hui : le bouton « Rafraîchir » et « Tester la clé » échouent
avec un message explicite. L'admin doit saisir une clé DeepSeek dans
`/admin/settings → Clés d'API des fournisseurs`. Rien à coder — c'est une action d'exploitation.
Alternative disponible sans clé : le fournisseur `lovable` déjà déclaré dans `PROVIDERS`.

### Tâche 4 — PAIEMENT DES CRÉDITS

`settings.tsx` propose l'achat de crédits mais ne fait qu'un ajustement local. À implémenter :
Stripe (checkout + webhook sous `src/routes/api/public/`, signature vérifiée, crédits ajoutés
côté serveur uniquement, transaction tracée dans `credit_transactions`). Le prix unitaire vient de
`system_settings.credit_price`.

### Tâche 5 — DURCISSEMENT SERVEUR

- Refuser génération et export pour un compte `suspended` **dans les server functions**.
- Limiter la fréquence d'appel (rate limit) sur les fonctions de génération.
- Vérifier `has_role(auth.uid(), 'admin')` côté serveur dans chaque fonction admin existante.

### Tâche 6 — EXTRACTION ROBUSTE (confort)

L'extraction est côté navigateur ; un PDF scanné sans couche texte renvoie une erreur claire mais
n'est pas exploitable. Prévoir un repli OCR via une API HTTP externe (pas de binaire natif dans le
Worker) ou un message guidant l'utilisateur.

---

## 9. Règles à respecter par l'agent qui reprend

1. Ne jamais modifier `src/routeTree.gen.ts` ni `src/integrations/supabase/*` (générés).
2. Aucun appel base de données hors de `src/backend/`.
3. Aucun coût en crédits codé en dur hors de `src/lib/creditCosts.ts`.
4. Toute création de table : `CREATE TABLE` → `GRANT` → `ENABLE ROW LEVEL SECURITY` → `CREATE POLICY`,
   dans la même migration, dans cet ordre.
5. Un fichier déclarant `createServerFn` ne contient que des imports, des types et les déclarations
   exportées — toute autre logique dans un module importé.
6. Pas de couleur en dur dans les composants (`text-white`, `bg-[#...]`) : uniquement les tokens
   sémantiques définis dans `src/styles.css`.
7. Interface entièrement en français, y compris les messages d'erreur.
8. Aucune dépendance nécessitant un binaire natif côté serveur.

---

## 10. Résumé exécutif

Le socle est solide et complet : authentification, base isolée par RLS, architecture
backend/frontend nette, espace admin fonctionnel, tarification dynamique, extraction de texte,
exports. **Le manque central est unique et critique : la génération de contenu n'est pas connectée
au modèle IA.** L'application facture aujourd'hui des crédits pour des plans statiques.
La tâche 1 puis la tâche 2 rendent le produit réellement fonctionnel ; les tâches 3 à 6 le rendent
exploitable en production.
