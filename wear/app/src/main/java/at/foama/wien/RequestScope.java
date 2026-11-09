package at.foama.wien;

import java.io.InterruptedIOException;
import java.net.*;
import java.util.*;

/** One foreground session owns its HTTP connections and rejects late results. */
final class RequestScope {
    interface ConnectionFactory { HttpURLConnection open(URL url)throws Exception; }
    interface Action { void run()throws Exception; }
    private final ConnectionFactory factory;
    private final Set<HttpURLConnection> connections=new HashSet<>();
    private boolean cancelled;
    RequestScope(){this(url->(HttpURLConnection)url.openConnection());}
    RequestScope(ConnectionFactory factory){this.factory=factory;}
    synchronized boolean isCancelled(){return cancelled;}
    synchronized void check()throws InterruptedIOException {if(cancelled||Thread.currentThread().isInterrupted())throw new InterruptedIOException("Anfrage beendet");}
    synchronized HttpURLConnection open(URL url)throws Exception {check();HttpURLConnection con=factory.open(url);connections.add(con);return con;}
    synchronized void release(HttpURLConnection con){connections.remove(con);}
    synchronized void commit(Action action)throws Exception {check();action.run();}
    void cancel(){
        List<HttpURLConnection> pending;
        synchronized(this){cancelled=true;pending=new ArrayList<>(connections);connections.clear();}
        for(HttpURLConnection con:pending)try{con.disconnect();}catch(RuntimeException ignored){}
    }
}
