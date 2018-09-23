export class TnPromise {
	constructor(executor) {
		this._cancelListeners = [];
		this._progressListeners = [];
		this._promise = new Promise(executor.bind(this));
	}

	get isCancelled() {
		return this._isCancelled;
	}

	get progress() {
		return this._progress;
	}

	cancel(cancelResult) {
		if (this._isCancelled) {
			return;
		}
		this._isCancelled = true;
		this._cancelListeners.forEach(cancelListener =>
			cancelListener(cancelResult)
		);
	}

	setProgress(progress) {
		this._progress = progress;
		this._progressListeners.forEach(progressListener =>
			progressListener(this._progress)
		);
	}

	onCancelled(cancelListener) {
		this._cancelListeners.push(cancelListener);
	}

	onProgress(professListener) {
		this._progressListeners.push(professListener);
	}

	then(onResolved, onRejected) {
		return this._newChild(this._promise.then(onResolved, onRejected));
	}

	catch(onRejected) {
		return this._newChild(this._promise.catch(onRejected));
	}

	finally(onFinally) {
		return this._newChild(this._promise.finally(onFinally));
	}

	_newChild(promise) {
		const childPromise = TnPromise.wrap(promise);
		childPromise.onCancelled(this.cancel.bind(this));
		this.onCancelled(childPromise.cancel.bind(childPromise));
		this.onProgress(childPromise.setProgress.bind(childPromise));
		return childPromise;
	}

	static all(promises = []) {
		const promise = TnPromise.wrap(Promise.all(promises));
		promise.onCancelled(cancelResult =>
			promises
				.filter(promise => promise instanceof TnPromise)
				.forEach(promise => promise.cancel(cancelResult))
		);
		return promise;
	}

	static race(promises = []) {
		const promise = TnPromise.wrap(Promise.race(promises));
		promise.onCancelled(cancelResult =>
			promises
				.filter(promise => promise instanceof TnPromise)
				.forEach(promise => promise.cancel(cancelResult))
		);
		return promise;
	}

	static wrap(promise) {
		if (promise instanceof TnPromise) {
			return promise;
		}
		const executor = (onResolved, onRejected) =>
			promise.then(onResolved).catch(onRejected);
		return new TnPromise(executor);
	}
}
