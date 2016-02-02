define("rebound-htmlbars/hooks/bindScope", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = bindScope;

  function bindScope(env, scope) {
    env.scope = scope;
  }
});