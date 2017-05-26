// Declare a service that allows an error message.
app.factory("notifyDlg", ["$uibModal", function(uibM) {
   return {
      show: function(scp, msg, hdr, btns, sz) {
         scp.msg = msg;
         scp.hdr = hdr;
         scp.buttons = btns || ['OK'];
         res = uibM.open({
            templateUrl: 'Util/notifyDlg.template.html',
            scope: scp,
            size: sz || 'sm'
         }).result;

         console.log('RESULT')
         console.log(res)
         return res;
      }
   };
}]);
