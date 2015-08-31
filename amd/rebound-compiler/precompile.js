define("rebound-compiler/precompile", ["exports", "module", "./parser", "htmlbars"], function (exports, module, _parser, _htmlbars) {
  // Rebound Pre-Compiler
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _parse = _interopRequireDefault(_parser);

  function precompile(str) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    if (!str || str.length === 0) {
      return console.error("No template provided!");
    }

    var template;
    str = (0, _parse["default"])(str, options);

    // Compile
    str.template = "" + (0, _htmlbars.compileSpec)(str.template);

    // If is a partial
    if (str.isPartial) {
      template = "\n      define( [ " + str.deps.join(", ") + " ], function(){\n        var template = " + str.template + ";\n        window.Rebound.registerPartial(\"" + str.name + "\", template);\n      });";
    }
    // Else, is a component
    else {
      template = "\n      define( [ " + str.deps.join(", ") + " ], function(){\n        return window.Rebound.registerComponent(\"" + str.name + "\", {\n          prototype: " + str.script + ",\n          template: " + str.template + ",\n          style: \"" + str.style + "\"\n        });\n      });";
    }

    return template;
  }

  module.exports = precompile;
});