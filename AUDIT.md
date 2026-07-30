# Rapport d'audit — myDoc IA

Date : 30 juillet 2026

## 1. Périmètre

Audit complet de l'application : thème clair/sombre, parcours d'inscription/connexion,
séparation backend/frontend, base de données, sécurité, typage et rendu.

## 2. Problèmes trouvés et corrigés

| # | Problème | Gravité | Correction |
|---|----------|---------|-----------|
| 1 | Impossible de basculer clair/sombre : le bouton n'existait que dans l'en-tête applicatif, absent des pages d'authentification | Élevée | `ThemeToggle` ajouté sur la page de connexion/inscription ; script anti-flash conservé |
| 2 | Inscription trop pauvre (nom, e-mail, mot de passe) | Moyenne | Ajout date de naissance, téléphone, adresse, code postal, ville, pays, acceptation des CGU, longueur minimale de 8 caractères |
| 3 | Les données d'inscription n'atteignaient pas le profil | Élevée | Fonction `handle_new_user` réécrite : nom, téléphone, date de naissance, adresse, ville, code postal, pays + 100 crédits de bienvenue |
| 4 | Aucune séparation backend/frontend : un magasin monolithique de 833 lignes appelait directement la base | Élevée | Nouvelle couche `src/backend/` (auth, profil, projets, sources, documents, exports, crédits, mappers, types) ; l'UI ne contient plus aucun appel base de données |
| 5 | Données de démonstration factices mêlées aux types métier (`src/lib/mockData.ts`) | Moyenne | Fichier supprimé ; types dans `src/backend/types.ts`, libellés dans `src/lib/labels.ts` |
| 6 | Fonctions SQL exécutables par tout rôle | Élevée | `EXECUTE` révoqué sur `handle_new_user` et `set_updated_at` |
| 7 | Boutons de formulaire non désactivés pendant l'envoi (double soumission possible) | Faible | État `pending` appliqué aux deux formulaires |

## 3. Vérifications passées

- Typage TypeScript complet : aucune erreur.
- Analyse de sécurité de la base : aucun avertissement.
- RLS activée avec politiques par propriétaire (`auth.uid()`) sur toutes les tables ; GRANT présents.
- Buckets `avatars`, `sources`, `exports` privés, accès par URL signée.
- Parcours testé en navigateur : bascule sombre OK, inscription enrichie affichée, connexion démo OK,
  redirection vers `/dashboard`, solde de 100 crédits, aucune erreur console.
- SEO : titres/descriptions/OG uniques par route, une seule balise H1, langue `fr`.

## 4. Points restants (hors correction)

- La génération de contenu est encore structurelle (plans types) : le branchement au modèle IA reste à faire.
- L'extraction de texte des sources téléversées n'est pas encore implémentée.
- Aucun paiement réel derrière l'achat de crédits.

## 5. Compte de démonstration

- E-mail : `demo@mydoc-ia.app`
- Mot de passe : `MyDocDemo!2026`
