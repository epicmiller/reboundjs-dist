"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compile = compile;
exports.precompile = precompile;

var _htmlbars = require("htmlbars");

// Return an executable function (object) version of the compiled template string
function compile(string) {
  return new Function("return " + (0, _htmlbars.compileSpec)(string))(); // jshint ignore:line
}

// Return a precompiled (string) version of the compiled template string
function precompile(string) {
  return (0, _htmlbars.compileSpec)(string);
}