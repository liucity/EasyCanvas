import { isFunction } from './util.js'

let requestFrame = window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function (callback) {
		window.setTimeout(callback, 1000 / 60);
	};
// let cancelFrame = window.cancelAnimationFrame ||
// 	window.webkitCancelAnimationFrame ||
// 	window.mozCancelAnimationFrame ||
// 	window.oCancelAnimationFrame ||
// 	window.msCancelAnimationFrame ||
// 	function (id) {
// 		clearTimeout(id);
// 	};
let cache = new Map();

class handler {
	constructor(callback, timestamp) {
		Object.assign(this, {
			callback: callback,
			timestamp: timestamp
		});
	}

	clearTime() {
		this.timestamp = undefined;
	}
}

let Guard = {
	lastTimestamp: null,
	request(callback) {
		cache.set(callback, new handler(callback, this.lastTimestamp));
	},
	cancel(callback) {
		cache.delete(callback);
	},
	wait(timeout, callback) {
		if (callback == undefined && isFunction(timeout)) {
			callback = timeout;
			timeout = undefined;
		}
		if (!isFunction(callback)) return;
		if (!timeout) return callback();
		this.request((t) => {
			if (t > timeout) {
				callback();
				return false;
			}
		})
		return false;
	}
}

let slowDown = 1;
let Loop = function (timestamp) {
	for (let [callback, _handler] of cache) {
		if (_handler.callback((timestamp - _handler.timestamp) / slowDown, timestamp) === false) {
			cache.delete(callback);
		}
	}
	Guard.lastTimestamp = timestamp;
	if (!document.hidden) {
		requestFrame(Loop);
	}
}

requestFrame(Loop);

export default Guard;