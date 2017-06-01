app.controller('loginController',
 ['$scope', '$rootScope', '$state', 'login', 'notifyDlg',
 function($scope, $rootScope, $state, login, nDlg) {

   $scope.user = {email: "UserB@domainB", password: "PasswordB"};

   $scope.login = function() {
      login.login($scope.user)
      .then(function(user) {
         $scope.$parent.user = user;
         $state.go('home');
      })
      .catch(function() {
         nDlg.show($scope, "That name/password is not in our records", "Error");
      });
   };
}]);
