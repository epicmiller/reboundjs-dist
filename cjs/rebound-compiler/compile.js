// Rebound Compiler
// ----------------

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _reboundCompilerParser = require("rebound-compiler/parser");

var _reboundCompilerParser2 = _interopRequireDefault(_reboundCompilerParser);

var _htmlbarsCompilerCompiler = require("htmlbars-compiler/compiler");

var _htmlbarsUtilObjectUtils = require("htmlbars-util/object-utils");

var _domHelper = require("dom-helper");

var _domHelper2 = _interopRequireDefault(_domHelper);

var _reboundComponentHelpers = require("rebound-component/helpers");

var _reboundComponentHelpers2 = _interopRequireDefault(_reboundComponentHelpers);

var _reboundComponentHooks = require("rebound-component/hooks");

var _reboundComponentHooks2 = _interopRequireDefault(_reboundComponentHooks);

var _reboundComponentComponent = require("rebound-component/component");

var _reboundComponentComponent2 = _interopRequireDefault(_reboundComponentComponent);

function compile(str) {
  var options = arguments[1] === undefined ? {} : arguments[1];

  var str = (0, _reboundCompilerParser2["default"])(str, options);

  // Compile our template function
  var func = (0, _htmlbarsCompilerCompiler.compile)(str.template);

  if (str.isPartial) {
    return _reboundComponentHelpers2["default"].registerPartial(options.name, func);
  } else {
    return _reboundComponentComponent2["default"].registerComponent(str.name, {
      prototype: new Function("return " + str.script)(),
      template: func,
      style: str.style
    });
  }
}

exports["default"] = { compile: compile };
module.exports = exports["default"];