const HOSTS = ['team100india.org', 'www.team100india.org', 'team100india.pages.dev'];
const reply = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
const configured = env => /^https:\/\/script\.google\.com\/(?:a\/macros\/[a-zA-Z0-9.-]+|macros)\/s\/[\w-]+\/exec$/.test(env.SHEETS_WEB_APP_URL || '') && (env.SHEETS_SHARED_SECRET || '').length >= 32 && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY;
export function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data) || data.website || data.consent !== true) return null;
  const out = {};
  for (const [key,max] of Object.entries({name:120,profession:120,company:160,country:80,city:100,phone:30,email:254})) {
    if (typeof data[key] !== 'string') return null;
    const value = data[key].trim();
    if ((!value && key !== 'company') || value.length > max || /[\x00-\x1f\x7f]/.test(value)) return null;
    out[key] = value;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email) || !/^[+\d ()-]{6,30}$/.test(out.phone) || out.phone.replace(/\D/g,'').length < 6) return null;
  if (!['Friends','Social Media Ad','Family'].includes(data.referral) || !['Annually once — ₹20,000 / US$250','Twice yearly — ₹10,000 / US$125 per instalment'].includes(data.contribution) || !/^[a-f0-9-]{36}$/i.test(data.submissionId || '')) return null;
  return {...out,referral:data.referral,contribution:data.contribution,consent:true,submissionId:data.submissionId};
}
async function readLimited(request) {
  const reader = request.body?.getReader();
  if (!reader) throw Error('body');
  const chunks = []; let size = 0;
  while (true) { const {done,value} = await reader.read(); if(done)break; size+=value.length; if(size>8192){await reader.cancel();throw Error('size');} chunks.push(value); }
  const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return JSON.parse(new TextDecoder().decode(bytes));
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (!HOSTS.includes(url.hostname)) return reply({ok:false,message:'Registration is available on the main website only.'},403);
    if (url.pathname === '/api/registration-config' && request.method === 'GET') return reply({ready:Boolean(configured(env)),siteKey:configured(env)?env.TURNSTILE_SITE_KEY:null});
    if (url.pathname !== '/api/register') return reply({ok:false},404);
    if (request.method !== 'POST') return reply({ok:false},405);
    if (request.headers.get('Origin') !== url.origin) return reply({ok:false,message:'Please submit from the Team 100 website.'},403);
    if (!configured(env)) return reply({ok:false,message:'Registration is not accepting responses yet. Please contact sridhar@santhusta.org.'},503);
    if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply({ok:false},415);
    let data; try {data=await readLimited(request);}catch{return reply({ok:false,message:'Invalid or oversized submission.'},400);}
    const clean = validate(data);
    if (!clean || typeof data.token !== 'string' || !data.token || data.token.length>2048) return reply({ok:false,message:'Please check your details and verification.'},400);
    try {
      const verifiedResponse = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:data.token,remoteip:request.headers.get('CF-Connecting-IP')}),signal:AbortSignal.timeout(10000)});
      const verified=await verifiedResponse.json();
      if (!verifiedResponse.ok || !verified.success || verified.hostname !== url.hostname || verified.action !== 'registration') return reply({ok:false,message:'Verification expired or failed. Please try again.'},400);
      const result = await fetch(env.SHEETS_WEB_APP_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({secret:env.SHEETS_SHARED_SECRET,data:clean}),signal:AbortSignal.timeout(20000)});
      const saved = await result.json();
      if (!result.ok || saved.ok !== true) throw Error('Not confirmed');
      return reply({ok:true});
    } catch { return reply({ok:false,message:'We could not confirm your submission. Please retry in a moment.'},502); }
  }
};
