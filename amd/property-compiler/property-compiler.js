define('property-compiler/property-compiler', ['exports', 'acorn'], function (exports, _acorn) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function tokenizer(input, options) {
    return new _acorn.Parser(options, input);
  }

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

  function compile(prop, name) {
    var output = {};
    if (prop.__params) return prop.__params;
    var str = prop.toString(),
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
      token.nextToken();

      if (token.value === 'this') {
        listening++;
        workingpath = [];
      }

      if (token.value === 'get') {
        token.nextToken();

        while (_.isUndefined(token.value)) {
          token.nextToken();
        }

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

    prop.__params = finishedPaths;
    return finishedPaths;
  }

  exports.default = {
    compile: compile
  };
});