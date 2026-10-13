(()=>{
const hero=document.querySelector('.hero');const composer=document.querySelector('.composer');const prompt=document.getElementById('prompt');const builder=document.getElementById('builder');
if(!hero||!composer||!prompt)return;
const kicker=document.createElement('div');kicker.className='studio-kicker';kicker.textContent='Your ideas. Beautifully built.';hero.insertBefore(kicker,hero.querySelector('.orb-stage'));
const quick=document.createElement('div');quick.className='quick-prompts';quick.setAttribute('aria-label','Website prompt suggestions');
const samples=[
 ['✦ Creative portfolio','Build a bold, editorial portfolio for a creative designer, with large typography, selected work cards, about section and a contact call to action.'],
 ['◈ Modern restaurant','Create an elegant restaurant website with a striking hero, food menu, story section, opening hours and a reservation call to action.'],
 ['⌘ SaaS landing page','Design a premium software landing page with product benefits, feature cards, pricing tiers, FAQ and clear signup calls to action.'],
 ['◇ Fashion boutique','Create a minimal luxury fashion boutique website with editorial collections, featured products and a brand story.']
];
samples.forEach(([label,value])=>{const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>{prompt.value=value;prompt.focus();prompt.setSelectionRange(value.length,value.length);document.querySelector('#builder')?.scrollIntoView({behavior:'smooth',block:'nearest'});});quick.append(button)});
hero.append(quick);
const footer=document.createElement('footer');footer.className='studio-footer';footer.innerHTML='<span>✦ POWERAGENT STUDIO · V5</span><span>AI-assisted building · Browser-based workspace</span>';document.querySelector('.main')?.append(footer);
const nav=document.querySelector('.nav');
nav?.querySelectorAll('button[data-tab]').forEach(button=>button.addEventListener('click',()=>{
const name=button.dataset.tab;
if(name==='Projects'){builder?.scrollIntoView({behavior:'smooth',block:'start'});}
if(name==='Command Center'){hero.scrollIntoView({behavior:'smooth',block:'start'});}
}));
})();
