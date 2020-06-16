import Event from './event.js'
import Tool from './tool.js'
import Guard from './frameGuard.js'
import Watch from './watch.js'
import Position from './position.js'
import LinqSet from './LinqSet.js'

const PI = Math.PI
const { extend, type } = Tool
let devicePixelRatio = window.devicePixelRatio || 1

class Canvas extends Event {
	constructor(params) {
		super()

		this.initProperties()

		extend(this, {
			event: null,
			debug: false
		}, params)

		if (params) {
			if (params.items) this.add.apply(this, params.items)
			if (params.render !== false) this.render = true
		}
	}

	initProperties() {
		let _container,
			_context,
			_gradient = {},
			_items = LinqSet(),
			doRender = (item) => {
				let { render, _render, _transform } = item
				// let detectedItems = item._render

				// if(_transform && !render){
				//     this.save(_context, item)
				//     this.transform(_context, item)
				// }
				if (_transform) {
					this.save(_context, item)
					this.transform(_context, item)
				}
				if (item.alpha != undefined) this.alpha(_context, item)
				if (item._render) item._render(this, _context)

				if (item._children && item._children.size) {
					// this.save(_context, item)
					// this.rect(_context, item)
					// this.clip(_context, item)
					item._children.forEach(doRender)
					// this.restore(_context, item)
				}
				if (item.alpha != undefined) this.alpha(_context, {
					alpha: 1
				})
				while (item._saveCount > 0) this.restore(_context, item)
				// if(render){
				//     if(this['run'](_context, item) === false) return

				//     while(item._saveCount > (_transform ? 1 : 0)) this.restore(_context, item) //clean saved status but transform
				// }

				// if(detectedItems.size){
				//     let restoreList = []
				//     detectedItems.forEach((obj, prop) => {
				//         if(obj.render){
				//             this['run'](_context, obj)
				//         }else{
				//             this[prop](_context, obj)
				//             if(obj.fill) this.fill(_context, obj)
				//             if(obj.stroke) this.stroke(_context, obj)
				//         }
				//         if(obj._saveCount) {
				//             restoreList.push(obj)
				//         }
				//     })
				//     let obj
				//     while(obj = restoreList.shift()){
				//         while(obj._saveCount) this.restore(_context, obj)
				//     }
				// }

				// if(_transform && item._saveCount) this.restore(_context, item) //clean transform
			},
			onRender = (t) => {
				this.clean()
				this.items.forEach(doRender)

				if (!_container || !_container.parentNode) {
					return false
				}
				return this.render
			}

		let properties = {
			container: {
				get() {
					return _container
				},
				set(val) {
					_container = val
					_context = val.getContext('2d')
					this.initWH(_container, _context)
					this._self = {
						_position: new Position({
							x: 0,
							y: 0,
							w: this.width,
							h: this.height
						})
					}
					this.initEvents()
				}
			},
			context: {
				get() {
					return _context
				}
			},
			items: {
				get() {
					return _items
				}
			},
			gradient: {
				get() {
					return _gradient
				}
			}
		}

		;['width', 'height'].forEach(key => {
			properties[key] = {
				get() {
					return _container ? _container[key] : undefined
				},
				set(val) {
					if (_container && !isNaN(val)) _container[key] = val
				}
			}
		})

		this.render = false
		Watch(this, 'render', (prop, newVal, oldVal) => {
			//may be referred twice or more, need to fix
			Guard[newVal ? 'request' : 'cancel'](onRender)
		})

		Object.defineProperties(this, properties)
	}

	initEvents() {
		let lastHandlers = []
		let check = (item, eventName, ex, ey) => {
			let { x, y, w, h, _transform, alpha } = item
			if (alpha === 0) return []
			if (_transform) {
				let _ex = _transform.x(ex, ey)
				let _ey = _transform.y(ex, ey)
				ex = _ex
				ey = _ey
			}

			if (item.inRange(ex, ey)) {
				let list = item._children && item._children.map(c => check(c, eventName, ex, ey))
				return [{
					target: item,
					x: ex,
					y: ey
				}].concat(list == undefined ? undefined : list)
			}
		}

		;['click', 'mousedown', 'mousemove', 'mouseup'].forEach(eventName => {
			this.container.addEventListener(eventName, (e) => {
				let handlers = this.items.selectMany(item => check(item, eventName, e.offsetX, e.offsetY, e))

				switch (eventName) {
					case 'mousemove':
						lastHandlers.filter(l => !handlers.find(c => l.target === c.target)).forEach(handler => {
							handler.target.trigger('mouseleave', handler, handlers)
							if (this.debug && handler.target.fakeRect) {
								handler.target.rect = handler.target.fakeRect === 'Y' ? false : handler.target.fakeRect
								handler.target.fakeRect = false
							}
						})
						handlers.filter(c => !lastHandlers.find(l => l.target === c.target)).forEach(handler => {
							handler.target.trigger('mouseenter', handler, handlers)
							if (this.debug) {
								handler.target.fakeRect = handler.target.rect || 'Y'
								handler.target.rect = Object.assign({}, handler.target.rect, { stroke: 'red' })
							}
						})
						break
				}

				handlers.forEach(handler => {
					handler.target.trigger(eventName, handler, handlers)
				})

				lastHandlers = handlers
			})
		})

		let resizeListener = (e) => {
			this.initWH(this.container, this.context)
		}
		window.addEventListener('resize', resizeListener)
		this.on('destroy', () => {
			window.removeEventListener('resize', resizeListener)
		})
	}

	//修复模糊的问题
	initWH(container, context){
		let backingStoreRatio = context.webkitBackingStorePixelRatio ||
														context.mozBackingStorePixelRatio ||
														context.msBackingStorePixelRatio ||
														context.oBackingStorePixelRatio ||
														context.backingStorePixelRatio || 1
		let ratio = devicePixelRatio / backingStoreRatio
		container.width = container.offsetWidth
		container.height = container.offsetHeight
		this.width = container.offsetWidth * ratio
		this.height = container.offsetHeight * ratio
	}

	add() {
		[...arguments].forEach((item, i) => {
			item._parent = this._self
			item._context = this
			this.items.add(item)
		})
	}

	remove() {
		[...arguments].forEach((item, i) => {
			this.items.delete(item)
		})
	}

	destroy() {
		this.render = false
		this.trigger('destroy')
	}

	log() {
		if (this.debug === true) {
			console.log.apply(console, arguments)
		}
	}

	static register(name, method) {
		if (!method) {
			if (type(name) !== 'string' || name.indexOf('.') === -1) return false
			let methods = name.split('.')
			if (!methods.every(m => Canvas.prototype[m])) return console.error('register error: method ' + m + ' not found!'), false
			let l = methods.length
			method = function (ctx, drawableItem) {
				for (let i = 0; i < l; i++) this[methods[i]](ctx, drawableItem)
			}
		}
		Canvas.prototype[name] = method
	}
}


(function () {
	var cache = {}
	var _div,
		getDiv = function () {
			if (!_div) {
				_div = document.createElement('div')
				Tool.extend(_div.style, {
					'position': 'absolute',
					top: -100,
					left: -100
				})
				document.getElementsByTagName('body')[0].appendChild(_div)
			}
			return _div
		}

	Canvas.prototype.getTextHeight = function () {
		if (!this.container) return
		let font = window.getComputedStyle(this.container).getPropertyValue('font')
		if (!cache[font]) {
			var div = getDiv()
			div.innerHTML = 'abcdefghijklmnopqrstuvwxyz0123456789'
			div.style['display'] = ''
			div.style['font'] = font
			cache[font] = div.offsetHeight
			div.style['display'] = 'none'
		}
		return cache[font]
	}

	Canvas.prototype.getTextWidth = function (html) {
		return (this.context && this.context.measureText(html) || {}).width
	}
})();

/*register methods*/
//shape & path
Canvas.register('rect', function rect(ctx, drawableItem) {
	let { x, y, w, h, r } = drawableItem

	ctx.beginPath()
	if (r) {
		ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 3 / 2)
		ctx.lineTo(x + w - r, y)
		ctx.arc(x + w - r, y + r, r, - Math.PI / 2, 0)
		ctx.lineTo(x + w, y + h - r)
		ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2)
		ctx.lineTo(x + r, y + h)
		ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI)
		ctx.lineTo(x, y + r)
	} else {
		ctx.moveTo(x, y)
		ctx.lineTo(x + w, y)
		ctx.lineTo(x + w, y + h)
		ctx.lineTo(x, y + h)
	}
	ctx.closePath()
})

Canvas.register('line', function line(ctx, drawableItem) {
	let { points } = drawableItem
	if (!points) return console.warn('points are not defined')
	ctx.beginPath()
	points.forEach(({ x, y }, i) => {
		if (i) {
			ctx.lineTo(x, y)
		} else {
			ctx.moveTo(x, y)
		}
	})
	// ctx.closePath()
})

Canvas.register('bezier', function bezier(ctx, drawableItem){
	let { points } = drawableItem
	if (!points) return console.warn('points are not defined')
	if(!points.length) return

	// ctx.beginPath()
	// ctx.moveTo(points[0].x, points[0].y);

	// let l = points.length
	// let i = 1
	// for (; i < l - 2; i += 2){
	// 	let xc = (points[i].x + points[i + 1].x) / 2;
	// 	let yc = (points[i].y + points[i + 1].y) / 2;
	// 	ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
	// }
	ctx.beginPath()
	ctx.moveTo((points[0].x), points[0].y);

	for(var i = 0; i < points.length-1; i ++){
		var x_mid = (points[i].x + points[i+1].x) / 2;
		var y_mid = (points[i].y + points[i+1].y) / 2;
		var cp_x1 = (x_mid + points[i].x) / 2;
		var cp_x2 = (x_mid + points[i+1].x) / 2;
		ctx.quadraticCurveTo(cp_x1,points[i].y ,x_mid, y_mid);
		ctx.quadraticCurveTo(cp_x2,points[i+1].y ,points[i+1].x,points[i+1].y);
	}
})

Canvas.register('point', function point(ctx, drawableItem) {
	let { x, y, r } = drawableItem
	ctx.beginPath()
	ctx.arc(x, y, r, 0, PI * 2)
	ctx.closePath()
})

//transform
Canvas.register('rotate', function rotate(ctx, { _transform }) {
	if (!_transform) return
})

Canvas.register('translate', function translate(ctx, { _transform }) {
	if (!_transform) return
	let { e, f } = _transform
	ctx.translate(e, f)
})

Canvas.register('scale', function scale(ctx, { _transform }) {
	if (!_transform) return
	let { a, d } = _transform
	ctx.scale(a, d)
})

Canvas.register('rotate', function rotate(ctx, { _transform }) {
	if (!_transform) return
	let { a, b, c, d } = _transform
	ctx.transform(a, b, c, d, 0, 0)
})

Canvas.register('transform', function transform(ctx, { _transform }) {
	if (!_transform) return
	let { a, b, c, d, e, f } = _transform
	ctx.transform(a, b, c, d, e, f)
})


//fill
Canvas.register('fill', function fill(ctx, { fill = '#FFF' }) {
	ctx.fillStyle = this.parseGradient(ctx, fill)
	ctx.fill()
	// ctx.closePath()
})

Canvas.register('stroke', function stroke(ctx, { stroke = '#FFF', lineWidth = 1 }) {
	ctx.lineWidth = lineWidth
	ctx.strokeStyle =  this.parseGradient(ctx, stroke)
	ctx.stroke()
	// ctx.closePath()
})

Canvas.register('text', function filltext(ctx, drawableItem) {
	let { x, y, w, h, text,
		font = '1em "Helvetica Neue",Helvetica,"PingFang SC","Hiragino Sans GB","Microsoft YaHei","微软雅黑",Arial,sans-serif',
		textBaseline = 'middle',
		textAlign = 'center',
		fill = '#CCCCCC',
		textWidth, textHeight,
		stroke, underline } = drawableItem

	ctx.font = font
	ctx.textBaseline = textBaseline
	ctx.textAlign = textAlign

	if (fill) {
		ctx.fillStyle = fill
		ctx.fillText(text, x, y)
	}
	if (stroke) {
		ctx.strokeStyle = stroke
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
	// this.point(ctx, {x, y, r: 5})
	// this.fill(ctx, {fill: 'blue'})
})

Canvas.register('image', function image(ctx, { image = null, x, y, w, h }) {
	if (!image || !image.complete)
		return;

	ctx.drawImage(image, x, y, w, h);
})

let whitespaceReg = /\s+/g
let numberReg = /\d+(?:\.\d+)?/
let emptyArray = []
let toNum = function (v) {
	return (numberReg.exec(v) || emptyArray)[0]
}
Canvas.register('shadow', function shadow(ctx, { shadow = '1px 1px 3px rgba(0, 0, 0, 1)' }) {
	let shadowOptions = shadow.trim().split(whitespaceReg)
	ctx.shadowOffsetX = toNum(shadowOptions[0])
	ctx.shadowOffsetY = toNum(shadowOptions[1])
	ctx.shadowBlur = toNum(shadowOptions[2])
	shadowOptions.splice(0, 3)
	ctx.shadowColor = shadowOptions.join('')
})


//base
Canvas.register('clean', function clean(x, y, w, h) {
	this.context.clearRect(x || 0, y || 0, w || this.width, h || this.height)
})

//tool
Canvas.register('run', function log(ctx, drawableItem) {
	let { render, _transform } = drawableItem
	if (type(render) === 'function') return render.call(this, ctx, drawableItem)
	if (_transform && render.indexOf('transform') === -1) render = 'save.transform.' + render
	if (!this[render]) Canvas.register(render)
	if (this[render]) this[render](ctx, drawableItem)
})

Canvas.register('log', function log(ctx, { name, fill, x, y, w, h }) {
	console.log(name, fill, x, y, w, h)
})

Canvas.register('alpha', function alpha(ctx, { alpha }) {
	ctx.globalAlpha = alpha
})

Canvas.register('save', function save(ctx, drawableItem) {
	if (drawableItem._saveCount == undefined) drawableItem._saveCount = 0
	ctx.save()
	drawableItem._saveCount++
})

Canvas.register('restore', function restore(ctx, drawableItem) {
	if (drawableItem._saveCount > 0) {
		ctx.restore()
		drawableItem._saveCount--
	}
})

Canvas.register('toDataUrl', function toDataUrl() {
	return this.container && this.container.toDataURL()
})

Canvas.register('parseGradient', function parseGradient(ctx, config) {
	let gradient = this.gradient[config]
	if(!gradient){
		if(['RadialGradient', 'LinearGradient'].some(key => config.indexOf(key) > -1)){
			try{
				gradient = this.gradient[config] = eval('this.create' + config.replace(/^(RadialGradient|LinearGradient)\(/, (temp) => temp + 'ctx, '))
			}
			catch (err){
				throw err
			}
		}else{
			gradient = this.gradient[config] = config
		}
	}

	return gradient
})

//all parameters [x], [y], [r] should be percentage
Canvas.register('createRadialGradient', function createRadialGradient() {
	let [ctx, x, y, r, ex, ey, er, ...args] = arguments
	let {width, height} = this
	let raduis = Math.min(width, height)
	let gradient = ctx.createRadialGradient(x * width, y * height, r * raduis, ex * width, ey * height, er * raduis)

	args.forEach(arg => gradient.addColorStop(...arg))

	return gradient
})

//all parameters [x], [y] should be percentage
Canvas.register('createLinearGradient', function createLinearGradient() {
	let [ctx, x, y, ex, ey, ...args] = arguments
	let {width, height} = this
	let gradient = ctx.createLinearGradient(x * width, y * height, ex * width, ey * height)

	args.forEach(arg => gradient.addColorStop(...arg))

	return gradient
})

;['clip'].forEach(method => {
	Canvas.register(method, function (ctx) {
		ctx[method]()
	})
})
// Canvas.prototype = {
//     destroy(){
//         this.render = function(){
//                 //console.log(this, 'destroy');
//             delete this.dom;
//             delete this.cache;
//             delete this.items;
//             return false;
//         }
//     },
//     pie (x, y, r, starta, enda) {
//         var ctx = this.getContext();
//         ctx.beginPath();
//         ctx.arc(x, y, r, starta - PI / 2, enda - PI / 2, false);
//         ctx.lineTo(x, y);
//         this.fill(this.styles);
//         return this;
//     },
//     dashLine (list, options) {
//         var self = this;
//         var dash = options && options.dash || 4, len, next, arc, temp;
//         var ctx = this.getContext();
//         Tool.each(list, function (i, p) {
//             next = list[i + 1];
//             if(next){
//                 len = Math.sqrt(Math.pow(next.x - this.x, 2) + Math.pow(next.y - this.y, 2));
//                 arc = Math.atan2(next.y - this.y, next.x - this.x);
//                 ctx.save();
//                 ctx.translate(this.x, this.y);
//                 ctx.rotate(arc);
//                 temp = 0;
//                 ctx.beginPath();
//                 while(temp < len){
//                     ctx.moveTo(temp, 0);
//                     temp = Math.min(len, temp + dash);
//                     ctx.lineTo(temp, 0);
//                     temp = Math.min(len, temp + dash);
//                 }
//                 ctx.closePath();
//                 ctx.restore();
//             }
//         });
//         return this;
//     },
//     wave(sp, ep, a, w, o, h, callback){
//         var ctx = this.getContext();
//         var x = sp.x;
//         var percision = 0.5 / w;
//         callback = callback || function(x, y){
//             return y;
//         }
//         ctx.beginPath();
//         ctx.moveTo(sp.x, sp.y);
//         for (; x <= ep.x; x += percision) {
//             ctx.lineTo(x, callback(x, a * Math.sin(w * x + o) + h));
//         }
//         return this;
//         // var precision = PI / 4 / w;
//         // var getPoint = function(x){
//         //     return {
//         //         x: x,
//         //         y: Math.round(a * Math.sin(w * x + o) + h)
//         //     };
//         // };
//         // var points = [getPoint(sp.x)];
//         // var _x = Math.ceil(sp.x / precision) * precision;
//         // while(_x < ep.x){
//         //     points.push(getPoint(_x));
//         //     _x += precision;
//         // }
//         // points.push(getPoint(ep.x));
//         // this.bezier(points);
//     },
//     bezier(points) {
//         var ctx = this.getContext();
//         var round = Math.round;
//         var l = points.length, i = 2;
//         var tx1, ty1, tx2, ty2, tmpx, tmpy;
//         // var self = this;
//         var renderArc = function(sp, p, ep){
//             tx1 = (sp.x + p.x) / 2;
//             ty1 = (sp.y + p.y) / 2;
//             tx2 = (p.x + ep.x) / 2;
//             ty2 = (p.y + ep.y) / 2;
//             tmpx = p.x - (tx1 + tx2) / 2;
//             tmpy = p.y - (ty1 + ty2) / 2;
//             tx1 += tmpx;
//             ty1 += tmpy;
//             tx2 += tmpx;
//             ty2 += tmpy;
//             // self.point(tx1, ty1, 1).fill({ color: '#F00'})
//             // self.point(tx2, ty2, 1).fill({ color: '#00F'})
//             ctx.bezierCurveTo(round(tx1), round(ty1), round(tx2), round(ty2), round(ep.x), round(ep.y));
//         }

//         switch(l){
//             case 1: return;
//             case 2: return this.line(points);
//         }
//         ctx.beginPath();
//         ctx.moveTo(round(points[0].x), round(points[0].y));
//         for( ; i < l && points[i]; i+=2){
//             // this.point(points[i - 2].x, points[i - 2].y, 1).fill()
//             // this.point(points[i - 1].x, points[i - 1].y, 1).fill()
//             // this.point(points[i].x, points[i].y, 1).fill()
//             renderArc(points[i - 2], points[i - 1], points[i]);
//         }
//         return this;
//     },
// }


export default Canvas;