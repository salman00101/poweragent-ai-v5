import {json,authorized} from './auth/_lib.js';
import {getPortForOwner} from './cloud-browser.js';
export async function onRequestGet({request,env}){
 if(!await authorized(request,env))return json({ok:false,error:'Unauthorized'},401);
 const r=await getPortForOwner(env);
 return json(r,r.ok?200:(r.status||502));
}
