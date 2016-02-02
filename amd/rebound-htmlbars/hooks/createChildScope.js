define("rebound-htmlbars/hooks/createChildScope", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = createChildScope;

  function createChildScope(parent) {
    var scope = Object.create(parent);
    scope.level = parent.level + 1;
    scope.locals = Object.create(parent.locals);
    scope.localPresent = Object.create(parent.localPresent);
    scope.streams = Object.create(parent.streams);
    return scope;
  }
});