let hasOwn = [].hasOwnProperty;
let tostring = Object.prototype.toString;

export function type(obj) {
	switch (tostring.call(obj)) {
		case '[object Object]': return 'object';
		case '[object Number]': return 'number';
		case '[object String]': return 'string';
		case '[object Function]': return 'function';
		case '[object Array]': return 'array';
		case '[object Arguments]': return 'arguments';
		case '[object Boolean]': return 'bool';
		case '[object Null]': return 'null';
		case '[object Undefined]': return 'undefined';
	}
}
export const isObject = (obj) => type(obj) === 'object';
export const isArray = (obj) => type(obj) === 'array';
export const isFunction = (obj) => type(obj) === 'function';
export const isString = (obj) => type(obj) === 'string';
export const isBool = (obj) => type(obj) === 'bool';
export const isPlainObject = (obj) => {
  if (!obj || !isObject(obj)) return false;
  if (obj.constructor && !hasOwn.call(obj.constructor.prototype, "isPrototypeOf")) return false;
  return true;
}

export function error() {
	console.error(...arguments);
	throw 'error occurs!';
}
export function warn() {
	console.warn(...arguments);
}

export const isNumber = (val) => !isNaN(val);
export const random = (max) => Math.floor(Math.random() * max);
export const range = (val, min, max) => Math.max(Math.min(val, max), min);

export function extend (target, ...args) {
	args.forEach(item => {
		if (type(item) === 'object') {
			Object.keys(item).forEach(k => {
				if(hasOwn.call(item, k)){
					const v = item[k];
					if (v !== undefined) {
						if (isPlainObject(v)) {
							target[k] = extend(target[k] || {}, v);
						} else {
							target[k] = v;
						}
					}
				}
			});
		}
	});
	return target
}

export function compareObjectIsMatch(oTarget, oCompare){
	if(oTarget === oCompare) return true;
	if(!oTarget || !oCompare) return false;
	const targetKeys = Object.keys(oTarget);
	const compareKeys = Object.keys(oCompare);
	if(targetKeys.length !== compareKeys.length 
		|| targetKeys.some(k => !compareKeys.includes(k)) 
		|| compareKeys.some(k => !targetKeys.includes(k))) 
		return false;
	return targetKeys.every(k => oTarget[k] === oCompare[k]);
}

export const obj = {
	get(obj, properties, delimiter = '.') {
		const props = properties.split(delimiter);

    for(let prop of props) {
      obj = obj[prop];
      if(obj === undefined) break;
    }

		return obj;
	},
	set(obj, properties, val, delimiter = '.') {
    const props = properties.split(delimiter);
    const lastProp = props.pop();

    for(let prop of props) {
      if (!obj[prop]) obj[prop] = {};
      obj = obj[prop];
    }

		obj[lastProp] = val;
	},
	has(obj, properties, delimiter = '.') {
		const props = properties.split(delimiter);
    const lastProp = props.pop();

    for(let prop of props) {
      obj = obj[prop];
      if(obj === undefined) break;
    }
    
		return !!obj && hasOwn.call(obj, lastProp);
	}
}

export const number = (function(){
	let float2Fixed = (num) => {
		if(isNaN(num)) return NaN;
		return +num.toString().replace('.', '')
	}
	let digitLength = (num) => {
		if(isNaN(num)) return NaN;
		return (num.toString().split('.')[1] || '').length
	}
	
	let plus = (num1, num2, ...nums) => {
		if(nums.length){
				return plus(plus(num1, num2), nums[0], ...nums.slice(1));
		}
		const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
		return (times(num1, baseNum) + times(num2, baseNum)) / baseNum;
	};
	
	let minus = (num1, num2, ...nums) => {
		if(nums.length){
				return minus(minus(num1, num2), nums[0], ...nums.slice(1));
		}
		const baseNum = Math.pow(10, Math.max(digitLength(num1), digitLength(num2)));
		return (times(num1, baseNum) - times(num2, baseNum)) / baseNum;
	}
	
	let times = (num1, num2, ...nums) => {
		if(nums.length){
				return times(times(num1, num2), nums[0], ...nums.slice(1));
		}
		const baseNum = Math.pow(10, digitLength(num1) + digitLength(num2));
		return float2Fixed(num1) * float2Fixed(num2) / baseNum;
	}
	
	let divide = (num1, num2, ...nums) => {
		if(nums.length){
				return divide(divide(num1, num2), nums[0], ...nums.slice(1));
		}
		return times(float2Fixed(num1) / float2Fixed(num2), Math.pow(10, digitLength(num2) - digitLength(num1)));
	}
	
	let avg = (...datas) => {
		return divide(plus(...datas), datas.length);
	};
	
	let diff = (source, target) => {
		return divide(minus(target, source), source);
	}
	
	let fix = (source, length) => {
		let baseNum = Math.pow(10, length);
		return divide(Math.round(times(source, baseNum)), baseNum)
	}
	
	return {
		plus: plus,
		minus: minus,
		times: times,
		divide: divide,
		avg: avg,
		diff: diff,
		fix: fix
	}
})();