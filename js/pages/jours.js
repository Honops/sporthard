/* ============================================
   HonoPs — Script de la page des jours
   Génère la liste des 7 jours, affiche le compteur
   de séances et un bandeau de reprise si applicable.
   ============================================ */

import { JOURS_ORDRE, NOMS_JOURS, PROGRAMME_SEMAINE, SEANCES } from "../data/programme.js";
import { obtenirNombreSeancesEffectuees } from "../core/storage.js";
import { verifierSeanceSauvegardee } from "../core/stateMachine.js";

const listeJoursEl = document.getElementById("liste-jours");
const nombreSeancesEl = document.getElementById("nombre-seances");
const bandeauReprise = document.getElementById("bandeau-reprise");
const bandeauRepriseDetail = document.getElementById("bandeau-reprise-detail");

function afficherCompteurSeances() {
  nombreSeancesEl.textContent = obtenirNombreSeancesEffectuees();
}

function afficherBandeauRepriseSiNecessaire() {
  const infos = verifierSeanceSauvegardee();
  if (!infos.trouve) return;

  const nomJour = NOMS_JOURS[infos.jour] || infos.jour;
  bandeauRepriseDetail.textContent =
    `${nomJour} — exercice ${infos.exerciceIndex + 1} / ${infos.exercicesTotal}`;
  bandeauReprise.href = `seance.html?jour=${infos.jour}&reprise=1`;
  bandeauReprise.classList.remove("masque");
}

function creerCarteJour(jour) {
  const seanceKey = PROGRAMME_SEMAINE[jour];
  const estRepos = !seanceKey;

  const item = document.createElement("li");

  const carte = document.createElement(estRepos ? "div" : "a");
  carte.className = "carte-jour" + (estRepos ? " jour-repos" : "");
  if (!estRepos) {
    carte.href = `jour.html?jour=${jour}`;
  }

  const infos = document.createElement("div");
  infos.className = "carte-jour-infos";

  const nom = document.createElement("span");
  nom.className = "carte-jour-nom";
  nom.textContent = NOMS_JOURS[jour];
  infos.appendChild(nom);

  const detailSeance = document.createElement("span");
  detailSeance.className = "carte-jour-seance";
  if (estRepos) {
    detailSeance.textContent = "Repos";
  } else {
    const seance = SEANCES[seanceKey];
    detailSeance.textContent = `${seance.nomSeance} · ${seance.exercices.length} exercices`;
  }
  infos.appendChild(detailSeance);

  carte.appendChild(infos);

  if (!estRepos) {
    const fleche = document.createElement("span");
    fleche.className = "carte-jour-fleche";
    fleche.textContent = "›";
    fleche.setAttribute("aria-hidden", "true");
    carte.appendChild(fleche);
  }

  item.appendChild(carte);
  return item;
}

function afficherListeJours() {
  JOURS_ORDRE.forEach((jour) => {
    listeJoursEl.appendChild(creerCarteJour(jour));
  });
}

function initialiserPage() {
  afficherCompteurSeances();
  afficherBandeauRepriseSiNecessaire();
  afficherListeJours();
}

document.addEventListener("DOMContentLoaded", initialiserPage);
