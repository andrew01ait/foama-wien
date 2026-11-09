package at.foama.wien;
import android.graphics.Rect;
import android.view.*;
import java.util.*;

/** Read visible station tags from the actual scroll viewport, without reordering the UI. */
final class StationViewport {
    static Set<String> visible(ViewGroup content,View viewport,int minimum){
        LinkedHashSet<String> ids=new LinkedHashSet<>();Rect bounds=new Rect();
        if(viewport.getGlobalVisibleRect(bounds))collect(content,bounds,minimum,ids);return ids;
    }
    private static void collect(View view,Rect bounds,int minimum,Set<String> ids){
        if(!view.isShown())return;Rect visible=new Rect();
        if(!view.getGlobalVisibleRect(visible)||!visible.intersect(bounds)||visible.width()<minimum||visible.height()<minimum)return;
        Object tag=view.getTag(at.andrew.foamawien.R.id.station_id);if(tag instanceof String)ids.add((String)tag);
        if(view instanceof ViewGroup){ViewGroup group=(ViewGroup)view;for(int i=0;i<group.getChildCount();i++)collect(group.getChildAt(i),bounds,minimum,ids);}
    }
}
