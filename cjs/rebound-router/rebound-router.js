"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.services = exports.Router = undefined;

var _backbone = require("backbone");

var _backbone2 = _interopRequireDefault(_backbone);

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _service = require("rebound-router/service");

var _component = require("rebound-component/component");

var _component2 = _interopRequireDefault(_component);

var _factory = require("rebound-component/factory");

var _factory2 = _interopRequireDefault(_factory);

var _loader = require("rebound-router/loader");

var _loader2 = _interopRequireDefault(_loader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// If no error page is defined for an app, this is the default 404 page
// Rebound Router
// ----------------

var DEFAULT_404_PAGE = "<div style=\"display: block;text-align: center;font-size: 22px;\">\n  <h1 style=\"margin-top: 60px;\">\n    Oops! We couldn't find this page.\n  </h1>\n  <a href=\"#\" onclick=\"window.history.back();return false;\" style=\"display: block;text-decoration: none;margin-top: 30px;\">\n    Take me back\n  </a>\n</div>";

var ERROR_ROUTE_NAME = 'error';
var SUCCESS = 'success';
var ERROR = 'error';
var LOADING = 'loading';

// Regexp to validate remote URLs
var IS_REMOTE_URL = /^([a-z]+:)|^(\/\/)|^([^\/]+\.)/;
var STRIP_SLASHES = /(^\/+|\/+$)/mg;

function normalizeUrl() {
  var url = '';
  var args = Array.prototype.slice.call(arguments);
  args.forEach(function (val) {
    if (!val || val === '/') {
      return void 0;
    }
    url += '/' + val.replace(STRIP_SLASHES, '');
  });
  return url || '/';
}

// Overload Backbone's loadUrl so it returns the value of the routed callback
// Only ever compare the current path (excludes the query params) to the route regexp
_backbone2.default.history.loadUrl = function (fragment) {
  var key,
      resp = false;
  this.fragment = this.getFragment(fragment).split('?')[0];
  for (key in this.handlers) {
    if (this.handlers[key].route.test(this.fragment)) {
      return this.handlers[key].callback(this.fragment);
    }
  }
};

// Remove the hash up to a `?` character. In IE9, which does not support the
// History API, we need to allow query params to be set both on the URL itself
// and in the hash, giving precedence to the query params in the URL.
_backbone2.default.history.getSearch = function () {
  var match = this.location.href.replace(/#[^\?]*/, '').match(/\?.+/);
  return match ? match[0] : '';
};

// Router Constructor
var Router = _backbone2.default.Router.extend({

  status: SUCCESS, // loading, success or error
  _currentRoute: '', // The route path that triggered the current page
  _previousRoute: '',

  // By default there is one route. The wildcard route fetches the required
  // page assets based on user-defined naming convention.
  routes: {
    '*route': 'wildcardRoute'
  },

  _loadDeps: _loader2.default.load,

  // Called when no matching routes are found. Extracts root route and fetches it's resources
  wildcardRoute: function wildcardRoute(route) {

    // Save the previous route value
    this._previousRoute = this._currentRoute;

    // Fetch Resources
    document.body.classList.add("loading");
    return this._fetchResource(route, this.config.container).then(function (res) {
      document.body.classList.remove('loading');
      return res;
    });
  },

  // Modify navigate to default to `trigger=true` and to return the value of
  // `Backbone.history.navigate` inside of a promise.
  navigate: function navigate(fragment) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    // Default trigger to true unless otherwise specified
    options.trigger === undefined && (options.trigger = true);

    // Stringify any data passed in the options hash
    var query = options.data ? (~fragment.indexOf('?') ? '&' : '?') + _reboundUtils2.default.url.query.stringify(options.data) : '';

    // Un-Mark any `active` links in the page container
    var $container = (0, _reboundUtils2.default)(this.config.containers).unMarkLinks();

    // Navigate to the specified path. Return value is the value from the router
    // callback specified on the component
    var resp = _backbone2.default.history.navigate(fragment + query, options);

    // Always return a promise. If the response of `Backbone.histroy.navigate`
    // was a promise, wait for it to resolve before resolving. Once resolved,
    // mark relevent links on the page as `active`.
    return new Promise(function (resolve, reject) {
      if (resp && resp.constructor === Promise) resp.then(resolve, resolve);
      resolve(resp);
    }).then(function (resp) {
      $container.markLinks();
      return resp;
    });
  },

  // Modify `router.execute` to return the value of our route callback
  execute: function execute(callback, args, name) {
    if (callback) {
      return callback.apply(this, args);
    }
  },

  // Override routeToRegExp so:
  //  - If key is a stringified regexp literal, convert to a regexp object
  //  - Else If route is a string, proxy right through
  _routeToRegExp: function _routeToRegExp(route) {
    var res;

    if (route[0] === '/' && route[route.length - 1] === '/') {
      res = new RegExp(route.slice(1, route.length - 1), '');
      res._isRegexp = true;
    } else if (typeof route == 'string') {
      res = _backbone2.default.Router.prototype._routeToRegExp.call(this, route);
      res._isString = true;
    }

    return res;
  },

  // Override route so if callback returns false, the route event is not triggered
  // Every route also looks for query params, parses with QS, and passes the extra
  // variable as a POJO to callbacks
  route: function route(_route, name, callback) {
    var _this = this;

    if (_.isFunction(name)) {
      callback = name;
      name = '';
    }

    if (!_.isRegExp(_route)) {
      _route = this._routeToRegExp(_route);
    }

    if (!callback) {
      callback = this[name];
    }
    _backbone2.default.history.route(_route, function (fragment) {

      // If this route was defined as a regular expression, we don't capture
      // query params. Only parse the actual path.
      fragment = fragment.split('?')[0];

      // Extract the arguments we care about from the fragment
      var args = _this._extractParameters(_route, fragment);

      // Get the query params string
      var search = (_backbone2.default.history.getSearch() || '').slice(1);

      // If this route was created from a string (not a regexp), remove the auto-captured
      // search params.
      if (_route._isString) {
        args.pop();
      }

      // If the route is not user prodided, if the history object has search params
      // then our args have the params as its last agrument as of Backbone 1.2.0
      // If the route is a user provided regex, add in parsed search params from
      // the history object before passing to the callback.
      args.push(search ? _reboundUtils2.default.url.query.parse(search) : {});

      var resp = _this.execute(callback, args, name);
      if (resp !== false) {
        _this.trigger.apply(_this, ['route:' + name].concat(args));
        _this.trigger('route', name, args);
        _backbone2.default.history.trigger('route', _this, name, args);
      }
      return resp;
    });
    return this;
  },

  // On startup, save our config object and start the router
  initialize: function initialize() {
    var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var callback = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];

    // Let all of our components always have referance to our router
    _component2.default.prototype.router = this;

    // Save our config referance
    this.config = options;
    this.config.handlers = [];
    this.config.containers = [];

    // Normalize our url configs
    this.config.root = normalizeUrl(this.config.root);
    this.config.assetRoot = this.config.assetRoot ? normalizeUrl(this.config.assetRoot) : this.config.root;
    this.config.jsPath = normalizeUrl(this.config.assetRoot, this.config.jsPath);
    this.config.cssPath = normalizeUrl(this.config.assetRoot, this.config.cssPath);

    // Get a unique instance id for this router
    this.uid = _reboundUtils2.default.uniqueId('router');

    // Allow user to override error route
    this.config.errorRoute && (ERROR_ROUTE_NAME = this.config.errorRoute);

    // Convert our routeMappings to regexps and push to our handlers
    _.each(this.config.routeMapping, function (value, route) {
      var regex = this._routeToRegExp(route);
      this.config.handlers.unshift({ route: route, regex: regex, app: value });
    }, this);

    // Use the user provided container, or default to the closest `<main>` tag
    this.config.container = (0, _reboundUtils2.default)(this.config.container || 'main')[0];
    this.config.containers.push(this.config.container);
    _service.SERVICES.page = new _service.ServiceLoader('page');

    // Install our global components
    _.each(this.config.services, function (selector, route) {
      var container = (0, _reboundUtils2.default)(selector)[0] || document.createElement('span');
      this.config.containers.push(container);
      _service.SERVICES[route] = new _service.ServiceLoader(route);
      this._fetchResource(route, container).catch(function () {});
    }, this);

    // Watch click events on links in all out containers
    this._watchLinks(this.config.containers);

    // Start the history and call the provided callback
    _backbone2.default.history.start({
      pushState: this.config.pushState === undefined ? true : this.config.pushState,
      root: this.config.root || ''
    }).then(callback);

    return this;
  },

  stop: function stop() {
    (0, _reboundUtils2.default)(this.config.container).off('click');
    _backbone2.default.history.stop();
    this._uninstallResource();
    _backbone2.default.history.handlers = [];
  },

  // Given a dom element, watch for all click events on anchor tags.
  // If the clicked anchor has a relative url, attempt to route to that path.
  // Give all links on the page that match this path the class `active`.
  _watchLinks: function _watchLinks(container) {
    var _this2 = this;

    // Navigate to route for any link with a relative href
    (0, _reboundUtils2.default)(container).on('click', 'a', function (e) {
      var path = e.target.getAttribute('href');

      // If the path is a remote URL, allow the browser to navigate normally.
      // Otherwise, prevent default so we can handle the route event.
      if (IS_REMOTE_URL.test(path) || path === '#') {
        return void 0;
      }
      e.preventDefault();

      // If this is not our current route, navigate to the new route
      if (path !== '/' + _backbone2.default.history.fragment) {
        _this2.navigate(path, { trigger: true });
      }
    });
  },

  // De-initializes the previous app before rendering a new app
  // This way we can ensure that every new page starts with a clean slate
  // This is crucial for scalability of a single page app.
  _uninstallResource: function _uninstallResource() {
    var _this3 = this;

    var routes = this.current ? this.current.data.routes || {} : {};
    routes[this._previousRoute] = '';

    // Unset Previous Application's Routes. For each route in the page app, remove
    // the handler from our route object and delete our referance to the route's callback
    _.each(routes, function (value, key) {
      var regExp = _this3._routeToRegExp(key).toString();
      _backbone2.default.history.handlers = _.filter(_backbone2.default.history.handlers, function (obj) {
        return obj.route.toString() !== regExp;
      });
    });

    if (!this.current) {
      return void 0;
    }

    var oldPageName = this.current.__pageId;

    // Un-hook Event Bindings, Delete Objects
    this.current.data.deinitialize();

    // Now we no longer have a page installed.
    this.current = undefined;

    // Disable old css if it exists
    setTimeout(function () {
      if (_this3.status === ERROR) {
        return void 0;
      }
      document.getElementById(oldPageName + '-css').setAttribute('disabled', true);
    }, 500);
  },

  // Give our new page component, load routes and render a new instance of the
  // page component in the top level outlet.
  _installResource: function _installResource(PageApp, appName, container) {
    var _this4 = this;

    var oldPageName,
        pageInstance,
        routes = [];
    var isService = container !== this.config.container;
    var name = isService ? appName : 'page';

    // If no container exists, throw an error
    if (!container) throw 'No container found on the page! Please specify a container that exists in your Rebound config.';

    // Add page level loading class
    container.classList.remove('error', 'loading');

    // Uninstall any old resource we have loaded
    if (!isService && this.current) {
      this._uninstallResource();
    }

    // Load New PageApp, give it it's name so we know what css to remove when it deinitializes
    pageInstance = (0, _factory2.default)(PageApp).el;
    if (_service.SERVICES[name].isLazyComponent) {
      _service.SERVICES[name].hydrate(pageInstance.data);
    } else {
      _service.SERVICES[name] = pageInstance.data;
    }
    pageInstance.__pageId = this.uid + '-' + appName;

    // Add to our page
    (0, _reboundUtils2.default)(container).empty();
    container.appendChild(pageInstance);

    // Make sure we're back at the top of the page
    document.body.scrollTop = 0;

    // Add a default route handler for the route that got us here so if the component
    // does not define a route that handles it, we don't get a redirect loop
    if (!isService) {
      this.route(this._currentRoute, 'default', function () {
        return void 0;
      });
    }

    // Augment ApplicationRouter with new routes from PageApp added in reverse order to preserve order higherarchy
    _.each(pageInstance.data.routes, function (value, key) {
      // Add the new callback referance on to our router and add the route handler
      _this4.route(key, value, function () {
        return pageInstance.data[value].apply(pageInstance.data, arguments);
      });
    });

    // If this is the main page component, set it as current
    if (!isService) {
      this.current = pageInstance;
    }

    // Always return a promise
    return new Promise(function (resolve, reject) {

      // Re-trigger route so the newly added route may execute if there's a route match.
      // If no routes are matched, app will hit wildCard route which will then trigger 404
      if (!isService) {
        var res = _backbone2.default.history.loadUrl(_backbone2.default.history.fragment);
        if (res && typeof res.then === 'function') return res.then(resolve);
        return resolve(res);
      }
      // Return our newly installed app
      return resolve(pageInstance);
    });
  },

  _fetchJavascript: function _fetchJavascript(routeName, appName) {
    var jsID = this.uid + '-' + appName + '-route',
        jsUrl = this.config.jsPath.replace(/:route/g, routeName).replace(/:app/g, appName);

    // Load the JavaScript.
    return _loader2.default.loadJS(jsUrl, jsID);
  },

  _fetchCSS: function _fetchCSS(routeName, appName) {

    var cssID = this.uid + '-' + appName + '-css',
        cssUrl = this.config.cssPath.replace(/:route/g, routeName).replace(/:app/g, appName);

    // Load the CSS
    return _loader2.default.loadCSS(cssUrl, cssID);
  },

  // Fetches HTML and CSS
  _fetchResource: function _fetchResource(route, container) {
    var _this5 = this;

    var appName,
        routeName,
        isService = container !== this.config.container,
        isError = route === ERROR_ROUTE_NAME;

    // Normalize Route
    route || (route = '');

    // Get the app name from this route
    appName = routeName = route.split('/')[0] || 'index';

    // If this isn't the error route, Find Any Custom Route Mappings
    if (!isService && !isError) {
      this._currentRoute = route.split('/')[0];
      _.any(this.config.handlers, function (handler) {
        if (handler.regex.test(route)) {
          appName = handler.app;
          _this5._currentRoute = handler.route;
          return true;
        }
      });
    }

    // Wrap these async resource fetches in a promise and return it.
    // This promise resolves when both css and js resources are loaded
    // It rejects if either of the css or js resources fails to load.
    return new Promise(function (resolve, reject) {

      var throwError = function throwError(err) {
        // If we are already in an error state, this means we were unable to load
        // a custom error page. Uninstall anything we have and insert our default 404 page.
        if (_this5.status === ERROR) {
          if (isService) return resolve(err);
          _this5._uninstallResource();
          container.innerHTML = DEFAULT_404_PAGE;
          return resolve(err);
        }

        // Set our status to error and attempt to load a custom error page.
        console.error('Could not ' + (isService ? 'load the ' + appName + ' service:' : 'find the ' + (appName || 'index') + ' app.'), 'at', '/' + route);
        _this5.status = ERROR;
        _this5._currentRoute = route;
        resolve(_this5._fetchResource(ERROR_ROUTE_NAME, container));
      };

      // If the values we got from installing our resources are unexpected, 404
      // Otherwise, set status, activate the css, and install the page component
      var install = function install(response) {
        var cssElement = response[0],
            jsElement = response[1];
        if (!(cssElement instanceof Element) || !(jsElement instanceof Element)) return throwError();
        !isService && !isError && (_this5.status = SUCCESS);
        cssElement && cssElement.removeAttribute('disabled');
        _this5._installResource(jsElement.getAttribute('data-name'), appName, container).then(resolve, resolve);
      };

      // If loading a page, set status to loading
      !isService && !isError && (_this5.status = LOADING);

      // If Page Is Already Loaded Then The Route Does Not Exist. 404 and Exit.
      if (_this5.current && _this5.current.__pageId === _this5.uid + '-' + appName) {
        return throwError();
      }

      // Fetch our css and js in paralell, install or throw when both complete
      Promise.all([_this5._fetchCSS(routeName, appName), _this5._fetchJavascript(routeName, appName)]).then(install, throwError);
    });
  }
});

exports.default = Router;
exports.Router = Router;
exports.services = _service.SERVICES;