package at.foama.wien;

import android.app.*;
import android.content.*;
import android.graphics.*;
import android.graphics.drawable.GradientDrawable;
import android.location.Location;
import android.os.*;
import android.view.*;
import android.widget.*;
import java.util.*;

/** An optional foreground map. Station catalogue and Vienna line geometry work offline. */
public final class MapActivity extends Activity {
    Repo repo;TransitMapView map;private TextView selection;private boolean resumed,centerAfterFix;private Toast locationFeedback;
    private final Handler handler=new Handler(Looper.getMainLooper());private WatchLocation location;
    private final BroadcastReceiver display=new BroadcastReceiver(){public void onReceive(Context c,Intent i){if(Intent.ACTION_SCREEN_OFF.equals(i.getAction()))pauseMap();else if(resumed)resumeMap();}};
    @Override public void onCreate(Bundle state){
        super.onCreate(state);try{if(android.net.http.HttpResponseCache.getInstalled()==null)android.net.http.HttpResponseCache.install(new java.io.File(getCacheDir(),"map-http"),2*1024*1024);}catch(java.io.IOException ignored){}getWindow().setFlags(1024,1024);repo=new Repo(this);
        Location fix=getIntent().getParcelableExtra("fix");if(fix!=null)repo.acceptLocation(fix);
        FrameLayout frame=new FrameLayout(this);frame.setBackgroundColor(Color.BLACK);setContentView(frame);
        map=new TransitMapView(this,repo,this::showStation);frame.addView(map,new FrameLayout.LayoutParams(-1,-1));
        LinearLayout navigation=new LinearLayout(this);navigation.setGravity(Gravity.CENTER);
        Button back=control("‹","Karte schließen"),list=control("Liste","Stationsliste öffnen");list.setTooltipText("Stationen im Kartenausschnitt als Liste");
        navigation.addView(back,new LinearLayout.LayoutParams(dp(48),dp(48)));navigation.addView(list,new LinearLayout.LayoutParams(dp(72),dp(48)));
        FrameLayout.LayoutParams top=new FrameLayout.LayoutParams(dp(120),dp(48),Gravity.TOP|Gravity.CENTER_HORIZONTAL);top.topMargin=dp(8);frame.addView(navigation,top);back.setOnClickListener(v->finish());list.setOnClickListener(v->showStationList());
        Button center=control("◎","Auf meinen Standort zentrieren");center.setTooltipText("Deinen Standort als blauen Punkt zeigen");FrameLayout.LayoutParams pos=new FrameLayout.LayoutParams(dp(48),dp(48),Gravity.START|Gravity.CENTER_VERTICAL);pos.leftMargin=dp(8);frame.addView(center,pos);center.setOnClickListener(v->centerOnLocation());
        LinearLayout zoom=new LinearLayout(this);zoom.setOrientation(1);Button plus=control("+","Vergrößern"),minus=control("−","Verkleinern");zoom.addView(plus,new LinearLayout.LayoutParams(dp(48),dp(48)));zoom.addView(minus,new LinearLayout.LayoutParams(dp(48),dp(48)));FrameLayout.LayoutParams zoomPos=new FrameLayout.LayoutParams(dp(48),-2,Gravity.END|Gravity.CENTER_VERTICAL);zoomPos.rightMargin=dp(8);frame.addView(zoom,zoomPos);plus.setOnClickListener(v->map.zoomBy(1));minus.setOnClickListener(v->map.zoomBy(-1));
        selection=new TextView(this);selection.setTextSize(13);selection.setTextColor(Color.WHITE);selection.setGravity(Gravity.CENTER);selection.setPadding(dp(8),dp(5),dp(8),dp(5));selection.setMaxLines(3);selection.setBackground(background());selection.setMinimumHeight(dp(48));selection.setFocusable(true);selection.setClickable(true);
        FrameLayout.LayoutParams bottom=new FrameLayout.LayoutParams(Math.round(getResources().getDisplayMetrics().widthPixels*.72f),-2,Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL);bottom.bottomMargin=dp(23);frame.addView(selection,bottom);
        selection.setText("Station wählen");selection.setOnClickListener(v->{if(map.selected!=null)stationActions(map.selected);else showStationList();});
        Repo.Stop stop=repo.findStop(getIntent().getStringExtra("stop"));if(stop!=null){map.selected=stop;map.center(stop.lat,stop.lon);showStation(stop);}else if(repo.currentLocation!=null)map.center(repo.currentLocation.getLatitude(),repo.currentLocation.getLongitude());
        location=new WatchLocation((android.location.LocationManager)getSystemService(LOCATION_SERVICE),handler,getMainExecutor(),new WatchLocation.Callback(){public boolean onFix(Location fix){if(!resumed)return false;Location previous=repo.currentLocation;repo.acceptLocation(fix);if(repo.currentLocation==previous)return false;if(centerAfterFix&&repo.reliableLocation()){centerAfterFix=false;centerAndConfirm();}map.invalidate();return true;}public void onStatus(String message){if(resumed&&centerAfterFix&&!message.isEmpty())locationMessage(message);}});
        IntentFilter filter=new IntentFilter();filter.addAction(Intent.ACTION_SCREEN_OFF);filter.addAction(Intent.ACTION_SCREEN_ON);if(Build.VERSION.SDK_INT>=33)registerReceiver(display,filter,Context.RECEIVER_NOT_EXPORTED);else registerReceiver(display,filter);
    }
    private void centerOnLocation(){
        if(!resumed)return;
        if(repo.reliableLocation()){centerAfterFix=false;centerAndConfirm();}
        else if(checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION)==0||checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)==0){centerAfterFix=true;location.start(checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)==0,true,!OfflineTimetable.online(this));}
        else locationMessage("Standort zuerst unter Nähe erlauben.");
    }
    private void centerAndConfirm(){map.center(repo.currentLocation.getLatitude(),repo.currentLocation.getLongitude());locationMessage("Dein Standort · blauer Punkt in der Kartenmitte");}
    private void locationMessage(String message){if(locationFeedback!=null)locationFeedback.cancel();locationFeedback=Toast.makeText(this,message,Toast.LENGTH_LONG);locationFeedback.show();}
    private int dp(float v){return Math.round(v*getResources().getDisplayMetrics().density);}
    private GradientDrawable background(){GradientDrawable bg=new GradientDrawable();bg.setColor(0xee111c25);bg.setCornerRadius(dp(18));bg.setStroke(dp(1),0xff365247);return bg;}
    private Button control(String label,String description){Button b=new Button(this);b.setAllCaps(false);b.setText(label);b.setTextSize(14);b.setTextColor(MainActivity.MINT);b.setContentDescription(description);b.setPadding(0,0,0,0);b.setMinHeight(dp(48));b.setMinimumHeight(dp(48));b.setBackgroundTintList(null);b.setBackground(new android.graphics.drawable.InsetDrawable(background(),dp(7)));return b;}
    private void showStation(Repo.Stop stop){String walk=repo.reliableLocation()?" · ca. "+Math.max(1,(int)Math.ceil(repo.walkMinutes(stop)))+"′ zu Fuß":"";String lines=map.hasLine()?"Linie "+map.activeLine():String.join(" · ",stop.routes.subList(0,Math.min(3,stop.routes.size())))+(stop.routes.size()>3?" +"+(stop.routes.size()-3):"");selection.setText(stop.name+walk+"\n"+lines);selection.setContentDescription(stop.name+walk+". "+lines+". Aktionen öffnen");}
    private void stationActions(Repo.Stop stop){
        ArrayList<String> labels=new ArrayList<>(),routes=new ArrayList<>();labels.add("Abfahrten");if(stop.city.equals("wien"))for(String route:stop.routes){routes.add(route);labels.add("Linie "+route+" zeigen");}if(map.hasLine())labels.add("Alle Stationen zeigen");
        new AlertDialog.Builder(this).setTitle(stop.name).setItems(labels.toArray(new String[0]),(dialog,index)->{if(index==0){Intent intent=new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("foama_stop",stop.id);startActivity(intent);finish();}else if(index<=routes.size()){String route=routes.get(index-1);map.showLine(route,stop.routeModes.get(route));showStation(stop);}else{map.clearLine();showStation(stop);}}).setNegativeButton("Zurück",null).show();
    }
    private void showStationList(){ArrayList<Repo.Stop> stops=map.visibleStations();if(stops.isEmpty()){Toast.makeText(this,"Keine Station im Ausschnitt. Bitte zoomen oder verschieben.",Toast.LENGTH_SHORT).show();return;}new AlertDialog.Builder(this).setTitle("Station wählen").setItems(stops.stream().map(s->s.name).toArray(String[]::new),(d,i)->{Repo.Stop stop=stops.get(i);map.selected=stop;map.center(stop.lat,stop.lon);showStation(stop);}).setNegativeButton("Zurück",null).show();}
    private void resumeMap(){PowerManager p=(PowerManager)getSystemService(POWER_SERVICE);if(p!=null&&!p.isInteractive())return;map.resume();if(!repo.reliableLocation()&&(checkSelfPermission(android.Manifest.permission.ACCESS_COARSE_LOCATION)==0||checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)==0))location.start(checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION)==0,true,!OfflineTimetable.online(this));handler.postDelayed(()->map.invalidate(),90001);}
    private void pauseMap(){centerAfterFix=false;map.pause();location.stop();handler.removeCallbacksAndMessages(null);if(locationFeedback!=null){locationFeedback.cancel();locationFeedback=null;}}
    @Override protected void onResume(){super.onResume();resumed=true;resumeMap();}
    @Override protected void onPause(){resumed=false;pauseMap();super.onPause();}
    @Override protected void onDestroy(){pauseMap();map.destroy();unregisterReceiver(display);super.onDestroy();}
    @Override public boolean onGenericMotionEvent(MotionEvent event){if(event.getAction()==MotionEvent.ACTION_SCROLL&&event.isFromSource(InputDevice.SOURCE_ROTARY_ENCODER)){map.zoomBy(event.getAxisValue(MotionEvent.AXIS_SCROLL)>0?1:-1);return true;}return super.onGenericMotionEvent(event);}
}
