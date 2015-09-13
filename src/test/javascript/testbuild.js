(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * @license AngularJS v1.4.5
 * (c) 2010-2015 Google, Inc. http://angularjs.org
 * License: MIT
 */
(function(window, angular, undefined) {

'use strict';

/**
 * @ngdoc object
 * @name angular.mock
 * @description
 *
 * Namespace from 'angular-mocks.js' which contains testing related code.
 */
angular.mock = {};

/**
 * ! This is a private undocumented service !
 *
 * @name $browser
 *
 * @description
 * This service is a mock implementation of {@link ng.$browser}. It provides fake
 * implementation for commonly used browser apis that are hard to test, e.g. setTimeout, xhr,
 * cookies, etc...
 *
 * The api of this service is the same as that of the real {@link ng.$browser $browser}, except
 * that there are several helper methods available which can be used in tests.
 */
angular.mock.$BrowserProvider = function() {
  this.$get = function() {
    return new angular.mock.$Browser();
  };
};

angular.mock.$Browser = function() {
  var self = this;

  this.isMock = true;
  self.$$url = "http://server/";
  self.$$lastUrl = self.$$url; // used by url polling fn
  self.pollFns = [];

  // TODO(vojta): remove this temporary api
  self.$$completeOutstandingRequest = angular.noop;
  self.$$incOutstandingRequestCount = angular.noop;


  // register url polling fn

  self.onUrlChange = function(listener) {
    self.pollFns.push(
      function() {
        if (self.$$lastUrl !== self.$$url || self.$$state !== self.$$lastState) {
          self.$$lastUrl = self.$$url;
          self.$$lastState = self.$$state;
          listener(self.$$url, self.$$state);
        }
      }
    );

    return listener;
  };

  self.$$applicationDestroyed = angular.noop;
  self.$$checkUrlChange = angular.noop;

  self.deferredFns = [];
  self.deferredNextId = 0;

  self.defer = function(fn, delay) {
    delay = delay || 0;
    self.deferredFns.push({time:(self.defer.now + delay), fn:fn, id: self.deferredNextId});
    self.deferredFns.sort(function(a, b) { return a.time - b.time;});
    return self.deferredNextId++;
  };


  /**
   * @name $browser#defer.now
   *
   * @description
   * Current milliseconds mock time.
   */
  self.defer.now = 0;


  self.defer.cancel = function(deferId) {
    var fnIndex;

    angular.forEach(self.deferredFns, function(fn, index) {
      if (fn.id === deferId) fnIndex = index;
    });

    if (fnIndex !== undefined) {
      self.deferredFns.splice(fnIndex, 1);
      return true;
    }

    return false;
  };


  /**
   * @name $browser#defer.flush
   *
   * @description
   * Flushes all pending requests and executes the defer callbacks.
   *
   * @param {number=} number of milliseconds to flush. See {@link #defer.now}
   */
  self.defer.flush = function(delay) {
    if (angular.isDefined(delay)) {
      self.defer.now += delay;
    } else {
      if (self.deferredFns.length) {
        self.defer.now = self.deferredFns[self.deferredFns.length - 1].time;
      } else {
        throw new Error('No deferred tasks to be flushed');
      }
    }

    while (self.deferredFns.length && self.deferredFns[0].time <= self.defer.now) {
      self.deferredFns.shift().fn();
    }
  };

  self.$$baseHref = '/';
  self.baseHref = function() {
    return this.$$baseHref;
  };
};
angular.mock.$Browser.prototype = {

/**
  * @name $browser#poll
  *
  * @description
  * run all fns in pollFns
  */
  poll: function poll() {
    angular.forEach(this.pollFns, function(pollFn) {
      pollFn();
    });
  },

  url: function(url, replace, state) {
    if (angular.isUndefined(state)) {
      state = null;
    }
    if (url) {
      this.$$url = url;
      // Native pushState serializes & copies the object; simulate it.
      this.$$state = angular.copy(state);
      return this;
    }

    return this.$$url;
  },

  state: function() {
    return this.$$state;
  },

  notifyWhenNoOutstandingRequests: function(fn) {
    fn();
  }
};


/**
 * @ngdoc provider
 * @name $exceptionHandlerProvider
 *
 * @description
 * Configures the mock implementation of {@link ng.$exceptionHandler} to rethrow or to log errors
 * passed to the `$exceptionHandler`.
 */

/**
 * @ngdoc service
 * @name $exceptionHandler
 *
 * @description
 * Mock implementation of {@link ng.$exceptionHandler} that rethrows or logs errors passed
 * to it. See {@link ngMock.$exceptionHandlerProvider $exceptionHandlerProvider} for configuration
 * information.
 *
 *
 * ```js
 *   describe('$exceptionHandlerProvider', function() {
 *
 *     it('should capture log messages and exceptions', function() {
 *
 *       module(function($exceptionHandlerProvider) {
 *         $exceptionHandlerProvider.mode('log');
 *       });
 *
 *       inject(function($log, $exceptionHandler, $timeout) {
 *         $timeout(function() { $log.log(1); });
 *         $timeout(function() { $log.log(2); throw 'banana peel'; });
 *         $timeout(function() { $log.log(3); });
 *         expect($exceptionHandler.errors).toEqual([]);
 *         expect($log.assertEmpty());
 *         $timeout.flush();
 *         expect($exceptionHandler.errors).toEqual(['banana peel']);
 *         expect($log.log.logs).toEqual([[1], [2], [3]]);
 *       });
 *     });
 *   });
 * ```
 */

angular.mock.$ExceptionHandlerProvider = function() {
  var handler;

  /**
   * @ngdoc method
   * @name $exceptionHandlerProvider#mode
   *
   * @description
   * Sets the logging mode.
   *
   * @param {string} mode Mode of operation, defaults to `rethrow`.
   *
   *   - `log`: Sometimes it is desirable to test that an error is thrown, for this case the `log`
   *            mode stores an array of errors in `$exceptionHandler.errors`, to allow later
   *            assertion of them. See {@link ngMock.$log#assertEmpty assertEmpty()} and
   *            {@link ngMock.$log#reset reset()}
   *   - `rethrow`: If any errors are passed to the handler in tests, it typically means that there
   *                is a bug in the application or test, so this mock will make these tests fail.
   *                For any implementations that expect exceptions to be thrown, the `rethrow` mode
   *                will also maintain a log of thrown errors.
   */
  this.mode = function(mode) {

    switch (mode) {
      case 'log':
      case 'rethrow':
        var errors = [];
        handler = function(e) {
          if (arguments.length == 1) {
            errors.push(e);
          } else {
            errors.push([].slice.call(arguments, 0));
          }
          if (mode === "rethrow") {
            throw e;
          }
        };
        handler.errors = errors;
        break;
      default:
        throw new Error("Unknown mode '" + mode + "', only 'log'/'rethrow' modes are allowed!");
    }
  };

  this.$get = function() {
    return handler;
  };

  this.mode('rethrow');
};


/**
 * @ngdoc service
 * @name $log
 *
 * @description
 * Mock implementation of {@link ng.$log} that gathers all logged messages in arrays
 * (one array per logging level). These arrays are exposed as `logs` property of each of the
 * level-specific log function, e.g. for level `error` the array is exposed as `$log.error.logs`.
 *
 */
angular.mock.$LogProvider = function() {
  var debug = true;

  function concat(array1, array2, index) {
    return array1.concat(Array.prototype.slice.call(array2, index));
  }

  this.debugEnabled = function(flag) {
    if (angular.isDefined(flag)) {
      debug = flag;
      return this;
    } else {
      return debug;
    }
  };

  this.$get = function() {
    var $log = {
      log: function() { $log.log.logs.push(concat([], arguments, 0)); },
      warn: function() { $log.warn.logs.push(concat([], arguments, 0)); },
      info: function() { $log.info.logs.push(concat([], arguments, 0)); },
      error: function() { $log.error.logs.push(concat([], arguments, 0)); },
      debug: function() {
        if (debug) {
          $log.debug.logs.push(concat([], arguments, 0));
        }
      }
    };

    /**
     * @ngdoc method
     * @name $log#reset
     *
     * @description
     * Reset all of the logging arrays to empty.
     */
    $log.reset = function() {
      /**
       * @ngdoc property
       * @name $log#log.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#log `log()`}.
       *
       * @example
       * ```js
       * $log.log('Some Log');
       * var first = $log.log.logs.unshift();
       * ```
       */
      $log.log.logs = [];
      /**
       * @ngdoc property
       * @name $log#info.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#info `info()`}.
       *
       * @example
       * ```js
       * $log.info('Some Info');
       * var first = $log.info.logs.unshift();
       * ```
       */
      $log.info.logs = [];
      /**
       * @ngdoc property
       * @name $log#warn.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#warn `warn()`}.
       *
       * @example
       * ```js
       * $log.warn('Some Warning');
       * var first = $log.warn.logs.unshift();
       * ```
       */
      $log.warn.logs = [];
      /**
       * @ngdoc property
       * @name $log#error.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#error `error()`}.
       *
       * @example
       * ```js
       * $log.error('Some Error');
       * var first = $log.error.logs.unshift();
       * ```
       */
      $log.error.logs = [];
        /**
       * @ngdoc property
       * @name $log#debug.logs
       *
       * @description
       * Array of messages logged using {@link ng.$log#debug `debug()`}.
       *
       * @example
       * ```js
       * $log.debug('Some Error');
       * var first = $log.debug.logs.unshift();
       * ```
       */
      $log.debug.logs = [];
    };

    /**
     * @ngdoc method
     * @name $log#assertEmpty
     *
     * @description
     * Assert that all of the logging methods have no logged messages. If any messages are present,
     * an exception is thrown.
     */
    $log.assertEmpty = function() {
      var errors = [];
      angular.forEach(['error', 'warn', 'info', 'log', 'debug'], function(logLevel) {
        angular.forEach($log[logLevel].logs, function(log) {
          angular.forEach(log, function(logItem) {
            errors.push('MOCK $log (' + logLevel + '): ' + String(logItem) + '\n' +
                        (logItem.stack || ''));
          });
        });
      });
      if (errors.length) {
        errors.unshift("Expected $log to be empty! Either a message was logged unexpectedly, or " +
          "an expected log message was not checked and removed:");
        errors.push('');
        throw new Error(errors.join('\n---------\n'));
      }
    };

    $log.reset();
    return $log;
  };
};


/**
 * @ngdoc service
 * @name $interval
 *
 * @description
 * Mock implementation of the $interval service.
 *
 * Use {@link ngMock.$interval#flush `$interval.flush(millis)`} to
 * move forward by `millis` milliseconds and trigger any functions scheduled to run in that
 * time.
 *
 * @param {function()} fn A function that should be called repeatedly.
 * @param {number} delay Number of milliseconds between each function call.
 * @param {number=} [count=0] Number of times to repeat. If not set, or 0, will repeat
 *   indefinitely.
 * @param {boolean=} [invokeApply=true] If set to `false` skips model dirty checking, otherwise
 *   will invoke `fn` within the {@link ng.$rootScope.Scope#$apply $apply} block.
 * @param {...*=} Pass additional parameters to the executed function.
 * @returns {promise} A promise which will be notified on each iteration.
 */
angular.mock.$IntervalProvider = function() {
  this.$get = ['$browser', '$rootScope', '$q', '$$q',
       function($browser,   $rootScope,   $q,   $$q) {
    var repeatFns = [],
        nextRepeatId = 0,
        now = 0;

    var $interval = function(fn, delay, count, invokeApply) {
      var hasParams = arguments.length > 4,
          args = hasParams ? Array.prototype.slice.call(arguments, 4) : [],
          iteration = 0,
          skipApply = (angular.isDefined(invokeApply) && !invokeApply),
          deferred = (skipApply ? $$q : $q).defer(),
          promise = deferred.promise;

      count = (angular.isDefined(count)) ? count : 0;
      promise.then(null, null, (!hasParams) ? fn : function() {
        fn.apply(null, args);
      });

      promise.$$intervalId = nextRepeatId;

      function tick() {
        deferred.notify(iteration++);

        if (count > 0 && iteration >= count) {
          var fnIndex;
          deferred.resolve(iteration);

          angular.forEach(repeatFns, function(fn, index) {
            if (fn.id === promise.$$intervalId) fnIndex = index;
          });

          if (fnIndex !== undefined) {
            repeatFns.splice(fnIndex, 1);
          }
        }

        if (skipApply) {
          $browser.defer.flush();
        } else {
          $rootScope.$apply();
        }
      }

      repeatFns.push({
        nextTime:(now + delay),
        delay: delay,
        fn: tick,
        id: nextRepeatId,
        deferred: deferred
      });
      repeatFns.sort(function(a, b) { return a.nextTime - b.nextTime;});

      nextRepeatId++;
      return promise;
    };
    /**
     * @ngdoc method
     * @name $interval#cancel
     *
     * @description
     * Cancels a task associated with the `promise`.
     *
     * @param {promise} promise A promise from calling the `$interval` function.
     * @returns {boolean} Returns `true` if the task was successfully cancelled.
     */
    $interval.cancel = function(promise) {
      if (!promise) return false;
      var fnIndex;

      angular.forEach(repeatFns, function(fn, index) {
        if (fn.id === promise.$$intervalId) fnIndex = index;
      });

      if (fnIndex !== undefined) {
        repeatFns[fnIndex].deferred.reject('canceled');
        repeatFns.splice(fnIndex, 1);
        return true;
      }

      return false;
    };

    /**
     * @ngdoc method
     * @name $interval#flush
     * @description
     *
     * Runs interval tasks scheduled to be run in the next `millis` milliseconds.
     *
     * @param {number=} millis maximum timeout amount to flush up until.
     *
     * @return {number} The amount of time moved forward.
     */
    $interval.flush = function(millis) {
      now += millis;
      while (repeatFns.length && repeatFns[0].nextTime <= now) {
        var task = repeatFns[0];
        task.fn();
        task.nextTime += task.delay;
        repeatFns.sort(function(a, b) { return a.nextTime - b.nextTime;});
      }
      return millis;
    };

    return $interval;
  }];
};


/* jshint -W101 */
/* The R_ISO8061_STR regex is never going to fit into the 100 char limit!
 * This directive should go inside the anonymous function but a bug in JSHint means that it would
 * not be enacted early enough to prevent the warning.
 */
var R_ISO8061_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?:\:?(\d\d)(?:\:?(\d\d)(?:\.(\d{3}))?)?)?(Z|([+-])(\d\d):?(\d\d)))?$/;

function jsonStringToDate(string) {
  var match;
  if (match = string.match(R_ISO8061_STR)) {
    var date = new Date(0),
        tzHour = 0,
        tzMin  = 0;
    if (match[9]) {
      tzHour = toInt(match[9] + match[10]);
      tzMin = toInt(match[9] + match[11]);
    }
    date.setUTCFullYear(toInt(match[1]), toInt(match[2]) - 1, toInt(match[3]));
    date.setUTCHours(toInt(match[4] || 0) - tzHour,
                     toInt(match[5] || 0) - tzMin,
                     toInt(match[6] || 0),
                     toInt(match[7] || 0));
    return date;
  }
  return string;
}

function toInt(str) {
  return parseInt(str, 10);
}

function padNumber(num, digits, trim) {
  var neg = '';
  if (num < 0) {
    neg =  '-';
    num = -num;
  }
  num = '' + num;
  while (num.length < digits) num = '0' + num;
  if (trim) {
    num = num.substr(num.length - digits);
  }
  return neg + num;
}


/**
 * @ngdoc type
 * @name angular.mock.TzDate
 * @description
 *
 * *NOTE*: this is not an injectable instance, just a globally available mock class of `Date`.
 *
 * Mock of the Date type which has its timezone specified via constructor arg.
 *
 * The main purpose is to create Date-like instances with timezone fixed to the specified timezone
 * offset, so that we can test code that depends on local timezone settings without dependency on
 * the time zone settings of the machine where the code is running.
 *
 * @param {number} offset Offset of the *desired* timezone in hours (fractions will be honored)
 * @param {(number|string)} timestamp Timestamp representing the desired time in *UTC*
 *
 * @example
 * !!!! WARNING !!!!!
 * This is not a complete Date object so only methods that were implemented can be called safely.
 * To make matters worse, TzDate instances inherit stuff from Date via a prototype.
 *
 * We do our best to intercept calls to "unimplemented" methods, but since the list of methods is
 * incomplete we might be missing some non-standard methods. This can result in errors like:
 * "Date.prototype.foo called on incompatible Object".
 *
 * ```js
 * var newYearInBratislava = new TzDate(-1, '2009-12-31T23:00:00Z');
 * newYearInBratislava.getTimezoneOffset() => -60;
 * newYearInBratislava.getFullYear() => 2010;
 * newYearInBratislava.getMonth() => 0;
 * newYearInBratislava.getDate() => 1;
 * newYearInBratislava.getHours() => 0;
 * newYearInBratislava.getMinutes() => 0;
 * newYearInBratislava.getSeconds() => 0;
 * ```
 *
 */
angular.mock.TzDate = function(offset, timestamp) {
  var self = new Date(0);
  if (angular.isString(timestamp)) {
    var tsStr = timestamp;

    self.origDate = jsonStringToDate(timestamp);

    timestamp = self.origDate.getTime();
    if (isNaN(timestamp)) {
      throw {
        name: "Illegal Argument",
        message: "Arg '" + tsStr + "' passed into TzDate constructor is not a valid date string"
      };
    }
  } else {
    self.origDate = new Date(timestamp);
  }

  var localOffset = new Date(timestamp).getTimezoneOffset();
  self.offsetDiff = localOffset * 60 * 1000 - offset * 1000 * 60 * 60;
  self.date = new Date(timestamp + self.offsetDiff);

  self.getTime = function() {
    return self.date.getTime() - self.offsetDiff;
  };

  self.toLocaleDateString = function() {
    return self.date.toLocaleDateString();
  };

  self.getFullYear = function() {
    return self.date.getFullYear();
  };

  self.getMonth = function() {
    return self.date.getMonth();
  };

  self.getDate = function() {
    return self.date.getDate();
  };

  self.getHours = function() {
    return self.date.getHours();
  };

  self.getMinutes = function() {
    return self.date.getMinutes();
  };

  self.getSeconds = function() {
    return self.date.getSeconds();
  };

  self.getMilliseconds = function() {
    return self.date.getMilliseconds();
  };

  self.getTimezoneOffset = function() {
    return offset * 60;
  };

  self.getUTCFullYear = function() {
    return self.origDate.getUTCFullYear();
  };

  self.getUTCMonth = function() {
    return self.origDate.getUTCMonth();
  };

  self.getUTCDate = function() {
    return self.origDate.getUTCDate();
  };

  self.getUTCHours = function() {
    return self.origDate.getUTCHours();
  };

  self.getUTCMinutes = function() {
    return self.origDate.getUTCMinutes();
  };

  self.getUTCSeconds = function() {
    return self.origDate.getUTCSeconds();
  };

  self.getUTCMilliseconds = function() {
    return self.origDate.getUTCMilliseconds();
  };

  self.getDay = function() {
    return self.date.getDay();
  };

  // provide this method only on browsers that already have it
  if (self.toISOString) {
    self.toISOString = function() {
      return padNumber(self.origDate.getUTCFullYear(), 4) + '-' +
            padNumber(self.origDate.getUTCMonth() + 1, 2) + '-' +
            padNumber(self.origDate.getUTCDate(), 2) + 'T' +
            padNumber(self.origDate.getUTCHours(), 2) + ':' +
            padNumber(self.origDate.getUTCMinutes(), 2) + ':' +
            padNumber(self.origDate.getUTCSeconds(), 2) + '.' +
            padNumber(self.origDate.getUTCMilliseconds(), 3) + 'Z';
    };
  }

  //hide all methods not implemented in this mock that the Date prototype exposes
  var unimplementedMethods = ['getUTCDay',
      'getYear', 'setDate', 'setFullYear', 'setHours', 'setMilliseconds',
      'setMinutes', 'setMonth', 'setSeconds', 'setTime', 'setUTCDate', 'setUTCFullYear',
      'setUTCHours', 'setUTCMilliseconds', 'setUTCMinutes', 'setUTCMonth', 'setUTCSeconds',
      'setYear', 'toDateString', 'toGMTString', 'toJSON', 'toLocaleFormat', 'toLocaleString',
      'toLocaleTimeString', 'toSource', 'toString', 'toTimeString', 'toUTCString', 'valueOf'];

  angular.forEach(unimplementedMethods, function(methodName) {
    self[methodName] = function() {
      throw new Error("Method '" + methodName + "' is not implemented in the TzDate mock");
    };
  });

  return self;
};

//make "tzDateInstance instanceof Date" return true
angular.mock.TzDate.prototype = Date.prototype;
/* jshint +W101 */

angular.mock.animate = angular.module('ngAnimateMock', ['ng'])

  .config(['$provide', function($provide) {

    $provide.factory('$$forceReflow', function() {
      function reflowFn() {
        reflowFn.totalReflows++;
      }
      reflowFn.totalReflows = 0;
      return reflowFn;
    });

    $provide.factory('$$animateAsyncRun', function() {
      var queue = [];
      var queueFn = function() {
        return function(fn) {
          queue.push(fn);
        };
      };
      queueFn.flush = function() {
        if (queue.length === 0) return false;

        for (var i = 0; i < queue.length; i++) {
          queue[i]();
        }
        queue = [];

        return true;
      };
      return queueFn;
    });

    $provide.decorator('$animate', ['$delegate', '$timeout', '$browser', '$$rAF', '$$forceReflow', '$$animateAsyncRun',
                            function($delegate,   $timeout,   $browser,   $$rAF,   $$forceReflow,   $$animateAsyncRun) {

      var animate = {
        queue: [],
        cancel: $delegate.cancel,
        on: $delegate.on,
        off: $delegate.off,
        pin: $delegate.pin,
        get reflows() {
          return $$forceReflow.totalReflows;
        },
        enabled: $delegate.enabled,
        flush: function() {
          var rafsFlushed = false;
          if ($$rAF.queue.length) {
            $$rAF.flush();
            rafsFlushed = true;
          }

          var animatorsFlushed = $$animateAsyncRun.flush();
          if (!rafsFlushed && !animatorsFlushed) {
            throw new Error('No pending animations ready to be closed or flushed');
          }
        }
      };

      angular.forEach(
        ['animate','enter','leave','move','addClass','removeClass','setClass'], function(method) {
        animate[method] = function() {
          animate.queue.push({
            event: method,
            element: arguments[0],
            options: arguments[arguments.length - 1],
            args: arguments
          });
          return $delegate[method].apply($delegate, arguments);
        };
      });

      return animate;
    }]);

  }]);


/**
 * @ngdoc function
 * @name angular.mock.dump
 * @description
 *
 * *NOTE*: this is not an injectable instance, just a globally available function.
 *
 * Method for serializing common angular objects (scope, elements, etc..) into strings, useful for
 * debugging.
 *
 * This method is also available on window, where it can be used to display objects on debug
 * console.
 *
 * @param {*} object - any object to turn into string.
 * @return {string} a serialized string of the argument
 */
angular.mock.dump = function(object) {
  return serialize(object);

  function serialize(object) {
    var out;

    if (angular.isElement(object)) {
      object = angular.element(object);
      out = angular.element('<div></div>');
      angular.forEach(object, function(element) {
        out.append(angular.element(element).clone());
      });
      out = out.html();
    } else if (angular.isArray(object)) {
      out = [];
      angular.forEach(object, function(o) {
        out.push(serialize(o));
      });
      out = '[ ' + out.join(', ') + ' ]';
    } else if (angular.isObject(object)) {
      if (angular.isFunction(object.$eval) && angular.isFunction(object.$apply)) {
        out = serializeScope(object);
      } else if (object instanceof Error) {
        out = object.stack || ('' + object.name + ': ' + object.message);
      } else {
        // TODO(i): this prevents methods being logged,
        // we should have a better way to serialize objects
        out = angular.toJson(object, true);
      }
    } else {
      out = String(object);
    }

    return out;
  }

  function serializeScope(scope, offset) {
    offset = offset ||  '  ';
    var log = [offset + 'Scope(' + scope.$id + '): {'];
    for (var key in scope) {
      if (Object.prototype.hasOwnProperty.call(scope, key) && !key.match(/^(\$|this)/)) {
        log.push('  ' + key + ': ' + angular.toJson(scope[key]));
      }
    }
    var child = scope.$$childHead;
    while (child) {
      log.push(serializeScope(child, offset + '  '));
      child = child.$$nextSibling;
    }
    log.push('}');
    return log.join('\n' + offset);
  }
};

/**
 * @ngdoc service
 * @name $httpBackend
 * @description
 * Fake HTTP backend implementation suitable for unit testing applications that use the
 * {@link ng.$http $http service}.
 *
 * *Note*: For fake HTTP backend implementation suitable for end-to-end testing or backend-less
 * development please see {@link ngMockE2E.$httpBackend e2e $httpBackend mock}.
 *
 * During unit testing, we want our unit tests to run quickly and have no external dependencies so
 * we don’t want to send [XHR](https://developer.mozilla.org/en/xmlhttprequest) or
 * [JSONP](http://en.wikipedia.org/wiki/JSONP) requests to a real server. All we really need is
 * to verify whether a certain request has been sent or not, or alternatively just let the
 * application make requests, respond with pre-trained responses and assert that the end result is
 * what we expect it to be.
 *
 * This mock implementation can be used to respond with static or dynamic responses via the
 * `expect` and `when` apis and their shortcuts (`expectGET`, `whenPOST`, etc).
 *
 * When an Angular application needs some data from a server, it calls the $http service, which
 * sends the request to a real server using $httpBackend service. With dependency injection, it is
 * easy to inject $httpBackend mock (which has the same API as $httpBackend) and use it to verify
 * the requests and respond with some testing data without sending a request to a real server.
 *
 * There are two ways to specify what test data should be returned as http responses by the mock
 * backend when the code under test makes http requests:
 *
 * - `$httpBackend.expect` - specifies a request expectation
 * - `$httpBackend.when` - specifies a backend definition
 *
 *
 * # Request Expectations vs Backend Definitions
 *
 * Request expectations provide a way to make assertions about requests made by the application and
 * to define responses for those requests. The test will fail if the expected requests are not made
 * or they are made in the wrong order.
 *
 * Backend definitions allow you to define a fake backend for your application which doesn't assert
 * if a particular request was made or not, it just returns a trained response if a request is made.
 * The test will pass whether or not the request gets made during testing.
 *
 *
 * <table class="table">
 *   <tr><th width="220px"></th><th>Request expectations</th><th>Backend definitions</th></tr>
 *   <tr>
 *     <th>Syntax</th>
 *     <td>.expect(...).respond(...)</td>
 *     <td>.when(...).respond(...)</td>
 *   </tr>
 *   <tr>
 *     <th>Typical usage</th>
 *     <td>strict unit tests</td>
 *     <td>loose (black-box) unit testing</td>
 *   </tr>
 *   <tr>
 *     <th>Fulfills multiple requests</th>
 *     <td>NO</td>
 *     <td>YES</td>
 *   </tr>
 *   <tr>
 *     <th>Order of requests matters</th>
 *     <td>YES</td>
 *     <td>NO</td>
 *   </tr>
 *   <tr>
 *     <th>Request required</th>
 *     <td>YES</td>
 *     <td>NO</td>
 *   </tr>
 *   <tr>
 *     <th>Response required</th>
 *     <td>optional (see below)</td>
 *     <td>YES</td>
 *   </tr>
 * </table>
 *
 * In cases where both backend definitions and request expectations are specified during unit
 * testing, the request expectations are evaluated first.
 *
 * If a request expectation has no response specified, the algorithm will search your backend
 * definitions for an appropriate response.
 *
 * If a request didn't match any expectation or if the expectation doesn't have the response
 * defined, the backend definitions are evaluated in sequential order to see if any of them match
 * the request. The response from the first matched definition is returned.
 *
 *
 * # Flushing HTTP requests
 *
 * The $httpBackend used in production always responds to requests asynchronously. If we preserved
 * this behavior in unit testing, we'd have to create async unit tests, which are hard to write,
 * to follow and to maintain. But neither can the testing mock respond synchronously; that would
 * change the execution of the code under test. For this reason, the mock $httpBackend has a
 * `flush()` method, which allows the test to explicitly flush pending requests. This preserves
 * the async api of the backend, while allowing the test to execute synchronously.
 *
 *
 * # Unit testing with mock $httpBackend
 * The following code shows how to setup and use the mock backend when unit testing a controller.
 * First we create the controller under test:
 *
  ```js
  // The module code
  angular
    .module('MyApp', [])
    .controller('MyController', MyController);

  // The controller code
  function MyController($scope, $http) {
    var authToken;

    $http.get('/auth.py').success(function(data, status, headers) {
      authToken = headers('A-Token');
      $scope.user = data;
    });

    $scope.saveMessage = function(message) {
      var headers = { 'Authorization': authToken };
      $scope.status = 'Saving...';

      $http.post('/add-msg.py', message, { headers: headers } ).success(function(response) {
        $scope.status = '';
      }).error(function() {
        $scope.status = 'ERROR!';
      });
    };
  }
  ```
 *
 * Now we setup the mock backend and create the test specs:
 *
  ```js
    // testing controller
    describe('MyController', function() {
       var $httpBackend, $rootScope, createController, authRequestHandler;

       // Set up the module
       beforeEach(module('MyApp'));

       beforeEach(inject(function($injector) {
         // Set up the mock http service responses
         $httpBackend = $injector.get('$httpBackend');
         // backend definition common for all tests
         authRequestHandler = $httpBackend.when('GET', '/auth.py')
                                .respond({userId: 'userX'}, {'A-Token': 'xxx'});

         // Get hold of a scope (i.e. the root scope)
         $rootScope = $injector.get('$rootScope');
         // The $controller service is used to create instances of controllers
         var $controller = $injector.get('$controller');

         createController = function() {
           return $controller('MyController', {'$scope' : $rootScope });
         };
       }));


       afterEach(function() {
         $httpBackend.verifyNoOutstandingExpectation();
         $httpBackend.verifyNoOutstandingRequest();
       });


       it('should fetch authentication token', function() {
         $httpBackend.expectGET('/auth.py');
         var controller = createController();
         $httpBackend.flush();
       });


       it('should fail authentication', function() {

         // Notice how you can change the response even after it was set
         authRequestHandler.respond(401, '');

         $httpBackend.expectGET('/auth.py');
         var controller = createController();
         $httpBackend.flush();
         expect($rootScope.status).toBe('Failed...');
       });


       it('should send msg to server', function() {
         var controller = createController();
         $httpBackend.flush();

         // now you don’t care about the authentication, but
         // the controller will still send the request and
         // $httpBackend will respond without you having to
         // specify the expectation and response for this request

         $httpBackend.expectPOST('/add-msg.py', 'message content').respond(201, '');
         $rootScope.saveMessage('message content');
         expect($rootScope.status).toBe('Saving...');
         $httpBackend.flush();
         expect($rootScope.status).toBe('');
       });


       it('should send auth header', function() {
         var controller = createController();
         $httpBackend.flush();

         $httpBackend.expectPOST('/add-msg.py', undefined, function(headers) {
           // check if the header was sent, if it wasn't the expectation won't
           // match the request and the test will fail
           return headers['Authorization'] == 'xxx';
         }).respond(201, '');

         $rootScope.saveMessage('whatever');
         $httpBackend.flush();
       });
    });
   ```
 */
angular.mock.$HttpBackendProvider = function() {
  this.$get = ['$rootScope', '$timeout', createHttpBackendMock];
};

/**
 * General factory function for $httpBackend mock.
 * Returns instance for unit testing (when no arguments specified):
 *   - passing through is disabled
 *   - auto flushing is disabled
 *
 * Returns instance for e2e testing (when `$delegate` and `$browser` specified):
 *   - passing through (delegating request to real backend) is enabled
 *   - auto flushing is enabled
 *
 * @param {Object=} $delegate Real $httpBackend instance (allow passing through if specified)
 * @param {Object=} $browser Auto-flushing enabled if specified
 * @return {Object} Instance of $httpBackend mock
 */
function createHttpBackendMock($rootScope, $timeout, $delegate, $browser) {
  var definitions = [],
      expectations = [],
      responses = [],
      responsesPush = angular.bind(responses, responses.push),
      copy = angular.copy;

  function createResponse(status, data, headers, statusText) {
    if (angular.isFunction(status)) return status;

    return function() {
      return angular.isNumber(status)
          ? [status, data, headers, statusText]
          : [200, status, data, headers];
    };
  }

  // TODO(vojta): change params to: method, url, data, headers, callback
  function $httpBackend(method, url, data, callback, headers, timeout, withCredentials) {
    var xhr = new MockXhr(),
        expectation = expectations[0],
        wasExpected = false;

    function prettyPrint(data) {
      return (angular.isString(data) || angular.isFunction(data) || data instanceof RegExp)
          ? data
          : angular.toJson(data);
    }

    function wrapResponse(wrapped) {
      if (!$browser && timeout) {
        timeout.then ? timeout.then(handleTimeout) : $timeout(handleTimeout, timeout);
      }

      return handleResponse;

      function handleResponse() {
        var response = wrapped.response(method, url, data, headers);
        xhr.$$respHeaders = response[2];
        callback(copy(response[0]), copy(response[1]), xhr.getAllResponseHeaders(),
                 copy(response[3] || ''));
      }

      function handleTimeout() {
        for (var i = 0, ii = responses.length; i < ii; i++) {
          if (responses[i] === handleResponse) {
            responses.splice(i, 1);
            callback(-1, undefined, '');
            break;
          }
        }
      }
    }

    if (expectation && expectation.match(method, url)) {
      if (!expectation.matchData(data)) {
        throw new Error('Expected ' + expectation + ' with different data\n' +
            'EXPECTED: ' + prettyPrint(expectation.data) + '\nGOT:      ' + data);
      }

      if (!expectation.matchHeaders(headers)) {
        throw new Error('Expected ' + expectation + ' with different headers\n' +
                        'EXPECTED: ' + prettyPrint(expectation.headers) + '\nGOT:      ' +
                        prettyPrint(headers));
      }

      expectations.shift();

      if (expectation.response) {
        responses.push(wrapResponse(expectation));
        return;
      }
      wasExpected = true;
    }

    var i = -1, definition;
    while ((definition = definitions[++i])) {
      if (definition.match(method, url, data, headers || {})) {
        if (definition.response) {
          // if $browser specified, we do auto flush all requests
          ($browser ? $browser.defer : responsesPush)(wrapResponse(definition));
        } else if (definition.passThrough) {
          $delegate(method, url, data, callback, headers, timeout, withCredentials);
        } else throw new Error('No response defined !');
        return;
      }
    }
    throw wasExpected ?
        new Error('No response defined !') :
        new Error('Unexpected request: ' + method + ' ' + url + '\n' +
                  (expectation ? 'Expected ' + expectation : 'No more request expected'));
  }

  /**
   * @ngdoc method
   * @name $httpBackend#when
   * @description
   * Creates a new backend definition.
   *
   * @param {string} method HTTP method.
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
   *   object and returns true if the headers match the current definition.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   *
   *  - respond –
   *      `{function([status,] data[, headers, statusText])
   *      | function(function(method, url, data, headers)}`
   *    – The respond method takes a set of static data to be returned or a function that can
   *    return an array containing response status (number), response data (string), response
   *    headers (Object), and the text for the status (string). The respond method returns the
   *    `requestHandler` object for possible overrides.
   */
  $httpBackend.when = function(method, url, data, headers) {
    var definition = new MockHttpExpectation(method, url, data, headers),
        chain = {
          respond: function(status, data, headers, statusText) {
            definition.passThrough = undefined;
            definition.response = createResponse(status, data, headers, statusText);
            return chain;
          }
        };

    if ($browser) {
      chain.passThrough = function() {
        definition.response = undefined;
        definition.passThrough = true;
        return chain;
      };
    }

    definitions.push(definition);
    return chain;
  };

  /**
   * @ngdoc method
   * @name $httpBackend#whenGET
   * @description
   * Creates a new backend definition for GET requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenHEAD
   * @description
   * Creates a new backend definition for HEAD requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenDELETE
   * @description
   * Creates a new backend definition for DELETE requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenPOST
   * @description
   * Creates a new backend definition for POST requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenPUT
   * @description
   * Creates a new backend definition for PUT requests.  For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string))=} data HTTP request body or function that receives
   *   data string and returns true if the data is as expected.
   * @param {(Object|function(Object))=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#whenJSONP
   * @description
   * Creates a new backend definition for JSONP requests. For more info see `when()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled.
   */
  createShortMethods('when');


  /**
   * @ngdoc method
   * @name $httpBackend#expect
   * @description
   * Creates a new request expectation.
   *
   * @param {string} method HTTP method.
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
   *   object and returns true if the headers match the current expectation.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *  request is handled. You can save this object for later use and invoke `respond` again in
   *  order to change how a matched request is handled.
   *
   *  - respond –
   *    `{function([status,] data[, headers, statusText])
   *    | function(function(method, url, data, headers)}`
   *    – The respond method takes a set of static data to be returned or a function that can
   *    return an array containing response status (number), response data (string), response
   *    headers (Object), and the text for the status (string). The respond method returns the
   *    `requestHandler` object for possible overrides.
   */
  $httpBackend.expect = function(method, url, data, headers) {
    var expectation = new MockHttpExpectation(method, url, data, headers),
        chain = {
          respond: function(status, data, headers, statusText) {
            expectation.response = createResponse(status, data, headers, statusText);
            return chain;
          }
        };

    expectations.push(expectation);
    return chain;
  };


  /**
   * @ngdoc method
   * @name $httpBackend#expectGET
   * @description
   * Creates a new request expectation for GET requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   * request is handled. You can save this object for later use and invoke `respond` again in
   * order to change how a matched request is handled. See #expect for more info.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectHEAD
   * @description
   * Creates a new request expectation for HEAD requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectDELETE
   * @description
   * Creates a new request expectation for DELETE requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectPOST
   * @description
   * Creates a new request expectation for POST requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectPUT
   * @description
   * Creates a new request expectation for PUT requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectPATCH
   * @description
   * Creates a new request expectation for PATCH requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
   *   and returns true if the url matches the current definition.
   * @param {(string|RegExp|function(string)|Object)=} data HTTP request body or function that
   *  receives data string and returns true if the data is as expected, or Object if request body
   *  is in JSON format.
   * @param {Object=} headers HTTP headers.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */

  /**
   * @ngdoc method
   * @name $httpBackend#expectJSONP
   * @description
   * Creates a new request expectation for JSONP requests. For more info see `expect()`.
   *
   * @param {string|RegExp|function(string)} url HTTP url or function that receives an url
   *   and returns true if the url matches the current definition.
   * @returns {requestHandler} Returns an object with `respond` method that controls how a matched
   *   request is handled. You can save this object for later use and invoke `respond` again in
   *   order to change how a matched request is handled.
   */
  createShortMethods('expect');


  /**
   * @ngdoc method
   * @name $httpBackend#flush
   * @description
   * Flushes all pending requests using the trained responses.
   *
   * @param {number=} count Number of responses to flush (in the order they arrived). If undefined,
   *   all pending requests will be flushed. If there are no pending requests when the flush method
   *   is called an exception is thrown (as this typically a sign of programming error).
   */
  $httpBackend.flush = function(count, digest) {
    if (digest !== false) $rootScope.$digest();
    if (!responses.length) throw new Error('No pending request to flush !');

    if (angular.isDefined(count) && count !== null) {
      while (count--) {
        if (!responses.length) throw new Error('No more pending request to flush !');
        responses.shift()();
      }
    } else {
      while (responses.length) {
        responses.shift()();
      }
    }
    $httpBackend.verifyNoOutstandingExpectation(digest);
  };


  /**
   * @ngdoc method
   * @name $httpBackend#verifyNoOutstandingExpectation
   * @description
   * Verifies that all of the requests defined via the `expect` api were made. If any of the
   * requests were not made, verifyNoOutstandingExpectation throws an exception.
   *
   * Typically, you would call this method following each test case that asserts requests using an
   * "afterEach" clause.
   *
   * ```js
   *   afterEach($httpBackend.verifyNoOutstandingExpectation);
   * ```
   */
  $httpBackend.verifyNoOutstandingExpectation = function(digest) {
    if (digest !== false) $rootScope.$digest();
    if (expectations.length) {
      throw new Error('Unsatisfied requests: ' + expectations.join(', '));
    }
  };


  /**
   * @ngdoc method
   * @name $httpBackend#verifyNoOutstandingRequest
   * @description
   * Verifies that there are no outstanding requests that need to be flushed.
   *
   * Typically, you would call this method following each test case that asserts requests using an
   * "afterEach" clause.
   *
   * ```js
   *   afterEach($httpBackend.verifyNoOutstandingRequest);
   * ```
   */
  $httpBackend.verifyNoOutstandingRequest = function() {
    if (responses.length) {
      throw new Error('Unflushed requests: ' + responses.length);
    }
  };


  /**
   * @ngdoc method
   * @name $httpBackend#resetExpectations
   * @description
   * Resets all request expectations, but preserves all backend definitions. Typically, you would
   * call resetExpectations during a multiple-phase test when you want to reuse the same instance of
   * $httpBackend mock.
   */
  $httpBackend.resetExpectations = function() {
    expectations.length = 0;
    responses.length = 0;
  };

  return $httpBackend;


  function createShortMethods(prefix) {
    angular.forEach(['GET', 'DELETE', 'JSONP', 'HEAD'], function(method) {
     $httpBackend[prefix + method] = function(url, headers) {
       return $httpBackend[prefix](method, url, undefined, headers);
     };
    });

    angular.forEach(['PUT', 'POST', 'PATCH'], function(method) {
      $httpBackend[prefix + method] = function(url, data, headers) {
        return $httpBackend[prefix](method, url, data, headers);
      };
    });
  }
}

function MockHttpExpectation(method, url, data, headers) {

  this.data = data;
  this.headers = headers;

  this.match = function(m, u, d, h) {
    if (method != m) return false;
    if (!this.matchUrl(u)) return false;
    if (angular.isDefined(d) && !this.matchData(d)) return false;
    if (angular.isDefined(h) && !this.matchHeaders(h)) return false;
    return true;
  };

  this.matchUrl = function(u) {
    if (!url) return true;
    if (angular.isFunction(url.test)) return url.test(u);
    if (angular.isFunction(url)) return url(u);
    return url == u;
  };

  this.matchHeaders = function(h) {
    if (angular.isUndefined(headers)) return true;
    if (angular.isFunction(headers)) return headers(h);
    return angular.equals(headers, h);
  };

  this.matchData = function(d) {
    if (angular.isUndefined(data)) return true;
    if (data && angular.isFunction(data.test)) return data.test(d);
    if (data && angular.isFunction(data)) return data(d);
    if (data && !angular.isString(data)) {
      return angular.equals(angular.fromJson(angular.toJson(data)), angular.fromJson(d));
    }
    return data == d;
  };

  this.toString = function() {
    return method + ' ' + url;
  };
}

function createMockXhr() {
  return new MockXhr();
}

function MockXhr() {

  // hack for testing $http, $httpBackend
  MockXhr.$$lastInstance = this;

  this.open = function(method, url, async) {
    this.$$method = method;
    this.$$url = url;
    this.$$async = async;
    this.$$reqHeaders = {};
    this.$$respHeaders = {};
  };

  this.send = function(data) {
    this.$$data = data;
  };

  this.setRequestHeader = function(key, value) {
    this.$$reqHeaders[key] = value;
  };

  this.getResponseHeader = function(name) {
    // the lookup must be case insensitive,
    // that's why we try two quick lookups first and full scan last
    var header = this.$$respHeaders[name];
    if (header) return header;

    name = angular.lowercase(name);
    header = this.$$respHeaders[name];
    if (header) return header;

    header = undefined;
    angular.forEach(this.$$respHeaders, function(headerVal, headerName) {
      if (!header && angular.lowercase(headerName) == name) header = headerVal;
    });
    return header;
  };

  this.getAllResponseHeaders = function() {
    var lines = [];

    angular.forEach(this.$$respHeaders, function(value, key) {
      lines.push(key + ': ' + value);
    });
    return lines.join('\n');
  };

  this.abort = angular.noop;
}


/**
 * @ngdoc service
 * @name $timeout
 * @description
 *
 * This service is just a simple decorator for {@link ng.$timeout $timeout} service
 * that adds a "flush" and "verifyNoPendingTasks" methods.
 */

angular.mock.$TimeoutDecorator = ['$delegate', '$browser', function($delegate, $browser) {

  /**
   * @ngdoc method
   * @name $timeout#flush
   * @description
   *
   * Flushes the queue of pending tasks.
   *
   * @param {number=} delay maximum timeout amount to flush up until
   */
  $delegate.flush = function(delay) {
    $browser.defer.flush(delay);
  };

  /**
   * @ngdoc method
   * @name $timeout#verifyNoPendingTasks
   * @description
   *
   * Verifies that there are no pending tasks that need to be flushed.
   */
  $delegate.verifyNoPendingTasks = function() {
    if ($browser.deferredFns.length) {
      throw new Error('Deferred tasks to flush (' + $browser.deferredFns.length + '): ' +
          formatPendingTasksAsString($browser.deferredFns));
    }
  };

  function formatPendingTasksAsString(tasks) {
    var result = [];
    angular.forEach(tasks, function(task) {
      result.push('{id: ' + task.id + ', ' + 'time: ' + task.time + '}');
    });

    return result.join(', ');
  }

  return $delegate;
}];

angular.mock.$RAFDecorator = ['$delegate', function($delegate) {
  var rafFn = function(fn) {
    var index = rafFn.queue.length;
    rafFn.queue.push(fn);
    return function() {
      rafFn.queue.splice(index, 1);
    };
  };

  rafFn.queue = [];
  rafFn.supported = $delegate.supported;

  rafFn.flush = function() {
    if (rafFn.queue.length === 0) {
      throw new Error('No rAF callbacks present');
    }

    var length = rafFn.queue.length;
    for (var i = 0; i < length; i++) {
      rafFn.queue[i]();
    }

    rafFn.queue = rafFn.queue.slice(i);
  };

  return rafFn;
}];

/**
 *
 */
angular.mock.$RootElementProvider = function() {
  this.$get = function() {
    return angular.element('<div ng-app></div>');
  };
};

/**
 * @ngdoc service
 * @name $controller
 * @description
 * A decorator for {@link ng.$controller} with additional `bindings` parameter, useful when testing
 * controllers of directives that use {@link $compile#-bindtocontroller- `bindToController`}.
 *
 *
 * ## Example
 *
 * ```js
 *
 * // Directive definition ...
 *
 * myMod.directive('myDirective', {
 *   controller: 'MyDirectiveController',
 *   bindToController: {
 *     name: '@'
 *   }
 * });
 *
 *
 * // Controller definition ...
 *
 * myMod.controller('MyDirectiveController', ['log', function($log) {
 *   $log.info(this.name);
 * })];
 *
 *
 * // In a test ...
 *
 * describe('myDirectiveController', function() {
 *   it('should write the bound name to the log', inject(function($controller, $log) {
 *     var ctrl = $controller('MyDirectiveController', { /* no locals &#42;/ }, { name: 'Clark Kent' });
 *     expect(ctrl.name).toEqual('Clark Kent');
 *     expect($log.info.logs).toEqual(['Clark Kent']);
 *   });
 * });
 *
 * ```
 *
 * @param {Function|string} constructor If called with a function then it's considered to be the
 *    controller constructor function. Otherwise it's considered to be a string which is used
 *    to retrieve the controller constructor using the following steps:
 *
 *    * check if a controller with given name is registered via `$controllerProvider`
 *    * check if evaluating the string on the current scope returns a constructor
 *    * if $controllerProvider#allowGlobals, check `window[constructor]` on the global
 *      `window` object (not recommended)
 *
 *    The string can use the `controller as property` syntax, where the controller instance is published
 *    as the specified property on the `scope`; the `scope` must be injected into `locals` param for this
 *    to work correctly.
 *
 * @param {Object} locals Injection locals for Controller.
 * @param {Object=} bindings Properties to add to the controller before invoking the constructor. This is used
 *                           to simulate the `bindToController` feature and simplify certain kinds of tests.
 * @return {Object} Instance of given controller.
 */
angular.mock.$ControllerDecorator = ['$delegate', function($delegate) {
  return function(expression, locals, later, ident) {
    if (later && typeof later === 'object') {
      var create = $delegate(expression, locals, true, ident);
      angular.extend(create.instance, later);
      return create();
    }
    return $delegate(expression, locals, later, ident);
  };
}];


/**
 * @ngdoc module
 * @name ngMock
 * @packageName angular-mocks
 * @description
 *
 * # ngMock
 *
 * The `ngMock` module provides support to inject and mock Angular services into unit tests.
 * In addition, ngMock also extends various core ng services such that they can be
 * inspected and controlled in a synchronous manner within test code.
 *
 *
 * <div doc-module-components="ngMock"></div>
 *
 */
angular.module('ngMock', ['ng']).provider({
  $browser: angular.mock.$BrowserProvider,
  $exceptionHandler: angular.mock.$ExceptionHandlerProvider,
  $log: angular.mock.$LogProvider,
  $interval: angular.mock.$IntervalProvider,
  $httpBackend: angular.mock.$HttpBackendProvider,
  $rootElement: angular.mock.$RootElementProvider
}).config(['$provide', function($provide) {
  $provide.decorator('$timeout', angular.mock.$TimeoutDecorator);
  $provide.decorator('$$rAF', angular.mock.$RAFDecorator);
  $provide.decorator('$rootScope', angular.mock.$RootScopeDecorator);
  $provide.decorator('$controller', angular.mock.$ControllerDecorator);
}]);

/**
 * @ngdoc module
 * @name ngMockE2E
 * @module ngMockE2E
 * @packageName angular-mocks
 * @description
 *
 * The `ngMockE2E` is an angular module which contains mocks suitable for end-to-end testing.
 * Currently there is only one mock present in this module -
 * the {@link ngMockE2E.$httpBackend e2e $httpBackend} mock.
 */
angular.module('ngMockE2E', ['ng']).config(['$provide', function($provide) {
  $provide.decorator('$httpBackend', angular.mock.e2e.$httpBackendDecorator);
}]);

/**
 * @ngdoc service
 * @name $httpBackend
 * @module ngMockE2E
 * @description
 * Fake HTTP backend implementation suitable for end-to-end testing or backend-less development of
 * applications that use the {@link ng.$http $http service}.
 *
 * *Note*: For fake http backend implementation suitable for unit testing please see
 * {@link ngMock.$httpBackend unit-testing $httpBackend mock}.
 *
 * This implementation can be used to respond with static or dynamic responses via the `when` api
 * and its shortcuts (`whenGET`, `whenPOST`, etc) and optionally pass through requests to the
 * real $httpBackend for specific requests (e.g. to interact with certain remote apis or to fetch
 * templates from a webserver).
 *
 * As opposed to unit-testing, in an end-to-end testing scenario or in scenario when an application
 * is being developed with the real backend api replaced with a mock, it is often desirable for
 * certain category of requests to bypass the mock and issue a real http request (e.g. to fetch
 * templates or static files from the webserver). To configure the backend with this behavior
 * use the `passThrough` request handler of `when` instead of `respond`.
 *
 * Additionally, we don't want to manually have to flush mocked out requests like we do during unit
 * testing. For this reason the e2e $httpBackend flushes mocked out requests
 * automatically, closely simulating the behavior of the XMLHttpRequest object.
 *
 * To setup the application to run with this http backend, you have to create a module that depends
 * on the `ngMockE2E` and your application modules and defines the fake backend:
 *
 * ```js
 *   myAppDev = angular.module('myAppDev', ['myApp', 'ngMockE2E']);
 *   myAppDev.run(function($httpBackend) {
 *     phones = [{name: 'phone1'}, {name: 'phone2'}];
 *
 *     // returns the current list of phones
 *     $httpBackend.whenGET('/phones').respond(phones);
 *
 *     // adds a new phone to the phones array
 *     $httpBackend.whenPOST('/phones').respond(function(method, url, data) {
 *       var phone = angular.fromJson(data);
 *       phones.push(phone);
 *       return [200, phone, {}];
 *     });
 *     $httpBackend.whenGET(/^\/templates\//).passThrough();
 *     //...
 *   });
 * ```
 *
 * Afterwards, bootstrap your app with this new module.
 */

/**
 * @ngdoc method
 * @name $httpBackend#when
 * @module ngMockE2E
 * @description
 * Creates a new backend definition.
 *
 * @param {string} method HTTP method.
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers or function that receives http header
 *   object and returns true if the headers match the current definition.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 *
 *  - respond –
 *    `{function([status,] data[, headers, statusText])
 *    | function(function(method, url, data, headers)}`
 *    – The respond method takes a set of static data to be returned or a function that can return
 *    an array containing response status (number), response data (string), response headers
 *    (Object), and the text for the status (string).
 *  - passThrough – `{function()}` – Any request matching a backend definition with
 *    `passThrough` handler will be passed through to the real backend (an XHR request will be made
 *    to the server.)
 *  - Both methods return the `requestHandler` object for possible overrides.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenGET
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for GET requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenHEAD
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for HEAD requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenDELETE
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for DELETE requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenPOST
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for POST requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenPUT
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for PUT requests.  For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenPATCH
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for PATCH requests.  For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @param {(string|RegExp)=} data HTTP request body.
 * @param {(Object|function(Object))=} headers HTTP headers.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */

/**
 * @ngdoc method
 * @name $httpBackend#whenJSONP
 * @module ngMockE2E
 * @description
 * Creates a new backend definition for JSONP requests. For more info see `when()`.
 *
 * @param {string|RegExp|function(string)} url HTTP url or function that receives a url
 *   and returns true if the url matches the current definition.
 * @returns {requestHandler} Returns an object with `respond` and `passThrough` methods that
 *   control how a matched request is handled. You can save this object for later use and invoke
 *   `respond` or `passThrough` again in order to change how a matched request is handled.
 */
angular.mock.e2e = {};
angular.mock.e2e.$httpBackendDecorator =
  ['$rootScope', '$timeout', '$delegate', '$browser', createHttpBackendMock];


/**
 * @ngdoc type
 * @name $rootScope.Scope
 * @module ngMock
 * @description
 * {@link ng.$rootScope.Scope Scope} type decorated with helper methods useful for testing. These
 * methods are automatically available on any {@link ng.$rootScope.Scope Scope} instance when
 * `ngMock` module is loaded.
 *
 * In addition to all the regular `Scope` methods, the following helper methods are available:
 */
angular.mock.$RootScopeDecorator = ['$delegate', function($delegate) {

  var $rootScopePrototype = Object.getPrototypeOf($delegate);

  $rootScopePrototype.$countChildScopes = countChildScopes;
  $rootScopePrototype.$countWatchers = countWatchers;

  return $delegate;

  // ------------------------------------------------------------------------------------------ //

  /**
   * @ngdoc method
   * @name $rootScope.Scope#$countChildScopes
   * @module ngMock
   * @description
   * Counts all the direct and indirect child scopes of the current scope.
   *
   * The current scope is excluded from the count. The count includes all isolate child scopes.
   *
   * @returns {number} Total number of child scopes.
   */
  function countChildScopes() {
    // jshint validthis: true
    var count = 0; // exclude the current scope
    var pendingChildHeads = [this.$$childHead];
    var currentScope;

    while (pendingChildHeads.length) {
      currentScope = pendingChildHeads.shift();

      while (currentScope) {
        count += 1;
        pendingChildHeads.push(currentScope.$$childHead);
        currentScope = currentScope.$$nextSibling;
      }
    }

    return count;
  }


  /**
   * @ngdoc method
   * @name $rootScope.Scope#$countWatchers
   * @module ngMock
   * @description
   * Counts all the watchers of direct and indirect child scopes of the current scope.
   *
   * The watchers of the current scope are included in the count and so are all the watchers of
   * isolate child scopes.
   *
   * @returns {number} Total number of watchers.
   */
  function countWatchers() {
    // jshint validthis: true
    var count = this.$$watchers ? this.$$watchers.length : 0; // include the current scope
    var pendingChildHeads = [this.$$childHead];
    var currentScope;

    while (pendingChildHeads.length) {
      currentScope = pendingChildHeads.shift();

      while (currentScope) {
        count += currentScope.$$watchers ? currentScope.$$watchers.length : 0;
        pendingChildHeads.push(currentScope.$$childHead);
        currentScope = currentScope.$$nextSibling;
      }
    }

    return count;
  }
}];


if (window.jasmine || window.mocha) {

  var currentSpec = null,
      annotatedFunctions = [],
      isSpecRunning = function() {
        return !!currentSpec;
      };

  angular.mock.$$annotate = angular.injector.$$annotate;
  angular.injector.$$annotate = function(fn) {
    if (typeof fn === 'function' && !fn.$inject) {
      annotatedFunctions.push(fn);
    }
    return angular.mock.$$annotate.apply(this, arguments);
  };


  (window.beforeEach || window.setup)(function() {
    annotatedFunctions = [];
    currentSpec = this;
  });

  (window.afterEach || window.teardown)(function() {
    var injector = currentSpec.$injector;

    annotatedFunctions.forEach(function(fn) {
      delete fn.$inject;
    });

    angular.forEach(currentSpec.$modules, function(module) {
      if (module && module.$$hashKey) {
        module.$$hashKey = undefined;
      }
    });

    currentSpec.$injector = null;
    currentSpec.$modules = null;
    currentSpec = null;

    if (injector) {
      injector.get('$rootElement').off();
    }

    // clean up jquery's fragment cache
    angular.forEach(angular.element.fragments, function(val, key) {
      delete angular.element.fragments[key];
    });

    MockXhr.$$lastInstance = null;

    angular.forEach(angular.callbacks, function(val, key) {
      delete angular.callbacks[key];
    });
    angular.callbacks.counter = 0;
  });

  /**
   * @ngdoc function
   * @name angular.mock.module
   * @description
   *
   * *NOTE*: This function is also published on window for easy access.<br>
   * *NOTE*: This function is declared ONLY WHEN running tests with jasmine or mocha
   *
   * This function registers a module configuration code. It collects the configuration information
   * which will be used when the injector is created by {@link angular.mock.inject inject}.
   *
   * See {@link angular.mock.inject inject} for usage example
   *
   * @param {...(string|Function|Object)} fns any number of modules which are represented as string
   *        aliases or as anonymous module initialization functions. The modules are used to
   *        configure the injector. The 'ng' and 'ngMock' modules are automatically loaded. If an
   *        object literal is passed they will be registered as values in the module, the key being
   *        the module name and the value being what is returned.
   */
  window.module = angular.mock.module = function() {
    var moduleFns = Array.prototype.slice.call(arguments, 0);
    return isSpecRunning() ? workFn() : workFn;
    /////////////////////
    function workFn() {
      if (currentSpec.$injector) {
        throw new Error('Injector already created, can not register a module!');
      } else {
        var modules = currentSpec.$modules || (currentSpec.$modules = []);
        angular.forEach(moduleFns, function(module) {
          if (angular.isObject(module) && !angular.isArray(module)) {
            modules.push(function($provide) {
              angular.forEach(module, function(value, key) {
                $provide.value(key, value);
              });
            });
          } else {
            modules.push(module);
          }
        });
      }
    }
  };

  /**
   * @ngdoc function
   * @name angular.mock.inject
   * @description
   *
   * *NOTE*: This function is also published on window for easy access.<br>
   * *NOTE*: This function is declared ONLY WHEN running tests with jasmine or mocha
   *
   * The inject function wraps a function into an injectable function. The inject() creates new
   * instance of {@link auto.$injector $injector} per test, which is then used for
   * resolving references.
   *
   *
   * ## Resolving References (Underscore Wrapping)
   * Often, we would like to inject a reference once, in a `beforeEach()` block and reuse this
   * in multiple `it()` clauses. To be able to do this we must assign the reference to a variable
   * that is declared in the scope of the `describe()` block. Since we would, most likely, want
   * the variable to have the same name of the reference we have a problem, since the parameter
   * to the `inject()` function would hide the outer variable.
   *
   * To help with this, the injected parameters can, optionally, be enclosed with underscores.
   * These are ignored by the injector when the reference name is resolved.
   *
   * For example, the parameter `_myService_` would be resolved as the reference `myService`.
   * Since it is available in the function body as _myService_, we can then assign it to a variable
   * defined in an outer scope.
   *
   * ```
   * // Defined out reference variable outside
   * var myService;
   *
   * // Wrap the parameter in underscores
   * beforeEach( inject( function(_myService_){
   *   myService = _myService_;
   * }));
   *
   * // Use myService in a series of tests.
   * it('makes use of myService', function() {
   *   myService.doStuff();
   * });
   *
   * ```
   *
   * See also {@link angular.mock.module angular.mock.module}
   *
   * ## Example
   * Example of what a typical jasmine tests looks like with the inject method.
   * ```js
   *
   *   angular.module('myApplicationModule', [])
   *       .value('mode', 'app')
   *       .value('version', 'v1.0.1');
   *
   *
   *   describe('MyApp', function() {
   *
   *     // You need to load modules that you want to test,
   *     // it loads only the "ng" module by default.
   *     beforeEach(module('myApplicationModule'));
   *
   *
   *     // inject() is used to inject arguments of all given functions
   *     it('should provide a version', inject(function(mode, version) {
   *       expect(version).toEqual('v1.0.1');
   *       expect(mode).toEqual('app');
   *     }));
   *
   *
   *     // The inject and module method can also be used inside of the it or beforeEach
   *     it('should override a version and test the new version is injected', function() {
   *       // module() takes functions or strings (module aliases)
   *       module(function($provide) {
   *         $provide.value('version', 'overridden'); // override version here
   *       });
   *
   *       inject(function(version) {
   *         expect(version).toEqual('overridden');
   *       });
   *     });
   *   });
   *
   * ```
   *
   * @param {...Function} fns any number of functions which will be injected using the injector.
   */



  var ErrorAddingDeclarationLocationStack = function(e, errorForStack) {
    this.message = e.message;
    this.name = e.name;
    if (e.line) this.line = e.line;
    if (e.sourceId) this.sourceId = e.sourceId;
    if (e.stack && errorForStack)
      this.stack = e.stack + '\n' + errorForStack.stack;
    if (e.stackArray) this.stackArray = e.stackArray;
  };
  ErrorAddingDeclarationLocationStack.prototype.toString = Error.prototype.toString;

  window.inject = angular.mock.inject = function() {
    var blockFns = Array.prototype.slice.call(arguments, 0);
    var errorForStack = new Error('Declaration Location');
    return isSpecRunning() ? workFn.call(currentSpec) : workFn;
    /////////////////////
    function workFn() {
      var modules = currentSpec.$modules || [];
      var strictDi = !!currentSpec.$injectorStrict;
      modules.unshift('ngMock');
      modules.unshift('ng');
      var injector = currentSpec.$injector;
      if (!injector) {
        if (strictDi) {
          // If strictDi is enabled, annotate the providerInjector blocks
          angular.forEach(modules, function(moduleFn) {
            if (typeof moduleFn === "function") {
              angular.injector.$$annotate(moduleFn);
            }
          });
        }
        injector = currentSpec.$injector = angular.injector(modules, strictDi);
        currentSpec.$injectorStrict = strictDi;
      }
      for (var i = 0, ii = blockFns.length; i < ii; i++) {
        if (currentSpec.$injectorStrict) {
          // If the injector is strict / strictDi, and the spec wants to inject using automatic
          // annotation, then annotate the function here.
          injector.annotate(blockFns[i]);
        }
        try {
          /* jshint -W040 *//* Jasmine explicitly provides a `this` object when calling functions */
          injector.invoke(blockFns[i] || angular.noop, this);
          /* jshint +W040 */
        } catch (e) {
          if (e.stack && errorForStack) {
            throw new ErrorAddingDeclarationLocationStack(e, errorForStack);
          }
          throw e;
        } finally {
          errorForStack = null;
        }
      }
    }
  };


  angular.mock.inject.strictDi = function(value) {
    value = arguments.length ? !!value : true;
    return isSpecRunning() ? workFn() : workFn;

    function workFn() {
      if (value !== currentSpec.$injectorStrict) {
        if (currentSpec.$injector) {
          throw new Error('Injector already created, can not modify strict annotations');
        } else {
          currentSpec.$injectorStrict = value;
        }
      }
    }
  };
}


})(window, window.angular);

},{}],2:[function(require,module,exports){
/**
 * Created by shian_mac on 9/13/15.
 */

'use strict';

require('angular-mocks');
//require( 'angular' );

//import angular from 'angular';

describe('version', function () {
    //beforeEach(angular.module('myApp.services'));

    beforeEach(angular.mock.module('myApp.services'));

    it('should return current version', function (version) {
        expect(version).toEqual('0.1');
    });
});

},{"angular-mocks":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYW5ndWxhci1tb2Nrcy9hbmd1bGFyLW1vY2tzLmpzIiwiL1VzZXJzL3NoaWFuX21hYy9zaGlhbi1wcm9qZWN0L1VzZXJNYW5hZ2VtZW50TWF2ZW4vc3JjL3Rlc3QvamF2YXNjcmlwdC9zcGVjL3ZlcnNpb25TcGVjLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7Ozs7Ozs7QUN0NUVBLE9BQU8sQ0FBRSxlQUFlLENBQUUsQ0FBQzs7Ozs7QUFLM0IsUUFBUSxDQUFDLFNBQVMsRUFBRSxZQUFXOzs7QUFHM0IsY0FBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQzs7QUFFbEQsTUFBRSxDQUFDLCtCQUErQixFQUFFLFVBQVMsT0FBTyxFQUFFO0FBQ2xELGNBQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbEMsQ0FBQyxDQUFDO0NBQ04sQ0FBQyxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qKlxuICogQGxpY2Vuc2UgQW5ndWxhckpTIHYxLjQuNVxuICogKGMpIDIwMTAtMjAxNSBHb29nbGUsIEluYy4gaHR0cDovL2FuZ3VsYXJqcy5vcmdcbiAqIExpY2Vuc2U6IE1JVFxuICovXG4oZnVuY3Rpb24od2luZG93LCBhbmd1bGFyLCB1bmRlZmluZWQpIHtcblxuJ3VzZSBzdHJpY3QnO1xuXG4vKipcbiAqIEBuZ2RvYyBvYmplY3RcbiAqIEBuYW1lIGFuZ3VsYXIubW9ja1xuICogQGRlc2NyaXB0aW9uXG4gKlxuICogTmFtZXNwYWNlIGZyb20gJ2FuZ3VsYXItbW9ja3MuanMnIHdoaWNoIGNvbnRhaW5zIHRlc3RpbmcgcmVsYXRlZCBjb2RlLlxuICovXG5hbmd1bGFyLm1vY2sgPSB7fTtcblxuLyoqXG4gKiAhIFRoaXMgaXMgYSBwcml2YXRlIHVuZG9jdW1lbnRlZCBzZXJ2aWNlICFcbiAqXG4gKiBAbmFtZSAkYnJvd3NlclxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogVGhpcyBzZXJ2aWNlIGlzIGEgbW9jayBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgbmcuJGJyb3dzZXJ9LiBJdCBwcm92aWRlcyBmYWtlXG4gKiBpbXBsZW1lbnRhdGlvbiBmb3IgY29tbW9ubHkgdXNlZCBicm93c2VyIGFwaXMgdGhhdCBhcmUgaGFyZCB0byB0ZXN0LCBlLmcuIHNldFRpbWVvdXQsIHhocixcbiAqIGNvb2tpZXMsIGV0Yy4uLlxuICpcbiAqIFRoZSBhcGkgb2YgdGhpcyBzZXJ2aWNlIGlzIHRoZSBzYW1lIGFzIHRoYXQgb2YgdGhlIHJlYWwge0BsaW5rIG5nLiRicm93c2VyICRicm93c2VyfSwgZXhjZXB0XG4gKiB0aGF0IHRoZXJlIGFyZSBzZXZlcmFsIGhlbHBlciBtZXRob2RzIGF2YWlsYWJsZSB3aGljaCBjYW4gYmUgdXNlZCBpbiB0ZXN0cy5cbiAqL1xuYW5ndWxhci5tb2NrLiRCcm93c2VyUHJvdmlkZXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy4kZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBhbmd1bGFyLm1vY2suJEJyb3dzZXIoKTtcbiAgfTtcbn07XG5cbmFuZ3VsYXIubW9jay4kQnJvd3NlciA9IGZ1bmN0aW9uKCkge1xuICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgdGhpcy5pc01vY2sgPSB0cnVlO1xuICBzZWxmLiQkdXJsID0gXCJodHRwOi8vc2VydmVyL1wiO1xuICBzZWxmLiQkbGFzdFVybCA9IHNlbGYuJCR1cmw7IC8vIHVzZWQgYnkgdXJsIHBvbGxpbmcgZm5cbiAgc2VsZi5wb2xsRm5zID0gW107XG5cbiAgLy8gVE9ETyh2b2p0YSk6IHJlbW92ZSB0aGlzIHRlbXBvcmFyeSBhcGlcbiAgc2VsZi4kJGNvbXBsZXRlT3V0c3RhbmRpbmdSZXF1ZXN0ID0gYW5ndWxhci5ub29wO1xuICBzZWxmLiQkaW5jT3V0c3RhbmRpbmdSZXF1ZXN0Q291bnQgPSBhbmd1bGFyLm5vb3A7XG5cblxuICAvLyByZWdpc3RlciB1cmwgcG9sbGluZyBmblxuXG4gIHNlbGYub25VcmxDaGFuZ2UgPSBmdW5jdGlvbihsaXN0ZW5lcikge1xuICAgIHNlbGYucG9sbEZucy5wdXNoKFxuICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzZWxmLiQkbGFzdFVybCAhPT0gc2VsZi4kJHVybCB8fCBzZWxmLiQkc3RhdGUgIT09IHNlbGYuJCRsYXN0U3RhdGUpIHtcbiAgICAgICAgICBzZWxmLiQkbGFzdFVybCA9IHNlbGYuJCR1cmw7XG4gICAgICAgICAgc2VsZi4kJGxhc3RTdGF0ZSA9IHNlbGYuJCRzdGF0ZTtcbiAgICAgICAgICBsaXN0ZW5lcihzZWxmLiQkdXJsLCBzZWxmLiQkc3RhdGUpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgKTtcblxuICAgIHJldHVybiBsaXN0ZW5lcjtcbiAgfTtcblxuICBzZWxmLiQkYXBwbGljYXRpb25EZXN0cm95ZWQgPSBhbmd1bGFyLm5vb3A7XG4gIHNlbGYuJCRjaGVja1VybENoYW5nZSA9IGFuZ3VsYXIubm9vcDtcblxuICBzZWxmLmRlZmVycmVkRm5zID0gW107XG4gIHNlbGYuZGVmZXJyZWROZXh0SWQgPSAwO1xuXG4gIHNlbGYuZGVmZXIgPSBmdW5jdGlvbihmbiwgZGVsYXkpIHtcbiAgICBkZWxheSA9IGRlbGF5IHx8IDA7XG4gICAgc2VsZi5kZWZlcnJlZEZucy5wdXNoKHt0aW1lOihzZWxmLmRlZmVyLm5vdyArIGRlbGF5KSwgZm46Zm4sIGlkOiBzZWxmLmRlZmVycmVkTmV4dElkfSk7XG4gICAgc2VsZi5kZWZlcnJlZEZucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEudGltZSAtIGIudGltZTt9KTtcbiAgICByZXR1cm4gc2VsZi5kZWZlcnJlZE5leHRJZCsrO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEBuYW1lICRicm93c2VyI2RlZmVyLm5vd1xuICAgKlxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ3VycmVudCBtaWxsaXNlY29uZHMgbW9jayB0aW1lLlxuICAgKi9cbiAgc2VsZi5kZWZlci5ub3cgPSAwO1xuXG5cbiAgc2VsZi5kZWZlci5jYW5jZWwgPSBmdW5jdGlvbihkZWZlcklkKSB7XG4gICAgdmFyIGZuSW5kZXg7XG5cbiAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5kZWZlcnJlZEZucywgZnVuY3Rpb24oZm4sIGluZGV4KSB7XG4gICAgICBpZiAoZm4uaWQgPT09IGRlZmVySWQpIGZuSW5kZXggPSBpbmRleDtcbiAgICB9KTtcblxuICAgIGlmIChmbkluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHNlbGYuZGVmZXJyZWRGbnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9O1xuXG5cbiAgLyoqXG4gICAqIEBuYW1lICRicm93c2VyI2RlZmVyLmZsdXNoXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBGbHVzaGVzIGFsbCBwZW5kaW5nIHJlcXVlc3RzIGFuZCBleGVjdXRlcyB0aGUgZGVmZXIgY2FsbGJhY2tzLlxuICAgKlxuICAgKiBAcGFyYW0ge251bWJlcj19IG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gZmx1c2guIFNlZSB7QGxpbmsgI2RlZmVyLm5vd31cbiAgICovXG4gIHNlbGYuZGVmZXIuZmx1c2ggPSBmdW5jdGlvbihkZWxheSkge1xuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChkZWxheSkpIHtcbiAgICAgIHNlbGYuZGVmZXIubm93ICs9IGRlbGF5O1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc2VsZi5kZWZlcnJlZEZucy5sZW5ndGgpIHtcbiAgICAgICAgc2VsZi5kZWZlci5ub3cgPSBzZWxmLmRlZmVycmVkRm5zW3NlbGYuZGVmZXJyZWRGbnMubGVuZ3RoIC0gMV0udGltZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignTm8gZGVmZXJyZWQgdGFza3MgdG8gYmUgZmx1c2hlZCcpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHdoaWxlIChzZWxmLmRlZmVycmVkRm5zLmxlbmd0aCAmJiBzZWxmLmRlZmVycmVkRm5zWzBdLnRpbWUgPD0gc2VsZi5kZWZlci5ub3cpIHtcbiAgICAgIHNlbGYuZGVmZXJyZWRGbnMuc2hpZnQoKS5mbigpO1xuICAgIH1cbiAgfTtcblxuICBzZWxmLiQkYmFzZUhyZWYgPSAnLyc7XG4gIHNlbGYuYmFzZUhyZWYgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kJGJhc2VIcmVmO1xuICB9O1xufTtcbmFuZ3VsYXIubW9jay4kQnJvd3Nlci5wcm90b3R5cGUgPSB7XG5cbi8qKlxuICAqIEBuYW1lICRicm93c2VyI3BvbGxcbiAgKlxuICAqIEBkZXNjcmlwdGlvblxuICAqIHJ1biBhbGwgZm5zIGluIHBvbGxGbnNcbiAgKi9cbiAgcG9sbDogZnVuY3Rpb24gcG9sbCgpIHtcbiAgICBhbmd1bGFyLmZvckVhY2godGhpcy5wb2xsRm5zLCBmdW5jdGlvbihwb2xsRm4pIHtcbiAgICAgIHBvbGxGbigpO1xuICAgIH0pO1xuICB9LFxuXG4gIHVybDogZnVuY3Rpb24odXJsLCByZXBsYWNlLCBzdGF0ZSkge1xuICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKHN0YXRlKSkge1xuICAgICAgc3RhdGUgPSBudWxsO1xuICAgIH1cbiAgICBpZiAodXJsKSB7XG4gICAgICB0aGlzLiQkdXJsID0gdXJsO1xuICAgICAgLy8gTmF0aXZlIHB1c2hTdGF0ZSBzZXJpYWxpemVzICYgY29waWVzIHRoZSBvYmplY3Q7IHNpbXVsYXRlIGl0LlxuICAgICAgdGhpcy4kJHN0YXRlID0gYW5ndWxhci5jb3B5KHN0YXRlKTtcbiAgICAgIHJldHVybiB0aGlzO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLiQkdXJsO1xuICB9LFxuXG4gIHN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gdGhpcy4kJHN0YXRlO1xuICB9LFxuXG4gIG5vdGlmeVdoZW5Ob091dHN0YW5kaW5nUmVxdWVzdHM6IGZ1bmN0aW9uKGZuKSB7XG4gICAgZm4oKTtcbiAgfVxufTtcblxuXG4vKipcbiAqIEBuZ2RvYyBwcm92aWRlclxuICogQG5hbWUgJGV4Y2VwdGlvbkhhbmRsZXJQcm92aWRlclxuICpcbiAqIEBkZXNjcmlwdGlvblxuICogQ29uZmlndXJlcyB0aGUgbW9jayBpbXBsZW1lbnRhdGlvbiBvZiB7QGxpbmsgbmcuJGV4Y2VwdGlvbkhhbmRsZXJ9IHRvIHJldGhyb3cgb3IgdG8gbG9nIGVycm9yc1xuICogcGFzc2VkIHRvIHRoZSBgJGV4Y2VwdGlvbkhhbmRsZXJgLlxuICovXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lICRleGNlcHRpb25IYW5kbGVyXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBNb2NrIGltcGxlbWVudGF0aW9uIG9mIHtAbGluayBuZy4kZXhjZXB0aW9uSGFuZGxlcn0gdGhhdCByZXRocm93cyBvciBsb2dzIGVycm9ycyBwYXNzZWRcbiAqIHRvIGl0LiBTZWUge0BsaW5rIG5nTW9jay4kZXhjZXB0aW9uSGFuZGxlclByb3ZpZGVyICRleGNlcHRpb25IYW5kbGVyUHJvdmlkZXJ9IGZvciBjb25maWd1cmF0aW9uXG4gKiBpbmZvcm1hdGlvbi5cbiAqXG4gKlxuICogYGBganNcbiAqICAgZGVzY3JpYmUoJyRleGNlcHRpb25IYW5kbGVyUHJvdmlkZXInLCBmdW5jdGlvbigpIHtcbiAqXG4gKiAgICAgaXQoJ3Nob3VsZCBjYXB0dXJlIGxvZyBtZXNzYWdlcyBhbmQgZXhjZXB0aW9ucycsIGZ1bmN0aW9uKCkge1xuICpcbiAqICAgICAgIG1vZHVsZShmdW5jdGlvbigkZXhjZXB0aW9uSGFuZGxlclByb3ZpZGVyKSB7XG4gKiAgICAgICAgICRleGNlcHRpb25IYW5kbGVyUHJvdmlkZXIubW9kZSgnbG9nJyk7XG4gKiAgICAgICB9KTtcbiAqXG4gKiAgICAgICBpbmplY3QoZnVuY3Rpb24oJGxvZywgJGV4Y2VwdGlvbkhhbmRsZXIsICR0aW1lb3V0KSB7XG4gKiAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkgeyAkbG9nLmxvZygxKTsgfSk7XG4gKiAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkgeyAkbG9nLmxvZygyKTsgdGhyb3cgJ2JhbmFuYSBwZWVsJzsgfSk7XG4gKiAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkgeyAkbG9nLmxvZygzKTsgfSk7XG4gKiAgICAgICAgIGV4cGVjdCgkZXhjZXB0aW9uSGFuZGxlci5lcnJvcnMpLnRvRXF1YWwoW10pO1xuICogICAgICAgICBleHBlY3QoJGxvZy5hc3NlcnRFbXB0eSgpKTtcbiAqICAgICAgICAgJHRpbWVvdXQuZmx1c2goKTtcbiAqICAgICAgICAgZXhwZWN0KCRleGNlcHRpb25IYW5kbGVyLmVycm9ycykudG9FcXVhbChbJ2JhbmFuYSBwZWVsJ10pO1xuICogICAgICAgICBleHBlY3QoJGxvZy5sb2cubG9ncykudG9FcXVhbChbWzFdLCBbMl0sIFszXV0pO1xuICogICAgICAgfSk7XG4gKiAgICAgfSk7XG4gKiAgIH0pO1xuICogYGBgXG4gKi9cblxuYW5ndWxhci5tb2NrLiRFeGNlcHRpb25IYW5kbGVyUHJvdmlkZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGhhbmRsZXI7XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGV4Y2VwdGlvbkhhbmRsZXJQcm92aWRlciNtb2RlXG4gICAqXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBTZXRzIHRoZSBsb2dnaW5nIG1vZGUuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtb2RlIE1vZGUgb2Ygb3BlcmF0aW9uLCBkZWZhdWx0cyB0byBgcmV0aHJvd2AuXG4gICAqXG4gICAqICAgLSBgbG9nYDogU29tZXRpbWVzIGl0IGlzIGRlc2lyYWJsZSB0byB0ZXN0IHRoYXQgYW4gZXJyb3IgaXMgdGhyb3duLCBmb3IgdGhpcyBjYXNlIHRoZSBgbG9nYFxuICAgKiAgICAgICAgICAgIG1vZGUgc3RvcmVzIGFuIGFycmF5IG9mIGVycm9ycyBpbiBgJGV4Y2VwdGlvbkhhbmRsZXIuZXJyb3JzYCwgdG8gYWxsb3cgbGF0ZXJcbiAgICogICAgICAgICAgICBhc3NlcnRpb24gb2YgdGhlbS4gU2VlIHtAbGluayBuZ01vY2suJGxvZyNhc3NlcnRFbXB0eSBhc3NlcnRFbXB0eSgpfSBhbmRcbiAgICogICAgICAgICAgICB7QGxpbmsgbmdNb2NrLiRsb2cjcmVzZXQgcmVzZXQoKX1cbiAgICogICAtIGByZXRocm93YDogSWYgYW55IGVycm9ycyBhcmUgcGFzc2VkIHRvIHRoZSBoYW5kbGVyIGluIHRlc3RzLCBpdCB0eXBpY2FsbHkgbWVhbnMgdGhhdCB0aGVyZVxuICAgKiAgICAgICAgICAgICAgICBpcyBhIGJ1ZyBpbiB0aGUgYXBwbGljYXRpb24gb3IgdGVzdCwgc28gdGhpcyBtb2NrIHdpbGwgbWFrZSB0aGVzZSB0ZXN0cyBmYWlsLlxuICAgKiAgICAgICAgICAgICAgICBGb3IgYW55IGltcGxlbWVudGF0aW9ucyB0aGF0IGV4cGVjdCBleGNlcHRpb25zIHRvIGJlIHRocm93biwgdGhlIGByZXRocm93YCBtb2RlXG4gICAqICAgICAgICAgICAgICAgIHdpbGwgYWxzbyBtYWludGFpbiBhIGxvZyBvZiB0aHJvd24gZXJyb3JzLlxuICAgKi9cbiAgdGhpcy5tb2RlID0gZnVuY3Rpb24obW9kZSkge1xuXG4gICAgc3dpdGNoIChtb2RlKSB7XG4gICAgICBjYXNlICdsb2cnOlxuICAgICAgY2FzZSAncmV0aHJvdyc6XG4gICAgICAgIHZhciBlcnJvcnMgPSBbXTtcbiAgICAgICAgaGFuZGxlciA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PSAxKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaChlKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXJyb3JzLnB1c2goW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDApKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKG1vZGUgPT09IFwicmV0aHJvd1wiKSB7XG4gICAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgaGFuZGxlci5lcnJvcnMgPSBlcnJvcnM7XG4gICAgICAgIGJyZWFrO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5rbm93biBtb2RlICdcIiArIG1vZGUgKyBcIicsIG9ubHkgJ2xvZycvJ3JldGhyb3cnIG1vZGVzIGFyZSBhbGxvd2VkIVwiKTtcbiAgICB9XG4gIH07XG5cbiAgdGhpcy4kZ2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGhhbmRsZXI7XG4gIH07XG5cbiAgdGhpcy5tb2RlKCdyZXRocm93Jyk7XG59O1xuXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lICRsb2dcbiAqXG4gKiBAZGVzY3JpcHRpb25cbiAqIE1vY2sgaW1wbGVtZW50YXRpb24gb2Yge0BsaW5rIG5nLiRsb2d9IHRoYXQgZ2F0aGVycyBhbGwgbG9nZ2VkIG1lc3NhZ2VzIGluIGFycmF5c1xuICogKG9uZSBhcnJheSBwZXIgbG9nZ2luZyBsZXZlbCkuIFRoZXNlIGFycmF5cyBhcmUgZXhwb3NlZCBhcyBgbG9nc2AgcHJvcGVydHkgb2YgZWFjaCBvZiB0aGVcbiAqIGxldmVsLXNwZWNpZmljIGxvZyBmdW5jdGlvbiwgZS5nLiBmb3IgbGV2ZWwgYGVycm9yYCB0aGUgYXJyYXkgaXMgZXhwb3NlZCBhcyBgJGxvZy5lcnJvci5sb2dzYC5cbiAqXG4gKi9cbmFuZ3VsYXIubW9jay4kTG9nUHJvdmlkZXIgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGRlYnVnID0gdHJ1ZTtcblxuICBmdW5jdGlvbiBjb25jYXQoYXJyYXkxLCBhcnJheTIsIGluZGV4KSB7XG4gICAgcmV0dXJuIGFycmF5MS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJyYXkyLCBpbmRleCkpO1xuICB9XG5cbiAgdGhpcy5kZWJ1Z0VuYWJsZWQgPSBmdW5jdGlvbihmbGFnKSB7XG4gICAgaWYgKGFuZ3VsYXIuaXNEZWZpbmVkKGZsYWcpKSB7XG4gICAgICBkZWJ1ZyA9IGZsYWc7XG4gICAgICByZXR1cm4gdGhpcztcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGRlYnVnO1xuICAgIH1cbiAgfTtcblxuICB0aGlzLiRnZXQgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgJGxvZyA9IHtcbiAgICAgIGxvZzogZnVuY3Rpb24oKSB7ICRsb2cubG9nLmxvZ3MucHVzaChjb25jYXQoW10sIGFyZ3VtZW50cywgMCkpOyB9LFxuICAgICAgd2FybjogZnVuY3Rpb24oKSB7ICRsb2cud2Fybi5sb2dzLnB1c2goY29uY2F0KFtdLCBhcmd1bWVudHMsIDApKTsgfSxcbiAgICAgIGluZm86IGZ1bmN0aW9uKCkgeyAkbG9nLmluZm8ubG9ncy5wdXNoKGNvbmNhdChbXSwgYXJndW1lbnRzLCAwKSk7IH0sXG4gICAgICBlcnJvcjogZnVuY3Rpb24oKSB7ICRsb2cuZXJyb3IubG9ncy5wdXNoKGNvbmNhdChbXSwgYXJndW1lbnRzLCAwKSk7IH0sXG4gICAgICBkZWJ1ZzogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChkZWJ1Zykge1xuICAgICAgICAgICRsb2cuZGVidWcubG9ncy5wdXNoKGNvbmNhdChbXSwgYXJndW1lbnRzLCAwKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAqIEBuYW1lICRsb2cjcmVzZXRcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIFJlc2V0IGFsbCBvZiB0aGUgbG9nZ2luZyBhcnJheXMgdG8gZW1wdHkuXG4gICAgICovXG4gICAgJGxvZy5yZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgICAgLyoqXG4gICAgICAgKiBAbmdkb2MgcHJvcGVydHlcbiAgICAgICAqIEBuYW1lICRsb2cjbG9nLmxvZ3NcbiAgICAgICAqXG4gICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAqIEFycmF5IG9mIG1lc3NhZ2VzIGxvZ2dlZCB1c2luZyB7QGxpbmsgbmcuJGxvZyNsb2cgYGxvZygpYH0uXG4gICAgICAgKlxuICAgICAgICogQGV4YW1wbGVcbiAgICAgICAqIGBgYGpzXG4gICAgICAgKiAkbG9nLmxvZygnU29tZSBMb2cnKTtcbiAgICAgICAqIHZhciBmaXJzdCA9ICRsb2cubG9nLmxvZ3MudW5zaGlmdCgpO1xuICAgICAgICogYGBgXG4gICAgICAgKi9cbiAgICAgICRsb2cubG9nLmxvZ3MgPSBbXTtcbiAgICAgIC8qKlxuICAgICAgICogQG5nZG9jIHByb3BlcnR5XG4gICAgICAgKiBAbmFtZSAkbG9nI2luZm8ubG9nc1xuICAgICAgICpcbiAgICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAgICogQXJyYXkgb2YgbWVzc2FnZXMgbG9nZ2VkIHVzaW5nIHtAbGluayBuZy4kbG9nI2luZm8gYGluZm8oKWB9LlxuICAgICAgICpcbiAgICAgICAqIEBleGFtcGxlXG4gICAgICAgKiBgYGBqc1xuICAgICAgICogJGxvZy5pbmZvKCdTb21lIEluZm8nKTtcbiAgICAgICAqIHZhciBmaXJzdCA9ICRsb2cuaW5mby5sb2dzLnVuc2hpZnQoKTtcbiAgICAgICAqIGBgYFxuICAgICAgICovXG4gICAgICAkbG9nLmluZm8ubG9ncyA9IFtdO1xuICAgICAgLyoqXG4gICAgICAgKiBAbmdkb2MgcHJvcGVydHlcbiAgICAgICAqIEBuYW1lICRsb2cjd2Fybi5sb2dzXG4gICAgICAgKlxuICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgKiBBcnJheSBvZiBtZXNzYWdlcyBsb2dnZWQgdXNpbmcge0BsaW5rIG5nLiRsb2cjd2FybiBgd2FybigpYH0uXG4gICAgICAgKlxuICAgICAgICogQGV4YW1wbGVcbiAgICAgICAqIGBgYGpzXG4gICAgICAgKiAkbG9nLndhcm4oJ1NvbWUgV2FybmluZycpO1xuICAgICAgICogdmFyIGZpcnN0ID0gJGxvZy53YXJuLmxvZ3MudW5zaGlmdCgpO1xuICAgICAgICogYGBgXG4gICAgICAgKi9cbiAgICAgICRsb2cud2Fybi5sb2dzID0gW107XG4gICAgICAvKipcbiAgICAgICAqIEBuZ2RvYyBwcm9wZXJ0eVxuICAgICAgICogQG5hbWUgJGxvZyNlcnJvci5sb2dzXG4gICAgICAgKlxuICAgICAgICogQGRlc2NyaXB0aW9uXG4gICAgICAgKiBBcnJheSBvZiBtZXNzYWdlcyBsb2dnZWQgdXNpbmcge0BsaW5rIG5nLiRsb2cjZXJyb3IgYGVycm9yKClgfS5cbiAgICAgICAqXG4gICAgICAgKiBAZXhhbXBsZVxuICAgICAgICogYGBganNcbiAgICAgICAqICRsb2cuZXJyb3IoJ1NvbWUgRXJyb3InKTtcbiAgICAgICAqIHZhciBmaXJzdCA9ICRsb2cuZXJyb3IubG9ncy51bnNoaWZ0KCk7XG4gICAgICAgKiBgYGBcbiAgICAgICAqL1xuICAgICAgJGxvZy5lcnJvci5sb2dzID0gW107XG4gICAgICAgIC8qKlxuICAgICAgICogQG5nZG9jIHByb3BlcnR5XG4gICAgICAgKiBAbmFtZSAkbG9nI2RlYnVnLmxvZ3NcbiAgICAgICAqXG4gICAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgICAqIEFycmF5IG9mIG1lc3NhZ2VzIGxvZ2dlZCB1c2luZyB7QGxpbmsgbmcuJGxvZyNkZWJ1ZyBgZGVidWcoKWB9LlxuICAgICAgICpcbiAgICAgICAqIEBleGFtcGxlXG4gICAgICAgKiBgYGBqc1xuICAgICAgICogJGxvZy5kZWJ1ZygnU29tZSBFcnJvcicpO1xuICAgICAgICogdmFyIGZpcnN0ID0gJGxvZy5kZWJ1Zy5sb2dzLnVuc2hpZnQoKTtcbiAgICAgICAqIGBgYFxuICAgICAgICovXG4gICAgICAkbG9nLmRlYnVnLmxvZ3MgPSBbXTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQG5nZG9jIG1ldGhvZFxuICAgICAqIEBuYW1lICRsb2cjYXNzZXJ0RW1wdHlcbiAgICAgKlxuICAgICAqIEBkZXNjcmlwdGlvblxuICAgICAqIEFzc2VydCB0aGF0IGFsbCBvZiB0aGUgbG9nZ2luZyBtZXRob2RzIGhhdmUgbm8gbG9nZ2VkIG1lc3NhZ2VzLiBJZiBhbnkgbWVzc2FnZXMgYXJlIHByZXNlbnQsXG4gICAgICogYW4gZXhjZXB0aW9uIGlzIHRocm93bi5cbiAgICAgKi9cbiAgICAkbG9nLmFzc2VydEVtcHR5ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZXJyb3JzID0gW107XG4gICAgICBhbmd1bGFyLmZvckVhY2goWydlcnJvcicsICd3YXJuJywgJ2luZm8nLCAnbG9nJywgJ2RlYnVnJ10sIGZ1bmN0aW9uKGxvZ0xldmVsKSB7XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaCgkbG9nW2xvZ0xldmVsXS5sb2dzLCBmdW5jdGlvbihsb2cpIHtcbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2gobG9nLCBmdW5jdGlvbihsb2dJdGVtKSB7XG4gICAgICAgICAgICBlcnJvcnMucHVzaCgnTU9DSyAkbG9nICgnICsgbG9nTGV2ZWwgKyAnKTogJyArIFN0cmluZyhsb2dJdGVtKSArICdcXG4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgIChsb2dJdGVtLnN0YWNrIHx8ICcnKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICBpZiAoZXJyb3JzLmxlbmd0aCkge1xuICAgICAgICBlcnJvcnMudW5zaGlmdChcIkV4cGVjdGVkICRsb2cgdG8gYmUgZW1wdHkhIEVpdGhlciBhIG1lc3NhZ2Ugd2FzIGxvZ2dlZCB1bmV4cGVjdGVkbHksIG9yIFwiICtcbiAgICAgICAgICBcImFuIGV4cGVjdGVkIGxvZyBtZXNzYWdlIHdhcyBub3QgY2hlY2tlZCBhbmQgcmVtb3ZlZDpcIik7XG4gICAgICAgIGVycm9ycy5wdXNoKCcnKTtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycm9ycy5qb2luKCdcXG4tLS0tLS0tLS1cXG4nKSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgICRsb2cucmVzZXQoKTtcbiAgICByZXR1cm4gJGxvZztcbiAgfTtcbn07XG5cblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgJGludGVydmFsXG4gKlxuICogQGRlc2NyaXB0aW9uXG4gKiBNb2NrIGltcGxlbWVudGF0aW9uIG9mIHRoZSAkaW50ZXJ2YWwgc2VydmljZS5cbiAqXG4gKiBVc2Uge0BsaW5rIG5nTW9jay4kaW50ZXJ2YWwjZmx1c2ggYCRpbnRlcnZhbC5mbHVzaChtaWxsaXMpYH0gdG9cbiAqIG1vdmUgZm9yd2FyZCBieSBgbWlsbGlzYCBtaWxsaXNlY29uZHMgYW5kIHRyaWdnZXIgYW55IGZ1bmN0aW9ucyBzY2hlZHVsZWQgdG8gcnVuIGluIHRoYXRcbiAqIHRpbWUuXG4gKlxuICogQHBhcmFtIHtmdW5jdGlvbigpfSBmbiBBIGZ1bmN0aW9uIHRoYXQgc2hvdWxkIGJlIGNhbGxlZCByZXBlYXRlZGx5LlxuICogQHBhcmFtIHtudW1iZXJ9IGRlbGF5IE51bWJlciBvZiBtaWxsaXNlY29uZHMgYmV0d2VlbiBlYWNoIGZ1bmN0aW9uIGNhbGwuXG4gKiBAcGFyYW0ge251bWJlcj19IFtjb3VudD0wXSBOdW1iZXIgb2YgdGltZXMgdG8gcmVwZWF0LiBJZiBub3Qgc2V0LCBvciAwLCB3aWxsIHJlcGVhdFxuICogICBpbmRlZmluaXRlbHkuXG4gKiBAcGFyYW0ge2Jvb2xlYW49fSBbaW52b2tlQXBwbHk9dHJ1ZV0gSWYgc2V0IHRvIGBmYWxzZWAgc2tpcHMgbW9kZWwgZGlydHkgY2hlY2tpbmcsIG90aGVyd2lzZVxuICogICB3aWxsIGludm9rZSBgZm5gIHdpdGhpbiB0aGUge0BsaW5rIG5nLiRyb290U2NvcGUuU2NvcGUjJGFwcGx5ICRhcHBseX0gYmxvY2suXG4gKiBAcGFyYW0gey4uLio9fSBQYXNzIGFkZGl0aW9uYWwgcGFyYW1ldGVycyB0byB0aGUgZXhlY3V0ZWQgZnVuY3Rpb24uXG4gKiBAcmV0dXJucyB7cHJvbWlzZX0gQSBwcm9taXNlIHdoaWNoIHdpbGwgYmUgbm90aWZpZWQgb24gZWFjaCBpdGVyYXRpb24uXG4gKi9cbmFuZ3VsYXIubW9jay4kSW50ZXJ2YWxQcm92aWRlciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLiRnZXQgPSBbJyRicm93c2VyJywgJyRyb290U2NvcGUnLCAnJHEnLCAnJCRxJyxcbiAgICAgICBmdW5jdGlvbigkYnJvd3NlciwgICAkcm9vdFNjb3BlLCAgICRxLCAgICQkcSkge1xuICAgIHZhciByZXBlYXRGbnMgPSBbXSxcbiAgICAgICAgbmV4dFJlcGVhdElkID0gMCxcbiAgICAgICAgbm93ID0gMDtcblxuICAgIHZhciAkaW50ZXJ2YWwgPSBmdW5jdGlvbihmbiwgZGVsYXksIGNvdW50LCBpbnZva2VBcHBseSkge1xuICAgICAgdmFyIGhhc1BhcmFtcyA9IGFyZ3VtZW50cy5sZW5ndGggPiA0LFxuICAgICAgICAgIGFyZ3MgPSBoYXNQYXJhbXMgPyBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDQpIDogW10sXG4gICAgICAgICAgaXRlcmF0aW9uID0gMCxcbiAgICAgICAgICBza2lwQXBwbHkgPSAoYW5ndWxhci5pc0RlZmluZWQoaW52b2tlQXBwbHkpICYmICFpbnZva2VBcHBseSksXG4gICAgICAgICAgZGVmZXJyZWQgPSAoc2tpcEFwcGx5ID8gJCRxIDogJHEpLmRlZmVyKCksXG4gICAgICAgICAgcHJvbWlzZSA9IGRlZmVycmVkLnByb21pc2U7XG5cbiAgICAgIGNvdW50ID0gKGFuZ3VsYXIuaXNEZWZpbmVkKGNvdW50KSkgPyBjb3VudCA6IDA7XG4gICAgICBwcm9taXNlLnRoZW4obnVsbCwgbnVsbCwgKCFoYXNQYXJhbXMpID8gZm4gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZm4uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgICB9KTtcblxuICAgICAgcHJvbWlzZS4kJGludGVydmFsSWQgPSBuZXh0UmVwZWF0SWQ7XG5cbiAgICAgIGZ1bmN0aW9uIHRpY2soKSB7XG4gICAgICAgIGRlZmVycmVkLm5vdGlmeShpdGVyYXRpb24rKyk7XG5cbiAgICAgICAgaWYgKGNvdW50ID4gMCAmJiBpdGVyYXRpb24gPj0gY291bnQpIHtcbiAgICAgICAgICB2YXIgZm5JbmRleDtcbiAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGl0ZXJhdGlvbik7XG5cbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2gocmVwZWF0Rm5zLCBmdW5jdGlvbihmbiwgaW5kZXgpIHtcbiAgICAgICAgICAgIGlmIChmbi5pZCA9PT0gcHJvbWlzZS4kJGludGVydmFsSWQpIGZuSW5kZXggPSBpbmRleDtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIGlmIChmbkluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJlcGVhdEZucy5zcGxpY2UoZm5JbmRleCwgMSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHNraXBBcHBseSkge1xuICAgICAgICAgICRicm93c2VyLmRlZmVyLmZsdXNoKCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgJHJvb3RTY29wZS4kYXBwbHkoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICByZXBlYXRGbnMucHVzaCh7XG4gICAgICAgIG5leHRUaW1lOihub3cgKyBkZWxheSksXG4gICAgICAgIGRlbGF5OiBkZWxheSxcbiAgICAgICAgZm46IHRpY2ssXG4gICAgICAgIGlkOiBuZXh0UmVwZWF0SWQsXG4gICAgICAgIGRlZmVycmVkOiBkZWZlcnJlZFxuICAgICAgfSk7XG4gICAgICByZXBlYXRGbnMuc29ydChmdW5jdGlvbihhLCBiKSB7IHJldHVybiBhLm5leHRUaW1lIC0gYi5uZXh0VGltZTt9KTtcblxuICAgICAgbmV4dFJlcGVhdElkKys7XG4gICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICB9O1xuICAgIC8qKlxuICAgICAqIEBuZ2RvYyBtZXRob2RcbiAgICAgKiBAbmFtZSAkaW50ZXJ2YWwjY2FuY2VsXG4gICAgICpcbiAgICAgKiBAZGVzY3JpcHRpb25cbiAgICAgKiBDYW5jZWxzIGEgdGFzayBhc3NvY2lhdGVkIHdpdGggdGhlIGBwcm9taXNlYC5cbiAgICAgKlxuICAgICAqIEBwYXJhbSB7cHJvbWlzZX0gcHJvbWlzZSBBIHByb21pc2UgZnJvbSBjYWxsaW5nIHRoZSBgJGludGVydmFsYCBmdW5jdGlvbi5cbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn0gUmV0dXJucyBgdHJ1ZWAgaWYgdGhlIHRhc2sgd2FzIHN1Y2Nlc3NmdWxseSBjYW5jZWxsZWQuXG4gICAgICovXG4gICAgJGludGVydmFsLmNhbmNlbCA9IGZ1bmN0aW9uKHByb21pc2UpIHtcbiAgICAgIGlmICghcHJvbWlzZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgdmFyIGZuSW5kZXg7XG5cbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChyZXBlYXRGbnMsIGZ1bmN0aW9uKGZuLCBpbmRleCkge1xuICAgICAgICBpZiAoZm4uaWQgPT09IHByb21pc2UuJCRpbnRlcnZhbElkKSBmbkluZGV4ID0gaW5kZXg7XG4gICAgICB9KTtcblxuICAgICAgaWYgKGZuSW5kZXggIT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXBlYXRGbnNbZm5JbmRleF0uZGVmZXJyZWQucmVqZWN0KCdjYW5jZWxlZCcpO1xuICAgICAgICByZXBlYXRGbnMuc3BsaWNlKGZuSW5kZXgsIDEpO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAbmdkb2MgbWV0aG9kXG4gICAgICogQG5hbWUgJGludGVydmFsI2ZsdXNoXG4gICAgICogQGRlc2NyaXB0aW9uXG4gICAgICpcbiAgICAgKiBSdW5zIGludGVydmFsIHRhc2tzIHNjaGVkdWxlZCB0byBiZSBydW4gaW4gdGhlIG5leHQgYG1pbGxpc2AgbWlsbGlzZWNvbmRzLlxuICAgICAqXG4gICAgICogQHBhcmFtIHtudW1iZXI9fSBtaWxsaXMgbWF4aW11bSB0aW1lb3V0IGFtb3VudCB0byBmbHVzaCB1cCB1bnRpbC5cbiAgICAgKlxuICAgICAqIEByZXR1cm4ge251bWJlcn0gVGhlIGFtb3VudCBvZiB0aW1lIG1vdmVkIGZvcndhcmQuXG4gICAgICovXG4gICAgJGludGVydmFsLmZsdXNoID0gZnVuY3Rpb24obWlsbGlzKSB7XG4gICAgICBub3cgKz0gbWlsbGlzO1xuICAgICAgd2hpbGUgKHJlcGVhdEZucy5sZW5ndGggJiYgcmVwZWF0Rm5zWzBdLm5leHRUaW1lIDw9IG5vdykge1xuICAgICAgICB2YXIgdGFzayA9IHJlcGVhdEZuc1swXTtcbiAgICAgICAgdGFzay5mbigpO1xuICAgICAgICB0YXNrLm5leHRUaW1lICs9IHRhc2suZGVsYXk7XG4gICAgICAgIHJlcGVhdEZucy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHsgcmV0dXJuIGEubmV4dFRpbWUgLSBiLm5leHRUaW1lO30pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG1pbGxpcztcbiAgICB9O1xuXG4gICAgcmV0dXJuICRpbnRlcnZhbDtcbiAgfV07XG59O1xuXG5cbi8qIGpzaGludCAtVzEwMSAqL1xuLyogVGhlIFJfSVNPODA2MV9TVFIgcmVnZXggaXMgbmV2ZXIgZ29pbmcgdG8gZml0IGludG8gdGhlIDEwMCBjaGFyIGxpbWl0IVxuICogVGhpcyBkaXJlY3RpdmUgc2hvdWxkIGdvIGluc2lkZSB0aGUgYW5vbnltb3VzIGZ1bmN0aW9uIGJ1dCBhIGJ1ZyBpbiBKU0hpbnQgbWVhbnMgdGhhdCBpdCB3b3VsZFxuICogbm90IGJlIGVuYWN0ZWQgZWFybHkgZW5vdWdoIHRvIHByZXZlbnQgdGhlIHdhcm5pbmcuXG4gKi9cbnZhciBSX0lTTzgwNjFfU1RSID0gL14oXFxkezR9KS0/KFxcZFxcZCktPyhcXGRcXGQpKD86VChcXGRcXGQpKD86XFw6PyhcXGRcXGQpKD86XFw6PyhcXGRcXGQpKD86XFwuKFxcZHszfSkpPyk/KT8oWnwoWystXSkoXFxkXFxkKTo/KFxcZFxcZCkpKT8kLztcblxuZnVuY3Rpb24ganNvblN0cmluZ1RvRGF0ZShzdHJpbmcpIHtcbiAgdmFyIG1hdGNoO1xuICBpZiAobWF0Y2ggPSBzdHJpbmcubWF0Y2goUl9JU084MDYxX1NUUikpIHtcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKDApLFxuICAgICAgICB0ekhvdXIgPSAwLFxuICAgICAgICB0ek1pbiAgPSAwO1xuICAgIGlmIChtYXRjaFs5XSkge1xuICAgICAgdHpIb3VyID0gdG9JbnQobWF0Y2hbOV0gKyBtYXRjaFsxMF0pO1xuICAgICAgdHpNaW4gPSB0b0ludChtYXRjaFs5XSArIG1hdGNoWzExXSk7XG4gICAgfVxuICAgIGRhdGUuc2V0VVRDRnVsbFllYXIodG9JbnQobWF0Y2hbMV0pLCB0b0ludChtYXRjaFsyXSkgLSAxLCB0b0ludChtYXRjaFszXSkpO1xuICAgIGRhdGUuc2V0VVRDSG91cnModG9JbnQobWF0Y2hbNF0gfHwgMCkgLSB0ekhvdXIsXG4gICAgICAgICAgICAgICAgICAgICB0b0ludChtYXRjaFs1XSB8fCAwKSAtIHR6TWluLFxuICAgICAgICAgICAgICAgICAgICAgdG9JbnQobWF0Y2hbNl0gfHwgMCksXG4gICAgICAgICAgICAgICAgICAgICB0b0ludChtYXRjaFs3XSB8fCAwKSk7XG4gICAgcmV0dXJuIGRhdGU7XG4gIH1cbiAgcmV0dXJuIHN0cmluZztcbn1cblxuZnVuY3Rpb24gdG9JbnQoc3RyKSB7XG4gIHJldHVybiBwYXJzZUludChzdHIsIDEwKTtcbn1cblxuZnVuY3Rpb24gcGFkTnVtYmVyKG51bSwgZGlnaXRzLCB0cmltKSB7XG4gIHZhciBuZWcgPSAnJztcbiAgaWYgKG51bSA8IDApIHtcbiAgICBuZWcgPSAgJy0nO1xuICAgIG51bSA9IC1udW07XG4gIH1cbiAgbnVtID0gJycgKyBudW07XG4gIHdoaWxlIChudW0ubGVuZ3RoIDwgZGlnaXRzKSBudW0gPSAnMCcgKyBudW07XG4gIGlmICh0cmltKSB7XG4gICAgbnVtID0gbnVtLnN1YnN0cihudW0ubGVuZ3RoIC0gZGlnaXRzKTtcbiAgfVxuICByZXR1cm4gbmVnICsgbnVtO1xufVxuXG5cbi8qKlxuICogQG5nZG9jIHR5cGVcbiAqIEBuYW1lIGFuZ3VsYXIubW9jay5UekRhdGVcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqICpOT1RFKjogdGhpcyBpcyBub3QgYW4gaW5qZWN0YWJsZSBpbnN0YW5jZSwganVzdCBhIGdsb2JhbGx5IGF2YWlsYWJsZSBtb2NrIGNsYXNzIG9mIGBEYXRlYC5cbiAqXG4gKiBNb2NrIG9mIHRoZSBEYXRlIHR5cGUgd2hpY2ggaGFzIGl0cyB0aW1lem9uZSBzcGVjaWZpZWQgdmlhIGNvbnN0cnVjdG9yIGFyZy5cbiAqXG4gKiBUaGUgbWFpbiBwdXJwb3NlIGlzIHRvIGNyZWF0ZSBEYXRlLWxpa2UgaW5zdGFuY2VzIHdpdGggdGltZXpvbmUgZml4ZWQgdG8gdGhlIHNwZWNpZmllZCB0aW1lem9uZVxuICogb2Zmc2V0LCBzbyB0aGF0IHdlIGNhbiB0ZXN0IGNvZGUgdGhhdCBkZXBlbmRzIG9uIGxvY2FsIHRpbWV6b25lIHNldHRpbmdzIHdpdGhvdXQgZGVwZW5kZW5jeSBvblxuICogdGhlIHRpbWUgem9uZSBzZXR0aW5ncyBvZiB0aGUgbWFjaGluZSB3aGVyZSB0aGUgY29kZSBpcyBydW5uaW5nLlxuICpcbiAqIEBwYXJhbSB7bnVtYmVyfSBvZmZzZXQgT2Zmc2V0IG9mIHRoZSAqZGVzaXJlZCogdGltZXpvbmUgaW4gaG91cnMgKGZyYWN0aW9ucyB3aWxsIGJlIGhvbm9yZWQpXG4gKiBAcGFyYW0geyhudW1iZXJ8c3RyaW5nKX0gdGltZXN0YW1wIFRpbWVzdGFtcCByZXByZXNlbnRpbmcgdGhlIGRlc2lyZWQgdGltZSBpbiAqVVRDKlxuICpcbiAqIEBleGFtcGxlXG4gKiAhISEhIFdBUk5JTkcgISEhISFcbiAqIFRoaXMgaXMgbm90IGEgY29tcGxldGUgRGF0ZSBvYmplY3Qgc28gb25seSBtZXRob2RzIHRoYXQgd2VyZSBpbXBsZW1lbnRlZCBjYW4gYmUgY2FsbGVkIHNhZmVseS5cbiAqIFRvIG1ha2UgbWF0dGVycyB3b3JzZSwgVHpEYXRlIGluc3RhbmNlcyBpbmhlcml0IHN0dWZmIGZyb20gRGF0ZSB2aWEgYSBwcm90b3R5cGUuXG4gKlxuICogV2UgZG8gb3VyIGJlc3QgdG8gaW50ZXJjZXB0IGNhbGxzIHRvIFwidW5pbXBsZW1lbnRlZFwiIG1ldGhvZHMsIGJ1dCBzaW5jZSB0aGUgbGlzdCBvZiBtZXRob2RzIGlzXG4gKiBpbmNvbXBsZXRlIHdlIG1pZ2h0IGJlIG1pc3Npbmcgc29tZSBub24tc3RhbmRhcmQgbWV0aG9kcy4gVGhpcyBjYW4gcmVzdWx0IGluIGVycm9ycyBsaWtlOlxuICogXCJEYXRlLnByb3RvdHlwZS5mb28gY2FsbGVkIG9uIGluY29tcGF0aWJsZSBPYmplY3RcIi5cbiAqXG4gKiBgYGBqc1xuICogdmFyIG5ld1llYXJJbkJyYXRpc2xhdmEgPSBuZXcgVHpEYXRlKC0xLCAnMjAwOS0xMi0zMVQyMzowMDowMFonKTtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0VGltZXpvbmVPZmZzZXQoKSA9PiAtNjA7XG4gKiBuZXdZZWFySW5CcmF0aXNsYXZhLmdldEZ1bGxZZWFyKCkgPT4gMjAxMDtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0TW9udGgoKSA9PiAwO1xuICogbmV3WWVhckluQnJhdGlzbGF2YS5nZXREYXRlKCkgPT4gMTtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0SG91cnMoKSA9PiAwO1xuICogbmV3WWVhckluQnJhdGlzbGF2YS5nZXRNaW51dGVzKCkgPT4gMDtcbiAqIG5ld1llYXJJbkJyYXRpc2xhdmEuZ2V0U2Vjb25kcygpID0+IDA7XG4gKiBgYGBcbiAqXG4gKi9cbmFuZ3VsYXIubW9jay5UekRhdGUgPSBmdW5jdGlvbihvZmZzZXQsIHRpbWVzdGFtcCkge1xuICB2YXIgc2VsZiA9IG5ldyBEYXRlKDApO1xuICBpZiAoYW5ndWxhci5pc1N0cmluZyh0aW1lc3RhbXApKSB7XG4gICAgdmFyIHRzU3RyID0gdGltZXN0YW1wO1xuXG4gICAgc2VsZi5vcmlnRGF0ZSA9IGpzb25TdHJpbmdUb0RhdGUodGltZXN0YW1wKTtcblxuICAgIHRpbWVzdGFtcCA9IHNlbGYub3JpZ0RhdGUuZ2V0VGltZSgpO1xuICAgIGlmIChpc05hTih0aW1lc3RhbXApKSB7XG4gICAgICB0aHJvdyB7XG4gICAgICAgIG5hbWU6IFwiSWxsZWdhbCBBcmd1bWVudFwiLFxuICAgICAgICBtZXNzYWdlOiBcIkFyZyAnXCIgKyB0c1N0ciArIFwiJyBwYXNzZWQgaW50byBUekRhdGUgY29uc3RydWN0b3IgaXMgbm90IGEgdmFsaWQgZGF0ZSBzdHJpbmdcIlxuICAgICAgfTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgc2VsZi5vcmlnRGF0ZSA9IG5ldyBEYXRlKHRpbWVzdGFtcCk7XG4gIH1cblxuICB2YXIgbG9jYWxPZmZzZXQgPSBuZXcgRGF0ZSh0aW1lc3RhbXApLmdldFRpbWV6b25lT2Zmc2V0KCk7XG4gIHNlbGYub2Zmc2V0RGlmZiA9IGxvY2FsT2Zmc2V0ICogNjAgKiAxMDAwIC0gb2Zmc2V0ICogMTAwMCAqIDYwICogNjA7XG4gIHNlbGYuZGF0ZSA9IG5ldyBEYXRlKHRpbWVzdGFtcCArIHNlbGYub2Zmc2V0RGlmZik7XG5cbiAgc2VsZi5nZXRUaW1lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYuZGF0ZS5nZXRUaW1lKCkgLSBzZWxmLm9mZnNldERpZmY7XG4gIH07XG5cbiAgc2VsZi50b0xvY2FsZURhdGVTdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLnRvTG9jYWxlRGF0ZVN0cmluZygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0RnVsbFllYXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLmdldEZ1bGxZZWFyKCk7XG4gIH07XG5cbiAgc2VsZi5nZXRNb250aCA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLmRhdGUuZ2V0TW9udGgoKTtcbiAgfTtcblxuICBzZWxmLmdldERhdGUgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLmdldERhdGUoKTtcbiAgfTtcblxuICBzZWxmLmdldEhvdXJzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYuZGF0ZS5nZXRIb3VycygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0TWludXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLmRhdGUuZ2V0TWludXRlcygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0U2Vjb25kcyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLmRhdGUuZ2V0U2Vjb25kcygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0TWlsbGlzZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYuZGF0ZS5nZXRNaWxsaXNlY29uZHMoKTtcbiAgfTtcblxuICBzZWxmLmdldFRpbWV6b25lT2Zmc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG9mZnNldCAqIDYwO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDRnVsbFllYXIgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5vcmlnRGF0ZS5nZXRVVENGdWxsWWVhcigpO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDTW9udGggPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5vcmlnRGF0ZS5nZXRVVENNb250aCgpO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDRGF0ZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBzZWxmLm9yaWdEYXRlLmdldFVUQ0RhdGUoKTtcbiAgfTtcblxuICBzZWxmLmdldFVUQ0hvdXJzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYub3JpZ0RhdGUuZ2V0VVRDSG91cnMoKTtcbiAgfTtcblxuICBzZWxmLmdldFVUQ01pbnV0ZXMgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5vcmlnRGF0ZS5nZXRVVENNaW51dGVzKCk7XG4gIH07XG5cbiAgc2VsZi5nZXRVVENTZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYub3JpZ0RhdGUuZ2V0VVRDU2Vjb25kcygpO1xuICB9O1xuXG4gIHNlbGYuZ2V0VVRDTWlsbGlzZWNvbmRzID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHNlbGYub3JpZ0RhdGUuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XG4gIH07XG5cbiAgc2VsZi5nZXREYXkgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gc2VsZi5kYXRlLmdldERheSgpO1xuICB9O1xuXG4gIC8vIHByb3ZpZGUgdGhpcyBtZXRob2Qgb25seSBvbiBicm93c2VycyB0aGF0IGFscmVhZHkgaGF2ZSBpdFxuICBpZiAoc2VsZi50b0lTT1N0cmluZykge1xuICAgIHNlbGYudG9JU09TdHJpbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENGdWxsWWVhcigpLCA0KSArICctJyArXG4gICAgICAgICAgICBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENNb250aCgpICsgMSwgMikgKyAnLScgK1xuICAgICAgICAgICAgcGFkTnVtYmVyKHNlbGYub3JpZ0RhdGUuZ2V0VVRDRGF0ZSgpLCAyKSArICdUJyArXG4gICAgICAgICAgICBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENIb3VycygpLCAyKSArICc6JyArXG4gICAgICAgICAgICBwYWROdW1iZXIoc2VsZi5vcmlnRGF0ZS5nZXRVVENNaW51dGVzKCksIDIpICsgJzonICtcbiAgICAgICAgICAgIHBhZE51bWJlcihzZWxmLm9yaWdEYXRlLmdldFVUQ1NlY29uZHMoKSwgMikgKyAnLicgK1xuICAgICAgICAgICAgcGFkTnVtYmVyKHNlbGYub3JpZ0RhdGUuZ2V0VVRDTWlsbGlzZWNvbmRzKCksIDMpICsgJ1onO1xuICAgIH07XG4gIH1cblxuICAvL2hpZGUgYWxsIG1ldGhvZHMgbm90IGltcGxlbWVudGVkIGluIHRoaXMgbW9jayB0aGF0IHRoZSBEYXRlIHByb3RvdHlwZSBleHBvc2VzXG4gIHZhciB1bmltcGxlbWVudGVkTWV0aG9kcyA9IFsnZ2V0VVRDRGF5JyxcbiAgICAgICdnZXRZZWFyJywgJ3NldERhdGUnLCAnc2V0RnVsbFllYXInLCAnc2V0SG91cnMnLCAnc2V0TWlsbGlzZWNvbmRzJyxcbiAgICAgICdzZXRNaW51dGVzJywgJ3NldE1vbnRoJywgJ3NldFNlY29uZHMnLCAnc2V0VGltZScsICdzZXRVVENEYXRlJywgJ3NldFVUQ0Z1bGxZZWFyJyxcbiAgICAgICdzZXRVVENIb3VycycsICdzZXRVVENNaWxsaXNlY29uZHMnLCAnc2V0VVRDTWludXRlcycsICdzZXRVVENNb250aCcsICdzZXRVVENTZWNvbmRzJyxcbiAgICAgICdzZXRZZWFyJywgJ3RvRGF0ZVN0cmluZycsICd0b0dNVFN0cmluZycsICd0b0pTT04nLCAndG9Mb2NhbGVGb3JtYXQnLCAndG9Mb2NhbGVTdHJpbmcnLFxuICAgICAgJ3RvTG9jYWxlVGltZVN0cmluZycsICd0b1NvdXJjZScsICd0b1N0cmluZycsICd0b1RpbWVTdHJpbmcnLCAndG9VVENTdHJpbmcnLCAndmFsdWVPZiddO1xuXG4gIGFuZ3VsYXIuZm9yRWFjaCh1bmltcGxlbWVudGVkTWV0aG9kcywgZnVuY3Rpb24obWV0aG9kTmFtZSkge1xuICAgIHNlbGZbbWV0aG9kTmFtZV0gPSBmdW5jdGlvbigpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk1ldGhvZCAnXCIgKyBtZXRob2ROYW1lICsgXCInIGlzIG5vdCBpbXBsZW1lbnRlZCBpbiB0aGUgVHpEYXRlIG1vY2tcIik7XG4gICAgfTtcbiAgfSk7XG5cbiAgcmV0dXJuIHNlbGY7XG59O1xuXG4vL21ha2UgXCJ0ekRhdGVJbnN0YW5jZSBpbnN0YW5jZW9mIERhdGVcIiByZXR1cm4gdHJ1ZVxuYW5ndWxhci5tb2NrLlR6RGF0ZS5wcm90b3R5cGUgPSBEYXRlLnByb3RvdHlwZTtcbi8qIGpzaGludCArVzEwMSAqL1xuXG5hbmd1bGFyLm1vY2suYW5pbWF0ZSA9IGFuZ3VsYXIubW9kdWxlKCduZ0FuaW1hdGVNb2NrJywgWyduZyddKVxuXG4gIC5jb25maWcoWyckcHJvdmlkZScsIGZ1bmN0aW9uKCRwcm92aWRlKSB7XG5cbiAgICAkcHJvdmlkZS5mYWN0b3J5KCckJGZvcmNlUmVmbG93JywgZnVuY3Rpb24oKSB7XG4gICAgICBmdW5jdGlvbiByZWZsb3dGbigpIHtcbiAgICAgICAgcmVmbG93Rm4udG90YWxSZWZsb3dzKys7XG4gICAgICB9XG4gICAgICByZWZsb3dGbi50b3RhbFJlZmxvd3MgPSAwO1xuICAgICAgcmV0dXJuIHJlZmxvd0ZuO1xuICAgIH0pO1xuXG4gICAgJHByb3ZpZGUuZmFjdG9yeSgnJCRhbmltYXRlQXN5bmNSdW4nLCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBxdWV1ZSA9IFtdO1xuICAgICAgdmFyIHF1ZXVlRm4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKGZuKSB7XG4gICAgICAgICAgcXVldWUucHVzaChmbik7XG4gICAgICAgIH07XG4gICAgICB9O1xuICAgICAgcXVldWVGbi5mbHVzaCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAocXVldWUubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBxdWV1ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIHF1ZXVlW2ldKCk7XG4gICAgICAgIH1cbiAgICAgICAgcXVldWUgPSBbXTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH07XG4gICAgICByZXR1cm4gcXVldWVGbjtcbiAgICB9KTtcblxuICAgICRwcm92aWRlLmRlY29yYXRvcignJGFuaW1hdGUnLCBbJyRkZWxlZ2F0ZScsICckdGltZW91dCcsICckYnJvd3NlcicsICckJHJBRicsICckJGZvcmNlUmVmbG93JywgJyQkYW5pbWF0ZUFzeW5jUnVuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigkZGVsZWdhdGUsICAgJHRpbWVvdXQsICAgJGJyb3dzZXIsICAgJCRyQUYsICAgJCRmb3JjZVJlZmxvdywgICAkJGFuaW1hdGVBc3luY1J1bikge1xuXG4gICAgICB2YXIgYW5pbWF0ZSA9IHtcbiAgICAgICAgcXVldWU6IFtdLFxuICAgICAgICBjYW5jZWw6ICRkZWxlZ2F0ZS5jYW5jZWwsXG4gICAgICAgIG9uOiAkZGVsZWdhdGUub24sXG4gICAgICAgIG9mZjogJGRlbGVnYXRlLm9mZixcbiAgICAgICAgcGluOiAkZGVsZWdhdGUucGluLFxuICAgICAgICBnZXQgcmVmbG93cygpIHtcbiAgICAgICAgICByZXR1cm4gJCRmb3JjZVJlZmxvdy50b3RhbFJlZmxvd3M7XG4gICAgICAgIH0sXG4gICAgICAgIGVuYWJsZWQ6ICRkZWxlZ2F0ZS5lbmFibGVkLFxuICAgICAgICBmbHVzaDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJhZnNGbHVzaGVkID0gZmFsc2U7XG4gICAgICAgICAgaWYgKCQkckFGLnF1ZXVlLmxlbmd0aCkge1xuICAgICAgICAgICAgJCRyQUYuZmx1c2goKTtcbiAgICAgICAgICAgIHJhZnNGbHVzaGVkID0gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgYW5pbWF0b3JzRmx1c2hlZCA9ICQkYW5pbWF0ZUFzeW5jUnVuLmZsdXNoKCk7XG4gICAgICAgICAgaWYgKCFyYWZzRmx1c2hlZCAmJiAhYW5pbWF0b3JzRmx1c2hlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBwZW5kaW5nIGFuaW1hdGlvbnMgcmVhZHkgdG8gYmUgY2xvc2VkIG9yIGZsdXNoZWQnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGFuZ3VsYXIuZm9yRWFjaChcbiAgICAgICAgWydhbmltYXRlJywnZW50ZXInLCdsZWF2ZScsJ21vdmUnLCdhZGRDbGFzcycsJ3JlbW92ZUNsYXNzJywnc2V0Q2xhc3MnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAgIGFuaW1hdGVbbWV0aG9kXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIGFuaW1hdGUucXVldWUucHVzaCh7XG4gICAgICAgICAgICBldmVudDogbWV0aG9kLFxuICAgICAgICAgICAgZWxlbWVudDogYXJndW1lbnRzWzBdLFxuICAgICAgICAgICAgb3B0aW9uczogYXJndW1lbnRzW2FyZ3VtZW50cy5sZW5ndGggLSAxXSxcbiAgICAgICAgICAgIGFyZ3M6IGFyZ3VtZW50c1xuICAgICAgICAgIH0pO1xuICAgICAgICAgIHJldHVybiAkZGVsZWdhdGVbbWV0aG9kXS5hcHBseSgkZGVsZWdhdGUsIGFyZ3VtZW50cyk7XG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIGFuaW1hdGU7XG4gICAgfV0pO1xuXG4gIH1dKTtcblxuXG4vKipcbiAqIEBuZ2RvYyBmdW5jdGlvblxuICogQG5hbWUgYW5ndWxhci5tb2NrLmR1bXBcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqICpOT1RFKjogdGhpcyBpcyBub3QgYW4gaW5qZWN0YWJsZSBpbnN0YW5jZSwganVzdCBhIGdsb2JhbGx5IGF2YWlsYWJsZSBmdW5jdGlvbi5cbiAqXG4gKiBNZXRob2QgZm9yIHNlcmlhbGl6aW5nIGNvbW1vbiBhbmd1bGFyIG9iamVjdHMgKHNjb3BlLCBlbGVtZW50cywgZXRjLi4pIGludG8gc3RyaW5ncywgdXNlZnVsIGZvclxuICogZGVidWdnaW5nLlxuICpcbiAqIFRoaXMgbWV0aG9kIGlzIGFsc28gYXZhaWxhYmxlIG9uIHdpbmRvdywgd2hlcmUgaXQgY2FuIGJlIHVzZWQgdG8gZGlzcGxheSBvYmplY3RzIG9uIGRlYnVnXG4gKiBjb25zb2xlLlxuICpcbiAqIEBwYXJhbSB7Kn0gb2JqZWN0IC0gYW55IG9iamVjdCB0byB0dXJuIGludG8gc3RyaW5nLlxuICogQHJldHVybiB7c3RyaW5nfSBhIHNlcmlhbGl6ZWQgc3RyaW5nIG9mIHRoZSBhcmd1bWVudFxuICovXG5hbmd1bGFyLm1vY2suZHVtcCA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICByZXR1cm4gc2VyaWFsaXplKG9iamVjdCk7XG5cbiAgZnVuY3Rpb24gc2VyaWFsaXplKG9iamVjdCkge1xuICAgIHZhciBvdXQ7XG5cbiAgICBpZiAoYW5ndWxhci5pc0VsZW1lbnQob2JqZWN0KSkge1xuICAgICAgb2JqZWN0ID0gYW5ndWxhci5lbGVtZW50KG9iamVjdCk7XG4gICAgICBvdXQgPSBhbmd1bGFyLmVsZW1lbnQoJzxkaXY+PC9kaXY+Jyk7XG4gICAgICBhbmd1bGFyLmZvckVhY2gob2JqZWN0LCBmdW5jdGlvbihlbGVtZW50KSB7XG4gICAgICAgIG91dC5hcHBlbmQoYW5ndWxhci5lbGVtZW50KGVsZW1lbnQpLmNsb25lKCkpO1xuICAgICAgfSk7XG4gICAgICBvdXQgPSBvdXQuaHRtbCgpO1xuICAgIH0gZWxzZSBpZiAoYW5ndWxhci5pc0FycmF5KG9iamVjdCkpIHtcbiAgICAgIG91dCA9IFtdO1xuICAgICAgYW5ndWxhci5mb3JFYWNoKG9iamVjdCwgZnVuY3Rpb24obykge1xuICAgICAgICBvdXQucHVzaChzZXJpYWxpemUobykpO1xuICAgICAgfSk7XG4gICAgICBvdXQgPSAnWyAnICsgb3V0LmpvaW4oJywgJykgKyAnIF0nO1xuICAgIH0gZWxzZSBpZiAoYW5ndWxhci5pc09iamVjdChvYmplY3QpKSB7XG4gICAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKG9iamVjdC4kZXZhbCkgJiYgYW5ndWxhci5pc0Z1bmN0aW9uKG9iamVjdC4kYXBwbHkpKSB7XG4gICAgICAgIG91dCA9IHNlcmlhbGl6ZVNjb3BlKG9iamVjdCk7XG4gICAgICB9IGVsc2UgaWYgKG9iamVjdCBpbnN0YW5jZW9mIEVycm9yKSB7XG4gICAgICAgIG91dCA9IG9iamVjdC5zdGFjayB8fCAoJycgKyBvYmplY3QubmFtZSArICc6ICcgKyBvYmplY3QubWVzc2FnZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBUT0RPKGkpOiB0aGlzIHByZXZlbnRzIG1ldGhvZHMgYmVpbmcgbG9nZ2VkLFxuICAgICAgICAvLyB3ZSBzaG91bGQgaGF2ZSBhIGJldHRlciB3YXkgdG8gc2VyaWFsaXplIG9iamVjdHNcbiAgICAgICAgb3V0ID0gYW5ndWxhci50b0pzb24ob2JqZWN0LCB0cnVlKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgb3V0ID0gU3RyaW5nKG9iamVjdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG91dDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlcmlhbGl6ZVNjb3BlKHNjb3BlLCBvZmZzZXQpIHtcbiAgICBvZmZzZXQgPSBvZmZzZXQgfHwgICcgICc7XG4gICAgdmFyIGxvZyA9IFtvZmZzZXQgKyAnU2NvcGUoJyArIHNjb3BlLiRpZCArICcpOiB7J107XG4gICAgZm9yICh2YXIga2V5IGluIHNjb3BlKSB7XG4gICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKHNjb3BlLCBrZXkpICYmICFrZXkubWF0Y2goL14oXFwkfHRoaXMpLykpIHtcbiAgICAgICAgbG9nLnB1c2goJyAgJyArIGtleSArICc6ICcgKyBhbmd1bGFyLnRvSnNvbihzY29wZVtrZXldKSk7XG4gICAgICB9XG4gICAgfVxuICAgIHZhciBjaGlsZCA9IHNjb3BlLiQkY2hpbGRIZWFkO1xuICAgIHdoaWxlIChjaGlsZCkge1xuICAgICAgbG9nLnB1c2goc2VyaWFsaXplU2NvcGUoY2hpbGQsIG9mZnNldCArICcgICcpKTtcbiAgICAgIGNoaWxkID0gY2hpbGQuJCRuZXh0U2libGluZztcbiAgICB9XG4gICAgbG9nLnB1c2goJ30nKTtcbiAgICByZXR1cm4gbG9nLmpvaW4oJ1xcbicgKyBvZmZzZXQpO1xuICB9XG59O1xuXG4vKipcbiAqIEBuZ2RvYyBzZXJ2aWNlXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmRcbiAqIEBkZXNjcmlwdGlvblxuICogRmFrZSBIVFRQIGJhY2tlbmQgaW1wbGVtZW50YXRpb24gc3VpdGFibGUgZm9yIHVuaXQgdGVzdGluZyBhcHBsaWNhdGlvbnMgdGhhdCB1c2UgdGhlXG4gKiB7QGxpbmsgbmcuJGh0dHAgJGh0dHAgc2VydmljZX0uXG4gKlxuICogKk5vdGUqOiBGb3IgZmFrZSBIVFRQIGJhY2tlbmQgaW1wbGVtZW50YXRpb24gc3VpdGFibGUgZm9yIGVuZC10by1lbmQgdGVzdGluZyBvciBiYWNrZW5kLWxlc3NcbiAqIGRldmVsb3BtZW50IHBsZWFzZSBzZWUge0BsaW5rIG5nTW9ja0UyRS4kaHR0cEJhY2tlbmQgZTJlICRodHRwQmFja2VuZCBtb2NrfS5cbiAqXG4gKiBEdXJpbmcgdW5pdCB0ZXN0aW5nLCB3ZSB3YW50IG91ciB1bml0IHRlc3RzIHRvIHJ1biBxdWlja2x5IGFuZCBoYXZlIG5vIGV4dGVybmFsIGRlcGVuZGVuY2llcyBzb1xuICogd2UgZG9u4oCZdCB3YW50IHRvIHNlbmQgW1hIUl0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4veG1saHR0cHJlcXVlc3QpIG9yXG4gKiBbSlNPTlBdKGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvSlNPTlApIHJlcXVlc3RzIHRvIGEgcmVhbCBzZXJ2ZXIuIEFsbCB3ZSByZWFsbHkgbmVlZCBpc1xuICogdG8gdmVyaWZ5IHdoZXRoZXIgYSBjZXJ0YWluIHJlcXVlc3QgaGFzIGJlZW4gc2VudCBvciBub3QsIG9yIGFsdGVybmF0aXZlbHkganVzdCBsZXQgdGhlXG4gKiBhcHBsaWNhdGlvbiBtYWtlIHJlcXVlc3RzLCByZXNwb25kIHdpdGggcHJlLXRyYWluZWQgcmVzcG9uc2VzIGFuZCBhc3NlcnQgdGhhdCB0aGUgZW5kIHJlc3VsdCBpc1xuICogd2hhdCB3ZSBleHBlY3QgaXQgdG8gYmUuXG4gKlxuICogVGhpcyBtb2NrIGltcGxlbWVudGF0aW9uIGNhbiBiZSB1c2VkIHRvIHJlc3BvbmQgd2l0aCBzdGF0aWMgb3IgZHluYW1pYyByZXNwb25zZXMgdmlhIHRoZVxuICogYGV4cGVjdGAgYW5kIGB3aGVuYCBhcGlzIGFuZCB0aGVpciBzaG9ydGN1dHMgKGBleHBlY3RHRVRgLCBgd2hlblBPU1RgLCBldGMpLlxuICpcbiAqIFdoZW4gYW4gQW5ndWxhciBhcHBsaWNhdGlvbiBuZWVkcyBzb21lIGRhdGEgZnJvbSBhIHNlcnZlciwgaXQgY2FsbHMgdGhlICRodHRwIHNlcnZpY2UsIHdoaWNoXG4gKiBzZW5kcyB0aGUgcmVxdWVzdCB0byBhIHJlYWwgc2VydmVyIHVzaW5nICRodHRwQmFja2VuZCBzZXJ2aWNlLiBXaXRoIGRlcGVuZGVuY3kgaW5qZWN0aW9uLCBpdCBpc1xuICogZWFzeSB0byBpbmplY3QgJGh0dHBCYWNrZW5kIG1vY2sgKHdoaWNoIGhhcyB0aGUgc2FtZSBBUEkgYXMgJGh0dHBCYWNrZW5kKSBhbmQgdXNlIGl0IHRvIHZlcmlmeVxuICogdGhlIHJlcXVlc3RzIGFuZCByZXNwb25kIHdpdGggc29tZSB0ZXN0aW5nIGRhdGEgd2l0aG91dCBzZW5kaW5nIGEgcmVxdWVzdCB0byBhIHJlYWwgc2VydmVyLlxuICpcbiAqIFRoZXJlIGFyZSB0d28gd2F5cyB0byBzcGVjaWZ5IHdoYXQgdGVzdCBkYXRhIHNob3VsZCBiZSByZXR1cm5lZCBhcyBodHRwIHJlc3BvbnNlcyBieSB0aGUgbW9ja1xuICogYmFja2VuZCB3aGVuIHRoZSBjb2RlIHVuZGVyIHRlc3QgbWFrZXMgaHR0cCByZXF1ZXN0czpcbiAqXG4gKiAtIGAkaHR0cEJhY2tlbmQuZXhwZWN0YCAtIHNwZWNpZmllcyBhIHJlcXVlc3QgZXhwZWN0YXRpb25cbiAqIC0gYCRodHRwQmFja2VuZC53aGVuYCAtIHNwZWNpZmllcyBhIGJhY2tlbmQgZGVmaW5pdGlvblxuICpcbiAqXG4gKiAjIFJlcXVlc3QgRXhwZWN0YXRpb25zIHZzIEJhY2tlbmQgRGVmaW5pdGlvbnNcbiAqXG4gKiBSZXF1ZXN0IGV4cGVjdGF0aW9ucyBwcm92aWRlIGEgd2F5IHRvIG1ha2UgYXNzZXJ0aW9ucyBhYm91dCByZXF1ZXN0cyBtYWRlIGJ5IHRoZSBhcHBsaWNhdGlvbiBhbmRcbiAqIHRvIGRlZmluZSByZXNwb25zZXMgZm9yIHRob3NlIHJlcXVlc3RzLiBUaGUgdGVzdCB3aWxsIGZhaWwgaWYgdGhlIGV4cGVjdGVkIHJlcXVlc3RzIGFyZSBub3QgbWFkZVxuICogb3IgdGhleSBhcmUgbWFkZSBpbiB0aGUgd3Jvbmcgb3JkZXIuXG4gKlxuICogQmFja2VuZCBkZWZpbml0aW9ucyBhbGxvdyB5b3UgdG8gZGVmaW5lIGEgZmFrZSBiYWNrZW5kIGZvciB5b3VyIGFwcGxpY2F0aW9uIHdoaWNoIGRvZXNuJ3QgYXNzZXJ0XG4gKiBpZiBhIHBhcnRpY3VsYXIgcmVxdWVzdCB3YXMgbWFkZSBvciBub3QsIGl0IGp1c3QgcmV0dXJucyBhIHRyYWluZWQgcmVzcG9uc2UgaWYgYSByZXF1ZXN0IGlzIG1hZGUuXG4gKiBUaGUgdGVzdCB3aWxsIHBhc3Mgd2hldGhlciBvciBub3QgdGhlIHJlcXVlc3QgZ2V0cyBtYWRlIGR1cmluZyB0ZXN0aW5nLlxuICpcbiAqXG4gKiA8dGFibGUgY2xhc3M9XCJ0YWJsZVwiPlxuICogICA8dHI+PHRoIHdpZHRoPVwiMjIwcHhcIj48L3RoPjx0aD5SZXF1ZXN0IGV4cGVjdGF0aW9uczwvdGg+PHRoPkJhY2tlbmQgZGVmaW5pdGlvbnM8L3RoPjwvdHI+XG4gKiAgIDx0cj5cbiAqICAgICA8dGg+U3ludGF4PC90aD5cbiAqICAgICA8dGQ+LmV4cGVjdCguLi4pLnJlc3BvbmQoLi4uKTwvdGQ+XG4gKiAgICAgPHRkPi53aGVuKC4uLikucmVzcG9uZCguLi4pPC90ZD5cbiAqICAgPC90cj5cbiAqICAgPHRyPlxuICogICAgIDx0aD5UeXBpY2FsIHVzYWdlPC90aD5cbiAqICAgICA8dGQ+c3RyaWN0IHVuaXQgdGVzdHM8L3RkPlxuICogICAgIDx0ZD5sb29zZSAoYmxhY2stYm94KSB1bml0IHRlc3Rpbmc8L3RkPlxuICogICA8L3RyPlxuICogICA8dHI+XG4gKiAgICAgPHRoPkZ1bGZpbGxzIG11bHRpcGxlIHJlcXVlc3RzPC90aD5cbiAqICAgICA8dGQ+Tk88L3RkPlxuICogICAgIDx0ZD5ZRVM8L3RkPlxuICogICA8L3RyPlxuICogICA8dHI+XG4gKiAgICAgPHRoPk9yZGVyIG9mIHJlcXVlc3RzIG1hdHRlcnM8L3RoPlxuICogICAgIDx0ZD5ZRVM8L3RkPlxuICogICAgIDx0ZD5OTzwvdGQ+XG4gKiAgIDwvdHI+XG4gKiAgIDx0cj5cbiAqICAgICA8dGg+UmVxdWVzdCByZXF1aXJlZDwvdGg+XG4gKiAgICAgPHRkPllFUzwvdGQ+XG4gKiAgICAgPHRkPk5PPC90ZD5cbiAqICAgPC90cj5cbiAqICAgPHRyPlxuICogICAgIDx0aD5SZXNwb25zZSByZXF1aXJlZDwvdGg+XG4gKiAgICAgPHRkPm9wdGlvbmFsIChzZWUgYmVsb3cpPC90ZD5cbiAqICAgICA8dGQ+WUVTPC90ZD5cbiAqICAgPC90cj5cbiAqIDwvdGFibGU+XG4gKlxuICogSW4gY2FzZXMgd2hlcmUgYm90aCBiYWNrZW5kIGRlZmluaXRpb25zIGFuZCByZXF1ZXN0IGV4cGVjdGF0aW9ucyBhcmUgc3BlY2lmaWVkIGR1cmluZyB1bml0XG4gKiB0ZXN0aW5nLCB0aGUgcmVxdWVzdCBleHBlY3RhdGlvbnMgYXJlIGV2YWx1YXRlZCBmaXJzdC5cbiAqXG4gKiBJZiBhIHJlcXVlc3QgZXhwZWN0YXRpb24gaGFzIG5vIHJlc3BvbnNlIHNwZWNpZmllZCwgdGhlIGFsZ29yaXRobSB3aWxsIHNlYXJjaCB5b3VyIGJhY2tlbmRcbiAqIGRlZmluaXRpb25zIGZvciBhbiBhcHByb3ByaWF0ZSByZXNwb25zZS5cbiAqXG4gKiBJZiBhIHJlcXVlc3QgZGlkbid0IG1hdGNoIGFueSBleHBlY3RhdGlvbiBvciBpZiB0aGUgZXhwZWN0YXRpb24gZG9lc24ndCBoYXZlIHRoZSByZXNwb25zZVxuICogZGVmaW5lZCwgdGhlIGJhY2tlbmQgZGVmaW5pdGlvbnMgYXJlIGV2YWx1YXRlZCBpbiBzZXF1ZW50aWFsIG9yZGVyIHRvIHNlZSBpZiBhbnkgb2YgdGhlbSBtYXRjaFxuICogdGhlIHJlcXVlc3QuIFRoZSByZXNwb25zZSBmcm9tIHRoZSBmaXJzdCBtYXRjaGVkIGRlZmluaXRpb24gaXMgcmV0dXJuZWQuXG4gKlxuICpcbiAqICMgRmx1c2hpbmcgSFRUUCByZXF1ZXN0c1xuICpcbiAqIFRoZSAkaHR0cEJhY2tlbmQgdXNlZCBpbiBwcm9kdWN0aW9uIGFsd2F5cyByZXNwb25kcyB0byByZXF1ZXN0cyBhc3luY2hyb25vdXNseS4gSWYgd2UgcHJlc2VydmVkXG4gKiB0aGlzIGJlaGF2aW9yIGluIHVuaXQgdGVzdGluZywgd2UnZCBoYXZlIHRvIGNyZWF0ZSBhc3luYyB1bml0IHRlc3RzLCB3aGljaCBhcmUgaGFyZCB0byB3cml0ZSxcbiAqIHRvIGZvbGxvdyBhbmQgdG8gbWFpbnRhaW4uIEJ1dCBuZWl0aGVyIGNhbiB0aGUgdGVzdGluZyBtb2NrIHJlc3BvbmQgc3luY2hyb25vdXNseTsgdGhhdCB3b3VsZFxuICogY2hhbmdlIHRoZSBleGVjdXRpb24gb2YgdGhlIGNvZGUgdW5kZXIgdGVzdC4gRm9yIHRoaXMgcmVhc29uLCB0aGUgbW9jayAkaHR0cEJhY2tlbmQgaGFzIGFcbiAqIGBmbHVzaCgpYCBtZXRob2QsIHdoaWNoIGFsbG93cyB0aGUgdGVzdCB0byBleHBsaWNpdGx5IGZsdXNoIHBlbmRpbmcgcmVxdWVzdHMuIFRoaXMgcHJlc2VydmVzXG4gKiB0aGUgYXN5bmMgYXBpIG9mIHRoZSBiYWNrZW5kLCB3aGlsZSBhbGxvd2luZyB0aGUgdGVzdCB0byBleGVjdXRlIHN5bmNocm9ub3VzbHkuXG4gKlxuICpcbiAqICMgVW5pdCB0ZXN0aW5nIHdpdGggbW9jayAkaHR0cEJhY2tlbmRcbiAqIFRoZSBmb2xsb3dpbmcgY29kZSBzaG93cyBob3cgdG8gc2V0dXAgYW5kIHVzZSB0aGUgbW9jayBiYWNrZW5kIHdoZW4gdW5pdCB0ZXN0aW5nIGEgY29udHJvbGxlci5cbiAqIEZpcnN0IHdlIGNyZWF0ZSB0aGUgY29udHJvbGxlciB1bmRlciB0ZXN0OlxuICpcbiAgYGBganNcbiAgLy8gVGhlIG1vZHVsZSBjb2RlXG4gIGFuZ3VsYXJcbiAgICAubW9kdWxlKCdNeUFwcCcsIFtdKVxuICAgIC5jb250cm9sbGVyKCdNeUNvbnRyb2xsZXInLCBNeUNvbnRyb2xsZXIpO1xuXG4gIC8vIFRoZSBjb250cm9sbGVyIGNvZGVcbiAgZnVuY3Rpb24gTXlDb250cm9sbGVyKCRzY29wZSwgJGh0dHApIHtcbiAgICB2YXIgYXV0aFRva2VuO1xuXG4gICAgJGh0dHAuZ2V0KCcvYXV0aC5weScpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSwgc3RhdHVzLCBoZWFkZXJzKSB7XG4gICAgICBhdXRoVG9rZW4gPSBoZWFkZXJzKCdBLVRva2VuJyk7XG4gICAgICAkc2NvcGUudXNlciA9IGRhdGE7XG4gICAgfSk7XG5cbiAgICAkc2NvcGUuc2F2ZU1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICB2YXIgaGVhZGVycyA9IHsgJ0F1dGhvcml6YXRpb24nOiBhdXRoVG9rZW4gfTtcbiAgICAgICRzY29wZS5zdGF0dXMgPSAnU2F2aW5nLi4uJztcblxuICAgICAgJGh0dHAucG9zdCgnL2FkZC1tc2cucHknLCBtZXNzYWdlLCB7IGhlYWRlcnM6IGhlYWRlcnMgfSApLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgJHNjb3BlLnN0YXR1cyA9ICcnO1xuICAgICAgfSkuZXJyb3IoZnVuY3Rpb24oKSB7XG4gICAgICAgICRzY29wZS5zdGF0dXMgPSAnRVJST1IhJztcbiAgICAgIH0pO1xuICAgIH07XG4gIH1cbiAgYGBgXG4gKlxuICogTm93IHdlIHNldHVwIHRoZSBtb2NrIGJhY2tlbmQgYW5kIGNyZWF0ZSB0aGUgdGVzdCBzcGVjczpcbiAqXG4gIGBgYGpzXG4gICAgLy8gdGVzdGluZyBjb250cm9sbGVyXG4gICAgZGVzY3JpYmUoJ015Q29udHJvbGxlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgIHZhciAkaHR0cEJhY2tlbmQsICRyb290U2NvcGUsIGNyZWF0ZUNvbnRyb2xsZXIsIGF1dGhSZXF1ZXN0SGFuZGxlcjtcblxuICAgICAgIC8vIFNldCB1cCB0aGUgbW9kdWxlXG4gICAgICAgYmVmb3JlRWFjaChtb2R1bGUoJ015QXBwJykpO1xuXG4gICAgICAgYmVmb3JlRWFjaChpbmplY3QoZnVuY3Rpb24oJGluamVjdG9yKSB7XG4gICAgICAgICAvLyBTZXQgdXAgdGhlIG1vY2sgaHR0cCBzZXJ2aWNlIHJlc3BvbnNlc1xuICAgICAgICAgJGh0dHBCYWNrZW5kID0gJGluamVjdG9yLmdldCgnJGh0dHBCYWNrZW5kJyk7XG4gICAgICAgICAvLyBiYWNrZW5kIGRlZmluaXRpb24gY29tbW9uIGZvciBhbGwgdGVzdHNcbiAgICAgICAgIGF1dGhSZXF1ZXN0SGFuZGxlciA9ICRodHRwQmFja2VuZC53aGVuKCdHRVQnLCAnL2F1dGgucHknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVzcG9uZCh7dXNlcklkOiAndXNlclgnfSwgeydBLVRva2VuJzogJ3h4eCd9KTtcblxuICAgICAgICAgLy8gR2V0IGhvbGQgb2YgYSBzY29wZSAoaS5lLiB0aGUgcm9vdCBzY29wZSlcbiAgICAgICAgICRyb290U2NvcGUgPSAkaW5qZWN0b3IuZ2V0KCckcm9vdFNjb3BlJyk7XG4gICAgICAgICAvLyBUaGUgJGNvbnRyb2xsZXIgc2VydmljZSBpcyB1c2VkIHRvIGNyZWF0ZSBpbnN0YW5jZXMgb2YgY29udHJvbGxlcnNcbiAgICAgICAgIHZhciAkY29udHJvbGxlciA9ICRpbmplY3Rvci5nZXQoJyRjb250cm9sbGVyJyk7XG5cbiAgICAgICAgIGNyZWF0ZUNvbnRyb2xsZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgcmV0dXJuICRjb250cm9sbGVyKCdNeUNvbnRyb2xsZXInLCB7JyRzY29wZScgOiAkcm9vdFNjb3BlIH0pO1xuICAgICAgICAgfTtcbiAgICAgICB9KSk7XG5cblxuICAgICAgIGFmdGVyRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICRodHRwQmFja2VuZC52ZXJpZnlOb091dHN0YW5kaW5nRXhwZWN0YXRpb24oKTtcbiAgICAgICAgICRodHRwQmFja2VuZC52ZXJpZnlOb091dHN0YW5kaW5nUmVxdWVzdCgpO1xuICAgICAgIH0pO1xuXG5cbiAgICAgICBpdCgnc2hvdWxkIGZldGNoIGF1dGhlbnRpY2F0aW9uIHRva2VuJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAkaHR0cEJhY2tlbmQuZXhwZWN0R0VUKCcvYXV0aC5weScpO1xuICAgICAgICAgdmFyIGNvbnRyb2xsZXIgPSBjcmVhdGVDb250cm9sbGVyKCk7XG4gICAgICAgICAkaHR0cEJhY2tlbmQuZmx1c2goKTtcbiAgICAgICB9KTtcblxuXG4gICAgICAgaXQoJ3Nob3VsZCBmYWlsIGF1dGhlbnRpY2F0aW9uJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgIC8vIE5vdGljZSBob3cgeW91IGNhbiBjaGFuZ2UgdGhlIHJlc3BvbnNlIGV2ZW4gYWZ0ZXIgaXQgd2FzIHNldFxuICAgICAgICAgYXV0aFJlcXVlc3RIYW5kbGVyLnJlc3BvbmQoNDAxLCAnJyk7XG5cbiAgICAgICAgICRodHRwQmFja2VuZC5leHBlY3RHRVQoJy9hdXRoLnB5Jyk7XG4gICAgICAgICB2YXIgY29udHJvbGxlciA9IGNyZWF0ZUNvbnRyb2xsZXIoKTtcbiAgICAgICAgICRodHRwQmFja2VuZC5mbHVzaCgpO1xuICAgICAgICAgZXhwZWN0KCRyb290U2NvcGUuc3RhdHVzKS50b0JlKCdGYWlsZWQuLi4nKTtcbiAgICAgICB9KTtcblxuXG4gICAgICAgaXQoJ3Nob3VsZCBzZW5kIG1zZyB0byBzZXJ2ZXInLCBmdW5jdGlvbigpIHtcbiAgICAgICAgIHZhciBjb250cm9sbGVyID0gY3JlYXRlQ29udHJvbGxlcigpO1xuICAgICAgICAgJGh0dHBCYWNrZW5kLmZsdXNoKCk7XG5cbiAgICAgICAgIC8vIG5vdyB5b3UgZG9u4oCZdCBjYXJlIGFib3V0IHRoZSBhdXRoZW50aWNhdGlvbiwgYnV0XG4gICAgICAgICAvLyB0aGUgY29udHJvbGxlciB3aWxsIHN0aWxsIHNlbmQgdGhlIHJlcXVlc3QgYW5kXG4gICAgICAgICAvLyAkaHR0cEJhY2tlbmQgd2lsbCByZXNwb25kIHdpdGhvdXQgeW91IGhhdmluZyB0b1xuICAgICAgICAgLy8gc3BlY2lmeSB0aGUgZXhwZWN0YXRpb24gYW5kIHJlc3BvbnNlIGZvciB0aGlzIHJlcXVlc3RcblxuICAgICAgICAgJGh0dHBCYWNrZW5kLmV4cGVjdFBPU1QoJy9hZGQtbXNnLnB5JywgJ21lc3NhZ2UgY29udGVudCcpLnJlc3BvbmQoMjAxLCAnJyk7XG4gICAgICAgICAkcm9vdFNjb3BlLnNhdmVNZXNzYWdlKCdtZXNzYWdlIGNvbnRlbnQnKTtcbiAgICAgICAgIGV4cGVjdCgkcm9vdFNjb3BlLnN0YXR1cykudG9CZSgnU2F2aW5nLi4uJyk7XG4gICAgICAgICAkaHR0cEJhY2tlbmQuZmx1c2goKTtcbiAgICAgICAgIGV4cGVjdCgkcm9vdFNjb3BlLnN0YXR1cykudG9CZSgnJyk7XG4gICAgICAgfSk7XG5cblxuICAgICAgIGl0KCdzaG91bGQgc2VuZCBhdXRoIGhlYWRlcicsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgdmFyIGNvbnRyb2xsZXIgPSBjcmVhdGVDb250cm9sbGVyKCk7XG4gICAgICAgICAkaHR0cEJhY2tlbmQuZmx1c2goKTtcblxuICAgICAgICAgJGh0dHBCYWNrZW5kLmV4cGVjdFBPU1QoJy9hZGQtbXNnLnB5JywgdW5kZWZpbmVkLCBmdW5jdGlvbihoZWFkZXJzKSB7XG4gICAgICAgICAgIC8vIGNoZWNrIGlmIHRoZSBoZWFkZXIgd2FzIHNlbnQsIGlmIGl0IHdhc24ndCB0aGUgZXhwZWN0YXRpb24gd29uJ3RcbiAgICAgICAgICAgLy8gbWF0Y2ggdGhlIHJlcXVlc3QgYW5kIHRoZSB0ZXN0IHdpbGwgZmFpbFxuICAgICAgICAgICByZXR1cm4gaGVhZGVyc1snQXV0aG9yaXphdGlvbiddID09ICd4eHgnO1xuICAgICAgICAgfSkucmVzcG9uZCgyMDEsICcnKTtcblxuICAgICAgICAgJHJvb3RTY29wZS5zYXZlTWVzc2FnZSgnd2hhdGV2ZXInKTtcbiAgICAgICAgICRodHRwQmFja2VuZC5mbHVzaCgpO1xuICAgICAgIH0pO1xuICAgIH0pO1xuICAgYGBgXG4gKi9cbmFuZ3VsYXIubW9jay4kSHR0cEJhY2tlbmRQcm92aWRlciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLiRnZXQgPSBbJyRyb290U2NvcGUnLCAnJHRpbWVvdXQnLCBjcmVhdGVIdHRwQmFja2VuZE1vY2tdO1xufTtcblxuLyoqXG4gKiBHZW5lcmFsIGZhY3RvcnkgZnVuY3Rpb24gZm9yICRodHRwQmFja2VuZCBtb2NrLlxuICogUmV0dXJucyBpbnN0YW5jZSBmb3IgdW5pdCB0ZXN0aW5nICh3aGVuIG5vIGFyZ3VtZW50cyBzcGVjaWZpZWQpOlxuICogICAtIHBhc3NpbmcgdGhyb3VnaCBpcyBkaXNhYmxlZFxuICogICAtIGF1dG8gZmx1c2hpbmcgaXMgZGlzYWJsZWRcbiAqXG4gKiBSZXR1cm5zIGluc3RhbmNlIGZvciBlMmUgdGVzdGluZyAod2hlbiBgJGRlbGVnYXRlYCBhbmQgYCRicm93c2VyYCBzcGVjaWZpZWQpOlxuICogICAtIHBhc3NpbmcgdGhyb3VnaCAoZGVsZWdhdGluZyByZXF1ZXN0IHRvIHJlYWwgYmFja2VuZCkgaXMgZW5hYmxlZFxuICogICAtIGF1dG8gZmx1c2hpbmcgaXMgZW5hYmxlZFxuICpcbiAqIEBwYXJhbSB7T2JqZWN0PX0gJGRlbGVnYXRlIFJlYWwgJGh0dHBCYWNrZW5kIGluc3RhbmNlIChhbGxvdyBwYXNzaW5nIHRocm91Z2ggaWYgc3BlY2lmaWVkKVxuICogQHBhcmFtIHtPYmplY3Q9fSAkYnJvd3NlciBBdXRvLWZsdXNoaW5nIGVuYWJsZWQgaWYgc3BlY2lmaWVkXG4gKiBAcmV0dXJuIHtPYmplY3R9IEluc3RhbmNlIG9mICRodHRwQmFja2VuZCBtb2NrXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUh0dHBCYWNrZW5kTW9jaygkcm9vdFNjb3BlLCAkdGltZW91dCwgJGRlbGVnYXRlLCAkYnJvd3Nlcikge1xuICB2YXIgZGVmaW5pdGlvbnMgPSBbXSxcbiAgICAgIGV4cGVjdGF0aW9ucyA9IFtdLFxuICAgICAgcmVzcG9uc2VzID0gW10sXG4gICAgICByZXNwb25zZXNQdXNoID0gYW5ndWxhci5iaW5kKHJlc3BvbnNlcywgcmVzcG9uc2VzLnB1c2gpLFxuICAgICAgY29weSA9IGFuZ3VsYXIuY29weTtcblxuICBmdW5jdGlvbiBjcmVhdGVSZXNwb25zZShzdGF0dXMsIGRhdGEsIGhlYWRlcnMsIHN0YXR1c1RleHQpIHtcbiAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKHN0YXR1cykpIHJldHVybiBzdGF0dXM7XG5cbiAgICByZXR1cm4gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gYW5ndWxhci5pc051bWJlcihzdGF0dXMpXG4gICAgICAgICAgPyBbc3RhdHVzLCBkYXRhLCBoZWFkZXJzLCBzdGF0dXNUZXh0XVxuICAgICAgICAgIDogWzIwMCwgc3RhdHVzLCBkYXRhLCBoZWFkZXJzXTtcbiAgICB9O1xuICB9XG5cbiAgLy8gVE9ETyh2b2p0YSk6IGNoYW5nZSBwYXJhbXMgdG86IG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzLCBjYWxsYmFja1xuICBmdW5jdGlvbiAkaHR0cEJhY2tlbmQobWV0aG9kLCB1cmwsIGRhdGEsIGNhbGxiYWNrLCBoZWFkZXJzLCB0aW1lb3V0LCB3aXRoQ3JlZGVudGlhbHMpIHtcbiAgICB2YXIgeGhyID0gbmV3IE1vY2tYaHIoKSxcbiAgICAgICAgZXhwZWN0YXRpb24gPSBleHBlY3RhdGlvbnNbMF0sXG4gICAgICAgIHdhc0V4cGVjdGVkID0gZmFsc2U7XG5cbiAgICBmdW5jdGlvbiBwcmV0dHlQcmludChkYXRhKSB7XG4gICAgICByZXR1cm4gKGFuZ3VsYXIuaXNTdHJpbmcoZGF0YSkgfHwgYW5ndWxhci5pc0Z1bmN0aW9uKGRhdGEpIHx8IGRhdGEgaW5zdGFuY2VvZiBSZWdFeHApXG4gICAgICAgICAgPyBkYXRhXG4gICAgICAgICAgOiBhbmd1bGFyLnRvSnNvbihkYXRhKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB3cmFwUmVzcG9uc2Uod3JhcHBlZCkge1xuICAgICAgaWYgKCEkYnJvd3NlciAmJiB0aW1lb3V0KSB7XG4gICAgICAgIHRpbWVvdXQudGhlbiA/IHRpbWVvdXQudGhlbihoYW5kbGVUaW1lb3V0KSA6ICR0aW1lb3V0KGhhbmRsZVRpbWVvdXQsIHRpbWVvdXQpO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gaGFuZGxlUmVzcG9uc2U7XG5cbiAgICAgIGZ1bmN0aW9uIGhhbmRsZVJlc3BvbnNlKCkge1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSB3cmFwcGVkLnJlc3BvbnNlKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKTtcbiAgICAgICAgeGhyLiQkcmVzcEhlYWRlcnMgPSByZXNwb25zZVsyXTtcbiAgICAgICAgY2FsbGJhY2soY29weShyZXNwb25zZVswXSksIGNvcHkocmVzcG9uc2VbMV0pLCB4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCksXG4gICAgICAgICAgICAgICAgIGNvcHkocmVzcG9uc2VbM10gfHwgJycpKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gaGFuZGxlVGltZW91dCgpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGlpID0gcmVzcG9uc2VzLmxlbmd0aDsgaSA8IGlpOyBpKyspIHtcbiAgICAgICAgICBpZiAocmVzcG9uc2VzW2ldID09PSBoYW5kbGVSZXNwb25zZSkge1xuICAgICAgICAgICAgcmVzcG9uc2VzLnNwbGljZShpLCAxKTtcbiAgICAgICAgICAgIGNhbGxiYWNrKC0xLCB1bmRlZmluZWQsICcnKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChleHBlY3RhdGlvbiAmJiBleHBlY3RhdGlvbi5tYXRjaChtZXRob2QsIHVybCkpIHtcbiAgICAgIGlmICghZXhwZWN0YXRpb24ubWF0Y2hEYXRhKGRhdGEpKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignRXhwZWN0ZWQgJyArIGV4cGVjdGF0aW9uICsgJyB3aXRoIGRpZmZlcmVudCBkYXRhXFxuJyArXG4gICAgICAgICAgICAnRVhQRUNURUQ6ICcgKyBwcmV0dHlQcmludChleHBlY3RhdGlvbi5kYXRhKSArICdcXG5HT1Q6ICAgICAgJyArIGRhdGEpO1xuICAgICAgfVxuXG4gICAgICBpZiAoIWV4cGVjdGF0aW9uLm1hdGNoSGVhZGVycyhoZWFkZXJzKSkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0V4cGVjdGVkICcgKyBleHBlY3RhdGlvbiArICcgd2l0aCBkaWZmZXJlbnQgaGVhZGVyc1xcbicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0VYUEVDVEVEOiAnICsgcHJldHR5UHJpbnQoZXhwZWN0YXRpb24uaGVhZGVycykgKyAnXFxuR09UOiAgICAgICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJldHR5UHJpbnQoaGVhZGVycykpO1xuICAgICAgfVxuXG4gICAgICBleHBlY3RhdGlvbnMuc2hpZnQoKTtcblxuICAgICAgaWYgKGV4cGVjdGF0aW9uLnJlc3BvbnNlKSB7XG4gICAgICAgIHJlc3BvbnNlcy5wdXNoKHdyYXBSZXNwb25zZShleHBlY3RhdGlvbikpO1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB3YXNFeHBlY3RlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgdmFyIGkgPSAtMSwgZGVmaW5pdGlvbjtcbiAgICB3aGlsZSAoKGRlZmluaXRpb24gPSBkZWZpbml0aW9uc1srK2ldKSkge1xuICAgICAgaWYgKGRlZmluaXRpb24ubWF0Y2gobWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMgfHwge30pKSB7XG4gICAgICAgIGlmIChkZWZpbml0aW9uLnJlc3BvbnNlKSB7XG4gICAgICAgICAgLy8gaWYgJGJyb3dzZXIgc3BlY2lmaWVkLCB3ZSBkbyBhdXRvIGZsdXNoIGFsbCByZXF1ZXN0c1xuICAgICAgICAgICgkYnJvd3NlciA/ICRicm93c2VyLmRlZmVyIDogcmVzcG9uc2VzUHVzaCkod3JhcFJlc3BvbnNlKGRlZmluaXRpb24pKTtcbiAgICAgICAgfSBlbHNlIGlmIChkZWZpbml0aW9uLnBhc3NUaHJvdWdoKSB7XG4gICAgICAgICAgJGRlbGVnYXRlKG1ldGhvZCwgdXJsLCBkYXRhLCBjYWxsYmFjaywgaGVhZGVycywgdGltZW91dCwgd2l0aENyZWRlbnRpYWxzKTtcbiAgICAgICAgfSBlbHNlIHRocm93IG5ldyBFcnJvcignTm8gcmVzcG9uc2UgZGVmaW5lZCAhJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhyb3cgd2FzRXhwZWN0ZWQgP1xuICAgICAgICBuZXcgRXJyb3IoJ05vIHJlc3BvbnNlIGRlZmluZWQgIScpIDpcbiAgICAgICAgbmV3IEVycm9yKCdVbmV4cGVjdGVkIHJlcXVlc3Q6ICcgKyBtZXRob2QgKyAnICcgKyB1cmwgKyAnXFxuJyArXG4gICAgICAgICAgICAgICAgICAoZXhwZWN0YXRpb24gPyAnRXhwZWN0ZWQgJyArIGV4cGVjdGF0aW9uIDogJ05vIG1vcmUgcmVxdWVzdCBleHBlY3RlZCcpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCBIVFRQIG1ldGhvZC5cbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpKT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlc1xuICAgKiAgIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQuXG4gICAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgaHR0cCBoZWFkZXJcbiAgICogICBvYmplY3QgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgaGVhZGVycyBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogICByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqICAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKlxuICAgKiAgLSByZXNwb25kIOKAk1xuICAgKiAgICAgIGB7ZnVuY3Rpb24oW3N0YXR1cyxdIGRhdGFbLCBoZWFkZXJzLCBzdGF0dXNUZXh0XSlcbiAgICogICAgICB8IGZ1bmN0aW9uKGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKX1gXG4gICAqICAgIOKAkyBUaGUgcmVzcG9uZCBtZXRob2QgdGFrZXMgYSBzZXQgb2Ygc3RhdGljIGRhdGEgdG8gYmUgcmV0dXJuZWQgb3IgYSBmdW5jdGlvbiB0aGF0IGNhblxuICAgKiAgICByZXR1cm4gYW4gYXJyYXkgY29udGFpbmluZyByZXNwb25zZSBzdGF0dXMgKG51bWJlciksIHJlc3BvbnNlIGRhdGEgKHN0cmluZyksIHJlc3BvbnNlXG4gICAqICAgIGhlYWRlcnMgKE9iamVjdCksIGFuZCB0aGUgdGV4dCBmb3IgdGhlIHN0YXR1cyAoc3RyaW5nKS4gVGhlIHJlc3BvbmQgbWV0aG9kIHJldHVybnMgdGhlXG4gICAqICAgIGByZXF1ZXN0SGFuZGxlcmAgb2JqZWN0IGZvciBwb3NzaWJsZSBvdmVycmlkZXMuXG4gICAqL1xuICAkaHR0cEJhY2tlbmQud2hlbiA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKSB7XG4gICAgdmFyIGRlZmluaXRpb24gPSBuZXcgTW9ja0h0dHBFeHBlY3RhdGlvbihtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycyksXG4gICAgICAgIGNoYWluID0ge1xuICAgICAgICAgIHJlc3BvbmQ6IGZ1bmN0aW9uKHN0YXR1cywgZGF0YSwgaGVhZGVycywgc3RhdHVzVGV4dCkge1xuICAgICAgICAgICAgZGVmaW5pdGlvbi5wYXNzVGhyb3VnaCA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgIGRlZmluaXRpb24ucmVzcG9uc2UgPSBjcmVhdGVSZXNwb25zZShzdGF0dXMsIGRhdGEsIGhlYWRlcnMsIHN0YXR1c1RleHQpO1xuICAgICAgICAgICAgcmV0dXJuIGNoYWluO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgIGlmICgkYnJvd3Nlcikge1xuICAgICAgY2hhaW4ucGFzc1Rocm91Z2ggPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZGVmaW5pdGlvbi5yZXNwb25zZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgZGVmaW5pdGlvbi5wYXNzVGhyb3VnaCA9IHRydWU7XG4gICAgICAgIHJldHVybiBjaGFpbjtcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZGVmaW5pdGlvbnMucHVzaChkZWZpbml0aW9uKTtcbiAgICByZXR1cm4gY2hhaW47XG4gIH07XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGh0dHBCYWNrZW5kI3doZW5HRVRcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBHRVQgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAgICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBtZXRob2QgdGhhdCBjb250cm9scyBob3cgYSBtYXRjaGVkXG4gICAqIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkhFQURcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBIRUFEIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoT2JqZWN0fGZ1bmN0aW9uKE9iamVjdCkpPX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqIG9yZGVyIHRvIGNoYW5nZSBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC5cbiAgICovXG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJGh0dHBCYWNrZW5kI3doZW5ERUxFVEVcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBERUxFVEUgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAgICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBtZXRob2QgdGhhdCBjb250cm9scyBob3cgYSBtYXRjaGVkXG4gICAqIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlblBPU1RcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBQT1NUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpKT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlc1xuICAgKiAgIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQuXG4gICAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuUFVUXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgUFVUIHJlcXVlc3RzLiAgRm9yIG1vcmUgaW5mbyBzZWUgYHdoZW4oKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhIHVybFxuICAgKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaGVzIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gICAqIEBwYXJhbSB7KHN0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKSk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5IG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXNcbiAgICogICBkYXRhIHN0cmluZyBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSBkYXRhIGlzIGFzIGV4cGVjdGVkLlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAgICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBtZXRob2QgdGhhdCBjb250cm9scyBob3cgYSBtYXRjaGVkXG4gICAqIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkpTT05QXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgSlNPTlAgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuICBjcmVhdGVTaG9ydE1ldGhvZHMoJ3doZW4nKTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbi5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCBIVFRQIG1ldGhvZC5cbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfE9iamVjdCk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5IG9yIGZ1bmN0aW9uIHRoYXRcbiAgICogIHJlY2VpdmVzIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQsIG9yIE9iamVjdCBpZiByZXF1ZXN0IGJvZHlcbiAgICogIGlzIGluIEpTT04gZm9ybWF0LlxuICAgKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycyBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGh0dHAgaGVhZGVyXG4gICAqICAgb2JqZWN0IGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGhlYWRlcnMgbWF0Y2ggdGhlIGN1cnJlbnQgZXhwZWN0YXRpb24uXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKlxuICAgKiAgLSByZXNwb25kIOKAk1xuICAgKiAgICBge2Z1bmN0aW9uKFtzdGF0dXMsXSBkYXRhWywgaGVhZGVycywgc3RhdHVzVGV4dF0pXG4gICAqICAgIHwgZnVuY3Rpb24oZnVuY3Rpb24obWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMpfWBcbiAgICogICAg4oCTIFRoZSByZXNwb25kIG1ldGhvZCB0YWtlcyBhIHNldCBvZiBzdGF0aWMgZGF0YSB0byBiZSByZXR1cm5lZCBvciBhIGZ1bmN0aW9uIHRoYXQgY2FuXG4gICAqICAgIHJldHVybiBhbiBhcnJheSBjb250YWluaW5nIHJlc3BvbnNlIHN0YXR1cyAobnVtYmVyKSwgcmVzcG9uc2UgZGF0YSAoc3RyaW5nKSwgcmVzcG9uc2VcbiAgICogICAgaGVhZGVycyAoT2JqZWN0KSwgYW5kIHRoZSB0ZXh0IGZvciB0aGUgc3RhdHVzIChzdHJpbmcpLiBUaGUgcmVzcG9uZCBtZXRob2QgcmV0dXJucyB0aGVcbiAgICogICAgYHJlcXVlc3RIYW5kbGVyYCBvYmplY3QgZm9yIHBvc3NpYmxlIG92ZXJyaWRlcy5cbiAgICovXG4gICRodHRwQmFja2VuZC5leHBlY3QgPSBmdW5jdGlvbihtZXRob2QsIHVybCwgZGF0YSwgaGVhZGVycykge1xuICAgIHZhciBleHBlY3RhdGlvbiA9IG5ldyBNb2NrSHR0cEV4cGVjdGF0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKSxcbiAgICAgICAgY2hhaW4gPSB7XG4gICAgICAgICAgcmVzcG9uZDogZnVuY3Rpb24oc3RhdHVzLCBkYXRhLCBoZWFkZXJzLCBzdGF0dXNUZXh0KSB7XG4gICAgICAgICAgICBleHBlY3RhdGlvbi5yZXNwb25zZSA9IGNyZWF0ZVJlc3BvbnNlKHN0YXR1cywgZGF0YSwgaGVhZGVycywgc3RhdHVzVGV4dCk7XG4gICAgICAgICAgICByZXR1cm4gY2hhaW47XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgZXhwZWN0YXRpb25zLnB1c2goZXhwZWN0YXRpb24pO1xuICAgIHJldHVybiBjaGFpbjtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RHRVRcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgR0VUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0ge09iamVjdD19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogcmVxdWVzdCBpcyBoYW5kbGVkLiBZb3UgY2FuIHNhdmUgdGhpcyBvYmplY3QgZm9yIGxhdGVyIHVzZSBhbmQgaW52b2tlIGByZXNwb25kYCBhZ2FpbiBpblxuICAgKiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuIFNlZSAjZXhwZWN0IGZvciBtb3JlIGluZm8uXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RIRUFEXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKiBDcmVhdGVzIGEgbmV3IHJlcXVlc3QgZXhwZWN0YXRpb24gZm9yIEhFQUQgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGBleHBlY3QoKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhIHVybFxuICAgKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaGVzIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogICBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RERUxFVEVcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgREVMRVRFIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0ge09iamVjdD19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogICByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqICAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjZXhwZWN0UE9TVFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ3JlYXRlcyBhIG5ldyByZXF1ZXN0IGV4cGVjdGF0aW9uIGZvciBQT1NUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl8T2JqZWN0KT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdFxuICAgKiAgcmVjZWl2ZXMgZGF0YSBzdHJpbmcgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgZGF0YSBpcyBhcyBleHBlY3RlZCwgb3IgT2JqZWN0IGlmIHJlcXVlc3QgYm9keVxuICAgKiAgaXMgaW4gSlNPTiBmb3JtYXQuXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogICBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RQVVRcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgUFVUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgZXhwZWN0KClgLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcGFyYW0geyhzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl8T2JqZWN0KT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkgb3IgZnVuY3Rpb24gdGhhdFxuICAgKiAgcmVjZWl2ZXMgZGF0YSBzdHJpbmcgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgZGF0YSBpcyBhcyBleHBlY3RlZCwgb3IgT2JqZWN0IGlmIHJlcXVlc3QgYm9keVxuICAgKiAgaXMgaW4gSlNPTiBmb3JtYXQuXG4gICAqIEBwYXJhbSB7T2JqZWN0PX0gaGVhZGVycyBIVFRQIGhlYWRlcnMuXG4gICAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgbWV0aG9kIHRoYXQgY29udHJvbHMgaG93IGEgbWF0Y2hlZFxuICAgKiAgIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZSBgcmVzcG9uZGAgYWdhaW4gaW5cbiAgICogICBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gICAqL1xuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNleHBlY3RQQVRDSFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ3JlYXRlcyBhIG5ldyByZXF1ZXN0IGV4cGVjdGF0aW9uIGZvciBQQVRDSCByZXF1ZXN0cy4gRm9yIG1vcmUgaW5mbyBzZWUgYGV4cGVjdCgpYC5cbiAgICpcbiAgICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gICAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAgICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfE9iamVjdCk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5IG9yIGZ1bmN0aW9uIHRoYXRcbiAgICogIHJlY2VpdmVzIGRhdGEgc3RyaW5nIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIGRhdGEgaXMgYXMgZXhwZWN0ZWQsIG9yIE9iamVjdCBpZiByZXF1ZXN0IGJvZHlcbiAgICogIGlzIGluIEpTT04gZm9ybWF0LlxuICAgKiBAcGFyYW0ge09iamVjdD19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogICByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqICAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjZXhwZWN0SlNPTlBcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIENyZWF0ZXMgYSBuZXcgcmVxdWVzdCBleHBlY3RhdGlvbiBmb3IgSlNPTlAgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGBleHBlY3QoKWAuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhbiB1cmxcbiAgICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICAgKiBAcmV0dXJucyB7cmVxdWVzdEhhbmRsZXJ9IFJldHVybnMgYW4gb2JqZWN0IHdpdGggYHJlc3BvbmRgIG1ldGhvZCB0aGF0IGNvbnRyb2xzIGhvdyBhIG1hdGNoZWRcbiAgICogICByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2UgYHJlc3BvbmRgIGFnYWluIGluXG4gICAqICAgb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICAgKi9cbiAgY3JlYXRlU2hvcnRNZXRob2RzKCdleHBlY3QnKTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCNmbHVzaFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogRmx1c2hlcyBhbGwgcGVuZGluZyByZXF1ZXN0cyB1c2luZyB0aGUgdHJhaW5lZCByZXNwb25zZXMuXG4gICAqXG4gICAqIEBwYXJhbSB7bnVtYmVyPX0gY291bnQgTnVtYmVyIG9mIHJlc3BvbnNlcyB0byBmbHVzaCAoaW4gdGhlIG9yZGVyIHRoZXkgYXJyaXZlZCkuIElmIHVuZGVmaW5lZCxcbiAgICogICBhbGwgcGVuZGluZyByZXF1ZXN0cyB3aWxsIGJlIGZsdXNoZWQuIElmIHRoZXJlIGFyZSBubyBwZW5kaW5nIHJlcXVlc3RzIHdoZW4gdGhlIGZsdXNoIG1ldGhvZFxuICAgKiAgIGlzIGNhbGxlZCBhbiBleGNlcHRpb24gaXMgdGhyb3duIChhcyB0aGlzIHR5cGljYWxseSBhIHNpZ24gb2YgcHJvZ3JhbW1pbmcgZXJyb3IpLlxuICAgKi9cbiAgJGh0dHBCYWNrZW5kLmZsdXNoID0gZnVuY3Rpb24oY291bnQsIGRpZ2VzdCkge1xuICAgIGlmIChkaWdlc3QgIT09IGZhbHNlKSAkcm9vdFNjb3BlLiRkaWdlc3QoKTtcbiAgICBpZiAoIXJlc3BvbnNlcy5sZW5ndGgpIHRocm93IG5ldyBFcnJvcignTm8gcGVuZGluZyByZXF1ZXN0IHRvIGZsdXNoICEnKTtcblxuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChjb3VudCkgJiYgY291bnQgIT09IG51bGwpIHtcbiAgICAgIHdoaWxlIChjb3VudC0tKSB7XG4gICAgICAgIGlmICghcmVzcG9uc2VzLmxlbmd0aCkgdGhyb3cgbmV3IEVycm9yKCdObyBtb3JlIHBlbmRpbmcgcmVxdWVzdCB0byBmbHVzaCAhJyk7XG4gICAgICAgIHJlc3BvbnNlcy5zaGlmdCgpKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHdoaWxlIChyZXNwb25zZXMubGVuZ3RoKSB7XG4gICAgICAgIHJlc3BvbnNlcy5zaGlmdCgpKCk7XG4gICAgICB9XG4gICAgfVxuICAgICRodHRwQmFja2VuZC52ZXJpZnlOb091dHN0YW5kaW5nRXhwZWN0YXRpb24oZGlnZXN0KTtcbiAgfTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCN2ZXJpZnlOb091dHN0YW5kaW5nRXhwZWN0YXRpb25cbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFZlcmlmaWVzIHRoYXQgYWxsIG9mIHRoZSByZXF1ZXN0cyBkZWZpbmVkIHZpYSB0aGUgYGV4cGVjdGAgYXBpIHdlcmUgbWFkZS4gSWYgYW55IG9mIHRoZVxuICAgKiByZXF1ZXN0cyB3ZXJlIG5vdCBtYWRlLCB2ZXJpZnlOb091dHN0YW5kaW5nRXhwZWN0YXRpb24gdGhyb3dzIGFuIGV4Y2VwdGlvbi5cbiAgICpcbiAgICogVHlwaWNhbGx5LCB5b3Ugd291bGQgY2FsbCB0aGlzIG1ldGhvZCBmb2xsb3dpbmcgZWFjaCB0ZXN0IGNhc2UgdGhhdCBhc3NlcnRzIHJlcXVlc3RzIHVzaW5nIGFuXG4gICAqIFwiYWZ0ZXJFYWNoXCIgY2xhdXNlLlxuICAgKlxuICAgKiBgYGBqc1xuICAgKiAgIGFmdGVyRWFjaCgkaHR0cEJhY2tlbmQudmVyaWZ5Tm9PdXRzdGFuZGluZ0V4cGVjdGF0aW9uKTtcbiAgICogYGBgXG4gICAqL1xuICAkaHR0cEJhY2tlbmQudmVyaWZ5Tm9PdXRzdGFuZGluZ0V4cGVjdGF0aW9uID0gZnVuY3Rpb24oZGlnZXN0KSB7XG4gICAgaWYgKGRpZ2VzdCAhPT0gZmFsc2UpICRyb290U2NvcGUuJGRpZ2VzdCgpO1xuICAgIGlmIChleHBlY3RhdGlvbnMubGVuZ3RoKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vuc2F0aXNmaWVkIHJlcXVlc3RzOiAnICsgZXhwZWN0YXRpb25zLmpvaW4oJywgJykpO1xuICAgIH1cbiAgfTtcblxuXG4gIC8qKlxuICAgKiBAbmdkb2MgbWV0aG9kXG4gICAqIEBuYW1lICRodHRwQmFja2VuZCN2ZXJpZnlOb091dHN0YW5kaW5nUmVxdWVzdFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICogVmVyaWZpZXMgdGhhdCB0aGVyZSBhcmUgbm8gb3V0c3RhbmRpbmcgcmVxdWVzdHMgdGhhdCBuZWVkIHRvIGJlIGZsdXNoZWQuXG4gICAqXG4gICAqIFR5cGljYWxseSwgeW91IHdvdWxkIGNhbGwgdGhpcyBtZXRob2QgZm9sbG93aW5nIGVhY2ggdGVzdCBjYXNlIHRoYXQgYXNzZXJ0cyByZXF1ZXN0cyB1c2luZyBhblxuICAgKiBcImFmdGVyRWFjaFwiIGNsYXVzZS5cbiAgICpcbiAgICogYGBganNcbiAgICogICBhZnRlckVhY2goJGh0dHBCYWNrZW5kLnZlcmlmeU5vT3V0c3RhbmRpbmdSZXF1ZXN0KTtcbiAgICogYGBgXG4gICAqL1xuICAkaHR0cEJhY2tlbmQudmVyaWZ5Tm9PdXRzdGFuZGluZ1JlcXVlc3QgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAocmVzcG9uc2VzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmZsdXNoZWQgcmVxdWVzdHM6ICcgKyByZXNwb25zZXMubGVuZ3RoKTtcbiAgICB9XG4gIH07XG5cblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkaHR0cEJhY2tlbmQjcmVzZXRFeHBlY3RhdGlvbnNcbiAgICogQGRlc2NyaXB0aW9uXG4gICAqIFJlc2V0cyBhbGwgcmVxdWVzdCBleHBlY3RhdGlvbnMsIGJ1dCBwcmVzZXJ2ZXMgYWxsIGJhY2tlbmQgZGVmaW5pdGlvbnMuIFR5cGljYWxseSwgeW91IHdvdWxkXG4gICAqIGNhbGwgcmVzZXRFeHBlY3RhdGlvbnMgZHVyaW5nIGEgbXVsdGlwbGUtcGhhc2UgdGVzdCB3aGVuIHlvdSB3YW50IHRvIHJldXNlIHRoZSBzYW1lIGluc3RhbmNlIG9mXG4gICAqICRodHRwQmFja2VuZCBtb2NrLlxuICAgKi9cbiAgJGh0dHBCYWNrZW5kLnJlc2V0RXhwZWN0YXRpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgZXhwZWN0YXRpb25zLmxlbmd0aCA9IDA7XG4gICAgcmVzcG9uc2VzLmxlbmd0aCA9IDA7XG4gIH07XG5cbiAgcmV0dXJuICRodHRwQmFja2VuZDtcblxuXG4gIGZ1bmN0aW9uIGNyZWF0ZVNob3J0TWV0aG9kcyhwcmVmaXgpIHtcbiAgICBhbmd1bGFyLmZvckVhY2goWydHRVQnLCAnREVMRVRFJywgJ0pTT05QJywgJ0hFQUQnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICRodHRwQmFja2VuZFtwcmVmaXggKyBtZXRob2RdID0gZnVuY3Rpb24odXJsLCBoZWFkZXJzKSB7XG4gICAgICAgcmV0dXJuICRodHRwQmFja2VuZFtwcmVmaXhdKG1ldGhvZCwgdXJsLCB1bmRlZmluZWQsIGhlYWRlcnMpO1xuICAgICB9O1xuICAgIH0pO1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKFsnUFVUJywgJ1BPU1QnLCAnUEFUQ0gnXSwgZnVuY3Rpb24obWV0aG9kKSB7XG4gICAgICAkaHR0cEJhY2tlbmRbcHJlZml4ICsgbWV0aG9kXSA9IGZ1bmN0aW9uKHVybCwgZGF0YSwgaGVhZGVycykge1xuICAgICAgICByZXR1cm4gJGh0dHBCYWNrZW5kW3ByZWZpeF0obWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMpO1xuICAgICAgfTtcbiAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBNb2NrSHR0cEV4cGVjdGF0aW9uKG1ldGhvZCwgdXJsLCBkYXRhLCBoZWFkZXJzKSB7XG5cbiAgdGhpcy5kYXRhID0gZGF0YTtcbiAgdGhpcy5oZWFkZXJzID0gaGVhZGVycztcblxuICB0aGlzLm1hdGNoID0gZnVuY3Rpb24obSwgdSwgZCwgaCkge1xuICAgIGlmIChtZXRob2QgIT0gbSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICghdGhpcy5tYXRjaFVybCh1KSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChhbmd1bGFyLmlzRGVmaW5lZChkKSAmJiAhdGhpcy5tYXRjaERhdGEoZCkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoYW5ndWxhci5pc0RlZmluZWQoaCkgJiYgIXRoaXMubWF0Y2hIZWFkZXJzKGgpKSByZXR1cm4gZmFsc2U7XG4gICAgcmV0dXJuIHRydWU7XG4gIH07XG5cbiAgdGhpcy5tYXRjaFVybCA9IGZ1bmN0aW9uKHUpIHtcbiAgICBpZiAoIXVybCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGFuZ3VsYXIuaXNGdW5jdGlvbih1cmwudGVzdCkpIHJldHVybiB1cmwudGVzdCh1KTtcbiAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKHVybCkpIHJldHVybiB1cmwodSk7XG4gICAgcmV0dXJuIHVybCA9PSB1O1xuICB9O1xuXG4gIHRoaXMubWF0Y2hIZWFkZXJzID0gZnVuY3Rpb24oaCkge1xuICAgIGlmIChhbmd1bGFyLmlzVW5kZWZpbmVkKGhlYWRlcnMpKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoYW5ndWxhci5pc0Z1bmN0aW9uKGhlYWRlcnMpKSByZXR1cm4gaGVhZGVycyhoKTtcbiAgICByZXR1cm4gYW5ndWxhci5lcXVhbHMoaGVhZGVycywgaCk7XG4gIH07XG5cbiAgdGhpcy5tYXRjaERhdGEgPSBmdW5jdGlvbihkKSB7XG4gICAgaWYgKGFuZ3VsYXIuaXNVbmRlZmluZWQoZGF0YSkpIHJldHVybiB0cnVlO1xuICAgIGlmIChkYXRhICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihkYXRhLnRlc3QpKSByZXR1cm4gZGF0YS50ZXN0KGQpO1xuICAgIGlmIChkYXRhICYmIGFuZ3VsYXIuaXNGdW5jdGlvbihkYXRhKSkgcmV0dXJuIGRhdGEoZCk7XG4gICAgaWYgKGRhdGEgJiYgIWFuZ3VsYXIuaXNTdHJpbmcoZGF0YSkpIHtcbiAgICAgIHJldHVybiBhbmd1bGFyLmVxdWFscyhhbmd1bGFyLmZyb21Kc29uKGFuZ3VsYXIudG9Kc29uKGRhdGEpKSwgYW5ndWxhci5mcm9tSnNvbihkKSk7XG4gICAgfVxuICAgIHJldHVybiBkYXRhID09IGQ7XG4gIH07XG5cbiAgdGhpcy50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBtZXRob2QgKyAnICcgKyB1cmw7XG4gIH07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZU1vY2tYaHIoKSB7XG4gIHJldHVybiBuZXcgTW9ja1hocigpO1xufVxuXG5mdW5jdGlvbiBNb2NrWGhyKCkge1xuXG4gIC8vIGhhY2sgZm9yIHRlc3RpbmcgJGh0dHAsICRodHRwQmFja2VuZFxuICBNb2NrWGhyLiQkbGFzdEluc3RhbmNlID0gdGhpcztcblxuICB0aGlzLm9wZW4gPSBmdW5jdGlvbihtZXRob2QsIHVybCwgYXN5bmMpIHtcbiAgICB0aGlzLiQkbWV0aG9kID0gbWV0aG9kO1xuICAgIHRoaXMuJCR1cmwgPSB1cmw7XG4gICAgdGhpcy4kJGFzeW5jID0gYXN5bmM7XG4gICAgdGhpcy4kJHJlcUhlYWRlcnMgPSB7fTtcbiAgICB0aGlzLiQkcmVzcEhlYWRlcnMgPSB7fTtcbiAgfTtcblxuICB0aGlzLnNlbmQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgdGhpcy4kJGRhdGEgPSBkYXRhO1xuICB9O1xuXG4gIHRoaXMuc2V0UmVxdWVzdEhlYWRlciA9IGZ1bmN0aW9uKGtleSwgdmFsdWUpIHtcbiAgICB0aGlzLiQkcmVxSGVhZGVyc1trZXldID0gdmFsdWU7XG4gIH07XG5cbiAgdGhpcy5nZXRSZXNwb25zZUhlYWRlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAvLyB0aGUgbG9va3VwIG11c3QgYmUgY2FzZSBpbnNlbnNpdGl2ZSxcbiAgICAvLyB0aGF0J3Mgd2h5IHdlIHRyeSB0d28gcXVpY2sgbG9va3VwcyBmaXJzdCBhbmQgZnVsbCBzY2FuIGxhc3RcbiAgICB2YXIgaGVhZGVyID0gdGhpcy4kJHJlc3BIZWFkZXJzW25hbWVdO1xuICAgIGlmIChoZWFkZXIpIHJldHVybiBoZWFkZXI7XG5cbiAgICBuYW1lID0gYW5ndWxhci5sb3dlcmNhc2UobmFtZSk7XG4gICAgaGVhZGVyID0gdGhpcy4kJHJlc3BIZWFkZXJzW25hbWVdO1xuICAgIGlmIChoZWFkZXIpIHJldHVybiBoZWFkZXI7XG5cbiAgICBoZWFkZXIgPSB1bmRlZmluZWQ7XG4gICAgYW5ndWxhci5mb3JFYWNoKHRoaXMuJCRyZXNwSGVhZGVycywgZnVuY3Rpb24oaGVhZGVyVmFsLCBoZWFkZXJOYW1lKSB7XG4gICAgICBpZiAoIWhlYWRlciAmJiBhbmd1bGFyLmxvd2VyY2FzZShoZWFkZXJOYW1lKSA9PSBuYW1lKSBoZWFkZXIgPSBoZWFkZXJWYWw7XG4gICAgfSk7XG4gICAgcmV0dXJuIGhlYWRlcjtcbiAgfTtcblxuICB0aGlzLmdldEFsbFJlc3BvbnNlSGVhZGVycyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBsaW5lcyA9IFtdO1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKHRoaXMuJCRyZXNwSGVhZGVycywgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgbGluZXMucHVzaChrZXkgKyAnOiAnICsgdmFsdWUpO1xuICAgIH0pO1xuICAgIHJldHVybiBsaW5lcy5qb2luKCdcXG4nKTtcbiAgfTtcblxuICB0aGlzLmFib3J0ID0gYW5ndWxhci5ub29wO1xufVxuXG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lICR0aW1lb3V0XG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiBUaGlzIHNlcnZpY2UgaXMganVzdCBhIHNpbXBsZSBkZWNvcmF0b3IgZm9yIHtAbGluayBuZy4kdGltZW91dCAkdGltZW91dH0gc2VydmljZVxuICogdGhhdCBhZGRzIGEgXCJmbHVzaFwiIGFuZCBcInZlcmlmeU5vUGVuZGluZ1Rhc2tzXCIgbWV0aG9kcy5cbiAqL1xuXG5hbmd1bGFyLm1vY2suJFRpbWVvdXREZWNvcmF0b3IgPSBbJyRkZWxlZ2F0ZScsICckYnJvd3NlcicsIGZ1bmN0aW9uKCRkZWxlZ2F0ZSwgJGJyb3dzZXIpIHtcblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkdGltZW91dCNmbHVzaFxuICAgKiBAZGVzY3JpcHRpb25cbiAgICpcbiAgICogRmx1c2hlcyB0aGUgcXVldWUgb2YgcGVuZGluZyB0YXNrcy5cbiAgICpcbiAgICogQHBhcmFtIHtudW1iZXI9fSBkZWxheSBtYXhpbXVtIHRpbWVvdXQgYW1vdW50IHRvIGZsdXNoIHVwIHVudGlsXG4gICAqL1xuICAkZGVsZWdhdGUuZmx1c2ggPSBmdW5jdGlvbihkZWxheSkge1xuICAgICRicm93c2VyLmRlZmVyLmZsdXNoKGRlbGF5KTtcbiAgfTtcblxuICAvKipcbiAgICogQG5nZG9jIG1ldGhvZFxuICAgKiBAbmFtZSAkdGltZW91dCN2ZXJpZnlOb1BlbmRpbmdUYXNrc1xuICAgKiBAZGVzY3JpcHRpb25cbiAgICpcbiAgICogVmVyaWZpZXMgdGhhdCB0aGVyZSBhcmUgbm8gcGVuZGluZyB0YXNrcyB0aGF0IG5lZWQgdG8gYmUgZmx1c2hlZC5cbiAgICovXG4gICRkZWxlZ2F0ZS52ZXJpZnlOb1BlbmRpbmdUYXNrcyA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICgkYnJvd3Nlci5kZWZlcnJlZEZucy5sZW5ndGgpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignRGVmZXJyZWQgdGFza3MgdG8gZmx1c2ggKCcgKyAkYnJvd3Nlci5kZWZlcnJlZEZucy5sZW5ndGggKyAnKTogJyArXG4gICAgICAgICAgZm9ybWF0UGVuZGluZ1Rhc2tzQXNTdHJpbmcoJGJyb3dzZXIuZGVmZXJyZWRGbnMpKTtcbiAgICB9XG4gIH07XG5cbiAgZnVuY3Rpb24gZm9ybWF0UGVuZGluZ1Rhc2tzQXNTdHJpbmcodGFza3MpIHtcbiAgICB2YXIgcmVzdWx0ID0gW107XG4gICAgYW5ndWxhci5mb3JFYWNoKHRhc2tzLCBmdW5jdGlvbih0YXNrKSB7XG4gICAgICByZXN1bHQucHVzaCgne2lkOiAnICsgdGFzay5pZCArICcsICcgKyAndGltZTogJyArIHRhc2sudGltZSArICd9Jyk7XG4gICAgfSk7XG5cbiAgICByZXR1cm4gcmVzdWx0LmpvaW4oJywgJyk7XG4gIH1cblxuICByZXR1cm4gJGRlbGVnYXRlO1xufV07XG5cbmFuZ3VsYXIubW9jay4kUkFGRGVjb3JhdG9yID0gWyckZGVsZWdhdGUnLCBmdW5jdGlvbigkZGVsZWdhdGUpIHtcbiAgdmFyIHJhZkZuID0gZnVuY3Rpb24oZm4pIHtcbiAgICB2YXIgaW5kZXggPSByYWZGbi5xdWV1ZS5sZW5ndGg7XG4gICAgcmFmRm4ucXVldWUucHVzaChmbik7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgICAgcmFmRm4ucXVldWUuc3BsaWNlKGluZGV4LCAxKTtcbiAgICB9O1xuICB9O1xuXG4gIHJhZkZuLnF1ZXVlID0gW107XG4gIHJhZkZuLnN1cHBvcnRlZCA9ICRkZWxlZ2F0ZS5zdXBwb3J0ZWQ7XG5cbiAgcmFmRm4uZmx1c2ggPSBmdW5jdGlvbigpIHtcbiAgICBpZiAocmFmRm4ucXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vIHJBRiBjYWxsYmFja3MgcHJlc2VudCcpO1xuICAgIH1cblxuICAgIHZhciBsZW5ndGggPSByYWZGbi5xdWV1ZS5sZW5ndGg7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgcmFmRm4ucXVldWVbaV0oKTtcbiAgICB9XG5cbiAgICByYWZGbi5xdWV1ZSA9IHJhZkZuLnF1ZXVlLnNsaWNlKGkpO1xuICB9O1xuXG4gIHJldHVybiByYWZGbjtcbn1dO1xuXG4vKipcbiAqXG4gKi9cbmFuZ3VsYXIubW9jay4kUm9vdEVsZW1lbnRQcm92aWRlciA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLiRnZXQgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gYW5ndWxhci5lbGVtZW50KCc8ZGl2IG5nLWFwcD48L2Rpdj4nKTtcbiAgfTtcbn07XG5cbi8qKlxuICogQG5nZG9jIHNlcnZpY2VcbiAqIEBuYW1lICRjb250cm9sbGVyXG4gKiBAZGVzY3JpcHRpb25cbiAqIEEgZGVjb3JhdG9yIGZvciB7QGxpbmsgbmcuJGNvbnRyb2xsZXJ9IHdpdGggYWRkaXRpb25hbCBgYmluZGluZ3NgIHBhcmFtZXRlciwgdXNlZnVsIHdoZW4gdGVzdGluZ1xuICogY29udHJvbGxlcnMgb2YgZGlyZWN0aXZlcyB0aGF0IHVzZSB7QGxpbmsgJGNvbXBpbGUjLWJpbmR0b2NvbnRyb2xsZXItIGBiaW5kVG9Db250cm9sbGVyYH0uXG4gKlxuICpcbiAqICMjIEV4YW1wbGVcbiAqXG4gKiBgYGBqc1xuICpcbiAqIC8vIERpcmVjdGl2ZSBkZWZpbml0aW9uIC4uLlxuICpcbiAqIG15TW9kLmRpcmVjdGl2ZSgnbXlEaXJlY3RpdmUnLCB7XG4gKiAgIGNvbnRyb2xsZXI6ICdNeURpcmVjdGl2ZUNvbnRyb2xsZXInLFxuICogICBiaW5kVG9Db250cm9sbGVyOiB7XG4gKiAgICAgbmFtZTogJ0AnXG4gKiAgIH1cbiAqIH0pO1xuICpcbiAqXG4gKiAvLyBDb250cm9sbGVyIGRlZmluaXRpb24gLi4uXG4gKlxuICogbXlNb2QuY29udHJvbGxlcignTXlEaXJlY3RpdmVDb250cm9sbGVyJywgWydsb2cnLCBmdW5jdGlvbigkbG9nKSB7XG4gKiAgICRsb2cuaW5mbyh0aGlzLm5hbWUpO1xuICogfSldO1xuICpcbiAqXG4gKiAvLyBJbiBhIHRlc3QgLi4uXG4gKlxuICogZGVzY3JpYmUoJ215RGlyZWN0aXZlQ29udHJvbGxlcicsIGZ1bmN0aW9uKCkge1xuICogICBpdCgnc2hvdWxkIHdyaXRlIHRoZSBib3VuZCBuYW1lIHRvIHRoZSBsb2cnLCBpbmplY3QoZnVuY3Rpb24oJGNvbnRyb2xsZXIsICRsb2cpIHtcbiAqICAgICB2YXIgY3RybCA9ICRjb250cm9sbGVyKCdNeURpcmVjdGl2ZUNvbnRyb2xsZXInLCB7IC8qIG5vIGxvY2FscyAmIzQyOy8gfSwgeyBuYW1lOiAnQ2xhcmsgS2VudCcgfSk7XG4gKiAgICAgZXhwZWN0KGN0cmwubmFtZSkudG9FcXVhbCgnQ2xhcmsgS2VudCcpO1xuICogICAgIGV4cGVjdCgkbG9nLmluZm8ubG9ncykudG9FcXVhbChbJ0NsYXJrIEtlbnQnXSk7XG4gKiAgIH0pO1xuICogfSk7XG4gKlxuICogYGBgXG4gKlxuICogQHBhcmFtIHtGdW5jdGlvbnxzdHJpbmd9IGNvbnN0cnVjdG9yIElmIGNhbGxlZCB3aXRoIGEgZnVuY3Rpb24gdGhlbiBpdCdzIGNvbnNpZGVyZWQgdG8gYmUgdGhlXG4gKiAgICBjb250cm9sbGVyIGNvbnN0cnVjdG9yIGZ1bmN0aW9uLiBPdGhlcndpc2UgaXQncyBjb25zaWRlcmVkIHRvIGJlIGEgc3RyaW5nIHdoaWNoIGlzIHVzZWRcbiAqICAgIHRvIHJldHJpZXZlIHRoZSBjb250cm9sbGVyIGNvbnN0cnVjdG9yIHVzaW5nIHRoZSBmb2xsb3dpbmcgc3RlcHM6XG4gKlxuICogICAgKiBjaGVjayBpZiBhIGNvbnRyb2xsZXIgd2l0aCBnaXZlbiBuYW1lIGlzIHJlZ2lzdGVyZWQgdmlhIGAkY29udHJvbGxlclByb3ZpZGVyYFxuICogICAgKiBjaGVjayBpZiBldmFsdWF0aW5nIHRoZSBzdHJpbmcgb24gdGhlIGN1cnJlbnQgc2NvcGUgcmV0dXJucyBhIGNvbnN0cnVjdG9yXG4gKiAgICAqIGlmICRjb250cm9sbGVyUHJvdmlkZXIjYWxsb3dHbG9iYWxzLCBjaGVjayBgd2luZG93W2NvbnN0cnVjdG9yXWAgb24gdGhlIGdsb2JhbFxuICogICAgICBgd2luZG93YCBvYmplY3QgKG5vdCByZWNvbW1lbmRlZClcbiAqXG4gKiAgICBUaGUgc3RyaW5nIGNhbiB1c2UgdGhlIGBjb250cm9sbGVyIGFzIHByb3BlcnR5YCBzeW50YXgsIHdoZXJlIHRoZSBjb250cm9sbGVyIGluc3RhbmNlIGlzIHB1Ymxpc2hlZFxuICogICAgYXMgdGhlIHNwZWNpZmllZCBwcm9wZXJ0eSBvbiB0aGUgYHNjb3BlYDsgdGhlIGBzY29wZWAgbXVzdCBiZSBpbmplY3RlZCBpbnRvIGBsb2NhbHNgIHBhcmFtIGZvciB0aGlzXG4gKiAgICB0byB3b3JrIGNvcnJlY3RseS5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gbG9jYWxzIEluamVjdGlvbiBsb2NhbHMgZm9yIENvbnRyb2xsZXIuXG4gKiBAcGFyYW0ge09iamVjdD19IGJpbmRpbmdzIFByb3BlcnRpZXMgdG8gYWRkIHRvIHRoZSBjb250cm9sbGVyIGJlZm9yZSBpbnZva2luZyB0aGUgY29uc3RydWN0b3IuIFRoaXMgaXMgdXNlZFxuICogICAgICAgICAgICAgICAgICAgICAgICAgICB0byBzaW11bGF0ZSB0aGUgYGJpbmRUb0NvbnRyb2xsZXJgIGZlYXR1cmUgYW5kIHNpbXBsaWZ5IGNlcnRhaW4ga2luZHMgb2YgdGVzdHMuXG4gKiBAcmV0dXJuIHtPYmplY3R9IEluc3RhbmNlIG9mIGdpdmVuIGNvbnRyb2xsZXIuXG4gKi9cbmFuZ3VsYXIubW9jay4kQ29udHJvbGxlckRlY29yYXRvciA9IFsnJGRlbGVnYXRlJywgZnVuY3Rpb24oJGRlbGVnYXRlKSB7XG4gIHJldHVybiBmdW5jdGlvbihleHByZXNzaW9uLCBsb2NhbHMsIGxhdGVyLCBpZGVudCkge1xuICAgIGlmIChsYXRlciAmJiB0eXBlb2YgbGF0ZXIgPT09ICdvYmplY3QnKSB7XG4gICAgICB2YXIgY3JlYXRlID0gJGRlbGVnYXRlKGV4cHJlc3Npb24sIGxvY2FscywgdHJ1ZSwgaWRlbnQpO1xuICAgICAgYW5ndWxhci5leHRlbmQoY3JlYXRlLmluc3RhbmNlLCBsYXRlcik7XG4gICAgICByZXR1cm4gY3JlYXRlKCk7XG4gICAgfVxuICAgIHJldHVybiAkZGVsZWdhdGUoZXhwcmVzc2lvbiwgbG9jYWxzLCBsYXRlciwgaWRlbnQpO1xuICB9O1xufV07XG5cblxuLyoqXG4gKiBAbmdkb2MgbW9kdWxlXG4gKiBAbmFtZSBuZ01vY2tcbiAqIEBwYWNrYWdlTmFtZSBhbmd1bGFyLW1vY2tzXG4gKiBAZGVzY3JpcHRpb25cbiAqXG4gKiAjIG5nTW9ja1xuICpcbiAqIFRoZSBgbmdNb2NrYCBtb2R1bGUgcHJvdmlkZXMgc3VwcG9ydCB0byBpbmplY3QgYW5kIG1vY2sgQW5ndWxhciBzZXJ2aWNlcyBpbnRvIHVuaXQgdGVzdHMuXG4gKiBJbiBhZGRpdGlvbiwgbmdNb2NrIGFsc28gZXh0ZW5kcyB2YXJpb3VzIGNvcmUgbmcgc2VydmljZXMgc3VjaCB0aGF0IHRoZXkgY2FuIGJlXG4gKiBpbnNwZWN0ZWQgYW5kIGNvbnRyb2xsZWQgaW4gYSBzeW5jaHJvbm91cyBtYW5uZXIgd2l0aGluIHRlc3QgY29kZS5cbiAqXG4gKlxuICogPGRpdiBkb2MtbW9kdWxlLWNvbXBvbmVudHM9XCJuZ01vY2tcIj48L2Rpdj5cbiAqXG4gKi9cbmFuZ3VsYXIubW9kdWxlKCduZ01vY2snLCBbJ25nJ10pLnByb3ZpZGVyKHtcbiAgJGJyb3dzZXI6IGFuZ3VsYXIubW9jay4kQnJvd3NlclByb3ZpZGVyLFxuICAkZXhjZXB0aW9uSGFuZGxlcjogYW5ndWxhci5tb2NrLiRFeGNlcHRpb25IYW5kbGVyUHJvdmlkZXIsXG4gICRsb2c6IGFuZ3VsYXIubW9jay4kTG9nUHJvdmlkZXIsXG4gICRpbnRlcnZhbDogYW5ndWxhci5tb2NrLiRJbnRlcnZhbFByb3ZpZGVyLFxuICAkaHR0cEJhY2tlbmQ6IGFuZ3VsYXIubW9jay4kSHR0cEJhY2tlbmRQcm92aWRlcixcbiAgJHJvb3RFbGVtZW50OiBhbmd1bGFyLm1vY2suJFJvb3RFbGVtZW50UHJvdmlkZXJcbn0pLmNvbmZpZyhbJyRwcm92aWRlJywgZnVuY3Rpb24oJHByb3ZpZGUpIHtcbiAgJHByb3ZpZGUuZGVjb3JhdG9yKCckdGltZW91dCcsIGFuZ3VsYXIubW9jay4kVGltZW91dERlY29yYXRvcik7XG4gICRwcm92aWRlLmRlY29yYXRvcignJCRyQUYnLCBhbmd1bGFyLm1vY2suJFJBRkRlY29yYXRvcik7XG4gICRwcm92aWRlLmRlY29yYXRvcignJHJvb3RTY29wZScsIGFuZ3VsYXIubW9jay4kUm9vdFNjb3BlRGVjb3JhdG9yKTtcbiAgJHByb3ZpZGUuZGVjb3JhdG9yKCckY29udHJvbGxlcicsIGFuZ3VsYXIubW9jay4kQ29udHJvbGxlckRlY29yYXRvcik7XG59XSk7XG5cbi8qKlxuICogQG5nZG9jIG1vZHVsZVxuICogQG5hbWUgbmdNb2NrRTJFXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQHBhY2thZ2VOYW1lIGFuZ3VsYXItbW9ja3NcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFRoZSBgbmdNb2NrRTJFYCBpcyBhbiBhbmd1bGFyIG1vZHVsZSB3aGljaCBjb250YWlucyBtb2NrcyBzdWl0YWJsZSBmb3IgZW5kLXRvLWVuZCB0ZXN0aW5nLlxuICogQ3VycmVudGx5IHRoZXJlIGlzIG9ubHkgb25lIG1vY2sgcHJlc2VudCBpbiB0aGlzIG1vZHVsZSAtXG4gKiB0aGUge0BsaW5rIG5nTW9ja0UyRS4kaHR0cEJhY2tlbmQgZTJlICRodHRwQmFja2VuZH0gbW9jay5cbiAqL1xuYW5ndWxhci5tb2R1bGUoJ25nTW9ja0UyRScsIFsnbmcnXSkuY29uZmlnKFsnJHByb3ZpZGUnLCBmdW5jdGlvbigkcHJvdmlkZSkge1xuICAkcHJvdmlkZS5kZWNvcmF0b3IoJyRodHRwQmFja2VuZCcsIGFuZ3VsYXIubW9jay5lMmUuJGh0dHBCYWNrZW5kRGVjb3JhdG9yKTtcbn1dKTtcblxuLyoqXG4gKiBAbmdkb2Mgc2VydmljZVxuICogQG5hbWUgJGh0dHBCYWNrZW5kXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBGYWtlIEhUVFAgYmFja2VuZCBpbXBsZW1lbnRhdGlvbiBzdWl0YWJsZSBmb3IgZW5kLXRvLWVuZCB0ZXN0aW5nIG9yIGJhY2tlbmQtbGVzcyBkZXZlbG9wbWVudCBvZlxuICogYXBwbGljYXRpb25zIHRoYXQgdXNlIHRoZSB7QGxpbmsgbmcuJGh0dHAgJGh0dHAgc2VydmljZX0uXG4gKlxuICogKk5vdGUqOiBGb3IgZmFrZSBodHRwIGJhY2tlbmQgaW1wbGVtZW50YXRpb24gc3VpdGFibGUgZm9yIHVuaXQgdGVzdGluZyBwbGVhc2Ugc2VlXG4gKiB7QGxpbmsgbmdNb2NrLiRodHRwQmFja2VuZCB1bml0LXRlc3RpbmcgJGh0dHBCYWNrZW5kIG1vY2t9LlxuICpcbiAqIFRoaXMgaW1wbGVtZW50YXRpb24gY2FuIGJlIHVzZWQgdG8gcmVzcG9uZCB3aXRoIHN0YXRpYyBvciBkeW5hbWljIHJlc3BvbnNlcyB2aWEgdGhlIGB3aGVuYCBhcGlcbiAqIGFuZCBpdHMgc2hvcnRjdXRzIChgd2hlbkdFVGAsIGB3aGVuUE9TVGAsIGV0YykgYW5kIG9wdGlvbmFsbHkgcGFzcyB0aHJvdWdoIHJlcXVlc3RzIHRvIHRoZVxuICogcmVhbCAkaHR0cEJhY2tlbmQgZm9yIHNwZWNpZmljIHJlcXVlc3RzIChlLmcuIHRvIGludGVyYWN0IHdpdGggY2VydGFpbiByZW1vdGUgYXBpcyBvciB0byBmZXRjaFxuICogdGVtcGxhdGVzIGZyb20gYSB3ZWJzZXJ2ZXIpLlxuICpcbiAqIEFzIG9wcG9zZWQgdG8gdW5pdC10ZXN0aW5nLCBpbiBhbiBlbmQtdG8tZW5kIHRlc3Rpbmcgc2NlbmFyaW8gb3IgaW4gc2NlbmFyaW8gd2hlbiBhbiBhcHBsaWNhdGlvblxuICogaXMgYmVpbmcgZGV2ZWxvcGVkIHdpdGggdGhlIHJlYWwgYmFja2VuZCBhcGkgcmVwbGFjZWQgd2l0aCBhIG1vY2ssIGl0IGlzIG9mdGVuIGRlc2lyYWJsZSBmb3JcbiAqIGNlcnRhaW4gY2F0ZWdvcnkgb2YgcmVxdWVzdHMgdG8gYnlwYXNzIHRoZSBtb2NrIGFuZCBpc3N1ZSBhIHJlYWwgaHR0cCByZXF1ZXN0IChlLmcuIHRvIGZldGNoXG4gKiB0ZW1wbGF0ZXMgb3Igc3RhdGljIGZpbGVzIGZyb20gdGhlIHdlYnNlcnZlcikuIFRvIGNvbmZpZ3VyZSB0aGUgYmFja2VuZCB3aXRoIHRoaXMgYmVoYXZpb3JcbiAqIHVzZSB0aGUgYHBhc3NUaHJvdWdoYCByZXF1ZXN0IGhhbmRsZXIgb2YgYHdoZW5gIGluc3RlYWQgb2YgYHJlc3BvbmRgLlxuICpcbiAqIEFkZGl0aW9uYWxseSwgd2UgZG9uJ3Qgd2FudCB0byBtYW51YWxseSBoYXZlIHRvIGZsdXNoIG1vY2tlZCBvdXQgcmVxdWVzdHMgbGlrZSB3ZSBkbyBkdXJpbmcgdW5pdFxuICogdGVzdGluZy4gRm9yIHRoaXMgcmVhc29uIHRoZSBlMmUgJGh0dHBCYWNrZW5kIGZsdXNoZXMgbW9ja2VkIG91dCByZXF1ZXN0c1xuICogYXV0b21hdGljYWxseSwgY2xvc2VseSBzaW11bGF0aW5nIHRoZSBiZWhhdmlvciBvZiB0aGUgWE1MSHR0cFJlcXVlc3Qgb2JqZWN0LlxuICpcbiAqIFRvIHNldHVwIHRoZSBhcHBsaWNhdGlvbiB0byBydW4gd2l0aCB0aGlzIGh0dHAgYmFja2VuZCwgeW91IGhhdmUgdG8gY3JlYXRlIGEgbW9kdWxlIHRoYXQgZGVwZW5kc1xuICogb24gdGhlIGBuZ01vY2tFMkVgIGFuZCB5b3VyIGFwcGxpY2F0aW9uIG1vZHVsZXMgYW5kIGRlZmluZXMgdGhlIGZha2UgYmFja2VuZDpcbiAqXG4gKiBgYGBqc1xuICogICBteUFwcERldiA9IGFuZ3VsYXIubW9kdWxlKCdteUFwcERldicsIFsnbXlBcHAnLCAnbmdNb2NrRTJFJ10pO1xuICogICBteUFwcERldi5ydW4oZnVuY3Rpb24oJGh0dHBCYWNrZW5kKSB7XG4gKiAgICAgcGhvbmVzID0gW3tuYW1lOiAncGhvbmUxJ30sIHtuYW1lOiAncGhvbmUyJ31dO1xuICpcbiAqICAgICAvLyByZXR1cm5zIHRoZSBjdXJyZW50IGxpc3Qgb2YgcGhvbmVzXG4gKiAgICAgJGh0dHBCYWNrZW5kLndoZW5HRVQoJy9waG9uZXMnKS5yZXNwb25kKHBob25lcyk7XG4gKlxuICogICAgIC8vIGFkZHMgYSBuZXcgcGhvbmUgdG8gdGhlIHBob25lcyBhcnJheVxuICogICAgICRodHRwQmFja2VuZC53aGVuUE9TVCgnL3Bob25lcycpLnJlc3BvbmQoZnVuY3Rpb24obWV0aG9kLCB1cmwsIGRhdGEpIHtcbiAqICAgICAgIHZhciBwaG9uZSA9IGFuZ3VsYXIuZnJvbUpzb24oZGF0YSk7XG4gKiAgICAgICBwaG9uZXMucHVzaChwaG9uZSk7XG4gKiAgICAgICByZXR1cm4gWzIwMCwgcGhvbmUsIHt9XTtcbiAqICAgICB9KTtcbiAqICAgICAkaHR0cEJhY2tlbmQud2hlbkdFVCgvXlxcL3RlbXBsYXRlc1xcLy8pLnBhc3NUaHJvdWdoKCk7XG4gKiAgICAgLy8uLi5cbiAqICAgfSk7XG4gKiBgYGBcbiAqXG4gKiBBZnRlcndhcmRzLCBib290c3RyYXAgeW91ciBhcHAgd2l0aCB0aGlzIG5ldyBtb2R1bGUuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlblxuICogQG1vZHVsZSBuZ01vY2tFMkVcbiAqIEBkZXNjcmlwdGlvblxuICogQ3JlYXRlcyBhIG5ldyBiYWNrZW5kIGRlZmluaXRpb24uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IG1ldGhvZCBIVFRQIG1ldGhvZC5cbiAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhIHVybFxuICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICogQHBhcmFtIHsoc3RyaW5nfFJlZ0V4cCk9fSBkYXRhIEhUVFAgcmVxdWVzdCBib2R5LlxuICogQHBhcmFtIHsoT2JqZWN0fGZ1bmN0aW9uKE9iamVjdCkpPX0gaGVhZGVycyBIVFRQIGhlYWRlcnMgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBodHRwIGhlYWRlclxuICogICBvYmplY3QgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgaGVhZGVycyBtYXRjaCB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKlxuICogIC0gcmVzcG9uZCDigJNcbiAqICAgIGB7ZnVuY3Rpb24oW3N0YXR1cyxdIGRhdGFbLCBoZWFkZXJzLCBzdGF0dXNUZXh0XSlcbiAqICAgIHwgZnVuY3Rpb24oZnVuY3Rpb24obWV0aG9kLCB1cmwsIGRhdGEsIGhlYWRlcnMpfWBcbiAqICAgIOKAkyBUaGUgcmVzcG9uZCBtZXRob2QgdGFrZXMgYSBzZXQgb2Ygc3RhdGljIGRhdGEgdG8gYmUgcmV0dXJuZWQgb3IgYSBmdW5jdGlvbiB0aGF0IGNhbiByZXR1cm5cbiAqICAgIGFuIGFycmF5IGNvbnRhaW5pbmcgcmVzcG9uc2Ugc3RhdHVzIChudW1iZXIpLCByZXNwb25zZSBkYXRhIChzdHJpbmcpLCByZXNwb25zZSBoZWFkZXJzXG4gKiAgICAoT2JqZWN0KSwgYW5kIHRoZSB0ZXh0IGZvciB0aGUgc3RhdHVzIChzdHJpbmcpLlxuICogIC0gcGFzc1Rocm91Z2gg4oCTIGB7ZnVuY3Rpb24oKX1gIOKAkyBBbnkgcmVxdWVzdCBtYXRjaGluZyBhIGJhY2tlbmQgZGVmaW5pdGlvbiB3aXRoXG4gKiAgICBgcGFzc1Rocm91Z2hgIGhhbmRsZXIgd2lsbCBiZSBwYXNzZWQgdGhyb3VnaCB0byB0aGUgcmVhbCBiYWNrZW5kIChhbiBYSFIgcmVxdWVzdCB3aWxsIGJlIG1hZGVcbiAqICAgIHRvIHRoZSBzZXJ2ZXIuKVxuICogIC0gQm90aCBtZXRob2RzIHJldHVybiB0aGUgYHJlcXVlc3RIYW5kbGVyYCBvYmplY3QgZm9yIHBvc3NpYmxlIG92ZXJyaWRlcy5cbiAqL1xuXG4vKipcbiAqIEBuZ2RvYyBtZXRob2RcbiAqIEBuYW1lICRodHRwQmFja2VuZCN3aGVuR0VUXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgR0VUIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkhFQURcbiAqIEBtb2R1bGUgbmdNb2NrRTJFXG4gKiBAZGVzY3JpcHRpb25cbiAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBIRUFEIHJlcXVlc3RzLiBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkRFTEVURVxuICogQG1vZHVsZSBuZ01vY2tFMkVcbiAqIEBkZXNjcmlwdGlvblxuICogQ3JlYXRlcyBhIG5ldyBiYWNrZW5kIGRlZmluaXRpb24gZm9yIERFTEVURSByZXF1ZXN0cy4gRm9yIG1vcmUgaW5mbyBzZWUgYHdoZW4oKWAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaGVzIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgYW5kIGBwYXNzVGhyb3VnaGAgbWV0aG9kcyB0aGF0XG4gKiAgIGNvbnRyb2wgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2VcbiAqICAgYHJlc3BvbmRgIG9yIGBwYXNzVGhyb3VnaGAgYWdhaW4gaW4gb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICovXG5cbi8qKlxuICogQG5nZG9jIG1ldGhvZFxuICogQG5hbWUgJGh0dHBCYWNrZW5kI3doZW5QT1NUXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgUE9TVCByZXF1ZXN0cy4gRm9yIG1vcmUgaW5mbyBzZWUgYHdoZW4oKWAuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd8UmVnRXhwfGZ1bmN0aW9uKHN0cmluZyl9IHVybCBIVFRQIHVybCBvciBmdW5jdGlvbiB0aGF0IHJlY2VpdmVzIGEgdXJsXG4gKiAgIGFuZCByZXR1cm5zIHRydWUgaWYgdGhlIHVybCBtYXRjaGVzIHRoZSBjdXJyZW50IGRlZmluaXRpb24uXG4gKiBAcGFyYW0geyhzdHJpbmd8UmVnRXhwKT19IGRhdGEgSFRUUCByZXF1ZXN0IGJvZHkuXG4gKiBAcGFyYW0geyhPYmplY3R8ZnVuY3Rpb24oT2JqZWN0KSk9fSBoZWFkZXJzIEhUVFAgaGVhZGVycy5cbiAqIEByZXR1cm5zIHtyZXF1ZXN0SGFuZGxlcn0gUmV0dXJucyBhbiBvYmplY3Qgd2l0aCBgcmVzcG9uZGAgYW5kIGBwYXNzVGhyb3VnaGAgbWV0aG9kcyB0aGF0XG4gKiAgIGNvbnRyb2wgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuIFlvdSBjYW4gc2F2ZSB0aGlzIG9iamVjdCBmb3IgbGF0ZXIgdXNlIGFuZCBpbnZva2VcbiAqICAgYHJlc3BvbmRgIG9yIGBwYXNzVGhyb3VnaGAgYWdhaW4gaW4gb3JkZXIgdG8gY2hhbmdlIGhvdyBhIG1hdGNoZWQgcmVxdWVzdCBpcyBoYW5kbGVkLlxuICovXG5cbi8qKlxuICogQG5nZG9jIG1ldGhvZFxuICogQG5hbWUgJGh0dHBCYWNrZW5kI3doZW5QVVRcbiAqIEBtb2R1bGUgbmdNb2NrRTJFXG4gKiBAZGVzY3JpcHRpb25cbiAqIENyZWF0ZXMgYSBuZXcgYmFja2VuZCBkZWZpbml0aW9uIGZvciBQVVQgcmVxdWVzdHMuICBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSB7KHN0cmluZ3xSZWdFeHApPX0gZGF0YSBIVFRQIHJlcXVlc3QgYm9keS5cbiAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlblBBVENIXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgUEFUQ0ggcmVxdWVzdHMuICBGb3IgbW9yZSBpbmZvIHNlZSBgd2hlbigpYC5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ3xSZWdFeHB8ZnVuY3Rpb24oc3RyaW5nKX0gdXJsIEhUVFAgdXJsIG9yIGZ1bmN0aW9uIHRoYXQgcmVjZWl2ZXMgYSB1cmxcbiAqICAgYW5kIHJldHVybnMgdHJ1ZSBpZiB0aGUgdXJsIG1hdGNoZXMgdGhlIGN1cnJlbnQgZGVmaW5pdGlvbi5cbiAqIEBwYXJhbSB7KHN0cmluZ3xSZWdFeHApPX0gZGF0YSBIVFRQIHJlcXVlc3QgYm9keS5cbiAqIEBwYXJhbSB7KE9iamVjdHxmdW5jdGlvbihPYmplY3QpKT19IGhlYWRlcnMgSFRUUCBoZWFkZXJzLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cblxuLyoqXG4gKiBAbmdkb2MgbWV0aG9kXG4gKiBAbmFtZSAkaHR0cEJhY2tlbmQjd2hlbkpTT05QXG4gKiBAbW9kdWxlIG5nTW9ja0UyRVxuICogQGRlc2NyaXB0aW9uXG4gKiBDcmVhdGVzIGEgbmV3IGJhY2tlbmQgZGVmaW5pdGlvbiBmb3IgSlNPTlAgcmVxdWVzdHMuIEZvciBtb3JlIGluZm8gc2VlIGB3aGVuKClgLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfFJlZ0V4cHxmdW5jdGlvbihzdHJpbmcpfSB1cmwgSFRUUCB1cmwgb3IgZnVuY3Rpb24gdGhhdCByZWNlaXZlcyBhIHVybFxuICogICBhbmQgcmV0dXJucyB0cnVlIGlmIHRoZSB1cmwgbWF0Y2hlcyB0aGUgY3VycmVudCBkZWZpbml0aW9uLlxuICogQHJldHVybnMge3JlcXVlc3RIYW5kbGVyfSBSZXR1cm5zIGFuIG9iamVjdCB3aXRoIGByZXNwb25kYCBhbmQgYHBhc3NUaHJvdWdoYCBtZXRob2RzIHRoYXRcbiAqICAgY29udHJvbCBob3cgYSBtYXRjaGVkIHJlcXVlc3QgaXMgaGFuZGxlZC4gWW91IGNhbiBzYXZlIHRoaXMgb2JqZWN0IGZvciBsYXRlciB1c2UgYW5kIGludm9rZVxuICogICBgcmVzcG9uZGAgb3IgYHBhc3NUaHJvdWdoYCBhZ2FpbiBpbiBvcmRlciB0byBjaGFuZ2UgaG93IGEgbWF0Y2hlZCByZXF1ZXN0IGlzIGhhbmRsZWQuXG4gKi9cbmFuZ3VsYXIubW9jay5lMmUgPSB7fTtcbmFuZ3VsYXIubW9jay5lMmUuJGh0dHBCYWNrZW5kRGVjb3JhdG9yID1cbiAgWyckcm9vdFNjb3BlJywgJyR0aW1lb3V0JywgJyRkZWxlZ2F0ZScsICckYnJvd3NlcicsIGNyZWF0ZUh0dHBCYWNrZW5kTW9ja107XG5cblxuLyoqXG4gKiBAbmdkb2MgdHlwZVxuICogQG5hbWUgJHJvb3RTY29wZS5TY29wZVxuICogQG1vZHVsZSBuZ01vY2tcbiAqIEBkZXNjcmlwdGlvblxuICoge0BsaW5rIG5nLiRyb290U2NvcGUuU2NvcGUgU2NvcGV9IHR5cGUgZGVjb3JhdGVkIHdpdGggaGVscGVyIG1ldGhvZHMgdXNlZnVsIGZvciB0ZXN0aW5nLiBUaGVzZVxuICogbWV0aG9kcyBhcmUgYXV0b21hdGljYWxseSBhdmFpbGFibGUgb24gYW55IHtAbGluayBuZy4kcm9vdFNjb3BlLlNjb3BlIFNjb3BlfSBpbnN0YW5jZSB3aGVuXG4gKiBgbmdNb2NrYCBtb2R1bGUgaXMgbG9hZGVkLlxuICpcbiAqIEluIGFkZGl0aW9uIHRvIGFsbCB0aGUgcmVndWxhciBgU2NvcGVgIG1ldGhvZHMsIHRoZSBmb2xsb3dpbmcgaGVscGVyIG1ldGhvZHMgYXJlIGF2YWlsYWJsZTpcbiAqL1xuYW5ndWxhci5tb2NrLiRSb290U2NvcGVEZWNvcmF0b3IgPSBbJyRkZWxlZ2F0ZScsIGZ1bmN0aW9uKCRkZWxlZ2F0ZSkge1xuXG4gIHZhciAkcm9vdFNjb3BlUHJvdG90eXBlID0gT2JqZWN0LmdldFByb3RvdHlwZU9mKCRkZWxlZ2F0ZSk7XG5cbiAgJHJvb3RTY29wZVByb3RvdHlwZS4kY291bnRDaGlsZFNjb3BlcyA9IGNvdW50Q2hpbGRTY29wZXM7XG4gICRyb290U2NvcGVQcm90b3R5cGUuJGNvdW50V2F0Y2hlcnMgPSBjb3VudFdhdGNoZXJzO1xuXG4gIHJldHVybiAkZGVsZWdhdGU7XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIC8vXG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJHJvb3RTY29wZS5TY29wZSMkY291bnRDaGlsZFNjb3Blc1xuICAgKiBAbW9kdWxlIG5nTW9ja1xuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ291bnRzIGFsbCB0aGUgZGlyZWN0IGFuZCBpbmRpcmVjdCBjaGlsZCBzY29wZXMgb2YgdGhlIGN1cnJlbnQgc2NvcGUuXG4gICAqXG4gICAqIFRoZSBjdXJyZW50IHNjb3BlIGlzIGV4Y2x1ZGVkIGZyb20gdGhlIGNvdW50LiBUaGUgY291bnQgaW5jbHVkZXMgYWxsIGlzb2xhdGUgY2hpbGQgc2NvcGVzLlxuICAgKlxuICAgKiBAcmV0dXJucyB7bnVtYmVyfSBUb3RhbCBudW1iZXIgb2YgY2hpbGQgc2NvcGVzLlxuICAgKi9cbiAgZnVuY3Rpb24gY291bnRDaGlsZFNjb3BlcygpIHtcbiAgICAvLyBqc2hpbnQgdmFsaWR0aGlzOiB0cnVlXG4gICAgdmFyIGNvdW50ID0gMDsgLy8gZXhjbHVkZSB0aGUgY3VycmVudCBzY29wZVxuICAgIHZhciBwZW5kaW5nQ2hpbGRIZWFkcyA9IFt0aGlzLiQkY2hpbGRIZWFkXTtcbiAgICB2YXIgY3VycmVudFNjb3BlO1xuXG4gICAgd2hpbGUgKHBlbmRpbmdDaGlsZEhlYWRzLmxlbmd0aCkge1xuICAgICAgY3VycmVudFNjb3BlID0gcGVuZGluZ0NoaWxkSGVhZHMuc2hpZnQoKTtcblxuICAgICAgd2hpbGUgKGN1cnJlbnRTY29wZSkge1xuICAgICAgICBjb3VudCArPSAxO1xuICAgICAgICBwZW5kaW5nQ2hpbGRIZWFkcy5wdXNoKGN1cnJlbnRTY29wZS4kJGNoaWxkSGVhZCk7XG4gICAgICAgIGN1cnJlbnRTY29wZSA9IGN1cnJlbnRTY29wZS4kJG5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb3VudDtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBtZXRob2RcbiAgICogQG5hbWUgJHJvb3RTY29wZS5TY29wZSMkY291bnRXYXRjaGVyc1xuICAgKiBAbW9kdWxlIG5nTW9ja1xuICAgKiBAZGVzY3JpcHRpb25cbiAgICogQ291bnRzIGFsbCB0aGUgd2F0Y2hlcnMgb2YgZGlyZWN0IGFuZCBpbmRpcmVjdCBjaGlsZCBzY29wZXMgb2YgdGhlIGN1cnJlbnQgc2NvcGUuXG4gICAqXG4gICAqIFRoZSB3YXRjaGVycyBvZiB0aGUgY3VycmVudCBzY29wZSBhcmUgaW5jbHVkZWQgaW4gdGhlIGNvdW50IGFuZCBzbyBhcmUgYWxsIHRoZSB3YXRjaGVycyBvZlxuICAgKiBpc29sYXRlIGNoaWxkIHNjb3Blcy5cbiAgICpcbiAgICogQHJldHVybnMge251bWJlcn0gVG90YWwgbnVtYmVyIG9mIHdhdGNoZXJzLlxuICAgKi9cbiAgZnVuY3Rpb24gY291bnRXYXRjaGVycygpIHtcbiAgICAvLyBqc2hpbnQgdmFsaWR0aGlzOiB0cnVlXG4gICAgdmFyIGNvdW50ID0gdGhpcy4kJHdhdGNoZXJzID8gdGhpcy4kJHdhdGNoZXJzLmxlbmd0aCA6IDA7IC8vIGluY2x1ZGUgdGhlIGN1cnJlbnQgc2NvcGVcbiAgICB2YXIgcGVuZGluZ0NoaWxkSGVhZHMgPSBbdGhpcy4kJGNoaWxkSGVhZF07XG4gICAgdmFyIGN1cnJlbnRTY29wZTtcblxuICAgIHdoaWxlIChwZW5kaW5nQ2hpbGRIZWFkcy5sZW5ndGgpIHtcbiAgICAgIGN1cnJlbnRTY29wZSA9IHBlbmRpbmdDaGlsZEhlYWRzLnNoaWZ0KCk7XG5cbiAgICAgIHdoaWxlIChjdXJyZW50U2NvcGUpIHtcbiAgICAgICAgY291bnQgKz0gY3VycmVudFNjb3BlLiQkd2F0Y2hlcnMgPyBjdXJyZW50U2NvcGUuJCR3YXRjaGVycy5sZW5ndGggOiAwO1xuICAgICAgICBwZW5kaW5nQ2hpbGRIZWFkcy5wdXNoKGN1cnJlbnRTY29wZS4kJGNoaWxkSGVhZCk7XG4gICAgICAgIGN1cnJlbnRTY29wZSA9IGN1cnJlbnRTY29wZS4kJG5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBjb3VudDtcbiAgfVxufV07XG5cblxuaWYgKHdpbmRvdy5qYXNtaW5lIHx8IHdpbmRvdy5tb2NoYSkge1xuXG4gIHZhciBjdXJyZW50U3BlYyA9IG51bGwsXG4gICAgICBhbm5vdGF0ZWRGdW5jdGlvbnMgPSBbXSxcbiAgICAgIGlzU3BlY1J1bm5pbmcgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuICEhY3VycmVudFNwZWM7XG4gICAgICB9O1xuXG4gIGFuZ3VsYXIubW9jay4kJGFubm90YXRlID0gYW5ndWxhci5pbmplY3Rvci4kJGFubm90YXRlO1xuICBhbmd1bGFyLmluamVjdG9yLiQkYW5ub3RhdGUgPSBmdW5jdGlvbihmbikge1xuICAgIGlmICh0eXBlb2YgZm4gPT09ICdmdW5jdGlvbicgJiYgIWZuLiRpbmplY3QpIHtcbiAgICAgIGFubm90YXRlZEZ1bmN0aW9ucy5wdXNoKGZuKTtcbiAgICB9XG4gICAgcmV0dXJuIGFuZ3VsYXIubW9jay4kJGFubm90YXRlLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH07XG5cblxuICAod2luZG93LmJlZm9yZUVhY2ggfHwgd2luZG93LnNldHVwKShmdW5jdGlvbigpIHtcbiAgICBhbm5vdGF0ZWRGdW5jdGlvbnMgPSBbXTtcbiAgICBjdXJyZW50U3BlYyA9IHRoaXM7XG4gIH0pO1xuXG4gICh3aW5kb3cuYWZ0ZXJFYWNoIHx8IHdpbmRvdy50ZWFyZG93bikoZnVuY3Rpb24oKSB7XG4gICAgdmFyIGluamVjdG9yID0gY3VycmVudFNwZWMuJGluamVjdG9yO1xuXG4gICAgYW5ub3RhdGVkRnVuY3Rpb25zLmZvckVhY2goZnVuY3Rpb24oZm4pIHtcbiAgICAgIGRlbGV0ZSBmbi4kaW5qZWN0O1xuICAgIH0pO1xuXG4gICAgYW5ndWxhci5mb3JFYWNoKGN1cnJlbnRTcGVjLiRtb2R1bGVzLCBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICAgIGlmIChtb2R1bGUgJiYgbW9kdWxlLiQkaGFzaEtleSkge1xuICAgICAgICBtb2R1bGUuJCRoYXNoS2V5ID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY3VycmVudFNwZWMuJGluamVjdG9yID0gbnVsbDtcbiAgICBjdXJyZW50U3BlYy4kbW9kdWxlcyA9IG51bGw7XG4gICAgY3VycmVudFNwZWMgPSBudWxsO1xuXG4gICAgaWYgKGluamVjdG9yKSB7XG4gICAgICBpbmplY3Rvci5nZXQoJyRyb290RWxlbWVudCcpLm9mZigpO1xuICAgIH1cblxuICAgIC8vIGNsZWFuIHVwIGpxdWVyeSdzIGZyYWdtZW50IGNhY2hlXG4gICAgYW5ndWxhci5mb3JFYWNoKGFuZ3VsYXIuZWxlbWVudC5mcmFnbWVudHMsIGZ1bmN0aW9uKHZhbCwga2V5KSB7XG4gICAgICBkZWxldGUgYW5ndWxhci5lbGVtZW50LmZyYWdtZW50c1trZXldO1xuICAgIH0pO1xuXG4gICAgTW9ja1hoci4kJGxhc3RJbnN0YW5jZSA9IG51bGw7XG5cbiAgICBhbmd1bGFyLmZvckVhY2goYW5ndWxhci5jYWxsYmFja3MsIGZ1bmN0aW9uKHZhbCwga2V5KSB7XG4gICAgICBkZWxldGUgYW5ndWxhci5jYWxsYmFja3Nba2V5XTtcbiAgICB9KTtcbiAgICBhbmd1bGFyLmNhbGxiYWNrcy5jb3VudGVyID0gMDtcbiAgfSk7XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSBhbmd1bGFyLm1vY2subW9kdWxlXG4gICAqIEBkZXNjcmlwdGlvblxuICAgKlxuICAgKiAqTk9URSo6IFRoaXMgZnVuY3Rpb24gaXMgYWxzbyBwdWJsaXNoZWQgb24gd2luZG93IGZvciBlYXN5IGFjY2Vzcy48YnI+XG4gICAqICpOT1RFKjogVGhpcyBmdW5jdGlvbiBpcyBkZWNsYXJlZCBPTkxZIFdIRU4gcnVubmluZyB0ZXN0cyB3aXRoIGphc21pbmUgb3IgbW9jaGFcbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbiByZWdpc3RlcnMgYSBtb2R1bGUgY29uZmlndXJhdGlvbiBjb2RlLiBJdCBjb2xsZWN0cyB0aGUgY29uZmlndXJhdGlvbiBpbmZvcm1hdGlvblxuICAgKiB3aGljaCB3aWxsIGJlIHVzZWQgd2hlbiB0aGUgaW5qZWN0b3IgaXMgY3JlYXRlZCBieSB7QGxpbmsgYW5ndWxhci5tb2NrLmluamVjdCBpbmplY3R9LlxuICAgKlxuICAgKiBTZWUge0BsaW5rIGFuZ3VsYXIubW9jay5pbmplY3QgaW5qZWN0fSBmb3IgdXNhZ2UgZXhhbXBsZVxuICAgKlxuICAgKiBAcGFyYW0gey4uLihzdHJpbmd8RnVuY3Rpb258T2JqZWN0KX0gZm5zIGFueSBudW1iZXIgb2YgbW9kdWxlcyB3aGljaCBhcmUgcmVwcmVzZW50ZWQgYXMgc3RyaW5nXG4gICAqICAgICAgICBhbGlhc2VzIG9yIGFzIGFub255bW91cyBtb2R1bGUgaW5pdGlhbGl6YXRpb24gZnVuY3Rpb25zLiBUaGUgbW9kdWxlcyBhcmUgdXNlZCB0b1xuICAgKiAgICAgICAgY29uZmlndXJlIHRoZSBpbmplY3Rvci4gVGhlICduZycgYW5kICduZ01vY2snIG1vZHVsZXMgYXJlIGF1dG9tYXRpY2FsbHkgbG9hZGVkLiBJZiBhblxuICAgKiAgICAgICAgb2JqZWN0IGxpdGVyYWwgaXMgcGFzc2VkIHRoZXkgd2lsbCBiZSByZWdpc3RlcmVkIGFzIHZhbHVlcyBpbiB0aGUgbW9kdWxlLCB0aGUga2V5IGJlaW5nXG4gICAqICAgICAgICB0aGUgbW9kdWxlIG5hbWUgYW5kIHRoZSB2YWx1ZSBiZWluZyB3aGF0IGlzIHJldHVybmVkLlxuICAgKi9cbiAgd2luZG93Lm1vZHVsZSA9IGFuZ3VsYXIubW9jay5tb2R1bGUgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgbW9kdWxlRm5zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICByZXR1cm4gaXNTcGVjUnVubmluZygpID8gd29ya0ZuKCkgOiB3b3JrRm47XG4gICAgLy8vLy8vLy8vLy8vLy8vLy8vLy8vXG4gICAgZnVuY3Rpb24gd29ya0ZuKCkge1xuICAgICAgaWYgKGN1cnJlbnRTcGVjLiRpbmplY3Rvcikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdG9yIGFscmVhZHkgY3JlYXRlZCwgY2FuIG5vdCByZWdpc3RlciBhIG1vZHVsZSEnKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHZhciBtb2R1bGVzID0gY3VycmVudFNwZWMuJG1vZHVsZXMgfHwgKGN1cnJlbnRTcGVjLiRtb2R1bGVzID0gW10pO1xuICAgICAgICBhbmd1bGFyLmZvckVhY2gobW9kdWxlRm5zLCBmdW5jdGlvbihtb2R1bGUpIHtcbiAgICAgICAgICBpZiAoYW5ndWxhci5pc09iamVjdChtb2R1bGUpICYmICFhbmd1bGFyLmlzQXJyYXkobW9kdWxlKSkge1xuICAgICAgICAgICAgbW9kdWxlcy5wdXNoKGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4gICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChtb2R1bGUsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgICAgICAgICAgICAkcHJvdmlkZS52YWx1ZShrZXksIHZhbHVlKTtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbW9kdWxlcy5wdXNoKG1vZHVsZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIEBuZ2RvYyBmdW5jdGlvblxuICAgKiBAbmFtZSBhbmd1bGFyLm1vY2suaW5qZWN0XG4gICAqIEBkZXNjcmlwdGlvblxuICAgKlxuICAgKiAqTk9URSo6IFRoaXMgZnVuY3Rpb24gaXMgYWxzbyBwdWJsaXNoZWQgb24gd2luZG93IGZvciBlYXN5IGFjY2Vzcy48YnI+XG4gICAqICpOT1RFKjogVGhpcyBmdW5jdGlvbiBpcyBkZWNsYXJlZCBPTkxZIFdIRU4gcnVubmluZyB0ZXN0cyB3aXRoIGphc21pbmUgb3IgbW9jaGFcbiAgICpcbiAgICogVGhlIGluamVjdCBmdW5jdGlvbiB3cmFwcyBhIGZ1bmN0aW9uIGludG8gYW4gaW5qZWN0YWJsZSBmdW5jdGlvbi4gVGhlIGluamVjdCgpIGNyZWF0ZXMgbmV3XG4gICAqIGluc3RhbmNlIG9mIHtAbGluayBhdXRvLiRpbmplY3RvciAkaW5qZWN0b3J9IHBlciB0ZXN0LCB3aGljaCBpcyB0aGVuIHVzZWQgZm9yXG4gICAqIHJlc29sdmluZyByZWZlcmVuY2VzLlxuICAgKlxuICAgKlxuICAgKiAjIyBSZXNvbHZpbmcgUmVmZXJlbmNlcyAoVW5kZXJzY29yZSBXcmFwcGluZylcbiAgICogT2Z0ZW4sIHdlIHdvdWxkIGxpa2UgdG8gaW5qZWN0IGEgcmVmZXJlbmNlIG9uY2UsIGluIGEgYGJlZm9yZUVhY2goKWAgYmxvY2sgYW5kIHJldXNlIHRoaXNcbiAgICogaW4gbXVsdGlwbGUgYGl0KClgIGNsYXVzZXMuIFRvIGJlIGFibGUgdG8gZG8gdGhpcyB3ZSBtdXN0IGFzc2lnbiB0aGUgcmVmZXJlbmNlIHRvIGEgdmFyaWFibGVcbiAgICogdGhhdCBpcyBkZWNsYXJlZCBpbiB0aGUgc2NvcGUgb2YgdGhlIGBkZXNjcmliZSgpYCBibG9jay4gU2luY2Ugd2Ugd291bGQsIG1vc3QgbGlrZWx5LCB3YW50XG4gICAqIHRoZSB2YXJpYWJsZSB0byBoYXZlIHRoZSBzYW1lIG5hbWUgb2YgdGhlIHJlZmVyZW5jZSB3ZSBoYXZlIGEgcHJvYmxlbSwgc2luY2UgdGhlIHBhcmFtZXRlclxuICAgKiB0byB0aGUgYGluamVjdCgpYCBmdW5jdGlvbiB3b3VsZCBoaWRlIHRoZSBvdXRlciB2YXJpYWJsZS5cbiAgICpcbiAgICogVG8gaGVscCB3aXRoIHRoaXMsIHRoZSBpbmplY3RlZCBwYXJhbWV0ZXJzIGNhbiwgb3B0aW9uYWxseSwgYmUgZW5jbG9zZWQgd2l0aCB1bmRlcnNjb3Jlcy5cbiAgICogVGhlc2UgYXJlIGlnbm9yZWQgYnkgdGhlIGluamVjdG9yIHdoZW4gdGhlIHJlZmVyZW5jZSBuYW1lIGlzIHJlc29sdmVkLlxuICAgKlxuICAgKiBGb3IgZXhhbXBsZSwgdGhlIHBhcmFtZXRlciBgX215U2VydmljZV9gIHdvdWxkIGJlIHJlc29sdmVkIGFzIHRoZSByZWZlcmVuY2UgYG15U2VydmljZWAuXG4gICAqIFNpbmNlIGl0IGlzIGF2YWlsYWJsZSBpbiB0aGUgZnVuY3Rpb24gYm9keSBhcyBfbXlTZXJ2aWNlXywgd2UgY2FuIHRoZW4gYXNzaWduIGl0IHRvIGEgdmFyaWFibGVcbiAgICogZGVmaW5lZCBpbiBhbiBvdXRlciBzY29wZS5cbiAgICpcbiAgICogYGBgXG4gICAqIC8vIERlZmluZWQgb3V0IHJlZmVyZW5jZSB2YXJpYWJsZSBvdXRzaWRlXG4gICAqIHZhciBteVNlcnZpY2U7XG4gICAqXG4gICAqIC8vIFdyYXAgdGhlIHBhcmFtZXRlciBpbiB1bmRlcnNjb3Jlc1xuICAgKiBiZWZvcmVFYWNoKCBpbmplY3QoIGZ1bmN0aW9uKF9teVNlcnZpY2VfKXtcbiAgICogICBteVNlcnZpY2UgPSBfbXlTZXJ2aWNlXztcbiAgICogfSkpO1xuICAgKlxuICAgKiAvLyBVc2UgbXlTZXJ2aWNlIGluIGEgc2VyaWVzIG9mIHRlc3RzLlxuICAgKiBpdCgnbWFrZXMgdXNlIG9mIG15U2VydmljZScsIGZ1bmN0aW9uKCkge1xuICAgKiAgIG15U2VydmljZS5kb1N0dWZmKCk7XG4gICAqIH0pO1xuICAgKlxuICAgKiBgYGBcbiAgICpcbiAgICogU2VlIGFsc28ge0BsaW5rIGFuZ3VsYXIubW9jay5tb2R1bGUgYW5ndWxhci5tb2NrLm1vZHVsZX1cbiAgICpcbiAgICogIyMgRXhhbXBsZVxuICAgKiBFeGFtcGxlIG9mIHdoYXQgYSB0eXBpY2FsIGphc21pbmUgdGVzdHMgbG9va3MgbGlrZSB3aXRoIHRoZSBpbmplY3QgbWV0aG9kLlxuICAgKiBgYGBqc1xuICAgKlxuICAgKiAgIGFuZ3VsYXIubW9kdWxlKCdteUFwcGxpY2F0aW9uTW9kdWxlJywgW10pXG4gICAqICAgICAgIC52YWx1ZSgnbW9kZScsICdhcHAnKVxuICAgKiAgICAgICAudmFsdWUoJ3ZlcnNpb24nLCAndjEuMC4xJyk7XG4gICAqXG4gICAqXG4gICAqICAgZGVzY3JpYmUoJ015QXBwJywgZnVuY3Rpb24oKSB7XG4gICAqXG4gICAqICAgICAvLyBZb3UgbmVlZCB0byBsb2FkIG1vZHVsZXMgdGhhdCB5b3Ugd2FudCB0byB0ZXN0LFxuICAgKiAgICAgLy8gaXQgbG9hZHMgb25seSB0aGUgXCJuZ1wiIG1vZHVsZSBieSBkZWZhdWx0LlxuICAgKiAgICAgYmVmb3JlRWFjaChtb2R1bGUoJ215QXBwbGljYXRpb25Nb2R1bGUnKSk7XG4gICAqXG4gICAqXG4gICAqICAgICAvLyBpbmplY3QoKSBpcyB1c2VkIHRvIGluamVjdCBhcmd1bWVudHMgb2YgYWxsIGdpdmVuIGZ1bmN0aW9uc1xuICAgKiAgICAgaXQoJ3Nob3VsZCBwcm92aWRlIGEgdmVyc2lvbicsIGluamVjdChmdW5jdGlvbihtb2RlLCB2ZXJzaW9uKSB7XG4gICAqICAgICAgIGV4cGVjdCh2ZXJzaW9uKS50b0VxdWFsKCd2MS4wLjEnKTtcbiAgICogICAgICAgZXhwZWN0KG1vZGUpLnRvRXF1YWwoJ2FwcCcpO1xuICAgKiAgICAgfSkpO1xuICAgKlxuICAgKlxuICAgKiAgICAgLy8gVGhlIGluamVjdCBhbmQgbW9kdWxlIG1ldGhvZCBjYW4gYWxzbyBiZSB1c2VkIGluc2lkZSBvZiB0aGUgaXQgb3IgYmVmb3JlRWFjaFxuICAgKiAgICAgaXQoJ3Nob3VsZCBvdmVycmlkZSBhIHZlcnNpb24gYW5kIHRlc3QgdGhlIG5ldyB2ZXJzaW9uIGlzIGluamVjdGVkJywgZnVuY3Rpb24oKSB7XG4gICAqICAgICAgIC8vIG1vZHVsZSgpIHRha2VzIGZ1bmN0aW9ucyBvciBzdHJpbmdzIChtb2R1bGUgYWxpYXNlcylcbiAgICogICAgICAgbW9kdWxlKGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4gICAqICAgICAgICAgJHByb3ZpZGUudmFsdWUoJ3ZlcnNpb24nLCAnb3ZlcnJpZGRlbicpOyAvLyBvdmVycmlkZSB2ZXJzaW9uIGhlcmVcbiAgICogICAgICAgfSk7XG4gICAqXG4gICAqICAgICAgIGluamVjdChmdW5jdGlvbih2ZXJzaW9uKSB7XG4gICAqICAgICAgICAgZXhwZWN0KHZlcnNpb24pLnRvRXF1YWwoJ292ZXJyaWRkZW4nKTtcbiAgICogICAgICAgfSk7XG4gICAqICAgICB9KTtcbiAgICogICB9KTtcbiAgICpcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSB7Li4uRnVuY3Rpb259IGZucyBhbnkgbnVtYmVyIG9mIGZ1bmN0aW9ucyB3aGljaCB3aWxsIGJlIGluamVjdGVkIHVzaW5nIHRoZSBpbmplY3Rvci5cbiAgICovXG5cblxuXG4gIHZhciBFcnJvckFkZGluZ0RlY2xhcmF0aW9uTG9jYXRpb25TdGFjayA9IGZ1bmN0aW9uKGUsIGVycm9yRm9yU3RhY2spIHtcbiAgICB0aGlzLm1lc3NhZ2UgPSBlLm1lc3NhZ2U7XG4gICAgdGhpcy5uYW1lID0gZS5uYW1lO1xuICAgIGlmIChlLmxpbmUpIHRoaXMubGluZSA9IGUubGluZTtcbiAgICBpZiAoZS5zb3VyY2VJZCkgdGhpcy5zb3VyY2VJZCA9IGUuc291cmNlSWQ7XG4gICAgaWYgKGUuc3RhY2sgJiYgZXJyb3JGb3JTdGFjaylcbiAgICAgIHRoaXMuc3RhY2sgPSBlLnN0YWNrICsgJ1xcbicgKyBlcnJvckZvclN0YWNrLnN0YWNrO1xuICAgIGlmIChlLnN0YWNrQXJyYXkpIHRoaXMuc3RhY2tBcnJheSA9IGUuc3RhY2tBcnJheTtcbiAgfTtcbiAgRXJyb3JBZGRpbmdEZWNsYXJhdGlvbkxvY2F0aW9uU3RhY2sucHJvdG90eXBlLnRvU3RyaW5nID0gRXJyb3IucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4gIHdpbmRvdy5pbmplY3QgPSBhbmd1bGFyLm1vY2suaW5qZWN0ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGJsb2NrRm5zID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICB2YXIgZXJyb3JGb3JTdGFjayA9IG5ldyBFcnJvcignRGVjbGFyYXRpb24gTG9jYXRpb24nKTtcbiAgICByZXR1cm4gaXNTcGVjUnVubmluZygpID8gd29ya0ZuLmNhbGwoY3VycmVudFNwZWMpIDogd29ya0ZuO1xuICAgIC8vLy8vLy8vLy8vLy8vLy8vLy8vL1xuICAgIGZ1bmN0aW9uIHdvcmtGbigpIHtcbiAgICAgIHZhciBtb2R1bGVzID0gY3VycmVudFNwZWMuJG1vZHVsZXMgfHwgW107XG4gICAgICB2YXIgc3RyaWN0RGkgPSAhIWN1cnJlbnRTcGVjLiRpbmplY3RvclN0cmljdDtcbiAgICAgIG1vZHVsZXMudW5zaGlmdCgnbmdNb2NrJyk7XG4gICAgICBtb2R1bGVzLnVuc2hpZnQoJ25nJyk7XG4gICAgICB2YXIgaW5qZWN0b3IgPSBjdXJyZW50U3BlYy4kaW5qZWN0b3I7XG4gICAgICBpZiAoIWluamVjdG9yKSB7XG4gICAgICAgIGlmIChzdHJpY3REaSkge1xuICAgICAgICAgIC8vIElmIHN0cmljdERpIGlzIGVuYWJsZWQsIGFubm90YXRlIHRoZSBwcm92aWRlckluamVjdG9yIGJsb2Nrc1xuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChtb2R1bGVzLCBmdW5jdGlvbihtb2R1bGVGbikge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBtb2R1bGVGbiA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgIGFuZ3VsYXIuaW5qZWN0b3IuJCRhbm5vdGF0ZShtb2R1bGVGbik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgaW5qZWN0b3IgPSBjdXJyZW50U3BlYy4kaW5qZWN0b3IgPSBhbmd1bGFyLmluamVjdG9yKG1vZHVsZXMsIHN0cmljdERpKTtcbiAgICAgICAgY3VycmVudFNwZWMuJGluamVjdG9yU3RyaWN0ID0gc3RyaWN0RGk7XG4gICAgICB9XG4gICAgICBmb3IgKHZhciBpID0gMCwgaWkgPSBibG9ja0Zucy5sZW5ndGg7IGkgPCBpaTsgaSsrKSB7XG4gICAgICAgIGlmIChjdXJyZW50U3BlYy4kaW5qZWN0b3JTdHJpY3QpIHtcbiAgICAgICAgICAvLyBJZiB0aGUgaW5qZWN0b3IgaXMgc3RyaWN0IC8gc3RyaWN0RGksIGFuZCB0aGUgc3BlYyB3YW50cyB0byBpbmplY3QgdXNpbmcgYXV0b21hdGljXG4gICAgICAgICAgLy8gYW5ub3RhdGlvbiwgdGhlbiBhbm5vdGF0ZSB0aGUgZnVuY3Rpb24gaGVyZS5cbiAgICAgICAgICBpbmplY3Rvci5hbm5vdGF0ZShibG9ja0Zuc1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAvKiBqc2hpbnQgLVcwNDAgKi8vKiBKYXNtaW5lIGV4cGxpY2l0bHkgcHJvdmlkZXMgYSBgdGhpc2Agb2JqZWN0IHdoZW4gY2FsbGluZyBmdW5jdGlvbnMgKi9cbiAgICAgICAgICBpbmplY3Rvci5pbnZva2UoYmxvY2tGbnNbaV0gfHwgYW5ndWxhci5ub29wLCB0aGlzKTtcbiAgICAgICAgICAvKiBqc2hpbnQgK1cwNDAgKi9cbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIGlmIChlLnN0YWNrICYmIGVycm9yRm9yU3RhY2spIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvckFkZGluZ0RlY2xhcmF0aW9uTG9jYXRpb25TdGFjayhlLCBlcnJvckZvclN0YWNrKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfSBmaW5hbGx5IHtcbiAgICAgICAgICBlcnJvckZvclN0YWNrID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfTtcblxuXG4gIGFuZ3VsYXIubW9jay5pbmplY3Quc3RyaWN0RGkgPSBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhbHVlID0gYXJndW1lbnRzLmxlbmd0aCA/ICEhdmFsdWUgOiB0cnVlO1xuICAgIHJldHVybiBpc1NwZWNSdW5uaW5nKCkgPyB3b3JrRm4oKSA6IHdvcmtGbjtcblxuICAgIGZ1bmN0aW9uIHdvcmtGbigpIHtcbiAgICAgIGlmICh2YWx1ZSAhPT0gY3VycmVudFNwZWMuJGluamVjdG9yU3RyaWN0KSB7XG4gICAgICAgIGlmIChjdXJyZW50U3BlYy4kaW5qZWN0b3IpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0luamVjdG9yIGFscmVhZHkgY3JlYXRlZCwgY2FuIG5vdCBtb2RpZnkgc3RyaWN0IGFubm90YXRpb25zJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY3VycmVudFNwZWMuJGluamVjdG9yU3RyaWN0ID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cblxufSkod2luZG93LCB3aW5kb3cuYW5ndWxhcik7XG4iLCIvKipcbiAqIENyZWF0ZWQgYnkgc2hpYW5fbWFjIG9uIDkvMTMvMTUuXG4gKi9cblxucmVxdWlyZSggJ2FuZ3VsYXItbW9ja3MnICk7XG4vL3JlcXVpcmUoICdhbmd1bGFyJyApO1xuXG4vL2ltcG9ydCBhbmd1bGFyIGZyb20gJ2FuZ3VsYXInO1xuXG5kZXNjcmliZSgndmVyc2lvbicsIGZ1bmN0aW9uKCkge1xuICAgIC8vYmVmb3JlRWFjaChhbmd1bGFyLm1vZHVsZSgnbXlBcHAuc2VydmljZXMnKSk7XG5cbiAgICBiZWZvcmVFYWNoKGFuZ3VsYXIubW9jay5tb2R1bGUoJ215QXBwLnNlcnZpY2VzJykpO1xuXG4gICAgaXQoJ3Nob3VsZCByZXR1cm4gY3VycmVudCB2ZXJzaW9uJywgZnVuY3Rpb24odmVyc2lvbikge1xuICAgICAgICBleHBlY3QodmVyc2lvbikudG9FcXVhbCgnMC4xJyk7XG4gICAgfSk7XG59KTsiXX0=
