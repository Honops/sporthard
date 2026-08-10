/* ============================================
   HonoPs — Catalogue des exercices
   Aucune logique ici : uniquement des données.
   Pour ajouter un exercice, copier un bloc et modifier.
   ============================================ */

export const EXERCICES = [
  {
    id: "pompes",
    nom: "Pompes",
    type: "repetitions",
    valeur: 12,
    repos: 30,
    description: "Renforcement des pectoraux, épaules et triceps.",
    consignes: [
      "Mains légèrement plus larges que les épaules",
      "Corps aligné de la tête aux talons",
      "Descendre jusqu'à ce que la poitrine frôle le sol",
      "Pousser en gardant le dos droit"
    ],
    animation: "pompes.svg"
  },
  {
    id: "pompes-serrees",
    nom: "Pompes serrées",
    type: "repetitions",
    valeur: 10,
    repos: 30,
    description: "Variante ciblant davantage les triceps.",
    consignes: [
      "Mains rapprochées sous la poitrine",
      "Coudes proches du corps pendant la descente",
      "Descendre lentement et contrôler la remontée"
    ],
    animation: "pompes-serrees.svg"
  },
  {
    id: "crunch",
    nom: "Crunch",
    type: "repetitions",
    valeur: 20,
    repos: 20,
    description: "Exercice de base pour les abdominaux.",
    consignes: [
      "Allongé sur le dos, genoux pliés, pieds au sol",
      "Mains derrière la tête sans tirer sur la nuque",
      "Décoller les omoplates en contractant les abdos",
      "Redescendre sans relâcher complètement"
    ],
    animation: "crunch.svg"
  },
  {
    id: "reverse-crunch",
    nom: "Reverse crunch",
    type: "repetitions",
    valeur: 15,
    repos: 20,
    description: "Cible le bas des abdominaux.",
    consignes: [
      "Allongé sur le dos, mains au sol le long du corps",
      "Genoux pliés à 90°, ramenés vers la poitrine",
      "Décoller légèrement le bassin du sol",
      "Redescendre les jambes sans les poser complètement"
    ],
    animation: "reverse-crunch.svg"
  },
  {
    id: "releves-jambes",
    nom: "Relevés de jambes",
    type: "repetitions",
    valeur: 12,
    repos: 25,
    description: "Travail du bas des abdominaux et de la sangle abdominale.",
    consignes: [
      "Allongé sur le dos, jambes tendues",
      "Bas du dos plaqué au sol",
      "Lever les jambes tendues jusqu'à la verticale",
      "Redescendre lentement sans toucher le sol"
    ],
    animation: "releves-jambes.svg"
  },
  {
    id: "dead-bug",
    nom: "Dead bug",
    type: "repetitions",
    valeur: 12,
    repos: 20,
    description: "Gainage dynamique, coordination et stabilité du tronc.",
    consignes: [
      "Allongé sur le dos, bras tendus vers le plafond",
      "Genoux pliés à 90° au-dessus des hanches",
      "Étendre bras et jambe opposés simultanément",
      "Revenir au centre puis alterner de côté"
    ],
    animation: "dead-bug.svg"
  },
  {
    id: "bicycle-crunch",
    nom: "Bicycle crunch",
    type: "repetitions",
    valeur: 20,
    repos: 20,
    description: "Travail des obliques et du gainage rotatoire.",
    consignes: [
      "Allongé sur le dos, mains derrière la tête",
      "Amener le coude vers le genou opposé en pédalant",
      "Garder le bas du dos au sol",
      "Alterner de manière contrôlée, sans à-coups"
    ],
    animation: "bicycle-crunch.svg"
  },
  {
    id: "planche",
    nom: "Planche",
    type: "temps",
    valeur: 30,
    repos: 30,
    description: "Gainage global statique.",
    consignes: [
      "Appui sur avant-bras et pointes de pieds",
      "Corps parfaitement aligné, pas de bassin qui tombe",
      "Regard vers le sol, nuque relâchée",
      "Respirer normalement pendant le maintien"
    ],
    animation: "planche.svg"
  },
  {
    id: "planche-laterale",
    nom: "Planche latérale",
    type: "temps",
    valeur: 20,
    repos: 20,
    description: "Gainage des obliques, un côté à la fois (20s par côté).",
    consignes: [
      "Appui sur un avant-bras, corps de profil",
      "Hanches levées, corps aligné en ligne droite",
      "Ne pas laisser le bassin descendre",
      "Changer de côté à la fin du temps"
    ],
    animation: "planche-laterale.svg"
  },
  {
    id: "hollow-hold",
    nom: "Hollow hold",
    type: "temps",
    valeur: 20,
    repos: 25,
    description: "Gainage abdominal statique intense.",
    consignes: [
      "Allongé sur le dos, bras tendus au-dessus de la tête",
      "Décoller épaules et jambes du sol simultanément",
      "Bas du dos plaqué au sol pendant tout le maintien",
      "Garder le corps en forme de \"banane\""
    ],
    animation: "hollow-hold.svg"
  },
  {
    id: "mountain-climbers",
    nom: "Mountain climbers",
    type: "temps",
    valeur: 30,
    repos: 20,
    description: "Cardio + gainage dynamique.",
    consignes: [
      "Position de planche haute, mains sous les épaules",
      "Ramener un genou vers la poitrine rapidement",
      "Alterner les jambes en gardant le bassin stable",
      "Maintenir un rythme soutenu"
    ],
    animation: "mountain-climbers.svg"
  },
  {
    id: "high-knees",
    nom: "High knees",
    type: "temps",
    valeur: 30,
    repos: 20,
    description: "Cardio, montées de genoux sur place.",
    consignes: [
      "Debout, buste droit",
      "Monter les genoux alternativement à hauteur de hanche",
      "Rester sur la pointe des pieds",
      "Garder un rythme rapide et régulier"
    ],
    animation: "high-knees.svg"
  },
  {
    id: "jumping-jacks",
    nom: "Jumping jacks",
    type: "temps",
    valeur: 30,
    repos: 15,
    description: "Cardio complet, échauffement ou dépense énergétique.",
    consignes: [
      "Debout, bras le long du corps",
      "Sauter en écartant jambes et bras simultanément",
      "Revenir à la position de départ en sautant",
      "Garder un rythme fluide"
    ],
    animation: "jumping-jacks.svg"
  },
  {
    id: "burpees",
    nom: "Burpees",
    type: "repetitions",
    valeur: 8,
    repos: 40,
    description: "Exercice complet à haute intensité, cardio et renforcement.",
    consignes: [
      "Départ debout, descendre en squat",
      "Poser les mains au sol, envoyer les jambes en arrière",
      "Effectuer une pompe (optionnelle selon niveau)",
      "Ramener les jambes puis sauter en extension complète"
    ],
    animation: "burpees.svg"
  }
];
