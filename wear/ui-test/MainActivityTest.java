package at.foama.wien;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import org.robolectric.shadows.ShadowLooper;
import static org.junit.Assert.*;
import static org.robolectric.Shadows.shadowOf;
import android.view.*;
import android.widget.*;
import android.os.Looper;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import java.util.concurrent.TimeUnit;
import java.util.Arrays;
@RunWith(RobolectricTestRunner.class) @Config(sdk=34,qualifiers="w227dp-h227dp-round-xhdpi") @LooperMode(LooperMode.Mode.PAUSED)
public class MainActivityTest {
    private ActivityController<MainActivity> controller;private MainActivity app;
    @Before public void setup(){RuntimeEnvironment.getApplication().getSharedPreferences("foama",0).edit().clear().commit();controller=Robolectric.buildActivity(MainActivity.class).create().start();app=controller.get();}
    @After public void cleanup(){controller.stop().destroy();}
    private TextView find(View v,String label){if(v instanceof TextView&&((TextView)v).getText().toString().equals(label))return (TextView)v;if(v instanceof ViewGroup){ViewGroup g=(ViewGroup)v;for(int i=0;i<g.getChildCount();i++){TextView found=find(g.getChildAt(i),label);if(found!=null)return found;}}return null;}
    private TextView text(String label){TextView t=find(app.getWindow().getDecorView(),label);assertNotNull(label,t);return t;}
    private void click(String label){View target=text(label);while(!target.isClickable()&&target.getParent() instanceof View)target=(View)target.getParent();assertTrue(label,target.performClick());}
    private Repo.Stop station(){for(Repo.Stop s:app.repo.stops)if(s.name.equals("Stephansplatz U"))return s;throw new AssertionError();}
    private void addDeparture(){Repo.Stop s=station();Repo.Departure d=new Repo.Departure();d.stopKey=s.id;d.rbl=s.rbl.get(0);d.route="U1";d.towards="Leopoldau";d.mode="metro";d.quality="Live";d.when=System.currentTimeMillis()+240000;d.fetchedAt=System.currentTimeMillis();app.repo.departures.add(d);Repo.Departure next=new Repo.Departure();next.stopKey=d.stopKey;next.rbl=d.rbl;next.route=d.route;next.towards=d.towards;next.mode=d.mode;next.quality=d.quality;next.when=d.when+240000;next.fetchedAt=d.fetchedAt;app.repo.departures.add(next);}
    @Test public void onlyTwoMainDestinationsAndNoCrowdedActionBar(){assertNotNull(text("Nähe"));assertNotNull(text("Favoriten"));assertNotNull(text("Mehr"));assertNull(find(app.getWindow().getDecorView(),"↻ Jetzt"));assertNull(find(app.getWindow().getDecorView(),"QR ↗"));click("Favoriten");assertEquals("fav",app.view);assertNotNull(text("Deine wichtigsten Wege"));}
    @Test public void connectionDetailAlwaysPlacesStationAboveLineAndDirection(){
        addDeparture();app.openConnection(station(),"U1","Leopoldau");layout();int previous=-1;
        for(String label:new String[]{station().name,"U1","Leopoldau","4′"}){TextView item=text(label);android.graphics.Rect bounds=new android.graphics.Rect(0,0,item.getWidth(),item.getHeight());((ViewGroup)app.getWindow().getDecorView()).offsetDescendantRectToMyCoords(item,bounds);assertTrue(label+" follows its station and line",bounds.top>previous);previous=bounds.top;}
    }
    @Test public void openingConnectionNeverChangesFavorites(){addDeparture();app.openConnection(station(),"U1","Leopoldau");assertTrue(app.repo.favorites.isEmpty());assertNotNull(text("Leopoldau"));click("☆ Als Favorit speichern");assertEquals(1,app.repo.favorites.size());click("Favorit entfernen");assertTrue(app.repo.favorites.isEmpty());}
    @Test public void unconfirmedFavoriteRemainsOpenableAndRecoversWhenDeparturesArrive(){
        app.repo.toggleFavorite(station(),"U1","Leopoldau");click("Favoriten");assertNotNull(text("Keine aktuellen Abfahrten"));click("U1 → Leopoldau");
        assertEquals("detail",app.screen);assertNotNull(text("Keine aktuelle Abfahrt"));assertNotNull(text("—"));assertTrue(text("U1").getContentDescription().toString().contains("keine aktuelle Abfahrt bestätigt"));assertEquals(1,app.repo.favorites.size());
        addDeparture();app.renderContent();assertNotNull(text("4′"));assertEquals("Linie U1",text("U1").getContentDescription().toString());assertNull(find(app.getWindow().getDecorView(),"Keine aktuelle Abfahrt"));app.onBackPressed();assertEquals("fav",app.view);assertEquals(1,app.repo.favorites.size());
    }
    @Test public void detailUsesLargeMinutesAndSystemBackReturnsHome(){addDeparture();app.openConnection(station(),"U1","Leopoldau");TextView number=text("4′");assertEquals(54,number.getTextSize()/app.getResources().getDisplayMetrics().scaledDensity,0.1);app.onBackPressed();assertEquals("home",app.screen);assertNotNull(text("Nähe"));}
    private ScrollView scroll(View view){if(view instanceof ScrollView)return (ScrollView)view;if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){ScrollView result=scroll(((ViewGroup)view).getChildAt(i));if(result!=null)return result;}return null;}
    private void layout(){View decor=app.getWindow().getDecorView();int pixels=Math.round(227*app.getResources().getDisplayMetrics().density);forceLayoutTree(decor);decor.measure(View.MeasureSpec.makeMeasureSpec(pixels,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(pixels,View.MeasureSpec.EXACTLY));decor.layout(0,0,pixels,pixels);}
    @Test public void openingLineStartsAtTopDespiteQueuedOverviewRestoreAndRefreshKeepsReadingPosition(){
        addDeparture();app.repo.toggleFavorite(station(),"","");app.changeView("fav");layout();ShadowLooper.idleMainLooper();
        ScrollView view=scroll(app.getWindow().getDecorView());assertNotNull(view);view.scrollTo(0,80);assertTrue(view.getScrollY()>0);
        app.renderContent(); // Queue an old overview restoration before navigation.
        app.openConnection(station(),"U1","Leopoldau");layout();ShadowLooper.idleMainLooper();assertEquals(0,view.getScrollY());
        view.scrollTo(0,90);int reading=view.getScrollY();assertTrue(reading>0);app.renderContent();layout();ShadowLooper.idleMainLooper();assertEquals(reading,view.getScrollY());
        app.renderContent();app.openConnection(station(),"U1","Reumannplatz");layout();ShadowLooper.idleMainLooper();assertEquals(0,view.getScrollY());
        app.onBackPressed();layout();ShadowLooper.idleMainLooper();assertEquals("fav",app.view);assertEquals(1,app.repo.favorites.size());
    }
    @Test public void startupDoesNotAskLocationWithoutTap(){controller.resume();shadowOf(Looper.getMainLooper()).idle();assertNull(shadowOf(app).getLastRequestedPermission());click("Standort aktivieren");assertNotNull(shadowOf(app).getLastRequestedPermission());controller.pause();}
    @Test public void stalledLocationShowsRetryAndCanRecoverInActualActivity(){
        shadowOf(RuntimeEnvironment.getApplication()).grantPermissions(android.Manifest.permission.ACCESS_COARSE_LOCATION,android.Manifest.permission.ACCESS_FINE_LOCATION);
        android.location.LocationManager manager=(android.location.LocationManager)app.getSystemService(android.content.Context.LOCATION_SERVICE);
        org.robolectric.shadows.ShadowLocationManager locations=shadowOf(manager);locations.setLocationEnabled(true);locations.removeProvider("fused");locations.setProviderEnabled("network",true);locations.setProviderEnabled("gps",true);
        app.repo.nextFetchElapsed=Long.MAX_VALUE;controller.resume();shadowOf(Looper.getMainLooper()).idleFor(31,TimeUnit.SECONDS);
        assertNotNull(text("Noch keine Position. Bitte ins Freie gehen und erneut versuchen. Favoriten bleiben nutzbar."));assertNotNull(text("Standorteinstellungen"));click("Erneut versuchen");
        android.location.Location fix=new android.location.Location("network");fix.setLatitude(station().lat);fix.setLongitude(station().lon);fix.setAccuracy(5);fix.setTime(System.currentTimeMillis());fix.setElapsedRealtimeNanos(android.os.SystemClock.elapsedRealtimeNanos());locations.simulateLocation(fix);shadowOf(Looper.getMainLooper()).idle();
        assertNotNull(app.repo.currentLocation);assertNull(find(app.getWindow().getDecorView(),"Erneut versuchen"));controller.pause();assertTrue(locations.getLocationUpdateListeners().isEmpty());
    }
    @Test public void pausedActivityStopsTimersAndLocationCallbacks()throws Exception {controller.resume();shadowOf(Looper.getMainLooper()).idle();controller.pause();long before=app.repo.nextFetchElapsed;shadowOf(Looper.getMainLooper()).idleFor(65,TimeUnit.SECONDS);assertFalse(app.active);assertEquals(before,app.repo.nextFetchElapsed);android.location.LocationManager manager=(android.location.LocationManager)app.getSystemService(android.content.Context.LOCATION_SERVICE);assertTrue(shadowOf(manager).getLocationUpdateListeners().isEmpty());}
    @Test public void controlsRemainTouchSizedAtSmallRoundDisplay(){RuntimeEnvironment.setQualifiers("w192dp-h192dp-round");app.getWindow().getDecorView().measure(View.MeasureSpec.makeMeasureSpec(192,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(192,View.MeasureSpec.EXACTLY));for(String label:new String[]{"Nähe","Favoriten","Mehr","Standort aktivieren"}){View target=text(label);while(!target.isClickable()&&target.getParent() instanceof View)target=(View)target.getParent();assertTrue(label,target.getMinimumHeight()/app.getResources().getDisplayMetrics().density>=48);}}
    private String page()throws Exception {java.lang.reflect.Field field=MainActivity.class.getDeclaredField("settingsSection");field.setAccessible(true);return app.screen+"|"+field.get(app);}
    private void swipe(float fromX,float fromY,float toX,float toY,boolean cancel){long now=android.os.SystemClock.uptimeMillis();MotionEvent down=MotionEvent.obtain(now,now,MotionEvent.ACTION_DOWN,fromX,fromY,0),move=MotionEvent.obtain(now,now+100,MotionEvent.ACTION_MOVE,toX,toY,0),up=MotionEvent.obtain(now,now+200,cancel?MotionEvent.ACTION_CANCEL:MotionEvent.ACTION_UP,toX,toY,0);app.dispatchTouchEvent(down);app.dispatchTouchEvent(move);app.dispatchTouchEvent(up);down.recycle();move.recycle();up.recycle();}
    private void openMenuPath(String[] path){app.returnHome();click("Mehr");for(String label:path)click(label);}
    @Test public void leftSwipeMatchesBackButtonForEveryMenuLevel()throws Exception {
        for(String[] path:new String[][]{{},{"Standort & Nähe"},{"Standort & Nähe","Suchradius"},{"Standort & Nähe","Verkehrsmittel"},{"Gehen & Reserve"},{"Favoriten"},{"App & Updates"},{"Störungen"},{"Störungen","Push"},{"Störungen","Auswahl"},{"Störungen","Infos"}}){
            openMenuPath(path);click("Zurück");String expected=page();openMenuPath(path);swipe(350,180,40,180,false);assertEquals(expected,page());assertFalse(app.isFinishing());
        }
        addDeparture();app.openConnection(station(),"U1","Leopoldau");swipe(350,180,40,180,false);assertEquals("home",app.screen);assertFalse(app.isFinishing());
    }
    @Test public void verticalScrollAndCancelledSwipeDoNotNavigate(){openMenuPath(new String[]{"Gehen & Reserve"});swipe(180,80,190,330,false);assertEquals("more",app.screen);assertNotNull(text("Gehgeschwindigkeit"));swipe(350,180,40,180,true);assertEquals("more",app.screen);assertNotNull(text("Gehgeschwindigkeit"));}
    @Test public void modernSystemBackUsesSameParentPage()throws Exception {
        openMenuPath(new String[]{"Standort & Nähe","Verkehrsmittel"});java.lang.reflect.Field field=MainActivity.class.getDeclaredField("backRegistration");field.setAccessible(true);android.window.OnBackInvokedCallback callback=(android.window.OnBackInvokedCallback)field.get(app);assertNotNull(callback);callback.onBackInvoked();assertNotNull(text("Standorteinstellungen"));assertFalse(app.isFinishing());
        assertFalse(app.getTheme().obtainStyledAttributes(new int[]{android.R.attr.windowSwipeToDismiss}).getBoolean(0,true));
    }
    @Test public void screenOffStopsWorkAndScreenOnCannotRestartHiddenActivity()throws Exception {
        shadowOf(RuntimeEnvironment.getApplication()).grantPermissions(android.Manifest.permission.ACCESS_COARSE_LOCATION,android.Manifest.permission.ACCESS_FINE_LOCATION);android.location.LocationManager manager=(android.location.LocationManager)app.getSystemService(android.content.Context.LOCATION_SERVICE);org.robolectric.shadows.ShadowLocationManager locations=shadowOf(manager);locations.setLocationEnabled(true);locations.setProviderEnabled("network",true);app.repo.nextFetchElapsed=Long.MAX_VALUE;controller.resume();shadowOf(Looper.getMainLooper()).idle();assertTrue(app.active);assertFalse(locations.getLocationUpdateListeners().isEmpty());java.lang.reflect.Field field=MainActivity.class.getDeclaredField("requests");field.setAccessible(true);RequestScope old=(RequestScope)field.get(app);
        app.sendBroadcast(new android.content.Intent(android.content.Intent.ACTION_SCREEN_OFF));shadowOf(Looper.getMainLooper()).idle();assertFalse(app.active);assertTrue(old.isCancelled());assertTrue(locations.getLocationUpdateListeners().isEmpty());
        app.sendBroadcast(new android.content.Intent(android.content.Intent.ACTION_SCREEN_ON));shadowOf(Looper.getMainLooper()).idle();assertTrue(app.active);assertNotSame(old,field.get(app));
        controller.pause();app.sendBroadcast(new android.content.Intent(android.content.Intent.ACTION_SCREEN_ON));shadowOf(Looper.getMainLooper()).idle();assertFalse(app.active);
    }
    @Test public void backAtHomeExitsAndImmediatelyStopsWork()throws Exception {controller.resume();shadowOf(Looper.getMainLooper()).idle();app.onBackPressed();assertTrue(app.isFinishing());assertFalse(app.active);java.lang.reflect.Field field=MainActivity.class.getDeclaredField("requests");field.setAccessible(true);assertTrue(((RequestScope)field.get(app)).isCancelled());controller.pause();}
    @Test public void mainViewPreferenceSurvivesActivityRecreation(){click("Favoriten");controller.recreate();app=controller.get();assertEquals("fav",app.view);assertNotNull(text("Deine wichtigsten Wege"));}
    @Test public void nativePushSettingsStayOptInAndBackFromStoredAlertsReturnsToTheirParent(){
        click("Mehr");click("Störungen");assertNotNull(text("Hinweise"));assertNull(find(app.getWindow().getDecorView(),"Aktivieren"));click("Push");assertFalse(text("Aktivieren").isEnabled());assertFalse(app.push.enabled());assertNull(shadowOf(app).getLastRequestedPermission());
        click("Zurück");click("Hinweise");assertEquals("alerts",app.screen);click("Zurück");assertEquals("more",app.screen);assertNotNull(text("Push"));click("Zurück");assertNotNull(text("App & Updates"));click("Zurück");assertEquals("home",app.screen);
    }
    @Test public void pushSelectionAndPrivacyHaveDedicatedPagesAndKeepUserChoices()throws Exception {
        click("Mehr");click("Störungen");click("Auswahl");assertNotNull(text("✓ Meine Favoriten"));click("Alle Linien");assertEquals("all",app.push.scope());assertNotNull(text("✓ Alle Linien"));
        boolean quiet=app.push.quiet(),equipment=app.push.equipment();click((quiet?"✓ ":"○ ")+"Nachtruhe");click((equipment?"✓ ":"○ ")+"Aufzüge");assertEquals(!quiet,app.push.quiet());assertEquals(!equipment,app.push.equipment());assertFalse(app.push.enabled());
        app.onBackPressed();assertEquals("more|push",page());click("Infos");assertNotNull(text("Deine Daten"));assertNull(find(app.getWindow().getDecorView(),"Aktivieren"));app.onBackPressed();assertEquals("more|push",page());
        click("Auswahl");assertNotNull(text("✓ Alle Linien"));assertNotNull(text((app.push.quiet()?"✓ ":"○ ")+"Nachtruhe"));app.onBackPressed();click("Push");assertEquals("more|push-delivery",page());assertFalse(text("Aktivieren").isEnabled());assertNull(shadowOf(app).getLastRequestedPermission());
    }
    @Test public void globalFilterShortcutPrecedesNearbyStationsAndDoesNotDuplicateFavoritesControls(){
        Repo.Stop station=station();android.location.Location fix=new android.location.Location("test");fix.setLatitude(station.lat);fix.setLongitude(station.lon);fix.setAccuracy(5);fix.setTime(System.currentTimeMillis());app.repo.acceptLocation(fix);addDeparture();app.repo.toggleFavorite(station,"U1","Leopoldau");
        app.changeView("near");assertNotNull(filters());assertNotNull(text("Karte"));assertFalse(filters().getContentDescription().toString().contains(station.name));
        app.changeView("fav");assertNull(app.getWindow().getDecorView().findViewWithTag("transport-shortcut"));assertNotNull(text("Stationen"));assertNotNull(text("4′"));
    }
    @Test @GraphicsMode(GraphicsMode.Mode.NATIVE) public void shortDisruptionsLabelFitsOneLineOnSmallWatchWithLargeText()throws Exception {
        RuntimeEnvironment.setQualifiers("w192dp-h192dp-round-xhdpi");controller.stop().destroy();controller=Robolectric.buildActivity(MainActivity.class).create().start();app=controller.get();
        android.content.res.Configuration large=new android.content.res.Configuration(app.getResources().getConfiguration());large.fontScale=1.3f;app.getResources().updateConfiguration(large,app.getResources().getDisplayMetrics());click("Mehr");render(".local/wear-more-192-large.png",192);TextView heading=text("Störungen");assertEquals(1,heading.getLayout().getLineCount());assertEquals(0,heading.getLayout().getEllipsisCount(0));
    }
    @Test public void notificationDeepLinkOpensStoredAlertsWithoutGpsOrDeparturePolling(){
        shadowOf(RuntimeEnvironment.getApplication()).grantPermissions(android.Manifest.permission.ACCESS_FINE_LOCATION,android.Manifest.permission.ACCESS_COARSE_LOCATION);
        controller.stop().destroy();android.content.Intent intent=new android.content.Intent(RuntimeEnvironment.getApplication(),MainActivity.class).putExtra("foama_alerts",true);controller=Robolectric.buildActivity(MainActivity.class,intent).create().start().resume();app=controller.get();shadowOf(Looper.getMainLooper()).idle();
        assertEquals("alerts",app.screen);assertEquals(0,app.repo.nextFetchElapsed);assertTrue(shadowOf((android.location.LocationManager)app.getSystemService(android.content.Context.LOCATION_SERVICE)).getLocationUpdateListeners().isEmpty());controller.pause();
    }
    private View filters(){View row=app.getWindow().getDecorView().findViewWithTag("transport-shortcut");assertNotNull(row);return row;}
    @Test public void enabledFiltersOpenDirectSettingsAndReturnToSameHomeTab()throws Exception {
        for(String tab:new String[]{"near"}){
            app.changeView(tab);View shortcut=filters();assertTrue(shortcut.getContentDescription().toString().contains("U-Bahn, Tram, Bus, S-Bahn"));
            assertTrue(shortcut.performClick());assertEquals("more|modes",page());click("✓ Bus");click("Zurück");assertEquals("home",app.screen);assertEquals(tab,app.view);assertFalse(app.isFinishing());
            assertFalse(filters().getContentDescription().toString().contains("Bus"));filters().performClick();click("○ Bus");swipe(350,180,40,180,false);assertEquals("home",app.screen);assertEquals(tab,app.view);assertTrue(filters().getContentDescription().toString().contains("Bus"));
        }
        filters().performClick();for(String label:WearPolicy.MODE_LABELS)if(app.repo.modeAllowed(WearPolicy.MODES[Arrays.asList(WearPolicy.MODE_LABELS).indexOf(label)]))click("✓ "+label);
        click("Zurück");assertNotNull(text("Keine Verkehrsmittel"));assertTrue(filters().performClick());assertEquals("more|modes",page());
    }
    @Test public void nearbyAndWholeStationFavoriteShowMoreThanThreeDirections(){
        Repo.Stop s=app.repo.findStop("wl:60200657");android.location.Location point=new android.location.Location("test");point.setLatitude(s.lat);point.setLongitude(s.lon);point.setTime(System.currentTimeMillis());point.setAccuracy(5);app.repo.acceptLocation(point);
        String[] routes={"4A","1","U1","U2","U4","U1"},modes={"bus","tram","metro","metro","metro","metro"};
        for(int i=0;i<routes.length;i++){Repo.Departure d=new Repo.Departure();d.stopKey=s.id;d.route=routes[i];d.mode=modes[i];d.towards="Karlsplatz direction "+i;d.fetchedAt=System.currentTimeMillis();d.when=d.fetchedAt+(i+1)*60000;app.repo.departures.add(d);}
        app.renderContent();for(int i=0;i<routes.length;i++)assertNotNull(text("Karlsplatz direction "+i));
        app.repo.toggleFavorite(s,"","");app.changeView("fav");for(int i=0;i<routes.length;i++)assertNotNull(text("Karlsplatz direction "+i));
    }
    @Test public void selectedConnectionsShareOneStationCardWithStationFirstAndStillRemoveIndividually(){
        addDeparture();Repo.Stop s=station(),other=app.repo.findStop("wl:60200657");
        Repo.Departure d=new Repo.Departure();d.stopKey=s.id;d.route="U3";d.mode="metro";d.towards="Ottakring";d.when=System.currentTimeMillis()+360000;d.fetchedAt=System.currentTimeMillis();app.repo.departures.add(d);
        app.repo.toggleFavorite(s,"U1","Leopoldau");app.repo.toggleFavorite(other,"","");app.repo.toggleFavorite(s,"U3","Ottakring");
        String saved=app.repo.prefs.getString("favorites","");app.changeView("fav");
        assertEquals(2,app.repo.favoriteGroups().size());assertEquals(2,app.repo.favoriteGroups().get(s.id).size());assertEquals(saved,app.repo.prefs.getString("favorites",""));
        ViewGroup panel=app.getWindow().getDecorView().findViewWithTag("favorite-station:"+s.id);assertNotNull(panel);assertNull(app.getWindow().getDecorView().findViewWithTag("transport-shortcut"));
        assertTrue("Station is the main heading",text(s.name).getTextSize()>text("Leopoldau").getTextSize());assertNotNull(find(panel,"4′"));assertNotNull(find(panel,"6′"));
        click("Leopoldau");click("Favorit entfernen");app.onBackPressed();assertFalse(app.repo.hasFavorite(s,"U1","Leopoldau"));assertTrue(app.repo.hasFavorite(s,"U3","Ottakring"));assertTrue(app.repo.hasFavorite(other,"",""));
        assertNotNull(app.getWindow().getDecorView().findViewWithTag("favorite-station:"+s.id));
    }
    @Test @GraphicsMode(GraphicsMode.Mode.NATIVE) public void nearAndFavoriteStationUseTheSameHeadingAndDepartureGeometry()throws Exception {
        RuntimeEnvironment.setQualifiers("w192dp-h192dp-round-xhdpi");controller.stop().destroy();controller=Robolectric.buildActivity(MainActivity.class).create().start();app=controller.get();addDeparture();Repo.Stop s=station();
        android.location.Location fix=new android.location.Location("test");fix.setLatitude(s.lat);fix.setLongitude(s.lon);fix.setAccuracy(5);fix.setTime(System.currentTimeMillis());app.repo.acceptLocation(fix);app.repo.toggleFavorite(s,"","");
        java.util.List<android.graphics.Rect> expected=new java.util.ArrayList<>();String saved=app.repo.prefs.getString("favorites","");
        for(String tab:new String[]{"near","fav"}){
            app.changeView(tab);render(".local/wear-station-"+tab+"-192.png",192);ViewGroup panel=app.getWindow().getDecorView().findViewWithTag((tab.equals("near")?"near-station:":"favorite-station:")+s.id);assertNotNull(panel);
            String walking="↗ 1′ · "+app.repo.feasibility(s,app.repo.departures.get(0));assertNotNull(find(panel,s.name));assertNotNull(find(panel,walking));assertNotNull(find(panel,"Leopoldau"));
            int i=0;for(String label:new String[]{s.name,walking,"U1","Leopoldau","4′"}){
                TextView value=find(panel,label);android.graphics.Rect bounds=new android.graphics.Rect(0,0,value.getWidth(),value.getHeight());panel.offsetDescendantRectToMyCoords(value,bounds);
                if(tab.equals("near"))expected.add(bounds);else assertEquals("Same station layout: "+label,expected.get(i),bounds);i++;
            }
            click("Leopoldau");assertEquals("detail",app.screen);assertEquals(saved,app.repo.prefs.getString("favorites",""));app.onBackPressed();assertEquals(tab,app.view);
        }
    }
    @Test public void moreKeepsSettingsInSmallDedicatedPages(){click("Mehr");assertNull(find(app.getWindow().getDecorView(),"Verkehrsmittel"));click("Standort & Nähe");click("Verkehrsmittel");assertNotNull(text("✓ U-Bahn"));app.onBackPressed();assertNotNull(text("Standorteinstellungen"));app.onBackPressed();assertNotNull(text("App & Updates"));app.onBackPressed();assertEquals("home",app.screen);}
    @Test public void edgeSwipeNavigatesBackFromDetail(){addDeparture();app.openConnection(station(),"U1","Leopoldau");long now=android.os.SystemClock.uptimeMillis();MotionEvent down=MotionEvent.obtain(now,now,MotionEvent.ACTION_DOWN,0,100,0),up=MotionEvent.obtain(now,now+200,MotionEvent.ACTION_UP,240,103,0);app.dispatchTouchEvent(down);app.dispatchTouchEvent(up);assertEquals("home",app.screen);down.recycle();up.recycle();}
    @Test @GraphicsMode(GraphicsMode.Mode.NATIVE) public void firstDepartureFitsSmallRoundScreenAndRendersReviewImages()throws Exception {
        RuntimeEnvironment.setQualifiers("w192dp-h192dp-round-xhdpi");controller.stop().destroy();controller=Robolectric.buildActivity(MainActivity.class).create().start();app=controller.get();
        Repo.Stop s=station();android.location.Location point=new android.location.Location("test");point.setLatitude(s.lat);point.setLongitude(s.lon);point.setAccuracy(5);point.setTime(System.currentTimeMillis());app.repo.acceptLocation(point);addDeparture();app.renderContent();
        render(".local/wear-near-192.png",192);TextView number=text("4′");android.graphics.Rect where=new android.graphics.Rect(0,0,number.getWidth(),number.getHeight());((ViewGroup)app.getWindow().getDecorView()).offsetDescendantRectToMyCoords(number,where);float density=app.getResources().getDisplayMetrics().density;assertTrue("Minute text must be drawn inside its column",number.getLayout().getLineLeft(0)>=0 && number.getLayout().getLineRight(0)<=number.getWidth()+1);assertTrue("Primary minutes must fit initial watch viewport",where.bottom/density<=180);
        RuntimeEnvironment.setQualifiers("w227dp-h227dp-round-xhdpi");controller.stop().destroy();controller=Robolectric.buildActivity(MainActivity.class).create().start();app=controller.get();addDeparture();android.location.Location nextPoint=new android.location.Location("test");nextPoint.setLatitude(station().lat);nextPoint.setLongitude(station().lon);nextPoint.setAccuracy(5);nextPoint.setTime(System.currentTimeMillis());app.repo.acceptLocation(nextPoint);app.renderContent();render(".local/wear-near-227.png",227);app.openConnection(station(),"U1","Leopoldau");render(".local/wear-detail-227.png",227);
        app.repo.toggleFavorite(station(),"U1","Leopoldau");app.changeView("fav");render(".local/wear-favorites-227.png",227);app.changeView("near");
        app.returnHome();click("Mehr");render(".local/wear-more-227.png",227);click("Standort & Nähe");render(".local/wear-location-227.png",227);click("Verkehrsmittel");render(".local/wear-modes-227.png",227);app.onBackPressed();app.onBackPressed();click("Störungen");render(".local/wear-push-227.png",227);click("Push");render(".local/wear-push-delivery-227.png",227);click("Zurück");click("Auswahl");render(".local/wear-push-filters-227.png",227);click("Zurück");click("Infos");render(".local/wear-push-info-227.png",227);click("Zurück");click("Zurück");click("App & Updates");render(".local/wear-about-227.png",227);
        android.content.res.Configuration large=new android.content.res.Configuration(app.getResources().getConfiguration());large.fontScale=1.3f;app.getResources().updateConfiguration(large,app.getResources().getDisplayMetrics());app.returnHome();render(".local/wear-large-font-227.png",227);
        for(String mode:WearPolicy.MODES)app.repo.prefs.edit().putBoolean("mode_"+mode,true).commit();RuntimeEnvironment.setQualifiers("w192dp-h192dp-round-xhdpi");app.returnHome();render(".local/wear-all-filters-192.png",192);
        ViewGroup shortcut=(ViewGroup)filters(),icons=(ViewGroup)shortcut.getChildAt(shortcut.getChildCount()-1);assertTrue(icons.getChildCount()>=7);assertTrue(shortcut.getHeight()>=48*app.getResources().getDisplayMetrics().density);
        for(int i=0;i<icons.getChildCount();i++){View child=icons.getChildAt(i);assertTrue("Every enabled icon and the settings arrow fit",child.getRight()<=icons.getWidth()-icons.getPaddingRight());}
    }
    private void forceLayoutTree(View view){view.forceLayout();if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++)forceLayoutTree(group.getChildAt(i));}}
    private void render(String path,int size)throws Exception {View decor=app.getWindow().getDecorView();int pixels=Math.round(size*app.getResources().getDisplayMetrics().density);forceLayoutTree(decor);decor.measure(View.MeasureSpec.makeMeasureSpec(pixels,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(pixels,View.MeasureSpec.EXACTLY));decor.layout(0,0,pixels,pixels);Bitmap bitmap=Bitmap.createBitmap(pixels,pixels,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(bitmap);android.graphics.Path round=new android.graphics.Path();round.addCircle(pixels/2f,pixels/2f,pixels/2f,android.graphics.Path.Direction.CW);canvas.clipPath(round);decor.draw(canvas);try(java.io.OutputStream out=new java.io.FileOutputStream(path)){bitmap.compress(Bitmap.CompressFormat.PNG,100,out);}bitmap.recycle();}
}
