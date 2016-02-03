define("rebound-data/model", ["exports", "backbone", "rebound-data/computed-property", "rebound-utils/rebound-utils"], function (exports, _backbone, _computedProperty, _reboundUtils) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _backbone2 = _interopRequireDefault(_backbone);

  var _computedProperty2 = _interopRequireDefault(_computedProperty);

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

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

  function pathGenerator(parent, key) {
    return function () {
      var path = parent.__path();

      return path + (path === '' ? '' : '.') + key;
    };
  }

  var Model = _backbone2.default.Model.extend({
    isModel: true,
    isData: true,
    __path: function __path() {
      return '';
    },
    constructor: function constructor(attributes) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var self = this;

      if (attributes === null || attributes === undefined) {
        attributes = {};
      }

      attributes.isModel && (attributes = attributes.attributes);
      this.helpers = {};
      this.defaults = this.defaults || {};
      this.setParent(options.parent || this);
      this.setRoot(options.root || this);
      this.__path = options.path || this.__path;

      _reboundUtils2.default.extractComputedProps(attributes);

      _backbone2.default.Model.call(this, attributes, options);
    },
    toggle: function toggle(attr, options) {
      options = options ? _.clone(options) : {};
      var val = this.get(attr);
      if (!_.isBoolean(val)) console.error('Tried to toggle non-boolean value ' + attr + '!', this);
      return this.set(attr, !val, options);
    },
    destroy: function destroy(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;
      var wait = options.wait;

      var destroy = function destroy() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function (resp) {
        if (wait) {
          destroy();
        }

        if (success) {
          success.call(options.context, model, resp, options);
        }

        if (!model.isNew()) {
          model.trigger('sync', model, resp, options);
        }
      };

      var xhr = false;

      if (this.isNew()) {
        _.defer(options.success);
      } else {
        wrapError(this, options);
        xhr = this.sync('delete', this, options);
      }

      if (!wait) {
        destroy();
      }

      return xhr;
    },
    reset: function reset(obj, options) {
      var changed = {},
          key,
          value;
      options || (options = {});
      options.reset = true;
      obj = obj && obj.isModel && obj.attributes || obj || {};
      options.previousAttributes = _.clone(this.attributes);

      _.each(this.defaults, function (val, key) {
        if (!obj.hasOwnProperty(key)) {
          obj[key] = val;
        }
      }, this);

      for (key in this.attributes) {
        value = this.attributes[key];

        if (value === obj[key]) {
          continue;
        } else if (_.isUndefined(value) && !_.isUndefined(obj[key])) {
          changed[key] = obj[key];
        } else if (value.isComponent) {
          continue;
        } else if (value.isCollection || value.isModel || value.isComputedProperty) {
          value.reset(obj[key] || [], {
            silent: true
          });
          if (value.isCollection) changed[key] = value.previousModels;else if (value.isModel && value.isComputedProperty) changed[key] = value.cache.model.changedAttributes();else if (value.isModel) changed[key] = value.changedAttributes();
        } else if (obj.hasOwnProperty(key)) {
          changed[key] = obj[key];
        } else {
          changed[key] = undefined;
          this.unset(key, {
            silent: true
          });
        }
      }

      _.each(obj, function (val, key) {
        if (_.isUndefined(changed[key])) {
          changed[key] = val;
        }
      });

      obj = this.set(obj, _.extend({}, options, {
        silent: true,
        reset: false
      }));
      this.changed = changed;

      if (!options.silent) {
        this.trigger('reset', this, options);
      }

      return obj;
    },
    get: function get(key, options) {
      options || (options = {});

      var parts = _reboundUtils2.default.splitPath(key),
          result = this,
          i,
          l = parts.length;

      if (_.isUndefined(key) || _.isNull(key)) {
        return void 0;
      }

      if (key === '' || parts.length === 0) {
        return result;
      }

      for (i = 0; i < l; i++) {
        if (result && result.isComputedProperty && options.raw) return result;
        if (result && result.isComputedProperty) result = result.value();
        if (_.isUndefined(result) || _.isNull(result)) return result;
        if (parts[i] === '@parent') result = result.__parent__;else if (result.isCollection) result = result.models[parts[i]];else if (result.isModel) result = result.attributes[parts[i]];else if (result && result.hasOwnProperty(parts[i])) result = result[parts[i]];
      }

      if (result && result.isComputedProperty && !options.raw) result = result.value();
      return result;
    },
    set: function set(key, value, options) {
      var _this = this;

      var attrs,
          newKey,
          destination,
          props = [];

      if ((typeof key === "undefined" ? "undefined" : _typeof(key)) === 'object') {
        attrs = key.isModel ? key.attributes : key;
        options = value;
      } else (attrs = {})[key] = value;

      options || (options = {});

      _reboundUtils2.default.extractComputedProps(attrs);

      if (options.reset === true) return this.reset(attrs, options);
      if (options.defaults === true) this.defaults = attrs;

      if (_.isEmpty(attrs)) {
        return void 0;
      }

      var _loop = function _loop() {
        var val = attrs[key],
            paths = _reboundUtils2.default.splitPath(key),
            attr = paths.pop() || '',
            target = _this.get(paths.join('.')),
            lineage = undefined;

        if (_.isUndefined(target)) {
          target = _this;

          _.each(paths, function (part) {
            var tmp = target.get(part);
            if (_.isUndefined(tmp)) tmp = target.set(part, {}).get(part);
            target = tmp;
          }, _this);
        }

        destination = target.get(attr, {
          raw: true
        }) || {};
        lineage = {
          name: key,
          parent: target,
          root: _this.__root__,
          path: pathGenerator(target, attr),
          silent: true,
          defaults: options.defaults
        };
        if (_.isNull(val) || _.isUndefined(val)) val = _this.defaults[key];
        if (val && val.isComputedProperty) val = val.value();
        if (_.isNull(val) || _.isUndefined(val)) val = undefined;else if (val instanceof String) val = String(val);else if (val instanceof Number) val = Number(val);else if (val instanceof Boolean) val = Boolean(val.valueOf());else if (options.raw === true) val = val;else if (destination.isComputedProperty && destination.func === val) return "continue";else if (val.isComputedProto) val = new _computedProperty2.default(val.get, val.set, lineage);else if (val.isData && target.hasParent(val)) val = val;else if (destination.isComputedProperty || destination.isCollection && (_.isArray(val) || val.isCollection) || destination.isModel && (_.isObject(val) || val.isModel)) {
          destination.set(val, options);
          return "continue";
        } else if (val.isData && options.clone !== false) val = new val.constructor(val.attributes || val.models, lineage);else if (_.isArray(val)) val = new Rebound.Collection(val, lineage);else if (_.isObject(val)) val = new Model(val, lineage);
        _this._hasAncestry = val && val.isData || false;

        _backbone2.default.Model.prototype.set.call(target, attr, val, options);
      };

      for (key in attrs) {
        var _ret = _loop();

        if (_ret === "continue") continue;
      }

      return this;
    },
    toJSON: function toJSON() {
      if (this._isSerializing) {
        return this.id || this.cid;
      }

      this._isSerializing = true;

      var json = _.clone(this.attributes);

      _.each(json, function (value, name) {
        if (_.isNull(value) || _.isUndefined(value)) {
          return void 0;
        }

        _.isFunction(value.toJSON) && (json[name] = value.toJSON());
      });

      this._isSerializing = false;
      return json;
    }
  });

  Model.extend = function (protoProps, staticProps) {
    _reboundUtils2.default.extractComputedProps(protoProps.defaults);

    return _backbone2.default.Model.extend.call(this, protoProps, staticProps);
  };

  exports.default = Model;
});