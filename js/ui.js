// =============================================================================
//  UI.JS — L'écran d'accueil : nombre de joueurs et choix des pions.
// =============================================================================
import { ASSETS, PIONS } from "./config.js";
import { $, creer } from "./utils.js";

const img = (chemin) => `${ASSETS}/${chemin}`;

// Sélection en cours : nb de joueurs + pion choisi par chacun
const selection = { nb: 2, pions: [null, null, null, null] };

// Construit tout l'écran d'accueil
export function construireAccueil() {
  const racine = $("#config-joueurs");
  racine.innerHTML = "";

  // Choix du nombre de joueurs
  const barre = creer("div", "nb-joueurs");
  barre.appendChild(creer("span", "", { text: "Nombre de joueurs :" }));
  [2, 3, 4].forEach((n) => {
    const b = creer("button", "btn", { text: n });
    if (n === selection.nb) b.classList.add("actif");
    b.onclick = () => { selection.nb = n; rebâtir(); };
    barre.appendChild(b);
  });
  racine.appendChild(barre);

  // Une carte par joueur
  const grille = creer("div", "joueurs-grille");
  for (let i = 0; i < selection.nb; i++) {
    grille.appendChild(carteJoueur(i));
  }
  racine.appendChild(grille);

  majBoutonJouer();
}

function rebâtir() {
  // on nettoie les pions au-delà du nombre choisi
  for (let i = selection.nb; i < 4; i++) selection.pions[i] = null;
  construireAccueil();
}

function carteJoueur(i) {
  const carte = creer("div", "carte-joueur");
  carte.appendChild(creer("h3", "", { text: `Joueur ${i + 1}` }));

  const choisiId = selection.pions[i];
  const choisi = PIONS.find((p) => p.id === choisiId);

  const apercu = creer("div", "pion-choisi");
  if (choisi) {
    const im = creer("img");
    im.src = img(choisi.img);
    apercu.appendChild(im);
  } else {
    apercu.appendChild(creer("span", "", { text: "❓", html: "<span style='font-size:48px;opacity:.4'>❓</span>" }));
  }
  carte.appendChild(apercu);
  carte.appendChild(creer("div", "pion-nom", { text: choisi ? choisi.nom : "Choisis un pion" }));

  // Liste horizontale des pions disponibles
  const liste = creer("div", "pions-choix");
  PIONS.forEach((p) => {
    const prisParUnAutre = selection.pions.some((id, k) => id === p.id && k !== i);
    const mini = creer("div", "pion-mini");
    if (p.id === choisiId) mini.classList.add("actif");
    if (prisParUnAutre) mini.classList.add("pris");
    const im = creer("img");
    im.src = img(p.img);
    im.alt = p.nom;
    im.title = p.nom;
    mini.appendChild(im);
    mini.onclick = () => {
      selection.pions[i] = (selection.pions[i] === p.id) ? null : p.id;
      construireAccueil();
    };
    liste.appendChild(mini);
  });
  carte.appendChild(liste);
  return carte;
}

function majBoutonJouer() {
  const pretsIds = selection.pions.slice(0, selection.nb);
  const tousChoisis = pretsIds.every((id) => id);
  $("#btn-jouer").disabled = !tousChoisis;
}

// Renvoie la liste des pions choisis (pour démarrer la partie)
export function pionsChoisis() {
  return selection.pions.slice(0, selection.nb).filter(Boolean);
}

// Pré-remplit une sélection par défaut (les 2 premiers pions) pour aller vite
export function selectionParDefaut() {
  selection.nb = 2;
  selection.pions = [PIONS[0].id, PIONS[1].id, null, null];
}
