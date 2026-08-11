/* ============================================
   HonoPs — Gestion des sons
   ⚠️ VERSION DIAGNOSTIC TEMPORAIRE — panneau visuel intégré
   car pas d'accès console sur mobile.
   Aucun comportement fonctionnel modifié.
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

/* ---------- Panneau de log visuel ---------- */

let zoneLog = null;

function creerPanneauDiagnostic() {
  if (document.getElementById("panneau-diagnostic-audio")) return;

  const panneau = document.createElement("div");
  panneau.id = "panneau-diagnostic-audio";
  panneau.style.cssText =
    "position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999;" +
    "background:rgba(0,0,0,0.95);color:#0f0;font-family:monospace;" +
    "font-size:11px;overflow-y:auto;padding:8px;box-sizing:border-box;";

  const boutons = document.createElement("div");
  boutons.style.cssText = "display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap;position:sticky;top:0;background:#000;padding:4px 0;";

  function creerBouton(label, fn) {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = "flex:1;min-width:70px;padding:10px 4px;font-size:11px;background:#333;color:#fff;border:1px solid #666;";
    b.addEventListener("click", fn);
    return b;
  }

  boutons.appendChild(creerBouton("Débloquer", () => { log("=== CLIC bouton Débloquer ==="); debloquerAudio(); }));
  boutons.appendChild(creerBouton("Test début", () => { log("=== CLIC bouton Test début ==="); jouerDebutSeance(); }));
  boutons.appendChild(creerBouton("Test fin exo", () => { log("=== CLIC bouton Test fin exo ==="); jouerFinExercice(); }));
  boutons.appendChild(creerBouton("Test fin séance", () => { log("=== CLIC bouton Test fin séance ==="); jouerFinSeance(); }));
  boutons.appendChild(creerBouton("Effacer", () => { zoneLog.textContent = ""; }));
  boutons.appendChild(creerBouton("Fermer", () => { panneau.style.display = "none"; }));

  zoneLog = document.createElement("pre");
  zoneLog.style.cssText = "white-space:pre-wrap;word-break:break-all;margin:0;";

  panneau.appendChild(boutons);
  panneau.appendChild(zoneLog);
  document.body.appendChild(panneau);
}

function log(texte) {
  if (!zoneLog) return;
  const ligne = `[${new Date().toLocaleTimeString()}] ${texte}\n`;
  zoneLog.textContent += ligne;
  zoneLog.parentElement.scrollTop = zoneLog.parentElement.scrollHeight;
}

function urlAbsolue(cheminRelatif) {
  return new URL(cheminRelatif, window.location.href).href;
}

function logEtatAudio(etiquette, cle, audio) {
  log(
    `[${etiquette}] ${cle}\n` +
    `  URL absolue : ${urlAbsolue(FICHIERS[cle])}\n` +
    `  readyState  : ${audio.readyState}\n` +
    `  networkState: ${audio.networkState}\n` +
    `  error       : ${audio.error ? `code=${audio.error.code}` : "aucune"}\n` +
    `  paused      : ${audio.paused}\n` +
    `  muted       : ${audio.muted}\n` +
    `  volume      : ${audio.volume}\n` +
    `  currentTime : ${audio.currentTime}\n` +
    `  duration    : ${audio.duration}`
  );
}

/* ---------- Fonctions réelles, instrumentées ---------- */

export function initialiser() {
  creerPanneauDiagnostic();
  log("=== initialiser() appelé ===");

  sonActif = chargerPreferences().sonActif;
  log(`préférence sonActif = ${sonActif}`);

  elements = {
    debutSeance: new Audio(FICHIERS.debutSeance),
    finExercice: new Audio(FICHIERS.finExercice),
    finSeance: new Audio(FICHIERS.finSeance)
  };

  Object.entries(elements).forEach(([cle, audio]) => {
    audio.preload = "auto";

    log(`URL absolue construite pour "${cle}" : ${urlAbsolue(FICHIERS[cle])}`);

    audio.addEventListener("loadedmetadata", () => logEtatAudio("EVENT loadedmetadata", cle, audio));
    audio.addEventListener("canplay", () => logEtatAudio("EVENT canplay", cle, audio));
    audio.addEventListener("error", () => logEtatAudio("EVENT ❌ERROR", cle, audio));
    audio.addEventListener("ended", () => log(`[EVENT ended] ${cle}`));
    audio.addEventListener("play", () => log(`[EVENT play démarré] ${cle}`));
    audio.addEventListener("stalled", () => log(`[EVENT stalled] ${cle}`));
    audio.addEventListener("abort", () => log(`[EVENT abort] ${cle}`));

    logEtatAudio("APRES-CREATION", cle, audio);
  });

  log("=== initialiser() terminé ===");
}

export function debloquerAudio() {
  log(`=== debloquerAudio() appelé === (déjà débloqué = ${debloque})`);
  if (debloque || !elements) {
    log(`sortie anticipée : debloque=${debloque}, elements=${Boolean(elements)}`);
    return;
  }

  Object.entries(elements).forEach(([cle, audio]) => {
    const volumeOriginal = audio.volume;
    audio.volume = 0;

    logEtatAudio("AVANT-PLAY-DEBLOCAGE", cle, audio);

    const promesse = audio.play();
    if (promesse && typeof promesse.then === "function") {
      promesse
        .then(() => {
          log(`✅ Déblocage RÉUSSI pour "${cle}"`);
          audio.pause();
          audio.currentTime = 0;
          audio.volume = volumeOriginal;
          logEtatAudio("APRES-DEBLOCAGE-SUCCES", cle, audio);
        })
        .catch((erreur) => {
          log(`❌ Déblocage ÉCHOUÉ pour "${cle}" : ${erreur.name} - ${erreur.message}`);
          audio.volume = volumeOriginal;
          logEtatAudio("APRES-DEBLOCAGE-ECHEC", cle, audio);
        });
    } else {
      log(`⚠️ play() n'a pas retourné de Promise pour "${cle}"`);
    }
  });

  debloque = true;
  log("debloque = true (voir logs ci-dessus pour succès réel par son)");
}

function jouer(cle) {
  log(`=== jouer("${cle}") appelé === sonActif=${sonActif}, elements=${Boolean(elements)}`);

  if (!sonActif) {
    log(`jouer("${cle}") : ignoré, son désactivé (préférence OFF)`);
    return;
  }
  if (!elements) {
    log(`❌ jouer("${cle}") : ÉCHEC, elements est null`);
    return;
  }

  const audio = elements[cle];
  logEtatAudio("AVANT-PLAY", cle, audio);

  try {
    audio.currentTime = 0;
    const promesse = audio.play();
    if (promesse && typeof promesse.then === "function") {
      promesse
        .then(() => {
          log(`✅ jouer("${cle}") SUCCÈS`);
          logEtatAudio("APRES-PLAY-SUCCES", cle, audio);
        })
        .catch((erreur) => {
          log(`❌ jouer("${cle}") ÉCHEC : ${erreur.name} - ${erreur.message}\nURL: ${urlAbsolue(FICHIERS[cle])}`);
          logEtatAudio("APRES-PLAY-ECHEC", cle, audio);
        });
    }
  } catch (erreur) {
    log(`❌ jouer("${cle}") EXCEPTION SYNCHRONE : ${erreur.message}`);
  }
}

export function jouerDebutSeance() {
  log(`>>> jouerDebutSeance() appelé (debloque = ${debloque})`);
  jouer("debutSeance");
}

export function jouerFinExercice() {
  log(`>>> jouerFinExercice() appelé (debloque = ${debloque})`);
  jouer("finExercice");
}

export function jouerFinSeance() {
  log(`>>> jouerFinSeance() appelé (debloque = ${debloque})`);
  jouer("finSeance");
}

export function basculerSon() {
  sonActif = !sonActif;
  sauvegarderPreferences({ sonActif });
  log(`basculerSon() → nouvel état sonActif = ${sonActif}`);
  return sonActif;
}

export function estSonActif() {
  return sonActif;
}
