// Rebound Hooks
// ----------------

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _reboundComponentLazyValue = require("rebound-component/lazy-value");

var _reboundComponentLazyValue2 = _interopRequireDefault(_reboundComponentLazyValue);

var _reboundComponentUtils = require("rebound-component/utils");

var _reboundComponentUtils2 = _interopRequireDefault(_reboundComponentUtils);

var _reboundComponentHelpers = require("rebound-component/helpers");

var _reboundComponentHelpers2 = _interopRequireDefault(_reboundComponentHelpers);

var _htmlbarsRuntimeHooks = require("htmlbars-runtime/hooks");

var _htmlbarsRuntimeHooks2 = _interopRequireDefault(_htmlbarsRuntimeHooks);

var _domHelper = require("dom-helper");

var _domHelper2 = _interopRequireDefault(_domHelper);

var _htmlbarsUtilObjectUtils = require("../htmlbars-util/object-utils");

var _htmlbarsRuntimeRender = require("htmlbars-runtime/render");

var _htmlbarsRuntimeRender2 = _interopRequireDefault(_htmlbarsRuntimeRender);

var attributes = { abbr: 1, "accept-charset": 1, accept: 1, accesskey: 1, action: 1,
  align: 1, alink: 1, alt: 1, archive: 1, axis: 1,
  background: 1, bgcolor: 1, border: 1, cellpadding: 1, cellspacing: 1,
  char: 1, charoff: 1, charset: 1, checked: 1, cite: 1,
  "class": 1, classid: 1, clear: 1, code: 1, codebase: 1,
  codetype: 1, color: 1, cols: 1, colspan: 1, compact: 1,
  content: 1, coords: 1, data: 1, datetime: 1, declare: 1,
  defer: 1, dir: 1, disabled: 1, enctype: 1, face: 1,
  "for": 1, frame: 1, frameborder: 1, headers: 1, height: 1,
  href: 1, hreflang: 1, hspace: 1, "http-equiv": 1, id: 1,
  ismap: 1, label: 1, lang: 1, language: 1, link: 1,
  longdesc: 1, marginheight: 1, marginwidth: 1, maxlength: 1, media: 1,
  method: 1, multiple: 1, name: 1, nohref: 1, noresize: 1,
  noshade: 1, nowrap: 1, object: 1, onblur: 1, onchange: 1,
  onclick: 1, ondblclick: 1, onfocus: 1, onkeydown: 1, onkeypress: 1,
  onkeyup: 1, onload: 1, onmousedown: 1, onmousemove: 1, onmouseout: 1,
  onmouseover: 1, onmouseup: 1, onreset: 1, onselect: 1, onsubmit: 1,
  onunload: 1, profile: 1, prompt: 1, readonly: 1, rel: 1,
  rev: 1, rows: 1, rowspan: 1, rules: 1, scheme: 1,
  scope: 1, scrolling: 1, selected: 1, shape: 1, size: 1,
  span: 1, src: 1, standby: 1, start: 1, style: 1,
  summary: 1, tabindex: 1, target: 1, text: 1, title: 1,
  type: 1, usemap: 1, valign: 1, value: 1, valuetype: 1,
  version: 1, vlink: 1, vspace: 1, width: 1 };

/*******************************
        Hook Utils
********************************/

_htmlbarsRuntimeHooks2["default"].get = function get(env, scope, path) {

  if (path === 'this') path = '';

  var setPath = path;

  var key,
      value,
      rest = _reboundComponentUtils2["default"].splitPath(path);
  key = rest.shift();

  // If this path referances a block param, use that as the context instead.
  if (scope.localPresent[key]) {
    value = scope.locals[key];
    path = rest.join('.');
  } else {
    value = scope.self;
  }

  if (scope.streams[setPath]) return scope.streams[setPath];
  return scope.streams[setPath] = streamProperty(value, path);
};

// Given an object (context) and a path, create a LazyValue object that returns the value of object at context and add it as an observer of the context.
function streamProperty(context, path) {

  // Lazy value that returns the value of context.path
  var lazyValue = new _reboundComponentLazyValue2["default"](function () {
    return context.get(path);
  }, { context: context });

  // Save our path so parent lazyvalues can know the data var or helper they are getting info from
  lazyValue.path = path;

  // Save the observer at this path
  lazyValue.addObserver(path, context);

  return lazyValue;
}

_htmlbarsRuntimeHooks2["default"].invokeHelper = function invokeHelper(morph, env, scope, visitor, params, hash, helper, templates, context) {
  if (morph && scope.streams[morph.guid]) {
    scope.streams[morph.guid].value;
    return scope.streams[morph.guid];
  }
  var lazyValue = streamHelper.apply(this, arguments);
  lazyValue.path = helper.name;
  lazyValue.value;
  // if(morph) scope.streams[morph.guid] = lazyValue;
  return lazyValue;
};

function streamHelper(morph, env, scope, visitor, params, hash, helper, templates, context) {

  if (!_.isFunction(helper)) return console.error(scope + ' is not a valid helper!');

  // Create a lazy value that returns the value of our evaluated helper.
  var lazyValue = new _reboundComponentLazyValue2["default"](function () {
    var plainParams = [],
        plainHash = {};

    // Assemble our args and hash variables. For each lazyvalue param, push the lazyValue's value so helpers with no concept of lazyvalues.
    _.each(params, function (param, index) {
      plainParams.push(param && param.isLazyValue ? param.value : param);
    });
    _.each(hash, function (hash, key) {
      plainHash[key] = hash && hash.isLazyValue ? hash.value : hash;
    });

    // Call our helper functions with our assembled args.
    return helper.call(context || {}, plainParams, plainHash, templates, env);
  }, { morph: morph, path: helper.name });

  // For each param or hash value passed to our helper, add it to our helper's dependant list. Helper will re-evaluate when one changes.
  params.forEach(function (param) {
    if (param && param.isLazyValue) {
      lazyValue.addDependentValue(param);
    }
  });
  for (var key in hash) {
    if (hash[key] && hash[key].isLazyValue) {
      lazyValue.addDependentValue(hash[key]);
    }
  }

  return lazyValue;
}

_htmlbarsRuntimeHooks2["default"].cleanupRenderNode = function () {};

_htmlbarsRuntimeHooks2["default"].destroyRenderNode = function (renderNode) {};
_htmlbarsRuntimeHooks2["default"].willCleanupTree = function (renderNode) {
  // for(let i in renderNode.lazyValues)
  //   if(renderNode.lazyValues[i].isLazyValue)
  //     renderNode.lazyValues[i].destroy();
};

/*******************************
        Default Hooks
********************************/

// Helper Hooks

_htmlbarsRuntimeHooks2["default"].hasHelper = _reboundComponentHelpers2["default"].hasHelper;

_htmlbarsRuntimeHooks2["default"].lookupHelper = _reboundComponentHelpers2["default"].lookupHelper;

// Rebound's default environment
// The application environment is propagated down each render call and
// augmented with helpers as it goes
_htmlbarsRuntimeHooks2["default"].createFreshEnv = function () {
  return {
    helpers: _reboundComponentHelpers2["default"],
    hooks: _htmlbarsRuntimeHooks2["default"],
    streams: {},
    dom: new _domHelper2["default"]["default"](),
    useFragmentCache: true,
    revalidateQueue: {},
    isReboundEnv: true
  };
};

_htmlbarsRuntimeHooks2["default"].createChildEnv = function (parent) {
  var env = (0, _htmlbarsUtilObjectUtils.createObject)(parent);
  env.helpers = (0, _htmlbarsUtilObjectUtils.createObject)(parent.helpers);
  return env;
};

_htmlbarsRuntimeHooks2["default"].createFreshScope = function () {
  // because `in` checks have unpredictable performance, keep a
  // separate dictionary to track whether a local was bound.
  // See `bindLocal` for more information.
  return { self: null, blocks: {}, locals: {}, localPresent: {}, streams: {} };
};

_htmlbarsRuntimeHooks2["default"].createChildScope = function (parent) {
  var scope = (0, _htmlbarsUtilObjectUtils.createObject)(parent);
  scope.locals = (0, _htmlbarsUtilObjectUtils.createObject)(parent.locals);
  scope.streams = (0, _htmlbarsUtilObjectUtils.createObject)(parent.streams);
  return scope;
};

// Scope Hooks
_htmlbarsRuntimeHooks2["default"].bindScope = function bindScope(env, scope) {
  // Initial setup of scope
  env.scope = scope;
};

_htmlbarsRuntimeHooks2["default"].wrap = function wrap(template) {
  // Return a wrapper function that will merge user provided helpers and hooks with our defaults
  return {
    reboundTemplate: true,
    meta: template.meta,
    arity: template.arity,
    raw: template,
    render: function render(data, env, options, blockArguments) {
      if (env === undefined) env = _htmlbarsRuntimeHooks2["default"].createFreshEnv();
      if (options === undefined) options = {};

      // Create a fresh scope if it doesn't exist
      var scope = _htmlbarsRuntimeHooks2["default"].createFreshScope();

      env = _htmlbarsRuntimeHooks2["default"].createChildEnv(env);
      _.extend(env.helpers, options.helpers);

      // Ensure we have a contextual element to pass to render
      options.contextualElement || (options.contextualElement = document.body);
      options.self = data;
      options.blockArguments = blockArguments;

      // Call our func with merged helpers and hooks
      env.template = _htmlbarsRuntimeRender2["default"]["default"](template, env, scope, options);
      env.template.uid = _.uniqueId('template');
      return env.template;
    }
  };
};

_htmlbarsRuntimeHooks2["default"].wrapPartial = function wrapPartial(template) {
  // Return a wrapper function that will merge user provided helpers and hooks with our defaults
  return {
    reboundTemplate: true,
    meta: template.meta,
    arity: template.arity,
    raw: template,
    render: function render(scope, env, options, blockArguments) {
      if (env === undefined) env = _htmlbarsRuntimeHooks2["default"].createFreshEnv();
      if (options === undefined) options = {};

      env = _htmlbarsRuntimeHooks2["default"].createChildEnv(env);

      // Ensure we have a contextual element to pass to render
      options.contextualElement || (options.contextualElement = document.body);

      // Call our func with merged helpers and hooks
      env.template = _htmlbarsRuntimeRender2["default"]["default"](template, env, scope, options);
      env.template.uid = _.uniqueId('template');
      return env.template;
    }
  };
};

function rerender(path, node, lazyValue, env) {
  lazyValue.onNotify(function () {
    node.isDirty = true;
    env.revalidateQueue[env.template.uid] = env.template;
  });
}

_htmlbarsRuntimeHooks2["default"].linkRenderNode = function linkRenderNode(renderNode, env, scope, path, params, hash) {

  // If this node has already been rendered, it is already linked to its streams
  if (renderNode.rendered) return;

  // Save the path on our render node for easier debugging
  renderNode.path = path;
  renderNode.lazyValues || (renderNode.lazyValues = {});

  if (params && params.length) {
    for (var i = 0; i < params.length; i++) {
      if (params[i].isLazyValue) {
        rerender(path, renderNode, params[i], env);
      }
    }
  }
  if (hash) {
    for (var key in hash) {
      if (hash.hasOwnProperty(key) && hash[key].isLazyValue) {
        rerender(path, renderNode, hash[key], env);
      }
    }
  }
};

// Hooks

_htmlbarsRuntimeHooks2["default"].getValue = function (referance) {
  return referance && referance.isLazyValue ? referance.value : referance;
};

_htmlbarsRuntimeHooks2["default"].subexpr = function subexpr(env, scope, helperName, params, hash) {
  var helper = _reboundComponentHelpers2["default"].lookupHelper(helperName, env),
      lazyValue,
      i,
      l,
      name = "subexpr " + helperName + ": ";
  for (i = 0, l = params.length; i < l; i++) {
    if (params[i].isLazyValue) name += params[i].cid;
  }

  if (env.streams[name]) return env.streams[name];

  if (helper) {
    lazyValue = streamHelper(null, env, scope, null, params, hash, helper, {}, null);
  } else {
    lazyValue = _htmlbarsRuntimeHooks2["default"].get(env, context, helperName);
  }

  for (i = 0, l = params.length; i < l; i++) {
    if (params[i].isLazyValue) {
      lazyValue.addDependentValue(params[i]);
    }
  }

  lazyValue.path = helperName;
  env.streams[name] = lazyValue;
  return lazyValue;
};

_htmlbarsRuntimeHooks2["default"].concat = function concat(env, params) {

  var name = "concat: ",
      i,
      l;

  if (params.length === 1) {
    return params[0];
  }

  for (i = 0, l = params.length; i < l; i++) {
    name += params[i] && params[i].isLazyValue ? params[i].cid : params[i];
  }

  if (env.streams[name]) return env.streams[name];

  var lazyValue = new _reboundComponentLazyValue2["default"](function (params) {
    var value = "";

    for (i = 0, l = params.length; i < l; i++) {
      value += params[i] && params[i].isLazyValue ? params[i].value : params[i] || '';
    }

    return value;
  }, { context: params[0].context });

  for (i = 0, l = params.length; i < l; i++) {
    lazyValue.addDependentValue(params[i]);
  }

  env.scope.streams[name] = lazyValue;
  lazyValue.path = name;
  return lazyValue;
};

// Content Hook
_htmlbarsRuntimeHooks2["default"].content = function content(morph, env, context, path, lazyValue) {
  var value,
      observer = subtreeObserver,
      domElement = morph.contextualElement,
      helper = _reboundComponentHelpers2["default"].lookupHelper(path, env);

  var updateTextarea = function updateTextarea(lazyValue) {
    domElement.value = lazyValue.value;
  };

  // Two way databinding for textareas
  if (domElement.tagName === 'TEXTAREA') {
    lazyValue.onNotify(updateTextarea);
    (0, _reboundComponentUtils2["default"])(domElement).on('change keyup', function (event) {
      lazyValue.set(lazyValue.path, this.value);
    });
  }

  return lazyValue.value;
};

_htmlbarsRuntimeHooks2["default"].attribute = function attribute(attrMorph, env, scope, name, value) {
  var val = value.isLazyValue ? value.value : value,
      domElement = attrMorph.element,
      checkboxChange,
      type = domElement.getAttribute("type"),
      attr,
      inputTypes = { 'null': true, 'text': true, 'email': true, 'password': true,
    'search': true, 'url': true, 'tel': true, 'hidden': true,
    'number': true, 'color': true, 'date': true, 'datetime': true,
    'datetime-local:': true, 'month': true, 'range': true,
    'time': true, 'week': true
  };

  // If is a text input element's value prop with only one variable, wire default events
  if (domElement.tagName === 'INPUT' && inputTypes[type] && name === 'value') {

    // If our special input events have not been bound yet, bind them and set flag
    if (!attrMorph.inputObserver) {

      (0, _reboundComponentUtils2["default"])(domElement).on('change input propertychange', function (event) {
        value.set(value.path, this.value);
      });

      attrMorph.inputObserver = true;
    }

    // Set the attribute on our element for visual referance
    _.isUndefined(val) ? domElement.removeAttribute(name) : domElement.setAttribute(name, val);

    attr = val;
    return domElement.value !== String(attr) ? domElement.value = attr || '' : attr;
  } else if (domElement.tagName === 'INPUT' && (type === 'checkbox' || type === 'radio') && name === 'checked') {

    // If our special input events have not been bound yet, bind them and set flag
    if (!attrMorph.eventsBound) {

      (0, _reboundComponentUtils2["default"])(domElement).on('change propertychange', function (event) {
        value.set(value.path, this.checked ? true : false, { quiet: true });
      });

      attrMorph.eventsBound = true;
    }

    // Set the attribute on our element for visual referance
    !val ? domElement.removeAttribute(name) : domElement.setAttribute(name, val);

    return domElement.checked = val ? true : undefined;
  }

  // Special case for link elements with dynamic classes.
  // If the router has assigned it a truthy 'active' property, ensure that the extra class is present on re-render.
  else if (domElement.tagName === 'A' && name === 'class') {
      if (_.isUndefined(val)) {
        domElement.active ? domElement.setAttribute('class', 'active') : domElement.classList.remove('class');
      } else {
        domElement.setAttribute(name, val + (domElement.active ? ' active' : ''));
      }
    } else {
      _.isString(val) && (val = val.trim());
      val || (val = undefined);
      if (_.isUndefined(val)) {
        domElement.removeAttribute(name);
      } else {
        domElement.setAttribute(name, val);
      }
    }

  _htmlbarsRuntimeHooks2["default"].linkRenderNode(attrMorph, env, scope, '@attribute', [value], {});
};

_htmlbarsRuntimeHooks2["default"].partial = function partial(renderNode, env, scope, path) {
  if (!path) console.error('Partial helper must be passed path!');
  path = path.isLazyValue ? path.value : path;
  var part = this.wrapPartial(_reboundComponentHelpers.partials[path]);
  if (part && part.render) {
    env = Object.create(env);
    env.template = part.render(scope, env, { contextualElement: renderNode.contextualElement });
    return env.template.fragment;
  }
};

_htmlbarsRuntimeHooks2["default"].component = function (morph, env, scope, tagName, params, attrs, templates, visitor) {

  // Components are only ever rendered once
  if (morph.componentIsRendered) return;

  if (env.hooks.hasHelper(env, scope, tagName)) {
    return env.hooks.block(morph, env, scope, tagName, params, attrs, templates["default"], templates.inverse, visitor);
  }

  var component,
      element,
      outlet,
      seedData = {},
      componentData = {};

  // Create a plain data object to pass to our new component as seed data
  for (var key in attrs) {
    seedData[key] = _htmlbarsRuntimeHooks2["default"].getValue(attrs[key]);
  }

  // For each param passed to our shared component, add it to our custom element
  // TODO: there has to be a better way to get seed data to element instances
  // Global seed data is consumed by element as its created. This is not scoped and very dumb.
  Rebound.seedData = seedData;
  element = document.createElement(tagName);
  component = element.data;
  delete Rebound.seedData;

  // For each lazy param passed to our component, create its lazyValue
  for (var key in seedData) {
    componentData[key] = streamProperty(component, key);
  }

  // Set up two way binding between component and original context for non-data attributes
  // Syncing between models and collections passed are handled in model and collection

  var _loop = function () {
    var key = prop;
    if (componentData[key].isLazyValue && attrs[key].isLazyValue) {

      // For each lazy param passed to our component, have it update the original context when changed.
      componentData[key].onNotify(function () {
        attrs[key].set(attrs[key].path, componentData[key].value);
      });

      // For each lazy param passed to our component, have it update the component when changed.
      attrs[key].onNotify(function () {
        componentData[key].set(key, attrs[key].value);
      });

      // Seed the cache
      componentData[key].value;
    }
  };

  for (var prop in componentData) {
    _loop();
  }

  // TODO: Move this to Component
  // // For each change on our component, update the states of the original context and the element's proeprties.
  component.listenTo(component, 'change', function (model) {
    var json = component.toJSON();

    if (_.isString(json)) return; // If is a string, this model is seralizing already

    // Set the properties on our element for visual referance if we are on a top level attribute
    _.each(json, function (value, key) {
      // TODO: Currently, showing objects as properties on the custom element causes problems.
      // Linked models between the context and component become the same exact model and all hell breaks loose.
      // Find a way to remedy this. Until then, don't show objects.
      if (_.isObject(value)) {
        return;
      }
      value = _.isObject(value) ? JSON.stringify(value) : value;
      try {
        attributes[key] ? element.setAttribute(key, value) : element.dataset[key] = value;
      } catch (e) {
        console.error(e.message);
      }
    });
  });

  /** The attributeChangedCallback on our custom element updates the component's data. **/

  /*******************************************************
  
    End data dependancy chain
  
  *******************************************************/

  // TODO: break this out into its own function
  // Set the properties on our element for visual referance if we are on a top level attribute
  var compjson = component.toJSON();
  _.each(compjson, function (value, key) {
    // TODO: Currently, showing objects as properties on the custom element causes problems.
    // Linked models between the context and component become the same exact model and all hell breaks loose.
    // Find a way to remedy this. Until then, don't show objects.
    if (_.isObject(value)) {
      return;
    }
    value = _.isObject(value) ? JSON.stringify(value) : value;
    if (!_.isNull(value) && !_.isUndefined(value)) {
      try {
        attributes[key] ? element.setAttribute(key, value) : element.dataset[key] = value;
      } catch (e) {
        console.error(e.message);
      }
    }
  });

  // Walk the dom, without traversing into other custom elements, and search for
  // `<content>` outlets to render templates into.
  (0, _reboundComponentUtils2["default"])(element).walkTheDOM(function (el) {
    if (element === el) return true;
    if (el.tagName === 'CONTENT') outlet = el;
    if (el.tagName.indexOf('-') > -1) return false;
    return true;
  });

  // If a `<content>` outlet is present in component's template, and a template
  // is provided, render it into the outlet
  if (templates["default"] && _.isElement(outlet)) {
    outlet.innerHTML = '';
    outlet.appendChild(_htmlbarsRuntimeRender2["default"]["default"](templates["default"], env, scope, {}).fragment);
  }

  morph.setNode(element);
  morph.componentIsRendered = true;
};

exports["default"] = _htmlbarsRuntimeHooks2["default"];
module.exports = exports["default"];