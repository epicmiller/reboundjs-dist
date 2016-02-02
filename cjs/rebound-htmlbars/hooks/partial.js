"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerPartial = registerPartial;
exports.default = partial;

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _loader = require("rebound-router/loader");

var _loader2 = _interopRequireDefault(_loader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PARTIALS = {};

function registerPartial(name, template) {
  if (template && _.isString(name)) {

    // If this partial has a callback list associated with its name, call all of
    // the callbacks before registering the partial.
    if (Array.isArray(PARTIALS[name])) {
      PARTIALS[name].forEach(function (cb) {
        cb(template);
      });
    }

    // Save the partial template in our cache and return it
    _loader2.default.register('/' + name + '.js');
    return PARTIALS[name] = template;
  }
}

function partial(renderNode, env, scope, path) {

  // If no path is passed, yell
  if (!path) {
    console.error('Partial hook must be passed path!');
  }

  // Resolve the value of path
  path = path.isLazyValue ? path.value : path;

  // Create new child scope for partial
  scope = this.createChildScope(scope);

  var render = this.buildRenderResult;

  // If a partial is registered with this path name, render it
  if (PARTIALS[path] && !Array.isArray(PARTIALS[path])) {
    return render(PARTIALS[path], env, scope, { contextualElement: renderNode }).fragment;
  }

  // If this partial is not yet registered, add it to a callback list to be called
  // when registered. When registered, replace the dummy node we created with the
  // rendered partial template.
  var node = document.createTextNode('');
  PARTIALS[path] || (PARTIALS[path] = []);
  PARTIALS[path].push(function partialCallback(template) {
    if (!node.parentNode) {
      return void 0;
    }
    node.parentNode.replaceChild(render(template, env, scope, { contextualElement: renderNode }).fragment, node);
  });
  return node;
}