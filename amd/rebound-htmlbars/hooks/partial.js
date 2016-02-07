define("rebound-htmlbars/hooks/partial", ["exports", "rebound-utils/rebound-utils", "rebound-router/loader", "rebound-htmlbars/lazy-value"], function (exports, _reboundUtils, _loader, _lazyValue) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.registerPartial = registerPartial;
  exports.default = partial;

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  var _loader2 = _interopRequireDefault(_loader);

  var _lazyValue2 = _interopRequireDefault(_lazyValue);

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
      console.error('Partial helper must be passed a path!');
    }

    path = path.isLazyValue ? path.value : path;
    scope = this.createChildScope(scope);
    var render = this.buildRenderResult;
    var node = document.createElement('rebound-partial');
    node.setAttribute('path', path);

    if (PARTIALS[path] && !Array.isArray(PARTIALS[path])) {
      node.appendChild(render(PARTIALS[path], env, scope, {
        contextualElement: renderNode
      }).fragment);
    } else {
      PARTIALS[path] || (PARTIALS[path] = []);
      PARTIALS[path].push(function partialCallback(template) {
        node.appendChild(render(template, env, scope, {
          contextualElement: renderNode
        }).fragment, node);
      });
    }

    return node;
  }
});