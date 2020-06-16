import { isNumber } from './util';

export const TransformProps = ['a', 'b', 'c', 'd', 'e', 'f'];
const { PI } = Math;

export default class Transform {
	constructor(params) {
		this.reset();

		if(params){
			TransformProps.forEach(key => {
				if(isNumber(params[key])) 
					this[key] = params[key];
			});
		}
	}

	reset() {
		this.a = 1;
		this.b = 0;
		this.c = 0;
		this.d = 1;
		this.e = 0;
		this.f = 0;
	}

	xy({x, y}){
		const { a, b, c, d, e, f } = this;
		let nx, ny;

		if (c === 0) nx = (x - e) / a;
		else if (d === 0) nx = (y - f) / b;
		else nx = (d * x - c * y - d * e + c * f) / (a * d - b * c);

		if (a === 0) ny = (x - e) / c;
		else if (b === 0) ny = (y - f) / d;
		else ny = (b * x - a * y - b * e + a * f) / (b * c - a * d);

		return {
			x: nx,
			y: ny
		};
	}

	rxy({ x, y }){
		let { a, b, c, d, e, f } = this;

		return {
			x: a * x + c * y + e,
			y: b * x + d * y + f
		};
	}

	mixin(transform){
		if(!(transform instanceof Transform)) throw 'require Transform!';
		
		const { a: A, b: B, c: C, d: D, e: E, f: F } = transform;
		const { a, b, c, d, e, f } = this;
		let mixinResult = {
			a: A * a + B * c,
			b: A * b + B * d,
			c: C * a + D * c,
			d: C * b + D * d,
			e: a * E + F * c + e,
			f: b * E + F * d + f
		};

		Object.assign(this, mixinResult);
	}

	translate(x, y){
		if(!isNumber(x) || !isNumber(y)) throw new Error('should be number');
		this.mixin(new Transform({e: x, f: y}));
	}

	rotate(a){
		if(!isNumber(a)) throw new Error('should be number');
		
		const cosA = Math.cos(a * PI / 180);
		const sinA = Math.sin(a * PI / 180);
		this.mixin(new Transform({a: cosA, b: sinA, c: -sinA, d: cosA}));
	}

	scale(x, y){
		if(!isNumber(x) || !isNumber(y)) throw new Error('should be number');
		this.mixin(new Transform({a: x, b: y}));
	}
}