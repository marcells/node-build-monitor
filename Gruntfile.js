module.exports = function(grunt) {
  grunt.initConfig({
    jshint: {
      files: [ 'Gruntfile.js', 'app/*.js', 'app/services/*.js', 'app/public/scripts/*.js', 'test/**/*.js', '!test/**/scenario_*.js' ],
      options: {
        expr: true,
        esversion: 6
      }
    },
    mochaTest: {
      test: {
        options : {
          reporter: 'spec',
          require: 'should'
        },
        src: ['test/**/*.js']
      },
      watch: {
        options : {
          reporter: 'dot',
          require: 'should'
        },
        src: ['test/**/*.js']
      }
    },
    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'mochaTest:watch']
    },
    bump: {
      options: {
        pushTo: 'origin'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.loadNpmTasks('grunt-bump');

  grunt.registerTask('ci', ['jshint', 'mochaTest:test' ]);
  grunt.registerTask('default', ['ci']);
};
