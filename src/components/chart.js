// chart.js
// Chart - where most of the magic happens
// base class provides onChart and offChart
// Providing: the playground for price movements, indicators and drawing tools


import DOM from "../utils/DOM";
import { limit } from "../utils/number"
import { isArray, isNumber, isObject, isString } from "../utils/typeChecks";
import { copyDeep, xMap } from "../utils/utilities";
import CEL from "./primitives/canvas";
import Legends from "./primitives/legend"
import Graph from "./views/classes/graph"
import StateMachine from "../scaleX/stateMachne";
import stateMachineConfig from "../state/state-onChart"
import Input from "../input"
import ScaleBar from "./scale"
import chartGrid from "./overlays/chart-grid"
import chartCursor from "./overlays/chart-cursor"
import chartVolume from "./overlays/chart-volume"
import chartCandles from "./overlays/chart-candles"
import chartStreamCandle from "./overlays/chart-streamCandle"
import chartTrades from "./overlays/chart-trades"
import watermark from "./overlays/chart-watermark"
import {
  STREAM_ERROR,
  STREAM_NONE,
  STREAM_LISTENING,
  STREAM_STOPPED,
  STREAM_FIRSTVALUE,
  STREAM_NEWVALUE,
  STREAM_UPDATE,
} from "../definitions/core";
import { BUFFERSIZE, YAXIS_TYPES } from "../definitions/chart";
import { VolumeStyle } from "../definitions/style"

const defaultOverlays = {
  onChart: [
    ["watermark", {class: watermark, fixed: true, required: true, params: {content: null}}],
    ["grid", {class: chartGrid, fixed: true, required: true, params: {axes: "y"}}],
    ["volume", {class: chartVolume, fixed: false, required: true, params: {maxVolumeH: VolumeStyle.ONCHART_VOLUME_HEIGHT}}],
    ["candles", {class: chartCandles, fixed: false, required: true}],
    ["stream", {class: chartStreamCandle, fixed: false, required: true}],
    ["cursor", {class: chartCursor, fixed: true, required: true}]
  ],
  offChart: [
    ["grid", {class: chartGrid, fixed: true, required: true, params: {axes: "y"}}],
    ["cursor", {class: chartCursor, fixed: true, required: true}]
  ]
}
const optionalOverlays = {
  onChart: {
    "trades": {class: chartTrades, fixed: false, required: false}
  },
  offChart: {
    "candles": {class: chartCandles, fixed: false, required: true},
  }
}

const chartLegend = {
  id: "chart",
  title: "",
  type: "chart",
  source: () => {}
}

const chartTypes = [ "onchart", "offchart" ]

export default class Chart {

  static #cnt = 0
  static get cnt() { return Chart.#cnt++ }

  #ID;
  #name
  #shortName
  #title;
  #core;
  #options;
  #parent;
  #stateMachine;
  #chartCnt
  #type

  #elTarget;
  #elScale;

  #Scale;
  #Time;
  #Graph;
  #Legends;
  #Divider;
  #Stream;

  #streamCandle

  #view
  #viewport;
  #layersTools = new xMap();

  #overlays = new xMap()
  #overlayTools = new xMap();

  #cursorPos = [0, 0];
  #cursorActive = false;
  #cursorClick;

  #input

  #yAxisType

  // localRange required by offChart scale
  #localRange = {
    valueMax: 100,
    valueMin: 0,
    valueDiff: 100
  }

  constructor(core, options) {
    this.#core = core;
    this.#chartCnt = Chart.cnt

    if (!isObject(options)) return

    this.#options = {...options}
    this.#name = this.#options.name
    this.#shortName = this.#options.shortName
    this.#title = this.#options.title
    this.#type = (this.#options.type == "onchart") ? "onChart" : "offChart"
    this.#view = this.#options.view
    this.#elScale = this.#options.elements.elScale;
    this.#parent = this.#options.parent;
    this.#elTarget = this.#options.elements.elTarget;
    this.#elTarget.id = this.id

    // set up legends
    this.legend = new Legends(this.elLegend, this)

    if (this.isOnChart) {
      chartLegend.type = "chart"
      chartLegend.title = this.title
      chartLegend.parent = this
      chartLegend.source = this.legendInputs.bind(this)
      this.legend.add(chartLegend)
      this.yAxisType = "default"
    }
    else {
      chartLegend.type = "offchart"
      chartLegend.title = ""
      chartLegend.parent = this
      chartLegend.source = () => { return {inputs:{}, colours:[], labels: []} }
      this.legend.add(chartLegend)
      this.yAxisType = this.core.indicators[options.view[0].type].ind.scale
    }

    // set up Scale (Y Axis)
    const opts = {...options}
          opts.parent = this
          opts.chart = this
          opts.elScale = this.elScale
          opts.yAxisType = this.yAxisType
    this.scale = new ScaleBar(this.core, opts)

    this.log(`${this.name} instantiated`)
  }

  log(l) { this.core.log(l) }
  info(i) { this.core.info(i) }
  warn(w) { this.core.warn(w) }
  error(e) { this.core.error(e) }

  set id(id) { this.#ID = id.replace(/ |,|;|:|\.|#/g, "_") }
  get id() { return (this.#ID) ? `${this.#ID}` : `${this.#core.id}-${this.#name}_${this.#chartCnt}`.replace(/ |,|;|:|\.|#/g, "_") }
  get name() { return this.#name }
  get shortName() { return this.#shortName }
  get title() { return this.#title }
  get parent() { return this.#parent }
  get core() { return this.#core }
  get type() { return this.#type }
  get isOnChart() { return this.#type === "onChart" }
  get options() { return this.#options }
  get element() { return this.#elTarget }
  get pos() { return this.dimensions }
  get dimensions() { return DOM.elementDimPos(this.#elTarget) }
  set width(w) { this.setWidth(w) }
  get width() { return this.#elTarget.getBoundingClientRect().width }
  set height(h) { this.setHeight(h) }
  get height() { return this.#elTarget.getBoundingClientRect().height }
  get data() {}
  get range() { return this.#core.range }
  get localRange() { return this.#localRange }
  get stream() { return this.#Stream }
  get streamCandle() { return this.#streamCandle }
  get cursorPos() { return this.#cursorPos }
  set cursorActive(a) { this.#cursorActive = a }
  get cursorActive() { return this.#cursorActive }
  get cursorClick() { return this.#cursorClick }
  get candleW() { return this.#core.Timeline.candleW }
  get theme() { return this.#core.theme }
  get config() { return this.#core.config }
  get scrollPos() { return this.#core.scrollPos }
  get bufferPx() { return this.#core.bufferPx }
  get elCanvas() { return this.#Graph.viewport.scene.canvas }
  get elScale() { return this.#elScale }
  get elLegend() { return this.#elTarget.legend }
  get elViewport() { return this.#elTarget.viewport }
  set layerWidth(w) { this.#Graph.layerWidth = w }
  get layerWidth() { return this.#Graph.layerWidth }
  set legend(l) { this.#Legends = l }
  get legend() { return this.#Legends }
  set time(t) { this.#Time = t }
  get time() { return this.#Time }
  set scale(s) { this.#Scale = s }
  get scale() { return this.#Scale }
  set yAxisType(t) { this.setYAxisType(t) }
  get yAxisType() { return this.#yAxisType }
  get axes() { return "x" }
  set graph(g) { this.#Graph = g }
  get graph() { return this.#Graph }
  get view() { return this.#view }
  get viewport() { return this.#Graph.viewport }
  get layerGrid() { return this.#Graph.overlays.get("grid").layer }
  get overlays() { return this.#overlays }
  get overlayGrid() { return this.#Graph.overlays.get("grid").instance }
  get overlayTools() { return this.#overlayTools }
  get overlaysDefault() { return defaultOverlays[this.type] }
  get indicators() { return this.overlays }
  set stateMachine(config) { this.#stateMachine = new StateMachine(config, this) }
  get stateMachine() { return this.#stateMachine }
  get Divider() { return this.#Divider }

  /**
   * Start chart and dependent components event listening. 
   * Start the chart state machine
   * Draw the chart
   */
  start() {
    // X Axis - Timeline
    this.#Time = this.#core.Timeline;

    // create and start overlays
    this.createGraph();

    // Y Axis - Price Scale
    this.#Scale.start();

    // draw the chart - grid, candles, volume
    this.draw(this.range);

    // set mouse pointer
    this.setCursor("crosshair");

    // start State Machine
    stateMachineConfig.id = this.id
    stateMachineConfig.context = this;
    this.stateMachine = stateMachineConfig;
    this.stateMachine.start();

    // set up event listeners
    this.eventsListen()

    // add divider to allow manual resize of the chart pane
    const cfg = { chartPane: this }
    this.#Divider = this.core.WidgetsG.insert("Divider", cfg)
    this.#Divider.start()
  }

  end() {
    this.stateMachine.destroy();
    this.#Scale.end();
    this.#Graph.destroy();

    this.#input.off("pointerdrag", this.onChartDrag)
    this.#input.off("pointerdragend", this.onChartDrag)
    this.#input.off("pointermove", this.onMouseMove)
    this.#input.off("pointerenter", this.onMouseEnter);
    this.#input.off("pointerout", this.onMouseOut);
    this.#input.off("pointerdown", this.onMouseDown);
    this.#input.off("pointerup", this.onMouseUp);

    this.off("main_mousemove", this.onMouseMove);
    this.off(STREAM_LISTENING, this.onStreamListening);
    this.off(STREAM_NEWVALUE, this.onStreamNewValue);
    this.off(STREAM_UPDATE, this.onStreamUpdate);
    this.off(STREAM_FIRSTVALUE, this.onStreamNewValue)

    if (this.isOnChart)
      this.off("chart_yAxisRedraw", this.onYAxisRedraw)
    else
      this.Divider.end()
  }

  eventsListen() {
    this.#input = new Input(this.#elTarget, {disableContextMenu: false});
    this.#input.on("pointerdrag", this.onChartDrag.bind(this))
    this.#input.on("pointerdragend", this.onChartDragDone.bind(this))
    this.#input.on("pointermove", this.onMouseMove.bind(this))
    this.#input.on("pointerenter", this.onMouseEnter.bind(this));
    this.#input.on("pointerout", this.onMouseOut.bind(this));
    this.#input.on("pointerdown", this.onMouseDown.bind(this));
    this.#input.on("pointerup", this.onMouseUp.bind(this));

    // listen/subscribe/watch for parent notifications
    this.on("main_mousemove", this.updateLegends.bind(this));
    this.on(STREAM_LISTENING, this.onStreamListening.bind(this));
    this.on(STREAM_NEWVALUE, this.onStreamNewValue.bind(this));
    this.on(STREAM_UPDATE, this.onStreamUpdate.bind(this));
    this.on(STREAM_FIRSTVALUE, this.onStreamNewValue.bind(this))

    if (this.isOnChart) 
      this.on("chart_yAxisRedraw", this.onYAxisRedraw.bind(this))
  }

  /**
   * Set a custom event listener
   * @param {string} topic
   * @param {function} handler
   * @param {*} context
   */
  on(topic, handler, context) {
    this.#core.on(topic, handler, context);
  }

  /**
   * Remove a custom event listener
   * @param {string} topic
   * @param {function} handler
   */
  off(topic, handler) {
    this.#core.off(topic, handler);
  }

  /**
   * Emit an event with optional data
   * @param {string} topic
   * @param {*} data
   */
  emit(topic, data) {
    this.#core.emit(topic, data);
  }

  onChartDrag(e) {
    this.setCursor("grab")
    this.core.MainPane.onChartDrag(e)
    this.scale.onChartDrag(e)
  }

  onChartDragDone(e) {
    this.setCursor("crosshair")
    this.core.MainPane.onChartDragDone(e)
    // this.scale.onChartDragDone(e)
  }

  onMouseMove(e) {
    this.core.MainPane.onPointerActive(this)
    this.scale.layerCursor.visible = true
    this.graph.overlays.list.get("cursor").layer.visible = true
    this.#cursorPos = [Math.round(e.position.x), Math.round(e.position.y)]
    this.#Scale.onMouseMove(this.#cursorPos)
    this.emit(`${this.id}_mousemove`, this.#cursorPos)
  }

  onMouseEnter(e) {
    this.core.MainPane.onPointerActive(this)
    this.#cursorPos = [Math.round(e.position.x), Math.round(e.position.y)];
    this.core.MainPane.onMouseEnter()
    this.scale.layerCursor.visible = true
    this.graph.overlays.list.get("cursor").layer.visible = true
    this.emit(`${this.id}_mouseenter`, this.#cursorPos);
  }

  onMouseOut(e) {
    this.#cursorActive = false;
    this.#cursorPos = [Math.round(e.position.x), Math.round(e.position.y)];
    this.scale.layerCursor.visible = false
    this.emit(`${this.id}_mouseout`, this.#cursorPos);
  }

  onMouseDown(e) {
    this.#core.pointerButtons[e.domEvent.srcEvent.button] = true
    this.#cursorClick = [Math.floor(e.position.x), Math.floor(e.position.y)];
    if (this.stateMachine.state === "tool_activated")
      this.emit("tool_targetSelected", { target: this, position: e });
  }

  onMouseUp(e) {
    this.#core.pointerButtons[e.domEvent.srcEvent.button] = false
  }

  onStreamListening(stream) {
    if (this.#Stream !== stream) this.#Stream = stream;
  }

  onStreamNewValue(value) {
    this.draw(this.range, true);
  }

  onStreamUpdate(candle) {
    if (this.isOnChart) {
      this.#streamCandle = candle
      this.chartStreamCandle.draw()
      this.layerStream.setPosition(this.core.stream.lastScrollPos, 0)
      this.updateLegends(this.cursorPos, candle)
    }
    else this.updateLegends()
    this.graph.render()
  }

  /**
   * refresh the scale (yAxis) on Stream Update
   * @memberof OnChart
   */
  onYAxisRedraw() {
    if (this.isOnChart) this.refresh()
  }

  /**
   * Set chart and it's scale height
   * @param {number} h 
   */
  setHeight(h) {
    if (!isNumber(h)) h = this.height || this.#parent.height;

    this.#elTarget.style.height = `${h}px`;
    this.#elScale.style.height = `${h}px`;
    this.elViewport.style.height = `${h}px`;
    this.#Scale.setDimensions({ w: null, h: h });
  }

  /**
   * Set chart dimensions
   * @param {object} dim - dimensions {w:width, h: height}
   */
  setDimensions(dim) {
    const buffer = this.config.buffer || BUFFERSIZE
      let {w, h} = dim
               w = this.width
               h = (h) ? h : this.height
    
    this.layerWidth = Math.round(w * ((100 + buffer) * 0.01))
    this.graph.setSize(w, h, this.layerWidth)
    // element widths are automatically handled by CSS
    this.setHeight(h)
    this.draw(undefined, true)
    this.core.MainPane.draw(undefined, false)
    this.draw(undefined, true)
  }

  /**
   * set cursor type
   * @param {string} cursor 
   */
  setCursor(cursor) {
    this.element.style.cursor = cursor
  }

  setYAxisType(t) {
    if (
      !isString(t) ||
      !YAXIS_TYPES.includes(t)  ||
      (this.type == "onChart" && t == "percent")
    ) return false
    this.#yAxisType = t
  }

  /**
   * Add non-default overlays (indicators)
   *
   * @param {array} overlays - list of overlays
   * @returns {boolean} 
   * @memberof OnChart
   */
  addOverlays(overlays) {
    if (!isArray(overlays) || overlays.length < 1) return false

    for (let o of overlays) {
      const config = {fixed: false, required: false}

      // Indicators
      if (o.type in this.core.indicators) {
        config.cnt = this.core.indicators[o.type].ind.cnt
        config.id = `${this.id}-${o.type}_${config.cnt}`
        config.class = this.core.indicators[o.type].ind
      }
      // other overlay types
      else if (o.type in optionalOverlays[this.type]) {
        config.cnt = 1
        config.id = `${this.id}-${o.type}`
        config.class = optionalOverlays[this.type][o.type].class
      }
      else continue

      config.params = { overlay: o, }
      o.id = config.id
      o.paneID = this.id
      this.overlays.set(o.name, config)
    }
    const r = this.graph.addOverlays(Array.from(this.overlays))
    
    // if overlay failed, remove from list
    for (let o of r) {
      if (!o[1]) this.overlays.delete(o[0])
    }
    return true
  }

  /**
   * add an indicator
   * @param {object} i - {type, name, ...[params]}
   */
  addIndicator(i) {
    const onChart = this.type === "onChart"
    const indClass = this.core.indicators[i.type].ind
    const indType = (indClass.constructor.type === "both") ? onChart : indClass.prototype.onChart
    if (
        i?.type in this.core.indicators &&
        onChart === indType
      ) {
      const config = {
        class: indClass,
        params: {overlay: i}
      }
      const r = this.graph.addOverlay(i.name, config)
      if (r) {
        this.#overlays.set(i.name, config)
        return true
      }
    }
    else return false
  }

  addTool(tool) {
    let { layerConfig } = this.layerConfig();
    let layer = new CEL.Layer(layerConfig);
    this.#layersTools.set(tool.id, layer);
    this.#viewport.addLayer(layer);

    tool.layerTool = layer;
    this.#overlayTools.set(tool.id, tool);
  }

  addTools(tools) {}

  overlayTools() {
    const tools = [];
    // for (let i = 0; i < this.#layersTools.length; i++) {
    // tools[i] =
    // new indicator(
    //   this.#layersOnChart[i],
    //   this.#Time,
    //   this.#Scale,
    //   this.config)
    // }
    // return tools
  }

  overlayToolAdd(tool) {
    // create new tool layer

    this.#overlayTools.set(tool.id, tool);
  }

  overlayToolDelete(tool) {
    this.#overlayTools.delete(tool);
  }

  drawGrid() {
    this.layerGrid.setPosition(this.#core.scrollPos, 0);
    this.overlayGrid.draw("y");
    this.#Graph.render();
  }

  /**
   * Refresh offChart - overlays, grid, scale, indicators
   * @memberof Chart
   */
  refresh() {
    this.scale.draw()
    this.draw(undefined, this.isOnChart)
  }

  /**
   * Update chart and indicator legends
   * @param {array} pos - cursor position x, y, defaults to current cursor position
   * @param {array} candle - OHLCV
   */
  updateLegends(pos = this.#cursorPos, candle = false) {
    if (this.#core.isEmpty || !isObject(this.#Legends)) return

    for (const legend in this.#Legends.list) {
      this.#Legends.update(legend, { pos, candle });
    }
  }

  /**
   * 
   * @param {array} pos - cursor pos [x, y]
   * @returns {object} - legend data 
   */
  legendInputs(pos=this.cursorPos) {
    pos = this.cursorPos
    let inputs = {}
    let colours = []
    let labels = [true, true, true, true, true]
    let index = this.time.xPos2Index(pos[0] - this.core.scrollPos)
        index = limit(index, 0, this.range.data.length - 1)
    let ohlcv = this.range.data[index]

    // get candle colours from config / theme
    if (ohlcv[4] >= ohlcv[1]) colours = new Array(5).fill(this.theme.candle.UpWickColour)
    else colours = new Array(5).fill(this.theme.candle.DnWickColour)

    inputs.O = this.scale.nicePrice(ohlcv[1])
    inputs.H = this.scale.nicePrice(ohlcv[2])
    inputs.L = this.scale.nicePrice(ohlcv[3])
    inputs.C = this.scale.nicePrice(ohlcv[4])
    inputs.V = this.scale.nicePrice(ohlcv[5])

    return {inputs, colours, labels}
  }

  /**
   * execute legend action
   * @param {object} e - event
   * @memberof Chart
   */
  onLegendAction(e) {

    const action = this.#Legends.onMouseClick(e.currentTarget)

    const el = this.element
    const prevEl = el.previousElementSibling
    const nextEl = el.nextElementSibling
    const parentEl = el.parentNode

    const scaleEl = this.scale.element
    const prevScaleEl = scaleEl.previousElementSibling
    const nextScaleEl = scaleEl.nextElementSibling
    const parentScaleEl = scaleEl.parentNode
        
    const prevPane = (prevEl !== null) ? this.core.MainPane.chartPanes.get(prevEl.id) : null
    const nextPane = (nextEl !== null) ? this.core.MainPane.chartPanes.get(nextEl.id) : null

    switch(action.icon) {
      case "up": 
        if (!isObject(prevEl) || !isObject(prevScaleEl)) return
        parentEl.insertBefore(el, prevEl)
        parentScaleEl.insertBefore(scaleEl, prevScaleEl)
        this.Divider.setPos()

        if (prevPane !== null) {
          prevPane.Divider.setPos()
          prevPane.Divider.show()
          this.core.MainPane.chartPanes.swapKeys(this.id, prevEl.id)
        }
        if (el.previousElementSibling === null)
          this.Divider.hide()
        return;
      case "down":
        if (!isObject(nextEl) || !isObject(nextScaleEl)) return
        parentEl.insertBefore(nextEl, el)
        parentScaleEl.insertBefore(nextScaleEl, scaleEl)
        this.Divider.setPos()

        if (nextPane !== null) { 
          nextPane.Divider.setPos()
          this.Divider.show()
          this.core.MainPane.chartPanes.swapKeys(this.id, nextEl.id)
        }
        if (nextEl.previousElementSibling === null)
          nextPane.Divider.hide()
          
        return;
      case "collapse": return;
      case "maximize": return;
      case "restore": return;
      case "remove": return;
      case "config": return;
      default: return;
    }
  }

  createGraph() {
    let overlays = copyDeep(this.overlaysDefault)
    this.graph = new Graph(this, this.elViewport, overlays, false)

    if (this.isOnChart) {
      this.layerStream = this.graph.overlays.get("stream")?.layer
      this.chartStreamCandle = this.graph.overlays.get("stream")?.instance
    }

    // add non-default overlays ie. indicators
    this.addOverlays(this.view)
  }

  render() {
    this.#Graph.render();
    this.#Scale.render()
  }

  draw(range=this.range, update=false) {
      this.#Graph.draw(range, update)
  }

  drawGrid() {
    this.layerGrid.setPosition(this.core.scrollPos, 0)
    this.overlayGrid.draw("y")
    this.#Graph.render();
  }

  /**
   * Set the entire chart dimensions, this will cascade and resize components
   * @param {number} width - width in pixels, defaults to current width
   * @param {number} height - height in pixels, defaults to current height
   */
  resize(width = this.width, height = this.height) {
    // adjust element, viewport and layers
    // this.setDimensions({ w: width, h: height });
  }

  /**
   * Zoom (contract or expand) range start
   */
  zoomRange() {
    // draw the chart - grid, candles, volume
    this.draw(this.range, true)
    this.emit("zoomDone")
  }


  /**
   * Return the screen x position for a give time stamp
   * @param {number} time - timestamp
   * @returns {number} - x position on canvas
   */
  time2XPos(time) {
    return this.time.xPos(time)
  }

  /**
   * @param {number} price 
   * @returns {number} - y position on canvas
   */
  price2YPos(price) {
    return this.scale.yPos(price)
  }
  
}
