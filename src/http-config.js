import * as angular from 'angular';
import { TnPromise } from './tn-promise';

angular.module('my-app').config([
	'$provide',
	function($provide) {
		$provide.decorator('$http', [
			'$delegate',
			'$q',
			function httpDecorator($delegate, $q) {
				$delegate.cancellableGet = (url, config = {}) => newCancellablePromise({
					$http: $delegate,
					$q,
					url,
					config,
				});

				return $delegate;
			},
		]);
	},
]);

function newCancellablePromise({ $http, $q, url, config }) {
	return new TnPromise(({ resolve, reject, promise }) => {
		const canceller = $q.defer();
		const overriddenConfig = Object.assign(
			{
				method: 'GET',
				url,
			},
			config,
			{
				timeout: canceller.promise,
				uploadEventHandlers: {
					progress: e => {
						if (e.lengthComputable) {
							promise.setProgress(
								(e.loaded / e.total) * 100,
							);
						}
					},
				},
			},
		);
		promise.onCancelled(canceller.resolve);
		$http(overriddenConfig)
			.then(resolve)
			.catch((error = {}) => {
				if (promise.isCancelled) {
					return;
				}
				reject(error);
			});
	});
}
