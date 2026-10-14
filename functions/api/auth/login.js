import {json,configured,passwordOK,totpOK,sessionCookie,sameOrigin} from './_lib.js';
export async function onRequestPost({request,env}){
  if(!sameOrigin(request))return json({ok:false,error:'Invalid origin'},403);
  if(!configured(env))return json({ok:false,error:'Owner login not configured'},503);
  let body;
  try{
    if(Number(request.headers.get('content-length')||0)>2048)return json({ok:false,error:'Request too large'},413);
    body=await request.json();
  }catch{return json({ok:false,error:'Invalid request'},400)}
  if(typeof body?.password!=='string'||body.password.length>256||typeof body.code!=='string')return json({ok:false,error:'Invalid credentials'},401);
  let stage='password';
  try{
    const pass=await passwordOK(body.password,env);
    stage='authenticator';
    const otp=await totpOK(body.code,env.POWERAGENT_TOTP_SECRET);
    if(!pass||!otp)return json({ok:false,error:'Invalid credentials'},401);
    stage='session';
    return json({ok:true},200,{'set-cookie':await sessionCookie(env.POWERAGENT_SESSION_SECRET)});
  }catch(e){
    // Report only the failing stage, not input values, secrets, or raw exception.
    console.error('PowerAgent auth failed at stage:',stage,'type:',e?.name||'Error');
    return json({ok:false,error:'Authentication service error',stage},503);
  }
}
