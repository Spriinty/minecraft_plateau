// =============================================================================
//  MAIN.JS — Point de départ : branche les boutons et lance le jeu.
// =============================================================================
import { $ } from "./utils.js";
import { state, nouvellePartie, chargerSauvegarde, ilYAUneSauvegarde,
         effacerSauvegarde } from "./state.js";
import { construireAccueil, pionsChoisis, selectionParDefaut } from "./ui.js";
import { jouerTour, enchainerIA } from "./game.js";
import { joueurActif } from "./state.js";
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

function demarrerPartie(config) {
  nouvellePartie(config);
  R.montrerEcran("jeu");
  R.rendreJeu();
  $("#btn-de").disabled = false;
  enchainerIA(); // au cas où (ex : reprise sur un tour de robot)
}

function reprendrePartie() {
  if (chargerSauvegarde()) {
    R.montrerEcran("jeu");
    R.rendreJeu();
    $("#btn-de").disabled = false;
    enchainerIA();
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
    const config = pionsChoisis();
    if (config.length >= 2) demarrerPartie(config);
  });
  $("#btn-reprendre").addEventListener("click", reprendrePartie);
  // Clic sur le dé : ignoré si c'est le tour d'un robot ; enchaîne ensuite les robots
  $("#btn-de").addEventListener("click", async () => {
    if (joueurActif() && joueurActif().estIA) return;
    await jouerTour();
    await enchainerIA();
  });

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

  // Recalculer la taille des cases + repositionner si on tourne/redimensionne
  window.addEventListener("resize", () => {
    if (!$("#ecran-jeu").hidden) R.reflow();
  });
  // iOS : la barre Safari change de hauteur au scroll → on réajuste
  window.addEventListener("orientationchange", () => {
    setTimeout(() => { if (!$("#ecran-jeu").hidden) R.reflow(); }, 250);
  });
}

document.addEventListener("DOMContentLoaded", init);
