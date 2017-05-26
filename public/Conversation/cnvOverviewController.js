app.controller('cnvOverviewController',
 ['$scope', '$state', '$http', '$uibModal', 'notifyDlg', 'cnvs',
 function($scope, $state, $http, $uibM, nDlg, cnvs) {

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
         return $http.post("Cnvs", {title: newTitle});
      })
      .then(function() { // gets the newly created cnvs
         return $http.get('/Cnvs');
      })
      .then(function(rsp) {
         $scope.cnvs = rsp.data;
      })
      /*.catch(function(err) {
         // console.log("Error: " + JSON.stringify(err));
         if (err && err.data[0].tag == "dupTitle") {
            nDlg.show($scope, "Another conversation already has title " + selectedTitle,
             "Error");
         }
      });*/
      .catch(function(err) {
         if (err && err.data) {
            $scope.errors = err.data;
         }
      });
   };

   $scope.editCnv = function(index) {
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
            return $http.put("/Cnvs/" + index, {title: newTitle});
         })
         .then(function() { // gets the newly created cnvs
            return $http.get('/Cnvs');
         })
         .then(function(rsp) {
            $scope.cnvs = rsp.data;
         })
         /*.catch(function(err) {
            if (err && err.data[0].tag == "dupTitle") {
               nDlg.show($scope, "Another conversation already has title " + selectedTitle,
                "Error");
            }
         }); */
         .catch(function(err) {
            if (err && err.data) {
               $scope.errors = err.data;
            }
         });

      })
   }

   $scope.delCnv = function(index) {
      console.log('OPENING dialog')
      return $uibM.open({
         templateUrl: 'Conversation/delCnv.template.html',
         scope: $scope
      }).result
      .then(function() {
         $http.delete("/Cnvs/" + (index))
      })
      .then(function() { // gets the newly created cnvs
         return $http.get('/Cnvs');
      })
      .then(function(rsp) {
         $scope.cnvs = rsp.data;
      })
      /*.catch(function(err) {
         // console.log("Error: " + JSON.stringify(err));
         if (err && err.data[0].tag == "notFound") {
            nDlg.show($scope, "Conversation does not exist",
             "Error");
         }
      })*/
      .catch(function(err) {
         if (err && err.data) {
            $scope.errors = err.data;
         }
      });
   }
}]);





























