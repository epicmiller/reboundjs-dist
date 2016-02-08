define("rebound-htmlbars/hooks/component", ["exports", "rebound-utils/rebound-utils", "rebound-component/factory"], function (exports, _reboundUtils, _factory) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = component;

  var _factory2 = _interopRequireDefault(_factory);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : {
      default: obj
    };
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  var ATTRIBUTES = {
    abbr: 1,
    "accept-charset": 1,
    accept: 1,
    accesskey: 1,
    action: 1,
    align: 1,
    alink: 1,
    alt: 1,
    archive: 1,
    axis: 1,
    background: 1,
    bgcolor: 1,
    border: 1,
    cellpadding: 1,
    cellspacing: 1,
    char: 1,
    charoff: 1,
    charset: 1,
    checked: 1,
    cite: 1,
    class: 1,
    classid: 1,
    clear: 1,
    code: 1,
    codebase: 1,
    codetype: 1,
    color: 1,
    cols: 1,
    colspan: 1,
    compact: 1,
    content: 1,
    coords: 1,
    data: 1,
    datetime: 1,
    declare: 1,
    defer: 1,
    dir: 1,
    disabled: 1,
    enctype: 1,
    face: 1,
    for: 1,
    frame: 1,
    frameborder: 1,
    headers: 1,
    height: 1,
    href: 1,
    hreflang: 1,
    hspace: 1,
    "http-equiv": 1,
    id: 1,
    ismap: 1,
    label: 1,
    lang: 1,
    language: 1,
    link: 1,
    longdesc: 1,
    marginheight: 1,
    marginwidth: 1,
    maxlength: 1,
    media: 1,
    method: 1,
    multiple: 1,
    name: 1,
    nohref: 1,
    noresize: 1,
    noshade: 1,
    nowrap: 1,
    object: 1,
    onblur: 1,
    onchange: 1,
    onclick: 1,
    ondblclick: 1,
    onfocus: 1,
    onkeydown: 1,
    onkeypress: 1,
    onkeyup: 1,
    onload: 1,
    onmousedown: 1,
    onmousemove: 1,
    onmouseout: 1,
    onmouseover: 1,
    onmouseup: 1,
    onreset: 1,
    onselect: 1,
    onsubmit: 1,
    onunload: 1,
    profile: 1,
    prompt: 1,
    readonly: 1,
    rel: 1,
    rev: 1,
    rows: 1,
    rowspan: 1,
    rules: 1,
    scheme: 1,
    scope: 1,
    scrolling: 1,
    selected: 1,
    shape: 1,
    size: 1,
    span: 1,
    src: 1,
    standby: 1,
    start: 1,
    style: 1,
    summary: 1,
    tabindex: 1,
    target: 1,
    text: 1,
    title: 1,
    type: 1,
    usemap: 1,
    valign: 1,
    value: 1,
    valuetype: 1,
    version: 1,
    vlink: 1,
    vspace: 1,
    width: 1
  };

  function component(morph, env, scope, tagName, params, attrs, templates, visitor) {
    var _this = this;

    if (morph.componentIsRendered) {
      return void 0;
    }

    var component,
        element,
        outlet,
        render = this.buildRenderResult,
        seedData = {},
        componentData = {};

    for (var key in attrs) {
      seedData[key] = this.getValue(attrs[key]);
    }

    component = (0, _factory2.default)(tagName, seedData, _defineProperty({}, _reboundUtils.REBOUND_SYMBOL, {
      templates: templates,
      env: env,
      scope: scope
    }));
    element = component.el;

    var _loop = function _loop(key) {
      componentData[key] = _this.get(component.env, component.scope, key);

      if (componentData[key].isLazyValue && attrs[key].isLazyValue) {
        componentData[key].onNotify(function () {
          attrs[key].set(attrs[key].path, componentData[key].value);
        });
        attrs[key].onNotify(function () {
          componentData[key].set(key, attrs[key].value);
        });
        componentData[key].value;
      }
    };

    for (var key in seedData) {
      _loop(key);
    }

    var updateAttrs = function updateAttrs() {
      if (!component.isHydrated) {
        return;
      }

      var json = component.toJSON();
      if (_.isString(json)) return;

      _.each(json, function (value, key) {
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
    morph.setNode(element);
    morph.componentIsRendered = true;
  }
});