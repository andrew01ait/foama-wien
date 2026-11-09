import {motionSample,motionQuiet,mayRest,stillPosition,SENSOR_GAP_MS,POSITION_CHECK_MS,FRESH_FIX_MS} from './motion-state.mjs?v=0.6.7';

// Permission inspection never requests or records a position.
export function locationEnvironment(nav=navigator,doc=document,win=window){
  let policyAllowed=null;
  try{const policy=doc.permissionsPolicy||doc.featurePolicy;if(policy?.allowsFeature)policyAllowed=policy.allowsFeature('geolocation');}catch{}
  let embedded=false;try{embedded=win.top!==win.self;}catch{embedded=true;}
  return {supported:!!nav.geolocation,secureContext:win.isSecureContext!==false,policyAllowed,embedded};
}
export function locationMessage(info){
  const messages={
    ready:['Standort aktivieren','Tippe auf den Knopf und erlaube den Standort im Browser. Nur bei sichtbarer App wird der Standort aktualisiert.'],
    requesting:['Standort wird angefragt …','Falls eine Abfrage erscheint, erlaube den Standort. Die erste Position kann einige Sekunden dauern.'],
    active:['Standort aktiv','Ortung nur bei sichtbarer App. Nahe Stationen werden bei tatsächlicher Bewegung neu berechnet.'],
    paused:['Standort pausiert','Keine Ortung im Hintergrund.'],
    unsupported:['Dieser Browser bietet keinen Standortzugriff','Öffne foama-wien direkt in Chrome oder in der installierten PWA. Favoriten und manuelle Haltestellen bleiben nutzbar.'],
    insecure:['Standort benötigt HTTPS','Öffne die öffentliche HTTPS-Adresse von foama-wien.'],
    policy:['Standort durch Browser-Umgebung gesperrt','Die Einbettung erlaubt keine Standortabfrage. Öffne die Website direkt in Chrome oder als installierte PWA.'],
    denied:['Standortfreigabe blockiert','Der Browser meldet „nicht erlaubt“. Prüfe die Website-Berechtigung für Standort und die Android-Berechtigung des Browsers. Wenn keine Frage erscheint: Öffne den Link direkt in Chrome (⋮ → Im Browser öffnen).'],
    unavailable:['Noch keine Position verfügbar','Schalte den Android-Standort ein und versuche es an einem Ort mit besserem Empfang erneut.'],
    timeout:['Standortabfrage hat zu lange gedauert','Prüfe den Android-Standort und tippe erneut auf „Standort aktivieren“.'],
    inaccurate:['Standort nur ungefähr','In der U-Bahn oder in Gebäuden ist die Ortung oft ungenau. Wir zeigen die ungefähre oder letzte brauchbare Position. Erreichbarkeit bleibt ungewiss.'],
    error:['Standort konnte nicht ermittelt werden','Öffne die Website direkt in Chrome und prüfe die Standortberechtigung.']
  };
  const [title,detail]=messages[info.phase]||messages.error;
  return {title,detail,isError:['unsupported','insecure','policy','denied','unavailable','timeout','inaccurate','error'].includes(info.phase)};
}
export function createLocationController({nav=navigator,doc=document,win=window,onPosition=()=>{},onState=()=>{},
 onBatteryState=()=>{},batterySaving=false,now=()=>Date.now(),setTimer=setTimeout,clearTimer=clearTimeout}={}){
  let enabled=false,watchId=null,generation=0,requested=false,permission='unknown';
  let sensor=null,sensorGeneration=0,sensorFailure='',motion={},stationary={},quietChecked=false,resting=false,restTimer=null,healthTimer=null,batteryState='';
  const report=(phase,extra={})=>onState({phase,permission,...locationEnvironment(nav,doc,win),...extra});
  function battery(value){if(value!==batteryState){batteryState=value;onBatteryState(value);}}
  function clearWatch(){generation++;if(watchId!==null)nav.geolocation?.clearWatch(watchId);watchId=null;}
  function cancelRest(){clearTimer(restTimer);restTimer=null;resting=false;}
  function stopSensor(){sensorGeneration++;clearTimer(healthTimer);healthTimer=null;try{sensor?.stop();}catch{}sensor=null;motion={};stationary={};quietChecked=false;}
  function pause(){cancelRest();clearWatch();stopSensor();battery(batterySaving?(enabled?'paused':'waiting-location'):'off');}
  function wake(){if(!resting)return;cancelRest();startWatch(true);}
  function sensorFailed(reason){sensorFailure=reason;stopSensor();battery(reason);wake();}
  function startSensor(){
    if(!batterySaving||!enabled||doc.hidden||sensor)return;
    if(sensorFailure){battery(sensorFailure);return;}
    if(typeof win.Accelerometer!=='function'){sensorFailed('unsupported');return;}
    const current=++sensorGeneration,startedAt=now();battery('checking');
    try{
      sensor=new win.Accelerometer({frequency:2});
      sensor.onreading=()=>{
        if(current!==sensorGeneration||doc.hidden||!enabled)return;
        motion=motionSample(motion,sensor,now());
        if(motion.at==null){sensorFailed('unavailable');return;}
        if(motion.disturbed){stationary={blockedUntil:stationary.blockedUntil||0};quietChecked=false;wake();}
        // Some browsers emit watch callbacks only after displacement. Request one
        // fresh confirming fix after a quiet minute, never assume a cached fix is current.
        if(!resting&&!quietChecked&&motionQuiet(motion,now())&&stationary.anchor&&
          now()>=(stationary.blockedUntil||0)&&now()-stationary.last.timestamp>FRESH_FIX_MS){
          quietChecked=true;clearWatch();startWatch(true);
        }
      };
      sensor.onerror=event=>{
        if(current===sensorGeneration)sensorFailed(event?.error?.name==='NotAllowedError'?'blocked':'unavailable');
      };
      sensor.start();
      const checkHealth=()=>{
        healthTimer=null;if(current!==sensorGeneration||doc.hidden||!enabled)return;
        if(now()-(motion.at??startedAt)>SENSOR_GAP_MS){sensorFailed('unavailable');return;}
        healthTimer=setTimer(checkHealth,2_000);
      };
      healthTimer=setTimer(checkHealth,2_000);
    }catch(error){sensorFailed(error?.name==='SecurityError'||error?.name==='NotAllowedError'?'blocked':'unavailable');}
  }
  function restIfSafe(){
    if(!sensor||!mayRest(motion,stationary,now()))return;
    clearWatch();quietChecked=true;resting=true;battery('resting');
    restTimer=setTimer(()=>{restTimer=null;if(enabled&&!doc.hidden)wake();},Math.max(1_000,stationary.last.timestamp+POSITION_CHECK_MS-now()));
  }
  function startWatch(fresh=false){
    if(!enabled||doc.hidden||watchId!==null||resting)return;
    if(sensor)battery('checking');
    report('requesting');const current=++generation;
    try{
      const id=nav.geolocation.watchPosition(position=>{
        if(doc.hidden||current!==generation)return;
        permission='granted';
        const accuracy=position.coords.accuracy;
        const fix={lat:position.coords.latitude,lon:position.coords.longitude,accuracy,timestamp:position.timestamp||now(),speed:position.coords.speed};
        stationary=stillPosition(stationary,fix,now());
        report(accuracy>150?'inaccurate':'active');
        onPosition(fix);restIfSafe();
      },error=>{
        if(doc.hidden||current!==generation)return;
        const code=Number(error?.code)||0;stationary={};
        if(code===1){permission='denied';enabled=false;pause();}
        report(code===1?'denied':code===2?'unavailable':code===3?'timeout':'error',{errorCode:code});
      },{enableHighAccuracy:false,maximumAge:fresh?0:30_000,timeout:20_000});
      if(current===generation)watchId=id;else nav.geolocation.clearWatch(id);
    }catch{enabled=false;pause();report('error');}
  }
  function start(fresh=false){
    if(!enabled||doc.hidden)return;
    const env=locationEnvironment(nav,doc,win);
    if(!env.supported){enabled=false;report('unsupported');return;}
    if(!env.secureContext){enabled=false;report('insecure');return;}
    if(env.policyAllowed===false){enabled=false;report('policy');return;}
    startWatch(fresh);if(enabled)startSensor();
  }
  return {
    async init(){
      battery(batterySaving?'waiting-location':'off');
      try{const result=await nav.permissions?.query({name:'geolocation'});permission=result?.state||'unknown';}catch{}
      if(requested)return;
      const env=locationEnvironment(nav,doc,win);
      if(!env.supported)return report('unsupported');
      if(!env.secureContext)return report('insecure');
      if(env.policyAllowed===false)return report('policy');
      if(permission==='granted'){enabled=true;start();}
      else report(permission==='denied'?'denied':'ready');
    },
    request(){requested=true;pause();enabled=true;start(true);},
    setBatterySaving(value){
      batterySaving=value===true;cancelRest();stopSensor();sensorFailure='';
      battery(batterySaving?'waiting-location':'off');
      if(enabled&&!doc.hidden)start(true);
    },
    pause,
    resume(){start();},
    stop(){enabled=false;pause();},
    get enabled(){return enabled;}
  };
}
