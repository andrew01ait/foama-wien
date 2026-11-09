package at.foama.wien;

import android.Manifest;
import android.content.Context;
import android.location.*;
import android.os.*;
import java.util.*;
import java.util.concurrent.TimeUnit;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.*;
import org.robolectric.shadows.ShadowLocationManager;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34) @LooperMode(LooperMode.Mode.PAUSED)
public class WatchLocationTest {
    private LocationManager manager;private ShadowLocationManager shadow;private WatchLocation location;private Repo repo;
    private final List<String> statuses=new ArrayList<>();
    @Before public void setup(){
        Context context=RuntimeEnvironment.getApplication();shadowOf(RuntimeEnvironment.getApplication()).grantPermissions(Manifest.permission.ACCESS_COARSE_LOCATION,Manifest.permission.ACCESS_FINE_LOCATION);
        repo=new Repo(context);manager=(LocationManager)context.getSystemService(Context.LOCATION_SERVICE);shadow=shadowOf(manager);
        shadow.setLocationEnabled(true);shadow.removeProvider("fused");shadow.setProviderEnabled("network",true);shadow.setProviderEnabled("gps",true);
        Handler handler=new Handler(Looper.getMainLooper());
        location=new WatchLocation(manager,handler,handler::post,new WatchLocation.Callback(){
            public boolean onFix(Location fix){Location before=repo.currentLocation;repo.acceptLocation(fix);return repo.currentLocation!=before;}
            public void onStatus(String message){statuses.add(message);}
        });
    }
    @After public void cleanup(){location.stop();}
    private void idle(long seconds){shadowOf(Looper.getMainLooper()).idleFor(seconds,TimeUnit.SECONDS);}
    private Location fix(String provider,float accuracy,long age){Location fix=new Location(provider);fix.setLatitude(48.2);fix.setLongitude(16.3);fix.setAccuracy(accuracy);fix.setTime(System.currentTimeMillis()-age);fix.setElapsedRealtimeNanos(SystemClock.elapsedRealtimeNanos());return fix;}
    private String status(){return statuses.get(statuses.size()-1);}
    @Test public void powerSavingSingleFixClosesAllStreamsImmediatelyAfterReliablePosition(){location.start(true,true);shadow.simulateLocation(fix("network",5,0));idle(0);assertNotNull(repo.currentLocation);assertTrue(shadow.getLocationUpdateListeners().isEmpty());int count=statuses.size();idle(40);assertEquals(count,statuses.size());assertTrue(shadow.getLocationUpdateListeners().isEmpty());}
    @Test public void silentNetworkFallsBackToGpsAndKeepsOnlyWorkingStream(){
        location.start(true);assertFalse(shadow.getLocationUpdateListeners("network").isEmpty());assertTrue(shadow.getLocationUpdateListeners("gps").isEmpty());
        idle(8);assertFalse(shadow.getLocationUpdateListeners("gps").isEmpty());
        shadow.simulateLocation(fix("gps",5,0));idle(0);assertNotNull(repo.currentLocation);assertTrue(repo.reliableLocation());assertEquals("",status());
        assertTrue(shadow.getLocationUpdateListeners("network").isEmpty());assertFalse(shadow.getLocationUpdateListeners("gps").isEmpty());
        idle(31);assertEquals("",status());assertFalse(shadow.getLocationUpdateListeners("gps").isEmpty());
    }
    @Test public void fusedIsPreferredButSilentFusedCannotBlockOtherSources(){
        shadow.setProviderEnabled("fused",true);location.start(true);
        assertFalse(shadow.getLocationUpdateListeners("fused").isEmpty());assertTrue(shadow.getLocationUpdateListeners("gps").isEmpty());
        idle(8);assertFalse(shadow.getLocationUpdateListeners("network").isEmpty());assertFalse(shadow.getLocationUpdateListeners("gps").isEmpty());
        shadow.simulateLocation(fix("network",20,0));idle(0);assertEquals("",status());assertTrue(shadow.getLocationUpdateListeners("fused").isEmpty());assertTrue(shadow.getLocationUpdateListeners("gps").isEmpty());
    }
    @Test public void thirtySecondTimeoutEndsSearchAndReleasesEveryRequest(){
        location.start(true);idle(31);assertTrue(status().contains("erneut versuchen"));assertFalse(status().contains("wird gesucht"));assertNull(repo.currentLocation);assertTrue(shadow.getLocationUpdateListeners().isEmpty());
        int before=statuses.size();idle(90);assertEquals(before,statuses.size());assertTrue(shadow.getLocationUpdateListeners().isEmpty());
    }
    @Test public void cachesFromOtherProvidersAreAvailableImmediately(){
        shadow.setLastKnownLocation("gps",fix("gps",25,120000));location.start(true);
        assertNotNull(repo.currentLocation);assertFalse(repo.reliableLocation());assertEquals("gps",repo.currentLocation.getProvider());
    }
    @Test public void rejectedOldCacheDoesNotEndSearchOrPreventFallback(){
        shadow.setLastKnownLocation("network",fix("network",5,700000));location.start(true);assertNull(repo.currentLocation);
        idle(8);assertFalse(shadow.getLocationUpdateListeners("gps").isEmpty());
        shadow.simulateLocation(fix("gps",5,0));idle(0);assertTrue(repo.reliableLocation());assertEquals("",status());
    }
    @Test public void coarseFixStaysUsableWithoutWalkingAssuranceOrUnboundedGps(){
        location.start(true);shadow.simulateLocation(fix("network",700,0));idle(0);
        assertNotNull(repo.currentLocation);assertFalse(repo.reliableLocation());idle(31);
        assertTrue(status().contains("ungefähr"));assertTrue(shadow.getLocationUpdateListeners().isEmpty());
    }
    @Test public void coarsePermissionDoesNotRequestGps(){
        location.start(false);idle(8);assertFalse(shadow.getLocationUpdateListeners("network").isEmpty());assertTrue(shadow.getLocationUpdateListeners("gps").isEmpty());
    }
    @Test public void stoppingRejectsLateFixAndCancelsFallbackAndTimeout(){
        location.start(true);LocationListener late=shadow.getLocationUpdateListeners("network").get(0);location.stop();int before=statuses.size();
        late.onLocationChanged(fix("network",5,0));idle(65);assertNull(repo.currentLocation);assertEquals(before,statuses.size());assertTrue(shadow.getLocationUpdateListeners().isEmpty());
    }
    @Test public void disabledLocationGivesActionableMessageWithoutRequests(){
        shadow.setLocationEnabled(false);location.start(true);assertTrue(status().contains("einschalten"));assertTrue(shadow.getLocationUpdateListeners().isEmpty());idle(31);assertTrue(status().contains("einschalten"));
    }
    @Test public void retryAfterTimeoutCanAcquireLocation(){
        location.start(true);idle(31);location.start(true);shadow.simulateLocation(fix("network",10,0));idle(0);assertNotNull(repo.currentLocation);assertEquals("",status());
    }
    @Test public void disabledSilentNetworkImmediatelySwitchesToGps(){
        location.start(true);shadow.setProviderEnabled("network",false);idle(0);assertFalse(shadow.getLocationUpdateListeners("gps").isEmpty());
    }
    @Test public void queuedResponseFromDiscardedProviderCannotReplaceWorkingGps(){
        location.start(true);LocationListener discarded=shadow.getLocationUpdateListeners("network").get(0);idle(8);
        shadow.simulateLocation(fix("gps",5,0));idle(0);discarded.onLocationChanged(fix("network",700,0));
        assertEquals("gps",repo.currentLocation.getProvider());assertEquals(5,repo.currentLocation.getAccuracy(),0);assertEquals("",status());
    }
}
