define("rebound-data/collection", ["exports", "module", "rebound-data/model", "rebound-component/utils"], function (exports, module, _reboundDataModel, _reboundComponentUtils) {
  // Rebound Collection
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _Model = _interopRequireDefault(_reboundDataModel);

  var _$ = _interopRequireDefault(_reboundComponentUtils);

  function pathGenerator(collection) {
    return function () {
      return collection.__path() + '[' + collection.indexOf(collection._byId[this.cid]) + ']';
    };
  }

  var Collection = Backbone.Collection.extend({

    isCollection: true,
    isData: true,

    model: _Model["default"],

    __path: function __path() {
      return '';
    },

    constructor: function constructor(models, options) {
      models || (models = []);
      options || (options = {});
      this._byValue = {};
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
      var _this = this;

      // Split the path at all '.', '[' and ']' and find the value referanced.
      var parts = _.isString(key) ? _$["default"].splitPath(key) : [],
          result = this,
          l = parts.length,
          i = 0;
      options || (options = {});

      // If the key is a number or object, or just a single string that is not a path,
      // get by id and return the first occurance
      if (typeof key == 'number' || typeof key == 'object' || parts.length == 1 && !options.isPath) {
        if (key === null) return void 0;
        var id = this.modelId(this._isModel(key) ? key.attributes : key);
        var responses = [].concat(this._byValue[key], this._byId[key] || this._byId[id] || this._byId[key.cid]);
        var res = responses[0],
            idx = Infinity;

        responses.forEach(function (value) {
          if (!value) return;
          var i = _.indexOf(_this.models, value);
          if (i > -1 && i < idx) {
            idx = i;res = value;
          }
        });

        return res;
      }

      // If key is not a string, return undefined
      if (!_.isString(key)) return void 0;

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
          parts = _.isString(models) ? _$["default"].splitPath(models) : [],
          res,
          lineage = {
        parent: this,
        root: this.__root__,
        path: pathGenerator(this),
        silent: true
      };
      options = options || {},

      // If no models passed, implies an empty array
      models || (models = []);

      // If models is a string, and it has parts, call set at that path
      if (_.isString(models) && parts.length > 1 && !isNaN(Number(parts[0]))) {
        var index = Number(parts[0]);
        return this.at(index).set(parts.splice(1, parts.length).join('.'), options);
      }

      // If another collection, treat like an array
      models = models.isCollection ? models.models : models;
      // Ensure models is an array
      models = !_.isArray(models) ? [models] : models;

      // If the model already exists in this collection, or we are told not to clone it, let Backbone handle the merge
      // Otherwise, create our copy of this model, give them the same cid so our helpers treat them as the same object
      // Use the more unique of the two constructors. If our Model has a custom constructor, use that. Otherwise, use
      // Collection default Model constructor.
      _.each(models, function (data, index) {
        if (data.isModel && options.clone === false || this._byId[data.cid]) return newModels[index] = data;
        var constructor = data.constructor !== Object && data.constructor !== Rebound.Model ? data.constructor : this.model;
        newModels[index] = new constructor(data, _.defaults(lineage, options));
        data.isModel && (newModels[index].cid = data.cid);
      }, this);

      // Ensure that this element now knows that it has children now. Without this cyclic dependancies cause issues
      this._hasAncestry || (this._hasAncestry = newModels.length > 0);

      // Call original set function with model duplicates
      return Backbone.Collection.prototype.set.call(this, newModels, options);
    }

  });

  module.exports = Collection;
});