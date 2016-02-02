define("rebound-htmlbars/hooks/createChildEnv", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = createChildEnv;

  function createChildEnv(parent) {
    var env = Object.create(parent);
    env.helpers = Object.create(parent.helpers);
    return env;
  }
});