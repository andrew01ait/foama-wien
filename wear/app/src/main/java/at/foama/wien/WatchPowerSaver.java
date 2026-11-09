package at.foama.wien;
/** Opt-in battery policy; hysteresis avoids repeated changes around twenty percent. */
final class WatchPowerSaver {
    boolean enabled,active;int percent=-1;
    WatchPowerSaver(boolean enabled,boolean active){this.enabled=enabled;this.active=enabled&&active;}
    boolean update(int value){boolean before=active;if(value>=0&&value<=100)percent=value;if(!enabled)active=false;else if(percent>=0){if(percent<20)active=true;else if(percent>=25)active=false;}return before!=active;}
    long departureInterval(){return active?90000:WearPolicy.REFRESH_MS;}
    long renderInterval(){return active?30000:10000;}
    boolean locationDue(long elapsed,long lastAttempt,boolean explicit){return explicit||!active||lastAttempt<0||elapsed-lastAttempt>=300000;}
}
