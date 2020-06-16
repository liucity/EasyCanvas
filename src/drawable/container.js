import Drawable from '../core/drawable';
import MainCanvas from '../core/mainCanvas';
import { error, warn } from '../util/util';

export default class Container extends Drawable {
  constructor(params){
    super(...arguments);

    Object.assign(this, {
			_isRoot: false,
			_canvas: null
    });

    if(params.el){
      this.bind(params.el, params.immediate);
    }
  }

	bind(canvas, immediate = true) {
		this._isRoot = true;
		this._canvas = new MainCanvas(canvas);
		this._canvas.setDrawable(this);

		this._parent = null;

		if(immediate) this.start();
	}

	start() {
		const { _canvas } = this;
		if(!_canvas){
			return warn('please bind canvas element first!');
		}
		_canvas.start();
	}

	stop() {
		const { _canvas } = this;
		if(!_canvas){
			return warn('please bind canvas element first!');
		}
		_canvas.stop();
	}
}