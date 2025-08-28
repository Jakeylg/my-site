/**

function populateYearFilter(){
const years = new Set();
items.forEach(a=> (a.years||[]).forEach(y=> years.add(String(y))));
const yearsSorted = Array.from(years).sort((a,b)=> Number(b)-Number(a));
yearsSorted.forEach(y=> yearSel.appendChild(el('option', {value:y}, y)));
}

function wire(){
q.addEventListener('input', applyFilters);
roleSel.addEventListener('change', applyFilters);
yearSel.addEventListener('change', applyFilters);
clearBtn.addEventListener('click', ()=>{
q.value=''; roleSel.value=''; yearSel.value=''; applyFilters();
});
}

function load(){
if(Array.isArray(window.ALUMNI_ITEMS)){
items = window.ALUMNI_ITEMS;
afterLoad();
return;
}
fetch(JSON_SRC).then(r=>{
if(!r.ok) throw new Error('Failed to load alumni.json');
return r.json();
}).then(data=>{
items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
afterLoad();
}).catch(err=>{
console.error(err);
items = [];
afterLoad();
});
}

function afterLoad(){
// Defensive defaults
items = items.map(a=>({
name:a.name||'',
role:a.role||'', // Intern | Bachelor | Master | PhD | Postdoc | Visitor
period:a.period||'', // e.g., 2023–2024
years:Array.isArray(a.years)?a.years:[], // e.g., [2023, 2024]
project:a.project||'', // rough description
now:a.now||'', // where/what now
destination:a.destination||'',
slug:a.slug||'' // optional link to profile.html?person=slug
}));

populateYearFilter();
wire();
filtered = items.slice();
render();
}

load();
})();