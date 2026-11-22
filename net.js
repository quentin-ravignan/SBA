/* SBA – connexion « duo en ligne » par relais Supabase Realtime.
   Il n'y a qu'un seul salon : le premier joueur qui lance « Duo en ligne »
   devient l'hôte, le second l'invité. Les messages passent par le serveur
   Realtime (WebSocket), ce qui marche partout, y compris en 4G, là où une
   connexion directe entre téléphones est souvent bloquée.
   Rien n'est écrit en base ; aucune donnée personnelle n'est envoyée. */

const SUPA_URL = 'https://zvrzpfyxtqygzsihjccu.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2cnpwZnl4dHF5Z3pzaWhqY2N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3NjYwNzMsImV4cCI6MjEwODM0MjA3M30.XImY1lOpd-CIZ4ZTx_7ADpUlrwqE1xYH8-23NPkDZXo';
const LIB_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
const ROOM = 'sba-duo-salon';
const JOIN_TIMEOUT = 12000;

let client = null;
let chan = null;
let gen = 0;
let timer = 0;

async function getClient() {
  if (client) return client;
  const { createClient } = await import(LIB_URL);
  client = createClient(SUPA_URL, SUPA_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    realtime: { params: { eventsPerSecond: 60 } },
  });
  return client;
}

export const Net = {
  role: null,        // 'host' | 'guest'
  connected: false,
  onMessage: null,   // (msg) => void
  onStatus: null,    // (state, detail) => void  state: 'waiting' | 'connected' | 'closed' | 'full' | 'error'
  me: null,
  peer: null,

  _status(s, d) { if (this.onStatus) this.onStatus(s, d); },

  /* Entre dans le salon : hôte si on est seul, invité s'il y a déjà quelqu'un. */
  async connect() {
    this.close();
    const g = ++gen;
    let sb;
    try { sb = await getClient(); } catch (e) { if (g === gen) this._status('error', 'lib'); return; }
    if (g !== gen) return;
    this.me = Math.random().toString(36).slice(2, 10);
    const joinedAt = Date.now();
    const c = sb.channel(ROOM, { config: { broadcast: { self: false, ack: false }, presence: { key: this.me } } });
    chan = c;

    c.on('broadcast', { event: 'm' }, ({ payload }) => {
      if (g !== gen || !payload || payload.to !== this.me || payload.from !== this.peer) return;
      if (this.connected && this.onMessage) this.onMessage(payload.d);
    });

    c.on('presence', { event: 'sync' }, () => {
      if (g !== gen) return;
      // ordre d'arrivée : les deux premiers jouent, les suivants voient « partie complète »
      const list = [];
      const st = c.presenceState();
      for (const k in st) { const m = st[k][0]; if (m) list.push({ id: k, t: m.t || 0 }); }
      list.sort((a, b) => a.t - b.t || (a.id < b.id ? -1 : 1));
      const idx = list.findIndex((x) => x.id === this.me);
      if (idx < 0) return; // notre présence n'est pas encore enregistrée
      if (idx > 1) { this.close(); this._status('full'); return; }
      const other = list[1 - idx];
      if (this.connected) {
        if (!other || other.id !== this.peer) { this.connected = false; this.peer = null; this._status('closed'); }
        return;
      }
      this.role = idx === 0 ? 'host' : 'guest';
      if (!other) { this._status('waiting'); return; }
      this.peer = other.id;
      this.connected = true;
      clearTimeout(timer);
      this._status('connected');
    });

    timer = setTimeout(() => { if (g === gen && !this.connected && !this.role) { this.close(); this._status('error', 'timeout'); } }, JOIN_TIMEOUT);

    c.subscribe(async (status) => {
      if (g !== gen) return;
      if (status === 'SUBSCRIBED') {
        try { await c.track({ t: joinedAt }); } catch (e) { this._status('error', 'track'); }
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (this.connected) { this.connected = false; this._status('closed'); }
        else { this.close(); this._status('error', status); }
      }
    });
  },

  send(msg) {
    if (!chan || !this.connected) return;
    try { chan.send({ type: 'broadcast', event: 'm', payload: { from: this.me, to: this.peer, d: msg } }); } catch (e) { /* ignore */ }
  },

  close() {
    gen++;
    clearTimeout(timer);
    this.connected = false;
    this.role = null;
    this.peer = null;
    const c = chan; chan = null;
    if (c) { try { c.untrack(); } catch (e) { /* ignore */ } try { if (client) client.removeChannel(c); } catch (e) { /* ignore */ } }
  },
};
