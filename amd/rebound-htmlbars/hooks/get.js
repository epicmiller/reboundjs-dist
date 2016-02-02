define("rebound-htmlbars/hooks/get", ["exports", "rebound-utils/rebound-utils", "rebound-htmlbars/lazy-value"], function (exports, _reboundUtils, _lazyValue) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = get;

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  var _lazyValue2 = _interopRequireDefault(_lazyValue);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function get(env, scope, path) {
    var context = scope.self;

    if (path === 'this') {
      path = '';
    }

    var rest = _reboundUtils2.default.splitPath(path);

    var key = rest.shift();

    if (scope.localPresent[key]) {
      context = scope.locals[key];
      path = rest.join('.');
    }

    if (scope.streams[path] && (!scope.streams[path].layer && !scope.localPresent[key] || scope.streams[path].layer === scope.localPresent[key])) {
      return scope.streams[path];
    }

    return scope.streams[path] = new _lazyValue2.default(function () {
      return this.context.get(this.path, {
        isPath: true
      });
    }, {
      context: context,
      path: path,
      layer: scope.localPresent[key]
    }).addObserver(path, context, env);
  }
});