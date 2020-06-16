import Drawable from '../core/drawable';
import { type } from '../util/util';

export default class Line extends Drawable {
  constructor(){
    super(...arguments);

    if(type(arguments[0]) === 'array'){
      this.points = arguments[0];
    }
  }

  _draw(ctx) {
    let { points, fillStyle, strokeStyle } = this;
    if (!points) return console.warn('points are required!')
    ctx.beginPath();
    points.forEach(({ x, y }, i) => {
      if (i) {
        ctx.lineTo(x, y);
      } else {
        ctx.moveTo(x, y);
      }
    });
    
    if(fillStyle) ctx.fill();
    if(strokeStyle) ctx.stroke();
  }
}