package at.foama.wien;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.util.AtomicFile;
import android.util.Base64;
import org.json.*;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.*;

/** Complete local schedules. Calendar validity is checked on every read, never extended by a download. */
final class OfflineTimetable {
    static final ZoneId ZONE=ZoneId.of("Europe/Vienna");
    static final int MAX_ARCHIVE=4*1024*1024, MAX_SHARD=768*1024, MAX_EXPANDED=2*1024*1024;
    static final long CHECK_MS=86400000L, RETRY_MS=3600000L;
    private final Context context;
    private final SharedPreferences prefs;
    private final File directory;
    private final ArrayList<Snapshot> snapshots=new ArrayList<>();
    private Snapshot bundled;
    volatile String updateMessage="";
    volatile boolean updating;

    OfflineTimetable(Context context,SharedPreferences prefs){
        this.context=context;this.prefs=prefs;directory=new File(context.getFilesDir(),"offline-timetable");
        try{
            if(!directory.isDirectory()&&!directory.mkdirs())throw new IOException();
            File asset=new File(directory,"bundled-"+BuildConfig.VERSION_CODE+".zip");
            if(!asset.isFile()){
                AtomicFile atomic=new AtomicFile(asset);FileOutputStream out=null;
                try(InputStream in=context.getAssets().open("timetable-wien.zip")){
                    out=atomic.startWrite();copy(in,out,MAX_ARCHIVE,null);atomic.finishWrite(out);out=null;
                }finally{if(out!=null)atomic.failWrite(out);}
            }
            bundled=new Snapshot(asset,false);snapshots.add(bundled);
            JSONArray installed=new JSONArray(prefs.getString("offlineTimetableFiles","[]"));
            for(int i=0;i<Math.min(2,installed.length());i++){
                String name=installed.optString(i);if(!name.matches("installed-[a-f0-9]{64}\\.zip"))continue;
                try{snapshots.add(new Snapshot(new File(directory,name),false));}catch(Exception ignored){}
            }
            cleanup();
        }catch(Exception ignored){updateMessage="Offline-Fahrplan nicht lesbar. Bitte aktualisieren.";}
    }
    static boolean online(Context context){
        try{ConnectivityManager manager=(ConnectivityManager)context.getSystemService(Context.CONNECTIVITY_SERVICE);
            NetworkCapabilities capabilities=manager==null?null:manager.getNetworkCapabilities(manager.getActiveNetwork());
            return capabilities!=null&&capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        }catch(RuntimeException ignored){return false;}
    }
    private static LocalDate day(long now){return Instant.ofEpochMilli(now).atZone(ZONE).toLocalDate();}
    synchronized Snapshot current(long now){
        Snapshot best=null;LocalDate date=day(now);
        for(Snapshot snapshot:snapshots)if(snapshot.valid(date)&&(best==null||snapshot.through.isAfter(best.through)||snapshot.through.equals(best.through)&&snapshot!=bundled))best=snapshot;
        return best;
    }
    private synchronized Snapshot latest(){
        Snapshot best=null;for(Snapshot snapshot:snapshots)if(best==null||snapshot.through.isAfter(best.through)||snapshot.through.equals(best.through)&&snapshot!=bundled)best=snapshot;return best;
    }
    synchronized String status(long now){
        Snapshot snapshot=current(now);DateTimeFormatter format=DateTimeFormatter.ofPattern("dd.MM.yyyy");
        if(snapshot!=null)return "Wien offline · gültig bis "+snapshot.through.format(format);
        snapshot=latest();if(snapshot==null)return "Offline-Fahrplan fehlt · bitte aktualisieren";
        return day(now).isBefore(snapshot.from)?"Fahrplan erst ab "+snapshot.from.format(format)+" gültig":"Fahrplan abgelaufen · bitte aktualisieren";
    }
    synchronized String details(long now){
        Snapshot snapshot=current(now);if(snapshot==null)snapshot=latest();
        if(snapshot==null)return "Bitte mit dem Internet verbinden und Fahrplan laden.";
        return snapshot.stations.length()+" Stationen · "+snapshot.from.format(DateTimeFormatter.ofPattern("dd.MM."))+"–"+snapshot.through.format(DateTimeFormatter.ofPattern("dd.MM.yyyy"))+"\nWiener Zeit · danach keine Offline-Abfahrten.\nDatenquelle: Stadt Wien – Wiener Linien · CC BY 4.0";
    }
    synchronized boolean due(long now){
        long checked=prefs.getLong("offlineTimetableCheckedAt",0),attempt=prefs.getLong("offlineTimetableAttemptAt",0);
        return !updating&&(attempt<=0||now<attempt||now-attempt>=RETRY_MS)&&(checked<=0||now<checked||now-checked>=CHECK_MS||current(now)==null);
    }
    /** Called only by a visible Activity, on its own cancellable worker. */
    void update(RequestScope scope,boolean force)throws Exception {
        update(scope,force,System.currentTimeMillis());
    }
    void update(RequestScope scope,boolean force,long now)throws Exception {
        synchronized(this){if(updating||!force&&!due(now))return;updating=true;}
        try{
            scope.check();if(!online(context)){updateMessage="Kein Internet. Fahrplan mit Verbindung aktualisieren.";return;}
            prefs.edit().putLong("offlineTimetableAttemptAt",now).apply();updateMessage="Fahrplan wird geprüft …";
            JSONObject metadata=new JSONObject(new String(get("watch.json",65536,scope),StandardCharsets.UTF_8));
            String digest=metadata.optString("sha256"),filename=metadata.optString("filename");int bytes=metadata.optInt("bytes");
            if(metadata.optInt("format")!=1||!metadata.optString("city").equals("wien")||!metadata.optString("timezone").equals(ZONE.getId())||!digest.matches("[a-f0-9]{64}")||!filename.equals("watch-"+digest.substring(0,20)+".zip")||bytes<100||bytes>MAX_ARCHIVE)throw new IOException("Ungültige Fahrplandaten");
            LocalDate from=LocalDate.parse(metadata.getString("validFrom")),through=LocalDate.parse(metadata.getString("validThrough"));
            if(through.isBefore(from)||day(now).isAfter(through))throw new IOException("Noch kein neuer gültiger Fahrplan verfügbar");
            List<Snapshot> local; synchronized(this){local=new ArrayList<>(snapshots);}
            for(Snapshot existing:local){
                scope.check();if(!hex(read(new FileInputStream(existing.file),MAX_ARCHIVE)).equals(digest))continue;
                verifyMetadata(existing,metadata);scope.commit(()->{prefs.edit().putLong("offlineTimetableCheckedAt",now).apply();updateMessage="Fahrplan aktuell · "+status(now);});return;
            }
            File target=new File(directory,"installed-"+digest+".zip");
            if(!target.exists()){
                updateMessage="Wiener Fahrplan wird geladen …";
                byte[] payload=get(filename,MAX_ARCHIVE,scope);scope.check();
                if(payload.length!=bytes||!hex(payload).equals(digest))throw new IOException("Fahrplan unvollständig");
                File temporary=new File(directory,"download.part");
                try{
                    try(FileOutputStream out=new FileOutputStream(temporary)){out.write(payload);out.getFD().sync();}
                    Snapshot candidate=new Snapshot(temporary,true);verifyMetadata(candidate,metadata);
                    scope.commit(()->{if(!temporary.renameTo(target))throw new IOException("Fahrplan nicht gespeichert");});
                }finally{temporary.delete();}
            }
            Snapshot installed=new Snapshot(target,true);verifyMetadata(installed,metadata);
            scope.commit(()->{
                synchronized(this){
                    Snapshot active=current(now);ArrayList<Snapshot> next=new ArrayList<>();next.add(installed);
                    if(active!=null&&active!=bundled&&!active.file.equals(target))next.add(active);
                    if(next.size()<2)for(Snapshot existing:snapshots)if(existing!=bundled&&!existing.file.equals(target)&&existing.through.isAfter(through)){next.add(existing);break;}
                    next.remove(installed);next.add(installed);
                    JSONArray names=new JSONArray();for(Snapshot item:next)names.put(item.file.getName());
                    if(!prefs.edit().putString("offlineTimetableFiles",names.toString()).putLong("offlineTimetableCheckedAt",now).commit())throw new IOException("Fahrplan nicht gespeichert");
                    snapshots.clear();if(bundled!=null)snapshots.add(bundled);for(Snapshot item:next)if(item!=installed)snapshots.add(item);snapshots.add(installed);cleanup();
                    updateMessage=current(now)==null?status(now):"Fahrplan aktuell · "+status(now);
                }
            });
        }catch(Exception error){if(!scope.isCancelled())updateMessage=error instanceof IOException&&error.getMessage()!=null&&error.getMessage().startsWith("Noch kein")?error.getMessage():"Fahrplan nicht aktualisiert. Erneut versuchen.";throw error;
        }finally{updating=false;}
    }
    private void verifyMetadata(Snapshot snapshot,JSONObject metadata)throws IOException {
        for(String key:new String[]{"version","validFrom","validThrough","sourceSha256"})if(!snapshot.manifest.optString(key).equals(metadata.optString(key)))throw new IOException("Fahrplanversion passt nicht");
        if(snapshot.stations.length()!=metadata.optInt("stations"))throw new IOException("Fahrplan unvollständig");
    }
    private void cleanup(){
        Set<String> keep=new HashSet<>();for(Snapshot snapshot:snapshots)keep.add(snapshot.file.getName());
        File[] files=directory.listFiles();if(files!=null)for(File file:files)if((file.getName().startsWith("bundled-")||file.getName().startsWith("installed-"))&&file.getName().endsWith(".zip")&&!keep.contains(file.getName()))file.delete();
    }
    private byte[] get(String name,int maximum,RequestScope scope)throws Exception {
        HttpURLConnection connection=scope.open(new URL(BuildConfig.FOAMA_BASE_URL+"/data/timetables/wien/"+name));
        try{
            connection.setInstanceFollowRedirects(false);connection.setConnectTimeout(10000);connection.setReadTimeout(15000);connection.setRequestProperty("Accept","application/json, application/zip");connection.setRequestProperty("Cache-Control","no-cache");
            if(connection.getResponseCode()!=200||connection.getContentLengthLong()>maximum)throw new IOException("Fahrplan nicht verfügbar");
            try(InputStream in=connection.getInputStream()){ByteArrayOutputStream out=new ByteArrayOutputStream();copy(in,out,maximum,scope);return out.toByteArray();}
        }finally{connection.disconnect();scope.release(connection);}
    }
    static void copy(InputStream in,OutputStream out,int limit,RequestScope scope)throws IOException {
        byte[] buffer=new byte[16384];int read,total=0;while((read=in.read(buffer))!=-1){if(scope!=null)scope.check();total+=read;if(total>limit)throw new IOException("Fahrplan zu groß");out.write(buffer,0,read);}
    }
    static byte[] read(InputStream in,int limit)throws IOException {try(InputStream source=in){ByteArrayOutputStream out=new ByteArrayOutputStream();copy(source,out,limit,null);return out.toByteArray();}}
    static String hex(byte[] bytes)throws IOException {try{byte[] digest=MessageDigest.getInstance("SHA-256").digest(bytes);StringBuilder result=new StringBuilder();for(byte item:digest)result.append(String.format(Locale.ROOT,"%02x",item&255));return result.toString();}catch(Exception e){throw new IOException(e);}}
    List<Repo.Departure> departures(String stopId,long now){
        Snapshot snapshot=current(now);if(snapshot==null)return Collections.emptyList();
        try{return snapshot.departures(stopId,now);}catch(Exception ignored){return Collections.emptyList();}
    }
    static final class Snapshot {
        final File file;final JSONObject manifest,stations,shards;final JSONArray services;
        final LocalDate from,through;final long expires;
        private final LinkedHashMap<String,JSONObject> cache=new LinkedHashMap<>(4,.75f,true);
        private final LinkedHashMap<String,JSONArray> stationRows=new LinkedHashMap<>(64,.75f,true);
        Snapshot(File file,boolean verify)throws Exception {
            this.file=file;
            try(ZipFile zip=new ZipFile(file)){
                ZipEntry entry=zip.getEntry("manifest.json");if(entry==null||zip.size()!=33)throw new IOException("Unvollständiger Fahrplan");
                manifest=new JSONObject(new String(read(zip.getInputStream(entry),256*1024),StandardCharsets.UTF_8));
                if(manifest.optInt("format")!=1||!manifest.optString("city").equals("wien")||!manifest.optString("timezone").equals(ZONE.getId())||!manifest.optString("version").matches("[a-f0-9]{20}")||!manifest.optString("sourceSha256").matches("[a-f0-9]{64}"))throw new IOException("Ungültiger Fahrplan");
                from=LocalDate.parse(manifest.getString("validFrom"));through=LocalDate.parse(manifest.getString("validThrough"));
                if(through.isBefore(from)||through.isAfter(from.plusDays(90)))throw new IOException("Ungültige Gültigkeit");
                expires=through.plusDays(1).atStartOfDay(ZONE).toInstant().toEpochMilli();
                stations=manifest.getJSONObject("stations");shards=manifest.getJSONObject("shards");services=manifest.getJSONArray("services");
                if(stations.length()<1||stations.length()>5000||shards.length()!=32||services.length()<1||services.length()>4096)throw new IOException("Ungültiger Fahrplanumfang");
                for(int i=0;i<32;i++)if(!shards.has(""+i)||zip.getEntry(i+".json")==null)throw new IOException("Fehlendes Stationspaket");
                if(verify){int count=0;for(int i=0;i<32;i++){JSONObject rows=shard(zip,""+i);count+=rows.length();Iterator<String> ids=rows.keys();while(ids.hasNext()){String id=ids.next();if(stations.optInt(id,-1)!=i||rows.optJSONArray(id)==null)throw new IOException("Falsches Stationspaket");}}
                    if(count!=stations.length())throw new IOException("Unvollständiger Fahrplan");}
            }
        }
        boolean valid(LocalDate date){return !date.isBefore(from)&&!date.isAfter(through);}
        private JSONObject shard(ZipFile zip,String key)throws Exception {
            ZipEntry entry=zip.getEntry(key+".json");byte[] raw=read(zip.getInputStream(entry),MAX_SHARD);
            if(!hex(raw).substring(0,16).equals(shards.optString(key)))throw new IOException("Beschädigtes Stationspaket");
            JSONObject envelope=new JSONObject(new String(raw,StandardCharsets.UTF_8));
            if(envelope.optInt("format")!=1||!envelope.optString("version").equals(manifest.getString("version"))||!envelope.optString("encoding").equals("gzip-base64"))throw new IOException("Falsche Fahrplanversion");
            byte[] compressed=Base64.decode(envelope.getString("payload"),Base64.DEFAULT);
            return new JSONObject(new String(read(new GZIPInputStream(new ByteArrayInputStream(compressed)),MAX_EXPANDED),StandardCharsets.UTF_8));
        }
        private synchronized JSONArray rows(String stopId)throws Exception {
            if(stationRows.containsKey(stopId))return stationRows.get(stopId);
            if(!stations.has(stopId))return new JSONArray();String key=""+stations.getInt(stopId);JSONObject data=cache.get(key);
            if(data==null){try(ZipFile zip=new ZipFile(file)){data=shard(zip,key);}cache.put(key,data);while(cache.size()>3)cache.remove(cache.keySet().iterator().next());}
            JSONArray rows=data.optJSONArray(stopId);if(rows==null)rows=new JSONArray();stationRows.put(stopId,rows);while(stationRows.size()>64)stationRows.remove(stationRows.keySet().iterator().next());return rows;
        }
        List<Repo.Departure> departures(String stopId,long now)throws Exception {
            ArrayList<Repo.Departure> result=new ArrayList<>();LocalDate today=day(now);if(!valid(today))return result;
            JSONArray rows=rows(stopId);long horizon=Math.min(now+10800000L,expires-1);HashSet<String> seen=new HashSet<>();
            for(int i=0;i<rows.length();i++){
                JSONArray row=rows.getJSONArray(i);if(row.length()!=7)continue;int service=row.optInt(5,-1);JSONArray dates=services.optJSONArray(service),seconds=row.optJSONArray(6);if(dates==null||seconds==null)continue;
                for(int shift=-1;shift<=1;shift++){
                    LocalDate date=today.plusDays(shift);boolean runs=false;for(int j=0;j<dates.length();j++)if(date.toString().equals(dates.optString(j))){runs=true;break;}if(!runs)continue;
                    // GTFS: service day starts at local noon minus twelve hours, including DST changes.
                    long base=date.atTime(12,0).atZone(ZONE).minusHours(12).toInstant().toEpochMilli();int taken=0;
                    for(int j=0;j<seconds.length();j++){
                        int second=seconds.optInt(j,-1);if(second<0||second>=172800)continue;long at=base+second*1000L;if(at<now)continue;if(at>horizon)break;
                        Repo.Departure departure=new Repo.Departure();departure.stopKey=stopId;departure.route=row.optString(0);departure.towards=row.optString(1);departure.mode=row.optString(2);departure.when=at;departure.offline=true;departure.quality="Fahrplan";
                        if(!departure.route.isEmpty()&&!departure.towards.isEmpty()&&seen.add(departure.key()))result.add(departure);if(++taken>=2)break;
                    }
                }
            }
            result.sort(Comparator.comparingLong(d->d.when));return result;
        }
    }
}
