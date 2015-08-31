define("rebound-compiler/compile", ["exports", "module", "rebound-compiler/parser", "htmlbars-compiler/compiler", "htmlbars-util/object-utils", "dom-helper", "rebound-component/helpers", "rebound-component/hooks", "rebound-component/component"], function (exports, module, _reboundCompilerParser, _htmlbarsCompilerCompiler, _htmlbarsUtilObjectUtils, _domHelper, _reboundComponentHelpers, _reboundComponentHooks, _reboundComponentComponent) {
  // Rebound Compiler
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _parse = _interopRequireDefault(_reboundCompilerParser);

  var _DOMHelper = _interopRequireDefault(_domHelper);

  var _helpers = _interopRequireDefault(_reboundComponentHelpers);

  var _hooks = _interopRequireDefault(_reboundComponentHooks);

  var _Component = _interopRequireDefault(_reboundComponentComponent);

  function compile(str) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    /* jshint evil: true */
    // Parse the template and compile our template function
    var defs = (0, _parse["default"])(str, options),
        template = new Function("return " + (0, _htmlbarsCompilerCompiler.compileSpec)(defs.template))();

    if (defs.isPartial) {
      _helpers["default"].registerPartial(options.name, template);
      return _hooks["default"].wrap(template);
    } else {
      return _Component["default"].registerComponent(defs.name, {
        prototype: new Function("return " + defs.script)(),
        template: _hooks["default"].wrap(template),
        style: defs.style
      });
    }
  }

  module.exports = { compile: compile };
});