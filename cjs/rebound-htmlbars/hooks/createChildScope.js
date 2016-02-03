"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createChildScope;
// ### Create-Child-Scope Hook

// Create a scope object that will inherit everything from its parent
// scope until written over with a local variable.
function createChildScope(parent) {
  var scope = Object.create(parent);
  scope.level = parent.level + 1;
  scope.locals = Object.create(parent.locals);
  scope.localPresent = Object.create(parent.localPresent);
  scope.streams = Object.create(parent.streams);
  scope.blocks = Object.create(parent.blocks);
  return scope;
}