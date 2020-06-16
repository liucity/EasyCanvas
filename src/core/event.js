import { isFunction, type } from '../util/util';

class EventHandler {
	constructor(name, cb) {
		this.name = name;
		this.callback = cb;
	}
}

class Event {
	constructor() {
		this._events = new Map();
	}

	on(name, cb) {
		if (!isFunction(cb)) throw 'DrawableItems: event callback should be function, but get ' + type(cb);

		const { _events } = this;
		let list = _events.get(name);
		if (!list) {
			_events.set(name, list = []);
		}
		list.push(new EventHandler(name, cb));

		return this;
	}

	one(name, cb) {
		if (!isFunction(cb)) throw 'DrawableItems: event callback should be function, but get ' + type(cb);

		const wrapper = function () {
			cb.apply(this, arguments);
			this.off(name, wrapper);
		}
		this.on(name, wrapper);

		return this;
	}

	off(name, cb) {
		const { _events } = this;
		let list = _events.get(name);

		if (list) {
			if (cb) {
				var index = list.findIndex(handler => handler.callback === cb);
				list.splice(index, 1);
			} else {
				_events.set(name, []);
			}
		}

		return this;
	}

	trigger(type, ...args) {
		let list = this._events.get(type);

		if (list) {
			list.forEach(handler => handler.callback.apply(this, args));
		}

		return this;
	}
}

export default Event;