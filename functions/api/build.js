const headers={"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store"};
const respond=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
export async function onRequestPost({request,env}){
 if(!env.GEMINI_API_KEY)return respond({error:"GEMINI_API_KEY secret is missing."},503);
 if(!request.headers.get("content-type")?.includes("application/json"))return respond({error:"JSON required."},415);
 let data;try{const raw=await request.text();if(raw.length>9000)return respond({error:"Request too large."},413);data=JSON.parse(raw)}catch{return respond({error:"Invalid JSON."},400)}
 const prompt=data?.prompt;if(typeof prompt!=="string"||!prompt.trim()||prompt.length>3500)return respond({error:"Enter a project idea under 3500 characters."},400);
 const instructions=[
 "ROLE: You are an award-winning creative frontend developer and strict QA reviewer. Deliver a production-quality, cohesive, distinctive website, NOT a generic template.",
 "OUTPUT: Respond with exactly one JSON object containing three string keys: index.html, styles.css, script.js. No markdown or other text.",
 "VISUAL QUALITY: Create a polished art-directed aesthetic appropriate to the user's specific project. Use sophisticated typography using system font stacks, purposeful layout rhythm, strong visual hierarchy, well-composed whitespace, refined borders, layered gradients, meaningful color palette, compelling hero, elegant cards, microinteractions, and original CSS graphics/illustrations. Avoid repetitive purple SaaS dashboards unless specifically requested. Mobile should look designed, not merely shrunk.",
 "IMPLEMENTATION: index.html must contain complete semantic HTML and link relative styles.css and script.js (script defer). styles.css must be comprehensive, responsive, and include hover, focus-visible, and reduced-motion support. script.js must be complete valid vanilla JS, selectors MUST match actual HTML. All navigation and interactive controls should function; if a feature needs a backend, clearly indicate it is a demo and do not fake submissions. Use realistic relevant copy instead of lorem ipsum.",
 "DEPENDENCIES: No external libraries, remote images, fonts, or external assets. Use inline SVG or CSS shapes for visual interest. No secrets, no trackers, no external API calls.",
 "QA: Before returning, mentally check: exact file names, matching CSS/JS selectors, valid JS, responsive navigation, button behaviors, HTML links to assets, and no missing sections. Provide substantial useful content, not a wireframe.",
 "SCOPE: Generate a polished, complete ONE-PAGE website with hero, 2-3 sections, footer and small working interactions. Keep the total output concise: HTML under 2500 words, CSS under 3000 words, JS under 800 words. Do not add explanations. Quality over size.",
 "USER REQUEST: "+prompt.trim()
 ].join("\n");
 const model=env.GEMINI_MODEL||"gemini-2.5-flash";const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),85000);
 try{
  const endpoint="https://generativelanguage.googleapis.com/v1beta/models/"+encodeURIComponent(model)+":generateContent";
  const options={method:"POST",signal:controller.signal,headers:{"Content-Type":"application/json","x-goog-api-key":env.GEMINI_API_KEY},body:JSON.stringify({contents:[{role:"user",parts:[{text:instructions}]}],generationConfig:{maxOutputTokens:6000,responseMimeType:"application/json"}})};
  let r;
  for(let attempt=0;attempt<2;attempt++){
   r=await fetch(endpoint,options);
   if(![500,502,503,504].includes(r.status)||attempt===1)break;
   await r.body?.cancel();
   await new Promise(resolve=>setTimeout(resolve,1000*(attempt+1)));
  }
  if(!r.ok){
   const message=r.status===429?"Gemini quota reached. Wait for quota reset.":r.status===503?"Gemini is temporarily unavailable or overloaded. Please retry later.":r.status===404?"Gemini model not found. Check GEMINI_MODEL in Cloudflare.":"Gemini API returned status "+r.status+".";
   return respond({error:message},r.status===429?429:502);
  }
  const result=await r.json();let raw=result?.candidates?.[0]?.content?.parts?.map(x=>x.text||"").join("")||"";raw=raw.trim().replace(/^\x60\x60\x60(?:json)?\s*/i,"").replace(/\s*\x60\x60\x60$/,"");
  let files;try{files=JSON.parse(raw)}catch{return respond({error:"AI returned incomplete JSON. Try a smaller project description."},502)}
  if(!files||["index.html","styles.css","script.js"].some(k=>typeof files[k]!=="string"||!files[k].trim()))return respond({error:"AI did not return all three files. Try again."},502);
  if(Object.values(files).some(x=>x.length>150000))return respond({error:"Generated project is too large."},502);
  return respond({files:{"index.html":files["index.html"],"styles.css":files["styles.css"],"script.js":files["script.js"]}});
 }catch(e){return respond({error:e?.name==="AbortError"?"Gemini took too long (85 seconds). The provider may be overloaded; retry later or use a faster available model.":"Could not generate project."},502)}finally{clearTimeout(timer)}
}