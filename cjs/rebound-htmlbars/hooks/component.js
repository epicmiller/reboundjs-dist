"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = component;

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _factory = require("rebound-component/factory");

var _factory2 = _interopRequireDefault(_factory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function component(morph, env, scope, tagName, params, attrs, templates, visitor) {
  var _this = this;

  // Components are only ever rendered once
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

  // Create a plain data object to pass to our new component as seed data
  for (var key in attrs) {
    seedData[key] = this.getValue(attrs[key]);
  }

  // For each param passed to our shared component, add it to our custom element
  component = (0, _factory2.default)(tagName, seedData);
  element = component.el;
  componentScope.self = component;

  var _loop = function _loop(key) {

    // For each param passed to our component, create its lazyValue
    componentData[key] = _this.get(component.env, componentScope, key);

    // Set up two way binding between component and original context
    if (componentData[key].isLazyValue && attrs[key].isLazyValue) {

      // For each lazy param passed to our component, have it update the original context when changed.
      componentData[key].onNotify(function () {
        attrs[key].set(attrs[key].path, componentData[key].value);
      });

      // For each lazy param passed to our component, have it update the component when changed.
      attrs[key].onNotify(function () {
        componentData[key].set(key, attrs[key].value);
      });

      // Seed the cache
      componentData[key].value;
    }
  };

  for (var key in seedData) {
    _loop(key);
  }

  /** The attributeChangedCallback on our custom element updates the component's data. **/

  // Walk the dom, without traversing into other custom elements, and search for
  // `<content>` outlets to render templates into.
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

  // If a `<content>` outlet is present in component's template, and a template
  // is provided, render it into the outlet
  if (templates.default && _.isElement(outlet)) {
    (0, _reboundUtils2.default)(outlet).empty();
    outlet.appendChild(render(templates.default, env, scope, {}).fragment);
  }

  morph.setNode(element);
  morph.componentIsRendered = true;
}