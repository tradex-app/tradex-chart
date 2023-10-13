const id = "api/core2.md";
						const collection = "docs";
						const slug = "api/core2";
						const body = "\n* * *\n\n## Class: exports\n\n\n\n## Class: TradeXchart\nThe root class for the entire chart\n\n\n## Class: exports\n\n\n**version**:  \n**name**:  \n**shortName**:  \n**config**:  \n**Chart**:  \n**ChartPanes**:  \n**Indicators**:  \n**state**:  \n**allData**:  \n### exports.create(container, txCfg, state) \n\nCreate a new TradeXchart instance\n\n**Parameters**\n\n**container**: `DOM_element`, HTML element to mount the chart on\n\n**txCfg**: `Object`, chart config\n\n**state**: `Object`, chart state\n\n**Returns**: `instance`, TradeXchart\n\n### exports.destroy(chart) \n\nDestroy a chart instance, clean up and remove data\n\n**Parameters**\n\n**chart**: `instance`, Destroy a chart instance, clean up and remove data\n\n\n### exports.start(cfg) \n\nTarget element has been validated as a mount point, \nlet's start building\n\n**Parameters**\n\n**cfg**: `Object`, chart configuration\n\n\n### exports.destroy() \n\nStop all chart event processing and remove the chart from DOM.\nIn other words, destroy the chart.\n\n\n### exports.on(topic, handler, context) \n\nSubscribe to a topic\n\n**Parameters**\n\n**topic**: `string`, The topic name\n\n**handler**: `function`, The function or method that is called\n\n**context**: `Object`, The context the function(s) belongs to\n\n**Returns**: `boolean`\n\n### exports.off(topic, handler) \n\nUnsubscribe from a topic\n\n**Parameters**\n\n**topic**: `string`, The topic name\n\n**handler**: `function`, function to remove\n\n**Returns**: `boolean`\n\n### exports.emit(topic, data) \n\nPublish a topic\n\n**Parameters**\n\n**topic**: `string`, The topic name\n\n**data**: `Object`, The data to publish\n\n**Returns**: `boolean`\n\n### exports.execute(topic, data, cb) \n\nExecute a task\n\n**Parameters**\n\n**topic**: `string`, The topic name\n\n**data**: `Object`, The data that gets published\n\n**cb**: `function`, callback method\n\n\n### exports.setDimensions(w, h) \n\nSet chart width and height\n\n**Parameters**\n\n**w**: `number`, width in pixels\n\n**h**: `number`, height in pixels\n\n\n### exports.setPricePrecision(pricePrecision) \n\nSet the price accuracy\n\n**Parameters**\n\n**pricePrecision**: `number`, Price accuracy\n\n\n### exports.setVolumePrecision(volumePrecision) \n\nSet the volume accuracy\n\n**Parameters**\n\n**volumePrecision**: `number`, Volume accuracy\n\n\n### exports.addTheme(theme) \n\nAdd a theme to the chart,\nif no current theme is set, make this the current one.\n\n**Parameters**\n\n**theme**: `Object`, Volume accuracy\n\n**Returns**: `instance`, - theme instance\n\n### exports.setTheme(theme) \n\nSet the chart theme\n\n**Parameters**\n\n**theme**: `string`, theme identifier\n\n**Returns**: `boolean`\n\n### exports.setStream(stream) \n\nspecify a chart stream\n\n**Parameters**\n\n**stream**: `Object`, specify a chart stream\n\n**Returns**: `instance`\n\n### exports.stopStream() \n\nstop a chart stream\nwill halt any updates to price or indicators\n\n\n### exports.getRange(start, end) \n\ninitialize range\n\n**Parameters**\n\n**start**: `number`, index\n\n**end**: `number`, index\n\n\n### exports.setRange(start, end) \n\nset start and end of range\n\n**Parameters**\n\n**start**: `number`, index\n\n**end**: `number`, index\n\n\n### exports.jumpToIndex(start, nearest, centre) \n\nset Range start index\n\n**Parameters**\n\n**start**: `number`, starting index of state data\n\n**nearest**: `boolean`, limit range start - no out of range values\n\n**centre**: `boolean`, center the range on the start value\n\n\n### exports.jumpToTS(ts, nearest, centre) \n\nset Range start to time stamp\n\n**Parameters**\n\n**ts**: `number`, timestamp\n\n**nearest**: `boolean`, limit range start - no out of range values\n\n**centre**: `boolean`, center the range on the start value\n\n\n### exports.jumpToStart(centre) \n\nset Range start to state data start\n\n**Parameters**\n\n**centre**: `boolean`, center the range on the start value\n\n\n### exports.jumpToEnd(centre) \n\nset Range start to state data ende\n\n**Parameters**\n\n**centre**: `boolean`, center the range on the end value\n\n\n### exports.mergeData(merge, newRange) \n\nMerge a block of data into the chart state.\nUsed for populating a chart with back history.\nMerge data must be formatted to a Chart State.\nOptionally set a new range upon merge.\n\n**Parameters**\n\n**merge**: `Object`, merge data must be formatted to a Chart State\n\n**newRange**: `boolean | object`, false | {start: number, end: number}\n\n\n### exports.isIndicator(i) \n\nvalidate indicator\n\n**Parameters**\n\n**i**: `class`, indicator class\n\n\n### exports.setIndicators(i, flush) \n\nimport Indicators\n\n**Parameters**\n\n**i**: `Object`, indicators {id, name, event, ind}\n\n**flush**: `boolean`, expunge default indicators\n\n**Returns**: , boolean\n\n### exports.addIndicator(i, name, params) \n\nadd an indicator - default or registered user defined\n\n**Parameters**\n\n**i**: `string`, indicator\n\n**name**: `string`, identifier\n\n**params**: `Object`, {settings, data}\n\n**Returns**: `Indicator | false`, - indicator instance or false\n\n### exports.getIndicator(i) \n\nretrieve indicator by ID\n\n**Parameters**\n\n**i**: `string`, indicator ID\n\n\n### exports.removeIndicator(i) \n\nremove an indicator - default or registered user defined\n\n**Parameters**\n\n**i**: `string | Indicator`, indicator id or Indicator instance\n\n**Returns**: `boolean`, - success / failure\n\n### exports.indicatorSettings(i, s) \n\nset or get indicator settings\n\n**Parameters**\n\n**i**: `string | Indicator`, indicator id or Indicator instance\n\n**s**: `Object`, settings\n\n**Returns**: `boolean`, - success / failure\n\n### exports.hasStateIndicator(i, dataset) \n\nDoes current chart state have indicator\n\n**Parameters**\n\n**i**: `string`, indicator id or name\n\n**dataset**: `string`, Does current chart state have indicator\n\n**Returns**: , indicator or false\n\n### exports.resize(width, height) \n\nResize the chart\n\n**Parameters**\n\n**width**: `number`, pixels\n\n**height**: `number`, pixels\n\n**Returns**: `boolean`, - success or failure\n\n### exports.refresh() \n\nrefresh / redraw the chart\n\n\n\n\n* * *\n\n\n\n\n\n\n\n\n\n\n";
						const data = {title:"core",editUrl:true,head:[],template:"doc"};
						const _internal = {
							type: 'content',
							filePath: "/mnt/ext4/Home/neoarttec/Archives/Linux/Crypto/Trading/Mercury/MercuryTrader/component-module-tests/TradeX/tradex-chart/src/docs/src/content/docs/api/core2.md",
							rawData: "\ntitle: core",
						};

export { _internal, body, collection, data, id, slug };
