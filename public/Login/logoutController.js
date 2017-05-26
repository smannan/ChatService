app.controller('logoutController',
 ['$scope', '$state', '$rootScope', 'login',
 function($scope, $state, $rootScope, login) {

   $scope.logout = function() {
      login.logout()
      .then(function(user) {
         $rootScope.user = null;
         $state.go('home');
      })
      /*.catch(function() {
         nDlg.show($scope, "Error in logging out", "Error");
      });*/
      .catch(function(err) {
         if (err && err.data) {
            $scope.errors = err.data;
         }
      });
   };
}]);
