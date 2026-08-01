/**
 * 클라이언트 로그 수집
 */
class Logger {
	static sessionId = Logger.getOrCreateSessionId();
	static endpoint = ''; // '/api/client-log'
	static isInitialized = false;
	static breadcrumbs = [];
	static maxBreadcrumbs = 50;
	static lastUrl = location.pathname + location.search + location.hash;
	static userName = '';
	static menuTitle = '';

	static init(config) {
		config = config || {};
		if (Logger.isInitialized) return;
		if (config.endpoint) Logger.endpoint = config.endpoint;

		window.addEventListener('load', Logger.handleLoad);
		window.addEventListener('click', Logger.handleClick);
		window.addEventListener('error', Logger.handleError);
		window.addEventListener('unhandledrejection', Logger.handlePromiseRejection);

		Logger.hookXHR();
		Logger.hookNavigation();
		Logger.hookJQueryDeferred();
		Logger.isInitialized = true;

        if (Logger.endpoint) {
            console.log('[Logger] initialized', {
                endpoint: Logger.endpoint,
                sessionId: Logger.sessionId,
                path: window.location.pathname
            });
        }
	}

	static handleLoad() {
		Logger.getUserName();
		Logger.getMenuTitle();
	}

	static getUserName() {
		if (typeof SIDATA !== 'undefined' && SIDATA[1]) {
			Logger.userName = SIDATA[1];
			return;
		}
		var el = document.querySelector('.headTop .topUtil li.user');
		Logger.userName = el ? el.textContent.trim() : 'demo-user';
	}

	static getMenuTitle() {
		var active = document.querySelector('.gnbList > li.gnbON > a');
		if (active) {
			Logger.menuTitle = active.textContent.trim();
			return;
		}
		var sGnbList = document.querySelector('.sGnbList');
		if (sGnbList) {
			var links = sGnbList.querySelectorAll('a');
			var depths = [];
			for (var i = 0; i < links.length; i++) {
				depths.push(links[i].innerText);
			}
			Logger.menuTitle = depths.join(' > ');
			return;
		}
		Logger.menuTitle = document.title || location.pathname;
	}

	static handleClick(event) {
		var target = event.target;
		var isAdded = false;
		var valueInfo = '';

		if (target.tagName === 'INPUT') {
			var type = target.type;
			if (['text', 'password', 'email', 'number', 'search'].indexOf(type) >= 0) {
				valueInfo = 'value="' + target.value + '"';
			} else if (type === 'checkbox') {
				valueInfo = 'checked=' + target.checked + ' ' + Logger.getLabel(target);
			} else if (type === 'radio') {
				valueInfo = 'selected=' + target.checked + ' ' + Logger.getLabel(target);
			} else if (type === 'submit' || type === 'button') {
				valueInfo = 'value="' + target.value + '"';
			}
			isAdded = true;
		} else if (target.tagName === 'TEXTAREA') {
			valueInfo = 'value="' + target.value + '"';
			isAdded = true;
		} else if (target.tagName === 'SELECT') {
			var selectedOption = target.options[target.selectedIndex];
			valueInfo = 'selected="' + (selectedOption ? selectedOption.value : '') + '"';
			isAdded = true;
		} else if (['BUTTON', 'A', 'SPAN'].indexOf(target.tagName) >= 0) {
			valueInfo = 'text="' + (target.innerText || '').trim() + '"';
			isAdded = true;
		}

		if (isAdded) {
			var idStr = target.id ? '#' + target.id : '';
			var classStr = target.className ? '.' + target.className : '';
			Logger.addBreadcrumb({
				type: 'click',
				category: 'ui.click',
				message: target.tagName + idStr + classStr + ' ' + valueInfo,
				timestamp: new Date().toISOString()
			});
		}
	}

	static getLabel(target) {
		if (!target.id) return '';
		var label = document.querySelector('label[for="' + target.id + '"]');
		return label ? 'label=' + label.textContent : '';
	}

	static handleError(event) {
		console.log('[Logger] error event received', event.message || event.error);
		Logger.captureException(event.error || {
			message: event.message,
			stack: 'at ' + event.filename + ':' + event.lineno + ':' + event.colno
		});
	}

	static handlePromiseRejection(event) {
		var reason = event.reason || {};
		console.log('[Logger] unhandledrejection received', reason.message || reason);
		Logger.captureException({
			message: reason.message || String(reason),
			stack: reason.stack || null
		});
	}

	static addBreadcrumb(breadcrumb) {
		if (Logger.breadcrumbs.length >= Logger.maxBreadcrumbs) {
			Logger.breadcrumbs.shift();
		}
		Logger.breadcrumbs.push(breadcrumb);
	}

	static clearBreadcrumb() {
		Logger.breadcrumbs.length = 0;
	}

	static captureMessage(message, level) {
		level = level || 'info';
		Logger.send({
			type: 'message',
			message: message,
			level: level,
			breadcrumbs: Logger.breadcrumbs.slice(),
			timestamp: new Date().toISOString(),
			sessionId: Logger.sessionId,
			userAgent: navigator.userAgent,
			path: window.location.pathname,
			userName: Logger.userName,
			menuTitle: Logger.menuTitle
		});
	}

	static captureException(error) {
		console.log('[Logger] exception captured', error.message || String(error));
		Logger.send({
			type: 'exception',
			message: error.message || String(error),
			stack: error.stack || null,
			breadcrumbs: Logger.breadcrumbs.slice(),
			timestamp: new Date().toISOString(),
			sessionId: Logger.sessionId,
			userAgent: navigator.userAgent,
			path: window.location.pathname,
			userName: Logger.userName,
			menuTitle: Logger.menuTitle
		});
	}

	static send(payload) {
		if (Logger.endpoint) {
			try {
                var xhr = new XMLHttpRequest();
                xhr.open('POST', Logger.endpoint, true);
                xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
                xhr.send(JSON.stringify(payload));
            } catch (e) {
                console.warn('[Logger] 전송오류:', e);
            }

		} else {
            console.log('[Logger] send', payload);
        }
	}

	static getOrCreateSessionId() {
		var key = 'logger_session_id';
		var id = localStorage.getItem(key);
		if (!id) {
			id = Date.now() + '-' + Math.random().toString(36).slice(2, 10);
			localStorage.setItem(key, id);
		}
		return id;
	}

	static hookXHR() {
		var originalOpen = XMLHttpRequest.prototype.open;
		var originalSend = XMLHttpRequest.prototype.send;

		XMLHttpRequest.prototype.open = function(method, url) {
			this._loggerMethod = method;
			this._loggerUrl = url;
			return originalOpen.apply(this, arguments);
		};

		XMLHttpRequest.prototype.send = function() {
			var startTime = Date.now();
			var xhr = this;

			xhr.addEventListener('loadend', function() {
				var duration = Date.now() - startTime;

				Logger.addBreadcrumb({
					type: 'http',
					category: 'xhr',
					data: {
						method: xhr._loggerMethod,
						url: xhr._loggerUrl,
						status: xhr.status,
						success: xhr.status >= 200 && xhr.status < 400,
						duration: duration
					},
					timestamp: new Date().toISOString()
				});

				try {
					if (xhr.status < 200 || xhr.status >= 400) {
						Logger.captureException({
							message: 'XHR HTTP Error: ' + xhr.status + ' ' + xhr.statusText + ' (' + xhr._loggerUrl + ')',
							stack: new Error().stack
						});
						return;
					}

					var contentType = xhr.getResponseHeader('Content-Type') || '';
					if (contentType.indexOf('application/json') >= 0 && xhr.responseText) {
						var data = JSON.parse(xhr.responseText);
						if (data && data.error) {
							Logger.captureException({
								message: 'API Error: ' + (data.message || data.error),
								stack: new Error().stack
							});
						}
					}
				} catch (e) {
					console.warn('[Logger] XHR inspect error', e);
				}
			});

			return originalSend.apply(this, arguments);
		};
	}

	static hookJQueryDeferred() {
		if (typeof jQuery === 'undefined' || !jQuery.Deferred) {
			return;
		}

		var previousHook = jQuery.Deferred.exceptionHook;
		jQuery.Deferred.exceptionHook = function(error, stack) {
			if (previousHook) {
				previousHook(error, stack);
			}

			console.log('[Logger] jQuery deferred error received', error && error.message ? error.message : error);
			Logger.captureException({
				message: error && error.message ? error.message : String(error),
				stack: stack || (error && error.stack) || null
			});
		};
	}

	static hookNavigation() {
		var captureNav = function(to) {
			var from = Logger.lastUrl;
			if (from !== to) {
				Logger.addBreadcrumb({
					type: 'navigation',
					category: 'navigation',
					data: { from: from, to: to },
					timestamp: new Date().toISOString()
				});
				Logger.lastUrl = to;
			}
		};

		var wrapHistoryMethod = function(methodName) {
			var original = history[methodName];
			history[methodName] = function() {
				var result = original.apply(this, arguments);
				captureNav(location.pathname + location.search + location.hash);
				return result;
			};
		};

		wrapHistoryMethod('pushState');
		wrapHistoryMethod('replaceState');

		window.addEventListener('popstate', function() {
			captureNav(location.pathname + location.search + location.hash);
		});

		window.addEventListener('hashchange', function() {
			captureNav(location.pathname + location.search + location.hash);
		});

		Logger.addBreadcrumb({
			type: 'navigation',
			category: 'navigation',
			data: { from: null, to: Logger.lastUrl },
			timestamp: new Date().toISOString()
		});
	}
}