package at.foama.wien;

import android.app.AlertDialog;
import android.content.*;
import android.view.*;
import android.widget.*;
import java.util.*;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.android.controller.ActivityController;
import org.robolectric.annotation.*;
import org.robolectric.shadows.ShadowAlertDialog;
import static org.junit.Assert.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34,qualifiers="w192dp-h192dp-round-xhdpi") @LooperMode(LooperMode.Mode.PAUSED)
public class MapStationListTest {
    private ActivityController<MapActivity> controller;private MapActivity app;
    @Before public void setup(){
        Context context=RuntimeEnvironment.getApplication();context.getSharedPreferences("foama",0).edit().clear().commit();
        controller=Robolectric.buildActivity(MapActivity.class,new Intent(context,MapActivity.class).putExtra("stop","wl:60201917")).create().start();app=controller.get();layout(app.getWindow().getDecorView(),192);
    }
    @After public void cleanup(){controller.stop().destroy();}
    private TextView find(View view,String value){if(view instanceof TextView&&((TextView)view).getText().toString().equals(value))return (TextView)view;if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){TextView found=find(((ViewGroup)view).getChildAt(i),value);if(found!=null)return found;}return null;}
    private View description(View view,String value){if(value.contentEquals(view.getContentDescription()==null?"":view.getContentDescription()))return view;if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++){View found=description(((ViewGroup)view).getChildAt(i),value);if(found!=null)return found;}return null;}
    private AlertDialog list(){View button=description(app.getWindow().getDecorView(),"Stationsliste öffnen");assertNotNull(button);button.performClick();AlertDialog dialog=ShadowAlertDialog.getLatestAlertDialog();assertNotNull(dialog.getListView());return dialog;}
    private void action(String value){
        View card=app.getWindow().getDecorView();TextView label=null;ArrayList<TextView> labels=new ArrayList<>();collect(card,labels);for(TextView item:labels)if(item.getText().toString().startsWith("Paukerwerkstraße"))label=item;assertNotNull(label);label.performClick();AlertDialog dialog=ShadowAlertDialog.getLatestAlertDialog();ListView list=dialog.getListView();int index=-1;for(int i=0;i<list.getAdapter().getCount();i++)if(value.equals(list.getAdapter().getItem(i).toString()))index=i;assertTrue(value,index>=0);list.performItemClick(null,index,list.getAdapter().getItemId(index));
    }
    private void collect(View view,List<TextView> out){if(view instanceof TextView)out.add((TextView)view);if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)collect(((ViewGroup)view).getChildAt(i),out);}
    private Repo.Stop unrelated(){Repo.Stop stop=new Repo.Stop();stop.id="test:unrelated";stop.name="Andere Linie";stop.lat=app.map.selected.lat;stop.lon=app.map.selected.lon;stop.modes.add("bus");app.repo.stops.add(stop);return stop;}
    private void force(View view){view.forceLayout();if(view instanceof ViewGroup)for(int i=0;i<((ViewGroup)view).getChildCount();i++)force(((ViewGroup)view).getChildAt(i));}
    private void layout(View view,int size){int pixels=Math.round(size*view.getResources().getDisplayMetrics().density);force(view);view.measure(View.MeasureSpec.makeMeasureSpec(pixels,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(pixels,View.MeasureSpec.EXACTLY));view.layout(0,0,pixels,pixels);}
    @Test public void persistentListWorksBeforeAfterAndFollowingRepeatedStationSelections(){
        app.map.selected=null;AlertDialog first=list();assertTrue(first.getListView().getAdapter().getCount()>0);first.getListView().performItemClick(null,0,0);assertNotNull(app.map.selected);
        for(int i=0;i<2;i++){AlertDialog again=list();assertTrue(again.getListView().getAdapter().getCount()>0);again.getListView().performItemClick(null,0,0);assertNotNull(app.map.selected);}
    }
    @Test public void choosingActualLineHidesUnrelatedStationsInDrawingPickingAndList(){
        Repo.Stop other=unrelated();assertTrue(app.map.visibleStations().contains(other));action("Linie 29B zeigen");assertEquals("29B",app.map.activeLine());assertTrue(app.map.visibleStations().contains(app.map.selected));assertFalse(app.map.visibleStations().contains(other));
        AlertDialog dialog=list();for(int i=0;i<dialog.getListView().getAdapter().getCount();i++)assertNotEquals("Andere Linie",dialog.getListView().getAdapter().getItem(i).toString());dialog.dismiss();
        long now=android.os.SystemClock.uptimeMillis();app.map.onTouchEvent(MotionEvent.obtain(now,now,MotionEvent.ACTION_DOWN,app.map.getWidth()/2f,app.map.getHeight()/2f,0));app.map.onTouchEvent(MotionEvent.obtain(now,now+30,MotionEvent.ACTION_UP,app.map.getWidth()/2f,app.map.getHeight()/2f,0));assertNotSame(other,app.map.selected);
    }
    @Test public void returnToAllStationsRestoresCatalogueWithoutLosingSelection(){
        Repo.Stop other=unrelated(),selected=app.map.selected;action("Linie 29B zeigen");assertFalse(app.map.visibleStations().contains(other));action("Alle Stationen zeigen");assertFalse(app.map.hasLine());assertSame(selected,app.map.selected);assertTrue(app.map.visibleStations().contains(other));assertTrue(list().getListView().getAdapter().getCount()>0);
    }
    @Test public void failedLineSelectionKeepsExistingValidLineAndExplicitLineIgnoresNearbyModeFilter(){
        action("Linie 29B zeigen");app.map.showLine("not-a-line","bus");assertEquals("29B",app.map.activeLine());for(String mode:WearPolicy.MODES)app.repo.prefs.edit().putBoolean("mode_"+mode,false).commit();app.map.zoomBy(-2);assertTrue(app.map.visibleStations().size()>1);for(Repo.Stop stop:app.map.visibleStations())assertTrue(stop.routes.contains("29B"));
    }
    @Test @GraphicsMode(GraphicsMode.Mode.NATIVE) public void smallAndLargeRoundMapsKeepReadableListAndBackTargets()throws Exception {
        for(int size:new int[]{192,240}){RuntimeEnvironment.setQualifiers("w"+size+"dp-h"+size+"dp-round-xhdpi");layout(app.getWindow().getDecorView(),size);action("Linie 29B zeigen");View list=description(app.getWindow().getDecorView(),"Stationsliste öffnen"),back=description(app.getWindow().getDecorView(),"Karte schließen");assertNotNull(list);assertNotNull(back);assertTrue(list.getHeight()/app.getResources().getDisplayMetrics().density>=48);assertTrue(back.getWidth()/app.getResources().getDisplayMetrics().density>=48);
            int pixels=Math.round(size*app.getResources().getDisplayMetrics().density);android.graphics.Bitmap bitmap=android.graphics.Bitmap.createBitmap(pixels,pixels,android.graphics.Bitmap.Config.ARGB_8888);android.graphics.Canvas canvas=new android.graphics.Canvas(bitmap);android.graphics.Path clip=new android.graphics.Path();clip.addCircle(pixels/2f,pixels/2f,pixels/2f,android.graphics.Path.Direction.CW);canvas.clipPath(clip);app.getWindow().getDecorView().draw(canvas);try(java.io.FileOutputStream out=new java.io.FileOutputStream(".local/watch-line-map-"+size+".png")){bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG,100,out);}bitmap.recycle();}
    }
}
