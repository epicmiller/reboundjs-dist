//     Rebound.js 0.0.60

//     (c) 2015 Adam Miller
//     Rebound may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://reboundjs.com

// Rebound Runtime
// ----------------

// If Backbone isn't preset on the page yet, or if `window.Rebound` is already
// in use, throw an error
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Load our **Utils**, helper environment, **Rebound Data**,
// **Rebound Components** and the **Rebound Router**

var _reboundComponentUtils = require("rebound-component/utils");

var _reboundComponentUtils2 = _interopRequireDefault(_reboundComponentUtils);

var _reboundComponentHelpers = require("rebound-component/helpers");

var _reboundComponentHelpers2 = _interopRequireDefault(_reboundComponentHelpers);

var _reboundDataReboundData = require("rebound-data/rebound-data");

var _reboundComponentComponent = require("rebound-component/component");

var _reboundComponentComponent2 = _interopRequireDefault(_reboundComponentComponent);

var _reboundRouterReboundRouter = require("rebound-router/rebound-router");

var _reboundRouterReboundRouter2 = _interopRequireDefault(_reboundRouterReboundRouter);

if (!window.Backbone) throw "Backbone must be on the page for Rebound to load.";

// If Backbone doesn't have an ajax method from an external DOM library, use ours
window.Backbone.ajax = window.Backbone.$ && window.Backbone.$.ajax && window.Backbone.ajax || _reboundComponentUtils2["default"].ajax;

// Create Global Rebound Object
var Rebound = window.Rebound = {
  services: {},
  registerHelper: _reboundComponentHelpers2["default"].registerHelper,
  registerPartial: _reboundComponentHelpers2["default"].registerPartial,
  registerComponent: _reboundComponentComponent2["default"].registerComponent,
  Model: _reboundDataReboundData.Model,
  Collection: _reboundDataReboundData.Collection,
  ComputedProperty: _reboundDataReboundData.ComputedProperty,
  Component: _reboundComponentComponent2["default"],
  start: function start(options) {
    var _this = this;

    return new Promise(function (resolve, reject) {
      var run = function run() {
        if (!document.body) return setTimeout(run.bind(_this), 1);
        delete _this.router;
        _this.router = new _reboundRouterReboundRouter2["default"](options, resolve);
      };
      run();
    });
  },
  stop: function stop() {
    if (!this.router) return console.error("No running Rebound router found!");
    this.router.stop();
  }
};

// Fetch Rebound's Config Object from Rebound's `script` tag
var Config = document.getElementById("Rebound");
Config = Config ? Config.innerHTML : false;

// Start the router if a config object is preset
if (Config) Rebound.start(JSON.parse(Config));

exports["default"] = Rebound;
module.exports = exports["default"];