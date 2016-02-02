define("rebound-htmlbars/render", ["exports", "rebound-utils/rebound-utils", "rebound-htmlbars/hooks"], function (exports, _reboundUtils, _hooks2) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = render;

  var _reboundUtils2 = _interopRequireDefault(_reboundUtils);

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

    var parts = _reboundUtils2.default.splitPath(basePath);

    var context = [];

    while (1) {
      var pre = context.join('.');
      var post = parts.join('.');

      for (var key in changed) {
        var path = post + (post && key && '.') + key;

        for (var testPath in this.env.observers[pre]) {
          if (_reboundUtils2.default.startsWith(testPath, path)) {
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

  function render(template, data) {
    var options = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];
    var hooks = _hooks3.default.default || _hooks3.default;

    if (!data) {
      return console.error('No data passed to render function.');
    }

    var scope = scope || hooks.createFreshScope();
    var env = hooks.createChildEnv(options.env || hooks.createFreshEnv());

    _.extend(env.helpers, options.helpers);

    data.env = env;
    env.root = data;
    options.contextualElement || (options.contextualElement = data.el || document.body);
    options.self = data;

    if (data.listenTo) {
      data.stopListening(null, null, onChange).stopListening(null, null, onReset).stopListening(null, null, onUpdate);
      data.listenTo(data, 'change', onChange).listenTo(data, 'reset', onReset).listenTo(data, 'update', onUpdate);
    }

    return env.template = template ? hooks.buildRenderResult(template, env, scope, options) : {
      fragment: document.createDocumentFragment()
    };
  }
});