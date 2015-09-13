module.exports = function(grunt) {
	grunt.initConfig({
		//browserify: {
		//	js: {
		//		// A single entry point for our app
		//		src: 'src/main/webapp/views/index.js',
		//		dest: 'src/main/webapp/appbuild.js',
		//	}
		//},

		browserify:{
			dist:{
				options:{
					transform:[['babelify',{'loose':"all"}]],
					browserifyOptions: {
						debug: true
					}
				},
				files: {
					'src/main/webapp/appbuild.js':['src/main/webapp/views/*.js'],
					'src/test/javascript/testbuild.js':['src/test/javascript/spec/*.js']
				}
			}
		},

        karma: {
            unit: {
                configFile: 'src/test/javascript/karma.conf.js',
                singleRun: true,
                options: {
                    files: [
                        'main/webapp/appbuild.js',
                        'test/javascript/testbuild.js'
                    ]
                }
            }
        },
	});

	grunt.loadNpmTasks('grunt-browserify');
	grunt.registerTask('default', ['browserify']);
    grunt.loadNpmTasks('grunt-karma');
    grunt.registerTask('test', ['karma:unit']);
};