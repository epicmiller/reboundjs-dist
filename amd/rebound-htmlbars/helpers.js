define("rebound-htmlbars/helpers", ["exports", "rebound-utils/rebound-utils", "rebound-htmlbars/lazy-value"], function (exports, _reboundUtils, _lazyValue) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.hasHelper = hasHelper;
  exports.lookupHelper = lookupHelper;
  exports.registerHelper = registerHelper;

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  var _lazyValue2 = _interopRequireDefault(_lazyValue);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var HELPERS = {};

  function NOOP() {
    return '';
  }

  function hasHelper(env, scope, name) {
    env && env.helpers || (env = {
      helpers: HELPERS
    });
    return !!(HELPERS[name] || env.helpers[name]);
  }

  function lookupHelper(env, scope, name) {
    if (_.isString(env)) {
      name = env;
    }

    env && env.helpers || (env = {
      helpers: HELPERS
    });
    if (name === 'length') return HELPERS.length;
    if (name === 'if') return HELPERS.if;
    if (name === 'unless') return HELPERS.unless;
    if (name === 'each') return HELPERS.each;
    if (name === 'on') return HELPERS.on;
    if (name === 'debugger') return HELPERS.debugger;
    if (name === 'log') return HELPERS.log;

    if (!hasHelper(env, null, name)) {
      console.error('No helper named', name, 'registered with Rebound');
    }

    return HELPERS[name] || env.helpers[name] || NOOP;
  }

  function registerHelper(name, callback, env) {
    if (!_.isString(name)) return console.error('Name provided to registerHelper must be a string!');
    if (!_.isFunction(callback)) return console.error('Callback provided to regierHelper must be a function!');
    if (hasHelper(env, null, name)) return console.error('A helper called "' + name + '" is already registered!');
    HELPERS[name] = callback;
  }

  HELPERS.debugger = function debuggerHelper(params, hash, options, env) {
    debugger;
    return '';
  };

  HELPERS.log = function logHelper(params, hash, options, env) {
    console.log.apply(console, params);
    return '';
  };

  HELPERS.on = function onHelper(params, hash, options, env) {
    var i,
        callback,
        delegate,
        element,
        eventName = params[0],
        len = params.length;

    if (len === 2) {
      callback = params[1];
      delegate = options.element;
      element = options.element;
    } else if (len === 3) {
      callback = params[2];
      delegate = params[1];
      element = options.element;
    }

    (0, _reboundUtils2.default)(element).on(eventName, delegate, hash, function (event) {
      if (!_.isFunction(env.root[callback])) {
        throw "ERROR: No method named " + callback + " on component " + env.root.tagName + "!";
      }

      return env.root[callback].call(env.root, event);
    });
  };

  HELPERS.length = function lengthHelper(params, hash, options, env) {
    return params[0] && params[0].length || 0;
  };

  function isTruthy(condition) {
    if (condition === true || condition === false) {
      return condition;
    }

    if (condition === undefined || condition === null) {
      return false;
    }

    if (condition.isModel) {
      return true;
    }

    if (_.isArray(condition) || condition.isCollection) {
      return !!condition.length;
    }

    if (condition === 'true') {
      return true;
    }

    if (condition === 'false') {
      return false;
    }

    return !!condition;
  }

  HELPERS.if = function ifHelper(params, hash, templates) {
    var condition = isTruthy(params[0]);

    if (!this.yield) {
      return condition ? params[1] : params[2] || '';
    }

    if (condition && this.yield) {
      this.yield();
    } else if (!condition && templates.inverse && templates.inverse.yield) {
      templates.inverse.yield();
    } else {
      return '';
    }
  };

  HELPERS.unless = function unlessHelper(params, hash, templates) {
    params[0] = !isTruthy(params[0]);
    return HELPERS.if.apply(this, [params, hash, templates]);
  };

  HELPERS.each = function eachHelper(params, hash, templates) {
    if (!params[0]) {
      return void 0;
    }

    var value = params[0].isCollection ? params[0].models : params[0].isModel ? params[0].attributes : params[0];

    if (value && (_.isArray(value) && value.length > 0 || _.isObject(value) && Object.keys(value).length > 0)) {
      for (var key in value) {
        var eachId = value[key] && value[key].isData ? value[key].cid : params[0].cid + key;

        if (value.hasOwnProperty(key)) {
          this.yieldItem(eachId, [value[key], key]);
        }
      }
    } else {
      if (templates.inverse && templates.inverse["yield"]) {
        templates.inverse["yield"]();
      }
    }
  };

  exports.default = HELPERS;
});