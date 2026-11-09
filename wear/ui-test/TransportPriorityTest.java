package at.foama.wien;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import android.location.Location;
import java.util.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34)
public class TransportPriorityTest {
    private Repo repo;
    @Before public void setup(){RuntimeEnvironment.getApplication().getSharedPreferences("foama",0).edit().clear().commit();repo=new Repo(RuntimeEnvironment.getApplication());}
    @Test public void actualKarlsplatzMetroPlatformsAreInFirstBudgetEvenBehindThirtyBusStops(){
        Repo.Stop station=repo.findStop("wl:60200657");assertNotNull(station);
        List<Repo.Stop> selected=new ArrayList<>();
        for(int i=0;i<30;i++){Repo.Stop bus=new Repo.Stop();bus.id="bus"+i;bus.rbl.add(""+(900000+i));bus.platformModes.put(bus.rbl.get(0),Arrays.asList("bus"));selected.add(bus);}
        selected.add(station);List<String> ids=repo.requestIds(selected,false);assertEquals(24,ids.size());
        assertEquals(Arrays.asList("4109","4120","4202","4213","4416","4421"),ids.subList(0,6));
        Set<String> seen=new HashSet<>(ids);for(int i=0;i<8;i++)seen.addAll(repo.requestIds(selected,false));
        for(Repo.Stop stop:selected)for(String id:stop.rbl)if(stop.platformModes.containsKey(id))assertTrue(id,seen.contains(id));
        repo.prefs.edit().putBoolean("mode_metro",false).commit();ids=repo.requestIds(selected,false);for(String id:station.rbl)if(station.platformModes.getOrDefault(id,Collections.emptyList()).contains("metro"))assertFalse(ids.contains(id));
    }
    @Test public void nearbyOrdersEnabledModesThenDistanceWithoutChangingFavoriteOrder(){
        repo.stops.clear();Repo.Stop bus=add("bus",.0001,"bus"),tram=add("tram",.0002,"tram"),far=add("metro-far",.002,"metro"),near=add("metro-near",.001,"metro");
        Location fix=new Location("test");fix.setLatitude(48.2);fix.setLongitude(16.37);fix.setTime(System.currentTimeMillis());fix.setAccuracy(5);repo.acceptLocation(fix);
        repo.toggleFavorite(bus,"","");repo.toggleFavorite(far,"","");
        assertEquals(Arrays.asList(near,far,tram,bus),repo.nearby());assertEquals(bus.id,repo.favorites.get(0).stopId);
        bus.modes.add("metro");repo.prefs.edit().putBoolean("mode_metro",false).commit();assertEquals(Arrays.asList(tram,bus),repo.nearby());
    }
    private Repo.Stop add(String id,double offset,String mode){Repo.Stop s=new Repo.Stop();s.id=id;s.lat=48.2+offset;s.lon=16.37;s.modes.add(mode);repo.stops.add(s);return s;}
    @Test public void connectionGroupsPutAllMetroDirectionsBeforeEarlierTramAndBus(){
        Repo.Stop s=repo.findStop("wl:60200657");long now=System.currentTimeMillis();
        String[] modes={"bus","tram","metro","metro","metro","metro"},routes={"4A","1","U1","U1","U2","U4"};
        for(int i=0;i<modes.length;i++){Repo.Departure d=new Repo.Departure();d.stopKey=s.id;d.route=routes[i];d.towards="Direction "+i;d.mode=modes[i];d.when=now+(i+1)*60000;d.fetchedAt=now;repo.departures.add(d);}
        List<List<Repo.Departure>> groups=repo.connections(s,"","",false);assertEquals(6,groups.size());
        assertEquals(Arrays.asList("U1","U1","U2","U4","1","4A"),routes(groups));
        repo.prefs.edit().putBoolean("mode_metro",false).commit();assertEquals(Arrays.asList("1","4A"),routes(repo.connections(s,"","",false)));
        assertEquals(6,repo.connections(s,"","",true).size());
    }
    private List<String> routes(List<List<Repo.Departure>> groups){List<String> out=new ArrayList<>();for(List<Repo.Departure> group:groups)out.add(group.get(0).route);return out;}
}
