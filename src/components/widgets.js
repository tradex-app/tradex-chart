// widgets.js
// A template file for Chart components

import DOM from "../utils/DOM"
import { CLASS_MENU, CLASS_DIVIDERS, CLASS_WINDOW } from "../definitions/core"
import { MenuStyle, WindowStyle } from "../definitions/style"
import Menu from "./widgets/menu"
import Dialogue from "./widgets/dialogue"
import Divider from "./widgets/divider"

// import stateMachineConfig from "../state/state-widgets"

const indicators = [
  {id: "ADX", name: "Average Direction", action: ()=>{console.log("ADX")}},
  {id: "BB", name: "Bollinger Bands", action: ()=>{console.log("BB")}},
  {id: "DMI", name: "Directional Movement", action: ()=>{console.log("DMI")}}
]
const indicatorActions = {}

export default class Widgets {

  #name = "Widgets"
  #shortName = "widgets"
  #mediator
  #options
  #parent
  #elements
  #elWidgetsG
  #elMenu
  #elDividers

  #width
  #height

  #widgetSettings
  #widgetTimezone
  #widgetIndicators


  constructor (mediator, options) {

    this.#mediator = mediator
    this.#options = options
    this.#elWidgetsG = this.#mediator.api.elements.elWidgetsG
    this.#parent = this.#mediator.api.parent
    this.init()
  }

  log(l) { this.#mediator.log(l) }
  info(i) { this.#mediator.info(i) }
  warning(w) { this.#mediator.warn(w) }
  error(e) { this.#mediator.error(e) }

  get name() { return this.#name }
  get shortName() { return this.#shortName }
  get mediator() { return this.#mediator }
  get options() { return this.#options }
  get elements() { return this.#elements }

  init() {
    this.mount(this.#elWidgetsG)

    // api - functions / methods, calculated properties provided by this module
    const api = this.#mediator.api
    api.parent = this.#mediator
    api.elements = this.#elements
    
    this.#elMenu = DOM.findBySelector(`#${api.id} .${CLASS_MENU}`)
    this.#elDividers = DOM.findBySelector(`#${api.id} .${CLASS_DIVIDERS}`)

    this.#elements = {
      elWidgetsG: this.#elWidgetsG,
      elMenu: this.#elMenu,
      elDividers: this.#elDividers,
    }
  }

  start() {

    // set up event listeners
    this.eventsListen()

    // start State Machine 
    // stateMachineConfig.context.origin = this
    // this.#mediator.stateMachine = stateMachineConfig
    // this.#mediator.stateMachine.start()
  }

  end() {
    // Stop and clean up the module to prevent memory leaks.
    // It should remove: event listeners, timers, ect.
    // Put your toys away or it will end in tears.
  }

  // listen/subscribe/watch for parent notifications
  eventsListen() {
    this.on("utils_indicators", (e) => { this.onIndicators(e) })
    this.on("utils_timezone", (e) => { this.onTimezone(e) })
    this.on("utils_settings", (e) => { this.onSettings(e) })
    this.on("utils_screenshot", (e) => { this.onScreenshot(e) })
    this.on("resize", (dimensions) => this.onResize(dimensions))
  }

  on(topic, handler, context) {
    this.#mediator.on(topic, handler, context)
  }

  off(topic, handler) {
    this.#mediator.off(topic, handler)
  }

  emit(topic, data) {
    this.#mediator.emit(topic, data)
  }

  onResize(dimensions) {
    this.setDimensions(dimensions)
  }

  onIndicators(e) {

    const api = this.#mediator.api
    const listStyle = "list-style: none; text-align: left; margin:1em 1em 1em -2.5em;"
    const itemStyle = "padding: .25em 1em .25em 1em;"
    const shortStyle = "display: inline-block; width: 4em;"
    const cPointer = "cursor: pointer;"
    const over = `onmouseover="this.style.background ='#222'"`
    const out = `onmouseout="this.style.background ='none'"`

    let content = `<ul style="${listStyle}">`
    for (let i of indicators) {
      indicatorActions[i.id] = i.action
      content += `<li id="${i.id}" style="${itemStyle} ${cPointer}" ${over} ${out}><a style="${cPointer}"><span style="${shortStyle}">${i.id}</span><span>${i.name}</span></li></a>`
    }
    content += "</ul>"

    this.insertMenu(e, content)

    const menuItems = DOM.findBySelectorAll(`#${api.id} .${CLASS_MENU} li`)
    menuItems.forEach((item) => {
      item.addEventListener('click', (e) => this.onIndicatorSelect(e))
    })

    console.log("Indicators Menu")
  }

  onIndicatorSelect(e) {
    let id = e.currentTarget.id
    // indicatorActions[id]()
    this.emit("addIndicator", id)
  }

  onTimezone(e) {
    console.log("Set timezone")
  }

  onSettings(e) {
    console.log("Modify chart settings")
  }

  onScreenshot(e) {
    console.log("Save chart screenshot")
  }

  mount(el) {
    el.innerHTML = this.defaultNode()
  }

  setWidth(w) {
    this.#width = w
  }

  setHeight(h) {
    this.#height = h
  }

  setDimensions(dimensions) {
    this.setWidth(dimensions.mainW)
    this.setHeight(dimensions.mainH)
  }

  defaultNode() {
    const menuStyle = `position: absolute; z-index: 1000; display: none; border: 1px solid ${MenuStyle.COLOUR_BORDER}; background: ${MenuStyle.COLOUR_BG}; color: ${MenuStyle.COLOUR_TXT};`
    const dividersStyle = `position: absolute;`

    const node = `
      <div class="${CLASS_MENU}" style="${menuStyle}"></div>
      <div class="${CLASS_DIVIDERS}" style="${dividersStyle}"></div>
    `
    return node
  }

  insertMenu(e, content) {
    let wPos = this.#elWidgetsG.getBoundingClientRect()
    let iPos = e.target.getBoundingClientRect()

    let pos = [iPos.left - wPos.left, iPos.bottom - wPos.top]
    let config = { pos, content }
    return Menu(this, config)
  }

  removeMenu() {

  }

  insertDivider(offChart) {
    const config = {
      
      offChart: offChart,
      mediator: this.#mediator,
    }
    return Divider.createDivider(this, config)
  }

  removeDivider() {

  }

// -----------------------

}
