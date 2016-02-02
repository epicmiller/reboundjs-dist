define("compiler", ["exports", "runtime", "rebound-compiler/compile"], function (exports, _runtime, _compile) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var Rebound = _interopRequireWildcard(_runtime);

  var _compile2 = _interopRequireDefault(_compile);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};

      if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }

      newObj.default = obj;
      return newObj;
    }
  }

  Rebound.compiler = _compile2.default;
  exports.default = Rebound;
});