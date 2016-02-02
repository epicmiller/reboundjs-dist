define("rebound-htmlbars/hooks/createFreshScope", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = createFreshScope;

  function createFreshScope() {
    return {
      level: 1,
      self: null,
      locals: {},
      localPresent: {},
      streams: {}
    };
  }
});