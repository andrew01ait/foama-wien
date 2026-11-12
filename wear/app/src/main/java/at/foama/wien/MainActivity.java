package at.foama.wien;

import android.Manifest;
import android.app.*;
import android.os.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.InsetDrawable;
import android.graphics.drawable.RippleDrawable;
import android.graphics.drawable.StateListDrawable;
import android.location.*;
import android.provider.Settings;
import android.text.TextUtils;
import android.view.*;
import android.widget.*;
import java.util.*;
import java.util.concurrent.*;
import org.json.*;

/** Glanceable standalone Wear app. No background service, location or refresh polling. */
public final class MainActivity extends Activity {
    static final int BG=Color.BLACK,CARD=0xff111c25,BORDER=0xff253746,MINT=0xff73e0b7,MUTED=0xff9bb0bd,WHITE=Color.WHITE,AMBER=0xffffcb76;
    Repo repo;
    WatchPush push;
    TransferManager transfer;TransferManager.Preview transferPreview;
    private RequestScope transferRequests;RequestScope.ConnectionFactory transferConnectionFactory;private Future<?> transferRequest;private boolean transferBusy;
    private String importedFavoriteView="";
    private String transferMessage="";private android.graphics.Bitmap transferQr;
    private final Runnable transferTicker=new Runnable(){public void run(){pollTransfer();}};
    private long transferDeadlineElapsed;
    private final Runnable transferTimeout=new Runnable(){public void run(){if(active&&screen.equals("transfer")&&transfer!=null&&!transfer.closed)finishTransfer("Code abgelaufen. Zurück und neuen Code öffnen.");}};

    private final Handler handler=new Handler(Looper.getMainLooper());
    private final ExecutorService network=Executors.newSingleThreadExecutor();
    private RequestScope requests=new RequestScope();
    private Future<?> departureRequest,updateRequest;
    private RequestScope updateScope,fileScope;RequestScope.ConnectionFactory updateConnectionFactory;
    private Future<?> fileRequest;private volatile java.io.InputStream fileStream;
    private android.net.Uri pendingFile;private TransferManager.Preview filePreview;private String fileMessage="",fileParent="routes",transferParentSection="transfer";
    static final int IMPORT_FILE=42;
    private boolean resumed,updating,updateDownloading,updateHandedToInstaller;
    static final long UPDATE_TIMEOUT_MS=5*60*1000L;
    WatchPowerSaver powerSaver;private boolean batteryRegistered;private long lastLocationAttempt=-1,lastDepartureAttempt=-1;private String batteryMessage="";
    private final BroadcastReceiver batteryReceiver=new BroadcastReceiver(){public void onReceive(Context context,Intent intent){if(active)readBattery(intent);}};
    private final Updater.InstallStatus installStatus=result->{
        if(!updateDownloading)return;
        if(result==android.content.pm.PackageInstaller.STATUS_PENDING_USER_ACTION){updateHandedToInstaller=true;cancelUpdate("Update an Android übergeben. Bitte Installation bestätigen.");}
        else cancelUpdate(result==android.content.pm.PackageInstaller.STATUS_SUCCESS?"Update erfolgreich installiert.":"Update nicht installiert. Bitte erneut versuchen.");
    };
    private AlertDialog updateDialog;
    private final Runnable updateTimeout=()->{if(updateDialog!=null)cancelUpdate(updateDownloading?"Update dauert zu lange. Bitte erneut versuchen.":"Update später installieren.");};
    private Object backRegistration;
    private WatchLocation watchLocation;
    private ScrollView scroll;
    private final Map<String,Integer> readingPositions=new HashMap<>();
    private String renderedPage="";
    private int pendingReadingPosition;
    private JSONObject approach;
    private String approachMessage="";

    private int scrollRevision,scrollRestoreY=-1;
    private boolean openingPage;
    private LinearLayout root,content;
    private TextView status;
    String view="near",screen="home";
    private String favoriteView="";
    volatile boolean active=false;
    private volatile boolean fetching=false;
    private Repo.Stop detailStop;
    String journeyId="";
    int journeyVariant=0;
    int journeyBoarding;
    private boolean detailFromJourney,journeyFromRoutes,transferFromRoutes;
    private String detailMode="",detailRoute="",detailTowards="",locationMessage="",operationMessage="",settingsSection="";
    private float touchX,touchY;
    private boolean swipeConsumed,verticalGesture;
    private boolean locationDenied;
    private boolean modesFromHome,alertsFromPush,dataPausedForAlerts,moreFromRoutes;
    private final Runnable viewportRefresh=()->refresh();
    private final Runnable gatedRefresh=()->refresh();
    private final BroadcastReceiver screenState=new BroadcastReceiver(){public void onReceive(Context c,Intent intent){if(Intent.ACTION_SCREEN_OFF.equals(intent.getAction()))stopForegroundWork();else if(Intent.ACTION_SCREEN_ON.equals(intent.getAction()))startForegroundWork();}};
    private final Runnable departureTicker=new Runnable(){public void run(){if(!active)return;if(powerSaver.active&&locationScreen())startLocation(false);refresh();handler.postDelayed(this,powerSaver.departureInterval());}};
    private final Runnable renderTicker=new Runnable(){public void run(){if(!active)return;if(!screen.equals("more")&&!screen.equals("file-import")&&!screen.equals("transfer"))renderContent();handler.postDelayed(this,powerSaver.renderInterval());}};
    @Override public void onCreate(Bundle state){
        super.onCreate(state);getWindow().setStatusBarColor(BG);getWindow().setNavigationBarColor(BG);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN,WindowManager.LayoutParams.FLAG_FULLSCREEN);
        repo=new Repo(this);view=repo.prefs.getString("view","near");if(!view.equals("fav"))view="near";
        favoriteView=repo.prefs.getString("favoriteView","");if(!favoriteView.equals("routes")&&!favoriteView.equals("stations"))favoriteView="";
        powerSaver=new WatchPowerSaver(repo.prefs.getBoolean("ultraBattery",false),repo.prefs.getBoolean("ultraBatteryActive",false));
        push=new WatchPush(this,repo,network,handler,()->{if(content!=null&&screen.equals("more")&&settingsSection.startsWith("push"))refreshMore();});repo.onFavoritesChanged=push::favoritesChanged;
        if(getIntent().getBooleanExtra("foama_alerts",false)){screen="alerts";dataPausedForAlerts=true;getIntent().removeExtra("foama_alerts");}
        Updater.clearDownloadCache(this);applyShortcut(getIntent());
        IntentFilter screenFilter=new IntentFilter();screenFilter.addAction(Intent.ACTION_SCREEN_OFF);screenFilter.addAction(Intent.ACTION_SCREEN_ON);
        if(Build.VERSION.SDK_INT>=33)registerReceiver(screenState,screenFilter,Context.RECEIVER_NOT_EXPORTED);else registerReceiver(screenState,screenFilter);
        Updater.observeInstallStatus(installStatus);
        if(Build.VERSION.SDK_INT>=33)backRegistration=Api33Back.register(this);
        watchLocation=new WatchLocation((LocationManager)getSystemService(LOCATION_SERVICE),handler,getMainExecutor(),new WatchLocation.Callback(){
            public boolean onFix(Location fix){
                if(!active)return false;String beforeCity=repo.cities.current();Location before=repo.currentLocation;boolean changed=repo.acceptLocation(fix);if(!beforeCity.equals(repo.cities.current())){resetDepartureScope();if(screen.equals("detail")&&!detailFromJourney){screen="home";detailStop=null;}renderLayout();}
                if(repo.currentLocation==before)return false;
                updateLocationUi();if(changed)refresh();return true;
            }
            public void onStatus(String message){if(!active)return;locationMessage=message;updateLocationUi();}
        });
        scroll=new ScrollView(this){@Override protected void onLayout(boolean changed,int l,int t,int r,int b){super.onLayout(changed,l,t,r,b);if(scrollRestoreY>=0){super.scrollTo(0,scrollRestoreY);scrollRestoreY=-1;openingPage=false;}}};scroll.setBackgroundColor(BG);scroll.setFillViewport(true);scroll.setScrollbarFadingEnabled(true);scroll.setFocusable(true);
        scroll.setOnScrollChangeListener((v,x,y,oldX,oldY)->{handler.removeCallbacks(viewportRefresh);if(active)handler.postDelayed(viewportRefresh,120);});
        boolean small=getResources().getDisplayMetrics().widthPixels/getResources().getDisplayMetrics().density<210;
        root=vertical();root.setPadding(dp(small?16:20),dp(small?20:24),dp(small?16:20),dp(34));scroll.addView(root);setContentView(scroll);renderLayout();scroll.requestFocus();
    }
    @Override protected void onResume(){super.onResume();resumed=true;startForegroundWork();}
    private void startForegroundWork(){
        PowerManager power=(PowerManager)getSystemService(POWER_SERVICE);if(!resumed||active||(power!=null&&!power.isInteractive()))return;
        active=true;String previousCity=repo.cities.current();repo.ensureCityPosition();if(!previousCity.equals(repo.cities.current())&&screen.equals("detail")&&!detailFromJourney){screen="home";detailStop=null;renderLayout();}requests=new RequestScope();push.resume();batteryRegistered=true;Intent battery=registerReceiver(batteryReceiver,new IntentFilter(Intent.ACTION_BATTERY_CHANGED));readBattery(battery);if(locationScreen())startLocation(false);if(screen.equals("more"))refreshMore();handler.removeCallbacks(departureTicker);handler.removeCallbacks(renderTicker);handler.post(departureTicker);handler.post(renderTicker);consumePendingFile();
    }
    private void stopForegroundWork(){stopForegroundWork(true);}
    private void stopForegroundWork(boolean stopUpdate){
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if(batteryRegistered){unregisterReceiver(batteryReceiver);batteryRegistered=false;}
        boolean wasActive=active;active=false;handler.removeCallbacks(departureTicker);handler.removeCallbacks(renderTicker);handler.removeCallbacks(viewportRefresh);handler.removeCallbacks(gatedRefresh);stopLocation();requests.cancel();if(push!=null)push.pause();
        if(departureRequest!=null)departureRequest.cancel(true);fetching=false;
        if(stopUpdate)cancelUpdate(updateHandedToInstaller?"Update an Android übergeben.":"Update angehalten. Bei Bedarf erneut prüfen.");cancelFileRead();filePreview=null;
        if(wasActive)repo.pause();if(transfer!=null){closeTransfer();screen=transferFromRoutes?"routes":"more";settingsSection=transferParentSection;}
        if(!stopUpdate)setUpdateAwake(true);
    }
    @Override protected void onPause(){resumed=false;PowerManager power=(PowerManager)getSystemService(POWER_SERVICE);boolean visibleUpdate=updateDownloading&&!isFinishing()&&!isChangingConfigurations()&&(power==null||power.isInteractive());stopForegroundWork(!visibleUpdate);super.onPause();}
    @Override protected void onStop(){stopForegroundWork();super.onStop();}
    @Override protected void onDestroy(){resumed=false;stopForegroundWork();handler.removeCallbacksAndMessages(null);unregisterReceiver(screenState);Updater.removeInstallObserver(installStatus);if(Build.VERSION.SDK_INT>=33&&backRegistration!=null)Api33Back.unregister(this,backRegistration);network.shutdownNow();super.onDestroy();}
    private static final class Api33Back {
        static Object register(MainActivity app){android.window.OnBackInvokedCallback callback=app::navigateBack;app.getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,callback);return callback;}
        static void unregister(MainActivity app,Object callback){app.getOnBackInvokedDispatcher().unregisterOnBackInvokedCallback((android.window.OnBackInvokedCallback)callback);}
    }
    private int dp(float n){return Math.round(getResources().getDisplayMetrics().density*n);}
    private GradientDrawable bg(int fill,int radius){GradientDrawable b=new GradientDrawable();b.setColor(fill);b.setCornerRadius(dp(radius));b.setStroke(dp(1),BORDER);return b;}
    private GradientDrawable surface(int fill,int stroke,int radius){GradientDrawable b=bg(fill,radius);b.setStroke(stroke==Color.TRANSPARENT?0:dp(1),stroke);return b;}
    private LinearLayout vertical(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.VERTICAL);return l;}
    private LinearLayout horizontal(){LinearLayout l=new LinearLayout(this);l.setOrientation(LinearLayout.HORIZONTAL);l.setGravity(Gravity.CENTER_VERTICAL);return l;}
    private TextView text(String value,int size,int color,boolean bold){TextView t=new TextView(this);t.setText(value);t.setTextSize(size);t.setTextColor(color);t.setIncludeFontPadding(false);if(bold)t.setTypeface(null,1);return t;}
    private void space(LinearLayout parent,int height){parent.addView(new View(this),new LinearLayout.LayoutParams(1,dp(height)));}
    private Button button(String label,String style){
        Button b=new Button(this);b.setAllCaps(false);b.setText(label);b.setTextSize(12);b.setTypeface(android.graphics.Typeface.create("sans-serif-medium",0));
        if(label.equals("A nach B")){NavigationIcon icon=NavigationIcon.route(MINT);icon.setBounds(0,0,dp(17),dp(17));b.setCompoundDrawables(icon,null,null,null);b.setCompoundDrawablePadding(dp(5));}
        b.setGravity(Gravity.CENTER);b.setMinWidth(dp(48));b.setMinimumWidth(dp(48));b.setMinHeight(dp(48));b.setMinimumHeight(dp(48));b.setPadding(dp(9),dp(9),dp(9),dp(9));
        // Material's default tint/elevation must not replace our native mockup colours.
        b.setBackgroundTintList(null);b.setStateListAnimator(null);b.setElevation(0);
        int fill=style.equals("primary")?MINT:style.equals("selected")?0xff20443b:style.equals("danger")?0xff32212a:style.equals("quiet")?BG:CARD;
        int stroke=style.equals("primary")?MINT:style.equals("selected")?0xff427e68:style.equals("danger")?0xff69404d:style.equals("quiet")?Color.TRANSPARENT:BORDER;
        int ink=style.equals("primary")?0xff082b24:style.equals("selected")?0xffb8f3d6:style.equals("danger")?0xffffb6c0:style.equals("quiet")?MUTED:WHITE;
        StateListDrawable states=new StateListDrawable();
        if(style.equals("tab"))states.addState(new int[]{android.R.attr.state_selected},surface(0xff20443b,0xff427e68,24));
        states.addState(new int[]{android.R.attr.state_focused},surface(fill,MINT,24));
        states.addState(new int[]{},surface(fill,stroke,24));
        b.setBackground(new RippleDrawable(ColorStateList.valueOf(0x4873e0b7),states,null));
        b.setSelected(style.equals("selected"));
        b.setTextColor(style.equals("tab")?new ColorStateList(new int[][]{new int[]{android.R.attr.state_selected},new int[]{}},new int[]{0xffb8f3d6,MUTED}):ColorStateList.valueOf(ink));
        return b;
    }
    private void fullButton(LinearLayout parent,String label,Runnable action){fullButton(parent,label,"secondary",action);}
    private void fullButton(LinearLayout parent,String label,String style,Runnable action){Button b=button(label,style);parent.addView(b,new LinearLayout.LayoutParams(-1,-2));b.setOnClickListener(v->action.run());space(parent,7);}
    private TextView centered(LinearLayout parent,String value,int size,int color,boolean bold){TextView t=text(value,size,color,bold);t.setGravity(Gravity.CENTER);parent.addView(t,new LinearLayout.LayoutParams(-1,-2));return t;}
    private void menuRow(String title,String value,String mark,Runnable action){
        LinearLayout row=horizontal();row.setPadding(dp(10),dp(10),dp(10),dp(10));row.setBackground(new RippleDrawable(ColorStateList.valueOf(0x4073e0b7),bg(CARD,18),null));
        TextView icon=text(mark,19,MINT,true);icon.setGravity(Gravity.CENTER);row.addView(icon,new LinearLayout.LayoutParams(dp(26),-2));
        LinearLayout words=vertical();words.addView(text(title,14,WHITE,true));if(!value.isEmpty()){space(words,3);words.addView(text(value,12,MUTED,false));}
        LinearLayout.LayoutParams labels=new LinearLayout.LayoutParams(0,-2,1);labels.setMarginStart(dp(7));row.addView(words,labels);
        TextView arrow=text("›",21,MUTED,false);arrow.setGravity(Gravity.END);row.addView(arrow,new LinearLayout.LayoutParams(dp(15),-2));
        content.addView(row,new LinearLayout.LayoutParams(-1,-2));actionable(row,title+", "+value,action);space(content,7);
    }
    private LinearLayout card(LinearLayout parent){LinearLayout c=vertical();c.setPadding(dp(12),dp(10),dp(12),dp(10));c.setBackground(bg(CARD,18));LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.bottomMargin=dp(8);parent.addView(c,p);return c;}
    private TextView badge(String route,String mode,boolean confirmed){TextView b=text(route,14,confirmed?WHITE:MUTED,true);b.setGravity(Gravity.CENTER);b.setPadding(dp(7),dp(5),dp(7),dp(5));b.setMinWidth(dp(40));b.setBackground(surface(confirmed?WearPolicy.lineColor(route,mode):CARD,confirmed?Color.TRANSPARENT:BORDER,6));b.setContentDescription("Linie "+route+(confirmed?"":" · keine aktuelle Abfahrt bestätigt"));return b;}
    private void actionable(View v,String description,Runnable action){v.setMinimumHeight(dp(48));v.setClickable(true);v.setFocusable(true);v.setContentDescription(description);v.setOnClickListener(x->action.run());}
    private LinearLayout homeTab(String name,String label,boolean star){
        boolean selected=name.equals("routes")?screen.equals("routes"):screen.equals("home")&&view.equals(name);LinearLayout tab=vertical();tab.setGravity(Gravity.CENTER);tab.setPadding(0,0,0,0);tab.setSelected(selected);
        tab.setBackground(new InsetDrawable(new RippleDrawable(ColorStateList.valueOf(0x4873e0b7),surface(selected?0xff20443b:Color.TRANSPARENT,selected?0xff427e68:Color.TRANSPARENT,18),null),0,dp(6),0,dp(6)));
        ImageView icon=new ImageView(this);icon.setImageDrawable(name.equals("routes")?NavigationIcon.route(selected?MINT:MUTED):new NavigationIcon(star,selected,selected?MINT:MUTED));icon.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);tab.addView(icon,new LinearLayout.LayoutParams(dp(14),dp(14)));
        WatchLayout layout=WatchLayout.of(getResources());
        String visibleLabel=name.equals("fav")&&layout.largeText?"Favor.":name.equals("routes")&&(layout.largeText||layout.width<210)?"A → B":label;
        TextView title=text(visibleLabel,12,selected?0xffb8f3d6:MUTED,true);title.setGravity(Gravity.CENTER);title.setMaxLines(2);title.setHorizontallyScrolling(false);
        LinearLayout.LayoutParams words=new LinearLayout.LayoutParams(-1,-2);words.topMargin=dp(2);tab.addView(title,words);
        actionable(tab,name.equals("near")?"In der Nähe":label,()->{if(name.equals("routes"))openRoutes();else changeView(name);});
        tab.setAccessibilityDelegate(new View.AccessibilityDelegate(){public void onInitializeAccessibilityNodeInfo(View host,android.view.accessibility.AccessibilityNodeInfo info){super.onInitializeAccessibilityNodeInfo(host,info);info.setClassName(Button.class.getName());info.setSelected(host.isSelected());}});
        return tab;
    }
    private boolean compactFavoriteControls(){return screen.equals("home")&&view.equals("fav")&&!(powerSaver.percent>=0&&powerSaver.percent<20&&!powerSaver.enabled);}
    private void tightenFavoriteHeading(View heading){
        // The non-interactive heading can use the filter's empty lower padding.
        // Station and route actions still start below its full 48dp touch area.
        if(!compactFavoriteControls())return;
        LinearLayout.LayoutParams params=(LinearLayout.LayoutParams)heading.getLayoutParams();params.topMargin=0;heading.setLayoutParams(params);
    }
    private LinearLayout transportShortcut(){
        LinearLayout target=vertical();target.setGravity(compactFavoriteControls()?Gravity.TOP|Gravity.CENTER_HORIZONTAL:Gravity.CENTER);target.setPadding(dp(4),dp(3),dp(4),dp(3));
        target.setBackground(new RippleDrawable(ColorStateList.valueOf(0x4073e0b7),surface(BG,Color.TRANSPARENT,14),null));
        LinearLayout row=horizontal();row.setGravity(Gravity.CENTER);row.setPadding(dp(8),0,dp(8),0);
        ArrayList<String> enabled=new ArrayList<>();
        for(int i=0;i<WearPolicy.MODES.length;i++)if(repo.modeAllowed(WearPolicy.MODES[i]))enabled.add(WearPolicy.MODE_LABELS[i]);
        int available=getResources().getDisplayMetrics().widthPixels-root.getPaddingLeft()-root.getPaddingRight()-dp(34);
        if(screen.equals("home")&&view.equals("near"))available-=dp(48);
        int iconSize=Math.min(dp(18),Math.max(dp(10),available/Math.max(1,enabled.size())-dp(3)));
        for(int i=0;i<WearPolicy.MODES.length;i++)if(repo.modeAllowed(WearPolicy.MODES[i])){
            ImageView icon=new ImageView(this);icon.setImageDrawable(new TransportIcon(WearPolicy.MODES[i],MINT));icon.setContentDescription(WearPolicy.MODE_LABELS[i]);icon.setImportantForAccessibility(View.IMPORTANT_FOR_ACCESSIBILITY_NO);
            LinearLayout.LayoutParams item=new LinearLayout.LayoutParams(iconSize,iconSize);item.setMarginEnd(dp(3));row.addView(icon,item);
        }
        if(enabled.isEmpty()){TextView empty=text("Keine Verkehrsmittel",12,MUTED,false);empty.setMaxLines(1);empty.setEllipsize(TextUtils.TruncateAt.END);row.addView(empty,new LinearLayout.LayoutParams(0,-2,1));}
        row.addView(text("›",18,MUTED,false),new LinearLayout.LayoutParams(dp(10),-2));target.addView(row,new LinearLayout.LayoutParams(-1,-2));
        actionable(target,"Verkehrsmittel für In der Nähe: "+(enabled.isEmpty()?"keine aktiviert":String.join(", ",enabled))+". Einstellungen öffnen",()->{modesFromHome=true;screen="more";settingsSection="modes";renderLayout();});
        target.setTag("transport-shortcut");target.setAccessibilityDelegate(new View.AccessibilityDelegate(){public void onInitializeAccessibilityNodeInfo(View host,android.view.accessibility.AccessibilityNodeInfo info){super.onInitializeAccessibilityNodeInfo(host,info);info.setClassName(Button.class.getName());}});
        if(screen.equals("home")&&view.equals("near")){LinearLayout tools=horizontal();tools.addView(target,new LinearLayout.LayoutParams(0,-2,1));Button mapButton=button("Karte","quiet");tools.addView(mapButton,new LinearLayout.LayoutParams(dp(48),-2));mapButton.setOnClickListener(v->openMap(null));content.addView(tools,new LinearLayout.LayoutParams(-1,-2));}else content.addView(target,new LinearLayout.LayoutParams(-1,-2));space(content,1);return target;
    }
    private void stationHeading(LinearLayout parent,Repo.Stop stop){
        LinearLayout row=horizontal();row.setPadding(dp(6),0,dp(6),0);row.setTag(at.andrew.foamawien.R.id.station_id,stop.id);
        TextView name=text(stop.name,14,WHITE,true);row.addView(name,new LinearLayout.LayoutParams(0,-2,1));
        String walking=repo.reliableLocation()?Math.max(1,(int)Math.ceil(repo.walkMinutes(stop)))+"′":"?";
        TextView walk=text("↗ "+walking,12,MUTED,false);LinearLayout.LayoutParams right=new LinearLayout.LayoutParams(-2,-2);right.setMarginStart(dp(4));if(!WatchLayout.of(getResources()).stacked)row.addView(walk,right);
        walk.setContentDescription(repo.reliableLocation()?"Geschätzter Fußweg: "+Math.max(1,(int)Math.ceil(repo.walkMinutes(stop)))+" Minuten":"Gehzeit ungewiss");
        parent.addView(row,new LinearLayout.LayoutParams(-1,-2));space(parent,2);
    }
    private LinearLayout stationPanel(Repo.Stop stop,boolean favoriteView){
        LinearLayout panel=card(content);panel.setPadding(dp(2),dp(3),dp(2),dp(4));panel.setTag((favoriteView?"favorite-station:":"near-station:")+stop.id);panel.setTag(at.andrew.foamawien.R.id.station_id,stop.id);
        stationHeading(panel,stop);return panel;
    }
    private void renderLayout(){
        String next=pageKey();
        if(scroll!=null&&!renderedPage.isEmpty())readingPositions.put(renderedPage,scroll.getScrollY());
        pendingReadingPosition=readingPositions.getOrDefault(next,0);renderedPage=next;
        openingPage=true;scrollRevision++;
        root.removeAllViews();
        int width=Math.round(getResources().getDisplayMetrics().widthPixels/getResources().getDisplayMetrics().density);
        boolean mainScreen=screen.equals("home")||screen.equals("routes");
        WatchLayout layout=WatchLayout.of(getResources());
        root.setPadding(dp(layout.padding),dp(mainScreen?10:screen.equals("transfer")?Math.round((width-Math.min(156,Math.round(width*.69f)))/2f):width<210?16:24),dp(layout.padding),dp(34));
        if(mainScreen){
            // The title uses the round cap and the navigation's empty upper
            // inset, so its text does not add another full row above departures.
            FrameLayout header=new FrameLayout(this);
            TextView brand=text(CityProfiles.name(repo.cities.current()),12,MUTED,true);brand.setGravity(Gravity.CENTER);brand.setTag("main-title");brand.setSingleLine(true);brand.setHorizontallyScrolling(false);brand.setAccessibilityHeading(true);
            header.addView(brand,new FrameLayout.LayoutParams(-1,-2,Gravity.TOP|Gravity.CENTER_HORIZONTAL));
            LinearLayout tabs=horizontal();tabs.setTag("main-navigation");tabs.setBackground(new InsetDrawable(surface(0xff09141d,BORDER,19),0,dp(6),0,dp(6)));
            for(String name:new String[]{"near","fav","routes"})tabs.addView(homeTab(name,name.equals("near")?"Nähe":name.equals("fav")?"Favoriten":"A nach B",name.equals("fav")),new LinearLayout.LayoutParams(0,dp(layout.tabHeight),1));
            header.addView(tabs,new FrameLayout.LayoutParams(Math.min(dp(210),getResources().getDisplayMetrics().widthPixels-root.getPaddingLeft()-root.getPaddingRight()),dp(layout.tabHeight),Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL));
            float extraTitleSpace=Math.max(0,getResources().getConfiguration().fontScale-1)*14;
            root.addView(header,new LinearLayout.LayoutParams(-1,dp(layout.tabHeight+8+extraTitleSpace)));
        }
        status=text("",12,AMBER,false);status.setGravity(Gravity.CENTER);status.setPadding(0,0,0,dp(7));root.addView(status);
        content=vertical();root.addView(content);renderContent();
        if(screen.equals("home")||screen.equals("routes")){space(root,5);fullButton(root,"Mehr",()->openMore());}
        restoreScroll(pendingReadingPosition);
    }
    private String pageKey(){return screen+"|"+(screen.equals("home")?view+"|"+favoriteView:screen.equals("detail")||screen.equals("approach")?(detailStop==null?"":detailStop.id)+"|"+detailRoute+"|"+detailTowards:screen.equals("journey")?journeyId+"|"+journeyVariant+"|"+journeyBoarding:screen.equals("more")?settingsSection:"");}
    void changeView(String name){boolean fromRoutes=screen.equals("routes");if(fromRoutes||!view.equals(name))resetDepartureScope();view=name;screen="home";repo.prefs.edit().putString("view",name).apply();renderLayout();if(fromRoutes&&active)startLocation(false);refresh();}
    private boolean favoriteRoutes(){return favoriteView.equals("routes")||favoriteView.isEmpty()&&repo.cityJourneys().length()>0;}
    private void changeFavoriteView(String name){
        if((!name.equals("routes")&&!name.equals("stations"))||name.equals(favoriteView))return;
        favoriteView=name;repo.prefs.edit().putString("favoriteView",name).apply();resetDepartureScope();renderLayout();refresh();
    }
    private void favoriteSwitcher(){
        LinearLayout row=horizontal();row.setTag("favorite-switch");
        row.setBackground(new InsetDrawable(surface(0xff09141d,BORDER,16),0,dp(10),0,dp(6)));
        row.setPadding(0,0,0,0);
        for(String name:new String[]{"routes","stations"}){
            boolean selected=favoriteRoutes()==name.equals("routes");Button tab=button(name.equals("routes")?"Routen":"Stationen",selected?"selected":"secondary");
            tab.setIncludeFontPadding(false);tab.setSingleLine(true);tab.setHorizontallyScrolling(false);
            StateListDrawable states=new StateListDrawable();
            int fill=selected?0xff20443b:Color.TRANSPARENT;
            states.addState(new int[]{android.R.attr.state_focused},surface(fill,MINT,14));
            states.addState(new int[]{},surface(fill,selected?0xff427e68:Color.TRANSPARENT,14));
            tab.setBackground(new InsetDrawable(new RippleDrawable(ColorStateList.valueOf(0x4873e0b7),states,null),dp(2),dp(10),dp(2),dp(6)));
            tab.setPadding(dp(4),dp(4),dp(4),0);
            tab.setContentDescription(name.equals("routes")?"Gespeicherte Routen":"Haltestellen & Linien");tab.setOnClickListener(v->changeFavoriteView(name));
            row.addView(tab,new LinearLayout.LayoutParams(0,dp(48),1));
        }
        LinearLayout.LayoutParams compact=new LinearLayout.LayoutParams(Math.min(dp(176),getResources().getDisplayMetrics().widthPixels-root.getPaddingLeft()-root.getPaddingRight()),dp(48));compact.gravity=Gravity.CENTER_HORIZONTAL;
        content.addView(row,compact);space(content,1);
    }
    void openConnection(Repo.Stop stop,String route,String towards){openConnection(stop,route,towards,"");}
    void openConnection(Repo.Stop stop,String route,String towards,String mode){detailMode=mode;if(screen.equals("journey")){detailFromJourney=true;resetDepartureScope();}else if(screen.equals("home"))detailFromJourney=false;detailStop=stop;detailRoute=route;detailTowards=towards;screen="detail";renderLayout();refresh();}
    private void resetDepartureScope(){handler.removeCallbacks(gatedRefresh);requests.cancel();if(departureRequest!=null)departureRequest.cancel(true);requests=new RequestScope();fetching=false;}
    void openJourney(String id){if(repo.journeys.get(id)==null)return;if(screen.equals("home")||screen.equals("routes"))journeyFromRoutes=screen.equals("routes");resetDepartureScope();journeyId=id;journeyBoarding=0;journeyVariant=0;screen="journey";renderLayout();refresh();}
    void openRoutes(){stopLocation();resetDepartureScope();screen="routes";operationMessage="";renderLayout();refresh();}
    @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);if(intent.getBooleanExtra("foama_alerts",false)){alertsFromPush=false;getIntent().removeExtra("foama_alerts");openAlerts();}else{applyShortcut(intent);renderLayout();refresh();}}
    private void applyShortcut(Intent intent){
        String shortcut=intent.getStringExtra("foama_shortcut");if(shortcut!=null){screen="home";view=shortcut.equals("fav")?"fav":"near";intent.removeExtra("foama_shortcut");}
        Repo.Stop stop=repo.findStop(intent.getStringExtra("foama_stop"));if(stop!=null){screen="detail";detailStop=stop;detailRoute=intent.getStringExtra("foama_route");if(detailRoute==null)detailRoute="";detailTowards="";detailMode="";intent.removeExtra("foama_stop");}
    }
    private void openAlerts(){dataPausedForAlerts=true;if(transfer!=null)closeTransfer();stopLocation();requests.cancel();if(departureRequest!=null)departureRequest.cancel(true);fetching=false;requests=new RequestScope();screen="alerts";renderLayout();}
    private void openMore(){moreFromRoutes=screen.equals("routes");modesFromHome=false;screen="more";settingsSection="";renderLayout();}
    private List<Repo.Stop> targets(){
        if(screen.equals("journey-options"))return journeyOptionTargets();if(screen.equals("journey"))return journeyTargets();
        if((screen.equals("detail")||screen.equals("approach"))&&detailStop!=null)return Collections.singletonList(detailStop);
        if(screen.equals("home")&&view.equals("fav")&&!favoriteRoutes())return new ArrayList<>(repo.favoriteStops());
        if(screen.equals("routes")||view.equals("fav")){ArrayList<Repo.Stop> out=new ArrayList<>();JSONArray journeys=repo.cityJourneys();for(int i=0;i<journeys.length();i++){List<JSONObject> legs=JourneyStore.boardings(journeys.optJSONObject(i));if(!legs.isEmpty()){Repo.Stop stop=repo.findStop(legs.get(0).optJSONObject("from").optString("stopId"));if(stop!=null&&!out.contains(stop))out.add(stop);}}return out;}ArrayList<Repo.Stop> near=repo.nearby();return new ArrayList<>(near.subList(0,Math.min(12,near.size())));
    }
    private void refresh(){
        handler.removeCallbacks(gatedRefresh);
        if(!active||fetching||screen.equals("more")||screen.equals("transfer")||screen.equals("file-import")||screen.equals("alerts"))return;
        repo.syncDepartureCity();long readyAt=repo.nextFetchElapsed;
        if(powerSaver.active&&lastDepartureAttempt>=0)readyAt=Math.max(readyAt,lastDepartureAttempt+powerSaver.departureInterval());
        long wait=readyAt-SystemClock.elapsedRealtime();if(wait>0){handler.postDelayed(gatedRefresh,wait);return;}
        if(screen.equals("approach")){refreshApproach();return;}
        List<Repo.Stop> stops=new ArrayList<>(targets());Set<String> visible=StationViewport.visible(content,scroll,dp(8));List<Repo.Stop> regional=repo.regionalRequestStops(stops,visible);List<String> ids=repo.requestIds(stops,view.equals("fav")||screen.equals("routes")||screen.equals("detail")||screen.equals("journey")||screen.equals("journey-options"),visible);if(ids.isEmpty()&&regional.isEmpty())return;
        RequestScope session=requests;fetching=true;lastDepartureAttempt=SystemClock.elapsedRealtime();renderContent();departureRequest=network.submit(()->{
            try{if(!session.isCancelled())repo.fetchDepartures(stops,ids,regional,session);}catch(Exception ignored){}finally{runOnUiThread(()->{if(requests==session&&!session.isCancelled()){fetching=false;if(active&&!isFinishing())renderContent();}});}
        });
    }
    void renderContent(){
        TextView cityTitle=root==null?null:root.findViewWithTag("main-title");if(cityTitle!=null)cityTitle.setText(CityProfiles.name(repo.cities.current()));
        if(screen.equals("transfer")){content.removeAllViews();renderTransfer();return;}
        if(content==null)return;
        if(screen.equals("file-import")){content.removeAllViews();renderFileImport();return;}
        if(screen.equals("more")){if(content.getChildCount()==0)renderMore();return;}
        int y=scroll.getScrollY();content.removeAllViews();
        String currentError=repo.currentError(targets());
        if(!currentError.isEmpty())status.setText(currentError+" · gespeicherter Stand");
        else if(repo.currentLocation!=null&&!repo.reliableLocation())status.setText(locationMessage.isEmpty()?screen.equals("home")&&view.equals("fav")?"":repo.manualLocation?"Stadtmitte · Gehzeit ungewiss":repo.locationStatus()+" · Gehzeit ungewiss":locationMessage);
        else status.setText("");
        status.setVisibility(status.getText().length()==0?View.GONE:View.VISIBLE);
        if(!batteryMessage.isEmpty()){status.setText(status.getText().length()==0?batteryMessage:status.getText()+"\n"+batteryMessage);status.setVisibility(View.VISIBLE);}
        if(screen.equals("home")){if(view.equals("fav"))favoriteSwitcher();else transportShortcut();if(powerSaver.percent>=0&&powerSaver.percent<20&&!powerSaver.enabled)fullButton(content,"Akku sparen?",()->{screen="more";section("battery");renderLayout();});}
        if(screen.equals("approach"))renderApproach();else if(screen.equals("routes"))renderRoutes();else if(screen.equals("alerts"))renderAlerts();else if(screen.equals("journey-options"))renderJourneyOptions();else if(screen.equals("journey"))renderJourney();else if(screen.equals("detail"))renderDetail();else if(view.equals("fav"))renderFavorites();else renderNear();
        restoreScroll(openingPage?pendingReadingPosition:y);
    }
    private void restoreScroll(int y){int revision=++scrollRevision;scrollRestoreY=y;scroll.requestLayout();scroll.post(()->{if(revision!=scrollRevision||scroll.isLayoutRequested())return;scroll.scrollTo(0,y);scrollRestoreY=-1;openingPage=false;});}
    private LinearLayout placeholder(String heading,String explanation){LinearLayout c=card(content);c.addView(text(heading,16,WHITE,true));space(c,6);c.addView(text(explanation,12,MUTED,false));return c;}
    private void renderNear(){
        if(repo.currentLocation==null){
            space(content,5);centered(content,"Was fährt in der Nähe?",17,WHITE,true);space(content,8);
            centered(content,locationMessage.isEmpty()?"Erlaube den Standort auf deiner Uhr. Favoriten funktionieren auch ohne Ortung.":locationMessage,12,MUTED,false);space(content,13);
            fullButton(content,hasLocationPermission()?"Erneut versuchen":"Standort aktivieren","primary",()->startLocation(true));
            if(hasLocationPermission()||locationDenied)fullButton(content,hasLocationPermission()?"Standorteinstellungen":"App-Freigabe öffnen","quiet",()->openLocationSettings());return;
        }
        List<Repo.Stop> list=repo.nearby();if(list.isEmpty()){placeholder("Keine passende Station","Suchradius oder Verkehrsmittel anpassen.");return;}
        for(Repo.Stop s:list.subList(0,Math.min(6,list.size()))){
            LinearLayout panel=stationPanel(s,false);
            List<List<Repo.Departure>> groups=repo.connections(s,"","",false);
            if(groups.isEmpty()){
                LinearLayout c=vertical();c.setPadding(dp(6),dp(8),dp(6),dp(8));panel.addView(c,new LinearLayout.LayoutParams(-1,-2));ArrayList<String> routes=new ArrayList<>();for(String route:s.routes)if(repo.modeAllowed(s.routeModes.get(route)))routes.add(route);c.addView(text(String.join(" · ",routes),14,MUTED,true));space(c,5);c.addView(text(fetching?"Abfahrten laden …":"Keine aktuelle Abfahrt bestätigt",12,MUTED,false));actionable(c,"Abfahrten "+s.name,()->openConnection(s,"",""));
            }else for(List<Repo.Departure> g:groups)connectionCard(panel,s,g,true,null);
        }
    }
    private void connectionCard(Repo.Stop s,List<Repo.Departure> group,boolean showStation){
        connectionCard(content,s,group,false,null);
    }
    private void connectionCard(LinearLayout parent,Repo.Stop s,List<Repo.Departure> group,boolean grouped,Repo.Favorite favorite){
        if(WatchLayout.of(getResources()).stacked){stackedConnection(parent,s,group,grouped,favorite);return;}
        Repo.Departure d=group.get(0);LinearLayout row=horizontal();row.setTag(at.andrew.foamawien.R.id.station_id,s.id);row.setPadding(dp(6),dp(8),dp(6),dp(8));
        row.setBackground(new RippleDrawable(ColorStateList.valueOf(0x4073e0b7),bg(CARD,18),null));
        TextView route=badge(d.route,d.mode,repo.fresh(d));route.setTextSize(12);route.setMinWidth(dp(26));route.setPadding(dp(3),dp(5),dp(3),dp(5));row.addView(route,new LinearLayout.LayoutParams(dp(d.route.length()>3?36:26),-2));
        LinearLayout words=vertical();TextView direction=text(d.towards,12,WHITE,!grouped);direction.setMaxLines(2);direction.setEllipsize(TextUtils.TruncateAt.END);words.addView(direction);
        String reach=repo.feasibility(s,d);int reachColor=reach.contains("Ungewiss")?MUTED:reach.contains("Kaum")?0xffffa39f:reach.contains("Knapp")?AMBER:MINT;
        space(words,3);words.addView(text(reach,12,reachColor,false));
        if(d.notice){space(words,3);words.addView(text("⚠ Hinweis",12,AMBER,false));}
        LinearLayout.LayoutParams middle=new LinearLayout.LayoutParams(0,-2,1);middle.setMarginStart(dp(4));middle.setMarginEnd(dp(4));row.addView(words,middle);
        String mainTime=(repo.fresh(d)?"":"~")+repo.countdown(d)+"′";
        boolean smallRound=false;
        int timeGravity=smallRound?Gravity.CENTER_HORIZONTAL:Gravity.END;
        LinearLayout times=vertical();if(smallRound)times.setPadding(0,0,dp(16),0);TextView first=text(mainTime,mainTime.length()>4?20:mainTime.length()>3?24:28,WHITE,true);first.setGravity(timeGravity);times.addView(first,new LinearLayout.LayoutParams(-1,-2));
        if(group.size()>1){TextView second=text("→ "+repo.countdown(group.get(1))+"′",12,MUTED,false);second.setGravity(timeGravity);times.addView(second,new LinearLayout.LayoutParams(-1,-2));}
        TextView quality=text(repo.quality(d),12,repo.fresh(d)?MUTED:AMBER,false);quality.setGravity(timeGravity);times.addView(quality,new LinearLayout.LayoutParams(-1,-2));row.addView(times,new LinearLayout.LayoutParams(dp(smallRound?64:50),-2));
        parent.addView(row,new LinearLayout.LayoutParams(-1,-2));space(parent,grouped?2:7);
        actionable(row,s.name+", "+d.route+" Richtung "+d.towards+", "+repo.countdown(d)+" Minuten, "+repo.quality(d)+", "+reach+(group.size()>1?", danach "+repo.countdown(group.get(1))+" Minuten":""),()->openConnection(s,favorite==null?d.route:favorite.route,favorite==null?d.towards:favorite.towards,d.mode));
    }
    private void stackedConnection(LinearLayout parent,Repo.Stop stop,List<Repo.Departure> group,boolean grouped,Repo.Favorite favorite){
        Repo.Departure d=group.get(0);LinearLayout panel=vertical();panel.setPadding(dp(8),dp(7),dp(8),dp(8));panel.setTag(at.andrew.foamawien.R.id.station_id,stop.id);panel.setBackground(new RippleDrawable(ColorStateList.valueOf(0x4073e0b7),bg(CARD,18),null));
        LinearLayout heading=horizontal();heading.addView(badge(d.route,d.mode,repo.fresh(d)));TextView minutes=text((repo.fresh(d)?"":"~")+repo.countdown(d)+"′",30,WHITE,true);minutes.setGravity(Gravity.CENTER);minutes.setPadding(0,0,dp(12),0);heading.addView(minutes,new LinearLayout.LayoutParams(0,-2,1));panel.addView(heading);
        space(panel,3);TextView direction=text(d.towards,14,WHITE,true);direction.setMaxLines(3);direction.setEllipsize(TextUtils.TruncateAt.END);panel.addView(direction);
        space(panel,4);String reach=repo.feasibility(stop,d);panel.addView(text((repo.reliableLocation()?"↗ "+Math.max(1,(int)Math.ceil(repo.walkMinutes(stop)))+"′ · ":"")+reach,12,reach.contains("Knapp")?AMBER:reach.contains("Kaum")?0xffffa39f:reach.contains("Ungewiss")?MUTED:MINT,false));
        space(panel,3);panel.addView(text(repo.quality(d)+(group.size()>1?" · danach "+repo.countdown(group.get(1))+"′":"")+(d.notice?" · ⚠ Hinweis":""),12,d.notice?AMBER:MUTED,false));
        parent.addView(panel,new LinearLayout.LayoutParams(-1,-2));space(parent,grouped?3:7);
        actionable(panel,stop.name+", "+d.route+" Richtung "+d.towards+", "+repo.countdown(d)+" Minuten, "+reach+", "+repo.quality(d),()->openConnection(stop,favorite==null?d.route:favorite.route,favorite==null?d.towards:favorite.towards,d.mode));
    }
    private void openMap(Repo.Stop stop){
        Intent intent=new Intent(this,MapActivity.class);if(stop!=null)intent.putExtra("stop",stop.id);
        if(repo.currentLocation!=null&&!repo.manualLocation)intent.putExtra("fix",new Location(repo.currentLocation));startActivity(intent);
    }
    void openApproach(String mode){
        if(detailStop==null||detailRoute.isEmpty()||detailTowards.isEmpty())return;
        resetDepartureScope();detailMode=mode;approach=null;approachMessage="";screen="approach";renderLayout();refresh();
    }
    private void refreshApproach(){
        if(detailStop==null||approach!=null&&!approach.optBoolean("available"))return;
        RequestScope session=requests;Repo.Stop stop=detailStop;String route=detailRoute,towards=detailTowards,mode=detailMode;
        fetching=true;lastDepartureAttempt=SystemClock.elapsedRealtime();renderContent();
        departureRequest=network.submit(()->{
            JSONObject result=null;String message="";
            try{result=repo.fetchApproach(stop,route,towards,mode,session);}catch(Exception e){if(!session.isCancelled())message="Stationsdaten nicht erreichbar. Abfahrten bleiben verfügbar.";}
            final JSONObject response=result;final String problem=message;
            runOnUiThread(()->{if(requests!=session||session.isCancelled()||!active||!screen.equals("approach"))return;fetching=false;if(response!=null)approach=response;approachMessage=problem;renderContent();handler.removeCallbacks(gatedRefresh);handler.postDelayed(gatedRefresh,Math.max(1000,repo.nextFetchElapsed-SystemClock.elapsedRealtime()));});
        });
    }
    private void renderApproach(){
        if(detailStop==null)return;
        centered(content,detailRoute+" · "+detailTowards,15,WHITE,true);space(content,4);centered(content,detailStop.name,13,MUTED,false);
        long now=System.currentTimeMillis(),source=approach==null?0:approach.optLong("at"),arrival=approach==null?0:approach.optLong("arrivalAt");
        boolean fresh=source>0&&now-source<=60000&&source<=now+30000&&approachMessage.isEmpty();
        List<List<Repo.Departure>> groups=repo.connections(detailStop,detailRoute,detailTowards,true,detailMode);Repo.Departure first=groups.isEmpty()?null:groups.get(0).get(0);
        String minutes=fresh&&arrival>0?Math.max(0,(int)Math.ceil((arrival-now)/60000.0))+"′":first==null?"—":(repo.fresh(first)?"":"~")+repo.countdown(first)+"′";
        centered(content,minutes,48,WHITE,true);centered(content,fresh&&arrival>0?"Ankunft · ca.":first==null?"Keine aktuelle Prognose":"Abfahrt · "+repo.quality(first),12,MUTED,false);space(content,8);
        if(approach!=null&&approach.optBoolean("available")){ApproachView diagram=new ApproachView(this,approach,WatchLayout.of(getResources()).stopsBefore);content.addView(diagram,new LinearLayout.LayoutParams(-1,dp(108)));space(content,7);}
        String message=!approachMessage.isEmpty()?approachMessage:approach==null?"Stationsdaten laden …":!fresh&&source>0?"Älterer Stand · warte auf Stationsdaten.":approach.optString("status");centered(content,message,12,message.contains("Älter")?AMBER:MINT,false);
        if(approach==null||approach.optBoolean("available")&&approach.optJSONArray("tracks").length()==0){
            space(content,5);ProgressBar progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);progress.setIndeterminate(false);progress.setMax(2);progress.setProgress(source>0?1:0);progress.setProgressTintList(ColorStateList.valueOf(MINT));content.addView(progress,new LinearLayout.LayoutParams(-1,dp(8)));
            long next=Math.max(0,(repo.nextFetchElapsed-SystemClock.elapsedRealtime()+999)/1000);space(content,5);centered(content,fetching?"Stationsabgleich läuft …":"Nächster Abgleich in "+next+" s",12,MUTED,false);
        }
        space(content,7);centered(content,"Position geschätzt · keine GPS-Ortung der Fahrzeuge",12,MUTED,false);space(content,8);fullButton(content,"Zurück zu Abfahrten","quiet",this::navigateBack);
    }
    private void renderFavorites(){
        if(favoriteRoutes()){
            if(repo.cityJourneys().length()==0)tightenFavoriteHeading(placeholder(repo.journeys.all().length()==0?"Noch keine Routen":"Noch keine Routen in "+CityProfiles.name(repo.cities.current()),"Am Handy planen und als Routenfavorit speichern. Unter Mehr → Favoriten → Aus PWA importieren auf diese Uhr übernehmen."));
            else renderJourneyCards();
            return;
        }
        TextView stationSection=centered(content,"Haltestellen & Linien",14,MINT,true);if(!repo.orderedFavorites().isEmpty())stationSection.setVisibility(View.GONE);else space(content,7);
        if(repo.orderedFavorites().isEmpty()){placeholder(repo.favorites.isEmpty()?"Deine wichtigsten Wege":"Noch keine Favoriten in "+CityProfiles.name(repo.cities.current()),"Verbindung in der Nähe öffnen und im Detail als Favorit speichern. Haltestellen und Linien kannst du auch unter Mehr → Favoriten → Aus PWA importieren übernehmen.");return;}
        for(Map.Entry<String,List<Repo.Favorite>> entry:repo.favoriteGroups().entrySet()){
            Repo.Stop s=repo.findStop(entry.getKey());if(s==null)continue;
            LinearLayout panel=stationPanel(s,true);
            LinkedHashSet<String> rendered=new LinkedHashSet<>();Repo.Favorite whole=null;
            for(Repo.Favorite favorite:entry.getValue()){
                if(favorite.route.isEmpty()){whole=favorite;continue;}
                List<List<Repo.Departure>> groups=repo.connections(s,favorite.route,favorite.towards,true,favorite.mode);
                if(groups.isEmpty()){
                    LinearLayout empty=vertical();empty.setPadding(dp(6),dp(5),dp(6),dp(5));empty.addView(text(favorite.route+" → "+(favorite.towards.isEmpty()?"Alle Richtungen":favorite.towards),12,MUTED,false));space(empty,3);empty.addView(text(fetching?"Abfahrten laden …":"Keine aktuellen Abfahrten",12,MUTED,false));panel.addView(empty,new LinearLayout.LayoutParams(-1,-2));
                    actionable(empty,s.name+", gespeicherte Verbindung "+favorite.route+" öffnen",()->openConnection(s,favorite.route,favorite.towards,favorite.mode));
                }
                for(List<Repo.Departure> group:groups){Repo.Departure d=group.get(0);if(rendered.add(d.mode+"|"+d.route+"|"+d.towards))connectionCard(panel,s,group,true,favorite);}
            }
            if(whole!=null){
                for(List<Repo.Departure> group:repo.connections(s,"","",true)){Repo.Departure d=group.get(0);if(rendered.add(d.mode+"|"+d.route+"|"+d.towards))connectionCard(panel,s,group,true,null);}
                if(rendered.isEmpty()&&entry.getValue().size()==1){centered(panel,fetching?"Abfahrten laden …":"Keine aktuellen Abfahrten",12,MUTED,false);}
                fullButton(panel,"Ganze Haltestelle","quiet",()->openConnection(s,"",""));
            }
        }
    }
    private void favoriteAction(Repo.Stop stop,String route,String towards){
        String mode=route.isEmpty()?"":detailMode;boolean saved=repo.hasFavorite(stop,route,towards,mode);
        fullButton(content,saved?"Favorit entfernen":"☆ Als Favorit speichern",saved?"danger":"primary",()->{repo.toggleFavorite(stop,route,towards,mode);renderContent();});
    }
    private JSONObject currentJourney(){return JourneyStore.variant(repo.journeys.get(journeyId),journeyVariant);}
    private int optionBranch(JSONObject bundle,int index){JSONObject option=JourneyStore.variant(bundle,index);int common=JourneyStore.commonBoardings(currentJourney(),option);if(index==journeyVariant){common=Integer.MAX_VALUE;for(int j=0;j<JourneyStore.variantCount(bundle);j++)if(j!=index)common=Math.min(common,JourneyStore.commonBoardings(option,JourneyStore.variant(bundle,j)));if(common==Integer.MAX_VALUE)common=journeyBoarding;}return Math.min(common,Math.max(0,JourneyStore.boardings(option).size()-1));}
    private List<Repo.Stop> journeyOptionTargets(){ArrayList<Repo.Stop> out=new ArrayList<>();JSONObject bundle=repo.journeys.get(journeyId),current=currentJourney();for(int i=0;i<JourneyStore.variantCount(bundle);i++){JSONObject option=JourneyStore.variant(bundle,i);List<JSONObject> legs=JourneyStore.boardings(option);if(!legs.isEmpty()){int branch=optionBranch(bundle,i);Repo.Stop stop=repo.findStop(legs.get(branch).optJSONObject("from").optString("stopId"));if(stop!=null&&!out.contains(stop))out.add(stop);}}return out;}
    private void chooseJourneyVariant(int index){JSONObject option=JourneyStore.variant(repo.journeys.get(journeyId),index);int branch=optionBranch(repo.journeys.get(journeyId),index);journeyVariant=index;journeyBoarding=Math.min(branch,Math.max(0,JourneyStore.boardings(option).size()-1));resetDepartureScope();screen="journey";renderLayout();refresh();}
    private void renderJourneyOptions(){
        JSONObject bundle=repo.journeys.get(journeyId);if(bundle==null){returnHome();return;}centered(content,"Alternative Wege",17,WHITE,true);space(content,6);centered(content,"Aus deiner Planung · aktuelle Linienzeiten",12,MUTED,false);space(content,7);
        for(int i=0;i<JourneyStore.variantCount(bundle);i++){final int choice=i;JSONObject option=JourneyStore.variant(bundle,i);List<JSONObject> legs=JourneyStore.boardings(option);LinearLayout panel=card(content);panel.addView(text((i==journeyVariant?"✓ ":"")+(i==0?"Hauptroute":"Alternative "+i),12,MINT,true));space(panel,5);
            if(!legs.isEmpty()){int branch=optionBranch(bundle,i);JSONObject leg=legs.get(branch),from=leg.optJSONObject("from");Repo.Stop stop=repo.findStop(from.optString("stopId"));if(stop!=null)panel.setTag(at.andrew.foamawien.R.id.station_id,stop.id);panel.addView(text(stop==null?from.optString("name"):stop.name,14,WHITE,true));space(panel,5);List<Repo.Departure> rows=JourneyStore.departures(leg,repo);LinearLayout line=horizontal();line.addView(badge(leg.optString("route"),leg.optString("mode"),!rows.isEmpty()));TextView time=text(rows.isEmpty()?"—":repo.countdown(rows.get(0))+"′",28,WHITE,true);time.setGravity(Gravity.END);line.addView(time,new LinearLayout.LayoutParams(0,-2,1));panel.addView(line);space(panel,4);panel.addView(text("→ "+leg.optString("towards"),12,MUTED,false));}
            else panel.addView(text("Zu Fuß",14,WHITE,true));panel.setMinimumHeight(dp(64));actionable(panel,"Diesen Weg wählen",()->chooseJourneyVariant(choice));
        }fullButton(content,"Zur Route","quiet",this::navigateBack);
    }
    private List<Repo.Stop> journeyTargets(){
        ArrayList<Repo.Stop> out=new ArrayList<>();List<JSONObject> legs=JourneyStore.boardings(currentJourney());
        for(int i=Math.max(0,journeyBoarding);i<Math.min(legs.size(),journeyBoarding+2);i++){Repo.Stop stop=repo.findStop(legs.get(i).optJSONObject("from").optString("stopId"));if(stop!=null&&!out.contains(stop))out.add(stop);}return out;
    }
    private void renderRoutes(){
        if(repo.cityJourneys().length()==0)placeholder(repo.journeys.all().length()==0?"Deine gespeicherten Fahrten":"Noch keine Routen in "+CityProfiles.name(repo.cities.current()),"Am Handy planen und als Routenfavorit speichern. Anschließend per QR oder JSON-Datei auf diese Uhr übernehmen.");
        renderJourneyCards();fullButton(content,"Aus PWA übernehmen","primary",()->openTransfer("to-watch"));fullButton(content,"Datei importieren",()->chooseFavoriteFile());
        centered(content,"Aktuelle Abfahrten je Abschnitt. Neue Routen planst du in der PWA.",12,MUTED,false);space(content,8);fullButton(content,"Zurück","quiet",this::navigateBack);
    }
    private void renderJourneyCards(){
        JSONArray journeys=repo.cityJourneys();if(journeys.length()==0)return;tightenFavoriteHeading(centered(content,"Meine Routen",14,MINT,true));space(content,2);centered(content,CityProfiles.name(repo.cities.current()),12,MUTED,false);space(content,7);
        for(int i=0;i<journeys.length();i++){
            JSONObject journey=journeys.optJSONObject(i);List<JSONObject> legs=JourneyStore.boardings(journey);LinearLayout panel=card(content);panel.addView(text(journey.optString("name"),15,WHITE,true));if(JourneyStore.variantCount(journey)>1){space(panel,3);panel.addView(text((JourneyStore.variantCount(journey)-1)+" alternative Wege",12,MINT,false));}
            if(!legs.isEmpty()){JSONObject leg=legs.get(0);JSONObject from=leg.optJSONObject("from"),last=legs.get(legs.size()-1).optJSONObject("to");Repo.Stop stop=repo.findStop(from.optString("stopId"));if(stop!=null)panel.setTag(at.andrew.foamawien.R.id.station_id,stop.id);space(panel,5);panel.addView(text(from.optString("name")+" → "+last.optString("name"),12,MUTED,false));space(panel,7);LinearLayout row=horizontal();row.addView(badge(leg.optString("route"),leg.optString("mode"),!JourneyStore.departures(leg,repo).isEmpty()));List<Repo.Departure> departures=JourneyStore.departures(leg,repo);TextView time=text(departures.isEmpty()?"—":repo.countdown(departures.get(0))+"′",28,WHITE,true);time.setGravity(Gravity.END);row.addView(time,new LinearLayout.LayoutParams(0,-2,1));panel.addView(row);space(panel,3);panel.addView(text(departures.isEmpty()?"Keine aktuelle Abfahrt bestätigt":repo.quality(departures.get(0)),12,MUTED,false));}
            panel.setMinimumHeight(dp(70));actionable(panel,"Route "+journey.optString("name")+" öffnen",()->openJourney(journey.optString("id")));
        }
        space(content,6);
    }
    private void changeJourneyBoarding(int index){journeyBoarding=Math.max(0,index);resetDepartureScope();renderLayout();refresh();}
    private void renderJourney(){
        JSONObject journey=currentJourney();if(journey==null){placeholder("Route nicht mehr gespeichert","Die Route wurde entfernt. Weitere Wege kannst du aus der PWA per QR übertragen.");fullButton(content,"Zurück","quiet",this::navigateBack);return;}
        List<JSONObject> legs=JourneyStore.boardings(journey);TextView title=text(journey.optString("name"),17,WHITE,true);title.setMaxLines(3);title.setEllipsize(TextUtils.TruncateAt.END);title.setGravity(Gravity.CENTER);title.setContentDescription(journey.optString("name"));content.addView(title);space(content,6);centered(content,"Route · aktuelle Linienzeiten",12,MINT,false);space(content,8);
        if(legs.isEmpty()){placeholder("Keine Linienabschnitte","Dieser gespeicherte Weg führt zu Fuß ans Ziel.");}
        journeyBoarding=Math.min(Math.max(0,journeyBoarding),Math.max(0,legs.size()-1));
        for(int i=journeyBoarding;i<Math.min(legs.size(),journeyBoarding+1);i++){
            JSONObject leg=legs.get(i),from=leg.optJSONObject("from"),to=leg.optJSONObject("to");Repo.Stop stop=repo.findStop(from.optString("stopId"));LinearLayout panel=card(content);if(stop!=null)panel.setTag(at.andrew.foamawien.R.id.station_id,stop.id);
            panel.addView(text(i==journeyBoarding?"Einstieg "+(i+1)+" von "+legs.size():"Danach umsteigen",12,MINT,true));space(panel,6);panel.addView(text(from.optString("name"),15,WHITE,true));space(panel,8);
            List<Repo.Departure> departures=JourneyStore.departures(leg,repo);LinearLayout row=horizontal();row.addView(badge(leg.optString("route"),leg.optString("mode"),!departures.isEmpty()));TextView time=text(departures.isEmpty()?"—":repo.countdown(departures.get(0))+"′",i==journeyBoarding?38:28,WHITE,true);time.setGravity(Gravity.END);row.addView(time,new LinearLayout.LayoutParams(0,-2,1));panel.addView(row);space(panel,6);panel.addView(text("→ "+leg.optString("towards",to.optString("name")),12,WHITE,false));space(panel,5);
            if(stop!=null){final int stage=i;final String towards=departures.isEmpty()?leg.optString("towards").replaceFirst("(?i)^Wien\\s+",""):departures.get(0).towards;row.setMinimumHeight(dp(48));actionable(row,"Abfahrten "+stop.name+", "+leg.optString("route")+" Richtung "+towards,()->{journeyBoarding=stage;openConnection(stop,leg.optString("route"),towards);});}
            panel.addView(text(departures.isEmpty()?"Keine aktuelle Abfahrt bestätigt":repo.quality(departures.get(0))+(departures.size()>1?" · danach "+repo.countdown(departures.get(1))+"′":""),12,MUTED,false));space(panel,7);panel.addView(text("Aussteigen: "+to.optString("name"),12,MUTED,false));
            if(stop!=null){space(panel,6);fullButton(panel,"Alle Abfahrten",()->openConnection(stop,"",""));}
            if(i==journeyBoarding&&stop!=null&&journey.optJSONObject("from").optString("kind").equals("current")&&repo.reliableLocation()){space(panel,5);panel.addView(text("ca. "+Math.max(1,(int)Math.ceil(repo.walkMinutes(stop)))+" Min. bis zur Station · geschätzt",12,MUTED,false));}
        }
        if(journeyBoarding+1<legs.size()){JSONObject next=legs.get(journeyBoarding+1);LinearLayout after=card(content);after.addView(text("Danach umsteigen",12,MINT,true));space(after,4);after.addView(text(next.optString("route")+" · "+next.optJSONObject("from").optString("name"),14,WHITE,true));space(after,4);after.addView(text("→ "+next.optJSONObject("to").optString("name"),12,MUTED,false));List<Repo.Departure> nextTimes=JourneyStore.departures(next,repo);if(!nextTimes.isEmpty()){space(after,4);after.addView(text(repo.countdown(nextTimes.get(0))+"′",24,WHITE,true));after.addView(text(repo.quality(nextTimes.get(0))+" · aktuelle Linienzeit",12,MUTED,false));}final int nextIndex=journeyBoarding+1;Repo.Stop nextStop=repo.findStop(next.optJSONObject("from").optString("stopId"));actionable(after,"Nächsten Einstieg anzeigen",()->{journeyBoarding=nextIndex;if(nextStop!=null)openConnection(nextStop,next.optString("route"),nextTimes.isEmpty()?next.optString("towards"):nextTimes.get(0).towards,next.optString("mode"));else changeJourneyBoarding(nextIndex);});}
        if(journeyBoarding+1<legs.size())fullButton(content,"Weiter zum Umstieg","primary",()->changeJourneyBoarding(journeyBoarding+1));if(journeyBoarding>0)fullButton(content,"Vorheriger Einstieg","quiet",()->changeJourneyBoarding(journeyBoarding-1));
        if(legs.size()>2){space(content,4);centered(content,"Weitere Einstiege",12,MUTED,false);for(int i=0;i<legs.size();i++){final int index=i;JSONObject leg=legs.get(i);fullButton(content,(i+1)+" · "+leg.optString("route")+" · "+leg.optJSONObject("from").optString("name"),()->changeJourneyBoarding(index));}}
        if(JourneyStore.variantCount(repo.journeys.get(journeyId))>1){space(content,6);fullButton(content,"Alternative Wege ("+(JourneyStore.variantCount(repo.journeys.get(journeyId))-1)+")",()->{resetDepartureScope();screen="journey-options";renderLayout();refresh();});}space(content,8);centered(content,"Ziel: "+journey.optJSONObject("to").optString("name"),12,WHITE,true);space(content,7);centered(content,"Linienzeiten sind keine bestätigte Fahrt oder Anschlusszusage. Route bei Änderungen in der PWA neu planen.",12,MUTED,false);space(content,8);
        fullButton(content,"Route entfernen","danger",()->new AlertDialog.Builder(this).setTitle("Route entfernen?").setMessage("Nur auf dieser Uhr. Die Route auf deinem Handy bleibt erhalten.").setNegativeButton("Behalten",null).setPositiveButton("Entfernen",(dialog,which)->{repo.journeys.remove(journeyId);push.favoritesChanged();returnHome();}).show());fullButton(content,"Zurück","quiet",this::navigateBack);
    }
    private void renderDetail(){
        if(detailStop==null){screen="home";renderLayout();return;}
        Repo.Stop s=detailStop;List<List<Repo.Departure>> groups=repo.connections(s,detailRoute,detailFromJourney?"":detailTowards,true,detailMode);
        if(detailFromJourney&&!detailTowards.isEmpty())groups.removeIf(group->group.isEmpty()||!JourneyStore.directionMatches(detailTowards,group.get(0).towards));
        if(detailFromJourney&&!detailTowards.isEmpty()&&!groups.isEmpty())detailTowards=groups.get(0).get(0).towards;
        if(detailRoute.isEmpty()||detailTowards.isEmpty()){
            centered(content,s.name,17,WHITE,true);space(content,7);centered(content,"Linien: "+String.join(" · ",s.routes),12,MUTED,false);space(content,8);
            for(List<Repo.Departure> g:groups)connectionCard(s,g,false);
            if(groups.isEmpty())placeholder("Keine aktuellen Abfahrten","Offline oder gerade keine Abfahrt verfügbar.");
            favoriteAction(s,"","");fullButton(content,"Station auf Karte",()->openMap(s));
        }else{
            centered(content,s.name,17,WHITE,true);space(content,7);
            String mode=groups.isEmpty()?(detailMode.isEmpty()?s.routeModes.getOrDefault(detailRoute,Repo.inferMode("",detailRoute)):detailMode):groups.get(0).get(0).mode;
            LinearLayout heading=horizontal();heading.setGravity(Gravity.CENTER);heading.addView(badge(detailRoute,mode,!groups.isEmpty()&&repo.fresh(groups.get(0).get(0))));content.addView(heading);space(content,6);
            List<Repo.Departure> g=groups.isEmpty()?Collections.emptyList():groups.get(0);Repo.Departure d=g.isEmpty()?null:g.get(0);
            centered(content,detailTowards,17,WHITE,true);space(content,3);
            TextView minutes=text(d==null?"—":(repo.fresh(d)?"":"~")+repo.countdown(d)+"′",54,WHITE,true);minutes.setGravity(Gravity.CENTER);content.addView(minutes);space(content,3);
            if(d!=null){
                if(g.size()>1){centered(content,"danach "+repo.countdown(g.get(1))+" Min.",12,MUTED,false);space(content,7);}
                String reach=repo.feasibility(s,d);centered(content,reach,12,reach.contains("Ungewiss")?MUTED:reach.contains("Kaum")?0xffffa39f:reach.contains("Knapp")?AMBER:MINT,false);
                if(d.notice){space(content,7);content.addView(text("⚠ Betriebsmeldung. Details in der Smartphone-PWA.",12,AMBER,false));}
            }
            space(content,5);centered(content,d==null?"Keine aktuelle Abfahrt":repo.quality(d),12,d==null?MUTED:repo.fresh(d)?MUTED:AMBER,false);
            if(repo.currentLocation!=null){space(content,7);centered(content,"ca. "+Math.max(1,(int)Math.ceil(repo.walkMinutes(s)))+" Min. Fußweg · Schätzung",12,MUTED,false);centered(content,repo.prefs.getInt("buffer",1)+" Min. Reserve berücksichtigt",12,MUTED,false);}
            space(content,12);if(s.provider.equals("wl")&&Arrays.asList("metro","tram","bus").contains(mode))fullButton(content,"Fahrzeuge im Anflug",()->openApproach(mode));fullButton(content,"Station auf Karte",()->openMap(s));favoriteAction(s,detailRoute,detailTowards);fullButton(content,"Alle Abfahrten der Station",()->openConnection(s,"",""));
        }
        fullButton(content,"Zurück","quiet",this::navigateBack);
    }
    private void section(String value){if(!value.equals("about")&&updating)cancelUpdate();settingsSection=value;openingPage=true;scrollRevision++;content.removeAllViews();renderMore();restoreScroll(0);if(value.equals("push")&&active)push.retry();}
    private void pushButton(String label,String style,boolean enabled,Runnable action){Button b=button(label,style);b.setEnabled(enabled);b.setAlpha(enabled?1:.45f);content.addView(b,new LinearLayout.LayoutParams(-1,-2));b.setOnClickListener(v->action.run());space(content,7);}
    private void renderPush(){
        LinearLayout summary=card(content);summary.setPadding(dp(9),dp(8),dp(9),dp(8));
        boolean live=push.enabled()&&push.ready()&&push.hasPermission();
        centered(summary,push.busy()?"Wird geprüft …":live?"Push aktiviert":push.enabled()?"Verbindung prüfen":push.ready()?"Push ausgeschaltet":"Einrichtung offen",13,live?MINT:MUTED,true);
        menuRow("Hinweise",WatchPush.inbox(this,System.currentTimeMillis()).length()+" gespeichert","≡",()->{alertsFromPush=true;openAlerts();});
        menuRow("Push","Ein/Aus & Test","◉",()->section("push-delivery"));
        menuRow("Auswahl",push.scope().equals("all")?"Alle Linien":"Meine Favoriten","≋",()->section("push-filters"));
        menuRow("Infos","Datenschutz & Handy","ⓘ",()->section("push-info"));
    }
    private void renderPushDelivery(){
        centered(content,push.busy()?"Verbindung wird geprüft …":push.status(),12,MUTED,false);space(content,12);
        if(push.enabled()){
            pushButton("Test senden","secondary",!push.busy()&&push.ready()&&push.hasPermission(),push::test);
            fullButton(content,"Deaktivieren","danger",push::disable);
        }else pushButton("Aktivieren",push.ready()?"primary":"secondary",push.ready()&&!push.busy(),push::enable);
        pushButton("Verbindung prüfen","secondary",!push.busy(),push::retry);
        if(!push.hasPermission())fullButton(content,"Uhr-Freigabe",()->startActivity(new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(Settings.EXTRA_APP_PACKAGE,getPackageName())));
        space(content,5);centered(content,"Direkte Hinweise auf dieser Uhr. Aktivierung nur nach deiner Zustimmung.",12,MUTED,false);
    }
    private void renderPushFilters(){
        centered(content,"Benachrichtigen für",12,MUTED,false);space(content,7);
        for(String value:new String[]{"favorites","all"})pushButton((push.scope().equals(value)?"✓ ":"")+(value.equals("favorites")?"Meine Favoriten":"Alle Linien"),push.scope().equals(value)?"selected":"secondary",!push.busy(),()->push.select("scope",value));
        centered(content,"Meine Favoriten umfasst Haltestellen, Linien und gespeicherte A-nach-B-Wege mit Alternativen.",12,MUTED,false);
        space(content,5);centered(content,"Ruhezeit",12,MUTED,false);space(content,7);
        pushButton((push.quiet()?"✓ ":"○ ")+"Nachtruhe",push.quiet()?"selected":"secondary",!push.busy(),()->push.toggle("quiet"));
        centered(content,"22 bis 7 Uhr · Wiener Zeit",12,MUTED,false);space(content,13);
        centered(content,"Zusätzlich",12,MUTED,false);space(content,7);
        pushButton((push.equipment()?"✓ ":"○ ")+"Aufzüge",push.equipment()?"selected":"secondary",!push.busy(),()->push.toggle("equipment"));
        centered(content,"Auch Aufzüge & Fahrtreppen melden. Standardmäßig aus.",12,MUTED,false);
    }
    private void renderPushInfo(){
        infoCard("Deine Daten","Geräteadresse und ausgewählte Linien/Stationen werden für Push verschlüsselt gespeichert. Kein GPS und kein App-Konto.");
        infoCard("Zustellung","Google (Firebase) verarbeitet die technische Gerätekennung und den Nachrichtentext.");
        infoCard("Abmelden","Deaktivieren entfernt die Freigabe. Ohne Erneuerung läuft sie nach spätestens 90 Tagen ab.");
        infoCard("Handy-Spiegelung","Hinweise vom Handy lassen sich getrennt in der Begleit-App deiner Uhr steuern.");
    }
    private void infoCard(String title,String description){LinearLayout panel=card(content);panel.addView(text(title,13,WHITE,true));space(panel,5);panel.addView(text(description,12,MUTED,false));}
    private void renderAlerts(){
        status.setVisibility(View.GONE);centered(content,"Letzte Hinweise",17,WHITE,true);space(content,10);
        org.json.JSONArray rows=WatchPush.inbox(this,System.currentTimeMillis());
        if(rows.length()==0)placeholder("Noch keine Hinweise","Push unter Mehr → Störungen aktivieren. Fehlende Hinweise sind keine Entwarnung.");
        for(int i=0;i<rows.length();i++){org.json.JSONObject row=rows.optJSONObject(i);LinearLayout panel=card(content);panel.addView(text(row.optString("title"),14,WHITE,true));space(panel,5);panel.addView(text(row.optString("body"),12,MUTED,false));space(panel,5);
            String at=java.time.Instant.ofEpochMilli(row.optLong("at")).atZone(java.time.ZoneId.of("Europe/Vienna")).format(java.time.format.DateTimeFormatter.ofPattern("dd.MM. HH:mm"));panel.addView(text(at+" · Wiener Linien",12,MINT,false));}
        if(rows.length()>0){space(content,6);centered(content,"Gespeicherte Hinweise können inzwischen erledigt sein. Neueste Details in der Smartphone-PWA.",12,MUTED,false);}
        fullButton(content,"Zurück","quiet",this::navigateBack);
    }
    private void renderMore(){
        status.setVisibility(View.GONE);
        String title=settingsSection.isEmpty()?"Mehr":settingsSection.equals("push")?"Störungen":settingsSection.equals("push-delivery")?"Push-Hinweise":settingsSection.equals("push-filters")?"Auswahl":settingsSection.equals("push-info")?"Infos":settingsSection.equals("city")?"Stadtprofil":settingsSection.equals("modes")?"Verkehrsmittel":settingsSection.equals("radius")?"Suchradius":settingsSection.equals("location")?"Standort & Nähe":settingsSection.equals("favorites")?"Favoriten":settingsSection.equals("about")?"App & Updates":settingsSection.equals("transfer")?"Mit Handy übertragen":"Gehen & Reserve";
        centered(content,title,17,WHITE,true);space(content,14);
        if(settingsSection.equals("push")){renderPush();
        }else if(settingsSection.equals("push-delivery")){renderPushDelivery();
        }else if(settingsSection.equals("push-filters")){renderPushFilters();
        }else if(settingsSection.equals("push-info")){renderPushInfo();
        }else if(settingsSection.equals("city")){
            centered(content,"Aktuell: "+CityProfiles.name(repo.cities.current()),12,MINT,true);space(content,8);
            for(String city:new String[]{"auto","wien","graz","linz","salzburg"}){boolean selected=repo.cities.preference.equals(city);fullButton(content,(selected?"✓ ":"")+(city.equals("auto")?"Automatisch":CityProfiles.name(city)),selected?"selected":"secondary",()->chooseCity(city));}
            centered(content,"Wien ist Standard. Automatisch wechselt nur mit frischem, genauem Standort in der sichtbaren App. Manuell beginnt die Ansicht in der Stadtmitte; Gehzeiten bleiben dabei ungewiss.",12,MUTED,false);space(content,7);
            centered(content,"Salzburg: Fahrplanzeiten. Regionale Störungsmeldungen sind noch nicht angebunden. Smartphone und Uhr wählen ihre Stadt unabhängig.",12,MUTED,false);
        }else if(settingsSection.equals("radius")){
            centered(content,"Stationen im Umkreis",12,MUTED,false);space(content,10);
            for(int r:new int[]{300,600,1000})fullButton(content,(repo.prefs.getInt("radius",300)==r?"✓ ":"")+r+" m",repo.prefs.getInt("radius",300)==r?"selected":"secondary",()->{repo.prefs.edit().putInt("radius",r).apply();refreshMore();});
        }else if(settingsSection.equals("modes")){
            String[] keys=WearPolicy.MODES,labels=WearPolicy.MODE_LABELS;
            for(int i=0;i<keys.length;i++){String key=keys[i],label=labels[i];fullButton(content,(repo.modeAllowed(key)?"✓ ":"○ ")+label,repo.modeAllowed(key)?"selected":"secondary",()->{repo.prefs.edit().putBoolean("mode_"+key,!repo.modeAllowed(key)).apply();refreshMore();});}
        }else if(settingsSection.equals("walking")){
            centered(content,"Gehgeschwindigkeit",12,MUTED,false);space(content,9);
            for(float speed:new float[]{3.5f,4.5f,5.5f})fullButton(content,(repo.prefs.getFloat("speed",4.5f)==speed?"✓ ":"")+String.valueOf(speed).replace('.',',')+" km/h",repo.prefs.getFloat("speed",4.5f)==speed?"selected":"secondary",()->{repo.prefs.edit().putFloat("speed",speed).apply();refreshMore();});
            fullButton(content,"Reserve: "+repo.prefs.getInt("buffer",1)+" Min.",()->{repo.prefs.edit().putInt("buffer",(repo.prefs.getInt("buffer",1)+1)%6).apply();refreshMore();});
        }else if(settingsSection.equals("location")){
            centered(content,locationMessage.isEmpty()?repo.locationStatus():locationMessage,12,MUTED,false);space(content,12);
            fullButton(content,hasLocationPermission()?"Standort neu suchen":"Standort aktivieren","primary",()->startLocation(true));
            menuRow("Suchradius",repo.prefs.getInt("radius",300)+" m","⌖",()->section("radius"));
            menuRow("Verkehrsmittel","U-Bahn, Tram, Bus, S-Bahn","≋",()->section("modes"));
            fullButton(content,"Standorteinstellungen","quiet",()->openLocationSettings());
        }else if(settingsSection.equals("favorites")){
            fullButton(content,"Aus PWA importieren","primary",()->{operationMessage="";section("import");});
            centered(content,"Haltestellen, Linien/Richtungen und A nach B gemeinsam übernehmen.",12,MUTED,false);space(content,10);
            centered(content,"Sortierung auf dieser Uhr",12,MUTED,false);space(content,10);
            for(boolean distance:new boolean[]{false,true})fullButton(content,(repo.prefs.getBoolean("sortDistance",false)==distance?"✓ ":"")+(distance?"Nähesten zuerst":"Meine Reihenfolge"),repo.prefs.getBoolean("sortDistance",false)==distance?"selected":"secondary",()->{repo.prefs.edit().putBoolean("sortDistance",distance).apply();refreshMore();});
            fullButton(content,"Mit Handy übertragen","primary",()->section("transfer"));
            space(content,6);centered(content,"Verbindungen im Detail speichern oder entfernen. Favoriten bleiben lokal auf dieser Uhr.",12,MUTED,false);
        }else if(settingsSection.equals("import")){
            centered(content,"Alle Favoriten",17,WHITE,true);space(content,8);
            centered(content,"Haltestellen, Linien/Richtungen und A-nach-B-Routen aus deiner PWA gemeinsam importieren.",12,MUTED,false);space(content,10);
            fullButton(content,"Per QR übernehmen","primary",()->openTransfer("to-watch"));
            fullButton(content,"Datei importieren",this::chooseFavoriteFile);
            centered(content,"QR mit dem Handy scannen. In der PWA sind alle Favoriten vorausgewählt. Oder die unter PWA-Einstellungen exportierte JSON-Datei öffnen. Vorschau prüfen und auf der Uhr bestätigen. Vorhandene Favoriten bleiben erhalten.",12,MUTED,false);
            if(!operationMessage.isEmpty()){space(content,8);centered(content,operationMessage,12,MINT,false);}
        }else if(settingsSection.equals("transfer")){
            fullButton(content,"Vom Handy empfangen","primary",()->openTransfer("to-watch"));
            fullButton(content,"Ans Handy senden",()->openTransfer("to-phone"));
            centered(content,"QR-Code mit dem Handy scannen. Verschlüsselt, höchstens zehn Minuten gültig.",12,MUTED,false);
        }else if(settingsSection.equals("about")){
            centered(content,"foama-wien · v"+BuildConfig.VERSION_NAME,12,MINT,true);space(content,13);
            fullButton(content,"Auf Update prüfen","primary",()->checkUpdate());
            fullButton(content,"Akku sparen",()->section("battery"));
            fullButton(content,"Abfahrten aktualisieren",()->{returnHome();refresh();});
            if(!operationMessage.isEmpty())content.addView(text(operationMessage,12,AMBER,false));
            space(content,8);centered(content,"Abfahrten alle "+(powerSaver.active?"90":"30")+" s bei sichtbarer App. Keine Ortung im Hintergrund.",12,MUTED,false);
        }else if(settingsSection.equals("battery")){
            centered(content,"Ultra-Sparmodus",16,WHITE,true);space(content,8);centered(content,powerSaver.percent<0?"Akkustand nicht verfügbar":powerSaver.percent+" % Akku · "+(powerSaver.active?"Sparmodus aktiv":"Normalbetrieb"),12,MINT,true);space(content,8);
            fullButton(content,powerSaver.enabled?"✓ Automatisch unter 20 %":"Unter 20 % aktivieren",powerSaver.enabled?"selected":"primary",()->{powerSaver.enabled=!powerSaver.enabled;repo.prefs.edit().putBoolean("ultraBattery",powerSaver.enabled).apply();applyBattery(powerSaver.percent);refreshMore();});
            centered(content,"Optional: Standort höchstens alle 5 Minuten als einzelne Ortung, Abfahrten alle 90 Sekunden, Anzeige alle 30 Sekunden. Eine manuelle Standortsuche bleibt möglich. Alte Positionen und Abfahrten werden weiterhin als unsicher markiert.",12,MUTED,false);space(content,8);centered(content,"Ab 25 % Akku automatisch zurück zum Normalbetrieb mit Hinweis. Keine Abfragen im Hintergrund. QR-Übertragung und bestätigter Update-Download bleiben sichtbar wach.",12,MUTED,false);
        }else{
            menuRow("Stadtprofil",CityProfiles.name(repo.cities.current())+(repo.cities.preference.equals("auto")?" · automatisch":" · manuell"),"⌖",()->section("city"));
            menuRow("Standort & Nähe",repo.prefs.getInt("radius",300)+" m · Verkehrsmittel","⌖",()->section("location"));
            menuRow("Gehen & Reserve",String.valueOf(repo.prefs.getFloat("speed",4.5f)).replace('.',',')+" km/h · "+repo.prefs.getInt("buffer",1)+" Min.","↗",()->section("walking"));
            menuRow("Favoriten",repo.favorites.size()+" Station/Linie · "+repo.journeys.all().length()+" Routen","☆",()->section("favorites"));
            menuRow("Störungen",push.enabled()?"Direkt auf dieser Uhr":"Optional · Push-Hinweise","⚠︎",()->section("push"));
            menuRow("App & Updates","v"+BuildConfig.VERSION_NAME,"↻",()->section("about"));
        }
        space(content,7);fullButton(content,"Zurück","quiet",()->onBackPressed());
    }
    private void refreshMore(){int y=openingPage?0:scroll.getScrollY();content.removeAllViews();renderMore();restoreScroll(y);}
    private boolean hasLocationPermission(){return checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION)==PackageManager.PERMISSION_GRANTED||checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED;}
    private void chooseCity(String city){stopLocation();resetDepartureScope();repo.selectCity(city);locationMessage="";detailStop=null;refreshMore();if(active&&hasLocationPermission())startLocation(false);}
    private boolean locationScreen(){return screen.equals("home")||screen.equals("detail")||screen.equals("approach")||screen.equals("journey")&&currentJourney()!=null&&currentJourney().optJSONObject("from").optString("kind").equals("current")||screen.equals("more")&&settingsSection.equals("location");}
    private void readBattery(Intent intent){if(intent==null)return;int level=intent.getIntExtra(BatteryManager.EXTRA_LEVEL,-1),scale=intent.getIntExtra(BatteryManager.EXTRA_SCALE,-1);if(level<0||scale<=0)return;applyBattery(Math.min(100,Math.round(level*100f/scale)));}
    void applyBattery(int percent){
        boolean changed=powerSaver.update(percent);repo.prefs.edit().putBoolean("ultraBatteryActive",powerSaver.active).apply();
        if(changed&&!powerSaver.active)batteryMessage=powerSaver.percent>=25?"Akku erholt · wieder Normalbetrieb.":"Ultra-Sparmodus aus · Normalbetrieb.";
        else if(powerSaver.active)batteryMessage="Ultra-Sparmodus · "+powerSaver.percent+" % Akku · Zeiten alle 90 s";
        else if(powerSaver.percent>=0&&powerSaver.percent<20)batteryMessage="Akku unter 20 % · Ultra-Sparmodus optional aktivieren.";
        else if(!batteryMessage.startsWith("Akku erholt"))batteryMessage="";
        if(changed){stopLocation();if(active&&locationScreen())startLocation(false);handler.removeCallbacks(departureTicker);handler.removeCallbacks(renderTicker);if(active){handler.postDelayed(departureTicker,powerSaver.departureInterval());handler.postDelayed(renderTicker,powerSaver.renderInterval());}}
        if(active&&content!=null){if(screen.equals("more")&&settingsSection.equals("battery"))refreshMore();else if(!screen.equals("more"))renderContent();}
    }
    private void updateLocationUi(){if(screen.equals("more")){if(settingsSection.equals("location"))refreshMore();}else renderContent();}
    private void openLocationSettings(){
        Intent intent=hasLocationPermission()?new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS):new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS,android.net.Uri.parse("package:"+getPackageName()));
        try{startActivity(intent);}catch(ActivityNotFoundException e){locationMessage="Standortfreigabe in den Einstellungen der Uhr prüfen.";updateLocationUi();}
    }
    private void startLocation(boolean fromUser){
        if(!active)return;
        if(!powerSaver.locationDue(SystemClock.elapsedRealtime(),lastLocationAttempt,fromUser))return;
        if(!hasLocationPermission()){
            locationMessage="Standort für foama-wien erlauben. Favoriten bleiben nutzbar.";updateLocationUi();
            if(fromUser)requestPermissions(new String[]{Manifest.permission.ACCESS_COARSE_LOCATION,Manifest.permission.ACCESS_FINE_LOCATION},11);
            return;
        }
        lastLocationAttempt=SystemClock.elapsedRealtime();watchLocation.start(checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)==PackageManager.PERMISSION_GRANTED,powerSaver.active);
    }
    private void stopLocation(){if(watchLocation!=null)watchLocation.stop();}
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] results){super.onRequestPermissionsResult(code,permissions,results);if(code==WatchPush.PERMISSION){push.permissionResult();return;}if(code==11&&active){locationDenied=!hasLocationPermission();if(!locationDenied)startLocation(false);else{locationMessage="Standort nicht erlaubt. Freigabe in den App-Einstellungen der Uhr ändern.";updateLocationUi();}}}
    void returnHome(){boolean resumeData=dataPausedForAlerts||screen.equals("routes")||screen.equals("file-import");if(screen.equals("journey")||detailFromJourney)resetDepartureScope();detailFromJourney=false;dataPausedForAlerts=false;alertsFromPush=false;modesFromHome=false;screen="home";renderLayout();if(active){if(resumeData)startLocation(false);refresh();}}
    void navigateBack(){if(screen.equals("approach")){resetDepartureScope();screen="detail";renderLayout();refresh();return;}if(screen.equals("file-import")){pendingFile=null;cancelFileRead();filePreview=null;returnFromFileImport();return;}if(screen.equals("journey-options")){resetDepartureScope();screen="journey";renderLayout();refresh();return;}if(screen.equals("detail")&&detailFromJourney){detailFromJourney=false;resetDepartureScope();screen="journey";renderLayout();refresh();return;}if(screen.equals("journey")){if(journeyFromRoutes)openRoutes();else{returnHome();refresh();}return;}if(screen.equals("alerts")&&alertsFromPush){alertsFromPush=false;screen="more";settingsSection="push";renderLayout();return;}if(screen.equals("transfer")){boolean routes=transferFromRoutes;closeTransfer();if(routes){openRoutes();return;}screen="more";settingsSection=transferParentSection;renderLayout();if(active){requests=new RequestScope();fetching=false;startLocation(false);}return;}if(screen.equals("more")&&settingsSection.equals("modes")&&modesFromHome){returnHome();refresh();return;}if(screen.equals("more")&&settingsSection.isEmpty()&&moreFromRoutes){moreFromRoutes=false;openRoutes();return;}if(screen.equals("more")&&!settingsSection.isEmpty()){section(settingsSection.startsWith("push-")?"push":settingsSection.equals("radius")||settingsSection.equals("modes")?"location":(settingsSection.equals("transfer")||settingsSection.equals("import"))?"favorites":"");return;}if(!screen.equals("home")){returnHome();return;}stopForegroundWork();finish();}
    @Override public void onBackPressed(){navigateBack();}
    @Override public boolean onGenericMotionEvent(android.view.MotionEvent event){if(event.getAction()==MotionEvent.ACTION_SCROLL&&event.isFromSource(InputDevice.SOURCE_ROTARY_ENCODER)){scroll.smoothScrollBy(0,Math.round(-event.getAxisValue(MotionEvent.AXIS_SCROLL)*dp(72)));return true;}return super.onGenericMotionEvent(event);}
    @Override public boolean dispatchTouchEvent(MotionEvent event){
        int action=event.getActionMasked();
        if(action==MotionEvent.ACTION_DOWN){touchX=event.getX();touchY=event.getY();swipeConsumed=false;verticalGesture=false;}
        if(event.getPointerCount()>1)verticalGesture=true;
        if(action==MotionEvent.ACTION_MOVE||action==MotionEvent.ACTION_UP){
            float x=Math.abs(event.getX()-touchX),y=Math.abs(event.getY()-touchY);
            if(!swipeConsumed&&y>dp(12)&&y>x)verticalGesture=true;
            if(!verticalGesture&&!swipeConsumed&&x>=dp(56)&&x>y*1.8f){
                swipeConsumed=true;MotionEvent cancel=MotionEvent.obtain(event);cancel.setAction(MotionEvent.ACTION_CANCEL);super.dispatchTouchEvent(cancel);cancel.recycle();
            }
            if(swipeConsumed){if(action==MotionEvent.ACTION_UP){swipeConsumed=false;navigateBack();}return true;}
        }
        if(action==MotionEvent.ACTION_CANCEL){swipeConsumed=false;verticalGesture=true;}
        return super.dispatchTouchEvent(event);
    }
    void openTransfer(String direction){
        if(!active)return;if(direction.equals("to-phone")&&repo.favorites.isEmpty()&&repo.journeys.all().length()==0){operationMessage="Noch keine Favoriten auf dieser Uhr.";section("favorites");return;}
        transferFromRoutes=screen.equals("routes");
        transferParentSection=screen.equals("more")&&settingsSection.equals("import")?"import":"transfer";
        closeTransfer();stopLocation();requests.cancel();if(departureRequest!=null)departureRequest.cancel(true);transfer=new TransferManager(BuildConfig.FOAMA_BASE_URL,direction);transferRequests=transferConnectionFactory==null?new RequestScope():new RequestScope(transferConnectionFactory);transferMessage="Transfer wird vorbereitet …";screen="transfer";transferBusy=true;transferDeadlineElapsed=SystemClock.elapsedRealtime()+600000;armTransferTimeout();renderLayout();
        TransferManager current=transfer;RequestScope scope=transferRequests;transferRequest=network.submit(()->{
            try{current.create(scope);if(direction.equals("to-phone")){org.json.JSONArray rows=new org.json.JSONArray();for(Repo.Favorite f:repo.favorites)rows.put(f.toJson());current.send(rows,repo.journeys.all(),scope);}scope.check();
                runOnUiThread(()->{if(!transferValid(current,scope))return;transferBusy=false;armTransferTimeout();if(transferExpired()){finishTransfer("Code abgelaufen. Zurück und neuen Code öffnen.");return;}try{transferQr=qrBitmap(current.qrUrl());transferMessage="Mit der Handy-Kamera scannen";}catch(Exception e){finishTransfer("QR-Code nicht verfügbar. Bitte erneut starten.");return;}renderContent();handler.postDelayed(transferTicker,4000);});
            }catch(Exception e){runOnUiThread(()->{if(!transferValid(current,scope))return;finishTransfer("Transfer nicht erreichbar. Zurück und erneut versuchen.");});}
        });
    }
    private boolean transferValid(TransferManager manager,RequestScope scope){return active&&screen.equals("transfer")&&transfer==manager&&!manager.closed&&transferRequests==scope&&!scope.isCancelled();}
    private boolean transferExpired(){return SystemClock.elapsedRealtime()>=transferDeadlineElapsed||(transfer!=null&&transfer.expiresAt>0&&System.currentTimeMillis()>=transfer.expiresAt);}
    private void armTransferTimeout(){
        handler.removeCallbacks(transferTimeout);long remaining=transferDeadlineElapsed-SystemClock.elapsedRealtime();
        if(transfer!=null&&transfer.expiresAt>0)remaining=Math.min(remaining,transfer.expiresAt-System.currentTimeMillis());
        handler.postDelayed(transferTimeout,Math.max(0,remaining));
    }
    private void updateTransferScreenAwake(){
        if(active&&screen.equals("transfer")&&transfer!=null&&!transfer.closed)getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        else getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }
    private void finishTransfer(String message){
        handler.removeCallbacks(transferTicker);handler.removeCallbacks(transferTimeout);
        if(transferRequests!=null)transferRequests.cancel();if(transferRequest!=null)transferRequest.cancel(true);
        if(transfer!=null)transfer.destroy();if(transferQr!=null){transferQr.recycle();transferQr=null;}
        transferPreview=null;transferBusy=false;transferMessage=message;updateTransferScreenAwake();
        if(screen.equals("transfer"))renderContent();
    }
    private void completeTransfer(String message){
        String imported=importedFavoriteView;finishTransfer(message);importedFavoriteView="";
        if(imported.isEmpty())return;
        closeTransfer();favoriteView=imported;repo.prefs.edit().putString("favoriteView",imported).apply();settingsSection="";detailFromJourney=false;dataPausedForAlerts=false;
        resetDepartureScope();changeView("fav");if(active)startLocation(false);Toast.makeText(this,"Favoriten übernommen",Toast.LENGTH_SHORT).show();
    }
    static android.graphics.Bitmap qrBitmap(String url)throws Exception{
        java.util.Map<com.google.zxing.EncodeHintType,Object> hints=new java.util.EnumMap<>(com.google.zxing.EncodeHintType.class);hints.put(com.google.zxing.EncodeHintType.MARGIN,4);hints.put(com.google.zxing.EncodeHintType.ERROR_CORRECTION,com.google.zxing.qrcode.decoder.ErrorCorrectionLevel.M);
        com.google.zxing.common.BitMatrix matrix=new com.google.zxing.qrcode.QRCodeWriter().encode(url,com.google.zxing.BarcodeFormat.QR_CODE,420,420,hints);int[] pixels=new int[matrix.getWidth()*matrix.getHeight()];for(int y=0;y<matrix.getHeight();y++)for(int x=0;x<matrix.getWidth();x++)pixels[y*matrix.getWidth()+x]=matrix.get(x,y)?android.graphics.Color.BLACK:android.graphics.Color.WHITE;
        return android.graphics.Bitmap.createBitmap(pixels,matrix.getWidth(),matrix.getHeight(),android.graphics.Bitmap.Config.ARGB_8888);
    }
    private void renderTransfer(){
        updateTransferScreenAwake();
        status.setVisibility(View.GONE);
        if(transferQr!=null){ImageView image=new ImageView(this);image.setImageBitmap(transferQr);image.setContentDescription("QR-Code zur privaten Favoritenübertragung");int width=Math.round(getResources().getDisplayMetrics().widthPixels/getResources().getDisplayMetrics().density),size=dp(Math.min(156,Math.round(width*.69f)));LinearLayout.LayoutParams params=new LinearLayout.LayoutParams(size,size);params.gravity=Gravity.CENTER_HORIZONTAL;content.addView(image,params);space(content,10);}
        centered(content,transferMessage,12,MINT,true);space(content,10);
        if(transfer!=null&&!transfer.closed){centered(content,"Display bleibt während der Übertragung an.",12,MUTED,false);space(content,8);}
        if(transferPreview!=null){
            centered(content,transferPreview.favorites.length()+" Station/Linie · "+transferPreview.journeys.length()+" Routen neu/aktualisiert · "+transferPreview.duplicates+" bereits gespeichert · "+transferPreview.unknown+" übersprungen",12,MUTED,false);space(content,8);
            for(int i=0;i<Math.min(8,transferPreview.favorites.length());i++){org.json.JSONObject f=transferPreview.favorites.optJSONObject(i);centered(content,f.optString("stopName")+(f.optString("route").isEmpty()?"":" · "+f.optString("route")+" → "+f.optString("towards")),12,WHITE,false);space(content,5);}
            for(int i=0;i<Math.min(6,transferPreview.journeys.length());i++){org.json.JSONObject route=transferPreview.journeys.optJSONObject(i);centered(content,"↗ "+route.optString("name"),12,WHITE,true);space(content,5);}
            fullButton(content,"Favoriten übernehmen","primary",()->confirmTransfer());
        }else if(transfer!=null&&transferQr!=null&&!transferBusy)fullButton(content,"Übernahme prüfen",()->pollTransfer());
        fullButton(content,"Zurück","quiet",()->navigateBack());
    }
    private void pollTransfer(){
        if(!active||!screen.equals("transfer")||transfer==null||transfer.closed||transferBusy||transferPreview!=null)return;
        handler.removeCallbacks(transferTicker);if(transferExpired()){finishTransfer("Code abgelaufen. Zurück und neuen Code öffnen.");return;}
        TransferManager current=transfer;RequestScope scope=transferRequests;transferBusy=true;
        transferRequest=network.submit(()->{try{org.json.JSONObject value=current.poll(scope);TransferManager.Preview preview=value.optString("status").equals("ready")&&current.direction.equals("to-watch")?TransferManager.preview(current.decrypt(value),repo):null;scope.check();
            runOnUiThread(()->{if(!transferValid(current,scope))return;transferBusy=false;if(transferExpired()){finishTransfer("Code abgelaufen. Zurück und neuen Code öffnen.");return;}if(value.optString("status").equals("done")){completeTransfer("Übertragung abgeschlossen.");return;}else if(preview!=null){transferPreview=preview;transferMessage="Favoriten prüfen";if(transferQr!=null){transferQr.recycle();transferQr=null;}}else{handler.postDelayed(transferTicker,4000);}renderContent();});
        }catch(Exception e){runOnUiThread(()->{if(!transferValid(current,scope))return;transferBusy=false;transferMessage="Noch keine Übernahme. Verbindung prüfen oder erneut versuchen.";renderContent();handler.postDelayed(transferTicker,5000);});}});
    }
    void confirmTransfer(){
        if(transferPreview==null||transferBusy||transfer==null||transfer.closed)return;
        if(transferExpired()){finishTransfer("Code abgelaufen. Zurück und neuen Code öffnen.");return;}
        String importedView=transferPreview.journeys.length()>0?"routes":transferPreview.favorites.length()>0?"stations":favoriteRoutes()?"routes":"stations";
        try{repo.mergeTransfer(transferPreview);importedFavoriteView=importedView;}catch(Exception error){transferMessage="Speichern nicht möglich. Bitte erneut versuchen.";renderContent();return;}transferPreview=null;transferMessage="Favoriten gespeichert. Transfer wird abgeschlossen …";transferBusy=true;renderContent();TransferManager current=transfer;RequestScope scope=transferRequests;
        transferRequest=network.submit(()->{try{current.acknowledge(scope);runOnUiThread(()->{if(!transferValid(current,scope))return;completeTransfer("Favoriten übernommen. Transferinhalt gelöscht.");});}catch(Exception e){runOnUiThread(()->{if(!transferValid(current,scope))return;transferBusy=false;transferMessage="Favoriten gespeichert. Abschluss bitte erneut prüfen.";renderContent();handler.postDelayed(transferTicker,4000);});}});
    }
    private void closeTransfer(){handler.removeCallbacks(transferTicker);handler.removeCallbacks(transferTimeout);getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);if(transferRequests!=null)transferRequests.cancel();if(transferRequest!=null)transferRequest.cancel(true);if(transfer!=null)transfer.destroy();if(transferQr!=null){transferQr.recycle();transferQr=null;}transfer=null;transferRequests=null;transferPreview=null;transferBusy=false;importedFavoriteView="";}
    void chooseFavoriteFile(){
        if(!screen.equals("file-import"))fileParent=screen.equals("more")&&settingsSection.equals("import")?"import":"routes";
        cancelFileRead();filePreview=null;fileMessage="Wähle eine foama-wien-Favoriten-Datei (JSON).";screen="file-import";renderLayout();
        Intent intent=new Intent(Intent.ACTION_OPEN_DOCUMENT).setType("application/json").addCategory(Intent.CATEGORY_OPENABLE).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        try{startActivityForResult(intent,IMPORT_FILE);}catch(ActivityNotFoundException e){fileMessage="Auf dieser Uhr ist keine Dateiauswahl verfügbar. Bitte die Routen aus der PWA per QR übernehmen.";renderContent();}
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);if(request!=IMPORT_FILE)return;
        if(result==RESULT_OK&&data!=null&&data.getData()!=null&&"content".equals(data.getData().getScheme())){pendingFile=data.getData();screen="file-import";fileMessage="Datei wird geprüft …";if(active)consumePendingFile();}
        else{pendingFile=null;fileMessage="Keine Datei ausgewählt. Deine Favoriten bleiben erhalten.";if(active)renderContent();}
    }
    private void consumePendingFile(){
        if(!active||pendingFile==null||!screen.equals("file-import"))return;
        android.net.Uri uri=pendingFile;pendingFile=null;cancelFileRead();RequestScope scope=new RequestScope();fileScope=scope;fileMessage="Datei wird geprüft …";renderLayout();getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        fileRequest=network.submit(()->{java.io.InputStream stream=null;try{
            scope.check();stream=getContentResolver().openInputStream(uri);scope.check();fileStream=stream;scope.check();TransferManager.Preview preview=FavoriteFile.preview(stream,repo,scope);
            runOnUiThread(()->{if(!fileValid(scope))return;filePreview=preview;fileMessage="Import prüfen";renderContent();});
        }catch(Exception e){runOnUiThread(()->{if(!fileValid(scope))return;filePreview=null;fileMessage="Datei konnte nicht übernommen werden. Bitte eine gültige foama-wien-Favoriten-Datei bis 512 KiB auswählen.";getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);renderContent();});}
        finally{if(fileStream==stream)fileStream=null;if(stream!=null)try{stream.close();}catch(Exception ignored){}}});
    }
    private boolean fileValid(RequestScope scope){return active&&screen.equals("file-import")&&fileScope==scope&&!scope.isCancelled();}
    private void cancelFileRead(){if(fileScope!=null)fileScope.cancel();if(fileRequest!=null)fileRequest.cancel(true);java.io.InputStream stream=fileStream;fileStream=null;if(stream!=null)try{stream.close();}catch(Exception ignored){}getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);}
    void confirmFileImport(){
        if(!active||!screen.equals("file-import")||filePreview==null)return;
        try{int stations=filePreview.favorites.length(),routes=filePreview.journeys.length();repo.mergeTransfer(filePreview);filePreview=null;cancelFileRead();operationMessage=stations+" Station/Linie und "+routes+" Route"+(routes==1?"":"n")+" übernommen.";returnFromFileImport();}
        catch(Exception e){fileMessage="Speichern nicht möglich. Deine bisherigen Favoriten bleiben erhalten.";renderContent();}
    }
    private void returnFromFileImport(){if(fileParent.equals("import")){screen="more";settingsSection="import";renderLayout();}else openRoutes();}
    private void renderFileImport(){
        status.setVisibility(View.GONE);centered(content,"Datei importieren",17,WHITE,true);space(content,8);centered(content,fileMessage,12,MUTED,false);space(content,8);
        if(filePreview!=null){centered(content,filePreview.journeys.length()+" Routen · "+filePreview.favorites.length()+" Station/Linie · "+filePreview.duplicates+" bereits gespeichert · "+filePreview.unknown+" übersprungen",12,MINT,true);space(content,8);
            if(filePreview.favorites.length()>0){centered(content,"Haltestellen & Linien",12,MINT,true);space(content,5);for(int i=0;i<Math.min(8,filePreview.favorites.length());i++){JSONObject f=filePreview.favorites.optJSONObject(i);centered(content,f.optString("stopName")+(f.optString("route").isEmpty()?"":" · "+f.optString("route")+" → "+f.optString("towards")),12,WHITE,false);space(content,5);}}
            if(filePreview.journeys.length()>0){centered(content,"A nach B",12,MINT,true);space(content,5);}
            for(int i=0;i<Math.min(6,filePreview.journeys.length());i++){centered(content,filePreview.journeys.optJSONObject(i).optString("name"),14,WHITE,true);space(content,5);}
            fullButton(content,"Favoriten übernehmen","primary",this::confirmFileImport);
        }
        fullButton(content,"Andere Datei wählen",this::chooseFavoriteFile);fullButton(content,"Aus PWA per QR",()->{cancelFileRead();filePreview=null;returnFromFileImport();openTransfer("to-watch");});fullButton(content,"Zurück","quiet",this::navigateBack);
    }
    private boolean updateValid(RequestScope scope){return (active||updateDownloading)&&screen.equals("more")&&settingsSection.equals("about")&&updateScope==scope&&!scope.isCancelled();}
    private void setUpdateAwake(boolean awake){
        for(Window window:new Window[]{getWindow(),updateDialog==null?null:updateDialog.getWindow()})if(window!=null){if(awake)window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);else window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);}
    }
    private void showUpdateDialog(AlertDialog dialog){updateDialog=dialog;dialog.setCanceledOnTouchOutside(false);dialog.show();setUpdateAwake(true);handler.removeCallbacks(updateTimeout);handler.postDelayed(updateTimeout,UPDATE_TIMEOUT_MS);}
    void checkUpdate(){
        if(!active||updating||updateDialog!=null)return;
        if(updateScope!=null)updateScope.cancel();RequestScope scope=updateConnectionFactory==null?new RequestScope():new RequestScope(updateConnectionFactory);updateScope=scope;updating=true;operationMessage="Prüfe Updates …";refreshMore();
        updateRequest=network.submit(()->{try{
            Updater.UpdateInfo update=Updater.check(this,scope);
            runOnUiThread(()->{if(!updateValid(scope))return;updating=false;
                if(update==null){operationMessage="Bereits aktuell: "+BuildConfig.VERSION_NAME;refreshMore();return;}
                operationMessage="Update "+update.version+" verfügbar · noch nicht heruntergeladen";refreshMore();
                StringBuilder info=new StringBuilder(String.format(java.util.Locale.GERMANY,"%.1f MB · Das ist neu:\n",update.bytes/1000000.0));for(String note:update.notes)info.append("\n• ").append(note);if(update.notes.isEmpty())info.append("\nDetails auf der öffentlichen App-Seite.");info.append("\n\nErst nach Bestätigung herunterladen und installieren.");
                AlertDialog dialog=new AlertDialog.Builder(this).setTitle("Update "+update.version).setMessage(info.toString())
                    .setNegativeButton("Später",(d,w)->cancelUpdate("Update später installieren.")).setPositiveButton("Installieren",(d,w)->{if(updateValid(scope))startUpdateDownload(update,scope);}).create();
                dialog.setOnDismissListener(d->{if(updateDialog==dialog)cancelUpdate("Update später installieren.");});showUpdateDialog(dialog);
            });
        }catch(Exception e){runOnUiThread(()->{if(!updateValid(scope))return;updating=false;operationMessage="Updateprüfung nicht erreichbar. Bitte erneut versuchen.";refreshMore();});}});
    }
    private void cancelUpdate(){cancelUpdate("Update abgebrochen. Bei Bedarf erneut prüfen.");}
    private void cancelUpdate(String message){
        boolean hadUpdate=updating||updateDialog!=null;if(updateScope!=null)updateScope.cancel();if(updateRequest!=null)updateRequest.cancel(true);Updater.stopObservingInstallSession();updating=false;updateDownloading=false;handler.removeCallbacks(updateTimeout);setUpdateAwake(false);AlertDialog dialog=updateDialog;updateDialog=null;if(dialog!=null)dialog.dismiss();Updater.clearDownloadCache(this);if(hadUpdate)operationMessage=message;if(active&&screen.equals("more"))refreshMore();
    }
    private void startUpdateDownload(Updater.UpdateInfo update,RequestScope scope){
        if(!updateValid(scope))return;updating=true;updateDownloading=true;updateHandedToInstaller=false;LinearLayout box=vertical();box.setPadding(dp(14),dp(8),dp(14),dp(8));
        TextView label=text("Download startet …",12,WHITE,false);box.addView(label);ProgressBar progress=new ProgressBar(this,null,android.R.attr.progressBarStyleHorizontal);progress.setMax(100);box.addView(progress,new LinearLayout.LayoutParams(-1,dp(20)));
        AlertDialog dialog=new AlertDialog.Builder(this).setTitle("Update laden").setView(box).setNegativeButton("Abbrechen",(d,w)->cancelUpdate()).create();
        dialog.setOnDismissListener(d->{if(updateDialog==dialog)cancelUpdate();});showUpdateDialog(dialog);
        updateRequest=network.submit(()->{try{Updater.download(this,update,new Updater.Callback(){
            public void onStatus(String message){runOnUiThread(()->{if(updateValid(scope))label.setText(message);});}
            public void onProgress(long bytes,long total){runOnUiThread(()->{if(!updateValid(scope))return;int percent=(int)(bytes*100/total);progress.setProgress(percent);label.setText(String.format(java.util.Locale.GERMANY,"%d %% · %.1f / %.1f MB",percent,bytes/1000000.0,total/1000000.0));});}
            public void onApk(java.io.File file){runOnUiThread(()->{
                if(!updateValid(scope)){Updater.clearDownloadCache(MainActivity.this);return;}
                if(!getPackageManager().canRequestPackageInstalls()){
                    cancelUpdate("Installation erlauben, dann erneut nach Updates suchen.");
                    try{Updater.requestInstallPermission(MainActivity.this);}catch(Exception e){operationMessage="Installation in den Android-Einstellungen erlauben.";if(active)refreshMore();}return;
                }
                label.setText("Installation wird vorbereitet …");progress.setIndeterminate(true);
                updateRequest=network.submit(()->{try{Updater.requestInstall(MainActivity.this,file,scope);runOnUiThread(()->{if(!updateValid(scope))return;updateHandedToInstaller=true;label.setText("An Android übergeben · bitte Installation bestätigen.");dialog.getButton(AlertDialog.BUTTON_NEGATIVE).setEnabled(false);});}
                    catch(Exception e){runOnUiThread(()->{if(updateValid(scope))cancelUpdate("Installation derzeit nicht möglich. Erneut nach Updates suchen.");});}});
            });}
        },scope);}catch(Exception e){runOnUiThread(()->{if(updateValid(scope))cancelUpdate("Download oder Prüfung fehlgeschlagen. Bitte erneut versuchen.");});}});
    }
}
