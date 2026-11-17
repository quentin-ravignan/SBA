/* SBA – connexion « duo en ligne » en pair à pair (WebRTC via PeerJS).
   Il n'y a qu'un seul salon : le premier joueur qui lance « Duo en ligne »
   l'ouvre (hôte), le second s'y connecte directement (invité). Pas de code.
   Le serveur public de PeerJS sert seulement à mettre les deux téléphones en
   relation ; ensuite les données passent d'un appareil à l'autre.
   Aucune donnée personnelle n'est envoyée. */

const PEERJS_URL = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.4/dist/peerjs.min.js';
const ROOM = 'sba7k2q-surfbeer-salon';
const GUEST_TIMEOUT = 8000;   // hôte fantôme (onglet fermé sans se déconnecter) : on reprend le salon
const MAX_TRIES = 4;
const PEER_OPTS = {
  debug: 0,
  config: {
    iceServers: [
      { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
      { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
    ],
  },
};

let peer = null;
let conn = null;
let timer = 0;
let gen = 0;     // invalide les rappels d'une tentative abandonnée

function loadLib() {
  if (window.Peer) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PEERJS_URL;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('peerjs'));
    document.head.appendChild(s);
  });
}

function dropPeer() {
  clearTimeout(timer);
  const c = conn, p = peer;
  conn = null; peer = null;
  try { if (c) c.close(); } catch (e) { /* ignore */ }
  try { if (p) p.destroy(); } catch (e) { /* ignore */ }
}

export const Net = {
  role: null,        // 'host' | 'guest'
  connected: false,
  onMessage: null,   // (msg) => void
  onStatus: null,    // (state, detail) => void  state: 'waiting' | 'connected' | 'closed' | 'full' | 'error'

  _status(s, d) { if (this.onStatus) this.onStatus(s, d); },
  _bind(c, g) {
    conn = c;
    let opened = false;
    c.on('open', () => {
      if (g !== gen) return;
      opened = true; clearTimeout(timer);
      this.connected = true; this._status('connected');
    });
    c.on('data', (d) => { if (g === gen && this.onMessage) this.onMessage(d); });
    c.on('close', () => {
      if (g !== gen || conn !== c) return;
      this.connected = false; conn = null;
      if (opened) this._status('closed');
      else if (this.role === 'guest') this._status('full');   // l'hôte a refusé : partie déjà à deux
    });
    c.on('error', () => { /* géré par close / le délai */ });
  },

  /* Ouvre le salon, ou le rejoint s'il est déjà ouvert. */
  async connect() {
    this.close();
    await loadLib();
    const g = ++gen;
    let tries = 0;

    const fail = (why) => { if (g === gen) { dropPeer(); this._status('error', why); } };
    const retry = (why) => {
      if (g !== gen) return;
      dropPeer();
      if (++tries >= MAX_TRIES) { this._status('error', why); return; }
      setTimeout(() => { if (g === gen) asHost(); }, 300 + Math.random() * 700);
    };

    const asHost = () => {
      this.role = null;
      const p = new window.Peer(ROOM, PEER_OPTS);
      peer = p;
      p.on('open', () => { if (g === gen) { this.role = 'host'; this._status('waiting'); } });
      p.on('connection', (c) => {
        if (g !== gen) return;
        if (conn && conn.open) { c.on('open', () => c.close()); return; } // déjà à deux
        this._bind(c, g);
      });
      p.on('error', (e) => {
        if (g !== gen) return;
        const type = e && e.type;
        if (type === 'unavailable-id') { dropPeer(); asGuest(); }   // salon déjà ouvert : on le rejoint
        else if (type === 'peer-unavailable') { /* sans objet pour l'hôte */ }
        else if (this.role === 'host' && type === 'network') { /* reconnexion ci-dessous */ }
        else fail(type);
      });
      p.on('disconnected', () => { if (g === gen && peer === p && !p.destroyed) p.reconnect(); });
    };

    const asGuest = () => {
      this.role = 'guest';
      const p = new window.Peer(PEER_OPTS);
      peer = p;
      p.on('open', () => {
        if (g !== gen) return;
        this._bind(p.connect(ROOM, { reliable: true, serialization: 'json' }), g);
        timer = setTimeout(() => { if (g === gen && !this.connected) retry('timeout'); }, GUEST_TIMEOUT);
      });
      p.on('error', (e) => {
        if (g !== gen) return;
        const type = e && e.type;
        if (type === 'peer-unavailable') retry(type);   // l'hôte vient de partir : on prend sa place
        else fail(type);
      });
    };

    asHost();
  },

  send(msg) { if (conn && conn.open) { try { conn.send(msg); } catch (e) { /* ignore */ } } },

  close() {
    gen++;
    this.connected = false;
    this.role = null;
    dropPeer();
  },
};
