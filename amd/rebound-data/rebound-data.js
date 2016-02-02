define("rebound-data/rebound-data", ["exports", "rebound-data/model", "rebound-data/collection", "rebound-data/computed-property", "rebound-utils/rebound-utils"], function (exports, _model, _collection, _computedProperty, _reboundUtils) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.ComputedProperty = exports.Collection = exports.Model = undefined;

  var _model2 = _interopRequireDefault(_model);

  var _collection2 = _interopRequireDefault(_collection);

  var _computedProperty2 = _interopRequireDefault(_computedProperty);

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var sharedMethods = {
    propagateEvent: function propagateEvent(type, model) {
      if (this.__parent__ === this || type === 'dirty') {
        return void 0;
      }

      if (type.indexOf('change:') === 0 && model.isModel) {
        if (this.isCollection && ~type.indexOf('change:[')) {
          return void 0;
        }

        var key,
            path = model.__path().replace(this.__parent__.__path(), '').replace(/^\./, ''),
            changed = model.changedAttributes();

        for (key in changed) {
          arguments[0] = 'change:' + path + (path && '.') + key;

          this.__parent__.trigger.apply(this.__parent__, arguments);
        }

        return void 0;
      }

      return this.__parent__.trigger.apply(this.__parent__, arguments);
    },
    setParent: function setParent(parent) {
      if (this.__parent__) {
        this.off('all', this.propagateEvent);
      }

      this.__parent__ = parent;
      this._hasAncestry = true;

      if (parent !== this) {
        this.on('all', this.__parent__.propagateEvent);
      }

      return parent;
    },
    setRoot: function setRoot(root) {
      var obj = this;
      obj.__root__ = root;
      var val = obj.models || obj.attributes || obj.cache;

      _.each(val, function (value, key) {
        if (value && value.isData) {
          value.setRoot(root);
        }
      });

      return root;
    },
    hasParent: function hasParent(obj) {
      var tmp = this;

      while (tmp !== obj) {
        tmp = tmp.__parent__;
        if (_.isUndefined(tmp)) return false;
        if (tmp === obj) return true;
        if (tmp.__parent__ === tmp) return false;
      }

      return true;
    },
    deinitialize: function deinitialize() {
      var _this = this;

      if (this.undelegateEvents) {
        this.undelegateEvents();
      }

      if (this.stopListening) {
        this.stopListening();
      }

      if (this.off) {
        this.off();
      }

      if (this.unwire) {
        this.unwire();
      }

      delete this.__parent__;
      delete this.__root__;
      delete this.__path;

      if (this.el) {
        _.each(this.el.__listeners, function (handler, eventType) {
          if (this.el.removeEventListener) {
            this.el.removeEventListener(eventType, handler, false);
          }

          if (this.el.detachEvent) {
            this.el.detachEvent('on' + eventType, handler);
          }
        }, this);

        (0, _reboundUtils2.default)(this.el).walkTheDOM(function (el) {
          if (el.__lazyValue && el.__lazyValue.destroy()) {
            n.__lazyValue.destroy();
          }
        });
        delete this.el.__listeners;
        delete this.el.__events;
        delete this.$el;
        delete this.el;
      }

      delete this.__observers;
      this.deinitialized = true;

      _.each(this.models, function (val) {
        val && val.deinitialize && val.deinitialize();
      });

      this.models && (this.models.length = 0);

      _.each(this.attributes, function (val, key) {
        delete _this.attributes[key];
        val && !val.isComponent && val.deinitialize && val.deinitialize();
      });

      if (this.cache) {
        this.cache.collection.deinitialize();
        this.cache.model.deinitialize();
      }
    }
  };

  _.extend(_model2.default.prototype, sharedMethods);

  _.extend(_collection2.default.prototype, sharedMethods);

  _.extend(_computedProperty2.default.prototype, sharedMethods);

  exports.Model = _model2.default;
  exports.Collection = _collection2.default;
  exports.ComputedProperty = _computedProperty2.default;
  exports.default = {
    Model: _model2.default,
    Collection: _collection2.default,
    ComputedProperty: _computedProperty2.default
  };
});