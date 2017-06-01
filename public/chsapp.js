
var app = angular.module('mainApp', [
   'ui.router',
   'ui.bootstrap',
   'pascalprecht.translate'
]); 

app.controller('translate_opt', ['$scope', '$rootScope',
   function($scope, $rootScope) {
      if (!$scope.lang) {
         $rootScope.language = 'EN'
         $scope.lang = 'EN'
      }

      $scope.change = function () {
         $scope.lang = ($scope.lang === 'EN' ? 'EN' : 'ES')
         $rootScope.language = $scope.lang;
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
      res = ""
      if (language !== 'EN') {
         res += "[" + language + "] "
      }
      return  res + errMap[err.tag] + 
       (err.params ? err.params[0] : "");
   };
}]);

app.filter('translate', function() {
   return function(input, language) {
      if (language === "EN") {
         return input
      }
      else {
         if (input === 'English') {
            return "Ingles"
         }
         else {
            return "Espanol"
         }
      }
   };
});

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
         user: "=user",
         errors: "=errors"
      },
      templateUrl: 'Conversation/cnv.template.html'
   };
}]);


























