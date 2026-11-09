package at.foama.wien;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import android.content.Context;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import org.json.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34)
public class RequestCleanupTest {
    private Context ctx;
    @Before public void setup(){ctx=RuntimeEnvironment.getApplication();ctx.getSharedPreferences("foama",0).edit().clear().commit();Updater.clearDownloadCache(ctx);}
    private static class Fake extends HttpURLConnection {
        byte[] body;int status=200;boolean disconnected;CountDownLatch entered,release;
        Fake(URL url,String body){super(url);this.body=body.getBytes(StandardCharsets.UTF_8);}
        @Override public int getResponseCode()throws IOException {if(entered!=null){entered.countDown();try{if(!release.await(3,TimeUnit.SECONDS))throw new IOException("test timeout");}catch(InterruptedException e){throw new IOException(e);}}return status;}
        @Override public InputStream getInputStream(){return new ByteArrayInputStream(body);}
        public void connect(){}public boolean usingProxy(){return false;}public void disconnect(){disconnected=true;if(release!=null)release.countDown();}
    }
    private void assertNoDownloads(){File[] files=new File(ctx.getCacheDir(),"updates").listFiles();assertTrue(files==null||files.length==0);}
    private Updater.Callback callback(){return new Updater.Callback(){public void onStatus(String s){}public void onApk(File f){fail("Unverified/cancelled APK must not be offered");}};}
    private String feed(long size)throws Exception {return new JSONObject().put("wearVersionCode",BuildConfig.VERSION_CODE+1).put("wearVersion","next").put("wearApkUrl","/apk/update.apk").put("wearApkSha256",String.join("",Collections.nCopies(64,"0"))).put("wearApkBytes",size).toString();}
    @Test public void cancellationDisconnectsLiveConnectionAndRejectsLateSuccessfulResponse()throws Exception {
        Repo repo=new Repo(ctx);Repo.Stop stop=repo.stops.get(0);repo.lastError="kept";AtomicReference<Fake> opened=new AtomicReference<>();CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);
        RequestScope scope=new RequestScope(url->{Fake con=new Fake(url,"{\"data\":{\"monitors\":[]}}");con.entered=entered;con.release=release;opened.set(con);return con;});
        ExecutorService pool=Executors.newSingleThreadExecutor();try{Future<?> task=pool.submit(()->{try{repo.fetchDepartures(Arrays.asList(stop),Arrays.asList(stop.rbl.get(0)),scope);}catch(Exception e){throw new RuntimeException(e);}});assertTrue(entered.await(3,TimeUnit.SECONDS));scope.cancel();task.get(3,TimeUnit.SECONDS);assertTrue(opened.get().disconnected);assertEquals(0,repo.lastFetch);assertEquals("kept",repo.lastError);assertEquals(0,repo.failures);}finally{release.countDown();pool.shutdownNow();}
    }
    @Test public void cancelledScopeDoesNotOpenAnotherConnection()throws Exception {AtomicInteger opened=new AtomicInteger();RequestScope scope=new RequestScope(url->{opened.incrementAndGet();return new Fake(url,"{}");});scope.cancel();try{Repo.jsonHttp(BuildConfig.FOAMA_BASE_URL+"/api/health","GET",null,scope);fail();}catch(InterruptedIOException expected){}assertEquals(0,opened.get());}
    @Test public void httpFailureAlwaysDisconnects()throws Exception {Fake[] con={null};RequestScope scope=new RequestScope(url->{con[0]=new Fake(url,"");con[0].status=503;return con[0];});try{Repo.jsonHttp(BuildConfig.FOAMA_BASE_URL+"/api/health","GET",null,scope);fail();}catch(IOException expected){}assertTrue(con[0].disconnected);}
    @Test public void hashFailureRemovesPartialUpdateAndClosesConnection()throws Exception {List<Fake> opened=new ArrayList<>();String feed=feed(4);RequestScope scope=new RequestScope(url->{Fake con=new Fake(url,url.getPath().equals("/update.json")?feed:"test");opened.add(con);return con;});try{Updater.download(ctx,Updater.check(ctx,scope),callback(),scope);fail();}catch(SecurityException expected){}assertEquals(2,opened.size());for(Fake con:opened)assertTrue(con.disconnected);assertNoDownloads();}
    @Test public void oversizedUpdateIsRejectedBeforeItsDownload()throws Exception {AtomicInteger opened=new AtomicInteger();String feed=feed(Updater.MAX_APK_BYTES+1);RequestScope scope=new RequestScope(url->{opened.incrementAndGet();return new Fake(url,feed);});try{Updater.download(ctx,Updater.check(ctx,scope),callback(),scope);fail();}catch(IOException expected){}assertEquals(1,opened.get());assertNoDownloads();}
    @Test public void apkHttpFailureClosesConnectionAndLeavesNoFile()throws Exception {String feed=feed(4);Fake[] apk={null};RequestScope scope=new RequestScope(url->{Fake con=new Fake(url,feed);if(!url.getPath().equals("/update.json")){con.status=503;apk[0]=con;}return con;});try{Updater.download(ctx,Updater.check(ctx,scope),callback(),scope);fail();}catch(IOException expected){}assertTrue(apk[0].disconnected);assertNoDownloads();}
    @Test public void cleanupRemovesOldUpdateFilesAndPreservesOtherAppCache()throws Exception {File dir=new File(ctx.getCacheDir(),"updates");dir.mkdirs();new FileOutputStream(new File(dir,"foama-wien-update.apk")).close();new FileOutputStream(new File(dir,"foama-wien-part.apk")).close();File other=new File(ctx.getCacheDir(),"unrelated");new FileOutputStream(other).close();Updater.clearDownloadCache(ctx);assertNoDownloads();assertTrue(other.exists());other.delete();}
    @Test public void checkingAnAvailableUpdateOnlyReadsMetadataAndNeverDownloads()throws Exception {
        AtomicInteger opened=new AtomicInteger();String metadata=feed(4);RequestScope scope=new RequestScope(url->{assertEquals("/update.json",url.getPath());opened.incrementAndGet();return new Fake(url,metadata);});
        Updater.UpdateInfo update=Updater.check(ctx,scope);assertNotNull(update);assertEquals(BuildConfig.VERSION_CODE+1,update.code);assertEquals(4,update.bytes);assertEquals(1,opened.get());assertNoDownloads();scope.cancel();
        try{Updater.download(ctx,update,callback(),scope);fail();}catch(InterruptedIOException expected){}assertEquals(1,opened.get());assertNoDownloads();
    }
    @Test public void explicitDownloadReportsMonotonicProgressAndInvalidHashCannotReachInstaller()throws Exception {
        List<Long> progress=new ArrayList<>();String metadata=feed(20000);RequestScope scope=new RequestScope(url->{Fake con=new Fake(url,metadata);if(!url.getPath().equals("/update.json"))con.body=new byte[20000];return con;});
        Updater.UpdateInfo update=Updater.check(ctx,scope);assertTrue(progress.isEmpty());
        try{Updater.download(ctx,update,new Updater.Callback(){public void onStatus(String s){}public void onApk(File file){fail("Bad hash offered");}public void onProgress(long bytes,long total){assertEquals(20000,total);if(!progress.isEmpty())assertTrue(bytes>=progress.get(progress.size()-1));assertTrue(bytes<=total);progress.add(bytes);}},scope);fail();}catch(SecurityException expected){}
        assertEquals(Long.valueOf(0),progress.get(0));assertEquals(Long.valueOf(20000),progress.get(progress.size()-1));assertTrue(progress.size()>2);assertNoDownloads();
    }
    @Test public void availableReleaseShowsAtMostFourBoundedNotesBeforeDownload()throws Exception {JSONObject metadata=new JSONObject(feed(4));metadata.put("wearReleaseNotes",new JSONArray().put("A nach B").put("JSON importieren").put("Fortschritt\nund Bestätigung").put("Akku sparen").put("Fifth ignored"));AtomicInteger opened=new AtomicInteger();RequestScope scope=new RequestScope(url->{opened.incrementAndGet();return new Fake(url,metadata.toString());});Updater.UpdateInfo info=Updater.check(ctx,scope);assertEquals(4,info.notes.size());assertEquals("A nach B",info.notes.get(0));assertEquals("Fortschritt und Bestätigung",info.notes.get(2));assertEquals(1,opened.get());assertNoDownloads();}
}
