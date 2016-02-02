"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = precompile;

var _parser = require("./parser");

var _parser2 = _interopRequireDefault(_parser);

var _compile = require("../rebound-htmlbars/compile");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Rebound Pre-Compiler
// ----------------

function precompile(str) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  if (!str || str.length === 0) {
    return console.error('No template provided!');
  }

  var template;
  str = (0, _parser2.default)(str, options);

  // Compile
  str.template = '' + (0, _compile.precompile)(str.template);

  // If is a partial
  if (str.isPartial) {
    template = ["(function(R){", "  R.router._loadDeps([ " + (str.deps.length ? '"' + str.deps.join('", "') + '"' : '') + " ]);", "  R.registerPartial(\"" + str.name + "\", " + str.template + ");", "})(window.Rebound);"].join('\n');
  }
  // Else, is a component
  else {
      template = ["(function(R){", "  R.router._loadDeps([ " + (str.deps.length ? '"' + str.deps.join('", "') + '"' : '') + " ]);", "  document.currentScript.setAttribute(\"data-name\", \"" + str.name + "\");", "  return R.registerComponent(\"" + str.name + "\", {", "    prototype: " + str.script + ",", "    template: " + str.template + ",", "    stylesheet: \"" + str.stylesheet + "\"", "   });", "})(window.Rebound);"].join('\n');
    }
  return { src: template, deps: str.deps };
}