// alumni.js
(function(){
  // Tell the script where to find your JSON
  const JSON_SRC = 'alumni.json?v=1'; // add ?v=1 to bust cache on first deploy

  // Small helper to make elements
  const el = (tag, attrs={}, children=[])=>{
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{
      if(k==='class') n.className=v;
      else if(k==='html') n.innerHTML=v;
      else if(k.startsWith('on') && typeof v==='function') n[k]=v;
      else n.setAttribute(k, v);
    });
    (Array.isArray(children)?children:[children]).filter(Boolean).forEach(c=>{
      n.appendChild(typeof c==='string' ? document.createTextNode(c) : c);
    });
    return n;
  };

  // Grab the page elements
  const listEl  = document.getElementById('alumni-list');
  const emptyEl = document.getElementById('alumni-empty');
  const q       = document.getElementById('alumni-search');
  const roleSel = document.getElementById('alumni-role');
  const yearSel = document.getElementById('alumni-year');
  const clearBtn= document.getElementById('alumni-clear');

  // State
  let items = [];
  let filtered = [];

  // Make escapeHTML available if your render uses it
  const escapeHTML = s => (s||'').replace(/[&<>\"']/g, c => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]
  ));

const normalize = s => (s||'').toString().toLowerCase();

function render(){
listEl.innerHTML = '';
if(filtered.length===0){ emptyEl.style.display='block'; return; }
emptyEl.style.display='none';

filtered.forEach(a=>{
// Build the right-hand content using your existing news-card layout (no image)
const head = el('div', {}, [
el('div', {class:'alumni-row-1'}, [
el('strong', {class:'alumni-name'}, a.name || 'Unknown'),
a.role ? el('span', {class:'badge'}, a.role) : null,
a.period ? el('span', {class:'badge'}, a.period) : null,
]),
a.project ? el('p', {class:'news-excerpt', html: escapeHTML(a.project)}) : null,
a.now ? el('p', {class:'alumni-now'}, 'Now: ' + a.now) : null,
// Optional link to current bio page
a.slug ? el('div', {class:'links-row'}, [
el('a', {class:'btn btn-gray', href:`profile.html?person=${encodeURIComponent(a.slug)}`}, 'View bio')
]) : null
]);

const card = el('article', {class:'news-card alumni-card'} , [
el('div', {class:'alumni-icon'}, [ el('span', {class:'dot', title:'Alumni'}, '') ]),
head
]);

listEl.appendChild(card);
});
}

function escapeHTML(s){
return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
}

})();