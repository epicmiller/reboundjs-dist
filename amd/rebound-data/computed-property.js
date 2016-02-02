define("rebound-data/computed-property", ["exports", "backbone", "property-compiler/property-compiler", "rebound-utils/rebound-utils"], function (exports, _backbone, _propertyCompiler, _reboundUtils) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _backbone2 = _interopRequireDefault(_backbone);

  var _propertyCompiler2 = _interopRequireDefault(_propertyCompiler);

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

  var NOOP = function NOOP() {
    return void 0;
  };

  var TO_CALL = [];
  var CALL_TIMEOUT;

  function startsWith(str, test) {
    if (str === test) {
      return true;
    }

    return str.substring(0, test.length + 1) === test + '.';
  }

  function push(arr) {
    var i,
        len = arr.length;
    this.added || (this.added = {});

    for (i = 0; i < len; i++) {
      arr[i].markDirty();
      if (this.added[arr[i].cid]) continue;
      this.added[arr[i].cid] = 1;
      this.push(arr[i]);
    }
  }

  function recomputeCallback() {
    var len = TO_CALL.length;
    CALL_TIMEOUT = null;

    while (len--) {
      (TO_CALL.shift() || NOOP).call();
    }

    TO_CALL.added = {};
  }

  var ComputedProperty = function ComputedProperty(getter, setter) {
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    if (!_.isFunction(getter) && !_.isFunction(setter)) {
      return console.error('ComputedProperty constructor must be passed getter and setter functions!', getter, 'and', setter, 'Found instead.');
    }

    this.cid = _reboundUtils2.default.uniqueId('computedPropety');
    this.name = options.name;
    this.returnType = null;
    this.waiting = {};
    this.isChanging = false;
    this.isDirty = true;

    _.bindAll(this, 'onModify', 'markDirty');

    if (getter) {
      this.getter = getter;
    }

    if (setter) {
      this.setter = setter;
    }

    this.deps = _propertyCompiler2.default.compile(this.getter, this.name);
    var lineage = {
      parent: this.setParent(options.parent || this),
      root: this.setRoot(options.root || options.parent || this),
      path: this.__path = options.path || this.__path
    };
    this.cache = {
      model: new Rebound.Model({}, lineage),
      collection: new Rebound.Collection([], lineage),
      value: undefined
    };
    this.listenTo(this.cache.model, 'all', this.onModify);
    this.listenTo(this.cache.collection, 'all', this.onModify);
    this.wire();
  };

  _.extend(ComputedProperty.prototype, _backbone2.default.Events, {
    isComputedProperty: true,
    isData: true,
    __path: function __path() {
      return '';
    },
    getter: NOOP,
    setter: NOOP,
    markDirty: function markDirty() {
      if (this.isDirty) {
        return void 0;
      }

      this.isDirty = true;
      this.trigger('dirty', this);
    },
    onRecompute: function onRecompute(type, model, collection, options) {
      var shortcircuit = {
        change: 1,
        sort: 1,
        request: 1,
        destroy: 1,
        sync: 1,
        error: 1,
        invalid: 1,
        route: 1,
        dirty: 1
      };

      if (shortcircuit[type] || !model.isData) {
        return void 0;
      }

      model || (model = {});
      collection || (collection = {});
      options || (options = {});
      !collection.isData && (options = collection) && (collection = model);
      var path, vector;
      vector = path = (options.service ? options.service + "." : '') + collection.__path().replace(/\.?\[.*\]/ig, '.@each');

      if (type === 'reset' && options.previousAttributes) {
        _.each(options.previousAttributes, function (value, key) {
          vector = path + (path && '.') + key;

          _.each(this.__computedDeps, function (dependants, dependancy) {
            startsWith(vector, dependancy) && push.call(TO_CALL, dependants);
          }, this);
        }, this);
      } else if (type === 'reset' && options.previousModels) {
        _.each(this.__computedDeps, function (dependants, dependancy) {
          startsWith(dependancy, vector) && push.call(TO_CALL, dependants);
        }, this);
      } else if (type === 'add' || type === 'remove') {
        _.each(this.__computedDeps, function (dependants, dependancy) {
          if (startsWith(dependancy, vector) || startsWith(vector, dependancy)) push.call(TO_CALL, dependants);
        }, this);
      } else if (type.indexOf('change:') === 0) {
        vector = type.replace('change:', '').replace(/\.?\[.*\]/ig, '.@each');

        _.each(this.__computedDeps, function (dependants, dependancy) {
          startsWith(vector, dependancy) && push.call(TO_CALL, dependants);
        }, this);
      }

      if (!CALL_TIMEOUT) {
        CALL_TIMEOUT = setTimeout(_.bind(recomputeCallback, this), 0);
      }
    },
    onModify: function onModify(type) {
      var model = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      var collection = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
      var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
      var shortcircuit = {
        sort: 1,
        request: 1,
        destroy: 1,
        sync: 1,
        error: 1,
        invalid: 1,
        route: 1
      };

      if (this.isChanging || !this.tracking || shortcircuit[type] || ~type.indexOf('change:')) {
        return void 0;
      }

      !collection.isData && _.isObject(collection) && (options = collection) && (collection = model);

      var path = collection.__path().replace(this.__path(), '').replace(/^\./, '');

      var dest = this.tracking.get(path, {
        raw: true,
        isPath: true
      });

      if (_.isUndefined(dest)) {
        return void 0;
      }

      if (type === 'change' && model.changedAttributes()) {
        dest.set && dest.set(model.changedAttributes());
      } else if (type === 'reset') {
        dest.reset && dest.reset(model);
      } else if (type === 'update') {
        dest.set && dest.set(model);
      } else if (type === 'add') {
        dest.add && dest.add(model);
      } else if (type === 'remove') {
        dest.remove && dest.remove(model);
      }
    },
    wire: function wire() {
      var root = this.__root__;
      var context = this.__parent__;
      root.__computedDeps || (root.__computedDeps = {});

      _.each(this.deps, function (path) {
        var dep = root.get(path, {
          raw: true,
          isPath: true
        });

        if (dep && dep.isComputedProperty) {
          dep.on('dirty', this.markDirty);
        }

        var split = _reboundUtils2.default.splitPath(path);

        while (split[0] === '@parent') {
          context = context.__parent__;
          split.shift();
        }

        path = context.__path().replace(/\.?\[.*\]/ig, '.@each');
        path = path + (path && '.') + split.join('.');
        root.__computedDeps[path] || (root.__computedDeps[path] = []);

        root.__computedDeps[path].push(this);
      }, this);

      context.off('all', this.onRecompute).on('all', this.onRecompute);
    },
    unwire: function unwire() {
      var root = this.__root__;
      var context = this.__parent__;

      _.each(this.deps, function (path) {
        var dep = root.get(path, {
          raw: true,
          isPath: true
        });

        if (!dep || !dep.isComputedProperty) {
          return void 0;
        }

        dep.off('dirty', this.markDirty);
      }, this);

      context.off('all', this.onRecompute);
    },
    call: function call() {
      var args = Array.prototype.slice.call(arguments),
          context = args.shift();
      return this.apply(context, args);
    },
    apply: function apply(context, params) {
      context || (context = this.__parent__);

      if (!this.isDirty || this.isChanging || !context) {
        return void 0;
      }

      this.isChanging = true;

      _.each(this.deps, function (dep) {
        var dependancy = context.get(dep, {
          raw: true,
          isPath: true
        });

        if (!dependancy || !dependancy.isComputedProperty) {
          return void 0;
        }

        if (dependancy.isDirty && dependancy.returnType !== null) {
          dependancy.waiting[this.cid] = this;
          dependancy.apply();

          if (dependancy.isDirty) {
            return this.isChanging = false;
          }
        }

        delete dependancy.waiting[this.cid];
      }, this);

      if (!this.isChanging) {
        return void 0;
      }

      var result = this.getter.apply(context, params);
      var value = this.cache[this.returnType];

      if (_.isArray(result)) {
        result = new Rebound.Collection(result, {
          clone: false
        });
      } else if (_.isObject(result) && !result.isData) {
        result = new Rebound.Model(result, {
          clone: false
        });
      }

      if (_.isUndefined(result) || _.isNull(result)) {
        this.returnType = 'value';
        this.isCollection = this.isModel = false;
        this.set(undefined);
      } else if (result.isCollection) {
        this.returnType = 'collection';
        this.isCollection = true;
        this.isModel = false;
        this.set(result);
        this.track(result);
      } else if (result.isModel) {
        this.returnType = 'model';
        this.isCollection = false;
        this.isModel = true;
        this.reset(result);
        this.track(result);
      } else {
        this.returnType = 'value';
        this.isCollection = this.isModel = false;
        this.set(result);
      }

      return this.value();
    },
    track: function track(object) {
      var target = this.value();

      if (!object || !target || !target.isData || !object.isData) {
        return void 0;
      }

      target._cid || (target._cid = target.cid);
      object._cid || (object._cid = object.cid);
      target.cid = object.cid;
      this.tracking = object;
    },
    get: function get(key) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (this.returnType === 'value') {
        return console.error('Called get on the `' + this.name + '` computed property which returns a primitive value.');
      }

      return this.value().get(key, options);
    },
    set: function set(key, val) {
      var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

      if (this.returnType === null) {
        return void 0;
      }

      var attrs = key;
      var value = this.value();

      if (this.returnType === 'model') {
        if ((typeof key === "undefined" ? "undefined" : _typeof(key)) === 'object') {
          attrs = key.isModel ? key.attributes : key;
          options = val || {};
        } else {
          (attrs = {})[key] = val;
        }
      }

      if (this.returnType !== 'model') {
        options = val || {};
      }

      attrs = attrs && attrs.isComputedProperty ? attrs.value() : attrs;
      this.setter && this.setter.call(this.__root__, attrs);

      if (this.returnType === 'value' && this.cache.value !== attrs) {
        this.cache.value = attrs;

        if (!options.quiet) {
          if (!this.isDirty && !this.isChanging) this.__parent__.changed = {};
          this.__parent__.changed[this.name] = attrs;
          this.trigger('change', this.__parent__);
          this.trigger('change:' + this.name, this.__parent__, attrs);
          delete this.__parent__.changed[this.name];
        }
      } else if (this.returnType !== 'value' && options.reset) {
        key = value.reset(attrs, options);
      } else if (this.returnType !== 'value') {
        key = value.set(attrs, options);
      }

      this.isDirty = this.isChanging = false;

      _.each(this.waiting, function (prop) {
        prop && prop.call();
      });

      return key;
    },
    value: function value() {
      if (this.isDirty) {
        this.apply();
      }

      return this.cache[this.returnType];
    },
    reset: function reset(obj) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      if (_.isNull(this.returnType)) {
        return void 0;
      }

      options.reset = true;
      return this.set(obj, options);
    },
    toJSON: function toJSON() {
      if (this._isSerializing) {
        return this.cid;
      }

      var val = this.value();
      this._isSerializing = true;
      var json = val && _.isFunction(val.toJSON) ? val.toJSON() : val;
      this._isSerializing = false;
      return json;
    }
  });

  exports.default = ComputedProperty;
});