define("rebound-component/factory", ["exports", "rebound-utils/rebound-utils", "rebound-component/component"], function (exports, _reboundUtils, _component) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ComponentFactory = undefined;
  exports.registerComponent = registerComponent;

  var _component2 = _interopRequireDefault(_component);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var REGISTRY = {};
  var DUMMY_TEMPLATE = false;
  var ELEMENT_DATA;

  function registerComponent(type) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var proto = options.prototype || {};
    delete options.prototype;
    options.type = type;
    options.isHydrated = true;

    if (REGISTRY[type] && REGISTRY[type].isHydrated) {
      return console.error('A component of type', type, 'already exists!');
    }

    if (REGISTRY[type]) {
      REGISTRY[type].hydrate(proto, options);
    } else {
      REGISTRY[type] = _component2.default.extend(proto, options);
    }

    var element = Object.create(HTMLElement.prototype, {});

    element.createdCallback = function () {
      var _this = this;

      if (this.data) {
        var current = this.data.toJSON();
        var defaults = this.data.defaults;

        for (var key in defaults) {
          if (!current.hasOwnProperty(key) && defaults.hasOwnProperty(key)) {
            this.data.set(key, defaults[key]);
          }
        }

        this.data.render();
        this.data.isHydrated = true;
        this.data.loadCallbacks.forEach(function (cb) {
          cb(_this.data);
        });
      } else if (ELEMENT_DATA) {
        this.data = new REGISTRY[type](this, ELEMENT_DATA.data, ELEMENT_DATA.options);
      } else {
        this.data = new REGISTRY[type](this);
      }

      _.isFunction(proto.createdCallback) && proto.createdCallback.call(this.data);
    };

    element.attachedCallback = function () {
      _.isFunction(proto.attachedCallback) && proto.attachedCallback.call(this.data);
    };

    element.detachedCallback = function () {
      _.isFunction(proto.detachedCallback) && proto.detachedCallback.call(this.data);
    };

    element.attributeChangedCallback = function (attrName, oldVal, newVal) {
      if (!this.data) {
        return;
      }

      this.data._onAttributeChange(attrName, oldVal, newVal);

      _.isFunction(proto.attributeChangedCallback) && proto.attributeChangedCallback.call(this.data, attrName, oldVal, newVal);
    };

    document.registerElement(type, {
      prototype: element
    });
    return REGISTRY[type];
  }

  var ComponentFactory = exports.ComponentFactory = function ComponentFactory(type) {
    var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    if (typeof type !== 'string') {
      return console.error('Invalid component type provided to createComponent. Instead received:', type);
    }

    var el;

    if (!REGISTRY[type] || !REGISTRY[type].isHydrated) {
      el = document.createElement(type);
      options.isHydrated = false;
      REGISTRY[type] = REGISTRY[type] || _component2.default.extend({}, {
        isHydrated: false,
        type: type,
        template: DUMMY_TEMPLATE
      }, options);
      el.data = new REGISTRY[type](el, data, options);
    } else {
      ELEMENT_DATA = {
        data: data,
        options: options
      };
      el = document.createElement(type);
      ELEMENT_DATA = void 0;
    }

    return el.data;
  };

  ComponentFactory.registerComponent = registerComponent;
  exports.default = ComponentFactory;
});