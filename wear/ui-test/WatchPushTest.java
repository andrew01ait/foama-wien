package at.foama.wien;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;
import android.app.*;
import android.content.*;
import android.location.LocationManager;
import org.json.*;
import java.io.*;
import java.net.*;
import java.util.*;
import com.google.firebase.*;
import com.google.firebase.messaging.FirebaseMessaging;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34)
public class WatchPushTest {
    private Context ctx;private SharedPreferences prefs;private NotificationManager manager;
    @Before public void setup(){ctx=RuntimeEnvironment.getApplication();prefs=WatchPush.preferences(ctx);prefs.edit().clear().commit();manager=(NotificationManager)ctx.getSystemService(Context.NOTIFICATION_SERVICE);manager.cancelAll();shadowOf(manager).setNotificationsEnabled(true);shadowOf(RuntimeEnvironment.getApplication()).grantPermissions(android.Manifest.permission.POST_NOTIFICATIONS);}
    @After public void cleanup(){prefs.edit().clear().commit();manager.cancelAll();for(FirebaseApp app:FirebaseApp.getApps(ctx))app.delete();}
    private Map<String,String> payload(long now){Map<String,String> data=new HashMap<>();data.put("format","foama-push-v1");data.put("title","U6: Verzögerungen");data.put("body","Unregelmäßige Intervalle");data.put("sentAt",String.valueOf(now));data.put("tag","foama-wien-disruptions");return data;}
    @Test public void coldStartDoesNotInitializeFirebaseOrEnablePush(){assertFalse(prefs.getBoolean("enabled",false));assertTrue(FirebaseApp.getApps(ctx).isEmpty());assertEquals(0,WatchPush.inbox(ctx,System.currentTimeMillis()).length());}
    @Test public void optedInMessagesCreateNativeNotificationsWithoutStartingGpsOrAnActivity(){
        prefs.edit().putBoolean("enabled",true).putBoolean("quiet",false).commit();long now=System.currentTimeMillis();
        assertTrue(DisruptionService.show(ctx,payload(now),"message-a",now));assertEquals(1,shadowOf(manager).getAllNotifications().size());
        Notification notification=shadowOf(manager).getAllNotifications().get(0);assertEquals(DisruptionService.CHANNEL,notification.getChannelId());assertTrue((notification.flags&Notification.FLAG_LOCAL_ONLY)!=0);assertEquals(3600000,notification.getTimeoutAfter());
        assertTrue(shadowOf((LocationManager)ctx.getSystemService(Context.LOCATION_SERVICE)).getLocationUpdateListeners().isEmpty());assertNull(shadowOf(RuntimeEnvironment.getApplication()).getNextStartedActivity());
        assertFalse(DisruptionService.show(ctx,payload(now),"message-a",now));assertEquals(1,WatchPush.inbox(ctx,now).length());
    }
    @Test public void disabledExpiredMalformedAndQuietMessagesNeverNotify(){
        long now=System.currentTimeMillis();assertFalse(DisruptionService.show(ctx,payload(now),"a",now));prefs.edit().putBoolean("enabled",true).putBoolean("quiet",false).commit();
        assertFalse(DisruptionService.show(ctx,payload(now-600001),"b",now));Map<String,String> malformed=payload(now);malformed.put("format","unrelated-app");assertFalse(DisruptionService.show(ctx,malformed,"c",now));
        prefs.edit().putBoolean("quiet",true).commit();long night=java.time.Instant.parse("2026-11-08T22:00:00Z").toEpochMilli();assertFalse(DisruptionService.show(ctx,payload(night),"d",night));assertTrue(shadowOf(manager).getAllNotifications().isEmpty());
    }
    @Test public void notificationHistoryIsBoundedAndExpiresWithoutABackgroundCleanupJob(){
        prefs.edit().putBoolean("enabled",true).putBoolean("quiet",false).commit();long now=System.currentTimeMillis();for(int i=0;i<30;i++)assertTrue(DisruptionService.show(ctx,payload(now+i),"message-"+i,now+i));
        assertEquals(10,WatchPush.inbox(ctx,now+30).length());assertTrue(prefs.getString("inbox","").getBytes(java.nio.charset.StandardCharsets.UTF_8).length<20000);
        assertEquals(0,WatchPush.inbox(ctx,now+86400031).length());assertFalse(prefs.contains("inbox"));
    }
    @Test public void favoritePushSelectionContainsKnownLinesAndIdsWithoutNamesOrCoordinates()throws Exception{
        ctx.getSharedPreferences("foama",0).edit().clear().commit();Repo repo=new Repo(ctx);Repo.Stop station=repo.findStop("wl:60200615");repo.toggleFavorite(station,"U6","Floridsdorf");
        JSONArray selected=WatchPush.targets(repo);assertEquals(1,selected.length());assertEquals("wl:60200615",selected.getJSONObject(0).getString("stopId"));assertEquals("U6",selected.getJSONObject(0).getJSONArray("routes").getString(0));assertFalse(selected.toString().contains("Floridsdorf"));assertFalse(selected.toString().contains("lat"));assertFalse(selected.toString().contains("Josefstädter"));
    }
    @Test public void savedRoutesAndAlternativesIncludeBothEndsWithoutSendingPrivateRouteData()throws Exception{
        ctx.getSharedPreferences("foama",0).edit().clear().commit();Repo repo=new Repo(ctx);
        JSONObject file=new JSONObject(new String(java.nio.file.Files.readAllBytes(java.nio.file.Paths.get("tests/fixtures/transfer-routes-webcrypto.json")),java.nio.charset.StandardCharsets.UTF_8)),route=file.getJSONObject("value").getJSONArray("journeys").getJSONObject(0);route.put("name","PRIVATE_COMMUTE");
        JSONArray alternate=new JSONArray(route.getJSONArray("legs").toString());JSONObject ride=null;for(int i=0;i<alternate.length();i++)if(!alternate.getJSONObject(i).optString("mode").equals("walk")){ride=alternate.getJSONObject(i);break;}assertNotNull(ride);Repo.Stop first=repo.findStop(ride.getJSONObject("from").getString("stopId"));String added=null;for(String known:first.routes)if(!known.equals(ride.optString("route"))){added=known;break;}assertNotNull(added);ride.put("route",added).put("mode",first.routeModes.get(added));route.put("alternatives",new JSONArray().put(new JSONObject().put("legs",alternate)));repo.journeys.merge(new JSONArray().put(route));
        JSONArray targets=WatchPush.targets(repo);Set<String> ids=new HashSet<>();boolean foundAlternative=false;for(int i=0;i<targets.length();i++){JSONObject target=targets.getJSONObject(i);assertTrue(ids.add(target.getString("stopId")));if(target.getString("stopId").equals(first.id))for(int j=0;j<target.getJSONArray("routes").length();j++)foundAlternative|=added.equals(target.getJSONArray("routes").getString(j));}
        assertTrue(foundAlternative);assertTrue(ids.size()>=2);for(JSONObject leg:JourneyStore.boardings(route)){for(String end:new String[]{"from","to"}){Repo.Stop station=repo.findStop(leg.getJSONObject(end).optString("stopId"));if(station!=null&&station.provider.equals("wl")&&station.routes.contains(leg.optString("route")))assertTrue(ids.contains(station.id));}}
        String serialized=targets.toString();for(String privateField:new String[]{"PRIVATE","towards","name","lat","lon"})assertFalse(privateField,serialized.contains(privateField));repo.journeys.remove(route.getString("id"));assertEquals(0,WatchPush.targets(repo).length());assertTrue(FirebaseApp.getApps(ctx).isEmpty());
    }
    static final class Connection extends HttpURLConnection {
        final ByteArrayOutputStream body=new ByteArrayOutputStream();Runnable received;
        Connection(URL url){super(url);}
        public void connect(){}public void disconnect(){}public boolean usingProxy(){return false;}
        public OutputStream getOutputStream(){return body;}
        public int getResponseCode(){if(received!=null)received.run();return 200;}
        public InputStream getInputStream(){return new ByteArrayInputStream("{\"expiresAt\":1999999999999}".getBytes(java.nio.charset.StandardCharsets.UTF_8));}
    }
    @Test public void deviceRegistrationKeepsItsSecretInTheHeaderAndNeverClearsNewerUnsynchronizedSelection()throws Exception{
        prefs.edit().putBoolean("enabled",true).putBoolean("quiet",false).putString("scope","all").putString("id",String.join("",Collections.nCopies(32,"a"))).putString("secret",String.join("",Collections.nCopies(32,"b"))).putString("token","TEST_ONLY_"+String.join("",Collections.nCopies(100,"c"))).putString("targets","[]").commit();
        List<Connection> calls=new ArrayList<>();RequestScope request=new RequestScope(url->{Connection con=new Connection(url);calls.add(con);con.received=()->prefs.edit().putBoolean("quiet",true).commit();return con;});
        WatchPush.register(ctx,request);assertEquals(1,calls.size());Connection con=calls.get(0);JSONObject body=new JSONObject(con.body.toString("UTF-8"));assertEquals("fcm",body.getString("transport"));assertEquals(0,body.getJSONArray("targets").length());assertFalse(body.has("secret"));assertEquals(prefs.getString("secret",""),con.getRequestProperty("X-Push-Secret"));assertTrue(prefs.getBoolean("registered",false));assertTrue(prefs.getBoolean("dirty",false));
        request.cancel();try{WatchPush.api("https://untrusted.example","GET",null,"private",new RequestScope());fail();}catch(IOException expected){}
    }
    @Test public void sdkRegistrarsInitializeWithExplicitConfigurationWhileAutomaticCollectionRemainsOff(){
        FirebaseOptions options=new FirebaseOptions.Builder().setApplicationId("1:123456789:android:1234567890abcdef").setApiKey("AIza"+String.join("",Collections.nCopies(35,"a"))).setProjectId("foama-test-123").setGcmSenderId("123456789").build();
        FirebaseApp.initializeApp(ctx,options);FirebaseApp.getInstance().setDataCollectionDefaultEnabled(false);assertFalse(FirebaseMessaging.getInstance().isAutoInitEnabled());FirebaseMessaging.getInstance().setDeliveryMetricsExportToBigQuery(false);
    }
}
