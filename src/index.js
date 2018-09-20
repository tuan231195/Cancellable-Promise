class PromiseWrapper {
  constructor(promise, canceller) {
    this.promise = promise;
    this.canceller = canceller;
  }

  cancel() {
    this.canceller.resolve();
  }

  then(resolvedFunction, rejectedFunction = () => {
  }) {
    const promise = this.promise.then(resolvedFunction, rejectedFunction);
    return new PromiseWrapper(promise, this.canceller);
  }

  catch(rejectedFunction) {
    const promise = this.promise.catch(rejectedFunction);
    return new PromiseWrapper(promise, this.canceller);
  }

  finally(finalFunction) {
    const promise = this.promise.finally(finalFunction);
    return new PromiseWrapper(promise, this.canceller);
  }
}

angular.module("my-app", [])
       .controller("MyController", function MyController($scope, $q, $http) {
         let promise;
         $scope.sendRequest = function() {
           promise =
             $http.get("https://www.mocky.io/v2/5185415ba171ea3a00704eed?mocky-delay=5000ms")
                  .then(console.log);
         };

         $scope.cancelRequest = function() {
           promise.cancel();
         };
       })
       .config(["$provide", function($provide) {
         $provide.decorator("$http", [
           "$delegate", "$q",
           function httpDecorator($delegate, $q) {
             $delegate.get = function(url, config = {}) {
               const canceller = $q.defer();
               config = Object.assign({
                 method: "GET",
                 url
               }, config, {
                 timeout: canceller.promise
               });
               return new PromiseWrapper($delegate(config), canceller);
             };

             return $delegate;
           }
         ]);
       }]);