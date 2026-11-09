package at.foama.wien;
import android.content.SharedPreferences;
import org.json.*;
import java.util.*;

/** Explicitly transferred route templates; no historical live times or GPS fix. */
final class JourneyStore {
    static final String KEY="journeyFavorites";
    private final SharedPreferences prefs;
    JourneyStore(SharedPreferences prefs){this.prefs=prefs;}
    static String text(Object value,int limit){String s=value==null||value==JSONObject.NULL?"":String.valueOf(value).trim();return s.substring(0,Math.min(limit,s.length()));}
    static JSONObject endpoint(JSONObject p)throws Exception {
        if(p==null)throw new IllegalArgumentException("Start oder Ziel fehlt");
        if(p.optString("kind").equals("current"))return new JSONObject().put("kind","current").put("name","Dein Standort");
        double lat=p.optDouble("lat"),lon=p.optDouble("lon");if(!(p.opt("lat") instanceof Number)||!(p.opt("lon") instanceof Number)||!Double.isFinite(lat)||!Double.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw new IllegalArgumentException("Ungültiger Ort");
        return new JSONObject().put("kind","point").put("name",text(p.opt("name"),160)).put("lat",lat).put("lon",lon);
    }
    static JSONObject place(JSONObject p)throws Exception {
        if(p==null||text(p.opt("name"),160).isEmpty())throw new IllegalArgumentException("Stationsname fehlt");String id=p.optString("stopId","");
        return new JSONObject().put("name",text(p.opt("name"),160)).put("stopId",id.matches("^(wl|rail):[\\w:-]{1,100}$")?id:JSONObject.NULL).put("platform",text(p.opt("platform"),30));
    }
    static JSONObject sanitize(JSONObject input)throws Exception {
        if(input==null)throw new IllegalArgumentException("Ungültige Route");String id=input.optString("id");long saved=input.optLong("savedAt",-1);JSONArray raw=input.optJSONArray("legs");
        if(!(input.opt("id") instanceof String)||!(input.opt("savedAt") instanceof Number)||id.isEmpty()||id.length()>80||saved<0||raw==null||raw.length()==0||raw.length()>32)throw new IllegalArgumentException("Ungültige Route");
        JSONObject from=endpoint(input.optJSONObject("from")),to=endpoint(input.optJSONObject("to"));JSONArray legs=new JSONArray();
        for(int i=0;i<raw.length();i++){
            JSONObject source=raw.optJSONObject(i);if(source==null)throw new IllegalArgumentException("Ungültiger Abschnitt");String mode=source.optString("mode"),route=text(source.opt("route"),40);double duration=source.optDouble("durationSeconds"),distance=source.optDouble("distanceMeters");
            if(!Arrays.asList("metro","tram","bus","sbahn","regional","long","walk").contains(mode)||!(source.opt("durationSeconds") instanceof Number)||!Double.isFinite(duration)||duration<0||duration>172800||(!mode.equals("walk")&&route.isEmpty()))throw new IllegalArgumentException("Ungültiger Abschnitt");
            JSONObject a=place(source.optJSONObject("from")),b=place(source.optJSONObject("to"));
            if(i==0&&from.optString("kind").equals("current"))a.put("name","Dein Standort");if(i==raw.length()-1&&to.optString("kind").equals("current"))b.put("name","Dein Standort");
            legs.put(new JSONObject().put("mode",mode).put("route",route).put("towards",text(source.opt("towards"),160)).put("from",a).put("to",b).put("durationSeconds",duration).put("distanceMeters",Double.isFinite(distance)?Math.max(0,distance):JSONObject.NULL).put("staySeated",source.optBoolean("staySeated")));
        }
        String name=text(input.opt("name"),160);if(name.isEmpty())name=from.optString("name")+" → "+to.optString("name");
        JSONObject result=new JSONObject().put("id",id).put("name",name).put("savedAt",saved).put("from",from).put("to",to).put("legs",legs);
        JSONArray options=input.optJSONArray("alternatives");if(input.has("alternatives")&&(options==null||options.length()>15))throw new IllegalArgumentException("Höchstens 16 Wege pro Route");JSONArray alternatives=new JSONArray();Set<String> seen=new HashSet<>();seen.add(pathKey(result));
        if(options!=null)for(int i=0;i<options.length();i++){JSONObject option=options.optJSONObject(i);if(option==null)throw new IllegalArgumentException("Ungültige Alternative");JSONObject safe=sanitize(new JSONObject().put("id",id).put("name",name).put("savedAt",saved).put("from",from).put("to",to).put("legs",option.getJSONArray("legs")));if(seen.add(pathKey(safe)))alternatives.put(new JSONObject().put("legs",safe.getJSONArray("legs")));}
        if(alternatives.length()>0)result.put("alternatives",alternatives);return result;
    }
    JSONArray all(){JSONArray out=new JSONArray();try{String json=prefs.getString(KEY,"[]");if(json.length()>512*1024)return out;JSONArray rows=new JSONArray(json);for(int i=0;i<Math.min(30,rows.length());i++)try{out.put(sanitize(rows.getJSONObject(i)));}catch(Exception ignored){}}catch(Exception ignored){}return out;}
    JSONObject get(String id){JSONArray rows=all();for(int i=0;i<rows.length();i++){JSONObject row=rows.optJSONObject(i);if(row.optString("id").equals(id))return row;}return null;}
    static String legKey(JSONObject leg){JSONObject a=leg.optJSONObject("from"),b=leg.optJSONObject("to");return leg.optString("mode")+"|"+leg.optString("route")+"|"+a.optString("stopId",a.optString("name"))+"|"+b.optString("stopId",b.optString("name"))+"|"+direction(leg.optString("towards"))+"|"+leg.optBoolean("staySeated");}
    static String pathKey(JSONObject value){StringBuilder key=new StringBuilder();for(JSONObject leg:boardings(value))key.append(legKey(leg)).append('\n');return key.toString();}
    static String identity(JSONObject value){return value.optJSONObject("from").toString()+"|"+value.optJSONObject("to").toString()+"|"+pathKey(value);}
    static int variantCount(JSONObject value){JSONArray a=value==null?null:value.optJSONArray("alternatives");return 1+(a==null?0:a.length());}
    static JSONObject variant(JSONObject value,int index){if(index<=0)return value;try{JSONArray options=value.optJSONArray("alternatives");if(options==null||index>options.length())return value;return new JSONObject().put("id",value.getString("id")).put("name",value.getString("name")).put("savedAt",value.getLong("savedAt")).put("from",value.getJSONObject("from")).put("to",value.getJSONObject("to")).put("legs",options.getJSONObject(index-1).getJSONArray("legs"));}catch(Exception ignored){return value;}}
    static int commonBoardings(JSONObject a,JSONObject b){List<JSONObject> left=boardings(a),right=boardings(b);int i=0;while(i<left.size()&&i<right.size()&&legKey(left.get(i)).equals(legKey(right.get(i))))i++;return i;}
    static boolean sameFamily(JSONObject a,JSONObject b){if(!a.optJSONObject("from").toString().equals(b.optJSONObject("from").toString())||!a.optJSONObject("to").toString().equals(b.optJSONObject("to").toString()))return false;for(int i=0;i<variantCount(a);i++)for(int j=0;j<variantCount(b);j++)if(pathKey(variant(a,i)).equals(pathKey(variant(b,j))))return true;return false;}
    static JSONObject combine(JSONObject base,JSONObject incoming)throws Exception {JSONObject out=new JSONObject(base.toString());JSONArray options=new JSONArray();Set<String> seen=new HashSet<>();seen.add(pathKey(base));for(JSONObject source:new JSONObject[]{base,incoming})for(int i=0;i<variantCount(source);i++){JSONObject path=variant(source,i);if(seen.add(pathKey(path))){if(options.length()>=15)throw new IllegalArgumentException("Höchstens 16 Wege pro Route");options.put(new JSONObject().put("legs",path.getJSONArray("legs")));}}if(options.length()>0)out.put("alternatives",options);return out;}
    static final class Preview {final JSONArray additions=new JSONArray();int duplicates,updated;}
    static void putChange(Preview result,JSONObject row)throws Exception {for(int i=0;i<result.additions.length();i++)if(result.additions.getJSONObject(i).getString("id").equals(row.getString("id"))){result.additions.put(i,row);return;}result.additions.put(row);}
    Preview preview(JSONArray incoming)throws Exception {
        if(incoming==null)incoming=new JSONArray();if(incoming.length()>30)throw new IllegalArgumentException("Höchstens 30 Routen");JSONArray working=all();Set<String> ids=new HashSet<>();for(int i=0;i<working.length();i++)ids.add(working.getJSONObject(i).getString("id"));
        Preview result=new Preview();for(int i=0;i<incoming.length();i++){JSONObject row=sanitize(incoming.getJSONObject(i));int match=-1;for(int j=0;j<working.length();j++)if(sameFamily(working.getJSONObject(j),row)){match=j;break;}
            if(match>=0){JSONObject prior=working.getJSONObject(match),merged=combine(prior,row);if(variantCount(merged)>variantCount(prior)){putChange(result,merged);working.put(match,merged);result.updated++;}else result.duplicates++;continue;}
            if(working.length()>=30)throw new IllegalArgumentException("Auf dieser Uhr sind höchstens 30 Routen möglich");if(ids.contains(row.getString("id")))row.put("id",UUID.randomUUID().toString());ids.add(row.getString("id"));working.put(row);putChange(result,row);
        }return result;
    }
    JSONArray merged(JSONArray incoming)throws Exception {Preview preview=preview(incoming);JSONArray out=all();for(int i=0;i<preview.additions.length();i++){JSONObject row=preview.additions.getJSONObject(i);int match=-1;for(int j=0;j<out.length();j++)if(out.getJSONObject(j).getString("id").equals(row.getString("id"))){match=j;break;}if(match>=0)out.put(match,row);else out.put(row);}if(out.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8).length>512*1024)throw new IllegalArgumentException("Routenspeicher voll. Bitte weniger Routen übertragen.");return out;}
    int merge(JSONArray incoming)throws Exception {JSONArray before=all(),after=merged(incoming);if(!prefs.edit().putString(KEY,after.toString()).commit())throw new IllegalStateException("Routen konnten nicht gespeichert werden");return after.length()-before.length();}
    void remove(String id){JSONArray out=new JSONArray(),rows=all();for(int i=0;i<rows.length();i++){JSONObject row=rows.optJSONObject(i);if(!row.optString("id").equals(id))out.put(row);}prefs.edit().putString(KEY,out.toString()).apply();}
    static List<JSONObject> boardings(JSONObject journey){ArrayList<JSONObject> out=new ArrayList<>();JSONArray legs=journey==null?null:journey.optJSONArray("legs");if(legs!=null)for(int i=0;i<legs.length();i++){JSONObject leg=legs.optJSONObject(i);if(leg!=null&&!leg.optString("mode").equals("walk"))out.add(leg);}return out;}
    static List<Repo.Departure> departures(JSONObject leg,Repo repo){
        ArrayList<Repo.Departure> out=new ArrayList<>();JSONObject origin=leg.optJSONObject("from");Repo.Stop stop=origin==null?null:repo.findStop(origin.optString("stopId"));String towards=direction(leg.optString("towards"));if(stop==null||towards.isEmpty())return out;
        if(!repo.lastError.isEmpty())return out;for(Repo.Departure d:new ArrayList<>(repo.departures))if(d.stopKey.equals(stop.id)&&d.route.equals(leg.optString("route"))&&d.mode.equals(leg.optString("mode"))&&directionMatches(towards,d.towards)&&d.when>=System.currentTimeMillis()&&repo.fresh(d))out.add(d);out.sort(Comparator.comparingLong(d->d.when));return out;
    }
    static String direction(String value){return value.replaceFirst("(?i)^Wien\\s+","").trim().toLowerCase(java.util.Locale.GERMAN);}
    static String[] directionParts(String value){String label=direction(value);java.util.regex.Matcher via=java.util.regex.Pattern.compile("\\s+\\((?:über|üb\\.?|via)\\s+(.+)\\)$").matcher(label);boolean hasVia=via.find();String name=(hasVia?label.substring(0,via.start()):label).replaceFirst("\\s+(?:s\\s+u|u\\s+s|s|u)$","").trim();return new String[]{name,hasVia?via.group(1):""};}
    static boolean directionMatches(String expected,String actual){String[] wanted=directionParts(expected),found=directionParts(actual);return !wanted[0].isEmpty()&&wanted[0].equals(found[0])&&(wanted[1].isEmpty()||wanted[1].equals(found[1]));}
}
