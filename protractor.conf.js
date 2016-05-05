exports.config =  {
    // seleniumServerJar: '../node_modules/protractor/selenium/selenium-server-standalone-2.40.0.jar',
    // chromeDriver: '../node_modules/protractor/selenium/chromedriver',

    specs: ['tests/e2e/**/*.js'],

    baseUrl: 'http://localhost:8001',

    framework: 'jasmine',

    maxSessions: 1,

    multiCapabilities: [
        { browserName: 'chrome' }
    ],
};
