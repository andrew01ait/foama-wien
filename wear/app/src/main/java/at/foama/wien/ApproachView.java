package at.foama.wien;

import android.content.Context;
import android.graphics.*;
import android.text.TextPaint;
import android.text.TextUtils;
import android.view.View;
import org.json.*;

/** A short stop sequence with bounded, explicitly estimated vehicle positions. */
final class ApproachView extends View {
    private final JSONObject data;private final int start,center;private final Paint paint=new Paint(3);private final TextPaint words=new TextPaint(3);
    private float d,sp;
    ApproachView(Context context,JSONObject data,int before){super(context);this.data=data;center=data.optInt("center");start=Math.max(0,center-before);d=getResources().getDisplayMetrics().density;sp=getResources().getDisplayMetrics().scaledDensity;
        StringBuilder description=new StringBuilder("Fahrzeuge im Anflug. Positionen geschätzt. ");JSONArray stops=data.optJSONArray("stops");if(stops!=null)for(int i=start;i<=center&&i<stops.length();i++)description.append(stops.optJSONObject(i).optString("name")).append(i==center?", deine Station. ":", ");JSONArray tracks=data.optJSONArray("tracks");if(tracks!=null)for(int i=0;i<tracks.length();i++)description.append(tracks.optJSONObject(i).optString("id")).append(" geschätzt. ");setContentDescription(description);setFocusable(true);setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_YES);
    }
    @Override protected void onMeasure(int w,int h){setMeasuredDimension(MeasureSpec.getSize(w),Math.round((center-start+1)*40*d+12*d));}
    @Override protected void onDraw(Canvas canvas){
        super.onDraw(canvas);JSONArray stops=data.optJSONArray("stops"),tracks=data.optJSONArray("tracks");if(stops==null)return;
        float x=18*d,top=20*d,step=40*d;paint.setColor(0xff35554f);paint.setStrokeWidth(3*d);canvas.drawLine(x,top,x,top+(center-start)*step,paint);
        words.setTextSize(12*sp);
        for(int i=start;i<=center&&i<stops.length();i++){
            float y=top+(i-start)*step;paint.setColor(i==center?MainActivity.MINT:MainActivity.MUTED);canvas.drawCircle(x,y,(i==center?6:4)*d,paint);
            words.setColor(i==center?MainActivity.MINT:MainActivity.WHITE);words.setTypeface(i==center?Typeface.DEFAULT_BOLD:Typeface.DEFAULT);
            String label=stops.optJSONObject(i).optString("name");CharSequence line=TextUtils.ellipsize(label,words,Math.max(20,getWidth()-42*d),TextUtils.TruncateAt.END);canvas.drawText(line.toString(),34*d,y+4*d,words);
        }
        long now=System.currentTimeMillis();
        for(int i=0;tracks!=null&&i<tracks.length();i++){
            JSONObject track=tracks.optJSONObject(i);double progress=track.optDouble("progress",Double.NaN);long age=now-track.optLong("lastSeen");if(!Double.isFinite(progress)||progress<start||progress>center||age>90000||age< -30000)continue;
            float y=top+(float)(progress-start)*step;boolean stale=track.optBoolean("stale")||track.optBoolean("uncertain")||age>60000;paint.setColor(stale?0xff4b5563:WearPolicy.lineColor(data.optString("route"),data.optString("mode")));canvas.drawRoundRect(x-11*d,y-11*d,x+11*d,y+11*d,5*d,5*d,paint);
            TransportIcon icon=new TransportIcon(data.optString("mode"),Color.WHITE);icon.setBounds(Math.round(x-8*d),Math.round(y-8*d),Math.round(x+8*d),Math.round(y+8*d));icon.draw(canvas);
        }
    }
}
