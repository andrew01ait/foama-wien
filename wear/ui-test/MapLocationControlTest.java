package at.foama.wien;

import android.Manifest;
import android.content.*;
import android.graphics.*;
import android.location.*;
import android.os.*;
import android.view.*;
import android.widget.*;
import java.util.concurrent.TimeUnit;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import org.robolectric.shadows.ShadowToast;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34,qualifiers="w192dp-h192dp-round-xhdpi") @LooperMode(LooperMode.Mode.PAUSED)
public class MapLocationControlTest {
    private ActivityController<MapActivity> controller;private MapActivity app;private LocationManager manager;
    @Before public void setup(){RuntimeEnvironment.getApplication().getSharedPreferences("foama",0).edit().clear().commit();shadowOf(RuntimeEnvironment.getApplication()).denyPermissions(Manifest.permission.ACCESS_COARSE_LOCATION,Manifest.permission.ACCESS_FINE_LOCATION);manager=(LocationManager)RuntimeEnvironment.getApplication().getSystemService(Context.LOCATION_SERVICE);shadowOf(manager).setLocationEnabled(true);shadowOf(manager).removeProvider("fused");shadowOf(manager).setProviderEnabled("network",true);shadowOf(manager).setProviderEnabled("gps",true);controller=Robolectric.buildActivity(MapActivity.class).create().start().resume();app=controller.get();}
    @After public void cleanup(){if(controller!=null)controller.pause().stop().destroy();}
    private TextView find(View view,String text){if(view instanceof TextView&&((TextView)view).getText().toString().equals(text))return (TextView)view;if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){TextView result=find(((ViewGroup)view).getChildAt(i),text);if(result!=null)return result;}return null;}
    private TextView button(){return find(app.getWindow().getDecorView(),"◎");}
    private void allow(){shadowOf(RuntimeEnvironment.getApplication()).grantPermissions(Manifest.permission.ACCESS_COARSE_LOCATION,Manifest.permission.ACCESS_FINE_LOCATION);}
    private void idle(long seconds){shadowOf(Looper.getMainLooper()).idleFor(seconds,TimeUnit.SECONDS);}
    private Location fix(float accuracy,long age){Location fix=new Location("network");fix.setLatitude(48.2085);fix.setLongitude(16.3726);fix.setAccuracy(accuracy);fix.setTime(System.currentTimeMillis()-age);return fix;}
    @Test public void buttonExplainsItselfAndMissingPermissionGivesFeedbackWithoutRequestingIt(){assertNotNull(button());assertEquals("Auf meinen Standort zentrieren",button().getContentDescription());button().performClick();assertEquals("Standort zuerst unter Nähe erlauben.",ShadowToast.getTextOfLatestToast());assertTrue(shadowOf(manager).getLocationUpdateListeners().isEmpty());assertNull(shadowOf(app).getLastRequestedPermission());}
    @Test public void alreadyCenteredLocationStillConfirmsWhatTheButtonDid()throws Exception{app.repo.acceptLocation(fix(10,0));button().performClick();assertEquals("Dein Standort · blauer Punkt in der Kartenmitte",ShadowToast.getTextOfLatestToast());java.lang.reflect.Field lat=TransitMapView.class.getDeclaredField("lat");lat.setAccessible(true);assertEquals(48.2085,lat.getDouble(app.map),.000001);button().performClick();assertEquals("Dein Standort · blauer Punkt in der Kartenmitte",ShadowToast.getTextOfLatestToast());assertTrue(shadowOf(manager).getLocationUpdateListeners().isEmpty());}
    @Test public void disabledSystemLocationIsExplainedInsteadOfBeingOverwrittenBySearching(){allow();shadowOf(manager).setLocationEnabled(false);button().performClick();assertEquals("Standort auf der Uhr einschalten.",ShadowToast.getTextOfLatestToast());assertTrue(shadowOf(manager).getLocationUpdateListeners().isEmpty());}
    @Test public void searchExplainsWaitingThenConfirmsFreshPositionAndStopsGps(){allow();button().performClick();assertEquals("Position wird gesucht …",ShadowToast.getTextOfLatestToast());shadowOf(manager).simulateLocation(fix(10,0));idle(0);assertEquals("Dein Standort · blauer Punkt in der Kartenmitte",ShadowToast.getTextOfLatestToast());assertTrue(app.repo.reliableLocation());assertTrue(shadowOf(manager).getLocationUpdateListeners().isEmpty());}
    @Test public void timeoutIsVisibleAndAnotherTapRetries(){allow();button().performClick();idle(31);assertTrue(ShadowToast.getTextOfLatestToast().contains("erneut versuchen"));assertTrue(shadowOf(manager).getLocationUpdateListeners().isEmpty());button().performClick();assertEquals("Position wird gesucht …",ShadowToast.getTextOfLatestToast());assertFalse(shadowOf(manager).getLocationUpdateListeners().isEmpty());}
    @Test public void approximateLocationDoesNotClaimToHaveCenteredOnAnAccurateBlueDot(){allow();button().performClick();shadowOf(manager).simulateLocation(fix(700,0));idle(0);assertTrue(ShadowToast.getTextOfLatestToast().contains("ungefähr"));assertFalse(app.repo.reliableLocation());idle(31);assertTrue(ShadowToast.getTextOfLatestToast().contains("ungefähr"));assertTrue(shadowOf(manager).getLocationUpdateListeners().isEmpty());}
    @Test public void screenOffCancelsUserSearchAndItsLateFeedback(){allow();button().performClick();LocationListener late=shadowOf(manager).getLocationUpdateListeners("network").get(0);RuntimeEnvironment.getApplication().sendBroadcast(new Intent(Intent.ACTION_SCREEN_OFF));idle(0);int count=ShadowToast.shownToastCount();late.onLocationChanged(fix(10,0));idle(40);assertNull(app.repo.currentLocation);assertTrue(shadowOf(manager).getLocationUpdateListeners().isEmpty());assertEquals(count,ShadowToast.shownToastCount());}
}
