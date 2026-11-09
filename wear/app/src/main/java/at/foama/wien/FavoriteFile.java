package at.foama.wien;
import java.io.*;
import java.nio.ByteBuffer;
import java.nio.charset.*;
import org.json.JSONObject;

/** Bounded local JSON reader. Preview never mutates the watch's saved data. */
final class FavoriteFile {
    static final int MAX_BYTES=512*1024;
    static TransferManager.Preview preview(InputStream input,Repo repo,RequestScope scope)throws Exception{
        if(input==null)throw new IOException("Datei nicht lesbar");
        try(InputStream stream=input;ByteArrayOutputStream buffer=new ByteArrayOutputStream()){
            byte[] chunk=new byte[8192];int n;
            while((n=stream.read(chunk))!=-1){scope.check();if(buffer.size()+n>MAX_BYTES)throw new IOException("Datei zu groß (max. 512 KiB)");buffer.write(chunk,0,n);}
            scope.check();String json=StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).onUnmappableCharacter(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(buffer.toByteArray())).toString();
            TransferManager.Preview preview=TransferManager.preview(new JSONObject(json),repo);scope.check();return preview;
        }
    }
}
