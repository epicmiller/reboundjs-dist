"use strict";

var _interopRequire = function (obj) {
  return obj && (obj["default"] || obj);
};

//     Rebound.js 0.0.47

//     (c) 2015 Adam Miller
//     Rebound may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://reboundjs.com

// Rebound Runtime
// ----------------

// If Backbone isn't preset on the page yet, or if `window.Rebound` is already
// in use, throw an error
if (!window.Backbone) throw "Backbone must be on the page for Rebound to load.";
if (!window.Rebound) throw "Global Rebound namespace already taken.";

// Load our **Utils**, helper environment, **Rebound Data**,
// **Rebound Components** and the **Rebound Router**
var utils = _interopRequire(require("rebound-component/utils"));

var helpers = _interopRequire(require("rebound-component/helpers"));

var Model = require("rebound-data/rebound-data").Model;
var Collection = require("rebound-data/rebound-data").Collection;
var ComputedProperty = require("rebound-data/rebound-data").ComputedProperty;
var Component = _interopRequire(require("rebound-component/component"));

var Router = _interopRequire(require("rebound-router/rebound-router"));

// If Backbone doesn't have an ajax method from an external DOM library, use ours
window.Backbone.ajax = window.Backbone.$ && window.Backbone.$.ajax && window.Backbone.ajax || utils.ajax;

// Fetch Rebound's Config Object from Rebound's `script` tag
var Config = document.getElementById("Rebound").innerHTML;

// Create Global Rebound Object
window.Rebound = {
  registerHelper: helpers.registerHelper,
  registerPartial: helpers.registerPartial,
  registerComponent: Component.register,
  Model: Model,
  Collection: Collection,
  ComputedProperty: ComputedProperty,
  Component: Component
};

// Start the router if a config object is preset
if (Config) window.Rebound.router = new Router({ config: JSON.parse(Config) });

module.exports = Rebound;