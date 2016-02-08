"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _backbone = require("backbone");

var _backbone2 = _interopRequireDefault(_backbone);

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _reboundData = require("rebound-data/rebound-data");

var _reboundRouter = require("rebound-router/rebound-router");

var _reboundHtmlbars = require("rebound-htmlbars/rebound-htmlbars");

var _factory = require("rebound-component/factory");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Because of our bundle and how it plays with Backbone's UMD header, we need to
// be a little more explicit with out DOM library search.
//     Rebound.js v0.3.2

//     (c) 2015 Adam Miller
//     Rebound may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://reboundjs.com

// Rebound Runtime
// ----------------

// Import Backbone
_backbone2.default.$ = window.$;

// If Backbone doesn't have an ajax method from an external DOM library, use ours

// Load our **Utils**, helper environment, **Rebound Data**,
// **Rebound Components** and the **Rebound Router**
_backbone2.default.ajax = _backbone2.default.$ && _backbone2.default.$.ajax && _backbone2.default.ajax || _reboundUtils2.default.ajax;

// Fetch Rebound's Config Object from Rebound's `script` tag
var Config = document.getElementById('Rebound');
Config = Config ? JSON.parse(Config.innerHTML) : false;

var Rebound = window.Rebound = {
  version: '0.3.2',
  testing: window.Rebound && window.Rebound.testing || Config && Config.testing || false,

  registerHelper: _reboundHtmlbars.registerHelper,
  registerPartial: _reboundHtmlbars.registerPartial,
  registerComponent: _factory.registerComponent,

  Component: _factory.ComponentFactory,
  Model: _reboundData.Model,
  Collection: _reboundData.Collection,
  ComputedProperty: _reboundData.ComputedProperty,

  history: _backbone2.default.history,
  services: _reboundRouter.services,
  start: function start(options) {
    var R = this;
    return new Promise(function (resolve, reject) {
      var run = function run() {
        if (!document.body) {
          return setTimeout(run.bind(R), 1);
        }
        delete R.router;
        R.router = new _reboundRouter.Router(options, resolve);
      };
      run();
    });
  },
  stop: function stop() {
    if (!this.router) return console.error('No running Rebound router found!');
    this.router.stop();
  }
};

// Start the router if a config object is preset
if (Config) {
  Rebound.start(Config);
}

exports.default = Rebound;