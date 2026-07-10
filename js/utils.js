// =============================================================================
//  UTILS.JS — Petites fonctions pratiques réutilisées partout.
// =============================================================================

// Nombre entier aléatoire entre min et max inclus
export function alea(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Élément au hasard dans un tableau
export function auHasard(tableau) {
  return tableau[Math.floor(Math.random() * tableau.length)];
}

// Tirage pondéré : liste d'objets { objet, poids } -> renvoie un "objet"
export function tirageParPoids(liste) {
  const total = liste.reduce((s, e) => s + e.poids, 0);
  let r = Math.random() * total;
  for (const e of liste) {
    r -= e.poids;
    if (r <= 0) return e.objet;
  }
  return liste[liste.length - 1].objet;
}

// Vrai avec une probabilité p (0 à 1)
export function chance(p) {
  return Math.random() < p;
}

// Raccourci de sélection DOM
export const $ = (sel, racine = document) => racine.querySelector(sel);
export const $$ = (sel, racine = document) => [...racine.querySelectorAll(sel)];

// Crée un élément avec classes + attributs
export function creer(balise, classes = "", attrs = {}) {
  const el = document.createElement(balise);
  if (classes) el.className = classes;
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "text") el.textContent = v;
    else if (k === "html") el.innerHTML = v;
    else el.setAttribute(k, v);
  }
  return el;
}

// Attendre un certain temps (pour les animations) — usage : await pause(400)
export function pause(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
