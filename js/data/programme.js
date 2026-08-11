/* ============================================
   HonoPs — Programme hebdomadaire
   Les séances (A/B/C) référencent uniquement des IDs
   définis dans exercices.js. Modifier une séance ici
   modifie automatiquement tous les jours qui l'utilisent.
   ============================================ */

export const SEANCES = {
  A: {
    nomSeance: "Séance A",
    exercices: [
      "jumping-jacks",
      "pompes",
      "crunch",
      "mountain-climbers",
      "reverse-crunch",
      "planche",
      "high-knees",
      "bicycle-crunch"
    ]
  },
  B: {
    nomSeance: "Séance B",
    exercices: [
      "high-knees",
      "pompes-serrees",
      "releves-jambes",
      "burpees",
      "dead-bug",
      "planche-laterale",
      "bicycle-crunch",
      "mountain-climbers"
    ]
  },
  C: {
    nomSeance: "Séance C",
    exercices: [
      "jumping-jacks",
      "pompes",
      "hollow-hold",
      "crunch",
      "burpees",
      "dead-bug",
      "planche",
      "reverse-crunch"
    ]
  }
};

/* jour → clé de séance (voir SEANCES ci-dessus).
   Une valeur "null" signifie repos / pas de séance ce jour-là. */
export const PROGRAMME_SEMAINE = {
  lundi: "A",
  mardi: "B",
  mercredi: "A",
  jeudi: "B",
  vendredi: "A",
  samedi: "C",
  dimanche: null
};

/* Noms d'affichage des jours, dans l'ordre attendu par l'UI */
export const JOURS_ORDRE = [
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
  "dimanche"
];

export const NOMS_JOURS = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche"
};
