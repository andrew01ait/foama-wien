package at.foama.wien;

import java.util.*;
import org.json.JSONObject;

/** At most four passive public forecasts in RAM. Reading never refreshes source age. */
final class ApproachCache {
    static final long KEEP_MS=300000;
    static final class Entry {final JSONObject data;final String message;final long savedAt;Entry(JSONObject data,String message,long at){this.data=data;this.message=message;this.savedAt=at;}}
    private final LinkedHashMap<String,Entry> entries=new LinkedHashMap<>(4,.75f,true);
    static String key(String stop,String route,String towards,String mode){return stop+"|"+route+"|"+towards+"|"+mode;}
    Entry get(String key,long now){entries.values().removeIf(e->now-e.savedAt>KEEP_MS||e.savedAt>now+30000);return entries.get(key);}
    void put(String key,JSONObject data,String message,long now){if(data==null||data.toString().length()>65536)return;entries.put(key,new Entry(data,message,now));while(entries.size()>4)entries.remove(entries.keySet().iterator().next());}
}
