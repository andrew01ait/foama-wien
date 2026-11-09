package at.foama.wien;
import android.Manifest;
import android.app.*;
import android.content.*;
import android.content.pm.PackageManager;
import android.os.Build;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.*;
import org.json.*;

/** FCM reception renders the supplied message only. No GPS, monitor request or polling. */
public final class DisruptionService extends FirebaseMessagingService {
    static final String CHANNEL="foama-wien-disruptions";
    static final int NOTIFICATION_ID=401;
    @Override public void onMessageReceived(RemoteMessage message){show(this,message.getData(),message.getMessageId(),System.currentTimeMillis());}
    @Override public void onNewToken(String token){WatchPush.tokenChanged(this,token);}
    static void channel(Context context){
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        NotificationChannel channel=new NotificationChannel(CHANNEL,"Störungen der Wiener Linien",NotificationManager.IMPORTANCE_DEFAULT);
        channel.setDescription("Ausdrücklich aktivierte Störungsmeldungen für diese Uhr");manager.createNotificationChannel(channel);
    }
    static boolean show(Context context,Map<String,String> data,String messageId,long now){
        SharedPreferences prefs=WatchPush.preferences(context);
        if(!prefs.getBoolean("enabled",false)||!"foama-push-v1".equals(data.get("format")))return false;
        String title=data.get("title"),body=data.get("body"),tag=data.get("tag");long sent;
        try{sent=Long.parseLong(data.get("sentAt"));}catch(Exception e){return false;}
        if(title==null||body==null||title.length()>100||body.length()>1200||sent>now+60000||now-sent>600000||!("foama-wien-test".equals(tag)||"foama-wien-disruptions".equals(tag)))return false;
        if(!"foama-wien-test".equals(tag)&&prefs.getBoolean("quiet",true)){
            int hour=java.time.Instant.ofEpochMilli(now).atZone(java.time.ZoneId.of("Europe/Vienna")).getHour();if(hour>=22||hour<7)return false;
        }
        NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
        if(!manager.areNotificationsEnabled()||(Build.VERSION.SDK_INT>=33&&context.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS)!=PackageManager.PERMISSION_GRANTED))return false;
        String key=messageId==null?sent+"|"+title+"|"+body:messageId;try{byte[] digest=java.security.MessageDigest.getInstance("SHA-256").digest(key.getBytes(java.nio.charset.StandardCharsets.UTF_8));StringBuilder hash=new StringBuilder();for(byte b:digest)hash.append(String.format(java.util.Locale.ROOT,"%02x",b&255));key=hash.toString();}catch(java.security.NoSuchAlgorithmException e){return false;}
        synchronized(WatchPush.LOCK){
            JSONArray messages=WatchPush.inbox(context,now);for(int i=0;i<messages.length();i++)if(key.equals(messages.optJSONObject(i).optString("key")))return false;
            try{JSONArray next=new JSONArray();next.put(new JSONObject().put("key",key).put("title",title).put("body",body).put("at",sent));for(int i=0;i<Math.min(9,messages.length());i++)next.put(messages.get(i));prefs.edit().putString("inbox",next.toString()).apply();}catch(JSONException e){return false;}
        }
        channel(context);
        Intent intent=new Intent(context,MainActivity.class).putExtra("foama_alerts",true).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP|Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent open=PendingIntent.getActivity(context,401,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification notification=new Notification.Builder(context,CHANNEL).setSmallIcon(at.andrew.foamawien.R.drawable.ic_notification).setContentTitle(title).setContentText(body)
            .setStyle(new Notification.BigTextStyle().bigText(body)).setContentIntent(open).setAutoCancel(true).setOnlyAlertOnce(true).setLocalOnly(true)
            .setTimeoutAfter(3600000).setCategory(Notification.CATEGORY_STATUS).setVisibility(Notification.VISIBILITY_PRIVATE).setColor(0xff73e0b7).build();
        manager.notify(tag,NOTIFICATION_ID,notification);return true;
    }
}
