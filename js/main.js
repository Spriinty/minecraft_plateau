// =============================================================================
//  MAIN.JS — Point de départ : branche les boutons et lance le jeu.
// =============================================================================
import { $ } from "./utils.js";
import { state, nouvellePartie, chargerSauvegarde, ilYAUneSauvegarde,
         effacerSauvegarde } from "./state.js";
import { construireAccueil, pionsChoisis, selectionParDefaut } from "./ui.js";
import { jouerTour } from "./game.js";
import * as R from "./render.js";

function allerAccueil() {
  state.ecran = "accueil";
  state.fini = false;
  selectionParDefaut();
  construireAccueil();
  $("#btn-reprendre").hidden = !ilYAUneSauvegarde();
  R.montrerEcran("accueil");
  const de = $("#de-resultat");
  if (de) de.textContent = "";
}

function demarrerPartie(pions) {
  nouvellePartie(pions);
  R.montrerEcran("jeu");
  R.rendreJeu();
  $("#btn-de").disabled = false;
}

function reprendrePartie() {
  if (chargerSauvegarde()) {
    R.montrerEcran("jeu");
    R.rendreJeu();
    $("#btn-de").disabled = false;
  }
}

function init() {
  // Expose l'état + le rendu (pratique pour le débogage / les tests)
  window.__state = state;
  window.__rendreJeu = () => R.rendreJeu();

  // Écran d'accueil
  allerAccueil();

  // Boutons
  $("#btn-jouer").addEventListener("click", () => {
    const pions = pionsChoisis();
    if (pions.length >= 2) demarrerPartie(pions);
  });
  $("#btn-reprendre").addEventListener("click", reprendrePartie);
  $("#btn-de").addEventListener("click", jouerTour);

  // Menu pause
  $("#btn-menu").addEventListener("click", () => { $("#menu-pause").hidden = false; });
  $("#btn-reprise").addEventListener("click", () => { $("#menu-pause").hidden = true; });
  $("#btn-nouvelle").addEventListener("click", () => {
    $("#menu-pause").hidden = true;
    effacerSauvegarde();
    allerAccueil();
  });

  // Quand quelqu'un gagne, "Rejouer" ramène à l'accueil
  window.addEventListener("rejouer", () => {
    R.fermerModale();
    effacerSauvegarde();
    allerAccueil();
  });

  // Repositionner les pions si on tourne/redimensionne l'écran
  window.addEventListener("resize", () => {
    if (!$("#ecran-jeu").hidden) { R.placerPions(); R.placerFantomes(); }
  });
}

document.addEventListener("DOMContentLoaded", init);
