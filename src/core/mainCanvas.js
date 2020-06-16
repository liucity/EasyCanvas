import Canvas from './canvas';
import { isNumber, isString, error } from '../util/util';
import Guard from '../util/frameGuard';

const eachDrawable = (drs, cb) => {
	drs.forEach((dr) => {
		if (cb(dr) !== false) {
			eachDrawable(dr.children, cb);
		}
	});
}

class MainCanvas extends Canvas {
	constructor(params) {
		super(params);

		if (!params.el) params = { el: params };
		params = Object.assign({}, params);

		if (isString(params.el)) params.el = document.querySelector(params.el);

		if (!(params.el instanceof HTMLElement)) {
			error('canvas html el is required!');
		}

		Object.assign(this, params, {
			_rootDrawable: null,
			_isRendering: false
		});

		this.initWH();
		this.initProperties();
		this.initEvents();
	}

	initProperties() {
	}

	initEvents() {
		let { el } = this;
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
			el.addEventListener(eventName, (e) => {
				// let handlers = this.items.selectMany(item => check(item, eventName, e.offsetX, e.offsetY, e))

				// switch (eventName) {
				// 	case 'mousemove':
				// 		lastHandlers.filter(l => !handlers.find(c => l.target === c.target)).forEach(handler => {
				// 			handler.target.trigger('mouseleave', handler, handlers)
				// 			if (this.debug && handler.target.fakeRect) {
				// 				handler.target.rect = handler.target.fakeRect === 'Y' ? false : handler.target.fakeRect
				// 				handler.target.fakeRect = false
				// 			}
				// 		})
				// 		handlers.filter(c => !lastHandlers.find(l => l.target === c.target)).forEach(handler => {
				// 			handler.target.trigger('mouseenter', handler, handlers)
				// 			if (this.debug) {
				// 				handler.target.fakeRect = handler.target.rect || 'Y'
				// 				handler.target.rect = Object.assign({}, handler.target.rect, { stroke: 'red' })
				// 			}
				// 		})
				// 		break
				// }

				// handlers.forEach(handler => {
				// 	handler.target.trigger(eventName, handler, handlers)
				// })

				// lastHandlers = handlers
			})
		})

		let resizeListener = (e) => {
			this.initWH();
			this.trigger('resize');
		}
		window.addEventListener('resize', resizeListener)
		this.on('destroy', () => {
			window.removeEventListener('resize', resizeListener)
		})
	}

	setDrawable(item) {
		this._rootDrawable = item;
		if (!isNumber(item.x)) item.x = 0;
		if (!isNumber(item.y)) item.y = 0;
		if (!isNumber(item.w)) item.w = this.el.width;
		if (!isNumber(item.h)) item.h = this.el.height;
	}

	start() {
		if (this._isRendering) return;
		this._isRendering = true;

		const { _context: context, el } = this;
		Guard['request']((t) => {
			const { width: w, height: h } = el;
			if (!el || !el.parentNode) return false;
			if (document.hidden) return;

			const drawables = new Set([this._rootDrawable]);
			// update cache
			const updateCache = (drawable) => {
				if (!drawable.hasPosition) return false;
				if (drawable._needRedrawCache) {
					drawable._render();
				}
			};
			eachDrawable(drawables, updateCache);

			//draw cache
			context.clearRect(0, 0, w, h);
			const drawCache = ({ x, y, fixX = 0, fixY = 0, _cacheCanvas }) => {
				context.drawImage(_cacheCanvas, x, y);
				// context.drawImage(_cacheCanvas, x - fixX - 1, y - fixY - 1);
			};
			eachDrawable(drawables, drawCache);

			return this._isRendering;
		});
	}

	stop() {
		this._isRendering = false;
	}

	destroy() {
		this.stop();
		this.trigger('destroy');
	}
}

export default MainCanvas;