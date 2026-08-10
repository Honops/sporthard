/* ============================================
   HonoPs — Script de la page de détail d'un jour
   Résout dynamiquement le jour depuis l'URL,
   affiche la séance, gère le conflit de séance en cours.
   ============================================ */

import { JOURS_ORDRE, NOMS_JOURS, PROGRAMME_SEMAINE, SEANCES } from "../data/programme.js";
import { EXERCICES } from "../data/exercices.js";
import { verifierSeanceSauvegardee } from "../core/stateMachine.js";

const contenuJourEl = document.getElementById("contenu-jour");
const etatErreurEl = document.getElementById("etat-erreur");
const titreJourEl = document.getElementById("titre-jour");
const sousTitreJourEl = document.getElementById("sous-titre-jour");
const listeExercicesEl = document.getElementById("liste-exercices");
const boutonCommencer = document.getElementById("bouton-commencer");

const modaleConflit = document.getElementById("modale-conflit");
const modaleDetail = document.getElementById("modale-detail");
const boutonReprendre = document.getElementById("bouton-reprendre");
const boutonAbandonner = document.getElementById("bouton-abandonner");
const boutonAnnulerModale = document.getElementById("bouton-annuler-modale");

function trouverExercice(id) {
  return EXERCICES.find((exercice) => exercice.id === id) || null;
}

function formaterValeur(exercice) {
  return exercice.type === "temps"
    ? `${exercice.valeur} sec`
    : `${exercice.valeur} répétitions`;
}

function creerCarteExercice(id, index) {
  const exercice = trouverExercice(id);
  const item = document.createElement("li");
  item.className = "carte-exercice";

  const numero = document.createElement("span");
  numero.className = "carte-exercice-numero";
  numero.textContent = index + 1;
  item.appendChild(numero);

  const infos = document.createElement("div");
  infos.className = "carte-exercice-infos";

  const nom = document.createElement("span");
  nom.className = "carte-exercice-nom";
  nom.textContent = exercice.nom;
  infos.appendChild(nom);

  const detail = document.createElement("span");
  detail.className = "carte-exercice-detail";
  detail.innerHTML = `
    <span>${formaterValeur(exercice)}</span>
    <span class="point">·</span>
    <span>Repos ${exercice.repos} sec</span>
  `;
  infos.appendChild(detail);

  item.appendChild(infos);

  const anim = document.createElement("span");
  anim.className = "carte-exercice-anim";
  anim.textContent = "🎬";
  anim.title = "Animation disponible";
  item.appendChild(anim);

  return item;
}

function afficherErreur() {
  contenuJourEl.classList.add("masque");
  etatErreurEl.classList.remove("masque");
}

function afficherContenuJour(jour) {
  const seanceKey = PROGRAMME_SEMAINE[jour];
  const seance = SEANCES[seanceKey];

  titreJourEl.textContent = NOMS_JOURS[jour];
  sousTitreJourEl.textContent = `${seance.nomSeance} · ${seance.exercices.length} exercices`;

  seance.exercices.forEach((id, index) => {
    listeExercicesEl.appendChild(creerCarteExercice(id, index));
  });

  contenuJourEl.classList.remove("masque");
}

function ouvrirModaleConflit(infosSauvegarde) {
  const nomJourSauvegarde = NOMS_JOURS[infosSauvegarde.jour] || infosSauvegarde.jour;
  modaleDetail.textContent =
    `${nomJourSauvegarde} — exercice ${infosSauvegarde.exerciceIndex + 1} / ${infosSauvegarde.exercicesTotal}`;
  modaleConflit.classList.remove("masque");
}

function fermerModaleConflit() {
  modaleConflit.classList.add("masque");
}

function initialiserPage() {
  const params = new URLSearchParams(window.location.search);
  const jour = params.get("jour");

  const jourValide = jour && JOURS_ORDRE.includes(jour) && PROGRAMME_SEMAINE[jour];

  if (!jourValide) {
    afficherErreur();
    return;
  }

  afficherContenuJour(jour);

  boutonCommencer.addEventListener("click", () => {
    const sauvegarde = verifierSeanceSauvegardee();

    if (!sauvegarde.trouve) {
      window.location.href = `seance.html?jour=${jour}`;
      return;
    }

    ouvrirModaleConflit(sauvegarde);

    boutonReprendre.onclick = () => {
      window.location.href = `seance.html?jour=${sauvegarde.jour}&reprise=1`;
    };

    boutonAbandonner.onclick = () => {
      window.location.href = `seance.html?jour=${jour}&forcer=1`;
    };
  });

  boutonAnnulerModale.addEventListener("click", fermerModaleConflit);
}

document.addEventListener("DOMContentLoaded", initialiserPage);
