package at.foama.wien;
import android.graphics.*;
import android.graphics.drawable.Drawable;

/** Small original vector marks: monochrome pin and star, no font/emoji dependency. */
final class NavigationIcon extends Drawable {
    private final boolean star,selected,route;
    private final Paint paint=new Paint(Paint.ANTI_ALIAS_FLAG);
    NavigationIcon(boolean star,boolean selected,int colour){this(star,selected,colour,false);}
    private NavigationIcon(boolean star,boolean selected,int colour,boolean route){this.star=star;this.selected=selected;this.route=route;paint.setColor(colour);paint.setStrokeWidth(1.7f);paint.setStrokeJoin(Paint.Join.ROUND);paint.setStrokeCap(Paint.Cap.ROUND);}
    static NavigationIcon route(int colour){return new NavigationIcon(false,false,colour,true);}
    @Override public void draw(Canvas canvas){
        Rect b=getBounds();canvas.save();canvas.translate(b.left,b.top);canvas.scale(b.width()/24f,b.height()/24f);
        Path path=new Path();
        if(route){
            paint.setStyle(Paint.Style.STROKE);canvas.drawCircle(5,5,2.5f,paint);canvas.drawCircle(19,19,2.5f,paint);path.moveTo(8,5);path.lineTo(16,5);path.cubicTo(24,5,24,12,16,12);path.lineTo(8,12);path.cubicTo(0,12,0,19,8,19);path.lineTo(16,19);canvas.drawPath(path,paint);
        }else if(star){
            for(int i=0;i<10;i++){double angle=-Math.PI/2+i*Math.PI/5;float radius=i%2==0?10:4.6f;float x=12+(float)Math.cos(angle)*radius,y=12+(float)Math.sin(angle)*radius;if(i==0)path.moveTo(x,y);else path.lineTo(x,y);}path.close();
            paint.setStyle(selected?Paint.Style.FILL_AND_STROKE:Paint.Style.STROKE);canvas.drawPath(path,paint);
        }else{
            path.moveTo(12,22);path.cubicTo(10,19,4.5f,14,4.5f,9);path.cubicTo(4.5f,-.5f,19.5f,-.5f,19.5f,9);path.cubicTo(19.5f,14,14,19,12,22);path.close();
            paint.setStyle(Paint.Style.STROKE);canvas.drawPath(path,paint);canvas.drawCircle(12,9,2.5f,paint);
        }
        canvas.restore();
    }
    @Override public void setAlpha(int alpha){paint.setAlpha(alpha);invalidateSelf();}
    @Override public void setColorFilter(ColorFilter filter){paint.setColorFilter(filter);invalidateSelf();}
    @Override public int getOpacity(){return PixelFormat.TRANSLUCENT;}
}
