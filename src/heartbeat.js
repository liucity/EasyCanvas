import drawable from './base/drawableExt.js'
import tool from './base/tool'
import chart from './chart'

let {extend, formatDate, number: { fix }, isObject} = tool

class heartBeatArray extends Array{
  constructor(length = 10){
    super()
    this.setDataLength(length)
  }

  setDataLength(length){
    this._dataLength = length
  }

  beat(){
    let l = this.length + arguments.length - this._dataLength
    if(l > 0)
      while(l--){
        this.shift()
      }
    this.push(...arguments)
  }
}

class intervalChart extends chart{
  constructor(dom, options){
    super(dom, options)

    this.addScale(this.options)
    this.refreshChart(this.options)
  }

  addScale(options){
    let {chart: {w, padding, textStyle, beatInterVal, scaleColor}, axis, xAxis, yAxis} = options
    xAxis = extend(true, {}, {textStyle}, axis, xAxis)
    yAxis = extend(true, {}, {textStyle}, axis, yAxis)
    let delW = Math.round((w - padding * 2 - yAxis.space) / xAxis.step)

    let scale = new drawable(extend(true, {
      top: padding,
      right: padding,
      w: delW,
      h: 30,
      text: {
        text: fix(beatInterVal / 1000, 0) + 's'
      },
      line: [{
        stroke: scaleColor,
        points: [{ bottom: 0, left: 0}, { bottom: 0, right: 0}]
      },{
        stroke: scaleColor,
        points: [{ bottom: 0, left: 0}, { bottom: 5, left: 0}]
      },{
        stroke: scaleColor,
        points: [{ bottom: 0, right: 0}, { bottom: 5, right: 0}]
      }]
    }, {
      text: textStyle
    }))

    this.container.add(scale)
  }

  refreshChart(options){
    let {chart: {w, h, padding, textStyle, refreshInterval, beatInterVal, animationInterval}, 
      grid: gridOptions,
      axis, xAxis, yAxis, callback} = options
    
    let {layout, xAxisConainer, yAxisConainer, grid} = this

    xAxis = extend(true, {}, {textStyle}, axis, xAxis)
    yAxis = extend(true, {}, {textStyle}, axis, yAxis)

    let titleH = options.title ? textStyle.h : 0
    let heartBeats = new heartBeatArray(xAxis.step + 1)
    heartBeats.push(...new Array(xAxis.step + 1).fill({ val: 0 }))
    let startTime = Date.now()
    let lastBeatTime = Date.now() - beatInterVal
    let hRatio = .8
    let timeoutID
    let maxY = new drawable({val: null})

    let steps = this.createXAxisSteps(options, [''])
    steps.forEach(step => {
      step._options.right = 0
      step._options.left = undefined
      step._options.line = {
        stroke: xAxis.color,
        points: [{top: 0, right: 0}, {top: -5, right: 0}]
      }
    })
    xAxisConainer.removeAll()
    xAxisConainer.add(...steps)

    let onRefresh = () => {
      let curTime = Date.now()

      if(lastBeatTime + beatInterVal <= curTime) {
        while(lastBeatTime + beatInterVal <= curTime){
          lastBeatTime += beatInterVal
        }
        
        let lastBeat = new drawable({val: heartBeats[heartBeats.length - 1].val})
        heartBeats.beat(lastBeat)
        Promise.resolve(callback())
          .then(beat => {
            lastBeat.set('val', beat, animationInterval)

            let max = Math.max(...heartBeats.filter(b => b !== lastBeat).map(b => b.val), beat || 0)
            if(maxY.val === null){
              maxY.val = max
            }else{
              maxY.set('val', max, animationInterval)
            }
          })
          .catch(err => {
            lastBeat.set('val', 0, animationInterval)
            console.error(err)
          })
      }

      let renderBeats = []
      let renderPoints = []
      let delW = Math.round((w - padding * 2 - yAxis.space) / xAxis.step)
      let delX = (curTime - startTime) % beatInterVal * delW / beatInterVal
      let delH = (h - padding * 2 - titleH - xAxis.space) * hRatio / (maxY.val || 1)
      
      heartBeats.map(beat => beat.val).forEach((beat, i) => {
        renderBeats.push({
          left: delW * i - delX, 
          bottom: beat * delH
        })

        renderPoints.push({
          left: delW * i - delX, 
          bottom: beat * delH,
          r: 4,
          stroke: gridOptions.pointStroke
        }, {
          left: delW * i - delX, 
          bottom: beat * delH,
          r: 3,
          fill: gridOptions.pointFill
        })
      })

      if(renderBeats.length)
        grid.bezier = {
          points: [{left: 0, bottom: 0}, ...renderBeats, {right: 0, bottom: renderBeats[renderBeats.length - 1].bottom}, {right: 0, bottom: 0}],
          fill: gridOptions.fill,
          stroke: gridOptions.stroke
        }

      grid.points = renderPoints

      //refresh yAxis step label
      new Array(yAxis.step).fill(0).forEach((item, i) => {
        yAxisConainer.find('yAxisStep' + i).text = extend(true, {
          text: (fix(maxY.val / hRatio / (yAxis.step + 1) * (yAxis.step - i), 0) || '') + ''
        }, textStyle, axis.textStyle, yAxis.textStyle)
      })

      //refresh yAxis step label
      xAxisConainer.find('xAxisStep0').text = extend(true, {
        text: formatDate(Date.now(), 'HH:mm:ss')
      }, textStyle, axis.textStyle, xAxis.textStyle, { textAlign: 'right'})

      timeoutID = setTimeout(() => {
        onRefresh()
      }, refreshInterval)
    }

    onRefresh()
    layout.one('destroy', () => clearTimeout(timeoutID))
  }
}

export default function heartBeat(dom, options, callback){
  // options.callback = callback
  // options.datas = [5,9,10,1,3,9,6,0,10,1,4]
  // let _chart = new chart(dom, options)
  // return _chart

  options.callback = callback
  let _chart = new intervalChart(dom, options)
  return _chart
}