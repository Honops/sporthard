/* ============================================
   HonoPs — Orchestration de l'écran de séance
   Ce fichier ne contient AUCUNE logique de transition :
   il lit l'URL, connecte l'UI à la state machine,
   et met à jour l'affichage en réaction aux callbacks.
   ============================================ */

import { JOURS_ORDRE, NOMS_JOURS, PROGRAMME_SEMAINE, SEANCES } from "../data/programme.js";
import * as machine from "../core/stateMachine.js";
import * as sound from "../audio/sound.js";

/* ---------- Références DOM ---------- */

const corps = document.getElementById("corps-seance");

const vueConflit = document.getElementById("vue-conflit");
const conflitDetail = document.getElementById("conflit-detail");
const boutonConflitReprendre = document.getElementById("bouton-conflit-reprendre");
const boutonConflitAbandonner = document.getElementById("bouton-conflit-abandonner");

const vueErreur = document.getElementById("vue-erreur");

const vueExercice = document.getElementById("vue-exercice");
const barreProgression = document.getElementById("barre-progression");
const compteurPosition = document.getElementById("compteur-position");
const compteurEffectues = document.getElementById("compteur-effectues");
const nomExercice = document.getElementById("nom-exercice");
const imageAnimation = document.getElementById("image-animation");
const placeholderAnimation = document.getElementById("placeholder-animation");
const blocRepetitions = document.getElementById("bloc-repetitions");
const valeurRepetitions = document.getElementById("valeur-repetitions");
const boutonTermine = document.getElementById("bouton-termine");
const blocTemps = document.getElementById("bloc-temps");
const valeurTemps = document.getElementById("valeur-temps");
const flechePrecedent = document.getElementById("fleche-precedent");
const flecheSuivant = document.getElementById("fleche-suivant");

const vueRepos = document.getElementById("vue-repos");
const reposChrono = document.getElementById("repos-chrono");
const reposProchainNom = document.getElementById("repos-prochain-nom");
const flechePrecedentRepos = document.getElementById("fleche-precedent-repos");
const flecheSuivantRepos = document.getElementById("fleche-suivant-repos");

const vueTerminee = document.getElementById("vue-terminee");
const termineeDetail = document.getElementById("terminee-detail");

const boutonHome = document.getElementById("bouton-home");
const modaleQuitter = document.getElementById("modale-quitter");
const boutonQuitterContinuer = document.getElementById("bouton-quitter-continuer");
const boutonQuitterConfirmer = document.getElementById("bouton-quitter-confirmer");

/* ---------- État local d'affichage (pas de logique métier) ---------- */

let statutPrecedent = null;

/* ---------- Utilitaires d'affichage ---------- */

function masquerToutesLesVues() {
  [vueConflit, vueErreur, vueExercice, vueRepos, vueTerminee].forEach((vue) =>
    vue.classList.add("masque")
  );
}

function formaterTemps(secondes) {
  const s = Math.max(0, secondes);
  const min = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function chargerAnimation(nomFichier) {
  if (!nomFichier) {
    imageAnimation.classList.add("masque");
    placeholderAnimation.classList.remove("masque");
    return;
  }
  imageAnimation.onerror = () => {
    imageAnimation.classList.add("masque");
    placeholderAnimation.classList.remove("masque");
  };
  imageAnimation.onload = () => {
    imageAnimation.classList.remove("masque");
    placeholderAnimation.classList.add("masque");
  };
  imageAnimation.src = `assets/animations/${nomFichier}`;
  imageAnimation.alt = "";
}

/* ---------- Rendu par statut ---------- */

function afficherVueExercice(etat) {
  masquerToutesLesVues();
  corps.dataset.mode = "exercice";
  vueExercice.classList.remove("masque");

  const exercice = etat.exerciceCourant;

  compteurPosition.textContent = `${etat.exerciceIndex + 1} / ${etat.exercicesTotal}`;
  compteurEffectues.textContent = `${etat.exercicesEffectues} effectués`;
  barreProgression.style.width = `${(etat.exerciceIndex / etat.exercicesTotal) * 100}%`;

  nomExercice.textContent = exercice.nom.toUpperCase();
  chargerAnimation(exercice.animation);

  if (exercice.type === "repetitions") {
    blocRepetitions.classList.remove("masque");
    blocTemps.classList.add("masque");
    valeurRepetitions.textContent = exercice.valeur;
  } else {
    blocTemps.classList.remove("masque");
    blocRepetitions.classList.add("masque");
    valeurTemps.textContent = formaterTemps(etat.tempsRestantSecondes);
  }

  flechePrecedent.disabled = etat.exerciceIndex === 0;
  flecheSuivant.disabled = etat.exerciceIndex >= etat.exercicesTotal - 1;
}

function afficherVueRepos(etat) {
  masquerToutesLesVues();
  corps.dataset.mode = "repos";
  vueRepos.classList.remove("masque");

  reposChrono.textContent = formaterTemps(etat.tempsRestantSecondes);
  reposProchainNom.textContent = etat.exerciceSuivant
    ? etat.exerciceSuivant.nom.toUpperCase()
    : "";

  flechePrecedentRepos.disabled = etat.exerciceIndex === 0;
  flecheSuivantRepos.disabled = false;
}

function afficherVueTerminee(etat) {
  masquerToutesLesVues();
  corps.dataset.mode = "exercice";
  vueTerminee.classList.remove("masque");
  termineeDetail.textContent = `${etat.exercicesEffectues} / ${etat.exercicesTotal} exercices effectués`;
}

function afficherVueErreur() {
  masquerToutesLesVues();
  vueErreur.classList.remove("masque");
}

function afficherVueConflit(infosSauvegarde) {
  masquerToutesLesVues();
  const nomJour = NOMS_JOURS[infosSauvegarde.jour] || infosSauvegarde.jour;
  conflitDetail.textContent = `${nomJour} — Exercice ${infosSauvegarde.exerciceIndex + 1} / ${infosSauvegarde.exercicesTotal}`;
  vueConflit.classList.remove("masque");
}

/* ---------- Sons liés aux transitions ---------- */

function gererSonsPourTransition(etat) {
  const statutActuel = etat.statut;

  if (statutPrecedent === machine.STATUTS.EXERCICE_ACTIF && statutActuel === machine.STATUTS.REPOS) {
    sound.jouerFinExercice();
  } else if (statutPrecedent === machine.STATUTS.REPOS && statutActuel === machine.STATUTS.EXERCICE_ACTIF) {
    sound.jouerFinExercice(); // signal de fin de repos / transition
  } else if (statutPrecedent === machine.STATUTS.EXERCICE_ACTIF && statutActuel === machine.STATUTS.SEANCE_TERMINEE) {
    sound.jouerFinExercice();
    sound.jouerFinSeance();
  }

  statutPrecedent = statutActuel;
}

/* ---------- Callback central : réagit à CHAQUE changement d'état ---------- */

function surChangementEtat(etat) {
  gererSonsPourTransition(etat);

  switch (etat.statut) {
    case machine.STATUTS.EXERCICE_ACTIF:
      afficherVueExercice(etat);
      break;
    case machine.STATUTS.REPOS:
      afficherVueRepos(etat);
      break;
    case machine.STATUTS.SEANCE_TERMINEE:
      afficherVueTerminee(etat);
      break;
    default:
      // IDLE : ne devrait pas s'afficher sur cet écran une fois lancé
      break;
  }
}

/* ---------- Bouton home + modale de confirmation ---------- */

function estSeanceActive() {
  return (
    statutPrecedent === machine.STATUTS.EXERCICE_ACTIF ||
    statutPrecedent === machine.STATUTS.REPOS
  );
}

boutonHome.addEventListener("click", () => {
  if (estSeanceActive()) {
    modaleQuitter.classList.remove("masque");
  } else {
    window.location.href = "index.html";
  }
});

boutonQuitterContinuer.addEventListener("click", () => {
  modaleQuitter.classList.add("masque");
});

boutonQuitterConfirmer.addEventListener("click", () => {
  machine.quitterVersAccueil();
  window.location.href = "index.html";
});

/* ---------- Navigation manuelle ---------- */

flecheSuivant.addEventListener("click", () => machine.exerciceSuivant());
flechePrecedent.addEventListener("click", () => machine.exercicePrecedent());
flecheSuivantRepos.addEventListener("click", () => machine.exerciceSuivant());
flechePrecedentRepos.addEventListener("click", () => machine.exercicePrecedent());
boutonTermine.addEventListener("click", () => machine.validerExerciceActuel());

/* ---------- Déblocage audio dès le premier geste ---------- */

let audioDebloque = false;
let sonDebutEnAttente = false;

/**
 * Demande la lecture du son de début de séance : immédiate si l'audio
 * est déjà débloqué, sinon mise en attente jusqu'au premier geste réel.
 */
function demanderSonDebut() {
  if (audioDebloque) {
    sound.jouerDebutSeance();
  } else {
    sonDebutEnAttente = true;
  }
}

function gererPremierGeste() {
  if (audioDebloque) return;
  audioDebloque = true;
  sound.debloquerAudio();

  if (sonDebutEnAttente) {
    sonDebutEnAttente = false;
    sound.jouerDebutSeance();
  }

  document.removeEventListener("pointerdown", gererPremierGeste);
}

document.addEventListener("pointerdown", gererPremierGeste);

/* ---------- Initialisation ---------- */

function jourEstValide(jour) {
  return Boolean(jour && JOURS_ORDRE.includes(jour) && PROGRAMME_SEMAINE[jour]);
}

function initialiser() {
  sound.initialiser();
  machine.initialiser(surChangementEtat);

  const params = new URLSearchParams(window.location.search);
  const jourDemande = params.get("jour");

  const sauvegarde = machine.verifierSeanceSauvegardee();

  if (sauvegarde.trouve) {
    // Une séance existe : décision toujours explicite, jamais automatique
    // ni basée sur un paramètre d'URL, quel qu'il soit.
    afficherVueConflit(sauvegarde);

    boutonConflitReprendre.addEventListener("click", () => {
      audioDebloque = true;
      document.removeEventListener("pointerdown", gererPremierGeste);
      sound.debloquerAudio();
      machine.reprendreSeanceSauvegardee();
    });

    boutonConflitAbandonner.addEventListener("click", () => {
      audioDebloque = true;
      document.removeEventListener("pointerdown", gererPremierGeste);
      sound.debloquerAudio();
      machine.abandonnerSeanceSauvegardee();

      if (jourEstValide(jourDemande)) {
        // Ce clic est lui-même un geste utilisateur réel sur cette page :
        // le son peut être joué immédiatement, sans attendre un pointerdown.
        sound.jouerDebutSeance();
        machine.demarrerNouvelleSeance(jourDemande);
      } else {
        window.location.href = "jours.html";
      }
    });

    return;
  }

  // Aucune séance sauvegardée : démarrage direct si le jour est valide
  if (!jourEstValide(jourDemande)) {
    afficherVueErreur();
    return;
  }

  // Le son de début n'est PAS joué ici : le clic sur COMMENCER a eu lieu
  // sur jour.html, ce qui ne garantit pas le déblocage audio de ce
  // nouveau document. L'état démarre normalement ; le son attend le
  // premier vrai geste sur seance.html (voir gererPremierGeste).
  demanderSonDebut();
  machine.demarrerNouvelleSeance(jourDemande);
}

document.addEventListener("DOMContentLoaded", initialiser);
