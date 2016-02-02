define("rebound-htmlbars/hooks/invokeHelper", ["exports", "rebound-utils/rebound-utils", "rebound-htmlbars/lazy-value"], function (exports, _reboundUtils, _lazyValue) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = invokeHelper;

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  var _lazyValue2 = _interopRequireDefault(_lazyValue);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function invokeHelper(morph, env, scope, visitor, params, hash, helper, templates, context) {
    if (!_.isFunction(helper)) {
      console.error('Invalid helper!', helper);
      return {
        value: ''
      };
    }

    var name = helper.name + ":";

    _.each(params, function (param, index) {
      name += " " + (param && param.isLazyValue ? param.cid : param);
    });

    _.each(hash, function (hash, key) {
      name += " " + key + "=" + hash.cid;
    });

    if (scope.streams[name]) {
      return scope.streams[name];
    }

    var lazyValue = new _lazyValue2.default(function (params, hash) {
      return helper.call(context || {}, params, hash, templates, env);
    }, {
      path: name,
      params: params,
      hash: hash
    });

    if (!context && morph) {
      scope.streams[name] = lazyValue;
    }

    lazyValue.value;
    return lazyValue;
  }
});