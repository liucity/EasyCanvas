import { isNumber, isObject, obj } from '../util/util';
import Animation from '../util/animation';

let { get, set } = obj;

export default function setter(target, prop, val, params) {
  if (val == undefined) val = 0;
  const oldVal = get(target, prop);
  if (oldVal === val) return

  if (isNumber(params)){
    params = {
      duration: params
    };
  } if(!params || !isObject(params)){
    params = {};
  }

  if (params.duration) {
    Animation.animate(target, Object.assign({ property: prop, oldVal: oldVal, newVal: val }, params));
  } else {
    set(target, prop, val);
    target.trigger(prop, val);
  }
}