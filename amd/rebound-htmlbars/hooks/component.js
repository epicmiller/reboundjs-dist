define("rebound-htmlbars/hooks/component", ["exports", "rebound-utils/rebound-utils", "rebound-component/factory"], function (exports, _reboundUtils, _factory) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = component;

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  var _factory2 = _interopRequireDefault(_factory);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function component(morph, env, scope, tagName, params, attrs, templates, visitor) {
    var _this = this;

    if (morph.componentIsRendered) {
      return void 0;
    }

    if (this.hasHelper(env, scope, tagName)) {
      return this.block(morph, env, scope, tagName, params, attrs, templates.default, templates.inverse, visitor);
    }

    var component,
        element,
        outlet,
        render = this.buildRenderResult,
        seedData = {},
        componentData = {},
        componentScope = this.createFreshScope();

    for (var key in attrs) {
      seedData[key] = this.getValue(attrs[key]);
    }

    component = (0, _factory2.default)(tagName, seedData);
    element = component.el;
    componentScope.self = component;

    var _loop = function _loop(key) {
      componentData[key] = _this.get(component.env, componentScope, key);

      if (componentData[key].isLazyValue && attrs[key].isLazyValue) {
        componentData[key].onNotify(function () {
          attrs[key].set(attrs[key].path, componentData[key].value);
        });
        attrs[key].onNotify(function () {
          componentData[key].set(key, attrs[key].value);
        });
        componentData[key].value;
      }
    };

    for (var key in seedData) {
      _loop(key);
    }

    (0, _reboundUtils2.default)(element).walkTheDOM(function (el) {
      if (element === el) {
        return true;
      }

      if (el.tagName === 'CONTENT') {
        outlet = el;
      }

      if (el.tagName.indexOf('-') > -1) {
        return false;
      }

      return true;
    });

    if (templates.default && _.isElement(outlet)) {
      (0, _reboundUtils2.default)(outlet).empty();
      outlet.appendChild(render(templates.default, env, scope, {}).fragment);
    }

    morph.setNode(element);
    morph.componentIsRendered = true;
  }
});