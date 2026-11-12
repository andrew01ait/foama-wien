package at.foama.wien;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import org.robolectric.shadows.ShadowSystemClock;
import static org.junit.Assert.*;
import android.os.*;
import android.view.*;
import android.widget.*;
import java.net.*;
import java.io.*;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34) @LooperMode(LooperMode.Mode.PAUSED)
public class DepartureTimingTest {
    @Before public void setup(){RuntimeEnvironment.getApplication().getSharedPreferences("foama",0).edit().clear().commit();}
    Repo.Stop station(Repo repo,String city){for(Repo.Stop s:repo.stops)if(s.city.equals(city))return s;throw new AssertionError(city);}
    static final class Connection extends HttpURLConnection {final int status;Connection(URL url,int status){super(url);this.status=status;}public void disconnect(){}public boolean usingProxy(){return false;}public void connect(){}public int getResponseCode(){return status;}public InputStream getInputStream(){return new ByteArrayInputStream("{\"stations\":[],\"departures\":[]}".getBytes(java.nio.charset.StandardCharsets.UTF_8));}}
    @Test public void retryBelongsToFailedCityWhileThirtySecondSpacingAppliesToEveryCity()throws Exception{
        Repo repo=new Repo(RuntimeEnvironment.getApplication());repo.selectCity("graz");Repo.Stop graz=station(repo,"graz"),linz=station(repo,"linz");AtomicInteger calls=new AtomicInteger();
        RequestScope failed=new RequestScope(url->{calls.incrementAndGet();return new Connection(url,503);});long start=SystemClock.elapsedRealtime();repo.fetchDepartures(Arrays.asList(graz),Collections.emptyList(),failed);long retry=repo.nextFetchElapsed;assertTrue(retry>=start+60000);assertEquals(1,repo.failures);
        repo.selectCity("linz");assertEquals(start+30000,repo.nextFetchElapsed);assertEquals(0,repo.failures);assertEquals("",repo.regionalError);repo.fetchDepartures(Arrays.asList(linz),Collections.emptyList(),failed);assertEquals(1,calls.get());
        repo.selectCity("graz");assertEquals(retry,repo.nextFetchElapsed);assertEquals(1,repo.failures);assertFalse(repo.regionalError.isEmpty());repo.selectCity("linz");ShadowSystemClock.advanceBy(Duration.ofSeconds(30));
        RequestScope success=new RequestScope(url->{calls.incrementAndGet();return new Connection(url,200);});repo.fetchDepartures(Arrays.asList(linz),Collections.emptyList(),success);assertEquals(2,calls.get());assertTrue(repo.lastFetch>0);repo.selectCity("graz");assertTrue(repo.nextFetchElapsed>=retry);
    }
    private void set(MainActivity app,String name,Object value)throws Exception{java.lang.reflect.Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);f.set(app,value);}
    private Object get(MainActivity app,String name)throws Exception{java.lang.reflect.Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return f.get(app);}
    private TextView find(View v,String label){if(v instanceof TextView&&((TextView)v).getText().toString().equals(label))return (TextView)v;if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++){TextView t=find(((ViewGroup)v).getChildAt(i),label);if(t!=null)return t;}return null;}
    private void click(MainActivity app,String label){View target=find(app.getWindow().getDecorView(),label);assertNotNull(label,target);while(!target.isClickable()&&target.getParent() instanceof View)target=(View)target.getParent();assertTrue(target.performClick());}
    @Test public void gateSchedulesAtExactDeadlineAndReturningFromSettingsStartsFirstLoad()throws Exception{
        ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create().start();MainActivity app=c.get();try{
            app.repo.selectCity("graz");app.repo.prefs.edit().putInt("radius",2000).commit();app.active=true;app.repo.nextFetchElapsed=SystemClock.elapsedRealtime()+5000;AtomicInteger calls=new AtomicInteger();CountDownLatch opened=new CountDownLatch(1);
            app.changeView("near");set(app,"requests",new RequestScope(url->{calls.incrementAndGet();opened.countDown();return new Connection(url,200);}));
            Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(4999));assertEquals(0,calls.get());Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(2));assertTrue(opened.await(3,TimeUnit.SECONDS));((Future<?>)get(app,"departureRequest")).get(3,TimeUnit.SECONDS);Shadows.shadowOf(Looper.getMainLooper()).idle();assertEquals(1,calls.get());
            click(app,"Einstellungen");app.repo.nextFetchElapsed=0;set(app,"requests",new RequestScope(url->{calls.incrementAndGet();return new Connection(url,200);}));app.navigateBack();((Future<?>)get(app,"departureRequest")).get(3,TimeUnit.SECONDS);Shadows.shadowOf(Looper.getMainLooper()).idle();assertEquals(2,calls.get());
        }finally{app.active=false;c.stop().destroy();}
    }
    @Test public void pendingGateCannotFetchInSettingsOrAfterPause()throws Exception{
        ActivityController<MainActivity> c=Robolectric.buildActivity(MainActivity.class).create().start();MainActivity app=c.get();try{
            app.repo.selectCity("graz");app.active=true;app.repo.nextFetchElapsed=SystemClock.elapsedRealtime()+1000;AtomicInteger calls=new AtomicInteger();app.changeView("near");set(app,"requests",new RequestScope(url->{calls.incrementAndGet();return new Connection(url,200);}));click(app,"Einstellungen");Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(2));assertEquals(0,calls.get());
            app.repo.nextFetchElapsed=SystemClock.elapsedRealtime()+1000;app.navigateBack();c.resume();c.pause();Shadows.shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(2));assertEquals(0,calls.get());
        }finally{app.active=false;c.stop().destroy();}
    }
}
