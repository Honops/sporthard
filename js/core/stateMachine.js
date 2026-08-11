/* ============================================
   HonoPs — Machine à états de la séance
   Orchestration pure : aucune manipulation du DOM.
   États : IDLE → EXERCICE_ACTIF → REPOS → EXERCICE_ACTIF → ... → SEANCE_TERMINEE
   ============================================ */

import { EXERCICES } from "../data/exercices.js";
import { SEANCES, PROGRAMME_SEMAINE } from "../data/programme.js";
import * as storage from "./storage.js";
import { creerTimer } from "./timer.js";

export const STATUTS = {
  IDLE: "IDLE",
  EXERCICE_ACTIF: "EXERCICE_ACTIF",
  REPOS: "REPOS",
  SEANCE_TERMINEE: "SEANCE_TERMINEE"
};

/* ---------- État interne du module ---------- */

let etatActuel = null;
let minuteur = null;
let callbackChangement = null;

/* ---------- Utilitaires internes ---------- */

function trouverExercice(id) {
  return EXERCICES.find((exercice) => exercice.id === id) || null;
}

function obtenirIdsExercicesDuJour(jour) {
  const seanceKey = PROGRAMME_SEMAINE[jour];
  if (!seanceKey) return null; // jour de repos
  const seance = SEANCES[seanceKey];
  return { seanceKey, exercicesIds: seance.exercices };
}

/**
 * Construit l'état initial d'une nouvelle séance pour un jour donné.
 * Retourne null si le jour est un jour de repos (pas de séance).
 */
function creerEtatInitial(jour) {
  const infosJour = obtenirIdsExercicesDuJour(jour);
  if (!infosJour) return null;

  const { seanceKey, exercicesIds } = infosJour;
  const premierExercice = trouverExercice(exercicesIds[0]);
  const maintenant = Date.now();

  return {
    jour,
    seanceKey,
    exercicesIds,
    exerciceIndex: 0,
    statut: STATUTS.EXERCICE_ACTIF,
    phaseEndTimestamp:
      premierExercice.type === "temps"
        ? maintenant + premierExercice.valeur * 1000
        : null,
    exercicesValides: new Array(exercicesIds.length).fill(false),
    demarreLe: maintenant,
    derniereMaj: maintenant
  };
}

/**
 * Fonction PURE et centrale : calcule l'état suivant à partir de l'état
 * actuel et d'un "instant de référence" (le moment où la phase se termine).
 *
 * Utilisée à la fois :
 * - en temps réel (instantReference = Date.now()) lors d'une validation
 *   ou d'une expiration de timer normale ;
 * - en cascade lors d'une reprise après absence, où instantReference
 *   est chaîné d'une phase à l'autre pour éviter toute dérive.
 */
function avancerPhase(etat, instantReference) {
  const exerciceCourant = trouverExercice(etat.exercicesIds[etat.exerciceIndex]);

  if (etat.statut === STATUTS.EXERCICE_ACTIF) {
    const exercicesValides = [...etat.exercicesValides];
    exercicesValides[etat.exerciceIndex] = true;

    const estDernierExercice = etat.exerciceIndex >= etat.exercicesIds.length - 1;

    if (estDernierExercice) {
      return {
        ...etat,
        exercicesValides,
        statut: STATUTS.SEANCE_TERMINEE,
        phaseEndTimestamp: null
      };
    }

    return {
      ...etat,
      exercicesValides,
      statut: STATUTS.REPOS,
      phaseEndTimestamp: instantReference + exerciceCourant.repos * 1000
    };
  }

  if (etat.statut === STATUTS.REPOS) {
    const indexSuivant = etat.exerciceIndex + 1;
    const exerciceSuivant = trouverExercice(etat.exercicesIds[indexSuivant]);

    return {
      ...etat,
      exerciceIndex: indexSuivant,
      statut: STATUTS.EXERCICE_ACTIF,
      phaseEndTimestamp:
        exerciceSuivant.type === "temps"
          ? instantReference + exerciceSuivant.valeur * 1000
          : null
    };
  }

  return etat; // SEANCE_TERMINEE : rien à avancer
}

/**
 * Recalcule en cascade l'état réel d'une séance sauvegardée, en tenant
 * compte de tout le temps écoulé pendant l'absence (fermeture, veille...).
 * Avance phase par phase, en chaînant les timestamps, jusqu'à retomber
 * sur une phase encore active, une phase en attente de validation
 * (répétitions), ou la fin complète de la séance.
 */
function calculerReprise(etatSauvegarde) {
  let courant = etatSauvegarde;
  const maintenant = Date.now();

  while (
    courant.statut !== STATUTS.SEANCE_TERMINEE &&
    courant.phaseEndTimestamp !== null &&
    courant.phaseEndTimestamp <= maintenant
  ) {
    courant = avancerPhase(courant, courant.phaseEndTimestamp);
  }

  return courant;
}

/* ---------- Gestion du minuteur interne ---------- */

function arreterMinuteur() {
  if (minuteur) minuteur.arreter();
}

function demarrerMinuteurPourEtatActuel() {
  arreterMinuteur();
  if (
    !etatActuel ||
    etatActuel.phaseEndTimestamp === null ||
    etatActuel.statut === STATUTS.SEANCE_TERMINEE
  ) {
    return; // exercice en répétitions (attente validation manuelle) ou séance finie
  }

  minuteur = creerTimer({
    onTick: () => notifier(),
    onExpire: () => gererExpirationPhase()
  });
  minuteur.demarrer(etatActuel.phaseEndTimestamp);
}

function gererExpirationPhase() {
  if (!etatActuel) return;
  etatActuel = avancerPhase(etatActuel, etatActuel.phaseEndTimestamp);
  apresTransition();
}

/**
 * À appeler après CHAQUE transition d'état : sauvegarde, relance le
 * minuteur si nécessaire, et notifie l'interface.
 */
function apresTransition() {
  if (etatActuel.statut === STATUTS.SEANCE_TERMINEE) {
    finaliserSeanceTerminee();
    return;
  }
  storage.sauvegarderSeance(etatActuel);
  demarrerMinuteurPourEtatActuel();
  notifier();
}

function finaliserSeanceTerminee() {
  arreterMinuteur();
  storage.ajouterEntreeHistorique({
    jour: etatActuel.jour,
    seanceKey: etatActuel.seanceKey,
    date: Date.now(),
    exercicesEffectues: etatActuel.exercicesValides.filter(Boolean).length,
    exercicesTotal: etatActuel.exercicesIds.length
  });
  storage.effacerSeance();
  // etatActuel reste en mémoire avec statut SEANCE_TERMINEE pour que
  // l'interface puisse afficher un écran de fin, tant qu'un nouveau
  // départ ou un abandon n'a pas été déclenché.
  notifier();
}

function notifier() {
  if (typeof callbackChangement === "function") {
    callbackChangement(obtenirEtatPourAffichage());
  }
}

/* ============================================
   API publique
   ============================================ */

/**
 * Enregistre la fonction appelée à chaque changement d'état.
 * L'interface ne doit jamais lire l'état interne directement :
 * elle réagit uniquement à ce callback (ou appelle obtenirEtatPourAffichage()).
 */
export function initialiser(callback) {
  callbackChangement = callback;
}

/**
 * Vérifie s'il existe une séance sauvegardée, sans la charger ni la
 * modifier. Sert à afficher l'écran "Reprendre / Abandonner".
 */
export function verifierSeanceSauvegardee() {
  const sauvegarde = storage.chargerSeance();
  if (!sauvegarde) return { trouve: false };
  return {
    trouve: true,
    jour: sauvegarde.jour,
    seanceKey: sauvegarde.seanceKey,
    exerciceIndex: sauvegarde.exerciceIndex,
    exercicesTotal: sauvegarde.exercicesIds.length
  };
}

/**
 * Démarre une toute nouvelle séance pour le jour donné.
 * Retourne null si le jour est un jour de repos (pas de séance définie).
 */
export function demarrerNouvelleSeance(jour) {
  const nouvelEtat = creerEtatInitial(jour);
  if (!nouvelEtat) return null;

  storage.effacerSeance(); // écrase une éventuelle ancienne sauvegarde
  etatActuel = nouvelEtat;
  storage.sauvegarderSeance(etatActuel);
  demarrerMinuteurPourEtatActuel();
  notifier();
  return obtenirEtatPourAffichage();
}

/**
 * Reprend la séance sauvegardée, en recalculant en cascade tout ce qui
 * a pu se passer pendant l'absence. Si la cascade aboutit à une séance
 * terminée, l'historique est mis à jour et aucun état "en cours"
 * incohérent n'est laissé.
 */
export function reprendreSeanceSauvegardee() {
  const sauvegarde = storage.chargerSeance();
  if (!sauvegarde) return null;

  etatActuel = calculerReprise(sauvegarde);

  if (etatActuel.statut === STATUTS.SEANCE_TERMINEE) {
    finaliserSeanceTerminee();
  } else {
    storage.sauvegarderSeance(etatActuel);
    demarrerMinuteurPourEtatActuel();
    notifier();
  }

  return obtenirEtatPourAffichage();
}

/**
 * Abandon volontaire : efface définitivement la séance sauvegardée.
 */
export function abandonnerSeanceSauvegardee() {
  arreterMinuteur();
  storage.effacerSeance();
  etatActuel = null;
  notifier();
}

/**
 * Valide manuellement l'exercice courant (bouton "✓ TERMINÉ"),
 * uniquement pertinent pour les exercices en répétitions, mais
 * fonctionne aussi pour un exercice chronométré validé avant la fin.
 */
export function validerExerciceActuel() {
  if (!etatActuel || etatActuel.statut !== STATUTS.EXERCICE_ACTIF) return;
  etatActuel = avancerPhase(etatActuel, Date.now());
  apresTransition();
}

/**
 * Navigation manuelle vers l'exercice suivant (flèche ▶).
 * N'invalide ni ne valide rien : si l'exercice courant n'était pas
 * validé, il reste non comptabilisé.
 */
export function exerciceSuivant() {
  if (!etatActuel) return;
  const indexCible = etatActuel.exerciceIndex + 1;
  if (indexCible >= etatActuel.exercicesIds.length) return;
  allerVersExercice(indexCible);
}

/**
 * Navigation manuelle vers l'exercice précédent (flèche ◀).
 * Pendant le repos, le repos appartient encore à l'exercice qui vient
 * de se terminer : revenir doit donc rouvrir CET exercice (sans
 * décrémenter l'index), et non l'exercice d'avant.
 * Pendant un exercice actif, revenir cible normalement l'exercice
 * précédent. Ne retire jamais la validation d'un exercice déjà validé.
 */
export function exercicePrecedent() {
  if (!etatActuel) return;

  if (etatActuel.statut === STATUTS.REPOS) {
    allerVersExercice(etatActuel.exerciceIndex);
    return;
  }

  const indexCible = etatActuel.exerciceIndex - 1;
  if (indexCible < 0) return;
  allerVersExercice(indexCible);
}

function allerVersExercice(index) {
  const exercice = trouverExercice(etatActuel.exercicesIds[index]);
  const maintenant = Date.now();

  etatActuel = {
    ...etatActuel,
    exerciceIndex: index,
    statut: STATUTS.EXERCICE_ACTIF,
    phaseEndTimestamp:
      exercice.type === "temps" ? maintenant + exercice.valeur * 1000 : null
    // exercicesValides volontairement inchangé
  };

  storage.sauvegarderSeance(etatActuel);
  demarrerMinuteurPourEtatActuel();
  notifier();
}

/**
 * Appelé quand l'utilisateur confirme "Quitter" depuis le bouton 🏠.
 * Arrête simplement le minuteur local : la séance reste sauvegardée
 * dans le storage et pourra être reprise plus tard normalement.
 */
export function quitterVersAccueil() {
  arreterMinuteur();
}

/**
 * Retourne un instantané de l'état, prêt à être consommé par l'UI.
 */
export function obtenirEtatPourAffichage() {
  if (!etatActuel) {
    return { statut: STATUTS.IDLE };
  }

  const exerciceCourant = trouverExercice(
    etatActuel.exercicesIds[etatActuel.exerciceIndex]
  );

  const indexSuivant = etatActuel.exerciceIndex + 1;
  const idExerciceSuivant =
    indexSuivant < etatActuel.exercicesIds.length
      ? etatActuel.exercicesIds[indexSuivant]
      : null;
  const exerciceSuivantData = idExerciceSuivant
    ? trouverExercice(idExerciceSuivant)
    : null;

  const tempsRestantMs = minuteur
    ? minuteur.obtenirTempsRestant()
    : etatActuel.phaseEndTimestamp
    ? Math.max(0, etatActuel.phaseEndTimestamp - Date.now())
    : 0;

  return {
    statut: etatActuel.statut,
    jour: etatActuel.jour,
    seanceKey: etatActuel.seanceKey,
    exerciceIndex: etatActuel.exerciceIndex,
    exercicesTotal: etatActuel.exercicesIds.length,
    exerciceCourant,
    exerciceSuivant: exerciceSuivantData,
    tempsRestantSecondes: Math.ceil(tempsRestantMs / 1000),
    exercicesEffectues: etatActuel.exercicesValides.filter(Boolean).length,
    exerciceActuelValide:
      etatActuel.exercicesValides[etatActuel.exerciceIndex] === true
  };
  }
/**
 * Réinitialise le timer de l'exercice chronométré actuellement en cours,
 * en repartant de sa durée complète. N'affecte ni exercicesValides,
 * ni exerciceIndex, ni le statut, ni le repos, ni le compteur d'exercices
 * effectués. Ne joue aucun son (la state machine ignore l'audio de toute
 * façon). Sans effet si l'exercice courant n'est pas de type "temps" ou
 * si aucune séance n'est en cours.
 */
export function reinitialiserExerciceActuel() {
  if (!etatActuel || etatActuel.statut !== STATUTS.EXERCICE_ACTIF) return;

  const exerciceCourant = trouverExercice(etatActuel.exercicesIds[etatActuel.exerciceIndex]);
  if (!exerciceCourant || exerciceCourant.type !== "temps") return;

  etatActuel = {
    ...etatActuel,
    phaseEndTimestamp: Date.now() + exerciceCourant.valeur * 1000
  };

  storage.sauvegarderSeance(etatActuel);
  demarrerMinuteurPourEtatActuel();
  notifier();
}
