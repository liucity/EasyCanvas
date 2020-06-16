const { PI, sin, cos } = Math;
const PId2 = PI / 2;
/*
    s:starting value
    e:final value
    d:duration of animation
*/

export default {
	linear: function (s, e, d) {
		const a = (e - s) / d, 
			b = s;
		return function (t) {
			return a * t + b;
		}
	},
	sinEaseIn: function (s, e, d) {
		const a = -(e - s),
			w = PId2 / d,
			b = e;
		return function (t) {
			return a * sin(w * t) + b;
		}
	},
	sinEaseOut: function (s, e, d) {
		const a = e - s,
			w = PId2 / d,
			b = s;
		return function (t) {
			return a * sin(w * t) + b;
		}
	},
	sinEaseInOut: function (s, e, d) {
		const a = -(e - s) / 2,
			w = PI / d,
			b = s;
		return function (t) {
			return a * (cos(w * t) - 1) + b;
		}
	},
	quadEaseIn: function (s, e, d) {
		const a = e - s,
			b = s;
		return function (t) {
			return a * (t /= d) * t + b;
		}
	},
	quadEaseOut: function (s, e, d) {
		const a = -(e - s),
			b = s;
		return function (t) {
			return a * (t /= d) * (t - 2) + b;
		}
	},
	quadEaseInOut: function (s, e, d) {
		const a = (e - s) / 2,
			b = s;
		return function (t) {
			return (t /= d / 2) < 1 ? a * t * t + b : -a * ((--t) * (t - 2) - 1) + b;
		}
	},
	step: function (s, e, d) {
		return function () {
			return e;
		};
	}
};