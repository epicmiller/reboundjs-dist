"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = bindScope;
// ### Bind-Scope Hook

// Make scope available on the environment object to allow hooks to cache streams on it.
function bindScope(env, scope) {
  env.scope = scope;
}