package at.foama.wien;

import android.graphics.*;
import android.graphics.drawable.Drawable;

/** A small original cog matching the settings mark used in the PWA. */
final class SettingsIcon extends Drawable {
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    SettingsIcon(int color){paint.setColor(color);paint.setStyle(Paint.Style.STROKE);paint.setStrokeWidth(1.7f);paint.setStrokeJoin(Paint.Join.ROUND);}
    @Override public void draw(Canvas canvas){Rect b=getBounds();canvas.save();canvas.translate(b.left,b.top);canvas.scale(b.width()/24f,b.height()/24f);float[] xy={9,4.58f,9.51f,2.01f,14.49f,2.01f,15,4.58f,16.93f,5.70f,19.41f,4.85f,21.90f,9.16f,19.92f,10.89f,19.92f,13.11f,21.90f,14.84f,19.41f,19.15f,16.93f,18.30f,15,19.42f,14.49f,21.99f,9.51f,21.99f,9,19.42f,7.07f,18.30f,4.59f,19.15f,2.10f,14.84f,4.08f,13.11f,4.08f,10.89f,2.10f,9.16f,4.59f,4.85f,7.07f,5.70f};Path path=new Path();path.moveTo(xy[0],xy[1]);for(int i=2;i<xy.length;i+=2)path.lineTo(xy[i],xy[i+1]);path.close();canvas.drawPath(path,paint);canvas.drawCircle(12,12,3.2f,paint);canvas.restore();}
    @Override public void setAlpha(int alpha){paint.setAlpha(alpha);invalidateSelf();}
    @Override public void setColorFilter(ColorFilter filter){paint.setColorFilter(filter);invalidateSelf();}
    @Override public int getOpacity(){return PixelFormat.TRANSLUCENT;}
}
