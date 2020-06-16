import { type, isObject, isFunction, isArray, error, warn } from '../util/util.js';
import Observer from './observer';

export default function Watch(target, prop, onChange) {
	if (!isObject(target)) return error('Expire Object, got [' + type(target) + ']');
	if (isFunction(prop)) {
		onChange = prop;
		prop = undefined;
	}
	if (!isFunction(onChange)) {
		return warn('please set a listener!')
	}

	let keys = prop
		? isArray(prop) ? prop : [prop]
		: Object.keys(target);

	if(!target.__ob__) {
		target.__ob__ = new Observer(target);
	}

	const { __ob__: ob } = target;
	keys.forEach(key => ob.on(key, onChange));
}