'use strict';

import Scope from '../scope';

describe('Scope', function() {
  it('', function() {
    var scope = new Scope();
    var name = 'xx';

    scope.name = name;
    expect(scope.name).toBe(name);
  });
});

