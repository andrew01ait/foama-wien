package at.foama.wien;

import android.os.*;
import android.view.*;
import android.widget.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.json.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34,qualifiers="w192dp-h192dp-round-xhdpi") @LooperMode(LooperMode.Mode.PAUSED)
public class ApproachContinuityTest {
    private ActivityController<MainActivity> controller;private MainActivity app;
    @Before public void setup(){RuntimeEnvironment.getApplication().getSharedPreferences("foama",0).edit().clear().commit();controller=Robolectric.buildActivity(MainActivity.class).create().start();app=controller.get();}
    @After public void cleanup(){app.active=false;controller.stop().destroy();}
    private void set(String name,Object value)throws Exception{java.lang.reflect.Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);f.set(app,value);}
    private Object get(String name)throws Exception{java.lang.reflect.Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return f.get(app);}
    private void refresh()throws Exception{java.lang.reflect.Method m=MainActivity.class.getDeclaredMethod("refresh");m.setAccessible(true);m.invoke(app);}
    private void complete()throws Exception{((Future<?>)get("departureRequest")).get(3,TimeUnit.SECONDS);Shadows.shadowOf(Looper.getMainLooper()).idle();}
    private Repo.Stop stop(){for(Repo.Stop s:app.repo.stops)if(s.name.equals("Stephansplatz U"))return s;throw new AssertionError();}
    private void open(String route,String towards){app.openConnection(stop(),route,towards,"metro");app.openApproach("metro");}
    private JSONObject data(String route)throws Exception{long now=System.currentTimeMillis();return new JSONObject().put("available",true).put("route",route).put("mode","metro").put("at",now).put("arrivalAt",now+180000).put("retryAfterMs",1000).put("status","Position geschätzt").put("progress",4).put("center",2).put("stops",new JSONArray("[{name:'Vorher'},{name:'Davor'},{name:'Stephansplatz U'}]")).put("tracks",new JSONArray().put(new JSONObject().put("id",route+" · 01").put("progress",1.5).put("lastSeen",now)));}
    private static class Connection extends HttpURLConnection {
        final String body;int code=200;boolean disconnected;Connection(URL url,String body){super(url);this.body=body;}public void disconnect(){disconnected=true;}public boolean usingProxy(){return false;}public void connect(){}public int getResponseCode(){return code;}public InputStream getInputStream(){return new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8));}
    }
    private void load(JSONObject data,AtomicInteger calls)throws Exception{set("requests",new RequestScope(url->{calls.incrementAndGet();return new Connection(url,data.toString());}));app.active=true;refresh();complete();}
    private int count(View view,Class<?> type){int total=type.isInstance(view)?1:0;if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)total+=count(((ViewGroup)view).getChildAt(i),type);return total;}
    @Test public void reopeningUsesSameForecastAndIdsWithoutRestartingOrResettingTheGate()throws Exception{open("U1","Leopoldau");AtomicInteger calls=new AtomicInteger();load(data("U1"),calls);JSONObject original=(JSONObject)get("approach");long next=app.repo.nextFetchElapsed;assertEquals(1,count(app.getWindow().getDecorView(),ApproachView.class));app.navigateBack();app.openApproach("metro");assertSame(original,get("approach"));assertEquals(next,app.repo.nextFetchElapsed);assertEquals(1,calls.get());assertEquals(1,count(app.getWindow().getDecorView(),ApproachView.class));assertEquals(0,count(app.getWindow().getDecorView(),ProgressBar.class));}
    @Test public void anotherLineNeverDisplaysOldVehiclesAndReturningRestoresTheCorrectLine()throws Exception{open("U1","Leopoldau");load(data("U1"),new AtomicInteger());JSONObject original=(JSONObject)get("approach");app.active=false;open("U2","Seestadt");assertNull(get("approach"));assertEquals(0,count(app.getWindow().getDecorView(),ApproachView.class));assertEquals(1,count(app.getWindow().getDecorView(),ProgressBar.class));open("U1","Leopoldau");assertSame(original,get("approach"));}
    @Test public void noEmptySchematicDuringInitializationAndExpiredVehiclesAreRemoved()throws Exception{open("U1","Leopoldau");assertEquals(0,count(app.getWindow().getDecorView(),ApproachView.class));JSONObject response=data("U1");response.getJSONArray("tracks").getJSONObject(0).put("lastSeen",System.currentTimeMillis()-91000);load(response,new AtomicInteger());assertEquals(0,count(app.getWindow().getDecorView(),ApproachView.class));assertEquals(1,count(app.getWindow().getDecorView(),ProgressBar.class));}
    @Test public void distantVehiclesAreExplainedWithoutAnEmptySchematic()throws Exception{open("U1","Leopoldau");JSONObject response=data("U1").put("center",5).put("stops",new JSONArray("[{name:'A'},{name:'B'},{name:'C'},{name:'D'},{name:'E'},{name:'Stephansplatz U'}]"));response.getJSONArray("tracks").getJSONObject(0).put("progress",1);load(response,new AtomicInteger());assertEquals(0,count(app.getWindow().getDecorView(),ApproachView.class));assertTrue(texts(app.getWindow().getDecorView()).contains("Nächstes Fahrzeug noch weiter entfernt."));}
    private String texts(View view){String text=view instanceof TextView?((TextView)view).getText().toString():"";if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)text+="\n"+texts(((ViewGroup)view).getChildAt(i));return text;}
    @Test public void passiveCacheIsBoundedExpiresAndNeverRefreshesSourceTimes()throws Exception{ApproachCache cache=new ApproachCache();JSONObject data=data("U1");long source=data.getLong("at");cache.put("one",data,"",1000);assertSame(data,cache.get("one",2000).data);assertEquals(source,cache.get("one",3000).data.getLong("at"));for(int i=0;i<4;i++)cache.put("other"+i,data,"",3000);assertNull(cache.get("one",4000));assertNull(cache.get("other3",303001));}
    @Test public void requestSpacingUsesStartTimeAndRetainsLongerServerBackoff()throws Exception{Repo repo=app.repo;AtomicInteger calls=new AtomicInteger();JSONObject response=data("U1");long start=SystemClock.elapsedRealtime();RequestScope scope=new RequestScope(url->{calls.incrementAndGet();org.robolectric.shadows.ShadowSystemClock.advanceBy(java.time.Duration.ofSeconds(8));return new Connection(url,response.toString());});repo.fetchApproach(stop(),"U1","Leopoldau","metro",scope);assertEquals(start+30000,repo.nextFetchElapsed);repo.fetchApproach(stop(),"U2","Seestadt","metro",scope);assertEquals(1,calls.get());org.robolectric.shadows.ShadowSystemClock.advanceBy(java.time.Duration.ofSeconds(30));response.put("retryAfterMs",120000);repo.fetchApproach(stop(),"U1","Leopoldau","metro",scope);assertTrue(repo.nextFetchElapsed>=SystemClock.elapsedRealtime()+120000);}
    @Test public void changingLinesAbortsOldRequestBeforeStartingAnotherAndIgnoresLateResponses()throws Exception{
        open("U1","Leopoldau");AtomicInteger active=new AtomicInteger(),peak=new AtomicInteger();CountDownLatch started=new CountDownLatch(1),release=new CountDownLatch(1);Connection[] old={null};JSONObject first=data("U1");
        set("requests",new RequestScope(url->{old[0]=new Connection(url,first.toString()){@Override public int getResponseCode(){peak.accumulateAndGet(active.incrementAndGet(),Math::max);started.countDown();try{release.await(3,TimeUnit.SECONDS);}catch(InterruptedException ignored){}return 200;}@Override public void disconnect(){if(!disconnected)active.decrementAndGet();super.disconnect();release.countDown();}};return old[0];}));app.active=true;refresh();assertTrue(started.await(3,TimeUnit.SECONDS));
        open("U2","Seestadt");assertTrue(old[0].disconnected);app.repo.nextFetchElapsed=0;JSONObject second=data("U2");set("requests",new RequestScope(url->new Connection(url,second.toString()){@Override public int getResponseCode(){peak.accumulateAndGet(active.incrementAndGet(),Math::max);return 200;}@Override public void disconnect(){if(!disconnected)active.decrementAndGet();super.disconnect();}}));refresh();complete();assertEquals(1,peak.get());assertEquals("U2",((JSONObject)get("approach")).getString("route"));
    }
}
