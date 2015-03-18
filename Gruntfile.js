module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    shell : {
      vml : {
        command:"bin\\TrifleJS.exe convert.js example --emulate=IE8"
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-shell');

  // Default task(s).
  grunt.registerTask('default', ['shell:vml']);

};