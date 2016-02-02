define("rebound-htmlbars/hooks/partial", ["exports", "rebound-utils/rebound-utils", "rebound-router/loader"], function (exports, _reboundUtils, _loader) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.registerPartial = registerPartial;
  exports.default = partial;

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  var _loader2 = _interopRequireDefault(_loader);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var PARTIALS = {};

  function registerPartial(name, template) {
    if (template && _.isString(name)) {
      if (Array.isArray(PARTIALS[name])) {
        PARTIALS[name].forEach(function (cb) {
          cb(template);
        });
      }

      _loader2.default.register('/' + name + '.js');

      return PARTIALS[name] = template;
    }
  }

  function partial(renderNode, env, scope, path) {
    if (!path) {
      console.error('Partial hook must be passed path!');
    }

    path = path.isLazyValue ? path.value : path;
    scope = this.createChildScope(scope);
    var render = this.buildRenderResult;

    if (PARTIALS[path] && !Array.isArray(PARTIALS[path])) {
      return render(PARTIALS[path], env, scope, {
        contextualElement: renderNode
      }).fragment;
    }

    var node = document.createTextNode('');
    PARTIALS[path] || (PARTIALS[path] = []);
    PARTIALS[path].push(function partialCallback(template) {
      if (!node.parentNode) {
        return void 0;
      }

      node.parentNode.replaceChild(render(template, env, scope, {
        contextualElement: renderNode
      }).fragment, node);
    });
    return node;
  }
});