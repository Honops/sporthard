/* ============================================
   HonoPs — Gestion des sons
   Ignorant du domaine : ne connaît que 3 types de sons.
   Gère le déblocage autoplay mobile et la préférence ON/OFF.
   ============================================ */

import { chargerPreferences, sauvegarderPreferences } from "../core/storage.js";

const FICHIERS = {
  debutSeance: "assets/sounds/debut-seance.mp3",
  finExercice: "assets/sounds/fin-exercice.mp3",
  finSeance: "assets/sounds/fin-seance.mp3"
};

let elements = null;
let debloque = false;
let sonActif = true;

/**
 * Précharge les éléments audio et charge la préférence son ON/OFF.
 * À appeler une seule fois au démarrage de chaque page.
 */
export function initialiser() {
  sonActif = chargerPreferences().sonActif;

  elements = {
    debutSeance: new Audio(FICHIERS.debutSeance),
    finExercice: new Audio(FICHIERS.finExercice),
    finSeance: new Audio(FICHIERS.finSeance)
  };

  Object.values(elements).forEach((audio) => {
    audio.preload = "auto";
  });
}

/**
 * Débloque l'audio pour la session en cours.
 * DOIT être appelée depuis un vrai geste utilisateur (tap/click),
 * sinon les navigateurs mobiles bloqueront toute lecture ultérieure.
 */
export function debloquerAudio() {
  if (debloque || !elements) return;

  Object.values(elements).forEach((audio) => {
    const volumeOriginal = audio.volume;
    audio.volume = 0;

    const promesse = audio.play();
    if (promesse && typeof promesse.then === "function") {
      promesse
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.volume = volumeOriginal;
        })
        .catch(() => {
          // Échec silencieux : on retente au premier son réel demandé
          audio.volume = volumeOriginal;
        });
    }
  });

  debloque = true;
}

function jouer(cle) {
  if (!sonActif || !elements) return;
  const audio = elements[cle];
  try {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // Lecture refusée (ex. non débloquée) : on ignore silencieusement
    });
  } catch (erreur) {
    console.error(`HonoPs sound: lecture impossible pour "${cle}"`, erreur);
  }
}

export function jouerDebutSeance() {
  jouer("debutSeance");
}

export function jouerFinExercice() {
  jouer("finExercice");
}

export function jouerFinSeance() {
  jouer("finSeance");
}

/**
 * Bascule le son ON/OFF, sauvegarde la préférence, retourne le nouvel état.
 */
export function basculerSon() {
  sonActif = !sonActif;
  sauvegarderPreferences({ sonActif });
  return sonActif;
}

export function estSonActif() {
  return sonActif;
}
