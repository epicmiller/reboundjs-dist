define('rebound-htmlbars/lazy-value', ['exports', 'rebound-utils/rebound-utils'], function (exports, _reboundUtils) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var NIL = function NIL() {},
      EMPTY_ARRAY = [];

  var LAZYVALUE_COUNT = 0;

  function LazyValue(fn) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    this.cid = _reboundUtils2.default.uniqueId('lazyValue');
    this.valueFn = fn;
    this.cache = NIL;
    this.context = options.context || null;
    this.children = [];
    this.hash = {};
    this.subscribers = [];
    this.observers = [];
    this.referance = 0;

    _.extend(this, options);

    _.each(options.params, function (param, index) {
      param || (param = '');
      this.children.push(param);
      param.isLazyValue && param.onNotify(this);
    }, this);

    _.each(options.hash, function (value, key) {
      value || (value = '');
      value.isLazyValue && value.onNotify(this);
      this.hash[key] = value;
    }, this);
  }

  LazyValue.prototype = {
    isLazyValue: true,

    get value() {
      if (this.cache !== NIL) {
        return this.cache;
      }

      var params = new Array(this.children.length),
          hash = {};

      for (var i = 0, l = this.children.length; i < l; i++) {
        var child = this.children[i];
        params[i] = child && child.isLazyValue ? child.value : child;
      }

      for (var key in this.hash) {
        if (!this.hash.hasOwnProperty(key)) {
          continue;
        }

        var child = this.hash[key];
        hash[key] = child && child.isLazyValue ? child.value : child;
      }

      return this.cache = this.valueFn(params, hash);
    },

    set: function set(key, value, options) {
      return this.context && this.context.set(key, value, options) || null;
    },
    addObserver: function addObserver(path, context, env) {
      if (!_.isObject(context) || !_.isString(path)) {
        return console.error('Error adding observer for', context, path);
      }

      path = path.trim();

      var origin = context.__path().replace(/\[[^\]]+\]/g, ".@each").trim();

      var cache = env.observers[origin] || (env.observers[origin] = {});
      cache[path] || (cache[path] = []);
      var position = cache[path].push(this) - 1;
      this.observers.push({
        env: env,
        origin: origin,
        path: path,
        index: position
      });
      return this;
    },
    makeDirty: function makeDirty() {
      if (this.cache === NIL) {
        return void 0;
      }

      this.cache = NIL;

      for (var i = 0, l = this.subscribers.length; i < l; i++) {
        this.subscribers[i].isLazyValue && this.subscribers[i].makeDirty();
      }
    },
    notify: function notify() {
      this.makeDirty();

      for (var i = 0, l = this.subscribers.length; i < l; i++) {
        if (!this.subscribers[i]) {
          continue;
        } else if (this.subscribers[i].isLazyValue) {
          this.subscribers[i].destroyed ? this.subscribers[i] = void 0 : this.subscribers[i].notify();
        } else {
          this.subscribers[i](this);
        }
      }
    },
    onNotify: function onNotify(callback) {
      this.subscribers.push(callback);
      this.referance++;
      return this;
    },
    destroy: function destroyLazyValue() {
      this.destroyed = true;

      _.each(this.children, function (child) {
        if (!child || !child.isLazyValue) {
          return void 0;
        }

        if (--child.referance === 0) {
          child.destroy();
        }
      });

      _.each(this.hash, function (child) {
        if (!child || !child.isLazyValue) {
          return void 0;
        }

        if (--child.referance === 0) {
          child.destroy();
        }
      });

      this.subscribers = [];
      this.valueFn = NIL;
      this.cache = NIL;
      this.children = [];
      this.cache = {};

      _.each(this.observers, function (observer) {
        if (observer.env.observers[observer.origin] && observer.env.observers[observer.origin][observer.path]) {
          delete observer.env.observers[observer.origin][observer.path][observer.index];
        }

        delete observer.env;
      });

      this.observers = null;
    }
  };
  exports.default = LazyValue;
});