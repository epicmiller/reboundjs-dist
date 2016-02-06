define("rebound-htmlbars/render", ["exports", "rebound-utils/rebound-utils", "rebound-htmlbars/hooks"], function (exports, _reboundUtils, _hooks2) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = render;

  var _hooks3 = _interopRequireDefault(_hooks2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  var RENDER_TIMEOUT;
  var TO_RENDER = [];
  var ENV_QUEUE = [];

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
    var hooks = _hooks3.default.default || _hooks3.default;
    var outlet,
        slots = env.root.options && env.root.options[_reboundUtils.REBOUND_SYMBOL];

    if (!env.root || !slots) {
      return;
    }

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

    if (slots.templates.default && _.isElement(outlet) && !outlet.slotted) {
      outlet.slotted = true;
      (0, _reboundUtils.$)(outlet).empty();
      outlet.appendChild(hooks.buildRenderResult(slots.templates.default, slots.env, slots.scope, {}).fragment);
    }
  }

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

  function onChange(model, options) {
    trigger.call(this, 'change', model, model.changedAttributes());
  }

  function onReset(data, options) {
    trigger.call(this, 'reset', data, data.isModel ? data.changedAttributes() : {
      '@each': data
    }, options);
  }

  function onUpdate(collection, options) {
    trigger.call(this, 'update', collection, {
      '@each': collection
    }, options);
  }

  function trigger(type, data, changed) {
    var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];

    if (!data || !changed) {
      return void 0;
    }

    var basePath = data.__path();

    if (options.service) {
      basePath = options.service + '.' + basePath;
    }

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

    if (window.Rebound && window.Rebound.testing) {
      return renderCallback();
    }

    window.cancelAnimationFrame(RENDER_TIMEOUT);
    RENDER_TIMEOUT = window.requestAnimationFrame(renderCallback);
  }

  function render(el, template, data) {
    var options = arguments.length <= 3 || arguments[3] === undefined ? {} : arguments[3];
    var hooks = _hooks3.default.default || _hooks3.default;

    if (!data) {
      return console.error('No data passed to render function.');
    }

    var env = data.env || hooks.createFreshEnv();
    var scope = data.scope || hooks.createFreshScope();
    hooks.bindSelf(env, scope, data);

    _.extend(env.helpers, options.helpers);

    data.env = env;
    data.scope = scope;
    env.root = data;
    options.contextualElement || (options.contextualElement = data.el || document.body);
    options.self = data;

    if (data.listenTo) {
      data.stopListening(null, null, onChange).stopListening(null, null, onReset).stopListening(null, null, onUpdate);
      data.listenTo(data, 'change', onChange).listenTo(data, 'reset', onReset).listenTo(data, 'update', onUpdate);
    }

    env.template = template ? hooks.buildRenderResult(template, env, scope, options) : {
      fragment: document.createDocumentFragment()
    };
    (0, _reboundUtils.$)(el).empty();
    el.appendChild(env.template.fragment);
    reslot(env);
    return el;
  }
});