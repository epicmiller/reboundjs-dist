define("rebound-utils/events", ["exports"], function (exports) {
	"use strict";

	Object.defineProperty(exports, "__esModule", {
		value: true
	});
	exports.trigger = trigger;
	exports.off = off;
	exports.on = on;

	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
		return typeof obj;
	} : function (obj) {
		return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
	};

	var EVENT_CACHE = {};

	function returnFalse() {
		return false;
	}

	function returnTrue() {
		return true;
	}

	function Event(src, props) {
		if (!(this instanceof Event)) {
			return new Event(src, props);
		}

		if (src && src.type) {
			this.originalEvent = src;
			this.type = src.type;
			this.isDefaultPrevented = src.defaultPrevented || src.returnValue === false ? returnTrue : returnFalse;
		} else {
			this.type = src;
		}

		if (props) {
			_.extend(this, props);
		}

		_.extend(this, _.pick(this.originalEvent, ["altKey", "bubbles", "cancelable", "ctrlKey", "currentTarget", "eventPhase", "metaKey", "relatedTarget", "shiftKey", "target", "timeStamp", "view", "which", "char", "charCode", "key", "keyCode", "button", "buttons", "clientX", "clientY", "defaultPrevented", "offsetX", "offsetY", "pageX", "pageY", "screenX", "screenY", "toElement"]));

		this.timeStamp = src && src.timeStamp || new Date().getTime();
		this.isEvent = true;
	}

	Event.prototype = {
		constructor: Event,
		isDefaultPrevented: returnFalse,
		isPropagationStopped: returnFalse,
		isImmediatePropagationStopped: returnFalse,
		preventDefault: function preventDefault() {
			var e = this.originalEvent;
			this.defaultPrevented = true;
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
		event = new Event(event || window.event);

		while (target) {
			event.target = event.srcElement = target;
			callbacks = getCallbacks(this, target, event.type);
			len = callbacks.length;

			for (i = 0; i < len; i++) {
				event.data = callbacks[i].data || {};
				event.result = callbacks[i].handler.call(callbacks[i].el, event);

				if (event.result === false) {
					event.preventDefault();
					event.stopPropagation();
				}

				if (event.isImmediatePropagationStopped()) {
					return false;
				}
			}

			if (event.isPropagationStopped()) {
				return false;
			}

			target = target.parentNode;
		}
	}

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

		while (len--) {
			el = this[len];

			if (el.delegateGroup && EVENT_CACHE[el.delegateGroup]) {
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

		if (_.isFunction(delegate)) {
			handler = delegate;
			data = {};
			delegate = void 0;
		} else if (_.isFunction(data)) {
			handler = data;
			data = {};
			delegate || (delegate = void 0);
		} else if (_.isFunction(handler)) {
			data || (data = {});
			delegate || (delegate = void 0);
		} else {
			return console.error("No handler passed to Rebound's $.on");
		}

		var _loop = function _loop() {
			var el = _this[len];
			delegate = delegate || _this.selector || el;

			if (!_.isString(delegate) && !_.isElement(delegate)) {
				return {
					v: console.error("Delegate value passed to Rebound's $.on is neither an element or css selector")
				};
			}

			delegateId = _.isString(delegate) ? delegate : delegate.delegateId = delegate.delegateId || _this.uniqueId('event');
			delegateGroup = el.delegateGroup = el.delegateGroup || _this.uniqueId('delegateGroup');

			_.each(eventNames, function (eventName) {
				EVENT_CACHE[delegateGroup] = EVENT_CACHE[delegateGroup] || {};

				if (!EVENT_CACHE[delegateGroup][eventName]) {
					el.addEventListener(eventName, callback, eventName === 'focus' || eventName === 'blur');
				}

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

	exports.default = {
		on: on,
		off: off,
		trigger: trigger
	};
});