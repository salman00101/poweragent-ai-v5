import {json,authorized} from './auth/_lib.js';
import {getPortForOwner} from './cloud-browser.js';

// Checks whether the existing server-side token can authenticate to the
// private Codespaces forwarded port. Never returns the token or page content.
export async function onRequestGet({request,env}){
 if(!await authorized(request,env))return json({ok:false,error:'Unauthorized'},401);
 if(!env.POWERAGENT_GITHUB_TOKEN)return json({ok:false,error:'GitHub token not configured'},503);
 const port=await getPortForOwner(env);
 if(!port.ok)return json({ok:false,error:port.error},port.status||502);
 try{
  const r=await fetch(port.url,{method:'GET',redirect:'manual',headers:{'X-Github-Token':env.POWERAGENT_GITHUB_TOKEN,'Accept':'text/html'},signal:AbortSignal.timeout(12000)});
  const location=r.headers.get('location')||'';
  const html=(r.headers.get('content-type')||'').includes('text/html')?await r.text():'';
  const warning=/about to access a development port|codespaces access port|served by someone.s codespace/i.test(html);
  const chromium=/kasmvnc|linuxserver|chromium/i.test(html);
  const loginRedirect=/github\.com\/login|github\.com\/sessions|\/login\b/i.test(location);
  return json({ok:r.status===200&&!warning&&!loginRedirect&&chromium,code:r.status,loginRedirect,warning,chromium,authenticated:r.status===200&&!warning&&!loginRedirect&&chromium,details:warning?'GitHub Codespaces port warning page was returned, not Chromium.':chromium?'Chromium HTML detected; WebSocket streaming remains untested.':'HTTP response was not confirmed to be Chromium.'});
 }catch{return json({ok:false,error:'Private port could not be reached from Cloudflare'},502)}
}
