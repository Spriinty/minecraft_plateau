// =============================================================================
//  GAME.JS — La logique du jeu : tours, dé, déplacements, événements, combat.
// =============================================================================
import { ASSETS, RULES, PLATEAUX, COFFRES, BUTIN, NOURRITURE, ARMES, ARMURES, FANTOME,
         COMPAGNONS, VILLAGEOIS, OFFRES_MARCHAND, EMERAUDE, CASES_SPECIALES,
         BOSS_END, BEBE_DRAGON } from "./config.js";
import { alea, auHasard, chance, tirageParPoids, pause } from "./utils.js";
import { resoudreCombat } from "./combat.js";
import * as R from "./render.js";
import {
  state, joueurActif, plateauDe, ajouterObjet, soigner, blesser,
  meilleureArme, sauvegarder,
} from "./state.js";

let occupe = false; // empêche de relancer le dé pendant une action

// Petite modale qui attend le clic d'un bouton et renvoie sa valeur.
// Si le joueur actif est un robot, un choix est fait automatiquement
// (le bouton marqué iaDefaut, sinon le premier) — sauf sur l'écran de fin.
function demander({ titre, html = "", img = null, boutons }) {
  return new Promise((resolve) => {
    let resolu = false;
    const choisir = (val) => { if (resolu) return; resolu = true; R.fermerModale(); resolve(val); };
    R.modale({
      titre, html, img,
      boutons: boutons.map((b) => ({ ...b, onClick: () => choisir(b.valeur) })),
    });
    const j = joueurActif();
    if (j && j.estIA && !state.fini) {
      const pref = boutons.find((b) => b.iaDefaut) || boutons[0];
      setTimeout(() => choisir(pref.valeur), 950);
    }
  });
}

// Enchaîne automatiquement les tours des robots jusqu'au prochain humain.
export async function enchainerIA() {
  const btn = document.querySelector("#btn-de");
  while (!state.fini && joueurActif() && joueurActif().estIA) {
    if (btn) btn.disabled = true;
    await pause(700);
    await jouerTour();
  }
  if (btn && !state.fini) btn.disabled = false;
}

// =============================================================================
//  LANCER LE DÉ ET JOUER LE TOUR
// =============================================================================
export async function jouerTour() {
  if (state.boss && state.boss.actif) return attaquerBoss(); // mode combat de boss
  if (occupe || state.fini) return;
  occupe = true;
  const btn = document.querySelector("#btn-de");
  btn.disabled = true;

  const joueur = joueurActif();

  // Un fantôme a-t-il dérivé sur ma case entre deux tours ? Si oui, il m'attaque
  // AVANT que je joue (corrige l'incohérence où c'était le joueur suivant qui
  // "récupérait" le combat).
  const fantomeSurMoi = state.fantomes.find(
    (f) => f.monde === joueur.monde && f.position === joueur.position
  );
  if (fantomeSurMoi) {
    await combattre(joueur, { ...FANTOME }, fantomeSurMoi);
    R.rendreJeu();
  }

  const plateau = plateauDe(joueur);
  const maxDe = plateau.cfg.de;

  // Animation du dé (quelques valeurs qui défilent)
  for (let i = 0; i < 6; i++) { R.afficherDe(alea(1, maxDe)); await pause(70); }
  // Crochet de debug/test : window.__forceDe force la valeur du prochain lancer
  let valeur = (typeof window !== "undefined" && window.__forceDe)
    ? Math.min(maxDe, window.__forceDe) : alea(1, maxDe);
  if (typeof window !== "undefined") window.__forceDe = null;
  // Sable des âmes : le prochain lancer est divisé
  if (joueur.deDivise && joueur.deDivise > 1) {
    valeur = Math.max(1, Math.ceil(valeur / joueur.deDivise));
    joueur.deDivise = 1;
  }
  R.afficherDe(valeur);
  await pause(350);

  await deplacer(joueur, valeur);

  // Fin du tour du joueur
  await finDeTour();

  occupe = false;
  if (!state.fini) btn.disabled = false;
}

// Déplace le joueur case par case (avec animation)
async function deplacer(joueur, pas) {
  const plateau = plateauDe(joueur);
  const dernier = plateau.cases.length - 1;

  for (let i = 0; i < pas; i++) {
    if (joueur.position < dernier) {
      joueur.position++;
      R.placerPions();
      await pause(200);
    }
  }
  await pause(220); // laisse le pion finir de glisser avant d'ouvrir un événement
  await resoudreCase(joueur);
}

// =============================================================================
//  RÉSOUDRE LA CASE OÙ ON ARRIVE
// =============================================================================
async function resoudreCase(joueur) {
  const plateau = plateauDe(joueur);
  const c = plateau.cases[joueur.position];

  // Un fantôme est-il sur cette case ? On le combat, puis on continue à
  // résoudre le contenu de la case (sauf si on a été renvoyé au départ).
  const fantomeIci = state.fantomes.find(
    (f) => f.monde === joueur.monde && f.position === joueur.position
  );
  if (fantomeIci) {
    await combattre(joueur, { ...FANTOME }, fantomeIci);
    if (joueur.position !== c.index || joueur.monde !== plateau.monde) {
      sauvegarder();
      return; // respawn : on n'ouvre pas l'ancienne case
    }
  }

  switch (c.type) {
    case "ennemi":
      if (!c.ennemi.vaincu) await combattre(joueur, c.ennemi, null, c);
      break;
    case "coffre":
      // Réutilisable : chaque joueur qui s'arrête dessus reçoit du butin (équité)
      await ouvrirCoffre(joueur, c);
      break;
    case "nourriture":
      await ramasserNourriture(joueur, c);
      break;
    case "marchand":
      await marchand(joueur);
      break;
    case "compagnon":
      await ramasserCompagnon(joueur, c);
      break;
    case "bebe_dragon":
      await ramasserBebeDragon(joueur, c);
      break;
    case "speciale":
      await caseSpeciale(joueur, c);
      break;
    case "portail_nether":
      await portail(joueur, "nether");
      break;
    case "portail_end":
      await portail(joueur, "end");
      break;
    case "retour":
      await retourOverworld(joueur, plateau);
      break;
    case "arrivee":
      await victoire(joueur);
      break;
    default:
      break; // case vide : rien
  }
  sauvegarder();
}

// =============================================================================
//  COMBAT
// =============================================================================
async function combattre(joueur, ennemi, fantomeRef = null, caseRef = null) {
  const peutGolem = joueur.golem;

  // Aperçu du combat (attaque prévue sans golem)
  const apercu = resoudreCombat(joueur, ennemi, { utiliserGolem: false });

  const boutons = [{ texte: "Attaquer ⚔️", valeur: "attaque", classe: "btn-principal", iaDefaut: true }];
  if (peutGolem) boutons.push({ texte: "Lâcher le Golem 🗿", valeur: "golem", classe: "btn-secondaire" });

  const html = `
    <p>Un <b>${ennemi.nom}</b> te barre la route&nbsp;!</p>
    <div class="combat-stats">
      <div class="stat">Sa force<b>⚔️ ${ennemi.force}</b></div>
      <div class="stat">Ton attaque<b>🗡️ ${apercu.attaque}</b></div>
    </div>
    <p style="font-size:13px;opacity:.75">${apercu.details.join(" · ")}</p>`;

  const choix = await demander({ titre: "Combat&nbsp;!", img: ennemi.img, html, boutons });

  const res = resoudreCombat(joueur, ennemi, { utiliserGolem: choix === "golem" });
  if (res.golemUtilise) joueur.golem = false; // usage unique

  if (res.vaincu) {
    if (caseRef) caseRef.ennemi.vaincu = true;
    if (fantomeRef) retirerFantome(fantomeRef);
    R.rafraichirCase(joueur.position);
    await demander({
      titre: "Victoire&nbsp;! 🎉",
      img: ennemi.img,
      html: `<p class="gain">Tu as vaincu le ${ennemi.nom} sans une égratignure&nbsp;!</p>`,
      boutons: [{ texte: "Continuer", valeur: "ok" }],
    });
  } else {
    const mort = blesser(joueur, res.degats);
    R.rendreHud();
    let txt = `<p class="perte">Aïe&nbsp;! Tu perds ${res.degats} cœur${res.degats > 1 ? "s" : ""}.</p>`;
    if (res.reduction) txt += `<p style="font-size:13px">🛡️ Ta protection a bloqué ${res.reduction} dégât(s).</p>`;
    await demander({
      titre: "Ouille&nbsp;!", img: ennemi.img, html: txt,
      boutons: [{ texte: "Continuer", valeur: "ok" }],
    });
    if (mort) await respawn(joueur);
  }
}

// Quand un joueur tombe à 0 cœur : il réapparaît au départ de l'Overworld,
// avec toute sa vie (il garde son stuff), pour ne pas rester coincé.
async function respawn(joueur) {
  const mondeAvant = joueur.monde;
  joueur.coeurs = RULES.respawnPleineVie ? RULES.coeursMax : Math.max(2, Math.floor(RULES.coeursMax / 2));
  joueur.monde = RULES.respawnMonde || "overworld";
  joueur.position = 0;
  joueur.retour = null;
  R.rendreJeu();
  const txtMonde = mondeAvant !== joueur.monde ? " Tu ressors de ce monde et " : " Tu ";
  await demander({
    titre: "K.O.&nbsp;! 💫",
    html: `<p>Tu n'as plus de cœurs...${txtMonde}réapparais au départ de l'Overworld avec ${joueur.coeurs} cœurs (tu gardes ton équipement).</p>`,
    boutons: [{ texte: "Repartir", valeur: "ok" }],
  });
}

// =============================================================================
//  COFFRES
// =============================================================================
async function ouvrirCoffre(joueur, c) {
  const coffre = COFFRES[c.coffre];
  const objetId = tirageParPoids(BUTIN[coffre.rarete]);
  // le coffre reste sur le plateau et pourra être rouvert par les autres joueurs

  let nom, image, suffixe = "";
  if (objetId === "emeraude") {
    const [min, max] = RULES.emeraudesParCoffre || [1, 1];
    const qty = alea(min, max);
    ajouterObjet(joueur, "emeraude", qty);
    nom = `${qty} émeraude${qty > 1 ? "s" : ""} 💚`; image = EMERAUDE.img;
  } else if (objetId === "bouclier") {
    ajouterObjet(joueur, objetId);
    nom = "un Bouclier 🛡️"; image = "stuff/bouclier/stuff_bouclier.png";
  } else if (objetId === "coeur") {
    ajouterObjet(joueur, objetId);
    nom = "2 cœurs ❤️"; image = "helper/helper_vache.png";
  } else {
    // arme ou armure : on ne garde que la plus forte
    const a = ARMES.find((x) => x.id === objetId) || ARMURES.find((x) => x.id === objetId);
    ajouterObjet(joueur, objetId);
    const gardé = joueur.armes.includes(objetId) || joueur.armures.includes(objetId);
    nom = a.nom; image = a.img;
    if (!gardé) suffixe = "<br><span style='font-size:13px;opacity:.85'>…mais ton équipement actuel est meilleur, tu le laisses.</span>";
  }
  R.rendreHud();

  await demander({
    titre: `${coffre.nom} ouvert&nbsp;!`, img: image,
    html: `<p class="gain">Tu trouves ${nom}&nbsp;!${suffixe}</p>`,
    boutons: [{ texte: "Super&nbsp;!", valeur: "ok" }],
  });
}

// =============================================================================
//  NOURRITURE (soin)
// =============================================================================
async function ramasserNourriture(joueur, c) {
  const n = NOURRITURE.find((x) => x.id === c.nourriture);
  soigner(joueur, n.soin);
  c.type = "vide"; c.nourriture = null;
  R.rafraichirCase(joueur.position);
  R.rendreHud();

  // Petite animation : l'animal au centre, des morceaux qui tournent autour
  const animal = `${ASSETS}/${n.img}`;
  const aliment = `${ASSETS}/${n.aliment}`;
  const anim = `
    <div class="miam-anim">
      <img class="miam-centre" src="${animal}">
      <img class="miam-morceau m1" src="${aliment}">
      <img class="miam-morceau m2" src="${aliment}">
      <img class="miam-morceau m3" src="${aliment}">
      <img class="miam-morceau m4" src="${aliment}">
    </div>
    <p class="gain">Miam&nbsp;! Tu manges ${n.alimentNom.toLowerCase()} et récupères
       ${n.soin} cœur${n.soin > 1 ? "s" : ""}.</p>`;

  await demander({
    titre: "🍖 À table&nbsp;!", html: anim,
    boutons: [{ texte: "Continuer", valeur: "ok" }],
  });
}

// =============================================================================
//  COMPAGNONS (Denis / Golem / Chat)
// =============================================================================
async function ramasserCompagnon(joueur, c) {
  const comp = COMPAGNONS[c.compagnon];
  joueur[comp.id] = true; // active denis / golem / chat
  c.type = "vide"; c.compagnon = null;
  R.rafraichirCase(joueur.position);
  R.rendreHud();

  let effet;
  if (comp.id === "denis") effet = `Denis te suit et ajoute <b>+${comp.bonusAttaque}</b> d'attaque à chaque combat&nbsp;!`;
  else if (comp.id === "golem") effet = `Le Golem est prêt : une <b>attaque massive</b> à utiliser une seule fois en combat&nbsp;!`;
  else if (comp.id === "chat") effet = `Le chat effraie les Endermen (<b>+${comp.bonusAttaque}</b> contre eux)&nbsp;!`;

  await demander({
    titre: `${comp.nom} te rejoint&nbsp;!`, img: comp.img,
    html: `<p class="gain">${effet}</p>`,
    boutons: [{ texte: "Génial&nbsp;!", valeur: "ok" }],
  });
}

// =============================================================================
//  CASES SPÉCIALES (grotte, lave, sable des âmes, faille, wagonnet...)
// =============================================================================
async function caseSpeciale(joueur, c) {
  const s = CASES_SPECIALES[c.special];
  const plateau = plateauDe(joueur);
  const dernier = plateau.cases.length - 1;
  const texte = s.texte.replace("{v}", s.valeur);

  const afficher = async (titreClasse = "perte") => {
    await demander({
      titre: `${s.emoji} ${s.nom}`,
      html: `<p class="${titreClasse}">${texte}</p>`,
      boutons: [{ texte: "Continuer", valeur: "ok" }],
    });
  };

  if (s.effet === "recul") {
    joueur.position = Math.max(0, joueur.position - s.valeur);
    R.placerPions();
    await afficher("perte");
  } else if (s.effet === "avance") {
    joueur.position = Math.min(dernier, joueur.position + s.valeur);
    R.placerPions();
    await afficher("gain");
  } else if (s.effet === "degats") {
    const mort = blesser(joueur, s.valeur);
    R.rendreHud();
    await afficher("perte");
    if (mort) await respawn(joueur);
  } else if (s.effet === "ralenti") {
    joueur.deDivise = s.valeur; // s'applique au prochain lancer
    await afficher("perte");
  }
}

// =============================================================================
//  MARCHAND (villageois)
// =============================================================================
async function marchand(joueur) {
  const solde = joueur.emeraudes || 0;
  const html = `<p>Le villageois échange du stuff contre des émeraudes 💚.</p>
    <p style="font-size:14px">Tu as <b>${solde}</b> émeraude${solde > 1 ? "s" : ""}.</p>`;

  // Un bouton par offre (grisé si trop cher), + un bouton "Partir"
  const boutons = OFFRES_MARCHAND.map((o, i) => ({
    texte: `${o.texte} — ${o.prix}💚`,
    valeur: `achat_${i}`,
    classe: solde >= o.prix ? "btn-principal" : "btn-secondaire",
    desactive: solde < o.prix,
  }));
  boutons.push({ texte: "Partir", valeur: "partir", classe: "btn-secondaire" });

  // Robot : achète l'offre la plus chère qu'il peut se payer, sinon repart
  if (joueur.estIA) {
    let best = -1, bestPrix = -1;
    OFFRES_MARCHAND.forEach((o, i) => { if (solde >= o.prix && o.prix > bestPrix) { bestPrix = o.prix; best = i; } });
    if (best >= 0) boutons[best].iaDefaut = true;
    else boutons[boutons.length - 1].iaDefaut = true;
  }

  const choix = await demander({ titre: "🛒 Le Marchand", img: VILLAGEOIS.img, html, boutons });
  if (!choix || choix === "partir") return;

  const idx = parseInt(choix.split("_")[1], 10);
  const offre = OFFRES_MARCHAND[idx];
  if (!offre || solde < offre.prix) return;

  joueur.emeraudes -= offre.prix;
  ajouterObjet(joueur, offre.recoit);
  R.rendreHud();

  const a = ARMES.find((x) => x.id === offre.recoit) || ARMURES.find((x) => x.id === offre.recoit);
  const image = a ? a.img : (offre.recoit === "bouclier" ? "stuff/bouclier/stuff_bouclier.png" : EMERAUDE.img);
  await demander({
    titre: "Marché conclu&nbsp;!", img: image,
    html: `<p class="gain">Tu reçois ${offre.texte}&nbsp;!</p>`,
    boutons: [{ texte: "Merci&nbsp;!", valeur: "ok" }],
  });
}

// =============================================================================
//  PORTAILS (vers Nether / End)
// =============================================================================
async function portail(joueur, monde) {
  const cible = PLATEAUX[monde];
  await demander({
    titre: `Portail vers le ${cible.nom}&nbsp;!`,
    html: `<p>Tu es aspiré dans un autre monde... Traverse-le pour revenir avec une récompense&nbsp;!</p>`,
    boutons: [{ texte: "Y aller 🌀", valeur: "ok" }],
  });
  // On mémorise d'où on vient pour revenir après
  joueur.retour = { monde: joueur.monde, position: joueur.position };
  joueur.monde = monde;
  joueur.position = 0;
  R.rendreJeu();
}

async function retourOverworld(joueur, plateau) {
  const recompense = plateau.cfg.recompenseSortie;
  if (recompense) ajouterObjet(joueur, recompense);
  const a = ARMES.find((x) => x.id === recompense);

  await demander({
    titre: "Retour à l'Overworld&nbsp;!", img: a ? a.img : null,
    html: `<p class="gain">Tu ressors du ${plateau.cfg.nom}${a ? ` avec ${a.nom}` : ""}&nbsp;!</p>`,
    boutons: [{ texte: "Continuer", valeur: "ok" }],
  });
  const dest = joueur.retour || { monde: "overworld", position: 0 };
  joueur.monde = dest.monde;
  joueur.position = dest.position;
  joueur.retour = null;
  R.rendreJeu();
}

// =============================================================================
//  VICTOIRE
// =============================================================================
async function victoire(joueur) {
  joueur.aGagne = true;
  state.fini = true;
  sauvegarder();
  await demander({
    titre: "🏆 VICTOIRE&nbsp;! 🏆", img: joueur.pion.img,
    html: `<p class="gain">${joueur.pion.nom} atteint le bout du plateau et gagne la partie&nbsp;!</p>`,
    boutons: [{ texte: "Rejouer", valeur: "rejouer", classe: "btn-principal" }],
  });
  // Le bouton "Rejouer" est géré dans main.js via un écouteur global
  window.dispatchEvent(new CustomEvent("rejouer"));
}

// =============================================================================
//  LE BOSS FINAL : L'ENDER DRAGON (combat coopératif aux dés)
// =============================================================================
// Tous les joueurs (non gagnants) sont-ils dans l'End en même temps ?
function tousDansEnd() {
  const enJeu = state.joueurs.filter((j) => !j.aGagne);
  return enJeu.length > 0 && enJeu.every((j) => j.monde === "end");
}

async function declencherBoss() {
  const nb = state.joueurs.filter((j) => !j.aGagne).length;
  let hp = BOSS_END.pvParJoueur * nb;
  if (state.bebeDragon) hp = Math.ceil(hp / 2);
  state.boss = { actif: true, hp, hpMax: hp, frame: 0 };
  R.rendreJeu();
  await demander({
    titre: "🐉 L'Ender Dragon&nbsp;!", img: BOSS_END.images[0],
    html: `<p>Vous voilà tous réunis dans l'End... l'<b>Ender Dragon</b> surgit avec
             <b>${hp} PV</b>&nbsp;!</p>
           <p style="font-size:14px">Chacun son tour, lancez le dé pour l'attaquer&nbsp;:
             <b>dégâts = attaque de ton arme × dé</b>. Battez-le ensemble&nbsp;!</p>
           ${state.bebeDragon ? '<p class="gain">🐉 Le bébé dragon l\'a déjà affaibli (PV ÷ 2)&nbsp;!</p>' : ""}`,
    boutons: [{ texte: "Combattre&nbsp;! 🗡️", valeur: "ok" }],
  });
}

async function attaquerBoss() {
  if (occupe || state.fini) return;
  occupe = true;
  const btn = document.querySelector("#btn-de");
  btn.disabled = true;

  const joueur = joueurActif();
  for (let i = 0; i < 6; i++) { R.afficherDe(alea(1, 6)); await pause(70); }
  const de = alea(1, 6);
  R.afficherDe(de);
  await pause(300);

  const arme = meilleureArme(joueur);
  let attaque = arme ? arme.attaque : 0;
  if (joueur.denis) attaque += COMPAGNONS.denis.bonusAttaque;
  attaque = Math.max(BOSS_END.attaqueMini, attaque);
  const degats = attaque * de;
  state.boss.hp = Math.max(0, state.boss.hp - degats);
  state.boss.frame = state.boss.frame ? 0 : 1; // petite animation du dragon
  R.rendreJeu();

  await demander({
    titre: "🗡️ Attaque&nbsp;!", img: BOSS_END.images[state.boss.frame],
    html: `<p class="gain">${joueur.pion.nom} inflige <b>${degats}</b> dégâts&nbsp;!
             <span style="font-size:13px;opacity:.85">(${attaque} × 🎲${de})</span></p>
           <p>Dragon&nbsp;: <b>${state.boss.hp} / ${state.boss.hpMax} PV</b></p>`,
    boutons: [{ texte: "Continuer", valeur: "ok" }],
  });

  if (state.boss.hp <= 0) {
    await victoireBoss();
  } else {
    // joueur suivant (on saute les éventuels gagnants)
    let prochain = state.jTour;
    do { prochain = (prochain + 1) % state.joueurs.length; }
    while (state.joueurs[prochain].aGagne && prochain !== state.jTour);
    state.jTour = prochain;
    R.rendreJeu();
    sauvegarder();
  }
  occupe = false;
  if (!state.fini) btn.disabled = false;
}

async function victoireBoss() {
  state.joueurs.forEach((j) => { j.aGagne = true; });
  state.fini = true;
  sauvegarder();
  await demander({
    titre: "🏆 Ender Dragon vaincu&nbsp;!", img: BOSS_END.images[0],
    html: `<p class="gain">Ensemble, vous avez terrassé l'Ender Dragon&nbsp;!
             <br>Victoire coopérative — <b>tout le monde gagne</b>&nbsp;! 🎉</p>`,
    boutons: [{ texte: "Rejouer", valeur: "rejouer", classe: "btn-principal" }],
  });
  window.dispatchEvent(new CustomEvent("rejouer"));
}

// Case bébé dragon (End) : divise par 2 les PV du boss (ou de son futur combat)
async function ramasserBebeDragon(joueur, c) {
  c.type = "vide"; // consommé
  R.rafraichirCase(joueur.position);
  if (state.boss && state.boss.actif) {
    state.boss.hp = Math.ceil(state.boss.hp / 2);
    state.boss.hpMax = Math.ceil(state.boss.hpMax / 2);
    R.rendreJeu();
  } else {
    state.bebeDragon = true;
  }
  await demander({
    titre: "🐉 Bébé Dragon&nbsp;!", img: BEBE_DRAGON.img,
    html: `<p class="gain">Le bébé dragon est de votre côté&nbsp;: les PV de l'Ender Dragon
             sont <b>divisés par 2</b>&nbsp;!</p>`,
    boutons: [{ texte: "Génial&nbsp;! ", valeur: "ok" }],
  });
}

// =============================================================================
//  FIN DE TOUR : joueur suivant + mécaniques (ennemis, fantômes)
// =============================================================================
async function finDeTour() {
  if (state.fini) return;

  // Joueur suivant (on saute ceux qui ont gagné)
  let prochain = state.jTour;
  do {
    prochain = (prochain + 1) % state.joueurs.length;
  } while (state.joueurs[prochain].aGagne && prochain !== state.jTour);
  const nouveauTourComplet = prochain <= state.jTour;
  state.jTour = prochain;

  if (nouveauTourComplet) {
    state.tour++;
    mecaniquesDeFinDeTour();
  }

  // Tous réunis dans l'End ? -> le boss final apparaît
  if (!state.boss && tousDansEnd()) {
    await declencherBoss();
    return;
  }

  R.rendreJeu();
  sauvegarder();
}

// Déplacement des ennemis + apparition/déplacement des fantômes
function mecaniquesDeFinDeTour() {
  deplacerEnnemis();
  gererFantomes();
}

function deplacerEnnemis() {
  for (const monde of Object.keys(state.plateaux)) {
    const cases = state.plateaux[monde].cases;
    for (let i = 1; i < cases.length - 1; i++) {
      const c = cases[i];
      if (c.type !== "ennemi" || c.ennemi.vaincu) continue;
      if (!chance(RULES.chanceDeplacementEnnemi)) continue;
      // essaie de bouger vers une case voisine vide ET non occupée par un joueur
      const dir = chance(0.5) ? 1 : -1;
      const j = i + dir;
      const occupeeParJoueur = state.joueurs.some(
        (p) => p.monde === monde && p.position === j && !p.aGagne
      );
      if (j > 0 && j < cases.length - 1 && cases[j].type === "vide" && !occupeeParJoueur) {
        cases[j].type = "ennemi";
        cases[j].ennemi = c.ennemi;
        c.type = "vide"; c.ennemi = null;
      }
    }
  }
}

function gererFantomes() {
  // Apparition (dans l'Overworld) au bout de X tours puis régulièrement
  if (state.tour >= RULES.fantomeApresTours &&
      (state.tour - RULES.fantomeApresTours) % RULES.fantomeToutLesXTours === 0) {
    const cases = state.plateaux.overworld.cases;
    const pos = alea(1, cases.length - 2);
    state.fantomes.push({ monde: "overworld", position: pos });
  }

  // Les fantômes existants se rapprochent du joueur le plus proche
  for (const f of state.fantomes) {
    const joueursMonde = state.joueurs.filter((j) => j.monde === f.monde && !j.aGagne);
    if (joueursMonde.length === 0) continue;
    // cible = joueur le plus proche
    let cible = joueursMonde[0];
    for (const j of joueursMonde) {
      if (Math.abs(j.position - f.position) < Math.abs(cible.position - f.position)) cible = j;
    }
    const cases = state.plateaux[f.monde].cases;
    if (f.position < cible.position) f.position = Math.min(cases.length - 1, f.position + 1);
    else if (f.position > cible.position) f.position = Math.max(0, f.position - 1);
  }
}

function retirerFantome(ref) {
  const i = state.fantomes.indexOf(ref);
  if (i >= 0) state.fantomes.splice(i, 1);
}
