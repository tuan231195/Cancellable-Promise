import { TnPromise } from './tn-promise';
import * as angular from 'angular';

const testPromise = new TnPromise(function(resolve, reject) {
	let counter = 0;
	const timeout = setTimeout(() => {
		resolve(5);
		clearInterval(interval);
	}, 3000);

	const interval = setInterval(() => {
		this.setProgress(counter++);
	}, 1000);

	this.onCancelled(() => {
		clearInterval(interval);
		clearTimeout(timeout);
		reject(1);
	});
})
	.then(console.log)
	.catch(console.error);

testPromise.onProgress(console.log);

angular
	.module('my-app', [])
	.controller('MyController', function MyController($scope, $q, $http) {
		let promise;
		$scope.sendRequest = function() {
			promise = TnPromise.all([
				$http.get(
					'https://www.mocky.io/v2/5185415ba171ea3a00704eed?mocky-delay=5000ms'
				),
				$http.get(
					'https://www.mocky.io/v2/5185415ba171ea3a00704eed?mocky-delay=500ms'
				),
			])
				.then(console.log)
				.catch(console.error);
		};

		$scope.cancelRequest = function() {
			promise.cancel();
		};

		$scope.cancelPromise = function() {
			testPromise.cancel();
		};
	})
	.config([
		'$provide',
		function($provide) {
			$provide.decorator('$http', [
				'$delegate',
				'$q',
				function httpDecorator($delegate, $q) {
					$delegate.get = function(url, config = {}) {
						const canceller = $q.defer();
						let promise;
						config = Object.assign(
							{
								method: 'GET',
								url,
							},
							config,
							{
								timeout: canceller.promise,
								uploadEventHandlers: {
									progress: e => {
										if (e.lengthComputable && promise) {
											promise.setProgress(
												(e.loaded / e.total) * 100
											);
										}
									},
								},
							}
						);
						promise = TnPromise.wrap($delegate(config));
						promise.onCancelled(canceller.resolve);
						return promise;
					};

					return $delegate;
				},
			]);
		},
	]);
