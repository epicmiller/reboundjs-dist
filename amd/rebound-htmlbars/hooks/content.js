define('rebound-htmlbars/hooks/content', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = content;

  function content(morph, env, context, path, lazyValue) {
    var el = morph.contextualElement;

    if (el.tagName === 'TEXTAREA') {
      lazyValue.onNotify(function updateTextarea(lazyValue) {
        el.value = lazyValue.value;
      });
      $(el).on('change keyup', function updateTextareaLazyValue(event) {
        lazyValue.set(lazyValue.path, this.value);
      });
    }

    morph.lazyValue = lazyValue;
    return lazyValue.value;
  }
});