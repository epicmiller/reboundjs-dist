// jshint ignore: start
/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/
;if("document" in self&&!("classList" in document.createElement("_"))){(function(j){"use strict";if(!("Element" in j)){return}var a="classList",f="prototype",m=j.Element[f],b=Object,k=String[f].trim||function(){return this.replace(/^\s+|\s+$/g,"")},c=Array[f].indexOf||function(q){var p=0,o=this.length;for(;p<o;p++){if(p in this&&this[p]===q){return p}}return -1},n=function(o,p){this.name=o;this.code=DOMException[o];this.message=p},g=function(p,o){if(o===""){throw new n("SYNTAX_ERR","An invalid or illegal string was specified")}if(/\s/.test(o)){throw new n("INVALID_CHARACTER_ERR","String contains an invalid character")}return c.call(p,o)},d=function(s){var r=k.call(s.getAttribute("class")||""),q=r?r.split(/\s+/):[],p=0,o=q.length;for(;p<o;p++){this.push(q[p])}this._updateClassName=function(){s.setAttribute("class",this.toString())}},e=d[f]=[],i=function(){return new d(this)};n[f]=Error[f];e.item=function(o){return this[o]||null};e.contains=function(o){o+="";return g(this,o)!==-1};e.add=function(){var s=arguments,r=0,p=s.length,q,o=false;do{q=s[r]+"";if(g(this,q)===-1){this.push(q);o=true}}while(++r<p);if(o){this._updateClassName()}};e.remove=function(){var t=arguments,s=0,p=t.length,r,o=false;do{r=t[s]+"";var q=g(this,r);if(q!==-1){this.splice(q,1);o=true}}while(++s<p);if(o){this._updateClassName()}};e.toggle=function(p,q){p+="";var o=this.contains(p),r=o?q!==true&&"remove":q!==false&&"add";if(r){this[r](p)}return !o};e.toString=function(){return this.join(" ")};if(b.defineProperty){var l={get:i,enumerable:true,configurable:true};try{b.defineProperty(m,a,l)}catch(h){if(h.number===-2146823252){l.enumerable=false;b.defineProperty(m,a,l)}}}else{if(b[f].__defineGetter__){m.__defineGetter__(a,i)}}}(self))};
// IE8+ support of matchesSelector
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
  };
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

  // optionally defined later on
  onSubtreeModified,
  callDOMAttrModified,
  getAttributesMirror,
  observer,

  // based on setting prototype capability
  // will check proto or the expando attribute
  // in order to setup the node once
  patchIfNotAlready,
  patch,
  notFromInnerHTMLHelper
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
    prevValue = e.prevValue,
    newValue = e.newValue
  ;
  if (notFromInnerHTMLHelper &&
      node.attributeChangedCallback &&
      e.attrName !== 'style') {
    node.attributeChangedCallback(
      e.attrName,
      attrChange === e[ADDITION] ? null : prevValue,
      attrChange === e[REMOVAL] ? null : newValue
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
      targets.splice(i, 1);
      verifyAndSetupAndAction(node, DETACHED);
    }
  }
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
            current, node,
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
                node.attributeChangedCallback(
                  current.attributeName,
                  current.oldValue,
                  node.getAttribute(current.attributeName)
                );
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
    throw new Error('A ' + type + ' type is already registered');
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
    i = types.push((extending ? PREFIX_IS : PREFIX_TAG) + upperType) - 1,
    upperType
  ;

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

/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.1.14 Copyright (c) 2010-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, setTimeout, opera */

var requirejs, require, define;
(function (global) {
    var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.1.14',
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        op = Object.prototype,
        ostring = op.toString,
        hasOwn = op.hasOwnProperty,
        ap = Array.prototype,
        apsp = ap.splice,
        isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
        //PS3 indicates loaded and complete, but need to wait for complete
        //specifically. Sequence is 'loading', 'loaded', execution,
        // then 'complete'. The UA check is unfortunate, but not sure how
        //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
                      /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_',
        //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false;

    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop];
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            eachProp(source, function (value, prop) {
                if (force || !hasProp(target, prop)) {
                    if (deepStringMixin && typeof value === 'object' && value &&
                        !isArray(value) && !isFunction(value) &&
                        !(value instanceof RegExp)) {

                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }

    function scripts() {
        return document.getElementsByTagName('script');
    }

    function defaultOnError(err) {
        throw err;
    }

    //Allow getting a global that is expressed in
    //dot notation, like 'a.b.c'.
    function getGlobal(value) {
        if (!value) {
            return value;
        }
        var g = global;
        each(value.split('.'), function (part) {
            g = g[part];
        });
        return g;
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    function makeError(id, msg, err, requireModules) {
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        e.requireType = id;
        e.requireModules = requireModules;
        if (err) {
            e.originalError = err;
        }
        return e;
    }

    if (typeof define !== 'undefined') {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    if (typeof requirejs !== 'undefined') {
        if (isFunction(requirejs)) {
            //Do not overwrite an existing requirejs instance.
            return;
        }
        cfg = requirejs;
        requirejs = undefined;
    }

    //Allow for a require config object
    if (typeof require !== 'undefined' && !isFunction(require)) {
        //assume it is a config object.
        cfg = require;
        require = undefined;
    }

    function newContext(contextName) {
        var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            config = {
                //Defaults. Do not set a default for map
                //config to speed up normalize(), which
                //will run faster if there is no default.
                waitSeconds: 7,
                baseUrl: './',
                paths: {},
                bundles: {},
                pkgs: {},
                shim: {},
                config: {}
            },
            registry = {},
            //registry of just enabled modules, to speed
            //cycle breaking code when lots of modules
            //are registered, but not activated.
            enabledRegistry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            bundlesMap = {},
            requireCounter = 1,
            unnormalizedCounter = 1;

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        function trimDots(ary) {
            var i, part;
            for (i = 0; i < ary.length; i++) {
                part = ary[i];
                if (part === '.') {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i == 1 && ary[2] === '..') || ary[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
        function normalize(name, baseName, applyMap) {
            var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex,
                foundMap, foundI, foundStarMap, starI, normalizedBaseParts,
                baseParts = (baseName && baseName.split('/')),
                map = config.map,
                starMap = map && map['*'];

            //Adjust any relative paths.
            if (name) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // If wanting node ID compatibility, strip .js from end
                // of IDs. Have to do this here, and not in nameToUrl
                // because node allows either .js or non .js to map
                // to same file.
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                // Starts with a '.' so need the baseName
                if (name[0].charAt(0) === '.' && baseParts) {
                    //Convert baseName to array, and lop off the last part,
                    //so that . matches that 'directory' and not name of the baseName's
                    //module. For instance, baseName of 'one/two/three', maps to
                    //'one/two/three.js', but we want the directory, 'one/two' for
                    //this normalization.
                    normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    name = normalizedBaseParts.concat(name);
                }

                trimDots(name);
                name = name.join('/');
            }

            //Apply map config if available.
            if (applyMap && map && (baseParts || starMap)) {
                nameParts = name.split('/');

                outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join('/');

                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

                            //baseName segment has config, find if it has one for
                            //this name.
                            if (mapValue) {
                                mapValue = getOwn(mapValue, nameSegment);
                                if (mapValue) {
                                    //Match, update name to the new value.
                                    foundMap = mapValue;
                                    foundI = i;
                                    break outerLoop;
                                }
                            }
                        }
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                        foundStarMap = getOwn(starMap, nameSegment);
                        starI = i;
                    }
                }

                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }

                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                }
            }

            // If the name points to a package's name, use
            // the package main instead.
            pkgMain = getOwn(config.pkgs, name);

            return pkgMain ? pkgMain : name;
        }

        function removeScript(name) {
            if (isBrowser) {
                each(scripts(), function (scriptNode) {
                    if (scriptNode.getAttribute('data-requiremodule') === name &&
                            scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true;
                    }
                });
            }
        }

        function hasPathFallback(id) {
            var pathConfig = getOwn(config.paths, id);
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                //Pop off the first array value, since it failed, and
                //retry
                pathConfig.shift();
                context.require.undef(id);

                //Custom require that does not do map translation, since
                //ID is "absolute", already mapped/resolved.
                context.makeRequire(null, {
                    skipMap: true
                })([id]);

                return true;
            }
        }

        //Turns a plugin!resource to [plugin, resource]
        //with the plugin being undefined if the name
        //did not have a plugin prefix.
        function splitPrefix(name) {
            var prefix,
                index = name ? name.indexOf('!') : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [prefix, name];
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix, nameParts,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            nameParts = splitPrefix(name);
            prefix = nameParts[0];
            name = nameParts[1];

            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix);
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function (name) {
                            return normalize(name, parentName, applyMap);
                        });
                    } else {
                        // If nested plugin references, then do not try to
                        // normalize, as it will not normalize correctly. This
                        // places a restriction on resourceIds, and the longer
                        // term solution is not to normalize until plugins are
                        // loaded and all normalizations to allow for async
                        // loading of a loader plugin. But for now, fixes the
                        // common uses. Details in #1131
                        normalizedName = name.indexOf('!') === -1 ?
                                         normalize(name, parentName, applyMap) :
                                         name;
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName, applyMap);

                    //Normalized name may be a plugin ID due to map config
                    //application in normalize. The map config values must
                    //already be normalized, so do not need to redo that part.
                    nameParts = splitPrefix(normalizedName);
                    prefix = nameParts[0];
                    normalizedName = nameParts[1];
                    isNormalized = true;

                    url = context.nameToUrl(normalizedName);
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                     '_unnormalized' + (unnormalizedCounter += 1) :
                     '';

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ?
                        prefix + '!' + normalizedName :
                        normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (hasProp(defined, id) &&
                    (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                mod = getModule(depMap);
                if (mod.error && name === 'error') {
                    fn(mod.error);
                } else {
                    mod.on(name, fn);
                }
            }
        }

        function onError(err, errback) {
            var ids = err.requireModules,
                notified = false;

            if (errback) {
                errback(err);
            } else {
                each(ids, function (id) {
                    var mod = getOwn(registry, id);
                    if (mod) {
                        //Set error on module, so it skips timeout checks.
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit('error', err);
                        }
                    }
                });

                if (!notified) {
                    req.onError(err);
                }
            }
        }

        /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
        function takeGlobalQueue() {
            //Push all the globalDefQueue items into the context's defQueue
            if (globalDefQueue.length) {
                //Array splice in the values since the context code has a
                //local var ref to defQueue, so cannot just reassign the one
                //on context.
                apsp.apply(defQueue,
                           [defQueue.length, 0].concat(globalDefQueue));
                globalDefQueue = [];
            }
        }

        handlers = {
            'require': function (mod) {
                if (mod.require) {
                    return mod.require;
                } else {
                    return (mod.require = context.makeRequire(mod.map));
                }
            },
            'exports': function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    if (mod.exports) {
                        return (defined[mod.map.id] = mod.exports);
                    } else {
                        return (mod.exports = defined[mod.map.id] = {});
                    }
                }
            },
            'module': function (mod) {
                if (mod.module) {
                    return mod.module;
                } else {
                    return (mod.module = {
                        id: mod.map.id,
                        uri: mod.map.url,
                        config: function () {
                            return  getOwn(config.config, mod.map.id) || {};
                        },
                        exports: mod.exports || (mod.exports = {})
                    });
                }
            }
        };

        function cleanRegistry(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];
            delete enabledRegistry[id];
        }

        function breakCycle(mod, traced, processed) {
            var id = mod.map.id;

            if (mod.error) {
                mod.emit('error', mod.error);
            } else {
                traced[id] = true;
                each(mod.depMaps, function (depMap, i) {
                    var depId = depMap.id,
                        dep = getOwn(registry, depId);

                    //Only force things that have not completed
                    //being defined, so still in the registry,
                    //and only if it has not been matched up
                    //in the module already.
                    if (dep && !mod.depMatched[i] && !processed[depId]) {
                        if (getOwn(traced, depId)) {
                            mod.defineDep(i, defined[depId]);
                            mod.check(); //pass false?
                        } else {
                            breakCycle(dep, traced, processed);
                        }
                    }
                });
                processed[id] = true;
            }
        }

        function checkLoaded() {
            var err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;

            //Do not bother if this call was a result of a cycle break.
            if (inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(enabledRegistry, function (mod) {
                var map = mod.map,
                    modId = map.id;

                //Skip things that are not enabled or in error state.
                if (!mod.enabled) {
                    return;
                }

                if (!map.isDefine) {
                    reqCalls.push(mod);
                }

                if (!mod.error) {
                    //If the module should be executed, and it has not
                    //been inited and time is up, remember it.
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true;
                        } else {
                            noLoads.push(modId);
                            removeScript(modId);
                        }
                    } else if (!mod.inited && mod.fetched && map.isDefine) {
                        stillLoading = true;
                        if (!map.prefix) {
                            //No reason to keep looking for unfinished
                            //loading. If the only stillLoading is a
                            //plugin resource though, keep going,
                            //because it may be that a plugin resource
                            //is waiting on a non-plugin cycle.
                            return (needCycleCheck = false);
                        }
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {
                each(reqCalls, function (mod) {
                    breakCycle(mod, {}, {});
                });
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if ((!expired || usingPathFallback) && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function () {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        Module = function (map) {
            this.events = getOwn(undefEvents, map.id) || {};
            this.map = map;
            this.shim = getOwn(config.shim, map.id);
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0;

            /* this.exports this.factory
               this.depMaps = [],
               this.enabled, this.fetched
            */
        };

        Module.prototype = {
            init: function (depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = bind(this, function (err) {
                        this.emit('error', err);
                    });
                }

                //Do a copy of the dependency array, so that
                //source inputs are not modified. For example
                //"shim" deps are passed in here directly, and
                //doing a direct modification of the depMaps array
                //would affect that config.
                this.depMaps = depMaps && depMaps.slice(0);

                this.errback = errback;

                //Indicate this module has be initialized
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDep: function (i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch: function () {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (this.shim) {
                    context.makeRequire(this.map, {
                        enableBuildCallback: true
                    })(this.shim.deps || [], bind(this, function () {
                        return map.prefix ? this.callPlugin() : this.load();
                    }));
                } else {
                    //Regular dependency.
                    return map.prefix ? this.callPlugin() : this.load();
                }
            },

            load: function () {
                var url = this.map.url;

                //Regular dependency.
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },

            /**
             * Checks if the module is ready to define itself, and if so,
             * define it.
             */
            check: function () {
                if (!this.enabled || this.enabling) {
                    return;
                }

                var err, cjsModule,
                    id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory;

                if (!this.inited) {
                    this.fetch();
                } else if (this.error) {
                    this.emit('error', this.error);
                } else if (!this.defining) {
                    //The factory could trigger another require call
                    //that would result in checking this module to
                    //define itself again. If already in the process
                    //of doing that, skip this work.
                    this.defining = true;

                    if (this.depCount < 1 && !this.defined) {
                        if (isFunction(factory)) {
                            //If there is an error listener, favor passing
                            //to that instead of throwing an error. However,
                            //only do it for define()'d  modules. require
                            //errbacks should not be called for failures in
                            //their callbacks (#699). However if a global
                            //onError is set, use that.
                            if ((this.events.error && this.map.isDefine) ||
                                req.onError !== defaultOnError) {
                                try {
                                    exports = context.execCb(id, factory, depExports, exports);
                                } catch (e) {
                                    err = e;
                                }
                            } else {
                                exports = context.execCb(id, factory, depExports, exports);
                            }

                            // Favor return value over exports. If node/cjs in play,
                            // then will not have a return value anyway. Favor
                            // module.exports assignment over exports object.
                            if (this.map.isDefine && exports === undefined) {
                                cjsModule = this.module;
                                if (cjsModule) {
                                    exports = cjsModule.exports;
                                } else if (this.usingExports) {
                                    //exports already set the defined value.
                                    exports = this.exports;
                                }
                            }

                            if (err) {
                                err.requireMap = this.map;
                                err.requireModules = this.map.isDefine ? [this.map.id] : null;
                                err.requireType = this.map.isDefine ? 'define' : 'require';
                                return onError((this.error = err));
                            }

                        } else {
                            //Just a literal value
                            exports = factory;
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;

                            if (req.onResourceLoad) {
                                req.onResourceLoad(context, this.map, this.depMaps);
                            }
                        }

                        //Clean up
                        cleanRegistry(id);

                        this.defined = true;
                    }

                    //Finished the define stage. Allow calling check again
                    //to allow define notifications below in the case of a
                    //cycle.
                    this.defining = false;

                    if (this.defined && !this.defineEmitted) {
                        this.defineEmitted = true;
                        this.emit('defined', this.exports);
                        this.defineEmitComplete = true;
                    }

                }
            },

            callPlugin: function () {
                var map = this.map,
                    id = map.id,
                    //Map already normalized the prefix.
                    pluginMap = makeModuleMap(map.prefix);

                //Mark this as a dependency for this plugin, so it
                //can be traced for cycles.
                this.depMaps.push(pluginMap);

                on(pluginMap, 'defined', bind(this, function (plugin) {
                    var load, normalizedMap, normalizedMod,
                        bundleId = getOwn(bundlesMap, this.map.id),
                        name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null,
                        localRequire = context.makeRequire(map.parentMap, {
                            enableBuildCallback: true
                        });

                    //If current map is not normalized, wait for that
                    //normalized name to load instead of continuing.
                    if (this.map.unnormalized) {
                        //Normalize the ID if the plugin allows it.
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function (name) {
                                return normalize(name, parentName, true);
                            }) || '';
                        }

                        //prefix and name should already be normalized, no need
                        //for applying map config again either.
                        normalizedMap = makeModuleMap(map.prefix + '!' + name,
                                                      this.map.parentMap);
                        on(normalizedMap,
                            'defined', bind(this, function (value) {
                                this.init([], function () { return value; }, null, {
                                    enabled: true,
                                    ignore: true
                                });
                            }));

                        normalizedMod = getOwn(registry, normalizedMap.id);
                        if (normalizedMod) {
                            //Mark this as a dependency for this plugin, so it
                            //can be traced for cycles.
                            this.depMaps.push(normalizedMap);

                            if (this.events.error) {
                                normalizedMod.on('error', bind(this, function (err) {
                                    this.emit('error', err);
                                }));
                            }
                            normalizedMod.enable();
                        }

                        return;
                    }

                    //If a paths config, then just load that file instead to
                    //resolve the plugin, as it is built into that paths layer.
                    if (bundleId) {
                        this.map.url = context.nameToUrl(bundleId);
                        this.load();
                        return;
                    }

                    load = bind(this, function (value) {
                        this.init([], function () { return value; }, null, {
                            enabled: true
                        });
                    });

                    load.error = bind(this, function (err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];

                        //Remove temp unnormalized modules for this module,
                        //since they will never be resolved otherwise now.
                        eachProp(registry, function (mod) {
                            if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                cleanRegistry(mod.map.id);
                            }
                        });

                        onError(err);
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to 'complete' the load.
                    load.fromText = bind(this, function (text, textAlt) {
                        /*jslint evil: true */
                        var moduleName = map.name,
                            moduleMap = makeModuleMap(moduleName),
                            hasInteractive = useInteractive;

                        //As of 2.1.0, support just passing the text, to reinforce
                        //fromText only being called once per resource. Still
                        //support old style of passing moduleName but discard
                        //that moduleName in favor of the internal ref.
                        if (textAlt) {
                            text = textAlt;
                        }

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        //Prime the system by creating a module instance for
                        //it.
                        getModule(moduleMap);

                        //Transfer any config to this other module.
                        if (hasProp(config.config, id)) {
                            config.config[moduleName] = config.config[id];
                        }

                        try {
                            req.exec(text);
                        } catch (e) {
                            return onError(makeError('fromtexteval',
                                             'fromText eval for ' + id +
                                            ' failed: ' + e,
                                             e,
                                             [id]));
                        }

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Mark this as a dependency for the plugin
                        //resource
                        this.depMaps.push(moduleMap);

                        //Support anonymous modules.
                        context.completeLoad(moduleName);

                        //Bind the value of that module to the value for this
                        //resource ID.
                        localRequire([moduleName], load);
                    });

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, localRequire, load, config);
                }));

                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable: function () {
                enabledRegistry[this.map.id] = this;
                this.enabled = true;

                //Set flag mentioning that the module is enabling,
                //so that immediate calls to the defined callbacks
                //for dependencies do not trigger inadvertent load
                //with the depCount still being zero.
                this.enabling = true;

                //Enable each dependency
                each(this.depMaps, bind(this, function (depMap, i) {
                    var id, mod, handler;

                    if (typeof depMap === 'string') {
                        //Dependency needs to be converted to a depMap
                        //and wired up to this module.
                        depMap = makeModuleMap(depMap,
                                               (this.map.isDefine ? this.map : this.map.parentMap),
                                               false,
                                               !this.skipMap);
                        this.depMaps[i] = depMap;

                        handler = getOwn(handlers, depMap.id);

                        if (handler) {
                            this.depExports[i] = handler(this);
                            return;
                        }

                        this.depCount += 1;

                        on(depMap, 'defined', bind(this, function (depExports) {
                            this.defineDep(i, depExports);
                            this.check();
                        }));

                        if (this.errback) {
                            on(depMap, 'error', bind(this, this.errback));
                        }
                    }

                    id = depMap.id;
                    mod = registry[id];

                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!hasProp(handlers, id) && mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }));

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, bind(this, function (pluginMap) {
                    var mod = getOwn(registry, pluginMap.id);
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this);
                    }
                }));

                this.enabling = false;

                this.check();
            },

            on: function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
                if (name === 'error') {
                    //Now that the error handler was triggered, remove
                    //the listeners, since this broken Module instance
                    //can stay around for a while in the registry.
                    delete this.events[name];
                }
            }
        };

        function callGetModule(args) {
            //Skip modules already defined.
            if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
            }
        }

        function removeListener(node, func, name, ieName) {
            //Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                node.removeEventListener(name, func, false);
            }
        }

        /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
        function getScriptData(evt) {
            //Using currentTarget instead of target for Firefox 2.0's sake. Not
            //all old browsers will be supported, but this one was easy enough
            //to support and still makes sense.
            var node = evt.currentTarget || evt.srcElement;

            //Remove the listeners once here.
            removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
            removeListener(node, context.onScriptError, 'error');

            return {
                node: node,
                id: node && node.getAttribute('data-requiremodule')
            };
        }

        function intakeDefines() {
            var args;

            //Any defined modules in the global queue, intake them now.
            takeGlobalQueue();

            //Make sure any remaining defQueue items get properly processed.
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                    return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' + args[args.length - 1]));
                } else {
                    //args are id, deps, factory. Should be normalized by the
                    //define() function.
                    callGetModule(args);
                }
            }
        }

        context = {
            config: config,
            contextName: contextName,
            registry: registry,
            defined: defined,
            urlFetched: urlFetched,
            defQueue: defQueue,
            Module: Module,
            makeModuleMap: makeModuleMap,
            nextTick: req.nextTick,
            onError: onError,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure: function (cfg) {
                //Make sure the baseUrl ends in a slash.
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                        cfg.baseUrl += '/';
                    }
                }

                //Save off the paths since they require special processing,
                //they are additive.
                var shim = config.shim,
                    objs = {
                        paths: true,
                        bundles: true,
                        config: true,
                        map: true
                    };

                eachProp(cfg, function (value, prop) {
                    if (objs[prop]) {
                        if (!config[prop]) {
                            config[prop] = {};
                        }
                        mixin(config[prop], value, true, true);
                    } else {
                        config[prop] = value;
                    }
                });

                //Reverse map the bundles
                if (cfg.bundles) {
                    eachProp(cfg.bundles, function (value, prop) {
                        each(value, function (v) {
                            if (v !== prop) {
                                bundlesMap[v] = prop;
                            }
                        });
                    });
                }

                //Merge shim
                if (cfg.shim) {
                    eachProp(cfg.shim, function (value, id) {
                        //Normalize the structure
                        if (isArray(value)) {
                            value = {
                                deps: value
                            };
                        }
                        if ((value.exports || value.init) && !value.exportsFn) {
                            value.exportsFn = context.makeShimExports(value);
                        }
                        shim[id] = value;
                    });
                    config.shim = shim;
                }

                //Adjust packages if necessary.
                if (cfg.packages) {
                    each(cfg.packages, function (pkgObj) {
                        var location, name;

                        pkgObj = typeof pkgObj === 'string' ? { name: pkgObj } : pkgObj;

                        name = pkgObj.name;
                        location = pkgObj.location;
                        if (location) {
                            config.paths[name] = pkgObj.location;
                        }

                        //Save pointer to main module ID for pkg name.
                        //Remove leading dot in main, so main paths are normalized,
                        //and remove any trailing .js, since different package
                        //envs have different conventions: some use a module name,
                        //some use a file name.
                        config.pkgs[name] = pkgObj.name + '/' + (pkgObj.main || 'main')
                                     .replace(currDirRegExp, '')
                                     .replace(jsSuffixRegExp, '');
                    });
                }

                //If there are any "waiting to execute" modules in the registry,
                //update the maps for them, since their info, like URLs to load,
                //may have changed.
                eachProp(registry, function (mod, id) {
                    //If module already has init called, since it is too
                    //late to modify them, and ignore unnormalized ones
                    //since they are transient.
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id);
                    }
                });

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            makeShimExports: function (value) {
                function fn() {
                    var ret;
                    if (value.init) {
                        ret = value.init.apply(global, arguments);
                    }
                    return ret || (value.exports && getGlobal(value.exports));
                }
                return fn;
            },

            makeRequire: function (relMap, options) {
                options = options || {};

                function localRequire(deps, callback, errback) {
                    var id, map, requireMod;

                    if (options.enableBuildCallback && callback && isFunction(callback)) {
                        callback.__requireJsBuild = true;
                    }

                    if (typeof deps === 'string') {
                        if (isFunction(callback)) {
                            //Invalid call
                            return onError(makeError('requireargs', 'Invalid require call'), errback);
                        }

                        //If require|exports|module are requested, get the
                        //value for them from the special handlers. Caveat:
                        //this only works while module is being defined.
                        if (relMap && hasProp(handlers, deps)) {
                            return handlers[deps](registry[relMap.id]);
                        }

                        //Synchronous access to one module. If require.get is
                        //available (as in the Node adapter), prefer that.
                        if (req.get) {
                            return req.get(context, deps, relMap, localRequire);
                        }

                        //Normalize module name, if it contains . or ..
                        map = makeModuleMap(deps, relMap, false, true);
                        id = map.id;

                        if (!hasProp(defined, id)) {
                            return onError(makeError('notloaded', 'Module name "' +
                                        id +
                                        '" has not been loaded yet for context: ' +
                                        contextName +
                                        (relMap ? '' : '. Use require([])')));
                        }
                        return defined[id];
                    }

                    //Grab defines waiting in the global queue.
                    intakeDefines();

                    //Mark all the dependencies as needing to be loaded.
                    context.nextTick(function () {
                        //Some defines could have been added since the
                        //require call, collect them.
                        intakeDefines();

                        requireMod = getModule(makeModuleMap(null, relMap));

                        //Store if map config should be applied to this require
                        //call for dependencies.
                        requireMod.skipMap = options.skipMap;

                        requireMod.init(deps, callback, errback, {
                            enabled: true
                        });

                        checkLoaded();
                    });

                    return localRequire;
                }

                mixin(localRequire, {
                    isBrowser: isBrowser,

                    /**
                     * Converts a module name + .extension into an URL path.
                     * *Requires* the use of a module name. It does not support using
                     * plain URLs like nameToUrl.
                     */
                    toUrl: function (moduleNamePlusExt) {
                        var ext,
                            index = moduleNamePlusExt.lastIndexOf('.'),
                            segment = moduleNamePlusExt.split('/')[0],
                            isRelative = segment === '.' || segment === '..';

                        //Have a file extension alias, and it is not the
                        //dots from a relative path.
                        if (index !== -1 && (!isRelative || index > 1)) {
                            ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                            moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                        }

                        return context.nameToUrl(normalize(moduleNamePlusExt,
                                                relMap && relMap.id, true), ext,  true);
                    },

                    defined: function (id) {
                        return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                    },

                    specified: function (id) {
                        id = makeModuleMap(id, relMap, false, true).id;
                        return hasProp(defined, id) || hasProp(registry, id);
                    }
                });

                //Only allow undef on top level require calls
                if (!relMap) {
                    localRequire.undef = function (id) {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        removeScript(id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        //Clean queued defines too. Go backwards
                        //in array so that the splices do not
                        //mess up the iteration.
                        eachReverse(defQueue, function(args, i) {
                            if(args[0] === id) {
                                defQueue.splice(i, 1);
                            }
                        });

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                    };
                }

                return localRequire;
            },

            /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. A second arg, parent, the parent module,
             * is passed in for context, when this method is overridden by
             * the optimizer. Not shown here to keep code compact.
             */
            enable: function (depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable();
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            completeLoad: function (moduleName) {
                var found, args, mod,
                    shim = getOwn(config.shim, moduleName) || {},
                    shExports = shim.exports;

                takeGlobalQueue();

                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }

                //Do this after the cycle of callGetModule in case the result
                //of those calls/init calls changes the registry.
                mod = getOwn(registry, moduleName);

                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return;
                        } else {
                            return onError(makeError('nodefine',
                                             'No define call for ' + moduleName,
                                             null,
                                             [moduleName]));
                        }
                    } else {
                        //A script that does not call define(), so just simulate
                        //the call for it.
                        callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
                    }
                }

                checkLoaded();
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
            nameToUrl: function (moduleName, ext, skipExt) {
                var paths, syms, i, parentModule, url,
                    parentPath, bundleId,
                    pkgMain = getOwn(config.pkgs, moduleName);

                if (pkgMain) {
                    moduleName = pkgMain;
                }

                bundleId = getOwn(bundlesMap, moduleName);

                if (bundleId) {
                    return context.nameToUrl(bundleId, ext, skipExt);
                }

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || '');
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;

                    syms = moduleName.split('/');
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join('/');

                        parentPath = getOwn(paths, parentModule);
                        if (parentPath) {
                            //If an array, it means there are a few choices,
                            //Choose the one that is desired
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0];
                            }
                            syms.splice(0, i, parentPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join('/');
                    url += (ext || (/^data\:|\?/.test(url) || skipExt ? '' : '.js'));
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }

                return config.urlArgs ? url +
                                        ((url.indexOf('?') === -1 ? '?' : '&') +
                                         config.urlArgs) : url;
            },

            //Delegates to req.load. Broken out as a separate function to
            //allow overriding in the optimizer.
            load: function (id, url) {
                req.load(context, id, url);
            },

            /**
             * Executes a module callback function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
            execCb: function (name, callback, args, exports) {
                return callback.apply(exports, args);
            },

            /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
            onScriptLoad: function (evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                if (evt.type === 'load' ||
                        (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    //Reset interactive script so a script node is not held onto for
                    //to long.
                    interactiveScript = null;

                    //Pull out the name of the module and the context.
                    var data = getScriptData(evt);
                    context.completeLoad(data.id);
                }
            },

            /**
             * Callback for script errors.
             */
            onScriptError: function (evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    return onError(makeError('scripterror', 'Script error for: ' + data.id, evt, [data.id]));
                }
            }
        };

        context.require = context.makeRequire();
        return context;
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    req = requirejs = function (deps, callback, errback, optional) {

        //Find the right context, use default
        var context, config,
            contextName = defContextName;

        // Determine if have config object in the call.
        if (!isArray(deps) && typeof deps !== 'string') {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = errback;
                errback = optional;
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = getOwn(contexts, contextName);
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
        }

        if (config) {
            context.configure(config);
        }

        return context.require(deps, callback, errback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    req.config = function (config) {
        return req(config);
    };

    /**
     * Execute something after the current tick
     * of the event loop. Override for other envs
     * that have a better solution than setTimeout.
     * @param  {Function} fn function to execute later.
     */
    req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
        setTimeout(fn, 4);
    } : function (fn) { fn(); };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };

    //Create default context.
    req({});

    //Exports some context-sensitive methods on global require.
    each([
        'toUrl',
        'undef',
        'defined',
        'specified'
    ], function (prop) {
        //Reference from contexts instead of early binding to default context,
        //so that during builds, the latest instance of the default context
        //with its config gets used.
        req[prop] = function () {
            var ctx = contexts[defContextName];
            return ctx.require[prop].apply(ctx, arguments);
        };
    });

    if (isBrowser) {
        head = s.head = document.getElementsByTagName('head')[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName('base')[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    req.onError = defaultOnError;

    /**
     * Creates the node for the load command. Only used in browser envs.
     */
    req.createNode = function (config, moduleName, url) {
        var node = config.xhtml ?
                document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
                document.createElement('script');
        node.type = config.scriptType || 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        return node;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    req.load = function (context, moduleName, url) {
        var config = (context && context.config) || {},
            node;
        if (isBrowser) {
            //In the browser so use a script tag
            node = req.createNode(config, moduleName, url);

            node.setAttribute('data-requirecontext', context.contextName);
            node.setAttribute('data-requiremodule', moduleName);

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            if (node.attachEvent &&
                    //Check if node.attachEvent is artificially added by custom script or
                    //natively supported by browser
                    //read https://github.com/jrburke/requirejs/issues/187
                    //if we can NOT find [native code] then it must NOT natively supported.
                    //in IE8, node.attachEvent does not have toString()
                    //Note the test for "[native code" with no closing brace, see:
                    //https://github.com/jrburke/requirejs/issues/273
                    !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                    !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in 'interactive'
                //readyState at the time of the define call.
                useInteractive = true;

                node.attachEvent('onreadystatechange', context.onScriptLoad);
                //It would be great to add an error handler here to catch
                //404s in IE9+. However, onreadystatechange will fire before
                //the error handler, so that does not help. If addEventListener
                //is used, then IE will fire error before load, but we cannot
                //use that pathway given the connect.microsoft.com issue
                //mentioned above about not doing the 'script execute,
                //then fire the script load event listener before execute
                //next script' that other browsers do.
                //Best hope: IE10 fixes the issues,
                //and then destroys all installs of IE 6-9.
                //node.attachEvent('onerror', context.onScriptError);
            } else {
                node.addEventListener('load', context.onScriptLoad, false);
                node.addEventListener('error', context.onScriptError, false);
            }
            node.src = url;

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous define
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            currentlyAddingScript = node;
            if (baseElement) {
                head.insertBefore(node, baseElement);
            } else {
                head.appendChild(node);
            }
            currentlyAddingScript = null;

            return node;
        } else if (isWebWorker) {
            try {
                //In a web worker, use importScripts. This is not a very
                //efficient use of importScripts, importScripts will block until
                //its script is downloaded and evaluated. However, if web workers
                //are in play, the expectation that a build has been done so that
                //only one script needs to be loaded anyway. This may need to be
                //reevaluated if other use cases become common.
                importScripts(url);

                //Account for anonymous modules
                context.completeLoad(moduleName);
            } catch (e) {
                context.onError(makeError('importscripts',
                                'importScripts failed for ' +
                                    moduleName + ' at ' + url,
                                e,
                                [moduleName]));
            }
        }
    };

    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        eachReverse(scripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    if (isBrowser && !cfg.skipDataMain) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        eachReverse(scripts(), function (script) {
            //Set the 'head' where we can append children by
            //using the script's parent.
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                //Preserve dataMain in case it is a path (i.e. contains '?')
                mainScript = dataMain;

                //Set final baseUrl if there is not already an explicit one.
                if (!cfg.baseUrl) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    src = mainScript.split('/');
                    mainScript = src.pop();
                    subPath = src.length ? src.join('/')  + '/' : './';

                    cfg.baseUrl = subPath;
                }

                //Strip off any trailing .js since mainScript is now
                //like a module name.
                mainScript = mainScript.replace(jsSuffixRegExp, '');

                 //If mainScript is still a path, fall back to dataMain
                if (req.jsExtRegExp.test(mainScript)) {
                    mainScript = dataMain;
                }

                //Put the data-main script in the files to load.
                cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];

                return true;
            }
        });
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (name, deps, callback) {
        var node, context;

        //Allow for anonymous modules
        if (typeof name !== 'string') {
            //Adjust args appropriately
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!isArray(deps)) {
            callback = deps;
            deps = null;
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!deps && isFunction(callback)) {
            deps = [];
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            if (callback.length) {
                callback
                    .toString()
                    .replace(commentRegExp, '')
                    .replace(cjsRequireRegExp, function (match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        (context ? context.defQueue : globalDefQueue).push([name, deps, callback]);
    };

    define.amd = {
        jQuery: true
    };


    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    req.exec = function (text) {
        /*jslint evil: true */
        return eval(text);
    };

    //Set up with config info.
    req(cfg);
}(this));

(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//     Rebound.js 0.0.92

//     (c) 2015 Adam Miller
//     Rebound may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://reboundjs.com

// Rebound Compiletime
// ----------------

// If Backbone isn't preset on the page yet, or if `window.Rebound` is already
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _runtime = require('runtime');

var _runtime2 = _interopRequireDefault(_runtime);

// Load our **compiler**

var _reboundCompilerCompile = require("rebound-compiler/compile");

var _reboundCompilerCompile2 = _interopRequireDefault(_reboundCompilerCompile);

_runtime2["default"].compiler = _reboundCompilerCompile2["default"];

exports["default"] = _runtime2["default"];
module.exports = exports["default"];
},{"rebound-compiler/compile":4,"runtime":17}],2:[function(require,module,exports){
// Property Compiler
// ----------------

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _propertyCompilerTokenizer = require("property-compiler/tokenizer");

var _propertyCompilerTokenizer2 = _interopRequireDefault(_propertyCompilerTokenizer);

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
  nextToken = _propertyCompilerTokenizer2['default'].tokenize(str),
      token,
      finishedPaths = [],
      listening = 0,
      paths = [],
      path,
      attrs = [],
      workingpath = [];
  do {

    token = nextToken();

    if (token.value === 'this') {
      listening++;
      workingpath = [];
    }

    // TODO: handle gets on collections
    if (token.value === 'get') {
      path = nextToken();
      while (_.isUndefined(path.value)) {
        path = nextToken();
      }

      // Replace any access to a collection with the generic @each placeholder and push dependancy
      workingpath.push(path.value.replace(/\[.+\]/g, ".@each").replace(/^\./, ''));
    }

    if (token.value === 'pluck') {
      path = nextToken();
      while (_.isUndefined(path.value)) {
        path = nextToken();
      }

      workingpath.push('@each.' + path.value);
    }

    if (token.value === 'slice' || token.value === 'clone' || token.value === 'filter') {
      path = nextToken();
      if (path.type.type === '(') workingpath.push('@each');
    }

    if (token.value === 'at') {
      path = nextToken();
      while (_.isUndefined(path.value)) {
        path = nextToken();
      }
      workingpath.push('@each');
    }

    if (token.value === 'where' || token.value === 'findWhere') {
      workingpath.push('@each');
      path = nextToken();
      attrs = [];
      var itr = 0;
      while (path.type.type !== ')') {
        if (path.value) {
          if (itr % 2 === 0) {
            attrs.push(path.value);
          }
          itr++;
        }
        path = nextToken();
      }
      workingpath.push(attrs);
    }

    if (listening && (_.indexOf(TERMINATORS, token.type.type) > -1 || _.indexOf(TERMINATORS, token.value) > -1)) {
      workingpath = _.reduce(workingpath, reduceMemos, ['']);
      finishedPaths = _.compact(_.union(finishedPaths, workingpath));
      workingpath = [];
      listening--;
    }
  } while (token.start !== token.end);

  // console.log('COMPUTED PROPERTY', name, 'registered with these dependancy paths:', finishedPaths);

  // Save our finished paths directly on the function
  prop.__params = finishedPaths;

  // Return the dependancies list
  return finishedPaths;
}

exports['default'] = { compile: compile };
module.exports = exports['default'];
},{"property-compiler/tokenizer":3}],3:[function(require,module,exports){
/*jshint -W054 */
// jshint ignore: start

// A second optional argument can be given to further configure
// the parser process. These options are recognized:

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _exports = {};

var options, input, inputLen, sourceFile;

var defaultOptions = _exports.defaultOptions = {
  // `ecmaVersion` indicates the ECMAScript version to parse. Must
  // be either 3, or 5, or 6. This influences support for strict
  // mode, the set of reserved words, support for getters and
  // setters and other features. ES6 support is only partial.
  ecmaVersion: 5,
  // Turn on `strictSemicolons` to prevent the parser from doing
  // automatic semicolon insertion.
  strictSemicolons: false,
  // When `allowTrailingCommas` is false, the parser will not allow
  // trailing commas in array and object literals.
  allowTrailingCommas: true,
  // By default, reserved words are not enforced. Enable
  // `forbidReserved` to enforce them. When this option has the
  // value "everywhere", reserved words and keywords can also not be
  // used as property names.
  forbidReserved: false,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When `locations` is on, `loc` properties holding objects with
  // `start` and `end` properties in `{line, column}` form (with
  // line being 1-based and column 0-based) will be attached to the
  // nodes.
  locations: false,
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
  directSourceFile: null
};

function setOptions(opts) {
  options = opts || {};
  for (var opt in defaultOptions) if (!Object.prototype.hasOwnProperty.call(options, opt)) options[opt] = defaultOptions[opt];
  sourceFile = options.sourceFile || null;

  isKeyword = options.ecmaVersion >= 6 ? isEcma6Keyword : isEcma5AndLessKeyword;
}

// The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `input` should be the code string that the offset refers
// into.

var getLineInfo = _exports.getLineInfo = function (input, offset) {
  for (var line = 1, cur = 0;;) {
    lineBreak.lastIndex = cur;
    var match = lineBreak.exec(input);
    if (match && match.index < offset) {
      ++line;
      cur = match.index + match[0].length;
    } else break;
  }
  return { line: line, column: offset - cur };
};

// Acorn is organized as a tokenizer and a recursive-descent parser.
// The `tokenize` export provides an interface to the tokenizer.
// Because the tokenizer is optimized for being efficiently used by
// the Acorn parser itself, this interface is somewhat crude and not
// very modular. Performing another parse or call to `tokenize` will
// reset the internal state, and invalidate existing tokenizers.

_exports.tokenize = function (inpt, opts) {
  input = String(inpt);inputLen = input.length;
  setOptions(opts);
  initTokenState();

  var t = {};
  function getToken(forceRegexp) {
    lastEnd = tokEnd;
    readToken(forceRegexp);
    t.start = tokStart;t.end = tokEnd;
    t.startLoc = tokStartLoc;t.endLoc = tokEndLoc;
    t.type = tokType;t.value = tokVal;
    return t;
  }
  getToken.jumpTo = function (pos, reAllowed) {
    tokPos = pos;
    if (options.locations) {
      tokCurLine = 1;
      tokLineStart = lineBreak.lastIndex = 0;
      var match;
      while ((match = lineBreak.exec(input)) && match.index < pos) {
        ++tokCurLine;
        tokLineStart = match.index + match[0].length;
      }
    }
    tokRegexpAllowed = reAllowed;
    skipSpace();
  };
  return getToken;
};

// State is kept in (closure-)global variables. We already saw the
// `options`, `input`, and `inputLen` variables above.

// The current position of the tokenizer in the input.

var tokPos;

// The start and end offsets of the current token.

var tokStart, tokEnd;

// When `options.locations` is true, these hold objects
// containing the tokens start and end line/column pairs.

var tokStartLoc, tokEndLoc;

// The type and value of the current token. Token types are objects,
// named by variables against which they can be compared, and
// holding properties that describe them (indicating, for example,
// the precedence of an infix operator, and the original name of a
// keyword token). The kind of value that's held in `tokVal` depends
// on the type of the token. For literals, it is the literal value,
// for operators, the operator name, and so on.

var tokType, tokVal;

// Interal state for the tokenizer. To distinguish between division
// operators and regular expressions, it remembers whether the last
// token was one that is allowed to be followed by an expression.
// (If it is, a slash is probably a regexp, if it isn't it's a
// division operator. See the `parseStatement` function for a
// caveat.)

var tokRegexpAllowed;

// When `options.locations` is true, these are used to keep
// track of the current line, and know when a new line has been
// entered.

var tokCurLine, tokLineStart;

// These store the position of the previous token, which is useful
// when finishing a node and assigning its `end` position.

var lastStart, lastEnd, lastEndLoc;

// This is the parser's state. `inFunction` is used to reject
// `return` statements outside of functions, `labels` to verify that
// `break` and `continue` have somewhere to jump to, and `strict`
// indicates whether strict mode is on.

var inFunction, labels, strict;

// This function is used to raise exceptions on parse errors. It
// takes an offset integer (into the current `input`) to indicate
// the location of the error, attaches the position to the end
// of the error message, and then raises a `SyntaxError` with that
// message.

function raise(pos, message) {
  var loc = getLineInfo(input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  var err = new SyntaxError(message);
  err.pos = pos;err.loc = loc;err.raisedAt = tokPos;
  throw err;
}

// Reused empty array added for node fields that are always empty.

var empty = [];

// ## Token types

// The assignment of fine-grained, information-carrying type objects
// allows the tokenizer to store the information it has about a
// token in a way that is very cheap for the parser to look up.

// All token type variables start with an underscore, to make them
// easy to recognize.

// These are the general types. The `type` property is only used to
// make them recognizeable when debugging.

var _num = { type: "num" },
    _regexp = { type: "regexp" },
    _string = { type: "string" };
var _name = { type: "name" },
    _eof = { type: "eof" };

// Keyword tokens. The `keyword` property (also used in keyword-like
// operators) indicates that the token originated from an
// identifier-like word, which is used when parsing property names.
//
// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// `isLoop` marks a keyword as starting a loop, which is important
// to know when parsing a label, in order to allow or disallow
// continue jumps to that label.

var _break = { keyword: "break" },
    _case = { keyword: "case", beforeExpr: true },
    _catch = { keyword: "catch" };
var _continue = { keyword: "continue" },
    _debugger = { keyword: "debugger" },
    _default = { keyword: "default" };
var _do = { keyword: "do", isLoop: true },
    _else = { keyword: "else", beforeExpr: true };
var _finally = { keyword: "finally" },
    _for = { keyword: "for", isLoop: true },
    _function = { keyword: "function" };
var _if = { keyword: "if" },
    _return = { keyword: "return", beforeExpr: true },
    _switch = { keyword: "switch" };
var _throw = { keyword: "throw", beforeExpr: true },
    _try = { keyword: "try" },
    _var = { keyword: "var" };
var _let = { keyword: "let" },
    _const = { keyword: "const" };
var _while = { keyword: "while", isLoop: true },
    _with = { keyword: "with" },
    _new = { keyword: "new", beforeExpr: true };
var _this = { keyword: "this" };

// The keywords that denote values.

var _null = { keyword: "null", atomValue: null },
    _true = { keyword: "true", atomValue: true };
var _false = { keyword: "false", atomValue: false };

// Some keywords are treated as regular operators. `in` sometimes
// (when parsing `for`) needs to be tested against specifically, so
// we assign a variable name to it for quick comparing.

var _in = { keyword: "in", binop: 7, beforeExpr: true };

// Map keyword names to token types.

var keywordTypes = { "break": _break, "case": _case, "catch": _catch,
  "continue": _continue, "debugger": _debugger, "default": _default,
  "do": _do, "else": _else, "finally": _finally, "for": _for,
  "function": _function, "if": _if, "return": _return, "switch": _switch,
  "throw": _throw, "try": _try, "var": _var, "let": _let, "const": _const,
  "while": _while, "with": _with,
  "null": _null, "true": _true, "false": _false, "new": _new, "in": _in,
  "instanceof": { keyword: "instanceof", binop: 7, beforeExpr: true }, "this": _this,
  "typeof": { keyword: "typeof", prefix: true, beforeExpr: true },
  "void": { keyword: "void", prefix: true, beforeExpr: true },
  "delete": { keyword: "delete", prefix: true, beforeExpr: true } };

// Punctuation token types. Again, the `type` property is purely for debugging.

var _bracketL = { type: "[", beforeExpr: true },
    _bracketR = { type: "]" },
    _braceL = { type: "{", beforeExpr: true };
var _braceR = { type: "}" },
    _parenL = { type: "(", beforeExpr: true },
    _parenR = { type: ")" };
var _comma = { type: ",", beforeExpr: true },
    _semi = { type: ";", beforeExpr: true };
var _colon = { type: ":", beforeExpr: true },
    _dot = { type: "." },
    _ellipsis = { type: "..." },
    _question = { type: "?", beforeExpr: true };

// Operators. These carry several kinds of properties to help the
// parser use them properly (the presence of these properties is
// what categorizes them as operators).
//
// `binop`, when present, specifies that this operator is a binary
// operator, and will refer to its precedence.
//
// `prefix` and `postfix` mark the operator as a prefix or postfix
// unary operator. `isUpdate` specifies that the node produced by
// the operator should be of type UpdateExpression rather than
// simply UnaryExpression (`++` and `--`).
//
// `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
// binary operators with a very low precedence, that should result
// in AssignmentExpression nodes.

var _slash = { binop: 10, beforeExpr: true },
    _eq = { isAssign: true, beforeExpr: true };
var _assign = { isAssign: true, beforeExpr: true };
var _incDec = { postfix: true, prefix: true, isUpdate: true },
    _prefix = { prefix: true, beforeExpr: true };
var _logicalOR = { binop: 1, beforeExpr: true };
var _logicalAND = { binop: 2, beforeExpr: true };
var _bitwiseOR = { binop: 3, beforeExpr: true };
var _bitwiseXOR = { binop: 4, beforeExpr: true };
var _bitwiseAND = { binop: 5, beforeExpr: true };
var _equality = { binop: 6, beforeExpr: true };
var _relational = { binop: 7, beforeExpr: true };
var _bitShift = { binop: 8, beforeExpr: true };
var _plusMin = { binop: 9, prefix: true, beforeExpr: true };
var _multiplyModulo = { binop: 10, beforeExpr: true };

// Provide access to the token types for external users of the
// tokenizer.

_exports.tokTypes = { bracketL: _bracketL, bracketR: _bracketR, braceL: _braceL, braceR: _braceR,
  parenL: _parenL, parenR: _parenR, comma: _comma, semi: _semi, colon: _colon,
  dot: _dot, ellipsis: _ellipsis, question: _question, slash: _slash, eq: _eq,
  name: _name, eof: _eof, num: _num, regexp: _regexp, string: _string };
for (var kw in keywordTypes) _exports.tokTypes["_" + kw] = keywordTypes[kw];

// This is a trick taken from Esprima. It turns out that, on
// non-Chrome browsers, to check whether a string is in a set, a
// predicate containing a big ugly `switch` statement is faster than
// a regular expression, and on Chrome the two are about on par.
// This function uses `eval` (non-lexical) to produce such a
// predicate from a space-separated string of words.
//
// It starts by sorting the words by length.

function makePredicate(words) {
  words = words.split(" ");
  var f = "",
      cats = [];
  out: for (var i = 0; i < words.length; ++i) {
    for (var j = 0; j < cats.length; ++j) if (cats[j][0].length == words[i].length) {
      cats[j].push(words[i]);
      continue out;
    }
    cats.push([words[i]]);
  }
  function compareTo(arr) {
    if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
    f += "switch(str){";
    for (var i = 0; i < arr.length; ++i) f += "case " + JSON.stringify(arr[i]) + ":";
    f += "return true}return false;";
  }

  // When there are more than three length categories, an outer
  // switch first dispatches on the lengths, to save on comparisons.

  if (cats.length > 3) {
    cats.sort(function (a, b) {
      return b.length - a.length;
    });
    f += "switch(str.length){";
    for (var i = 0; i < cats.length; ++i) {
      var cat = cats[i];
      f += "case " + cat[0].length + ":";
      compareTo(cat);
    }
    f += "}";

    // Otherwise, simply generate a flat `switch` statement.
  } else {
      compareTo(words);
    }
  return new Function("str", f);
}

// The ECMAScript 3 reserved word list.

var isReservedWord3 = makePredicate("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile");

// ECMAScript 5 reserved words.

var isReservedWord5 = makePredicate("class enum extends super const export import");

// The additional reserved words in strict mode.

var isStrictReservedWord = makePredicate("implements interface let package private protected public static yield");

// The forbidden variable names in strict mode.

var isStrictBadIdWord = makePredicate("eval arguments");

// And the keywords.

var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

var isEcma5AndLessKeyword = makePredicate(ecma5AndLessKeywords);

var isEcma6Keyword = makePredicate(ecma5AndLessKeywords + " let const");

var isKeyword = isEcma5AndLessKeyword;

// ## Character categories

// Big ugly regular expressions that match characters in the
// whitespace, identifier, and identifier-start categories. These
// are only applied when a character is found to actually have a
// code point above 128.

var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
var nonASCIIidentifierStartChars = "ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԧԱ-Ֆՙա-ևא-תװ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠࢢ-ࢬऄ-हऽॐक़-ॡॱ-ॷॹ-ॿঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡೱೲഅ-ഌഎ-ഐഒ-ഺഽൎൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛰᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᳵᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々-〇〡-〩〱-〵〸-〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚗꚠ-ꛯꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ";
var nonASCIIidentifierChars = "̀-ͯ҃-֑҇-ׇֽֿׁׂׅׄؐ-ؚؠ-ىٲ-ۓۧ-ۨۻ-ۼܰ-݊ࠀ-ࠔࠛ-ࠣࠥ-ࠧࠩ-࠭ࡀ-ࡗࣤ-ࣾऀ-ःऺ-़ा-ॏ॑-ॗॢ-ॣ०-९ঁ-ঃ়া-ৄেৈৗয়-ৠਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑ੦-ੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢ-ૣ૦-૯ଁ-ଃ଼ା-ୄେୈୋ-୍ୖୗୟ-ୠ୦-୯ஂா-ூெ-ைொ-்ௗ௦-௯ఁ-ఃె-ైొ-్ౕౖౢ-ౣ౦-౯ಂಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢ-ೣ೦-೯ംഃെ-ൈൗൢ-ൣ൦-൯ංඃ්ා-ුූෘ-ෟෲෳิ-ฺเ-ๅ๐-๙ິ-ູ່-ໍ໐-໙༘༙༠-༩༹༵༷ཁ-ཇཱ-྄྆-྇ྍ-ྗྙ-ྼ࿆က-ဩ၀-၉ၧ-ၭၱ-ၴႂ-ႍႏ-ႝ፝-፟ᜎ-ᜐᜠ-ᜰᝀ-ᝐᝲᝳក-ឲ៝០-៩᠋-᠍᠐-᠙ᤠ-ᤫᤰ-᤻ᥑ-ᥭᦰ-ᧀᧈ-ᧉ᧐-᧙ᨀ-ᨕᨠ-ᩓ᩠-᩿᩼-᪉᪐-᪙ᭆ-ᭋ᭐-᭙᭫-᭳᮰-᮹᯦-᯳ᰀ-ᰢ᱀-᱉ᱛ-ᱽ᳐-᳒ᴀ-ᶾḁ-ἕ‌‍‿⁀⁔⃐-⃥⃜⃡-⃰ⶁ-ⶖⷠ-ⷿ〡-〨゙゚Ꙁ-ꙭꙴ-꙽ꚟ꛰-꛱ꟸ-ꠀ꠆ꠋꠣ-ꠧꢀ-ꢁꢴ-꣄꣐-꣙ꣳ-ꣷ꤀-꤉ꤦ-꤭ꤰ-ꥅꦀ-ꦃ꦳-꧀ꨀ-ꨧꩀ-ꩁꩌ-ꩍ꩐-꩙ꩻꫠ-ꫩꫲ-ꫳꯀ-ꯡ꯬꯭꯰-꯹ﬠ-ﬨ︀-️︠-︦︳︴﹍-﹏０-９＿";
var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

// Whether a single character denotes a newline.

var newline = /[\n\r\u2028\u2029]/;

// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.

var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;

// Test whether a given character code starts an identifier.

var isIdentifierStart = _exports.isIdentifierStart = function (code) {
  if (code < 65) return code === 36;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;
  return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
};

// Test whether a given character is part of an identifier.

var isIdentifierChar = _exports.isIdentifierChar = function (code) {
  if (code < 48) return code === 36;
  if (code < 58) return true;
  if (code < 65) return false;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;
  return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
};

// ## Tokenizer

// These are used when `options.locations` is on, for the
// `tokStartLoc` and `tokEndLoc` properties.

function Position() {
  this.line = tokCurLine;
  this.column = tokPos - tokLineStart;
}

// Reset the token state. Used at the start of a parse.

function initTokenState() {
  tokCurLine = 1;
  tokPos = tokLineStart = 0;
  tokRegexpAllowed = true;
  skipSpace();
}

// Called at the end of every token. Sets `tokEnd`, `tokVal`, and
// `tokRegexpAllowed`, and skips the space after the token, so that
// the next one's `tokStart` will point at the right position.

function finishToken(type, val) {
  tokEnd = tokPos;
  if (options.locations) tokEndLoc = new Position();
  tokType = type;
  skipSpace();
  tokVal = val;
  tokRegexpAllowed = type.beforeExpr;
}

function skipBlockComment() {
  var startLoc = options.onComment && options.locations && new Position();
  var start = tokPos,
      end = input.indexOf("*/", tokPos += 2);
  if (end === -1) raise(tokPos - 2, "Unterminated comment");
  tokPos = end + 2;
  if (options.locations) {
    lineBreak.lastIndex = start;
    var match;
    while ((match = lineBreak.exec(input)) && match.index < tokPos) {
      ++tokCurLine;
      tokLineStart = match.index + match[0].length;
    }
  }
  if (options.onComment) options.onComment(true, input.slice(start + 2, end), start, tokPos, startLoc, options.locations && new Position());
}

function skipLineComment() {
  var start = tokPos;
  var startLoc = options.onComment && options.locations && new Position();
  var ch = input.charCodeAt(tokPos += 2);
  while (tokPos < inputLen && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
    ++tokPos;
    ch = input.charCodeAt(tokPos);
  }
  if (options.onComment) options.onComment(false, input.slice(start + 2, tokPos), start, tokPos, startLoc, options.locations && new Position());
}

// Called at the start of the parse and after every token. Skips
// whitespace and comments, and.

function skipSpace() {
  while (tokPos < inputLen) {
    var ch = input.charCodeAt(tokPos);
    if (ch === 32) {
      // ' '
      ++tokPos;
    } else if (ch === 13) {
      ++tokPos;
      var next = input.charCodeAt(tokPos);
      if (next === 10) {
        ++tokPos;
      }
      if (options.locations) {
        ++tokCurLine;
        tokLineStart = tokPos;
      }
    } else if (ch === 10 || ch === 8232 || ch === 8233) {
      ++tokPos;
      if (options.locations) {
        ++tokCurLine;
        tokLineStart = tokPos;
      }
    } else if (ch > 8 && ch < 14) {
      ++tokPos;
    } else if (ch === 47) {
      // '/'
      var next = input.charCodeAt(tokPos + 1);
      if (next === 42) {
        // '*'
        skipBlockComment();
      } else if (next === 47) {
        // '/'
        skipLineComment();
      } else break;
    } else if (ch === 160) {
      // '\xa0'
      ++tokPos;
    } else if (ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
      ++tokPos;
    } else {
      break;
    }
  }
}

// ### Token reading

// This is the function that is called to fetch the next token. It
// is somewhat obscure, because it works in character codes rather
// than characters, and because operator parsing has been inlined
// into it.
//
// All in the name of speed.
//
// The `forceRegexp` parameter is used in the one case where the
// `tokRegexpAllowed` trick does not work. See `parseStatement`.

function readToken_dot() {
  var next = input.charCodeAt(tokPos + 1);
  if (next >= 48 && next <= 57) return readNumber(true);
  var next2 = input.charCodeAt(tokPos + 2);
  if (options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
    // 46 = dot '.'
    tokPos += 3;
    return finishToken(_ellipsis);
  } else {
    ++tokPos;
    return finishToken(_dot);
  }
}

function readToken_slash() {
  // '/'
  var next = input.charCodeAt(tokPos + 1);
  if (tokRegexpAllowed) {
    ++tokPos;return readRegexp();
  }
  if (next === 61) return finishOp(_assign, 2);
  return finishOp(_slash, 1);
}

function readToken_mult_modulo() {
  // '%*'
  var next = input.charCodeAt(tokPos + 1);
  if (next === 61) return finishOp(_assign, 2);
  return finishOp(_multiplyModulo, 1);
}

function readToken_pipe_amp(code) {
  // '|&'
  var next = input.charCodeAt(tokPos + 1);
  if (next === code) return finishOp(code === 124 ? _logicalOR : _logicalAND, 2);
  if (next === 61) return finishOp(_assign, 2);
  return finishOp(code === 124 ? _bitwiseOR : _bitwiseAND, 1);
}

function readToken_caret() {
  // '^'
  var next = input.charCodeAt(tokPos + 1);
  if (next === 61) return finishOp(_assign, 2);
  return finishOp(_bitwiseXOR, 1);
}

function readToken_plus_min(code) {
  // '+-'
  var next = input.charCodeAt(tokPos + 1);
  if (next === code) {
    if (next == 45 && input.charCodeAt(tokPos + 2) == 62 && newline.test(input.slice(lastEnd, tokPos))) {
      // A `-->` line comment
      tokPos += 3;
      skipLineComment();
      skipSpace();
      return readToken();
    }
    return finishOp(_incDec, 2);
  }
  if (next === 61) return finishOp(_assign, 2);
  return finishOp(_plusMin, 1);
}

function readToken_lt_gt(code) {
  // '<>'
  var next = input.charCodeAt(tokPos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && input.charCodeAt(tokPos + 2) === 62 ? 3 : 2;
    if (input.charCodeAt(tokPos + size) === 61) return finishOp(_assign, size + 1);
    return finishOp(_bitShift, size);
  }
  if (next == 33 && code == 60 && input.charCodeAt(tokPos + 2) == 45 && input.charCodeAt(tokPos + 3) == 45) {
    // `<!--`, an XML-style comment that should be interpreted as a line comment
    tokPos += 4;
    skipLineComment();
    skipSpace();
    return readToken();
  }
  if (next === 61) size = input.charCodeAt(tokPos + 2) === 61 ? 3 : 2;
  return finishOp(_relational, size);
}

function readToken_eq_excl(code) {
  // '=!'
  var next = input.charCodeAt(tokPos + 1);
  if (next === 61) return finishOp(_equality, input.charCodeAt(tokPos + 2) === 61 ? 3 : 2);
  return finishOp(code === 61 ? _eq : _prefix, 1);
}

function getTokenFromCode(code) {
  switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
    case 46:
      // '.'
      return readToken_dot();

    // Punctuation tokens.
    case 40:
      ++tokPos;return finishToken(_parenL);
    case 41:
      ++tokPos;return finishToken(_parenR);
    case 59:
      ++tokPos;return finishToken(_semi);
    case 44:
      ++tokPos;return finishToken(_comma);
    case 91:
      ++tokPos;return finishToken(_bracketL);
    case 93:
      ++tokPos;return finishToken(_bracketR);
    case 123:
      ++tokPos;return finishToken(_braceL);
    case 125:
      ++tokPos;return finishToken(_braceR);
    case 58:
      ++tokPos;return finishToken(_colon);
    case 63:
      ++tokPos;return finishToken(_question);

    // '0x' is a hexadecimal number.
    case 48:
      // '0'
      var next = input.charCodeAt(tokPos + 1);
      if (next === 120 || next === 88) return readHexNumber();
    // Anything else beginning with a digit is an integer, octal
    // number, or float.
    /* falls through */
    case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
      // 1-9
      return readNumber(false);

    // Quotes produce strings.
    case 34:case 39:
      // '"', "'"
      return readString(code);

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.

    case 47:
      // '/'
      return readToken_slash();

    case 37:case 42:
      // '%*'
      return readToken_mult_modulo();

    case 124:case 38:
      // '|&'
      return readToken_pipe_amp(code);

    case 94:
      // '^'
      return readToken_caret();

    case 43:case 45:
      // '+-'
      return readToken_plus_min(code);

    case 60:case 62:
      // '<>'
      return readToken_lt_gt(code);

    case 61:case 33:
      // '=!'
      return readToken_eq_excl(code);

    case 126:
      // '~'
      return finishOp(_prefix, 1);
  }

  return false;
}

function readToken(forceRegexp) {
  if (!forceRegexp) tokStart = tokPos;else tokPos = tokStart + 1;
  if (options.locations) tokStartLoc = new Position();
  if (forceRegexp) return readRegexp();
  if (tokPos >= inputLen) return finishToken(_eof);

  var code = input.charCodeAt(tokPos);
  // Identifier or keyword. '\uXXXX' sequences are allowed in
  // identifiers, so '\' also dispatches to that.
  if (isIdentifierStart(code) || code === 92 /* '\' */) return readWord();

  var tok = getTokenFromCode(code);

  if (tok === false) {
    // If we are here, we either found a non-ASCII identifier
    // character, or something that's entirely disallowed.
    var ch = String.fromCharCode(code);
    if (ch === "\\" || nonASCIIidentifierStart.test(ch)) return readWord();
    raise(tokPos, "Unexpected character '" + ch + "'");
  }
  return tok;
}

function finishOp(type, size) {
  var str = input.slice(tokPos, tokPos + size);
  tokPos += size;
  finishToken(type, str);
}

// Parse a regular expression. Some context-awareness is necessary,
// since a '/' inside a '[]' set does not end the expression.

function readRegexp() {
  var content = "",
      escaped,
      inClass,
      start = tokPos;
  for (;;) {
    if (tokPos >= inputLen) raise(start, "Unterminated regular expression");
    var ch = input.charAt(tokPos);
    if (newline.test(ch)) raise(start, "Unterminated regular expression");
    if (!escaped) {
      if (ch === "[") inClass = true;else if (ch === "]" && inClass) inClass = false;else if (ch === "/" && !inClass) break;
      escaped = ch === "\\";
    } else escaped = false;
    ++tokPos;
  }
  var content = input.slice(start, tokPos);
  ++tokPos;
  // Need to use `readWord1` because '\uXXXX' sequences are allowed
  // here (don't ask).
  var mods = readWord1();
  if (mods && !/^[gmsiy]*$/.test(mods)) raise(start, "Invalid regular expression flag");
  try {
    var value = new RegExp(content, mods);
  } catch (e) {
    if (e instanceof SyntaxError) raise(start, "Error parsing regular expression: " + e.message);
    raise(e);
  }
  return finishToken(_regexp, value);
}

// Read an integer in the given radix. Return null if zero digits
// were read, the integer value otherwise. When `len` is given, this
// will return `null` unless the integer has exactly `len` digits.

function readInt(radix, len) {
  var start = tokPos,
      total = 0;
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
    var code = input.charCodeAt(tokPos),
        val;
    if (code >= 97) val = code - 97 + 10; // a
    else if (code >= 65) val = code - 65 + 10; // A
      else if (code >= 48 && code <= 57) val = code - 48; // 0-9
        else val = Infinity;
    if (val >= radix) break;
    ++tokPos;
    total = total * radix + val;
  }
  if (tokPos === start || len != null && tokPos - start !== len) return null;

  return total;
}

function readHexNumber() {
  tokPos += 2; // 0x
  var val = readInt(16);
  if (val == null) raise(tokStart + 2, "Expected hexadecimal number");
  if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");
  return finishToken(_num, val);
}

// Read an integer, octal integer, or floating-point number.

function readNumber(startsWithDot) {
  var start = tokPos,
      isFloat = false,
      octal = input.charCodeAt(tokPos) === 48;
  if (!startsWithDot && readInt(10) === null) raise(start, "Invalid number");
  if (input.charCodeAt(tokPos) === 46) {
    ++tokPos;
    readInt(10);
    isFloat = true;
  }
  var next = input.charCodeAt(tokPos);
  if (next === 69 || next === 101) {
    // 'eE'
    next = input.charCodeAt(++tokPos);
    if (next === 43 || next === 45) ++tokPos; // '+-'
    if (readInt(10) === null) raise(start, "Invalid number");
    isFloat = true;
  }
  if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");

  var str = input.slice(start, tokPos),
      val;
  if (isFloat) val = parseFloat(str);else if (!octal || str.length === 1) val = parseInt(str, 10);else if (/[89]/.test(str) || strict) raise(start, "Invalid number");else val = parseInt(str, 8);
  return finishToken(_num, val);
}

// Read a string value, interpreting backslash-escapes.

function readString(quote) {
  tokPos++;
  var out = "";
  for (;;) {
    if (tokPos >= inputLen) raise(tokStart, "Unterminated string constant");
    var ch = input.charCodeAt(tokPos);
    if (ch === quote) {
      ++tokPos;
      return finishToken(_string, out);
    }
    if (ch === 92) {
      // '\'
      ch = input.charCodeAt(++tokPos);
      var octal = /^[0-7]+/.exec(input.slice(tokPos, tokPos + 3));
      if (octal) octal = octal[0];
      while (octal && parseInt(octal, 8) > 255) octal = octal.slice(0, -1);
      if (octal === "0") octal = null;
      ++tokPos;
      if (octal) {
        if (strict) raise(tokPos - 2, "Octal literal in strict mode");
        out += String.fromCharCode(parseInt(octal, 8));
        tokPos += octal.length - 1;
      } else {
        switch (ch) {
          case 110:
            out += "\n";break; // 'n' -> '\n'
          case 114:
            out += "\r";break; // 'r' -> '\r'
          case 120:
            out += String.fromCharCode(readHexChar(2));break; // 'x'
          case 117:
            out += String.fromCharCode(readHexChar(4));break; // 'u'
          case 85:
            out += String.fromCharCode(readHexChar(8));break; // 'U'
          case 116:
            out += "\t";break; // 't' -> '\t'
          case 98:
            out += "\b";break; // 'b' -> '\b'
          case 118:
            out += "\u000b";break; // 'v' -> '\u000b'
          case 102:
            out += "\f";break; // 'f' -> '\f'
          case 48:
            out += "\0";break; // 0 -> '\0'
          case 13:
            if (input.charCodeAt(tokPos) === 10) ++tokPos; // '\r\n'
          /* falls through */
          case 10:
            // ' \n'
            if (options.locations) {
              tokLineStart = tokPos;++tokCurLine;
            }
            break;
          default:
            out += String.fromCharCode(ch);break;
        }
      }
    } else {
      if (ch === 13 || ch === 10 || ch === 8232 || ch === 8233) raise(tokStart, "Unterminated string constant");
      out += String.fromCharCode(ch); // '\'
      ++tokPos;
    }
  }
}

// Used to read character escape sequences ('\x', '\u', '\U').

function readHexChar(len) {
  var n = readInt(16, len);
  if (n === null) raise(tokStart, "Bad character escape sequence");
  return n;
}

// Used to signal to callers of `readWord1` whether the word
// contained any escape sequences. This is needed because words with
// escape sequences must not be interpreted as keywords.

var containsEsc;

// Read an identifier, and return it as a string. Sets `containsEsc`
// to whether the word contained a '\u' escape.
//
// Only builds up the word character-by-character when it actually
// containeds an escape, as a micro-optimization.

function readWord1() {
  containsEsc = false;
  var word,
      first = true,
      start = tokPos;
  for (;;) {
    var ch = input.charCodeAt(tokPos);
    if (isIdentifierChar(ch)) {
      if (containsEsc) word += input.charAt(tokPos);
      ++tokPos;
    } else if (ch === 92) {
      // "\"
      if (!containsEsc) word = input.slice(start, tokPos);
      containsEsc = true;
      if (input.charCodeAt(++tokPos) != 117) // "u"
        raise(tokPos, "Expecting Unicode escape sequence \\uXXXX");
      ++tokPos;
      var esc = readHexChar(4);
      var escStr = String.fromCharCode(esc);
      if (!escStr) raise(tokPos - 1, "Invalid Unicode escape");
      if (!(first ? isIdentifierStart(esc) : isIdentifierChar(esc))) raise(tokPos - 4, "Invalid Unicode escape");
      word += escStr;
    } else {
      break;
    }
    first = false;
  }
  return containsEsc ? word : input.slice(start, tokPos);
}

// Read an identifier or keyword token. Will check for reserved
// words when necessary.

function readWord() {
  var word = readWord1();
  var type = _name;
  if (!containsEsc && isKeyword(word)) type = keywordTypes[word];
  return finishToken(type, word);
}

exports["default"] = { tokenize: _exports.tokenize };
module.exports = exports["default"];
},{}],4:[function(require,module,exports){
// Rebound Compiler
// ----------------

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _reboundCompilerParser = require("rebound-compiler/parser");

var _reboundCompilerParser2 = _interopRequireDefault(_reboundCompilerParser);

var _htmlbarsCompilerCompiler = require("htmlbars-compiler/compiler");

var _htmlbarsUtilObjectUtils = require("htmlbars-util/object-utils");

var _domHelper = require("dom-helper");

var _domHelper2 = _interopRequireDefault(_domHelper);

var _reboundComponentHelpers = require("rebound-component/helpers");

var _reboundComponentHelpers2 = _interopRequireDefault(_reboundComponentHelpers);

var _reboundComponentHooks = require("rebound-component/hooks");

var _reboundComponentHooks2 = _interopRequireDefault(_reboundComponentHooks);

var _reboundComponentComponent = require("rebound-component/component");

var _reboundComponentComponent2 = _interopRequireDefault(_reboundComponentComponent);

function compile(str) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  /* jshint evil: true */
  // Parse the template and compile our template function
  var defs = (0, _reboundCompilerParser2["default"])(str, options),
      template = new Function("return " + (0, _htmlbarsCompilerCompiler.compileSpec)(defs.template))();

  if (defs.isPartial) {
    if (options.name) _reboundComponentHelpers2["default"].registerPartial(options.name, template);
    return _reboundComponentHooks2["default"].wrap(template);
  } else {
    return _reboundComponentComponent2["default"].registerComponent(defs.name, {
      prototype: new Function("return " + defs.script)(),
      template: _reboundComponentHooks2["default"].wrap(template),
      style: defs.style
    });
  }
}

exports["default"] = { compile: compile };
module.exports = exports["default"];
},{"dom-helper":18,"htmlbars-compiler/compiler":22,"htmlbars-util/object-utils":56,"rebound-compiler/parser":5,"rebound-component/component":6,"rebound-component/helpers":7,"rebound-component/hooks":8}],5:[function(require,module,exports){
// Rebound Template Parser
// -----------------------

// Remove the contents of the component's `script` tag.
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
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
  return str.indexOf("<style>") > -1 && str.indexOf("</style>") > -1 ? str.replace(/([^]*<style>)([^]*)(<\/style>[^]*)/ig, "$2").replace(/"/g, "\\\"") : "";
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
  var base = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

  var imports = [],
      partials = [],
      deps = [],
      match,
      importsre = /<link [^h]*href=(['"]?)\/?([^.'"]*).html\1[^>]*>/gi,
      partialsre = /\{\{>\s*?['"]?([^'"}\s]*)['"]?\s*?\}\}/gi,
      start = template.indexOf("<template>"),
      end = template.lastIndexOf('</template>');
  if (start > -1 && end > -1) template = template.substring(start + 10, end);

  // Assemple our component dependancies by finding link tags and parsing their src
  while ((match = importsre.exec(template)) !== null) {
    imports.push(match[2]);
  }
  imports.forEach(function (importString, index) {
    deps.push('"' + base + importString + '"');
  });

  // Assemble our partial dependancies
  partials = template.match(partialsre);

  if (partials) {
    partials.forEach(function (partial, index) {
      deps.push('"' + base + partial.replace(/\{\{>[\s*]?['"]?([^'"]*)['"]?[\s*]?\}\}/gi, '$1') + '"');
    });
  }

  return deps;
}

function parse(str) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  // If the element tag is present
  if (str.indexOf('<element') > -1 && str.indexOf('</element>') > -1) {
    return {
      isPartial: false,
      name: getName(str),
      style: getStyle(str),
      template: getTemplate(str),
      script: getScript(str),
      deps: getDependancies(str, options.baseDest)
    };
  }

  return {
    isPartial: true,
    name: options.name,
    template: stripLinkTags(str),
    deps: getDependancies(str, options.baseDest)
  };
}

exports['default'] = parse;
module.exports = exports['default'];
},{}],6:[function(require,module,exports){
// Rebound Component
// ----------------

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _domHelper = require("dom-helper");

var _domHelper2 = _interopRequireDefault(_domHelper);

var _htmlbarsRuntimeRender = require("htmlbars-runtime/render");

var _htmlbarsRuntimeRender2 = _interopRequireDefault(_htmlbarsRuntimeRender);

var _reboundComponentHooks = require("rebound-component/hooks");

var _reboundComponentHooks2 = _interopRequireDefault(_reboundComponentHooks);

var _reboundComponentHelpers = require("rebound-component/helpers");

var _reboundComponentHelpers2 = _interopRequireDefault(_reboundComponentHelpers);

var _reboundComponentUtils = require("rebound-component/utils");

var _reboundComponentUtils2 = _interopRequireDefault(_reboundComponentUtils);

var _reboundDataReboundData = require("rebound-data/rebound-data");

// Returns true if `str` starts with `test`
function startsWith(str, test) {
  if (str === test) return true;
  str = _reboundComponentUtils2["default"].splitPath(str);
  test = _reboundComponentUtils2["default"].splitPath(test);
  while (test[0] && str[0]) {
    if (str[0] !== test[0] && str[0] !== '@each' && test[0] !== '@each') return false;
    test.shift();
    str.shift();
  }
  return true;
}

// New Backbone Component
var Component = _reboundDataReboundData.Model.extend({

  isComponent: true,

  _render: function _render() {
    var i = 0,
        len = this._toRender.length,
        key;
    delete this._renderTimeout;
    for (i = 0; i < len; i++) {
      this._toRender.shift().notify();
    }
    this._toRender.added = {};
    for (key in this.env.revalidateQueue) {
      this.env.revalidateQueue[key].revalidate();
    }
  },

  _callOnComponent: function _callOnComponent(name, event) {
    if (!_.isFunction(this[name])) {
      throw "ERROR: No method named " + name + " on component " + this.__name + "!";
    }
    return this[name].call(this, event);
  },

  _listenToService: function _listenToService(key, service) {
    var _this = this;

    var self = this;
    this.listenTo(service, 'all', function (type, model, value, options) {
      var attr,
          path = model.__path(),
          changed;
      if (type.indexOf('change:') === 0) {
        changed = model.changedAttributes();
        for (attr in changed) {
          // TODO: Modifying arguments array is bad. change this
          type = 'change:' + key + '.' + path + (path && '.') + attr; // jshint ignore:line
          options.service = key;
          _this.trigger.call(_this, type, model, value, options);
        }
        return;
      }
      return _this.trigger.call(_this, type, model, value, options);
    });
  },

  deinitialize: function deinitialize() {
    var _this2 = this;

    if (this.consumers.length) return;
    _.each(this.services, function (service, key) {
      _.each(service.consumers, function (consumer, index) {
        if (consumer.component === _this2) service.consumers.splice(index, 1);
      });
    });
    delete this.services;
    Rebound.Model.prototype.deinitialize.apply(this, arguments);
  },

  // LazyComponents have an onLoad function that calls all the registered callbacks
  // after it has been hydrated. If we are calling onLoad on an already loaded
  // component, just call the callback provided.
  onLoad: function onLoad(cb) {
    cb(this);
  },

  // Set is overridden on components to accept components as a valid input type.
  // Components set on other Components are mixed in as a shared object. {raw: true}
  // It also marks itself as a consumer of this component
  set: function set(key, val, options) {
    var attrs, attr, serviceOptions;
    if (typeof key === 'object') {
      attrs = key.isModel ? key.attributes : key;
      options = val;
    } else (attrs = {})[key] = val;
    options || (options = {});

    // If reset option passed, do a reset. If nothing passed, return.
    if (options.reset === true) return this.reset(attrs, options);
    if (options.defaults === true) this.defaults = attrs;
    if (_.isEmpty(attrs)) return;

    // For each attribute passed:
    for (key in attrs) {
      attr = attrs[key];
      if (attr && attr.isComponent) {
        if (attr.isLazyComponent && attr._component) attr = attr._component;
        serviceOptions || (serviceOptions = _.defaults(_.clone(options), { raw: true }));
        attr.consumers.push({ key: key, component: this });
        this.services[key] = attr;
        this._listenToService(key, attr);
        Rebound.Model.prototype.set.call(this, key, attr, serviceOptions);
      }
      Rebound.Model.prototype.set.call(this, key, attr, options);
    }

    return this;
  },

  constructor: function constructor(options) {
    var key,
        attr,
        self = this;
    options = options || (options = {});
    _.bindAll(this, '_callOnComponent', '_listenToService', '_render');
    this.cid = _.uniqueId('component');
    this.env = _reboundComponentHooks2["default"].createChildEnv(_reboundComponentHooks2["default"].createFreshEnv());
    // Call on component is used by the {{on}} helper to call all event callbacks in the scope of the component
    this.env.helpers._callOnComponent = this._callOnComponent;
    this.attributes = {};
    this.changed = {};
    this.consumers = [];
    this.services = {};
    this.__parent__ = this.__root__ = this;
    this.listenTo(this, 'all', this._onChange);

    // Take our parsed data and add it to our backbone data structure. Does a deep defaults set.
    // In the model, primatives (arrays, objects, etc) are converted to Backbone Objects
    // Functions are compiled to find their dependancies and added as computed properties
    // Set our component's context with the passed data merged with the component's defaults
    if (options.debug) window.debug = true;
    this.set(this.defaults || {});
    if (options.debug) window.debug = false;
    this.set(options.data || {});

    // Get any additional routes passed in from options
    this.routes = _.defaults(options.routes || {}, this.routes);
    // Ensure that all route functions exist
    _.each(this.routes, function (value, key, routes) {
      if (typeof value !== 'string') {
        throw 'Function name passed to routes in  ' + this.__name + ' component must be a string!';
      }
      if (!this[value]) {
        throw 'Callback function ' + value + ' does not exist on the  ' + this.__name + ' component!';
      }
    }, this);

    // Set our outlet and template if we have them
    this.el = options.outlet || document.createDocumentFragment();
    this.$el = _.isUndefined(window.Backbone.$) ? false : window.Backbone.$(this.el);
    this.template = options.template || this.template;
    this.el.data = this;

    // Render our dom and place the dom in our custom element
    // TODO: Check if template is a string, and if the compiler exists on the page, and compile if needed
    if (this.template) {
      this.template.reboundTemplate || (this.template = _reboundComponentHooks2["default"].wrap(this.template));
      this.template = this.template.render(this, this.env, { contextualElement: this.el }, {});
      this.el.appendChild(this.template.fragment);

      // Add active class to this newly rendered template's link elements that require it
      (0, _reboundComponentUtils2["default"])(this.el).markLinks();
    }

    // Our Component is fully created now, but not rendered. Call created callback.
    if (_.isFunction(this.createdCallback)) this.createdCallback.call(this);

    this.initialize();
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
      (0, _reboundComponentUtils2["default"])(this.el).trigger(eventName, arguments);
    }
    Backbone.Model.prototype.trigger.apply(this, arguments);
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
  },

  _onChange: function _onChange(type, model, collection, options) {
    var shortcircuit = { change: 1, sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1, dirty: 1 };
    if (shortcircuit[type]) return;

    var data, changed;
    model || (model = {});
    collection || (collection = {});
    options || (options = {});
    !collection.isData && type.indexOf('change:') === -1 && (options = collection) && (collection = model);
    this._toRender || (this._toRender = []);

    if (type === 'reset' && options.previousAttributes || type.indexOf('change:') !== -1) {
      data = model;
      changed = model.changedAttributes();
    } else if (type === 'add' || type === 'remove' || type === 'reset' && options.previousModels) {
      data = collection;
      changed = {
        '@each': data
      };
    }

    if (!data || !changed) return;

    var push = function push(arr) {
      var i,
          len = arr.length;
      this.added || (this.added = {});
      for (i = 0; i < len; i++) {
        if (this.added[arr[i].cid]) continue;
        this.added[arr[i].cid] = 1;
        this.push(arr[i]);
      }
    };
    var context = this;
    var basePath = data.__path();
    // If this event came from within a service, include the service key in the base path
    if (options.service) basePath = options.service + '.' + basePath;
    var parts = _reboundComponentUtils2["default"].splitPath(basePath);
    var key, obsPath, path, observers;

    // For each changed key, walk down the data tree from the root to the data
    // element that triggered the event and add all relevent callbacks to this
    // object's _toRender queue.
    do {
      for (key in changed) {
        path = (basePath + (basePath && key && '.') + key).replace(context.__path(), '').replace(/\[[^\]]+\]/g, ".@each").replace(/^\./, '');
        for (obsPath in context.__observers) {
          observers = context.__observers[obsPath];
          if (startsWith(obsPath, path)) {
            // If this is a collection event, trigger everything, otherwise only trigger property change callbacks
            if (_.isArray(changed[key]) || data.isCollection) push.call(this._toRender, observers.collection);
            push.call(this._toRender, observers.model);
          }
        }
      }
    } while (context !== data && (context = context.get(parts.shift(), { isPath: true })));

    // Queue our render callback to be called after the current call stack has been exhausted
    window.clearTimeout(this._renderTimeout);
    if (this.el && this.el.testing) return this._render();
    this._renderTimeout = window.setTimeout(this._render, 0);
  }

});

Component.extend = function (protoProps, staticProps) {
  var parent = this,
      child,
      reservedMethods = {
    'trigger': 1, 'constructor': 1, 'get': 1, 'set': 1, 'has': 1,
    'extend': 1, 'escape': 1, 'unset': 1, 'clear': 1, 'cid': 1,
    'attributes': 1, 'changed': 1, 'toJSON': 1, 'validationError': 1, 'isValid': 1,
    'isNew': 1, 'hasChanged': 1, 'changedAttributes': 1, 'previous': 1, 'previousAttributes': 1
  },
      configProperties = {
    'routes': 1, 'template': 1, 'defaults': 1, 'outlet': 1, 'url': 1,
    'urlRoot': 1, 'idAttribute': 1, 'id': 1, 'createdCallback': 1, 'attachedCallback': 1,
    'detachedCallback': 1
  };

  protoProps || (protoProps = {});
  staticProps || (staticProps = {});
  protoProps.defaults = {};
  // staticProps.services = {};

  // If given a constructor, use it, otherwise use the default one defined above
  if (protoProps && _.has(protoProps, 'constructor')) {
    child = protoProps.constructor;
  } else {
    child = function () {
      return parent.apply(this, arguments);
    };
  }

  // Our class should inherit everything from its parent, defined above
  var Surrogate = function Surrogate() {
    this.constructor = child;
  };
  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate();

  _reboundComponentUtils2["default"].extractComputedProps(protoProps);

  // For each property passed into our component base class
  for (var key in protoProps) {
    var get = undefined,
        set = undefined;

    // If a configuration property, or not actually on the obj, ignore it
    if (!protoProps.hasOwnProperty(key) || configProperties[key]) continue;

    var value = protoProps[key];

    // If a primative or backbone type object, or computed property (function which takes no arguments and returns a value) move it to our defaults
    if (!_.isFunction(value) || value.isComputedProto || value.isModel || value.isComponent) {
      protoProps.defaults[key] = value;
      delete protoProps[key];
    }

    // If a reserved method, yell
    if (reservedMethods[key]) {
      throw "ERROR: " + key + " is a reserved method name in " + staticProps.__name + "!";
    }

    // All other values are component methods, leave them be unless already defined.
  }

  // Extend our prototype with any remaining protoProps, overriting pre-defined ones
  if (protoProps) {
    _.extend(child.prototype, protoProps, staticProps);
  }

  // Set our ancestry
  child.__super__ = parent.prototype;

  return child;
};

Component.registerComponent = function registerComponent(name, options) {
  var script = options.prototype;
  var template = options.template;
  var style = options.style;
  name = name;

  var component = this.extend(script, { __name: name });
  var proto = Object.create(HTMLElement.prototype, {});

  proto.createdCallback = function () {
    new component({
      debug: options.debug,
      template: template,
      outlet: this,
      data: Rebound.seedData,
      content: Rebound.content
    });
  };

  proto.attachedCallback = function () {
    script.attachedCallback && script.attachedCallback.call(this.data);
  };

  proto.detachedCallback = function () {
    script.detachedCallback && script.detachedCallback.call(this.data);
  };

  proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
    this.data._onAttributeChange(attrName, oldVal, newVal);
    script.attributeChangedCallback && script.attributeChangedCallback.call(this.data, attrName, oldVal, newVal);
  };

  return document.registerElement(name, { prototype: proto });
};

_.bindAll(Component, 'registerComponent');

exports["default"] = Component;
module.exports = exports["default"];
},{"dom-helper":18,"htmlbars-runtime/render":33,"rebound-component/helpers":7,"rebound-component/hooks":8,"rebound-component/utils":10,"rebound-data/rebound-data":14}],7:[function(require,module,exports){
// Rebound Helpers
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

var helpers = {},
    partials = {};

helpers.registerPartial = function (name, func) {
  if (func && _.isString(name)) return partials[name] = func;
};

helpers.hasHelper = function (env, scope, name) {
  env && env.helpers || (env = { helpers: helpers });
  return !!(helpers[name] || env.helpers[name]);
};

// lookupHelper returns the given function from the helpers object. Manual checks prevent user from overriding reserved words.
helpers.lookupHelper = function (env, scope, name) {
  if (_.isString(env)) name = env;
  env && env.helpers || (env = { helpers: helpers });
  // If a reserved helper, return it
  if (name === 'attribute') return env.helpers.attribute;
  if (name === 'if') return env.helpers["if"];
  if (name === 'unless') return env.helpers.unless;
  if (name === 'each') return env.helpers.each;
  if (name === 'partial') return env.helpers.partial;
  if (name === 'on') return env.helpers.on;
  if (name === 'debugger') return env.helpers["debugger"];
  if (name === 'log') return env.helpers.log;

  // If not a reserved helper, check env, then global helpers, or return undefined.
  if (!helpers.hasHelper(env, null, name)) console.error('No helper named', name, 'registered with Rebound');
  return helpers[name] || env.helpers[name];
};

helpers.registerHelper = function (name, callback, env) {
  if (!_.isString(name)) return console.error('Name provided to registerHelper must be a string!');
  if (!_.isFunction(callback)) return console.error('Callback provided to regierHelper must be a function!');
  if (helpers.hasHelper(env, null, name)) return console.error('A helper called "' + name + '" is already registered!');

  helpers[name] = callback;
};

/*******************************
        Default helpers
********************************/

helpers["debugger"] = function (params, hash, options, env) {
  /* jshint -W087 */
  debugger;
  return '';
};

helpers.log = function (params, hash, options, env) {
  console.log.apply(console, params);
  return '';
};

helpers.on = function (params, hash, options, env) {
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
  (0, _reboundComponentUtils2["default"])(element).on(eventName, delegate, hash, function (event) {
    return env.helpers._callOnComponent(callback, event);
  });
};

helpers.length = function (params, hash, options, env) {
  return params[0] && params[0].length || 0;
};

function isTruthy(condition) {

  if (condition === true || condition === false) return condition;

  if (condition === undefined || condition === null) {
    condition = false;
  }

  condition.isModel && (condition = true);

  // If our condition is an array, handle properly
  if (_.isArray(condition) || condition.isCollection) {
    condition = condition.length ? true : false;
  }

  // Handle string values
  condition === 'true' && (condition = true);
  condition === 'false' && (condition = false);

  return condition;
}

helpers["if"] = function (params, hash, templates) {

  var condition = isTruthy(params[0]);

  // If yield does not exist, this is not a block helper.
  if (!this["yield"]) {
    return condition ? params[1] : params[2] || '';
  }

  // Render the apropreate block statement
  if (condition && this["yield"]) {
    this["yield"]();
  } else if (!condition && templates.inverse && templates.inverse["yield"]) {
    templates.inverse["yield"]();
  } else {
    return '';
  }
};

// Unless proxies to the if helper with an inverted conditional value.
helpers.unless = function (params, hash, templates) {
  params[0] = !isTruthy(params[0]);
  return helpers["if"].apply(templates.template || {}, [params, hash, templates]);
};

// Given an array, predicate and optional extra variable, finds the index in the array where predicate is true
function findIndex(arr, predicate, cid) {
  if (arr === null) {
    throw new TypeError('findIndex called on null or undefined');
  }
  if (typeof predicate !== 'function') {
    throw new TypeError('predicate must be a function');
  }
  var list = Object(arr);
  var length = list.length >>> 0;
  var thisArg = arguments[1];
  var value;

  for (var i = 0; i < length; i++) {
    value = list[i];
    if (predicate.call(thisArg, value, i, list, cid)) {
      return i;
    }
  }
  return -1;
}

function shouldRender(value) {
  return _.isArray(value) && value.length > 0 || _.isObject(value) && Object.keys(value).length > 0;
}

helpers.each = function (params, hash, templates) {

  if (_.isNull(params[0]) || _.isUndefined(params[0])) {
    console.warn("Undefined value passed to each helper.", params, hash);
    return null;
  }

  var key,
      eachId,
      value = params[0].isCollection ? params[0].models : params[0].isModel ? params[0].attributes : params[0]; // Accepts collections, arrays, or models

  if (shouldRender(value)) {
    for (key in value) {
      eachId = value[key] && value[key].isData ? value[key].cid : params[0].cid + key;
      if (value.hasOwnProperty(key)) this.yieldItem(eachId, [value[key], key]);
    }
  } else {
    if (templates.inverse && templates.inverse["yield"]) templates.inverse["yield"]();
  }

  return _.uniqueId("rand");
};

helpers.partial = function (params, hash, options, env) {
  var partial = partials[params[0]];
  if (partial && partial.isHTMLBars) {
    return partial.render(options.context, env);
  }
};

exports["default"] = helpers;
exports.partials = partials;
},{"rebound-component/lazy-value":9,"rebound-component/utils":10}],8:[function(require,module,exports){
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

var _htmlbarsUtilObjectUtils = require("htmlbars-util/object-utils");

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
    return context.get(path, { isPath: true });
  }, { context: context });

  // Save our path so parent lazyvalues can know the data var or helper they are getting info from
  lazyValue.path = path;

  // Save the observer at this path
  lazyValue.addObserver(path, context);

  return lazyValue;
}

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

_htmlbarsRuntimeHooks2["default"].invokeHelper = function invokeHelper(morph, env, scope, visitor, params, hash, helper, templates, context) {
  if (morph && scope.streams[morph.guid]) {
    scope.streams[morph.guid].value;
    return scope.streams[morph.guid];
  }
  if (!helper) return { value: '' };

  var lazyValue = streamHelper.apply(this, arguments);
  lazyValue.path = helper.name;
  lazyValue.value;
  // if(morph) scope.streams[morph.guid] = lazyValue;
  return lazyValue;
};

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
  scope.localPresent = (0, _htmlbarsUtilObjectUtils.createObject)(parent.localPresent);
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
      // jshint ignore:line
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
      // jshint ignore:line
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
    lazyValue = _htmlbarsRuntimeHooks2["default"].get(env, scope, helperName);
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
},{"dom-helper":18,"htmlbars-runtime/hooks":31,"htmlbars-runtime/render":33,"htmlbars-util/object-utils":56,"rebound-component/helpers":7,"rebound-component/lazy-value":9,"rebound-component/utils":10}],9:[function(require,module,exports){
// Rebound Lazy Value
// ----------------

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var NIL = function NIL() {},
    EMPTY_ARRAY = [];

function LazyValue(fn, options) {
  options || (options = {});
  this.cid = _.uniqueId('lazyValue');
  this.valueFn = fn;
  this.context = options.context || null;
}

LazyValue.prototype = Object.defineProperties({
  isLazyValue: true,
  children: null,
  observers: null,
  cache: NIL,
  valueFn: null,
  subscribers: null, // TODO: do we need multiple subscribers?
  _childValues: null,

  set: function set(key, value, options) {
    if (this.context) {
      return this.context.set(key, value, options);
    }
    return null;
  },

  addDependentValue: function addDependentValue(value) {
    var children = this.children;
    if (!children) {
      children = this.children = [value];
    } else {
      children.push(value);
    }

    if (value && value.isLazyValue) {
      value.onNotify(this);
    }

    return this;
  },

  addObserver: function addObserver(path, context) {
    var observers = this.observers || (this.observers = []),
        position,
        res;

    if (!_.isObject(context) || !_.isString(path)) return console.error('Error adding observer for', context, path);

    // Ensure _observers exists and is an object
    context.__observers = context.__observers || {};
    // Ensure __observers[path] exists and is an array
    context.__observers[path] = context.__observers[path] || { collection: [], model: [] };

    // Save the type of object events this observer is for
    res = context.get(this.path, { isPath: true });
    res = res && res.isCollection ? 'collection' : 'model';

    // Add our callback, save the position it is being inserted so we can garbage collect later.
    position = context.__observers[path][res].push(this) - 1;

    // Lazyvalue needs referance to its observers to remove listeners on destroy
    observers.push({ context: context, path: path, index: position });

    return this;
  },

  notify: function notify(sender) {
    var cache = this.cache,
        subscribers;

    if (cache !== NIL) {
      subscribers = this.subscribers;
      cache = this.cache = NIL;
      if (!subscribers) {
        return;
      }
      for (var i = 0, l = subscribers.length; i < l; i++) {
        subscribers[i].isLazyValue ? subscribers[i].notify() : subscribers[i](this);
      }
    }
  },

  onNotify: function onNotify(callback) {
    var subscribers = this.subscribers || (this.subscribers = []);
    subscribers.push(callback);
    return this;
  },

  destroy: function destroy() {
    _.each(this.children, function (child) {
      if (child && child.isLazyValue) {
        child.destroy();
      }
    });
    _.each(this.subscribers, function (subscriber) {
      if (subscriber && subscriber.isLazyValue) {
        subscriber.destroy();
      }
    });

    this.children = this.cache = this.valueFn = this.subscribers = this._childValues = null;

    _.each(this.observers, function (observer) {
      if (_.isObject(observer.context.__observers[observer.path])) {
        delete observer.context.__observers[observer.path][observer.index];
      }
    });

    this.observers = null;
  }
}, {
  value: { // just for reusing the array, might not work well if children.length changes after computation

    get: function get() {
      var cache = this.cache;
      if (cache !== NIL) {
        return cache;
      }

      var children = this.children;
      if (children) {
        var child,
            values = this._childValues || new Array(children.length);

        for (var i = 0, l = children.length; i < l; i++) {
          child = children[i];
          values[i] = child && child.isLazyValue ? child.value : child;
        }
        this.cache = this.valueFn(values);
      } else {
        this.cache = this.valueFn(EMPTY_ARRAY);
      }
      return this.cache;
    },
    configurable: true,
    enumerable: true
  }
});

exports['default'] = LazyValue;
module.exports = exports['default'];
},{}],10:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _qs = require("qs");

var _qs2 = _interopRequireDefault(_qs);

// Rebound Utils
// ----------------

var QS_STRINGIFY_OPTS = {
  allowDots: true,
  encode: false,
  delimiter: '&'
};

var QS_PARSE_OPTS = {
  allowDots: true,
  delimiter: /[;,&]/
};

var $ = function $(query) {
  return new utils(query);
};

$.qs = {
  stringify: function stringify(str) {
    return _qs2["default"].stringify(str, QS_STRINGIFY_OPTS);
  },
  parse: function parse(obj) {
    return _qs2["default"].parse(obj, QS_PARSE_OPTS);
  }
};

var utils = function utils(query) {
  var i, selector;
  if (_.isArray(query)) {
    selector = [];
    _.each(query, function (item, index) {
      if (_.isElement(item) || item === document || item === window) selector.push(item);else if (_.isString(item)) Array.prototype.push.apply(selector, document.querySelectorAll(item));
    });
  } else if (_.isElement(query) || query === document || query === window) selector = [query];else if (_.isString(query)) selector = document.querySelectorAll(query);else selector = [];

  this.length = selector.length;

  // Add selector to object for method chaining
  for (i = 0; i < this.length; i++) {
    this[i] = selector[i];
  }

  return this;
};

function returnFalse() {
  return false;
}
function returnTrue() {
  return true;
}

// Shim console for IE9
if (!(window.console && console.log)) {
  console = {
    log: function log() {},
    debug: function debug() {},
    info: function info() {},
    warn: function warn() {},
    error: function error() {}
  };
}

$.Event = function (src, props) {
  // Allow instantiation without the 'new' keyword
  if (!(this instanceof $.Event)) {
    return new $.Event(src, props);
  }

  // Event object
  if (src && src.type) {
    this.originalEvent = src;
    this.type = src.type;

    // Events bubbling up the document may have been marked as prevented
    // by a handler lower down the tree; reflect the correct value.
    this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === undefined &&
    // Support: Android<4.0
    src.returnValue === false ? returnTrue : returnFalse;

    // Event type
  } else {
      this.type = src;
    }

  // Put explicitly provided properties onto the event object
  if (props) {
    _.extend(this, props);
  }

  // Copy over all original event properties
  _.extend(this, _.pick(this.originalEvent, ["altKey", "bubbles", "cancelable", "ctrlKey", "currentTarget", "eventPhase", "metaKey", "relatedTarget", "shiftKey", "target", "timeStamp", "view", "which", "char", "charCode", "key", "keyCode", "button", "buttons", "clientX", "clientY", "", "offsetX", "offsetY", "pageX", "pageY", "screenX", "screenY", "toElement"]));

  // Create a timestamp if incoming event doesn't have one
  this.timeStamp = src && src.timeStamp || new Date().getTime();

  // Mark it as fixed
  this.isEvent = true;
};

$.Event.prototype = {
  constructor: $.Event,
  isDefaultPrevented: returnFalse,
  isPropagationStopped: returnFalse,
  isImmediatePropagationStopped: returnFalse,

  preventDefault: function preventDefault() {
    var e = this.originalEvent;

    this.isDefaultPrevented = returnTrue;

    if (e && e.preventDefault) {
      e.preventDefault();
    }
  },
  stopPropagation: function stopPropagation() {
    var e = this.originalEvent;

    this.isPropagationStopped = returnTrue;

    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
  },
  stopImmediatePropagation: function stopImmediatePropagation() {
    var e = this.originalEvent;

    this.isImmediatePropagationStopped = returnTrue;

    if (e && e.stopImmediatePropagation) {
      e.stopImmediatePropagation();
    }

    this.stopPropagation();
  }
};

utils.prototype = {

  // Given a valid data path, split it into an array of its parts.
  // ex: foo.bar[0].baz --> ['foo', 'var', '0', 'baz']
  splitPath: function splitPath(path) {
    path = ('.' + path + '.').split(/(?:\.|\[|\])+/);
    path.pop();
    path.shift();
    return path;
  },

  // Applies function `func` depth first to every node in the subtree starting from `root`
  // If the callback returns `false`, short circuit that tree.
  walkTheDOM: function walkTheDOM(func) {
    var el,
        root,
        len = this.length,
        result;
    while (len--) {
      root = this[len];
      result = func(root);
      if (result === false) return;
      root = root.firstChild;
      while (root) {
        $(root).walkTheDOM(func);
        root = root.nextSibling;
      }
    }
  },

  // Searches each key in an object and tests if the property has a lookupGetter or
  // lookupSetter. If either are preset convert the property into a computed property.
  extractComputedProps: function extractComputedProps(obj) {
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
  },

  // Events registry. An object containing all events bound through this util shared among all instances.
  _events: {},

  // Takes the targed the event fired on and returns all callbacks for the delegated element
  _hasDelegate: function _hasDelegate(target, delegate, eventType) {
    var callbacks = [];

    // Get our callbacks
    if (target.delegateGroup && this._events[target.delegateGroup][eventType]) {
      _.each(this._events[target.delegateGroup][eventType], function (callbacksList, delegateId) {
        if (_.isArray(callbacksList) && (delegateId === delegate.delegateId || delegate.matchesSelector && delegate.matchesSelector(delegateId))) {
          callbacks = callbacks.concat(callbacksList);
        }
      });
    }

    return callbacks;
  },

  // Triggers an event on a given dom node
  trigger: function trigger(eventName, options) {
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
  },

  off: function off(eventType, handler) {
    var el,
        len = this.length,
        eventCount;

    while (len--) {

      el = this[len];
      eventCount = 0;

      if (el.delegateGroup) {
        if (this._events[el.delegateGroup][eventType] && _.isArray(this._events[el.delegateGroup][eventType][el.delegateId])) {
          _.each(this._events[el.delegateGroup][eventType], function (delegate, index, delegateList) {
            _.each(delegateList, function (callback, index, callbackList) {
              if (callback === handler) {
                delete callbackList[index];
                return;
              }
              eventCount++;
            });
          });
        }
      }

      // If there are no more of this event type delegated for this group, remove the listener
      if (eventCount === 0 && el.removeEventListener) {
        el.removeEventListener(eventType, handler, false);
      }
      if (eventCount === 0 && el.detachEvent) {
        el.detachEvent('on' + eventType, handler);
      }
    }
  },

  on: function on(eventName, delegate, data, handler) {
    var el,
        events = this._events,
        len = this.length,
        eventNames = eventName.split(' '),
        delegateId,
        delegateGroup;

    while (len--) {
      el = this[len];

      // Normalize data input
      if (_.isFunction(delegate)) {
        handler = delegate;
        delegate = el;
        data = {};
      }
      if (_.isFunction(data)) {
        handler = data;
        data = {};
      }
      if (!_.isString(delegate) && !_.isElement(delegate)) {
        console.error("Delegate value passed to Rebound's $.on is neither an element or css selector");
        return false;
      }

      delegateId = _.isString(delegate) ? delegate : delegate.delegateId = delegate.delegateId || _.uniqueId('event');
      delegateGroup = el.delegateGroup = el.delegateGroup || _.uniqueId('delegateGroup');

      _.each(eventNames, function (eventName) {

        // Ensure event obj existance
        events[delegateGroup] = events[delegateGroup] || {};

        // TODO: take out of loop
        var callback = function callback(event) {
          var target, i, len, eventList, callbacks, callback, falsy;
          event = new $.Event(event || window.event); // Convert to mutable event
          target = event.target || event.srcElement;
          // Travel from target up to parent firing event on delegate when it exists
          while (target) {

            // Get all specified callbacks (element specific and selector specified)
            callbacks = $._hasDelegate(this, target, event.type);

            len = callbacks.length;
            for (i = 0; i < len; i++) {
              event.target = event.srcElement = target; // Attach this level's target
              event.data = callbacks[i].data; // Attach our data to the event
              event.result = callbacks[i].callback.call(el, event); // Call the callback
              falsy = event.result === false ? true : falsy; // If any callback returns false, log it as falsy
            }

            // If any of the callbacks returned false, prevent default and stop propagation
            if (falsy) {
              event.preventDefault();
              event.stopPropagation();
              return false;
            }

            target = target.parentNode;
          }
        };

        // If this is the first event of its type, add the event handler
        // AddEventListener supports IE9+
        if (!events[delegateGroup][eventName]) {
          // Because we're only attaching one callback per event type, this is okay.
          // This also allows jquery's trigger method to actually fire delegated events
          // el['on' + eventName] = callback;
          // If event is focus or blur, use capture to allow for event delegation.
          el.addEventListener(eventName, callback, eventName === 'focus' || eventName === 'blur');
        }

        // Add our listener
        events[delegateGroup][eventName] = events[delegateGroup][eventName] || {};
        events[delegateGroup][eventName][delegateId] = events[delegateGroup][eventName][delegateId] || [];
        events[delegateGroup][eventName][delegateId].push({ callback: handler, data: data });
      }, this);
    }
  },

  flatten: function flatten(data) {
    var result = {};
    function recurse(cur, prop) {
      if (Object(cur) !== cur) {
        result[prop] = cur;
      } else if (Array.isArray(cur)) {
        for (var i = 0, l = cur.length; i < l; i++) recurse(cur[i], prop + "[" + i + "]");
        if (l === 0) result[prop] = [];
      } else {
        var isEmpty = true;
        for (var p in cur) {
          isEmpty = false;
          recurse(cur[p], prop ? prop + "." + p : p);
        }
        if (isEmpty && prop) result[prop] = {};
      }
    }
    recurse(data, "");
    return result;
  },

  unMarkLinks: function unMarkLinks() {
    var len = this.length;
    while (len--) {
      var links = this[len].querySelectorAll('a');
      for (var i = 0; i < links.length; i++) {
        links.item(i).classList.remove('active');
        links.item(i).active = false;
      }
    }
    return this;
  },
  markLinks: function markLinks() {
    var len = this.length;
    while (len--) {
      var links = this[len].querySelectorAll('a[href="/' + Backbone.history.fragment + '"]');
      for (var i = 0; i < links.length; i++) {
        links.item(i).classList.add('active');
        links.item(i).active = true;
      }
    }
    return this;
  },

  // http://krasimirtsonev.com/blog/article/Cross-browser-handling-of-Ajax-requests-in-absurdjs
  ajax: function ajax(ops) {
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
          this.xhr.open("GET", ops.url + $.qs.stringify(ops.data), true);
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
        if (ops.headers && typeof ops.headers == 'object') {
          this.setHeaders(ops.headers);
        }
        setTimeout(function () {
          ops.method == 'get' ? self.xhr.send() : self.xhr.send($.qs.stringify(ops.data));
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
};

_.extend($, utils.prototype);

exports["default"] = $;
module.exports = exports["default"];
},{"qs":75}],11:[function(require,module,exports){
// Rebound Collection
// ----------------

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _reboundDataModel = require("rebound-data/model");

var _reboundDataModel2 = _interopRequireDefault(_reboundDataModel);

var _reboundComponentUtils = require("rebound-component/utils");

var _reboundComponentUtils2 = _interopRequireDefault(_reboundComponentUtils);

function pathGenerator(collection) {
  return function () {
    return collection.__path() + '[' + collection.indexOf(collection._byId[this.cid]) + ']';
  };
}

var Collection = Backbone.Collection.extend({

  isCollection: true,
  isData: true,

  model: _reboundDataModel2["default"],

  __path: function __path() {
    return '';
  },

  constructor: function constructor(models, options) {
    models || (models = []);
    options || (options = {});
    this._byValue = {};
    this.__observers = {};
    this.helpers = {};
    this.cid = _.uniqueId('collection');

    // Set lineage
    this.setParent(options.parent || this);
    this.setRoot(options.root || this);
    this.__path = options.path || this.__path;

    Backbone.Collection.apply(this, arguments);

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
    var parts = _.isString(key) ? _reboundComponentUtils2["default"].splitPath(key) : [],
        result = this,
        l = parts.length,
        i = 0;
    options || (options = {});

    // If the key is a number or object, or just a single string that is not a path,
    // get by id and return the first occurance
    if (typeof key == 'number' || typeof key == 'object' || parts.length == 1 && !options.isPath) {
      if (key === null) return void 0;
      var id = this.modelId(this._isModel(key) ? key.attributes : key);
      var responses = [].concat(this._byValue[key], this._byId[key] || this._byId[id] || this._byId[key.cid]);
      var res = responses[0],
          idx = Infinity;

      responses.forEach(function (value) {
        if (!value) return;
        var i = _.indexOf(_this.models, value);
        if (i > -1 && i < idx) {
          idx = i;res = value;
        }
      });

      return res;
    }

    // If key is not a string, return undefined
    if (!_.isString(key)) return void 0;

    if (_.isUndefined(key) || _.isNull(key)) return key;
    if (key === '' || parts.length === 0) return result;

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
        parts = _.isString(models) ? _reboundComponentUtils2["default"].splitPath(models) : [],
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
    return Backbone.Collection.prototype.set.call(this, newModels, options);
  }

});

exports["default"] = Collection;
module.exports = exports["default"];
},{"rebound-component/utils":10,"rebound-data/model":13}],12:[function(require,module,exports){
// Rebound Computed Property
// ----------------

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _propertyCompilerPropertyCompiler = require("property-compiler/property-compiler");

var _propertyCompilerPropertyCompiler2 = _interopRequireDefault(_propertyCompilerPropertyCompiler);

var _reboundComponentUtils = require("rebound-component/utils");

var _reboundComponentUtils2 = _interopRequireDefault(_reboundComponentUtils);

// Returns true if str starts with test
function startsWith(str, test) {
  if (str === test) return true;
  return str.substring(0, test.length + 1) === test + '.';
}

// Called after callstack is exausted to call all of this computed property's
// dependants that need to be recomputed
function recomputeCallback() {
  var i = 0,
      len = this._toCall.length;
  delete this._recomputeTimeout;
  for (i = 0; i < len; i++) {
    this._toCall.shift().call();
  }
  this._toCall.added = {};
}

var ComputedProperty = function ComputedProperty(getter, setter, options) {

  if (!_.isFunction(getter) && !_.isFunction(setter)) return console.error('ComputedProperty constructor must be passed a functions!', prop, 'Found instead.');
  options = options || {};
  this.cid = _.uniqueId('computedPropety');
  this.name = options.name;
  this.returnType = null;
  this.__observers = {};
  this.helpers = {};
  this.waiting = {};
  this.isChanging = false;
  this.isDirty = true;
  _.bindAll(this, 'onModify', 'markDirty');

  if (getter) this.getter = getter;
  if (setter) this.setter = setter;
  this.deps = _propertyCompilerPropertyCompiler2["default"].compile(this.getter, this.name);

  // Create lineage to pass to our cache objects
  var lineage = {
    parent: this.setParent(options.parent || this),
    root: this.setRoot(options.root || options.parent || this),
    path: this.__path = options.path || this.__path
  };

  // Results Cache Objects
  // These models will never be re-created for the lifetime of the Computed Proeprty
  // On Recompute they are updated with new values.
  // On Change their new values are pushed to the object it is tracking
  this.cache = {
    model: new Rebound.Model({}, lineage),
    collection: new Rebound.Collection([], lineage),
    value: undefined
  };

  this.wire();
};

_.extend(ComputedProperty.prototype, Backbone.Events, {

  isComputedProperty: true,
  isData: true,
  __path: function __path() {
    return '';
  },

  getter: function getter() {
    return undefined;
  },
  setter: function setter() {
    return undefined;
  },

  markDirty: function markDirty() {
    if (this.isDirty) return;
    this.isDirty = true;
    this.trigger('dirty', this);
  },

  // Attached to listen to all events where this Computed Property's dependancies
  // are stored. See wire(). Will re-evaluate any computed properties that
  // depend on the changed data value which triggered this callback.
  onRecompute: function onRecompute(type, model, collection, options) {
    var shortcircuit = { change: 1, sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1, dirty: 1 };
    if (shortcircuit[type] || !model.isData) return;
    model || (model = {});
    collection || (collection = {});
    options || (options = {});
    this._toCall || (this._toCall = []);
    this._toCall.added || (this._toCall.added = {});
    !collection.isData && (options = collection) && (collection = model);
    var push = function push(arr) {
      var i,
          len = arr.length;
      this.added || (this.added = {});
      for (i = 0; i < len; i++) {
        if (this.added[arr[i].cid]) continue;
        this.added[arr[i].cid] = 1;
        this.push(arr[i]);
      }
    },
        path,
        vector;
    vector = path = collection.__path().replace(/\.?\[.*\]/ig, '.@each');

    // If a reset event on a Model, check for computed properties that depend
    // on each changed attribute's full path.
    if (type === 'reset' && options.previousAttributes) {
      _.each(options.previousAttributes, function (value, key) {
        vector = path + (path && '.') + key;
        _.each(this.__computedDeps, function (dependants, dependancy) {
          startsWith(vector, dependancy) && push.call(this._toCall, dependants);
        }, this);
      }, this);
    }

    // If a reset event on a Collction, check for computed properties that depend
    // on anything inside that collection.
    else if (type === 'reset' && options.previousModels) {
        _.each(this.__computedDeps, function (dependants, dependancy) {
          startsWith(dependancy, vector) && push.call(this._toCall, dependants);
        }, this);
      }

      // If an add or remove event, check for computed properties that depend on
      // anything inside that collection or that contains that collection.
      else if (type === 'add' || type === 'remove') {
          _.each(this.__computedDeps, function (dependants, dependancy) {
            if (startsWith(dependancy, vector) || startsWith(vector, dependancy)) push.call(this._toCall, dependants);
          }, this);
        }

        // If a change event, trigger anything that depends on that changed path.
        else if (type.indexOf('change:') === 0) {
            vector = type.replace('change:', '').replace(/\.?\[.*\]/ig, '.@each');
            _.each(this.__computedDeps, function (dependants, dependancy) {
              startsWith(vector, dependancy) && push.call(this._toCall, dependants);
            }, this);
          }

    var i,
        len = this._toCall.length;
    for (i = 0; i < len; i++) {
      this._toCall[i].markDirty();
    }

    // Notifies all computed properties in the dependants array to recompute.
    // Marks everyone as dirty and then calls them.
    if (!this._recomputeTimeout) this._recomputeTimeout = setTimeout(_.bind(recomputeCallback, this), 0);
    return;
  },

  // Called when a Computed Property's active cache object changes.
  // Pushes any changes to Computed Property that returns a data object back to
  // the original object.
  onModify: function onModify(type, model, collection, options) {
    var shortcircuit = { sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1 };
    if (!this.tracking || shortcircuit[type] || ~type.indexOf('change:')) return;
    model || (model = {});
    collection || (collection = {});
    options || (options = {});
    !collection.isData && _.isObject(collection) && (options = collection) && (collection = model);
    var src = this;
    var path = collection.__path().replace(src.__path(), '').replace(/^\./, '');
    // Need to pass isPath: true here because when syncing across computed properties
    // that return collections we may just be passing the model index for the path.
    var dest = this.tracking.get(path, { raw: true, isPath: true });
    if (_.isUndefined(dest)) return;
    if (type === 'change') dest.set && dest.set(model.changedAttributes());else if (type === 'reset') dest.reset && dest.reset(model);else if (type === 'add') dest.add && dest.add(model);else if (type === 'remove') dest.remove && dest.remove(model);
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
      var dep = root.get(path, { raw: true, isPath: true });
      if (!dep || !dep.isComputedProperty) return;
      dep.on('dirty', this.markDirty);
    }, this);

    _.each(this.deps, function (path) {
      // Find actual path from relative paths
      var split = _reboundComponentUtils2["default"].splitPath(path);
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
      if (!dep || !dep.isComputedProperty) return;
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

    if (!this.isDirty || this.isChanging || !context) return;
    this.isChanging = true;

    var value = this.cache[this.returnType],
        result;

    // Check all of our dependancies to see if they are evaluating.
    // If we have a dependancy that is dirty and this isnt its first run,
    // Let this dependancy know that we are waiting for it.
    // It will re-run this Computed Property after it finishes.
    _.each(this.deps, function (dep) {
      var dependancy = context.get(dep, { raw: true, isPath: true });
      if (!dependancy || !dependancy.isComputedProperty) return;
      if (dependancy.isDirty && dependancy.returnType !== null) {
        dependancy.waiting[this.cid] = this;
        dependancy.apply(); // Try to re-evaluate this dependancy if it is dirty
        if (dependancy.isDirty) return this.isChanging = false;
      }
      delete dependancy.waiting[this.cid];
      // TODO: There can be a check here looking for cyclic dependancies.
    }, this);

    if (!this.isChanging) return;

    if (this.returnType !== 'value') this.stopListening(value, 'all', this.onModify);

    result = this.getter.apply(context, params);

    // Promote vanilla objects to Rebound Data keeping the same original objects
    if (_.isArray(result)) result = new Rebound.Collection(result, { clone: false });else if (_.isObject(result) && !result.isData) result = new Rebound.Model(result, { clone: false });

    // If result is undefined, reset our cache item
    if (_.isUndefined(result) || _.isNull(result)) {
      this.returnType = 'value';
      this.isCollection = this.isModel = false;
      this.set(undefined);
    }
    // Set result and return types, bind events
    else if (result.isCollection) {
        this.returnType = 'collection';
        this.isCollection = true;
        this.isModel = false;
        this.set(result);
        this.track(result);
      } else if (result.isModel) {
        this.returnType = 'model';
        this.isCollection = false;
        this.isModel = true;
        this.reset(result);
        this.track(result);
      } else {
        this.returnType = 'value';
        this.isCollection = this.isModel = false;
        this.reset(result);
      }

    return this.value();
  },

  // When we receive a new model to set in our cache, unbind the tracker from
  // the previous cache object, sync the objects' cids so helpers think they
  // are the same object, save a referance to the object we are tracking,
  // and re-bind our onModify hook.
  track: function track(object) {
    var target = this.value();
    if (!object || !target || !target.isData || !object.isData) return;
    target._cid || (target._cid = target.cid);
    object._cid || (object._cid = object.cid);
    target.cid = object.cid;
    this.tracking = object;
    this.listenTo(target, 'all', this.onModify);
  },

  // Get from the Computed Property's cache
  get: function get(key, options) {
    var value = this.value();
    options || (options = {});
    if (this.returnType === 'value') return console.error('Called get on the `' + this.name + '` computed property which returns a primitive value.');
    return value.get(key, options);
  },

  // Set the Computed Property's cache to a new value and trigger appropreate events.
  // Changes will propagate back to the original object if a Rebound Data Object and re-compute.
  // If Computed Property returns a value, all downstream dependancies will re-compute.
  set: function set(key, val, options) {

    if (this.returnType === null) return undefined;
    options || (options = {});
    var attrs = key;
    var value = this.value();

    // Noralize the data passed in
    if (this.returnType === 'model') {
      if (typeof key === 'object') {
        attrs = key.isModel ? key.attributes : key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }
    }
    if (this.returnType !== 'model') options = val || {};
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
    } else if (this.returnType !== 'value' && options.reset) key = value.reset(attrs, options);else if (this.returnType !== 'value') key = value.set(attrs, options);
    this.isDirty = this.isChanging = false;

    // Call all reamining computed properties waiting for this value to resolve.
    _.each(this.waiting, function (prop) {
      prop && prop.call();
    });

    return key;
  },

  // Return the current value from the cache, running if dirty.
  value: function value() {
    if (this.isDirty) this.apply();
    return this.cache[this.returnType];
  },

  // Reset the current value in the cache, running if first run.
  reset: function reset(obj, options) {
    if (_.isNull(this.returnType)) return; // First run
    options || (options = {});
    options.reset = true;
    return this.set(obj, options);
  },

  // Cyclic dependancy safe toJSON method.
  toJSON: function toJSON() {
    if (this._isSerializing) return this.cid;
    var val = this.value();
    this._isSerializing = true;
    var json = val && _.isFunction(val.toJSON) ? val.toJSON() : val;
    this._isSerializing = false;
    return json;
  }

});

exports["default"] = ComputedProperty;
module.exports = exports["default"];
},{"property-compiler/property-compiler":2,"rebound-component/utils":10}],13:[function(require,module,exports){
// Rebound Model
// ----------------

// Rebound **Models** are the basic data object in the framework - frequently
// representing a row in a table in a database on your server. The inherit from
// Backbone Models and have all of the same useful methods you are used to for
// performing computations and transformations on that data. Rebound augments
// Backbone Models by enabling deep data nesting. You can now have **Rebound Collections**
// and **Rebound Computed Properties** as properties of the Model.

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _reboundDataComputedProperty = require("rebound-data/computed-property");

var _reboundDataComputedProperty2 = _interopRequireDefault(_reboundDataComputedProperty);

var _reboundComponentUtils = require("rebound-component/utils");

var _reboundComponentUtils2 = _interopRequireDefault(_reboundComponentUtils);

// Returns a function that, when called, generates a path constructed from its
// parent's path and the key it is assigned to. Keeps us from re-naming children
// when parents change.
function pathGenerator(parent, key) {
  return function () {
    var path = parent.__path();
    return path + (path === '' ? '' : '.') + key;
  };
}

var Model = Backbone.Model.extend({
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
  constructor: function constructor(attributes, options) {
    var self = this;
    if (attributes === null || attributes === undefined) attributes = {};
    attributes.isModel && (attributes = attributes.attributes);
    options || (options = {});
    this.helpers = {};
    this.defaults = this.defaults || {};
    this.setParent(options.parent || this);
    this.setRoot(options.root || this);
    this.__path = options.path || this.__path;

    // Convert getters and setters to computed properties
    _reboundComponentUtils2["default"].extractComputedProps(attributes);

    Backbone.Model.call(this, attributes, options);
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

    // Iterate over the Model's attributes:
    // - If the property is the `idAttribute`, skip.
    // - If the property is a `Model`, `Collection`, or `ComputedProperty`, reset it.
    // - If the passed object has the property, set it to the new value.
    // - If the Model has a default value for this property, set it back to default.
    // - Otherwise, unset the attribute.
    for (key in this.attributes) {
      value = this.attributes[key];
      if (value === obj[key]) continue;else if (_.isUndefined(value)) obj[key] && (changed[key] = obj[key]);else if (value.isComponent) continue;else if (value.isCollection || value.isModel || value.isComputedProperty) {
        value.reset(obj[key] || [], { silent: true });
        if (value.isCollection) changed[key] = value.previousModels;else if (value.isModel && value.isComputedProperty) changed[key] = value.cache.model.changedAttributes();else if (value.isModel) changed[key] = value.changedAttributes();
      } else if (obj.hasOwnProperty(key)) {
        changed[key] = obj[key];
      } else if (this.defaults.hasOwnProperty(key) && !_.isFunction(this.defaults[key])) {
        changed[key] = obj[key] = this.defaults[key];
      } else {
        changed[key] = undefined;
        this.unset(key, { silent: true });
      }
    }

    // Any unset changed values will be set to obj[key]
    _.each(obj, function (value, key, obj) {
      changed[key] = changed[key] || obj[key];
    });

    // Reset our model
    obj = this.set(obj, _.extend({}, options, { silent: true, reset: false }));

    // Trigger custom reset event
    this.changed = changed;
    if (!options.silent) this.trigger('reset', this, options);

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
    var parts = _reboundComponentUtils2["default"].splitPath(key),
        result = this,
        i,
        l = parts.length;

    if (_.isUndefined(key) || _.isNull(key)) return undefined;
    if (key === '' || parts.length === 0) return result;

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

    if (typeof key === 'object') {
      attrs = key.isModel ? key.attributes : key;
      options = value;
    } else (attrs = {})[key] = value;
    options || (options = {});

    // Convert getters and setters to computed properties
    _reboundComponentUtils2["default"].extractComputedProps(attrs);

    // If reset option passed, do a reset. If nothing passed, return.
    if (options.reset === true) return this.reset(attrs, options);
    if (options.defaults === true) this.defaults = attrs;
    if (_.isEmpty(attrs)) return;

    // For each attribute passed:
    var _loop = function () {
      var val = attrs[key],
          paths = _reboundComponentUtils2["default"].splitPath(key),
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
        path: pathGenerator(target, key),
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
      if (_.isNull(val) || _.isUndefined(val)) val = undefined;else if (val instanceof String) val = String(val);else if (val instanceof Number) val = Number(val);else if (val instanceof Boolean) val = Boolean(val.valueOf());else if (options.raw === true) val = val;else if (destination.isComputedProperty && destination.func === val) return "continue";else if (val.isComputedProto) val = new _reboundDataComputedProperty2["default"](val.get, val.set, lineage);else if (val.isData && target.hasParent(val)) val = val;else if (destination.isComputedProperty || destination.isCollection && (_.isArray(val) || val.isCollection) || destination.isModel && (_.isObject(val) || val.isModel)) {
        destination.set(val, options);
        return "continue";
      } else if (val.isData && options.clone !== false) val = new val.constructor(val.attributes || val.models, lineage);else if (_.isArray(val)) val = new Rebound.Collection(val, lineage); // TODO: Remove global referance
      else if (_.isObject(val)) val = new Model(val, lineage);

      // If val is a data object, let this object know it is now a parent
      _this._hasAncestry = val && val.isData || false;

      // Set the value
      Backbone.Model.prototype.set.call(target, attr, val, options); // TODO: Event cleanup when replacing a model or collection with another value
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
    if (this._isSerializing) return this.id || this.cid;
    this._isSerializing = true;
    var json = _.clone(this.attributes);
    _.each(json, function (value, name) {
      if (_.isNull(value) || _.isUndefined(value)) {
        return;
      }
      _.isFunction(value.toJSON) && (json[name] = value.toJSON());
    });
    this._isSerializing = false;
    return json;
  }

});

// If default properties are passed into extend, process the computed properties
Model.extend = function (protoProps, staticProps) {
  _reboundComponentUtils2["default"].extractComputedProps(protoProps.defaults);
  return Backbone.Model.extend.call(this, protoProps, staticProps);
};

exports["default"] = Model;
module.exports = exports["default"];
},{"rebound-component/utils":10,"rebound-data/computed-property":12}],14:[function(require,module,exports){
// Rebound Data
// ----------------
// These are methods inherited by all Rebound data types: **Models**,
// **Collections** and **Computed Properties**. Controls tree ancestry
// tracking, deep event propagation and tree destruction.

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _reboundDataModel = require("rebound-data/model");

var _reboundDataModel2 = _interopRequireDefault(_reboundDataModel);

var _reboundDataCollection = require("rebound-data/collection");

var _reboundDataCollection2 = _interopRequireDefault(_reboundDataCollection);

var _reboundDataComputedProperty = require("rebound-data/computed-property");

var _reboundDataComputedProperty2 = _interopRequireDefault(_reboundDataComputedProperty);

var _reboundComponentUtils = require("rebound-component/utils");

var _reboundComponentUtils2 = _interopRequireDefault(_reboundComponentUtils);

var sharedMethods = {
  // When a change event propagates up the tree it modifies the path part of
  // `change:<path>` to reflect the fully qualified path relative to that object.
  // Ex: Would trigger `change:val`, `change:[0].val`, `change:arr[0].val` and `obj.arr[0].val`
  // on each parent as it is propagated up the tree.
  propagateEvent: function propagateEvent(type, model) {
    if (this.__parent__ === this || type === 'dirty') return;
    if (type.indexOf('change:') === 0 && model.isModel) {
      if (this.isCollection && ~type.indexOf('change:[')) return;
      var key,
          path = model.__path().replace(this.__parent__.__path(), '').replace(/^\./, ''),
          changed = model.changedAttributes();

      for (key in changed) {
        // TODO: Modifying arguments array is bad. change this
        arguments[0] = 'change:' + path + (path && '.') + key; // jshint ignore:line
        this.__parent__.trigger.apply(this.__parent__, arguments);
      }
      return;
    }
    return this.__parent__.trigger.apply(this.__parent__, arguments);
  },

  // Set this data object's parent to `parent` and, as long as a data object is
  // not its own parent, propagate every event triggered on `this` up the tree.
  setParent: function setParent(parent) {
    if (this.__parent__) this.off('all', this.propagateEvent);
    this.__parent__ = parent;
    this._hasAncestry = true;
    if (parent !== this) this.on('all', this.__parent__.propagateEvent);
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
    if (this.undelegateEvents) this.undelegateEvents();
    if (this.stopListening) this.stopListening();
    if (this.off) this.off();
    if (this.unwire) this.unwire();

    // Destroy this data object's lineage
    delete this.__parent__;
    delete this.__root__;
    delete this.__path;

    // If there is a dom element associated with this data object, destroy all listeners associated with it.
    // Remove all event listeners from this dom element, recursively remove element lazyvalues,
    // and then remove the element referance itself.
    if (this.el) {
      _.each(this.el.__listeners, function (handler, eventType) {
        if (this.el.removeEventListener) this.el.removeEventListener(eventType, handler, false);
        if (this.el.detachEvent) this.el.detachEvent('on' + eventType, handler);
      }, this);
      (0, _reboundComponentUtils2["default"])(this.el).walkTheDOM(function (el) {
        if (el.__lazyValue && el.__lazyValue.destroy()) n.__lazyValue.destroy();
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
_.extend(_reboundDataModel2["default"].prototype, sharedMethods);
_.extend(_reboundDataCollection2["default"].prototype, sharedMethods);
_.extend(_reboundDataComputedProperty2["default"].prototype, sharedMethods);

exports["default"] = { Model: _reboundDataModel2["default"], Collection: _reboundDataCollection2["default"], ComputedProperty: _reboundDataComputedProperty2["default"] };
module.exports = exports["default"];
},{"rebound-component/utils":10,"rebound-data/collection":11,"rebound-data/computed-property":12,"rebound-data/model":13}],15:[function(require,module,exports){
// Services keep track of their consumers. LazyComponent are placeholders
// for services that haven't loaded yet. A LazyComponent mimics the api of a
// real service/component (they are the same), and when the service finally
// loads, its ```hydrate``` method is called. All consumers of the service will
// have the now fully loaded service set, the LazyService will transfer all of
// its consumers over to the fully loaded service, and then commit seppiku,
// destroying itself.
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function LazyComponent() {
  var loadCallbacks = [];
  this.isService = true;
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
    this._component = service;
    _.each(this.consumers, function (consumer) {
      var component = consumer.component,
          key = consumer.key;
      if (component.attributes && component.set) component.set(key, service);
      if (component.services) component.services[key] = service;
      if (component.defaults) component.defaults[key] = service;
    });
    service.consumers = this.consumers;

    // Call all of our callbacks
    _.each(loadCallbacks, function (cb) {
      cb(service);
    });
    delete this.loadCallbacks;
  };
  this.onLoad = function (cb) {
    loadCallbacks.push(cb);
  };
}

exports["default"] = LazyComponent;
module.exports = exports["default"];
},{}],16:[function(require,module,exports){
// Rebound Router
// ----------------

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _reboundComponentUtils = require("rebound-component/utils");

var _reboundComponentUtils2 = _interopRequireDefault(_reboundComponentUtils);

var _reboundRouterLazyComponent = require("rebound-router/lazy-component");

var _reboundRouterLazyComponent2 = _interopRequireDefault(_reboundRouterLazyComponent);

var DEFAULT_404_PAGE = "<div style=\"display: block;text-align: center;font-size: 22px;\">\n  <h1 style=\"margin-top: 60px;\">\n    Oops! We couldn't find this page.\n  </h1>\n  <a href=\"#\" onclick=\"window.history.back();return false;\" style=\"display: block;text-decoration: none;margin-top: 30px;\">\n    Take me back\n  </a>\n</div>";

var ERROR_ROUTE_NAME = 'error';
var SUCCESS = 'success';
var ERROR = 'error';
var LOADING = 'loading';

// Regexp to validate remote URLs
var IS_REMOTE_URL = /^([a-z]+:)|^(\/\/)|^([^\/]+\.)/;

// Overload Backbone's loadUrl so it returns the value of the routed callback
// Only ever compare the current path (excludes the query params) to the route regexp
Backbone.history.loadUrl = function (fragment) {
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
Backbone.history.getSearch = function () {
  var match = this.location.href.replace(/#[^\?]*/, '').match(/\?.+/);
  return match ? match[0] : '';
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

    // Stringify any data passed in the options hash
    console.log(fragment, ~fragment.indexOf('?') ? '?' : '&');
    var query = options.data ? (~fragment.indexOf('?') ? '&' : '?') + _reboundComponentUtils2["default"].qs.stringify(options.data) : '';

    // Un-Mark any `active` links in the page container
    var $container = (0, _reboundComponentUtils2["default"])(this.config.containers).unMarkLinks();

    // Navigate to the specified path. Return value is the value from the router
    // callback specified on the component
    var resp = Backbone.history.navigate(fragment + query, options);

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
    if (callback) return callback.apply(this, args);
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
      res = Backbone.Router.prototype._routeToRegExp.call(this, route);
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

    if (!callback) callback = this[name];
    Backbone.history.route(_route, function (fragment) {

      // If this route was defined as a regular expression, we don't capture
      // query params. Only parse the actual path.
      fragment = fragment.split('?')[0];

      // Extract the arguments we care about from the fragment
      var args = _this._extractParameters(_route, fragment);

      // Get the query params string
      var search = (Backbone.history.getSearch() || '').slice(1);

      // If this route was created from a string (not a regexp), remove the auto-captured
      // search params.
      if (_route._isString) args.pop();

      // If the route is not user prodided, if the history object has search params
      // then our args have the params as its last agrument as of Backbone 1.2.0
      // If the route is a user provided regex, add in parsed search params from
      // the history object before passing to the callback.
      args.push(search ? _reboundComponentUtils2["default"].qs.parse(search) : {});

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
    this.config.container = (0, _reboundComponentUtils2["default"])(this.config.container || 'main')[0];
    this.config.containers.push(this.config.container);
    Rebound.services.page = new _reboundRouterLazyComponent2["default"]();

    // Install our global components
    _.each(this.config.services, function (selector, route) {
      var container = (0, _reboundComponentUtils2["default"])(selector)[0] || document.createElement('span');
      this.config.containers.push(container);
      Rebound.services[route] = new _reboundRouterLazyComponent2["default"]();
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
    (0, _reboundComponentUtils2["default"])(this.config.container).off('click');
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
    (0, _reboundComponentUtils2["default"])(container).on('click', 'a', function (e) {
      var path = e.target.getAttribute('href');

      // If the path is a remote URL, allow the browser to navigate normally.
      // Otherwise, prevent default so we can handle the route event.
      if (IS_REMOTE_URL.test(path) || path === '#') return;
      e.preventDefault();

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
      var regExp = _this3._routeToRegExp(key).toString();
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
      // Add the new callback referance on to our router and add the route handler
      _this4.route(key, value, function () {
        return pageInstance.data[value].apply(pageInstance.data, arguments);
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
        jsElement = (0, _reboundComponentUtils2["default"])('script[src="' + jsUrl + '"]')[0];
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
        (0, _reboundComponentUtils2["default"])(cssElement).on('load', successCallback);
        (0, _reboundComponentUtils2["default"])(cssElement).on('error', errorCallback);
        (0, _reboundComponentUtils2["default"])(cssElement).on('readystatechange', function () {
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

exports["default"] = ReboundRouter;
module.exports = exports["default"];
},{"rebound-component/utils":10,"rebound-router/lazy-component":15}],17:[function(require,module,exports){
//     Rebound.js 0.0.92

//     (c) 2015 Adam Miller
//     Rebound may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://reboundjs.com

// Rebound Runtime
// ----------------

// If Backbone isn't preset on the page yet, or if `window.Rebound` is already
// in use, throw an error
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// Load our **Utils**, helper environment, **Rebound Data**,
// **Rebound Components** and the **Rebound Router**

var _reboundComponentUtils = require("rebound-component/utils");

var _reboundComponentUtils2 = _interopRequireDefault(_reboundComponentUtils);

var _reboundComponentHelpers = require("rebound-component/helpers");

var _reboundComponentHelpers2 = _interopRequireDefault(_reboundComponentHelpers);

var _reboundDataReboundData = require("rebound-data/rebound-data");

var _reboundComponentComponent = require("rebound-component/component");

var _reboundComponentComponent2 = _interopRequireDefault(_reboundComponentComponent);

var _reboundRouterReboundRouter = require("rebound-router/rebound-router");

var _reboundRouterReboundRouter2 = _interopRequireDefault(_reboundRouterReboundRouter);

// If Backbone doesn't have an ajax method from an external DOM library, use ours
if (!window.Backbone) throw "Backbone must be on the page for Rebound to load.";window.Backbone.ajax = window.Backbone.$ && window.Backbone.$.ajax && window.Backbone.ajax || _reboundComponentUtils2["default"].ajax;

// Create Global Rebound Object
var Rebound = window.Rebound = {
  services: {},
  registerHelper: _reboundComponentHelpers2["default"].registerHelper,
  registerPartial: _reboundComponentHelpers2["default"].registerPartial,
  registerComponent: _reboundComponentComponent2["default"].registerComponent,
  Model: _reboundDataReboundData.Model,
  Collection: _reboundDataReboundData.Collection,
  ComputedProperty: _reboundDataReboundData.ComputedProperty,
  Component: _reboundComponentComponent2["default"],
  start: function start(options) {
    var _this = this;

    return new Promise(function (resolve, reject) {
      var run = function run() {
        if (!document.body) return setTimeout(run.bind(_this), 1);
        delete _this.router;
        _this.router = new _reboundRouterReboundRouter2["default"](options, resolve);
      };
      run();
    });
  },
  stop: function stop() {
    if (!this.router) return console.error('No running Rebound router found!');
    this.router.stop();
  }
};

// Fetch Rebound's Config Object from Rebound's `script` tag
var Config = document.getElementById('Rebound');
Config = Config ? Config.innerHTML : false;

// Set our require config
requirejs.config({
  baseUrl: "/"
});

// Start the router if a config object is preset
if (Config) Rebound.start(JSON.parse(Config));

exports["default"] = Rebound;
module.exports = exports["default"];
},{"rebound-component/component":6,"rebound-component/helpers":7,"rebound-component/utils":10,"rebound-data/rebound-data":14,"rebound-router/rebound-router":16}],18:[function(require,module,exports){
'use strict';

var Morph = require('./htmlbars-runtime/morph');
var AttrMorph = require('./morph-attr');
var build_html_dom = require('./dom-helper/build-html-dom');
var classes = require('./dom-helper/classes');
var prop = require('./dom-helper/prop');

var doc = typeof document === "undefined" ? false : document;

var deletesBlankTextNodes = doc && (function (document) {
  var element = document.createElement("div");
  element.appendChild(document.createTextNode(""));
  var clonedElement = element.cloneNode(true);
  return clonedElement.childNodes.length === 0;
})(doc);

var ignoresCheckedAttribute = doc && (function (document) {
  var element = document.createElement("input");
  element.setAttribute("checked", "checked");
  var clonedElement = element.cloneNode(false);
  return !clonedElement.checked;
})(doc);

var canRemoveSvgViewBoxAttribute = doc && (doc.createElementNS ? (function (document) {
  var element = document.createElementNS(build_html_dom.svgNamespace, "svg");
  element.setAttribute("viewBox", "0 0 100 100");
  element.removeAttribute("viewBox");
  return !element.getAttribute("viewBox");
})(doc) : true);

var canClone = doc && (function (document) {
  var element = document.createElement("div");
  element.appendChild(document.createTextNode(" "));
  element.appendChild(document.createTextNode(" "));
  var clonedElement = element.cloneNode(true);
  return clonedElement.childNodes[0].nodeValue === " ";
})(doc);

// This is not the namespace of the element, but of
// the elements inside that elements.
function interiorNamespace(element) {
  if (element && element.namespaceURI === build_html_dom.svgNamespace && !build_html_dom.svgHTMLIntegrationPoints[element.tagName]) {
    return build_html_dom.svgNamespace;
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
  if (contextualElement.tagName === "TABLE") {
    var omittedStartTagChildMatch = omittedStartTagChildTest.exec(string);
    if (omittedStartTagChildMatch) {
      var omittedStartTagChild = omittedStartTagChildMatch[1];
      // It is already asserted that the contextual element is a table
      // and not the proper start tag. Just see if a tag was omitted.
      return omittedStartTagChild === "tr" || omittedStartTagChild === "col";
    }
  }
}

function buildSVGDOM(html, dom) {
  var div = dom.document.createElement("div");
  div.innerHTML = "<svg>" + html + "</svg>";
  return div.firstChild.childNodes;
}

var guid = 1;

function ElementMorph(element, dom, namespace) {
  this.element = element;
  this.dom = dom;
  this.namespace = namespace;
  this.guid = "element" + guid++;

  this.state = {};
  this.isDirty = true;
}

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

prototype.childAt = function (element, indices) {
  var child = element;

  for (var i = 0; i < indices.length; i++) {
    child = child.childNodes.item(indices[i]);
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
    if (element.tagName === "svg" && name === "viewBox") {
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

  if (value === null && (name === "value" || name === "type" || name === "src")) {
    value = "";
  }

  element[name] = value;
};

prototype.getPropertyStrict = function (element, name) {
  return element[name];
};

prototype.setProperty = function (element, name, value, namespace) {
  var lowercaseName = name.toLowerCase();
  if (element.namespaceURI === build_html_dom.svgNamespace || lowercaseName === "style") {
    if (prop.isAttrRemovalValue(value)) {
      element.removeAttribute(name);
    } else {
      if (namespace) {
        element.setAttributeNS(namespace, name, value);
      } else {
        element.setAttribute(name, value);
      }
    }
  } else {
    var normalized = prop.normalizeProperty(element, name);
    if (normalized) {
      element[normalized] = value;
    } else {
      if (prop.isAttrRemovalValue(value)) {
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
      if (tagName === "svg") {
        namespace = build_html_dom.svgNamespace;
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

prototype.addClasses = classes.addClasses;
prototype.removeClasses = classes.removeClasses;

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
      var textNode = this.document.createTextNode(""),
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
    element.setAttribute("checked", "checked");
  }
};

prototype.cloneNode = function (element, deep) {
  var clone = element.cloneNode(!!deep);
  return clone;
};

prototype.AttrMorphClass = AttrMorph['default'];

prototype.createAttrMorph = function (element, attrName, namespace) {
  return new this.AttrMorphClass(element, attrName, this, namespace);
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

prototype.MorphClass = Morph['default'];

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
  return Morph['default'].create(this, contextualElement, fragment);
};

prototype.replaceContentWithMorph = function (element) {
  var firstChild = element.firstChild;

  if (!firstChild) {
    var comment = this.createComment("");
    this.appendChild(element, comment);
    return Morph['default'].create(this, element, comment);
  } else {
    var morph = Morph['default'].attach(this, element, firstChild, element.lastChild);
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
  var insertion = this.document.createComment("");
  element.insertBefore(insertion, referenceChild);
  return this.createMorph(element, insertion, insertion, contextualElement);
};

prototype.appendMorph = function (element, contextualElement) {
  var insertion = this.document.createComment("");
  element.appendChild(insertion);
  return this.createMorph(element, insertion, insertion, contextualElement);
};

prototype.insertBoundary = function (fragment, index) {
  // this will always be null or firstChild
  var child = index === null ? null : this.childAtIndex(fragment, index);
  this.insertBefore(fragment, this.createTextNode(""), child);
};

prototype.parseHTML = function (html, contextualElement) {
  var childNodes;

  if (interiorNamespace(contextualElement) === build_html_dom.svgNamespace) {
    childNodes = buildSVGDOM(html, this);
  } else {
    var nodes = build_html_dom.buildHTMLDOM(html, contextualElement, this);
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
    if (contextualElement.tagName === "SELECT") {
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

var parsingNode;

// Used to determine whether a URL needs to be sanitized.
prototype.protocolForURL = function (url) {
  if (!parsingNode) {
    parsingNode = this.document.createElement("a");
  }

  parsingNode.href = url;
  return parsingNode.protocol;
};

exports['default'] = DOMHelper;
},{"./dom-helper/build-html-dom":19,"./dom-helper/classes":20,"./dom-helper/prop":21,"./htmlbars-runtime/morph":32,"./morph-attr":61}],19:[function(require,module,exports){
'use strict';

/* global XMLSerializer:false */
var svgHTMLIntegrationPoints = { foreignObject: 1, desc: 1, title: 1 };
var svgNamespace = 'http://www.w3.org/2000/svg';

var doc = typeof document === 'undefined' ? false : document;

// Safari does not like using innerHTML on SVG HTML integration
// points (desc/title/foreignObject).
var needsIntegrationPointFix = doc && (function (document) {
  if (document.createElementNS === undefined) {
    return;
  }
  // In FF title will not accept innerHTML.
  var testEl = document.createElementNS(svgNamespace, 'title');
  testEl.innerHTML = '<div></div>';
  return testEl.childNodes.length === 0 || testEl.childNodes[0].nodeType !== 1;
})(doc);

// Internet Explorer prior to 9 does not allow setting innerHTML if the first element
// is a "zero-scope" element. This problem can be worked around by making
// the first node an invisible text node. We, like Modernizr, use &shy;
var needsShy = doc && (function (document) {
  var testEl = document.createElement('div');
  testEl.innerHTML = '<div></div>';
  testEl.firstChild.innerHTML = '<script></script>';
  return testEl.firstChild.innerHTML === '';
})(doc);

// IE 8 (and likely earlier) likes to move whitespace preceeding
// a script tag to appear after it. This means that we can
// accidentally remove whitespace when updating a morph.
var movesWhitespace = doc && (function (document) {
  var testEl = document.createElement('div');
  testEl.innerHTML = 'Test: <script type=\'text/x-placeholder\'></script>Value';
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
  if (shyElement.nodeType === 3 && shyElement.nodeValue.charAt(0) === '­') {
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
    throw 'Can\'t set innerHTML on ' + tagName + ' in this browser';
  }

  html = fixSelect(html, contextualElement);

  var wrappingTags = tagNamesRequiringInnerHTMLFix[tagName.toLowerCase()];

  var startTag = outerHTML.match(new RegExp('<' + tagName + '([^>]*)>', 'i'))[0];
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
    html = '<option></option>' + html;
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
  buildHTMLDOM = function buildHTMLDOM(html, contextualElement, dom) {
    if (svgHTMLIntegrationPoints[contextualElement.tagName]) {
      return buildIESafeDOM(html, document.createElement('div'), dom);
    } else {
      return buildIESafeDOM(html, contextualElement, dom);
    }
  };
} else {
  buildHTMLDOM = buildIESafeDOM;
}

exports.svgHTMLIntegrationPoints = svgHTMLIntegrationPoints;
exports.svgNamespace = svgNamespace;
exports.buildHTMLDOM = buildHTMLDOM;
},{}],20:[function(require,module,exports){
'use strict';

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
  addClasses = function addClasses(element, classNames) {
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
  removeClasses = function removeClasses(element, classNames) {
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
  addClasses = addClassesViaAttribute;
  removeClasses = removeClassesViaAttribute;
}

exports.addClasses = addClasses;
exports.removeClasses = removeClasses;
},{}],21:[function(require,module,exports){
'use strict';

exports.isAttrRemovalValue = isAttrRemovalValue;
exports.normalizeProperty = normalizeProperty;

function isAttrRemovalValue(value) {
  return value === null || value === undefined;
}

function UNDEFINED() {}

// TODO should this be an o_create kind of thing?
var propertyCaches = {};function normalizeProperty(element, attrName) {
  var tagName = element.tagName;
  var key, cachedAttrName;
  var cache = propertyCaches[tagName];
  if (!cache) {
    // TODO should this be an o_create kind of thing?
    cache = {};
    for (cachedAttrName in element) {
      key = cachedAttrName.toLowerCase();
      if (isSettable(element, cachedAttrName)) {
        cache[key] = cachedAttrName;
      } else {
        cache[key] = UNDEFINED;
      }
    }
    propertyCaches[tagName] = cache;
  }

  // presumes that the attrName has been lowercased.
  var value = cache[attrName];
  return value === UNDEFINED ? undefined : value;
}

// elements with a property that does not conform to the spec in certain
// browsers. In these cases, we'll end up using setAttribute instead
var badPairs = [{
  // phantomjs < 2.0 lets you set it as a prop but won't reflect it
  // back to the attribute. button.getAttribute('type') === null
  tagName: 'BUTTON',
  propName: 'type'
}, {
  // Some version of IE (like IE9) actually throw an exception
  // if you set input.type = 'something-unknown'
  tagName: 'INPUT',
  propName: 'type'
}, {
  // Some versions of IE (IE8) throw an exception when setting
  // `input.list = 'somestring'`:
  // https://github.com/emberjs/ember.js/issues/10908
  // https://github.com/emberjs/ember.js/issues/11364
  tagName: 'INPUT',
  propName: 'list'
}];

function isSettable(element, attrName) {
  for (var i = 0, l = badPairs.length; i < l; i++) {
    var pair = badPairs[i];
    if (pair.tagName === element.tagName && pair.propName === attrName) {
      return false;
    }
  }

  return true;
}

exports.propertyCaches = propertyCaches;
},{}],22:[function(require,module,exports){
'use strict';

exports.compileSpec = compileSpec;
exports.template = template;
exports.compile = compile;

var parser = require('../htmlbars-syntax/parser');
var TemplateCompiler = require('./template-compiler');
var hooks = require('../htmlbars-runtime/hooks');
var render = require('../htmlbars-runtime/render');


function compileSpec(string, options) {
  var ast = parser.preprocess(string, options);
  var compiler = new TemplateCompiler['default'](options);
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
  return hooks.wrap(template(compileSpec(string, options)), render['default']);
}
},{"../htmlbars-runtime/hooks":31,"../htmlbars-runtime/render":33,"../htmlbars-syntax/parser":45,"./template-compiler":27}],23:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var quoting = require('../htmlbars-util/quoting');

var svgNamespace = "http://www.w3.org/2000/svg",

// http://www.w3.org/html/wg/drafts/html/master/syntax.html#html-integration-point
svgHTMLIntegrationPoints = { "foreignObject": true, "desc": true, "title": true };

function FragmentJavaScriptCompiler() {
  this.source = [];
  this.depth = -1;
}

exports['default'] = FragmentJavaScriptCompiler;

FragmentJavaScriptCompiler.prototype.compile = function (opcodes, options) {
  this.source.length = 0;
  this.depth = -1;
  this.indent = options && options.indent || "";
  this.namespaceFrameStack = [{ namespace: null, depth: null }];
  this.domNamespace = null;

  this.source.push("function buildFragment(dom) {\n");
  utils.processOpcodes(this, opcodes);
  this.source.push(this.indent + "}");

  return this.source.join("");
};

FragmentJavaScriptCompiler.prototype.createFragment = function () {
  var el = "el" + ++this.depth;
  this.source.push(this.indent + "  var " + el + " = dom.createDocumentFragment();\n");
};

FragmentJavaScriptCompiler.prototype.createElement = function (tagName) {
  var el = "el" + ++this.depth;
  if (tagName === "svg") {
    this.pushNamespaceFrame({ namespace: svgNamespace, depth: this.depth });
  }
  this.ensureNamespace();
  this.source.push(this.indent + "  var " + el + " = dom.createElement(" + quoting.string(tagName) + ");\n");
  if (svgHTMLIntegrationPoints[tagName]) {
    this.pushNamespaceFrame({ namespace: null, depth: this.depth });
  }
};

FragmentJavaScriptCompiler.prototype.createText = function (str) {
  var el = "el" + ++this.depth;
  this.source.push(this.indent + "  var " + el + " = dom.createTextNode(" + quoting.string(str) + ");\n");
};

FragmentJavaScriptCompiler.prototype.createComment = function (str) {
  var el = "el" + ++this.depth;
  this.source.push(this.indent + "  var " + el + " = dom.createComment(" + quoting.string(str) + ");\n");
};

FragmentJavaScriptCompiler.prototype.returnNode = function () {
  var el = "el" + this.depth;
  this.source.push(this.indent + "  return " + el + ";\n");
};

FragmentJavaScriptCompiler.prototype.setAttribute = function (name, value, namespace) {
  var el = "el" + this.depth;
  if (namespace) {
    this.source.push(this.indent + "  dom.setAttributeNS(" + el + "," + quoting.string(namespace) + "," + quoting.string(name) + "," + quoting.string(value) + ");\n");
  } else {
    this.source.push(this.indent + "  dom.setAttribute(" + el + "," + quoting.string(name) + "," + quoting.string(value) + ");\n");
  }
};

FragmentJavaScriptCompiler.prototype.appendChild = function () {
  if (this.depth === this.getCurrentNamespaceFrame().depth) {
    this.popNamespaceFrame();
  }
  var child = "el" + this.depth--;
  var el = "el" + this.depth;
  this.source.push(this.indent + "  dom.appendChild(" + el + ", " + child + ");\n");
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
    this.source.push(this.indent + "  dom.setNamespace(" + (correctNamespace ? quoting.string(correctNamespace) : "null") + ");\n");
    this.domNamespace = correctNamespace;
  }
};
},{"../htmlbars-util/quoting":57,"./utils":29}],24:[function(require,module,exports){
'use strict';

var TemplateVisitor = require('./template-visitor');
var utils = require('./utils');
var htmlbars_util = require('../htmlbars-util');
var array_utils = require('../htmlbars-util/array-utils');

function FragmentOpcodeCompiler() {
  this.opcodes = [];
}

exports['default'] = FragmentOpcodeCompiler;

FragmentOpcodeCompiler.prototype.compile = function (ast) {
  var templateVisitor = new TemplateVisitor['default']();
  templateVisitor.visit(ast);

  utils.processOpcodes(this, templateVisitor.actions);

  return this.opcodes;
};

FragmentOpcodeCompiler.prototype.opcode = function (type, params) {
  this.opcodes.push([type, params]);
};

FragmentOpcodeCompiler.prototype.text = function (text) {
  this.opcode("createText", [text.chars]);
  this.opcode("appendChild");
};

FragmentOpcodeCompiler.prototype.comment = function (comment) {
  this.opcode("createComment", [comment.value]);
  this.opcode("appendChild");
};

FragmentOpcodeCompiler.prototype.openElement = function (element) {
  this.opcode("createElement", [element.tag]);
  array_utils.forEach(element.attributes, this.attribute, this);
};

FragmentOpcodeCompiler.prototype.closeElement = function () {
  this.opcode("appendChild");
};

FragmentOpcodeCompiler.prototype.startProgram = function () {
  this.opcodes.length = 0;
  this.opcode("createFragment");
};

FragmentOpcodeCompiler.prototype.endProgram = function () {
  this.opcode("returnNode");
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
  this.opcode("createComment", [""]);
  this.opcode("appendChild");
};

FragmentOpcodeCompiler.prototype.attribute = function (attr) {
  if (attr.value.type === "TextNode") {
    var namespace = htmlbars_util.getAttrNamespace(attr.name);
    this.opcode("setAttribute", [attr.name, attr.value.chars, namespace]);
  }
};

FragmentOpcodeCompiler.prototype.setNamespace = function (namespace) {
  this.opcode("setNamespace", [namespace]);
};
},{"../htmlbars-util":50,"../htmlbars-util/array-utils":51,"./template-visitor":28,"./utils":29}],25:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var quoting = require('../htmlbars-util/quoting');

function HydrationJavaScriptCompiler() {
  this.stack = [];
  this.source = [];
  this.mustaches = [];
  this.parents = [["fragment"]];
  this.parentCount = 0;
  this.morphs = [];
  this.fragmentProcessing = [];
  this.hooks = undefined;
}

exports['default'] = HydrationJavaScriptCompiler;

var prototype = HydrationJavaScriptCompiler.prototype;

prototype.compile = function (opcodes, options) {
  this.stack.length = 0;
  this.mustaches.length = 0;
  this.source.length = 0;
  this.parents.length = 1;
  this.parents[0] = ["fragment"];
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

  utils.processOpcodes(this, opcodes);

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
    createMorphsProgram: "",
    hydrateMorphsProgram: "",
    fragmentProcessingProgram: "",
    statements: this.statements,
    locals: this.locals,
    hasMorphs: false
  };

  result.hydrateMorphsProgram = this.source.join("");

  if (this.morphs.length) {
    result.hasMorphs = true;
    morphs = indent + "  var morphs = new Array(" + this.morphs.length + ");\n";

    for (i = 0, l = this.morphs.length; i < l; ++i) {
      var morph = this.morphs[i];
      morphs += indent + "  morphs[" + i + "] = " + morph + ";\n";
    }
  }

  if (this.fragmentProcessing.length) {
    var processing = "";
    for (i = 0, l = this.fragmentProcessing.length; i < l; ++i) {
      processing += this.indent + "  " + this.fragmentProcessing[i] + "\n";
    }
    result.fragmentProcessingProgram = processing;
  }

  var createMorphsProgram;
  if (result.hasMorphs) {
    createMorphsProgram = "function buildRenderNodes(dom, fragment, contextualElement) {\n" + result.fragmentProcessingProgram + morphs;

    if (this.hasOpenBoundary) {
      createMorphsProgram += indent + "  dom.insertBoundary(fragment, 0);\n";
    }

    if (this.hasCloseBoundary) {
      createMorphsProgram += indent + "  dom.insertBoundary(fragment, null);\n";
    }

    createMorphsProgram += indent + "  return morphs;\n" + indent + "}";
  } else {
    createMorphsProgram = "function buildRenderNodes() { return []; }";
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

prototype.pushGetHook = function (path) {
  this.expressionStack.push(["get", path]);
};

prototype.pushSexprHook = function () {
  this.expressionStack.push(["subexpr", this.expressionStack.pop(), this.expressionStack.pop(), this.expressionStack.pop()]);
};

prototype.pushConcatHook = function () {
  this.expressionStack.push(["concat", this.expressionStack.pop()]);
};

prototype.printSetHook = function (name) {
  this.locals.push(name);
};

prototype.printBlockHook = function (templateId, inverseId) {
  this.statements.push(["block", this.expressionStack.pop(), // path
  this.expressionStack.pop(), // params
  this.expressionStack.pop(), // hash
  templateId, inverseId]);
};

prototype.printInlineHook = function () {
  var path = this.expressionStack.pop();
  var params = this.expressionStack.pop();
  var hash = this.expressionStack.pop();

  this.statements.push(["inline", path, params, hash]);
};

prototype.printContentHook = function () {
  this.statements.push(["content", this.expressionStack.pop()]);
};

prototype.printComponentHook = function (templateId) {
  this.statements.push(["component", this.expressionStack.pop(), // path
  this.expressionStack.pop(), // attrs
  templateId]);
};

prototype.printAttributeHook = function () {
  this.statements.push(["attribute", this.expressionStack.pop(), // name
  this.expressionStack.pop() // value;
  ]);
};

prototype.printElementHook = function () {
  this.statements.push(["element", this.expressionStack.pop(), // path
  this.expressionStack.pop(), // params
  this.expressionStack.pop() // hash
  ]);
};

prototype.createMorph = function (morphNum, parentPath, startIndex, endIndex, escaped) {
  var isRoot = parentPath.length === 0;
  var parent = this.getParent();

  var morphMethod = escaped ? "createMorphAt" : "createUnsafeMorphAt";
  var morph = "dom." + morphMethod + "(" + parent + "," + (startIndex === null ? "-1" : startIndex) + "," + (endIndex === null ? "-1" : endIndex) + (isRoot ? ",contextualElement)" : ")");

  this.morphs[morphNum] = morph;
};

prototype.createAttrMorph = function (attrMorphNum, elementNum, name, escaped, namespace) {
  var morphMethod = escaped ? "createAttrMorph" : "createUnsafeAttrMorph";
  var morph = "dom." + morphMethod + "(element" + elementNum + ", '" + name + (namespace ? "', '" + namespace : "") + "')";
  this.morphs[attrMorphNum] = morph;
};

prototype.createElementMorph = function (morphNum, elementNum) {
  var morphMethod = "createElementMorph";
  var morph = "dom." + morphMethod + "(element" + elementNum + ")";
  this.morphs[morphNum] = morph;
};

prototype.repairClonedNode = function (blankChildTextNodes, isElementChecked) {
  var parent = this.getParent(),
      processing = "if (this.cachedFragment) { dom.repairClonedNode(" + parent + "," + quoting.array(blankChildTextNodes) + (isElementChecked ? ",true" : "") + "); }";
  this.fragmentProcessing.push(processing);
};

prototype.shareElement = function (elementNum) {
  var elementNodesName = "element" + elementNum;
  this.fragmentProcessing.push("var " + elementNodesName + " = " + this.getParent() + ";");
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

  return "dom.childAt(" + frag + ", [" + last.join(", ") + "])";
};

prototype.lastParent = function () {
  return this.parents[this.parents.length - 1];
};
},{"../htmlbars-util/quoting":57,"./utils":29}],26:[function(require,module,exports){
'use strict';

var TemplateVisitor = require('./template-visitor');
var utils = require('./utils');
var htmlbars_util = require('../htmlbars-util');
var array_utils = require('../htmlbars-util/array-utils');
var htmlbars_syntax__utils = require('../htmlbars-syntax/utils');

function detectIsElementChecked(element) {
  for (var i = 0, len = element.attributes.length; i < len; i++) {
    if (element.attributes[i].name === "checked") {
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

exports['default'] = HydrationOpcodeCompiler;

HydrationOpcodeCompiler.prototype.compile = function (ast) {
  var templateVisitor = new TemplateVisitor['default']();
  templateVisitor.visit(ast);

  utils.processOpcodes(this, templateVisitor.actions);

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
    this.opcode("printSetHook", blockParams[i], i);
  }

  if (blankChildTextNodes.length > 0) {
    this.opcode("repairClonedNode", blankChildTextNodes);
  }
};

HydrationOpcodeCompiler.prototype.insertBoundary = function (first) {
  this.opcode(first ? "openBoundary" : "closeBoundary");
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

  this.opcode("consumeParent", this.currentDOMChildIndex);

  // If our parent reference will be used more than once, cache its reference.
  if (mustacheCount > 1) {
    shareElement(this);
  }

  var isElementChecked = detectIsElementChecked(element);
  if (blankChildTextNodes.length > 0 || isElementChecked) {
    this.opcode("repairClonedNode", blankChildTextNodes, isElementChecked);
  }

  this.paths.push(this.currentDOMChildIndex);
  this.currentDOMChildIndex = -1;

  array_utils.forEach(element.attributes, this.attribute, this);
  array_utils.forEach(element.modifiers, this.elementModifier, this);
};

HydrationOpcodeCompiler.prototype.closeElement = function () {
  distributeMorphs(this.morphs, this.opcodes);
  this.opcode("popParent");
  this.currentDOMChildIndex = this.paths.pop();
};

HydrationOpcodeCompiler.prototype.mustache = function (mustache, childIndex, childCount) {
  this.pushMorphPlaceholderNode(childIndex, childCount);

  var opcode;

  if (htmlbars_syntax__utils.isHelper(mustache)) {
    prepareHash(this, mustache.hash);
    prepareParams(this, mustache.params);
    preparePath(this, mustache.path);
    opcode = "printInlineHook";
  } else {
    preparePath(this, mustache.path);
    opcode = "printContentHook";
  }

  var morphNum = this.morphNum++;
  var start = this.currentDOMChildIndex;
  var end = this.currentDOMChildIndex;
  this.morphs.push([morphNum, this.paths.slice(), start, end, mustache.escaped]);

  this.opcode(opcode);
};

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

  this.opcode("printBlockHook", templateId, inverseId);
};

HydrationOpcodeCompiler.prototype.component = function (component, childIndex, childCount) {
  this.pushMorphPlaceholderNode(childIndex, childCount);

  var program = component.program || {};
  var blockParams = program.blockParams || [];

  var attrs = component.attributes;
  for (var i = attrs.length - 1; i >= 0; i--) {
    var name = attrs[i].name;
    var value = attrs[i].value;

    // TODO: Introduce context specific AST nodes to avoid switching here.
    if (value.type === "TextNode") {
      this.opcode("pushLiteral", value.chars);
    } else if (value.type === "MustacheStatement") {
      this.accept(htmlbars_syntax__utils.unwrapMustache(value));
    } else if (value.type === "ConcatStatement") {
      prepareParams(this, value.parts);
      this.opcode("pushConcatHook", this.morphNum);
    }

    this.opcode("pushLiteral", name);
  }

  var morphNum = this.morphNum++;
  var start = this.currentDOMChildIndex;
  var end = this.currentDOMChildIndex;
  this.morphs.push([morphNum, this.paths.slice(), start, end, true]);

  this.opcode("prepareObject", attrs.length);
  this.opcode("pushLiteral", component.tag);
  this.opcode("printComponentHook", this.templateId++, blockParams.length);
};

HydrationOpcodeCompiler.prototype.attribute = function (attr) {
  var value = attr.value;
  var escaped = true;
  var namespace = htmlbars_util.getAttrNamespace(attr.name);

  // TODO: Introduce context specific AST nodes to avoid switching here.
  if (value.type === "TextNode") {
    return;
  } else if (value.type === "MustacheStatement") {
    escaped = value.escaped;
    this.accept(htmlbars_syntax__utils.unwrapMustache(value));
  } else if (value.type === "ConcatStatement") {
    prepareParams(this, value.parts);
    this.opcode("pushConcatHook", this.morphNum);
  }

  this.opcode("pushLiteral", attr.name);

  var attrMorphNum = this.morphNum++;

  if (this.element !== null) {
    shareElement(this);
  }

  this.opcode("createAttrMorph", attrMorphNum, this.elementNum, attr.name, escaped, namespace);
  this.opcode("printAttributeHook");
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
  this.opcode("printElementHook");
};

HydrationOpcodeCompiler.prototype.pushMorphPlaceholderNode = function (childIndex, childCount) {
  if (this.paths.length === 0) {
    if (childIndex === 0) {
      this.opcode("openBoundary");
    }
    if (childIndex === childCount - 1) {
      this.opcode("closeBoundary");
    }
  }
  this.comment();
};

HydrationOpcodeCompiler.prototype.MustacheStatement = function (mustache) {
  prepareHash(this, mustache.hash);
  prepareParams(this, mustache.params);
  preparePath(this, mustache.path);
  this.opcode("pushSexprHook");
};

HydrationOpcodeCompiler.prototype.SubExpression = function (sexpr) {
  prepareHash(this, sexpr.hash);
  prepareParams(this, sexpr.params);
  preparePath(this, sexpr.path);
  this.opcode("pushSexprHook");
};

HydrationOpcodeCompiler.prototype.PathExpression = function (path) {
  this.opcode("pushGetHook", path.original);
};

HydrationOpcodeCompiler.prototype.StringLiteral = function (node) {
  this.opcode("pushLiteral", node.value);
};

HydrationOpcodeCompiler.prototype.BooleanLiteral = function (node) {
  this.opcode("pushLiteral", node.value);
};

HydrationOpcodeCompiler.prototype.NumberLiteral = function (node) {
  this.opcode("pushLiteral", node.value);
};

HydrationOpcodeCompiler.prototype.UndefinedLiteral = function (node) {
  this.opcode("pushLiteral", node.value);
};

HydrationOpcodeCompiler.prototype.NullLiteral = function (node) {
  this.opcode("pushLiteral", node.value);
};

function preparePath(compiler, path) {
  compiler.opcode("pushLiteral", path.original);
}

function prepareParams(compiler, params) {
  for (var i = params.length - 1; i >= 0; i--) {
    var param = params[i];
    compiler[param.type](param);
  }

  compiler.opcode("prepareArray", params.length);
}

function prepareHash(compiler, hash) {
  var pairs = hash.pairs;

  for (var i = pairs.length - 1; i >= 0; i--) {
    var key = pairs[i].key;
    var value = pairs[i].value;

    compiler[value.type](value);
    compiler.opcode("pushLiteral", key);
  }

  compiler.opcode("prepareObject", pairs.length);
}

function shareElement(compiler) {
  compiler.opcode("shareElement", ++compiler.elementNum);
  compiler.element = null; // Set element to null so we don't cache it twice
}

function publishElementMorph(compiler) {
  var morphNum = compiler.morphNum++;
  compiler.opcode("createElementMorph", morphNum, compiler.elementNum);
}

function distributeMorphs(morphs, opcodes) {
  if (morphs.length === 0) {
    return;
  }

  // Splice morphs after the most recent shareParent/consumeParent.
  var o;
  for (o = opcodes.length - 1; o >= 0; --o) {
    var opcode = opcodes[o][0];
    if (opcode === "shareElement" || opcode === "consumeParent" || opcode === "popParent") {
      break;
    }
  }

  var spliceArgs = [o + 1, 0];
  for (var i = 0; i < morphs.length; ++i) {
    spliceArgs.push(["createMorph", morphs[i].slice()]);
  }
  opcodes.splice.apply(opcodes, spliceArgs);
  morphs.length = 0;
}
},{"../htmlbars-syntax/utils":48,"../htmlbars-util":50,"../htmlbars-util/array-utils":51,"./template-visitor":28,"./utils":29}],27:[function(require,module,exports){
'use strict';

var FragmentOpcodeCompiler = require('./fragment-opcode-compiler');
var FragmentJavaScriptCompiler = require('./fragment-javascript-compiler');
var HydrationOpcodeCompiler = require('./hydration-opcode-compiler');
var HydrationJavaScriptCompiler = require('./hydration-javascript-compiler');
var TemplateVisitor = require('./template-visitor');
var utils = require('./utils');
var quoting = require('../htmlbars-util/quoting');
var array_utils = require('../htmlbars-util/array-utils');

function TemplateCompiler(options) {
  this.options = options || {};
  this.consumerBuildMeta = this.options.buildMeta || function () {};
  this.fragmentOpcodeCompiler = new FragmentOpcodeCompiler['default']();
  this.fragmentCompiler = new FragmentJavaScriptCompiler['default']();
  this.hydrationOpcodeCompiler = new HydrationOpcodeCompiler['default']();
  this.hydrationCompiler = new HydrationJavaScriptCompiler['default']();
  this.templates = [];
  this.childTemplates = [];
}

exports['default'] = TemplateCompiler;

var dynamicNodes = {
  mustache: true,
  block: true,
  component: true
};

TemplateCompiler.prototype.compile = function (ast) {
  var templateVisitor = new TemplateVisitor['default']();
  templateVisitor.visit(ast);

  var normalizedActions = [];
  var actions = templateVisitor.actions;

  for (var i = 0, l = actions.length - 1; i < l; i++) {
    var action = actions[i];
    var nextAction = actions[i + 1];

    normalizedActions.push(action);

    if (action[0] === 'startProgram' && nextAction[0] in dynamicNodes) {
      normalizedActions.push(['insertBoundary', [true]]);
    }

    if (nextAction[0] === 'endProgram' && action[0] in dynamicNodes) {
      normalizedActions.push(['insertBoundary', [false]]);
    }
  }

  normalizedActions.push(actions[actions.length - 1]);

  utils.processOpcodes(this, normalizedActions);

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

  var indent = quoting.repeat('  ', programDepth);
  var options = {
    indent: indent + '    '
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

  var statements = array_utils.map(hydrationPrograms.statements, function (s) {
    return indent + '      ' + JSON.stringify(s);
  }).join(',\n');

  var locals = JSON.stringify(hydrationPrograms.locals);

  var templates = array_utils.map(this.childTemplates, function (_, index) {
    return 'child' + index;
  }).join(', ');

  var template = '(function() {\n' + this.getChildTemplateVars(indent + '  ') + indent + '  return {\n' + this.buildMeta(indent + '    ', program) + indent + '    arity: ' + blockParams.length + ',\n' + indent + '    cachedFragment: null,\n' + indent + '    hasRendered: false,\n' + indent + '    buildFragment: ' + fragmentProgram + ',\n' + indent + '    buildRenderNodes: ' + hydrationPrograms.createMorphsProgram + ',\n' + indent + '    statements: [\n' + statements + '\n' + indent + '    ],\n' + indent + '    locals: ' + locals + ',\n' + indent + '    templates: [' + templates + ']\n' + indent + '  };\n' + indent + '}())';

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
},{"../htmlbars-util/array-utils":51,"../htmlbars-util/quoting":57,"./fragment-javascript-compiler":23,"./fragment-opcode-compiler":24,"./hydration-javascript-compiler":25,"./hydration-opcode-compiler":26,"./template-visitor":28,"./utils":29}],28:[function(require,module,exports){
'use strict';

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

exports['default'] = TemplateVisitor;

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
},{}],29:[function(require,module,exports){
'use strict';

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
},{}],30:[function(require,module,exports){
'use strict';

var object_utils = require('../htmlbars-util/object-utils');
var morph_utils = require('../htmlbars-util/morph-utils');

var base = {
  acceptExpression: function (node, env, scope) {
    var ret = { value: null };

    // Primitive literals are unambiguously non-array representations of
    // themselves.
    if (typeof node !== "object" || node === null) {
      ret.value = node;
      return ret;
    }

    switch (node[0]) {
      // can be used by manualElement
      case "value":
        ret.value = node[1];break;
      case "get":
        ret.value = this.get(node, env, scope);break;
      case "subexpr":
        ret.value = this.subexpr(node, env, scope);break;
      case "concat":
        ret.value = this.concat(node, env, scope);break;
    }

    return ret;
  },

  acceptParams: function (nodes, env, scope) {
    var arr = new Array(nodes.length);

    for (var i = 0, l = nodes.length; i < l; i++) {
      arr[i] = this.acceptExpression(nodes[i], env, scope).value;
    }

    return arr;
  },

  acceptHash: function (pairs, env, scope) {
    var object = {};

    for (var i = 0, l = pairs.length; i < l; i += 2) {
      object[pairs[i]] = this.acceptExpression(pairs[i + 1], env, scope).value;
    }

    return object;
  },

  // [ 'get', path ]
  get: function (node, env, scope) {
    return env.hooks.get(env, scope, node[1]);
  },

  // [ 'subexpr', path, params, hash ]
  subexpr: function (node, env, scope) {
    var path = node[1],
        params = node[2],
        hash = node[3];
    return env.hooks.subexpr(env, scope, path, this.acceptParams(params, env, scope), this.acceptHash(hash, env, scope));
  },

  // [ 'concat', parts ]
  concat: function (node, env, scope) {
    return env.hooks.concat(env, this.acceptParams(node[1], env, scope));
  },

  linkParamsAndHash: function (env, scope, morph, path, params, hash) {
    if (morph.linkedParams) {
      params = morph.linkedParams.params;
      hash = morph.linkedParams.hash;
    } else {
      params = params && this.acceptParams(params, env, scope);
      hash = hash && this.acceptHash(hash, env, scope);
    }

    morph_utils.linkParams(env, scope, morph, path, params, hash);
    return [params, hash];
  }
};

var AlwaysDirtyVisitor = object_utils.merge(object_utils.createObject(base), {
  // [ 'block', path, params, hash, templateId, inverseId ]
  block: function (node, morph, env, scope, template, visitor) {
    var path = node[1],
        params = node[2],
        hash = node[3],
        templateId = node[4],
        inverseId = node[5];
    var paramsAndHash = this.linkParamsAndHash(env, scope, morph, path, params, hash);

    morph.isDirty = morph.isSubtreeDirty = false;
    env.hooks.block(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], templateId === null ? null : template.templates[templateId], inverseId === null ? null : template.templates[inverseId], visitor);
  },

  // [ 'inline', path, params, hash ]
  inline: function (node, morph, env, scope, visitor) {
    var path = node[1],
        params = node[2],
        hash = node[3];
    var paramsAndHash = this.linkParamsAndHash(env, scope, morph, path, params, hash);

    morph.isDirty = morph.isSubtreeDirty = false;
    env.hooks.inline(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], visitor);
  },

  // [ 'content', path ]
  content: function (node, morph, env, scope, visitor) {
    var path = node[1];

    morph.isDirty = morph.isSubtreeDirty = false;

    if (isHelper(env, scope, path)) {
      env.hooks.inline(morph, env, scope, path, [], {}, visitor);
      if (morph.linkedResult) {
        morph_utils.linkParams(env, scope, morph, "@content-helper", [morph.linkedResult], null);
      }
      return;
    }

    var params;
    if (morph.linkedParams) {
      params = morph.linkedParams.params;
    } else {
      params = [env.hooks.get(env, scope, path)];
    }

    morph_utils.linkParams(env, scope, morph, "@range", params, null);
    env.hooks.range(morph, env, scope, path, params[0], visitor);
  },

  // [ 'element', path, params, hash ]
  element: function (node, morph, env, scope, visitor) {
    var path = node[1],
        params = node[2],
        hash = node[3];
    var paramsAndHash = this.linkParamsAndHash(env, scope, morph, path, params, hash);

    morph.isDirty = morph.isSubtreeDirty = false;
    env.hooks.element(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], visitor);
  },

  // [ 'attribute', name, value ]
  attribute: function (node, morph, env, scope) {
    var name = node[1],
        value = node[2];
    var paramsAndHash = this.linkParamsAndHash(env, scope, morph, "@attribute", [value], null);

    morph.isDirty = morph.isSubtreeDirty = false;
    env.hooks.attribute(morph, env, scope, name, paramsAndHash[0][0]);
  },

  // [ 'component', path, attrs, templateId, inverseId ]
  component: function (node, morph, env, scope, template, visitor) {
    var path = node[1],
        attrs = node[2],
        templateId = node[3],
        inverseId = node[4];
    var paramsAndHash = this.linkParamsAndHash(env, scope, morph, path, [], attrs);
    var templates = {
      default: template.templates[templateId],
      inverse: template.templates[inverseId]
    };

    morph.isDirty = morph.isSubtreeDirty = false;
    env.hooks.component(morph, env, scope, path, paramsAndHash[0], paramsAndHash[1], templates, visitor);
  },

  // [ 'attributes', template ]
  attributes: function (node, morph, env, scope, parentMorph, visitor) {
    var template = node[1];
    env.hooks.attributes(morph, env, scope, template, parentMorph, visitor);
  }
});

exports['default'] = object_utils.merge(object_utils.createObject(base), {
  // [ 'block', path, params, hash, templateId, inverseId ]
  block: function (node, morph, env, scope, template, visitor) {
    dirtyCheck(env, morph, visitor, function (visitor) {
      AlwaysDirtyVisitor.block(node, morph, env, scope, template, visitor);
    });
  },

  // [ 'inline', path, params, hash ]
  inline: function (node, morph, env, scope, visitor) {
    dirtyCheck(env, morph, visitor, function (visitor) {
      AlwaysDirtyVisitor.inline(node, morph, env, scope, visitor);
    });
  },

  // [ 'content', path ]
  content: function (node, morph, env, scope, visitor) {
    dirtyCheck(env, morph, visitor, function (visitor) {
      AlwaysDirtyVisitor.content(node, morph, env, scope, visitor);
    });
  },

  // [ 'element', path, params, hash ]
  element: function (node, morph, env, scope, template, visitor) {
    dirtyCheck(env, morph, visitor, function (visitor) {
      AlwaysDirtyVisitor.element(node, morph, env, scope, template, visitor);
    });
  },

  // [ 'attribute', name, value ]
  attribute: function (node, morph, env, scope, template) {
    dirtyCheck(env, morph, null, function () {
      AlwaysDirtyVisitor.attribute(node, morph, env, scope, template);
    });
  },

  // [ 'component', path, attrs, templateId ]
  component: function (node, morph, env, scope, template, visitor) {
    dirtyCheck(env, morph, visitor, function (visitor) {
      AlwaysDirtyVisitor.component(node, morph, env, scope, template, visitor);
    });
  },

  // [ 'attributes', template ]
  attributes: function (node, morph, env, scope, parentMorph, visitor) {
    AlwaysDirtyVisitor.attributes(node, morph, env, scope, parentMorph, visitor);
  }
});

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
      env = morph.buildChildEnv(morph.state, env);
    }
    morph_utils.validateChildMorphs(env, morph, visitor);
  }
}

function isHelper(env, scope, path) {
  return env.hooks.keywords[path] !== undefined || env.hooks.hasHelper(env, scope, path);
}

exports.AlwaysDirtyVisitor = AlwaysDirtyVisitor;
},{"../htmlbars-util/morph-utils":54,"../htmlbars-util/object-utils":56}],31:[function(require,module,exports){
'use strict';

exports.wrap = wrap;
exports.wrapForHelper = wrapForHelper;
exports.hostYieldWithShadowTemplate = hostYieldWithShadowTemplate;
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
exports.getChild = getChild;
exports.getValue = getValue;
exports.getCellOrValue = getCellOrValue;
exports.component = component;
exports.concat = concat;
exports.hasHelper = hasHelper;
exports.lookupHelper = lookupHelper;
exports.bindScope = bindScope;
exports.updateScope = updateScope;

var render = require('./render');
var MorphList = require('../morph-range/morph-list');
var object_utils = require('../htmlbars-util/object-utils');
var morph_utils = require('../htmlbars-util/morph-utils');
var template_utils = require('../htmlbars-util/template-utils');



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

      options = options || {};
      options.self = self;
      options.blockArguments = blockArguments;

      return render['default'](template, env, scope, options);
    }
  };
}

function wrapForHelper(template, env, scope, morph, renderState, visitor) {
  if (!template) {
    return {
      yieldIn: yieldInShadowTemplate(null, env, scope, morph, renderState, visitor)
    };
  }

  var yieldArgs = yieldTemplate(template, env, scope, morph, renderState, visitor);

  return {
    meta: template.meta,
    arity: template.arity,
    yield: yieldArgs,
    yieldItem: yieldItem(template, env, scope, morph, renderState, visitor),
    yieldIn: yieldInShadowTemplate(template, env, scope, morph, renderState, visitor),
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
      template_utils.clearMorphList(morph.morphList, morph, env);
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
    render['default'](template, env, scope, { renderNode: morph, self: self, blockArguments: blockArguments });
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

  return function (key, blockArguments, self) {
    if (typeof key !== "string") {
      throw new Error("You must provide a string key when calling `yieldItem`; you provided " + key);
    }

    // At least one item has been yielded, so we do not wholesale
    // clear the last MorphList but instead apply a prune operation.
    renderState.morphListToClear = null;
    morph.lastYielded = null;

    var morphList, morphMap;

    if (!morph.morphList) {
      morph.morphList = new MorphList['default']();
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
      var childMorph = render.createChildMorph(env.dom, morph);
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

function yieldInShadowTemplate(template, env, parentScope, morph, renderState, visitor) {
  var hostYield = hostYieldWithShadowTemplate(template, env, parentScope, morph, renderState, visitor);

  return function (shadowTemplate, self) {
    hostYield(shadowTemplate, env, self, []);
  };
}
function hostYieldWithShadowTemplate(template, env, parentScope, morph, renderState, visitor) {
  return function (shadowTemplate, env, self, blockArguments) {
    renderState.morphToClear = null;

    if (morph.lastYielded && isStableShadowRoot(template, shadowTemplate, morph.lastYielded)) {
      return morph.lastResult.revalidateWith(env, undefined, self, blockArguments, visitor);
    }

    var shadowScope = env.hooks.createFreshScope();
    env.hooks.bindShadowScope(env, parentScope, shadowScope, renderState.shadowOptions);
    blockToYield.arity = template.arity;
    env.hooks.bindBlock(env, shadowScope, blockToYield);

    morph.lastYielded = { self: self, template: template, shadowTemplate: shadowTemplate };

    // Render the shadow template with the block available
    render['default'](shadowTemplate.raw, env, shadowScope, { renderNode: morph, self: self, blockArguments: blockArguments });
  };

  function blockToYield(env, blockArguments, self, renderNode, shadowParent, visitor) {
    if (renderNode.lastResult) {
      renderNode.lastResult.revalidateWith(env, undefined, undefined, blockArguments, visitor);
    } else {
      var scope = parentScope;

      // Since a yielded template shares a `self` with its original context,
      // we only need to create a new scope if the template has block parameters
      if (template.arity) {
        scope = env.hooks.createChildScope(parentScope);
      }

      render['default'](template, env, scope, { renderNode: renderNode, self: self, blockArguments: blockArguments });
    }
  }
}

function isStableShadowRoot(template, shadowTemplate, lastYielded) {
  return template === lastYielded.template && shadowTemplate === lastYielded.shadowTemplate;
}

function optionsFor(template, inverse, env, scope, morph, visitor) {
  // If there was a template yielded last time, set morphToClear so it will be cleared
  // if no template is yielded on this render.
  var morphToClear = morph.lastResult ? morph : null;
  var renderState = new template_utils.RenderState(morphToClear, morph.morphList || null);

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
    yield: options.template.yield,
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
  var scope = object_utils.createObject(parent);
  scope.locals = object_utils.createObject(parent.locals);
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
  var name = arguments[3] === undefined ? "default" : arguments[3];

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
  template_utils.renderAndCleanup(morph, env, options, shadowOptions, callback);
}

function handleRedirect(morph, env, scope, path, params, hash, template, inverse, visitor) {
  if (!path) {
    return false;
  }

  var redirect = env.hooks.classify(env, scope, path);
  if (redirect) {
    switch (redirect) {
      case "component":
        env.hooks.component(morph, env, scope, path, params, hash, { default: template, inverse: inverse }, visitor);break;
      case "inline":
        env.hooks.inline(morph, env, scope, path, params, hash, visitor);break;
      case "block":
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

  if (typeof keyword === "function") {
    return keyword(morph, env, scope, params, hash, template, inverse, visitor);
  }

  if (keyword.willRender) {
    keyword.willRender(morph, env);
  }

  var lastState, newState;
  if (keyword.setupState) {
    lastState = object_utils.shallowCopy(morph.state);
    newState = morph.state = keyword.setupState(lastState, env, scope, params, hash);
  }

  if (keyword.childEnv) {
    // Build the child environment...
    env = keyword.childEnv(morph.state, env);

    // ..then save off the child env builder on the render node. If the render
    // node tree is re-rendered and this node is not dirty, the child env
    // builder will still be invoked so that child dirty render nodes still get
    // the correct child env.
    morph.buildChildEnv = keyword.childEnv;
  }

  var firstTime = !morph.rendered;

  if (keyword.isEmpty) {
    var isEmpty = keyword.isEmpty(morph.state, env, scope, params, hash);

    if (isEmpty) {
      if (!firstTime) {
        template_utils.clearMorph(morph, env, false);
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
    morph_utils.validateChildMorphs(env, morph, visitor);
    return true;
  } else {
    template_utils.clearMorph(morph, env, false);
  }

  // If the node is unstable, re-render from scratch
  if (keyword.render) {
    keyword.render(morph, env, scope, params, hash, template, inverse, visitor);
    morph.rendered = true;
    return true;
  }
}

function stableState(oldState, newState) {
  if (object_utils.keyLength(oldState) !== object_utils.keyLength(newState)) {
    return false;
  }

  for (var prop in oldState) {
    if (oldState[prop] !== newState[prop]) {
      return false;
    }
  }

  return true;
}
function linkRenderNode() {
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
      morph_utils.linkParams(env, scope, morph, "@content-helper", [morph.linkedResult], null);
    }

    if (result && "value" in result) {
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
function classify() {
  return null;
}

var keywords = {
  partial: function (morph, env, scope, params) {
    var value = env.hooks.partial(morph, env, scope, params[0]);
    morph.setContent(value);
    return true;
  },

  yield: function (morph, env, scope, params, hash, template, inverse, visitor) {
    // the current scope is provided purely for the creation of shadow
    // scopes; it should not be provided to user code.

    var to = env.hooks.getValue(hash.to) || "default";
    if (scope.blocks[to]) {
      scope.blocks[to](env, params, hash.self, morph, scope, visitor);
    }
    return true;
  },

  hasBlock: function (morph, env, scope, params) {
    var name = env.hooks.getValue(params[0]) || "default";
    return !!scope.blocks[name];
  },

  hasBlockParams: function (morph, env, scope, params) {
    var name = env.hooks.getValue(params[0]) || "default";
    return !!(scope.blocks[name] && scope.blocks[name].arity);
  }

};

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
  if (handleRedirect(morph, env, scope, path, [value], {}, null, null, visitor)) {
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
  if (result && "value" in result) {
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
  if (path === "") {
    return scope.self;
  }

  var keys = path.split(".");
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
  var fragment = render['default'](template, env, scope, {}).fragment;
  element.appendChild(fragment);
  morph.setNode(element);
}
function hasHelper(env, scope, helperName) {
  return env.helpers[helperName] !== undefined;
}

function lookupHelper(env, scope, helperName) {
  return env.helpers[helperName];
}

function bindScope() {}

function updateScope(env, scope) {
  env.hooks.bindScope(env, scope);
}

exports['default'] = {
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
/* morph, env, scope, params, hash */ /* env, scope, path */ /* env, scope */
// this function is used to handle host-specified extensions to scope
// other than `self`, `locals` and `block`.

exports.keywords = keywords;
},{"../htmlbars-util/morph-utils":54,"../htmlbars-util/object-utils":56,"../htmlbars-util/template-utils":59,"../morph-range/morph-list":64,"./render":33}],32:[function(require,module,exports){
'use strict';

var MorphBase = require('../morph-range');
var object_utils = require('../htmlbars-util/object-utils');

var guid = 1;

function HTMLBarsMorph(domHelper, contextualElement) {
  this.super$constructor(domHelper, contextualElement);

  this.state = {};
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

var prototype = HTMLBarsMorph.prototype = object_utils.createObject(MorphBase['default'].prototype);
prototype.constructor = HTMLBarsMorph;
prototype.super$constructor = MorphBase['default'];

exports['default'] = HTMLBarsMorph;
},{"../htmlbars-util/object-utils":56,"../morph-range":63}],33:[function(require,module,exports){
'use strict';

exports.manualElement = manualElement;
exports.attachAttributes = attachAttributes;
exports.createChildMorph = createChildMorph;
exports.getCachedFragment = getCachedFragment;

var array_utils = require('../htmlbars-util/array-utils');
var morph_utils = require('../htmlbars-util/morph-utils');
var ExpressionVisitor = require('./expression-visitor');
var Morph = require('./morph');
var template_utils = require('../htmlbars-util/template-utils');
var voidMap = require('../htmlbars-util/void-tag-names');



exports['default'] = render;

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

function RenderResult(env, scope, options, rootNode, ownerNode, nodes, fragment, template, shouldSetContent) {
  this.root = rootNode;
  this.fragment = fragment;

  this.nodes = nodes;
  this.template = template;
  this.statements = template.statements.slice();
  this.env = env;
  this.scope = scope;
  this.shouldSetContent = shouldSetContent;

  this.bindScope();

  if (options.attributes !== undefined) {
    nodes.push({ state: {} });
    this.statements.push(["attributes", attachAttributes(options.attributes)]);
  }

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
    initializeNode(rootNode, ownerNode);
    shouldSetContent = false;
  }

  if (rootNode.childNodes) {
    morph_utils.visitChildren(rootNode.childNodes, function (node) {
      template_utils.clearMorph(node, env, true);
    });
  }

  rootNode.childNodes = nodes;
  return new RenderResult(env, scope, options, rootNode, ownerNode, nodes, fragment, template, shouldSetContent);
};
function manualElement(tagName, attributes) {
  var statements = [];

  for (var key in attributes) {
    if (typeof attributes[key] === "string") {
      continue;
    }
    statements.push(["attribute", key, attributes[key]]);
  }

  statements.push(["content", "yield"]);

  var template = {
    arity: 0,
    cachedFragment: null,
    hasRendered: false,
    buildFragment: function buildFragment(dom) {
      var el0 = dom.createDocumentFragment();
      if (tagName === "svg") {
        dom.setNamespace(svgNamespace);
      }
      var el1 = dom.createElement(tagName);

      for (var key in attributes) {
        if (typeof attributes[key] !== "string") {
          continue;
        }
        dom.setAttribute(el1, key, attributes[key]);
      }

      if (!voidMap['default'][tagName]) {
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
        if (typeof attributes[key] === "string") {
          continue;
        }
        morphs.push(dom.createAttrMorph(element, key));
      }

      morphs.push(dom.createMorphAt(element, 0, 0));
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
    if (typeof attributes[key] === "string") {
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
        if (typeof attributes[key] !== "string") {
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
        if (typeof attributes[key] === "string") {
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
  array_utils.forEach(this.root.childNodes, function (node) {
    initializeNode(node, ownerNode);
  });
};

RenderResult.prototype.render = function () {
  this.root.lastResult = this;
  this.root.rendered = true;
  this.populateNodes(ExpressionVisitor.AlwaysDirtyVisitor);

  if (this.shouldSetContent && this.root.setContent) {
    this.root.setContent(this.fragment);
  }
};

RenderResult.prototype.dirty = function () {
  morph_utils.visitChildren([this.root], function (node) {
    node.isDirty = true;
  });
};

RenderResult.prototype.revalidate = function (env, self, blockArguments, scope) {
  this.revalidateWith(env, scope, self, blockArguments, ExpressionVisitor['default']);
};

RenderResult.prototype.rerender = function (env, self, blockArguments, scope) {
  this.revalidateWith(env, scope, self, blockArguments, ExpressionVisitor.AlwaysDirtyVisitor);
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
  template_utils.clearMorph(rootNode, this.env, true);
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
      case "block":
        visitor.block(statement, morph, env, scope, template, visitor);break;
      case "inline":
        visitor.inline(statement, morph, env, scope, visitor);break;
      case "content":
        visitor.content(statement, morph, env, scope, visitor);break;
      case "element":
        visitor.element(statement, morph, env, scope, template, visitor);break;
      case "attribute":
        visitor.attribute(statement, morph, env, scope);break;
      case "component":
        visitor.component(statement, morph, env, scope, template, visitor);break;
      case "attributes":
        visitor.attributes(statement, morph, env, scope, this.fragment, visitor);break;
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
  var morph = Morph['default'].empty(dom, contextualElement || parentMorph.contextualElement);
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
},{"../htmlbars-util/array-utils":51,"../htmlbars-util/morph-utils":54,"../htmlbars-util/template-utils":59,"../htmlbars-util/void-tag-names":60,"./expression-visitor":30,"./morph":32}],34:[function(require,module,exports){
'use strict';

var Walker = require('./htmlbars-syntax/walker');
var builders = require('./htmlbars-syntax/builders');
var parse = require('./htmlbars-syntax/parser');

exports.Walker = Walker['default'];
exports.builders = builders['default'];
exports.parse = parse['default'];
},{"./htmlbars-syntax/builders":35,"./htmlbars-syntax/parser":45,"./htmlbars-syntax/walker":49}],35:[function(require,module,exports){
'use strict';

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

function buildMustache(path, params, hash, raw, loc) {
  return {
    type: "MustacheStatement",
    path: path,
    params: params || [],
    hash: hash || buildHash([]),
    escaped: !raw,
    loc: buildLoc(loc)
  };
}

function buildBlock(path, params, hash, program, inverse, loc) {
  return {
    type: "BlockStatement",
    path: path,
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
    path: path,
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

function buildElement(tag, attributes, modifiers, children) {
  return {
    type: "ElementNode",
    tag: tag,
    attributes: attributes || [],
    modifiers: modifiers || [],
    children: children || []
  };
}

function buildComponent(tag, attributes, program, loc) {
  return {
    type: "ComponentNode",
    tag: tag,
    attributes: attributes,
    program: program,
    loc: buildLoc(loc)
  };
}

function buildAttr(name, value) {
  return {
    type: "AttrNode",
    name: name,
    value: value
  };
}

function buildText(chars) {
  return {
    type: "TextNode",
    chars: chars
  };
}

// Expressions

function buildSexpr(path, params, hash) {
  return {
    type: "SubExpression",
    path: path,
    params: params || [],
    hash: hash || buildHash([])
  };
}

function buildPath(original) {
  return {
    type: "PathExpression",
    original: original,
    parts: original.split(".")
  };
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

function buildPosition(line, column) {
  return {
    line: line,
    column: column
  };
}

function buildLoc(loc) {
  if (loc) {
    return {
      source: loc.source || null,
      start: buildPosition(loc.start.line, loc.start.column),
      end: buildPosition(loc.end.line, loc.end.column)
    };
  } else {
    return null;
  }
}

exports['default'] = {
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
},{}],36:[function(require,module,exports){
'use strict';

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
      return /^\.|this\b/.test(path.original);
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
exports['default'] = AST;
},{}],37:[function(require,module,exports){
'use strict';

exports.parse = parse;

var parser = require('./parser');
var AST = require('./ast');
var WhitespaceControl = require('./whitespace-control');
var Helpers = require('./helpers');
var utils = require('../utils');



var yy = {};
utils.extend(yy, Helpers, AST['default']);
function parse(input, options) {
  // Just return if an already-compiled AST was passed in.
  if (input.type === 'Program') {
    return input;
  }

  parser['default'].yy = yy;

  // Altering the shared object here, but this is ok as parser is a sync operation
  yy.locInfo = function (locInfo) {
    return new yy.SourceLocation(options && options.srcName, locInfo);
  };

  var strip = new WhitespaceControl['default']();
  return strip.accept(parser['default'].parse(input));
}

exports.parser = parser['default'];
},{"../utils":43,"./ast":36,"./helpers":38,"./parser":39,"./whitespace-control":41}],38:[function(require,module,exports){
'use strict';

exports.SourceLocation = SourceLocation;
exports.id = id;
exports.stripFlags = stripFlags;
exports.stripComment = stripComment;
exports.preparePath = preparePath;
exports.prepareMustache = prepareMustache;
exports.prepareRawBlock = prepareRawBlock;
exports.prepareBlock = prepareBlock;

var Exception = require('../exception');



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
        throw new Exception['default']('Invalid path: ' + original, { loc: locInfo });
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

    throw new Exception['default'](openRawBlock.path.original + ' doesn\'t match ' + close, errorNode);
  }

  locInfo = this.locInfo(locInfo);
  var program = new this.Program([content], null, {}, locInfo);

  return new this.BlockStatement(openRawBlock.path, openRawBlock.params, openRawBlock.hash, program, undefined, {}, {}, {}, locInfo);
}

function prepareBlock(openBlock, program, inverseAndProgram, close, inverted, locInfo) {
  // When we are chaining inverse calls, we will not have a close path
  if (close && close.path && openBlock.path.original !== close.path.original) {
    var errorNode = { loc: openBlock.path.loc };

    throw new Exception['default'](openBlock.path.original + ' doesn\'t match ' + close.path.original, errorNode);
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
},{"../exception":42}],39:[function(require,module,exports){
'use strict';

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
                this.yytext = this.matched = this.match = "";
                this.conditionStack = ["INITIAL"];
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
                return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
            },
            upcomingInput: function () {
                var next = this.match;
                if (next.length < 20) {
                    next += this._input.substr(0, 20 - next.length);
                }
                return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
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
                    this.yytext = "";
                    this.match = "";
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
                    return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), { text: "", token: null, line: this.yylineno });
                }
            },
            lex: function lex() {
                var r = this.next();
                if (typeof r !== "undefined") {
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
                    this.begin("raw");
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
                    this.begin("com");

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
                    yy_.yytext = strip(1, 2).replace(/\\"/g, "\"");return 74;
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
                    return "INVALID";
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
})();exports['default'] = handlebars;
},{}],40:[function(require,module,exports){
'use strict';

var Exception = require('../exception');
var AST = require('./ast');

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
      if (value && (!value.type || !AST['default'][value.type])) {
        throw new Exception['default']('Unexpected node type "' + value.type + '" found when accepting ' + name + ' on ' + node.type);
      }
      node[name] = value;
    }
  },

  // Performs an accept operation with added sanity check to ensure
  // required keys are not removed.
  acceptRequired: function (node, name) {
    this.acceptKey(node, name);

    if (!node[name]) {
      throw new Exception['default'](node.type + ' requires ' + name);
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

  ContentStatement: function () {},
  CommentStatement: function () {},

  SubExpression: function (sexpr) {
    this.acceptRequired(sexpr, 'path');
    this.acceptArray(sexpr.params);
    this.acceptKey(sexpr, 'hash');
  },

  PathExpression: function () {},

  StringLiteral: function () {},
  NumberLiteral: function () {},
  BooleanLiteral: function () {},
  UndefinedLiteral: function () {},
  NullLiteral: function () {},

  Hash: function (hash) {
    this.acceptArray(hash.pairs);
  },
  HashPair: function (pair) {
    this.acceptRequired(pair, 'value');
  }
};

exports['default'] = Visitor;
/* content */ /* comment */ /* path */ /* string */ /* number */ /* bool */ /* literal */ /* literal */
},{"../exception":42,"./ast":36}],41:[function(require,module,exports){
'use strict';

var Visitor = require('./visitor');

function WhitespaceControl() {}
WhitespaceControl.prototype = new Visitor['default']();

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

exports['default'] = WhitespaceControl;
},{"./visitor":40}],42:[function(require,module,exports){
'use strict';


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

exports['default'] = Exception;
},{}],43:[function(require,module,exports){
'use strict';

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
  '\'': '&#x27;',
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

var isFunction = function (value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  isFunction = function (value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
var isFunction;
var isArray = Array.isArray || function (value) {
  return value && typeof value === 'object' ? toString.call(value) === '[object Array]' : false;
};

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

exports.toString = toString;
exports.isFunction = isFunction;
exports.isArray = isArray;
},{}],44:[function(require,module,exports){
'use strict';

var b = require('./builders');
var array_utils = require('../htmlbars-util/array-utils');
var utils = require('./utils');

var nodeHandlers = {

  Program: function (program) {
    var body = [];
    var node = b.buildProgram(body, program.blockParams, program.loc);
    var i,
        l = program.body.length;

    this.elementStack.push(node);

    if (l === 0) {
      return this.elementStack.pop();
    }

    for (i = 0; i < l; i++) {
      this.acceptNode(program.body[i]);
    }

    this.acceptToken(this.tokenizer.tokenizeEOF());

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

    if (this.tokenizer.state === "comment") {
      this.tokenizer.addChar("{{" + this.sourceForMustache(block) + "}}");
      return;
    }

    switchToHandlebars(this);
    this.acceptToken(block);

    block = acceptCommonNodes(this, block);
    var program = block.program ? this.acceptNode(block.program) : null;
    var inverse = block.inverse ? this.acceptNode(block.inverse) : null;

    var node = b.buildBlock(block.path, block.params, block.hash, program, inverse, block.loc);
    var parentProgram = this.currentElement();
    utils.appendChild(parentProgram, node);
  },

  MustacheStatement: function (rawMustache) {
    var path = rawMustache.path;
    var params = rawMustache.params;
    var hash = rawMustache.hash;
    var escaped = rawMustache.escaped;
    var loc = rawMustache.loc;

    var mustache = b['default'].mustache(path, params, hash, !escaped, loc);

    if (this.tokenizer.state === "comment") {
      this.tokenizer.addChar("{{" + this.sourceForMustache(mustache) + "}}");
      return;
    }

    acceptCommonNodes(this, mustache);
    switchToHandlebars(this);
    this.acceptToken(mustache);

    return mustache;
  },

  ContentStatement: function (content) {
    var changeLines = 0;
    if (content.rightStripped) {
      changeLines = leadingNewlineDifference(content.original, content.value);
    }

    this.tokenizer.line = this.tokenizer.line + changeLines;

    var tokens = this.tokenizer.tokenizePart(content.value);

    return array_utils.forEach(tokens, this.acceptToken, this);
  },

  CommentStatement: function (comment) {
    return comment;
  },

  PartialStatement: function (partial) {
    utils.appendChild(this.currentElement(), partial);
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

function switchToHandlebars(processor) {
  var token = processor.tokenizer.token;

  if (token && token.type === "Chars") {
    processor.acceptToken(token);
    processor.tokenizer.token = null;
  }
}

function leadingNewlineDifference(original, value) {
  if (value === "") {
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
    node.hash = b.buildHash();
  }

  return node;
}

exports['default'] = nodeHandlers;
},{"../htmlbars-util/array-utils":51,"./builders":35,"./utils":48}],45:[function(require,module,exports){
'use strict';

exports.preprocess = preprocess;

var base = require('./handlebars/compiler/base');
var tokenizer = require('./tokenizer');
var EntityParser = require('../simple-html-tokenizer/entity-parser');
var fullCharRefs = require('../simple-html-tokenizer/char-refs/full');
var nodeHandlers = require('./node-handlers');
var tokenHandlers = require('./token-handlers');
var syntax = require('../htmlbars-syntax');



var splitLines;
// IE8 throws away blank pieces when splitting strings with a regex
// So we split using a string instead as appropriate
if ("foo\n\nbar".split(/\n/).length === 2) {
  splitLines = function (str) {
    var clean = str.replace(/\r\n?/g, "\n");
    return clean.split("\n");
  };
} else {
  splitLines = function (str) {
    return str.split(/(?:\r\n?|\n)/g);
  };
}
function preprocess(html, options) {
  var ast = typeof html === "object" ? html : base.parse(html);
  var combined = new HTMLProcessor(html, options).acceptNode(ast);

  if (options && options.plugins && options.plugins.ast) {
    for (var i = 0, l = options.plugins.ast.length; i < l; i++) {
      var plugin = new options.plugins.ast[i](options);

      plugin.syntax = syntax;

      combined = plugin.transform(combined);
    }
  }

  return combined;
}

exports['default'] = preprocess;

function HTMLProcessor(source, options) {
  this.options = options || {};
  this.elementStack = [];
  this.tokenizer = new tokenizer.Tokenizer(new EntityParser['default'](fullCharRefs['default']));
  this.nodeHandlers = nodeHandlers['default'];
  this.tokenHandlers = tokenHandlers['default'];

  if (typeof source === "string") {
    this.source = splitLines(source);
  }
}

HTMLProcessor.prototype.acceptNode = function (node) {
  return this.nodeHandlers[node.type].call(this, node);
};

HTMLProcessor.prototype.acceptToken = function (token) {
  if (token) {
    return this.tokenHandlers[token.type].call(this, token);
  }
};

HTMLProcessor.prototype.currentElement = function () {
  return this.elementStack[this.elementStack.length - 1];
};

HTMLProcessor.prototype.sourceForMustache = function (mustache) {
  var firstLine = mustache.loc.start.line - 1;
  var lastLine = mustache.loc.end.line - 1;
  var currentLine = firstLine - 1;
  var firstColumn = mustache.loc.start.column + 2;
  var lastColumn = mustache.loc.end.column - 2;
  var string = [];
  var line;

  if (!this.source) {
    return "{{" + mustache.path.id.original + "}}";
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

  return string.join("\n");
};
},{"../htmlbars-syntax":34,"../simple-html-tokenizer/char-refs/full":67,"../simple-html-tokenizer/entity-parser":68,"./handlebars/compiler/base":37,"./node-handlers":44,"./token-handlers":46,"./tokenizer":47}],46:[function(require,module,exports){
'use strict';

var builders = require('./builders');
var utils = require('./utils');
var voidMap = require('../htmlbars-util/void-tag-names');

var tokenHandlers = {
  Comment: function (token) {
    var current = this.currentElement();
    var comment = builders.buildComment(token.chars);
    utils.appendChild(current, comment);
  },

  Chars: function (token) {
    var current = this.currentElement();
    var text = builders.buildText(token.chars);
    utils.appendChild(current, text);
  },

  StartTag: function (tag) {
    var element = builders.buildElement(tag.tagName, tag.attributes, tag.modifiers || [], []);
    element.loc = {
      source: null,
      start: { line: tag.loc.start.line, column: tag.loc.start.column },
      end: { line: null, column: null }
    };

    this.elementStack.push(element);
    if (voidMap['default'].hasOwnProperty(tag.tagName) || tag.selfClosing) {
      tokenHandlers.EndTag.call(this, tag, true);
    }
  },

  BlockStatement: function () {
    if (this.tokenizer.state === "comment") {
      return;
    } else if (this.tokenizer.state !== "data") {
      throw new Error("A block may only be used inside an HTML element or another block.");
    }
  },

  MustacheStatement: function (mustache) {
    var tokenizer = this.tokenizer;

    switch (tokenizer.state) {
      // Tag helpers
      case "tagName":
        tokenizer.addElementModifier(mustache);
        tokenizer.state = "beforeAttributeName";
        return;
      case "beforeAttributeName":
        tokenizer.addElementModifier(mustache);
        return;
      case "attributeName":
      case "afterAttributeName":
        tokenizer.finalizeAttributeValue();
        tokenizer.addElementModifier(mustache);
        tokenizer.state = "beforeAttributeName";
        return;
      case "afterAttributeValueQuoted":
        tokenizer.addElementModifier(mustache);
        tokenizer.state = "beforeAttributeName";
        return;

      // Attribute values
      case "beforeAttributeValue":
        tokenizer.markAttributeQuoted(false);
        tokenizer.addToAttributeValue(mustache);
        tokenizer.state = "attributeValueUnquoted";
        return;
      case "attributeValueDoubleQuoted":
      case "attributeValueSingleQuoted":
      case "attributeValueUnquoted":
        tokenizer.addToAttributeValue(mustache);
        return;

      // TODO: Only append child when the tokenizer state makes
      // sense to do so, otherwise throw an error.
      default:
        utils.appendChild(this.currentElement(), mustache);
    }
  },

  EndTag: function (tag, selfClosing) {
    var element = this.elementStack.pop();
    var parent = this.currentElement();
    var disableComponentGeneration = this.options.disableComponentGeneration === true;

    validateEndTag(tag, element, selfClosing);

    element.loc.end.line = tag.loc.end.line;
    element.loc.end.column = tag.loc.end.column;

    if (disableComponentGeneration || element.tag.indexOf("-") === -1) {
      utils.appendChild(parent, element);
    } else {
      var program = builders.buildProgram(element.children);
      utils.parseComponentBlockParams(element, program);
      var component = builders.buildComponent(element.tag, element.attributes, program, element.loc);
      utils.appendChild(parent, component);
    }
  }

};

function validateEndTag(tag, element, selfClosing) {
  var error;

  if (voidMap['default'][tag.tagName] && !selfClosing) {
    // EngTag is also called by StartTag for void and self-closing tags (i.e.
    // <input> or <br />, so we need to check for that here. Otherwise, we would
    // throw an error for those cases.
    error = "Invalid end tag " + formatEndTagInfo(tag) + " (void elements cannot have end tags).";
  } else if (element.tag === undefined) {
    error = "Closing tag " + formatEndTagInfo(tag) + " without an open tag.";
  } else if (element.tag !== tag.tagName) {
    error = "Closing tag " + formatEndTagInfo(tag) + " did not match last open tag `" + element.tag + "` (on line " + element.loc.start.line + ").";
  }

  if (error) {
    throw new Error(error);
  }
}

function formatEndTagInfo(tag) {
  return "`" + tag.tagName + "` (on line " + tag.loc.end.line + ")";
}

exports['default'] = tokenHandlers;
/*block*/
},{"../htmlbars-util/void-tag-names":60,"./builders":35,"./utils":48}],47:[function(require,module,exports){
'use strict';

var simple_html_tokenizer = require('../simple-html-tokenizer');
var utils = require('./utils');
var array_utils = require('../htmlbars-util/array-utils');
var builders = require('./builders');

simple_html_tokenizer.Tokenizer.prototype.createAttribute = function (char) {
  if (this.token.type === "EndTag") {
    throw new Error("Invalid end tag: closing tag must not have attributes, in " + formatTokenInfo(this) + ".");
  }
  this.currentAttribute = builders['default'].attr(char.toLowerCase(), [], null);
  this.token.attributes.push(this.currentAttribute);
  this.state = "attributeName";
};

simple_html_tokenizer.Tokenizer.prototype.markAttributeQuoted = function (value) {
  this.currentAttribute.quoted = value;
};

simple_html_tokenizer.Tokenizer.prototype.addToAttributeName = function (char) {
  this.currentAttribute.name += char;
};

simple_html_tokenizer.Tokenizer.prototype.addToAttributeValue = function (char) {
  var value = this.currentAttribute.value;

  if (!this.currentAttribute.quoted && char === "/") {
    throw new Error("A space is required between an unquoted attribute value and `/`, in " + formatTokenInfo(this) + ".");
  }
  if (!this.currentAttribute.quoted && value.length > 0 && (char.type === "MustacheStatement" || value[0].type === "MustacheStatement")) {
    throw new Error("Unquoted attribute value must be a single string or mustache (on line " + this.line + ")");
  }

  if (typeof char === "object") {
    if (char.type === "MustacheStatement") {
      value.push(char);
    } else {
      throw new Error("Unsupported node in attribute value: " + char.type);
    }
  } else {
    if (value.length > 0 && value[value.length - 1].type === "TextNode") {
      value[value.length - 1].chars += char;
    } else {
      value.push(builders['default'].text(char));
    }
  }
};

simple_html_tokenizer.Tokenizer.prototype.finalizeAttributeValue = function () {
  if (this.currentAttribute) {
    this.currentAttribute.value = prepareAttributeValue(this.currentAttribute);
    delete this.currentAttribute.quoted;
    delete this.currentAttribute;
  }
};

simple_html_tokenizer.Tokenizer.prototype.addElementModifier = function (mustache) {
  if (!this.token.modifiers) {
    this.token.modifiers = [];
  }

  var path = mustache.path;
  var params = mustache.params;
  var hash = mustache.hash;
  var loc = mustache.loc;

  var modifier = builders['default'].elementModifier(path, params, hash, loc);
  this.token.modifiers.push(modifier);
};

function prepareAttributeValue(attr) {
  var parts = attr.value;
  var length = parts.length;

  if (length === 0) {
    return builders['default'].text("");
  } else if (length === 1 && parts[0].type === "TextNode") {
    return parts[0];
  } else if (!attr.quoted) {
    return parts[0];
  } else {
    return builders['default'].concat(array_utils.map(parts, prepareConcatPart));
  }
}

function prepareConcatPart(node) {
  switch (node.type) {
    case "TextNode":
      return builders['default'].string(node.chars);
    case "MustacheStatement":
      return utils.unwrapMustache(node);
    default:
      throw new Error("Unsupported node in quoted attribute value: " + node.type);
  }
}

function formatTokenInfo(tokenizer) {
  return "`" + tokenizer.token.tagName + "` (on line " + tokenizer.line + ")";
}

exports.Tokenizer = simple_html_tokenizer.Tokenizer;
},{"../htmlbars-util/array-utils":51,"../simple-html-tokenizer":66,"./builders":35,"./utils":48}],48:[function(require,module,exports){
'use strict';

exports.parseComponentBlockParams = parseComponentBlockParams;
exports.childrenFor = childrenFor;
exports.appendChild = appendChild;
exports.isHelper = isHelper;
exports.unwrapMustache = unwrapMustache;

var array_utils = require('../htmlbars-util/array-utils');



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

  var asIndex = array_utils.indexOfArray(attrNames, 'as');

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
},{"../htmlbars-util/array-utils":51}],49:[function(require,module,exports){
'use strict';

function Walker(order) {
  this.order = order;
  this.stack = [];
}

exports['default'] = Walker;

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
},{}],50:[function(require,module,exports){
'use strict';

var SafeString = require('./htmlbars-util/safe-string');
var utils = require('./htmlbars-util/handlebars/utils');
var namespaces = require('./htmlbars-util/namespaces');
var morph_utils = require('./htmlbars-util/morph-utils');

exports.SafeString = SafeString['default'];
exports.escapeExpression = utils.escapeExpression;
exports.getAttrNamespace = namespaces.getAttrNamespace;
exports.validateChildMorphs = morph_utils.validateChildMorphs;
exports.linkParams = morph_utils.linkParams;
exports.dump = morph_utils.dump;
},{"./htmlbars-util/handlebars/utils":53,"./htmlbars-util/morph-utils":54,"./htmlbars-util/namespaces":55,"./htmlbars-util/safe-string":58}],51:[function(require,module,exports){
'use strict';

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

var indexOfArray = getIdx;

exports.isArray = isArray;
exports.indexOfArray = indexOfArray;
},{}],52:[function(require,module,exports){
'use strict';

// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
  return '' + this.string;
};

exports['default'] = SafeString;
},{}],53:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"dup":43}],54:[function(require,module,exports){
'use strict';

exports.visitChildren = visitChildren;
exports.validateChildMorphs = validateChildMorphs;
exports.linkParams = linkParams;
exports.dump = dump;

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
      nodes.push(node.morphList);
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
},{}],55:[function(require,module,exports){
'use strict';

exports.getAttrNamespace = getAttrNamespace;

var defaultNamespaces = {
  html: 'http://www.w3.org/1999/xhtml',
  mathml: 'http://www.w3.org/1998/Math/MathML',
  svg: 'http://www.w3.org/2000/svg',
  xlink: 'http://www.w3.org/1999/xlink',
  xml: 'http://www.w3.org/XML/1998/namespace'
};
function getAttrNamespace(attrName) {
  var namespace;

  var colonIndex = attrName.indexOf(':');
  if (colonIndex !== -1) {
    var prefix = attrName.slice(0, colonIndex);
    namespace = defaultNamespaces[prefix];
  }

  return namespace || null;
}
},{}],56:[function(require,module,exports){
'use strict';

exports.merge = merge;
exports.createObject = createObject;
exports.objectKeys = objectKeys;
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

// IE8 does not have Object.create, so use a polyfill if needed.
// Polyfill based on Mozilla's (MDN)

function createObject(obj) {
  if (typeof Object.create === 'function') {
    return Object.create(obj);
  } else {
    var Temp = function () {};
    Temp.prototype = obj;
    return new Temp();
  }
}

function objectKeys(obj) {
  if (typeof Object.keys === 'function') {
    return Object.keys(obj);
  } else {
    return legacyKeys(obj);
  }
}

function shallowCopy(obj) {
  return merge({}, obj);
}

function legacyKeys(obj) {
  var keys = [];

  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      keys.push(prop);
    }
  }

  return keys;
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
},{}],57:[function(require,module,exports){
'use strict';

exports.hash = hash;
exports.repeat = repeat;
exports.escapeString = escapeString;
exports.string = string;
exports.array = array;

function escapeString(str) {
  str = str.replace(/\\/g, "\\\\");
  str = str.replace(/"/g, "\\\"");
  str = str.replace(/\n/g, "\\n");
  return str;
}

function string(str) {
  return "\"" + escapeString(str) + "\"";
}

function array(a) {
  return "[" + a + "]";
}

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
},{}],58:[function(require,module,exports){
'use strict';

var SafeString = require('./handlebars/safe-string');

exports['default'] = SafeString['default'];
},{"./handlebars/safe-string":52}],59:[function(require,module,exports){
'use strict';

exports.RenderState = RenderState;
exports.blockFor = blockFor;
exports.renderAndCleanup = renderAndCleanup;
exports.clearMorph = clearMorph;
exports.clearMorphList = clearMorphList;

var morph_utils = require('../htmlbars-util/morph-utils');



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

  // The morph to clear once rendering is complete. By
  // default, we set this to the previous morph (to catch
  // the case where nothing is yielded; in that case, we
  // should just clear the morph). Otherwise this gets set
  // to null if anything is rendered.
  this.morphToClear = renderNode;

  this.shadowOptions = null;
}

function blockFor(render, template, blockOptions) {
  var block = function (env, blockArguments, self, renderNode, parentScope, visitor) {
    if (renderNode.lastResult) {
      renderNode.lastResult.revalidateWith(env, undefined, self, blockArguments, visitor);
    } else {
      var options = { renderState: new RenderState(renderNode) };

      var scope = blockOptions.scope;
      var shadowScope = scope ? env.hooks.createChildScope(scope) : env.hooks.createFreshScope();
      var attributes = blockOptions.attributes;

      env.hooks.bindShadowScope(env, parentScope, shadowScope, blockOptions.options);

      if (self !== undefined) {
        env.hooks.bindSelf(env, shadowScope, self);
      } else if (blockOptions.self !== undefined) {
        env.hooks.bindSelf(env, shadowScope, blockOptions.self);
      }

      bindBlocks(env, shadowScope, blockOptions.yieldTo);

      renderAndCleanup(renderNode, env, options, null, function () {
        options.renderState.morphToClear = null;
        render(template, env, shadowScope, { renderNode: renderNode, blockArguments: blockArguments, attributes: attributes });
      });
    }
  };

  block.arity = template.arity;

  return block;
}

function bindBlocks(env, shadowScope, blocks) {
  if (!blocks) {
    return;
  }
  if (typeof blocks === "function") {
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
        delete morphMap[item.key];
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

  morph_utils.visitChildren(morph.childNodes, destroyNode);

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
    delete morph.morphMap[item.key];
    clearMorph(item, env, true);
    item.destroy();

    item = next;
  }

  // Remove the MorphList from the morph.
  morphList.clear();
  morph.morphList = null;
}
},{"../htmlbars-util/morph-utils":54}],60:[function(require,module,exports){
'use strict';

var array_utils = require('./array-utils');

var voidTagNames = "area base br col command embed hr img input keygen link meta param source track wbr";
var voidMap = {};

array_utils.forEach(voidTagNames.split(" "), function (tagName) {
  voidMap[tagName] = true;
});

exports['default'] = voidMap;
},{"./array-utils":51}],61:[function(require,module,exports){
'use strict';

var sanitize_attribute_value = require('./morph-attr/sanitize-attribute-value');
var prop = require('./dom-helper/prop');
var build_html_dom = require('./dom-helper/build-html-dom');
var htmlbars_util = require('./htmlbars-util');

function getProperty() {
  return this.domHelper.getPropertyStrict(this.element, this.attrName);
}

function updateProperty(value) {
  if (this._renderedInitially === true || !prop.isAttrRemovalValue(value)) {
    // do not render if initial value is undefined or null
    this.domHelper.setPropertyStrict(this.element, this.attrName, value);
  }

  this._renderedInitially = true;
}

function getAttribute() {
  return this.domHelper.getAttribute(this.element, this.attrName);
}

function updateAttribute(value) {
  if (prop.isAttrRemovalValue(value)) {
    this.domHelper.removeAttribute(this.element, this.attrName);
  } else {
    this.domHelper.setAttribute(this.element, this.attrName, value);
  }
}

function getAttributeNS() {
  return this.domHelper.getAttributeNS(this.element, this.namespace, this.attrName);
}

function updateAttributeNS(value) {
  if (prop.isAttrRemovalValue(value)) {
    this.domHelper.removeAttribute(this.element, this.attrName);
  } else {
    this.domHelper.setAttributeNS(this.element, this.namespace, this.attrName, value);
  }
}

var UNSET = { unset: true };

var guid = 1;

function AttrMorph(element, attrName, domHelper, namespace) {
  this.element = element;
  this.domHelper = domHelper;
  this.namespace = namespace !== undefined ? namespace : htmlbars_util.getAttrNamespace(attrName);
  this.state = {};
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
  this.ownerNode = null;
  this.rendered = false;
  this._renderedInitially = false;

  var normalizedAttrName = prop.normalizeProperty(this.element, attrName);
  if (this.namespace) {
    this._update = updateAttributeNS;
    this._get = getAttributeNS;
    this.attrName = attrName;
  } else {
    if (element.namespaceURI === build_html_dom.svgNamespace || attrName === "style" || !normalizedAttrName) {
      this._update = updateAttribute;
      this._get = getAttribute;
      this.attrName = attrName;
    } else {
      this._update = updateProperty;
      this._get = getProperty;
      this.attrName = normalizedAttrName;
    }
  }
}

AttrMorph.prototype.setContent = function (value) {
  if (this.lastValue === value) {
    return;
  }
  this.lastValue = value;

  if (this.escaped) {
    var sanitized = sanitize_attribute_value.sanitizeAttributeValue(this.domHelper, this.element, this.attrName, value);
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

exports['default'] = AttrMorph;

exports.sanitizeAttributeValue = sanitize_attribute_value.sanitizeAttributeValue;
},{"./dom-helper/build-html-dom":19,"./dom-helper/prop":21,"./htmlbars-util":50,"./morph-attr/sanitize-attribute-value":62}],62:[function(require,module,exports){
'use strict';

exports.sanitizeAttributeValue = sanitizeAttributeValue;

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
  'BASE': true
};

var badTagsForDataURI = {
  'EMBED': true
};

var badAttributes = {
  'href': true,
  'src': true,
  'background': true
};

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

exports.badAttributes = badAttributes;
},{}],63:[function(require,module,exports){
'use strict';

var utils = require('./morph-range/utils');

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
        return this.setHTML(content);
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
    default:
      throw new TypeError('unsupported content');
  }
};

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
      utils.insertBefore(parentNode, firstNode, lastNode, previousFirstNode);
      utils.clear(parentNode, previousFirstNode, this.lastNode);
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

  utils.clear(parentNode, firstNode, lastNode);
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

Morph.prototype.insertBeforeNode = function Morph$insertBeforeNode(parent, reference) {
  var current = this.firstNode;

  while (current) {
    var next = current.nextSibling;
    parent.insertBefore(current, reference);
    current = next;
  }
};

Morph.prototype.appendToNode = function Morph$appendToNode(parent) {
  this.insertBeforeNode(parent, null);
};

exports['default'] = Morph;
},{"./morph-range/utils":65}],64:[function(require,module,exports){
'use strict';

var utils = require('./utils');

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

    utils.insertBefore(parentNode, morph.firstNode, morph.lastNode, referenceNode);

    // was not in list mode replace current content
    if (!this.firstChildMorph) {
      utils.clear(this.mountedMorph.firstNode.parentNode, this.mountedMorph.firstNode, this.mountedMorph.lastNode);
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
    throw new Error('Cannot remove a morph from a parent it is not inside of');
  }

  morph.destroy();
};

exports['default'] = MorphList;
},{"./utils":65}],65:[function(require,module,exports){
'use strict';

exports.clear = clear;
exports.insertBefore = insertBefore;

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

function insertBefore(parentNode, firstNode, lastNode, _refNode) {
  var node = lastNode;
  var refNode = _refNode;
  var prevNode;
  do {
    prevNode = node.previousSibling;
    parentNode.insertBefore(node, refNode);
    if (node === firstNode) {
      break;
    }
    refNode = node;
    node = prevNode;
  } while (node);
}
},{}],66:[function(require,module,exports){
'use strict';

var Tokenizer = require('./simple-html-tokenizer/tokenizer');
var tokenize = require('./simple-html-tokenizer/tokenize');
var Generator = require('./simple-html-tokenizer/generator');
var generate = require('./simple-html-tokenizer/generate');
var tokens = require('./simple-html-tokenizer/tokens');

/*jshint boss:true*/

exports.Tokenizer = Tokenizer['default'];
exports.tokenize = tokenize['default'];
exports.Generator = Generator['default'];
exports.generate = generate['default'];
exports.StartTag = tokens.StartTag;
exports.EndTag = tokens.EndTag;
exports.Chars = tokens.Chars;
exports.Comment = tokens.Comment;
},{"./simple-html-tokenizer/generate":69,"./simple-html-tokenizer/generator":70,"./simple-html-tokenizer/tokenize":71,"./simple-html-tokenizer/tokenizer":72,"./simple-html-tokenizer/tokens":73}],67:[function(require,module,exports){
'use strict';

exports['default'] = {
  AElig: [198],
  AMP: [38],
  Aacute: [193],
  Abreve: [258],
  Acirc: [194],
  Acy: [1040],
  Afr: [120068],
  Agrave: [192],
  Alpha: [913],
  Amacr: [256],
  And: [10835],
  Aogon: [260],
  Aopf: [120120],
  ApplyFunction: [8289],
  Aring: [197],
  Ascr: [119964],
  Assign: [8788],
  Atilde: [195],
  Auml: [196],
  Backslash: [8726],
  Barv: [10983],
  Barwed: [8966],
  Bcy: [1041],
  Because: [8757],
  Bernoullis: [8492],
  Beta: [914],
  Bfr: [120069],
  Bopf: [120121],
  Breve: [728],
  Bscr: [8492],
  Bumpeq: [8782],
  CHcy: [1063],
  COPY: [169],
  Cacute: [262],
  Cap: [8914],
  CapitalDifferentialD: [8517],
  Cayleys: [8493],
  Ccaron: [268],
  Ccedil: [199],
  Ccirc: [264],
  Cconint: [8752],
  Cdot: [266],
  Cedilla: [184],
  CenterDot: [183],
  Cfr: [8493],
  Chi: [935],
  CircleDot: [8857],
  CircleMinus: [8854],
  CirclePlus: [8853],
  CircleTimes: [8855],
  ClockwiseContourIntegral: [8754],
  CloseCurlyDoubleQuote: [8221],
  CloseCurlyQuote: [8217],
  Colon: [8759],
  Colone: [10868],
  Congruent: [8801],
  Conint: [8751],
  ContourIntegral: [8750],
  Copf: [8450],
  Coproduct: [8720],
  CounterClockwiseContourIntegral: [8755],
  Cross: [10799],
  Cscr: [119966],
  Cup: [8915],
  CupCap: [8781],
  DD: [8517],
  DDotrahd: [10513],
  DJcy: [1026],
  DScy: [1029],
  DZcy: [1039],
  Dagger: [8225],
  Darr: [8609],
  Dashv: [10980],
  Dcaron: [270],
  Dcy: [1044],
  Del: [8711],
  Delta: [916],
  Dfr: [120071],
  DiacriticalAcute: [180],
  DiacriticalDot: [729],
  DiacriticalDoubleAcute: [733],
  DiacriticalGrave: [96],
  DiacriticalTilde: [732],
  Diamond: [8900],
  DifferentialD: [8518],
  Dopf: [120123],
  Dot: [168],
  DotDot: [8412],
  DotEqual: [8784],
  DoubleContourIntegral: [8751],
  DoubleDot: [168],
  DoubleDownArrow: [8659],
  DoubleLeftArrow: [8656],
  DoubleLeftRightArrow: [8660],
  DoubleLeftTee: [10980],
  DoubleLongLeftArrow: [10232],
  DoubleLongLeftRightArrow: [10234],
  DoubleLongRightArrow: [10233],
  DoubleRightArrow: [8658],
  DoubleRightTee: [8872],
  DoubleUpArrow: [8657],
  DoubleUpDownArrow: [8661],
  DoubleVerticalBar: [8741],
  DownArrow: [8595],
  DownArrowBar: [10515],
  DownArrowUpArrow: [8693],
  DownBreve: [785],
  DownLeftRightVector: [10576],
  DownLeftTeeVector: [10590],
  DownLeftVector: [8637],
  DownLeftVectorBar: [10582],
  DownRightTeeVector: [10591],
  DownRightVector: [8641],
  DownRightVectorBar: [10583],
  DownTee: [8868],
  DownTeeArrow: [8615],
  Downarrow: [8659],
  Dscr: [119967],
  Dstrok: [272],
  ENG: [330],
  ETH: [208],
  Eacute: [201],
  Ecaron: [282],
  Ecirc: [202],
  Ecy: [1069],
  Edot: [278],
  Efr: [120072],
  Egrave: [200],
  Element: [8712],
  Emacr: [274],
  EmptySmallSquare: [9723],
  EmptyVerySmallSquare: [9643],
  Eogon: [280],
  Eopf: [120124],
  Epsilon: [917],
  Equal: [10869],
  EqualTilde: [8770],
  Equilibrium: [8652],
  Escr: [8496],
  Esim: [10867],
  Eta: [919],
  Euml: [203],
  Exists: [8707],
  ExponentialE: [8519],
  Fcy: [1060],
  Ffr: [120073],
  FilledSmallSquare: [9724],
  FilledVerySmallSquare: [9642],
  Fopf: [120125],
  ForAll: [8704],
  Fouriertrf: [8497],
  Fscr: [8497],
  GJcy: [1027],
  GT: [62],
  Gamma: [915],
  Gammad: [988],
  Gbreve: [286],
  Gcedil: [290],
  Gcirc: [284],
  Gcy: [1043],
  Gdot: [288],
  Gfr: [120074],
  Gg: [8921],
  Gopf: [120126],
  GreaterEqual: [8805],
  GreaterEqualLess: [8923],
  GreaterFullEqual: [8807],
  GreaterGreater: [10914],
  GreaterLess: [8823],
  GreaterSlantEqual: [10878],
  GreaterTilde: [8819],
  Gscr: [119970],
  Gt: [8811],
  HARDcy: [1066],
  Hacek: [711],
  Hat: [94],
  Hcirc: [292],
  Hfr: [8460],
  HilbertSpace: [8459],
  Hopf: [8461],
  HorizontalLine: [9472],
  Hscr: [8459],
  Hstrok: [294],
  HumpDownHump: [8782],
  HumpEqual: [8783],
  IEcy: [1045],
  IJlig: [306],
  IOcy: [1025],
  Iacute: [205],
  Icirc: [206],
  Icy: [1048],
  Idot: [304],
  Ifr: [8465],
  Igrave: [204],
  Im: [8465],
  Imacr: [298],
  ImaginaryI: [8520],
  Implies: [8658],
  Int: [8748],
  Integral: [8747],
  Intersection: [8898],
  InvisibleComma: [8291],
  InvisibleTimes: [8290],
  Iogon: [302],
  Iopf: [120128],
  Iota: [921],
  Iscr: [8464],
  Itilde: [296],
  Iukcy: [1030],
  Iuml: [207],
  Jcirc: [308],
  Jcy: [1049],
  Jfr: [120077],
  Jopf: [120129],
  Jscr: [119973],
  Jsercy: [1032],
  Jukcy: [1028],
  KHcy: [1061],
  KJcy: [1036],
  Kappa: [922],
  Kcedil: [310],
  Kcy: [1050],
  Kfr: [120078],
  Kopf: [120130],
  Kscr: [119974],
  LJcy: [1033],
  LT: [60],
  Lacute: [313],
  Lambda: [923],
  Lang: [10218],
  Laplacetrf: [8466],
  Larr: [8606],
  Lcaron: [317],
  Lcedil: [315],
  Lcy: [1051],
  LeftAngleBracket: [10216],
  LeftArrow: [8592],
  LeftArrowBar: [8676],
  LeftArrowRightArrow: [8646],
  LeftCeiling: [8968],
  LeftDoubleBracket: [10214],
  LeftDownTeeVector: [10593],
  LeftDownVector: [8643],
  LeftDownVectorBar: [10585],
  LeftFloor: [8970],
  LeftRightArrow: [8596],
  LeftRightVector: [10574],
  LeftTee: [8867],
  LeftTeeArrow: [8612],
  LeftTeeVector: [10586],
  LeftTriangle: [8882],
  LeftTriangleBar: [10703],
  LeftTriangleEqual: [8884],
  LeftUpDownVector: [10577],
  LeftUpTeeVector: [10592],
  LeftUpVector: [8639],
  LeftUpVectorBar: [10584],
  LeftVector: [8636],
  LeftVectorBar: [10578],
  Leftarrow: [8656],
  Leftrightarrow: [8660],
  LessEqualGreater: [8922],
  LessFullEqual: [8806],
  LessGreater: [8822],
  LessLess: [10913],
  LessSlantEqual: [10877],
  LessTilde: [8818],
  Lfr: [120079],
  Ll: [8920],
  Lleftarrow: [8666],
  Lmidot: [319],
  LongLeftArrow: [10229],
  LongLeftRightArrow: [10231],
  LongRightArrow: [10230],
  Longleftarrow: [10232],
  Longleftrightarrow: [10234],
  Longrightarrow: [10233],
  Lopf: [120131],
  LowerLeftArrow: [8601],
  LowerRightArrow: [8600],
  Lscr: [8466],
  Lsh: [8624],
  Lstrok: [321],
  Lt: [8810],
  Map: [10501],
  Mcy: [1052],
  MediumSpace: [8287],
  Mellintrf: [8499],
  Mfr: [120080],
  MinusPlus: [8723],
  Mopf: [120132],
  Mscr: [8499],
  Mu: [924],
  NJcy: [1034],
  Nacute: [323],
  Ncaron: [327],
  Ncedil: [325],
  Ncy: [1053],
  NegativeMediumSpace: [8203],
  NegativeThickSpace: [8203],
  NegativeThinSpace: [8203],
  NegativeVeryThinSpace: [8203],
  NestedGreaterGreater: [8811],
  NestedLessLess: [8810],
  NewLine: [10],
  Nfr: [120081],
  NoBreak: [8288],
  NonBreakingSpace: [160],
  Nopf: [8469],
  Not: [10988],
  NotCongruent: [8802],
  NotCupCap: [8813],
  NotDoubleVerticalBar: [8742],
  NotElement: [8713],
  NotEqual: [8800],
  NotEqualTilde: [8770, 824],
  NotExists: [8708],
  NotGreater: [8815],
  NotGreaterEqual: [8817],
  NotGreaterFullEqual: [8807, 824],
  NotGreaterGreater: [8811, 824],
  NotGreaterLess: [8825],
  NotGreaterSlantEqual: [10878, 824],
  NotGreaterTilde: [8821],
  NotHumpDownHump: [8782, 824],
  NotHumpEqual: [8783, 824],
  NotLeftTriangle: [8938],
  NotLeftTriangleBar: [10703, 824],
  NotLeftTriangleEqual: [8940],
  NotLess: [8814],
  NotLessEqual: [8816],
  NotLessGreater: [8824],
  NotLessLess: [8810, 824],
  NotLessSlantEqual: [10877, 824],
  NotLessTilde: [8820],
  NotNestedGreaterGreater: [10914, 824],
  NotNestedLessLess: [10913, 824],
  NotPrecedes: [8832],
  NotPrecedesEqual: [10927, 824],
  NotPrecedesSlantEqual: [8928],
  NotReverseElement: [8716],
  NotRightTriangle: [8939],
  NotRightTriangleBar: [10704, 824],
  NotRightTriangleEqual: [8941],
  NotSquareSubset: [8847, 824],
  NotSquareSubsetEqual: [8930],
  NotSquareSuperset: [8848, 824],
  NotSquareSupersetEqual: [8931],
  NotSubset: [8834, 8402],
  NotSubsetEqual: [8840],
  NotSucceeds: [8833],
  NotSucceedsEqual: [10928, 824],
  NotSucceedsSlantEqual: [8929],
  NotSucceedsTilde: [8831, 824],
  NotSuperset: [8835, 8402],
  NotSupersetEqual: [8841],
  NotTilde: [8769],
  NotTildeEqual: [8772],
  NotTildeFullEqual: [8775],
  NotTildeTilde: [8777],
  NotVerticalBar: [8740],
  Nscr: [119977],
  Ntilde: [209],
  Nu: [925],
  OElig: [338],
  Oacute: [211],
  Ocirc: [212],
  Ocy: [1054],
  Odblac: [336],
  Ofr: [120082],
  Ograve: [210],
  Omacr: [332],
  Omega: [937],
  Omicron: [927],
  Oopf: [120134],
  OpenCurlyDoubleQuote: [8220],
  OpenCurlyQuote: [8216],
  Or: [10836],
  Oscr: [119978],
  Oslash: [216],
  Otilde: [213],
  Otimes: [10807],
  Ouml: [214],
  OverBar: [8254],
  OverBrace: [9182],
  OverBracket: [9140],
  OverParenthesis: [9180],
  PartialD: [8706],
  Pcy: [1055],
  Pfr: [120083],
  Phi: [934],
  Pi: [928],
  PlusMinus: [177],
  Poincareplane: [8460],
  Popf: [8473],
  Pr: [10939],
  Precedes: [8826],
  PrecedesEqual: [10927],
  PrecedesSlantEqual: [8828],
  PrecedesTilde: [8830],
  Prime: [8243],
  Product: [8719],
  Proportion: [8759],
  Proportional: [8733],
  Pscr: [119979],
  Psi: [936],
  QUOT: [34],
  Qfr: [120084],
  Qopf: [8474],
  Qscr: [119980],
  RBarr: [10512],
  REG: [174],
  Racute: [340],
  Rang: [10219],
  Rarr: [8608],
  Rarrtl: [10518],
  Rcaron: [344],
  Rcedil: [342],
  Rcy: [1056],
  Re: [8476],
  ReverseElement: [8715],
  ReverseEquilibrium: [8651],
  ReverseUpEquilibrium: [10607],
  Rfr: [8476],
  Rho: [929],
  RightAngleBracket: [10217],
  RightArrow: [8594],
  RightArrowBar: [8677],
  RightArrowLeftArrow: [8644],
  RightCeiling: [8969],
  RightDoubleBracket: [10215],
  RightDownTeeVector: [10589],
  RightDownVector: [8642],
  RightDownVectorBar: [10581],
  RightFloor: [8971],
  RightTee: [8866],
  RightTeeArrow: [8614],
  RightTeeVector: [10587],
  RightTriangle: [8883],
  RightTriangleBar: [10704],
  RightTriangleEqual: [8885],
  RightUpDownVector: [10575],
  RightUpTeeVector: [10588],
  RightUpVector: [8638],
  RightUpVectorBar: [10580],
  RightVector: [8640],
  RightVectorBar: [10579],
  Rightarrow: [8658],
  Ropf: [8477],
  RoundImplies: [10608],
  Rrightarrow: [8667],
  Rscr: [8475],
  Rsh: [8625],
  RuleDelayed: [10740],
  SHCHcy: [1065],
  SHcy: [1064],
  SOFTcy: [1068],
  Sacute: [346],
  Sc: [10940],
  Scaron: [352],
  Scedil: [350],
  Scirc: [348],
  Scy: [1057],
  Sfr: [120086],
  ShortDownArrow: [8595],
  ShortLeftArrow: [8592],
  ShortRightArrow: [8594],
  ShortUpArrow: [8593],
  Sigma: [931],
  SmallCircle: [8728],
  Sopf: [120138],
  Sqrt: [8730],
  Square: [9633],
  SquareIntersection: [8851],
  SquareSubset: [8847],
  SquareSubsetEqual: [8849],
  SquareSuperset: [8848],
  SquareSupersetEqual: [8850],
  SquareUnion: [8852],
  Sscr: [119982],
  Star: [8902],
  Sub: [8912],
  Subset: [8912],
  SubsetEqual: [8838],
  Succeeds: [8827],
  SucceedsEqual: [10928],
  SucceedsSlantEqual: [8829],
  SucceedsTilde: [8831],
  SuchThat: [8715],
  Sum: [8721],
  Sup: [8913],
  Superset: [8835],
  SupersetEqual: [8839],
  Supset: [8913],
  THORN: [222],
  TRADE: [8482],
  TSHcy: [1035],
  TScy: [1062],
  Tab: [9],
  Tau: [932],
  Tcaron: [356],
  Tcedil: [354],
  Tcy: [1058],
  Tfr: [120087],
  Therefore: [8756],
  Theta: [920],
  ThickSpace: [8287, 8202],
  ThinSpace: [8201],
  Tilde: [8764],
  TildeEqual: [8771],
  TildeFullEqual: [8773],
  TildeTilde: [8776],
  Topf: [120139],
  TripleDot: [8411],
  Tscr: [119983],
  Tstrok: [358],
  Uacute: [218],
  Uarr: [8607],
  Uarrocir: [10569],
  Ubrcy: [1038],
  Ubreve: [364],
  Ucirc: [219],
  Ucy: [1059],
  Udblac: [368],
  Ufr: [120088],
  Ugrave: [217],
  Umacr: [362],
  UnderBar: [95],
  UnderBrace: [9183],
  UnderBracket: [9141],
  UnderParenthesis: [9181],
  Union: [8899],
  UnionPlus: [8846],
  Uogon: [370],
  Uopf: [120140],
  UpArrow: [8593],
  UpArrowBar: [10514],
  UpArrowDownArrow: [8645],
  UpDownArrow: [8597],
  UpEquilibrium: [10606],
  UpTee: [8869],
  UpTeeArrow: [8613],
  Uparrow: [8657],
  Updownarrow: [8661],
  UpperLeftArrow: [8598],
  UpperRightArrow: [8599],
  Upsi: [978],
  Upsilon: [933],
  Uring: [366],
  Uscr: [119984],
  Utilde: [360],
  Uuml: [220],
  VDash: [8875],
  Vbar: [10987],
  Vcy: [1042],
  Vdash: [8873],
  Vdashl: [10982],
  Vee: [8897],
  Verbar: [8214],
  Vert: [8214],
  VerticalBar: [8739],
  VerticalLine: [124],
  VerticalSeparator: [10072],
  VerticalTilde: [8768],
  VeryThinSpace: [8202],
  Vfr: [120089],
  Vopf: [120141],
  Vscr: [119985],
  Vvdash: [8874],
  Wcirc: [372],
  Wedge: [8896],
  Wfr: [120090],
  Wopf: [120142],
  Wscr: [119986],
  Xfr: [120091],
  Xi: [926],
  Xopf: [120143],
  Xscr: [119987],
  YAcy: [1071],
  YIcy: [1031],
  YUcy: [1070],
  Yacute: [221],
  Ycirc: [374],
  Ycy: [1067],
  Yfr: [120092],
  Yopf: [120144],
  Yscr: [119988],
  Yuml: [376],
  ZHcy: [1046],
  Zacute: [377],
  Zcaron: [381],
  Zcy: [1047],
  Zdot: [379],
  ZeroWidthSpace: [8203],
  Zeta: [918],
  Zfr: [8488],
  Zopf: [8484],
  Zscr: [119989],
  aacute: [225],
  abreve: [259],
  ac: [8766],
  acE: [8766, 819],
  acd: [8767],
  acirc: [226],
  acute: [180],
  acy: [1072],
  aelig: [230],
  af: [8289],
  afr: [120094],
  agrave: [224],
  alefsym: [8501],
  aleph: [8501],
  alpha: [945],
  amacr: [257],
  amalg: [10815],
  amp: [38],
  and: [8743],
  andand: [10837],
  andd: [10844],
  andslope: [10840],
  andv: [10842],
  ang: [8736],
  ange: [10660],
  angle: [8736],
  angmsd: [8737],
  angmsdaa: [10664],
  angmsdab: [10665],
  angmsdac: [10666],
  angmsdad: [10667],
  angmsdae: [10668],
  angmsdaf: [10669],
  angmsdag: [10670],
  angmsdah: [10671],
  angrt: [8735],
  angrtvb: [8894],
  angrtvbd: [10653],
  angsph: [8738],
  angst: [197],
  angzarr: [9084],
  aogon: [261],
  aopf: [120146],
  ap: [8776],
  apE: [10864],
  apacir: [10863],
  ape: [8778],
  apid: [8779],
  apos: [39],
  approx: [8776],
  approxeq: [8778],
  aring: [229],
  ascr: [119990],
  ast: [42],
  asymp: [8776],
  asympeq: [8781],
  atilde: [227],
  auml: [228],
  awconint: [8755],
  awint: [10769],
  bNot: [10989],
  backcong: [8780],
  backepsilon: [1014],
  backprime: [8245],
  backsim: [8765],
  backsimeq: [8909],
  barvee: [8893],
  barwed: [8965],
  barwedge: [8965],
  bbrk: [9141],
  bbrktbrk: [9142],
  bcong: [8780],
  bcy: [1073],
  bdquo: [8222],
  becaus: [8757],
  because: [8757],
  bemptyv: [10672],
  bepsi: [1014],
  bernou: [8492],
  beta: [946],
  beth: [8502],
  between: [8812],
  bfr: [120095],
  bigcap: [8898],
  bigcirc: [9711],
  bigcup: [8899],
  bigodot: [10752],
  bigoplus: [10753],
  bigotimes: [10754],
  bigsqcup: [10758],
  bigstar: [9733],
  bigtriangledown: [9661],
  bigtriangleup: [9651],
  biguplus: [10756],
  bigvee: [8897],
  bigwedge: [8896],
  bkarow: [10509],
  blacklozenge: [10731],
  blacksquare: [9642],
  blacktriangle: [9652],
  blacktriangledown: [9662],
  blacktriangleleft: [9666],
  blacktriangleright: [9656],
  blank: [9251],
  blk12: [9618],
  blk14: [9617],
  blk34: [9619],
  block: [9608],
  bne: [61, 8421],
  bnequiv: [8801, 8421],
  bnot: [8976],
  bopf: [120147],
  bot: [8869],
  bottom: [8869],
  bowtie: [8904],
  boxDL: [9559],
  boxDR: [9556],
  boxDl: [9558],
  boxDr: [9555],
  boxH: [9552],
  boxHD: [9574],
  boxHU: [9577],
  boxHd: [9572],
  boxHu: [9575],
  boxUL: [9565],
  boxUR: [9562],
  boxUl: [9564],
  boxUr: [9561],
  boxV: [9553],
  boxVH: [9580],
  boxVL: [9571],
  boxVR: [9568],
  boxVh: [9579],
  boxVl: [9570],
  boxVr: [9567],
  boxbox: [10697],
  boxdL: [9557],
  boxdR: [9554],
  boxdl: [9488],
  boxdr: [9484],
  boxh: [9472],
  boxhD: [9573],
  boxhU: [9576],
  boxhd: [9516],
  boxhu: [9524],
  boxminus: [8863],
  boxplus: [8862],
  boxtimes: [8864],
  boxuL: [9563],
  boxuR: [9560],
  boxul: [9496],
  boxur: [9492],
  boxv: [9474],
  boxvH: [9578],
  boxvL: [9569],
  boxvR: [9566],
  boxvh: [9532],
  boxvl: [9508],
  boxvr: [9500],
  bprime: [8245],
  breve: [728],
  brvbar: [166],
  bscr: [119991],
  bsemi: [8271],
  bsim: [8765],
  bsime: [8909],
  bsol: [92],
  bsolb: [10693],
  bsolhsub: [10184],
  bull: [8226],
  bullet: [8226],
  bump: [8782],
  bumpE: [10926],
  bumpe: [8783],
  bumpeq: [8783],
  cacute: [263],
  cap: [8745],
  capand: [10820],
  capbrcup: [10825],
  capcap: [10827],
  capcup: [10823],
  capdot: [10816],
  caps: [8745, 65024],
  caret: [8257],
  caron: [711],
  ccaps: [10829],
  ccaron: [269],
  ccedil: [231],
  ccirc: [265],
  ccups: [10828],
  ccupssm: [10832],
  cdot: [267],
  cedil: [184],
  cemptyv: [10674],
  cent: [162],
  centerdot: [183],
  cfr: [120096],
  chcy: [1095],
  check: [10003],
  checkmark: [10003],
  chi: [967],
  cir: [9675],
  cirE: [10691],
  circ: [710],
  circeq: [8791],
  circlearrowleft: [8634],
  circlearrowright: [8635],
  circledR: [174],
  circledS: [9416],
  circledast: [8859],
  circledcirc: [8858],
  circleddash: [8861],
  cire: [8791],
  cirfnint: [10768],
  cirmid: [10991],
  cirscir: [10690],
  clubs: [9827],
  clubsuit: [9827],
  colon: [58],
  colone: [8788],
  coloneq: [8788],
  comma: [44],
  commat: [64],
  comp: [8705],
  compfn: [8728],
  complement: [8705],
  complexes: [8450],
  cong: [8773],
  congdot: [10861],
  conint: [8750],
  copf: [120148],
  coprod: [8720],
  copy: [169],
  copysr: [8471],
  crarr: [8629],
  cross: [10007],
  cscr: [119992],
  csub: [10959],
  csube: [10961],
  csup: [10960],
  csupe: [10962],
  ctdot: [8943],
  cudarrl: [10552],
  cudarrr: [10549],
  cuepr: [8926],
  cuesc: [8927],
  cularr: [8630],
  cularrp: [10557],
  cup: [8746],
  cupbrcap: [10824],
  cupcap: [10822],
  cupcup: [10826],
  cupdot: [8845],
  cupor: [10821],
  cups: [8746, 65024],
  curarr: [8631],
  curarrm: [10556],
  curlyeqprec: [8926],
  curlyeqsucc: [8927],
  curlyvee: [8910],
  curlywedge: [8911],
  curren: [164],
  curvearrowleft: [8630],
  curvearrowright: [8631],
  cuvee: [8910],
  cuwed: [8911],
  cwconint: [8754],
  cwint: [8753],
  cylcty: [9005],
  dArr: [8659],
  dHar: [10597],
  dagger: [8224],
  daleth: [8504],
  darr: [8595],
  dash: [8208],
  dashv: [8867],
  dbkarow: [10511],
  dblac: [733],
  dcaron: [271],
  dcy: [1076],
  dd: [8518],
  ddagger: [8225],
  ddarr: [8650],
  ddotseq: [10871],
  deg: [176],
  delta: [948],
  demptyv: [10673],
  dfisht: [10623],
  dfr: [120097],
  dharl: [8643],
  dharr: [8642],
  diam: [8900],
  diamond: [8900],
  diamondsuit: [9830],
  diams: [9830],
  die: [168],
  digamma: [989],
  disin: [8946],
  div: [247],
  divide: [247],
  divideontimes: [8903],
  divonx: [8903],
  djcy: [1106],
  dlcorn: [8990],
  dlcrop: [8973],
  dollar: [36],
  dopf: [120149],
  dot: [729],
  doteq: [8784],
  doteqdot: [8785],
  dotminus: [8760],
  dotplus: [8724],
  dotsquare: [8865],
  doublebarwedge: [8966],
  downarrow: [8595],
  downdownarrows: [8650],
  downharpoonleft: [8643],
  downharpoonright: [8642],
  drbkarow: [10512],
  drcorn: [8991],
  drcrop: [8972],
  dscr: [119993],
  dscy: [1109],
  dsol: [10742],
  dstrok: [273],
  dtdot: [8945],
  dtri: [9663],
  dtrif: [9662],
  duarr: [8693],
  duhar: [10607],
  dwangle: [10662],
  dzcy: [1119],
  dzigrarr: [10239],
  eDDot: [10871],
  eDot: [8785],
  eacute: [233],
  easter: [10862],
  ecaron: [283],
  ecir: [8790],
  ecirc: [234],
  ecolon: [8789],
  ecy: [1101],
  edot: [279],
  ee: [8519],
  efDot: [8786],
  efr: [120098],
  eg: [10906],
  egrave: [232],
  egs: [10902],
  egsdot: [10904],
  el: [10905],
  elinters: [9191],
  ell: [8467],
  els: [10901],
  elsdot: [10903],
  emacr: [275],
  empty: [8709],
  emptyset: [8709],
  emptyv: [8709],
  emsp: [8195],
  emsp13: [8196],
  emsp14: [8197],
  eng: [331],
  ensp: [8194],
  eogon: [281],
  eopf: [120150],
  epar: [8917],
  eparsl: [10723],
  eplus: [10865],
  epsi: [949],
  epsilon: [949],
  epsiv: [1013],
  eqcirc: [8790],
  eqcolon: [8789],
  eqsim: [8770],
  eqslantgtr: [10902],
  eqslantless: [10901],
  equals: [61],
  equest: [8799],
  equiv: [8801],
  equivDD: [10872],
  eqvparsl: [10725],
  erDot: [8787],
  erarr: [10609],
  escr: [8495],
  esdot: [8784],
  esim: [8770],
  eta: [951],
  eth: [240],
  euml: [235],
  euro: [8364],
  excl: [33],
  exist: [8707],
  expectation: [8496],
  exponentiale: [8519],
  fallingdotseq: [8786],
  fcy: [1092],
  female: [9792],
  ffilig: [64259],
  fflig: [64256],
  ffllig: [64260],
  ffr: [120099],
  filig: [64257],
  fjlig: [102, 106],
  flat: [9837],
  fllig: [64258],
  fltns: [9649],
  fnof: [402],
  fopf: [120151],
  forall: [8704],
  fork: [8916],
  forkv: [10969],
  fpartint: [10765],
  frac12: [189],
  frac13: [8531],
  frac14: [188],
  frac15: [8533],
  frac16: [8537],
  frac18: [8539],
  frac23: [8532],
  frac25: [8534],
  frac34: [190],
  frac35: [8535],
  frac38: [8540],
  frac45: [8536],
  frac56: [8538],
  frac58: [8541],
  frac78: [8542],
  frasl: [8260],
  frown: [8994],
  fscr: [119995],
  gE: [8807],
  gEl: [10892],
  gacute: [501],
  gamma: [947],
  gammad: [989],
  gap: [10886],
  gbreve: [287],
  gcirc: [285],
  gcy: [1075],
  gdot: [289],
  ge: [8805],
  gel: [8923],
  geq: [8805],
  geqq: [8807],
  geqslant: [10878],
  ges: [10878],
  gescc: [10921],
  gesdot: [10880],
  gesdoto: [10882],
  gesdotol: [10884],
  gesl: [8923, 65024],
  gesles: [10900],
  gfr: [120100],
  gg: [8811],
  ggg: [8921],
  gimel: [8503],
  gjcy: [1107],
  gl: [8823],
  glE: [10898],
  gla: [10917],
  glj: [10916],
  gnE: [8809],
  gnap: [10890],
  gnapprox: [10890],
  gne: [10888],
  gneq: [10888],
  gneqq: [8809],
  gnsim: [8935],
  gopf: [120152],
  grave: [96],
  gscr: [8458],
  gsim: [8819],
  gsime: [10894],
  gsiml: [10896],
  gt: [62],
  gtcc: [10919],
  gtcir: [10874],
  gtdot: [8919],
  gtlPar: [10645],
  gtquest: [10876],
  gtrapprox: [10886],
  gtrarr: [10616],
  gtrdot: [8919],
  gtreqless: [8923],
  gtreqqless: [10892],
  gtrless: [8823],
  gtrsim: [8819],
  gvertneqq: [8809, 65024],
  gvnE: [8809, 65024],
  hArr: [8660],
  hairsp: [8202],
  half: [189],
  hamilt: [8459],
  hardcy: [1098],
  harr: [8596],
  harrcir: [10568],
  harrw: [8621],
  hbar: [8463],
  hcirc: [293],
  hearts: [9829],
  heartsuit: [9829],
  hellip: [8230],
  hercon: [8889],
  hfr: [120101],
  hksearow: [10533],
  hkswarow: [10534],
  hoarr: [8703],
  homtht: [8763],
  hookleftarrow: [8617],
  hookrightarrow: [8618],
  hopf: [120153],
  horbar: [8213],
  hscr: [119997],
  hslash: [8463],
  hstrok: [295],
  hybull: [8259],
  hyphen: [8208],
  iacute: [237],
  ic: [8291],
  icirc: [238],
  icy: [1080],
  iecy: [1077],
  iexcl: [161],
  iff: [8660],
  ifr: [120102],
  igrave: [236],
  ii: [8520],
  iiiint: [10764],
  iiint: [8749],
  iinfin: [10716],
  iiota: [8489],
  ijlig: [307],
  imacr: [299],
  image: [8465],
  imagline: [8464],
  imagpart: [8465],
  imath: [305],
  imof: [8887],
  imped: [437],
  "in": [8712],
  incare: [8453],
  infin: [8734],
  infintie: [10717],
  inodot: [305],
  "int": [8747],
  intcal: [8890],
  integers: [8484],
  intercal: [8890],
  intlarhk: [10775],
  intprod: [10812],
  iocy: [1105],
  iogon: [303],
  iopf: [120154],
  iota: [953],
  iprod: [10812],
  iquest: [191],
  iscr: [119998],
  isin: [8712],
  isinE: [8953],
  isindot: [8949],
  isins: [8948],
  isinsv: [8947],
  isinv: [8712],
  it: [8290],
  itilde: [297],
  iukcy: [1110],
  iuml: [239],
  jcirc: [309],
  jcy: [1081],
  jfr: [120103],
  jmath: [567],
  jopf: [120155],
  jscr: [119999],
  jsercy: [1112],
  jukcy: [1108],
  kappa: [954],
  kappav: [1008],
  kcedil: [311],
  kcy: [1082],
  kfr: [120104],
  kgreen: [312],
  khcy: [1093],
  kjcy: [1116],
  kopf: [120156],
  kscr: [120000],
  lAarr: [8666],
  lArr: [8656],
  lAtail: [10523],
  lBarr: [10510],
  lE: [8806],
  lEg: [10891],
  lHar: [10594],
  lacute: [314],
  laemptyv: [10676],
  lagran: [8466],
  lambda: [955],
  lang: [10216],
  langd: [10641],
  langle: [10216],
  lap: [10885],
  laquo: [171],
  larr: [8592],
  larrb: [8676],
  larrbfs: [10527],
  larrfs: [10525],
  larrhk: [8617],
  larrlp: [8619],
  larrpl: [10553],
  larrsim: [10611],
  larrtl: [8610],
  lat: [10923],
  latail: [10521],
  late: [10925],
  lates: [10925, 65024],
  lbarr: [10508],
  lbbrk: [10098],
  lbrace: [123],
  lbrack: [91],
  lbrke: [10635],
  lbrksld: [10639],
  lbrkslu: [10637],
  lcaron: [318],
  lcedil: [316],
  lceil: [8968],
  lcub: [123],
  lcy: [1083],
  ldca: [10550],
  ldquo: [8220],
  ldquor: [8222],
  ldrdhar: [10599],
  ldrushar: [10571],
  ldsh: [8626],
  le: [8804],
  leftarrow: [8592],
  leftarrowtail: [8610],
  leftharpoondown: [8637],
  leftharpoonup: [8636],
  leftleftarrows: [8647],
  leftrightarrow: [8596],
  leftrightarrows: [8646],
  leftrightharpoons: [8651],
  leftrightsquigarrow: [8621],
  leftthreetimes: [8907],
  leg: [8922],
  leq: [8804],
  leqq: [8806],
  leqslant: [10877],
  les: [10877],
  lescc: [10920],
  lesdot: [10879],
  lesdoto: [10881],
  lesdotor: [10883],
  lesg: [8922, 65024],
  lesges: [10899],
  lessapprox: [10885],
  lessdot: [8918],
  lesseqgtr: [8922],
  lesseqqgtr: [10891],
  lessgtr: [8822],
  lesssim: [8818],
  lfisht: [10620],
  lfloor: [8970],
  lfr: [120105],
  lg: [8822],
  lgE: [10897],
  lhard: [8637],
  lharu: [8636],
  lharul: [10602],
  lhblk: [9604],
  ljcy: [1113],
  ll: [8810],
  llarr: [8647],
  llcorner: [8990],
  llhard: [10603],
  lltri: [9722],
  lmidot: [320],
  lmoust: [9136],
  lmoustache: [9136],
  lnE: [8808],
  lnap: [10889],
  lnapprox: [10889],
  lne: [10887],
  lneq: [10887],
  lneqq: [8808],
  lnsim: [8934],
  loang: [10220],
  loarr: [8701],
  lobrk: [10214],
  longleftarrow: [10229],
  longleftrightarrow: [10231],
  longmapsto: [10236],
  longrightarrow: [10230],
  looparrowleft: [8619],
  looparrowright: [8620],
  lopar: [10629],
  lopf: [120157],
  loplus: [10797],
  lotimes: [10804],
  lowast: [8727],
  lowbar: [95],
  loz: [9674],
  lozenge: [9674],
  lozf: [10731],
  lpar: [40],
  lparlt: [10643],
  lrarr: [8646],
  lrcorner: [8991],
  lrhar: [8651],
  lrhard: [10605],
  lrm: [8206],
  lrtri: [8895],
  lsaquo: [8249],
  lscr: [120001],
  lsh: [8624],
  lsim: [8818],
  lsime: [10893],
  lsimg: [10895],
  lsqb: [91],
  lsquo: [8216],
  lsquor: [8218],
  lstrok: [322],
  lt: [60],
  ltcc: [10918],
  ltcir: [10873],
  ltdot: [8918],
  lthree: [8907],
  ltimes: [8905],
  ltlarr: [10614],
  ltquest: [10875],
  ltrPar: [10646],
  ltri: [9667],
  ltrie: [8884],
  ltrif: [9666],
  lurdshar: [10570],
  luruhar: [10598],
  lvertneqq: [8808, 65024],
  lvnE: [8808, 65024],
  mDDot: [8762],
  macr: [175],
  male: [9794],
  malt: [10016],
  maltese: [10016],
  map: [8614],
  mapsto: [8614],
  mapstodown: [8615],
  mapstoleft: [8612],
  mapstoup: [8613],
  marker: [9646],
  mcomma: [10793],
  mcy: [1084],
  mdash: [8212],
  measuredangle: [8737],
  mfr: [120106],
  mho: [8487],
  micro: [181],
  mid: [8739],
  midast: [42],
  midcir: [10992],
  middot: [183],
  minus: [8722],
  minusb: [8863],
  minusd: [8760],
  minusdu: [10794],
  mlcp: [10971],
  mldr: [8230],
  mnplus: [8723],
  models: [8871],
  mopf: [120158],
  mp: [8723],
  mscr: [120002],
  mstpos: [8766],
  mu: [956],
  multimap: [8888],
  mumap: [8888],
  nGg: [8921, 824],
  nGt: [8811, 8402],
  nGtv: [8811, 824],
  nLeftarrow: [8653],
  nLeftrightarrow: [8654],
  nLl: [8920, 824],
  nLt: [8810, 8402],
  nLtv: [8810, 824],
  nRightarrow: [8655],
  nVDash: [8879],
  nVdash: [8878],
  nabla: [8711],
  nacute: [324],
  nang: [8736, 8402],
  nap: [8777],
  napE: [10864, 824],
  napid: [8779, 824],
  napos: [329],
  napprox: [8777],
  natur: [9838],
  natural: [9838],
  naturals: [8469],
  nbsp: [160],
  nbump: [8782, 824],
  nbumpe: [8783, 824],
  ncap: [10819],
  ncaron: [328],
  ncedil: [326],
  ncong: [8775],
  ncongdot: [10861, 824],
  ncup: [10818],
  ncy: [1085],
  ndash: [8211],
  ne: [8800],
  neArr: [8663],
  nearhk: [10532],
  nearr: [8599],
  nearrow: [8599],
  nedot: [8784, 824],
  nequiv: [8802],
  nesear: [10536],
  nesim: [8770, 824],
  nexist: [8708],
  nexists: [8708],
  nfr: [120107],
  ngE: [8807, 824],
  nge: [8817],
  ngeq: [8817],
  ngeqq: [8807, 824],
  ngeqslant: [10878, 824],
  nges: [10878, 824],
  ngsim: [8821],
  ngt: [8815],
  ngtr: [8815],
  nhArr: [8654],
  nharr: [8622],
  nhpar: [10994],
  ni: [8715],
  nis: [8956],
  nisd: [8954],
  niv: [8715],
  njcy: [1114],
  nlArr: [8653],
  nlE: [8806, 824],
  nlarr: [8602],
  nldr: [8229],
  nle: [8816],
  nleftarrow: [8602],
  nleftrightarrow: [8622],
  nleq: [8816],
  nleqq: [8806, 824],
  nleqslant: [10877, 824],
  nles: [10877, 824],
  nless: [8814],
  nlsim: [8820],
  nlt: [8814],
  nltri: [8938],
  nltrie: [8940],
  nmid: [8740],
  nopf: [120159],
  not: [172],
  notin: [8713],
  notinE: [8953, 824],
  notindot: [8949, 824],
  notinva: [8713],
  notinvb: [8951],
  notinvc: [8950],
  notni: [8716],
  notniva: [8716],
  notnivb: [8958],
  notnivc: [8957],
  npar: [8742],
  nparallel: [8742],
  nparsl: [11005, 8421],
  npart: [8706, 824],
  npolint: [10772],
  npr: [8832],
  nprcue: [8928],
  npre: [10927, 824],
  nprec: [8832],
  npreceq: [10927, 824],
  nrArr: [8655],
  nrarr: [8603],
  nrarrc: [10547, 824],
  nrarrw: [8605, 824],
  nrightarrow: [8603],
  nrtri: [8939],
  nrtrie: [8941],
  nsc: [8833],
  nsccue: [8929],
  nsce: [10928, 824],
  nscr: [120003],
  nshortmid: [8740],
  nshortparallel: [8742],
  nsim: [8769],
  nsime: [8772],
  nsimeq: [8772],
  nsmid: [8740],
  nspar: [8742],
  nsqsube: [8930],
  nsqsupe: [8931],
  nsub: [8836],
  nsubE: [10949, 824],
  nsube: [8840],
  nsubset: [8834, 8402],
  nsubseteq: [8840],
  nsubseteqq: [10949, 824],
  nsucc: [8833],
  nsucceq: [10928, 824],
  nsup: [8837],
  nsupE: [10950, 824],
  nsupe: [8841],
  nsupset: [8835, 8402],
  nsupseteq: [8841],
  nsupseteqq: [10950, 824],
  ntgl: [8825],
  ntilde: [241],
  ntlg: [8824],
  ntriangleleft: [8938],
  ntrianglelefteq: [8940],
  ntriangleright: [8939],
  ntrianglerighteq: [8941],
  nu: [957],
  num: [35],
  numero: [8470],
  numsp: [8199],
  nvDash: [8877],
  nvHarr: [10500],
  nvap: [8781, 8402],
  nvdash: [8876],
  nvge: [8805, 8402],
  nvgt: [62, 8402],
  nvinfin: [10718],
  nvlArr: [10498],
  nvle: [8804, 8402],
  nvlt: [60, 8402],
  nvltrie: [8884, 8402],
  nvrArr: [10499],
  nvrtrie: [8885, 8402],
  nvsim: [8764, 8402],
  nwArr: [8662],
  nwarhk: [10531],
  nwarr: [8598],
  nwarrow: [8598],
  nwnear: [10535],
  oS: [9416],
  oacute: [243],
  oast: [8859],
  ocir: [8858],
  ocirc: [244],
  ocy: [1086],
  odash: [8861],
  odblac: [337],
  odiv: [10808],
  odot: [8857],
  odsold: [10684],
  oelig: [339],
  ofcir: [10687],
  ofr: [120108],
  ogon: [731],
  ograve: [242],
  ogt: [10689],
  ohbar: [10677],
  ohm: [937],
  oint: [8750],
  olarr: [8634],
  olcir: [10686],
  olcross: [10683],
  oline: [8254],
  olt: [10688],
  omacr: [333],
  omega: [969],
  omicron: [959],
  omid: [10678],
  ominus: [8854],
  oopf: [120160],
  opar: [10679],
  operp: [10681],
  oplus: [8853],
  or: [8744],
  orarr: [8635],
  ord: [10845],
  order: [8500],
  orderof: [8500],
  ordf: [170],
  ordm: [186],
  origof: [8886],
  oror: [10838],
  orslope: [10839],
  orv: [10843],
  oscr: [8500],
  oslash: [248],
  osol: [8856],
  otilde: [245],
  otimes: [8855],
  otimesas: [10806],
  ouml: [246],
  ovbar: [9021],
  par: [8741],
  para: [182],
  parallel: [8741],
  parsim: [10995],
  parsl: [11005],
  part: [8706],
  pcy: [1087],
  percnt: [37],
  period: [46],
  permil: [8240],
  perp: [8869],
  pertenk: [8241],
  pfr: [120109],
  phi: [966],
  phiv: [981],
  phmmat: [8499],
  phone: [9742],
  pi: [960],
  pitchfork: [8916],
  piv: [982],
  planck: [8463],
  planckh: [8462],
  plankv: [8463],
  plus: [43],
  plusacir: [10787],
  plusb: [8862],
  pluscir: [10786],
  plusdo: [8724],
  plusdu: [10789],
  pluse: [10866],
  plusmn: [177],
  plussim: [10790],
  plustwo: [10791],
  pm: [177],
  pointint: [10773],
  popf: [120161],
  pound: [163],
  pr: [8826],
  prE: [10931],
  prap: [10935],
  prcue: [8828],
  pre: [10927],
  prec: [8826],
  precapprox: [10935],
  preccurlyeq: [8828],
  preceq: [10927],
  precnapprox: [10937],
  precneqq: [10933],
  precnsim: [8936],
  precsim: [8830],
  prime: [8242],
  primes: [8473],
  prnE: [10933],
  prnap: [10937],
  prnsim: [8936],
  prod: [8719],
  profalar: [9006],
  profline: [8978],
  profsurf: [8979],
  prop: [8733],
  propto: [8733],
  prsim: [8830],
  prurel: [8880],
  pscr: [120005],
  psi: [968],
  puncsp: [8200],
  qfr: [120110],
  qint: [10764],
  qopf: [120162],
  qprime: [8279],
  qscr: [120006],
  quaternions: [8461],
  quatint: [10774],
  quest: [63],
  questeq: [8799],
  quot: [34],
  rAarr: [8667],
  rArr: [8658],
  rAtail: [10524],
  rBarr: [10511],
  rHar: [10596],
  race: [8765, 817],
  racute: [341],
  radic: [8730],
  raemptyv: [10675],
  rang: [10217],
  rangd: [10642],
  range: [10661],
  rangle: [10217],
  raquo: [187],
  rarr: [8594],
  rarrap: [10613],
  rarrb: [8677],
  rarrbfs: [10528],
  rarrc: [10547],
  rarrfs: [10526],
  rarrhk: [8618],
  rarrlp: [8620],
  rarrpl: [10565],
  rarrsim: [10612],
  rarrtl: [8611],
  rarrw: [8605],
  ratail: [10522],
  ratio: [8758],
  rationals: [8474],
  rbarr: [10509],
  rbbrk: [10099],
  rbrace: [125],
  rbrack: [93],
  rbrke: [10636],
  rbrksld: [10638],
  rbrkslu: [10640],
  rcaron: [345],
  rcedil: [343],
  rceil: [8969],
  rcub: [125],
  rcy: [1088],
  rdca: [10551],
  rdldhar: [10601],
  rdquo: [8221],
  rdquor: [8221],
  rdsh: [8627],
  real: [8476],
  realine: [8475],
  realpart: [8476],
  reals: [8477],
  rect: [9645],
  reg: [174],
  rfisht: [10621],
  rfloor: [8971],
  rfr: [120111],
  rhard: [8641],
  rharu: [8640],
  rharul: [10604],
  rho: [961],
  rhov: [1009],
  rightarrow: [8594],
  rightarrowtail: [8611],
  rightharpoondown: [8641],
  rightharpoonup: [8640],
  rightleftarrows: [8644],
  rightleftharpoons: [8652],
  rightrightarrows: [8649],
  rightsquigarrow: [8605],
  rightthreetimes: [8908],
  ring: [730],
  risingdotseq: [8787],
  rlarr: [8644],
  rlhar: [8652],
  rlm: [8207],
  rmoust: [9137],
  rmoustache: [9137],
  rnmid: [10990],
  roang: [10221],
  roarr: [8702],
  robrk: [10215],
  ropar: [10630],
  ropf: [120163],
  roplus: [10798],
  rotimes: [10805],
  rpar: [41],
  rpargt: [10644],
  rppolint: [10770],
  rrarr: [8649],
  rsaquo: [8250],
  rscr: [120007],
  rsh: [8625],
  rsqb: [93],
  rsquo: [8217],
  rsquor: [8217],
  rthree: [8908],
  rtimes: [8906],
  rtri: [9657],
  rtrie: [8885],
  rtrif: [9656],
  rtriltri: [10702],
  ruluhar: [10600],
  rx: [8478],
  sacute: [347],
  sbquo: [8218],
  sc: [8827],
  scE: [10932],
  scap: [10936],
  scaron: [353],
  sccue: [8829],
  sce: [10928],
  scedil: [351],
  scirc: [349],
  scnE: [10934],
  scnap: [10938],
  scnsim: [8937],
  scpolint: [10771],
  scsim: [8831],
  scy: [1089],
  sdot: [8901],
  sdotb: [8865],
  sdote: [10854],
  seArr: [8664],
  searhk: [10533],
  searr: [8600],
  searrow: [8600],
  sect: [167],
  semi: [59],
  seswar: [10537],
  setminus: [8726],
  setmn: [8726],
  sext: [10038],
  sfr: [120112],
  sfrown: [8994],
  sharp: [9839],
  shchcy: [1097],
  shcy: [1096],
  shortmid: [8739],
  shortparallel: [8741],
  shy: [173],
  sigma: [963],
  sigmaf: [962],
  sigmav: [962],
  sim: [8764],
  simdot: [10858],
  sime: [8771],
  simeq: [8771],
  simg: [10910],
  simgE: [10912],
  siml: [10909],
  simlE: [10911],
  simne: [8774],
  simplus: [10788],
  simrarr: [10610],
  slarr: [8592],
  smallsetminus: [8726],
  smashp: [10803],
  smeparsl: [10724],
  smid: [8739],
  smile: [8995],
  smt: [10922],
  smte: [10924],
  smtes: [10924, 65024],
  softcy: [1100],
  sol: [47],
  solb: [10692],
  solbar: [9023],
  sopf: [120164],
  spades: [9824],
  spadesuit: [9824],
  spar: [8741],
  sqcap: [8851],
  sqcaps: [8851, 65024],
  sqcup: [8852],
  sqcups: [8852, 65024],
  sqsub: [8847],
  sqsube: [8849],
  sqsubset: [8847],
  sqsubseteq: [8849],
  sqsup: [8848],
  sqsupe: [8850],
  sqsupset: [8848],
  sqsupseteq: [8850],
  squ: [9633],
  square: [9633],
  squarf: [9642],
  squf: [9642],
  srarr: [8594],
  sscr: [120008],
  ssetmn: [8726],
  ssmile: [8995],
  sstarf: [8902],
  star: [9734],
  starf: [9733],
  straightepsilon: [1013],
  straightphi: [981],
  strns: [175],
  sub: [8834],
  subE: [10949],
  subdot: [10941],
  sube: [8838],
  subedot: [10947],
  submult: [10945],
  subnE: [10955],
  subne: [8842],
  subplus: [10943],
  subrarr: [10617],
  subset: [8834],
  subseteq: [8838],
  subseteqq: [10949],
  subsetneq: [8842],
  subsetneqq: [10955],
  subsim: [10951],
  subsub: [10965],
  subsup: [10963],
  succ: [8827],
  succapprox: [10936],
  succcurlyeq: [8829],
  succeq: [10928],
  succnapprox: [10938],
  succneqq: [10934],
  succnsim: [8937],
  succsim: [8831],
  sum: [8721],
  sung: [9834],
  sup: [8835],
  sup1: [185],
  sup2: [178],
  sup3: [179],
  supE: [10950],
  supdot: [10942],
  supdsub: [10968],
  supe: [8839],
  supedot: [10948],
  suphsol: [10185],
  suphsub: [10967],
  suplarr: [10619],
  supmult: [10946],
  supnE: [10956],
  supne: [8843],
  supplus: [10944],
  supset: [8835],
  supseteq: [8839],
  supseteqq: [10950],
  supsetneq: [8843],
  supsetneqq: [10956],
  supsim: [10952],
  supsub: [10964],
  supsup: [10966],
  swArr: [8665],
  swarhk: [10534],
  swarr: [8601],
  swarrow: [8601],
  swnwar: [10538],
  szlig: [223],
  target: [8982],
  tau: [964],
  tbrk: [9140],
  tcaron: [357],
  tcedil: [355],
  tcy: [1090],
  tdot: [8411],
  telrec: [8981],
  tfr: [120113],
  there4: [8756],
  therefore: [8756],
  theta: [952],
  thetasym: [977],
  thetav: [977],
  thickapprox: [8776],
  thicksim: [8764],
  thinsp: [8201],
  thkap: [8776],
  thksim: [8764],
  thorn: [254],
  tilde: [732],
  times: [215],
  timesb: [8864],
  timesbar: [10801],
  timesd: [10800],
  tint: [8749],
  toea: [10536],
  top: [8868],
  topbot: [9014],
  topcir: [10993],
  topf: [120165],
  topfork: [10970],
  tosa: [10537],
  tprime: [8244],
  trade: [8482],
  triangle: [9653],
  triangledown: [9663],
  triangleleft: [9667],
  trianglelefteq: [8884],
  triangleq: [8796],
  triangleright: [9657],
  trianglerighteq: [8885],
  tridot: [9708],
  trie: [8796],
  triminus: [10810],
  triplus: [10809],
  trisb: [10701],
  tritime: [10811],
  trpezium: [9186],
  tscr: [120009],
  tscy: [1094],
  tshcy: [1115],
  tstrok: [359],
  twixt: [8812],
  twoheadleftarrow: [8606],
  twoheadrightarrow: [8608],
  uArr: [8657],
  uHar: [10595],
  uacute: [250],
  uarr: [8593],
  ubrcy: [1118],
  ubreve: [365],
  ucirc: [251],
  ucy: [1091],
  udarr: [8645],
  udblac: [369],
  udhar: [10606],
  ufisht: [10622],
  ufr: [120114],
  ugrave: [249],
  uharl: [8639],
  uharr: [8638],
  uhblk: [9600],
  ulcorn: [8988],
  ulcorner: [8988],
  ulcrop: [8975],
  ultri: [9720],
  umacr: [363],
  uml: [168],
  uogon: [371],
  uopf: [120166],
  uparrow: [8593],
  updownarrow: [8597],
  upharpoonleft: [8639],
  upharpoonright: [8638],
  uplus: [8846],
  upsi: [965],
  upsih: [978],
  upsilon: [965],
  upuparrows: [8648],
  urcorn: [8989],
  urcorner: [8989],
  urcrop: [8974],
  uring: [367],
  urtri: [9721],
  uscr: [120010],
  utdot: [8944],
  utilde: [361],
  utri: [9653],
  utrif: [9652],
  uuarr: [8648],
  uuml: [252],
  uwangle: [10663],
  vArr: [8661],
  vBar: [10984],
  vBarv: [10985],
  vDash: [8872],
  vangrt: [10652],
  varepsilon: [1013],
  varkappa: [1008],
  varnothing: [8709],
  varphi: [981],
  varpi: [982],
  varpropto: [8733],
  varr: [8597],
  varrho: [1009],
  varsigma: [962],
  varsubsetneq: [8842, 65024],
  varsubsetneqq: [10955, 65024],
  varsupsetneq: [8843, 65024],
  varsupsetneqq: [10956, 65024],
  vartheta: [977],
  vartriangleleft: [8882],
  vartriangleright: [8883],
  vcy: [1074],
  vdash: [8866],
  vee: [8744],
  veebar: [8891],
  veeeq: [8794],
  vellip: [8942],
  verbar: [124],
  vert: [124],
  vfr: [120115],
  vltri: [8882],
  vnsub: [8834, 8402],
  vnsup: [8835, 8402],
  vopf: [120167],
  vprop: [8733],
  vrtri: [8883],
  vscr: [120011],
  vsubnE: [10955, 65024],
  vsubne: [8842, 65024],
  vsupnE: [10956, 65024],
  vsupne: [8843, 65024],
  vzigzag: [10650],
  wcirc: [373],
  wedbar: [10847],
  wedge: [8743],
  wedgeq: [8793],
  weierp: [8472],
  wfr: [120116],
  wopf: [120168],
  wp: [8472],
  wr: [8768],
  wreath: [8768],
  wscr: [120012],
  xcap: [8898],
  xcirc: [9711],
  xcup: [8899],
  xdtri: [9661],
  xfr: [120117],
  xhArr: [10234],
  xharr: [10231],
  xi: [958],
  xlArr: [10232],
  xlarr: [10229],
  xmap: [10236],
  xnis: [8955],
  xodot: [10752],
  xopf: [120169],
  xoplus: [10753],
  xotime: [10754],
  xrArr: [10233],
  xrarr: [10230],
  xscr: [120013],
  xsqcup: [10758],
  xuplus: [10756],
  xutri: [9651],
  xvee: [8897],
  xwedge: [8896],
  yacute: [253],
  yacy: [1103],
  ycirc: [375],
  ycy: [1099],
  yen: [165],
  yfr: [120118],
  yicy: [1111],
  yopf: [120170],
  yscr: [120014],
  yucy: [1102],
  yuml: [255],
  zacute: [378],
  zcaron: [382],
  zcy: [1079],
  zdot: [380],
  zeetrf: [8488],
  zeta: [950],
  zfr: [120119],
  zhcy: [1078],
  zigrarr: [8669],
  zopf: [120171],
  zscr: [120015],
  zwj: [8205],
  zwnj: [8204]
};
},{}],68:[function(require,module,exports){
'use strict';

function EntityParser(namedCodepoints) {
  this.namedCodepoints = namedCodepoints;
}

EntityParser.prototype.parse = function (tokenizer) {
  var input = tokenizer.input.slice(tokenizer.char);
  var matches = input.match(/^#(?:x|X)([0-9A-Fa-f]+);/);
  if (matches) {
    tokenizer.char += matches[0].length;
    return String.fromCharCode(parseInt(matches[1], 16));
  }
  matches = input.match(/^#([0-9]+);/);
  if (matches) {
    tokenizer.char += matches[0].length;
    return String.fromCharCode(parseInt(matches[1], 10));
  }
  matches = input.match(/^([A-Za-z]+);/);
  if (matches) {
    var codepoints = this.namedCodepoints[matches[1]];
    if (codepoints) {
      tokenizer.char += matches[0].length;
      for (var i = 0, buffer = ''; i < codepoints.length; i++) {
        buffer += String.fromCharCode(codepoints[i]);
      }
      return buffer;
    }
  }
};

exports['default'] = EntityParser;
},{}],69:[function(require,module,exports){
'use strict';

var Generator = require('./generator');



exports['default'] = generate;
function generate(tokens) {
  var generator = new Generator['default']();
  return generator.generate(tokens);
}
},{"./generator":70}],70:[function(require,module,exports){
'use strict';

var escape = (function () {
  var test = /[&<>"'`]/;
  var replace = /[&<>"'`]/g;
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#x27;",
    "`": "&#x60;"
  };
  function escapeChar(char) {
    return map[char];
  }
  return function escape(string) {
    if (!test.test(string)) {
      return string;
    }
    return string.replace(replace, escapeChar);
  };
})();

function Generator() {
  this.escape = escape;
}

Generator.prototype = {
  generate: function (tokens) {
    var buffer = "";
    var token;
    for (var i = 0; i < tokens.length; i++) {
      token = tokens[i];
      buffer += this[token.type](token);
    }
    return buffer;
  },

  escape: function (text) {
    var unsafeCharsMap = this.unsafeCharsMap;
    return text.replace(this.unsafeChars, function (char) {
      return unsafeCharsMap[char] || char;
    });
  },

  StartTag: function (token) {
    var out = "<";
    out += token.tagName;

    if (token.attributes.length) {
      out += " " + this.Attributes(token.attributes);
    }

    out += ">";

    return out;
  },

  EndTag: function (token) {
    return "</" + token.tagName + ">";
  },

  Chars: function (token) {
    return this.escape(token.chars);
  },

  Comment: function (token) {
    return "<!--" + token.chars + "-->";
  },

  Attributes: function (attributes) {
    var out = [],
        attribute;

    for (var i = 0, l = attributes.length; i < l; i++) {
      attribute = attributes[i];

      out.push(this.Attribute(attribute[0], attribute[1]));
    }

    return out.join(" ");
  },

  Attribute: function (name, value) {
    var attrString = name;

    if (value) {
      value = this.escape(value);
      attrString += "=\"" + value + "\"";
    }

    return attrString;
  }
};

exports['default'] = Generator;
},{}],71:[function(require,module,exports){
'use strict';

var Tokenizer = require('./tokenizer');
var EntityParser = require('./entity-parser');
var namedCodepoints = require('./char-refs/full');



exports['default'] = tokenize;
function tokenize(input) {
  var tokenizer = new Tokenizer['default'](new EntityParser['default'](namedCodepoints['default']));
  return tokenizer.tokenize(input);
}
},{"./char-refs/full":67,"./entity-parser":68,"./tokenizer":72}],72:[function(require,module,exports){
'use strict';

var utils = require('./utils');
var ___tokens = require('./tokens');

function Tokenizer(entityParser) {
  this.entityParser = entityParser;

  this.input = null;
  this.state = null;
  this.token = null;

  this.char = -1;
  this.line = -1;
  this.column = -1;

  this.startLine = -1;
  this.startColumn = -1;

  this.reset();
}

Tokenizer.prototype = {
  reset: function () {
    this.input = '';
    this.state = 'data';
    this.token = null;

    this.char = 0;
    this.line = 1;
    this.column = 0;

    this.startLine = 1;
    this.startColumn = 0;
  },

  tokenize: function (input) {
    this.reset();

    var tokens = this.tokenizePart(input);
    var trailingToken = this.tokenizeEOF();

    if (trailingToken) {
      tokens.push(trailingToken);
    }

    return tokens;
  },

  tokenizePart: function (input) {
    this.input += utils.preprocessInput(input);

    var tokens = [];

    while (true) {
      var token = this.lex();

      if (token) {
        tokens.push(token);
      } else {
        break;
      }
    }

    return tokens;
  },

  tokenizeEOF: function () {
    return this.emitToken();
  },

  lex: function () {
    while (this.char < this.input.length) {
      var char = this.input.charAt(this.char++);
      if (char) {
        if (char === '\n') {
          this.line++;
          this.column = 0;
        } else {
          this.column++;
        }

        var token = this.states[this.state].call(this, char);
        if (token) {
          return token;
        }
      }
    }
  },

  addLocInfo: function (_endLine, _endColumn) {
    var endLine = _endLine === undefined ? this.line : _endLine;
    var endColumn = _endColumn === undefined ? this.column : _endColumn;

    this.token.loc = {
      start: {
        line: this.startLine,
        column: this.startColumn
      },
      end: {
        line: endLine,
        column: endColumn
      }
    };

    this.startLine = endLine;
    this.startColumn = endColumn;
  },

  createTag: function (Type, char) {
    var lastToken = this.token;
    this.token = new Type(char);
    this.state = 'tagName';
    return lastToken;
  },

  addToTagName: function (char) {
    this.token.tagName += char;
  },

  selfClosing: function () {
    this.token.selfClosing = true;
  },

  createAttribute: function (char) {
    this._currentAttribute = [char.toLowerCase(), '', null];
    this.token.attributes.push(this._currentAttribute);
    this.state = 'attributeName';
  },

  addToAttributeName: function (char) {
    this._currentAttribute[0] += char;
  },

  markAttributeQuoted: function (value) {
    this._currentAttribute[2] = value;
  },

  finalizeAttributeValue: function () {
    if (this._currentAttribute) {
      if (this._currentAttribute[2] === null) {
        this._currentAttribute[2] = false;
      }
      this._currentAttribute = undefined;
    }
  },

  addToAttributeValue: function (char) {
    this._currentAttribute[1] = this._currentAttribute[1] || '';
    this._currentAttribute[1] += char;
  },

  createComment: function () {
    var lastToken = this.token;
    this.token = new ___tokens.Comment();
    this.state = 'commentStart';
    return lastToken;
  },

  addToComment: function (char) {
    this.addChar(char);
  },

  addChar: function (char) {
    this.token.chars += char;
  },

  finalizeToken: function () {
    if (this.token.type === 'StartTag') {
      this.finalizeAttributeValue();
    }
  },

  emitData: function () {
    var token = this.token;
    if (token) {
      this.addLocInfo(this.line, this.column - 1);
    }

    this.token = null;
    this.state = 'tagOpen';

    return token;
  },

  emitToken: function () {
    var token = this.token;
    if (token) {
      this.addLocInfo();
      this.finalizeToken();
    }

    this.token = null;
    this.state = 'data';

    return token;
  },

  addData: function (char) {
    if (this.token === null) {
      this.token = new ___tokens.Chars();
    }

    this.addChar(char);
  },

  consumeCharRef: function () {
    return this.entityParser.parse(this);
  },

  states: {
    data: function (char) {
      if (char === '<') {
        var chars = this.emitData();
        return chars;
      } else if (char === '&') {
        this.addData(this.consumeCharRef() || '&');
      } else {
        this.addData(char);
      }
    },

    tagOpen: function (char) {
      if (char === '!') {
        this.state = 'markupDeclaration';
      } else if (char === '/') {
        this.state = 'endTagOpen';
      } else if (utils.isAlpha(char)) {
        return this.createTag(___tokens.StartTag, char.toLowerCase());
      }
    },

    markupDeclaration: function (char) {
      if (char === '-' && this.input.charAt(this.char) === '-') {
        this.char++;
        this.createComment();
      }
    },

    commentStart: function (char) {
      if (char === '-') {
        this.state = 'commentStartDash';
      } else if (char === '>') {
        return this.emitToken();
      } else {
        this.addToComment(char);
        this.state = 'comment';
      }
    },

    commentStartDash: function (char) {
      if (char === '-') {
        this.state = 'commentEnd';
      } else if (char === '>') {
        return this.emitToken();
      } else {
        this.addToComment('-');
        this.state = 'comment';
      }
    },

    comment: function (char) {
      if (char === '-') {
        this.state = 'commentEndDash';
      } else {
        this.addToComment(char);
      }
    },

    commentEndDash: function (char) {
      if (char === '-') {
        this.state = 'commentEnd';
      } else {
        this.addToComment('-' + char);
        this.state = 'comment';
      }
    },

    commentEnd: function (char) {
      if (char === '>') {
        return this.emitToken();
      } else {
        this.addToComment('--' + char);
        this.state = 'comment';
      }
    },

    tagName: function (char) {
      if (utils.isSpace(char)) {
        this.state = 'beforeAttributeName';
      } else if (char === '/') {
        this.state = 'selfClosingStartTag';
      } else if (char === '>') {
        return this.emitToken();
      } else {
        this.addToTagName(char);
      }
    },

    beforeAttributeName: function (char) {
      if (utils.isSpace(char)) {
        return;
      } else if (char === '/') {
        this.state = 'selfClosingStartTag';
      } else if (char === '>') {
        return this.emitToken();
      } else {
        this.createAttribute(char);
      }
    },

    attributeName: function (char) {
      if (utils.isSpace(char)) {
        this.state = 'afterAttributeName';
      } else if (char === '/') {
        this.state = 'selfClosingStartTag';
      } else if (char === '=') {
        this.state = 'beforeAttributeValue';
      } else if (char === '>') {
        return this.emitToken();
      } else {
        this.addToAttributeName(char);
      }
    },

    afterAttributeName: function (char) {
      if (utils.isSpace(char)) {
        return;
      } else if (char === '/') {
        this.state = 'selfClosingStartTag';
      } else if (char === '=') {
        this.state = 'beforeAttributeValue';
      } else if (char === '>') {
        return this.emitToken();
      } else {
        this.finalizeAttributeValue();
        this.createAttribute(char);
      }
    },

    beforeAttributeValue: function (char) {
      if (utils.isSpace(char)) {
        return;
      } else if (char === '"') {
        this.state = 'attributeValueDoubleQuoted';
        this.markAttributeQuoted(true);
      } else if (char === '\'') {
        this.state = 'attributeValueSingleQuoted';
        this.markAttributeQuoted(true);
      } else if (char === '>') {
        return this.emitToken();
      } else {
        this.state = 'attributeValueUnquoted';
        this.markAttributeQuoted(false);
        this.addToAttributeValue(char);
      }
    },

    attributeValueDoubleQuoted: function (char) {
      if (char === '"') {
        this.finalizeAttributeValue();
        this.state = 'afterAttributeValueQuoted';
      } else if (char === '&') {
        this.addToAttributeValue(this.consumeCharRef('"') || '&');
      } else {
        this.addToAttributeValue(char);
      }
    },

    attributeValueSingleQuoted: function (char) {
      if (char === '\'') {
        this.finalizeAttributeValue();
        this.state = 'afterAttributeValueQuoted';
      } else if (char === '&') {
        this.addToAttributeValue(this.consumeCharRef('\'') || '&');
      } else {
        this.addToAttributeValue(char);
      }
    },

    attributeValueUnquoted: function (char) {
      if (utils.isSpace(char)) {
        this.finalizeAttributeValue();
        this.state = 'beforeAttributeName';
      } else if (char === '&') {
        this.addToAttributeValue(this.consumeCharRef('>') || '&');
      } else if (char === '>') {
        return this.emitToken();
      } else {
        this.addToAttributeValue(char);
      }
    },

    afterAttributeValueQuoted: function (char) {
      if (utils.isSpace(char)) {
        this.state = 'beforeAttributeName';
      } else if (char === '/') {
        this.state = 'selfClosingStartTag';
      } else if (char === '>') {
        return this.emitToken();
      } else {
        this.char--;
        this.state = 'beforeAttributeName';
      }
    },

    selfClosingStartTag: function (char) {
      if (char === '>') {
        this.selfClosing();
        return this.emitToken();
      } else {
        this.char--;
        this.state = 'beforeAttributeName';
      }
    },

    endTagOpen: function (char) {
      if (utils.isAlpha(char)) {
        this.createTag(___tokens.EndTag, char.toLowerCase());
      }
    }
  }
};

exports['default'] = Tokenizer;
},{"./tokens":73,"./utils":74}],73:[function(require,module,exports){
'use strict';

exports.StartTag = StartTag;
exports.EndTag = EndTag;
exports.Chars = Chars;
exports.Comment = Comment;

function StartTag(tagName, attributes, selfClosing) {
  this.type = 'StartTag';
  this.tagName = tagName || '';
  this.attributes = attributes || [];
  this.selfClosing = selfClosing === true;
}

function EndTag(tagName) {
  this.type = 'EndTag';
  this.tagName = tagName || '';
}

function Chars(chars) {
  this.type = 'Chars';
  this.chars = chars || '';
}

function Comment(chars) {
  this.type = 'Comment';
  this.chars = chars || '';
}
},{}],74:[function(require,module,exports){
'use strict';

exports.isSpace = isSpace;
exports.isAlpha = isAlpha;
exports.preprocessInput = preprocessInput;

function isSpace(char) {
  return /[\t\n\f ]/.test(char);
}

function isAlpha(char) {
  return /[A-Za-z]/.test(char);
}

function preprocessInput(input) {
  return input.replace(/\r\n?/g, "\n");
}
},{}],75:[function(require,module,exports){
// Load modules

var Stringify = require('./stringify');
var Parse = require('./parse');


// Declare internals

var internals = {};


module.exports = {
    stringify: Stringify,
    parse: Parse
};

},{"./parse":76,"./stringify":77}],76:[function(require,module,exports){
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

},{"./utils":78}],77:[function(require,module,exports){
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

},{"./utils":78}],78:[function(require,module,exports){
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

