package at.foama.wien;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.widget.Toast;

/** Android PackageInstaller result. Installation may require explicit user confirmation. */
public final class UpdateReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context,Intent result){
        int status=result.getIntExtra(PackageInstaller.EXTRA_STATUS,PackageInstaller.STATUS_FAILURE);
        if(status==PackageInstaller.STATUS_PENDING_USER_ACTION){
            Intent confirm=result.getParcelableExtra(Intent.EXTRA_INTENT);
            try{
                if(confirm==null)throw new android.content.ActivityNotFoundException();
                confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);context.startActivity(confirm);
            }catch(RuntimeException e){status=PackageInstaller.STATUS_FAILURE;Updater.clearDownloadCache(context);Toast.makeText(context,"Android-Installer nicht verfügbar. Bitte erneut versuchen.",Toast.LENGTH_LONG).show();}
        }else if(status==PackageInstaller.STATUS_SUCCESS){
            Updater.clearDownloadCache(context);
            Toast.makeText(context,"foama-wien wurde aktualisiert",Toast.LENGTH_LONG).show();
        }else{
            Updater.clearDownloadCache(context);
            String detail=result.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
            Toast.makeText(context,"Update nicht installiert"+(detail==null?"":": "+detail),Toast.LENGTH_LONG).show();
        }
        Updater.reportInstallStatus(result.getIntExtra(PackageInstaller.EXTRA_SESSION_ID,-1),status);
    }
}
