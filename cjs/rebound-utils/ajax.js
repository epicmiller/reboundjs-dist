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