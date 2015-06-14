// Services keep track of their consumers. LazyComponent are placeholders
// for services that haven't loaded yet. A LazyComponent mimics the api of a
// real service/component (they are the same), and when the service finally
// loads, its ```hydrate``` method is called. All consumers of the service will
// have the now fully loaded service set, the LazyService will transfer all of
// its consumers over to the fully loaded service, and then destroy itself.
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function LazyComponent() {
  this.isService = true;
  this.isComponent = true;
  this.isModel = true;
  this.attributes = {};
  this.consumers = [];
  this.set = this.on = this.off = function () {
    return 1;
  };
  this.get = function (path) {
    return path ? undefined : this;
  };
  this.hydrate = function (service) {
    _.each(this.consumers, function (consumer) {
      var component = consumer.component,
          key = consumer.key;
      if (component.attributes && component.set) component.set(key, service);
      if (component.services) component.services[key] = service;
      if (component.defaults) component.defaults[key] = service;
    });
    service.consumers = this.consumers;
    delete this.consumers;
  };
}

exports["default"] = LazyComponent;
module.exports = exports["default"];