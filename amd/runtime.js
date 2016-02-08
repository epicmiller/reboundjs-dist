define("runtime", ["exports", "backbone", "rebound-utils/rebound-utils", "rebound-data/rebound-data", "rebound-router/rebound-router", "rebound-htmlbars/rebound-htmlbars", "rebound-component/factory"], function (exports, _backbone, _reboundUtils, _reboundData, _reboundRouter, _reboundHtmlbars, _factory) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _backbone2 = _interopRequireDefault(_backbone);

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  _backbone2.default.$ = window.$;
  _backbone2.default.ajax = _backbone2.default.$ && _backbone2.default.$.ajax && _backbone2.default.ajax || _reboundUtils2.default.ajax;
  var Config = document.getElementById('Rebound');
  Config = Config ? JSON.parse(Config.innerHTML) : false;
  var Rebound = window.Rebound = {
    version: '0.3.3',
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

  if (Config) {
    Rebound.start(Config);
  }

  exports.default = Rebound;
});