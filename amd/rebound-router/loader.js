define('rebound-router/loader', ['exports', 'rebound-utils/rebound-utils'], function (exports, _reboundUtils) {
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

  var MODULE_CACHE = {};
  var loader = {
    loadJS: function loadJS(url, id) {
      return new Promise(function (resolve, reject) {
        if (MODULE_CACHE[url]) {
          if (_.isElement(MODULE_CACHE[url]) && MODULE_CACHE[url].hasAttribute('data-error')) {
            return reject();
          }

          return resolve(MODULE_CACHE[url]);
        }

        var e = document.createElement('script');
        e.setAttribute('type', 'text/javascript');
        e.setAttribute('src', url);
        e.setAttribute('id', id || _.uniqueId('module'));
        MODULE_CACHE[url] = e;
        (0, _reboundUtils2.default)(e).on('load', function () {
          resolve(this);
        });
        (0, _reboundUtils2.default)(e).on('error', function (err) {
          reject(err);
        });
        document.head.appendChild(e);
      });
    },
    loadCSS: function loadCSS(url, id) {
      return new Promise(function (resolve, reject) {
        if (MODULE_CACHE[url]) {
          if (_.isElement(MODULE_CACHE[url]) && MODULE_CACHE[url].hasAttribute('data-error')) {
            return reject();
          }

          return resolve(MODULE_CACHE[url]);
        }

        var e = document.createElement('link');
        e.setAttribute('type', 'text/css');
        e.setAttribute('rel', 'stylesheet');
        e.setAttribute('href', url);
        e.setAttribute('id', id);
        MODULE_CACHE[url] = e;
        var count = 0,
            ti = setInterval(function () {
          for (var i = 0; i < document.styleSheets.length; i++) {
            count = count + 50;

            if ((document.styleSheets[i].href || '').indexOf(url) > -1) {
              successCallback();
            } else if (count >= 5000) {
              errorCallback('CSS Timeout');
            }
          }
        }, 50);

        var successCallback = function successCallback() {
          clearInterval(ti);
          resolve(e);
        };

        var errorCallback = function errorCallback(err) {
          clearInterval(ti);
          e.setAttribute('data-error', '');
          reject(err);
        };

        (0, _reboundUtils2.default)(e).on('load', successCallback);
        (0, _reboundUtils2.default)(e).on('error', errorCallback);
        (0, _reboundUtils2.default)(e).on('readystatechange', function () {
          clearInterval(ti);
        });
        document.head.appendChild(e);
      });
    },
    load: function load(deps) {
      if (!deps) {
        return void 0;
      }

      deps = _.isArray(deps) ? deps : [deps];
      deps.forEach(function (url) {
        url = url.trim();
        url = '/' + url + '.js';
        loader.loadJS(url);
      });
    },
    register: function register(url) {
      MODULE_CACHE[url] = true;
    }
  };
  exports.default = loader;
});