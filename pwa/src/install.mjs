// The browser decides when a native PWA installation prompt is available.
let installPrompt=null;
const panels=[...document.querySelectorAll('[data-install-panel]')];
const buttons=[...document.querySelectorAll('[data-install-app]')];
function installed(){
  return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
}
function update(){
  for(const panel of panels)panel.hidden=installed();
  for(const button of buttons)button.hidden=!installPrompt||installed();
}
window.addEventListener('beforeinstallprompt',event=>{
  event.preventDefault();installPrompt=event;update();
});
window.addEventListener('appinstalled',()=>{
  installPrompt=null;for(const panel of panels)panel.hidden=true;
});
for(const button of buttons)button.addEventListener('click',async()=>{
  if(!installPrompt)return;
  const prompt=installPrompt;installPrompt=null;update();
  try{await prompt.prompt();await prompt.userChoice;}catch{
    // Browser-menu instructions remain available if the prompt is dismissed.
  }
});
matchMedia('(display-mode: standalone)').addEventListener('change',update);
update();
