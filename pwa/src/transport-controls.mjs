export const MODE_CHOICES=[['metro','U-Bahn'],['tram','Tram'],['bus','Bus'],['sbahn','S-Bahn'],['regional','Regional'],['long','Fernverkehr']];
const paths={
 metro:'<circle cx="12" cy="12" r="10"/><path d="M7 6v7a5 5 0 0 0 10 0V6"/>',
 tram:'<path d="m8 3 8-2M12 2v3M7 19l-2 3m12-3 2 3M5 10h14"/><rect x="5" y="5" width="14" height="14" rx="3"/><path d="M8 15h1m6 0h1"/>',
 bus:'<rect x="4" y="3" width="16" height="16" rx="3"/><path d="M4 9h16M12 3v6M7 19v2m10-2v2M7 15h1m8 0h1"/>',
 sbahn:'<circle cx="12" cy="12" r="10"/><path d="M16 7c-2-2-8-2-8 2 0 4 8 2 8 6 0 4-6 4-9 2"/>',
 regional:'<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 9h14M12 3v6M8 14h1m6 0h1M8 18l-3 4m11-4 3 4M7 21h10"/>',
 long:'<path d="M3 17h18l-5-8H3V5h11c3 0 5 2 7 5l1 5v4H3zM8 9v4m5-4v4M3 13h16M6 22h12"/>'
};
export function vehicleSymbolMarkup(mode){
 const kind=mode==='bus'?'bus':mode==='tram'?'tram':mode==='long'?'long':'regional';
 return `<svg class="vehicle-symbol" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[kind]}</svg>`;
}
export function modeButtonMarkup(mode,enabled,{compact=false}={}){
 const choice=MODE_CHOICES.find(([key])=>key===mode);if(!choice)return '';
 const label=choice[1],icon=`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${paths[mode]}</svg>`;
 return `<button type="button" class="${compact?'compact-mode':'chip'} ${enabled?'enabled':''}" data-mode="${mode}" aria-label="${label}" title="${label} ${enabled?'ausschalten':'einschalten'}" aria-pressed="${Boolean(enabled)}">${icon}${compact?'<span class="mode-check" aria-hidden="true">✓</span>':`<span>${label}</span>`}</button>`;
}
export function compactFiltersMarkup(modes,radius){
 return `<div class="compact-modes" role="group" aria-label="Verkehrsmittel schnell umschalten · Suchradius ${Number(radius)||300} m">${MODE_CHOICES.map(([mode])=>modeButtonMarkup(mode,modes[mode]!==false,{compact:true})).join('')}</div>`;
}
export function bindModeToggles(root,onToggle){
 root.addEventListener('click',event=>{
  const button=event.target.closest('[data-mode]');if(!button||!root.contains(button)||!MODE_CHOICES.some(([mode])=>mode===button.dataset.mode))return;
  event.preventDefault();event.stopPropagation();onToggle(button.dataset.mode);
 });
}
export function bindLocationDisclosure(button,body,chevron){
 let expanded=false;
 const render=()=>{body.hidden=!expanded;button.setAttribute('aria-expanded',String(expanded));chevron.textContent=expanded?'⌃':'⌄';};
 render();button.addEventListener('click',()=>{expanded=!expanded;render();});
}
