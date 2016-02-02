define("rebound-htmlbars/hooks", ["exports", "rebound-utils/rebound-utils", "htmlbars-runtime/hooks", "htmlbars-runtime/render", "rebound-htmlbars/hooks/createFreshEnv", "rebound-htmlbars/hooks/createChildEnv", "rebound-htmlbars/hooks/createFreshScope", "rebound-htmlbars/hooks/createChildScope", "rebound-htmlbars/hooks/bindScope", "rebound-htmlbars/hooks/linkRenderNode", "rebound-htmlbars/hooks/cleanupRenderNode", "rebound-htmlbars/hooks/destroyRenderNode", "rebound-htmlbars/hooks/willCleanupTree", "rebound-htmlbars/hooks/didCleanupTree", "rebound-htmlbars/hooks/get", "rebound-htmlbars/hooks/getValue", "rebound-htmlbars/hooks/invokeHelper", "rebound-htmlbars/hooks/subexpr", "rebound-htmlbars/hooks/concat", "rebound-htmlbars/hooks/content", "rebound-htmlbars/hooks/attribute", "rebound-htmlbars/hooks/partial", "rebound-htmlbars/hooks/component", "rebound-htmlbars/helpers"], function (exports, _reboundUtils, _hooks, _render2, _createFreshEnv, _createChildEnv, _createFreshScope, _createChildScope, _bindScope, _linkRenderNode, _cleanupRenderNode, _destroyRenderNode, _willCleanupTree, _didCleanupTree, _get, _getValue, _invokeHelper, _subexpr, _concat, _content, _attribute, _partial, _component, _helpers) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  var _hooks2 = _interopRequireDefault(_hooks);

  var _render3 = _interopRequireDefault(_render2);

  var _createFreshEnv2 = _interopRequireDefault(_createFreshEnv);

  var _createChildEnv2 = _interopRequireDefault(_createChildEnv);

  var _createFreshScope2 = _interopRequireDefault(_createFreshScope);

  var _createChildScope2 = _interopRequireDefault(_createChildScope);

  var _bindScope2 = _interopRequireDefault(_bindScope);

  var _linkRenderNode2 = _interopRequireDefault(_linkRenderNode);

  var _cleanupRenderNode2 = _interopRequireDefault(_cleanupRenderNode);

  var _destroyRenderNode2 = _interopRequireDefault(_destroyRenderNode);

  var _willCleanupTree2 = _interopRequireDefault(_willCleanupTree);

  var _didCleanupTree2 = _interopRequireDefault(_didCleanupTree);

  var _get2 = _interopRequireDefault(_get);

  var _getValue2 = _interopRequireDefault(_getValue);

  var _invokeHelper2 = _interopRequireDefault(_invokeHelper);

  var _subexpr2 = _interopRequireDefault(_subexpr);

  var _concat2 = _interopRequireDefault(_concat);

  var _content2 = _interopRequireDefault(_content);

  var _attribute2 = _interopRequireDefault(_attribute);

  var _partial2 = _interopRequireDefault(_partial);

  var _component2 = _interopRequireDefault(_component);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  _hooks2.default.createFreshEnv = _createFreshEnv2.default;
  _hooks2.default.createChildEnv = _createChildEnv2.default;
  _hooks2.default.createFreshScope = _createFreshScope2.default;
  _hooks2.default.createChildScope = _createChildScope2.default;
  _hooks2.default.bindScope = _bindScope2.default;
  _hooks2.default.linkRenderNode = _linkRenderNode2.default;
  _hooks2.default.willCleanupTree = _willCleanupTree2.default;
  _hooks2.default.cleanupRenderNode = _cleanupRenderNode2.default;
  _hooks2.default.destroyRenderNode = _cleanupRenderNode2.default;
  _hooks2.default.didCleanupTree = _didCleanupTree2.default;
  _hooks2.default.get = _get2.default;
  _hooks2.default.getValue = _getValue2.default;
  _hooks2.default.invokeHelper = _invokeHelper2.default;
  _hooks2.default.subexpr = _subexpr2.default;
  _hooks2.default.concat = _concat2.default;
  _hooks2.default.content = _content2.default;
  _hooks2.default.attribute = _attribute2.default;
  _hooks2.default.partial = _partial2.default;
  _hooks2.default.registerPartial = _partial.registerPartial;
  _hooks2.default.component = _component2.default;
  _hooks2.default.hasHelper = _helpers.hasHelper;
  _hooks2.default.lookupHelper = _helpers.lookupHelper;
  _hooks2.default.registerHelper = _helpers.registerHelper;

  _hooks2.default.bindLocal = function bindLocal(env, scope, name, value) {
    scope.localPresent[name] = scope.level;
    scope.locals[name] = value;
  };

  _hooks2.default.buildRenderResult = function buildRenderResult(template, env, scope, options) {
    var render = _render3.default.default || _render3.default;
    env = _hooks2.default.createChildEnv(env);
    env.template = render(template, env, scope, options);
    env.template.uid = _reboundUtils2.default.uniqueId('template');
    return env.template;
  };

  exports.default = _hooks2.default;
});