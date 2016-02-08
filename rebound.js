// Console-polyfill. MIT license.
// https://github.com/paulmillr/console-polyfill
// Make it safe to do console.log() always.
(function(global) {
  'use strict';
  global.console = global.console || {};
  var con = global.console;
  var prop, method;
  var empty = {};
  var dummy = function() {};
  var properties = 'memory'.split(',');
  var methods = ('assert,clear,count,debug,dir,dirxml,error,exception,group,' +
     'groupCollapsed,groupEnd,info,log,markTimeline,profile,profiles,profileEnd,' +
     'show,table,time,timeEnd,timeline,timelineEnd,timeStamp,trace,warn').split(',');
  while (prop = properties.pop()) if (!con[prop]) con[prop] = empty;
  while (method = methods.pop()) if (!con[method]) con[method] = dummy;
})(typeof window === 'undefined' ? this : window);
// Using `this` for web workers while maintaining compatibility with browser
// targeted script loaders such as Browserify or Webpack where the only way to
// get to the global object is via `window`.

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller. fixes from Paul Irish and Tino Zijdel

// MIT license

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());
// document.currentScript polyfill by Adam Miller

// MIT license

(function(document){
  var currentScript = "currentScript",
      scripts = document.getElementsByTagName('script'); // Live NodeList collection

  // If browser needs currentScript polyfill, add get currentScript() to the document object
  if (!(currentScript in document)) {
    Object.defineProperty(document, currentScript, {
      get: function(){

        // IE 6-10 supports script readyState
        // IE 10+ support stack trace
        try { throw new Error(); }
        catch (err) {

          // Find the second match for the "at" string to get file src url from stack.
          // Specifically works with the format of stack traces in IE.
          var i, res = ((/.*at [^\(]*\((.*):.+:.+\)$/ig).exec(err.stack) || [false])[1];

          // For all scripts on the page, if src matches or if ready state is interactive, return the script tag
          for(i in scripts){
            if(scripts[i].src == res || scripts[i].readyState == "interactive"){
              return scripts[i];
            }
          }

          // If no match, return null
          return null;
        }
      }
    });
  }
})(document);

/*
 * classList.js: Cross-browser full element.classList implementation.
 * 1.1.20150312
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

if ("document" in self) {

// Full polyfill for browsers with no classList support
// Including IE < Edge missing SVGElement.classList
if (!("classList" in document.createElement("_")) 
	|| document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg","g"))) {

(function (view) {

"use strict";

if (!('Element' in view)) return;

var
	  classListProp = "classList"
	, protoProp = "prototype"
	, elemCtrProto = view.Element[protoProp]
	, objCtr = Object
	, strTrim = String[protoProp].trim || function () {
		return this.replace(/^\s+|\s+$/g, "");
	}
	, arrIndexOf = Array[protoProp].indexOf || function (item) {
		var
			  i = 0
			, len = this.length
		;
		for (; i < len; i++) {
			if (i in this && this[i] === item) {
				return i;
			}
		}
		return -1;
	}
	// Vendors: please allow content code to instantiate DOMExceptions
	, DOMEx = function (type, message) {
		this.name = type;
		this.code = DOMException[type];
		this.message = message;
	}
	, checkTokenAndGetIndex = function (classList, token) {
		if (token === "") {
			throw new DOMEx(
				  "SYNTAX_ERR"
				, "An invalid or illegal string was specified"
			);
		}
		if (/\s/.test(token)) {
			throw new DOMEx(
				  "INVALID_CHARACTER_ERR"
				, "String contains an invalid character"
			);
		}
		return arrIndexOf.call(classList, token);
	}
	, ClassList = function (elem) {
		var
			  trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
			, classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
			, i = 0
			, len = classes.length
		;
		for (; i < len; i++) {
			this.push(classes[i]);
		}
		this._updateClassName = function () {
			elem.setAttribute("class", this.toString());
		};
	}
	, classListProto = ClassList[protoProp] = []
	, classListGetter = function () {
		return new ClassList(this);
	}
;
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
DOMEx[protoProp] = Error[protoProp];
classListProto.item = function (i) {
	return this[i] || null;
};
classListProto.contains = function (token) {
	token += "";
	return checkTokenAndGetIndex(this, token) !== -1;
};
classListProto.add = function () {
	var
		  tokens = arguments
		, i = 0
		, l = tokens.length
		, token
		, updated = false
	;
	do {
		token = tokens[i] + "";
		if (checkTokenAndGetIndex(this, token) === -1) {
			this.push(token);
			updated = true;
		}
	}
	while (++i < l);

	if (updated) {
		this._updateClassName();
	}
};
classListProto.remove = function () {
	var
		  tokens = arguments
		, i = 0
		, l = tokens.length
		, token
		, updated = false
		, index
	;
	do {
		token = tokens[i] + "";
		index = checkTokenAndGetIndex(this, token);
		while (index !== -1) {
			this.splice(index, 1);
			updated = true;
			index = checkTokenAndGetIndex(this, token);
		}
	}
	while (++i < l);

	if (updated) {
		this._updateClassName();
	}
};
classListProto.toggle = function (token, force) {
	token += "";

	var
		  result = this.contains(token)
		, method = result ?
			force !== true && "remove"
		:
			force !== false && "add"
	;

	if (method) {
		this[method](token);
	}

	if (force === true || force === false) {
		return force;
	} else {
		return !result;
	}
};
classListProto.toString = function () {
	return this.join(" ");
};

if (objCtr.defineProperty) {
	var classListPropDesc = {
		  get: classListGetter
		, enumerable: true
		, configurable: true
	};
	try {
		objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
	} catch (ex) { // IE 8 doesn't support enumerable:true
		if (ex.number === -0x7FF5EC54) {
			classListPropDesc.enumerable = false;
			objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
		}
	}
} else if (objCtr[protoProp].__defineGetter__) {
	elemCtrProto.__defineGetter__(classListProp, classListGetter);
}

}(self));

} else {
// There is full or partial native classList support, so just check if we need
// to normalize the add/remove and toggle APIs.

(function () {
	"use strict";

	var testElement = document.createElement("_");

	testElement.classList.add("c1", "c2");

	// Polyfill for IE 10/11 and Firefox <26, where classList.add and
	// classList.remove exist but support only one argument at a time.
	if (!testElement.classList.contains("c2")) {
		var createMethod = function(method) {
			var original = DOMTokenList.prototype[method];

			DOMTokenList.prototype[method] = function(token) {
				var i, len = arguments.length;

				for (i = 0; i < len; i++) {
					token = arguments[i];
					original.call(this, token);
				}
			};
		};
		createMethod('add');
		createMethod('remove');
	}

	testElement.classList.toggle("c3", false);

	// Polyfill for IE 10 and Firefox <24, where classList.toggle does not
	// support the second argument.
	if (testElement.classList.contains("c3")) {
		var _toggle = DOMTokenList.prototype.toggle;

		DOMTokenList.prototype.toggle = function(token, force) {
			if (1 in arguments && !this.contains(token) === !force) {
				return force;
			} else {
				return _toggle.call(this, token);
			}
		};

	}

	testElement = null;
}());

}

}


this.Element && function(ElementPrototype) {
	ElementPrototype.matchesSelector = ElementPrototype.matchesSelector || 
	ElementPrototype.mozMatchesSelector ||
	ElementPrototype.msMatchesSelector ||
	ElementPrototype.oMatchesSelector ||
	ElementPrototype.webkitMatchesSelector ||
	function (selector) {
		var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;

		while (nodes[++i] && nodes[i] != node);

		return !!nodes[i];
	}
}(Element.prototype);
/*!
Copyright (C) 2014-2015 by WebReflection

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/
(function(window, document, Object, REGISTER_ELEMENT){'use strict';

// in case it's there or already patched
if (REGISTER_ELEMENT in document) return;

// DO NOT USE THIS FILE DIRECTLY, IT WON'T WORK
// THIS IS A PROJECT BASED ON A BUILD SYSTEM
// THIS FILE IS JUST WRAPPED UP RESULTING IN
// build/document-register-element.js
// and its .max.js counter part

var
  // IE < 11 only + old WebKit for attributes + feature detection
  EXPANDO_UID = '__' + REGISTER_ELEMENT + (Math.random() * 10e4 >> 0),

  // shortcuts and costants
  ATTACHED = 'attached',
  DETACHED = 'detached',
  EXTENDS = 'extends',
  ADDITION = 'ADDITION',
  MODIFICATION = 'MODIFICATION',
  REMOVAL = 'REMOVAL',
  DOM_ATTR_MODIFIED = 'DOMAttrModified',
  DOM_CONTENT_LOADED = 'DOMContentLoaded',
  DOM_SUBTREE_MODIFIED = 'DOMSubtreeModified',
  PREFIX_TAG = '<',
  PREFIX_IS = '=',

  // valid and invalid node names
  validName = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/,
  invalidNames = [
    'ANNOTATION-XML',
    'COLOR-PROFILE',
    'FONT-FACE',
    'FONT-FACE-SRC',
    'FONT-FACE-URI',
    'FONT-FACE-FORMAT',
    'FONT-FACE-NAME',
    'MISSING-GLYPH'
  ],

  // registered types and their prototypes
  types = [],
  protos = [],

  // to query subnodes
  query = '',

  // html shortcut used to feature detect
  documentElement = document.documentElement,

  // ES5 inline helpers || basic patches
  indexOf = types.indexOf || function (v) {
    for(var i = this.length; i-- && this[i] !== v;){}
    return i;
  },

  // other helpers / shortcuts
  OP = Object.prototype,
  hOP = OP.hasOwnProperty,
  iPO = OP.isPrototypeOf,

  defineProperty = Object.defineProperty,
  gOPD = Object.getOwnPropertyDescriptor,
  gOPN = Object.getOwnPropertyNames,
  gPO = Object.getPrototypeOf,
  sPO = Object.setPrototypeOf,

  // jshint proto: true
  hasProto = !!Object.__proto__,

  // used to create unique instances
  create = Object.create || function Bridge(proto) {
    // silly broken polyfill probably ever used but short enough to work
    return proto ? ((Bridge.prototype = proto), new Bridge()) : this;
  },

  // will set the prototype if possible
  // or copy over all properties
  setPrototype = sPO || (
    hasProto ?
      function (o, p) {
        o.__proto__ = p;
        return o;
      } : (
    (gOPN && gOPD) ?
      (function(){
        function setProperties(o, p) {
          for (var
            key,
            names = gOPN(p),
            i = 0, length = names.length;
            i < length; i++
          ) {
            key = names[i];
            if (!hOP.call(o, key)) {
              defineProperty(o, key, gOPD(p, key));
            }
          }
        }
        return function (o, p) {
          do {
            setProperties(o, p);
          } while ((p = gPO(p)) && !iPO.call(p, o));
          return o;
        };
      }()) :
      function (o, p) {
        for (var key in p) {
          o[key] = p[key];
        }
        return o;
      }
  )),

  // DOM shortcuts and helpers, if any

  MutationObserver = window.MutationObserver ||
                     window.WebKitMutationObserver,

  HTMLElementPrototype = (
    window.HTMLElement ||
    window.Element ||
    window.Node
  ).prototype,

  IE8 = !iPO.call(HTMLElementPrototype, documentElement),

  isValidNode = IE8 ?
    function (node) {
      return node.nodeType === 1;
    } :
    function (node) {
      return iPO.call(HTMLElementPrototype, node);
    },

  targets = IE8 && [],

  cloneNode = HTMLElementPrototype.cloneNode,
  setAttribute = HTMLElementPrototype.setAttribute,
  removeAttribute = HTMLElementPrototype.removeAttribute,

  // replaced later on
  createElement = document.createElement,

  // shared observer for all attributes
  attributesObserver = MutationObserver && {
    attributes: true,
    characterData: true,
    attributeOldValue: true
  },

  // useful to detect only if there's no MutationObserver
  DOMAttrModified = MutationObserver || function(e) {
    doesNotSupportDOMAttrModified = false;
    documentElement.removeEventListener(
      DOM_ATTR_MODIFIED,
      DOMAttrModified
    );
  },

  // will both be used to make DOMNodeInserted asynchronous
  asapQueue,
  rAF = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (fn) { setTimeout(fn, 10); },

  // internal flags
  setListener = false,
  doesNotSupportDOMAttrModified = true,
  dropDomContentLoaded = true,

  // needed for the innerHTML helper
  notFromInnerHTMLHelper = true,

  // optionally defined later on
  onSubtreeModified,
  callDOMAttrModified,
  getAttributesMirror,
  observer,

  // based on setting prototype capability
  // will check proto or the expando attribute
  // in order to setup the node once
  patchIfNotAlready,
  patch
;

if (sPO || hasProto) {
    patchIfNotAlready = function (node, proto) {
      if (!iPO.call(proto, node)) {
        setupNode(node, proto);
      }
    };
    patch = setupNode;
} else {
    patchIfNotAlready = function (node, proto) {
      if (!node[EXPANDO_UID]) {
        node[EXPANDO_UID] = Object(true);
        setupNode(node, proto);
      }
    };
    patch = patchIfNotAlready;
}
if (IE8) {
  doesNotSupportDOMAttrModified = false;
  (function (){
    var
      descriptor = gOPD(HTMLElementPrototype, 'addEventListener'),
      addEventListener = descriptor.value,
      patchedRemoveAttribute = function (name) {
        var e = new CustomEvent(DOM_ATTR_MODIFIED, {bubbles: true});
        e.attrName = name;
        e.prevValue = this.getAttribute(name);
        e.newValue = null;
        e[REMOVAL] = e.attrChange = 2;
        removeAttribute.call(this, name);
        this.dispatchEvent(e);
      },
      patchedSetAttribute = function (name, value) {
        var
          had = this.hasAttribute(name),
          old = had && this.getAttribute(name),
          e = new CustomEvent(DOM_ATTR_MODIFIED, {bubbles: true})
        ;
        setAttribute.call(this, name, value);
        e.attrName = name;
        e.prevValue = had ? old : null;
        e.newValue = value;
        if (had) {
          e[MODIFICATION] = e.attrChange = 1;
        } else {
          e[ADDITION] = e.attrChange = 0;
        }
        this.dispatchEvent(e);
      },
      onPropertyChange = function (e) {
        // jshint eqnull:true
        var
          node = e.currentTarget,
          superSecret = node[EXPANDO_UID],
          propertyName = e.propertyName,
          event
        ;
        if (superSecret.hasOwnProperty(propertyName)) {
          superSecret = superSecret[propertyName];
          event = new CustomEvent(DOM_ATTR_MODIFIED, {bubbles: true});
          event.attrName = superSecret.name;
          event.prevValue = superSecret.value || null;
          event.newValue = (superSecret.value = node[propertyName] || null);
          if (event.prevValue == null) {
            event[ADDITION] = event.attrChange = 0;
          } else {
            event[MODIFICATION] = event.attrChange = 1;
          }
          node.dispatchEvent(event);
        }
      }
    ;
    descriptor.value = function (type, handler, capture) {
      if (
        type === DOM_ATTR_MODIFIED &&
        this.attributeChangedCallback &&
        this.setAttribute !== patchedSetAttribute
      ) {
        this[EXPANDO_UID] = {
          className: {
            name: 'class',
            value: this.className
          }
        };
        this.setAttribute = patchedSetAttribute;
        this.removeAttribute = patchedRemoveAttribute;
        addEventListener.call(this, 'propertychange', onPropertyChange);
      }
      addEventListener.call(this, type, handler, capture);
    };
    defineProperty(HTMLElementPrototype, 'addEventListener', descriptor);
  }());
} else if (!MutationObserver) {
  documentElement.addEventListener(DOM_ATTR_MODIFIED, DOMAttrModified);
  documentElement.setAttribute(EXPANDO_UID, 1);
  documentElement.removeAttribute(EXPANDO_UID);
  if (doesNotSupportDOMAttrModified) {
    onSubtreeModified = function (e) {
      var
        node = this,
        oldAttributes,
        newAttributes,
        key
      ;
      if (node === e.target) {
        oldAttributes = node[EXPANDO_UID];
        node[EXPANDO_UID] = (newAttributes = getAttributesMirror(node));
        for (key in newAttributes) {
          if (!(key in oldAttributes)) {
            // attribute was added
            return callDOMAttrModified(
              0,
              node,
              key,
              oldAttributes[key],
              newAttributes[key],
              ADDITION
            );
          } else if (newAttributes[key] !== oldAttributes[key]) {
            // attribute was changed
            return callDOMAttrModified(
              1,
              node,
              key,
              oldAttributes[key],
              newAttributes[key],
              MODIFICATION
            );
          }
        }
        // checking if it has been removed
        for (key in oldAttributes) {
          if (!(key in newAttributes)) {
            // attribute removed
            return callDOMAttrModified(
              2,
              node,
              key,
              oldAttributes[key],
              newAttributes[key],
              REMOVAL
            );
          }
        }
      }
    };
    callDOMAttrModified = function (
      attrChange,
      currentTarget,
      attrName,
      prevValue,
      newValue,
      action
    ) {
      var e = {
        attrChange: attrChange,
        currentTarget: currentTarget,
        attrName: attrName,
        prevValue: prevValue,
        newValue: newValue
      };
      e[action] = attrChange;
      onDOMAttrModified(e);
    };
    getAttributesMirror = function (node) {
      for (var
        attr, name,
        result = {},
        attributes = node.attributes,
        i = 0, length = attributes.length;
        i < length; i++
      ) {
        attr = attributes[i];
        name = attr.name;
        if (name !== 'setAttribute') {
          result[name] = attr.value;
        }
      }
      return result;
    };
  }
}

function loopAndVerify(list, action) {
  for (var i = 0, length = list.length; i < length; i++) {
    verifyAndSetupAndAction(list[i], action);
  }
}

function loopAndSetup(list) {
  for (var i = 0, length = list.length, node; i < length; i++) {
    node = list[i];
    patch(node, protos[getTypeIndex(node)]);
  }
}

function executeAction(action) {
  return function (node) {
    if (isValidNode(node)) {
      verifyAndSetupAndAction(node, action);
      loopAndVerify(
        node.querySelectorAll(query),
        action
      );
    }
  };
}

function getTypeIndex(target) {
  var
    is = target.getAttribute('is'),
    nodeName = target.nodeName.toUpperCase(),
    i = indexOf.call(
      types,
      is ?
          PREFIX_IS + is.toUpperCase() :
          PREFIX_TAG + nodeName
    )
  ;
  return is && -1 < i && !isInQSA(nodeName, is) ? -1 : i;
}

function isInQSA(name, type) {
  return -1 < query.indexOf(name + '[is="' + type + '"]');
}

function onDOMAttrModified(e) {
  var
    node = e.currentTarget,
    attrChange = e.attrChange,
    attrName = e.attrName,
    target = e.target
  ;
  if (notFromInnerHTMLHelper &&
      (!target || target === node) &&
      node.attributeChangedCallback &&
      attrName !== 'style' &&
      e.prevValue !== e.newValue) {
    node.attributeChangedCallback(
      attrName,
      attrChange === e[ADDITION] ? null : e.prevValue,
      attrChange === e[REMOVAL] ? null : e.newValue
    );
  }
}

function onDOMNode(action) {
  var executor = executeAction(action);
  return function (e) {
    asapQueue.push(executor, e.target);
  };
}

function onReadyStateChange(e) {
  if (dropDomContentLoaded) {
    dropDomContentLoaded = false;
    e.currentTarget.removeEventListener(DOM_CONTENT_LOADED, onReadyStateChange);
  }
  loopAndVerify(
    (e.target || document).querySelectorAll(query),
    e.detail === DETACHED ? DETACHED : ATTACHED
  );
  if (IE8) purge();
}

function patchedSetAttribute(name, value) {
  // jshint validthis:true
  var self = this;
  setAttribute.call(self, name, value);
  onSubtreeModified.call(self, {target: self});
}

function setupNode(node, proto) {
  setPrototype(node, proto);
  if (observer) {
    observer.observe(node, attributesObserver);
  } else {
    if (doesNotSupportDOMAttrModified) {
      node.setAttribute = patchedSetAttribute;
      node[EXPANDO_UID] = getAttributesMirror(node);
      node.addEventListener(DOM_SUBTREE_MODIFIED, onSubtreeModified);
    }
    node.addEventListener(DOM_ATTR_MODIFIED, onDOMAttrModified);
  }
  if (node.createdCallback && notFromInnerHTMLHelper) {
    node.created = true;
    node.createdCallback();
    node.created = false;
  }
}

function purge() {
  for (var
    node,
    i = 0,
    length = targets.length;
    i < length; i++
  ) {
    node = targets[i];
    if (!documentElement.contains(node)) {
      length--;
      targets.splice(i--, 1);
      verifyAndSetupAndAction(node, DETACHED);
    }
  }
}

function throwTypeError(type) {
  throw new Error('A ' + type + ' type is already registered');
}

function verifyAndSetupAndAction(node, action) {
  var
    fn,
    i = getTypeIndex(node)
  ;
  if (-1 < i) {
    patchIfNotAlready(node, protos[i]);
    i = 0;
    if (action === ATTACHED && !node[ATTACHED]) {
      node[DETACHED] = false;
      node[ATTACHED] = true;
      i = 1;
      if (IE8 && indexOf.call(targets, node) < 0) {
        targets.push(node);
      }
    } else if (action === DETACHED && !node[DETACHED]) {
      node[ATTACHED] = false;
      node[DETACHED] = true;
      i = 1;
    }
    if (i && (fn = node[action + 'Callback'])) fn.call(node);
  }
}

// set as enumerable, writable and configurable
document[REGISTER_ELEMENT] = function registerElement(type, options) {
  upperType = type.toUpperCase();
  if (!setListener) {
    // only first time document.registerElement is used
    // we need to set this listener
    // setting it by default might slow down for no reason
    setListener = true;
    if (MutationObserver) {
      observer = (function(attached, detached){
        function checkEmAll(list, callback) {
          for (var i = 0, length = list.length; i < length; callback(list[i++])){}
        }
        return new MutationObserver(function (records) {
          for (var
            current, node, newValue,
            i = 0, length = records.length; i < length; i++
          ) {
            current = records[i];
            if (current.type === 'childList') {
              checkEmAll(current.addedNodes, attached);
              checkEmAll(current.removedNodes, detached);
            } else {
              node = current.target;
              if (notFromInnerHTMLHelper &&
                  node.attributeChangedCallback &&
                  current.attributeName !== 'style') {
                newValue = node.getAttribute(current.attributeName);
                if (newValue !== current.oldValue) {
                  node.attributeChangedCallback(
                    current.attributeName,
                    current.oldValue,
                    newValue
                  );
                }
              }
            }
          }
        });
      }(executeAction(ATTACHED), executeAction(DETACHED)));
      observer.observe(
        document,
        {
          childList: true,
          subtree: true
        }
      );
    } else {
      asapQueue = [];
      rAF(function ASAP() {
        while (asapQueue.length) {
          asapQueue.shift().call(
            null, asapQueue.shift()
          );
        }
        rAF(ASAP);
      });
      document.addEventListener('DOMNodeInserted', onDOMNode(ATTACHED));
      document.addEventListener('DOMNodeRemoved', onDOMNode(DETACHED));
    }

    document.addEventListener(DOM_CONTENT_LOADED, onReadyStateChange);
    document.addEventListener('readystatechange', onReadyStateChange);

    document.createElement = function (localName, typeExtension) {
      var
        node = createElement.apply(document, arguments),
        name = '' + localName,
        i = indexOf.call(
          types,
          (typeExtension ? PREFIX_IS : PREFIX_TAG) +
          (typeExtension || name).toUpperCase()
        ),
        setup = -1 < i
      ;
      if (typeExtension) {
        node.setAttribute('is', typeExtension = typeExtension.toLowerCase());
        if (setup) {
          setup = isInQSA(name.toUpperCase(), typeExtension);
        }
      }
      notFromInnerHTMLHelper = !document.createElement.innerHTMLHelper;
      if (setup) patch(node, protos[i]);
      return node;
    };

    HTMLElementPrototype.cloneNode = function (deep) {
      var
        node = cloneNode.call(this, !!deep),
        i = getTypeIndex(node)
      ;
      if (-1 < i) patch(node, protos[i]);
      if (deep) loopAndSetup(node.querySelectorAll(query));
      return node;
    };
  }

  if (-2 < (
    indexOf.call(types, PREFIX_IS + upperType) +
    indexOf.call(types, PREFIX_TAG + upperType)
  )) {
    throwTypeError(type);
  }

  if (!validName.test(upperType) || -1 < indexOf.call(invalidNames, upperType)) {
    throw new Error('The type ' + type + ' is invalid');
  }

  var
    constructor = function () {
      return extending ?
        document.createElement(nodeName, upperType) :
        document.createElement(nodeName);
    },
    opt = options || OP,
    extending = hOP.call(opt, EXTENDS),
    nodeName = extending ? options[EXTENDS].toUpperCase() : upperType,
    upperType,
    i
  ;

  if (extending && -1 < (
    indexOf.call(types, PREFIX_TAG + nodeName)
  )) {
    throwTypeError(nodeName);
  }

  i = types.push((extending ? PREFIX_IS : PREFIX_TAG) + upperType) - 1;

  query = query.concat(
    query.length ? ',' : '',
    extending ? nodeName + '[is="' + type.toLowerCase() + '"]' : nodeName
  );

  constructor.prototype = (
    protos[i] = hOP.call(opt, 'prototype') ?
      opt.prototype :
      create(HTMLElementPrototype)
  );

  loopAndVerify(
    document.querySelectorAll(query),
    ATTACHED
  );

  return constructor;
};

}(window, document, Object, 'registerElement'));
(function (global, undefined) {
    "use strict";

    var tasks = (function () {
        function Task(handler, args) {
            this.handler = handler;
            this.args = args;
        }
        Task.prototype.run = function () {
            // See steps in section 5 of the spec.
            if (typeof this.handler === "function") {
                // Choice of `thisArg` is not in the setImmediate spec; `undefined` is in the setTimeout spec though:
                // http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html
                this.handler.apply(undefined, this.args);
            } else {
                var scriptSource = "" + this.handler;
                /*jshint evil: true */
                eval(scriptSource);
            }
        };

        var nextHandle = 1; // Spec says greater than zero
        var tasksByHandle = {};
        var currentlyRunningATask = false;

        return {
            addFromSetImmediateArguments: function (args) {
                var handler = args[0];
                var argsToHandle = Array.prototype.slice.call(args, 1);
                var task = new Task(handler, argsToHandle);

                var thisHandle = nextHandle++;
                tasksByHandle[thisHandle] = task;
                return thisHandle;
            },
            runIfPresent: function (handle) {
                // From the spec: "Wait until any invocations of this algorithm started before this one have completed."
                // So if we're currently running a task, we'll need to delay this invocation.
                if (!currentlyRunningATask) {
                    var task = tasksByHandle[handle];
                    if (task) {
                        currentlyRunningATask = true;
                        try {
                            task.run();
                        } finally {
                            delete tasksByHandle[handle];
                            currentlyRunningATask = false;
                        }
                    }
                } else {
                    // Delay by doing a setTimeout. setImmediate was tried instead, but in Firefox 7 it generated a
                    // "too much recursion" error.
                    global.setTimeout(function () {
                        tasks.runIfPresent(handle);
                    }, 0);
                }
            },
            remove: function (handle) {
                delete tasksByHandle[handle];
            }
        };
    }());

    function canUseNextTick() {
        // Don't get fooled by e.g. browserify environments.
        return typeof process === "object" &&
               Object.prototype.toString.call(process) === "[object process]";
    }

    function canUseMessageChannel() {
        return !!global.MessageChannel;
    }

    function canUsePostMessage() {
        // The test against `importScripts` prevents this implementation from being installed inside a web worker,
        // where `global.postMessage` means something completely different and can't be used for this purpose.

        if (!global.postMessage || global.importScripts) {
            return false;
        }

        var postMessageIsAsynchronous = true;
        var oldOnMessage = global.onmessage;
        global.onmessage = function () {
            postMessageIsAsynchronous = false;
        };
        global.postMessage("", "*");
        global.onmessage = oldOnMessage;

        return postMessageIsAsynchronous;
    }

    function canUseReadyStateChange() {
        return "document" in global && "onreadystatechange" in global.document.createElement("script");
    }

    function installNextTickImplementation(attachTo) {
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            process.nextTick(function () {
                tasks.runIfPresent(handle);
            });

            return handle;
        };
    }

    function installMessageChannelImplementation(attachTo) {
        var channel = new global.MessageChannel();
        channel.port1.onmessage = function (event) {
            var handle = event.data;
            tasks.runIfPresent(handle);
        };
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            channel.port2.postMessage(handle);

            return handle;
        };
    }

    function installPostMessageImplementation(attachTo) {
        // Installs an event handler on `global` for the `message` event: see
        // * https://developer.mozilla.org/en/DOM/window.postMessage
        // * http://www.whatwg.org/specs/web-apps/current-work/multipage/comms.html#crossDocumentMessages

        var MESSAGE_PREFIX = "com.bn.NobleJS.setImmediate" + Math.random();

        function isStringAndStartsWith(string, putativeStart) {
            return typeof string === "string" && string.substring(0, putativeStart.length) === putativeStart;
        }

        function onGlobalMessage(event) {
            // This will catch all incoming messages (even from other windows!), so we need to try reasonably hard to
            // avoid letting anyone else trick us into firing off. We test the origin is still this window, and that a
            // (randomly generated) unpredictable identifying prefix is present.
            if (event.source === global && isStringAndStartsWith(event.data, MESSAGE_PREFIX)) {
                var handle = event.data.substring(MESSAGE_PREFIX.length);
                tasks.runIfPresent(handle);
            }
        }
        if (global.addEventListener) {
            global.addEventListener("message", onGlobalMessage, false);
        } else {
            global.attachEvent("onmessage", onGlobalMessage);
        }

        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            // Make `global` post a message to itself with the handle and identifying prefix, thus asynchronously
            // invoking our onGlobalMessage listener above.
            global.postMessage(MESSAGE_PREFIX + handle, "*");

            return handle;
        };
    }

    function installReadyStateChangeImplementation(attachTo) {
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            // Create a <script> element; its readystatechange event will be fired asynchronously once it is inserted
            // into the document. Do so, thus queuing up the task. Remember to clean up once it's been called.
            var scriptEl = global.document.createElement("script");
            scriptEl.onreadystatechange = function () {
                tasks.runIfPresent(handle);

                scriptEl.onreadystatechange = null;
                scriptEl.parentNode.removeChild(scriptEl);
                scriptEl = null;
            };
            global.document.documentElement.appendChild(scriptEl);

            return handle;
        };
    }

    function installSetTimeoutImplementation(attachTo) {
        attachTo.setImmediate = function () {
            var handle = tasks.addFromSetImmediateArguments(arguments);

            global.setTimeout(function () {
                tasks.runIfPresent(handle);
            }, 0);

            return handle;
        };
    }

    if (!global.setImmediate) {
        // If supported, we should attach to the prototype of global, since that is where setTimeout et al. live.
        var attachTo = typeof Object.getPrototypeOf === "function" && "setTimeout" in Object.getPrototypeOf(global) ?
                          Object.getPrototypeOf(global)
                        : global;

        if (canUseNextTick()) {
            // For Node.js before 0.9
            installNextTickImplementation(attachTo);
        } else if (canUsePostMessage()) {
            // For non-IE10 modern browsers
            installPostMessageImplementation(attachTo);
        } else if (canUseMessageChannel()) {
            // For web workers, where supported
            installMessageChannelImplementation(attachTo);
        } else if (canUseReadyStateChange()) {
            // For IE 6–8
            installReadyStateChangeImplementation(attachTo);
        } else {
            // For older browsers
            installSetTimeoutImplementation(attachTo);
        }

        attachTo.clearImmediate = tasks.remove;
    }
}(typeof global === "object" && global ? global : this));

(function(root) {

	// Use polyfill for setImmediate for performance gains
	var asap = (typeof setImmediate === 'function' && setImmediate) ||
		function(fn) { setTimeout(fn, 1); };

	// Polyfill for Function.prototype.bind
	function bind(fn, thisArg) {
		return function() {
			fn.apply(thisArg, arguments);
		}
	}

	var isArray = Array.isArray || function(value) { return Object.prototype.toString.call(value) === "[object Array]" };

	function Promise(fn) {
		if (typeof this !== 'object') throw new TypeError('Promises must be constructed via new');
		if (typeof fn !== 'function') throw new TypeError('not a function');
		this._state = null;
		this._value = null;
		this._deferreds = []

		doResolve(fn, bind(resolve, this), bind(reject, this))
	}

	function handle(deferred) {
		var me = this;
		if (this._state === null) {
			this._deferreds.push(deferred);
			return
		}
		asap(function() {
			var cb = me._state ? deferred.onFulfilled : deferred.onRejected
			if (cb === null) {
				(me._state ? deferred.resolve : deferred.reject)(me._value);
				return;
			}
			var ret;
			try {
				ret = cb(me._value);
			}
			catch (e) {
				deferred.reject(e);
				return;
			}
			deferred.resolve(ret);
		})
	}

	function resolve(newValue) {
		try { //Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
			if (newValue === this) throw new TypeError('A promise cannot be resolved with itself.');
			if (newValue && (typeof newValue === 'object' || typeof newValue === 'function')) {
				var then = newValue.then;
				if (typeof then === 'function') {
					doResolve(bind(then, newValue), bind(resolve, this), bind(reject, this));
					return;
				}
			}
			this._state = true;
			this._value = newValue;
			finale.call(this);
		} catch (e) { reject.call(this, e); }
	}

	function reject(newValue) {
		this._state = false;
		this._value = newValue;
		finale.call(this);
	}

	function finale() {
		for (var i = 0, len = this._deferreds.length; i < len; i++) {
			handle.call(this, this._deferreds[i]);
		}
		this._deferreds = null;
	}

	function Handler(onFulfilled, onRejected, resolve, reject){
		this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
		this.onRejected = typeof onRejected === 'function' ? onRejected : null;
		this.resolve = resolve;
		this.reject = reject;
	}

	/**
	 * Take a potentially misbehaving resolver function and make sure
	 * onFulfilled and onRejected are only called once.
	 *
	 * Makes no guarantees about asynchrony.
	 */
	function doResolve(fn, onFulfilled, onRejected) {
		var done = false;
		try {
			fn(function (value) {
				if (done) return;
				done = true;
				onFulfilled(value);
			}, function (reason) {
				if (done) return;
				done = true;
				onRejected(reason);
			})
		} catch (ex) {
			if (done) return;
			done = true;
			onRejected(ex);
		}
	}

	Promise.prototype['catch'] = function (onRejected) {
		return this.then(null, onRejected);
	};

	Promise.prototype.then = function(onFulfilled, onRejected) {
		var me = this;
		return new Promise(function(resolve, reject) {
			handle.call(me, new Handler(onFulfilled, onRejected, resolve, reject));
		})
	};

	Promise.all = function () {
		var args = Array.prototype.slice.call(arguments.length === 1 && isArray(arguments[0]) ? arguments[0] : arguments);

		return new Promise(function (resolve, reject) {
			if (args.length === 0) return resolve([]);
			var remaining = args.length;
			function res(i, val) {
				try {
					if (val && (typeof val === 'object' || typeof val === 'function')) {
						var then = val.then;
						if (typeof then === 'function') {
							then.call(val, function (val) { res(i, val) }, reject);
							return;
						}
					}
					args[i] = val;
					if (--remaining === 0) {
						resolve(args);
					}
				} catch (ex) {
					reject(ex);
				}
			}
			for (var i = 0; i < args.length; i++) {
				res(i, args[i]);
			}
		});
	};

	Promise.resolve = function (value) {
		if (value && typeof value === 'object' && value.constructor === Promise) {
			return value;
		}

		return new Promise(function (resolve) {
			resolve(value);
		});
	};

	Promise.reject = function (value) {
		return new Promise(function (resolve, reject) {
			reject(value);
		});
	};

	Promise.race = function (values) {
		return new Promise(function (resolve, reject) {
			for(var i = 0, len = values.length; i < len; i++) {
				values[i].then(resolve, reject);
			}
		});
	};

	/**
	 * Set the immediate function to execute callbacks
	 * @param fn {function} Function to execute
	 * @private
	 */
	Promise._setImmediateFn = function _setImmediateFn(fn) {
		asap = fn;
	};

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = Promise;
	} else if (!root.Promise) {
		root.Promise = Promise;
	}

})(this);
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _runtime = require("runtime");

var Rebound = _interopRequireWildcard(_runtime);

var _compile = require("rebound-compiler/compile");

var _compile2 = _interopRequireDefault(_compile);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

// Rebound Compiletime
// ----------------

// Import the runtime

Rebound.compiler = _compile2.default;

// Load our **compiler**

exports.default = Rebound;
},{"rebound-compiler/compile":3,"runtime":43}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _acorn = require('acorn');

function tokenizer(input, options) {
  return new _acorn.Parser(options, input);
} // Property Compiler
// ----------------

var TERMINATORS = [';', ',', '==', '>', '<', '>=', '<=', '>==', '<==', '!=', '!==', '===', '&&', '||', '+', '-', '/', '*', '{', '}'];

function reduceMemos(memo, paths) {
  var newMemo = [];
  paths = !_.isArray(paths) ? [paths] : paths;
  _.each(paths, function (path) {
    _.each(memo, function (mem) {
      newMemo.push(_.compact([mem, path]).join('.').replace('.[', '['));
    });
  });
  return newMemo;
}

// TODO: Make this farrrrrr more robust...very minimal right now

function compile(prop, name) {
  var output = {};

  if (prop.__params) return prop.__params;

  var str = prop.toString(),
      //.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1'), // String representation of function sans comments
  token = tokenizer(str, {
    ecmaVersion: 6,
    sourceType: 'script'
  }),
      finishedPaths = [],
      listening = 0,
      paths = [],
      attrs = [],
      workingpath = [];

  do {

    // console.log(token.type.label, token.value);
    token.nextToken();

    if (token.value === 'this') {
      listening++;
      workingpath = [];
    }

    // TODO: handle gets on collections
    if (token.value === 'get') {
      token.nextToken();
      while (_.isUndefined(token.value)) {
        token.nextToken();
      }
      // Replace any access to a collection with the generic @each placeholder and push dependancy
      workingpath.push(token.value.replace(/\[.+\]/g, ".@each").replace(/^\./, ''));
    }

    if (token.value === 'pluck') {
      token.nextToken();
      while (_.isUndefined(token.value)) {
        token.nextToken();
      }

      workingpath.push('@each.' + token.value);
    }

    if (token.value === 'slice' || token.value === 'clone' || token.value === 'filter') {
      token.nextToken();
      if (token.type.label === '(') workingpath.push('@each');
    }

    if (token.value === 'at') {
      token.nextToken();
      while (_.isUndefined(token.value)) {
        token.nextToken();
      }
      workingpath.push('@each');
    }

    if (token.value === 'where' || token.value === 'findWhere') {
      workingpath.push('@each');
      token.nextToken();
      attrs = [];
      var itr = 0;
      while (token.type.label !== ')') {
        if (token.value) {
          if (itr % 2 === 0) {
            attrs.push(token.value);
          }
          itr++;
        }
        token.nextToken();
      }
      workingpath.push(attrs);
    }

    if (listening && (_.indexOf(TERMINATORS, token.type.label) > -1 || _.indexOf(TERMINATORS, token.value) > -1)) {
      workingpath = _.reduce(workingpath, reduceMemos, ['']);
      finishedPaths = _.compact(_.union(finishedPaths, workingpath));
      workingpath = [];
      listening--;
    }
  } while (token.start !== token.end && token.type !== _acorn.tokTypes.eof);

  // Save our finished paths directly on the function
  prop.__params = finishedPaths;

  // Return the dependancies list
  return finishedPaths;
}

exports.default = { compile: compile };
},{"acorn":44}],3:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _parser = require("rebound-compiler/parser");

var _parser2 = _interopRequireDefault(_parser);

var _compile = require("rebound-htmlbars/compile");

var _reboundHtmlbars = require("rebound-htmlbars/rebound-htmlbars");

var _render = require("rebound-htmlbars/render");

var _render2 = _interopRequireDefault(_render);

var _factory = require("rebound-component/factory");

var _factory2 = _interopRequireDefault(_factory);

var _loader = require("rebound-router/loader");

var _loader2 = _interopRequireDefault(_loader);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Rebound Compiler
// ----------------

function compile(str) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  /* jshint evil: true */

  // Parse the component
  var defs = (0, _parser2.default)(str, options);

  // Compile our template
  defs.template = (0, _compile.compile)(defs.template);

  // For client side rendered templates, put the render function directly on the
  // template result for convenience. To sue templates rendered server side will
  // consumers will have to invoke the view layer's render function themselves.
  defs.template.render = function (el, data, options) {
    return (0, _render2.default)(el, this, data, options);
  };

  // Fetch any dependancies
  _loader2.default.load(defs.deps);

  // If this is a partial, register the partial
  if (defs.isPartial) {
    if (options.name) {
      (0, _reboundHtmlbars.registerPartial)(options.name, defs.template);
    }
    return defs.template;
  }

  // If this is a component, register the component
  else {
      return _factory2.default.registerComponent(defs.name, {
        prototype: new Function("return " + defs.script)(),
        template: defs.template,
        stylesheet: defs.stylesheet
      });
    }
}

exports.default = { compile: compile };
},{"rebound-compiler/parser":4,"rebound-component/factory":6,"rebound-htmlbars/compile":11,"rebound-htmlbars/rebound-htmlbars":34,"rebound-htmlbars/render":35,"rebound-router/loader":36}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
// Rebound Template Parser
// -----------------------

// Remove the contents of the component's `script` tag.
function getScript(str) {
  var start = str.lastIndexOf('</template>');
  str = str.slice(start > -1 ? start : 0, str.length);
  start = str.indexOf('<script>');
  var end = str.lastIndexOf('</script>');

  if (start > -1 && end > -1) return '(function(){' + str.substring(start + 8, end) + '})()';
  return '{}';
}

// Remove the contents of the component's `style` tag.
function getStyle(str) {
  var start = str.indexOf("<style>");
  var end = str.indexOf("</style>");
  return start > -1 && end > -1 ? str.substr(start + 7, end - (start + 7)).replace(/"/g, "\\\"") : "";
}

function stripLinkTags(str) {
  // Remove link tags from template, these are fetched in getDependancies
  return str.replace(/<link .*href=(['"]?)(.*).html\1[^>]*>/gi, '');
}

// Remove the contents of the component's `template` tag.
function getTemplate(str) {
  var start = str.indexOf("<template>");
  var end = str.lastIndexOf('</template>');

  // Get only the content between the template tags, or set to an empty string.
  str = start > -1 && end > -1 ? str.substring(start + 10, end) : '';

  return stripLinkTags(str);
}

// Get the component's name from its `name` attribute.
function getName(str) {
  return str.replace(/[^]*?<element[^>]*name=(["'])?([^'">\s]+)\1[^<>]*>[^]*/ig, "$2").trim();
}

// Minify the string passed in by replacing all whitespace.
function minify(str) {
  return str.replace(/\s+/g, " ").replace(/\n|(>) (<)/g, "$1$2");
}

// Strip javascript comments
function removeComments(str) {
  return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s])+\/\/(?:.*)$)/gm, "$1");
}

// TODO: This is messy, clean it up!
function getDependancies(template) {
  var imports = [],
      partials = [],
      deps = [],
      match,
      importsre = /<link [^h]*href=(['"])?\/?([^.'"]*).html\1[^>]*>/gi,
      partialsre = /\{\{>\s*?(['"])?([^'"}\s]*)\1\s*?\}\}/gi,
      helpersre = /\{\{partial\s*?(['"])([^'"}\s]*)\1\s*?\}\}/gi,
      start = template.indexOf("<template>"),
      end = template.lastIndexOf('</template>');

  if (start > -1 && end > -1) {
    template = template.substring(start + 10, end);
  }

  // Assemble our imports dependancies
  (template.match(importsre) || []).forEach(function (importString, index) {
    deps.push(importString.replace(importsre, '$2'));
  });

  // Assemble our partial dependancies
  (template.match(partialsre) || []).forEach(function (partial, index) {
    deps.push(partial.replace(partialsre, '$2'));
  });

  // Assemble our partial dependancies
  (template.match(helpersre) || []).forEach(function (partial, index) {
    deps.push(partial.replace(helpersre, '$2'));
  });

  return deps;
}

function parse(str) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  // If the element tag is present
  if (str.indexOf('<element') > -1 && str.indexOf('</element>') > -1) {
    return {
      isPartial: false,
      name: getName(str),
      stylesheet: getStyle(str),
      template: getTemplate(str),
      script: getScript(str),
      deps: getDependancies(str)
    };
  }

  return {
    isPartial: true,
    name: options.name,
    template: stripLinkTags(str),
    deps: getDependancies(str)
  };
}

exports.default = parse;
},{}],5:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; // Rebound Component
// ----------------

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _backbone = require("backbone");

var _backbone2 = _interopRequireDefault(_backbone);

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundData = require("rebound-data/rebound-data");

var _render2 = require("rebound-htmlbars/render");

var _render3 = _interopRequireDefault(_render2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// New Backbone Component
var Component = _reboundData.Model.extend({

  isComponent: true,
  isHydrated: true,
  defaults: {},

  // A method that returns a root scope by default. Meant to be overridden on
  // instantiation if applicable.
  __path: function __path() {
    return this._scope || '';
  },

  constructor: function constructor(el, data, options) {

    // Ensure options is an object
    options || (options = {});

    // Bind certian methods to ensure they are run in the context of our Component
    _.bindAll(this, '_callOnComponent', '_listenToService');

    // Set instance cid and caches for this Component
    this.cid = _reboundUtils.$.uniqueId('component');
    this.attributes = {};
    this.changed = {};
    this.consumers = [];
    this.services = {};
    this.loadCallbacks = [];
    this.options = options;

    // If we are told this is not a hydrated component, mark it as such
    if (options.isHydrated === false) {
      this.isHydrated = false;
    }

    // Components are always the top of their data tree. Set parent and root to itself.
    this.__parent__ = this.__root__ = this;

    // Take our parsed data and add it to our backbone data structure. Does a deep defaults set.
    // In the model, primatives (arrays, objects, etc) are converted to Backbone Objects
    // Functions are compiled to find their dependancies and added as computed properties
    // Set our component's context with the passed data merged with the component's defaults
    this.set(this.defaults || {});
    this.set(data || {});

    // Get any additional routes passed in from options
    this.routes = _.defaults(options.routes || {}, this.routes);

    // Ensure that all route functions exist
    _.each(this.routes, function (value, key, routes) {
      if (typeof value !== 'string') {
        throw 'Function name passed to routes in  ' + this.tagName + ' component must be a string!';
      }
      if (!this[value]) {
        throw 'Callback function ' + value + ' does not exist on the  ' + this.tagName + ' component!';
      }
    }, this);

    // Set or create our element and template if we have them
    this.el = el || document.createDocumentFragment();
    this.$el = _.isFunction(_backbone2.default.$) ? _backbone2.default.$(this.el) : false;

    // Render our dom and place the dom in our custom element
    this.render();

    // Add active class to this newly rendered template's link elements that require it
    (0, _reboundUtils.$)(this.el).markLinks();

    // Call user provided initialize
    this.initialize();

    return this;
  },
  _callOnComponent: function _callOnComponent(name, event) {
    if (!_.isFunction(this[name])) {
      throw "ERROR: No method named " + name + " on component " + this.tagName + "!";
    }
    return this[name].call(this, event);
  },
  _listenToService: function _listenToService(key, service) {
    var _this = this;

    var self = this;
    this.listenTo(service, 'all', function (type, model, value) {
      var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

      var attr,
          oldScope = service._scope,
          path = model.__path(),
          changed;

      // TODO: Find a better way to get service keys in their path() method based on call Scope
      // Services may be installed at any location. In order for the __path() method
      // to include this location in the correct context, it needs to have contextual
      // knowledge of what called it. For the lifetime of this event tree, re-write
      // its scope property appropreately. Re-set it to previous value when done.
      service._scope = key;

      if (type.indexOf('change:') === 0) {
        changed = model.changedAttributes();
        for (attr in changed) {
          // TODO: Modifying arguments array is bad. change this
          type = 'change:' + key + '.' + path + (path && '.') + attr; // jshint ignore:line
          _this.trigger.call(_this, type, model, value, options);
        }
      } else {
        _this.trigger.call(_this, type, model, value, options);
      }
      service._scope = oldScope;
    });
  },

  // Render our dom and place the dom in our custom element
  // TODO: Check if template is a string, and if the compiler exists on the page, and compile if needed
  render: function render() {
    (0, _reboundUtils.$)(this.el).empty();
    (0, _render3.default)(this.el, this[_reboundUtils.REBOUND_SYMBOL].template, this);
  },
  deinitialize: function deinitialize() {
    var _this2 = this;

    if (this.consumers.length) {
      return void 0;
    }
    _.each(this.services, function (service, key) {
      _.each(service.consumers, function (consumer, index) {
        if (consumer.component === _this2) service.consumers.splice(index, 1);
      });
    });
    delete this.services;
    _reboundData.Model.prototype.deinitialize.apply(this, arguments);
  },

  // LazyComponents have an onLoad function that calls all the registered callbacks
  // after it has been hydrated. If we are calling onLoad on an already loaded
  // component, just call the callback provided.
  onLoad: function onLoad(cb) {
    if (!this.isHydrated) {
      this.loadCallbacks.push(cb);
    } else {
      cb(this);
    }
  },

  // Set is overridden on components to accept components as a valid input type.
  // Components set on other Components are mixed in as a shared object. {raw: true}
  // It also marks itself as a consumer of this component
  set: function set(key, val, options) {
    var attrs, attr, serviceOptions;
    if ((typeof key === "undefined" ? "undefined" : _typeof(key)) === 'object') {
      attrs = key.isModel ? key.attributes : key;
      options = val;
    } else (attrs = {})[key] = val;
    options || (options = {});

    // If reset option passed, do a reset. If nothing passed, return.
    if (options.reset === true) return this.reset(attrs, options);
    if (options.defaults === true) this.defaults = attrs;
    if (_.isEmpty(attrs)) {
      return void 0;
    }

    // For each attribute passed:
    for (key in attrs) {
      attr = attrs[key];
      if (attr && attr.isComponent) {
        if (attr.isLazyComponent && attr._component) {
          attr = attr._component;
        }
        serviceOptions || (serviceOptions = _.defaults(_.clone(options), { raw: true }));
        attr.consumers.push({ key: key, component: this });
        this.services[key] = attr;
        this._listenToService(key, attr);
        _reboundData.Model.prototype.set.call(this, key, attr, serviceOptions);
      }
      _reboundData.Model.prototype.set.call(this, key, attr, options);
    }

    return this;
  },
  $: function $(selector) {
    if (!this.$el) {
      return console.error('No DOM manipulation library on the page!');
    }
    return this.$el.find(selector);
  },

  // Trigger all events on both the component and the element
  trigger: function trigger(eventName) {
    if (this.el) {
      (0, _reboundUtils.$)(this.el).trigger(eventName, arguments);
    }
    _backbone2.default.Model.prototype.trigger.apply(this, arguments);
  },
  _onAttributeChange: function _onAttributeChange(attrName, oldVal, newVal) {
    // Commented out because tracking attribute changes and making sure they dont infinite loop is hard.
    // TODO: Make work.
    // try{ newVal = JSON.parse(newVal); } catch (e){ newVal = newVal; }
    //
    // // data attributes should be referanced by their camel case name
    // attrName = attrName.replace(/^data-/g, "").replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
    //
    // oldVal = this.get(attrName);
    //
    // if(newVal === null){ this.unset(attrName); }
    //
    // // If oldVal is a number, and newVal is only numerical, preserve type
    // if(_.isNumber(oldVal) && _.isString(newVal) && newVal.match(/^[0-9]*$/i)){
    //   newVal = parseInt(newVal);
    // }
    //
    // else{ this.set(attrName, newVal, {quiet: true}); }
  }
});

function processProps(protoProps, staticProps) {

  var reservedMethods = {
    'trigger': 1, 'get': 1, 'set': 1, 'has': 1, 'escape': 1,
    'unset': 1, 'clear': 1, 'cid': 1, 'attributes': 1, 'hasChanged': 1,
    'changed': 1, 'toJSON': 1, 'isValid': 1, 'isNew': 1, 'validationError': 1,
    'previous': 1, 'toggle': 1, 'previousAttributes': 1, 'changedAttributes': 1
  },
      configProperties = {
    'id': 1, 'idAttribute': 1, 'url': 1, 'urlRoot': 1,
    'routes': 1, 'createdCallback': 1, 'attachedCallback': 1, 'detachedCallback': 1,
    'attributeChangedCallback': 1, 'defaults': 1
  };

  // These properties exist on all instances of the Component
  protoProps || (protoProps = {});
  protoProps.defaults = {};

  // These properties exist on the custom Component constructor
  // Ensure every constructor has a template and stylesheet
  staticProps || (staticProps = {});
  staticProps.template || (staticProps.template = null);
  staticProps.stylesheet || (staticProps.stylesheet = '');

  // Convert computed properties (getters and setters on this object) to Computed
  // Property primitives
  _reboundUtils.$.extractComputedProps(protoProps);

  // For each property passed into our component base class determine if it is
  // intended as a default value (move it into the defaults hash) or a component
  // method (leave it alone).
  for (var key in protoProps) {
    var value = protoProps[key];

    // If this isn't an actual property, keep going
    if (!protoProps.hasOwnProperty(key)) {
      continue;
    }

    // If this is a reserved property name, yell
    if (reservedMethods[key]) {
      throw "ERROR: " + key + " is a reserved method name in " + staticProps.type + "!";
    }

    // If a configuration property, or not actually on the obj, ignore it
    if (!protoProps.hasOwnProperty(key) || configProperties[key]) {
      continue;
    }

    // If a primative, backbone type object, or computed property, move it to our defaults
    if (!_.isFunction(value) || value.isComputedProto || value.isModel || value.isComponent) {
      protoProps.defaults[key] = value;
      delete protoProps[key];
    }

    // All other values are component methods, leave them be.
  }
}

Component.hydrate = function hydrateComponent() {
  var protoProps = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var staticProps = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  // If already hydrated, return.
  if (this.isHydrated) {
    return void 0;
  }

  // Process our new properties objects
  processProps(protoProps, staticProps);

  // Extend our prototype with any protoProps, overriting pre-defined ones
  if (protoProps) {
    _.extend(this.prototype, protoProps);
  }

  // Add any static props to the function object itself
  if (staticProps) {
    _.extend(this, staticProps);
  }

  // Ensure we have a type, template and stylesheet
  this.prototype[_reboundUtils.REBOUND_SYMBOL] = {
    type: staticProps.type || 'anonymous-component',
    template: staticProps.template || null,
    stylesheet: staticProps.stylesheet || '',
    isHydrated: true
  };
};

Component.extend = function extendComponent() {
  var protoProps = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var staticProps = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var parent = this,

  // Call our parent Component constructor and pass through the instance specific
  // name, template and stylesheet via options if no other name, template or
  // stylesheet is present.
  Component = function Component(type) {
    var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    return parent.call(this, type, data, options);
  },

  // Surrogate constructor allows us to inherit everything from the parent and
  // retain a referance to our component specific constructor as `this.constructor`
  // on component instances' prototype chains. This is also the object we augment
  // with additional protoProps on component hydration if needed.
  Surrogate = function Surrogate() {
    this.constructor = Component;
  };

  // Our class should inherit everything from its parent, defined above
  Surrogate.prototype = parent.prototype;
  Component.prototype = new Surrogate();

  // Set our ancestry
  Component.__super__ = parent.prototype;

  // Process our new properties objects
  processProps(protoProps, staticProps);

  // Extend our prototype with any remaining protoProps, overriting pre-defined ones
  if (protoProps) {
    _.extend(Component.prototype, protoProps);
  }

  // Add any static props to the function object itself
  if (staticProps) {
    _.extend(Component, parent, staticProps);
  }

  // Ensure we hae a type, template and stylesheet
  Component.prototype[_reboundUtils.REBOUND_SYMBOL] = {
    type: staticProps.type || 'anonymous-component',
    template: staticProps.template || null,
    stylesheet: staticProps.stylesheet || '',
    isHydrated: staticProps.hasOwnProperty('isHydrated') ? staticProps.isHydrated : true
  };

  return Component;
};

exports.default = Component;
},{"backbone":45,"rebound-data/rebound-data":10,"rebound-htmlbars/render":35,"rebound-utils/rebound-utils":41}],6:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComponentFactory = undefined;
exports.registerComponent = registerComponent;

var _reboundUtils = require("rebound-utils/rebound-utils");

var _component = require("rebound-component/component");

var _component2 = _interopRequireDefault(_component);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Rebound Component Factory
// ----------------

var REGISTRY = {};
var DUMMY_TEMPLATE = false;

// Used to transport component specific data to the native element created callback
// in leu of a good API for passing initialization data to document.createElement.
// When registry.create is called, it stashes instance data on this object in a
// shared scope. After createElement is finished, it cleans this transport object
var ELEMENT_DATA;

function registerComponent(type) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  // Ensure our options are set nicely and extract the prototype provided to us
  var proto = options.prototype || {};
  delete options.prototype;
  options.type = type;
  options.isHydrated = true;

  // If the component exists in the registry, and is already hydrated, then this
  // is a conflicting component name – exit and log an error.
  if (REGISTRY[type] && REGISTRY[type].isHydrated) {
    return console.error('A component of type', type, 'already exists!');
  }

  // If there is a non-hydrated component in the registry, hydrate it with the
  // newly provided prototype.
  if (REGISTRY[type]) {
    REGISTRY[type].hydrate(proto, options);
  }

  // Otherwise, create and save a new component subclass and register the element
  else {
      REGISTRY[type] = _component2.default.extend(proto, options);
    }

  // Create our new element prototype object
  var element = Object.create(HTMLElement.prototype, {});

  // On element creation, make a new instance of the component and attach it
  // to the element object as `data`
  element.createdCallback = function () {
    var _this = this;

    // If `this.data` already exists on this element, then it was present on the
    // page via a `new Component(component-name);` call before this component was
    // actually registered. Now, we need to finish hydrating this instance of the
    // component data object.
    if (this.data) {

      // Anything that is not already set on our component should be set to our
      // new default if it exists
      // TODO: If a default value perscribes a certain user-defined subclass
      // of Component or Model for a property already passed into a component,
      // the existing vanila Component or Model should be upgraded to that subclass
      var current = this.data.toJSON();
      var defaults = this.data.defaults;
      for (var key in defaults) {
        if ((!current.hasOwnProperty(key) || _.isUndefined(current[key])) && defaults.hasOwnProperty(key)) {
          this.data.set(key, defaults[key]);
        }
      }
      this.data.render();
      this.data.isHydrated = true;
      this.data.loadCallbacks.forEach(function (cb) {
        cb.call(_this.data, _this.data);
      });
    }

    // If we have element data, then we have come from a `new Component(component-name);`
    // call and may have been provided data to initialize with. Call the component
    // constructor with the provided properties. We don't need `new` here because
    // the instance we are building is provided for us, so we use `component.call`
    // to call the component constructor using that scope.
    else if (ELEMENT_DATA) {
        this.data = new REGISTRY[type](this, ELEMENT_DATA.data, ELEMENT_DATA.options);
      }

      // Otherwise, this is an upgraded instance of the element that was pre-existing
      // in the dom, or just created using `document.createElement`. Go ahead and
      // give it a new component object.
      else {
          this.data = new REGISTRY[type](this);
        }

    // Call user provided `attachedCallback`
    _.isFunction(proto.createdCallback) && proto.createdCallback.call(this.data);
  };

  // Call user provided `attachedCallback`
  element.attachedCallback = function () {
    _.isFunction(proto.attachedCallback) && proto.attachedCallback.call(this.data);
  };

  // Call user provided `detachedCallback`
  element.detachedCallback = function () {
    _.isFunction(proto.detachedCallback) && proto.detachedCallback.call(this.data);
  };

  // Call user provided `attributeChangedCallback`
  element.attributeChangedCallback = function (attrName, oldVal, newVal) {
    if (!this.data) {
      return;
    }
    this.data._onAttributeChange(attrName, oldVal, newVal);
    _.isFunction(proto.attributeChangedCallback) && proto.attributeChangedCallback.call(this.data, attrName, oldVal, newVal);
  };

  // Register our new element
  document.registerElement(type, { prototype: element });

  // Return the new component constructor
  return REGISTRY[type];
}

var ComponentFactory = exports.ComponentFactory = function ComponentFactory(type) {
  var data = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  // If type is not a valid component name, error
  if (typeof type !== 'string') {
    return console.error('Invalid component type provided to createComponent. Instead received:', type);
  }

  var el;

  // If this component is not in the registry, register a dehydrated component
  // as a placeholder. Once the actual component is loaded, all running instances
  // of this component type will be hydrated.
  if (!REGISTRY[type] || !REGISTRY[type].isHydrated) {
    el = document.createElement(type);
    options.isHydrated = false;
    REGISTRY[type] = REGISTRY[type] || _component2.default.extend({}, {
      isHydrated: false,
      type: type,
      template: DUMMY_TEMPLATE
    }, options);
    el.data = new REGISTRY[type](el, data, options);
  }

  // If this component is in the registry, save the instance specific data to
  // deliver to the createElement call, and create the element. As part of the
  // `createdCallback` a new instance of
  else {
      ELEMENT_DATA = { data: data, options: options };
      el = document.createElement(type);
      ELEMENT_DATA = void 0;
    }

  return el.data;
};

ComponentFactory.registerComponent = registerComponent;

exports.default = ComponentFactory;
},{"rebound-component/component":5,"rebound-utils/rebound-utils":41}],7:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; // Rebound Collection
// ----------------

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _backbone = require("backbone");

var _backbone2 = _interopRequireDefault(_backbone);

var _model = require("rebound-data/model");

var _model2 = _interopRequireDefault(_model);

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function pathGenerator(collection) {
  return function () {
    return collection.__path() + '[' + collection.indexOf(collection._byId[this.cid]) + ']';
  };
}

var Collection = _backbone2.default.Collection.extend({

  isCollection: true,
  isData: true,

  model: _model2.default,

  __path: function __path() {
    return '';
  },

  constructor: function constructor(models, options) {
    models || (models = []);
    options || (options = {});
    this._byValue = {};
    this.helpers = {};
    this.cid = _reboundUtils2.default.uniqueId('collection');

    // Set lineage
    this.setParent(options.parent || this);
    this.setRoot(options.root || this);
    this.__path = options.path || this.__path;

    _backbone2.default.Collection.apply(this, arguments);

    // When a model is removed from its original collection, destroy it
    // TODO: Fix this. Computed properties now somehow allow collection to share a model. They may be removed from one but not the other. That is bad.
    // The clone = false options is the culprit. Find a better way to copy all of the collections custom attributes over to the clone.
    this.on('remove', function (model, collection, options) {
      // model.deinitialize();
    });
  },

  get: function get(key, options) {
    var _this = this;

    // Split the path at all '.', '[' and ']' and find the value referanced.
    var parts = _.isString(key) ? _reboundUtils2.default.splitPath(key) : [],
        result = this,
        l = parts.length,
        i = 0;
    options || (options = {});

    // If the key is a number or object, or just a single string that is not a path,
    // get by id and return the first occurance
    if (typeof key == 'number' || (typeof key === "undefined" ? "undefined" : _typeof(key)) == 'object' || parts.length == 1 && !options.isPath) {
      if (key === null) {
        return void 0;
      }
      var id = this.modelId(this._isModel(key) ? key.attributes : key);
      var responses = [].concat(this._byValue[key], this._byId[key] || this._byId[id] || this._byId[key.cid]);
      var res = responses[0],
          idx = Infinity;

      responses.forEach(function (value) {
        if (!value) {
          return void 0;
        }
        var i = _.indexOf(_this.models, value);
        if (i > -1 && i < idx) {
          idx = i;res = value;
        }
      });

      return res;
    }

    // If key is not a string, return undefined
    if (!_.isString(key)) {
      return void 0;
    }

    if (_.isUndefined(key) || _.isNull(key)) {
      return key;
    }
    if (key === '' || parts.length === 0) {
      return result;
    }

    if (parts.length > 0) {
      for (i = 0; i < l; i++) {
        // If returning raw, always return the first computed property found. If undefined, you're done.
        if (result && result.isComputedProperty && options.raw) return result;
        if (result && result.isComputedProperty) result = result.value();
        if (_.isUndefined(result) || _.isNull(result)) return result;
        if (parts[i] === '@parent') result = result.__parent__;else if (result.isCollection) result = result.models[parts[i]];else if (result.isModel) result = result.attributes[parts[i]];else if (result.hasOwnProperty(parts[i])) result = result[parts[i]];
      }
    }

    if (result && result.isComputedProperty && !options.raw) result = result.value();

    return result;
  },

  set: function set(models, options) {
    var newModels = [],
        parts = _.isString(models) ? _reboundUtils2.default.splitPath(models) : [],
        res,
        lineage = {
      parent: this,
      root: this.__root__,
      path: pathGenerator(this),
      silent: true
    };
    options = options || {},

    // If no models passed, implies an empty array
    models || (models = []);

    // If models is a string, and it has parts, call set at that path
    if (_.isString(models) && parts.length > 1 && !isNaN(Number(parts[0]))) {
      var index = Number(parts[0]);
      return this.at(index).set(parts.splice(1, parts.length).join('.'), options);
    }

    // If another collection, treat like an array
    models = models.isCollection ? models.models : models;
    // Ensure models is an array
    models = !_.isArray(models) ? [models] : models;

    // If the model already exists in this collection, or we are told not to clone it, let Backbone handle the merge
    // Otherwise, create our copy of this model, give them the same cid so our helpers treat them as the same object
    // Use the more unique of the two constructors. If our Model has a custom constructor, use that. Otherwise, use
    // Collection default Model constructor.
    _.each(models, function (data, index) {
      if (data.isModel && options.clone === false || this._byId[data.cid]) return newModels[index] = data;
      var constructor = data.constructor !== Object && data.constructor !== Rebound.Model ? data.constructor : this.model;
      newModels[index] = new constructor(data, _.defaults(lineage, options));
      data.isModel && (newModels[index].cid = data.cid);
    }, this);

    // Ensure that this element now knows that it has children now. Without this cyclic dependancies cause issues
    this._hasAncestry || (this._hasAncestry = newModels.length > 0);

    // Call original set function with model duplicates
    return _backbone2.default.Collection.prototype.set.call(this, newModels, options);
  }

});

exports.default = Collection;
},{"backbone":45,"rebound-data/model":9,"rebound-utils/rebound-utils":41}],8:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; // Rebound Computed Property
// ----------------

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _backbone = require("backbone");

var _backbone2 = _interopRequireDefault(_backbone);

var _propertyCompiler = require("property-compiler/property-compiler");

var _propertyCompiler2 = _interopRequireDefault(_propertyCompiler);

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NOOP = function NOOP() {
  return void 0;
};

var TO_CALL = [];
var CALL_TIMEOUT;

// Returns true if str starts with test
function startsWith(str, test) {
  if (str === test) {
    return true;
  }
  return str.substring(0, test.length + 1) === test + '.';
}

// Push all elements in `arr` to the end of an array. Mark all Computed Properties
// as dirty on their way in.
function push(arr) {
  var i,
      len = arr.length;
  this.added || (this.added = {});
  for (i = 0; i < len; i++) {
    arr[i].markDirty();
    if (this.added[arr[i].cid]) continue;
    this.added[arr[i].cid] = 1;
    this.push(arr[i]);
  }
}

// Called after callstack is exausted to call all of this computed property's
// dependants that need to be recomputed
function recomputeCallback() {
  var len = TO_CALL.length;
  CALL_TIMEOUT = null;
  while (len--) {
    (TO_CALL.shift() || NOOP).call();
  }

  TO_CALL.added = {};
}

var ComputedProperty = function ComputedProperty(getter, setter) {
  var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  if (!_.isFunction(getter) && !_.isFunction(setter)) {
    return console.error('ComputedProperty constructor must be passed getter and setter functions!', getter, 'and', setter, 'Found instead.');
  }

  this.cid = _reboundUtils2.default.uniqueId('computedPropety');
  this.name = options.name;
  this.returnType = null;
  this.waiting = {};

  this.isChanging = false;
  this.isDirty = true;
  _.bindAll(this, 'onModify', 'markDirty');

  if (getter) {
    this.getter = getter;
  }
  if (setter) {
    this.setter = setter;
  }
  this.deps = _propertyCompiler2.default.compile(this.getter, this.name);

  // Create lineage to pass to our cache objects
  var lineage = {
    parent: this.setParent(options.parent || this),
    root: this.setRoot(options.root || options.parent || this),
    path: this.__path = options.path || this.__path
  };

  // Results Cache Objects
  // These data objects will never be re-created for the lifetime of the Computed Proeprty
  // On Recompute they are updated with new values.
  // On Change their new values are pushed to the object it is tracking
  this.cache = {
    model: new Rebound.Model({}, lineage),
    collection: new Rebound.Collection([], lineage),
    value: undefined
  };

  // Listen to objects in the cache and push changes to them on modify
  this.listenTo(this.cache.model, 'all', this.onModify);
  this.listenTo(this.cache.collection, 'all', this.onModify);

  this.wire();
};

_.extend(ComputedProperty.prototype, _backbone2.default.Events, {

  isComputedProperty: true,
  isData: true,
  __path: function __path() {
    return '';
  },

  getter: NOOP,
  setter: NOOP,

  // If the Computed Property is not already dirty, mark it as such and trigger
  // a `dirty` event.
  markDirty: function markDirty() {
    if (this.isDirty) {
      return void 0;
    }
    this.isDirty = true;
    this.trigger('dirty', this);
  },

  // Attached to listen to all events where this Computed Property's dependancies
  // are stored. See wire(). Will re-evaluate any computed properties that
  // depend on the changed data value which triggered this callback.
  onRecompute: function onRecompute(type, model, collection, options) {
    var shortcircuit = { change: 1, sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1, dirty: 1 };
    if (shortcircuit[type] || !model.isData) {
      return void 0;
    }
    model || (model = {});
    collection || (collection = {});
    options || (options = {});
    !collection.isData && (options = collection) && (collection = model);
    var path, vector;

    // Compute the path to this data object that triggered the event
    // TODO: Figure out a better way to prefix service data paths with their local path name
    vector = path = (options.service ? options.service + "." : '') + collection.__path().replace(/\.?\[.*\]/ig, '.@each');

    // If a reset event on a Model, check for computed properties that depend
    // on each changed attribute's full path.
    if (type === 'reset' && options.previousAttributes) {
      _.each(options.previousAttributes, function (value, key) {
        vector = path + (path && '.') + key;
        _.each(this.__computedDeps, function (dependants, dependancy) {
          startsWith(vector, dependancy) && push.call(TO_CALL, dependants);
        }, this);
      }, this);
    }

    // If a reset event on a Collction, check for computed properties that depend
    // on anything inside that collection.
    else if (type === 'reset' && options.previousModels) {
        _.each(this.__computedDeps, function (dependants, dependancy) {
          startsWith(dependancy, vector) && push.call(TO_CALL, dependants);
        }, this);
      }

      // If an add or remove event, check for computed properties that depend on
      // anything inside that collection or that contains that collection.
      else if (type === 'add' || type === 'remove') {
          _.each(this.__computedDeps, function (dependants, dependancy) {
            if (startsWith(dependancy, vector) || startsWith(vector, dependancy)) push.call(TO_CALL, dependants);
          }, this);
        }

        // If a change event, trigger anything that depends on that changed path.
        else if (type.indexOf('change:') === 0) {
            vector = type.replace('change:', '').replace(/\.?\[.*\]/ig, '.@each');
            _.each(this.__computedDeps, function (dependants, dependancy) {
              startsWith(vector, dependancy) && push.call(TO_CALL, dependants);
            }, this);
          }

    // Notifies all computed properties in the dependants array to recompute.
    // Push all recomputes to the end of our stack trace so all Computed Properties
    // already queued for recompute get a chance to.
    if (!CALL_TIMEOUT) {
      CALL_TIMEOUT = setTimeout(_.bind(recomputeCallback, this), 0);
    }
  },

  // Called when a Computed Property's active cache object changes.
  // Pushes any changes to Computed Property that returns a data object back to
  // the original object.
  // TODO: Will be a hair faster with individual callbacks for each event type
  onModify: function onModify(type) {
    var model = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    var collection = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

    var shortcircuit = { sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1 };
    if (this.isChanging || !this.tracking || shortcircuit[type] || ~type.indexOf('change:')) {
      return void 0;
    }
    !collection.isData && _.isObject(collection) && (options = collection) && (collection = model);

    var path = collection.__path().replace(this.__path(), '').replace(/^\./, '');

    // Need to pass isPath: true here because when syncing across computed properties
    // that return collections we may just be passing the model index for the path.
    var dest = this.tracking.get(path, { raw: true, isPath: true });

    if (_.isUndefined(dest)) {
      return void 0;
    }
    if (type === 'change' && model.changedAttributes()) {
      dest.set && dest.set(model.changedAttributes());
    } else if (type === 'reset') {
      dest.reset && dest.reset(model);
    } else if (type === 'update') {
      dest.set && dest.set(model);
    } else if (type === 'add') {
      dest.add && dest.add(model);
    } else if (type === 'remove') {
      dest.remove && dest.remove(model);
    }
    // TODO: Add sort
  },

  // Adds a litener to the root object and tells it what properties this
  // Computed Property depend on.
  // The listener will re-compute this Computed Property when any are changed.
  wire: function wire() {
    var root = this.__root__;
    var context = this.__parent__;
    root.__computedDeps || (root.__computedDeps = {});

    _.each(this.deps, function (path) {

      // For each dependancy, mark ourselves as dirty if they become dirty
      var dep = root.get(path, { raw: true, isPath: true });
      if (dep && dep.isComputedProperty) {
        dep.on('dirty', this.markDirty);
      }

      // Find actual context and path from relative paths
      var split = _reboundUtils2.default.splitPath(path);
      while (split[0] === '@parent') {
        context = context.__parent__;
        split.shift();
      }
      path = context.__path().replace(/\.?\[.*\]/ig, '.@each');
      path = path + (path && '.') + split.join('.');

      // Add ourselves as dependants
      root.__computedDeps[path] || (root.__computedDeps[path] = []);
      root.__computedDeps[path].push(this);
    }, this);

    // Ensure we only have one listener per Model at a time.
    context.off('all', this.onRecompute).on('all', this.onRecompute);
  },

  unwire: function unwire() {
    var root = this.__root__;
    var context = this.__parent__;

    _.each(this.deps, function (path) {
      var dep = root.get(path, { raw: true, isPath: true });
      if (!dep || !dep.isComputedProperty) {
        return void 0;
      }
      dep.off('dirty', this.markDirty);
    }, this);

    context.off('all', this.onRecompute);
  },

  // Call this computed property like you would with Function.call()
  call: function call() {
    var args = Array.prototype.slice.call(arguments),
        context = args.shift();
    return this.apply(context, args);
  },

  // Call this computed property like you would with Function.apply()
  // Only properties that are marked as dirty and are not already computing
  // themselves are evaluated to prevent cyclic callbacks. If any dependants
  // aren't finished computeding, we add ourselved to their waiting list.
  // Vanilla objects returned from the function are promoted to Rebound Objects.
  // Then, set the proper return type for future fetches from the cache and set
  // the new computed value. Track changes to the cache to push it back up to
  // the original object and return the value.
  apply: function apply(context, params) {

    context || (context = this.__parent__);

    // Only re-evaluate this Computed Property if this value is dirty, not already
    // evaluating, and part of a data tree.
    if (!this.isDirty || this.isChanging || !context) {
      return void 0;
    }

    // Mark this Computed Property as in the process of changing
    this.isChanging = true;

    // Check all of our dependancies to see if they are evaluating.
    // If we have a dependancy that is dirty and this isnt its first run,
    // Let this dependancy know that we are waiting for it.
    // It will re-run this Computed Property after it finishes.
    _.each(this.deps, function (dep) {
      var dependancy = context.get(dep, { raw: true, isPath: true });
      if (!dependancy || !dependancy.isComputedProperty) {
        return void 0;
      }
      if (dependancy.isDirty && dependancy.returnType !== null) {
        dependancy.waiting[this.cid] = this;
        dependancy.apply(); // Try to re-evaluate this dependancy if it is dirty
        if (dependancy.isDirty) {
          return this.isChanging = false;
        }
      }
      delete dependancy.waiting[this.cid];
      // TODO: There can be a check here looking for cyclic dependancies.
    }, this);

    if (!this.isChanging) {
      return void 0;
    }

    // Run our getter method to fetch the new result value and retreive current
    // value from the cache
    var result = this.getter.apply(context, params);
    var value = this.cache[this.returnType];

    // Promote vanilla objects to Rebound Data keeping the same original objects
    if (_.isArray(result)) {
      result = new Rebound.Collection(result, { clone: false });
    } else if (_.isObject(result) && !result.isData) {
      result = new Rebound.Model(result, { clone: false });
    }

    // If result is undefined, reset our cache item
    if (_.isUndefined(result) || _.isNull(result)) {
      this.returnType = 'value';
      this.isCollection = this.isModel = false;
      this.set(undefined);
    }

    // Set result and return types, bind events
    // Use .set instead of .reset to trigger individual changes for internal models
    else if (result.isCollection) {
        this.returnType = 'collection';
        this.isCollection = true;
        this.isModel = false;
        this.set(result);
        this.track(result);
      }

      // If this is a model, set the return types and bind events.
      // If this model is the same as a previus run, just apply the changes to it.
      // If this is a different model, reset all of the values to the new ones.
      else if (result.isModel) {
          this.returnType = 'model';
          this.isCollection = false;
          this.isModel = true;
          this.reset(result);
          this.track(result);
        }

        // Otherwise, result is a primitive. Set values appropreately.
        else {
            this.returnType = 'value';
            this.isCollection = this.isModel = false;
            this.set(result);
          }

    return this.value();
  },

  // When we receive a new model to set in our cache, unbind the tracker from
  // the previous cache object, sync the objects' cids so helpers think they
  // are the same object, save a referance to the object we are tracking,
  // and re-bind our onModify hook.
  track: function track(object) {
    var target = this.value();
    if (!object || !target || !target.isData || !object.isData) {
      return void 0;
    }
    target._cid || (target._cid = target.cid);
    object._cid || (object._cid = object.cid);
    target.cid = object.cid;
    this.tracking = object;
  },

  // Get from the Computed Property's cache
  get: function get(key) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    if (this.returnType === 'value') {
      return console.error('Called get on the `' + this.name + '` computed property which returns a primitive value.');
    }
    return this.value().get(key, options);
  },

  // Set the Computed Property's cache to a new value and trigger appropreate events.
  // Changes will propagate back to the original object if a Rebound Data Object and re-compute.
  // If Computed Property returns a value, all downstream dependancies will re-compute.
  set: function set(key, val) {
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

    if (this.returnType === null) {
      return void 0;
    }
    var attrs = key;
    var value = this.value();

    // Noralize the data passed in
    if (this.returnType === 'model') {
      if ((typeof key === "undefined" ? "undefined" : _typeof(key)) === 'object') {
        attrs = key.isModel ? key.attributes : key;
        options = val || {};
      } else {
        (attrs = {})[key] = val;
      }
    }
    if (this.returnType !== 'model') {
      options = val || {};
    }
    attrs = attrs && attrs.isComputedProperty ? attrs.value() : attrs;

    // If a new value, set it and trigger events
    this.setter && this.setter.call(this.__root__, attrs);

    if (this.returnType === 'value' && this.cache.value !== attrs) {
      this.cache.value = attrs;
      if (!options.quiet) {
        // If set was called not through computedProperty.call(), this is a fresh new event burst.
        if (!this.isDirty && !this.isChanging) this.__parent__.changed = {};
        this.__parent__.changed[this.name] = attrs;
        this.trigger('change', this.__parent__);
        this.trigger('change:' + this.name, this.__parent__, attrs);
        delete this.__parent__.changed[this.name];
      }
    } else if (this.returnType !== 'value' && options.reset) {
      key = value.reset(attrs, options);
    } else if (this.returnType !== 'value') {
      key = value.set(attrs, options);
    }
    this.isDirty = this.isChanging = false;

    // Call all reamining computed properties waiting for this value to resolve.
    _.each(this.waiting, function (prop) {
      prop && prop.call();
    });

    return key;
  },

  // Return the current value from the cache, running if dirty.
  value: function value() {
    if (this.isDirty) {
      this.apply();
    }
    return this.cache[this.returnType];
  },

  // Reset the current value in the cache, unless if first run.
  reset: function reset(obj) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    if (_.isNull(this.returnType)) {
      return void 0;
    }
    options.reset = true;
    return this.set(obj, options);
  },

  // Cyclic dependancy safe toJSON method.
  toJSON: function toJSON() {
    if (this._isSerializing) {
      return this.cid;
    }
    var val = this.value();
    this._isSerializing = true;
    var json = val && _.isFunction(val.toJSON) ? val.toJSON() : val;
    this._isSerializing = false;
    return json;
  }

});

exports.default = ComputedProperty;
},{"backbone":45,"property-compiler/property-compiler":2,"rebound-utils/rebound-utils":41}],9:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; // Rebound Model
// ----------------

// Rebound **Models** are the basic data object in the framework - frequently
// representing a row in a table in a database on your server. The inherit from
// Backbone Models and have all of the same useful methods you are used to for
// performing computations and transformations on that data. Rebound augments
// Backbone Models by enabling deep data nesting. You can now have **Rebound Collections**
// and **Rebound Computed Properties** as properties of the Model.

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _backbone = require("backbone");

var _backbone2 = _interopRequireDefault(_backbone);

var _computedProperty = require("rebound-data/computed-property");

var _computedProperty2 = _interopRequireDefault(_computedProperty);

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Returns a function that, when called, generates a path constructed from its
// parent's path and the key it is assigned to. Keeps us from re-naming children
// when parents change.
function pathGenerator(parent, key) {
  return function () {
    var path = parent.__path();
    return path + (path === '' ? '' : '.') + key;
  };
}

var Model = _backbone2.default.Model.extend({
  // Set this object's data types
  isModel: true,
  isData: true,

  // A method that returns a root path by default. Meant to be overridden on
  // instantiation.
  __path: function __path() {
    return '';
  },

  // Create a new Model with the specified attributes. The Model's lineage is set
  // up here to keep track of it's place in the data tree.
  constructor: function constructor(attributes) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var self = this;
    if (attributes === null || attributes === undefined) {
      attributes = {};
    }
    attributes.isModel && (attributes = attributes.attributes);
    this.helpers = {};
    this.defaults = this.defaults || {};
    this.setParent(options.parent || this);
    this.setRoot(options.root || this);
    this.__path = options.path || this.__path;

    // Convert getters and setters to computed properties
    _reboundUtils2.default.extractComputedProps(attributes);

    _backbone2.default.Model.call(this, attributes, options);
  },

  // New convenience function to toggle boolean values in the Model.
  toggle: function toggle(attr, options) {
    options = options ? _.clone(options) : {};
    var val = this.get(attr);
    if (!_.isBoolean(val)) console.error('Tried to toggle non-boolean value ' + attr + '!', this);
    return this.set(attr, !val, options);
  },

  destroy: function destroy(options) {
    options = options ? _.clone(options) : {};
    var model = this;
    var success = options.success;
    var wait = options.wait;

    var destroy = function destroy() {
      model.trigger('destroy', model, model.collection, options);
    };

    options.success = function (resp) {
      if (wait) {
        destroy();
      }
      if (success) {
        success.call(options.context, model, resp, options);
      }
      if (!model.isNew()) {
        model.trigger('sync', model, resp, options);
      }
    };

    var xhr = false;
    if (this.isNew()) {
      _.defer(options.success);
    } else {
      wrapError(this, options);
      xhr = this.sync('delete', this, options);
    }
    if (!wait) {
      destroy();
    }
    return xhr;
  },

  // Model Reset does a deep reset on the data tree starting at this Model.
  // A `previousAttributes` property is set on the `options` property with the Model's
  // old values.
  reset: function reset(obj, options) {
    var changed = {},
        key,
        value;
    options || (options = {});
    options.reset = true;
    obj = obj && obj.isModel && obj.attributes || obj || {};
    options.previousAttributes = _.clone(this.attributes);

    // Any unset previously existing values will be set back to default
    _.each(this.defaults, function (val, key) {
      if (!obj.hasOwnProperty(key)) {
        obj[key] = val;
      }
    }, this);

    // Iterate over the Model's attributes:
    // - If the property is the `idAttribute`, skip.
    // - If the properties are already the same, skip
    // - If the property is currently undefined and being changed, assign
    // - If the property is a `Model`, `Collection`, or `ComputedProperty`, reset it.
    // - If the passed object has the property, set it to the new value.
    // - If the Model has a default value for this property, set it back to default.
    // - Otherwise, unset the attribute.
    for (key in this.attributes) {
      value = this.attributes[key];
      if (value === obj[key]) {
        continue;
      } else if (_.isUndefined(value) && !_.isUndefined(obj[key])) {
        changed[key] = obj[key];
      } else if (value.isComponent) {
        continue;
      } else if (value.isCollection || value.isModel || value.isComputedProperty) {
        value.reset(obj[key] || [], { silent: true });
        if (value.isCollection) changed[key] = value.previousModels;else if (value.isModel && value.isComputedProperty) changed[key] = value.cache.model.changedAttributes();else if (value.isModel) changed[key] = value.changedAttributes();
      } else if (obj.hasOwnProperty(key)) {
        changed[key] = obj[key];
      } else {
        changed[key] = undefined;
        this.unset(key, { silent: true });
      }
    }

    // Any new values will be set to on the model
    _.each(obj, function (val, key) {
      if (_.isUndefined(changed[key])) {
        changed[key] = val;
      }
    });

    // Reset our model
    obj = this.set(obj, _.extend({}, options, { silent: true, reset: false }));

    // Trigger custom reset event
    this.changed = changed;
    if (!options.silent) {
      this.trigger('reset', this, options);
    }

    // Return new values
    return obj;
  },

  // **Model.Get** is overridden to provide support for getting from a deep data tree.
  // `key` may now be any valid json-like identifier. Ex: `obj.coll[3].value`.
  // It needs to traverse `Models`, `Collections` and `Computed Properties` to
  // find the correct value.
  // - If key is undefined, return `undefined`.
  // - If key is empty string, return `this`.
  //
  // For each part:
  // - If a `Computed Property` and `options.raw` is true, return it.
  // - If a `Computed Property` traverse to its value.
  // - If not set, return its falsy value.
  // - If a `Model` or `Collection`, traverse to it.
  get: function get(key, options) {
    options || (options = {});
    var parts = _reboundUtils2.default.splitPath(key),
        result = this,
        i,
        l = parts.length;

    if (_.isUndefined(key) || _.isNull(key)) {
      return void 0;
    }
    if (key === '' || parts.length === 0) {
      return result;
    }

    for (i = 0; i < l; i++) {
      if (result && result.isComputedProperty && options.raw) return result;
      if (result && result.isComputedProperty) result = result.value();
      if (_.isUndefined(result) || _.isNull(result)) return result;
      if (parts[i] === '@parent') result = result.__parent__;else if (result.isCollection) result = result.models[parts[i]];else if (result.isModel) result = result.attributes[parts[i]];else if (result && result.hasOwnProperty(parts[i])) result = result[parts[i]];
    }

    if (result && result.isComputedProperty && !options.raw) result = result.value();
    return result;
  },

  // **Model.Set** is overridden to provide support for getting from a deep data tree.
  // `key` may now be any valid json-like identifier. Ex: `obj.coll[3].value`.
  // It needs to traverse `Models`, `Collections` and `Computed Properties` to
  // find the correct value to call the original `Backbone.Set` on.
  set: function set(key, value, options) {
    var _this = this;

    var attrs,
        newKey,
        destination,
        props = [];

    if ((typeof key === "undefined" ? "undefined" : _typeof(key)) === 'object') {
      attrs = key.isModel ? key.attributes : key;
      options = value;
    } else (attrs = {})[key] = value;
    options || (options = {});

    // Convert getters and setters to computed properties
    _reboundUtils2.default.extractComputedProps(attrs);

    // If reset option passed, do a reset. If nothing passed, return.
    if (options.reset === true) return this.reset(attrs, options);
    if (options.defaults === true) this.defaults = attrs;
    if (_.isEmpty(attrs)) {
      return void 0;
    }

    // For each attribute passed:
    var _loop = function _loop() {
      var val = attrs[key],
          paths = _reboundUtils2.default.splitPath(key),
          attr = paths.pop() || '',
          // The key          ex: foo[0].bar --> bar
      target = _this.get(paths.join('.')),
          // The element    ex: foo.bar.baz --> foo.bar
      lineage = undefined;

      // If target currently doesnt exist, construct its tree
      if (_.isUndefined(target)) {
        target = _this;
        _.each(paths, function (part) {
          var tmp = target.get(part);
          if (_.isUndefined(tmp)) tmp = target.set(part, {}).get(part);
          target = tmp;
        }, _this);
      }

      // The old value of `attr` in `target`
      destination = target.get(attr, { raw: true }) || {};

      // Create this new object's lineage.
      lineage = {
        name: key,
        parent: target,
        root: _this.__root__,
        path: pathGenerator(target, attr),
        silent: true,
        defaults: options.defaults
      };
      // - If val is `null` or `undefined`, set to default value.
      // - If val is a `Computed Property`, get its current cache object.
      // - If val (default value or evaluated computed property) is `null`, set to default value or (fallback `undefined`).
      // - Else If val is a primitive object instance, convert to primitive value.
      // - Else If `{raw: true}` option is passed, set the exact object that was passed. No promotion to a Rebound Data object.
      // - Else If this function is the same as the current computed property, continue.
      // - Else If this value is a `Function`, turn it into a `Computed Property`.
      // - Else If this is going to be a cyclical dependancy, use the original object, don't make a copy.
      // - Else If updating an existing object with its respective data type, let Backbone handle the merge.
      // - Else If this value is a `Model` or `Collection`, create a new copy of it using its constructor, preserving its defaults while ensuring no shared memory between objects.
      // - Else If this value is an `Array`, turn it into a `Collection`.
      // - Else If this value is a `Object`, turn it into a `Model`.
      // - Else val is a primitive value, set it accordingly.

      if (_.isNull(val) || _.isUndefined(val)) val = _this.defaults[key];
      if (val && val.isComputedProperty) val = val.value();
      if (_.isNull(val) || _.isUndefined(val)) val = undefined;else if (val instanceof String) val = String(val);else if (val instanceof Number) val = Number(val);else if (val instanceof Boolean) val = Boolean(val.valueOf());else if (options.raw === true) val = val;else if (destination.isComputedProperty && destination.func === val) return "continue";else if (val.isComputedProto) val = new _computedProperty2.default(val.get, val.set, lineage);else if (val.isData && target.hasParent(val)) val = val;else if (destination.isComputedProperty || destination.isCollection && (_.isArray(val) || val.isCollection) || destination.isModel && (_.isObject(val) || val.isModel)) {
        destination.set(val, options);
        return "continue";
      } else if (val.isData && options.clone !== false) val = new val.constructor(val.attributes || val.models, lineage);else if (_.isArray(val)) val = new Rebound.Collection(val, lineage); // TODO: Remove global referance
      else if (_.isObject(val)) val = new Model(val, lineage);

      // If val is a data object, let this object know it is now a parent
      _this._hasAncestry = val && val.isData || false;

      // Set the value
      _backbone2.default.Model.prototype.set.call(target, attr, val, options); // TODO: Event cleanup when replacing a model or collection with another value
    };

    for (key in attrs) {
      var _ret = _loop();

      if (_ret === "continue") continue;
    }

    return this;
  },

  // Recursive `toJSON` function traverses the data tree returning a JSON object.
  // If there are any cyclic dependancies the object's `cid` is used instead of looping infinitely.
  toJSON: function toJSON() {
    if (this._isSerializing) {
      return this.id || this.cid;
    }
    this._isSerializing = true;
    var json = _.clone(this.attributes);
    _.each(json, function (value, name) {
      if (_.isNull(value) || _.isUndefined(value)) {
        return void 0;
      }
      _.isFunction(value.toJSON) && (json[name] = value.toJSON());
    });
    this._isSerializing = false;
    return json;
  }

});

// If default properties are passed into extend, process the computed properties
Model.extend = function (protoProps, staticProps) {
  _reboundUtils2.default.extractComputedProps(protoProps.defaults);
  return _backbone2.default.Model.extend.call(this, protoProps, staticProps);
};

exports.default = Model;
},{"backbone":45,"rebound-data/computed-property":8,"rebound-utils/rebound-utils":41}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ComputedProperty = exports.Collection = exports.Model = undefined;

var _model = require("rebound-data/model");

var _model2 = _interopRequireDefault(_model);

var _collection = require("rebound-data/collection");

var _collection2 = _interopRequireDefault(_collection);

var _computedProperty = require("rebound-data/computed-property");

var _computedProperty2 = _interopRequireDefault(_computedProperty);

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Rebound Data
// ----------------
// These are methods inherited by all Rebound data types: **Models**,
// **Collections** and **Computed Properties**. Controls tree ancestry
// tracking, deep event propagation and tree destruction.

var sharedMethods = {
  // When a change event propagates up the tree it modifies the path part of
  // `change:<path>` to reflect the fully qualified path relative to that object.
  // Ex: Would trigger `change:val`, `change:[0].val`, `change:arr[0].val` and `obj.arr[0].val`
  // on each parent as it is propagated up the tree.
  propagateEvent: function propagateEvent(type, model) {
    if (this.__parent__ === this || type === 'dirty') {
      return void 0;
    }
    if (type.indexOf('change:') === 0 && model.isModel) {
      if (this.isCollection && ~type.indexOf('change:[')) {
        return void 0;
      }
      var key,
          path = model.__path().replace(this.__parent__.__path(), '').replace(/^\./, ''),
          changed = model.changedAttributes();

      for (key in changed) {
        // TODO: Modifying arguments array is bad. change this
        arguments[0] = 'change:' + path + (path && '.') + key; // jshint ignore:line
        this.__parent__.trigger.apply(this.__parent__, arguments);
      }
      return void 0;
    }
    return this.__parent__.trigger.apply(this.__parent__, arguments);
  },

  // Set this data object's parent to `parent` and, as long as a data object is
  // not its own parent, propagate every event triggered on `this` up the tree.
  setParent: function setParent(parent) {
    if (this.__parent__) {
      this.off('all', this.propagateEvent);
    }
    this.__parent__ = parent;
    this._hasAncestry = true;
    if (parent !== this) {
      this.on('all', this.__parent__.propagateEvent);
    }
    return parent;
  },

  // Recursively set a data tree's root element starting with `this` to the deepest child.
  // TODO: I dont like this recursively setting elements root when one element's root changes. Fix this.
  setRoot: function setRoot(root) {
    var obj = this;
    obj.__root__ = root;
    var val = obj.models || obj.attributes || obj.cache;
    _.each(val, function (value, key) {
      if (value && value.isData) {
        value.setRoot(root);
      }
    });
    return root;
  },

  // Tests to see if `this` has a parent `obj`.
  hasParent: function hasParent(obj) {
    var tmp = this;
    while (tmp !== obj) {
      tmp = tmp.__parent__;
      if (_.isUndefined(tmp)) return false;
      if (tmp === obj) return true;
      if (tmp.__parent__ === tmp) return false;
    }
    return true;
  },

  // De-initializes a data tree starting with `this` and recursively calling `deinitialize()` on each child.
  deinitialize: function deinitialize() {
    var _this = this;

    // Undelegate Backbone Events from this data object
    if (this.undelegateEvents) {
      this.undelegateEvents();
    }
    if (this.stopListening) {
      this.stopListening();
    }
    if (this.off) {
      this.off();
    }
    if (this.unwire) {
      this.unwire();
    }

    // Destroy this data object's lineage
    delete this.__parent__;
    delete this.__root__;
    delete this.__path;

    // If there is a dom element associated with this data object, destroy all listeners associated with it.
    // Remove all event listeners from this dom element, recursively remove element lazyvalues,
    // and then remove the element referance itself.
    if (this.el) {
      _.each(this.el.__listeners, function (handler, eventType) {
        if (this.el.removeEventListener) {
          this.el.removeEventListener(eventType, handler, false);
        }
        if (this.el.detachEvent) {
          this.el.detachEvent('on' + eventType, handler);
        }
      }, this);
      (0, _reboundUtils2.default)(this.el).walkTheDOM(function (el) {
        if (el.__lazyValue && el.__lazyValue.destroy()) {
          n.__lazyValue.destroy();
        }
      });
      delete this.el.__listeners;
      delete this.el.__events;
      delete this.$el;
      delete this.el;
    }

    // Clean up Hook callback references
    delete this.__observers;

    // Mark as deinitialized so we don't loop on cyclic dependancies.
    this.deinitialized = true;

    // Destroy all children of this data object.
    // If a Collection, de-init all of its Models, if a Model, de-init all of its
    // Attributes that aren't services, if a Computed Property, de-init its Cache objects.
    _.each(this.models, function (val) {
      val && val.deinitialize && val.deinitialize();
    });
    this.models && (this.models.length = 0);
    _.each(this.attributes, function (val, key) {
      delete _this.attributes[key];
      val && !val.isComponent && val.deinitialize && val.deinitialize();
    });
    if (this.cache) {
      this.cache.collection.deinitialize();
      this.cache.model.deinitialize();
    }
  }
};

// Extend all of the **Rebound Data** prototypes with these shared methods
_.extend(_model2.default.prototype, sharedMethods);
_.extend(_collection2.default.prototype, sharedMethods);
_.extend(_computedProperty2.default.prototype, sharedMethods);

exports.Model = _model2.default;
exports.Collection = _collection2.default;
exports.ComputedProperty = _computedProperty2.default;
exports.default = { Model: _model2.default, Collection: _collection2.default, ComputedProperty: _computedProperty2.default };
},{"rebound-data/collection":7,"rebound-data/computed-property":8,"rebound-data/model":9,"rebound-utils/rebound-utils":41}],11:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.compile = compile;
exports.precompile = precompile;

var _htmlbars = require("htmlbars");

// Return an executable function (object) version of the compiled template string
function compile(string) {
  return new Function("return " + (0, _htmlbars.compileSpec)(string))(); // jshint ignore:line
}

// Return a precompiled (string) version of the compiled template string
function precompile(string) {
  return (0, _htmlbars.compileSpec)(string);
}
},{"htmlbars":95}],12:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.hasHelper = hasHelper;
exports.lookupHelper = lookupHelper;
exports.registerHelper = registerHelper;

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _lazyValue = require("rebound-htmlbars/lazy-value");

var _lazyValue2 = _interopRequireDefault(_lazyValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Rebound Helpers
// ----------------

var HELPERS = {};

function NOOP() {
  return '';
}

function hasHelper(env, scope, name) {
  env && env.helpers || (env = { helpers: HELPERS });
  return !!(HELPERS[name] || env.helpers[name]);
}

// lookupHelper returns the given function from the helpers object. Manual checks prevent user from overriding reserved words.
function lookupHelper(env, scope, name) {
  if (_.isString(env)) {
    name = env;
  }
  env && env.helpers || (env = { helpers: HELPERS });

  // If `name` is a reserved helper, return it
  if (name === 'length') return HELPERS.length;
  if (name === 'if') return HELPERS.if;
  if (name === 'unless') return HELPERS.unless;
  if (name === 'each') return HELPERS.each;
  if (name === 'on') return HELPERS.on;
  if (name === 'debugger') return HELPERS.debugger;
  if (name === 'log') return HELPERS.log;

  // If not a reserved helper, check env, then global helpers, or return undefined.
  if (!hasHelper(env, null, name)) {
    console.error('No helper named', name, 'registered with Rebound');
  }
  return HELPERS[name] || env.helpers[name] || NOOP;
}

function registerHelper(name, callback, env) {
  if (!_.isString(name)) return console.error('Name provided to registerHelper must be a string!');
  if (!_.isFunction(callback)) return console.error('Callback provided to regierHelper must be a function!');
  if (hasHelper(env, null, name)) return console.error('A helper called "' + name + '" is already registered!');

  HELPERS[name] = callback;
}

/*******************************
        Default helpers
********************************/

HELPERS.debugger = function debuggerHelper(params, hash, options, env) {
  /* jshint -W087 */
  debugger;
  return '';
};

HELPERS.log = function logHelper(params, hash, options, env) {
  console.log.apply(console, params);
  return '';
};

HELPERS.on = function onHelper(params, hash, options, env) {
  var i,
      callback,
      delegate,
      element,
      eventName = params[0],
      len = params.length;

  // By default everything is delegated on the parent component
  if (len === 2) {
    callback = params[1];
    delegate = options.element;
    element = options.element;
  }
  // If a selector is provided, delegate on the helper's element
  else if (len === 3) {
      callback = params[2];
      delegate = params[1];
      element = options.element;
    }

  // Attach event
  (0, _reboundUtils2.default)(element).on(eventName, delegate, hash, function (event) {
    if (!_.isFunction(env.root[callback])) {
      throw "ERROR: No method named " + callback + " on component " + env.root.tagName + "!";
    }
    return env.root[callback].call(env.root, event);
  });
};

HELPERS.length = function lengthHelper(params, hash, options, env) {
  return params[0] && params[0].length || 0;
};

function isTruthy(condition) {

  if (condition === true || condition === false) {
    return condition;
  }

  // Handle null values
  if (condition === undefined || condition === null) {
    return false;
  }

  // Handle models
  if (condition.isModel) {
    return true;
  }

  // Handle arrays and collection
  if (_.isArray(condition) || condition.isCollection) {
    return !!condition.length;
  }

  // Handle string values
  if (condition === 'true') {
    return true;
  }
  if (condition === 'false') {
    return false;
  }

  return !!condition;
}

HELPERS.if = function ifHelper(params, hash, templates) {

  var condition = isTruthy(params[0]);

  // If yield does not exist, this is not a block helper.
  if (!this.yield) {
    return condition ? params[1] : params[2] || '';
  }

  // Render the apropreate block statement
  if (condition && this.yield) {
    this.yield();
  } else if (!condition && templates.inverse && templates.inverse.yield) {
    templates.inverse.yield();
  } else {
    return '';
  }
};

// Unless proxies to the if helper with an inverted conditional value.
HELPERS.unless = function unlessHelper(params, hash, templates) {
  params[0] = !isTruthy(params[0]);
  return HELPERS.if.apply(this, [params, hash, templates]);
};

HELPERS.each = function eachHelper(params, hash, templates) {

  // If no data passed, exit
  if (!params[0]) {
    return void 0;
  }

  // Accepts collections, arrays, models, or objects
  var value = params[0].isCollection ? params[0].models : params[0].isModel ? params[0].attributes : params[0];

  // If the scope has values, render them
  if (value && (_.isArray(value) && value.length > 0 || _.isObject(value) && Object.keys(value).length > 0)) {
    // For each value in the array, yield using that data model
    for (var key in value) {
      var eachId = value[key] && value[key].isData ? value[key].cid : params[0].cid + key;
      if (value.hasOwnProperty(key)) {
        this.yieldItem(eachId, [value[key], key]);
      }
    }
  }

  // Otherwise, render the inverse template
  else {
      if (templates.inverse && templates.inverse["yield"]) {
        templates.inverse["yield"]();
      }
    }
};

exports.default = HELPERS;
},{"rebound-htmlbars/lazy-value":33,"rebound-utils/rebound-utils":41}],13:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _hooks = require("htmlbars-runtime/hooks");

var _hooks2 = _interopRequireDefault(_hooks);

var _render2 = require("htmlbars-runtime/render");

var _render3 = _interopRequireDefault(_render2);

var _createFreshEnv = require("rebound-htmlbars/hooks/createFreshEnv");

var _createFreshEnv2 = _interopRequireDefault(_createFreshEnv);

var _createChildEnv = require("rebound-htmlbars/hooks/createChildEnv");

var _createChildEnv2 = _interopRequireDefault(_createChildEnv);

var _createFreshScope = require("rebound-htmlbars/hooks/createFreshScope");

var _createFreshScope2 = _interopRequireDefault(_createFreshScope);

var _createChildScope = require("rebound-htmlbars/hooks/createChildScope");

var _createChildScope2 = _interopRequireDefault(_createChildScope);

var _bindScope = require("rebound-htmlbars/hooks/bindScope");

var _bindScope2 = _interopRequireDefault(_bindScope);

var _linkRenderNode = require("rebound-htmlbars/hooks/linkRenderNode");

var _linkRenderNode2 = _interopRequireDefault(_linkRenderNode);

var _cleanupRenderNode = require("rebound-htmlbars/hooks/cleanupRenderNode");

var _cleanupRenderNode2 = _interopRequireDefault(_cleanupRenderNode);

var _destroyRenderNode = require("rebound-htmlbars/hooks/destroyRenderNode");

var _destroyRenderNode2 = _interopRequireDefault(_destroyRenderNode);

var _willCleanupTree = require("rebound-htmlbars/hooks/willCleanupTree");

var _willCleanupTree2 = _interopRequireDefault(_willCleanupTree);

var _didCleanupTree = require("rebound-htmlbars/hooks/didCleanupTree");

var _didCleanupTree2 = _interopRequireDefault(_didCleanupTree);

var _get = require("rebound-htmlbars/hooks/get");

var _get2 = _interopRequireDefault(_get);

var _getValue = require("rebound-htmlbars/hooks/getValue");

var _getValue2 = _interopRequireDefault(_getValue);

var _invokeHelper = require("rebound-htmlbars/hooks/invokeHelper");

var _invokeHelper2 = _interopRequireDefault(_invokeHelper);

var _subexpr = require("rebound-htmlbars/hooks/subexpr");

var _subexpr2 = _interopRequireDefault(_subexpr);

var _concat = require("rebound-htmlbars/hooks/concat");

var _concat2 = _interopRequireDefault(_concat);

var _content = require("rebound-htmlbars/hooks/content");

var _content2 = _interopRequireDefault(_content);

var _attribute = require("rebound-htmlbars/hooks/attribute");

var _attribute2 = _interopRequireDefault(_attribute);

var _partial = require("rebound-htmlbars/hooks/partial");

var _partial2 = _interopRequireDefault(_partial);

var _component = require("rebound-htmlbars/hooks/component");

var _component2 = _interopRequireDefault(_component);

var _helpers = require("rebound-htmlbars/helpers");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// __Environment Hooks__ create and modify the template environment objects

_hooks2.default.createFreshEnv = _createFreshEnv2.default; // Rebound Hooks
// ----------------
// Here we augment HTMLBars' default hooks to make use of Rebound's evented data
// objects for automatic databinding.

_hooks2.default.createChildEnv = _createChildEnv2.default;

// __Scope Hooks__ create, access and modify the template scope and data objects

_hooks2.default.createFreshScope = _createFreshScope2.default;
_hooks2.default.createChildScope = _createChildScope2.default;
_hooks2.default.bindScope = _bindScope2.default;

// __Lifecycle Hooks__ construct, deconstruct and clean up render nodes over their lifecycles

_hooks2.default.linkRenderNode = _linkRenderNode2.default;
_hooks2.default.willCleanupTree = _willCleanupTree2.default;
_hooks2.default.cleanupRenderNode = _cleanupRenderNode2.default;
_hooks2.default.destroyRenderNode = _cleanupRenderNode2.default;
_hooks2.default.didCleanupTree = _didCleanupTree2.default;

// __Streaming Hooks__ create streams via LazyValues for data values, helpers, subexpressions and concat groups

_hooks2.default.get = _get2.default;
_hooks2.default.getValue = _getValue2.default;
_hooks2.default.invokeHelper = _invokeHelper2.default;
_hooks2.default.subexpr = _subexpr2.default;
_hooks2.default.concat = _concat2.default;

// __Render Hooks__ interact with the DOM to output content and bind to form elements for two way databinding

_hooks2.default.content = _content2.default;
_hooks2.default.attribute = _attribute2.default;
_hooks2.default.partial = _partial2.default;
_hooks2.default.registerPartial = _partial.registerPartial;
_hooks2.default.component = _component2.default;

// __Helper Hooks__ manage the environment's registered helpers

_hooks2.default.hasHelper = _helpers.hasHelper;
_hooks2.default.lookupHelper = _helpers.lookupHelper;
_hooks2.default.registerHelper = _helpers.registerHelper;

// Bind local binds a local variable to the scope object and tracks the scope
// level at which that local was added. See `createChildScope` for description
// of scope levels
_hooks2.default.bindLocal = function bindLocal(env, scope, name, value) {
  scope.localPresent[name] = scope.level;
  scope.locals[name] = value;
};

// __buildRenderResult__ is a wrapper for the native HTMLBars render function. It
// ensures every template is rendered with its own child environment, every environment
// saves a referance to its unique render result for re-renders, and every render
// result has a unique id.
_hooks2.default.buildRenderResult = function buildRenderResult(template, env, scope, options) {
  var render = _render3.default.default || _render3.default; // Fix for stupid Babel imports
  env = _hooks2.default.createChildEnv(env);
  env.template = render(template, env, scope, options);
  env.template.uid = _reboundUtils2.default.uniqueId('template');
  return env.template;
};

exports.default = _hooks2.default;
},{"htmlbars-runtime/hooks":61,"htmlbars-runtime/render":64,"rebound-htmlbars/helpers":12,"rebound-htmlbars/hooks/attribute":14,"rebound-htmlbars/hooks/bindScope":15,"rebound-htmlbars/hooks/cleanupRenderNode":16,"rebound-htmlbars/hooks/component":17,"rebound-htmlbars/hooks/concat":18,"rebound-htmlbars/hooks/content":19,"rebound-htmlbars/hooks/createChildEnv":20,"rebound-htmlbars/hooks/createChildScope":21,"rebound-htmlbars/hooks/createFreshEnv":22,"rebound-htmlbars/hooks/createFreshScope":23,"rebound-htmlbars/hooks/destroyRenderNode":24,"rebound-htmlbars/hooks/didCleanupTree":25,"rebound-htmlbars/hooks/get":26,"rebound-htmlbars/hooks/getValue":27,"rebound-htmlbars/hooks/invokeHelper":28,"rebound-htmlbars/hooks/linkRenderNode":29,"rebound-htmlbars/hooks/partial":30,"rebound-htmlbars/hooks/subexpr":31,"rebound-htmlbars/hooks/willCleanupTree":32,"rebound-utils/rebound-utils":41}],14:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = attribute;

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// All valid text based HTML input types
var TEXT_INPUTS = { "null": 1, text: 1, email: 1, password: 1,
  search: 1, url: 1, tel: 1, hidden: 1,
  number: 1, color: 1, date: 1, datetime: 1,
  month: 1, range: 1, time: 1, week: 1,
  "datetime-local": 1
};

// All valid boolean HTML input types
// ### Attribute Hook

var BOOLEAN_INPUTS = { checkbox: 1, radio: 1 };

// Returns true is value is numeric based on HTML5 number input field logic.
// Trailing decimals are considered non-numeric (ex `12.`).
function isNumeric(val) {
  return val && !isNaN(Number(val)) && (!_.isString(val) || _.isString(val) && val[val.length - 1] !== '.');
}

// Attribute Hook
function attribute(attrMorph, env, scope, name, value) {

  var val = value.isLazyValue ? value.value : value,
      el = attrMorph.element,
      tagName = el.tagName,
      type = el.getAttribute("type"),
      cursor = false;

  // If this is a text input element's value prop, wire up our databinding
  if (tagName === 'INPUT' && type === 'number' && name === 'value') {

    // If our input events have not been bound yet, bind them. Attempt to convert
    // to a proper number type before setting.
    if (!attrMorph.eventsBound) {
      (0, _reboundUtils2.default)(el).on('change input propertychange', function (event) {
        var val = this.value;
        val = isNumeric(val) ? Number(val) : undefined;
        value.set(value.path, val);
      });
      attrMorph.eventsBound = true;
    }

    // Set the value property of the input
    // Number Input elements may return `''` for non valid numbers. If both values
    // are falsy, then don't blow away what the user is typing.
    if (!el.value && !val) {
      return;
    } else {
      el.value = isNumeric(val) ? Number(val) : '';
    }
  }

  // If this is a text input element's value prop, wire up our databinding
  else if (tagName === 'INPUT' && TEXT_INPUTS[type] && name === 'value') {

      // If our input events have not been bound yet, bind them
      if (!attrMorph.eventsBound) {
        (0, _reboundUtils2.default)(el).on('change input propertychange', function (event) {
          value.set(value.path, this.value);
        });
        attrMorph.eventsBound = true;
      }

      // Set the value property of the input if it has changed
      if (el.value !== val) {

        // Only save the cursor position if this element is the currently focused one.
        // Some browsers are dumb about selectionStart on some input types (I'm looking at you [type='email'])
        // so wrap in try catch so it doesn't explode. Then, set the new value and
        // re-position the cursor.
        if (el === document.activeElement) {
          try {
            cursor = el.selectionStart;
          } catch (e) {}
        }
        el.value = val ? String(val) : '';
        cursor !== false && el.setSelectionRange(cursor, cursor);
      }
    } else if (tagName === 'INPUT' && BOOLEAN_INPUTS[type] && name === 'checked') {

      // If our input events have not been bound yet, bind them
      if (!attrMorph.eventsBound) {
        (0, _reboundUtils2.default)(el).on('change propertychange', function (event) {
          value.set(value.path, this.checked ? true : false);
        });
        attrMorph.eventsBound = true;
      }

      el.checked = val ? true : undefined;
    }

    // Special case for link elements with dynamic classes.
    // If the router has assigned it a truthy 'active' property, ensure that the extra class is present on re-render.
    else if (tagName === 'A' && name === 'class' && el.active) {
        val = val ? String(val) + ' active' : 'active';
      }

  // Set the attribute on our element for visual referance
  val ? el.setAttribute(name, String(val)) : el.removeAttribute(name);

  this.linkRenderNode(attrMorph, env, scope, '@attribute', [value], {});
}
},{"rebound-utils/rebound-utils":41}],15:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = bindScope;
// ### Bind-Scope Hook

// Make scope available on the environment object to allow hooks to cache streams on it.
function bindScope(env, scope) {
  env.scope = scope;
}
},{}],16:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = cleanupRenderNode;
// ### Cleanup-Render-Node Hook

// Called before destroying any render node
function cleanupRenderNode(morph) {
  // morph.lazyValue && morph.lazyValue.destroy();
}
},{}],17:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = component;

var _reboundUtils = require("rebound-utils/rebound-utils");

var _factory = require("rebound-component/factory");

var _factory2 = _interopRequireDefault(_factory);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

// All valid HTML attributes
var ATTRIBUTES = { abbr: 1, "accept-charset": 1, accept: 1, accesskey: 1, action: 1,
  align: 1, alink: 1, alt: 1, archive: 1, axis: 1,
  background: 1, bgcolor: 1, border: 1, cellpadding: 1, cellspacing: 1,
  char: 1, charoff: 1, charset: 1, checked: 1, cite: 1,
  class: 1, classid: 1, clear: 1, code: 1, codebase: 1,
  codetype: 1, color: 1, cols: 1, colspan: 1, compact: 1,
  content: 1, coords: 1, data: 1, datetime: 1, declare: 1,
  defer: 1, dir: 1, disabled: 1, enctype: 1, face: 1,
  for: 1, frame: 1, frameborder: 1, headers: 1, height: 1,
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

function component(morph, env, scope, tagName, params, attrs, templates, visitor) {
  var _this = this;

  // Components are only ever rendered once
  if (morph.componentIsRendered) {
    return void 0;
  }

  var component,
      element,
      outlet,
      render = this.buildRenderResult,
      seedData = {},
      componentData = {};

  // Create a plain data object to pass to our new component as seed data
  for (var key in attrs) {
    seedData[key] = this.getValue(attrs[key]);
  }

  // For each param passed to our shared component, add it to our custom element
  component = (0, _factory2.default)(tagName, seedData, _defineProperty({}, _reboundUtils.REBOUND_SYMBOL, { templates: templates, env: env, scope: scope }));
  element = component.el;

  var _loop = function _loop(key) {

    // For each param passed to our component, create its lazyValue
    componentData[key] = _this.get(component.env, component.scope, key);

    // Set up two way binding between component and original context
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

  for (var key in seedData) {
    _loop(key);
  }

  // TODO: Move this to Component
  // // For each change on our component, update the states of the original context and the element's proeprties.
  var updateAttrs = function updateAttrs() {
    // Only do this for fully hydrated components
    if (!component.isHydrated) {
      return;
    }
    var json = component.toJSON();

    if (_.isString(json)) return; // If is a string, this model is seralizing already

    // Set the properties on our element for visual referance if we are on a top level attribute
    _.each(json, function (value, key) {
      // TODO: Currently, showing objects as properties on the custom element causes problems.
      // Linked models between the context and component become the same exact model and all hell breaks loose.
      // Find a way to remedy this. Until then, don't show objects.
      if (_.isObject(value) || _.isUndefined(value)) {
        return;
      }
      value = _.isObject(value) ? JSON.stringify(value) : value;
      try {
        ATTRIBUTES[key] ? element.setAttribute(key, value) : element.dataset[key] = value;
      } catch (e) {
        console.error(e.message);
      }
    });
  };
  component.listenTo(component, 'change', updateAttrs);
  component.onLoad(updateAttrs);

  /** The attributeChangedCallback on our custom element updates the component's data. **/

  morph.setNode(element);
  morph.componentIsRendered = true;
}
},{"rebound-component/factory":6,"rebound-utils/rebound-utils":41}],18:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = concat;

var _lazyValue = require("rebound-htmlbars/lazy-value");

var _lazyValue2 = _interopRequireDefault(_lazyValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ### Concat Hook

// The `concat` hook creates a LazyValue for adjacent expressions so they may be
// used as a single data point in its parent expression. For example:
// ```
// <div class="{{foo}} active {{bar}}"></div>
// ```
// The div's attribute expression is passed a concat LazyValue that alerts its
// subscribers whenever any of its dynamic values change.

var CONCAT_CACHE = {};

function concat(env, params) {

  // If the concat expression only contains a single value, return it.
  if (params.length === 1) {
    return params[0];
  }

  // Each concat LazyValue is unique to its inputs. Compute it's unique name.
  var name = "concat: ";
  _.each(params, function (param, index) {
    name += "" + (param && param.isLazyValue ? param.cid : param);
  });

  // Check the streams cache and return if this LazyValue has already been made
  if (CONCAT_CACHE[name]) {
    return CONCAT_CACHE[name];
  }

  // Create a lazyvalue that returns the concatted values of all input params
  // Add it to the streams cache and return
  return CONCAT_CACHE[name] = new _lazyValue2.default(function (params) {
    return params.join('');
  }, {
    context: params[0].context,
    path: name,
    params: params
  });
}
},{"rebound-htmlbars/lazy-value":33}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = content;
// ### Content Hook

// Content Hook
function content(morph, env, context, path, lazyValue) {
  var el = morph.contextualElement;

  // Two way databinding for textareas
  if (el.tagName === 'TEXTAREA') {
    lazyValue.onNotify(function updateTextarea(lazyValue) {
      el.value = lazyValue.value;
    });
    $(el).on('change keyup', function updateTextareaLazyValue(event) {
      lazyValue.set(lazyValue.path, this.value);
    });
  }

  morph.lazyValue = lazyValue;

  return lazyValue.value;
}
},{}],20:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createChildEnv;
// ### Create-Child-Environment Hook

// Create an environment object that will inherit everything from its parent
// environment until written over with a local variable.
function createChildEnv(parent) {
  var env = Object.create(parent);
  env.helpers = Object.create(parent.helpers);
  return env;
}
},{}],21:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createChildScope;
// ### Create-Child-Scope Hook

// Create a scope object that will inherit everything from its parent
// scope until written over with a local variable.
function createChildScope(parent) {
  var scope = Object.create(parent);
  scope.level = parent.level + 1;
  scope.locals = Object.create(parent.locals);
  scope.localPresent = Object.create(parent.localPresent);
  scope.streams = Object.create(parent.streams);
  scope.blocks = Object.create(parent.blocks);
  return scope;
}
},{}],22:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createFreshEnv;

var _domHelper = require("dom-helper");

var _domHelper2 = _interopRequireDefault(_domHelper);

var _helpers = require("rebound-htmlbars/helpers");

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ### Create-Fresh-Environment Hook

// Rebound's default environment
// The application environment is propagated down each render call and
// augmented with helpers as it goes

var DOMHelper = _domHelper2.default.default || _domHelper2.default; // Fix for stupid Babel imports

function createFreshEnv() {
  return {
    isReboundEnv: true,
    cid: _.uniqueId('env'),
    root: null,
    helpers: _helpers2.default,
    hooks: this,
    dom: new DOMHelper(),
    revalidateQueue: {},
    observers: {}
  };
}
},{"dom-helper":48,"rebound-htmlbars/helpers":12}],23:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createFreshScope;
// ### Create-Fresh-Scope Hook

// Rebound's default scope object.
// The scope object is propagated down each block expression or render call and
// augmented with local variables as it goes. LazyValues are cached as streams
// here as well. Because `in` checks have unpredictable performance, keep a
// separate dictionary to track whether a local was bound.
function createFreshScope() {
  return {
    level: 1,
    self: null,
    locals: {},
    localPresent: {},
    streams: {},
    blocks: {}
  };
}
},{}],24:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = destroyRenderNode;
// ### Destroy-Render-Node Hook

// Called when destroying a render node
function destroyRenderNode(morph) {}
},{}],25:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = didCleanupTree;
// ### Did-Cleanup-Tree Hook

// Called after destroying any node tree
function didCleanupTree(env, morph, destroySelf) {}
},{}],26:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = get;

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _lazyValue = require("rebound-htmlbars/lazy-value");

var _lazyValue2 = _interopRequireDefault(_lazyValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ### Get Hook

// The get hook streams a property at a named path from a given scope. It returns
// a `LazyValue` that other code can subscribe to and be alerted when values change.
function get(env, scope, path) {
  var context = scope.self;

  // The special word `this` should referance empty string
  if (path === 'this') {
    path = '';
  }

  // If this path referances a block param, use that as the context instead.
  var rest = _reboundUtils2.default.splitPath(path);
  var key = rest.shift();
  if (scope.localPresent[key]) {
    context = scope.locals[key];
    path = rest.join('.');
  }

  // If this value is not a local value, and there is a stream present
  // If this value is a local, but not at this scope layer, and there is
  if (scope.streams[path] && (!scope.streams[path].layer && !scope.localPresent[key] || scope.streams[path].layer === scope.localPresent[key])) {
    return scope.streams[path];
  }

  // Given a context and a path, create a LazyValue object that returns
  // the value of object at path and add an observer to the context at path.
  return scope.streams[path] = new _lazyValue2.default(function () {
    return this.context.get(this.path, { isPath: true });
  }, {
    context: context,
    path: path,
    layer: scope.localPresent[key]
  }).addObserver(path, context, env);
}
},{"rebound-htmlbars/lazy-value":33,"rebound-utils/rebound-utils":41}],27:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getValue;
// ### Get Value Hook

// The getValue hook retreives the value of the passed in referance.
// It will return the propper value regardless of if the referance passed is the
// value itself, or a LazyValue.
function getValue(referance) {
  return referance && referance.isLazyValue ? referance.value : referance;
}
},{}],28:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = invokeHelper;

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _lazyValue = require("rebound-htmlbars/lazy-value");

var _lazyValue2 = _interopRequireDefault(_lazyValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ### Invoke-Helper Hook

// The `invokeHelper` hook streams a the result of a helper function. It returns
// a `LazyValue` that other code can subscribe to and be alerted when values change.
function invokeHelper(morph, env, scope, visitor, params, hash, helper, templates, context) {

  // If this is not a valid helper, log an error and return an empty string value.
  if (!_.isFunction(helper)) {
    console.error('Invalid helper!', helper);
    return { value: '' };
  }

  // Each helper LazyValue is unique to its inputs. Compute it's unique name.
  var name = helper.name + ":";
  _.each(params, function (param, index) {
    name += " " + (param && param.isLazyValue ? param.cid : param);
  });
  _.each(hash, function (hash, key) {
    name += " " + key + "=" + hash.cid;
  });

  // Check the stream cache for this LazyValue, return it if it exists.
  if (scope.streams[name]) {
    return scope.streams[name];
  }

  // Create a LazyValue that returns the value of our evaluated helper.
  var lazyValue = new _lazyValue2.default(function (params, hash) {
    return helper.call(context || {}, params, hash, templates, env);
  }, {
    path: name,
    params: params,
    hash: hash
  });

  // If this is not a block or element helper, cache the new lazyValue.
  // Only block helpers will have a context set passed. Non-element helpers will
  // have the morph set. Block and morph helpers have re-rendered dom that must
  // be fresh in the LazyValue's closure each run.
  if (!context && morph) {
    scope.streams[name] = lazyValue;
  }

  // Seed the cache and return the new LazyValue
  lazyValue.value;
  return lazyValue;
}
},{"rebound-htmlbars/lazy-value":33,"rebound-utils/rebound-utils":41}],29:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = linkRenderNode;
// ### Link-Render-Node Hook

// Called on first creation of any expressions that interact directly with the DOM.
// Whenever it is notified of any changes to it's dependant values, mark the node
// as dirty and add it to the environment's revalidation queue to be rerendered
// during the next animation frame.
function linkRenderNode(renderNode, env, scope, path, params, hash) {

  function rerender(path, node, lazyValue, env) {
    lazyValue.onNotify(function () {
      node.isDirty = true;
      env.template && (env.revalidateQueue[env.template.uid] = env.template);
    });
  }

  // Save the path on our render node for easier debugging
  renderNode.path = path;

  // For every parameter or hash value passed to this render node, if it is a data
  // stream, subscribe to notifications from it and when notified of a change,
  // mark the node as dirty and queue it up for revalidation.
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
  return 1;
}
},{}],30:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerPartial = registerPartial;
exports.default = partial;

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _loader = require("rebound-router/loader");

var _loader2 = _interopRequireDefault(_loader);

var _lazyValue = require("rebound-htmlbars/lazy-value");

var _lazyValue2 = _interopRequireDefault(_lazyValue);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var PARTIALS = {};

function registerPartial(name, template) {
  if (template && _.isString(name)) {

    // If this partial has a callback list associated with its name, call all of
    // the callbacks before registering the partial.
    if (Array.isArray(PARTIALS[name])) {
      PARTIALS[name].forEach(function (cb) {
        cb(template);
      });
    }

    // Save the partial template in our cache and return it
    _loader2.default.register('/' + name + '.js');
    return PARTIALS[name] = template;
  }
}

function partial(renderNode, env, scope, path) {

  // If no path is passed, yell
  if (!path) {
    console.error('Partial helper must be passed a path!');
  }

  // Resolve our path value
  path = path.isLazyValue ? path.value : path;

  // Create new child scope for partial
  scope = this.createChildScope(scope);

  var render = this.buildRenderResult;

  // Because of how htmlbars works with re-renders, we need a contextual element
  // for our partial that will not disappear on it when lazy partials are loaded.
  // We use a `<rebound-partial>` element for this.
  var node = document.createElement('rebound-partial');
  node.setAttribute('path', path);

  // If a partial is registered with this path name, render it
  if (PARTIALS[path] && !Array.isArray(PARTIALS[path])) {
    node.appendChild(render(PARTIALS[path], env, scope, { contextualElement: renderNode }).fragment);
  }

  // If this partial is not yet registered, add it to a callback list to be called
  // when registered. When registered, replace the dummy node we created with the
  // rendered partial template.
  else {
      PARTIALS[path] || (PARTIALS[path] = []);
      PARTIALS[path].push(function partialCallback(template) {
        node.appendChild(render(template, env, scope, { contextualElement: renderNode }).fragment, node);
      });
    }

  return node;
}
},{"rebound-htmlbars/lazy-value":33,"rebound-router/loader":36,"rebound-utils/rebound-utils":41}],31:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = subexpr;
// ### Subexpr Hook

// The `subexpr` hook creates a LazyValue for a nexted expression so it may be
// used as a single data point in its parent expression. For example:
// ```
// {{#if (equal (add 1 2) 3)}}True!{{/if}}
// ```
// The `if` block expression contains a subexpression that is the evalued value
// of the `equal` helper, which in turn contains a subexpression that is the
// evalued value of the `add` helper. Each subexpression is represented internally
// by a single LazyValue that notifies its subscribers when it changes.
function subexpr(env, scope, helperName, params, hash) {
  var helper = this.lookupHelper(helperName, env);

  // Return the apropreate LazyValue for this subexpression type.
  if (helper) {
    return this.invokeHelper(null, env, scope, null, params, hash, helper, {}, undefined);
  }

  return this.get(env, scope, helperName);
}
},{}],32:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = willCleanupTree;
// ### Will-Cleanup-Tree Hook

// Called before destroying any node tree
function willCleanupTree(env, morph, destroySelf) {}
},{}],33:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _reboundUtils = require('rebound-utils/rebound-utils');

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var NIL = function NIL() {},
    EMPTY_ARRAY = []; // Rebound Lazy Value
// ----------------

var LAZYVALUE_COUNT = 0;

function LazyValue(fn) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  this.cid = _reboundUtils2.default.uniqueId('lazyValue');
  this.valueFn = fn;
  this.cache = NIL;
  this.context = options.context || null;
  this.children = [];
  this.hash = {};
  this.subscribers = [];
  this.observers = [];
  this.referance = 0;
  _.extend(this, options);

  // For each param or hash value passed to our helper's LazyValue, add it to the
  // dependant list. The helper's LazyValue will re-evaluate when one changes.
  _.each(options.params, function (param, index) {
    param || (param = '');
    this.children.push(param);
    param.isLazyValue && param.onNotify(this);
  }, this);

  _.each(options.hash, function (value, key) {
    value || (value = '');
    value.isLazyValue && value.onNotify(this);
    this.hash[key] = value;
  }, this);
}

LazyValue.prototype = {

  isLazyValue: true,

  get value() {

    // If cache is already computed, return it
    if (this.cache !== NIL) {
      return this.cache;
    }

    // Assemble our args and hash variables for the helper. For each LazyValue
    // param or hash, insert the evaluated value so helpers don't need to have any
    // concept of lazyvalues.
    var params = new Array(this.children.length),
        hash = {};

    for (var i = 0, l = this.children.length; i < l; i++) {
      var child = this.children[i];
      params[i] = child && child.isLazyValue ? child.value : child;
    }

    for (var key in this.hash) {
      if (!this.hash.hasOwnProperty(key)) {
        continue;
      }
      var child = this.hash[key];
      hash[key] = child && child.isLazyValue ? child.value : child;
    }

    return this.cache = this.valueFn(params, hash);
  },

  set: function set(key, value, options) {
    return this.context && this.context.set(key, value, options) || null;
  },

  addObserver: function addObserver(path, context, env) {

    if (!_.isObject(context) || !_.isString(path)) {
      return console.error('Error adding observer for', context, path);
    }
    path = path.trim();
    var origin = context.__path().replace(/\[[^\]]+\]/g, ".@each").trim();
    var cache = env.observers[origin] || (env.observers[origin] = {});
    cache[path] || (cache[path] = []);
    var position = cache[path].push(this) - 1;

    this.observers.push({ env: env, origin: origin, path: path, index: position });

    return this;
  },

  // Mark this LazyValue, and all who depend on it, as dirty by setting its cache
  // to NIL. This will force a full re-compute of its value when next requests rather
  // than just returning the cache object.
  makeDirty: function makeDirty() {
    if (this.cache === NIL) {
      return void 0;
    }
    this.cache = NIL;
    for (var i = 0, l = this.subscribers.length; i < l; i++) {
      this.subscribers[i].isLazyValue && this.subscribers[i].makeDirty();
    }
  },

  // Ensure that this node and all of its dependants are dirty, then call each
  // of its dependants. If a dependant is a LazyValue, and marked as destroyed,
  // remove it fromt the array
  notify: function notify() {
    this.makeDirty();
    for (var i = 0, l = this.subscribers.length; i < l; i++) {
      if (!this.subscribers[i]) {
        continue;
      } else if (this.subscribers[i].isLazyValue) {
        this.subscribers[i].destroyed ? this.subscribers[i] = void 0 : this.subscribers[i].notify();
      } else {
        this.subscribers[i](this);
      }
    }
  },

  onNotify: function onNotify(callback) {
    this.subscribers.push(callback);
    this.referance++;
    return this;
  },

  destroy: function destroyLazyValue() {
    this.destroyed = true;

    _.each(this.children, function (child) {
      if (!child || !child.isLazyValue) {
        return void 0;
      }
      if (--child.referance === 0) {
        child.destroy();
      }
    });
    _.each(this.hash, function (child) {
      if (!child || !child.isLazyValue) {
        return void 0;
      }
      if (--child.referance === 0) {
        child.destroy();
      }
    });

    this.subscribers = [];
    this.valueFn = NIL;
    this.cache = NIL;
    this.children = [];
    this.cache = {};

    _.each(this.observers, function (observer) {
      if (observer.env.observers[observer.origin] && observer.env.observers[observer.origin][observer.path]) {
        delete observer.env.observers[observer.origin][observer.path][observer.index];
      }
      delete observer.env;
    });

    this.observers = null;
  }
};

exports.default = LazyValue;
},{"rebound-utils/rebound-utils":41}],34:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.registerPartial = exports.registerHelper = undefined;

var _hooks = require("rebound-htmlbars/hooks");

var _hooks2 = _interopRequireDefault(_hooks);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var registerHelper = exports.registerHelper = _hooks2.default.registerHelper;
var registerPartial = exports.registerPartial = _hooks2.default.registerPartial;
},{"rebound-htmlbars/hooks":13}],35:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = render;

var _reboundUtils = require("rebound-utils/rebound-utils");

var _hooks2 = require("rebound-htmlbars/hooks");

var _hooks3 = _interopRequireDefault(_hooks2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var RENDER_TIMEOUT;
var TO_RENDER = [];
var ENV_QUEUE = [];

// A convenience method to push only unique eleents in an array of objects to
// the TO_RENDER queue. If the element is a Lazy Value, it marks it as dirty in
// the process
var push = function push(arr) {
  var _this = this;

  var i,
      len = arr.length;
  this.added || (this.added = {});
  arr.forEach(function (item) {
    if (_this.added[item.cid]) {
      return;
    }
    _this.added[item.cid] = 1;
    if (item.isLazyValue) {
      item.makeDirty();
    }
    _this.push(item);
  });
};

function reslot(env) {

  // Fix for stupid Babel module importer
  // TODO: Fix this. This is dumb. Modules don't resolve in by time of this file's
  // execution because of the dependancy tree so babel doesn't get a chance to
  // interop the default value of these imports. We need to do this at runtime instead.
  var hooks = _hooks3.default.default || _hooks3.default;

  var outlet,
      slots = env.root.options && env.root.options[_reboundUtils.REBOUND_SYMBOL];

  if (!env.root || !slots) {
    return;
  }

  // Walk the dom, without traversing into other custom elements, and search for
  // `<content>` outlets to render templates into.
  (0, _reboundUtils.$)(env.root.el).walkTheDOM(function (el) {
    if (env.root.el === el) {
      return true;
    }
    if (el.tagName === 'CONTENT') {
      outlet = el;
    }
    if (el.tagName.indexOf('-') > -1) {
      return false;
    }
    return true;
  });

  // If a `<content>` outlet is present in component's template, and a template
  // is provided, render it into the outlet
  if (slots.templates.default && _.isElement(outlet) && !outlet.slotted) {
    outlet.slotted = true;
    (0, _reboundUtils.$)(outlet).empty();
    outlet.appendChild(hooks.buildRenderResult(slots.templates.default, slots.env, slots.scope, {}).fragment);
  }
}

// Called on animation frame. TO_RENDER is a list of lazy-values to notify.
// When notified, they mark themselves as dirty. Then, call revalidate on all
// dirty expressions for each environment we need to re-render. Use `while(queue.length)`
// to accomodate synchronous renders where the render queue callbacks may trigger
// nested calls of `renderCallback`.
function renderCallback() {

  while (TO_RENDER.length) {
    TO_RENDER.shift().notify();
  }

  TO_RENDER.added = {};

  while (ENV_QUEUE.length) {
    var env = ENV_QUEUE.shift();
    for (var key in env.revalidateQueue) {
      env.revalidateQueue[key].revalidate();
    }
    reslot(env);
  }
  ENV_QUEUE.added = {};
}

// Listens for `change` events and calls `trigger` with the correct values
function onChange(model, options) {
  trigger.call(this, 'change', model, model.changedAttributes());
}

// Listens for `reset` events and calls `trigger` with the correct values
function onReset(data, options) {
  trigger.call(this, 'reset', data, data.isModel ? data.changedAttributes() : { '@each': data }, options);
}

// Listens for `update` events and calls `trigger` with the correct values
function onUpdate(collection, options) {
  trigger.call(this, 'update', collection, { '@each': collection }, options);
}

function trigger(type, data, changed) {
  var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

  // If nothing has changed, exit.
  if (!data || !changed) {
    return void 0;
  }

  var basePath = data.__path();

  // If this event came from within a service, include the service key in the base path
  if (options.service) {
    basePath = options.service + '.' + basePath;
  }

  // For each changed key, walk down the data tree from the root to the data
  // element that triggered the event and add all relevent callbacks to this
  // object's TO_RENDER queue.
  basePath = basePath.replace(/\[[^\]]+\]/g, ".@each");
  var parts = _reboundUtils.$.splitPath(basePath);
  var context = [];

  while (1) {
    var pre = context.join('.').trim();
    var post = parts.join('.').trim();

    for (var key in changed) {
      var path = (post + (post && key && '.') + key).trim();
      for (var testPath in this.env.observers[pre]) {
        if (_reboundUtils.$.startsWith(testPath, path)) {
          push.call(TO_RENDER, this.env.observers[pre][testPath]);
          push.call(ENV_QUEUE, [this.env]);
        }
      }
    }
    if (parts.length === 0) {
      break;
    }
    context.push(parts.shift());
  }

  // If Rebound is loaded in a testing environment, call renderCallback syncronously
  // so that changes to the data reflect in the DOM immediately.
  // TODO: Make tests async so this is not required
  if (window.Rebound && window.Rebound.testing) {
    return renderCallback();
  }

  // Otherwise, queue our render callback to be called on the next animation frame,
  // after the current call stack has been exhausted.
  window.cancelAnimationFrame(RENDER_TIMEOUT);
  RENDER_TIMEOUT = window.requestAnimationFrame(renderCallback);
}

// A render function that will merge user provided helpers and hooks with our defaults
// and bind a method that re-renders dirty expressions on data change and executes
// other delegated listeners added by our hooks.
function render(el, template, data) {
  var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

  // Fix for stupid Babel module importer
  // TODO: Fix this. This is dumb. Modules don't resolve in by time of this file's
  // execution because of the dependancy tree so babel doesn't get a chance to
  // interop the default value of these imports. We need to do this at runtime instead.
  var hooks = _hooks3.default.default || _hooks3.default;

  // If no data is passed to render, exit with an error
  if (!data) {
    return console.error('No data passed to render function.');
  }

  // Every component's template is rendered using a unique Environment and Scope
  // If this component already has them, re-use the same objects – they contain
  // important state information. Otherwise, create fresh ones for it.
  var env = data.env || hooks.createFreshEnv();
  var scope = data.scope || hooks.createFreshScope();

  // Bind the component as the scope's main data object
  hooks.bindSelf(env, scope, data);

  // Add template specific hepers to env
  _.extend(env.helpers, options.helpers);

  // Save env and scope on component data to trigger lazy-value streams on data change
  data.env = env;
  data.scope = scope;

  // Save data on env to allow helpers / hooks access to component methods
  env.root = data;

  // Ensure we have a contextual element to pass to render
  options.contextualElement || (options.contextualElement = data.el || document.body);
  options.self = data;

  // If data is an eventable object, run the onChange helper on any change
  if (data.listenTo) {
    data.stopListening(null, null, onChange).stopListening(null, null, onReset).stopListening(null, null, onUpdate);
    data.listenTo(data, 'change', onChange).listenTo(data, 'reset', onReset).listenTo(data, 'update', onUpdate);
  }

  // If this is a real template, run it with our merged helpers and hooks
  // If there is no template, just return an empty fragment
  env.template = template ? hooks.buildRenderResult(template, env, scope, options) : { fragment: document.createDocumentFragment() };
  (0, _reboundUtils.$)(el).empty();
  el.appendChild(env.template.fragment);
  reslot(env);
  return el;
}
},{"rebound-htmlbars/hooks":13,"rebound-utils/rebound-utils":41}],36:[function(require,module,exports){
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
},{"rebound-utils/rebound-utils":41}],37:[function(require,module,exports){
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
},{"backbone":45,"rebound-component/component":5,"rebound-component/factory":6,"rebound-router/loader":36,"rebound-router/service":38,"rebound-utils/rebound-utils":41}],38:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SERVICES = exports.ServiceLoader = undefined;

var _reboundUtils = require("rebound-utils/rebound-utils");

// Services cache of all installed services
var SERVICES = {};

// Services keep track of their consumers. LazyComponent are placeholders
// for services that haven't loaded yet. A LazyComponent mimics the api of a
// real service/component (they are the same), and when the service finally
// loads, its ```hydrate``` method is called. All consumers of the service will
// have the now fully loaded service set, the LazyService will transfer all of
// its consumers over to the fully loaded service, and then commit seppiku,
// destroying itself.
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

    // Call all of our onLoad callbacks
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
},{"rebound-utils/rebound-utils":41}],39:[function(require,module,exports){
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; }; // Rebound AJAX
// ----------------

// Rebound includes its own ajax method so that it not dependant on a largeer library
// like jQuery. Here we expose the `ajax` method which mirrors jQuery's ajax API.
// This methods is added to Rebound's internal utility library and used throughout the framework.
// Inspiration: http://krasimirtsonev.com/blog/article/Cross-browser-handling-of-Ajax-requests-in-absurdjs

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = ajax;

var _urls = require('rebound-utils/urls');

function ajax(ops) {
    if (typeof ops == 'string') ops = { url: ops };
    ops.url = ops.url || '';
    ops.json = ops.json || true;
    ops.method = ops.method || 'get';
    ops.data = ops.data || {};
    var api = {
        host: {},
        process: function process(ops) {
            var self = this;
            this.xhr = null;
            if (window.ActiveXObject) {
                this.xhr = new ActiveXObject('Microsoft.XMLHTTP');
            } else if (window.XMLHttpRequest) {
                this.xhr = new XMLHttpRequest();
            }
            if (this.xhr) {
                this.xhr.onreadystatechange = function () {
                    if (self.xhr.readyState == 4 && self.xhr.status == 200) {
                        var result = self.xhr.responseText;
                        if (ops.json === true && typeof JSON != 'undefined') {
                            result = JSON.parse(result);
                        }
                        self.doneCallback && self.doneCallback.apply(self.host, [result, self.xhr]);
                        ops.success && ops.success.apply(self.host, [result, self.xhr]);
                    } else if (self.xhr.readyState == 4) {
                        self.failCallback && self.failCallback.apply(self.host, [self.xhr]);
                        ops.error && ops.error.apply(self.host, [self.xhr]);
                    }
                    self.alwaysCallback && self.alwaysCallback.apply(self.host, [self.xhr]);
                    ops.complete && ops.complete.apply(self.host, [self.xhr]);
                };
            }
            if (ops.method == 'get') {
                this.xhr.open("GET", ops.url + _urls.query.stringify(ops.data), true);
                this.setHeaders({
                    'X-Requested-With': 'XMLHttpRequest'
                });
            } else {
                this.xhr.open(ops.method, ops.url, true);
                this.setHeaders({
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-type': 'application/x-www-form-urlencoded'
                });
            }
            if (ops.headers && _typeof(ops.headers) == 'object') {
                this.setHeaders(ops.headers);
            }
            setTimeout(function () {
                ops.method == 'get' ? self.xhr.send() : self.xhr.send(_urls.query.stringify(ops.data));
            }, 20);
            return this.xhr;
        },
        done: function done(callback) {
            this.doneCallback = callback;
            return this;
        },
        fail: function fail(callback) {
            this.failCallback = callback;
            return this;
        },
        always: function always(callback) {
            this.alwaysCallback = callback;
            return this;
        },
        setHeaders: function setHeaders(headers) {
            for (var name in headers) {
                this.xhr && this.xhr.setRequestHeader(name, headers[name]);
            }
        }
    };
    return api.process(ops);
}
},{"rebound-utils/urls":42}],40:[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.trigger = trigger;
exports.off = off;
exports.on = on;
// Rebound DOM Events
// ----------------

// Rebound includes its own event binding and delegation helpers so the framework
// is not dependant on a large DOM library like jQuery. Here we expose `on`,
// `off` and `trigger` methods that mirror jQuery's events API for both native and
// custom event types. These methods are added to Rebound's internal utility library
// and used throughout the framework. AddEventListener supports IE9+

// Events registry. An object containing all events bound through this util shared among all instances.
var EVENT_CACHE = {};

// Make only single copies of these functions so they aren't creted repeatedly.
function returnFalse() {
	return false;
}
function returnTrue() {
	return true;
}

function Event(src, props) {
	// Allow instantiation without the 'new' keyword
	if (!(this instanceof Event)) {
		return new Event(src, props);
	}

	// If src is an Event object, save the original event object and event type
	if (src && src.type) {
		this.originalEvent = src;
		this.type = src.type;

		// Events bubbling up the document may have been marked as prevented
		// by a handler lower down the tree; reflect the correct value.
		// Support: Android<4.0
		this.isDefaultPrevented = src.defaultPrevented || src.returnValue === false ? returnTrue : returnFalse;
	}

	// Else if src is an Event type
	else {
			this.type = src;
		}

	// Put explicitly provided properties onto the event object
	if (props) {
		_.extend(this, props);
	}

	// Copy over all original event properties
	_.extend(this, _.pick(this.originalEvent, ["altKey", "bubbles", "cancelable", "ctrlKey", "currentTarget", "eventPhase", "metaKey", "relatedTarget", "shiftKey", "target", "timeStamp", "view", "which", "char", "charCode", "key", "keyCode", "button", "buttons", "clientX", "clientY", "defaultPrevented", "offsetX", "offsetY", "pageX", "pageY", "screenX", "screenY", "toElement"]));

	// Create a timestamp if incoming event doesn't have one
	this.timeStamp = src && src.timeStamp || new Date().getTime();

	// Mark it as fixed
	this.isEvent = true;
}

Event.prototype = {
	constructor: Event,
	isDefaultPrevented: returnFalse,
	isPropagationStopped: returnFalse,
	isImmediatePropagationStopped: returnFalse,

	// Call preventDefault on original event object.
	preventDefault: function preventDefault() {
		var e = this.originalEvent;
		this.defaultPrevented = true;
		this.isDefaultPrevented = returnTrue;
		if (e && e.preventDefault) {
			e.preventDefault();
		}
	},

	// Call stopPropagation on original event object.
	stopPropagation: function stopPropagation() {
		var e = this.originalEvent;
		this.isPropagationStopped = returnTrue;
		if (e && e.stopPropagation) {
			e.stopPropagation();
		}
	},

	// Call stopImmediatePropagation on original event object and call stopPropagation.
	stopImmediatePropagation: function stopImmediatePropagation() {
		var e = this.originalEvent;
		this.isImmediatePropagationStopped = returnTrue;
		if (e && e.stopImmediatePropagation) {
			e.stopImmediatePropagation();
		}
		this.stopPropagation();
	}
};

// Given a delegate element, an event type, and a test element, test every delegate ID.
// If it is the same as our test element's delegate ID, or if the test element matches
// the delegate ID when it is used as a CSS selector, add the callback to the list of
// callbacks to call.
function getCallbacks(target, delegate, eventType) {
	var callbacks = [];
	if (target.delegateGroup && EVENT_CACHE[target.delegateGroup][eventType]) {
		_.each(EVENT_CACHE[target.delegateGroup][eventType], function (callbacksList, delegateId) {
			if (_.isArray(callbacksList) && (delegateId === delegate.delegateId || delegate.matchesSelector && delegate.matchesSelector(delegateId))) {
				callbacks = callbacks.concat(callbacksList);
			}
		});
	}
	return callbacks;
}

function callback(event) {
	var target = event.target,
	    falsy = false,
	    i,
	    len,
	    callbacks;

	// Convert native Event to mutable Event
	event = new Event(event || window.event);

	// Travel from target up to parent firing event on delegate when it exists
	while (target) {

		// Attach this level's target
		event.target = event.srcElement = target;

		// Get all specified callbacks (element specific and selector specified)
		callbacks = getCallbacks(this, target, event.type);
		len = callbacks.length;

		// For each callback,
		for (i = 0; i < len; i++) {

			// Call the callback
			event.data = callbacks[i].data || {};
			event.result = callbacks[i].handler.call(callbacks[i].el, event);

			// If any of the callbacks returned false, prevent default and stop propagation
			if (event.result === false) {
				event.preventDefault();
				event.stopPropagation();
			}

			// If stopImmediatePropagation has been called, stop immediately
			if (event.isImmediatePropagationStopped()) {
				return false;
			}
		}

		// If stopPropagation has been called, stop immediately
		if (event.isPropagationStopped()) {
			return false;
		}

		// Bubble up to the next parent node and repeat
		target = target.parentNode;
	}
}

// Triggers an event on a given dom node
function trigger(eventName, options) {
	var el,
	    len = this.length;
	while (len--) {
		el = this[len];
		if (document.createEvent) {
			var event = document.createEvent('HTMLEvents');
			event.initEvent(eventName, true, false);
			el.dispatchEvent(event);
		} else {
			el.fireEvent('on' + eventName);
		}
	}
}

function off(eventTypes, handler) {
	var el,
	    len = this.length,
	    events;
	eventTypes = eventTypes ? eventTypes.split(' ') : [];

	// For each selected element
	while (len--) {
		el = this[len];

		// If this element is given a delegate ID has events directly bound to it
		if (el.delegateGroup && EVENT_CACHE[el.delegateGroup]) {

			// For each event type specified (if no event types are passed, iterate over all events)
			events = eventTypes.length ? eventTypes : Object.keys(EVENT_CACHE[el.delegateGroup]);
			_.each(events, function (eventName) {
				var newCallbacks,
				    delegate,
				    eventCount = 0,
				    eventsList = EVENT_CACHE[el.delegateGroup][eventName];

				for (delegate in eventsList) {
					if (!eventsList.hasOwnProperty(delegate) || !_.isArray(eventsList[delegate])) {
						continue;
					}
					newCallbacks = [];
					eventsList[delegate].forEach(function (callback, index) {
						if (callback.handler === handler || !handler) {
							return null;
						}
						newCallbacks.push(callback);
					});
					eventsList[delegate] = newCallbacks;
					eventCount = eventsList[delegate].length;
				}

				// If there are no more of this event type delegated for this group, remove the listener
				if (eventCount === 0) {
					el.removeEventListener(eventName, callback, eventName === 'focus' || eventName === 'blur');
					delete EVENT_CACHE[el.delegateGroup][eventName];
				}
			});
		}
	}
}

function on(eventName, delegate, data, handler) {
	var _this = this;

	var len = this.length,
	    eventNames = eventName.split(' '),
	    delegateId,
	    delegateGroup;

	// The `on` method takes one of three forms: `on(eventName, [delegate, data,] handler)`
	//  - If second param is a function, use that as our handler.
	//  - If third param is a function, use that as our handler and the second param as the delegate selector
	//  - If fourth param is a function, use that as our handler, the second param as the delegate selector, and the third params as the data object.
	if (_.isFunction(delegate)) {
		handler = delegate;data = {};delegate = void 0;
	} else if (_.isFunction(data)) {
		handler = data;data = {};delegate || (delegate = void 0);
	} else if (_.isFunction(handler)) {
		data || (data = {});delegate || (delegate = void 0);
	} else {
		return console.error("No handler passed to Rebound's $.on");
	}

	var _loop = function _loop() {
		var el = _this[len];
		delegate = delegate || _this.selector || el;

		// If our delegate selector is not a string or element, show an error.
		if (!_.isString(delegate) && !_.isElement(delegate)) {
			return {
				v: console.error("Delegate value passed to Rebound's $.on is neither an element or css selector")
			};
		}

		delegateId = _.isString(delegate) ? delegate : delegate.delegateId = delegate.delegateId || _this.uniqueId('event');
		delegateGroup = el.delegateGroup = el.delegateGroup || _this.uniqueId('delegateGroup');

		_.each(eventNames, function (eventName) {

			// Ensure event obj existance
			EVENT_CACHE[delegateGroup] = EVENT_CACHE[delegateGroup] || {};

			// If this is the first event of its type, add an event handler.
			// Because we're only ever attaching one listener per event type, this is okay.
			// This also allows our trigger method to actually fire delegated events
			// If event is focus or blur, use capture to allow for event delegation.
			if (!EVENT_CACHE[delegateGroup][eventName]) {
				el.addEventListener(eventName, callback, eventName === 'focus' || eventName === 'blur');
			}

			// Add our listener
			EVENT_CACHE[delegateGroup][eventName] = EVENT_CACHE[delegateGroup][eventName] || {};
			EVENT_CACHE[delegateGroup][eventName][delegateId] = EVENT_CACHE[delegateGroup][eventName][delegateId] || [];
			EVENT_CACHE[delegateGroup][eventName][delegateId].push({
				el: el,
				handler: handler,
				data: data
			});
		}, _this);
	};

	while (len--) {
		var _ret = _loop();

		if ((typeof _ret === "undefined" ? "undefined" : _typeof(_ret)) === "object") return _ret.v;
	}
}

exports.default = { on: on, off: off, trigger: trigger };
},{}],41:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.$ = exports.REBOUND_SYMBOL = undefined;

var _backbone = require("backbone");

var _backbone2 = _interopRequireDefault(_backbone);

var _urls = require("rebound-utils/urls");

var _ajax = require("rebound-utils/ajax");

var _ajax2 = _interopRequireDefault(_ajax);

var _events = require("rebound-utils/events");

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Rebound Utils
// ----------------

var ID_COUNTERS = {};

var REBOUND_SYMBOL = exports.REBOUND_SYMBOL = '__REBOUND_SYMBOL_PROPERTY_NAME__';

var $ = exports.$ = function $(query) {

  var i,
      selector = [];

  // Allow instantiation without the 'new' keyword
  if (!(this instanceof $)) {
    return new $(query);
  }

  // Ensure query is an array
  query = _.isArray(query) ? query : [query];

  // For each query in query array: If it is an element, push it to the selectors
  // array. If it is a string, push all elements that match to selectors array.
  _.each(query, function (item, index) {
    if (_.isElement(item) || item === document || item === window || item instanceof DocumentFragment) {
      selector.push(item);
    }
    // Call slice to convert node list to array for push. Save selector used.
    else if (_.isString(item)) {
        this.selector = item;
        Array.prototype.push.apply(selector, Array.prototype.slice.call(document.querySelectorAll(item)));
      }
  }, this);

  // Cache the length of our matched elements
  this.length = selector.length;

  // Add selector to object for method chaining
  for (i = 0; i < this.length; i++) {
    this[i] = selector[i];
  }
};

// Add url utils
$.url = { query: _urls.query };

// Add ajax util
$.ajax = _ajax2.default;

// Add event utils
$.prototype.trigger = _events2.default.trigger;
$.prototype.on = _events2.default.on;
$.prototype.off = _events2.default.off;

// Generate a unique integer id (unique within the entire client session).
$.uniqueId = $.prototype.uniqueId = function uniqueId() {
  var prefix = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

  ID_COUNTERS.hasOwnProperty(prefix) || (ID_COUNTERS[prefix] = 0);
  return prefix + ++ID_COUNTERS[prefix];
};

// Applies function `func` depth first to every node in the subtree starting from `root`
// If the callback returns `false`, short circuit that tree.
$.prototype.walkTheDOM = function walkTheDOM(func) {
  var el,
      root,
      len = this.length,
      result;
  while (len--) {
    root = this[len];
    result = func(root);
    if (result === false) {
      return void 0;
    }
    root = root.firstChild;
    while (root) {
      $(root).walkTheDOM(func);
      root = root.nextSibling;
    }
  }
};

$.prototype.unMarkLinks = function unMarkLinks() {
  var len = this.length;
  while (len--) {
    var links = this[len].querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links.item(i).classList.remove('active');
      links.item(i).active = false;
    }
  }
  return this;
};

$.prototype.markLinks = function markLinks() {
  var len = this.length;
  while (len--) {
    var links = this[len].querySelectorAll('a[href="/' + _backbone2.default.history.fragment + '"]');
    for (var i = 0; i < links.length; i++) {
      links.item(i).classList.add('active');
      links.item(i).active = true;
    }
  }
  return this;
};

// Empty all selected nodes
$.prototype.empty = function empty() {
  var len = this.length;
  while (len--) {
    while (this[len].hasChildNodes()) {
      this[len].removeChild(this[len].firstChild);
    }
  }
  return this;
};

// Given a valid data path, split it into an array of its parts.
// ex: foo.bar[0].baz --> ['foo', 'var', '0', 'baz']
$.splitPath = function splitPath(path) {
  path = ('.' + path + '.').split(/(?:\.|\[|\])+/);
  path.pop();
  path.shift();
  return path;
};

// Searches each key in an object and tests if the property has a lookupGetter or
// lookupSetter. If either are preset convert the property into a computed property.
$.extractComputedProps = function extractComputedProps(obj) {
  for (var key in obj) {
    var get = undefined,
        set = undefined;
    if (!obj.hasOwnProperty(key)) continue;
    var desc = Object.getOwnPropertyDescriptor(obj, key);
    get = desc.hasOwnProperty('get') && desc.get;
    set = desc.hasOwnProperty('set') && desc.set;
    if (get || set) {
      delete obj[key];
      obj[key] = { get: get, set: set, isComputedProto: true };
    }
  }
};

// Returns true if the data path `str` starts with `test`
$.startsWith = function startsWith(str, test) {
  if (str === test) return true;
  str = $.splitPath(str);
  test = $.splitPath(test);
  while (test[0] && str[0]) {
    if (str[0] !== test[0] && str[0] !== '@each' && test[0] !== '@each') return false;
    test.shift();
    str.shift();
  }
  return true;
};

exports.default = $;
},{"backbone":45,"rebound-utils/ajax":39,"rebound-utils/events":40,"rebound-utils/urls":42}],42:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.query = undefined;

var _qs = require("qs");

var _qs2 = _interopRequireDefault(_qs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var QS_STRINGIFY_OPTS = {
  allowDots: true,
  encode: false,
  delimiter: '&'
};

var QS_PARSE_OPTS = {
  allowDots: true,
  delimiter: /[;,&]/
};

var query = {
  stringify: function stringify(str) {
    return _qs2.default.stringify(str, QS_STRINGIFY_OPTS);
  },
  parse: function parse(obj) {
    return _qs2.default.parse(obj, QS_PARSE_OPTS);
  }
};

exports.query = query;
},{"qs":105}],43:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _backbone = require("backbone");

var _backbone2 = _interopRequireDefault(_backbone);

var _reboundUtils = require("rebound-utils/rebound-utils");

var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

var _reboundData = require("rebound-data/rebound-data");

var _reboundRouter = require("rebound-router/rebound-router");

var _reboundHtmlbars = require("rebound-htmlbars/rebound-htmlbars");

var _factory = require("rebound-component/factory");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Because of our bundle and how it plays with Backbone's UMD header, we need to
// be a little more explicit with out DOM library search.
//     Rebound.js v0.3.3

//     (c) 2015 Adam Miller
//     Rebound may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://reboundjs.com

// Rebound Runtime
// ----------------

// Import Backbone
_backbone2.default.$ = window.$;

// If Backbone doesn't have an ajax method from an external DOM library, use ours

// Load our **Utils**, helper environment, **Rebound Data**,
// **Rebound Components** and the **Rebound Router**
_backbone2.default.ajax = _backbone2.default.$ && _backbone2.default.$.ajax && _backbone2.default.ajax || _reboundUtils2.default.ajax;

// Fetch Rebound's Config Object from Rebound's `script` tag
var Config = document.getElementById('Rebound');
Config = Config ? JSON.parse(Config.innerHTML) : false;

var Rebound = window.Rebound = {
  version: '0.3.3',
  testing: window.Rebound && window.Rebound.testing || Config && Config.testing || false,

  registerHelper: _reboundHtmlbars.registerHelper,
  registerPartial: _reboundHtmlbars.registerPartial,
  registerComponent: _factory.registerComponent,

  Component: _factory.ComponentFactory,
  Model: _reboundData.Model,
  Collection: _reboundData.Collection,
  ComputedProperty: _reboundData.ComputedProperty,

  history: _backbone2.default.history,
  services: _reboundRouter.services,
  start: function start(options) {
    var R = this;
    return new Promise(function (resolve, reject) {
      var run = function run() {
        if (!document.body) {
          return setTimeout(run.bind(R), 1);
        }
        delete R.router;
        R.router = new _reboundRouter.Router(options, resolve);
      };
      run();
    });
  },
  stop: function stop() {
    if (!this.router) return console.error('No running Rebound router found!');
    this.router.stop();
  }
};

// Start the router if a config object is preset
if (Config) {
  Rebound.start(Config);
}

exports.default = Rebound;
},{"backbone":45,"rebound-component/factory":6,"rebound-data/rebound-data":10,"rebound-htmlbars/rebound-htmlbars":34,"rebound-router/rebound-router":37,"rebound-utils/rebound-utils":41}],44:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.acorn = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// A recursive descent parser operates by defining functions for all
// syntactic elements, and recursively calling those, each function
// advancing the input stream and returning an AST node. Precedence
// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
// instead of `(!x)[1]` is handled by the fact that the parser
// function that parses unary prefix operators is called first, and
// in turn calls the function that parses `[]` subscripts — that
// way, it'll receive the node for `x[1]` already parsed, and wraps
// *that* in the unary operator node.
//
// Acorn uses an [operator precedence parser][opp] to handle binary
// operator precedence, because it is much more compact than using
// the technique outlined above, which uses different, nesting
// functions to specify precedence, for all of the ten binary
// precedence levels that JavaScript defines.
//
// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

"use strict";

var _tokentype = _dereq_("./tokentype");

var _state = _dereq_("./state");

var pp = _state.Parser.prototype;

// Check if property name clashes with already added.
// Object/class getters and setters are not allowed to clash —
// either with each other or with an init property — and in
// strict mode, init properties are also not allowed to be repeated.

pp.checkPropClash = function (prop, propHash) {
  if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand)) return;
  var key = prop.key;var name = undefined;
  switch (key.type) {
    case "Identifier":
      name = key.name;break;
    case "Literal":
      name = String(key.value);break;
    default:
      return;
  }
  var kind = prop.kind;

  if (this.options.ecmaVersion >= 6) {
    if (name === "__proto__" && kind === "init") {
      if (propHash.proto) this.raise(key.start, "Redefinition of __proto__ property");
      propHash.proto = true;
    }
    return;
  }
  name = "$" + name;
  var other = propHash[name];
  if (other) {
    var isGetSet = kind !== "init";
    if ((this.strict || isGetSet) && other[kind] || !(isGetSet ^ other.init)) this.raise(key.start, "Redefinition of property");
  } else {
    other = propHash[name] = {
      init: false,
      get: false,
      set: false
    };
  }
  other[kind] = true;
};

// ### Expression parsing

// These nest, from the most general expression type at the top to
// 'atomic', nondivisible expression types at the bottom. Most of
// the functions will simply let the function(s) below them parse,
// and, *if* the syntactic construct they handle is present, wrap
// the AST node that the inner parser gave them in another node.

// Parse a full expression. The optional arguments are used to
// forbid the `in` operator (in for loops initalization expressions)
// and provide reference for storing '=' operator inside shorthand
// property assignment in contexts where both object expression
// and object pattern might appear (so it's possible to raise
// delayed syntax error at correct position).

pp.parseExpression = function (noIn, refDestructuringErrors) {
  var startPos = this.start,
      startLoc = this.startLoc;
  var expr = this.parseMaybeAssign(noIn, refDestructuringErrors);
  if (this.type === _tokentype.types.comma) {
    var node = this.startNodeAt(startPos, startLoc);
    node.expressions = [expr];
    while (this.eat(_tokentype.types.comma)) node.expressions.push(this.parseMaybeAssign(noIn, refDestructuringErrors));
    return this.finishNode(node, "SequenceExpression");
  }
  return expr;
};

// Parse an assignment expression. This includes applications of
// operators like `+=`.

pp.parseMaybeAssign = function (noIn, refDestructuringErrors, afterLeftParse) {
  if (this.type == _tokentype.types._yield && this.inGenerator) return this.parseYield();

  var validateDestructuring = false;
  if (!refDestructuringErrors) {
    refDestructuringErrors = { shorthandAssign: 0, trailingComma: 0 };
    validateDestructuring = true;
  }
  var startPos = this.start,
      startLoc = this.startLoc;
  if (this.type == _tokentype.types.parenL || this.type == _tokentype.types.name) this.potentialArrowAt = this.start;
  var left = this.parseMaybeConditional(noIn, refDestructuringErrors);
  if (afterLeftParse) left = afterLeftParse.call(this, left, startPos, startLoc);
  if (this.type.isAssign) {
    if (validateDestructuring) this.checkPatternErrors(refDestructuringErrors, true);
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.value;
    node.left = this.type === _tokentype.types.eq ? this.toAssignable(left) : left;
    refDestructuringErrors.shorthandAssign = 0; // reset because shorthand default was used correctly
    this.checkLVal(left);
    this.next();
    node.right = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "AssignmentExpression");
  } else {
    if (validateDestructuring) this.checkExpressionErrors(refDestructuringErrors, true);
  }
  return left;
};

// Parse a ternary conditional (`?:`) operator.

pp.parseMaybeConditional = function (noIn, refDestructuringErrors) {
  var startPos = this.start,
      startLoc = this.startLoc;
  var expr = this.parseExprOps(noIn, refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) return expr;
  if (this.eat(_tokentype.types.question)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.test = expr;
    node.consequent = this.parseMaybeAssign();
    this.expect(_tokentype.types.colon);
    node.alternate = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "ConditionalExpression");
  }
  return expr;
};

// Start the precedence parser.

pp.parseExprOps = function (noIn, refDestructuringErrors) {
  var startPos = this.start,
      startLoc = this.startLoc;
  var expr = this.parseMaybeUnary(refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) return expr;
  return this.parseExprOp(expr, startPos, startLoc, -1, noIn);
};

// Parse binary operators with the operator precedence parsing
// algorithm. `left` is the left-hand side of the operator.
// `minPrec` provides context that allows the function to stop and
// defer further parser to one of its callers when it encounters an
// operator that has a lower precedence than the set it is parsing.

pp.parseExprOp = function (left, leftStartPos, leftStartLoc, minPrec, noIn) {
  var prec = this.type.binop;
  if (prec != null && (!noIn || this.type !== _tokentype.types._in)) {
    if (prec > minPrec) {
      var node = this.startNodeAt(leftStartPos, leftStartLoc);
      node.left = left;
      node.operator = this.value;
      var op = this.type;
      this.next();
      var startPos = this.start,
          startLoc = this.startLoc;
      node.right = this.parseExprOp(this.parseMaybeUnary(), startPos, startLoc, prec, noIn);
      this.finishNode(node, op === _tokentype.types.logicalOR || op === _tokentype.types.logicalAND ? "LogicalExpression" : "BinaryExpression");
      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn);
    }
  }
  return left;
};

// Parse unary operators, both prefix and postfix.

pp.parseMaybeUnary = function (refDestructuringErrors) {
  if (this.type.prefix) {
    var node = this.startNode(),
        update = this.type === _tokentype.types.incDec;
    node.operator = this.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseMaybeUnary();
    this.checkExpressionErrors(refDestructuringErrors, true);
    if (update) this.checkLVal(node.argument);else if (this.strict && node.operator === "delete" && node.argument.type === "Identifier") this.raise(node.start, "Deleting local variable in strict mode");
    return this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
  }
  var startPos = this.start,
      startLoc = this.startLoc;
  var expr = this.parseExprSubscripts(refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) return expr;
  while (this.type.postfix && !this.canInsertSemicolon()) {
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.value;
    node.prefix = false;
    node.argument = expr;
    this.checkLVal(expr);
    this.next();
    expr = this.finishNode(node, "UpdateExpression");
  }
  return expr;
};

// Parse call, dot, and `[]`-subscript expressions.

pp.parseExprSubscripts = function (refDestructuringErrors) {
  var startPos = this.start,
      startLoc = this.startLoc;
  var expr = this.parseExprAtom(refDestructuringErrors);
  var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")";
  if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) return expr;
  return this.parseSubscripts(expr, startPos, startLoc);
};

pp.parseSubscripts = function (base, startPos, startLoc, noCalls) {
  for (;;) {
    if (this.eat(_tokentype.types.dot)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.object = base;
      node.property = this.parseIdent(true);
      node.computed = false;
      base = this.finishNode(node, "MemberExpression");
    } else if (this.eat(_tokentype.types.bracketL)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.object = base;
      node.property = this.parseExpression();
      node.computed = true;
      this.expect(_tokentype.types.bracketR);
      base = this.finishNode(node, "MemberExpression");
    } else if (!noCalls && this.eat(_tokentype.types.parenL)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.callee = base;
      node.arguments = this.parseExprList(_tokentype.types.parenR, false);
      base = this.finishNode(node, "CallExpression");
    } else if (this.type === _tokentype.types.backQuote) {
      var node = this.startNodeAt(startPos, startLoc);
      node.tag = base;
      node.quasi = this.parseTemplate();
      base = this.finishNode(node, "TaggedTemplateExpression");
    } else {
      return base;
    }
  }
};

// Parse an atomic expression — either a single token that is an
// expression, an expression started by a keyword like `function` or
// `new`, or an expression wrapped in punctuation like `()`, `[]`,
// or `{}`.

pp.parseExprAtom = function (refDestructuringErrors) {
  var node = undefined,
      canBeArrow = this.potentialArrowAt == this.start;
  switch (this.type) {
    case _tokentype.types._super:
      if (!this.inFunction) this.raise(this.start, "'super' outside of function or class");
    case _tokentype.types._this:
      var type = this.type === _tokentype.types._this ? "ThisExpression" : "Super";
      node = this.startNode();
      this.next();
      return this.finishNode(node, type);

    case _tokentype.types._yield:
      if (this.inGenerator) this.unexpected();

    case _tokentype.types.name:
      var startPos = this.start,
          startLoc = this.startLoc;
      var id = this.parseIdent(this.type !== _tokentype.types.name);
      if (canBeArrow && !this.canInsertSemicolon() && this.eat(_tokentype.types.arrow)) return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id]);
      return id;

    case _tokentype.types.regexp:
      var value = this.value;
      node = this.parseLiteral(value.value);
      node.regex = { pattern: value.pattern, flags: value.flags };
      return node;

    case _tokentype.types.num:case _tokentype.types.string:
      return this.parseLiteral(this.value);

    case _tokentype.types._null:case _tokentype.types._true:case _tokentype.types._false:
      node = this.startNode();
      node.value = this.type === _tokentype.types._null ? null : this.type === _tokentype.types._true;
      node.raw = this.type.keyword;
      this.next();
      return this.finishNode(node, "Literal");

    case _tokentype.types.parenL:
      return this.parseParenAndDistinguishExpression(canBeArrow);

    case _tokentype.types.bracketL:
      node = this.startNode();
      this.next();
      // check whether this is array comprehension or regular array
      if (this.options.ecmaVersion >= 7 && this.type === _tokentype.types._for) {
        return this.parseComprehension(node, false);
      }
      node.elements = this.parseExprList(_tokentype.types.bracketR, true, true, refDestructuringErrors);
      return this.finishNode(node, "ArrayExpression");

    case _tokentype.types.braceL:
      return this.parseObj(false, refDestructuringErrors);

    case _tokentype.types._function:
      node = this.startNode();
      this.next();
      return this.parseFunction(node, false);

    case _tokentype.types._class:
      return this.parseClass(this.startNode(), false);

    case _tokentype.types._new:
      return this.parseNew();

    case _tokentype.types.backQuote:
      return this.parseTemplate();

    default:
      this.unexpected();
  }
};

pp.parseLiteral = function (value) {
  var node = this.startNode();
  node.value = value;
  node.raw = this.input.slice(this.start, this.end);
  this.next();
  return this.finishNode(node, "Literal");
};

pp.parseParenExpression = function () {
  this.expect(_tokentype.types.parenL);
  var val = this.parseExpression();
  this.expect(_tokentype.types.parenR);
  return val;
};

pp.parseParenAndDistinguishExpression = function (canBeArrow) {
  var startPos = this.start,
      startLoc = this.startLoc,
      val = undefined;
  if (this.options.ecmaVersion >= 6) {
    this.next();

    if (this.options.ecmaVersion >= 7 && this.type === _tokentype.types._for) {
      return this.parseComprehension(this.startNodeAt(startPos, startLoc), true);
    }

    var innerStartPos = this.start,
        innerStartLoc = this.startLoc;
    var exprList = [],
        first = true;
    var refDestructuringErrors = { shorthandAssign: 0, trailingComma: 0 },
        spreadStart = undefined,
        innerParenStart = undefined;
    while (this.type !== _tokentype.types.parenR) {
      first ? first = false : this.expect(_tokentype.types.comma);
      if (this.type === _tokentype.types.ellipsis) {
        spreadStart = this.start;
        exprList.push(this.parseParenItem(this.parseRest()));
        break;
      } else {
        if (this.type === _tokentype.types.parenL && !innerParenStart) {
          innerParenStart = this.start;
        }
        exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
      }
    }
    var innerEndPos = this.start,
        innerEndLoc = this.startLoc;
    this.expect(_tokentype.types.parenR);

    if (canBeArrow && !this.canInsertSemicolon() && this.eat(_tokentype.types.arrow)) {
      this.checkPatternErrors(refDestructuringErrors, true);
      if (innerParenStart) this.unexpected(innerParenStart);
      return this.parseParenArrowList(startPos, startLoc, exprList);
    }

    if (!exprList.length) this.unexpected(this.lastTokStart);
    if (spreadStart) this.unexpected(spreadStart);
    this.checkExpressionErrors(refDestructuringErrors, true);

    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }
  } else {
    val = this.parseParenExpression();
  }

  if (this.options.preserveParens) {
    var par = this.startNodeAt(startPos, startLoc);
    par.expression = val;
    return this.finishNode(par, "ParenthesizedExpression");
  } else {
    return val;
  }
};

pp.parseParenItem = function (item) {
  return item;
};

pp.parseParenArrowList = function (startPos, startLoc, exprList) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList);
};

// New's precedence is slightly tricky. It must allow its argument to
// be a `[]` or dot subscript expression, but not a call — at least,
// not without wrapping it in parentheses. Thus, it uses the noCalls
// argument to parseSubscripts to prevent it from consuming the
// argument list.

var empty = [];

pp.parseNew = function () {
  var node = this.startNode();
  var meta = this.parseIdent(true);
  if (this.options.ecmaVersion >= 6 && this.eat(_tokentype.types.dot)) {
    node.meta = meta;
    node.property = this.parseIdent(true);
    if (node.property.name !== "target") this.raise(node.property.start, "The only valid meta property for new is new.target");
    if (!this.inFunction) this.raise(node.start, "new.target can only be used in functions");
    return this.finishNode(node, "MetaProperty");
  }
  var startPos = this.start,
      startLoc = this.startLoc;
  node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
  if (this.eat(_tokentype.types.parenL)) node.arguments = this.parseExprList(_tokentype.types.parenR, false);else node.arguments = empty;
  return this.finishNode(node, "NewExpression");
};

// Parse template expression.

pp.parseTemplateElement = function () {
  var elem = this.startNode();
  elem.value = {
    raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, '\n'),
    cooked: this.value
  };
  this.next();
  elem.tail = this.type === _tokentype.types.backQuote;
  return this.finishNode(elem, "TemplateElement");
};

pp.parseTemplate = function () {
  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement();
  node.quasis = [curElt];
  while (!curElt.tail) {
    this.expect(_tokentype.types.dollarBraceL);
    node.expressions.push(this.parseExpression());
    this.expect(_tokentype.types.braceR);
    node.quasis.push(curElt = this.parseTemplateElement());
  }
  this.next();
  return this.finishNode(node, "TemplateLiteral");
};

// Parse an object literal or binding pattern.

pp.parseObj = function (isPattern, refDestructuringErrors) {
  var node = this.startNode(),
      first = true,
      propHash = {};
  node.properties = [];
  this.next();
  while (!this.eat(_tokentype.types.braceR)) {
    if (!first) {
      this.expect(_tokentype.types.comma);
      if (this.afterTrailingComma(_tokentype.types.braceR)) break;
    } else first = false;

    var prop = this.startNode(),
        isGenerator = undefined,
        startPos = undefined,
        startLoc = undefined;
    if (this.options.ecmaVersion >= 6) {
      prop.method = false;
      prop.shorthand = false;
      if (isPattern || refDestructuringErrors) {
        startPos = this.start;
        startLoc = this.startLoc;
      }
      if (!isPattern) isGenerator = this.eat(_tokentype.types.star);
    }
    this.parsePropertyName(prop);
    this.parsePropertyValue(prop, isPattern, isGenerator, startPos, startLoc, refDestructuringErrors);
    this.checkPropClash(prop, propHash);
    node.properties.push(this.finishNode(prop, "Property"));
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression");
};

pp.parsePropertyValue = function (prop, isPattern, isGenerator, startPos, startLoc, refDestructuringErrors) {
  if (this.eat(_tokentype.types.colon)) {
    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
    prop.kind = "init";
  } else if (this.options.ecmaVersion >= 6 && this.type === _tokentype.types.parenL) {
    if (isPattern) this.unexpected();
    prop.kind = "init";
    prop.method = true;
    prop.value = this.parseMethod(isGenerator);
  } else if (this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" && (prop.key.name === "get" || prop.key.name === "set") && (this.type != _tokentype.types.comma && this.type != _tokentype.types.braceR)) {
    if (isGenerator || isPattern) this.unexpected();
    prop.kind = prop.key.name;
    this.parsePropertyName(prop);
    prop.value = this.parseMethod(false);
    var paramCount = prop.kind === "get" ? 0 : 1;
    if (prop.value.params.length !== paramCount) {
      var start = prop.value.start;
      if (prop.kind === "get") this.raise(start, "getter should have no params");else this.raise(start, "setter should have exactly one param");
    }
    if (prop.kind === "set" && prop.value.params[0].type === "RestElement") this.raise(prop.value.params[0].start, "Setter cannot use rest params");
  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
    prop.kind = "init";
    if (isPattern) {
      if (this.keywords.test(prop.key.name) || (this.strict ? this.reservedWordsStrictBind : this.reservedWords).test(prop.key.name)) this.raise(prop.key.start, "Binding " + prop.key.name);
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else if (this.type === _tokentype.types.eq && refDestructuringErrors) {
      if (!refDestructuringErrors.shorthandAssign) refDestructuringErrors.shorthandAssign = this.start;
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else {
      prop.value = prop.key;
    }
    prop.shorthand = true;
  } else this.unexpected();
};

pp.parsePropertyName = function (prop) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(_tokentype.types.bracketL)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssign();
      this.expect(_tokentype.types.bracketR);
      return prop.key;
    } else {
      prop.computed = false;
    }
  }
  return prop.key = this.type === _tokentype.types.num || this.type === _tokentype.types.string ? this.parseExprAtom() : this.parseIdent(true);
};

// Initialize empty function node.

pp.initFunction = function (node) {
  node.id = null;
  if (this.options.ecmaVersion >= 6) {
    node.generator = false;
    node.expression = false;
  }
};

// Parse object or class method.

pp.parseMethod = function (isGenerator) {
  var node = this.startNode();
  this.initFunction(node);
  this.expect(_tokentype.types.parenL);
  node.params = this.parseBindingList(_tokentype.types.parenR, false, false);
  if (this.options.ecmaVersion >= 6) node.generator = isGenerator;
  this.parseFunctionBody(node, false);
  return this.finishNode(node, "FunctionExpression");
};

// Parse arrow function expression with given parameters.

pp.parseArrowExpression = function (node, params) {
  this.initFunction(node);
  node.params = this.toAssignableList(params, true);
  this.parseFunctionBody(node, true);
  return this.finishNode(node, "ArrowFunctionExpression");
};

// Parse function body and check parameters.

pp.parseFunctionBody = function (node, isArrowFunction) {
  var isExpression = isArrowFunction && this.type !== _tokentype.types.braceL;

  if (isExpression) {
    node.body = this.parseMaybeAssign();
    node.expression = true;
  } else {
    // Start a new scope with regard to labels and the `inFunction`
    // flag (restore them to their old value afterwards).
    var oldInFunc = this.inFunction,
        oldInGen = this.inGenerator,
        oldLabels = this.labels;
    this.inFunction = true;this.inGenerator = node.generator;this.labels = [];
    node.body = this.parseBlock(true);
    node.expression = false;
    this.inFunction = oldInFunc;this.inGenerator = oldInGen;this.labels = oldLabels;
  }

  // If this is a strict mode function, verify that argument names
  // are not repeated, and it does not try to bind the words `eval`
  // or `arguments`.
  if (this.strict || !isExpression && node.body.body.length && this.isUseStrict(node.body.body[0])) {
    var oldStrict = this.strict;
    this.strict = true;
    if (node.id) this.checkLVal(node.id, true);
    this.checkParams(node);
    this.strict = oldStrict;
  } else if (isArrowFunction) {
    this.checkParams(node);
  }
};

// Checks function params for various disallowed patterns such as using "eval"
// or "arguments" and duplicate parameters.

pp.checkParams = function (node) {
  var nameHash = {};
  for (var i = 0; i < node.params.length; i++) {
    this.checkLVal(node.params[i], true, nameHash);
  }
};

// Parses a comma-separated list of expressions, and returns them as
// an array. `close` is the token type that ends the list, and
// `allowEmpty` can be turned on to allow subsequent commas with
// nothing in between them to be parsed as `null` (which is needed
// for array literals).

pp.parseExprList = function (close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
  var elts = [],
      first = true;
  while (!this.eat(close)) {
    if (!first) {
      this.expect(_tokentype.types.comma);
      if (this.type === close && refDestructuringErrors && !refDestructuringErrors.trailingComma) {
        refDestructuringErrors.trailingComma = this.lastTokStart;
      }
      if (allowTrailingComma && this.afterTrailingComma(close)) break;
    } else first = false;

    var elt = undefined;
    if (allowEmpty && this.type === _tokentype.types.comma) elt = null;else if (this.type === _tokentype.types.ellipsis) elt = this.parseSpread(refDestructuringErrors);else elt = this.parseMaybeAssign(false, refDestructuringErrors);
    elts.push(elt);
  }
  return elts;
};

// Parse the next token as an identifier. If `liberal` is true (used
// when parsing properties), it will also convert keywords into
// identifiers.

pp.parseIdent = function (liberal) {
  var node = this.startNode();
  if (liberal && this.options.allowReserved == "never") liberal = false;
  if (this.type === _tokentype.types.name) {
    if (!liberal && (this.strict ? this.reservedWordsStrict : this.reservedWords).test(this.value) && (this.options.ecmaVersion >= 6 || this.input.slice(this.start, this.end).indexOf("\\") == -1)) this.raise(this.start, "The keyword '" + this.value + "' is reserved");
    node.name = this.value;
  } else if (liberal && this.type.keyword) {
    node.name = this.type.keyword;
  } else {
    this.unexpected();
  }
  this.next();
  return this.finishNode(node, "Identifier");
};

// Parses yield expression inside generator.

pp.parseYield = function () {
  var node = this.startNode();
  this.next();
  if (this.type == _tokentype.types.semi || this.canInsertSemicolon() || this.type != _tokentype.types.star && !this.type.startsExpr) {
    node.delegate = false;
    node.argument = null;
  } else {
    node.delegate = this.eat(_tokentype.types.star);
    node.argument = this.parseMaybeAssign();
  }
  return this.finishNode(node, "YieldExpression");
};

// Parses array and generator comprehensions.

pp.parseComprehension = function (node, isGenerator) {
  node.blocks = [];
  while (this.type === _tokentype.types._for) {
    var block = this.startNode();
    this.next();
    this.expect(_tokentype.types.parenL);
    block.left = this.parseBindingAtom();
    this.checkLVal(block.left, true);
    this.expectContextual("of");
    block.right = this.parseExpression();
    this.expect(_tokentype.types.parenR);
    node.blocks.push(this.finishNode(block, "ComprehensionBlock"));
  }
  node.filter = this.eat(_tokentype.types._if) ? this.parseParenExpression() : null;
  node.body = this.parseExpression();
  this.expect(isGenerator ? _tokentype.types.parenR : _tokentype.types.bracketR);
  node.generator = isGenerator;
  return this.finishNode(node, "ComprehensionExpression");
};

},{"./state":10,"./tokentype":14}],2:[function(_dereq_,module,exports){
// This is a trick taken from Esprima. It turns out that, on
// non-Chrome browsers, to check whether a string is in a set, a
// predicate containing a big ugly `switch` statement is faster than
// a regular expression, and on Chrome the two are about on par.
// This function uses `eval` (non-lexical) to produce such a
// predicate from a space-separated string of words.
//
// It starts by sorting the words by length.

// Reserved word lists for various dialects of the language

"use strict";

exports.__esModule = true;
exports.isIdentifierStart = isIdentifierStart;
exports.isIdentifierChar = isIdentifierChar;
var reservedWords = {
  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
  5: "class enum extends super const export import",
  6: "enum",
  strict: "implements interface let package private protected public static yield",
  strictBind: "eval arguments"
};

exports.reservedWords = reservedWords;
// And the keywords

var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

var keywords = {
  5: ecma5AndLessKeywords,
  6: ecma5AndLessKeywords + " let const class extends export import yield super"
};

exports.keywords = keywords;
// ## Character categories

// Big ugly regular expressions that match characters in the
// whitespace, identifier, and identifier-start categories. These
// are only applied when a character is found to actually have a
// code point above 128.
// Generated by `bin/generate-identifier-regex.js`.

var nonASCIIidentifierStartChars = "ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽͿΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԯԱ-Ֆՙա-ևא-תװ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠ-ࢲऄ-हऽॐक़-ॡॱ-ঀঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡೱೲഅ-ഌഎ-ഐഒ-ഺഽൎൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛸᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤞᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᳵᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕ℘-ℝℤΩℨK-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞ々-〇〡-〩〱-〵〸-〼ぁ-ゖ゛-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚝꚠ-ꛯꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞭꞰꞱꟷ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꧠ-ꧤꧦ-ꧯꧺ-ꧾꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꩾ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꬰ-ꭚꭜ-ꭟꭤꭥꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ";
var nonASCIIidentifierChars = "‌‍·̀-ͯ·҃-֑҇-ׇֽֿׁׂׅׄؐ-ًؚ-٩ٰۖ-ۜ۟-۪ۤۧۨ-ۭ۰-۹ܑܰ-݊ަ-ް߀-߉߫-߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࡙࠭-࡛ࣤ-ःऺ-़ा-ॏ॑-ॗॢॣ०-९ঁ-ঃ়া-ৄেৈো-্ৗৢৣ০-৯ਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑ੦-ੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢૣ૦-૯ଁ-ଃ଼ା-ୄେୈୋ-୍ୖୗୢୣ୦-୯ஂா-ூெ-ைொ-்ௗ௦-௯ఀ-ఃా-ౄె-ైొ-్ౕౖౢౣ౦-౯ಁ-ಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢೣ೦-೯ഁ-ഃാ-ൄെ-ൈൊ-്ൗൢൣ൦-൯ංඃ්ා-ුූෘ-ෟ෦-෯ෲෳัิ-ฺ็-๎๐-๙ັິ-ູົຼ່-ໍ໐-໙༘༙༠-༩༹༵༷༾༿ཱ-྄྆྇ྍ-ྗྙ-ྼ࿆ါ-ှ၀-၉ၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏ-ႝ፝-፟፩-፱ᜒ-᜔ᜲ-᜴ᝒᝓᝲᝳ឴-៓៝០-៩᠋-᠍᠐-᠙ᢩᤠ-ᤫᤰ-᤻᥆-᥏ᦰ-ᧀᧈᧉ᧐-᧚ᨗ-ᨛᩕ-ᩞ᩠-᩿᩼-᪉᪐-᪙᪰-᪽ᬀ-ᬄ᬴-᭄᭐-᭙᭫-᭳ᮀ-ᮂᮡ-ᮭ᮰-᮹᯦-᯳ᰤ-᰷᱀-᱉᱐-᱙᳐-᳔᳒-᳨᳭ᳲ-᳴᳸᳹᷀-᷵᷼-᷿‿⁀⁔⃐-⃥⃜⃡-⃰⳯-⵿⳱ⷠ-〪ⷿ-゙゚〯꘠-꘩꙯ꙴ-꙽ꚟ꛰꛱ꠂ꠆ꠋꠣ-ꠧꢀꢁꢴ-꣄꣐-꣙꣠-꣱꤀-꤉ꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀꧐-꧙ꧥ꧰-꧹ꨩ-ꨶꩃꩌꩍ꩐-꩙ꩻ-ꩽꪰꪲ-ꪴꪷꪸꪾ꪿꫁ꫫ-ꫯꫵ꫶ꯣ-ꯪ꯬꯭꯰-꯹ﬞ︀-️︠-︭︳︴﹍-﹏０-９＿";

var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;

// These are a run-length and offset encoded representation of the
// >0xffff code points that are a valid part of identifiers. The
// offset starts at 0x10000, and each pair of numbers represents an
// offset to the next range, and then a size of the range. They were
// generated by tools/generate-identifier-regex.js
var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 17, 26, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 99, 39, 9, 51, 157, 310, 10, 21, 11, 7, 153, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 98, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 26, 45, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 955, 52, 76, 44, 33, 24, 27, 35, 42, 34, 4, 0, 13, 47, 15, 3, 22, 0, 38, 17, 2, 24, 133, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 32, 4, 287, 47, 21, 1, 2, 0, 185, 46, 82, 47, 21, 0, 60, 42, 502, 63, 32, 0, 449, 56, 1288, 920, 104, 110, 2962, 1070, 13266, 568, 8, 30, 114, 29, 19, 47, 17, 3, 32, 20, 6, 18, 881, 68, 12, 0, 67, 12, 16481, 1, 3071, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 4149, 196, 1340, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42710, 42, 4148, 12, 221, 16355, 541];
var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 1306, 2, 54, 14, 32, 9, 16, 3, 46, 10, 54, 9, 7, 2, 37, 13, 2, 9, 52, 0, 13, 2, 49, 13, 16, 9, 83, 11, 168, 11, 6, 9, 8, 2, 57, 0, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 316, 19, 13, 9, 214, 6, 3, 8, 112, 16, 16, 9, 82, 12, 9, 9, 535, 9, 20855, 9, 135, 4, 60, 6, 26, 9, 1016, 45, 17, 3, 19723, 1, 5319, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 4305, 6, 792618, 239];

// This has a complexity linear to the value of the code. The
// assumption is that looking up astral identifier characters is
// rare.
function isInAstralSet(code, set) {
  var pos = 0x10000;
  for (var i = 0; i < set.length; i += 2) {
    pos += set[i];
    if (pos > code) return false;
    pos += set[i + 1];
    if (pos >= code) return true;
  }
}

// Test whether a given character code starts an identifier.

function isIdentifierStart(code, astral) {
  if (code < 65) return code === 36;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;
  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  if (astral === false) return false;
  return isInAstralSet(code, astralIdentifierStartCodes);
}

// Test whether a given character is part of an identifier.

function isIdentifierChar(code, astral) {
  if (code < 48) return code === 36;
  if (code < 58) return true;
  if (code < 65) return false;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;
  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  if (astral === false) return false;
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}

},{}],3:[function(_dereq_,module,exports){
// Acorn is a tiny, fast JavaScript parser written in JavaScript.
//
// Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
// various contributors and released under an MIT license.
//
// Git repositories for Acorn are available at
//
//     http://marijnhaverbeke.nl/git/acorn
//     https://github.com/ternjs/acorn.git
//
// Please use the [github bug tracker][ghbt] to report issues.
//
// [ghbt]: https://github.com/ternjs/acorn/issues
//
// This file defines the main parser interface. The library also comes
// with a [error-tolerant parser][dammit] and an
// [abstract syntax tree walker][walk], defined in other files.
//
// [dammit]: acorn_loose.js
// [walk]: util/walk.js

"use strict";

exports.__esModule = true;
exports.parse = parse;
exports.parseExpressionAt = parseExpressionAt;
exports.tokenizer = tokenizer;

var _state = _dereq_("./state");

_dereq_("./parseutil");

_dereq_("./statement");

_dereq_("./lval");

_dereq_("./expression");

_dereq_("./location");

exports.Parser = _state.Parser;
exports.plugins = _state.plugins;

var _options = _dereq_("./options");

exports.defaultOptions = _options.defaultOptions;

var _locutil = _dereq_("./locutil");

exports.Position = _locutil.Position;
exports.SourceLocation = _locutil.SourceLocation;
exports.getLineInfo = _locutil.getLineInfo;

var _node = _dereq_("./node");

exports.Node = _node.Node;

var _tokentype = _dereq_("./tokentype");

exports.TokenType = _tokentype.TokenType;
exports.tokTypes = _tokentype.types;

var _tokencontext = _dereq_("./tokencontext");

exports.TokContext = _tokencontext.TokContext;
exports.tokContexts = _tokencontext.types;

var _identifier = _dereq_("./identifier");

exports.isIdentifierChar = _identifier.isIdentifierChar;
exports.isIdentifierStart = _identifier.isIdentifierStart;

var _tokenize = _dereq_("./tokenize");

exports.Token = _tokenize.Token;

var _whitespace = _dereq_("./whitespace");

exports.isNewLine = _whitespace.isNewLine;
exports.lineBreak = _whitespace.lineBreak;
exports.lineBreakG = _whitespace.lineBreakG;
var version = "2.7.0";

exports.version = version;
// The main exported interface (under `self.acorn` when in the
// browser) is a `parse` function that takes a code string and
// returns an abstract syntax tree as specified by [Mozilla parser
// API][api].
//
// [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

function parse(input, options) {
  return new _state.Parser(options, input).parse();
}

// This function tries to parse a single expression at a given
// offset in a string. Useful for parsing mixed-language formats
// that embed JavaScript expressions.

function parseExpressionAt(input, pos, options) {
  var p = new _state.Parser(options, input, pos);
  p.nextToken();
  return p.parseExpression();
}

// Acorn is organized as a tokenizer and a recursive-descent parser.
// The `tokenizer` export provides an interface to the tokenizer.

function tokenizer(input, options) {
  return new _state.Parser(options, input);
}

},{"./expression":1,"./identifier":2,"./location":4,"./locutil":5,"./lval":6,"./node":7,"./options":8,"./parseutil":9,"./state":10,"./statement":11,"./tokencontext":12,"./tokenize":13,"./tokentype":14,"./whitespace":16}],4:[function(_dereq_,module,exports){
"use strict";

var _state = _dereq_("./state");

var _locutil = _dereq_("./locutil");

var pp = _state.Parser.prototype;

// This function is used to raise exceptions on parse errors. It
// takes an offset integer (into the current `input`) to indicate
// the location of the error, attaches the position to the end
// of the error message, and then raises a `SyntaxError` with that
// message.

pp.raise = function (pos, message) {
  var loc = _locutil.getLineInfo(this.input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  var err = new SyntaxError(message);
  err.pos = pos;err.loc = loc;err.raisedAt = this.pos;
  throw err;
};

pp.curPosition = function () {
  if (this.options.locations) {
    return new _locutil.Position(this.curLine, this.pos - this.lineStart);
  }
};

},{"./locutil":5,"./state":10}],5:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
exports.getLineInfo = getLineInfo;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _whitespace = _dereq_("./whitespace");

// These are used when `options.locations` is on, for the
// `startLoc` and `endLoc` properties.

var Position = (function () {
  function Position(line, col) {
    _classCallCheck(this, Position);

    this.line = line;
    this.column = col;
  }

  Position.prototype.offset = function offset(n) {
    return new Position(this.line, this.column + n);
  };

  return Position;
})();

exports.Position = Position;

var SourceLocation = function SourceLocation(p, start, end) {
  _classCallCheck(this, SourceLocation);

  this.start = start;
  this.end = end;
  if (p.sourceFile !== null) this.source = p.sourceFile;
}

// The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `input` should be the code string that the offset refers
// into.

;

exports.SourceLocation = SourceLocation;

function getLineInfo(input, offset) {
  for (var line = 1, cur = 0;;) {
    _whitespace.lineBreakG.lastIndex = cur;
    var match = _whitespace.lineBreakG.exec(input);
    if (match && match.index < offset) {
      ++line;
      cur = match.index + match[0].length;
    } else {
      return new Position(line, offset - cur);
    }
  }
}

},{"./whitespace":16}],6:[function(_dereq_,module,exports){
"use strict";

var _tokentype = _dereq_("./tokentype");

var _state = _dereq_("./state");

var _util = _dereq_("./util");

var pp = _state.Parser.prototype;

// Convert existing expression atom to assignable pattern
// if possible.

pp.toAssignable = function (node, isBinding) {
  if (this.options.ecmaVersion >= 6 && node) {
    switch (node.type) {
      case "Identifier":
      case "ObjectPattern":
      case "ArrayPattern":
        break;

      case "ObjectExpression":
        node.type = "ObjectPattern";
        for (var i = 0; i < node.properties.length; i++) {
          var prop = node.properties[i];
          if (prop.kind !== "init") this.raise(prop.key.start, "Object pattern can't contain getter or setter");
          this.toAssignable(prop.value, isBinding);
        }
        break;

      case "ArrayExpression":
        node.type = "ArrayPattern";
        this.toAssignableList(node.elements, isBinding);
        break;

      case "AssignmentExpression":
        if (node.operator === "=") {
          node.type = "AssignmentPattern";
          delete node.operator;
          // falls through to AssignmentPattern
        } else {
            this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
            break;
          }

      case "AssignmentPattern":
        if (node.right.type === "YieldExpression") this.raise(node.right.start, "Yield expression cannot be a default value");
        break;

      case "ParenthesizedExpression":
        node.expression = this.toAssignable(node.expression, isBinding);
        break;

      case "MemberExpression":
        if (!isBinding) break;

      default:
        this.raise(node.start, "Assigning to rvalue");
    }
  }
  return node;
};

// Convert list of expression atoms to binding list.

pp.toAssignableList = function (exprList, isBinding) {
  var end = exprList.length;
  if (end) {
    var last = exprList[end - 1];
    if (last && last.type == "RestElement") {
      --end;
    } else if (last && last.type == "SpreadElement") {
      last.type = "RestElement";
      var arg = last.argument;
      this.toAssignable(arg, isBinding);
      if (arg.type !== "Identifier" && arg.type !== "MemberExpression" && arg.type !== "ArrayPattern") this.unexpected(arg.start);
      --end;
    }

    if (isBinding && last.type === "RestElement" && last.argument.type !== "Identifier") this.unexpected(last.argument.start);
  }
  for (var i = 0; i < end; i++) {
    var elt = exprList[i];
    if (elt) this.toAssignable(elt, isBinding);
  }
  return exprList;
};

// Parses spread element.

pp.parseSpread = function (refDestructuringErrors) {
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeAssign(refDestructuringErrors);
  return this.finishNode(node, "SpreadElement");
};

pp.parseRest = function (allowNonIdent) {
  var node = this.startNode();
  this.next();

  // RestElement inside of a function parameter must be an identifier
  if (allowNonIdent) node.argument = this.type === _tokentype.types.name ? this.parseIdent() : this.unexpected();else node.argument = this.type === _tokentype.types.name || this.type === _tokentype.types.bracketL ? this.parseBindingAtom() : this.unexpected();

  return this.finishNode(node, "RestElement");
};

// Parses lvalue (assignable) atom.

pp.parseBindingAtom = function () {
  if (this.options.ecmaVersion < 6) return this.parseIdent();
  switch (this.type) {
    case _tokentype.types.name:
      return this.parseIdent();

    case _tokentype.types.bracketL:
      var node = this.startNode();
      this.next();
      node.elements = this.parseBindingList(_tokentype.types.bracketR, true, true);
      return this.finishNode(node, "ArrayPattern");

    case _tokentype.types.braceL:
      return this.parseObj(true);

    default:
      this.unexpected();
  }
};

pp.parseBindingList = function (close, allowEmpty, allowTrailingComma, allowNonIdent) {
  var elts = [],
      first = true;
  while (!this.eat(close)) {
    if (first) first = false;else this.expect(_tokentype.types.comma);
    if (allowEmpty && this.type === _tokentype.types.comma) {
      elts.push(null);
    } else if (allowTrailingComma && this.afterTrailingComma(close)) {
      break;
    } else if (this.type === _tokentype.types.ellipsis) {
      var rest = this.parseRest(allowNonIdent);
      this.parseBindingListItem(rest);
      elts.push(rest);
      this.expect(close);
      break;
    } else {
      var elem = this.parseMaybeDefault(this.start, this.startLoc);
      this.parseBindingListItem(elem);
      elts.push(elem);
    }
  }
  return elts;
};

pp.parseBindingListItem = function (param) {
  return param;
};

// Parses assignment pattern around given atom if possible.

pp.parseMaybeDefault = function (startPos, startLoc, left) {
  left = left || this.parseBindingAtom();
  if (this.options.ecmaVersion < 6 || !this.eat(_tokentype.types.eq)) return left;
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.right = this.parseMaybeAssign();
  return this.finishNode(node, "AssignmentPattern");
};

// Verify that a node is an lval — something that can be assigned
// to.

pp.checkLVal = function (expr, isBinding, checkClashes) {
  switch (expr.type) {
    case "Identifier":
      if (this.strict && this.reservedWordsStrictBind.test(expr.name)) this.raise(expr.start, (isBinding ? "Binding " : "Assigning to ") + expr.name + " in strict mode");
      if (checkClashes) {
        if (_util.has(checkClashes, expr.name)) this.raise(expr.start, "Argument name clash");
        checkClashes[expr.name] = true;
      }
      break;

    case "MemberExpression":
      if (isBinding) this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " member expression");
      break;

    case "ObjectPattern":
      for (var i = 0; i < expr.properties.length; i++) {
        this.checkLVal(expr.properties[i].value, isBinding, checkClashes);
      }break;

    case "ArrayPattern":
      for (var i = 0; i < expr.elements.length; i++) {
        var elem = expr.elements[i];
        if (elem) this.checkLVal(elem, isBinding, checkClashes);
      }
      break;

    case "AssignmentPattern":
      this.checkLVal(expr.left, isBinding, checkClashes);
      break;

    case "RestElement":
      this.checkLVal(expr.argument, isBinding, checkClashes);
      break;

    case "ParenthesizedExpression":
      this.checkLVal(expr.expression, isBinding, checkClashes);
      break;

    default:
      this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " rvalue");
  }
};

},{"./state":10,"./tokentype":14,"./util":15}],7:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _state = _dereq_("./state");

var _locutil = _dereq_("./locutil");

var Node = function Node(parser, pos, loc) {
  _classCallCheck(this, Node);

  this.type = "";
  this.start = pos;
  this.end = 0;
  if (parser.options.locations) this.loc = new _locutil.SourceLocation(parser, loc);
  if (parser.options.directSourceFile) this.sourceFile = parser.options.directSourceFile;
  if (parser.options.ranges) this.range = [pos, 0];
}

// Start an AST node, attaching a start offset.

;

exports.Node = Node;
var pp = _state.Parser.prototype;

pp.startNode = function () {
  return new Node(this, this.start, this.startLoc);
};

pp.startNodeAt = function (pos, loc) {
  return new Node(this, pos, loc);
};

// Finish an AST node, adding `type` and `end` properties.

function finishNodeAt(node, type, pos, loc) {
  node.type = type;
  node.end = pos;
  if (this.options.locations) node.loc.end = loc;
  if (this.options.ranges) node.range[1] = pos;
  return node;
}

pp.finishNode = function (node, type) {
  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc);
};

// Finish node at given position

pp.finishNodeAt = function (node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc);
};

},{"./locutil":5,"./state":10}],8:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
exports.getOptions = getOptions;

var _util = _dereq_("./util");

var _locutil = _dereq_("./locutil");

// A second optional argument can be given to further configure
// the parser process. These options are recognized:

var defaultOptions = {
  // `ecmaVersion` indicates the ECMAScript version to parse. Must
  // be either 3, or 5, or 6. This influences support for strict
  // mode, the set of reserved words, support for getters and
  // setters and other features.
  ecmaVersion: 5,
  // Source type ("script" or "module") for different semantics
  sourceType: "script",
  // `onInsertedSemicolon` can be a callback that will be called
  // when a semicolon is automatically inserted. It will be passed
  // th position of the comma as an offset, and if `locations` is
  // enabled, it is given the location as a `{line, column}` object
  // as second argument.
  onInsertedSemicolon: null,
  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
  // trailing commas.
  onTrailingComma: null,
  // By default, reserved words are only enforced if ecmaVersion >= 5.
  // Set `allowReserved` to a boolean value to explicitly turn this on
  // an off. When this option has the value "never", reserved words
  // and keywords can also not be used as property names.
  allowReserved: null,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program.
  allowImportExportEverywhere: false,
  // When enabled, hashbang directive in the beginning of file
  // is allowed and treated as a line comment.
  allowHashBang: false,
  // When `locations` is on, `loc` properties holding objects with
  // `start` and `end` properties in `{line, column}` form (with
  // line being 1-based and column 0-based) will be attached to the
  // nodes.
  locations: false,
  // A function can be passed as `onToken` option, which will
  // cause Acorn to call that function with object in the same
  // format as tokens returned from `tokenizer().getToken()`. Note
  // that you are not allowed to call the parser from the
  // callback—that will corrupt its internal state.
  onToken: null,
  // A function can be passed as `onComment` option, which will
  // cause Acorn to call that function with `(block, text, start,
  // end)` parameters whenever a comment is skipped. `block` is a
  // boolean indicating whether this is a block (`/* */`) comment,
  // `text` is the content of the comment, and `start` and `end` are
  // character offsets that denote the start and end of the comment.
  // When the `locations` option is on, two more parameters are
  // passed, the full `{line, column}` locations of the start and
  // end of the comments. Note that you are not allowed to call the
  // parser from the callback—that will corrupt its internal state.
  onComment: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // It is possible to parse multiple files into a single AST by
  // passing the tree produced by parsing the first file as
  // `program` option in subsequent parses. This will add the
  // toplevel forms of the parsed file to the `Program` (top) node
  // of an existing parse tree.
  program: null,
  // When `locations` is on, you can pass this to record the source
  // file in every node's `loc` object.
  sourceFile: null,
  // This value, if given, is stored in every node, whether
  // `locations` is on or off.
  directSourceFile: null,
  // When enabled, parenthesized expressions are represented by
  // (non-standard) ParenthesizedExpression nodes
  preserveParens: false,
  plugins: {}
};

exports.defaultOptions = defaultOptions;
// Interpret and default an options object

function getOptions(opts) {
  var options = {};
  for (var opt in defaultOptions) {
    options[opt] = opts && _util.has(opts, opt) ? opts[opt] : defaultOptions[opt];
  }if (options.allowReserved == null) options.allowReserved = options.ecmaVersion < 5;

  if (_util.isArray(options.onToken)) {
    (function () {
      var tokens = options.onToken;
      options.onToken = function (token) {
        return tokens.push(token);
      };
    })();
  }
  if (_util.isArray(options.onComment)) options.onComment = pushComment(options, options.onComment);

  return options;
}

function pushComment(options, array) {
  return function (block, text, start, end, startLoc, endLoc) {
    var comment = {
      type: block ? 'Block' : 'Line',
      value: text,
      start: start,
      end: end
    };
    if (options.locations) comment.loc = new _locutil.SourceLocation(this, startLoc, endLoc);
    if (options.ranges) comment.range = [start, end];
    array.push(comment);
  };
}

},{"./locutil":5,"./util":15}],9:[function(_dereq_,module,exports){
"use strict";

var _tokentype = _dereq_("./tokentype");

var _state = _dereq_("./state");

var _whitespace = _dereq_("./whitespace");

var pp = _state.Parser.prototype;

// ## Parser utilities

// Test whether a statement node is the string literal `"use strict"`.

pp.isUseStrict = function (stmt) {
  return this.options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" && stmt.expression.type === "Literal" && stmt.expression.raw.slice(1, -1) === "use strict";
};

// Predicate that tests whether the next token is of the given
// type, and if yes, consumes it as a side effect.

pp.eat = function (type) {
  if (this.type === type) {
    this.next();
    return true;
  } else {
    return false;
  }
};

// Tests whether parsed token is a contextual keyword.

pp.isContextual = function (name) {
  return this.type === _tokentype.types.name && this.value === name;
};

// Consumes contextual keyword if possible.

pp.eatContextual = function (name) {
  return this.value === name && this.eat(_tokentype.types.name);
};

// Asserts that following token is given contextual keyword.

pp.expectContextual = function (name) {
  if (!this.eatContextual(name)) this.unexpected();
};

// Test whether a semicolon can be inserted at the current position.

pp.canInsertSemicolon = function () {
  return this.type === _tokentype.types.eof || this.type === _tokentype.types.braceR || _whitespace.lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
};

pp.insertSemicolon = function () {
  if (this.canInsertSemicolon()) {
    if (this.options.onInsertedSemicolon) this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc);
    return true;
  }
};

// Consume a semicolon, or, failing that, see if we are allowed to
// pretend that there is a semicolon at this position.

pp.semicolon = function () {
  if (!this.eat(_tokentype.types.semi) && !this.insertSemicolon()) this.unexpected();
};

pp.afterTrailingComma = function (tokType) {
  if (this.type == tokType) {
    if (this.options.onTrailingComma) this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc);
    this.next();
    return true;
  }
};

// Expect a token of a given type. If found, consume it, otherwise,
// raise an unexpected token error.

pp.expect = function (type) {
  this.eat(type) || this.unexpected();
};

// Raise an unexpected token error.

pp.unexpected = function (pos) {
  this.raise(pos != null ? pos : this.start, "Unexpected token");
};

pp.checkPatternErrors = function (refDestructuringErrors, andThrow) {
  var pos = refDestructuringErrors && refDestructuringErrors.trailingComma;
  if (!andThrow) return !!pos;
  if (pos) this.raise(pos, "Trailing comma is not permitted in destructuring patterns");
};

pp.checkExpressionErrors = function (refDestructuringErrors, andThrow) {
  var pos = refDestructuringErrors && refDestructuringErrors.shorthandAssign;
  if (!andThrow) return !!pos;
  if (pos) this.raise(pos, "Shorthand property assignments are valid only in destructuring patterns");
};

},{"./state":10,"./tokentype":14,"./whitespace":16}],10:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _identifier = _dereq_("./identifier");

var _tokentype = _dereq_("./tokentype");

var _whitespace = _dereq_("./whitespace");

var _options = _dereq_("./options");

// Registered plugins
var plugins = {};

exports.plugins = plugins;
function keywordRegexp(words) {
  return new RegExp("^(" + words.replace(/ /g, "|") + ")$");
}

var Parser = (function () {
  function Parser(options, input, startPos) {
    _classCallCheck(this, Parser);

    this.options = options = _options.getOptions(options);
    this.sourceFile = options.sourceFile;
    this.keywords = keywordRegexp(_identifier.keywords[options.ecmaVersion >= 6 ? 6 : 5]);
    var reserved = options.allowReserved ? "" : _identifier.reservedWords[options.ecmaVersion] + (options.sourceType == "module" ? " await" : "");
    this.reservedWords = keywordRegexp(reserved);
    var reservedStrict = (reserved ? reserved + " " : "") + _identifier.reservedWords.strict;
    this.reservedWordsStrict = keywordRegexp(reservedStrict);
    this.reservedWordsStrictBind = keywordRegexp(reservedStrict + " " + _identifier.reservedWords.strictBind);
    this.input = String(input);

    // Used to signal to callers of `readWord1` whether the word
    // contained any escape sequences. This is needed because words with
    // escape sequences must not be interpreted as keywords.
    this.containsEsc = false;

    // Load plugins
    this.loadPlugins(options.plugins);

    // Set up token state

    // The current position of the tokenizer in the input.
    if (startPos) {
      this.pos = startPos;
      this.lineStart = Math.max(0, this.input.lastIndexOf("\n", startPos));
      this.curLine = this.input.slice(0, this.lineStart).split(_whitespace.lineBreak).length;
    } else {
      this.pos = this.lineStart = 0;
      this.curLine = 1;
    }

    // Properties of the current token:
    // Its type
    this.type = _tokentype.types.eof;
    // For tokens that include more information than their type, the value
    this.value = null;
    // Its start and end offset
    this.start = this.end = this.pos;
    // And, if locations are used, the {line, column} object
    // corresponding to those offsets
    this.startLoc = this.endLoc = this.curPosition();

    // Position information for the previous token
    this.lastTokEndLoc = this.lastTokStartLoc = null;
    this.lastTokStart = this.lastTokEnd = this.pos;

    // The context stack is used to superficially track syntactic
    // context to predict whether a regular expression is allowed in a
    // given position.
    this.context = this.initialContext();
    this.exprAllowed = true;

    // Figure out if it's a module code.
    this.strict = this.inModule = options.sourceType === "module";

    // Used to signify the start of a potential arrow function
    this.potentialArrowAt = -1;

    // Flags to track whether we are in a function, a generator.
    this.inFunction = this.inGenerator = false;
    // Labels in scope.
    this.labels = [];

    // If enabled, skip leading hashbang line.
    if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === '#!') this.skipLineComment(2);
  }

  // DEPRECATED Kept for backwards compatibility until 3.0 in case a plugin uses them

  Parser.prototype.isKeyword = function isKeyword(word) {
    return this.keywords.test(word);
  };

  Parser.prototype.isReservedWord = function isReservedWord(word) {
    return this.reservedWords.test(word);
  };

  Parser.prototype.extend = function extend(name, f) {
    this[name] = f(this[name]);
  };

  Parser.prototype.loadPlugins = function loadPlugins(pluginConfigs) {
    for (var _name in pluginConfigs) {
      var plugin = plugins[_name];
      if (!plugin) throw new Error("Plugin '" + _name + "' not found");
      plugin(this, pluginConfigs[_name]);
    }
  };

  Parser.prototype.parse = function parse() {
    var node = this.options.program || this.startNode();
    this.nextToken();
    return this.parseTopLevel(node);
  };

  return Parser;
})();

exports.Parser = Parser;

},{"./identifier":2,"./options":8,"./tokentype":14,"./whitespace":16}],11:[function(_dereq_,module,exports){
"use strict";

var _tokentype = _dereq_("./tokentype");

var _state = _dereq_("./state");

var _whitespace = _dereq_("./whitespace");

var pp = _state.Parser.prototype;

// ### Statement parsing

// Parse a program. Initializes the parser, reads any number of
// statements, and wraps them in a Program node.  Optionally takes a
// `program` argument.  If present, the statements will be appended
// to its body instead of creating a new node.

pp.parseTopLevel = function (node) {
  var first = true;
  if (!node.body) node.body = [];
  while (this.type !== _tokentype.types.eof) {
    var stmt = this.parseStatement(true, true);
    node.body.push(stmt);
    if (first) {
      if (this.isUseStrict(stmt)) this.setStrict(true);
      first = false;
    }
  }
  this.next();
  if (this.options.ecmaVersion >= 6) {
    node.sourceType = this.options.sourceType;
  }
  return this.finishNode(node, "Program");
};

var loopLabel = { kind: "loop" },
    switchLabel = { kind: "switch" };

// Parse a single statement.
//
// If expecting a statement and finding a slash operator, parse a
// regular expression literal. This is to handle cases like
// `if (foo) /blah/.exec(foo)`, where looking at the previous token
// does not help.

pp.parseStatement = function (declaration, topLevel) {
  var starttype = this.type,
      node = this.startNode();

  // Most types of statements are recognized by the keyword they
  // start with. Many are trivial to parse, some require a bit of
  // complexity.

  switch (starttype) {
    case _tokentype.types._break:case _tokentype.types._continue:
      return this.parseBreakContinueStatement(node, starttype.keyword);
    case _tokentype.types._debugger:
      return this.parseDebuggerStatement(node);
    case _tokentype.types._do:
      return this.parseDoStatement(node);
    case _tokentype.types._for:
      return this.parseForStatement(node);
    case _tokentype.types._function:
      if (!declaration && this.options.ecmaVersion >= 6) this.unexpected();
      return this.parseFunctionStatement(node);
    case _tokentype.types._class:
      if (!declaration) this.unexpected();
      return this.parseClass(node, true);
    case _tokentype.types._if:
      return this.parseIfStatement(node);
    case _tokentype.types._return:
      return this.parseReturnStatement(node);
    case _tokentype.types._switch:
      return this.parseSwitchStatement(node);
    case _tokentype.types._throw:
      return this.parseThrowStatement(node);
    case _tokentype.types._try:
      return this.parseTryStatement(node);
    case _tokentype.types._let:case _tokentype.types._const:
      if (!declaration) this.unexpected(); // NOTE: falls through to _var
    case _tokentype.types._var:
      return this.parseVarStatement(node, starttype);
    case _tokentype.types._while:
      return this.parseWhileStatement(node);
    case _tokentype.types._with:
      return this.parseWithStatement(node);
    case _tokentype.types.braceL:
      return this.parseBlock();
    case _tokentype.types.semi:
      return this.parseEmptyStatement(node);
    case _tokentype.types._export:
    case _tokentype.types._import:
      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel) this.raise(this.start, "'import' and 'export' may only appear at the top level");
        if (!this.inModule) this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'");
      }
      return starttype === _tokentype.types._import ? this.parseImport(node) : this.parseExport(node);

    // If the statement does not start with a statement keyword or a
    // brace, it's an ExpressionStatement or LabeledStatement. We
    // simply start parsing an expression, and afterwards, if the
    // next token is a colon and the expression was a simple
    // Identifier node, we switch to interpreting it as a label.
    default:
      var maybeName = this.value,
          expr = this.parseExpression();
      if (starttype === _tokentype.types.name && expr.type === "Identifier" && this.eat(_tokentype.types.colon)) return this.parseLabeledStatement(node, maybeName, expr);else return this.parseExpressionStatement(node, expr);
  }
};

pp.parseBreakContinueStatement = function (node, keyword) {
  var isBreak = keyword == "break";
  this.next();
  if (this.eat(_tokentype.types.semi) || this.insertSemicolon()) node.label = null;else if (this.type !== _tokentype.types.name) this.unexpected();else {
    node.label = this.parseIdent();
    this.semicolon();
  }

  // Verify that there is an actual destination to break or
  // continue to.
  for (var i = 0; i < this.labels.length; ++i) {
    var lab = this.labels[i];
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
      if (node.label && isBreak) break;
    }
  }
  if (i === this.labels.length) this.raise(node.start, "Unsyntactic " + keyword);
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
};

pp.parseDebuggerStatement = function (node) {
  this.next();
  this.semicolon();
  return this.finishNode(node, "DebuggerStatement");
};

pp.parseDoStatement = function (node) {
  this.next();
  this.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.labels.pop();
  this.expect(_tokentype.types._while);
  node.test = this.parseParenExpression();
  if (this.options.ecmaVersion >= 6) this.eat(_tokentype.types.semi);else this.semicolon();
  return this.finishNode(node, "DoWhileStatement");
};

// Disambiguating between a `for` and a `for`/`in` or `for`/`of`
// loop is non-trivial. Basically, we have to parse the init `var`
// statement or expression, disallowing the `in` operator (see
// the second parameter to `parseExpression`), and then check
// whether the next token is `in` or `of`. When there is no init
// part (semicolon immediately after the opening parenthesis), it
// is a regular `for` loop.

pp.parseForStatement = function (node) {
  this.next();
  this.labels.push(loopLabel);
  this.expect(_tokentype.types.parenL);
  if (this.type === _tokentype.types.semi) return this.parseFor(node, null);
  if (this.type === _tokentype.types._var || this.type === _tokentype.types._let || this.type === _tokentype.types._const) {
    var _init = this.startNode(),
        varKind = this.type;
    this.next();
    this.parseVar(_init, true, varKind);
    this.finishNode(_init, "VariableDeclaration");
    if ((this.type === _tokentype.types._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) && _init.declarations.length === 1 && !(varKind !== _tokentype.types._var && _init.declarations[0].init)) return this.parseForIn(node, _init);
    return this.parseFor(node, _init);
  }
  var refDestructuringErrors = { shorthandAssign: 0, trailingComma: 0 };
  var init = this.parseExpression(true, refDestructuringErrors);
  if (this.type === _tokentype.types._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) {
    this.checkPatternErrors(refDestructuringErrors, true);
    this.toAssignable(init);
    this.checkLVal(init);
    return this.parseForIn(node, init);
  } else {
    this.checkExpressionErrors(refDestructuringErrors, true);
  }
  return this.parseFor(node, init);
};

pp.parseFunctionStatement = function (node) {
  this.next();
  return this.parseFunction(node, true);
};

pp.parseIfStatement = function (node) {
  this.next();
  node.test = this.parseParenExpression();
  node.consequent = this.parseStatement(false);
  node.alternate = this.eat(_tokentype.types._else) ? this.parseStatement(false) : null;
  return this.finishNode(node, "IfStatement");
};

pp.parseReturnStatement = function (node) {
  if (!this.inFunction && !this.options.allowReturnOutsideFunction) this.raise(this.start, "'return' outside of function");
  this.next();

  // In `return` (and `break`/`continue`), the keywords with
  // optional arguments, we eagerly look for a semicolon or the
  // possibility to insert one.

  if (this.eat(_tokentype.types.semi) || this.insertSemicolon()) node.argument = null;else {
    node.argument = this.parseExpression();this.semicolon();
  }
  return this.finishNode(node, "ReturnStatement");
};

pp.parseSwitchStatement = function (node) {
  this.next();
  node.discriminant = this.parseParenExpression();
  node.cases = [];
  this.expect(_tokentype.types.braceL);
  this.labels.push(switchLabel);

  // Statements under must be grouped (by label) in SwitchCase
  // nodes. `cur` is used to keep the node that we are currently
  // adding statements to.

  for (var cur, sawDefault = false; this.type != _tokentype.types.braceR;) {
    if (this.type === _tokentype.types._case || this.type === _tokentype.types._default) {
      var isCase = this.type === _tokentype.types._case;
      if (cur) this.finishNode(cur, "SwitchCase");
      node.cases.push(cur = this.startNode());
      cur.consequent = [];
      this.next();
      if (isCase) {
        cur.test = this.parseExpression();
      } else {
        if (sawDefault) this.raise(this.lastTokStart, "Multiple default clauses");
        sawDefault = true;
        cur.test = null;
      }
      this.expect(_tokentype.types.colon);
    } else {
      if (!cur) this.unexpected();
      cur.consequent.push(this.parseStatement(true));
    }
  }
  if (cur) this.finishNode(cur, "SwitchCase");
  this.next(); // Closing brace
  this.labels.pop();
  return this.finishNode(node, "SwitchStatement");
};

pp.parseThrowStatement = function (node) {
  this.next();
  if (_whitespace.lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) this.raise(this.lastTokEnd, "Illegal newline after throw");
  node.argument = this.parseExpression();
  this.semicolon();
  return this.finishNode(node, "ThrowStatement");
};

// Reused empty array added for node fields that are always empty.

var empty = [];

pp.parseTryStatement = function (node) {
  this.next();
  node.block = this.parseBlock();
  node.handler = null;
  if (this.type === _tokentype.types._catch) {
    var clause = this.startNode();
    this.next();
    this.expect(_tokentype.types.parenL);
    clause.param = this.parseBindingAtom();
    this.checkLVal(clause.param, true);
    this.expect(_tokentype.types.parenR);
    clause.body = this.parseBlock();
    node.handler = this.finishNode(clause, "CatchClause");
  }
  node.finalizer = this.eat(_tokentype.types._finally) ? this.parseBlock() : null;
  if (!node.handler && !node.finalizer) this.raise(node.start, "Missing catch or finally clause");
  return this.finishNode(node, "TryStatement");
};

pp.parseVarStatement = function (node, kind) {
  this.next();
  this.parseVar(node, false, kind);
  this.semicolon();
  return this.finishNode(node, "VariableDeclaration");
};

pp.parseWhileStatement = function (node) {
  this.next();
  node.test = this.parseParenExpression();
  this.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, "WhileStatement");
};

pp.parseWithStatement = function (node) {
  if (this.strict) this.raise(this.start, "'with' in strict mode");
  this.next();
  node.object = this.parseParenExpression();
  node.body = this.parseStatement(false);
  return this.finishNode(node, "WithStatement");
};

pp.parseEmptyStatement = function (node) {
  this.next();
  return this.finishNode(node, "EmptyStatement");
};

pp.parseLabeledStatement = function (node, maybeName, expr) {
  for (var i = 0; i < this.labels.length; ++i) {
    if (this.labels[i].name === maybeName) this.raise(expr.start, "Label '" + maybeName + "' is already declared");
  }var kind = this.type.isLoop ? "loop" : this.type === _tokentype.types._switch ? "switch" : null;
  for (var i = this.labels.length - 1; i >= 0; i--) {
    var label = this.labels[i];
    if (label.statementStart == node.start) {
      label.statementStart = this.start;
      label.kind = kind;
    } else break;
  }
  this.labels.push({ name: maybeName, kind: kind, statementStart: this.start });
  node.body = this.parseStatement(true);
  this.labels.pop();
  node.label = expr;
  return this.finishNode(node, "LabeledStatement");
};

pp.parseExpressionStatement = function (node, expr) {
  node.expression = expr;
  this.semicolon();
  return this.finishNode(node, "ExpressionStatement");
};

// Parse a semicolon-enclosed block of statements, handling `"use
// strict"` declarations when `allowStrict` is true (used for
// function bodies).

pp.parseBlock = function (allowStrict) {
  var node = this.startNode(),
      first = true,
      oldStrict = undefined;
  node.body = [];
  this.expect(_tokentype.types.braceL);
  while (!this.eat(_tokentype.types.braceR)) {
    var stmt = this.parseStatement(true);
    node.body.push(stmt);
    if (first && allowStrict && this.isUseStrict(stmt)) {
      oldStrict = this.strict;
      this.setStrict(this.strict = true);
    }
    first = false;
  }
  if (oldStrict === false) this.setStrict(false);
  return this.finishNode(node, "BlockStatement");
};

// Parse a regular `for` loop. The disambiguation code in
// `parseStatement` will already have parsed the init statement or
// expression.

pp.parseFor = function (node, init) {
  node.init = init;
  this.expect(_tokentype.types.semi);
  node.test = this.type === _tokentype.types.semi ? null : this.parseExpression();
  this.expect(_tokentype.types.semi);
  node.update = this.type === _tokentype.types.parenR ? null : this.parseExpression();
  this.expect(_tokentype.types.parenR);
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, "ForStatement");
};

// Parse a `for`/`in` and `for`/`of` loop, which are almost
// same from parser's perspective.

pp.parseForIn = function (node, init) {
  var type = this.type === _tokentype.types._in ? "ForInStatement" : "ForOfStatement";
  this.next();
  node.left = init;
  node.right = this.parseExpression();
  this.expect(_tokentype.types.parenR);
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, type);
};

// Parse a list of variable declarations.

pp.parseVar = function (node, isFor, kind) {
  node.declarations = [];
  node.kind = kind.keyword;
  for (;;) {
    var decl = this.startNode();
    this.parseVarId(decl);
    if (this.eat(_tokentype.types.eq)) {
      decl.init = this.parseMaybeAssign(isFor);
    } else if (kind === _tokentype.types._const && !(this.type === _tokentype.types._in || this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
      this.unexpected();
    } else if (decl.id.type != "Identifier" && !(isFor && (this.type === _tokentype.types._in || this.isContextual("of")))) {
      this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
    } else {
      decl.init = null;
    }
    node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
    if (!this.eat(_tokentype.types.comma)) break;
  }
  return node;
};

pp.parseVarId = function (decl) {
  decl.id = this.parseBindingAtom();
  this.checkLVal(decl.id, true);
};

// Parse a function declaration or literal (depending on the
// `isStatement` parameter).

pp.parseFunction = function (node, isStatement, allowExpressionBody) {
  this.initFunction(node);
  if (this.options.ecmaVersion >= 6) node.generator = this.eat(_tokentype.types.star);
  if (isStatement || this.type === _tokentype.types.name) node.id = this.parseIdent();
  this.parseFunctionParams(node);
  this.parseFunctionBody(node, allowExpressionBody);
  return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
};

pp.parseFunctionParams = function (node) {
  this.expect(_tokentype.types.parenL);
  node.params = this.parseBindingList(_tokentype.types.parenR, false, false, true);
};

// Parse a class declaration or literal (depending on the
// `isStatement` parameter).

pp.parseClass = function (node, isStatement) {
  this.next();
  this.parseClassId(node, isStatement);
  this.parseClassSuper(node);
  var classBody = this.startNode();
  var hadConstructor = false;
  classBody.body = [];
  this.expect(_tokentype.types.braceL);
  while (!this.eat(_tokentype.types.braceR)) {
    if (this.eat(_tokentype.types.semi)) continue;
    var method = this.startNode();
    var isGenerator = this.eat(_tokentype.types.star);
    var isMaybeStatic = this.type === _tokentype.types.name && this.value === "static";
    this.parsePropertyName(method);
    method["static"] = isMaybeStatic && this.type !== _tokentype.types.parenL;
    if (method["static"]) {
      if (isGenerator) this.unexpected();
      isGenerator = this.eat(_tokentype.types.star);
      this.parsePropertyName(method);
    }
    method.kind = "method";
    var isGetSet = false;
    if (!method.computed) {
      var key = method.key;

      if (!isGenerator && key.type === "Identifier" && this.type !== _tokentype.types.parenL && (key.name === "get" || key.name === "set")) {
        isGetSet = true;
        method.kind = key.name;
        key = this.parsePropertyName(method);
      }
      if (!method["static"] && (key.type === "Identifier" && key.name === "constructor" || key.type === "Literal" && key.value === "constructor")) {
        if (hadConstructor) this.raise(key.start, "Duplicate constructor in the same class");
        if (isGetSet) this.raise(key.start, "Constructor can't have get/set modifier");
        if (isGenerator) this.raise(key.start, "Constructor can't be a generator");
        method.kind = "constructor";
        hadConstructor = true;
      }
    }
    this.parseClassMethod(classBody, method, isGenerator);
    if (isGetSet) {
      var paramCount = method.kind === "get" ? 0 : 1;
      if (method.value.params.length !== paramCount) {
        var start = method.value.start;
        if (method.kind === "get") this.raise(start, "getter should have no params");else this.raise(start, "setter should have exactly one param");
      }
      if (method.kind === "set" && method.value.params[0].type === "RestElement") this.raise(method.value.params[0].start, "Setter cannot use rest params");
    }
  }
  node.body = this.finishNode(classBody, "ClassBody");
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
};

pp.parseClassMethod = function (classBody, method, isGenerator) {
  method.value = this.parseMethod(isGenerator);
  classBody.body.push(this.finishNode(method, "MethodDefinition"));
};

pp.parseClassId = function (node, isStatement) {
  node.id = this.type === _tokentype.types.name ? this.parseIdent() : isStatement ? this.unexpected() : null;
};

pp.parseClassSuper = function (node) {
  node.superClass = this.eat(_tokentype.types._extends) ? this.parseExprSubscripts() : null;
};

// Parses module export declaration.

pp.parseExport = function (node) {
  this.next();
  // export * from '...'
  if (this.eat(_tokentype.types.star)) {
    this.expectContextual("from");
    node.source = this.type === _tokentype.types.string ? this.parseExprAtom() : this.unexpected();
    this.semicolon();
    return this.finishNode(node, "ExportAllDeclaration");
  }
  if (this.eat(_tokentype.types._default)) {
    // export default ...
    var expr = this.parseMaybeAssign();
    var needsSemi = true;
    if (expr.type == "FunctionExpression" || expr.type == "ClassExpression") {
      needsSemi = false;
      if (expr.id) {
        expr.type = expr.type == "FunctionExpression" ? "FunctionDeclaration" : "ClassDeclaration";
      }
    }
    node.declaration = expr;
    if (needsSemi) this.semicolon();
    return this.finishNode(node, "ExportDefaultDeclaration");
  }
  // export var|const|let|function|class ...
  if (this.shouldParseExportStatement()) {
    node.declaration = this.parseStatement(true);
    node.specifiers = [];
    node.source = null;
  } else {
    // export { x, y as z } [from '...']
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers();
    if (this.eatContextual("from")) {
      node.source = this.type === _tokentype.types.string ? this.parseExprAtom() : this.unexpected();
    } else {
      // check for keywords used as local names
      for (var i = 0; i < node.specifiers.length; i++) {
        if (this.keywords.test(node.specifiers[i].local.name) || this.reservedWords.test(node.specifiers[i].local.name)) {
          this.unexpected(node.specifiers[i].local.start);
        }
      }

      node.source = null;
    }
    this.semicolon();
  }
  return this.finishNode(node, "ExportNamedDeclaration");
};

pp.shouldParseExportStatement = function () {
  return this.type.keyword;
};

// Parses a comma-separated list of module exports.

pp.parseExportSpecifiers = function () {
  var nodes = [],
      first = true;
  // export { x, y as z } [from '...']
  this.expect(_tokentype.types.braceL);
  while (!this.eat(_tokentype.types.braceR)) {
    if (!first) {
      this.expect(_tokentype.types.comma);
      if (this.afterTrailingComma(_tokentype.types.braceR)) break;
    } else first = false;

    var node = this.startNode();
    node.local = this.parseIdent(this.type === _tokentype.types._default);
    node.exported = this.eatContextual("as") ? this.parseIdent(true) : node.local;
    nodes.push(this.finishNode(node, "ExportSpecifier"));
  }
  return nodes;
};

// Parses import declaration.

pp.parseImport = function (node) {
  this.next();
  // import '...'
  if (this.type === _tokentype.types.string) {
    node.specifiers = empty;
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = this.parseImportSpecifiers();
    this.expectContextual("from");
    node.source = this.type === _tokentype.types.string ? this.parseExprAtom() : this.unexpected();
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration");
};

// Parses a comma-separated list of module imports.

pp.parseImportSpecifiers = function () {
  var nodes = [],
      first = true;
  if (this.type === _tokentype.types.name) {
    // import defaultObj, { x, y as z } from '...'
    var node = this.startNode();
    node.local = this.parseIdent();
    this.checkLVal(node.local, true);
    nodes.push(this.finishNode(node, "ImportDefaultSpecifier"));
    if (!this.eat(_tokentype.types.comma)) return nodes;
  }
  if (this.type === _tokentype.types.star) {
    var node = this.startNode();
    this.next();
    this.expectContextual("as");
    node.local = this.parseIdent();
    this.checkLVal(node.local, true);
    nodes.push(this.finishNode(node, "ImportNamespaceSpecifier"));
    return nodes;
  }
  this.expect(_tokentype.types.braceL);
  while (!this.eat(_tokentype.types.braceR)) {
    if (!first) {
      this.expect(_tokentype.types.comma);
      if (this.afterTrailingComma(_tokentype.types.braceR)) break;
    } else first = false;

    var node = this.startNode();
    node.imported = this.parseIdent(true);
    if (this.eatContextual("as")) {
      node.local = this.parseIdent();
    } else {
      node.local = node.imported;
      if (this.isKeyword(node.local.name)) this.unexpected(node.local.start);
      if (this.reservedWordsStrict.test(node.local.name)) this.raise(node.local.start, "The keyword '" + node.local.name + "' is reserved");
    }
    this.checkLVal(node.local, true);
    nodes.push(this.finishNode(node, "ImportSpecifier"));
  }
  return nodes;
};

},{"./state":10,"./tokentype":14,"./whitespace":16}],12:[function(_dereq_,module,exports){
// The algorithm used to determine whether a regexp can appear at a
// given point in the program is loosely based on sweet.js' approach.
// See https://github.com/mozilla/sweet.js/wiki/design

"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _state = _dereq_("./state");

var _tokentype = _dereq_("./tokentype");

var _whitespace = _dereq_("./whitespace");

var TokContext = function TokContext(token, isExpr, preserveSpace, override) {
  _classCallCheck(this, TokContext);

  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
};

exports.TokContext = TokContext;
var types = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", true),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function (p) {
    return p.readTmplToken();
  }),
  f_expr: new TokContext("function", true)
};

exports.types = types;
var pp = _state.Parser.prototype;

pp.initialContext = function () {
  return [types.b_stat];
};

pp.braceIsBlock = function (prevType) {
  if (prevType === _tokentype.types.colon) {
    var _parent = this.curContext();
    if (_parent === types.b_stat || _parent === types.b_expr) return !_parent.isExpr;
  }
  if (prevType === _tokentype.types._return) return _whitespace.lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
  if (prevType === _tokentype.types._else || prevType === _tokentype.types.semi || prevType === _tokentype.types.eof || prevType === _tokentype.types.parenR) return true;
  if (prevType == _tokentype.types.braceL) return this.curContext() === types.b_stat;
  return !this.exprAllowed;
};

pp.updateContext = function (prevType) {
  var update = undefined,
      type = this.type;
  if (type.keyword && prevType == _tokentype.types.dot) this.exprAllowed = false;else if (update = type.updateContext) update.call(this, prevType);else this.exprAllowed = type.beforeExpr;
};

// Token-specific context update code

_tokentype.types.parenR.updateContext = _tokentype.types.braceR.updateContext = function () {
  if (this.context.length == 1) {
    this.exprAllowed = true;
    return;
  }
  var out = this.context.pop();
  if (out === types.b_stat && this.curContext() === types.f_expr) {
    this.context.pop();
    this.exprAllowed = false;
  } else if (out === types.b_tmpl) {
    this.exprAllowed = true;
  } else {
    this.exprAllowed = !out.isExpr;
  }
};

_tokentype.types.braceL.updateContext = function (prevType) {
  this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
  this.exprAllowed = true;
};

_tokentype.types.dollarBraceL.updateContext = function () {
  this.context.push(types.b_tmpl);
  this.exprAllowed = true;
};

_tokentype.types.parenL.updateContext = function (prevType) {
  var statementParens = prevType === _tokentype.types._if || prevType === _tokentype.types._for || prevType === _tokentype.types._with || prevType === _tokentype.types._while;
  this.context.push(statementParens ? types.p_stat : types.p_expr);
  this.exprAllowed = true;
};

_tokentype.types.incDec.updateContext = function () {
  // tokExprAllowed stays unchanged
};

_tokentype.types._function.updateContext = function () {
  if (this.curContext() !== types.b_stat) this.context.push(types.f_expr);
  this.exprAllowed = false;
};

_tokentype.types.backQuote.updateContext = function () {
  if (this.curContext() === types.q_tmpl) this.context.pop();else this.context.push(types.q_tmpl);
  this.exprAllowed = false;
};

},{"./state":10,"./tokentype":14,"./whitespace":16}],13:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _identifier = _dereq_("./identifier");

var _tokentype = _dereq_("./tokentype");

var _state = _dereq_("./state");

var _locutil = _dereq_("./locutil");

var _whitespace = _dereq_("./whitespace");

// Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = function Token(p) {
  _classCallCheck(this, Token);

  this.type = p.type;
  this.value = p.value;
  this.start = p.start;
  this.end = p.end;
  if (p.options.locations) this.loc = new _locutil.SourceLocation(p, p.startLoc, p.endLoc);
  if (p.options.ranges) this.range = [p.start, p.end];
}

// ## Tokenizer

;

exports.Token = Token;
var pp = _state.Parser.prototype;

// Are we running under Rhino?
var isRhino = typeof Packages == "object" && Object.prototype.toString.call(Packages) == "[object JavaPackage]";

// Move to the next token

pp.next = function () {
  if (this.options.onToken) this.options.onToken(new Token(this));

  this.lastTokEnd = this.end;
  this.lastTokStart = this.start;
  this.lastTokEndLoc = this.endLoc;
  this.lastTokStartLoc = this.startLoc;
  this.nextToken();
};

pp.getToken = function () {
  this.next();
  return new Token(this);
};

// If we're in an ES6 environment, make parsers iterable
if (typeof Symbol !== "undefined") pp[Symbol.iterator] = function () {
  var self = this;
  return { next: function next() {
      var token = self.getToken();
      return {
        done: token.type === _tokentype.types.eof,
        value: token
      };
    } };
};

// Toggle strict mode. Re-reads the next number or string to please
// pedantic tests (`"use strict"; 010;` should fail).

pp.setStrict = function (strict) {
  this.strict = strict;
  if (this.type !== _tokentype.types.num && this.type !== _tokentype.types.string) return;
  this.pos = this.start;
  if (this.options.locations) {
    while (this.pos < this.lineStart) {
      this.lineStart = this.input.lastIndexOf("\n", this.lineStart - 2) + 1;
      --this.curLine;
    }
  }
  this.nextToken();
};

pp.curContext = function () {
  return this.context[this.context.length - 1];
};

// Read a single token, updating the parser object's token-related
// properties.

pp.nextToken = function () {
  var curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) this.skipSpace();

  this.start = this.pos;
  if (this.options.locations) this.startLoc = this.curPosition();
  if (this.pos >= this.input.length) return this.finishToken(_tokentype.types.eof);

  if (curContext.override) return curContext.override(this);else this.readToken(this.fullCharCodeAtPos());
};

pp.readToken = function (code) {
  // Identifier or keyword. '\uXXXX' sequences are allowed in
  // identifiers, so '\' also dispatches to that.
  if (_identifier.isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */) return this.readWord();

  return this.getTokenFromCode(code);
};

pp.fullCharCodeAtPos = function () {
  var code = this.input.charCodeAt(this.pos);
  if (code <= 0xd7ff || code >= 0xe000) return code;
  var next = this.input.charCodeAt(this.pos + 1);
  return (code << 10) + next - 0x35fdc00;
};

pp.skipBlockComment = function () {
  var startLoc = this.options.onComment && this.curPosition();
  var start = this.pos,
      end = this.input.indexOf("*/", this.pos += 2);
  if (end === -1) this.raise(this.pos - 2, "Unterminated comment");
  this.pos = end + 2;
  if (this.options.locations) {
    _whitespace.lineBreakG.lastIndex = start;
    var match = undefined;
    while ((match = _whitespace.lineBreakG.exec(this.input)) && match.index < this.pos) {
      ++this.curLine;
      this.lineStart = match.index + match[0].length;
    }
  }
  if (this.options.onComment) this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos, startLoc, this.curPosition());
};

pp.skipLineComment = function (startSkip) {
  var start = this.pos;
  var startLoc = this.options.onComment && this.curPosition();
  var ch = this.input.charCodeAt(this.pos += startSkip);
  while (this.pos < this.input.length && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
    ++this.pos;
    ch = this.input.charCodeAt(this.pos);
  }
  if (this.options.onComment) this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos, startLoc, this.curPosition());
};

// Called at the start of the parse and after every token. Skips
// whitespace and comments, and.

pp.skipSpace = function () {
  loop: while (this.pos < this.input.length) {
    var ch = this.input.charCodeAt(this.pos);
    switch (ch) {
      case 32:case 160:
        // ' '
        ++this.pos;
        break;
      case 13:
        if (this.input.charCodeAt(this.pos + 1) === 10) {
          ++this.pos;
        }
      case 10:case 8232:case 8233:
        ++this.pos;
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        break;
      case 47:
        // '/'
        switch (this.input.charCodeAt(this.pos + 1)) {
          case 42:
            // '*'
            this.skipBlockComment();
            break;
          case 47:
            this.skipLineComment(2);
            break;
          default:
            break loop;
        }
        break;
      default:
        if (ch > 8 && ch < 14 || ch >= 5760 && _whitespace.nonASCIIwhitespace.test(String.fromCharCode(ch))) {
          ++this.pos;
        } else {
          break loop;
        }
    }
  }
};

// Called at the end of every token. Sets `end`, `val`, and
// maintains `context` and `exprAllowed`, and skips the space after
// the token, so that the next one's `start` will point at the
// right position.

pp.finishToken = function (type, val) {
  this.end = this.pos;
  if (this.options.locations) this.endLoc = this.curPosition();
  var prevType = this.type;
  this.type = type;
  this.value = val;

  this.updateContext(prevType);
};

// ### Token reading

// This is the function that is called to fetch the next token. It
// is somewhat obscure, because it works in character codes rather
// than characters, and because operator parsing has been inlined
// into it.
//
// All in the name of speed.
//
pp.readToken_dot = function () {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) return this.readNumber(true);
  var next2 = this.input.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
    // 46 = dot '.'
    this.pos += 3;
    return this.finishToken(_tokentype.types.ellipsis);
  } else {
    ++this.pos;
    return this.finishToken(_tokentype.types.dot);
  }
};

pp.readToken_slash = function () {
  // '/'
  var next = this.input.charCodeAt(this.pos + 1);
  if (this.exprAllowed) {
    ++this.pos;return this.readRegexp();
  }
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(_tokentype.types.slash, 1);
};

pp.readToken_mult_modulo = function (code) {
  // '%*'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(code === 42 ? _tokentype.types.star : _tokentype.types.modulo, 1);
};

pp.readToken_pipe_amp = function (code) {
  // '|&'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) return this.finishOp(code === 124 ? _tokentype.types.logicalOR : _tokentype.types.logicalAND, 2);
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(code === 124 ? _tokentype.types.bitwiseOR : _tokentype.types.bitwiseAND, 1);
};

pp.readToken_caret = function () {
  // '^'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(_tokentype.types.bitwiseXOR, 1);
};

pp.readToken_plus_min = function (code) {
  // '+-'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (next == 45 && this.input.charCodeAt(this.pos + 2) == 62 && _whitespace.lineBreak.test(this.input.slice(this.lastTokEnd, this.pos))) {
      // A `-->` line comment
      this.skipLineComment(3);
      this.skipSpace();
      return this.nextToken();
    }
    return this.finishOp(_tokentype.types.incDec, 2);
  }
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(_tokentype.types.plusMin, 1);
};

pp.readToken_lt_gt = function (code) {
  // '<>'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
    if (this.input.charCodeAt(this.pos + size) === 61) return this.finishOp(_tokentype.types.assign, size + 1);
    return this.finishOp(_tokentype.types.bitShift, size);
  }
  if (next == 33 && code == 60 && this.input.charCodeAt(this.pos + 2) == 45 && this.input.charCodeAt(this.pos + 3) == 45) {
    if (this.inModule) this.unexpected();
    // `<!--`, an XML-style comment that should be interpreted as a line comment
    this.skipLineComment(4);
    this.skipSpace();
    return this.nextToken();
  }
  if (next === 61) size = this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2;
  return this.finishOp(_tokentype.types.relational, size);
};

pp.readToken_eq_excl = function (code) {
  // '=!'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) return this.finishOp(_tokentype.types.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2);
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) {
    // '=>'
    this.pos += 2;
    return this.finishToken(_tokentype.types.arrow);
  }
  return this.finishOp(code === 61 ? _tokentype.types.eq : _tokentype.types.prefix, 1);
};

pp.getTokenFromCode = function (code) {
  switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
    case 46:
      // '.'
      return this.readToken_dot();

    // Punctuation tokens.
    case 40:
      ++this.pos;return this.finishToken(_tokentype.types.parenL);
    case 41:
      ++this.pos;return this.finishToken(_tokentype.types.parenR);
    case 59:
      ++this.pos;return this.finishToken(_tokentype.types.semi);
    case 44:
      ++this.pos;return this.finishToken(_tokentype.types.comma);
    case 91:
      ++this.pos;return this.finishToken(_tokentype.types.bracketL);
    case 93:
      ++this.pos;return this.finishToken(_tokentype.types.bracketR);
    case 123:
      ++this.pos;return this.finishToken(_tokentype.types.braceL);
    case 125:
      ++this.pos;return this.finishToken(_tokentype.types.braceR);
    case 58:
      ++this.pos;return this.finishToken(_tokentype.types.colon);
    case 63:
      ++this.pos;return this.finishToken(_tokentype.types.question);

    case 96:
      // '`'
      if (this.options.ecmaVersion < 6) break;
      ++this.pos;
      return this.finishToken(_tokentype.types.backQuote);

    case 48:
      // '0'
      var next = this.input.charCodeAt(this.pos + 1);
      if (next === 120 || next === 88) return this.readRadixNumber(16); // '0x', '0X' - hex number
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) return this.readRadixNumber(8); // '0o', '0O' - octal number
        if (next === 98 || next === 66) return this.readRadixNumber(2); // '0b', '0B' - binary number
      }
    // Anything else beginning with a digit is an integer, octal
    // number, or float.
    case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
      // 1-9
      return this.readNumber(false);

    // Quotes produce strings.
    case 34:case 39:
      // '"', "'"
      return this.readString(code);

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.

    case 47:
      // '/'
      return this.readToken_slash();

    case 37:case 42:
      // '%*'
      return this.readToken_mult_modulo(code);

    case 124:case 38:
      // '|&'
      return this.readToken_pipe_amp(code);

    case 94:
      // '^'
      return this.readToken_caret();

    case 43:case 45:
      // '+-'
      return this.readToken_plus_min(code);

    case 60:case 62:
      // '<>'
      return this.readToken_lt_gt(code);

    case 61:case 33:
      // '=!'
      return this.readToken_eq_excl(code);

    case 126:
      // '~'
      return this.finishOp(_tokentype.types.prefix, 1);
  }

  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};

pp.finishOp = function (type, size) {
  var str = this.input.slice(this.pos, this.pos + size);
  this.pos += size;
  return this.finishToken(type, str);
};

// Parse a regular expression. Some context-awareness is necessary,
// since a '/' inside a '[]' set does not end the expression.

function tryCreateRegexp(src, flags, throwErrorAt, parser) {
  try {
    return new RegExp(src, flags);
  } catch (e) {
    if (throwErrorAt !== undefined) {
      if (e instanceof SyntaxError) parser.raise(throwErrorAt, "Error parsing regular expression: " + e.message);
      throw e;
    }
  }
}

var regexpUnicodeSupport = !!tryCreateRegexp("￿", "u");

pp.readRegexp = function () {
  var _this = this;

  var escaped = undefined,
      inClass = undefined,
      start = this.pos;
  for (;;) {
    if (this.pos >= this.input.length) this.raise(start, "Unterminated regular expression");
    var ch = this.input.charAt(this.pos);
    if (_whitespace.lineBreak.test(ch)) this.raise(start, "Unterminated regular expression");
    if (!escaped) {
      if (ch === "[") inClass = true;else if (ch === "]" && inClass) inClass = false;else if (ch === "/" && !inClass) break;
      escaped = ch === "\\";
    } else escaped = false;
    ++this.pos;
  }
  var content = this.input.slice(start, this.pos);
  ++this.pos;
  // Need to use `readWord1` because '\uXXXX' sequences are allowed
  // here (don't ask).
  var mods = this.readWord1();
  var tmp = content;
  if (mods) {
    var validFlags = /^[gim]*$/;
    if (this.options.ecmaVersion >= 6) validFlags = /^[gimuy]*$/;
    if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag");
    if (mods.indexOf('u') >= 0 && !regexpUnicodeSupport) {
      // Replace each astral symbol and every Unicode escape sequence that
      // possibly represents an astral symbol or a paired surrogate with a
      // single ASCII symbol to avoid throwing on regular expressions that
      // are only valid in combination with the `/u` flag.
      // Note: replacing with the ASCII symbol `x` might cause false
      // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
      // perfectly valid pattern that is equivalent to `[a-b]`, but it would
      // be replaced by `[x-b]` which throws an error.
      tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, function (_match, code, offset) {
        code = Number("0x" + code);
        if (code > 0x10FFFF) _this.raise(start + offset + 3, "Code point out of bounds");
        return "x";
      });
      tmp = tmp.replace(/\\u([a-fA-F0-9]{4})|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x");
    }
  }
  // Detect invalid regular expressions.
  var value = null;
  // Rhino's regular expression parser is flaky and throws uncatchable exceptions,
  // so don't do detection if we are running under Rhino
  if (!isRhino) {
    tryCreateRegexp(tmp, undefined, start, this);
    // Get a regular expression object for this pattern-flag pair, or `null` in
    // case the current environment doesn't support the flags it uses.
    value = tryCreateRegexp(content, mods);
  }
  return this.finishToken(_tokentype.types.regexp, { pattern: content, flags: mods, value: value });
};

// Read an integer in the given radix. Return null if zero digits
// were read, the integer value otherwise. When `len` is given, this
// will return `null` unless the integer has exactly `len` digits.

pp.readInt = function (radix, len) {
  var start = this.pos,
      total = 0;
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
    var code = this.input.charCodeAt(this.pos),
        val = undefined;
    if (code >= 97) val = code - 97 + 10; // a
    else if (code >= 65) val = code - 65 + 10; // A
      else if (code >= 48 && code <= 57) val = code - 48; // 0-9
        else val = Infinity;
    if (val >= radix) break;
    ++this.pos;
    total = total * radix + val;
  }
  if (this.pos === start || len != null && this.pos - start !== len) return null;

  return total;
};

pp.readRadixNumber = function (radix) {
  this.pos += 2; // 0x
  var val = this.readInt(radix);
  if (val == null) this.raise(this.start + 2, "Expected number in radix " + radix);
  if (_identifier.isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number");
  return this.finishToken(_tokentype.types.num, val);
};

// Read an integer, octal integer, or floating-point number.

pp.readNumber = function (startsWithDot) {
  var start = this.pos,
      isFloat = false,
      octal = this.input.charCodeAt(this.pos) === 48;
  if (!startsWithDot && this.readInt(10) === null) this.raise(start, "Invalid number");
  var next = this.input.charCodeAt(this.pos);
  if (next === 46) {
    // '.'
    ++this.pos;
    this.readInt(10);
    isFloat = true;
    next = this.input.charCodeAt(this.pos);
  }
  if (next === 69 || next === 101) {
    // 'eE'
    next = this.input.charCodeAt(++this.pos);
    if (next === 43 || next === 45) ++this.pos; // '+-'
    if (this.readInt(10) === null) this.raise(start, "Invalid number");
    isFloat = true;
  }
  if (_identifier.isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number");

  var str = this.input.slice(start, this.pos),
      val = undefined;
  if (isFloat) val = parseFloat(str);else if (!octal || str.length === 1) val = parseInt(str, 10);else if (/[89]/.test(str) || this.strict) this.raise(start, "Invalid number");else val = parseInt(str, 8);
  return this.finishToken(_tokentype.types.num, val);
};

// Read a string value, interpreting backslash-escapes.

pp.readCodePoint = function () {
  var ch = this.input.charCodeAt(this.pos),
      code = undefined;

  if (ch === 123) {
    if (this.options.ecmaVersion < 6) this.unexpected();
    var codePos = ++this.pos;
    code = this.readHexChar(this.input.indexOf('}', this.pos) - this.pos);
    ++this.pos;
    if (code > 0x10FFFF) this.raise(codePos, "Code point out of bounds");
  } else {
    code = this.readHexChar(4);
  }
  return code;
};

function codePointToString(code) {
  // UTF-16 Decoding
  if (code <= 0xFFFF) return String.fromCharCode(code);
  code -= 0x10000;
  return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00);
}

pp.readString = function (quote) {
  var out = "",
      chunkStart = ++this.pos;
  for (;;) {
    if (this.pos >= this.input.length) this.raise(this.start, "Unterminated string constant");
    var ch = this.input.charCodeAt(this.pos);
    if (ch === quote) break;
    if (ch === 92) {
      // '\'
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(false);
      chunkStart = this.pos;
    } else {
      if (_whitespace.isNewLine(ch)) this.raise(this.start, "Unterminated string constant");
      ++this.pos;
    }
  }
  out += this.input.slice(chunkStart, this.pos++);
  return this.finishToken(_tokentype.types.string, out);
};

// Reads template string tokens.

pp.readTmplToken = function () {
  var out = "",
      chunkStart = this.pos;
  for (;;) {
    if (this.pos >= this.input.length) this.raise(this.start, "Unterminated template");
    var ch = this.input.charCodeAt(this.pos);
    if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) {
      // '`', '${'
      if (this.pos === this.start && this.type === _tokentype.types.template) {
        if (ch === 36) {
          this.pos += 2;
          return this.finishToken(_tokentype.types.dollarBraceL);
        } else {
          ++this.pos;
          return this.finishToken(_tokentype.types.backQuote);
        }
      }
      out += this.input.slice(chunkStart, this.pos);
      return this.finishToken(_tokentype.types.template, out);
    }
    if (ch === 92) {
      // '\'
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(true);
      chunkStart = this.pos;
    } else if (_whitespace.isNewLine(ch)) {
      out += this.input.slice(chunkStart, this.pos);
      ++this.pos;
      switch (ch) {
        case 13:
          if (this.input.charCodeAt(this.pos) === 10) ++this.pos;
        case 10:
          out += "\n";
          break;
        default:
          out += String.fromCharCode(ch);
          break;
      }
      if (this.options.locations) {
        ++this.curLine;
        this.lineStart = this.pos;
      }
      chunkStart = this.pos;
    } else {
      ++this.pos;
    }
  }
};

// Used to read escaped characters

pp.readEscapedChar = function (inTemplate) {
  var ch = this.input.charCodeAt(++this.pos);
  ++this.pos;
  switch (ch) {
    case 110:
      return "\n"; // 'n' -> '\n'
    case 114:
      return "\r"; // 'r' -> '\r'
    case 120:
      return String.fromCharCode(this.readHexChar(2)); // 'x'
    case 117:
      return codePointToString(this.readCodePoint()); // 'u'
    case 116:
      return "\t"; // 't' -> '\t'
    case 98:
      return "\b"; // 'b' -> '\b'
    case 118:
      return "\u000b"; // 'v' -> '\u000b'
    case 102:
      return "\f"; // 'f' -> '\f'
    case 13:
      if (this.input.charCodeAt(this.pos) === 10) ++this.pos; // '\r\n'
    case 10:
      // ' \n'
      if (this.options.locations) {
        this.lineStart = this.pos;++this.curLine;
      }
      return "";
    default:
      if (ch >= 48 && ch <= 55) {
        var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
        var octal = parseInt(octalStr, 8);
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1);
          octal = parseInt(octalStr, 8);
        }
        if (octalStr !== "0" && (this.strict || inTemplate)) {
          this.raise(this.pos - 2, "Octal literal in strict mode");
        }
        this.pos += octalStr.length - 1;
        return String.fromCharCode(octal);
      }
      return String.fromCharCode(ch);
  }
};

// Used to read character escape sequences ('\x', '\u', '\U').

pp.readHexChar = function (len) {
  var codePos = this.pos;
  var n = this.readInt(16, len);
  if (n === null) this.raise(codePos, "Bad character escape sequence");
  return n;
};

// Read an identifier, and return it as a string. Sets `this.containsEsc`
// to whether the word contained a '\u' escape.
//
// Incrementally adds only escaped chars, adding other chunks as-is
// as a micro-optimization.

pp.readWord1 = function () {
  this.containsEsc = false;
  var word = "",
      first = true,
      chunkStart = this.pos;
  var astral = this.options.ecmaVersion >= 6;
  while (this.pos < this.input.length) {
    var ch = this.fullCharCodeAtPos();
    if (_identifier.isIdentifierChar(ch, astral)) {
      this.pos += ch <= 0xffff ? 1 : 2;
    } else if (ch === 92) {
      // "\"
      this.containsEsc = true;
      word += this.input.slice(chunkStart, this.pos);
      var escStart = this.pos;
      if (this.input.charCodeAt(++this.pos) != 117) // "u"
        this.raise(this.pos, "Expecting Unicode escape sequence \\uXXXX");
      ++this.pos;
      var esc = this.readCodePoint();
      if (!(first ? _identifier.isIdentifierStart : _identifier.isIdentifierChar)(esc, astral)) this.raise(escStart, "Invalid Unicode escape");
      word += codePointToString(esc);
      chunkStart = this.pos;
    } else {
      break;
    }
    first = false;
  }
  return word + this.input.slice(chunkStart, this.pos);
};

// Read an identifier or keyword token. Will check for reserved
// words when necessary.

pp.readWord = function () {
  var word = this.readWord1();
  var type = _tokentype.types.name;
  if ((this.options.ecmaVersion >= 6 || !this.containsEsc) && this.keywords.test(word)) type = _tokentype.keywords[word];
  return this.finishToken(type, word);
};

},{"./identifier":2,"./locutil":5,"./state":10,"./tokentype":14,"./whitespace":16}],14:[function(_dereq_,module,exports){
// ## Token types

// The assignment of fine-grained, information-carrying type objects
// allows the tokenizer to store the information it has about a
// token in a way that is very cheap for the parser to look up.

// All token type variables start with an underscore, to make them
// easy to recognize.

// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// The `startsExpr` property is used to check if the token ends a
// `yield` expression. It is set on all token types that either can
// directly start an expression (like a quotation mark) or can
// continue an expression (like the body of a string).
//
// `isLoop` marks a keyword as starting a loop, which is important
// to know when parsing a label, in order to allow or disallow
// continue jumps to that label.

"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TokenType = function TokenType(label) {
  var conf = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  _classCallCheck(this, TokenType);

  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop || null;
  this.updateContext = null;
};

exports.TokenType = TokenType;

function binop(name, prec) {
  return new TokenType(name, { beforeExpr: true, binop: prec });
}
var beforeExpr = { beforeExpr: true },
    startsExpr = { startsExpr: true };

var types = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  eof: new TokenType("eof"),

  // Punctuation token types.
  bracketL: new TokenType("[", { beforeExpr: true, startsExpr: true }),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", { beforeExpr: true, startsExpr: true }),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", { beforeExpr: true, startsExpr: true }),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", { beforeExpr: true, startsExpr: true }),

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  eq: new TokenType("=", { beforeExpr: true, isAssign: true }),
  assign: new TokenType("_=", { beforeExpr: true, isAssign: true }),
  incDec: new TokenType("++/--", { prefix: true, postfix: true, startsExpr: true }),
  prefix: new TokenType("prefix", { beforeExpr: true, prefix: true, startsExpr: true }),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=", 6),
  relational: binop("</>", 7),
  bitShift: binop("<</>>", 8),
  plusMin: new TokenType("+/-", { beforeExpr: true, binop: 9, prefix: true, startsExpr: true }),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10)
};

exports.types = types;
// Map keyword names to token types.

var keywords = {};

exports.keywords = keywords;
// Succinct definitions of keyword token types
function kw(name) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  options.keyword = name;
  keywords[name] = types["_" + name] = new TokenType(name, options);
}

kw("break");
kw("case", beforeExpr);
kw("catch");
kw("continue");
kw("debugger");
kw("default", beforeExpr);
kw("do", { isLoop: true, beforeExpr: true });
kw("else", beforeExpr);
kw("finally");
kw("for", { isLoop: true });
kw("function", startsExpr);
kw("if");
kw("return", beforeExpr);
kw("switch");
kw("throw", beforeExpr);
kw("try");
kw("var");
kw("let");
kw("const");
kw("while", { isLoop: true });
kw("with");
kw("new", { beforeExpr: true, startsExpr: true });
kw("this", startsExpr);
kw("super", startsExpr);
kw("class");
kw("extends", beforeExpr);
kw("export");
kw("import");
kw("yield", { beforeExpr: true, startsExpr: true });
kw("null", startsExpr);
kw("true", startsExpr);
kw("false", startsExpr);
kw("in", { beforeExpr: true, binop: 7 });
kw("instanceof", { beforeExpr: true, binop: 7 });
kw("typeof", { beforeExpr: true, prefix: true, startsExpr: true });
kw("void", { beforeExpr: true, prefix: true, startsExpr: true });
kw("delete", { beforeExpr: true, prefix: true, startsExpr: true });

},{}],15:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
exports.isArray = isArray;
exports.has = has;

function isArray(obj) {
  return Object.prototype.toString.call(obj) === "[object Array]";
}

// Checks if an object has a property.

function has(obj, propName) {
  return Object.prototype.hasOwnProperty.call(obj, propName);
}

},{}],16:[function(_dereq_,module,exports){
// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.

"use strict";

exports.__esModule = true;
exports.isNewLine = isNewLine;
var lineBreak = /\r\n?|\n|\u2028|\u2029/;
exports.lineBreak = lineBreak;
var lineBreakG = new RegExp(lineBreak.source, "g");

exports.lineBreakG = lineBreakG;

function isNewLine(code) {
  return code === 10 || code === 13 || code === 0x2028 || code == 0x2029;
}

var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
exports.nonASCIIwhitespace = nonASCIIwhitespace;

},{}]},{},[3])(3)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{}],45:[function(require,module,exports){
(function (global){
//     Backbone.js 1.2.3

//     (c) 2010-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(factory) {

  // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
  // We use `self` instead of `window` for `WebWorker` support.
  var root = (typeof self == 'object' && self.self == self && self) ||
            (typeof global == 'object' && global.global == global && global);

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore'), $;
    try { $ = require('jquery'); } catch(e) {}
    factory(root, exports, _, $);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create a local reference to a common array method we'll want to use later.
  var slice = Array.prototype.slice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.2.3';

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... this will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Proxy Backbone class methods to Underscore functions, wrapping the model's
  // `attributes` object or collection's `models` array behind the scenes.
  //
  // collection.filter(function(model) { return model.get('age') > 10 });
  // collection.each(this.addView);
  //
  // `Function#apply` can be slow so we use the method's arg count, if we know it.
  var addMethod = function(length, method, attribute) {
    switch (length) {
      case 1: return function() {
        return _[method](this[attribute]);
      };
      case 2: return function(value) {
        return _[method](this[attribute], value);
      };
      case 3: return function(iteratee, context) {
        return _[method](this[attribute], cb(iteratee, this), context);
      };
      case 4: return function(iteratee, defaultVal, context) {
        return _[method](this[attribute], cb(iteratee, this), defaultVal, context);
      };
      default: return function() {
        var args = slice.call(arguments);
        args.unshift(this[attribute]);
        return _[method].apply(_, args);
      };
    }
  };
  var addUnderscoreMethods = function(Class, methods, attribute) {
    _.each(methods, function(length, method) {
      if (_[method]) Class.prototype[method] = addMethod(length, method, attribute);
    });
  };

  // Support `collection.sortBy('attr')` and `collection.findWhere({id: 1})`.
  var cb = function(iteratee, instance) {
    if (_.isFunction(iteratee)) return iteratee;
    if (_.isObject(iteratee) && !instance._isModel(iteratee)) return modelMatcher(iteratee);
    if (_.isString(iteratee)) return function(model) { return model.get(iteratee); };
    return iteratee;
  };
  var modelMatcher = function(attrs) {
    var matcher = _.matches(attrs);
    return function(model) {
      return matcher(model.attributes);
    };
  };

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // a custom event channel. You may bind a callback to an event with `on` or
  // remove with `off`; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {};

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Iterates over the standard `event, callback` (as well as the fancy multiple
  // space-separated events `"change blur", callback` and jQuery-style event
  // maps `{event: callback}`).
  var eventsApi = function(iteratee, events, name, callback, opts) {
    var i = 0, names;
    if (name && typeof name === 'object') {
      // Handle event maps.
      if (callback !== void 0 && 'context' in opts && opts.context === void 0) opts.context = callback;
      for (names = _.keys(name); i < names.length ; i++) {
        events = eventsApi(iteratee, events, names[i], name[names[i]], opts);
      }
    } else if (name && eventSplitter.test(name)) {
      // Handle space separated event names by delegating them individually.
      for (names = name.split(eventSplitter); i < names.length; i++) {
        events = iteratee(events, names[i], callback, opts);
      }
    } else {
      // Finally, standard events.
      events = iteratee(events, name, callback, opts);
    }
    return events;
  };

  // Bind an event to a `callback` function. Passing `"all"` will bind
  // the callback to all events fired.
  Events.on = function(name, callback, context) {
    return internalOn(this, name, callback, context);
  };

  // Guard the `listening` argument from the public API.
  var internalOn = function(obj, name, callback, context, listening) {
    obj._events = eventsApi(onApi, obj._events || {}, name, callback, {
        context: context,
        ctx: obj,
        listening: listening
    });

    if (listening) {
      var listeners = obj._listeners || (obj._listeners = {});
      listeners[listening.id] = listening;
    }

    return obj;
  };

  // Inversion-of-control versions of `on`. Tell *this* object to listen to
  // an event in another object... keeping track of what it's listening to
  // for easier unbinding later.
  Events.listenTo =  function(obj, name, callback) {
    if (!obj) return this;
    var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
    var listeningTo = this._listeningTo || (this._listeningTo = {});
    var listening = listeningTo[id];

    // This object is not listening to any other events on `obj` yet.
    // Setup the necessary references to track the listening callbacks.
    if (!listening) {
      var thisId = this._listenId || (this._listenId = _.uniqueId('l'));
      listening = listeningTo[id] = {obj: obj, objId: id, id: thisId, listeningTo: listeningTo, count: 0};
    }

    // Bind callbacks on obj, and keep track of them on listening.
    internalOn(obj, name, callback, this, listening);
    return this;
  };

  // The reducing API that adds a callback to the `events` object.
  var onApi = function(events, name, callback, options) {
    if (callback) {
      var handlers = events[name] || (events[name] = []);
      var context = options.context, ctx = options.ctx, listening = options.listening;
      if (listening) listening.count++;

      handlers.push({ callback: callback, context: context, ctx: context || ctx, listening: listening });
    }
    return events;
  };

  // Remove one or many callbacks. If `context` is null, removes all
  // callbacks with that function. If `callback` is null, removes all
  // callbacks for the event. If `name` is null, removes all bound
  // callbacks for all events.
  Events.off =  function(name, callback, context) {
    if (!this._events) return this;
    this._events = eventsApi(offApi, this._events, name, callback, {
        context: context,
        listeners: this._listeners
    });
    return this;
  };

  // Tell this object to stop listening to either specific events ... or
  // to every object it's currently listening to.
  Events.stopListening =  function(obj, name, callback) {
    var listeningTo = this._listeningTo;
    if (!listeningTo) return this;

    var ids = obj ? [obj._listenId] : _.keys(listeningTo);

    for (var i = 0; i < ids.length; i++) {
      var listening = listeningTo[ids[i]];

      // If listening doesn't exist, this object is not currently
      // listening to obj. Break out early.
      if (!listening) break;

      listening.obj.off(name, callback, this);
    }
    if (_.isEmpty(listeningTo)) this._listeningTo = void 0;

    return this;
  };

  // The reducing API that removes a callback from the `events` object.
  var offApi = function(events, name, callback, options) {
    if (!events) return;

    var i = 0, listening;
    var context = options.context, listeners = options.listeners;

    // Delete all events listeners and "drop" events.
    if (!name && !callback && !context) {
      var ids = _.keys(listeners);
      for (; i < ids.length; i++) {
        listening = listeners[ids[i]];
        delete listeners[listening.id];
        delete listening.listeningTo[listening.objId];
      }
      return;
    }

    var names = name ? [name] : _.keys(events);
    for (; i < names.length; i++) {
      name = names[i];
      var handlers = events[name];

      // Bail out if there are no events stored.
      if (!handlers) break;

      // Replace events if there are any remaining.  Otherwise, clean up.
      var remaining = [];
      for (var j = 0; j < handlers.length; j++) {
        var handler = handlers[j];
        if (
          callback && callback !== handler.callback &&
            callback !== handler.callback._callback ||
              context && context !== handler.context
        ) {
          remaining.push(handler);
        } else {
          listening = handler.listening;
          if (listening && --listening.count === 0) {
            delete listeners[listening.id];
            delete listening.listeningTo[listening.objId];
          }
        }
      }

      // Update tail event if the list has any events.  Otherwise, clean up.
      if (remaining.length) {
        events[name] = remaining;
      } else {
        delete events[name];
      }
    }
    if (_.size(events)) return events;
  };

  // Bind an event to only be triggered a single time. After the first time
  // the callback is invoked, its listener will be removed. If multiple events
  // are passed in using the space-separated syntax, the handler will fire
  // once for each event, not once for a combination of all events.
  Events.once =  function(name, callback, context) {
    // Map the event into a `{event: once}` object.
    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.off, this));
    return this.on(events, void 0, context);
  };

  // Inversion-of-control versions of `once`.
  Events.listenToOnce =  function(obj, name, callback) {
    // Map the event into a `{event: once}` object.
    var events = eventsApi(onceMap, {}, name, callback, _.bind(this.stopListening, this, obj));
    return this.listenTo(obj, events);
  };

  // Reduces the event callbacks into a map of `{event: onceWrapper}`.
  // `offer` unbinds the `onceWrapper` after it has been called.
  var onceMap = function(map, name, callback, offer) {
    if (callback) {
      var once = map[name] = _.once(function() {
        offer(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
    }
    return map;
  };

  // Trigger one or many events, firing all bound callbacks. Callbacks are
  // passed the same arguments as `trigger` is, apart from the event name
  // (unless you're listening on `"all"`, which will cause your callback to
  // receive the true name of the event as the first argument).
  Events.trigger =  function(name) {
    if (!this._events) return this;

    var length = Math.max(0, arguments.length - 1);
    var args = Array(length);
    for (var i = 0; i < length; i++) args[i] = arguments[i + 1];

    eventsApi(triggerApi, this._events, name, void 0, args);
    return this;
  };

  // Handles triggering the appropriate event callbacks.
  var triggerApi = function(objEvents, name, cb, args) {
    if (objEvents) {
      var events = objEvents[name];
      var allEvents = objEvents.all;
      if (events && allEvents) allEvents = allEvents.slice();
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, [name].concat(args));
    }
    return objEvents;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId(this.cidPrefix);
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // The prefix is used to create the client id which is used to identify models locally.
    // You may want to override this if you're experiencing name clashes with model ids.
    cidPrefix: 'c',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Special-cased proxy to underscore's `_.matches` method.
    matches: function(attrs) {
      return !!_.iteratee(attrs, this)(this.attributes);
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      var attrs;
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      var unset      = options.unset;
      var silent     = options.silent;
      var changes    = [];
      var changing   = this._changing;
      this._changing = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }

      var current = this.attributes;
      var changed = this.changed;
      var prev    = this._previousAttributes;

      // For each `set` attribute, update or delete the current value.
      for (var attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          changed[attr] = val;
        } else {
          delete changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Update the `id`.
      this.id = this.get(this.idAttribute);

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0; i < changes.length; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      var changed = {};
      for (var attr in diff) {
        var val = diff[attr];
        if (_.isEqual(old[attr], val)) continue;
        changed[attr] = val;
      }
      return _.size(changed) ? changed : false;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server, merging the response with the model's
    // local attributes. Any changed attributes will trigger a "change" event.
    fetch: function(options) {
      options = _.extend({parse: true}, options);
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        var serverAttrs = options.parse ? model.parse(resp, options) : resp;
        if (!model.set(serverAttrs, options)) return false;
        if (success) success.call(options.context, model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      // Handle both `"key", value` and `{key: value}` -style arguments.
      var attrs;
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true, parse: true}, options);
      var wait = options.wait;

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      var model = this;
      var success = options.success;
      var attributes = this.attributes;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = options.parse ? model.parse(resp, options) : resp;
        if (wait) serverAttrs = _.extend({}, attrs, serverAttrs);
        if (serverAttrs && !model.set(serverAttrs, options)) return false;
        if (success) success.call(options.context, model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      // Set temporary attributes if `{wait: true}` to properly find new ids.
      if (attrs && wait) this.attributes = _.extend({}, attributes, attrs);

      var method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch' && !options.attrs) options.attrs = attrs;
      var xhr = this.sync(method, this, options);

      // Restore attributes.
      this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;
      var wait = options.wait;

      var destroy = function() {
        model.stopListening();
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (wait) destroy();
        if (success) success.call(options.context, model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      var xhr = false;
      if (this.isNew()) {
        _.defer(options.success);
      } else {
        wrapError(this, options);
        xhr = this.sync('delete', this, options);
      }
      if (!wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      var id = this.get(this.idAttribute);
      return base.replace(/[^\/]$/, '$&/') + encodeURIComponent(id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return !this.has(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.defaults({validate: true}, options));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model, mapped to the
  // number of arguments they take.
  var modelMethods = { keys: 1, values: 1, pairs: 1, invert: 1, pick: 0,
      omit: 0, chain: 1, isEmpty: 1 };

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  addUnderscoreMethods(Model, modelMethods, 'attributes');

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analogous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  // Splices `insert` into `array` at index `at`.
  var splice = function(array, insert, at) {
    at = Math.min(Math.max(at, 0), array.length);
    var tail = Array(array.length - at);
    var length = insert.length;
    for (var i = 0; i < tail.length; i++) tail[i] = array[i + at];
    for (i = 0; i < length; i++) array[i + at] = insert[i];
    for (i = 0; i < tail.length; i++) array[i + length + at] = tail[i];
  };

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model) { return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set. `models` may be Backbone
    // Models or raw JavaScript objects to be converted to Models, or any
    // combination of the two.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      options = _.extend({}, options);
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      var removed = this._removeModels(models, options);
      if (!options.silent && removed) this.trigger('update', this, options);
      return singular ? removed[0] : removed;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      if (models == null) return;

      options = _.defaults({}, options, setOptions);
      if (options.parse && !this._isModel(models)) models = this.parse(models, options);

      var singular = !_.isArray(models);
      models = singular ? [models] : models.slice();

      var at = options.at;
      if (at != null) at = +at;
      if (at < 0) at += this.length + 1;

      var set = [];
      var toAdd = [];
      var toRemove = [];
      var modelMap = {};

      var add = options.add;
      var merge = options.merge;
      var remove = options.remove;

      var sort = false;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      var model;
      for (var i = 0; i < models.length; i++) {
        model = models[i];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        var existing = this.get(model);
        if (existing) {
          if (merge && model !== existing) {
            var attrs = this._isModel(model) ? model.attributes : model;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort) sort = existing.hasChanged(sortAttr);
          }
          if (!modelMap[existing.cid]) {
            modelMap[existing.cid] = true;
            set.push(existing);
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(model, options);
          if (model) {
            toAdd.push(model);
            this._addReference(model, options);
            modelMap[model.cid] = true;
            set.push(model);
          }
        }
      }

      // Remove stale models.
      if (remove) {
        for (i = 0; i < this.length; i++) {
          model = this.models[i];
          if (!modelMap[model.cid]) toRemove.push(model);
        }
        if (toRemove.length) this._removeModels(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      var orderChanged = false;
      var replace = !sortable && add && remove;
      if (set.length && replace) {
        orderChanged = this.length != set.length || _.some(this.models, function(model, index) {
          return model !== set[index];
        });
        this.models.length = 0;
        splice(this.models, set, 0);
        this.length = this.models.length;
      } else if (toAdd.length) {
        if (sortable) sort = true;
        splice(this.models, toAdd, at == null ? this.length : at);
        this.length = this.models.length;
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        for (i = 0; i < toAdd.length; i++) {
          if (at != null) options.index = at + i;
          model = toAdd[i];
          model.trigger('add', model, this, options);
        }
        if (sort || orderChanged) this.trigger('sort', this, options);
        if (toAdd.length || toRemove.length) this.trigger('update', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options = options ? _.clone(options) : {};
      for (var i = 0; i < this.models.length; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      return this.remove(model, options);
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      return this.remove(model, options);
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      var id = this.modelId(this._isModel(obj) ? obj.attributes : obj);
      return this._byId[obj] || this._byId[id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    at: function(index) {
      if (index < 0) index += this.length;
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      return this[first ? 'find' : 'filter'](attrs);
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      var comparator = this.comparator;
      if (!comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      var length = comparator.length;
      if (_.isFunction(comparator)) comparator = _.bind(comparator, this);

      // Run sort based on type of `comparator`.
      if (length === 1 || _.isString(comparator)) {
        this.models = this.sortBy(comparator);
      } else {
        this.models.sort(comparator);
      }
      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = _.extend({parse: true}, options);
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success.call(options.context, collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      var wait = options.wait;
      model = this._prepareModel(model, options);
      if (!model) return false;
      if (!wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp, callbackOpts) {
        if (wait) collection.add(model, callbackOpts);
        if (success) success.call(callbackOpts.context, model, resp, callbackOpts);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models, {
        model: this.model,
        comparator: this.comparator
      });
    },

    // Define how to uniquely identify models in the collection.
    modelId: function (attrs) {
      return attrs[this.model.prototype.idAttribute || 'id'];
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (this._isModel(attrs)) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Internal method called by both remove and set.
    _removeModels: function(models, options) {
      var removed = [];
      for (var i = 0; i < models.length; i++) {
        var model = this.get(models[i]);
        if (!model) continue;

        var index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;

        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }

        removed.push(model);
        this._removeReference(model, options);
      }
      return removed.length ? removed : false;
    },

    // Method for checking whether an object should be considered a model for
    // the purposes of adding to the collection.
    _isModel: function (model) {
      return model instanceof Model;
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function(model, options) {
      this._byId[model.cid] = model;
      var id = this.modelId(model.attributes);
      if (id != null) this._byId[id] = model;
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model, options) {
      delete this._byId[model.cid];
      var id = this.modelId(model.attributes);
      if (id != null) delete this._byId[id];
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (event === 'change') {
        var prevId = this.modelId(model.previousAttributes());
        var id = this.modelId(model.attributes);
        if (prevId !== id) {
          if (prevId != null) delete this._byId[prevId];
          if (id != null) this._byId[id] = model;
        }
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var collectionMethods = { forEach: 3, each: 3, map: 3, collect: 3, reduce: 4,
      foldl: 4, inject: 4, reduceRight: 4, foldr: 4, find: 3, detect: 3, filter: 3,
      select: 3, reject: 3, every: 3, all: 3, some: 3, any: 3, include: 3, includes: 3,
      contains: 3, invoke: 0, max: 3, min: 3, toArray: 1, size: 1, first: 3,
      head: 3, take: 3, initial: 3, rest: 3, tail: 3, drop: 3, last: 3,
      without: 0, difference: 0, indexOf: 3, shuffle: 1, lastIndexOf: 3,
      isEmpty: 1, chain: 1, sample: 3, partition: 3, groupBy: 3, countBy: 3,
      sortBy: 3, indexBy: 3};

  // Mix in each Underscore method as a proxy to `Collection#models`.
  addUnderscoreMethods(Collection, collectionMethods, 'models');

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be set as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this._removeElement();
      this.stopListening();
      return this;
    },

    // Remove this view's element from the document and all event listeners
    // attached to it. Exposed for subclasses using an alternative DOM
    // manipulation API.
    _removeElement: function() {
      this.$el.remove();
    },

    // Change the view's element (`this.el` property) and re-delegate the
    // view's events on the new element.
    setElement: function(element) {
      this.undelegateEvents();
      this._setElement(element);
      this.delegateEvents();
      return this;
    },

    // Creates the `this.el` and `this.$el` references for this view using the
    // given `el`. `el` can be a CSS selector or an HTML string, a jQuery
    // context or an element. Subclasses can override this to utilize an
    // alternative DOM manipulation API and are only required to set the
    // `this.el` property.
    _setElement: function(el) {
      this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);
      this.el = this.$el[0];
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    delegateEvents: function(events) {
      events || (events = _.result(this, 'events'));
      if (!events) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[method];
        if (!method) continue;
        var match = key.match(delegateEventSplitter);
        this.delegate(match[1], match[2], _.bind(method, this));
      }
      return this;
    },

    // Add a single event listener to the view's element (or a child element
    // using `selector`). This only works for delegate-able events: not `focus`,
    // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
    delegate: function(eventName, selector, listener) {
      this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
      return this;
    },

    // Clears all callbacks previously bound to the view by `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      if (this.$el) this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // A finer-grained `undelegateEvents` for removing a single delegated event.
    // `selector` and `listener` are both optional.
    undelegate: function(eventName, selector, listener) {
      this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
      return this;
    },

    // Produces a DOM element to be assigned to your view. Exposed for
    // subclasses using an alternative DOM manipulation API.
    _createElement: function(tagName) {
      return document.createElement(tagName);
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        this.setElement(this._createElement(_.result(this, 'tagName')));
        this._setAttributes(attrs);
      } else {
        this.setElement(_.result(this, 'el'));
      }
    },

    // Set attributes from a hash on this view's element.  Exposed for
    // subclasses using an alternative DOM manipulation API.
    _setAttributes: function(attributes) {
      this.$el.attr(attributes);
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // Pass along `textStatus` and `errorThrown` from jQuery.
    var error = options.error;
    options.error = function(xhr, textStatus, errorThrown) {
      options.textStatus = textStatus;
      options.errorThrown = errorThrown;
      if (error) error.call(options.context, xhr, textStatus, errorThrown);
    };

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        if (router.execute(callback, args, name) !== false) {
          router.trigger.apply(router, ['route:' + name].concat(args));
          router.trigger('route', name, args);
          Backbone.history.trigger('route', router, name, args);
        }
      });
      return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function(callback, args, name) {
      if (callback) callback.apply(this, args);
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    this.checkUrl = _.bind(this.checkUrl, this);

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for stripping urls of hash.
  var pathStripper = /#.*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function() {
      var path = this.location.pathname.replace(/[^\/]$/, '$&/');
      return path === this.root && !this.getSearch();
    },

    // Does the pathname match the root?
    matchRoot: function() {
      var path = this.decodeFragment(this.location.pathname);
      var root = path.slice(0, this.root.length - 1) + '/';
      return root === this.root;
    },

    // Unicode characters in `location.pathname` are percent encoded so they're
    // decoded for comparison. `%25` should not be decoded since it may be part
    // of an encoded parameter.
    decodeFragment: function(fragment) {
      return decodeURI(fragment.replace(/%25/g, '%2525'));
    },

    // In IE6, the hash fragment and search params are incorrect if the
    // fragment contains `?`.
    getSearch: function() {
      var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
      return match ? match[0] : '';
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the pathname and search params, without the root.
    getPath: function() {
      var path = this.decodeFragment(
        this.location.pathname + this.getSearch()
      ).slice(this.root.length - 1);
      return path.charAt(0) === '/' ? path.slice(1) : path;
    },

    // Get the cross-browser normalized URL fragment from the path or hash.
    getFragment: function(fragment) {
      if (fragment == null) {
        if (this._usePushState || !this._wantsHashChange) {
          fragment = this.getPath();
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error('Backbone.history has already been started');
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._hasHashChange   = 'onhashchange' in window && (document.documentMode === void 0 || document.documentMode > 7);
      this._useHashChange   = this._wantsHashChange && this._hasHashChange;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.history && this.history.pushState);
      this._usePushState    = this._wantsPushState && this._hasPushState;
      this.fragment         = this.getFragment();

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          var root = this.root.slice(0, -1) || '/';
          this.location.replace(root + '#' + this.getPath());
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot()) {
          this.navigate(this.getHash(), {replace: true});
        }

      }

      // Proxy an iframe to handle location events if the browser doesn't
      // support the `hashchange` event, HTML5 history, or the user wants
      // `hashChange` but not `pushState`.
      if (!this._hasHashChange && this._wantsHashChange && !this._usePushState) {
        this.iframe = document.createElement('iframe');
        this.iframe.src = 'javascript:0';
        this.iframe.style.display = 'none';
        this.iframe.tabIndex = -1;
        var body = document.body;
        // Using `appendChild` will throw on IE < 9 if the document is not ready.
        var iWindow = body.insertBefore(this.iframe, body.firstChild).contentWindow;
        iWindow.document.open();
        iWindow.document.close();
        iWindow.location.hash = '#' + this.fragment;
      }

      // Add a cross-platform `addEventListener` shim for older browsers.
      var addEventListener = window.addEventListener || function (eventName, listener) {
        return attachEvent('on' + eventName, listener);
      };

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._usePushState) {
        addEventListener('popstate', this.checkUrl, false);
      } else if (this._useHashChange && !this.iframe) {
        addEventListener('hashchange', this.checkUrl, false);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      // Add a cross-platform `removeEventListener` shim for older browsers.
      var removeEventListener = window.removeEventListener || function (eventName, listener) {
        return detachEvent('on' + eventName, listener);
      };

      // Remove window listeners.
      if (this._usePushState) {
        removeEventListener('popstate', this.checkUrl, false);
      } else if (this._useHashChange && !this.iframe) {
        removeEventListener('hashchange', this.checkUrl, false);
      }

      // Clean up the iframe if necessary.
      if (this.iframe) {
        document.body.removeChild(this.iframe);
        this.iframe = null;
      }

      // Some environments will throw when clearing an undefined interval.
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();

      // If the user pressed the back button, the iframe's hash will have
      // changed and we should use that for comparison.
      if (current === this.fragment && this.iframe) {
        current = this.getHash(this.iframe.contentWindow);
      }

      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      // If the root doesn't match, no routes can match either.
      if (!this.matchRoot()) return false;
      fragment = this.fragment = this.getFragment(fragment);
      return _.some(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      // Normalize the fragment.
      fragment = this.getFragment(fragment || '');

      // Don't include a trailing slash on the root.
      var root = this.root;
      if (fragment === '' || fragment.charAt(0) === '?') {
        root = root.slice(0, -1) || '/';
      }
      var url = root + fragment;

      // Strip the hash and decode for matching.
      fragment = this.decodeFragment(fragment.replace(pathStripper, ''));

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._usePushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getHash(this.iframe.contentWindow))) {
          var iWindow = this.iframe.contentWindow;

          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if (!options.replace) {
            iWindow.document.open();
            iWindow.document.close();
          }

          this._updateHash(iWindow.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent` constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error.call(options.context, model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;

}));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"jquery":47,"underscore":46}],46:[function(require,module,exports){
//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  function createReduce(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    function iterator(obj, iteratee, memo, keys, index, length) {
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    }

    return function(obj, iteratee, memo, context) {
      iteratee = optimizeCb(iteratee, context, 4);
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      // Determine the initial value if none is provided.
      if (arguments.length < 3) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      return iterator(obj, iteratee, memo, keys, index, length);
    };
  }

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = isArrayLike(obj) ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, startIndex) {
    var output = [], idx = 0;
    for (var i = startIndex || 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (!shallow) value = flatten(value, shallow, strict);
        var j = 0, len = value.length;
        output.length += len;
        while (j < len) {
          output[idx++] = value[j++];
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(arguments, true, true, 1);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    return _.unzip(arguments);
  };

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  function createPredicateIndexFinder(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  }

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  function createIndexFinder(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
            i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
            length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  }

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var args = slice.call(arguments, 2);
    var bound = function() {
      return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  function collectNonEnumProps(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  }

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys =  _.keys(obj),
          length = keys.length,
          results = {},
          currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(object, oiteratee, context) {
    var result = {}, obj = object, iteratee, keys;
    if (obj == null) return result;
    if (_.isFunction(oiteratee)) {
      keys = _.allKeys(obj);
      iteratee = optimizeCb(oiteratee, context);
    } else {
      keys = flatten(arguments, false, false, 1);
      iteratee = function(value, key, obj) { return key in obj; };
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(flatten(arguments, false, false, 1), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property, fallback) {
    var value = object == null ? void 0 : object[property];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],47:[function(require,module,exports){

},{}],48:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*globals module, URL*/

var _htmlbarsRuntimeMorph = require("./htmlbars-runtime/morph");

var _htmlbarsRuntimeMorph2 = _interopRequireDefault(_htmlbarsRuntimeMorph);

var _morphAttr = require("./morph-attr");

var _morphAttr2 = _interopRequireDefault(_morphAttr);

var _domHelperBuildHtmlDom = require("./dom-helper/build-html-dom");

var _domHelperClasses = require("./dom-helper/classes");

var _domHelperProp = require("./dom-helper/prop");

var doc = typeof document === 'undefined' ? false : document;

var deletesBlankTextNodes = doc && (function (document) {
  var element = document.createElement('div');
  element.appendChild(document.createTextNode(''));
  var clonedElement = element.cloneNode(true);
  return clonedElement.childNodes.length === 0;
})(doc);

var ignoresCheckedAttribute = doc && (function (document) {
  var element = document.createElement('input');
  element.setAttribute('checked', 'checked');
  var clonedElement = element.cloneNode(false);
  return !clonedElement.checked;
})(doc);

var canRemoveSvgViewBoxAttribute = doc && (doc.createElementNS ? (function (document) {
  var element = document.createElementNS(_domHelperBuildHtmlDom.svgNamespace, 'svg');
  element.setAttribute('viewBox', '0 0 100 100');
  element.removeAttribute('viewBox');
  return !element.getAttribute('viewBox');
})(doc) : true);

var canClone = doc && (function (document) {
  var element = document.createElement('div');
  element.appendChild(document.createTextNode(' '));
  element.appendChild(document.createTextNode(' '));
  var clonedElement = element.cloneNode(true);
  return clonedElement.childNodes[0].nodeValue === ' ';
})(doc);

// This is not the namespace of the element, but of
// the elements inside that elements.
function interiorNamespace(element) {
  if (element && element.namespaceURI === _domHelperBuildHtmlDom.svgNamespace && !_domHelperBuildHtmlDom.svgHTMLIntegrationPoints[element.tagName]) {
    return _domHelperBuildHtmlDom.svgNamespace;
  } else {
    return null;
  }
}

// The HTML spec allows for "omitted start tags". These tags are optional
// when their intended child is the first thing in the parent tag. For
// example, this is a tbody start tag:
//
// <table>
//   <tbody>
//     <tr>
//
// The tbody may be omitted, and the browser will accept and render:
//
// <table>
//   <tr>
//
// However, the omitted start tag will still be added to the DOM. Here
// we test the string and context to see if the browser is about to
// perform this cleanup.
//
// http://www.whatwg.org/specs/web-apps/current-work/multipage/syntax.html#optional-tags
// describes which tags are omittable. The spec for tbody and colgroup
// explains this behavior:
//
// http://www.whatwg.org/specs/web-apps/current-work/multipage/tables.html#the-tbody-element
// http://www.whatwg.org/specs/web-apps/current-work/multipage/tables.html#the-colgroup-element
//

var omittedStartTagChildTest = /<([\w:]+)/;
function detectOmittedStartTag(string, contextualElement) {
  // Omitted start tags are only inside table tags.
  if (contextualElement.tagName === 'TABLE') {
    var omittedStartTagChildMatch = omittedStartTagChildTest.exec(string);
    if (omittedStartTagChildMatch) {
      var omittedStartTagChild = omittedStartTagChildMatch[1];
      // It is already asserted that the contextual element is a table
      // and not the proper start tag. Just see if a tag was omitted.
      return omittedStartTagChild === 'tr' || omittedStartTagChild === 'col';
    }
  }
}

function buildSVGDOM(html, dom) {
  var div = dom.document.createElement('div');
  div.innerHTML = '<svg>' + html + '</svg>';
  return div.firstChild.childNodes;
}

var guid = 1;

function ElementMorph(element, dom, namespace) {
  this.element = element;
  this.dom = dom;
  this.namespace = namespace;
  this.guid = "element" + guid++;

  this._state = undefined;
  this.isDirty = true;
}

ElementMorph.prototype.getState = function () {
  if (!this._state) {
    this._state = {};
  }

  return this._state;
};

ElementMorph.prototype.setState = function (newState) {
  /*jshint -W093 */

  return this._state = newState;
};

// renderAndCleanup calls `clear` on all items in the morph map
// just before calling `destroy` on the morph.
//
// As a future refactor this could be changed to set the property
// back to its original/default value.
ElementMorph.prototype.clear = function () {};

ElementMorph.prototype.destroy = function () {
  this.element = null;
  this.dom = null;
};

/*
 * A class wrapping DOM functions to address environment compatibility,
 * namespaces, contextual elements for morph un-escaped content
 * insertion.
 *
 * When entering a template, a DOMHelper should be passed:
 *
 *   template(context, { hooks: hooks, dom: new DOMHelper() });
 *
 * TODO: support foreignObject as a passed contextual element. It has
 * a namespace (svg) that does not match its internal namespace
 * (xhtml).
 *
 * @class DOMHelper
 * @constructor
 * @param {HTMLDocument} _document The document DOM methods are proxied to
 */
function DOMHelper(_document) {
  this.document = _document || document;
  if (!this.document) {
    throw new Error("A document object must be passed to the DOMHelper, or available on the global scope");
  }
  this.canClone = canClone;
  this.namespace = null;

  installEnvironmentSpecificMethods(this);
}

var prototype = DOMHelper.prototype;
prototype.constructor = DOMHelper;

prototype.getElementById = function (id, rootNode) {
  rootNode = rootNode || this.document;
  return rootNode.getElementById(id);
};

prototype.insertBefore = function (element, childElement, referenceChild) {
  return element.insertBefore(childElement, referenceChild);
};

prototype.appendChild = function (element, childElement) {
  return element.appendChild(childElement);
};

var itemAt;

// It appears that sometimes, in yet to be itentified scenarios PhantomJS 2.0
// crashes on childNodes.item(index), but works as expected with childNodes[index];
//
// Although it would be nice to move to childNodes[index] in all scenarios,
// this would require SimpleDOM to maintain the childNodes array. This would be
// quite costly, in both dev time and runtime.
//
// So instead, we choose the best possible method and call it a day.
//
/*global navigator */
if (typeof navigator !== 'undefined' && navigator.userAgent.indexOf('PhantomJS')) {
  itemAt = function (nodes, index) {
    return nodes[index];
  };
} else {
  itemAt = function (nodes, index) {
    return nodes.item(index);
  };
}

prototype.childAt = function (element, indices) {
  var child = element;

  for (var i = 0; i < indices.length; i++) {
    child = itemAt(child.childNodes, indices[i]);
  }

  return child;
};

// Note to a Fellow Implementor:
// Ahh, accessing a child node at an index. Seems like it should be so simple,
// doesn't it? Unfortunately, this particular method has caused us a surprising
// amount of pain. As you'll note below, this method has been modified to walk
// the linked list of child nodes rather than access the child by index
// directly, even though there are two (2) APIs in the DOM that do this for us.
// If you're thinking to yourself, "What an oversight! What an opportunity to
// optimize this code!" then to you I say: stop! For I have a tale to tell.
//
// First, this code must be compatible with simple-dom for rendering on the
// server where there is no real DOM. Previously, we accessed a child node
// directly via `element.childNodes[index]`. While we *could* in theory do a
// full-fidelity simulation of a live `childNodes` array, this is slow,
// complicated and error-prone.
//
// "No problem," we thought, "we'll just use the similar
// `childNodes.item(index)` API." Then, we could just implement our own `item`
// method in simple-dom and walk the child node linked list there, allowing
// us to retain the performance advantages of the (surely optimized) `item()`
// API in the browser.
//
// Unfortunately, an enterprising soul named Samy Alzahrani discovered that in
// IE8, accessing an item out-of-bounds via `item()` causes an exception where
// other browsers return null. This necessitated a... check of
// `childNodes.length`, bringing us back around to having to support a
// full-fidelity `childNodes` array!
//
// Worst of all, Kris Selden investigated how browsers are actualy implemented
// and discovered that they're all linked lists under the hood anyway. Accessing
// `childNodes` requires them to allocate a new live collection backed by that
// linked list, which is itself a rather expensive operation. Our assumed
// optimization had backfired! That is the danger of magical thinking about
// the performance of native implementations.
//
// And this, my friends, is why the following implementation just walks the
// linked list, as surprised as that may make you. Please ensure you understand
// the above before changing this and submitting a PR.
//
// Tom Dale, January 18th, 2015, Portland OR
prototype.childAtIndex = function (element, index) {
  var node = element.firstChild;

  for (var idx = 0; node && idx < index; idx++) {
    node = node.nextSibling;
  }

  return node;
};

prototype.appendText = function (element, text) {
  return element.appendChild(this.document.createTextNode(text));
};

prototype.setAttribute = function (element, name, value) {
  element.setAttribute(name, String(value));
};

prototype.getAttribute = function (element, name) {
  return element.getAttribute(name);
};

prototype.setAttributeNS = function (element, namespace, name, value) {
  element.setAttributeNS(namespace, name, String(value));
};

prototype.getAttributeNS = function (element, namespace, name) {
  return element.getAttributeNS(namespace, name);
};

if (canRemoveSvgViewBoxAttribute) {
  prototype.removeAttribute = function (element, name) {
    element.removeAttribute(name);
  };
} else {
  prototype.removeAttribute = function (element, name) {
    if (element.tagName === 'svg' && name === 'viewBox') {
      element.setAttribute(name, null);
    } else {
      element.removeAttribute(name);
    }
  };
}

prototype.setPropertyStrict = function (element, name, value) {
  if (value === undefined) {
    value = null;
  }

  if (value === null && (name === 'value' || name === 'type' || name === 'src')) {
    value = '';
  }

  element[name] = value;
};

prototype.getPropertyStrict = function (element, name) {
  return element[name];
};

prototype.setProperty = function (element, name, value, namespace) {
  if (element.namespaceURI === _domHelperBuildHtmlDom.svgNamespace) {
    if (_domHelperProp.isAttrRemovalValue(value)) {
      element.removeAttribute(name);
    } else {
      if (namespace) {
        element.setAttributeNS(namespace, name, value);
      } else {
        element.setAttribute(name, value);
      }
    }
  } else {
    var _normalizeProperty = _domHelperProp.normalizeProperty(element, name);

    var normalized = _normalizeProperty.normalized;
    var type = _normalizeProperty.type;

    if (type === 'prop') {
      element[normalized] = value;
    } else {
      if (_domHelperProp.isAttrRemovalValue(value)) {
        element.removeAttribute(name);
      } else {
        if (namespace && element.setAttributeNS) {
          element.setAttributeNS(namespace, name, value);
        } else {
          element.setAttribute(name, value);
        }
      }
    }
  }
};

if (doc && doc.createElementNS) {
  // Only opt into namespace detection if a contextualElement
  // is passed.
  prototype.createElement = function (tagName, contextualElement) {
    var namespace = this.namespace;
    if (contextualElement) {
      if (tagName === 'svg') {
        namespace = _domHelperBuildHtmlDom.svgNamespace;
      } else {
        namespace = interiorNamespace(contextualElement);
      }
    }
    if (namespace) {
      return this.document.createElementNS(namespace, tagName);
    } else {
      return this.document.createElement(tagName);
    }
  };
  prototype.setAttributeNS = function (element, namespace, name, value) {
    element.setAttributeNS(namespace, name, String(value));
  };
} else {
  prototype.createElement = function (tagName) {
    return this.document.createElement(tagName);
  };
  prototype.setAttributeNS = function (element, namespace, name, value) {
    element.setAttribute(name, String(value));
  };
}

prototype.addClasses = _domHelperClasses.addClasses;
prototype.removeClasses = _domHelperClasses.removeClasses;

prototype.setNamespace = function (ns) {
  this.namespace = ns;
};

prototype.detectNamespace = function (element) {
  this.namespace = interiorNamespace(element);
};

prototype.createDocumentFragment = function () {
  return this.document.createDocumentFragment();
};

prototype.createTextNode = function (text) {
  return this.document.createTextNode(text);
};

prototype.createComment = function (text) {
  return this.document.createComment(text);
};

prototype.repairClonedNode = function (element, blankChildTextNodes, isChecked) {
  if (deletesBlankTextNodes && blankChildTextNodes.length > 0) {
    for (var i = 0, len = blankChildTextNodes.length; i < len; i++) {
      var textNode = this.document.createTextNode(''),
          offset = blankChildTextNodes[i],
          before = this.childAtIndex(element, offset);
      if (before) {
        element.insertBefore(textNode, before);
      } else {
        element.appendChild(textNode);
      }
    }
  }
  if (ignoresCheckedAttribute && isChecked) {
    element.setAttribute('checked', 'checked');
  }
};

prototype.cloneNode = function (element, deep) {
  var clone = element.cloneNode(!!deep);
  return clone;
};

prototype.AttrMorphClass = _morphAttr2.default;

prototype.createAttrMorph = function (element, attrName, namespace) {
  return this.AttrMorphClass.create(element, attrName, this, namespace);
};

prototype.ElementMorphClass = ElementMorph;

prototype.createElementMorph = function (element, namespace) {
  return new this.ElementMorphClass(element, this, namespace);
};

prototype.createUnsafeAttrMorph = function (element, attrName, namespace) {
  var morph = this.createAttrMorph(element, attrName, namespace);
  morph.escaped = false;
  return morph;
};

prototype.MorphClass = _htmlbarsRuntimeMorph2.default;

prototype.createMorph = function (parent, start, end, contextualElement) {
  if (contextualElement && contextualElement.nodeType === 11) {
    throw new Error("Cannot pass a fragment as the contextual element to createMorph");
  }

  if (!contextualElement && parent && parent.nodeType === 1) {
    contextualElement = parent;
  }
  var morph = new this.MorphClass(this, contextualElement);
  morph.firstNode = start;
  morph.lastNode = end;
  return morph;
};

prototype.createFragmentMorph = function (contextualElement) {
  if (contextualElement && contextualElement.nodeType === 11) {
    throw new Error("Cannot pass a fragment as the contextual element to createMorph");
  }

  var fragment = this.createDocumentFragment();
  return _htmlbarsRuntimeMorph2.default.create(this, contextualElement, fragment);
};

prototype.replaceContentWithMorph = function (element) {
  var firstChild = element.firstChild;

  if (!firstChild) {
    var comment = this.createComment('');
    this.appendChild(element, comment);
    return _htmlbarsRuntimeMorph2.default.create(this, element, comment);
  } else {
    var morph = _htmlbarsRuntimeMorph2.default.attach(this, element, firstChild, element.lastChild);
    morph.clear();
    return morph;
  }
};

prototype.createUnsafeMorph = function (parent, start, end, contextualElement) {
  var morph = this.createMorph(parent, start, end, contextualElement);
  morph.parseTextAsHTML = true;
  return morph;
};

// This helper is just to keep the templates good looking,
// passing integers instead of element references.
prototype.createMorphAt = function (parent, startIndex, endIndex, contextualElement) {
  var single = startIndex === endIndex;
  var start = this.childAtIndex(parent, startIndex);
  var end = single ? start : this.childAtIndex(parent, endIndex);
  return this.createMorph(parent, start, end, contextualElement);
};

prototype.createUnsafeMorphAt = function (parent, startIndex, endIndex, contextualElement) {
  var morph = this.createMorphAt(parent, startIndex, endIndex, contextualElement);
  morph.parseTextAsHTML = true;
  return morph;
};

prototype.insertMorphBefore = function (element, referenceChild, contextualElement) {
  var insertion = this.document.createComment('');
  element.insertBefore(insertion, referenceChild);
  return this.createMorph(element, insertion, insertion, contextualElement);
};

prototype.appendMorph = function (element, contextualElement) {
  var insertion = this.document.createComment('');
  element.appendChild(insertion);
  return this.createMorph(element, insertion, insertion, contextualElement);
};

prototype.insertBoundary = function (fragment, index) {
  // this will always be null or firstChild
  var child = index === null ? null : this.childAtIndex(fragment, index);
  this.insertBefore(fragment, this.createTextNode(''), child);
};

prototype.setMorphHTML = function (morph, html) {
  morph.setHTML(html);
};

prototype.parseHTML = function (html, contextualElement) {
  var childNodes;

  if (interiorNamespace(contextualElement) === _domHelperBuildHtmlDom.svgNamespace) {
    childNodes = buildSVGDOM(html, this);
  } else {
    var nodes = _domHelperBuildHtmlDom.buildHTMLDOM(html, contextualElement, this);
    if (detectOmittedStartTag(html, contextualElement)) {
      var node = nodes[0];
      while (node && node.nodeType !== 1) {
        node = node.nextSibling;
      }
      childNodes = node.childNodes;
    } else {
      childNodes = nodes;
    }
  }

  // Copy node list to a fragment.
  var fragment = this.document.createDocumentFragment();

  if (childNodes && childNodes.length > 0) {
    var currentNode = childNodes[0];

    // We prepend an <option> to <select> boxes to absorb any browser bugs
    // related to auto-select behavior. Skip past it.
    if (contextualElement.tagName === 'SELECT') {
      currentNode = currentNode.nextSibling;
    }

    while (currentNode) {
      var tempNode = currentNode;
      currentNode = currentNode.nextSibling;

      fragment.appendChild(tempNode);
    }
  }

  return fragment;
};

var nodeURL;
var parsingNode;

function installEnvironmentSpecificMethods(domHelper) {
  var protocol = browserProtocolForURL.call(domHelper, 'foobar:baz');

  // Test to see if our DOM implementation parses
  // and normalizes URLs.
  if (protocol === 'foobar:') {
    // Swap in the method that doesn't do this test now that
    // we know it works.
    domHelper.protocolForURL = browserProtocolForURL;
  } else if (typeof URL === 'object') {
    // URL globally provided, likely from FastBoot's sandbox
    nodeURL = URL;
    domHelper.protocolForURL = nodeProtocolForURL;
  } else if (typeof module === 'object' && typeof module.require === 'function') {
    // Otherwise, we need to fall back to our own URL parsing.
    // Global `require` is shadowed by Ember's loader so we have to use the fully
    // qualified `module.require`.
    nodeURL = module.require('url');
    domHelper.protocolForURL = nodeProtocolForURL;
  } else {
    throw new Error("DOM Helper could not find valid URL parsing mechanism");
  }

  // A SimpleDOM-specific extension that allows us to place HTML directly
  // into the DOM tree, for when the output target is always serialized HTML.
  if (domHelper.document.createRawHTMLSection) {
    domHelper.setMorphHTML = nodeSetMorphHTML;
  }
}

function nodeSetMorphHTML(morph, html) {
  var section = this.document.createRawHTMLSection(html);
  morph.setNode(section);
}

function browserProtocolForURL(url) {
  if (!parsingNode) {
    parsingNode = this.document.createElement('a');
  }

  parsingNode.href = url;
  return parsingNode.protocol;
}

function nodeProtocolForURL(url) {
  var protocol = nodeURL.parse(url).protocol;
  return protocol === null ? ':' : protocol;
}

exports.default = DOMHelper;
module.exports = exports.default;

},{"./dom-helper/build-html-dom":49,"./dom-helper/classes":50,"./dom-helper/prop":51,"./htmlbars-runtime/morph":62,"./morph-attr":96}],49:[function(require,module,exports){
exports.__esModule = true;
/* global XMLSerializer:false */
var svgHTMLIntegrationPoints = { foreignObject: 1, desc: 1, title: 1 };
exports.svgHTMLIntegrationPoints = svgHTMLIntegrationPoints;
var svgNamespace = 'http://www.w3.org/2000/svg';

exports.svgNamespace = svgNamespace;
var doc = typeof document === 'undefined' ? false : document;

// Safari does not like using innerHTML on SVG HTML integration
// points (desc/title/foreignObject).
var needsIntegrationPointFix = doc && (function (document) {
  if (document.createElementNS === undefined) {
    return;
  }
  // In FF title will not accept innerHTML.
  var testEl = document.createElementNS(svgNamespace, 'title');
  testEl.innerHTML = "<div></div>";
  return testEl.childNodes.length === 0 || testEl.childNodes[0].nodeType !== 1;
})(doc);

// Internet Explorer prior to 9 does not allow setting innerHTML if the first element
// is a "zero-scope" element. This problem can be worked around by making
// the first node an invisible text node. We, like Modernizr, use &shy;
var needsShy = doc && (function (document) {
  var testEl = document.createElement('div');
  testEl.innerHTML = "<div></div>";
  testEl.firstChild.innerHTML = "<script><\/script>";
  return testEl.firstChild.innerHTML === '';
})(doc);

// IE 8 (and likely earlier) likes to move whitespace preceeding
// a script tag to appear after it. This means that we can
// accidentally remove whitespace when updating a morph.
var movesWhitespace = doc && (function (document) {
  var testEl = document.createElement('div');
  testEl.innerHTML = "Test: <script type='text/x-placeholder'><\/script>Value";
  return testEl.childNodes[0].nodeValue === 'Test:' && testEl.childNodes[2].nodeValue === ' Value';
})(doc);

var tagNamesRequiringInnerHTMLFix = doc && (function (document) {
  var tagNamesRequiringInnerHTMLFix;
  // IE 9 and earlier don't allow us to set innerHTML on col, colgroup, frameset,
  // html, style, table, tbody, tfoot, thead, title, tr. Detect this and add
  // them to an initial list of corrected tags.
  //
  // Here we are only dealing with the ones which can have child nodes.
  //
  var tableNeedsInnerHTMLFix;
  var tableInnerHTMLTestElement = document.createElement('table');
  try {
    tableInnerHTMLTestElement.innerHTML = '<tbody></tbody>';
  } catch (e) {} finally {
    tableNeedsInnerHTMLFix = tableInnerHTMLTestElement.childNodes.length === 0;
  }
  if (tableNeedsInnerHTMLFix) {
    tagNamesRequiringInnerHTMLFix = {
      colgroup: ['table'],
      table: [],
      tbody: ['table'],
      tfoot: ['table'],
      thead: ['table'],
      tr: ['table', 'tbody']
    };
  }

  // IE 8 doesn't allow setting innerHTML on a select tag. Detect this and
  // add it to the list of corrected tags.
  //
  var selectInnerHTMLTestElement = document.createElement('select');
  selectInnerHTMLTestElement.innerHTML = '<option></option>';
  if (!selectInnerHTMLTestElement.childNodes[0]) {
    tagNamesRequiringInnerHTMLFix = tagNamesRequiringInnerHTMLFix || {};
    tagNamesRequiringInnerHTMLFix.select = [];
  }
  return tagNamesRequiringInnerHTMLFix;
})(doc);

function scriptSafeInnerHTML(element, html) {
  // without a leading text node, IE will drop a leading script tag.
  html = '&shy;' + html;

  element.innerHTML = html;

  var nodes = element.childNodes;

  // Look for &shy; to remove it.
  var shyElement = nodes[0];
  while (shyElement.nodeType === 1 && !shyElement.nodeName) {
    shyElement = shyElement.firstChild;
  }
  // At this point it's the actual unicode character.
  if (shyElement.nodeType === 3 && shyElement.nodeValue.charAt(0) === "\u00AD") {
    var newValue = shyElement.nodeValue.slice(1);
    if (newValue.length) {
      shyElement.nodeValue = shyElement.nodeValue.slice(1);
    } else {
      shyElement.parentNode.removeChild(shyElement);
    }
  }

  return nodes;
}

function buildDOMWithFix(html, contextualElement) {
  var tagName = contextualElement.tagName;

  // Firefox versions < 11 do not have support for element.outerHTML.
  var outerHTML = contextualElement.outerHTML || new XMLSerializer().serializeToString(contextualElement);
  if (!outerHTML) {
    throw "Can't set innerHTML on " + tagName + " in this browser";
  }

  html = fixSelect(html, contextualElement);

  var wrappingTags = tagNamesRequiringInnerHTMLFix[tagName.toLowerCase()];

  var startTag = outerHTML.match(new RegExp("<" + tagName + "([^>]*)>", 'i'))[0];
  var endTag = '</' + tagName + '>';

  var wrappedHTML = [startTag, html, endTag];

  var i = wrappingTags.length;
  var wrappedDepth = 1 + i;
  while (i--) {
    wrappedHTML.unshift('<' + wrappingTags[i] + '>');
    wrappedHTML.push('</' + wrappingTags[i] + '>');
  }

  var wrapper = document.createElement('div');
  scriptSafeInnerHTML(wrapper, wrappedHTML.join(''));
  var element = wrapper;
  while (wrappedDepth--) {
    element = element.firstChild;
    while (element && element.nodeType !== 1) {
      element = element.nextSibling;
    }
  }
  while (element && element.tagName !== tagName) {
    element = element.nextSibling;
  }
  return element ? element.childNodes : [];
}

var buildDOM;
if (needsShy) {
  buildDOM = function buildDOM(html, contextualElement, dom) {
    html = fixSelect(html, contextualElement);

    contextualElement = dom.cloneNode(contextualElement, false);
    scriptSafeInnerHTML(contextualElement, html);
    return contextualElement.childNodes;
  };
} else {
  buildDOM = function buildDOM(html, contextualElement, dom) {
    html = fixSelect(html, contextualElement);

    contextualElement = dom.cloneNode(contextualElement, false);
    contextualElement.innerHTML = html;
    return contextualElement.childNodes;
  };
}

function fixSelect(html, contextualElement) {
  if (contextualElement.tagName === 'SELECT') {
    html = "<option></option>" + html;
  }

  return html;
}

var buildIESafeDOM;
if (tagNamesRequiringInnerHTMLFix || movesWhitespace) {
  buildIESafeDOM = function buildIESafeDOM(html, contextualElement, dom) {
    // Make a list of the leading text on script nodes. Include
    // script tags without any whitespace for easier processing later.
    var spacesBefore = [];
    var spacesAfter = [];
    if (typeof html === 'string') {
      html = html.replace(/(\s*)(<script)/g, function (match, spaces, tag) {
        spacesBefore.push(spaces);
        return tag;
      });

      html = html.replace(/(<\/script>)(\s*)/g, function (match, tag, spaces) {
        spacesAfter.push(spaces);
        return tag;
      });
    }

    // Fetch nodes
    var nodes;
    if (tagNamesRequiringInnerHTMLFix[contextualElement.tagName.toLowerCase()]) {
      // buildDOMWithFix uses string wrappers for problematic innerHTML.
      nodes = buildDOMWithFix(html, contextualElement);
    } else {
      nodes = buildDOM(html, contextualElement, dom);
    }

    // Build a list of script tags, the nodes themselves will be
    // mutated as we add test nodes.
    var i, j, node, nodeScriptNodes;
    var scriptNodes = [];
    for (i = 0; i < nodes.length; i++) {
      node = nodes[i];
      if (node.nodeType !== 1) {
        continue;
      }
      if (node.tagName === 'SCRIPT') {
        scriptNodes.push(node);
      } else {
        nodeScriptNodes = node.getElementsByTagName('script');
        for (j = 0; j < nodeScriptNodes.length; j++) {
          scriptNodes.push(nodeScriptNodes[j]);
        }
      }
    }

    // Walk the script tags and put back their leading text nodes.
    var scriptNode, textNode, spaceBefore, spaceAfter;
    for (i = 0; i < scriptNodes.length; i++) {
      scriptNode = scriptNodes[i];
      spaceBefore = spacesBefore[i];
      if (spaceBefore && spaceBefore.length > 0) {
        textNode = dom.document.createTextNode(spaceBefore);
        scriptNode.parentNode.insertBefore(textNode, scriptNode);
      }

      spaceAfter = spacesAfter[i];
      if (spaceAfter && spaceAfter.length > 0) {
        textNode = dom.document.createTextNode(spaceAfter);
        scriptNode.parentNode.insertBefore(textNode, scriptNode.nextSibling);
      }
    }

    return nodes;
  };
} else {
  buildIESafeDOM = buildDOM;
}

var buildHTMLDOM;
if (needsIntegrationPointFix) {
  exports.buildHTMLDOM = buildHTMLDOM = function buildHTMLDOM(html, contextualElement, dom) {
    if (svgHTMLIntegrationPoints[contextualElement.tagName]) {
      return buildIESafeDOM(html, document.createElement('div'), dom);
    } else {
      return buildIESafeDOM(html, contextualElement, dom);
    }
  };
} else {
  exports.buildHTMLDOM = buildHTMLDOM = buildIESafeDOM;
}

exports.buildHTMLDOM = buildHTMLDOM;

},{}],50:[function(require,module,exports){
exports.__esModule = true;
var doc = typeof document === 'undefined' ? false : document;

// PhantomJS has a broken classList. See https://github.com/ariya/phantomjs/issues/12782
var canClassList = doc && (function () {
  var d = document.createElement('div');
  if (!d.classList) {
    return false;
  }
  d.classList.add('boo');
  d.classList.add('boo', 'baz');
  return d.className === 'boo baz';
})();

function buildClassList(element) {
  var classString = element.getAttribute('class') || '';
  return classString !== '' && classString !== ' ' ? classString.split(' ') : [];
}

function intersect(containingArray, valuesArray) {
  var containingIndex = 0;
  var containingLength = containingArray.length;
  var valuesIndex = 0;
  var valuesLength = valuesArray.length;

  var intersection = new Array(valuesLength);

  // TODO: rewrite this loop in an optimal manner
  for (; containingIndex < containingLength; containingIndex++) {
    valuesIndex = 0;
    for (; valuesIndex < valuesLength; valuesIndex++) {
      if (valuesArray[valuesIndex] === containingArray[containingIndex]) {
        intersection[valuesIndex] = containingIndex;
        break;
      }
    }
  }

  return intersection;
}

function addClassesViaAttribute(element, classNames) {
  var existingClasses = buildClassList(element);

  var indexes = intersect(existingClasses, classNames);
  var didChange = false;

  for (var i = 0, l = classNames.length; i < l; i++) {
    if (indexes[i] === undefined) {
      didChange = true;
      existingClasses.push(classNames[i]);
    }
  }

  if (didChange) {
    element.setAttribute('class', existingClasses.length > 0 ? existingClasses.join(' ') : '');
  }
}

function removeClassesViaAttribute(element, classNames) {
  var existingClasses = buildClassList(element);

  var indexes = intersect(classNames, existingClasses);
  var didChange = false;
  var newClasses = [];

  for (var i = 0, l = existingClasses.length; i < l; i++) {
    if (indexes[i] === undefined) {
      newClasses.push(existingClasses[i]);
    } else {
      didChange = true;
    }
  }

  if (didChange) {
    element.setAttribute('class', newClasses.length > 0 ? newClasses.join(' ') : '');
  }
}

var addClasses, removeClasses;
if (canClassList) {
  exports.addClasses = addClasses = function addClasses(element, classNames) {
    if (element.classList) {
      if (classNames.length === 1) {
        element.classList.add(classNames[0]);
      } else if (classNames.length === 2) {
        element.classList.add(classNames[0], classNames[1]);
      } else {
        element.classList.add.apply(element.classList, classNames);
      }
    } else {
      addClassesViaAttribute(element, classNames);
    }
  };
  exports.removeClasses = removeClasses = function removeClasses(element, classNames) {
    if (element.classList) {
      if (classNames.length === 1) {
        element.classList.remove(classNames[0]);
      } else if (classNames.length === 2) {
        element.classList.remove(classNames[0], classNames[1]);
      } else {
        element.classList.remove.apply(element.classList, classNames);
      }
    } else {
      removeClassesViaAttribute(element, classNames);
    }
  };
} else {
  exports.addClasses = addClasses = addClassesViaAttribute;
  exports.removeClasses = removeClasses = removeClassesViaAttribute;
}

exports.addClasses = addClasses;
exports.removeClasses = removeClasses;

},{}],51:[function(require,module,exports){
exports.__esModule = true;
exports.isAttrRemovalValue = isAttrRemovalValue;
exports.normalizeProperty = normalizeProperty;

function isAttrRemovalValue(value) {
  return value === null || value === undefined;
}

/*
 *
 * @method normalizeProperty
 * @param element {HTMLElement}
 * @param slotName {String}
 * @returns {Object} { name, type }
 */

function normalizeProperty(element, slotName) {
  var type, normalized;

  if (slotName in element) {
    normalized = slotName;
    type = 'prop';
  } else {
    var lower = slotName.toLowerCase();
    if (lower in element) {
      type = 'prop';
      normalized = lower;
    } else {
      type = 'attr';
      normalized = slotName;
    }
  }

  if (type === 'prop' && (normalized.toLowerCase() === 'style' || preferAttr(element.tagName, normalized))) {
    type = 'attr';
  }

  return { normalized: normalized, type: type };
}

// properties that MUST be set as attributes, due to:
// * browser bug
// * strange spec outlier
var ATTR_OVERRIDES = {

  // phantomjs < 2.0 lets you set it as a prop but won't reflect it
  // back to the attribute. button.getAttribute('type') === null
  BUTTON: { type: true, form: true },

  INPUT: {
    // TODO: remove when IE8 is droped
    // Some versions of IE (IE8) throw an exception when setting
    // `input.list = 'somestring'`:
    // https://github.com/emberjs/ember.js/issues/10908
    // https://github.com/emberjs/ember.js/issues/11364
    list: true,
    // Some version of IE (like IE9) actually throw an exception
    // if you set input.type = 'something-unknown'
    type: true,
    form: true,
    // Chrome 46.0.2464.0: 'autocorrect' in document.createElement('input') === false
    // Safari 8.0.7: 'autocorrect' in document.createElement('input') === false
    // Mobile Safari (iOS 8.4 simulator): 'autocorrect' in document.createElement('input') === true
    autocorrect: true
  },

  // element.form is actually a legitimate readOnly property, that is to be
  // mutated, but must be mutated by setAttribute...
  SELECT: { form: true },
  OPTION: { form: true },
  TEXTAREA: { form: true },
  LABEL: { form: true },
  FIELDSET: { form: true },
  LEGEND: { form: true },
  OBJECT: { form: true }
};

function preferAttr(tagName, propName) {
  var tag = ATTR_OVERRIDES[tagName.toUpperCase()];
  return tag && tag[propName.toLowerCase()] || false;
}

},{}],52:[function(require,module,exports){
exports.__esModule = true;
exports.compileSpec = compileSpec;
exports.template = template;
exports.compile = compile;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*jshint evil:true*/

var _htmlbarsSyntaxParser = require("../htmlbars-syntax/parser");

var _templateCompiler = require("./template-compiler");

var _templateCompiler2 = _interopRequireDefault(_templateCompiler);

var _htmlbarsRuntimeHooks = require("../htmlbars-runtime/hooks");

var _htmlbarsRuntimeRender = require("../htmlbars-runtime/render");

var _htmlbarsRuntimeRender2 = _interopRequireDefault(_htmlbarsRuntimeRender);

/*
 * Compile a string into a template spec string. The template spec is a string
 * representation of a template. Usually, you would use compileSpec for
 * pre-compilation of a template on the server.
 *
 * Example usage:
 *
 *     var templateSpec = compileSpec("Howdy {{name}}");
 *     // This next step is basically what plain compile does
 *     var template = new Function("return " + templateSpec)();
 *
 * @method compileSpec
 * @param {String} string An HTMLBars template string
 * @return {TemplateSpec} A template spec string
 */

function compileSpec(string, options) {
  var ast = _htmlbarsSyntaxParser.preprocess(string, options);
  var compiler = new _templateCompiler2.default(options);
  var program = compiler.compile(ast);
  return program;
}

/*
 * @method template
 * @param {TemplateSpec} templateSpec A precompiled template
 * @return {Template} A template spec string
 */

function template(templateSpec) {
  return new Function("return " + templateSpec)();
}

/*
 * Compile a string into a template rendering function
 *
 * Example usage:
 *
 *     // Template is the hydration portion of the compiled template
 *     var template = compile("Howdy {{name}}");
 *
 *     // Template accepts three arguments:
 *     //
 *     //   1. A context object
 *     //   2. An env object
 *     //   3. A contextualElement (optional, document.body is the default)
 *     //
 *     // The env object *must* have at least these two properties:
 *     //
 *     //   1. `hooks` - Basic hooks for rendering a template
 *     //   2. `dom` - An instance of DOMHelper
 *     //
 *     import {hooks} from 'htmlbars-runtime';
 *     import {DOMHelper} from 'morph';
 *     var context = {name: 'whatever'},
 *         env = {hooks: hooks, dom: new DOMHelper()},
 *         contextualElement = document.body;
 *     var domFragment = template(context, env, contextualElement);
 *
 * @method compile
 * @param {String} string An HTMLBars template string
 * @param {Object} options A set of options to provide to the compiler
 * @return {Template} A function for rendering the template
 */

function compile(string, options) {
  return _htmlbarsRuntimeHooks.wrap(template(compileSpec(string, options)), _htmlbarsRuntimeRender2.default);
}

},{"../htmlbars-runtime/hooks":61,"../htmlbars-runtime/render":64,"../htmlbars-syntax/parser":76,"./template-compiler":57}],53:[function(require,module,exports){
exports.__esModule = true;

var _utils = require("./utils");

var _htmlbarsUtilQuoting = require("../htmlbars-util/quoting");

var svgNamespace = "http://www.w3.org/2000/svg",

// http://www.w3.org/html/wg/drafts/html/master/syntax.html#html-integration-point
svgHTMLIntegrationPoints = { 'foreignObject': true, 'desc': true, 'title': true };

function FragmentJavaScriptCompiler() {
  this.source = [];
  this.depth = -1;
}

exports.default = FragmentJavaScriptCompiler;

FragmentJavaScriptCompiler.prototype.compile = function (opcodes, options) {
  this.source.length = 0;
  this.depth = -1;
  this.indent = options && options.indent || "";
  this.namespaceFrameStack = [{ namespace: null, depth: null }];
  this.domNamespace = null;

  this.source.push('function buildFragment(dom) {\n');
  _utils.processOpcodes(this, opcodes);
  this.source.push(this.indent + '}');

  return this.source.join('');
};

FragmentJavaScriptCompiler.prototype.createFragment = function () {
  var el = 'el' + ++this.depth;
  this.source.push(this.indent + '  var ' + el + ' = dom.createDocumentFragment();\n');
};

FragmentJavaScriptCompiler.prototype.createElement = function (tagName) {
  var el = 'el' + ++this.depth;
  if (tagName === 'svg') {
    this.pushNamespaceFrame({ namespace: svgNamespace, depth: this.depth });
  }
  this.ensureNamespace();
  this.source.push(this.indent + '  var ' + el + ' = dom.createElement(' + _htmlbarsUtilQuoting.string(tagName) + ');\n');
  if (svgHTMLIntegrationPoints[tagName]) {
    this.pushNamespaceFrame({ namespace: null, depth: this.depth });
  }
};

FragmentJavaScriptCompiler.prototype.createText = function (str) {
  var el = 'el' + ++this.depth;
  this.source.push(this.indent + '  var ' + el + ' = dom.createTextNode(' + _htmlbarsUtilQuoting.string(str) + ');\n');
};

FragmentJavaScriptCompiler.prototype.createComment = function (str) {
  var el = 'el' + ++this.depth;
  this.source.push(this.indent + '  var ' + el + ' = dom.createComment(' + _htmlbarsUtilQuoting.string(str) + ');\n');
};

FragmentJavaScriptCompiler.prototype.returnNode = function () {
  var el = 'el' + this.depth;
  this.source.push(this.indent + '  return ' + el + ';\n');
};

FragmentJavaScriptCompiler.prototype.setAttribute = function (name, value, namespace) {
  var el = 'el' + this.depth;
  if (namespace) {
    this.source.push(this.indent + '  dom.setAttributeNS(' + el + ',' + _htmlbarsUtilQuoting.string(namespace) + ',' + _htmlbarsUtilQuoting.string(name) + ',' + _htmlbarsUtilQuoting.string(value) + ');\n');
  } else {
    this.source.push(this.indent + '  dom.setAttribute(' + el + ',' + _htmlbarsUtilQuoting.string(name) + ',' + _htmlbarsUtilQuoting.string(value) + ');\n');
  }
};

FragmentJavaScriptCompiler.prototype.appendChild = function () {
  if (this.depth === this.getCurrentNamespaceFrame().depth) {
    this.popNamespaceFrame();
  }
  var child = 'el' + this.depth--;
  var el = 'el' + this.depth;
  this.source.push(this.indent + '  dom.appendChild(' + el + ', ' + child + ');\n');
};

FragmentJavaScriptCompiler.prototype.getCurrentNamespaceFrame = function () {
  return this.namespaceFrameStack[this.namespaceFrameStack.length - 1];
};

FragmentJavaScriptCompiler.prototype.pushNamespaceFrame = function (frame) {
  this.namespaceFrameStack.push(frame);
};

FragmentJavaScriptCompiler.prototype.popNamespaceFrame = function () {
  return this.namespaceFrameStack.pop();
};

FragmentJavaScriptCompiler.prototype.ensureNamespace = function () {
  var correctNamespace = this.getCurrentNamespaceFrame().namespace;
  if (this.domNamespace !== correctNamespace) {
    this.source.push(this.indent + '  dom.setNamespace(' + (correctNamespace ? _htmlbarsUtilQuoting.string(correctNamespace) : 'null') + ');\n');
    this.domNamespace = correctNamespace;
  }
};
module.exports = exports.default;

},{"../htmlbars-util/quoting":91,"./utils":59}],54:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _templateVisitor = require("./template-visitor");

var _templateVisitor2 = _interopRequireDefault(_templateVisitor);

var _utils = require("./utils");

var _htmlbarsUtil = require("../htmlbars-util");

var _htmlbarsUtilArrayUtils = require("../htmlbars-util/array-utils");

function FragmentOpcodeCompiler() {
  this.opcodes = [];
}

exports.default = FragmentOpcodeCompiler;

FragmentOpcodeCompiler.prototype.compile = function (ast) {
  var templateVisitor = new _templateVisitor2.default();
  templateVisitor.visit(ast);

  _utils.processOpcodes(this, templateVisitor.actions);

  return this.opcodes;
};

FragmentOpcodeCompiler.prototype.opcode = function (type, params) {
  this.opcodes.push([type, params]);
};

FragmentOpcodeCompiler.prototype.text = function (text) {
  this.opcode('createText', [text.chars]);
  this.opcode('appendChild');
};

FragmentOpcodeCompiler.prototype.comment = function (comment) {
  this.opcode('createComment', [comment.value]);
  this.opcode('appendChild');
};

FragmentOpcodeCompiler.prototype.openElement = function (element) {
  this.opcode('createElement', [element.tag]);
  _htmlbarsUtilArrayUtils.forEach(element.attributes, this.attribute, this);
};

FragmentOpcodeCompiler.prototype.closeElement = function () {
  this.opcode('appendChild');
};

FragmentOpcodeCompiler.prototype.startProgram = function () {
  this.opcodes.length = 0;
  this.opcode('createFragment');
};

FragmentOpcodeCompiler.prototype.endProgram = function () {
  this.opcode('returnNode');
};

FragmentOpcodeCompiler.prototype.mustache = function () {
  this.pushMorphPlaceholderNode();
};

FragmentOpcodeCompiler.prototype.component = function () {
  this.pushMorphPlaceholderNode();
};

FragmentOpcodeCompiler.prototype.block = function () {
  this.pushMorphPlaceholderNode();
};

FragmentOpcodeCompiler.prototype.pushMorphPlaceholderNode = function () {
  this.opcode('createComment', [""]);
  this.opcode('appendChild');
};

FragmentOpcodeCompiler.prototype.attribute = function (attr) {
  if (attr.value.type === 'TextNode') {
    var namespace = _htmlbarsUtil.getAttrNamespace(attr.name);
    this.opcode('setAttribute', [attr.name, attr.value.chars, namespace]);
  }
};

FragmentOpcodeCompiler.prototype.setNamespace = function (namespace) {
  this.opcode('setNamespace', [namespace]);
};
module.exports = exports.default;

},{"../htmlbars-util":84,"../htmlbars-util/array-utils":85,"./template-visitor":58,"./utils":59}],55:[function(require,module,exports){
exports.__esModule = true;

var _utils = require("./utils");

var _htmlbarsUtilQuoting = require("../htmlbars-util/quoting");

function HydrationJavaScriptCompiler() {
  this.stack = [];
  this.source = [];
  this.mustaches = [];
  this.parents = [['fragment']];
  this.parentCount = 0;
  this.morphs = [];
  this.fragmentProcessing = [];
  this.hooks = undefined;
}

exports.default = HydrationJavaScriptCompiler;

var prototype = HydrationJavaScriptCompiler.prototype;

prototype.compile = function (opcodes, options) {
  this.stack.length = 0;
  this.mustaches.length = 0;
  this.source.length = 0;
  this.parents.length = 1;
  this.parents[0] = ['fragment'];
  this.morphs.length = 0;
  this.fragmentProcessing.length = 0;
  this.parentCount = 0;
  this.indent = options && options.indent || "";
  this.hooks = {};
  this.hasOpenBoundary = false;
  this.hasCloseBoundary = false;
  this.statements = [];
  this.expressionStack = [];
  this.locals = [];
  this.hasOpenBoundary = false;
  this.hasCloseBoundary = false;

  _utils.processOpcodes(this, opcodes);

  if (this.hasOpenBoundary) {
    this.source.unshift(this.indent + "  dom.insertBoundary(fragment, 0);\n");
  }

  if (this.hasCloseBoundary) {
    this.source.unshift(this.indent + "  dom.insertBoundary(fragment, null);\n");
  }

  var i, l;

  var indent = this.indent;

  var morphs;

  var result = {
    createMorphsProgram: '',
    hydrateMorphsProgram: '',
    fragmentProcessingProgram: '',
    statements: this.statements,
    locals: this.locals,
    hasMorphs: false
  };

  result.hydrateMorphsProgram = this.source.join('');

  if (this.morphs.length) {
    result.hasMorphs = true;
    morphs = indent + '  var morphs = new Array(' + this.morphs.length + ');\n';

    for (i = 0, l = this.morphs.length; i < l; ++i) {
      var morph = this.morphs[i];
      morphs += indent + '  morphs[' + i + '] = ' + morph + ';\n';
    }
  }

  if (this.fragmentProcessing.length) {
    var processing = "";
    for (i = 0, l = this.fragmentProcessing.length; i < l; ++i) {
      processing += this.indent + '  ' + this.fragmentProcessing[i] + '\n';
    }
    result.fragmentProcessingProgram = processing;
  }

  var createMorphsProgram;
  if (result.hasMorphs) {
    createMorphsProgram = 'function buildRenderNodes(dom, fragment, contextualElement) {\n' + result.fragmentProcessingProgram + morphs;

    if (this.hasOpenBoundary) {
      createMorphsProgram += indent + "  dom.insertBoundary(fragment, 0);\n";
    }

    if (this.hasCloseBoundary) {
      createMorphsProgram += indent + "  dom.insertBoundary(fragment, null);\n";
    }

    createMorphsProgram += indent + '  return morphs;\n' + indent + '}';
  } else {
    createMorphsProgram = 'function buildRenderNodes() { return []; }';
  }

  result.createMorphsProgram = createMorphsProgram;

  return result;
};

prototype.prepareArray = function (length) {
  var values = [];

  for (var i = 0; i < length; i++) {
    values.push(this.expressionStack.pop());
  }

  this.expressionStack.push(values);
};

prototype.prepareObject = function (size) {
  var pairs = [];

  for (var i = 0; i < size; i++) {
    pairs.push(this.expressionStack.pop(), this.expressionStack.pop());
  }

  this.expressionStack.push(pairs);
};

prototype.openBoundary = function () {
  this.hasOpenBoundary = true;
};

prototype.closeBoundary = function () {
  this.hasCloseBoundary = true;
};

prototype.pushLiteral = function (value) {
  this.expressionStack.push(value);
};

prototype.pushGetHook = function (path, meta) {
  this.expressionStack.push(['get', path, meta]);
};

prototype.pushSexprHook = function (meta) {
  this.expressionStack.push(['subexpr', this.expressionStack.pop(), this.expressionStack.pop(), this.expressionStack.pop(), meta]);
};

prototype.pushConcatHook = function () {
  this.expressionStack.push(['concat', this.expressionStack.pop()]);
};

prototype.printSetHook = function (name) {
  this.locals.push(name);
};

prototype.printBlockHook = function (templateId, inverseId, meta) {
  this.statements.push(['block', this.expressionStack.pop(), // path
  this.expressionStack.pop(), // params
  this.expressionStack.pop(), // hash
  templateId, inverseId, meta]);
};

prototype.printInlineHook = function (meta) {
  var path = this.expressionStack.pop();
  var params = this.expressionStack.pop();
  var hash = this.expressionStack.pop();

  this.statements.push(['inline', path, params, hash, meta]);
};

prototype.printContentHook = function (meta) {
  this.statements.push(['content', this.expressionStack.pop(), meta]);
};

prototype.printComponentHook = function (templateId) {
  this.statements.push(['component', this.expressionStack.pop(), // path
  this.expressionStack.pop(), // attrs
  templateId]);
};

prototype.printAttributeHook = function () {
  this.statements.push(['attribute', this.expressionStack.pop(), // name
  this.expressionStack.pop() // value;
  ]);
};

prototype.printElementHook = function (meta) {
  this.statements.push(['element', this.expressionStack.pop(), // path
  this.expressionStack.pop(), // params
  this.expressionStack.pop(), // hash
  meta]);
};

prototype.createMorph = function (morphNum, parentPath, startIndex, endIndex, escaped) {
  var isRoot = parentPath.length === 0;
  var parent = this.getParent();

  var morphMethod = escaped ? 'createMorphAt' : 'createUnsafeMorphAt';
  var morph = "dom." + morphMethod + "(" + parent + "," + (startIndex === null ? "-1" : startIndex) + "," + (endIndex === null ? "-1" : endIndex) + (isRoot ? ",contextualElement)" : ")");

  this.morphs[morphNum] = morph;
};

prototype.createAttrMorph = function (attrMorphNum, elementNum, name, escaped, namespace) {
  var morphMethod = escaped ? 'createAttrMorph' : 'createUnsafeAttrMorph';
  var morph = "dom." + morphMethod + "(element" + elementNum + ", '" + name + (namespace ? "', '" + namespace : '') + "')";
  this.morphs[attrMorphNum] = morph;
};

prototype.createElementMorph = function (morphNum, elementNum) {
  var morphMethod = 'createElementMorph';
  var morph = "dom." + morphMethod + "(element" + elementNum + ")";
  this.morphs[morphNum] = morph;
};

prototype.repairClonedNode = function (blankChildTextNodes, isElementChecked) {
  var parent = this.getParent(),
      processing = 'if (this.cachedFragment) { dom.repairClonedNode(' + parent + ',' + _htmlbarsUtilQuoting.array(blankChildTextNodes) + (isElementChecked ? ',true' : '') + '); }';
  this.fragmentProcessing.push(processing);
};

prototype.shareElement = function (elementNum) {
  var elementNodesName = "element" + elementNum;
  this.fragmentProcessing.push('var ' + elementNodesName + ' = ' + this.getParent() + ';');
  this.parents[this.parents.length - 1] = [elementNodesName];
};

prototype.consumeParent = function (i) {
  var newParent = this.lastParent().slice();
  newParent.push(i);

  this.parents.push(newParent);
};

prototype.popParent = function () {
  this.parents.pop();
};

prototype.getParent = function () {
  var last = this.lastParent().slice();
  var frag = last.shift();

  if (!last.length) {
    return frag;
  }

  return 'dom.childAt(' + frag + ', [' + last.join(', ') + '])';
};

prototype.lastParent = function () {
  return this.parents[this.parents.length - 1];
};
module.exports = exports.default;

},{"../htmlbars-util/quoting":91,"./utils":59}],56:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _templateVisitor = require("./template-visitor");

var _templateVisitor2 = _interopRequireDefault(_templateVisitor);

var _utils = require("./utils");

var _htmlbarsUtil = require("../htmlbars-util");

var _htmlbarsUtilArrayUtils = require("../htmlbars-util/array-utils");

var _htmlbarsSyntaxUtils = require("../htmlbars-syntax/utils");

function detectIsElementChecked(element) {
  for (var i = 0, len = element.attributes.length; i < len; i++) {
    if (element.attributes[i].name === 'checked') {
      return true;
    }
  }
  return false;
}

function HydrationOpcodeCompiler() {
  this.opcodes = [];
  this.paths = [];
  this.templateId = 0;
  this.currentDOMChildIndex = 0;
  this.morphs = [];
  this.morphNum = 0;
  this.element = null;
  this.elementNum = -1;
}

exports.default = HydrationOpcodeCompiler;

HydrationOpcodeCompiler.prototype.compile = function (ast) {
  var templateVisitor = new _templateVisitor2.default();
  templateVisitor.visit(ast);

  _utils.processOpcodes(this, templateVisitor.actions);

  return this.opcodes;
};

HydrationOpcodeCompiler.prototype.accept = function (node) {
  this[node.type](node);
};

HydrationOpcodeCompiler.prototype.opcode = function (type) {
  var params = [].slice.call(arguments, 1);
  this.opcodes.push([type, params]);
};

HydrationOpcodeCompiler.prototype.startProgram = function (program, c, blankChildTextNodes) {
  this.opcodes.length = 0;
  this.paths.length = 0;
  this.morphs.length = 0;
  this.templateId = 0;
  this.currentDOMChildIndex = -1;
  this.morphNum = 0;

  var blockParams = program.blockParams || [];

  for (var i = 0; i < blockParams.length; i++) {
    this.opcode('printSetHook', blockParams[i], i);
  }

  if (blankChildTextNodes.length > 0) {
    this.opcode('repairClonedNode', blankChildTextNodes);
  }
};

HydrationOpcodeCompiler.prototype.insertBoundary = function (first) {
  this.opcode(first ? 'openBoundary' : 'closeBoundary');
};

HydrationOpcodeCompiler.prototype.endProgram = function () {
  distributeMorphs(this.morphs, this.opcodes);
};

HydrationOpcodeCompiler.prototype.text = function () {
  ++this.currentDOMChildIndex;
};

HydrationOpcodeCompiler.prototype.comment = function () {
  ++this.currentDOMChildIndex;
};

HydrationOpcodeCompiler.prototype.openElement = function (element, pos, len, mustacheCount, blankChildTextNodes) {
  distributeMorphs(this.morphs, this.opcodes);
  ++this.currentDOMChildIndex;

  this.element = this.currentDOMChildIndex;

  this.opcode('consumeParent', this.currentDOMChildIndex);

  // If our parent reference will be used more than once, cache its reference.
  if (mustacheCount > 1) {
    shareElement(this);
  }

  var isElementChecked = detectIsElementChecked(element);
  if (blankChildTextNodes.length > 0 || isElementChecked) {
    this.opcode('repairClonedNode', blankChildTextNodes, isElementChecked);
  }

  this.paths.push(this.currentDOMChildIndex);
  this.currentDOMChildIndex = -1;

  _htmlbarsUtilArrayUtils.forEach(element.attributes, this.attribute, this);
  _htmlbarsUtilArrayUtils.forEach(element.modifiers, this.elementModifier, this);
};

HydrationOpcodeCompiler.prototype.closeElement = function () {
  distributeMorphs(this.morphs, this.opcodes);
  this.opcode('popParent');
  this.currentDOMChildIndex = this.paths.pop();
};

HydrationOpcodeCompiler.prototype.mustache = function (mustache, childIndex, childCount) {
  this.pushMorphPlaceholderNode(childIndex, childCount);

  var opcode;

  if (_htmlbarsSyntaxUtils.isHelper(mustache)) {
    prepareHash(this, mustache.hash);
    prepareParams(this, mustache.params);
    preparePath(this, mustache.path);
    opcode = 'printInlineHook';
  } else {
    preparePath(this, mustache.path);
    opcode = 'printContentHook';
  }

  var morphNum = this.morphNum++;
  var start = this.currentDOMChildIndex;
  var end = this.currentDOMChildIndex;
  this.morphs.push([morphNum, this.paths.slice(), start, end, mustache.escaped]);

  this.opcode(opcode, meta(mustache));
};

function meta(node) {
  var loc = node.loc;
  if (!loc) {
    return [];
  }

  var source = loc.source;
  var start = loc.start;
  var end = loc.end;

  return ['loc', [source || null, [start.line, start.column], [end.line, end.column]]];
}

HydrationOpcodeCompiler.prototype.block = function (block, childIndex, childCount) {
  this.pushMorphPlaceholderNode(childIndex, childCount);

  prepareHash(this, block.hash);
  prepareParams(this, block.params);
  preparePath(this, block.path);

  var morphNum = this.morphNum++;
  var start = this.currentDOMChildIndex;
  var end = this.currentDOMChildIndex;
  this.morphs.push([morphNum, this.paths.slice(), start, end, true]);

  var templateId = this.templateId++;
  var inverseId = block.inverse === null ? null : this.templateId++;

  this.opcode('printBlockHook', templateId, inverseId, meta(block));
};

HydrationOpcodeCompiler.prototype.component = function (component, childIndex, childCount) {
  this.pushMorphPlaceholderNode(childIndex, childCount, component.isStatic);

  var program = component.program || {};
  var blockParams = program.blockParams || [];

  var attrs = component.attributes;
  for (var i = attrs.length - 1; i >= 0; i--) {
    var name = attrs[i].name;
    var value = attrs[i].value;

    // TODO: Introduce context specific AST nodes to avoid switching here.
    if (value.type === 'TextNode') {
      this.opcode('pushLiteral', value.chars);
    } else if (value.type === 'MustacheStatement') {
      this.accept(_htmlbarsSyntaxUtils.unwrapMustache(value));
    } else if (value.type === 'ConcatStatement') {
      prepareParams(this, value.parts);
      this.opcode('pushConcatHook', this.morphNum);
    }

    this.opcode('pushLiteral', name);
  }

  var morphNum = this.morphNum++;
  var start = this.currentDOMChildIndex;
  var end = this.currentDOMChildIndex;
  this.morphs.push([morphNum, this.paths.slice(), start, end, true]);

  this.opcode('prepareObject', attrs.length);
  this.opcode('pushLiteral', component.tag);
  this.opcode('printComponentHook', this.templateId++, blockParams.length, meta(component));
};

HydrationOpcodeCompiler.prototype.attribute = function (attr) {
  var value = attr.value;
  var escaped = true;
  var namespace = _htmlbarsUtil.getAttrNamespace(attr.name);

  // TODO: Introduce context specific AST nodes to avoid switching here.
  if (value.type === 'TextNode') {
    return;
  } else if (value.type === 'MustacheStatement') {
    escaped = value.escaped;
    this.accept(_htmlbarsSyntaxUtils.unwrapMustache(value));
  } else if (value.type === 'ConcatStatement') {
    prepareParams(this, value.parts);
    this.opcode('pushConcatHook', this.morphNum);
  }

  this.opcode('pushLiteral', attr.name);

  var attrMorphNum = this.morphNum++;

  if (this.element !== null) {
    shareElement(this);
  }

  this.opcode('createAttrMorph', attrMorphNum, this.elementNum, attr.name, escaped, namespace);
  this.opcode('printAttributeHook');
};

HydrationOpcodeCompiler.prototype.elementModifier = function (modifier) {
  prepareHash(this, modifier.hash);
  prepareParams(this, modifier.params);
  preparePath(this, modifier.path);

  // If we have a helper in a node, and this element has not been cached, cache it
  if (this.element !== null) {
    shareElement(this);
  }

  publishElementMorph(this);
  this.opcode('printElementHook', meta(modifier));
};

HydrationOpcodeCompiler.prototype.pushMorphPlaceholderNode = function (childIndex, childCount, skipBoundaryNodes) {
  if (!skipBoundaryNodes) {
    if (this.paths.length === 0) {
      if (childIndex === 0) {
        this.opcode('openBoundary');
      }
      if (childIndex === childCount - 1) {
        this.opcode('closeBoundary');
      }
    }
  }

  this.comment();
};

HydrationOpcodeCompiler.prototype.MustacheStatement = function (mustache) {
  prepareHash(this, mustache.hash);
  prepareParams(this, mustache.params);
  preparePath(this, mustache.path);
  this.opcode('pushSexprHook', meta(mustache));
};

HydrationOpcodeCompiler.prototype.SubExpression = function (sexpr) {
  prepareHash(this, sexpr.hash);
  prepareParams(this, sexpr.params);
  preparePath(this, sexpr.path);
  this.opcode('pushSexprHook', meta(sexpr));
};

HydrationOpcodeCompiler.prototype.PathExpression = function (path) {
  this.opcode('pushGetHook', path.original, meta(path));
};

HydrationOpcodeCompiler.prototype.StringLiteral = function (node) {
  this.opcode('pushLiteral', node.value);
};

HydrationOpcodeCompiler.prototype.BooleanLiteral = function (node) {
  this.opcode('pushLiteral', node.value);
};

HydrationOpcodeCompiler.prototype.NumberLiteral = function (node) {
  this.opcode('pushLiteral', node.value);
};

HydrationOpcodeCompiler.prototype.UndefinedLiteral = function (node) {
  this.opcode('pushLiteral', node.value);
};

HydrationOpcodeCompiler.prototype.NullLiteral = function (node) {
  this.opcode('pushLiteral', node.value);
};

function preparePath(compiler, path) {
  compiler.opcode('pushLiteral', path.original);
}

function prepareParams(compiler, params) {
  for (var i = params.length - 1; i >= 0; i--) {
    var param = params[i];
    compiler[param.type](param);
  }

  compiler.opcode('prepareArray', params.length);
}

function prepareHash(compiler, hash) {
  var pairs = hash.pairs;

  for (var i = pairs.length - 1; i >= 0; i--) {
    var key = pairs[i].key;
    var value = pairs[i].value;

    compiler[value.type](value);
    compiler.opcode('pushLiteral', key);
  }

  compiler.opcode('prepareObject', pairs.length);
}

function shareElement(compiler) {
  compiler.opcode('shareElement', ++compiler.elementNum);
  compiler.element = null; // Set element to null so we don't cache it twice
}

function publishElementMorph(compiler) {
  var morphNum = compiler.morphNum++;
  compiler.opcode('createElementMorph', morphNum, compiler.elementNum);
}

function distributeMorphs(morphs, opcodes) {
  if (morphs.length === 0) {
    return;
  }

  // Splice morphs after the most recent shareParent/consumeParent.
  var o;
  for (o = opcodes.length - 1; o >= 0; --o) {
    var opcode = opcodes[o][0];
    if (opcode === 'shareElement' || opcode === 'consumeParent' || opcode === 'popParent') {
      break;
    }
  }

  var spliceArgs = [o + 1, 0];
  for (var i = 0; i < morphs.length; ++i) {
    spliceArgs.push(['createMorph', morphs[i].slice()]);
  }
  opcodes.splice.apply(opcodes, spliceArgs);
  morphs.length = 0;
}
module.exports = exports.default;

},{"../htmlbars-syntax/utils":83,"../htmlbars-util":84,"../htmlbars-util/array-utils":85,"./template-visitor":58,"./utils":59}],57:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _fragmentOpcodeCompiler = require('./fragment-opcode-compiler');

var _fragmentOpcodeCompiler2 = _interopRequireDefault(_fragmentOpcodeCompiler);

var _fragmentJavascriptCompiler = require('./fragment-javascript-compiler');

var _fragmentJavascriptCompiler2 = _interopRequireDefault(_fragmentJavascriptCompiler);

var _hydrationOpcodeCompiler = require('./hydration-opcode-compiler');

var _hydrationOpcodeCompiler2 = _interopRequireDefault(_hydrationOpcodeCompiler);

var _hydrationJavascriptCompiler = require('./hydration-javascript-compiler');

var _hydrationJavascriptCompiler2 = _interopRequireDefault(_hydrationJavascriptCompiler);

var _templateVisitor = require("./template-visitor");

var _templateVisitor2 = _interopRequireDefault(_templateVisitor);

var _utils = require("./utils");

var _htmlbarsUtilQuoting = require("../htmlbars-util/quoting");

var _htmlbarsUtilArrayUtils = require("../htmlbars-util/array-utils");

function TemplateCompiler(options) {
  this.options = options || {};
  this.consumerBuildMeta = this.options.buildMeta || function () {};
  this.fragmentOpcodeCompiler = new _fragmentOpcodeCompiler2.default();
  this.fragmentCompiler = new _fragmentJavascriptCompiler2.default();
  this.hydrationOpcodeCompiler = new _hydrationOpcodeCompiler2.default();
  this.hydrationCompiler = new _hydrationJavascriptCompiler2.default();
  this.templates = [];
  this.childTemplates = [];
}

exports.default = TemplateCompiler;

TemplateCompiler.prototype.compile = function (ast) {
  var templateVisitor = new _templateVisitor2.default();
  templateVisitor.visit(ast);

  _utils.processOpcodes(this, templateVisitor.actions);

  return this.templates.pop();
};

TemplateCompiler.prototype.startProgram = function (program, childTemplateCount, blankChildTextNodes) {
  this.fragmentOpcodeCompiler.startProgram(program, childTemplateCount, blankChildTextNodes);
  this.hydrationOpcodeCompiler.startProgram(program, childTemplateCount, blankChildTextNodes);

  this.childTemplates.length = 0;
  while (childTemplateCount--) {
    this.childTemplates.push(this.templates.pop());
  }
};

TemplateCompiler.prototype.insertBoundary = function (first) {
  this.hydrationOpcodeCompiler.insertBoundary(first);
};

TemplateCompiler.prototype.getChildTemplateVars = function (indent) {
  var vars = '';
  if (this.childTemplates) {
    for (var i = 0; i < this.childTemplates.length; i++) {
      vars += indent + 'var child' + i + ' = ' + this.childTemplates[i] + ';\n';
    }
  }
  return vars;
};

TemplateCompiler.prototype.getHydrationHooks = function (indent, hooks) {
  var hookVars = [];
  for (var hook in hooks) {
    hookVars.push(hook + ' = hooks.' + hook);
  }

  if (hookVars.length > 0) {
    return indent + 'var hooks = env.hooks, ' + hookVars.join(', ') + ';\n';
  } else {
    return '';
  }
};

TemplateCompiler.prototype.endProgram = function (program, programDepth) {
  this.fragmentOpcodeCompiler.endProgram(program);
  this.hydrationOpcodeCompiler.endProgram(program);

  var indent = _htmlbarsUtilQuoting.repeat("  ", programDepth);
  var options = {
    indent: indent + "    "
  };

  // function build(dom) { return fragment; }
  var fragmentProgram = this.fragmentCompiler.compile(this.fragmentOpcodeCompiler.opcodes, options);

  // function hydrate(fragment) { return mustaches; }
  var hydrationPrograms = this.hydrationCompiler.compile(this.hydrationOpcodeCompiler.opcodes, options);

  var blockParams = program.blockParams || [];

  var templateSignature = 'context, rootNode, env, options';
  if (blockParams.length > 0) {
    templateSignature += ', blockArguments';
  }

  var statements = _htmlbarsUtilArrayUtils.map(hydrationPrograms.statements, function (s) {
    return indent + '      ' + JSON.stringify(s);
  }).join(",\n");

  var locals = JSON.stringify(hydrationPrograms.locals);

  var templates = _htmlbarsUtilArrayUtils.map(this.childTemplates, function (_, index) {
    return 'child' + index;
  }).join(', ');

  var template = '(function() {\n' + this.getChildTemplateVars(indent + '  ') + indent + '  return {\n' + this.buildMeta(indent + '    ', program) + indent + '    isEmpty: ' + (program.body.length ? 'false' : 'true') + ',\n' + indent + '    arity: ' + blockParams.length + ',\n' + indent + '    cachedFragment: null,\n' + indent + '    hasRendered: false,\n' + indent + '    buildFragment: ' + fragmentProgram + ',\n' + indent + '    buildRenderNodes: ' + hydrationPrograms.createMorphsProgram + ',\n' + indent + '    statements: [\n' + statements + '\n' + indent + '    ],\n' + indent + '    locals: ' + locals + ',\n' + indent + '    templates: [' + templates + ']\n' + indent + '  };\n' + indent + '}())';

  this.templates.push(template);
};

TemplateCompiler.prototype.buildMeta = function (indent, program) {
  var meta = this.consumerBuildMeta(program) || {};

  var head = indent + 'meta: ';
  var stringMeta = JSON.stringify(meta, null, 2).replace(/\n/g, '\n' + indent);
  var tail = ',\n';

  return head + stringMeta + tail;
};

TemplateCompiler.prototype.openElement = function (element, i, l, r, c, b) {
  this.fragmentOpcodeCompiler.openElement(element, i, l, r, c, b);
  this.hydrationOpcodeCompiler.openElement(element, i, l, r, c, b);
};

TemplateCompiler.prototype.closeElement = function (element, i, l, r) {
  this.fragmentOpcodeCompiler.closeElement(element, i, l, r);
  this.hydrationOpcodeCompiler.closeElement(element, i, l, r);
};

TemplateCompiler.prototype.component = function (component, i, l, s) {
  this.fragmentOpcodeCompiler.component(component, i, l, s);
  this.hydrationOpcodeCompiler.component(component, i, l, s);
};

TemplateCompiler.prototype.block = function (block, i, l, s) {
  this.fragmentOpcodeCompiler.block(block, i, l, s);
  this.hydrationOpcodeCompiler.block(block, i, l, s);
};

TemplateCompiler.prototype.text = function (string, i, l, r) {
  this.fragmentOpcodeCompiler.text(string, i, l, r);
  this.hydrationOpcodeCompiler.text(string, i, l, r);
};

TemplateCompiler.prototype.comment = function (string, i, l, r) {
  this.fragmentOpcodeCompiler.comment(string, i, l, r);
  this.hydrationOpcodeCompiler.comment(string, i, l, r);
};

TemplateCompiler.prototype.mustache = function (mustache, i, l, s) {
  this.fragmentOpcodeCompiler.mustache(mustache, i, l, s);
  this.hydrationOpcodeCompiler.mustache(mustache, i, l, s);
};

TemplateCompiler.prototype.setNamespace = function (namespace) {
  this.fragmentOpcodeCompiler.setNamespace(namespace);
};
module.exports = exports.default;

},{"../htmlbars-util/array-utils":85,"../htmlbars-util/quoting":91,"./fragment-javascript-compiler":53,"./fragment-opcode-compiler":54,"./hydration-javascript-compiler":55,"./hydration-opcode-compiler":56,"./template-visitor":58,"./utils":59}],58:[function(require,module,exports){
exports.__esModule = true;
var push = Array.prototype.push;

function Frame() {
  this.parentNode = null;
  this.children = null;
  this.childIndex = null;
  this.childCount = null;
  this.childTemplateCount = 0;
  this.mustacheCount = 0;
  this.actions = [];
}

/**
 * Takes in an AST and outputs a list of actions to be consumed
 * by a compiler. For example, the template
 *
 *     foo{{bar}}<div>baz</div>
 *
 * produces the actions
 *
 *     [['startProgram', [programNode, 0]],
 *      ['text', [textNode, 0, 3]],
 *      ['mustache', [mustacheNode, 1, 3]],
 *      ['openElement', [elementNode, 2, 3, 0]],
 *      ['text', [textNode, 0, 1]],
 *      ['closeElement', [elementNode, 2, 3],
 *      ['endProgram', [programNode]]]
 *
 * This visitor walks the AST depth first and backwards. As
 * a result the bottom-most child template will appear at the
 * top of the actions list whereas the root template will appear
 * at the bottom of the list. For example,
 *
 *     <div>{{#if}}foo{{else}}bar<b></b>{{/if}}</div>
 *
 * produces the actions
 *
 *     [['startProgram', [programNode, 0]],
 *      ['text', [textNode, 0, 2, 0]],
 *      ['openElement', [elementNode, 1, 2, 0]],
 *      ['closeElement', [elementNode, 1, 2]],
 *      ['endProgram', [programNode]],
 *      ['startProgram', [programNode, 0]],
 *      ['text', [textNode, 0, 1]],
 *      ['endProgram', [programNode]],
 *      ['startProgram', [programNode, 2]],
 *      ['openElement', [elementNode, 0, 1, 1]],
 *      ['block', [blockNode, 0, 1]],
 *      ['closeElement', [elementNode, 0, 1]],
 *      ['endProgram', [programNode]]]
 *
 * The state of the traversal is maintained by a stack of frames.
 * Whenever a node with children is entered (either a ProgramNode
 * or an ElementNode) a frame is pushed onto the stack. The frame
 * contains information about the state of the traversal of that
 * node. For example,
 *
 *   - index of the current child node being visited
 *   - the number of mustaches contained within its child nodes
 *   - the list of actions generated by its child nodes
 */

function TemplateVisitor() {
  this.frameStack = [];
  this.actions = [];
  this.programDepth = -1;
}

// Traversal methods

TemplateVisitor.prototype.visit = function (node) {
  this[node.type](node);
};

TemplateVisitor.prototype.Program = function (program) {
  this.programDepth++;

  var parentFrame = this.getCurrentFrame();
  var programFrame = this.pushFrame();

  programFrame.parentNode = program;
  programFrame.children = program.body;
  programFrame.childCount = program.body.length;
  programFrame.blankChildTextNodes = [];
  programFrame.actions.push(['endProgram', [program, this.programDepth]]);

  for (var i = program.body.length - 1; i >= 0; i--) {
    programFrame.childIndex = i;
    this.visit(program.body[i]);
  }

  programFrame.actions.push(['startProgram', [program, programFrame.childTemplateCount, programFrame.blankChildTextNodes.reverse()]]);
  this.popFrame();

  this.programDepth--;

  // Push the completed template into the global actions list
  if (parentFrame) {
    parentFrame.childTemplateCount++;
  }
  push.apply(this.actions, programFrame.actions.reverse());
};

TemplateVisitor.prototype.ElementNode = function (element) {
  var parentFrame = this.getCurrentFrame();
  var elementFrame = this.pushFrame();

  elementFrame.parentNode = element;
  elementFrame.children = element.children;
  elementFrame.childCount = element.children.length;
  elementFrame.mustacheCount += element.modifiers.length;
  elementFrame.blankChildTextNodes = [];

  var actionArgs = [element, parentFrame.childIndex, parentFrame.childCount];

  elementFrame.actions.push(['closeElement', actionArgs]);

  for (var i = element.attributes.length - 1; i >= 0; i--) {
    this.visit(element.attributes[i]);
  }

  for (i = element.children.length - 1; i >= 0; i--) {
    elementFrame.childIndex = i;
    this.visit(element.children[i]);
  }

  elementFrame.actions.push(['openElement', actionArgs.concat([elementFrame.mustacheCount, elementFrame.blankChildTextNodes.reverse()])]);
  this.popFrame();

  // Propagate the element's frame state to the parent frame
  if (elementFrame.mustacheCount > 0) {
    parentFrame.mustacheCount++;
  }
  parentFrame.childTemplateCount += elementFrame.childTemplateCount;
  push.apply(parentFrame.actions, elementFrame.actions);
};

TemplateVisitor.prototype.AttrNode = function (attr) {
  if (attr.value.type !== 'TextNode') {
    this.getCurrentFrame().mustacheCount++;
  }
};

TemplateVisitor.prototype.TextNode = function (text) {
  var frame = this.getCurrentFrame();
  if (text.chars === '') {
    frame.blankChildTextNodes.push(domIndexOf(frame.children, text));
  }
  frame.actions.push(['text', [text, frame.childIndex, frame.childCount]]);
};

TemplateVisitor.prototype.BlockStatement = function (node) {
  var frame = this.getCurrentFrame();

  frame.mustacheCount++;
  frame.actions.push(['block', [node, frame.childIndex, frame.childCount]]);

  if (node.inverse) {
    this.visit(node.inverse);
  }
  if (node.program) {
    this.visit(node.program);
  }
};

TemplateVisitor.prototype.ComponentNode = function (node) {
  var frame = this.getCurrentFrame();

  frame.mustacheCount++;
  frame.actions.push(['component', [node, frame.childIndex, frame.childCount]]);

  if (node.program) {
    this.visit(node.program);
  }
};

TemplateVisitor.prototype.PartialStatement = function (node) {
  var frame = this.getCurrentFrame();
  frame.mustacheCount++;
  frame.actions.push(['mustache', [node, frame.childIndex, frame.childCount]]);
};

TemplateVisitor.prototype.CommentStatement = function (text) {
  var frame = this.getCurrentFrame();
  frame.actions.push(['comment', [text, frame.childIndex, frame.childCount]]);
};

TemplateVisitor.prototype.MustacheStatement = function (mustache) {
  var frame = this.getCurrentFrame();
  frame.mustacheCount++;
  frame.actions.push(['mustache', [mustache, frame.childIndex, frame.childCount]]);
};

// Frame helpers

TemplateVisitor.prototype.getCurrentFrame = function () {
  return this.frameStack[this.frameStack.length - 1];
};

TemplateVisitor.prototype.pushFrame = function () {
  var frame = new Frame();
  this.frameStack.push(frame);
  return frame;
};

TemplateVisitor.prototype.popFrame = function () {
  return this.frameStack.pop();
};

exports.default = TemplateVisitor;

// Returns the index of `domNode` in the `nodes` array, skipping
// over any nodes which do not represent DOM nodes.
function domIndexOf(nodes, domNode) {
  var index = -1;

  for (var i = 0; i < nodes.length; i++) {
    var node = nodes[i];

    if (node.type !== 'TextNode' && node.type !== 'ElementNode') {
      continue;
    } else {
      index++;
    }

    if (node === domNode) {
      return index;
    }
  }

  return -1;
}
module.exports = exports.default;

},{}],59:[function(require,module,exports){
exports.__esModule = true;
exports.processOpcodes = processOpcodes;

function processOpcodes(compiler, opcodes) {
  for (var i = 0, l = opcodes.length; i < l; i++) {
    var method = opcodes[i][0];
    var params = opcodes[i][1];
    if (params) {
      compiler[method].apply(compiler, params);
    } else {
      compiler[method].call(compiler);
    }
  }
}

},{}],60:[function(require,module,exports){
exports.__esModule = true;
exports.acceptParams = acceptParams;
exports.acceptHash = acceptHash;
/**
  # Expression Nodes:

  These nodes are not directly responsible for any part of the DOM, but are
  eventually passed to a Statement Node.

  * get
  * subexpr
  * concat
*/

function acceptParams(nodes, env, scope) {
  var array = [];

  for (var i = 0, l = nodes.length; i < l; i++) {
    array.push(acceptExpression(nodes[i], env, scope).value);
  }

  return array;
}

function acceptHash(pairs, env, scope) {
  var object = {};

  for (var i = 0, l = pairs.length; i < l; i += 2) {
    var key = pairs[i];
    var value = pairs[i + 1];
    object[key] = acceptExpression(value, env, scope).value;
  }

  return object;
}

function acceptExpression(node, env, scope) {
  var ret = { value: null };

  // Primitive literals are unambiguously non-array representations of
  // themselves.
  if (typeof node !== 'object' || node === null) {
    ret.value = node;
  } else {
    ret.value = evaluateNode(node, env, scope);
  }

  return ret;
}

function evaluateNode(node, env, scope) {
  switch (node[0]) {
    // can be used by manualElement
    case 'value':
      return node[1];
    case 'get':
      return evaluateGet(node, env, scope);
    case 'subexpr':
      return evaluateSubexpr(node, env, scope);
    case 'concat':
      return evaluateConcat(node, env, scope);
  }
}

function evaluateGet(node, env, scope) {
  var path = node[1];

  return env.hooks.get(env, scope, path);
}

function evaluateSubexpr(node, env, scope) {
  var path = node[1];
  var rawParams = node[2];
  var rawHash = node[3];

  var params = acceptParams(rawParams, env, scope);
  var hash = acceptHash(rawHash, env, scope);

  return env.hooks.subexpr(env, scope, path, params, hash);
}

function evaluateConcat(node, env, scope) {
  var rawParts = node[1];

  var parts = acceptParams(rawParts, env, scope);

  return env.hooks.concat(env, parts);
}

},{}],61:[function(require,module,exports){
exports.__esModule = true;
exports.wrap = wrap;
exports.wrapForHelper = wrapForHelper;
exports.createScope = createScope;
exports.createFreshScope = createFreshScope;
exports.bindShadowScope = bindShadowScope;
exports.createChildScope = createChildScope;
exports.bindSelf = bindSelf;
exports.updateSelf = updateSelf;
exports.bindLocal = bindLocal;
exports.updateLocal = updateLocal;
exports.bindBlock = bindBlock;
exports.block = block;
exports.continueBlock = continueBlock;
exports.hostBlock = hostBlock;
exports.handleRedirect = handleRedirect;
exports.handleKeyword = handleKeyword;
exports.linkRenderNode = linkRenderNode;
exports.inline = inline;
exports.keyword = keyword;
exports.invokeHelper = invokeHelper;
exports.classify = classify;
exports.partial = partial;
exports.range = range;
exports.element = element;
exports.attribute = attribute;
exports.subexpr = subexpr;
exports.get = get;
exports.getRoot = getRoot;
exports.getBlock = getBlock;
exports.getChild = getChild;
exports.getValue = getValue;
exports.getCellOrValue = getCellOrValue;
exports.component = component;
exports.concat = concat;
exports.hasHelper = hasHelper;
exports.lookupHelper = lookupHelper;
exports.bindScope = bindScope;
exports.updateScope = updateScope;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _render = require("./render");

var _render2 = _interopRequireDefault(_render);

var _morphRangeMorphList = require("../morph-range/morph-list");

var _morphRangeMorphList2 = _interopRequireDefault(_morphRangeMorphList);

var _htmlbarsUtilObjectUtils = require("../htmlbars-util/object-utils");

var _htmlbarsUtilMorphUtils = require("../htmlbars-util/morph-utils");

var _htmlbarsUtilTemplateUtils = require("../htmlbars-util/template-utils");

/**
  HTMLBars delegates the runtime behavior of a template to
  hooks provided by the host environment. These hooks explain
  the lexical environment of a Handlebars template, the internal
  representation of references, and the interaction between an
  HTMLBars template and the DOM it is managing.

  While HTMLBars host hooks have access to all of this internal
  machinery, templates and helpers have access to the abstraction
  provided by the host hooks.

  ## The Lexical Environment

  The default lexical environment of an HTMLBars template includes:

  * Any local variables, provided by *block arguments*
  * The current value of `self`

  ## Simple Nesting

  Let's look at a simple template with a nested block:

  ```hbs
  <h1>{{title}}</h1>

  {{#if author}}
    <p class="byline">{{author}}</p>
  {{/if}}
  ```

  In this case, the lexical environment at the top-level of the
  template does not change inside of the `if` block. This is
  achieved via an implementation of `if` that looks like this:

  ```js
  registerHelper('if', function(params) {
    if (!!params[0]) {
      return this.yield();
    }
  });
  ```

  A call to `this.yield` invokes the child template using the
  current lexical environment.

  ## Block Arguments

  It is possible for nested blocks to introduce new local
  variables:

  ```hbs
  {{#count-calls as |i|}}
  <h1>{{title}}</h1>
  <p>Called {{i}} times</p>
  {{/count}}
  ```

  In this example, the child block inherits its surrounding
  lexical environment, but augments it with a single new
  variable binding.

  The implementation of `count-calls` supplies the value of
  `i`, but does not otherwise alter the environment:

  ```js
  var count = 0;
  registerHelper('count-calls', function() {
    return this.yield([ ++count ]);
  });
  ```
*/

function wrap(template) {
  if (template === null) {
    return null;
  }

  return {
    meta: template.meta,
    arity: template.arity,
    raw: template,
    render: function (self, env, options, blockArguments) {
      var scope = env.hooks.createFreshScope();

      var contextualElement = options && options.contextualElement;
      var renderOptions = new _render.RenderOptions(null, self, blockArguments, contextualElement);

      return _render2.default(template, env, scope, renderOptions);
    }
  };
}

function wrapForHelper(template, env, scope, morph, renderState, visitor) {
  if (!template) {
    return {};
  }

  var yieldArgs = yieldTemplate(template, env, scope, morph, renderState, visitor);

  return {
    meta: template.meta,
    arity: template.arity,
    'yield': yieldArgs, // quoted since it's a reserved word, see issue #420
    yieldItem: yieldItem(template, env, scope, morph, renderState, visitor),
    raw: template,

    render: function (self, blockArguments) {
      yieldArgs(blockArguments, self);
    }
  };
}

// Called by a user-land helper to render a template.
function yieldTemplate(template, env, parentScope, morph, renderState, visitor) {
  return function (blockArguments, self) {
    // Render state is used to track the progress of the helper (since it
    // may call into us multiple times). As the user-land helper calls
    // into library code, we track what needs to be cleaned up after the
    // helper has returned.
    //
    // Here, we remember that a template has been yielded and so we do not
    // need to remove the previous template. (If no template is yielded
    // this render by the helper, we assume nothing should be shown and
    // remove any previous rendered templates.)
    renderState.morphToClear = null;

    // In this conditional is true, it means that on the previous rendering pass
    // the helper yielded multiple items via `yieldItem()`, but this time they
    // are yielding a single template. In that case, we mark the morph list for
    // cleanup so it is removed from the DOM.
    if (morph.morphList) {
      _htmlbarsUtilTemplateUtils.clearMorphList(morph.morphList, morph, env);
      renderState.morphListToClear = null;
    }

    var scope = parentScope;

    if (morph.lastYielded && isStableTemplate(template, morph.lastYielded)) {
      return morph.lastResult.revalidateWith(env, undefined, self, blockArguments, visitor);
    }

    // Check to make sure that we actually **need** a new scope, and can't
    // share the parent scope. Note that we need to move this check into
    // a host hook, because the host's notion of scope may require a new
    // scope in more cases than the ones we can determine statically.
    if (self !== undefined || parentScope === null || template.arity) {
      scope = env.hooks.createChildScope(parentScope);
    }

    morph.lastYielded = { self: self, template: template, shadowTemplate: null };

    // Render the template that was selected by the helper
    var renderOptions = new _render.RenderOptions(morph, self, blockArguments);
    _render2.default(template, env, scope, renderOptions);
  };
}

function yieldItem(template, env, parentScope, morph, renderState, visitor) {
  // Initialize state that tracks multiple items being
  // yielded in.
  var currentMorph = null;

  // Candidate morphs for deletion.
  var candidates = {};

  // Reuse existing MorphList if this is not a first-time
  // render.
  var morphList = morph.morphList;
  if (morphList) {
    currentMorph = morphList.firstChildMorph;
  }

  // Advances the currentMorph pointer to the morph in the previously-rendered
  // list that matches the yielded key. While doing so, it marks any morphs
  // that it advances past as candidates for deletion. Assuming those morphs
  // are not yielded in later, they will be removed in the prune step during
  // cleanup.
  // Note that this helper function assumes that the morph being seeked to is
  // guaranteed to exist in the previous MorphList; if this is called and the
  // morph does not exist, it will result in an infinite loop
  function advanceToKey(key) {
    var seek = currentMorph;

    while (seek.key !== key) {
      candidates[seek.key] = seek;
      seek = seek.nextMorph;
    }

    currentMorph = seek.nextMorph;
    return seek;
  }

  return function (_key, blockArguments, self) {
    if (typeof _key !== 'string') {
      throw new Error("You must provide a string key when calling `yieldItem`; you provided " + _key);
    }

    // At least one item has been yielded, so we do not wholesale
    // clear the last MorphList but instead apply a prune operation.
    renderState.morphListToClear = null;
    morph.lastYielded = null;

    var morphList, morphMap;

    if (!morph.morphList) {
      morph.morphList = new _morphRangeMorphList2.default();
      morph.morphMap = {};
      morph.setMorphList(morph.morphList);
    }

    morphList = morph.morphList;
    morphMap = morph.morphMap;

    // A map of morphs that have been yielded in on this
    // rendering pass. Any morphs that do not make it into
    // this list will be pruned from the MorphList during the cleanup
    // process.
    var handledMorphs = renderState.handledMorphs;
    var key = undefined;

    if (_key in handledMorphs) {
      // In this branch we are dealing with a duplicate key. The strategy
      // is to take the original key and append a counter to it that is
      // incremented every time the key is reused. In order to greatly
      // reduce the chance of colliding with another valid key we also add
      // an extra string "--z8mS2hvDW0A--" to the new key.
      var collisions = renderState.collisions;
      if (collisions === undefined) {
        collisions = renderState.collisions = {};
      }
      var count = collisions[_key] | 0;
      collisions[_key] = ++count;

      key = _key + '--z8mS2hvDW0A--' + count;
    } else {
      key = _key;
    }

    if (currentMorph && currentMorph.key === key) {
      yieldTemplate(template, env, parentScope, currentMorph, renderState, visitor)(blockArguments, self);
      currentMorph = currentMorph.nextMorph;
      handledMorphs[key] = currentMorph;
    } else if (morphMap[key] !== undefined) {
      var foundMorph = morphMap[key];

      if (key in candidates) {
        // If we already saw this morph, move it forward to this position
        morphList.insertBeforeMorph(foundMorph, currentMorph);
      } else {
        // Otherwise, move the pointer forward to the existing morph for this key
        advanceToKey(key);
      }

      handledMorphs[foundMorph.key] = foundMorph;
      yieldTemplate(template, env, parentScope, foundMorph, renderState, visitor)(blockArguments, self);
    } else {
      var childMorph = _render.createChildMorph(env.dom, morph);
      childMorph.key = key;
      morphMap[key] = handledMorphs[key] = childMorph;
      morphList.insertBeforeMorph(childMorph, currentMorph);
      yieldTemplate(template, env, parentScope, childMorph, renderState, visitor)(blockArguments, self);
    }

    renderState.morphListToPrune = morphList;
    morph.childNodes = null;
  };
}

function isStableTemplate(template, lastYielded) {
  return !lastYielded.shadowTemplate && template === lastYielded.template;
}
function optionsFor(template, inverse, env, scope, morph, visitor) {
  // If there was a template yielded last time, set morphToClear so it will be cleared
  // if no template is yielded on this render.
  var morphToClear = morph.lastResult ? morph : null;
  var renderState = new _htmlbarsUtilTemplateUtils.RenderState(morphToClear, morph.morphList || null);

  return {
    templates: {
      template: wrapForHelper(template, env, scope, morph, renderState, visitor),
      inverse: wrapForHelper(inverse, env, scope, morph, renderState, visitor)
    },
    renderState: renderState
  };
}

function thisFor(options) {
  return {
    arity: options.template.arity,
    'yield': options.template.yield, // quoted since it's a reserved word, see issue #420
    yieldItem: options.template.yieldItem,
    yieldIn: options.template.yieldIn
  };
}

/**
  Host Hook: createScope

  @param {Scope?} parentScope
  @return Scope

  Corresponds to entering a new HTMLBars block.

  This hook is invoked when a block is entered with
  a new `self` or additional local variables.

  When invoked for a top-level template, the
  `parentScope` is `null`, and this hook should return
  a fresh Scope.

  When invoked for a child template, the `parentScope`
  is the scope for the parent environment.

  Note that the `Scope` is an opaque value that is
  passed to other host hooks. For example, the `get`
  hook uses the scope to retrieve a value for a given
  scope and variable name.
*/

function createScope(env, parentScope) {
  if (parentScope) {
    return env.hooks.createChildScope(parentScope);
  } else {
    return env.hooks.createFreshScope();
  }
}

function createFreshScope() {
  // because `in` checks have unpredictable performance, keep a
  // separate dictionary to track whether a local was bound.
  // See `bindLocal` for more information.
  return { self: null, blocks: {}, locals: {}, localPresent: {} };
}

/**
  Host Hook: bindShadowScope

  @param {Scope?} parentScope
  @return Scope

  Corresponds to rendering a new template into an existing
  render tree, but with a new top-level lexical scope. This
  template is called the "shadow root".

  If a shadow template invokes `{{yield}}`, it will render
  the block provided to the shadow root in the original
  lexical scope.

  ```hbs
  {{!-- post template --}}
  <p>{{props.title}}</p>
  {{yield}}

  {{!-- blog template --}}
  {{#post title="Hello world"}}
    <p>by {{byline}}</p>
    <article>This is my first post</article>
  {{/post}}

  {{#post title="Goodbye world"}}
    <p>by {{byline}}</p>
    <article>This is my last post</article>
  {{/post}}
  ```

  ```js
  helpers.post = function(params, hash, options) {
    options.template.yieldIn(postTemplate, { props: hash });
  };

  blog.render({ byline: "Yehuda Katz" });
  ```

  Produces:

  ```html
  <p>Hello world</p>
  <p>by Yehuda Katz</p>
  <article>This is my first post</article>

  <p>Goodbye world</p>
  <p>by Yehuda Katz</p>
  <article>This is my last post</article>
  ```

  In short, `yieldIn` creates a new top-level scope for the
  provided template and renders it, making the original block
  available to `{{yield}}` in that template.
*/

function bindShadowScope(env /*, parentScope, shadowScope */) {
  return env.hooks.createFreshScope();
}

function createChildScope(parent) {
  var scope = Object.create(parent);
  scope.locals = Object.create(parent.locals);
  scope.localPresent = Object.create(parent.localPresent);
  scope.blocks = Object.create(parent.blocks);
  return scope;
}

/**
  Host Hook: bindSelf

  @param {Scope} scope
  @param {any} self

  Corresponds to entering a template.

  This hook is invoked when the `self` value for a scope is ready to be bound.

  The host must ensure that child scopes reflect the change to the `self` in
  future calls to the `get` hook.
*/

function bindSelf(env, scope, self) {
  scope.self = self;
}

function updateSelf(env, scope, self) {
  env.hooks.bindSelf(env, scope, self);
}

/**
  Host Hook: bindLocal

  @param {Environment} env
  @param {Scope} scope
  @param {String} name
  @param {any} value

  Corresponds to entering a template with block arguments.

  This hook is invoked when a local variable for a scope has been provided.

  The host must ensure that child scopes reflect the change in future calls
  to the `get` hook.
*/

function bindLocal(env, scope, name, value) {
  scope.localPresent[name] = true;
  scope.locals[name] = value;
}

function updateLocal(env, scope, name, value) {
  env.hooks.bindLocal(env, scope, name, value);
}

/**
  Host Hook: bindBlock

  @param {Environment} env
  @param {Scope} scope
  @param {Function} block

  Corresponds to entering a shadow template that was invoked by a block helper with
  `yieldIn`.

  This hook is invoked with an opaque block that will be passed along
  to the shadow template, and inserted into the shadow template when
  `{{yield}}` is used. Optionally provide a non-default block name
  that can be targeted by `{{yield to=blockName}}`.
*/

function bindBlock(env, scope, block) {
  var name = arguments.length <= 3 || arguments[3] === undefined ? 'default' : arguments[3];

  scope.blocks[name] = block;
}

/**
  Host Hook: block

  @param {RenderNode} renderNode
  @param {Environment} env
  @param {Scope} scope
  @param {String} path
  @param {Array} params
  @param {Object} hash
  @param {Block} block
  @param {Block} elseBlock

  Corresponds to:

  ```hbs
  {{#helper param1 param2 key1=val1 key2=val2}}
    {{!-- child template --}}
  {{/helper}}
  ```

  This host hook is a workhorse of the system. It is invoked
  whenever a block is encountered, and is responsible for
  resolving the helper to call, and then invoke it.

  The helper should be invoked with:

  - `{Array} params`: the parameters passed to the helper
    in the template.
  - `{Object} hash`: an object containing the keys and values passed
    in the hash position in the template.

  The values in `params` and `hash` will already be resolved
  through a previous call to the `get` host hook.

  The helper should be invoked with a `this` value that is
  an object with one field:

  `{Function} yield`: when invoked, this function executes the
  block with the current scope. It takes an optional array of
  block parameters. If block parameters are supplied, HTMLBars
  will invoke the `bindLocal` host hook to bind the supplied
  values to the block arguments provided by the template.

  In general, the default implementation of `block` should work
  for most host environments. It delegates to other host hooks
  where appropriate, and properly invokes the helper with the
  appropriate arguments.
*/

function block(morph, env, scope, path, params, hash, template, inverse, visitor) {
  if (handleRedirect(morph, env, scope, path, params, hash, template, inverse, visitor)) {
    return;
  }

  continueBlock(morph, env, scope, path, params, hash, template, inverse, visitor);
}

function continueBlock(morph, env, scope, path, params, hash, template, inverse, visitor) {
  hostBlock(morph, env, scope, template, inverse, null, visitor, function (options) {
    var helper = env.hooks.lookupHelper(env, scope, path);
    return env.hooks.invokeHelper(morph, env, scope, visitor, params, hash, helper, options.templates, thisFor(options.templates));
  });
}

function hostBlock(morph, env, scope, template, inverse, shadowOptions, visitor, callback) {
  var options = optionsFor(template, inverse, env, scope, morph, visitor);
  _htmlbarsUtilTemplateUtils.renderAndCleanup(morph, env, options, shadowOptions, callback);
}

function handleRedirect(morph, env, scope, path, params, hash, template, inverse, visitor) {
  if (!path) {
    return false;
  }

  var redirect = env.hooks.classify(env, scope, path);
  if (redirect) {
    switch (redirect) {
      case 'component':
        env.hooks.component(morph, env, scope, path, params, hash, { default: template, inverse: inverse }, visitor);break;
      case 'inline':
        env.hooks.inline(morph, env, scope, path, params, hash, visitor);break;
      case 'block':
        env.hooks.block(morph, env, scope, path, params, hash, template, inverse, visitor);break;
      default:
        throw new Error("Internal HTMLBars redirection to " + redirect + " not supported");
    }
    return true;
  }

  if (handleKeyword(path, morph, env, scope, params, hash, template, inverse, visitor)) {
    return true;
  }

  return false;
}

function handleKeyword(path, morph, env, scope, params, hash, template, inverse, visitor) {
  var keyword = env.hooks.keywords[path];
  if (!keyword) {
    return false;
  }

  if (typeof keyword === 'function') {
    return keyword(morph, env, scope, params, hash, template, inverse, visitor);
  }

  if (keyword.willRender) {
    keyword.willRender(morph, env);
  }

  var lastState, newState;
  if (keyword.setupState) {
    lastState = _htmlbarsUtilObjectUtils.shallowCopy(morph.getState());
    newState = morph.setState(keyword.setupState(lastState, env, scope, params, hash));
  }

  if (keyword.childEnv) {
    // Build the child environment...
    env = keyword.childEnv(morph.getState(), env);

    // ..then save off the child env builder on the render node. If the render
    // node tree is re-rendered and this node is not dirty, the child env
    // builder will still be invoked so that child dirty render nodes still get
    // the correct child env.
    morph.buildChildEnv = keyword.childEnv;
  }

  var firstTime = !morph.rendered;

  if (keyword.isEmpty) {
    var isEmpty = keyword.isEmpty(morph.getState(), env, scope, params, hash);

    if (isEmpty) {
      if (!firstTime) {
        _htmlbarsUtilTemplateUtils.clearMorph(morph, env, false);
      }
      return true;
    }
  }

  if (firstTime) {
    if (keyword.render) {
      keyword.render(morph, env, scope, params, hash, template, inverse, visitor);
    }
    morph.rendered = true;
    return true;
  }

  var isStable;
  if (keyword.isStable) {
    isStable = keyword.isStable(lastState, newState);
  } else {
    isStable = stableState(lastState, newState);
  }

  if (isStable) {
    if (keyword.rerender) {
      var newEnv = keyword.rerender(morph, env, scope, params, hash, template, inverse, visitor);
      env = newEnv || env;
    }
    _htmlbarsUtilMorphUtils.validateChildMorphs(env, morph, visitor);
    return true;
  } else {
    _htmlbarsUtilTemplateUtils.clearMorph(morph, env, false);
  }

  // If the node is unstable, re-render from scratch
  if (keyword.render) {
    keyword.render(morph, env, scope, params, hash, template, inverse, visitor);
    morph.rendered = true;
    return true;
  }
}

function stableState(oldState, newState) {
  if (_htmlbarsUtilObjectUtils.keyLength(oldState) !== _htmlbarsUtilObjectUtils.keyLength(newState)) {
    return false;
  }

  for (var prop in oldState) {
    if (oldState[prop] !== newState[prop]) {
      return false;
    }
  }

  return true;
}

function linkRenderNode() /* morph, env, scope, params, hash */{
  return;
}

/**
  Host Hook: inline

  @param {RenderNode} renderNode
  @param {Environment} env
  @param {Scope} scope
  @param {String} path
  @param {Array} params
  @param {Hash} hash

  Corresponds to:

  ```hbs
  {{helper param1 param2 key1=val1 key2=val2}}
  ```

  This host hook is similar to the `block` host hook, but it
  invokes helpers that do not supply an attached block.

  Like the `block` hook, the helper should be invoked with:

  - `{Array} params`: the parameters passed to the helper
    in the template.
  - `{Object} hash`: an object containing the keys and values passed
    in the hash position in the template.

  The values in `params` and `hash` will already be resolved
  through a previous call to the `get` host hook.

  In general, the default implementation of `inline` should work
  for most host environments. It delegates to other host hooks
  where appropriate, and properly invokes the helper with the
  appropriate arguments.

  The default implementation of `inline` also makes `partial`
  a keyword. Instead of invoking a helper named `partial`,
  it invokes the `partial` host hook.
*/

function inline(morph, env, scope, path, params, hash, visitor) {
  if (handleRedirect(morph, env, scope, path, params, hash, null, null, visitor)) {
    return;
  }

  var value = undefined,
      hasValue = undefined;
  if (morph.linkedResult) {
    value = env.hooks.getValue(morph.linkedResult);
    hasValue = true;
  } else {
    var options = optionsFor(null, null, env, scope, morph);

    var helper = env.hooks.lookupHelper(env, scope, path);
    var result = env.hooks.invokeHelper(morph, env, scope, visitor, params, hash, helper, options.templates, thisFor(options.templates));

    if (result && result.link) {
      morph.linkedResult = result.value;
      _htmlbarsUtilMorphUtils.linkParams(env, scope, morph, '@content-helper', [morph.linkedResult], null);
    }

    if (result && 'value' in result) {
      value = env.hooks.getValue(result.value);
      hasValue = true;
    }
  }

  if (hasValue) {
    if (morph.lastValue !== value) {
      morph.setContent(value);
    }
    morph.lastValue = value;
  }
}

function keyword(path, morph, env, scope, params, hash, template, inverse, visitor) {
  handleKeyword(path, morph, env, scope, params, hash, template, inverse, visitor);
}

function invokeHelper(morph, env, scope, visitor, _params, _hash, helper, templates, context) {
  var params = normalizeArray(env, _params);
  var hash = normalizeObject(env, _hash);
  return { value: helper.call(context, params, hash, templates) };
}

function normalizeArray(env, array) {
  var out = new Array(array.length);

  for (var i = 0, l = array.length; i < l; i++) {
    out[i] = env.hooks.getCellOrValue(array[i]);
  }

  return out;
}

function normalizeObject(env, object) {
  var out = {};

  for (var prop in object) {
    out[prop] = env.hooks.getCellOrValue(object[prop]);
  }

  return out;
}

function classify() /* env, scope, path */{
  return null;
}

var keywords = {
  partial: function (morph, env, scope, params) {
    var value = env.hooks.partial(morph, env, scope, params[0]);
    morph.setContent(value);
    return true;
  },

  // quoted since it's a reserved word, see issue #420
  'yield': function (morph, env, scope, params, hash, template, inverse, visitor) {
    // the current scope is provided purely for the creation of shadow
    // scopes; it should not be provided to user code.

    var to = env.hooks.getValue(hash.to) || 'default';
    var block = env.hooks.getBlock(scope, to);

    if (block) {
      block.invoke(env, params, hash.self, morph, scope, visitor);
    }
    return true;
  },

  hasBlock: function (morph, env, scope, params) {
    var name = env.hooks.getValue(params[0]) || 'default';
    return !!env.hooks.getBlock(scope, name);
  },

  hasBlockParams: function (morph, env, scope, params) {
    var name = env.hooks.getValue(params[0]) || 'default';
    var block = env.hooks.getBlock(scope, name);
    return !!(block && block.arity);
  }

};

exports.keywords = keywords;
/**
  Host Hook: partial

  @param {RenderNode} renderNode
  @param {Environment} env
  @param {Scope} scope
  @param {String} path

  Corresponds to:

  ```hbs
  {{partial "location"}}
  ```

  This host hook is invoked by the default implementation of
  the `inline` hook. This makes `partial` a keyword in an
  HTMLBars environment using the default `inline` host hook.

  It is implemented as a host hook so that it can retrieve
  the named partial out of the `Environment`. Helpers, in
  contrast, only have access to the values passed in to them,
  and not to the ambient lexical environment.

  The host hook should invoke the referenced partial with
  the ambient `self`.
*/

function partial(renderNode, env, scope, path) {
  var template = env.partials[path];
  return template.render(scope.self, env, {}).fragment;
}

/**
  Host hook: range

  @param {RenderNode} renderNode
  @param {Environment} env
  @param {Scope} scope
  @param {any} value

  Corresponds to:

  ```hbs
  {{content}}
  {{{unescaped}}}
  ```

  This hook is responsible for updating a render node
  that represents a range of content with a value.
*/

function range(morph, env, scope, path, value, visitor) {
  if (handleRedirect(morph, env, scope, path, [], {}, null, null, visitor)) {
    return;
  }

  value = env.hooks.getValue(value);

  if (morph.lastValue !== value) {
    morph.setContent(value);
  }

  morph.lastValue = value;
}

/**
  Host hook: element

  @param {RenderNode} renderNode
  @param {Environment} env
  @param {Scope} scope
  @param {String} path
  @param {Array} params
  @param {Hash} hash

  Corresponds to:

  ```hbs
  <div {{bind-attr foo=bar}}></div>
  ```

  This hook is responsible for invoking a helper that
  modifies an element.

  Its purpose is largely legacy support for awkward
  idioms that became common when using the string-based
  Handlebars engine.

  Most of the uses of the `element` hook are expected
  to be superseded by component syntax and the
  `attribute` hook.
*/

function element(morph, env, scope, path, params, hash, visitor) {
  if (handleRedirect(morph, env, scope, path, params, hash, null, null, visitor)) {
    return;
  }

  var helper = env.hooks.lookupHelper(env, scope, path);
  if (helper) {
    env.hooks.invokeHelper(null, env, scope, null, params, hash, helper, { element: morph.element });
  }
}

/**
  Host hook: attribute

  @param {RenderNode} renderNode
  @param {Environment} env
  @param {String} name
  @param {any} value

  Corresponds to:

  ```hbs
  <div foo={{bar}}></div>
  ```

  This hook is responsible for updating a render node
  that represents an element's attribute with a value.

  It receives the name of the attribute as well as an
  already-resolved value, and should update the render
  node with the value if appropriate.
*/

function attribute(morph, env, scope, name, value) {
  value = env.hooks.getValue(value);

  if (morph.lastValue !== value) {
    morph.setContent(value);
  }

  morph.lastValue = value;
}

function subexpr(env, scope, helperName, params, hash) {
  var helper = env.hooks.lookupHelper(env, scope, helperName);
  var result = env.hooks.invokeHelper(null, env, scope, null, params, hash, helper, {});
  if (result && 'value' in result) {
    return env.hooks.getValue(result.value);
  }
}

/**
  Host Hook: get

  @param {Environment} env
  @param {Scope} scope
  @param {String} path

  Corresponds to:

  ```hbs
  {{foo.bar}}
    ^

  {{helper foo.bar key=value}}
           ^           ^
  ```

  This hook is the "leaf" hook of the system. It is used to
  resolve a path relative to the current scope.
*/

function get(env, scope, path) {
  if (path === '') {
    return scope.self;
  }

  var keys = path.split('.');
  var value = env.hooks.getRoot(scope, keys[0])[0];

  for (var i = 1; i < keys.length; i++) {
    if (value) {
      value = env.hooks.getChild(value, keys[i]);
    } else {
      break;
    }
  }

  return value;
}

function getRoot(scope, key) {
  if (scope.localPresent[key]) {
    return [scope.locals[key]];
  } else if (scope.self) {
    return [scope.self[key]];
  } else {
    return [undefined];
  }
}

function getBlock(scope, key) {
  return scope.blocks[key];
}

function getChild(value, key) {
  return value[key];
}

function getValue(reference) {
  return reference;
}

function getCellOrValue(reference) {
  return reference;
}

function component(morph, env, scope, tagName, params, attrs, templates, visitor) {
  if (env.hooks.hasHelper(env, scope, tagName)) {
    return env.hooks.block(morph, env, scope, tagName, params, attrs, templates.default, templates.inverse, visitor);
  }

  componentFallback(morph, env, scope, tagName, attrs, templates.default);
}

function concat(env, params) {
  var value = "";
  for (var i = 0, l = params.length; i < l; i++) {
    value += env.hooks.getValue(params[i]);
  }
  return value;
}

function componentFallback(morph, env, scope, tagName, attrs, template) {
  var element = env.dom.createElement(tagName);
  for (var name in attrs) {
    element.setAttribute(name, env.hooks.getValue(attrs[name]));
  }
  var fragment = _render2.default(template, env, scope, {}).fragment;
  element.appendChild(fragment);
  morph.setNode(element);
}

function hasHelper(env, scope, helperName) {
  return env.helpers[helperName] !== undefined;
}

function lookupHelper(env, scope, helperName) {
  return env.helpers[helperName];
}

function bindScope() /* env, scope */{
  // this function is used to handle host-specified extensions to scope
  // other than `self`, `locals` and `block`.
}

function updateScope(env, scope) {
  env.hooks.bindScope(env, scope);
}

exports.default = {
  // fundamental hooks that you will likely want to override
  bindLocal: bindLocal,
  bindSelf: bindSelf,
  bindScope: bindScope,
  classify: classify,
  component: component,
  concat: concat,
  createFreshScope: createFreshScope,
  getChild: getChild,
  getRoot: getRoot,
  getBlock: getBlock,
  getValue: getValue,
  getCellOrValue: getCellOrValue,
  keywords: keywords,
  linkRenderNode: linkRenderNode,
  partial: partial,
  subexpr: subexpr,

  // fundamental hooks with good default behavior
  bindBlock: bindBlock,
  bindShadowScope: bindShadowScope,
  updateLocal: updateLocal,
  updateSelf: updateSelf,
  updateScope: updateScope,
  createChildScope: createChildScope,
  hasHelper: hasHelper,
  lookupHelper: lookupHelper,
  invokeHelper: invokeHelper,
  cleanupRenderNode: null,
  destroyRenderNode: null,
  willCleanupTree: null,
  didCleanupTree: null,
  willRenderNode: null,
  didRenderNode: null,

  // derived hooks
  attribute: attribute,
  block: block,
  createScope: createScope,
  element: element,
  get: get,
  inline: inline,
  range: range,
  keyword: keyword
};

},{"../htmlbars-util/morph-utils":88,"../htmlbars-util/object-utils":90,"../htmlbars-util/template-utils":93,"../morph-range/morph-list":99,"./render":64}],62:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _morphRange = require("../morph-range");

var _morphRange2 = _interopRequireDefault(_morphRange);

var guid = 1;

function HTMLBarsMorph(domHelper, contextualElement) {
  this.super$constructor(domHelper, contextualElement);

  this._state = undefined;
  this.ownerNode = null;
  this.isDirty = false;
  this.isSubtreeDirty = false;
  this.lastYielded = null;
  this.lastResult = null;
  this.lastValue = null;
  this.buildChildEnv = null;
  this.morphList = null;
  this.morphMap = null;
  this.key = null;
  this.linkedParams = null;
  this.linkedResult = null;
  this.childNodes = null;
  this.rendered = false;
  this.guid = "range" + guid++;
  this.seen = false;
}

HTMLBarsMorph.empty = function (domHelper, contextualElement) {
  var morph = new HTMLBarsMorph(domHelper, contextualElement);
  morph.clear();
  return morph;
};

HTMLBarsMorph.create = function (domHelper, contextualElement, node) {
  var morph = new HTMLBarsMorph(domHelper, contextualElement);
  morph.setNode(node);
  return morph;
};

HTMLBarsMorph.attach = function (domHelper, contextualElement, firstNode, lastNode) {
  var morph = new HTMLBarsMorph(domHelper, contextualElement);
  morph.setRange(firstNode, lastNode);
  return morph;
};

var prototype = HTMLBarsMorph.prototype = Object.create(_morphRange2.default.prototype);
prototype.constructor = HTMLBarsMorph;
prototype.super$constructor = _morphRange2.default;

prototype.getState = function () {
  if (!this._state) {
    this._state = {};
  }

  return this._state;
};

prototype.setState = function (newState) {
  /*jshint -W093 */

  return this._state = newState;
};

exports.default = HTMLBarsMorph;
module.exports = exports.default;

},{"../morph-range":98}],63:[function(require,module,exports){
exports.__esModule = true;

var _htmlbarsUtilMorphUtils = require("../htmlbars-util/morph-utils");

var _expressionVisitor = require("./expression-visitor");

/**
  Node classification:

  # Primary Statement Nodes:

  These nodes are responsible for a render node that represents a morph-range.

  * block
  * inline
  * content
  * element
  * component

  # Leaf Statement Nodes:

  This node is responsible for a render node that represents a morph-attr.

  * attribute
*/

function linkParamsAndHash(env, scope, morph, path, params, hash) {
  if (morph.linkedParams) {
    params = morph.linkedParams.params;
    hash = morph.linkedParams.hash;
  } else {
    params = params && _expressionVisitor.acceptParams(params, env, scope);
    hash = hash && _expressionVisitor.acceptHash(hash, env, scope);
  }

  _htmlbarsUtilMorphUtils.linkParams(env, scope, morph, path, params, hash);
  return [params, hash];
}

var AlwaysDirtyVisitor = {

  block: function (node, morph, env, scope, template, visitor) {
    var path = node[1];
    var params = node[2];
    var hash = node[3];
    var templateId = node[4];
    var inverseId = node[5];

    var paramsAndHash = linkParamsAndHash(env, scope, morph, path, params, hash);

    morph.isDirty = morph.isSubtreeDirty = false;
    env.hooks.block(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], templateId === null ? null : template.templates[templateId], inverseId === null ? null : template.templates[inverseId], visitor);
  },

  inline: function (node, morph, env, scope, visitor) {
    var path = node[1];
    var params = node[2];
    var hash = node[3];

    var paramsAndHash = linkParamsAndHash(env, scope, morph, path, params, hash);

    morph.isDirty = morph.isSubtreeDirty = false;
    env.hooks.inline(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], visitor);
  },

  content: function (node, morph, env, scope, visitor) {
    var path = node[1];

    morph.isDirty = morph.isSubtreeDirty = false;

    if (isHelper(env, scope, path)) {
      env.hooks.inline(morph, env, scope, path, [], {}, visitor);
      if (morph.linkedResult) {
        _htmlbarsUtilMorphUtils.linkParams(env, scope, morph, '@content-helper', [morph.linkedResult], null);
      }
      return;
    }

    var params = undefined;
    if (morph.linkedParams) {
      params = morph.linkedParams.params;
    } else {
      params = [env.hooks.get(env, scope, path)];
    }

    _htmlbarsUtilMorphUtils.linkParams(env, scope, morph, '@range', params, null);
    env.hooks.range(morph, env, scope, path, params[0], visitor);
  },

  element: function (node, morph, env, scope, visitor) {
    var path = node[1];
    var params = node[2];
    var hash = node[3];

    var paramsAndHash = linkParamsAndHash(env, scope, morph, path, params, hash);

    morph.isDirty = morph.isSubtreeDirty = false;
    env.hooks.element(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], visitor);
  },

  attribute: function (node, morph, env, scope) {
    var name = node[1];
    var value = node[2];

    var paramsAndHash = linkParamsAndHash(env, scope, morph, '@attribute', [value], null);

    morph.isDirty = morph.isSubtreeDirty = false;
    env.hooks.attribute(morph, env, scope, name, paramsAndHash[0][0]);
  },

  component: function (node, morph, env, scope, template, visitor) {
    var path = node[1];
    var attrs = node[2];
    var templateId = node[3];
    var inverseId = node[4];

    var paramsAndHash = linkParamsAndHash(env, scope, morph, path, [], attrs);
    var templates = {
      default: template.templates[templateId],
      inverse: template.templates[inverseId]
    };

    morph.isDirty = morph.isSubtreeDirty = false;
    env.hooks.component(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], templates, visitor);
  },

  attributes: function (node, morph, env, scope, parentMorph, visitor) {
    var template = node[1];

    env.hooks.attributes(morph, env, scope, template, parentMorph, visitor);
  }

};

exports.AlwaysDirtyVisitor = AlwaysDirtyVisitor;
exports.default = {
  block: function (node, morph, env, scope, template, visitor) {
    dirtyCheck(env, morph, visitor, function (visitor) {
      AlwaysDirtyVisitor.block(node, morph, env, scope, template, visitor);
    });
  },

  inline: function (node, morph, env, scope, visitor) {
    dirtyCheck(env, morph, visitor, function (visitor) {
      AlwaysDirtyVisitor.inline(node, morph, env, scope, visitor);
    });
  },

  content: function (node, morph, env, scope, visitor) {
    dirtyCheck(env, morph, visitor, function (visitor) {
      AlwaysDirtyVisitor.content(node, morph, env, scope, visitor);
    });
  },

  element: function (node, morph, env, scope, template, visitor) {
    dirtyCheck(env, morph, visitor, function (visitor) {
      AlwaysDirtyVisitor.element(node, morph, env, scope, template, visitor);
    });
  },

  attribute: function (node, morph, env, scope, template) {
    dirtyCheck(env, morph, null, function () {
      AlwaysDirtyVisitor.attribute(node, morph, env, scope, template);
    });
  },

  component: function (node, morph, env, scope, template, visitor) {
    dirtyCheck(env, morph, visitor, function (visitor) {
      AlwaysDirtyVisitor.component(node, morph, env, scope, template, visitor);
    });
  },

  attributes: function (node, morph, env, scope, parentMorph, visitor) {
    AlwaysDirtyVisitor.attributes(node, morph, env, scope, parentMorph, visitor);
  }
};

function dirtyCheck(_env, morph, visitor, callback) {
  var isDirty = morph.isDirty;
  var isSubtreeDirty = morph.isSubtreeDirty;
  var env = _env;

  if (isSubtreeDirty) {
    visitor = AlwaysDirtyVisitor;
  }

  if (isDirty || isSubtreeDirty) {
    callback(visitor);
  } else {
    if (morph.buildChildEnv) {
      env = morph.buildChildEnv(morph.getState(), env);
    }
    _htmlbarsUtilMorphUtils.validateChildMorphs(env, morph, visitor);
  }
}

function isHelper(env, scope, path) {
  return env.hooks.keywords[path] !== undefined || env.hooks.hasHelper(env, scope, path);
}

},{"../htmlbars-util/morph-utils":88,"./expression-visitor":60}],64:[function(require,module,exports){
exports.__esModule = true;
exports.default = render;
exports.RenderOptions = RenderOptions;
exports.manualElement = manualElement;
exports.attachAttributes = attachAttributes;
exports.createChildMorph = createChildMorph;
exports.getCachedFragment = getCachedFragment;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _htmlbarsUtilMorphUtils = require("../htmlbars-util/morph-utils");

var _nodeVisitor = require("./node-visitor");

var _nodeVisitor2 = _interopRequireDefault(_nodeVisitor);

var _morph = require("./morph");

var _morph2 = _interopRequireDefault(_morph);

var _htmlbarsUtilTemplateUtils = require("../htmlbars-util/template-utils");

var _htmlbarsUtilVoidTagNames = require('../htmlbars-util/void-tag-names');

var _htmlbarsUtilVoidTagNames2 = _interopRequireDefault(_htmlbarsUtilVoidTagNames);

var svgNamespace = "http://www.w3.org/2000/svg";

function render(template, env, scope, options) {
  var dom = env.dom;
  var contextualElement;

  if (options) {
    if (options.renderNode) {
      contextualElement = options.renderNode.contextualElement;
    } else if (options.contextualElement) {
      contextualElement = options.contextualElement;
    }
  }

  dom.detectNamespace(contextualElement);

  var renderResult = RenderResult.build(env, scope, template, options, contextualElement);
  renderResult.render();

  return renderResult;
}

function RenderOptions(renderNode, self, blockArguments, contextualElement) {
  this.renderNode = renderNode || null;
  this.self = self;
  this.blockArguments = blockArguments || null;
  this.contextualElement = contextualElement || null;
}

function RenderResult(env, scope, options, rootNode, ownerNode, nodes, fragment, template, shouldSetContent) {
  this.root = rootNode;
  this.fragment = fragment;

  this.nodes = nodes;
  this.template = template;
  this.statements = template.statements.slice();
  this.env = env;
  this.scope = scope;
  this.shouldSetContent = shouldSetContent;

  if (options.self !== undefined) {
    this.bindSelf(options.self);
  }
  if (options.blockArguments !== undefined) {
    this.bindLocals(options.blockArguments);
  }

  this.initializeNodes(ownerNode);
}

RenderResult.build = function (env, scope, template, options, contextualElement) {
  var dom = env.dom;
  var fragment = getCachedFragment(template, env);
  var nodes = template.buildRenderNodes(dom, fragment, contextualElement);

  var rootNode, ownerNode, shouldSetContent;

  if (options && options.renderNode) {
    rootNode = options.renderNode;
    ownerNode = rootNode.ownerNode;
    shouldSetContent = true;
  } else {
    rootNode = dom.createMorph(null, fragment.firstChild, fragment.lastChild, contextualElement);
    ownerNode = rootNode;
    rootNode.ownerNode = ownerNode;
    shouldSetContent = false;
  }

  if (rootNode.childNodes) {
    _htmlbarsUtilMorphUtils.visitChildren(rootNode.childNodes, function (node) {
      _htmlbarsUtilTemplateUtils.clearMorph(node, env, true);
    });
  }

  rootNode.childNodes = nodes;
  return new RenderResult(env, scope, options, rootNode, ownerNode, nodes, fragment, template, shouldSetContent);
};

function manualElement(tagName, attributes, _isEmpty) {
  var statements = [];

  for (var key in attributes) {
    if (typeof attributes[key] === 'string') {
      continue;
    }
    statements.push(["attribute", key, attributes[key]]);
  }

  var isEmpty = _isEmpty || _htmlbarsUtilVoidTagNames2.default[tagName];

  if (!isEmpty) {
    statements.push(['content', 'yield']);
  }

  var template = {
    arity: 0,
    cachedFragment: null,
    hasRendered: false,
    buildFragment: function buildFragment(dom) {
      var el0 = dom.createDocumentFragment();
      if (tagName === 'svg') {
        dom.setNamespace(svgNamespace);
      }
      var el1 = dom.createElement(tagName);

      for (var key in attributes) {
        if (typeof attributes[key] !== 'string') {
          continue;
        }
        dom.setAttribute(el1, key, attributes[key]);
      }

      if (!isEmpty) {
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
      }

      dom.appendChild(el0, el1);

      return el0;
    },
    buildRenderNodes: function buildRenderNodes(dom, fragment) {
      var element = dom.childAt(fragment, [0]);
      var morphs = [];

      for (var key in attributes) {
        if (typeof attributes[key] === 'string') {
          continue;
        }
        morphs.push(dom.createAttrMorph(element, key));
      }

      if (!isEmpty) {
        morphs.push(dom.createMorphAt(element, 0, 0));
      }

      return morphs;
    },
    statements: statements,
    locals: [],
    templates: []
  };

  return template;
}

function attachAttributes(attributes) {
  var statements = [];

  for (var key in attributes) {
    if (typeof attributes[key] === 'string') {
      continue;
    }
    statements.push(["attribute", key, attributes[key]]);
  }

  var template = {
    arity: 0,
    cachedFragment: null,
    hasRendered: false,
    buildFragment: function buildFragment(dom) {
      var el0 = this.element;
      if (el0.namespaceURI === "http://www.w3.org/2000/svg") {
        dom.setNamespace(svgNamespace);
      }
      for (var key in attributes) {
        if (typeof attributes[key] !== 'string') {
          continue;
        }
        dom.setAttribute(el0, key, attributes[key]);
      }

      return el0;
    },
    buildRenderNodes: function buildRenderNodes(dom) {
      var element = this.element;
      var morphs = [];

      for (var key in attributes) {
        if (typeof attributes[key] === 'string') {
          continue;
        }
        morphs.push(dom.createAttrMorph(element, key));
      }

      return morphs;
    },
    statements: statements,
    locals: [],
    templates: [],
    element: null
  };

  return template;
}

RenderResult.prototype.initializeNodes = function (ownerNode) {
  var childNodes = this.root.childNodes;

  for (var i = 0, l = childNodes.length; i < l; i++) {
    childNodes[i].ownerNode = ownerNode;
  }
};

RenderResult.prototype.render = function () {
  this.root.lastResult = this;
  this.root.rendered = true;
  this.populateNodes(_nodeVisitor.AlwaysDirtyVisitor);

  if (this.shouldSetContent && this.root.setContent) {
    this.root.setContent(this.fragment);
  }
};

RenderResult.prototype.dirty = function () {
  _htmlbarsUtilMorphUtils.visitChildren([this.root], function (node) {
    node.isDirty = true;
  });
};

RenderResult.prototype.revalidate = function (env, self, blockArguments, scope) {
  this.revalidateWith(env, scope, self, blockArguments, _nodeVisitor2.default);
};

RenderResult.prototype.rerender = function (env, self, blockArguments, scope) {
  this.revalidateWith(env, scope, self, blockArguments, _nodeVisitor.AlwaysDirtyVisitor);
};

RenderResult.prototype.revalidateWith = function (env, scope, self, blockArguments, visitor) {
  if (env !== undefined) {
    this.env = env;
  }
  if (scope !== undefined) {
    this.scope = scope;
  }
  this.updateScope();

  if (self !== undefined) {
    this.updateSelf(self);
  }
  if (blockArguments !== undefined) {
    this.updateLocals(blockArguments);
  }

  this.populateNodes(visitor);
};

RenderResult.prototype.destroy = function () {
  var rootNode = this.root;
  _htmlbarsUtilTemplateUtils.clearMorph(rootNode, this.env, true);
};

RenderResult.prototype.populateNodes = function (visitor) {
  var env = this.env;
  var scope = this.scope;
  var template = this.template;
  var nodes = this.nodes;
  var statements = this.statements;
  var i, l;

  for (i = 0, l = statements.length; i < l; i++) {
    var statement = statements[i];
    var morph = nodes[i];

    if (env.hooks.willRenderNode) {
      env.hooks.willRenderNode(morph, env, scope);
    }

    switch (statement[0]) {
      case 'block':
        visitor.block(statement, morph, env, scope, template, visitor);break;
      case 'inline':
        visitor.inline(statement, morph, env, scope, visitor);break;
      case 'content':
        visitor.content(statement, morph, env, scope, visitor);break;
      case 'element':
        visitor.element(statement, morph, env, scope, template, visitor);break;
      case 'attribute':
        visitor.attribute(statement, morph, env, scope);break;
      case 'component':
        visitor.component(statement, morph, env, scope, template, visitor);break;
    }

    if (env.hooks.didRenderNode) {
      env.hooks.didRenderNode(morph, env, scope);
    }
  }
};

RenderResult.prototype.bindScope = function () {
  this.env.hooks.bindScope(this.env, this.scope);
};

RenderResult.prototype.updateScope = function () {
  this.env.hooks.updateScope(this.env, this.scope);
};

RenderResult.prototype.bindSelf = function (self) {
  this.env.hooks.bindSelf(this.env, this.scope, self);
};

RenderResult.prototype.updateSelf = function (self) {
  this.env.hooks.updateSelf(this.env, this.scope, self);
};

RenderResult.prototype.bindLocals = function (blockArguments) {
  var localNames = this.template.locals;

  for (var i = 0, l = localNames.length; i < l; i++) {
    this.env.hooks.bindLocal(this.env, this.scope, localNames[i], blockArguments[i]);
  }
};

RenderResult.prototype.updateLocals = function (blockArguments) {
  var localNames = this.template.locals;

  for (var i = 0, l = localNames.length; i < l; i++) {
    this.env.hooks.updateLocal(this.env, this.scope, localNames[i], blockArguments[i]);
  }
};

function initializeNode(node, owner) {
  node.ownerNode = owner;
}

function createChildMorph(dom, parentMorph, contextualElement) {
  var morph = _morph2.default.empty(dom, contextualElement || parentMorph.contextualElement);
  initializeNode(morph, parentMorph.ownerNode);
  return morph;
}

function getCachedFragment(template, env) {
  var dom = env.dom,
      fragment;
  if (env.useFragmentCache && dom.canClone) {
    if (template.cachedFragment === null) {
      fragment = template.buildFragment(dom);
      if (template.hasRendered) {
        template.cachedFragment = fragment;
      } else {
        template.hasRendered = true;
      }
    }
    if (template.cachedFragment) {
      fragment = dom.cloneNode(template.cachedFragment, true);
    }
  } else if (!fragment) {
    fragment = template.buildFragment(dom);
  }

  return fragment;
}

},{"../htmlbars-util/morph-utils":88,"../htmlbars-util/template-utils":93,"../htmlbars-util/void-tag-names":94,"./morph":62,"./node-visitor":63}],65:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _htmlbarsSyntaxBuilders = require("./htmlbars-syntax/builders");

var _htmlbarsSyntaxBuilders2 = _interopRequireDefault(_htmlbarsSyntaxBuilders);

var _htmlbarsSyntaxParser = require("./htmlbars-syntax/parser");

var _htmlbarsSyntaxParser2 = _interopRequireDefault(_htmlbarsSyntaxParser);

var _htmlbarsSyntaxGenerationPrint = require("./htmlbars-syntax/generation/print");

var _htmlbarsSyntaxGenerationPrint2 = _interopRequireDefault(_htmlbarsSyntaxGenerationPrint);

var _htmlbarsSyntaxTraversalTraverse = require("./htmlbars-syntax/traversal/traverse");

var _htmlbarsSyntaxTraversalTraverse2 = _interopRequireDefault(_htmlbarsSyntaxTraversalTraverse);

var _htmlbarsSyntaxTraversalWalker = require("./htmlbars-syntax/traversal/walker");

var _htmlbarsSyntaxTraversalWalker2 = _interopRequireDefault(_htmlbarsSyntaxTraversalWalker);

exports.builders = _htmlbarsSyntaxBuilders2.default;
exports.parse = _htmlbarsSyntaxParser2.default;
exports.print = _htmlbarsSyntaxGenerationPrint2.default;
exports.traverse = _htmlbarsSyntaxTraversalTraverse2.default;
exports.Walker = _htmlbarsSyntaxTraversalWalker2.default;

},{"./htmlbars-syntax/builders":66,"./htmlbars-syntax/generation/print":67,"./htmlbars-syntax/parser":76,"./htmlbars-syntax/traversal/traverse":80,"./htmlbars-syntax/traversal/walker":81}],66:[function(require,module,exports){
exports.__esModule = true;
exports.buildMustache = buildMustache;
exports.buildBlock = buildBlock;
exports.buildElementModifier = buildElementModifier;
exports.buildPartial = buildPartial;
exports.buildComment = buildComment;
exports.buildConcat = buildConcat;
exports.buildElement = buildElement;
exports.buildComponent = buildComponent;
exports.buildAttr = buildAttr;
exports.buildText = buildText;
exports.buildSexpr = buildSexpr;
exports.buildPath = buildPath;
exports.buildString = buildString;
exports.buildBoolean = buildBoolean;
exports.buildNumber = buildNumber;
exports.buildNull = buildNull;
exports.buildUndefined = buildUndefined;
exports.buildHash = buildHash;
exports.buildPair = buildPair;
exports.buildProgram = buildProgram;
// Statements

function buildMustache(path, params, hash, raw, loc) {
  return {
    type: "MustacheStatement",
    path: buildPath(path),
    params: params || [],
    hash: hash || buildHash([]),
    escaped: !raw,
    loc: buildLoc(loc)
  };
}

function buildBlock(path, params, hash, program, inverse, loc) {
  return {
    type: "BlockStatement",
    path: buildPath(path),
    params: params || [],
    hash: hash || buildHash([]),
    program: program || null,
    inverse: inverse || null,
    loc: buildLoc(loc)
  };
}

function buildElementModifier(path, params, hash, loc) {
  return {
    type: "ElementModifierStatement",
    path: buildPath(path),
    params: params || [],
    hash: hash || buildHash([]),
    loc: buildLoc(loc)
  };
}

function buildPartial(name, params, hash, indent) {
  return {
    type: "PartialStatement",
    name: name,
    params: params || [],
    hash: hash || buildHash([]),
    indent: indent
  };
}

function buildComment(value) {
  return {
    type: "CommentStatement",
    value: value
  };
}

function buildConcat(parts) {
  return {
    type: "ConcatStatement",
    parts: parts || []
  };
}

// Nodes

function buildElement(tag, attributes, modifiers, children, loc) {
  return {
    type: "ElementNode",
    tag: tag || "",
    attributes: attributes || [],
    modifiers: modifiers || [],
    children: children || [],
    loc: buildLoc(loc)
  };
}

function buildComponent(tag, attributes, program, loc) {
  return {
    type: "ComponentNode",
    tag: tag,
    attributes: attributes,
    program: program,
    loc: buildLoc(loc),

    // this should be true only if this component node is guaranteed
    // to produce start and end points that can never change after the
    // initial render, regardless of changes to dynamic inputs. If
    // a component represents a "fragment" (any number of top-level nodes),
    // this will usually not be true.
    isStatic: false
  };
}

function buildAttr(name, value) {
  return {
    type: "AttrNode",
    name: name,
    value: value
  };
}

function buildText(chars, loc) {
  return {
    type: "TextNode",
    chars: chars || "",
    loc: buildLoc(loc)
  };
}

// Expressions

function buildSexpr(path, params, hash) {
  return {
    type: "SubExpression",
    path: buildPath(path),
    params: params || [],
    hash: hash || buildHash([])
  };
}

function buildPath(original) {
  if (typeof original === 'string') {
    return {
      type: "PathExpression",
      original: original,
      parts: original.split('.')
    };
  } else {
    return original;
  }
}

function buildString(value) {
  return {
    type: "StringLiteral",
    value: value,
    original: value
  };
}

function buildBoolean(value) {
  return {
    type: "BooleanLiteral",
    value: value,
    original: value
  };
}

function buildNumber(value) {
  return {
    type: "NumberLiteral",
    value: value,
    original: value
  };
}

function buildNull() {
  return {
    type: "NullLiteral",
    value: null,
    original: null
  };
}

function buildUndefined() {
  return {
    type: "UndefinedLiteral",
    value: undefined,
    original: undefined
  };
}

// Miscellaneous

function buildHash(pairs) {
  return {
    type: "Hash",
    pairs: pairs || []
  };
}

function buildPair(key, value) {
  return {
    type: "HashPair",
    key: key,
    value: value
  };
}

function buildProgram(body, blockParams, loc) {
  return {
    type: "Program",
    body: body || [],
    blockParams: blockParams || [],
    loc: buildLoc(loc)
  };
}

function buildSource(source) {
  return source || null;
}

function buildPosition(line, column) {
  return {
    line: typeof line === 'number' ? line : null,
    column: typeof column === 'number' ? column : null
  };
}

function buildLoc(startLine, startColumn, endLine, endColumn, source) {
  if (arguments.length === 1) {
    var loc = startLine;

    if (typeof loc === 'object') {
      return {
        source: buildSource(loc.source),
        start: buildPosition(loc.start.line, loc.start.column),
        end: buildPosition(loc.end.line, loc.end.column)
      };
    } else {
      return null;
    }
  } else {
    return {
      source: buildSource(source),
      start: buildPosition(startLine, startColumn),
      end: buildPosition(endLine, endColumn)
    };
  }
}

exports.default = {
  mustache: buildMustache,
  block: buildBlock,
  partial: buildPartial,
  comment: buildComment,
  element: buildElement,
  elementModifier: buildElementModifier,
  component: buildComponent,
  attr: buildAttr,
  text: buildText,
  sexpr: buildSexpr,
  path: buildPath,
  string: buildString,
  boolean: buildBoolean,
  number: buildNumber,
  undefined: buildUndefined,
  null: buildNull,
  concat: buildConcat,
  hash: buildHash,
  pair: buildPair,
  program: buildProgram,
  loc: buildLoc,
  pos: buildPosition
};

},{}],67:[function(require,module,exports){
exports.__esModule = true;
exports.default = build;

function build(ast) {
  if (!ast) {
    return '';
  }
  var output = [];

  switch (ast.type) {
    case 'Program':
      {
        var chainBlock = ast.chained && ast.body[0];
        if (chainBlock) {
          chainBlock.chained = true;
        }
        var body = buildEach(ast.body).join('');
        output.push(body);
      }
      break;
    case 'ElementNode':
      output.push('<', ast.tag);
      if (ast.attributes.length) {
        output.push(' ', buildEach(ast.attributes).join(' '));
      }
      if (ast.modifiers.length) {
        output.push(' ', buildEach(ast.modifiers).join(' '));
      }
      output.push('>');
      output.push.apply(output, buildEach(ast.children));
      output.push('</', ast.tag, '>');
      break;
    case 'AttrNode':
      output.push(ast.name, '=');
      var value = build(ast.value);
      if (ast.value.type === 'TextNode') {
        output.push('"', value, '"');
      } else {
        output.push(value);
      }
      break;
    case 'ConcatStatement':
      output.push('"');
      ast.parts.forEach(function (node) {
        if (node.type === 'StringLiteral') {
          output.push(node.original);
        } else {
          output.push(build(node));
        }
      });
      output.push('"');
      break;
    case 'TextNode':
      output.push(ast.chars);
      break;
    case 'MustacheStatement':
      {
        output.push(compactJoin(['{{', pathParams(ast), '}}']));
      }
      break;
    case 'ElementModifierStatement':
      {
        output.push(compactJoin(['{{', pathParams(ast), '}}']));
      }
      break;
    case 'PathExpression':
      output.push(ast.original);
      break;
    case 'SubExpression':
      {
        output.push('(', pathParams(ast), ')');
      }
      break;
    case 'BooleanLiteral':
      output.push(ast.value ? 'true' : false);
      break;
    case 'BlockStatement':
      {
        var lines = [];

        if (ast.chained) {
          lines.push(['{{else ', pathParams(ast), '}}'].join(''));
        } else {
          lines.push(openBlock(ast));
        }

        lines.push(build(ast.program));

        if (ast.inverse) {
          if (!ast.inverse.chained) {
            lines.push('{{else}}');
          }
          lines.push(build(ast.inverse));
        }

        if (!ast.chained) {
          lines.push(closeBlock(ast));
        }

        output.push(lines.join(''));
      }
      break;
    case 'PartialStatement':
      {
        output.push(compactJoin(['{{>', pathParams(ast), '}}']));
      }
      break;
    case 'CommentStatement':
      {
        output.push(compactJoin(['<!--', ast.value, '-->']));
      }
      break;
    case 'StringLiteral':
      {
        output.push('"' + ast.value + '"');
      }
      break;
    case 'NumberLiteral':
      {
        output.push(ast.value);
      }
      break;
    case 'UndefinedLiteral':
      {
        output.push('undefined');
      }
      break;
    case 'NullLiteral':
      {
        output.push('null');
      }
      break;
    case 'Hash':
      {
        output.push(ast.pairs.map(function (pair) {
          return build(pair);
        }).join(' '));
      }
      break;
    case 'HashPair':
      {
        output.push(ast.key + '=' + build(ast.value));
      }
      break;
  }
  return output.join('');
}

function compact(array) {
  var newArray = [];
  array.forEach(function (a) {
    if (typeof a !== 'undefined' && a !== null && a !== '') {
      newArray.push(a);
    }
  });
  return newArray;
}

function buildEach(asts) {
  var output = [];
  asts.forEach(function (node) {
    output.push(build(node));
  });
  return output;
}

function pathParams(ast) {
  var name = build(ast.name);
  var path = build(ast.path);
  var params = buildEach(ast.params).join(' ');
  var hash = build(ast.hash);
  return compactJoin([name, path, params, hash], ' ');
}

function compactJoin(array, delimiter) {
  return compact(array).join(delimiter || '');
}

function blockParams(block) {
  var params = block.program.blockParams;
  if (params.length) {
    return ' as |' + params.join(',') + '|';
  }
}

function openBlock(block) {
  return ['{{#', pathParams(block), blockParams(block), '}}'].join('');
}

function closeBlock(block) {
  return ['{{/', build(block.path), '}}'].join('');
}
module.exports = exports.default;

},{}],68:[function(require,module,exports){
exports.__esModule = true;
var AST = {
  Program: function (statements, blockParams, strip, locInfo) {
    this.loc = locInfo;
    this.type = 'Program';
    this.body = statements;

    this.blockParams = blockParams;
    this.strip = strip;
  },

  MustacheStatement: function (path, params, hash, escaped, strip, locInfo) {
    this.loc = locInfo;
    this.type = 'MustacheStatement';

    this.path = path;
    this.params = params || [];
    this.hash = hash;
    this.escaped = escaped;

    this.strip = strip;
  },

  BlockStatement: function (path, params, hash, program, inverse, openStrip, inverseStrip, closeStrip, locInfo) {
    this.loc = locInfo;
    this.type = 'BlockStatement';

    this.path = path;
    this.params = params || [];
    this.hash = hash;
    this.program = program;
    this.inverse = inverse;

    this.openStrip = openStrip;
    this.inverseStrip = inverseStrip;
    this.closeStrip = closeStrip;
  },

  PartialStatement: function (name, params, hash, strip, locInfo) {
    this.loc = locInfo;
    this.type = 'PartialStatement';

    this.name = name;
    this.params = params || [];
    this.hash = hash;

    this.indent = '';
    this.strip = strip;
  },

  ContentStatement: function (string, locInfo) {
    this.loc = locInfo;
    this.type = 'ContentStatement';
    this.original = this.value = string;
  },

  CommentStatement: function (comment, strip, locInfo) {
    this.loc = locInfo;
    this.type = 'CommentStatement';
    this.value = comment;

    this.strip = strip;
  },

  SubExpression: function (path, params, hash, locInfo) {
    this.loc = locInfo;

    this.type = 'SubExpression';
    this.path = path;
    this.params = params || [];
    this.hash = hash;
  },

  PathExpression: function (data, depth, parts, original, locInfo) {
    this.loc = locInfo;
    this.type = 'PathExpression';

    this.data = data;
    this.original = original;
    this.parts = parts;
    this.depth = depth;
  },

  StringLiteral: function (string, locInfo) {
    this.loc = locInfo;
    this.type = 'StringLiteral';
    this.original = this.value = string;
  },

  NumberLiteral: function (number, locInfo) {
    this.loc = locInfo;
    this.type = 'NumberLiteral';
    this.original = this.value = Number(number);
  },

  BooleanLiteral: function (bool, locInfo) {
    this.loc = locInfo;
    this.type = 'BooleanLiteral';
    this.original = this.value = bool === 'true';
  },

  UndefinedLiteral: function (locInfo) {
    this.loc = locInfo;
    this.type = 'UndefinedLiteral';
    this.original = this.value = undefined;
  },

  NullLiteral: function (locInfo) {
    this.loc = locInfo;
    this.type = 'NullLiteral';
    this.original = this.value = null;
  },

  Hash: function (pairs, locInfo) {
    this.loc = locInfo;
    this.type = 'Hash';
    this.pairs = pairs;
  },
  HashPair: function (key, value, locInfo) {
    this.loc = locInfo;
    this.type = 'HashPair';
    this.key = key;
    this.value = value;
  },

  // Public API used to evaluate derived attributes regarding AST nodes
  helpers: {
    // a mustache is definitely a helper if:
    // * it is an eligible helper, and
    // * it has at least one parameter or hash segment
    helperExpression: function (node) {
      return !!(node.type === 'SubExpression' || node.params.length || node.hash);
    },

    scopedId: function (path) {
      return (/^\.|this\b/.test(path.original)
      );
    },

    // an ID is simple if it only has one part, and that part is not
    // `..` or `this`.
    simpleId: function (path) {
      return path.parts.length === 1 && !AST.helpers.scopedId(path) && !path.depth;
    }
  }
};

// Must be exported as an object rather than the root of the module as the jison lexer
// must modify the object to operate properly.
exports.default = AST;
module.exports = exports.default;

},{}],69:[function(require,module,exports){
exports.__esModule = true;
exports.parse = parse;

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj['default'] = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _parser = require('./parser');

var _parser2 = _interopRequireDefault(_parser);

var _ast = require('./ast');

var _ast2 = _interopRequireDefault(_ast);

var _whitespaceControl = require('./whitespace-control');

var _whitespaceControl2 = _interopRequireDefault(_whitespaceControl);

var _helpers = require('./helpers');

var Helpers = _interopRequireWildcard(_helpers);

var _utils = require('../utils');

exports.parser = _parser2.default;

var yy = {};
_utils.extend(yy, Helpers, _ast2.default);

function parse(input, options) {
  // Just return if an already-compiled AST was passed in.
  if (input.type === 'Program') {
    return input;
  }

  _parser2.default.yy = yy;

  // Altering the shared object here, but this is ok as parser is a sync operation
  yy.locInfo = function (locInfo) {
    return new yy.SourceLocation(options && options.srcName, locInfo);
  };

  var strip = new _whitespaceControl2.default();
  return strip.accept(_parser2.default.parse(input));
}

},{"../utils":75,"./ast":68,"./helpers":70,"./parser":71,"./whitespace-control":73}],70:[function(require,module,exports){
exports.__esModule = true;
exports.SourceLocation = SourceLocation;
exports.id = id;
exports.stripFlags = stripFlags;
exports.stripComment = stripComment;
exports.preparePath = preparePath;
exports.prepareMustache = prepareMustache;
exports.prepareRawBlock = prepareRawBlock;
exports.prepareBlock = prepareBlock;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _exception = require('../exception');

var _exception2 = _interopRequireDefault(_exception);

function SourceLocation(source, locInfo) {
  this.source = source;
  this.start = {
    line: locInfo.first_line,
    column: locInfo.first_column
  };
  this.end = {
    line: locInfo.last_line,
    column: locInfo.last_column
  };
}

function id(token) {
  if (/^\[.*\]$/.test(token)) {
    return token.substr(1, token.length - 2);
  } else {
    return token;
  }
}

function stripFlags(open, close) {
  return {
    open: open.charAt(2) === '~',
    close: close.charAt(close.length - 3) === '~'
  };
}

function stripComment(comment) {
  return comment.replace(/^\{\{~?\!-?-?/, '').replace(/-?-?~?\}\}$/, '');
}

function preparePath(data, parts, locInfo) {
  locInfo = this.locInfo(locInfo);

  var original = data ? '@' : '',
      dig = [],
      depth = 0,
      depthString = '';

  for (var i = 0, l = parts.length; i < l; i++) {
    var part = parts[i].part,

    // If we have [] syntax then we do not treat path references as operators,
    // i.e. foo.[this] resolves to approximately context.foo['this']
    isLiteral = parts[i].original !== part;
    original += (parts[i].separator || '') + part;

    if (!isLiteral && (part === '..' || part === '.' || part === 'this')) {
      if (dig.length > 0) {
        throw new _exception2.default('Invalid path: ' + original, { loc: locInfo });
      } else if (part === '..') {
        depth++;
        depthString += '../';
      }
    } else {
      dig.push(part);
    }
  }

  return new this.PathExpression(data, depth, dig, original, locInfo);
}

function prepareMustache(path, params, hash, open, strip, locInfo) {
  // Must use charAt to support IE pre-10
  var escapeFlag = open.charAt(3) || open.charAt(2),
      escaped = escapeFlag !== '{' && escapeFlag !== '&';

  return new this.MustacheStatement(path, params, hash, escaped, strip, this.locInfo(locInfo));
}

function prepareRawBlock(openRawBlock, content, close, locInfo) {
  if (openRawBlock.path.original !== close) {
    var errorNode = { loc: openRawBlock.path.loc };

    throw new _exception2.default(openRawBlock.path.original + " doesn't match " + close, errorNode);
  }

  locInfo = this.locInfo(locInfo);
  var program = new this.Program([content], null, {}, locInfo);

  return new this.BlockStatement(openRawBlock.path, openRawBlock.params, openRawBlock.hash, program, undefined, {}, {}, {}, locInfo);
}

function prepareBlock(openBlock, program, inverseAndProgram, close, inverted, locInfo) {
  // When we are chaining inverse calls, we will not have a close path
  if (close && close.path && openBlock.path.original !== close.path.original) {
    var errorNode = { loc: openBlock.path.loc };

    throw new _exception2.default(openBlock.path.original + ' doesn\'t match ' + close.path.original, errorNode);
  }

  program.blockParams = openBlock.blockParams;

  var inverse = undefined,
      inverseStrip = undefined;

  if (inverseAndProgram) {
    if (inverseAndProgram.chain) {
      inverseAndProgram.program.body[0].closeStrip = close.strip;
    }

    inverseStrip = inverseAndProgram.strip;
    inverse = inverseAndProgram.program;
  }

  if (inverted) {
    inverted = inverse;
    inverse = program;
    program = inverted;
  }

  return new this.BlockStatement(openBlock.path, openBlock.params, openBlock.hash, program, inverse, openBlock.strip, inverseStrip, close && close.strip, this.locInfo(locInfo));
}

},{"../exception":74}],71:[function(require,module,exports){
exports.__esModule = true;
/* istanbul ignore next */
/* Jison generated parser */
var handlebars = (function () {
    var parser = { trace: function trace() {},
        yy: {},
        symbols_: { "error": 2, "root": 3, "program": 4, "EOF": 5, "program_repetition0": 6, "statement": 7, "mustache": 8, "block": 9, "rawBlock": 10, "partial": 11, "content": 12, "COMMENT": 13, "CONTENT": 14, "openRawBlock": 15, "END_RAW_BLOCK": 16, "OPEN_RAW_BLOCK": 17, "helperName": 18, "openRawBlock_repetition0": 19, "openRawBlock_option0": 20, "CLOSE_RAW_BLOCK": 21, "openBlock": 22, "block_option0": 23, "closeBlock": 24, "openInverse": 25, "block_option1": 26, "OPEN_BLOCK": 27, "openBlock_repetition0": 28, "openBlock_option0": 29, "openBlock_option1": 30, "CLOSE": 31, "OPEN_INVERSE": 32, "openInverse_repetition0": 33, "openInverse_option0": 34, "openInverse_option1": 35, "openInverseChain": 36, "OPEN_INVERSE_CHAIN": 37, "openInverseChain_repetition0": 38, "openInverseChain_option0": 39, "openInverseChain_option1": 40, "inverseAndProgram": 41, "INVERSE": 42, "inverseChain": 43, "inverseChain_option0": 44, "OPEN_ENDBLOCK": 45, "OPEN": 46, "mustache_repetition0": 47, "mustache_option0": 48, "OPEN_UNESCAPED": 49, "mustache_repetition1": 50, "mustache_option1": 51, "CLOSE_UNESCAPED": 52, "OPEN_PARTIAL": 53, "partialName": 54, "partial_repetition0": 55, "partial_option0": 56, "param": 57, "sexpr": 58, "OPEN_SEXPR": 59, "sexpr_repetition0": 60, "sexpr_option0": 61, "CLOSE_SEXPR": 62, "hash": 63, "hash_repetition_plus0": 64, "hashSegment": 65, "ID": 66, "EQUALS": 67, "blockParams": 68, "OPEN_BLOCK_PARAMS": 69, "blockParams_repetition_plus0": 70, "CLOSE_BLOCK_PARAMS": 71, "path": 72, "dataName": 73, "STRING": 74, "NUMBER": 75, "BOOLEAN": 76, "UNDEFINED": 77, "NULL": 78, "DATA": 79, "pathSegments": 80, "SEP": 81, "$accept": 0, "$end": 1 },
        terminals_: { 2: "error", 5: "EOF", 13: "COMMENT", 14: "CONTENT", 16: "END_RAW_BLOCK", 17: "OPEN_RAW_BLOCK", 21: "CLOSE_RAW_BLOCK", 27: "OPEN_BLOCK", 31: "CLOSE", 32: "OPEN_INVERSE", 37: "OPEN_INVERSE_CHAIN", 42: "INVERSE", 45: "OPEN_ENDBLOCK", 46: "OPEN", 49: "OPEN_UNESCAPED", 52: "CLOSE_UNESCAPED", 53: "OPEN_PARTIAL", 59: "OPEN_SEXPR", 62: "CLOSE_SEXPR", 66: "ID", 67: "EQUALS", 69: "OPEN_BLOCK_PARAMS", 71: "CLOSE_BLOCK_PARAMS", 74: "STRING", 75: "NUMBER", 76: "BOOLEAN", 77: "UNDEFINED", 78: "NULL", 79: "DATA", 81: "SEP" },
        productions_: [0, [3, 2], [4, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [7, 1], [12, 1], [10, 3], [15, 5], [9, 4], [9, 4], [22, 6], [25, 6], [36, 6], [41, 2], [43, 3], [43, 1], [24, 3], [8, 5], [8, 5], [11, 5], [57, 1], [57, 1], [58, 5], [63, 1], [65, 3], [68, 3], [18, 1], [18, 1], [18, 1], [18, 1], [18, 1], [18, 1], [18, 1], [54, 1], [54, 1], [73, 2], [72, 1], [80, 3], [80, 1], [6, 0], [6, 2], [19, 0], [19, 2], [20, 0], [20, 1], [23, 0], [23, 1], [26, 0], [26, 1], [28, 0], [28, 2], [29, 0], [29, 1], [30, 0], [30, 1], [33, 0], [33, 2], [34, 0], [34, 1], [35, 0], [35, 1], [38, 0], [38, 2], [39, 0], [39, 1], [40, 0], [40, 1], [44, 0], [44, 1], [47, 0], [47, 2], [48, 0], [48, 1], [50, 0], [50, 2], [51, 0], [51, 1], [55, 0], [55, 2], [56, 0], [56, 1], [60, 0], [60, 2], [61, 0], [61, 1], [64, 1], [64, 2], [70, 1], [70, 2]],
        performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {

            var $0 = $$.length - 1;
            switch (yystate) {
                case 1:
                    return $$[$0 - 1];
                    break;
                case 2:
                    this.$ = new yy.Program($$[$0], null, {}, yy.locInfo(this._$));
                    break;
                case 3:
                    this.$ = $$[$0];
                    break;
                case 4:
                    this.$ = $$[$0];
                    break;
                case 5:
                    this.$ = $$[$0];
                    break;
                case 6:
                    this.$ = $$[$0];
                    break;
                case 7:
                    this.$ = $$[$0];
                    break;
                case 8:
                    this.$ = new yy.CommentStatement(yy.stripComment($$[$0]), yy.stripFlags($$[$0], $$[$0]), yy.locInfo(this._$));
                    break;
                case 9:
                    this.$ = new yy.ContentStatement($$[$0], yy.locInfo(this._$));
                    break;
                case 10:
                    this.$ = yy.prepareRawBlock($$[$0 - 2], $$[$0 - 1], $$[$0], this._$);
                    break;
                case 11:
                    this.$ = { path: $$[$0 - 3], params: $$[$0 - 2], hash: $$[$0 - 1] };
                    break;
                case 12:
                    this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], false, this._$);
                    break;
                case 13:
                    this.$ = yy.prepareBlock($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0], true, this._$);
                    break;
                case 14:
                    this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
                    break;
                case 15:
                    this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
                    break;
                case 16:
                    this.$ = { path: $$[$0 - 4], params: $$[$0 - 3], hash: $$[$0 - 2], blockParams: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 5], $$[$0]) };
                    break;
                case 17:
                    this.$ = { strip: yy.stripFlags($$[$0 - 1], $$[$0 - 1]), program: $$[$0] };
                    break;
                case 18:
                    var inverse = yy.prepareBlock($$[$0 - 2], $$[$0 - 1], $$[$0], $$[$0], false, this._$),
                        program = new yy.Program([inverse], null, {}, yy.locInfo(this._$));
                    program.chained = true;

                    this.$ = { strip: $$[$0 - 2].strip, program: program, chain: true };

                    break;
                case 19:
                    this.$ = $$[$0];
                    break;
                case 20:
                    this.$ = { path: $$[$0 - 1], strip: yy.stripFlags($$[$0 - 2], $$[$0]) };
                    break;
                case 21:
                    this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
                    break;
                case 22:
                    this.$ = yy.prepareMustache($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], $$[$0 - 4], yy.stripFlags($$[$0 - 4], $$[$0]), this._$);
                    break;
                case 23:
                    this.$ = new yy.PartialStatement($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], yy.stripFlags($$[$0 - 4], $$[$0]), yy.locInfo(this._$));
                    break;
                case 24:
                    this.$ = $$[$0];
                    break;
                case 25:
                    this.$ = $$[$0];
                    break;
                case 26:
                    this.$ = new yy.SubExpression($$[$0 - 3], $$[$0 - 2], $$[$0 - 1], yy.locInfo(this._$));
                    break;
                case 27:
                    this.$ = new yy.Hash($$[$0], yy.locInfo(this._$));
                    break;
                case 28:
                    this.$ = new yy.HashPair(yy.id($$[$0 - 2]), $$[$0], yy.locInfo(this._$));
                    break;
                case 29:
                    this.$ = yy.id($$[$0 - 1]);
                    break;
                case 30:
                    this.$ = $$[$0];
                    break;
                case 31:
                    this.$ = $$[$0];
                    break;
                case 32:
                    this.$ = new yy.StringLiteral($$[$0], yy.locInfo(this._$));
                    break;
                case 33:
                    this.$ = new yy.NumberLiteral($$[$0], yy.locInfo(this._$));
                    break;
                case 34:
                    this.$ = new yy.BooleanLiteral($$[$0], yy.locInfo(this._$));
                    break;
                case 35:
                    this.$ = new yy.UndefinedLiteral(yy.locInfo(this._$));
                    break;
                case 36:
                    this.$ = new yy.NullLiteral(yy.locInfo(this._$));
                    break;
                case 37:
                    this.$ = $$[$0];
                    break;
                case 38:
                    this.$ = $$[$0];
                    break;
                case 39:
                    this.$ = yy.preparePath(true, $$[$0], this._$);
                    break;
                case 40:
                    this.$ = yy.preparePath(false, $$[$0], this._$);
                    break;
                case 41:
                    $$[$0 - 2].push({ part: yy.id($$[$0]), original: $$[$0], separator: $$[$0 - 1] });this.$ = $$[$0 - 2];
                    break;
                case 42:
                    this.$ = [{ part: yy.id($$[$0]), original: $$[$0] }];
                    break;
                case 43:
                    this.$ = [];
                    break;
                case 44:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 45:
                    this.$ = [];
                    break;
                case 46:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 53:
                    this.$ = [];
                    break;
                case 54:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 59:
                    this.$ = [];
                    break;
                case 60:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 65:
                    this.$ = [];
                    break;
                case 66:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 73:
                    this.$ = [];
                    break;
                case 74:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 77:
                    this.$ = [];
                    break;
                case 78:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 81:
                    this.$ = [];
                    break;
                case 82:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 85:
                    this.$ = [];
                    break;
                case 86:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 89:
                    this.$ = [$$[$0]];
                    break;
                case 90:
                    $$[$0 - 1].push($$[$0]);
                    break;
                case 91:
                    this.$ = [$$[$0]];
                    break;
                case 92:
                    $$[$0 - 1].push($$[$0]);
                    break;
            }
        },
        table: [{ 3: 1, 4: 2, 5: [2, 43], 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 1: [3] }, { 5: [1, 4] }, { 5: [2, 2], 7: 5, 8: 6, 9: 7, 10: 8, 11: 9, 12: 10, 13: [1, 11], 14: [1, 18], 15: 16, 17: [1, 21], 22: 14, 25: 15, 27: [1, 19], 32: [1, 20], 37: [2, 2], 42: [2, 2], 45: [2, 2], 46: [1, 12], 49: [1, 13], 53: [1, 17] }, { 1: [2, 1] }, { 5: [2, 44], 13: [2, 44], 14: [2, 44], 17: [2, 44], 27: [2, 44], 32: [2, 44], 37: [2, 44], 42: [2, 44], 45: [2, 44], 46: [2, 44], 49: [2, 44], 53: [2, 44] }, { 5: [2, 3], 13: [2, 3], 14: [2, 3], 17: [2, 3], 27: [2, 3], 32: [2, 3], 37: [2, 3], 42: [2, 3], 45: [2, 3], 46: [2, 3], 49: [2, 3], 53: [2, 3] }, { 5: [2, 4], 13: [2, 4], 14: [2, 4], 17: [2, 4], 27: [2, 4], 32: [2, 4], 37: [2, 4], 42: [2, 4], 45: [2, 4], 46: [2, 4], 49: [2, 4], 53: [2, 4] }, { 5: [2, 5], 13: [2, 5], 14: [2, 5], 17: [2, 5], 27: [2, 5], 32: [2, 5], 37: [2, 5], 42: [2, 5], 45: [2, 5], 46: [2, 5], 49: [2, 5], 53: [2, 5] }, { 5: [2, 6], 13: [2, 6], 14: [2, 6], 17: [2, 6], 27: [2, 6], 32: [2, 6], 37: [2, 6], 42: [2, 6], 45: [2, 6], 46: [2, 6], 49: [2, 6], 53: [2, 6] }, { 5: [2, 7], 13: [2, 7], 14: [2, 7], 17: [2, 7], 27: [2, 7], 32: [2, 7], 37: [2, 7], 42: [2, 7], 45: [2, 7], 46: [2, 7], 49: [2, 7], 53: [2, 7] }, { 5: [2, 8], 13: [2, 8], 14: [2, 8], 17: [2, 8], 27: [2, 8], 32: [2, 8], 37: [2, 8], 42: [2, 8], 45: [2, 8], 46: [2, 8], 49: [2, 8], 53: [2, 8] }, { 18: 22, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 33, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 4: 34, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 37: [2, 43], 42: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 4: 35, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 42: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 12: 36, 14: [1, 18] }, { 18: 38, 54: 37, 58: 39, 59: [1, 40], 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 5: [2, 9], 13: [2, 9], 14: [2, 9], 16: [2, 9], 17: [2, 9], 27: [2, 9], 32: [2, 9], 37: [2, 9], 42: [2, 9], 45: [2, 9], 46: [2, 9], 49: [2, 9], 53: [2, 9] }, { 18: 41, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 42, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 43, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 31: [2, 73], 47: 44, 59: [2, 73], 66: [2, 73], 74: [2, 73], 75: [2, 73], 76: [2, 73], 77: [2, 73], 78: [2, 73], 79: [2, 73] }, { 21: [2, 30], 31: [2, 30], 52: [2, 30], 59: [2, 30], 62: [2, 30], 66: [2, 30], 69: [2, 30], 74: [2, 30], 75: [2, 30], 76: [2, 30], 77: [2, 30], 78: [2, 30], 79: [2, 30] }, { 21: [2, 31], 31: [2, 31], 52: [2, 31], 59: [2, 31], 62: [2, 31], 66: [2, 31], 69: [2, 31], 74: [2, 31], 75: [2, 31], 76: [2, 31], 77: [2, 31], 78: [2, 31], 79: [2, 31] }, { 21: [2, 32], 31: [2, 32], 52: [2, 32], 59: [2, 32], 62: [2, 32], 66: [2, 32], 69: [2, 32], 74: [2, 32], 75: [2, 32], 76: [2, 32], 77: [2, 32], 78: [2, 32], 79: [2, 32] }, { 21: [2, 33], 31: [2, 33], 52: [2, 33], 59: [2, 33], 62: [2, 33], 66: [2, 33], 69: [2, 33], 74: [2, 33], 75: [2, 33], 76: [2, 33], 77: [2, 33], 78: [2, 33], 79: [2, 33] }, { 21: [2, 34], 31: [2, 34], 52: [2, 34], 59: [2, 34], 62: [2, 34], 66: [2, 34], 69: [2, 34], 74: [2, 34], 75: [2, 34], 76: [2, 34], 77: [2, 34], 78: [2, 34], 79: [2, 34] }, { 21: [2, 35], 31: [2, 35], 52: [2, 35], 59: [2, 35], 62: [2, 35], 66: [2, 35], 69: [2, 35], 74: [2, 35], 75: [2, 35], 76: [2, 35], 77: [2, 35], 78: [2, 35], 79: [2, 35] }, { 21: [2, 36], 31: [2, 36], 52: [2, 36], 59: [2, 36], 62: [2, 36], 66: [2, 36], 69: [2, 36], 74: [2, 36], 75: [2, 36], 76: [2, 36], 77: [2, 36], 78: [2, 36], 79: [2, 36] }, { 21: [2, 40], 31: [2, 40], 52: [2, 40], 59: [2, 40], 62: [2, 40], 66: [2, 40], 69: [2, 40], 74: [2, 40], 75: [2, 40], 76: [2, 40], 77: [2, 40], 78: [2, 40], 79: [2, 40], 81: [1, 45] }, { 66: [1, 32], 80: 46 }, { 21: [2, 42], 31: [2, 42], 52: [2, 42], 59: [2, 42], 62: [2, 42], 66: [2, 42], 69: [2, 42], 74: [2, 42], 75: [2, 42], 76: [2, 42], 77: [2, 42], 78: [2, 42], 79: [2, 42], 81: [2, 42] }, { 50: 47, 52: [2, 77], 59: [2, 77], 66: [2, 77], 74: [2, 77], 75: [2, 77], 76: [2, 77], 77: [2, 77], 78: [2, 77], 79: [2, 77] }, { 23: 48, 36: 50, 37: [1, 52], 41: 51, 42: [1, 53], 43: 49, 45: [2, 49] }, { 26: 54, 41: 55, 42: [1, 53], 45: [2, 51] }, { 16: [1, 56] }, { 31: [2, 81], 55: 57, 59: [2, 81], 66: [2, 81], 74: [2, 81], 75: [2, 81], 76: [2, 81], 77: [2, 81], 78: [2, 81], 79: [2, 81] }, { 31: [2, 37], 59: [2, 37], 66: [2, 37], 74: [2, 37], 75: [2, 37], 76: [2, 37], 77: [2, 37], 78: [2, 37], 79: [2, 37] }, { 31: [2, 38], 59: [2, 38], 66: [2, 38], 74: [2, 38], 75: [2, 38], 76: [2, 38], 77: [2, 38], 78: [2, 38], 79: [2, 38] }, { 18: 58, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 28: 59, 31: [2, 53], 59: [2, 53], 66: [2, 53], 69: [2, 53], 74: [2, 53], 75: [2, 53], 76: [2, 53], 77: [2, 53], 78: [2, 53], 79: [2, 53] }, { 31: [2, 59], 33: 60, 59: [2, 59], 66: [2, 59], 69: [2, 59], 74: [2, 59], 75: [2, 59], 76: [2, 59], 77: [2, 59], 78: [2, 59], 79: [2, 59] }, { 19: 61, 21: [2, 45], 59: [2, 45], 66: [2, 45], 74: [2, 45], 75: [2, 45], 76: [2, 45], 77: [2, 45], 78: [2, 45], 79: [2, 45] }, { 18: 65, 31: [2, 75], 48: 62, 57: 63, 58: 66, 59: [1, 40], 63: 64, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 66: [1, 70] }, { 21: [2, 39], 31: [2, 39], 52: [2, 39], 59: [2, 39], 62: [2, 39], 66: [2, 39], 69: [2, 39], 74: [2, 39], 75: [2, 39], 76: [2, 39], 77: [2, 39], 78: [2, 39], 79: [2, 39], 81: [1, 45] }, { 18: 65, 51: 71, 52: [2, 79], 57: 72, 58: 66, 59: [1, 40], 63: 73, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 24: 74, 45: [1, 75] }, { 45: [2, 50] }, { 4: 76, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 37: [2, 43], 42: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 45: [2, 19] }, { 18: 77, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 4: 78, 6: 3, 13: [2, 43], 14: [2, 43], 17: [2, 43], 27: [2, 43], 32: [2, 43], 45: [2, 43], 46: [2, 43], 49: [2, 43], 53: [2, 43] }, { 24: 79, 45: [1, 75] }, { 45: [2, 52] }, { 5: [2, 10], 13: [2, 10], 14: [2, 10], 17: [2, 10], 27: [2, 10], 32: [2, 10], 37: [2, 10], 42: [2, 10], 45: [2, 10], 46: [2, 10], 49: [2, 10], 53: [2, 10] }, { 18: 65, 31: [2, 83], 56: 80, 57: 81, 58: 66, 59: [1, 40], 63: 82, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 59: [2, 85], 60: 83, 62: [2, 85], 66: [2, 85], 74: [2, 85], 75: [2, 85], 76: [2, 85], 77: [2, 85], 78: [2, 85], 79: [2, 85] }, { 18: 65, 29: 84, 31: [2, 55], 57: 85, 58: 66, 59: [1, 40], 63: 86, 64: 67, 65: 68, 66: [1, 69], 69: [2, 55], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 65, 31: [2, 61], 34: 87, 57: 88, 58: 66, 59: [1, 40], 63: 89, 64: 67, 65: 68, 66: [1, 69], 69: [2, 61], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 18: 65, 20: 90, 21: [2, 47], 57: 91, 58: 66, 59: [1, 40], 63: 92, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 31: [1, 93] }, { 31: [2, 74], 59: [2, 74], 66: [2, 74], 74: [2, 74], 75: [2, 74], 76: [2, 74], 77: [2, 74], 78: [2, 74], 79: [2, 74] }, { 31: [2, 76] }, { 21: [2, 24], 31: [2, 24], 52: [2, 24], 59: [2, 24], 62: [2, 24], 66: [2, 24], 69: [2, 24], 74: [2, 24], 75: [2, 24], 76: [2, 24], 77: [2, 24], 78: [2, 24], 79: [2, 24] }, { 21: [2, 25], 31: [2, 25], 52: [2, 25], 59: [2, 25], 62: [2, 25], 66: [2, 25], 69: [2, 25], 74: [2, 25], 75: [2, 25], 76: [2, 25], 77: [2, 25], 78: [2, 25], 79: [2, 25] }, { 21: [2, 27], 31: [2, 27], 52: [2, 27], 62: [2, 27], 65: 94, 66: [1, 95], 69: [2, 27] }, { 21: [2, 89], 31: [2, 89], 52: [2, 89], 62: [2, 89], 66: [2, 89], 69: [2, 89] }, { 21: [2, 42], 31: [2, 42], 52: [2, 42], 59: [2, 42], 62: [2, 42], 66: [2, 42], 67: [1, 96], 69: [2, 42], 74: [2, 42], 75: [2, 42], 76: [2, 42], 77: [2, 42], 78: [2, 42], 79: [2, 42], 81: [2, 42] }, { 21: [2, 41], 31: [2, 41], 52: [2, 41], 59: [2, 41], 62: [2, 41], 66: [2, 41], 69: [2, 41], 74: [2, 41], 75: [2, 41], 76: [2, 41], 77: [2, 41], 78: [2, 41], 79: [2, 41], 81: [2, 41] }, { 52: [1, 97] }, { 52: [2, 78], 59: [2, 78], 66: [2, 78], 74: [2, 78], 75: [2, 78], 76: [2, 78], 77: [2, 78], 78: [2, 78], 79: [2, 78] }, { 52: [2, 80] }, { 5: [2, 12], 13: [2, 12], 14: [2, 12], 17: [2, 12], 27: [2, 12], 32: [2, 12], 37: [2, 12], 42: [2, 12], 45: [2, 12], 46: [2, 12], 49: [2, 12], 53: [2, 12] }, { 18: 98, 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 36: 50, 37: [1, 52], 41: 51, 42: [1, 53], 43: 100, 44: 99, 45: [2, 71] }, { 31: [2, 65], 38: 101, 59: [2, 65], 66: [2, 65], 69: [2, 65], 74: [2, 65], 75: [2, 65], 76: [2, 65], 77: [2, 65], 78: [2, 65], 79: [2, 65] }, { 45: [2, 17] }, { 5: [2, 13], 13: [2, 13], 14: [2, 13], 17: [2, 13], 27: [2, 13], 32: [2, 13], 37: [2, 13], 42: [2, 13], 45: [2, 13], 46: [2, 13], 49: [2, 13], 53: [2, 13] }, { 31: [1, 102] }, { 31: [2, 82], 59: [2, 82], 66: [2, 82], 74: [2, 82], 75: [2, 82], 76: [2, 82], 77: [2, 82], 78: [2, 82], 79: [2, 82] }, { 31: [2, 84] }, { 18: 65, 57: 104, 58: 66, 59: [1, 40], 61: 103, 62: [2, 87], 63: 105, 64: 67, 65: 68, 66: [1, 69], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 30: 106, 31: [2, 57], 68: 107, 69: [1, 108] }, { 31: [2, 54], 59: [2, 54], 66: [2, 54], 69: [2, 54], 74: [2, 54], 75: [2, 54], 76: [2, 54], 77: [2, 54], 78: [2, 54], 79: [2, 54] }, { 31: [2, 56], 69: [2, 56] }, { 31: [2, 63], 35: 109, 68: 110, 69: [1, 108] }, { 31: [2, 60], 59: [2, 60], 66: [2, 60], 69: [2, 60], 74: [2, 60], 75: [2, 60], 76: [2, 60], 77: [2, 60], 78: [2, 60], 79: [2, 60] }, { 31: [2, 62], 69: [2, 62] }, { 21: [1, 111] }, { 21: [2, 46], 59: [2, 46], 66: [2, 46], 74: [2, 46], 75: [2, 46], 76: [2, 46], 77: [2, 46], 78: [2, 46], 79: [2, 46] }, { 21: [2, 48] }, { 5: [2, 21], 13: [2, 21], 14: [2, 21], 17: [2, 21], 27: [2, 21], 32: [2, 21], 37: [2, 21], 42: [2, 21], 45: [2, 21], 46: [2, 21], 49: [2, 21], 53: [2, 21] }, { 21: [2, 90], 31: [2, 90], 52: [2, 90], 62: [2, 90], 66: [2, 90], 69: [2, 90] }, { 67: [1, 96] }, { 18: 65, 57: 112, 58: 66, 59: [1, 40], 66: [1, 32], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 5: [2, 22], 13: [2, 22], 14: [2, 22], 17: [2, 22], 27: [2, 22], 32: [2, 22], 37: [2, 22], 42: [2, 22], 45: [2, 22], 46: [2, 22], 49: [2, 22], 53: [2, 22] }, { 31: [1, 113] }, { 45: [2, 18] }, { 45: [2, 72] }, { 18: 65, 31: [2, 67], 39: 114, 57: 115, 58: 66, 59: [1, 40], 63: 116, 64: 67, 65: 68, 66: [1, 69], 69: [2, 67], 72: 23, 73: 24, 74: [1, 25], 75: [1, 26], 76: [1, 27], 77: [1, 28], 78: [1, 29], 79: [1, 31], 80: 30 }, { 5: [2, 23], 13: [2, 23], 14: [2, 23], 17: [2, 23], 27: [2, 23], 32: [2, 23], 37: [2, 23], 42: [2, 23], 45: [2, 23], 46: [2, 23], 49: [2, 23], 53: [2, 23] }, { 62: [1, 117] }, { 59: [2, 86], 62: [2, 86], 66: [2, 86], 74: [2, 86], 75: [2, 86], 76: [2, 86], 77: [2, 86], 78: [2, 86], 79: [2, 86] }, { 62: [2, 88] }, { 31: [1, 118] }, { 31: [2, 58] }, { 66: [1, 120], 70: 119 }, { 31: [1, 121] }, { 31: [2, 64] }, { 14: [2, 11] }, { 21: [2, 28], 31: [2, 28], 52: [2, 28], 62: [2, 28], 66: [2, 28], 69: [2, 28] }, { 5: [2, 20], 13: [2, 20], 14: [2, 20], 17: [2, 20], 27: [2, 20], 32: [2, 20], 37: [2, 20], 42: [2, 20], 45: [2, 20], 46: [2, 20], 49: [2, 20], 53: [2, 20] }, { 31: [2, 69], 40: 122, 68: 123, 69: [1, 108] }, { 31: [2, 66], 59: [2, 66], 66: [2, 66], 69: [2, 66], 74: [2, 66], 75: [2, 66], 76: [2, 66], 77: [2, 66], 78: [2, 66], 79: [2, 66] }, { 31: [2, 68], 69: [2, 68] }, { 21: [2, 26], 31: [2, 26], 52: [2, 26], 59: [2, 26], 62: [2, 26], 66: [2, 26], 69: [2, 26], 74: [2, 26], 75: [2, 26], 76: [2, 26], 77: [2, 26], 78: [2, 26], 79: [2, 26] }, { 13: [2, 14], 14: [2, 14], 17: [2, 14], 27: [2, 14], 32: [2, 14], 37: [2, 14], 42: [2, 14], 45: [2, 14], 46: [2, 14], 49: [2, 14], 53: [2, 14] }, { 66: [1, 125], 71: [1, 124] }, { 66: [2, 91], 71: [2, 91] }, { 13: [2, 15], 14: [2, 15], 17: [2, 15], 27: [2, 15], 32: [2, 15], 42: [2, 15], 45: [2, 15], 46: [2, 15], 49: [2, 15], 53: [2, 15] }, { 31: [1, 126] }, { 31: [2, 70] }, { 31: [2, 29] }, { 66: [2, 92], 71: [2, 92] }, { 13: [2, 16], 14: [2, 16], 17: [2, 16], 27: [2, 16], 32: [2, 16], 37: [2, 16], 42: [2, 16], 45: [2, 16], 46: [2, 16], 49: [2, 16], 53: [2, 16] }],
        defaultActions: { 4: [2, 1], 49: [2, 50], 51: [2, 19], 55: [2, 52], 64: [2, 76], 73: [2, 80], 78: [2, 17], 82: [2, 84], 92: [2, 48], 99: [2, 18], 100: [2, 72], 105: [2, 88], 107: [2, 58], 110: [2, 64], 111: [2, 11], 123: [2, 70], 124: [2, 29] },
        parseError: function parseError(str, hash) {
            throw new Error(str);
        },
        parse: function parse(input) {
            var self = this,
                stack = [0],
                vstack = [null],
                lstack = [],
                table = this.table,
                yytext = "",
                yylineno = 0,
                yyleng = 0,
                recovering = 0,
                TERROR = 2,
                EOF = 1;
            this.lexer.setInput(input);
            this.lexer.yy = this.yy;
            this.yy.lexer = this.lexer;
            this.yy.parser = this;
            if (typeof this.lexer.yylloc == "undefined") this.lexer.yylloc = {};
            var yyloc = this.lexer.yylloc;
            lstack.push(yyloc);
            var ranges = this.lexer.options && this.lexer.options.ranges;
            if (typeof this.yy.parseError === "function") this.parseError = this.yy.parseError;
            function popStack(n) {
                stack.length = stack.length - 2 * n;
                vstack.length = vstack.length - n;
                lstack.length = lstack.length - n;
            }
            function lex() {
                var token;
                token = self.lexer.lex() || 1;
                if (typeof token !== "number") {
                    token = self.symbols_[token] || token;
                }
                return token;
            }
            var symbol,
                preErrorSymbol,
                state,
                action,
                a,
                r,
                yyval = {},
                p,
                len,
                newState,
                expected;
            while (true) {
                state = stack[stack.length - 1];
                if (this.defaultActions[state]) {
                    action = this.defaultActions[state];
                } else {
                    if (symbol === null || typeof symbol == "undefined") {
                        symbol = lex();
                    }
                    action = table[state] && table[state][symbol];
                }
                if (typeof action === "undefined" || !action.length || !action[0]) {
                    var errStr = "";
                    if (!recovering) {
                        expected = [];
                        for (p in table[state]) if (this.terminals_[p] && p > 2) {
                            expected.push("'" + this.terminals_[p] + "'");
                        }
                        if (this.lexer.showPosition) {
                            errStr = "Parse error on line " + (yylineno + 1) + ":\n" + this.lexer.showPosition() + "\nExpecting " + expected.join(", ") + ", got '" + (this.terminals_[symbol] || symbol) + "'";
                        } else {
                            errStr = "Parse error on line " + (yylineno + 1) + ": Unexpected " + (symbol == 1 ? "end of input" : "'" + (this.terminals_[symbol] || symbol) + "'");
                        }
                        this.parseError(errStr, { text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected });
                    }
                }
                if (action[0] instanceof Array && action.length > 1) {
                    throw new Error("Parse Error: multiple actions possible at state: " + state + ", token: " + symbol);
                }
                switch (action[0]) {
                    case 1:
                        stack.push(symbol);
                        vstack.push(this.lexer.yytext);
                        lstack.push(this.lexer.yylloc);
                        stack.push(action[1]);
                        symbol = null;
                        if (!preErrorSymbol) {
                            yyleng = this.lexer.yyleng;
                            yytext = this.lexer.yytext;
                            yylineno = this.lexer.yylineno;
                            yyloc = this.lexer.yylloc;
                            if (recovering > 0) recovering--;
                        } else {
                            symbol = preErrorSymbol;
                            preErrorSymbol = null;
                        }
                        break;
                    case 2:
                        len = this.productions_[action[1]][1];
                        yyval.$ = vstack[vstack.length - len];
                        yyval._$ = { first_line: lstack[lstack.length - (len || 1)].first_line, last_line: lstack[lstack.length - 1].last_line, first_column: lstack[lstack.length - (len || 1)].first_column, last_column: lstack[lstack.length - 1].last_column };
                        if (ranges) {
                            yyval._$.range = [lstack[lstack.length - (len || 1)].range[0], lstack[lstack.length - 1].range[1]];
                        }
                        r = this.performAction.call(yyval, yytext, yyleng, yylineno, this.yy, action[1], vstack, lstack);
                        if (typeof r !== "undefined") {
                            return r;
                        }
                        if (len) {
                            stack = stack.slice(0, -1 * len * 2);
                            vstack = vstack.slice(0, -1 * len);
                            lstack = lstack.slice(0, -1 * len);
                        }
                        stack.push(this.productions_[action[1]][0]);
                        vstack.push(yyval.$);
                        lstack.push(yyval._$);
                        newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                        stack.push(newState);
                        break;
                    case 3:
                        return true;
                }
            }
            return true;
        }
    };
    /* Jison generated lexer */
    var lexer = (function () {
        var lexer = { EOF: 1,
            parseError: function parseError(str, hash) {
                if (this.yy.parser) {
                    this.yy.parser.parseError(str, hash);
                } else {
                    throw new Error(str);
                }
            },
            setInput: function (input) {
                this._input = input;
                this._more = this._less = this.done = false;
                this.yylineno = this.yyleng = 0;
                this.yytext = this.matched = this.match = '';
                this.conditionStack = ['INITIAL'];
                this.yylloc = { first_line: 1, first_column: 0, last_line: 1, last_column: 0 };
                if (this.options.ranges) this.yylloc.range = [0, 0];
                this.offset = 0;
                return this;
            },
            input: function () {
                var ch = this._input[0];
                this.yytext += ch;
                this.yyleng++;
                this.offset++;
                this.match += ch;
                this.matched += ch;
                var lines = ch.match(/(?:\r\n?|\n).*/g);
                if (lines) {
                    this.yylineno++;
                    this.yylloc.last_line++;
                } else {
                    this.yylloc.last_column++;
                }
                if (this.options.ranges) this.yylloc.range[1]++;

                this._input = this._input.slice(1);
                return ch;
            },
            unput: function (ch) {
                var len = ch.length;
                var lines = ch.split(/(?:\r\n?|\n)/g);

                this._input = ch + this._input;
                this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
                //this.yyleng -= len;
                this.offset -= len;
                var oldLines = this.match.split(/(?:\r\n?|\n)/g);
                this.match = this.match.substr(0, this.match.length - 1);
                this.matched = this.matched.substr(0, this.matched.length - 1);

                if (lines.length - 1) this.yylineno -= lines.length - 1;
                var r = this.yylloc.range;

                this.yylloc = { first_line: this.yylloc.first_line,
                    last_line: this.yylineno + 1,
                    first_column: this.yylloc.first_column,
                    last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
                };

                if (this.options.ranges) {
                    this.yylloc.range = [r[0], r[0] + this.yyleng - len];
                }
                return this;
            },
            more: function () {
                this._more = true;
                return this;
            },
            less: function (n) {
                this.unput(this.match.slice(n));
            },
            pastInput: function () {
                var past = this.matched.substr(0, this.matched.length - this.match.length);
                return (past.length > 20 ? '...' : '') + past.substr(-20).replace(/\n/g, "");
            },
            upcomingInput: function () {
                var next = this.match;
                if (next.length < 20) {
                    next += this._input.substr(0, 20 - next.length);
                }
                return (next.substr(0, 20) + (next.length > 20 ? '...' : '')).replace(/\n/g, "");
            },
            showPosition: function () {
                var pre = this.pastInput();
                var c = new Array(pre.length + 1).join("-");
                return pre + this.upcomingInput() + "\n" + c + "^";
            },
            next: function () {
                if (this.done) {
                    return this.EOF;
                }
                if (!this._input) this.done = true;

                var token, match, tempMatch, index, col, lines;
                if (!this._more) {
                    this.yytext = '';
                    this.match = '';
                }
                var rules = this._currentRules();
                for (var i = 0; i < rules.length; i++) {
                    tempMatch = this._input.match(this.rules[rules[i]]);
                    if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                        match = tempMatch;
                        index = i;
                        if (!this.options.flex) break;
                    }
                }
                if (match) {
                    lines = match[0].match(/(?:\r\n?|\n).*/g);
                    if (lines) this.yylineno += lines.length;
                    this.yylloc = { first_line: this.yylloc.last_line,
                        last_line: this.yylineno + 1,
                        first_column: this.yylloc.last_column,
                        last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length };
                    this.yytext += match[0];
                    this.match += match[0];
                    this.matches = match;
                    this.yyleng = this.yytext.length;
                    if (this.options.ranges) {
                        this.yylloc.range = [this.offset, this.offset += this.yyleng];
                    }
                    this._more = false;
                    this._input = this._input.slice(match[0].length);
                    this.matched += match[0];
                    token = this.performAction.call(this, this.yy, this, rules[index], this.conditionStack[this.conditionStack.length - 1]);
                    if (this.done && this._input) this.done = false;
                    if (token) return token;else return;
                }
                if (this._input === "") {
                    return this.EOF;
                } else {
                    return this.parseError('Lexical error on line ' + (this.yylineno + 1) + '. Unrecognized text.\n' + this.showPosition(), { text: "", token: null, line: this.yylineno });
                }
            },
            lex: function lex() {
                var r = this.next();
                if (typeof r !== 'undefined') {
                    return r;
                } else {
                    return this.lex();
                }
            },
            begin: function begin(condition) {
                this.conditionStack.push(condition);
            },
            popState: function popState() {
                return this.conditionStack.pop();
            },
            _currentRules: function _currentRules() {
                return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
            },
            topState: function () {
                return this.conditionStack[this.conditionStack.length - 2];
            },
            pushState: function begin(condition) {
                this.begin(condition);
            } };
        lexer.options = {};
        lexer.performAction = function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {

            function strip(start, end) {
                return yy_.yytext = yy_.yytext.substr(start, yy_.yyleng - end);
            }

            var YYSTATE = YY_START;
            switch ($avoiding_name_collisions) {
                case 0:
                    if (yy_.yytext.slice(-2) === "\\\\") {
                        strip(0, 1);
                        this.begin("mu");
                    } else if (yy_.yytext.slice(-1) === "\\") {
                        strip(0, 1);
                        this.begin("emu");
                    } else {
                        this.begin("mu");
                    }
                    if (yy_.yytext) return 14;

                    break;
                case 1:
                    return 14;
                    break;
                case 2:
                    this.popState();
                    return 14;

                    break;
                case 3:
                    yy_.yytext = yy_.yytext.substr(5, yy_.yyleng - 9);
                    this.popState();
                    return 16;

                    break;
                case 4:
                    return 14;
                    break;
                case 5:
                    this.popState();
                    return 13;

                    break;
                case 6:
                    return 59;
                    break;
                case 7:
                    return 62;
                    break;
                case 8:
                    return 17;
                    break;
                case 9:
                    this.popState();
                    this.begin('raw');
                    return 21;

                    break;
                case 10:
                    return 53;
                    break;
                case 11:
                    return 27;
                    break;
                case 12:
                    return 45;
                    break;
                case 13:
                    this.popState();return 42;
                    break;
                case 14:
                    this.popState();return 42;
                    break;
                case 15:
                    return 32;
                    break;
                case 16:
                    return 37;
                    break;
                case 17:
                    return 49;
                    break;
                case 18:
                    return 46;
                    break;
                case 19:
                    this.unput(yy_.yytext);
                    this.popState();
                    this.begin('com');

                    break;
                case 20:
                    this.popState();
                    return 13;

                    break;
                case 21:
                    return 46;
                    break;
                case 22:
                    return 67;
                    break;
                case 23:
                    return 66;
                    break;
                case 24:
                    return 66;
                    break;
                case 25:
                    return 81;
                    break;
                case 26:
                    // ignore whitespace
                    break;
                case 27:
                    this.popState();return 52;
                    break;
                case 28:
                    this.popState();return 31;
                    break;
                case 29:
                    yy_.yytext = strip(1, 2).replace(/\\"/g, '"');return 74;
                    break;
                case 30:
                    yy_.yytext = strip(1, 2).replace(/\\'/g, "'");return 74;
                    break;
                case 31:
                    return 79;
                    break;
                case 32:
                    return 76;
                    break;
                case 33:
                    return 76;
                    break;
                case 34:
                    return 77;
                    break;
                case 35:
                    return 78;
                    break;
                case 36:
                    return 75;
                    break;
                case 37:
                    return 69;
                    break;
                case 38:
                    return 71;
                    break;
                case 39:
                    return 66;
                    break;
                case 40:
                    return 66;
                    break;
                case 41:
                    return 'INVALID';
                    break;
                case 42:
                    return 5;
                    break;
            }
        };
        lexer.rules = [/^(?:[^\x00]*?(?=(\{\{)))/, /^(?:[^\x00]+)/, /^(?:[^\x00]{2,}?(?=(\{\{|\\\{\{|\\\\\{\{|$)))/, /^(?:\{\{\{\{\/[^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=[=}\s\/.])\}\}\}\})/, /^(?:[^\x00]*?(?=(\{\{\{\{\/)))/, /^(?:[\s\S]*?--(~)?\}\})/, /^(?:\()/, /^(?:\))/, /^(?:\{\{\{\{)/, /^(?:\}\}\}\})/, /^(?:\{\{(~)?>)/, /^(?:\{\{(~)?#)/, /^(?:\{\{(~)?\/)/, /^(?:\{\{(~)?\^\s*(~)?\}\})/, /^(?:\{\{(~)?\s*else\s*(~)?\}\})/, /^(?:\{\{(~)?\^)/, /^(?:\{\{(~)?\s*else\b)/, /^(?:\{\{(~)?\{)/, /^(?:\{\{(~)?&)/, /^(?:\{\{(~)?!--)/, /^(?:\{\{(~)?![\s\S]*?\}\})/, /^(?:\{\{(~)?)/, /^(?:=)/, /^(?:\.\.)/, /^(?:\.(?=([=~}\s\/.)|])))/, /^(?:[\/.])/, /^(?:\s+)/, /^(?:\}(~)?\}\})/, /^(?:(~)?\}\})/, /^(?:"(\\["]|[^"])*")/, /^(?:'(\\[']|[^'])*')/, /^(?:@)/, /^(?:true(?=([~}\s)])))/, /^(?:false(?=([~}\s)])))/, /^(?:undefined(?=([~}\s)])))/, /^(?:null(?=([~}\s)])))/, /^(?:-?[0-9]+(?:\.[0-9]+)?(?=([~}\s)])))/, /^(?:as\s+\|)/, /^(?:\|)/, /^(?:([^\s!"#%-,\.\/;->@\[-\^`\{-~]+(?=([=~}\s\/.)|]))))/, /^(?:\[[^\]]*\])/, /^(?:.)/, /^(?:$)/];
        lexer.conditions = { "mu": { "rules": [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42], "inclusive": false }, "emu": { "rules": [2], "inclusive": false }, "com": { "rules": [5], "inclusive": false }, "raw": { "rules": [3, 4], "inclusive": false }, "INITIAL": { "rules": [0, 1, 42], "inclusive": true } };
        return lexer;
    })();
    parser.lexer = lexer;
    function Parser() {
        this.yy = {};
    }Parser.prototype = parser;parser.Parser = Parser;
    return new Parser();
})();exports.default = handlebars;
module.exports = exports.default;

},{}],72:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _exception = require('../exception');

var _exception2 = _interopRequireDefault(_exception);

var _ast = require('./ast');

var _ast2 = _interopRequireDefault(_ast);

function Visitor() {
  this.parents = [];
}

Visitor.prototype = {
  constructor: Visitor,
  mutating: false,

  // Visits a given value. If mutating, will replace the value if necessary.
  acceptKey: function (node, name) {
    var value = this.accept(node[name]);
    if (this.mutating) {
      // Hacky sanity check:
      if (value && (!value.type || !_ast2.default[value.type])) {
        throw new _exception2.default('Unexpected node type "' + value.type + '" found when accepting ' + name + ' on ' + node.type);
      }
      node[name] = value;
    }
  },

  // Performs an accept operation with added sanity check to ensure
  // required keys are not removed.
  acceptRequired: function (node, name) {
    this.acceptKey(node, name);

    if (!node[name]) {
      throw new _exception2.default(node.type + ' requires ' + name);
    }
  },

  // Traverses a given array. If mutating, empty respnses will be removed
  // for child elements.
  acceptArray: function (array) {
    for (var i = 0, l = array.length; i < l; i++) {
      this.acceptKey(array, i);

      if (!array[i]) {
        array.splice(i, 1);
        i--;
        l--;
      }
    }
  },

  accept: function (object) {
    if (!object) {
      return;
    }

    if (this.current) {
      this.parents.unshift(this.current);
    }
    this.current = object;

    var ret = this[object.type](object);

    this.current = this.parents.shift();

    if (!this.mutating || ret) {
      return ret;
    } else if (ret !== false) {
      return object;
    }
  },

  Program: function (program) {
    this.acceptArray(program.body);
  },

  MustacheStatement: function (mustache) {
    this.acceptRequired(mustache, 'path');
    this.acceptArray(mustache.params);
    this.acceptKey(mustache, 'hash');
  },

  BlockStatement: function (block) {
    this.acceptRequired(block, 'path');
    this.acceptArray(block.params);
    this.acceptKey(block, 'hash');

    this.acceptKey(block, 'program');
    this.acceptKey(block, 'inverse');
  },

  PartialStatement: function (partial) {
    this.acceptRequired(partial, 'name');
    this.acceptArray(partial.params);
    this.acceptKey(partial, 'hash');
  },

  ContentStatement: function () /* content */{},
  CommentStatement: function () /* comment */{},

  SubExpression: function (sexpr) {
    this.acceptRequired(sexpr, 'path');
    this.acceptArray(sexpr.params);
    this.acceptKey(sexpr, 'hash');
  },

  PathExpression: function () /* path */{},

  StringLiteral: function () /* string */{},
  NumberLiteral: function () /* number */{},
  BooleanLiteral: function () /* bool */{},
  UndefinedLiteral: function () /* literal */{},
  NullLiteral: function () /* literal */{},

  Hash: function (hash) {
    this.acceptArray(hash.pairs);
  },
  HashPair: function (pair) {
    this.acceptRequired(pair, 'value');
  }
};

exports.default = Visitor;
module.exports = exports.default;

},{"../exception":74,"./ast":68}],73:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _visitor = require('./visitor');

var _visitor2 = _interopRequireDefault(_visitor);

function WhitespaceControl() {}
WhitespaceControl.prototype = new _visitor2.default();

WhitespaceControl.prototype.Program = function (program) {
  var isRoot = !this.isRootSeen;
  this.isRootSeen = true;

  var body = program.body;
  for (var i = 0, l = body.length; i < l; i++) {
    var current = body[i],
        strip = this.accept(current);

    if (!strip) {
      continue;
    }

    var _isPrevWhitespace = isPrevWhitespace(body, i, isRoot),
        _isNextWhitespace = isNextWhitespace(body, i, isRoot),
        openStandalone = strip.openStandalone && _isPrevWhitespace,
        closeStandalone = strip.closeStandalone && _isNextWhitespace,
        inlineStandalone = strip.inlineStandalone && _isPrevWhitespace && _isNextWhitespace;

    if (strip.close) {
      omitRight(body, i, true);
    }
    if (strip.open) {
      omitLeft(body, i, true);
    }

    if (inlineStandalone) {
      omitRight(body, i);

      if (omitLeft(body, i)) {
        // If we are on a standalone node, save the indent info for partials
        if (current.type === 'PartialStatement') {
          // Pull out the whitespace from the final line
          current.indent = /([ \t]+$)/.exec(body[i - 1].original)[1];
        }
      }
    }
    if (openStandalone) {
      omitRight((current.program || current.inverse).body);

      // Strip out the previous content node if it's whitespace only
      omitLeft(body, i);
    }
    if (closeStandalone) {
      // Always strip the next node
      omitRight(body, i);

      omitLeft((current.inverse || current.program).body);
    }
  }

  return program;
};
WhitespaceControl.prototype.BlockStatement = function (block) {
  this.accept(block.program);
  this.accept(block.inverse);

  // Find the inverse program that is involed with whitespace stripping.
  var program = block.program || block.inverse,
      inverse = block.program && block.inverse,
      firstInverse = inverse,
      lastInverse = inverse;

  if (inverse && inverse.chained) {
    firstInverse = inverse.body[0].program;

    // Walk the inverse chain to find the last inverse that is actually in the chain.
    while (lastInverse.chained) {
      lastInverse = lastInverse.body[lastInverse.body.length - 1].program;
    }
  }

  var strip = {
    open: block.openStrip.open,
    close: block.closeStrip.close,

    // Determine the standalone candiacy. Basically flag our content as being possibly standalone
    // so our parent can determine if we actually are standalone
    openStandalone: isNextWhitespace(program.body),
    closeStandalone: isPrevWhitespace((firstInverse || program).body)
  };

  if (block.openStrip.close) {
    omitRight(program.body, null, true);
  }

  if (inverse) {
    var inverseStrip = block.inverseStrip;

    if (inverseStrip.open) {
      omitLeft(program.body, null, true);
    }

    if (inverseStrip.close) {
      omitRight(firstInverse.body, null, true);
    }
    if (block.closeStrip.open) {
      omitLeft(lastInverse.body, null, true);
    }

    // Find standalone else statments
    if (isPrevWhitespace(program.body) && isNextWhitespace(firstInverse.body)) {
      omitLeft(program.body);
      omitRight(firstInverse.body);
    }
  } else if (block.closeStrip.open) {
    omitLeft(program.body, null, true);
  }

  return strip;
};

WhitespaceControl.prototype.MustacheStatement = function (mustache) {
  return mustache.strip;
};

WhitespaceControl.prototype.PartialStatement = WhitespaceControl.prototype.CommentStatement = function (node) {
  /* istanbul ignore next */
  var strip = node.strip || {};
  return {
    inlineStandalone: true,
    open: strip.open,
    close: strip.close
  };
};

function isPrevWhitespace(body, i, isRoot) {
  if (i === undefined) {
    i = body.length;
  }

  // Nodes that end with newlines are considered whitespace (but are special
  // cased for strip operations)
  var prev = body[i - 1],
      sibling = body[i - 2];
  if (!prev) {
    return isRoot;
  }

  if (prev.type === 'ContentStatement') {
    return (sibling || !isRoot ? /\r?\n\s*?$/ : /(^|\r?\n)\s*?$/).test(prev.original);
  }
}
function isNextWhitespace(body, i, isRoot) {
  if (i === undefined) {
    i = -1;
  }

  var next = body[i + 1],
      sibling = body[i + 2];
  if (!next) {
    return isRoot;
  }

  if (next.type === 'ContentStatement') {
    return (sibling || !isRoot ? /^\s*?\r?\n/ : /^\s*?(\r?\n|$)/).test(next.original);
  }
}

// Marks the node to the right of the position as omitted.
// I.e. {{foo}}' ' will mark the ' ' node as omitted.
//
// If i is undefined, then the first child will be marked as such.
//
// If mulitple is truthy then all whitespace will be stripped out until non-whitespace
// content is met.
function omitRight(body, i, multiple) {
  var current = body[i == null ? 0 : i + 1];
  if (!current || current.type !== 'ContentStatement' || !multiple && current.rightStripped) {
    return;
  }

  var original = current.value;
  current.value = current.value.replace(multiple ? /^\s+/ : /^[ \t]*\r?\n?/, '');
  current.rightStripped = current.value !== original;
}

// Marks the node to the left of the position as omitted.
// I.e. ' '{{foo}} will mark the ' ' node as omitted.
//
// If i is undefined then the last child will be marked as such.
//
// If mulitple is truthy then all whitespace will be stripped out until non-whitespace
// content is met.
function omitLeft(body, i, multiple) {
  var current = body[i == null ? body.length - 1 : i - 1];
  if (!current || current.type !== 'ContentStatement' || !multiple && current.leftStripped) {
    return;
  }

  // We omit the last node if it's whitespace only and not preceeded by a non-content node.
  var original = current.value;
  current.value = current.value.replace(multiple ? /\s+$/ : /[ \t]+$/, '');
  current.leftStripped = current.value !== original;
  return current.leftStripped;
}

exports.default = WhitespaceControl;
module.exports = exports.default;

},{"./visitor":72}],74:[function(require,module,exports){
exports.__esModule = true;

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var loc = node && node.loc,
      line = undefined,
      column = undefined;
  if (loc) {
    line = loc.start.line;
    column = loc.start.column;

    message += ' - ' + line + ':' + column;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, Exception);
  }

  if (loc) {
    this.lineNumber = line;
    this.column = column;
  }
}

Exception.prototype = new Error();

exports.default = Exception;
module.exports = exports.default;

},{}],75:[function(require,module,exports){
exports.__esModule = true;
exports.extend = extend;
exports.indexOf = indexOf;
exports.escapeExpression = escapeExpression;
exports.isEmpty = isEmpty;
exports.blockParams = blockParams;
exports.appendContextPath = appendContextPath;
var escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;'
};

var badChars = /[&<>"'`]/g,
    possible = /[&<>"'`]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

var toString = Object.prototype.toString;

exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
/*eslint-disable func-style, no-var */
var isFunction = function (value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  exports.isFunction = isFunction = function (value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
var isFunction;
exports.isFunction = isFunction;
/*eslint-enable func-style, no-var */

/* istanbul ignore next */
var isArray = Array.isArray || function (value) {
  return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
};

exports.isArray = isArray;
// Older IE versions do not directly support indexOf so we must implement our own, sadly.

function indexOf(array, value) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i] === value) {
      return i;
    }
  }
  return -1;
}

function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML();
    } else if (string == null) {
      return '';
    } else if (!string) {
      return string + '';
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = '' + string;
  }

  if (!possible.test(string)) {
    return string;
  }
  return string.replace(badChars, escapeChar);
}

function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

function blockParams(params, ids) {
  params.path = ids;
  return params;
}

function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}

},{}],76:[function(require,module,exports){
exports.__esModule = true;
exports.preprocess = preprocess;
exports.Parser = Parser;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj["default"] = obj; return newObj; } }

var _handlebarsCompilerBase = require("./handlebars/compiler/base");

var _htmlbarsSyntax = require("../htmlbars-syntax");

var syntax = _interopRequireWildcard(_htmlbarsSyntax);

var _simpleHtmlTokenizerEventedTokenizer = require("../simple-html-tokenizer/evented-tokenizer");

var _simpleHtmlTokenizerEventedTokenizer2 = _interopRequireDefault(_simpleHtmlTokenizerEventedTokenizer);

var _simpleHtmlTokenizerEntityParser = require("../simple-html-tokenizer/entity-parser");

var _simpleHtmlTokenizerEntityParser2 = _interopRequireDefault(_simpleHtmlTokenizerEntityParser);

var _simpleHtmlTokenizerHtml5NamedCharRefs = require('../simple-html-tokenizer/html5-named-char-refs');

var _simpleHtmlTokenizerHtml5NamedCharRefs2 = _interopRequireDefault(_simpleHtmlTokenizerHtml5NamedCharRefs);

var _parserHandlebarsNodeVisitors = require("./parser/handlebars-node-visitors");

var _parserHandlebarsNodeVisitors2 = _interopRequireDefault(_parserHandlebarsNodeVisitors);

var _parserTokenizerEventHandlers = require("./parser/tokenizer-event-handlers");

var _parserTokenizerEventHandlers2 = _interopRequireDefault(_parserTokenizerEventHandlers);

function preprocess(html, options) {
  var ast = typeof html === 'object' ? html : _handlebarsCompilerBase.parse(html);
  var combined = new Parser(html, options).acceptNode(ast);

  if (options && options.plugins && options.plugins.ast) {
    for (var i = 0, l = options.plugins.ast.length; i < l; i++) {
      var plugin = new options.plugins.ast[i](options);

      plugin.syntax = syntax;

      combined = plugin.transform(combined);
    }
  }

  return combined;
}

exports.default = preprocess;

var entityParser = new _simpleHtmlTokenizerEntityParser2.default(_simpleHtmlTokenizerHtml5NamedCharRefs2.default);

function Parser(source, options) {
  this.options = options || {};
  this.elementStack = [];
  this.tokenizer = new _simpleHtmlTokenizerEventedTokenizer2.default(this, entityParser);

  this.currentNode = null;
  this.currentAttribute = null;

  if (typeof source === 'string') {
    this.source = source.split(/(?:\r\n?|\n)/g);
  }
}

for (var key in _parserHandlebarsNodeVisitors2.default) {
  Parser.prototype[key] = _parserHandlebarsNodeVisitors2.default[key];
}

for (var key in _parserTokenizerEventHandlers2.default) {
  Parser.prototype[key] = _parserTokenizerEventHandlers2.default[key];
}

Parser.prototype.acceptNode = function (node) {
  return this[node.type](node);
};

Parser.prototype.currentElement = function () {
  return this.elementStack[this.elementStack.length - 1];
};

Parser.prototype.sourceForMustache = function (mustache) {
  var firstLine = mustache.loc.start.line - 1;
  var lastLine = mustache.loc.end.line - 1;
  var currentLine = firstLine - 1;
  var firstColumn = mustache.loc.start.column + 2;
  var lastColumn = mustache.loc.end.column - 2;
  var string = [];
  var line;

  if (!this.source) {
    return '{{' + mustache.path.id.original + '}}';
  }

  while (currentLine < lastLine) {
    currentLine++;
    line = this.source[currentLine];

    if (currentLine === firstLine) {
      if (firstLine === lastLine) {
        string.push(line.slice(firstColumn, lastColumn));
      } else {
        string.push(line.slice(firstColumn));
      }
    } else if (currentLine === lastLine) {
      string.push(line.slice(0, lastColumn));
    } else {
      string.push(line);
    }
  }

  return string.join('\n');
};

},{"../htmlbars-syntax":65,"../simple-html-tokenizer/entity-parser":101,"../simple-html-tokenizer/evented-tokenizer":102,"../simple-html-tokenizer/html5-named-char-refs":103,"./handlebars/compiler/base":69,"./parser/handlebars-node-visitors":77,"./parser/tokenizer-event-handlers":78}],77:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _builders = require("../builders");

var _builders2 = _interopRequireDefault(_builders);

var _utils = require("../utils");

exports.default = {

  Program: function (program) {
    var body = [];
    var node = _builders2.default.program(body, program.blockParams, program.loc);
    var i,
        l = program.body.length;

    this.elementStack.push(node);

    if (l === 0) {
      return this.elementStack.pop();
    }

    for (i = 0; i < l; i++) {
      this.acceptNode(program.body[i]);
    }

    // Ensure that that the element stack is balanced properly.
    var poppedNode = this.elementStack.pop();
    if (poppedNode !== node) {
      throw new Error("Unclosed element `" + poppedNode.tag + "` (on line " + poppedNode.loc.start.line + ").");
    }

    return node;
  },

  BlockStatement: function (block) {
    delete block.inverseStrip;
    delete block.openString;
    delete block.closeStrip;

    if (this.tokenizer.state === 'comment') {
      this.appendToCommentData('{{' + this.sourceForMustache(block) + '}}');
      return;
    }

    if (this.tokenizer.state !== 'comment' && this.tokenizer.state !== 'data' && this.tokenizer.state !== 'beforeData') {
      throw new Error("A block may only be used inside an HTML element or another block.");
    }

    block = acceptCommonNodes(this, block);
    var program = block.program ? this.acceptNode(block.program) : null;
    var inverse = block.inverse ? this.acceptNode(block.inverse) : null;

    var node = _builders2.default.block(block.path, block.params, block.hash, program, inverse, block.loc);
    var parentProgram = this.currentElement();
    _utils.appendChild(parentProgram, node);
  },

  MustacheStatement: function (rawMustache) {
    var tokenizer = this.tokenizer;
    var path = rawMustache.path;
    var params = rawMustache.params;
    var hash = rawMustache.hash;
    var escaped = rawMustache.escaped;
    var loc = rawMustache.loc;

    var mustache = _builders2.default.mustache(path, params, hash, !escaped, loc);

    if (tokenizer.state === 'comment') {
      this.appendToCommentData('{{' + this.sourceForMustache(mustache) + '}}');
      return;
    }

    acceptCommonNodes(this, mustache);

    switch (tokenizer.state) {
      // Tag helpers
      case "tagName":
        addElementModifier(this.currentNode, mustache);
        tokenizer.state = "beforeAttributeName";
        break;
      case "beforeAttributeName":
        addElementModifier(this.currentNode, mustache);
        break;
      case "attributeName":
      case "afterAttributeName":
        this.beginAttributeValue(false);
        this.finishAttributeValue();
        addElementModifier(this.currentNode, mustache);
        tokenizer.state = "beforeAttributeName";
        break;
      case "afterAttributeValueQuoted":
        addElementModifier(this.currentNode, mustache);
        tokenizer.state = "beforeAttributeName";
        break;

      // Attribute values
      case "beforeAttributeValue":
        appendDynamicAttributeValuePart(this.currentAttribute, mustache);
        tokenizer.state = 'attributeValueUnquoted';
        break;
      case "attributeValueDoubleQuoted":
      case "attributeValueSingleQuoted":
      case "attributeValueUnquoted":
        appendDynamicAttributeValuePart(this.currentAttribute, mustache);
        break;

      // TODO: Only append child when the tokenizer state makes
      // sense to do so, otherwise throw an error.
      default:
        _utils.appendChild(this.currentElement(), mustache);
    }

    return mustache;
  },

  ContentStatement: function (content) {
    var changeLines = 0;
    if (content.rightStripped) {
      changeLines = leadingNewlineDifference(content.original, content.value);
    }

    this.tokenizer.line = this.tokenizer.line + changeLines;
    this.tokenizer.tokenizePart(content.value);
    this.tokenizer.flushData();
  },

  CommentStatement: function (comment) {
    return comment;
  },

  PartialStatement: function (partial) {
    _utils.appendChild(this.currentElement(), partial);
    return partial;
  },

  SubExpression: function (sexpr) {
    return acceptCommonNodes(this, sexpr);
  },

  PathExpression: function (path) {
    delete path.data;
    delete path.depth;

    return path;
  },

  Hash: function (hash) {
    for (var i = 0; i < hash.pairs.length; i++) {
      this.acceptNode(hash.pairs[i].value);
    }

    return hash;
  },

  StringLiteral: function () {},
  BooleanLiteral: function () {},
  NumberLiteral: function () {},
  UndefinedLiteral: function () {},
  NullLiteral: function () {}
};

function leadingNewlineDifference(original, value) {
  if (value === '') {
    // if it is empty, just return the count of newlines
    // in original
    return original.split("\n").length - 1;
  }

  // otherwise, return the number of newlines prior to
  // `value`
  var difference = original.split(value)[0];
  var lines = difference.split(/\n/);

  return lines.length - 1;
}

function acceptCommonNodes(compiler, node) {
  compiler.acceptNode(node.path);

  if (node.params) {
    for (var i = 0; i < node.params.length; i++) {
      compiler.acceptNode(node.params[i]);
    }
  } else {
    node.params = [];
  }

  if (node.hash) {
    compiler.acceptNode(node.hash);
  } else {
    node.hash = _builders2.default.hash();
  }

  return node;
}

function addElementModifier(element, mustache) {
  var path = mustache.path;
  var params = mustache.params;
  var hash = mustache.hash;
  var loc = mustache.loc;

  var modifier = _builders2.default.elementModifier(path, params, hash, loc);
  element.modifiers.push(modifier);
}

function appendDynamicAttributeValuePart(attribute, part) {
  attribute.isDynamic = true;
  attribute.parts.push(part);
}
module.exports = exports.default;

},{"../builders":66,"../utils":83}],78:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _htmlbarsUtilVoidTagNames = require('../../htmlbars-util/void-tag-names');

var _htmlbarsUtilVoidTagNames2 = _interopRequireDefault(_htmlbarsUtilVoidTagNames);

var _builders = require("../builders");

var _builders2 = _interopRequireDefault(_builders);

var _utils = require("../utils");

exports.default = {
  reset: function () {
    this.currentNode = null;
  },

  // Comment

  beginComment: function () {
    this.currentNode = _builders2.default.comment("");
  },

  appendToCommentData: function (char) {
    this.currentNode.value += char;
  },

  finishComment: function () {
    _utils.appendChild(this.currentElement(), this.currentNode);
  },

  // Data

  beginData: function () {
    this.currentNode = _builders2.default.text();
  },

  appendToData: function (char) {
    this.currentNode.chars += char;
  },

  finishData: function () {
    _utils.appendChild(this.currentElement(), this.currentNode);
  },

  // Tags - basic

  beginStartTag: function () {
    this.currentNode = {
      type: 'StartTag',
      name: "",
      attributes: [],
      modifiers: [],
      selfClosing: false,
      loc: null
    };
  },

  beginEndTag: function () {
    this.currentNode = {
      type: 'EndTag',
      name: "",
      attributes: [],
      modifiers: [],
      selfClosing: false,
      loc: null
    };
  },

  finishTag: function () {
    var _tokenizer = this.tokenizer;
    var tagLine = _tokenizer.tagLine;
    var tagColumn = _tokenizer.tagColumn;
    var line = _tokenizer.line;
    var column = _tokenizer.column;

    var tag = this.currentNode;
    tag.loc = _builders2.default.loc(tagLine, tagColumn, line, column);

    if (tag.type === 'StartTag') {
      this.finishStartTag();

      if (_htmlbarsUtilVoidTagNames2.default.hasOwnProperty(tag.name) || tag.selfClosing) {
        this.finishEndTag(true);
      }
    } else if (tag.type === 'EndTag') {
      this.finishEndTag(false);
    }
  },

  finishStartTag: function () {
    var _currentNode = this.currentNode;
    var name = _currentNode.name;
    var attributes = _currentNode.attributes;
    var modifiers = _currentNode.modifiers;

    validateStartTag(this.currentNode, this.tokenizer);

    var loc = _builders2.default.loc(this.tokenizer.tagLine, this.tokenizer.tagColumn);
    var element = _builders2.default.element(name, attributes, modifiers, [], loc);
    this.elementStack.push(element);
  },

  finishEndTag: function (isVoid) {
    var tag = this.currentNode;

    var element = this.elementStack.pop();
    var parent = this.currentElement();
    var disableComponentGeneration = this.options.disableComponentGeneration === true;

    validateEndTag(tag, element, isVoid);

    element.loc.end.line = this.tokenizer.line;
    element.loc.end.column = this.tokenizer.column;

    if (disableComponentGeneration || cannotBeComponent(element.tag)) {
      _utils.appendChild(parent, element);
    } else {
      var program = _builders2.default.program(element.children);
      _utils.parseComponentBlockParams(element, program);
      var component = _builders2.default.component(element.tag, element.attributes, program, element.loc);
      _utils.appendChild(parent, component);
    }
  },

  markTagAsSelfClosing: function () {
    this.currentNode.selfClosing = true;
  },

  // Tags - name

  appendToTagName: function (char) {
    this.currentNode.name += char;
  },

  // Tags - attributes

  beginAttribute: function () {
    var tag = this.currentNode;
    if (tag.type === 'EndTag') {
      throw new Error("Invalid end tag: closing tag must not have attributes, " + ("in `" + tag.name + "` (on line " + this.tokenizer.line + ")."));
    }

    this.currentAttribute = {
      name: "",
      parts: [],
      isQuoted: false,
      isDynamic: false
    };
  },

  appendToAttributeName: function (char) {
    this.currentAttribute.name += char;
  },

  beginAttributeValue: function (isQuoted) {
    this.currentAttribute.isQuoted = isQuoted;
  },

  appendToAttributeValue: function (char) {
    var parts = this.currentAttribute.parts;

    if (typeof parts[parts.length - 1] === 'string') {
      parts[parts.length - 1] += char;
    } else {
      parts.push(char);
    }
  },

  finishAttributeValue: function () {
    var _currentAttribute = this.currentAttribute;
    var name = _currentAttribute.name;
    var parts = _currentAttribute.parts;
    var isQuoted = _currentAttribute.isQuoted;
    var isDynamic = _currentAttribute.isDynamic;

    var value = assembleAttributeValue(parts, isQuoted, isDynamic, this.tokenizer.line);

    this.currentNode.attributes.push(_builders2.default.attr(name, value));
  }
};

function assembleAttributeValue(parts, isQuoted, isDynamic, line) {
  if (isDynamic) {
    if (isQuoted) {
      return assembleConcatenatedValue(parts);
    } else {
      if (parts.length === 1) {
        return parts[0];
      } else {
        throw new Error("An unquoted attribute value must be a string or a mustache, " + "preceeded by whitespace or a '=' character, and " + ("followed by whitespace or a '>' character (on line " + line + ")"));
      }
    }
  } else {
    return _builders2.default.text(parts.length > 0 ? parts[0] : "");
  }
}

function assembleConcatenatedValue(parts) {
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];

    if (typeof part === 'string') {
      parts[i] = _builders2.default.string(parts[i]);
    } else {
      if (part.type === 'MustacheStatement') {
        parts[i] = _utils.unwrapMustache(part);
      } else {
        throw new Error("Unsupported node in quoted attribute value: " + part.type);
      }
    }
  }

  return _builders2.default.concat(parts);
}

function cannotBeComponent(tagName) {
  return tagName.indexOf("-") === -1 && tagName.indexOf(".") === -1;
}

function validateStartTag(tag, tokenizer) {
  // No support for <script> tags
  if (tag.name === "script") {
    throw new Error("`SCRIPT` tags are not allowed in HTMLBars templates (on line " + tokenizer.tagLine + ")");
  }
}

function validateEndTag(tag, element, selfClosing) {
  if (_htmlbarsUtilVoidTagNames2.default[tag.name] && !selfClosing) {
    // EngTag is also called by StartTag for void and self-closing tags (i.e.
    // <input> or <br />, so we need to check for that here. Otherwise, we would
    // throw an error for those cases.
    throw new Error("Invalid end tag " + formatEndTagInfo(tag) + " (void elements cannot have end tags).");
  } else if (element.tag === undefined) {
    throw new Error("Closing tag " + formatEndTagInfo(tag) + " without an open tag.");
  } else if (element.tag !== tag.name) {
    throw new Error("Closing tag " + formatEndTagInfo(tag) + " did not match last open tag `" + element.tag + "` (on line " + element.loc.start.line + ").");
  }
}

function formatEndTagInfo(tag) {
  return "`" + tag.name + "` (on line " + tag.loc.end.line + ")";
}
module.exports = exports.default;

},{"../../htmlbars-util/void-tag-names":94,"../builders":66,"../utils":83}],79:[function(require,module,exports){
exports.__esModule = true;
exports.cannotRemoveNode = cannotRemoveNode;
exports.cannotReplaceNode = cannotReplaceNode;
exports.cannotReplaceOrRemoveInKeyHandlerYet = cannotReplaceOrRemoveInKeyHandlerYet;
function TraversalError(message, node, parent, key) {
  this.name = "TraversalError";
  this.message = message;
  this.node = node;
  this.parent = parent;
  this.key = key;
}

TraversalError.prototype = Object.create(Error.prototype);
TraversalError.prototype.constructor = TraversalError;

exports.default = TraversalError;

function cannotRemoveNode(node, parent, key) {
  return new TraversalError("Cannot remove a node unless it is part of an array", node, parent, key);
}

function cannotReplaceNode(node, parent, key) {
  return new TraversalError("Cannot replace a node with multiple nodes unless it is part of an array", node, parent, key);
}

function cannotReplaceOrRemoveInKeyHandlerYet(node, key) {
  return new TraversalError("Replacing and removing in key handlers is not yet supported.", node, null, key);
}

},{}],80:[function(require,module,exports){
exports.__esModule = true;
exports.default = traverse;
exports.normalizeVisitor = normalizeVisitor;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _typesVisitorKeys = require('../types/visitor-keys');

var _typesVisitorKeys2 = _interopRequireDefault(_typesVisitorKeys);

var _errors = require('./errors');

function visitNode(visitor, node) {
  var handler = visitor[node.type] || visitor.All;
  var result = undefined;

  if (handler && handler.enter) {
    result = handler.enter.call(null, node);
  }

  if (result === undefined) {
    var keys = _typesVisitorKeys2.default[node.type];

    for (var i = 0; i < keys.length; i++) {
      visitKey(visitor, handler, node, keys[i]);
    }

    if (handler && handler.exit) {
      result = handler.exit.call(null, node);
    }
  }

  return result;
}

function visitKey(visitor, handler, node, key) {
  var value = node[key];
  if (!value) {
    return;
  }

  var keyHandler = handler && (handler.keys[key] || handler.keys.All);
  var result = undefined;

  if (keyHandler && keyHandler.enter) {
    result = keyHandler.enter.call(null, node, key);
    if (result !== undefined) {
      throw _errors.cannotReplaceOrRemoveInKeyHandlerYet(node, key);
    }
  }

  if (Array.isArray(value)) {
    visitArray(visitor, value);
  } else {
    var _result = visitNode(visitor, value);
    if (_result !== undefined) {
      assignKey(node, key, _result);
    }
  }

  if (keyHandler && keyHandler.exit) {
    result = keyHandler.exit.call(null, node, key);
    if (result !== undefined) {
      throw _errors.cannotReplaceOrRemoveInKeyHandlerYet(node, key);
    }
  }
}

function visitArray(visitor, array) {
  for (var i = 0; i < array.length; i++) {
    var result = visitNode(visitor, array[i]);
    if (result !== undefined) {
      i += spliceArray(array, i, result) - 1;
    }
  }
}

function assignKey(node, key, result) {
  if (result === null) {
    throw _errors.cannotRemoveNode(node[key], node, key);
  } else if (Array.isArray(result)) {
    if (result.length === 1) {
      node[key] = result[0];
    } else {
      if (result.length === 0) {
        throw _errors.cannotRemoveNode(node[key], node, key);
      } else {
        throw _errors.cannotReplaceNode(node[key], node, key);
      }
    }
  } else {
    node[key] = result;
  }
}

function spliceArray(array, index, result) {
  if (result === null) {
    array.splice(index, 1);
    return 0;
  } else if (Array.isArray(result)) {
    array.splice.apply(array, [index, 1].concat(result));
    return result.length;
  } else {
    array.splice(index, 1, result);
    return 1;
  }
}

function traverse(node, visitor) {
  visitNode(normalizeVisitor(visitor), node);
}

function normalizeVisitor(visitor) {
  var normalizedVisitor = {};

  for (var type in visitor) {
    var handler = visitor[type] || visitor.All;
    var normalizedKeys = {};

    if (typeof handler === 'object') {
      var keys = handler.keys;
      if (keys) {
        for (var key in keys) {
          var keyHandler = keys[key];
          if (typeof keyHandler === 'object') {
            normalizedKeys[key] = {
              enter: typeof keyHandler.enter === 'function' ? keyHandler.enter : null,
              exit: typeof keyHandler.exit === 'function' ? keyHandler.exit : null
            };
          } else if (typeof keyHandler === 'function') {
            normalizedKeys[key] = {
              enter: keyHandler,
              exit: null
            };
          }
        }
      }

      normalizedVisitor[type] = {
        enter: typeof handler.enter === 'function' ? handler.enter : null,
        exit: typeof handler.exit === 'function' ? handler.exit : null,
        keys: normalizedKeys
      };
    } else if (typeof handler === 'function') {
      normalizedVisitor[type] = {
        enter: handler,
        exit: null,
        keys: normalizedKeys
      };
    }
  }

  return normalizedVisitor;
}

},{"../types/visitor-keys":82,"./errors":79}],81:[function(require,module,exports){
exports.__esModule = true;
function Walker(order) {
  this.order = order;
  this.stack = [];
}

exports.default = Walker;

Walker.prototype.visit = function (node, callback) {
  if (!node) {
    return;
  }

  this.stack.push(node);

  if (this.order === 'post') {
    this.children(node, callback);
    callback(node, this);
  } else {
    callback(node, this);
    this.children(node, callback);
  }

  this.stack.pop();
};

var visitors = {
  Program: function (walker, node, callback) {
    for (var i = 0; i < node.body.length; i++) {
      walker.visit(node.body[i], callback);
    }
  },

  ElementNode: function (walker, node, callback) {
    for (var i = 0; i < node.children.length; i++) {
      walker.visit(node.children[i], callback);
    }
  },

  BlockStatement: function (walker, node, callback) {
    walker.visit(node.program, callback);
    walker.visit(node.inverse, callback);
  },

  ComponentNode: function (walker, node, callback) {
    walker.visit(node.program, callback);
  }
};

Walker.prototype.children = function (node, callback) {
  var visitor = visitors[node.type];
  if (visitor) {
    visitor(this, node, callback);
  }
};
module.exports = exports.default;

},{}],82:[function(require,module,exports){
exports.__esModule = true;
exports.default = {
  Program: ['body'],

  MustacheStatement: ['path', 'params', 'hash'],
  BlockStatement: ['path', 'params', 'hash', 'program', 'inverse'],
  ElementModifierStatement: ['path', 'params', 'hash'],
  PartialStatement: ['name', 'params', 'hash'],
  CommentStatement: [],
  ElementNode: ['attributes', 'modifiers', 'children'],
  ComponentNode: ['attributes', 'program'],
  AttrNode: ['value'],
  TextNode: [],

  ConcatStatement: ['parts'],
  SubExpression: ['path', 'params', 'hash'],
  PathExpression: [],

  StringLiteral: [],
  BooleanLiteral: [],
  NumberLiteral: [],
  NullLiteral: [],
  UndefinedLiteral: [],

  Hash: ['pairs'],
  HashPair: ['value']
};
module.exports = exports.default;

},{}],83:[function(require,module,exports){
exports.__esModule = true;
exports.parseComponentBlockParams = parseComponentBlockParams;
exports.childrenFor = childrenFor;
exports.appendChild = appendChild;
exports.isHelper = isHelper;
exports.unwrapMustache = unwrapMustache;

var _htmlbarsUtilArrayUtils = require("../htmlbars-util/array-utils");

// Regex to validate the identifier for block parameters.
// Based on the ID validation regex in Handlebars.

var ID_INVERSE_PATTERN = /[!"#%-,\.\/;->@\[-\^`\{-~]/;

// Checks the component's attributes to see if it uses block params.
// If it does, registers the block params with the program and
// removes the corresponding attributes from the element.

function parseComponentBlockParams(element, program) {
  var l = element.attributes.length;
  var attrNames = [];

  for (var i = 0; i < l; i++) {
    attrNames.push(element.attributes[i].name);
  }

  var asIndex = _htmlbarsUtilArrayUtils.indexOfArray(attrNames, 'as');

  if (asIndex !== -1 && l > asIndex && attrNames[asIndex + 1].charAt(0) === '|') {
    // Some basic validation, since we're doing the parsing ourselves
    var paramsString = attrNames.slice(asIndex).join(' ');
    if (paramsString.charAt(paramsString.length - 1) !== '|' || paramsString.match(/\|/g).length !== 2) {
      throw new Error('Invalid block parameters syntax: \'' + paramsString + '\'');
    }

    var params = [];
    for (i = asIndex + 1; i < l; i++) {
      var param = attrNames[i].replace(/\|/g, '');
      if (param !== '') {
        if (ID_INVERSE_PATTERN.test(param)) {
          throw new Error('Invalid identifier for block parameters: \'' + param + '\' in \'' + paramsString + '\'');
        }
        params.push(param);
      }
    }

    if (params.length === 0) {
      throw new Error('Cannot use zero block parameters: \'' + paramsString + '\'');
    }

    element.attributes = element.attributes.slice(0, asIndex);
    program.blockParams = params;
  }
}

function childrenFor(node) {
  if (node.type === 'Program') {
    return node.body;
  }
  if (node.type === 'ElementNode') {
    return node.children;
  }
}

function appendChild(parent, node) {
  childrenFor(parent).push(node);
}

function isHelper(mustache) {
  return mustache.params && mustache.params.length > 0 || mustache.hash && mustache.hash.pairs.length > 0;
}

function unwrapMustache(mustache) {
  if (isHelper(mustache)) {
    return mustache;
  } else {
    return mustache.path;
  }
}

},{"../htmlbars-util/array-utils":85}],84:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _htmlbarsUtilSafeString = require('./htmlbars-util/safe-string');

var _htmlbarsUtilSafeString2 = _interopRequireDefault(_htmlbarsUtilSafeString);

var _htmlbarsUtilHandlebarsUtils = require('./htmlbars-util/handlebars/utils');

var _htmlbarsUtilNamespaces = require('./htmlbars-util/namespaces');

var _htmlbarsUtilMorphUtils = require('./htmlbars-util/morph-utils');

exports.SafeString = _htmlbarsUtilSafeString2.default;
exports.escapeExpression = _htmlbarsUtilHandlebarsUtils.escapeExpression;
exports.getAttrNamespace = _htmlbarsUtilNamespaces.getAttrNamespace;
exports.validateChildMorphs = _htmlbarsUtilMorphUtils.validateChildMorphs;
exports.linkParams = _htmlbarsUtilMorphUtils.linkParams;
exports.dump = _htmlbarsUtilMorphUtils.dump;

},{"./htmlbars-util/handlebars/utils":87,"./htmlbars-util/morph-utils":88,"./htmlbars-util/namespaces":89,"./htmlbars-util/safe-string":92}],85:[function(require,module,exports){
exports.__esModule = true;
exports.forEach = forEach;
exports.map = map;

function forEach(array, callback, binding) {
  var i, l;
  if (binding === undefined) {
    for (i = 0, l = array.length; i < l; i++) {
      callback(array[i], i, array);
    }
  } else {
    for (i = 0, l = array.length; i < l; i++) {
      callback.call(binding, array[i], i, array);
    }
  }
}

function map(array, callback) {
  var output = [];
  var i, l;

  for (i = 0, l = array.length; i < l; i++) {
    output.push(callback(array[i], i, array));
  }

  return output;
}

var getIdx;
if (Array.prototype.indexOf) {
  getIdx = function (array, obj, from) {
    return array.indexOf(obj, from);
  };
} else {
  getIdx = function (array, obj, from) {
    if (from === undefined || from === null) {
      from = 0;
    } else if (from < 0) {
      from = Math.max(0, array.length + from);
    }
    for (var i = from, l = array.length; i < l; i++) {
      if (array[i] === obj) {
        return i;
      }
    }
    return -1;
  };
}

var isArray = Array.isArray || function (array) {
  return Object.prototype.toString.call(array) === '[object Array]';
};

exports.isArray = isArray;
var indexOfArray = getIdx;
exports.indexOfArray = indexOfArray;

},{}],86:[function(require,module,exports){
exports.__esModule = true;
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
  return '' + this.string;
};

exports.default = SafeString;
module.exports = exports.default;

},{}],87:[function(require,module,exports){
exports.__esModule = true;
exports.extend = extend;
exports.indexOf = indexOf;
exports.escapeExpression = escapeExpression;
exports.isEmpty = isEmpty;
exports.blockParams = blockParams;
exports.appendContextPath = appendContextPath;
var escape = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '`': '&#x60;'
};

var badChars = /[&<>"'`]/g,
    possible = /[&<>"'`]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

var toString = Object.prototype.toString;

exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
/*eslint-disable func-style, no-var */
var isFunction = function (value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  exports.isFunction = isFunction = function (value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
var isFunction;
exports.isFunction = isFunction;
/*eslint-enable func-style, no-var */

/* istanbul ignore next */
var isArray = Array.isArray || function (value) {
  return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
};

exports.isArray = isArray;
// Older IE versions do not directly support indexOf so we must implement our own, sadly.

function indexOf(array, value) {
  for (var i = 0, len = array.length; i < len; i++) {
    if (array[i] === value) {
      return i;
    }
  }
  return -1;
}

function escapeExpression(string) {
  if (typeof string !== 'string') {
    // don't escape SafeStrings, since they're already safe
    if (string && string.toHTML) {
      return string.toHTML();
    } else if (string == null) {
      return '';
    } else if (!string) {
      return string + '';
    }

    // Force a string conversion as this will be done by the append regardless and
    // the regex test will do this transparently behind the scenes, causing issues if
    // an object's to string has escaped characters in it.
    string = '' + string;
  }

  if (!possible.test(string)) {
    return string;
  }
  return string.replace(badChars, escapeChar);
}

function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

function blockParams(params, ids) {
  params.path = ids;
  return params;
}

function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}

},{}],88:[function(require,module,exports){
exports.__esModule = true;
exports.visitChildren = visitChildren;
exports.validateChildMorphs = validateChildMorphs;
exports.linkParams = linkParams;
exports.dump = dump;
/*globals console*/

function visitChildren(nodes, callback) {
  if (!nodes || nodes.length === 0) {
    return;
  }

  nodes = nodes.slice();

  while (nodes.length) {
    var node = nodes.pop();
    callback(node);

    if (node.childNodes) {
      nodes.push.apply(nodes, node.childNodes);
    } else if (node.firstChildMorph) {
      var current = node.firstChildMorph;

      while (current) {
        nodes.push(current);
        current = current.nextMorph;
      }
    } else if (node.morphList) {
      var current = node.morphList.firstChildMorph;

      while (current) {
        nodes.push(current);
        current = current.nextMorph;
      }
    }
  }
}

function validateChildMorphs(env, morph, visitor) {
  var morphList = morph.morphList;
  if (morph.morphList) {
    var current = morphList.firstChildMorph;

    while (current) {
      var next = current.nextMorph;
      validateChildMorphs(env, current, visitor);
      current = next;
    }
  } else if (morph.lastResult) {
    morph.lastResult.revalidateWith(env, undefined, undefined, undefined, visitor);
  } else if (morph.childNodes) {
    // This means that the childNodes were wired up manually
    for (var i = 0, l = morph.childNodes.length; i < l; i++) {
      validateChildMorphs(env, morph.childNodes[i], visitor);
    }
  }
}

function linkParams(env, scope, morph, path, params, hash) {
  if (morph.linkedParams) {
    return;
  }

  if (env.hooks.linkRenderNode(morph, env, scope, path, params, hash)) {
    morph.linkedParams = { params: params, hash: hash };
  }
}

function dump(node) {
  console.group(node, node.isDirty);

  if (node.childNodes) {
    map(node.childNodes, dump);
  } else if (node.firstChildMorph) {
    var current = node.firstChildMorph;

    while (current) {
      dump(current);
      current = current.nextMorph;
    }
  } else if (node.morphList) {
    dump(node.morphList);
  }

  console.groupEnd();
}

function map(nodes, cb) {
  for (var i = 0, l = nodes.length; i < l; i++) {
    cb(nodes[i]);
  }
}

},{}],89:[function(require,module,exports){
exports.__esModule = true;
exports.getAttrNamespace = getAttrNamespace;
// ref http://dev.w3.org/html5/spec-LC/namespaces.html
var defaultNamespaces = {
  html: 'http://www.w3.org/1999/xhtml',
  mathml: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg',
  xlink: 'http://www.w3.org/1999/xlink',
  xml: 'http://www.w3.org/XML/1998/namespace'
};

function getAttrNamespace(attrName, detectedNamespace) {
  if (detectedNamespace) {
    return detectedNamespace;
  }

  var namespace;

  var colonIndex = attrName.indexOf(':');
  if (colonIndex !== -1) {
    var prefix = attrName.slice(0, colonIndex);
    namespace = defaultNamespaces[prefix];
  }

  return namespace || null;
}

},{}],90:[function(require,module,exports){
exports.__esModule = true;
exports.merge = merge;
exports.shallowCopy = shallowCopy;
exports.keySet = keySet;
exports.keyLength = keyLength;

function merge(options, defaults) {
  for (var prop in defaults) {
    if (options.hasOwnProperty(prop)) {
      continue;
    }
    options[prop] = defaults[prop];
  }
  return options;
}

function shallowCopy(obj) {
  return merge({}, obj);
}

function keySet(obj) {
  var set = {};

  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      set[prop] = true;
    }
  }

  return set;
}

function keyLength(obj) {
  var count = 0;

  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      count++;
    }
  }

  return count;
}

},{}],91:[function(require,module,exports){
exports.__esModule = true;
exports.hash = hash;
exports.repeat = repeat;
function escapeString(str) {
  str = str.replace(/\\/g, "\\\\");
  str = str.replace(/"/g, '\\"');
  str = str.replace(/\n/g, "\\n");
  return str;
}

exports.escapeString = escapeString;

function string(str) {
  return '"' + escapeString(str) + '"';
}

exports.string = string;

function array(a) {
  return "[" + a + "]";
}

exports.array = array;

function hash(pairs) {
  return "{" + pairs.join(", ") + "}";
}

function repeat(chars, times) {
  var str = "";
  while (times--) {
    str += chars;
  }
  return str;
}

},{}],92:[function(require,module,exports){
exports.__esModule = true;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _handlebarsSafeString = require('./handlebars/safe-string');

var _handlebarsSafeString2 = _interopRequireDefault(_handlebarsSafeString);

exports.default = _handlebarsSafeString2.default;
module.exports = exports.default;

},{"./handlebars/safe-string":86}],93:[function(require,module,exports){
exports.__esModule = true;
exports.RenderState = RenderState;
exports.blockFor = blockFor;
exports.renderAndCleanup = renderAndCleanup;
exports.clearMorph = clearMorph;
exports.clearMorphList = clearMorphList;

var _htmlbarsUtilMorphUtils = require("../htmlbars-util/morph-utils");

var _htmlbarsRuntimeRender = require("../htmlbars-runtime/render");

function RenderState(renderNode, morphList) {
  // The morph list that is no longer needed and can be
  // destroyed.
  this.morphListToClear = morphList;

  // The morph list that needs to be pruned of any items
  // that were not yielded on a subsequent render.
  this.morphListToPrune = null;

  // A map of morphs for each item yielded in during this
  // rendering pass. Any morphs in the DOM but not in this map
  // will be pruned during cleanup.
  this.handledMorphs = {};
  this.collisions = undefined;

  // The morph to clear once rendering is complete. By
  // default, we set this to the previous morph (to catch
  // the case where nothing is yielded; in that case, we
  // should just clear the morph). Otherwise this gets set
  // to null if anything is rendered.
  this.morphToClear = renderNode;

  this.shadowOptions = null;
}

function Block(render, template, blockOptions) {
  this.render = render;
  this.template = template;
  this.blockOptions = blockOptions;
  this.arity = template.arity;
}

Block.prototype.invoke = function (env, blockArguments, _self, renderNode, parentScope, visitor) {
  if (renderNode.lastResult) {
    renderNode.lastResult.revalidateWith(env, undefined, _self, blockArguments, visitor);
  } else {
    this._firstRender(env, blockArguments, _self, renderNode, parentScope);
  }
};

Block.prototype._firstRender = function (env, blockArguments, _self, renderNode, parentScope) {
  var options = { renderState: new RenderState(renderNode) };
  var render = this.render;
  var template = this.template;
  var scope = this.blockOptions.scope;

  var shadowScope = scope ? env.hooks.createChildScope(scope) : env.hooks.createFreshScope();

  env.hooks.bindShadowScope(env, parentScope, shadowScope, this.blockOptions.options);

  if (_self !== undefined) {
    env.hooks.bindSelf(env, shadowScope, _self);
  } else if (this.blockOptions.self !== undefined) {
    env.hooks.bindSelf(env, shadowScope, this.blockOptions.self);
  }

  bindBlocks(env, shadowScope, this.blockOptions.yieldTo);

  renderAndCleanup(renderNode, env, options, null, function () {
    options.renderState.morphToClear = null;
    var renderOptions = new _htmlbarsRuntimeRender.RenderOptions(renderNode, undefined, blockArguments);
    render(template, env, shadowScope, renderOptions);
  });
};

function blockFor(render, template, blockOptions) {
  return new Block(render, template, blockOptions);
}

function bindBlocks(env, shadowScope, blocks) {
  if (!blocks) {
    return;
  }
  if (blocks instanceof Block) {
    env.hooks.bindBlock(env, shadowScope, blocks);
  } else {
    for (var name in blocks) {
      if (blocks.hasOwnProperty(name)) {
        env.hooks.bindBlock(env, shadowScope, blocks[name], name);
      }
    }
  }
}

function renderAndCleanup(morph, env, options, shadowOptions, callback) {
  // The RenderState object is used to collect information about what the
  // helper or hook being invoked has yielded. Once it has finished either
  // yielding multiple items (via yieldItem) or a single template (via
  // yieldTemplate), we detect what was rendered and how it differs from
  // the previous render, cleaning up old state in DOM as appropriate.
  var renderState = options.renderState;
  renderState.collisions = undefined;
  renderState.shadowOptions = shadowOptions;

  // Invoke the callback, instructing it to save information about what it
  // renders into RenderState.
  var result = callback(options);

  // The hook can opt-out of cleanup if it handled cleanup itself.
  if (result && result.handled) {
    return;
  }

  var morphMap = morph.morphMap;

  // Walk the morph list, clearing any items that were yielded in a previous
  // render but were not yielded during this render.
  var morphList = renderState.morphListToPrune;
  if (morphList) {
    var handledMorphs = renderState.handledMorphs;
    var item = morphList.firstChildMorph;

    while (item) {
      var next = item.nextMorph;

      // If we don't see the key in handledMorphs, it wasn't
      // yielded in and we can safely remove it from DOM.
      if (!(item.key in handledMorphs)) {
        morphMap[item.key] = undefined;
        clearMorph(item, env, true);
        item.destroy();
      }

      item = next;
    }
  }

  morphList = renderState.morphListToClear;
  if (morphList) {
    clearMorphList(morphList, morph, env);
  }

  var toClear = renderState.morphToClear;
  if (toClear) {
    clearMorph(toClear, env);
  }
}

function clearMorph(morph, env, destroySelf) {
  var cleanup = env.hooks.cleanupRenderNode;
  var destroy = env.hooks.destroyRenderNode;
  var willCleanup = env.hooks.willCleanupTree;
  var didCleanup = env.hooks.didCleanupTree;

  function destroyNode(node) {
    if (cleanup) {
      cleanup(node);
    }
    if (destroy) {
      destroy(node);
    }
  }

  if (willCleanup) {
    willCleanup(env, morph, destroySelf);
  }
  if (cleanup) {
    cleanup(morph);
  }
  if (destroySelf && destroy) {
    destroy(morph);
  }

  _htmlbarsUtilMorphUtils.visitChildren(morph.childNodes, destroyNode);

  // TODO: Deal with logical children that are not in the DOM tree
  morph.clear();
  if (didCleanup) {
    didCleanup(env, morph, destroySelf);
  }

  morph.lastResult = null;
  morph.lastYielded = null;
  morph.childNodes = null;
}

function clearMorphList(morphList, morph, env) {
  var item = morphList.firstChildMorph;

  while (item) {
    var next = item.nextMorph;
    morph.morphMap[item.key] = undefined;
    clearMorph(item, env, true);
    item.destroy();

    item = next;
  }

  // Remove the MorphList from the morph.
  morphList.clear();
  morph.morphList = null;
}

},{"../htmlbars-runtime/render":64,"../htmlbars-util/morph-utils":88}],94:[function(require,module,exports){
exports.__esModule = true;

var _arrayUtils = require("./array-utils");

// The HTML elements in this list are speced by
// http://www.w3.org/TR/html-markup/syntax.html#syntax-elements,
// and will be forced to close regardless of if they have a
// self-closing /> at the end.
var voidTagNames = "area base br col command embed hr img input keygen link meta param source track wbr";
var voidMap = {};

_arrayUtils.forEach(voidTagNames.split(" "), function (tagName) {
  voidMap[tagName] = true;
});

exports.default = voidMap;
module.exports = exports.default;

},{"./array-utils":85}],95:[function(require,module,exports){
exports.__esModule = true;
/*
 * @overview  HTMLBars
 * @copyright Copyright 2011-2014 Tilde Inc. and contributors
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/tildeio/htmlbars/master/LICENSE
 * @version   v0.14.11
 */

// Break cycles in the module loader.

require("./htmlbars-syntax");

var _htmlbarsCompilerCompiler = require("./htmlbars-compiler/compiler");

exports.compile = _htmlbarsCompilerCompiler.compile;
exports.compileSpec = _htmlbarsCompilerCompiler.compileSpec;

},{"./htmlbars-compiler/compiler":52,"./htmlbars-syntax":65}],96:[function(require,module,exports){
exports.__esModule = true;

var _morphAttrSanitizeAttributeValue = require("./morph-attr/sanitize-attribute-value");

var _domHelperProp = require("./dom-helper/prop");

var _domHelperBuildHtmlDom = require("./dom-helper/build-html-dom");

var _htmlbarsUtil = require("./htmlbars-util");

function getProperty() {
  return this.domHelper.getPropertyStrict(this.element, this.attrName);
}

function updateProperty(value) {
  if (this._renderedInitially === true || !_domHelperProp.isAttrRemovalValue(value)) {
    // do not render if initial value is undefined or null
    this.domHelper.setPropertyStrict(this.element, this.attrName, value);
  }

  this._renderedInitially = true;
}

function getAttribute() {
  return this.domHelper.getAttribute(this.element, this.attrName);
}

function updateAttribute(value) {
  if (_domHelperProp.isAttrRemovalValue(value)) {
    this.domHelper.removeAttribute(this.element, this.attrName);
  } else {
    this.domHelper.setAttribute(this.element, this.attrName, value);
  }
}

function getAttributeNS() {
  return this.domHelper.getAttributeNS(this.element, this.namespace, this.attrName);
}

function updateAttributeNS(value) {
  if (_domHelperProp.isAttrRemovalValue(value)) {
    this.domHelper.removeAttribute(this.element, this.attrName);
  } else {
    this.domHelper.setAttributeNS(this.element, this.namespace, this.attrName, value);
  }
}

var UNSET = { unset: true };

var guid = 1;

AttrMorph.create = function (element, attrName, domHelper, namespace) {
  var ns = _htmlbarsUtil.getAttrNamespace(attrName, namespace);

  if (ns) {
    return new AttributeNSAttrMorph(element, attrName, domHelper, ns);
  } else {
    return createNonNamespacedAttrMorph(element, attrName, domHelper);
  }
};

function createNonNamespacedAttrMorph(element, attrName, domHelper) {
  var _normalizeProperty = _domHelperProp.normalizeProperty(element, attrName);

  var normalized = _normalizeProperty.normalized;
  var type = _normalizeProperty.type;

  if (element.namespaceURI === _domHelperBuildHtmlDom.svgNamespace || attrName === 'style' || type === 'attr') {
    return new AttributeAttrMorph(element, normalized, domHelper);
  } else {
    return new PropertyAttrMorph(element, normalized, domHelper);
  }
}

function AttrMorph(element, attrName, domHelper) {
  this.element = element;
  this.domHelper = domHelper;
  this.attrName = attrName;
  this._state = undefined;
  this.isDirty = false;
  this.isSubtreeDirty = false;
  this.escaped = true;
  this.lastValue = UNSET;
  this.lastResult = null;
  this.lastYielded = null;
  this.childNodes = null;
  this.linkedParams = null;
  this.linkedResult = null;
  this.guid = "attr" + guid++;
  this.seen = false;
  this.ownerNode = null;
  this.rendered = false;
  this._renderedInitially = false;
  this.namespace = undefined;
  this.didInit();
}

AttrMorph.prototype.getState = function () {
  if (!this._state) {
    this._state = {};
  }

  return this._state;
};

AttrMorph.prototype.setState = function (newState) {
  /*jshint -W093 */

  return this._state = newState;
};

AttrMorph.prototype.didInit = function () {};
AttrMorph.prototype.willSetContent = function () {};

AttrMorph.prototype.setContent = function (value) {
  this.willSetContent(value);

  if (this.lastValue === value) {
    return;
  }
  this.lastValue = value;

  if (this.escaped) {
    var sanitized = _morphAttrSanitizeAttributeValue.sanitizeAttributeValue(this.domHelper, this.element, this.attrName, value);
    this._update(sanitized, this.namespace);
  } else {
    this._update(value, this.namespace);
  }
};

AttrMorph.prototype.getContent = function () {
  var value = this.lastValue = this._get();
  return value;
};

// renderAndCleanup calls `clear` on all items in the morph map
// just before calling `destroy` on the morph.
//
// As a future refactor this could be changed to set the property
// back to its original/default value.
AttrMorph.prototype.clear = function () {};

AttrMorph.prototype.destroy = function () {
  this.element = null;
  this.domHelper = null;
};

AttrMorph.prototype._$superAttrMorph = AttrMorph;

function PropertyAttrMorph(element, attrName, domHelper) {
  this._$superAttrMorph(element, attrName, domHelper);
}

PropertyAttrMorph.prototype = Object.create(AttrMorph.prototype);
PropertyAttrMorph.prototype._update = updateProperty;
PropertyAttrMorph.prototype._get = getProperty;

function AttributeNSAttrMorph(element, attrName, domHelper, namespace) {
  this._$superAttrMorph(element, attrName, domHelper);
  this.namespace = namespace;
}

AttributeNSAttrMorph.prototype = Object.create(AttrMorph.prototype);
AttributeNSAttrMorph.prototype._update = updateAttributeNS;
AttributeNSAttrMorph.prototype._get = getAttributeNS;

function AttributeAttrMorph(element, attrName, domHelper) {
  this._$superAttrMorph(element, attrName, domHelper);
}

AttributeAttrMorph.prototype = Object.create(AttrMorph.prototype);
AttributeAttrMorph.prototype._update = updateAttribute;
AttributeAttrMorph.prototype._get = getAttribute;

exports.default = AttrMorph;
exports.sanitizeAttributeValue = _morphAttrSanitizeAttributeValue.sanitizeAttributeValue;

},{"./dom-helper/build-html-dom":49,"./dom-helper/prop":51,"./htmlbars-util":84,"./morph-attr/sanitize-attribute-value":97}],97:[function(require,module,exports){
exports.__esModule = true;
exports.sanitizeAttributeValue = sanitizeAttributeValue;
/* jshint scripturl:true */

var badProtocols = {
  'javascript:': true,
  'vbscript:': true
};

var badTags = {
  'A': true,
  'BODY': true,
  'LINK': true,
  'IMG': true,
  'IFRAME': true,
  'BASE': true,
  'FORM': true
};

var badTagsForDataURI = {
  'EMBED': true
};

var badAttributes = {
  'href': true,
  'src': true,
  'background': true,
  'action': true
};

exports.badAttributes = badAttributes;
var badAttributesForDataURI = {
  'src': true
};

function sanitizeAttributeValue(dom, element, attribute, value) {
  var tagName;

  if (!element) {
    tagName = null;
  } else {
    tagName = element.tagName.toUpperCase();
  }

  if (value && value.toHTML) {
    return value.toHTML();
  }

  if ((tagName === null || badTags[tagName]) && badAttributes[attribute]) {
    var protocol = dom.protocolForURL(value);
    if (badProtocols[protocol] === true) {
      return 'unsafe:' + value;
    }
  }

  if (badTagsForDataURI[tagName] && badAttributesForDataURI[attribute]) {
    return 'unsafe:' + value;
  }

  return value;
}

},{}],98:[function(require,module,exports){
exports.__esModule = true;

var _morphRangeUtils = require('./morph-range/utils');

// constructor just initializes the fields
// use one of the static initializers to create a valid morph.
function Morph(domHelper, contextualElement) {
  this.domHelper = domHelper;
  // context if content if current content is detached
  this.contextualElement = contextualElement;
  // inclusive range of morph
  // these should be nodeType 1, 3, or 8
  this.firstNode = null;
  this.lastNode = null;

  // flag to force text to setContent to be treated as html
  this.parseTextAsHTML = false;

  // morph list graph
  this.parentMorphList = null;
  this.previousMorph = null;
  this.nextMorph = null;
}

Morph.empty = function (domHelper, contextualElement) {
  var morph = new Morph(domHelper, contextualElement);
  morph.clear();
  return morph;
};

Morph.create = function (domHelper, contextualElement, node) {
  var morph = new Morph(domHelper, contextualElement);
  morph.setNode(node);
  return morph;
};

Morph.attach = function (domHelper, contextualElement, firstNode, lastNode) {
  var morph = new Morph(domHelper, contextualElement);
  morph.setRange(firstNode, lastNode);
  return morph;
};

Morph.prototype.setContent = function Morph$setContent(content) {
  if (content === null || content === undefined) {
    return this.clear();
  }

  var type = typeof content;
  switch (type) {
    case 'string':
      if (this.parseTextAsHTML) {
        return this.domHelper.setMorphHTML(this, content);
      }
      return this.setText(content);
    case 'object':
      if (typeof content.nodeType === 'number') {
        return this.setNode(content);
      }
      /* Handlebars.SafeString */
      if (typeof content.string === 'string') {
        return this.setHTML(content.string);
      }
      if (this.parseTextAsHTML) {
        return this.setHTML(content.toString());
      }
    /* falls through */
    case 'boolean':
    case 'number':
      return this.setText(content.toString());
    case 'function':
      raiseCannotBindToFunction(content);
    default:
      throw new TypeError('unsupported content');
  }
};

function raiseCannotBindToFunction(content) {
  var functionName = content.name;
  var message;

  if (functionName) {
    message = 'Unsupported Content: Cannot bind to function `' + functionName + '`';
  } else {
    message = 'Unsupported Content: Cannot bind to function';
  }

  throw new TypeError(message);
}

Morph.prototype.clear = function Morph$clear() {
  var node = this.setNode(this.domHelper.createComment(''));
  return node;
};

Morph.prototype.setText = function Morph$setText(text) {
  var firstNode = this.firstNode;
  var lastNode = this.lastNode;

  if (firstNode && lastNode === firstNode && firstNode.nodeType === 3) {
    firstNode.nodeValue = text;
    return firstNode;
  }

  return this.setNode(text ? this.domHelper.createTextNode(text) : this.domHelper.createComment(''));
};

Morph.prototype.setNode = function Morph$setNode(newNode) {
  var firstNode, lastNode;
  switch (newNode.nodeType) {
    case 3:
      firstNode = newNode;
      lastNode = newNode;
      break;
    case 11:
      firstNode = newNode.firstChild;
      lastNode = newNode.lastChild;
      if (firstNode === null) {
        firstNode = this.domHelper.createComment('');
        newNode.appendChild(firstNode);
        lastNode = firstNode;
      }
      break;
    default:
      firstNode = newNode;
      lastNode = newNode;
      break;
  }

  this.setRange(firstNode, lastNode);

  return newNode;
};

Morph.prototype.setRange = function (firstNode, lastNode) {
  var previousFirstNode = this.firstNode;
  if (previousFirstNode !== null) {

    var parentNode = previousFirstNode.parentNode;
    if (parentNode !== null) {
      _morphRangeUtils.insertBefore(parentNode, firstNode, lastNode, previousFirstNode);
      _morphRangeUtils.clear(parentNode, previousFirstNode, this.lastNode);
    }
  }

  this.firstNode = firstNode;
  this.lastNode = lastNode;

  if (this.parentMorphList) {
    this._syncFirstNode();
    this._syncLastNode();
  }
};

Morph.prototype.destroy = function Morph$destroy() {
  this.unlink();

  var firstNode = this.firstNode;
  var lastNode = this.lastNode;
  var parentNode = firstNode && firstNode.parentNode;

  this.firstNode = null;
  this.lastNode = null;

  _morphRangeUtils.clear(parentNode, firstNode, lastNode);
};

Morph.prototype.unlink = function Morph$unlink() {
  var parentMorphList = this.parentMorphList;
  var previousMorph = this.previousMorph;
  var nextMorph = this.nextMorph;

  if (previousMorph) {
    if (nextMorph) {
      previousMorph.nextMorph = nextMorph;
      nextMorph.previousMorph = previousMorph;
    } else {
      previousMorph.nextMorph = null;
      parentMorphList.lastChildMorph = previousMorph;
    }
  } else {
    if (nextMorph) {
      nextMorph.previousMorph = null;
      parentMorphList.firstChildMorph = nextMorph;
    } else if (parentMorphList) {
      parentMorphList.lastChildMorph = parentMorphList.firstChildMorph = null;
    }
  }

  this.parentMorphList = null;
  this.nextMorph = null;
  this.previousMorph = null;

  if (parentMorphList && parentMorphList.mountedMorph) {
    if (!parentMorphList.firstChildMorph) {
      // list is empty
      parentMorphList.mountedMorph.clear();
      return;
    } else {
      parentMorphList.firstChildMorph._syncFirstNode();
      parentMorphList.lastChildMorph._syncLastNode();
    }
  }
};

Morph.prototype.setHTML = function (text) {
  var fragment = this.domHelper.parseHTML(text, this.contextualElement);
  return this.setNode(fragment);
};

Morph.prototype.setMorphList = function Morph$appendMorphList(morphList) {
  morphList.mountedMorph = this;
  this.clear();

  var originalFirstNode = this.firstNode;

  if (morphList.firstChildMorph) {
    this.firstNode = morphList.firstChildMorph.firstNode;
    this.lastNode = morphList.lastChildMorph.lastNode;

    var current = morphList.firstChildMorph;

    while (current) {
      var next = current.nextMorph;
      current.insertBeforeNode(originalFirstNode, null);
      current = next;
    }
    originalFirstNode.parentNode.removeChild(originalFirstNode);
  }
};

Morph.prototype._syncFirstNode = function Morph$syncFirstNode() {
  var morph = this;
  var parentMorphList;
  while (parentMorphList = morph.parentMorphList) {
    if (parentMorphList.mountedMorph === null) {
      break;
    }
    if (morph !== parentMorphList.firstChildMorph) {
      break;
    }
    if (morph.firstNode === parentMorphList.mountedMorph.firstNode) {
      break;
    }

    parentMorphList.mountedMorph.firstNode = morph.firstNode;

    morph = parentMorphList.mountedMorph;
  }
};

Morph.prototype._syncLastNode = function Morph$syncLastNode() {
  var morph = this;
  var parentMorphList;
  while (parentMorphList = morph.parentMorphList) {
    if (parentMorphList.mountedMorph === null) {
      break;
    }
    if (morph !== parentMorphList.lastChildMorph) {
      break;
    }
    if (morph.lastNode === parentMorphList.mountedMorph.lastNode) {
      break;
    }

    parentMorphList.mountedMorph.lastNode = morph.lastNode;

    morph = parentMorphList.mountedMorph;
  }
};

Morph.prototype.insertBeforeNode = function Morph$insertBeforeNode(parentNode, refNode) {
  _morphRangeUtils.insertBefore(parentNode, this.firstNode, this.lastNode, refNode);
};

Morph.prototype.appendToNode = function Morph$appendToNode(parentNode) {
  _morphRangeUtils.insertBefore(parentNode, this.firstNode, this.lastNode, null);
};

exports.default = Morph;
module.exports = exports.default;

},{"./morph-range/utils":100}],99:[function(require,module,exports){
exports.__esModule = true;

var _utils = require('./utils');

function MorphList() {
  // morph graph
  this.firstChildMorph = null;
  this.lastChildMorph = null;

  this.mountedMorph = null;
}

var prototype = MorphList.prototype;

prototype.clear = function MorphList$clear() {
  var current = this.firstChildMorph;

  while (current) {
    var next = current.nextMorph;
    current.previousMorph = null;
    current.nextMorph = null;
    current.parentMorphList = null;
    current = next;
  }

  this.firstChildMorph = this.lastChildMorph = null;
};

prototype.destroy = function MorphList$destroy() {};

prototype.appendMorph = function MorphList$appendMorph(morph) {
  this.insertBeforeMorph(morph, null);
};

prototype.insertBeforeMorph = function MorphList$insertBeforeMorph(morph, referenceMorph) {
  if (morph.parentMorphList !== null) {
    morph.unlink();
  }
  if (referenceMorph && referenceMorph.parentMorphList !== this) {
    throw new Error('The morph before which the new morph is to be inserted is not a child of this morph.');
  }

  var mountedMorph = this.mountedMorph;

  if (mountedMorph) {

    var parentNode = mountedMorph.firstNode.parentNode;
    var referenceNode = referenceMorph ? referenceMorph.firstNode : mountedMorph.lastNode.nextSibling;

    _utils.insertBefore(parentNode, morph.firstNode, morph.lastNode, referenceNode);

    // was not in list mode replace current content
    if (!this.firstChildMorph) {
      _utils.clear(this.mountedMorph.firstNode.parentNode, this.mountedMorph.firstNode, this.mountedMorph.lastNode);
    }
  }

  morph.parentMorphList = this;

  var previousMorph = referenceMorph ? referenceMorph.previousMorph : this.lastChildMorph;
  if (previousMorph) {
    previousMorph.nextMorph = morph;
    morph.previousMorph = previousMorph;
  } else {
    this.firstChildMorph = morph;
  }

  if (referenceMorph) {
    referenceMorph.previousMorph = morph;
    morph.nextMorph = referenceMorph;
  } else {
    this.lastChildMorph = morph;
  }

  this.firstChildMorph._syncFirstNode();
  this.lastChildMorph._syncLastNode();
};

prototype.removeChildMorph = function MorphList$removeChildMorph(morph) {
  if (morph.parentMorphList !== this) {
    throw new Error("Cannot remove a morph from a parent it is not inside of");
  }

  morph.destroy();
};

exports.default = MorphList;
module.exports = exports.default;

},{"./utils":100}],100:[function(require,module,exports){
exports.__esModule = true;
exports.clear = clear;
exports.insertBefore = insertBefore;
// inclusive of both nodes

function clear(parentNode, firstNode, lastNode) {
  if (!parentNode) {
    return;
  }

  var node = firstNode;
  var nextNode;
  do {
    nextNode = node.nextSibling;
    parentNode.removeChild(node);
    if (node === lastNode) {
      break;
    }
    node = nextNode;
  } while (node);
}

function insertBefore(parentNode, firstNode, lastNode, refNode) {
  var node = firstNode;
  var nextNode;
  do {
    nextNode = node.nextSibling;
    parentNode.insertBefore(node, refNode);
    if (node === lastNode) {
      break;
    }
    node = nextNode;
  } while (node);
}

},{}],101:[function(require,module,exports){
exports.__esModule = true;
function EntityParser(named) {
  this.named = named;
}

var HEXCHARCODE = /^#[xX]([A-Fa-f0-9]+)$/;
var CHARCODE = /^#([0-9]+)$/;
var NAMED = /^([A-Za-z0-9]+)$/;

EntityParser.prototype.parse = function (entity) {
  if (!entity) {
    return;
  }
  var matches = entity.match(HEXCHARCODE);
  if (matches) {
    return String.fromCharCode(parseInt(matches[1], 16));
  }
  matches = entity.match(CHARCODE);
  if (matches) {
    return String.fromCharCode(parseInt(matches[1], 10));
  }
  matches = entity.match(NAMED);
  if (matches) {
    return this.named[matches[1]];
  }
};

exports.default = EntityParser;
module.exports = exports.default;

},{}],102:[function(require,module,exports){
exports.__esModule = true;

var _utils = require('./utils');

function EventedTokenizer(delegate, entityParser) {
  this.delegate = delegate;
  this.entityParser = entityParser;

  this.state = null;
  this.input = null;

  this.index = -1;
  this.line = -1;
  this.column = -1;
  this.tagLine = -1;
  this.tagColumn = -1;

  this.reset();
}

EventedTokenizer.prototype = {
  reset: function () {
    this.state = 'beforeData';
    this.input = '';

    this.index = 0;
    this.line = 1;
    this.column = 0;

    this.tagLine = -1;
    this.tagColumn = -1;

    this.delegate.reset();
  },

  tokenize: function (input) {
    this.reset();
    this.tokenizePart(input);
    this.tokenizeEOF();
  },

  tokenizePart: function (input) {
    this.input += _utils.preprocessInput(input);

    while (this.index < this.input.length) {
      this.states[this.state].call(this);
    }
  },

  tokenizeEOF: function () {
    this.flushData();
  },

  flushData: function () {
    if (this.state === 'data') {
      this.delegate.finishData();
      this.state = 'beforeData';
    }
  },

  peek: function () {
    return this.input.charAt(this.index);
  },

  consume: function () {
    var char = this.peek();

    this.index++;

    if (char === "\n") {
      this.line++;
      this.column = 0;
    } else {
      this.column++;
    }

    return char;
  },

  consumeCharRef: function () {
    var endIndex = this.input.indexOf(';', this.index);
    if (endIndex === -1) {
      return;
    }
    var entity = this.input.slice(this.index, endIndex);
    var chars = this.entityParser.parse(entity);
    if (chars) {
      this.index = endIndex + 1;
      return chars;
    }
  },

  markTagStart: function () {
    this.tagLine = this.line;
    this.tagColumn = this.column;
  },

  states: {
    beforeData: function () {
      var char = this.peek();

      if (char === "<") {
        this.state = 'tagOpen';
        this.markTagStart();
        this.consume();
      } else {
        this.state = 'data';
        this.delegate.beginData();
      }
    },

    data: function () {
      var char = this.peek();

      if (char === "<") {
        this.delegate.finishData();
        this.state = 'tagOpen';
        this.markTagStart();
        this.consume();
      } else if (char === "&") {
        this.consume();
        this.delegate.appendToData(this.consumeCharRef() || "&");
      } else {
        this.consume();
        this.delegate.appendToData(char);
      }
    },

    tagOpen: function () {
      var char = this.consume();

      if (char === "!") {
        this.state = 'markupDeclaration';
      } else if (char === "/") {
        this.state = 'endTagOpen';
      } else if (_utils.isAlpha(char)) {
        this.state = 'tagName';
        this.delegate.beginStartTag();
        this.delegate.appendToTagName(char.toLowerCase());
      }
    },

    markupDeclaration: function () {
      var char = this.consume();

      if (char === "-" && this.input.charAt(this.index) === "-") {
        this.index++;
        this.state = 'commentStart';
        this.delegate.beginComment();
      }
    },

    commentStart: function () {
      var char = this.consume();

      if (char === "-") {
        this.state = 'commentStartDash';
      } else if (char === ">") {
        this.delegate.finishComment();
        this.state = 'beforeData';
      } else {
        this.delegate.appendToCommentData(char);
        this.state = 'comment';
      }
    },

    commentStartDash: function () {
      var char = this.consume();

      if (char === "-") {
        this.state = 'commentEnd';
      } else if (char === ">") {
        this.delegate.finishComment();
        this.state = 'beforeData';
      } else {
        this.delegate.appendToCommentData("-");
        this.state = 'comment';
      }
    },

    comment: function () {
      var char = this.consume();

      if (char === "-") {
        this.state = 'commentEndDash';
      } else {
        this.delegate.appendToCommentData(char);
      }
    },

    commentEndDash: function () {
      var char = this.consume();

      if (char === "-") {
        this.state = 'commentEnd';
      } else {
        this.delegate.appendToCommentData("-" + char);
        this.state = 'comment';
      }
    },

    commentEnd: function () {
      var char = this.consume();

      if (char === ">") {
        this.delegate.finishComment();
        this.state = 'beforeData';
      } else {
        this.delegate.appendToCommentData("--" + char);
        this.state = 'comment';
      }
    },

    tagName: function () {
      var char = this.consume();

      if (_utils.isSpace(char)) {
        this.state = 'beforeAttributeName';
      } else if (char === "/") {
        this.state = 'selfClosingStartTag';
      } else if (char === ">") {
        this.delegate.finishTag();
        this.state = 'beforeData';
      } else {
        this.delegate.appendToTagName(char);
      }
    },

    beforeAttributeName: function () {
      var char = this.consume();

      if (_utils.isSpace(char)) {
        return;
      } else if (char === "/") {
        this.state = 'selfClosingStartTag';
      } else if (char === ">") {
        this.delegate.finishTag();
        this.state = 'beforeData';
      } else {
        this.state = 'attributeName';
        this.delegate.beginAttribute();
        this.delegate.appendToAttributeName(char);
      }
    },

    attributeName: function () {
      var char = this.consume();

      if (_utils.isSpace(char)) {
        this.state = 'afterAttributeName';
      } else if (char === "/") {
        this.delegate.beginAttributeValue(false);
        this.delegate.finishAttributeValue();
        this.state = 'selfClosingStartTag';
      } else if (char === "=") {
        this.state = 'beforeAttributeValue';
      } else if (char === ">") {
        this.delegate.beginAttributeValue(false);
        this.delegate.finishAttributeValue();
        this.delegate.finishTag();
        this.state = 'beforeData';
      } else {
        this.delegate.appendToAttributeName(char);
      }
    },

    afterAttributeName: function () {
      var char = this.consume();

      if (_utils.isSpace(char)) {
        return;
      } else if (char === "/") {
        this.delegate.beginAttributeValue(false);
        this.delegate.finishAttributeValue();
        this.state = 'selfClosingStartTag';
      } else if (char === "=") {
        this.state = 'beforeAttributeValue';
      } else if (char === ">") {
        this.delegate.beginAttributeValue(false);
        this.delegate.finishAttributeValue();
        this.delegate.finishTag();
        this.state = 'beforeData';
      } else {
        this.delegate.beginAttributeValue(false);
        this.delegate.finishAttributeValue();
        this.state = 'attributeName';
        this.delegate.beginAttribute();
        this.delegate.appendToAttributeName(char);
      }
    },

    beforeAttributeValue: function () {
      var char = this.consume();

      if (_utils.isSpace(char)) {} else if (char === '"') {
        this.state = 'attributeValueDoubleQuoted';
        this.delegate.beginAttributeValue(true);
      } else if (char === "'") {
        this.state = 'attributeValueSingleQuoted';
        this.delegate.beginAttributeValue(true);
      } else if (char === ">") {
        this.delegate.beginAttributeValue(false);
        this.delegate.finishAttributeValue();
        this.delegate.finishTag();
        this.state = 'beforeData';
      } else {
        this.state = 'attributeValueUnquoted';
        this.delegate.beginAttributeValue(false);
        this.delegate.appendToAttributeValue(char);
      }
    },

    attributeValueDoubleQuoted: function () {
      var char = this.consume();

      if (char === '"') {
        this.delegate.finishAttributeValue();
        this.state = 'afterAttributeValueQuoted';
      } else if (char === "&") {
        this.delegate.appendToAttributeValue(this.consumeCharRef('"') || "&");
      } else {
        this.delegate.appendToAttributeValue(char);
      }
    },

    attributeValueSingleQuoted: function () {
      var char = this.consume();

      if (char === "'") {
        this.delegate.finishAttributeValue();
        this.state = 'afterAttributeValueQuoted';
      } else if (char === "&") {
        this.delegate.appendToAttributeValue(this.consumeCharRef("'") || "&");
      } else {
        this.delegate.appendToAttributeValue(char);
      }
    },

    attributeValueUnquoted: function () {
      var char = this.consume();

      if (_utils.isSpace(char)) {
        this.delegate.finishAttributeValue();
        this.state = 'beforeAttributeName';
      } else if (char === "&") {
        this.delegate.appendToAttributeValue(this.consumeCharRef(">") || "&");
      } else if (char === ">") {
        this.delegate.finishAttributeValue();
        this.delegate.finishTag();
        this.state = 'beforeData';
      } else {
        this.delegate.appendToAttributeValue(char);
      }
    },

    afterAttributeValueQuoted: function () {
      var char = this.peek();

      if (_utils.isSpace(char)) {
        this.consume();
        this.state = 'beforeAttributeName';
      } else if (char === "/") {
        this.consume();
        this.state = 'selfClosingStartTag';
      } else if (char === ">") {
        this.consume();
        this.delegate.finishTag();
        this.state = 'beforeData';
      } else {
        this.state = 'beforeAttributeName';
      }
    },

    selfClosingStartTag: function () {
      var char = this.peek();

      if (char === ">") {
        this.consume();
        this.delegate.markTagAsSelfClosing();
        this.delegate.finishTag();
        this.state = 'beforeData';
      } else {
        this.state = 'beforeAttributeName';
      }
    },

    endTagOpen: function () {
      var char = this.consume();

      if (_utils.isAlpha(char)) {
        this.state = 'tagName';
        this.delegate.beginEndTag();
        this.delegate.appendToTagName(char.toLowerCase());
      }
    }
  }
};

exports.default = EventedTokenizer;
module.exports = exports.default;

},{"./utils":104}],103:[function(require,module,exports){
exports.__esModule = true;
exports.default = {
  Aacute: "Á", aacute: "á", Abreve: "Ă", abreve: "ă", ac: "∾", acd: "∿", acE: "∾̳", Acirc: "Â", acirc: "â", acute: "´", Acy: "А", acy: "а", AElig: "Æ", aelig: "æ", af: "\u2061", Afr: "𝔄", afr: "𝔞", Agrave: "À", agrave: "à", alefsym: "ℵ", aleph: "ℵ", Alpha: "Α", alpha: "α", Amacr: "Ā", amacr: "ā", amalg: "⨿", AMP: "&", amp: "&", And: "⩓", and: "∧", andand: "⩕", andd: "⩜", andslope: "⩘", andv: "⩚", ang: "∠", ange: "⦤", angle: "∠", angmsd: "∡", angmsdaa: "⦨", angmsdab: "⦩", angmsdac: "⦪", angmsdad: "⦫", angmsdae: "⦬", angmsdaf: "⦭", angmsdag: "⦮", angmsdah: "⦯", angrt: "∟", angrtvb: "⊾", angrtvbd: "⦝", angsph: "∢", angst: "Å", angzarr: "⍼", Aogon: "Ą", aogon: "ą", Aopf: "𝔸", aopf: "𝕒", ap: "≈", apacir: "⩯", apE: "⩰", ape: "≊", apid: "≋", apos: "'", ApplyFunction: "\u2061", approx: "≈", approxeq: "≊", Aring: "Å", aring: "å", Ascr: "𝒜", ascr: "𝒶", Assign: "≔", ast: "*", asymp: "≈", asympeq: "≍", Atilde: "Ã", atilde: "ã", Auml: "Ä", auml: "ä", awconint: "∳", awint: "⨑", backcong: "≌", backepsilon: "϶", backprime: "‵", backsim: "∽", backsimeq: "⋍", Backslash: "∖", Barv: "⫧", barvee: "⊽", Barwed: "⌆", barwed: "⌅", barwedge: "⌅", bbrk: "⎵", bbrktbrk: "⎶", bcong: "≌", Bcy: "Б", bcy: "б", bdquo: "„", becaus: "∵", Because: "∵", because: "∵", bemptyv: "⦰", bepsi: "϶", bernou: "ℬ", Bernoullis: "ℬ", Beta: "Β", beta: "β", beth: "ℶ", between: "≬", Bfr: "𝔅", bfr: "𝔟", bigcap: "⋂", bigcirc: "◯", bigcup: "⋃", bigodot: "⨀", bigoplus: "⨁", bigotimes: "⨂", bigsqcup: "⨆", bigstar: "★", bigtriangledown: "▽", bigtriangleup: "△", biguplus: "⨄", bigvee: "⋁", bigwedge: "⋀", bkarow: "⤍", blacklozenge: "⧫", blacksquare: "▪", blacktriangle: "▴", blacktriangledown: "▾", blacktriangleleft: "◂", blacktriangleright: "▸", blank: "␣", blk12: "▒", blk14: "░", blk34: "▓", block: "█", bne: "=⃥", bnequiv: "≡⃥", bNot: "⫭", bnot: "⌐", Bopf: "𝔹", bopf: "𝕓", bot: "⊥", bottom: "⊥", bowtie: "⋈", boxbox: "⧉", boxDL: "╗", boxDl: "╖", boxdL: "╕", boxdl: "┐", boxDR: "╔", boxDr: "╓", boxdR: "╒", boxdr: "┌", boxH: "═", boxh: "─", boxHD: "╦", boxHd: "╤", boxhD: "╥", boxhd: "┬", boxHU: "╩", boxHu: "╧", boxhU: "╨", boxhu: "┴", boxminus: "⊟", boxplus: "⊞", boxtimes: "⊠", boxUL: "╝", boxUl: "╜", boxuL: "╛", boxul: "┘", boxUR: "╚", boxUr: "╙", boxuR: "╘", boxur: "└", boxV: "║", boxv: "│", boxVH: "╬", boxVh: "╫", boxvH: "╪", boxvh: "┼", boxVL: "╣", boxVl: "╢", boxvL: "╡", boxvl: "┤", boxVR: "╠", boxVr: "╟", boxvR: "╞", boxvr: "├", bprime: "‵", Breve: "˘", breve: "˘", brvbar: "¦", Bscr: "ℬ", bscr: "𝒷", bsemi: "⁏", bsim: "∽", bsime: "⋍", bsol: "\\", bsolb: "⧅", bsolhsub: "⟈", bull: "•", bullet: "•", bump: "≎", bumpE: "⪮", bumpe: "≏", Bumpeq: "≎", bumpeq: "≏", Cacute: "Ć", cacute: "ć", Cap: "⋒", cap: "∩", capand: "⩄", capbrcup: "⩉", capcap: "⩋", capcup: "⩇", capdot: "⩀", CapitalDifferentialD: "ⅅ", caps: "∩︀", caret: "⁁", caron: "ˇ", Cayleys: "ℭ", ccaps: "⩍", Ccaron: "Č", ccaron: "č", Ccedil: "Ç", ccedil: "ç", Ccirc: "Ĉ", ccirc: "ĉ", Cconint: "∰", ccups: "⩌", ccupssm: "⩐", Cdot: "Ċ", cdot: "ċ", cedil: "¸", Cedilla: "¸", cemptyv: "⦲", cent: "¢", CenterDot: "·", centerdot: "·", Cfr: "ℭ", cfr: "𝔠", CHcy: "Ч", chcy: "ч", check: "✓", checkmark: "✓", Chi: "Χ", chi: "χ", cir: "○", circ: "ˆ", circeq: "≗", circlearrowleft: "↺", circlearrowright: "↻", circledast: "⊛", circledcirc: "⊚", circleddash: "⊝", CircleDot: "⊙", circledR: "®", circledS: "Ⓢ", CircleMinus: "⊖", CirclePlus: "⊕", CircleTimes: "⊗", cirE: "⧃", cire: "≗", cirfnint: "⨐", cirmid: "⫯", cirscir: "⧂", ClockwiseContourIntegral: "∲", CloseCurlyDoubleQuote: "”", CloseCurlyQuote: "’", clubs: "♣", clubsuit: "♣", Colon: "∷", colon: ":", Colone: "⩴", colone: "≔", coloneq: "≔", comma: ",", commat: "@", comp: "∁", compfn: "∘", complement: "∁", complexes: "ℂ", cong: "≅", congdot: "⩭", Congruent: "≡", Conint: "∯", conint: "∮", ContourIntegral: "∮", Copf: "ℂ", copf: "𝕔", coprod: "∐", Coproduct: "∐", COPY: "©", copy: "©", copysr: "℗", CounterClockwiseContourIntegral: "∳", crarr: "↵", Cross: "⨯", cross: "✗", Cscr: "𝒞", cscr: "𝒸", csub: "⫏", csube: "⫑", csup: "⫐", csupe: "⫒", ctdot: "⋯", cudarrl: "⤸", cudarrr: "⤵", cuepr: "⋞", cuesc: "⋟", cularr: "↶", cularrp: "⤽", Cup: "⋓", cup: "∪", cupbrcap: "⩈", CupCap: "≍", cupcap: "⩆", cupcup: "⩊", cupdot: "⊍", cupor: "⩅", cups: "∪︀", curarr: "↷", curarrm: "⤼", curlyeqprec: "⋞", curlyeqsucc: "⋟", curlyvee: "⋎", curlywedge: "⋏", curren: "¤", curvearrowleft: "↶", curvearrowright: "↷", cuvee: "⋎", cuwed: "⋏", cwconint: "∲", cwint: "∱", cylcty: "⌭", Dagger: "‡", dagger: "†", daleth: "ℸ", Darr: "↡", dArr: "⇓", darr: "↓", dash: "‐", Dashv: "⫤", dashv: "⊣", dbkarow: "⤏", dblac: "˝", Dcaron: "Ď", dcaron: "ď", Dcy: "Д", dcy: "д", DD: "ⅅ", dd: "ⅆ", ddagger: "‡", ddarr: "⇊", DDotrahd: "⤑", ddotseq: "⩷", deg: "°", Del: "∇", Delta: "Δ", delta: "δ", demptyv: "⦱", dfisht: "⥿", Dfr: "𝔇", dfr: "𝔡", dHar: "⥥", dharl: "⇃", dharr: "⇂", DiacriticalAcute: "´", DiacriticalDot: "˙", DiacriticalDoubleAcute: "˝", DiacriticalGrave: "`", DiacriticalTilde: "˜", diam: "⋄", Diamond: "⋄", diamond: "⋄", diamondsuit: "♦", diams: "♦", die: "¨", DifferentialD: "ⅆ", digamma: "ϝ", disin: "⋲", div: "÷", divide: "÷", divideontimes: "⋇", divonx: "⋇", DJcy: "Ђ", djcy: "ђ", dlcorn: "⌞", dlcrop: "⌍", dollar: "$", Dopf: "𝔻", dopf: "𝕕", Dot: "¨", dot: "˙", DotDot: "⃜", doteq: "≐", doteqdot: "≑", DotEqual: "≐", dotminus: "∸", dotplus: "∔", dotsquare: "⊡", doublebarwedge: "⌆", DoubleContourIntegral: "∯", DoubleDot: "¨", DoubleDownArrow: "⇓", DoubleLeftArrow: "⇐", DoubleLeftRightArrow: "⇔", DoubleLeftTee: "⫤", DoubleLongLeftArrow: "⟸", DoubleLongLeftRightArrow: "⟺", DoubleLongRightArrow: "⟹", DoubleRightArrow: "⇒", DoubleRightTee: "⊨", DoubleUpArrow: "⇑", DoubleUpDownArrow: "⇕", DoubleVerticalBar: "∥", DownArrow: "↓", Downarrow: "⇓", downarrow: "↓", DownArrowBar: "⤓", DownArrowUpArrow: "⇵", DownBreve: "̑", downdownarrows: "⇊", downharpoonleft: "⇃", downharpoonright: "⇂", DownLeftRightVector: "⥐", DownLeftTeeVector: "⥞", DownLeftVector: "↽", DownLeftVectorBar: "⥖", DownRightTeeVector: "⥟", DownRightVector: "⇁", DownRightVectorBar: "⥗", DownTee: "⊤", DownTeeArrow: "↧", drbkarow: "⤐", drcorn: "⌟", drcrop: "⌌", Dscr: "𝒟", dscr: "𝒹", DScy: "Ѕ", dscy: "ѕ", dsol: "⧶", Dstrok: "Đ", dstrok: "đ", dtdot: "⋱", dtri: "▿", dtrif: "▾", duarr: "⇵", duhar: "⥯", dwangle: "⦦", DZcy: "Џ", dzcy: "џ", dzigrarr: "⟿", Eacute: "É", eacute: "é", easter: "⩮", Ecaron: "Ě", ecaron: "ě", ecir: "≖", Ecirc: "Ê", ecirc: "ê", ecolon: "≕", Ecy: "Э", ecy: "э", eDDot: "⩷", Edot: "Ė", eDot: "≑", edot: "ė", ee: "ⅇ", efDot: "≒", Efr: "𝔈", efr: "𝔢", eg: "⪚", Egrave: "È", egrave: "è", egs: "⪖", egsdot: "⪘", el: "⪙", Element: "∈", elinters: "⏧", ell: "ℓ", els: "⪕", elsdot: "⪗", Emacr: "Ē", emacr: "ē", empty: "∅", emptyset: "∅", EmptySmallSquare: "◻", emptyv: "∅", EmptyVerySmallSquare: "▫", emsp: " ", emsp13: " ", emsp14: " ", ENG: "Ŋ", eng: "ŋ", ensp: " ", Eogon: "Ę", eogon: "ę", Eopf: "𝔼", eopf: "𝕖", epar: "⋕", eparsl: "⧣", eplus: "⩱", epsi: "ε", Epsilon: "Ε", epsilon: "ε", epsiv: "ϵ", eqcirc: "≖", eqcolon: "≕", eqsim: "≂", eqslantgtr: "⪖", eqslantless: "⪕", Equal: "⩵", equals: "=", EqualTilde: "≂", equest: "≟", Equilibrium: "⇌", equiv: "≡", equivDD: "⩸", eqvparsl: "⧥", erarr: "⥱", erDot: "≓", Escr: "ℰ", escr: "ℯ", esdot: "≐", Esim: "⩳", esim: "≂", Eta: "Η", eta: "η", ETH: "Ð", eth: "ð", Euml: "Ë", euml: "ë", euro: "€", excl: "!", exist: "∃", Exists: "∃", expectation: "ℰ", ExponentialE: "ⅇ", exponentiale: "ⅇ", fallingdotseq: "≒", Fcy: "Ф", fcy: "ф", female: "♀", ffilig: "ﬃ", fflig: "ﬀ", ffllig: "ﬄ", Ffr: "𝔉", ffr: "𝔣", filig: "ﬁ", FilledSmallSquare: "◼", FilledVerySmallSquare: "▪", fjlig: "fj", flat: "♭", fllig: "ﬂ", fltns: "▱", fnof: "ƒ", Fopf: "𝔽", fopf: "𝕗", ForAll: "∀", forall: "∀", fork: "⋔", forkv: "⫙", Fouriertrf: "ℱ", fpartint: "⨍", frac12: "½", frac13: "⅓", frac14: "¼", frac15: "⅕", frac16: "⅙", frac18: "⅛", frac23: "⅔", frac25: "⅖", frac34: "¾", frac35: "⅗", frac38: "⅜", frac45: "⅘", frac56: "⅚", frac58: "⅝", frac78: "⅞", frasl: "⁄", frown: "⌢", Fscr: "ℱ", fscr: "𝒻", gacute: "ǵ", Gamma: "Γ", gamma: "γ", Gammad: "Ϝ", gammad: "ϝ", gap: "⪆", Gbreve: "Ğ", gbreve: "ğ", Gcedil: "Ģ", Gcirc: "Ĝ", gcirc: "ĝ", Gcy: "Г", gcy: "г", Gdot: "Ġ", gdot: "ġ", gE: "≧", ge: "≥", gEl: "⪌", gel: "⋛", geq: "≥", geqq: "≧", geqslant: "⩾", ges: "⩾", gescc: "⪩", gesdot: "⪀", gesdoto: "⪂", gesdotol: "⪄", gesl: "⋛︀", gesles: "⪔", Gfr: "𝔊", gfr: "𝔤", Gg: "⋙", gg: "≫", ggg: "⋙", gimel: "ℷ", GJcy: "Ѓ", gjcy: "ѓ", gl: "≷", gla: "⪥", glE: "⪒", glj: "⪤", gnap: "⪊", gnapprox: "⪊", gnE: "≩", gne: "⪈", gneq: "⪈", gneqq: "≩", gnsim: "⋧", Gopf: "𝔾", gopf: "𝕘", grave: "`", GreaterEqual: "≥", GreaterEqualLess: "⋛", GreaterFullEqual: "≧", GreaterGreater: "⪢", GreaterLess: "≷", GreaterSlantEqual: "⩾", GreaterTilde: "≳", Gscr: "𝒢", gscr: "ℊ", gsim: "≳", gsime: "⪎", gsiml: "⪐", GT: ">", Gt: "≫", gt: ">", gtcc: "⪧", gtcir: "⩺", gtdot: "⋗", gtlPar: "⦕", gtquest: "⩼", gtrapprox: "⪆", gtrarr: "⥸", gtrdot: "⋗", gtreqless: "⋛", gtreqqless: "⪌", gtrless: "≷", gtrsim: "≳", gvertneqq: "≩︀", gvnE: "≩︀", Hacek: "ˇ", hairsp: " ", half: "½", hamilt: "ℋ", HARDcy: "Ъ", hardcy: "ъ", hArr: "⇔", harr: "↔", harrcir: "⥈", harrw: "↭", Hat: "^", hbar: "ℏ", Hcirc: "Ĥ", hcirc: "ĥ", hearts: "♥", heartsuit: "♥", hellip: "…", hercon: "⊹", Hfr: "ℌ", hfr: "𝔥", HilbertSpace: "ℋ", hksearow: "⤥", hkswarow: "⤦", hoarr: "⇿", homtht: "∻", hookleftarrow: "↩", hookrightarrow: "↪", Hopf: "ℍ", hopf: "𝕙", horbar: "―", HorizontalLine: "─", Hscr: "ℋ", hscr: "𝒽", hslash: "ℏ", Hstrok: "Ħ", hstrok: "ħ", HumpDownHump: "≎", HumpEqual: "≏", hybull: "⁃", hyphen: "‐", Iacute: "Í", iacute: "í", ic: "\u2063", Icirc: "Î", icirc: "î", Icy: "И", icy: "и", Idot: "İ", IEcy: "Е", iecy: "е", iexcl: "¡", iff: "⇔", Ifr: "ℑ", ifr: "𝔦", Igrave: "Ì", igrave: "ì", ii: "ⅈ", iiiint: "⨌", iiint: "∭", iinfin: "⧜", iiota: "℩", IJlig: "Ĳ", ijlig: "ĳ", Im: "ℑ", Imacr: "Ī", imacr: "ī", image: "ℑ", ImaginaryI: "ⅈ", imagline: "ℐ", imagpart: "ℑ", imath: "ı", imof: "⊷", imped: "Ƶ", Implies: "⇒", in: "∈", incare: "℅", infin: "∞", infintie: "⧝", inodot: "ı", Int: "∬", int: "∫", intcal: "⊺", integers: "ℤ", Integral: "∫", intercal: "⊺", Intersection: "⋂", intlarhk: "⨗", intprod: "⨼", InvisibleComma: "\u2063", InvisibleTimes: "\u2062", IOcy: "Ё", iocy: "ё", Iogon: "Į", iogon: "į", Iopf: "𝕀", iopf: "𝕚", Iota: "Ι", iota: "ι", iprod: "⨼", iquest: "¿", Iscr: "ℐ", iscr: "𝒾", isin: "∈", isindot: "⋵", isinE: "⋹", isins: "⋴", isinsv: "⋳", isinv: "∈", it: "\u2062", Itilde: "Ĩ", itilde: "ĩ", Iukcy: "І", iukcy: "і", Iuml: "Ï", iuml: "ï", Jcirc: "Ĵ", jcirc: "ĵ", Jcy: "Й", jcy: "й", Jfr: "𝔍", jfr: "𝔧", jmath: "ȷ", Jopf: "𝕁", jopf: "𝕛", Jscr: "𝒥", jscr: "𝒿", Jsercy: "Ј", jsercy: "ј", Jukcy: "Є", jukcy: "є", Kappa: "Κ", kappa: "κ", kappav: "ϰ", Kcedil: "Ķ", kcedil: "ķ", Kcy: "К", kcy: "к", Kfr: "𝔎", kfr: "𝔨", kgreen: "ĸ", KHcy: "Х", khcy: "х", KJcy: "Ќ", kjcy: "ќ", Kopf: "𝕂", kopf: "𝕜", Kscr: "𝒦", kscr: "𝓀", lAarr: "⇚", Lacute: "Ĺ", lacute: "ĺ", laemptyv: "⦴", lagran: "ℒ", Lambda: "Λ", lambda: "λ", Lang: "⟪", lang: "⟨", langd: "⦑", langle: "⟨", lap: "⪅", Laplacetrf: "ℒ", laquo: "«", Larr: "↞", lArr: "⇐", larr: "←", larrb: "⇤", larrbfs: "⤟", larrfs: "⤝", larrhk: "↩", larrlp: "↫", larrpl: "⤹", larrsim: "⥳", larrtl: "↢", lat: "⪫", lAtail: "⤛", latail: "⤙", late: "⪭", lates: "⪭︀", lBarr: "⤎", lbarr: "⤌", lbbrk: "❲", lbrace: "{", lbrack: "[", lbrke: "⦋", lbrksld: "⦏", lbrkslu: "⦍", Lcaron: "Ľ", lcaron: "ľ", Lcedil: "Ļ", lcedil: "ļ", lceil: "⌈", lcub: "{", Lcy: "Л", lcy: "л", ldca: "⤶", ldquo: "“", ldquor: "„", ldrdhar: "⥧", ldrushar: "⥋", ldsh: "↲", lE: "≦", le: "≤", LeftAngleBracket: "⟨", LeftArrow: "←", Leftarrow: "⇐", leftarrow: "←", LeftArrowBar: "⇤", LeftArrowRightArrow: "⇆", leftarrowtail: "↢", LeftCeiling: "⌈", LeftDoubleBracket: "⟦", LeftDownTeeVector: "⥡", LeftDownVector: "⇃", LeftDownVectorBar: "⥙", LeftFloor: "⌊", leftharpoondown: "↽", leftharpoonup: "↼", leftleftarrows: "⇇", LeftRightArrow: "↔", Leftrightarrow: "⇔", leftrightarrow: "↔", leftrightarrows: "⇆", leftrightharpoons: "⇋", leftrightsquigarrow: "↭", LeftRightVector: "⥎", LeftTee: "⊣", LeftTeeArrow: "↤", LeftTeeVector: "⥚", leftthreetimes: "⋋", LeftTriangle: "⊲", LeftTriangleBar: "⧏", LeftTriangleEqual: "⊴", LeftUpDownVector: "⥑", LeftUpTeeVector: "⥠", LeftUpVector: "↿", LeftUpVectorBar: "⥘", LeftVector: "↼", LeftVectorBar: "⥒", lEg: "⪋", leg: "⋚", leq: "≤", leqq: "≦", leqslant: "⩽", les: "⩽", lescc: "⪨", lesdot: "⩿", lesdoto: "⪁", lesdotor: "⪃", lesg: "⋚︀", lesges: "⪓", lessapprox: "⪅", lessdot: "⋖", lesseqgtr: "⋚", lesseqqgtr: "⪋", LessEqualGreater: "⋚", LessFullEqual: "≦", LessGreater: "≶", lessgtr: "≶", LessLess: "⪡", lesssim: "≲", LessSlantEqual: "⩽", LessTilde: "≲", lfisht: "⥼", lfloor: "⌊", Lfr: "𝔏", lfr: "𝔩", lg: "≶", lgE: "⪑", lHar: "⥢", lhard: "↽", lharu: "↼", lharul: "⥪", lhblk: "▄", LJcy: "Љ", ljcy: "љ", Ll: "⋘", ll: "≪", llarr: "⇇", llcorner: "⌞", Lleftarrow: "⇚", llhard: "⥫", lltri: "◺", Lmidot: "Ŀ", lmidot: "ŀ", lmoust: "⎰", lmoustache: "⎰", lnap: "⪉", lnapprox: "⪉", lnE: "≨", lne: "⪇", lneq: "⪇", lneqq: "≨", lnsim: "⋦", loang: "⟬", loarr: "⇽", lobrk: "⟦", LongLeftArrow: "⟵", Longleftarrow: "⟸", longleftarrow: "⟵", LongLeftRightArrow: "⟷", Longleftrightarrow: "⟺", longleftrightarrow: "⟷", longmapsto: "⟼", LongRightArrow: "⟶", Longrightarrow: "⟹", longrightarrow: "⟶", looparrowleft: "↫", looparrowright: "↬", lopar: "⦅", Lopf: "𝕃", lopf: "𝕝", loplus: "⨭", lotimes: "⨴", lowast: "∗", lowbar: "_", LowerLeftArrow: "↙", LowerRightArrow: "↘", loz: "◊", lozenge: "◊", lozf: "⧫", lpar: "(", lparlt: "⦓", lrarr: "⇆", lrcorner: "⌟", lrhar: "⇋", lrhard: "⥭", lrm: "\u200e", lrtri: "⊿", lsaquo: "‹", Lscr: "ℒ", lscr: "𝓁", Lsh: "↰", lsh: "↰", lsim: "≲", lsime: "⪍", lsimg: "⪏", lsqb: "[", lsquo: "‘", lsquor: "‚", Lstrok: "Ł", lstrok: "ł", LT: "<", Lt: "≪", lt: "<", ltcc: "⪦", ltcir: "⩹", ltdot: "⋖", lthree: "⋋", ltimes: "⋉", ltlarr: "⥶", ltquest: "⩻", ltri: "◃", ltrie: "⊴", ltrif: "◂", ltrPar: "⦖", lurdshar: "⥊", luruhar: "⥦", lvertneqq: "≨︀", lvnE: "≨︀", macr: "¯", male: "♂", malt: "✠", maltese: "✠", Map: "⤅", map: "↦", mapsto: "↦", mapstodown: "↧", mapstoleft: "↤", mapstoup: "↥", marker: "▮", mcomma: "⨩", Mcy: "М", mcy: "м", mdash: "—", mDDot: "∺", measuredangle: "∡", MediumSpace: " ", Mellintrf: "ℳ", Mfr: "𝔐", mfr: "𝔪", mho: "℧", micro: "µ", mid: "∣", midast: "*", midcir: "⫰", middot: "·", minus: "−", minusb: "⊟", minusd: "∸", minusdu: "⨪", MinusPlus: "∓", mlcp: "⫛", mldr: "…", mnplus: "∓", models: "⊧", Mopf: "𝕄", mopf: "𝕞", mp: "∓", Mscr: "ℳ", mscr: "𝓂", mstpos: "∾", Mu: "Μ", mu: "μ", multimap: "⊸", mumap: "⊸", nabla: "∇", Nacute: "Ń", nacute: "ń", nang: "∠⃒", nap: "≉", napE: "⩰̸", napid: "≋̸", napos: "ŉ", napprox: "≉", natur: "♮", natural: "♮", naturals: "ℕ", nbsp: " ", nbump: "≎̸", nbumpe: "≏̸", ncap: "⩃", Ncaron: "Ň", ncaron: "ň", Ncedil: "Ņ", ncedil: "ņ", ncong: "≇", ncongdot: "⩭̸", ncup: "⩂", Ncy: "Н", ncy: "н", ndash: "–", ne: "≠", nearhk: "⤤", neArr: "⇗", nearr: "↗", nearrow: "↗", nedot: "≐̸", NegativeMediumSpace: "​", NegativeThickSpace: "​", NegativeThinSpace: "​", NegativeVeryThinSpace: "​", nequiv: "≢", nesear: "⤨", nesim: "≂̸", NestedGreaterGreater: "≫", NestedLessLess: "≪", NewLine: "\u000a", nexist: "∄", nexists: "∄", Nfr: "𝔑", nfr: "𝔫", ngE: "≧̸", nge: "≱", ngeq: "≱", ngeqq: "≧̸", ngeqslant: "⩾̸", nges: "⩾̸", nGg: "⋙̸", ngsim: "≵", nGt: "≫⃒", ngt: "≯", ngtr: "≯", nGtv: "≫̸", nhArr: "⇎", nharr: "↮", nhpar: "⫲", ni: "∋", nis: "⋼", nisd: "⋺", niv: "∋", NJcy: "Њ", njcy: "њ", nlArr: "⇍", nlarr: "↚", nldr: "‥", nlE: "≦̸", nle: "≰", nLeftarrow: "⇍", nleftarrow: "↚", nLeftrightarrow: "⇎", nleftrightarrow: "↮", nleq: "≰", nleqq: "≦̸", nleqslant: "⩽̸", nles: "⩽̸", nless: "≮", nLl: "⋘̸", nlsim: "≴", nLt: "≪⃒", nlt: "≮", nltri: "⋪", nltrie: "⋬", nLtv: "≪̸", nmid: "∤", NoBreak: "\u2060", NonBreakingSpace: " ", Nopf: "ℕ", nopf: "𝕟", Not: "⫬", not: "¬", NotCongruent: "≢", NotCupCap: "≭", NotDoubleVerticalBar: "∦", NotElement: "∉", NotEqual: "≠", NotEqualTilde: "≂̸", NotExists: "∄", NotGreater: "≯", NotGreaterEqual: "≱", NotGreaterFullEqual: "≧̸", NotGreaterGreater: "≫̸", NotGreaterLess: "≹", NotGreaterSlantEqual: "⩾̸", NotGreaterTilde: "≵", NotHumpDownHump: "≎̸", NotHumpEqual: "≏̸", notin: "∉", notindot: "⋵̸", notinE: "⋹̸", notinva: "∉", notinvb: "⋷", notinvc: "⋶", NotLeftTriangle: "⋪", NotLeftTriangleBar: "⧏̸", NotLeftTriangleEqual: "⋬", NotLess: "≮", NotLessEqual: "≰", NotLessGreater: "≸", NotLessLess: "≪̸", NotLessSlantEqual: "⩽̸", NotLessTilde: "≴", NotNestedGreaterGreater: "⪢̸", NotNestedLessLess: "⪡̸", notni: "∌", notniva: "∌", notnivb: "⋾", notnivc: "⋽", NotPrecedes: "⊀", NotPrecedesEqual: "⪯̸", NotPrecedesSlantEqual: "⋠", NotReverseElement: "∌", NotRightTriangle: "⋫", NotRightTriangleBar: "⧐̸", NotRightTriangleEqual: "⋭", NotSquareSubset: "⊏̸", NotSquareSubsetEqual: "⋢", NotSquareSuperset: "⊐̸", NotSquareSupersetEqual: "⋣", NotSubset: "⊂⃒", NotSubsetEqual: "⊈", NotSucceeds: "⊁", NotSucceedsEqual: "⪰̸", NotSucceedsSlantEqual: "⋡", NotSucceedsTilde: "≿̸", NotSuperset: "⊃⃒", NotSupersetEqual: "⊉", NotTilde: "≁", NotTildeEqual: "≄", NotTildeFullEqual: "≇", NotTildeTilde: "≉", NotVerticalBar: "∤", npar: "∦", nparallel: "∦", nparsl: "⫽⃥", npart: "∂̸", npolint: "⨔", npr: "⊀", nprcue: "⋠", npre: "⪯̸", nprec: "⊀", npreceq: "⪯̸", nrArr: "⇏", nrarr: "↛", nrarrc: "⤳̸", nrarrw: "↝̸", nRightarrow: "⇏", nrightarrow: "↛", nrtri: "⋫", nrtrie: "⋭", nsc: "⊁", nsccue: "⋡", nsce: "⪰̸", Nscr: "𝒩", nscr: "𝓃", nshortmid: "∤", nshortparallel: "∦", nsim: "≁", nsime: "≄", nsimeq: "≄", nsmid: "∤", nspar: "∦", nsqsube: "⋢", nsqsupe: "⋣", nsub: "⊄", nsubE: "⫅̸", nsube: "⊈", nsubset: "⊂⃒", nsubseteq: "⊈", nsubseteqq: "⫅̸", nsucc: "⊁", nsucceq: "⪰̸", nsup: "⊅", nsupE: "⫆̸", nsupe: "⊉", nsupset: "⊃⃒", nsupseteq: "⊉", nsupseteqq: "⫆̸", ntgl: "≹", Ntilde: "Ñ", ntilde: "ñ", ntlg: "≸", ntriangleleft: "⋪", ntrianglelefteq: "⋬", ntriangleright: "⋫", ntrianglerighteq: "⋭", Nu: "Ν", nu: "ν", num: "#", numero: "№", numsp: " ", nvap: "≍⃒", nVDash: "⊯", nVdash: "⊮", nvDash: "⊭", nvdash: "⊬", nvge: "≥⃒", nvgt: ">⃒", nvHarr: "⤄", nvinfin: "⧞", nvlArr: "⤂", nvle: "≤⃒", nvlt: "<⃒", nvltrie: "⊴⃒", nvrArr: "⤃", nvrtrie: "⊵⃒", nvsim: "∼⃒", nwarhk: "⤣", nwArr: "⇖", nwarr: "↖", nwarrow: "↖", nwnear: "⤧", Oacute: "Ó", oacute: "ó", oast: "⊛", ocir: "⊚", Ocirc: "Ô", ocirc: "ô", Ocy: "О", ocy: "о", odash: "⊝", Odblac: "Ő", odblac: "ő", odiv: "⨸", odot: "⊙", odsold: "⦼", OElig: "Œ", oelig: "œ", ofcir: "⦿", Ofr: "𝔒", ofr: "𝔬", ogon: "˛", Ograve: "Ò", ograve: "ò", ogt: "⧁", ohbar: "⦵", ohm: "Ω", oint: "∮", olarr: "↺", olcir: "⦾", olcross: "⦻", oline: "‾", olt: "⧀", Omacr: "Ō", omacr: "ō", Omega: "Ω", omega: "ω", Omicron: "Ο", omicron: "ο", omid: "⦶", ominus: "⊖", Oopf: "𝕆", oopf: "𝕠", opar: "⦷", OpenCurlyDoubleQuote: "“", OpenCurlyQuote: "‘", operp: "⦹", oplus: "⊕", Or: "⩔", or: "∨", orarr: "↻", ord: "⩝", order: "ℴ", orderof: "ℴ", ordf: "ª", ordm: "º", origof: "⊶", oror: "⩖", orslope: "⩗", orv: "⩛", oS: "Ⓢ", Oscr: "𝒪", oscr: "ℴ", Oslash: "Ø", oslash: "ø", osol: "⊘", Otilde: "Õ", otilde: "õ", Otimes: "⨷", otimes: "⊗", otimesas: "⨶", Ouml: "Ö", ouml: "ö", ovbar: "⌽", OverBar: "‾", OverBrace: "⏞", OverBracket: "⎴", OverParenthesis: "⏜", par: "∥", para: "¶", parallel: "∥", parsim: "⫳", parsl: "⫽", part: "∂", PartialD: "∂", Pcy: "П", pcy: "п", percnt: "%", period: ".", permil: "‰", perp: "⊥", pertenk: "‱", Pfr: "𝔓", pfr: "𝔭", Phi: "Φ", phi: "φ", phiv: "ϕ", phmmat: "ℳ", phone: "☎", Pi: "Π", pi: "π", pitchfork: "⋔", piv: "ϖ", planck: "ℏ", planckh: "ℎ", plankv: "ℏ", plus: "+", plusacir: "⨣", plusb: "⊞", pluscir: "⨢", plusdo: "∔", plusdu: "⨥", pluse: "⩲", PlusMinus: "±", plusmn: "±", plussim: "⨦", plustwo: "⨧", pm: "±", Poincareplane: "ℌ", pointint: "⨕", Popf: "ℙ", popf: "𝕡", pound: "£", Pr: "⪻", pr: "≺", prap: "⪷", prcue: "≼", prE: "⪳", pre: "⪯", prec: "≺", precapprox: "⪷", preccurlyeq: "≼", Precedes: "≺", PrecedesEqual: "⪯", PrecedesSlantEqual: "≼", PrecedesTilde: "≾", preceq: "⪯", precnapprox: "⪹", precneqq: "⪵", precnsim: "⋨", precsim: "≾", Prime: "″", prime: "′", primes: "ℙ", prnap: "⪹", prnE: "⪵", prnsim: "⋨", prod: "∏", Product: "∏", profalar: "⌮", profline: "⌒", profsurf: "⌓", prop: "∝", Proportion: "∷", Proportional: "∝", propto: "∝", prsim: "≾", prurel: "⊰", Pscr: "𝒫", pscr: "𝓅", Psi: "Ψ", psi: "ψ", puncsp: " ", Qfr: "𝔔", qfr: "𝔮", qint: "⨌", Qopf: "ℚ", qopf: "𝕢", qprime: "⁗", Qscr: "𝒬", qscr: "𝓆", quaternions: "ℍ", quatint: "⨖", quest: "?", questeq: "≟", QUOT: "\"", quot: "\"", rAarr: "⇛", race: "∽̱", Racute: "Ŕ", racute: "ŕ", radic: "√", raemptyv: "⦳", Rang: "⟫", rang: "⟩", rangd: "⦒", range: "⦥", rangle: "⟩", raquo: "»", Rarr: "↠", rArr: "⇒", rarr: "→", rarrap: "⥵", rarrb: "⇥", rarrbfs: "⤠", rarrc: "⤳", rarrfs: "⤞", rarrhk: "↪", rarrlp: "↬", rarrpl: "⥅", rarrsim: "⥴", Rarrtl: "⤖", rarrtl: "↣", rarrw: "↝", rAtail: "⤜", ratail: "⤚", ratio: "∶", rationals: "ℚ", RBarr: "⤐", rBarr: "⤏", rbarr: "⤍", rbbrk: "❳", rbrace: "}", rbrack: "]", rbrke: "⦌", rbrksld: "⦎", rbrkslu: "⦐", Rcaron: "Ř", rcaron: "ř", Rcedil: "Ŗ", rcedil: "ŗ", rceil: "⌉", rcub: "}", Rcy: "Р", rcy: "р", rdca: "⤷", rdldhar: "⥩", rdquo: "”", rdquor: "”", rdsh: "↳", Re: "ℜ", real: "ℜ", realine: "ℛ", realpart: "ℜ", reals: "ℝ", rect: "▭", REG: "®", reg: "®", ReverseElement: "∋", ReverseEquilibrium: "⇋", ReverseUpEquilibrium: "⥯", rfisht: "⥽", rfloor: "⌋", Rfr: "ℜ", rfr: "𝔯", rHar: "⥤", rhard: "⇁", rharu: "⇀", rharul: "⥬", Rho: "Ρ", rho: "ρ", rhov: "ϱ", RightAngleBracket: "⟩", RightArrow: "→", Rightarrow: "⇒", rightarrow: "→", RightArrowBar: "⇥", RightArrowLeftArrow: "⇄", rightarrowtail: "↣", RightCeiling: "⌉", RightDoubleBracket: "⟧", RightDownTeeVector: "⥝", RightDownVector: "⇂", RightDownVectorBar: "⥕", RightFloor: "⌋", rightharpoondown: "⇁", rightharpoonup: "⇀", rightleftarrows: "⇄", rightleftharpoons: "⇌", rightrightarrows: "⇉", rightsquigarrow: "↝", RightTee: "⊢", RightTeeArrow: "↦", RightTeeVector: "⥛", rightthreetimes: "⋌", RightTriangle: "⊳", RightTriangleBar: "⧐", RightTriangleEqual: "⊵", RightUpDownVector: "⥏", RightUpTeeVector: "⥜", RightUpVector: "↾", RightUpVectorBar: "⥔", RightVector: "⇀", RightVectorBar: "⥓", ring: "˚", risingdotseq: "≓", rlarr: "⇄", rlhar: "⇌", rlm: "\u200f", rmoust: "⎱", rmoustache: "⎱", rnmid: "⫮", roang: "⟭", roarr: "⇾", robrk: "⟧", ropar: "⦆", Ropf: "ℝ", ropf: "𝕣", roplus: "⨮", rotimes: "⨵", RoundImplies: "⥰", rpar: ")", rpargt: "⦔", rppolint: "⨒", rrarr: "⇉", Rrightarrow: "⇛", rsaquo: "›", Rscr: "ℛ", rscr: "𝓇", Rsh: "↱", rsh: "↱", rsqb: "]", rsquo: "’", rsquor: "’", rthree: "⋌", rtimes: "⋊", rtri: "▹", rtrie: "⊵", rtrif: "▸", rtriltri: "⧎", RuleDelayed: "⧴", ruluhar: "⥨", rx: "℞", Sacute: "Ś", sacute: "ś", sbquo: "‚", Sc: "⪼", sc: "≻", scap: "⪸", Scaron: "Š", scaron: "š", sccue: "≽", scE: "⪴", sce: "⪰", Scedil: "Ş", scedil: "ş", Scirc: "Ŝ", scirc: "ŝ", scnap: "⪺", scnE: "⪶", scnsim: "⋩", scpolint: "⨓", scsim: "≿", Scy: "С", scy: "с", sdot: "⋅", sdotb: "⊡", sdote: "⩦", searhk: "⤥", seArr: "⇘", searr: "↘", searrow: "↘", sect: "§", semi: ";", seswar: "⤩", setminus: "∖", setmn: "∖", sext: "✶", Sfr: "𝔖", sfr: "𝔰", sfrown: "⌢", sharp: "♯", SHCHcy: "Щ", shchcy: "щ", SHcy: "Ш", shcy: "ш", ShortDownArrow: "↓", ShortLeftArrow: "←", shortmid: "∣", shortparallel: "∥", ShortRightArrow: "→", ShortUpArrow: "↑", shy: "\u00ad", Sigma: "Σ", sigma: "σ", sigmaf: "ς", sigmav: "ς", sim: "∼", simdot: "⩪", sime: "≃", simeq: "≃", simg: "⪞", simgE: "⪠", siml: "⪝", simlE: "⪟", simne: "≆", simplus: "⨤", simrarr: "⥲", slarr: "←", SmallCircle: "∘", smallsetminus: "∖", smashp: "⨳", smeparsl: "⧤", smid: "∣", smile: "⌣", smt: "⪪", smte: "⪬", smtes: "⪬︀", SOFTcy: "Ь", softcy: "ь", sol: "/", solb: "⧄", solbar: "⌿", Sopf: "𝕊", sopf: "𝕤", spades: "♠", spadesuit: "♠", spar: "∥", sqcap: "⊓", sqcaps: "⊓︀", sqcup: "⊔", sqcups: "⊔︀", Sqrt: "√", sqsub: "⊏", sqsube: "⊑", sqsubset: "⊏", sqsubseteq: "⊑", sqsup: "⊐", sqsupe: "⊒", sqsupset: "⊐", sqsupseteq: "⊒", squ: "□", Square: "□", square: "□", SquareIntersection: "⊓", SquareSubset: "⊏", SquareSubsetEqual: "⊑", SquareSuperset: "⊐", SquareSupersetEqual: "⊒", SquareUnion: "⊔", squarf: "▪", squf: "▪", srarr: "→", Sscr: "𝒮", sscr: "𝓈", ssetmn: "∖", ssmile: "⌣", sstarf: "⋆", Star: "⋆", star: "☆", starf: "★", straightepsilon: "ϵ", straightphi: "ϕ", strns: "¯", Sub: "⋐", sub: "⊂", subdot: "⪽", subE: "⫅", sube: "⊆", subedot: "⫃", submult: "⫁", subnE: "⫋", subne: "⊊", subplus: "⪿", subrarr: "⥹", Subset: "⋐", subset: "⊂", subseteq: "⊆", subseteqq: "⫅", SubsetEqual: "⊆", subsetneq: "⊊", subsetneqq: "⫋", subsim: "⫇", subsub: "⫕", subsup: "⫓", succ: "≻", succapprox: "⪸", succcurlyeq: "≽", Succeeds: "≻", SucceedsEqual: "⪰", SucceedsSlantEqual: "≽", SucceedsTilde: "≿", succeq: "⪰", succnapprox: "⪺", succneqq: "⪶", succnsim: "⋩", succsim: "≿", SuchThat: "∋", Sum: "∑", sum: "∑", sung: "♪", Sup: "⋑", sup: "⊃", sup1: "¹", sup2: "²", sup3: "³", supdot: "⪾", supdsub: "⫘", supE: "⫆", supe: "⊇", supedot: "⫄", Superset: "⊃", SupersetEqual: "⊇", suphsol: "⟉", suphsub: "⫗", suplarr: "⥻", supmult: "⫂", supnE: "⫌", supne: "⊋", supplus: "⫀", Supset: "⋑", supset: "⊃", supseteq: "⊇", supseteqq: "⫆", supsetneq: "⊋", supsetneqq: "⫌", supsim: "⫈", supsub: "⫔", supsup: "⫖", swarhk: "⤦", swArr: "⇙", swarr: "↙", swarrow: "↙", swnwar: "⤪", szlig: "ß", Tab: "\u0009", target: "⌖", Tau: "Τ", tau: "τ", tbrk: "⎴", Tcaron: "Ť", tcaron: "ť", Tcedil: "Ţ", tcedil: "ţ", Tcy: "Т", tcy: "т", tdot: "⃛", telrec: "⌕", Tfr: "𝔗", tfr: "𝔱", there4: "∴", Therefore: "∴", therefore: "∴", Theta: "Θ", theta: "θ", thetasym: "ϑ", thetav: "ϑ", thickapprox: "≈", thicksim: "∼", ThickSpace: "  ", thinsp: " ", ThinSpace: " ", thkap: "≈", thksim: "∼", THORN: "Þ", thorn: "þ", Tilde: "∼", tilde: "˜", TildeEqual: "≃", TildeFullEqual: "≅", TildeTilde: "≈", times: "×", timesb: "⊠", timesbar: "⨱", timesd: "⨰", tint: "∭", toea: "⤨", top: "⊤", topbot: "⌶", topcir: "⫱", Topf: "𝕋", topf: "𝕥", topfork: "⫚", tosa: "⤩", tprime: "‴", TRADE: "™", trade: "™", triangle: "▵", triangledown: "▿", triangleleft: "◃", trianglelefteq: "⊴", triangleq: "≜", triangleright: "▹", trianglerighteq: "⊵", tridot: "◬", trie: "≜", triminus: "⨺", TripleDot: "⃛", triplus: "⨹", trisb: "⧍", tritime: "⨻", trpezium: "⏢", Tscr: "𝒯", tscr: "𝓉", TScy: "Ц", tscy: "ц", TSHcy: "Ћ", tshcy: "ћ", Tstrok: "Ŧ", tstrok: "ŧ", twixt: "≬", twoheadleftarrow: "↞", twoheadrightarrow: "↠", Uacute: "Ú", uacute: "ú", Uarr: "↟", uArr: "⇑", uarr: "↑", Uarrocir: "⥉", Ubrcy: "Ў", ubrcy: "ў", Ubreve: "Ŭ", ubreve: "ŭ", Ucirc: "Û", ucirc: "û", Ucy: "У", ucy: "у", udarr: "⇅", Udblac: "Ű", udblac: "ű", udhar: "⥮", ufisht: "⥾", Ufr: "𝔘", ufr: "𝔲", Ugrave: "Ù", ugrave: "ù", uHar: "⥣", uharl: "↿", uharr: "↾", uhblk: "▀", ulcorn: "⌜", ulcorner: "⌜", ulcrop: "⌏", ultri: "◸", Umacr: "Ū", umacr: "ū", uml: "¨", UnderBar: "_", UnderBrace: "⏟", UnderBracket: "⎵", UnderParenthesis: "⏝", Union: "⋃", UnionPlus: "⊎", Uogon: "Ų", uogon: "ų", Uopf: "𝕌", uopf: "𝕦", UpArrow: "↑", Uparrow: "⇑", uparrow: "↑", UpArrowBar: "⤒", UpArrowDownArrow: "⇅", UpDownArrow: "↕", Updownarrow: "⇕", updownarrow: "↕", UpEquilibrium: "⥮", upharpoonleft: "↿", upharpoonright: "↾", uplus: "⊎", UpperLeftArrow: "↖", UpperRightArrow: "↗", Upsi: "ϒ", upsi: "υ", upsih: "ϒ", Upsilon: "Υ", upsilon: "υ", UpTee: "⊥", UpTeeArrow: "↥", upuparrows: "⇈", urcorn: "⌝", urcorner: "⌝", urcrop: "⌎", Uring: "Ů", uring: "ů", urtri: "◹", Uscr: "𝒰", uscr: "𝓊", utdot: "⋰", Utilde: "Ũ", utilde: "ũ", utri: "▵", utrif: "▴", uuarr: "⇈", Uuml: "Ü", uuml: "ü", uwangle: "⦧", vangrt: "⦜", varepsilon: "ϵ", varkappa: "ϰ", varnothing: "∅", varphi: "ϕ", varpi: "ϖ", varpropto: "∝", vArr: "⇕", varr: "↕", varrho: "ϱ", varsigma: "ς", varsubsetneq: "⊊︀", varsubsetneqq: "⫋︀", varsupsetneq: "⊋︀", varsupsetneqq: "⫌︀", vartheta: "ϑ", vartriangleleft: "⊲", vartriangleright: "⊳", Vbar: "⫫", vBar: "⫨", vBarv: "⫩", Vcy: "В", vcy: "в", VDash: "⊫", Vdash: "⊩", vDash: "⊨", vdash: "⊢", Vdashl: "⫦", Vee: "⋁", vee: "∨", veebar: "⊻", veeeq: "≚", vellip: "⋮", Verbar: "‖", verbar: "|", Vert: "‖", vert: "|", VerticalBar: "∣", VerticalLine: "|", VerticalSeparator: "❘", VerticalTilde: "≀", VeryThinSpace: " ", Vfr: "𝔙", vfr: "𝔳", vltri: "⊲", vnsub: "⊂⃒", vnsup: "⊃⃒", Vopf: "𝕍", vopf: "𝕧", vprop: "∝", vrtri: "⊳", Vscr: "𝒱", vscr: "𝓋", vsubnE: "⫋︀", vsubne: "⊊︀", vsupnE: "⫌︀", vsupne: "⊋︀", Vvdash: "⊪", vzigzag: "⦚", Wcirc: "Ŵ", wcirc: "ŵ", wedbar: "⩟", Wedge: "⋀", wedge: "∧", wedgeq: "≙", weierp: "℘", Wfr: "𝔚", wfr: "𝔴", Wopf: "𝕎", wopf: "𝕨", wp: "℘", wr: "≀", wreath: "≀", Wscr: "𝒲", wscr: "𝓌", xcap: "⋂", xcirc: "◯", xcup: "⋃", xdtri: "▽", Xfr: "𝔛", xfr: "𝔵", xhArr: "⟺", xharr: "⟷", Xi: "Ξ", xi: "ξ", xlArr: "⟸", xlarr: "⟵", xmap: "⟼", xnis: "⋻", xodot: "⨀", Xopf: "𝕏", xopf: "𝕩", xoplus: "⨁", xotime: "⨂", xrArr: "⟹", xrarr: "⟶", Xscr: "𝒳", xscr: "𝓍", xsqcup: "⨆", xuplus: "⨄", xutri: "△", xvee: "⋁", xwedge: "⋀", Yacute: "Ý", yacute: "ý", YAcy: "Я", yacy: "я", Ycirc: "Ŷ", ycirc: "ŷ", Ycy: "Ы", ycy: "ы", yen: "¥", Yfr: "𝔜", yfr: "𝔶", YIcy: "Ї", yicy: "ї", Yopf: "𝕐", yopf: "𝕪", Yscr: "𝒴", yscr: "𝓎", YUcy: "Ю", yucy: "ю", Yuml: "Ÿ", yuml: "ÿ", Zacute: "Ź", zacute: "ź", Zcaron: "Ž", zcaron: "ž", Zcy: "З", zcy: "з", Zdot: "Ż", zdot: "ż", zeetrf: "ℨ", ZeroWidthSpace: "​", Zeta: "Ζ", zeta: "ζ", Zfr: "ℨ", zfr: "𝔷", ZHcy: "Ж", zhcy: "ж", zigrarr: "⇝", Zopf: "ℤ", zopf: "𝕫", Zscr: "𝒵", zscr: "𝓏", zwj: "\u200d", zwnj: "\u200c"
};
module.exports = exports.default;

},{}],104:[function(require,module,exports){
exports.__esModule = true;
exports.isSpace = isSpace;
exports.isAlpha = isAlpha;
exports.preprocessInput = preprocessInput;
var WSP = /[\t\n\f ]/;
var ALPHA = /[A-Za-z]/;
var CRLF = /\r\n?/g;

function isSpace(char) {
  return WSP.test(char);
}

function isAlpha(char) {
  return ALPHA.test(char);
}

function preprocessInput(input) {
  return input.replace(CRLF, "\n");
}

},{}],105:[function(require,module,exports){
// Load modules

var Stringify = require('./stringify');
var Parse = require('./parse');


// Declare internals

var internals = {};


module.exports = {
    stringify: Stringify,
    parse: Parse
};

},{"./parse":106,"./stringify":107}],106:[function(require,module,exports){
// Load modules

var Utils = require('./utils');


// Declare internals

var internals = {
    delimiter: '&',
    depth: 5,
    arrayLimit: 20,
    parameterLimit: 1000,
    strictNullHandling: false,
    plainObjects: false,
    allowPrototypes: false,
    allowDots: false
};


internals.parseValues = function (str, options) {

    var obj = {};
    var parts = str.split(options.delimiter, options.parameterLimit === Infinity ? undefined : options.parameterLimit);

    for (var i = 0, il = parts.length; i < il; ++i) {
        var part = parts[i];
        var pos = part.indexOf(']=') === -1 ? part.indexOf('=') : part.indexOf(']=') + 1;

        if (pos === -1) {
            obj[Utils.decode(part)] = '';

            if (options.strictNullHandling) {
                obj[Utils.decode(part)] = null;
            }
        }
        else {
            var key = Utils.decode(part.slice(0, pos));
            var val = Utils.decode(part.slice(pos + 1));

            if (!Object.prototype.hasOwnProperty.call(obj, key)) {
                obj[key] = val;
            }
            else {
                obj[key] = [].concat(obj[key]).concat(val);
            }
        }
    }

    return obj;
};


internals.parseObject = function (chain, val, options) {

    if (!chain.length) {
        return val;
    }

    var root = chain.shift();

    var obj;
    if (root === '[]') {
        obj = [];
        obj = obj.concat(internals.parseObject(chain, val, options));
    }
    else {
        obj = options.plainObjects ? Object.create(null) : {};
        var cleanRoot = root[0] === '[' && root[root.length - 1] === ']' ? root.slice(1, root.length - 1) : root;
        var index = parseInt(cleanRoot, 10);
        var indexString = '' + index;
        if (!isNaN(index) &&
            root !== cleanRoot &&
            indexString === cleanRoot &&
            index >= 0 &&
            (options.parseArrays &&
             index <= options.arrayLimit)) {

            obj = [];
            obj[index] = internals.parseObject(chain, val, options);
        }
        else {
            obj[cleanRoot] = internals.parseObject(chain, val, options);
        }
    }

    return obj;
};


internals.parseKeys = function (key, val, options) {

    if (!key) {
        return;
    }

    // Transform dot notation to bracket notation

    if (options.allowDots) {
        key = key.replace(/\.([^\.\[]+)/g, '[$1]');
    }

    // The regex chunks

    var parent = /^([^\[\]]*)/;
    var child = /(\[[^\[\]]*\])/g;

    // Get the parent

    var segment = parent.exec(key);

    // Stash the parent if it exists

    var keys = [];
    if (segment[1]) {
        // If we aren't using plain objects, optionally prefix keys
        // that would overwrite object prototype properties
        if (!options.plainObjects &&
            Object.prototype.hasOwnProperty(segment[1])) {

            if (!options.allowPrototypes) {
                return;
            }
        }

        keys.push(segment[1]);
    }

    // Loop through children appending to the array until we hit depth

    var i = 0;
    while ((segment = child.exec(key)) !== null && i < options.depth) {

        ++i;
        if (!options.plainObjects &&
            Object.prototype.hasOwnProperty(segment[1].replace(/\[|\]/g, ''))) {

            if (!options.allowPrototypes) {
                continue;
            }
        }
        keys.push(segment[1]);
    }

    // If there's a remainder, just add whatever is left

    if (segment) {
        keys.push('[' + key.slice(segment.index) + ']');
    }

    return internals.parseObject(keys, val, options);
};


module.exports = function (str, options) {

    options = options || {};
    options.delimiter = typeof options.delimiter === 'string' || Utils.isRegExp(options.delimiter) ? options.delimiter : internals.delimiter;
    options.depth = typeof options.depth === 'number' ? options.depth : internals.depth;
    options.arrayLimit = typeof options.arrayLimit === 'number' ? options.arrayLimit : internals.arrayLimit;
    options.parseArrays = options.parseArrays !== false;
    options.allowDots = typeof options.allowDots === 'boolean' ? options.allowDots : internals.allowDots;
    options.plainObjects = typeof options.plainObjects === 'boolean' ? options.plainObjects : internals.plainObjects;
    options.allowPrototypes = typeof options.allowPrototypes === 'boolean' ? options.allowPrototypes : internals.allowPrototypes;
    options.parameterLimit = typeof options.parameterLimit === 'number' ? options.parameterLimit : internals.parameterLimit;
    options.strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;

    if (str === '' ||
        str === null ||
        typeof str === 'undefined') {

        return options.plainObjects ? Object.create(null) : {};
    }

    var tempObj = typeof str === 'string' ? internals.parseValues(str, options) : str;
    var obj = options.plainObjects ? Object.create(null) : {};

    // Iterate over the keys and setup the new object

    var keys = Object.keys(tempObj);
    for (var i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        var newObj = internals.parseKeys(key, tempObj[key], options);
        obj = Utils.merge(obj, newObj, options);
    }

    return Utils.compact(obj);
};

},{"./utils":108}],107:[function(require,module,exports){
// Load modules

var Utils = require('./utils');


// Declare internals

var internals = {
    delimiter: '&',
    arrayPrefixGenerators: {
        brackets: function (prefix, key) {

            return prefix + '[]';
        },
        indices: function (prefix, key) {

            return prefix + '[' + key + ']';
        },
        repeat: function (prefix, key) {

            return prefix;
        }
    },
    strictNullHandling: false
};


internals.stringify = function (obj, prefix, generateArrayPrefix, strictNullHandling, filter) {

    if (typeof filter === 'function') {
        obj = filter(prefix, obj);
    }
    else if (Utils.isBuffer(obj)) {
        obj = obj.toString();
    }
    else if (obj instanceof Date) {
        obj = obj.toISOString();
    }
    else if (obj === null) {
        if (strictNullHandling) {
            return Utils.encode(prefix);
        }

        obj = '';
    }

    if (typeof obj === 'string' ||
        typeof obj === 'number' ||
        typeof obj === 'boolean') {

        return [Utils.encode(prefix) + '=' + Utils.encode(obj)];
    }

    var values = [];

    if (typeof obj === 'undefined') {
        return values;
    }

    var objKeys = Array.isArray(filter) ? filter : Object.keys(obj);
    for (var i = 0, il = objKeys.length; i < il; ++i) {
        var key = objKeys[i];

        if (Array.isArray(obj)) {
            values = values.concat(internals.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix, strictNullHandling, filter));
        }
        else {
            values = values.concat(internals.stringify(obj[key], prefix + '[' + key + ']', generateArrayPrefix, strictNullHandling, filter));
        }
    }

    return values;
};


module.exports = function (obj, options) {

    options = options || {};
    var delimiter = typeof options.delimiter === 'undefined' ? internals.delimiter : options.delimiter;
    var strictNullHandling = typeof options.strictNullHandling === 'boolean' ? options.strictNullHandling : internals.strictNullHandling;
    var objKeys;
    var filter;
    if (typeof options.filter === 'function') {
        filter = options.filter;
        obj = filter('', obj);
    }
    else if (Array.isArray(options.filter)) {
        objKeys = filter = options.filter;
    }

    var keys = [];

    if (typeof obj !== 'object' ||
        obj === null) {

        return '';
    }

    var arrayFormat;
    if (options.arrayFormat in internals.arrayPrefixGenerators) {
        arrayFormat = options.arrayFormat;
    }
    else if ('indices' in options) {
        arrayFormat = options.indices ? 'indices' : 'repeat';
    }
    else {
        arrayFormat = 'indices';
    }

    var generateArrayPrefix = internals.arrayPrefixGenerators[arrayFormat];

    if (!objKeys) {
        objKeys = Object.keys(obj);
    }
    for (var i = 0, il = objKeys.length; i < il; ++i) {
        var key = objKeys[i];
        keys = keys.concat(internals.stringify(obj[key], key, generateArrayPrefix, strictNullHandling, filter));
    }

    return keys.join(delimiter);
};

},{"./utils":108}],108:[function(require,module,exports){
// Load modules


// Declare internals

var internals = {};
internals.hexTable = new Array(256);
for (var h = 0; h < 256; ++h) {
    internals.hexTable[h] = '%' + ((h < 16 ? '0' : '') + h.toString(16)).toUpperCase();
}


exports.arrayToObject = function (source, options) {

    var obj = options.plainObjects ? Object.create(null) : {};
    for (var i = 0, il = source.length; i < il; ++i) {
        if (typeof source[i] !== 'undefined') {

            obj[i] = source[i];
        }
    }

    return obj;
};


exports.merge = function (target, source, options) {

    if (!source) {
        return target;
    }

    if (typeof source !== 'object') {
        if (Array.isArray(target)) {
            target.push(source);
        }
        else if (typeof target === 'object') {
            target[source] = true;
        }
        else {
            target = [target, source];
        }

        return target;
    }

    if (typeof target !== 'object') {
        target = [target].concat(source);
        return target;
    }

    if (Array.isArray(target) &&
        !Array.isArray(source)) {

        target = exports.arrayToObject(target, options);
    }

    var keys = Object.keys(source);
    for (var k = 0, kl = keys.length; k < kl; ++k) {
        var key = keys[k];
        var value = source[key];

        if (!Object.prototype.hasOwnProperty.call(target, key)) {
            target[key] = value;
        }
        else {
            target[key] = exports.merge(target[key], value, options);
        }
    }

    return target;
};


exports.decode = function (str) {

    try {
        return decodeURIComponent(str.replace(/\+/g, ' '));
    } catch (e) {
        return str;
    }
};

exports.encode = function (str) {

    // This code was originally written by Brian White (mscdex) for the io.js core querystring library.
    // It has been adapted here for stricter adherence to RFC 3986
    if (str.length === 0) {
        return str;
    }

    if (typeof str !== 'string') {
        str = '' + str;
    }

    var out = '';
    for (var i = 0, il = str.length; i < il; ++i) {
        var c = str.charCodeAt(i);

        if (c === 0x2D || // -
            c === 0x2E || // .
            c === 0x5F || // _
            c === 0x7E || // ~
            (c >= 0x30 && c <= 0x39) || // 0-9
            (c >= 0x41 && c <= 0x5A) || // a-z
            (c >= 0x61 && c <= 0x7A)) { // A-Z

            out += str[i];
            continue;
        }

        if (c < 0x80) {
            out += internals.hexTable[c];
            continue;
        }

        if (c < 0x800) {
            out += internals.hexTable[0xC0 | (c >> 6)] + internals.hexTable[0x80 | (c & 0x3F)];
            continue;
        }

        if (c < 0xD800 || c >= 0xE000) {
            out += internals.hexTable[0xE0 | (c >> 12)] + internals.hexTable[0x80 | ((c >> 6) & 0x3F)] + internals.hexTable[0x80 | (c & 0x3F)];
            continue;
        }

        ++i;
        c = 0x10000 + (((c & 0x3FF) << 10) | (str.charCodeAt(i) & 0x3FF));
        out += internals.hexTable[0xF0 | (c >> 18)] + internals.hexTable[0x80 | ((c >> 12) & 0x3F)] + internals.hexTable[0x80 | ((c >> 6) & 0x3F)] + internals.hexTable[0x80 | (c & 0x3F)];
    }

    return out;
};

exports.compact = function (obj, refs) {

    if (typeof obj !== 'object' ||
        obj === null) {

        return obj;
    }

    refs = refs || [];
    var lookup = refs.indexOf(obj);
    if (lookup !== -1) {
        return refs[lookup];
    }

    refs.push(obj);

    if (Array.isArray(obj)) {
        var compacted = [];

        for (var i = 0, il = obj.length; i < il; ++i) {
            if (typeof obj[i] !== 'undefined') {
                compacted.push(obj[i]);
            }
        }

        return compacted;
    }

    var keys = Object.keys(obj);
    for (i = 0, il = keys.length; i < il; ++i) {
        var key = keys[i];
        obj[key] = exports.compact(obj[key], refs);
    }

    return obj;
};


exports.isRegExp = function (obj) {

    return Object.prototype.toString.call(obj) === '[object RegExp]';
};


exports.isBuffer = function (obj) {

    if (obj === null ||
        typeof obj === 'undefined') {

        return false;
    }

    return !!(obj.constructor &&
              obj.constructor.isBuffer &&
              obj.constructor.isBuffer(obj));
};

},{}]},{},[1])

