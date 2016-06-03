
/*jslint white: false */
/*global window, $, Util, RFB, */
"use strict";

// Load supporting scripts
Util.load_scripts(["webutil.js", "base64.js", "websock.js", "des.js",
				   "keysymdef.js", "keyboard.js", "input.js", "display.js",
				   "inflator.js", "rfb.js", "keysym.js"]);

var rfb;
var resizeTimeout;


function UIresize() {
	if (WebUtil.getConfigVar('resize', false)) {
		var innerW = window.innerWidth;
		var innerH = window.innerHeight;
		var controlbarH = $D('noVNC_status_bar').offsetHeight;
		var padding = 5;
		if (innerW !== undefined && innerH !== undefined)
			rfb.requestDesktopSize(innerW, innerH - controlbarH - padding);
	}
}
function FBUComplete(rfb, fbu) {
	UIresize();
	rfb.set_onFBUComplete(function() { });
}

window.onresize = function () {
	// When the window has been resized, wait until the size remains
	// the same for 0.5 seconds before sending the request for changing
	// the resolution of the session
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(function(){
		UIresize();
	}, 500);
};

function xvpInit(ver) {
	var xvpbuttons;
	xvpbuttons = $D('noVNC_xvp_buttons');
	if (ver >= 1) {
		xvpbuttons.style.display = 'inline';
	} else {
		xvpbuttons.style.display = 'none';
	}
}

window.onscriptsload = function () {
	var host, port, password, path, token;

	WebUtil.init_logging(WebUtil.getConfigVar('logging', 'warn'));
	document.title = unescape(WebUtil.getConfigVar('title', 'noVNC'));
	// By default, use the host and port of server that served this file
	host = WebUtil.getConfigVar('host', window.location.hostname);
	port = WebUtil.getConfigVar('port', window.location.port);

	// if port == 80 (or 443) then it won't be present and should be
	// set manually
	if (!port) {
		if (window.location.protocol.substring(0,5) == 'https') {
			port = 443;
		}
		else if (window.location.protocol.substring(0,4) == 'http') {
			port = 80;
		}
	}

	password = WebUtil.getConfigVar('password', 'goorm1234');
	path = WebUtil.getConfigVar('path', 'websockify');

	// If a token variable is passed in, set the parameter in a cookie.
	// This is used by nova-novncproxy.
	token = WebUtil.getConfigVar('token', null);
	if (token) {

		// if token is already present in the path we should use it
		path = WebUtil.injectParamIfMissing(path, "token", token);

		WebUtil.createCookie('token', token, 1)
	}

	if ((!host) || (!port)) {
		// updateState(null, 'fatal', null, 'Must specify host and port in URL');
		return;
	}

	try {
		rfb = new RFB({'target':       $D('noVNC_canvas'),
					   'encrypt':      WebUtil.getConfigVar('encrypt',
								(window.location.protocol === "https:")),
					   'repeaterID':   WebUtil.getConfigVar('repeaterID', ''),
					   'true_color':   WebUtil.getConfigVar('true_color', true),
					   'local_cursor': WebUtil.getConfigVar('cursor', true),
					   'shared':       WebUtil.getConfigVar('shared', true),
					   'view_only':    WebUtil.getConfigVar('view_only', false),
					   // 'onUpdateState':  updateState,
					   'onXvpInit':    xvpInit,
					   // 'onPasswordRequired':  passwordRequired,
					   'onFBUComplete': FBUComplete});
	} catch (exc) {
		// updateState(null, 'fatal', null, 'Unable to create RFB client -- ' + exc);
		return; // don't continue trying to connect
	}

	rfb.connect(host, port, password, path);
};