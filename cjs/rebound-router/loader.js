'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reboundUtils = require('rebound-utils/rebound-utils');

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var MODULE_CACHE = {};

var loader = {

  // If this JS element is not on the page already, it hasn't been loaded before -
  // create the element and load the JS resource.
  // Else if the JS resource has been loaded before, resolve with the element

  loadJS: function loadJS(url, id) {

    // Always return a promise for a load request
    return new Promise(function (resolve, reject) {

      // If we have already tried to load this js module, resolve or reject appropreately
      if (MODULE_CACHE[url]) {
        if (_.isElement(MODULE_CACHE[url]) && MODULE_CACHE[url].hasAttribute('data-error')) {
          return reject();
        }
        return resolve(MODULE_CACHE[url]);
      }

      // Construct the script element and save it in the `MODULE_CACHE`
      var e = document.createElement('script');
      e.setAttribute('type', 'text/javascript');
      e.setAttribute('src', url);
      e.setAttribute('id', id || _.uniqueId('module'));
      MODULE_CACHE[url] = e;

      // All browsers support loading events on `<script>` elements, bind to these
      // events and resolve our promise appropreately
      (0, _reboundUtils2.default)(e).on('load', function () {
        resolve(this);
      });
      (0, _reboundUtils2.default)(e).on('error', function (err) {
        reject(err);
      });

      // And add it do to the dom
      document.head.appendChild(e);
    });
  },

  // If this CSS element is not on the page already, it hasn't been loaded before -
  // create the element and load the CSS resource.
  // Else if the CSS resource has been loaded before, resolve with the element
  loadCSS: function loadCSS(url, id) {

    // Always return a promise for a load request
    return new Promise(function (resolve, reject) {

      // If we have already tried to load this js module, resolve or reject appropreately
      if (MODULE_CACHE[url]) {
        if (_.isElement(MODULE_CACHE[url]) && MODULE_CACHE[url].hasAttribute('data-error')) {
          return reject();
        }
        return resolve(MODULE_CACHE[url]);
      }

      // Construct our `<link>` element.
      var e = document.createElement('link');
      e.setAttribute('type', 'text/css');
      e.setAttribute('rel', 'stylesheet');
      e.setAttribute('href', url);
      e.setAttribute('id', id);
      MODULE_CACHE[url] = e;

      // Older browsers and phantomJS < 2.0 don't support the onLoad event for
      // `<link>` tags. Poll stylesheets array as a fallback. Timeout at 5s.
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

      // On successful load, clearInterval and resolve.
      // On failed load, clearInterval and reject.
      var successCallback = function successCallback() {
        clearInterval(ti);
        resolve(e);
      };
      var errorCallback = function errorCallback(err) {
        clearInterval(ti);
        e.setAttribute('data-error', '');
        reject(err);
      };

      // Modern browsers support loading events on `<link>` elements, bind these
      // events. These will be callsed before our interval is called and they will
      // clearInterval so the resolve/reject handlers aren't called twice.
      (0, _reboundUtils2.default)(e).on('load', successCallback);
      (0, _reboundUtils2.default)(e).on('error', errorCallback);
      (0, _reboundUtils2.default)(e).on('readystatechange', function () {
        clearInterval(ti);
      });

      // Add our `<link>` element to the page.
      document.head.appendChild(e);
    });
  },

  // Load multiple dependancies
  // Given an array of dependancy urls, add them all to the head in their own script tags
  load: function load(deps) {
    if (!deps) {
      return void 0;
    }
    deps = _.isArray(deps) ? deps : [deps];

    // For each dependancy passed, call loadJS
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