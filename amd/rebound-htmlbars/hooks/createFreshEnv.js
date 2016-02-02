define("rebound-htmlbars/hooks/createFreshEnv", ["exports", "dom-helper", "rebound-htmlbars/helpers"], function (exports, _domHelper, _helpers) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = createFreshEnv;

  var _domHelper2 = _interopRequireDefault(_domHelper);

  var _helpers2 = _interopRequireDefault(_helpers);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var DOMHelper = _domHelper2.default.default || _domHelper2.default;

  function createFreshEnv() {
    return {
      isReboundEnv: true,
      cid: _.uniqueId('env'),
      root: null,
      helpers: _helpers2.default,
      hooks: this,
      dom: new DOMHelper(),
      revalidateQueue: {},
      observers: {}
    };
  }
});