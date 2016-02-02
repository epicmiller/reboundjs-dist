"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = get;

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _lazyValue = require("rebound-htmlbars/lazy-value");

var _lazyValue2 = _interopRequireDefault(_lazyValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ### Get Hook

// The get hook streams a property at a named path from a given scope. It returns
// a `LazyValue` that other code can subscribe to and be alerted when values change.
function get(env, scope, path) {
  var context = scope.self;

  // The special word `this` should referance empty string
  if (path === 'this') {
    path = '';
  }

  // If this path referances a block param, use that as the context instead.
  var rest = _reboundUtils2.default.splitPath(path);
  var key = rest.shift();
  if (scope.localPresent[key]) {
    context = scope.locals[key];
    path = rest.join('.');
  }

  // If this value is not a local value, and there is a stream present
  // If this value is a local, but not at this scope layer, and there is
  if (scope.streams[path] && (!scope.streams[path].layer && !scope.localPresent[key] || scope.streams[path].layer === scope.localPresent[key])) {
    return scope.streams[path];
  }

  // Given a context and a path, create a LazyValue object that returns
  // the value of object at path and add an observer to the context at path.
  return scope.streams[path] = new _lazyValue2.default(function () {
    return this.context.get(this.path, { isPath: true });
  }, {
    context: context,
    path: path,
    layer: scope.localPresent[key]
  }).addObserver(path, context, env);
}