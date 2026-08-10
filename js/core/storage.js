/* ============================================
   HonoPs — Gestion du stockage local
   Trois espaces strictement séparés :
   1. séance en cours (reprise après fermeture)
   2. historique des séances terminées
   3. préférences utilisateur (son, etc.)
   Aucune logique métier ici : uniquement lecture/écriture.
   ============================================ */

const CLE_SEANCE_EN_COURS = "honops_seance_en_cours";
const CLE_HISTORIQUE = "honops_historique";
const CLE_PREFERENCES = "honops_preferences";

/* ---------- Utilitaires internes ---------- */

function lireJSON(cle) {
  try {
    const brut = localStorage.getItem(cle);
    if (!brut) return null;
    return JSON.parse(brut);
  } catch (erreur) {
    console.error(`HonoPs storage: lecture impossible pour "${cle}"`, erreur);
    return null;
  }
}

function ecrireJSON(cle, valeur) {
  try {
    localStorage.setItem(cle, JSON.stringify(valeur));
    return true;
  } catch (erreur) {
    console.error(`HonoPs storage: écriture impossible pour "${cle}"`, erreur);
    return false;
  }
}

/* ============================================
   1. Séance en cours
   ============================================ */

/**
 * Sauvegarde l'état complet de la séance en cours.
 * Doit être appelé après CHAQUE transition importante
 * (pas seulement à la fin), pour garantir une reprise fiable.
 */
export function sauvegarderSeance(etat) {
  const etatAvecHorodatage = {
    ...etat,
    derniereMaj: Date.now()
  };
  return ecrireJSON(CLE_SEANCE_EN_COURS, etatAvecHorodatage);
}

/**
 * Charge la séance en cours sauvegardée, ou null si aucune.
 */
export function chargerSeance() {
  return lireJSON(CLE_SEANCE_EN_COURS);
}

/**
 * Supprime la séance en cours (abandon volontaire ou séance terminée).
 */
export function effacerSeance() {
  try {
    localStorage.removeItem(CLE_SEANCE_EN_COURS);
    return true;
  } catch (erreur) {
    console.error("HonoPs storage: impossible d'effacer la séance en cours", erreur);
    return false;
  }
}

/* ============================================
   2. Historique des séances terminées
   ============================================ */

/**
 * Ajoute une entrée à l'historique lorsqu'une séance est terminée.
 * entree attendue : { jour, seanceKey, date, exercicesEffectues, exercicesTotal }
 */
export function ajouterEntreeHistorique(entree) {
  const historique = obtenirHistorique();
  historique.push(entree);
  return ecrireJSON(CLE_HISTORIQUE, historique);
}

/**
 * Retourne le tableau complet de l'historique (vide par défaut).
 */
export function obtenirHistorique() {
  const historique = lireJSON(CLE_HISTORIQUE);
  return Array.isArray(historique) ? historique : [];
}

/**
 * Nombre total de séances effectuées (pour affichage "Séances effectuées : X").
 */
export function obtenirNombreSeancesEffectuees() {
  return obtenirHistorique().length;
}

/**
 * Retourne la dernière séance effectuée, ou null.
 */
export function obtenirDerniereSeance() {
  const historique = obtenirHistorique();
  return historique.length > 0 ? historique[historique.length - 1] : null;
}

/* ============================================
   3. Préférences utilisateur
   ============================================ */

const PREFERENCES_PAR_DEFAUT = {
  sonActif: true
};

/**
 * Retourne les préférences actuelles, complétées par les valeurs
 * par défaut si certaines clés sont absentes.
 */
export function chargerPreferences() {
  const preferences = lireJSON(CLE_PREFERENCES);
  return { ...PREFERENCES_PAR_DEFAUT, ...(preferences || {}) };
}

/**
 * Sauvegarde des préférences (fusionnées avec les valeurs existantes).
 */
export function sauvegarderPreferences(preferencesPartielles) {
  const preferencesActuelles = chargerPreferences();
  const nouvellesPreferences = { ...preferencesActuelles, ...preferencesPartielles };
  return ecrireJSON(CLE_PREFERENCES, nouvellesPreferences);
  }
