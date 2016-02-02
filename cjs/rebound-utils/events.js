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