define("rebound-htmlbars/hooks/concat", ["exports", "rebound-htmlbars/lazy-value"], function (exports, _lazyValue) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = concat;

  var _lazyValue2 = _interopRequireDefault(_lazyValue);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var CONCAT_CACHE = {};

  function concat(env, params) {
    if (params.length === 1) {
      return params[0];
    }

    var name = "concat: ";

    _.each(params, function (param, index) {
      name += "" + (param && param.isLazyValue ? param.cid : param);
    });

    if (CONCAT_CACHE[name]) {
      return CONCAT_CACHE[name];
    }

    return CONCAT_CACHE[name] = new _lazyValue2.default(function (params) {
      return params.join('');
    }, {
      context: params[0].context,
      path: name,
      params: params
    });
  }
});