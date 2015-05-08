"use strict";

var _interopRequire = function (obj) {
  return obj && (obj["default"] || obj);
};

// Rebound Router
// ----------------

var $ = _interopRequire(require("rebound-component/utils"));

var LazyComponent = _interopRequire(require("rebound-router/lazy-component"));

var DEFAULT_404_PAGE = "<div style=\"display: block;text-align: center;font-size: 22px;\">\n  <h1 style=\"margin-top: 60px;\">\n    Oops! We couldn't find this page.\n  </h1>\n  <a href=\"#\" onclick=\"window.history.back();return false;\" style=\"display: block;text-decoration: none;margin-top: 30px;\">\n    Take me back\n  </a>\n</div>";

var ERROR_ROUTE_NAME = "error";

// Overload Backbone's loadUrl so it returns the value of the routed callback
// instead of undefined
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

  loadedError: true,

  // By default there is one route. The wildcard route fetches the required
  // page assets based on user-defined naming convention.
  routes: {
    "*route": "wildcardRoute"
  },

  // Called when no matching routes are found. Extracts root route and fetches it's resources
  wildcardRoute: function (route) {
    var primaryRoute;

    // If empty route sent, route home
    route = route || "";

    // Get Root of Route
    primaryRoute = route ? route.split("/")[0] : "index";

    // Fetch Resources
    document.body.classList.add("loading");

    return this._fetchResource(route, this.config.container).then(function () {
      document.body.classList.remove("loading");
    })["catch"](function () {});
  },

  // Modify navigate to default to `trigger=true` and to return the value of
  // `Backbone.history.navigate` inside of a promise.
  navigate: function (fragment) {
    var options = arguments[1] === undefined ? {} : arguments[1];
    options.trigger === undefined && (options.trigger = true);
    var resp = Backbone.history.navigate(fragment, options);

    // Always return a promise
    return new Promise(function (resolve, reject) {
      if (resp && resp.constructor === Promise) resp.then(resolve, reject);
      resolve(resp);
    });
  },

  // Modify `router.execute` to return the value of our route callback
  execute: function (callback, args, name) {
    if (callback) return callback.apply(this, args);
  },

  route: function (route, name, callback) {
    var _this = this;
    if (!_.isRegExp(route)) route = this._routeToRegExp(route);
    if (_.isFunction(name)) {
      callback = name;
      name = "";
    }

    if (!callback) callback = this[name];
    Backbone.history.route(route, function (fragment) {
      var args = _this._extractParameters(route, fragment);
      var resp = _this.execute(callback, args, name);
      if (resp !== false) {
        _this.trigger.apply(_this, ["route:" + name].concat(args));
        _this.trigger("route", name, args);
        Backbone.history.trigger("route", _this, name, args);
      }
      return resp;
    });
    return this;
  },

  // On startup, save our config object and start the router
  initialize: function () {
    var options = arguments[0] === undefined ? {} : arguments[0];
    var callback = arguments[1] === undefined ? function () {} : arguments[1];


    // Let all of our components always have referance to our router
    Rebound.Component.prototype.router = this;

    // Save our config referance
    this.config = options;
    this.config.handlers = [];

    // Allow user to override error route
    ERROR_ROUTE_NAME = this.config.errorRoute || ERROR_ROUTE_NAME;

    // Use the user provided container, or default to the closest `<content>` tag
    var container = this.config.container = $(this.config.container || "content")[0];

    // Convert our routeMappings to regexps and push to our handlers
    _.each(this.config.routeMapping, function (value, route) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      this.config.handlers.unshift({ route: route, primaryRoute: value });
    }, this);

    this._watchLinks(container);
    Rebound.services.page = new LazyComponent();

    // Install our global components
    _.each(this.config.services, function (selector, route) {
      var container = $(selector)[0] || document.createElement(selector || "span");
      this._watchLinks(container);
      Rebound.services[route] = new LazyComponent();
      this._fetchResource(route, container)["catch"](function () {});
    }, this);

    // Start the history and call the provided callback
    Backbone.history.start({
      pushState: this.config.pushState === undefined ? true : this.config.pushState,
      root: this.config.root
    }).then(callback);

    return this;
  },

  // Given a dom element, watch for all click events on anchor tags.
  // If the clicked anchor has a relative url, attempt to route to that path.
  // Give all links on the page that match this path the class `active`.
  _watchLinks: function (container) {
    var _this2 = this;
    // Navigate to route for any link with a relative href
    var remoteUrl = /^([a-z]+:)|^(\/\/)|^([^\/]+\.)/;
    $(container).on("click", "a", function (e) {
      var path = e.target.getAttribute("href");
      // If path is not an remote url, ends in .[a-z], or blank, try and navigate to that route.
      if (path && path !== "#" && !remoteUrl.test(path)) e.preventDefault();
      // If this is not our current route, navigate to the new route
      if (path !== "/" + Backbone.history.fragment) {
        $(container).unMarkLinks();
        _this2.navigate(path, { trigger: true }).then(function () {
          $(container).markLinks();
        });
      }
    });
  },

  // De-initializes the previous app before rendering a new app
  // This way we can ensure that every new page starts with a clean slate
  // This is crucial for scalability of a single page app.
  _uninstallResource: function () {
    var _this3 = this;


    if (!this.current) return;

    var oldPageName = this.current.__name;

    // Unset Previous Application's Routes. For each route in the page app:
    _.each(this.current.data.routes, function (value, key) {
      var regExp = _this3._routeToRegExp(key).toString();

      // Remove the handler from our route object
      Backbone.history.handlers = _.filter(Backbone.history.handlers, function (obj) {
        return obj.route.toString() !== regExp;
      });

      // Delete our referance to the route's callback
      delete _this3["_function_" + key];
    });

    // Un-hook Event Bindings, Delete Objects
    this.current.data.deinitialize();

    // Now we no longer have a page installed.
    this.current = undefined;

    // Disable old css if it exists
    setTimeout(function () {
      document.getElementById(oldPageName + "-css").setAttribute("disabled", true);
    }, 500);
  },

  // Give our new page component, load routes and render a new instance of the
  // page component in the top level outlet.
  _installResource: function (PageApp, primaryRoute, container) {
    var _this4 = this;
    var oldPageName, pageInstance, container;
    var isService = container !== this.config.container;
    container.classList.remove("error", "loading");

    if (!isService && this.current) this._uninstallResource();

    // Load New PageApp, give it it's name so we know what css to remove when it deinitializes
    pageInstance = new PageApp();
    pageInstance.__name = primaryRoute;

    // Add to our page
    container.innerHTML = "";
    container.appendChild(pageInstance);

    // Make sure we're back at the top of the page
    document.body.scrollTop = 0;

    // Augment ApplicationRouter with new routes from PageApp
    _.each(pageInstance.data.routes, function (value, key) {
      // Generate our route callback's new name
      var routeFunctionName = "_function_" + key,
          functionName;
      // Add the new callback referance on to our router and add the route handler
      _this4[routeFunctionName] = function () {
        pageInstance.data[value].apply(pageInstance.data, arguments);
      };
      _this4.route(key, value, _this4[routeFunctionName]);
    }, this);

    var name = isService ? primaryRoute : "page";
    if (!isService) this.current = pageInstance;
    if (window.Rebound.services[name].isService) window.Rebound.services[name].hydrate(pageInstance.data);
    window.Rebound.services[name] = pageInstance.data;


    // Re-trigger route so the newly added route may execute if there's a route match.
    // If no routes are matched, app will hit wildCard route which will then trigger 404
    if (!isService) {
      if (this.config.triggerOnFirstLoad) Backbone.history.loadUrl(Backbone.history.fragment);
      this.config.triggerOnFirstLoad = true;
    }

    // Return our newly installed app
    return pageInstance;
  },

  // Fetches HTML and CSS
  _fetchResource: function (route, container) {
    var _this5 = this;
    var jsUrl,
        cssUrl,
        cssLoaded = false,
        jsLoaded = false,
        cssElement,
        jsElement,
        PageClass,
        appName,
        primaryRoute,
        isService = container !== this.config.container;

    // Get the root of this route
    appName = primaryRoute = route ? route.split("/")[0] : "index";

    // Find Any Custom Route Mappings
    _.any(this.config.handlers, function (handler) {
      if (handler.route.test(route)) {
        appName = handler.primaryRoute;
        return true;
      }
    });

    jsUrl = this.config.jsPath.replace(/:route/g, primaryRoute).replace(/:app/g, appName);
    cssUrl = this.config.cssPath.replace(/:route/g, primaryRoute).replace(/:app/g, appName);
    cssElement = document.getElementById(appName + "-css");
    jsElement = document.getElementById(appName + "-js");

    // Wrap these async resource fetches in a promise and return it.
    // This promise resolves when both css and js resources are loaded
    // It rejects if either of the css or js resources fails to load.
    return new Promise(function (resolve, reject) {
      var thrown = false;

      var defaultError = function (err) {
        if (!isService) {
          _this5._uninstallResource();
          container.innerHTML = DEFAULT_404_PAGE;
        }
        reject(err);
      };

      var throwError = function (err) {
        if (route === ERROR_ROUTE_NAME) return defaultError();
        if (thrown) return;
        thrown = true;
        console.error("Could not " + (isService ? "load the " + route + " service:" : "find the " + route + " page:") + "\n  - CSS Url: " + cssUrl + "\n  - JavaScript Url: " + jsUrl);
        _this5._fetchResource(ERROR_ROUTE_NAME, container).then(reject, reject);
      };

      // If Page Is Already Loaded Then The Route Does Not Exist. 404 and Exit.
      if (_this5.current && _this5.current.name === primaryRoute && window.Rebound.router.loadedError) {
        return throwError();
      }

      // If this css element is not on the page already, it hasn't been loaded before -
      // create the element and load the css resource.
      // Else if the css resource has been loaded before, enable it
      if (cssElement === null) {
        cssElement = document.createElement("link");
        cssElement.setAttribute("type", "text/css");
        cssElement.setAttribute("rel", "stylesheet");
        cssElement.setAttribute("href", cssUrl);
        cssElement.setAttribute("id", appName + "-css");
        $(cssElement).on("load", function (event) {
          if ((cssLoaded = true) && jsLoaded) {
            _this5._installResource(PageClass, appName, container);
            resolve(_this5);
          }
        });
        $(cssElement).on("error", function (err) {
          cssElement.dataset.error = "";
          throwError();
        });
        document.head.appendChild(cssElement);
      } else {
        if (cssElement.hasAttribute("data-error")) {
          return throwError();
        }
        if ((cssLoaded = true) && jsLoaded) {
          cssElement && cssElement.removeAttribute("disabled");
          cssLoaded = true;
        }
      }

      // AMD will manage dependancies for us. Load the JavaScript.
      window.require([jsUrl], function (c) {
        jsElement = $("script[src=\"" + jsUrl + "\"]")[0];
        jsElement.setAttribute("id", appName + "-js");
        if ((jsLoaded = true) && (PageClass = c) && cssLoaded) {
          cssElement && cssElement.removeAttribute("disabled");
          _this5._installResource(PageClass, appName, container);
          resolve(_this5);
        }
      }, function () {
        jsElement = $("script[src=\"" + jsUrl + "\"]")[0];
        jsElement.setAttribute("id", appName + "-js");
        jsElement.dataset.error = "";
        throwError();
      });
    });
  }
});

module.exports = ReboundRouter;