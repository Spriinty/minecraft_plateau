# ⛏️ Le Jeu de Plateau Minecraft

Un jeu de l'oie « façon Minecraft » jouable à 2-4 joueurs sur le même écran
(PC ou tablette en **paysage**). Inventé sur papier par un petit garçon de 6 ans,
puis remis en version numérique. 💚

> Le but : être le premier à atteindre le bout du plateau **en survivant aux
> ennemis** et en ramassant du stuff (armes, armures, bouclier, nourriture,
> compagnons).

## 🎮 Comment jouer

1. Ouvre le jeu (voir *Lancer le jeu* plus bas).
2. Choisis le **nombre de joueurs** (2 à 4) et le **pion** de chacun.
3. Chacun son tour, clique sur **🎲 Lancer le dé** et avance.
4. Selon la case où tu tombes :
   - **Ennemi** ⚔️ — un combat démarre (voir plus bas).
   - **Coffre** 📦 — tu gagnes une arme, une armure, un bouclier ou des cœurs.
   - **Nourriture** 🍖 (vache, cochon, mouton, poulet) — tu regagnes des cœurs.
   - **Compagnon** 🤝 — Denis (loup, +attaque), le Golem (attaque unique
     énorme), ou le Chat (bonus contre les Endermen).
   - **Marchand** 🛒 (villageois) — il te propose un échange.
   - **Portail Nether/End** 🌋🌀 — tu pars dans un autre monde qu'il faut
     traverser pour revenir avec une récompense.
   - **Arrivée** 🏆 — tu gagnes la partie !

### ⚔️ Le combat (simple)

- Chaque ennemi a une **force**.
- Ton **arme** a une **attaque** (pierre < fer < or < diamant < néthérite).
- Si ton attaque **≥** la force de l'ennemi → tu le bats **sans perdre de cœur**.
- Sinon tu perds `force − attaque − protection` cœurs
  (le **bouclier** et l'**armure** réduisent les dégâts).
- **Denis** ajoute de l'attaque, le **Golem** donne une attaque massive à usage
  unique, le **Chat** aide contre les Endermen.
- À 0 cœur, tu réapparais au départ du monde avec la moitié des cœurs.

### 👻 Les fantômes

Comme dans Minecraft quand on ne dort pas : au bout de quelques tours, des
**fantômes** apparaissent et se rapprochent des joueurs. Les ennemis peuvent
aussi changer de case de temps en temps.

## ▶️ Lancer le jeu (en local)

Comme le jeu utilise des modules JavaScript, il faut un petit serveur
(ouvrir `index.html` directement ne suffit pas). Le plus simple :

```bash
# Depuis le dossier du projet
python -m http.server 8000
# puis ouvrir http://localhost:8000 dans le navigateur
```

(ou n'importe quel serveur statique : `npx serve`, extension « Live Server » de
VS Code, etc.)

## 🌍 Mettre en ligne sur GitHub Pages

1. Crée un dépôt GitHub et pousse tout le projet.
2. Sur GitHub : **Settings → Pages**.
3. *Build and deployment* → **Deploy from a branch**.
4. Choisis la branche `main` et le dossier `/ (root)`, puis **Save**.
5. Au bout d'une minute, le jeu est en ligne à l'adresse
   `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`.

Le fichier `.nojekyll` (déjà présent) évite que GitHub tripatouille les
fichiers. Rien d'autre à installer : c'est du HTML/CSS/JS pur.

## 🛠️ Régler / équilibrer le jeu

**Tout se règle dans [`js/config.js`](js/config.js)** — pas besoin de toucher au
reste. Tu peux changer facilement :

- les **points de vie** de départ (`RULES.coeursDepart`) ;
- la **force des ennemis** (`ENNEMIS`) ;
- l'**attaque des armes** et la **réduction des armures** (`ARMES`, `ARMURES`) ;
- le **contenu des coffres** (`BUTIN`) ;
- la **taille des plateaux** et le **dé** (`PLATEAUX` : `cases`, `de`, `cols`) ;
- la fréquence des **fantômes** et des **déplacements d'ennemis** (`RULES`).

> Astuce : garde une copie de `config.js` avant de tout changer 😉

## 📁 Structure

```
index.html            → la page
css/style.css         → l'habillage (thème Minecraft, responsive paysage)
js/config.js          → ⭐ TOUTES les valeurs à régler
js/board.js           → génération des plateaux
js/state.js           → l'état de la partie + sauvegarde locale
js/combat.js          → calcul des combats
js/game.js            → logique de tour et événements
js/render.js          → l'affichage
js/ui.js              → écran d'accueil
js/main.js            → démarrage
public/assets/        → toutes les images
```

## 💾 Sauvegarde

La partie en cours est sauvegardée automatiquement dans le navigateur
(localStorage). Le bouton **« Reprendre la partie »** sur l'accueil permet de
continuer là où on s'était arrêté.

---

Fait avec ❤️ pour jouer en vacances.
