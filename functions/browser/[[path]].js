import {authorized,json} from '../api/auth/_lib.js';
import {getPortForOwner} from '../api/cloud-browser.js';

const base='/browser';
function rewrite(value){
 if(!value||/^(?:https?:|wss?:|data:|blob:|mailto:|javascript:|#|\/browser(?:\/|$))/i.test(value))return value;
 if(value.startsWith('//'))return value;
 return value.startsWith('/')?base+value:value;
}
class AttrRewriter{
 constructor(names){this.names=names}
 element(el){for(const n of this.names){const v=el.getAttribute(n);if(v)el.setAttribute(n,rewrite(v))}}
}
function rewriteText(s){
 return s.replace(/(\b(?:src|href|action)=["'])(\/[^"']*)/gi,(_,a,b)=>a+rewrite(b))
 .replace(/(\b(?:fetch|WebSocket)\s*\(\s*["'])(\/[^"']*)/g,(_,a,b)=>a+rewrite(b));
}
export async function onRequest({request,env,params}){
 if(!await authorized(request,env))return json({ok:false,error:'Please sign in to PowerAgent first'},401);
 const incoming=new URL(request.url);
 const upgrade=request.headers.get('Upgrade')||'';
 const ws=upgrade.toLowerCase()==='websocket';
 if(ws){
  const origin=request.headers.get('Origin');
  if(origin&&origin!==incoming.origin)return json({ok:false,error:'Invalid WebSocket origin'},403);
 }
 if(!['GET','HEAD'].includes(request.method))return json({ok:false,error:'Unsupported request method'},405);
 const port=await getPortForOwner(env);
 if(!port.ok)return json({ok:false,error:port.error},port.status||502);
 const upstream=new URL(port.url);
 const suffix=Array.isArray(params.path)?params.path.join('/'):params.path||'';
 upstream.pathname='/'+suffix;
 upstream.search=incoming.search;
 const headers=new Headers();
 headers.set('X-Github-Token',env.POWERAGENT_GITHUB_TOKEN);
 headers.set('Accept',request.headers.get('Accept')||'*/*');
 if(ws){
  headers.set('Upgrade','websocket');
  const proto=request.headers.get('Sec-WebSocket-Protocol');
  if(proto)headers.set('Sec-WebSocket-Protocol',proto);
 }
 try{
  const response=await fetch(upstream.toString(),{method:request.method,headers,redirect:'manual'});
  if(ws){
   if(response.status!==101||!response.webSocket)return json({ok:false,error:'Upstream WebSocket handshake failed',status:response.status},502);
   return response;
  }
  const outHeaders=new Headers(response.headers);
  for(const h of ['set-cookie','content-security-policy','content-security-policy-report-only','x-frame-options','access-control-allow-origin','access-control-allow-credentials'])outHeaders.delete(h);
  outHeaders.set('cache-control','no-store');
  outHeaders.set('x-content-type-options','nosniff');
  outHeaders.set('referrer-policy','no-referrer');
  outHeaders.set('content-security-policy',"default-src 'self' data: blob: 'unsafe-inline' 'unsafe-eval' https: wss:; frame-ancestors 'self'");
  const location=response.headers.get('location');
  if(location){
   const u=new URL(location,upstream);
   if(u.origin===upstream.origin)outHeaders.set('location',base+u.pathname+u.search+u.hash);
   else outHeaders.delete('location');
  }
  const type=response.headers.get('content-type')||'';
  if(/text\/html/i.test(type)){
   outHeaders.delete('content-length');
   outHeaders.delete('content-encoding');
   return new HTMLRewriter()
    .on('a[href],link[href],form[action]',new AttrRewriter(['href','action']))
    .on('script[src],img[src],iframe[src],source[src]',new AttrRewriter(['src']))
    .transform(new Response(response.body,{status:response.status,headers:outHeaders}));
  }
  if(/(?:javascript|ecmascript|text\/css)/i.test(type)){
   const text=await response.text();
   outHeaders.delete('content-length');
   outHeaders.delete('content-encoding');
   return new Response(rewriteText(text),{status:response.status,headers:outHeaders});
  }
  return new Response(response.body,{status:response.status,headers:outHeaders});
 }catch{return json({ok:false,error:'Secure browser gateway could not connect'},502)}
}
