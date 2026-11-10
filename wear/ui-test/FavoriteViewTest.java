package at.foama.wien;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import static org.junit.Assert.*;
import android.view.*;
import android.widget.*;
import android.os.Looper;
import android.graphics.*;
import org.json.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
@RunWith(RobolectricTestRunner.class) @Config(sdk=34,qualifiers="w227dp-h227dp-round-xhdpi") @LooperMode(LooperMode.Mode.PAUSED)
public class FavoriteViewTest {
    private ActivityController<MainActivity> controller;private MainActivity app;
    @Before public void setup(){RuntimeEnvironment.getApplication().getSharedPreferences("foama",0).edit().clear().commit();controller=Robolectric.buildActivity(MainActivity.class).create().start();app=controller.get();}
    @After public void cleanup(){controller.stop().destroy();}
    private JSONObject route()throws Exception{return new JSONObject(new String(Files.readAllBytes(Paths.get("tests/fixtures/transfer-routes-webcrypto.json")),StandardCharsets.UTF_8)).getJSONObject("value").getJSONArray("journeys").getJSONObject(0).put("name","Arbeitsweg");}
    private TextView find(View v,String label){if(v instanceof TextView&&((TextView)v).getText().toString().equals(label))return (TextView)v;if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++){TextView found=find(((ViewGroup)v).getChildAt(i),label);if(found!=null)return found;}return null;}
    private TextView text(String label){TextView result=find(app.getWindow().getDecorView(),label);assertNotNull(label,result);return result;}
    private void click(String label){View target=text(label);while(!target.isClickable()&&target.getParent() instanceof View)target=(View)target.getParent();assertTrue(target.performClick());}
    @SuppressWarnings("unchecked") private List<Repo.Stop> targets()throws Exception{java.lang.reflect.Method m=MainActivity.class.getDeclaredMethod("targets");m.setAccessible(true);return (List<Repo.Stop>)m.invoke(app);}
    private Repo.Stop station(){for(Repo.Stop s:app.repo.stops)if(s.name.equals("Stephansplatz U"))return s;throw new AssertionError();}
    @Test public void switchingSeparatesCollectionsAndCancelsOldRequestsWithoutResettingFetchBudget()throws Exception{
        JSONObject route=route();app.repo.journeys.merge(new JSONArray().put(route));app.repo.toggleFavorite(station(),"U1","Leopoldau");app.changeView("fav");
        assertTrue(text("Routen").isSelected());assertNotNull(text("Arbeitsweg"));assertNull(find(app.getWindow().getDecorView(),station().name));
        Repo.Stop first=app.repo.findStop(JourneyStore.boardings(route).get(0).getJSONObject("from").getString("stopId"));assertEquals(Collections.singletonList(first),targets());
        java.lang.reflect.Field field=MainActivity.class.getDeclaredField("requests");field.setAccessible(true);RequestScope old=(RequestScope)field.get(app);app.repo.nextFetchElapsed=Long.MAX_VALUE;
        click("Stationen");assertTrue(old.isCancelled());assertTrue(text("Stationen").isSelected());assertNotNull(text("Haltestellen & Linien"));assertNotNull(text(station().name));assertNull(find(app.getWindow().getDecorView(),"Arbeitsweg"));assertEquals(Collections.singletonList(station()),targets());assertEquals(Long.MAX_VALUE,app.repo.nextFetchElapsed);
        app.openConnection(station(),"U1","Leopoldau");app.navigateBack();assertTrue(text("Stationen").isSelected());assertEquals(1,app.repo.favorites.size());assertEquals(1,app.repo.journeys.all().length());
    }
    @Test public void chosenSectionSurvivesRefreshTabChangeAndActivityRestart()throws Exception{
        app.repo.journeys.merge(new JSONArray().put(route()));app.repo.toggleFavorite(station(),"U1","Leopoldau");app.changeView("fav");click("Stationen");app.renderContent();assertTrue(text("Stationen").isSelected());app.changeView("near");app.changeView("fav");assertTrue(text("Stationen").isSelected());
        controller.stop().destroy();controller=Robolectric.buildActivity(MainActivity.class).create().start();app=controller.get();assertEquals("fav",app.view);assertTrue(text("Stationen").isSelected());assertNotNull(text(station().name));assertEquals(1,app.repo.journeys.all().length());
        click("Routen");click("Arbeitsweg");app.navigateBack();assertTrue(text("Routen").isSelected());assertNotNull(text("Arbeitsweg"));
    }
    @Test @GraphicsMode(GraphicsMode.Mode.NATIVE) public void bothEmptySectionsRemainReachableAndButtonsFitSmallRoundWatchWithLargeText()throws Exception{
        app.changeView("fav");assertNotNull(text("Deine wichtigsten Wege"));click("Routen");assertNotNull(text("Noch keine Routen"));click("Stationen");assertNotNull(text("Haltestellen & Linien"));
        app.repo.journeys.merge(new JSONArray().put(route()));app.repo.toggleFavorite(station(),"U1","Leopoldau");
        for(int size:new int[]{227,192}){RuntimeEnvironment.setQualifiers("w"+size+"dp-h"+size+"dp-round-xhdpi");android.content.res.Configuration config=new android.content.res.Configuration(app.getResources().getConfiguration());config.fontScale=size==192?1.3f:1f;app.getResources().updateConfiguration(config,app.getResources().getDisplayMetrics());
            for(String label:new String[]{"Routen","Stationen"}){click(label);render(size,".local/wear-favorite-"+label.toLowerCase()+"-"+size+".png");assertHeaderFitsCircle(size);assertCompactFilterGap(label);for(String name:new String[]{"Routen","Stationen"}){TextView tab=text(name);float density=app.getResources().getDisplayMetrics().density;String note=size+" "+name+" size="+tab.getWidth()/density+"x"+tab.getHeight()/density+" line="+tab.getLayout().getLineLeft(0)+".."+tab.getLayout().getLineRight(0);assertTrue(note,tab.getHeight()/density>=48);assertTrue(note,tab.getWidth()/density>=48);assertEquals(note,1,tab.getLayout().getLineCount());assertEquals(note,0,tab.getLayout().getEllipsisCount(0));assertTrue(note,tab.getLayout().getLineLeft(0)>=0&&tab.getLayout().getLineRight(0)<=tab.getWidth()-tab.getPaddingLeft()-tab.getPaddingRight()+1);}}
        }
    }
    private void assertHeaderFitsCircle(int size){
        ViewGroup decor=(ViewGroup)app.getWindow().getDecorView();TextView title=decor.findViewWithTag("main-title");String city=CityProfiles.name(app.repo.cities.current());assertEquals(city,title.getText().toString());
        assertTrue(title.isAccessibilityHeading());assertEquals(1,title.getLayout().getLineCount());assertEquals(0,title.getLayout().getEllipsisCount(0));assertTrue(title.getLayout().getLineLeft(0)>=0&&title.getLayout().getLineRight(0)<=title.getWidth()+1);
        Rect titleBounds=new Rect(0,0,title.getWidth(),title.getHeight());decor.offsetDescendantRectToMyCoords(title,titleBounds);
        ViewGroup navigation=decor.findViewWithTag("main-navigation");ImageView icon=(ImageView)((ViewGroup)navigation.getChildAt(1)).getChildAt(0);Rect iconBounds=new Rect(0,0,icon.getWidth(),icon.getHeight());decor.offsetDescendantRectToMyCoords(icon,iconBounds);
        Rect glyphs=new Rect();title.getPaint().getTextBounds(city,0,city.length(),glyphs);
        float radius=size*app.getResources().getDisplayMetrics().density/2f;
        float x=titleBounds.exactCenterX()-title.getPaint().measureText(city)/2f,y=titleBounds.top+title.getBaseline();
        assertTrue("Title is above navigation icons",y+glyphs.bottom<=iconBounds.top);
        for(float left:new float[]{x+glyphs.left,x+glyphs.right})for(float top:new float[]{y+glyphs.top,y+glyphs.bottom})assertTrue("Title stays inside round display: "+size,(left-radius)*(left-radius)+(top-radius)*(top-radius)<=radius*radius);
    }
    private Rect bounds(View view){Rect result=new Rect(0,0,view.getWidth(),view.getHeight());((ViewGroup)app.getWindow().getDecorView()).offsetDescendantRectToMyCoords(view,result);return result;}
    private void assertCompactFilterGap(String selected){
        ViewGroup decor=(ViewGroup)app.getWindow().getDecorView(),filter=decor.findViewWithTag("transport-shortcut");ViewGroup icons=(ViewGroup)filter.getChildAt(0);
        TextView tab=text(selected);android.graphics.drawable.InsetDrawable background=(android.graphics.drawable.InsetDrawable)tab.getBackground();
        float density=app.getResources().getDisplayMetrics().density;
        float gap=(bounds(icons.getChildAt(0)).top-bounds(tab).top-background.getDrawable().getBounds().bottom)/density;
        assertTrue("Visible filter gap: "+gap,gap>=4&&gap<=16);
        assertTrue("Separate 48dp touch rows: "+bounds(tab)+" / "+bounds(filter),bounds(tab).bottom<=bounds(filter).top);assertTrue(filter.getHeight()/density>=48);
        if(selected.equals("Stationen"))assertTrue("Station follows the full filter touch target",bounds(filter).bottom<=bounds(text(station().name)).top);
    }
    @Test @GraphicsMode(GraphicsMode.Mode.NATIVE) public void lowBatteryOfferRetainsItsOwnTouchAreaAfterFilter()throws Exception{
        app.changeView("fav");app.applyBattery(19);app.renderContent();render(227,".local/wear-favorite-low-battery-227.png");
        View filter=app.getWindow().getDecorView().findViewWithTag("transport-shortcut");assertTrue(bounds(filter).bottom<=bounds(text("Akku sparen?")).top);
        click("Akku sparen?");assertNotNull(text("Unter 20 % aktivieren"));
    }
    private void layoutTree(View v){v.forceLayout();v.invalidate();if(v instanceof ViewGroup)for(int i=0;i<((ViewGroup)v).getChildCount();i++)layoutTree(((ViewGroup)v).getChildAt(i));}
    private void render(int size,String path)throws Exception{View decor=app.getWindow().getDecorView();int pixels=Math.round(size*app.getResources().getDisplayMetrics().density);layoutTree(decor);decor.measure(View.MeasureSpec.makeMeasureSpec(pixels,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(pixels,View.MeasureSpec.EXACTLY));decor.layout(0,0,pixels,pixels);org.robolectric.Shadows.shadowOf(Looper.getMainLooper()).idle();Bitmap bitmap=Bitmap.createBitmap(pixels,pixels,Bitmap.Config.ARGB_8888);Canvas canvas=new Canvas(bitmap);android.graphics.Path round=new android.graphics.Path();round.addCircle(pixels/2f,pixels/2f,pixels/2f,android.graphics.Path.Direction.CW);canvas.clipPath(round);decor.draw(canvas);try(java.io.OutputStream out=new java.io.FileOutputStream(path)){bitmap.compress(Bitmap.CompressFormat.PNG,100,out);}bitmap.recycle();}
}
