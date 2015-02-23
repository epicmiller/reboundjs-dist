"use strict";

var _interopRequire = function (obj) {
  return obj && (obj["default"] || obj);
};

// Rebound Computed Property
// ----------------

var propertyCompiler = _interopRequire(require("property-compiler/property-compiler"));

var $ = _interopRequire(require("rebound-component/utils"));

// Returns true if str starts with test
function startsWith(str, test) {
  if (str === test) return true;
  return str.substring(0, test.length + 1) === test + ".";
}


// Called after callstack is exausted to call all of this computed property's
// dependants that need to be recomputed
function recomputeCallback() {
  var i = 0,
      len = this._toCall.length;
  delete this._recomputeTimeout;
  for (i = 0; i < len; i++) {
    this._toCall.shift().call();
  }
  this._toCall.added = {};
}

var ComputedProperty = function (prop, options) {
  if (!_.isFunction(prop)) return console.error("ComputedProperty constructor must be passed a function!", prop, "Found instead.");
  options = options || {};
  this.cid = _.uniqueId("computedPropety");
  this.name = options.name;
  this.returnType = null;
  this.__observers = {};
  this.helpers = {};
  this.waiting = {};
  this.isChanging = false;
  this.isDirty = true;
  this.func = prop;
  _.bindAll(this, "onModify", "markDirty");
  this.deps = propertyCompiler.compile(prop, this.name);

  // Create lineage to pass to our cache objects
  var lineage = {
    parent: this.setParent(options.parent || this),
    root: this.setRoot(options.root || options.parent || this),
    path: this.__path = options.path || this.__path
  };

  // Results Cache Objects
  // These models will never be re-created for the lifetime of the Computed Proeprty
  // On Recompute they are updated with new values.
  // On Change their new values are pushed to the object it is tracking
  this.cache = {
    model: new Rebound.Model({}, lineage),
    collection: new Rebound.Collection([], lineage),
    value: undefined
  };

  this.wire();
};

_.extend(ComputedProperty.prototype, Backbone.Events, {

  isComputedProperty: true,
  isData: true,
  __path: function () {
    return "";
  },


  markDirty: function () {
    if (this.isDirty) return;
    this.isDirty = true;
    this.trigger("dirty", this);
  },

  // Attached to listen to all events where this Computed Property's dependancies
  // are stored. See wire(). Will re-evaluate any computed properties that
  // depend on the changed data value which triggered this callback.
  onRecompute: function (type, model, collection, options) {
    var shortcircuit = { change: 1, sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1, dirty: 1 };
    if (shortcircuit[type] || !model.isData) return;
    model || (model = {});
    collection || (collection = {});
    options || (options = {});
    this._toCall || (this._toCall = []);
    this._toCall.added || (this._toCall.added = {});
    !collection.isData && (options = collection) && (collection = model);
    var push = function (arr) {
      var i,
          len = arr.length;
      this.added || (this.added = {});
      for (i = 0; i < len; i++) {
        if (this.added[arr[i].cid]) continue;
        this.added[arr[i].cid] = 1;
        this.push(arr[i]);
      }
    },
        path,
        vector;
    vector = path = collection.__path().replace(/\.?\[.*\]/ig, ".@each");

    // If a reset event on a Model, check for computed properties that depend
    // on each changed attribute's full path.
    if (type === "reset" && options.previousAttributes) {
      _.each(options.previousAttributes, function (value, key) {
        vector = path + (path && ".") + key;
        _.each(this.__computedDeps, function (dependants, dependancy) {
          startsWith(vector, dependancy) && push.call(this._toCall, dependants);
        }, this);
      }, this);
    }

    // If a reset event on a Collction, check for computed properties that depend
    // on anything inside that collection.
    else if (type === "reset" && options.previousModels) {
      _.each(this.__computedDeps, function (dependants, dependancy) {
        startsWith(dependancy, vector) && push.call(this._toCall, dependants);
      }, this);
    }

    // If an add or remove event, check for computed properties that depend on
    // anything inside that collection or that contains that collection.
    else if (type === "add" || type === "remove") {
      _.each(this.__computedDeps, function (dependants, dependancy) {
        if (startsWith(dependancy, vector) || startsWith(vector, dependancy)) push.call(this._toCall, dependants);;
      }, this);
    }

    // If a change event, trigger anything that depends on that changed path.
    else if (type.indexOf("change:") === 0) {
      vector = type.replace("change:", "").replace(/\.?\[.*\]/ig, ".@each");
      _.each(this.__computedDeps, function (dependants, dependancy) {
        startsWith(vector, dependancy) && push.call(this._toCall, dependants);
      }, this);
    }

    var i,
        len = this._toCall.length;
    for (i = 0; i < len; i++) {
      this._toCall[i].markDirty();
    }

    // Notifies all computed properties in the dependants array to recompute.
    // Marks everyone as dirty and then calls them.
    if (!this._recomputeTimeout) this._recomputeTimeout = setTimeout(_.bind(recomputeCallback, this), 0);
    return;
  },


  // Called when a Computed Property's active cache object changes.
  // Pushes any changes to Computed Property that returns a data object back to
  // the original object.
  onModify: function (type, model, collection, options) {
    var shortcircuit = { sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1 };
    if (!this.tracking || shortcircuit[type] || ~type.indexOf("change:")) return;
    model || (model = {});
    collection || (collection = {});
    options || (options = {});
    !collection.isData && _.isObject(collection) && (options = collection) && (collection = model);
    var src = this;
    var path = collection.__path().replace(src.__path(), "").replace(/^\./, "");
    var dest = this.tracking.get(path);

    if (_.isUndefined(dest)) return;
    if (type === "change") dest.set && dest.set(model.changedAttributes());else if (type === "reset") dest.reset && dest.reset(model);else if (type === "add") dest.add && dest.add(model);else if (type === "remove") dest.remove && dest.remove(model);
    // TODO: Add sort
  },

  // Adds a litener to the root object and tells it what properties this
  // Computed Property depend on.
  // The listener will re-compute this Computed Property when any are changed.
  wire: function () {
    var root = this.__root__;
    var context = this.__parent__;
    root.__computedDeps || (root.__computedDeps = {});

    _.each(this.deps, function (path) {
      var dep = root.get(path, { raw: true });
      if (!dep || !dep.isComputedProperty) return;
      dep.on("dirty", this.markDirty);
    }, this);

    _.each(this.deps, function (path) {
      // Find actual path from relative paths
      var split = $.splitPath(path);
      while (split[0] === "@parent") {
        context = context.__parent__;
        split.shift();
      }

      path = context.__path().replace(/\.?\[.*\]/ig, ".@each");
      path = path + (path && ".") + split.join(".");

      // Add ourselves as dependants
      root.__computedDeps[path] || (root.__computedDeps[path] = []);
      root.__computedDeps[path].push(this);
    }, this);

    // Ensure we only have one listener per Model at a time.
    context.off("all", this.onRecompute).on("all", this.onRecompute);
  },

  // Call this computed property like you would with Function.call()
  call: function () {
    var args = Array.prototype.slice.call(arguments),
        context = args.shift();
    return this.apply(context, args);
  },

  // Call this computed property like you would with Function.apply()
  // Only properties that are marked as dirty and are not already computing
  // themselves are evaluated to prevent cyclic callbacks. If any dependants
  // aren't finished computeding, we add ourselved to their waiting list.
  // Vanilla objects returned from the function are promoted to Rebound Objects.
  // Then, set the proper return type for future fetches from the cache and set
  // the new computed value. Track changes to the cache to push it back up to
  // the original object and return the value.
  apply: function (context, params) {
    if (!this.isDirty || this.isChanging) return;
    this.isChanging = true;

    var value = this.cache[this.returnType],
        result;

    context || (context = this.__parent__);

    // Check all of our dependancies to see if they are evaluating.
    // If we have a dependancy that is dirty and this isnt its first run,
    // Let this dependancy know that we are waiting for it.
    // It will re-run this Computed Property after it finishes.
    _.each(this.deps, function (dep) {
      var dependancy = context.get(dep, { raw: true });
      if (!dependancy || !dependancy.isComputedProperty) return;
      if (dependancy.isDirty && dependancy.returnType !== null) {
        dependancy.waiting[this.cid] = this;
        dependancy.apply(); // Try to re-evaluate this dependancy if it is dirty
        if (dependancy.isDirty) return this.isChanging = false;
      }
      delete dependancy.waiting[this.cid];
      // TODO: There can be a check here looking for cyclic dependancies.
    }, this);

    if (!this.isChanging) return;

    this.stopListening(value, "all", this.onModify);

    result = this.func.apply(context, params);

    // Promote vanilla objects to Rebound Data keeping the same original objects
    if (_.isArray(result)) result = new Rebound.Collection(result, { clone: false });else if (_.isObject(result) && !result.isData) result = new Rebound.Model(result, { clone: false });

    // If result is undefined, reset our cache item
    if (_.isUndefined(result) || _.isNull(result)) {
      this.returnType = "value";
      this.isCollection = this.isModel = false;
      this.set(undefined);
    }
    // Set result and return types, bind events
    else if (result.isCollection) {
      this.returnType = "collection";
      this.isCollection = true;
      this.isModel = false;
      this.set(result);
      this.track(result);
    } else if (result.isModel) {
      this.returnType = "model";
      this.isCollection = false;
      this.isModel = true;
      this.reset(result);
      this.track(result);
    } else {
      this.returnType = "value";
      this.isCollection = this.isModel = false;
      this.reset(result);
    }

    return this.value();
  },

  // When we receive a new model to set in our cache, unbind the tracker from
  // the previous cache object, sync the objects' cids so helpers think they
  // are the same object, save a referance to the object we are tracking,
  // and re-bind our onModify hook.
  track: function (object) {
    var target = this.value();
    if (!object || !target || !target.isData || !object.isData) return;
    target._cid || (target._cid = target.cid);
    object._cid || (object._cid = object.cid);
    target.cid = object.cid;
    this.tracking = object;
    this.listenTo(target, "all", this.onModify);
  },

  // Get from the Computed Property's cache
  get: function (key, options) {
    var value = this.value();
    options || (options = {});
    if (this.returnType === "value") return console.error("Called get on the `" + this.name + "` computed property which returns a primitive value.");
    return value.get(key, options);
  },

  // Set the Computed Property's cache to a new value and trigger appropreate events.
  // Changes will propagate back to the original object if a Rebound Data Object and re-compute.
  // If Computed Property returns a value, all downstream dependancies will re-compute.
  set: function (key, val, options) {
    if (this.returnType === null) return undefined;
    options || (options = {});
    var attrs = key;
    var value = this.value();
    if (this.returnType === "model") {
      if (typeof key === "object") {
        attrs = key.isModel ? key.attributes : key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }
    }
    if (this.returnType !== "model") options = val || {};
    attrs = attrs && attrs.isComputedProperty ? attrs.value() : attrs;

    // If a new value, set it and trigger events
    if (this.returnType === "value" && this.cache.value !== attrs) {
      this.cache.value = attrs;
      if (!options.quiet) {
        // If set was called not through computedProperty.call(), this is a fresh new event burst.
        if (!this.isDirty && !this.isChanging) this.__parent__.changed = {};
        this.__parent__.changed[this.name] = attrs;
        this.trigger("change", this.__parent__);
        this.trigger("change:" + this.name, this.__parent__, attrs);
        delete this.__parent__.changed[this.name];
      }
    } else if (this.returnType !== "value" && options.reset) key = value.reset(attrs, options);else if (this.returnType !== "value") key = value.set(attrs, options);
    this.isDirty = this.isChanging = false;

    // Call all reamining computed properties waiting for this value to resolve.
    _.each(this.waiting, function (prop) {
      prop && prop.call();
    });

    return key;
  },

  // Return the current value from the cache, running if dirty.
  value: function () {
    if (this.isDirty) this.apply();
    return this.cache[this.returnType];
  },

  // Reset the current value in the cache, running if first run.
  reset: function (obj, options) {
    if (_.isNull(this.returnType)) return; // First run
    options || (options = {});
    options.reset = true;
    return this.set(obj, options);
  },

  // Cyclic dependancy safe toJSON method.
  toJSON: function () {
    if (this._isSerializing) return this.cid;
    var val = this.value();
    this._isSerializing = true;
    var json = val && _.isFunction(val.toJSON) ? val.toJSON() : val;
    this._isSerializing = false;
    return json;
  }

});

module.exports = ComputedProperty;