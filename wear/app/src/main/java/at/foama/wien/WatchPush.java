package at.foama.wien;

import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.*;
import android.util.Base64;
import com.google.firebase.*;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.installations.FirebaseInstallations;
import java.security.SecureRandom;
import java.util.*;
import java.util.concurrent.*;
import org.json.*;

/** Explicit native opt-in and bounded device registration. No location access or polling. */
final class WatchPush {
    static final Object LOCK=new Object();
    static final int PERMISSION=12;
    private final Activity activity;
    private final Repo repo;
    private final ExecutorService executor;
    private final Handler handler;
    private final Runnable changed;
    final SharedPreferences prefs;
    private RequestScope requests=new RequestScope();
    private Future<?> operation;
    private boolean closed=true,busy;
    private JSONObject config=new JSONObject();
    private String message="Benachrichtigungsdienst wird noch eingerichtet.";
    WatchPush(Activity activity,Repo repo,ExecutorService executor,Handler handler,Runnable changed){this.activity=activity;this.repo=repo;this.executor=executor;this.handler=handler;this.changed=changed;prefs=preferences(activity);}
    static SharedPreferences preferences(Context ctx){return ctx.getSharedPreferences("foama_push",Context.MODE_PRIVATE);}
    boolean enabled(){return prefs.getBoolean("enabled",false);}
    boolean ready(){return config.optBoolean("nativeAvailable",false)&&config.optJSONObject("firebase")!=null;}
    boolean busy(){return busy;}
    String scope(){return prefs.getString("scope","favorites");}
    boolean quiet(){return prefs.getBoolean("quiet",true);}
    boolean equipment(){return prefs.getBoolean("equipment",false);}
    String status(){return message;}
    boolean hasPermission(){return ((NotificationManager)activity.getSystemService(Context.NOTIFICATION_SERVICE)).areNotificationsEnabled()&&(Build.VERSION.SDK_INT<33||activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)==PackageManager.PERMISSION_GRANTED);}
    void resume(){closed=false;requests=new RequestScope();inbox(activity,System.currentTimeMillis());if(enabled()){String targets=scope().equals("all")?"[]":targets(repo).toString();boolean changed=!targets.equals(prefs.getString("targets","[]"));prefs.edit().putString("targets",targets).putBoolean("dirty",changed||prefs.getBoolean("dirty",false)).apply();}if(prefs.getBoolean("pendingDelete",false))removeRegistration();else if(enabled()&&(prefs.getBoolean("dirty",false)||System.currentTimeMillis()-prefs.getLong("synced",0)>86400000))refreshConfiguration();}
    void pause(){closed=true;requests.cancel();if(operation!=null)operation.cancel(true);busy=false;}
    private interface Work {String run(RequestScope scope)throws Exception;}
    private void work(Work task){
        if(closed||busy)return;busy=true;changed.run();RequestScope scope=requests;
        operation=executor.submit(()->{String result;try{scope.check();result=task.run(scope);}catch(Exception e){result="Nicht verbunden. Bei geöffneter App erneut versuchen.";}
            String text=result;handler.post(()->{if(!closed&&requests==scope&&!scope.isCancelled()){busy=false;message=text;changed.run();if(text.startsWith("Aktiv auf")&&enabled()&&prefs.getBoolean("dirty",false))handler.postDelayed(()->work(this::synchronize),150);}});});
    }
    void refreshConfiguration(){work(scope->{
        JSONObject value=new JSONObject(Repo.jsonHttp(BuildConfig.FOAMA_BASE_URL+"/api/push/config","GET",null,scope));scope.commit(()->config=value);
        if(!value.optBoolean("nativeAvailable",false))return "Automatische Störungsmeldungen werden noch eingerichtet.";
        if(enabled()){
            if(!hasPermission())return "Hinweise sind in den Systemeinstellungen der Uhr gesperrt.";
            String token=prefs.getString("token","");if(!token.isEmpty())return synchronize(scope);
            handler.post(()->{if(!closed)getToken();});return "Geräteverbindung wird erneuert …";
        }
        return "Bereit. Aktivierung nur für diese Uhr.";
    });}
    void enable(){
        if(prefs.getBoolean("pendingDelete",false)){message="Ausstehende Abmeldung zuerst abschließen.";removeRegistration();return;}
        if(!ready()){message="Automatische Störungsmeldungen werden noch eingerichtet.";changed.run();return;}
        if(scope().equals("favorites")&&targets(repo).length()==0){message="Zuerst Favoriten speichern oder Alle Linien wählen.";changed.run();return;}
        if(Build.VERSION.SDK_INT>=33&&activity.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED){activity.requestPermissions(new String[]{Manifest.permission.POST_NOTIFICATIONS},PERMISSION);return;}
        if(!hasPermission()){message="Hinweise in den Systemeinstellungen der Uhr erlauben.";changed.run();return;}
        try{
            synchronized(LOCK){SharedPreferences.Editor edit=prefs.edit().putString("firebase",config.getJSONObject("firebase").toString()).putBoolean("enabled",true).putBoolean("pendingDelete",false).putBoolean("dirty",true).putString("targets",scope().equals("all")?"[]":targets(repo).toString());
                if(!prefs.contains("id"))edit.putString("id",random()).putString("secret",random());edit.apply();}
            restoreFirebase(activity);FirebaseMessaging.getInstance().setAutoInitEnabled(true);getToken();
        }catch(Exception e){prefs.edit().putBoolean("enabled",false).apply();message="Die Geräteverbindung konnte nicht gestartet werden.";changed.run();}
    }
    void permissionResult(){if(hasPermission())enable();else{message="Nicht aktiviert. Die Freigabe kann in den Uhr-Einstellungen geändert werden.";changed.run();}}
    private void getToken(){
        if(closed||!enabled())return;message="Geräteverbindung wird eingerichtet …";changed.run();
        try{FirebaseMessaging.getInstance().setDeliveryMetricsExportToBigQuery(false);FirebaseMessaging.getInstance().getToken().addOnCompleteListener(task->{
            if(!enabled()||closed)return;
            if(!task.isSuccessful()||task.getResult()==null){message="Push-Verbindung nicht erreichbar. Bitte erneut versuchen.";changed.run();return;}
            prefs.edit().putString("token",task.getResult()).putBoolean("dirty",true).apply();work(this::synchronize);
        });}catch(Exception e){message="Push-Verbindung nicht erreichbar. Bitte erneut versuchen.";changed.run();}
    }
    private String synchronize(RequestScope scope)throws Exception{
        synchronized(LOCK){if(!enabled())return "Aus";}
        return register(activity,scope);
    }
    static String register(Context ctx,RequestScope scope)throws Exception{
        return register(ctx,scope,true);
    }
    private static String register(Context ctx,RequestScope scope,boolean renew)throws Exception{
        SharedPreferences p=preferences(ctx);JSONObject body;final String stamp;
        synchronized(LOCK){
            if(!p.getBoolean("enabled",false))return "Aus";
            stamp=stamp(p);body=new JSONObject().put("transport","fcm").put("renew",renew).put("registrationToken",p.getString("token","")).put("preferences",new JSONObject().put("scope",p.getString("scope","favorites")).put("quiet",p.getBoolean("quiet",true)).put("equipment",p.getBoolean("equipment",false))).put("targets",new JSONArray(p.getString("scope","favorites").equals("all")?"[]":p.getString("targets","[]")));
        }
        String id=p.getString("id",""),secret=p.getString("secret","");if(!id.matches("[A-Za-z0-9_-]{32}")||!secret.matches("[A-Za-z0-9_-]{32}"))throw new IllegalStateException("Missing device permission");
        JSONObject response;
        try{response=new JSONObject(api("/api/push/subscriptions/"+id,"PUT",body,secret,scope));}
        catch(Exception e){if(!"HTTP 410".equals(e.getMessage()))throw e;if(!renew||p.getBoolean("registered",false)){retire(ctx);throw e;}body.put("id",id).put("secret",secret);response=new JSONObject(api("/api/push/subscriptions","POST",body,secret,scope));}
        final long expires=response.optLong("expiresAt");
        scope.commit(()->{synchronized(LOCK){if(p.getBoolean("enabled",false))p.edit().putBoolean("registered",true).putBoolean("dirty",!stamp.equals(stamp(p))).putLong("synced",System.currentTimeMillis()).putLong("expires",expires).apply();}});
        return "Aktiv auf dieser Uhr · bis zu sechs Hinweise pro Tag.";
    }
    private static String stamp(SharedPreferences p){return p.getString("token","")+"\n"+p.getString("scope","favorites")+"\n"+p.getBoolean("quiet",true)+"\n"+p.getBoolean("equipment",false)+"\n"+p.getString("targets","[]");}
    void select(String key,String value){if(busy)return;JSONArray selected=value.equals("all")?new JSONArray():targets(repo);prefs.edit().putString(key,value).putString("targets",selected.toString()).putBoolean("dirty",true).apply();if(enabled()&&value.equals("favorites")&&selected.length()==0){disable();return;}if(enabled())work(this::synchronize);else changed.run();}
    void toggle(String key){if(busy)return;prefs.edit().putBoolean(key,!prefs.getBoolean(key,key.equals("quiet"))).putBoolean("dirty",true).apply();if(enabled())work(this::synchronize);else changed.run();}
    void favoritesChanged(){if(enabled()&&scope().equals("favorites")){JSONArray targets=targets(repo);if(targets.length()==0){disable();return;}prefs.edit().putString("targets",targets.toString()).putBoolean("dirty",true).apply();work(this::synchronize);}}
    void retry(){if(prefs.getBoolean("pendingDelete",false))removeRegistration();else refreshConfiguration();}
    void disable(){
        prefs.edit().putBoolean("enabled",false).putBoolean("pendingDelete",prefs.contains("id")).putBoolean("dirty",false).remove("inbox").apply();
        NotificationManager manager=(NotificationManager)activity.getSystemService(Context.NOTIFICATION_SERVICE);manager.cancel("foama-wien-disruptions",DisruptionService.NOTIFICATION_ID);manager.cancel("foama-wien-test",DisruptionService.NOTIFICATION_ID);
        if(!FirebaseApp.getApps(activity).isEmpty())try{FirebaseMessaging.getInstance().setAutoInitEnabled(false);FirebaseMessaging.getInstance().deleteToken();FirebaseInstallations.getInstance().delete();}catch(Exception ignored){}
        requests.cancel();if(operation!=null)operation.cancel(true);requests=new RequestScope();busy=false;message="Aus · Anmeldung wird entfernt …";removeRegistration();
    }
    private void removeRegistration(){work(scope->{
        String id=prefs.getString("id","");if(!id.isEmpty())try{api("/api/push/subscriptions/"+id,"DELETE",null,prefs.getString("secret",""),scope);}catch(Exception e){if(!"HTTP 410".equals(e.getMessage()))throw e;}
        scope.commit(()->prefs.edit().remove("id").remove("secret").remove("token").remove("targets").remove("firebase").remove("expires").putBoolean("registered",false).putBoolean("pendingDelete",false).apply());return "Aus · Gerätefreigabe entfernt.";
    });}
    void test(){if(enabled()&&hasPermission())work(scope->{api("/api/push/subscriptions/"+prefs.getString("id","")+"/test","POST",new JSONObject(),prefs.getString("secret",""),scope);return "Test vom Pushdienst angenommen. Anzeige auf der Uhr prüfen.";});}
    static String api(String path,String method,JSONObject body,String secret,RequestScope scope)throws Exception{
        if(!path.matches("/api/push/subscriptions(?:/[A-Za-z0-9_-]{32}(?:/test)?)?"))throw new java.io.IOException("Invalid push target");
        java.net.URI uri=new java.net.URI(BuildConfig.FOAMA_BASE_URL+path);java.net.HttpURLConnection con=scope.open(uri.toURL());
        try{con.setInstanceFollowRedirects(false);con.setRequestMethod(method);con.setConnectTimeout(8000);con.setReadTimeout(8000);con.setRequestProperty("Accept","application/json");if(secret!=null)con.setRequestProperty("X-Push-Secret",secret);scope.check();
            if(body!=null){con.setDoOutput(true);con.setRequestProperty("Content-Type","application/json");try(java.io.OutputStream out=con.getOutputStream()){out.write(body.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8));}}
            int code=con.getResponseCode();scope.check();if(code<200||code>=300)throw new java.io.IOException("HTTP "+code);byte[] bytes=Repo.readBytes(con.getInputStream());if(bytes.length>25000)throw new java.io.IOException("Response too large");scope.check();return new String(bytes,java.nio.charset.StandardCharsets.UTF_8);
        }finally{con.disconnect();scope.release(con);}
    }
    static void restoreFirebase(Context ctx){
        SharedPreferences p=preferences(ctx);String raw=p.getString("firebase","");if(raw.isEmpty()||(!p.getBoolean("enabled",false)&&!p.getBoolean("pendingDelete",false)))return;
        if(p.getBoolean("registered",false)&&p.getLong("expires",Long.MAX_VALUE)<=System.currentTimeMillis()){retire(ctx);return;}
        try{JSONObject f=new JSONObject(raw);if(FirebaseApp.getApps(ctx).isEmpty()){
            FirebaseOptions options=new FirebaseOptions.Builder().setApplicationId(f.getString("applicationId")).setApiKey(f.getString("apiKey")).setProjectId(f.getString("projectId")).setGcmSenderId(f.getString("senderId")).build();
            FirebaseApp.initializeApp(ctx,options);FirebaseApp.getInstance().setDataCollectionDefaultEnabled(false);
        }FirebaseMessaging.getInstance().setAutoInitEnabled(p.getBoolean("enabled",false));FirebaseMessaging.getInstance().setDeliveryMetricsExportToBigQuery(false);}catch(Exception ignored){}
    }
    static void tokenChanged(Context ctx,String token){
        SharedPreferences p=preferences(ctx);if(!p.getBoolean("enabled",false))return;p.edit().putString("token",token).putBoolean("dirty",true).apply();
        if(!p.getBoolean("registered",false))return;
        if(p.getLong("expires",0)<=System.currentTimeMillis()){retire(ctx);return;}
        RequestScope requests=new RequestScope();try{register(ctx,requests,false);}catch(Exception ignored){}finally{requests.cancel();}
    }
    private static void retire(Context ctx){
        preferences(ctx).edit().putBoolean("enabled",false).putBoolean("registered",false).putBoolean("dirty",false).putBoolean("pendingDelete",false).remove("id").remove("secret").remove("token").remove("firebase").remove("targets").remove("expires").remove("inbox").apply();
        if(!FirebaseApp.getApps(ctx).isEmpty())try{FirebaseMessaging.getInstance().setAutoInitEnabled(false);FirebaseMessaging.getInstance().deleteToken();FirebaseInstallations.getInstance().delete();}catch(Exception ignored){}
    }
    static JSONArray targets(Repo repo){
        LinkedHashMap<String,LinkedHashSet<String>> selections=new LinkedHashMap<>();
        for(Repo.Favorite favorite:new ArrayList<>(repo.favorites)){Repo.Stop stop=repo.findStop(favorite.stopId);if(stop==null||!stop.provider.equals("wl"))continue;if(!selections.containsKey(stop.id)&&selections.size()>=100)break;
            LinkedHashSet<String> routes=selections.computeIfAbsent(stop.id,key->new LinkedHashSet<>());if(favorite.route.isEmpty())routes.addAll(stop.routes);else if(stop.routes.contains(favorite.route))routes.add(favorite.route);}
        JSONArray journeys=repo.journeys.all();for(int i=0;i<journeys.length();i++){JSONObject bundle=journeys.optJSONObject(i);for(int variant=0;variant<JourneyStore.variantCount(bundle);variant++)for(JSONObject leg:JourneyStore.boardings(JourneyStore.variant(bundle,variant))){
            addRouteTarget(selections,repo,leg.optJSONObject("from"),leg.optString("route"));addRouteTarget(selections,repo,leg.optJSONObject("to"),leg.optString("route"));
        }}
        JSONArray out=new JSONArray();for(Map.Entry<String,LinkedHashSet<String>> entry:selections.entrySet())if(!entry.getValue().isEmpty())try{out.put(new JSONObject().put("stopId",entry.getKey()).put("routes",new JSONArray(new ArrayList<>(entry.getValue()))));}catch(JSONException ignored){}return out;
    }
    private static void addRouteTarget(LinkedHashMap<String,LinkedHashSet<String>> selections,Repo repo,JSONObject place,String route){
        if(place==null)return;Repo.Stop stop=repo.findStop(place.optString("stopId"));if(stop==null||!stop.provider.equals("wl")||!stop.routes.contains(route)||!selections.containsKey(stop.id)&&selections.size()>=100)return;
        selections.computeIfAbsent(stop.id,key->new LinkedHashSet<>()).add(route);
    }
    static JSONArray inbox(Context ctx,long now){
        SharedPreferences p=preferences(ctx);JSONArray valid=new JSONArray();try{JSONArray saved=new JSONArray(p.getString("inbox","[]"));for(int i=0;i<saved.length()&&valid.length()<10;i++){JSONObject row=saved.optJSONObject(i);if(row!=null&&row.optLong("at")>now-86400000&&row.optLong("at")<=now+60000&&row.optString("title").length()<=100&&row.optString("body").length()<=1200)valid.put(row);}}catch(Exception ignored){}
        if(valid.length()==0)p.edit().remove("inbox").apply();else p.edit().putString("inbox",valid.toString()).apply();return valid;
    }
    private static String random(){byte[] bytes=new byte[24];new SecureRandom().nextBytes(bytes);return Base64.encodeToString(bytes,Base64.URL_SAFE|Base64.NO_WRAP|Base64.NO_PADDING);}
}
