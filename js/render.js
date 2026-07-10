// =============================================================================
//  RENDER.JS — Tout l'affichage (DOM). Lit l'état, ne le modifie pas.
// =============================================================================
import { ASSETS, PLATEAUX, COFFRES, NOURRITURE, ENNEMIS, FANTOME, COMPAGNONS } from "./config.js";
import { positionSerpentin } from "./board.js";
import { state, joueurActif, meilleureArme, meilleureArmure } from "./state.js";

const $ = (s) => document.querySelector(s);
const img = (chemin) => `${ASSETS}/${chemin}`;

let mondeAffiche = null;         // quel monde est actuellement dessiné
const caseEls = new Map();       // index de case -> élément DOM
const pionEls = new Map();       // idx joueur -> élément img
const fantomeEls = [];           // éléments img des fantômes

// --- Écrans ------------------------------------------------------------------
export function montrerEcran(nom) {
  $("#ecran-accueil").hidden = nom !== "accueil";
  $("#ecran-jeu").hidden = nom !== "jeu";
}

// --- Construction du plateau (grille serpentine) -----------------------------
function libelleContenu(c) {
  switch (c.type) {
    case "coffre": return { src: COFFRES[c.coffre].img, badge: null };
    case "nourriture": {
      const n = NOURRITURE.find((x) => x.id === c.nourriture);
      return { src: n.img, badge: `+${n.soin}❤` };
    }
    case "ennemi": return { src: c.ennemi.img, badge: c.ennemi.vaincu ? null : `⚔${c.ennemi.force}` };
    case "marchand": return { src: "helper/helper_villageois.png", badge: "🛒" };
    case "compagnon": {
      const comp = COMPAGNONS[c.compagnon];
      return { src: comp.img, badge: "🤝" };
    }
    case "portail_nether": return { src: null, badge: "🔥 Nether", label: "🌋" };
    case "portail_end": return { src: null, badge: "End", label: "🌀" };
    case "arrivee": return { src: null, label: "🏆" };
    case "retour": return { src: null, label: "🏠" };
    case "depart": return { src: null, label: "🏁" };
    default: return null;
  }
}

function construirePlateau(plateau) {
  const plateauEl = $("#plateau");
  plateauEl.innerHTML = "";
  caseEls.clear();
  pionEls.clear();
  fantomeEls.length = 0;

  const cfg = plateau.cfg;
  plateauEl.className = `theme-${cfg.theme}`;
  plateauEl.style.gridTemplateColumns = `repeat(${cfg.cols}, var(--case))`;
  // décor animé (eau / lave / void) autour du plateau
  const zone = document.querySelector("#zone-plateau");
  if (zone) zone.className = `deco-${cfg.theme}`;

  for (const c of plateau.cases) {
    const { ligne, col } = positionSerpentin(c.index, cfg.cols);
    const el = document.createElement("div");
    el.className = `case ${c.type}`;
    el.style.gridColumn = col + 1;
    el.style.gridRow = ligne + 1;

    // numéro de case
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = c.index + 1;
    el.appendChild(num);

    // contenu (image ou emoji + badge)
    const info = libelleContenu(c);
    if (info) {
      if (info.src) {
        const im = document.createElement("img");
        im.className = "contenu";
        im.src = img(info.src);
        im.alt = c.type;
        if (c.type === "ennemi" && c.ennemi.vaincu) {
          im.style.opacity = ".15";
          im.style.filter = "grayscale(1)"; // ennemi déjà vaincu = fantomatique
        }
        el.appendChild(im);
      } else if (info.label) {
        const sp = document.createElement("span");
        sp.className = "contenu";
        sp.style.fontSize = "34px";
        sp.textContent = info.label;
        el.appendChild(sp);
      }
      if (info.badge) {
        const b = document.createElement("span");
        b.className = "badge";
        b.textContent = info.badge;
        el.appendChild(b);
      }
    }

    plateauEl.appendChild(el);
    caseEls.set(c.index, el);
  }
  mondeAffiche = plateau.monde;
}

// Positionne un pion/fantôme (centré sur une case, avec léger décalage si empilé)
function poser(el, index, rangEmpilement = 0, yPct = -55) {
  const caseEl = caseEls.get(index);
  if (!caseEl) return;
  const cx = caseEl.offsetLeft + caseEl.offsetWidth / 2;
  const cy = caseEl.offsetTop + caseEl.offsetHeight / 2;
  el.style.left = `${cx + rangEmpilement * 14 - 8}px`;
  el.style.top = `${cy}px`;
  el.style.transform = `translate(-50%, ${yPct}%)`;
}

// Place tous les pions du monde affiché
export function placerPions() {
  const plateauEl = $("#plateau");
  const monde = mondeAffiche;

  // compter les joueurs par case pour l'empilement
  const parCase = new Map();

  state.joueurs.forEach((j) => {
    let el = pionEls.get(j.idx);
    if (j.monde !== monde || j.aGagne) {
      if (el) { el.remove(); pionEls.delete(j.idx); }
      return;
    }
    if (!el) {
      el = document.createElement("img");
      el.className = "pion-plateau";
      el.src = img(j.pion.img);
      plateauEl.appendChild(el);
      pionEls.set(j.idx, el);
    }
    const rang = parCase.get(j.position) || 0;
    parCase.set(j.position, rang + 1);
    poser(el, j.position, rang);
    el.style.zIndex = 5 + rang;
    el.style.outline = j.idx === state.jTour ? "3px solid var(--or)" : "none";
    el.style.borderRadius = "6px";
  });
}

// Place les fantômes du monde affiché
export function placerFantomes() {
  const plateauEl = $("#plateau");
  // on retire les anciens
  fantomeEls.forEach((e) => e.remove());
  fantomeEls.length = 0;
  state.fantomes
    .filter((f) => f.monde === mondeAffiche)
    .forEach((f) => {
      const el = document.createElement("img");
      el.className = "fantome-plateau";
      el.src = img(FANTOME.img);
      plateauEl.appendChild(el);
      poser(el, f.position, 0, -72); // remonté pour être bien centré sur la case
      fantomeEls.push(el);
    });
}

// --- HUD ---------------------------------------------------------------------
function coeursHtml(joueur) {
  let s = "";
  for (let i = 0; i < joueur.coeurs; i++) s += "❤";
  const perdus = 10 - joueur.coeurs;
  for (let i = 0; i < perdus; i++) s += "🖤";
  return s;
}

export function rendreHud() {
  const cont = $("#hud-joueurs");
  cont.innerHTML = "";
  state.joueurs.forEach((j) => {
    const el = document.createElement("div");
    el.className = "hud-joueur";
    if (j.idx === state.jTour) el.classList.add("actif");
    if (j.coeurs <= 0) el.classList.add("mort");

    const arme = meilleureArme(j);
    const armure = meilleureArmure(j);
    let stuffHtml = "";
    if (arme) stuffHtml += `<img src="${img(arme.img)}" title="${arme.nom}"><span class="attaque-badge">${arme.attaque}</span>`;
    if (armure) stuffHtml += `<img src="${img(armure.img)}" title="${armure.nom} (-${armure.reduction})">`;
    if (j.boucliers > 0) stuffHtml += `<img src="${img("stuff/bouclier/stuff_bouclier.png")}" title="Bouclier x${j.boucliers}">`;
    if (j.denis) stuffHtml += `<img src="${img("helper/helper_denis.png")}" title="Denis">`;
    if (j.golem) stuffHtml += `<img src="${img("helper/helper_golem_de_fer.png")}" title="Golem (usage unique)">`;
    if (j.chat) stuffHtml += `<img src="${img("helper/helper_chat.png")}" title="Chat (anti-Enderman)">`;
    if (j.emeraudes > 0) stuffHtml += `<img src="${img("helper/emeraude.png")}" title="Émeraudes"><span class="attaque-badge" style="background:#2ecc71">${j.emeraudes}</span>`;

    el.innerHTML = `
      <img class="mini-pion" src="${img(j.pion.img)}">
      <div class="infos">
        <div class="coeurs">${coeursHtml(j)}</div>
        <div class="stuff">${stuffHtml || "<span style='font-size:11px;opacity:.6'>rien</span>"}</div>
      </div>`;
    cont.appendChild(el);
  });

  const j = joueurActif();
  $("#monde-label").textContent = PLATEAUX[j.monde].nom;
  $("#tour-label").textContent = `Tour ${state.tour}`;

  // joueur actif dans la barre du bas
  const ja = $("#joueur-actif");
  ja.innerHTML = `<img src="${img(j.pion.img)}"><span>${j.pion.nom}</span>`;
}

// --- Rendu complet du jeu ----------------------------------------------------
export function rendreJeu() {
  const j = joueurActif();
  const plateau = state.plateaux[j.monde];
  if (mondeAffiche !== j.monde) construirePlateau(plateau);
  rendreHud();
  placerPions();
  placerFantomes();
}

// Redessine juste une case (ex : ennemi vaincu, coffre ouvert)
export function rafraichirCase(index) {
  const j = joueurActif();
  if (mondeAffiche !== j.monde) return;
  construirePlateau(state.plateaux[j.monde]);
  placerPions();
  placerFantomes();
}

// --- Dé ----------------------------------------------------------------------
export function afficherDe(valeur, anime = true) {
  const el = $("#de-resultat");
  el.textContent = valeur;
  if (anime) {
    el.classList.remove("roule");
    void el.offsetWidth; // force le rejeu de l'animation
    el.classList.add("roule");
  }
}

// --- Modales -----------------------------------------------------------------
export function modale({ titre = "", html = "", img: image = null, boutons = [] }) {
  const overlay = $("#modale");
  const contenu = $("#modale-contenu");
  let h = "";
  if (titre) h += `<h2>${titre}</h2>`;
  if (image) h += `<img class="modale-img" src="${img(image)}">`;
  h += html;
  h += `<div class="modale-boutons"></div>`;
  contenu.innerHTML = h;

  const zone = contenu.querySelector(".modale-boutons");
  boutons.forEach((b) => {
    const btn = document.createElement("button");
    btn.className = `btn ${b.classe || "btn-principal"}`;
    btn.innerHTML = b.texte; // innerHTML pour décoder les entités (&nbsp; etc.)
    if (b.desactive) btn.disabled = true;
    btn.onclick = () => b.onClick && b.onClick();
    zone.appendChild(btn);
  });
  overlay.hidden = false;
}

export function fermerModale() {
  $("#modale").hidden = true;
}
