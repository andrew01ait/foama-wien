package at.foama.wien;

import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.CancellationSignal;
import android.os.Handler;
import android.os.Looper;
import java.util.*;
import java.util.concurrent.Executor;

/** Foreground-only acquisition: do not let an enabled but silent provider block GPS. */
final class WatchLocation {
    static final long FALLBACK_MS=8000, TIMEOUT_MS=30000;
    interface Callback {
        boolean onFix(Location fix);
        void onStatus(String message);
    }
    private final LocationManager manager;
    private final Handler handler;
    private final Executor executor;
    private final Callback callback;
    private final Map<String,LocationListener> listeners=new LinkedHashMap<>();
    private final List<CancellationSignal> signals=new ArrayList<>();
    private final Set<String> attempted=new HashSet<>();
    private List<String> providers=Collections.emptyList();
    private Runnable fallback,timeout;
    private int generation;
    private String settledProvider="";
    private boolean running,fineAllowed,settled,hasFix,singleFix;

    WatchLocation(LocationManager manager,Handler handler,Executor executor,Callback callback){
        this.manager=manager;this.handler=handler;this.executor=executor;this.callback=callback;
    }
    void start(boolean fine){
        start(fine,false);
    }
    void start(boolean fine,boolean once){
        stop();fineAllowed=fine;singleFix=once;
        if(manager==null){callback.onStatus("Ortung nicht verfügbar. Favoriten bleiben nutzbar.");return;}
        try{
            if(!manager.isLocationEnabled()){callback.onStatus("Standort auf der Uhr einschalten.");return;}
            ArrayList<String> enabled=new ArrayList<>();
            List<String> known=manager.getAllProviders();
            for(String p:new String[]{"fused",LocationManager.NETWORK_PROVIDER,LocationManager.GPS_PROVIDER}){
                if(p.equals(LocationManager.GPS_PROVIDER)&&!fine)continue;
                try{if(known.contains(p)&&manager.isProviderEnabled(p))enabled.add(p);}catch(RuntimeException ignored){}
            }
            providers=enabled;
        }catch(RuntimeException e){callback.onStatus("Ortung nicht verfügbar. App-Freigabe prüfen.");return;}
        if(providers.isEmpty()){callback.onStatus(fine?"Keine Ortungsquelle verfügbar. Standorteinstellungen prüfen.":"Keine ungefähre Ortung verfügbar. Genauen Standort für foama-wien erlauben.");return;}
        running=true;settled=false;settledProvider="";hasFix=false;final int current=generation;
        callback.onStatus("Position wird gesucht …");
        // Check every enabled cache, not only the primary source. Repo validates age and values.
        for(String p:providers){try{Location cached=manager.getLastKnownLocation(p);if(cached!=null)deliver(cached,p,current,false);}catch(RuntimeException ignored){}}
        if(!valid(current))return;
        fallback=()->{
            if(!valid(current)||settled)return;
            callback.onStatus(hasFix?"Standort nur ungefähr · suche weiter …":"Suche weiter · bitte kurz ins Freie gehen.");
            for(String p:providers){if(!valid(current)||settled)break;begin(p,current);}
        };
        timeout=()->{
            if(!valid(current)||settled)return;
            boolean retained=hasFix;stop();
            callback.onStatus(retained?"Kein genauer Standort. Letzte Position bleibt als ungefähr markiert. Erneut versuchen oder ins Freie gehen.":"Noch keine Position. Bitte ins Freie gehen und erneut versuchen. Favoriten bleiben nutzbar.");
        };
        handler.postDelayed(fallback,FALLBACK_MS);handler.postDelayed(timeout,TIMEOUT_MS);
        for(String p:providers){if(begin(p,current))break;}
    }
    private boolean valid(int current){return running&&current==generation;}
    private boolean begin(String provider,int current){
        if(!valid(current)||!attempted.add(provider))return false;
        LocationListener listener=new LocationListener(){
            @Override public void onLocationChanged(Location fix){deliver(fix,provider,current,true);}
            @Override public void onProviderEnabled(String p){}
            @Override public void onProviderDisabled(String p){handler.post(()->{if(valid(current))start(fineAllowed,singleFix);});}
        };
        boolean started=false;
        try{manager.requestLocationUpdates(provider,20000,0,listener,Looper.getMainLooper());listeners.put(provider,listener);started=true;}catch(RuntimeException ignored){}
        CancellationSignal signal=new CancellationSignal();signals.add(signal);
        try{manager.getCurrentLocation(provider,signal,executor,fix->{if(fix!=null)deliver(fix,provider,current,true);});started=true;}
        catch(RuntimeException ignored){signal.cancel();signals.remove(signal);}
        return started;
    }
    private void deliver(Location fix,String provider,int current,boolean live){
        if(!valid(current)||(settled&&!provider.equals(settledProvider))||fix==null||!callback.onFix(fix))return;
        hasFix=true;
        boolean fresh=WearPolicy.reliable(System.currentTimeMillis(),fix.getTime(),fix.hasAccuracy()?fix.getAccuracy():Float.NaN,false);
        if(singleFix&&fresh){stop();callback.onStatus("");return;}
        if(live&&fresh){
            settled=true;settledProvider=provider;clearTimers();cancelSignals();
            Iterator<Map.Entry<String,LocationListener>> it=listeners.entrySet().iterator();
            while(it.hasNext()){
                Map.Entry<String,LocationListener> entry=it.next();
                if(!entry.getKey().equals(provider)){try{manager.removeUpdates(entry.getValue());}catch(RuntimeException ignored){}it.remove();}
            }
            callback.onStatus("");
        }else callback.onStatus(fresh?"Suche aktuellen Standort …":"Standort nur ungefähr · suche weiter …");
    }
    private void clearTimers(){if(fallback!=null)handler.removeCallbacks(fallback);if(timeout!=null)handler.removeCallbacks(timeout);fallback=null;timeout=null;}
    private void cancelSignals(){for(CancellationSignal signal:signals)signal.cancel();signals.clear();}
    void stop(){
        running=false;generation++;clearTimers();cancelSignals();
        for(LocationListener listener:listeners.values()){try{manager.removeUpdates(listener);}catch(RuntimeException ignored){}}
        listeners.clear();attempted.clear();
    }
}
