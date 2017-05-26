app.controller('loginController',
 ['$scope', '$rootScope', '$state', 'login', 'notifyDlg',
 function($scope, $rootScope, $state, login, nDlg) {

   // Autologin for testing: $scope.user = {email: "cstaley@calpoly.edu", password: "x"};
   console.log($rootScope.language)

   $scope.login = function() {
      login.login($scope.user)
      .then(function(user) {
         $scope.$parent.user = user;
         $state.go('home');
      })
      /*.catch(function() {
         nDlg.show($scope, "That name/password is not in our records", "Error");
      });*/
      .catch(function(err) {
         if (err && err.data) {
            $scope.errors = err.data;
         }
      });
   };
}]);
