define("rebound-htmlbars/compile", ["exports", "htmlbars"], function (exports, _htmlbars) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.compile = compile;
  exports.precompile = precompile;

  function compile(string) {
    return new Function("return " + (0, _htmlbars.compileSpec)(string))();
  }

  function precompile(string) {
    return (0, _htmlbars.compileSpec)(string);
  }
});