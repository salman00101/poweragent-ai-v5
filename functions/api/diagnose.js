const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}});
export async function onRequestGet({env,request}){
 if(!env.GEMINI_API_KEY)return json({ok:false,category:"configuration",message:"GEMINI_API_KEY is not configured"},503);
 const configuredModel=env.GEMINI_MODEL||"gemini-2.5-flash";
 const requested=new URL(request.url).searchParams.get("model");
 const model=requested==="gemini-2.5-flash"?"gemini-2.5-flash":configuredModel;
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),25000);const start=Date.now();
 try{
  const res=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},body:JSON.stringify({contents:[{parts:[{text:"Reply with exactly OK"}]}],generationConfig:{maxOutputTokens:64}})});
  return json({ok:res.ok,model,status:res.status,elapsedMs:Date.now()-start,test:"minimal_generation",category:res.ok?"healthy":res.status===429?"quota":res.status===503?"provider_unavailable":res.status===404?"model_not_found":"provider_error"},res.ok?200:502);
 }catch(e){return json({ok:false,model,elapsedMs:Date.now()-start,test:"minimal_generation",category:e?.name==="AbortError"?"timeout":"network_error"},502)}finally{clearTimeout(timeout)}
}