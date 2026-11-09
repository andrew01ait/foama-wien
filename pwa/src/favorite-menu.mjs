// Transient action menus are separate from the persistent notice disclosures.
export function createFavoriteMenuController({root,document:doc=globalThis.document}){
 let openKey=null;
 const menus=()=>Array.from(root.querySelectorAll('.favorite-menu'));
 const close=()=>{openKey=null;for(const menu of menus())menu.open=false;};
 const onSummary=event=>{
  const summary=event.target.closest?.('.favorite-menu > summary'),menu=summary?.parentElement;
  if(!menu||!root.contains(menu))return;
  event.preventDefault();const opening=!menu.open;close();
  if(opening){openKey=menu.dataset.favoriteMenu;menu.open=true;}
 };
 const onToggle=event=>{
  const menu=event.target,key=menu.dataset?.favoriteMenu;
  // A redraw can deliver a queued toggle from a removed element.
  if(key===undefined||!root.contains(menu))return;
  if(menu.open){openKey=key;for(const other of menus())if(other!==menu)other.open=false;}
  else if(openKey===key)openKey=null;
 };
 const onOutside=event=>{const menu=event.target.closest?.('.favorite-menu');if(!menu||!root.contains(menu))close();};
 const onKey=event=>{
  if(event.key!=='Escape'||openKey===null)return;
  const menu=menus().find(item=>item.open&&item.dataset.favoriteMenu===openKey);close();
  if(menu){event.preventDefault();menu.querySelector('summary')?.focus({preventScroll:true});}
 };
 root.addEventListener('click',onSummary);root.addEventListener('toggle',onToggle,true);doc.addEventListener('click',onOutside);doc.addEventListener('keydown',onKey);
 return {isOpen:key=>openKey===key,close,destroy(){root.removeEventListener('click',onSummary);root.removeEventListener('toggle',onToggle,true);doc.removeEventListener('click',onOutside);doc.removeEventListener('keydown',onKey);}};
}
