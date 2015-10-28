//     Rebound.js 0.0.92

//     (c) 2015 Adam Miller
//     Rebound may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://reboundjs.com

// Rebound Compiletime
// ----------------

// If Backbone isn't preset on the page yet, or if `window.Rebound` is already
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _runtime = require('runtime');

var _runtime2 = _interopRequireDefault(_runtime);

// Load our **compiler**

var _reboundCompilerCompile = require("rebound-compiler/compile");

var _reboundCompilerCompile2 = _interopRequireDefault(_reboundCompilerCompile);

_runtime2["default"].compiler = _reboundCompilerCompile2["default"];

exports["default"] = _runtime2["default"];
module.exports = exports["default"];