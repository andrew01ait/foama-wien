import {createThemeController} from './theme.mjs?v=0.11.16';
import './install.mjs?v=0.11.16';

let theme='system';
try{theme=JSON.parse(localStorage.getItem('foama.settings.v1')||'{}').theme;}catch{}
createThemeController({preference:theme});

// Installation uses the existing PWA identity and starts the departure monitor.
// This welcome page does not start location, monitor, route or push requests.
if('serviceWorker' in navigator&&location.protocol==='https:'){
 navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
