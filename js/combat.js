// =============================================================================
//  COMBAT.JS — Calcule l'issue d'un combat (fonction "pure", elle ne touche
//  pas au DOM). L'affichage est géré ailleurs.
// =============================================================================
import { COMPAGNONS, BOUCLIER } from "./config.js";
import { meilleureArme, meilleureArmure } from "./state.js";

// Calcule l'attaque effective du joueur contre un ennemi donné.
// options.utiliserGolem = true -> on lâche le golem (attaque énorme, usage unique)
export function attaqueEffective(joueur, ennemi, options = {}) {
  const arme = meilleureArme(joueur);
  let att = arme ? arme.attaque : 0; // à mains nues = 0
  const details = [];
  if (arme) details.push(`${arme.nom} (+${arme.attaque})`);
  else details.push("mains nues (0)");

  // Denis, le loup, aide à chaque combat
  if (joueur.denis) {
    att += COMPAGNONS.denis.bonusAttaque;
    details.push(`Denis (+${COMPAGNONS.denis.bonusAttaque})`);
  }
  // Le chat effraie les Endermen
  if (joueur.chat && ennemi.type === "enderman") {
    att += COMPAGNONS.chat.bonusAttaque;
    details.push(`Chat (+${COMPAGNONS.chat.bonusAttaque})`);
  }
  // Le golem : attaque massive à usage unique
  if (options.utiliserGolem && joueur.golem) {
    att += COMPAGNONS.golem.attaqueUnique;
    details.push(`Golem (+${COMPAGNONS.golem.attaqueUnique})`);
  }
  return { attaque: att, details };
}

// Résout le combat. Renvoie un compte-rendu.
export function resoudreCombat(joueur, ennemi, options = {}) {
  const { attaque, details } = attaqueEffective(joueur, ennemi, options);
  const reductionBouclier = joueur.boucliers > 0 ? BOUCLIER.reduction : 0;
  const armure = meilleureArmure(joueur);
  const reductionArmure = armure ? armure.reduction : 0;
  const reduction = reductionBouclier + reductionArmure;

  if (attaque >= ennemi.force) {
    // Victoire : l'ennemi est vaincu, aucun dégât
    return {
      vaincu: true, degats: 0, attaque, details,
      reductionBouclier, reductionArmure, reduction,
      golemUtilise: !!options.utiliserGolem,
    };
  }

  // Défaite partielle : on prend les dégâts restants (moins bouclier + armure)
  let degats = ennemi.force - attaque - reduction;
  if (degats < 0) degats = 0;
  return {
    vaincu: false, degats, attaque, details,
    reductionBouclier, reductionArmure, reduction,
    golemUtilise: !!options.utiliserGolem,
  };
}
