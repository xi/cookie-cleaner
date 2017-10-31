var urls = {};

var extractDomain = function(url) {
	return url.split('/')[2].split(':')[0];
};

var isStillOpen = function(domain) {
	return Object.values(urls).some(function(url) {
		return extractDomain(url) === domain;
	});
};

var clearCookies = function(url) {
	var domain = extractDomain(url);

	if (!url.startsWith('http') || isStillOpen(domain)) {
		return Promise.resolve();
	}

	console.log('Clearing cookies for', domain);

	return browser.cookies.getAll({
		domain: domain
	}).then(function(cookies) {
		return Promise.all(cookies.map(function(cookie) {
			return browser.cookies.remove({
				url: 'https://' + domain,
				name: cookie.name
			});
		}));
	});
};

browser.tabs.onCreated.addListener(function(tab) {
	urls[tab.id] = tab.url;
});

browser.tabs.onUpdated.addListener(function(tabId, changedInfo) {
	if (changedInfo.url) {
		var oldUrl = urls[tabId];
		urls[tabId] = changedInfo.url;
		clearCookies(oldUrl);
	}
});

browser.tabs.onRemoved.addListener(function(tabId, removedInfo) {
	var oldUrl = urls[tabId];
	delete urls[tabId];
	clearCookies(oldUrl);
});
