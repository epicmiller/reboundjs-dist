define("rebound-compiler/compile", ["exports", "rebound-compiler/parser", "rebound-htmlbars/compile", "rebound-htmlbars/rebound-htmlbars", "rebound-htmlbars/render", "rebound-component/factory", "rebound-router/loader"], function (exports, _parser, _compile, _reboundHtmlbars, _render, _factory, _loader) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _parser2 = _interopRequireDefault(_parser);

  var _render2 = _interopRequireDefault(_render);

  var _factory2 = _interopRequireDefault(_factory);

  var _loader2 = _interopRequireDefault(_loader);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function compile(str) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var defs = (0, _parser2.default)(str, options);
    defs.template = (0, _compile.compile)(defs.template);

    defs.template.render = function (data, options) {
      return (0, _render2.default)(this, data, options);
    };

    _loader2.default.load(defs.deps);

    if (defs.isPartial) {
      if (options.name) {
        (0, _reboundHtmlbars.registerPartial)(options.name, defs.template);
      }

      return defs.template;
    } else {
      return _factory2.default.registerComponent(defs.name, {
        prototype: new Function("return " + defs.script)(),
        template: defs.template,
        stylesheet: defs.stylesheet
      });
    }
  }

  exports.default = {
    compile: compile
  };
});