module.exports = function(grunt) {
	grunt.initConfig({
		browserify: {
			js: {
				// A single entry point for our app
				src: 'src/main/webapp/controllers/*.js',
				dest: 'src/main/webapp/appbuild.js',
			}
		},
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.registerTask('default', ['browserify']);
};