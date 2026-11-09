package at.foama.wien;
import java.util.*;
/** Platform-independent safety, battery and request-budget rules. */
final class WearPolicy {
    static final long REFRESH_MS=30000, FRESH_MS=90000, CACHE_MS=600000;
    static final int MAX_RBL=24;
    static boolean reliable(long now,long fixTime,float accuracy,boolean moving) {
        return !moving && fixTime>0 && now>=fixTime && now-fixTime<=FRESH_MS
            && !Float.isNaN(accuracy) && accuracy>0 && accuracy<=150;
    }
    static boolean usableDeparture(long now,long when,long fetchedAt) {
        return fetchedAt>0 && now>=fetchedAt && now-fetchedAt<=CACHE_MS && when>=now && when<=now+10800000;
    }
    static boolean fresh(long now,long fetchedAt,boolean error) {
        return !error && fetchedAt>0 && now>=fetchedAt && now-fetchedAt<=FRESH_MS;
    }
    static int minutes(long when,long now) {return Math.max(0,(int)Math.ceil((when-now)/60000.0));}
    static long retryDelay(int failures) {return Math.min(300000L,60000L*(1L<<Math.min(3,Math.max(0,failures-1))));}
    static final String[] MODES={"metro","tram","bus","sbahn","regional","long"};
    static final String[] MODE_LABELS={"U-Bahn","Tram","Bus","S-Bahn","Regionalzug","Fernverkehr"};
    static int modePriority(String mode){for(int i=0;i<MODES.length;i++)if(MODES[i].equals(mode))return i;return MODES.length;}
    /** First 16 keep priority; the remaining eight rotate instead of starving later favorites. */
    static List<String> budget(List<List<String>> orderedGroups,int cycle) {
        return budget(orderedGroups,cycle,Collections.emptyMap());
    }
    /** Nearby mode priority is stable; the rotating tail still eventually covers every platform. */
    static List<String> budget(List<List<String>> orderedGroups,int cycle,Map<String,Integer> priorities) {
        LinkedHashSet<String> all=new LinkedHashSet<>();
        int maximum=0;for(List<String> g:orderedGroups)maximum=Math.max(maximum,g.size());
        for(int i=0;i<maximum;i++)for(List<String> g:orderedGroups)if(i<g.size()&&g.get(i).matches("[0-9]{1,8}"))all.add(g.get(i));
        ArrayList<String> ids=new ArrayList<>(all);
        if(!priorities.isEmpty())ids.sort(Comparator.comparingInt(id->priorities.getOrDefault(id,MODES.length)));
        return budgetIds(ids,MAX_RBL,cycle);
    }
    static List<String> budgetIds(List<String> ids,int limit,int cycle){
        if(ids.size()<=limit)return new ArrayList<>(ids);
        int pinned=limit*2/3,slots=limit-pinned;ArrayList<String> selected=new ArrayList<>(ids.subList(0,pinned));
        int size=ids.size()-pinned,start=Math.floorMod(cycle*slots,size);
        for(int i=0;i<slots;i++)selected.add(ids.get(pinned+(start+i)%size));
        return selected;
    }
    static List<String> visibleBudget(List<List<String>> groups,List<List<String>> visible,int cycle,Map<String,Integer> priorities){
        List<String> all=budget(groups,cycle,priorities);if(visible.isEmpty())return all;
        LinkedHashSet<String> allIds=new LinkedHashSet<>(),visibleIds=new LinkedHashSet<>();
        for(List<String> g:groups)for(String id:g)if(id.matches("[0-9]{1,8}"))allIds.add(id);
        for(List<String> g:visible)for(String id:g)if(id.matches("[0-9]{1,8}"))visibleIds.add(id);
        ArrayList<String> focused=new ArrayList<>(visibleIds),rest=new ArrayList<>(allIds);
        if(!priorities.isEmpty()){Comparator<String> rank=Comparator.comparingInt(id->priorities.getOrDefault(id,MODES.length));focused.sort(rank);rest.sort(rank);}
        List<String> head=budgetIds(focused,MAX_RBL,cycle);rest.removeAll(head);
        ArrayList<String> selected=new ArrayList<>(head);selected.addAll(budgetIds(rest,MAX_RBL-head.size(),cycle));return selected;
    }
    static int lineColor(String route,String mode) {
        String r=route.toUpperCase(Locale.ROOT).replace(" ","");
        if(r.matches("N[0-9].*"))return 0xff162a63;
        switch(r){case "U1":return 0xffed1c24;case "U2":return 0xffa066aa;
            case "U3":return 0xfff5821f;case "U4":return 0xff00a068;case "U6":return 0xff986a3a;}
        if("tram".equals(mode))return 0xffbc4c46;
        if("sbahn".equals(mode))return 0xff327f69;
        return 0xff48738c;
    }
}
