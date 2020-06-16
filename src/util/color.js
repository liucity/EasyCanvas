const RGBReg = /^rgb(\((\s*\d+\s*\,\s*){2}|a\((\s*\d+\s*\,\s*){3})\s*\d+\s*\)$/
const SHEXReg = /^\#?[\da-fA-F]{3}$/;
const HEXReg = /^\#?[\da-fA-F]{6}$/;
const dReg = /\d+/;
const toHEX = function (v) {
	v = parseInt(v, 10).toString(16);
	return v.length === 1 ? '0' + v : v;
}
const toDecimal = function (v, f) {
	return parseInt(v, f || 16);
}

export class Color {
	constructor(r, g, b, a) {
		if (r instanceof Color) return r.clone();
	
		let sourceFormat = 10;
		if (g === undefined) {
			let ms;
			if (RGBReg.test(r)) {
				ms = r.match(dReg);
			} else if (HEXReg.test(r)) {
				let temp = r.replace('#', '');
				ms = [];
				for (let i = 0; i < 6; i += 2) {
					ms.push(temp[i] + temp[i + 1]);
				}
				sourceFormat = 16;
			} else if (SHEXReg.test(r)) {
				let temp = r.replace('#', '');
				ms = [];
				for (let i = 0; i < 3; i++) {
					ms.push(temp[i] + temp[i]);
				}
				sourceFormat = 16;
			} else {
				ms = [];
			}
			[r, g, b, a] = ms;
		}
	
		this.r = toDecimal(r, sourceFormat) || 0;
		this.g = toDecimal(g, sourceFormat) || 0;
		this.b = toDecimal(b, sourceFormat) || 0;
		this.a = toDecimal(a, sourceFormat) || 1;
	}
	
	clone() {
		return new Color(this.r, this.g, this.b, this.a);
	}
	red(r) {
		this.r = r;
		return this;
	}
	green(g) {
		this.g = g;
		return this;
	}
	blue(b) {
		this.b = b;
		return this;
	}
	alpha(a) {
		this.a = a;
		return this;
	}
	toHEX() {
		return '#' + toHEX(this.r) + toHEX(this.g) + toHEX(this.b);
	}
	toRGB() {
		return `rgb(${this.r}, ${this.g}, ${this.b})`;
	}
	toRGBA() {
		return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
	}

	static fix(from, to, percentage) {
		const fix = function (type) {
			return from[type] + (to[type] - from[type]) * percentage;
		}
		return new Color(fix('r'), fix('g'), fix('b'), fix('a'));
	}
}