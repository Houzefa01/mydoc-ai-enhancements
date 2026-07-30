// Champs de cadrage ("brief") demandés selon le type de document.
// Tous les champs sont optionnels sauf ceux marqués required.
import type { DocumentType } from "@/backend/types";

export interface BriefField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
  multiline?: boolean;
}

export const briefFields: Record<DocumentType, BriefField[]> = {
  rapport: [
    {
      key: "sujet",
      label: "Le sujet",
      placeholder: "De quoi traite le rapport ?",
      required: true,
    },
    {
      key: "donnees",
      label: "Les données",
      placeholder: "Chiffres, sources internes, périmètre…",
      multiline: true,
    },
    {
      key: "resultats",
      label: "Les résultats obtenus",
      placeholder: "Ce que montrent les données.",
      multiline: true,
    },
    {
      key: "objectifs",
      label: "Les objectifs",
      placeholder: "Ce que le rapport doit démontrer ou décider.",
      multiline: true,
    },
  ],
  resume: [
    {
      key: "document",
      label: "Le document complet à résumer",
      placeholder: "Collez ici le texte intégral, ou décrivez le fichier chargé plus bas.",
      required: true,
      multiline: true,
    },
  ],
  memoire: [
    {
      key: "sujet",
      label: "Le sujet",
      placeholder: "Intitulé du mémoire.",
      required: true,
    },
    {
      key: "problematique",
      label: "La problématique",
      placeholder: "La question de recherche.",
      required: true,
      multiline: true,
    },
    {
      key: "consignes",
      label: "Les consignes de l'établissement",
      placeholder: "Nombre de pages, normes de citation, structure imposée…",
      multiline: true,
    },
    {
      key: "sources",
      label: "Les sources",
      placeholder: "Bibliographie, auteurs de référence…",
      multiline: true,
    },
    {
      key: "donneesRecherche",
      label: "Les données de recherche",
      placeholder: "Enquêtes, entretiens, corpus, mesures…",
      multiline: true,
    },
  ],
  presentation: [
    {
      key: "sujet",
      label: "Le sujet",
      placeholder: "Thème de la présentation.",
      required: true,
    },
    {
      key: "public",
      label: "Le public visé",
      placeholder: "Comité de direction, étudiants, clients…",
    },
    { key: "duree", label: "La durée", placeholder: "Ex. 20 minutes" },
    {
      key: "points",
      label: "Les points à aborder",
      placeholder: "Un point par ligne.",
      multiline: true,
    },
  ],
  correction: [
    {
      key: "consignes",
      label: "Ce qui doit être corrigé",
      placeholder: "Orthographe, grammaire, style, cohérence… précisez vos priorités.",
      required: true,
      multiline: true,
    },
    {
      key: "ton",
      label: "Le ton à conserver",
      placeholder: "Ex. académique, professionnel, neutre.",
    },
    {
      key: "contraintes",
      label: "Contraintes à respecter",
      placeholder: "Terminologie imposée, passages à ne pas modifier…",
      multiline: true,
    },
  ],
  cv: [
    {
      key: "infos",
      label: "Vos informations personnelles",
      placeholder: "Nom, coordonnées, titre professionnel…",
      required: true,
      multiline: true,
    },
    {
      key: "etudes",
      label: "Études",
      placeholder: "Diplômes, établissements, années.",
      multiline: true,
    },
    {
      key: "experiences",
      label: "Expériences",
      placeholder: "Postes, entreprises, missions, résultats.",
      multiline: true,
    },
    {
      key: "competences",
      label: "Compétences",
      placeholder: "Techniques, outils, savoir-faire.",
      multiline: true,
    },
    { key: "langues", label: "Langues", placeholder: "Ex. Anglais C1, Espagnol B2" },
    {
      key: "certifications",
      label: "Certifications",
      placeholder: "Titres, organismes, dates.",
      multiline: true,
    },
  ],
  lettre_motivation: [
    {
      key: "cv",
      label: "Votre CV",
      placeholder: "Collez le contenu de votre CV, ou chargez-le en source.",
      required: true,
      multiline: true,
    },
    {
      key: "offre",
      label: "L'offre d'emploi (ou la formation)",
      placeholder: "Intitulé et contenu de l'annonce.",
      required: true,
      multiline: true,
    },
    {
      key: "organisation",
      label: "L'entreprise ou l'établissement visé",
      placeholder: "Nom, activité, éléments qui vous attirent.",
      multiline: true,
    },
  ],
  lettre_demande: [
    {
      key: "destinataire",
      label: "Le destinataire",
      placeholder: "Nom, fonction, organisation.",
      required: true,
    },
    {
      key: "objet",
      label: "L'objet de la demande",
      placeholder: "Ex. Demande de stage, de délai, d'attestation…",
      required: true,
    },
    {
      key: "raisons",
      label: "Les raisons",
      placeholder: "Pourquoi vous formulez cette demande.",
      multiline: true,
    },
    {
      key: "infos",
      label: "Informations utiles",
      placeholder: "Références de dossier, dates, pièces jointes…",
      multiline: true,
    },
  ],
};
