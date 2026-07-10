// =============================================================================
//  CONFIG.JS — Le "cerveau" du jeu. TOUTES les valeurs à régler sont ici.
//  Tu peux modifier les chiffres sans rien casser : PV, force des ennemis,
//  puissance des armes, taille des plateaux, etc.
//  (Astuce : garde une copie de ce fichier avant de tout changer !)
// =============================================================================

// Chemin de base vers les images (dossier public/assets)
export const ASSETS = "./public/assets";

// -----------------------------------------------------------------------------
//  RÈGLES GÉNÉRALES
// -----------------------------------------------------------------------------
export const RULES = {
  coeursDepart: 10,        // Points de vie de départ (en cœurs) ❤️
  coeursMax: 10,           // Maximum de cœurs (la nourriture ne dépasse pas ça)
  fantomeApresTours: 3,    // Un fantôme apparaît après ce nombre de tours de jeu
  fantomeToutLesXTours: 3, // ...puis un nouveau tous les X tours
  chanceDeplacementEnnemi: 0.35, // Probabilité (0 à 1) qu'un ennemi bouge à chaque tour
  memeCaseCombat: true,    // Combat quand on tombe pile sur un ennemi
  // Équilibrage du début de partie : on veut trouver de l'équipement AVANT
  // de croiser un ennemi.
  zoneSansEnnemi: 5,       // Aucun ennemi sur les X premières cases après le départ
  coffreGarantiAvant: 4,   // Au moins un coffre dans les X premières cases
  emeraudesParCoffre: [1, 3], // Quand un coffre donne des émeraudes : entre 1 et 3

  // Quand on tombe à 0 cœur : où et avec combien de vie on réapparaît.
  respawnMonde: "overworld", // toujours renvoyé au monde de départ (pas coincé au Nether)
  respawnPleineVie: true,    // true = on repart avec tous les cœurs (sinon la moitié)
};

// -----------------------------------------------------------------------------
//  LES PIONS (dossier player/) — l'ordre = l'ordre d'affichage à l'écran
// -----------------------------------------------------------------------------
export const PIONS = [
  { id: "steve",         nom: "Steve",         img: "player/player_steve.png" },
  { id: "alex",          nom: "Alex",          img: "player/player_alex.png" },
  { id: "creeper_steve", nom: "Creeper Steve", img: "player/player_creeper_steve.png" },
  { id: "b21",           nom: "B21",           img: "player/player_b21.png" },
  { id: "pirate",        nom: "Pirate",        img: "player/player_pirate.png" },
  { id: "gamer",         nom: "The Gamer",     img: "player/player_gamer.png" },
  { id: "dream",         nom: "Dream",         img: "player/player_dream.png" },
  { id: "armor_red",     nom: "Armure Rouge",  img: "player/player_armor_red.png" },
  { id: "laylo",         nom: "Laylo",         img: "player/player_laylo.png" },
  { id: "herobrine",     nom: "Herobrine",     img: "player/player_herobrine.png" },
  { id: "mineur",        nom: "Mineur",        img: "player/player_mineur.png" },
  { id: "ninja",         nom: "Ninja",         img: "player/player_ninja.png" },
  { id: "enderman",      nom: "Enderman",      img: "player/player_enderman.png" },
];

// -----------------------------------------------------------------------------
//  LES ENNEMIS — "force" = dégâts en cœurs. Rangés par monde.
//  Ton arme doit avoir une attaque >= force pour vaincre sans perdre de cœur.
// -----------------------------------------------------------------------------
export const ENNEMIS = {
  overworld: [
    { id: "slime",       nom: "Slime",         force: 1, img: "enemy/overworld/enemy_slime.png" },
    { id: "zombie",      nom: "Zombie",        force: 2, img: "enemy/overworld/enemy_zombie.png" },
    { id: "araignee",    nom: "Araignée",      force: 2, img: "enemy/overworld/enemy_araignee.png" },
    { id: "squelette",   nom: "Squelette",     force: 3, img: "enemy/overworld/enemy_squelette.png" },
    { id: "creeper",     nom: "Creeper",       force: 4, img: "enemy/overworld/enemy_creeper.png" },
    { id: "sorciere",    nom: "Sorcière",      force: 4, img: "enemy/overworld/enemy_sorciere.png" },
    { id: "vindicateur", nom: "Vindicateur",   force: 5, img: "enemy/overworld/enemy_vindicateur.png" },
    { id: "evocateur",   nom: "Évocateur",     force: 6, img: "enemy/overworld/enemy_evocateur.png" },
    { id: "enderman",    nom: "Enderman",      force: 6, img: "enemy/overworld/enemy_enderman.png", type: "enderman" },
  ],
  nether: [
    { id: "magma",           nom: "Cube de Magma", force: 3, img: "enemy/nether/enemy_magma.png" },
    { id: "pigmen",          nom: "Piglin Zombie", force: 4, img: "enemy/nether/enemy_pigmen.png" },
    { id: "blaze",           nom: "Blaze",         force: 5, img: "enemy/nether/enemy_blaze.png" },
    { id: "ghast",           nom: "Ghast",         force: 6, img: "enemy/nether/enemy_ghast.png" },
    { id: "enderman",        nom: "Enderman",      force: 6, img: "enemy/nether/enemy_enderman.png", type: "enderman" },
    { id: "wither_squelette",nom: "Wither Squelette", force: 7, img: "enemy/nether/enemy_wither_squelette.png" },
  ],
  end: [
    { id: "enderman", nom: "Enderman", force: 5, img: "enemy/end/enemy_enderman.png", type: "enderman" },
  ],
};

// Le fantôme (Phantom) — spécial : apparaît tout seul et poursuit les joueurs
export const FANTOME = {
  id: "fantome", nom: "Fantôme", force: 3, img: "enemy/overworld/enemy_fantome.png",
};

// -----------------------------------------------------------------------------
//  LES ARMES (dossier stuff/) — "attaque" en cœurs.
//  Épée & hache = combat. Pioche & pelle = outils (attaque plus faible mais
//  utiles pour ouvrir des coffres / creuser des raccourcis plus tard).
//  NB : les noms de fichiers ne sont pas tous identiques (or vs gold pour la
//  pioche) — c'est pour ça qu'on écrit le chemin complet ici.
// -----------------------------------------------------------------------------
export const ARMES = [
  // Épées
  { id: "epee_pierre",     nom: "Épée en pierre",     attaque: 2, categorie: "epee",  img: "stuff/epee/stuff_epee_pierre.png" },
  { id: "epee_fer",        nom: "Épée en fer",        attaque: 3, categorie: "epee",  img: "stuff/epee/stuff_epee_fer.png" },
  { id: "epee_or",         nom: "Épée en or",         attaque: 3, categorie: "epee",  img: "stuff/epee/stuff_epee_or.png" },
  { id: "epee_diamant",    nom: "Épée en diamant",    attaque: 5, categorie: "epee",  img: "stuff/epee/stuff_epee_diamant.png" },
  { id: "epee_netherite",  nom: "Épée en néthérite",  attaque: 7, categorie: "epee",  img: "stuff/epee/stuff_epee_netherite.png" },
  // Haches (un peu plus fort que l'épée du même tier)
  { id: "hache_pierre",    nom: "Hache en pierre",    attaque: 3, categorie: "hache", img: "stuff/hache/stuff_hache_pierre.png" },
  { id: "hache_fer",       nom: "Hache en fer",       attaque: 4, categorie: "hache", img: "stuff/hache/stuff_hache_fer.png" },
  { id: "hache_or",        nom: "Hache en or",        attaque: 4, categorie: "hache", img: "stuff/hache/stuff_hache_or.png" },
  { id: "hache_diamant",   nom: "Hache en diamant",   attaque: 6, categorie: "hache", img: "stuff/hache/stuff_hache_diamant.png" },
  { id: "hache_netherite", nom: "Hache en néthérite", attaque: 8, categorie: "hache", img: "stuff/hache/stuff_hache_netherite.png" },
  // Pioches (outil, attaque faible)
  { id: "pioche_pierre",   nom: "Pioche en pierre",   attaque: 1, categorie: "pioche", img: "stuff/pioche/stuff_pioche_pierre.png" },
  { id: "pioche_fer",      nom: "Pioche en fer",      attaque: 2, categorie: "pioche", img: "stuff/pioche/stuff_pioche_fer.png" },
  { id: "pioche_or",       nom: "Pioche en or",       attaque: 2, categorie: "pioche", img: "stuff/pioche/stuff_pioche_gold.png" },
  { id: "pioche_diamant",  nom: "Pioche en diamant",  attaque: 3, categorie: "pioche", img: "stuff/pioche/stuff_pioche_diamant.png" },
  { id: "pioche_netherite",nom: "Pioche en néthérite",attaque: 4, categorie: "pioche", img: "stuff/pioche/stuff_pioche_netherite.png" },
  // Pelles (outil, attaque faible)
  { id: "pelle_pierre",    nom: "Pelle en pierre",    attaque: 1, categorie: "pelle", img: "stuff/pelle/stuff_pelle_pierre.png" },
  { id: "pelle_fer",       nom: "Pelle en fer",       attaque: 2, categorie: "pelle", img: "stuff/pelle/stuff_pelle_fer.png" },
  { id: "pelle_or",        nom: "Pelle en or",        attaque: 2, categorie: "pelle", img: "stuff/pelle/stuff_pelle_or.png" },
  { id: "pelle_diamant",   nom: "Pelle en diamant",   attaque: 3, categorie: "pelle", img: "stuff/pelle/stuff_pelle_diamant.png" },
  { id: "pelle_netherite", nom: "Pelle en néthérite", attaque: 4, categorie: "pelle", img: "stuff/pelle/stuff_pelle_netherite.png" },
];

// Le bouclier — réduit les dégâts reçus quand l'arme ne suffit pas à vaincre
export const BOUCLIER = {
  id: "bouclier", nom: "Bouclier", reduction: 1, img: "stuff/bouclier/stuff_bouclier.png",
};

// Les armures (dossier stuff/armure/) — "reduction" = dégâts bloqués en permanence.
// Seule la meilleure armure portée compte (elle ne s'additionne pas avec les autres).
export const ARMURES = [
  { id: "armure_cuivre",    nom: "Armure en cuivre",    reduction: 1, img: "stuff/armure/stuff_armure_cuivre.png" },
  { id: "armure_fer",       nom: "Armure en fer",       reduction: 2, img: "stuff/armure/stuff_armure_fer.png" },
  { id: "armure_or",        nom: "Armure en or",        reduction: 2, img: "stuff/armure/stuff_armure_gold.png" },
  { id: "armure_diamant",   nom: "Armure en diamant",   reduction: 3, img: "stuff/armure/stuff_armure_diamant.png" },
  { id: "armure_netherite", nom: "Armure en néthérite", reduction: 4, img: "stuff/armure/stuff_armure_netherite.png" },
];

// -----------------------------------------------------------------------------
//  LES COFFRES (dossier box/) — ce qu'on peut trouver dedans.
//  "table" = liste de tirages possibles avec un "poids" (plus le poids est
//  grand, plus c'est fréquent).
// -----------------------------------------------------------------------------
export const COFFRES = {
  coffre:       { nom: "Coffre",         img: "box/box_coffre.png",       rarete: "commun" },
  coffre_large: { nom: "Grand coffre",   img: "box/box_coffre_large.png", rarete: "rare" },
  coffre_ender: { nom: "Coffre de l'End",img: "box/box_coffre_ender.png", rarete: "epique" },
  shulker:      { nom: "Shulker",        img: "box/box_shulker.png",      rarete: "epique" },
};

// Tables de butin selon la rareté du coffre (id d'arme, "bouclier", ou "coeur")
export const BUTIN = {
  commun: [
    { objet: "epee_pierre",   poids: 3 },
    { objet: "epee_fer",      poids: 2 },
    { objet: "pioche_pierre", poids: 2 },
    { objet: "pelle_pierre",  poids: 2 },
    { objet: "bouclier",      poids: 2 },
    { objet: "armure_cuivre", poids: 2 },
    { objet: "emeraude",      poids: 3 },
    { objet: "coeur",         poids: 2 },
  ],
  rare: [
    { objet: "epee_fer",     poids: 3 },
    { objet: "epee_or",      poids: 2 },
    { objet: "hache_fer",    poids: 2 },
    { objet: "epee_diamant", poids: 1 },
    { objet: "armure_fer",   poids: 2 },
    { objet: "armure_or",    poids: 1 },
    { objet: "bouclier",     poids: 2 },
    { objet: "emeraude",     poids: 3 },
    { objet: "coeur",        poids: 2 },
  ],
  epique: [
    { objet: "epee_diamant",    poids: 3 },
    { objet: "hache_diamant",   poids: 2 },
    { objet: "epee_netherite",  poids: 1 },
    { objet: "hache_netherite", poids: 1 },
    { objet: "armure_diamant",  poids: 2 },
    { objet: "armure_netherite",poids: 1 },
    { objet: "bouclier",        poids: 2 },
    { objet: "emeraude",        poids: 3 },
    { objet: "coeur",           poids: 2 },
  ],
};

// -----------------------------------------------------------------------------
//  LES AIDES (dossier helper/)
// -----------------------------------------------------------------------------
// Nourriture : rend des cœurs quand on la ramasse.
// "img" = l'animal affiché sur la case. "aliment" = ce qu'on mange
// (utilisé pour la petite animation de morceaux qui tournoient).
export const NOURRITURE = [
  { id: "poulet", nom: "Poulet", soin: 1, img: "helper/helper_poulet.png", aliment: "helper/oeuf.png",        alimentNom: "Œuf" },
  { id: "mouton", nom: "Mouton", soin: 2, img: "helper/helper_mouton.png", aliment: "helper/steak_mouton.png", alimentNom: "Côte de mouton" },
  { id: "cochon", nom: "Cochon", soin: 2, img: "helper/helper_cochon.png", aliment: "helper/steak_porc.png",   alimentNom: "Porc grillé" },
  { id: "vache",  nom: "Vache",  soin: 3, img: "helper/helper_vache.png",  aliment: "helper/steak_boeuf.png",  alimentNom: "Steak" },
];

// L'émeraude = la monnaie du jeu. On en trouve dans les coffres et on les
// dépense chez le marchand.
export const EMERAUDE = { id: "emeraude", nom: "Émeraude", img: "helper/emeraude.png" };

// Compagnons / bonus spéciaux
export const COMPAGNONS = {
  denis:        { id: "denis",  nom: "Denis (loup)", img: "helper/helper_denis.png",
                  bonusAttaque: 2 },            // ajoute +2 d'attaque à chaque combat
  golem:        { id: "golem",  nom: "Golem de fer", img: "helper/helper_golem_de_fer.png",
                  attaqueUnique: 20 },          // attaque massive, à usage unique
  chat:         { id: "chat",   nom: "Chat",         img: "helper/helper_chat.png",
                  bonusContre: "enderman", bonusAttaque: 4 }, // effraie l'Enderman
};

// Le villageois = marchand. On lui achète du stuff avec des émeraudes 💚.
export const VILLAGEOIS = {
  id: "villageois", nom: "Villageois", img: "helper/helper_villageois.png",
};
// Ce que le marchand propose : "recoit" = ce qu'on obtient, "prix" = en émeraudes.
export const OFFRES_MARCHAND = [
  { recoit: "coeur",        prix: 1, texte: "2 cœurs ❤️" },
  { recoit: "epee_fer",     prix: 2, texte: "Épée en fer" },
  { recoit: "bouclier",     prix: 2, texte: "Bouclier 🛡️" },
  { recoit: "armure_fer",   prix: 3, texte: "Armure en fer" },
  { recoit: "epee_diamant", prix: 5, texte: "Épée en diamant" },
];

// -----------------------------------------------------------------------------
//  LES CASES SPÉCIALES (malus / événements) — inspirées de Minecraft.
//  effet : "recul" (recule de valeur cases), "degats" (perd valeur cœurs),
//          "ralenti" (prochain lancer divisé par valeur),
//          "avance" (avance de valeur cases — bonus).
//  {v} dans le texte est remplacé par la valeur.
// -----------------------------------------------------------------------------
// "textures" = pool d'images (dossier public/assets/texture/...), tirées au
// hasard et affichées en fond de case (elles s'adaptent à la taille de la case).
export const CASES_SPECIALES = {
  grotte:     { nom: "Grotte",          emoji: "🕳️", effet: "recul",   valeur: 3,
                textures: ["texture/overworld/trou_1.png", "texture/overworld/trou_2.png", "texture/overworld/trou_3.png"],
                texte: "Tu tombes dans une grotte sombre et recules de {v} cases&nbsp;!" },
  ravin:      { nom: "Ravin",           emoji: "🪨", effet: "recul",   valeur: 2,
                textures: ["texture/overworld/trou_1.png", "texture/overworld/trou_2.png", "texture/overworld/trou_3.png"],
                texte: "Un ravin te barre la route, tu recules de {v} cases&nbsp;!" },
  lave:       { nom: "Coulée de lave",  emoji: "🔥", effet: "degats",  valeur: 2,
                textures: ["texture/nether/lave_1.png", "texture/nether/lave_2.png"],
                texte: "Tu marches dans la lave et perds {v} cœurs&nbsp;!" },
  sable_ames: { nom: "Sable des âmes",  emoji: "🐌", effet: "ralenti", valeur: 2,
                textures: ["texture/nether/sable_1.png", "texture/nether/sable_2.png", "texture/nether/sable_3.png"],
                texte: "Le sable des âmes te ralentit&nbsp;: ton prochain lancer sera divisé par {v}&nbsp;!" },
  faille:     { nom: "Faille du vide",  emoji: "🌌", effet: "recul",   valeur: 3,
                textures: ["texture/ender/trou_end_1.png", "texture/ender/trou_end_2.png"],
                texte: "Le vide t'aspire et te renvoie {v} cases en arrière&nbsp;!" },
  minecart:   { nom: "Wagonnet",        emoji: "🛒", effet: "avance",  valeur: 3,
                textures: ["texture/overworld/chariot.png"], sprite: true, // objet centré, pas un fond
                texte: "Tu sautes dans un wagonnet et avances de {v} cases&nbsp;!" },
};

// -----------------------------------------------------------------------------
//  LES PLATEAUX — un objet par monde.
//  cases = nombre de cases. de = valeur max du dé (6 ou 12).
//  cols = nb de colonnes pour le rangement en serpentin à l'écran.
//  densite* = proportion de cases de chaque type (0 à 1). Le reste = cases vides.
// -----------------------------------------------------------------------------
export const PLATEAUX = {
  overworld: {
    nom: "Overworld", monde: "overworld",
    cases: 60, de: 6, cols: 10,
    densiteEnnemi: 0.30, densiteCoffre: 0.12, densiteNourriture: 0.10,
    nbCompagnons: 3, // cases donnant Denis / Golem / Chat
    premiereLigneSure: true, // toute la 1re ligne = coffres/nourriture, aucun ennemi
    casesSpeciales: [
      { type: "grotte", nb: 2 },
      { type: "ravin", nb: 1 },
      { type: "minecart", nb: 2 }, // bonus : avance
    ],
    aUnPortailNether: true, aUnPortailEnd: true, aUnMarchand: true,
    theme: "overworld",
  },
  nether: {
    nom: "Nether", monde: "nether",
    cases: 24, de: 6, cols: 8,
    densiteEnnemi: 0.40, densiteCoffre: 0.15, densiteNourriture: 0.05,
    nbCompagnons: 1,
    casesSpeciales: [
      { type: "lave", nb: 2 },
      { type: "sable_ames", nb: 1 },
    ],
    aUnPortailNether: false, aUnPortailEnd: false, aUnMarchand: false,
    theme: "nether",
    recompenseSortie: "epee_diamant", // récompense quand on ressort du Nether
  },
  end: {
    nom: "End", monde: "end",
    cases: 24, de: 6, cols: 8,
    densiteEnnemi: 0.45, densiteCoffre: 0.15, densiteNourriture: 0.05,
    nbCompagnons: 1,
    casesSpeciales: [
      { type: "faille", nb: 2 },
      { type: "sable_ames", nb: 1 },
    ],
    aUnPortailNether: false, aUnPortailEnd: false, aUnMarchand: false,
    theme: "end",
    recompenseSortie: "epee_netherite",
  },
};
