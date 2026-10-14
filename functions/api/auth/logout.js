import {json,sameOrigin,authorized} from './_lib.js';
import {stopForLogout} from '../cloud-browser.js';
export async function onRequestPost({request,env}){
  if(!sameOrigin(request))return json({ok:false,error:'Invalid origin'},403);
  if(!await authorized(request,env))return json({ok:false,error:'Unauthorized'},401);
  const stop=await stopForLogout(env);
  if(stop.error&&stop.status!==503&&stop.status!==404)return json({ok:false,error:'Browser could not be stopped. Please retry or stop it in GitHub before leaving.'},502);
  return json({ok:true,browserStop:stop.error?'not_configured':'requested'},200,{'set-cookie':'pa_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'});
}
