package at.foama.wien;

import org.junit.*;
import static org.junit.Assert.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import android.app.AlertDialog;
import android.content.*;
import android.os.Looper;
import android.view.*;
import android.widget.TextView;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import org.json.JSONObject;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34)
@LooperMode(LooperMode.Mode.PAUSED)
public class UpdateUiTest {
    private ActivityController<MainActivity> controller;
    private MainActivity app;
    private Fake apk;
    private int requests;
    private static final class Fake extends HttpURLConnection {
        final byte[] body;final boolean blocked;final CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);volatile boolean disconnected;
        Fake(URL url,String body,boolean blocked){super(url);this.body=body.getBytes(StandardCharsets.UTF_8);this.blocked=blocked;}
        public int getResponseCode()throws IOException{entered.countDown();if(blocked)try{if(!release.await(15,TimeUnit.SECONDS))throw new IOException("test timeout");}catch(InterruptedException e){throw new InterruptedIOException();}return 200;}
        public InputStream getInputStream(){return new ByteArrayInputStream(body);}
        public void connect(){}public boolean usingProxy(){return false;}public void disconnect(){disconnected=true;release.countDown();}
    }
    @Before public void setup(){
        RuntimeEnvironment.getApplication().getSharedPreferences("foama",0).edit().clear().commit();
        controller=Robolectric.buildActivity(MainActivity.class).create().start();app=controller.get();app.repo.nextFetchElapsed=Long.MAX_VALUE;
        click("Mehr");click("App & Updates");controller.resume();
    }
    @After public void cleanup(){controller.pause().stop().destroy();if(apk!=null)apk.release.countDown();}
    private TextView find(View v,String label){if(v instanceof TextView&&((TextView)v).getText().toString().equals(label))return (TextView)v;if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++){TextView found=find(((ViewGroup)v).getChildAt(i),label);if(found!=null)return found;}return null;}
    private void click(String label){View v=find(app.getWindow().getDecorView(),label);assertNotNull(label,v);while(!v.isClickable()&&v.getParent() instanceof View)v=(View)v.getParent();assertTrue(v.performClick());}
    private Object field(String name)throws Exception{java.lang.reflect.Field f=MainActivity.class.getDeclaredField(name);f.setAccessible(true);return f.get(app);}
    private void completeIo()throws Exception{((Future<?>)field("updateRequest")).get(5,TimeUnit.SECONDS);idle();}
    private void idle(){Shadows.shadowOf(Looper.getMainLooper()).idle();}
    private boolean awake(Window window){return (window.getAttributes().flags&WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)!=0;}
    private AlertDialog offered(boolean block)throws Exception{
        String feed=new JSONObject().put("wearVersionCode",BuildConfig.VERSION_CODE+1).put("wearVersion","next").put("wearApkUrl","/apk/next.apk").put("wearApkBytes",4).put("wearApkSha256",new String(new char[64]).replace('\0','0')).toString();
        app.updateConnectionFactory=url->{requests++;if(url.getPath().equals("/update.json"))return new Fake(url,feed,false);apk=new Fake(url,"test",block);return apk;};app.checkUpdate();completeIo();return org.robolectric.shadows.ShadowAlertDialog.getLatestAlertDialog();
    }
    private AlertDialog download()throws Exception{AlertDialog offer=offered(true);assertEquals(1,requests);assertTrue(awake(offer.getWindow()));assertTrue(awake(app.getWindow()));offer.getButton(AlertDialog.BUTTON_POSITIVE).performClick();idle();AlertDialog progress=org.robolectric.shadows.ShadowAlertDialog.getLatestAlertDialog();assertNotSame(offer,progress);assertTrue(awake(progress.getWindow()));assertTrue(awake(app.getWindow()));return progress;}
    @Test public void actualDialogStaysAwakeAcrossIdleAndBriefVisiblePauseUntilStopped()throws Exception{
        AlertDialog progress=download();RequestScope scope=(RequestScope)field("updateScope");
        Shadows.shadowOf(Looper.getMainLooper()).idleFor(65,TimeUnit.SECONDS);assertTrue(progress.isShowing());assertTrue(awake(progress.getWindow()));assertFalse(scope.isCancelled());assertFalse(app.isFinishing());
        controller.pause();assertFalse(app.active);assertFalse(scope.isCancelled());assertTrue(awake(progress.getWindow()));assertTrue(awake(app.getWindow()));
        controller.resume();assertTrue(app.active);assertTrue(progress.isShowing());assertFalse(scope.isCancelled());assertFalse(app.isFinishing());
        controller.pause().stop();assertTrue(scope.isCancelled());assertFalse(progress.isShowing());assertFalse(awake(progress.getWindow()));assertFalse(awake(app.getWindow()));assertFalse(app.isFinishing());
    }
    @Test public void explicitCancelReleasesBothWindowsAndCannotInstallLateBytes()throws Exception{
        AlertDialog progress=download();RequestScope scope=(RequestScope)field("updateScope");progress.getButton(AlertDialog.BUTTON_NEGATIVE).performClick();idle();
        assertTrue(scope.isCancelled());assertFalse(awake(progress.getWindow()));assertFalse(awake(app.getWindow()));assertFalse(progress.isShowing());assertFalse(app.isFinishing());
        assertNull(Shadows.shadowOf(app).getNextStartedActivity());assertTrue(app.getPackageManager().getPackageInstaller().getMySessions().isEmpty());
    }
    @Test public void hashFailureClosesProgressAndReleasesScreenWithoutClosingApp()throws Exception{
        AlertDialog offer=offered(false);offer.getButton(AlertDialog.BUTTON_POSITIVE).performClick();idle();AlertDialog progress=org.robolectric.shadows.ShadowAlertDialog.getLatestAlertDialog();completeIo();
        assertFalse(awake(progress.getWindow()));assertFalse(awake(app.getWindow()));assertFalse(progress.isShowing());assertFalse(app.isFinishing());assertTrue(apk.disconnected);
        assertNotNull(find(app.getWindow().getDecorView(),"Download oder Prüfung fehlgeschlagen. Bitte erneut versuchen."));assertTrue(app.getPackageManager().getPackageInstaller().getMySessions().isEmpty());
    }
    @Test public void powerOffStillCancelsAndDoesNotWakeOrRelaunchTheWatch()throws Exception{
        AlertDialog progress=download();RequestScope scope=(RequestScope)field("updateScope");app.sendBroadcast(new Intent(Intent.ACTION_SCREEN_OFF));idle();
        assertTrue(scope.isCancelled());assertFalse(awake(progress.getWindow()));assertFalse(awake(app.getWindow()));assertFalse(app.active);assertFalse(app.isFinishing());assertNull(Shadows.shadowOf(app).getNextStartedActivity());
    }
    @Test public void aStalledOperationHasABoundedAwakeTimeAndCanBeRetried()throws Exception{
        AlertDialog progress=download();RequestScope scope=(RequestScope)field("updateScope");Shadows.shadowOf(Looper.getMainLooper()).idleFor(MainActivity.UPDATE_TIMEOUT_MS,TimeUnit.MILLISECONDS);
        assertTrue(scope.isCancelled());assertFalse(progress.isShowing());assertFalse(awake(app.getWindow()));assertFalse(awake(progress.getWindow()));assertNotNull(find(app.getWindow().getDecorView(),"Update dauert zu lange. Bitte erneut versuchen."));
        offered(false);assertTrue(awake(app.getWindow()));assertFalse(app.isFinishing());
    }
    @Test public void postponingTheOfferRestoresNormalScreenTimeoutWithoutDownloading()throws Exception{
        AlertDialog offer=offered(false);offer.getButton(AlertDialog.BUTTON_NEGATIVE).performClick();idle();assertEquals(1,requests);assertFalse(offer.isShowing());assertFalse(awake(offer.getWindow()));assertFalse(awake(app.getWindow()));assertFalse(app.isFinishing());
    }
    @Test public void missingAndroidConfirmationCannotCrashTheAppOrLeaveProgressAwake()throws Exception{
        AlertDialog progress=download();Context missingInstaller=new ContextWrapper(app){@Override public void startActivity(Intent intent){throw new ActivityNotFoundException("No installer");}};
        File staged=new File(app.getCacheDir(),"staging-test.apk");try(FileOutputStream out=new FileOutputStream(staged)){out.write(new byte[]{1,2,3,4});}Updater.requestInstall(app,staged,new RequestScope());staged.delete();int id=app.getPackageManager().getPackageInstaller().getMySessions().get(0).getSessionId();
        new UpdateReceiver().onReceive(missingInstaller,new Intent().putExtra(android.content.pm.PackageInstaller.EXTRA_SESSION_ID,id).putExtra(android.content.pm.PackageInstaller.EXTRA_STATUS,android.content.pm.PackageInstaller.STATUS_PENDING_USER_ACTION).putExtra(Intent.EXTRA_INTENT,new Intent("missing.installer")));idle();
        assertFalse(progress.isShowing());assertFalse(awake(progress.getWindow()));assertFalse(awake(app.getWindow()));assertFalse(app.isFinishing());assertNotNull(find(app.getWindow().getDecorView(),"Update nicht installiert. Bitte erneut versuchen."));
    }
}
