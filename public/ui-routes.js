
app.config(['$stateProvider', '$urlRouterProvider',
   function($stateProvider, $router) {

      //redirect to home if path is not matched
      $router.otherwise("/");

      $stateProvider
      .state('home',  {
         url: '/',
         templateUrl: 'Home/home.template.html',
         controller: 'homeController',
      })
      .state('login', {
         url: '/login',
         templateUrl: 'Login/login.template.html',
         controller: 'loginController',
      })
      .state('logout', {
         url: '/logout',
         templateUrl: 'Home/home.template.html',
         controller: 'logoutController',
      })
      .state('register', {
         url: '/register',
         templateUrl: 'Register/register.template.html',
         controller: 'registerController',
      })
      .state('cnvDetail', {
         url: '/cnvs/:cnvId',
         templateUrl: 'Conversation/cnvDetail.template.html',
         controller: 'cnvDetailController',
         resolve: {
            cnvs: ['$q', '$http', '$stateParams', 
            function($q, $http, $stateParams) {
               return $http.get('/Cnvs/' + $stateParams.cnvId)
               .then(function(response) {
                  return response.data;
               });
            }],

            msgs: ['$q', '$http', '$stateParams', 
            function($q, $http, $stateParams) {
               return $http.get('/Cnvs/' + $stateParams.cnvId + '/Msgs')
               .then(function(response) {
                  return response.data;
               });
            }]
         }
      })
      .state('cnvOverview', {
         url: '/cnvs',
         templateUrl: 'Conversation/cnvOverview.template.html',
         controller: 'cnvOverviewController',
         resolve: {
            cnvs: ['$q', '$http', function($q, $http) {
               return $http.get('/Cnvs')
               .then(function(response) {
                  return response.data;
               });
            }]
         }
      })
      .state('myCnv', {
         url: '/myCnvs/:ownerId',
         templateUrl: 'Conversation/cnvOverview.template.html',
         controller: 'cnvOverviewController',
         resolve: {
            cnvs: ['$q', '$http', '$stateParams', 
            function($q, $http, $stateParams) {
               console.log($stateParams)
               return $http.get('/Cnvs?owner= ' + $stateParams.ownerId)
               .then(function(response) {
                  return response.data;
               });
            }]
         }
      });
   }]);
