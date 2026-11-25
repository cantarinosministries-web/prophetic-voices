const enc = new TextEncoder();
export async function signed(raw, secret, signature) {
  if (!secret || !/^sha256=[a-f0-9]{64}$/.test(signature || '')) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), {name:'HMAC',hash:'SHA-256'}, false, ['verify']);
  const bytes = Uint8Array.from(signature.slice(7).match(/../g), x => parseInt(x,16));
  return crypto.subtle.verify('HMAC', key, bytes, enc.encode(raw));
}
export function normalize(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
export function matches(text, keyword) {
  return normalize(text).split(/[^\p{L}\p{N}]+/u).includes(normalize(keyword));
}
export function events(payload) {
  if (payload.object !== 'instagram') return [];
  return (payload.entry || []).flatMap(entry => (entry.changes || []).filter(c => c.field === 'comments').map(c => ({
    account:String(entry.id), comment:String(c.value?.id || ''), media:String(c.value?.media?.id || ''),
    text:String(c.value?.text || '').slice(0,2000), at:Number(c.value?.created_time || entry.time),
    self:String(c.value?.from?.id) === String(entry.id), type:c.value?.media?.media_product_type
  }))).filter(e => e.comment && e.media && !e.self && ['FEED','REELS'].includes(e.type) && Number.isFinite(e.at));
}
const json = (data,status=200) => Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function processEvent(e, env, fetcher=fetch) {
  const now = Math.floor(Date.now()/1000);
  if (now-e.at > 7*86400 || e.at > now+60) return;
  const rule = await env.DB.prepare(`SELECT r.*, a.token_binding FROM rules r JOIN accounts a ON a.id=r.account_id WHERE a.id=? AND a.enabled=1 AND r.enabled=1 AND r.media_id=? ORDER BY r.id`).bind(e.account,e.media).all();
  const r = rule.results.find(r => matches(e.text,r.keyword));
  if (!r) return;
  const live = env.MODE === 'live' && env.SEND_ENABLED === 'true';
  if (live && (!/^v\d+\.\d+$/.test(env.GRAPH_VERSION) || !env[r.token_binding])) throw new Error('configuration');
  if (live) {
    const check = await fetcher(`https://graph.instagram.com/${env.GRAPH_VERSION}/${encodeURIComponent(e.comment)}?fields=timestamp`, {headers:{Authorization:`Bearer ${env[r.token_binding]}`},signal:AbortSignal.timeout(10000)});
    if (!check.ok) throw new Error('comment_validation');
    const created = Date.parse((await check.json()).timestamp)/1000;
    if (!Number.isFinite(created) || now-created > 7*86400 || created > now+60) return;
  }
  // Atomic unique claim prevents duplicate private replies, including queue redelivery.
  const claim = await env.DB.prepare('INSERT OR IGNORE INTO deliveries VALUES (?,?,?,?)').bind(e.account,e.comment,live?'sending':'simulated',now).run();
  if (!claim.meta.changes) return;
  if (!live) return;
  try {
    const res = await fetcher(`https://graph.instagram.com/${env.GRAPH_VERSION}/${encodeURIComponent(e.account)}/messages`, {
      method:'POST', headers:{Authorization:`Bearer ${env[r.token_binding]}`,'Content-Type':'application/json'},
      body:JSON.stringify({recipient:{comment_id:e.comment},message:{text:r.reply}}),signal:AbortSignal.timeout(10000)
    });
    // Never automatically retry an uncertain send: Meta may have accepted it already.
    await env.DB.prepare('UPDATE deliveries SET status=? WHERE account_id=? AND comment_id=?').bind(res.ok?'sent':`rejected_${res.status}`,e.account,e.comment).run();
  } catch {
    await env.DB.prepare('UPDATE deliveries SET status=? WHERE account_id=? AND comment_id=?').bind('uncertain',e.account,e.comment).run();
  }
}
export default {
  async fetch(req,env) {
    const url = new URL(req.url);
    if (url.pathname === '/health') return json({service:'pv-instagram',mode:env.MODE,sendEnabled:env.SEND_ENABLED==='true'});
    if (url.pathname !== '/webhook') return json({error:'not_found'},404);
    if (req.method === 'GET') {
      if (!env.META_VERIFY_TOKEN || url.searchParams.get('hub.mode') !== 'subscribe' || url.searchParams.get('hub.verify_token') !== env.META_VERIFY_TOKEN) return new Response('Forbidden',{status:403});
      return new Response(url.searchParams.get('hub.challenge') || '',{headers:{'Cache-Control':'no-store'}});
    }
    if (req.method !== 'POST') return new Response(null,{status:405});
    // Bound body while streaming, including requests without Content-Length.
    const reader=req.body?.getReader(); if (!reader) return json({error:'body'},400);
    let size=0, chunks=[];
    while(true) { const {done,value}=await reader.read(); if(done) break; size+=value.length; if(size>32768){await reader.cancel();return json({error:'too_large'},413);} chunks.push(value); }
    const raw = new TextDecoder().decode(Uint8Array.from(chunks.flatMap(c=>Array.from(c))));
    if (!await signed(raw,env.META_APP_SECRET,req.headers.get('x-hub-signature-256'))) return json({error:'signature'},401);
    let incoming; try { incoming=events(JSON.parse(raw)); } catch { return json({error:'payload'},400); }
    for(const e of incoming) {
      const day=new Date().toISOString().slice(0,10);
      const budget=await env.DB.prepare('INSERT INTO budgets VALUES (?,1) ON CONFLICT(day) DO UPDATE SET count=count+1 WHERE count<? RETURNING count').bind(day,Math.min(Number(env.DAILY_EVENTS)||500,500)).first();
      if(!budget) return json({error:'daily_cap'},503);
      await env.EVENTS.send(e);
    }
    return json({accepted:true});
  },
  async queue(batch,env) { for(const msg of batch.messages) { try { await processEvent(msg.body,env); msg.ack(); } catch { msg.retry({delaySeconds:60}); } } }
};
