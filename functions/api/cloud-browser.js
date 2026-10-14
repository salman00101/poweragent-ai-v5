import {json,authorized,sameOrigin} from './auth/_lib.js';
const repo='salman00101/poweragent-ai-v5';
const headers=token=>({'authorization':'Bearer '+token,'accept':'application/vnd.github+json','x-github-api-version':'2022-11-28','user-agent':'PowerAgent-Owner'});
async function call(env,path,method='GET'){
  if(!env.POWERAGENT_GITHUB_TOKEN)return {error:'GitHub authorization not configured',status:503};
  try{
    const r=await fetch('https://api.github.com'+path,{method,headers:headers(env.POWERAGENT_GITHUB_TOKEN)});
    const data=await r.json().catch(()=>({}));
    if(!r.ok)return {error:r.status===401?'GitHub token expired or invalid':r.status===403?'GitHub permission or usage limit':r.status===404?'Codespace not found':'GitHub request failed',status:r.status};
    return {data};
  }catch{return {error:'Cannot reach GitHub API',status:502}}
}
async function chosen(env){
  const r=await call(env,'/user/codespaces?per_page=100');
  if(r.error)return r;
  const list=(r.data.codespaces||[]).filter(x=>x.repository?.full_name?.toLowerCase()===repo.toLowerCase());
  if(!list.length)return {error:'No existing PowerAgent Codespace found. Create one in GitHub first.',status:404};
  const c=list.find(x=>x.state==='Available')||list[0];
  return {codespace:c};
}
export async function onRequestGet({request,env}){
  if(!await authorized(request,env))return json({ok:false,error:'Unauthorized'},401);
  const r=await chosen(env);if(r.error)return json({ok:false,error:r.error},r.status);
  return json({ok:true,name:r.codespace.name,state:r.codespace.state,web_url:r.codespace.web_url||null});
}
export async function onRequestPost({request,env}){
  if(!await authorized(request,env))return json({ok:false,error:'Unauthorized'},401);
  if(!sameOrigin(request))return json({ok:false,error:'Invalid origin'},403);
  let body;try{body=await request.json()}catch{return json({ok:false,error:'Invalid request'},400)}
  if(!['start','stop'].includes(body?.action))return json({ok:false,error:'Invalid action'},400);
  const r=await chosen(env);if(r.error)return json({ok:false,error:r.error},r.status);
  const c=r.codespace;
  if(body.action==='start'&&['Available','Starting'].includes(c.state))return json({ok:true,state:c.state});
  if(body.action==='stop'&&['Shutdown','ShuttingDown'].includes(c.state))return json({ok:true,state:c.state});
  const a=await call(env,'/user/codespaces/'+encodeURIComponent(c.name)+'/'+body.action,'POST');
  if(a.error)return json({ok:false,error:a.error},a.status);
  return json({ok:true,state:body.action==='start'?'Starting':'ShuttingDown'});
}
export async function stopForLogout(env){
  const r=await chosen(env);
  if(r.error)return r;
  if(['Shutdown','ShuttingDown'].includes(r.codespace.state))return {ok:true};
  const a=await call(env,'/user/codespaces/'+encodeURIComponent(r.codespace.name)+'/stop','POST');
  return a.error?a:{ok:true};
}

export async function getPortForOwner(env){
 const r=await chosen(env);if(r.error)return {ok:false,error:'Codespace lookup failed: '+r.error,status:r.status};
 if(r.codespace.state!=='Available')return {ok:false,error:'Codespace is not ready',status:409};
 const p=await call(env,'/user/codespaces/'+encodeURIComponent(r.codespace.name)+'/ports');
 if(p.error)return {ok:false,error:'Port lookup failed: '+p.error+' (HTTP '+p.status+'). Start/Stop access may work even if port access is restricted.',status:p.status};
 const port=(p.data.ports||[]).find(x=>Number(x.port)===3000);
 if(!port?.forwarded_address)return {ok:false,error:'Port 3000 is not forwarded yet. Check container startup.',status:404};
 let url;try{url=new URL(port.forwarded_address)}catch{return {ok:false,error:'Invalid port URL',status:502}}
 if(url.protocol!=='https:'||!url.hostname.endsWith('.app.github.dev'))return {ok:false,error:'Unexpected port host',status:502};
 if(port.visibility&&port.visibility!=='private')return {ok:false,error:'Port 3000 must be Private',status:403};
 return {ok:true,url:url.toString()};
}
