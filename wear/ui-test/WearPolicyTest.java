package at.foama.wien;
import org.junit.Test;
import static org.junit.Assert.*;
import java.util.*;
public class WearPolicyTest {
    @Test public void tunnelAndMovementNeverPromiseReachability(){long now=1000000;assertTrue(WearPolicy.reliable(now,now-20000,30,false));assertFalse(WearPolicy.reliable(now,now-20000,700,false));assertFalse(WearPolicy.reliable(now,now-91000,5,false));assertFalse(WearPolicy.reliable(now,now-100,5,true));assertFalse(WearPolicy.reliable(now,now+1,5,false));}
    @Test public void cachedDataExpiresAndNeverReappearsAfterDeparture(){long now=1000000;assertTrue(WearPolicy.usableDeparture(now,now+60000,now-100000));assertFalse(WearPolicy.usableDeparture(now,now+60000,now-600001));assertFalse(WearPolicy.usableDeparture(now,now-1,now-1000));assertFalse(WearPolicy.fresh(now,now-2000,true));assertFalse(WearPolicy.fresh(now,now-90001,false));}
    @Test public void nextMinutesUseFutureRounding(){assertEquals(1,WearPolicy.minutes(1001,1000));assertEquals(2,WearPolicy.minutes(61001,1000));assertEquals(0,WearPolicy.minutes(0,1000));}
    @Test public void priorityBudgetRetainsFrontAndRotatesEveryRemainingPlatform(){List<List<String>> groups=new ArrayList<>();for(int i=1;i<=50;i++)groups.add(Collections.singletonList(""+i));Set<String> seen=new HashSet<>();for(int cycle=0;cycle<10;cycle++){List<String> ids=WearPolicy.budget(groups,cycle);assertEquals(24,ids.size());assertEquals(24,new HashSet<>(ids).size());for(int i=1;i<=16;i++)assertTrue(ids.contains(""+i));seen.addAll(ids);}assertEquals(50,seen.size());}
    @Test public void platformBudgetGivesStationsCoverageAndRejectsInvalidIdentifiers(){List<String> result=WearPolicy.budget(Arrays.asList(Arrays.asList("1","2","3"),Arrays.asList("4","5"),Arrays.asList("4","https://bad")),0);assertEquals(Arrays.asList("1","4","2","5","3"),result);}
    @Test public void failuresBackOffAndColorsMatchOfficialLines(){assertEquals(60000,WearPolicy.retryDelay(1));assertEquals(300000,WearPolicy.retryDelay(10));assertEquals(30000,WearPolicy.REFRESH_MS);assertEquals(0xff162a63,WearPolicy.lineColor("N46","bus"));assertEquals(0xff986a3a,WearPolicy.lineColor("U6","metro"));assertEquals(0xffed1c24,WearPolicy.lineColor("U1","metro"));}
}
