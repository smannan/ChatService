app.controller('registerController',
 ['$scope', '$rootScope', '$state', '$http', 'notifyDlg', 'login',
 function($scope, $rootScope, $state, $http, nDlg, login) {
   $scope.user = {role: 0};
   $scope.errors = [];

   $scope.registerUser = function() {
      console.log($scope.user)
      $http.post("Prss", $scope.user)
      .then(function() {
         return nDlg.show($scope, "Registration succeeded. " +
          "Login automatically?",
          "Login", ["Yes", "No"]);
      })
      .then(function(btn) {
         if (btn === "Yes") {
            console.log('LOGGING IN')
            //return $http.post("Ssns", $scope.user);
            login.login($scope.user) 
              .then(function(user) {
                $scope.user = user;
                $rootScope.user = user;
              })
         }
         else {
            $state.go('home');
         }
      })
      /*.then(function(response) {
          var location = response.headers().location.split('/');
          return $http.get("Ssns/" + location[location.length - 1]);
      })*/
      .then(function(response) {
          console.log($rootScope.user)
          $state.go('home');
       })
      .catch(function(err) {
         $scope.errors = err.data;
      });
   };

   $scope.quit = function() {
      $state.go('home');
   };
}]);
