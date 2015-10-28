// Rebound Pre-Compiler
// ----------------

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _parser = require("./parser");

var _parser2 = _interopRequireDefault(_parser);

var _htmlbars = require("htmlbars");

function precompile(str) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  if (!str || str.length === 0) {
    return console.error('No template provided!');
  }

  var template;
  str = (0, _parser2["default"])(str, options);

  // Compile
  str.template = '' + (0, _htmlbars.compileSpec)(str.template);

  // If is a partial
  if (str.isPartial) {
    template = "\n      define( [ " + str.deps.join(', ') + " ], function(){\n        var template = " + str.template + ";\n        window.Rebound.registerPartial(\"" + str.name + "\", template);\n      });";
  }
  // Else, is a component
  else {
      template = "\n      define( [ " + str.deps.join(', ') + " ], function(){\n        return window.Rebound.registerComponent(\"" + str.name + "\", {\n          prototype: " + str.script + ",\n          template: " + str.template + ",\n          style: \"" + str.style + "\"\n        });\n      });";
    }

  return template;
}

exports["default"] = precompile;
module.exports = exports["default"];