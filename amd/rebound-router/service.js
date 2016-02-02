define("rebound-router/service", ["exports", "rebound-utils/rebound-utils"], function (exports, _reboundUtils) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.SERVICES = exports.ServiceLoader = undefined;
  var SERVICES = {};

  function ServiceLoader(type, options) {
    var loadCallbacks = [];
    this.name = type;
    this.cid = _reboundUtils.$.uniqueId('ServiceLoader');
    this.isHydrated = false;
    this.isComponent = true;
    this.isModel = true;
    this.isLazyComponent = true;
    this.attributes = {};
    this.consumers = [];

    this.set = this.on = this.off = function () {
      return 1;
    };

    this.get = function (path) {
      return path ? undefined : this;
    };

    this.hydrate = function (service) {
      SERVICES[this.name] = service;
      this._component = service;

      _.each(this.consumers, function (consumer) {
        var component = consumer.component,
            key = consumer.key;

        if (component.attributes && component.set) {
          component.set(key, service);
        }

        if (component.services) {
          component.services[key] = service;
        }

        if (component.defaults) {
          component.defaults[key] = service;
        }
      });

      service.consumers = this.consumers;

      _.each(loadCallbacks, function (cb) {
        cb(service);
      });

      delete this.loadCallbacks;
    };

    this.onLoad = function (cb) {
      loadCallbacks.push(cb);
    };
  }

  exports.ServiceLoader = ServiceLoader;
  exports.SERVICES = SERVICES;
});