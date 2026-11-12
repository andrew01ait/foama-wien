package at.foama.wien;

import android.content.*;
import android.graphics.*;
import android.location.Location;
import android.os.Looper;
import android.view.*;
import android.widget.*;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.protolayout.DeviceParametersBuilders;
import org.json.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34,qualifiers="w227dp-h227dp-round-xhdpi") @LooperMode(LooperMode.Mode.PAUSED)
public class WatchExperienceTest {
    private ActivityController<MainActivity> controller;private MainActivity app;
    @Before public void setup(){RuntimeEnvironment.getApplication().getSharedPreferences("foama",0).edit().clear().commit();controller=Robolectric.buildActivity(MainActivity.class).create().start();app=controller.get();}
    @After public void cleanup(){controller.stop().destroy();}
    private TextView find(View view,String label){if(view instanceof TextView&&((TextView)view).getText().toString().equals(label))return (TextView)view;if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){TextView found=find(((ViewGroup)view).getChildAt(i),label);if(found!=null)return found;}return null;}
    private View decor(){return app.getWindow().getDecorView();}
    private ScrollView scroll(View view){if(view instanceof ScrollView)return (ScrollView)view;if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){ScrollView s=scroll(((ViewGroup)view).getChildAt(i));if(s!=null)return s;}return null;}
    private void force(View view){view.forceLayout();if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)force(((ViewGroup)view).getChildAt(i));}
    private void layout(View view,int size){int px=Math.round(size*view.getResources().getDisplayMetrics().density);force(view);view.measure(View.MeasureSpec.makeMeasureSpec(px,1073741824),View.MeasureSpec.makeMeasureSpec(px,1073741824));view.layout(0,0,px,px);Shadows.shadowOf(Looper.getMainLooper()).idle();}
    private Repo.Stop stop(){return app.repo.findStop("wl:60201320");}
    private Repo.Stop anyStop(){for(Repo.Stop s:app.repo.stops)if(s.name.equals("Stephansplatz U"))return s;throw new AssertionError();}
    private void departure(){Repo.Stop s=anyStop();Repo.Departure d=new Repo.Departure();d.stopKey=s.id;d.rbl=s.rbl.get(0);d.route="U1";d.towards="Leopoldau";d.mode="metro";d.quality="Live";d.when=System.currentTimeMillis()+240000;d.fetchedAt=System.currentTimeMillis();app.repo.departures.add(d);}
    @Test public void adaptivePolicyUsesAvailableSpaceAndKeepsCompactSchematicAtLargeFonts(){for(int width:new int[]{192,204,225,240})for(float scale:new float[]{1,1.3f,1.5f}){WatchLayout l=new WatchLayout(width,scale,true);assertTrue(l.tabHeight>=48);assertTrue(width-2*l.padding>=144);if(scale>1.15)assertTrue(l.stacked);assertEquals(width>=225&&scale==1?4:2,l.stopsBefore);}}
    @Test public void backRestoresReadingPositionInFavoritesAfterDetailAndLiveRerender()throws Exception{departure();app.repo.toggleFavorite(anyStop(),"","");app.changeView("fav");layout(decor(),227);ScrollView s=scroll(decor());s.scrollTo(0,110);int before=s.getScrollY();assertTrue(before>0);app.openConnection(anyStop(),"U1","Leopoldau","metro");layout(decor(),227);assertEquals(0,s.getScrollY());app.renderContent();app.navigateBack();layout(decor(),227);java.lang.reflect.Field field=MainActivity.class.getDeclaredField("readingPositions");field.setAccessible(true);assertEquals(field.get(app).toString(),before,s.getScrollY());assertEquals("fav",app.view);}
    @Test public void approachUsesExistingForecastImmediatelyAndBackReturnsToExactConnection(){departure();app.openConnection(anyStop(),"U1","Leopoldau","metro");app.openApproach("metro");assertEquals("approach",app.screen);assertNotNull(find(decor(),"4′"));assertNotNull(find(decor(),"Abfahrt · LIVE"));assertNotNull(find(decor(),"Position geschätzt · keine GPS-Ortung der Fahrzeuge"));app.navigateBack();assertEquals("detail",app.screen);assertNotNull(find(decor(),"Leopoldau"));}
    @Test public void tileIsOnlyTwoDirectShortcutsAndRequestsNoFreshnessPolling()throws Exception{
        FoamaTileService service=new FoamaTileService();
        for(int size:new int[]{192,204,225,240}){String tile=service.onTileRequest(new RequestBuilders.TileRequest.Builder().setDeviceConfiguration(new DeviceParametersBuilders.DeviceParameters.Builder().setScreenWidthDp(size).setScreenHeightDp(size).build()).build()).get().toString();assertTrue(tile.contains("Favoriten"));assertTrue(tile.contains("In der Nähe"));assertTrue(tile.contains("foama_shortcut"));assertFalse(tile.contains("api/"));assertFalse(tile.contains("location"));assertTrue(tile.contains("height"));}
    }
    @Test public void tileShortcutExplicitlyOpensRequestedTabWithoutChangingStoredPreference(){app.changeView("fav");app.onNewIntent(new Intent(app,MainActivity.class).putExtra("foama_shortcut","near"));assertEquals("home",app.screen);assertEquals("near",app.view);assertEquals("fav",app.repo.prefs.getString("view",""));}
    @Test public void mapOpensPrivatelyWithExistingFixAndReturnsStationToMain(){departure();app.openConnection(anyStop(),"","");TextView button=find(decor(),"Station auf Karte");assertNotNull(button);button.performClick();Intent next=Shadows.shadowOf(app).getNextStartedActivity();assertEquals(MapActivity.class.getName(),next.getComponent().getClassName());assertEquals(anyStop().id,next.getStringExtra("stop"));}
    @Test public void polylineDecoderAndMercatorProjectionUseGeographicCoordinates(){java.util.ArrayList<double[]> points=TransitMapView.decodePolyline("_izlhA~rlgdF_{geC~ywl@_kwzCn`{nI");assertEquals(3,points.size());assertEquals(38.5,points.get(0)[0],.000001);assertEquals(-120.2,points.get(0)[1],.000001);assertEquals(32768,TransitMapView.worldX(0,8),.001);assertEquals(32768,TransitMapView.worldY(0,8),.001);}
    @Test @GraphicsMode(GraphicsMode.Mode.NATIVE) public void compactAndLargeDeparturesStayReadableAndTappable()throws Exception{
        departure();app.repo.toggleFavorite(anyStop(),"","");
        for(int size:new int[]{192,204,225,240})for(float font:new float[]{1,1.3f,1.5f}){
            RuntimeEnvironment.setQualifiers("w"+size+"dp-h"+size+"dp-round-xhdpi");android.content.res.Configuration config=new android.content.res.Configuration(app.getResources().getConfiguration());config.fontScale=font;app.getResources().updateConfiguration(config,app.getResources().getDisplayMetrics());app.changeView("fav");layout(decor(),size);
            TextView direction=find(decor(),"Leopoldau"),time=find(decor(),"4′");assertNotNull(direction);assertNotNull(time);assertTrue(direction.getWidth()>0);assertTrue(time.getWidth()>0);assertEquals(0,time.getLayout().getEllipsisCount(0));assertTrue(time.getLayout().getLineRight(0)<=time.getWidth()+1);assertTrue(direction.getLayout().getLineRight(0)<=direction.getWidth()+1);
            if(size==192||size==240)image(decor(),size,".local/watch-080-favorites-"+size+"-"+font+".png");
        }
    }
    @Test @GraphicsMode(GraphicsMode.Mode.NATIVE) public void mapsRenderStationsAndOfflineLineOverlayAtSmallAndLargeSizes()throws Exception{
        for(int size:new int[]{192,240}){RuntimeEnvironment.setQualifiers("w"+size+"dp-h"+size+"dp-round-xhdpi");Intent intent=new Intent(RuntimeEnvironment.getApplication(),MapActivity.class).putExtra("stop",anyStop().id);ActivityController<MapActivity> mapController=Robolectric.buildActivity(MapActivity.class,intent).create().start();try{MapActivity activity=mapController.get();activity.map.showLine("U1","metro");layout(activity.getWindow().getDecorView(),size);image(activity.getWindow().getDecorView(),size,".local/watch-080-map-"+size+".png");assertNotNull(activity.map.selected);assertFalse(activity.repo.reliableLocation());for(String mode:WearPolicy.MODES)activity.repo.prefs.edit().putBoolean("mode_"+mode,false).commit();assertTrue(activity.map.visibleStations().contains(activity.map.selected));}finally{mapController.stop().destroy();}}
    }
    private void image(View view,int size,String path)throws Exception{int px=Math.round(size*view.getResources().getDisplayMetrics().density);Bitmap bitmap=Bitmap.createBitmap(px,px,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(bitmap);Path circle=new Path();circle.addCircle(px/2f,px/2f,px/2f,Path.Direction.CW);canvas.clipPath(circle);view.draw(canvas);try(java.io.OutputStream out=new java.io.FileOutputStream(path)){bitmap.compress(Bitmap.CompressFormat.PNG,100,out);}bitmap.recycle();}
}
