/* ============================================
   HonoPs — Moteur de timer
   Aucune connaissance du domaine (exercices, séances...).
   Ne touche jamais au DOM ni au localStorage.
   Repose exclusivement sur des timestamps absolus :
   le temps restant est TOUJOURS recalculé, jamais décrémenté.
   ============================================ */

const INTERVALLE_TICK_MS = 250;

/**
 * Crée une instance de timer.
 * @param {Object} options
 * @param {(tempsRestantMs: number) => void} [options.onTick] appelé à chaque tick
 * @param {() => void} [options.onExpire] appelé une seule fois à l'expiration
 */
export function creerTimer({ onTick, onExpire } = {}) {
  let phaseEndTimestamp = null;
  let intervalId = null;
  let enPause = false;
  let tempsRestantAuPauseMs = null;

  function calculerTempsRestantMs() {
    if (phaseEndTimestamp === null) return 0;
    if (enPause) return Math.max(0, tempsRestantAuPauseMs);
    return Math.max(0, phaseEndTimestamp - Date.now());
  }

  function tick() {
    const restant = calculerTempsRestantMs();
    if (typeof onTick === "function") onTick(restant);

    if (restant <= 0) {
      arreter();
      if (typeof onExpire === "function") onExpire();
    }
  }

  /**
   * Démarre (ou redémarre) le timer avec un timestamp absolu de fin.
   * C'est la méthode centrale : utilisée aussi bien pour un démarrage
   * normal que pour reprendre un timer après reprise de séance.
   */
  function demarrer(timestampFin) {
    arreter();
    phaseEndTimestamp = timestampFin;
    enPause = false;
    tempsRestantAuPauseMs = null;
    tick(); // mise à jour immédiate, sans attendre le premier intervalle
    intervalId = setInterval(tick, INTERVALLE_TICK_MS);
  }

  /**
   * Démarre le timer à partir d'une durée en secondes (raccourci pratique).
   */
  function demarrerAvecDuree(dureeSecondes) {
    demarrer(Date.now() + dureeSecondes * 1000);
  }

  /**
   * Arrête le timer sans déclencher onExpire.
   */
  function arreter() {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  /**
   * Met en pause : conserve le temps restant sans faire avancer l'horloge.
   * (Non utilisé pour l'instant, prévu pour une évolution future.)
   */
  function mettreEnPause() {
    if (enPause || phaseEndTimestamp === null || intervalId === null) return;
    tempsRestantAuPauseMs = calculerTempsRestantMs();
    arreter();
    enPause = true;
  }

  /**
   * Reprend après une pause, en recalculant un nouveau timestamp de fin
   * à partir du temps restant mémorisé — jamais en redémarrant à zéro.
   */
  function reprendre() {
    if (!enPause || tempsRestantAuPauseMs === null) return;
    demarrer(Date.now() + tempsRestantAuPauseMs);
  }

  function obtenirTempsRestant() {
    return calculerTempsRestantMs();
  }

  function estActif() {
    return intervalId !== null;
  }

  return {
    demarrer,
    demarrerAvecDuree,
    arreter,
    mettreEnPause,
    reprendre,
    obtenirTempsRestant,
    estActif
  };
}
