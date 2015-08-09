// Rebound Collection
// ----------------

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _reboundDataModel = require("rebound-data/model");

var _reboundDataModel2 = _interopRequireDefault(_reboundDataModel);

var _reboundComponentUtils = require("rebound-component/utils");

var _reboundComponentUtils2 = _interopRequireDefault(_reboundComponentUtils);

function pathGenerator(collection) {
  return function () {
    return collection.__path() + '[' + collection.indexOf(collection._byId[this.cid]) + ']';
  };
}

var Collection = Backbone.Collection.extend({

  isCollection: true,
  isData: true,

  model: _reboundDataModel2["default"],

  __path: function __path() {
    return '';
  },

  constructor: function constructor(models, options) {
    models || (models = []);
    options || (options = {});
    this.__observers = {};
    this.helpers = {};
    this.cid = _.uniqueId('collection');

    // Set lineage
    this.setParent(options.parent || this);
    this.setRoot(options.root || this);
    this.__path = options.path || this.__path;

    Backbone.Collection.apply(this, arguments);

    // When a model is removed from its original collection, destroy it
    // TODO: Fix this. Computed properties now somehow allow collection to share a model. They may be removed from one but not the other. That is bad.
    // The clone = false options is the culprit. Find a better way to copy all of the collections custom attributes over to the clone.
    this.on('remove', function (model, collection, options) {
      // model.deinitialize();
    });
  },

  get: function get(key, options) {

    // If the key is a number or object, default to backbone's collection get
    if (typeof key == 'number' || typeof key == 'object') {
      return Backbone.Collection.prototype.get.call(this, key);
    }

    // If key is not a string, return undefined
    if (!_.isString(key)) return void 0;

    // Split the path at all '.', '[' and ']' and find the value referanced.
    var parts = _reboundComponentUtils2["default"].splitPath(key),
        result = this,
        l = parts.length,
        i = 0;
    options || (options = {});

    if (_.isUndefined(key) || _.isNull(key)) return key;
    if (key === '' || parts.length === 0) return result;

    if (parts.length > 0) {
      for (i = 0; i < l; i++) {
        // If returning raw, always return the first computed property found. If undefined, you're done.
        if (result && result.isComputedProperty && options.raw) return result;
        if (result && result.isComputedProperty) result = result.value();
        if (_.isUndefined(result) || _.isNull(result)) return result;
        if (parts[i] === '@parent') result = result.__parent__;else if (result.isCollection) result = result.models[parts[i]];else if (result.isModel) result = result.attributes[parts[i]];else if (result.hasOwnProperty(parts[i])) result = result[parts[i]];
      }
    }

    if (result && result.isComputedProperty && !options.raw) result = result.value();

    return result;
  },

  set: function set(models, options) {
    var newModels = [],
        lineage = {
      parent: this,
      root: this.__root__,
      path: pathGenerator(this),
      silent: true
    };
    options = options || {},

    // If no models passed, implies an empty array
    models || (models = []);

    // If models is a string, call set at that path
    if (_.isString(models)) return this.get(_reboundComponentUtils2["default"].splitPath(models)[0]).set(_reboundComponentUtils2["default"].splitPath(models).splice(1, models.length).join('.'), options);
    if (!_.isObject(models)) return console.error('Collection.set must be passed a Model, Object, array or Models and Objects, or another Collection');

    // If another collection, treat like an array
    models = models.isCollection ? models.models : models;
    // Ensure models is an array
    models = !_.isArray(models) ? [models] : models;

    // If the model already exists in this collection, or we are told not to clone it, let Backbone handle the merge
    // Otherwise, create our copy of this model, give them the same cid so our helpers treat them as the same object
    _.each(models, function (data, index) {
      if (data.isModel && options.clone === false || this._byId[data.cid]) return newModels[index] = data;
      newModels[index] = new this.model(data, _.defaults(lineage, options));
      data.isModel && (newModels[index].cid = data.cid);
    }, this);

    // Ensure that this element now knows that it has children now. Without this cyclic dependancies cause issues
    this._hasAncestry || (this._hasAncestry = newModels.length > 0);

    // Call original set function with model duplicates
    return Backbone.Collection.prototype.set.call(this, newModels, options);
  }

});

exports["default"] = Collection;
module.exports = exports["default"];