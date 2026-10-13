const LIMIT = 8000;
export async function onRequestPost({request,env}) {
  try {
    if (!env.GEMINI_API_KEY) return json({error:"Server secret GEMINI_API_KEY is not configured."},503);
    if (request.headers.get("content-type")?.split(";")[0]?.trim() !== "application/json") return json({error:"Send JSON."},415);
    const raw=await request.text();
    if(raw.length>LIMIT) return json({error:"Request too large."},413);
    let body; try {body=JSON.parse(raw)} catch {return json({error:"Invalid JSON."},400)}
    const prompt=body?.prompt;
    if(typeof prompt!=="string"||!prompt.trim()||prompt.length>4000) return json({error:"Prompt must contain 1–4000 characters."},400);
    const model=env.GEMINI_MODEL||"gemini-2.5-flash";
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),25000);
    let response;
    try {response=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{
      method:"POST",signal:controller.signal,
      headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},
      body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt.trim()}]}],generationConfig:{maxOutputTokens:1200}})
    })} finally {clearTimeout(timeout)}
    if(!response.ok) {
      if(response.status===429) return json({error:"AI quota reached. Try again later."},429);
      if(response.status===401||response.status===403) return json({error:"AI credentials or access not accepted. Check Cloudflare secret and provider permissions."},502);
      return json({error:"AI provider returned an error ("+response.status+")."},502);
    }
    const data=await response.json();
    const answer=data?.candidates?.[0]?.content?.parts?.filter(p=>typeof p.text==="string").map(p=>p.text).join("\n").trim();
    if(!answer) return json({error:"AI returned no text. Please rephrase and try again."},502);
    return json({answer});
  } catch(e) {return json({error:e?.name==="AbortError"?"AI request timed out.":"Could not complete the AI request."},502)}
}
function json(data,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}})}
