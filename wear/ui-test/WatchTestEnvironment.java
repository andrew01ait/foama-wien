package at.foama.wien;

import android.content.Context;
import android.net.*;
import org.robolectric.*;
import org.robolectric.shadows.*;
import java.util.List;

/** Explicit network/schedule fixtures keep legacy single-source tests independent of bundled data. */
final class WatchTestEnvironment {
    static void online(){
        Context context=RuntimeEnvironment.getApplication();
        ConnectivityManager manager=(ConnectivityManager)context.getSystemService(Context.CONNECTIVITY_SERVICE);
        Shadows.shadowOf(manager).setActiveNetworkInfo(ShadowNetworkInfo.newInstance(NetworkInfo.DetailedState.CONNECTED,ConnectivityManager.TYPE_WIFI,0,true,true));
        NetworkCapabilities capabilities=ShadowNetworkCapabilities.newInstance();capabilities.addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
        Shadows.shadowOf(manager).setNetworkCapabilities(manager.getActiveNetwork(),capabilities);
        context.getSharedPreferences("foama",0).edit().putLong("offlineTimetableCheckedAt",System.currentTimeMillis()).commit();
    }
    static void offline(){
        ConnectivityManager manager=(ConnectivityManager)RuntimeEnvironment.getApplication().getSystemService(Context.CONNECTIVITY_SERVICE);
        Shadows.shadowOf(manager).setActiveNetworkInfo(null);
    }
    static void withoutTimetable(Repo repo){
        try{java.lang.reflect.Field field=OfflineTimetable.class.getDeclaredField("snapshots");field.setAccessible(true);((List<?>)field.get(repo.timetable)).clear();}
        catch(Exception error){throw new AssertionError(error);}
    }
}
