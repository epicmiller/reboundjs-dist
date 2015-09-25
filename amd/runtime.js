define("runtime", ["exports", "module", "rebound-component/utils", "rebound-component/helpers", "rebound-data/rebound-data", "rebound-component/component", "rebound-router/rebound-router"], function (exports, module, _reboundComponentUtils, _reboundComponentHelpers, _reboundDataReboundData, _reboundComponentComponent, _reboundRouterReboundRouter) {
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

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  // Load our **Utils**, helper environment, **Rebound Data**,
  // **Rebound Components** and the **Rebound Router**

  var _utils = _interopRequireDefault(_reboundComponentUtils);

  var _helpers = _interopRequireDefault(_reboundComponentHelpers);

  var _Component = _interopRequireDefault(_reboundComponentComponent);

  var _Router = _interopRequireDefault(_reboundRouterReboundRouter);

  // If Backbone doesn't have an ajax method from an external DOM library, use ours
  if (!window.Backbone) throw "Backbone must be on the page for Rebound to load.";window.Backbone.ajax = window.Backbone.$ && window.Backbone.$.ajax && window.Backbone.ajax || _utils["default"].ajax;

  // Create Global Rebound Object
  var Rebound = {
    services: {},
    registerHelper: _helpers["default"].registerHelper,
    registerPartial: _helpers["default"].registerPartial,
    registerComponent: _Component["default"].registerComponent,
    Model: _reboundDataReboundData.Model,
    Collection: _reboundDataReboundData.Collection,
    ComputedProperty: _reboundDataReboundData.ComputedProperty,
    Component: _Component["default"],
    start: function start(options) {
      var _this = this;

      return new Promise(function (resolve, reject) {
        var run = function run() {
          if (document.readyState !== "complete") return;
          delete _this.router;
          _this.router = new _Router["default"](options, resolve);
        };
        if (document.readyState === "complete") return run();
        document.addEventListener("readystatechange", run);
      });
    },
    stop: function stop() {
      if (!this.router) return console.error('No running Rebound router found!');
      this.router.stop();
    }
  };

  // Fetch Rebound's Config Object from Rebound's `script` tag
  var Config = document.getElementById('Rebound');
  Config = Config ? Config.innerHTML : false;

  // Start the router if a config object is preset
  if (Config) Rebound.start(JSON.parse(Config));

  module.exports = Rebound;
});