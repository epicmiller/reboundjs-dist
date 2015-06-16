//     Underscore.js 1.6.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Establish the object that gets returned to break out of a loop iteration.
  var breaker = {};

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeForEach      = ArrayProto.forEach,
    nativeMap          = ArrayProto.map,
    nativeReduce       = ArrayProto.reduce,
    nativeReduceRight  = ArrayProto.reduceRight,
    nativeFilter       = ArrayProto.filter,
    nativeEvery        = ArrayProto.every,
    nativeSome         = ArrayProto.some,
    nativeIndexOf      = ArrayProto.indexOf,
    nativeLastIndexOf  = ArrayProto.lastIndexOf,
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object via a string identifier,
  // for Closure Compiler "advanced" mode.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.6.0';

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles objects with the built-in `forEach`, arrays, and raw objects.
  // Delegates to **ECMAScript 5**'s native `forEach` if available.
  var each = _.each = _.forEach = function(obj, iterator, context) {
    if (obj == null) return obj;
    if (nativeForEach && obj.forEach === nativeForEach) {
      obj.forEach(iterator, context);
    } else if (obj.length === +obj.length) {
      for (var i = 0, length = obj.length; i < length; i++) {
        if (iterator.call(context, obj[i], i, obj) === breaker) return;
      }
    } else {
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        if (iterator.call(context, obj[keys[i]], keys[i], obj) === breaker) return;
      }
    }
    return obj;
  };

  // Return the results of applying the iterator to each element.
  // Delegates to **ECMAScript 5**'s native `map` if available.
  _.map = _.collect = function(obj, iterator, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeMap && obj.map === nativeMap) return obj.map(iterator, context);
    each(obj, function(value, index, list) {
      results.push(iterator.call(context, value, index, list));
    });
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`. Delegates to **ECMAScript 5**'s native `reduce` if available.
  _.reduce = _.foldl = _.inject = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduce && obj.reduce === nativeReduce) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduce(iterator, memo) : obj.reduce(iterator);
    }
    each(obj, function(value, index, list) {
      if (!initial) {
        memo = value;
        initial = true;
      } else {
        memo = iterator.call(context, memo, value, index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  // Delegates to **ECMAScript 5**'s native `reduceRight` if available.
  _.reduceRight = _.foldr = function(obj, iterator, memo, context) {
    var initial = arguments.length > 2;
    if (obj == null) obj = [];
    if (nativeReduceRight && obj.reduceRight === nativeReduceRight) {
      if (context) iterator = _.bind(iterator, context);
      return initial ? obj.reduceRight(iterator, memo) : obj.reduceRight(iterator);
    }
    var length = obj.length;
    if (length !== +length) {
      var keys = _.keys(obj);
      length = keys.length;
    }
    each(obj, function(value, index, list) {
      index = keys ? keys[--length] : --length;
      if (!initial) {
        memo = obj[index];
        initial = true;
      } else {
        memo = iterator.call(context, memo, obj[index], index, list);
      }
    });
    if (!initial) throw new TypeError(reduceError);
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    any(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Delegates to **ECMAScript 5**'s native `filter` if available.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    if (nativeFilter && obj.filter === nativeFilter) return obj.filter(predicate, context);
    each(obj, function(value, index, list) {
      if (predicate.call(context, value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, function(value, index, list) {
      return !predicate.call(context, value, index, list);
    }, context);
  };

  // Determine whether all of the elements match a truth test.
  // Delegates to **ECMAScript 5**'s native `every` if available.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = true;
    if (obj == null) return result;
    if (nativeEvery && obj.every === nativeEvery) return obj.every(predicate, context);
    each(obj, function(value, index, list) {
      if (!(result = result && predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if at least one element in the object matches a truth test.
  // Delegates to **ECMAScript 5**'s native `some` if available.
  // Aliased as `any`.
  var any = _.some = _.any = function(obj, predicate, context) {
    predicate || (predicate = _.identity);
    var result = false;
    if (obj == null) return result;
    if (nativeSome && obj.some === nativeSome) return obj.some(predicate, context);
    each(obj, function(value, index, list) {
      if (result || (result = predicate.call(context, value, index, list))) return breaker;
    });
    return !!result;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (nativeIndexOf && obj.indexOf === nativeIndexOf) return obj.indexOf(target) != -1;
    return any(obj, function(value) {
      return value === target;
    });
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element or (element-based computation).
  // Can't optimize arrays of integers longer than 65,535 elements.
  // See [WebKit Bug 80797](https://bugs.webkit.org/show_bug.cgi?id=80797)
  _.max = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.max.apply(Math, obj);
    }
    var result = -Infinity, lastComputed = -Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed > lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iterator, context) {
    if (!iterator && _.isArray(obj) && obj[0] === +obj[0] && obj.length < 65535) {
      return Math.min.apply(Math, obj);
    }
    var result = Infinity, lastComputed = Infinity;
    each(obj, function(value, index, list) {
      var computed = iterator ? iterator.call(context, value, index, list) : value;
      if (computed < lastComputed) {
        result = value;
        lastComputed = computed;
      }
    });
    return result;
  };

  // Shuffle an array, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var rand;
    var index = 0;
    var shuffled = [];
    each(obj, function(value) {
      rand = _.random(index++);
      shuffled[index - 1] = shuffled[rand];
      shuffled[rand] = value;
    });
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // An internal function to generate lookup iterators.
  var lookupIterator = function(value) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return value;
    return _.property(value);
  };

  // Sort the object's values by a criterion produced by an iterator.
  _.sortBy = function(obj, iterator, context) {
    iterator = lookupIterator(iterator);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iterator.call(context, value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iterator, context) {
      var result = {};
      iterator = lookupIterator(iterator);
      each(obj, function(value, index) {
        var key = iterator.call(context, value, index, obj);
        behavior(result, key, value);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, key, value) {
    _.has(result, key) ? result[key].push(value) : result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, key, value) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, key) {
    _.has(result, key) ? result[key]++ : result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iterator, context) {
    iterator = lookupIterator(iterator);
    var value = iterator.call(context, obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = (low + high) >>> 1;
      iterator.call(context, array[mid]) < value ? low = mid + 1 : high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return (obj.length === +obj.length) ? obj.length : _.keys(obj).length;
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, array.length - ((n == null) || guard ? 1 : n));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if ((n == null) || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, (n == null) || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    each(input, function(value) {
      if (_.isArray(value) || _.isArguments(value)) {
        shallow ? push.apply(output, value) : flatten(value, shallow, output);
      } else {
        output.push(value);
      }
    });
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Split an array into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(array, predicate) {
    var pass = [], fail = [];
    each(array, function(elem) {
      (predicate(elem) ? pass : fail).push(elem);
    });
    return [pass, fail];
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iterator, context) {
    if (_.isFunction(isSorted)) {
      context = iterator;
      iterator = isSorted;
      isSorted = false;
    }
    var initial = iterator ? _.map(array, iterator, context) : array;
    var results = [];
    var seen = [];
    each(initial, function(value, index) {
      if (isSorted ? (!index || seen[seen.length - 1] !== value) : !_.contains(seen, value)) {
        seen.push(value);
        results.push(array[index]);
      }
    });
    return results;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(_.flatten(arguments, true));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var rest = slice.call(arguments, 1);
    return _.filter(_.uniq(array), function(item) {
      return _.every(rest, function(other) {
        return _.contains(other, item);
      });
    });
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = concat.apply(ArrayProto, slice.call(arguments, 1));
    return _.filter(array, function(value){ return !_.contains(rest, value); });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function() {
    var length = _.max(_.pluck(arguments, 'length').concat(0));
    var results = new Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, '' + i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // If the browser doesn't supply us with indexOf (I'm looking at you, **MSIE**),
  // we need this function. Return the position of the first occurrence of an
  // item in an array, or -1 if the item is not included in the array.
  // Delegates to **ECMAScript 5**'s native `indexOf` if available.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = (isSorted < 0 ? Math.max(0, length + isSorted) : isSorted);
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    if (nativeIndexOf && array.indexOf === nativeIndexOf) return array.indexOf(item, isSorted);
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  // Delegates to **ECMAScript 5**'s native `lastIndexOf` if available.
  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var hasIndex = from != null;
    if (nativeLastIndexOf && array.lastIndexOf === nativeLastIndexOf) {
      return hasIndex ? array.lastIndexOf(item, from) : array.lastIndexOf(item);
    }
    var i = (hasIndex ? from : array.length);
    while (i--) if (array[i] === item) return i;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = arguments[2] || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var idx = 0;
    var range = new Array(length);

    while(idx < length) {
      range[idx++] = start;
      start += step;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError;
    args = slice.call(arguments, 2);
    return bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      ctor.prototype = func.prototype;
      var self = new ctor;
      ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (Object(result) === result) return result;
      return self;
    };
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var funcs = slice.call(arguments, 1);
    if (funcs.length === 0) throw new Error('bindAll must be passed function names');
    each(funcs, function(f) { obj[f] = _.bind(obj[f], obj); });
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memo = {};
    hasher || (hasher = _.identity);
    return function() {
      var key = hasher.apply(this, arguments);
      return _.has(memo, key) ? memo[key] : (memo[key] = func.apply(this, arguments));
    };
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){ return func.apply(null, args); }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    options || (options = {});
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;
      if (last < wait) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) {
        timeout = setTimeout(later, wait);
      }
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = function(func) {
    var ran = false, memo;
    return function() {
      if (ran) return memo;
      ran = true;
      memo = func.apply(this, arguments);
      func = null;
      return memo;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var funcs = arguments;
    return function() {
      var args = arguments;
      for (var i = funcs.length - 1; i >= 0; i--) {
        args = [funcs[i].apply(this, args)];
      }
      return args[0];
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = new Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = new Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    each(keys, function(key) {
      if (key in obj) copy[key] = obj[key];
    });
    return copy;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj) {
    var copy = {};
    var keys = concat.apply(ArrayProto, slice.call(arguments, 1));
    for (var key in obj) {
      if (!_.contains(keys, key)) copy[key] = obj[key];
    }
    return copy;
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    each(slice.call(arguments, 1), function(source) {
      if (source) {
        for (var prop in source) {
          if (obj[prop] === void 0) obj[prop] = source[prop];
        }
      }
    });
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a == 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className != toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, dates, and booleans are compared by value.
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return a == String(b);
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is performed for
        // other numeric values.
        return a != +a ? b != +b : (a == 0 ? 1 / a == 1 / b : a == +b);
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a == +b;
      // RegExps are compared by their source patterns and flags.
      case '[object RegExp]':
        return a.source == b.source &&
               a.global == b.global &&
               a.multiline == b.multiline &&
               a.ignoreCase == b.ignoreCase;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] == a) return bStack[length] == b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && (aCtor instanceof aCtor) &&
                             _.isFunction(bCtor) && (bCtor instanceof bCtor))
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size = 0, result = true;
    // Recursively compare objects and arrays.
    if (className == '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size == b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      for (var key in a) {
        if (_.has(a, key)) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
      // Ensure that both objects contain the same number of properties.
      if (result) {
        for (key in b) {
          if (_.has(b, key) && !(size--)) break;
        }
        result = !size;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) == '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    return obj === Object(obj);
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) == '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return !!(obj && _.has(obj, 'callee'));
    };
  }

  // Optimize `isFunction` if appropriate.
  if (typeof (/./) !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj === 'function';
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj != +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) == '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iterators.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function () {
      return value;
    };
  };

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    return function(obj) {
      if (obj === attrs) return true; //avoid comparing an object to itself.
      for (var key in attrs) {
        if (attrs[key] !== obj[key])
          return false;
      }
      return true;
    }
  };

  // Run a function **n** times.
  _.times = function(n, iterator, context) {
    var accum = Array(Math.max(0, n));
    for (var i = 0; i < n; i++) accum[i] = iterator.call(context, i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() { return new Date().getTime(); };

  // List of HTML entities for escaping.
  var entityMap = {
    escape: {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    }
  };
  entityMap.unescape = _.invert(entityMap.escape);

  // Regexes containing the keys and values listed immediately above.
  var entityRegexes = {
    escape:   new RegExp('[' + _.keys(entityMap.escape).join('') + ']', 'g'),
    unescape: new RegExp('(' + _.keys(entityMap.unescape).join('|') + ')', 'g')
  };

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  _.each(['escape', 'unescape'], function(method) {
    _[method] = function(string) {
      if (string == null) return '';
      return ('' + string).replace(entityRegexes[method], function(match) {
        return entityMap[method][match];
      });
    };
  });

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\t':     't',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\t|\u2028|\u2029/g;

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  _.template = function(text, data, settings) {
    var render;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = new RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset)
        .replace(escaper, function(match) { return '\\' + escapes[match]; });

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      }
      if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      }
      if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }
      index = offset + match.length;
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + "return __p;\n";

    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    if (data) return render(data, _);
    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled function source as a convenience for precompilation.
    template.source = 'function(' + (settings.variable || 'obj') + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function, which will delegate to the wrapper.
  _.chain = function(obj) {
    return _(obj).chain();
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name == 'shift' || name == 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  _.extend(_.prototype, {

    // Start chaining a wrapped Underscore object.
    chain: function() {
      this._chain = true;
      return this;
    },

    // Extracts the result from a wrapped and chained object.
    value: function() {
      return this._wrapped;
    }

  });

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}).call(this);

/*! jQuery v2.1.1 | (c) 2005, 2014 jQuery Foundation, Inc. | jquery.org/license */
!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=c.slice,e=c.concat,f=c.push,g=c.indexOf,h={},i=h.toString,j=h.hasOwnProperty,k={},l=a.document,m="2.1.1",n=function(a,b){return new n.fn.init(a,b)},o=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,p=/^-ms-/,q=/-([\da-z])/gi,r=function(a,b){return b.toUpperCase()};n.fn=n.prototype={jquery:m,constructor:n,selector:"",length:0,toArray:function(){return d.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:d.call(this)},pushStack:function(a){var b=n.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a,b){return n.each(this,a,b)},map:function(a){return this.pushStack(n.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor(null)},push:f,sort:c.sort,splice:c.splice},n.extend=n.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||n.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(a=arguments[h]))for(b in a)c=g[b],d=a[b],g!==d&&(j&&d&&(n.isPlainObject(d)||(e=n.isArray(d)))?(e?(e=!1,f=c&&n.isArray(c)?c:[]):f=c&&n.isPlainObject(c)?c:{},g[b]=n.extend(j,f,d)):void 0!==d&&(g[b]=d));return g},n.extend({expando:"jQuery"+(m+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===n.type(a)},isArray:Array.isArray,isWindow:function(a){return null!=a&&a===a.window},isNumeric:function(a){return!n.isArray(a)&&a-parseFloat(a)>=0},isPlainObject:function(a){return"object"!==n.type(a)||a.nodeType||n.isWindow(a)?!1:a.constructor&&!j.call(a.constructor.prototype,"isPrototypeOf")?!1:!0},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?h[i.call(a)]||"object":typeof a},globalEval:function(a){var b,c=eval;a=n.trim(a),a&&(1===a.indexOf("use strict")?(b=l.createElement("script"),b.text=a,l.head.appendChild(b).parentNode.removeChild(b)):c(a))},camelCase:function(a){return a.replace(p,"ms-").replace(q,r)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b,c){var d,e=0,f=a.length,g=s(a);if(c){if(g){for(;f>e;e++)if(d=b.apply(a[e],c),d===!1)break}else for(e in a)if(d=b.apply(a[e],c),d===!1)break}else if(g){for(;f>e;e++)if(d=b.call(a[e],e,a[e]),d===!1)break}else for(e in a)if(d=b.call(a[e],e,a[e]),d===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(o,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(s(Object(a))?n.merge(c,"string"==typeof a?[a]:a):f.call(c,a)),c},inArray:function(a,b,c){return null==b?-1:g.call(b,a,c)},merge:function(a,b){for(var c=+b.length,d=0,e=a.length;c>d;d++)a[e++]=b[d];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,f=0,g=a.length,h=s(a),i=[];if(h)for(;g>f;f++)d=b(a[f],f,c),null!=d&&i.push(d);else for(f in a)d=b(a[f],f,c),null!=d&&i.push(d);return e.apply([],i)},guid:1,proxy:function(a,b){var c,e,f;return"string"==typeof b&&(c=a[b],b=a,a=c),n.isFunction(a)?(e=d.call(arguments,2),f=function(){return a.apply(b||this,e.concat(d.call(arguments)))},f.guid=a.guid=a.guid||n.guid++,f):void 0},now:Date.now,support:k}),n.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){h["[object "+b+"]"]=b.toLowerCase()});function s(a){var b=a.length,c=n.type(a);return"function"===c||n.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var t=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+-new Date,v=a.document,w=0,x=0,y=gb(),z=gb(),A=gb(),B=function(a,b){return a===b&&(l=!0),0},C="undefined",D=1<<31,E={}.hasOwnProperty,F=[],G=F.pop,H=F.push,I=F.push,J=F.slice,K=F.indexOf||function(a){for(var b=0,c=this.length;c>b;b++)if(this[b]===a)return b;return-1},L="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",M="[\\x20\\t\\r\\n\\f]",N="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",O=N.replace("w","w#"),P="\\["+M+"*("+N+")(?:"+M+"*([*^$|!~]?=)"+M+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+O+"))|)"+M+"*\\]",Q=":("+N+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+P+")*)|.*)\\)|)",R=new RegExp("^"+M+"+|((?:^|[^\\\\])(?:\\\\.)*)"+M+"+$","g"),S=new RegExp("^"+M+"*,"+M+"*"),T=new RegExp("^"+M+"*([>+~]|"+M+")"+M+"*"),U=new RegExp("="+M+"*([^\\]'\"]*?)"+M+"*\\]","g"),V=new RegExp(Q),W=new RegExp("^"+O+"$"),X={ID:new RegExp("^#("+N+")"),CLASS:new RegExp("^\\.("+N+")"),TAG:new RegExp("^("+N.replace("w","w*")+")"),ATTR:new RegExp("^"+P),PSEUDO:new RegExp("^"+Q),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+M+"*(even|odd|(([+-]|)(\\d*)n|)"+M+"*(?:([+-]|)"+M+"*(\\d+)|))"+M+"*\\)|)","i"),bool:new RegExp("^(?:"+L+")$","i"),needsContext:new RegExp("^"+M+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+M+"*((?:-\\d)?\\d*)"+M+"*\\)|)(?=[^-]|$)","i")},Y=/^(?:input|select|textarea|button)$/i,Z=/^h\d$/i,$=/^[^{]+\{\s*\[native \w/,_=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,ab=/[+~]/,bb=/'|\\/g,cb=new RegExp("\\\\([\\da-f]{1,6}"+M+"?|("+M+")|.)","ig"),db=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)};try{I.apply(F=J.call(v.childNodes),v.childNodes),F[v.childNodes.length].nodeType}catch(eb){I={apply:F.length?function(a,b){H.apply(a,J.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function fb(a,b,d,e){var f,h,j,k,l,o,r,s,w,x;if((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,d=d||[],!a||"string"!=typeof a)return d;if(1!==(k=b.nodeType)&&9!==k)return[];if(p&&!e){if(f=_.exec(a))if(j=f[1]){if(9===k){if(h=b.getElementById(j),!h||!h.parentNode)return d;if(h.id===j)return d.push(h),d}else if(b.ownerDocument&&(h=b.ownerDocument.getElementById(j))&&t(b,h)&&h.id===j)return d.push(h),d}else{if(f[2])return I.apply(d,b.getElementsByTagName(a)),d;if((j=f[3])&&c.getElementsByClassName&&b.getElementsByClassName)return I.apply(d,b.getElementsByClassName(j)),d}if(c.qsa&&(!q||!q.test(a))){if(s=r=u,w=b,x=9===k&&a,1===k&&"object"!==b.nodeName.toLowerCase()){o=g(a),(r=b.getAttribute("id"))?s=r.replace(bb,"\\$&"):b.setAttribute("id",s),s="[id='"+s+"'] ",l=o.length;while(l--)o[l]=s+qb(o[l]);w=ab.test(a)&&ob(b.parentNode)||b,x=o.join(",")}if(x)try{return I.apply(d,w.querySelectorAll(x)),d}catch(y){}finally{r||b.removeAttribute("id")}}}return i(a.replace(R,"$1"),b,d,e)}function gb(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function hb(a){return a[u]=!0,a}function ib(a){var b=n.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function jb(a,b){var c=a.split("|"),e=a.length;while(e--)d.attrHandle[c[e]]=b}function kb(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||D)-(~a.sourceIndex||D);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function lb(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function mb(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function nb(a){return hb(function(b){return b=+b,hb(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function ob(a){return a&&typeof a.getElementsByTagName!==C&&a}c=fb.support={},f=fb.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},m=fb.setDocument=function(a){var b,e=a?a.ownerDocument||a:v,g=e.defaultView;return e!==n&&9===e.nodeType&&e.documentElement?(n=e,o=e.documentElement,p=!f(e),g&&g!==g.top&&(g.addEventListener?g.addEventListener("unload",function(){m()},!1):g.attachEvent&&g.attachEvent("onunload",function(){m()})),c.attributes=ib(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ib(function(a){return a.appendChild(e.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=$.test(e.getElementsByClassName)&&ib(function(a){return a.innerHTML="<div class='a'></div><div class='a i'></div>",a.firstChild.className="i",2===a.getElementsByClassName("i").length}),c.getById=ib(function(a){return o.appendChild(a).id=u,!e.getElementsByName||!e.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if(typeof b.getElementById!==C&&p){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},d.filter.ID=function(a){var b=a.replace(cb,db);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(cb,db);return function(a){var c=typeof a.getAttributeNode!==C&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return typeof b.getElementsByTagName!==C?b.getElementsByTagName(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return typeof b.getElementsByClassName!==C&&p?b.getElementsByClassName(a):void 0},r=[],q=[],(c.qsa=$.test(e.querySelectorAll))&&(ib(function(a){a.innerHTML="<select msallowclip=''><option selected=''></option></select>",a.querySelectorAll("[msallowclip^='']").length&&q.push("[*^$]="+M+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+M+"*(?:value|"+L+")"),a.querySelectorAll(":checked").length||q.push(":checked")}),ib(function(a){var b=e.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+M+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=$.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ib(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",Q)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=$.test(o.compareDocumentPosition),t=b||$.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===e||a.ownerDocument===v&&t(v,a)?-1:b===e||b.ownerDocument===v&&t(v,b)?1:k?K.call(k,a)-K.call(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,f=a.parentNode,g=b.parentNode,h=[a],i=[b];if(!f||!g)return a===e?-1:b===e?1:f?-1:g?1:k?K.call(k,a)-K.call(k,b):0;if(f===g)return kb(a,b);c=a;while(c=c.parentNode)h.unshift(c);c=b;while(c=c.parentNode)i.unshift(c);while(h[d]===i[d])d++;return d?kb(h[d],i[d]):h[d]===v?-1:i[d]===v?1:0},e):n},fb.matches=function(a,b){return fb(a,null,null,b)},fb.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(U,"='$1']"),!(!c.matchesSelector||!p||r&&r.test(b)||q&&q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return fb(b,n,null,[a]).length>0},fb.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},fb.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&E.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},fb.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},fb.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=fb.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=fb.selectors={cacheLength:50,createPseudo:hb,match:X,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(cb,db),a[3]=(a[3]||a[4]||a[5]||"").replace(cb,db),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||fb.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&fb.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return X.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&V.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(cb,db).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+M+")"+a+"("+M+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||typeof a.getAttribute!==C&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=fb.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h;if(q){if(f){while(p){l=b;while(l=l[p])if(h?l.nodeName.toLowerCase()===r:1===l.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){k=q[u]||(q[u]={}),j=k[a]||[],n=j[0]===w&&j[1],m=j[0]===w&&j[2],l=n&&q.childNodes[n];while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if(1===l.nodeType&&++m&&l===b){k[a]=[w,n,m];break}}else if(s&&(j=(b[u]||(b[u]={}))[a])&&j[0]===w)m=j[1];else while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if((h?l.nodeName.toLowerCase()===r:1===l.nodeType)&&++m&&(s&&((l[u]||(l[u]={}))[a]=[w,m]),l===b))break;return m-=e,m===d||m%d===0&&m/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||fb.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?hb(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=K.call(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:hb(function(a){var b=[],c=[],d=h(a.replace(R,"$1"));return d[u]?hb(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),!c.pop()}}),has:hb(function(a){return function(b){return fb(a,b).length>0}}),contains:hb(function(a){return function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:hb(function(a){return W.test(a||"")||fb.error("unsupported lang: "+a),a=a.replace(cb,db).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return Z.test(a.nodeName)},input:function(a){return Y.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:nb(function(){return[0]}),last:nb(function(a,b){return[b-1]}),eq:nb(function(a,b,c){return[0>c?c+b:c]}),even:nb(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:nb(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:nb(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:nb(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=lb(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=mb(b);function pb(){}pb.prototype=d.filters=d.pseudos,d.setFilters=new pb,g=fb.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){(!c||(e=S.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=T.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(R," ")}),h=h.slice(c.length));for(g in d.filter)!(e=X[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?fb.error(a):z(a,i).slice(0)};function qb(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function rb(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(i=b[u]||(b[u]={}),(h=i[d])&&h[0]===w&&h[1]===f)return j[2]=h[2];if(i[d]=j,j[2]=a(b,c,g))return!0}}}function sb(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function tb(a,b,c){for(var d=0,e=b.length;e>d;d++)fb(a,b[d],c);return c}function ub(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function vb(a,b,c,d,e,f){return d&&!d[u]&&(d=vb(d)),e&&!e[u]&&(e=vb(e,f)),hb(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||tb(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:ub(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=ub(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?K.call(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=ub(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):I.apply(g,r)})}function wb(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=rb(function(a){return a===b},h,!0),l=rb(function(a){return K.call(b,a)>-1},h,!0),m=[function(a,c,d){return!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d))}];f>i;i++)if(c=d.relative[a[i].type])m=[rb(sb(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;f>e;e++)if(d.relative[a[e].type])break;return vb(i>1&&sb(m),i>1&&qb(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(R,"$1"),c,e>i&&wb(a.slice(i,e)),f>e&&wb(a=a.slice(e)),f>e&&qb(a))}m.push(c)}return sb(m)}function xb(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,m,o,p=0,q="0",r=f&&[],s=[],t=j,u=f||e&&d.find.TAG("*",k),v=w+=null==t?1:Math.random()||.1,x=u.length;for(k&&(j=g!==n&&g);q!==x&&null!=(l=u[q]);q++){if(e&&l){m=0;while(o=a[m++])if(o(l,g,h)){i.push(l);break}k&&(w=v)}c&&((l=!o&&l)&&p--,f&&r.push(l))}if(p+=q,c&&q!==p){m=0;while(o=b[m++])o(r,s,g,h);if(f){if(p>0)while(q--)r[q]||s[q]||(s[q]=G.call(i));s=ub(s)}I.apply(i,s),k&&!f&&s.length>0&&p+b.length>1&&fb.uniqueSort(i)}return k&&(w=v,j=t),r};return c?hb(f):f}return h=fb.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=wb(b[c]),f[u]?d.push(f):e.push(f);f=A(a,xb(e,d)),f.selector=a}return f},i=fb.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(cb,db),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=X.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(cb,db),ab.test(j[0].type)&&ob(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&qb(j),!a)return I.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,ab.test(a)&&ob(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ib(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),ib(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||jb("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ib(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||jb("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),ib(function(a){return null==a.getAttribute("disabled")})||jb(L,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),fb}(a);n.find=t,n.expr=t.selectors,n.expr[":"]=n.expr.pseudos,n.unique=t.uniqueSort,n.text=t.getText,n.isXMLDoc=t.isXML,n.contains=t.contains;var u=n.expr.match.needsContext,v=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,w=/^.[^:#\[\.,]*$/;function x(a,b,c){if(n.isFunction(b))return n.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return n.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(w.test(b))return n.filter(b,a,c);b=n.filter(b,a)}return n.grep(a,function(a){return g.call(b,a)>=0!==c})}n.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?n.find.matchesSelector(d,a)?[d]:[]:n.find.matches(a,n.grep(b,function(a){return 1===a.nodeType}))},n.fn.extend({find:function(a){var b,c=this.length,d=[],e=this;if("string"!=typeof a)return this.pushStack(n(a).filter(function(){for(b=0;c>b;b++)if(n.contains(e[b],this))return!0}));for(b=0;c>b;b++)n.find(a,e[b],d);return d=this.pushStack(c>1?n.unique(d):d),d.selector=this.selector?this.selector+" "+a:a,d},filter:function(a){return this.pushStack(x(this,a||[],!1))},not:function(a){return this.pushStack(x(this,a||[],!0))},is:function(a){return!!x(this,"string"==typeof a&&u.test(a)?n(a):a||[],!1).length}});var y,z=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,A=n.fn.init=function(a,b){var c,d;if(!a)return this;if("string"==typeof a){if(c="<"===a[0]&&">"===a[a.length-1]&&a.length>=3?[null,a,null]:z.exec(a),!c||!c[1]&&b)return!b||b.jquery?(b||y).find(a):this.constructor(b).find(a);if(c[1]){if(b=b instanceof n?b[0]:b,n.merge(this,n.parseHTML(c[1],b&&b.nodeType?b.ownerDocument||b:l,!0)),v.test(c[1])&&n.isPlainObject(b))for(c in b)n.isFunction(this[c])?this[c](b[c]):this.attr(c,b[c]);return this}return d=l.getElementById(c[2]),d&&d.parentNode&&(this.length=1,this[0]=d),this.context=l,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):n.isFunction(a)?"undefined"!=typeof y.ready?y.ready(a):a(n):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),n.makeArray(a,this))};A.prototype=n.fn,y=n(l);var B=/^(?:parents|prev(?:Until|All))/,C={children:!0,contents:!0,next:!0,prev:!0};n.extend({dir:function(a,b,c){var d=[],e=void 0!==c;while((a=a[b])&&9!==a.nodeType)if(1===a.nodeType){if(e&&n(a).is(c))break;d.push(a)}return d},sibling:function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c}}),n.fn.extend({has:function(a){var b=n(a,this),c=b.length;return this.filter(function(){for(var a=0;c>a;a++)if(n.contains(this,b[a]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=u.test(a)||"string"!=typeof a?n(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&n.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?n.unique(f):f)},index:function(a){return a?"string"==typeof a?g.call(n(a),this[0]):g.call(this,a.jquery?a[0]:a):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(n.unique(n.merge(this.get(),n(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function D(a,b){while((a=a[b])&&1!==a.nodeType);return a}n.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return n.dir(a,"parentNode")},parentsUntil:function(a,b,c){return n.dir(a,"parentNode",c)},next:function(a){return D(a,"nextSibling")},prev:function(a){return D(a,"previousSibling")},nextAll:function(a){return n.dir(a,"nextSibling")},prevAll:function(a){return n.dir(a,"previousSibling")},nextUntil:function(a,b,c){return n.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return n.dir(a,"previousSibling",c)},siblings:function(a){return n.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return n.sibling(a.firstChild)},contents:function(a){return a.contentDocument||n.merge([],a.childNodes)}},function(a,b){n.fn[a]=function(c,d){var e=n.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=n.filter(d,e)),this.length>1&&(C[a]||n.unique(e),B.test(a)&&e.reverse()),this.pushStack(e)}});var E=/\S+/g,F={};function G(a){var b=F[a]={};return n.each(a.match(E)||[],function(a,c){b[c]=!0}),b}n.Callbacks=function(a){a="string"==typeof a?F[a]||G(a):n.extend({},a);var b,c,d,e,f,g,h=[],i=!a.once&&[],j=function(l){for(b=a.memory&&l,c=!0,g=e||0,e=0,f=h.length,d=!0;h&&f>g;g++)if(h[g].apply(l[0],l[1])===!1&&a.stopOnFalse){b=!1;break}d=!1,h&&(i?i.length&&j(i.shift()):b?h=[]:k.disable())},k={add:function(){if(h){var c=h.length;!function g(b){n.each(b,function(b,c){var d=n.type(c);"function"===d?a.unique&&k.has(c)||h.push(c):c&&c.length&&"string"!==d&&g(c)})}(arguments),d?f=h.length:b&&(e=c,j(b))}return this},remove:function(){return h&&n.each(arguments,function(a,b){var c;while((c=n.inArray(b,h,c))>-1)h.splice(c,1),d&&(f>=c&&f--,g>=c&&g--)}),this},has:function(a){return a?n.inArray(a,h)>-1:!(!h||!h.length)},empty:function(){return h=[],f=0,this},disable:function(){return h=i=b=void 0,this},disabled:function(){return!h},lock:function(){return i=void 0,b||k.disable(),this},locked:function(){return!i},fireWith:function(a,b){return!h||c&&!i||(b=b||[],b=[a,b.slice?b.slice():b],d?i.push(b):j(b)),this},fire:function(){return k.fireWith(this,arguments),this},fired:function(){return!!c}};return k},n.extend({Deferred:function(a){var b=[["resolve","done",n.Callbacks("once memory"),"resolved"],["reject","fail",n.Callbacks("once memory"),"rejected"],["notify","progress",n.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return n.Deferred(function(c){n.each(b,function(b,f){var g=n.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&n.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?n.extend(a,d):d}},e={};return d.pipe=d.then,n.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=d.call(arguments),e=c.length,f=1!==e||a&&n.isFunction(a.promise)?e:0,g=1===f?a:n.Deferred(),h=function(a,b,c){return function(e){b[a]=this,c[a]=arguments.length>1?d.call(arguments):e,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(e>1)for(i=new Array(e),j=new Array(e),k=new Array(e);e>b;b++)c[b]&&n.isFunction(c[b].promise)?c[b].promise().done(h(b,k,c)).fail(g.reject).progress(h(b,j,i)):--f;return f||g.resolveWith(k,c),g.promise()}});var H;n.fn.ready=function(a){return n.ready.promise().done(a),this},n.extend({isReady:!1,readyWait:1,holdReady:function(a){a?n.readyWait++:n.ready(!0)},ready:function(a){(a===!0?--n.readyWait:n.isReady)||(n.isReady=!0,a!==!0&&--n.readyWait>0||(H.resolveWith(l,[n]),n.fn.triggerHandler&&(n(l).triggerHandler("ready"),n(l).off("ready"))))}});function I(){l.removeEventListener("DOMContentLoaded",I,!1),a.removeEventListener("load",I,!1),n.ready()}n.ready.promise=function(b){return H||(H=n.Deferred(),"complete"===l.readyState?setTimeout(n.ready):(l.addEventListener("DOMContentLoaded",I,!1),a.addEventListener("load",I,!1))),H.promise(b)},n.ready.promise();var J=n.access=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===n.type(c)){e=!0;for(h in c)n.access(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,n.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(n(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f};n.acceptData=function(a){return 1===a.nodeType||9===a.nodeType||!+a.nodeType};function K(){Object.defineProperty(this.cache={},0,{get:function(){return{}}}),this.expando=n.expando+Math.random()}K.uid=1,K.accepts=n.acceptData,K.prototype={key:function(a){if(!K.accepts(a))return 0;var b={},c=a[this.expando];if(!c){c=K.uid++;try{b[this.expando]={value:c},Object.defineProperties(a,b)}catch(d){b[this.expando]=c,n.extend(a,b)}}return this.cache[c]||(this.cache[c]={}),c},set:function(a,b,c){var d,e=this.key(a),f=this.cache[e];if("string"==typeof b)f[b]=c;else if(n.isEmptyObject(f))n.extend(this.cache[e],b);else for(d in b)f[d]=b[d];return f},get:function(a,b){var c=this.cache[this.key(a)];return void 0===b?c:c[b]},access:function(a,b,c){var d;return void 0===b||b&&"string"==typeof b&&void 0===c?(d=this.get(a,b),void 0!==d?d:this.get(a,n.camelCase(b))):(this.set(a,b,c),void 0!==c?c:b)},remove:function(a,b){var c,d,e,f=this.key(a),g=this.cache[f];if(void 0===b)this.cache[f]={};else{n.isArray(b)?d=b.concat(b.map(n.camelCase)):(e=n.camelCase(b),b in g?d=[b,e]:(d=e,d=d in g?[d]:d.match(E)||[])),c=d.length;while(c--)delete g[d[c]]}},hasData:function(a){return!n.isEmptyObject(this.cache[a[this.expando]]||{})},discard:function(a){a[this.expando]&&delete this.cache[a[this.expando]]}};var L=new K,M=new K,N=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,O=/([A-Z])/g;function P(a,b,c){var d;if(void 0===c&&1===a.nodeType)if(d="data-"+b.replace(O,"-$1").toLowerCase(),c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:N.test(c)?n.parseJSON(c):c}catch(e){}M.set(a,b,c)}else c=void 0;return c}n.extend({hasData:function(a){return M.hasData(a)||L.hasData(a)},data:function(a,b,c){return M.access(a,b,c)},removeData:function(a,b){M.remove(a,b)
},_data:function(a,b,c){return L.access(a,b,c)},_removeData:function(a,b){L.remove(a,b)}}),n.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=M.get(f),1===f.nodeType&&!L.get(f,"hasDataAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=n.camelCase(d.slice(5)),P(f,d,e[d])));L.set(f,"hasDataAttrs",!0)}return e}return"object"==typeof a?this.each(function(){M.set(this,a)}):J(this,function(b){var c,d=n.camelCase(a);if(f&&void 0===b){if(c=M.get(f,a),void 0!==c)return c;if(c=M.get(f,d),void 0!==c)return c;if(c=P(f,d,void 0),void 0!==c)return c}else this.each(function(){var c=M.get(this,d);M.set(this,d,b),-1!==a.indexOf("-")&&void 0!==c&&M.set(this,a,b)})},null,b,arguments.length>1,null,!0)},removeData:function(a){return this.each(function(){M.remove(this,a)})}}),n.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=L.get(a,b),c&&(!d||n.isArray(c)?d=L.access(a,b,n.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=n.queue(a,b),d=c.length,e=c.shift(),f=n._queueHooks(a,b),g=function(){n.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return L.get(a,c)||L.access(a,c,{empty:n.Callbacks("once memory").add(function(){L.remove(a,[b+"queue",c])})})}}),n.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?n.queue(this[0],a):void 0===b?this:this.each(function(){var c=n.queue(this,a,b);n._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&n.dequeue(this,a)})},dequeue:function(a){return this.each(function(){n.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=n.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=L.get(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var Q=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,R=["Top","Right","Bottom","Left"],S=function(a,b){return a=b||a,"none"===n.css(a,"display")||!n.contains(a.ownerDocument,a)},T=/^(?:checkbox|radio)$/i;!function(){var a=l.createDocumentFragment(),b=a.appendChild(l.createElement("div")),c=l.createElement("input");c.setAttribute("type","radio"),c.setAttribute("checked","checked"),c.setAttribute("name","t"),b.appendChild(c),k.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,b.innerHTML="<textarea>x</textarea>",k.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue}();var U="undefined";k.focusinBubbles="onfocusin"in a;var V=/^key/,W=/^(?:mouse|pointer|contextmenu)|click/,X=/^(?:focusinfocus|focusoutblur)$/,Y=/^([^.]*)(?:\.(.+)|)$/;function Z(){return!0}function $(){return!1}function _(){try{return l.activeElement}catch(a){}}n.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=L.get(a);if(r){c.handler&&(f=c,c=f.handler,e=f.selector),c.guid||(c.guid=n.guid++),(i=r.events)||(i=r.events={}),(g=r.handle)||(g=r.handle=function(b){return typeof n!==U&&n.event.triggered!==b.type?n.event.dispatch.apply(a,arguments):void 0}),b=(b||"").match(E)||[""],j=b.length;while(j--)h=Y.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o&&(l=n.event.special[o]||{},o=(e?l.delegateType:l.bindType)||o,l=n.event.special[o]||{},k=n.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&n.expr.match.needsContext.test(e),namespace:p.join(".")},f),(m=i[o])||(m=i[o]=[],m.delegateCount=0,l.setup&&l.setup.call(a,d,p,g)!==!1||a.addEventListener&&a.addEventListener(o,g,!1)),l.add&&(l.add.call(a,k),k.handler.guid||(k.handler.guid=c.guid)),e?m.splice(m.delegateCount++,0,k):m.push(k),n.event.global[o]=!0)}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,m,o,p,q,r=L.hasData(a)&&L.get(a);if(r&&(i=r.events)){b=(b||"").match(E)||[""],j=b.length;while(j--)if(h=Y.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=n.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,m=i[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),g=f=m.length;while(f--)k=m[f],!e&&q!==k.origType||c&&c.guid!==k.guid||h&&!h.test(k.namespace)||d&&d!==k.selector&&("**"!==d||!k.selector)||(m.splice(f,1),k.selector&&m.delegateCount--,l.remove&&l.remove.call(a,k));g&&!m.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||n.removeEvent(a,o,r.handle),delete i[o])}else for(o in i)n.event.remove(a,o+b[j],c,d,!0);n.isEmptyObject(i)&&(delete r.handle,L.remove(a,"events"))}},trigger:function(b,c,d,e){var f,g,h,i,k,m,o,p=[d||l],q=j.call(b,"type")?b.type:b,r=j.call(b,"namespace")?b.namespace.split("."):[];if(g=h=d=d||l,3!==d.nodeType&&8!==d.nodeType&&!X.test(q+n.event.triggered)&&(q.indexOf(".")>=0&&(r=q.split("."),q=r.shift(),r.sort()),k=q.indexOf(":")<0&&"on"+q,b=b[n.expando]?b:new n.Event(q,"object"==typeof b&&b),b.isTrigger=e?2:3,b.namespace=r.join("."),b.namespace_re=b.namespace?new RegExp("(^|\\.)"+r.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=d),c=null==c?[b]:n.makeArray(c,[b]),o=n.event.special[q]||{},e||!o.trigger||o.trigger.apply(d,c)!==!1)){if(!e&&!o.noBubble&&!n.isWindow(d)){for(i=o.delegateType||q,X.test(i+q)||(g=g.parentNode);g;g=g.parentNode)p.push(g),h=g;h===(d.ownerDocument||l)&&p.push(h.defaultView||h.parentWindow||a)}f=0;while((g=p[f++])&&!b.isPropagationStopped())b.type=f>1?i:o.bindType||q,m=(L.get(g,"events")||{})[b.type]&&L.get(g,"handle"),m&&m.apply(g,c),m=k&&g[k],m&&m.apply&&n.acceptData(g)&&(b.result=m.apply(g,c),b.result===!1&&b.preventDefault());return b.type=q,e||b.isDefaultPrevented()||o._default&&o._default.apply(p.pop(),c)!==!1||!n.acceptData(d)||k&&n.isFunction(d[q])&&!n.isWindow(d)&&(h=d[k],h&&(d[k]=null),n.event.triggered=q,d[q](),n.event.triggered=void 0,h&&(d[k]=h)),b.result}},dispatch:function(a){a=n.event.fix(a);var b,c,e,f,g,h=[],i=d.call(arguments),j=(L.get(this,"events")||{})[a.type]||[],k=n.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=n.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,c=0;while((g=f.handlers[c++])&&!a.isImmediatePropagationStopped())(!a.namespace_re||a.namespace_re.test(g.namespace))&&(a.handleObj=g,a.data=g.data,e=((n.event.special[g.origType]||{}).handle||g.handler).apply(f.elem,i),void 0!==e&&(a.result=e)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&(!a.button||"click"!==a.type))for(;i!==this;i=i.parentNode||this)if(i.disabled!==!0||"click"!==a.type){for(d=[],c=0;h>c;c++)f=b[c],e=f.selector+" ",void 0===d[e]&&(d[e]=f.needsContext?n(e,this).index(i)>=0:n.find(e,this,null,[i]).length),d[e]&&d.push(f);d.length&&g.push({elem:i,handlers:d})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,d,e,f=b.button;return null==a.pageX&&null!=b.clientX&&(c=a.target.ownerDocument||l,d=c.documentElement,e=c.body,a.pageX=b.clientX+(d&&d.scrollLeft||e&&e.scrollLeft||0)-(d&&d.clientLeft||e&&e.clientLeft||0),a.pageY=b.clientY+(d&&d.scrollTop||e&&e.scrollTop||0)-(d&&d.clientTop||e&&e.clientTop||0)),a.which||void 0===f||(a.which=1&f?1:2&f?3:4&f?2:0),a}},fix:function(a){if(a[n.expando])return a;var b,c,d,e=a.type,f=a,g=this.fixHooks[e];g||(this.fixHooks[e]=g=W.test(e)?this.mouseHooks:V.test(e)?this.keyHooks:{}),d=g.props?this.props.concat(g.props):this.props,a=new n.Event(f),b=d.length;while(b--)c=d[b],a[c]=f[c];return a.target||(a.target=l),3===a.target.nodeType&&(a.target=a.target.parentNode),g.filter?g.filter(a,f):a},special:{load:{noBubble:!0},focus:{trigger:function(){return this!==_()&&this.focus?(this.focus(),!1):void 0},delegateType:"focusin"},blur:{trigger:function(){return this===_()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return"checkbox"===this.type&&this.click&&n.nodeName(this,"input")?(this.click(),!1):void 0},_default:function(a){return n.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}},simulate:function(a,b,c,d){var e=n.extend(new n.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?n.event.trigger(e,null,b):n.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},n.removeEvent=function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)},n.Event=function(a,b){return this instanceof n.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?Z:$):this.type=a,b&&n.extend(this,b),this.timeStamp=a&&a.timeStamp||n.now(),void(this[n.expando]=!0)):new n.Event(a,b)},n.Event.prototype={isDefaultPrevented:$,isPropagationStopped:$,isImmediatePropagationStopped:$,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=Z,a&&a.preventDefault&&a.preventDefault()},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=Z,a&&a.stopPropagation&&a.stopPropagation()},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=Z,a&&a.stopImmediatePropagation&&a.stopImmediatePropagation(),this.stopPropagation()}},n.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){n.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return(!e||e!==d&&!n.contains(d,e))&&(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),k.focusinBubbles||n.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){n.event.simulate(b,a.target,n.event.fix(a),!0)};n.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=L.access(d,b);e||d.addEventListener(a,c,!0),L.access(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=L.access(d,b)-1;e?L.access(d,b,e):(d.removeEventListener(a,c,!0),L.remove(d,b))}}}),n.fn.extend({on:function(a,b,c,d,e){var f,g;if("object"==typeof a){"string"!=typeof b&&(c=c||b,b=void 0);for(g in a)this.on(g,b,c,a[g],e);return this}if(null==c&&null==d?(d=b,c=b=void 0):null==d&&("string"==typeof b?(d=c,c=void 0):(d=c,c=b,b=void 0)),d===!1)d=$;else if(!d)return this;return 1===e&&(f=d,d=function(a){return n().off(a),f.apply(this,arguments)},d.guid=f.guid||(f.guid=n.guid++)),this.each(function(){n.event.add(this,a,d,c,b)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,n(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return(b===!1||"function"==typeof b)&&(c=b,b=void 0),c===!1&&(c=$),this.each(function(){n.event.remove(this,a,c,b)})},trigger:function(a,b){return this.each(function(){n.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?n.event.trigger(a,b,c,!0):void 0}});var ab=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,bb=/<([\w:]+)/,cb=/<|&#?\w+;/,db=/<(?:script|style|link)/i,eb=/checked\s*(?:[^=]|=\s*.checked.)/i,fb=/^$|\/(?:java|ecma)script/i,gb=/^true\/(.*)/,hb=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,ib={option:[1,"<select multiple='multiple'>","</select>"],thead:[1,"<table>","</table>"],col:[2,"<table><colgroup>","</colgroup></table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:[0,"",""]};ib.optgroup=ib.option,ib.tbody=ib.tfoot=ib.colgroup=ib.caption=ib.thead,ib.th=ib.td;function jb(a,b){return n.nodeName(a,"table")&&n.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function kb(a){return a.type=(null!==a.getAttribute("type"))+"/"+a.type,a}function lb(a){var b=gb.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function mb(a,b){for(var c=0,d=a.length;d>c;c++)L.set(a[c],"globalEval",!b||L.get(b[c],"globalEval"))}function nb(a,b){var c,d,e,f,g,h,i,j;if(1===b.nodeType){if(L.hasData(a)&&(f=L.access(a),g=L.set(b,f),j=f.events)){delete g.handle,g.events={};for(e in j)for(c=0,d=j[e].length;d>c;c++)n.event.add(b,e,j[e][c])}M.hasData(a)&&(h=M.access(a),i=n.extend({},h),M.set(b,i))}}function ob(a,b){var c=a.getElementsByTagName?a.getElementsByTagName(b||"*"):a.querySelectorAll?a.querySelectorAll(b||"*"):[];return void 0===b||b&&n.nodeName(a,b)?n.merge([a],c):c}function pb(a,b){var c=b.nodeName.toLowerCase();"input"===c&&T.test(a.type)?b.checked=a.checked:("input"===c||"textarea"===c)&&(b.defaultValue=a.defaultValue)}n.extend({clone:function(a,b,c){var d,e,f,g,h=a.cloneNode(!0),i=n.contains(a.ownerDocument,a);if(!(k.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||n.isXMLDoc(a)))for(g=ob(h),f=ob(a),d=0,e=f.length;e>d;d++)pb(f[d],g[d]);if(b)if(c)for(f=f||ob(a),g=g||ob(h),d=0,e=f.length;e>d;d++)nb(f[d],g[d]);else nb(a,h);return g=ob(h,"script"),g.length>0&&mb(g,!i&&ob(a,"script")),h},buildFragment:function(a,b,c,d){for(var e,f,g,h,i,j,k=b.createDocumentFragment(),l=[],m=0,o=a.length;o>m;m++)if(e=a[m],e||0===e)if("object"===n.type(e))n.merge(l,e.nodeType?[e]:e);else if(cb.test(e)){f=f||k.appendChild(b.createElement("div")),g=(bb.exec(e)||["",""])[1].toLowerCase(),h=ib[g]||ib._default,f.innerHTML=h[1]+e.replace(ab,"<$1></$2>")+h[2],j=h[0];while(j--)f=f.lastChild;n.merge(l,f.childNodes),f=k.firstChild,f.textContent=""}else l.push(b.createTextNode(e));k.textContent="",m=0;while(e=l[m++])if((!d||-1===n.inArray(e,d))&&(i=n.contains(e.ownerDocument,e),f=ob(k.appendChild(e),"script"),i&&mb(f),c)){j=0;while(e=f[j++])fb.test(e.type||"")&&c.push(e)}return k},cleanData:function(a){for(var b,c,d,e,f=n.event.special,g=0;void 0!==(c=a[g]);g++){if(n.acceptData(c)&&(e=c[L.expando],e&&(b=L.cache[e]))){if(b.events)for(d in b.events)f[d]?n.event.remove(c,d):n.removeEvent(c,d,b.handle);L.cache[e]&&delete L.cache[e]}delete M.cache[c[M.expando]]}}}),n.fn.extend({text:function(a){return J(this,function(a){return void 0===a?n.text(this):this.empty().each(function(){(1===this.nodeType||11===this.nodeType||9===this.nodeType)&&(this.textContent=a)})},null,a,arguments.length)},append:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=jb(this,a);b.appendChild(a)}})},prepend:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=jb(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},remove:function(a,b){for(var c,d=a?n.filter(a,this):this,e=0;null!=(c=d[e]);e++)b||1!==c.nodeType||n.cleanData(ob(c)),c.parentNode&&(b&&n.contains(c.ownerDocument,c)&&mb(ob(c,"script")),c.parentNode.removeChild(c));return this},empty:function(){for(var a,b=0;null!=(a=this[b]);b++)1===a.nodeType&&(n.cleanData(ob(a,!1)),a.textContent="");return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return n.clone(this,a,b)})},html:function(a){return J(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a&&1===b.nodeType)return b.innerHTML;if("string"==typeof a&&!db.test(a)&&!ib[(bb.exec(a)||["",""])[1].toLowerCase()]){a=a.replace(ab,"<$1></$2>");try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(n.cleanData(ob(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=arguments[0];return this.domManip(arguments,function(b){a=this.parentNode,n.cleanData(ob(this)),a&&a.replaceChild(b,this)}),a&&(a.length||a.nodeType)?this:this.remove()},detach:function(a){return this.remove(a,!0)},domManip:function(a,b){a=e.apply([],a);var c,d,f,g,h,i,j=0,l=this.length,m=this,o=l-1,p=a[0],q=n.isFunction(p);if(q||l>1&&"string"==typeof p&&!k.checkClone&&eb.test(p))return this.each(function(c){var d=m.eq(c);q&&(a[0]=p.call(this,c,d.html())),d.domManip(a,b)});if(l&&(c=n.buildFragment(a,this[0].ownerDocument,!1,this),d=c.firstChild,1===c.childNodes.length&&(c=d),d)){for(f=n.map(ob(c,"script"),kb),g=f.length;l>j;j++)h=c,j!==o&&(h=n.clone(h,!0,!0),g&&n.merge(f,ob(h,"script"))),b.call(this[j],h,j);if(g)for(i=f[f.length-1].ownerDocument,n.map(f,lb),j=0;g>j;j++)h=f[j],fb.test(h.type||"")&&!L.access(h,"globalEval")&&n.contains(i,h)&&(h.src?n._evalUrl&&n._evalUrl(h.src):n.globalEval(h.textContent.replace(hb,"")))}return this}}),n.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){n.fn[a]=function(a){for(var c,d=[],e=n(a),g=e.length-1,h=0;g>=h;h++)c=h===g?this:this.clone(!0),n(e[h])[b](c),f.apply(d,c.get());return this.pushStack(d)}});var qb,rb={};function sb(b,c){var d,e=n(c.createElement(b)).appendTo(c.body),f=a.getDefaultComputedStyle&&(d=a.getDefaultComputedStyle(e[0]))?d.display:n.css(e[0],"display");return e.detach(),f}function tb(a){var b=l,c=rb[a];return c||(c=sb(a,b),"none"!==c&&c||(qb=(qb||n("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=qb[0].contentDocument,b.write(),b.close(),c=sb(a,b),qb.detach()),rb[a]=c),c}var ub=/^margin/,vb=new RegExp("^("+Q+")(?!px)[a-z%]+$","i"),wb=function(a){return a.ownerDocument.defaultView.getComputedStyle(a,null)};function xb(a,b,c){var d,e,f,g,h=a.style;return c=c||wb(a),c&&(g=c.getPropertyValue(b)||c[b]),c&&(""!==g||n.contains(a.ownerDocument,a)||(g=n.style(a,b)),vb.test(g)&&ub.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0!==g?g+"":g}function yb(a,b){return{get:function(){return a()?void delete this.get:(this.get=b).apply(this,arguments)}}}!function(){var b,c,d=l.documentElement,e=l.createElement("div"),f=l.createElement("div");if(f.style){f.style.backgroundClip="content-box",f.cloneNode(!0).style.backgroundClip="",k.clearCloneStyle="content-box"===f.style.backgroundClip,e.style.cssText="border:0;width:0;height:0;top:0;left:-9999px;margin-top:1px;position:absolute",e.appendChild(f);function g(){f.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute",f.innerHTML="",d.appendChild(e);var g=a.getComputedStyle(f,null);b="1%"!==g.top,c="4px"===g.width,d.removeChild(e)}a.getComputedStyle&&n.extend(k,{pixelPosition:function(){return g(),b},boxSizingReliable:function(){return null==c&&g(),c},reliableMarginRight:function(){var b,c=f.appendChild(l.createElement("div"));return c.style.cssText=f.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0",c.style.marginRight=c.style.width="0",f.style.width="1px",d.appendChild(e),b=!parseFloat(a.getComputedStyle(c,null).marginRight),d.removeChild(e),b}})}}(),n.swap=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};var zb=/^(none|table(?!-c[ea]).+)/,Ab=new RegExp("^("+Q+")(.*)$","i"),Bb=new RegExp("^([+-])=("+Q+")","i"),Cb={position:"absolute",visibility:"hidden",display:"block"},Db={letterSpacing:"0",fontWeight:"400"},Eb=["Webkit","O","Moz","ms"];function Fb(a,b){if(b in a)return b;var c=b[0].toUpperCase()+b.slice(1),d=b,e=Eb.length;while(e--)if(b=Eb[e]+c,b in a)return b;return d}function Gb(a,b,c){var d=Ab.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function Hb(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=n.css(a,c+R[f],!0,e)),d?("content"===c&&(g-=n.css(a,"padding"+R[f],!0,e)),"margin"!==c&&(g-=n.css(a,"border"+R[f]+"Width",!0,e))):(g+=n.css(a,"padding"+R[f],!0,e),"padding"!==c&&(g+=n.css(a,"border"+R[f]+"Width",!0,e)));return g}function Ib(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=wb(a),g="border-box"===n.css(a,"boxSizing",!1,f);if(0>=e||null==e){if(e=xb(a,b,f),(0>e||null==e)&&(e=a.style[b]),vb.test(e))return e;d=g&&(k.boxSizingReliable()||e===a.style[b]),e=parseFloat(e)||0}return e+Hb(a,b,c||(g?"border":"content"),d,f)+"px"}function Jb(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=L.get(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&S(d)&&(f[g]=L.access(d,"olddisplay",tb(d.nodeName)))):(e=S(d),"none"===c&&e||L.set(d,"olddisplay",e?c:n.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}n.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=xb(a,"opacity");return""===c?"1":c}}}},cssNumber:{columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":"cssFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=n.camelCase(b),i=a.style;return b=n.cssProps[h]||(n.cssProps[h]=Fb(i,h)),g=n.cssHooks[b]||n.cssHooks[h],void 0===c?g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b]:(f=typeof c,"string"===f&&(e=Bb.exec(c))&&(c=(e[1]+1)*e[2]+parseFloat(n.css(a,b)),f="number"),null!=c&&c===c&&("number"!==f||n.cssNumber[h]||(c+="px"),k.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),g&&"set"in g&&void 0===(c=g.set(a,c,d))||(i[b]=c)),void 0)}},css:function(a,b,c,d){var e,f,g,h=n.camelCase(b);return b=n.cssProps[h]||(n.cssProps[h]=Fb(a.style,h)),g=n.cssHooks[b]||n.cssHooks[h],g&&"get"in g&&(e=g.get(a,!0,c)),void 0===e&&(e=xb(a,b,d)),"normal"===e&&b in Db&&(e=Db[b]),""===c||c?(f=parseFloat(e),c===!0||n.isNumeric(f)?f||0:e):e}}),n.each(["height","width"],function(a,b){n.cssHooks[b]={get:function(a,c,d){return c?zb.test(n.css(a,"display"))&&0===a.offsetWidth?n.swap(a,Cb,function(){return Ib(a,b,d)}):Ib(a,b,d):void 0},set:function(a,c,d){var e=d&&wb(a);return Gb(a,c,d?Hb(a,b,d,"border-box"===n.css(a,"boxSizing",!1,e),e):0)}}}),n.cssHooks.marginRight=yb(k.reliableMarginRight,function(a,b){return b?n.swap(a,{display:"inline-block"},xb,[a,"marginRight"]):void 0}),n.each({margin:"",padding:"",border:"Width"},function(a,b){n.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+R[d]+b]=f[d]||f[d-2]||f[0];return e}},ub.test(a)||(n.cssHooks[a+b].set=Gb)}),n.fn.extend({css:function(a,b){return J(this,function(a,b,c){var d,e,f={},g=0;if(n.isArray(b)){for(d=wb(a),e=b.length;e>g;g++)f[b[g]]=n.css(a,b[g],!1,d);return f}return void 0!==c?n.style(a,b,c):n.css(a,b)},a,b,arguments.length>1)},show:function(){return Jb(this,!0)},hide:function(){return Jb(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){S(this)?n(this).show():n(this).hide()})}});function Kb(a,b,c,d,e){return new Kb.prototype.init(a,b,c,d,e)}n.Tween=Kb,Kb.prototype={constructor:Kb,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(n.cssNumber[c]?"":"px")},cur:function(){var a=Kb.propHooks[this.prop];return a&&a.get?a.get(this):Kb.propHooks._default.get(this)},run:function(a){var b,c=Kb.propHooks[this.prop];return this.pos=b=this.options.duration?n.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Kb.propHooks._default.set(this),this}},Kb.prototype.init.prototype=Kb.prototype,Kb.propHooks={_default:{get:function(a){var b;return null==a.elem[a.prop]||a.elem.style&&null!=a.elem.style[a.prop]?(b=n.css(a.elem,a.prop,""),b&&"auto"!==b?b:0):a.elem[a.prop]},set:function(a){n.fx.step[a.prop]?n.fx.step[a.prop](a):a.elem.style&&(null!=a.elem.style[n.cssProps[a.prop]]||n.cssHooks[a.prop])?n.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},Kb.propHooks.scrollTop=Kb.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},n.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},n.fx=Kb.prototype.init,n.fx.step={};var Lb,Mb,Nb=/^(?:toggle|show|hide)$/,Ob=new RegExp("^(?:([+-])=|)("+Q+")([a-z%]*)$","i"),Pb=/queueHooks$/,Qb=[Vb],Rb={"*":[function(a,b){var c=this.createTween(a,b),d=c.cur(),e=Ob.exec(b),f=e&&e[3]||(n.cssNumber[a]?"":"px"),g=(n.cssNumber[a]||"px"!==f&&+d)&&Ob.exec(n.css(c.elem,a)),h=1,i=20;if(g&&g[3]!==f){f=f||g[3],e=e||[],g=+d||1;do h=h||".5",g/=h,n.style(c.elem,a,g+f);while(h!==(h=c.cur()/d)&&1!==h&&--i)}return e&&(g=c.start=+g||+d||0,c.unit=f,c.end=e[1]?g+(e[1]+1)*e[2]:+e[2]),c}]};function Sb(){return setTimeout(function(){Lb=void 0}),Lb=n.now()}function Tb(a,b){var c,d=0,e={height:a};for(b=b?1:0;4>d;d+=2-b)c=R[d],e["margin"+c]=e["padding"+c]=a;return b&&(e.opacity=e.width=a),e}function Ub(a,b,c){for(var d,e=(Rb[b]||[]).concat(Rb["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function Vb(a,b,c){var d,e,f,g,h,i,j,k,l=this,m={},o=a.style,p=a.nodeType&&S(a),q=L.get(a,"fxshow");c.queue||(h=n._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,l.always(function(){l.always(function(){h.unqueued--,n.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[o.overflow,o.overflowX,o.overflowY],j=n.css(a,"display"),k="none"===j?L.get(a,"olddisplay")||tb(a.nodeName):j,"inline"===k&&"none"===n.css(a,"float")&&(o.display="inline-block")),c.overflow&&(o.overflow="hidden",l.always(function(){o.overflow=c.overflow[0],o.overflowX=c.overflow[1],o.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],Nb.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(p?"hide":"show")){if("show"!==e||!q||void 0===q[d])continue;p=!0}m[d]=q&&q[d]||n.style(a,d)}else j=void 0;if(n.isEmptyObject(m))"inline"===("none"===j?tb(a.nodeName):j)&&(o.display=j);else{q?"hidden"in q&&(p=q.hidden):q=L.access(a,"fxshow",{}),f&&(q.hidden=!p),p?n(a).show():l.done(function(){n(a).hide()}),l.done(function(){var b;L.remove(a,"fxshow");for(b in m)n.style(a,b,m[b])});for(d in m)g=Ub(p?q[d]:0,d,l),d in q||(q[d]=g.start,p&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function Wb(a,b){var c,d,e,f,g;for(c in a)if(d=n.camelCase(c),e=b[d],f=a[c],n.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=n.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function Xb(a,b,c){var d,e,f=0,g=Qb.length,h=n.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=Lb||Sb(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:n.extend({},b),opts:n.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:Lb||Sb(),duration:c.duration,tweens:[],createTween:function(b,c){var d=n.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;for(Wb(k,j.opts.specialEasing);g>f;f++)if(d=Qb[f].call(j,a,k,j.opts))return d;return n.map(k,Ub,j),n.isFunction(j.opts.start)&&j.opts.start.call(a,j),n.fx.timer(n.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}n.Animation=n.extend(Xb,{tweener:function(a,b){n.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");for(var c,d=0,e=a.length;e>d;d++)c=a[d],Rb[c]=Rb[c]||[],Rb[c].unshift(b)},prefilter:function(a,b){b?Qb.unshift(a):Qb.push(a)}}),n.speed=function(a,b,c){var d=a&&"object"==typeof a?n.extend({},a):{complete:c||!c&&b||n.isFunction(a)&&a,duration:a,easing:c&&b||b&&!n.isFunction(b)&&b};return d.duration=n.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in n.fx.speeds?n.fx.speeds[d.duration]:n.fx.speeds._default,(null==d.queue||d.queue===!0)&&(d.queue="fx"),d.old=d.complete,d.complete=function(){n.isFunction(d.old)&&d.old.call(this),d.queue&&n.dequeue(this,d.queue)},d},n.fn.extend({fadeTo:function(a,b,c,d){return this.filter(S).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=n.isEmptyObject(a),f=n.speed(b,c,d),g=function(){var b=Xb(this,n.extend({},a),f);(e||L.get(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=n.timers,g=L.get(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&Pb.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));(b||!c)&&n.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=L.get(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=n.timers,g=d?d.length:0;for(c.finish=!0,n.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),n.each(["toggle","show","hide"],function(a,b){var c=n.fn[b];n.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(Tb(b,!0),a,d,e)}}),n.each({slideDown:Tb("show"),slideUp:Tb("hide"),slideToggle:Tb("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){n.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),n.timers=[],n.fx.tick=function(){var a,b=0,c=n.timers;for(Lb=n.now();b<c.length;b++)a=c[b],a()||c[b]!==a||c.splice(b--,1);c.length||n.fx.stop(),Lb=void 0},n.fx.timer=function(a){n.timers.push(a),a()?n.fx.start():n.timers.pop()},n.fx.interval=13,n.fx.start=function(){Mb||(Mb=setInterval(n.fx.tick,n.fx.interval))},n.fx.stop=function(){clearInterval(Mb),Mb=null},n.fx.speeds={slow:600,fast:200,_default:400},n.fn.delay=function(a,b){return a=n.fx?n.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},function(){var a=l.createElement("input"),b=l.createElement("select"),c=b.appendChild(l.createElement("option"));a.type="checkbox",k.checkOn=""!==a.value,k.optSelected=c.selected,b.disabled=!0,k.optDisabled=!c.disabled,a=l.createElement("input"),a.value="t",a.type="radio",k.radioValue="t"===a.value}();var Yb,Zb,$b=n.expr.attrHandle;n.fn.extend({attr:function(a,b){return J(this,n.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){n.removeAttr(this,a)})}}),n.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(a&&3!==f&&8!==f&&2!==f)return typeof a.getAttribute===U?n.prop(a,b,c):(1===f&&n.isXMLDoc(a)||(b=b.toLowerCase(),d=n.attrHooks[b]||(n.expr.match.bool.test(b)?Zb:Yb)),void 0===c?d&&"get"in d&&null!==(e=d.get(a,b))?e:(e=n.find.attr(a,b),null==e?void 0:e):null!==c?d&&"set"in d&&void 0!==(e=d.set(a,c,b))?e:(a.setAttribute(b,c+""),c):void n.removeAttr(a,b))
},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(E);if(f&&1===a.nodeType)while(c=f[e++])d=n.propFix[c]||c,n.expr.match.bool.test(c)&&(a[d]=!1),a.removeAttribute(c)},attrHooks:{type:{set:function(a,b){if(!k.radioValue&&"radio"===b&&n.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}}}),Zb={set:function(a,b,c){return b===!1?n.removeAttr(a,c):a.setAttribute(c,c),c}},n.each(n.expr.match.bool.source.match(/\w+/g),function(a,b){var c=$b[b]||n.find.attr;$b[b]=function(a,b,d){var e,f;return d||(f=$b[b],$b[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,$b[b]=f),e}});var _b=/^(?:input|select|textarea|button)$/i;n.fn.extend({prop:function(a,b){return J(this,n.prop,a,b,arguments.length>1)},removeProp:function(a){return this.each(function(){delete this[n.propFix[a]||a]})}}),n.extend({propFix:{"for":"htmlFor","class":"className"},prop:function(a,b,c){var d,e,f,g=a.nodeType;if(a&&3!==g&&8!==g&&2!==g)return f=1!==g||!n.isXMLDoc(a),f&&(b=n.propFix[b]||b,e=n.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){return a.hasAttribute("tabindex")||_b.test(a.nodeName)||a.href?a.tabIndex:-1}}}}),k.optSelected||(n.propHooks.selected={get:function(a){var b=a.parentNode;return b&&b.parentNode&&b.parentNode.selectedIndex,null}}),n.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){n.propFix[this.toLowerCase()]=this});var ac=/[\t\r\n\f]/g;n.fn.extend({addClass:function(a){var b,c,d,e,f,g,h="string"==typeof a&&a,i=0,j=this.length;if(n.isFunction(a))return this.each(function(b){n(this).addClass(a.call(this,b,this.className))});if(h)for(b=(a||"").match(E)||[];j>i;i++)if(c=this[i],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ac," "):" ")){f=0;while(e=b[f++])d.indexOf(" "+e+" ")<0&&(d+=e+" ");g=n.trim(d),c.className!==g&&(c.className=g)}return this},removeClass:function(a){var b,c,d,e,f,g,h=0===arguments.length||"string"==typeof a&&a,i=0,j=this.length;if(n.isFunction(a))return this.each(function(b){n(this).removeClass(a.call(this,b,this.className))});if(h)for(b=(a||"").match(E)||[];j>i;i++)if(c=this[i],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(ac," "):"")){f=0;while(e=b[f++])while(d.indexOf(" "+e+" ")>=0)d=d.replace(" "+e+" "," ");g=a?n.trim(d):"",c.className!==g&&(c.className=g)}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):this.each(n.isFunction(a)?function(c){n(this).toggleClass(a.call(this,c,this.className,b),b)}:function(){if("string"===c){var b,d=0,e=n(this),f=a.match(E)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else(c===U||"boolean"===c)&&(this.className&&L.set(this,"__className__",this.className),this.className=this.className||a===!1?"":L.get(this,"__className__")||"")})},hasClass:function(a){for(var b=" "+a+" ",c=0,d=this.length;d>c;c++)if(1===this[c].nodeType&&(" "+this[c].className+" ").replace(ac," ").indexOf(b)>=0)return!0;return!1}});var bc=/\r/g;n.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=n.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,n(this).val()):a,null==e?e="":"number"==typeof e?e+="":n.isArray(e)&&(e=n.map(e,function(a){return null==a?"":a+""})),b=n.valHooks[this.type]||n.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=n.valHooks[e.type]||n.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(bc,""):null==c?"":c)}}}),n.extend({valHooks:{option:{get:function(a){var b=n.find.attr(a,"value");return null!=b?b:n.trim(n.text(a))}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],!(!c.selected&&i!==e||(k.optDisabled?c.disabled:null!==c.getAttribute("disabled"))||c.parentNode.disabled&&n.nodeName(c.parentNode,"optgroup"))){if(b=n(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=n.makeArray(b),g=e.length;while(g--)d=e[g],(d.selected=n.inArray(d.value,f)>=0)&&(c=!0);return c||(a.selectedIndex=-1),f}}}}),n.each(["radio","checkbox"],function(){n.valHooks[this]={set:function(a,b){return n.isArray(b)?a.checked=n.inArray(n(a).val(),b)>=0:void 0}},k.checkOn||(n.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})}),n.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){n.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),n.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}});var cc=n.now(),dc=/\?/;n.parseJSON=function(a){return JSON.parse(a+"")},n.parseXML=function(a){var b,c;if(!a||"string"!=typeof a)return null;try{c=new DOMParser,b=c.parseFromString(a,"text/xml")}catch(d){b=void 0}return(!b||b.getElementsByTagName("parsererror").length)&&n.error("Invalid XML: "+a),b};var ec,fc,gc=/#.*$/,hc=/([?&])_=[^&]*/,ic=/^(.*?):[ \t]*([^\r\n]*)$/gm,jc=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,kc=/^(?:GET|HEAD)$/,lc=/^\/\//,mc=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,nc={},oc={},pc="*/".concat("*");try{fc=location.href}catch(qc){fc=l.createElement("a"),fc.href="",fc=fc.href}ec=mc.exec(fc.toLowerCase())||[];function rc(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(E)||[];if(n.isFunction(c))while(d=f[e++])"+"===d[0]?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function sc(a,b,c,d){var e={},f=a===oc;function g(h){var i;return e[h]=!0,n.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function tc(a,b){var c,d,e=n.ajaxSettings.flatOptions||{};for(c in b)void 0!==b[c]&&((e[c]?a:d||(d={}))[c]=b[c]);return d&&n.extend(!0,a,d),a}function uc(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===d&&(d=a.mimeType||b.getResponseHeader("Content-Type"));if(d)for(e in h)if(h[e]&&h[e].test(d)){i.unshift(e);break}if(i[0]in c)f=i[0];else{for(e in c){if(!i[0]||a.converters[e+" "+i[0]]){f=e;break}g||(g=e)}f=f||g}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function vc(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}n.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:fc,type:"GET",isLocal:jc.test(ec[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":pc,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":n.parseJSON,"text xml":n.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?tc(tc(a,n.ajaxSettings),b):tc(n.ajaxSettings,a)},ajaxPrefilter:rc(nc),ajaxTransport:rc(oc),ajax:function(a,b){"object"==typeof a&&(b=a,a=void 0),b=b||{};var c,d,e,f,g,h,i,j,k=n.ajaxSetup({},b),l=k.context||k,m=k.context&&(l.nodeType||l.jquery)?n(l):n.event,o=n.Deferred(),p=n.Callbacks("once memory"),q=k.statusCode||{},r={},s={},t=0,u="canceled",v={readyState:0,getResponseHeader:function(a){var b;if(2===t){if(!f){f={};while(b=ic.exec(e))f[b[1].toLowerCase()]=b[2]}b=f[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===t?e:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return t||(a=s[c]=s[c]||a,r[a]=b),this},overrideMimeType:function(a){return t||(k.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>t)for(b in a)q[b]=[q[b],a[b]];else v.always(a[v.status]);return this},abort:function(a){var b=a||u;return c&&c.abort(b),x(0,b),this}};if(o.promise(v).complete=p.add,v.success=v.done,v.error=v.fail,k.url=((a||k.url||fc)+"").replace(gc,"").replace(lc,ec[1]+"//"),k.type=b.method||b.type||k.method||k.type,k.dataTypes=n.trim(k.dataType||"*").toLowerCase().match(E)||[""],null==k.crossDomain&&(h=mc.exec(k.url.toLowerCase()),k.crossDomain=!(!h||h[1]===ec[1]&&h[2]===ec[2]&&(h[3]||("http:"===h[1]?"80":"443"))===(ec[3]||("http:"===ec[1]?"80":"443")))),k.data&&k.processData&&"string"!=typeof k.data&&(k.data=n.param(k.data,k.traditional)),sc(nc,k,b,v),2===t)return v;i=k.global,i&&0===n.active++&&n.event.trigger("ajaxStart"),k.type=k.type.toUpperCase(),k.hasContent=!kc.test(k.type),d=k.url,k.hasContent||(k.data&&(d=k.url+=(dc.test(d)?"&":"?")+k.data,delete k.data),k.cache===!1&&(k.url=hc.test(d)?d.replace(hc,"$1_="+cc++):d+(dc.test(d)?"&":"?")+"_="+cc++)),k.ifModified&&(n.lastModified[d]&&v.setRequestHeader("If-Modified-Since",n.lastModified[d]),n.etag[d]&&v.setRequestHeader("If-None-Match",n.etag[d])),(k.data&&k.hasContent&&k.contentType!==!1||b.contentType)&&v.setRequestHeader("Content-Type",k.contentType),v.setRequestHeader("Accept",k.dataTypes[0]&&k.accepts[k.dataTypes[0]]?k.accepts[k.dataTypes[0]]+("*"!==k.dataTypes[0]?", "+pc+"; q=0.01":""):k.accepts["*"]);for(j in k.headers)v.setRequestHeader(j,k.headers[j]);if(k.beforeSend&&(k.beforeSend.call(l,v,k)===!1||2===t))return v.abort();u="abort";for(j in{success:1,error:1,complete:1})v[j](k[j]);if(c=sc(oc,k,b,v)){v.readyState=1,i&&m.trigger("ajaxSend",[v,k]),k.async&&k.timeout>0&&(g=setTimeout(function(){v.abort("timeout")},k.timeout));try{t=1,c.send(r,x)}catch(w){if(!(2>t))throw w;x(-1,w)}}else x(-1,"No Transport");function x(a,b,f,h){var j,r,s,u,w,x=b;2!==t&&(t=2,g&&clearTimeout(g),c=void 0,e=h||"",v.readyState=a>0?4:0,j=a>=200&&300>a||304===a,f&&(u=uc(k,v,f)),u=vc(k,u,v,j),j?(k.ifModified&&(w=v.getResponseHeader("Last-Modified"),w&&(n.lastModified[d]=w),w=v.getResponseHeader("etag"),w&&(n.etag[d]=w)),204===a||"HEAD"===k.type?x="nocontent":304===a?x="notmodified":(x=u.state,r=u.data,s=u.error,j=!s)):(s=x,(a||!x)&&(x="error",0>a&&(a=0))),v.status=a,v.statusText=(b||x)+"",j?o.resolveWith(l,[r,x,v]):o.rejectWith(l,[v,x,s]),v.statusCode(q),q=void 0,i&&m.trigger(j?"ajaxSuccess":"ajaxError",[v,k,j?r:s]),p.fireWith(l,[v,x]),i&&(m.trigger("ajaxComplete",[v,k]),--n.active||n.event.trigger("ajaxStop")))}return v},getJSON:function(a,b,c){return n.get(a,b,c,"json")},getScript:function(a,b){return n.get(a,void 0,b,"script")}}),n.each(["get","post"],function(a,b){n[b]=function(a,c,d,e){return n.isFunction(c)&&(e=e||d,d=c,c=void 0),n.ajax({url:a,type:b,dataType:e,data:c,success:d})}}),n.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){n.fn[b]=function(a){return this.on(b,a)}}),n._evalUrl=function(a){return n.ajax({url:a,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})},n.fn.extend({wrapAll:function(a){var b;return n.isFunction(a)?this.each(function(b){n(this).wrapAll(a.call(this,b))}):(this[0]&&(b=n(a,this[0].ownerDocument).eq(0).clone(!0),this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstElementChild)a=a.firstElementChild;return a}).append(this)),this)},wrapInner:function(a){return this.each(n.isFunction(a)?function(b){n(this).wrapInner(a.call(this,b))}:function(){var b=n(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=n.isFunction(a);return this.each(function(c){n(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){n.nodeName(this,"body")||n(this).replaceWith(this.childNodes)}).end()}}),n.expr.filters.hidden=function(a){return a.offsetWidth<=0&&a.offsetHeight<=0},n.expr.filters.visible=function(a){return!n.expr.filters.hidden(a)};var wc=/%20/g,xc=/\[\]$/,yc=/\r?\n/g,zc=/^(?:submit|button|image|reset|file)$/i,Ac=/^(?:input|select|textarea|keygen)/i;function Bc(a,b,c,d){var e;if(n.isArray(b))n.each(b,function(b,e){c||xc.test(a)?d(a,e):Bc(a+"["+("object"==typeof e?b:"")+"]",e,c,d)});else if(c||"object"!==n.type(b))d(a,b);else for(e in b)Bc(a+"["+e+"]",b[e],c,d)}n.param=function(a,b){var c,d=[],e=function(a,b){b=n.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=n.ajaxSettings&&n.ajaxSettings.traditional),n.isArray(a)||a.jquery&&!n.isPlainObject(a))n.each(a,function(){e(this.name,this.value)});else for(c in a)Bc(c,a[c],b,e);return d.join("&").replace(wc,"+")},n.fn.extend({serialize:function(){return n.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=n.prop(this,"elements");return a?n.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!n(this).is(":disabled")&&Ac.test(this.nodeName)&&!zc.test(a)&&(this.checked||!T.test(a))}).map(function(a,b){var c=n(this).val();return null==c?null:n.isArray(c)?n.map(c,function(a){return{name:b.name,value:a.replace(yc,"\r\n")}}):{name:b.name,value:c.replace(yc,"\r\n")}}).get()}}),n.ajaxSettings.xhr=function(){try{return new XMLHttpRequest}catch(a){}};var Cc=0,Dc={},Ec={0:200,1223:204},Fc=n.ajaxSettings.xhr();a.ActiveXObject&&n(a).on("unload",function(){for(var a in Dc)Dc[a]()}),k.cors=!!Fc&&"withCredentials"in Fc,k.ajax=Fc=!!Fc,n.ajaxTransport(function(a){var b;return k.cors||Fc&&!a.crossDomain?{send:function(c,d){var e,f=a.xhr(),g=++Cc;if(f.open(a.type,a.url,a.async,a.username,a.password),a.xhrFields)for(e in a.xhrFields)f[e]=a.xhrFields[e];a.mimeType&&f.overrideMimeType&&f.overrideMimeType(a.mimeType),a.crossDomain||c["X-Requested-With"]||(c["X-Requested-With"]="XMLHttpRequest");for(e in c)f.setRequestHeader(e,c[e]);b=function(a){return function(){b&&(delete Dc[g],b=f.onload=f.onerror=null,"abort"===a?f.abort():"error"===a?d(f.status,f.statusText):d(Ec[f.status]||f.status,f.statusText,"string"==typeof f.responseText?{text:f.responseText}:void 0,f.getAllResponseHeaders()))}},f.onload=b(),f.onerror=b("error"),b=Dc[g]=b("abort");try{f.send(a.hasContent&&a.data||null)}catch(h){if(b)throw h}},abort:function(){b&&b()}}:void 0}),n.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(a){return n.globalEval(a),a}}}),n.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET")}),n.ajaxTransport("script",function(a){if(a.crossDomain){var b,c;return{send:function(d,e){b=n("<script>").prop({async:!0,charset:a.scriptCharset,src:a.url}).on("load error",c=function(a){b.remove(),c=null,a&&e("error"===a.type?404:200,a.type)}),l.head.appendChild(b[0])},abort:function(){c&&c()}}}});var Gc=[],Hc=/(=)\?(?=&|$)|\?\?/;n.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=Gc.pop()||n.expando+"_"+cc++;return this[a]=!0,a}}),n.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(Hc.test(b.url)?"url":"string"==typeof b.data&&!(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&Hc.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=n.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(Hc,"$1"+e):b.jsonp!==!1&&(b.url+=(dc.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||n.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,Gc.push(e)),g&&n.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),n.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||l;var d=v.exec(a),e=!c&&[];return d?[b.createElement(d[1])]:(d=n.buildFragment([a],b,e),e&&e.length&&n(e).remove(),n.merge([],d.childNodes))};var Ic=n.fn.load;n.fn.load=function(a,b,c){if("string"!=typeof a&&Ic)return Ic.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>=0&&(d=n.trim(a.slice(h)),a=a.slice(0,h)),n.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(e="POST"),g.length>0&&n.ajax({url:a,type:e,dataType:"html",data:b}).done(function(a){f=arguments,g.html(d?n("<div>").append(n.parseHTML(a)).find(d):a)}).complete(c&&function(a,b){g.each(c,f||[a.responseText,b,a])}),this},n.expr.filters.animated=function(a){return n.grep(n.timers,function(b){return a===b.elem}).length};var Jc=a.document.documentElement;function Kc(a){return n.isWindow(a)?a:9===a.nodeType&&a.defaultView}n.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=n.css(a,"position"),l=n(a),m={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=n.css(a,"top"),i=n.css(a,"left"),j=("absolute"===k||"fixed"===k)&&(f+i).indexOf("auto")>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),n.isFunction(b)&&(b=b.call(a,c,h)),null!=b.top&&(m.top=b.top-h.top+g),null!=b.left&&(m.left=b.left-h.left+e),"using"in b?b.using.call(a,m):l.css(m)}},n.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){n.offset.setOffset(this,a,b)});var b,c,d=this[0],e={top:0,left:0},f=d&&d.ownerDocument;if(f)return b=f.documentElement,n.contains(b,d)?(typeof d.getBoundingClientRect!==U&&(e=d.getBoundingClientRect()),c=Kc(f),{top:e.top+c.pageYOffset-b.clientTop,left:e.left+c.pageXOffset-b.clientLeft}):e},position:function(){if(this[0]){var a,b,c=this[0],d={top:0,left:0};return"fixed"===n.css(c,"position")?b=c.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),n.nodeName(a[0],"html")||(d=a.offset()),d.top+=n.css(a[0],"borderTopWidth",!0),d.left+=n.css(a[0],"borderLeftWidth",!0)),{top:b.top-d.top-n.css(c,"marginTop",!0),left:b.left-d.left-n.css(c,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||Jc;while(a&&!n.nodeName(a,"html")&&"static"===n.css(a,"position"))a=a.offsetParent;return a||Jc})}}),n.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(b,c){var d="pageYOffset"===c;n.fn[b]=function(e){return J(this,function(b,e,f){var g=Kc(b);return void 0===f?g?g[c]:b[e]:void(g?g.scrollTo(d?a.pageXOffset:f,d?f:a.pageYOffset):b[e]=f)},b,e,arguments.length,null)}}),n.each(["top","left"],function(a,b){n.cssHooks[b]=yb(k.pixelPosition,function(a,c){return c?(c=xb(a,b),vb.test(c)?n(a).position()[b]+"px":c):void 0})}),n.each({Height:"height",Width:"width"},function(a,b){n.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){n.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return J(this,function(b,c,d){var e;return n.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?n.css(b,c,g):n.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),n.fn.size=function(){return this.length},n.fn.andSelf=n.fn.addBack,"function"==typeof define&&define.amd&&define("jquery",[],function(){return n});var Lc=a.jQuery,Mc=a.$;return n.noConflict=function(b){return a.$===n&&(a.$=Mc),b&&a.jQuery===n&&(a.jQuery=Lc),n},typeof b===U&&(a.jQuery=a.$=n),n});
//# sourceMappingURL=jquery.min.map
(function() {
    "use strict";
    function $$route$recognizer$dsl$$Target(path, matcher, delegate) {
      this.path = path;
      this.matcher = matcher;
      this.delegate = delegate;
    }

    $$route$recognizer$dsl$$Target.prototype = {
      to: function(target, callback) {
        var delegate = this.delegate;

        if (delegate && delegate.willAddRoute) {
          target = delegate.willAddRoute(this.matcher.target, target);
        }

        this.matcher.add(this.path, target);

        if (callback) {
          if (callback.length === 0) { throw new Error("You must have an argument in the function passed to `to`"); }
          this.matcher.addChild(this.path, target, callback, this.delegate);
        }
        return this;
      }
    };

    function $$route$recognizer$dsl$$Matcher(target) {
      this.routes = {};
      this.children = {};
      this.target = target;
    }

    $$route$recognizer$dsl$$Matcher.prototype = {
      add: function(path, handler) {
        this.routes[path] = handler;
      },

      addChild: function(path, target, callback, delegate) {
        var matcher = new $$route$recognizer$dsl$$Matcher(target);
        this.children[path] = matcher;

        var match = $$route$recognizer$dsl$$generateMatch(path, matcher, delegate);

        if (delegate && delegate.contextEntered) {
          delegate.contextEntered(target, match);
        }

        callback(match);
      }
    };

    function $$route$recognizer$dsl$$generateMatch(startingPath, matcher, delegate) {
      return function(path, nestedCallback) {
        var fullPath = startingPath + path;

        if (nestedCallback) {
          nestedCallback($$route$recognizer$dsl$$generateMatch(fullPath, matcher, delegate));
        } else {
          return new $$route$recognizer$dsl$$Target(startingPath + path, matcher, delegate);
        }
      };
    }

    function $$route$recognizer$dsl$$addRoute(routeArray, path, handler) {
      var len = 0;
      for (var i=0, l=routeArray.length; i<l; i++) {
        len += routeArray[i].path.length;
      }

      path = path.substr(len);
      var route = { path: path, handler: handler };
      routeArray.push(route);
    }

    function $$route$recognizer$dsl$$eachRoute(baseRoute, matcher, callback, binding) {
      var routes = matcher.routes;

      for (var path in routes) {
        if (routes.hasOwnProperty(path)) {
          var routeArray = baseRoute.slice();
          $$route$recognizer$dsl$$addRoute(routeArray, path, routes[path]);

          if (matcher.children[path]) {
            $$route$recognizer$dsl$$eachRoute(routeArray, matcher.children[path], callback, binding);
          } else {
            callback.call(binding, routeArray);
          }
        }
      }
    }

    var $$route$recognizer$dsl$$default = function(callback, addRouteCallback) {
      var matcher = new $$route$recognizer$dsl$$Matcher();

      callback($$route$recognizer$dsl$$generateMatch("", matcher, this.delegate));

      $$route$recognizer$dsl$$eachRoute([], matcher, function(route) {
        if (addRouteCallback) { addRouteCallback(this, route); }
        else { this.add(route); }
      }, this);
    };

    var $$route$recognizer$$specials = [
      '/', '.', '*', '+', '?', '|',
      '(', ')', '[', ']', '{', '}', '\\'
    ];

    var $$route$recognizer$$escapeRegex = new RegExp('(\\' + $$route$recognizer$$specials.join('|\\') + ')', 'g');

    function $$route$recognizer$$isArray(test) {
      return Object.prototype.toString.call(test) === "[object Array]";
    }

    // A Segment represents a segment in the original route description.
    // Each Segment type provides an `eachChar` and `regex` method.
    //
    // The `eachChar` method invokes the callback with one or more character
    // specifications. A character specification consumes one or more input
    // characters.
    //
    // The `regex` method returns a regex fragment for the segment. If the
    // segment is a dynamic of star segment, the regex fragment also includes
    // a capture.
    //
    // A character specification contains:
    //
    // * `validChars`: a String with a list of all valid characters, or
    // * `invalidChars`: a String with a list of all invalid characters
    // * `repeat`: true if the character specification can repeat

    function $$route$recognizer$$StaticSegment(string) { this.string = string; }
    $$route$recognizer$$StaticSegment.prototype = {
      eachChar: function(callback) {
        var string = this.string, ch;

        for (var i=0, l=string.length; i<l; i++) {
          ch = string.charAt(i);
          callback({ validChars: ch });
        }
      },

      regex: function() {
        return this.string.replace($$route$recognizer$$escapeRegex, '\\$1');
      },

      generate: function() {
        return this.string;
      }
    };

    function $$route$recognizer$$DynamicSegment(name) { this.name = name; }
    $$route$recognizer$$DynamicSegment.prototype = {
      eachChar: function(callback) {
        callback({ invalidChars: "/", repeat: true });
      },

      regex: function() {
        return "([^/]+)";
      },

      generate: function(params) {
        return params[this.name];
      }
    };

    function $$route$recognizer$$StarSegment(name) { this.name = name; }
    $$route$recognizer$$StarSegment.prototype = {
      eachChar: function(callback) {
        callback({ invalidChars: "", repeat: true });
      },

      regex: function() {
        return "(.+)";
      },

      generate: function(params) {
        return params[this.name];
      }
    };

    function $$route$recognizer$$EpsilonSegment() {}
    $$route$recognizer$$EpsilonSegment.prototype = {
      eachChar: function() {},
      regex: function() { return ""; },
      generate: function() { return ""; }
    };

    function $$route$recognizer$$parse(route, names, types) {
      // normalize route as not starting with a "/". Recognition will
      // also normalize.
      if (route.charAt(0) === "/") { route = route.substr(1); }

      var segments = route.split("/"), results = [];

      for (var i=0, l=segments.length; i<l; i++) {
        var segment = segments[i], match;

        if (match = segment.match(/^:([^\/]+)$/)) {
          results.push(new $$route$recognizer$$DynamicSegment(match[1]));
          names.push(match[1]);
          types.dynamics++;
        } else if (match = segment.match(/^\*([^\/]+)$/)) {
          results.push(new $$route$recognizer$$StarSegment(match[1]));
          names.push(match[1]);
          types.stars++;
        } else if(segment === "") {
          results.push(new $$route$recognizer$$EpsilonSegment());
        } else {
          results.push(new $$route$recognizer$$StaticSegment(segment));
          types.statics++;
        }
      }

      return results;
    }

    // A State has a character specification and (`charSpec`) and a list of possible
    // subsequent states (`nextStates`).
    //
    // If a State is an accepting state, it will also have several additional
    // properties:
    //
    // * `regex`: A regular expression that is used to extract parameters from paths
    //   that reached this accepting state.
    // * `handlers`: Information on how to convert the list of captures into calls
    //   to registered handlers with the specified parameters
    // * `types`: How many static, dynamic or star segments in this route. Used to
    //   decide which route to use if multiple registered routes match a path.
    //
    // Currently, State is implemented naively by looping over `nextStates` and
    // comparing a character specification against a character. A more efficient
    // implementation would use a hash of keys pointing at one or more next states.

    function $$route$recognizer$$State(charSpec) {
      this.charSpec = charSpec;
      this.nextStates = [];
    }

    $$route$recognizer$$State.prototype = {
      get: function(charSpec) {
        var nextStates = this.nextStates;

        for (var i=0, l=nextStates.length; i<l; i++) {
          var child = nextStates[i];

          var isEqual = child.charSpec.validChars === charSpec.validChars;
          isEqual = isEqual && child.charSpec.invalidChars === charSpec.invalidChars;

          if (isEqual) { return child; }
        }
      },

      put: function(charSpec) {
        var state;

        // If the character specification already exists in a child of the current
        // state, just return that state.
        if (state = this.get(charSpec)) { return state; }

        // Make a new state for the character spec
        state = new $$route$recognizer$$State(charSpec);

        // Insert the new state as a child of the current state
        this.nextStates.push(state);

        // If this character specification repeats, insert the new state as a child
        // of itself. Note that this will not trigger an infinite loop because each
        // transition during recognition consumes a character.
        if (charSpec.repeat) {
          state.nextStates.push(state);
        }

        // Return the new state
        return state;
      },

      // Find a list of child states matching the next character
      match: function(ch) {
        // DEBUG "Processing `" + ch + "`:"
        var nextStates = this.nextStates,
            child, charSpec, chars;

        // DEBUG "  " + debugState(this)
        var returned = [];

        for (var i=0, l=nextStates.length; i<l; i++) {
          child = nextStates[i];

          charSpec = child.charSpec;

          if (typeof (chars = charSpec.validChars) !== 'undefined') {
            if (chars.indexOf(ch) !== -1) { returned.push(child); }
          } else if (typeof (chars = charSpec.invalidChars) !== 'undefined') {
            if (chars.indexOf(ch) === -1) { returned.push(child); }
          }
        }

        return returned;
      }

      /** IF DEBUG
      , debug: function() {
        var charSpec = this.charSpec,
            debug = "[",
            chars = charSpec.validChars || charSpec.invalidChars;

        if (charSpec.invalidChars) { debug += "^"; }
        debug += chars;
        debug += "]";

        if (charSpec.repeat) { debug += "+"; }

        return debug;
      }
      END IF **/
    };

    /** IF DEBUG
    function debug(log) {
      console.log(log);
    }

    function debugState(state) {
      return state.nextStates.map(function(n) {
        if (n.nextStates.length === 0) { return "( " + n.debug() + " [accepting] )"; }
        return "( " + n.debug() + " <then> " + n.nextStates.map(function(s) { return s.debug() }).join(" or ") + " )";
      }).join(", ")
    }
    END IF **/

    // This is a somewhat naive strategy, but should work in a lot of cases
    // A better strategy would properly resolve /posts/:id/new and /posts/edit/:id.
    //
    // This strategy generally prefers more static and less dynamic matching.
    // Specifically, it
    //
    //  * prefers fewer stars to more, then
    //  * prefers using stars for less of the match to more, then
    //  * prefers fewer dynamic segments to more, then
    //  * prefers more static segments to more
    function $$route$recognizer$$sortSolutions(states) {
      return states.sort(function(a, b) {
        if (a.types.stars !== b.types.stars) { return a.types.stars - b.types.stars; }

        if (a.types.stars) {
          if (a.types.statics !== b.types.statics) { return b.types.statics - a.types.statics; }
          if (a.types.dynamics !== b.types.dynamics) { return b.types.dynamics - a.types.dynamics; }
        }

        if (a.types.dynamics !== b.types.dynamics) { return a.types.dynamics - b.types.dynamics; }
        if (a.types.statics !== b.types.statics) { return b.types.statics - a.types.statics; }

        return 0;
      });
    }

    function $$route$recognizer$$recognizeChar(states, ch) {
      var nextStates = [];

      for (var i=0, l=states.length; i<l; i++) {
        var state = states[i];

        nextStates = nextStates.concat(state.match(ch));
      }

      return nextStates;
    }

    var $$route$recognizer$$oCreate = Object.create || function(proto) {
      function F() {}
      F.prototype = proto;
      return new F();
    };

    function $$route$recognizer$$RecognizeResults(queryParams) {
      this.queryParams = queryParams || {};
    }
    $$route$recognizer$$RecognizeResults.prototype = $$route$recognizer$$oCreate({
      splice: Array.prototype.splice,
      slice:  Array.prototype.slice,
      push:   Array.prototype.push,
      length: 0,
      queryParams: null
    });

    function $$route$recognizer$$findHandler(state, path, queryParams) {
      var handlers = state.handlers, regex = state.regex;
      var captures = path.match(regex), currentCapture = 1;
      var result = new $$route$recognizer$$RecognizeResults(queryParams);

      for (var i=0, l=handlers.length; i<l; i++) {
        var handler = handlers[i], names = handler.names, params = {};

        for (var j=0, m=names.length; j<m; j++) {
          params[names[j]] = captures[currentCapture++];
        }

        result.push({ handler: handler.handler, params: params, isDynamic: !!names.length });
      }

      return result;
    }

    function $$route$recognizer$$addSegment(currentState, segment) {
      segment.eachChar(function(ch) {
        var state;

        currentState = currentState.put(ch);
      });

      return currentState;
    }

    function $$route$recognizer$$decodeQueryParamPart(part) {
      // http://www.w3.org/TR/html401/interact/forms.html#h-17.13.4.1
      part = part.replace(/\+/gm, '%20');
      return decodeURIComponent(part);
    }

    // The main interface

    var $$route$recognizer$$RouteRecognizer = function() {
      this.rootState = new $$route$recognizer$$State();
      this.names = {};
    };


    $$route$recognizer$$RouteRecognizer.prototype = {
      add: function(routes, options) {
        var currentState = this.rootState, regex = "^",
            types = { statics: 0, dynamics: 0, stars: 0 },
            handlers = [], allSegments = [], name;

        var isEmpty = true;

        for (var i=0, l=routes.length; i<l; i++) {
          var route = routes[i], names = [];

          var segments = $$route$recognizer$$parse(route.path, names, types);

          allSegments = allSegments.concat(segments);

          for (var j=0, m=segments.length; j<m; j++) {
            var segment = segments[j];

            if (segment instanceof $$route$recognizer$$EpsilonSegment) { continue; }

            isEmpty = false;

            // Add a "/" for the new segment
            currentState = currentState.put({ validChars: "/" });
            regex += "/";

            // Add a representation of the segment to the NFA and regex
            currentState = $$route$recognizer$$addSegment(currentState, segment);
            regex += segment.regex();
          }

          var handler = { handler: route.handler, names: names };
          handlers.push(handler);
        }

        if (isEmpty) {
          currentState = currentState.put({ validChars: "/" });
          regex += "/";
        }

        currentState.handlers = handlers;
        currentState.regex = new RegExp(regex + "$");
        currentState.types = types;

        if (name = options && options.as) {
          this.names[name] = {
            segments: allSegments,
            handlers: handlers
          };
        }
      },

      handlersFor: function(name) {
        var route = this.names[name], result = [];
        if (!route) { throw new Error("There is no route named " + name); }

        for (var i=0, l=route.handlers.length; i<l; i++) {
          result.push(route.handlers[i]);
        }

        return result;
      },

      hasRoute: function(name) {
        return !!this.names[name];
      },

      generate: function(name, params) {
        var route = this.names[name], output = "";
        if (!route) { throw new Error("There is no route named " + name); }

        var segments = route.segments;

        for (var i=0, l=segments.length; i<l; i++) {
          var segment = segments[i];

          if (segment instanceof $$route$recognizer$$EpsilonSegment) { continue; }

          output += "/";
          output += segment.generate(params);
        }

        if (output.charAt(0) !== '/') { output = '/' + output; }

        if (params && params.queryParams) {
          output += this.generateQueryString(params.queryParams, route.handlers);
        }

        return output;
      },

      generateQueryString: function(params, handlers) {
        var pairs = [];
        var keys = [];
        for(var key in params) {
          if (params.hasOwnProperty(key)) {
            keys.push(key);
          }
        }
        keys.sort();
        for (var i = 0, len = keys.length; i < len; i++) {
          key = keys[i];
          var value = params[key];
          if (value == null) {
            continue;
          }
          var pair = encodeURIComponent(key);
          if ($$route$recognizer$$isArray(value)) {
            for (var j = 0, l = value.length; j < l; j++) {
              var arrayPair = key + '[]' + '=' + encodeURIComponent(value[j]);
              pairs.push(arrayPair);
            }
          } else {
            pair += "=" + encodeURIComponent(value);
            pairs.push(pair);
          }
        }

        if (pairs.length === 0) { return ''; }

        return "?" + pairs.join("&");
      },

      parseQueryString: function(queryString) {
        var pairs = queryString.split("&"), queryParams = {};
        for(var i=0; i < pairs.length; i++) {
          var pair      = pairs[i].split('='),
              key       = $$route$recognizer$$decodeQueryParamPart(pair[0]),
              keyLength = key.length,
              isArray = false,
              value;
          if (pair.length === 1) {
            value = 'true';
          } else {
            //Handle arrays
            if (keyLength > 2 && key.slice(keyLength -2) === '[]') {
              isArray = true;
              key = key.slice(0, keyLength - 2);
              if(!queryParams[key]) {
                queryParams[key] = [];
              }
            }
            value = pair[1] ? $$route$recognizer$$decodeQueryParamPart(pair[1]) : '';
          }
          if (isArray) {
            queryParams[key].push(value);
          } else {
            queryParams[key] = value;
          }
        }
        return queryParams;
      },

      recognize: function(path) {
        var states = [ this.rootState ],
            pathLen, i, l, queryStart, queryParams = {},
            isSlashDropped = false;

        queryStart = path.indexOf('?');
        if (queryStart !== -1) {
          var queryString = path.substr(queryStart + 1, path.length);
          path = path.substr(0, queryStart);
          queryParams = this.parseQueryString(queryString);
        }

        path = decodeURI(path);

        // DEBUG GROUP path

        if (path.charAt(0) !== "/") { path = "/" + path; }

        pathLen = path.length;
        if (pathLen > 1 && path.charAt(pathLen - 1) === "/") {
          path = path.substr(0, pathLen - 1);
          isSlashDropped = true;
        }

        for (i=0, l=path.length; i<l; i++) {
          states = $$route$recognizer$$recognizeChar(states, path.charAt(i));
          if (!states.length) { break; }
        }

        // END DEBUG GROUP

        var solutions = [];
        for (i=0, l=states.length; i<l; i++) {
          if (states[i].handlers) { solutions.push(states[i]); }
        }

        states = $$route$recognizer$$sortSolutions(solutions);

        var state = solutions[0];

        if (state && state.handlers) {
          // if a trailing slash was dropped and a star segment is the last segment
          // specified, put the trailing slash back
          if (isSlashDropped && state.regex.source.slice(-5) === "(.+)$") {
            path = path + "/";
          }
          return $$route$recognizer$$findHandler(state, path, queryParams);
        }
      }
    };

    $$route$recognizer$$RouteRecognizer.prototype.map = $$route$recognizer$dsl$$default;

    $$route$recognizer$$RouteRecognizer.VERSION = '0.1.5';

    var $$route$recognizer$$default = $$route$recognizer$$RouteRecognizer;

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return $$route$recognizer$$default; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = $$route$recognizer$$default;
    } else if (typeof this !== 'undefined') {
      this['RouteRecognizer'] = $$route$recognizer$$default;
    }
}).call(this);

//# sourceMappingURL=route-recognizer.js.map
(function(undefined){
/**
 * Minimal Event interface implementation
 *
 * Original implementation by Sven Fuchs: https://gist.github.com/995028
 * Modifications and tests by Christian Johansen.
 *
 * @author Sven Fuchs (svenfuchs@artweb-design.de)
 * @author Christian Johansen (christian@cjohansen.no)
 * @license BSD
 *
 * Copyright (c) 2011 Sven Fuchs, Christian Johansen
 */

var _Event = function Event(type, bubbles, cancelable, target) {
  this.type = type;
  this.bubbles = bubbles;
  this.cancelable = cancelable;
  this.target = target;
};

_Event.prototype = {
  stopPropagation: function () {},
  preventDefault: function () {
    this.defaultPrevented = true;
  }
};

/*
  Used to set the statusText property of an xhr object
*/
var httpStatusCodes = {
  100: "Continue",
  101: "Switching Protocols",
  200: "OK",
  201: "Created",
  202: "Accepted",
  203: "Non-Authoritative Information",
  204: "No Content",
  205: "Reset Content",
  206: "Partial Content",
  300: "Multiple Choice",
  301: "Moved Permanently",
  302: "Found",
  303: "See Other",
  304: "Not Modified",
  305: "Use Proxy",
  307: "Temporary Redirect",
  400: "Bad Request",
  401: "Unauthorized",
  402: "Payment Required",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  406: "Not Acceptable",
  407: "Proxy Authentication Required",
  408: "Request Timeout",
  409: "Conflict",
  410: "Gone",
  411: "Length Required",
  412: "Precondition Failed",
  413: "Request Entity Too Large",
  414: "Request-URI Too Long",
  415: "Unsupported Media Type",
  416: "Requested Range Not Satisfiable",
  417: "Expectation Failed",
  422: "Unprocessable Entity",
  500: "Internal Server Error",
  501: "Not Implemented",
  502: "Bad Gateway",
  503: "Service Unavailable",
  504: "Gateway Timeout",
  505: "HTTP Version Not Supported"
};


/*
  Cross-browser XML parsing. Used to turn
  XML responses into Document objects
  Borrowed from JSpec
*/
function parseXML(text) {
  var xmlDoc;

  if (typeof DOMParser != "undefined") {
    var parser = new DOMParser();
    xmlDoc = parser.parseFromString(text, "text/xml");
  } else {
    xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
    xmlDoc.async = "false";
    xmlDoc.loadXML(text);
  }

  return xmlDoc;
}

/*
  Without mocking, the native XMLHttpRequest object will throw
  an error when attempting to set these headers. We match this behavior.
*/
var unsafeHeaders = {
  "Accept-Charset": true,
  "Accept-Encoding": true,
  "Connection": true,
  "Content-Length": true,
  "Cookie": true,
  "Cookie2": true,
  "Content-Transfer-Encoding": true,
  "Date": true,
  "Expect": true,
  "Host": true,
  "Keep-Alive": true,
  "Referer": true,
  "TE": true,
  "Trailer": true,
  "Transfer-Encoding": true,
  "Upgrade": true,
  "User-Agent": true,
  "Via": true
};

/*
  Adds an "event" onto the fake xhr object
  that just calls the same-named method. This is
  in case a library adds callbacks for these events.
*/
function _addEventListener(eventName, xhr){
  xhr.addEventListener(eventName, function (event) {
    var listener = xhr["on" + eventName];

    if (listener && typeof listener == "function") {
      listener(event);
    }
  });
}

/*
  Constructor for a fake window.XMLHttpRequest
*/
function FakeXMLHttpRequest() {
  this.readyState = FakeXMLHttpRequest.UNSENT;
  this.requestHeaders = {};
  this.requestBody = null;
  this.status = 0;
  this.statusText = "";

  this._eventListeners = {};
  var events = ["loadstart", "load", "abort", "loadend"];
  for (var i = events.length - 1; i >= 0; i--) {
    _addEventListener(events[i], this);
  }
}


// These status codes are available on the native XMLHttpRequest
// object, so we match that here in case a library is relying on them.
FakeXMLHttpRequest.UNSENT = 0;
FakeXMLHttpRequest.OPENED = 1;
FakeXMLHttpRequest.HEADERS_RECEIVED = 2;
FakeXMLHttpRequest.LOADING = 3;
FakeXMLHttpRequest.DONE = 4;

FakeXMLHttpRequest.prototype = {
  UNSENT: 0,
  OPENED: 1,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  DONE: 4,
  async: true,

  /*
    Duplicates the behavior of native XMLHttpRequest's open function
  */
  open: function open(method, url, async, username, password) {
    this.method = method;
    this.url = url;
    this.async = typeof async == "boolean" ? async : true;
    this.username = username;
    this.password = password;
    this.responseText = null;
    this.responseXML = null;
    this.requestHeaders = {};
    this.sendFlag = false;
    this._readyStateChange(FakeXMLHttpRequest.OPENED);
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's addEventListener function
  */
  addEventListener: function addEventListener(event, listener) {
    this._eventListeners[event] = this._eventListeners[event] || [];
    this._eventListeners[event].push(listener);
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's removeEventListener function
  */
  removeEventListener: function removeEventListener(event, listener) {
    var listeners = this._eventListeners[event] || [];

    for (var i = 0, l = listeners.length; i < l; ++i) {
      if (listeners[i] == listener) {
        return listeners.splice(i, 1);
      }
    }
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's dispatchEvent function
  */
  dispatchEvent: function dispatchEvent(event) {
    var type = event.type;
    var listeners = this._eventListeners[type] || [];

    for (var i = 0; i < listeners.length; i++) {
      if (typeof listeners[i] == "function") {
        listeners[i].call(this, event);
      } else {
        listeners[i].handleEvent(event);
      }
    }

    return !!event.defaultPrevented;
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's setRequestHeader function
  */
  setRequestHeader: function setRequestHeader(header, value) {
    verifyState(this);

    if (unsafeHeaders[header] || /^(Sec-|Proxy-)/.test(header)) {
      throw new Error("Refused to set unsafe header \"" + header + "\"");
    }

    if (this.requestHeaders[header]) {
      this.requestHeaders[header] += "," + value;
    } else {
      this.requestHeaders[header] = value;
    }
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's send function
  */
  send: function send(data) {
    verifyState(this);

    if (!/^(get|head)$/i.test(this.method)) {
      if (this.requestHeaders["Content-Type"]) {
        var value = this.requestHeaders["Content-Type"].split(";");
        this.requestHeaders["Content-Type"] = value[0] + ";charset=utf-8";
      } else {
        this.requestHeaders["Content-Type"] = "text/plain;charset=utf-8";
      }

      this.requestBody = data;
    }

    this.errorFlag = false;
    this.sendFlag = this.async;
    this._readyStateChange(FakeXMLHttpRequest.OPENED);

    if (typeof this.onSend == "function") {
      this.onSend(this);
    }

    this.dispatchEvent(new _Event("loadstart", false, false, this));
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's abort function
  */
  abort: function abort() {
    this.aborted = true;
    this.responseText = null;
    this.errorFlag = true;
    this.requestHeaders = {};

    if (this.readyState > FakeXMLHttpRequest.UNSENT && this.sendFlag) {
      this._readyStateChange(FakeXMLHttpRequest.DONE);
      this.sendFlag = false;
    }

    this.readyState = FakeXMLHttpRequest.UNSENT;

    this.dispatchEvent(new _Event("abort", false, false, this));
    if (typeof this.onerror === "function") {
        this.onerror();
    }
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's getResponseHeader function
  */
  getResponseHeader: function getResponseHeader(header) {
    if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
      return null;
    }

    if (/^Set-Cookie2?$/i.test(header)) {
      return null;
    }

    header = header.toLowerCase();

    for (var h in this.responseHeaders) {
      if (h.toLowerCase() == header) {
        return this.responseHeaders[h];
      }
    }

    return null;
  },

  /*
    Duplicates the behavior of native XMLHttpRequest's getAllResponseHeaders function
  */
  getAllResponseHeaders: function getAllResponseHeaders() {
    if (this.readyState < FakeXMLHttpRequest.HEADERS_RECEIVED) {
      return "";
    }

    var headers = "";

    for (var header in this.responseHeaders) {
      if (this.responseHeaders.hasOwnProperty(header) && !/^Set-Cookie2?$/i.test(header)) {
        headers += header + ": " + this.responseHeaders[header] + "\r\n";
      }
    }

    return headers;
  },

  /*
    Places a FakeXMLHttpRequest object into the passed
    state.
  */
  _readyStateChange: function _readyStateChange(state) {
    this.readyState = state;

    if (typeof this.onreadystatechange == "function") {
      this.onreadystatechange();
    }

    this.dispatchEvent(new _Event("readystatechange"));

    if (this.readyState == FakeXMLHttpRequest.DONE) {
      this.dispatchEvent(new _Event("load", false, false, this));
      this.dispatchEvent(new _Event("loadend", false, false, this));
    }
  },


  /*
    Sets the FakeXMLHttpRequest object's response headers and
    places the object into readyState 2
  */
  _setResponseHeaders: function _setResponseHeaders(headers) {
    this.responseHeaders = {};

    for (var header in headers) {
      if (headers.hasOwnProperty(header)) {
          this.responseHeaders[header] = headers[header];
      }
    }

    if (this.async) {
      this._readyStateChange(FakeXMLHttpRequest.HEADERS_RECEIVED);
    } else {
      this.readyState = FakeXMLHttpRequest.HEADERS_RECEIVED;
    }
  },



  /*
    Sets the FakeXMLHttpRequest object's response body and
    if body text is XML, sets responseXML to parsed document
    object
  */
  _setResponseBody: function _setResponseBody(body) {
    verifyRequestSent(this);
    verifyHeadersReceived(this);
    verifyResponseBodyType(body);

    var chunkSize = this.chunkSize || 10;
    var index = 0;
    this.responseText = "";

    do {
      if (this.async) {
        this._readyStateChange(FakeXMLHttpRequest.LOADING);
      }

      this.responseText += body.substring(index, index + chunkSize);
      index += chunkSize;
    } while (index < body.length);

    var type = this.getResponseHeader("Content-Type");

    if (this.responseText && (!type || /(text\/xml)|(application\/xml)|(\+xml)/.test(type))) {
      try {
        this.responseXML = parseXML(this.responseText);
      } catch (e) {
        // Unable to parse XML - no biggie
      }
    }

    if (this.async) {
      this._readyStateChange(FakeXMLHttpRequest.DONE);
    } else {
      this.readyState = FakeXMLHttpRequest.DONE;
    }
  },

  /*
    Forces a response on to the FakeXMLHttpRequest object.

    This is the public API for faking responses. This function
    takes a number status, headers object, and string body:

    ```
    xhr.respond(404, {Content-Type: 'text/plain'}, "Sorry. This object was not found.")

    ```
  */
  respond: function respond(status, headers, body) {
    this._setResponseHeaders(headers || {});
    this.status = typeof status == "number" ? status : 200;
    this.statusText = httpStatusCodes[this.status];
    this._setResponseBody(body || "");
    if (typeof this.onload === "function"){
      this.onload();
    }
  }
};

function verifyState(xhr) {
  if (xhr.readyState !== FakeXMLHttpRequest.OPENED) {
    throw new Error("INVALID_STATE_ERR");
  }

  if (xhr.sendFlag) {
    throw new Error("INVALID_STATE_ERR");
  }
}


function verifyRequestSent(xhr) {
    if (xhr.readyState == FakeXMLHttpRequest.DONE) {
        throw new Error("Request done");
    }
}

function verifyHeadersReceived(xhr) {
    if (xhr.async && xhr.readyState != FakeXMLHttpRequest.HEADERS_RECEIVED) {
        throw new Error("No headers received");
    }
}

function verifyResponseBodyType(body) {
    if (typeof body != "string") {
        var error = new Error("Attempted to respond to fake XMLHttpRequest with " +
                             body + ", which is not a string.");
        error.name = "InvalidBodyException";
        throw error;
    }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = FakeXMLHttpRequest;
} else if (typeof define === 'function' && define.amd) {
  define(function() { return FakeXMLHttpRequest; });
} else if (typeof window !== 'undefined') {
  window.FakeXMLHttpRequest = FakeXMLHttpRequest;
} else if (this) {
  this.FakeXMLHttpRequest = FakeXMLHttpRequest;
}
})();

(function(window){

var isNode = typeof process !== 'undefined' && process.toString() === '[object process]';
var RouteRecognizer = isNode ? require('route-recognizer')['default'] : window.RouteRecognizer;
var FakeXMLHttpRequest = isNode ? require('./bower_components/FakeXMLHttpRequest/fake_xml_http_request') : window.FakeXMLHttpRequest;
var slice = [].slice;

function Pretender(/* routeMap1, routeMap2, ...*/){
  maps = slice.call(arguments);
  // Herein we keep track of RouteRecognizer instances
  // keyed by HTTP method. Feel free to add more as needed.
  this.registry = {
    GET: new RouteRecognizer(),
    PUT: new RouteRecognizer(),
    POST: new RouteRecognizer(),
    DELETE: new RouteRecognizer(),
    PATCH: new RouteRecognizer(),
    HEAD: new RouteRecognizer()
  };

  this.handlers = [];
  this.handledRequests = [];
  this.passthroughRequests = [];
  this.unhandledRequests = [];
  this.requestReferences = [];

  // reference the native XMLHttpRequest object so
  // it can be restored later
  this._nativeXMLHttpRequest = window.XMLHttpRequest;

  // capture xhr requests, channeling them into
  // the route map.
  window.XMLHttpRequest = interceptor(this);

  // "start" the server
  this.running = true;

  // trigger the route map DSL.
  for(i=0; i < arguments.length; i++){
    this.map(arguments[i]);
  }
}

function interceptor(pretender) {
  function FakeRequest(){
    // super()
    FakeXMLHttpRequest.call(this);
  }
  // extend
  var proto = new FakeXMLHttpRequest();
  proto.send = function send(){
    if (!pretender.running) {
      throw new Error('You shut down a Pretender instance while there was a pending request. '+
            'That request just tried to complete. Check to see if you accidentally shut down '+
            'a pretender earlier than you intended to');
    }

    FakeXMLHttpRequest.prototype.send.apply(this, arguments);
    if (!pretender.checkPassthrough(this)) {
      pretender.handleRequest(this);
    }
    else {
      var xhr = createPassthrough(this);
      xhr.send.apply(xhr, arguments);
    }
  };

  // passthrough handling
  var evts = ['load', 'error', 'timeout', 'progress', 'abort', 'readystatechange'];
  var lifecycleProps = ['readyState', 'responseText', 'responseXML', 'status', 'statusText'];
  function createPassthrough(fakeXHR) {
    var xhr = fakeXHR._passthroughRequest = new pretender._nativeXMLHttpRequest();
    // listen to all events to update lifecycle properties
    for (var i = 0; i < evts.length; i++) (function(evt) {
      xhr['on' + evt] = function(e) {
        // update lifecycle props on each event
        for (var i = 0; i < lifecycleProps.length; i++) {
          var prop = lifecycleProps[i];
          if (xhr[prop]) {
            fakeXHR[prop] = xhr[prop];
          }
        }
        // fire fake events where applicable
        fakeXHR.dispatchEvent(evt, e);
        if (fakeXHR['on' + evt]) {
          fakeXHR['on' + evt](e);
        }
      };
    })(evts[i]);
    xhr.open(fakeXHR.method, fakeXHR.url, fakeXHR.async, fakeXHR.username, fakeXHR.password);
    xhr.timeout = fakeXHR.timeout;
    xhr.withCredentials = fakeXHR.withCredentials;
    for (var h in fakeXHR.requestHeaders) {
      xhr.setRequestHeader(h, fakeXHR.requestHeaders[h]);
    }
    return xhr;
  }
  proto._passthroughCheck = function(method, arguments) {
    if (this._passthroughRequest) {
      return this._passthroughRequest[method].apply(this._passthroughRequest, arguments);
    }
    return FakeXMLHttpRequest.prototype[method].apply(this, arguments);
  }
  proto.abort = function abort(){
    return this._passthroughCheck('abort', arguments);
  }
  proto.getResponseHeader = function getResponseHeader(){
    return this._passthroughCheck('getResponseHeader', arguments);
  }
  proto.getAllResponseHeaders = function getAllResponseHeaders(){
    return this._passthroughCheck('getAllResponseHeaders', arguments);
  }

  FakeRequest.prototype = proto;
  return FakeRequest;
}

function verbify(verb){
  return function(path, handler, async){
    this.register(verb, path, handler, async);
  };
}

function throwIfURLDetected(url){
  var HTTP_REGEXP = /^https?/;
  var message;

  if(HTTP_REGEXP.test(url)) {
    var parser = window.document.createElement('a');
    parser.href = url;

    message = "Pretender will not respond to requests for URLs. It is not possible to accurately simluate the browser's CSP. "+
              "Remove the " + parser.protocol +"//"+ parser.hostname +" from " + url + " and try again";
    throw new Error(message)
  }
}

var PASSTHROUGH = {};

Pretender.prototype = {
  get: verbify('GET'),
  post: verbify('POST'),
  put: verbify('PUT'),
  'delete': verbify('DELETE'),
  patch: verbify('PATCH'),
  head: verbify('HEAD'),
  map: function(maps){
    maps.call(this);
  },
  register: function register(verb, path, handler, async){
    if (!handler) {
      throw new Error("The function you tried passing to Pretender to handle " + verb + " " + path + " is undefined or missing.");
    }

    handler.numberOfCalls = 0;
    handler.async = async;
    this.handlers.push(handler);

    var registry = this.registry[verb];
    registry.add([{path: path, handler: handler}]);
  },
  passthrough: PASSTHROUGH,
  checkPassthrough: function(request) {
    var verb = request.method.toUpperCase();
    var path = request.url;

    throwIfURLDetected(path);

    verb = verb.toUpperCase();

    var recognized = this.registry[verb].recognize(path);
    var match = recognized && recognized[0];
    if (match && match.handler == PASSTHROUGH) {
      this.passthroughRequests.push(request);
      this.passthroughRequest(verb, path, request);
      return true;
    }

    return false;
  },
  handleRequest: function handleRequest(request){
    var verb = request.method.toUpperCase();
    var path = request.url;

    var handler = this._handlerFor(verb, path, request);

    if (handler) {
      handler.handler.numberOfCalls++;
      var async = handler.handler.async;
      this.handledRequests.push(request);

      try {
        var statusHeadersAndBody = handler.handler(request),
            status = statusHeadersAndBody[0],
            headers = this.prepareHeaders(statusHeadersAndBody[1]),
            body = this.prepareBody(statusHeadersAndBody[2]),
            pretender = this;

        this.handleResponse(request, async, function() {
          request.respond(status, headers, body);
          pretender.handledRequest(verb, path, request);
        });
      } catch (error) {
        this.erroredRequest(verb, path, request, error);
        this.resolve(request);
      }
    } else {
      this.unhandledRequests.push(request);
      this.unhandledRequest(verb, path, request);
    }
  },
  handleResponse: function handleResponse(request, strategy, callback) {
    strategy = typeof strategy === 'function' ? strategy() : strategy;

    if (strategy === false) {
      callback();
    } else {
      var pretender = this;
      pretender.requestReferences.push({
        request: request,
        callback: callback
      });

      if (strategy !== true) {
        setTimeout(function() {
          pretender.resolve(request);
        }, typeof strategy === 'number' ? strategy : 0);
      }
    }
  },
  resolve: function resolve(request) {
    for(var i = 0, len = this.requestReferences.length; i < len; i++) {
      var res = this.requestReferences[i];
      if (res.request === request) {
        res.callback();
        this.requestReferences.splice(i, 1);
        break;
      }
    }
  },
  requiresManualResolution: function(verb, path) {
    var handler = this._handlerFor(verb.toUpperCase(), path, {});
    if (!handler) { return false; }

    var async = handler.handler.async;
    return typeof async === 'function' ? async() === true : async === true;
  },
  prepareBody: function(body) { return body; },
  prepareHeaders: function(headers) { return headers; },
  handledRequest: function(verb, path, request) { /* no-op */},
  passthroughRequest: function(verb, path, request) { /* no-op */},
  unhandledRequest: function(verb, path, request) {
    throw new Error("Pretender intercepted "+verb+" "+path+" but no handler was defined for this type of request");
  },
  erroredRequest: function(verb, path, request, error){
    error.message = "Pretender intercepted "+verb+" "+path+" but encountered an error: " + error.message;
    throw error;
  },
  _handlerFor: function(verb, path, request){
    var registry = this.registry[verb];
    var matches = registry.recognize(path);

    var match = matches ? matches[0] : null;
    if (match) {
      request.params = match.params;
      request.queryParams = matches.queryParams;
    }

    return match;
  },
  shutdown: function shutdown(){
    window.XMLHttpRequest = this._nativeXMLHttpRequest;

    // "stop" the server
    this.running = false;
  }
};

if (isNode) {
  module.exports = Pretender;
} else {
  window.Pretender = Pretender;
}

})(window);

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
    throw new Error('The type ' + upperType + ' is invalid ' + validName.test(upperType) + ' ' + indexOf.call(invalidNames, upperType));
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
//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(root, factory) {

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    factory(root, exports, _);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var slice = array.slice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.1.2';

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
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;

      // Remove all callbacks for all events.
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }

      var names = name ? [name] : _.keys(this._events);
      for (var i = 0, length = names.length; i < length; i++) {
        name = names[i];

        // Bail out if there are no events stored.
        var events = this._events[name];
        if (!events) continue;

        // Remove all callbacks for this event.
        if (!callback && !context) {
          delete this._events[name];
          continue;
        }

        // Find any remaining events.
        var remaining = [];
        for (var j = 0, k = events.length; j < k; j++) {
          var event = events[j];
          if (
            callback && callback !== event.callback &&
            callback !== event.callback._callback ||
            context && context !== event.context
          ) {
            remaining.push(event);
          }
        }

        // Replace events if there are any remaining.  Otherwise, clean up.
        if (remaining.length) {
          this._events[name] = remaining;
        } else {
          delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, length = names.length; i < length; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
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

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

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
    this.cid = _.uniqueId('c');
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

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
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
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0, length = changes.length; i < length; i++) {
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
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
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

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true}, options);

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch' && !options.attrs) options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.stopListening();
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
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
      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
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
      return this._validate({}, _.extend(options || {}, { validate: true }));
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

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit', 'chain', 'isEmpty'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    if (!_[method]) return;
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

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
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      options || (options = {});
      for (var i = 0, length = models.length; i < length; i++) {
        var model = models[i] = this.get(models[i]);
        if (!model) continue;
        var id = this.modelId(model.attributes);
        if (id != null) delete this._byId[id];
        delete this._byId[model.cid];
        var index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model, options);
      }
      return singular ? models[0] : models;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : models.slice();
      var id, model, attrs, existing, sort;
      var at = options.at;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (var i = 0, length = models.length; i < length; i++) {
        attrs = models[i];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(attrs)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge && attrs !== existing) {
            attrs = this._isModel(attrs) ? attrs.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          this._addReference(model, options);
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (!model) continue;
        id = this.modelId(model.attributes);
        if (order && (model.isNew() || !modelMap[id])) order.push(model);
        modelMap[id] = true;
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (var i = 0, length = this.length; i < length; i++) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || (order && order.length)) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (var i = 0, length = toAdd.length; i < length; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (var i = 0, length = orderedModels.length; i < length; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        var addOpts = at != null ? _.clone(options) : options;
        for (var i = 0, length = toAdd.length; i < length; i++) {
          if (at != null) addOpts.index = at + i;
          (model = toAdd[i]).trigger('add', model, this, addOpts);
        }
        if (sort || (order && order.length)) this.trigger('sort', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, length = this.models.length; i < length; i++) {
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
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
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
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
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
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
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
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
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
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
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
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample', 'partition'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    if (!_[method]) return;
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    if (!_[method]) return;
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

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
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
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
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
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
      if (error) error.apply(this, arguments);
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
    _.bindAll(this, 'checkUrl');

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
      var path = decodeURI(this.location.pathname + this.getSearch());
      var root = this.root.slice(0, -1);
      if (!path.indexOf(root)) path = path.slice(root.length);
      return path.slice(1);
    },

    // Get the cross-browser normalized URL fragment from the path or hash.
    getFragment: function(fragment) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange) {
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
      this._hasHashChange   = 'onhashchange' in window;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      this.fragment         = this.getFragment();

      // Add a cross-platform `addEventListener` shim for older browsers.
      var addEventListener = window.addEventListener || function (eventName, listener) {
        return attachEvent('on' + eventName, listener);
      };

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      // Proxy an iframe to handle location events if the browser doesn't
      // support the `hashchange` event, HTML5 history, or the user wants
      // `hashChange` but not `pushState`.
      if (!this._hasHashChange && this._wantsHashChange && (!this._wantsPushState || !this._hasPushState)) {
        var iframe = document.createElement('iframe');
        iframe.src = 'javascript:0';
        iframe.style.display = 'none';
        iframe.tabIndex = -1;
        var body = document.body;
        // Using `appendChild` will throw on IE < 9 if the document is not ready.
        this.iframe = body.insertBefore(iframe, body.firstChild).contentWindow;
        this.navigate(this.fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        addEventListener('popstate', this.checkUrl, false);
      } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {
        addEventListener('hashchange', this.checkUrl, false);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          this.location.replace(this.root + '#' + this.getPath());
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot()) {
          this.navigate(this.getHash(), {replace: true});
        }

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
      if (this._hasPushState) {
        removeEventListener('popstate', this.checkUrl, false);
      } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {
        removeEventListener('hashchange', this.checkUrl, false);
      }

      // Clean up the iframe if necessary.
      if (this.iframe) {
        document.body.removeChild(this.iframe.frameElement);
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
      if (current === this.fragment && this.iframe) {
        current = this.getHash(this.iframe);
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
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

      var url = this.root + (fragment = this.getFragment(fragment || ''));

      // Strip the hash and decode for matching.
      fragment = decodeURI(fragment.replace(pathStripper, ''));

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // Don't include a trailing slash on the root.
      if (fragment === '' && url !== '/') url = url.slice(0, -1);

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getHash(this.iframe))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
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

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
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
      if (error) error(model, resp, options);
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

(function (root, factory) {
    //if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module
        //in another project. That other project will only
        //see this AMD call, not the internal modules in
        //the closure below.
        define('Rebound', factory);
    //} else {
        //Browser globals case. Just assign the
        //result to a property on the global.
        root.Rebound = factory();
    //}
}(this, function () {

    //almond, and your modules will be inlined here

/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
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

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
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
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define('htmlbars-util', ['exports', './htmlbars-util/safe-string', './htmlbars-util/handlebars/utils', './htmlbars-util/namespaces', './htmlbars-util/morph-utils'], function (exports, SafeString, utils, namespaces, morph_utils) {

	'use strict';



	exports.SafeString = SafeString['default'];
	exports.escapeExpression = utils.escapeExpression;
	exports.getAttrNamespace = namespaces.getAttrNamespace;
	exports.validateChildMorphs = morph_utils.validateChildMorphs;
	exports.linkParams = morph_utils.linkParams;
	exports.dump = morph_utils.dump;

});
define('htmlbars-util/array-utils', ['exports'], function (exports) {

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

});
define('htmlbars-util/handlebars/safe-string', ['exports'], function (exports) {

  'use strict';

  // Build out our basic SafeString type
  function SafeString(string) {
    this.string = string;
  }

  SafeString.prototype.toString = SafeString.prototype.toHTML = function () {
    return '' + this.string;
  };

  exports['default'] = SafeString;

});
define('htmlbars-util/handlebars/utils', ['exports'], function (exports) {

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

});
define('htmlbars-util/morph-utils', ['exports'], function (exports) {

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

});
define('htmlbars-util/namespaces', ['exports'], function (exports) {

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

});
define('htmlbars-util/object-utils', ['exports'], function (exports) {

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

});
define('htmlbars-util/quoting', ['exports'], function (exports) {

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

});
define('htmlbars-util/safe-string', ['exports', './handlebars/safe-string'], function (exports, SafeString) {

	'use strict';

	exports['default'] = SafeString['default'];

});
define('htmlbars-util/template-utils', ['exports', '../htmlbars-util/morph-utils'], function (exports, morph_utils) {

  'use strict';

  exports.RenderState = RenderState;
  exports.blockFor = blockFor;
  exports.renderAndCleanup = renderAndCleanup;
  exports.clearMorph = clearMorph;
  exports.clearMorphList = clearMorphList;

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

});
define('htmlbars-util/void-tag-names', ['exports', './array-utils'], function (exports, array_utils) {

  'use strict';

  var voidTagNames = "area base br col command embed hr img input keygen link meta param source track wbr";
  var voidMap = {};

  array_utils.forEach(voidTagNames.split(" "), function (tagName) {
    voidMap[tagName] = true;
  });

  exports['default'] = voidMap;

});
define('dom-helper', ['exports', './htmlbars-runtime/morph', './morph-attr', './dom-helper/build-html-dom', './dom-helper/classes', './dom-helper/prop'], function (exports, Morph, AttrMorph, build_html_dom, classes, prop) {

  'use strict';

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

});
define('dom-helper/build-html-dom', ['exports'], function (exports) {

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

});
define('dom-helper/classes', ['exports'], function (exports) {

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

});
define('dom-helper/prop', ['exports'], function (exports) {

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

});
define('htmlbars-runtime', ['exports', './htmlbars-runtime/hooks', './htmlbars-runtime/render', '../htmlbars-util/morph-utils', '../htmlbars-util/template-utils', './htmlbars-runtime/expression-visitor', 'htmlbars-runtime/hooks'], function (exports, hooks, render, morph_utils, template_utils, expression_visitor, htmlbars_runtime__hooks) {

  'use strict';

  var internal = {
    blockFor: template_utils.blockFor,
    manualElement: render.manualElement,
    hostBlock: htmlbars_runtime__hooks.hostBlock,
    continueBlock: htmlbars_runtime__hooks.continueBlock,
    hostYieldWithShadowTemplate: htmlbars_runtime__hooks.hostYieldWithShadowTemplate,
    visitChildren: morph_utils.visitChildren,
    validateChildMorphs: expression_visitor.validateChildMorphs,
    clearMorph: template_utils.clearMorph
  };

  exports.hooks = hooks['default'];
  exports.render = render['default'];
  exports.internal = internal;

});
define('htmlbars-runtime/expression-visitor', ['exports', '../htmlbars-util/object-utils', '../htmlbars-util/morph-utils'], function (exports, object_utils, morph_utils) {

  'use strict';

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

});
define('htmlbars-runtime/hooks', ['exports', './render', '../morph-range/morph-list', '../htmlbars-util/object-utils', '../htmlbars-util/morph-utils', '../htmlbars-util/template-utils'], function (exports, render, MorphList, object_utils, morph_utils, template_utils) {

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
    console.log(!lastYielded.shadowTemplate && template === lastYielded.template);

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

});
define('htmlbars-runtime/morph', ['exports', '../morph-range', '../htmlbars-util/object-utils'], function (exports, MorphBase, object_utils) {

  'use strict';

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

});
define('htmlbars-runtime/render', ['exports', '../htmlbars-util/array-utils', '../htmlbars-util/morph-utils', './expression-visitor', './morph', '../htmlbars-util/template-utils', '../htmlbars-util/void-tag-names'], function (exports, array_utils, morph_utils, ExpressionVisitor, Morph, template_utils, voidMap) {

  'use strict';

  exports.manualElement = manualElement;
  exports.attachAttributes = attachAttributes;
  exports.createChildMorph = createChildMorph;
  exports.getCachedFragment = getCachedFragment;

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

});
define('htmlbars-util', ['exports', './htmlbars-util/safe-string', './htmlbars-util/handlebars/utils', './htmlbars-util/namespaces', './htmlbars-util/morph-utils'], function (exports, SafeString, utils, namespaces, morph_utils) {

	'use strict';



	exports.SafeString = SafeString['default'];
	exports.escapeExpression = utils.escapeExpression;
	exports.getAttrNamespace = namespaces.getAttrNamespace;
	exports.validateChildMorphs = morph_utils.validateChildMorphs;
	exports.linkParams = morph_utils.linkParams;
	exports.dump = morph_utils.dump;

});
define('htmlbars-util/array-utils', ['exports'], function (exports) {

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

});
define('htmlbars-util/morph-utils', ['exports'], function (exports) {

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

});
define('htmlbars-util/namespaces', ['exports'], function (exports) {

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

});
define('htmlbars-util/object-utils', ['exports'], function (exports) {

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

});
define('htmlbars-util/quoting', ['exports'], function (exports) {

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

});
define('htmlbars-util/safe-string', ['exports', './handlebars/safe-string'], function (exports, SafeString) {

	'use strict';

	exports['default'] = SafeString['default'];

});
define('htmlbars-util/template-utils', ['exports', '../htmlbars-util/morph-utils'], function (exports, morph_utils) {

  'use strict';

  exports.RenderState = RenderState;
  exports.blockFor = blockFor;
  exports.renderAndCleanup = renderAndCleanup;
  exports.clearMorph = clearMorph;
  exports.clearMorphList = clearMorphList;

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

});
define('htmlbars-util/void-tag-names', ['exports', './array-utils'], function (exports, array_utils) {

  'use strict';

  var voidTagNames = "area base br col command embed hr img input keygen link meta param source track wbr";
  var voidMap = {};

  array_utils.forEach(voidTagNames.split(" "), function (tagName) {
    voidMap[tagName] = true;
  });

  exports['default'] = voidMap;

});
define('morph-attr', ['exports', './morph-attr/sanitize-attribute-value', './dom-helper/prop', './dom-helper/build-html-dom', './htmlbars-util'], function (exports, sanitize_attribute_value, prop, build_html_dom, htmlbars_util) {

  'use strict';

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

});
define('morph-attr/sanitize-attribute-value', ['exports'], function (exports) {

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

});
define('morph-range', ['exports', './morph-range/utils'], function (exports, utils) {

  'use strict';

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

});
define('morph-range.umd', ['./morph-range'], function (Morph) {

  'use strict';

  (function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      define([], factory);
    } else if (typeof exports === 'object') {
      module.exports = factory();
    } else {
      root.Morph = factory();
    }
  })(undefined, function () {
    return Morph['default'];
  });

});
define('morph-range/morph-list', ['exports', './utils'], function (exports, utils) {

  'use strict';

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

});
define('morph-range/morph-list.umd', ['./morph-list'], function (MorphList) {

  'use strict';

  (function (root, factory) {
    if (typeof define === 'function' && define.amd) {
      define([], factory);
    } else if (typeof exports === 'object') {
      module.exports = factory();
    } else {
      root.MorphList = factory();
    }
  })(undefined, function () {
    return MorphList['default'];
  });

});
define('morph-range/utils', ['exports'], function (exports) {

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

});
define('property-compiler/property-compiler', ['exports', 'module', 'property-compiler/tokenizer'], function (exports, module, _propertyCompilerTokenizer) {
  // Property Compiler
  // ----------------

  'use strict';

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

  var _tokenizer = _interopRequireDefault(_propertyCompilerTokenizer);

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
    nextToken = _tokenizer['default'].tokenize(str),
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
        workingpath.push(path.value.replace(/\[.+\]/g, '.@each').replace(/^\./, ''));
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

    console.log('COMPUTED PROPERTY', name, 'registered with these dependancy paths:', finishedPaths);

    // Save our finished paths directly on the function
    prop.__params = finishedPaths;

    // Return the dependancies list
    return finishedPaths;
  }

  module.exports = { compile: compile };
});
define("rebound-compiler/compile", ["exports", "module", "rebound-compiler/parser", "htmlbars-compiler/compiler", "htmlbars-util/object-utils", "dom-helper", "rebound-component/helpers", "rebound-component/hooks", "rebound-component/component"], function (exports, module, _reboundCompilerParser, _htmlbarsCompilerCompiler, _htmlbarsUtilObjectUtils, _domHelper, _reboundComponentHelpers, _reboundComponentHooks, _reboundComponentComponent) {
  // Rebound Compiler
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _parse = _interopRequireDefault(_reboundCompilerParser);

  var _DOMHelper = _interopRequireDefault(_domHelper);

  var _helpers = _interopRequireDefault(_reboundComponentHelpers);

  var _hooks = _interopRequireDefault(_reboundComponentHooks);

  var _Component = _interopRequireDefault(_reboundComponentComponent);

  function compile(str) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    /* jshint evil: true */
    // Parse the template and compile our template function
    var defs = (0, _parse["default"])(str, options),
        template = (0, _htmlbarsCompilerCompiler.compile)(defs.template);

    if (defs.isPartial) {
      return _helpers["default"].registerPartial(options.name, template);
    } else {
      return _Component["default"].registerComponent(defs.name, {
        prototype: new Function("return " + defs.script)(),
        template: template,
        style: defs.style
      });
    }
  }

  module.exports = { compile: compile };
});
define("rebound-compiler/compile", ["exports", "module", "rebound-compiler/parser", "htmlbars-compiler/compiler", "htmlbars-util/object-utils", "dom-helper", "rebound-component/helpers", "rebound-component/hooks", "rebound-component/component"], function (exports, module, _reboundCompilerParser, _htmlbarsCompilerCompiler, _htmlbarsUtilObjectUtils, _domHelper, _reboundComponentHelpers, _reboundComponentHooks, _reboundComponentComponent) {
  // Rebound Compiler
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _parse = _interopRequireDefault(_reboundCompilerParser);

  var _DOMHelper = _interopRequireDefault(_domHelper);

  var _helpers = _interopRequireDefault(_reboundComponentHelpers);

  var _hooks = _interopRequireDefault(_reboundComponentHooks);

  var _Component = _interopRequireDefault(_reboundComponentComponent);

  function compile(str) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    /* jshint evil: true */
    // Parse the template and compile our template function
    var defs = (0, _parse["default"])(str, options),
        template = (0, _htmlbarsCompilerCompiler.compile)(defs.template);

    if (defs.isPartial) {
      return _helpers["default"].registerPartial(options.name, template);
    } else {
      return _Component["default"].registerComponent(defs.name, {
        prototype: new Function("return " + defs.script)(),
        template: template,
        style: defs.style
      });
    }
  }

  module.exports = { compile: compile };
});
define("rebound-data/collection", ["exports", "module", "rebound-data/model", "rebound-component/utils"], function (exports, module, _reboundDataModel, _reboundComponentUtils) {
  // Rebound Collection
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _Model = _interopRequireDefault(_reboundDataModel);

  var _$ = _interopRequireDefault(_reboundComponentUtils);

  function pathGenerator(collection) {
    return function () {
      return collection.__path() + "[" + collection.indexOf(collection._byId[this.cid]) + "]";
    };
  }

  var Collection = Backbone.Collection.extend({

    isCollection: true,
    isData: true,

    model: _Model["default"],

    __path: function __path() {
      return "";
    },

    constructor: function constructor(models, options) {
      models || (models = []);
      options || (options = {});
      this.__observers = {};
      this.helpers = {};
      this.cid = _.uniqueId("collection");

      // Set lineage
      this.setParent(options.parent || this);
      this.setRoot(options.root || this);
      this.__path = options.path || this.__path;

      Backbone.Collection.apply(this, arguments);

      // When a model is removed from its original collection, destroy it
      // TODO: Fix this. Computed properties now somehow allow collection to share a model. They may be removed from one but not the other. That is bad.
      // The clone = false options is the culprit. Find a better way to copy all of the collections custom attributes over to the clone.
      this.on("remove", function (model, collection, options) {});
    },

    get: function get(key, options) {

      // If the key is a number or object, default to backbone's collection get
      if (typeof key == "number" || typeof key == "object") {
        return Backbone.Collection.prototype.get.call(this, key);
      }

      // If key is not a string, return undefined
      if (!_.isString(key)) return void 0;

      // Split the path at all '.', '[' and ']' and find the value referanced.
      var parts = _$["default"].splitPath(key),
          result = this,
          l = parts.length,
          i = 0;
      options || (options = {});

      if (_.isUndefined(key) || _.isNull(key)) return key;
      if (key === "" || parts.length === 0) return result;

      if (parts.length > 0) {
        for (i = 0; i < l; i++) {
          // If returning raw, always return the first computed property found. If undefined, you're done.
          if (result && result.isComputedProperty && options.raw) return result;
          if (result && result.isComputedProperty) result = result.value();
          if (_.isUndefined(result) || _.isNull(result)) return result;
          if (parts[i] === "@parent") result = result.__parent__;else if (result.isCollection) result = result.models[parts[i]];else if (result.isModel) result = result.attributes[parts[i]];else if (result.hasOwnProperty(parts[i])) result = result[parts[i]];
        }
      }

      if (result && result.isComputedProperty && !options.raw) result = result.value();

      return result;
    },

    set: function set(models, options) {
      var newModels = [],
          lineage = {
        parent: this,
        root: this.__root__,
        path: pathGenerator(this),
        silent: true
      };
      options = options || {},

      // If no models passed, implies an empty array
      models || (models = []);

      // If models is a string, call set at that path
      if (_.isString(models)) return this.get(_$["default"].splitPath(models)[0]).set(_$["default"].splitPath(models).splice(1, models.length).join("."), options);
      if (!_.isObject(models)) return console.error("Collection.set must be passed a Model, Object, array or Models and Objects, or another Collection");

      // If another collection, treat like an array
      models = models.isCollection ? models.models : models;
      // Ensure models is an array
      models = !_.isArray(models) ? [models] : models;

      // If the model already exists in this collection, or we are told not to clone it, let Backbone handle the merge
      // Otherwise, create our copy of this model, give them the same cid so our helpers treat them as the same object
      _.each(models, function (data, index) {
        if (data.isModel && options.clone === false || this._byId[data.cid]) return newModels[index] = data;
        newModels[index] = new this.model(data, _.defaults(lineage, options));
        data.isModel && (newModels[index].cid = data.cid);
      }, this);

      // Ensure that this element now knows that it has children now. Without this cyclic dependancies cause issues
      this._hasAncestry || (this._hasAncestry = newModels.length > 0);

      // Call original set function with model duplicates
      return Backbone.Collection.prototype.set.call(this, newModels, options);
    }

  });

  module.exports = Collection;
});

// model.deinitialize();
define("rebound-component/component", ["exports", "module", "dom-helper", "htmlbars-runtime/render", "rebound-component/hooks", "rebound-component/helpers", "rebound-component/utils", "rebound-data/rebound-data"], function (exports, module, _domHelper, _htmlbarsRuntimeRender, _reboundComponentHooks, _reboundComponentHelpers, _reboundComponentUtils, _reboundDataReboundData) {
  // Rebound Component
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _DOMHelper = _interopRequireDefault(_domHelper);

  var _render2 = _interopRequireDefault(_htmlbarsRuntimeRender);

  var _hooks = _interopRequireDefault(_reboundComponentHooks);

  var _helpers = _interopRequireDefault(_reboundComponentHelpers);

  var _$ = _interopRequireDefault(_reboundComponentUtils);

  // Returns true if `str` starts with `test`
  function startsWith(str, test) {
    if (str === test) return true;
    str = _$["default"].splitPath(str);
    test = _$["default"].splitPath(test);
    while (test[0] && str[0]) {
      if (str[0] !== test[0] && str[0] !== "@each" && test[0] !== "@each") return false;
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
      this.listenTo(service, "all", function (type, model, value, options) {
        var attr,
            path = model.__path(),
            changed;
        if (type.indexOf("change:") === 0) {
          changed = model.changedAttributes();
          for (attr in changed) {
            // TODO: Modifying arguments array is bad. change this
            type = "change:" + key + "." + path + (path && ".") + attr; // jshint ignore:line
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

    // Set is overridden on components to accept components as a valid input type.
    // Components set on other Components are mixed in as a shared object. {raw: true}
    // It also marks itself as a consumer of this component
    set: function set(key, val, options) {
      var attrs, attr, serviceOptions;
      if (typeof key === "object") {
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
      _.bindAll(this, "_callOnComponent", "_listenToService", "_render");
      this.cid = _.uniqueId("component");
      this.env = _hooks["default"].createChildEnv(_hooks["default"].createFreshEnv());
      // Call on component is used by the {{on}} helper to call all event callbacks in the scope of the component
      this.env.helpers._callOnComponent = this._callOnComponent;
      this.attributes = {};
      this.changed = {};
      this.consumers = [];
      this.services = {};
      this.__parent__ = this.__root__ = this;
      this.listenTo(this, "all", this._onChange);

      // Take our parsed data and add it to our backbone data structure. Does a deep defaults set.
      // In the model, primatives (arrays, objects, etc) are converted to Backbone Objects
      // Functions are compiled to find their dependancies and added as computed properties
      // Set our component's context with the passed data merged with the component's defaults
      this.set(this.defaults || {});
      this.set(options.data || {});

      // Get any additional routes passed in from options
      this.routes = _.defaults(options.routes || {}, this.routes);
      // Ensure that all route functions exist
      _.each(this.routes, function (value, key, routes) {
        if (typeof value !== "string") {
          throw "Function name passed to routes in  " + this.__name + " component must be a string!";
        }
        if (!this[value]) {
          throw "Callback function " + value + " does not exist on the  " + this.__name + " component!";
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
        this.template.reboundTemplate || (this.template = _hooks["default"].wrap(this.template));
        this.template = this.template.render(this, this.env, { contextualElement: this.el }, {});
        this.el.appendChild(this.template.fragment);

        // Add active class to this newly rendered template's link elements that require it
        (0, _$["default"])(this.el).markLinks();
      }

      // Our Component is fully created now, but not rendered. Call created callback.
      if (_.isFunction(this.createdCallback)) {
        this.createdCallback.call(this);
      }

      this.initialize();
    },

    $: function $(selector) {
      if (!this.$el) {
        return console.error("No DOM manipulation library on the page!");
      }
      return this.$el.find(selector);
    },

    // Trigger all events on both the component and the element
    trigger: function trigger(eventName) {
      if (this.el) {
        (0, _$["default"])(this.el).trigger(eventName, arguments);
      }
      Backbone.Model.prototype.trigger.apply(this, arguments);
    },

    _onAttributeChange: function _onAttributeChange(attrName, oldVal, newVal) {},

    _onChange: function _onChange(type, model, collection, options) {
      var shortcircuit = { change: 1, sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1, dirty: 1 };
      if (shortcircuit[type]) return;

      var data, changed;
      model || (model = {});
      collection || (collection = {});
      options || (options = {});
      !collection.isData && type.indexOf("change:") === -1 && (options = collection) && (collection = model);
      this._toRender || (this._toRender = []);

      if (type === "reset" && options.previousAttributes || type.indexOf("change:") !== -1) {
        data = model;
        changed = model.changedAttributes();
      } else if (type === "add" || type === "remove" || type === "reset" && options.previousModels) {
        data = collection;
        changed = {
          "@each": data
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
      if (options.service) basePath = options.service + "." + basePath;
      var parts = _$["default"].splitPath(basePath);
      var key, obsPath, path, observers;

      // For each changed key, walk down the data tree from the root to the data
      // element that triggered the event and add all relevent callbacks to this
      // object's _toRender queue.
      do {
        for (key in changed) {
          path = (basePath + (basePath && key && ".") + key).replace(context.__path(), "").replace(/\[[^\]]+\]/g, ".@each").replace(/^\./, "");
          for (obsPath in context.__observers) {
            observers = context.__observers[obsPath];
            if (startsWith(obsPath, path)) {
              // If this is a collection event, trigger everything, otherwise only trigger property change callbacks
              if (data.isCollection) push.call(this._toRender, observers.collection);
              push.call(this._toRender, observers.model);
            }
          }
        }
      } while (context !== data && (context = context.get(parts.shift())));

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
      "trigger": 1, "constructor": 1, "get": 1, "set": 1, "has": 1,
      "extend": 1, "escape": 1, "unset": 1, "clear": 1, "cid": 1,
      "attributes": 1, "changed": 1, "toJSON": 1, "validationError": 1, "isValid": 1,
      "isNew": 1, "hasChanged": 1, "changedAttributes": 1, "previous": 1, "previousAttributes": 1
    },
        configProperties = {
      "routes": 1, "template": 1, "defaults": 1, "outlet": 1, "url": 1,
      "urlRoot": 1, "idAttribute": 1, "id": 1, "createdCallback": 1, "attachedCallback": 1,
      "detachedCallback": 1
    };

    protoProps || (protoProps = {});
    staticProps || (staticProps = {});
    protoProps.defaults = {};
    // staticProps.services = {};

    // If given a constructor, use it, otherwise use the default one defined above
    if (protoProps && _.has(protoProps, "constructor")) {
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

    _$["default"].extractComputedProps(protoProps);

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
      this.data.deinitialize();
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
      this.data._onAttributeChange(attrName, oldVal, newVal);
      script.attributeChangedCallback && script.attributeChangedCallback.call(this.data, attrName, oldVal, newVal);
    };

    return document.registerElement(name, { prototype: proto });
  };

  _.bindAll(Component, "registerComponent");

  module.exports = Component;
});

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
define("rebound-router/lazy-component", ["exports", "module"], function (exports, module) {
  // Services keep track of their consumers. LazyComponent are placeholders
  // for services that haven't loaded yet. A LazyComponent mimics the api of a
  // real service/component (they are the same), and when the service finally
  // loads, its ```hydrate``` method is called. All consumers of the service will
  // have the now fully loaded service set, the LazyService will transfer all of
  // its consumers over to the fully loaded service, and then destroy itself.
  "use strict";

  function LazyComponent() {
    this.isService = true;
    this.isComponent = true;
    this.isModel = true;
    this.attributes = {};
    this.consumers = [];
    this.set = this.on = this.off = function () {
      return 1;
    };
    this.get = function (path) {
      return path ? undefined : this;
    };
    this.hydrate = function (service) {
      _.each(this.consumers, function (consumer) {
        var component = consumer.component,
            key = consumer.key;
        if (component.attributes && component.set) component.set(key, service);
        if (component.services) component.services[key] = service;
        if (component.defaults) component.defaults[key] = service;
      });
      service.consumers = this.consumers;
      delete this.consumers;
    };
  }

  module.exports = LazyComponent;
});
define("runtime", ["exports", "module", "rebound-component/utils", "rebound-component/helpers", "rebound-data/rebound-data", "rebound-component/component", "rebound-router/rebound-router"], function (exports, module, _reboundComponentUtils, _reboundComponentHelpers, _reboundDataReboundData, _reboundComponentComponent, _reboundRouterReboundRouter) {
  //     Rebound.js 0.0.60

  //     (c) 2015 Adam Miller
  //     Rebound may be freely distributed under the MIT license.
  //     For all details and documentation:
  //     http://reboundjs.com

  // Rebound Runtime
  // ----------------

  // If Backbone isn't preset on the page yet, or if `window.Rebound` is already
  // in use, throw an error
  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  // Load our **Utils**, helper environment, **Rebound Data**,
  // **Rebound Components** and the **Rebound Router**

  var _utils = _interopRequireDefault(_reboundComponentUtils);

  var _helpers = _interopRequireDefault(_reboundComponentHelpers);

  var _Component = _interopRequireDefault(_reboundComponentComponent);

  var _Router = _interopRequireDefault(_reboundRouterReboundRouter);

  if (!window.Backbone) throw "Backbone must be on the page for Rebound to load.";

  // If Backbone doesn't have an ajax method from an external DOM library, use ours
  window.Backbone.ajax = window.Backbone.$ && window.Backbone.$.ajax && window.Backbone.ajax || _utils["default"].ajax;

  // Create Global Rebound Object
  var Rebound = {
    services: {},
    registerHelper: _helpers["default"].registerHelper,
    registerPartial: _helpers["default"].registerPartial,
    registerComponent: _Component["default"].registerComponent,
    Model: _reboundDataReboundData.Model,
    Collection: _reboundDataReboundData.Collection,
    ComputedProperty: _reboundDataReboundData.ComputedProperty,
    Component: _Component["default"],
    start: function start(options) {
      return new Promise(function (resolve, reject) {
        function run() {
          if (document.readyState !== "complete") return;
          Rebound.router = new _Router["default"](options, resolve);
        }
        if (document.readyState === "complete") return run();
        document.addEventListener("readystatechange", run);
      });
    }
  };

  // Fetch Rebound's Config Object from Rebound's `script` tag
  var Config = document.getElementById("Rebound");
  Config = Config ? Config.innerHTML : false;

  // Start the router if a config object is preset
  if (Config) Rebound.start(JSON.parse(Config));

  module.exports = Rebound;
});
define("property-compiler/tokenizer", ["exports", "module"], function (exports, module) {
  /*jshint -W054 */
  // jshint ignore: start

  // A second optional argument can be given to further configure
  // the parser process. These options are recognized:

  "use strict";

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
    return code >= 170 && nonASCIIidentifierStart.test(String.fromCharCode(code));
  };

  // Test whether a given character is part of an identifier.

  var isIdentifierChar = _exports.isIdentifierChar = function (code) {
    if (code < 48) return code === 36;
    if (code < 58) return true;
    if (code < 65) return false;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123) return true;
    return code >= 170 && nonASCIIidentifier.test(String.fromCharCode(code));
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
              out += "\u0000";break; // 0 -> '\0'
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

  module.exports = { tokenize: _exports.tokenize };
});
define('rebound-compiler/parser', ['exports', 'module'], function (exports, module) {
  // Rebound Template Parser
  // -----------------------

  // Remove the contents of the component's `script` tag.
  'use strict';

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
    return str.indexOf('<style>') > -1 && str.indexOf('</style>') > -1 ? str.replace(/([^]*<style>)([^]*)(<\/style>[^]*)/ig, '$2').replace(/"/g, '\\"') : '';
  }

  function stripLinkTags(str) {
    // Remove link tags from template, these are fetched in getDependancies
    return str.replace(/<link .*href=(['"]?)(.*).html\1[^>]*>/gi, '');
  }

  // Remove the contents of the component's `template` tag.
  function getTemplate(str) {
    var start = str.indexOf('<template>');
    var end = str.lastIndexOf('</template>');

    // Get only the content between the template tags, or set to an empty string.
    str = start > -1 && end > -1 ? str.substring(start + 10, end) : '';

    return stripLinkTags(str);
  }

  // Get the component's name from its `name` attribute.
  function getName(str) {
    return str.replace(/[^]*?<element[^>]*name=(["'])?([^'">\s]+)\1[^<>]*>[^]*/ig, '$2').trim();
  }

  // Minify the string passed in by replacing all whitespace.
  function minify(str) {
    return str.replace(/\s+/g, ' ').replace(/\n|(>) (<)/g, '$1$2');
  }

  // Strip javascript comments
  function removeComments(str) {
    return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s])+\/\/(?:.*)$)/gm, '$1');
  }

  // TODO: This is messy, clean it up!
  function getDependancies(template) {
    var base = arguments[1] === undefined ? '' : arguments[1];

    var imports = [],
        partials = [],
        deps = [],
        match,
        importsre = /<link [^h]*href=(['"]?)\/?([^.'"]*).html\1[^>]*>/gi,
        partialsre = /\{\{>\s*?['"]?([^'"}\s]*)['"]?\s*?\}\}/gi,
        start = template.indexOf('<template>'),
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
    var options = arguments[1] === undefined ? {} : arguments[1];

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

  module.exports = parse;
});
define('rebound-compiler/parser', ['exports', 'module'], function (exports, module) {
  // Rebound Template Parser
  // -----------------------

  // Remove the contents of the component's `script` tag.
  'use strict';

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
    return str.indexOf('<style>') > -1 && str.indexOf('</style>') > -1 ? str.replace(/([^]*<style>)([^]*)(<\/style>[^]*)/ig, '$2').replace(/"/g, '\\"') : '';
  }

  function stripLinkTags(str) {
    // Remove link tags from template, these are fetched in getDependancies
    return str.replace(/<link .*href=(['"]?)(.*).html\1[^>]*>/gi, '');
  }

  // Remove the contents of the component's `template` tag.
  function getTemplate(str) {
    var start = str.indexOf('<template>');
    var end = str.lastIndexOf('</template>');

    // Get only the content between the template tags, or set to an empty string.
    str = start > -1 && end > -1 ? str.substring(start + 10, end) : '';

    return stripLinkTags(str);
  }

  // Get the component's name from its `name` attribute.
  function getName(str) {
    return str.replace(/[^]*?<element[^>]*name=(["'])?([^'">\s]+)\1[^<>]*>[^]*/ig, '$2').trim();
  }

  // Minify the string passed in by replacing all whitespace.
  function minify(str) {
    return str.replace(/\s+/g, ' ').replace(/\n|(>) (<)/g, '$1$2');
  }

  // Strip javascript comments
  function removeComments(str) {
    return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s])+\/\/(?:.*)$)/gm, '$1');
  }

  // TODO: This is messy, clean it up!
  function getDependancies(template) {
    var base = arguments[1] === undefined ? '' : arguments[1];

    var imports = [],
        partials = [],
        deps = [],
        match,
        importsre = /<link [^h]*href=(['"]?)\/?([^.'"]*).html\1[^>]*>/gi,
        partialsre = /\{\{>\s*?['"]?([^'"}\s]*)['"]?\s*?\}\}/gi,
        start = template.indexOf('<template>'),
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
    var options = arguments[1] === undefined ? {} : arguments[1];

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

  module.exports = parse;
});
define("rebound-component/helpers", ["exports", "rebound-component/lazy-value", "rebound-component/utils"], function (exports, _reboundComponentLazyValue, _reboundComponentUtils) {
  // Rebound Helpers
  // ----------------

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _LazyValue = _interopRequireDefault(_reboundComponentLazyValue);

  var _$ = _interopRequireDefault(_reboundComponentUtils);

  var helpers = {},
      partials = {};

  helpers.registerPartial = function (name, func) {
    if (func && typeof name === "string") {
      return partials[name] = func;
    }
  };

  helpers.hasHelper = function (env, scope, name) {
    return env.helpers[name] !== undefined;
  };

  // lookupHelper returns the given function from the helpers object. Manual checks prevent user from overriding reserved words.
  helpers.lookupHelper = function (env, scope, name) {
    if (_.isString(env)) name = env;
    env && env.helpers || (env = { helpers: helpers });
    // If a reserved helper, return it
    if (name === "attribute") {
      return env.helpers.attribute;
    }
    if (name === "if") {
      return env.helpers["if"];
    }
    if (name === "unless") {
      return env.helpers.unless;
    }
    if (name === "each") {
      return env.helpers.each;
    }
    if (name === "partial") {
      return env.helpers.partial;
    }
    if (name === "on") {
      return env.helpers.on;
    }
    if (name === "debugger") {
      return env.helpers["debugger"];
    }
    if (name === "log") {
      return env.helpers.log;
    }

    // If not a reserved helper, check env, then global helpers, else return false
    return helpers[name] || env.helpers[name];
  };

  helpers.registerHelper = function (name, callback) {
    if (!_.isString(name)) {
      console.error("Name provided to registerHelper must be a string!");
      return;
    }
    if (!_.isFunction(callback)) {
      console.error("Callback provided to regierHelper must be a function!");
      return;
    }
    if (helpers.lookupHelper(null, null, name)) {
      console.error("A helper called \"" + name + "\" is already registered!");
      return;
    }

    helpers[name] = callback;
  };

  /*******************************
          Default helpers
  ********************************/

  helpers["debugger"] = function (params, hash, options, env) {
    /* jshint -W087 */
    debugger;
    return "";
  };

  helpers.log = function (params, hash, options, env) {
    console.log.apply(console, params);
    return "";
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
    (0, _$["default"])(element).on(eventName, delegate, hash, function (event) {
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
    condition === "true" && (condition = true);
    condition === "false" && (condition = false);

    return condition;
  }

  helpers["if"] = function (params, hash, templates) {

    var condition = isTruthy(params[0]);

    // If yield does not exist, this is not a block helper.
    if (!this["yield"]) {
      return condition ? params[1] : params[2] || "";
    }

    // Render the apropreate block statement
    if (condition && this["yield"]) {
      this["yield"]();
    } else if (!condition && templates.inverse && templates.inverse["yield"]) {
      templates.inverse["yield"]();
    } else {
      return "";
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
      throw new TypeError("findIndex called on null or undefined");
    }
    if (typeof predicate !== "function") {
      throw new TypeError("predicate must be a function");
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

  helpers.each = function (params, hash, templates) {

    if (_.isNull(params[0]) || _.isUndefined(params[0])) {
      console.warn("Undefined value passed to each helper! Maybe try providing a default value?", params, hash);return null;
    }

    var key,
        value = params[0].isCollection ? params[0].models : params[0]; // Accepts collections or arrays

    if (!_.isArray(value) || value.length === 0) {
      if (templates.inverse && templates.inverse["yield"]) templates.inverse["yield"]();
    } else {
      for (key in value) {
        if (value.hasOwnProperty(key)) this.yieldItem(value[key].cid, [value[key]], value);
      }
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
});
define("rebound-data/computed-property", ["exports", "module", "property-compiler/property-compiler", "rebound-component/utils"], function (exports, module, _propertyCompilerPropertyCompiler, _reboundComponentUtils) {
  // Rebound Computed Property
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _propertyCompiler = _interopRequireDefault(_propertyCompilerPropertyCompiler);

  var _$ = _interopRequireDefault(_reboundComponentUtils);

  // Returns true if str starts with test
  function startsWith(str, test) {
    if (str === test) return true;
    return str.substring(0, test.length + 1) === test + ".";
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

    if (!_.isFunction(getter) && !_.isFunction(setter)) return console.error("ComputedProperty constructor must be passed a functions!", prop, "Found instead.");
    options = options || {};
    this.cid = _.uniqueId("computedPropety");
    this.name = options.name;
    this.returnType = null;
    this.__observers = {};
    this.helpers = {};
    this.waiting = {};
    this.isChanging = false;
    this.isDirty = true;
    _.bindAll(this, "onModify", "markDirty");

    if (getter) this.getter = getter;
    if (setter) this.setter = setter;
    this.deps = _propertyCompiler["default"].compile(this.getter, this.name);

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
      return "";
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
      this.trigger("dirty", this);
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
      vector = path = collection.__path().replace(/\.?\[.*\]/ig, ".@each");

      // If a reset event on a Model, check for computed properties that depend
      // on each changed attribute's full path.
      if (type === "reset" && options.previousAttributes) {
        _.each(options.previousAttributes, function (value, key) {
          vector = path + (path && ".") + key;
          _.each(this.__computedDeps, function (dependants, dependancy) {
            startsWith(vector, dependancy) && push.call(this._toCall, dependants);
          }, this);
        }, this);
      }

      // If a reset event on a Collction, check for computed properties that depend
      // on anything inside that collection.
      else if (type === "reset" && options.previousModels) {
        _.each(this.__computedDeps, function (dependants, dependancy) {
          startsWith(dependancy, vector) && push.call(this._toCall, dependants);
        }, this);
      }

      // If an add or remove event, check for computed properties that depend on
      // anything inside that collection or that contains that collection.
      else if (type === "add" || type === "remove") {
        _.each(this.__computedDeps, function (dependants, dependancy) {
          if (startsWith(dependancy, vector) || startsWith(vector, dependancy)) push.call(this._toCall, dependants);
        }, this);
      }

      // If a change event, trigger anything that depends on that changed path.
      else if (type.indexOf("change:") === 0) {
        vector = type.replace("change:", "").replace(/\.?\[.*\]/ig, ".@each");
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
      if (!this.tracking || shortcircuit[type] || ~type.indexOf("change:")) return;
      model || (model = {});
      collection || (collection = {});
      options || (options = {});
      !collection.isData && _.isObject(collection) && (options = collection) && (collection = model);
      var src = this;
      var path = collection.__path().replace(src.__path(), "").replace(/^\./, "");
      var dest = this.tracking.get(path);

      if (_.isUndefined(dest)) return;
      if (type === "change") dest.set && dest.set(model.changedAttributes());else if (type === "reset") dest.reset && dest.reset(model);else if (type === "add") dest.add && dest.add(model);else if (type === "remove") dest.remove && dest.remove(model);
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
        var dep = root.get(path, { raw: true });
        if (!dep || !dep.isComputedProperty) return;
        dep.on("dirty", this.markDirty);
      }, this);

      _.each(this.deps, function (path) {
        // Find actual path from relative paths
        var split = _$["default"].splitPath(path);
        while (split[0] === "@parent") {
          context = context.__parent__;
          split.shift();
        }

        path = context.__path().replace(/\.?\[.*\]/ig, ".@each");
        path = path + (path && ".") + split.join(".");

        // Add ourselves as dependants
        root.__computedDeps[path] || (root.__computedDeps[path] = []);
        root.__computedDeps[path].push(this);
      }, this);

      // Ensure we only have one listener per Model at a time.
      context.off("all", this.onRecompute).on("all", this.onRecompute);
    },

    unwire: function unwire() {
      var root = this.__root__;
      var context = this.__parent__;

      _.each(this.deps, function (path) {
        var dep = root.get(path, { raw: true });
        if (!dep || !dep.isComputedProperty) return;
        dep.off("dirty", this.markDirty);
      }, this);

      context.off("all", this.onRecompute);
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
        var dependancy = context.get(dep, { raw: true });
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

      if (this.returnType !== "value") this.stopListening(value, "all", this.onModify);

      result = this.getter.apply(context, params);

      // Promote vanilla objects to Rebound Data keeping the same original objects
      if (_.isArray(result)) result = new Rebound.Collection(result, { clone: false });else if (_.isObject(result) && !result.isData) result = new Rebound.Model(result, { clone: false });

      // If result is undefined, reset our cache item
      if (_.isUndefined(result) || _.isNull(result)) {
        this.returnType = "value";
        this.isCollection = this.isModel = false;
        this.set(undefined);
      }
      // Set result and return types, bind events
      else if (result.isCollection) {
        this.returnType = "collection";
        this.isCollection = true;
        this.isModel = false;
        this.set(result);
        this.track(result);
      } else if (result.isModel) {
        this.returnType = "model";
        this.isCollection = false;
        this.isModel = true;
        this.reset(result);
        this.track(result);
      } else {
        this.returnType = "value";
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
      this.listenTo(target, "all", this.onModify);
    },

    // Get from the Computed Property's cache
    get: function get(key, options) {
      var value = this.value();
      options || (options = {});
      if (this.returnType === "value") return console.error("Called get on the `" + this.name + "` computed property which returns a primitive value.");
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
      if (this.returnType === "model") {
        if (typeof key === "object") {
          attrs = key.isModel ? key.attributes : key;
          options = val;
        } else {
          (attrs = {})[key] = val;
        }
      }
      if (this.returnType !== "model") options = val || {};
      attrs = attrs && attrs.isComputedProperty ? attrs.value() : attrs;

      // If a new value, set it and trigger events
      this.setter && this.setter.call(this.__root__, attrs);
      if (this.returnType === "value" && this.cache.value !== attrs) {
        this.cache.value = attrs;
        if (!options.quiet) {
          // If set was called not through computedProperty.call(), this is a fresh new event burst.
          if (!this.isDirty && !this.isChanging) this.__parent__.changed = {};
          this.__parent__.changed[this.name] = attrs;
          this.trigger("change", this.__parent__);
          this.trigger("change:" + this.name, this.__parent__, attrs);
          delete this.__parent__.changed[this.name];
        }
      } else if (this.returnType !== "value" && options.reset) key = value.reset(attrs, options);else if (this.returnType !== "value") key = value.set(attrs, options);
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

  module.exports = ComputedProperty;
});
define("rebound-router/rebound-router", ["exports", "module", "rebound-component/utils", "rebound-router/lazy-component"], function (exports, module, _reboundComponentUtils, _reboundRouterLazyComponent) {
  // Rebound Router
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _$ = _interopRequireDefault(_reboundComponentUtils);

  var _LazyComponent = _interopRequireDefault(_reboundRouterLazyComponent);

  var DEFAULT_404_PAGE = "<div style=\"display: block;text-align: center;font-size: 22px;\">\n  <h1 style=\"margin-top: 60px;\">\n    Oops! We couldn't find this page.\n  </h1>\n  <a href=\"#\" onclick=\"window.history.back();return false;\" style=\"display: block;text-decoration: none;margin-top: 30px;\">\n    Take me back\n  </a>\n</div>";

  var ERROR_ROUTE_NAME = "error";
  var SUCCESS = "success";
  var ERROR = "error";
  var LOADING = "loading";

  // Overload Backbone's loadUrl so it returns the value of the routed callback
  // instead of undefined
  Backbone.history.loadUrl = function (fragment) {
    fragment = this.fragment = this.getFragment(fragment);
    var resp = false;
    _.any(this.handlers, function (handler) {
      if (handler.route.test(fragment)) {
        resp = handler.callback(fragment);
        return true;
      }
    });
    return resp;
  };

  // ReboundRouter Constructor
  var ReboundRouter = Backbone.Router.extend({

    status: SUCCESS, // loading, success or error

    // By default there is one route. The wildcard route fetches the required
    // page assets based on user-defined naming convention.
    routes: {
      "*route": "wildcardRoute"
    },

    // Called when no matching routes are found. Extracts root route and fetches it's resources
    wildcardRoute: function wildcardRoute(route) {
      var primaryRoute;

      // If empty route sent, route home
      route = route || "";

      // Get Root of Route
      primaryRoute = route ? route.split("/")[0] : "index";

      // Fetch Resources
      document.body.classList.add("loading");

      return this._fetchResource(route, this.config.container).then(function () {
        document.body.classList.remove("loading");
      })["catch"](function () {});
    },

    // Modify navigate to default to `trigger=true` and to return the value of
    // `Backbone.history.navigate` inside of a promise.
    navigate: function navigate(fragment) {
      var options = arguments[1] === undefined ? {} : arguments[1];

      options.trigger === undefined && (options.trigger = true);
      var resp = Backbone.history.navigate(fragment, options);

      // Always return a promise
      return new Promise(function (resolve, reject) {
        if (resp && resp.constructor === Promise) resp.then(resolve, reject);
        resolve(resp);
      });
    },

    // Modify `router.execute` to return the value of our route callback
    execute: function execute(callback, args, name) {
      if (callback) return callback.apply(this, args);
    },

    route: function route(_route, name, callback) {
      var _this = this;

      if (!_.isRegExp(_route)) _route = this._routeToRegExp(_route);
      if (_.isFunction(name)) {
        callback = name;
        name = "";
      }

      if (!callback) callback = this[name];
      Backbone.history.route(_route, function (fragment) {
        var args = _this._extractParameters(_route, fragment);
        var resp = _this.execute(callback, args, name);
        if (resp !== false) {
          _this.trigger.apply(_this, ["route:" + name].concat(args));
          _this.trigger("route", name, args);
          Backbone.history.trigger("route", _this, name, args);
        }
        return resp;
      });
      return this;
    },

    // On startup, save our config object and start the router
    initialize: function initialize() {
      var options = arguments[0] === undefined ? {} : arguments[0];
      var callback = arguments[1] === undefined ? function () {} : arguments[1];

      // Let all of our components always have referance to our router
      Rebound.Component.prototype.router = this;

      // Save our config referance
      this.config = options;
      this.config.handlers = [];

      // Allow user to override error route
      ERROR_ROUTE_NAME = this.config.errorRoute || ERROR_ROUTE_NAME;

      // Use the user provided container, or default to the closest `<content>` tag
      var container = this.config.container = (0, _$["default"])(this.config.container || "content")[0];

      // Convert our routeMappings to regexps and push to our handlers
      _.each(this.config.routeMapping, function (value, route) {
        if (!_.isRegExp(route)) route = this._routeToRegExp(route);
        this.config.handlers.unshift({ route: route, primaryRoute: value });
      }, this);

      this._watchLinks(container);
      Rebound.services.page = new _LazyComponent["default"]();

      // Install our global components
      _.each(this.config.services, function (selector, route) {
        var container = (0, _$["default"])(selector)[0] || document.createElement(selector || "span");
        this._watchLinks(container);
        Rebound.services[route] = new _LazyComponent["default"]();
        this._fetchResource(route, container)["catch"](function () {});
      }, this);

      // Start the history and call the provided callback
      Backbone.history.start({
        pushState: this.config.pushState === undefined ? true : this.config.pushState,
        root: this.config.root
      }).then(callback);

      return this;
    },

    // Given a dom element, watch for all click events on anchor tags.
    // If the clicked anchor has a relative url, attempt to route to that path.
    // Give all links on the page that match this path the class `active`.
    _watchLinks: function _watchLinks(container) {
      var _this2 = this;

      // Navigate to route for any link with a relative href
      var remoteUrl = /^([a-z]+:)|^(\/\/)|^([^\/]+\.)/;
      (0, _$["default"])(container).on("click", "a", function (e) {
        var path = e.target.getAttribute("href");
        // If path is not an remote url, ends in .[a-z], or blank, try and navigate to that route.
        if (path && path !== "#" && !remoteUrl.test(path)) e.preventDefault();
        // If this is not our current route, navigate to the new route
        if (path !== "/" + Backbone.history.fragment) {
          (0, _$["default"])(container).unMarkLinks();
          _this2.navigate(path, { trigger: true }).then(function () {
            (0, _$["default"])(container).markLinks();
          });
        }
      });
    },

    // De-initializes the previous app before rendering a new app
    // This way we can ensure that every new page starts with a clean slate
    // This is crucial for scalability of a single page app.
    _uninstallResource: function _uninstallResource() {
      var _this3 = this;

      if (!this.current) return;

      var oldPageName = this.current.__name;

      // Unset Previous Application's Routes. For each route in the page app:
      _.each(this.current.data.routes, function (value, key) {

        var regExp = _this3._routeToRegExp(key).toString();

        // Remove the handler from our route object
        Backbone.history.handlers = _.filter(Backbone.history.handlers, function (obj) {
          return obj.route.toString() !== regExp;
        });

        // Delete our referance to the route's callback
        delete _this3["_function_" + key];
      });

      // Un-hook Event Bindings, Delete Objects
      this.current.data.deinitialize();

      // Now we no longer have a page installed.
      this.current = undefined;

      // Disable old css if it exists
      setTimeout(function () {
        if (_this3.status === ERROR) return;
        document.getElementById(oldPageName + "-css").setAttribute("disabled", true);
      }, 500);
    },

    // Give our new page component, load routes and render a new instance of the
    // page component in the top level outlet.
    _installResource: function _installResource(PageApp, primaryRoute, container) {
      var _this4 = this;

      var oldPageName, pageInstance;
      var isService = container !== this.config.container;
      container.classList.remove("error", "loading");

      if (!isService && this.current) this._uninstallResource();

      // Load New PageApp, give it it's name so we know what css to remove when it deinitializes
      pageInstance = new PageApp();
      pageInstance.__name = primaryRoute;

      // Add to our page
      container.innerHTML = "";
      container.appendChild(pageInstance);

      // Make sure we're back at the top of the page
      document.body.scrollTop = 0;

      // Augment ApplicationRouter with new routes from PageApp
      _.each(pageInstance.data.routes, function (value, key) {
        // Generate our route callback's new name
        var routeFunctionName = "_function_" + key,
            functionName;
        // Add the new callback referance on to our router and add the route handler
        _this4[routeFunctionName] = function () {
          pageInstance.data[value].apply(pageInstance.data, arguments);
        };
        _this4.route(key, value, _this4[routeFunctionName]);
      }, this);

      var name = isService ? primaryRoute : "page";
      if (!isService) this.current = pageInstance;
      if (window.Rebound.services[name].isService) window.Rebound.services[name].hydrate(pageInstance.data);
      window.Rebound.services[name] = pageInstance.data;

      // Re-trigger route so the newly added route may execute if there's a route match.
      // If no routes are matched, app will hit wildCard route which will then trigger 404
      if (!isService) {
        if (this.config.triggerOnFirstLoad) Backbone.history.loadUrl(Backbone.history.fragment);
        this.config.triggerOnFirstLoad = true;
      }

      // Return our newly installed app
      return pageInstance;
    },

    // Fetches HTML and CSS
    _fetchResource: function _fetchResource(route, container) {
      var _this5 = this;

      var jsUrl,
          cssUrl,
          cssLoaded = false,
          jsLoaded = false,
          cssElement,
          jsElement,
          PageClass,
          appName,
          primaryRoute,
          isService = container !== this.config.container;

      // Get the root of this route
      appName = primaryRoute = route ? route.split("/")[0] : "index";

      // Find Any Custom Route Mappings
      _.any(this.config.handlers, function (handler) {
        if (handler.route.test(route)) {
          appName = handler.primaryRoute;
          return true;
        }
      });

      jsUrl = this.config.jsPath.replace(/:route/g, primaryRoute).replace(/:app/g, appName);
      cssUrl = this.config.cssPath.replace(/:route/g, primaryRoute).replace(/:app/g, appName);
      cssElement = document.getElementById(appName + "-css");
      jsElement = document.getElementById(appName + "-js");

      // Wrap these async resource fetches in a promise and return it.
      // This promise resolves when both css and js resources are loaded
      // It rejects if either of the css or js resources fails to load.
      return new Promise(function (resolve, reject) {

        _this5.status = LOADING;

        var defaultError = function defaultError(err) {
          if (!isService) {
            _this5._uninstallResource();
            container.innerHTML = DEFAULT_404_PAGE;
          }
          reject(err);
        };

        var throwError = function throwError(err) {
          if (route === ERROR_ROUTE_NAME) return defaultError();
          if (_this5.status === ERROR) return;
          _this5.status = ERROR;
          console.error("Could not " + (isService ? "load the " + route + " service:" : "find the " + route + " page:") + "\n  - CSS Url: " + cssUrl + "\n  - JavaScript Url: " + jsUrl);
          _this5._fetchResource(ERROR_ROUTE_NAME, container).then(reject, reject);
        };

        // If Page Is Already Loaded Then The Route Does Not Exist. 404 and Exit.
        if (_this5.current && _this5.current.name === primaryRoute) {
          return throwError();
        }

        // If this css element is not on the page already, it hasn't been loaded before -
        // create the element and load the css resource.
        // Else if the css resource has been loaded before, enable it
        if (cssElement === null) {
          cssElement = document.createElement("link");
          cssElement.setAttribute("type", "text/css");
          cssElement.setAttribute("rel", "stylesheet");
          cssElement.setAttribute("href", cssUrl);
          cssElement.setAttribute("id", appName + "-css");
          (0, _$["default"])(cssElement).on("load", function (event) {
            if ((cssLoaded = true) && jsLoaded) {
              _this5.status = SUCCESS;
              _this5._installResource(PageClass, appName, container);
              resolve(_this5);
            }
          });
          (0, _$["default"])(cssElement).on("error", function (err) {
            cssElement.dataset.error = "";
            throwError();
          });
          document.head.appendChild(cssElement);
        } else {
          if (cssElement.hasAttribute("data-error")) {
            return throwError();
          }
          if ((cssLoaded = true) && jsLoaded) {
            cssElement && cssElement.removeAttribute("disabled");
            cssLoaded = true;
          }
        }

        // AMD will manage dependancies for us. Load the JavaScript.
        window.require([jsUrl], function (c) {
          jsElement = (0, _$["default"])("script[src=\"" + jsUrl + "\"]")[0];
          jsElement.setAttribute("id", appName + "-js");
          if ((jsLoaded = true) && (PageClass = c) && cssLoaded) {
            _this5.status = SUCCESS;
            cssElement && cssElement.removeAttribute("disabled");
            _this5._installResource(PageClass, appName, container);
            resolve(_this5);
          }
        }, function () {
          jsElement = (0, _$["default"])("script[src=\"" + jsUrl + "\"]")[0];
          jsElement.setAttribute("id", appName + "-js");
          jsElement.dataset.error = "";
          throwError();
        });
      });
    }
  });

  module.exports = ReboundRouter;
});
define("rebound-compiler/precompile", ["exports", "module", "./parser", "htmlbars"], function (exports, module, _parser, _htmlbars) {
  // Rebound Pre-Compiler
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _parse = _interopRequireDefault(_parser);

  function precompile(str) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    if (!str || str.length === 0) {
      return console.error("No template provided!");
    }

    var template;
    str = (0, _parse["default"])(str, options);

    // Compile
    str.template = "" + (0, _htmlbars.compileSpec)(str.template);

    // If is a partial
    if (str.isPartial) {
      template = "\n      define( [ " + str.deps.join(", ") + " ], function(){\n        var template = " + str.template + ";\n        window.Rebound.registerPartial(\"" + str.name + "\", template);\n      });";
    }
    // Else, is a component
    else {
      template = "\n      define( [ " + str.deps.join(", ") + " ], function(){\n        return window.Rebound.registerComponent(\"" + str.name + "\", {\n          prototype: " + str.script + ",\n          template: " + str.template + ",\n          style: \"" + str.style + "\"\n        });\n      });";
    }

    return template;
  }

  module.exports = precompile;
});
define("rebound-component/hooks", ["exports", "module", "rebound-component/lazy-value", "rebound-component/utils", "rebound-component/helpers", "htmlbars-runtime/hooks", "dom-helper", "../htmlbars-util/object-utils", "htmlbars-runtime/render"], function (exports, module, _reboundComponentLazyValue, _reboundComponentUtils, _reboundComponentHelpers, _htmlbarsRuntimeHooks, _domHelper, _htmlbarsUtilObjectUtils, _htmlbarsRuntimeRender) {
  // Rebound Hooks
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _LazyValue = _interopRequireDefault(_reboundComponentLazyValue);

  var _$ = _interopRequireDefault(_reboundComponentUtils);

  var _helpers = _interopRequireDefault(_reboundComponentHelpers);

  var _hooks = _interopRequireDefault(_htmlbarsRuntimeHooks);

  var _DOMHelper = _interopRequireDefault(_domHelper);

  var _render2 = _interopRequireDefault(_htmlbarsRuntimeRender);

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

  _hooks["default"].get = function get(env, scope, path) {

    if (path === "this") path = "";

    var setPath = path;

    var key,
        value,
        rest = _$["default"].splitPath(path);
    key = rest.shift();

    // If this path referances a block param, use that as the context instead.
    if (scope.localPresent[key]) {
      value = scope.locals[key];
      path = rest.join(".");
    } else {
      value = scope.self;
    }

    if (scope.streams[setPath]) return scope.streams[setPath];
    return scope.streams[setPath] = streamProperty(value, path);
  };

  // Given an object (context) and a path, create a LazyValue object that returns the value of object at context and add it as an observer of the context.
  function streamProperty(context, path) {

    // Lazy value that returns the value of context.path
    var lazyValue = new _LazyValue["default"](function () {
      return context.get(path);
    }, { context: context });

    // Save our path so parent lazyvalues can know the data var or helper they are getting info from
    lazyValue.path = path;

    // Save the observer at this path
    lazyValue.addObserver(path, context);

    return lazyValue;
  }

  _hooks["default"].invokeHelper = function invokeHelper(morph, env, scope, visitor, params, hash, helper, templates, context) {
    if (morph && scope.streams[morph.guid]) {
      scope.streams[morph.guid].value;
      return scope.streams[morph.guid];
    }
    var lazyValue = streamHelper.apply(this, arguments);
    lazyValue.path = helper.name;
    lazyValue.value;
    // if(morph) scope.streams[morph.guid] = lazyValue;
    return lazyValue;
  };

  function streamHelper(morph, env, scope, visitor, params, hash, helper, templates, context) {

    if (!_.isFunction(helper)) return console.error(scope + " is not a valid helper!");

    // Create a lazy value that returns the value of our evaluated helper.
    var lazyValue = new _LazyValue["default"](function () {
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

  _hooks["default"].cleanupRenderNode = function () {};

  _hooks["default"].destroyRenderNode = function (renderNode) {};
  _hooks["default"].willCleanupTree = function (renderNode) {};

  /*******************************
          Default Hooks
  ********************************/

  // Helper Hooks

  _hooks["default"].hasHelper = _helpers["default"].hasHelper;

  _hooks["default"].lookupHelper = _helpers["default"].lookupHelper;

  // Rebound's default environment
  // The application environment is propagated down each render call and
  // augmented with helpers as it goes
  _hooks["default"].createFreshEnv = function () {
    return {
      helpers: _helpers["default"],
      hooks: _hooks["default"],
      streams: {},
      dom: new _DOMHelper["default"]["default"](),
      useFragmentCache: true,
      revalidateQueue: {},
      isReboundEnv: true
    };
  };

  _hooks["default"].createChildEnv = function (parent) {
    var env = (0, _htmlbarsUtilObjectUtils.createObject)(parent);
    env.helpers = (0, _htmlbarsUtilObjectUtils.createObject)(parent.helpers);
    return env;
  };

  _hooks["default"].createFreshScope = function () {
    // because `in` checks have unpredictable performance, keep a
    // separate dictionary to track whether a local was bound.
    // See `bindLocal` for more information.
    return { self: null, blocks: {}, locals: {}, localPresent: {}, streams: {} };
  };

  _hooks["default"].createChildScope = function (parent) {
    var scope = (0, _htmlbarsUtilObjectUtils.createObject)(parent);
    scope.locals = (0, _htmlbarsUtilObjectUtils.createObject)(parent.locals);
    scope.streams = (0, _htmlbarsUtilObjectUtils.createObject)(parent.streams);
    return scope;
  };

  // Scope Hooks
  _hooks["default"].bindScope = function bindScope(env, scope) {
    // Initial setup of scope
    env.scope = scope;
  };

  _hooks["default"].wrap = function wrap(template) {
    // Return a wrapper function that will merge user provided helpers and hooks with our defaults
    return {
      reboundTemplate: true,
      meta: template.meta,
      arity: template.arity,
      raw: template,
      render: function render(data, env, options, blockArguments) {
        if (env === undefined) env = _hooks["default"].createFreshEnv();
        if (options === undefined) options = {};

        // Create a fresh scope if it doesn't exist
        var scope = _hooks["default"].createFreshScope();

        env = _hooks["default"].createChildEnv(env);
        _.extend(env.helpers, options.helpers);

        // Ensure we have a contextual element to pass to render
        options.contextualElement || (options.contextualElement = document.body);
        options.self = data;
        options.blockArguments = blockArguments;

        // Call our func with merged helpers and hooks
        env.template = _render2["default"]["default"](template, env, scope, options);
        env.template.uid = _.uniqueId("template");
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

  _hooks["default"].linkRenderNode = function linkRenderNode(renderNode, env, scope, path, params, hash) {

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

  _hooks["default"].getValue = function (referance) {
    return referance && referance.isLazyValue ? referance.value : referance;
  };

  _hooks["default"].subexpr = function subexpr(env, scope, helperName, params, hash) {
    var helper = _helpers["default"].lookupHelper(helperName, env),
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
      lazyValue = _hooks["default"].get(env, context, helperName);
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

  _hooks["default"].concat = function concat(env, params) {

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

    var lazyValue = new _LazyValue["default"](function (params) {
      var value = "";

      for (i = 0, l = params.length; i < l; i++) {
        value += params[i] && params[i].isLazyValue ? params[i].value : params[i] || "";
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
  _hooks["default"].content = function content(morph, env, context, path, lazyValue) {
    var value,
        observer = subtreeObserver,
        domElement = morph.contextualElement,
        helper = _helpers["default"].lookupHelper(path, env);

    var updateTextarea = function updateTextarea(lazyValue) {
      domElement.value = lazyValue.value;
    };

    // Two way databinding for textareas
    if (domElement.tagName === "TEXTAREA") {
      lazyValue.onNotify(updateTextarea);
      (0, _$["default"])(domElement).on("change keyup", function (event) {
        lazyValue.set(lazyValue.path, this.value);
      });
    }

    return lazyValue.value;
  };

  _hooks["default"].attribute = function attribute(attrMorph, env, scope, name, value) {
    var val = value.isLazyValue ? value.value : value,
        domElement = attrMorph.element,
        checkboxChange,
        type = domElement.getAttribute("type"),
        attr,
        inputTypes = { "null": true, "text": true, "email": true, "password": true,
      "search": true, "url": true, "tel": true, "hidden": true,
      "number": true, "color": true, "date": true, "datetime": true,
      "datetime-local:": true, "month": true, "range": true,
      "time": true, "week": true
    };

    // If is a text input element's value prop with only one variable, wire default events
    if (domElement.tagName === "INPUT" && inputTypes[type] && name === "value") {

      // If our special input events have not been bound yet, bind them and set flag
      if (!attrMorph.inputObserver) {

        (0, _$["default"])(domElement).on("change input propertychange", function (event) {
          value.set(value.path, this.value);
        });

        attrMorph.inputObserver = true;
      }

      // Set the attribute on our element for visual referance
      _.isUndefined(val) ? domElement.removeAttribute(name) : domElement.setAttribute(name, val);

      attr = val;
      return domElement.value !== String(attr) ? domElement.value = attr || "" : attr;
    } else if (domElement.tagName === "INPUT" && (type === "checkbox" || type === "radio") && name === "checked") {

      // If our special input events have not been bound yet, bind them and set flag
      if (!attrMorph.eventsBound) {

        (0, _$["default"])(domElement).on("change propertychange", function (event) {
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
    else if (domElement.tagName === "A" && name === "class") {
      if (_.isUndefined(val)) {
        domElement.active ? domElement.setAttribute("class", "active") : domElement.classList.remove("class");
      } else {
        domElement.setAttribute(name, val + (domElement.active ? " active" : ""));
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

    _hooks["default"].linkRenderNode(attrMorph, env, scope, "@attribute", [value], {});
  };

  _hooks["default"].partial = function partial(renderNode, env, scope, path) {
    var part = _reboundComponentHelpers.partials[path];
    if (part && part.render) {
      env = Object.create(env);
      env.template = part.render(scope.self, env, { contextualElement: renderNode.contextualElement }, scope.block);
      return env.template.fragment;
    }
  };

  _hooks["default"].component = function (morph, env, scope, tagName, params, attrs, templates, visitor) {

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
      seedData[key] = _hooks["default"].getValue(attrs[key]);
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

    var _loop = function () {
      var key = prop;
      // For each lazy param passed to our component, have it update the original context when changed.
      if (componentData[key].isLazyValue) {
        componentData[key].onNotify(function () {
          attrs[key].set(attrs[key].path, componentData[key].value);
        });
      }

      // For each lazy param passed to our component, have it update the component when changed.
      if (attrs[key].isLazyValue) {
        attrs[key].onNotify(function () {
          componentData[key].set(key, attrs[key].value);
        });
      }

      // Seed the cache
      componentData[key].value;
    };

    // Set up two way binding between component and original context for non-data attributes
    // Syncing between models and collections passed are handled in model and collection

    for (var prop in componentData) {
      _loop();
    }

    // TODO: Move this to Component
    // // For each change on our component, update the states of the original context and the element's proeprties.
    component.listenTo(component, "change", function (model) {
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
    (0, _$["default"])(element).walkTheDOM(function (el) {
      if (element === el) return true;
      if (el.tagName === "CONTENT") outlet = el;
      if (el.tagName.indexOf("-") > -1) return false;
      return true;
    });

    // If a `<content>` outlet is present in component's template, and a template
    // is provided, render it into the outlet
    if (templates["default"] && _.isElement(outlet)) {
      outlet.innerHTML = "";
      outlet.appendChild(_render2["default"]["default"](templates["default"], env, scope, {}).fragment);
    }

    morph.setNode(element);
    morph.componentIsRendered = true;
  };

  module.exports = _hooks["default"];
});

// for(let i in renderNode.lazyValues)
//   if(renderNode.lazyValues[i].isLazyValue)
//     renderNode.lazyValues[i].destroy();
define("rebound-compiler/precompile", ["exports", "module", "./parser", "htmlbars"], function (exports, module, _parser, _htmlbars) {
  // Rebound Pre-Compiler
  // ----------------

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _parse = _interopRequireDefault(_parser);

  function precompile(str) {
    var options = arguments[1] === undefined ? {} : arguments[1];

    if (!str || str.length === 0) {
      return console.error("No template provided!");
    }

    var template;
    str = (0, _parse["default"])(str, options);

    // Compile
    str.template = "" + (0, _htmlbars.compileSpec)(str.template);

    // If is a partial
    if (str.isPartial) {
      template = "\n      define( [ " + str.deps.join(", ") + " ], function(){\n        var template = " + str.template + ";\n        window.Rebound.registerPartial(\"" + str.name + "\", template);\n      });";
    }
    // Else, is a component
    else {
      template = "\n      define( [ " + str.deps.join(", ") + " ], function(){\n        return window.Rebound.registerComponent(\"" + str.name + "\", {\n          prototype: " + str.script + ",\n          template: " + str.template + ",\n          style: \"" + str.style + "\"\n        });\n      });";
    }

    return template;
  }

  module.exports = precompile;
});
define("rebound-data/model", ["exports", "module", "rebound-data/computed-property", "rebound-component/utils"], function (exports, module, _reboundDataComputedProperty, _reboundComponentUtils) {
  // Rebound Model
  // ----------------

  // Rebound **Models** are the basic data object in the framework - frequently
  // representing a row in a table in a database on your server. The inherit from
  // Backbone Models and have all of the same useful methods you are used to for
  // performing computations and transformations on that data. Rebound augments
  // Backbone Models by enabling deep data nesting. You can now have **Rebound Collections**
  // and **Rebound Computed Properties** as properties of the Model.

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _ComputedProperty = _interopRequireDefault(_reboundDataComputedProperty);

  var _$ = _interopRequireDefault(_reboundComponentUtils);

  // Returns a function that, when called, generates a path constructed from its
  // parent's path and the key it is assigned to. Keeps us from re-naming children
  // when parents change.
  function pathGenerator(parent, key) {
    return function () {
      var path = parent.__path();
      return path + (path === "" ? "" : ".") + key;
    };
  }

  var Model = Backbone.Model.extend({
    // Set this object's data types
    isModel: true,
    isData: true,

    // A method that returns a root path by default. Meant to be overridden on
    // instantiation.
    __path: function __path() {
      return "";
    },

    // Create a new Model with the specified attributes. The Model's lineage is set
    // up here to keep track of it's place in the data tree.
    constructor: function constructor(attributes, options) {
      attributes || (attributes = {});
      attributes.isModel && (attributes = attributes.attributes);
      options || (options = {});
      this.helpers = {};
      this.defaults = this.defaults || {};
      this.setParent(options.parent || this);
      this.setRoot(options.root || this);
      this.__path = options.path || this.__path;

      // Convert getters and setters to computed properties
      _$["default"].extractComputedProps(attributes);

      Backbone.Model.call(this, attributes, options);
    },

    // New convenience function to toggle boolean values in the Model.
    toggle: function toggle(attr, options) {
      options = options ? _.clone(options) : {};
      var val = this.get(attr);
      if (!_.isBoolean(val)) console.error("Tried to toggle non-boolean value " + attr + "!", this);
      return this.set(attr, !val, options);
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
        if (value === obj[key]) continue;else if (_.isUndefined(value)) obj[key] && (changed[key] = obj[key]);else if (key === this.idAttribute) continue;else if (value.isCollection || value.isModel || value.isComputedProperty) {
          value.reset(obj[key] || [], { silent: true });
          if (value.isCollection) changed[key] = [];else if (value.isModel && value.isComputedProperty) changed[key] = value.cache.model.changed;else if (value.isModel) changed[key] = value.changed;
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
      if (!options.silent) this.trigger("reset", this, options);

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
    // - If a `Model`, `Collection`, or primitive value, traverse to it.
    get: function get(key, options) {
      options || (options = {});
      var parts = _$["default"].splitPath(key),
          result = this,
          i,
          l = parts.length;

      if (_.isUndefined(key) || _.isNull(key)) return undefined;
      if (key === "" || parts.length === 0) return result;

      for (i = 0; i < l; i++) {
        if (result && result.isComputedProperty && options.raw) return result;
        if (result && result.isComputedProperty) result = result.value();
        if (_.isUndefined(result) || _.isNull(result)) return result;
        if (parts[i] === "@parent") result = result.__parent__;else if (result.isCollection) result = result.models[parts[i]];else if (result.isModel) result = result.attributes[parts[i]];else if (result && result.hasOwnProperty(parts[i])) result = result[parts[i]];
      }

      if (result && result.isComputedProperty && !options.raw) result = result.value();
      return result;
    },

    // **Model.Set** is overridden to provide support for getting from a deep data tree.
    // `key` may now be any valid json-like identifier. Ex: `obj.coll[3].value`.
    // It needs to traverse `Models`, `Collections` and `Computed Properties` to
    // find the correct value to call the original `Backbone.Set` on.
    set: function set(key, val, options) {

      var attrs,
          attr,
          newKey,
          target,
          destination,
          props = [],
          lineage;

      if (typeof key === "object") {
        attrs = key.isModel ? key.attributes : key;
        options = val;
      } else (attrs = {})[key] = val;
      options || (options = {});

      // Convert getters and setters to computed properties
      _$["default"].extractComputedProps(attrs);

      // If reset option passed, do a reset. If nothing passed, return.
      if (options.reset === true) return this.reset(attrs, options);
      if (options.defaults === true) this.defaults = attrs;
      if (_.isEmpty(attrs)) return;

      // For each attribute passed:
      for (key in attrs) {
        var _val = attrs[key],
            paths = _$["default"].splitPath(key),
            _attr = paths.pop() || ""; // The key        ex: foo[0].bar --> bar
        target = this.get(paths.join(".")), // The element    ex: foo.bar.baz --> foo.bar
        lineage;

        // If target currently doesnt exist, construct its tree
        if (_.isUndefined(target)) {
          target = this;
          _.each(paths, function (value) {
            var tmp = target.get(value);
            if (_.isUndefined(tmp)) tmp = target.set(value, {}).get(value);
            target = tmp;
          }, this);
        }

        // The old value of `attr` in `target`
        destination = target.get(_attr, { raw: true }) || {};

        // Create this new object's lineage.
        lineage = {
          name: key,
          parent: target,
          root: this.__root__,
          path: pathGenerator(target, key),
          silent: true,
          defaults: options.defaults
        };
        // - If val is `null` or `undefined`, set to default value.
        // - If val is a `Computed Property`, get its current cache object.
        // - If val (default value or evaluated computed property) is `null`, set to default value or (fallback `undefined`).
        // - Else If `{raw: true}` option is passed, set the exact object that was passed. No promotion to a Rebound Data object.
        // - Else If this function is the same as the current computed property, continue.
        // - Else If this value is a `Function`, turn it into a `Computed Property`.
        // - Else If this is going to be a cyclical dependancy, use the original object, don't make a copy.
        // - Else If updating an existing object with its respective data type, let Backbone handle the merge.
        // - Else If this value is a `Model` or `Collection`, create a new copy of it using its constructor, preserving its defaults while ensuring no shared memory between objects.
        // - Else If this value is an `Array`, turn it into a `Collection`.
        // - Else If this value is a `Object`, turn it into a `Model`.
        // - Else val is a primitive value, set it accordingly.

        if (_.isNull(_val) || _.isUndefined(_val)) _val = this.defaults[key];
        if (_val && _val.isComputedProperty) _val = _val.value();
        if (_.isNull(_val) || _.isUndefined(_val)) _val = undefined;else if (options.raw === true) _val = _val;else if (destination.isComputedProperty && destination.func === _val) continue;else if (_val.isComputedProto) _val = new _ComputedProperty["default"](_val.get, _val.set, lineage);else if (_val.isData && target.hasParent(_val)) _val = _val;else if (destination.isComputedProperty || destination.isCollection && (_.isArray(_val) || _val.isCollection) || destination.isModel && (_.isObject(_val) || _val.isModel)) {
          destination.set(_val, options);
          continue;
        } else if (_val.isData && options.clone !== false) _val = new _val.constructor(_val.attributes || _val.models, lineage);else if (_.isArray(_val)) _val = new Rebound.Collection(_val, lineage); // TODO: Remove global referance
        else if (_.isObject(_val)) _val = new Model(_val, lineage);

        // If val is a data object, let this object know it is now a parent
        this._hasAncestry = _val && _val.isData || false;

        // Set the value
        Backbone.Model.prototype.set.call(target, _attr, _val, options); // TODO: Event cleanup when replacing a model or collection with another value
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
    _$["default"].extractComputedProps(protoProps.defaults);
    return Backbone.Model.extend.call(this, protoProps, staticProps);
  };

  module.exports = Model;
});
define("rebound-data/rebound-data", ["exports", "module", "rebound-data/model", "rebound-data/collection", "rebound-data/computed-property", "rebound-component/utils"], function (exports, module, _reboundDataModel, _reboundDataCollection, _reboundDataComputedProperty, _reboundComponentUtils) {
  // Rebound Data
  // ----------------
  // These are methods inherited by all Rebound data types: **Models**,
  // **Collections** and **Computed Properties**. Controls tree ancestry
  // tracking, deep event propagation and tree destruction.

  "use strict";

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

  var _Model = _interopRequireDefault(_reboundDataModel);

  var _Collection = _interopRequireDefault(_reboundDataCollection);

  var _ComputedProperty = _interopRequireDefault(_reboundDataComputedProperty);

  var _$ = _interopRequireDefault(_reboundComponentUtils);

  var sharedMethods = {
    // When a change event propagates up the tree it modifies the path part of
    // `change:<path>` to reflect the fully qualified path relative to that object.
    // Ex: Would trigger `change:val`, `change:[0].val`, `change:arr[0].val` and `obj.arr[0].val`
    // on each parent as it is propagated up the tree.
    propagateEvent: function propagateEvent(type, model) {
      if (this.__parent__ === this || type === "dirty") return;
      if (type.indexOf("change:") === 0 && model.isModel) {
        if (this.isCollection && ~type.indexOf("change:[")) return;
        var key,
            path = model.__path().replace(this.__parent__.__path(), "").replace(/^\./, ""),
            changed = model.changedAttributes();

        for (key in changed) {
          // TODO: Modifying arguments array is bad. change this
          arguments[0] = "change:" + path + (path && ".") + key; // jshint ignore:line
          this.__parent__.trigger.apply(this.__parent__, arguments);
        }
        return;
      }
      return this.__parent__.trigger.apply(this.__parent__, arguments);
    },

    // Set this data object's parent to `parent` and, as long as a data object is
    // not its own parent, propagate every event triggered on `this` up the tree.
    setParent: function setParent(parent) {
      if (this.__parent__) this.off("all", this.propagateEvent);
      this.__parent__ = parent;
      this._hasAncestry = true;
      if (parent !== this) this.on("all", this.__parent__.propagateEvent);
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
          if (this.el.detachEvent) this.el.detachEvent("on" + eventType, handler);
        }, this);
        (0, _$["default"])(this.el).walkTheDOM(function (el) {
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
      // Attributes, if a Computed Property, de-init its Cache objects.
      _.each(this.models, function (val) {
        val && val.deinitialize && val.deinitialize();
      });
      this.models && (this.models.length = 0);
      _.each(this.attributes, function (val, key) {
        delete _this.attributes[key];val && val.deinitialize && val.deinitialize();
      });
      if (this.cache) {
        this.cache.collection.deinitialize();
        this.cache.model.deinitialize();
      }
    }
  };

  // Extend all of the **Rebound Data** prototypes with these shared methods
  _.extend(_Model["default"].prototype, sharedMethods);
  _.extend(_Collection["default"].prototype, sharedMethods);
  _.extend(_ComputedProperty["default"].prototype, sharedMethods);

  module.exports = { Model: _Model["default"], Collection: _Collection["default"], ComputedProperty: _ComputedProperty["default"] };
});
define('rebound-component/lazy-value', ['exports', 'module'], function (exports, module) {
  // Rebound Lazy Value
  // ----------------

  'use strict';

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
      res = context.get(this.path);
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

      get: function () {
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

  module.exports = LazyValue;
});
define("rebound-component/utils", ["exports", "module"], function (exports, module) {
  // Rebound Utils
  // ----------------

  "use strict";

  var $ = function $(query) {
    return new utils(query);
  };

  var utils = function utils(query) {
    var i,
        selector = _.isElement(query) && [query] || query === document && [document] || _.isString(query) && document.querySelectorAll(query) || [];
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
      path = ("." + path + ".").split(/(?:\.|\[|\])+/);
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
        get = desc.hasOwnProperty("get") && desc.get;
        set = desc.hasOwnProperty("set") && desc.set;
        if (get || set) {
          delete obj[key];
          obj[key] = { get: get, set: set, isComputedProto: true };
        }
      };
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
          var event = document.createEvent("HTMLEvents");
          event.initEvent(eventName, true, false);
          el.dispatchEvent(event);
        } else {
          el.fireEvent("on" + eventName);
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
          el.detachEvent("on" + eventType, handler);
        }
      }
    },

    on: function on(eventName, delegate, data, handler) {
      var el,
          events = this._events,
          len = this.length,
          eventNames = eventName.split(" "),
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

        delegateId = _.isString(delegate) ? delegate : delegate.delegateId = delegate.delegateId || _.uniqueId("event");
        delegateGroup = el.delegateGroup = el.delegateGroup || _.uniqueId("delegateGroup");

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
            el.addEventListener(eventName, callback, eventName === "focus" || eventName === "blur");
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
      var links = this[0].querySelectorAll("a[href=\"/" + Backbone.history.fragment + "\"]");
      for (var i = 0; i < links.length; i++) {
        links.item(i).classList.remove("active");
        links.item(i).active = false;
      }
    },
    markLinks: function markLinks() {
      var links = this[0].querySelectorAll("a[href=\"/" + Backbone.history.fragment + "\"]");
      for (var i = 0; i < links.length; i++) {
        links.item(i).classList.add("active");
        links.item(i).active = true;
      }
    },

    // http://krasimirtsonev.com/blog/article/Cross-browser-handling-of-Ajax-requests-in-absurdjs
    ajax: function ajax(ops) {
      if (typeof ops == "string") ops = { url: ops };
      ops.url = ops.url || "";
      ops.json = ops.json || true;
      ops.method = ops.method || "get";
      ops.data = ops.data || {};
      var getParams = function getParams(data, url) {
        var arr = [],
            str;
        for (var name in data) {
          arr.push(name + "=" + encodeURIComponent(data[name]));
        }
        str = arr.join("&");
        if (str !== "") {
          return url ? url.indexOf("?") < 0 ? "?" + str : "&" + str : str;
        }
        return "";
      };
      var api = {
        host: {},
        process: function process(ops) {
          var self = this;
          this.xhr = null;
          if (window.ActiveXObject) {
            this.xhr = new ActiveXObject("Microsoft.XMLHTTP");
          } else if (window.XMLHttpRequest) {
            this.xhr = new XMLHttpRequest();
          }
          if (this.xhr) {
            this.xhr.onreadystatechange = function () {
              if (self.xhr.readyState == 4 && self.xhr.status == 200) {
                var result = self.xhr.responseText;
                if (ops.json === true && typeof JSON != "undefined") {
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
          if (ops.method == "get") {
            this.xhr.open("GET", ops.url + getParams(ops.data, ops.url), true);
            this.setHeaders({
              "X-Requested-With": "XMLHttpRequest"
            });
          } else {
            this.xhr.open(ops.method, ops.url, true);
            this.setHeaders({
              "X-Requested-With": "XMLHttpRequest",
              "Content-type": "application/x-www-form-urlencoded"
            });
          }
          if (ops.headers && typeof ops.headers == "object") {
            this.setHeaders(ops.headers);
          }
          setTimeout(function () {
            ops.method == "get" ? self.xhr.send() : self.xhr.send(getParams(ops.data));
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

  module.exports = $;
});
//The modules for your project will be inlined above
//this snippet. Ask almond to synchronously require the
//module value for 'main' here and return it as the
//value to use for the public API for the built file.

  return require('runtime');
}));

require.config({
    baseUrl: "/"
});
// Used to test a specific component.
// Marks constructor as in "test" mode so dom updates are syncrynous.
// TODO: Turn this into an override of Component's _onchange function.
window.Rebound.test = function(component, callback){
  require([component], function(constructor){
    constructor.prototype.testing = true;
    callback.call(this, constructor);
  });
};

// Insert our test viewer onto the page
document.addEventListener("DOMContentLoaded", function() {
  var container = document.createElement('main');
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.overflow = 'auto';
  container.style.position =  'fixed';
  container.style.background = 'white';
  container.style.border = '1px solid #333';
  container.style.bottom = '0px';
  container.style.right = '0';
  container.style.boxSizing = 'border-box';
  container.style.transform = 'scale(.4)';
  container.style.transformOrigin = '100% 100%';

  // TODO: Allow the user to provide the content that goes into the test viewer.
  var nav = document.createElement('nav');
  var content = document.createElement('content');
  container.appendChild(nav);
  container.appendChild(content);

  document.body.appendChild(container);
});

// Route to the specified url
var visit = function visit(url){

};

var click = function click(selector){

};

// Fill in the selected input with the text. Should trigger appropreate keyboard events
var fillIn = function fillIn(selector, text){

};

// Triggers an event on an element
var trigger = function trigger(url){

};

// Calls a synchronous callback
var then = function then(callback){

};