import Event from './event';
import { isNumber, isObject, isString, error, warn, compareObjectIsMatch } from '../util/util';
import Watch from '../observer/watch';
import Position from '../util/position';
import { PositionProps, PositionMethods } from '../util/position';
import Animation from '../util/animation';
import Transform from '../util/transform';
import setter from '../util/setter';
import { geCanvas } from '../util/generator';

const defaultParams = {
	'fillStyle': '#000',
	'font': '10px sans-serif',
	'globalAlpha': 1,
	'globalCompositeOperation': 'source-over', //
	'imageSmoothingEnabled': true,
	'lineCap': 'butt', //butt round and square
	'lineDashOffset': 0.0,
	'lineJoin': 'miter', //round, bevel and miter
	'lineWidth': 1.0,
	'miterLimit': 10.0,
	'shadowBlur': 0,
	'shadowColor': 'fully-transparent black',
	'shadowOffsetX': 0,
	'shadowOffsetY': 0,
	'strokeStyle': '#000',
	'textAlign': 'start', //"left" || "right" || "center" || "start" || "end"
	'textBaseline': 'alphabetic' //"top" || "hanging" || "middle" || "alphabetic" || "ideographic" || "bottom"
};

/* 
	props/methods that start with underline should not be used out of class 
*/
export default class Drawable extends Event {
	constructor(params) {
		super();

		if(this.constructor === Drawable){
			error("please don't use Drawable class directly!");
		}

		Object.assign(this, params, {
			_needRedrawCache: true,
			_settings: Object.assign({}, defaultParams),
			_cacheCanvas: null,
			_cacheContext: null,

			_parent: null,
			_objectChain: null,
			_children: new Set(),

			_position: new Position(params),
			_transform: new Transform(),
			_animation: new Animation(this),
			_originX: 0,
			_originY: 0,

			_mixinTransform: null,
			_dimension: null,

			_options: params
		});

		this.initCahce();
		this.initProps();
		this.initPropWatch();
		this.initEvents();
		this.trigger('inited');
	}

	get options() {
		return this._options;
	}

	get children() {
		return this._children;
	}

	initCahce(){
		const c = this._cacheCanvas = geCanvas();
		this._cacheContext = c.getContext('2d');
	}

	initProps() {
		PositionProps.forEach(prop => {
			Object.defineProperty(this, prop, {
				get() {
					return this._position[prop];
				},
				set(value) {
					this._position[prop] = value;
					this.refreshPosition();
				}
			});
		});

		PositionMethods.forEach(prop => {
			this[prop] = this._position[prop].bind(this._position);
		});
	}

	initPropWatch() {
		const { _position, _transform } = this;
		const onChange = (prop, newVal, oldVal) => {
			let { x, y, w, h, fixX = 0, fixY = 0, _cacheContext } = this;
			switch(prop){
				case 'x': x = oldVal; break;
				case 'y': x = oldVal; break;
				case 'w': w = oldVal; break;
				case 'h': h = oldVal; break;
			}
			let fx = x - fixX - 1;
			let fy = y - fixY - 1;
			let fw = w + fixX * 2 + 2;
			let fh = h + fixY * 2 + 2;
	
			_cacheContext.clearRect(fx, fy, fw, fh);

			this._needRedrawCache = true;
		};

		//TODO optimize performance?
		Watch(_position, (prop) => {
			if (this.hasPosition) {
				this.refreshDimension();
				this._children.forEach((child) => child.refreshPosition(prop));
			}
		});
		Watch(_position, onChange);

		Watch(_transform, (prop) => {
			this._children.forEach((child) => child.refreshMixinTransform());
		});
		Watch(_transform, onChange);

		Watch(this, '_objectChain', () => {
			this.refreshMixinTransform();
			this.refreshDimension();
		});

		Watch(this, '_dimension', (prop, newVal, oldVal) => {
			if(newVal){
				if(!oldVal || !compareObjectIsMatch(newVal, oldVal)) {
					this.resizeCacheCanvas();
					this.refreshCanvasStatus();
				}
			}
		});

		Watch(this, '_mixinTransform', (prop, newVal, oldVal) => {
			if(newVal){
				if(!compareObjectIsMatch(newVal, oldVal)){
					this.refreshCanvasStatus();
				}
			}
		});
	}

	initEvents() {
		this.on('added', (parent) => {
			this.refreshObjectChain();
			this.refreshPosition();
			this._children.forEach((item) => item.trigger('added', this));
		});
	}

	get hasPosition() {
		return this._position.hasPosition();
	}

	refreshPosition(...props) {
		let { _parent, _position } = this;

		if (!_parent || !_parent.hasPosition) return;
		_position.calculate(_parent._position, props);

		if (this.hasPosition) {
			this.trigger('positioned', this);
		}
	}

	refreshObjectChain() {
		let { _parent } = this;

		const objectChain = [];
		if(_parent){
			while(_parent._parent){
				objectChain.unshift(_parent);
				_parent = _parent._parent;
			} 
			objectChain.unshift(_parent);
		}

		objectChain.push(this);
		this._objectChain = objectChain;
	}

	refreshMixinTransform(){
		const { _objectChain } = this;
		let mixinTransform = null;
		_objectChain.forEach(({ _transform }) => {
			if(!mixinTransform) {
				mixinTransform = new Transform(_transform);
			} else {
				mixinTransform.mixin(_transform);
			}
		})

		this._mixinTransform = mixinTransform;
	}

	refreshDimension() {
		const { _mixinTransform } = this;
		if(!this.hasPosition) {
			return;
		}
		if(!_mixinTransform) return;

		const { x, y, w, h } = this;
		const tl = { x, y }, tr = { x: x + w, y }, bl = { x, y: y + h }, br = { x: x + w, y: y + h };
		const _tl = _mixinTransform.rxy(tl);
		const _tr = _mixinTransform.rxy(tr);
		const _bl = _mixinTransform.rxy(bl);
		const _br = _mixinTransform.rxy(br);
		const _x = Math.min(_tl.x, _tr.x, _bl.x, _br.x);
		const _y = Math.min(_tl.y, _tr.y, _bl.y, _br.y);

		this._dimension = {
			x: _x,
			y: _y,
			w: Math.max(_tl.x, _tr.x, _bl.x, _br.x) - _x,
			h: Math.max(_tl.y, _tr.y, _bl.y, _br.y) - _y
		}
	}

	resizeCacheCanvas(){
		const { _dimension, _cacheCanvas } = this;

		if(_dimension){
			_cacheCanvas.width = _dimension.w;
			_cacheCanvas.height = _dimension.h;
		}
	}

	refreshCanvasStatus(){
		const { _cacheCanvas, _mixinTransform: { a, b, c, d, e, f }, x, y } = this;
		const _cacheContext = this._cacheContext = _cacheCanvas.getContext('2d');
		_cacheContext.translate(-x, -y);
		_cacheContext.transform(a, b, c, d, e, f);
		
		//shadow, clip
		//save
		//restore
		//
		// doRender = (item) => {
		// 	let { render, _render, _transform } = item
		// 	if (_transform) {
		// 		this.save(_context, item)
		// 		this.transform(_context, item)
		// 	}
		// 	if (item.alpha != undefined) this.alpha(_context, item)
		// 	if (item._render) item._render(this, _context)

		// 	if (item._children && item._children.size) {
		// 		item._children.forEach(doRender)
		// 	}
		// 	if (item.alpha != undefined) this.alpha(_context, {
		// 		alpha: 1
		// 	})
		// 	while (item._saveCount > 0) this.restore(_context, item)
		// }
	}

	/* items ops start */
	add(...items) {
		items.forEach((item) => {
			let { _parent } = item;
			if (_parent === this) return;
			if (_parent) _parent.remove(item);
			if (item === this) error('please don\'t add self');

			item._parent = this;
			this._children.add(item);
			item.trigger('added', this);
		});
	}

	remove(...items) {
		items.forEach((item) => {
			item._parent = null;
			this._children.delete(item);
			item.trigger('removed', this);
		});
	}

	removeAll() {
		this.remove(...this._children.values());
	}

	findItem(callback) {
		if (isString(callback)) {
			const name = callback;
			callback = item => item.name === name;
		}

		for (let child of this._children) {
			if (callback(child))
				return child;
		}
	}
	/* items ops end */

	set(prop, val, params) {
		setter(this, prop, val, params);
	}

	//get set settings
	setting(key, value) {
		const { _settings } = this;

		if (value != undefined) {
			if (_settings.hasOwnProperty(key))
				this._settings[key] = value;
		} else if (_settings.hasOwnProperty(key)) {
			return _settings[key];
		} else if (isObject(key)) {
			const { _cacheContext } = this;
			Object.keys(key)
				.forEach(k => {
					if (_settings.hasOwnProperty(k) && _settings[k] !== key[k]) {
						_cacheContext[k] = _settings[k] = key[k];
					}
				});
		}

		return this;
	}

	origin(x, y){
		if(!x) return;
		if(!isNumber(x) || !isNumber(y)){
			if (!y) {
				const args = x.split(/\s/gi).filter(s => s);
				args.forEach(arg => {
					switch(arg){
						case 'left':
						case 'right':
							x = arg;
							break;
						case 'top':
						case 'bottom':
							y = arg;
							break;
					}
				});
			}
			if(!x) x = 'center';
			if(!y) y = 'center';
		}
		this._originX = x;
		this._originY = y;
		let ox, oy;

		switch(x){
			case 'left': ox = 0; break;
			case 'center': ox = w * .5; break;
			case 'right': ox = w; break;
		}
		switch(y){
			case 'top': oy = 0; break;
			case 'center': oy = h * .5; break;
			case 'bottom': oy = h; break;
		}

		this.x -= ox;
		this.y -= oy;
		this.translate(ox, oy);
	}

	translate() {
		this._transform.translate(...arguments);
	}

	scale(x, y, ...args) {
		this.origin(...args);
		this._transform.scale(x, y);
	}

	rotate(angle, ...args) {
		this.origin(...args);
		this._transform.rotate(angle);
	}

	_render() {
		if (!this.hasPosition) return;
		const { x, y, w, h, fixX = 0, fixY = 0, _cacheContext } = this;
		const fx = x - fixX - 1;
		const fy = y - fixY - 1;
		const fw = w + fixX * 2 + 2;
		const fh = h + fixY * 2 + 2;

		_cacheContext.clearRect(fx, fy, fw, fh);
		if(process.env.NODE_ENV === 'development'){
			_cacheContext.beginPath();
			_cacheContext.rect(x, y, w, h);
			_cacheContext.stroke();
		}
		this._draw(_cacheContext);
		this._needRedrawCache = false;
	}

	_draw(context, canvas) {
		// error('please define method [render]');
	}

	destroy() {
		this._children = null;
		this._cacheCanvas = null;
		this._cacheContext = null;
		this._position = null;
		this._transform = null;
		this._animation = null;
		this._options = null;
		this._canvas = null;
	}
}