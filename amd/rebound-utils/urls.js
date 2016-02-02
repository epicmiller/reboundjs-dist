define("rebound-utils/urls", ["exports", "qs"], function (exports, _qs) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.query = undefined;

  var _qs2 = _interopRequireDefault(_qs);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var QS_STRINGIFY_OPTS = {
    allowDots: true,
    encode: false,
    delimiter: '&'
  };
  var QS_PARSE_OPTS = {
    allowDots: true,
    delimiter: /[;,&]/
  };
  var query = {
    stringify: function stringify(str) {
      return _qs2.default.stringify(str, QS_STRINGIFY_OPTS);
    },
    parse: function parse(obj) {
      return _qs2.default.parse(obj, QS_PARSE_OPTS);
    }
  };
  exports.query = query;
});