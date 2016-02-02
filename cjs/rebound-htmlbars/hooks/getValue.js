"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getValue;
// ### Get Value Hook

// The getValue hook retreives the value of the passed in referance.
// It will return the propper value regardless of if the referance passed is the
// value itself, or a LazyValue.
function getValue(referance) {
  return referance && referance.isLazyValue ? referance.value : referance;
}