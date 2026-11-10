package at.foama.wien;
import org.junit.Test;
import static org.junit.Assert.*;
public class CityProfilesTest {
    final long now=1800000000000L;
    @Test public void defaultAndManualChoicesAreIndependentOfAutomaticDetection(){CityProfiles c=new CityProfiles("invalid");assertEquals("wien",c.current());assertTrue(c.observe(47.0707,15.4395,20,now,now,true));assertEquals("graz",c.current());c.select("linz");c.observe(47.8095,13.055,20,now,now,true);assertEquals("linz",c.current());c.select("auto",now);assertEquals("salzburg",c.current());assertEquals("wien",new CityProfiles("auto").current());}
    @Test public void oldDetectionExpiresWhenReturningToAutomatic(){CityProfiles c=new CityProfiles("auto");c.observe(47.0707,15.4395,20,now,now,true);c.select("linz",now);c.select("auto",now+90001);assertEquals("wien",c.current());}
    @Test public void staleCoarseAndHiddenLocationsCannotSwitchCities(){CityProfiles c=new CityProfiles("auto");assertFalse(c.observe(47.07,15.43,20,now,now,false));assertFalse(c.observe(47.07,15.43,251,now,now,true));assertFalse(c.observe(47.07,15.43,20,now-90001,now,true));assertFalse(c.observe(47.07,15.43,20,now+2000,now,true));assertEquals("wien",c.current());}
    @Test public void moderateLocationsNeedTwoSeparateConfirmationsAndEdgesHaveHysteresis(){CityProfiles c=new CityProfiles("auto");assertFalse(c.observe(47.0707,15.4395,150,now,now,true));assertFalse(c.observe(47.0707,15.4395,150,now,now,true));assertTrue(c.observe(47.0707,15.4395,150,now+6000,now+6000,true));assertEquals("graz",c.current());assertFalse(c.observe(47.0707+12.2/111.195,15.4395,80,now+12000,now+12000,true));assertTrue(c.observe(48.2082,16.3738,20,now+18000,now+18000,true));assertEquals("wien",c.current());}
}
