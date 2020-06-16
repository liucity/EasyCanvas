import Drawable from '../core/drawable';
import { warn } from '../util/util';

export default class Point extends Drawable {
  constructor(params){
    super(...arguments);

    if(!params.r) warn('r is required!');
    if(!this.w) this.w = this.r * 2;
    if(!this.h) this.h = this.r * 2;
    this.fixX = this.fixY = this.r;
  }

  _draw(ctx) {
    let { x, y, r, fillStyle, strokeStyle } = this;
    this.setting(this);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    
    if(fillStyle) ctx.fill();
    if(strokeStyle) ctx.stroke();
  }
}