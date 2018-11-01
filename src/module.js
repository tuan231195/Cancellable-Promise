import { TnPromise } from './tn-promise';
import * as angular from 'angular';

angular
	.module('my-app', [])
	.controller('MyController', async function MyController($scope, $q, $http) {
		let httpPromise, testPromise;
		$scope.sendRequest = function() {
			httpPromise = TnPromise.all([
									   $http.cancellableGet(
										   'https://www.mocky.io/v2/5185415ba171ea3a00704eed?mocky-delay=5000ms',
									   ),
									   $http.cancellableGet(
										   'https://www.mocky.io/v2/5185415ba171ea3a00704eed?mocky-delay=500ms',
									   ),
								   ])
								   .then(console.log)
								   .catch(console.error);
		};

		await $http.cancellableGet('https://www.mocky.io/v2/5185415ba171ea3a00704eed?mocky-delay=500ms')
				   .then(console.log);

		$scope.cancelRequest = function() {
			httpPromise.cancel();
		};

		$scope.newPromise = function() {
			testPromise = new TnPromise(({ resolve, reject, promise }) => {
				let counter = 0;
				const timeout = setTimeout(() => {
					resolve(5);
					clearInterval(interval);
				}, 3000);

				const interval = setInterval(() => {
					promise.setProgress(counter++);
				}, 1000);

				promise.onCancelled(() => {
					clearInterval(interval);
					clearTimeout(timeout);
					reject(1);
				});
			})
				.then(console.log)
				.catch(console.error);

			testPromise.onProgress(progress => console.log(`On progress ${progress}`));
		};

		$scope.cancelPromise = function() {
			testPromise.cancel();
		};
	});
