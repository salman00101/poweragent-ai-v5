const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
export async function onRequestGet({env}){
 if(!env.GEMINI_API_KEY)return reply({ok:false,error:"Gemini API key is not configured"},503);
 const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),15000);
 try{
  const res=await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100",{headers:{"x-goog-api-key":env.GEMINI_API_KEY},signal:controller.signal});
  if(!res.ok)return reply({ok:false,status:res.status,category:res.status===429?"quota":res.status===403?"permission":"provider_error"},502);
  const data=await res.json();
  const models=(data.models||[]).filter(m=>(m.supportedGenerationMethods||[]).includes("generateContent")).map(m=>({name:m.name.replace(/^models\\//,""),displayName:m.displayName||m.name,outputTokenLimit:m.outputTokenLimit||null}));
  return reply({ok:true,models,note:"Listed models are not guaranteed to have remaining quota."});
 }catch(e){return reply({ok:false,category:e.name==="AbortError"?"timeout":"network_error"},502)}finally{clearTimeout(timer)}
}