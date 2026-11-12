package at.foama.wien;

import android.content.*;
import android.location.Location;
import android.os.*;
import android.util.Base64;
import android.view.*;
import android.widget.TextView;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.zip.*;
import org.json.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34,qualifiers="w192dp-h192dp-round-xhdpi") @LooperMode(LooperMode.Mode.PAUSED)
public class OfflineTimetableTest {
    static final String STOP="wl:60201917",VERSION="0123456789abcdef0123",SOURCE=new String(new char[64]).replace('\0','a');
    private Context context;private Repo repo;
    @Before public void setup(){
        context=RuntimeEnvironment.getApplication();context.getSharedPreferences("foama",0).edit().clear().commit();
        WatchTestEnvironment.offline();repo=new Repo(context);
    }
    private static long at(String value){return OffsetDateTime.parse(value).toInstant().toEpochMilli();}
    private static byte[] json(JSONObject value){return value.toString().getBytes(StandardCharsets.UTF_8);}
    private byte[] archive(String from,String through,String serviceDay,int... seconds)throws Exception {
        JSONArray values=new JSONArray();for(int second:seconds)values.put(second);
        JSONArray row=new JSONArray().put("29B").put("Floridsdorf S U").put("bus").put("at:49:1917:0:1").put("0").put(0).put(values);
        JSONObject manifest=new JSONObject().put("format",1).put("city","wien").put("timezone","Europe/Vienna").put("version",VERSION).put("sourceSha256",SOURCE).put("validFrom",from).put("validThrough",through)
            .put("stations",new JSONObject().put(STOP,0)).put("services",new JSONArray().put(new JSONArray().put(serviceDay)));
        JSONObject hashes=new JSONObject();LinkedHashMap<String,byte[]> files=new LinkedHashMap<>();
        for(int i=0;i<32;i++){
            JSONObject data=i==0?new JSONObject().put(STOP,new JSONArray().put(row)):new JSONObject();
            ByteArrayOutputStream compressed=new ByteArrayOutputStream();try(GZIPOutputStream gzip=new GZIPOutputStream(compressed)){gzip.write(json(data));}
            byte[] shard=json(new JSONObject().put("format",1).put("version",VERSION).put("encoding","gzip-base64").put("payload",Base64.encodeToString(compressed.toByteArray(),Base64.NO_WRAP)));
            hashes.put(""+i,OfflineTimetable.hex(shard).substring(0,16));files.put(i+".json",shard);
        }
        manifest.put("shards",hashes);files.put("manifest.json",json(manifest));ByteArrayOutputStream output=new ByteArrayOutputStream();
        try(ZipOutputStream zip=new ZipOutputStream(output)){for(Map.Entry<String,byte[]> entry:files.entrySet()){zip.putNextEntry(new ZipEntry(entry.getKey()));zip.write(entry.getValue());zip.closeEntry();}}
        return output.toByteArray();
    }
    private OfflineTimetable.Snapshot snapshot(byte[] data)throws Exception {
        File file=File.createTempFile("timetable", ".zip",context.getCacheDir());try(FileOutputStream out=new FileOutputStream(file)){out.write(data);}return new OfflineTimetable.Snapshot(file,true);
    }
    private JSONObject metadata(byte[] data,String from,String through)throws Exception {
        String digest=OfflineTimetable.hex(data);return new JSONObject().put("format",1).put("city","wien").put("timezone","Europe/Vienna").put("version",VERSION).put("sourceSha256",SOURCE).put("validFrom",from).put("validThrough",through).put("filename","watch-"+digest.substring(0,20)+".zip").put("sha256",digest).put("bytes",data.length).put("stations",1);
    }
    private static class Response extends HttpURLConnection {
        final byte[] data;boolean closed;Response(URL url,byte[] data){super(url);this.data=data;}
        public int getResponseCode(){return 200;}public InputStream getInputStream(){return new ByteArrayInputStream(data);}
        public void disconnect(){closed=true;}public boolean usingProxy(){return false;}public void connect(){}
    }
    private RequestScope response(JSONObject metadata,byte[] archive,AtomicInteger count){return new RequestScope(url->{assertTrue(url.getPath().startsWith("/data/timetables/wien/"));assertNull(url.getQuery());count.incrementAndGet();return new Response(url,url.getPath().endsWith("watch.json")?json(metadata):archive);});}
    @Test public void fullBundledTimetableWorksOnFirstOfflineLaunchWithoutFetchingAnything(){
        assertNotNull(repo.timetable.current(System.currentTimeMillis()));assertEquals(1695,repo.timetable.current(System.currentTimeMillis()).stations.length());
        List<Repo.Departure> times=repo.timetable.departures(STOP,System.currentTimeMillis());assertFalse(times.isEmpty());
        for(Repo.Departure departure:times){assertTrue(departure.offline);assertEquals(0,departure.fetchedAt);assertEquals("FAHRPLAN",repo.quality(departure));assertFalse(repo.fresh(departure));assertEquals("○ Ungewiss",repo.feasibility(repo.findStop(STOP),departure));}
        assertTrue(repo.departures.isEmpty());repo.saveCache();assertFalse(repo.prefs.getString("departures","").contains("29B"));
    }
    @Test public void hardExpiryUsesViennaMidnightRegardlessOfDeviceTimezone()throws Exception {
        TimeZone old=TimeZone.getDefault();try{TimeZone.setDefault(TimeZone.getTimeZone("Pacific/Honolulu"));
            OfflineTimetable.Snapshot snapshot=snapshot(archive("2026-12-12","2026-12-12","2026-12-12",86399,86400,90000));
            assertEquals(1,snapshot.departures(STOP,at("2026-12-12T23:59:58+01:00")).size());
            assertTrue(snapshot.departures(STOP,at("2026-12-13T00:00:00+01:00")).isEmpty());
            assertTrue(snapshot.departures(STOP,at("2026-12-11T23:59:59+01:00")).isEmpty());
        }finally{TimeZone.setDefault(old);}
    }
    @Test public void afterMidnightServiceBelongsToPreviousCalendarDay()throws Exception {
        OfflineTimetable.Snapshot snapshot=snapshot(archive("2026-11-09","2026-12-12","2026-11-11",90000));
        List<Repo.Departure> departures=snapshot.departures(STOP,at("2026-11-12T00:50:00+01:00"));
        assertEquals(1,departures.size());assertEquals(at("2026-11-12T01:00:00+01:00"),departures.get(0).when);
        assertTrue(snapshot.departures(STOP,at("2026-11-13T00:50:00+01:00")).isEmpty());
    }
    @Test public void daylightSavingUsesGtfsNoonMinusTwelveHours()throws Exception {
        OfflineTimetable.Snapshot snapshot=snapshot(archive("2026-10-24","2026-11-01","2026-10-25",5400));
        List<Repo.Departure> departures=snapshot.departures(STOP,at("2026-10-25T00:00:00Z"));assertEquals(1,departures.size());assertEquals(at("2026-10-25T00:30:00Z"),departures.get(0).when);
    }
    @Test public void unrelatedServiceDayUnknownStopAndPastTimesProduceNoInventedDeparture()throws Exception {
        OfflineTimetable.Snapshot snapshot=snapshot(archive("2026-11-09","2026-12-12","2026-11-11",43200));
        assertTrue(snapshot.departures(STOP,System.currentTimeMillis()).isEmpty());assertTrue(snapshot.departures("unknown",System.currentTimeMillis()).isEmpty());
    }
    @Test public void freshApiWinsAndAgedApiIsReplacedByScheduleForSameConnection(){
        Repo.Stop stop=repo.findStop(STOP);List<List<Repo.Departure>> initial=repo.connections(stop,"29B","Floridsdorf S U",true,"bus");assertFalse(initial.isEmpty());
        Repo.Departure live=new Repo.Departure();live.stopKey=STOP;live.route="29B";live.towards="Floridsdorf S U";live.mode="bus";live.quality="Live";live.when=System.currentTimeMillis()+123000;live.fetchedAt=System.currentTimeMillis();repo.departures.add(live);
        List<Repo.Departure> group=repo.connections(stop,"29B","Floridsdorf S U",true,"bus").get(0);assertEquals(1,group.size());assertSame(live,group.get(0));
        live.fetchedAt-=100000;group=repo.connections(stop,"29B","Floridsdorf S U",true,"bus").get(0);assertTrue(group.get(0).offline);assertFalse(group.contains(live));
    }
    @Test public void offlineFiltersPreserveDirectionAndModeAndFavoriteIndependence(){
        Repo.Stop stop=repo.findStop(STOP);repo.prefs.edit().putBoolean("mode_bus",false).commit();
        assertTrue(repo.connections(stop,"29B","Floridsdorf S U",false,"bus").isEmpty());assertFalse(repo.connections(stop,"29B","Floridsdorf S U",true,"bus").isEmpty());assertTrue(repo.connections(stop,"29B","other",true,"bus").isEmpty());
    }
    @Test public void savedRouteGetsOfflineBoardingTimesWithEquivalentTerminalName()throws Exception {
        JSONObject leg=new JSONObject().put("route","29B").put("mode","bus").put("towards","Wien Floridsdorf S U").put("from",new JSONObject().put("stopId",STOP));
        List<Repo.Departure> rows=JourneyStore.departures(leg,repo);assertFalse(rows.isEmpty());for(Repo.Departure row:rows){assertTrue(row.offline);assertEquals("FAHRPLAN",repo.quality(row));}assertTrue(repo.departures.isEmpty());
    }
    @Test public void unchangedBundledArchiveChecksOnlyMetadataAndDoesNotDownloadAgain()throws Exception {
        byte[] bytes=OfflineTimetable.read(context.getAssets().open("timetable-wien.zip"),OfflineTimetable.MAX_ARCHIVE);OfflineTimetable.Snapshot snapshot=repo.timetable.current(System.currentTimeMillis());
        JSONObject data=metadata(bytes,snapshot.from.toString(),snapshot.through.toString()).put("version",snapshot.manifest.getString("version")).put("sourceSha256",snapshot.manifest.getString("sourceSha256")).put("stations",snapshot.stations.length());
        AtomicInteger calls=new AtomicInteger();WatchTestEnvironment.online();repo.timetable.update(response(data,bytes,calls),true);assertEquals(1,calls.get());assertEquals("[]",repo.prefs.getString("offlineTimetableFiles","[]"));assertFalse(repo.timetable.due(System.currentTimeMillis()));
    }
    @Test public void expiredScheduleCannotBeRevivedByReopeningOrCacheSave(){
        long now=at("2026-12-13T00:00:00+01:00");assertNull(repo.timetable.current(now));assertTrue(repo.timetable.status(now).contains("abgelaufen"));
        repo.saveCache();Repo reopened=new Repo(context);assertTrue(reopened.timetable.departures(STOP,now).isEmpty());assertTrue(reopened.timetable.due(now));
    }
    @Test public void completeValidatedDownloadSurvivesOfflineRestartWithoutApkUpdate()throws Exception {
        long now=at("2026-11-12T12:00:00+01:00");byte[] bytes=archive("2026-11-09","2026-12-12","2026-11-12",43800);JSONObject metadata=metadata(bytes,"2026-11-09","2026-12-12");AtomicInteger calls=new AtomicInteger();WatchTestEnvironment.online();RequestScope scope=response(metadata,bytes,calls);repo.timetable.update(scope,true,now);
        assertEquals(2,calls.get());assertEquals(VERSION,repo.timetable.current(now).manifest.getString("version"));assertFalse(repo.timetable.due(now));
        WatchTestEnvironment.offline();Repo reopened=new Repo(context);List<Repo.Departure> times=reopened.timetable.departures(STOP,now);assertEquals(1,times.size());assertEquals(now+600000,times.get(0).when);assertTrue(reopened.timetable.status(now).contains("12.12.2026"));
    }
    @Test public void corruptOrPartialDownloadNeverReplacesWorkingTimetable()throws Exception {
        byte[] bytes=archive("2026-11-09","2026-12-12","2026-11-12",43800);JSONObject metadata=metadata(bytes,"2026-11-09","2026-12-12");OfflineTimetable.Snapshot previous=repo.timetable.current(System.currentTimeMillis());WatchTestEnvironment.online();
        try{repo.timetable.update(response(metadata,Arrays.copyOf(bytes,bytes.length-1),new AtomicInteger()),true);fail();}catch(IOException expected){}
        assertSame(previous,repo.timetable.current(System.currentTimeMillis()));assertEquals("[]",repo.prefs.getString("offlineTimetableFiles","[]"));assertTrue(new Repo(context).timetable.departures(STOP,System.currentTimeMillis()).size()>0);
    }
    @Test public void metadataAndArchiveValidityMustMatch()throws Exception {
        byte[] bytes=archive("2026-11-09","2026-12-12","2026-11-12",43800);JSONObject metadata=metadata(bytes,"2026-11-09","2026-12-13");OfflineTimetable.Snapshot previous=repo.timetable.current(System.currentTimeMillis());WatchTestEnvironment.online();
        try{repo.timetable.update(response(metadata,bytes,new AtomicInteger()),true);fail();}catch(IOException expected){}assertSame(previous,repo.timetable.current(System.currentTimeMillis()));
    }
    @Test public void expiredServerDataDoesNotExtendTheOldWindowOrDownloadAnArchive()throws Exception {
        long now=at("2026-12-13T00:00:00+01:00");byte[] bytes=archive("2026-11-09","2026-12-12","2026-12-12",90000);JSONObject metadata=metadata(bytes,"2026-11-09","2026-12-12");AtomicInteger calls=new AtomicInteger();WatchTestEnvironment.online();
        try{repo.timetable.update(response(metadata,bytes,calls),true,now);fail();}catch(IOException expected){}
        assertEquals(1,calls.get());assertNull(repo.timetable.current(now));assertTrue(repo.timetable.departures(STOP,now).isEmpty());assertTrue(repo.timetable.updateMessage.contains("Noch kein neuer"));
    }
    @Test public void futurePackKeepsTodaysPackAndActivatesOnlyOnItsOwnStartDate()throws Exception {
        long now=at("2026-11-12T12:00:00+01:00");byte[] bytes=archive("2026-11-13","2026-12-13","2026-11-13",43800);JSONObject metadata=metadata(bytes,"2026-11-13","2026-12-13");WatchTestEnvironment.online();repo.timetable.update(response(metadata,bytes,new AtomicInteger()),true,now);
        assertFalse(VERSION.equals(repo.timetable.current(now).manifest.getString("version")));
        long tomorrow=at("2026-11-13T12:00:00+01:00");assertEquals(VERSION,repo.timetable.current(tomorrow).manifest.getString("version"));assertEquals(1,repo.timetable.departures(STOP,tomorrow).size());
    }
    @Test public void cancellationDuringDownloadKeepsOldDataAndRejectsLateCommit()throws Exception {
        byte[] bytes=archive("2026-11-09","2026-12-12","2026-11-12",43800);JSONObject metadata=metadata(bytes,"2026-11-09","2026-12-12");WatchTestEnvironment.online();OfflineTimetable.Snapshot previous=repo.timetable.current(System.currentTimeMillis());RequestScope[] scope=new RequestScope[1];
        scope[0]=new RequestScope(url->new Response(url,url.getPath().endsWith("watch.json")?json(metadata):bytes){@Override public InputStream getInputStream(){if(url.getPath().endsWith("watch.json"))return super.getInputStream();return new ByteArrayInputStream(data){@Override public synchronized int read(byte[] buffer,int start,int length){int count=super.read(buffer,start,length);scope[0].cancel();return count;}};}});
        try{repo.timetable.update(scope[0],true);fail();}catch(InterruptedIOException expected){}assertSame(previous,repo.timetable.current(System.currentTimeMillis()));assertFalse(repo.timetable.updating);assertEquals("[]",repo.prefs.getString("offlineTimetableFiles","[]"));
    }
    @Test public void recentlyKnownPositionSurvivesPauseOnlyInMemoryAndExpires(){
        Repo.Stop stop=repo.findStop(STOP);Location fix=new Location("gps");fix.setLatitude(stop.lat);fix.setLongitude(stop.lon);fix.setTime(System.currentTimeMillis()-120000);fix.setAccuracy(8);repo.acceptLocation(fix);repo.pause();
        assertNotNull(repo.currentLocation);assertFalse(repo.reliableLocation());assertFalse(repo.nearby().isEmpty());assertNull(new Repo(context).currentLocation);
        repo.currentLocation.setTime(System.currentTimeMillis()-600001);assertTrue(repo.nearby().isEmpty());repo.expireMemoryLocation();assertNull(repo.currentLocation);
    }
    private String texts(View view){String result=view instanceof TextView?((TextView)view).getText().toString():"";if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)result+="\n"+texts(((ViewGroup)view).getChildAt(i));return result;}
    @Test public void nearbyStationsAndPlannedDeparturesRenderWithoutAnyNetworkOrPriorFetch(){
        ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).create().start();MainActivity app=controller.get();
        try{Repo.Stop stop=app.repo.findStop(STOP);Location fix=new Location("gps");fix.setLatitude(stop.lat);fix.setLongitude(stop.lon);fix.setAccuracy(8);fix.setTime(System.currentTimeMillis());app.repo.acceptLocation(fix);app.renderContent();String text=texts(app.getWindow().getDecorView());assertTrue(text.contains("Paukerwerkstraße"));assertTrue(text.contains("FAHRPLAN"));assertTrue(text.contains("offline"));assertFalse(text.contains("LIVE"));assertTrue(app.repo.departures.isEmpty());}
        finally{controller.stop().destroy();}
    }
    private void layout(View view){view.forceLayout();if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)layout(((ViewGroup)view).getChildAt(i));}
    private void image(MainActivity app,String filename)throws Exception {
        View view=app.getWindow().getDecorView();int size=Math.round(192*app.getResources().getDisplayMetrics().density);layout(view);view.measure(View.MeasureSpec.makeMeasureSpec(size,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(size,View.MeasureSpec.EXACTLY));view.layout(0,0,size,size);
        android.graphics.Bitmap bitmap=android.graphics.Bitmap.createBitmap(size,size,android.graphics.Bitmap.Config.ARGB_8888);android.graphics.Canvas canvas=new android.graphics.Canvas(bitmap);android.graphics.Path clip=new android.graphics.Path();clip.addCircle(size/2f,size/2f,size/2f,android.graphics.Path.Direction.CW);canvas.clipPath(clip);view.draw(canvas);try(FileOutputStream out=new FileOutputStream(".local/"+filename)){bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG,100,out);}bitmap.recycle();
    }
    private TextView firstTime(View view){if(view instanceof TextView&&((TextView)view).getTextSize()/view.getResources().getDisplayMetrics().scaledDensity>=28&&((TextView)view).getText().toString().endsWith("′"))return (TextView)view;if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){TextView found=firstTime(((ViewGroup)view).getChildAt(i));if(found!=null)return found;}return null;}
    @Test @GraphicsMode(GraphicsMode.Mode.NATIVE) public void offlineFirstDepartureAndSourceFitSmallRoundWatch()throws Exception {
        ActivityController<MainActivity> controller=Robolectric.buildActivity(MainActivity.class).create().start();MainActivity app=controller.get();
        try{Repo.Stop stop=app.repo.findStop(STOP);Location fix=new Location("gps");fix.setLatitude(stop.lat);fix.setLongitude(stop.lon);fix.setAccuracy(8);fix.setTime(System.currentTimeMillis());app.repo.acceptLocation(fix);app.renderContent();image(app,"wear-offline-near-192.png");
            TextView time=firstTime(app.getWindow().getDecorView());assertNotNull(time);android.graphics.Rect bounds=new android.graphics.Rect(0,0,time.getWidth(),time.getHeight());((ViewGroup)app.getWindow().getDecorView()).offsetDescendantRectToMyCoords(time,bounds);assertTrue("Offline minutes remain on first screen",bounds.bottom/app.getResources().getDisplayMetrics().density<=180);
            assertTrue(texts(app.getWindow().getDecorView()).contains("FAHRPLAN"));
        }finally{controller.stop().destroy();}
    }
}
