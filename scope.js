/**
 * Scope
 *
 */

'use strict';

function deepCopy(target, child) {
  deepCopy.cached = deepCopy.cached || [];
  child = child || {};

  for (var i in target) {
    if (target.hasOwnProperty(i)) {
      var type = Object.prototype.toString.call(i);

      if (type === '[object Array]' || type === '[object Object]') {
        if (deepCopy.cached.indexOf(i) === -1) {
          deepCopy.cached.push(i);
          deepCopy(target, child);
        } else {
          throw error('Object contains cycle reference');
        }
      } else {
        child[i] = target[i];
      }
    }
  }

  return child;
}

Array.prototype.someRight = function(func) {
  for (var i = this.length - 1; i >= 0; i--) {
    if (func(this[i], i)) break;
  }
};

function Scope() {
  this.$$watchers = [];
  this.$$asyncQueue = [];
  this.$$applyAsyncQueue = [];
  this.$$applyAsyncId = null;
  this.$$postDigestQueue = [];
  this.$$phase = null;
}

// 处理 watchFn 返回 undefined 的情况
// function 按引用比较
//
// Note: 酱紫的话，我觉得 object 也可以哦
function initWatchVal() {};

Scope.prototype.$watch = function(watchFn, listenerFn, isDeep) {
  var self = this;
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || function() {},
    last: initWatchVal,
    isDeep: !!isDeep
  };

  this.$$lastDirtyWatch = null;
  this.$$watchers.unshift(watcher);

  return function() {
    var index = self.$$watchers.indexOf(watcher);

    if (index >= 0) {
      self.$$watchers.splice(index, 1);
    }
  };
};

Scope.prototype.$digest = function() {
  var TTL = 10;
  var dirty;

  // performance optimization
  this.$$lastDirtyWatch = null;

  this.$$beginPhase('$digest');

  if (this.$$applyAsyncId) {
    clearTimeout(this.$$applyAsyncId);
    this.$$flushApplyAsync();
  }

  do {
    if (this.$$asyncQueue.length) {
      var task = this.$$asyncQueue.shift();

      try {
        task.scope.$eval(task.expression);
      } catch(e) {
        console.error(e);
      }
    }

    dirty = this.$$digestOnce();

    if ((dirty || this.$$asyncQueue.length) && !TTL--) {
      this.$$clearPhase();
      throw '10 digest iteration reached';
    }
  } while (dirty || this.$$asyncQueue.length);

  this.$$clearPhase();

  while (this.$$postDigestQueue.length) {
    try {
      this.$$postDigestQueue.shift()();
    } catch(e) {
      console.error(e);
    }
  }
};

Scope.prototype.$$digestOnce = function() {
  var self = this;
  var newValue, oldValue, dirty, isLast, isDeep;

  this.$$watchers.someRight(function(watcher) {
    try {
      newValue = watcher.watchFn(self);
      oldValue = watcher.last;
      isDeep = watcher.isDeep;

      if (!self.$$areEqual(newValue, oldValue, isDeep)) {
        self.$$lastDirtyWatch = watcher;
        watcher.last = (isDeep ? deepCopy(newValue) : newValue);
        // 初始化时，newValue 应当也是 oldValue
        watcher.listenerFn(newValue, 
          oldValue === initWatchVal ? newValue : oldValue,
          self);

        dirty = true;
      } else if (watcher === self.$$lastDirtyWatch) {
        dirty = false;
        isLast = true;
      }
    } catch(e) {
      console.error(e);
    }

    return isLast;
  });

  return dirty;
};

Scope.prototype.$eval = function(func, param) {
  return func(this, param);
};

Scope.prototype.$evalAsync = function(func) {
  var self = this;

  if (!self.$$phase && !self.$$asyncQueue.length) {
    setTimeout(function() {
      if (self.$$asyncQueue.length) {
        self.$digest();
      }
    }, 0);
  }

  this.$$asyncQueue.push({scope: this, expression: func});
};

Scope.prototype.$apply = function(func) {
  try {
    this.$$beginPhase('$apply');
    return this.$eval(func)
  } finally {
    this.$$clearPhase();
    this.$digest();
  }
};

Scope.prototype.$applyAsync = function(func) {
  var self = this;
  self.$$applyAsyncQueue.push(function() {
    self.$eval(func);
  });

  if (self.$$applyAsyncId === null) {
    self.$$applyAsyncId = setTimeout(function() {
      self.$apply(function() {
        self.$$flushApplyAsync();
      });
    }, 0);
  }
};

Scope.prototype.$$flushApplyAsync = function() {
  while (this.$$applyAsyncQueue.length) {
    try {
      this.$$applyAsyncQueue.shift()();
    } catch(e) {
      console.error(e);
    }
  }

  this.$$applyAsyncId = null;
};

Scope.prototype.$$postDigest = function(func) {
  this.$$postDigestQueue.push(func);
}

Scope.prototype.$$areEqual = function(newValue, oldValue, isDeep) {
  var result = true;

  if (isDeep) {
    if (Object.prototype.toString.call(newValue) === '[object Array]') {
      newValue.some(function(value, index) {
        if (oldValue[index] !== value) {
          result = false;
          return true;
        }
      });
    } else {
      for (var i in newValue) {
        if (newValue[i] !== oldValue[i]) result = false;
      }
    }
  } else {
    result = (newValue === oldValue || 
      (typeof newValue === 'number' && typeof oldValue === 'number' && isNaN(newValue) && isNaN(oldValue))
    );
  }

  return result;
};

Scope.prototype.$$beginPhase = function(phase) {
  if (this.$$phase) {
    throw this.$$phase + ' already in progress';
  }

  this.$$phase = phase;
};

Scope.prototype.$$clearPhase = function() {
  this.$$phase = null;
};

module.exports = Scope;
