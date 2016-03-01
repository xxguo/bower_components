# WARNING
**This `master` branch contains the v2.x codebase for ZeroClipboard, which is currently in an unstable state! If you
want to see the v1.x codebase, please see the [`1.x-master`](https://github.com/zeroclipboard/zeroclipboard/tree/1.x-master) branch instead.**


# Overview

The ZeroClipboard library provides an easy way to copy text to the clipboard using an invisible [Adobe Flash](http://en.wikipedia.org/wiki/Adobe_Flash) movie and a [JavaScript](http://en.wikipedia.org/wiki/JavaScript) interface. The "Zero" signifies that the library is invisible and the user interface is left entirely up to you. 

This is achieved by automatically floating the invisible movie on top of a [DOM](http://en.wikipedia.org/wiki/Document_Object_Model) element of your choice. Standard mouse events are even propagated out to your DOM element, so you can still have rollover and mousedown effects.


## Limitations

Note that, due to browser and Flash security restrictions, this clipboard injection can _**ONLY**_ occur when the user clicks on the invisible Flash movie. A simulated `click` event from JavaScript will not suffice as this would enable [clipboard poisoning](http://www.computerworld.com/s/article/9117268/Adobe_patches_Flash_clickjacking_and_clipboard_poisoning_bugs).


## Installation

If you are installing for Node:

```shell
npm install zeroclipboard
```

If you are installing for the web, you can use Bower:

```shell
bower install zeroclipboard
```


## Setup

To use the library, simply include the following JavaScript file in your page:

```html
<script type="text/javascript" src="ZeroClipboard.js"></script>
```

You also need to have the "`ZeroClipboard.swf`" file available to the browser.  If this file is located in the same
directory as your web page, then it will work out of the box.  However, if the SWF file is hosted elsewhere, you need
to set the URL like this (place this code _after_ the script tag):

```js
ZeroClipboard.config( { swfPath: 'http://YOURSERVER/path/ZeroClipboard.swf' } );
```


## Clients

Now you are ready to create one or more _clients_.  A client is a single instance of the clipboard library on the page,
linked to one or more DOM elements. Here is how to create a client instance:

```js
var client = new ZeroClipboard();
```

You can also include an element or array of elements in the new client. _**This example uses jQuery to find "copy buttons"._

```js
var client = new ZeroClipboard($(".copy-button"));
```

Next, you can set some configuration options.


## Configuration Options

These are default values for the global configurations options. You should generally update these _before_ you create your clients.

```js
var _globalConfig = {
  // URL to movie, relative to the page. Default value will be "ZeroClipboard.swf" under the
  // same path as the ZeroClipboard JS file.
  swfPath: "path/to/ZeroClipboard.swf",

  // SWF inbound scripting policy: page domains that the SWF should trust. (single string or array of strings)
  trustedDomains: [window.location.host],

  // Include a "nocache" query parameter on requests for the SWF
  cacheBust: true,

  // Forcibly set the hand cursor ("pointer") for all clipped elements
  forceHandCursor: false,

  // The z-index used by the Flash object. Max value (32-bit): 2147483647
  zIndex: 999999999,

  // Debug enabled: send `console` messages with deprecation warnings, etc.
  debug: true,

  // Sets the title of the `div` encapsulating the Flash object
  title: null,

  // Setting this to `false` would allow users to handle calling `ZeroClipboard.activate(...);`
  // themselves instead of relying on our per-element `mouseover` handler
  autoActivate: true,

  // How many milliseconds to wait for the Flash SWF to load and respond before assuming that
  // Flash is deactivated (e.g. click-to-play) in the user's browser. If you don't care about
  // how long it takes to load the SWF, you can set this to `null`.
  flashLoadTimeout: 30000,


  /** @deprecated */
  // The class used to indicate that a clipped element is being hovered over
  hoverClass: "zeroclipboard-is-hover",

  /** @deprecated */
  // The class used to indicate that a clipped element is active (is being clicked)
  activeClass: "zeroclipboard-is-active"
};
```

You can override the defaults by making a call like `ZeroClipboard.config({ swfPath: "new/path" });` before you create any clients.


### The `trustedDomains` option: SWF inbound scripting access

This allows other SWF files and HTML pages from the allowed domains to access/call publicly exposed ActionScript code,
e.g. functions shared via `ExternalInterface.addCallback`. In other words, it controls the SWF inbound scripting access.

If your ZeroClipboard SWF is served from a different origin/domain than your page, you need to tell the SWF that it's
OK to trust your page. The default value of `[window.location.host]` is almost _**always**_ what you will want unless
you specifically want the SWF to communicate with pages from other domains (e.g. in iframes or child windows).

For more information about trusted domains, consult the [_official Flash documentation for `flash.system.Security.allowDomain(...)`_](http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/system/Security.html#allowDomain\(\)).


### SWF outbound scripting access

The `allowScriptAccess` parameter (for Flash embedding markup) allows the SWF file to access/call JavaScript/HTML functionality of
HTML pages on allowed domains, e.g. invoking functions via `ExternalInterface.call`. In other words, it controls the SWF outbound
scripting access.

As of version `v2.0.0-alpha.2`, the `allowScriptAccess` configuration option no longer exists. The appropriate value will be determined
immediately before the Flash object is embedded on the page. The value is based on a relationship between the current
domain (`window.location.host`) and the value of the `trustedDomains` configuration option.

For more information about `allowScriptAccess`, consult the [_official Flash documentation_](http://helpx.adobe.com/flash/kb/control-access-scripts-host-web.html).


### Cross-Protocol Limitations

ZeroClipboard was intentionally configured to _not_ allow the SWF to be served from a secure domain (HTTPS) but scripted by an insecure domain (HTTP).

If you find yourself in this situation (as in [Issue #170](https://github.com/zeroclipboard/ZeroClipboard/issues/170)), please consider the following options:  
 1. Serve the SWF over HTTP instead of HTTPS. If the page's protocol can vary (e.g. authorized/unauthorized, staging/production, etc.), you should include add the SWF with a relative protocol (`//s3.amazonaws.com/blah/ZeroClipboard.swf`) instead of an absolute protocol (`https://s3.amazonaws.com/blah/ZeroClipboard.swf`).
 2. Serve the page over HTTPS instead of HTTP. If the page's protocol can vary, see the note on the previous option (1).
 3. Update ZeroClipboard's ActionScript codebase to call the [`allowInsecureDomain`](http://help.adobe.com/en_US/FlashPlatform/reference/actionscript/3/flash/system/Security.html#allowInsecureDomain\(\)) method, then recompile the SWF with your custom changes.


### Text To Copy

Setting the clipboard text can be done in 4 ways:

1. Add a `copy` event handler in which you call `event.clipboardData.setData` to set the appropriate data. This event is triggered every time ZeroClipboard tries to inject into the clipboard. Example:

   ```js
   client.on( "copy", function (event) {
      var clipboard = event.clipboardData;
      clipboard.setData( "text/plain", "Copy me!" );
      clipboard.setData( "text/html", "<b>Copy me!</b>" );
      clipboard.setData( "application/rtf", "{\\rtf1\\ansi\n{\\b Copy me!}}" );
      clipboard.setData( "text/x-markdown", "**Copy me!**" );
   });
   ```

2. Set the "text/plain" [and _usually_ "text/html"] clipboard segments via `data-clipboard-target` attribute on the button. ZeroClipboard will look for the target element via ID and try to get the HTML value via `.value`, `.outerHTML`, or `.innerHTML`, and the text value via `.value`, `.textContent`, or `.innerText`. If the HTML and text values for the targeted element match, the value will only be placed into the "text/plain" segment of the clipboard (i.e. the "text/html" segment will cleared).

  ```html
  <button id="my-button_text" data-clipboard-target="clipboard_text">Copy to Clipboard</button>
  <button id="my-button_textarea" data-clipboard-target="clipboard_textarea">Copy to Clipboard</button>
  <button id="my-button_pre" data-clipboard-target="clipboard_pre">Copy to Clipboard</button>

  <input type="text" id="clipboard_text" value="Clipboard Text"/>
  <textarea id="clipboard_textarea">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
  quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
  consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
  cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
  proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</textarea>
  <pre id="clipboard_pre">Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
  quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
  consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
  cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
  proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</pre>
  ```

3. Set the "text/plain" clipboard segment via `data-clipboard-text` attribute on the button. Doing this will let ZeroClipboard take care of the rest.

  ```html
  <button id="my-button" data-clipboard-text="Copy me!">Copy to Clipboard</button>
  ```

4. Set the data via the `ZeroClipboard.setData` (any segment, including custom data) method.  You can call this function at any time: when the page first loads, or later like in a `copy` event handler.  Example:

  ```js
  ZeroClipboard.setData( "Copy me!" );
  ```

  The important caveat of using `ZeroClipboard.setData` is that the data it sets is **transient** and _will only be used for a single copy operation_. As such, we do not particularly
  recommend using `ZeroClipboard.setData` (and friends) other than inside of a `copy` event handler; however, the API will not prevent you from using it in other ways.

5. Set the data via the `client.setText` ("text/plain" segment), `client.setHtml` ("text/html" segment), `client.setRichText` ("application/rtf" segment), or `client.setData` (any segment, including custom data) methods.  You can call this function at any time: when the page first loads, or later like in a `copy` event handler.  Example:

  ```js
  client.setText( "Copy me!" );
  ```

  The important caveat of using `client.setData` (and friends) is that the data it sets is **transient** and _will only be used for a single copy operation_. As such, we do not particularly
  recommend using `client.setData` (and friends) other than inside of a `copy` event handler; however, the API will not prevent you from using it in other ways.


### Clipping

Clipping refers to the process of "linking" the Flash movie to a DOM element on the page. Since the Flash movie is completely transparent, the user sees nothing out of the ordinary.

The Flash movie receives the click event and copies the text to the clipboard.  Also, mouse actions like hovering and `mousedown` generate events that you can capture (see [_Event Handlers_](#event-handlers) below).

To clip elements, you must pass an element, or array of elements to the `clip` function.

Here is how to clip your client library instance to a DOM element:

```js
client.clip( document.getElementById('d_clip_button') );
```

You can pass in a reference to the actual DOM element object itself or an array of DOM objects.  The rest all happens automatically -- the movie is created, all your options set, and it is floated above the element, awaiting clicks from the user.


### Example Implementation

```html
<button id="my-button" data-clipboard-text="Copy me!" title="Click to copy to clipboard.">Copy to Clipboard</button>
```

And the code:

```js
var client = new ZeroClipboard( $("button#my-button") );
```


## CSS Effects

Since the Flash movie is floating on top of your DOM element, it will receive all the mouse events before the browser has a chance to catch them.  However, for convenience these events are passed through to your clipboard client which you can capture (see *Event Handlers* below).  But in addition to this, the Flash movie can also activate CSS classes on your DOM element to simulate the ":hover" and ":active" pseudo-classes.

If this feature is enabled, the CSS classes "hover" and "active" are added / removed to your DOM element as the mouse hovers over and clicks the Flash movie.  This essentially allows your button to behave normally, even though the floating Flash movie is receiving all the mouse events.  Please note that the actual CSS pseudo-classes ":hover" and ":active" are not used -- these cannot be programmatically activated with current browser software.  Instead, sub-classes named "zeroclipboard-is-hover" and "zeroclipboard-is-active" are used.  Example CSS:

```css
  #d_clip_button {
    width:150px;
    text-align:center;
    border:1px solid black;
    background-color:#ccc;
    margin:10px; padding:10px;
  }
  #d_clip_button.zeroclipboard-is-hover { background-color:#eee; }
  #d_clip_button.zeroclipboard-is-active { background-color:#aaa; }
```

These classes are for a DOM element with an ID: "d_clip_button".  The "zeroclipboard-is-hover" and "zeroclipboard-is-active" sub-classes would automatically be activated as the user hovers over, and clicks down on the Flash movie, respectively.  They behave exactly like CSS pseudo-classes of the same names.


## Event Handlers

The clipboard library allows you set a number of different event handlers.  These are all set by calling the `on()` method, as in this example:

```js
client.on( 'ready', my_ready_handler );
```

The first argument is the name of the event, and the second is a reference to your function.  The function may be passed by name (string) or an actual reference to the function object.

Your custom function will be passed exactly one argument: an `event` object.  The following subsections describe all the available events you can hook into and their data structures.

Event handlers can be removed by calling the `off()` method, which has the same method signature as `on()`:

```js
client.off( 'ready', my_ready_handler );
```


#### ready

The `ready` event is fired when the Flash movie completes loading and is ready for action.  Please note that you don't need to listen for this event to set options -- those are automatically passed to the movie if you call them before it loads.  Example use:

```js
client.on( 'ready', function ( event ) {
  console.log( "movie has loaded" );
});
```

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"ready"`</dd>
    <dt>`message`</dt>
    <dd>A message explaining this event</dd>
    <dt>`target`</dt>
    <dd>`null`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object</dd>
    <dt>`relatedTarget`</dt>
    <dd>`null`</dd>
    <dt>`version`</dt>
    <dd>The browser's Flash Player version</dd>
  </dl>
</dd>
</dl>


#### beforecopy

On `mousedown`, the Flash object will fire off a `beforecopy` event. This event is generally only used for "UI prepartion" if
you want to alter anything before the `copy` event fires.

**IMPORTANT:** Handlers of this event are expected to operate synchronously if they intend to be finished before the "copy"
event is triggered.

```js
client.on( 'beforecopy', function ( event ) {
  console.log( 'Preparing to inject into your clipboard...' );
} );
```

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"beforecopy"`</dd>
    <dt>`target`</dt>
    <dd>The current element that is being provoked, if any; otherwise `window`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object</dd>
    <dt>`relatedTarget`</dt>
    <dd>An element whose ID is referred to in the `target` element's `data-clipboard-target` attribute, if any; otherwise `null`</dd>
  </dl>
</dd>
</dl>


#### copy

On `mousedown` (and after the `beforecopy` event), the Flash object will fire off a `copy` event. If the HTML object
has `data-clipboard-text` or `data-clipboard-target`, then ZeroClipboard will take care of getting an initial set of
data. It will then invoke any "copy" event handlers, in which you can call `event.clipboardData.setData` to set the
text, which will complete the loop.

**IMPORTANT:** If a handler of this event intends to modify the pending data for clipboard injection, it _MUST_ operate
operate synchronously in order to maintain the temporarily elevated permissions granted by the user's `click` event. The
most common "gotcha" for this restriction is if someone wants to make an asynchronous XMLHttpRequest in response to the
`copy` event to get the data to inject &mdash; this won't work; make it a *synchronous* XMLHttpRequest instead, or do the
work in advance before the `copy` event is fired.

```js
client.on( 'copy', function ( event ) {
  event.clipboardData.setData( 'text/plain', 'Copied to clipboard.' );
} );
```

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"copy"`</dd>
    <dt>`target`</dt>
    <dd>The current element that is being provoked, if any; otherwise `window`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object</dd>
    <dt>`relatedTarget`</dt>
    <dd>An element whose ID is referred to in the `target` element's `data-clipboard-target` attribute, if any; otherwise `null`</dd>
    <dt>`clipboardData`</dt>
    <dd>
      <dl>
        <dt>`setData( format, data )`</dt>
        <dd>A method to set `data` of type `format` into the pending data to be placed into the clipboard during injection</dd>
        <dt>`clearData( format )`</dt>
        <dd>A method to clear data of type `format` from the pending data. If `format` is omitted, _**all**_ pending data will be cleared for all formats.</dd>
    </dd>
  </dl>
</dd>
</dl>


#### aftercopy

The `aftercopy` event is fired when the text is copied [or failed to copy] to the clipboard.
Example use:

```js
client.on( 'aftercopy', function ( event ) {
  if ( event.success['text/plain'] ) {
    console.log( 'Copied text to clipboard: ' + event.data['text/plain'] );
  }
  else {
    console.log( 'Failed to copy text to clipboard: ' + event.data['text/plain'] );
  }
} );
```

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"aftercopy"`</dd>
    <dt>`target`</dt>
    <dd>The current element that is being provoked, if any; otherwise `window`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object</dd>
    <dt>`relatedTarget`</dt>
    <dd>An element whose ID is referred to in the `target` element's `data-clipboard-target` attribute, if any; otherwise `null`</dd>
    <dt>`success`</dt>
    <dd>An object with properties for each clipboard format that was attempted for injection. Property values are `true` or `false` depending on the results of the injection attempt.</dd>
    <dt>`data`</dt>
    <dd>An object with properties for each clipboard format that was attempted for injection. Property values are the data ZeroClipboard attempted to inject.</dd>
  </dl>
</dd>
</dl>


#### error

The `error` event is fired under a number of conditions, which will be detailed as sub-sections below.

Some consumers may not consider all `error` types to be critical, and thus ZeroClipboard does not take it upon
itself to implode by calling `ZeroClipboard.destroy()` under error conditions.  However, many consumers may
want to do just that.

Example usage:

```js
client.on( 'error', function ( event ) {
  console.log( 'ZeroClipboard error of type "' + event.name + '" occurred: ' + event.message );
} );
```


##### error[name = "flash-disabled"]

This type of `error` event fires when Flash Player is either not installed or not enabled in the browser.

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"error"`</dd>
    <dt>`name`</dt>
    <dd>`"flash-disabled"`</dd>
    <dt>`message`</dt>
    <dd>A message explaining this event</dd>
    <dt>`target`</dt>
    <dd>`null`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object HTML element, or `null`</dd>
    <dt>`relatedTarget`</dt>
    <dd>`null`</dd>
  </dl>
</dd>
</dl>


##### error[name = "flash-outdated"]

This type of `error` event fires when Flash Player is installed in the browser but the version is too old for ZeroClipboard.
ZeroClipboard requires Flash Player 11.0.0 or above.

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"error"`</dd>
    <dt>`name`</dt>
    <dd>`"flash-outdated"`</dd>
    <dt>`message`</dt>
    <dd>A message explaining this event</dd>
    <dt>`target`</dt>
    <dd>`null`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object HTML element, or `null`</dd>
    <dt>`relatedTarget`</dt>
    <dd>`null`</dd>
    <dt>`version`</dt>
    <dd>The browser's Flash Player version number as a string</dd>
    <dt>`minimumVersion`</dt>
    <dd>The minimum required version of Flash Player for ZeroClipboard, i.e. `"11.0.0"`</dd>
  </dl>
</dd>
</dl>


##### error[name = "flash-unavailable"]

This type of `error` event fires when the browser's installation of Flash Player cannot communicate bidirectionally with JavaScript.

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"error"`</dd>
    <dt>`name`</dt>
    <dd>`"flash-unavailable"`</dd>
    <dt>`message`</dt>
    <dd>A message explaining this event</dd>
    <dt>`target`</dt>
    <dd>`null`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object HTML element, or `null`</dd>
    <dt>`relatedTarget`</dt>
    <dd>`null`</dd>
    <dt>`version`</dt>
    <dd>The browser's Flash Player version number as a string</dd>
    <dt>`minimumVersion`</dt>
    <dd>The minimum required version of Flash Player for ZeroClipboard, i.e. `"11.0.0"`</dd>
  </dl>
</dd>
</dl>


##### error[name = "flash-deactivated"]

This type of `error` event fires when the browser's installation of Flash Player is either too old for the browser [but
_not_ too old for ZeroClipboard] or if Flash objects are configured as click-to-play and the user does not authorize
it within `_globalConfig.flashLoadTimeout` milliseconds or does not authorize it at all.

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"error"`</dd>
    <dt>`name`</dt>
    <dd>`"flash-deactivated"`</dd>
    <dt>`message`</dt>
    <dd>A message explaining this event</dd>
    <dt>`target`</dt>
    <dd>`null`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object HTML element, or `null`</dd>
    <dt>`relatedTarget`</dt>
    <dd>`null`</dd>
    <dt>`version`</dt>
    <dd>The browser's Flash Player version number as a string</dd>
    <dt>`minimumVersion`</dt>
    <dd>The minimum required version of Flash Player for ZeroClipboard, i.e. `"11.0.0"`</dd>
  </dl>
</dd>
</dl>


##### error[name = "flash-overdue"]

This type of `error` event fires when the SWF loads successfully but takes longer than
`_globalConfig.flashLoadTimeout` milliseconds to do so. This would likely be caused by
one of the following situations:
 1. Too short of a `_globalConfig.flashLoadTimeout` duration configured
 2. Network latency
 3. The user's installation of Flash is configured as click-to-play but then authorized
    by the user too late such that the SWF does not finish loading before the timeout
    period has expired (or it may have expired before they authorized it at all).

The appropriate response to this event is left up to the consumer. For instance, if they
chose to invoke `ZeroClipboard.destroy()` in response to the earlier `deactivatedFlash` event
but then receive this `overdueFlash` event, they may choose to "restart" their process and
construct new ZeroClipboard client instances, or they may choose to just log the error to their
server so they can consider increasing the allowed timeout duration in the future.

This may be especially important for SPA or PJAX-based applications to consider as their users
may remain on a single page for an extended period of time during which they _possibly_ could
have enjoyed an improved experience if ZeroClipboard had been "restarted" after an initial hiccup.

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"error"`</dd>
    <dt>`name`</dt>
    <dd>`"flash-overdue"`</dd>
    <dt>`message`</dt>
    <dd>A message explaining this event</dd>
    <dt>`target`</dt>
    <dd>`null`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object</dd>
    <dt>`relatedTarget`</dt>
    <dd>`null`</dd>
    <dt>`version`</dt>
    <dd>The browser's Flash Player version number as a string</dd>
    <dt>`minimumVersion`</dt>
    <dd>The minimum required version of Flash Player for ZeroClipboard, i.e. `"11.0.0"`</dd>
  </dl>
</dd>
</dl>


#### mouseover

_**DEPRECATED**_. The `mouseover` event is fired when the user's mouse pointer enters the Flash movie.  You can use this to simulate a rollover effect on your DOM element, however see *CSS Effects* for an easier way to do this.  Example use:

```js
client.on( 'mouseover', function ( event ) {
  console.log( "mouse is over movie" );
});
```

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"mouseover"`</dd>
    <dt>`target`</dt>
    <dd>The current element that is being provoked, if any; otherwise `window`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object</dd>
    <dt>`relatedTarget`</dt>
    <dd>An element whose ID is referred to in the `target` element's `data-clipboard-target` attribute, if any; otherwise `null`</dd>
    <dt>`altKey`</dt>
    <dd>`true` if the Alt key is active</dd>
    <dt>`ctrlKey`</dt>
    <dd>`true` on Windows and Linux if the Ctrl key is active. `true` on Mac if either the Ctrl key or the Command key is active. Otherwise, `false`.</dd>
    <dt>`shiftKey`</dt>
    <dd>`true` if the Shift key is active; `false` if it is inactive.</dd>
  </dl>
</dd>
</dl>


#### mouseout

_**DEPRECATED**_. The `mouseout` event is fired when the user's mouse pointer leaves the Flash movie.  You can use this to simulate a rollover effect on your DOM element, however see *CSS Effects* for an easier way to do this.  Example use:

```js
client.on( 'mouseout', function ( event ) {
  console.log( "mouse has left movie" );
} );
```

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"mouseover"`</dd>
    <dt>`target`</dt>
    <dd>The current element that is being provoked, if any; otherwise `window`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object</dd>
    <dt>`relatedTarget`</dt>
    <dd>An element whose ID is referred to in the `target` element's `data-clipboard-target` attribute, if any; otherwise `null`</dd>
    <dt>`altKey`</dt>
    <dd>`true` if the Alt key is active</dd>
    <dt>`ctrlKey`</dt>
    <dd>`true` on Windows and Linux if the Ctrl key is active. `true` on Mac if either the Ctrl key or the Command key is active. Otherwise, `false`.</dd>
    <dt>`shiftKey`</dt>
    <dd>`true` if the Shift key is active; `false` if it is inactive.</dd>
  </dl>
</dd>
</dl>


#### mousedown

_**DEPRECATED**_. The `mousedown` event is fired when the user clicks on the Flash movie.  Please note that this does not guarantee that the user will release the mouse button while still over the movie (i.e. resulting in a click).  You can use this to simulate a click effect on your DOM element, however see *CSS Effects* for an easier way to do this.  Example use:

```js
client.on( 'mousedown', function ( event ) {
  console.log( "mouse button is down" );
} );
```

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"mouseover"`</dd>
    <dt>`target`</dt>
    <dd>The current element that is being provoked, if any; otherwise `window`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object</dd>
    <dt>`relatedTarget`</dt>
    <dd>An element whose ID is referred to in the `target` element's `data-clipboard-target` attribute, if any; otherwise `null`</dd>
    <dt>`altKey`</dt>
    <dd>`true` if the Alt key is active</dd>
    <dt>`ctrlKey`</dt>
    <dd>`true` on Windows and Linux if the Ctrl key is active. `true` on Mac if either the Ctrl key or the Command key is active. Otherwise, `false`.</dd>
    <dt>`shiftKey`</dt>
    <dd>`true` if the Shift key is active; `false` if it is inactive.</dd>
  </dl>
</dd>
</dl>


#### mouseup

_**DEPRECATED**_. The `mouseup` event is fired when the user releases the mouse button (having first pressed the mouse button while hovering over the movie).  Please note that this does not guarantee that the mouse cursor is still over the movie (i.e. resulting in a click).  You can use this to simulate a click effect on your DOM element, however see *CSS Effects* for an easier way to do this.  Example use:

```js
client.on( 'mouseup', function ( event ) {
  console.log( "mouse button is up" );
} );
```

The handler execution context is as follows:

<dl>
<dt>`this`</dt>
<dd>The ZeroClipboard client instance to which this event handler was attached.</dd>
<dt>`event`</dt>
<dd>
  <dl>
    <dt>`type`</dt>
    <dd>`"mouseover"`</dd>
    <dt>`target`</dt>
    <dd>The current element that is being provoked, if any; otherwise `window`</dd>
    <dt>`currentTarget`</dt>
    <dd>An object reference to the Flash object</dd>
    <dt>`relatedTarget`</dt>
    <dd>An element whose ID is referred to in the `target` element's `data-clipboard-target` attribute, if any; otherwise `null`</dd>
    <dt>`altKey`</dt>
    <dd>`true` if the Alt key is active</dd>
    <dt>`ctrlKey`</dt>
    <dd>`true` on Windows and Linux if the Ctrl key is active. `true` on Mac if either the Ctrl key or the Command key is active. Otherwise, `false`.</dd>
    <dt>`shiftKey`</dt>
    <dd>`true` if the Shift key is active; `false` if it is inactive.</dd>
  </dl>
</dd>
</dl>


## Examples

The following are complete, working examples of using the clipboard client library in HTML pages.


### Minimal Example

Here is a quick example using as few calls as possible:

```html
<html>
  <body>

    <div id="d_clip_button" data-clipboard-text="Copy Me!" title="Click to copy." style="border:1px solid black; padding:20px;">Copy To Clipboard</div>

    <script type="text/javascript" src="ZeroClipboard.js"></script>
    <script type="text/javascript">
      var client = new ZeroClipboard( document.getElementById('d_clip_button') );
    </script>
  </body>
</html>
```

When clicked, the text "Copy me!" will be copied to the clipboard.


### A More Complete Example

Here is a more complete example which exercises many of the configuration options and event handlers:

```html
<html>
  <head>
    <style type="text/css">
      .clip_button {
        text-align: center;
        border: 1px solid black;
        background-color: #ccc;
        margin: 10px;
        padding: 10px;
      }
      .clip_button.zeroclipboard-is-hover { background-color: #eee; }
      .clip_button.zeroclipboard-is-active { background-color: #aaa; }
    </style>
  </head>
  <body>
    <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
    <script type="text/javascript" src="ZeroClipboard.js"></script>

    <div class="clip_button">Copy To Clipboard</div>
    <div class="clip_button">Copy This Too!</div>

    <script type="text/javascript">
      var client = new ZeroClipboard( $('.clip_button') );

      client.on( 'ready', function(event) {
        // console.log( 'movie is loaded' );

        client.on( 'copy', function(event) {
          event.clipboardData.setData('text/plain', event.target.innerHTML);
        } );

        client.on( 'aftercopy', function(event) {
          console.log('Copied text to clipboard: ' + event.data['text/plain']);
        } );
      } );

      client.on( 'error', function(event) {
        // console.log( 'ZeroClipboard error of type "' + event.name + '": ' + event.message );
        ZeroClipboard.destroy();
      } );
    </script>
  </body>
</html>
```


## AMD

If using [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) with a library such as [RequireJS](http://requirejs.org/), etc., you shouldn't need to do any special configuration for ZeroClipboard to work correctly as an AMD module.


## CommonJS

If using [CommonJS](http://wiki.commonjs.org/wiki/Modules/1.1) with a library such as [Browserify](http://browserify.org/), [Webmake](https://github.com/medikoo/modules-webmake), etc., you shouldn't need to do any special configuration for ZeroClipboard to work correctly as an CommonJS module.


## Known Conflicts With Other Libraries

### [IE freezes when clicking a ZeroClipboard clipped element within a Bootstrap Modal](https://github.com/zeroclipboard/zeroclipboard/issues/159).
 - **Cause:** Bootstrap's Modal has an `enforceFocus` function that tries to keep the focus on the modal.
   However, since the ZeroClipboard container is an immediate child of the `body`, this enforcement conflicts. Note that
   this workaround actually _overrides_ a core Bootstrap Modal function, and as such must be kept in sync as this function
   changes in future versions of Bootstrap.
 - **Workaround:** _Targeted against [Bootstrap v3.x](https://github.com/twbs/bootstrap/blob/96a9e1bae06cb21f8cf72ec528b8e31b6ab27272/js/modal.js#L115-123)._

```js
if (/MSIE|Trident/.test(window.navigator.userAgent)) {
  (function($) {
    var proto = $.fn.modal.Constructor.prototype;
    proto.enforceFocus = function () {
      $(document)
        .off('focusin.bs.modal') // guard against infinite focus loop
        .on('focusin.bs.modal', $.proxy(function (e) {
          if (this.$element[0] !== e.target &&
             !this.$element.has(e.target).length &&
             /* Adding this final condition check is the only real change */
             !$(e.target).closest('.global-zeroclipboard-container').length) {
            this.$element.focus()
          }
        }, this))
    };
  })(window.jQuery);
}
```

### [IE freezes when clicking a ZeroClipboard clipped element within a jQuery UI [Modal] Dialog](https://github.com/zeroclipboard/zeroclipboard/issues/159).
 - **Cause:** jQuery UI's Dialog (with `{ modal: true }` set) has a `_keepFocus` function that tries to keep the focus on the modal.
   However, since the ZeroClipboard container is an immediate child of the `body`, this enforcement conflicts. Luckily, jQuery UI offers
   more natural extension points than Bootstrap, so the workaround is smaller and less likely to be broken in future versions.
 - **Workaround:** _Targeted against [jQuery UI v1.10.x](https://github.com/jquery/jquery-ui/blob/457b275880b63b05b16b7c9ee6c22f29f682ebc8/ui/jquery.ui.dialog.js#L695-703)._

```js
if (/MSIE|Trident/.test(window.navigator.userAgent)) {
  (function($) {
    $.widget( "ui.dialog", $.ui.dialog, {
      _allowInteraction: function( event ) {
        return this._super(event) || $( event.target ).closest( ".global-zeroclipboard-container" ).length;
      }
    } );
  })(window.jQuery);
}
```


## Browser Support

This library is fully compatible with Flash Player 11.0.0 and above, which requires that the clipboard copy operation be initiated by a user click event inside the Flash movie. This is achieved by automatically floating the invisible movie on top of a [DOM](http://en.wikipedia.org/wiki/Document_Object_Model) element of your choice. Standard mouse events are even propagated out to your DOM element, so you can still have rollover and mousedown effects.

Definitely works in IE8+ and all of the evergreen browsers.
Should also work in IE7 if you provide a polyfill for the global `JSON` object, e.g.
[JSON 2](https://github.com/douglascrockford/JSON-js/blob/master/json2.js) or
[JSON 3](http://bestiejs.github.io/json3/).


## OS Considerations

Because ZeroClipboard will be interacting with your users' system clipboards, there are some special considerations
specific to the users' operating systems that you should be aware of. With this information, you can make informed
decisions of how _your_ site should handle each of these situations.

 - **Windows:**
     - If you want to ensure that your Windows users will be able to paste their copied text into Windows
       Notepad and have it honor line breaks, you'll need to ensure that the text uses the sequence `\r\n` instead of
       just `\n` for line breaks.  If the text to copy is based on user input (e.g. a `textarea`), then you can achieve
       this transformation by utilizing the `copy` event handler, e.g.  

      ```js
      client.on('copy', function(event) {
          var text = document.getElementById('yourTextArea').value;
          var windowsText = text.replace(/\n/g, '\r\n');
          event.clipboardData.setData('text/plain', windowsText);
      });
      ```



# Deprecations

By default, ZeroClipboard will issue deprecation warnings to the developer `console`. To disable this, set the
following option:  
```js
ZeroClipboard.config({ debug: false });
```

The current list of deprecations includes:  
 - The `hoverClass` config option &rarr; as of [v1.3.0], removing in [v2.0.0]
     - As of [v2.0.0] (but no sooner), you will be able to use normal `:hover` CSS pseudo-class selectors instead!
 - The `activeClass` config option &rarr; as of [v1.3.0], removing in [v2.0.0]
     - As of [v2.0.0] (but no sooner), you will be able to use normal `:active` CSS pseudo-class selectors instead!
 - Adding `mouseover`/`mouseout`/`mousedown`/`mouseup` handlers via ZeroClipboard &rarr; as of [v1.3.0], removing in [v2.0.0]
     - As of [v2.0.0] (but no sooner), you will be able to use normal event listener attaching functionality for
       these type of non-semantic, elemental events. For example, with jQuery: `$(zcClient.elements()).on("mousedown", fn)`
