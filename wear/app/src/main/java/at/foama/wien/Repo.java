package at.foama.wien;

import android.content.Context;
import android.content.SharedPreferences;
import android.location.Location;
import android.os.SystemClock;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

/** Local watch data; HTTPS requests contain public platform IDs, never GPS coordinates. */
final class Repo {
    static final int MAX_CACHE_BYTES=512*1024,MAX_CACHE_ROWS=3000;
    final Context ctx;
    final SharedPreferences prefs;
    final JourneyStore journeys;
    final ArrayList<Stop> stops=new ArrayList<>();
    final ArrayList<Departure> departures=new ArrayList<>();
    final ArrayList<Favorite> favorites=new ArrayList<>();
    volatile String lastError="";
    volatile long lastFetch=0,nextFetchElapsed=0;
    int failures=0,cycle=0;
    Location currentLocation;
    long movingUntil=0;
    JSONObject railFeed=new JSONObject();
    JSONObject lineEvidence=new JSONObject();
    Runnable onFavoritesChanged;
    Repo(Context context){ctx=context;prefs=ctx.getSharedPreferences("foama",Context.MODE_PRIVATE);journeys=new JourneyStore(prefs);loadAssets();try{lineEvidence=new JSONObject(prefs.getString("stationLineEvidence","{}"));}catch(Exception ignored){}for(Stop stop:stops)applyLineEvidence(stop,System.currentTimeMillis());loadFavorites();loadCache();}
    static final class Stop {
        String id="",name="",provider="wl";double lat,lon,meters;
        final ArrayList<String> rbl=new ArrayList<>(),platformIds=new ArrayList<>();
        volatile List<String> modes=new ArrayList<>(),routes=new ArrayList<>();
        final Map<String,List<String>> platformModes=new HashMap<>();
        volatile Map<String,String> routeModes=new HashMap<>();
        final Map<String,String> catalogueRouteModes=new HashMap<>();
    }
    static final class Departure {
        String stopKey="",rbl="",route="",towards="",mode="bus",quality="Fahrplan",platform="";
        long when,fetchedAt;boolean notice;
        String key(){return stopKey+"|"+rbl+"|"+route+"|"+towards+"|"+when;}
    }
    static final class Favorite {
        String stopId="",stopName="",route="",towards="";
        JSONObject toJson(){JSONObject o=new JSONObject();try{o.put("stopId",stopId);o.put("stopName",stopName);o.put("route",route);o.put("towards",towards);}catch(JSONException ignored){}return o;}
    }
    void loadAssets(){
        for(String file:new String[]{"stops.json","rail.json"})try{
            JSONObject data=new JSONObject(readAsset(file));if(file.equals("rail.json"))railFeed=data;
            JSONArray rows=data.optJSONArray("stops");if(rows!=null)for(int i=0;i<rows.length();i++)addStop(rows.getJSONObject(i));
        }catch(Exception ignored){/* Empty catalogue is visible in the UI. */}
    }
    String readAsset(String filename)throws IOException{try(InputStream in=ctx.getAssets().open(filename)){return new String(readBytes(in),StandardCharsets.UTF_8);}}
    static ArrayList<String> strings(JSONArray rows){ArrayList<String> out=new ArrayList<>();if(rows!=null)for(int i=0;i<rows.length();i++)out.add(rows.optString(i));return out;}
    void addStop(JSONObject row){
        Stop s=new Stop();s.id=row.optString("id");s.name=row.optString("name");s.provider=row.optString("provider","wl");s.lat=row.optDouble("lat");s.lon=row.optDouble("lon");
        s.rbl.addAll(strings(row.optJSONArray("rbl")));s.platformIds.addAll(strings(row.optJSONArray("platformIds")));s.modes.addAll(strings(row.optJSONArray("modes")));
        JSONArray lines=row.optJSONArray("lines");if(lines!=null)for(int i=0;i<lines.length();i++){JSONObject l=lines.optJSONObject(i);if(l!=null){String route=l.optString("route");s.routes.add(route);s.routeModes.put(route,l.optString("mode"));}}
        s.routes.sort(Comparator.comparingInt(route->WearPolicy.modePriority(s.routeModes.get(route))));
        s.catalogueRouteModes.putAll(s.routeModes);
        JSONArray platforms=row.optJSONArray("platforms");if(platforms!=null)for(int i=0;i<platforms.length();i++){JSONObject p=platforms.optJSONObject(i);if(p!=null)s.platformModes.put(p.optString("id"),strings(p.optJSONArray("modes")));}
        if(!s.id.isEmpty()&&Double.isFinite(s.lat)&&Double.isFinite(s.lon))stops.add(s);
    }
    Stop findStop(String id){for(Stop s:stops)if(s.id.equals(id))return s;return null;}
    void applyLineEvidence(Stop stop,long now){
        if(!stop.provider.equals("wl"))return;
        JSONObject evidence=lineEvidence.optJSONObject(stop.id);if(evidence==null)return;
        long checked=evidence.optLong("checkedAt");if(checked>now+30000||now-checked>90L*86400000)return;
        Map<String,String> routeModes=new HashMap<>(stop.catalogueRouteModes);
        JSONArray lines=evidence.optJSONArray("lines");if(lines!=null)for(int i=0;i<Math.min(256,lines.length());i++){
            JSONObject line=lines.optJSONObject(i);if(line==null)continue;String route=line.optString("route"),mode=line.optString("mode");long seen=line.optLong("lastSeen");
            if(!route.isEmpty()&&route.length()<=30&&Arrays.asList(WearPolicy.MODES).contains(mode)&&seen>0&&seen<=now+30000&&now-seen<=90L*86400000)routeModes.put(route,mode);
        }
        JSONArray hidden=evidence.optJSONArray("suppressed");if(hidden!=null)for(int i=0;i<Math.min(256,hidden.length());i++){
            JSONObject line=hidden.optJSONObject(i);if(line!=null&&line.optString("mode").equals(routeModes.get(line.optString("route"))))routeModes.remove(line.optString("route"));
        }
        List<String> routes=new ArrayList<>(routeModes.keySet()),modes=new ArrayList<>();routes.sort(Comparator.comparingInt((String route)->WearPolicy.modePriority(routeModes.get(route))).thenComparing(route->route));
        for(String mode:routeModes.values())if(!modes.contains(mode))modes.add(mode);stop.routeModes=routeModes;stop.routes=routes;stop.modes=modes;
    }
    void mergeLineEvidence(JSONObject payload,long now){
        JSONObject registry=payload.optJSONObject("foamaLines");if(registry==null||registry.optInt("version")!=1||!registry.optString("status").equals("available"))return;
        JSONArray stations=registry.optJSONArray("stations");if(stations==null)return;
        try{
            for(int i=0;i<Math.min(24,stations.length());i++){
                JSONObject entry=stations.optJSONObject(i);if(entry==null)continue;Stop stop=findStop(entry.optString("stopId"));long checked=entry.optLong("checkedAt");if(stop==null||checked<=0||checked>now+30000)continue;
                JSONObject safe=new JSONObject().put("stopId",stop.id).put("checkedAt",checked);
                for(String field:new String[]{"lines","suppressed"}){
                    JSONArray items=entry.optJSONArray(field),values=new JSONArray();if(items!=null)for(int j=0;j<Math.min(256,items.length());j++){
                        JSONObject item=items.optJSONObject(j);if(item==null)continue;String route=item.optString("route"),mode=item.optString("mode");if(route.isEmpty()||route.length()>30||!Arrays.asList(WearPolicy.MODES).contains(mode))continue;
                        JSONObject line=new JSONObject().put("route",route).put("mode",mode);if(field.equals("lines"))line.put("lastSeen",item.optLong("lastSeen"));values.put(line);
                    }safe.put(field,values);
                }
                lineEvidence.put(stop.id,safe);applyLineEvidence(stop,now);
            }
            ArrayList<String> keys=new ArrayList<>();Iterator<String> iterator=lineEvidence.keys();while(iterator.hasNext())keys.add(iterator.next());
            keys.sort(Comparator.comparingLong(key->lineEvidence.optJSONObject(key).optLong("checkedAt")));
            for(String key:keys)if(now-lineEvidence.optJSONObject(key).optLong("checkedAt")>90L*86400000)lineEvidence.remove(key);
            String serialized=lineEvidence.toString();int index=0;while((lineEvidence.length()>2000||serialized.getBytes(StandardCharsets.UTF_8).length>512*1024)&&index<keys.size()){lineEvidence.remove(keys.get(index++));serialized=lineEvidence.toString();}
            prefs.edit().putString("stationLineEvidence",serialized).apply();
        }catch(JSONException ignored){}
    }
    boolean modeAllowed(String mode){return prefs.getBoolean("mode_"+mode,Arrays.asList("metro","tram","bus","sbahn").contains(mode));}
    boolean matchesModes(Stop stop){for(String mode:stop.modes)if(modeAllowed(mode))return true;return false;}
    int modePriority(Collection<String> modes,boolean all){int rank=WearPolicy.MODES.length;if(modes!=null)for(String mode:modes)if(all||modeAllowed(mode))rank=Math.min(rank,WearPolicy.modePriority(mode));return rank;}
    ArrayList<Stop> nearby(){
        ArrayList<Stop> list=new ArrayList<>();if(currentLocation==null)return list;
        int radius=prefs.getInt("radius",300);
        for(Stop s:stops)if(matchesModes(s)){
            double distance=airDistance(s);if(distance<=radius){s.meters=distance*1.3;list.add(s);}
        }
        list.sort(Comparator.comparingInt((Stop s)->modePriority(s.modes,false)).thenComparingDouble(s->s.meters));return list;
    }
    List<Favorite> orderedFavorites(){
        ArrayList<Favorite> out=new ArrayList<>(favorites);
        if(currentLocation!=null&&prefs.getBoolean("sortDistance",false))out.sort(Comparator.comparingDouble(f->{Stop s=findStop(f.stopId);return s==null?Double.POSITIVE_INFINITY:airDistance(s);}));
        return out;
    }
    LinkedHashMap<String,List<Favorite>> favoriteGroups(){
        LinkedHashMap<String,List<Favorite>> groups=new LinkedHashMap<>();
        for(Favorite favorite:orderedFavorites())groups.computeIfAbsent(favorite.stopId,key->new ArrayList<>()).add(favorite);
        return groups;
    }
    List<Stop> favoriteStops(){LinkedHashMap<String,Stop> out=new LinkedHashMap<>();for(Favorite f:orderedFavorites()){Stop s=findStop(f.stopId);if(s!=null)out.put(s.id,s);}return new ArrayList<>(out.values());}
    List<String> requestIds(List<Stop> selected,boolean favoriteView){
        return requestIds(selected,favoriteView,Collections.emptySet());
    }
    List<String> requestIds(List<Stop> selected,boolean favoriteView,Set<String> visibleStops){
        Map<String,Integer> priorities=new HashMap<>();ArrayList<List<String>> groups=new ArrayList<>(),visible=new ArrayList<>();for(Stop s:selected)if(s.provider.equals("wl")){
            ArrayList<String> ids=new ArrayList<>();for(String id:s.rbl){List<String> modes=s.platformModes.get(id);boolean allowed=favoriteView;
                if(modes!=null)for(String mode:modes)allowed|=modeAllowed(mode);if(allowed){ids.add(id);priorities.merge(id,modePriority(modes,false),Math::min);}}
            ids.sort(Comparator.comparingInt(id->modePriority(s.platformModes.get(id),favoriteView)));groups.add(ids);if(visibleStops.contains(s.id))visible.add(ids);
        }
        return WearPolicy.visibleBudget(groups,visible,cycle++,favoriteView?Collections.emptyMap():priorities);
    }
    void loadFavorites(){try{mergeFavorites(new JSONArray(prefs.getString("favorites","[]")),true);}catch(Exception ignored){}}
    void saveFavorites(){JSONArray rows=new JSONArray();for(Favorite f:favorites)rows.put(f.toJson());prefs.edit().putString("favorites",rows.toString()).apply();if(onFavoritesChanged!=null)onFavoritesChanged.run();}
    void mergeTransfer(TransferManager.Preview preview)throws Exception {
        JSONArray routes=journeys.merged(preview.journeys),rows=new JSONArray();for(Favorite f:favorites)rows.put(f.toJson());
        for(int i=0;i<preview.favorites.length();i++){JSONObject row=preview.favorites.getJSONObject(i);Stop stop=findStop(row.optString("stopId"));if(stop!=null&&!hasFavorite(stop,row.optString("route"),row.optString("towards")))rows.put(row);}
        if(!prefs.edit().putString("favorites",rows.toString()).putString(JourneyStore.KEY,routes.toString()).commit())throw new IllegalStateException("Favoriten konnten nicht gespeichert werden");
        favorites.clear();loadFavorites();if(onFavoritesChanged!=null)onFavoritesChanged.run();
    }
    void mergeFavorites(JSONArray rows,boolean replace){
        if(replace)favorites.clear();for(int i=0;i<Math.min(500,rows.length());i++){
            JSONObject x=rows.optJSONObject(i);if(x==null)continue;Stop s=findStop(x.optString("stopId"));if(s==null)continue;
            String route=x.optString("route"),towards=x.optString("towards");if(route.length()>30||towards.length()>160||hasFavorite(s,route,towards))continue;
            Favorite f=new Favorite();f.stopId=s.id;f.stopName=s.name;f.route=route;f.towards=towards;favorites.add(f);
        }saveFavorites();
    }
    boolean hasFavorite(Stop s,String route,String towards){for(Favorite f:favorites)if(f.stopId.equals(s.id)&&f.route.equals(route)&&f.towards.equals(towards))return true;return false;}
    boolean toggleFavorite(Stop s,String route,String towards){
        for(int i=0;i<favorites.size();i++){Favorite f=favorites.get(i);if(f.stopId.equals(s.id)&&f.route.equals(route)&&f.towards.equals(towards)){favorites.remove(i);saveFavorites();return false;}}
        Favorite f=new Favorite();f.stopId=s.id;f.stopName=s.name;f.route=route;f.towards=towards;favorites.add(f);saveFavorites();return true;
    }
    double airDistance(Stop s){if(currentLocation==null)return Double.POSITIVE_INFINITY;float[] result=new float[1];Location.distanceBetween(currentLocation.getLatitude(),currentLocation.getLongitude(),s.lat,s.lon,result);return result[0];}
    double walkMinutes(Stop s){return airDistance(s)*1.3/1000/Math.max(1,prefs.getFloat("speed",4.5f))*60;}
    boolean moving(){return System.currentTimeMillis()<movingUntil;}
    boolean reliableLocation(){return currentLocation!=null&&WearPolicy.reliable(System.currentTimeMillis(),currentLocation.getTime(),currentLocation.hasAccuracy()?currentLocation.getAccuracy():Float.NaN,moving());}
    boolean acceptLocation(Location location){
        if(location==null||!Double.isFinite(location.getLatitude())||!Double.isFinite(location.getLongitude())||Math.abs(location.getLatitude())>90||Math.abs(location.getLongitude())>180)return false;
        long now=System.currentTimeMillis();if(location.getTime()>now+5000||now-location.getTime()>WearPolicy.CACHE_MS)return false;
        Location previous=currentLocation;if(previous!=null&&location.getTime()<previous.getTime())return false;
        boolean recalc=previous==null||previous.distanceTo(location)>=40;
        if(location.hasSpeed()&&location.getSpeed()>2.8f)movingUntil=now+60000;
        if(previous!=null){double seconds=(location.getTime()-previous.getTime())/1000.0;
            if(seconds>=5&&seconds<120&&previous.hasAccuracy()&&location.hasAccuracy()){
                double minimum=Math.max(0,previous.distanceTo(location)-previous.getAccuracy()-location.getAccuracy());
                if(minimum/seconds>2.8)movingUntil=now+60000;
            }}
        currentLocation=new Location(location);return recalc;
    }
    String locationStatus(){
        if(currentLocation==null)return "Standort noch offen";
        long age=Math.max(0,(System.currentTimeMillis()-currentLocation.getTime())/1000);
        String precision=currentLocation.hasAccuracy()?"±"+Math.round(currentLocation.getAccuracy())+" m":"Genauigkeit offen";
        return (moving()?"Unterwegs · ":age>90?"Letzter Standort · ":"Standort · ")+precision+(age>30?" · vor "+age+" s":"");
    }
    static byte[] readBytes(InputStream input)throws IOException{try(InputStream in=input;ByteArrayOutputStream out=new ByteArrayOutputStream()){byte[] b=new byte[4096];int n;while((n=in.read(b))!=-1){if(out.size()+n>4*1024*1024)throw new IOException("Antwort zu groß");out.write(b,0,n);}return out.toByteArray();}}
    static String jsonHttp(String url,String method,JSONObject payload)throws Exception{
        return jsonHttp(url,method,payload,new RequestScope());
    }
    static String jsonHttp(String url,String method,JSONObject payload,RequestScope scope)throws Exception{return jsonHttp(url,method,payload,scope,null);}
    static String jsonHttp(String url,String method,JSONObject payload,RequestScope scope,String transferSecret)throws Exception{
        URI requested=new URI(url),origin=new URI(BuildConfig.FOAMA_BASE_URL);
        if(!"https".equals(requested.getScheme())||!origin.getHost().equals(requested.getHost())||origin.getPort()!=requested.getPort()||requested.getUserInfo()!=null||!(requested.getPath().startsWith("/api/")||requested.getPath().equals("/update.json")))throw new IOException("Ungültiges API-Ziel");
        HttpURLConnection con=scope.open(new URL(url));
        try{
            con.setInstanceFollowRedirects(false);con.setRequestMethod(method);con.setConnectTimeout(12000);con.setReadTimeout(12000);con.setRequestProperty("Accept","application/json");if(transferSecret!=null)con.setRequestProperty("X-Transfer-Secret",transferSecret);scope.check();
            if(payload!=null){con.setDoOutput(true);con.setRequestProperty("Content-Type","application/json");try(OutputStream out=con.getOutputStream()){out.write(payload.toString().getBytes(StandardCharsets.UTF_8));}}
            int code=con.getResponseCode();scope.check();if(code<200||code>=300)throw new IOException("HTTP "+code);
            String result=new String(readBytes(con.getInputStream()),StandardCharsets.UTF_8);scope.check();return result;
        }finally{con.disconnect();scope.release(con);}
    }
    void fetchDepartures(List<Stop> selected,List<String> ids)throws Exception{
        fetchDepartures(selected,ids,new RequestScope());
    }
    void fetchDepartures(List<Stop> selected,List<String> ids,RequestScope scope)throws Exception{
        scope.check();
        long elapsed=SystemClock.elapsedRealtime();if(ids.isEmpty()||elapsed<nextFetchElapsed)return;
        nextFetchElapsed=elapsed+WearPolicy.REFRESH_MS;
        try{
            StringBuilder url=new StringBuilder(BuildConfig.FOAMA_BASE_URL+"/api/monitor?");for(String id:ids){if(!id.matches("[0-9]{1,8}"))throw new IOException("Ungültiger Haltepunkt");url.append("stopId=").append(id).append('&');}
            JSONObject payload=new JSONObject(jsonHttp(url.toString(),"GET",null,scope));
            scope.commit(()->{mergeMonitor(payload,selected,ids,System.currentTimeMillis());lastError="";failures=0;lastFetch=System.currentTimeMillis();mergeRail(selected);saveCache();});
        }catch(Exception e){if(scope.isCancelled())return;scope.commit(()->{failures++;nextFetchElapsed=SystemClock.elapsedRealtime()+WearPolicy.retryDelay(failures);lastError=e.getMessage()!=null&&e.getMessage().matches("HTTP [0-9]{3}")?"Livedaten: "+e.getMessage():"Livedaten nicht erreichbar";});throw new IOException(lastError);}
    }
    void mergeMonitor(JSONObject payload,List<Stop> selected,List<String> ids,long now)throws Exception{
        JSONObject data=payload.optJSONObject("data");JSONArray monitors=data==null?null:data.optJSONArray("monitors");
        JSONObject message=payload.optJSONObject("message");if(monitors==null||(message!=null&&message.optInt("value",1)!=1))throw new IOException("Ungültige API-Antwort");
        mergeLineEvidence(payload,now);
        ArrayList<Departure> additions=new ArrayList<>();
        for(int i=0;i<monitors.length();i++){
            JSONObject m=monitors.getJSONObject(i),location=m.optJSONObject("locationStop"),p=location==null?null:location.optJSONObject("properties"),attrs=p==null?null:p.optJSONObject("attributes");if(attrs==null)continue;
            String rbl=attrs.optString("rbl");if(!ids.contains(rbl))continue;
            Stop s=null;for(Stop candidate:selected)if(candidate.rbl.contains(rbl)){s=candidate;break;}if(s==null)continue;
            boolean notice=hasCurrentServiceNotice(data,m,now);
            JSONArray lines=m.optJSONArray("lines");if(lines==null)continue;
            for(int j=0;j<lines.length();j++){
                JSONObject l=lines.getJSONObject(j),ds=l.optJSONObject("departures");JSONArray times=ds==null?null:ds.optJSONArray("departure");if(times==null)continue;
                for(int k=0;k<times.length();k++){
                    JSONObject entry=times.getJSONObject(k),t=entry.optJSONObject("departureTime"),v=entry.optJSONObject("vehicle");if(t==null)continue;
                    String real=t.optString("timeReal"),plan=t.optString("timePlanned");long when=parseDate(real.isEmpty()?plan:real);if(!WearPolicy.usableDeparture(now,when,now))continue;
                    Departure d=new Departure();d.stopKey=s.id;d.rbl=rbl;d.route=v==null?l.optString("name"):v.optString("name",l.optString("name"));d.towards=v==null?l.optString("towards"):v.optString("towards",l.optString("towards"));
                    d.mode=inferMode(v==null?l.optString("type"):v.optString("type",l.optString("type")),d.route);d.quality=real.isEmpty()?"Fahrplan":"Live";d.when=when;d.fetchedAt=now;d.platform=l.optString("platform");d.notice=notice;additions.add(d);
                }
            }
        }
        synchronized(departures){
            departures.removeIf(d->ids.contains(d.rbl)||!WearPolicy.usableDeparture(now,d.when,d.fetchedAt));
            departures.addAll(additions);LinkedHashMap<String,Departure> unique=new LinkedHashMap<>();for(Departure d:departures)unique.put(d.key(),d);
            departures.clear();departures.addAll(unique.values());departures.sort(Comparator.comparingLong(d->d.when));while(departures.size()>MAX_CACHE_ROWS)departures.remove(departures.size()-1);
        }
    }
    static boolean hasCurrentServiceNotice(JSONObject data,JSONObject monitor,long now){
        JSONArray refs=monitor.optJSONArray("refTrafficInfoNames"),notices=data.optJSONArray("trafficInfos"),categories=data.optJSONArray("trafficInfoCategories");
        if(refs==null)return false;
        for(int i=0;i<refs.length();i++){
            String ref=refs.optString(i);boolean found=false;
            for(int j=0;notices!=null&&j<notices.length();j++){
                JSONObject notice=notices.optJSONObject(j);if(notice==null||!(ref.equals(notice.optString("name"))||ref.equals(notice.optString("parentName"))))continue;
                found=true;String category="";
                for(int k=0;categories!=null&&k<categories.length();k++){JSONObject c=categories.optJSONObject(k);if(c!=null&&c.optString("id").equals(notice.optString("refTrafficInfoCategoryId")))category=c.optString("name");}
                if(category.equals("aufzugsinfo")||category.equals("fahrtreppeninfo")||notice.optString("status").equalsIgnoreCase("resolved"))continue;
                JSONObject time=notice.optJSONObject("time");long start=time==null?-1:parseDate(time.optString("start")),end=time==null?-1:parseDate(time.optString("end"));
                if(start>now||(end>=0&&end<now))continue;
                return true;
            }
            // Missing details are not evidence that a referenced disruption is clear.
            if(!found&&!ref.isEmpty())return true;
        }
        return false;
    }
    void appendRail(List<Stop> targets,ArrayList<Departure> data){
        JSONArray rows=railFeed.optJSONArray("departures");JSONObject services=railFeed.optJSONObject("services");if(rows==null||services==null)return;
        HashSet<String> ids=new HashSet<>();HashMap<String,String> stopToGroup=new HashMap<>();for(Stop s:targets)if(s.provider.equals("rail")){ArrayList<String> platformList=s.platformIds.isEmpty()?new ArrayList<>(java.util.Collections.singletonList(s.id.replaceFirst("^rail:",""))):s.platformIds;for(String id:platformList){ids.add(id);stopToGroup.put(id,s.id);}}
        if(ids.isEmpty())return;java.time.ZonedDateTime now=java.time.ZonedDateTime.now(java.time.ZoneId.of("Europe/Vienna"));int nowSec=now.toLocalTime().toSecondOfDay();long nowMs=System.currentTimeMillis();
        for(int i=0;i<rows.length();i++){JSONObject r=rows.optJSONObject(i);if(r==null)continue;String id=r.optString("stop");if(!ids.contains(id))continue;JSONArray valid=services.optJSONArray(r.optString("service"));if(valid==null)continue;
            for(int shift=0;shift<=1;shift++){
                String day=now.toLocalDate().plusDays(shift).toString();boolean allowed=false;for(int t=0;t<valid.length();t++)if(day.equals(valid.optString(t))){allowed=true;break;}if(!allowed)continue;
                int delta=(r.optInt("seconds")+shift*86400)-nowSec;if(delta<-30||delta>7200)continue;Departure d=new Departure();d.stopKey=stopToGroup.get(id);d.route=r.optString("route");d.towards=r.optString("towards");d.mode=r.optString("mode","regional");d.when=nowMs+delta*1000L;d.quality="Fahrplan";d.fetchedAt=nowMs;d.platform=r.optString("platform");data.add(d);
            }
        }
    }
    void mergeRail(List<Stop> selected){ArrayList<Departure> rail=new ArrayList<>();appendRail(selected,rail);synchronized(departures){departures.removeIf(d->d.rbl.isEmpty());departures.addAll(rail);}}
    static long parseDate(String value){if(value==null)return -1;try{return java.time.OffsetDateTime.parse(value.replaceAll("([+-]\\d\\d)(\\d\\d)$","$1:$2")).toInstant().toEpochMilli();}catch(Exception e){return -1;}}
    static String inferMode(String type,String route){String t=type.toLowerCase(Locale.ROOT);if(t.contains("metro")||route.matches("U[0-9]+"))return "metro";if(t.contains("trains")||route.matches("S[0-9]+.*"))return "sbahn";if(t.contains("tram"))return "tram";if(t.contains("train"))return route.matches("(R[0-9]*|REX.*|CJX.*)")?"regional":"long";return "bus";}
    List<List<Departure>> connections(Stop s,String route,String towards,boolean favoriteView){
        LinkedHashMap<String,List<Departure>> groups=new LinkedHashMap<>();long now=System.currentTimeMillis();
        synchronized(departures){for(Departure d:departures)if(d.stopKey.equals(s.id)&&WearPolicy.usableDeparture(now,d.when,d.fetchedAt)&&(route.isEmpty()||route.equals(d.route))&&(towards.isEmpty()||towards.equals(d.towards))&&(favoriteView||modeAllowed(d.mode)))groups.computeIfAbsent(d.route+"|"+d.towards,key->new ArrayList<>()).add(d);}
        ArrayList<List<Departure>> out=new ArrayList<>(groups.values());for(List<Departure> g:out)g.sort(Comparator.comparingLong(d->d.when));out.sort(Comparator.comparingInt((List<Departure> g)->WearPolicy.modePriority(g.get(0).mode)).thenComparingLong(g->g.get(0).when));return out;
    }
    int countdown(Departure d){return WearPolicy.minutes(d.when,System.currentTimeMillis());}
    boolean fresh(Departure d){return WearPolicy.fresh(System.currentTimeMillis(),d.fetchedAt,!lastError.isEmpty());}
    String quality(Departure d){return fresh(d)?d.quality.toUpperCase(Locale.ROOT):"ÄLTER";}
    String feasibility(Stop s,Departure d){
        if(!reliableLocation()||!fresh(d)||airDistance(s)>2000)return "○ Ungewiss";
        double reserve=(d.when-System.currentTimeMillis())/60000.0-walkMinutes(s)-prefs.getInt("buffer",1);
        return reserve>=3?"● Erreichbar":reserve>=0?"● Knapp":"● Kaum erreichbar";
    }
    void saveCache(){
        try{
            JSONArray rows=new JSONArray();int bytes=2;long now=System.currentTimeMillis();
            synchronized(departures){
                departures.removeIf(d->!WearPolicy.usableDeparture(now,d.when,d.fetchedAt));departures.sort(Comparator.comparingLong(d->d.when));
                while(departures.size()>MAX_CACHE_ROWS)departures.remove(departures.size()-1);
                for(Departure d:departures){
                    JSONObject x=new JSONObject();x.put("stopKey",d.stopKey);x.put("rbl",d.rbl);x.put("route",d.route);x.put("towards",d.towards);x.put("mode",d.mode);x.put("quality",d.quality);x.put("when",d.when);x.put("fetchedAt",d.fetchedAt);x.put("notice",d.notice);
                    int size=x.toString().getBytes(StandardCharsets.UTF_8).length+(rows.length()==0?0:1);if(bytes+size>MAX_CACHE_BYTES)continue;rows.put(x);bytes+=size;
                }
            }
            SharedPreferences.Editor editor=prefs.edit();if(rows.length()==0)editor.remove("departures");else editor.putString("departures",rows.toString());editor.apply();
        }catch(Exception ignored){}
    }
    void loadCache(){
        try{
            JSONArray rows=new JSONArray(prefs.getString("departures","[]"));long now=System.currentTimeMillis();
            for(int i=0;i<Math.min(MAX_CACHE_ROWS,rows.length());i++){
                JSONObject x=rows.optJSONObject(i);if(x==null||findStop(x.optString("stopKey"))==null||!WearPolicy.usableDeparture(now,x.optLong("when"),x.optLong("fetchedAt")))continue;
                Departure d=new Departure();d.stopKey=x.optString("stopKey");d.rbl=x.optString("rbl");d.route=x.optString("route");d.towards=x.optString("towards");d.mode=x.optString("mode");d.quality=x.optString("quality");d.when=x.optLong("when");d.fetchedAt=x.optLong("fetchedAt");d.notice=x.optBoolean("notice");departures.add(d);
            }
        }catch(Exception ignored){}
        saveCache(); // Remove expired/invalid persisted rows on opening, including offline starts.
    }
    void pause(){currentLocation=null;movingUntil=0;saveCache();}
}
