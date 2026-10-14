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
  const loginRedirect=/github\.com\/login|github\.com\/sessions|\/login\b/i.test(location);
  return json({ok:r.status===200,code:r.status,loginRedirect,authenticated:r.status===200&&!loginRedirect,details:r.status===200?'Private port responded with HTTP 200. WebSocket streaming still untested.':'Private port did not return HTTP 200. Token may not authorize forwarded ports, or the port is not ready.'});
 }catch{return json({ok:false,error:'Private port could not be reached from Cloudflare'},502)}
}
