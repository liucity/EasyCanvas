class Transform {
	constructor(params) {
		this.reset()
		Object.keys(params || {}).filter(key => isNaN(params[key])).forEach(key => {
			delete params[key]
		})
		Object.assign(this, params)
	}

	reset() {
		this.a = 1
		this.b = 0
		this.c = 0
		this.d = 1
		this.e = 0
		this.f = 0
	}

	x(x, y) {
		let { a, b, c, d, e, f } = this

		if (c === 0) return (x - e) / a

		if (d === 0) return (y - f) / b

		return (d * x - c * y - d * e + c * f) / (a * d - b * c)
	}

	rx(x, y) {
		let { a, b, c, d, e, f } = this

		return a * x + c * y + e
	}

	y(x, y) {
		let { a, b, c, d, e, f } = this

		if (a === 0) return (x - e) / c

		if (b === 0) return (y - f) / d

		return (b * x - a * y - b * e + a * f) / (b * c - a * d)
	}

	ry(x, y) {
		let { a, b, c, d, e, f } = this

		return b * x + d * y + f
	}

	mix(transform) {
		let { a: A, b: B, c: C, d: D, e: E, f: F } = transform
		let { a, b, c, d, e, f } = this

		return new Transform({
			a: A * a + B * c,
			b: A * b + B * d,
			c: C * a + D * c,
			d: C * b + D * d,
			e: a * E + F * c + e,
			f: b * E + F * d + f
		})
	}
}

export default Transform