package at.foama.wien;
import org.junit.*;
import org.junit.runner.RunWith;
import org.robolectric.*;
import org.robolectric.annotation.Config;
import static org.junit.Assert.*;
import android.app.Activity;
import android.view.*;
import android.widget.*;
import java.util.*;

@RunWith(RobolectricTestRunner.class) @Config(sdk=34,qualifiers="w227dp-h227dp-round")
public class StationViewportTest {
    @Test public void scrollingChangesActualVisibleStationIds(){
        org.robolectric.android.controller.ActivityController<Activity> controller=Robolectric.buildActivity(Activity.class).create().start();Activity app=controller.get();
        ScrollView scroll=new ScrollView(app);LinearLayout content=new LinearLayout(app);content.setOrientation(LinearLayout.VERTICAL);scroll.addView(content);app.setContentView(scroll);controller.visible();
        for(int i=0;i<3;i++){TextView card=new TextView(app);card.setText("Station "+i);card.setTag(at.andrew.foamawien.R.id.station_id,"station"+i);content.addView(card,new LinearLayout.LayoutParams(-1,200));}
        View decor=app.getWindow().getDecorView();decor.measure(View.MeasureSpec.makeMeasureSpec(227,View.MeasureSpec.EXACTLY),View.MeasureSpec.makeMeasureSpec(227,View.MeasureSpec.EXACTLY));decor.layout(0,0,227,227);
        Set<String> before=StationViewport.visible(content,scroll,8);assertTrue(before.contains("station0"));assertFalse(before.contains("station2"));
        scroll.scrollTo(0,350);Set<String> after=StationViewport.visible(content,scroll,8);assertFalse(after.contains("station0"));assertTrue(after.contains("station2"));controller.stop().destroy();
    }
    @Test public void visibleStationsUseAllAvailableSlotsBeforeOffscreenMetroWhileRotationRemainsBounded(){
        List<List<String>> all=new ArrayList<>(),visible=new ArrayList<>();Map<String,Integer> priorities=new HashMap<>();
        for(int i=1;i<=40;i++){all.add(Arrays.asList(""+i));priorities.put(""+i,0);}
        List<String> bus=new ArrayList<>();for(int i=100;i<120;i++){bus.add(""+i);priorities.put(""+i,2);}all.add(bus);visible.add(bus);
        Set<String> seen=new HashSet<>();for(int cycle=0;cycle<20;cycle++){List<String> batch=WearPolicy.visibleBudget(all,visible,cycle,priorities);assertEquals(24,batch.size());assertTrue(batch.containsAll(bus));assertEquals(24,new HashSet<>(batch).size());seen.addAll(batch);}
        assertEquals(60,seen.size());
    }
}
