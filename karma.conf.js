module.exports = function(config) {
  config.set({
    frameworks: [ 'browserify', 'jasmine' ], 
    files: [
      './test/**/*.js' 
    ],
    preprocessors: {
      './test/**/*.js': [ 'browserify' ] 
    },
    browsers: [ 'PhantomJS' ],
    browserify: {
      debug: true 
    }
  });
};

