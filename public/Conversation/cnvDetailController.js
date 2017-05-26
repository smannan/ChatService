app.controller('cnvDetailController',
['$scope', '$state', '$http', '$q', '$uibModal', 'notifyDlg', 'cnvs', 'msgs',
function($scope, $state, $http, $q, $uibM, nDlg, cnvs, msgs) {

   $scope.cnvs = cnvs;
   $scope.msgs = msgs;
   
   $scope.newMsg = function(newMsg) {
      $http.post('/Cnvs/'+cnvs.id+'/Msgs', {content: newMsg})
      .then(function() { // gets the newly created cnvs
         return $http.get("/Cnvs/"+cnvs.id+'/Msgs');
      })
      .then(function(rsp) {
         $scope.msgs = rsp.data;
      })
      .catch(function(err) {
         if (err && err.data && err.data[0].tag == "badValue") {
            nDlg.show($scope, "Message content is too long. Maximum "+
             "characters allowed is 500. Message contained " + newMsg.length
             + " characters",
             "Error");
         }
      });
   };

}]);
