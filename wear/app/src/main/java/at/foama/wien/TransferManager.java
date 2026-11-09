package at.foama.wien;
import org.json.*;
import javax.crypto.Cipher;
import javax.crypto.spec.*;
import java.security.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import android.util.Base64;

/** All capabilities and encryption keys are ephemeral and owned by the visible transfer screen. */
final class TransferManager {
    final String session,origin,direction;final byte[] secret=new byte[32];
    private final byte[] reader=new byte[24],writer=new byte[24];
    long expiresAt;boolean closed;
    TransferManager(String origin){this(origin,"to-watch");}
    TransferManager(String origin,String direction){this.origin=origin.replaceAll("/$","");this.direction=direction;SecureRandom random=new SecureRandom();byte[] id=new byte[24];random.nextBytes(id);session=enc(id);random.nextBytes(secret);random.nextBytes(reader);random.nextBytes(writer);}
    static String enc(byte[] b){return Base64.encodeToString(b,Base64.URL_SAFE|Base64.NO_PADDING|Base64.NO_WRAP);}
    static byte[] dec(String s){if(!s.matches("[A-Za-z0-9_-]+"))throw new IllegalArgumentException("Ungültige Verschlüsselung");return Base64.decode(s,Base64.URL_SAFE|Base64.NO_PADDING|Base64.NO_WRAP);}
    static String hash(String value)throws Exception{StringBuilder s=new StringBuilder();for(byte b:MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)))s.append(String.format(java.util.Locale.ROOT,"%02x",b&255));return s.toString();}
    String qrUrl(){if(closed)throw new IllegalStateException("Transfer beendet");return origin+"/transfer.html#session="+session+"&key="+enc(secret)+"&auth="+enc(direction.equals("to-watch")?writer:reader)+"&action="+(direction.equals("to-watch")?"upload":"download");}
    String endpoint(){return origin+"/api/transfer/"+session;}
    void create(RequestScope scope)throws Exception{JSONObject data=new JSONObject();data.put("token",session).put("readHash",hash(enc(reader))).put("writeHash",hash(enc(writer))).put("direction",direction).put("capabilities",new JSONArray().put("journey-favorites-v1").put("journey-alternatives-v1"));JSONObject result=new JSONObject(Repo.jsonHttp(origin+"/api/transfer/session","POST",data,scope));expiresAt=result.getLong("expiresAt");}
    JSONObject poll(RequestScope scope)throws Exception{return new JSONObject(Repo.jsonHttp(endpoint(),"GET",null,scope,enc(direction.equals("to-watch")?reader:writer)));}
    void send(JSONArray favorites,RequestScope scope)throws Exception{JSONObject data=new JSONObject().put("format","foama-favorites-v1").put("favorites",favorites);Repo.jsonHttp(endpoint(),"PUT",encrypt(data),scope,enc(writer));}
    void send(JSONArray favorites,JSONArray journeys,RequestScope scope)throws Exception{if(journeys.length()==0){send(favorites,scope);return;}JSONArray safe=new JSONArray();for(int i=0;i<journeys.length();i++)safe.put(JourneyStore.sanitize(journeys.getJSONObject(i)));JSONObject data=new JSONObject().put("format","foama-favorites-v2").put("favorites",favorites).put("journeys",safe);Repo.jsonHttp(endpoint(),"PUT",encrypt(data),scope,enc(writer));}
    void acknowledge(RequestScope scope)throws Exception{Repo.jsonHttp(endpoint(),"DELETE",null,scope,enc(direction.equals("to-watch")?reader:writer));}
    JSONObject encrypt(JSONObject value)throws Exception{byte[] clear=value.toString().getBytes(StandardCharsets.UTF_8);if(clear.length>32768)throw new IllegalArgumentException("Bitte weniger Favoriten übertragen");byte[] iv=new byte[12];new SecureRandom().nextBytes(iv);Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.ENCRYPT_MODE,new SecretKeySpec(secret,"AES"),new GCMParameterSpec(128,iv));return new JSONObject().put("iv",enc(iv)).put("ciphertext",enc(c.doFinal(clear)));}
    JSONObject decrypt(JSONObject value)throws Exception{byte[] iv=dec(value.getString("iv")),encrypted=dec(value.getString("ciphertext"));if(iv.length!=12||encrypted.length>32784||encrypted.length<16)throw new IllegalArgumentException("Ungültige Übertragung");Cipher c=Cipher.getInstance("AES/GCM/NoPadding");c.init(Cipher.DECRYPT_MODE,new SecretKeySpec(secret,"AES"),new GCMParameterSpec(128,iv));return new JSONObject(new String(c.doFinal(encrypted),StandardCharsets.UTF_8));}
    static final class Preview {final JSONArray favorites=new JSONArray(),journeys=new JSONArray();int duplicates,unknown;}
    static Preview preview(JSONObject data,Repo repo)throws Exception{
        if(!Arrays.asList("foama-favorites-v1","foama-favorites-v2").contains(data.optString("format")))throw new IllegalArgumentException("Keine foama-wien-Favoriten");JSONArray rows=data.optJSONArray("favorites");if(rows==null){if(data.optString("format").equals("foama-favorites-v1")||data.has("favorites"))throw new IllegalArgumentException("Ungültige Favoritenliste");rows=new JSONArray();}if(data.has("journeys")&&!(data.opt("journeys") instanceof JSONArray))throw new IllegalArgumentException("Ungültige Routenliste");if(rows.length()>500)throw new IllegalArgumentException("Zu viele Favoriten");Preview out=new Preview();Set<String> seen=new HashSet<>();
        for(Repo.Favorite f:repo.favorites)seen.add(f.stopId+"\n"+f.route+"\n"+f.towards);
        for(int i=0;i<rows.length();i++){JSONObject row=rows.getJSONObject(i);if(!(row.opt("stopId") instanceof String)||row.has("route")&&!(row.opt("route") instanceof String)||row.has("towards")&&!(row.opt("towards") instanceof String))throw new IllegalArgumentException("Ungültiger Favorit");Repo.Stop stop=repo.findStop(row.getString("stopId"));String route=row.optString("route"),towards=row.optString("towards");if(stop==null||route.length()>30||towards.length()>160||repo.favorites.size()+out.favorites.length()>=500){out.unknown++;continue;}String id=stop.id+"\n"+route+"\n"+towards;if(!seen.add(id)){out.duplicates++;continue;}out.favorites.put(new JSONObject().put("stopId",stop.id).put("stopName",stop.name).put("route",route).put("towards",towards));}
        if(data.optString("format").equals("foama-favorites-v2")){JourneyStore.Preview routes=repo.journeys.preview(data.optJSONArray("journeys"));for(int i=0;i<routes.additions.length();i++)out.journeys.put(routes.additions.getJSONObject(i));out.duplicates+=routes.duplicates;}
        return out;
    }
    void destroy(){closed=true;Arrays.fill(secret,(byte)0);Arrays.fill(reader,(byte)0);Arrays.fill(writer,(byte)0);}
}
