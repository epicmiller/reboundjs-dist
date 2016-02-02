define("rebound-compiler/precompile", ["exports", "./parser", "../rebound-htmlbars/compile"], function (exports, _parser, _compile) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = precompile;

  var _parser2 = _interopRequireDefault(_parser);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function precompile(str) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    if (!str || str.length === 0) {
      return console.error('No template provided!');
    }

    var template;
    str = (0, _parser2.default)(str, options);
    str.template = '' + (0, _compile.precompile)(str.template);

    if (str.isPartial) {
      template = ["(function(R){", "  R.router._loadDeps([ " + (str.deps.length ? '"' + str.deps.join('", "') + '"' : '') + " ]);", "  R.registerPartial(\"" + str.name + "\", " + str.template + ");", "})(window.Rebound);"].join('\n');
    } else {
      template = ["(function(R){", "  R.router._loadDeps([ " + (str.deps.length ? '"' + str.deps.join('", "') + '"' : '') + " ]);", "  document.currentScript.setAttribute(\"data-name\", \"" + str.name + "\");", "  return R.registerComponent(\"" + str.name + "\", {", "    prototype: " + str.script + ",", "    template: " + str.template + ",", "    stylesheet: \"" + str.stylesheet + "\"", "   });", "})(window.Rebound);"].join('\n');
    }

    return {
      src: template,
      deps: str.deps
    };
  }
});