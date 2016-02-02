define("rebound-htmlbars/rebound-htmlbars", ["exports", "rebound-htmlbars/hooks"], function (exports, _hooks) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.registerPartial = exports.registerHelper = undefined;

  var _hooks2 = _interopRequireDefault(_hooks);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var registerHelper = exports.registerHelper = _hooks2.default.registerHelper;
  var registerPartial = exports.registerPartial = _hooks2.default.registerPartial;
});