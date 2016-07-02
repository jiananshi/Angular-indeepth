'use strict';

var Scope = require('../scope');

describe('Scope', function() {
  it('', function() {
    var scope = new Scope();
    var name = 'xx';

    scope.name = name;
    expect(scope.name).toBe(name);
  });

  it('', function() {
    var scope = new Scope();
    scope.counter = 0;

    scope.$watch(
      function(scope) { return scope.xx; },   
      function(newVal, oldVal, scope) { scope.counter++; }
    );  

    scope.$digest();
    expect(scope.counter).toBe(1);
  });
});

