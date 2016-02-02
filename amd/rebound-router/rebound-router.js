define("rebound-router/rebound-router", ["exports", "backbone", "rebound-utils/rebound-utils", "rebound-router/service", "rebound-component/factory", "rebound-router/loader"], function (exports, _backbone, _reboundUtils, _service, _factory, _loader) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.services = exports.Router = undefined;

  var _backbone2 = _interopRequireDefault(_backbone);

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

  var _factory2 = _interopRequireDefault(_factory);

  var _loader2 = _interopRequireDefault(_loader);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var DEFAULT_404_PAGE = "<div style=\"display: block;text-align: center;font-size: 22px;\">\n  <h1 style=\"margin-top: 60px;\">\n    Oops! We couldn't find this page.\n  </h1>\n  <a href=\"#\" onclick=\"window.history.back();return false;\" style=\"display: block;text-decoration: none;margin-top: 30px;\">\n    Take me back\n  </a>\n</div>";
  var ERROR_ROUTE_NAME = 'error';
  var SUCCESS = 'success';
  var ERROR = 'error';
  var LOADING = 'loading';
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

  _backbone2.default.history.getSearch = function () {
    var match = this.location.href.replace(/#[^\?]*/, '').match(/\?.+/);
    return match ? match[0] : '';
  };

  var Router = _backbone2.default.Router.extend({
    status: SUCCESS,
    _currentRoute: '',
    _previousRoute: '',
    routes: {
      '*route': 'wildcardRoute'
    },
    _loadDeps: _loader2.default.load,
    wildcardRoute: function wildcardRoute(route) {
      this._previousRoute = this._currentRoute;
      document.body.classList.add("loading");
      return this._fetchResource(route, this.config.container).then(function (res) {
        document.body.classList.remove('loading');
        return res;
      });
    },
    navigate: function navigate(fragment) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
      options.trigger === undefined && (options.trigger = true);
      var query = options.data ? (~fragment.indexOf('?') ? '&' : '?') + _reboundUtils2.default.url.query.stringify(options.data) : '';
      var $container = (0, _reboundUtils2.default)(this.config.containers).unMarkLinks();

      var resp = _backbone2.default.history.navigate(fragment + query, options);

      return new Promise(function (resolve, reject) {
        if (resp && resp.constructor === Promise) resp.then(resolve, resolve);
        resolve(resp);
      }).then(function (resp) {
        $container.markLinks();
        return resp;
      });
    },
    execute: function execute(callback, args, name) {
      if (callback) {
        return callback.apply(this, args);
      }
    },
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
        fragment = fragment.split('?')[0];

        var args = _this._extractParameters(_route, fragment);

        var search = (_backbone2.default.history.getSearch() || '').slice(1);

        if (_route._isString) {
          args.pop();
        }

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
    initialize: function initialize() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
      var callback = arguments.length <= 1 || arguments[1] === undefined ? function () {} : arguments[1];
      _factory2.default.prototype.router = this;
      this.config = options;
      this.config.handlers = [];
      this.config.containers = [];
      this.config.root = normalizeUrl(this.config.root);
      this.config.assetRoot = this.config.assetRoot ? normalizeUrl(this.config.assetRoot) : this.config.root;
      this.config.jsPath = normalizeUrl(this.config.assetRoot, this.config.jsPath);
      this.config.cssPath = normalizeUrl(this.config.assetRoot, this.config.cssPath);
      this.uid = _reboundUtils2.default.uniqueId('router');
      this.config.errorRoute && (ERROR_ROUTE_NAME = this.config.errorRoute);

      _.each(this.config.routeMapping, function (value, route) {
        var regex = this._routeToRegExp(route);

        this.config.handlers.unshift({
          route: route,
          regex: regex,
          app: value
        });
      }, this);

      this.config.container = (0, _reboundUtils2.default)(this.config.container || 'main')[0];
      this.config.containers.push(this.config.container);
      _service.SERVICES.page = new _service.ServiceLoader('page');

      _.each(this.config.services, function (selector, route) {
        var container = (0, _reboundUtils2.default)(selector)[0] || document.createElement('span');
        this.config.containers.push(container);
        _service.SERVICES[route] = new _service.ServiceLoader(route);

        this._fetchResource(route, container).catch(function () {});
      }, this);

      this._watchLinks(this.config.containers);

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
    _watchLinks: function _watchLinks(container) {
      var _this2 = this;

      (0, _reboundUtils2.default)(container).on('click', 'a', function (e) {
        var path = e.target.getAttribute('href');

        if (IS_REMOTE_URL.test(path) || path === '#') {
          return void 0;
        }

        e.preventDefault();

        if (path !== '/' + _backbone2.default.history.fragment) {
          _this2.navigate(path, {
            trigger: true
          });
        }
      });
    },
    _uninstallResource: function _uninstallResource() {
      var _this3 = this;

      var routes = this.current ? this.current.data.routes || {} : {};
      routes[this._previousRoute] = '';

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
      this.current.data.deinitialize();
      this.current = undefined;
      setTimeout(function () {
        if (_this3.status === ERROR) {
          return void 0;
        }

        document.getElementById(oldPageName + '-css').setAttribute('disabled', true);
      }, 500);
    },
    _installResource: function _installResource(PageApp, appName, container) {
      var _this4 = this;

      var oldPageName,
          pageInstance,
          routes = [];
      var isService = container !== this.config.container;
      var name = isService ? appName : 'page';
      if (!container) throw 'No container found on the page! Please specify a container that exists in your Rebound config.';
      container.classList.remove('error', 'loading');

      if (!isService && this.current) {
        this._uninstallResource();
      }

      pageInstance = (0, _factory2.default)(PageApp).el;

      if (_service.SERVICES[name].isLazyComponent) {
        _service.SERVICES[name].hydrate(pageInstance.data);
      } else {
        _service.SERVICES[name] = pageInstance.data;
      }

      pageInstance.__pageId = this.uid + '-' + appName;
      (0, _reboundUtils2.default)(container).empty();
      container.appendChild(pageInstance);
      document.body.scrollTop = 0;

      if (!isService) {
        this.route(this._currentRoute, 'default', function () {
          return void 0;
        });
      }

      _.each(pageInstance.data.routes, function (value, key) {
        _this4.route(key, value, function () {
          return pageInstance.data[value].apply(pageInstance.data, arguments);
        });
      });

      if (!isService) {
        this.current = pageInstance;
      }

      return new Promise(function (resolve, reject) {
        if (!isService) {
          var res = _backbone2.default.history.loadUrl(_backbone2.default.history.fragment);

          if (res && typeof res.then === 'function') return res.then(resolve);
          return resolve(res);
        }

        return resolve(pageInstance);
      });
    },
    _fetchJavascript: function _fetchJavascript(routeName, appName) {
      var jsID = this.uid + '-' + appName + '-route',
          jsUrl = this.config.jsPath.replace(/:route/g, routeName).replace(/:app/g, appName);
      return _loader2.default.loadJS(jsUrl, jsID);
    },
    _fetchCSS: function _fetchCSS(routeName, appName) {
      var cssID = this.uid + '-' + appName + '-css',
          cssUrl = this.config.cssPath.replace(/:route/g, routeName).replace(/:app/g, appName);
      return _loader2.default.loadCSS(cssUrl, cssID);
    },
    _fetchResource: function _fetchResource(route, container) {
      var _this5 = this;

      var appName,
          routeName,
          isService = container !== this.config.container,
          isError = route === ERROR_ROUTE_NAME;
      route || (route = '');
      appName = routeName = route.split('/')[0] || 'index';

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

      return new Promise(function (resolve, reject) {
        var throwError = function throwError(err) {
          if (_this5.status === ERROR) {
            if (isService) return resolve(err);

            _this5._uninstallResource();

            container.innerHTML = DEFAULT_404_PAGE;
            return resolve(err);
          }

          console.error('Could not ' + (isService ? 'load the ' + appName + ' service:' : 'find the ' + (appName || 'index') + ' app.'), 'at', '/' + route);
          _this5.status = ERROR;
          _this5._currentRoute = route;
          resolve(_this5._fetchResource(ERROR_ROUTE_NAME, container));
        };

        var install = function install(response) {
          var cssElement = response[0],
              jsElement = response[1];
          if (!(cssElement instanceof Element) || !(jsElement instanceof Element)) return throwError();
          !isService && !isError && (_this5.status = SUCCESS);
          cssElement && cssElement.removeAttribute('disabled');

          _this5._installResource(jsElement.getAttribute('data-name'), appName, container).then(resolve, resolve);
        };

        !isService && !isError && (_this5.status = LOADING);

        if (_this5.current && _this5.current.__pageId === _this5.uid + '-' + appName) {
          return throwError();
        }

        Promise.all([_this5._fetchCSS(routeName, appName), _this5._fetchJavascript(routeName, appName)]).then(install, throwError);
      });
    }
  });

  exports.default = Router;
  exports.Router = Router;
  exports.services = _service.SERVICES;
});