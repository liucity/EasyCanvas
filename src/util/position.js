import { warn, isNumber } from './util';

export const PositionProps = ['x', 'y', 'w', 'h', 'left', 'right', 'top', 'bottom'];
export const PositionMethods = ['inRange'];

const { min } = Math;
const hasKey = (keys = [], ...defines) => {
	if(!defines) return false;
	return new Set([...keys, ...defines]).size < keys.length + defines.length;
}
//TODO support string value;

export default class Position {
	constructor(params) {
		PositionProps.forEach((prop) => {
			this[prop] = params && isNumber(params[prop]) ? params[prop] : undefined;
		});
	}

	calculate(position, props) {
		let { x, y, w, h } = this;
		
		if (!isNumber(x) || props && hasKey(props, 'w', 'left', 'right')) {
			this.x = this.calculateX(position);
		}

		if (!isNumber(y) || props && hasKey(props, 'h', 'top', 'bottom')) {
			this.y = this.calculateY(position);
		}

		if (!isNumber(w) || props && hasKey(props, 'x', 'right')) {
			this.w = this.calculateW(position);
		}

		if (!isNumber(h) || props && hasKey(props, 'y', 'bottom')) {
			this.h = this.calculateH(position);
		}
	}

	calculateX(position) {
		const { w, left, right, x } = this;

		if (isNumber(left)) {
			return position.x + min(left, position.w);
		} else if (isNumber(right) && isNumber(w)) {
			return position.x + position.w - right - w;
		} else if (!isNumber(x)) {
			warn('cant cal position [x]', this);
			return position.x;
		}
	}

	calculateY(position) {
		const { h, top, bottom, y } = this;

		if (isNumber(top)) {
			return position.y + min(top, position.h);
		} else if (isNumber(bottom) && isNumber(h)) {
			return position.y + position.h - bottom - h;
		} else if (!isNumber(y)) {
			warn('cant cal position [y]', this);
			return position.y;
		}
	}

	calculateW(position) {
		const { x, right, w } = this;

		if (isNumber(x) && isNumber(right)) {
			return position.x + position.w - right - x;
			// this.w = w = position.x <= x && x <= position.x + position.w ? position.x + position.w - right - x : 0
		} else if(!isNumber(w)) {
			warn('cant cal position [w]', this);
			return position.x + position.w - x;
		}
	}

	calculateH(position) {
		const { y, bottom, h } = this;

		if (isNumber(y) && isNumber(bottom)) {
			return position.y + position.h - bottom - y;
			// this.h = h = position.y <= y && y <= position.y + position.h ? position.y + position.h - bottom - y : 0
		} else if (!isNumber(h)) {
			warn('cant cal position [h]', this);
			return position.y + position.h - y;
		}
	}

	calculateXY(position) {
		const { x, y, left, right, top, bottom } = this;

		if (!isNumber(x)) {
			if (isNumber(left)) {
				this.x = position.x + left;
			} else if (isNumber(right)) {
				this.x = position.x + position.w - right;
			}
		}

		if (!isNumber(y)) {
			if (isNumber(top)) {
				this.y = position.y + top;
			} else if (isNumber(bottom)) {
				this.y = position.y + position.h - bottom;
			}
		}
	}
	
	hasPosition() {
		const { x, y, w, h } = this;
		return isNumber(x)
			&& isNumber(y)
			&& isNumber(w)
			&& isNumber(h);
	}

	inRange(ex, ey) {
		const { x, y, w, h } = this;
		return x <= ex 
			&& ex <= x + w
			&& y <= ey 
			&& ey <= y + h;
	}
}