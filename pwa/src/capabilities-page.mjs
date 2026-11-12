import {createThemeController} from './theme.mjs?v=0.11.23';
import {CITY_PREFERENCE,cityPreference,recentDetectedCity} from './city-profiles.mjs?v=0.11.23';

let theme='system';try{theme=JSON.parse(localStorage.getItem('foama.settings.v1')||'{}').theme;}catch{}
createThemeController({preference:theme});
const table=document.getElementById('capabilitiesTable');
function show(city){
 const selected=['wien','graz','linz','salzburg'].includes(city)?city:'all';
 for(const cell of table.querySelectorAll('[data-city-column]'))cell.hidden=selected!=='all'&&cell.dataset.cityColumn!==selected;
 for(const button of document.querySelectorAll('[data-city-view]'))button.setAttribute('aria-pressed',String(button.dataset.cityView===selected));
 table.classList.toggle('single-city',selected!=='all');
}
for(const cell of table.querySelectorAll('td'))if(['Verfügbar','Nach Aktivierung'].includes(cell.textContent))cell.classList.add('available');
for(const button of document.querySelectorAll('[data-city-view]'))button.addEventListener('click',()=>show(button.dataset.cityView));
let initial=new URL(location.href).searchParams.get('stadt');
if(!initial&&matchMedia('(max-width: 600px)').matches){try{initial=cityPreference(JSON.parse(localStorage.getItem(CITY_PREFERENCE)));if(initial==='auto')initial=recentDetectedCity();}catch{initial='wien';}}
show(initial||'all');

function revealFaq(id=location.hash.slice(1)){
 const faq=document.getElementById(id);if(faq?.matches('.capabilities-explanations details'))faq.open=true;
}
for(const link of document.querySelectorAll('a[href^="#"]'))link.addEventListener('click',()=>revealFaq(link.getAttribute('href').slice(1)));
window.addEventListener('hashchange',()=>revealFaq());revealFaq();
