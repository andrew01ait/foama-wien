package at.foama.wien;

import android.content.res.Resources;

/** Available dp and font scale matter more than the watch's case diameter. */
final class WatchLayout {
    final int width,padding,tabHeight,stopsBefore;
    final boolean stacked,largeText;
    WatchLayout(int width,float scale,boolean round){
        this.width=width;largeText=scale>1.15f;
        padding=round?Math.max(14,Math.round(width*.08f)):12;
        stacked=(width-2*padding)/Math.max(1,scale)<170;
        tabHeight=Math.max(48,Math.round(14+16*scale+10));
        stopsBefore=width>=225&&!largeText?4:2;
    }
    static WatchLayout of(Resources r){return new WatchLayout(Math.round(r.getDisplayMetrics().widthPixels/r.getDisplayMetrics().density),r.getConfiguration().fontScale,r.getConfiguration().isScreenRound());}
}
