import canvas from './base/canvas.js'
import drawable from './base/drawableExt.js'
import tool from './base/tool'

let {extend, number: { fix }} = tool

export default class chart {
  constructor(dom, options){
    this.layout = new canvas({
      container: dom
    })

    this.setOptions(options)
  }

  setOptions(options){
    this.options = this.applyDefaultOptions(options)

    this.initChart(this.options)

    if(this.options.datas){
      this.setData(this.options.datas)
    }
  }

  applyDefaultOptions(options){
    let {layout} = this

    return extend(true, {
      chart: {
        w: layout.width,
        h: layout.height,
        padding: 10,
        textStyle: {
          w: 60,
          h: 40,
          fill: '#333',
          font: '2rem "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
          shadow: '3px 1px 1px rgba(128, 128, 128, .1)'
        },
        animationInterval: 500,
        refreshInterval: 25,
        beatInterVal: 2000,
        hRatio: .8,
        scaleColor: '#333'
      },
      title: '',
      axis: {
        color: '#000',
        step: 4,
        lineColor: 'rgba(0, 0, 0, .05)',
        textStyle: {
          textAlign: 'right'
        }
      },
      xAxis: {
        space: 40,
        step: 10,
        textStyle: {
          textAlign: 'center'
        }
      },
      yAxis: {
        space: 60,
        title: 'test title'
      },
      grid: {
        pointStroke: 'rgba(255, 0, 0, .1)',
        pointFill: '#006704',
        fill: 'LinearGradient(0,0,1,0, [0, "white"], [1, "#44b549"])',
        stroke: 'LinearGradient(0,0,1,0, [0, "white"], [1, "#006704"])'
      }
    }, options)
  }

  initChart(options){
    let {chart: {w, h, padding}} = options

    let container = new drawable({
      x: padding,
      y: padding,
      w: w - padding * 2,
      h: h - padding * 2
    })
    
    this.layout.add(container)
    this.container = container

    if(options.title) 
      container.add(this.createTitle(options))
  
    let grid = this.createGrid(options)
    container.add(grid)
    this.grid = grid

    let yAxisConainer = this.createYAxis(options)
    container.add(yAxisConainer)
    this.yAxisConainer = yAxisConainer
    let yAxisTitle = yAxisConainer.find('yAxisTitle')
    if(yAxisTitle) yAxisTitle.rotate('center', - 90)

    let xAxisConainer = this.createXAxis(options)
    container.add(xAxisConainer)
    this.xAxisConainer = xAxisConainer
  }

  getTitleHeight(){
    return this.options.title ? this.options.chart.textStyle.h : 0
  }

  createTitle(options){
    let {title, axis, yAxis, chart: {textStyle}} = options

    yAxis = extend(true, {}, axis, yAxis)

    return new drawable({
      name: 'title',
      top: 0,
      left: yAxis.space,
      h: textStyle.h,
      right: 0,
      text: extend({
        text: title
      }, textStyle, {
        font: '1.2rem "Microsoft YaHei"'
      }),
      shadow: textStyle.shadow
    })
  }

  createYAxis(options){
    let {axis, xAxis, yAxis, chart: {h, padding, textStyle}} = options
    let titleH = this.getTitleHeight()
  
    xAxis = extend(true, {}, {textStyle}, axis, xAxis)
    yAxis = extend(true, {}, {textStyle}, axis, yAxis)
  
    let yAxisItem = new drawable({
      name: 'yAxis',
      top: titleH,
      left: 0,
      w: yAxis.space,
      bottom: xAxis.space,
      line: {
        stroke: yAxis.color,
        points: [{top: 0, right: 0}, {bottom: 0, right: 0}]
      }
    })
  
    let steps = this.createYAxisSteps(options)
    yAxisItem.add(...steps)

    if(yAxis.title){
      let title = new drawable({
        name: 'yAxisTitle',
        left: 0,
        top: (h - padding * 2 - titleH - xAxis.space - textStyle.h) / 2,
        right: 0,
        h: textStyle.h,
        text: extend({
          text: yAxis.title
        }, textStyle, {
          font: 'bold ' + textStyle.font
        })
      })

      yAxisItem.add(title)
    }
  
    return yAxisItem
  }

  createYAxisSteps(options){
    let {axis, xAxis, yAxis, chart: {w, h, padding, textStyle}} = options || this.options
  
    xAxis = extend(true, {}, {textStyle}, axis, xAxis)
    yAxis = extend(true, {}, {textStyle}, axis, yAxis)
    textStyle = yAxis.textStyle

    let stepSpace = (h - padding * 2 - (this.getTitleHeight()) - xAxis.space) / (yAxis.step + 1)
    let steps = new Array(yAxis.step + 1).fill(0).map((item, i) => {
      return new drawable(extend(true, {
        name: 'yAxisStep' + i,
        bottom: stepSpace * (yAxis.step - i) - textStyle.h / 2,
        right: 5,
        text: {
          text: item
        },
        shadow: textStyle.shadow
      }, {
        w: textStyle.w,
        h: textStyle.h,
        text: textStyle,
        line: [{
          stroke: yAxis.color,
          points: [{top: textStyle.h / 2, right: -5}, {top: textStyle.h / 2, right: -10}]
        },{
          stroke: yAxis.lineColor,
          points: [{top: textStyle.h / 2, right: -5}, {top: textStyle.h / 2, left: w - padding * 2 + 5}]
        }]
      }))
    })

    return steps
  }

  createXAxis(options){
    let {axis, xAxis, yAxis, chart: {textStyle}} = options
  
    xAxis = extend(true, {}, {textStyle}, axis, xAxis)
    yAxis = extend(true, {}, {textStyle}, axis, yAxis)
    textStyle = xAxis.textStyle
  
    let xAxisItem = new drawable({
      name: 'xAxis',
      left: yAxis.space,
      right: 0,
      bottom: 0,
      h: xAxis.space,
      line: {
        stroke: xAxis.color,
        points: [{top: 0, left: 0}, {top: 0, right: 0}]
      },
      text: extend({
        text: '',
        textBaseline: 'bottom'
      }, textStyle)
    })
  
    return xAxisItem
  }

  createXAxisSteps(options, labels){
    let {axis, xAxis, yAxis, chart: {w, padding, textStyle}} = options || this.options
  
    xAxis = extend(true, {}, {textStyle}, axis, xAxis)
    yAxis = extend(true, {}, {textStyle}, axis, yAxis)
    textStyle = xAxis.textStyle

    let stepSpace = (w - padding * 2 - yAxis.space) / (labels.length)
    let stepOptions = {
      w: textStyle.w,
      h: textStyle.h,
      text: textStyle,
      shadow: textStyle.shadow,
      line: {
        stroke: xAxis.color,
        points: [{top: 0, right: textStyle.w / 2}, {top: -5, right: textStyle.w / 2}]
      }
    }
    let steps = labels.map((label, i) => {
      return new drawable(extend(true, {
        name: 'xAxisStep' + i,
        top: 0,
        left: stepSpace * (i + 1) - textStyle.w / 2,
        text: {
          text: label
        }
      }, stepOptions, i === label.length - 1 ? { text: { textAlign: 'right' }} : {}))
    })

    return steps
  }

  createGrid(options){
    let {axis, xAxis, yAxis, chart: {textStyle}} = options
  
    xAxis = extend(true, {}, {textStyle}, axis, xAxis)
    yAxis = extend(true, {}, {textStyle}, axis, yAxis)
  
    return new drawable({
      name: 'grid',
      top: this.getTitleHeight(),
      left: yAxis.space,
      right: 0,
      bottom: xAxis.space, 
      rect: {
        fill: 'rgba(0,0,0,.01)',
        clip: true
      },
      line: {
        points: []
      },
      bezier: []
    })
  }

  setData(datas){
    let {xAxisConainer, options} = this
    options.datas = datas.map(data => !isNaN(data) ? {y: data} : data)
    let steps = this.createXAxisSteps(options, options.datas.map(data => data.x || data.y))
    xAxisConainer.removeAll()
    xAxisConainer.add(...steps)
    this.refreshChart(options)
  }

  refreshChart(options){
    let {chart: {w, h, padding, textStyle, refreshInterval, animationInterval, hRatio}, 
      grid: gridOptions,
      axis, xAxis, yAxis, datas} = options
    
    let {yAxisConainer, grid} = this

    xAxis = extend(true, {}, {textStyle}, axis, xAxis)
    yAxis = extend(true, {}, {textStyle}, axis, yAxis)

    let titleH = this.getTitleHeight()
    let renderDatas = new Array(datas.length).fill(0).map(() => new drawable({val: 0}))
    let maxY = new drawable({val: Math.max(...datas.map(data => data.y))})

    let onRefresh = () => {
      let renderBezierPoints = []
      let renderPoints = []
      let delW = Math.round((w - padding * 2 - yAxis.space) / xAxis.step)
      let delH = (h - padding * 2 - titleH - xAxis.space) * hRatio / (maxY.val || 1)
      
      renderDatas.map(data => data.val).forEach((val, i) => {
        renderBezierPoints.push({
          left: delW * i, 
          bottom: val * delH
        })

        renderPoints.push({
          left: delW * i, 
          bottom: val * delH,
          r: 4,
          stroke: gridOptions.pointStroke
        }, {
          left: delW * i, 
          bottom: val * delH,
          r: 3,
          fill: gridOptions.pointFill
        })
      })

      if(renderBezierPoints.length)
        grid.bezier = {
          points: [{left: 0, bottom: 0}, ...renderBezierPoints, {right: 0, bottom: renderBezierPoints[renderBezierPoints.length - 1].bottom}, {right: 0, bottom: 0}],
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

      setTimeout(() => {
        onRefresh()
      }, refreshInterval)
    }

    renderDatas.forEach((data, i) => {
      data.set('val', datas[i].y || 0, animationInterval)
    })
    onRefresh()
  }

  destroy(){
    this.layout.destroy()
  }
}