/*
 * Find or create an htmlBridge and flashBridge for the client.
 *
 * returns nothing
 */
var _bridge = function () {
  var flashBridge, len;

  // try and find the current global bridge
  var container = document.getElementById("global-zeroclipboard-html-bridge");

  if (!container) {
    // Set `allowScriptAccess`/`allowNetworking` based on `trustedDomains` and `window.location.host` vs. `swfPath`
    var allowScriptAccess = _determineScriptAccess(window.location.host, _globalConfig);
    var allowNetworking = allowScriptAccess === "never" ? "none" : "all";

    // Prepare the FlashVars and cache-busting query param
    var flashvars = _vars(_globalConfig);
    var swfUrl = _globalConfig.swfPath + _cacheBust(_globalConfig.swfPath, _globalConfig);

    // Create the outer container
    container = document.createElement("div");
    container.id = "global-zeroclipboard-html-bridge";
    container.className = "global-zeroclipboard-container";
    container.style.position = "absolute";
    container.style.left = "0px";
    container.style.top = "-9999px";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.zIndex = "" + _getSafeZIndex(_globalConfig.zIndex);

    // Create a to-be-replaced child node
    var divToBeReplaced = document.createElement("div");
    container.appendChild(divToBeReplaced);

    // Add this outer container (and its to-be-replaced child node) to the DOM in advance in order
    // to avoid Flash quirks in various browsers, e.g. https://github.com/zeroclipboard/zeroclipboard/issues/204
    document.body.appendChild(container);

    // Create the actual Flash object's shell
    var tmpDiv = document.createElement("div");
    // The object element plus its movie source URL both MUST be created together.
    // Other attributes and child nodes can techncially be added afterward.
    // Hybrid of Flash Satay markup is from Ambience:
    //  - Flash Satay version:  http://alistapart.com/article/flashsatay
    //  - Ambience version:     http://www.ambience.sk/flash-valid.htm
    var oldIE = flashState.pluginType === "activex";
    tmpDiv.innerHTML =
      '<object id="global-zeroclipboard-flash-bridge" name="global-zeroclipboard-flash-bridge" ' +
        'width="100%" height="100%" ' +
        (oldIE ? 'classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"' : 'type="application/x-shockwave-flash" data="' + swfUrl + '"') +
      '>' +
        (oldIE ? '<param name="movie" value="' + swfUrl + '"/>' : '') +
        '<param name="allowScriptAccess" value="' + allowScriptAccess + '"/>' +
        '<param name="allowNetworking" value="' + allowNetworking + '"/>' +
        '<param name="menu" value="false"/>' +
        '<param name="wmode" value="transparent"/>' +
        '<param name="flashvars" value="' + flashvars + '"/>' +
      '</object>';
    flashBridge = tmpDiv.firstChild;
    tmpDiv = null;

    // Store a reference to the `ZeroClipboard` object as a DOM property
    // on the ZeroClipboard-owned "object" element. This will help us
    // easily avoid issues with AMD/CommonJS loaders that don't have
    // a global `ZeroClipboard` reliably available.
    flashBridge.ZeroClipboard = ZeroClipboard;

    // NOTE: Using `replaceChild` is very important!
    // - https://github.com/swfobject/swfobject/blob/562fe358216edbb36445aa62f817c1a56252950c/swfobject/src/swfobject.js
    // - http://pipwerks.com/2011/05/30/using-the-object-element-to-dynamically-embed-flash-swfs-in-internet-explorer/
    container.replaceChild(flashBridge, divToBeReplaced);
  }

  if (!flashBridge) {
    flashBridge = document["global-zeroclipboard-flash-bridge"];
    if (flashBridge && (len = flashBridge.length)) {
      flashBridge = flashBridge[len - 1];
    }
    if (!flashBridge) {
      flashBridge = container.firstChild;
    }
  }

  flashState.bridge = flashBridge || null;
};


/*
 * Get the HTML element container that wraps the Flash bridge object/element.
 * @private
 */
var _getHtmlBridge = function(flashBridge) {
  var htmlBridge = flashBridge && flashBridge.parentNode;
  while (htmlBridge && htmlBridge.nodeName === 'OBJECT' && htmlBridge.parentNode) {
    htmlBridge = htmlBridge.parentNode;
  }
  return htmlBridge || null;
};


/*
 * Reposition the Flash object to cover the current element being hovered over.
 *
 * returns nothing
 */
var _reposition = function () {

  // If there is no `currentElement`, skip it
  if (currentElement) {
    var pos = _getDOMObjectPosition(currentElement, _globalConfig.zIndex);

    // new css
    var htmlBridge = _getHtmlBridge(flashState.bridge);
    if (htmlBridge) {
      htmlBridge.style.top    = pos.top + "px";
      htmlBridge.style.left   = pos.left + "px";
      htmlBridge.style.width  = pos.width + "px";
      htmlBridge.style.height = pos.height + "px";
      htmlBridge.style.zIndex = pos.zIndex + 1;
    }

    _setSize(pos.width, pos.height);
  }
};


/*
 * Change the size/dimensions of the Flash object's stage.
 *
 * returns nothing
 */
var _setSize = function (width, height) {
  var htmlBridge = _getHtmlBridge(flashState.bridge);
  if (htmlBridge) {
    htmlBridge.style.width = width + "px";
    htmlBridge.style.height = height + "px";
  }
};