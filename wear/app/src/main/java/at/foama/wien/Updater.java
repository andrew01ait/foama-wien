package at.foama.wien;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageInstaller;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import org.json.JSONObject;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** User-triggered, signature-checked, HTTPS-only watch update, no Play Store or ADB needed. */
final class Updater {
    static final long MAX_APK_BYTES=8*1024*1024L;
    interface Callback { void onStatus(String message); void onApk(File file); default void onProgress(long bytes,long total){} }
    static final class UpdateInfo {
        final String version,sha;final URL url;final int code;final long bytes;final java.util.List<String> notes;
        private UpdateInfo(String version,int code,URL url,String sha,long bytes,java.util.List<String> notes){this.version=version;this.code=code;this.url=url;this.sha=sha;this.bytes=bytes;this.notes=java.util.Collections.unmodifiableList(notes);}
    }
    static void clearDownloadCache(Context ctx){
        File directory=new File(ctx.getCacheDir(),"updates");File[] files=directory.listFiles();
        if(files!=null)for(File file:files)if(file.isFile())file.delete();directory.delete();
    }
    /** Metadata only: this method never opens an APK URL or writes a download. */
    static UpdateInfo check(Context ctx,RequestScope scope)throws Exception{
        scope.check();
        String origin=BuildConfig.FOAMA_BASE_URL.replaceAll("/$", "");
        if(!origin.startsWith("https://") || origin.contains(".example"))
            throw new IOException("Eine veröffentlichte HTTPS-Adresse muss im Build hinterlegt sein.");
        JSONObject update=new JSONObject(Repo.jsonHttp(origin+"/update.json?ts="+System.currentTimeMillis(),"GET",null,scope));
        int next=update.optInt("wearVersionCode",0);
        if(next<=BuildConfig.VERSION_CODE)return null;
        String path=update.optString("wearApkUrl"), sha=update.optString("wearApkSha256").toLowerCase();
        if(path.isEmpty()||!sha.matches("[0-9a-f]{64}")){
            throw new IOException("Update angekündigt, aber kein geprüftes APK verfügbar.");
        }
        URL url=new URL(new URL(origin+"/"),path);
        if(!"https".equalsIgnoreCase(url.getProtocol()) || !url.getHost().equalsIgnoreCase(new URL(origin).getHost()) || url.getPort()!=new URL(origin).getPort() || url.getUserInfo()!=null)
            throw new SecurityException("APK muss von der eigenen HTTPS-Domain stammen.");
        long declared=update.optLong("wearApkBytes",0);if(declared<=0||declared>MAX_APK_BYTES)throw new IOException("Ungültige APK-Größe");
        java.util.List<String> notes=new java.util.ArrayList<>();org.json.JSONArray rows=update.optJSONArray("wearReleaseNotes");
        if(rows!=null)for(int i=0;i<Math.min(4,rows.length());i++){Object value=rows.opt(i);if(value instanceof String){String note=((String)value).replaceAll("[\\p{Cntrl}]"," ").trim();if(!note.isEmpty())notes.add(note.substring(0,Math.min(180,note.length())));}}
        scope.check();return new UpdateInfo(update.optString("wearVersion","Neue Version"),next,url,sha,declared,notes);
    }
    /** Call only after the user confirms the version offered by check(). */
    static void download(Context ctx,UpdateInfo update,Callback cb,RequestScope scope)throws Exception{
        scope.check();clearDownloadCache(ctx);cb.onStatus("Lade Update "+update.version+" …");cb.onProgress(0,update.bytes);
        HttpURLConnection connection=scope.open(update.url);File dir=new File(ctx.getCacheDir(),"updates");
        File part=new File(dir,"foama-wien-part.apk"),file=new File(dir,"foama-wien-update.apk");boolean[] delivered={false};
        try{
            connection.setConnectTimeout(15000);connection.setReadTimeout(15000);connection.setInstanceFollowRedirects(false);scope.check();
            int status=connection.getResponseCode();scope.check();if(status!=200)throw new IOException("APK-Download HTTP "+status);
            if(!dir.exists()&&!dir.mkdirs())throw new IOException("Cache-Verzeichnis nicht verfügbar");
            MessageDigest hasher=MessageDigest.getInstance("SHA-256");long bytes=0;int lastPercent=-1;
            try(InputStream input=connection.getInputStream();OutputStream output=new FileOutputStream(part)){
                byte[] chunk=new byte[8192];int n;while((n=input.read(chunk))!=-1){
                    scope.check();bytes+=n;if(bytes>MAX_APK_BYTES||bytes>update.bytes)throw new IOException("APK zu groß");hasher.update(chunk,0,n);output.write(chunk,0,n);
                    int percent=(int)(bytes*100/update.bytes);if(percent!=lastPercent){cb.onProgress(bytes,update.bytes);lastPercent=percent;}
                }
            }
            scope.check();StringBuilder observed=new StringBuilder();for(byte b:hasher.digest())observed.append(String.format("%02x",b&255));
            if(!update.sha.equals(observed.toString()))throw new SecurityException("APK SHA-256 stimmt nicht überein");
            if(update.bytes!=bytes)throw new SecurityException("APK-Größe stimmt nicht überein");
            cb.onStatus("Download vollständig · Signatur wird geprüft …");verifyApk(ctx,part,update.code);
            scope.commit(()->{if(!part.renameTo(file))throw new IOException("Update nicht bereit");cb.onApk(file);delivered[0]=true;});
        }finally{connection.disconnect();scope.release(connection);part.delete();if(!delivered[0])file.delete();}
    }
    private static void verifyApk(Context ctx,File file,int expectedCode)throws Exception{
        PackageManager pm=ctx.getPackageManager();
        PackageInfo candidate=pm.getPackageArchiveInfo(file.getAbsolutePath(),PackageManager.GET_SIGNING_CERTIFICATES);
        PackageInfo installed=pm.getPackageInfo(ctx.getPackageName(),PackageManager.GET_SIGNING_CERTIFICATES);
        if(candidate==null || !ctx.getPackageName().equals(candidate.packageName))
            throw new SecurityException("APK-Paketname entspricht nicht foama-wien");
        if(candidate.getLongVersionCode()!=expectedCode || candidate.getLongVersionCode()<=installed.getLongVersionCode())
            throw new SecurityException("APK-Version ungültig");
        if(candidate.signingInfo==null||installed.signingInfo==null)throw new SecurityException("Signatur nicht lesbar");
        Signature[] a=candidate.signingInfo.getApkContentsSigners(),b=installed.signingInfo.getApkContentsSigners();
        if(a.length!=b.length||a.length==0)throw new SecurityException("Signaturgeber weichen ab");
        for(int i=0;i<a.length;i++){
            boolean match=false;for(Signature s:b)if(a[i].equals(s))match=true;
            if(!match)throw new SecurityException("APK ist nicht mit dem vorhandenen Signaturschlüssel signiert");
        }
    }
    static boolean requestInstall(Context ctx,File file)throws Exception{
        if(Build.VERSION.SDK_INT>=26&&!ctx.getPackageManager().canRequestPackageInstalls()){
            Intent permission=new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                Uri.parse("package:"+ctx.getPackageName())).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(permission);return false;
        }
        PackageInstaller installer=ctx.getPackageManager().getPackageInstaller();
        PackageInstaller.SessionParams params=new PackageInstaller.SessionParams(PackageInstaller.SessionParams.MODE_FULL_INSTALL);
        params.setAppPackageName(ctx.getPackageName());params.setSize(file.length());
        int id=installer.createSession(params);
        try(PackageInstaller.Session session=installer.openSession(id)){
            try(InputStream in=new FileInputStream(file);OutputStream out=session.openWrite("base.apk",0,file.length())){
                byte[] b=new byte[8192];int n;while((n=in.read(b))!=-1)out.write(b,0,n);session.fsync(out);
            }
            Intent callback=new Intent(ctx,UpdateReceiver.class).setAction("at.foama.wien.UPDATE_RESULT");
            PendingIntent pending=PendingIntent.getBroadcast(ctx,id,callback,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_MUTABLE);
            session.commit(pending.getIntentSender());
        }catch(Exception e){try{installer.abandonSession(id);}catch(Exception ignored){}throw e;}
        finally{clearDownloadCache(ctx);}
        return true;
    }
}
