export const themePreference=value=>['system','dark','light'].includes(value)?value:'system';
export function createThemeController({doc=document,win=window,preference='system'}={}){
 let selected=themePreference(preference);
 const media=win.matchMedia?.('(prefers-color-scheme: dark)')||{matches:false};
 function apply(){
  const effective=selected==='system'?(media.matches?'dark':'light'):selected;
  doc.documentElement.dataset.theme=effective;doc.documentElement.style.colorScheme=effective;
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content',effective==='dark'?'#0e2538':'#edf4f7');
  for(const button of doc.querySelectorAll('[data-theme-choice]'))button.setAttribute('aria-pressed',String(button.dataset.themeChoice===selected));
  return effective;
 }
 const changed=()=>{if(selected==='system')apply();};
 if(media.addEventListener)media.addEventListener('change',changed);else media.addListener?.(changed);
 apply();
 return {set(value){selected=themePreference(value);return apply();},get preference(){return selected;},get effective(){return doc.documentElement.dataset.theme;},
  dispose(){if(media.removeEventListener)media.removeEventListener('change',changed);else media.removeListener?.(changed);}};
}
