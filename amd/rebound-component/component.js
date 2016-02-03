define("rebound-component/component", ["exports", "backbone", "rebound-utils/rebound-utils", "rebound-data/rebound-data", "rebound-htmlbars/render"], function (exports, _backbone, _reboundUtils, _reboundData, _render2) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _backbone2 = _interopRequireDefault(_backbone);

  var _render3 = _interopRequireDefault(_render2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
    return typeof obj;
  } : function (obj) {
    return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
  };

  var Component = _reboundData.Model.extend({
    isComponent: true,
    isHydrated: true,
    defaults: {},
    constructor: function constructor(el, data, options) {
      options || (options = {});

      _.bindAll(this, '_callOnComponent', '_listenToService');

      this.cid = _reboundUtils.$.uniqueId('component');
      this.attributes = {};
      this.changed = {};
      this.consumers = [];
      this.services = {};
      this.loadCallbacks = [];
      this.options = options;

      if (options.isHydrated === false) {
        this.isHydrated = false;
      }

      this.__parent__ = this.__root__ = this;
      this.set(this.defaults || {});
      this.set(data || {});
      this.routes = _.defaults(options.routes || {}, this.routes);

      _.each(this.routes, function (value, key, routes) {
        if (typeof value !== 'string') {
          throw 'Function name passed to routes in  ' + this.tagName + ' component must be a string!';
        }

        if (!this[value]) {
          throw 'Callback function ' + value + ' does not exist on the  ' + this.tagName + ' component!';
        }
      }, this);

      this.el = el || document.createDocumentFragment();
      this.$el = _.isFunction(_backbone2.default.$) ? _backbone2.default.$(this.el) : false;
      this.render();
      (0, _reboundUtils.$)(this.el).markLinks();
      this.initialize();
      return this;
    },
    _callOnComponent: function _callOnComponent(name, event) {
      if (!_.isFunction(this[name])) {
        throw "ERROR: No method named " + name + " on component " + this.tagName + "!";
      }

      return this[name].call(this, event);
    },
    _listenToService: function _listenToService(key, service) {
      var _this = this;

      var self = this;
      this.listenTo(service, 'all', function (type, model, value) {
        var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

        var attr,
            path = model.__path(),
            changed;

        options.service = key;

        if (type.indexOf('change:') === 0) {
          changed = model.changedAttributes();

          for (attr in changed) {
            type = 'change:' + key + '.' + path + (path && '.') + attr;

            _this.trigger.call(_this, type, model, value, options);
          }

          return void 0;
        }

        return _this.trigger.call(_this, type, model, value, options);
      });
    },
    render: function render() {
      (0, _reboundUtils.$)(this.el).empty();
      (0, _render3.default)(this.el, this[_reboundUtils.REBOUND_SYMBOL].template, this);
    },
    deinitialize: function deinitialize() {
      var _this2 = this;

      if (this.consumers.length) {
        return void 0;
      }

      _.each(this.services, function (service, key) {
        _.each(service.consumers, function (consumer, index) {
          if (consumer.component === _this2) service.consumers.splice(index, 1);
        });
      });

      delete this.services;

      _reboundData.Model.prototype.deinitialize.apply(this, arguments);
    },
    onLoad: function onLoad(cb) {
      if (!this.isHydrated) {
        this.loadCallbacks.push(cb);
      } else {
        cb(this);
      }
    },
    set: function set(key, val, options) {
      var attrs, attr, serviceOptions;

      if ((typeof key === "undefined" ? "undefined" : _typeof(key)) === 'object') {
        attrs = key.isModel ? key.attributes : key;
        options = val;
      } else (attrs = {})[key] = val;

      options || (options = {});
      if (options.reset === true) return this.reset(attrs, options);
      if (options.defaults === true) this.defaults = attrs;

      if (_.isEmpty(attrs)) {
        return void 0;
      }

      for (key in attrs) {
        attr = attrs[key];

        if (attr && attr.isComponent) {
          if (attr.isLazyComponent && attr._component) {
            attr = attr._component;
          }

          serviceOptions || (serviceOptions = _.defaults(_.clone(options), {
            raw: true
          }));
          attr.consumers.push({
            key: key,
            component: this
          });
          this.services[key] = attr;

          this._listenToService(key, attr);

          _reboundData.Model.prototype.set.call(this, key, attr, serviceOptions);
        }

        _reboundData.Model.prototype.set.call(this, key, attr, options);
      }

      return this;
    },
    $: function $(selector) {
      if (!this.$el) {
        return console.error('No DOM manipulation library on the page!');
      }

      return this.$el.find(selector);
    },
    trigger: function trigger(eventName) {
      if (this.el) {
        (0, _reboundUtils.$)(this.el).trigger(eventName, arguments);
      }

      _backbone2.default.Model.prototype.trigger.apply(this, arguments);
    },
    _onAttributeChange: function _onAttributeChange(attrName, oldVal, newVal) {}
  });

  function processProps(protoProps, staticProps) {
    var reservedMethods = {
      'trigger': 1,
      'get': 1,
      'set': 1,
      'has': 1,
      'escape': 1,
      'unset': 1,
      'clear': 1,
      'cid': 1,
      'attributes': 1,
      'hasChanged': 1,
      'changed': 1,
      'toJSON': 1,
      'isValid': 1,
      'isNew': 1,
      'validationError': 1,
      'previous': 1,
      'toggle': 1,
      'previousAttributes': 1,
      'changedAttributes': 1
    },
        configProperties = {
      'id': 1,
      'idAttribute': 1,
      'url': 1,
      'urlRoot': 1,
      'routes': 1,
      'createdCallback': 1,
      'attachedCallback': 1,
      'detachedCallback': 1,
      'attributeChangedCallback': 1,
      'defaults': 1
    };
    protoProps || (protoProps = {});
    protoProps.defaults = {};
    staticProps || (staticProps = {});
    staticProps.template || (staticProps.template = null);
    staticProps.stylesheet || (staticProps.stylesheet = '');

    _reboundUtils.$.extractComputedProps(protoProps);

    for (var key in protoProps) {
      var value = protoProps[key];

      if (!protoProps.hasOwnProperty(key)) {
        continue;
      }

      if (reservedMethods[key]) {
        throw "ERROR: " + key + " is a reserved method name in " + staticProps.type + "!";
      }

      if (!protoProps.hasOwnProperty(key) || configProperties[key]) {
        continue;
      }

      if (!_.isFunction(value) || value.isComputedProto || value.isModel || value.isComponent) {
        protoProps.defaults[key] = value;
        delete protoProps[key];
      }
    }
  }

  Component.hydrate = function hydrateComponent() {
    var protoProps = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var staticProps = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    if (this.isHydrated) {
      return void 0;
    }

    processProps(protoProps, staticProps);

    if (protoProps) {
      _.extend(this.prototype, protoProps);
    }

    if (staticProps) {
      _.extend(this, staticProps);
    }

    this.prototype[_reboundUtils.REBOUND_SYMBOL] = {
      type: staticProps.type || 'anonymous-component',
      template: staticProps.template || null,
      stylesheet: staticProps.stylesheet || '',
      isHydrated: true
    };
  };

  Component.extend = function extendComponent() {
    var protoProps = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var staticProps = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var parent = this,
        Component = function Component(type) {
      var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      return parent.call(this, type, data, options);
    },
        Surrogate = function Surrogate() {
      this.constructor = Component;
    };

    Surrogate.prototype = parent.prototype;
    Component.prototype = new Surrogate();
    Component.__super__ = parent.prototype;
    processProps(protoProps, staticProps);

    if (protoProps) {
      _.extend(Component.prototype, protoProps);
    }

    if (staticProps) {
      _.extend(Component, parent, staticProps);
    }

    Component.prototype[_reboundUtils.REBOUND_SYMBOL] = {
      type: staticProps.type || 'anonymous-component',
      template: staticProps.template || null,
      stylesheet: staticProps.stylesheet || '',
      isHydrated: staticProps.hasOwnProperty('isHydrated') ? staticProps.isHydrated : true
    };
    return Component;
  };

  exports.default = Component;
});