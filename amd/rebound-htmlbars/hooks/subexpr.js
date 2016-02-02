define("rebound-htmlbars/hooks/subexpr", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = subexpr;

  function subexpr(env, scope, helperName, params, hash) {
    var helper = this.lookupHelper(helperName, env);

    if (helper) {
      return this.invokeHelper(null, env, scope, null, params, hash, helper, {}, undefined);
    }

    return this.get(env, scope, helperName);
  }
});