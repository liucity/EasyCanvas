import Drawable from './drawable.js'
import Watch from './watch.js'
import Tool from './tool.js'

let {get, set, has} = Tool.obj

let is_move_range = 15
let is_move_timeout = 300
let scroll_duration = 300

let currentTime = () => Date.now()
let getChildren = (items, transforms) => {
    let list = []
    if(!transforms) transforms = []
    if(items) items.forEach(item => {
        list.push({
            item,
            transforms
        })
        let _transforms = transforms ? transforms.slice() : []
        if(item._transform) _transforms.push(item._transform)
        if(item._children) {
            list.push.apply(list, getChildren(item._children, _transforms))
        }
    })
    return list
}
let max = (items, callback) => {
    let arr = getChildren(items)
    let vals = arr.map(a => callback(a.item, a.transforms))
    return Math.max.apply(null, vals)
}

Drawable.extend('initEvents', function(){
    let is_down
    let is_move
    let enableScrollX
    let enableScrollY
    let getSumW = () => {
        return max(this._context.items, (item, transforms) => {
            let {x, y, w} = item._position
            if(item._transform) transforms = transforms.concat(item._transform)
            transforms.forEach(transform => {
                let _x = transform.rx(x, y)
                let _y = transform.ry(x, y)
                x = _x
                y = _y
            })
            return x + w
        })
    }
    let getSumH = () => {
        return max(this._context.items, (item, transforms) => {
            let {x, y, h} = item._position
            if(item._transform) transforms = transforms.concat(item._transform)
            transforms.forEach(transform => {
                let _x = transform.rx(x, y)
                let _y = transform.ry(x, y)
                x = _x
                y = _y
            })
            return y + h
        })
    }
    let getAvailableX = (val) => {
        let maxW = get(this, '_parent._position.w')
        return Math.min(Math.max(maxW - _dragableCache.w + _dragableCache.x, val), _dragableCache.x)
    }
    let getAvailableY = (val) => {
        let maxH = get(this, '_parent._position.h')
        return Math.min(Math.max(maxH - _dragableCache.h + _dragableCache.y, val), _dragableCache.y)
    }
    let scrollBarX
    let scrollBarY
    let _dragableCache
    
    this.on('mousedown', (e) => {
        if(this.dragable){
            if(!_dragableCache){
                _dragableCache = {
                    x: this._position.x,
                    y: this._position.y,
                    w: getSumW(),
                    h: getSumH()
                }
            }
            if(!scrollBarX) {
                scrollBarX = new Drawable({
                    bottom: 0,
                    left: 0,
                    w: 150,
                    h: 6,
                    rect: {
                        fill: '#878787',
                        r: 3
                    }
                })
                this.add(scrollBarX)
                scrollBarX.hide()
            }
            if(!scrollBarY) {
                scrollBarY = new Drawable({
                    top: 0,
                    right: 0,
                    w: 6,
                    h: 150,
                    rect: {
                        fill: '#878787',
                        r: 3
                    }
                })
                this.add(scrollBarY)
                scrollBarY.hide()
            }

            is_down = {
                sx: this._position.x,
                sy: this._position.y,
                x: e.x,
                y: e.y,
                t: currentTime()
            }

            enableScrollX = _dragableCache.w > get(this, '_parent._position.w')
            enableScrollY = _dragableCache.h > get(this, '_parent._position.h')

            enableScrollX && scrollBarX.show()
            enableScrollY && scrollBarY.show()
        }
    })

    this.on('mousemove', (e) => {
        if(this.dragable){
            if(!is_down) return
            if(!is_move){
                is_move = (currentTime() - is_down.t > is_move_timeout) 
                    || 
                    (Math.abs(e.x - is_down.x) > is_move_range)
                    || 
                    (Math.abs(e.y - is_down.y) > is_move_range)
            }
            if(is_move){
                if(enableScrollX) {
                    this._position.x = is_down.sx + e.x - is_down.x
                    let maxW = get(this, '_parent._position.w')
                    scrollBarX._position.x = this._position.x + (_dragableCache.x - getAvailableX(this._position.x)) / (_dragableCache.w - maxW) * (maxW - scrollBarX.w)
                }
                if(enableScrollY) {
                    this._position.y = is_down.sy + e.y - is_down.y
                    let maxH = get(this, '_parent._position.h')
                    scrollBarY._position.y = this._position.y + (_dragableCache.y - getAvailableY(this._position.y)) / (_dragableCache.h - maxH) * (maxH - scrollBarY.h)
                }
            }
        }
    })

    this.on('mouseup', () => {
        if(this.dragable){
            if(!is_down) return
            let x = getAvailableX(this._position.x)
            let y = getAvailableY(this._position.y)
            
            this.moveTo(x, y, scroll_duration)
            is_down = is_move = false

            enableScrollX && scrollBarX.hide(300)
            enableScrollY && scrollBarY.hide(300)
        }
    })
})

export default Drawable
