package at.foama.wien;
import android.app.Application;

/** Restore an explicitly enabled push client; never starts location or departure work. */
public final class FoamaApplication extends Application {
    @Override public void onCreate(){super.onCreate();WatchPush.restoreFirebase(this);}
}
