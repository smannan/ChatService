app.controller('cnvOverviewController',
 ['$scope', '$rootScope','$state', '$http', '$uibModal', 'notifyDlg', 'cnvs',
 function($scope, $rootScope, $state, $http, $uibM, nDlg, cnvs) {

   $scope.cnvs = cnvs;

   $scope.newCnv = function() {
      $scope.title = null;
      $scope.dlgTitle = "New Conversation";
      var selectedTitle;

      // open dialog to add new convs title
      $uibM.open({
         templateUrl: 'Conversation/editCnvDlg.template.html',
         scope: $scope
      }).result
      .then(function(newTitle) { // posts a new cnvs
         selectedTitle = newTitle;
         return $http.post("Cnvs", {title: newTitle});
      })
      .then(function() { // gets the newly created cnvs
         return $http.get('/Cnvs');
      })
      .then(function(rsp) {
         $scope.cnvs = rsp.data;
      })
      .catch(function(err) {
         // console.log("Error: " + JSON.stringify(err));
         if (err && err.data[0].tag == "dupTitle") {
            nDlg.show($scope, "Another conversation already has title " 
             + selectedTitle,
             "Error");
         }
      });
   };

   $scope.editCnv = function(index) {
      var selectedTitle;

      $http.get("/Cnvs/" + index).
      then(function(response) {
         $scope.title = response.title;
         $scope.id = response.id;
      }).
      then(function() {
         $uibM.open({
            templateUrl: 'Conversation/editCnvDlg.template.html',
            scope: $scope
         }).result.
         then(function(newTitle) {
            selectedTitle = newTitle;
            return $http.put("/Cnvs/" + index, {title: newTitle});
         })
         .then(function() { // gets the newly created cnvs
            return $http.get('/Cnvs');
         })
         .then(function(rsp) {
            $scope.cnvs = rsp.data;
         })
         .catch(function(err) {
            console.log($scope)
            if (err && err.data[0].tag == "dupTitle") {
               nDlg.show($scope, "Another conversation already has title " 
                + selectedTitle,
                "Error");
            }
         });
      })
   }

   $scope.delCnv = function(cnv) {
      nDlg.show($scope, 'Delete conversation entitled ' +
       cnv.title + '?', "Verify", ['Yes', 'No'])

      .then(function(btn) {
         if (btn == 'Yes') {
            $http.delete("/Cnvs/" + (cnv.id))
         }
      })
      .then(function() { // gets the newly created cnvs
         return $http.get('/Cnvs');
      })
      .then(function(rsp) {
         $scope.cnvs = rsp.data;
      })
      .catch(function(err) {
         // console.log("Error: " + JSON.stringify(err));
         if (err && err.data[0].tag == "notFound") {
            nDlg.show($scope, "Conversation does not exist",
             "Error");
         }
      })
   }
}]);





























