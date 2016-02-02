"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _hooks = require("htmlbars-runtime/hooks");

var _hooks2 = _interopRequireDefault(_hooks);

var _render2 = require("htmlbars-runtime/render");

var _render3 = _interopRequireDefault(_render2);

var _createFreshEnv = require("rebound-htmlbars/hooks/createFreshEnv");

var _createFreshEnv2 = _interopRequireDefault(_createFreshEnv);

var _createChildEnv = require("rebound-htmlbars/hooks/createChildEnv");

var _createChildEnv2 = _interopRequireDefault(_createChildEnv);

var _createFreshScope = require("rebound-htmlbars/hooks/createFreshScope");

var _createFreshScope2 = _interopRequireDefault(_createFreshScope);

var _createChildScope = require("rebound-htmlbars/hooks/createChildScope");

var _createChildScope2 = _interopRequireDefault(_createChildScope);

var _bindScope = require("rebound-htmlbars/hooks/bindScope");

var _bindScope2 = _interopRequireDefault(_bindScope);

var _linkRenderNode = require("rebound-htmlbars/hooks/linkRenderNode");

var _linkRenderNode2 = _interopRequireDefault(_linkRenderNode);

var _cleanupRenderNode = require("rebound-htmlbars/hooks/cleanupRenderNode");

var _cleanupRenderNode2 = _interopRequireDefault(_cleanupRenderNode);

var _destroyRenderNode = require("rebound-htmlbars/hooks/destroyRenderNode");

var _destroyRenderNode2 = _interopRequireDefault(_destroyRenderNode);

var _willCleanupTree = require("rebound-htmlbars/hooks/willCleanupTree");

var _willCleanupTree2 = _interopRequireDefault(_willCleanupTree);

var _didCleanupTree = require("rebound-htmlbars/hooks/didCleanupTree");

var _didCleanupTree2 = _interopRequireDefault(_didCleanupTree);

var _get = require("rebound-htmlbars/hooks/get");

var _get2 = _interopRequireDefault(_get);

var _getValue = require("rebound-htmlbars/hooks/getValue");

var _getValue2 = _interopRequireDefault(_getValue);

var _invokeHelper = require("rebound-htmlbars/hooks/invokeHelper");

var _invokeHelper2 = _interopRequireDefault(_invokeHelper);

var _subexpr = require("rebound-htmlbars/hooks/subexpr");

var _subexpr2 = _interopRequireDefault(_subexpr);

var _concat = require("rebound-htmlbars/hooks/concat");

var _concat2 = _interopRequireDefault(_concat);

var _content = require("rebound-htmlbars/hooks/content");

var _content2 = _interopRequireDefault(_content);

var _attribute = require("rebound-htmlbars/hooks/attribute");

var _attribute2 = _interopRequireDefault(_attribute);

var _partial = require("rebound-htmlbars/hooks/partial");

var _partial2 = _interopRequireDefault(_partial);

var _component = require("rebound-htmlbars/hooks/component");

var _component2 = _interopRequireDefault(_component);

var _helpers = require("rebound-htmlbars/helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// __Environment Hooks__ create and modify the template environment objects

_hooks2.default.createFreshEnv = _createFreshEnv2.default; // Rebound Hooks
// ----------------
// Here we augment HTMLBars' default hooks to make use of Rebound's evented data
// objects for automatic databinding.

_hooks2.default.createChildEnv = _createChildEnv2.default;

// __Scope Hooks__ create, access and modify the template scope and data objects

_hooks2.default.createFreshScope = _createFreshScope2.default;
_hooks2.default.createChildScope = _createChildScope2.default;
_hooks2.default.bindScope = _bindScope2.default;

// __Lifecycle Hooks__ construct, deconstruct and clean up render nodes over their lifecycles

_hooks2.default.linkRenderNode = _linkRenderNode2.default;
_hooks2.default.willCleanupTree = _willCleanupTree2.default;
_hooks2.default.cleanupRenderNode = _cleanupRenderNode2.default;
_hooks2.default.destroyRenderNode = _cleanupRenderNode2.default;
_hooks2.default.didCleanupTree = _didCleanupTree2.default;

// __Streaming Hooks__ create streams via LazyValues for data values, helpers, subexpressions and concat groups

_hooks2.default.get = _get2.default;
_hooks2.default.getValue = _getValue2.default;
_hooks2.default.invokeHelper = _invokeHelper2.default;
_hooks2.default.subexpr = _subexpr2.default;
_hooks2.default.concat = _concat2.default;

// __Render Hooks__ interact with the DOM to output content and bind to form elements for two way databinding

_hooks2.default.content = _content2.default;
_hooks2.default.attribute = _attribute2.default;
_hooks2.default.partial = _partial2.default;
_hooks2.default.registerPartial = _partial.registerPartial;
_hooks2.default.component = _component2.default;

// __Helper Hooks__ manage the environment's registered helpers

_hooks2.default.hasHelper = _helpers.hasHelper;
_hooks2.default.lookupHelper = _helpers.lookupHelper;
_hooks2.default.registerHelper = _helpers.registerHelper;

// Bind local binds a local variable to the scope object and tracks the scope
// level at which that local was added. See `createChildScope` for description
// of scope levels
_hooks2.default.bindLocal = function bindLocal(env, scope, name, value) {
  scope.localPresent[name] = scope.level;
  scope.locals[name] = value;
};

// __buildRenderResult__ is a wrapper for the native HTMLBars render function. It
// ensures every template is rendered with its own child environment, every environment
// saves a referance to its unique render result for re-renders, and every render
// result has a unique id.
_hooks2.default.buildRenderResult = function buildRenderResult(template, env, scope, options) {
  var render = _render3.default.default || _render3.default; // Fix for stupid Babel imports
  env = _hooks2.default.createChildEnv(env);
  env.template = render(template, env, scope, options);
  env.template.uid = _reboundUtils2.default.uniqueId('template');
  return env.template;
};

exports.default = _hooks2.default;