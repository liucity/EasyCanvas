import Drawable from '../core/drawable';
import { type } from '../util/util';

export default class Bezier extends Drawable {
  constructor(){
    super(...arguments);

    if(type(arguments[0]) === 'array'){
      this.points = arguments[0];
    }
  }

  _draw(ctx) {
    let { points, fillStyle, strokeStyle } = this;
    if (!points) return console.warn('points are not defined');
    if(!points.length) return;

    // ctx.beginPath()
    // ctx.moveTo(points[0].x, points[0].y);

    // let l = points.length
    // let i = 1
    // for (; i < l - 2; i += 2){
    // 	let xc = (points[i].x + points[i + 1].x) / 2;
    // 	let yc = (points[i].y + points[i + 1].y) / 2;
    // 	ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    // }
    ctx.beginPath();
    ctx.moveTo((points[0].x), points[0].y);

    for(var i = 0; i < points.length-1; i ++){
      var x_mid = (points[i].x + points[i+1].x) / 2;
      var y_mid = (points[i].y + points[i+1].y) / 2;
      var cp_x1 = (x_mid + points[i].x) / 2;
      var cp_x2 = (x_mid + points[i+1].x) / 2;
      ctx.quadraticCurveTo(cp_x1,points[i].y ,x_mid, y_mid);
      ctx.quadraticCurveTo(cp_x2,points[i+1].y ,points[i+1].x,points[i+1].y);
    }
    
    if(fillStyle) ctx.fill();
    if(strokeStyle) ctx.stroke();
  }
}