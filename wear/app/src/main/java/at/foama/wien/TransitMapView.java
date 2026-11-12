package at.foama.wien;

import android.content.Context;
import android.graphics.*;
import android.location.Location;
import android.view.*;
import android.os.Handler;
import android.os.Looper;
import android.widget.Toast;
import java.net.*;
import java.io.*;
import java.util.*;
import java.util.concurrent.*;
import java.util.function.Consumer;
import org.json.*;

/** Mercator map with a small RAM tile cache; no prefetch, offline download or polling. */
final class TransitMapView extends View {
    final Repo repo;Repo.Stop selected;private final Consumer<Repo.Stop> select;private double lat=48.2083,lon=16.3731;private int zoom=16;private boolean active,busy,fitted;private float downX,downY,lastX,lastY;private boolean moved,pinched;
    private final Paint paint=new Paint(3);private final Handler handler=new Handler(Looper.getMainLooper());private RequestScope requests=new RequestScope();private final ExecutorService worker=Executors.newSingleThreadExecutor();
    private final LinkedHashMap<String,Bitmap> tiles=new LinkedHashMap<String,Bitmap>(16,.75f,true);private final Map<String,Long> failures=new HashMap<>();private final ScaleGestureDetector pinch;private final ArrayList<double[]> line=new ArrayList<>();private String lineRoute="",lineMode="";
    TransitMapView(Context context,Repo repo,Consumer<Repo.Stop> select){super(context);this.repo=repo;this.select=select;setFocusable(true);setContentDescription("Karte mit Haltestellen. Station antippen, mit zwei Fingern oder Plus und Minus zoomen. Stationsliste über Station wählen erreichbar.");pinch=new ScaleGestureDetector(context,new ScaleGestureDetector.SimpleOnScaleGestureListener(){float scale=1;public boolean onScaleBegin(ScaleGestureDetector d){scale=1;pinched=true;return true;}public boolean onScale(ScaleGestureDetector detector){scale*=detector.getScaleFactor();if(scale>1.35f){zoomBy(1);scale=1;}else if(scale<.74f){zoomBy(-1);scale=1;}return true;}});}
    private float dp(float n){return n*getResources().getDisplayMetrics().density;}
    static double worldX(double lon,int z){return (lon+180)/360*(256L<<z);}
    static double worldY(double lat,int z){double s=Math.sin(Math.toRadians(Math.max(-85,Math.min(85,lat))));return (.5-Math.log((1+s)/(1-s))/(4*Math.PI))*(256L<<z);}
    @Override protected void onSizeChanged(int w,int h,int oldw,int oldh){super.onSizeChanged(w,h,oldw,oldh);if(!fitted&&w>0){double diameter=Math.max(200,repo.prefs.getInt("radius",300)*2.4);double metersPerWorldPixel=Math.cos(Math.toRadians(lat))*40075016.686/256;zoom=Math.max(12,Math.min(19,(int)Math.floor(Math.log(w*metersPerWorldPixel/diameter)/Math.log(2))));fitted=true;}}
    void center(double latitude,double longitude){lat=latitude;lon=longitude;invalidate();}
    void zoomBy(int delta){zoom=Math.max(12,Math.min(19,zoom+delta));invalidate();}
    void resume(){active=true;requests=new RequestScope();invalidate();}
    void pause(){active=false;busy=false;requests.cancel();}
    void destroy(){worker.shutdownNow();tiles.clear();failures.clear();}
    private float x(double value){return (float)(worldX(value,zoom)-worldX(lon,zoom)+getWidth()/2.0);}
    private float y(double value){return (float)(worldY(value,zoom)-worldY(lat,zoom)+getHeight()/2.0);}
    ArrayList<Repo.Stop> visibleStations(){ArrayList<Repo.Stop> out=new ArrayList<>();for(Repo.Stop s:repo.stops)if((s==selected||s.city.equals(repo.cities.current())&&repo.matchesModes(s))&&x(s.lon)>=0&&x(s.lon)<=getWidth()&&y(s.lat)>=0&&y(s.lat)<=getHeight())out.add(s);out.sort(Comparator.comparingDouble(s->Math.hypot(x(s.lon)-getWidth()/2f,y(s.lat)-getHeight()/2f)));return new ArrayList<>(out.subList(0,Math.min(20,out.size())));}
    @Override protected void onDraw(Canvas c){
        super.onDraw(c);c.drawColor(0xff182a30);double cx=worldX(lon,zoom),cy=worldY(lat,zoom);int left=(int)Math.floor((cx-getWidth()/2.0)/256),top=(int)Math.floor((cy-getHeight()/2.0)/256);ArrayList<String> missing=new ArrayList<>();boolean rendered=false;
        for(int tx=left;tx<=Math.floor((cx+getWidth()/2.0)/256);tx++)for(int ty=top;ty<=Math.floor((cy+getHeight()/2.0)/256);ty++){
            if(tx<0||ty<0||tx>=(1<<zoom)||ty>=(1<<zoom))continue;String key=zoom+"/"+tx+"/"+ty;Bitmap tile=tiles.get(key);float xx=(float)(tx*256-cx+getWidth()/2.0),yy=(float)(ty*256-cy+getHeight()/2.0);
            if(tile!=null){paint.setAlpha(180);c.drawBitmap(tile,xx,yy,paint);paint.setAlpha(255);rendered=true;}else if(missing.size()<4&&System.currentTimeMillis()-failures.getOrDefault(key,0L)>60000)missing.add(key);
        }
        if(!line.isEmpty()){Path path=new Path();for(int i=0;i<line.size();i++){double[] p=line.get(i);if(i==0)path.moveTo(x(p[1]),y(p[0]));else path.lineTo(x(p[1]),y(p[0]));}paint.setColor(Color.WHITE);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(dp(6));c.drawPath(path,paint);paint.setColor(WearPolicy.lineColor(lineRoute,lineMode));paint.setStrokeWidth(dp(3));c.drawPath(path,paint);paint.setStyle(Paint.Style.FILL);}
        ArrayList<Repo.Stop> stops=visibleStations();int labels=WatchLayout.of(getResources()).width>=225?4:2,count=0;
        for(Repo.Stop s:stops){float sx=x(s.lon),sy=y(s.lat);boolean chosen=s==selected;paint.setColor(Color.BLACK);c.drawCircle(sx,sy,dp(chosen?8:6),paint);paint.setColor(chosen?MainActivity.MINT:Color.WHITE);c.drawCircle(sx,sy,dp(chosen?6:4),paint);if((chosen||count++<labels)&&sy>dp(62)&&sy<getHeight()-dp(85)){paint.setTextSize(dp(11));paint.setTypeface(Typeface.DEFAULT_BOLD);String name=s.name.length()>23?s.name.substring(0,21)+"…":s.name;float width=paint.measureText(name);float labelX=Math.max(dp(8),Math.min(getWidth()-width-dp(8),sx-width/2));paint.setColor(0xee111c25);c.drawRoundRect(labelX-dp(3),sy+dp(8),labelX+width+dp(3),sy+dp(25),dp(4),dp(4),paint);paint.setColor(Color.WHITE);c.drawText(name,labelX,sy+dp(21),paint);}}
        if(repo.reliableLocation()){Location fix=repo.currentLocation;float sx=x(fix.getLongitude()),sy=y(fix.getLatitude());float accuracy=(float)(fix.getAccuracy()/(Math.cos(Math.toRadians(fix.getLatitude()))*40075016.686/(256L<<zoom)));paint.setColor(0x333c9eff);c.drawCircle(sx,sy,Math.min(getWidth(),accuracy),paint);paint.setColor(Color.WHITE);c.drawCircle(sx,sy,dp(7),paint);paint.setColor(0xff2993ff);c.drawCircle(sx,sy,dp(5),paint);}
        paint.setTypeface(Typeface.DEFAULT);paint.setTextSize(dp(9));String credit=rendered?"© OpenStreetMap":"Stationspunkte · Karte lädt / offline";float width=paint.measureText(credit);paint.setColor(0xcc111c25);c.drawRect((getWidth()-width)/2-dp(3),getHeight()-dp(18),(getWidth()+width)/2+dp(3),getHeight()-dp(5),paint);paint.setColor(Color.WHITE);c.drawText(credit,(getWidth()-width)/2,getHeight()-dp(8),paint);
        if(active&&!busy&&!missing.isEmpty())loadTiles(missing);
    }
    private void loadTiles(ArrayList<String> keys){busy=true;RequestScope scope=requests;worker.submit(()->{
        Map<String,Bitmap> loaded=new LinkedHashMap<>();ArrayList<String> failed=new ArrayList<>();
        for(String key:keys){if(scope.isCancelled())break;HttpURLConnection con=null;try{con=scope.open(new URL("https://tile.openstreetmap.org/"+key+".png"));con.setConnectTimeout(8000);con.setReadTimeout(8000);con.setInstanceFollowRedirects(false);con.setRequestProperty("User-Agent","foama-wien-wear/"+BuildConfig.VERSION_NAME+" (+"+BuildConfig.FOAMA_BASE_URL+")");if(con.getResponseCode()!=200)throw new IOException();byte[] bytes=Repo.readBytes(con.getInputStream());scope.check();Bitmap bitmap=BitmapFactory.decodeByteArray(bytes,0,bytes.length);if(bitmap==null||bitmap.getWidth()>512||bitmap.getHeight()>512)throw new IOException();loaded.put(key,bitmap);}catch(Exception e){failed.add(key);}finally{if(con!=null){con.disconnect();scope.release(con);}}}
        handler.post(()->{busy=false;if(!active||requests!=scope||scope.isCancelled())return;tiles.putAll(loaded);for(String key:failed)failures.put(key,System.currentTimeMillis());while(failures.size()>24)failures.remove(failures.keySet().iterator().next());while(tiles.size()>12)tiles.remove(tiles.keySet().iterator().next());invalidate();});
    });}
    void showLine(String route,String mode){
        try{JSONObject index=new JSONObject(repo.readAsset("line-maps/index.json"));JSONArray lines=index.getJSONArray("lines");JSONObject entry=null;for(int i=0;i<lines.length();i++)if(lines.getJSONObject(i).optString("id").equals(mode+"|"+route))entry=lines.getJSONObject(i);if(entry==null)throw new IOException();JSONObject data=new JSONObject(repo.readAsset("line-maps/"+entry.getString("file")));JSONArray patterns=data.getJSONArray("patterns");JSONObject chosen=null;for(int i=0;i<patterns.length();i++){JSONObject p=patterns.getJSONObject(i);JSONArray stops=p.getJSONArray("stops");boolean contains=false;for(int j=0;j<stops.length();j++)contains|=selected!=null&&stops.getJSONObject(j).optString("id").equals(selected.id);if(contains&&(chosen==null||stops.length()>chosen.getJSONArray("stops").length()))chosen=p;}if(chosen==null)throw new IOException();line.clear();String encoded=data.getJSONObject("shapes").getString(chosen.getString("geometry"));line.addAll(decodePolyline(encoded));lineRoute=route;lineMode=mode;invalidate();Toast.makeText(getContext(),route+" → "+chosen.optString("towards"),Toast.LENGTH_SHORT).show();}catch(Exception e){Toast.makeText(getContext(),"Für diese Linie ist noch kein Verlauf verfügbar.",Toast.LENGTH_SHORT).show();}
    }
    static ArrayList<double[]> decodePolyline(String encoded){ArrayList<double[]> out=new ArrayList<>();long latitude=0,longitude=0;int index=0;while(index<encoded.length()&&out.size()<20000){long[] pair=new long[2];for(int n=0;n<2;n++){int shift=0,value;long result=0;do{if(index>=encoded.length()||shift>55)throw new IllegalArgumentException();value=encoded.charAt(index++)-63;if(value<0||value>63)throw new IllegalArgumentException();result|=(long)(value&31)<<shift;shift+=5;}while(value>=32);pair[n]=(result&1)!=0?~(result>>1):result>>1;}latitude+=pair[0];longitude+=pair[1];out.add(new double[]{latitude/1000000.0,longitude/1000000.0});}return out;}
    @Override public boolean onTouchEvent(MotionEvent event){pinch.onTouchEvent(event);if(event.getActionMasked()==MotionEvent.ACTION_DOWN){downX=lastX=event.getX();downY=lastY=event.getY();moved=false;pinched=false;return true;}if(event.getActionMasked()==MotionEvent.ACTION_MOVE&&!pinch.isInProgress()&&event.getPointerCount()==1){float dx=event.getX()-lastX,dy=event.getY()-lastY;moved|=Math.hypot(event.getX()-downX,event.getY()-downY)>dp(7);double wx=worldX(lon,zoom)-dx,wy=worldY(lat,zoom)-dy;lon=wx/(256L<<zoom)*360-180;lat=Math.toDegrees(Math.atan(Math.sinh(Math.PI*(1-2*wy/(256L<<zoom)))));lastX=event.getX();lastY=event.getY();invalidate();return true;}if(event.getActionMasked()==MotionEvent.ACTION_UP&&!moved&&!pinched){Repo.Stop nearest=null;double best=dp(24);for(Repo.Stop s:visibleStations()){double distance=Math.hypot(x(s.lon)-event.getX(),y(s.lat)-event.getY());if(distance<best){best=distance;nearest=s;}}if(nearest!=null){selected=nearest;select.accept(nearest);performClick();invalidate();}return true;}return true;}
    @Override public boolean performClick(){super.performClick();return true;}
}
