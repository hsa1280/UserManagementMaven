module.exports = function(grunt) {
	grunt.initConfig({
		browserify: {
			js: {
				// A single entry point for our app
				src: 'src/main/webapp/app.js',
				dest: 'src/main/webapp/appbuild.js',
			}
		},

		//browserify:{
		//	dist:{
		//		options:{
		//			transform:[['babelify',{'loose':"all"}]]
		//		},
		//		files: {
		//			'src/main/webapp/appbuild.js':['src/main/webapp/test/*.js']
		//		}
		//	}
		//},
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.registerTask('default', ['browserify']);
};