/*
 * SBA – Surf & Beer (copie privée du jeu Surf & Nettoie) — jeu de surf 3D de la Surfrider Foundation Sénégal.
 * Three.js (r160) uniquement, toute la géométrie est générée dans le code.
 */
import * as THREE from 'three';
import { createFight } from './fight.js?v=20261122';
import { Net } from './net.js?v=20261122d';

const GAME_DURATION = 30; // secondes
const STORAGE_BEST = 'sba-game-best-v1';
const STORAGE_SOUND = 'sba-game-sound-v1';

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
if (isTouch) document.body.classList.add('is-touch');

/* ------------------------------------------------------------------ */
/* Données                                                             */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* Joueurs : nom → photo (à modifier ici pour changer les photos)       */
/* ------------------------------------------------------------------ */
const PLAYERS = [
  { id: 'luca', name: 'Luca', photo: 'img/luca.jpg' },
  { id: 'shugo', name: 'Shugo', photo: 'img/shugo.jpg' },
  { id: 'max', name: 'Max', photo: 'img/max.jpg' },
  { id: 'quentin', name: 'Quentin', photo: 'img/quentin.jpg' },
  { id: 'victor', name: 'Victor', photo: 'img/victor.jpg' },
  // équipe Michel
  { id: 'timichel', name: 'TiMichel', photo: 'img/timichel.jpg', team: 'michel' },
  { id: 'rom1michel', name: 'Rom1Michel', photo: 'img/rom1michel.jpg', team: 'michel' },
  { id: 'grandmichel', name: 'GrandMichel', photo: 'img/grandmichel.jpg', team: 'michel' },
  { id: 'jeremichel', name: 'JéréMichel', photo: 'img/jeremichel.jpg', team: 'michel' },
  { id: 'maman', name: 'Maman', photo: 'img/maman.jpg', team: 'michel' },
];

/* ------------------------------------------------------------------ */
/* Textes (FR par défaut, EN)                                          */
/* ------------------------------------------------------------------ */
const I18N = {
  fr: {
    ui: {
      backSite: '', canvas: 'Jeu de surf en 3D', loading: 'On décapsule la vague…',
      title1: 'Surf', title2: 'Beer',
      subtitle: 'Le SBA contre les Michel : surfe les vagues de Dakar ou de l’Atlantique, plaque des figures, ramène un max de bières fraîches en 30 secondes, puis on règle ça au Secret Bar.',
      play: 'À l’eau !', titleHint: 'Mobile : glisse pour diriger · Ordi : flèches + Espace',
      teamSba: 'SBA', teamMichel: 'Michel', shopTitle: 'Choisis ta planche', shopTitleP: '{name} : choisis ta planche', shopHello: 'Salut ! Bienvenue chez Jam’in. Toutes ces planches, je les ai shapées moi-même : prends celle qui te va.', shopOk: 'Je prends celle-là', shopSee: 'Voir la planche chez Jam’in', shopBuy: 'Commander la vraie', shopDims: 'Cotes', shopProg: 'Programme', shopShape: 'Shape', shopSurfer: 'Surfer', step1: 'Étape 1 / 2', step2: 'Étape 2 / 2', chooseSurfer: 'Choisis ton rider', chooseSpot: 'Choisis ton spot',
      back: 'Retour', choose: 'Choisir', surfHere: 'On y va', surfers: 'Riders', spots: 'Spots',
      howTitle: 'Comment jouer',
      hSteer: 'Diriger', hSteerTouch: 'Glisse ton doigt à gauche / à droite.', hSteerKbd: 'Flèches ← → ou A / D.', hSteerTxt: 'À gauche, tu montes vers la lèvre de la vague.',
      hJump: 'Sauter', hJumpTouch: 'Glisse vers le haut ou bouton « Saut ».', hJumpKbd: 'Espace (ou ↑).', hJumpTxt: 'Saute depuis la lèvre pour décoller plus haut !',
      hTricks: 'Figures', hTricksTxt: "Cutback, Aerial, 360 : ça ne compte qu'en l'air ou sur la lèvre. Varie, le club regarde !", hTricksKbd: '(touches 1, 2, 3)',
      hTrash: 'Bières', hTrashTxt: 'Récupère les bouteilles vertes, les ambrées et les canettes qui flottent : la glacière se remplit.',
      hObst: 'Obstacles', hObstTxt: 'Évite rochers et pirogues (ou saute par-dessus). Une chute = combo renversé.',
      hComboTxt: 'Enchaîne bières et figures sans traîner pour multiplier tes points.',
      go: 'Santé, et à l’eau !', pause: 'Pause', resume: 'Reprendre', restart: 'Recommencer', changeSpot: 'Changer de spot',
      score: 'Score', time: 'Temps', combo: 'Combo', cleanMeter: 'Glacière',
      hintDrag: 'Glisse ← → pour surfer · vers le haut pour sauter', jump: 'Saut', space: 'Espace',
      soundOn: 'Activer le son', soundOff: 'Couper le son',
      didYouKnow: 'Brève de comptoir', waterQuality: 'Sagesse du club',
      tooLow: 'Trop bas !', tooLowSub: 'Saute ou monte sur la lèvre', bis: '(encore ?)',
      oceanClean: 'Glacière pleine !', wipeout: 'Wipeout !', comboLost: 'Combo renversé', over: 'Au-dessus !',
      inAir: "En l'air !", onLip: 'Sur la lèvre !', countGo: 'Santé !', endPop: 'Fin de session !', pts: 'pts',
      hotspot: 'Pack repéré au loin ! Ton flair le signale en jaune.', hotspotKicker: 'Flair de Max',
      wave: 'Vague', trash: 'Bières', rocks: 'Rochers', pirogues: 'Pirogues', crowd: 'Surfeurs', goRight: 'Droite', goLeft: 'Gauche', record: 'Record : ', newRecord: 'Nouveau record du club sur ce spot !',
      perk: 'Atout', sessionOver: 'Session terminée !', finalScore: 'Score final',
      rTricks: 'Figures', rClean: 'Bières', rCount: 'Bouteilles ramenées', rKg: 'Volume sauvé', rCombo: 'Meilleur combo',
      lesson: 'Le toast de la session', replay: 'Remettre une tournée', discover: '',
      waterNote: 'L’abus d’alcool est dangereux pour la santé : à consommer avec modération. Et après la session, on ne conduit pas, on se fait raccompagner.',
      chooseMode: 'Choisis ton mode', modeSolo: 'Solo', modeSoloTxt: 'Une session de 30 s, puis baston au Secret Bar contre l’ordi.',
      modeLocal: 'Duo même écran', modeLocalTxt: 'Deux riders sur la même vague, puis on règle ça au bar. Chacun sa moitié d’écran.',
      modeOnline: 'Duo en ligne', modeOnlineTxt: 'Chacun sur son téléphone : lancez-le tous les deux, la connexion est automatique.',
      player1: 'Joueur 1', player2: 'Joueur 2', chooseP1: 'Joueur 1 : choisis ton rider', chooseP2: 'Joueur 2 : choisis ton rider',
      onlineTitle: 'Duo en ligne', retry: 'Réessayer', full: 'Une partie à deux est déjà en cours.',
      connecting: 'Connexion…', waitingMate: 'En attente de ton pote… Il lance « Duo en ligne » de son côté.', netError: 'Connexion impossible. Vérifie ta connexion et réessaie.', mateLeft: 'Ton pote a quitté la partie.',
      waitHostSpot: 'L’hôte choisit le spot…', waitHostGo: 'En attente de l’hôte…', waitMateChar: 'Ton pote choisit son rider…',
      toBar: 'Direction le Secret Bar 🥊', barIn: 'Le Secret Bar ouvre dans {n} s…', duoWin: '{name} gagne la session !', duoDraw: 'Égalité parfaite !',
      hFight: 'Secret Bar', hFightTxt: 'Après la session, baston au bar : poing, pied, lancer de bière, et coup spécial quand ta jauge est pleine. Ton score de surf la remplit en partie.',
      hDuo: 'Duo', hDuoKbd: 'J1 : A/Q D, Z/W saut, 1 2 3 figures · J2 : ← →, ↑ saut, J K L figures.', hDuoTouch: 'Chacun sa moitié d’écran : glisse pour diriger, vers le haut pour sauter, tape pour une figure.',
      menu: 'Menu',
    },
    boards: {
      bigguy: { prog: 'Tout type de conditions jusqu’à 2 m 50.', shape: 'Ligne polyvalente, tiers avant large et volumes généreux pour le confort de rame, full concave, rail boxy, square tail.', surfer: 'Niveau moyen à confirmé. Shortboard pour les grands gabarits.' },
      groms: { prog: 'Tout type de conditions.', shape: 'Classic round pintail, concave to double concave, rail boxy léger.', surfer: 'Niveau confirmé.' },
      clown: { prog: 'Toutes conditions de 50 cm à 2 m.', shape: 'Outline de fish avant, arrière un peu étroit. Carène en full channel, toujours en accélération. Rail couché, boxy et couché sur le pont. Dérive biomimétique home made double foilée. Ce fish aime les vagues creuses et se surfe le poids à fond sur l’arrière : sa glisse est plus proche du twin-fin que du fish. Énorme relance grâce aux dérives stratifiées, cutbacks faciles, les virages s’enroulent tout seuls.', surfer: 'Confirmé et expert.' },
      egg: { prog: 'Toutes conditions de 50 cm à 2 m.', shape: 'Egg moderne : un avant rond et un arrière de shortboard. Flat to concave to vee double, rounded tail, rail boxy. Un bon compromis entre le confort de l’egg et le comportement d’un shortboard.', surfer: 'Petits gabarits tous niveaux, et confirmés.' },
    },
    chars: {
      luca: { role: 'Ma che Porco Dio', perk: 'Roi du barrel', perkDesc: 'Figures +25 % de points.',
        bio: 'Toujours le premier au pic et le dernier à sortir. Il a un abonnement au tube.' },
      shugo: { role: 'Le castor de Secret', perk: 'Tournée générale', perkDesc: 'Ton combo met plus de temps à retomber.',
        bio: 'Il tient les comptes, la glacière et le moral des troupes. Rarement dans cet ordre.' },
      max: { role: 'Le dompteur de Ngor', perk: 'Flair de lynx', perkDesc: 'Repère les packs au loin et remplit la glacière plus vite.',
        bio: 'Il voit une série arriver à 2 km et une bière fraîche à 200 m.' },
      quentin: { role: 'Le canard breton', perk: 'Gosier en pente', perkDesc: 'Aimant : attire les bières de plus loin.',
        bio: 'Moustache au vent, il ne laisse jamais une bouteille dériver seule.' },
      victor: { role: 'Vroussos Services, binouse à toutes heures', perk: 'Montée de sève', perkDesc: 'Sauts plus hauts et plus longs.',
        bio: 'Gros ressort dans les jambes : il décolle de chaque lèvre comme si c’était la dernière.' },
      timichel: { role: 'Le confiseur des Sables', perk: 'Douceur sucrée', perkDesc: 'Ton combo met plus de temps à retomber.',
        bio: 'Bandana, tatouages et poches pleines de pralines : il drague même les vagues.' },
      rom1michel: { role: 'Le roi de la roulée', perk: 'Vieux loup de mer', perkDesc: 'Remplit la glacière plus vite.',
        bio: 'Gilet en laine, roulée au bec et zéro stress : la houle attendra qu’il ait fini.' },
      grandmichel: { role: 'Le maître du budō kaidō', perk: 'Coupe aérodynamique', perkDesc: 'Sauts plus hauts et plus longs.',
        bio: 'Lunettes noires, coupe Jackson Five et un cri qui fait fuir les goélands.' },
      jeremichel: { role: 'Le shaper de chez Jam’in', perk: 'Planche maison', perkDesc: 'Figures +25 % de points.',
        bio: 'Il a une planche pour chaque vague… et une de rechange à lancer sur les autres.' },
      maman: { role: 'Pac Pack !', perk: 'Les doigts magiques', perkDesc: 'Aimant : attire les bières de plus loin.',
        bio: 'Casquette à l’envers et une dent en moins : personne ne sait ce que font ses deux doigts.' },
    },
    spots: {
      ouakam: { time: "Fin d'après-midi", desc: 'La gauche du récif sous la mosquée : puissante, à mériter avant l’apéro.' },
      secret: { time: 'Ciel voilé', desc: 'Pointe des Almadies : rapide, creuse, et les rochers ne pardonnent pas.' },
      virage: { time: 'Ciel couvert', desc: 'Le beach break du club : du monde, de l’écume et plein de bouteilles à sauver.' },
      ngor: { time: 'Grand soleil', desc: "La droite de N'gor : longue, douce, parfaite pour enchaîner (les figures)." },
      sauzaie: { time: 'Ciel de traîne', desc: 'Le reef mythique de Brétignolles : creux, rapide, sur dalle rocheuse. Line-up tendu.' },
      portbara: { time: 'Ciel chargé', desc: 'Crique de granite de la Côte sauvage : gauche puissante, shore-break et courants.' },
      budbud: { time: 'Grand bleu', desc: 'Le beach break de Longeville entre dunes et pins : creux, court… et blindé de monde.' },
      lizay: { time: 'Fin d’après-midi', desc: 'Au bout de l’île de Ré, au pied des grandes dunes, phare des Baleines à l’horizon.' },
    },
    tricks: { cutback: 'Cutback', aerial: 'Aerial', spin: '360' },
    trash: { gazelle: 'Bouteille verte', ambree: 'Ambrée', canette: 'Canette' },
    facts: {
      gazelle: [
        'Une bouteille sauvée est une bouteille qui ne finit pas au fond de l’eau.',
        'La règle du club : la verte se partage, jamais elle ne se perd.',
        'Les verres, comme les vagues, se partagent mieux à plusieurs.',
      ],
      ambree: [
        'Ambrée en mer, ambiance au bar.',
        'Une ambrée flotte, un surfeur aussi. Coïncidence ? Le club ne pense pas.',
      ],
      canette: [
        'Une canette ramassée, c’est de l’aluminium recyclable à l’infini.',
        'Canette vide ? Direction la poubelle de tri, pas la plage.',
      ],
      water: [
        'Le SBA, depuis 2019 : le surf d’abord, la bière ensuite.',
        'Au line-up, priorité à celui qui est le plus près du pic. Au bar, à celui qui paie la tournée.',
        'Pas de session sans crème solaire, pas d’apéro sans eau à côté.',
        'Une bonne session se mesure au sourire, pas au nombre de bouteilles.',
      ],
    },
    lessons: {
      gazelle: 'La verte a gagné ce soir : on trinque, on rince la planche, et on garde la plage propre.',
      ambree: 'Tournée d’ambrées bien méritée : un verre d’eau entre chaque, c’est la règle du capitaine.',
      canette: 'Les canettes au tri, les potes au bar, les planches au rack. Tout est à sa place.',
      none: 'Zéro bière ramenée ? Le club t’offre quand même un verre… d’eau. Retente ta chance !',
    },
  },

  en: {
    ui: {
      backSite: '', canvas: '3D surf game', loading: 'Popping the cap on the wave…',
      title1: 'Surf', title2: 'Beer',
      subtitle: 'SBA against the Michels: surf the waves of Dakar or the Atlantic, land tricks, bring back as many cold beers as you can in 30 seconds, then settle it at the Secret Bar.',
      play: 'Paddle out!', titleHint: 'Mobile: swipe to steer · Computer: arrow keys + Space',
      shopTitle: 'Pick your board', shopTitleP: '{name}: pick your board', shopHello: 'Hey! Welcome to Jam’in. I shaped every one of these boards myself: take the one that suits you.', shopOk: 'I’ll take this one', shopSee: 'See it at Jam’in', shopBuy: 'Order the real one', shopDims: 'Dimensions', shopProg: 'Programme', shopShape: 'Shape', shopSurfer: 'Surfer', step1: 'Step 1 / 2', step2: 'Step 2 / 2', chooseSurfer: 'Pick your rider', chooseSpot: 'Pick your spot',
      back: 'Back', choose: 'Choose', surfHere: "Let's go", surfers: 'Riders', spots: 'Spots',
      howTitle: 'How to play',
      hSteer: 'Steer', hSteerTouch: 'Slide your finger left / right.', hSteerKbd: 'Arrow keys ← → or A / D.', hSteerTxt: 'Go left to climb towards the lip of the wave.',
      hJump: 'Jump', hJumpTouch: 'Swipe up or tap “Jump”.', hJumpKbd: 'Space (or ↑).', hJumpTxt: 'Jump off the lip to fly higher!',
      hTricks: 'Tricks', hTricksTxt: 'Cutback, Aerial, 360: they only count in the air or on the lip. Mix them up, the club is watching!', hTricksKbd: '(keys 1, 2, 3)',
      hTrash: 'Beers', hTrashTxt: 'Grab the floating green bottles, ambers and cans: the cooler fills up.',
      hObst: 'Obstacles', hObstTxt: 'Avoid rocks and pirogues (or jump over them). A wipeout spills your combo.',
      hComboTxt: 'Chain beers and tricks quickly to multiply your points.',
      go: 'Cheers, paddle out!', pause: 'Pause', resume: 'Resume', restart: 'Restart', changeSpot: 'Change spot',
      score: 'Score', time: 'Time', combo: 'Combo', cleanMeter: 'Cooler',
      hintDrag: 'Swipe ← → to surf · up to jump', jump: 'Jump', space: 'Space',
      soundOn: 'Turn sound on', soundOff: 'Mute sound',
      didYouKnow: 'Bar talk', waterQuality: 'Club wisdom',
      tooLow: 'Too low!', tooLowSub: 'Jump or ride up to the lip', bis: '(again?)',
      oceanClean: 'Cooler full!', wipeout: 'Wipeout!', comboLost: 'Combo spilled', over: 'Cleared!',
      inAir: 'In the air!', onLip: 'On the lip!', countGo: 'Cheers!', endPop: 'Session over!', pts: 'pts',
      hotspot: 'Six-pack spotted! Your sharp eye marks it in yellow.', hotspotKicker: "Max's radar",
      wave: 'Wave', trash: 'Beers', rocks: 'Rocks', pirogues: 'Pirogues', crowd: 'Surfers', goRight: 'Right', goLeft: 'Left', record: 'Best: ', newRecord: 'New club record on this spot!',
      perk: 'Perk', sessionOver: 'Session over!', finalScore: 'Final score',
      rTricks: 'Tricks', rClean: 'Beers', rCount: 'Bottles saved', rKg: 'Volume saved', rCombo: 'Best combo',
      lesson: 'Toast of the session', replay: 'Another round', discover: '',
      waterNote: 'Please drink responsibly. And after the session, nobody drives: get a lift home.',
      chooseMode: 'Pick a mode', modeSolo: 'Solo', modeSoloTxt: 'A 30-second session, then a brawl at the Secret Bar against the CPU.',
      modeLocal: 'Duo, same screen', modeLocalTxt: 'Two riders on the same wave, then settle it at the bar. One half of the screen each.',
      modeOnline: 'Duo online', modeOnlineTxt: 'Each on your own phone: both start it, you connect automatically.',
      player1: 'Player 1', player2: 'Player 2', chooseP1: 'Player 1: pick your rider', chooseP2: 'Player 2: pick your rider',
      onlineTitle: 'Duo online', retry: 'Try again', full: 'A two-player game is already running.',
      connecting: 'Connecting…', waitingMate: 'Waiting for your mate… They start “Duo online” on their side.', netError: 'Could not connect. Check your connection and try again.', mateLeft: 'Your mate left the game.',
      waitHostSpot: 'The host is picking the spot…', waitHostGo: 'Waiting for the host…', waitMateChar: 'Your mate is picking a rider…',
      toBar: 'Off to the Secret Bar 🥊', barIn: 'The Secret Bar opens in {n}s…', duoWin: '{name} wins the session!', duoDraw: 'Dead heat!',
      hFight: 'Secret Bar', hFightTxt: 'After the session, brawl at the bar: punch, kick, throw a beer, and a special move when your meter is full. Your surf score fills part of it.',
      hDuo: 'Duo', hDuoKbd: 'P1: A/Q D, W/Z jump, 1 2 3 tricks · P2: ← →, ↑ jump, J K L tricks.', hDuoTouch: 'One half of the screen each: slide to steer, swipe up to jump, tap for a trick.',
      menu: 'Menu',
    },
    boards: {
      bigguy: { prog: 'All conditions up to 2.5 m.', shape: 'Versatile outline, wide front third and generous volume for easy paddling, full concave, boxy rail, square tail.', surfer: 'Intermediate to advanced. A shortboard for big guys.' },
      groms: { prog: 'All conditions.', shape: 'Classic round pintail, concave to double concave, light boxy rail.', surfer: 'Advanced.' },
      clown: { prog: 'All conditions from 50 cm to 2 m.', shape: 'Fish outline up front, slightly narrow tail. Full channel bottom, always accelerating. Low, boxy rails. Home-made double-foiled biomimetic fins. Loves hollow waves, surfed with your weight on the tail: it rides more like a twin-fin than a fish. Huge drive, easy cutbacks, turns that roll on their own.', surfer: 'Advanced and expert.' },
      egg: { prog: 'All conditions from 50 cm to 2 m.', shape: 'Modern egg: round nose, shortboard tail. Flat to concave to double vee, rounded tail, boxy rail. A good mix of egg comfort and shortboard behaviour.', surfer: 'Smaller surfers of all levels, and advanced.' },
    },
    chars: {
      luca: { role: 'Ma che Porco Dio', perk: 'Barrel king', perkDesc: 'Tricks score +25%.',
        bio: 'First one at the peak, last one out. He has a season pass to the tube.' },
      shugo: { role: 'The beaver of Secret', perk: 'Round on me', perkDesc: 'Your combo takes longer to drop.',
        bio: 'Keeps the books, the cooler and the morale. Rarely in that order.' },
      max: { role: 'The tamer of Ngor', perk: 'Eagle eye', perkDesc: 'Spots six-packs from afar and fills the cooler faster.',
        bio: 'Sees a set coming from a mile away, and a cold beer from 200 metres.' },
      quentin: { role: 'The Breton duck', perk: 'Thirsty throat', perkDesc: 'Magnet: pulls beers in from further away.',
        bio: 'Moustache in the wind, he never lets a bottle drift alone.' },
      victor: { role: 'Vroussos Services, beers at all hours', perk: 'Big hops', perkDesc: 'Higher, longer jumps.',
        bio: 'Springs for legs: he launches off every lip like it is the last one.' },
      timichel: { role: 'The candy man of Les Sables', perk: 'Sweet tooth', perkDesc: 'Your combo takes longer to drop.',
        bio: 'Bandana, tattoos and pockets full of pralines: he even flirts with the waves.' },
      rom1michel: { role: 'King of the roll-up', perk: 'Old sea dog', perkDesc: 'Fills the cooler faster.',
        bio: 'Wool cardigan, roll-up in his mouth and zero stress: the swell can wait.' },
      grandmichel: { role: 'Budō kaidō master', perk: 'Aerodynamic hair', perkDesc: 'Higher, longer jumps.',
        bio: 'Shades, a Jackson Five afro and a shout that scares off the seagulls.' },
      jeremichel: { role: 'The Jam’in shaper', perk: 'Home-made board', perkDesc: 'Tricks +25% points.',
        bio: 'He has a board for every wave… and a spare one to throw at people.' },
      maman: { role: 'Pac Pack!', perk: 'Magic fingers', perkDesc: 'Magnet: pulls beers in from further away.',
        bio: 'Backwards cap and a missing tooth: nobody knows what his two fingers do.' },
    },
    spots: {
      ouakam: { time: 'Late afternoon', desc: 'The reef left below the mosque: powerful, earn it before happy hour.' },
      secret: { time: 'Hazy sky', desc: 'Almadies point: fast, hollow, and the rocks do not forgive.' },
      virage: { time: 'Overcast', desc: 'The club beach break: crowded, foamy and full of bottles to rescue.' },
      ngor: { time: 'Full sun', desc: 'The N’gor right: long and mellow, perfect for chaining (tricks).' },
      sauzaie: { time: 'Showery sky', desc: 'Brétignolles’ legendary reef: hollow and fast over rock slabs. Tense line-up.' },
      portbara: { time: 'Heavy sky', desc: 'Granite cove on the Côte sauvage: powerful left, shore-break and rips.' },
      budbud: { time: 'Clear blue', desc: 'Longeville’s beach break between dunes and pines: hollow, short… and packed.' },
      lizay: { time: 'Late afternoon', desc: 'At the tip of Île de Ré, below the big dunes, Baleines lighthouse on the horizon.' },
    },
    tricks: { cutback: 'Cutback', aerial: 'Aerial', spin: '360' },
    trash: { gazelle: 'Green bottle', ambree: 'Amber', canette: 'Can' },
    facts: {
      gazelle: [
        'A rescued bottle is a bottle that does not end up on the seabed.',
        'Club rule: the green one gets shared, never lost.',
        'Drinks, like waves, are better shared.',
      ],
      ambree: [
        'Amber at sea, good vibes at the bar.',
        'An amber floats, so does a surfer. Coincidence? The club thinks not.',
      ],
      canette: [
        'A rescued can is aluminium that can be recycled again and again.',
        'Empty can? Into the recycling bin, not onto the beach.',
      ],
      water: [
        'SBA, since 2019: surf first, beer later.',
        'In the line-up, the surfer closest to the peak has priority. At the bar, whoever buys the round.',
        'No session without sunscreen, no happy hour without a glass of water.',
        'A good session is measured in smiles, not in bottles.',
      ],
    },
    lessons: {
      gazelle: 'Green bottles won tonight: cheers, rinse the board, and keep the beach clean.',
      ambree: 'A well-earned round of ambers: one glass of water between each, captain’s orders.',
      canette: 'Cans in the recycling, mates at the bar, boards on the rack. All in their place.',
      none: 'No beers rescued? The club still buys you a drink… of water. Try again!',
    },
  },
};

const LANGS = ['fr', 'en'];
let LANG = 'fr';
try { const l = localStorage.getItem('sba-lang'); if (LANGS.includes(l)) LANG = l; } catch (e) { /* ignore */ }
function L() { return I18N[LANG] || I18N.fr; }
function t(path) {
  const get = (root) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), root);
  const v = get(L());
  return v == null ? (get(I18N.fr) ?? path) : v;
}
const fmt = (n) => Math.round(n).toLocaleString(LANG === 'en' ? 'en-GB' : 'fr-FR');

// Apparence 3D de chaque joueur (stylisée) + atout de jeu
const CHAR_LOOKS = {
  luca: { skin: 0xf0c9aa, hair: 'classic', hairColor: 0x1e1612, beard: 'stubble', beardOpacity: 0.3, shirt: 0x111418, shorts: 0xF2A900, board: 0xffffff, stripe: 0x3A7A93, perk: 'tricks' },
  shugo: { skin: 0xefc6a6, hair: 'crop', hairColor: 0x2a1d16, shirt: 0x3A7A93, shorts: 0x111418, board: 0xF2A900, stripe: 0x111418, perk: 'combo' },
  max: { skin: 0xf1cbae, hair: 'curly', hairColor: 0x9a6a3e, shirt: 0xF2A900, shorts: 0x3A7A93, board: 0x111418, stripe: 0x4CAF2F, perk: 'cooler' },
  quentin: { skin: 0xf3cfb4, hair: 'wavy', hairColor: 0x5a3a22, moustache: true, shirt: 0x4CAF2F, shorts: 0x1d2a33, board: 0x3A7A93, stripe: 0xF2A900, perk: 'magnet' },
  victor: { skin: 0xf2cdb2, hair: 'short', hairColor: 0x6b4a2e, beard: 'stubble', shirt: 0xe98aa6, shorts: 0x3A7A93, board: 0x4CAF2F, stripe: 0xffffff, perk: 'air' },
  // équipe Michel
  timichel: { skin: 0xc98a5c, hair: 'bandana', scarf: 0x15151a, hairColor: 0x3a2618, moustache: true, beard: 'stubble', beardOpacity: 0.35, shirt: 0xf4f4f0, shorts: 0x7fa6c9, board: 0xffffff, stripe: 0xd9483b, perk: 'combo' },
  rom1michel: { skin: 0xd99a6c, hair: 'messy', hairColor: 0x8a5a32, beard: 'stubble', beardOpacity: 0.55, shirt: 0x58703a, shorts: 0xcdb48c, board: 0xF2A900, stripe: 0x58703a, perk: 'cooler' },
  grandmichel: { skin: 0xcf8a58, hair: 'afro', hairColor: 0x24160e, glasses: true, shirt: 0xcf8a58, shorts: 0x8fb3d4, board: 0xf3ead8, stripe: 0x111418, perk: 'air', height: 1.08 },
  jeremichel: { skin: 0xd4946a, hair: 'full', hairColor: 0x3d2817, beard: 'stubble', beardOpacity: 0.5, shirt: 0x2b8fd6, shorts: 0xc8b28a, board: 0xe3b778, stripe: 0x111418, perk: 'tricks' },
  maman: { skin: 0xe6b796, hair: 'capBack', scarf: 0x9aa39a, hairColor: 0x3a2a1c, beard: 'stubble', beardOpacity: 0.45, shirt: 0xe6b796, shorts: 0x2d3a4a, board: 0x7fd0f0, stripe: 0xffffff, perk: 'magnet' },
};
/* Planches du surf shop Jam'in (photos de jamin-surfboards.com, avec l'accord de JéréMichel ; illustration dessinée si la photo manque) */
const JAMIN_PREORDER = 'https://jamin-surfboards.com/pre-commande/';
const BOARDS = [
  { id: 'bigguy', name: 'The Big Guy’s', dims: '6’6 × 20 ½” × 2 ½”', photo: 'img/boards/bigguy.jpg', url: 'https://jamin-surfboards.com/shapes/the-big-guys/', look: { board: 0xf6f3ea, stripe: 0x1f6fd1 } },
  { id: 'groms', name: 'Grom’s Model', dims: '5’8 × 18 ¾” × 2 5/16”', photo: 'img/boards/groms.jpg', url: 'https://jamin-surfboards.com/shapes/groms-model/', look: { board: 0xf2d81e, stripe: 0x1f8f8a } },
  { id: 'clown', name: 'The Black Clown', dims: '5’8 × 21” × 2 ½”', photo: 'img/boards/clown.jpg', url: 'https://jamin-surfboards.com/shapes/the-black-clown/', look: { board: 0x151515, stripe: 0xf4f4f0 } },
  { id: 'egg', name: 'Pillule Egg', dims: '6’2 × 20” × 2 ½”', photo: 'img/boards/egg.jpg', url: 'https://jamin-surfboards.com/shapes/pillule-egg/', look: { board: 0xf1ead6, stripe: 0x2a9d93 } },
];
const withBoard = (ch, boardId) => {
  const b = ch && BOARDS.find((x) => x.id === boardId);
  return b ? Object.assign({}, ch, b.look) : ch;
};
// illustration SVG d'une planche posée contre le mur bleu du shop
function boardSVG(id) {
  const wall = '<rect width="100" height="300" fill="#3db7e8"/><rect y="282" width="100" height="18" fill="#7d776c"/><rect x="28" y="276" width="44" height="8" fill="#4d9be0"/>';
  const logo = (x, y, bg) => `<rect x="${x}" y="${y}" width="12" height="14" fill="${bg || '#1b1512'}"/><circle cx="${x + 6}" cy="${y + 5.5}" r="3.6" fill="#f3efe6"/><circle cx="${x + 6}" cy="${y + 5.5}" r="1.1" fill="#1b1512"/><rect x="${x + 2.5}" y="${y + 10.5}" width="7" height="1.4" fill="#f3efe6"/>`;
  let body = '';
  if (id === 'bigguy') {
    const o = 'M50 22 C70 60 72 150 70 230 C69 262 62 276 50 277 C38 276 31 262 30 230 C28 150 30 60 50 22 Z';
    body = `<defs><clipPath id="cb">${'<path d="' + o + '"/>'}</clipPath><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0.72" stop-color="#1f6fd1"/><stop offset="1" stop-color="#cfe6ff"/></linearGradient></defs>
      <path d="${o}" fill="#f6f3ea"/><g clip-path="url(#cb)"><rect x="20" y="176" width="60" height="7" fill="#1f6fd1"/><rect x="20" y="194" width="60" height="10" fill="#1f6fd1"/><rect x="20" y="214" width="60" height="70" fill="url(#gb)"/></g>
      <line x1="50" y1="24" x2="50" y2="275" stroke="#d9c7a4" stroke-width="0.7"/>${logo(34, 88)}`;
  } else if (id === 'groms') {
    const o = 'M50 24 C68 60 70 150 68 220 C66 255 57 274 50 280 C43 274 34 255 32 220 C30 150 32 60 50 24 Z';
    body = `<defs><linearGradient id="gg" x1="0" y1="0" x2="0" y2="1"><stop offset="0.2" stop-color="#f2e21e"/><stop offset="0.45" stop-color="#7be21e"/><stop offset="0.62" stop-color="#5fd12a"/><stop offset="0.75" stop-color="#1f8f8a"/><stop offset="1" stop-color="#1a7f8a"/></linearGradient></defs>
      <path d="${o}" fill="url(#gg)"/><line x1="50" y1="26" x2="50" y2="278" stroke="#c9763a" stroke-width="0.7"/>${logo(35, 92)}`;
  } else if (id === 'clown') {
    const o = 'M50 26 C72 60 74 150 72 220 C71 250 66 270 60 280 L50 268 L40 280 C34 270 29 250 28 220 C26 150 28 60 50 26 Z';
    const band = (y, h) => `<path d="M20 ${y} Q35 ${y - 4} 50 ${y} T80 ${y} L80 ${y + h} Q65 ${y + h + 4} 50 ${y + h} T20 ${y + h} Z" fill="#f4f4f0" stroke="#3a9be8" stroke-width="1.4"/>`;
    body = `<defs><clipPath id="cc"><path d="${o}"/></clipPath></defs><path d="${o}" fill="#141414"/>
      <g clip-path="url(#cc)">${band(66, 20)}${band(146, 30)}${band(234, 16)}</g>
      <line x1="50" y1="28" x2="50" y2="266" stroke="#c98a4a" stroke-width="0.6"/>${logo(36, 82, '#4a4642')}`;
  } else {
    const o = 'M50 20 C76 22 76 120 74 210 C73 255 64 278 50 280 C36 278 27 255 26 210 C24 120 24 22 50 20 Z';
    body = `<defs><clipPath id="ce"><path d="${o}"/></clipPath><pattern id="pe" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="#6b4a44"/><ellipse cx="5" cy="5" rx="2.4" ry="4" fill="#2aa39a"/><ellipse cx="5" cy="5" rx="1" ry="2" fill="#e8d9a8"/></pattern></defs>
      <path d="${o}" fill="#6b5148"/><path d="M50 23 C72 25 72 120 71 210 C70 252 62 274 50 276 C38 274 30 252 29 210 C28 120 28 25 50 23 Z" fill="#2aa39a"/>
      <path d="M50 25 C70 27 70 120 69 210 C68 250 61 272 50 274 C39 272 32 250 31 210 C30 120 30 27 50 25 Z" fill="#f3ecd8"/>
      <g clip-path="url(#ce)"><path d="M50 205 L75 238 L75 290 L25 290 L25 238 Z" fill="url(#pe)"/></g>
      <line x1="50" y1="26" x2="50" y2="205" stroke="#c9763a" stroke-width="0.6"/>${logo(34, 74, '#3a1512')}`;
  }
  return `<svg viewBox="0 0 100 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden="true">${wall}${body}</svg>`;
}

const CHARACTERS = PLAYERS.map((p) => Object.assign({ team: 'sba' }, CHAR_LOOKS[p.id] || {}, p));

const SPOTS = [
  {
    id: 'ouakam', name: 'Ouakam',
    waveH: 6.4, speed: 15, speedGain: 0.5, trashPer100: 8.78, obstPer100: 2.12, obstacle: 'rock',
    rockColor: 0x3a2c24, startClean: 0.1, wave: 3, trashLvl: 2, foam: 0.4, lipSpray: 0.2,
    sky: ['#2f74c0', '#a9cdea', '#f3e2c4'], sun: '#fff0d6', sunI: 2.3, sunDir: [-0.45, 0.5, -0.75], hemi: ['#d8e9ff', '#7a6a50'],
    sand: '#e2cfa8', land: '#b09a74', fog: '#e7e4da',
    water: ['#0a4f8a', '#1fb6c9'],
    trashMix: { gazelle: 5, ambree: 2, canette: 2 },
  },
  {
    id: 'secret', name: 'Secret',
    waveH: 7.4, speed: 16.5, speedGain: 0.5, trashPer100: 7.43, obstPer100: 2.88, obstacle: 'rock',
    rockColor: 0x1c1a1a, startClean: 0.15, wave: 4, trashLvl: 1, foam: 0.3, lipSpray: 0.3,
    sky: ['#9fa9ae', '#c9c5b9', '#e4d9c5'], sun: '#fff4e0', sunI: 1.7, sunDir: [-0.3, 0.7, -0.6], hemi: ['#e6e2d8', '#5a5045'],
    sand: '#8f7d68', land: '#8a7556', fog: '#ddd3c2',
    water: ['#0a4f8a', '#1fb6c9'],
    trashMix: { gazelle: 5, ambree: 2, canette: 2 },
  },
  {
    id: 'virage', name: 'Virage',
    waveH: 4.9, speed: 13.5, speedGain: 0.44, trashPer100: 12.83, obstPer100: 1.75, obstacle: 'pirogue',
    startClean: 0, wave: 2, trashLvl: 3, foam: 1, lipSpray: 0,
    sky: ['#8c979f', '#b4bcc1', '#d4d6d3'], sun: '#f4f1ea', sunI: 1.4, sunDir: [0.4, 0.75, -0.5], hemi: ['#e4e8ea', '#8a8270'],
    sand: '#e6d3ae', land: '#c4b08a', fog: '#cfd2d0',
    water: ['#0a4f8a', '#1fb6c9'],
    trashMix: { gazelle: 6, ambree: 3, canette: 3 },
  },
  {
    id: 'ngor', name: "N'gor",
    waveH: 5.6, speed: 14, speedGain: 0.31, trashPer100: 8.78, obstPer100: 1.12, obstacle: 'pirogue',
    startClean: 0.1, wave: 2, trashLvl: 2, foam: 0.7, lipSpray: 1,
    sky: ['#1f6fc4', '#7fb8e6', '#e0f0fb'], sun: '#fffaf0', sunI: 2.4, sunDir: [-0.35, 0.75, -0.55], hemi: ['#e6f3ff', '#6a5040'],
    sand: '#9a5a3a', land: '#8d5634', fog: '#d6eaf6',
    water: ['#0a4f8a', '#1fb6c9'],
    clouds: 14,
    trashMix: { gazelle: 5, ambree: 2, canette: 2 },
  },
  // ---- spots Michel (côte atlantique) ; right: vague qui déferle à droite (image en miroir) ----
  {
    id: 'sauzaie', name: 'La Sauzaie', team: 'michel', right: true,
    waveH: 7.0, speed: 16, speedGain: 0.5, trashPer100: 6.5, obstPer100: 2.7, obstacle: 'rock',
    rockColor: 0x3b3631, startClean: 0.2, wave: 4, trashLvl: 1, foam: 0.5, lipSpray: 0.4,
    sky: ['#5d8fc0', '#a7c3dc', '#e4e7e2'], sun: '#fff6e6', sunI: 2.0, sunDir: [-0.4, 0.6, -0.7], hemi: ['#dfe9f2', '#6a6250'],
    sand: '#d6c4a0', land: '#8f8670', fog: '#dfe3e2',
    water: ['#16505e', '#3d9a92'],
    trashMix: { gazelle: 5, ambree: 2, canette: 2 },
  },
  {
    id: 'portbara', name: 'Port Bara', team: 'michel',
    waveH: 6.6, speed: 15.5, speedGain: 0.48, trashPer100: 7, obstPer100: 2.4, obstacle: 'rock',
    rockColor: 0x6f675c, startClean: 0.25, wave: 3, trashLvl: 1, foam: 0.8, lipSpray: 0.5,
    sky: ['#6e8496', '#a9b6bf', '#d8dbd6'], sun: '#f4f1ea', sunI: 1.5, sunDir: [0.3, 0.7, -0.6], hemi: ['#e2e6e8', '#5e584c'],
    sand: '#d9c9a4', land: '#8d8676', fog: '#cfd5d6',
    water: ['#123f52', '#2f8a8f'],
    clouds: 14,
    trashMix: { gazelle: 5, ambree: 2, canette: 2 },
  },
  {
    id: 'budbud', name: 'Bud Bud', team: 'michel',
    waveH: 5.8, speed: 14.5, speedGain: 0.45, trashPer100: 9, obstPer100: 1.6, obstacle: 'surfer',
    startClean: 0.1, wave: 3, trashLvl: 2, foam: 0.7, lipSpray: 0.2,
    sky: ['#3f86c8', '#9fc8ea', '#eef3f2'], sun: '#fffaf0', sunI: 2.3, sunDir: [-0.35, 0.7, -0.6], hemi: ['#e8f2fb', '#7a6a48'],
    sand: '#e6d2a2', land: '#cdb98a', fog: '#e4eef2',
    water: ['#1a5566', '#46a8a0'],
    trashMix: { gazelle: 6, ambree: 3, canette: 3 },
  },
  {
    id: 'lizay', name: 'Le Lizay', team: 'michel', right: true,
    waveH: 5.2, speed: 14, speedGain: 0.35, trashPer100: 8, obstPer100: 2.0, obstacle: 'rock',
    rockColor: 0x4a463f, startClean: 0.15, wave: 2, trashLvl: 2, foam: 0.6, lipSpray: 0.3,
    sky: ['#4a8ccc', '#a8cde8', '#f0eadb'], sun: '#fff3dc', sunI: 2.2, sunDir: [-0.3, 0.75, -0.55], hemi: ['#e9f1f8', '#7d6e50'],
    sand: '#eadcb8', land: '#d8c9a0', fog: '#e8ece6',
    water: ['#195a6e', '#4ab0aa'],
    trashMix: { gazelle: 5, ambree: 2, canette: 2 },
  },
];
const MIR = () => (S.spot && S.spot.right ? -1 : 1); // vague à droite : image et commandes en miroir

// pts = points, kg = volume en litres (estimation ludique)
const TRASH = {
  gazelle: { pts: 60, kg: 0.63 },
  ambree: { pts: 50, kg: 0.33 },
  canette: { pts: 40, kg: 0.33 },
};

const TRICKS = {
  cutback: { pts: 100, dur: 0.5 },
  aerial: { pts: 200, dur: 0.6 },
  spin: { pts: 300, dur: 0.6 },
};

/* ------------------------------------------------------------------ */
/* Moteur 3D                                                           */
/* ------------------------------------------------------------------ */

const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 900);
scene.fog = new THREE.Fog(0xcfe9fb, 90, 380);

const hemi = new THREE.HemisphereLight(0xdfefff, 0x7a6a50, 1.1);
scene.add(hemi);
const sunLight = new THREE.DirectionalLight(0xffffff, 2);
scene.add(sunLight);
scene.add(sunLight.target);

// --- Géométries / matériaux partagés ---
const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl6: new THREE.CylinderGeometry(1, 1, 1, 6),
  cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
  cone4: new THREE.ConeGeometry(1, 1, 4),
  cone8: new THREE.ConeGeometry(1, 1, 8),
  ico0: new THREE.IcosahedronGeometry(1, 0),
  ico1: new THREE.IcosahedronGeometry(1, 1),
  dodec: new THREE.DodecahedronGeometry(1, 0),
  hemi: new THREE.SphereGeometry(1, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2),
  sphere: new THREE.SphereGeometry(1, 10, 6),
};
GEO.leaf = (() => {
  const g = new THREE.ConeGeometry(0.45, 3.2, 3);
  g.translate(0, 1.6, 0);
  g.rotateZ(-(Math.PI / 2 + 0.35));
  g.scale(1, 0.3, 1);
  return g;
})();
GEO.boardShape = (() => {
  const g = new THREE.SphereGeometry(1, 10, 5);
  g.scale(0.32, 0.06, 1.12);
  return g;
})();

const matCache = new Map();
function mat(color, opts) {
  const key = color + (opts ? JSON.stringify(opts) : '');
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshLambertMaterial(Object.assign({ color, flatShading: true }, opts || {}));
    matCache.set(key, m);
  }
  return m;
}
function mesh(geo, color, opts) { return new THREE.Mesh(geo, mat(color, opts)); }
function boxM(w, h, d, color) { const m = mesh(GEO.box, color); m.scale.set(w, h, d); return m; }

/* ---------------- Ciel ---------------- */
const skyGeo = new THREE.SphereGeometry(600, 24, 14);
skyGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(skyGeo.attributes.position.count * 3), 3));
const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false, depthWrite: false }));
sky.renderOrder = -10;
scene.add(sky);
const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(26, 24), new THREE.MeshBasicMaterial({ color: 0xfff3d0, fog: false, depthWrite: false }));
sunDisc.renderOrder = -9;
scene.add(sunDisc);
const sunDirV = new THREE.Vector3(0, 1, 0);

function setSky(spot) {
  const top = new THREE.Color(spot.sky[0]), mid = new THREE.Color(spot.sky[1]), bot = new THREE.Color(spot.sky[2]);
  const pos = skyGeo.attributes.position, col = skyGeo.attributes.color, c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / 600;
    if (y < 0.08) c.copy(bot);
    else if (y < 0.35) c.copy(bot).lerp(mid, (y - 0.08) / 0.27);
    else c.copy(mid).lerp(top, Math.min(1, (y - 0.35) / 0.5));
    col.setXYZ(i, c.r, c.g, c.b);
  }
  col.needsUpdate = true;
  sunDirV.set(spot.sunDir[0], spot.sunDir[1], spot.sunDir[2]).normalize();
  sunDisc.material.color.set(spot.sun);
  sunLight.color.set(spot.sun);
  sunLight.intensity = spot.sunI;
  sunLight.position.copy(sunDirV).multiplyScalar(100);
  hemi.color.set(spot.hemi[0]);
  hemi.groundColor.set(spot.hemi[1]);
  scene.fog.color.set(spot.fog);
  COL.cleanDeep.set(spot.water[0]);
  COL.cleanLight.set(spot.water[1]);
  COL.murkyDeep.set(spot.water[0]);
  COL.murkyLight.set(spot.water[1]);
}

/* ---------------- Vague ---------------- */
const XL = -6;      // lèvre (crête)
const XT = 5;       // creux (pied de la vague)
const X_MIN = XL + 0.3;
const X_MAX = XT + 7;
const LIP_ZONE = XL + 1.9;
const WAVE_X0 = -34, WAVE_X1 = 30, WAVE_Z0 = -230, WAVE_Z1 = 30;
const WSX = 52, WSZ = 80;

const waveGeo = new THREE.PlaneGeometry(WAVE_X1 - WAVE_X0, WAVE_Z1 - WAVE_Z0, WSX, WSZ);
waveGeo.rotateX(-Math.PI / 2);
waveGeo.translate((WAVE_X0 + WAVE_X1) / 2, 0, (WAVE_Z0 + WAVE_Z1) / 2);
const wavePos = waveGeo.attributes.position;
const waveBase = new Float32Array(wavePos.count * 2);
for (let i = 0; i < wavePos.count; i++) {
  // densifie la grille autour de la face de la vague
  let x = wavePos.getX(i);
  const u = (x - WAVE_X0) / (WAVE_X1 - WAVE_X0);
  const center = (XL + XT) / 2;
  const t = u * 2 - 1; // -1..1
  const warped = Math.sign(t) * Math.pow(Math.abs(t), 1.35);
  x = center + warped * (t < 0 ? center - WAVE_X0 : WAVE_X1 - center);
  waveBase[i * 2] = x;
  waveBase[i * 2 + 1] = wavePos.getZ(i);
}
waveGeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(wavePos.count * 3), 3));
// Phong + facettes : reflets du soleil sur les facettes (peu coûteux)
const waveMesh = new THREE.Mesh(waveGeo, new THREE.MeshPhongMaterial({ vertexColors: true, flatShading: true, shininess: 110, specular: 0x5a8fa8 }));
waveMesh.frustumCulled = false;
scene.add(waveMesh);

// Lèvre qui déferle (bande de mousse en crochet)
const LIP_PROFILE = [[-0.7, -0.35], [-0.1, 0.2], [0.7, 0.35], [1.4, 0.05], [1.8, -0.55]];
const lipGeo = new THREE.BufferGeometry();
const lipCount = (WSZ + 1) * LIP_PROFILE.length;
lipGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lipCount * 3), 3));
{
  const idx = [];
  const P = LIP_PROFILE.length;
  for (let r = 0; r < WSZ; r++) {
    for (let k = 0; k < P - 1; k++) {
      const a = r * P + k, b = a + 1, c = a + P, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  lipGeo.setIndex(idx);
}
const lipMesh = new THREE.Mesh(lipGeo, new THREE.MeshPhongMaterial({ color: 0xf2fbff, flatShading: true, side: THREE.DoubleSide, shininess: 40, specular: 0x8899aa }));
lipMesh.frustumCulled = false;
scene.add(lipMesh);

// Océan au large
const ocean = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x1b8fb0, shininess: 60, specular: 0x5a8aa0 }));
ocean.rotation.x = -Math.PI / 2;
ocean.position.set(-300, -0.45, -300);
scene.add(ocean);

// Plage / terre (statiques)
const sandMesh = new THREE.Mesh(new THREE.PlaneGeometry(70, 1400), new THREE.MeshLambertMaterial({ color: 0xead6b0 }));
sandMesh.rotation.x = -Math.PI / 2;
sandMesh.position.set(WAVE_X1 - 4 + 35, 0.25, -400);
scene.add(sandMesh);
const landMesh = new THREE.Mesh(new THREE.PlaneGeometry(900, 1400), new THREE.MeshLambertMaterial({ color: 0xc9b48a }));
landMesh.rotation.x = -Math.PI / 2;
landMesh.position.set(WAVE_X1 + 66 + 450, 0.5, -400);
scene.add(landMesh);

const COL = {
  murkyDeep: new THREE.Color('#2f5458'), murkyLight: new THREE.Color('#7fa39a'),
  cleanDeep: new THREE.Color('#0a5f8c'), cleanLight: new THREE.Color('#47e0d6'),
  foam: new THREE.Color('#f4fbff'),
  rim: new THREE.Color('#a8f0f2'),
};
const cDeep = new THREE.Color(), cLight = new THREE.Color(), cTmp = new THREE.Color();

const W = { H: 4, travel: 0, t: 0, close: 0, collapse: 0 };
function crestH(p) {
  return W.H * (1 + 0.12 * Math.sin(p * 0.045) + 0.06 * Math.sin(p * 0.11 + 1.3)) * (1 - 0.6 * W.collapse);
}
function profile(x, H) {
  if (x >= XT) return 0;
  if (x >= XL) { const s = (XT - x) / (XT - XL); return H * Math.pow(s, 2.3); }
  const d = (XL - x) / 6;
  return H * Math.exp(-d * d * 1.5);
}
function chop(x, p, t) {
  return 0.13 * Math.sin(x * 0.85 + t * 1.6 + p * 0.21) + 0.1 * Math.sin(p * 0.37 - t * 1.25 + x * 0.3);
}
function surfaceY(x, z) {
  const p = z - W.travel;
  return profile(x, crestH(p)) + chop(x, p, W.t);
}
function slopeAt(x, z) {
  return (surfaceY(x + 0.25, z) - surfaceY(x - 0.25, z)) / 0.5;
}

let waterClean = 0;
function updateWave() {
  const t = W.t, tr = W.travel;
  const foamLvl = S.spot.foam || 0;
  cDeep.copy(COL.murkyDeep).lerp(COL.cleanDeep, waterClean);
  cLight.copy(COL.murkyLight).lerp(COL.cleanLight, waterClean);
  ocean.material.color.copy(cDeep).lerp(cLight, 0.25);
  const pos = wavePos.array, col = waveGeo.attributes.color.array;
  const n = wavePos.count;
  for (let i = 0; i < n; i++) {
    const x = waveBase[i * 2], z = waveBase[i * 2 + 1];
    const p = z - tr;
    const H = crestH(p);
    let h = profile(x, H) + chop(x, p, t);
    if (W.close > 0) {
      const front = XL - 1 + W.close * (XT + 12 - XL);
      const dx = (x - front) / 1.8;
      h += 1.1 * Math.min(1, W.close * 3) * Math.exp(-dx * dx) * (0.8 + 0.2 * Math.sin(p * 0.5 + t * 6));
    }
    pos[i * 3] = x;
    pos[i * 3 + 1] = h;
    pos[i * 3 + 2] = z;
    // couleur
    let r = Math.max(0, h) / H;
    if (x >= XL) cTmp.copy(cDeep).lerp(cLight, Math.min(1, Math.pow(r, 0.8) * 1.05));
    else cTmp.copy(cDeep).lerp(cLight, r * 0.5);
    // liseré clair (effet de transparence) sous la lèvre
    if (x >= XL && r > 0.68 && r <= 0.88) cTmp.lerp(COL.rim, (r - 0.68) * 2.6);
    if (x > XL - 1.2 && x < XL + 1.6 && r > 0.86) cTmp.lerp(COL.foam, 0.7);
    // traînées d'écume légères sur la face
    if (x > XL + 1 && x < XT) {
      const st = Math.sin(p * 0.9 + x * 0.55 - t * 0.7) * Math.sin(p * 0.21 + 1.7);
      if (st > 0.72) cTmp.lerp(COL.foam, (st - 0.72) * 1.4);
    }
    // fermeture de la vague : barre d'écume qui roule vers le bord
    if (W.close > 0) {
      const front = XL - 1 + W.close * (XT + 12 - XL);
      if (x > XL - 3 && x < front) {
        const nz = 0.7 + 0.3 * Math.sin(p * 0.7 + x * 1.3 + t * 5);
        cTmp.lerp(COL.foam, Math.min(0.92, W.close * 2.2) * nz);
      }
    }
    if (foamLvl && x > XT - 0.5 && x < XT + 14) {
      // lignes d'écume / mousse devant la vague
      const f = Math.sin(p * 0.21 + x * 0.7 + t * 0.5) + 0.6 * Math.sin(p * 0.07 - x * 1.3);
      const th = 1.25 - foamLvl * 0.55;
      if (f > th) cTmp.lerp(COL.foam, Math.min(0.5, (f - th) * 1.2) * clamp((-z - 4) / 26, 0, 1));
    }
    if (x > WAVE_X1 - 7) cTmp.lerp(COL.foam, Math.min(1, (x - (WAVE_X1 - 7)) / 6) * 0.6);
    col[i * 3] = cTmp.r; col[i * 3 + 1] = cTmp.g; col[i * 3 + 2] = cTmp.b;
  }
  wavePos.needsUpdate = true;
  waveGeo.attributes.color.needsUpdate = true;

  // lèvre
  const lp = lipGeo.attributes.position.array;
  const P = LIP_PROFILE.length;
  for (let r = 0; r <= WSZ; r++) {
    const z = WAVE_Z0 + (r / WSZ) * (WAVE_Z1 - WAVE_Z0);
    const p = z - tr;
    const H = crestH(p);
    const s = H / 5;
    const wob = 0.15 * Math.sin(p * 0.3 + t * 3);
    const pitch = Math.min(1, W.close * 2.2);
    for (let k = 0; k < P; k++) {
      const j = (r * P + k) * 3;
      const u2 = (k / (P - 1)) * (k / (P - 1));
      lp[j] = XL + LIP_PROFILE[k][0] * s + wob * (k / P) + pitch * u2 * 3.4 * s;
      lp[j + 1] = H + LIP_PROFILE[k][1] * s + (k === 2 ? wob : 0) - pitch * u2 * H * 0.85;
      lp[j + 2] = z;
    }
  }
  lipGeo.attributes.position.needsUpdate = true;
}

/* ---------------- Écume (particules) ---------------- */
const SPRAY_N = 260;
const sprayGeo = new THREE.BufferGeometry();
const sprayPos = new Float32Array(SPRAY_N * 3);
const sprayVel = new Float32Array(SPRAY_N * 3);
const sprayLife = new Float32Array(SPRAY_N);
sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPos, 3));
for (let i = 0; i < SPRAY_N; i++) sprayPos[i * 3 + 1] = -100;
const spray = new THREE.Points(sprayGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 0.28, transparent: true, opacity: 0.9, depthWrite: false }));
spray.frustumCulled = false;
scene.add(spray);
let sprayIdx = 0;
function emitSpray(x, y, z, n, power) {
  for (let k = 0; k < n; k++) {
    const i = sprayIdx; sprayIdx = (sprayIdx + 1) % SPRAY_N;
    sprayPos[i * 3] = x + rand(-0.3, 0.3);
    sprayPos[i * 3 + 1] = y + rand(0, 0.3);
    sprayPos[i * 3 + 2] = z + rand(-0.4, 0.6);
    sprayVel[i * 3] = rand(-1, 1) * power;
    sprayVel[i * 3 + 1] = rand(1.5, 4) * power;
    sprayVel[i * 3 + 2] = rand(1, 4) * power;
    sprayLife[i] = rand(0.4, 0.8);
  }
}
// embruns soufflés par le vent de terre depuis la lèvre
function emitLipSpray(z) {
  const i = sprayIdx; sprayIdx = (sprayIdx + 1) % SPRAY_N;
  sprayPos[i * 3] = XL + rand(-0.3, 0.9);
  sprayPos[i * 3 + 1] = crestH(z - W.travel) + rand(0.1, 0.5);
  sprayPos[i * 3 + 2] = z;
  sprayVel[i * 3] = -rand(3, 7);
  sprayVel[i * 3 + 1] = rand(1, 3);
  sprayVel[i * 3 + 2] = rand(-0.5, 0.5);
  sprayLife[i] = rand(0.5, 0.9);
}
// gerbes d'écume quand la vague ferme
function emitCloseSpray(z) {
  const i = sprayIdx; sprayIdx = (sprayIdx + 1) % SPRAY_N;
  const H = crestH(z - W.travel);
  sprayPos[i * 3] = XL + rand(-0.5, 2) + W.close * (XT - XL) * 0.6;
  sprayPos[i * 3 + 1] = H * rand(0.3, 1);
  sprayPos[i * 3 + 2] = z;
  sprayVel[i * 3] = rand(2, 7);
  sprayVel[i * 3 + 1] = rand(2, 6);
  sprayVel[i * 3 + 2] = rand(-1, 1);
  sprayLife[i] = rand(0.5, 1);
}
function updateSpray(dt, speed) {
  for (let i = 0; i < SPRAY_N; i++) {
    if (sprayLife[i] <= 0) continue;
    sprayLife[i] -= dt;
    sprayVel[i * 3 + 1] -= 12 * dt;
    sprayPos[i * 3] += sprayVel[i * 3] * dt;
    sprayPos[i * 3 + 1] += sprayVel[i * 3 + 1] * dt;
    sprayPos[i * 3 + 2] += (sprayVel[i * 3 + 2] + speed) * dt;
    if (sprayLife[i] <= 0) sprayPos[i * 3 + 1] = -100;
  }
  sprayGeo.attributes.position.needsUpdate = true;
}

/* ---------------- Surfeur ---------------- */
// Logo officiel Surfrider (symbole bleu, PNG transparent) sur le T-shirt
const LOGO_ASPECT = 1;
let thumbsDirty = false;
let logoMat = null, patchMat = null;
function getLogoMat() {
  if (logoMat) return logoMat;
  const tex = new THREE.TextureLoader().load('img/logo-sba.png', () => {
    thumbsDirty = true;
    if (currentScreen === 'char') buildCharCards();
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  logoMat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.05 });
  return logoMat;
}
let michelLogoMat = null;
function getMichelLogoMat() {
  if (michelLogoMat) return michelLogoMat;
  const tex = new THREE.TextureLoader().load('img/logo-michel-tshirt.png', () => {
    thumbsDirty = true;
    if (currentScreen === 'char') buildCharCards();
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  michelLogoMat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.05 });
  return michelLogoMat;
}
// petit écusson blanc arrondi pour les T-shirts foncés / bleus
function getPatchMat() {
  if (patchMat) return patchMat;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = 14;
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.moveTo(r, 2); g.arcTo(62, 2, 62, 62, r); g.arcTo(62, 62, 2, 62, r); g.arcTo(2, 62, 2, 2, r); g.arcTo(2, 2, 62, 2, r);
  g.closePath(); g.fill();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  patchMat = new THREE.MeshLambertMaterial({ map: tex, transparent: true });
  return patchMat;
}
function isLight(hex) {
  const r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.62;
}
function shade(hex, f) {
  const r = Math.min(255, Math.round(((hex >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((hex >> 8) & 255) * f));
  const b = Math.min(255, Math.round((hex & 255) * f));
  return `rgb(${r},${g},${b})`;
}

// Visage dessiné (sourcils, yeux, nez, bouche) : décalque CanvasTexture sur l'avant de la tête
const faceMats = new Map();
function getFaceMat(skin, light) {
  const key = skin + (light ? 'l' : 'd');
  if (faceMats.has(key)) return faceMats.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const brow = light ? '#4a3020' : '#120c08';
  // sourcils
  g.strokeStyle = brow; g.lineWidth = 6; g.lineCap = 'round';
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(64 + s * 11, 42); g.quadraticCurveTo(64 + s * 23, 35, 64 + s * 35, 41); g.stroke();
  }
  // yeux : blanc + iris + pupille + reflet
  for (const s of [-1, 1]) {
    const x = 64 + s * 23, y = 56;
    g.fillStyle = '#fbf8f2';
    g.beginPath(); g.ellipse(x, y, 12, 8, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = light ? '#6a4a2a' : '#3a2214';
    g.beginPath(); g.arc(x, y + 0.5, 6.5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#050403';
    g.beginPath(); g.arc(x, y + 0.5, 3.2, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath(); g.arc(x - 2.2, y - 2, 1.8, 0, Math.PI * 2); g.fill();
    g.strokeStyle = light ? '#3a2418' : '#0a0604'; g.lineWidth = 2.4;
    g.beginPath(); g.ellipse(x, y, 12, 8, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
  }
  // nez (ombre + narines)
  g.strokeStyle = shade(skin, 0.75); g.lineWidth = 1.8;
  g.beginPath(); g.moveTo(63, 66); g.quadraticCurveTo(60, 74, 63, 78); g.stroke();
  g.fillStyle = shade(skin, 0.5);
  for (const s of [-1, 1]) { g.beginPath(); g.ellipse(64 + s * 3.5, 79, 1.7, 1.1, 0, 0, Math.PI * 2); g.fill(); }
  // bouche souriante
  g.fillStyle = light ? '#c8706a' : shade(skin, 0.62);
  g.beginPath(); g.moveTo(45, 91); g.quadraticCurveTo(64, 85, 83, 91); g.quadraticCurveTo(64, 108, 45, 91); g.fill();
  g.fillStyle = '#f7f2ea';
  g.beginPath(); g.moveTo(50, 92); g.quadraticCurveTo(64, 90, 78, 92); g.quadraticCurveTo(64, 98, 50, 92); g.fill();
  g.strokeStyle = light ? '#7a3330' : shade(skin, 0.38); g.lineWidth = 2.6;
  g.beginPath(); g.moveTo(44, 90); g.quadraticCurveTo(64, 100, 84, 90); g.stroke();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.MeshLambertMaterial({ map: tex, transparent: true, depthWrite: false });
  faceMats.set(key, m);
  return m;
}

// Géométries arrondies partagées (mises en cache)
const geoCache = new Map();
function cached(key, make) { if (!geoCache.has(key)) geoCache.set(key, make()); return geoCache.get(key); }
function capsuleGeo(r, len, radial = 10) {
  return cached('c' + r + '_' + len + '_' + radial, () => new THREE.CapsuleGeometry(r, len, 3, radial));
}
function sphereGeo(r, w = 14, h = 10) {
  return cached('s' + r + '_' + w, () => new THREE.SphereGeometry(r, w, h));
}
const UP = new THREE.Vector3(0, 1, 0);
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();
// membre (capsule) entre deux points
function limb(parent, a, b, r, color, smooth, radial) {
  _a.set(a[0], a[1], a[2]); _b.set(b[0], b[1], b[2]);
  _d.subVectors(_b, _a);
  const len = Math.max(0.01, _d.length());
  const m = new THREE.Mesh(capsuleGeo(r, Math.round(len * 100) / 100, radial), typeof color === 'object' ? color : mat(color, smooth ? { flatShading: false } : null));
  m.position.addVectors(_a, _b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, _d.normalize());
  parent.add(m);
  return m;
}
// jambe de board short : tube évasé du genou (a) à la hanche (b)
function shortLeg(parent, a, b, rTop, rBot, color) {
  _a.set(a[0], a[1], a[2]); _b.set(b[0], b[1], b[2]);
  _d.subVectors(_b, _a);
  const len = Math.round(_d.length() * 100) / 100;
  const geo = cached('sh' + rTop + rBot + len, () => new THREE.CylinderGeometry(rTop, rBot, len, 12));
  const m = new THREE.Mesh(geo, mat(color, SMOOTH));
  m.position.addVectors(_a, _b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, _d.normalize());
  parent.add(m);
  return m;
}

const SMOOTH = { flatShading: false };
function buildSurfer(ch, lite, fighter) {
  const skin = ch.skin || 0x6b4430;
  const lightSkin = isLight(skin);
  const L = ch.height || 1; // facteur de taille (jambes / tronc)
  const root = new THREE.Group();
  const tilt = new THREE.Group(); root.add(tilt);
  const yaw = new THREE.Group(); tilt.add(yaw);
  const boardG = new THREE.Group(); yaw.add(boardG);
  if (!fighter) {
    const board = new THREE.Mesh(GEO.boardShape, mat(ch.board, SMOOTH)); board.position.y = 0.06; boardG.add(board);
    const stripe = boxM(0.05, 0.02, 1.9, ch.stripe); stripe.position.y = 0.115; boardG.add(stripe);
    const fin = boxM(0.04, 0.22, 0.25, 0x0B1F33); fin.position.set(0, -0.05, 0.85); boardG.add(fin);
  }

  const rider = new THREE.Group(); rider.position.y = fighter ? 0 : 0.1; yaw.add(rider);
  const hipY = 0.78 * L;
  const kneeY = 0.4 * L;
  const legs = [];
  const legsG = [];
  if (fighter) {
    // debout, jambes articulées à la hanche (pour les coups de pied)
    const shinCol = ch.leggings || skin;
    for (const s of [-1, 1]) {
      const lg = new THREE.Group(); lg.position.set(0, hipY, s * 0.13); rider.add(lg);
      const knee = [-0.03, kneeY - hipY, s * 0.01], foot = [0, 0.07 - hipY, s * 0.02];
      legs.push(limb(lg, foot, knee, 0.065, shinCol, true));
      shortLeg(lg, [knee[0] - 0.01, knee[1] - 0.05, knee[2]], [0, 0, 0], 0.11, 0.14, ch.shorts);
      const f = new THREE.Mesh(sphereGeo(0.06, 8, 6), mat(skin, SMOOTH)); f.scale.set(1.7, 0.6, 1); f.position.set(-0.07, foot[1] - 0.02, foot[2]); lg.add(f);
      legsG.push(lg);
    }
  } else if (!lite) {
    const shinCol = ch.leggings || skin;
    for (const s of [-1, 1]) {
      const foot = [0, 0.05, s * 0.4], knee = [-0.12, kneeY, s * 0.3], hip = [0, hipY, s * 0.14];
      legs.push(limb(rider, foot, knee, 0.065, shinCol, true));
      // board short ample et évasé, jusqu'au genou (un peu plus bas pour Paulèle)
      const drop = ch.longShorts ? 0.1 : 0.05;
      const kneeLow = [knee[0] - 0.01, knee[1] - drop, knee[2] + s * 0.01];
      shortLeg(rider, kneeLow, hip, 0.11, 0.14, ch.shorts);
      const f = new THREE.Mesh(sphereGeo(0.06, 8, 6), mat(skin, SMOOTH)); f.scale.set(1, 0.6, 1.7); f.position.set(-0.04, 0.04, s * 0.4); rider.add(f);
    }
  }
  const torso = new THREE.Group(); torso.position.y = hipY; rider.add(torso);
  // bassin (short ample)
  const pelvis = new THREE.Mesh(sphereGeo(0.16), mat(ch.shorts, SMOOTH)); pelvis.scale.set(1.08, 0.85, 1.55); pelvis.position.y = 0.04; torso.add(pelvis);
  // tronc (T-shirt)
  const tl = 0.3 * L;
  const chest = new THREE.Mesh(capsuleGeo(0.16, Math.round(tl * 100) / 100), mat(ch.shirt, SMOOTH));
  chest.scale.set(0.85, 1, 1.32); chest.position.y = 0.12 + tl / 2 + 0.06; torso.add(chest);
  const topY = 0.12 + tl + 0.12;
  if (!lite) {
    const ly = topY - 0.17;
    if (false) {
      const patch = new THREE.Mesh(cached('patch', () => new THREE.PlaneGeometry(0.2, 0.19)), getPatchMat());
      patch.rotation.y = -Math.PI / 2; patch.position.set(-0.141, ly, 0); torso.add(patch);
    }
    // logo SBA pour l'équipe SBA, écusson Michel pour l'équipe Michel
    const michel = ch.team === 'michel';
    const logo = michel
      ? new THREE.Mesh(cached('logoMichel', () => new THREE.PlaneGeometry(0.19, 0.095)), getMichelLogoMat())
      : new THREE.Mesh(cached('logo', () => new THREE.PlaneGeometry(0.17, 0.17 / LOGO_ASPECT)), getLogoMat());
    logo.rotation.y = -Math.PI / 2; logo.position.set(-0.143, ly, 0); torso.add(logo);
  }
  // cou + tête
  const neck = limb(torso, [0, topY - 0.02, 0], [-0.01, topY + 0.08, 0], 0.055, skin, true);
  const headY = topY + 0.22;
  const firstHeadChild = torso.children.length;
  const head = new THREE.Mesh(sphereGeo(0.135, 18, 14), mat(skin, SMOOTH)); head.scale.set(1, 1.12, 0.95); head.position.set(-0.02, headY, 0); torso.add(head);
  if (!lite) {
    // visage (décalque sur une calotte légèrement plus grande que la tête)
    const faceGeo = cached('face', () => new THREE.SphereGeometry(0.1365, 14, 10, -0.95, 1.9, Math.PI * 0.26, Math.PI * 0.48));
    const face = new THREE.Mesh(faceGeo, getFaceMat(skin, lightSkin)); face.renderOrder = 1; head.add(face);
    // nez en volume
    const nose = new THREE.Mesh(sphereGeo(0.015, 8, 6), mat(skin, SMOOTH)); nose.scale.set(0.8, 1.1, 0.75); nose.position.set(-0.127, -0.012, 0); head.add(nose);
    // oreilles (cachées par le voile)
    if (ch.hair !== 'hijab' && ch.hair !== 'loose') {
      for (const s of [-1, 1]) {
        const ear = new THREE.Mesh(sphereGeo(0.032, 8, 6), mat(skin, SMOOTH)); ear.scale.set(0.8, 1.2, 0.45); ear.position.set(0.0, 0.0, s * 0.133); head.add(ear);
      }
    }
  }
  // coiffure
  const hairCol = ch.hairColor || 0x16100c;
  const hairMat = mat(hairCol, SMOOTH);
  const hairMat2 = mat(hairCol, { flatShading: false, side: THREE.DoubleSide });
  const capGeo = cached('cap', () => new THREE.SphereGeometry(0.147, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.5));
  // mèches / boucles (pseudo-aléatoire stable pour que l'aperçu = le jeu)
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const tufts = (n, r, R) => {
    if (lite) return;
    for (let i = 0; i < n * 2 && n > 0; i++) {
      const th = rnd() * Math.PI * 0.58, ph = rnd() * Math.PI * 2;
      const dx = -Math.cos(ph) * Math.sin(th), dy = Math.cos(th), dz = Math.sin(ph) * Math.sin(th);
      if (dx < -0.3 && th > Math.PI * 0.22) continue; // dégage le front et le visage
      const m = new THREE.Mesh(sphereGeo(r, 8, 6), hairMat);
      m.scale.setScalar(0.8 + rnd() * 0.5);
      m.position.set(-0.015 + dx * R, headY + dy * R * 1.1, dz * R);
      torso.add(m); n--;
    }
  };
  const addCap = (sx = 1, sy = 1.12) => { const c = new THREE.Mesh(capGeo, hairMat); c.scale.set(sx, sy, 0.95); c.position.set(-0.015, headY + 0.005, 0); c.rotation.z = -0.5; torso.add(c); return c; };
  if (ch.hair === 'crop') {
    addCap(0.99, 1.1);
  } else if (ch.hair === 'dreads') {
    addCap(1.03, 1.15);
    if (!lite) {
      // dreadlocks qui tombent jusqu'au cou / aux épaules, visage dégagé
      for (let i = 0; i < 22; i++) {
        const ph = (i / 22) * Math.PI * 2 + (i % 2) * 0.12;
        const dx = Math.cos(ph), dz = Math.sin(ph);
        if (dx < -0.3) continue; // devant (visage)
        const th = 0.5 + (i % 3) * 0.22;
        const base = [-0.015 + dx * Math.sin(th) * 0.135, headY + Math.cos(th) * 0.15, dz * Math.sin(th) * 0.135];
        const mid = [base[0] + dx * 0.05, base[1] - 0.1, base[2] + dz * 0.05];
        const len = 0.14 + (dx > 0.3 ? 0.06 : 0) + (i % 3) * 0.02;
        const tip = [mid[0] + dx * 0.02, mid[1] - len, mid[2] + dz * 0.025];
        limb(torso, base, mid, 0.021, hairMat, true, 6);
        limb(torso, mid, tip, 0.019, hairMat, true, 6);
      }
    }
  } else if (ch.hair === 'hijab') {
    // voile : couvre cheveux, oreilles et cou, visage dégagé
    const sc = mat(ch.scarf, { flatShading: false, side: THREE.DoubleSide });
    const veil = new THREE.Mesh(cached('hijab', () => new THREE.SphereGeometry(0.158, 18, 12, 0.85, Math.PI * 2 - 1.7, 0, Math.PI * 0.82)), sc); veil.scale.set(1, 1.12, 1); veil.position.set(-0.01, headY + 0.01, 0); torso.add(veil);
    const top = new THREE.Mesh(cached('hijabTop', () => new THREE.SphereGeometry(0.16, 16, 6, 0, Math.PI * 2, 0, Math.PI * 0.3)), sc); top.scale.set(1, 1.12, 1); top.position.set(-0.01, headY + 0.01, 0); torso.add(top);
    const drape = new THREE.Mesh(cached('drape', () => new THREE.CylinderGeometry(0.12, 0.22, 0.2, 16, 1, true)), sc); drape.position.set(0.0, topY + 0.06, 0); drape.scale.z = 1.2; torso.add(drape);
  } else if (ch.hair === 'loose') {
    // cheveux détachés, aux épaules et dans le dos
    addCap(1.04, 1.17);
    const mass = new THREE.Mesh(cached('hairMass', () => new THREE.SphereGeometry(0.152, 18, 12, 1.0, Math.PI * 2 - 2.0, 0, Math.PI * 0.72)), hairMat2);
    mass.scale.set(1.02, 1.14, 1.06); mass.position.set(0.0, headY + 0.005, 0); torso.add(mass);
    const fall = new THREE.Mesh(cached('hairFall', () => new THREE.CylinderGeometry(0.14, 0.2, 0.3, 16, 1, true, Math.PI / 2 - 1.55, 3.1)), hairMat2);
    fall.scale.set(1, 1, 1.05); fall.position.set(0.01, headY - 0.17, 0); torso.add(fall);
  } else if (ch.hair === 'wavy') {
    // mi-longs ondulés, en bataille
    addCap(1.05, 1.18);
    const mass = new THREE.Mesh(cached('hairMassS', () => new THREE.SphereGeometry(0.152, 16, 10, 1.05, Math.PI * 2 - 2.1, 0, Math.PI * 0.62)), hairMat2);
    mass.scale.set(1.06, 1.12, 1.12); mass.position.set(0.0, headY, 0); torso.add(mass);
    tufts(16, 0.05, 0.155);
  } else if (ch.hair === 'curly') {
    addCap(1.02, 1.12);
    tufts(30, 0.045, 0.15);
  } else if (ch.hair === 'messy') {
    addCap(1.04, 1.15);
    const mass = new THREE.Mesh(cached('hairMassS', () => new THREE.SphereGeometry(0.152, 16, 10, 1.05, Math.PI * 2 - 2.1, 0, Math.PI * 0.62)), hairMat2);
    mass.scale.set(1.02, 1.08, 1.06); mass.position.set(0.0, headY, 0); torso.add(mass);
    tufts(18, 0.048, 0.152);
  } else if (ch.hair === 'classic') {
    // coupe classique : courte sur les côtés, raie sur le côté, mèche plaquée
    const c = addCap(1.0, 1.08); c.rotation.z = -0.62; // dégage le front, court sur les côtés
    const top = new THREE.Mesh(sphereGeo(0.12, 14, 10), hairMat); top.scale.set(1.0, 0.42, 1.08); top.position.set(-0.01, headY + 0.115, 0.0); torso.add(top);
    const quiff = new THREE.Mesh(sphereGeo(0.07, 12, 8), hairMat); quiff.scale.set(0.9, 0.55, 1.45); quiff.position.set(-0.085, headY + 0.13, -0.035); quiff.rotation.x = -0.3; torso.add(quiff);
  } else if (ch.hair === 'full') {
    // cheveux fournis, courts-moyens
    addCap(1.05, 1.18);
    const mass = new THREE.Mesh(cached('hairMassS', () => new THREE.SphereGeometry(0.152, 16, 10, 1.05, Math.PI * 2 - 2.1, 0, Math.PI * 0.62)), hairMat2);
    mass.scale.set(1.06, 1.16, 1.1); mass.position.set(0.0, headY + 0.008, 0); torso.add(mass);
    const front = new THREE.Mesh(sphereGeo(0.08, 12, 8), hairMat); front.scale.set(1.0, 0.55, 1.6); front.position.set(-0.08, headY + 0.11, 0); torso.add(front);
    tufts(10, 0.045, 0.158);
  } else if (ch.hair === 'receding') {
    const c = addCap(0.99, 1.06); c.rotation.z = -0.85;
  } else if (ch.hair === 'afro') {
    // grosse coupe afro façon Jackson Five
    addCap(1.05, 1.15);
    const afro = new THREE.Mesh(sphereGeo(0.25, 18, 14), hairMat); afro.scale.set(0.72, 0.9, 1.08); afro.position.set(0.1, headY + 0.09, 0); torso.add(afro);
    const crown = new THREE.Mesh(sphereGeo(0.2, 14, 10), hairMat); crown.scale.set(0.8, 0.6, 1.1); crown.position.set(0.0, headY + 0.17, 0); torso.add(crown);
    tufts(30, 0.055, 0.2);
  } else if (ch.hair === 'bandana') {
    // bandana noué derrière la tête, pointes qui dépassent
    const sc = mat(ch.scarf || 0x111111, SMOOTH);
    const band = new THREE.Mesh(capGeo, sc); band.scale.set(1.04, 1.1, 0.98); band.position.set(-0.015, headY + 0.008, 0); band.rotation.z = -0.38; torso.add(band);
    if (!lite) {
      const knot = new THREE.Mesh(sphereGeo(0.035, 8, 6), sc); knot.position.set(0.15, headY + 0.02, 0); torso.add(knot);
      for (const z of [-0.03, 0.03]) { const tail = new THREE.Mesh(sphereGeo(0.05, 8, 6), sc); tail.scale.set(1.5, 0.35, 0.6); tail.position.set(0.21, headY - 0.03, z); tail.rotation.z = -0.6; torso.add(tail); }
      for (let i = 0; i < 10; i++) { const a = rnd() * Math.PI * 2, b = rnd() * 0.9; const dot = new THREE.Mesh(sphereGeo(0.008, 5, 4), mat(0xffffff, SMOOTH)); dot.position.set(-0.015 + Math.sin(b) * Math.cos(a) * 0.155, headY + 0.01 + Math.cos(b) * 0.17, Math.sin(b) * Math.sin(a) * 0.155); torso.add(dot); }
    }
  } else if (ch.hair === 'capBack') {
    // casquette portée à l'envers, visière dans la nuque
    addCap(0.99, 1.06);
    const cm = mat(ch.scarf || 0x888888, SMOOTH);
    const cap = new THREE.Mesh(capGeo, cm); cap.scale.set(1.06, 0.95, 1.02); cap.position.set(-0.01, headY + 0.03, 0); cap.rotation.z = -0.15; torso.add(cap);
    const visor = new THREE.Mesh(sphereGeo(0.1, 12, 6), cm); visor.scale.set(0.9, 0.12, 1.15); visor.position.set(0.15, headY + 0.03, 0); visor.rotation.z = 0.35; torso.add(visor);
    if (!lite) { const strap = new THREE.Mesh(sphereGeo(0.05, 8, 6), mat(0x6d756d, SMOOTH)); strap.scale.set(0.5, 0.4, 1.3); strap.position.set(0.135, headY + 0.07, 0); torso.add(strap); }
  } else if (ch.hair === 'bun') {
    addCap();
    const bun = new THREE.Mesh(sphereGeo(0.07, 10, 8), hairMat); bun.position.set(0.13, headY + 0.1, 0); torso.add(bun);
  } else {
    addCap();
  }
  // barbe / moustache
  if (!lite && ch.beard) {
    const bm = ch.beard === 'stubble' ? mat(hairCol, { flatShading: false, transparent: true, opacity: ch.beardOpacity || 0.45 }) : hairMat;
    const beard = new THREE.Mesh(cached('beard', () => new THREE.SphereGeometry(0.139, 16, 8, -1.35, 2.7, Math.PI * 0.655, Math.PI * 0.28)), bm);
    beard.scale.set(1, 1.12, 0.95); beard.position.set(-0.02, headY, 0); torso.add(beard);
    if (ch.beard === 'full') {
      const chin = new THREE.Mesh(sphereGeo(0.05, 10, 8), hairMat); chin.scale.set(0.9, 0.7, 1.4); chin.position.set(-0.13, headY - 0.125, 0); torso.add(chin);
    }
  }
  if (!lite && ch.glasses) {
    // lunettes de soleil type aviateur
    const gm = new THREE.MeshPhongMaterial({ color: 0x111418, shininess: 120, specular: 0x8899aa });
    for (const z of [-0.05, 0.05]) { const l = new THREE.Mesh(sphereGeo(0.042, 12, 8), gm); l.scale.set(0.35, 0.85, 1); l.position.set(-0.15, headY + 0.03, z); torso.add(l); }
    limb(torso, [-0.155, headY + 0.055, -0.03], [-0.155, headY + 0.055, 0.03], 0.006, 0xc9a74a, true, 5);
    for (const s of [-1, 1]) limb(torso, [-0.15, headY + 0.05, s * 0.085], [0.0, headY + 0.04, s * 0.14], 0.006, 0xc9a74a, true, 5);
  }
  if (!lite && ch.moustache) {
    limb(torso, [-0.158, headY - 0.04, -0.045], [-0.158, headY - 0.04, 0.045], 0.011, hairCol, true, 6);
  }
  // tête + visage + coiffure regroupés et légèrement agrandis (lisibilité)
  const headG = new THREE.Group(); headG.position.set(-0.02, headY, 0); headG.scale.setScalar(1.12);
  for (const o of torso.children.slice(firstHeadChild)) { o.position.x += 0.02; o.position.y -= headY; headG.add(o); }
  torso.add(headG);
  // bras
  const arms = [];
  const shY = topY - 0.08;
  const sleeveCol = ch.shirt;
  for (const s of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(0, shY, s * 0.2); torso.add(arm);
    // bras baissés et souples : coude légèrement plié vers l'avant
    const elbow = [0.04, -0.25, s * 0.15], wrist = [0.13, -0.46, s * 0.22];
    const sh = new THREE.Mesh(sphereGeo(0.075, 10, 8), mat(sleeveCol, SMOOTH)); arm.add(sh);
    if (ch.longSleeves) {
      limb(arm, [0, 0, 0], elbow, 0.055, sleeveCol, true);
      limb(arm, elbow, wrist, 0.047, sleeveCol, true);
    } else {
      const mid = [elbow[0] * 0.45, elbow[1] * 0.45, elbow[2] * 0.45];
      limb(arm, [0, 0, 0], mid, 0.062, sleeveCol, true);
      limb(arm, mid, elbow, 0.05, skin, true);
      limb(arm, elbow, wrist, 0.045, skin, true);
    }
    const hand = new THREE.Mesh(sphereGeo(0.05, 8, 6), mat(skin, SMOOTH)); hand.scale.set(0.8, 1, 1.2); hand.position.set(wrist[0] - 0.01, wrist[1] - 0.02, wrist[2] + s * 0.05); arm.add(hand);
    arm.rotation.x = s * -0.08;
    arms.push(arm);
  }
  torso.rotation.z = fighter ? 0.12 : 0.25; // penché vers la vague
  root.userData = { tilt, yaw, boardG, rider, torso, arms, legs, legsG, neck, headG };
  return root;
}

const shadowBlob = new THREE.Mesh(new THREE.CircleGeometry(0.85, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
shadowBlob.rotation.x = -Math.PI / 2;
const shadowG = new THREE.Group();
shadowG.add(shadowBlob);
scene.add(shadowG);

let surfer = null;
function setSurfer(ch) {
  if (surfer) scene.remove(surfer);
  surfer = buildSurfer(withBoard(ch, S.board));
  scene.add(surfer);
}

/* ---------------- Déchets ---------------- */
function buildTrash(type) {
  const g = new THREE.Group();
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 16), new THREE.MeshBasicMaterial({ color: 0xF2A900, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = -0.15; g.add(halo);
  const o = new THREE.Group(); g.add(o);
  if (type === 'canette') {
    const b = mesh(GEO.cyl8, 0xd8dde2); b.scale.set(0.16, 0.42, 0.16); o.add(b);
    const band = mesh(GEO.cyl8, 0x4CAF2F); band.scale.set(0.165, 0.18, 0.165); o.add(band);
    const top = mesh(GEO.cyl8, 0xb8bec4); top.scale.set(0.16, 0.04, 0.16); top.position.y = 0.23; o.add(top);
    o.rotation.z = Math.PI / 2; o.rotation.y = 0.6;
  } else {
    // bouteille verte façon « La Gazelle » (bandeau jaune et bleu) ou ambrée
    const green = type === 'gazelle';
    const glass = green ? 0x2f8f2a : 0x8a4b12;
    const gm = { transparent: true, opacity: 0.9 };
    const body = mesh(GEO.cyl8, glass, gm); body.scale.set(0.17, 0.5, 0.17); o.add(body);
    const sh = mesh(GEO.cone8, glass, gm); sh.scale.set(0.17, 0.2, 0.17); sh.position.y = 0.35; o.add(sh);
    const neck = mesh(GEO.cyl8, glass, gm); neck.scale.set(0.06, 0.2, 0.06); neck.position.y = 0.52; o.add(neck);
    const cap = mesh(GEO.cyl8, green ? 0xF2A900 : 0xd0d4d8); cap.scale.set(0.07, 0.04, 0.07); cap.position.y = 0.63; o.add(cap);
    const label = mesh(GEO.cyl8, green ? 0xFDE23A : 0xf4efe6); label.scale.set(0.176, 0.2, 0.176); label.position.y = -0.02; o.add(label);
    const stripe = mesh(GEO.cyl8, green ? 0x1f5fbf : 0xc8262b); stripe.scale.set(0.178, 0.05, 0.178); stripe.position.y = 0.05; o.add(stripe);
    o.rotation.z = Math.PI / 2;
  }
  return g;
}

/* ---------------- Obstacles & décor ---------------- */
function buildRock(color) {
  const g = new THREE.Group();
  const r = rand(0.9, 1.4);
  const a = mesh(GEO.dodec, color); a.scale.set(r, r * rand(0.8, 1.2), r * rand(0.9, 1.3)); a.rotation.set(rand(0, 3), rand(0, 3), 0); g.add(a);
  const b = mesh(GEO.dodec, color); b.scale.setScalar(r * 0.55); b.position.set(r * 0.7, -0.2, r * 0.5); g.add(b);
  const foam = new THREE.Mesh(new THREE.RingGeometry(r * 1.0, r * 1.5, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
  foam.rotation.x = -Math.PI / 2; foam.position.y = 0.05; g.add(foam);
  g.userData.r = r;
  return g;
}

const PIROGUE_SETS = [
  [0xE31B23, 0xFDEF42, 0x00853F], [0x0072BC, 0xFDEF42, 0xE31B23], [0x00853F, 0xffffff, 0x0072BC],
  [0xFDEF42, 0xE31B23, 0x0072BC], [0xffffff, 0x00853F, 0xE31B23],
];
function buildPirogue(set) {
  const c = set || pick(PIROGUE_SETS);
  const g = new THREE.Group();
  const L = 6.2, Wd = 1.25;
  const hull = boxM(Wd * 0.75, 0.4, L * 0.9, 0x4a3524); hull.position.y = 0.15; g.add(hull);
  const b1 = boxM(Wd, 0.26, L, c[0]); b1.position.y = 0.45; g.add(b1);
  const b2 = boxM(Wd * 1.05, 0.16, L * 0.96, c[1]); b2.position.y = 0.66; g.add(b2);
  const b3 = boxM(Wd * 1.07, 0.07, L * 0.92, c[2]); b3.position.y = 0.77; g.add(b3);
  for (const s of [-1, 1]) {
    const bow = mesh(GEO.cone4, c[0]); bow.scale.set(Wd * 0.62, 1.6, 0.55);
    bow.rotation.x = s * Math.PI / 2; bow.rotation.y = Math.PI / 4;
    bow.position.set(0, 0.5, s * (L / 2 + 0.75)); g.add(bow);
    const prow = boxM(0.14, 0.9, 0.35, c[1]); prow.position.set(0, 0.95, s * (L / 2 + 0.9)); prow.rotation.x = -s * 0.5; g.add(prow);
  }
  const seat = boxM(Wd, 0.06, 0.25, 0x7a5a3a); seat.position.set(0, 0.7, 0.8); g.add(seat);
  return g;
}

function buildPalm(h) {
  const g = new THREE.Group();
  const segs = 4, lean = rand(0.08, 0.2);
  let x = 0, y = 0;
  for (let i = 0; i < segs; i++) {
    const sh = h / segs;
    const seg = mesh(GEO.cyl6, 0x8a6a45);
    const r = 0.24 - i * 0.03;
    seg.scale.set(r, sh * 1.05, r);
    const ang = lean * (i + 1) * 0.7;
    const dx = Math.sin(ang) * sh;
    seg.position.set(x + dx / 2, y + sh / 2, 0);
    seg.rotation.z = -ang;
    g.add(seg);
    x += dx; y += Math.cos(ang) * sh;
  }
  const crown = new THREE.Group(); crown.position.set(x, y, 0);
  for (let k = 0; k < 7; k++) {
    const leaf = new THREE.Mesh(GEO.leaf, mat(k % 2 ? 0x2f8a3a : 0x3fa64a));
    leaf.rotation.y = (k / 7) * Math.PI * 2 + rand(-0.2, 0.2);
    crown.add(leaf);
  }
  g.add(crown);
  g.rotation.y = rand(0, Math.PI * 2);
  return g;
}

function buildHouse(w, h, d, color, roof) {
  const g = new THREE.Group();
  const b = boxM(w, h, d, color); b.position.y = h / 2; g.add(b);
  const win = boxM(0.08, h * 0.25, d * 0.6, 0x23384d); win.position.set(-w / 2 - 0.02, h * 0.6, 0); g.add(win);
  if (roof === 'slope') {
    const r = mesh(GEO.cone4, pick([0xE31B23, 0x00853F, 0x0072BC, 0xFDEF42])); r.scale.set(Math.max(w, d) * 0.78, h * 0.5, Math.max(w, d) * 0.78);
    r.rotation.y = Math.PI / 4; r.position.y = h + h * 0.25; g.add(r);
  } else if (roof === 'dome') {
    const r = mesh(GEO.hemi, 0xffffff); r.scale.setScalar(Math.min(w, d) * 0.35); r.position.y = h; g.add(r);
  } else {
    const r = boxM(w * 1.04, 0.2, d * 1.04, 0xe9e2d4); r.position.y = h + 0.1; g.add(r);
  }
  return g;
}

function buildMosque() {
  // Mosquée de la Divinité : minarets carrés blancs, dômes bulbeux à bande rouge et calotte verte, arcs en ogive soulignés de rouge
  const g = new THREE.Group();
  const white = 0xf7f5ef, red = 0xc8262b, green = 0x1f8a4c;
  const base = boxM(11, 6, 20, white); base.position.y = 3; g.add(base);
  const upper = boxM(8, 2.4, 12, white); upper.position.y = 7.2; g.add(upper);
  const dome = mesh(GEO.sphere, white); dome.scale.set(3.6, 3.8, 3.6); dome.position.y = 9.4; g.add(dome);
  const dBand = mesh(GEO.cyl8, red); dBand.scale.set(3.3, 0.35, 3.3); dBand.position.y = 8.7; g.add(dBand);
  const dCap = mesh(GEO.cone8, green); dCap.scale.set(0.9, 1.6, 0.9); dCap.position.y = 13.6; g.add(dCap);
  // arcs en ogive côté mer (-x)
  for (let i = -3; i <= 3; i++) {
    const frame = boxM(0.15, 3.6, 2.1, red); frame.position.set(-5.56, 2.4, i * 2.6); g.add(frame);
    const inner = boxM(0.18, 3.1, 1.5, 0x3c4a52); inner.position.set(-5.6, 2.2, i * 2.6); g.add(inner);
    const tip = mesh(GEO.cone4, red); tip.scale.set(0.1, 0.9, 1.05); tip.position.set(-5.56, 4.65, i * 2.6); g.add(tip);
  }
  for (const s of [-1, 1]) {
    const m = new THREE.Group(); m.position.set(-3.8, 0, s * 11.5);
    const shaft = boxM(2, 22, 2, white); shaft.position.y = 11; m.add(shaft);
    for (const dz of [-0.45, 0.45]) {
      const st = boxM(0.06, 16, 0.18, dz < 0 ? red : green); st.position.set(-1.02, 12, dz); m.add(st);
    }
    const balc = boxM(2.6, 0.5, 2.6, white); balc.position.y = 22.2; m.add(balc);
    const bulb = mesh(GEO.sphere, white); bulb.scale.set(1.5, 1.9, 1.5); bulb.position.y = 24; m.add(bulb);
    for (let k = 0; k < 8; k++) {
      // bande en zigzag rouge
      const zz = mesh(GEO.cone4, red); zz.scale.set(0.28, 0.5, 0.28);
      const a = (k / 8) * Math.PI * 2;
      zz.position.set(Math.cos(a) * 1.42, 23.4 + (k % 2) * 0.35, Math.sin(a) * 1.42);
      zz.rotation.z = k % 2 ? Math.PI : 0;
      m.add(zz);
    }
    const cap = mesh(GEO.cone8, green); cap.scale.set(0.5, 1.4, 0.5); cap.position.y = 26.4; m.add(cap);
    g.add(m);
  }
  return g;
}

function buildHangar(len) {
  // halle du marché aux poissons : murs blancs, toit en tôle grise ondulée
  const g = new THREE.Group();
  const walls = boxM(7, 3, len, 0xeeeae2); walls.position.y = 1.5; g.add(walls);
  for (const s of [-1, 1]) {
    const roof = boxM(4.2, 0.18, len + 1, 0x8e959a); roof.position.set(s * 1.8, 3.7, 0); roof.rotation.z = -s * 0.32; g.add(roof);
    for (let k = -2; k <= 2; k++) {
      const rib = boxM(4.2, 0.24, 0.25, 0x6f767b); rib.position.set(s * 1.8, 3.75, k * len / 5); rib.rotation.z = -s * 0.32; g.add(rib);
    }
  }
  for (let k = -3; k <= 3; k++) { const door = boxM(0.1, 2, 1.6, 0x4a5a63); door.position.set(-3.52, 1, k * len / 7); g.add(door); }
  return g;
}

function buildBench() {
  const g = new THREE.Group();
  const wood = 0x8a5a32;
  const seat = boxM(0.6, 0.12, 2.4, wood); seat.position.y = 0.55; g.add(seat);
  const back = boxM(0.1, 0.5, 2.4, wood); back.position.set(0.3, 0.9, 0); g.add(back);
  for (const z of [-1, 1]) { const l = boxM(0.5, 0.55, 0.1, 0x5a3a20); l.position.set(0, 0.27, z); g.add(l); }
  return g;
}

function buildMonument() {
  // Monument de la Renaissance africaine, très stylisé (bronze)
  const g = new THREE.Group();
  const br = 0x5b4632;
  const ped = boxM(10, 4, 10, 0x9a8f7c); ped.position.y = 2; g.add(ped);
  const man = new THREE.Group(); man.position.set(0, 4, 1.5); g.add(man);
  for (const z of [-1, 1]) { const leg = boxM(1.6, 11, 1.6, br); leg.position.set(0, 5.5, z * 1.3); leg.rotation.x = z * 0.08; man.add(leg); }
  const torso = boxM(3, 9, 4.2, br); torso.position.y = 15.5; man.add(torso);
  const head = mesh(GEO.ico1, br); head.scale.setScalar(1.6); head.position.set(0, 21.5, 0); man.add(head);
  const arm = boxM(1.1, 9, 1.1, br); arm.position.set(-1, 23, -2.6); arm.rotation.x = 0.55; man.add(arm);
  const child = boxM(1.2, 4.5, 1.2, br); child.position.set(-1.6, 28.5, -5.2); child.rotation.x = 0.6; man.add(child);
  const ch = mesh(GEO.ico1, br); ch.scale.setScalar(0.8); ch.position.set(-1.8, 30.8, -6.5); man.add(ch);
  const wom = new THREE.Group(); wom.position.set(1.5, 4, -2.5); wom.rotation.x = -0.25; g.add(wom);
  const wl = boxM(2.6, 10, 2.6, br); wl.position.y = 5; wom.add(wl);
  const wt = boxM(2.4, 7, 3, br); wt.position.y = 13.5; wom.add(wt);
  const wh = mesh(GEO.ico1, br); wh.scale.setScalar(1.3); wh.position.y = 18; wom.add(wh);
  const wa = boxM(0.9, 7, 0.9, br); wa.position.set(0, 13, 3); wa.rotation.x = -1.0; wom.add(wa);
  return g;
}

function buildMamelles(withMonument) {
  const g = new THREE.Group();
  const h1 = mesh(GEO.hemi, 0x7d6a47); h1.scale.set(38, 24, 34); g.add(h1);
  const h2 = mesh(GEO.hemi, 0x857256); h2.scale.set(34, 19, 32); h2.position.set(10, 0, -70); g.add(h2);
  const lh = new THREE.Group(); lh.position.set(0, 23.5, 0);
  const tower = mesh(GEO.cyl8, 0xffffff); tower.scale.set(1.6, 7, 1.6); tower.position.y = 3.5; lh.add(tower);
  const lamp = mesh(GEO.cyl8, 0xffe9a0); lamp.scale.set(1.2, 1.4, 1.2); lamp.position.y = 7.6; lh.add(lamp);
  const cap = mesh(GEO.cone8, 0xE31B23); cap.scale.set(1.5, 1.5, 1.5); cap.position.y = 9; lh.add(cap);
  const house = boxM(5, 2.4, 6, 0xffffff); house.position.set(1, 1.2, 3); lh.add(house);
  g.add(lh);
  if (withMonument) { const m = buildMonument(); m.position.set(10, 18, -70); m.scale.setScalar(0.9); g.add(m); }
  return g;
}

function buildTower(w, h, d, color, glass) {
  const g = new THREE.Group();
  const b = boxM(w, h, d, color); b.position.y = h / 2; g.add(b);
  const floors = Math.min(6, Math.floor(h / 6));
  for (let k = 1; k <= floors; k++) {
    const slab = boxM(w + 0.3, 0.35, d + 0.3, glass ? 0xf2f4f5 : 0xb5532c);
    slab.position.y = (k / (floors + 1)) * h; g.add(slab);
  }
  if (glass) { const strip = boxM(0.1, h * 0.9, d * 0.7, 0x6fa3c8); strip.position.set(-w / 2 - 0.05, h / 2, 0); g.add(strip); }
  return g;
}

const NPC_COLORS = [0xE31B23, 0x00853F, 0xFDEF42, 0x0072BC, 0x222222, 0xf08a4b, 0xffffff];
function buildNpcSurfer() {
  const c = pick(NPC_COLORS);
  const s = buildSurfer({ shirt: c, shorts: 0x1b2a3a, skin: pick([0x4a2c1d, 0x6b4430, 0xc99a78]), board: pick([0xffffff, 0xFDEF42, 0x7fd0f0, 0xf2a7c0]), stripe: pick(NPC_COLORS), hair: Math.random() < 0.4 ? 'bun' : 'crop' }, true);
  const u = s.userData;
  u.rider.position.y = -0.5; // assis sur la planche, jambes dans l'eau
  u.torso.rotation.z = -0.1;
  u.yaw.rotation.y = rand(-1.5, 1.5);
  return s;
}

/* ---------------- Décor des spots Michel (Atlantique) ---------------- */
function buildPine(h) {
  // pin maritime : tronc fin et houppier en parasol
  const g = new THREE.Group();
  const tr = mesh(GEO.cyl6, 0x6b4a32); tr.scale.set(0.25, h, 0.25); tr.position.y = h / 2; tr.rotation.z = rand(-0.12, 0.12); g.add(tr);
  for (let i = 0; i < 3; i++) {
    const c = mesh(GEO.ico0, pick([0x2f4a2a, 0x36552f, 0x2a4226])); c.scale.set(rand(2.2, 3.2), rand(1.1, 1.6), rand(2.2, 3.2));
    c.position.set(rand(-0.9, 0.9), h + rand(-0.3, 0.6), rand(-0.9, 0.9)); g.add(c);
  }
  return g;
}
function buildDune(w, h, d, color) {
  const g = new THREE.Group();
  const m = mesh(GEO.hemi, color); m.scale.set(w, h, d); g.add(m);
  // oyats
  const n = Math.round(w * d / 6);
  for (let i = 0; i < n; i++) {
    const a = rand(0, 6.28), r = rand(0.1, 0.85);
    const x = Math.cos(a) * r * w, z = Math.sin(a) * r * d, y = h * Math.sqrt(Math.max(0, 1 - r * r));
    const tuft = mesh(GEO.cone4, pick([0x9aa65a, 0xb3b06a, 0x8a9a52])); tuft.scale.set(0.35, rand(0.7, 1.2), 0.35); tuft.position.set(x, y + 0.3, z); g.add(tuft);
  }
  return g;
}
function buildFrHouse(w, h, d, roofCol) {
  // maison vendéenne / rétaise : murs blancs, volets, toit à deux pans
  const g = new THREE.Group();
  const b = boxM(w, h, d, 0xf6f3ec); b.position.y = h / 2; g.add(b);
  const shut = pick([0x3f7f6e, 0x4f86b8, 0x7fa3a0, 0xc9b23a]);
  for (const z of [-d * 0.25, d * 0.25]) { const sh = boxM(0.1, h * 0.35, d * 0.16, shut); sh.position.set(-w / 2 - 0.04, h * 0.55, z); g.add(sh); }
  const roof = mesh(GEO.cyl6, roofCol || 0xc8643a); roof.scale.set(w * 0.62, d * 1.04, w * 0.62); roof.rotation.x = Math.PI / 2; roof.position.y = h; g.add(roof);
  const cover = boxM(w * 1.1, h * 0.1, d * 1.06, 0xf6f3ec); cover.position.y = h - h * 0.05; g.add(cover);
  return g;
}
function buildLifeguard() {
  // poste de secours sur pilotis avec drapeau
  const g = new THREE.Group();
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = mesh(GEO.cyl6, 0x9a8a72); p.scale.set(0.12, 2.4, 0.12); p.position.set(x, 1.2, z); g.add(p); }
  const cab = boxM(2.6, 1.8, 2.6, 0xffffff); cab.position.y = 3.2; g.add(cab);
  const band = boxM(2.65, 0.4, 2.65, 0xd9483b); band.position.y = 3.5; g.add(band);
  const mast = mesh(GEO.cyl6, 0xdddddd); mast.scale.set(0.06, 3, 0.06); mast.position.set(0, 5.6, 0); g.add(mast);
  const flag = boxM(0.05, 0.6, 1.0, pick([0x4caf2f, 0xF2A900, 0xd9483b])); flag.position.set(0, 6.7, 0.5); g.add(flag);
  return g;
}
function buildCar() {
  const g = new THREE.Group();
  const col = pick([0xd9483b, 0x3a7a93, 0xf2f2f2, 0x222222, 0x8aa0b0, 0xF2A900]);
  const b = boxM(1.8, 0.7, 4, col); b.position.y = 0.65; g.add(b);
  const top = boxM(1.6, 0.6, 2.2, col); top.position.set(0, 1.25, -0.2); g.add(top);
  const glass = boxM(1.62, 0.4, 2.0, 0x23394a); glass.position.set(0, 1.27, -0.2); g.add(glass);
  if (Math.random() < 0.5) { const board = mesh(GEO.sphere, pick([0xffffff, 0x7fd0f0, 0xF2A900])); board.scale.set(0.3, 0.06, 1.1); board.position.y = 1.62; g.add(board); }
  return g;
}
function buildBaleines() {
  // phare des Baleines : grande tour octogonale grise, lanterne et coupole sombre
  const g = new THREE.Group();
  const base = boxM(9, 3, 9, 0xd8d2c4); base.position.y = 1.5; g.add(base);
  const tower = mesh(GEO.cyl8, 0xb9b3a6); tower.scale.set(2.6, 40, 2.6); tower.position.y = 23; g.add(tower);
  const gal = mesh(GEO.cyl8, 0x55575a); gal.scale.set(3.4, 0.6, 3.4); gal.position.y = 43.3; g.add(gal);
  const lamp = mesh(GEO.cyl8, 0xffe9a0); lamp.scale.set(1.9, 2.4, 1.9); lamp.position.y = 44.8; g.add(lamp);
  const cap = mesh(GEO.hemi, 0x2f3438); cap.scale.setScalar(2.1); cap.position.y = 46; g.add(cap);
  const keeper = boxM(10, 4, 6, 0xf2eee6); keeper.position.set(0, 2, 9); g.add(keeper);
  return g;
}
function buildSurfSchool() {
  // cabane de l'école de surf, planches alignées et drapeaux
  const g = new THREE.Group();
  const hut = boxM(4, 3, 6, 0x9b7650); hut.position.y = 1.5; g.add(hut);
  const roof = boxM(4.6, 0.3, 6.6, 0x3a7a93); roof.position.y = 3.15; g.add(roof);
  for (let i = 0; i < 6; i++) { const b = mesh(GEO.sphere, pick([0xffffff, 0xF2A900, 0x7fd0f0, 0xd9483b])); b.scale.set(0.35, 1.3, 0.08); b.position.set(-2.3, 1.3, -2.5 + i); b.rotation.x = 0.1; g.add(b); }
  for (const z of [-4, 4]) { const m = mesh(GEO.cyl6, 0xdddddd); m.scale.set(0.05, 4, 0.05); m.position.set(-1, 2, z); g.add(m); const fl = boxM(0.04, 2, 0.6, pick([0xd9483b, 0xF2A900, 0x3a7a93])); fl.position.set(-1, 3, z + 0.3); g.add(fl); }
  return g;
}

/* ---------------- Décor des spots ---------------- */
const sceneryGroup = new THREE.Group();
scene.add(sceneryGroup);
let props = []; // {obj, f (facteur de défilement), span, bob}

function addProp(obj, x, y, z, f, span, bob) {
  obj.position.set(x, y, z);
  sceneryGroup.add(obj);
  props.push({ obj, f, span, bob: bob ? { y, ph: rand(0, 6) } : null });
  return obj;
}

function buildScenery(spot) {
  sceneryGroup.clear();
  props = [];
  sandMesh.material.color.set(spot.sand);
  landMesh.material.color.set(spot.land);
  const SPAN = 340, Z0 = -290;
  const near = (n, fn) => { for (let i = 0; i < n; i++) fn(Z0 + (i / n) * SPAN + rand(-4, 4), i); };
  const boatsAtSea = (n) => near(n, (z) => { const p = buildPirogue(); p.rotation.y = rand(-0.6, 0.6); addProp(p, rand(-90, -45), -0.3, z * 1.5, 1, SPAN * 1.5, true); });

  if (spot.id === 'ouakam') {
    // petite plage avec pirogues, halle aux poissons, maisons blanches, arbres, falaises rouges en retrait
    near(12, (z) => { const p = buildPirogue(pick([[0x0072BC, 0xffffff, 0xE31B23], [0xffffff, 0x0072BC, 0xE31B23], [0xE31B23, 0xffffff, 0x0072BC]])); p.rotation.y = Math.PI / 2 + rand(-0.4, 0.4); addProp(p, rand(29, 40), 0.3, z, 1, SPAN); });
    near(3, (z) => addProp(buildHangar(rand(24, 34)), 47, 0.3, z, 1, SPAN));
    near(10, (z) => addProp(buildHouse(rand(4, 7), rand(3, 5), rand(4, 7), pick([0xffffff, 0xf4efe6, 0xece4d4]), 'flat'), rand(56, 68), 0.4, z, 1, SPAN));
    near(12, (z) => addProp(buildPalm(rand(5, 8)), rand(50, 62), 0.4, z, 1, SPAN));
    near(8, (z) => { const t = mesh(GEO.ico0, 0x3f8a3a); t.scale.set(rand(2, 3.5), rand(2, 3), rand(2, 3.5)); addProp(t, rand(52, 70), 2.2, z, 1, SPAN); });
    near(8, (z) => { const c = boxM(rand(10, 16), rand(10, 18), rand(16, 24), pick([0x9a4e2e, 0x8a4326, 0xa65a35])); addProp(c, rand(78, 90), c.scale.y / 2, z, 1, SPAN); });
    near(8, (z) => { const r = buildRock(0x3a2c24); r.scale.setScalar(rand(1, 1.8)); addProp(r, rand(25, 30), 0.1, z, 1, SPAN); });
    addProp(buildMosque(), 42, 0.3, -140, 0.12, 700);
    addProp(buildMamelles(false), 200, 0, -360, 0.05, 900);
    boatsAtSea(2);
  } else if (spot.id === 'secret') {
    // roches volcaniques noires dans l'eau peu profonde, colline avec le monument et le phare des Mamelles
    near(34, (z) => { const r = buildRock(0x1c1a1a); r.scale.setScalar(rand(1, 2.4)); addProp(r, rand(15, 40), 0, z, 1, SPAN); });
    near(14, (z) => {
      const h = buildHouse(rand(5, 10), rand(3.5, 7), rand(6, 11), pick([0xffffff, 0xf0e3cc, 0xe6d6b8, 0xdedad0]), 'flat');
      addProp(h, rand(56, 76), 0.4, z, 1, SPAN);
    });
    near(8, (z) => { const c = boxM(rand(8, 12), rand(5, 9), rand(14, 22), pick([0xa0532f, 0x8e4a2c])); addProp(c, rand(44, 50), c.scale.y / 2 - 1, z, 1, SPAN); });
    near(5, (z) => addProp(buildPalm(rand(5, 8)), rand(52, 60), 0.4, z, 1, SPAN));
    addProp(buildMamelles(true), 170, 0, -300, 0.06, 900);
  } else if (spot.id === 'virage') {
    // plage animée : parasols, cabanes, skyline d'immeubles, surfeurs à l'eau
    near(16, (z) => {
      const g = new THREE.Group();
      const pole = mesh(GEO.cyl6, 0xdddddd); pole.scale.set(0.06, 2.4, 0.06); pole.position.y = 1.2; g.add(pole);
      const top = mesh(GEO.cone8, pick([0xf07a1a, 0xFDEF42, 0xE31B23, 0xf5a623])); top.scale.set(1.5, 0.6, 1.5); top.position.y = 2.5; g.add(top);
      addProp(g, rand(32, 36), 0.3, z, 1, SPAN);
    });
    near(9, (z) => addProp(buildHouse(rand(3, 4.5), rand(2.4, 3.2), rand(3, 4.5), pick([0xc49a6c, 0xf2e3c6, 0x00853F, 0x0072BC]), 'slope'), rand(42, 48), 0.3, z, 1, SPAN));
    near(6, (z) => { const p = buildPirogue(); p.rotation.y = Math.PI / 2 + rand(-0.3, 0.3); addProp(p, rand(28, 31), 0.3, z, 1, SPAN); });
    near(1, () => { const road = boxM(8, 0.12, SPAN * 3, 0x55565a); addProp(road, 56, 0.52, -300, 0, 0); });
    near(16, (z) => {
      const glass = Math.random() < 0.45;
      const t = buildTower(rand(8, 13), rand(22, 42), rand(9, 14), glass ? pick([0xeef3f6, 0xcfe0ea]) : pick([0xd9773f, 0xc8642e, 0xe39a5a, 0xb85a33]), glass);
      addProp(t, rand(64, 90), 0.4, z, 0.8, SPAN);
    });
    near(10, (z) => addProp(buildNpcSurfer(), rand(15, 24), -0.05, z, 1, SPAN, true));
  } else if (spot.id === 'ngor') {
    // pointe de latérite rouge, dalles volcaniques sombres, herbe, banc ; village coloré en retrait
    near(12, (z) => { const c = boxM(rand(8, 14), rand(2.5, 4.5), rand(12, 20), pick([0x9a4a2a, 0xa65530, 0x8a3f22])); c.rotation.y = rand(-0.2, 0.2); addProp(c, rand(36, 44), c.scale.y / 2 - 0.4, z, 1, SPAN); });
    near(22, (z) => { const r = mesh(GEO.dodec, pick([0x221e1c, 0x2e2824])); r.scale.set(rand(2, 4), rand(0.4, 0.8), rand(2, 4)); r.rotation.y = rand(0, 3); addProp(r, rand(25, 33), 0.1, z, 1, SPAN); });
    near(10, (z) => { const gr = boxM(rand(5, 9), 0.3, rand(6, 10), 0x6d9a3a); addProp(gr, rand(42, 50), 4.2, z, 1, SPAN); });
    near(3, (z) => {
      const g = new THREE.Group();
      const blk = boxM(7, 3.8, 9, 0x9a4a2a); blk.position.y = 1.5; g.add(blk);
      const grass = boxM(5, 0.25, 7, 0x6d9a3a); grass.position.set(1, 3.5, 0); g.add(grass);
      const b = buildBench(); b.position.set(-1.8, 3.4, 0); g.add(b);
      addProp(g, 37, 0, z + 6, 1, SPAN);
    });
    near(10, (z) => addProp(buildHouse(rand(3.5, 6), rand(3, 6), rand(3.5, 6), pick([0xE31B23, 0xFDEF42, 0x0072BC, 0xf08a4b, 0xf2a7c0, 0x00853F, 0xffffff]), Math.random() < 0.2 ? 'dome' : 'flat'), rand(56, 72), 0.4, z, 1, SPAN));
    near(10, (z) => addProp(buildPalm(rand(5, 9)), rand(50, 70), 0.4, z, 1, SPAN));
    boatsAtSea(3);
  } else if (spot.id === 'sauzaie') {
    // dalle rocheuse sombre au pic, petite falaise basse, corniche avec maisons, poste de secours et parking
    near(30, (z) => { const r = mesh(GEO.dodec, pick([0x3b3631, 0x4a433b, 0x2f2b27])); r.scale.set(rand(2, 4.5), rand(0.35, 0.9), rand(2, 4)); r.rotation.y = rand(0, 3); addProp(r, rand(14, 34), 0.05, z, 1, SPAN); });
    near(14, (z) => { const c = boxM(rand(6, 10), rand(2.5, 4), rand(12, 20), pick([0x5a5148, 0x655b4f, 0x4f473f])); c.rotation.y = rand(-0.15, 0.15); addProp(c, rand(38, 44), c.scale.y / 2 - 0.3, z, 1, SPAN); });
    near(10, (z) => { const gr = boxM(rand(6, 9), 0.3, rand(10, 16), pick([0x7d8a4a, 0x6f7d42])); addProp(gr, rand(40, 45), 3.6, z, 1, SPAN); });
    near(1, () => { const road = boxM(7, 0.12, SPAN * 3, 0x5a5b5e); addProp(road, 52, 3.7, -300, 0, 0); });
    near(10, (z) => addProp(buildCar(), rand(49, 55), 3.7, z, 1, SPAN));
    near(12, (z) => addProp(buildFrHouse(rand(6, 9), rand(3.5, 5), rand(7, 11), pick([0xc8643a, 0xb85a33, 0xd0703f])), rand(60, 76), 3.7, z, 1, SPAN));
    near(2, (z) => addProp(buildLifeguard(), 42, 3.7, z, 1, SPAN));
    near(6, (z) => addProp(buildPine(rand(6, 9)), rand(80, 92), 3.7, z, 1, SPAN));
    near(8, (z) => addProp(buildNpcSurfer(), rand(10, 20), -0.05, z, 1, SPAN, true));
  } else if (spot.id === 'portbara') {
    // crique de sable encaissée entre de hautes falaises de granite déchiquetées, lande rase, hameau au loin
    near(26, (z) => { const r = buildRock(pick([0x6f675c, 0x5e574d, 0x7a7062])); r.scale.setScalar(rand(1.2, 2.8)); addProp(r, rand(16, 34), 0, z, 1, SPAN); });
    near(20, (z) => {
      const h = rand(7, 15);
      const c = boxM(rand(7, 12), h, rand(9, 16), pick([0x857a68, 0x968a72, 0x7a7060, 0x8e8270]));
      c.rotation.set(rand(-0.08, 0.08), rand(-0.4, 0.4), rand(-0.12, 0.12));
      addProp(c, rand(36, 52), h / 2 - 0.5, z, 1, SPAN);
      const top = boxM(c.scale.x * 1.02, 0.4, c.scale.z * 1.02, pick([0x7f7a42, 0x8a6f4a, 0x6f7a3c])); top.rotation.y = c.rotation.y;
      addProp(top, c.position.x, h - 0.3, z, 1, SPAN);
    });
    near(10, (z) => { const g = boxM(rand(10, 18), 0.6, rand(14, 22), pick([0x7f7a42, 0x8a7a4a, 0x6f7a3c])); addProp(g, rand(56, 80), 12.5, z, 1, SPAN); });
    near(6, (z) => addProp(buildFrHouse(rand(6, 8), rand(3, 4), rand(7, 10), 0x3d4650), rand(66, 84), 12.8, z, 1, SPAN));
    near(4, (z) => addProp(buildNpcSurfer(), rand(12, 20), -0.05, z, 1, SPAN, true));
  } else if (spot.id === 'budbud') {
    // plage rectiligne à perte de vue, dunes à oyats, grande forêt de pins maritimes, école de surf
    near(14, (z) => addProp(buildDune(rand(6, 10), rand(3, 5.5), rand(10, 16), pick([0xe3cf9e, 0xdcc794, 0xe8d6a8])), rand(36, 44), 0.2, z, 1, SPAN));
    near(60, (z) => addProp(buildPine(rand(8, 13)), rand(47, 95), 0.3, z, 1, SPAN));
    near(2, (z) => addProp(buildSurfSchool(), 33, 0.3, z, 1, SPAN));
    near(14, (z) => addProp(buildNpcSurfer(), rand(10, 24), -0.05, z, 1, SPAN, true));
  } else if (spot.id === 'lizay') {
    // grande plage claire, les plus hautes dunes de l'île, rochers à la pointe, phare des Baleines au loin
    near(22, (z) => { const r = buildRock(pick([0x4a463f, 0x57524a])); r.scale.setScalar(rand(1, 2.2)); addProp(r, rand(14, 30), 0, z, 1, SPAN); });
    near(16, (z) => addProp(buildDune(rand(9, 14), rand(6, 10), rand(12, 20), pick([0xeadcb8, 0xe2d2a8, 0xefe2c2])), rand(38, 52), 0.2, z, 1, SPAN));
    near(14, (z) => addProp(buildPine(rand(7, 11)), rand(62, 90), 0.3, z, 1, SPAN));
    near(2, (z) => { const h = boxM(5, 3, 7, 0x9b7650); h.position.y = 1.5; const g = new THREE.Group(); g.add(h); const r = boxM(5.6, 0.3, 7.6, 0x5a4a3a); r.position.y = 3.15; g.add(r); addProp(g, 56, 0.3, z, 1, SPAN); });
    addProp(buildBaleines(), 150, 0, -330, 0.06, 900);
    near(5, (z) => addProp(buildNpcSurfer(), rand(12, 20), -0.05, z, 1, SPAN, true));
  }
  // nuages
  const nClouds = spot.clouds || 8;
  for (let i = 0; i < nClouds; i++) {
    const c = new THREE.Group();
    for (let k = 0; k < 4; k++) {
      const p = new THREE.Mesh(GEO.ico1, mat(0xffffff, { transparent: true, opacity: 0.92 }));
      p.scale.set(rand(6, 11), rand(3, 5), rand(6, 10)); p.position.set(k * 8 - 12, rand(-1, 2), rand(-3, 3));
      c.add(p);
    }
    addProp(c, rand(-200, 220), rand(55, 85), rand(-420, -60), 0.04, 600);
  }
}

function updateProps(dt, speed) {
  for (const pr of props) {
    if (!pr.f) continue;
    pr.obj.position.z += speed * pr.f * dt;
    if (pr.obj.position.z > 60) pr.obj.position.z -= pr.span;
    if (pr.bob) pr.obj.position.y = pr.bob.y + Math.sin(W.t * 1.6 + pr.bob.ph) * 0.18;
  }
}

/* ------------------------------------------------------------------ */
/* Son (WebAudio, activé par défaut) + boucle hip-hop old school                              */
/* ------------------------------------------------------------------ */
const Sound = {
  enabled: (() => { try { return localStorage.getItem(STORAGE_SOUND) !== '0'; } catch (e) { return true; } })(),
  ctx: null, master: null, ambient: null, beatTimer: null,
  /* Les navigateurs exigent un geste de l'utilisateur pour lancer l'audio */
  unlock() {
    if (!this.enabled) return;
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    this.startBeat();
  },
  /* Boom-bap ~90 BPM : kick, caisse claire, charley swingué, basse et accords jazzy */
  startBeat() {
    if (!this.ctx || this.beatTimer) return;
    const ctx = this.ctx;
    this.music = ctx.createGain(); this.music.gain.value = 0.55; this.music.connect(this.master);
    const step = 60 / 90 / 4; // double-croche
    const swing = step * 0.18;
    const KICK = [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0];
    const SNARE = [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1];
    const HAT = [1,0,1,0, 1,0,1,1, 1,0,1,0, 1,0,1,0];
    // 2 mesures : La m7 puis Ré m9 (notes MIDI)
    const BASS = [[45,0],[45,3],[48,6],[45,10],[50,16],[50,19],[53,22],[52,26],[50,28]];
    const CHORDS = [[[57,60,64,67],0],[[57,60,64,67],7],[[62,65,69,72],16],[[60,65,69,74],23]];
    const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
    const out = this.music;
    const kick = (t) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14); g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.35); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4); };
    const snare = (t, v = 0.45) => { const s = ctx.createBufferSource(); s.buffer = this.noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.8; const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.2);
      const o = ctx.createOscillator(), og = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 190; og.gain.setValueAtTime(v * 0.5, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1); o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.12); };
    const hat = (t, v) => { const s = ctx.createBufferSource(); s.buffer = this.noiseBuf; const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.05); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + 0.06); };
    const bass = (t, m) => { const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = mtof(m - 12); f.type = 'lowpass'; f.frequency.value = 320; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.32, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + step * 2.6); o.connect(f); f.connect(g); g.connect(out); o.start(t); o.stop(t + step * 2.8); };
    const keys = (t, notes) => { for (const m of notes) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'triangle'; o.frequency.value = mtof(m); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.015); g.gain.exponentialRampToValueAtTime(0.001, t + step * 5); o.connect(g); g.connect(out); o.start(t); o.stop(t + step * 5.2); } };
    let n = 0, next = ctx.currentTime + 0.1;
    const tick = () => {
      while (next < ctx.currentTime + 0.25) {
        const i = n % 16, bar = n % 32;
        const t = next + (i % 2 ? swing : 0);
        if (KICK[i]) kick(t);
        if (SNARE[i]) snare(t, i === 15 ? 0.15 : 0.45);
        if (HAT[i]) hat(t, i % 4 === 0 ? 0.12 : 0.06);
        for (const [m, at] of BASS) if (at === bar) bass(t, m);
        for (const [c, at] of CHORDS) if (at === bar) keys(t, c);
        n++; next += step;
      }
    };
    tick();
    this.beatTimer = setInterval(tick, 60);
  },
  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    // bruit de vagues
    const len = this.ctx.sampleRate * 2;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    const src = this.ctx.createBufferSource(); src.buffer = buf; src.loop = true;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500;
    const g = this.ctx.createGain(); g.gain.value = 0.08;
    const lfo = this.ctx.createOscillator(); lfo.frequency.value = 0.15;
    const lfoG = this.ctx.createGain(); lfoG.gain.value = 0.06;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(); lfo.start();
  },
  toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) this.unlock();
    else if (this.ctx) this.ctx.suspend();
    try { localStorage.setItem(STORAGE_SOUND, this.enabled ? '1' : '0'); } catch (e) { /* ignore */ }
    return this.enabled;
  },
  tone(freq, dur, type = 'sine', vol = 0.25, slide = 0) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, freq, vol = 0.3) {
    if (!this.enabled || !this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = this.noiseBuf;
    const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t); f.frequency.exponentialRampToValueAtTime(freq * 2.5, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + 0.02);
  },
  collect() { this.tone(660, 0.12, 'triangle', 0.2, 400); },
  trick() { this.noise(0.35, 700, 0.35); this.tone(440, 0.25, 'square', 0.06, 440); },
  wipe() { this.noise(0.6, 180, 0.5); this.tone(160, 0.4, 'sawtooth', 0.08, -100); },
  jump() { this.noise(0.2, 1200, 0.2); },
  tick() { this.tone(880, 0.08, 'sine', 0.15); },
  end() { this.tone(523, 0.18, 'triangle', 0.2); setTimeout(() => this.tone(784, 0.3, 'triangle', 0.2), 160); },
};

/* ------------------------------------------------------------------ */
/* État du jeu                                                         */
/* ------------------------------------------------------------------ */
const S = {
  mode: 'loading',
  spot: SPOTS[0], char: CHARACTERS[0],
  speed: 12, time: GAME_DURATION, elapsed: 0,
  x: 2, vx: 0, h: 0, vy: 0, air: false, onLip: false,
  steer: 0, touchTarget: null,
  score: 0, trickPts: 0, cleanPts: 0, count: 0, kg: 0, collected: {},
  chain: 0, comboT: 0, mult: 1, bestMult: 1,
  clean: 0, cleanBonusDone: false,
  wipe: 0, invuln: 0,
  trick: null, trickT: 0, lastTrick: null,
  items: [], obstacles: [], rings: [],
  nextTrash: 0, nextObst: 0, nextHotspot: 0,
  factIdx: {}, lastFactAt: -99, waterFactI: 0,
  menuT: 0,
};

let best = {};
try { best = JSON.parse(localStorage.getItem(STORAGE_BEST) || '{}') || {}; } catch (e) { best = {}; }
function saveBest() { try { localStorage.setItem(STORAGE_BEST, JSON.stringify(best)); } catch (e) { /* ignore */ } }

function applySpot(spot) {
  S.spot = spot;
  W.H = spot.waveH;
  setSky(spot);
  buildScenery(spot);
  waterClean = spot.startClean;
}

function clearEntities() {
  for (const it of S.items) scene.remove(it.obj);
  for (const o of S.obstacles) scene.remove(o.obj);
  for (const r of S.rings) scene.remove(r.obj);
  S.items = []; S.obstacles = []; S.rings = [];
}

function resetRun() {
  clearEntities();
  Object.assign(S, {
    speed: S.spot.speed, time: GAME_DURATION, elapsed: 0,
    x: 2, vx: 0, h: 0, vy: 0, air: false, onLip: false, steer: 0, touchTarget: null,
    score: 0, trickPts: 0, cleanPts: 0, count: 0, kg: 0, collected: {},
    chain: 0, comboT: 0, mult: 1, bestMult: 1,
    clean: S.spot.startClean, cleanBonusDone: false,
    wipe: 0, invuln: 0, trick: null, trickT: 0, lastTrick: null,
    lastFactAt: -99, lastLaunch: -99,
  });
  keys.left = keys.right = false;
  waterClean = S.clean;
  W.travel = 0; W.close = 0; W.collapse = 0; W.H = S.spot.waveH;
  S.x = INTRO_X0;
  S.nextTrash = 0; S.nextObst = 40; S.nextHotspot = 55;
  // pré-remplissage devant le surfeur
  for (let z = -30; z > -170; z -= 100 / S.spot.trashPer100) spawnTrash(z);
  for (let z = -70; z > -170; z -= 100 / S.spot.obstPer100) spawnObstacle(z);
  S.nextTrash = gap(S.spot.trashPer100);
  S.nextObst = gap(S.spot.obstPer100);
  updateHud(true);
}

const SPAWN_Z = -175;
function gap(per100) { return (100 / per100) * rand(0.6, 1.4); }

function weightedType(mix) {
  let total = 0;
  for (const k in mix) total += mix[k];
  let r = Math.random() * total;
  for (const k in mix) { r -= mix[k]; if (r <= 0) return k; }
  return 'bouteille';
}

function blockedByObstacle(x, z) {
  for (const o of S.obstacles) {
    if (Math.abs(o.p + W.travel - z) < 7 && Math.abs(o.x - x) < 3) return true;
  }
  return false;
}

function spawnTrash(z, x, type) {
  type = type || weightedType(S.spot.trashMix);
  if (x === undefined) x = Math.random() < 0.25 ? rand(XL + 0.4, LIP_ZONE) : rand(XL + 1.5, XT + 5);
  if (blockedByObstacle(x, z)) return null;
  const obj = buildTrash(type);
  obj.rotation.y = rand(0, Math.PI * 2);
  scene.add(obj);
  const it = { obj, type, x, p: z - W.travel, spin: rand(-1.2, 1.2), bob: rand(0, 6) };
  S.items.push(it);
  return it;
}

function spawnHotspot() {
  const cx = rand(XL + 3, XT + 2);
  const z = SPAWN_Z;
  const n = 6 + Math.floor(Math.random() * 3);
  const type = weightedType(S.spot.trashMix);
  for (let i = 0; i < n; i++) spawnTrash(z + rand(-7, 7), clamp(cx + rand(-2.4, 2.4), X_MIN + 0.2, X_MAX - 0.5), Math.random() < 0.6 ? type : undefined);
  if (S.char.perk === 'cooler') {
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.6, 4.4, 28), new THREE.MeshBasicMaterial({ color: 0xFDEF42, transparent: true, opacity: 0.7, depthWrite: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2;
    ring.scale.set(1, 2.2, 1);
    scene.add(ring);
    S.rings.push({ obj: ring, x: cx, p: z - W.travel });
    showFact(t('ui.hotspot'), t('ui.hotspotKicker'));
  }
}

function spawnObstacle(z) {
  const type = S.spot.obstacle;
  let obj, x, rad, top, halfZ;
  if (type === 'rock') {
    obj = buildRock(S.spot.rockColor);
    x = rand(XL + 2, XT + 4);
    rad = obj.userData.r * 0.9; top = obj.userData.r * 0.9; halfZ = rad;
  } else if (type === 'surfer') {
    obj = buildNpcSurfer();
    x = rand(XT - 4, XT + 5);
    rad = 0.8; top = 1.1; halfZ = 1.3;
  } else {
    obj = buildPirogue();
    x = rand(XT - 4, XT + 6);
    obj.rotation.y = rand(-0.25, 0.25);
    rad = 0.9; top = 1.0; halfZ = 3.4;
  }
  scene.add(obj);
  S.obstacles.push({ obj, type, x, p: z - W.travel, rad, top, halfZ, passed: false });
}


/* ------------------------------------------------------------------ */
/* Deuxième surfeur (duo même écran) ou fantôme du pote (duo en ligne)  */
/* ------------------------------------------------------------------ */
const Z2 = -2.6;
const P2 = {
  on: false, remote: false, ch: null, model: null, tx: null,
  x: 3, vx: 0, h: 0, vy: 0, air: false, onLip: false, wipe: 0, invuln: 0,
  trick: null, trickT: 0, lastTrick: null, lastLaunch: -99,
  score: 0, count: 0, chain: 0, comboT: 0, mult: 1, bestMult: 1,
  keys: { left: false, right: false }, touchTarget: null, kicked: false,
};
function setP2(ch) {
  if (P2.model) scene.remove(P2.model);
  P2.ch = ch;
  P2.model = ch ? buildSurfer(ch) : null;
  if (P2.model) { P2.model.visible = false; scene.add(P2.model); }
}
function resetP2() {
  Object.assign(P2, {
    x: INTRO_X0 + 1.2, tx: null, vx: 0, h: 0, vy: 0, air: false, onLip: false, wipe: 0, invuln: 0,
    trick: null, trickT: 0, lastTrick: null, lastLaunch: -99,
    score: 0, count: 0, chain: 0, comboT: 0, mult: 1, bestMult: 1, touchTarget: null, kicked: false,
  });
  P2.keys.left = P2.keys.right = false;
}
function p2Jump(boost) {
  if (!P2.on || P2.air || P2.wipe > 0) return;
  P2.air = true;
  P2.vy = (boost || (P2.onLip ? 10.5 : 8)) * (P2.ch.perk === 'air' ? 1.18 : 1);
  Sound.jump();
  emitSpray(P2.x, surfaceY(P2.x, Z2), Z2, 14, 1.1);
}
function p2Chain() {
  P2.chain++;
  P2.comboT = P2.ch.perk === 'combo' ? 5 : 3;
  P2.mult = Math.min(5, 1 + Math.floor(P2.chain / 3) * 0.5);
  if (P2.mult > P2.bestMult) P2.bestMult = P2.mult;
}
function p2Trick(id) {
  if (!P2.on || P2.wipe > 0 || P2.trick) return;
  let valid = P2.air || P2.onLip;
  if (id === 'aerial' && !P2.air) { if (P2.onLip) { p2Jump(11.5); valid = true; } else valid = false; }
  P2.trick = id; P2.trickT = 0;
  if (!valid) return;
  Sound.trick();
  let pts = TRICKS[id].pts * P2.mult;
  if (P2.ch.perk === 'tricks') pts *= 1.25;
  if (P2.lastTrick === id) pts *= 0.5;
  pts = Math.round(pts / 5) * 5;
  P2.lastTrick = id;
  P2.score += pts;
  p2Chain();
  floatText2('+' + fmt(pts), false);
  emitSpray(P2.x, surfaceY(P2.x, Z2) + P2.h, Z2, 18, 1.4);
}
function p2Collect(it) {
  const pts = Math.round((TRASH[it.type].pts * P2.mult) / 5) * 5;
  P2.score += pts; P2.count++;
  p2Chain();
  Sound.collect();
  floatText2('+' + fmt(pts), true);
}
function p2Wipe() {
  P2.wipe = 2; P2.invuln = 3.2;
  P2.chain = 0; P2.comboT = 0; P2.mult = 1;
  P2.air = false; P2.h = 0; P2.vy = 0; P2.trick = null; P2.touchTarget = null;
  Sound.wipe();
  emitSpray(P2.x, surfaceY(P2.x, Z2) + 0.5, Z2, 40, 1.6);
}
function updateP2(dt) {
  if (P2.comboT > 0) { P2.comboT -= dt; if (P2.comboT <= 0) { P2.chain = 0; P2.mult = 1; P2.lastTrick = null; } }
  if (P2.invuln > 0) P2.invuln -= dt;
  if (P2.wipe > 0) { P2.wipe -= dt; P2.vx *= 0.9; }
  else if (P2.touchTarget !== null) P2.vx = clamp((P2.touchTarget - P2.x) * 9, -14, 14);
  else {
    const steer = ((P2.keys.left ? -1 : 0) + (P2.keys.right ? 1 : 0)) * MIR();
    P2.vx = lerp(P2.vx, steer * 11, Math.min(1, dt * (steer ? 6 : 3)));
  }
  if (!P2.air && P2.wipe <= 0 && P2.x < XT) P2.vx += 2.2 * dt * (P2.touchTarget === null ? 1 : 0.3);
  P2.x += P2.vx * dt;
  if (P2.x < X_MIN) {
    if (!P2.air && P2.vx < -9.5 && P2.wipe <= 0 && S.elapsed - P2.lastLaunch > 1.2) { P2.lastLaunch = S.elapsed; p2Jump(9.5); }
    P2.x = X_MIN; if (P2.vx < 0) P2.vx = 0;
  }
  if (P2.x > X_MAX) { P2.x = X_MAX; if (P2.vx > 0) P2.vx = 0; }
  P2.onLip = !P2.air && P2.x < LIP_ZONE && P2.wipe <= 0;
  if (P2.air) {
    P2.vy -= 21 * dt; P2.h += P2.vy * dt;
    if (P2.h <= 0) { P2.h = 0; P2.air = false; P2.vy = 0; emitSpray(P2.x, surfaceY(P2.x, Z2), Z2, 16, 1); }
  }
  if (P2.trick) {
    P2.trickT += dt;
    if (P2.trickT >= TRICKS[P2.trick].dur || (!P2.air && P2.trickT > 0.2 && P2.trick !== 'cutback' && !P2.onLip)) P2.trick = null;
  }
  const surfY = surfaceY(P2.x, Z2);
  if (!P2.air && P2.wipe <= 0 && Math.abs(P2.vx) > 5 && Math.random() < 0.6) emitSpray(P2.x + (P2.vx > 0 ? -0.3 : 0.3), surfY, Z2 + 0.6, 2, 0.8);
}
function updateP2Pose(dt) {
  const m = P2.model;
  if (!m) return;
  const show = P2.on && ['countdown', 'intro', 'play', 'closeout', 'over', 'paused'].includes(S.mode);
  m.visible = show;
  if (!show) return;
  if (P2.remote && P2.tx !== null) P2.x = lerp(P2.x, P2.tx, Math.min(1, dt * 10));
  if (P2.remote && P2.trick) P2.trickT += dt;
  const u = m.userData;
  const x = P2.x;
  const surfY = surfaceY(x, Z2);
  m.position.set(x, surfY + P2.h, Z2);
  const slopeC = clamp(Math.atan(slopeAt(x, Z2)), -0.85, 0.85);
  u.tilt.rotation.z = lerp(u.tilt.rotation.z, P2.air ? slopeC * 0.3 : slopeC, Math.min(1, dt * 8));
  let yawT = clamp(-P2.vx * 0.045, -0.5, 0.5);
  let spin = 0, roll = 0;
  if (P2.trick && TRICKS[P2.trick]) {
    const k = clamp(P2.trickT / TRICKS[P2.trick].dur, 0, 1);
    if (P2.trick === 'spin') spin = k * Math.PI * 2;
    if (P2.trick === 'cutback') yawT += Math.sin(k * Math.PI) * 1.4;
    if (P2.trick === 'aerial') roll = Math.sin(k * Math.PI) * 0.9;
  }
  u.baseYaw = lerp(u.baseYaw || 0, yawT, Math.min(1, dt * 7));
  u.yaw.rotation.y = u.baseYaw + spin;
  u.boardG.rotation.x = roll; u.rider.rotation.x = roll;
  u.rider.position.y = 0.1 + Math.sin(W.t * 3.2 + 1) * 0.03 - (P2.air ? 0.08 : 0);
  u.torso.rotation.z = 0.25 + clamp(-P2.vx * 0.02, -0.25, 0.25);
  u.arms[0].rotation.x = 0.1 + Math.sin(W.t * 2 + 1) * 0.08 + (P2.air ? 0.55 : 0);
  u.arms[1].rotation.x = -0.1 - Math.sin(W.t * 2.3 + 1) * 0.08 - (P2.air ? 0.55 : 0);
  if (P2.wipe > 0) {
    const k = clamp((2 - P2.wipe) / 0.35, 0, 1);
    u.rider.rotation.z = lerp(0, 1.45, k);
    u.rider.position.y = 0.1 - k * 0.6;
  } else u.rider.rotation.z = lerp(u.rider.rotation.z, 0, Math.min(1, dt * 8));
}
function floatText2(text, isTrash) {
  projV.set(P2.x, surfaceY(P2.x, Z2) + P2.h + 2.2, Z2).project(camera);
  const el = document.createElement('span');
  el.className = 'float-pts is-p2' + (isTrash ? ' is-trash' : '');
  el.textContent = text;
  el.style.left = ((projV.x * MIR() * 0.5 + 0.5) * window.innerWidth + rand(-20, 20)) + 'px';
  el.style.top = ((-projV.y * 0.5 + 0.5) * window.innerHeight) + 'px';
  ui.floatLayer.appendChild(el);
  setTimeout(() => el.remove(), 850);
}
const isDuo = () => S.gameMode === 'local' || S.gameMode === 'online';

/* ------------------------------------------------------------------ */
/* Entrées                                                             */
/* ------------------------------------------------------------------ */
const keys = { left: false, right: false };

window.addEventListener('keydown', (e) => {
  const k = e.code;
  if (S.mode === 'play' || S.mode === 'countdown') {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(k)) e.preventDefault();
  }
  if (S.mode === 'intro' || S.mode === 'closeout') {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space'].includes(k)) e.preventDefault();
  }
  if (S.mode === 'intro' && ['Space', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'KeyA', 'KeyD'].includes(k)) {
    finishIntro();
    if (k === 'Space' || k === 'Enter') return;
  }
  if (S.mode === 'play' && S.gameMode === 'local') {
    if (k === 'KeyA' || k === 'KeyQ') keys.left = true;
    else if (k === 'KeyD') keys.right = true;
    else if (!e.repeat && (k === 'KeyW' || k === 'KeyZ' || k === 'Space')) jump();
    else if (!e.repeat && k === 'Digit1') doTrick('cutback');
    else if (!e.repeat && k === 'Digit2') doTrick('aerial');
    else if (!e.repeat && k === 'Digit3') doTrick('spin');
    else if (k === 'ArrowLeft') P2.keys.left = true;
    else if (k === 'ArrowRight') P2.keys.right = true;
    else if (!e.repeat && (k === 'ArrowUp' || k === 'Enter' || k === 'NumpadEnter')) p2Jump();
    else if (!e.repeat && (k === 'KeyJ' || k === 'Numpad1')) p2Trick('cutback');
    else if (!e.repeat && (k === 'KeyK' || k === 'Numpad2')) p2Trick('aerial');
    else if (!e.repeat && (k === 'KeyL' || k === 'Numpad3')) p2Trick('spin');
    else if (k === 'Escape' || k === 'KeyP') pauseGame();
  } else if (S.mode === 'play') {
    if (k === 'ArrowLeft' || k === 'KeyA' || k === 'KeyQ') keys.left = true;
    else if (k === 'ArrowRight' || k === 'KeyD') keys.right = true;
    else if (!e.repeat && (k === 'Space' || k === 'ArrowUp' || k === 'KeyW' || k === 'KeyZ')) jump();
    else if (!e.repeat && (k === 'Digit1' || k === 'Numpad1')) doTrick('cutback');
    else if (!e.repeat && (k === 'Digit2' || k === 'Numpad2')) doTrick('aerial');
    else if (!e.repeat && (k === 'Digit3' || k === 'Numpad3')) doTrick('spin');
    else if (k === 'Escape' || k === 'KeyP') pauseGame();
  } else if (S.mode === 'paused' && (k === 'Escape' || k === 'KeyP')) {
    resumeGame();
  }
});
window.addEventListener('keyup', (e) => {
  const k = e.code;
  if (S.gameMode === 'local') {
    if (k === 'ArrowLeft') { P2.keys.left = false; return; }
    if (k === 'ArrowRight') { P2.keys.right = false; return; }
  }
  if (k === 'ArrowLeft' || k === 'KeyA' || k === 'KeyQ') keys.left = false;
  else if (k === 'ArrowRight' || k === 'KeyD') keys.right = false;
});
window.addEventListener('blur', () => { keys.left = keys.right = false; P2.keys.left = P2.keys.right = false; });

const touch = { id: null, sx: 0, sy: 0, sxSurfer: 0, ly: 0, lt: 0, jumped: false, upStartY: 0 };
const duoT = new Map();
function duoDown(e) {
  const p = e.clientX < window.innerWidth / 2 ? 1 : 2;
  const R = p === 1 ? S : P2;
  duoT.set(e.pointerId, { p, sx: e.clientX, sy: e.clientY, sxS: R.x, ly: e.clientY, lt: performance.now(), upY: e.clientY, moved: false, jumped: false, t0: performance.now() });
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  hideHint();
}
function duoMove(e) {
  const d = duoT.get(e.pointerId);
  if (!d) return;
  const R = d.p === 1 ? S : P2;
  const w = Math.max(160, window.innerWidth / 2);
  const dx = (e.clientX - d.sx) * MIR();
  if (Math.abs(dx) > 10 || Math.abs(e.clientY - d.sy) > 10) d.moved = true;
  if (d.moved) R.touchTarget = clamp(d.sxS + dx * ((X_MAX - X_MIN) / (w * 0.8)), X_MIN, X_MAX);
  const now = performance.now();
  const dy = e.clientY - d.ly, dtt = Math.max(1, now - d.lt);
  if (dy > 2) d.upY = e.clientY;
  if (!d.jumped && (d.upY - e.clientY) > 40 && dy / dtt < -0.35) { d.jumped = true; if (d.p === 1) jump(); else p2Jump(); }
  d.ly = e.clientY; d.lt = now;
}
function duoUp(e) {
  const d = duoT.get(e.pointerId);
  if (!d) return;
  duoT.delete(e.pointerId);
  const R = d.p === 1 ? S : P2;
  R.touchTarget = null;
  if (!d.moved && performance.now() - d.t0 < 280) { // tap = figure
    const id = R.air ? 'spin' : (R.onLip ? 'aerial' : 'cutback');
    if (d.p === 1) doTrick(id); else p2Trick(id);
  }
}
canvas.addEventListener('pointerdown', (e) => {
  if (S.mode === 'intro') finishIntro(); // un tap passe le take-off
  if (S.mode !== 'play') return;
  if (S.gameMode === 'local') { e.preventDefault(); duoDown(e); return; }
  e.preventDefault();
  touch.id = e.pointerId;
  touch.sx = e.clientX; touch.sy = e.clientY;
  touch.sxSurfer = S.x;
  touch.ly = e.clientY; touch.lt = performance.now(); touch.upStartY = e.clientY;
  touch.jumped = false;
  S.touchTarget = S.x;
  try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
  hideHint();
});
canvas.addEventListener('pointermove', (e) => {
  if (S.gameMode === 'local') { if (S.mode === 'play') duoMove(e); return; }
  if (e.pointerId !== touch.id || S.mode !== 'play') return;
  const w = Math.max(320, window.innerWidth);
  const dx = (e.clientX - touch.sx) * MIR();
  S.touchTarget = clamp(touch.sxSurfer + dx * ((X_MAX - X_MIN) / (w * 0.7)), X_MIN, X_MAX);
  // swipe vers le haut = saut
  const now = performance.now();
  const dy = e.clientY - touch.ly;
  const dt = Math.max(1, now - touch.lt);
  if (dy > 2) touch.upStartY = e.clientY; // on redescend : on réinitialise
  if (!touch.jumped && (touch.upStartY - e.clientY) > 40 && dy / dt < -0.35) {
    touch.jumped = true;
    jump();
  }
  touch.ly = e.clientY; touch.lt = now;
});
function endTouch(e) {
  if (S.gameMode === 'local') { duoUp(e); return; }
  if (e.pointerId !== touch.id) return;
  touch.id = null;
  S.touchTarget = null;
}
canvas.addEventListener('pointerup', endTouch);
canvas.addEventListener('pointercancel', endTouch);
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

function bindHold(btn, fn) {
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    btn.classList.add('is-pressed');
    fn();
  });
  const up = () => btn.classList.remove('is-pressed');
  btn.addEventListener('pointerup', up);
  btn.addEventListener('pointerleave', up);
  btn.addEventListener('pointercancel', up);
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); fn(); } });
}
bindHold($('#btn-jump'), () => { if (S.mode === 'play') jump(); });
for (const b of $$('.ctl-trick')) bindHold(b, () => { if (S.mode === 'play') doTrick(b.dataset.trick); });

let hintTimer = 0;
function hideHint() { $('#hint-drag').classList.add('is-hidden'); }

/* ------------------------------------------------------------------ */
/* Gameplay                                                            */
/* ------------------------------------------------------------------ */
function jump(boost) {
  if (S.air || S.wipe > 0) return false;
  S.air = true;
  S.vy = (boost || (S.onLip ? 10.5 : 8)) * (S.char.perk === 'air' ? 1.18 : 1);
  Sound.jump();
  if (surfer) emitSpray(S.x, surfaceY(S.x, 0), 0, 14, 1.1);
  return true;
}

function comboWindow() { return S.char.perk === 'combo' ? 5 : 3; }

function addChain() {
  S.chain++;
  S.comboT = comboWindow();
  S.mult = Math.min(5, 1 + Math.floor(S.chain / 3) * 0.5);
  if (S.mult > S.bestMult) S.bestMult = S.mult;
}

function doTrick(id) {
  if (S.wipe > 0) return;
  if (S.trick) return; // une figure à la fois
  const tr = TRICKS[id];
  let valid = S.air || S.onLip;
  if (id === 'aerial' && !S.air) {
    if (S.onLip) { jump(11.5); valid = true; } else valid = false;
  }
  S.trick = id; S.trickT = 0;
  if (!valid) {
    popTrick(t('ui.tooLow'), t('ui.tooLowSub'), 'is-bad');
    S.trick = id; // l'animation se joue quand même
    return;
  }
  Sound.trick();
  let pts = tr.pts * S.mult;
  if (S.char.perk === 'tricks') pts *= 1.25;
  let label = t('tricks.' + id);
  if (S.lastTrick === id) { pts *= 0.5; label += ' ' + t('ui.bis'); }
  pts = Math.round(pts / 5) * 5;
  S.lastTrick = id;
  S.trickPts += pts; S.score += pts;
  addChain();
  popTrick(label + ' !', '+' + fmt(pts));
  floatText('+' + fmt(pts), false);
  emitSpray(S.x, surfaceY(S.x, 0) + S.h, 0, id === 'cutback' ? 30 : 18, 1.4);
}

function collect(it) {
  const info = TRASH[it.type];
  const pts = Math.round((info.pts * S.mult) / 5) * 5;
  S.cleanPts += pts; S.score += pts;
  S.count++; S.kg += info.kg;
  S.collected[it.type] = (S.collected[it.type] || 0) + 1;
  const inc = (1 / 22) * (S.char.perk === 'cooler' ? 1.45 : 1);
  S.clean = Math.min(1, S.clean + inc);
  addChain();
  Sound.collect();
  floatText('+' + fmt(pts), true);
  if (S.clean >= 1 && !S.cleanBonusDone) {
    S.cleanBonusDone = true;
    S.cleanPts += 1000; S.score += 1000;
    popTrick(t('ui.oceanClean'), '+' + fmt(1000), 'is-good');
  }
  // fait écologique
  if (S.elapsed - S.lastFactAt > 5.5) {
    const facts = L().facts;
    let list = facts[it.type];
    let key = it.type;
    if ((S.count % 3) === 0) { list = facts.water; key = 'water'; }
    const i = S.factIdx[key] || 0;
    S.factIdx[key] = (i + 1) % list.length;
    showFact(list[i % list.length], key === 'water' ? t('ui.waterQuality') : t('trash.' + it.type));
  }
}

function wipeout() {
  S.wipe = 2; S.invuln = 3.2;
  S.chain = 0; S.comboT = 0; S.mult = 1;
  S.air = false; S.h = 0; S.vy = 0; S.trick = null;
  S.touchTarget = null; touch.id = null;
  Sound.wipe();
  popTrick(t('ui.wipeout'), t('ui.comboLost'), 'is-bad');
  emitSpray(S.x, surfaceY(S.x, 0) + 0.5, 0, 40, 1.6);
}

function updateGame(dt) {
  S.elapsed += dt;
  S.time = Math.max(0, GAME_DURATION - S.elapsed);
  const spot = S.spot;
  let target = spot.speed * (1 + spot.speedGain * (S.elapsed / GAME_DURATION));
  if (S.wipe > 0) target *= 0.45;
  S.speed = lerp(S.speed, target, Math.min(1, dt * 1.5));
  W.travel += S.speed * dt;

  // combo
  if (S.comboT > 0) {
    S.comboT -= dt;
    if (S.comboT <= 0) { S.chain = 0; S.mult = 1; S.lastTrick = null; }
  }
  if (S.invuln > 0) S.invuln -= dt;

  // mouvement latéral
  if (S.wipe > 0) {
    S.wipe -= dt;
    S.vx *= 0.9;
  } else if (S.touchTarget !== null) {
    const desired = (S.touchTarget - S.x) * 9;
    S.vx = clamp(desired, -14, 14);
  } else {
    const steer = ((keys.left ? -1 : 0) + (keys.right ? 1 : 0)) * MIR();
    const targetV = steer * 11;
    S.vx = lerp(S.vx, targetV, Math.min(1, dt * (steer ? 6 : 3)));
  }
  // la pente fait légèrement redescendre
  if (!S.air && S.wipe <= 0 && S.x < XT) S.vx += 2.2 * dt * (S.touchTarget === null ? 1 : 0.3);
  S.x += S.vx * dt;
  if (S.x < X_MIN) {
    // lancement depuis la lèvre si on arrive vite
    if (!S.air && S.vx < -9.5 && S.wipe <= 0 && S.elapsed - S.lastLaunch > 1.2) { S.lastLaunch = S.elapsed; jump(9.5); }
    S.x = X_MIN; if (S.vx < 0) S.vx = 0;
  }
  if (S.x > X_MAX) { S.x = X_MAX; if (S.vx > 0) S.vx = 0; }

  S.onLip = !S.air && S.x < LIP_ZONE && S.wipe <= 0;

  // vertical
  if (S.air) {
    S.vy -= 21 * dt;
    S.h += S.vy * dt;
    if (S.h <= 0) {
      S.h = 0; S.air = false; S.vy = 0;
      emitSpray(S.x, surfaceY(S.x, 0), 0, 16, 1);
    }
  }

  // figure en cours
  if (S.trick) {
    S.trickT += dt;
    if (S.trickT >= TRICKS[S.trick].dur || (!S.air && S.trickT > 0.2 && S.trick !== 'cutback' && !S.onLip)) S.trick = null;
  }

  // apparition
  const tr = W.travel;
  if (tr >= S.nextTrash) { spawnTrash(SPAWN_Z); S.nextTrash = tr + gap(spot.trashPer100); }
  if (tr >= S.nextObst) { spawnObstacle(SPAWN_Z); S.nextObst = tr + gap(spot.obstPer100); }
  if (tr >= S.nextHotspot) { spawnHotspot(); S.nextHotspot = tr + rand(120, 170); }

  const surfY = surfaceY(S.x, 0);
  const sY = surfY + S.h;

  // déchets
  const radius = S.char.perk === 'magnet' ? 2.6 : 1.5;
  const p2Live = P2.on && !P2.remote;
  const r2 = p2Live && P2.ch.perk === 'magnet' ? 2.6 : 1.5;
  const sY2 = p2Live ? surfaceY(P2.x, Z2) + P2.h : 0;
  for (let i = S.items.length - 1; i >= 0; i--) {
    const it = S.items[i];
    const z = it.p + W.travel;
    if (S.char.perk === 'magnet' && z > -7 && z < 2 && Math.abs(it.x - S.x) < 5) it.x = lerp(it.x, S.x, Math.min(1, dt * 3));
    const y = surfaceY(it.x, z) + 0.2 + Math.sin(W.t * 2 + it.bob) * 0.1;
    it.obj.position.set(it.x, y, z);
    it.obj.children[1].rotation.y += it.spin * dt;
    if (z > 14) { scene.remove(it.obj); S.items.splice(i, 1); continue; }
    if (S.wipe <= 0 && Math.abs(z) < radius && Math.abs(it.x - S.x) < radius && Math.abs(sY - y) < 2.4) {
      collect(it);
      scene.remove(it.obj); S.items.splice(i, 1);
    } else if (p2Live && P2.wipe <= 0 && Math.abs(z - Z2) < r2 && Math.abs(it.x - P2.x) < r2 && Math.abs(sY2 - y) < 2.4) {
      p2Collect(it);
      scene.remove(it.obj); S.items.splice(i, 1);
    }
  }
  // anneaux zones polluées
  for (let i = S.rings.length - 1; i >= 0; i--) {
    const r = S.rings[i];
    const z = r.p + W.travel;
    r.obj.position.set(r.x, surfaceY(r.x, z) + 0.1, z);
    r.obj.material.opacity = 0.45 + Math.sin(W.t * 6) * 0.25;
    if (z > 20) { scene.remove(r.obj); S.rings.splice(i, 1); }
  }
  // obstacles
  for (let i = S.obstacles.length - 1; i >= 0; i--) {
    const o = S.obstacles[i];
    const z = o.p + W.travel;
    const y = surfaceY(o.x, z);
    o.obj.position.set(o.x, o.type === 'rock' ? y * 0.6 - 0.1 : y - 0.15, z);
    if (o.type === 'pirogue') {
      o.obj.rotation.z = Math.atan(slopeAt(o.x, z)) * 0.8;
      o.obj.rotation.x = Math.sin(W.t * 1.5 + o.p) * 0.05;
    }
    if (z > 20) { scene.remove(o.obj); S.obstacles.splice(i, 1); continue; }
    if (p2Live && !o.passed2 && P2.wipe <= 0 && Math.abs(z - Z2) < o.halfZ + 0.5 && Math.abs(o.x - P2.x) < o.rad + 0.45) {
      if (sY2 > o.obj.position.y + o.top + 0.15) { if (!o.jumped2) { o.jumped2 = true; P2.score += Math.round((50 * P2.mult) / 5) * 5; } }
      else if (P2.invuln <= 0) { o.passed2 = true; p2Wipe(); }
    }
    if (o.passed || S.wipe > 0) continue;
    if (Math.abs(z) < o.halfZ + 0.5 && Math.abs(o.x - S.x) < o.rad + 0.45) {
      const topY = o.obj.position.y + o.top;
      if (sY > topY + 0.15) {
        // saut par-dessus
        if (!o.jumped) {
          o.jumped = true;
          const pts = Math.round((50 * S.mult) / 5) * 5;
          S.trickPts += pts; S.score += pts;
          floatText(t('ui.over') + ' +' + pts, false);
        }
      } else if (S.invuln <= 0) {
        o.passed = true;
        wipeout();
      }
    }
    if (z > o.halfZ + 1) o.passed = true;
  }

  waterClean = lerp(waterClean, S.clean, Math.min(1, dt * 2));

  // spray de carving
  if (!S.air && S.wipe <= 0 && Math.abs(S.vx) > 5 && Math.random() < 0.6) emitSpray(S.x + (S.vx > 0 ? -0.3 : 0.3), surfY, 0.6, 2, 0.8);
  if (S.onLip && Math.random() < 0.4) emitSpray(S.x - 0.5, surfY + 0.2, 0.3, 2, 0.9);

  if (S.time <= 0) endGame();
}

function updateSurferPose(dt, menu) {
  if (!surfer) return;
  const u = surfer.userData;
  const x = S.x;
  const surfY = surfaceY(x, 0);
  surfer.position.set(x, surfY + S.h, 0);
  const slope = Math.atan(slopeAt(x, 0));
  const slopeC = clamp(slope, -0.85, 0.85);
  u.tilt.rotation.z = lerp(u.tilt.rotation.z, S.air ? slopeC * 0.3 : slopeC, Math.min(1, dt * 8));
  u.tilt.rotation.x = lerp(u.tilt.rotation.x, clamp(-S.vx * 0.03, -0.3, 0.3), Math.min(1, dt * 6));
  // direction : le nez de la planche suit la trajectoire
  let yawT = clamp(-S.vx * 0.045, -0.5, 0.5);
  let spin = 0, roll = 0, crouch = 0;
  if (S.trick) {
    const k = clamp(S.trickT / TRICKS[S.trick].dur, 0, 1);
    if (S.trick === 'spin') spin = k * Math.PI * 2;
    if (S.trick === 'cutback') yawT += Math.sin(k * Math.PI) * 1.4;
    if (S.trick === 'aerial') { roll = Math.sin(k * Math.PI) * 0.9; crouch = Math.sin(k * Math.PI) * 0.25; }
  }
  u.baseYaw = lerp(u.baseYaw || 0, yawT, Math.min(1, dt * 7));
  u.yaw.rotation.y = u.baseYaw + spin;
  u.boardG.rotation.x = roll;
  u.rider.rotation.x = roll;
  // corps
  const bob = Math.sin(W.t * 3.2) * 0.03;
  u.rider.position.y = 0.1 + bob - crouch - (S.air ? 0.08 : 0);
  u.torso.rotation.z = 0.25 + clamp(-S.vx * 0.02, -0.25, 0.25);
  u.arms[0].rotation.x = 0.1 + Math.sin(W.t * 2) * 0.08 + (S.air ? 0.55 : 0);
  u.arms[1].rotation.x = -0.1 - Math.sin(W.t * 2.3) * 0.08 - (S.air ? 0.55 : 0);
  // pop-up du take-off : allongé/accroupi puis debout
  if (S.mode === 'intro') {
    const pk = clamp(S.introT / (INTRO_DUR * 0.3), 0, 1);
    u.rider.position.y -= (1 - pk) * 0.55;
    u.torso.rotation.z += (1 - pk) * 0.9;
  }
  // chute
  if (S.wipe > 0) {
    const k = clamp((2 - S.wipe) / 0.35, 0, 1);
    u.rider.rotation.z = lerp(0, 1.45, k);
    u.rider.position.y = 0.1 - k * 0.6;
    u.boardG.rotation.z = Math.sin(W.t * 8) * 0.4 * k;
    surfer.visible = S.wipe > 1.6 || Math.floor(S.wipe * 10) % 2 === 0;
  } else {
    u.rider.rotation.z = lerp(u.rider.rotation.z, 0, Math.min(1, dt * 8));
    u.boardG.rotation.z = 0;
    surfer.visible = menu || S.invuln <= 0 || Math.floor(S.invuln * 12) % 2 === 0 || S.invuln > 3;
  }
  shadowG.position.set(x, surfY + 0.06, 0);
  shadowG.rotation.z = slope;
  shadowBlob.position.y = 0;
  const sc = clamp(1 - S.h * 0.15, 0.4, 1);
  shadowBlob.scale.set(sc, sc * 1.6, sc);
}

/* ------------------------------------------------------------------ */
/* Caméra                                                              */
/* ------------------------------------------------------------------ */
const camPos = new THREE.Vector3(10, 7, 12);
const camLook = new THREE.Vector3(0, 2, -10);
const tmpV = new THREE.Vector3(), tmpL = new THREE.Vector3();
function updateCamera(dt, menu) {
  const portrait = camera.aspect < 0.9;
  const sy = surfaceY(S.x, 0) + S.h;
  const duoCam = !menu && P2.on && !P2.remote;
  const cx = duoCam ? (S.x + P2.x) / 2 : S.x;
  if (menu) {
    const a = S.menuT * 0.12;
    tmpV.set(S.x + 9 + Math.sin(a) * 4, sy + 3.5 + Math.sin(a * 0.7), 9 + Math.cos(a) * 3);
    tmpL.set(S.x - 3, sy + 0.8, -6);
  } else {
    const far = duoCam ? 1.5 + Math.abs(S.x - P2.x) * 0.25 : 0;
    tmpV.set(cx * 0.55 + (portrait ? 7.5 : 9) + far * 0.4, sy * 0.45 + (portrait ? 3.4 : 2.6) + far * 0.3, (portrait ? 10.5 : 9) + far);
    tmpL.set(cx * 0.55 - 3, sy * 0.5 + 1.8, duoCam ? -13 : -12);
  }
  const k = Math.min(1, dt * 4);
  camPos.lerp(tmpV, k);
  camLook.lerp(tmpL, k);
  camera.position.copy(camPos);
  camera.lookAt(camLook);
  sky.position.copy(camera.position);
  sunDisc.position.copy(camera.position).addScaledVector(sunDirV, 520);
  sunDisc.lookAt(camera.position);
  sunLight.position.copy(camera.position).addScaledVector(sunDirV, 100);
  sunLight.target.position.copy(camera.position);
}

/* ------------------------------------------------------------------ */
/* Interface                                                           */
/* ------------------------------------------------------------------ */
const ui = {
  score: $('#hud-score'), timer: $('#hud-timer'), timerBox: $('.hud-timer'), mult: $('#hud-mult'),
  comboBar: $('#hud-combo-bar'), cleanBar: $('#hud-clean-bar'), cleanPct: $('#hud-clean-pct'), cleanBox: $('.hud-clean'),
  state: $('#hud-state'), pop: $('#trick-pop'), fact: $('#fact-toast'), factText: $('#fact-text'), factKicker: $('#fact-toast .fact-kicker'),
  floatLayer: $('#float-layer'), hud: $('#hud'), pauseBtn: $('#btn-pause'), countdown: $('#countdown'),
  score2: $('#hud-score2'), p1Name: $('#hud-p1-name'), p2Name: $('#hud-p2-name'), p2Box: $('.hud-p2'),
};

const last = {};
function setText(el, key, v) { if (last[key] !== v) { last[key] = v; el.textContent = v; } }
function updateHud(force) {
  if (force) for (const k in last) delete last[k];
  setText(ui.score, 'score', fmt(S.score));
  if (P2.on) setText(ui.score2, 'score2', fmt(P2.score));
  const secs = Math.ceil(S.time);
  if (last.t !== String(secs) && S.mode === 'play' && secs <= 5 && secs > 0) Sound.tick();
  setText(ui.timer, 't', String(secs));
  ui.timerBox.classList.toggle('is-low', secs <= 10);
  setText(ui.mult, 'mult', 'x' + (LANG === 'en' ? String(S.mult) : String(S.mult).replace('.', ',')));
  ui.comboBar.style.width = (S.chain > 0 ? (S.comboT / comboWindow()) * 100 : 0).toFixed(1) + '%';
  const pct = Math.round(S.clean * 100);
  ui.cleanBar.style.width = pct + '%';
  setText(ui.cleanPct, 'pct', pct + ' %');
  ui.cleanBox.classList.toggle('is-full', pct >= 100);
  let st = '', cls = '';
  if (S.wipe > 0) st = '';
  else if (S.air) { st = t('ui.inAir'); cls = 'is-air'; }
  else if (S.onLip) st = t('ui.onLip');
  if (last.st !== st) {
    last.st = st;
    ui.state.textContent = st;
    ui.state.classList.toggle('is-on', !!st);
    ui.state.classList.toggle('is-air', cls === 'is-air');
    const ready = !!st;
    for (const b of $$('.ctl-trick')) b.classList.toggle('is-ready', ready);
  }
}

let popTimer = 0;
function popTrick(title, sub, cls) {
  ui.pop.className = 'trick-pop';
  ui.pop.innerHTML = '';
  const tEl = document.createElement('span'); tEl.className = 't'; tEl.textContent = title;
  const p = document.createElement('span'); p.className = 'p'; p.textContent = sub || '';
  ui.pop.append(tEl, p);
  void ui.pop.offsetWidth; // relance l'animation
  ui.pop.classList.add('is-show');
  if (cls) ui.pop.classList.add(cls);
  clearTimeout(popTimer);
  popTimer = setTimeout(() => { ui.pop.className = 'trick-pop'; }, 1150);
}

let factTimer = 0;
function showFact(text, kicker) {
  S.lastFactAt = S.elapsed;
  ui.factText.textContent = text;
  ui.factKicker.textContent = kicker ? t('ui.didYouKnow') + ' · ' + kicker : t('ui.didYouKnow');
  ui.fact.classList.add('is-show');
  clearTimeout(factTimer);
  factTimer = setTimeout(() => ui.fact.classList.remove('is-show'), 5000);
}

const projV = new THREE.Vector3();
function floatText(text, isTrash) {
  if (!surfer) return;
  projV.set(S.x, surfaceY(S.x, 0) + S.h + 2.2, 0).project(camera);
  const el = document.createElement('span');
  el.className = 'float-pts' + (isTrash ? ' is-trash' : '');
  el.textContent = text;
  el.style.left = ((projV.x * MIR() * 0.5 + 0.5) * window.innerWidth + rand(-20, 20)) + 'px';
  el.style.top = ((-projV.y * 0.5 + 0.5) * window.innerHeight) + 'px';
  ui.floatLayer.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

/* ---------------- Écrans ---------------- */
let currentScreen = 'loading';
function showScreen(id) {
  currentScreen = id;
  for (const s of $$('.screen')) s.classList.toggle('is-active', s.id === 'screen-' + id);
  const el = $('#screen-' + id);
  if (el) {
    el.scrollTop = 0;
    const focusable = el.querySelector('.btn-primary');
    if (focusable && !isTouch) setTimeout(() => focusable.focus({ preventScroll: true }), 30);
  }
}

// Vignettes des personnages (rendu hors-écran une seule fois)
function renderThumbs() {
  const thumbs = {};
  let r;
  try {
    const c = document.createElement('canvas');
    r = new THREE.WebGLRenderer({ canvas: c, antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setPixelRatio(1);
    r.setSize(300, 300, false);
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight(0xffffff, 0x445566, 1.4));
    const dl = new THREE.DirectionalLight(0xffffff, 2.2); dl.position.set(-3, 5, 4); sc.add(dl);
    const water = new THREE.Mesh(new THREE.CircleGeometry(1.6, 7), new THREE.MeshLambertMaterial({ color: 0x2fb8c8, flatShading: true }));
    water.rotation.x = -Math.PI / 2; sc.add(water);
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    for (const ch of CHARACTERS) {
      // cadrage buste + visage (taille propre à chaque surfeur)
      const headH = 0.55 + 1.08 * (ch.height || 1);
      cam.position.set(-1.75, headH + 0.1, 1.55); cam.lookAt(0, headH - 0.42, 0);
      const s = buildSurfer(ch);
      s.userData.yaw.rotation.y = 0.75;
      s.userData.arms[0].rotation.x = 0.4; s.userData.arms[1].rotation.x = -0.4;
      sc.add(s);
      r.setClearColor(0x000000, 0);
      r.render(sc, cam);
      thumbs[ch.id] = c.toDataURL('image/png');
      sc.remove(s);
    }
  } catch (e) {
    // pas grave : les cartes restent sans vignette
  } finally {
    if (r) { r.dispose(); r.forceContextLoss(); }
  }
  return thumbs;
}

let thumbCache = null;
function buildCharCards() {
  if (!thumbCache || thumbsDirty) { thumbsDirty = false; thumbCache = renderThumbs(); }
  $('#char-title').textContent = S.pickFor === 2 ? t('ui.chooseP2') : S.gameMode === 'local' ? t('ui.chooseP1') : t('ui.chooseSurfer');
  const thumbs = thumbCache;
  const grid = $('#char-grid');
  grid.innerHTML = '';
  let team = null;
  for (const ch of CHARACTERS) {
    if (ch.team !== team) {
      team = ch.team;
      const h = document.createElement('p');
      h.className = 'team-head team-' + team;
      h.textContent = t(team === 'michel' ? 'ui.teamMichel' : 'ui.teamSba');
      grid.appendChild(h);
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card';
    b.setAttribute('role', 'radio');
    b.dataset.id = ch.id;
    b.innerHTML = `<img class="thumb" alt="" ${thumbs[ch.id] ? `src="${thumbs[ch.id]}"` : ''}>
      <span class="card-body"><img class="photo" alt="" src="${ch.photo}" width="72" height="72"><span class="name"></span><span class="role"></span><span class="perk"></span></span>`;
    b.querySelector('.name').textContent = ch.name;
    b.querySelector('.role').textContent = t(`chars.${ch.id}.role`);
    b.querySelector('.perk').textContent = t(`chars.${ch.id}.perk`);
    b.addEventListener('click', () => selectChar(ch));
    b.addEventListener('dblclick', () => { selectChar(ch); charOk(); });
    grid.appendChild(b);
  }
  selectChar(S.pickFor === 2 ? (S.char2 || CHARACTERS.find((c) => c !== S.char)) : S.char);
}
function selectChar(ch) {
  if (S.pickFor === 2) S.char2 = ch; else S.char = ch;
  for (const c of $$('#char-grid .card')) c.setAttribute('aria-checked', String(c.dataset.id === ch.id));
  const d = $('#char-detail');
  d.innerHTML = '<h3></h3><p class="bio"></p><p class="perk-line"></p>';
  const tx = (k) => t(`chars.${ch.id}.${k}`);
  d.querySelector('h3').textContent = ch.name + ' · ' + tx('role');
  d.querySelector('.bio').textContent = tx('bio');
  d.querySelector('.perk-line').textContent = t('ui.perk') + ' « ' + tx('perk') + ' » : ' + tx('perkDesc');
  setSurfer(ch);
}

function buildSpotCards() {
  const grid = $('#spot-grid');
  grid.innerHTML = '';
  let team = null;
  for (const sp of SPOTS) {
    const tm = sp.team || 'sba';
    if (tm !== team) {
      team = tm;
      const h = document.createElement('p');
      h.className = 'team-head team-' + tm;
      h.textContent = t(tm === 'michel' ? 'ui.teamMichel' : 'ui.teamSba');
      grid.appendChild(h);
    }
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'card spot-card';
    b.setAttribute('role', 'radio');
    b.dataset.id = sp.id;
    const dots = (n) => '●'.repeat(n) + '○'.repeat(Math.max(0, 4 - n));
    b.innerHTML = `<span class="thumb" style="background:linear-gradient(180deg, ${sp.sky[0]} 0%, ${sp.sky[1]} 45%, ${sp.sky[2]} 62%, #1d8fae 63%, #0b5f86 100%)"><span class="spot-time"></span></span>
      <span class="card-body"><span class="name"></span><span class="desc"></span>
      <span class="meta"><span>${t('ui.wave')} ${dots(sp.wave)}</span><span>${t('ui.trash')} ${dots(sp.trashLvl)}</span><span>${sp.obstacle === 'rock' ? t('ui.rocks') : sp.obstacle === 'surfer' ? t('ui.crowd') : t('ui.pirogues')}</span>${sp.team === 'michel' ? `<span>${sp.right ? t('ui.goRight') : t('ui.goLeft')}</span>` : ''}</span>
      <span class="best"></span></span>`;
    b.querySelector('.spot-time').textContent = t(`spots.${sp.id}.time`);
    b.querySelector('.name').textContent = sp.name;
    b.querySelector('.desc').textContent = t(`spots.${sp.id}.desc`);
    b.querySelector('.best').textContent = best[sp.id] ? t('ui.record') + fmt(best[sp.id]) : '';
    b.addEventListener('click', () => selectSpot(sp));
    b.addEventListener('dblclick', () => { selectSpot(sp); showScreen('howto'); });
    grid.appendChild(b);
  }
  selectSpot(S.spot);
}
function selectSpot(sp) {
  for (const c of $$('#spot-grid .card')) c.setAttribute('aria-checked', String(c.dataset.id === sp.id));
  const sd = $('#spot-detail');
  if (sd) {
    sd.innerHTML = '<b></b> <span></span>';
    sd.querySelector('b').textContent = sp.name + ' · ' + t(`spots.${sp.id}.time`) + ' :';
    sd.querySelector('span').textContent = t(`spots.${sp.id}.desc`) + (best[sp.id] ? ' · ' + t('ui.record') + fmt(best[sp.id]) : '');
  }
  if (S.spot !== sp || !props.length) applySpot(sp);
}

/* ---------------- Déroulé d'une partie ---------------- */
let countdownTimer = 0;
/* ---------------- Cinématiques : take-off et fermeture ---------------- */
const INTRO_DUR = reducedMotion ? 0.6 : 2.0;
const CLOSE_DUR = reducedMotion ? 0.7 : 2.2;
const INTRO_X0 = XL + 0.4;
function syncEntities() {
  for (const it of S.items) { const z = it.p + W.travel; it.obj.position.set(it.x, surfaceY(it.x, z) + 0.2, z); }
  for (const o of S.obstacles) { const z = o.p + W.travel; o.obj.position.set(o.x, o.type === 'rock' ? surfaceY(o.x, z) * 0.6 - 0.1 : surfaceY(o.x, z) - 0.15, z); }
}
function startIntro() {
  S.mode = 'intro';
  S.introT = 0;
  S.x = INTRO_X0; S.vx = 0; S.h = 0; S.air = false;
  S.elapsed = 0;
}
function finishIntro() {
  if (S.mode !== 'intro') return;
  W.H = S.spot.waveH;
  S.mode = 'play';
  S.elapsed = 0;
  S.vx = 4;
}
function updateIntro(dt) {
  S.introT += dt;
  const k = clamp(S.introT / INTRO_DUR, 0, 1);
  const spot = S.spot;
  S.speed = spot.speed * (0.7 + 0.3 * k);
  W.travel += S.speed * dt;
  W.H = spot.waveH * (0.86 + 0.14 * Math.min(1, k * 1.6)); // le pic se creuse
  // pop-up (30 %) puis drop dans la face
  const d = clamp((k - 0.3) / 0.7, 0, 1);
  const e = d * d * (3 - 2 * d);
  const prevX = S.x;
  S.x = lerp(INTRO_X0, 2, e);
  S.vx = (S.x - prevX) / Math.max(dt, 1e-3);
  if (P2.on && !P2.remote) { P2.x = lerp(INTRO_X0 + 1.2, 4, e); P2.vx = S.vx; }
  if (d > 0 && d < 1 && Math.random() < 0.7) emitSpray(S.x + 0.3, surfaceY(S.x, 0), 0.5, 3, 1);
  syncEntities();
  if (k >= 1) finishIntro();
}
function updateCloseout(dt) {
  S.closeT += dt;
  const k = clamp(S.closeT / CLOSE_DUR, 0, 1);
  W.close = k;
  W.collapse = clamp((k - 0.35) / 0.65, 0, 1);
  S.speed *= Math.pow(0.55, dt);
  W.travel += S.speed * dt;
  // le surfeur s'échappe par-dessus l'arrière de la vague
  if (!S.kicked) { S.kicked = true; S.air = true; S.h = Math.max(S.h, 0.1); S.vy = reducedMotion ? 6 : 10; S.vx = -13; S.trick = null; S.wipe = 0; }
  S.x = Math.max(XL - 6, S.x + S.vx * dt);
  S.vx *= Math.pow(0.6, dt);
  if (S.air) { S.vy -= 21 * dt; S.h += S.vy * dt; if (S.h <= 0) { S.h = 0; S.air = false; } }
  if (P2.on && !P2.remote) {
    if (!P2.kicked) { P2.kicked = true; P2.air = true; P2.h = Math.max(P2.h, 0.1); P2.vy = reducedMotion ? 6 : 9.5; P2.vx = -12; P2.trick = null; P2.wipe = 0; }
    P2.x = Math.max(XL - 6, P2.x + P2.vx * dt); P2.vx *= Math.pow(0.6, dt);
    if (P2.air) { P2.vy -= 21 * dt; P2.h += P2.vy * dt; if (P2.h <= 0) { P2.h = 0; P2.air = false; } }
  }
  if (!reducedMotion) for (let n = 0; n < 5; n++) emitCloseSpray(rand(-90, 8));
  syncEntities();
  if (k >= 1) { S.mode = 'over'; showResults(); }
}

function startCountdown() {
  clearBarTimer();
  if (fight.active) fight.stop();
  S.mode = 'menu';
  applySpot(S.spot);
  resetRun();
  P2.on = isDuo() && !!P2.ch;
  P2.remote = S.gameMode === 'online';
  resetP2();
  document.body.classList.toggle('is-duo', P2.on);
  ui.p2Box.hidden = !P2.on;
  ui.p1Name.textContent = P2.on ? S.char.name : t('ui.score');
  if (P2.ch) ui.p2Name.textContent = P2.ch.name;
  showScreen('none');
  ui.hud.hidden = false;
  ui.pauseBtn.hidden = S.gameMode === 'online';
  $('#hint-drag').classList.remove('is-hidden');
  clearTimeout(hintTimer);
  hintTimer = setTimeout(hideHint, 6000);
  S.mode = 'countdown';
  const seq = ['3', '2', '1', t('ui.countGo')];
  let i = 0;
  const step = () => {
    if (S.mode !== 'countdown') return;
    if (i < seq.length) {
      ui.countdown.innerHTML = '';
      const s = document.createElement('span'); s.textContent = seq[i];
      ui.countdown.appendChild(s);
      if (i < 3) Sound.tick(); else Sound.tone(1046, 0.25, 'triangle', 0.2);
      i++;
      countdownTimer = setTimeout(step, i === seq.length ? 500 : 700);
    } else {
      ui.countdown.innerHTML = '';
      startIntro();
    }
  };
  step();
}

function pauseGame() {
  if (S.gameMode === 'online') return; // en ligne : pas de pause
  if (S.mode !== 'play' && S.mode !== 'countdown' && S.mode !== 'intro') return;
  if (S.mode === 'intro') W.H = S.spot.waveH;
  clearTimeout(countdownTimer);
  ui.countdown.innerHTML = '';
  S.mode = 'paused';
  keys.left = keys.right = false;
  S.touchTarget = null;
  showScreen('pause');
}
function resumeGame() {
  if (S.mode !== 'paused') return;
  showScreen('none');
  S.mode = 'play';
}
function quitToMenu(screen) {
  clearBarTimer();
  if (fight.active) fight.stop();
  P2.on = false; if (P2.model) P2.model.visible = false;
  document.body.classList.remove('is-duo');
  clearTimeout(countdownTimer);
  ui.countdown.innerHTML = '';
  S.mode = 'menu';
  ui.hud.hidden = true;
  ui.pauseBtn.hidden = true;
  ui.fact.classList.remove('is-show');
  clearEntities();
  W.close = 0; W.collapse = 0; W.H = S.spot.waveH;
  S.h = 0; S.air = false; S.wipe = 0; S.invuln = 0; S.trick = null; S.vx = 0;
  if (screen === 'spot') buildSpotCards();
  showScreen(screen);
}

function endGame() {
  // la vague ferme (closeout) puis écran de résultats
  S.mode = 'closeout';
  S.closeT = 0; S.kicked = false;
  keys.left = keys.right = false; S.touchTarget = null;
  Sound.end(); Sound.noise(1.2, 300, 0.4);
  popTrick(t('ui.endPop'), fmt(S.score) + ' ' + t('ui.pts'), 'is-good');
}

function showResults() {
  if (S.mode !== 'over') return;
  ui.hud.hidden = true;
  ui.pauseBtn.hidden = true;
  ui.fact.classList.remove('is-show');
  const total = Math.round(S.score);
  const prev = best[S.spot.id] || 0;
  const isRecord = total > prev;
  if (isRecord) { best[S.spot.id] = total; saveBest(); }
  $('#res-spot').textContent = S.spot.name + ' · ' + S.char.name;
  $('#res-total').textContent = fmt(total);
  const rec = $('#res-record');
  rec.className = 'record' + (isRecord && total > 0 ? ' is-new' : '');
  rec.textContent = isRecord && total > 0 ? t('ui.newRecord') : t('ui.record') + fmt(prev);
  $('#res-tricks').textContent = fmt(S.trickPts) + ' ' + t('ui.pts');
  $('#res-clean').textContent = fmt(S.cleanPts) + ' ' + t('ui.pts');
  $('#res-count').textContent = String(S.count);
  // estimation ludique (poids moyens approximatifs par type de déchet)
  const kg = S.kg;
  $('#res-kg').textContent = '≈ ' + (LANG === 'en' ? kg.toFixed(1) : kg.toFixed(1).replace('.', ',')) + ' L';
  $('#res-combo').textContent = 'x' + (LANG === 'en' ? String(S.bestMult) : String(S.bestMult).replace('.', ','));
  $('#res-ocean').textContent = Math.round(S.clean * 100) + ' %';
  let topType = 'none', topN = 0;
  for (const k in S.collected) if (S.collected[k] > topN) { topN = S.collected[k]; topType = k; }
  $('#res-lesson').textContent = t('lessons.' + topType);
  // duo : les deux scores
  const duo = $('#res-duo');
  duo.hidden = !P2.on;
  if (P2.on) {
    const a = Math.round(S.score), b = Math.round(P2.score);
    const card = (ch, sc, win) => `<div class="duo-card${win ? ' is-win' : ''}"><img src="${ch.photo}" alt="" width="64" height="64"><span class="n"></span><b>${fmt(sc)}</b></div>`;
    duo.innerHTML = `<p class="duo-title"></p><div class="duo-row">${card(S.char, a, a > b)}${card(P2.ch, b, b > a)}</div>`;
    const names = duo.querySelectorAll('.n'); names[0].textContent = S.char.name; names[1].textContent = P2.ch.name;
    duo.querySelector('.duo-title').textContent = a === b ? t('ui.duoDraw') : t('ui.duoWin').replace('{name}', a > b ? S.char.name : P2.ch.name);
  }
  const guest = S.gameMode === 'online' && Net.role === 'guest';
  $('#btn-fight').hidden = guest;
  $('#btn-replay').hidden = guest;
  $('#btn-spot-change').hidden = S.gameMode === 'online';
  showScreen('results');
  startBarTimer(guest);
}

/* ---------------- Secret Bar (jeu de combat) ---------------- */
let barTimer = 0;
function clearBarTimer() { clearInterval(barTimer); barTimer = 0; const el = $('#bar-auto'); if (el) el.textContent = ''; }
function startBarTimer(guest) {
  clearBarTimer();
  const el = $('#bar-auto');
  if (guest) { el.textContent = t('ui.waitHostGo'); return; }
  let n = 7;
  const upd = () => { el.textContent = t('ui.barIn').replace('{n}', n); };
  upd();
  barTimer = setInterval(() => { n--; if (n <= 0) { clearBarTimer(); goFight(); } else upd(); }, 1000);
}
const barBonus = (sc) => Math.round(clamp(sc / 120, 0, 60));
function goFight() {
  clearBarTimer();
  if (S.gameMode === 'online' && Net.role !== 'host') return;
  let chars, names, bonus;
  if (S.gameMode === 'solo' || !P2.ch) {
    const cpu = pick(CHARACTERS.filter((c) => c !== S.char));
    chars = [S.char, cpu];
    names = [S.char.name, cpu.name + (LANG === 'en' ? ' (CPU)' : ' (Ordi)')];
    bonus = [barBonus(S.score), 15];
  } else {
    chars = [S.char, P2.ch];
    names = [S.char.name, P2.ch.name];
    bonus = [barBonus(S.score), barBonus(P2.score)];
  }
  if (S.gameMode === 'online') Net.send({ t: 'fight', c: chars.map((c) => c.id), b: bonus });
  launchFight(chars, names, bonus, S.gameMode === 'online' ? 'host' : 'local', 0);
}
function launchFight(chars, names, bonus, role, me) {
  clearBarTimer();
  showScreen('none');
  ui.hud.hidden = true; ui.pauseBtn.hidden = true;
  ui.fact.classList.remove('is-show');
  S.mode = 'fight';
  fight.start({
    chars, names, bonus, role, me,
    mode: S.gameMode === 'online' ? 'online' : (S.gameMode === 'local' && P2.ch ? 'local' : 'solo'),
    net: S.gameMode === 'online' ? Net : null,
    onExit: (a) => {
      S.mode = 'menu';
      if (a === 'surf') startCountdown();
      else { if (S.gameMode === 'online') Net.close(); quitToMenu('mode'); }
    },
  });
}

/* ---------------- Boutons ---------------- */
S.gameMode = 'solo'; S.pickFor = 1; S.char2 = null;
function setMode(m) {
  S.gameMode = m;
  document.body.classList.toggle('mode-local', m === 'local');
  document.body.classList.toggle('mode-online', m === 'online');
}
function openChars(pickFor) { S.pickFor = pickFor; buildCharCards(); showScreen('char'); }
function charOk() {
  if (S.gameMode === 'local' && S.pickFor === 1) {
    if (!S.char2 || S.char2 === S.char) S.char2 = CHARACTERS.find((c) => c !== S.char);
    openChars(2);
    return;
  }
  S.pickFor = 1;
  openShop(1);
}
/* ---------------- Surf shop Jam'in ---------------- */
function openShop(n) {
  S.shopFor = n;
  const cur = n === 2 ? S.board2 : S.board;
  const title = $('#shop-title');
  title.textContent = S.gameMode === 'local' ? t('ui.shopTitleP').replace('{name}', (n === 2 ? S.char2 : S.char).name) : t('ui.shopTitle');
  $('#shop-bubble').textContent = t('ui.shopHello');
  const grid = $('#shop-grid');
  grid.innerHTML = '';
  for (const b of BOARDS) {
    const el = document.createElement('button');
    el.type = 'button'; el.className = 'shop-card'; el.dataset.id = b.id; el.setAttribute('role', 'radio');
    el.innerHTML = `<span class="shop-pic">${b.photo ? `<img alt="" src="${b.photo}">` : boardSVG(b.id)}</span><span class="shop-name"></span><span class="shop-dims"></span>`;
    el.querySelector('.shop-name').textContent = b.name;
    el.querySelector('.shop-dims').textContent = b.dims;
    el.addEventListener('click', () => selectBoard(b.id));
    el.addEventListener('dblclick', () => { selectBoard(b.id); shopOk(); });
    grid.appendChild(el);
  }
  selectBoard(cur || 'bigguy');
  showScreen('shop');
}
function selectBoard(id) {
  if (S.shopFor === 2) S.board2 = id; else S.board = id;
  for (const c of $$('#shop-grid .shop-card')) c.setAttribute('aria-checked', String(c.dataset.id === id));
  const b = BOARDS.find((x) => x.id === id);
  const d = $('#shop-detail');
  d.innerHTML = '<h3></h3><dl></dl>';
  d.querySelector('h3').textContent = b.name;
  const dl = d.querySelector('dl');
  for (const [k, v] of [['ui.shopDims', b.dims], ['ui.shopProg', t(`boards.${id}.prog`)], ['ui.shopShape', t(`boards.${id}.shape`)], ['ui.shopSurfer', t(`boards.${id}.surfer`)]]) {
    const dt = document.createElement('dt'); dt.textContent = t(k);
    const dd = document.createElement('dd'); dd.textContent = v;
    dl.append(dt, dd);
  }
  // liens vers le vrai shop Jam'in (nouvel onglet)
  const links = document.createElement('div');
  links.className = 'shop-links';
  for (const [href, k, main] of [[b.url, 'ui.shopSee', false], [JAMIN_PREORDER, 'ui.shopBuy', true]]) {
    const a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener';
    a.className = 'btn ' + (main ? 'btn-primary' : 'btn-ghost');
    a.textContent = t(k);
    links.appendChild(a);
  }
  d.appendChild(links);
  if (S.shopFor !== 2) setSurfer(S.char);
}
function shopOk() {
  if (S.gameMode === 'local' && S.shopFor === 1) { openShop(2); return; }
  setSurfer(S.char);
  if (S.gameMode === 'local') setP2(withBoard(S.char2, S.board2));
  if (S.gameMode === 'online') {
    Net.send({ t: 'char', id: S.char.id, b: S.board });
    if (Net.role !== 'host') { showWait(t('ui.waitHostSpot')); return; }
  }
  buildSpotCards(); showScreen('spot');
}
$('#btn-shop-ok').addEventListener('click', shopOk);
$('#btn-shop-back').addEventListener('click', () => {
  if (S.gameMode === 'local' && S.shopFor === 2) { openShop(1); return; }
  openChars(S.gameMode === 'local' ? 2 : 1);
});
function enterHowto() {
  const go = $('#btn-go');
  const guest = S.gameMode === 'online' && Net.role === 'guest';
  go.disabled = guest;
  go.textContent = guest ? t('ui.waitHostGo') : (S.gameMode === 'online' && !P2.ch ? t('ui.waitMateChar') : t('ui.go'));
  showScreen('howto');
}
function showWait(text) {
  $('#wait-text').textContent = text;
  showScreen('wait');
}
/* ---------------- Voix (synthèse vocale du navigateur) ---------------- */
const Voice = {
  voices: [],
  load() {
    const ss = window.speechSynthesis;
    if (!ss) return;
    const upd = () => { this.voices = ss.getVoices() || []; };
    upd();
    if (ss.addEventListener) ss.addEventListener('voiceschanged', upd);
  },
  // voix masculine de préférence (grave), sinon la première de la langue
  pick(lang) {
    const vs = this.voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(lang));
    const male = /(male|homme|david|daniel|fred|alex|thomas|guy|christopher|eric|mark|arthur|paul|henri|george|ryan|aaron|rocko|reed|grandpa)/i;
    return vs.find((v) => male.test(v.name) && !/female/i.test(v.name)) || vs[0] || null;
  },
  // parts : [{ text, lang, pitch, rate, at(start) }]
  say(parts) {
    const ss = window.speechSynthesis;
    if (!ss || !Sound.enabled) return false;
    try {
      ss.cancel();
      for (const p of parts) {
        const u = new SpeechSynthesisUtterance(p.text);
        const lang = p.lang || 'en';
        u.lang = lang === 'fr' ? 'fr-FR' : 'en-US';
        const v = this.pick(lang); if (v) u.voice = v;
        u.pitch = p.pitch ?? 0.1; u.rate = p.rate ?? 0.8; u.volume = 1;
        if (p.onstart) u.onstart = p.onstart;
        ss.speak(u);
      }
      return true;
    } catch (e) { return false; }
  },
};
Voice.load();
// « SBA… vs… Michel ! » façon bande-annonce : voix grave + impacts
function announceTitle() {
  if (!Sound.enabled) return;
  Sound.unlock();
  const boom = (f) => { Sound.tone(f, 1.3, 'sawtooth', 0.22, -18); Sound.tone(f / 2, 1.6, 'sine', 0.35, -10); Sound.noise(0.9, 160, 0.4); };
  boom(70);
  const ok = Voice.say([
    { text: 'S. B. A.', pitch: 0.05, rate: 0.62, onstart: () => boom(62) },
    { text: 'versus', pitch: 0.1, rate: 0.7 },
    { text: 'Michel!', pitch: 0.05, rate: 0.6, onstart: () => { boom(55); setTimeout(() => Sound.noise(1.4, 90, 0.35), 200); } },
  ]);
  if (!ok) setTimeout(() => boom(55), 600);
}
$('#btn-start').addEventListener('click', () => { announceTitle(); showScreen('mode'); });
for (const b of $$('.mode-btn')) {
  b.addEventListener('click', () => {
    setMode(b.dataset.mode);
    if (b.dataset.mode === 'online') startOnline();
    else openChars(1);
  });
}
$('#btn-char-back').addEventListener('click', () => {
  if (S.pickFor === 2) { openChars(1); return; }
  if (S.gameMode === 'online') { Net.close(); showScreen('mode'); return; }
  showScreen('mode');
});
$('#btn-char-ok').addEventListener('click', charOk);
$('#btn-spot-ok').addEventListener('click', () => {
  if (S.gameMode === 'online') Net.send({ t: 'spot', id: S.spot.id });
  enterHowto();
});
$('#btn-go').addEventListener('click', () => {
  if (S.gameMode === 'online') {
    if (Net.role !== 'host') return;
    if (!P2.ch) { $('#btn-go').textContent = t('ui.waitMateChar'); return; }
    Net.send({ t: 'go' });
  }
  startCountdown();
});
$('#btn-fight').addEventListener('click', goFight);

/* ---------------- Duo en ligne ---------------- */
const onlineStatus = (txt) => { $('#online-status').textContent = txt; };
async function startOnline() {
  showScreen('online');
  $('#btn-online-retry').hidden = true;
  onlineStatus(t('ui.connecting'));
  try { await Net.connect(); } catch (e) { onlineStatus(t('ui.netError')); $('#btn-online-retry').hidden = false; }
}
$('#btn-online-retry').addEventListener('click', startOnline);
$('#btn-online-back').addEventListener('click', () => { Net.close(); showScreen('mode'); });
$('#btn-wait-quit').addEventListener('click', () => { Net.close(); quitToMenu('mode'); });
Net.onStatus = (st, d) => {
  if (st === 'waiting') {
    onlineStatus(t('ui.waitingMate'));
  } else if (st === 'connected') {
    setP2(null);
    openChars(1);
  } else if (st === 'error' || st === 'full') {
    if (S.gameMode === 'online' && currentScreen !== 'online') quitToMenu('online');
    onlineStatus(t(st === 'full' ? 'ui.full' : 'ui.netError'));
    $('#btn-online-retry').hidden = false;
  } else if (st === 'closed') {
    if (S.gameMode === 'online' && !['online', 'mode', 'title'].includes(currentScreen)) {
      quitToMenu('wait');
      showWait(t('ui.mateLeft'));
    }
  }
};
let netSendT = 0;
Net.onMessage = (m) => {
  if (!m || typeof m !== 'object') return;
  if (fight.onNet(m)) return;
  switch (m.t) {
    case 'char': {
      const ch = withBoard(CHARACTERS.find((c) => c.id === m.id), m.b);
      if (ch) { setP2(ch); if (currentScreen === 'howto' && Net.role === 'host') $('#btn-go').textContent = t('ui.go'); }
      break;
    }
    case 'spot': {
      const sp = SPOTS.find((x) => x.id === m.id);
      if (sp) applySpot(sp);
      if (Net.role === 'guest') enterHowto();
      break;
    }
    case 'go': if (Net.role === 'guest') startCountdown(); break;
    case 's':
      P2.tx = m.x; P2.h = m.h; P2.air = !!m.a; P2.wipe = m.w || 0; P2.score = m.sc || 0; P2.count = m.c || 0; P2.vx = m.vx || 0;
      if ((m.tr || null) !== P2.trick) { P2.trick = m.tr || null; P2.trickT = m.tt || 0; }
      break;
    case 'fight': {
      const c = (m.c || []).map((id) => CHARACTERS.find((x) => x.id === id));
      if (c.length === 2 && c[0] && c[1]) launchFight(c, c.map((x) => x.name), m.b || [0, 0], 'guest', 1);
      break;
    }
    default: break;
  }
};
function netSurf(dt) {
  netSendT -= dt;
  if (netSendT > 0) return;
  netSendT = 0.08;
  const r = (v) => Math.round(v * 100) / 100;
  Net.send({ t: 's', x: r(S.x), h: r(S.h), a: S.air ? 1 : 0, tr: S.trick || '', tt: r(S.trickT), w: r(S.wipe), sc: Math.round(S.score), c: S.count, vx: r(S.vx) });
}
$('#btn-pause').addEventListener('click', pauseGame);
$('#btn-resume').addEventListener('click', resumeGame);
$('#btn-restart').addEventListener('click', () => { showScreen('none'); startCountdown(); });
$('#btn-quit').addEventListener('click', () => quitToMenu('spot'));
$('#btn-replay').addEventListener('click', () => {
  if (S.gameMode === 'online') { if (Net.role !== 'host') return; Net.send({ t: 'go' }); }
  startCountdown();
});
$('#btn-spot-change').addEventListener('click', () => quitToMenu('spot'));
$('#btn-results-menu').addEventListener('click', () => { if (S.gameMode === 'online') Net.close(); quitToMenu('mode'); });
for (const b of $$('[data-go]')) {
  b.addEventListener('click', () => {
    const to = b.dataset.go;
    if (to === 'char') buildCharCards();
    if (to === 'spot') buildSpotCards();
    showScreen(to);
  });
}
const soundBtn = $('#btn-sound');
soundBtn.setAttribute('aria-pressed', String(Sound.enabled));
// premier geste de l'utilisateur : lance l'audio (son activé par défaut)
const firstGesture = (e) => {
  if (e.target && e.target.closest && e.target.closest('#btn-sound')) return; // le bouton gère lui-même
  window.removeEventListener('pointerdown', firstGesture, true);
  window.removeEventListener('keydown', firstGesture, true);
  Sound.unlock();
};
window.addEventListener('pointerdown', firstGesture, true);
window.addEventListener('keydown', firstGesture, true);
soundBtn.addEventListener('click', () => {
  const on = Sound.toggle();
  soundBtn.setAttribute('aria-pressed', String(on));
  updateSoundLabel();
});
document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

/* ------------------------------------------------------------------ */
/* Redimensionnement & boucle                                          */
/* ------------------------------------------------------------------ */
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.fov = camera.aspect < 0.7 ? 74 : camera.aspect < 1.1 ? 66 : 56;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 150));
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  tick(Math.min(0.05, clock.getDelta()));
}
function tick(dt) {
  if (S.mode === 'fight') { fight.tick(dt); return; }
  const playing = S.mode === 'play';
  const frozen = S.mode === 'paused';
  if (!frozen) {
    W.t += dt;
    if (playing) {
      updateGame(dt);
      if (P2.on && !P2.remote) updateP2(dt);
    } else if (S.mode === 'intro') {
      updateIntro(dt);
    } else if (S.mode === 'closeout') {
      updateCloseout(dt);
    } else {
      // mode démo (menus, compte à rebours, fin)
      S.menuT += dt;
      const sp = S.mode === 'over' ? S.speed * 0.98 : S.spot.speed * 0.8;
      if (S.mode === 'over') S.speed = sp;
      W.travel += sp * dt;
      if (S.mode === 'menu' || S.mode === 'loading') {
        S.x = lerp(XL + 3, XT + 2, 0.5 + 0.5 * Math.sin(S.menuT * 0.5));
        S.vx = Math.cos(S.menuT * 0.5) * 0.5 * (XT - XL) * 0.25;
        waterClean = lerp(waterClean, 0.75, dt * 0.5);
      }
      if (S.mode === 'countdown' || S.mode === 'over') syncEntities(); // les objets suivent l'eau
    }
    const riding = playing || S.mode === 'intro' || S.mode === 'closeout';
    const spd = riding ? S.speed : S.spot.speed * 0.8;
    updateProps(dt, spd);
    updateWave();
    if (S.spot.lipSpray) for (let k = 0; k < 3; k++) if (Math.random() < S.spot.lipSpray * 0.8) emitLipSpray(rand(-60, 6));
    updateSpray(dt, spd);
    updateSurferPose(dt, !riding && S.mode !== 'over' && S.mode !== 'countdown');
    updateP2Pose(dt);
    if (S.gameMode === 'online' && riding) netSurf(dt);
  }
  updateCamera(dt, S.mode === 'menu' || S.mode === 'loading');
  if (playing || S.mode === 'countdown' || S.mode === 'intro') updateHud();
  const mirT = MIR() < 0 ? 'scaleX(-1)' : '';
  if (renderer.domElement.style.transform !== mirT) renderer.domElement.style.transform = mirT;
  renderer.render(scene, camera);
}

/* ---------------- Langue ---------------- */
function updateSoundLabel() {
  soundBtn.setAttribute('aria-label', Sound.enabled ? t('ui.soundOff') : t('ui.soundOn'));
  soundBtn.title = soundBtn.getAttribute('aria-label');
}
function applyLang() {
  document.documentElement.lang = LANG;
  for (const el of $$('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of $$('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
  $('#char-grid').setAttribute('aria-label', t('ui.surfers'));
  $('#spot-grid').setAttribute('aria-label', t('ui.spots'));
  for (const b of $$('.lang-btn')) b.setAttribute('aria-pressed', String(b.dataset.lang === LANG));
  updateSoundLabel();
  // écrans construits dynamiquement
  if ($('#char-grid').children.length) buildCharCards();
  if ($('#spot-grid').children.length) buildSpotCards();
  updateHud(true);
}
function setLang(l) {
  if (!LANGS.includes(l)) return;
  LANG = l;
  try { localStorage.setItem('sba-lang', l); } catch (e) { /* ignore */ }
  applyLang();
}
for (const b of $$('.lang-btn')) b.addEventListener('click', () => setLang(b.dataset.lang));
window.addEventListener('storage', (e) => {
  if (e.key === 'sba-lang' && LANGS.includes(e.newValue) && e.newValue !== LANG) { LANG = e.newValue; applyLang(); }
});

const fight = createFight({ THREE, renderer, buildSurfer, buildTrash, buildPalm, Sound, Voice, getLang: () => LANG, isTouch, reducedMotion });

// Accès de test (seulement avec ?debug dans l'adresse)
if (/[?&]debug/.test(location.search)) window.SBA = { fight, S, CHARACTERS, SPOTS, launchFight, applySpot, setMode: (m) => setMode(m), showScreen, openChars, openShop, buildSpotCards, Net };

// Démarrage
applyLang();
setSurfer(S.char);
applySpot(SPOTS[0]);
S.mode = 'menu';
window.__srGameReady = true;
if (new URLSearchParams(location.search).has('debug')) window.__sba = { tick, S, P2, fight, goFight, launchFight, startCountdown, setMode, setP2, CHARACTERS, Net };
showScreen('title');
frame();
