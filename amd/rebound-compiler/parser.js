define('rebound-compiler/parser', ['exports'], function (exports) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
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

  function getStyle(str) {
    var start = str.indexOf("<style>");
    var end = str.indexOf("</style>");
    return start > -1 && end > -1 ? str.substr(start + 7, end - (start + 7)).replace(/"/g, "\\\"") : "";
  }

  function stripLinkTags(str) {
    return str.replace(/<link .*href=(['"]?)(.*).html\1[^>]*>/gi, '');
  }

  function getTemplate(str) {
    var start = str.indexOf("<template>");
    var end = str.lastIndexOf('</template>');
    str = start > -1 && end > -1 ? str.substring(start + 10, end) : '';
    return stripLinkTags(str);
  }

  function getName(str) {
    return str.replace(/[^]*?<element[^>]*name=(["'])?([^'">\s]+)\1[^<>]*>[^]*/ig, "$2").trim();
  }

  function minify(str) {
    return str.replace(/\s+/g, " ").replace(/\n|(>) (<)/g, "$1$2");
  }

  function removeComments(str) {
    return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s])+\/\/(?:.*)$)/gm, "$1");
  }

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

    (template.match(importsre) || []).forEach(function (importString, index) {
      deps.push(importString.replace(importsre, '$2'));
    });
    (template.match(partialsre) || []).forEach(function (partial, index) {
      deps.push(partial.replace(partialsre, '$2'));
    });
    (template.match(helpersre) || []).forEach(function (partial, index) {
      deps.push(partial.replace(helpersre, '$2'));
    });
    return deps;
  }

  function parse(str) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

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
});