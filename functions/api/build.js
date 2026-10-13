const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
export async function onRequestPost({request,env}){
 if(!env.GEMINI_API_KEY)return respond({error:"GEMINI_API_KEY secret is missing."},503);
 if(!request.headers.get("content-type")?.includes("application/json"))return respond({error:"JSON required."},415);
 let data;try{const raw=await request.text();if(raw.length>9000)return respond({error:"Request too large."},413);data=JSON.parse(raw)}catch{return respond({error:"Invalid JSON."},400)}
 const prompt=data?.prompt;if(typeof prompt!=="string"||!prompt.trim()||prompt.length>3500)return respond({error:"Enter a project idea under 3500 characters."},400);
 const instructions="You are a senior frontend engineer. Build a complete, visually premium, accessible, responsive standalone website from the user's request. Return ONLY a JSON object with keys index.html, styles.css, script.js, each containing a UTF-8 string of the full file. The HTML MUST link styles.css and script.js with relative paths. The JavaScript MUST match HTML selectors and implement real client-side behavior where possible; do not pretend forms send messages. Do not use remote libraries or external assets. Use semantic HTML. Do not include markdown fences or extra commentary. Do not include secrets. User request: "+prompt.trim();
 const model=env.GEMINI_MODEL||"gemini-2.5-flash";const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),45000);
 try{
  const r=await fetch("https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent",{method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},body:JSON.stringify({contents:[{role:"user",parts:[{text:instructions}]}],generationConfig:{maxOutputTokens:8192,responseMimeType:"application/json"}})});
  if(!r.ok)return respond({error:r.status===429?"Gemini quota reached. Try later.":"AI provider error ("+r.status+")."},r.status===429?429:502);
  const result=await r.json();let raw=result?.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("")||"";raw=raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/i,"").replace(/\s*\x60\x60\x60$/,"");
  let files;try{files=JSON.parse(raw)}catch{return respond({error:"AI returned incomplete JSON. Try a smaller project description."},502)}
  if(!files||["index.html","styles.css","script.js"].some(k=>typeof files[k]!=="string"||!files[k].trim()))return respond({error:"AI did not return all three files. Try again."},502);
  if(Object.values(files).some(x=>x.length>150000))return respond({error:"Generated project is too large."},502);
  return respond({files:{"index.html":files["index.html"],"styles.css":files["styles.css"],"script.js":files["script.js"]}});
 }catch(e){return respond({error:e?.name==="AbortError"?"Build timed out. Try a smaller request.":"Could not generate project."},502)}finally{clearTimeout(timer)}
}