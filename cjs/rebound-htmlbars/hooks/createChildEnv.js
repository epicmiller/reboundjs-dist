"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createChildEnv;
// ### Create-Child-Environment Hook

// Create an environment object that will inherit everything from its parent
// environment until written over with a local variable.
function createChildEnv(parent) {
  var env = Object.create(parent);
  env.helpers = Object.create(parent.helpers);
  return env;
}