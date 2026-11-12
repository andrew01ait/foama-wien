package at.foama.wien;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import android.location.Location;
import org.json.*;
import java.util.*;
@RunWith(RobolectricTestRunner.class) @Config(sdk=34)
public class RepoTest {
    private Repo repo;
    @Before public void setup(){RuntimeEnvironment.getApplication().getSharedPreferences("foama",0).edit().clear().commit();repo=new Repo(RuntimeEnvironment.getApplication());}
    private Location fix(double lat,double lon,float accuracy,long time){Location x=new Location("test");x.setLatitude(lat);x.setLongitude(lon);x.setAccuracy(accuracy);x.setTime(time);return x;}
    private Repo.Stop station(String name){for(Repo.Stop s:repo.stops)if(s.name.equals(name))return s;throw new AssertionError(name);}
    private JSONObject payload(String rbl,long now,boolean real)throws Exception {String time=java.time.Instant.ofEpochMilli(now+120000).toString();return new JSONObject("{\"message\":{\"value\":1},\"data\":{\"monitors\":[{\"locationStop\":{\"properties\":{\"attributes\":{\"rbl\":\""+rbl+"\"}}},\"lines\":[{\"name\":\"U1\",\"towards\":\"Leopoldau\",\"type\":\"ptMetro\",\"departures\":{\"departure\":[{\"departureTime\":{\"timePlanned\":\""+time+"\""+(real?",\"timeReal\":\""+time+"\"":"")+"}}]}}]}]}}");}
    @Test public void catalogueAndStrictModeFilteringAreAvailableOffline(){assertTrue(repo.stops.size()>1700);Repo.Stop s=station("Stephansplatz U");repo.acceptLocation(fix(s.lat,s.lon,700,System.currentTimeMillis()));repo.prefs.edit().putBoolean("mode_bus",false).putBoolean("mode_tram",false).putBoolean("mode_sbahn",false).commit();for(Repo.Stop n:repo.nearby())assertTrue(n.modes.contains("metro"));assertFalse(repo.nearby().isEmpty());assertFalse(repo.reliableLocation());}
    @Test public void smallFixRefreshesAgeAndPrecision(){long now=System.currentTimeMillis();repo.acceptLocation(fix(48.2,16.3,700,now-10000));assertFalse(repo.acceptLocation(fix(48.2,16.3,5,now)));assertEquals(now,repo.currentLocation.getTime());assertTrue(repo.reliableLocation());assertFalse(repo.acceptLocation(fix(48.1,16.2,5,now-30000)));assertEquals(48.2,repo.currentLocation.getLatitude(),0.00001);}
    @Test public void vehicleSpeedDisablesWalkingAssurance(){long now=System.currentTimeMillis();Location location=fix(48.2,16.3,5,now);location.setSpeed(10);repo.acceptLocation(location);assertTrue(repo.moving());assertFalse(repo.reliableLocation());}
    @Test public void liveAndScheduleQualityAndPartialCacheAreHonest()throws Exception {Repo.Stop a=station("Stephansplatz U"),b=station("Graben, Petersplatz");long now=System.currentTimeMillis();String ar=a.rbl.get(0),br=b.rbl.get(0);repo.mergeMonitor(payload(ar,now,true),Arrays.asList(a),Arrays.asList(ar),now);repo.mergeMonitor(payload(br,now,false),Arrays.asList(b),Arrays.asList(br),now);assertEquals(2,repo.departures.size());assertEquals("Live",repo.departures.get(0).quality);assertEquals("Fahrplan",repo.departures.get(1).quality);repo.mergeMonitor(new JSONObject("{\"data\":{\"monitors\":[]}}"),Arrays.asList(a),Arrays.asList(ar),now);assertEquals(1,repo.departures.size());assertEquals(b.id,repo.departures.get(0).stopKey);}
    @Test public void malformedApiDoesNotDeleteGoodCache()throws Exception {Repo.Stop s=station("Stephansplatz U");long now=System.currentTimeMillis();repo.mergeMonitor(payload(s.rbl.get(0),now,true),Arrays.asList(s),s.rbl,now);try{repo.mergeMonitor(new JSONObject("{}"),Arrays.asList(s),s.rbl,now);fail();}catch(java.io.IOException expected){}assertEquals(1,repo.departures.size());repo.lastError="HTTP 502";assertEquals("ÄLTER",repo.quality(repo.departures.get(0)));assertEquals("○ Ungewiss",repo.feasibility(s,repo.departures.get(0)));}
    @Test public void cachedApproachBoardsKeepTheirActualAgeAndCannotUndoANewerEmptyBoard()throws Exception{Repo.Stop s=station("Stephansplatz U");long now=System.currentTimeMillis(),source=now-5000;JSONObject body=payload(s.rbl.get(0),now,true).put("foamaMonitorAt",java.time.Instant.ofEpochMilli(source).toString());repo.mergeMonitor(body,Arrays.asList(s),s.rbl,now);assertEquals(source,repo.departures.get(0).fetchedAt);repo.mergeMonitor(body,Arrays.asList(s),s.rbl,now+4000);assertEquals(source,repo.departures.get(0).fetchedAt);JSONObject empty=new JSONObject("{data:{monitors:[]}}").put("foamaMonitorAt",java.time.Instant.ofEpochMilli(now).toString());repo.mergeMonitor(empty,Arrays.asList(s),s.rbl,now);assertTrue(repo.departures.isEmpty());repo.mergeMonitor(body,Arrays.asList(s),s.rbl,now+5000);assertTrue(repo.departures.isEmpty());}
    @Test public void favoritesAndDepartureCacheSurviveReloadButLocationDoesNot()throws Exception {Repo.Stop s=station("Stephansplatz U");repo.toggleFavorite(s,"U1","Leopoldau");repo.acceptLocation(fix(s.lat,s.lon,5,System.currentTimeMillis()));repo.mergeMonitor(payload(s.rbl.get(0),System.currentTimeMillis(),true),Arrays.asList(s),s.rbl,System.currentTimeMillis());repo.saveCache();Repo next=new Repo(RuntimeEnvironment.getApplication());assertEquals(1,next.favorites.size());assertEquals(1,next.departures.size());assertNull(next.currentLocation);}
    @Test public void distanceSortPreservesStoredOrder(){Repo.Stop a=station("Stephansplatz U"),b=station("Brunnengasse");repo.toggleFavorite(b,"","");repo.toggleFavorite(a,"","");repo.acceptLocation(fix(a.lat,a.lon,5,System.currentTimeMillis()));repo.prefs.edit().putBoolean("sortDistance",true).commit();assertEquals(a.id,repo.orderedFavorites().get(0).stopId);assertEquals(b.id,repo.favorites.get(0).stopId);}
    @Test public void importedFavoritesAreValidatedAndDeduplicated()throws Exception {Repo.Stop s=station("Stephansplatz U");JSONObject row=new JSONObject().put("stopId",s.id).put("route","U1").put("towards","Leopoldau");repo.mergeFavorites(new JSONArray().put(row).put(row).put(new JSONObject().put("stopId","unknown")),false);assertEquals(1,repo.favorites.size());}
    @Test public void datesAndModesHandleOfficialFormats(){assertTrue(Repo.parseDate("2026-11-07T17:00:00.000+0100")>0);assertEquals(-1,Repo.parseDate("broken"));assertEquals("metro",Repo.inferMode("ptMetro","U6"));assertEquals("tram",Repo.inferMode("ptTram","46"));}
    @Test public void westbahnhofCatalogUsesDatedPassengerServiceInsteadOfEveryRouteVariant(){
        Repo.Stop stop=station("Westbahnhof S U");assertFalse(stop.routes.contains("1"));assertFalse(stop.routes.contains("2"));assertFalse(stop.routes.contains("57A"));for(String route:new String[]{"U3","U6","5","6","9","18","52","60","N8"})assertTrue(route,stop.routes.contains(route));
        assertFalse(station("Thaliastraße U").routes.contains("2"));assertTrue(station("Thaliastraße U").routes.contains("46"));
    }
    @Test public void sharedLineEvidenceUpdatesWatchAndSurvivesOfflineReloadWithoutChangingFavorites()throws Exception {
        Repo.Stop stop=station("Westbahnhof S U");repo.toggleFavorite(stop,"2","Test");String saved=repo.prefs.getString("favorites","");long now=System.currentTimeMillis();
        JSONObject line=new JSONObject().put("route","2").put("mode","tram").put("lastSeen",now).put("deviceSecret","PRIVATE_VALUE");
        JSONObject entry=new JSONObject().put("stopId",stop.id).put("checkedAt",now).put("lines",new JSONArray().put(line)).put("suppressed",new JSONArray()).put("latitude",48.1);
        JSONObject message=new JSONObject().put("foamaLines",new JSONObject().put("version",1).put("status","available").put("stations",new JSONArray().put(entry)));
        List<String> original=stop.routes;repo.mergeLineEvidence(message,now);assertTrue(stop.routes.contains("2"));assertNotSame(original,stop.routes);assertFalse(original.contains("2"));
        entry.put("suppressed",new JSONArray().put(new JSONObject().put("route","2").put("mode","tram")));repo.mergeLineEvidence(message,now);assertFalse(stop.routes.contains("2"));assertEquals(saved,repo.prefs.getString("favorites",""));
        Repo offline=new Repo(RuntimeEnvironment.getApplication());assertFalse(offline.findStop(stop.id).routes.contains("2"));assertTrue(offline.hasFavorite(offline.findStop(stop.id),"2","Test"));String stored=repo.prefs.getString("stationLineEvidence","");assertFalse(stored.contains("PRIVATE_VALUE"));assertFalse(stored.contains("latitude"));
        entry.put("suppressed",new JSONArray());repo.mergeLineEvidence(message,now);assertTrue(stop.routes.contains("2"));assertEquals(saved,repo.prefs.getString("favorites",""));
    }
    @Test public void equipmentAndPlannedNoticesDoNotMarkWatchDeparturesAsDisrupted()throws Exception {
        Repo.Stop s=station("Stephansplatz U");long now=System.currentTimeMillis();JSONObject body=payload(s.rbl.get(0),now,true),data=body.getJSONObject("data"),monitor=data.getJSONArray("monitors").getJSONObject(0);
        data.put("trafficInfoCategories",new JSONArray("[{id:1,name:'aufzugsinfo'},{id:2,name:'stoerunglang'},{id:3,name:'fahrtreppeninfo'}]"));
        JSONObject lift=new JSONObject().put("name","lift").put("refTrafficInfoCategoryId",1),future=new JSONObject().put("name","future").put("refTrafficInfoCategoryId",2).put("time",new JSONObject().put("start",java.time.Instant.ofEpochMilli(now+1000).toString()));
        data.put("trafficInfos",new JSONArray().put(lift).put(future).put(new JSONObject().put("name","escalator").put("refTrafficInfoCategoryId",3)));
        monitor.put("refTrafficInfoNames",new JSONArray().put("lift").put("future").put("escalator"));
        repo.mergeMonitor(body,Arrays.asList(s),s.rbl,now);assertFalse(repo.departures.get(0).notice);
        assertFalse(Repo.hasCurrentServiceNotice(data,monitor,now+999));assertTrue(Repo.hasCurrentServiceNotice(data,monitor,now+1000));
        future.put("time",new JSONObject().put("end",java.time.Instant.ofEpochMilli(now-1).toString()));assertFalse(Repo.hasCurrentServiceNotice(data,monitor,now));
    }
    @Test public void activeServiceNoticesStayProminentEvenWhenTheyAlsoMentionALift()throws Exception {
        JSONObject data=new JSONObject().put("trafficInfoCategories",new JSONArray("[{id:2,name:'stoerunglang'}]")),monitor=new JSONObject().put("refTrafficInfoNames",new JSONArray().put("parent"));
        JSONObject service=new JSONObject().put("name","service").put("parentName","parent").put("refTrafficInfoCategoryId",2).put("title","U1 unterbrochen; Aufzug bleibt erreichbar");
        data.put("trafficInfos",new JSONArray().put(service));assertTrue(Repo.hasCurrentServiceNotice(data,monitor,System.currentTimeMillis()));
        service.put("status","resolved");assertFalse(Repo.hasCurrentServiceNotice(data,monitor,System.currentTimeMillis()));
        monitor.put("refTrafficInfoNames",new JSONArray().put("unknown"));assertTrue(Repo.hasCurrentServiceNotice(data,monitor,System.currentTimeMillis()));
    }
    @Test public void networkHelperRejectsExternalTargetsBeforeOpeningConnection()throws Exception {try{Repo.jsonHttp("https://example.org/update.json","GET",null);fail();}catch(java.io.IOException expected){} }
    @Test public void expiredPersistedCacheIsRemovedOnOfflineOpenWithoutDeletingSettingsOrFavorites()throws Exception {
        Repo.Stop s=station("Stephansplatz U");repo.toggleFavorite(s,"U1","Leopoldau");repo.prefs.edit().putInt("radius",600).putString("departures",new JSONArray().put(new JSONObject().put("stopKey",s.id).put("when",System.currentTimeMillis()+120000).put("fetchedAt",System.currentTimeMillis()-700000)).toString()).commit();
        Repo next=new Repo(RuntimeEnvironment.getApplication());assertTrue(next.departures.isEmpty());assertFalse(next.prefs.contains("departures"));assertEquals(1,next.favorites.size());assertEquals(600,next.prefs.getInt("radius",0));
    }
    @Test public void cacheIsBoundedInBytesAndRecordsAcrossRepeatedSaves()throws Exception {
        Repo.Stop s=station("Stephansplatz U");long now=System.currentTimeMillis();for(int i=0;i<3500;i++){Repo.Departure d=new Repo.Departure();d.stopKey=s.id;d.rbl=s.rbl.get(0);d.route="U1";d.towards=String.join("",Collections.nCopies(200,"Ö"));d.quality="Live";d.when=now+60000+i*1000;d.fetchedAt=now;repo.departures.add(d);}
        repo.saveCache();String first=repo.prefs.getString("departures","");assertTrue(first.getBytes(java.nio.charset.StandardCharsets.UTF_8).length<=512*1024);assertTrue(repo.departures.size()<=3000);assertTrue(new JSONArray(first).length()>0);repo.saveCache();assertEquals(first,repo.prefs.getString("departures",""));
    }
    @Test public void pauseDiscardsPositionAndExpiredCacheButRetainsUserData(){Repo.Stop s=station("Stephansplatz U");repo.toggleFavorite(s,"","");repo.acceptLocation(fix(s.lat,s.lon,5,System.currentTimeMillis()));Repo.Departure d=new Repo.Departure();d.when=System.currentTimeMillis()-1;d.fetchedAt=System.currentTimeMillis();repo.departures.add(d);repo.pause();assertNull(repo.currentLocation);assertTrue(repo.departures.isEmpty());assertFalse(repo.prefs.contains("departures"));assertEquals(1,repo.favorites.size());}
}
