"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _parser = require("rebound-compiler/parser");

var _parser2 = _interopRequireDefault(_parser);

var _compile = require("rebound-htmlbars/compile");

var _reboundHtmlbars = require("rebound-htmlbars/rebound-htmlbars");

var _render = require("rebound-htmlbars/render");

var _render2 = _interopRequireDefault(_render);

var _factory = require("rebound-component/factory");

var _factory2 = _interopRequireDefault(_factory);

var _loader = require("rebound-router/loader");

var _loader2 = _interopRequireDefault(_loader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Rebound Compiler
// ----------------

function compile(str) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  /* jshint evil: true */

  // Parse the component
  var defs = (0, _parser2.default)(str, options);

  // Compile our template
  defs.template = (0, _compile.compile)(defs.template);

  // For client side rendered templates, put the render function directly on the
  // template result for convenience. To sue templates rendered server side will
  // consumers will have to invoke the view layer's render function themselves.
  defs.template.render = function (data, options) {
    return (0, _render2.default)(this, data, options);
  };

  // Fetch any dependancies
  _loader2.default.load(defs.deps);

  // If this is a partial, register the partial
  if (defs.isPartial) {
    if (options.name) {
      (0, _reboundHtmlbars.registerPartial)(options.name, defs.template);
    }
    return defs.template;
  }

  // If this is a component, register the component
  else {
      return _factory2.default.registerComponent(defs.name, {
        prototype: new Function("return " + defs.script)(),
        template: defs.template,
        stylesheet: defs.stylesheet
      });
    }
}

exports.default = { compile: compile };