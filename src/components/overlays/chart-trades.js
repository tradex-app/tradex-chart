// chart-trades.js
// display trades on chart

import Overlay from "./overlay"
import Trade from "../primitives/trade"
import { limit } from "../../utils/number"
import { debounce } from "../../utils/utilities"

const config = {
  dragBar: false,
  closeIcon: false,
  content: "",
  styles: {
    window: {
      width: "15em",
      zindex: "10"
    },
    content: {
      overflow: "hidden",
      padding: "0 1em"
    }
  }
}


export default class chartTrades extends Overlay {

  #trade
  #trades = []
  #dialogue
  #debounce = (e) => debounce(this.isTradeSelected, 100, this)

  constructor(target, xAxis=false, yAxis=false, theme, parent) {

    super(target, xAxis=false, yAxis=false, theme, parent)

    this.#trade = new Trade(target.scene, theme)
      this.emit()
      this.core.on("primary_pointerdown", debounce(this.isTradeSelected, 200, this), this)
      this.#dialogue = this.core.WidgetsG.insert("Dialogue", config)
      this.#dialogue.start()
  }

  destroy() {
    this.core.off("primary_pointerdown", this.#debounce)
  }

  set position(p) { this.target.setPosition(p[0], p[1]) }
  get trades() { return this.core.state.data.trades }

  isTradeSelected(e) {
    const x = e[0]
    const y = e[1]
    const d = this.theme.trades
    const w = limit(this.xAxis.candleW, d.iconMinDim, d.iconHeight)
    const ts = this.xAxis.pixel2T(x)
    const c = this.core.range.valueByTS(ts)
    for (let tr in this.trades) {
      tr *= 1
      if (ts === tr) {
        let tx = this.xAxis.xPos(ts)
        let ty = this.yAxis.yPos(c[2]) - (w * 1.5)
        if ((x >= tx - (w / 2) &&
            x <= tx + (w / 2)) &&
            (y >= ty &&
            y <= ty + w)) {
              console.log("trade ",ts," selected")
              let content = ``
              for (let t of this.trades[tr]) {
                content += this.buildTradeHTML(t)
              }
              const config = {
                dimensions: {h: 150, w: 150},
                position: {x: tx + (w / 2) + 1, y: ty},
                content: content,
              }
              this.core.emit("trade_selected", tr)
              this.#dialogue.open(config)
            }
      }
    }
  }

  buildTradeHTML(h) {
    let c = 
    `<style>
    dt, dd {display: inline-block; font-size: 0.9em;}
    dt {min-width: 40%;}
    dd {min-width: 60%; margin: 0;}
    </style>`
    c += `<dl>`
    for (let k in h) {
      c += `<dt>${k}</dt><dd>${h[k]}</dd>`
    }
    c += `</dl>`
    return c
  }

  draw(range=this.core.range) {

    this.scene.clear()
    this.#trades.length = 0

    const offset = this.xAxis.smoothScrollOffset || 0
    const trade = {
      x: offset - this.xAxis.candleW,
      w: this.xAxis.candleW
    }

    let d = this.theme.trades
    let o = this.core.rangeScrollOffset;
    let c = range.indexStart - o
    let i = range.Length + (o * 2)
    let x, t;

    while(i) {
      x = range.value( c )
      t = `${x[0]}`
      // fetch trades (if any) for timestamp
      if (Object.keys(this.trades).indexOf(t) >= 0) {
        for (let tr of this.trades[t]) {
          trade.x = this.xAxis.xPos(x[0]) - (this.xAxis.candleW / 2)
          trade.y = this.yAxis.yPos(x[2]) - (limit(this.xAxis.candleW, d.iconMinDim, d.iconHeight) * 1.5)
          trade.side = tr.side
          this.#trades.push(this.#trade.draw(trade))
        }
      }
      c++
      i--
    }
    // draw mask to hit layer

  }
}