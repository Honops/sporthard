/* ============================================
   HonoPs — Script de la page d'accueil
   Initialise le son, gère le déblocage audio mobile
   et le bouton d'activation/désactivation.
   ============================================ */

import {
  initialiser as initialiserSons,
  debloquerAudio,
  basculerSon,
  estSonActif
} from "../audio/sound.js";

const boutonSon = document.getElementById("bouton-son");

function mettreAJourIconeSon() {
  const actif = estSonActif();
  boutonSon.textContent = actif ? "🔊" : "🔇";
  boutonSon.dataset.actif = String(actif);
}

function gererPremiereInteraction() {
  debloquerAudio();
  document.removeEventListener("pointerdown", gererPremiereInteraction);
}

function initialiserPage() {
  initialiserSons();
  mettreAJourIconeSon();

  // Déblocage audio dès le premier geste, où qu'il ait lieu sur la page.
  document.addEventListener("pointerdown", gererPremiereInteraction, { once: true });

  boutonSon.addEventListener("click", () => {
    basculerSon();
    mettreAJourIconeSon();
  });
}

document.addEventListener("DOMContentLoaded", initialiserPage);
