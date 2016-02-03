define("rebound-utils/rebound-utils", ["exports", "backbone", "rebound-utils/urls", "rebound-utils/ajax", "rebound-utils/events"], function (exports, _backbone, _urls, _ajax, _events) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.$ = exports.REBOUND_SYMBOL = undefined;

  var _backbone2 = _interopRequireDefault(_backbone);

  var _ajax2 = _interopRequireDefault(_ajax);

  var _events2 = _interopRequireDefault(_events);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var ID_COUNTERS = {};
  var REBOUND_SYMBOL = exports.REBOUND_SYMBOL = '__REBOUND_SYMBOL_PROPERTY_NAME__';

  var $ = exports.$ = function $(query) {
    var i,
        selector = [];

    if (!(this instanceof $)) {
      return new $(query);
    }

    query = _.isArray(query) ? query : [query];

    _.each(query, function (item, index) {
      if (_.isElement(item) || item === document || item === window || item instanceof DocumentFragment) {
        selector.push(item);
      } else if (_.isString(item)) {
        this.selector = item;
        Array.prototype.push.apply(selector, Array.prototype.slice.call(document.querySelectorAll(item)));
      }
    }, this);

    this.length = selector.length;

    for (i = 0; i < this.length; i++) {
      this[i] = selector[i];
    }
  };

  $.url = {
    query: _urls.query
  };
  $.ajax = _ajax2.default;
  $.prototype.trigger = _events2.default.trigger;
  $.prototype.on = _events2.default.on;
  $.prototype.off = _events2.default.off;

  $.uniqueId = $.prototype.uniqueId = function uniqueId() {
    var prefix = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
    ID_COUNTERS.hasOwnProperty(prefix) || (ID_COUNTERS[prefix] = 0);
    return prefix + ++ID_COUNTERS[prefix];
  };

  $.prototype.walkTheDOM = function walkTheDOM(func) {
    var el,
        root,
        len = this.length,
        result;

    while (len--) {
      root = this[len];
      result = func(root);

      if (result === false) {
        return void 0;
      }

      root = root.firstChild;

      while (root) {
        $(root).walkTheDOM(func);
        root = root.nextSibling;
      }
    }
  };

  $.prototype.unMarkLinks = function unMarkLinks() {
    var len = this.length;

    while (len--) {
      var links = this[len].querySelectorAll('a');

      for (var i = 0; i < links.length; i++) {
        links.item(i).classList.remove('active');
        links.item(i).active = false;
      }
    }

    return this;
  };

  $.prototype.markLinks = function markLinks() {
    var len = this.length;

    while (len--) {
      var links = this[len].querySelectorAll('a[href="/' + _backbone2.default.history.fragment + '"]');

      for (var i = 0; i < links.length; i++) {
        links.item(i).classList.add('active');
        links.item(i).active = true;
      }
    }

    return this;
  };

  $.prototype.empty = function empty() {
    var len = this.length;

    while (len--) {
      while (this[len].hasChildNodes()) {
        this[len].removeChild(this[len].firstChild);
      }
    }

    return this;
  };

  $.splitPath = function splitPath(path) {
    path = ('.' + path + '.').split(/(?:\.|\[|\])+/);
    path.pop();
    path.shift();
    return path;
  };

  $.extractComputedProps = function extractComputedProps(obj) {
    for (var key in obj) {
      var get = undefined,
          set = undefined;
      if (!obj.hasOwnProperty(key)) continue;
      var desc = Object.getOwnPropertyDescriptor(obj, key);
      get = desc.hasOwnProperty('get') && desc.get;
      set = desc.hasOwnProperty('set') && desc.set;

      if (get || set) {
        delete obj[key];
        obj[key] = {
          get: get,
          set: set,
          isComputedProto: true
        };
      }
    }
  };

  $.startsWith = function startsWith(str, test) {
    if (str === test) return true;
    str = $.splitPath(str);
    test = $.splitPath(test);

    while (test[0] && str[0]) {
      if (str[0] !== test[0] && str[0] !== '@each' && test[0] !== '@each') return false;
      test.shift();
      str.shift();
    }

    return true;
  };

  exports.default = $;
});