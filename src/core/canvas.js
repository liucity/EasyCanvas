import Event from './event'
import { isString, error } from '../util/util'

const devicePixelRatio = window.devicePixelRatio || 1;

class Canvas extends Event {
	constructor(params) {
		super();

		if (!params.el) params = { el: params };
		params = Object.assign({}, params);

		if (isString(params.el)) params.el = document.querySelector(params.el);

		if (!(params.el instanceof HTMLElement)) {
			error('canvas html el is required!');
		}

		Object.assign(this, params, {
			_context: params.el.getContext('2d'),
		});

		this.initWH();
	}

	//修复模糊的问题
	initWH() {
		let { el, _context: context } = this;
		let backingStoreRatio = context.webkitBackingStorePixelRatio ||
			context.mozBackingStorePixelRatio ||
			context.msBackingStorePixelRatio ||
			context.oBackingStorePixelRatio ||
			context.backingStorePixelRatio || 1;
		let ratio = devicePixelRatio / backingStoreRatio;
		el.width = el.offsetWidth * ratio;
		el.height = el.offsetHeight * ratio;
	}

	destroy() {
		this.trigger('destroy');
	}
}

export default Canvas;