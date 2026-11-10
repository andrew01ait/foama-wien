package at.foama.wien;

/** Same public coverage regions as the PWA; detection is foreground-only and ephemeral. */
final class CityProfiles {
    static final String[] IDS={"wien","graz","linz","salzburg"},NAMES={"Wien","Graz","Linz","Salzburg"};
    static final double[][] REGIONS={{48.2082,16.3738,16000},{47.0707,15.4395,12000},{48.3069,14.2858,12000},{47.8095,13.055,10000}};
    String preference="auto",automatic="wien",candidate="";long candidateAt,lastFixAt;
    CityProfiles(String choice){preference=valid(choice)?choice:"auto";}
    static boolean valid(String id){return id!=null&&(id.equals("auto")||index(id)>=0);}
    static int index(String id){for(int i=0;i<IDS.length;i++)if(IDS[i].equals(id))return i;return -1;}
    static String name(String id){int i=index(id);return i<0?"Wien":NAMES[i];}
    static String stopCity(String id){for(String city:IDS)if(!city.equals("wien")&&id.startsWith(city+":"))return city;return "wien";}
    static double distance(double a,double b,double c,double d){double p=Math.toRadians(c-a),q=Math.toRadians(d-b),h=Math.sin(p/2)*Math.sin(p/2)+Math.cos(Math.toRadians(a))*Math.cos(Math.toRadians(c))*Math.sin(q/2)*Math.sin(q/2);return 6371000*2*Math.atan2(Math.sqrt(h),Math.sqrt(Math.max(0,1-h)));}
    String current(){return preference.equals("auto")?automatic:preference;}
    boolean select(String value){return select(value,System.currentTimeMillis());}
    boolean select(String value,long now){String before=current();preference=valid(value)?value:"auto";candidate="";if(preference.equals("auto"))expire(now);return !before.equals(current());}
    void expire(long now){if(lastFixAt<=0||now-lastFixAt>90000||lastFixAt>now+1000){automatic="wien";candidate="";}}
    boolean observe(double lat,double lon,float accuracy,long at,long now,boolean visible){
        if(!visible||!Double.isFinite(lat)||!Double.isFinite(lon)||!Float.isFinite(accuracy)||accuracy<0||accuracy>250||now-at< -1000||now-at>90000)return false;
        lastFixAt=at;String target="wien";int targetIndex=0;
        for(int i=0;i<IDS.length;i++)if(distance(lat,lon,REGIONS[i][0],REGIONS[i][1])+accuracy<=REGIONS[i][2]){target=IDS[i];targetIndex=i;break;}
        int old=index(automatic);if(target.equals("wien")&&old>0&&distance(lat,lon,REGIONS[old][0],REGIONS[old][1])<=REGIONS[old][2]+accuracy+1000)target=automatic;
        if(target.equals(automatic)){candidate="";return false;}
        String before=current();boolean strong=accuracy<=50&&distance(lat,lon,REGIONS[targetIndex][0],REGIONS[targetIndex][1])+accuracy<=REGIONS[targetIndex][2]-1000;
        if(strong||target.equals(candidate)&&at-candidateAt>=5000){automatic=target;candidate="";}else if(!target.equals(candidate)){candidate=target;candidateAt=at;}
        return !before.equals(current());
    }
}
