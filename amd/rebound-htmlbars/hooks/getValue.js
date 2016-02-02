define("rebound-htmlbars/hooks/getValue", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = getValue;

  function getValue(referance) {
    return referance && referance.isLazyValue ? referance.value : referance;
  }
});