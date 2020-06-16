import { warn, isNumber } from './util';

const { min } = Math;
const props = ['x', 'y', 'w', 'h', 'left', 'right', 'top', 'bottom'];

export default class Position {
	constructor(params) {
		if(params){
			props.forEach((prop) => {
				this[prop] = isNumber(params[prop]) ? params[prop] : undefined;
			});
		}
	}

	calculate(position) {
		let { x, y, w, h } = this;
		if (!isNumber(x)) {
			this.x = this.calculateX(position);
		}

		if (!isNumber(y)) {
			this.y = this.calculateY(position);
		}

		if (!isNumber(w)) {
			this.w = this.calculateW(position);
		}

		if (!isNumber(h)) {
			this.h = this.calculateH(position);
		}
	}

	calculateXY(position) {
		const { x, y, left, right, top, bottom } = this

		if (!isNumber(x)) {
			if (isNumber(left)) {
				this.x = position.x + left
			} else if (isNumber(right)) {
				this.x = position.x + position.w - right;
			}
		}

		if (!isNumber(y)) {
			if (isNumber(top)) {
				this.y = position.y + top
			} else if (isNumber(bottom)) {
				this.y = position.y + position.h - bottom;
			}
		}
	}

	calculateX(position) {
		const { w, left, right } = this;

		if (isNumber(left)) {
			return position.x + min(left, position.w);
		} else if (isNumber(right) && isNumber(w)) {
			return position.x + position.w - right - w;
		} else {
			warn('cant cal position [x]', this);
			return position.x;
		}
	}

	calculateY(position) {
		const { h, top, bottom } = this;

		if (isNumber(top)) {
			return position.y + min(top, position.h);
		} else if (isNumber(bottom) && isNumber(h)) {
			return position.y + position.h - bottom - h;
		} else {
			warn('cant cal position [y]', this, position, children);
			return position.y;
		}
	}

	calculateW(position) {
		const { x, right } = this;

		if (isNumber(x) && isNumber(right)) {
			return position.x + position.w - right - x;
			// this.w = w = position.x <= x && x <= position.x + position.w ? position.x + position.w - right - x : 0
		} else {
			warn('cant cal position [w]', this, position);
			return position.x + position.w - x;
		}
	}

	calculateH(position) {
		const { y, bottom } = this

		if (isNumber(y) && isNumber(bottom)) {
			return position.y + position.h - bottom - y;
			// this.h = h = position.y <= y && y <= position.y + position.h ? position.y + position.h - bottom - y : 0
		} else {
			warn('cant cal position [h]', this, position);
			return position.y + position.h - y;
		}
	}

	inRange(ex, ey) {
		const { x, y, w, h } = this
		return x <= ex && ex <= x + w
			&& y <= ey && ey <= y + h
	}
}