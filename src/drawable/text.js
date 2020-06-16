import Drawable from '../core/drawable';

// (function () {
// 	var cache = {}
// 	var _div,
// 		getDiv = function () {
// 			if (!_div) {
// 				_div = document.createElement('div')
// 				Object.assign(_div.style, {
// 					'position': 'absolute',
// 					top: -100,
// 					left: -100
// 				})
// 				document.getElementsByTagName('body')[0].appendChild(_div)
// 			}
// 			return _div
// 		}

// 		MainCanvas.prototype.getTextHeight = function () {
// 		if (!this.container) return
// 		let font = window.getComputedStyle(this.container).getPropertyValue('font')
// 		if (!cache[font]) {
// 			var div = getDiv()
// 			div.innerHTML = 'abcdefghijklmnopqrstuvwxyz0123456789';
// 			div.style['display'] = '';
// 			div.style['font'] = font;
// 			cache[font] = div.offsetHeight;
// 			div.style['display'] = 'none';
// 		}
// 		return cache[font]
// 	}

// 	MainCanvas.prototype.getTextWidth = function (html) {
// 		return (this.context && this.context.measureText(html) || {}).width
// 	}
// })();

export default class Text extends Drawable {
  constructor(){
    super(...arguments);
  }

  _draw(ctx) {
    let { x, y, w, h, text,
      font = '1em "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif',
      textBaseline = 'top',
      textAlign = 'left',
      fillStyle = '#CCCCCC',
      textWidth, textHeight,
      strokeStyle, underline } = this
  
    ctx.font = font
    ctx.textBaseline = textBaseline
    ctx.textAlign = textAlign
  
    if (fillStyle) {
      ctx.fillText(text, x, y)
    }
    if (strokeStyle) {
      ctx.strokeText(text, x, y)
    }
  
    if (underline) {
      if (!textWidth) drawableItem.textWidth = textWidth = this.getTextWidth(text)
      if (!textHeight) drawableItem.textHeight = textHeight = this.getTextHeight()
      let sp = { y: y + textHeight / 2 }, ep = { y: y + textHeight / 2 }
      switch (textAlign) {
        case 'left':
          sp.x = x
          ep.x = x + textWidth
          break
        case 'center':
          sp.x = x - textWidth / 2
          ep.x = x + textWidth / 2
          break
        case 'right':
          sp.x = x - textWidth
          ep.x = x
          break
      }
      this['line'](ctx, { points: [sp, ep] })
      this.stroke(ctx, { stroke: fill || stroke })
    }
  }
}

