package at.foama.wien;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;
import android.view.*;
import android.widget.*;
import android.os.*;
import android.graphics.*;
import org.json.*;
import java.util.*;
import java.time.Duration;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34,qualifiers="w227dp-h227dp-round-xhdpi") @LooperMode(LooperMode.Mode.PAUSED)
public class CityRouteViewTest {
    ActivityController<MainActivity> controller;MainActivity app;
    @Before public void setup(){RuntimeEnvironment.getApplication().getSharedPreferences("foama",0).edit().clear().commit();controller=Robolectric.buildActivity(MainActivity.class).create().start();app=controller.get();}
    @After public void cleanup(){controller.stop().destroy();}
    Repo.Stop stop(String city){for(Repo.Stop s:app.repo.stops)if(s.city.equals(city))return s;throw new AssertionError(city);}
    JSONObject route(String city)throws Exception{
        Repo.Stop stop=stop(city);JSONObject place=new JSONObject().put("name",stop.name).put("stopId",stop.id);
        return JourneyStore.sanitize(new JSONObject().put("id",city).put("savedAt",1).put("name",city+" route")
            .put("from",new JSONObject().put("kind","current"))
            .put("to",new JSONObject().put("kind","point").put("name",stop.name).put("lat",stop.lat).put("lon",stop.lon))
            .put("legs",new JSONArray().put(new JSONObject().put("mode","tram").put("route","1").put("towards","Ziel").put("durationSeconds",300).put("from",place).put("to",place))));
    }
    TextView find(View v,String label){if(v instanceof TextView&&((TextView)v).getText().toString().equals(label))return (TextView)v;if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++){TextView t=find(((ViewGroup)v).getChildAt(i),label);if(t!=null)return t;}return null;}
    void click(String label){View target=find(app.getWindow().getDecorView(),label);assertNotNull(label,target);while(!target.isClickable()&&target.getParent() instanceof View)target=(View)target.getParent();assertTrue(target.performClick());}
    @SuppressWarnings("unchecked") List<Repo.Stop> targets()throws Exception{java.lang.reflect.Method m=MainActivity.class.getDeclaredMethod("targets");m.setAccessible(true);return (List<Repo.Stop>)m.invoke(app);}
    @Test public void bothListsAndMonitorTargetsFollowCityWithoutChangingStorage()throws Exception{
        for(String city:CityProfiles.IDS)app.repo.journeys.merge(new JSONArray().put(route(city)));String saved=app.repo.prefs.getString(JourneyStore.KEY,"");
        for(String city:CityProfiles.IDS){app.repo.selectCity(city);app.openRoutes();assertNotNull(find(app.getWindow().getDecorView(),city+" route"));assertEquals(Collections.singletonList(stop(city)),targets());
            for(String other:CityProfiles.IDS)if(!other.equals(city))assertNull(find(app.getWindow().getDecorView(),other+" route"));
            click("Favoriten");click("Routen");assertNotNull(find(app.getWindow().getDecorView(),city+" route"));assertEquals(Collections.singletonList(stop(city)),targets());assertEquals(saved,app.repo.prefs.getString(JourneyStore.KEY,""));}
        Repo restarted=new Repo(RuntimeEnvironment.getApplication());assertEquals(4,restarted.journeys.all().length());assertEquals(1,restarted.cityJourneys().length());
    }
    @Test public void viennaOnlyRoutesHaveHonestEmptyGrazListsAndNoViennaRequests()throws Exception{
        app.repo.journeys.merge(new JSONArray().put(route("wien")));app.repo.selectCity("graz");app.openRoutes();assertNotNull(find(app.getWindow().getDecorView(),"Noch keine Routen in Graz"));assertTrue(targets().isEmpty());
        click("Favoriten");click("Routen");assertNotNull(find(app.getWindow().getDecorView(),"Noch keine Routen in Graz"));assertTrue(targets().isEmpty());assertEquals(1,app.repo.journeys.all().length());
    }
    @Test public void routeAlternativesAndFixedEndpointsMatchWithoutGuessingFromGpsOrNames()throws Exception{
        JSONObject vienna=route("wien"),graz=route("graz");vienna.put("alternatives",new JSONArray().put(new JSONObject().put("legs",graz.getJSONArray("legs"))));
        assertTrue(JourneyStore.matchesCity(vienna,"wien",app.repo));assertTrue(JourneyStore.matchesCity(vienna,"graz",app.repo));assertFalse(JourneyStore.matchesCity(vienna,"linz",app.repo));
        JSONObject unknown=route("graz");for(JSONObject leg:JourneyStore.boardings(unknown)){leg.getJSONObject("from").put("stopId",JSONObject.NULL);leg.getJSONObject("to").put("stopId",JSONObject.NULL);}
        assertTrue(JourneyStore.matchesCity(unknown,"graz",app.repo));unknown.put("to",new JSONObject().put("kind","current").put("name","Wien"));app.repo.selectCity("graz");
        assertFalse(JourneyStore.matchesCity(unknown,"graz",app.repo));assertFalse(JourneyStore.matchesCity(unknown,"wien",app.repo));
    }
    @Test public void navigationRemainsSelectedAndSettingsReturnToRoutesAfterCityChange()throws Exception{
        app.repo.journeys.merge(new JSONArray().put(route("wien")));app.openRoutes();assertNotNull(app.getWindow().getDecorView().findViewWithTag("main-navigation"));assertTrue(((View)find(app.getWindow().getDecorView(),"A nach B").getParent()).isSelected());
        click("Mehr");click("Stadtprofil");click("Graz");app.navigateBack();app.navigateBack();assertEquals("routes",app.screen);assertNotNull(find(app.getWindow().getDecorView(),"Noch keine Routen in Graz"));
        app.repo.nextFetchElapsed=Long.MAX_VALUE;click("Nähe");assertEquals("home",app.screen);assertEquals("near",app.view);assertEquals(Long.MAX_VALUE,app.repo.nextFetchElapsed);click("A nach B");click("Favoriten");assertEquals("home",app.screen);assertEquals("fav",app.view);
    }
    private TextView cityTitle(){TextView title=app.getWindow().getDecorView().findViewWithTag("main-title");assertNotNull(title);return title;}
    @Test public void titleFollowsAllManualCityProfilesAndMainDestinations(){
        for(String city:new String[]{"graz","linz","salzburg","wien"}){
            app.openRoutes();click("Mehr");click("Stadtprofil");click(CityProfiles.name(city));app.navigateBack();app.navigateBack();assertEquals(CityProfiles.name(city),cityTitle().getText().toString());
            for(String view:new String[]{"near","fav"}){app.changeView(view);assertEquals(CityProfiles.name(city),cityTitle().getText().toString());}
            app.openRoutes();assertEquals(CityProfiles.name(city),cityTitle().getText().toString());
        }
    }
    @Test public void automaticCityAndExpiryUpdateExistingTitleWithoutResettingRequestBudget(){
        app.changeView("near");TextView title=cityTitle();assertEquals("Wien",title.getText().toString());long now=System.currentTimeMillis();
        android.location.Location fix=new android.location.Location("test");fix.setLatitude(47.0707);fix.setLongitude(15.4395);fix.setAccuracy(5);fix.setTime(now);app.repo.acceptLocation(fix);
        app.repo.nextFetchElapsed=Long.MAX_VALUE;app.renderContent();assertSame(title,cityTitle());assertEquals("Graz",title.getText().toString());assertEquals(Long.MAX_VALUE,app.repo.nextFetchElapsed);
        app.repo.cities.expire(now+90001);app.renderContent();assertSame(title,cityTitle());assertEquals("Wien",title.getText().toString());assertEquals(Long.MAX_VALUE,app.repo.nextFetchElapsed);
    }
    private void layoutTree(View view){view.forceLayout();if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)layoutTree(((ViewGroup)view).getChildAt(i));}
    @Test @GraphicsMode(GraphicsMode.Mode.NATIVE) public void routesNavigationFitsRoundWatchesWithLargeText()throws Exception{
        app.repo.selectCity("graz");app.repo.journeys.merge(new JSONArray().put(route("graz")));
        for(int size:new int[]{227,192}){RuntimeEnvironment.setQualifiers("w"+size+"dp-h"+size+"dp-round-xhdpi");android.content.res.Configuration config=new android.content.res.Configuration(app.getResources().getConfiguration());config.fontScale=size==192?1.3f:1f;app.getResources().updateConfiguration(config,app.getResources().getDisplayMetrics());app.openRoutes();
            View decor=app.getWindow().getDecorView();layoutTree(decor);int px=Math.round(size*app.getResources().getDisplayMetrics().density);decor.measure(View.MeasureSpec.makeMeasureSpec(px,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(px,View.MeasureSpec.EXACTLY));decor.layout(0,0,px,px);Shadows.shadowOf(Looper.getMainLooper()).idle();
            for(String label:new String[]{"Nähe","Favoriten","A nach B"}){TextView text=find(decor,label);if(text==null&&label.equals("Favoriten"))text=find(decor,"Favor.");if(text==null&&label.equals("A nach B"))text=find(decor,"A → B");assertNotNull(label,text);View tab=(View)text.getParent();float density=app.getResources().getDisplayMetrics().density;String note=size+" "+label+" width="+tab.getWidth()/density+" height="+tab.getHeight()/density+" text="+text.getWidth()+" right="+text.getLayout().getLineRight(0);assertTrue(note,tab.getWidth()/density>=48);assertTrue(note,tab.getHeight()/density>=48);assertEquals(note,1,text.getLayout().getLineCount());assertEquals(note,0,text.getLayout().getEllipsisCount(0));assertTrue(note,text.getLayout().getLineRight(0)<=text.getWidth()+1);}
            Bitmap bitmap=Bitmap.createBitmap(px,px,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(bitmap);android.graphics.Path clip=new android.graphics.Path();clip.addCircle(px/2f,px/2f,px/2f,android.graphics.Path.Direction.CW);canvas.clipPath(clip);decor.draw(canvas);try(java.io.OutputStream out=new java.io.FileOutputStream(".local/wear-city-routes-"+size+".png")){bitmap.compress(Bitmap.CompressFormat.PNG,100,out);}bitmap.recycle();
        }
    }
}
