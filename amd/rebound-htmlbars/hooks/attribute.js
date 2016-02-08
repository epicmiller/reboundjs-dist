define("rebound-htmlbars/hooks/attribute", ["exports", "rebound-utils/rebound-utils"], function (exports, _reboundUtils) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = attribute;

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var TEXT_INPUTS = {
    "null": 1,
    text: 1,
    email: 1,
    password: 1,
    search: 1,
    url: 1,
    tel: 1,
    hidden: 1,
    number: 1,
    color: 1,
    date: 1,
    datetime: 1,
    month: 1,
    range: 1,
    time: 1,
    week: 1,
    "datetime-local": 1
  };
  var BOOLEAN_INPUTS = {
    checkbox: 1,
    radio: 1
  };

  function isNumeric(val) {
    return val && !isNaN(Number(val)) && (!_.isString(val) || _.isString(val) && val[val.length - 1] !== '.');
  }

  function attribute(attrMorph, env, scope, name, value) {
    var val = value.isLazyValue ? value.value : value,
        el = attrMorph.element,
        tagName = el.tagName,
        type = el.getAttribute("type"),
        cursor = false;

    if (tagName === 'INPUT' && type === 'number' && name === 'value') {
      if (!attrMorph.eventsBound) {
        (0, _reboundUtils2.default)(el).on('change input propertychange', function (event) {
          var val = this.value;
          val = isNumeric(val) ? Number(val) : undefined;
          value.set(value.path, val);
        });
        attrMorph.eventsBound = true;
      }

      if (!el.value && !val) {
        return;
      } else {
        el.value = isNumeric(val) ? Number(val) : '';
      }
    } else if (tagName === 'INPUT' && TEXT_INPUTS[type] && name === 'value') {
      if (!attrMorph.eventsBound) {
        (0, _reboundUtils2.default)(el).on('change input propertychange', function (event) {
          value.set(value.path, this.value);
        });
        attrMorph.eventsBound = true;
      }

      if (el.value !== val) {
        if (el === document.activeElement) {
          try {
            cursor = el.selectionStart;
          } catch (e) {}
        }

        el.value = val ? String(val) : '';
        cursor !== false && el.setSelectionRange(cursor, cursor);
      }
    } else if (tagName === 'INPUT' && BOOLEAN_INPUTS[type] && name === 'checked') {
      if (!attrMorph.eventsBound) {
        (0, _reboundUtils2.default)(el).on('change propertychange', function (event) {
          value.set(value.path, this.checked ? true : false);
        });
        attrMorph.eventsBound = true;
      }

      el.checked = val ? true : undefined;
    } else if (tagName === 'A' && name === 'class' && el.active) {
      val = val ? String(val) + ' active' : 'active';
    }

    val ? el.setAttribute(name, String(val)) : el.removeAttribute(name);
    this.linkRenderNode(attrMorph, env, scope, '@attribute', [value], {});
  }
});