
var app = angular.module('mainApp', [
   'ui.router',
   'ui.bootstrap',
   'pascalprecht.translate'
]); 

app.controller('translate_opt', ['$scope', '$rootScope',
   function($scope, $rootScope) {
      if (!$scope.language) {
         $rootScope.language = 'EN'
         $scope.language = 'EN'
         $scope.options = [{'id':'English','val':'EN'}, 
          {'id':'Spanish','val':'ES'}]
      }

      $scope.change = function () {
         $scope.language = ($scope.language === 'EN' ? 'EN' : 'ES')
         
         if ($scope.language === 'ES') {
            $scope.options = [{'id':'English','val':'EN'},
             {'id':'Spanish','val':'ES'}]
         }

         else {
            $scope.options = [{'id':'English','val':'EN'},
             {'id':'Spanish','val':'ES'}]
         }
         
         $rootScope.language = $scope.language;
      }

}]);

app.constant("errMap", {
   missingField: 'Field missing from request: ',
   badValue: 'Field has bad value: ',
   notFound: 'Entity not present in DB',
   badLogin: 'Email/password combination invalid',
   dupEmail: 'Email duplicates an existing email',
   noTerms: 'Acceptance of terms is required',
   forbiddenRole: 'Role specified is not permitted.',
   noOldPwd: 'Change of password requires an old password',
   oldPwdMismatch: 'Old password that was provided is incorrect.',
   dupTitle: 'Conversation title duplicates an existing one',
   dupEnrollment: 'Duplicate enrollment',
   forbiddenField: 'Field in body not allowed.',
   queryFailed: 'Query failed (server problem).'
});

app.filter('tagError', 
   ['errMap', function(errMap) {
   return function(err, language) {
      return "[" + language + "] " + errMap[err.tag] + 
       (err.params ? err.params[0] : "");
   };
}]);

app.directive('cnvSummary', [function() {
   return {
      // match based on element tag
      restrict: 'E',

      // creates an isolated scope for the specified 
      // conversation
      scope: {
         cnv: "=toSummarize",
         del: "&del",
         edit: "&edit",
         user: "=user"
      },
      templateUrl: 'Conversation/cnv.template.html'
   };
}]);


























