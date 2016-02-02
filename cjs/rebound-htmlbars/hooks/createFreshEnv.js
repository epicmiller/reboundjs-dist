"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createFreshEnv;

var _domHelper = require("dom-helper");

var _domHelper2 = _interopRequireDefault(_domHelper);

var _helpers = require("rebound-htmlbars/helpers");

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ### Create-Fresh-Environment Hook

// Rebound's default environment
// The application environment is propagated down each render call and
// augmented with helpers as it goes

var DOMHelper = _domHelper2.default.default || _domHelper2.default; // Fix for stupid Babel imports

function createFreshEnv() {
  return {
    isReboundEnv: true,
    cid: _.uniqueId('env'),
    root: null,
    helpers: _helpers2.default,
    hooks: this,
    dom: new DOMHelper(),
    revalidateQueue: {},
    observers: {}
  };
}