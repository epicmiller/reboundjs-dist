define("rebound-router/rebound-router", ["exports", "module", "rebound-component/utils", "rebound-router/lazy-component"], function (exports, module, _reboundComponentUtils, _reboundRouterLazyComponent) {
  // Rebound Router
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _$ = _interopRequireDefault(_reboundComponentUtils);

  var _LazyComponent = _interopRequireDefault(_reboundRouterLazyComponent);

  var DEFAULT_404_PAGE = "<div style=\"display: block;text-align: center;font-size: 22px;\">\n  <h1 style=\"margin-top: 60px;\">\n    Oops! We couldn't find this page.\n  </h1>\n  <a href=\"#\" onclick=\"window.history.back();return false;\" style=\"display: block;text-decoration: none;margin-top: 30px;\">\n    Take me back\n  </a>\n</div>";

  var ERROR_ROUTE_NAME = 'error';
  var SUCCESS = 'success';
  var ERROR = 'error';
  var LOADING = 'loading';

  // Overload Backbone's loadUrl so it returns the value of the routed callback
  // instead of undefined and prefixes all fragment tests with the current app name
  Backbone.history.loadUrl = function (fragment) {
    fragment = this.fragment = this.getFragment(fragment);
    var resp = false;

    _.any(this.handlers, function (handler) {
      if (handler.route.test(fragment)) {
        resp = handler.callback(fragment);
        return true;
      }
    });

    return resp;
  };

  // ReboundRouter Constructor
  var ReboundRouter = Backbone.Router.extend({

    status: SUCCESS, // loading, success or error
    _currentRoute: '', // The route path that triggered the current page
    _previousRoute: '',

    // By default there is one route. The wildcard route fetches the required
    // page assets based on user-defined naming convention.
    routes: {
      '*route': 'wildcardRoute'
    },

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

      options.trigger === undefined && (options.trigger = true);
      var $container = (0, _$["default"])(this.config.containers).unMarkLinks();
      var resp = Backbone.history.navigate(fragment, options);
      // Always return a promise
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
      if (callback) return callback.apply(this, args);
    },

    // Override route so if callback returns false, the route event is not triggered
    route: function route(_route, name, callback) {
      var _this = this;

      if (!_.isRegExp(_route)) _route = this._routeToRegExp(_route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }

      if (!callback) callback = this[name];
      Backbone.history.route(_route, function (fragment) {
        var args = _this._extractParameters(_route, fragment);
        var resp = _this.execute(callback, args, name);
        if (resp !== false) {
          _this.trigger.apply(_this, ['route:' + name].concat(args));
          _this.trigger('route', name, args);
          Backbone.history.trigger('route', _this, name, args);
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
      Rebound.Component.prototype.router = this;

      // Save our config referance
      this.config = options;
      this.config.handlers = [];
      this.config.containers = [];

      // Get a unique instance id for this router
      this.uid = _.uniqueId('router');

      // Allow user to override error route
      this.config.errorRoute && (ERROR_ROUTE_NAME = this.config.errorRoute);

      // Convert our routeMappings to regexps and push to our handlers
      _.each(this.config.routeMapping, function (value, route) {
        var regex = this._routeToRegExp(route);
        this.config.handlers.unshift({ route: route, regex: regex, app: value });
      }, this);

      // Use the user provided container, or default to the closest `<main>` tag
      this.config.container = (0, _$["default"])(this.config.container || 'main')[0];
      this.config.containers.push(this.config.container);
      Rebound.services.page = new _LazyComponent["default"]();

      // Install our global components
      _.each(this.config.services, function (selector, route) {
        var container = (0, _$["default"])(selector)[0] || document.createElement('span');
        this.config.containers.push(container);
        Rebound.services[route] = new _LazyComponent["default"]();
        this._fetchResource(route, container)["catch"](function () {});
      }, this);

      // Watch click events on links in all out containers
      this._watchLinks(this.config.containers);

      // Start the history and call the provided callback
      Backbone.history.start({
        pushState: this.config.pushState === undefined ? true : this.config.pushState,
        root: this.config.root
      }).then(callback);

      return this;
    },

    stop: function stop() {
      (0, _$["default"])(this.config.container).off('click');
      Backbone.history.stop();
      this._uninstallResource();
      Backbone.history.handlers = [];
    },

    // Given a dom element, watch for all click events on anchor tags.
    // If the clicked anchor has a relative url, attempt to route to that path.
    // Give all links on the page that match this path the class `active`.
    _watchLinks: function _watchLinks(container) {
      var _this2 = this;

      // Navigate to route for any link with a relative href
      var remoteUrl = /^([a-z]+:)|^(\/\/)|^([^\/]+\.)/;
      (0, _$["default"])(container).on('click', 'a', function (e) {
        var path = e.target.getAttribute('href');

        // If path is not an remote url, ends in .[a-z], or blank, try and navigate to that route.
        if (path && path !== '#' && !remoteUrl.test(path)) e.preventDefault();

        // If this is not our current route, navigate to the new route
        if (path !== '/' + Backbone.history.fragment) {
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
        if (key[0] === '/') key = new RegExp(key.split('/')[1], key.split('/')[2]);
        var regExp = key instanceof RegExp ? key.toString() : _this3._routeToRegExp(key).toString();
        Backbone.history.handlers = _.filter(Backbone.history.handlers, function (obj) {
          return obj.route.toString() !== regExp;
        });
      });

      if (!this.current) return;

      var oldPageName = this.current.__name;

      // Un-hook Event Bindings, Delete Objects
      this.current.data.deinitialize();

      // Now we no longer have a page installed.
      this.current = undefined;

      // Disable old css if it exists
      setTimeout(function () {
        if (_this3.status === ERROR) return;
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

      if (!container) throw 'No container found on the page! Please specify a container that exists in your Rebound config.';

      container.classList.remove('error', 'loading');

      if (!isService && this.current) this._uninstallResource();

      // Load New PageApp, give it it's name so we know what css to remove when it deinitializes
      pageInstance = new PageApp();
      pageInstance.__name = this.uid + '-' + appName;

      // Add to our page
      container.innerHTML = '';
      container.appendChild(pageInstance);

      // Make sure we're back at the top of the page
      document.body.scrollTop = 0;

      // Augment ApplicationRouter with new routes from PageApp added in reverse order to preserve order higherarchy
      if (!isService) this.route(this._currentRoute, 'default', function () {
        return 'DEFAULT';
      });
      _.each(pageInstance.data.routes, function (value, key) {
        // If key is a stringified regexp literal, convert to a regexp object
        if (key[0] === '/') key = new RegExp(key.split('/')[1], key.split('/')[2]);
        routes.unshift({ key: key, value: value });
        // Add the new callback referance on to our router and add the route handler
      }, this);
      _.each(routes, function (route) {
        _this4.route(route.key, route.value, function () {
          return pageInstance.data[route.value].apply(pageInstance.data, arguments);
        });
      });

      var name = isService ? appName : 'page';
      if (!isService) this.current = pageInstance;

      // If the target is a dummy service, hydrate it with the proper service object
      // Otherwise, install the page instance here
      if (window.Rebound.services[name].isService) window.Rebound.services[name].hydrate(pageInstance.data);
      window.Rebound.services[name] = pageInstance.data;

      // Always return a promise
      return new Promise(function (resolve, reject) {

        // Re-trigger route so the newly added route may execute if there's a route match.
        // If no routes are matched, app will hit wildCard route which will then trigger 404
        if (!isService) {
          var res = Backbone.history.loadUrl(Backbone.history.fragment);
          if (res && typeof res.then === 'function') return res.then(resolve);
          return resolve(res);
        }
        // Return our newly installed app
        return resolve(pageInstance);
      });
    },

    _fetchJavascript: function _fetchJavascript(routeName, appName) {
      var jsID = this.uid + '-' + appName + '-js',
          jsUrl = this.config.jsPath.replace(/:route/g, routeName).replace(/:app/g, appName),
          jsElement = document.getElementById(appName + '-js');

      // AMD will manage dependancies for us. Load the JavaScript.
      return new Promise(function (resolve, reject) {
        window.require([jsUrl], function (PageClass) {
          jsElement = (0, _$["default"])('script[src="' + jsUrl + '"]')[0];
          jsElement.setAttribute('id', jsID);
          resolve(PageClass);
        }, function (err) {
          console.error(err);
          reject(err);
        });
      });
    },

    _fetchCSS: function _fetchCSS(routeName, appName) {

      var cssID = this.uid + '-' + appName + '-css',
          cssUrl = this.config.cssPath.replace(/:route/g, routeName).replace(/:app/g, appName),
          cssElement = document.getElementById(cssID);

      // If this css element is not on the page already, it hasn't been loaded before -
      // create the element and load the css resource.
      // Else if the css resource has been loaded before, enable it
      return new Promise(function (resolve, reject) {
        var count = 0,
            ti;
        if (cssElement === null) {
          // Construct our `<link>` element.
          cssElement = document.createElement('link');
          cssElement.setAttribute('type', 'text/css');
          cssElement.setAttribute('rel', 'stylesheet');
          cssElement.setAttribute('href', cssUrl);
          cssElement.setAttribute('id', cssID);

          // On successful load, clearInterval and resolve.
          // On failed load, clearInterval and reject.
          var successCallback = function successCallback() {
            clearInterval(ti);
            resolve(cssElement);
          };
          var errorCallback = function errorCallback(err) {
            clearInterval(ti);
            cssElement.dataset.error = '';
            reject(err);
          };

          // Older browsers and phantomJS < 2.0 don't support the onLoad event for
          // `<link>` tags. Pool stylesheets array as a fallback. Timeout at 5s.
          ti = setInterval(function () {
            for (var i = 0; i < document.styleSheets.length; i++) {
              count = count + 50;
              if (document.styleSheets[i].href.indexOf(cssUrl) > -1) successCallback();else if (count >= 5000) errorCallback('CSS Timeout');
            }
          }, 50);

          // Modern browsers support loading events on `<link>` elements, bind these
          // events. These will be callsed before our interval is called and they will
          // clearInterval so the resolve/reject handlers aren't called twice.
          (0, _$["default"])(cssElement).on('load', successCallback);
          (0, _$["default"])(cssElement).on('error', errorCallback);
          (0, _$["default"])(cssElement).on('readystatechange', function () {
            clearInterval(ti);
          });

          // Add our `<link>` element to the page.
          document.head.appendChild(cssElement);
        } else {
          if (cssElement.hasAttribute('data-error')) return reject();
          resolve(cssElement);
        }
      });
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
              PageClass = response[1];
          if (!(cssElement instanceof Element) || typeof PageClass !== 'function') return throwError();
          !isService && !isError && (_this5.status = SUCCESS);
          cssElement && cssElement.removeAttribute('disabled');

          _this5._installResource(PageClass, appName, container).then(resolve, resolve);
        };

        // If loading a page, set status to loading
        !isService && !isError && (_this5.status = LOADING);

        // If Page Is Already Loaded Then The Route Does Not Exist. 404 and Exit.
        if (_this5.current && _this5.current.__name === _this5.uid + '-' + appName) return throwError();
        // Fetch our css and js in paralell, install or throw when both complete
        Promise.all([_this5._fetchCSS(routeName, appName), _this5._fetchJavascript(routeName, appName)]).then(install, throwError);
      });
    }
  });

  module.exports = ReboundRouter;
});