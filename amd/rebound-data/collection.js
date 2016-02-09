define("rebound-data/collection", ["exports", "backbone", "rebound-data/model", "rebound-utils/rebound-utils"], function (exports, _backbone, _model, _reboundUtils) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _backbone2 = _interopRequireDefault(_backbone);

  var _model2 = _interopRequireDefault(_model);

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

  function pathGenerator(collection) {
    return function () {
      return collection.__path() + '[' + collection.indexOf(collection._byId[this.cid]) + ']';
    };
  }

  var Collection = _backbone2.default.Collection.extend({
    isCollection: true,
    isData: true,
    model: _model2.default,
    __path: function __path() {
      return '';
    },
    constructor: function constructor(models, options) {
      models || (models = []);
      options || (options = {});
      this._byValue = {};
      this.helpers = {};
      this.cid = _reboundUtils2.default.uniqueId('collection');
      this.setParent(options.parent || this);
      this.setRoot(options.root || this);
      this.__path = options.path || this.__path;

      _backbone2.default.Collection.apply(this, arguments);

      this.on('remove', function (model, collection, options) {});
    },
    modelId: function modelId() {
      var model = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var idAttribute = model.idAttribute || this.model.prototype.idAttribute || 'id';

      if (data.isData) {
        return data.get(idAttribute);
      }

      _reboundUtils2.default.splitPath(idAttribute).forEach(function (val, key) {
        if (!_.isObject(data)) {
          return;
        }

        data = data.isData ? data.get(val) : data[val];
      });

      return data;
    },
    _addReference: function _addReference(model, options) {
      this._byId[model.cid] = model;
      var id = this.modelId(model, model);

      if (id != null) {
        this._byId[id] = model;
      }

      model.on('all', this._onModelEvent, this);
    },
    _removeReference: function _removeReference(model, options) {
      delete this._byId[model.cid];
      var id = this.modelId(model, model);

      if (id != null) {
        delete this._byId[id];
      }

      if (this === model.collection) {
        delete model.collection;
      }

      model.off('all', this._onModelEvent, this);
    },
    _onModelEvent: function _onModelEvent(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);

      if (event === 'change') {
        var prevId = this.modelId(model, model.previousAttributes());
        var id = this.modelId(model, model);

        if (prevId !== id) {
          if (prevId != null) {
            delete this._byId[prevId];
          }

          if (id != null) {
            this._byId[id] = model;
          }
        }
      }

      this.trigger.apply(this, arguments);
    },
    get: function get(key, options) {
      var _this = this;

      var parts = _.isString(key) ? _reboundUtils2.default.splitPath(key) : [],
          result = this,
          l = parts.length,
          i = 0;
      options || (options = {});

      if (typeof key == 'number' || (typeof key === "undefined" ? "undefined" : _typeof(key)) == 'object' || parts.length == 1 && !options.isPath) {
        if (key === null) {
          return void 0;
        }

        var id = this.modelId(key, key);
        var responses = [].concat(this._byValue[key], this._byId[key] || this._byId[id] || this._byId[key.cid]);
        var res = responses[0],
            idx = Infinity;
        responses.forEach(function (value) {
          if (!value) {
            return void 0;
          }

          var i = _.indexOf(_this.models, value);

          if (i > -1 && i < idx) {
            idx = i;
            res = value;
          }
        });
        return res;
      }

      if (!_.isString(key)) {
        return void 0;
      }

      if (_.isUndefined(key) || _.isNull(key)) {
        return key;
      }

      if (key === '' || parts.length === 0) {
        return result;
      }

      if (parts.length > 0) {
        for (i = 0; i < l; i++) {
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
          parts = _.isString(models) ? _reboundUtils2.default.splitPath(models) : [],
          res,
          lineage = {
        parent: this,
        root: this.__root__,
        path: pathGenerator(this),
        silent: true
      };
      options = options || {}, models || (models = []);

      if (_.isString(models) && parts.length > 1 && !isNaN(Number(parts[0]))) {
        var index = Number(parts[0]);
        return this.at(index).set(parts.splice(1, parts.length).join('.'), options);
      }

      models = models.isCollection ? models.models : models;
      models = !_.isArray(models) ? [models] : models;

      _.each(models, function (data, index) {
        if (data.isModel && options.clone === false || this._byId[data.cid]) return newModels[index] = data;
        var constructor = data.constructor !== Object && data.constructor !== Rebound.Model ? data.constructor : this.model;
        newModels[index] = new constructor(data, _.defaults(lineage, options));
        data.isModel && (newModels[index].cid = data.cid);
      }, this);

      this._hasAncestry || (this._hasAncestry = newModels.length > 0);
      return _backbone2.default.Collection.prototype.set.call(this, newModels, options);
    }
  });

  exports.default = Collection;
});