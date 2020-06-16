import Event from './event.js'
import { isFunction, isObject, isString, obj } from './util'
import Watch from './watch.js'
import Position from './position.js'
import Animations from './Animation.js'
import Guard from './frameGuard.js'
import LinqSet from './LinqSet.js'
import Transform from './transform'

let { get, set, has } = obj
let { round } = Math
let hasOwn = Object.hasOwnProperty
let getAvailableValue = function () {
	let l = arguments.length, i = 0
	while (i < l) {
		if (arguments[i] !== undefined) return arguments[i]
		i++
	}
}
let roundCheckReg = /^(?=x|y|w|h|r)$/gi
let log = function () {
	if (arguments[0] !== true) return
	console.log.apply(console, arguments)
}
let shapes = {}
let drawMethods = ['fill', 'stroke', 'clip']
let saveContentMethods = ['shadow', 'clip']

class Drawable extends Event {
	constructor(params) {
		super()

		Object.assign(this, {
			_animationTarget: this.initAnimationTarget(),
			_children: LinqSet(),
			_position: null,
			_transform: new Transform(),
			_render: function (layout, _context) {
				let needSave = saveContentMethods.filter(method => this['_' + method])
				if (needSave.length) {
					layout['save'](_context, this)
					if(this['_shadow'])
						layout['shadow'](_context, this['_shadow'])
				}

				Object.keys(this)
					.map(key => shapes[key.replace(/^\_/, '')])
					.forEach(shape => {
						let item = this['_' + (shape || {}).name]
						if (item) {
							switch (shape.name) {
								case 'shadow':
									break;
								default:
									shape.render(layout, _context, item)
									break;
							}
						}
					})

				if (needSave) {
					layout['restore'](_context, this)
				}
			},
			_options: params
		}, params)

		this.on('init', () => {
			this.initPropWatch()
			this.initEvents()
		})

		this.trigger('init')

		this.refreshPosition()
	}

	get shapes() {
		return shapes
	}

	get hasPosition() {
		return this._position
			&& this._position.x
			&& this._position.y
			&& this._position.w
			&& this._position.h
	}

	initAnimationTarget() {
		let map = new Map();
		let animate = (t, def) => {
			let { property, animate, duration, newVal, isEnd } = def
			let _val = t > duration ? newVal : animate(t)
			set(this, property, roundCheckReg.test(property) ? round(_val) : _val)
			this.trigger(property, _val)
			def.t = t

			if (t > duration) isEnd = true
			if (isEnd) {
				if (map.get(property) === def) {
					map.delete(property)
				}
				this.trigger('animateEnd', property, _val)
				return false;
			}
		}
		let registerAnimate = (property, def) => {
			map.delete(property)
			def.isEnd = false
			Guard.request((t) => {
				if (def.isEnd) {
					return false
				}
				return animate(t, def)
			})
		}

		['set'].forEach((methodKey) => {
			let method = map[methodKey]
			map[methodKey] = function () {
				registerAnimate.apply(null, arguments)
				method.apply(map, arguments)
			}
		});

		['delete'].forEach((methodKey) => {
			let method = map[methodKey]
			map[methodKey] = function (property) {
				if (map.has(property)) {
					map.get(property).isEnd = true
				}
				method.apply(map, arguments)
			}
		})

		return map
	}

	initPropWatch() {
		Watch(this, '_context', (prop, newVal, oldVal) => {
			this.trigger('added', newVal)
		})
		//text, rect, point, line, shadow
		Watch(this, Object.keys(shapes), (prop, newVal, oldVal) => {
			this['_' + prop] = shapes[prop].method.call(this, newVal, this._position)
		})
	}

	initEvents() {
		this.on('added', (parent) => {
			this.refreshPosition()

			Object.assign(this, this._options) // init default props

			if (this._children && this._children.size) {
				this._children.forEach((item) => item.trigger('added', this))
			}
		})
	}

	refreshPosition() {
		let position = new Position(this._options)

		this._position = position
		if (!this._parent || !this._parent._position || isNaN(this._parent._position.x)) return
		this._position.calculate(this._parent._position, this._children)
		log(this.name, this, position, this._parent._position)
		Watch(position, (prop, newVal, oldVal) => {
			if (newVal !== oldVal) {
				log(this.name, prop, newVal, '===================')
				this._options[prop] = newVal
				this.refreshPosition()
			}
		})

		this._children.forEach((c) => {
			c.refreshPosition && c.refreshPosition()
		})

		this.refreshShapes()

		if (this.hasPosition)
			this.trigger('positioned', this)
	}

	refreshShapes() {
		Object.keys(shapes).forEach(key => {
			if (this['_' + key]) this['_' + key] = shapes[key].method.call(this, this[key], this._position)
		})
	}

	add() {
		[...arguments].forEach((item, i) => {
			if (item._parent) item._parent.remove(item)
			if (item === this) throw 'please don\'t add self'
			item._parent = this
			this._children.add(item)
			item.trigger('added', this)
		})
	}

	remove() {
		[...arguments].forEach((item, i) => {
			delete item._parent
			this._children.delete(item)
			item.trigger('removed', this)
		})
	}

	removeAll(){
		this.remove(...this._children.values())
	}

	animate({ property, oldVal, newVal, animationType = 'linear', duration }) {
		if (property == undefined || newVal == undefined || duration == undefined || !(animationType in Animations)) return false;
		oldVal = getAvailableValue(oldVal, get(this, property), 0);
		let animate = Animations[animationType](oldVal, newVal, duration);
		this._animationTarget.set(property, { property, animate, duration, newVal })

		return this;
	}

	set(prop, val, params, checkWait) {
		if (val == undefined) return
		// if(checkWait !== false && this._waits){
		//     console.log('wait set')
		//     return this._waits.push({prop, val, params})
		// }
		if (has(this, '_position.' + prop)) prop = '_position.' + prop
		if (get(this, prop) !== val) {
			let isObj = isObject(params)
			let _duration = isObj ? params.duration : params
			if (_duration) {
				this.animate(Object.assign({ property: prop, newVal: val }, isObj ? params : { duration: _duration }))
			} else {
				set(this, prop, val)
				this.trigger(prop, val)
			}
		}
	}

	wait(timeout, callback) {
		if (isFunction(timeout)) {
			callback = timeout
			timeout = undefined
		}
		if (!timeout && this._animationTarget.size) {
			timeout = 0
			for (let { duration, _t } of this._animationTarget.values()) {
				timeout = Math.max(timeout, duration - (_t || 0))
			}
		}

		if (timeout) {
			// var _waits = []
			Guard.wait(timeout, () => {
				// _waits.forEach((def) => {
				//     this.set(def.prop, def.val, def.params, false)
				// })
				// if(this._waits === _waits) this._waits = false
				callback()
			})
			// this._waits = _waits
		} else {
			callback()
		}

		return this
	}

	// repeat(callback, count){
	//     let temp = this._waits
	//     let _repeats = []
	//     this._waits = _repeats

	//     this.wait = undefined //disable wait
	//     callback.call(this)
	//     delete this.wait

	//     this._waits = temp

	//     let repeat = (currentDefs) => {
	//         let nextDefs = []
	//         currentDefs.forEach(({prop, val, params}) => {
	//             nextDefs.push({
	//                 prop, 
	//                 val: get(this, '_position.' + prop) || get(this, prop) || 0,
	//                 params
	//             })
	//             this.set(prop, val, params, false)
	//         })

	//         if(isNaN(count) || count-- > 0){
	//             this.wait(() => {
	//                 repeat(nextDefs.reverse())
	//             })
	//         }
	//     }
	//     repeat(_repeats)

	//     return this
	// }

	find(callback){
		if(isString(callback)){
			let name = callback
			callback = item => item.name === name
		}
		return [...this._children.values()].find(callback)
	}

	inRange(ex, ey) {
		return this._position && this._position.inRange(ex, ey)
	}

	static register(name, method) {
		Drawable.prototype[name] = method
	}

	static addShape(name, method, render) {
		shapes[name] = {
			name,
			method,
			render: render || function (layout, context, item) {
				if (drawMethods.some(method => item[method])) {
					layout[name](context, item)
					Drawable.drawPath(layout, context, item)
				}
			}
		}
	}

	static extend(name, method) {
		if (!Drawable.prototype[name]) {
			console.warn('extend target func not exist')
		}
		let wrapper = Drawable.prototype[name]
		Drawable.prototype[name] = function () {
			isFunction(wrapper) && wrapper.apply(this, arguments)
			isFunction(method) && method.apply(this, arguments)
		}
	}

	static drawPath(layout, context, item){
		let availableMethods = drawMethods.filter(method => item[method])

		if(availableMethods.length){
			availableMethods.forEach(method => {
				let params = {}
				params[method] = item[method]
				layout[method](context, params)
			})
		}
	}
}

export default Drawable