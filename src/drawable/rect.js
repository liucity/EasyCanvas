import Drawable from '../core/drawable';

export default class Rect extends Drawable {
  constructor(){
    super(...arguments);
  }

  _draw(ctx) {
    let { x, y, w, h, r, fillStyle, strokeStyle } = this;
  
    ctx.beginPath();
    if (r) {
      ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 3 / 2);
      ctx.lineTo(x + w - r, y);
      ctx.arc(x + w - r, y + r, r, - Math.PI / 2, 0);
      ctx.lineTo(x + w, y + h - r);
      ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
      ctx.lineTo(x + r, y + h);
      ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
      ctx.lineTo(x, y + r);
    } else {
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
    }
    ctx.closePath();
    
    if(fillStyle) ctx.fill();
    if(strokeStyle) ctx.stroke();
  }
}