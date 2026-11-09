package at.foama.wien;
import android.graphics.*;
import android.graphics.drawable.Drawable;

/** Local vector transport marks, independent of emoji/font availability. */
final class TransportIcon extends Drawable {
    private final String mode;
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    TransportIcon(String mode,int colour){this.mode=mode;paint.setColor(colour);paint.setStrokeWidth(1.7f);paint.setStrokeJoin(Paint.Join.ROUND);paint.setStrokeCap(Paint.Cap.ROUND);}
    @Override public void draw(Canvas canvas){
        Rect b=getBounds();canvas.save();canvas.translate(b.left,b.top);canvas.scale(b.width()/24f,b.height()/24f);paint.setStyle(Paint.Style.STROKE);
        if(mode.equals("metro")||mode.equals("sbahn")){
            canvas.drawCircle(12,12,10,paint);
            if(mode.equals("metro")){Path u=new Path();u.moveTo(7,6);u.lineTo(7,13);u.cubicTo(7,20,17,20,17,13);u.lineTo(17,6);canvas.drawPath(u,paint);}
            else{Path s=new Path();s.moveTo(17,7);s.cubicTo(9,2,3,10,12,12);s.cubicTo(21,14,15,22,7,17);canvas.drawPath(s,paint);}
        }else{
            boolean bus=mode.equals("bus"),tram=mode.equals("tram");
            canvas.drawRoundRect(5,5,19,19,3,3,paint);canvas.drawLine(5,12,19,12,paint);canvas.drawLine(12,5,12,12,paint);
            canvas.drawCircle(8,16,0.8f,paint);canvas.drawCircle(16,16,0.8f,paint);
            if(bus){canvas.drawLine(6,19,6,22,paint);canvas.drawLine(18,19,18,22,paint);canvas.drawLine(3,8,3,12,paint);canvas.drawLine(21,8,21,12,paint);}
            else{canvas.drawLine(8,19,5,23,paint);canvas.drawLine(16,19,19,23,paint);canvas.drawLine(6,22,18,22,paint);if(tram){canvas.drawLine(11,5,11,2,paint);canvas.drawLine(11,2,18,1,paint);}else{canvas.drawLine(8,2,16,2,paint);if(mode.equals("long")){canvas.drawLine(1,8,3,8,paint);canvas.drawLine(0,12,3,12,paint);}}}
        }
        canvas.restore();
    }
    @Override public void setAlpha(int alpha){paint.setAlpha(alpha);invalidateSelf();}
    @Override public void setColorFilter(ColorFilter filter){paint.setColorFilter(filter);invalidateSelf();}
    @Override public int getOpacity(){return PixelFormat.TRANSLUCENT;}
    @Override public int getIntrinsicWidth(){return 24;}
    @Override public int getIntrinsicHeight(){return 24;}
}
