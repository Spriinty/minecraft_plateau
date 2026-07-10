// =============================================================================
//  STATE.JS — L'état de la partie (les données qui changent) + sauvegarde.
// =============================================================================
import { RULES, PIONS, ARMES, ARMURES } from "./config.js";
import { genererPlateau } from "./board.js";

const CLE_SAUVEGARDE = "minecraft_plateau_save_v1";

// L'objet global qui contient toute la partie en cours
export const state = {
  ecran: "accueil",
  joueurs: [],
  jTour: 0,      // index du joueur qui joue
  tour: 1,       // numéro de tour (augmente quand tout le monde a joué)
  plateaux: {},  // { overworld:{...}, nether:{...}, end:{...} }
  fantomes: [],  // [{ monde, position }]
  fini: false,
};

// Crée un joueur neuf à partir d'un id de pion
export function creerJoueur(idx, pionId) {
  const pion = PIONS.find((p) => p.id === pionId) || PIONS[0];
  return {
    idx,
    pion,
    coeurs: RULES.coeursDepart,
    monde: "overworld",
    position: 0,
    retour: null,     // { monde, position } pour revenir après un portail
    armes: [],        // liste d'ids d'armes possédées
    armures: [],      // liste d'ids d'armures possédées
    emeraudes: 0,     // monnaie pour le marchand
    deDivise: 1,      // diviseur du prochain lancer (sable des âmes)
    boucliers: 0,     // nombre de boucliers
    denis: false,     // compagnon loup
    golem: false,     // golem de fer (usage unique)
    chat: false,      // chat (bonus contre Enderman)
    aGagne: false,
  };
}

// Démarre une nouvelle partie
export function nouvellePartie(pionIds) {
  state.joueurs = pionIds.map((id, i) => creerJoueur(i, id));
  state.jTour = 0;
  state.tour = 1;
  state.fini = false;
  state.fantomes = [];
  state.plateaux = {
    overworld: genererPlateau("overworld"),
    nether: genererPlateau("nether"),
    end: genererPlateau("end"),
  };
  state.ecran = "jeu";
  sauvegarder();
}

// --- Helpers sur les joueurs -------------------------------------------------

export function joueurActif() {
  return state.joueurs[state.jTour];
}

export function plateauDe(joueur) {
  return state.plateaux[joueur.monde];
}

// Meilleure arme possédée (celle avec la plus grosse attaque)
export function meilleureArme(joueur) {
  let best = null;
  for (const id of joueur.armes) {
    const a = ARMES.find((x) => x.id === id);
    if (a && (!best || a.attaque > best.attaque)) best = a;
  }
  return best;
}

// Meilleure armure portée (celle qui bloque le plus de dégâts)
export function meilleureArmure(joueur) {
  let best = null;
  for (const id of joueur.armures || []) {
    const a = ARMURES.find((x) => x.id === id);
    if (a && (!best || a.reduction > best.reduction)) best = a;
  }
  return best;
}

// Ajoute un objet à l'inventaire (arme, armure, bouclier, cœur, émeraudes)
export function ajouterObjet(joueur, objetId, qty = 1) {
  if (objetId === "emeraude") {
    joueur.emeraudes = (joueur.emeraudes || 0) + qty;
  } else if (objetId === "bouclier") {
    joueur.boucliers++;
  } else if (objetId === "coeur") {
    soigner(joueur, 2);
  } else if (ARMURES.find((a) => a.id === objetId)) {
    if (!joueur.armures.includes(objetId)) joueur.armures.push(objetId);
  } else if (ARMES.find((a) => a.id === objetId)) {
    if (!joueur.armes.includes(objetId)) joueur.armes.push(objetId);
  }
}

export function soigner(joueur, coeurs) {
  joueur.coeurs = Math.min(RULES.coeursMax, joueur.coeurs + coeurs);
}

export function blesser(joueur, degats) {
  joueur.coeurs = Math.max(0, joueur.coeurs - degats);
  return joueur.coeurs <= 0;
}

// Tous les joueurs vivants ont-ils fini ? (pour la fin de partie)
export function tousFini() {
  return state.joueurs.every((j) => j.aGagne);
}

// --- Sauvegarde locale -------------------------------------------------------

export function sauvegarder() {
  try {
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify({
      joueurs: state.joueurs, jTour: state.jTour, tour: state.tour,
      plateaux: state.plateaux, fantomes: state.fantomes, fini: state.fini,
    }));
  } catch (e) { /* pas grave si la sauvegarde échoue */ }
}

export function chargerSauvegarde() {
  try {
    const brut = localStorage.getItem(CLE_SAUVEGARDE);
    if (!brut) return false;
    const s = JSON.parse(brut);
    Object.assign(state, s);
    state.ecran = "jeu";
    return true;
  } catch (e) { return false; }
}

export function ilYAUneSauvegarde() {
  const brut = localStorage.getItem(CLE_SAUVEGARDE);
  if (!brut) return false;
  try {
    const s = JSON.parse(brut);
    return s.joueurs && s.joueurs.length > 0 && !s.fini;
  } catch (e) { return false; }
}

export function effacerSauvegarde() {
  localStorage.removeItem(CLE_SAUVEGARDE);
}
