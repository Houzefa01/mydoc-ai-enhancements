# Document Craft

Construis le FRONTEND UNIQUEMENT de "myDoc IA", une plateforme web qui génère des rapports, résumés, mémoires et présentations à partir des besoins de l'utilisateur, éditables puis exportables en PDF, DOCX, PPTX, LaTeX et Beamer.

## Périmètre : frontend seul, backend à brancher plus tard

Aucune vraie logique serveur. Utilise des données mockées en state local (JSON structuré exactement comme ci-dessous, pour que le backend puisse être branché sans tout refaire) et commente clairement chaque endroit où un appel API réel viendra plus tard, par exemple :

// BACKEND: POST /api/projects — créer un projet

// BACKEND: GET /api/projects/:id/outline — récupérer le plan généré par l'IA

// BACKEND: WebSocket ou polling — statut d'un export en cours

Modèle de données à respecter dans les mocks :

- User (id, email, name)

- Project (id, title, description, type: rapport|résumé|mémoire|présentation, status)

- SourceFile (id, projectId, fileName, extractedText, type)

- Document (id, projectId, contentJson: liste de sections {titre, paragraphes, listes, images, tableaux}, version)

- Export (id, documentId, format: pdf|docx|pptx|latex|beamer, status: en_attente|en_cours|prêt|échec, fileUrl)

- CreditBalance (solde actuel)

## Direction visuelle — à suivre précisément, ne pas dévier vers un style SaaS générique

Éviter absolument : fond crème + serif haute-contraste + accent terracotta ; fond quasi-noir + accent néon vert/vermillon ; mise en page façon journal à colonnes avec filets fins. Ce sont les trois styles par défaut de tout générateur IA — le produit doit avoir l'air conçu par un studio de design pour ce produit précis, pas par un template.

Direction proposée (à respecter ou à faire évoluer dans le même esprit) : esthétique "atelier d'écriture / papeterie moderne" — le produit parle de structurer et fabriquer des documents, le design doit le refléter.

- Palette : fond papier légèrement chaud #F7F5F0, encre presque noire #1C1B19 pour le texte principal, accent principal bleu-encre profond #1F3A3D (boutons primaires, liens actifs), accent secondaire laiton discret #A3805A utilisé UNIQUEMENT pour les éléments liés aux crédits/facturation (pour bien les distinguer visuellement du reste)

- Typographie : une serif éditoriale avec du caractère pour les titres (ex. Fraunces ou Source Serif 4), une sans-serif humaniste sobre pour le corps de texte (ex. Inter ou Public Sans), une monospace pour tout ce qui est chiffré (compteur de crédits, tokens, métadonnées de fichiers) — ex. IBM Plex Mono

- Layout : grille structurée qui évoque les marges d'un document (colonnes visibles, respiration généreuse), pas des cartes dashboard génériques empilées

- Élément signature : dans l'éditeur, un mini plan/sommaire vivant dans la colonne latérale qui reflète en temps réel la structure du document en cours d'édition (titres de sections cliquables, réordonnables) — c'est LE composant qui doit se distinguer, garder le reste du produit sobre autour

Icônes : utiliser lucide-react exclusivement pour toute icône (statuts, actions, types de fichiers, formats d'export). Aucun emoji nulle part dans l'interface, y compris dans les messages d'état ou les notifications.

## Pages et flux à construire

1. **Connexion / Inscription** — email+mot de passe, bouton "Continuer avec Google" (visuel, non fonctionnel)

2. **Tableau de bord** — liste des projets (titre, type, statut, date), solde de crédits visible en permanence dans le header, bouton "Nouveau projet" bien visible, état vide soigné pour un compte sans projet ("Aucun projet pour l'instant — crée le premier document" plutôt qu'un message générique)

3. **Création de projet** — titre, description, sélection du type de document (rapport/résumé/mémoire/présentation), zone de dépôt de fichiers sources (PDF/DOCX/TXT/images) avec liste des fichiers uploadés et leur statut d'extraction

4. **Validation du plan** — l'IA propose une structure de sections ; l'utilisateur peut réordonner (drag & drop), renommer, supprimer, ajouter une section avant de valider et lancer la rédaction

5. **Éditeur** — éditeur riche (titres, listes, images, tableaux) avec le mini-sommaire vivant en colonne latérale (l'élément signature), indicateur de génération en cours par section (streaming simulé), bouton de régénération par section

6. **Export** — sélection d'un ou plusieurs formats (PDF/DOCX/PPTX/LaTeX/Beamer) avec icônes distinctes par format, statut de génération par export (en attente/en cours/prêt/échec avec message clair et action de reprise), téléchargement une fois prêt

7. **Historique** — liste des versions d'un document, comparaison simple

8. **Paramètres du compte** — infos du profil, solde de crédits détaillé, historique des transactions de crédits, boutons d'achat de packs (visuel uniquement, mock Stripe)

## Ton et rédaction de l'interface

Langage actif et concret, jamais de jargon technique exposé à l'utilisateur (jamais "webhook", "job", "payload" — dire "génération en cours", "document prêt"). Les messages d'erreur expliquent ce qui s'est passé et quoi faire, sans s'excuser. Les écrans vides sont des invitations à agir, pas des messages neutres. Cohérence du vocabulaire : si un bouton dit "Générer", la confirmation dit "Génération lancée", pas "Traitement en cours".

## Exigences techniques

Responsive jusqu'au mobile, focus clavier visible partout, respect de prefers-reduced-motion, animations discrètes et déliberées seulement (pas d'effets décoratifs superflus).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/8cc8584b-0395-441f-9f86-66335e569528).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
