define("rebound-htmlbars/hooks/linkRenderNode", ["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = linkRenderNode;

  function linkRenderNode(renderNode, env, scope, path, params, hash) {
    function rerender(path, node, lazyValue, env) {
      lazyValue.onNotify(function () {
        node.isDirty = true;
        env.template && (env.revalidateQueue[env.template.uid] = env.template);
      });
    }

    renderNode.path = path;

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
});