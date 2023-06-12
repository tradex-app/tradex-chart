// range.js

import TradeXchart from "../core"
import { ms2Interval } from "../utils/time"
import { DEFAULT_TIMEFRAMEMS, LIMITFUTURE, LIMITPAST, MINCANDLES, MAXCANDLES, YAXIS_BOUNDS, INTITIALCNT } from "../definitions/chart"
import { isNumber, isObject, isString } from "../utils/typeChecks"
import { bRound, limit } from "../utils/number"
// import WebWorker from "./webWorkers"
// import WebWorker from "./webWorkers4"

export class Range {

  data = []
  #interval = DEFAULT_TIMEFRAMEMS
  #intervalStr = "1s"
  indexStart = 0
  indexEnd = LIMITFUTURE
  valueMin = 0
  valueMax = 0
  valueDiff = 0
  volumeMin = 0
  volumeMax = 0
  volumeDiff = 0
  valueMinIdx = 0
  valueMaxIdx = 0
  volumeMinIdx = 0
  volumeMaxIdx = 0
  old = {}
  initialCnt = INTITIALCNT
  limitFuture = LIMITFUTURE
  limitPast = LIMITPAST
  minCandles = MINCANDLES
  maxCandles = MAXCANDLES
  yAxisBounds = YAXIS_BOUNDS
  rangeLimit = LIMITFUTURE
  anchor
  #core
  #worker
  #init = true

  /**
   * Creates an instance of Range.
   * @param {object} allData - State data object representing on and off chart data
   * @param {number} [start=0] - initial index start
   * @param {number} [end=allData.data.length-1] - initial index end
   * @param {object} [config={}] - range config
   * @memberof Range
   */
  constructor( allData, start=0, end=allData.data.length-1, config={}) {
    if (!isObject(allData)) return false
    if (!isObject(config)) return false
    if (!(config?.core instanceof TradeXchart)) return false

    this.#init = true;
    this.setConfig(config)
    this.#core = config.core;

    const MaxMinPriceVolStr = `
    (input) => {
      return maxMinPriceVol(input)
    }
    function ${this.maxMinPriceVol.toString()}
  `
    // this.#worker = this.#core.worker.create("range", MaxMinPriceVolStr, undefined, this.#core)

    const tf = config?.interval || DEFAULT_TIMEFRAMEMS

    if (allData.data.length == 0) {
      let ts = Date.now()
      start = 0
      end = this.rangeLimit
      this.#interval = tf
      this.#intervalStr = ms2Interval(this.interval)
      this.anchor = ts - (ts % tf) // - (this.limitPast * this.#interval)
    }  
    else if (allData.data.length < 2) {
      this.#interval = tf
      this.#intervalStr = ms2Interval(this.interval)
    }
    else if (end == 0 && allData.data.length >= this.rangeLimit)
      end = this.rangeLimit
    else if (end == 0)
      end = allData.data.length
    
    for (let data in allData) {
      this[data] = allData[data]
    }

    if (!this.set(start, end)) return false

    if (allData.data.length > 2) {
      this.#interval = detectInterval(this.data)
      this.#intervalStr = ms2Interval(this.interval)
    }

    // for (let i of this?.offChart) {
    //   i.valueMin = 0
    //   i.valueMax = 100
    //   i.valueDiff = 100
    // }

  }

  get dataLength () { return (this?.data.length == 0) ? 0 : this.data.length - 1 }
  get Length () { return this.indexEnd - this.indexStart }
  get timeDuration () { return this.timeFinish - this.timeStart }
  get timeMin () { return this.value(this.indexStart)[0] }
  get timeMax () { return this.value(this.indexEnd)[0] }
  get rangeDuration () { return this.timeMax - this.timeMin }
  get timeStart () { return this.value(0)[0] }
  get timeFinish () { return this.value(this.dataLength)[0] }
  set interval (i) { this.#interval = i }
  get interval () { return this.#interval }
  set intervalStr (i) { this.#intervalStr = i }
  get intervalStr () { return this.#intervalStr }

  end() {
    WebWorker.destroy(this.#worker.id)
  }

  /**
   * set Range index start and end
   * @param {number} [start=0]
   * @param {number} [end=this.dataLength]
   * @param {number} [max=this.maxCandles]
   * @return {boolean} - success or failure
   * @memberof Range
   */
  set (start=0, end=this.dataLength, max=this.maxCandles, config) {
    if (!isNumber(start) || 
        !isNumber(end) ||
        !isNumber(max)) return false
    // integer guard, prevent decimals
    start = start | 0
    end = end | 0
    max = max | 0
    max = limit(max, this.minCandles, this.maxCandles)

    // check and correct start and end argument order
    if (start > end) [start, end] = [end, start]
    // constrain range length
    end = limit(end, start + this.minCandles, start + max)
    let len = end - start
    // constrain range start
    start = limit(start, this.limitPast * -1,  this.dataLength + this.limitFuture - this.minCandles - 1)
    // constrain range end
    end = limit(end, start + this.minCandles, this.dataLength + this.limitFuture - 1)
    start = (end - start < len) ? start - (len - (end - start)) : start
  
    const newStart = start
    const newEnd = end
    const oldStart = this.indexStart
    const oldEnd = this.indexEnd
      let inOut = this.Length

    this.indexStart = start
    this.indexEnd = end

    inOut -= this.Length

    let maxMin = this.maxMinPriceVol({data: this.data, start: this.indexStart, end: this.indexEnd, that: this})
    
    this.setMaxMin(maxMin)
    this.setConfig(config)

    // if (this.#init || this.old.priceMax != this.priceMax || this.old.priceMin != this.priceMin) {
    //   this.#core.emit("range_priceMaxMin", [this.priceMax, this.priceMin])
    // }

    this.#core.emit("setRange", [newStart, newEnd, oldStart, oldEnd])

    // if (this.#init) this.#init = false

    return true

    // use web worker after init
    // this.#worker.postMessage({data: this.data, start: start, end: end, that: this})
    // .then(maxMin => {
    //   this.setMaxMin(maxMin)

    //   if (this.old.priceMax != this.priceMax || this.old.priceMin != this.priceMin) {
    //     this.#core.emit("range_priceMaxMin", [this.priceMax, this.priceMin])
    //   }

    //   this.#core.emit("setRange", [newStart, newEnd, oldStart, oldEnd])
    //   this.#core.emit("chart_zoom", [newStart, newEnd, oldStart, oldEnd, inOut])
    //   this.#core.emit(`chart_zoom_${inOut}`, [newStart, newEnd, oldStart, oldEnd])
    // })
    
    // return true
  }

  setConfig(config) {
    if (!isObject(config)) return false

    this.initialCnt = (isNumber(config?.initialCnt)) ? config.initialCnt : INTITIALCNT;
    this.limitFuture = (isNumber(config?.limitFuture)) ? config.limitFuture : LIMITFUTURE;
    this.limitPast = (isNumber(config?.limitPast)) ? config.limitPast : LIMITPAST;
    this.minCandles = (isNumber(config?.minCandles)) ? config.minCandles : MINCANDLES;
    this.maxCandles = (isNumber(config?.maxCandles)) ? config.maxCandles : MAXCANDLES;
    this.yAxisBounds = (isNumber(config?.yAxisBounds)) ? config.yAxisBounds : YAXIS_BOUNDS;
  }

  setMaxMin ( maxMin ) {
    for (let m in maxMin) {
      this.old[m] = this[m]
      this[m] = maxMin[m]
    }
    this.scale = (this.dataLength != 0) ? this.Length / this.dataLength : 1
  }

  /**
   * return value at index
   * @param {number} index - price history index, out of bounds will return null filled entry
   * @returns {array}
   */
  value ( index, id="chart" ) {

    let data
    
    if (id == "chart") data = this.data
    else {
      data = this.getDataById(id)
      if (!data) return null
    }
    // return last value as default
    if (!isNumber(index)) index = data.length - 1
  
    let v = data[index]
    if (v !== undefined) return v
    else {
      const len = data.length - 1
      v = [null, null, null, null, null, null]

      if (data.length < 1) {
        v[0] = Date.now() + (this.interval * index)
        return v
      }
      else if (index < 0) {
        v[0] = data[0][0] + (this.interval * index)
        return v
      }
      else if (index > len) {
        v[0] = data[len][0] + (this.interval * (index - len))
        return v
      }
      else return null
    }
  }

  /**
   * INCOMPLETE!!!
   * return value by timestamp
   * @param {number} ts
   * @param {string} id
   * @return {*}  
   * @memberof Range
   */
  valueByTS ( ts, id ) {
    if (!isNumber(ts) || !isString(id)) return false

    const idx = this.getTimeIndex(ts)

    switch (id) {
      case "chart": 

        break;
      case "onchart": break;
      case "offchart": break;
      case "dataset": break;
      case "all": break;
      default: 
        if (id.length = 0) return this.value(idx)
        else {
          const idParts = id.split('_')
        }
        break;
    }
  }

  /**
   * return data for id
   * @param {string} id
   * @return {array}  
   * @memberof Range
   */
  getDataById(id) {
    if (!isString(id)) return false

    const idParts = id.split('_')

    switch (idParts[1]) {
      case "chart": 
        return this.data;
      case "onchart":
        for (let o of this.onChart) {
          if (idParts[2] in o) return o[idParts[2]]
        }
        return false;
      case "offchart":
        for (let o of this.offChart) {
          if (idParts[2] in o) return o[idParts[2]]
        }
        return false;
      case "datasets":
        for (let o of this.datasets) {
          if (idParts[2] in o) return o[idParts[2]]
        }
      return false;
      default: return false
    }
  }

  /**
   * Return time index
   * @param {number} ts - timestamp
   * @returns {number}
   */
   getTimeIndex (ts) {
    if (!isNumber(ts)) return false
    ts = ts - (ts % this.interval)
  
    let x = (this.data.length > 0) ? this.data[0][0] : this.anchor
    if (ts === x) 
      return 0
    else if (ts < x)
      return ((x - ts) / this.interval) * -1
    else 
      return (ts - x) / this.interval
  }

  /**
   * Is timestamp in current range including future and past legal bounds
   * @param {number} t - timestamp
   * @returns {boolean}
   */
  inRange(t) {
    return (t >= this.timeMin && t <= this.timeMax) ? true : false
  }

  /**
   * Is timestamp in current range only, excluding future and past legal bounds
   * @param {number} t - timestamp
   * @returns {boolean}
   */
  inPriceHistory (t) {
    return (t >= this.timeStart && t <= this.timeFinish) ? true : false
  }

  /**
   * is timestamp in visible render range?
   * @param {number} t - timestamp
   * @return {boolean}  
   * @memberof Range
   */
  inRenderRange (t) {
    let i = this.getTimeIndex(t)
    let o = this.#core.rangeScrollOffset
    return (i >= this.indexStart - o && i <= this.indexEnd + o) ? true : false
  }
  
  /**
   * Return index offset of timestamp relative to range start
   * @param {number} ts - timestamp
   * @returns {number}
   */
  rangeIndex (ts) { return this.getTimeIndex(ts) - this.indexStart }

  /**
   * Find price maximum and minimum, volume maximum and minimum
   * @param {array} data
   * @param {number} [start=0]
   * @param {number} [end=data.length-1]
   * @return {object}  
   */
   maxMinPriceVol ( input ) {
// console.time()
    let {data, start, end, that} = {...input}
    let buffer = bRound(this.#core.bufferPx / this.#core.candleW)

    buffer = (isNumber(buffer)) ? buffer : 0
    start = (isNumber(start)) ? start - buffer : 0
    start = (start > 0) ? start : 0

    end = (typeof end === "number") ? end : data?.length-1

    if (data.length == 0) {
      return {
        valueMin: 0,
        valueMax: 1,
        volumeMin: 0,
        volumeMax: 0,
        valueMinIdx: 0,
        valueMaxIdx: 0,
        volumeMinIdx: 0,
        volumeMaxIdx: 0,
      }
    }
    let l = data.length - 1
    let i = limit(start, 0, l)
    let c = limit(end, 0, l)

    let valueMin  = data[i][3]
    let valueMax  = data[i][2]
    let volumeMin = data[i][5]
    let volumeMax = data[i][5]

    let valueMinIdx  = i
    let valueMaxIdx  = i
    let volumeMinIdx = i
    let volumeMaxIdx = i

    while(i++ < c) {
      if (data[i][3] < valueMin) {
        valueMin = data[i][3]
        valueMinIdx = i
      }
      if (data[i][2] > valueMax) {
        valueMax = data[i][2]
        valueMaxIdx = i
      }
      if (data[i][5] < volumeMin) {
        volumeMin = data[i][5]
        volumeMinIdx = i
      }
      if (data[i][5] > volumeMax) {
        volumeMax = data[i][5]
        volumeMaxIdx = i
      }
    }

    let diff = valueMax - valueMin
    valueMin -= diff * that.yAxisBounds
    valueMin = (valueMin > 0) ? valueMin : 0
    valueMax += diff * that.yAxisBounds
    diff = valueMax - valueMin

    // valueMin *= (1 - that.yAxisBounds)
    // valueMax *= (1 + that.yAxisBounds)
    return {
      valueMin: valueMin,
      valueMax: valueMax,
      valueDiff: valueMax - valueMin,
      volumeMin: volumeMin,
      volumeMax: volumeMax,
      volumeDiff: volumeMax - volumeMin,

      valueMinIdx: valueMinIdx,
      valueMaxIdx: valueMaxIdx,
      volumeMinIdx: volumeMinIdx,
      volumeMaxIdx: volumeMaxIdx,
    }

    function limit(val, min, max) {
      return Math.min(max, Math.max(min, val));
    }
  }

  snapshot(start, end) {
    return {
      snapshot: true,
      ts: Date.now(),

      data: this.data,
      dataLength: this.dataLength,
      Length: this.Length,
      timeDuration: this.timeDuration,
      timeMin: this.timeMin,
      timeMax: this.timeMax,
      rangeDuration: this.rangeDuration,
      timeStart: this.timeStart,
      timeFinish: this.timeFinish,
      interval: this.interval,
      intervalStr: this.intervalStr 
    }
  }
} // end class


export function rangeOnchartValue( range, indicator, index ) {
  const len = range.onchart[indicator].length - 1
  const value = null
}

export function rangeOffchartValue( range, indicator, index ) {
}

export function rangeDatasetValue( range, indicator, index ) {
}

/**
 * Detects candles interval
 * @param {array} ohlcv - array of ohlcv values (price history)
 * @returns {number} - milliseconds
 */
export function detectInterval(ohlcv) {

  let len = Math.min(ohlcv.length - 1, 99)
  let min = Infinity
  ohlcv.slice(0, len).forEach((x, i) => {
      let d = ohlcv[i+1][0] - x[0]
      if (d === d && d < min) min = d
  })
  // This saves monthly chart from being awkward
  // if (min >= WEEK_MS * 4 && min <= DAY_MS * 30) {
  //     return DAY_MS * 31
  // }
  return min
}

/**
 * Calculate the index for a given time stamp
 * @param {object} time - time object provided by core
 * @param {number} timeStamp 
 * @returns {number}
 */
export function calcTimeIndex(time, timeStamp) {
  if (!isNumber(timeStamp)) return false

  let index
  let timeFrameMS = time.timeFrameMS
  timeStamp = timeStamp - (timeStamp % timeFrameMS)

  if (timeStamp === time.range.data[0][0])
    index = 0
  else if (timeStamp < time.range.data[0][0]) 
    index = ((time.range.data[0][0] - timeStamp) / timeFrameMS) * -1
  else 
    index = (timeStamp - time.range.data[0][0]) / timeFrameMS

  return index
}
