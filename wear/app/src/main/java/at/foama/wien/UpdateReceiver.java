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
            if(confirm!=null){confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);context.startActivity(confirm);}
        }else if(status==PackageInstaller.STATUS_SUCCESS){
            Updater.clearDownloadCache(context);
            Toast.makeText(context,"foama-wien wurde aktualisiert",Toast.LENGTH_LONG).show();
        }else{
            Updater.clearDownloadCache(context);
            String detail=result.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
            Toast.makeText(context,"Update nicht installiert"+(detail==null?"":": "+detail),Toast.LENGTH_LONG).show();
        }
    }
}
