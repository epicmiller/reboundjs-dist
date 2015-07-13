// Rebound Model
// ----------------

// Rebound **Models** are the basic data object in the framework - frequently
// representing a row in a table in a database on your server. The inherit from
// Backbone Models and have all of the same useful methods you are used to for
// performing computations and transformations on that data. Rebound augments
// Backbone Models by enabling deep data nesting. You can now have **Rebound Collections**
// and **Rebound Computed Properties** as properties of the Model.

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _reboundDataComputedProperty = require("rebound-data/computed-property");

var _reboundDataComputedProperty2 = _interopRequireDefault(_reboundDataComputedProperty);

var _reboundComponentUtils = require("rebound-component/utils");

var _reboundComponentUtils2 = _interopRequireDefault(_reboundComponentUtils);

// Returns a function that, when called, generates a path constructed from its
// parent's path and the key it is assigned to. Keeps us from re-naming children
// when parents change.
function pathGenerator(parent, key) {
  return function () {
    var path = parent.__path();
    return path + (path === "" ? "" : ".") + key;
  };
}

var Model = Backbone.Model.extend({
  // Set this object's data types
  isModel: true,
  isData: true,

  // A method that returns a root path by default. Meant to be overridden on
  // instantiation.
  __path: function __path() {
    return "";
  },

  // Create a new Model with the specified attributes. The Model's lineage is set
  // up here to keep track of it's place in the data tree.
  constructor: function constructor(attributes, options) {
    attributes || (attributes = {});
    attributes.isModel && (attributes = attributes.attributes);
    options || (options = {});
    this.helpers = {};
    this.defaults = this.defaults || {};
    this.setParent(options.parent || this);
    this.setRoot(options.root || this);
    this.__path = options.path || this.__path;

    // Convert getters and setters to computed properties
    _reboundComponentUtils2["default"].extractComputedProps(attributes);

    Backbone.Model.call(this, attributes, options);
  },

  // New convenience function to toggle boolean values in the Model.
  toggle: function toggle(attr, options) {
    options = options ? _.clone(options) : {};
    var val = this.get(attr);
    if (!_.isBoolean(val)) console.error("Tried to toggle non-boolean value " + attr + "!", this);
    return this.set(attr, !val, options);
  },

  destroy: function destroy(options) {
    options = options ? _.clone(options) : {};
    var model = this;
    var success = options.success;
    var wait = options.wait;

    var destroy = function destroy() {
      model.trigger("destroy", model, model.collection, options);
    };

    options.success = function (resp) {
      if (wait) destroy();
      if (success) success.call(options.context, model, resp, options);
      if (!model.isNew()) model.trigger("sync", model, resp, options);
    };

    var xhr = false;
    if (this.isNew()) {
      _.defer(options.success);
    } else {
      wrapError(this, options);
      xhr = this.sync("delete", this, options);
    }
    if (!wait) destroy();
    return xhr;
  },

  // Model Reset does a deep reset on the data tree starting at this Model.
  // A `previousAttributes` property is set on the `options` property with the Model's
  // old values.
  reset: function reset(obj, options) {
    var changed = {},
        key,
        value;
    options || (options = {});
    options.reset = true;
    obj = obj && obj.isModel && obj.attributes || obj || {};
    options.previousAttributes = _.clone(this.attributes);

    // Iterate over the Model's attributes:
    // - If the property is the `idAttribute`, skip.
    // - If the property is a `Model`, `Collection`, or `ComputedProperty`, reset it.
    // - If the passed object has the property, set it to the new value.
    // - If the Model has a default value for this property, set it back to default.
    // - Otherwise, unset the attribute.
    for (key in this.attributes) {
      value = this.attributes[key];
      if (value === obj[key]) continue;else if (_.isUndefined(value)) obj[key] && (changed[key] = obj[key]);else if (key === this.idAttribute || value.isComponent) continue;else if (value.isCollection || value.isModel || value.isComputedProperty) {
        value.reset(obj[key] || [], { silent: true });
        if (value.isCollection) changed[key] = [];else if (value.isModel && value.isComputedProperty) changed[key] = value.cache.model.changed;else if (value.isModel) changed[key] = value.changed;
      } else if (obj.hasOwnProperty(key)) {
        changed[key] = obj[key];
      } else if (this.defaults.hasOwnProperty(key) && !_.isFunction(this.defaults[key])) {
        changed[key] = obj[key] = this.defaults[key];
      } else {
        changed[key] = undefined;
        this.unset(key, { silent: true });
      }
    }

    // Any unset changed values will be set to obj[key]
    _.each(obj, function (value, key, obj) {
      changed[key] = changed[key] || obj[key];
    });

    // Reset our model
    obj = this.set(obj, _.extend({}, options, { silent: true, reset: false }));

    // Trigger custom reset event
    this.changed = changed;
    if (!options.silent) this.trigger("reset", this, options);

    // Return new values
    return obj;
  },

  // **Model.Get** is overridden to provide support for getting from a deep data tree.
  // `key` may now be any valid json-like identifier. Ex: `obj.coll[3].value`.
  // It needs to traverse `Models`, `Collections` and `Computed Properties` to
  // find the correct value.
  // - If key is undefined, return `undefined`.
  // - If key is empty string, return `this`.
  //
  // For each part:
  // - If a `Computed Property` and `options.raw` is true, return it.
  // - If a `Computed Property` traverse to its value.
  // - If not set, return its falsy value.
  // - If a `Model`, `Collection`, or primitive value, traverse to it.
  get: function get(key, options) {
    options || (options = {});
    var parts = _reboundComponentUtils2["default"].splitPath(key),
        result = this,
        i,
        l = parts.length;

    if (_.isUndefined(key) || _.isNull(key)) return undefined;
    if (key === "" || parts.length === 0) return result;

    for (i = 0; i < l; i++) {
      if (result && result.isComputedProperty && options.raw) return result;
      if (result && result.isComputedProperty) result = result.value();
      if (_.isUndefined(result) || _.isNull(result)) return result;
      if (parts[i] === "@parent") result = result.__parent__;else if (result.isCollection) result = result.models[parts[i]];else if (result.isModel) result = result.attributes[parts[i]];else if (result && result.hasOwnProperty(parts[i])) result = result[parts[i]];
    }

    if (result && result.isComputedProperty && !options.raw) result = result.value();
    return result;
  },

  // **Model.Set** is overridden to provide support for getting from a deep data tree.
  // `key` may now be any valid json-like identifier. Ex: `obj.coll[3].value`.
  // It needs to traverse `Models`, `Collections` and `Computed Properties` to
  // find the correct value to call the original `Backbone.Set` on.
  set: function set(key, val, options) {

    var attrs,
        attr,
        newKey,
        target,
        destination,
        props = [],
        lineage;

    if (typeof key === "object") {
      attrs = key.isModel ? key.attributes : key;
      options = val;
    } else (attrs = {})[key] = val;
    options || (options = {});

    // Convert getters and setters to computed properties
    _reboundComponentUtils2["default"].extractComputedProps(attrs);

    // If reset option passed, do a reset. If nothing passed, return.
    if (options.reset === true) return this.reset(attrs, options);
    if (options.defaults === true) this.defaults = attrs;
    if (_.isEmpty(attrs)) return;

    // For each attribute passed:
    for (key in attrs) {
      var _val = attrs[key],
          paths = _reboundComponentUtils2["default"].splitPath(key),
          _attr = paths.pop() || ""; // The key        ex: foo[0].bar --> bar
      target = this.get(paths.join(".")), // The element    ex: foo.bar.baz --> foo.bar
      lineage;

      // If target currently doesnt exist, construct its tree
      if (_.isUndefined(target)) {
        target = this;
        _.each(paths, function (value) {
          var tmp = target.get(value);
          if (_.isUndefined(tmp)) tmp = target.set(value, {}).get(value);
          target = tmp;
        }, this);
      }

      // The old value of `attr` in `target`
      destination = target.get(_attr, { raw: true }) || {};

      // Create this new object's lineage.
      lineage = {
        name: key,
        parent: target,
        root: this.__root__,
        path: pathGenerator(target, key),
        silent: true,
        defaults: options.defaults
      };
      // - If val is `null` or `undefined`, set to default value.
      // - If val is a `Computed Property`, get its current cache object.
      // - If val (default value or evaluated computed property) is `null`, set to default value or (fallback `undefined`).
      // - Else If `{raw: true}` option is passed, set the exact object that was passed. No promotion to a Rebound Data object.
      // - Else If this function is the same as the current computed property, continue.
      // - Else If this value is a `Function`, turn it into a `Computed Property`.
      // - Else If this is going to be a cyclical dependancy, use the original object, don't make a copy.
      // - Else If updating an existing object with its respective data type, let Backbone handle the merge.
      // - Else If this value is a `Model` or `Collection`, create a new copy of it using its constructor, preserving its defaults while ensuring no shared memory between objects.
      // - Else If this value is an `Array`, turn it into a `Collection`.
      // - Else If this value is a `Object`, turn it into a `Model`.
      // - Else val is a primitive value, set it accordingly.

      if (_.isNull(_val) || _.isUndefined(_val)) _val = this.defaults[key];
      if (_val && _val.isComputedProperty) _val = _val.value();
      if (_.isNull(_val) || _.isUndefined(_val)) _val = undefined;else if (options.raw === true) _val = _val;else if (destination.isComputedProperty && destination.func === _val) continue;else if (_val.isComputedProto) _val = new _reboundDataComputedProperty2["default"](_val.get, _val.set, lineage);else if (_val.isData && target.hasParent(_val)) _val = _val;else if (destination.isComputedProperty || destination.isCollection && (_.isArray(_val) || _val.isCollection) || destination.isModel && (_.isObject(_val) || _val.isModel)) {
        destination.set(_val, options);
        continue;
      } else if (_val.isData && options.clone !== false) _val = new _val.constructor(_val.attributes || _val.models, lineage);else if (_.isArray(_val)) _val = new Rebound.Collection(_val, lineage); // TODO: Remove global referance
      else if (_.isObject(_val)) _val = new Model(_val, lineage);

      // If val is a data object, let this object know it is now a parent
      this._hasAncestry = _val && _val.isData || false;

      // Set the value
      Backbone.Model.prototype.set.call(target, _attr, _val, options); // TODO: Event cleanup when replacing a model or collection with another value
    }

    return this;
  },

  // Recursive `toJSON` function traverses the data tree returning a JSON object.
  // If there are any cyclic dependancies the object's `cid` is used instead of looping infinitely.
  toJSON: function toJSON() {
    if (this._isSerializing) return this.id || this.cid;
    this._isSerializing = true;
    var json = _.clone(this.attributes);
    _.each(json, function (value, name) {
      if (_.isNull(value) || _.isUndefined(value)) {
        return;
      }
      _.isFunction(value.toJSON) && (json[name] = value.toJSON());
    });
    this._isSerializing = false;
    return json;
  }

});

// If default properties are passed into extend, process the computed properties
Model.extend = function (protoProps, staticProps) {
  _reboundComponentUtils2["default"].extractComputedProps(protoProps.defaults);
  return Backbone.Model.extend.call(this, protoProps, staticProps);
};

exports["default"] = Model;
module.exports = exports["default"];