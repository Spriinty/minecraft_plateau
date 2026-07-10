// =============================================================================
//  BOARD.JS — Génère les plateaux (liste de cases) selon la config.
//  Chaque case = { index, type, ...données selon le type }
// =============================================================================
import { ENNEMIS, COFFRES, NOURRITURE, COMPAGNONS, CASES_SPECIALES, PLATEAUX, RULES } from "./config.js";
import { alea, auHasard, chance } from "./utils.js";

// Types de cases :
//  depart, vide, ennemi, coffre, nourriture, marchand,
//  portail_nether, portail_end, retour, arrivee

// Choisit une rareté de coffre au hasard (majorité de coffres communs)
function coffreAuHasard() {
  const r = Math.random();
  if (r < 0.65) return "coffre";
  if (r < 0.85) return "coffre_large";
  return chance(0.5) ? "coffre_ender" : "shulker";
}

function ennemiAuHasard(monde) {
  const modele = auHasard(ENNEMIS[monde]);
  return { ...modele, vaincu: false }; // copie pour que chaque case soit indépendante
}

// Choisit un ennemi dont la force correspond à l'avancement sur le plateau :
// faibles au début, forts vers la fin (avec un peu de hasard pour la variété).
function ennemiSelonProgression(monde, i, n) {
  const liste = [...ENNEMIS[monde]].sort((a, b) => a.force - b.force);
  const ratio = i / (n - 1);                 // 0 au départ, 1 à l'arrivée
  let idx = Math.round(ratio * (liste.length - 1));
  idx += alea(-1, 1);                         // petite variation
  idx = Math.max(0, Math.min(liste.length - 1, idx));
  return { ...liste[idx], vaincu: false };
}

// Génère un plateau pour un monde donné ("overworld" | "nether" | "end")
export function genererPlateau(monde) {
  const cfg = PLATEAUX[monde];
  const n = cfg.cases;
  const cases = [];

  // 1) On crée toutes les cases "vides" par défaut
  for (let i = 0; i < n; i++) {
    cases[i] = { index: i, type: "vide" };
  }

  // 2) Départ et arrivée
  cases[0].type = "depart";
  cases[n - 1].type = cfg.monde === "overworld" ? "arrivee" : "retour";
  // Dans le Nether/End, la dernière case ramène à l'Overworld (case "retour").
  // Dans l'Overworld, c'est l'arrivée = victoire.

  // 3) Cases spéciales fixes (portails, marchand) réparties dans le plateau
  const reserves = new Set([0, n - 1]);
  const placerSpecial = (type, ratioPosition) => {
    let idx = Math.round(ratioPosition * (n - 1));
    // décale si la position est déjà prise
    while (reserves.has(idx) && idx < n - 1) idx++;
    while (reserves.has(idx) && idx > 1) idx--;
    if (!reserves.has(idx)) {
      cases[idx].type = type;
      reserves.add(idx);
    }
  };

  if (cfg.aUnMarchand)       placerSpecial("marchand", 0.25);
  if (cfg.aUnPortailNether)  placerSpecial("portail_nether", 0.5);
  if (cfg.aUnPortailEnd)     placerSpecial("portail_end", 0.78);

  // 4) On remplit les cases restantes selon les densités
  for (let i = 1; i < n - 1; i++) {
    if (reserves.has(i)) continue;
    const r = Math.random();
    if (r < cfg.densiteEnnemi) {
      cases[i].type = "ennemi";
      cases[i].ennemi = ennemiSelonProgression(monde, i, n);
    } else if (r < cfg.densiteEnnemi + cfg.densiteCoffre) {
      cases[i].type = "coffre";
      cases[i].coffre = coffreAuHasard();
    } else if (r < cfg.densiteEnnemi + cfg.densiteCoffre + cfg.densiteNourriture) {
      cases[i].type = "nourriture";
      cases[i].nourriture = auHasard(NOURRITURE).id;
    }
    // sinon : reste "vide"
  }

  // 4b) Début de partie équilibré : on veut de l'équipement AVANT tout ennemi.
  //     - aucun ennemi sur les premières cases
  //     - au moins un coffre tout près du départ
  const zone = RULES.zoneSansEnnemi || 0;
  for (let i = 1; i <= zone && i < n - 1; i++) {
    if (reserves.has(i)) continue;
    if (cases[i].type === "ennemi") { cases[i].type = "vide"; cases[i].ennemi = null; }
  }
  const avant = Math.min(RULES.coffreGarantiAvant || 0, n - 2);
  let coffreTot = false;
  for (let i = 1; i <= avant; i++) if (cases[i].type === "coffre") coffreTot = true;
  if (!coffreTot && avant >= 1) {
    // on force un coffre sur une case libre proche du départ
    for (let i = 1; i <= avant; i++) {
      if (!reserves.has(i) && cases[i].type !== "ennemi") {
        cases[i].type = "coffre";
        cases[i].coffre = "coffre";
        break;
      }
    }
  }

  // 4c) Première ligne "sûre" : que des COFFRES (stuff + émeraudes), pas de
  //     nourriture (inutile tant qu'on n'a pas perdu de vie). Les deux joueurs
  //     démarrent ainsi avec de l'équipement.
  if (cfg.premiereLigneSure) {
    for (let i = 1; i < cfg.cols && i < n - 1; i++) {
      if (reserves.has(i)) continue;
      cases[i].type = "coffre";
      cases[i].coffre = coffreAuHasard();
      cases[i].ennemi = null;
      cases[i].nourriture = null;
    }
  }

  // 5) Cases "compagnon" (Denis / Golem / Chat) placées sur des cases vides
  const idsCompagnons = Object.keys(COMPAGNONS); // ["denis","golem","chat"]
  const nbComp = cfg.nbCompagnons || 0;
  let poses = 0, essais = 0;
  while (poses < nbComp && essais < 200) {
    essais++;
    const i = alea(1, n - 2);
    if (cases[i].type !== "vide") continue;
    cases[i].type = "compagnon";
    cases[i].compagnon = idsCompagnons[poses % idsCompagnons.length];
    poses++;
  }

  // 6) Cases spéciales (grotte, lave, sable des âmes, faille, wagonnet...)
  //    placées sur des cases vides, en dehors de la zone de départ.
  for (const spec of cfg.casesSpeciales || []) {
    if (!CASES_SPECIALES[spec.type]) continue;
    let mis = 0, tries = 0;
    while (mis < spec.nb && tries < 300) {
      tries++;
      const i = alea(zone + 1, n - 2);
      if (cases[i].type !== "vide") continue;
      cases[i].type = "speciale";
      cases[i].special = spec.type;
      mis++;
    }
  }

  return { monde, cfg, cases };
}

// Calcule la position (ligne, colonne) d'une case en serpentin.
// Ligne 0 : gauche->droite, ligne 1 : droite->gauche, etc.
export function positionSerpentin(index, cols) {
  const ligne = Math.floor(index / cols);
  let col = index % cols;
  if (ligne % 2 === 1) col = cols - 1 - col; // inverse une ligne sur deux
  return { ligne, col };
}
