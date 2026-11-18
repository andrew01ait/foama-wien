package at.foama.wien;

import androidx.wear.tiles.TileService;
import androidx.wear.tiles.TileBuilders;
import androidx.wear.tiles.RequestBuilders;
import androidx.wear.protolayout.*;
import androidx.concurrent.futures.CallbackToFutureAdapter;
import com.google.common.util.concurrent.ListenableFuture;

/** A shortcut Tile, deliberately without network, location or background refresh. */
public final class FoamaTileService extends TileService {
    private <T> ListenableFuture<T> ready(T value){return CallbackToFutureAdapter.getFuture(completer->{completer.set(value);return "foama-shortcuts";});}
    @Override protected ListenableFuture<ResourceBuilders.Resources> onTileResourcesRequest(RequestBuilders.ResourcesRequest request){return ready(new ResourceBuilders.Resources.Builder().setVersion("1").build());}
    private LayoutElementBuilders.Text text(String value,int size,int color){return new LayoutElementBuilders.Text.Builder().setText(value).setMaxLines(1).setFontStyle(new LayoutElementBuilders.FontStyle.Builder().setSize(DimensionBuilders.sp(size)).setColor(ColorBuilders.argb(color)).build()).build();}
    private LayoutElementBuilders.Box shortcut(String value,String target,int width){
        ActionBuilders.AndroidActivity activity=new ActionBuilders.AndroidActivity.Builder().setPackageName(BuildConfig.APPLICATION_ID).setClassName(MainActivity.class.getName()).addKeyToExtraMapping("foama_shortcut",ActionBuilders.stringExtra(target)).build();
        ModifiersBuilders.Modifiers mods=new ModifiersBuilders.Modifiers.Builder().setClickable(new ModifiersBuilders.Clickable.Builder().setId(target).setOnClick(new ActionBuilders.LaunchAction.Builder().setAndroidActivity(activity).build()).build()).setSemantics(new ModifiersBuilders.Semantics.Builder().setContentDescription(value+" öffnen").build()).setBackground(new ModifiersBuilders.Background.Builder().setColor(ColorBuilders.argb(target.equals("fav")?MainActivity.MINT:MainActivity.CARD)).setCorner(new ModifiersBuilders.Corner.Builder().setRadius(DimensionBuilders.dp(24)).build()).build()).build();
        return new LayoutElementBuilders.Box.Builder().setWidth(DimensionBuilders.dp(width)).setHeight(DimensionBuilders.dp(48)).setModifiers(mods).addContent(text(value,14,target.equals("fav")?0xff082b24:MainActivity.WHITE)).build();
    }
    @Override protected ListenableFuture<TileBuilders.Tile> onTileRequest(RequestBuilders.TileRequest request){
        int width=request.getDeviceConfiguration()==null?192:request.getDeviceConfiguration().getScreenWidthDp();int buttonWidth=Math.min(170,Math.round(width*.72f));
        LayoutElementBuilders.Column content=new LayoutElementBuilders.Column.Builder().addContent(text("foama",18,MainActivity.MINT)).addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(8)).build()).addContent(shortcut("Favoriten","fav",buttonWidth)).addContent(new LayoutElementBuilders.Spacer.Builder().setHeight(DimensionBuilders.dp(6)).build()).addContent(shortcut("In der Nähe","near",buttonWidth)).build();
        LayoutElementBuilders.Layout layout=new LayoutElementBuilders.Layout.Builder().setRoot(new LayoutElementBuilders.Box.Builder().setWidth(DimensionBuilders.expand()).setHeight(DimensionBuilders.expand()).addContent(content).build()).build();
        return ready(new TileBuilders.Tile.Builder().setResourcesVersion("1").setTileTimeline(new TimelineBuilders.Timeline.Builder().addTimelineEntry(new TimelineBuilders.TimelineEntry.Builder().setLayout(layout).build()).build()).build());
    }
}
