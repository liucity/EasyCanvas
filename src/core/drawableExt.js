import Drawable from './drawable.js'
import Position from './position.js'
import Transform from './transform.js'
import { isObject, isArray, isString, obj } from './util.js'

let PI = Math.PI
let isNumber = (v) => !isNaN(v)
let transformProperties = ['a', 'b', 'c', 'd', 'e', 'f']

Drawable.register('moveTo', function moveTo(x, y, duration) {
	this.set('x', x, duration)
	this.set('y', y, duration)

	return this;
})

Drawable.register('translate', function translate(x, y, duration) {
	return this.transform(undefined, undefined, undefined, undefined, x, y, duration)
})

Drawable.register('scale', function scale(x, y, duration) {
	return this.transform(x, undefined, undefined, y, undefined, undefined, duration)
})

Drawable.register('rotate', function rotate(direction, angle, duration = 1) {
	this.locate(direction)

	let lastAngle = 0
	this.angle = 0
	this.set('angle', angle, duration)
	this.off('angle')
	this.on('angle', (v) => {
		let cosV = Math.cos((v - lastAngle) * PI / 180)
		let sinV = Math.sin((v - lastAngle) * PI / 180)
		lastAngle = v

		// console.log('angle', this.name, cosV, sinV, -sinV, cosV)
		this.transform(cosV, sinV, -sinV, cosV, undefined, undefined, undefined, false)
	})

	return this
})

Drawable.register('transform', function transform(a, b, c, d, e, f, duration, isCheckWait) {
	let animates = this._animationTarget
	let lastAnimateProps = {}
	transformProperties.forEach(prop => {
		let animate = animates.get('_transform.' + prop)
		if (animate) {
			lastAnimateProps[prop] = animate.newVal
			lastAnimateProps[prop + 'D'] = Math.max(animate.duration - (animate.t || 0), duration || 0)
		} else {
			lastAnimateProps[prop] = this._transform[prop]
		}
	})
	// console.log("【" + this.name + "】", ...transformProperties.map(prop => prop + ': ' + lastAnimateProps[prop]))
	let lastAnimateTransform = new Transform(lastAnimateProps)
	//mix transform
	lastAnimateTransform = lastAnimateTransform.mix(new Transform({
		a, b, c, d, e, f
	}))

	transformProperties.forEach(prop => this.set('_transform.' + prop, lastAnimateTransform[prop], lastAnimateProps[prop + 'D'] || duration, isCheckWait))
	return this
})

Drawable.register('opacity', function opacity(from, to, duration) {
	this.alpha = from
	this.set('alpha', to, duration)

	return this
})

Drawable.register('show', function show(duration) {
	return this.opacity(0, 1, duration)
})

Drawable.register('hide', function hide(duration) {
	return this.opacity(1, 0, duration)
})

Drawable.register('reset', function reset(duration) {
	this.locate()
	this._transform.reset()
	return this
})

Drawable.register('locate', function locate(direction) {
	let { _options, _position } = this
	let { x, y, w, h } = _position || {}
	let _x, _y
	switch (direction) {
		case 'center':
			_x = - w / 2
			_y = - h / 2
			break;
		case 'top':
			_x = - w / 2
			_y = 0
			break;
		case 'right':
			_x = - w
			_y = - h / 2
			break;
		case 'bottom':
			_x = - w / 2
			_y = - h
			break;
		case 'left':
			_x = 0
			_y = - h / 2
			break;
		default:
			_x = x + this._transform.e
			_y = y + this._transform.f
			break;
	}

	if (isNumber(_options.x) && isNumber(_options.y)) {
		this.moveTo(_x, _y).translate(x - _x, y - _y)
	} else if (isNumber(_options.left) && isNumber(_options.top)) {
		this.set('left', _options.left - x + _x)
		this.set('top', _options.top - y + _y)
		this.translate(x - _x, y - _y)
	} else {
		console.warn('??')
	}

	return this
})

//type in/out
//direction center/top/right/bottom/left
Drawable.register('fade', function fade(type = 'in', direction = 'center', animationType = 'quadEaseIn', duration) {
	this.locate(direction)

	let params = {
		duration,
		animationType
	}
	switch (type) {
		case 'in':
			this.scale(0, 0).scale(1, 1, params)
			break;
		case 'out':
			this.scale(1, 1).scale(0, 0, params)
			break;
	}

	return this
})

Drawable.register('pulse', function pulse(direction = 'center', animationType = 'quadEaseIn', range = 5, duration) {
	this.locate(direction)

	let params = {
		duration: duration / 2,
		animationType
	}
	range /= 100;
	this.scale(1 + range, 1 + range, params).scale(1 - range, 1 - range, params)

	return this
})

Drawable.register('rotateSelfInfinity', function rotateSelfInfinity(angleSpead) {
	if (this._rotateSelfInfinity) {
		this._rotateSelfInfinity.angleSpead = angleSpead
		return this
	}

	this._rotateSelfInfinity = {
		angleSpead
	}
	let onAnimateEnd = (prop) => {
		if (prop === 'angle') {
			this.rotate('center', this._rotateSelfInfinity.angleSpead, 1000)
		}
	}
	this.rotate('center', angleSpead, 1000)
		.on('animateEnd', onAnimateEnd)
		.on('removed', () => {
			console.log('this.removed')
			this.off('animateEnd', onAnimateEnd)
		});

	return this
})


/*Shapes*/
Drawable.addShape('shadow', function shadow(val, position) {
	if (!val) return

	let item = {
		shadow: isObject(val) ? val.shadow : val
	}

	return item
})

Drawable.addShape('rect', function rect(val, position) {
	if (!val) return

	let { x, y, w, h } = position || {}
	let { fill, stroke } = this
	let item = Object.assign({ x, y, w, h, fill, stroke }, isObject(val) ? val : undefined)

	return item
})

Drawable.addShape('line', function line(val, position) {
	if (!val || !position) return

	let { fill, stroke } = this
	let generatePoints = (ps) => {
		if (!ps) return []
		if (!isArray(ps)) ps = [ps]
		if (!ps.length) return []

		if (isArray(ps[0])) {
			ps = ps.map(p => p.points ? p : { points: p })
		}
		if (!ps[0].points) ps = [{ points: ps }]

		return ps.map(p => {
			return Object.assign({
				fill,
				stroke
			}, p, {
					points: p.points.map(p => {
						let point = new Position(p)
						point.calculateXY(position)
						return point
					})
				})
		})
	}

	let item = generatePoints(val)
	return item
}, function (layout, context, item) {
	item.forEach((p) => {
		layout[this.name](context, p)
		Drawable.drawPath(layout, context, p)
	})
})

Drawable.addShape('point', function point(val, position) {
	if (!val) return

	let { x, y } = position || {}
	let { fill, stroke } = this
	let item = Object.assign({ x, y, fill, stroke }, isObject(val) ? val : undefined)

	return item
})

Drawable.addShape('points', function points(val, position) {
	if (!val || !position) return

	let { fill, stroke } = this
	let generatePoints = (ps) => {
		if (!ps) return []
		if (!isArray(ps)) ps = [ps]
		if (!ps.length) return []

		return ps.map(p => {
			let point = new Position(p)
			point.calculateXY(position)
			return Object.assign(point, {
				fill,
				stroke
			}, p)
		})
	}

	let item = generatePoints(val)
	return item
}, function (layout, context, item) {
	item.forEach((p) => {
		layout['point'](context, p)
		Drawable.drawPath(layout, context, p)
	})
})


Drawable.addShape('bezier', function points(val, position) {
	if (!val || !position) return

	let { fill, stroke } = this
	let generatePoints = (ps) => {
		if (!ps) return []
		if (!isArray(ps)) ps = [ps]
		if (!ps.length) return []
		if (!ps[0].points) ps = [{ points: ps }]

		return ps.map(p => {
			return Object.assign({
					fill,
					stroke
				}, p, {
					points: p.points.map(p => {
						let point = new Position(p)
						point.calculateXY(position)
						return point
					})
				})
		})
	}

	let item = generatePoints(val)
	return item
}, function (layout, context, item) {
	item.forEach((p) => {
		layout[this.name](context, p)
		Drawable.drawPath(layout, context, p)
	})
})

Drawable.addShape('text', function text(val, position) {
	let { x, y, w, h } = position || {}
	let item

	if (isObject(val)) {
		item = Object.assign({
			text: isObject(val) ? val.text : val
		}, val)
	} else {
		item = {
			text: val
		}
	}

	switch (item.textBaseline) {
		case 'top':
			break;
		case 'bottom':
			y = y + h
			break;
		default:
			if (item.textBaseline === 'middle' || item.textBaseline === undefined) {
				y = y + h / 2
			}
			break;
	}

	switch (item.textAlign) {
		case 'left':
			x = x
			break;
		case 'right':
			x = x + w
			break;
		default:
			if (item.textAlign === 'center' || item.textAlign === undefined) {
				x = x + w / 2
			}
			break;
	}

	let fill = item.fill || this.fill
	let stroke = item.stroke || this.stroke
	Object.assign(item, { x, y, fill, stroke })

	return item
}, function (layout, context, item) {
	layout[this.name](context, item)
})

Drawable.addShape('image', function image(val, position) {
	if (!val) return

	if (isObject(val)) {
		if (!val.image) return;
		if (val.tagName === 'IMG') {
			val = {
				image: val
			}
		}
	} else if (isString(val)) {
		let img = document.createElement('img');
		img.src = val;
		val = {
			image: img
		}
	} else {
		return;
	}

	let { x, y, w, h } = position || {}
	let item = Object.assign({ x, y, w, h }, val)

	return item
}, function (layout, context, item) {
	layout[this.name](context, item)
})


export default Drawable