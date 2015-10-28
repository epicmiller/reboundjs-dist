define("compiler", ["exports", "module", "runtime", "rebound-compiler/compile"], function (exports, module, _runtime, _reboundCompilerCompile) {
  //     Rebound.js 0.0.92

  //     (c) 2015 Adam Miller
  //     Rebound may be freely distributed under the MIT license.
  //     For all details and documentation:
  //     http://reboundjs.com

  // Rebound Compiletime
  // ----------------

  // If Backbone isn't preset on the page yet, or if `window.Rebound` is already
  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _Rebound = _interopRequireDefault(_runtime);

  // Load our **compiler**

  var _compiler = _interopRequireDefault(_reboundCompilerCompile);

  _Rebound["default"].compiler = _compiler["default"];

  module.exports = _Rebound["default"];
});