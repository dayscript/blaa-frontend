!function($) {
"use strict";

var FOUNDATION_VERSION = '6.0.6';

// Global Foundation object
// This is attached to the window, or used as a module for AMD/Browserify
var Foundation = {
  version: FOUNDATION_VERSION,

  /**
   * Stores initialized plugins.
   */
  _plugins: {},

  /**
   * Stores generated unique ids for plugin instances
   */
  _uuids: [],
  /**
   * Stores currently active plugins.
   */
  _activePlugins: {},

  /**
   * Returns a boolean for RTL support
   */
  rtl: function(){
    return $('html').attr('dir') === 'rtl';
  },
  /**
   * Defines a Foundation plugin, adding it to the `Foundation` namespace and the list of plugins to initialize when reflowing.
   * @param {Object} plugin - The constructor of the plugin.
   */
  plugin: function(plugin, name) {
    // Object key to use when adding to global Foundation object
    // Examples: Foundation.Reveal, Foundation.OffCanvas
    var className = (name || functionName(plugin));
    // Object key to use when storing the plugin, also used to create the identifying data attribute for the plugin
    // Examples: data-reveal, data-off-canvas
    var attrName  = hyphenate(className);

    // Add to the Foundation object and the plugins list (for reflowing)
    this._plugins[attrName] = this[className] = plugin;
  },
  /**
   * @function
   * Creates a pointer to an instance of a Plugin within the Foundation._activePlugins object.
   * Sets the `[data-pluginName="uniqueIdHere"]`, allowing easy access to any plugin's internal methods.
   * Also fires the initialization event for each plugin, consolidating repeditive code.
   * @param {Object} plugin - an instance of a plugin, usually `this` in context.
   * @fires Plugin#init
   */
  registerPlugin: function(plugin){
    var pluginName = functionName(plugin.constructor).toLowerCase();

    plugin.uuid = this.GetYoDigits(6, pluginName);

    if(!plugin.$element.attr('data-' + pluginName)){
      plugin.$element.attr('data-' + pluginName, plugin.uuid);
    }
          /**
           * Fires when the plugin has initialized.
           * @event Plugin#init
           */
    plugin.$element.trigger('init.zf.' + pluginName);

    this._activePlugins[plugin.uuid] = plugin;

    return;
  },
  /**
   * @function
   * Removes the pointer for an instance of a Plugin from the Foundation._activePlugins obj.
   * Also fires the destroyed event for the plugin, consolidating repeditive code.
   * @param {Object} plugin - an instance of a plugin, usually `this` in context.
   * @fires Plugin#destroyed
   */
  unregisterPlugin: function(plugin){
    var pluginName = functionName(plugin.constructor).toLowerCase();

    delete this._activePlugins[plugin.uuid];
    plugin.$element.removeAttr('data-' + pluginName)
          /**
           * Fires when the plugin has been destroyed.
           * @event Plugin#destroyed
           */
          .trigger('destroyed.zf.' + pluginName);

    return;
  },

  /**
   * @function
   * Causes one or more active plugins to re-initialize, resetting event listeners, recalculating positions, etc.
   * @param {String} plugins - optional string of an individual plugin key, attained by calling `$(element).data('pluginName')`, or string of a plugin class i.e. `'dropdown'`
   * @default If no argument is passed, reflow all currently active plugins.
   */
  _reflow: function(plugins){
    var actvPlugins = Object.keys(this._activePlugins);
    var _this = this;

    if(!plugins){
      actvPlugins.forEach(function(p){
        _this._activePlugins[p]._init();
      });

    }else if(typeof plugins === 'string'){
      var namespace = plugins.split('-')[1];

      if(namespace){

        this._activePlugins[plugins]._init();

      }else{
        namespace = new RegExp(plugins, 'i');

        actvPlugins.filter(function(p){
          return namespace.test(p);
        }).forEach(function(p){
          _this._activePlugins[p]._init();
        });
      }
    }

  },

  /**
   * returns a random base-36 uid with namespacing
   * @function
   * @param {Number} length - number of random base-36 digits desired. Increase for more random strings.
   * @param {String} namespace - name of plugin to be incorporated in uid, optional.
   * @default {String} '' - if no plugin name is provided, nothing is appended to the uid.
   * @returns {String} - unique id
   */
  GetYoDigits: function(length, namespace){
    length = length || 6;
    return Math.round((Math.pow(36, length + 1) - Math.random() * Math.pow(36, length))).toString(36).slice(1) + (namespace ? '-' + namespace : '');
  },
  /**
   * Initialize plugins on any elements within `elem` (and `elem` itself) that aren't already initialized.
   * @param {Object} elem - jQuery object containing the element to check inside. Also checks the element itself, unless it's the `document` object.
   * @param {String|Array} plugins - A list of plugins to initialize. Leave this out to initialize everything.
   */
  reflow: function(elem, plugins) {

    // If plugins is undefined, just grab everything
    if (typeof plugins === 'undefined') {
      plugins = Object.keys(this._plugins);
    }
    // If plugins is a string, convert it to an array with one item
    else if (typeof plugins === 'string') {
      plugins = [plugins];
    }

    var _this = this;

    // Iterate through each plugin
    $.each(plugins, function(i, name) {
      // Get the current plugin
      var plugin = _this._plugins[name];

      // Localize the search to all elements inside elem, as well as elem itself, unless elem === document
      var $elem = $(elem).find('[data-'+name+']').addBack('[data-'+name+']');

      // For each plugin found, initialize it
      $elem.each(function() {
        var $el = $(this),
            opts = {};
        // Don't double-dip on plugins
        if ($el.data('zf-plugin')) {
          console.warn("Tried to initialize "+name+" on an element that already has a Foundation plugin.");
          return;
        }

        if($el.attr('data-options')){
          var thing = $el.attr('data-options').split(';').forEach(function(e, i){
            var opt = e.split(':').map(function(el){ return el.trim(); });
            if(opt[0]) opts[opt[0]] = parseValue(opt[1]);
          });
        }
        try{
          $el.data('zf-plugin', new plugin($(this), opts));
        }catch(er){
          console.error(er);
        }finally{
          return;
        }
      });
    });
  },
  getFnName: functionName,
  transitionend: function($elem){
    var transitions = {
      'transition': 'transitionend',
      'WebkitTransition': 'webkitTransitionEnd',
      'MozTransition': 'transitionend',
      'OTransition': 'otransitionend'
    };
    var elem = document.createElement('div'),
        end;

    for (var t in transitions){
      if (typeof elem.style[t] !== 'undefined'){
        end = transitions[t];
      }
    }
    if(end){
      return end;
    }else{
      end = setTimeout(function(){
        $elem.triggerHandler('transitionend', [$elem]);
      }, 1);
      return 'transitionend';
    }
  }
};


Foundation.util = {
  /**
   * Function for applying a debounce effect to a function call.
   * @function
   * @param {Function} func - Function to be called at end of timeout.
   * @param {Number} delay - Time in ms to delay the call of `func`.
   * @returns function
   */
  throttle: function (func, delay) {
    var timer = null;

    return function () {
      var context = this, args = arguments;

      if (timer === null) {
        timer = setTimeout(function () {
          func.apply(context, args);
          timer = null;
        }, delay);
      }
    };
  }
};

// TODO: consider not making this a jQuery function
// TODO: need way to reflow vs. re-initialize
/**
 * The Foundation jQuery method.
 * @param {String|Array} method - An action to perform on the current jQuery object.
 */
var foundation = function(method) {
  var type = typeof method,
      $meta = $('meta.foundation-mq'),
      $noJS = $('.no-js');

  if(!$meta.length){
    $('<meta class="foundation-mq">').appendTo(document.head);
  }
  if($noJS.length){
    $noJS.removeClass('no-js');
  }

  if(type === 'undefined'){//needs to initialize the Foundation object, or an individual plugin.
    Foundation.MediaQuery._init();
    Foundation.reflow(this);
  }else if(type === 'string'){//an individual method to invoke on a plugin or group of plugins
    var args = Array.prototype.slice.call(arguments, 1);//collect all the arguments, if necessary
    var plugClass = this.data('zfPlugin');//determine the class of plugin

    if(plugClass !== undefined && plugClass[method] !== undefined){//make sure both the class and method exist
      if(this.length === 1){//if there's only one, call it directly.
          plugClass[method].apply(plugClass, args);
      }else{
        this.each(function(i, el){//otherwise loop through the jQuery collection and invoke the method on each
          plugClass[method].apply($(el).data('zfPlugin'), args);
        });
      }
    }else{//error for no class or no method
      throw new ReferenceError("We're sorry, '" + method + "' is not an available method for " + (plugClass ? functionName(plugClass) : 'this element') + '.');
    }
  }else{//error for invalid argument type
    throw new TypeError("We're sorry, '" + type + "' is not a valid parameter. You must use a string representing the method you wish to invoke.");
  }
  return this;
};

window.Foundation = Foundation;
$.fn.foundation = foundation;

// Polyfill for requestAnimationFrame
(function() {
  if (!Date.now || !window.Date.now)
    window.Date.now = Date.now = function() { return new Date().getTime(); };

  var vendors = ['webkit', 'moz'];
  for (var i = 0; i < vendors.length && !window.requestAnimationFrame; ++i) {
      var vp = vendors[i];
      window.requestAnimationFrame = window[vp+'RequestAnimationFrame'];
      window.cancelAnimationFrame = (window[vp+'CancelAnimationFrame']
                                 || window[vp+'CancelRequestAnimationFrame']);
  }
  if (/iP(ad|hone|od).*OS 6/.test(window.navigator.userAgent)
    || !window.requestAnimationFrame || !window.cancelAnimationFrame) {
    var lastTime = 0;
    window.requestAnimationFrame = function(callback) {
        var now = Date.now();
        var nextTime = Math.max(lastTime + 16, now);
        return setTimeout(function() { callback(lastTime = nextTime); },
                          nextTime - now);
    };
    window.cancelAnimationFrame = clearTimeout;
  }
  /**
   * Polyfill for performance.now, required by rAF
   */
  if(!window.performance || !window.performance.now){
    window.performance = {
      start: Date.now(),
      now: function(){ return Date.now() - this.start; }
    };
  }
})();
if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    if (this.prototype) {
      // native functions don't have a prototype
      fNOP.prototype = this.prototype;
    }
    fBound.prototype = new fNOP();

    return fBound;
  };
}
// Polyfill to get the name of a function in IE9
function functionName(fn) {
  if (Function.prototype.name === undefined) {
    var funcNameRegex = /function\s([^(]{1,})\(/;
    var results = (funcNameRegex).exec((fn).toString());
    return (results && results.length > 1) ? results[1].trim() : "";
  }
  else if (fn.prototype === undefined) {
    return fn.constructor.name;
  }
  else {
    return fn.prototype.constructor.name;
  }
}
function parseValue(str){
  if(/true/.test(str)) return true;
  else if(/false/.test(str)) return false;
  else if(!isNaN(str * 1)/* && typeof (str * 1) === "number"*/) return parseFloat(str);
  return str;
}
// Convert PascalCase to kebab-case
// Thank you: http://stackoverflow.com/a/8955580
function hyphenate(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

}(jQuery);

!function(Foundation, window){
  /**
   * Compares the dimensions of an element to a container and determines collision events with container.
   * @function
   * @param {jQuery} element - jQuery object to test for collisions.
   * @param {jQuery} parent - jQuery object to use as bounding container.
   * @param {Boolean} lrOnly - set to true to check left and right values only.
   * @param {Boolean} tbOnly - set to true to check top and bottom values only.
   * @default if no parent object passed, detects collisions with `window`.
   * @returns {Boolean} - true if collision free, false if a collision in any direction.
   */
  var ImNotTouchingYou = function(element, parent, lrOnly, tbOnly){
    var eleDims = GetDimensions(element),
        top, bottom, left, right;

    if(parent){
      var parDims = GetDimensions(parent);

      bottom = (eleDims.offset.top + eleDims.height <= parDims.height + parDims.offset.top);
      top    = (eleDims.offset.top >= parDims.offset.top);
      left   = (eleDims.offset.left >= parDims.offset.left);
      right  = (eleDims.offset.left + eleDims.width <= parDims.width);
    }else{
      bottom = (eleDims.offset.top + eleDims.height <= eleDims.windowDims.height + eleDims.windowDims.offset.top);
      top    = (eleDims.offset.top >= eleDims.windowDims.offset.top);
      left   = (eleDims.offset.left >= eleDims.windowDims.offset.left);
      right  = (eleDims.offset.left + eleDims.width <= eleDims.windowDims.width);
    }
    var allDirs = [bottom, top, left, right];

    if(lrOnly){ return left === right === true; }
    if(tbOnly){ return top === bottom === true; }

    return allDirs.indexOf(false) === -1;
  };

  /**
   * Uses native methods to return an object of dimension values.
   * @function
   * @param {jQuery || HTML} element - jQuery object or DOM element for which to get the dimensions. Can be any element other that document or window.
   * @returns {Object} - nested object of integer pixel values
   * TODO - if element is window, return only those values.
   */
  var GetDimensions = function(elem, test){
    elem = elem.length ? elem[0] : elem;

    if(elem === window || elem === document){ throw new Error("I'm sorry, Dave. I'm afraid I can't do that."); }

    var rect = elem.getBoundingClientRect(),
        parRect = elem.parentNode.getBoundingClientRect(),
        winRect = document.body.getBoundingClientRect(),
        winY = window.pageYOffset,
        winX = window.pageXOffset;

    return {
      width: rect.width,
      height: rect.height,
      offset: {
        top: rect.top + winY,
        left: rect.left + winX
      },
      parentDims: {
        width: parRect.width,
        height: parRect.height,
        offset: {
          top: parRect.top + winY,
          left: parRect.left + winX
        }
      },
      windowDims: {
        width: winRect.width,
        height: winRect.height,
        offset: {
          top: winY,
          left: winX
        }
      }
    };
  };
  /**
   * Returns an object of top and left integer pixel values for dynamically rendered elements,
   * such as: Tooltip, Reveal, and Dropdown
   * @function
   * @param {jQuery} element - jQuery object for the element being positioned.
   * @param {jQuery} anchor - jQuery object for the element's anchor point.
   * @param {String} position - a string relating to the desired position of the element, relative to it's anchor
   * @param {Number} vOffset - integer pixel value of desired vertical separation between anchor and element.
   * @param {Number} hOffset - integer pixel value of desired horizontal separation between anchor and element.
   * @param {Boolean} isOverflow - if a collision event is detected, sets to true to default the element to full width - any desired offset.
   * TODO alter/rewrite to work with `em` values as well/instead of pixels
   */
  var GetOffsets = function(element, anchor, position, vOffset, hOffset, isOverflow){
    var $eleDims = GetDimensions(element),
    // var $eleDims = GetDimensions(element),
        $anchorDims = anchor ? GetDimensions(anchor) : null;
        // $anchorDims = anchor ? GetDimensions(anchor) : null;
    switch(position){
      case 'top':
        return {
          left: $anchorDims.offset.left,
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: $anchorDims.offset.top
        };
        break;
      case 'right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset,
          top: $anchorDims.offset.top
        };
        break;
      case 'center top':
        return {
          left: ($anchorDims.offset.left + ($anchorDims.width / 2)) - ($eleDims.width / 2),
          top: $anchorDims.offset.top - ($eleDims.height + vOffset)
        };
        break;
      case 'center bottom':
        return {
          left: isOverflow ? hOffset : (($anchorDims.offset.left + ($anchorDims.width / 2)) - ($eleDims.width / 2)),
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
        break;
      case 'center left':
        return {
          left: $anchorDims.offset.left - ($eleDims.width + hOffset),
          top: ($anchorDims.offset.top + ($anchorDims.height / 2)) - ($eleDims.height / 2)
        };
        break;
      case 'center right':
        return {
          left: $anchorDims.offset.left + $anchorDims.width + hOffset + 1,
          top: ($anchorDims.offset.top + ($anchorDims.height / 2)) - ($eleDims.height / 2)
        };
        break;
      case 'center':
        return {
          left: ($eleDims.windowDims.offset.left + ($eleDims.windowDims.width / 2)) - ($eleDims.width / 2),
          top: ($eleDims.windowDims.offset.top + ($eleDims.windowDims.height / 2)) - ($eleDims.height / 2)
        };
        break;
      case 'reveal':
        return {
          left: ($eleDims.windowDims.width - $eleDims.width) / 2,
          top: $eleDims.windowDims.offset.top + vOffset
        };
      case 'reveal full':
        return {
          left: $eleDims.windowDims.offset.left,
          top: $eleDims.windowDims.offset.top
        };
        break;
      default:
        return {
          left: $anchorDims.offset.left,
          top: $anchorDims.offset.top + $anchorDims.height + vOffset
        };
    }
  };
  Foundation.Box = {
    ImNotTouchingYou: ImNotTouchingYou,
    GetDimensions: GetDimensions,
    GetOffsets: GetOffsets
  };
}(window.Foundation, window);

/*******************************************
 *                                         *
 * This util was created by Marius Olbertz *
 * Please thank Marius on GitHub /owlbertz *
 * or the web http://www.mariusolbertz.de/ *
 *                                         *
 ******************************************/
!function($, Foundation){
  'use strict';
  Foundation.Keyboard = {};

  var keyCodes = {
    9: 'TAB',
    13: 'ENTER',
    27: 'ESCAPE',
    32: 'SPACE',
    37: 'ARROW_LEFT',
    38: 'ARROW_UP',
    39: 'ARROW_RIGHT',
    40: 'ARROW_DOWN'
  };

  // constants for easier comparing Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
  var keys = (function(kcs) {
    var k = {};
    for (var kc in kcs) k[kcs[kc]] = kcs[kc];
    return k;
  })(keyCodes);

  Foundation.Keyboard.keys = keys;

  /**
   * Parses the (keyboard) event and returns a String that represents its key
   * Can be used like Foundation.parseKey(event) === Foundation.keys.SPACE
   * @param {Event} event - the event generated by the event handler
   * @return String key - String that represents the key pressed
   */
  var parseKey = function(event) {
    var key = keyCodes[event.which || event.keyCode] || String.fromCharCode(event.which).toUpperCase();
    if (event.shiftKey) key = 'SHIFT_' + key;
    if (event.ctrlKey) key = 'CTRL_' + key;
    if (event.altKey) key = 'ALT_' + key;
    return key;
  };
  Foundation.Keyboard.parseKey = parseKey;


  // plain commands per component go here, ltr and rtl are merged based on orientation
  var commands = {};

  /**
   * Handles the given (keyboard) event
   * @param {Event} event - the event generated by the event handler
   * @param {Object} component - Foundation component, e.g. Slider or Reveal
   * @param {Objects} functions - collection of functions that are to be executed
   */
  var handleKey = function(event, component, functions) {
    var commandList = commands[Foundation.getFnName(component)],
      keyCode = parseKey(event),
      cmds,
      command,
      fn;
    if (!commandList) return console.warn('Component not defined!');

    if (typeof commandList.ltr === 'undefined') { // this component does not differentiate between ltr and rtl
        cmds = commandList; // use plain list
    } else { // merge ltr and rtl: if document is rtl, rtl overwrites ltr and vice versa
        if (Foundation.rtl()) cmds = $.extend({}, commandList.ltr, commandList.rtl);

        else cmds = $.extend({}, commandList.rtl, commandList.ltr);
    }
    command = cmds[keyCode];


    fn = functions[command];
    if (fn && typeof fn === 'function') { // execute function with context of the component if exists
        fn.apply(component);
        if (functions.handled || typeof functions.handled === 'function') { // execute function when event was handled
            functions.handled.apply(component);
        }
    } else {
        if (functions.unhandled || typeof functions.unhandled === 'function') { // execute function when event was not handled
            functions.unhandled.apply(component);
        }
    }
  };
  Foundation.Keyboard.handleKey = handleKey;

  /**
   * Finds all focusable elements within the given `$element`
   * @param {jQuery} $element - jQuery object to search within
   * @return {jQuery} $focusable - all focusable elements within `$element`
   */
  var findFocusable = function($element) {
    return $element.find('a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]').filter(function() {
      if (!$(this).is(':visible') || $(this).attr('tabindex') < 0) { return false; } //only have visible elements and those that have a tabindex greater or equal 0
      return true;
    });
  };
  Foundation.Keyboard.findFocusable = findFocusable;

  /**
   * Returns the component name name
   * @param {Object} component - Foundation component, e.g. Slider or Reveal
   * @return String componentName
   */

  var register = function(componentName, cmds) {
    commands[componentName] = cmds;
  };
  Foundation.Keyboard.register = register;
}(jQuery, window.Foundation);

!function($, Foundation) {

// Default set of media queries
var defaultQueries = {
  'default' : 'only screen',
  landscape : 'only screen and (orientation: landscape)',
  portrait : 'only screen and (orientation: portrait)',
  retina : 'only screen and (-webkit-min-device-pixel-ratio: 2),' +
    'only screen and (min--moz-device-pixel-ratio: 2),' +
    'only screen and (-o-min-device-pixel-ratio: 2/1),' +
    'only screen and (min-device-pixel-ratio: 2),' +
    'only screen and (min-resolution: 192dpi),' +
    'only screen and (min-resolution: 2dppx)'
};

var MediaQuery = {
  queries: [],
  current: '',

  /**
   * Checks if the screen is at least as wide as a breakpoint.
   * @function
   * @param {String} size - Name of the breakpoint to check.
   * @returns {Boolean} `true` if the breakpoint matches, `false` if it's smaller.
   */
  atLeast: function(size) {
    var query = this.get(size);

    if (query) {
      return window.matchMedia(query).matches;
    }

    return false;
  },

  /**
   * Gets the media query of a breakpoint.
   * @function
   * @param {String} size - Name of the breakpoint to get.
   * @returns {String|null} - The media query of the breakpoint, or `null` if the breakpoint doesn't exist.
   */
  get: function(size) {
    for (var i in this.queries) {
      var query = this.queries[i];
      if (size === query.name) return query.value;
    }

    return null;
  },

  /**
   * Initializes the media query helper, by extracting the breakpoint list from the CSS and activating the breakpoint watcher.
   * @function
   * @private
   */
  _init: function() {
    var self = this;
    var extractedStyles = $('.foundation-mq').css('font-family');
    var namedQueries;

    namedQueries = parseStyleToObject(extractedStyles);

    for (var key in namedQueries) {
      self.queries.push({
        name: key,
        value: 'only screen and (min-width: ' + namedQueries[key] + ')'
      });
    }

    this.current = this._getCurrentSize();

    this._watcher();

    // Extend default queries
    // namedQueries = $.extend(defaultQueries, namedQueries);
  },

  /**
   * Gets the current breakpoint name by testing every breakpoint and returning the last one to match (the biggest one).
   * @function
   * @private
   * @returns {String} Name of the current breakpoint.
   */
  _getCurrentSize: function() {
    var matched;

    for (var i in this.queries) {
      var query = this.queries[i];

      if (window.matchMedia(query.value).matches) {
        matched = query;
      }
    }

    if(typeof matched === 'object') {
      return matched.name;
    } else {
      return matched;
    }
  },

  /**
   * Activates the breakpoint watcher, which fires an event on the window whenever the breakpoint changes.
   * @function
   * @private
   */
  _watcher: function() {
    var _this = this;

    $(window).on('resize.zf.mediaquery', function() {
      var newSize = _this._getCurrentSize();

      if (newSize !== _this.current) {
        // Broadcast the media query change on the window
        $(window).trigger('changed.zf.mediaquery', [newSize, _this.current]);

        // Change the current media query
        _this.current = newSize;
      }
    });
  }
};

Foundation.MediaQuery = MediaQuery;

// matchMedia() polyfill - Test a CSS media type/query in JS.
// Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license
window.matchMedia || (window.matchMedia = function() {
  'use strict';

  // For browsers that support matchMedium api such as IE 9 and webkit
  var styleMedia = (window.styleMedia || window.media);

  // For those that don't support matchMedium
  if (!styleMedia) {
    var style   = document.createElement('style'),
    script      = document.getElementsByTagName('script')[0],
    info        = null;

    style.type  = 'text/css';
    style.id    = 'matchmediajs-test';

    script.parentNode.insertBefore(style, script);

    // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
    info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

    styleMedia = {
      matchMedium: function(media) {
        var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

        // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
        if (style.styleSheet) {
          style.styleSheet.cssText = text;
        } else {
          style.textContent = text;
        }

        // Test if media query is true or false
        return info.width === '1px';
      }
    };
  }

  return function(media) {
    return {
      matches: styleMedia.matchMedium(media || 'all'),
      media: media || 'all'
    };
  };
}());

// Thank you: https://github.com/sindresorhus/query-string
function parseStyleToObject(str) {
  var styleObject = {};

  if (typeof str !== 'string') {
    return styleObject;
  }

  str = str.trim().slice(1, -1); // browsers re-quote string style values

  if (!str) {
    return styleObject;
  }

  styleObject = str.split('&').reduce(function(ret, param) {
    var parts = param.replace(/\+/g, ' ').split('=');
    var key = parts[0];
    var val = parts[1];
    key = decodeURIComponent(key);

    // missing `=` should be `null`:
    // http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
    val = val === undefined ? null : decodeURIComponent(val);

    if (!ret.hasOwnProperty(key)) {
      ret[key] = val;
    } else if (Array.isArray(ret[key])) {
      ret[key].push(val);
    } else {
      ret[key] = [ret[key], val];
    }
    return ret;
  }, {});

  return styleObject;
}

}(jQuery, Foundation);

/**
 * Motion module.
 * @module foundation.motion
 */
!function($, Foundation) {

var initClasses   = ['mui-enter', 'mui-leave'];
var activeClasses = ['mui-enter-active', 'mui-leave-active'];

function animate(isIn, element, animation, cb) {
  element = $(element).eq(0);

  if (!element.length) return;

  var initClass = isIn ? initClasses[0] : initClasses[1];
  var activeClass = isIn ? activeClasses[0] : activeClasses[1];

  // Set up the animation
  reset();
  element.addClass(animation)
         .css('transition', 'none');
        //  .addClass(initClass);
  // if(isIn) element.show();
  requestAnimationFrame(function() {
    element.addClass(initClass);
    if (isIn) element.show();
  });
  // Start the animation
  requestAnimationFrame(function() {
    element[0].offsetWidth;
    element.css('transition', '');
    element.addClass(activeClass);
  });
  // Move(500, element, function(){
  //   // element[0].offsetWidth;
  //   element.css('transition', '');
  //   element.addClass(activeClass);
  // });

  // Clean up the animation when it finishes
  element.one(Foundation.transitionend(element), finish);//.one('finished.zf.animate', finish);

  // Hides the element (for out animations), resets the element, and runs a callback
  function finish() {
    if (!isIn) element.hide();
    reset();
    if (cb) cb.apply(element);
  }

  // Resets transitions and removes motion-specific classes
  function reset() {
    element[0].style.transitionDuration = 0;
    element.removeClass(initClass + ' ' + activeClass + ' ' + animation);
  }
}

var Motion = {
  animateIn: function(element, animation, /*duration,*/ cb) {
    animate(true, element, animation, cb);
  },

  animateOut: function(element, animation, /*duration,*/ cb) {
    animate(false, element, animation, cb);
  }
};

var Move = function(duration, elem, fn){
  var anim, prog, start = null;
  // console.log('called');

  function move(ts){
    if(!start) start = window.performance.now();
    // console.log(start, ts);
    prog = ts - start;
    fn.apply(elem);

    if(prog < duration){ anim = window.requestAnimationFrame(move, elem); }
    else{
      window.cancelAnimationFrame(anim);
      elem.trigger('finished.zf.animate', [elem]).triggerHandler('finished.zf.animate', [elem]);
    }
  }
  anim = window.requestAnimationFrame(move);
};

Foundation.Move = Move;
Foundation.Motion = Motion;

}(jQuery, Foundation);

!function($, Foundation){
  'use strict';
  Foundation.Nest = {
    Feather: function(menu, type){
      menu.attr('role', 'menubar');
      type = type || 'zf';
      var items = menu.find('li').attr({'role': 'menuitem'}),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';
      menu.find('a:first').attr('tabindex', 0);
      items.each(function(){
        var $item = $(this),
            $sub = $item.children('ul');
        if($sub.length){
          $item.addClass('has-submenu ' + hasSubClass)
               .attr({
                 'aria-haspopup': true,
                 'aria-selected': false,
                 'aria-expanded': false,
                 'aria-label': $item.children('a:first').text()
               });
          $sub.addClass('submenu ' + subMenuClass)
              .attr({
                'data-submenu': '',
                'aria-hidden': true,
                'role': 'menu'
              });
        }
        if($item.parent('[data-submenu]').length){
          $item.addClass('is-submenu-item ' + subItemClass);
        }
      });
      return;
    },
    Burn: function(menu, type){
      var items = menu.find('li').removeAttr('tabindex'),
          subMenuClass = 'is-' + type + '-submenu',
          subItemClass = subMenuClass + '-item',
          hasSubClass = 'is-' + type + '-submenu-parent';

      // menu.find('.is-active').removeClass('is-active');
      menu.find('*')
      // menu.find('.' + subMenuClass + ', .' + subItemClass + ', .is-active, .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
          .removeClass(subMenuClass + ' ' + subItemClass + ' ' + hasSubClass + ' has-submenu is-submenu-item submenu is-active')
          .removeAttr('data-submenu').css('display', '');

      // console.log(      menu.find('.' + subMenuClass + ', .' + subItemClass + ', .has-submenu, .is-submenu-item, .submenu, [data-submenu]')
      //           .removeClass(subMenuClass + ' ' + subItemClass + ' has-submenu is-submenu-item submenu')
      //           .removeAttr('data-submenu'));
      // items.each(function(){
      //   var $item = $(this),
      //       $sub = $item.children('ul');
      //   if($item.parent('[data-submenu]').length){
      //     $item.removeClass('is-submenu-item ' + subItemClass);
      //   }
      //   if($sub.length){
      //     $item.removeClass('has-submenu');
      //     $sub.removeClass('submenu ' + subMenuClass).removeAttr('data-submenu');
      //   }
      // });
    }
  };
}(jQuery, window.Foundation);

!function($, Foundation){
  'use strict';
  var Timer = function(elem, options, cb){
    var _this = this,
        duration = options.duration,//options is an object for easily adding features later.
        nameSpace = Object.keys(elem.data())[0] || 'timer',
        remain = -1,
        start,
        timer;

    this.restart = function(){
      remain = -1;
      clearTimeout(timer);
      this.start();
    };

    this.start = function(){
      // if(!elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      remain = remain <= 0 ? duration : remain;
      elem.data('paused', false);
      start = Date.now();
      timer = setTimeout(function(){
        if(options.infinite){
          _this.restart();//rerun the timer.
        }
        cb();
      }, remain);
      elem.trigger('timerstart.zf.' + nameSpace);
    };

    this.pause = function(){
      //if(elem.data('paused')){ return false; }//maybe implement this sanity check if used for other things.
      clearTimeout(timer);
      elem.data('paused', true);
      var end = Date.now();
      remain = remain - (end - start);
      elem.trigger('timerpaused.zf.' + nameSpace);
    };
  };
  /**
   * Runs a callback function when images are fully loaded.
   * @param {Object} images - Image(s) to check if loaded.
   * @param {Func} callback - Function to execute when image is fully loaded.
   */
  var onImagesLoaded = function(images, callback){
    var self = this,
        unloaded = images.length;

    if (unloaded === 0) {
      callback();
    }

    var singleImageLoaded = function() {
      unloaded--;
      if (unloaded === 0) {
        callback();
      }
    };

    images.each(function() {
      if (this.complete) {
        singleImageLoaded();
      }
      else if (typeof this.naturalWidth !== 'undefined' && this.naturalWidth > 0) {
        singleImageLoaded();
      }
      else {
        $(this).one('load', function() {
          singleImageLoaded();
        });
      }
    });
  };

  Foundation.Timer = Timer;
  Foundation.onImagesLoaded = onImagesLoaded;
}(jQuery, window.Foundation);

//**************************************************
//**Work inspired by multiple jquery swipe plugins**
//**Done by Yohai Ararat ***************************
//**************************************************
(function($) {

  $.spotSwipe = {
    version: '1.0.0',
    enabled: 'ontouchstart' in document.documentElement,
    preventDefault: true,
    moveThreshold: 75,
    timeThreshold: 200
  };

  var   startPosX,
        startPosY,
        startTime,
        elapsedTime,
        isMoving = false;

  function onTouchEnd() {
    //  alert(this);
    this.removeEventListener('touchmove', onTouchMove);
    this.removeEventListener('touchend', onTouchEnd);
    isMoving = false;
  }

  function onTouchMove(e) {
    if ($.spotSwipe.preventDefault) { e.preventDefault(); }
    if(isMoving) {
      var x = e.touches[0].pageX;
      var y = e.touches[0].pageY;
      var dx = startPosX - x;
      var dy = startPosY - y;
      var dir;
      elapsedTime = new Date().getTime() - startTime;
      if(Math.abs(dx) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
        dir = dx > 0 ? 'left' : 'right';
      }
      else if(Math.abs(dy) >= $.spotSwipe.moveThreshold && elapsedTime <= $.spotSwipe.timeThreshold) {
        dir = dy > 0 ? 'down' : 'up';
      }
      if(dir) {
        onTouchEnd.call(this);
        $(this).trigger('swipe', dir).trigger('swipe' + dir);
      }
    }
  }

  function onTouchStart(e) {
    if (e.touches.length == 1) {
      startPosX = e.touches[0].pageX;
      startPosY = e.touches[0].pageY;
      isMoving = true;
      startTime = new Date().getTime();
      this.addEventListener('touchmove', onTouchMove, false);
      this.addEventListener('touchend', onTouchEnd, false);
    }
  }

  function init() {
    this.addEventListener && this.addEventListener('touchstart', onTouchStart, false);
  }

  function teardown() {
    this.removeEventListener('touchstart', onTouchStart);
  }

  $.event.special.swipe = { setup: init };

  $.each(['left', 'up', 'down', 'right'], function () {
    $.event.special['swipe' + this] = { setup: function(){
      $(this).on('swipe', $.noop);
    } };
  });
})(jQuery);
/****************************************************
 * Method for adding psuedo drag events to elements *
 ***************************************************/
!function($){
  $.fn.addTouch = function(){
    this.each(function(i,el){
      $(el).bind('touchstart touchmove touchend touchcancel',function(){
        //we pass the original event object because the jQuery event
        //object is normalized to w3c specs and does not provide the TouchList
        handleTouch(event);
      });
    });

    var handleTouch = function(event){
      var touches = event.changedTouches,
          first = touches[0],
          eventTypes = {
            touchstart: 'mousedown',
            touchmove: 'mousemove',
            touchend: 'mouseup'
          },
          type = eventTypes[event.type];

      var simulatedEvent = document.createEvent('MouseEvent');
      simulatedEvent.initMouseEvent(type, true, true, window, 1, first.screenX, first.screenY, first.clientX, first.clientY, false, false, false, false, 0/*left*/, null);
      first.target.dispatchEvent(simulatedEvent);
    };
  };
}(jQuery);


//**********************************
//**From the jQuery Mobile Library**
//**need to recreate functionality**
//**and try to improve if possible**
//**********************************

/* Removing the jQuery function ****
************************************

(function( $, window, undefined ) {

	var $document = $( document ),
		// supportTouch = $.mobile.support.touch,
		touchStartEvent = 'touchstart'//supportTouch ? "touchstart" : "mousedown",
		touchStopEvent = 'touchend'//supportTouch ? "touchend" : "mouseup",
		touchMoveEvent = 'touchmove'//supportTouch ? "touchmove" : "mousemove";

	// setup new event shortcuts
	$.each( ( "touchstart touchmove touchend " +
		"swipe swipeleft swiperight" ).split( " " ), function( i, name ) {

		$.fn[ name ] = function( fn ) {
			return fn ? this.bind( name, fn ) : this.trigger( name );
		};

		// jQuery < 1.8
		if ( $.attrFn ) {
			$.attrFn[ name ] = true;
		}
	});

	function triggerCustomEvent( obj, eventType, event, bubble ) {
		var originalType = event.type;
		event.type = eventType;
		if ( bubble ) {
			$.event.trigger( event, undefined, obj );
		} else {
			$.event.dispatch.call( obj, event );
		}
		event.type = originalType;
	}

	// also handles taphold

	// Also handles swipeleft, swiperight
	$.event.special.swipe = {

		// More than this horizontal displacement, and we will suppress scrolling.
		scrollSupressionThreshold: 30,

		// More time than this, and it isn't a swipe.
		durationThreshold: 1000,

		// Swipe horizontal displacement must be more than this.
		horizontalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		// Swipe vertical displacement must be less than this.
		verticalDistanceThreshold: window.devicePixelRatio >= 2 ? 15 : 30,

		getLocation: function ( event ) {
			var winPageX = window.pageXOffset,
				winPageY = window.pageYOffset,
				x = event.clientX,
				y = event.clientY;

			if ( event.pageY === 0 && Math.floor( y ) > Math.floor( event.pageY ) ||
				event.pageX === 0 && Math.floor( x ) > Math.floor( event.pageX ) ) {

				// iOS4 clientX/clientY have the value that should have been
				// in pageX/pageY. While pageX/page/ have the value 0
				x = x - winPageX;
				y = y - winPageY;
			} else if ( y < ( event.pageY - winPageY) || x < ( event.pageX - winPageX ) ) {

				// Some Android browsers have totally bogus values for clientX/Y
				// when scrolling/zooming a page. Detectable since clientX/clientY
				// should never be smaller than pageX/pageY minus page scroll
				x = event.pageX - winPageX;
				y = event.pageY - winPageY;
			}

			return {
				x: x,
				y: y
			};
		},

		start: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ],
						origin: $( event.target )
					};
		},

		stop: function( event ) {
			var data = event.originalEvent.touches ?
					event.originalEvent.touches[ 0 ] : event,
				location = $.event.special.swipe.getLocation( data );
			return {
						time: ( new Date() ).getTime(),
						coords: [ location.x, location.y ]
					};
		},

		handleSwipe: function( start, stop, thisObject, origTarget ) {
			if ( stop.time - start.time < $.event.special.swipe.durationThreshold &&
				Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.horizontalDistanceThreshold &&
				Math.abs( start.coords[ 1 ] - stop.coords[ 1 ] ) < $.event.special.swipe.verticalDistanceThreshold ) {
				var direction = start.coords[0] > stop.coords[ 0 ] ? "swipeleft" : "swiperight";

				triggerCustomEvent( thisObject, "swipe", $.Event( "swipe", { target: origTarget, swipestart: start, swipestop: stop }), true );
				triggerCustomEvent( thisObject, direction,$.Event( direction, { target: origTarget, swipestart: start, swipestop: stop } ), true );
				return true;
			}
			return false;

		},

		// This serves as a flag to ensure that at most one swipe event event is
		// in work at any given time
		eventInProgress: false,

		setup: function() {
			var events,
				thisObject = this,
				$this = $( thisObject ),
				context = {};

			// Retrieve the events data for this element and add the swipe context
			events = $.data( this, "mobile-events" );
			if ( !events ) {
				events = { length: 0 };
				$.data( this, "mobile-events", events );
			}
			events.length++;
			events.swipe = context;

			context.start = function( event ) {

				// Bail if we're already working on a swipe event
				if ( $.event.special.swipe.eventInProgress ) {
					return;
				}
				$.event.special.swipe.eventInProgress = true;

				var stop,
					start = $.event.special.swipe.start( event ),
					origTarget = event.target,
					emitted = false;

				context.move = function( event ) {
					if ( !start || event.isDefaultPrevented() ) {
						return;
					}

					stop = $.event.special.swipe.stop( event );
					if ( !emitted ) {
						emitted = $.event.special.swipe.handleSwipe( start, stop, thisObject, origTarget );
						if ( emitted ) {

							// Reset the context to make way for the next swipe event
							$.event.special.swipe.eventInProgress = false;
						}
					}
					// prevent scrolling
					if ( Math.abs( start.coords[ 0 ] - stop.coords[ 0 ] ) > $.event.special.swipe.scrollSupressionThreshold ) {
						event.preventDefault();
					}
				};

				context.stop = function() {
						emitted = true;

						// Reset the context to make way for the next swipe event
						$.event.special.swipe.eventInProgress = false;
						$document.off( touchMoveEvent, context.move );
						context.move = null;
				};

				$document.on( touchMoveEvent, context.move )
					.one( touchStopEvent, context.stop );
			};
			$this.on( touchStartEvent, context.start );
		},

		teardown: function() {
			var events, context;

			events = $.data( this, "mobile-events" );
			if ( events ) {
				context = events.swipe;
				delete events.swipe;
				events.length--;
				if ( events.length === 0 ) {
					$.removeData( this, "mobile-events" );
				}
			}

			if ( context ) {
				if ( context.start ) {
					$( this ).off( touchStartEvent, context.start );
				}
				if ( context.move ) {
					$document.off( touchMoveEvent, context.move );
				}
				if ( context.stop ) {
					$document.off( touchStopEvent, context.stop );
				}
			}
		}
	};
	$.each({
		swipeleft: "swipe.left",
		swiperight: "swipe.right"
	}, function( event, sourceEvent ) {

		$.event.special[ event ] = {
			setup: function() {
				$( this ).bind( sourceEvent, $.noop );
			},
			teardown: function() {
				$( this ).unbind( sourceEvent );
			}
		};
	});
})( jQuery, this );
*/

!function(Foundation, $) {
  'use strict';
  // Elements with [data-open] will reveal a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-open]', function() {
    var id = $(this).data('open');
    $('#' + id).triggerHandler('open.zf.trigger', [$(this)]);
  });

  // Elements with [data-close] will close a plugin that supports it when clicked.
  // If used without a value on [data-close], the event will bubble, allowing it to close a parent component.
  $(document).on('click.zf.trigger', '[data-close]', function() {
    var id = $(this).data('close');
    if (id) {
      $('#' + id).triggerHandler('close.zf.trigger', [$(this)]);
    }
    else {
      $(this).trigger('close.zf.trigger');
    }
  });

  // Elements with [data-toggle] will toggle a plugin that supports it when clicked.
  $(document).on('click.zf.trigger', '[data-toggle]', function() {
    var id = $(this).data('toggle');
    $('#' + id).triggerHandler('toggle.zf.trigger', [$(this)]);
  });

  // Elements with [data-closable] will respond to close.zf.trigger events.
  $(document).on('close.zf.trigger', '[data-closable]', function() {
    var animation = $(this).data('closable') || 'fade-out';
    if(Foundation.Motion){
      Foundation.Motion.animateOut($(this), animation, function() {
        $(this).trigger('closed.zf');
      });
    }else{
      $(this).fadeOut().trigger('closed.zf');
    }
  });

  var MutationObserver = (function () {
    var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
    for (var i=0; i < prefixes.length; i++) {
      if (prefixes[i] + 'MutationObserver' in window) {
        return window[prefixes[i] + 'MutationObserver'];
      }
    }
    return false;
  }());


  var checkListeners = function(){
    eventsListener();
    resizeListener();
    scrollListener();
    closemeListener();
  };
  /**
  * Fires once after all other scripts have loaded
  * @function
  * @private
  */
  $(window).load(function(){
    checkListeners();
  });

  //******** only fires this function once on load, if there's something to watch ********
  var closemeListener = function(pluginName){
    var yetiBoxes = $('[data-yeti-box]'),
        plugNames = ['dropdown', 'tooltip', 'reveal'];

    if(pluginName){
      if(typeof pluginName === 'string'){
        plugNames.push(pluginName);
      }else if(typeof pluginName === 'object' && typeof pluginName[0] === 'string'){
        plugNames.concat(pluginName);
      }else{
        console.error('Plugin names must be strings');
      }
    }
    if(yetiBoxes.length){
      var listeners = plugNames.map(function(name){
        return 'closeme.zf.' + name;
      }).join(' ');

      $(window).off(listeners).on(listeners, function(e, pluginId){
        var plugin = e.namespace.split('.')[0];
        var plugins = $('[data-' + plugin + ']').not('[data-yeti-box="' + pluginId + '"]');

        plugins.each(function(){
          var _this = $(this);

          _this.triggerHandler('close.zf.trigger', [_this]);
        });
      });
    }
  };
  var resizeListener = function(debounce){
    var timer,
        $nodes = $('[data-resize]');
    if($nodes.length){
      $(window).off('resize.zf.trigger')
      .on('resize.zf.trigger', function(e) {
        if (timer) { clearTimeout(timer); }

        timer = setTimeout(function(){

          if(!MutationObserver){//fallback for IE 9
            $nodes.each(function(){
              $(this).triggerHandler('resizeme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a resize event
          $nodes.attr('data-events', "resize");
        }, debounce || 10);//default time to emit resize event
      });
    }
  };
  var scrollListener = function(debounce){
    var timer,
        $nodes = $('[data-scroll]');
    if($nodes.length){
      $(window).off('scroll.zf.trigger')
      .on('scroll.zf.trigger', function(e){
        if(timer){ clearTimeout(timer); }

        timer = setTimeout(function(){

          if(!MutationObserver){//fallback for IE 9
            $nodes.each(function(){
              $(this).triggerHandler('scrollme.zf.trigger');
            });
          }
          //trigger all listening elements and signal a scroll event
          $nodes.attr('data-events', "scroll");
        }, debounce || 10);//default time to emit scroll event
      });
    }
  };
  // function domMutationObserver(debounce) {
  //   // !!! This is coming soon and needs more work; not active  !!! //
  //   var timer,
  //   nodes = document.querySelectorAll('[data-mutate]');
  //   //
  //   if (nodes.length) {
  //     // var MutationObserver = (function () {
  //     //   var prefixes = ['WebKit', 'Moz', 'O', 'Ms', ''];
  //     //   for (var i=0; i < prefixes.length; i++) {
  //     //     if (prefixes[i] + 'MutationObserver' in window) {
  //     //       return window[prefixes[i] + 'MutationObserver'];
  //     //     }
  //     //   }
  //     //   return false;
  //     // }());
  //
  //
  //     //for the body, we need to listen for all changes effecting the style and class attributes
  //     var bodyObserver = new MutationObserver(bodyMutation);
  //     bodyObserver.observe(document.body, { attributes: true, childList: true, characterData: false, subtree:true, attributeFilter:["style", "class"]});
  //
  //
  //     //body callback
  //     function bodyMutation(mutate) {
  //       //trigger all listening elements and signal a mutation event
  //       if (timer) { clearTimeout(timer); }
  //
  //       timer = setTimeout(function() {
  //         bodyObserver.disconnect();
  //         $('[data-mutate]').attr('data-events',"mutate");
  //       }, debounce || 150);
  //     }
  //   }
  // }
  var eventsListener = function() {
    if(!MutationObserver){ return false; }
    var nodes = document.querySelectorAll('[data-resize], [data-scroll], [data-mutate]');

    //element callback
    var listeningElementsMutation = function(mutationRecordsList) {
      var $target = $(mutationRecordsList[0].target);
      //trigger the event handler for the element depending on type
      switch ($target.attr("data-events")) {

        case "resize" :
        $target.triggerHandler('resizeme.zf.trigger', [$target]);
        break;

        case "scroll" :
        $target.triggerHandler('scrollme.zf.trigger', [$target, window.pageYOffset]);
        break;

        // case "mutate" :
        // console.log('mutate', $target);
        // $target.triggerHandler('mutate.zf.trigger');
        //
        // //make sure we don't get stuck in an infinite loop from sloppy codeing
        // if ($target.index('[data-mutate]') == $("[data-mutate]").length-1) {
        //   domMutationObserver();
        // }
        // break;

        default :
        return false;
        //nothing
      }
    }

    if(nodes.length){
      //for each element that needs to listen for resizing, scrolling, (or coming soon mutation) add a single observer
      for (var i = 0; i <= nodes.length-1; i++) {
        var elementObserver = new MutationObserver(listeningElementsMutation);
        elementObserver.observe(nodes[i], { attributes: true, childList: false, characterData: false, subtree:false, attributeFilter:["data-events"]});
      }
    }
  };
  // ------------------------------------

  // [PH]
  // Foundation.CheckWatchers = checkWatchers;
  Foundation.IHearYou = checkListeners;
  // Foundation.ISeeYou = scrollListener;
  // Foundation.IFeelYou = closemeListener;

}(window.Foundation, window.jQuery);

!function(Foundation, $) {
  'use strict';

  /**
   * Creates a new instance of Abide.
   * @class
   * @fires Abide#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function Abide(element, options) {
    this.$element = element;
    this.options  = $.extend({}, Abide.defaults, this.$element.data(), options);
    this.$window  = $(window);
    this.name     = 'Abide';
    this.attr     = 'data-abide';

    this._init();
    this._events();

    Foundation.registerPlugin(this);
  }

  /**
   * Default settings for plugin
   */
  Abide.defaults = {
    validateOn: 'fieldChange', // options: fieldChange, manual, submit
    labelErrorClass: 'is-invalid-label',
    inputErrorClass: 'is-invalid-input',
    formErrorSelector: '.form-error',
    formErrorClass: 'is-visible',
    patterns: {
      alpha : /^[a-zA-Z]+$/,
      alpha_numeric : /^[a-zA-Z0-9]+$/,
      integer : /^[-+]?\d+$/,
      number : /^[-+]?\d*(?:[\.\,]\d+)?$/,

      // amex, visa, diners
      card : /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})$/,
      cvv : /^([0-9]){3,4}$/,

      // http://www.whatwg.org/specs/web-apps/current-work/multipage/states-of-the-type-attribute.html#valid-e-mail-address
      email : /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/,

      url : /^(https?|ftp|file|ssh):\/\/(((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-zA-Z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-zA-Z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/,
      // abc.de
      domain : /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,8}$/,

      datetime : /^([0-2][0-9]{3})\-([0-1][0-9])\-([0-3][0-9])T([0-5][0-9])\:([0-5][0-9])\:([0-5][0-9])(Z|([\-\+]([0-1][0-9])\:00))$/,
      // YYYY-MM-DD
      date : /(?:19|20)[0-9]{2}-(?:(?:0[1-9]|1[0-2])-(?:0[1-9]|1[0-9]|2[0-9])|(?:(?!02)(?:0[1-9]|1[0-2])-(?:30))|(?:(?:0[13578]|1[02])-31))$/,
      // HH:MM:SS
      time : /^(0[0-9]|1[0-9]|2[0-3])(:[0-5][0-9]){2}$/,
      dateISO : /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/,
      // MM/DD/YYYY
      month_day_year : /^(0[1-9]|1[012])[- \/.](0[1-9]|[12][0-9]|3[01])[- \/.]\d{4}$/,
      // DD/MM/YYYY
      day_month_year : /^(0[1-9]|[12][0-9]|3[01])[- \/.](0[1-9]|1[012])[- \/.]\d{4}$/,

      // #FFF or #FFFFFF
      color : /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/
    },
    validators: {
      equalTo: function (el, required, parent) {
        var from  = document.getElementById(el.getAttribute(this.add_namespace('data-equalto'))).value,
            to    = el.value,
            valid = (from === to);

        return valid;
      }
    }
  };


  /**
   * Initializes the Abide plugin and calls functions to get Abide functioning on load.
   * @private
   */
  Abide.prototype._init = function() {
  };

  /**
   * Initializes events for Abide.
   * @private
   */
  Abide.prototype._events = function() {
    var self = this;
    this.$element
      .off('.abide')
      .on('reset.fndtn.abide', function(e) {
        self.resetForm($(this));
      })
      .on('submit.fndtn.abide', function(e) {
        e.preventDefault();
        self.validateForm(self.$element);
      })
      .find('input, textarea, select')
        .off('.abide')
        .on('blur.fndtn.abide change.fndtn.abide', function (e) {
          if (self.options.validateOn === 'fieldChange') {
            self.validateInput($(e.target), self.$element);
          }
          // self.validateForm(self.$element);
        })
        .on('keydown.fndtn.abide', function (e) {
          // if (settings.live_validate === true && e.which != 9) {
          //   clearTimeout(self.timer);
          //   self.timer = setTimeout(function () {
          //     self.validate([this], e);
          //   }.bind(this), settings.timeout);
          // }
          // self.validateForm(self.$element);
        });

  },
  /**
   * Calls necessary functions to update Abide upon DOM change
   * @private
   */
  Abide.prototype._reflow = function() {
    var self = this;
  };
  /**
   * Checks whether or not a form element has the required attribute and if it's checked or not
   * @param {Object} element - jQuery object to check for required attribute
   * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
   */
  Abide.prototype.requiredCheck = function($el) {
    switch ($el[0].type) {
      case 'text':
        if ($el.attr('required') && !$el.val()) {
          // requirement check does not pass
          return false;
        } else {
          return true;
        }
        break;
        case 'password':
        if ($el.attr('required') && !$el.val()) {
          // requirement check does not pass
          return false;
        } else {
          return true;
        }
        break;
      case 'checkbox':
        if ($el.attr('required') && !$el.is(':checked')) {
          return false;
        } else {
          return true;
        }
        break;
      case 'radio':
        if ($el.attr('required') && !$el.is(':checked')) {
          return false;
        } else {
          return true;
        }
        break;
      default:
        if ($el.attr('required') && (!$el.val() || !$el.val().length || $el.is(':empty'))) {
          return false;
        } else {
          return true;
        }
    }
  };
  /**
   * Checks whether or not a form element has the required attribute and if it's checked or not
   * @param {Object} element - jQuery object to check for required attribute
   * @returns {Boolean} Boolean value depends on whether or not attribute is checked or empty
   */
  Abide.prototype.findLabel = function($el) {
    if ($el.next('label').length) {
      return $el.next('label');
    }
    else {
      return $el.closest('label');
    }
  };
  /**
   * Adds the CSS error class as specified by the Abide settings to the label, input, and the form
   * @param {Object} element - jQuery object to add the class to
   */
  Abide.prototype.addErrorClasses = function($el) {
    var self = this,
        $label = self.findLabel($el),
        $formError = $el.next(self.options.formErrorSelector) || $el.find(self.options.formErrorSelector);

    // label
    if ($label) {
      $label.addClass(self.options.labelErrorClass);
    }
    // form error
    if ($formError) {
      $formError.addClass(self.options.formErrorClass);
    }
    // input
    $el.addClass(self.options.inputErrorClass);
  };
  /**
   * Removes CSS error class as specified by the Abide settings from the label, input, and the form
   * @param {Object} element - jQuery object to remove the class from
   */
  Abide.prototype.removeErrorClasses = function($el) {
    var self = this,
        $label = self.findLabel($el),
        $formError = $el.next(self.options.formErrorSelector) || $el.find(self.options.formErrorSelector);
    // label
    if ($label && $label.hasClass(self.options.labelErrorClass)) {
      $label.removeClass(self.options.labelErrorClass);
    }
    // form error
    if ($formError && $formError.hasClass(self.options.formErrorClass)) {
      $formError.removeClass(self.options.formErrorClass);
    }
    // input
    if ($el.hasClass(self.options.inputErrorClass)) {
      $el.removeClass(self.options.inputErrorClass);
    }
  };
  /**
   * Goes through a form to find inputs and proceeds to validate them in ways specific to their type
   * @fires Abide#invalid
   * @fires Abide#valid
   * @param {Object} element - jQuery object to validate, should be an HTML input
   * @param {Object} form - jQuery object of the entire form to find the various input elements
   */
  Abide.prototype.validateInput = function($el, $form) {
    var self = this,
        textInput = $form.find('input[type="text"]'),
        passwordInput = $form.find('input[type="password"]'),
        checkInput = $form.find('input[type="checkbox"]'),
        label,
        radioGroupName;

    if ($el[0].type === 'text') {
      if (!self.requiredCheck($el) || !self.validateText($el)) {
        self.addErrorClasses($el);
        $el.trigger('invalid.fndtn.abide', $el[0]);
      }
      else {
        self.removeErrorClasses($el);
        $el.trigger('valid.fndtn.abide', $el[0]);
      }
    }
    else if ($el[0].type === 'radio') {
      radioGroupName = $el.attr('name');
      label = $el.siblings('label');

      if (self.validateRadio(radioGroupName)) {
        $(label).each(function() {
          if ($(this).hasClass(self.options.labelErrorClass)) {
            $(this).removeClass(self.options.labelErrorClass);
          }
        });
        $el.trigger('valid.fndtn.abide', $el[0]);
      }
      else {
        $(label).each(function() {
          $(this).addClass(self.options.labelErrorClass);
        });
        $el.trigger('invalid.fndtn.abide', $el[0]);
      };
    }
    else if ($el[0].type === 'checkbox') {
      if (!self.requiredCheck($el)) {
        self.addErrorClasses($el);
        $el.trigger('invalid.fndtn.abide', $el[0]);
      }
      else {
        self.removeErrorClasses($el);
        $el.trigger('valid.fndtn.abide', $el[0]);
      }
    }
    else {
      if (!self.requiredCheck($el) || !self.validateText($el)) {
        self.addErrorClasses($el);
        $el.trigger('invalid.fndtn.abide', $el[0]);
      }
      else {
        self.removeErrorClasses($el);
        $el.trigger('valid.fndtn.abide', $el[0]);
      }
    }
  };
  /**
   * Goes through a form and if there are any invalid inputs, it will display the form error element
   * @param {Object} element - jQuery object to validate, should be a form HTML element
   */
  Abide.prototype.validateForm = function($form) {
    var self = this,
        inputs = $form.find('input'),
        inputCount = $form.find('input').length,
        counter = 0;

    while (counter < inputCount) {
      self.validateInput($(inputs[counter]), $form);
      counter++;
    }

    // what are all the things that can go wrong with a form?
    if ($form.find('.form-error.is-visible').length || $form.find('.is-invalid-label').length) {
      $form.find('[data-abide-error]').css('display', 'block');
    }
    else {
      $form.find('[data-abide-error]').css('display', 'none');
    }
  };
  /**
   * Determines whether or a not a text input is valid based on the patterns specified in the attribute
   * @param {Object} element - jQuery object to validate, should be a text input HTML element
   * @returns {Boolean} Boolean value depends on whether or not the input value matches the pattern specified
   */
  Abide.prototype.validateText = function($el) {
    var self = this,
        valid = false,
        patternLib = this.options.patterns,
        inputText = $($el).val(),
        // maybe have a different way of parsing this bc people might use type
        pattern = $($el).attr('pattern');

    // if there's no value, then return true
    // since required check has already been done
    if (inputText.length === 0) {
      return true;
    }
    else {
      if (inputText.match(patternLib[pattern])) {
        return true;
      }
      else {
        return false;
      }
    }
  };
  /**
   * Determines whether or a not a radio input is valid based on whether or not it is required and selected
   * @param {String} group - A string that specifies the name of a radio button group
   * @returns {Boolean} Boolean value depends on whether or not at least one radio input has been selected (if it's required)
   */
  Abide.prototype.validateRadio = function(group) {
    var self = this,
        labels = $(':radio[name="' + group + '"]').siblings('label'),
        counter = 0;
    // go through each radio button
    $(':radio[name="' + group + '"]').each(function() {
      // put them through the required checkpoint
      if (!self.requiredCheck($(this))) {
        // if at least one doesn't pass, add a tally to the counter
        counter++;
      }
      // if at least one is checked
      // reset the counter
      if ($(this).is(':checked')) {
        counter = 0;
      }
    });

    if (counter > 0) {
      return false;
    }
    else {
      return true;
    }
  };
  Abide.prototype.matchValidation = function(val, validation) {

  };
  /**
   * Resets form inputs and styles
   * @param {Object} $form - A jQuery object that should be an HTML form element
   */
  Abide.prototype.resetForm = function($form) {
    var self = this;
    var invalidAttr = 'data-invalid';
    // remove data attributes
    $('[' + self.invalidAttr + ']', $form).removeAttr(invalidAttr);
    // remove styles
    $('.' + self.options.labelErrorClass, $form).not('small').removeClass(self.options.labelErrorClass);
    $('.' + self.options.inputErrorClass, $form).not('small').removeClass(self.options.inputErrorClass);
    $('.form-error.is-visible').removeClass('is-visible');
    $form.find('[data-abide-error]').css('display', 'none');
    $(':input', $form).not(':button, :submit, :reset, :hidden, [data-abide-ignore]').val('').removeAttr(invalidAttr);
  };
  Abide.prototype.destroy = function(){
    //TODO this...
  };

  Foundation.plugin(Abide, 'Abide');

  // Exports for AMD/Browserify
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Abide;
  if (typeof define === 'function')
    define(['foundation'], function() {
      return Abide;
    });

}(Foundation, jQuery);

/**
 * Accordion module.
 * @module foundation.accordion
 * @requires foundation.util.keyboard
 * @requires foundation.util.motion
 */
!function($, Foundation) {
  'use strict';

  /**
   * Creates a new instance of an accordion.
   * @class
   * @fires Accordion#init
   * @param {jQuery} element - jQuery object to make into an accordion.
   */
  function Accordion(element, options){
    this.$element = element;
    this.options = $.extend({}, Accordion.defaults, this.$element.data(), options);

    this._init();

    Foundation.registerPlugin(this);
    Foundation.Keyboard.register('Accordion', {
      'ENTER': 'toggle',
      'SPACE': 'toggle',
      'ARROW_DOWN': 'next',
      'ARROW_UP': 'previous'
    });
  }

  Accordion.defaults = {
    /**
     * Amount of time to animate the opening of an accordion pane.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the accordion to have multiple open panes.
     * @option
     * @example false
     */
    multiExpand: false,
    /**
     * Allow the accordion to close all panes.
     * @option
     * @example false
     */
    allowAllClosed: false
  };

  /**
   * Initializes the accordion by animating the preset active pane(s).
   * @private
   */
  Accordion.prototype._init = function() {
    this.$element.attr('role', 'tablist');
    this.$tabs = this.$element.children('li');
    if (this.$tabs.length == 0) {
      this.$tabs = this.$element.children('[data-accordion-item]');
    }
    this.$tabs.each(function(idx, el){

      var $el = $(el),
          $content = $el.find('[data-tab-content]'),
          id = $content[0].id || Foundation.GetYoDigits(6, 'accordion'),
          linkId = el.id || id + '-label';

      $el.find('a:first').attr({
        'aria-controls': id,
        'role': 'tab',
        'id': linkId,
        'aria-expanded': false,
        'aria-selected': false
      });
      $content.attr({'role': 'tabpanel', 'aria-labelledby': linkId, 'aria-hidden': true, 'id': id});
    });
    var $initActive = this.$element.find('.is-active').children('[data-tab-content]');
    if($initActive.length){
      this.down($initActive, true);
    }
    this._events();
  };

  /**
   * Adds event handlers for items within the accordion.
   * @private
   */
  Accordion.prototype._events = function() {
    var _this = this;

    this.$tabs.each(function(){
      var $elem = $(this);
      var $tabContent = $elem.children('[data-tab-content]');
      if ($tabContent.length) {
        $elem.children('a').off('click.zf.accordion keydown.zf.accordion')
               .on('click.zf.accordion', function(e){
        // $(this).children('a').on('click.zf.accordion', function(e) {
          e.preventDefault();
          if ($elem.hasClass('is-active')) {
            if(_this.options.allowAllClosed || $elem.siblings().hasClass('is-active')){
              _this.up($tabContent);
            }
          }
          else {
            _this.down($tabContent);
          }
        }).on('keydown.zf.accordion', function(e){
          Foundation.Keyboard.handleKey(e, _this, {
            toggle: function() {
              _this.toggle($tabContent);
            },
            next: function() {
              $elem.next().find('a').focus().trigger('click.zf.accordion');
            },
            previous: function() {
              $elem.prev().find('a').focus().trigger('click.zf.accordion');
            },
            handled: function() {
              e.preventDefault();
              e.stopPropagation();
            }
          });
        });
      }
    });
  };
  /**
   * Toggles the selected content pane's open/close state.
   * @param {jQuery} $target - jQuery object of the pane to toggle.
   * @function
   */
  Accordion.prototype.toggle = function($target){
    if($target.parent().hasClass('is-active')){
      if(this.options.allowAllClosed || $target.parent().siblings().hasClass('is-active')){
        this.up($target);
      }else{ return; }
    }else{
      this.down($target);
    }
  };
  /**
   * Opens the accordion tab defined by `$target`.
   * @param {jQuery} $target - Accordion pane to open.
   * @param {Boolean} firstTime - flag to determine if reflow should happen.
   * @fires Accordion#down
   * @function
   */
  Accordion.prototype.down = function($target, firstTime) {
    var _this = this;
    if(!this.options.multiExpand && !firstTime){
      var $currentActive = this.$element.find('.is-active').children('[data-tab-content]');
      if($currentActive.length){
        this.up($currentActive);
      }
    }

    $target
      .attr('aria-hidden', false)
      .parent('[data-tab-content]')
      .addBack()
      .parent().addClass('is-active');

    // Foundation.Move(_this.options.slideSpeed, $target, function(){
      $target.slideDown(_this.options.slideSpeed);
    // });

    // if(!firstTime){
    //   Foundation._reflow(this.$element.attr('data-accordion'));
    // }
    $('#' + $target.attr('aria-labelledby')).attr({
      'aria-expanded': true,
      'aria-selected': true
    });
    /**
     * Fires when the tab is done opening.
     * @event Accordion#down
     */
    this.$element.trigger('down.zf.accordion', [$target]);
  };

  /**
   * Closes the tab defined by `$target`.
   * @param {jQuery} $target - Accordion tab to close.
   * @fires Accordion#up
   * @function
   */
  Accordion.prototype.up = function($target) {
    var $aunts = $target.parent().siblings(),
        _this = this;
    var canClose = this.options.multiExpand ? $aunts.hasClass('is-active') : $target.parent().hasClass('is-active');

    if(!this.options.allowAllClosed && !canClose){
      return;
    }

    // Foundation.Move(this.options.slideSpeed, $target, function(){
      $target.slideUp(_this.options.slideSpeed);
    // });

    $target.attr('aria-hidden', true)
           .parent().removeClass('is-active');

    $('#' + $target.attr('aria-labelledby')).attr({
     'aria-expanded': false,
     'aria-selected': false
   });

    /**
     * Fires when the tab is done collapsing up.
     * @event Accordion#up
     */
    this.$element.trigger('up.zf.accordion', [$target]);
  };

  /**
   * Destroys an instance of an accordion.
   * @fires Accordion#destroyed
   * @function
   */
  Accordion.prototype.destroy = function() {
    this.$element.find('[data-tab-content]').slideUp(0).css('display', '');
    this.$element.find('a').off('.zf.accordion');

    Foundation.unregisterPlugin(this);
  };

  Foundation.plugin(Accordion, 'Accordion');
}(jQuery, window.Foundation);

/**
 * AccordionMenu module.
 * @module foundation.accordionMenu
 * @requires foundation.util.keyboard
 * @requires foundation.util.motion
 * @requires foundation.util.nest
 */
!function($) {
  'use strict';

  /**
   * Creates a new instance of an accordion menu.
   * @class
   * @fires AccordionMenu#init
   * @param {jQuery} element - jQuery object to make into an accordion menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function AccordionMenu(element, options) {
    this.$element = element;
    this.options = $.extend({}, AccordionMenu.defaults, this.$element.data(), options);

    Foundation.Nest.Feather(this.$element, 'accordion');

    this._init();

    Foundation.registerPlugin(this);
    Foundation.Keyboard.register('AccordionMenu', {
      'ENTER': 'toggle',
      'SPACE': 'toggle',
      'ARROW_RIGHT': 'open',
      'ARROW_UP': 'up',
      'ARROW_DOWN': 'down',
      'ARROW_LEFT': 'close',
      'ESCAPE': 'closeAll',
      'TAB': 'down',
      'SHIFT_TAB': 'up'
    });
  }

  AccordionMenu.defaults = {
    /**
     * Amount of time to animate the opening of a submenu in ms.
     * @option
     * @example 250
     */
    slideSpeed: 250,
    /**
     * Allow the menu to have multiple open panes.
     * @option
     * @example true
     */
    multiOpen: true
  };

  /**
   * Initializes the accordion menu by hiding all nested menus.
   * @private
   */
  AccordionMenu.prototype._init = function() {
    this.$element.find('[data-submenu]').not('.is-active').slideUp(0);//.find('a').css('padding-left', '1rem');
    this.$element.attr({
      'role': 'tablist',
      'aria-multiselectable': this.options.multiOpen
    });

    this.$menuLinks = this.$element.find('.has-submenu');
    this.$menuLinks.each(function(){
      var linkId = this.id || Foundation.GetYoDigits(6, 'acc-menu-link'),
          $elem = $(this),
          $sub = $elem.children('[data-submenu]'),
          subId = $sub[0].id || Foundation.GetYoDigits(6, 'acc-menu'),
          isActive = $sub.hasClass('is-active');
      $elem.attr({
        'aria-controls': subId,
        'aria-expanded': isActive,
        'aria-selected': false,
        'role': 'tab',
        'id': linkId
      });
      $sub.attr({
        'aria-labelledby': linkId,
        'aria-hidden': !isActive,
        'role': 'tabpanel',
        'id': subId
      });
    });
    var initPanes = this.$element.find('.is-active');
    if(initPanes.length){
      var _this = this;
      initPanes.each(function(){
        _this.down($(this));
      });
    }
    this._events();
  };

  /**
   * Adds event handlers for items within the menu.
   * @private
   */
  AccordionMenu.prototype._events = function() {
    var _this = this;

    this.$element.find('li').each(function() {
      var $submenu = $(this).children('[data-submenu]');

      if ($submenu.length) {
        $(this).children('a').off('click.zf.accordionmenu').on('click.zf.accordionmenu', function(e) {
          e.preventDefault();

          _this.toggle($submenu);
        });
      }
    }).on('keydown.zf.accordionmenu', function(e){
      var $element = $(this),
          $elements = $element.parent('ul').children('li'),
          $prevElement,
          $nextElement,
          $target = $element.children('[data-submenu]');

      $elements.each(function(i) {
        if ($(this).is($element)) {
          $prevElement = $elements.eq(Math.max(0, i-1));
          $nextElement = $elements.eq(Math.min(i+1, $elements.length-1));

          if ($(this).children('[data-submenu]:visible').length) { // has open sub menu
            $nextElement = $element.find('li:first-child');
          }
          if ($(this).is(':first-child')) { // is first element of sub menu
            $prevElement = $element.parents('li').first();
          } else if ($prevElement.children('[data-submenu]:visible').length) { // if previous element has open sub menu
            $prevElement = $prevElement.find('li:last-child');
          }
          if ($(this).is(':last-child')) { // is last element of sub menu
            $nextElement = $element.parents('li').first().next('li');
          }

          return;
        }
      });
      Foundation.Keyboard.handleKey(e, _this, {
        open: function() {
          if ($target.is(':hidden')) {
            _this.down($target);
            $target.find('li').first().focus();
          }
        },
        close: function() {
          if ($target.length && !$target.is(':hidden')) { // close active sub of this item
            _this.up($target);
          } else if ($element.parent('[data-submenu]').length) { // close currently open sub
            _this.up($element.parent('[data-submenu]'));
            $element.parents('li').first().focus();
          }
        },
        up: function() {
          $prevElement.focus();
        },
        down: function() {
          $nextElement.focus();
        },
        toggle: function() {
          if ($element.children('[data-submenu]').length) {
            _this.toggle($element.children('[data-submenu]'));
          }
        },
        closeAll: function() {
          _this.hideAll();
        },
        handled: function() {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      });
    });//.attr('tabindex', 0);
  };
  /**
   * Closes all panes of the menu.
   * @function
   */
  AccordionMenu.prototype.hideAll = function(){
    this.$element.find('[data-submenu]').slideUp(this.options.slideSpeed);
  };
  /**
   * Toggles the open/close state of a submenu.
   * @function
   * @param {jQuery} $target - the submenu to toggle
   */
  AccordionMenu.prototype.toggle = function($target){
    if(!$target.is(':animated')) {
      if (!$target.is(':hidden')) {
        this.up($target);
      }
      else {
        this.down($target);
      }
    }
  };
  /**
   * Opens the sub-menu defined by `$target`.
   * @param {jQuery} $target - Sub-menu to open.
   * @fires AccordionMenu#down
   */
  AccordionMenu.prototype.down = function($target) {
    var _this = this;

    if(!this.options.multiOpen){
      this.up(this.$element.find('.is-active').not($target.parentsUntil(this.$element).add($target)));
    }

    $target.addClass('is-active').attr({'aria-hidden': false})
      .parent('.has-submenu').attr({'aria-expanded': true, 'aria-selected': true});

      Foundation.Move(this.options.slideSpeed, $target, function(){
        $target.slideDown(_this.options.slideSpeed);
      });
    /**
     * Fires when the menu is done collapsing up.
     * @event AccordionMenu#down
     */
    this.$element.trigger('down.zf.accordionMenu', [$target]);
  };

  /**
   * Closes the sub-menu defined by `$target`. All sub-menus inside the target will be closed as well.
   * @param {jQuery} $target - Sub-menu to close.
   * @fires AccordionMenu#up
   */
  AccordionMenu.prototype.up = function($target) {
    var _this = this;
    Foundation.Move(this.options.slideSpeed, $target, function(){
      $target.slideUp(_this.options.slideSpeed);
    });
    $target.attr('aria-hidden', true)
           .find('[data-submenu]').slideUp(0).attr('aria-hidden', true).end()
           .parent('.has-submenu')
           .attr({'aria-expanded': false, 'aria-selected': false});
    // $target.slideUp(this.options.slideSpeed, function() {
    //   $target.find('[data-submenu]').slideUp(0).attr('aria-hidden', true);
    // }).attr('aria-hidden', true).parent('.has-submenu').attr({'aria-expanded': false, 'aria-selected': false});

    /**
     * Fires when the menu is done collapsing up.
     * @event AccordionMenu#up
     */
    this.$element.trigger('up.zf.accordionMenu', [$target]);
  };

  /**
   * Destroys an instance of accordion menu.
   * @fires AccordionMenu#destroyed
   */
  AccordionMenu.prototype.destroy = function(){
    this.$element.find('[data-submenu]').slideDown(0).css('display', '');
    this.$element.find('a').off('click.zf.accordionMenu');

    Foundation.Nest.Burn(this.$element, 'accordion');
    Foundation.unregisterPlugin(this);
  };

  Foundation.plugin(AccordionMenu, 'AccordionMenu');
}(jQuery, window.Foundation);

/**
 * Drilldown module.
 * @module foundation.drilldown
 * @requires foundation.util.keyboard
 * @requires foundation.util.motion
 * @requires foundation.util.nest
 */
!function($, Foundation){
  'use strict';

  /**
   * Creates a new instance of a drilldown menu.
   * @class
   * @param {jQuery} element - jQuery object to make into an accordion menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function Drilldown(element, options){
    this.$element = element;
    this.options = $.extend({}, Drilldown.defaults, this.$element.data(), options);

    Foundation.Nest.Feather(this.$element, 'drilldown');

    this._init();

    Foundation.registerPlugin(this);
    Foundation.Keyboard.register('Drilldown', {
      'ENTER': 'open',
      'SPACE': 'open',
      'ARROW_RIGHT': 'next',
      'ARROW_UP': 'up',
      'ARROW_DOWN': 'down',
      'ARROW_LEFT': 'previous',
      'ESCAPE': 'close',
      'TAB': 'down',
      'SHIFT_TAB': 'up'
    });
  }
  Drilldown.defaults = {
    /**
     * Markup used for JS generated back button. Prepended to submenu lists and deleted on `destroy` method, 'js-drilldown-back' class required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @example '<\li><\a>Back<\/a><\/li>'
     */
    backButton: '<li class="js-drilldown-back"><a>Back</a></li>',
    /**
     * Markup used to wrap drilldown menu. Use a class name for independent styling; the JS applied class: `is-drilldown` is required. Remove the backslash (`\`) if copy and pasting.
     * @option
     * @example '<\div class="is-drilldown"><\/div>'
     */
    wrapper: '<div></div>',
    /**
     * Allow the menu to return to root list on body click.
     * @option
     * @example false
     */
    closeOnClick: false
    // holdOpen: false
  };
  /**
   * Initializes the drilldown by creating jQuery collections of elements
   * @private
   */
  Drilldown.prototype._init = function(){
    this.$submenuAnchors = this.$element.find('li.has-submenu');
    this.$submenus = this.$submenuAnchors.children('[data-submenu]');
    this.$menuItems = this.$element.find('li:visible').not('.js-drilldown-back').attr('role', 'menuitem');

    this._prepareMenu();

    this._keyboardEvents();
  };
  /**
   * prepares drilldown menu by setting attributes to links and elements
   * sets a min height to prevent content jumping
   * wraps the element if not already wrapped
   * @private
   * @function
   */
  Drilldown.prototype._prepareMenu = function(){
    var _this = this;
    // if(!this.options.holdOpen){
    //   this._menuLinkEvents();
    // }
    this.$submenuAnchors.each(function(){
      var $sub = $(this);
      var $link = $sub.find('a:first');
      $link.data('savedHref', $link.attr('href')).removeAttr('href');
      $sub.children('[data-submenu]')
          .attr({
            'aria-hidden': true,
            'tabindex': 0,
            'role': 'menu'
          });
      _this._events($sub);
    });
    this.$submenus.each(function(){
      var $menu = $(this),
          $back = $menu.find('.js-drilldown-back');
      if(!$back.length){
        $menu.prepend(_this.options.backButton);
      }
      _this._back($menu);
    });
    if(!this.$element.parent().hasClass('is-drilldown')){
      this.$wrapper = $(this.options.wrapper).addClass('is-drilldown').css(this._getMaxDims());
      this.$element.wrap(this.$wrapper);
    }

  };
  /**
   * Adds event handlers to elements in the menu.
   * @function
   * @private
   * @param {jQuery} $elem - the current menu item to add handlers to.
   */
  Drilldown.prototype._events = function($elem){
    var _this = this;

    $elem.off('click.zf.drilldown')
    .on('click.zf.drilldown', function(e){
      if($(e.target).parentsUntil('ul', 'li').hasClass('is-drilldown-submenu-parent')){
        e.stopImmediatePropagation();
        e.preventDefault();
      }

      // if(e.target !== e.currentTarget.firstElementChild){
      //   return false;
      // }
      _this._show($elem);

      if(_this.options.closeOnClick){
        var $body = $('body').not(_this.$wrapper);
        $body.off('.zf.drilldown').on('click.zf.drilldown', function(e){
          e.preventDefault();
          _this._hideAll();
          $body.off('.zf.drilldown');
        });
      }
    });
  };
  /**
   * Adds keydown event listener to `li`'s in the menu.
   * @private
   */
  Drilldown.prototype._keyboardEvents = function() {
    var _this = this;
    this.$menuItems.add(this.$element.find('.js-drilldown-back')).on('keydown.zf.drilldown', function(e){
      var $element = $(this),
          $elements = $element.parent('ul').children('li'),
          $prevElement,
          $nextElement;

      $elements.each(function(i) {
        if ($(this).is($element)) {
          $prevElement = $elements.eq(Math.max(0, i-1));
          $nextElement = $elements.eq(Math.min(i+1, $elements.length-1));
          return;
        }
      });
      Foundation.Keyboard.handleKey(e, _this, {
        next: function() {
          if ($element.is(_this.$submenuAnchors)) {
            _this._show($element);
            $element.on(Foundation.transitionend($element), function(){
              $element.find('ul li').filter(_this.$menuItems).first().focus();
            });
          }
        },
        previous: function() {
          _this._hide($element.parent('ul'));
          $element.parent('ul').on(Foundation.transitionend($element), function(){
            setTimeout(function() {
              $element.parent('ul').parent('li').focus();
            }, 1);
          });
        },
        up: function() {
          $prevElement.focus();
        },
        down: function() {
          $nextElement.focus();
        },
        close: function() {
          _this._back();
          //_this.$menuItems.first().focus(); // focus to first element
        },
        open: function() {
          if (!$element.is(_this.$menuItems)) { // not menu item means back button
            _this._hide($element.parent('ul'));
            setTimeout(function(){$element.parent('ul').parent('li').focus();}, 1);
          } else if ($element.is(_this.$submenuAnchors)) {
            _this._show($element);
            setTimeout(function(){$element.find('ul li').filter(_this.$menuItems).first().focus();}, 1);
          }
        },
        handled: function() {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      });
    }); // end keyboardAccess
  };

  /**
   * Closes all open elements, and returns to root menu.
   * @function
   * @fires Drilldown#closed
   */
  Drilldown.prototype._hideAll = function(){
    var $elem = this.$element.find('.is-drilldown-sub.is-active').addClass('is-closing');
    $elem.one(Foundation.transitionend($elem), function(e){
      $elem.removeClass('is-active is-closing');
    });
        /**
         * Fires when the menu is fully closed.
         * @event Drilldown#closed
         */
    this.$element.trigger('closed.zf.drilldown');
  };
  /**
   * Adds event listener for each `back` button, and closes open menus.
   * @function
   * @fires Drilldown#back
   * @param {jQuery} $elem - the current sub-menu to add `back` event.
   */
  Drilldown.prototype._back = function($elem){
    var _this = this;
    $elem.off('click.zf.drilldown');
    $elem.children('.js-drilldown-back')
      .on('click.zf.drilldown', function(e){
        e.stopImmediatePropagation();
        // console.log('mouseup on back');
        _this._hide($elem);
      });
  };
  /**
   * Adds event listener to menu items w/o submenus to close open menus on click.
   * @function
   * @private
   */
  Drilldown.prototype._menuLinkEvents = function(){
    var _this = this;
    this.$menuItems.not('.has-submenu')
        .off('click.zf.drilldown')
        .on('click.zf.drilldown', function(e){
          // e.stopImmediatePropagation();
          setTimeout(function(){
            _this._hideAll();
          }, 0);
      });
  };
  /**
   * Opens a submenu.
   * @function
   * @fires Drilldown#open
   * @param {jQuery} $elem - the current element with a submenu to open.
   */
  Drilldown.prototype._show = function($elem){
    $elem.children('[data-submenu]').addClass('is-active');

    this.$element.trigger('open.zf.drilldown', [$elem]);
  };
  /**
   * Hides a submenu
   * @function
   * @fires Drilldown#hide
   * @param {jQuery} $elem - the current sub-menu to hide.
   */
  Drilldown.prototype._hide = function($elem){
    var _this = this;
    $elem.addClass('is-closing')
         .one(Foundation.transitionend($elem), function(){
           $elem.removeClass('is-active is-closing');
         });
    /**
     * Fires when the submenu is has closed.
     * @event Drilldown#hide
     */
    $elem.trigger('hide.zf.drilldown', [$elem]);

  };
  /**
   * Iterates through the nested menus to calculate the min-height, and max-width for the menu.
   * Prevents content jumping.
   * @function
   * @private
   */
  Drilldown.prototype._getMaxDims = function(){
    var max = 0, result = {};
    this.$submenus.add(this.$element).each(function(){
      var numOfElems = $(this).children('li').length;
      max = numOfElems > max ? numOfElems : max;
    });

    result.height = max * this.$menuItems[0].getBoundingClientRect().height + 'px';
    result.width = this.$element[0].getBoundingClientRect().width + 'px';

    return result;
  };
  /**
   * Destroys the Drilldown Menu
   * @function
   */
  Drilldown.prototype.destroy = function(){
    this._hideAll();
    Foundation.Nest.Burn(this.$element, 'drilldown');
    this.$element.unwrap()
                 .find('.js-drilldown-back').remove()
                 .end().find('.is-active, .is-closing, .is-drilldown-sub').removeClass('is-active is-closing is-drilldown-sub')
                 .end().find('[data-submenu]').removeAttr('aria-hidden tabindex role')
                 .off('.zf.drilldown').end().off('zf.drilldown');
    this.$element.find('a').each(function(){
      var $link = $(this);
      if($link.data('savedHref')){
        $link.attr('href', $link.data('savedHref')).removeData('savedHref');
      }else{ return; }
    });
    Foundation.unregisterPlugin(this);
  };
  Foundation.plugin(Drilldown, 'Drilldown');
}(jQuery, window.Foundation);

/**
 * Dropdown module.
 * @module foundation.dropdown
 * @requires foundation.util.keyboard
 * @requires foundation.util.box
 */
!function($, Foundation){
  'use strict';
  /**
   * Creates a new instance of a dropdown.
   * @class
   * @param {jQuery} element - jQuery object to make into an accordion menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function Dropdown(element, options){
    this.$element = element;
    this.options = $.extend({}, Dropdown.defaults, this.$element.data(), options);
    this._init();

    Foundation.registerPlugin(this);
    Foundation.Keyboard.register('Dropdown', {
      'ENTER': 'open',
      'SPACE': 'open',
      'ESCAPE': 'close',
      'TAB': 'tab_forward',
      'SHIFT_TAB': 'tab_backward'
    });
  }

  Dropdown.defaults = {
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 250
     */
    hoverDelay: 250,
    /**
     * Allow submenus to open on hover events
     * @option
     * @example false
     */
    hover: false,
    /**
     * Don't close dropdown when hovering over dropdown pane
     * @option
     * @example true
     */
    hoverPane: false,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    vOffset: 1,
    /**
     * Number of pixels between the dropdown pane and the triggering element on open.
     * @option
     * @example 1
     */
    hOffset: 1,
    /**
     * Class applied to adjust open position. JS will test and fill this in.
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Allow the plugin to trap focus to the dropdown pane if opened with keyboard commands.
     * @option
     * @example false
     */
    trapFocus: false,
    /**
     * Allow the plugin to set focus to the first focusable element within the pane, regardless of method of opening.
     * @option
     * @example true
     */
    autoFocus: false
  };
  /**
   * Initializes the plugin by setting/checking options and attributes, adding helper variables, and saving the anchor.
   * @function
   * @private
   */
  Dropdown.prototype._init = function(){
    var $id = this.$element.attr('id');

    this.$anchor = $('[data-toggle="' + $id + '"]') || $('[data-open="' + $id + '"]');
    this.$anchor.attr({
      'aria-controls': $id,
      'data-is-focus': false,
      'data-yeti-box': $id,
      'aria-haspopup': true,
      'aria-expanded': false
      // 'data-resize': $id
    });

    this.options.positionClass = this.getPositionClass();
    this.counter = 4;
    this.usedPositions = [];
    this.$element.attr({
      'aria-hidden': 'true',
      'data-yeti-box': $id,
      'data-resize': $id,
      'aria-labelledby': this.$anchor[0].id || Foundation.GetYoDigits(6, 'dd-anchor')
    });
    this._events();
  };
  /**
   * Helper function to determine current orientation of dropdown pane.
   * @function
   * @returns {String} position - string value of a position class.
   */
  Dropdown.prototype.getPositionClass = function(){
    var position = this.$element[0].className.match(/(top|left|right)/g);
        position = position ? position[0] : '';
    return position;
  };
  /**
   * Adjusts the dropdown panes orientation by adding/removing positioning classes.
   * @function
   * @private
   * @param {String} position - position class to remove.
   */
  Dropdown.prototype._reposition = function(position){
    this.usedPositions.push(position ? position : 'bottom');
    //default, try switching to opposite side
    if(!position && (this.usedPositions.indexOf('top') < 0)){
      this.$element.addClass('top');
    }else if(position === 'top' && (this.usedPositions.indexOf('bottom') < 0)){
      this.$element.removeClass(position);
    }else if(position === 'left' && (this.usedPositions.indexOf('right') < 0)){
      this.$element.removeClass(position)
          .addClass('right');
    }else if(position === 'right' && (this.usedPositions.indexOf('left') < 0)){
      this.$element.removeClass(position)
          .addClass('left');
    }

    //if default change didn't work, try bottom or left first
    else if(!position && (this.usedPositions.indexOf('top') > -1) && (this.usedPositions.indexOf('left') < 0)){
      this.$element.addClass('left');
    }else if(position === 'top' && (this.usedPositions.indexOf('bottom') > -1) && (this.usedPositions.indexOf('left') < 0)){
      this.$element.removeClass(position)
          .addClass('left');
    }else if(position === 'left' && (this.usedPositions.indexOf('right') > -1) && (this.usedPositions.indexOf('bottom') < 0)){
      this.$element.removeClass(position);
    }else if(position === 'right' && (this.usedPositions.indexOf('left') > -1) && (this.usedPositions.indexOf('bottom') < 0)){
      this.$element.removeClass(position);
    }
    //if nothing cleared, set to bottom
    else{
      this.$element.removeClass(position);
    }
    this.classChanged = true;
    this.counter--;
  };
  /**
   * Sets the position and orientation of the dropdown pane, checks for collisions.
   * Recursively calls itself if a collision is detected, with a new position class.
   * @function
   * @private
   */
  Dropdown.prototype._setPosition = function(){
    if(this.$anchor.attr('aria-expanded') === 'false'){ return false; }
    var position = this.getPositionClass(),
        $eleDims = Foundation.Box.GetDimensions(this.$element),
        $anchorDims = Foundation.Box.GetDimensions(this.$anchor),
        _this = this,
        direction = (position === 'left' ? 'left' : ((position === 'right') ? 'left' : 'top')),
        param = (direction === 'top') ? 'height' : 'width',
        offset = (param === 'height') ? this.options.vOffset : this.options.hOffset;

    if(($eleDims.width >= $eleDims.windowDims.width) || (!this.counter && !Foundation.Box.ImNotTouchingYou(this.$element))){
      this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
        'width': $eleDims.windowDims.width - (this.options.hOffset * 2),
        'height': 'auto'
      });
      this.classChanged = true;
      return false;
    }

    this.$element.offset(Foundation.Box.GetOffsets(this.$element, this.$anchor, position, this.options.vOffset, this.options.hOffset));

    while(!Foundation.Box.ImNotTouchingYou(this.$element) && this.counter){
      this._reposition(position);
      this._setPosition();
    }
  };
  /**
   * Adds event listeners to the element utilizing the triggers utility library.
   * @function
   * @private
   */
  Dropdown.prototype._events = function(){
    var _this = this;
    this.$element.on({
      'open.zf.trigger': this.open.bind(this),
      'close.zf.trigger': this.close.bind(this),
      'toggle.zf.trigger': this.toggle.bind(this),
      'resizeme.zf.trigger': this._setPosition.bind(this)
    });

    if(this.options.hover){
      this.$anchor.off('mouseenter.zf.dropdown mouseleave.zf.dropdown')
          .on('mouseenter.zf.dropdown', function(){
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function(){
              _this.open();
              _this.$anchor.data('hover', true);
            }, _this.options.hoverDelay);
          }).on('mouseleave.zf.dropdown', function(){
            clearTimeout(_this.timeout);
            _this.timeout = setTimeout(function(){
              _this.close();
              _this.$anchor.data('hover', false);
            }, _this.options.hoverDelay);
          });
      if(this.options.hoverPane){
        this.$element.off('mouseenter.zf.dropdown mouseleave.zf.dropdown')
            .on('mouseenter.zf.dropdown', function(){
              clearTimeout(_this.timeout);
            }).on('mouseleave.zf.dropdown', function(){
              clearTimeout(_this.timeout);
              _this.timeout = setTimeout(function(){
                _this.close();
                _this.$anchor.data('hover', false);
              }, _this.options.hoverDelay);
            });
      }
    }
    this.$anchor.add(this.$element).on('keydown.zf.dropdown', function(e) {

      var $target = $(this),
        visibleFocusableElements = Foundation.Keyboard.findFocusable(_this.$element);

      Foundation.Keyboard.handleKey(e, _this, {
        tab_forward: function() {
          if (this.$element.find(':focus').is(visibleFocusableElements.eq(-1))) { // left modal downwards, setting focus to first element
            if (this.options.trapFocus) { // if focus shall be trapped
              visibleFocusableElements.eq(0).focus();
              e.preventDefault();
            } else { // if focus is not trapped, close dropdown on focus out
              this.close();
            }
          }
        },
        tab_backward: function() {
          if (this.$element.find(':focus').is(visibleFocusableElements.eq(0)) || this.$element.is(':focus')) { // left modal upwards, setting focus to last element
            if (this.options.trapFocus) { // if focus shall be trapped
              visibleFocusableElements.eq(-1).focus();
              e.preventDefault();
            } else { // if focus is not trapped, close dropdown on focus out
              this.close();
            }
          }
        },
        open: function() {
          if ($target.is(_this.$anchor)) {
            _this.open();
            _this.$element.attr('tabindex', -1).focus();
            e.preventDefault();
          }
        },
        close: function() {
          _this.close();
          _this.$anchor.focus();
        }
      });
    });
  };
  /**
   * Opens the dropdown pane, and fires a bubbling event to close other dropdowns.
   * @function
   * @fires Dropdown#closeme
   * @fires Dropdown#show
   */
  Dropdown.prototype.open = function(){
    // var _this = this;
    /**
     * Fires to close other open dropdowns
     * @event Dropdown#closeme
     */
    this.$element.trigger('closeme.zf.dropdown', this.$element.attr('id'));
    this.$anchor.addClass('hover')
        .attr({'aria-expanded': true});
    // this.$element/*.show()*/;
    this._setPosition();
    this.$element.addClass('is-open')
        .attr({'aria-hidden': false});

    if(this.options.autoFocus){
      var $focusable = Foundation.Keyboard.findFocusable(this.$element);
      if($focusable.length){
        $focusable.eq(0).focus();
      }
    }


    /**
     * Fires once the dropdown is visible.
     * @event Dropdown#show
     */
     this.$element.trigger('show.zf.dropdown', [this.$element]);
    //why does this not work correctly for this plugin?
    // Foundation.reflow(this.$element, 'dropdown');
    // Foundation._reflow(this.$element.attr('data-dropdown'));
  };

  /**
   * Closes the open dropdown pane.
   * @function
   * @fires Dropdown#hide
   */
  Dropdown.prototype.close = function(){
    if(!this.$element.hasClass('is-open')){
      return false;
    }
    this.$element.removeClass('is-open')
        .attr({'aria-hidden': true});

    this.$anchor.removeClass('hover')
        .attr('aria-expanded', false);

    if(this.classChanged){
      var curPositionClass = this.getPositionClass();
      if(curPositionClass){
        this.$element.removeClass(curPositionClass);
      }
      this.$element.addClass(this.options.positionClass)
          /*.hide()*/.css({height: '', width: ''});
      this.classChanged = false;
      this.counter = 4;
      this.usedPositions.length = 0;
    }
    this.$element.trigger('hide.zf.dropdown', [this.$element]);
    // Foundation.reflow(this.$element, 'dropdown');
  };
  /**
   * Toggles the dropdown pane's visibility.
   * @function
   */
  Dropdown.prototype.toggle = function(){
    if(this.$element.hasClass('is-open')){
      if(this.$anchor.data('hover')) return;
      this.close();
    }else{
      this.open();
    }
  };
  /**
   * Destroys the dropdown.
   * @function
   */
  Dropdown.prototype.destroy = function(){
    this.$element.off('.zf.trigger').hide();
    this.$anchor.off('.zf.dropdown');

    Foundation.unregisterPlugin(this);
  };

  Foundation.plugin(Dropdown, 'Dropdown');
}(jQuery, window.Foundation);

/**
 * DropdownMenu module.
 * @module foundation.dropdown-menu
 * @requires foundation.util.keyboard
 * @requires foundation.util.box
 * @requires foundation.util.nest
 */
!function($, Foundation){
  'use strict';

  /**
   * Creates a new instance of DropdownMenu.
   * @class
   * @fires DropdownMenu#init
   * @param {jQuery} element - jQuery object to make into a dropdown menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function DropdownMenu(element, options){
    this.$element = element;
    this.options = $.extend({}, DropdownMenu.defaults, this.$element.data(), options);

    Foundation.Nest.Feather(this.$element, 'dropdown');
    this._init();

    Foundation.registerPlugin(this);
    Foundation.Keyboard.register('DropdownMenu', {
      'ENTER': 'open',
      'SPACE': 'open',
      'ARROW_RIGHT': 'next',
      'ARROW_UP': 'up',
      'ARROW_DOWN': 'down',
      'ARROW_LEFT': 'previous',
      'ESCAPE': 'close'
    });
  }

  /**
   * Default settings for plugin
   */
  DropdownMenu.defaults = {
    /**
     * Disallows hover events from opening submenus
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Allow a submenu to automatically close on a mouseleave event, if not clicked open.
     * @option
     * @example true
     */
    autoclose: true,
    /**
     * Amount of time to delay opening a submenu on hover event.
     * @option
     * @example 50
     */
    hoverDelay: 50,
    /**
     * Allow a submenu to open/remain open on parent click event. Allows cursor to move away from menu.
     * @option
     * @example true
     */
    clickOpen: false,
    /**
     * Amount of time to delay closing a submenu on a mouseleave event.
     * @option
     * @example 500
     */

    closingTime: 500,
    /**
     * Position of the menu relative to what direction the submenus should open. Handled by JS.
     * @option
     * @example 'left'
     */
    alignment: 'left',
    /**
     * Allow clicks on the body to close any open submenus.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Class applied to vertical oriented menus, Foundation default is `vertical`. Update this if using your own class.
     * @option
     * @example 'vertical'
     */
    verticalClass: 'vertical',
    /**
     * Class applied to right-side oriented menus, Foundation default is `align-right`. Update this if using your own class.
     * @option
     * @example 'align-right'
     */
    rightClass: 'align-right',
    /**
     * Boolean to force overide the clicking of links to perform default action, on second touch event for mobile.
     * @option
     * @example false
     */
    forceFollow: true
  };
  /**
   * Initializes the plugin, and calls _prepareMenu
   * @private
   * @function
   */
  DropdownMenu.prototype._init = function(){
    var subs = this.$element.find('li.is-dropdown-submenu-parent');
    this.$element.children('.is-dropdown-submenu-parent').children('.is-dropdown-submenu').addClass('first-sub');

    this.$menuItems = this.$element.find('[role="menuitem"]');
    this.$tabs = this.$element.children('[role="menuitem"]');
    this.isVert = this.$element.hasClass(this.options.verticalClass);
    this.$tabs.find('ul.is-dropdown-submenu').addClass(this.options.verticalClass);

    if(this.$element.hasClass(this.options.rightClass) || this.options.alignment === 'right'){
      this.options.alignment = 'right';
      subs.addClass('is-left-arrow opens-left');
    }else{
      subs.addClass('is-right-arrow opens-right');
    }
    if(!this.isVert){
      this.$tabs.filter('.is-dropdown-submenu-parent').removeClass('is-right-arrow is-left-arrow opens-right opens-left')
          .addClass('is-down-arrow');
    }
    this.changed = false;
    this._events();
  };
  /**
   * Adds event listeners to elements within the menu
   * @private
   * @function
   */
  DropdownMenu.prototype._events = function(){
    var _this = this,
        hasTouch = 'ontouchstart' in window || (typeof window.ontouchstart !== 'undefined'),
        parClass = 'is-dropdown-submenu-parent',
        delay;

    if(this.options.clickOpen || hasTouch){
      this.$menuItems.on('click.zf.dropdownmenu touchstart.zf.dropdownmenu', function(e){
        var $elem = $(e.target).parentsUntil('ul', '.' + parClass),
            hasSub = $elem.hasClass(parClass),
            hasClicked = $elem.attr('data-is-click') === 'true',
            $sub = $elem.children('.is-dropdown-submenu');

        if(hasSub){
          if(hasClicked){
            if(!_this.options.closeOnClick || (!_this.options.clickOpen && !hasTouch) || (_this.options.forceFollow && hasTouch)){ return; }
            else{
              e.stopImmediatePropagation();
              e.preventDefault();
              _this._hide($elem);
            }
          }else{
            e.preventDefault();
            e.stopImmediatePropagation();
            _this._show($elem.children('.is-dropdown-submenu'));
            $elem.add($elem.parentsUntil(_this.$element, '.' + parClass)).attr('data-is-click', true);
          }
        }else{ return; }
      });
    }

    if(!this.options.disableHover){
      this.$menuItems.on('mouseenter.zf.dropdownmenu', function(e){
        e.stopImmediatePropagation();
        var $elem = $(this),
            hasSub = $elem.hasClass(parClass);

        if(hasSub){
          clearTimeout(delay);
          delay = setTimeout(function(){
            _this._show($elem.children('.is-dropdown-submenu'));
          }, _this.options.hoverDelay);
        }
      }).on('mouseleave.zf.dropdownmenu', function(e){
        var $elem = $(this),
            hasSub = $elem.hasClass(parClass);
        if(hasSub && _this.options.autoclose){
          if($elem.attr('data-is-click') === 'true' && _this.options.clickOpen){ return false; }

          // clearTimeout(delay);
          delay = setTimeout(function(){
            _this._hide($elem);
          }, _this.options.closingTime);
        }
      });
    }
    this.$menuItems.on('keydown.zf.dropdownmenu', function(e){
      var $element = $(e.target).parentsUntil('ul', '[role="menuitem"]'),
          isTab = _this.$tabs.index($element) > -1,
          $elements = isTab ? _this.$tabs : $element.siblings('li').add($element),
          $prevElement,
          $nextElement;

      $elements.each(function(i) {
        if ($(this).is($element)) {
          $prevElement = $elements.eq(i-1);
          $nextElement = $elements.eq(i+1);
          return;
        }
      });

      var nextSibling = function() {
        if (!$element.is(':last-child')) $nextElement.children('a:first').focus();
      }, prevSibling = function() {
        $prevElement.children('a:first').focus();
      }, openSub = function() {
        var $sub = $element.children('ul.is-dropdown-submenu');
        if($sub.length){
          _this._show($sub);
          $element.find('li > a:first').focus();
        }else{ return; }
      }, closeSub = function() {
        //if ($element.is(':first-child')) {
        var close = $element.parent('ul').parent('li');
          close.children('a:first').focus();
          _this._hide(close);
        //}
      };
      var functions = {
        open: openSub,
        close: function() {
          _this._hide(_this.$element);
          _this.$menuItems.find('a:first').focus(); // focus to first element
        },
        handled: function() {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      };

      if (isTab) {
        if (_this.vertical) { // vertical menu
          if (_this.options.alignment === 'left') { // left aligned
            $.extend(functions, {
              down: nextSibling,
              up: prevSibling,
              next: openSub,
              previous: closeSub
            });
          } else { // right aligned
            $.extend(functions, {
              down: nextSibling,
              up: prevSibling,
              next: closeSub,
              previous: openSub
            });
          }
        } else { // horizontal menu
          $.extend(functions, {
            next: nextSibling,
            previous: prevSibling,
            down: openSub,
            up: closeSub
          });
        }
      } else { // not tabs -> one sub
        if (_this.options.alignment === 'left') { // left aligned
          $.extend(functions, {
            next: openSub,
            previous: closeSub,
            down: nextSibling,
            up: prevSibling
          });
        } else { // right aligned
          $.extend(functions, {
            next: closeSub,
            previous: openSub,
            down: nextSibling,
            up: prevSibling
          });
        }
      }
      Foundation.Keyboard.handleKey(e, _this, functions);

    });
  };
  /**
   * Adds an event handler to the body to close any dropdowns on a click.
   * @function
   * @private
   */
  DropdownMenu.prototype._addBodyHandler = function(){
    var $body = $(document.body),
        _this = this;
    $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu')
         .on('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu', function(e){
           var $link = _this.$element.find(e.target);
           if($link.length){ return; }

           _this._hide();
           $body.off('mouseup.zf.dropdownmenu touchend.zf.dropdownmenu');
         });
  };
  /**
   * Opens a dropdown pane, and checks for collisions first.
   * @param {jQuery} $sub - ul element that is a submenu to show
   * @function
   * @private
   * @fires DropdownMenu#show
   */
  DropdownMenu.prototype._show = function($sub){
    var idx = this.$tabs.index(this.$tabs.filter(function(i, el){
      return $(el).find($sub).length > 0;
    }));
    var $sibs = $sub.parent('li.is-dropdown-submenu-parent').siblings('li.is-dropdown-submenu-parent');
    this._hide($sibs, idx);
    $sub.css('visibility', 'hidden').addClass('js-dropdown-active').attr({'aria-hidden': false})
        .parent('li.is-dropdown-submenu-parent').addClass('is-active')
        .attr({'aria-selected': true, 'aria-expanded': true});
    var clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
    if(!clear){
      var oldClass = this.options.alignment === 'left' ? '-right' : '-left',
          $parentLi = $sub.parent('.is-dropdown-submenu-parent');
      $parentLi.removeClass('opens' + oldClass).addClass('opens-' + this.options.alignment);
      clear = Foundation.Box.ImNotTouchingYou($sub, null, true);
      if(!clear){
        $parentLi.removeClass('opens-' + this.options.alignment).addClass('opens-inner');
      }
      this.changed = true;
    }
    $sub.css('visibility', '');
    if(this.options.closeOnClick){ this._addBodyHandler(); }
    /**
     * Fires when the new dropdown pane is visible.
     * @event DropdownMenu#show
     */
    this.$element.trigger('show.zf.dropdownmenu', [$sub]);
  };
  /**
   * Hides a single, currently open dropdown pane, if passed a parameter, otherwise, hides everything.
   * @function
   * @param {jQuery} $elem - element with a submenu to hide
   * @param {Number} idx - index of the $tabs collection to hide
   * @private
   */
  DropdownMenu.prototype._hide = function($elem, idx){
    var $toClose;
    if($elem && $elem.length){
      $toClose = $elem;
    }else if(idx !== undefined){
      $toClose = this.$tabs.not(function(i, el){
        return i === idx;
      });
    }
    else{
      $toClose = this.$element;
    }
    var somethingToClose = $toClose.hasClass('is-active') || $toClose.find('.is-active').length > 0;

    if(somethingToClose){
      $toClose.find('li.is-active').add($toClose).attr({
        'aria-selected': false,
        'aria-expanded': false,
        'data-is-click': false
      }).removeClass('is-active');

      $toClose.find('ul.js-dropdown-active').attr({
        'aria-hidden': true
      }).removeClass('js-dropdown-active');

      if(this.changed || $toClose.find('opens-inner').length){
        var oldClass = this.options.alignment === 'left' ? 'right' : 'left';
        $toClose.find('li.is-dropdown-submenu-parent').add($toClose)
                .removeClass('opens-inner opens-' + this.options.alignment)
                .addClass('opens-' + oldClass);
        this.changed = false;
      }
      /**
       * Fires when the open menus are closed.
       * @event DropdownMenu#hide
       */
      this.$element.trigger('hide.zf.dropdownmenu', [$toClose]);
    }
  };
  /**
   * Destroys the plugin.
   * @function
   */
  DropdownMenu.prototype.destroy = function(){
    this.$menuItems.off('.zf.dropdownmenu').removeAttr('data-is-click')
        .removeClass('is-right-arrow is-left-arrow is-down-arrow opens-right opens-left opens-inner');
    Foundation.Nest.Burn(this.$element, 'dropdown');
    Foundation.unregisterPlugin(this);
  };

  Foundation.plugin(DropdownMenu, 'DropdownMenu');
}(jQuery, window.Foundation);

!function(Foundation, $) {
  'use strict';

  /**
   * Creates a new instance of Equalizer.
   * @class
   * @fires Equalizer#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function Equalizer(element, options) {
    this.$element = element;
    this.options  = $.extend({}, Equalizer.defaults, this.$element.data(), options);
    this.$window  = $(window);
    this.name     = 'equalizer';
    this.attr     = 'data-equalizer';

    this._init();
    this._events();

    Foundation.registerPlugin(this);
  }

  /**
   * Default settings for plugin
   */
  Equalizer.defaults = {
    /**
     * Enable height equalization when stacked on smaller screens.
     * @option
     * @example true
     */
    equalizeOnStack: true,
    /**
     * Amount of time, in ms, to debounce the size checking/equalization. Lower times mean smoother transitions/less performance on mobile.
     * @option
     * @example 50
     */
    throttleInterval: 50
  };

  /**
   * Initializes the Equalizer plugin and calls functions to get equalizer functioning on load.
   * @private
   */
  Equalizer.prototype._init = function() {
    this._reflow();
  };

  /**
   * Initializes events for Equalizer.
   * @private
   */
  Equalizer.prototype._events = function() {
    var self = this;

    this.$window
      .off('.equalizer')
      .on('resize.fndtn.equalizer', Foundation.util.throttle(function () {
        self._reflow();
      }, self.options.throttleInterval));
  };

  /**
   * A noop version for the plugin
   * @private
   */
  Equalizer.prototype._killswitch = function() {
    return;
  };
  /**
   * Calls necessary functions to update Equalizer upon DOM change
   * @private
   */
  Equalizer.prototype._reflow = function() {
    var self = this;

    $('[' + this.attr + ']').each(function() {
      var $eqParent       = $(this),
          adjustedHeights = [],
          $images = $eqParent.find('img');

      if ($images.length) {
        Foundation.onImagesLoaded($images, function() {
          adjustedHeights = self.getHeights($eqParent);
          self.applyHeight($eqParent, adjustedHeights);
        });
      }
      else {
        adjustedHeights = self.getHeights($eqParent);
        self.applyHeight($eqParent, adjustedHeights);
      }
    });
  };
  /**
   * Finds the outer heights of children contained within an Equalizer parent and returns them in an array
   * @param {Object} $eqParent A jQuery instance of an Equalizer container
   * @returns {Array} heights An array of heights of children within Equalizer container
   */
  Equalizer.prototype.getHeights = function($eqParent) {
    var eqGroupName = $eqParent.data('equalizer'),
        eqGroup     = eqGroupName ? $eqParent.find('[' + this.attr + '-watch="' + eqGroupName + '"]:visible') : $eqParent.find('[' + this.attr + '-watch]:visible'),
        heights;

    eqGroup.height('inherit');
    heights = eqGroup.map(function () { return $(this).outerHeight(false);}).get();
    
    return heights;
  };
  /**
   * Changes the CSS height property of each child in an Equalizer parent to match the tallest
   * @param {Object} $eqParent - A jQuery instance of an Equalizer container
   * @param {array} heights - An array of heights of children within Equalizer container
   * @fires Equalizer#preEqualized
   * @fires Equalizer#postEqualized
   */
  Equalizer.prototype.applyHeight = function($eqParent, heights) {
    var eqGroupName = $eqParent.data('equalizer'),
        eqGroup     = eqGroupName ? $eqParent.find('['+this.attr+'-watch="'+eqGroupName+'"]:visible') : $eqParent.find('['+this.attr+'-watch]:visible'),
        max         = Math.max.apply(null, heights);

    /**
     * Fires before the heights are applied
     * @event Equalizer#preEqualized
     */
    $eqParent.trigger('preEqualized.zf.Equalizer');

    // for now, apply the max height found in the array
    for (var i = 0; i < eqGroup.length; i++) {
      $(eqGroup[i]).css('height', max);
    }

    /**
     * Fires when the heights have been applied
     * @event Equalizer#postEqualized
     */
    $eqParent.trigger('postEqualized.zf.Equalizer');
  };
  /**
   * Destroys an instance of Equalizer.
   * @function
   */
  Equalizer.prototype.destroy = function(){
    //TODO this.
  };

  Foundation.plugin(Equalizer, 'Equalizer');

  // Exports for AMD/Browserify
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Equalizer;
  if (typeof define === 'function')
    define(['foundation'], function() {
      return Equalizer;
    });

}(Foundation, jQuery);

/**
 * Interchange module.
 * @module foundation.interchange
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.timerAndImageLoader
 */
!function(Foundation, $) {
  'use strict';

  /**
   * Creates a new instance of Interchange.
   * @class
   * @fires Interchange#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function Interchange(element, options) {
    this.$element = element;
    this.options = $.extend({}, Interchange.defaults, options);
    this.rules = [];
    this.currentPath = '';

    this._init();
    this._events();

    Foundation.registerPlugin(this);
  }

  /**
   * Default settings for plugin
   */
  Interchange.defaults = {
    /**
     * Rules to be applied to Interchange elements. Set with the `data-interchange` array notation.
     * @option
     */
    rules: null
  };

  Interchange.SPECIAL_QUERIES = {
    'landscape': 'screen and (orientation: landscape)',
    'portrait': 'screen and (orientation: portrait)',
    'retina': 'only screen and (-webkit-min-device-pixel-ratio: 2), only screen and (min--moz-device-pixel-ratio: 2), only screen and (-o-min-device-pixel-ratio: 2/1), only screen and (min-device-pixel-ratio: 2), only screen and (min-resolution: 192dpi), only screen and (min-resolution: 2dppx)'
  };

  /**
   * Initializes the Interchange plugin and calls functions to get interchange functioning on load.
   * @function
   * @private
   */
  Interchange.prototype._init = function() {
    this._addBreakpoints();
    this._generateRules();
    this._reflow();
  };

  /**
   * Initializes events for Interchange.
   * @function
   * @private
   */
  Interchange.prototype._events = function() {
    $(window).on('resize.fndtn.interchange', Foundation.util.throttle(this._reflow.bind(this), 50));
  };

  /**
   * Calls necessary functions to update Interchange upon DOM change
   * @function
   * @private
   */
  Interchange.prototype._reflow = function() {
    var match;

    // Iterate through each rule, but only save the last match
    for (var i in this.rules) {
      var rule = this.rules[i];

      if (window.matchMedia(rule.query).matches) {
        match = rule;
      }
    }

    if (match) {
      this.replace(match.path);
    }
  };

  /**
   * Gets the Foundation breakpoints and adds them to the Interchange.SPECIAL_QUERIES object.
   * @function
   * @private
   */
  Interchange.prototype._addBreakpoints = function() {
    for (var i in Foundation.MediaQuery.queries) {
      var query = Foundation.MediaQuery.queries[i];
      Interchange.SPECIAL_QUERIES[query.name] = query.value;
    }
  };

  /**
   * Checks the Interchange element for the provided media query + content pairings
   * @function
   * @private
   * @param {Object} element - jQuery object that is an Interchange instance
   * @returns {Array} scenarios - Array of objects that have 'mq' and 'path' keys with corresponding keys
   */
  Interchange.prototype._generateRules = function() {
    var rulesList = [];
    var rules;

    if (this.options.rules) {
      rules = this.options.rules;
    }
    else {
      rules = this.$element.data('interchange').match(/\[.*?\]/g);
    }

    for (var i in rules) {
      var rule = rules[i].slice(1, -1).split(', ');
      var path = rule.slice(0, -1).join('');
      var query = rule[rule.length - 1];

      if (Interchange.SPECIAL_QUERIES[query]) {
        query = Interchange.SPECIAL_QUERIES[query];
      }

      rulesList.push({
        path: path,
        query: query
      });
    }

    this.rules = rulesList;
  };

  /**
   * Update the `src` property of an image, or change the HTML of a container, to the specified path.
   * @function
   * @param {String} path - Path to the image or HTML partial.
   * @fires Interchange#replaced
   */
  Interchange.prototype.replace = function(path) {
    if (this.currentPath === path) return;

    var _this = this;

    // Replacing images
    if (this.$element[0].nodeName === 'IMG') {
      this.$element.attr('src', path).load(function() {
        _this.$element.trigger('replaced.zf.interchange');
        _this.currentPath = path;
      });
    }
    // Replacing background images
    else if (path.match(/\.(gif|jpg|jpeg|tiff|png)([?#].*)?/i)) {
      this.$element.css({ 'background-image': 'url('+path+')' });
    }
    // Replacing HTML
    else {
      $.get(path, function(response) {
        _this.$element.html(response);
        _this.$element.trigger('replaced.zf.interchange');
        _this.currentPath = path;
      });
    }
  };
  /**
   * Destroys an instance of interchange.
   * @function
   */
  Interchange.prototype.destroy = function(){
    //TODO this.
  };
  Foundation.plugin(Interchange, 'Interchange');

  // Exports for AMD/Browserify
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Interchange;
  if (typeof define === 'function')
    define(['foundation'], function() {
      return Interchange;
    });

}(Foundation, jQuery);

/**
 * Magellan module.
 * @module foundation.magellan
 */
!function(Foundation, $) {
  'use strict';

  /**
   * Creates a new instance of Magellan.
   * @class
   * @fires Magellan#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function Magellan(element, options) {
    this.$element = element;
    this.options  = $.extend({}, Magellan.defaults, this.$element.data(), options);

    this._init();

    Foundation.registerPlugin(this);
  }

  /**
   * Default settings for plugin
   */
  Magellan.defaults = {
    /**
     * Amount of time, in ms, the animated scrolling should take between locations.
     * @option
     * @example 500
     */
    animationDuration: 500,
    /**
     * Animation style to use when scrolling between locations.
     * @option
     * @example 'ease-in-out'
     */
    animationEasing: 'linear',
    /**
     * Number of pixels to use as a marker for location changes.
     * @option
     * @example 50
     */
    threshold: 50,
    /**
     * Class applied to the active locations link on the magellan container.
     * @option
     * @example 'active'
     */
    activeClass: 'active',
    /**
     * Allows the script to manipulate the url of the current page, and if supported, alter the history.
     * @option
     * @example true
     */
    deepLinking: false,
    /**
     * Number of pixels to offset the scroll of the page on item click if using a sticky nav bar.
     * @option
     * @example 25
     */
    barOffset: 0
  };

  /**
   * Initializes the Magellan plugin and calls functions to get equalizer functioning on load.
   * @private
   */
  Magellan.prototype._init = function() {
    var id = this.$element[0].id || Foundation.GetYoDigits(6, 'magellan'),
        _this = this;
    this.$targets = $('[data-magellan-target]');
    this.$links = this.$element.find('a');
    this.$element.attr({
      'data-resize': id,
      'data-scroll': id,
      'id': id
    });
    this.$active = $();
    this.scrollPos = parseInt(window.pageYOffset, 10);

    this._events();
  };
  /**
   * Calculates an array of pixel values that are the demarcation lines between locations on the page.
   * Can be invoked if new elements are added or the size of a location changes.
   * @function
   */
  Magellan.prototype.calcPoints = function(){
    var _this = this,
        body = document.body,
        html = document.documentElement;

    this.points = [];
    this.winHeight = Math.round(Math.max(window.innerHeight, html.clientHeight));
    this.docHeight = Math.round(Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight));

    this.$targets.each(function(){
      var $tar = $(this),
          pt = Math.round($tar.offset().top - _this.options.threshold);
      $tar.targetPoint = pt;
      _this.points.push(pt);
    });
  };
  /**
   * Initializes events for Magellan.
   * @private
   */
  Magellan.prototype._events = function() {
    var _this = this,
        $body = $('html, body'),
        opts = {
          duration: _this.options.animationDuration,
          easing:   _this.options.animationEasing
        };

    $(window).one('load', function(){
      _this.calcPoints();
      _this._updateActive();
    });

    this.$element.on({
      'resizeme.zf.trigger': this.reflow.bind(this),
      'scrollme.zf.trigger': this._updateActive.bind(this)
    }).on('click.zf.magellan', 'a[href^="#"]', function(e) {
        e.preventDefault();
        var arrival   = this.getAttribute('href'),
            scrollPos = $(arrival).offset().top - _this.options.threshold / 2 - _this.options.barOffset;

        // requestAnimationFrame is disabled for this plugin currently
        // Foundation.Move(_this.options.animationDuration, $body, function(){
          $body.stop(true).animate({
            scrollTop: scrollPos
          }, opts);
        });
      // });
  };
  /**
   * Calls necessary functions to update Magellan upon DOM change
   * @function
   */
  Magellan.prototype.reflow = function(){
    this.calcPoints();
    this._updateActive();
  };
  /**
   * Updates the visibility of an active location link, and updates the url hash for the page, if deepLinking enabled.
   * @private
   * @function
   * @fires Magellan#update
   */
  Magellan.prototype._updateActive = function(/*evt, elem, scrollPos*/){
    var winPos = /*scrollPos ||*/ parseInt(window.pageYOffset, 10),
        curIdx;

    if(winPos + this.winHeight === this.docHeight){ curIdx = this.points.length - 1; }
    else if(winPos < this.points[0]){ curIdx = 0; }
    else{
      var isDown = this.scrollPos < winPos,
          _this = this,
          curVisible = this.points.filter(function(p, i){
            return isDown ? p <= winPos : p - _this.options.threshold <= winPos;//&& winPos >= _this.points[i -1] - _this.options.threshold;
          });
      curIdx = curVisible.length ? curVisible.length - 1 : 0;
    }

    this.$active.removeClass(this.options.activeClass);
    this.$active = this.$links.eq(curIdx).addClass(this.options.activeClass);

    if(this.options.deepLinking){
      var hash = this.$active[0].getAttribute('href');
      if(window.history.pushState){
        window.history.pushState(null, null, hash);
      }else{
        window.location.hash = hash;
      }
    }

    this.scrollPos = winPos;
    /**
     * Fires when magellan is finished updating to the new active element.
     * @event Magellan#update
     */
    this.$element.trigger('update.zf.magellan', [this.$active]);
  };
  /**
   * Destroys an instance of Magellan and resets the url of the window.
   * @function
   */
  Magellan.prototype.destroy = function(){
    this.$element.off('.zf.trigger .zf.magellan')
        .find('.' + this.options.activeClass).removeClass(this.options.activeClass);

    if(this.options.deepLinking){
      var hash = this.$active[0].getAttribute('href');
      window.location.hash.replace(hash, '');
    }

    Foundation.unregisterPlugin(this);
  };
  Foundation.plugin(Magellan, 'Magellan');

  // Exports for AMD/Browserify
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Magellan;
  if (typeof define === 'function')
    define(['foundation'], function() {
      return Magellan;
    });

}(Foundation, jQuery);

/**
 * OffCanvas module.
 * @module foundation.offcanvas
 * @requires foundation.util.triggers
 * @requires foundation.util.motion
 */
!function($, Foundation) {

'use strict';

/**
 * Creates a new instance of an off-canvas wrapper.
 * @class
 * @fires OffCanvas#init
 * @param {Object} element - jQuery object to initialize.
 * @param {Object} options - Overrides to the default plugin settings.
 */
function OffCanvas(element, options) {
  this.$element = element;
  this.options = $.extend({}, OffCanvas.defaults, this.$element.data(), options);
  this.$lastTrigger = $();

  this._init();
  this._events();

  Foundation.registerPlugin(this);
}

OffCanvas.defaults = {
  /**
   * Allow the user to click outside of the menu to close it.
   * @option
   * @example true
   */
  closeOnClick: true,
  /**
   * Amount of time in ms the open and close transition requires. If none selected, pulls from body style.
   * @option
   * @example 500
   */
  transitionTime: 0,
  /**
   * Direction the offcanvas opens from. Determines class applied to body.
   * @option
   * @example left
   */
  position: 'left',
  /**
   * Force the page to scroll to top on open.
   */
  forceTop: true,
  /**
   * Allow the offcanvas to be sticky while open. Does nothing if Sass option `$maincontent-prevent-scroll === true`.
   * Performance in Safari OSX/iOS is not great.
   */
  // isSticky: false,
  /**
   * Allow the offcanvas to remain open for certain breakpoints. Can be used with `isSticky`.
   * @option
   * @example false
   */
  isRevealed: false,
  /**
   * Breakpoint at which to reveal. JS will use a RegExp to target standard classes, if changing classnames, pass your class @`revealClass`.
   * @option
   * @example reveal-for-large
   */
  revealOn: null,
  /**
   * Force focus to the offcanvas on open. If true, will focus the opening trigger on close.
   * @option
   * @example true
   */
  autoFocus: true,
  /**
   * Class used to force an offcanvas to remain open. Foundation defaults for this are `reveal-for-large` & `reveal-for-medium`.
   * @option
   * TODO improve the regex testing for this.
   * @example reveal-for-large
   */
  revealClass: 'reveal-for-'
};

/**
 * Initializes the off-canvas wrapper by adding the exit overlay (if needed).
 * @function
 * @private
 */
OffCanvas.prototype._init = function() {
  var id = this.$element.attr('id');

  this.$element.attr('aria-hidden', 'true');

  // Find triggers that affect this element and add aria-expanded to them
  $(document)
    .find('[data-open="'+id+'"], [data-close="'+id+'"], [data-toggle="'+id+'"]')
    .attr('aria-expanded', 'false')
    .attr('aria-controls', id);

  // Add a close trigger over the body if necessary
  if (this.options.closeOnClick){
    if($('.js-off-canvas-exit').length){
      this.$exiter = $('.js-off-canvas-exit');
    }else{
      var exiter = document.createElement('div');
      exiter.setAttribute('class', 'js-off-canvas-exit');
      $('[data-off-canvas-content]').append(exiter);

      this.$exiter = $(exiter);
    }
  }

  this.options.isRevealed = this.options.isRevealed || new RegExp(this.options.revealClass, 'g').test(this.$element[0].className);

  if(this.options.isRevealed){
    this.options.revealOn = this.options.revealOn || this.$element[0].className.match(/(reveal-for-medium|reveal-for-large)/g)[0].split('-')[2];
    this._setMQChecker();
  }
  if(!this.options.transitionTime){
    this.options.transitionTime = parseFloat(window.getComputedStyle($('[data-off-canvas-wrapper]')[0]).transitionDuration) * 1000;
  }
};

/**
 * Adds event handlers to the off-canvas wrapper and the exit overlay.
 * @function
 * @private
 */
OffCanvas.prototype._events = function() {
  this.$element.on({
    'open.zf.trigger': this.open.bind(this),
    'close.zf.trigger': this.close.bind(this),
    'toggle.zf.trigger': this.toggle.bind(this),
    'keydown.zf.offcanvas': this._handleKeyboard.bind(this)
  });

  if (this.$exiter.length) {
    var _this = this;
    this.$exiter.on({'click.zf.offcanvas': this.close.bind(this)});
  }
};
/**
 * Applies event listener for elements that will reveal at certain breakpoints.
 * @private
 */
OffCanvas.prototype._setMQChecker = function(){
  var _this = this;

  $(window).on('changed.zf.mediaquery', function(){
    if(Foundation.MediaQuery.atLeast(_this.options.revealOn)){
      _this.reveal(true);
    }else{
      _this.reveal(false);
    }
  }).one('load.zf.offcanvas', function(){
    if(Foundation.MediaQuery.atLeast(_this.options.revealOn)){
      _this.reveal(true);
    }
  });
};
/**
 * Handles the revealing/hiding the off-canvas at breakpoints, not the same as open.
 * @param {Boolean} isRevealed - true if element should be revealed.
 * @function
 */
OffCanvas.prototype.reveal = function(isRevealed){
  var $closer = this.$element.find('[data-close]');
  if(isRevealed){
    // if(!this.options.forceTop){
    //   var scrollPos = parseInt(window.pageYOffset);
    //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
    // }
    // if(this.options.isSticky){ this._stick(); }
    if($closer.length){ $closer.hide(); }
  }else{
    // if(this.options.isSticky || !this.options.forceTop){
    //   this.$element[0].style.transform = '';
    //   $(window).off('scroll.zf.offcanvas');
    // }
    if($closer.length){
      $closer.show();
    }
  }
};

/**
 * Opens the off-canvas menu.
 * @function
 * @param {Object} event - Event object passed from listener.
 * @param {jQuery} trigger - element that triggered the off-canvas to open.
 * @fires OffCanvas#opened
 */
OffCanvas.prototype.open = function(event, trigger) {
  if (this.$element.hasClass('is-open')){ return; }
  var _this = this,
      $body = $(document.body);
  $('body').scrollTop(0);
  // window.pageYOffset = 0;

  // if(!this.options.forceTop){
  //   var scrollPos = parseInt(window.pageYOffset);
  //   this.$element[0].style.transform = 'translate(0,' + scrollPos + 'px)';
  //   if(this.$exiter.length){
  //     this.$exiter[0].style.transform = 'translate(0,' + scrollPos + 'px)';
  //   }
  // }
  /**
   * Fires when the off-canvas menu opens.
   * @event OffCanvas#opened
   */
  Foundation.Move(this.options.transitionTime, this.$element, function(){
    $('[data-off-canvas-wrapper]').addClass('is-off-canvas-open is-open-'+ _this.options.position);

    _this.$element
      .addClass('is-open')
      .attr('aria-hidden', 'false')
      .trigger('opened.zf.offcanvas');

    // if(_this.options.isSticky){
    //   _this._stick();
    // }
  });
  if(trigger){
    this.$lastTrigger = trigger.attr('aria-expanded', 'true');
  }
  if(this.options.autoFocus){
    this.$element.one('finished.zf.animate', function(){
      _this.$element.find('a, button').eq(0).focus();
    });
  }
};
/**
 * Allows the offcanvas to appear sticky utilizing translate properties.
 * @private
 */
// OffCanvas.prototype._stick = function(){
//   var elStyle = this.$element[0].style;
//
//   if(this.options.closeOnClick){
//     var exitStyle = this.$exiter[0].style;
//   }
//
//   $(window).on('scroll.zf.offcanvas', function(e){
//     console.log(e);
//     var pageY = window.pageYOffset;
//     elStyle.transform = 'translate(0,' + pageY + 'px)';
//     if(exitStyle !== undefined){ exitStyle.transform = 'translate(0,' + pageY + 'px)'; }
//   });
//   // this.$element.trigger('stuck.zf.offcanvas');
// };
/**
 * Closes the off-canvas menu.
 * @function
 * @fires OffCanvas#closed
 */
OffCanvas.prototype.close = function() {
  if(!this.$element.hasClass('is-open')){ return; }

  var _this = this;

   Foundation.Move(this.options.transitionTime, this.$element, function(){
    $('[data-off-canvas-wrapper]').removeClass('is-off-canvas-open is-open-'+_this.options.position);

    _this.$element.removeClass('is-open');
    // Foundation._reflow();
  });
  this.$element.attr('aria-hidden', 'true')
    /**
     * Fires when the off-canvas menu opens.
     * @event OffCanvas#closed
     */
      .trigger('closed.zf.offcanvas');
  // if(_this.options.isSticky || !_this.options.forceTop){
  //   setTimeout(function(){
  //     _this.$element[0].style.transform = '';
  //     $(window).off('scroll.zf.offcanvas');
  //   }, this.options.transitionTime);
  // }

  this.$lastTrigger.attr('aria-expanded', 'false');
};

/**
 * Toggles the off-canvas menu open or closed.
 * @function
 * @param {Object} event - Event object passed from listener.
 * @param {jQuery} trigger - element that triggered the off-canvas to open.
 */
OffCanvas.prototype.toggle = function(event, trigger) {
  if (this.$element.hasClass('is-open')) {
    this.close(event, trigger);
  }
  else {
    this.open(event, trigger);
  }
};

/**
 * Handles keyboard input when detected. When the escape key is pressed, the off-canvas menu closes, and focus is restored to the element that opened the menu.
 * @function
 * @private
 */
OffCanvas.prototype._handleKeyboard = function(event) {
  if (event.which !== 27) return;

  event.stopPropagation();
  event.preventDefault();
  this.close();
  this.$lastTrigger.focus();
};
/**
 * Destroys the offcanvas plugin.
 * @function
 */
OffCanvas.prototype.destroy = function(){
  //TODO make this...
};

Foundation.plugin(OffCanvas, 'OffCanvas');

}(jQuery, Foundation);

/**
 * Orbit module.
 * @module foundation.orbit
 * @requires foundation.util.keyboard
 * @requires foundation.util.motion
 * @requires foundation.util.timerAndImageLoader
 * @requires foundation.util.touch
 */
!function($, Foundation){
  'use strict';
  /**
   * Creates a new instance of an orbit carousel.
   * @class
   * @param {jQuery} element - jQuery object to make into an accordion menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function Orbit(element, options){
    this.$element = element;
    this.options = $.extend({}, Orbit.defaults, this.$element.data(), options);

    this._init();

    Foundation.registerPlugin(this);
    Foundation.Keyboard.register('Orbit', {
        'ltr': {
          'ARROW_RIGHT': 'next',
          'ARROW_LEFT': 'previous'
        },
        'rtl': {
          'ARROW_LEFT': 'next',
          'ARROW_RIGHT': 'previous'
        }
    });
  }
  Orbit.defaults = {
    /**
     * Tells the JS to loadBullets.
     * @option
     * @example true
     */
    bullets: true,
    /**
     * Tells the JS to apply event listeners to nav buttons
     * @option
     * @example true
     */
    navButtons: true,
    /**
     * motion-ui animation class to apply
     * @option
     * @example 'slide-in-right'
     */
    animInFromRight: 'slide-in-right',
    /**
     * motion-ui animation class to apply
     * @option
     * @example 'slide-out-right'
     */
    animOutToRight: 'slide-out-right',
    /**
     * motion-ui animation class to apply
     * @option
     * @example 'slide-in-left'
     *
     */
    animInFromLeft: 'slide-in-left',
    /**
     * motion-ui animation class to apply
     * @option
     * @example 'slide-out-left'
     */
    animOutToLeft: 'slide-out-left',
    /**
     * Allows Orbit to automatically animate on page load.
     * @option
     * @example true
     */
    autoPlay: true,
    /**
     * Amount of time, in ms, between slide transitions
     * @option
     * @example 5000
     */
    timerDelay: 5000,
    /**
     * Allows Orbit to infinitely loop through the slides
     * @option
     * @example true
     */
    infiniteWrap: true,
    /**
     * Allows the Orbit slides to bind to swipe events for mobile, requires an additional util library
     * @option
     * @example true
     */
    swipe: true,
    /**
     * Allows the timing function to pause animation on hover.
     * @option
     * @example true
     */
    pauseOnHover: true,
    /**
     * Allows Orbit to bind keyboard events to the slider, to animate frames with arrow keys
     * @option
     * @example true
     */
    accessible: true,
    /**
     * Class applied to the container of Orbit
     * @option
     * @example 'orbit-container'
     */
    containerClass: 'orbit-container',
    /**
     * Class applied to individual slides.
     * @option
     * @example 'orbit-slide'
     */
    slideClass: 'orbit-slide',
    /**
     * Class applied to the bullet container. You're welcome.
     * @option
     * @example 'orbit-bullets'
     */
    boxOfBullets: 'orbit-bullets',
    /**
     * Class applied to the `next` navigation button.
     * @option
     * @example 'orbit-next'
     */
    nextClass: 'orbit-next',
    /**
     * Class applied to the `previous` navigation button.
     * @option
     * @example 'orbit-previous'
     */
    prevClass: 'orbit-previous',
    /**
     * Boolean to flag the js to use motion ui classes or not. Default to true for backwards compatability.
     * @option
     * @example true
     */
    useMUI: true
  };
  /**
   * Initializes the plugin by creating jQuery collections, setting attributes, and starting the animation.
   * @function
   * @private
   */
  Orbit.prototype._init = function(){
    this.$wrapper = this.$element.find('.' + this.options.containerClass);
    this.$slides = this.$element.find('.' + this.options.slideClass);
    var $images = this.$element.find('img'),
        initActive = this.$slides.filter('.is-active');

    if(!initActive.length){
      this.$slides.eq(0).addClass('is-active');
    }
    if(!this.options.useMUI){
      this.$slides.addClass('no-motionui');
    }
    if($images.length){
      Foundation.onImagesLoaded($images, this._prepareForOrbit.bind(this));
    }else{
      this._prepareForOrbit();//hehe
    }

    if(this.options.bullets){
      this._loadBullets();
    }

    this._events();

    if(this.options.autoPlay){
      this.geoSync();
    }
    if(this.options.accessible){ // allow wrapper to be focusable to enable arrow navigation
      this.$wrapper.attr('tabindex', 0);
    }
  };
  /**
   * Creates a jQuery collection of bullets, if they are being used.
   * @function
   * @private
   */
  Orbit.prototype._loadBullets = function(){
    this.$bullets = this.$element.find('.' + this.options.boxOfBullets).find('button');
  };
  /**
   * Sets a `timer` object on the orbit, and starts the counter for the next slide.
   * @function
   */
  Orbit.prototype.geoSync = function(){
    var _this = this;
    this.timer = new Foundation.Timer(
                      this.$element,
                      {duration: this.options.timerDelay,
                       infinite: false},
                      function(){
                        _this.changeSlide(true);
                      });
    this.timer.start();
  };
  /**
   * Sets wrapper and slide heights for the orbit.
   * @function
   * @private
   */
  Orbit.prototype._prepareForOrbit = function(){
    var _this = this;
    this._setWrapperHeight(function(max){
      _this._setSlideHeight(max);
    });
  };
  /**
   * Calulates the height of each slide in the collection, and uses the tallest one for the wrapper height.
   * @function
   * @private
   * @param {Function} cb - a callback function to fire when complete.
   */
  Orbit.prototype._setWrapperHeight = function(cb){//rewrite this to `for` loop
    var max = 0, temp, counter = 0;

    this.$slides.each(function(){
      temp = this.getBoundingClientRect().height;
      $(this).attr('data-slide', counter);

      if(counter){//if not the first slide, set css position and display property
        $(this).css({'position': 'relative', 'display': 'none'});
      }
      max = temp > max ? temp : max;
      counter++;
    });

    if(counter === this.$slides.length){
      this.$wrapper.css({'height': max});//only change the wrapper height property once.
      cb(max);//fire callback with max height dimension.
    }
  };
  /**
   * Sets the max-height of each slide.
   * @function
   * @private
   */
  Orbit.prototype._setSlideHeight = function(height){
    this.$slides.each(function(){
      $(this).css('max-height', height);
    });
  };
  /**
   * Adds event listeners to basically everything within the element.
   * @function
   * @private
   */
  Orbit.prototype._events = function(){
    var _this = this;

    //***************************************
    //**Now using custom event - thanks to:**
    //**      Yohai Ararat of Toronto      **
    //***************************************
    if(this.options.swipe){
      this.$slides.off('swipeleft.zf.orbit swiperight.zf.orbit')
      .on('swipeleft.zf.orbit', function(e){
        e.preventDefault();
        _this.changeSlide(true);
      }).on('swiperight.zf.orbit', function(e){
        e.preventDefault();
        _this.changeSlide(false);
      });
    }
    //***************************************

    if(this.options.autoPlay){
      this.$slides.on('click.zf.orbit', function(){
        _this.$element.data('clickedOn', _this.$element.data('clickedOn') ? false : true);
        _this.timer[_this.$element.data('clickedOn') ? 'pause' : 'start']();
      });
      if(this.options.pauseOnHover){
        this.$element.on('mouseenter.zf.orbit', function(){
          _this.timer.pause();
        }).on('mouseleave.zf.orbit', function(){
          if(!_this.$element.data('clickedOn')){
            _this.timer.start();
          }
        });
      }
    }

    if(this.options.navButtons){
      var $controls = this.$element.find('.' + this.options.nextClass + ', .' + this.options.prevClass);
      $controls.attr('tabindex', 0)
        //also need to handle enter/return and spacebar key presses
               .on('click.zf.orbit touchend.zf.orbit', function(){
                 _this.changeSlide($(this).hasClass(_this.options.nextClass));
               });
    }

    if(this.options.bullets){
      this.$bullets.on('click.zf.orbit touchend.zf.orbit', function(){
        if(/is-active/g.test(this.className)){ return false; }//if this is active, kick out of function.
        var idx = $(this).data('slide'),
            ltr = idx > _this.$slides.filter('.is-active').data('slide'),
            $slide = _this.$slides.eq(idx);

        _this.changeSlide(ltr, $slide, idx);
      });
    }

    this.$wrapper.add(this.$bullets).on('keydown.zf.orbit', function(e){
      // handle keyboard event with keyboard util
      Foundation.Keyboard.handleKey(e, _this, {
        next: function() {
          _this.changeSlide(true);
        },
        previous: function() {
          _this.changeSlide(false);
        },
        handled: function() { // if bullet is focused, make sure focus moves
          if ($(e.target).is(_this.$bullets)) {
            _this.$bullets.filter('.is-active').focus();
          }
        }
      });
    });
  };
  /**
   * Changes the current slide to a new one.
   * @function
   * @param {Boolean} isLTR - flag if the slide should move left to right.
   * @param {jQuery} chosenSlide - the jQuery element of the slide to show next, if one is selected.
   * @param {Number} idx - the index of the new slide in its collection, if one chosen.
   * @fires Orbit#slidechange
   */
  Orbit.prototype.changeSlide = function(isLTR, chosenSlide, idx){
    var $curSlide = this.$slides.filter('.is-active').eq(0);

    if(/mui/g.test($curSlide[0].className)){ return false; }//if the slide is currently animating, kick out of the function

    var $firstSlide = this.$slides.first(),
        $lastSlide = this.$slides.last(),
        dirIn = isLTR ? 'Right' : 'Left',
        dirOut = isLTR ? 'Left' : 'Right',
        _this = this,
        $newSlide;

    if(!chosenSlide){//most of the time, this will be auto played or clicked from the navButtons.
      $newSlide = isLTR ? //if wrapping enabled, check to see if there is a `next` or `prev` sibling, if not, select the first or last slide to fill in. if wrapping not enabled, attempt to select `next` or `prev`, if there's nothing there, the function will kick out on next step. CRAZY NESTED TERNARIES!!!!!
                    (this.options.infiniteWrap ? $curSlide.next('.' + this.options.slideClass).length ? $curSlide.next('.' + this.options.slideClass) : $firstSlide : $curSlide.next('.' + this.options.slideClass))//pick next slide if moving left to right
                    :
                    (this.options.infiniteWrap ? $curSlide.prev('.' + this.options.slideClass).length ? $curSlide.prev('.' + this.options.slideClass) : $lastSlide : $curSlide.prev('.' + this.options.slideClass));//pick prev slide if moving right to left
    }else{
      $newSlide = chosenSlide;
    }
    if($newSlide.length){
      if(this.options.bullets){
        idx = idx || this.$slides.index($newSlide);//grab index to update bullets
        this._updateBullets(idx);
      }
      if(this.options.useMUI){

        Foundation.Motion.animateIn(
          $newSlide.addClass('is-active').css({'position': 'absolute', 'top': 0}),
          this.options['animInFrom' + dirIn],
          function(){
            $newSlide.css({'position': 'relative', 'display': 'block'})
                     .attr('aria-live', 'polite');
          });

        Foundation.Motion.animateOut(
          $curSlide.removeClass('is-active'),
          this.options['animOutTo' + dirOut],
          function(){
            $curSlide.removeAttr('aria-live');
            if(_this.options.autoPlay){
              _this.timer.restart();
            }
            //do stuff?
          });
      }else{
        $curSlide.removeClass('is-active is-in').removeAttr('aria-live').hide();
        $newSlide.addClass('is-active is-in').attr('aria-live', 'polite').show();
        if(this.options.autoPlay){
          this.timer.restart();
        }
      }
      /**
       * Triggers when the slide has finished animating in.
       * @event Orbit#slidechange
       */
      this.$element.trigger('slidechange.zf.orbit', [$newSlide]);
    }
  };
  /**
   * Updates the active state of the bullets, if displayed.
   * @function
   * @private
   * @param {Number} idx - the index of the current slide.
   */
  Orbit.prototype._updateBullets = function(idx){
    var $oldBullet = this.$element.find('.' + this.options.boxOfBullets)
                                  .find('.is-active').removeClass('is-active').blur(),
        span = $oldBullet.find('span:last').detach(),
        $newBullet = this.$bullets.eq(idx).addClass('is-active').append(span);
  };
  /**
   * Destroys the carousel and hides the element.
   * @function
   */
  Orbit.prototype.destroy = function(){
    delete this.timer;
    this.$element.off('.zf.orbit').find('*').off('.zf.orbit').end().hide();
    Foundation.unregisterPlugin(this);
  };

  Foundation.plugin(Orbit, 'Orbit');

}(jQuery, window.Foundation);

/**
 * ResponsiveMenu module.
 * @module foundation.responsiveMenu
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.accordionMenu
 * @requires foundation.util.drilldown
 * @requires foundation.util.dropdown-menu
 */
!function(Foundation, $) {
  'use strict';

  // The plugin matches the plugin classes with these plugin instances.
  var MenuPlugins = {
    dropdown: {
      cssClass: 'dropdown',
      plugin: Foundation._plugins['dropdown-menu'] || null
    },
    drilldown: {
      cssClass: 'drilldown',
      plugin: Foundation._plugins['drilldown'] || null
    },
    accordion: {
      cssClass: 'accordion-menu',
      plugin: Foundation._plugins['accordion-menu'] || null
    }
  };

  // [PH] Media queries
  var phMedia = {
    small: '(min-width: 0px)',
    medium: '(min-width: 640px)'
  };

  /**
   * Creates a new instance of a responsive menu.
   * @class
   * @fires ResponsiveMenu#init
   * @param {jQuery} element - jQuery object to make into a dropdown menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function ResponsiveMenu(element) {
    this.$element = $(element);
    this.rules = this.$element.data('responsive-menu');
    this.currentMq = null;
    this.currentPlugin = null;

    this._init();
    this._events();

    Foundation.registerPlugin(this);
  }

  ResponsiveMenu.defaults = {};

  /**
   * Initializes the Menu by parsing the classes from the 'data-ResponsiveMenu' attribute on the element.
   * @function
   * @private
   */
  ResponsiveMenu.prototype._init = function() {
    var rulesTree = {};

    // Parse rules from "classes" in data attribute
    var rules = this.rules.split(' ');

    // Iterate through every rule found
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i].split('-');
      var ruleSize = rule.length > 1 ? rule[0] : 'small';
      var rulePlugin = rule.length > 1 ? rule[1] : rule[0];

      if (MenuPlugins[rulePlugin] !== null) {
        rulesTree[ruleSize] = MenuPlugins[rulePlugin];
      }
    }

    this.rules = rulesTree;

    if (!$.isEmptyObject(rulesTree)) {
      this._checkMediaQueries();
    }
  };

  /**
   * Initializes events for the Menu.
   * @function
   * @private
   */
  ResponsiveMenu.prototype._events = function() {
    var _this = this;

    $(window).on('changed.zf.mediaquery', function() {
      _this._checkMediaQueries();
    });
    // $(window).on('resize.zf.ResponsiveMenu', function() {
    //   _this._checkMediaQueries();
    // });
  };

  /**
   * Checks the current screen width against available media queries. If the media query has changed, and the plugin needed has changed, the plugins will swap out.
   * @function
   * @private
   */
  ResponsiveMenu.prototype._checkMediaQueries = function() {
    var matchedMq, _this = this;
    // Iterate through each rule and find the last matching rule
    $.each(this.rules, function(key) {
      if (Foundation.MediaQuery.atLeast(key)) {
        matchedMq = key;
      }
    });

    // No match? No dice
    if (!matchedMq) return;

    // Plugin already initialized? We good
    if (this.currentPlugin instanceof this.rules[matchedMq].plugin) return;

    // Remove existing plugin-specific CSS classes
    $.each(MenuPlugins, function(key, value) {
      _this.$element.removeClass(value.cssClass);
    });

    // Add the CSS class for the new plugin
    this.$element.addClass(this.rules[matchedMq].cssClass);

    // Create an instance of the new plugin
    if (this.currentPlugin) this.currentPlugin.destroy();
    this.currentPlugin = new this.rules[matchedMq].plugin(this.$element, {});
  };

  /**
   * Destroys the instance of the current plugin on this element, as well as the window resize handler that switches the plugins out.
   * @function
   */
  ResponsiveMenu.prototype.destroy = function() {
    this.currentPlugin.destroy();
    $(window).off('.zf.ResponsiveMenu');
    Foundation.unregisterPlugin(this);
  };
  Foundation.plugin(ResponsiveMenu, 'ResponsiveMenu');

}(Foundation, jQuery);

/**
 * ResponsiveToggle module.
 * @module foundation.responsiveToggle
 * @requires foundation.util.mediaQuery
 */
!function($, Foundation) {

'use strict';

/**
 * Creates a new instance of Tab Bar.
 * @class
 * @fires ResponsiveToggle#init
 * @param {jQuery} element - jQuery object to attach tab bar functionality to.
 * @param {Object} options - Overrides to the default plugin settings.
 */
function ResponsiveToggle(element, options) {
  this.$element = $(element);
  this.options = $.extend({}, ResponsiveToggle.defaults, this.$element.data(), options);

  this._init();
  this._events();

  Foundation.registerPlugin(this);
}

ResponsiveToggle.defaults = {
  /**
   * The breakpoint after which the menu is always shown, and the tab bar is hidden.
   * @option
   * @example 'medium'
   */
  hideFor: 'medium'
};

/**
 * Initializes the tab bar by finding the target element, toggling element, and running update().
 * @function
 * @private
 */
ResponsiveToggle.prototype._init = function() {
  var targetID = this.$element.data('responsive-toggle');
  if (!targetID) {
    console.error('Your tab bar needs an ID of a Menu as the value of data-tab-bar.');
  }

  this.$targetMenu = $('#'+targetID);
  this.$toggler = this.$element.find('[data-toggle]');

  this._update();
};

/**
 * Adds necessary event handlers for the tab bar to work.
 * @function
 * @private
 */
ResponsiveToggle.prototype._events = function() {
  var _this = this;

  $(window).on('changed.zf.mediaquery', this._update.bind(this));

  this.$toggler.on('click.zf.responsiveToggle', this.toggleMenu.bind(this));
};

/**
 * Checks the current media query to determine if the tab bar should be visible or hidden.
 * @function
 * @private
 */
ResponsiveToggle.prototype._update = function() {
  // Mobile
  if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
    this.$element.show();
    this.$targetMenu.hide();
  }

  // Desktop
  else {
    this.$element.hide();
    this.$targetMenu.show();
  }
};

/**
 * Toggles the element attached to the tab bar. The toggle only happens if the screen is small enough to allow it.
 * @function
 * @fires ResponsiveToggle#toggled
 */
ResponsiveToggle.prototype.toggleMenu = function() {
  if (!Foundation.MediaQuery.atLeast(this.options.hideFor)) {
    this.$targetMenu.toggle(0);

    /**
     * Fires when the element attached to the tab bar toggles.
     * @event ResponsiveToggle#toggled
     */
    this.$element.trigger('toggled.zf.responsiveToggle');
  }
};
ResponsiveToggle.prototype.destroy = function(){
  //TODO this...
};
Foundation.plugin(ResponsiveToggle, 'ResponsiveToggle');

}(jQuery, Foundation);

/**
 * Reveal module.
 * @module foundation.reveal
 * @requires foundation.util.keyboard
 * @requires foundation.util.box
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 * @requires foundation.util.motion if using animations
 */
!function(Foundation, $) {
  'use strict';

  /**
   * Creates a new instance of Reveal.
   * @class
   * @param {jQuery} element - jQuery object to use for the modal.
   * @param {Object} options - optional parameters.
   */

  function Reveal(element, options) {
    this.$element = element;
    this.options = $.extend({}, Reveal.defaults, this.$element.data(), options);
    this._init();

    Foundation.registerPlugin(this);
    Foundation.Keyboard.register('Reveal', {
      'ENTER': 'open',
      'SPACE': 'open',
      'ESCAPE': 'close',
      'TAB': 'tab_forward',
      'SHIFT_TAB': 'tab_backward'
    });
  }

  Reveal.defaults = {
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-in-left'
     */
    animationIn: '',
    /**
     * Motion-UI class to use for animated elements. If none used, defaults to simple show/hide.
     * @option
     * @example 'slide-out-right'
     */
    animationOut: '',
    /**
     * Time, in ms, to delay the opening of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    showDelay: 0,
    /**
     * Time, in ms, to delay the closing of a modal after a click if no animation used.
     * @option
     * @example 10
     */
    hideDelay: 0,
    /**
     * Allows a click on the body/overlay to close the modal.
     * @option
     * @example true
     */
    closeOnClick: true,
    /**
     * Allows the modal to close if the user presses the `ESCAPE` key.
     * @option
     * @example true
     */
    closeOnEsc: true,
    /**
     * If true, allows multiple modals to be displayed at once.
     * @option
     * @example false
     */
    multipleOpened: false,
    /**
     * Distance, in pixels, the modal should push down from the top of the screen.
     * @option
     * @example 100
     */
    vOffset: 100,
    /**
     * Distance, in pixels, the modal should push in from the side of the screen.
     * @option
     * @example 0
     */
    hOffset: 0,
    /**
     * Allows the modal to be fullscreen, completely blocking out the rest of the view. JS checks for this as well.
     * @option
     * @example false
     */
    fullScreen: false,
    /**
     * Percentage of screen height the modal should push up from the bottom of the view.
     * @option
     * @example 10
     */
    btmOffsetPct: 10,
    /**
     * Allows the modal to generate an overlay div, which will cover the view when modal opens.
     * @option
     * @example true
     */
    overlay: true,
    /**
     * Allows the modal to remove and reinject markup on close. Should be true if using video elements w/o using provider's api.
     * @option
     * @example false
     */
    resetOnClose: false
  };

  /**
   * Initializes the modal by adding the overlay and close buttons, (if selected).
   * @private
   */
  Reveal.prototype._init = function(){
    this.id = this.$element.attr('id');
    this.isActive = false;

    this.$anchor = $('[data-open="' + this.id + '"]').length ? $('[data-open="' + this.id + '"]') : $('[data-toggle="' + this.id + '"]');

    if(this.$anchor.length){
      var anchorId = this.$anchor[0].id || Foundation.GetYoDigits(6, 'reveal');

      this.$anchor.attr({
        'aria-controls': this.id,
        'id': anchorId,
        'aria-haspopup': true,
        'tabindex': 0
      });
      this.$element.attr({'aria-labelledby': anchorId});
    }

    // this.options.fullScreen = this.$element.hasClass('full');
    if(this.options.fullScreen || this.$element.hasClass('full')){
      this.options.fullScreen = true;
      this.options.overlay = false;
    }
    if(this.options.overlay && !this.$overlay){
      this.$overlay = this._makeOverlay(this.id);
    }

    this.$element.attr({
        'role': 'dialog',
        'aria-hidden': true,
        'data-yeti-box': this.id,
        'data-resize': this.id
    });

    this._events();
  };

  /**
   * Creates an overlay div to display behind the modal.
   * @private
   */
  Reveal.prototype._makeOverlay = function(id){
    var $overlay = $('<div></div>')
                    .addClass('reveal-overlay')
                    .attr({'tabindex': -1, 'aria-hidden': true})
                    .appendTo('body');
    if(this.options.closeOnClick){
      $overlay.attr({
        'data-close': id
      });
    }
    return $overlay;
  };

  /**
   * Adds event handlers for the modal.
   * @private
   */
  Reveal.prototype._events = function(){
    var _this = this;

    this.$element.on({
      'open.zf.trigger': this.open.bind(this),
      'close.zf.trigger': this.close.bind(this),
      'toggle.zf.trigger': this.toggle.bind(this),
      'resizeme.zf.trigger': function(){
        if(_this.$element.is(':visible')){
          _this._setPosition(function(){});
        }
      }
    });

    if(this.$anchor.length){
      this.$anchor.on('keydown.zf.reveal', function(e){
        if(e.which === 13 || e.which === 32){
          e.stopPropagation();
          e.preventDefault();
          _this.open();
        }
      });
    }


    if(this.options.closeOnClick && this.options.overlay){
      this.$overlay.off('.zf.reveal').on('click.zf.reveal', this.close.bind(this));
    }
  };
  /**
   * Sets the position of the modal before opening
   * @param {Function} cb - a callback function to execute when positioning is complete.
   * @private
   */
  Reveal.prototype._setPosition = function(cb){
    var eleDims = Foundation.Box.GetDimensions(this.$element);
    var elePos = this.options.fullScreen ? 'reveal full' : (eleDims.height >= (0.5 * eleDims.windowDims.height)) ? 'reveal' : 'center';

    if(elePos === 'reveal full'){
      //set to full height/width
      this.$element
          .offset(Foundation.Box.GetOffsets(this.$element, null, elePos, this.options.vOffset))
          .css({
            'height': eleDims.windowDims.height,
            'width': eleDims.windowDims.width
          });
    }else if(!Foundation.MediaQuery.atLeast('medium') || !Foundation.Box.ImNotTouchingYou(this.$element, null, true, false)){
      //if smaller than medium, resize to 100% width minus any custom L/R margin
      this.$element
          .css({
            'width': eleDims.windowDims.width - (this.options.hOffset * 2)
          })
          .offset(Foundation.Box.GetOffsets(this.$element, null, 'center', this.options.vOffset, this.options.hOffset));
      //flag a boolean so we can reset the size after the element is closed.
      this.changedSize = true;
    }else{
      this.$element
          .css({
            'max-height': eleDims.windowDims.height - (this.options.vOffset * (this.options.btmOffsetPct / 100 + 1)),
            'width': ''
          })
          .offset(Foundation.Box.GetOffsets(this.$element, null, elePos, this.options.vOffset));
          //the max height based on a percentage of vertical offset plus vertical offset
    }

    cb();
  };

  /**
   * Opens the modal controlled by `this.$anchor`, and closes all others by default.
   * @function
   * @fires Reveal#closeAll
   * @fires Reveal#open
   */
  Reveal.prototype.open = function(){
    var _this = this;
    this.isActive = true;
    //make element invisible, but remove display: none so we can get size and positioning
    this.$element
        .css({'visibility': 'hidden'})
        .show()
        .scrollTop(0);

    this._setPosition(function(){
      _this.$element.hide()
                   .css({'visibility': ''});
      if(!_this.options.multipleOpened){
        /**
         * Fires immediately before the modal opens.
         * Closes any other modals that are currently open
         * @event Reveal#closeAll
         */
        _this.$element.trigger('closeme.zf.reveal', _this.id);
      }
      if(_this.options.animationIn){
        if(_this.options.overlay){
          Foundation.Motion.animateIn(_this.$overlay, 'fade-in', function(){
            Foundation.Motion.animateIn(_this.$element, _this.options.animationIn, function(){
              _this.focusableElements = Foundation.Keyboard.findFocusable(_this.$element);
            });
          });
        }else{
          Foundation.Motion.animateIn(_this.$element, _this.options.animationIn, function(){
            _this.focusableElements = Foundation.Keyboard.findFocusable(_this.$element);
          });
        }
      }else{
        if(_this.options.overlay){
          _this.$overlay.show(0, function(){
            _this.$element.show(_this.options.showDelay, function(){
            });
          });
        }else{
          _this.$element.show(_this.options.showDelay, function(){
          });
        }
      }
    });


    // handle accessibility
    this.$element.attr({'aria-hidden': false}).attr('tabindex', -1).focus()
    /**
     * Fires when the modal has successfully opened.
     * @event Reveal#open
     */
                 .trigger('open.zf.reveal');

    $('body').addClass('is-reveal-open')
             .attr({'aria-hidden': (this.options.overlay || this.options.fullScreen) ? true : false});
    setTimeout(function(){
      _this._extraHandlers();
      // Foundation.reflow();
    }, 0);
  };

  /**
   * Adds extra event handlers for the body and window if necessary.
   * @private
   */
  Reveal.prototype._extraHandlers = function(){
    var _this = this;
    this.focusableElements = Foundation.Keyboard.findFocusable(this.$element);

    if(!this.options.overlay && this.options.closeOnClick && !this.options.fullScreen){
      $('body').on('click.zf.reveal', function(e){
        // if()
          _this.close();
      });
    }
    if(this.options.closeOnEsc){
      $(window).on('keydown.zf.reveal', function(e){
        Foundation.Keyboard.handleKey(e, _this, {
          close: function() {
            if (this.options.closeOnEsc) {
              this.close();
              this.$anchor.focus();
            }
          }
        });
        if (_this.focusableElements.length === 0) { // no focusable elements inside the modal at all, prevent tabbing in general
          e.preventDefault();
        }
      });
    }

    // lock focus within modal while tabbing
    this.$element.on('keydown.zf.reveal', function(e) {
      var $target = $(this);
      // handle keyboard event with keyboard util
      Foundation.Keyboard.handleKey(e, _this, {
        tab_forward: function() {
          if (this.$element.find(':focus').is(_this.focusableElements.eq(-1))) { // left modal downwards, setting focus to first element
            _this.focusableElements.eq(0).focus();
            e.preventDefault();
          }
        },
        tab_backward: function() {
          if (this.$element.find(':focus').is(_this.focusableElements.eq(0)) || this.$element.is(':focus')) { // left modal upwards, setting focus to last element
            _this.focusableElements.eq(-1).focus();
            e.preventDefault();
          }
        },
        open: function() {
          if (_this.$element.find(':focus').is(_this.$element.find('[data-close]'))) {
            setTimeout(function() { // set focus back to anchor if close button has been activated
              _this.$anchor.focus();
            }, 1);
          } else if ($target.is(_this.focusableElements)) { // dont't trigger if acual element has focus (i.e. inputs, links, ...)
            this.open();
          }
        },
        close: function() {
          if (this.options.closeOnEsc) {
            this.close();
            this.$anchor.focus();
          }
        }
      });
    });

  };

  /**
   * Closes the modal.
   * @function
   * @fires Reveal#closed
   */
  Reveal.prototype.close = function(){
    if(!this.isActive || !this.$element.is(':visible')){
      return false;
    }
    var _this = this;

    if(this.options.animationOut){
      Foundation.Motion.animateOut(this.$element, this.options.animationOut, function(){
        if(_this.options.overlay){
          Foundation.Motion.animateOut(_this.$overlay, 'fade-out', function(){
          });
        }
      });
    }else{
      this.$element.hide(_this.options.hideDelay, function(){
        if(_this.options.overlay){
          _this.$overlay.hide(0, function(){
          });
        }
      });
    }
    //conditionals to remove extra event listeners added on open
    if(this.options.closeOnEsc){
      $(window).off('keydown.zf.reveal');
    }
    if(!this.options.overlay && this.options.closeOnClick){
      $('body').off('click.zf.reveal');
    }
    this.$element.off('keydown.zf.reveal');

    //if the modal changed size, reset it
    if(this.changedSize){
      this.$element.css({
        'height': '',
        'width': ''
      });
    }

    $('body').removeClass('is-reveal-open').attr({'aria-hidden': false, 'tabindex': ''});

    /**
    * Resets the modal content
    * This prevents a running video to keep going in the background
    */
    if(this.options.resetOnClose) {
      this.$element.html(this.$element.html());
    }

    this.isActive = false;
    this.$element.attr({'aria-hidden': true})
    /**
     * Fires when the modal is done closing.
     * @event Reveal#closed
     */
                 .trigger('closed.zf.reveal');
  };
  /**
   * Toggles the open/closed state of a modal.
   * @function
   */
  Reveal.prototype.toggle = function(){
    if(this.isActive){
      this.close();
    }else{
      this.open();
    }
  };

  /**
   * Destroys an instance of a modal.
   * @function
   */
  Reveal.prototype.destroy = function() {
    if(this.options.overlay){
      this.$overlay.hide().off().remove();
    }
    this.$element.hide();
    this.$anchor.off();

    Foundation.unregisterPlugin(this);
  };

  Foundation.plugin(Reveal, 'Reveal');

  // Exports for AMD/Browserify
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Reveal;
  if (typeof define === 'function')
    define(['foundation'], function() {
      return Reveal;
    });

}(Foundation, jQuery);

/**
 * Slider module.
 * @module foundation.slider
 * @requires foundation.util.motion
 * @requires foundation.util.triggers
 * @requires foundation.util.keyboard
 * @requires foundation.util.touch
 */
!function($, Foundation){
  'use strict';

  /**
   * Creates a new instance of a drilldown menu.
   * @class
   * @param {jQuery} element - jQuery object to make into an accordion menu.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function Slider(element, options){
    this.$element = element;
    this.options = $.extend({}, Slider.defaults, this.$element.data(), options);

    this._init();

    Foundation.registerPlugin(this);
    Foundation.Keyboard.register('Slider', {
      'ltr': {
        'ARROW_RIGHT': 'increase',
        'ARROW_UP': 'increase',
        'ARROW_DOWN': 'decrease',
        'ARROW_LEFT': 'decrease',
        'SHIFT_ARROW_RIGHT': 'increase_fast',
        'SHIFT_ARROW_UP': 'increase_fast',
        'SHIFT_ARROW_DOWN': 'decrease_fast',
        'SHIFT_ARROW_LEFT': 'decrease_fast'
      },
      'rtl': {
        'ARROW_LEFT': 'increase',
        'ARROW_RIGHT': 'decrease',
        'SHIFT_ARROW_LEFT': 'increase_fast',
        'SHIFT_ARROW_RIGHT': 'decrease_fast'
      }
    });
  }

  Slider.defaults = {
    /**
     * Minimum value for the slider scale.
     * @option
     * @example 0
     */
    start: 0,
    /**
     * Maximum value for the slider scale.
     * @option
     * @example 100
     */
    end: 100,
    /**
     * Minimum value change per change event. Not Currently Implemented!

     */
    step: 1,
    /**
     * Value at which the handle/input *(left handle/first input)* should be set to on initialization.
     * @option
     * @example 0
     */
    initialStart: 0,
    /**
     * Value at which the right handle/second input should be set to on initialization.
     * @option
     * @example 100
     */
    initialEnd: 100,
    /**
     * Allows the input to be located outside the container and visible. Set to by the JS
     * @option
     * @example false
     */
    binding: false,
    /**
     * Allows the user to click/tap on the slider bar to select a value.
     * @option
     * @example true
     */
    clickSelect: true,
    /**
     * Set to true and use the `vertical` class to change alignment to vertical.
     * @option
     * @example false
     */
    vertical: false,
    /**
     * Allows the user to drag the slider handle(s) to select a value.
     * @option
     * @example true
     */
    draggable: true,
    /**
     * Disables the slider and prevents event listeners from being applied. Double checked by JS with `disabledClass`.
     * @option
     * @example false
     */
    disabled: false,
    /**
     * Allows the use of two handles. Double checked by the JS. Changes some logic handling.
     * @option
     * @example false
     */
    doubleSided: false,
    /**
     * Potential future feature.
     */
    // steps: 100,
    /**
     * Number of decimal places the plugin should go to for floating point precision.
     * @option
     * @example 2
     */
    decimal: 2,
    /**
     * Time delay for dragged elements.
     */
    // dragDelay: 0,
    /**
     * Time, in ms, to animate the movement of a slider handle if user clicks/taps on the bar. Needs to be manually set if updating the transition time in the Sass settings.
     * @option
     * @example 200
     */
    moveTime: 200,//update this if changing the transition time in the sass
    /**
     * Class applied to disabled sliders.
     * @option
     * @example 'disabled'
     */
    disabledClass: 'disabled'
  };
  /**
   * Initilizes the plugin by reading/setting attributes, creating collections and setting the initial position of the handle(s).
   * @function
   * @private
   */
  Slider.prototype._init = function(){
    this.inputs = this.$element.find('input');
    this.handles = this.$element.find('[data-slider-handle]');

    this.$handle = this.handles.eq(0);
    this.$input = this.inputs.length ? this.inputs.eq(0) : $('#' + this.$handle.attr('aria-controls'));
    this.$fill = this.$element.find('[data-slider-fill]').css(this.options.vertical ? 'height' : 'width', 0);

    var isDbl = false,
        _this = this;
    if(this.options.disabled || this.$element.hasClass(this.options.disabledClass)){
      this.options.disabled = true;
      this.$element.addClass(this.options.disabledClass);
    }
    if(!this.inputs.length){
      this.inputs = $().add(this.$input);
      this.options.binding = true;
    }
    this._setInitAttr(0);
    this._events(this.$handle);

    if(this.handles[1]){
      this.options.doubleSided = true;
      this.$handle2 = this.handles.eq(1);
      this.$input2 = this.inputs.length ? this.inputs.eq(1) : $('#' + this.$handle2.attr('aria-controls'));

      if(!this.inputs[1]){
        this.inputs = this.inputs.add(this.$input2);
      }
      isDbl = true;

      this._setHandlePos(this.$handle, this.options.initialStart, true, function(){

        _this._setHandlePos(_this.$handle2, _this.options.initialEnd);
      });
      // this.$handle.triggerHandler('click.zf.slider');
      this._setInitAttr(1);
      this._events(this.$handle2);
    }

    if(!isDbl){
      this._setHandlePos(this.$handle, this.options.initialStart, true);
    }
  };
  /**
   * Sets the position of the selected handle and fill bar.
   * @function
   * @private
   * @param {jQuery} $hndl - the selected handle to move.
   * @param {Number} location - floating point between the start and end values of the slider bar.
   * @param {Function} cb - callback function to fire on completion.
   * @fires Slider#moved
   */
  Slider.prototype._setHandlePos = function($hndl, location, noInvert, cb){
  //might need to alter that slightly for bars that will have odd number selections.
    location = parseFloat(location);//on input change events, convert string to number...grumble.
    // prevent slider from running out of bounds
    if(location < this.options.start){ location = this.options.start; }
    else if(location > this.options.end){ location = this.options.end; }

    var isDbl = this.options.doubleSided,
        callback = cb || null;

    if(isDbl){
      if(this.handles.index($hndl) === 0){
        var h2Val = parseFloat(this.$handle2.attr('aria-valuenow'));
        location = location >= h2Val ? h2Val - this.options.step : location;
      }else{
        var h1Val = parseFloat(this.$handle.attr('aria-valuenow'));
        location = location <= h1Val ? h1Val + this.options.step : location;
      }
    }

    if(this.options.vertical && !noInvert){
      location = this.options.end - location;
    }
    var _this = this,
        vert = this.options.vertical,
        hOrW = vert ? 'height' : 'width',
        lOrT = vert ? 'top' : 'left',
        halfOfHandle = $hndl[0].getBoundingClientRect()[hOrW] / 2,
        elemDim = this.$element[0].getBoundingClientRect()[hOrW],
        pctOfBar = percent(location, this.options.end).toFixed(2),
        pxToMove = (elemDim - halfOfHandle) * pctOfBar,
        movement = (percent(pxToMove, elemDim) * 100).toFixed(this.options.decimal),
        location = location > 0 ? parseFloat(location.toFixed(this.options.decimal)) : 0,
        anim, prog, start = null, css = {};

    this._setValues($hndl, location);

    if(this.options.doubleSided){//update to calculate based on values set to respective inputs??
      var isLeftHndl = this.handles.index($hndl) === 0,
          dim,
          idx = this.handles.index($hndl);

      if(isLeftHndl){
        css[lOrT] = (pctOfBar > 0 ? pctOfBar * 100 : 0) + '%';//
        dim = /*Math.abs*/((percent(this.$handle2.position()[lOrT] + halfOfHandle, elemDim) - parseFloat(pctOfBar)) * 100).toFixed(this.options.decimal) + '%';
        css['min-' + hOrW] = dim;
        if(cb && typeof cb === 'function'){ cb(); }
      }else{
        var handleLeft = parseFloat(this.$handle[0].style.left);
        location = (location < 100 ? location : 100) - (!isNaN(handleLeft) ? handleLeft : this.options.end - location);
        css['min-' + hOrW] = location + '%';
      }
    }

    this.$element.one('finished.zf.animate', function(){
                    _this.animComplete = true;
                    /**
                     * Fires when the handle is done moving.
                     * @event Slider#moved
                     */
                    _this.$element.trigger('moved.zf.slider', [$hndl]);
                });
    var moveTime = _this.$element.data('dragging') ? 1000/60 : _this.options.moveTime;
    /*var move = new */Foundation.Move(moveTime, $hndl, function(){
      $hndl.css(lOrT, movement + '%');
      if(!_this.options.doubleSided){
        _this.$fill.css(hOrW, pctOfBar * 100 + '%');
      }else{
        _this.$fill.css(css);
      }
    });
    // move.do();
  };
  /**
   * Sets the initial attribute for the slider element.
   * @function
   * @private
   * @param {Number} idx - index of the current handle/input to use.
   */
  Slider.prototype._setInitAttr = function(idx){
    var id = this.inputs.eq(idx).attr('id') || Foundation.GetYoDigits(6, 'slider');
    this.inputs.eq(idx).attr({
      'id': id,
      'max': this.options.end,
      'min': this.options.start

    });
    this.handles.eq(idx).attr({
      'role': 'slider',
      'aria-controls': id,
      'aria-valuemax': this.options.end,
      'aria-valuemin': this.options.start,
      'aria-valuenow': idx === 0 ? this.options.initialStart : this.options.initialEnd,
      'aria-orientation': this.options.vertical ? 'vertical' : 'horizontal',
      'tabindex': 0
    });
  };
  /**
   * Sets the input and `aria-valuenow` values for the slider element.
   * @function
   * @private
   * @param {jQuery} $handle - the currently selected handle.
   * @param {Number} val - floating point of the new value.
   */
  Slider.prototype._setValues = function($handle, val){
    var idx = this.options.doubleSided ? this.handles.index($handle) : 0;
    this.inputs.eq(idx).val(val);
    $handle.attr('aria-valuenow', val);
  };
  /**
   * Handles events on the slider element.
   * Calculates the new location of the current handle.
   * If there are two handles and the bar was clicked, it determines which handle to move.
   * @function
   * @private
   * @param {Object} e - the `event` object passed from the listener.
   * @param {jQuery} $handle - the current handle to calculate for, if selected.
   * @param {Number} val - floating point number for the new value of the slider.
   */
  Slider.prototype._handleEvent = function(e, $handle, val){
    var value, hasVal;
    if(!val){//click or drag events
      e.preventDefault();
      var _this = this,
          vertical = this.options.vertical,
          param = vertical ? 'height' : 'width',
          direction = vertical ? 'top' : 'left',
          pageXY = vertical ? e.pageY : e.pageX,
          halfOfHandle = this.$handle[0].getBoundingClientRect()[param] / 2,
          barDim = this.$element[0].getBoundingClientRect()[param],
          barOffset = (this.$element.offset()[direction] -  pageXY),
          barXY = barOffset > 0 ? -halfOfHandle : (barOffset - halfOfHandle) < -barDim ? barDim : Math.abs(barOffset),//if the cursor position is less than or greater than the elements bounding coordinates, set coordinates within those bounds
          // eleDim = this.$element[0].getBoundingClientRect()[param],
          offsetPct = percent(barXY, barDim);
      value = (this.options.end - this.options.start) * offsetPct;
      hasVal = false;

      if(!$handle){//figure out which handle it is, pass it to the next function.
        var firstHndlPos = absPosition(this.$handle, direction, barXY, param),
            secndHndlPos = absPosition(this.$handle2, direction, barXY, param);
            $handle = firstHndlPos <= secndHndlPos ? this.$handle : this.$handle2;
      }

    }else{//change event on input
      value = val;
      hasVal = true;
    }

    this._setHandlePos($handle, value, hasVal);
  };
  /**
   * Adds event listeners to the slider elements.
   * @function
   * @private
   * @param {jQuery} $handle - the current handle to apply listeners to.
   */
  Slider.prototype._events = function($handle){
    if(this.options.disabled){ return false; }

    var _this = this,
        curHandle,
        timer;

      this.inputs.off('change.zf.slider').on('change.zf.slider', function(e){
        var idx = _this.inputs.index($(this));
        _this._handleEvent(e, _this.handles.eq(idx), $(this).val());
      });

    if(this.options.clickSelect){
      this.$element.off('click.zf.slider').on('click.zf.slider', function(e){
        if(_this.$element.data('dragging')){ return false; }
        _this.animComplete = false;
        if(_this.options.doubleSided){
          _this._handleEvent(e);
        }else{
          _this._handleEvent(e, _this.$handle);
        }
      });
    }

    if(this.options.draggable){
      this.handles.addTouch();
      // var curHandle,
      //     timer,
      var $body = $('body');
      $handle
        .off('mousedown.zf.slider')
        .on('mousedown.zf.slider', function(e){
          $handle.addClass('is-dragging');
          _this.$fill.addClass('is-dragging');//
          _this.$element.data('dragging', true);
          _this.animComplete = false;
          curHandle = $(e.currentTarget);

          $body.on('mousemove.zf.slider', function(e){
            e.preventDefault();

            // timer = setTimeout(function(){
            _this._handleEvent(e, curHandle);
            // }, _this.options.dragDelay);
          }).on('mouseup.zf.slider', function(e){
            // clearTimeout(timer);
            _this.animComplete = true;
            _this._handleEvent(e, curHandle);
            $handle.removeClass('is-dragging');
            _this.$fill.removeClass('is-dragging');
            _this.$element.data('dragging', false);
            // Foundation.reflow(_this.$element, 'slider');
            $body.off('mousemove.zf.slider mouseup.zf.slider');
          });
      });
    }
    $handle.off('keydown.zf.slider').on('keydown.zf.slider', function(e){
      var idx = _this.options.doubleSided ? _this.handles.index($(this)) : 0,
        oldValue = parseFloat(_this.inputs.eq(idx).val()),
        newValue;

      var _$handle = $(this);

      // handle keyboard event with keyboard util
      Foundation.Keyboard.handleKey(e, _this, {
        decrease: function() {
          newValue = oldValue - _this.options.step;
        },
        increase: function() {
          newValue = oldValue + _this.options.step;
        },
        decrease_fast: function() {
          newValue = oldValue - _this.options.step * 10;
        },
        increase_fast: function() {
          newValue = oldValue + _this.options.step * 10;
        },
        handled: function() { // only set handle pos when event was handled specially
          e.preventDefault();
          _this._setHandlePos(_$handle, newValue, true);
        }
      });
      /*if (newValue) { // if pressed key has special function, update value
        e.preventDefault();
        _this._setHandlePos(_$handle, newValue);
      }*/
    });
  };
  /**
   * Destroys the slider plugin.
   */
   Slider.prototype.destroy = function(){
     this.handles.off('.zf.slider');
     this.inputs.off('.zf.slider');
     this.$element.off('.zf.slider');

     Foundation.unregisterPlugin(this);
   };

  Foundation.plugin(Slider, 'Slider');

  function percent(frac, num){
    return (frac / num);
  }
  function absPosition($handle, dir, clickPos, param){
    return Math.abs(($handle.position()[dir] + ($handle[param]() / 2)) - clickPos);
  }
}(jQuery, window.Foundation);

//*********this is in case we go to static, absolute positions instead of dynamic positioning********
// this.setSteps(function(){
//   _this._events();
//   var initStart = _this.options.positions[_this.options.initialStart - 1] || null;
//   var initEnd = _this.options.initialEnd ? _this.options.position[_this.options.initialEnd - 1] : null;
//   if(initStart || initEnd){
//     _this._handleEvent(initStart, initEnd);
//   }
// });

//***********the other part of absolute positions*************
// Slider.prototype.setSteps = function(cb){
//   var posChange = this.$element.outerWidth() / this.options.steps;
//   var counter = 0
//   while(counter < this.options.steps){
//     if(counter){
//       this.options.positions.push(this.options.positions[counter - 1] + posChange);
//     }else{
//       this.options.positions.push(posChange);
//     }
//     counter++;
//   }
//   cb();
// };

/**
 * Sticky module.
 * @module foundation.sticky
 * @requires foundation.util.triggers
 * @requires foundation.util.mediaQuery
 */
!function($, Foundation){
  'use strict';

  /**
   * Creates a new instance of a sticky thing.
   * @class
   * @param {jQuery} element - jQuery object to make sticky.
   * @param {Object} options - options object passed when creating the element programmatically.
   */
  function Sticky(element, options){
    this.$element = element;
    this.options = $.extend({}, Sticky.defaults, this.$element.data(), options);

    this._init();

    Foundation.registerPlugin(this);
  }
  Sticky.defaults = {
    /**
     * Customizable container template. Add your own classes for styling and sizing.
     * @option
     * @example '<div data-sticky-container class="small-6 columns"></div>'
     */
    container: '<div data-sticky-container></div>',
    /**
     * Location in the view the element sticks to.
     * @option
     * @example 'top'
     */
    stickTo: 'top',
    /**
     * If anchored to a single element, the id of that element.
     * @option
     * @example 'exampleId'
     */
    anchor: '',
    /**
     * If using more than one element as anchor points, the id of the top anchor.
     * @option
     * @example 'exampleId:top'
     */
    topAnchor: '',
    /**
     * If using more than one element as anchor points, the id of the bottom anchor.
     * @option
     * @example 'exampleId:bottom'
     */
    btmAnchor: '',
    /**
     * Margin, in `em`'s to apply to the top of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginTop: 1,
    /**
     * Margin, in `em`'s to apply to the bottom of the element when it becomes sticky.
     * @option
     * @example 1
     */
    marginBottom: 1,
    /**
     * Breakpoint string that is the minimum screen size an element should become sticky.
     * @option
     * @example 'medium'
     */
    stickyOn: 'medium',
    /**
     * Class applied to sticky element, and removed on destruction. Foundation defaults to `sticky`.
     * @option
     * @example 'sticky'
     */
    stickyClass: 'sticky',
    /**
     * Class applied to sticky container. Foundation defaults to `sticky-container`.
     * @option
     * @example 'sticky-container'
     */
    containerClass: 'sticky-container',
    /**
     * Number of scroll events between the plugin's recalculating sticky points. Setting it to `0` will cause it to recalc every scroll event, setting it to `-1` will prevent recalc on scroll.
     * @option
     * @example 50
     */
    checkEvery: -1
  };

  /**
   * Initializes the sticky element by adding classes, getting/setting dimensions, breakpoints and attributes
   * Also triggered by Foundation._reflow
   * @function
   * @private
   */
  Sticky.prototype._init = function(){
    var $parent = this.$element.parent('[data-sticky-container]'),
        id = this.$element[0].id || Foundation.GetYoDigits(6, 'sticky'),
        _this = this;

    if(!$parent.length){
      this.wasWrapped = true;
    }
    this.$container = $parent.length ? $parent : $(this.options.container).wrapInner(this.$element);
    this.$container.addClass(this.options.containerClass);


    this.$element.addClass(this.options.stickyClass)
                 .attr({'data-resize': id});

    this.scrollCount = this.options.checkEvery;
    this.isStuck = false;
    // console.log(this.options.anchor, this.options.topAnchor);
    if(this.options.topAnchor !== ''){
      this._parsePoints();
      // console.log(this.points[0]);
    }else{
      this.$anchor = this.options.anchor ? $('#' + this.options.anchor) : $(document.body);
    }


    this._setSizes(function(){
      _this._calc(false);
    });
    this._events(id.split('-').reverse().join('-'));
  };
  /**
   * If using multiple elements as anchors, calculates the top and bottom pixel values the sticky thing should stick and unstick on.
   * @function
   * @private
   */
  Sticky.prototype._parsePoints = function(){
    var top = this.options.topAnchor,
        btm = this.options.btmAnchor,
        pts = [top, btm],
        breaks = {};
    for(var i = 0, len = pts.length; i < len && pts[i]; i++){
      var pt;
      if(typeof pts[i] === 'number'){
        pt = pts[i];
      }else{
        var place = pts[i].split(':'),
            anchor = $('#' + place[0]);

        pt = anchor.offset().top;
        if(place[1] && place[1].toLowerCase() === 'bottom'){
          pt += anchor[0].getBoundingClientRect().height;
        }
      }
      breaks[i] = pt;
    }
      // console.log(breaks);
    this.points = breaks;
    return;
  };

  /**
   * Adds event handlers for the scrolling element.
   * @private
   * @param {String} id - psuedo-random id for unique scroll event listener.
   */
  Sticky.prototype._events = function(id){
    // console.log('called');
    var _this = this,
        scrollListener = 'scroll.zf.' + id;
    if(this.isOn){ return; }
    if(this.canStick){
      this.isOn = true;
      // this.$anchor.off('change.zf.sticky')
      //             .on('change.zf.sticky', function(){
      //               _this._setSizes(function(){
      //                 _this._calc(false);
      //               });
      //             });

      $(window).off(scrollListener)
               .on(scrollListener, function(e){
                 if(_this.scrollCount === 0){
                   _this.scrollCount = _this.options.checkEvery;
                   _this._setSizes(function(){
                     _this._calc(false, window.pageYOffset);
                   });
                 }else{
                   _this.scrollCount--;
                   _this._calc(false, window.pageYOffset);
                 }
              });
    }

    this.$element.off('resizeme.zf.trigger')
                 .on('resizeme.zf.trigger', function(e, el){
                     _this._setSizes(function(){
                       _this._calc(false);
                       if(_this.canStick){
                         if(!_this.isOn){
                           _this._events(id);
                         }
                       }else if(_this.isOn){
                         _this._pauseListeners(scrollListener);
                       }
                     });
    });
  };

  /**
   * Removes event handlers for scroll and change events on anchor.
   * @fires Sticky#pause
   * @param {String} scrollListener - unique, namespaced scroll listener attached to `window`
   */
  Sticky.prototype._pauseListeners = function(scrollListener){
    this.isOn = false;
    // this.$anchor.off('change.zf.sticky');
    $(window).off(scrollListener);

    /**
     * Fires when the plugin is paused due to resize event shrinking the view.
     * @event Sticky#pause
     * @private
     */
     this.$element.trigger('pause.zf.sticky');
  };

  /**
   * Called on every `scroll` event and on `_init`
   * fires functions based on booleans and cached values
   * @param {Boolean} checkSizes - true if plugin should recalculate sizes and breakpoints.
   * @param {Number} scroll - current scroll position passed from scroll event cb function. If not passed, defaults to `window.pageYOffset`.
   */
  Sticky.prototype._calc = function(checkSizes, scroll){
    if(checkSizes){ this._setSizes(); }

    if(!this.canStick){
      if(this.isStuck){
        this._removeSticky(true);
      }
      return false;
    }

    if(!scroll){ scroll = window.pageYOffset; }

    if(scroll >= this.topPoint){
      if(scroll <= this.bottomPoint){
        if(!this.isStuck){
          this._setSticky();
        }
      }else{
        if(this.isStuck){
          this._removeSticky(false);
        }
      }
    }else{
      if(this.isStuck){
        this._removeSticky(true);
      }
    }
  };
  /**
   * Causes the $element to become stuck.
   * Adds `position: fixed;`, and helper classes.
   * @fires Sticky#stuckto
   * @function
   * @private
   */
  Sticky.prototype._setSticky = function(){
    var stickTo = this.options.stickTo,
        mrgn = stickTo === 'top' ? 'marginTop' : 'marginBottom',
        notStuckTo = stickTo === 'top' ? 'bottom' : 'top',
        css = {};

    css[mrgn] = this.options[mrgn] + 'em';
    css[stickTo] = 0;
    css[notStuckTo] = 'auto';
    css['left'] = this.$container.offset().left + parseInt(window.getComputedStyle(this.$container[0])["padding-left"], 10);
    this.isStuck = true;
    this.$element.removeClass('is-anchored is-at-' + notStuckTo)
                 .addClass('is-stuck is-at-' + stickTo)
                 .css(css)
                 /**
                  * Fires when the $element has become `position: fixed;`
                  * Namespaced to `top` or `bottom`.
                  * @event Sticky#stuckto
                  */
                 .trigger('sticky.zf.stuckto:' + stickTo);
  };

  /**
   * Causes the $element to become unstuck.
   * Removes `position: fixed;`, and helper classes.
   * Adds other helper classes.
   * @param {Boolean} isTop - tells the function if the $element should anchor to the top or bottom of its $anchor element.
   * @fires Sticky#unstuckfrom
   * @private
   */
  Sticky.prototype._removeSticky = function(isTop){
    var stickTo = this.options.stickTo,
        stickToTop = stickTo === 'top',
        css = {},
        anchorPt = (this.points ? this.points[1] - this.points[0] : this.anchorHeight) - this.elemHeight,
        mrgn = stickToTop ? 'marginTop' : 'marginBottom',
        notStuckTo = stickToTop ? 'bottom' : 'top',
        topOrBottom = isTop ? 'top' : 'bottom';

    css[mrgn] = 0;

    if((isTop && !stickToTop) || (stickToTop && !isTop)){
      css[stickTo] = anchorPt;
      css[notStuckTo] = 0;
    }else{
      css[stickTo] = 0;
      css[notStuckTo] = anchorPt;
    }
    
    css['left'] = '';
    this.isStuck = false;
    this.$element.removeClass('is-stuck is-at-' + stickTo)
                 .addClass('is-anchored is-at-' + topOrBottom)
                 .css(css)
                 /**
                  * Fires when the $element has become anchored.
                  * Namespaced to `top` or `bottom`.
                  * @event Sticky#unstuckfrom
                  */
                 .trigger('sticky.zf.unstuckfrom:' + topOrBottom);
  };

  /**
   * Sets the $element and $container sizes for plugin.
   * Calls `_setBreakPoints`.
   * @param {Function} cb - optional callback function to fire on completion of `_setBreakPoints`.
   * @private
   */
  Sticky.prototype._setSizes = function(cb){
    this.canStick = Foundation.MediaQuery.atLeast(this.options.stickyOn);
    if(!this.canStick){ cb(); }
    var _this = this,
        newElemWidth = this.$container[0].getBoundingClientRect().width,
        comp = window.getComputedStyle(this.$container[0]),
        pdng = parseInt(comp['padding-right'], 10);

    // console.log(this.$anchor);
    if(this.$anchor && this.$anchor.length){
      this.anchorHeight = this.$anchor[0].getBoundingClientRect().height;
    }else{
      this._parsePoints();
    }

    this.$element.css({
      'max-width': newElemWidth - pdng + 'px'
    });

    var newContainerHeight = this.$element[0].getBoundingClientRect().height || this.containerHeight;
    this.containerHeight = newContainerHeight;
    this.$container.css({
      height: newContainerHeight
    });
    this.elemHeight = newContainerHeight;

  	if (this.isStuck) {
  		this.$element.css({"left":this.$container.offset().left + parseInt(comp['padding-left'], 10)});
  	}

    this._setBreakPoints(newContainerHeight, function(){
      if(cb){ cb(); }
    });

  };
  /**
   * Sets the upper and lower breakpoints for the element to become sticky/unsticky.
   * @param {Number} elemHeight - px value for sticky.$element height, calculated by `_setSizes`.
   * @param {Function} cb - optional callback function to be called on completion.
   * @private
   */
  Sticky.prototype._setBreakPoints = function(elemHeight, cb){
    if(!this.canStick){
      if(cb){ cb(); }
      else{ return false; }
    }
    var mTop = emCalc(this.options.marginTop),
        mBtm = emCalc(this.options.marginBottom),
        topPoint = this.points ? this.points[0] : this.$anchor.offset().top,
        bottomPoint = this.points ? this.points[1] : topPoint + this.anchorHeight,
        // topPoint = this.$anchor.offset().top || this.points[0],
        // bottomPoint = topPoint + this.anchorHeight || this.points[1],
        winHeight = window.innerHeight;

    if(this.options.stickTo === 'top'){
      topPoint -= mTop;
      bottomPoint -= (elemHeight + mTop);
    }else if(this.options.stickTo === 'bottom'){
      topPoint -= (winHeight - (elemHeight + mBtm));
      bottomPoint -= (winHeight - mBtm);
    }else{
      //this would be the stickTo: both option... tricky
    }

    this.topPoint = topPoint;
    this.bottomPoint = bottomPoint;

    if(cb){ cb(); }
  };

  /**
   * Destroys the current sticky element.
   * Resets the element to the top position first.
   * Removes event listeners, JS-added css properties and classes, and unwraps the $element if the JS added the $container.
   * @function
   */
  Sticky.prototype.destroy = function(){
    this._removeSticky(true);

    this.$element.removeClass(this.options.stickyClass + ' is-anchored is-at-top')
                 .css({
                   height: '',
                   top: '',
                   bottom: '',
                   'max-width': ''
                 })
                 .off('resizeme.zf.trigger');

    this.$anchor.off('change.zf.sticky');
    $(window).off('scroll.zf.sticky');

    if(this.wasWrapped){
      this.$element.unwrap();
    }else{
      this.$container.removeClass(this.options.containerClass)
                     .css({
                       height: ''
                     });
    }
    Foundation.unregisterPlugin(this);
  };
  /**
   * Helper function to calculate em values
   * @param Number {em} - number of em's to calculate into pixels
   */
  function emCalc(em){
    return parseInt(window.getComputedStyle(document.body, null).fontSize, 10) * em;
  }
  Foundation.plugin(Sticky, 'Sticky');
}(jQuery, window.Foundation);

/**
 * Tabs module.
 * @module foundation.tabs
 * @requires foundation.util.keyboard
 * @requires foundation.util.timerAndImageLoader if tabs contain images
 */
!function($, Foundation) {
  'use strict';

  /**
   * Creates a new instance of tabs.
   * @class
   * @fires Tabs#init
   * @param {jQuery} element - jQuery object to make into tabs.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function Tabs(element, options){
    this.$element = element;
    this.options = $.extend({}, Tabs.defaults, this.$element.data(), options);

    this._init();
    Foundation.registerPlugin(this);
    Foundation.Keyboard.register('Tabs', {
      'ENTER': 'open',
      'SPACE': 'open',
      'ARROW_RIGHT': 'next',
      'ARROW_UP': 'previous',
      'ARROW_DOWN': 'next',
      'ARROW_LEFT': 'previous'
      // 'TAB': 'next',
      // 'SHIFT_TAB': 'previous'
    });
  }

  Tabs.defaults = {
    // /**
    //  * Allows the JS to alter the url of the window. Not yet implemented.
    //  */
    // deepLinking: false,
    // /**
    //  * If deepLinking is enabled, allows the window to scroll to content if window is loaded with a hash including a tab-pane id
    //  */
    // scrollToContent: false,
    /**
     * Allows the window to scroll to content of active pane on load if set to true.
     * @option
     * @example false
     */
    autoFocus: false,
    /**
     * Allows keyboard input to 'wrap' around the tab links.
     * @option
     * @example true
     */
    wrapOnKeys: true,
    /**
     * Allows the tab content panes to match heights if set to true.
     * @option
     * @example false
     */
    matchHeight: false,
    /**
     * Class applied to `li`'s in tab link list.
     * @option
     * @example 'tabs-title'
     */
    linkClass: 'tabs-title',
    // contentClass: 'tabs-content',
    /**
     * Class applied to the content containers.
     * @option
     * @example 'tabs-panel'
     */
    panelClass: 'tabs-panel'
  };

  /**
   * Initializes the tabs by showing and focusing (if autoFocus=true) the preset active tab.
   * @private
   */
  Tabs.prototype._init = function(){
    var _this = this;

    this.$tabTitles = this.$element.find('.' + this.options.linkClass);
    this.$tabContent = $('[data-tabs-content="' + this.$element[0].id + '"]');

    this.$tabTitles.each(function(){
      var $elem = $(this),
          $link = $elem.find('a'),
          isActive = $elem.hasClass('is-active'),
          hash = $link.attr('href').slice(1),
          linkId = hash + '-label',
          $tabContent = $(hash);

      $elem.attr({'role': 'presentation'});

      $link.attr({
        'role': 'tab',
        'aria-controls': hash,
        'aria-selected': isActive,
        'id': linkId
      });

      $tabContent.attr({
        'role': 'tabpanel',
        'aria-hidden': !isActive,
        'aria-labelledby': linkId
      });

      if(isActive && _this.options.autoFocus){
        $link.focus();
      }
    });
    if(this.options.matchHeight){
      var $images = this.$tabContent.find('img');
      if($images.length){
        Foundation.onImagesLoaded($images, this._setHeight.bind(this));
      }else{
        this._setHeight();
      }
    }
    this._events();
  };
  /**
   * Adds event handlers for items within the tabs.
   * @private
   */
   Tabs.prototype._events = function(){
    this._addKeyHandler();
    this._addClickHandler();
    if(this.options.matchHeight){
      $(window).on('changed.zf.mediaquery', this._setHeight.bind(this));
    }
  };

  /**
   * Adds click handlers for items within the tabs.
   * @private
   */
  Tabs.prototype._addClickHandler = function(){
    var _this = this;
    this.$element.off('click.zf.tabs')
                   .on('click.zf.tabs', '.' + this.options.linkClass, function(e){
                     e.preventDefault();
                     e.stopPropagation();
                     if($(this).hasClass('is-active')){
                       return;
                     }
                     _this._handleTabChange($(this));
                   });
  };

  /**
   * Adds keyboard event handlers for items within the tabs.
   * @private
   */
  Tabs.prototype._addKeyHandler = function(){
    var _this = this;
    var $firstTab = _this.$element.find('li:first-of-type');
    var $lastTab = _this.$element.find('li:last-of-type');

    this.$tabTitles.off('keydown.zf.tabs').on('keydown.zf.tabs', function(e){
      if(e.which === 9) return;
      e.stopPropagation();
      e.preventDefault();

      var $element = $(this),
        $elements = $element.parent('ul').children('li'),
        $prevElement,
        $nextElement;

      $elements.each(function(i) {
        if ($(this).is($element)) {
          if (_this.options.wrapOnKeys) {
            $prevElement = i === 0 ? $elements.last() : $elements.eq(i-1);
            $nextElement = i === $elements.length -1 ? $elements.first() : $elements.eq(i+1);
          } else {
            $prevElement = $elements.eq(Math.max(0, i-1));
            $nextElement = $elements.eq(Math.min(i+1, $elements.length-1));
          }
          return;
        }
      });

      // handle keyboard event with keyboard util
      Foundation.Keyboard.handleKey(e, _this, {
        open: function() {
          $element.find('[role="tab"]').focus();
          _this._handleTabChange($element);
        },
        previous: function() {
          $prevElement.find('[role="tab"]').focus();
          _this._handleTabChange($prevElement);
        },
        next: function() {
          $nextElement.find('[role="tab"]').focus();
          _this._handleTabChange($nextElement);
        }
      });
    });
  };


  /**
   * Opens the tab `$targetContent` defined by `$target`.
   * @param {jQuery} $target - Tab to open.
   * @fires Tabs#change
   * @function
   */
  Tabs.prototype._handleTabChange = function($target){
    var $tabLink = $target.find('[role="tab"]'),
        hash = $tabLink.attr('href'),
        $targetContent = $(hash),

        $oldTab = this.$element.find('.' + this.options.linkClass + '.is-active')
                  .removeClass('is-active').find('[role="tab"]')
                  .attr({'aria-selected': 'false'}).attr('href');

    $($oldTab).removeClass('is-active').attr({'aria-hidden': 'true'});

    $target.addClass('is-active');

    $tabLink.attr({'aria-selected': 'true'});

    $targetContent
      .addClass('is-active')
      .attr({'aria-hidden': 'false'});

    /**
     * Fires when the plugin has successfully changed tabs.
     * @event Tabs#change
     */
    this.$element.trigger('change.zf.tabs', [$target]);
    // Foundation.reflow(this.$element, 'tabs');
  };

  /**
   * Public method for selecting a content pane to display.
   * @param {jQuery | String} elem - jQuery object or string of the id of the pane to display.
   * @function
   */
  Tabs.prototype.selectTab = function(elem){
    var idStr;
    if(typeof elem === 'object'){
      idStr = elem[0].id;
    }else{
      idStr = elem;
    }

    if(idStr.indexOf('#') < 0){
      idStr = '#' + idStr;
    }
    var $target = this.$tabTitles.find('[href="' + idStr + '"]').parent('.' + this.options.linkClass);

    this._handleTabChange($target);
  };
  /**
   * Sets the height of each panel to the height of the tallest panel.
   * If enabled in options, gets called on media query change.
   * If loading content via external source, can be called directly or with _reflow.
   * @function
   * @private
   */
  Tabs.prototype._setHeight = function(){
    var max = 0;
    this.$tabContent.find('.' + this.options.panelClass)
                    .css('height', '')
                    .each(function(){
                      var panel = $(this),
                          isActive = panel.hasClass('is-active');

                      if(!isActive){
                        panel.css({'visibility': 'hidden', 'display': 'block'});
                      }
                      var temp = this.getBoundingClientRect().height;

                      if(!isActive){
                        panel.css({'visibility': '', 'display': ''});
                      }

                      max = temp > max ? temp : max;
                    })
                    .css('height', max + 'px');
  };

  /**
   * Destroys an instance of an tabs.
   * @fires Tabs#destroyed
   */
  Tabs.prototype.destroy = function() {
    this.$element.find('.' + this.options.linkClass)
                 .off('.zf.tabs').hide().end()
                 .find('.' + this.options.panelClass)
                 .hide();
    if(this.options.matchHeight){
      $(window).off('changed.zf.mediaquery');
    }
    Foundation.unregisterPlugin(this);
  };

  Foundation.plugin(Tabs, 'Tabs');

  function checkClass($elem){
    return $elem.hasClass('is-active');
  }
}(jQuery, window.Foundation);

/**
 * Toggler module.
 * @module foundation.toggler
 * @requires foundation.util.motion
 */

!function(Foundation, $) {
  'use strict';

  /**
   * Creates a new instance of Toggler.
   * @class
   * @fires Toggler#init
   * @param {Object} element - jQuery object to add the trigger to.
   * @param {Object} options - Overrides to the default plugin settings.
   */
  function Toggler(element, options) {
    this.$element = element;
    this.options = $.extend({}, Toggler.defaults, element.data(), options);
    this.className = '';

    this._init();
    this._events();

    Foundation.registerPlugin(this);
  }

  Toggler.defaults = {
    /**
     * Tells the plugin if the element should animated when toggled.
     * @option
     * @example false
     */
    animate: false
  };

  /**
   * Initializes the Toggler plugin by parsing the toggle class from data-toggler, or animation classes from data-animate.
   * @function
   * @private
   */
  Toggler.prototype._init = function() {
    var input;
    // Parse animation classes if they were set
    if (this.options.animate) {
      input = this.options.animate.split(' ');

      this.animationIn = input[0];
      this.animationOut = input[1] || null;
    }
    // Otherwise, parse toggle class
    else {
      input = this.$element.data('toggler');
      // Allow for a . at the beginning of the string
      this.className = input[0] === '.' ? input.slice(1) : input;
    }

    // Add ARIA attributes to triggers
    var id = this.$element[0].id;
    $('[data-open="'+id+'"], [data-close="'+id+'"], [data-toggle="'+id+'"]')
      .attr('aria-controls', id);
    // If the target is hidden, add aria-hidden
    this.$element.attr('aria-expanded', this.$element.is(':hidden') ? false : true);
  };

  /**
   * Initializes events for the toggle trigger.
   * @function
   * @private
   */
  Toggler.prototype._events = function() {
    this.$element.off('toggle.zf.trigger').on('toggle.zf.trigger', this.toggle.bind(this));
  };

  /**
   * Toggles the target class on the target element. An event is fired from the original trigger depending on if the resultant state was "on" or "off".
   * @function
   * @fires Toggler#on
   * @fires Toggler#off
   */
  Toggler.prototype.toggle = function() {
    this[ this.options.animate ? '_toggleAnimate' : '_toggleClass']();
  };

  Toggler.prototype._toggleClass = function() {
    this.$element.toggleClass(this.className);

    var isOn = this.$element.hasClass(this.className);
    if (isOn) {
      /**
       * Fires if the target element has the class after a toggle.
       * @event Toggler#on
       */
      this.$element.trigger('on.zf.toggler');
    }
    else {
      /**
       * Fires if the target element does not have the class after a toggle.
       * @event Toggler#off
       */
      this.$element.trigger('off.zf.toggler');
    }

    this._updateARIA(isOn);
  };

  Toggler.prototype._toggleAnimate = function() {
    var _this = this;

    if (this.$element.is(':hidden')) {
      Foundation.Motion.animateIn(this.$element, this.animationIn, function() {
        this.trigger('on.zf.toggler');
        _this._updateARIA(true);
      });
    }
    else {
      Foundation.Motion.animateOut(this.$element, this.animationOut, function() {
        this.trigger('off.zf.toggler');
        _this._updateARIA(false);
      });
    }
  };

  Toggler.prototype._updateARIA = function(isOn) {
    this.$element.attr('aria-expanded', isOn ? true : false);
  };

  /**
   * Destroys the instance of Toggler on the element.
   * @function
   */
  Toggler.prototype.destroy= function() {
    this.$element.off('.zf.toggler');
    Foundation.unregisterPlugin(this);
  };

  Foundation.plugin(Toggler, 'Toggler');

  // Exports for AMD/Browserify
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
    module.exports = Toggler;
  if (typeof define === 'function')
    define(['foundation'], function() {
      return Toggler;
    });

}(Foundation, jQuery);

/**
 * Tooltip module.
 * @module foundation.tooltip
 * @requires foundation.util.box
 * @requires foundation.util.triggers
 */
!function($, document, Foundation){
  'use strict';

  /**
   * Creates a new instance of a Tooltip.
   * @class
   * @fires Tooltip#init
   * @param {jQuery} element - jQuery object to attach a tooltip to.
   * @param {Object} options - object to extend the default configuration.
   */
  function Tooltip(element, options){
    this.$element = element;
    this.options = $.extend({}, Tooltip.defaults, this.$element.data(), options);

    this.isActive = false;
    this.isClick = false;
    this._init();

    Foundation.registerPlugin(this);
  }

  Tooltip.defaults = {
    disableForTouch: false,
    /**
     * Time, in ms, before a tooltip should open on hover.
     * @option
     * @example 200
     */
    hoverDelay: 200,
    /**
     * Time, in ms, a tooltip should take to fade into view.
     * @option
     * @example 150
     */
    fadeInDuration: 150,
    /**
     * Time, in ms, a tooltip should take to fade out of view.
     * @option
     * @example 150
     */
    fadeOutDuration: 150,
    /**
     * Disables hover events from opening the tooltip if set to true
     * @option
     * @example false
     */
    disableHover: false,
    /**
     * Optional addtional classes to apply to the tooltip template on init.
     * @option
     * @example 'my-cool-tip-class'
     */
    templateClasses: '',
    /**
     * Non-optional class added to tooltip templates. Foundation default is 'tooltip'.
     * @option
     * @example 'tooltip'
     */
    tooltipClass: 'tooltip',
    /**
     * Class applied to the tooltip anchor element.
     * @option
     * @example 'has-tip'
     */
    triggerClass: 'has-tip',
    /**
     * Minimum breakpoint size at which to open the tooltip.
     * @option
     * @example 'small'
     */
    showOn: 'small',
    /**
     * Custom template to be used to generate markup for tooltip.
     * @option
     * @example '<div class="tooltip"></div>'
     */
    template: '',
    /**
     * Text displayed in the tooltip template on open.
     * @option
     * @example 'Some cool space fact here.'
     */
    tipText: '',
    touchCloseText: 'Tap to close.',
    /**
     * Allows the tooltip to remain open if triggered with a click or touch event.
     * @option
     * @example true
     */
    clickOpen: true,
    /**
     * Additional positioning classes, set by the JS
     * @option
     * @example 'top'
     */
    positionClass: '',
    /**
     * Distance, in pixels, the template should push away from the anchor on the Y axis.
     * @option
     * @example 10
     */
    vOffset: 10,
    /**
     * Distance, in pixels, the template should push away from the anchor on the X axis, if aligned to a side.
     * @option
     * @example 12
     */
    hOffset: 12
  };

  /**
   * Initializes the tooltip by setting the creating the tip element, adding it's text, setting private variables and setting attributes on the anchor.
   * @private
   */
  Tooltip.prototype._init = function(){
    var elemId = this.$element.attr('aria-describedby') || Foundation.GetYoDigits(6, 'tooltip');

    this.options.positionClass = this._getPositionClass(this.$element);
    this.options.tipText = this.options.tipText || this.$element.attr('title');
    this.template = this.options.template ? $(this.options.template) : this._buildTemplate(elemId);

    this.template.appendTo(document.body)
        .text(this.options.tipText)
        .hide();

    this.$element.attr({
      'title': '',
      'aria-describedby': elemId,
      'data-yeti-box': elemId,
      'data-toggle': elemId,
      'data-resize': elemId
    }).addClass(this.triggerClass);

    //helper variables to track movement on collisions
    this.usedPositions = [];
    this.counter = 4;
    this.classChanged = false;

    this._events();
  };

  /**
   * Grabs the current positioning class, if present, and returns the value or an empty string.
   * @private
   */
  Tooltip.prototype._getPositionClass = function(element){
    if(!element){ return ''; }
    // var position = element.attr('class').match(/top|left|right/g);
    var position = element[0].className.match(/(top|left|right)/g);
        position = position ? position[0] : '';
    return position;
  };
  /**
   * builds the tooltip element, adds attributes, and returns the template.
   * @private
   */
  Tooltip.prototype._buildTemplate = function(id){
    var templateClasses = (this.options.tooltipClass + ' ' + this.options.positionClass).trim();
    var $template =  $('<div></div>').addClass(templateClasses).attr({
      'role': 'tooltip',
      'aria-hidden': true,
      'data-is-active': false,
      'data-is-focus': false,
      'id': id
    });
    return $template;
  };

  /**
   * Function that gets called if a collision event is detected.
   * @param {String} position - positioning class to try
   * @private
   */
  Tooltip.prototype._reposition = function(position){
    this.usedPositions.push(position ? position : 'bottom');

    //default, try switching to opposite side
    if(!position && (this.usedPositions.indexOf('top') < 0)){
      this.template.addClass('top');
    }else if(position === 'top' && (this.usedPositions.indexOf('bottom') < 0)){
      this.template.removeClass(position);
    }else if(position === 'left' && (this.usedPositions.indexOf('right') < 0)){
      this.template.removeClass(position)
          .addClass('right');
    }else if(position === 'right' && (this.usedPositions.indexOf('left') < 0)){
      this.template.removeClass(position)
          .addClass('left');
    }

    //if default change didn't work, try bottom or left first
    else if(!position && (this.usedPositions.indexOf('top') > -1) && (this.usedPositions.indexOf('left') < 0)){
      this.template.addClass('left');
    }else if(position === 'top' && (this.usedPositions.indexOf('bottom') > -1) && (this.usedPositions.indexOf('left') < 0)){
      this.template.removeClass(position)
          .addClass('left');
    }else if(position === 'left' && (this.usedPositions.indexOf('right') > -1) && (this.usedPositions.indexOf('bottom') < 0)){
      this.template.removeClass(position);
    }else if(position === 'right' && (this.usedPositions.indexOf('left') > -1) && (this.usedPositions.indexOf('bottom') < 0)){
      this.template.removeClass(position);
    }
    //if nothing cleared, set to bottom
    else{
      this.template.removeClass(position);
    }
    this.classChanged = true;
    this.counter--;

  };

  /**
   * sets the position class of an element and recursively calls itself until there are no more possible positions to attempt, or the tooltip element is no longer colliding.
   * if the tooltip is larger than the screen width, default to full width - any user selected margin
   * @private
   */
  Tooltip.prototype._setPosition = function(){
    var position = this._getPositionClass(this.template),
        $tipDims = Foundation.Box.GetDimensions(this.template),
        $anchorDims = Foundation.Box.GetDimensions(this.$element),
        direction = (position === 'left' ? 'left' : ((position === 'right') ? 'left' : 'top')),
        param = (direction === 'top') ? 'height' : 'width',
        offset = (param === 'height') ? this.options.vOffset : this.options.hOffset,
        _this = this;

    if(($tipDims.width >= $tipDims.windowDims.width) || (!this.counter && !Foundation.Box.ImNotTouchingYou(this.template))){
      this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
      // this.$element.offset(Foundation.GetOffsets(this.template, this.$element, 'center bottom', this.options.vOffset, this.options.hOffset, true)).css({
        'width': $anchorDims.windowDims.width - (this.options.hOffset * 2),
        'height': 'auto'
      });
      return false;
    }

    this.template.offset(Foundation.Box.GetOffsets(this.template, this.$element,'center ' + (position || 'bottom'), this.options.vOffset, this.options.hOffset));

    while(!Foundation.Box.ImNotTouchingYou(this.template) && this.counter){
      this._reposition(position);
      this._setPosition();
    }
  };

  /**
   * reveals the tooltip, and fires an event to close any other open tooltips on the page
   * @fires Closeme#tooltip
   * @fires Tooltip#show
   * @function
   */
  Tooltip.prototype.show = function(){
    if(this.options.showOn !== 'all' && !Foundation.MediaQuery.atLeast(this.options.showOn)){
      // console.error('The screen is too small to display this tooltip');
      return false;
    }

    var _this = this;
    this.template.css('visibility', 'hidden').show();
    this._setPosition();

    /**
     * Fires to close all other open tooltips on the page
     * @event Closeme#tooltip
     */
    this.$element.trigger('closeme.zf.tooltip', this.template.attr('id'));


    this.template.attr({
      'data-is-active': true,
      'aria-hidden': false
    });
    _this.isActive = true;
    // console.log(this.template);
    this.template.stop().hide().css('visibility', '').fadeIn(this.options.fadeInDuration, function(){
      //maybe do stuff?
    });
    /**
     * Fires when the tooltip is shown
     * @event Tooltip#show
     */
    this.$element.trigger('show.zf.tooltip');
  };

  /**
   * Hides the current tooltip, and resets the positioning class if it was changed due to collision
   * @fires Tooltip#hide
   * @function
   */
  Tooltip.prototype.hide = function(){
    // console.log('hiding', this.$element.data('yeti-box'));
    var _this = this;
    this.template.stop().attr({
      'aria-hidden': true,
      'data-is-active': false
    }).fadeOut(this.options.fadeOutDuration, function(){
      _this.isActive = false;
      _this.isClick = false;
      if(_this.classChanged){
        _this.template
             .removeClass(_this._getPositionClass(_this.template))
             .addClass(_this.options.positionClass);

       _this.usedPositions = [];
       _this.counter = 4;
       _this.classChanged = false;
      }
    });
    /**
     * fires when the tooltip is hidden
     * @event Tooltip#hide
     */
    this.$element.trigger('hide.zf.tooltip');
  };

  /**
   * adds event listeners for the tooltip and its anchor
   * TODO combine some of the listeners like focus and mouseenter, etc.
   * @private
   */
  Tooltip.prototype._events = function(){
    var _this = this;
    var $template = this.template;
    var isFocus = false;

    if(!this.options.disableHover){

      this.$element
      .on('mouseenter.zf.tooltip', function(e){
        if(!_this.isActive){
          _this.timeout = setTimeout(function(){
            _this.show();
          }, _this.options.hoverDelay);
        }
      })
      .on('mouseleave.zf.tooltip', function(e){
        clearTimeout(_this.timeout);
        if(!isFocus || (!_this.isClick && _this.options.clickOpen)){
          _this.hide();
        }
      });
    }
    if(this.options.clickOpen){
      this.$element.on('mousedown.zf.tooltip', function(e){
        e.stopImmediatePropagation();
        if(_this.isClick){
          _this.hide();
          // _this.isClick = false;
        }else{
          _this.isClick = true;
          if((_this.options.disableHover || !_this.$element.attr('tabindex')) && !_this.isActive){
            _this.show();
          }
        }
      });
    }

    if(!this.options.disableForTouch){
      this.$element
      .on('tap.zf.tooltip touchend.zf.tooltip', function(e){
        _this.isActive ? _this.hide() : _this.show();
      });
    }

    this.$element.on({
      // 'toggle.zf.trigger': this.toggle.bind(this),
      // 'close.zf.trigger': this.hide.bind(this)
      'close.zf.trigger': this.hide.bind(this)
    });

    this.$element
      .on('focus.zf.tooltip', function(e){
        isFocus = true;
        console.log(_this.isClick);
        if(_this.isClick){
          return false;
        }else{
          // $(window)
          _this.show();
        }
      })

      .on('focusout.zf.tooltip', function(e){
        isFocus = false;
        _this.isClick = false;
        _this.hide();
      })

      .on('resizeme.zf.trigger', function(){
        if(_this.isActive){
          _this._setPosition();
        }
      });
  };
  /**
   * adds a toggle method, in addition to the static show() & hide() functions
   * @function
   */
  Tooltip.prototype.toggle = function(){
    if(this.isActive){
      this.hide();
    }else{
      this.show();
    }
  };
  /**
   * Destroys an instance of tooltip, removes template element from the view.
   * @function
   */
  Tooltip.prototype.destroy = function(){
    this.$element.attr('title', this.template.text())
                 .off('.zf.trigger .zf.tootip')
                //  .removeClass('has-tip')
                 .removeAttr('aria-describedby')
                 .removeAttr('data-yeti-box')
                 .removeAttr('data-toggle')
                 .removeAttr('data-resize');

    this.template.remove();

    Foundation.unregisterPlugin(this);
  };
  /**
   * TODO utilize resize event trigger
   */

  Foundation.plugin(Tooltip, 'Tooltip');
}(jQuery, window.document, window.Foundation);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZvdW5kYXRpb24uY29yZS5qcyIsImZvdW5kYXRpb24udXRpbC5ib3guanMiLCJmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmQuanMiLCJmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeS5qcyIsImZvdW5kYXRpb24udXRpbC5tb3Rpb24uanMiLCJmb3VuZGF0aW9uLnV0aWwubmVzdC5qcyIsImZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyLmpzIiwiZm91bmRhdGlvbi51dGlsLnRvdWNoLmpzIiwiZm91bmRhdGlvbi51dGlsLnRyaWdnZXJzLmpzIiwiZm91bmRhdGlvbi5hYmlkZS5qcyIsImZvdW5kYXRpb24uYWNjb3JkaW9uLmpzIiwiZm91bmRhdGlvbi5hY2NvcmRpb25NZW51LmpzIiwiZm91bmRhdGlvbi5kcmlsbGRvd24uanMiLCJmb3VuZGF0aW9uLmRyb3Bkb3duLmpzIiwiZm91bmRhdGlvbi5kcm9wZG93bk1lbnUuanMiLCJmb3VuZGF0aW9uLmVxdWFsaXplci5qcyIsImZvdW5kYXRpb24uaW50ZXJjaGFuZ2UuanMiLCJmb3VuZGF0aW9uLm1hZ2VsbGFuLmpzIiwiZm91bmRhdGlvbi5vZmZjYW52YXMuanMiLCJmb3VuZGF0aW9uLm9yYml0LmpzIiwiZm91bmRhdGlvbi5yZXNwb25zaXZlTWVudS5qcyIsImZvdW5kYXRpb24ucmVzcG9uc2l2ZVRvZ2dsZS5qcyIsImZvdW5kYXRpb24ucmV2ZWFsLmpzIiwiZm91bmRhdGlvbi5zbGlkZXIuanMiLCJmb3VuZGF0aW9uLnN0aWNreS5qcyIsImZvdW5kYXRpb24udGFicy5qcyIsImZvdW5kYXRpb24udG9nZ2xlci5qcyIsImZvdW5kYXRpb24udG9vbHRpcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDektBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNsTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM5RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbFZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOU5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2paQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDck9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0UUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNqVUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZZQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcE5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDalVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ25hQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzlkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcGVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNWJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbFRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbkpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImZvdW5kYXRpb25fc2l0ZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIhZnVuY3Rpb24oJCkge1xyXG5cInVzZSBzdHJpY3RcIjtcclxuXHJcbnZhciBGT1VOREFUSU9OX1ZFUlNJT04gPSAnNi4wLjYnO1xyXG5cclxuLy8gR2xvYmFsIEZvdW5kYXRpb24gb2JqZWN0XHJcbi8vIFRoaXMgaXMgYXR0YWNoZWQgdG8gdGhlIHdpbmRvdywgb3IgdXNlZCBhcyBhIG1vZHVsZSBmb3IgQU1EL0Jyb3dzZXJpZnlcclxudmFyIEZvdW5kYXRpb24gPSB7XHJcbiAgdmVyc2lvbjogRk9VTkRBVElPTl9WRVJTSU9OLFxyXG5cclxuICAvKipcclxuICAgKiBTdG9yZXMgaW5pdGlhbGl6ZWQgcGx1Z2lucy5cclxuICAgKi9cclxuICBfcGx1Z2luczoge30sXHJcblxyXG4gIC8qKlxyXG4gICAqIFN0b3JlcyBnZW5lcmF0ZWQgdW5pcXVlIGlkcyBmb3IgcGx1Z2luIGluc3RhbmNlc1xyXG4gICAqL1xyXG4gIF91dWlkczogW10sXHJcbiAgLyoqXHJcbiAgICogU3RvcmVzIGN1cnJlbnRseSBhY3RpdmUgcGx1Z2lucy5cclxuICAgKi9cclxuICBfYWN0aXZlUGx1Z2luczoge30sXHJcblxyXG4gIC8qKlxyXG4gICAqIFJldHVybnMgYSBib29sZWFuIGZvciBSVEwgc3VwcG9ydFxyXG4gICAqL1xyXG4gIHJ0bDogZnVuY3Rpb24oKXtcclxuICAgIHJldHVybiAkKCdodG1sJykuYXR0cignZGlyJykgPT09ICdydGwnO1xyXG4gIH0sXHJcbiAgLyoqXHJcbiAgICogRGVmaW5lcyBhIEZvdW5kYXRpb24gcGx1Z2luLCBhZGRpbmcgaXQgdG8gdGhlIGBGb3VuZGF0aW9uYCBuYW1lc3BhY2UgYW5kIHRoZSBsaXN0IG9mIHBsdWdpbnMgdG8gaW5pdGlhbGl6ZSB3aGVuIHJlZmxvd2luZy5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gVGhlIGNvbnN0cnVjdG9yIG9mIHRoZSBwbHVnaW4uXHJcbiAgICovXHJcbiAgcGx1Z2luOiBmdW5jdGlvbihwbHVnaW4sIG5hbWUpIHtcclxuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gYWRkaW5nIHRvIGdsb2JhbCBGb3VuZGF0aW9uIG9iamVjdFxyXG4gICAgLy8gRXhhbXBsZXM6IEZvdW5kYXRpb24uUmV2ZWFsLCBGb3VuZGF0aW9uLk9mZkNhbnZhc1xyXG4gICAgdmFyIGNsYXNzTmFtZSA9IChuYW1lIHx8IGZ1bmN0aW9uTmFtZShwbHVnaW4pKTtcclxuICAgIC8vIE9iamVjdCBrZXkgdG8gdXNlIHdoZW4gc3RvcmluZyB0aGUgcGx1Z2luLCBhbHNvIHVzZWQgdG8gY3JlYXRlIHRoZSBpZGVudGlmeWluZyBkYXRhIGF0dHJpYnV0ZSBmb3IgdGhlIHBsdWdpblxyXG4gICAgLy8gRXhhbXBsZXM6IGRhdGEtcmV2ZWFsLCBkYXRhLW9mZi1jYW52YXNcclxuICAgIHZhciBhdHRyTmFtZSAgPSBoeXBoZW5hdGUoY2xhc3NOYW1lKTtcclxuXHJcbiAgICAvLyBBZGQgdG8gdGhlIEZvdW5kYXRpb24gb2JqZWN0IGFuZCB0aGUgcGx1Z2lucyBsaXN0IChmb3IgcmVmbG93aW5nKVxyXG4gICAgdGhpcy5fcGx1Z2luc1thdHRyTmFtZV0gPSB0aGlzW2NsYXNzTmFtZV0gPSBwbHVnaW47XHJcbiAgfSxcclxuICAvKipcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBDcmVhdGVzIGEgcG9pbnRlciB0byBhbiBpbnN0YW5jZSBvZiBhIFBsdWdpbiB3aXRoaW4gdGhlIEZvdW5kYXRpb24uX2FjdGl2ZVBsdWdpbnMgb2JqZWN0LlxyXG4gICAqIFNldHMgdGhlIGBbZGF0YS1wbHVnaW5OYW1lPVwidW5pcXVlSWRIZXJlXCJdYCwgYWxsb3dpbmcgZWFzeSBhY2Nlc3MgdG8gYW55IHBsdWdpbidzIGludGVybmFsIG1ldGhvZHMuXHJcbiAgICogQWxzbyBmaXJlcyB0aGUgaW5pdGlhbGl6YXRpb24gZXZlbnQgZm9yIGVhY2ggcGx1Z2luLCBjb25zb2xpZGF0aW5nIHJlcGVkaXRpdmUgY29kZS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gcGx1Z2luIC0gYW4gaW5zdGFuY2Ugb2YgYSBwbHVnaW4sIHVzdWFsbHkgYHRoaXNgIGluIGNvbnRleHQuXHJcbiAgICogQGZpcmVzIFBsdWdpbiNpbml0XHJcbiAgICovXHJcbiAgcmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbil7XHJcbiAgICB2YXIgcGx1Z2luTmFtZSA9IGZ1bmN0aW9uTmFtZShwbHVnaW4uY29uc3RydWN0b3IpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgcGx1Z2luLnV1aWQgPSB0aGlzLkdldFlvRGlnaXRzKDYsIHBsdWdpbk5hbWUpO1xyXG5cclxuICAgIGlmKCFwbHVnaW4uJGVsZW1lbnQuYXR0cignZGF0YS0nICsgcGx1Z2luTmFtZSkpe1xyXG4gICAgICBwbHVnaW4uJGVsZW1lbnQuYXR0cignZGF0YS0nICsgcGx1Z2luTmFtZSwgcGx1Z2luLnV1aWQpO1xyXG4gICAgfVxyXG4gICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIGluaXRpYWxpemVkLlxyXG4gICAgICAgICAgICogQGV2ZW50IFBsdWdpbiNpbml0XHJcbiAgICAgICAgICAgKi9cclxuICAgIHBsdWdpbi4kZWxlbWVudC50cmlnZ2VyKCdpbml0LnpmLicgKyBwbHVnaW5OYW1lKTtcclxuXHJcbiAgICB0aGlzLl9hY3RpdmVQbHVnaW5zW3BsdWdpbi51dWlkXSA9IHBsdWdpbjtcclxuXHJcbiAgICByZXR1cm47XHJcbiAgfSxcclxuICAvKipcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBSZW1vdmVzIHRoZSBwb2ludGVyIGZvciBhbiBpbnN0YW5jZSBvZiBhIFBsdWdpbiBmcm9tIHRoZSBGb3VuZGF0aW9uLl9hY3RpdmVQbHVnaW5zIG9iai5cclxuICAgKiBBbHNvIGZpcmVzIHRoZSBkZXN0cm95ZWQgZXZlbnQgZm9yIHRoZSBwbHVnaW4sIGNvbnNvbGlkYXRpbmcgcmVwZWRpdGl2ZSBjb2RlLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBwbHVnaW4gLSBhbiBpbnN0YW5jZSBvZiBhIHBsdWdpbiwgdXN1YWxseSBgdGhpc2AgaW4gY29udGV4dC5cclxuICAgKiBAZmlyZXMgUGx1Z2luI2Rlc3Ryb3llZFxyXG4gICAqL1xyXG4gIHVucmVnaXN0ZXJQbHVnaW46IGZ1bmN0aW9uKHBsdWdpbil7XHJcbiAgICB2YXIgcGx1Z2luTmFtZSA9IGZ1bmN0aW9uTmFtZShwbHVnaW4uY29uc3RydWN0b3IpLnRvTG93ZXJDYXNlKCk7XHJcblxyXG4gICAgZGVsZXRlIHRoaXMuX2FjdGl2ZVBsdWdpbnNbcGx1Z2luLnV1aWRdO1xyXG4gICAgcGx1Z2luLiRlbGVtZW50LnJlbW92ZUF0dHIoJ2RhdGEtJyArIHBsdWdpbk5hbWUpXHJcbiAgICAgICAgICAvKipcclxuICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlIHBsdWdpbiBoYXMgYmVlbiBkZXN0cm95ZWQuXHJcbiAgICAgICAgICAgKiBAZXZlbnQgUGx1Z2luI2Rlc3Ryb3llZFxyXG4gICAgICAgICAgICovXHJcbiAgICAgICAgICAudHJpZ2dlcignZGVzdHJveWVkLnpmLicgKyBwbHVnaW5OYW1lKTtcclxuXHJcbiAgICByZXR1cm47XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQ2F1c2VzIG9uZSBvciBtb3JlIGFjdGl2ZSBwbHVnaW5zIHRvIHJlLWluaXRpYWxpemUsIHJlc2V0dGluZyBldmVudCBsaXN0ZW5lcnMsIHJlY2FsY3VsYXRpbmcgcG9zaXRpb25zLCBldGMuXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBsdWdpbnMgLSBvcHRpb25hbCBzdHJpbmcgb2YgYW4gaW5kaXZpZHVhbCBwbHVnaW4ga2V5LCBhdHRhaW5lZCBieSBjYWxsaW5nIGAkKGVsZW1lbnQpLmRhdGEoJ3BsdWdpbk5hbWUnKWAsIG9yIHN0cmluZyBvZiBhIHBsdWdpbiBjbGFzcyBpLmUuIGAnZHJvcGRvd24nYFxyXG4gICAqIEBkZWZhdWx0IElmIG5vIGFyZ3VtZW50IGlzIHBhc3NlZCwgcmVmbG93IGFsbCBjdXJyZW50bHkgYWN0aXZlIHBsdWdpbnMuXHJcbiAgICovXHJcbiAgX3JlZmxvdzogZnVuY3Rpb24ocGx1Z2lucyl7XHJcbiAgICB2YXIgYWN0dlBsdWdpbnMgPSBPYmplY3Qua2V5cyh0aGlzLl9hY3RpdmVQbHVnaW5zKTtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgaWYoIXBsdWdpbnMpe1xyXG4gICAgICBhY3R2UGx1Z2lucy5mb3JFYWNoKGZ1bmN0aW9uKHApe1xyXG4gICAgICAgIF90aGlzLl9hY3RpdmVQbHVnaW5zW3BdLl9pbml0KCk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgIH1lbHNlIGlmKHR5cGVvZiBwbHVnaW5zID09PSAnc3RyaW5nJyl7XHJcbiAgICAgIHZhciBuYW1lc3BhY2UgPSBwbHVnaW5zLnNwbGl0KCctJylbMV07XHJcblxyXG4gICAgICBpZihuYW1lc3BhY2Upe1xyXG5cclxuICAgICAgICB0aGlzLl9hY3RpdmVQbHVnaW5zW3BsdWdpbnNdLl9pbml0KCk7XHJcblxyXG4gICAgICB9ZWxzZXtcclxuICAgICAgICBuYW1lc3BhY2UgPSBuZXcgUmVnRXhwKHBsdWdpbnMsICdpJyk7XHJcblxyXG4gICAgICAgIGFjdHZQbHVnaW5zLmZpbHRlcihmdW5jdGlvbihwKXtcclxuICAgICAgICAgIHJldHVybiBuYW1lc3BhY2UudGVzdChwKTtcclxuICAgICAgICB9KS5mb3JFYWNoKGZ1bmN0aW9uKHApe1xyXG4gICAgICAgICAgX3RoaXMuX2FjdGl2ZVBsdWdpbnNbcF0uX2luaXQoKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiByZXR1cm5zIGEgcmFuZG9tIGJhc2UtMzYgdWlkIHdpdGggbmFtZXNwYWNpbmdcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge051bWJlcn0gbGVuZ3RoIC0gbnVtYmVyIG9mIHJhbmRvbSBiYXNlLTM2IGRpZ2l0cyBkZXNpcmVkLiBJbmNyZWFzZSBmb3IgbW9yZSByYW5kb20gc3RyaW5ncy5cclxuICAgKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlIC0gbmFtZSBvZiBwbHVnaW4gdG8gYmUgaW5jb3Jwb3JhdGVkIGluIHVpZCwgb3B0aW9uYWwuXHJcbiAgICogQGRlZmF1bHQge1N0cmluZ30gJycgLSBpZiBubyBwbHVnaW4gbmFtZSBpcyBwcm92aWRlZCwgbm90aGluZyBpcyBhcHBlbmRlZCB0byB0aGUgdWlkLlxyXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IC0gdW5pcXVlIGlkXHJcbiAgICovXHJcbiAgR2V0WW9EaWdpdHM6IGZ1bmN0aW9uKGxlbmd0aCwgbmFtZXNwYWNlKXtcclxuICAgIGxlbmd0aCA9IGxlbmd0aCB8fCA2O1xyXG4gICAgcmV0dXJuIE1hdGgucm91bmQoKE1hdGgucG93KDM2LCBsZW5ndGggKyAxKSAtIE1hdGgucmFuZG9tKCkgKiBNYXRoLnBvdygzNiwgbGVuZ3RoKSkpLnRvU3RyaW5nKDM2KS5zbGljZSgxKSArIChuYW1lc3BhY2UgPyAnLScgKyBuYW1lc3BhY2UgOiAnJyk7XHJcbiAgfSxcclxuICAvKipcclxuICAgKiBJbml0aWFsaXplIHBsdWdpbnMgb24gYW55IGVsZW1lbnRzIHdpdGhpbiBgZWxlbWAgKGFuZCBgZWxlbWAgaXRzZWxmKSB0aGF0IGFyZW4ndCBhbHJlYWR5IGluaXRpYWxpemVkLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtIC0galF1ZXJ5IG9iamVjdCBjb250YWluaW5nIHRoZSBlbGVtZW50IHRvIGNoZWNrIGluc2lkZS4gQWxzbyBjaGVja3MgdGhlIGVsZW1lbnQgaXRzZWxmLCB1bmxlc3MgaXQncyB0aGUgYGRvY3VtZW50YCBvYmplY3QuXHJcbiAgICogQHBhcmFtIHtTdHJpbmd8QXJyYXl9IHBsdWdpbnMgLSBBIGxpc3Qgb2YgcGx1Z2lucyB0byBpbml0aWFsaXplLiBMZWF2ZSB0aGlzIG91dCB0byBpbml0aWFsaXplIGV2ZXJ5dGhpbmcuXHJcbiAgICovXHJcbiAgcmVmbG93OiBmdW5jdGlvbihlbGVtLCBwbHVnaW5zKSB7XHJcblxyXG4gICAgLy8gSWYgcGx1Z2lucyBpcyB1bmRlZmluZWQsIGp1c3QgZ3JhYiBldmVyeXRoaW5nXHJcbiAgICBpZiAodHlwZW9mIHBsdWdpbnMgPT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICAgIHBsdWdpbnMgPSBPYmplY3Qua2V5cyh0aGlzLl9wbHVnaW5zKTtcclxuICAgIH1cclxuICAgIC8vIElmIHBsdWdpbnMgaXMgYSBzdHJpbmcsIGNvbnZlcnQgaXQgdG8gYW4gYXJyYXkgd2l0aCBvbmUgaXRlbVxyXG4gICAgZWxzZSBpZiAodHlwZW9mIHBsdWdpbnMgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHBsdWdpbnMgPSBbcGx1Z2luc107XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICAvLyBJdGVyYXRlIHRocm91Z2ggZWFjaCBwbHVnaW5cclxuICAgICQuZWFjaChwbHVnaW5zLCBmdW5jdGlvbihpLCBuYW1lKSB7XHJcbiAgICAgIC8vIEdldCB0aGUgY3VycmVudCBwbHVnaW5cclxuICAgICAgdmFyIHBsdWdpbiA9IF90aGlzLl9wbHVnaW5zW25hbWVdO1xyXG5cclxuICAgICAgLy8gTG9jYWxpemUgdGhlIHNlYXJjaCB0byBhbGwgZWxlbWVudHMgaW5zaWRlIGVsZW0sIGFzIHdlbGwgYXMgZWxlbSBpdHNlbGYsIHVubGVzcyBlbGVtID09PSBkb2N1bWVudFxyXG4gICAgICB2YXIgJGVsZW0gPSAkKGVsZW0pLmZpbmQoJ1tkYXRhLScrbmFtZSsnXScpLmFkZEJhY2soJ1tkYXRhLScrbmFtZSsnXScpO1xyXG5cclxuICAgICAgLy8gRm9yIGVhY2ggcGx1Z2luIGZvdW5kLCBpbml0aWFsaXplIGl0XHJcbiAgICAgICRlbGVtLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyICRlbCA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIG9wdHMgPSB7fTtcclxuICAgICAgICAvLyBEb24ndCBkb3VibGUtZGlwIG9uIHBsdWdpbnNcclxuICAgICAgICBpZiAoJGVsLmRhdGEoJ3pmLXBsdWdpbicpKSB7XHJcbiAgICAgICAgICBjb25zb2xlLndhcm4oXCJUcmllZCB0byBpbml0aWFsaXplIFwiK25hbWUrXCIgb24gYW4gZWxlbWVudCB0aGF0IGFscmVhZHkgaGFzIGEgRm91bmRhdGlvbiBwbHVnaW4uXCIpO1xyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYoJGVsLmF0dHIoJ2RhdGEtb3B0aW9ucycpKXtcclxuICAgICAgICAgIHZhciB0aGluZyA9ICRlbC5hdHRyKCdkYXRhLW9wdGlvbnMnKS5zcGxpdCgnOycpLmZvckVhY2goZnVuY3Rpb24oZSwgaSl7XHJcbiAgICAgICAgICAgIHZhciBvcHQgPSBlLnNwbGl0KCc6JykubWFwKGZ1bmN0aW9uKGVsKXsgcmV0dXJuIGVsLnRyaW0oKTsgfSk7XHJcbiAgICAgICAgICAgIGlmKG9wdFswXSkgb3B0c1tvcHRbMF1dID0gcGFyc2VWYWx1ZShvcHRbMV0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRyeXtcclxuICAgICAgICAgICRlbC5kYXRhKCd6Zi1wbHVnaW4nLCBuZXcgcGx1Z2luKCQodGhpcyksIG9wdHMpKTtcclxuICAgICAgICB9Y2F0Y2goZXIpe1xyXG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcik7XHJcbiAgICAgICAgfWZpbmFsbHl7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH0sXHJcbiAgZ2V0Rm5OYW1lOiBmdW5jdGlvbk5hbWUsXHJcbiAgdHJhbnNpdGlvbmVuZDogZnVuY3Rpb24oJGVsZW0pe1xyXG4gICAgdmFyIHRyYW5zaXRpb25zID0ge1xyXG4gICAgICAndHJhbnNpdGlvbic6ICd0cmFuc2l0aW9uZW5kJyxcclxuICAgICAgJ1dlYmtpdFRyYW5zaXRpb24nOiAnd2Via2l0VHJhbnNpdGlvbkVuZCcsXHJcbiAgICAgICdNb3pUcmFuc2l0aW9uJzogJ3RyYW5zaXRpb25lbmQnLFxyXG4gICAgICAnT1RyYW5zaXRpb24nOiAnb3RyYW5zaXRpb25lbmQnXHJcbiAgICB9O1xyXG4gICAgdmFyIGVsZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKSxcclxuICAgICAgICBlbmQ7XHJcblxyXG4gICAgZm9yICh2YXIgdCBpbiB0cmFuc2l0aW9ucyl7XHJcbiAgICAgIGlmICh0eXBlb2YgZWxlbS5zdHlsZVt0XSAhPT0gJ3VuZGVmaW5lZCcpe1xyXG4gICAgICAgIGVuZCA9IHRyYW5zaXRpb25zW3RdO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZihlbmQpe1xyXG4gICAgICByZXR1cm4gZW5kO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIGVuZCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAkZWxlbS50cmlnZ2VySGFuZGxlcigndHJhbnNpdGlvbmVuZCcsIFskZWxlbV0pO1xyXG4gICAgICB9LCAxKTtcclxuICAgICAgcmV0dXJuICd0cmFuc2l0aW9uZW5kJztcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG5cclxuRm91bmRhdGlvbi51dGlsID0ge1xyXG4gIC8qKlxyXG4gICAqIEZ1bmN0aW9uIGZvciBhcHBseWluZyBhIGRlYm91bmNlIGVmZmVjdCB0byBhIGZ1bmN0aW9uIGNhbGwuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gZnVuYyAtIEZ1bmN0aW9uIHRvIGJlIGNhbGxlZCBhdCBlbmQgb2YgdGltZW91dC5cclxuICAgKiBAcGFyYW0ge051bWJlcn0gZGVsYXkgLSBUaW1lIGluIG1zIHRvIGRlbGF5IHRoZSBjYWxsIG9mIGBmdW5jYC5cclxuICAgKiBAcmV0dXJucyBmdW5jdGlvblxyXG4gICAqL1xyXG4gIHRocm90dGxlOiBmdW5jdGlvbiAoZnVuYywgZGVsYXkpIHtcclxuICAgIHZhciB0aW1lciA9IG51bGw7XHJcblxyXG4gICAgcmV0dXJuIGZ1bmN0aW9uICgpIHtcclxuICAgICAgdmFyIGNvbnRleHQgPSB0aGlzLCBhcmdzID0gYXJndW1lbnRzO1xyXG5cclxuICAgICAgaWYgKHRpbWVyID09PSBudWxsKSB7XHJcbiAgICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgIGZ1bmMuYXBwbHkoY29udGV4dCwgYXJncyk7XHJcbiAgICAgICAgICB0aW1lciA9IG51bGw7XHJcbiAgICAgICAgfSwgZGVsYXkpO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxufTtcclxuXHJcbi8vIFRPRE86IGNvbnNpZGVyIG5vdCBtYWtpbmcgdGhpcyBhIGpRdWVyeSBmdW5jdGlvblxyXG4vLyBUT0RPOiBuZWVkIHdheSB0byByZWZsb3cgdnMuIHJlLWluaXRpYWxpemVcclxuLyoqXHJcbiAqIFRoZSBGb3VuZGF0aW9uIGpRdWVyeSBtZXRob2QuXHJcbiAqIEBwYXJhbSB7U3RyaW5nfEFycmF5fSBtZXRob2QgLSBBbiBhY3Rpb24gdG8gcGVyZm9ybSBvbiB0aGUgY3VycmVudCBqUXVlcnkgb2JqZWN0LlxyXG4gKi9cclxudmFyIGZvdW5kYXRpb24gPSBmdW5jdGlvbihtZXRob2QpIHtcclxuICB2YXIgdHlwZSA9IHR5cGVvZiBtZXRob2QsXHJcbiAgICAgICRtZXRhID0gJCgnbWV0YS5mb3VuZGF0aW9uLW1xJyksXHJcbiAgICAgICRub0pTID0gJCgnLm5vLWpzJyk7XHJcblxyXG4gIGlmKCEkbWV0YS5sZW5ndGgpe1xyXG4gICAgJCgnPG1ldGEgY2xhc3M9XCJmb3VuZGF0aW9uLW1xXCI+JykuYXBwZW5kVG8oZG9jdW1lbnQuaGVhZCk7XHJcbiAgfVxyXG4gIGlmKCRub0pTLmxlbmd0aCl7XHJcbiAgICAkbm9KUy5yZW1vdmVDbGFzcygnbm8tanMnKTtcclxuICB9XHJcblxyXG4gIGlmKHR5cGUgPT09ICd1bmRlZmluZWQnKXsvL25lZWRzIHRvIGluaXRpYWxpemUgdGhlIEZvdW5kYXRpb24gb2JqZWN0LCBvciBhbiBpbmRpdmlkdWFsIHBsdWdpbi5cclxuICAgIEZvdW5kYXRpb24uTWVkaWFRdWVyeS5faW5pdCgpO1xyXG4gICAgRm91bmRhdGlvbi5yZWZsb3codGhpcyk7XHJcbiAgfWVsc2UgaWYodHlwZSA9PT0gJ3N0cmluZycpey8vYW4gaW5kaXZpZHVhbCBtZXRob2QgdG8gaW52b2tlIG9uIGEgcGx1Z2luIG9yIGdyb3VwIG9mIHBsdWdpbnNcclxuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKTsvL2NvbGxlY3QgYWxsIHRoZSBhcmd1bWVudHMsIGlmIG5lY2Vzc2FyeVxyXG4gICAgdmFyIHBsdWdDbGFzcyA9IHRoaXMuZGF0YSgnemZQbHVnaW4nKTsvL2RldGVybWluZSB0aGUgY2xhc3Mgb2YgcGx1Z2luXHJcblxyXG4gICAgaWYocGx1Z0NsYXNzICE9PSB1bmRlZmluZWQgJiYgcGx1Z0NsYXNzW21ldGhvZF0gIT09IHVuZGVmaW5lZCl7Ly9tYWtlIHN1cmUgYm90aCB0aGUgY2xhc3MgYW5kIG1ldGhvZCBleGlzdFxyXG4gICAgICBpZih0aGlzLmxlbmd0aCA9PT0gMSl7Ly9pZiB0aGVyZSdzIG9ubHkgb25lLCBjYWxsIGl0IGRpcmVjdGx5LlxyXG4gICAgICAgICAgcGx1Z0NsYXNzW21ldGhvZF0uYXBwbHkocGx1Z0NsYXNzLCBhcmdzKTtcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksIGVsKXsvL290aGVyd2lzZSBsb29wIHRocm91Z2ggdGhlIGpRdWVyeSBjb2xsZWN0aW9uIGFuZCBpbnZva2UgdGhlIG1ldGhvZCBvbiBlYWNoXHJcbiAgICAgICAgICBwbHVnQ2xhc3NbbWV0aG9kXS5hcHBseSgkKGVsKS5kYXRhKCd6ZlBsdWdpbicpLCBhcmdzKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfWVsc2V7Ly9lcnJvciBmb3Igbm8gY2xhc3Mgb3Igbm8gbWV0aG9kXHJcbiAgICAgIHRocm93IG5ldyBSZWZlcmVuY2VFcnJvcihcIldlJ3JlIHNvcnJ5LCAnXCIgKyBtZXRob2QgKyBcIicgaXMgbm90IGFuIGF2YWlsYWJsZSBtZXRob2QgZm9yIFwiICsgKHBsdWdDbGFzcyA/IGZ1bmN0aW9uTmFtZShwbHVnQ2xhc3MpIDogJ3RoaXMgZWxlbWVudCcpICsgJy4nKTtcclxuICAgIH1cclxuICB9ZWxzZXsvL2Vycm9yIGZvciBpbnZhbGlkIGFyZ3VtZW50IHR5cGVcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJXZSdyZSBzb3JyeSwgJ1wiICsgdHlwZSArIFwiJyBpcyBub3QgYSB2YWxpZCBwYXJhbWV0ZXIuIFlvdSBtdXN0IHVzZSBhIHN0cmluZyByZXByZXNlbnRpbmcgdGhlIG1ldGhvZCB5b3Ugd2lzaCB0byBpbnZva2UuXCIpO1xyXG4gIH1cclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbndpbmRvdy5Gb3VuZGF0aW9uID0gRm91bmRhdGlvbjtcclxuJC5mbi5mb3VuZGF0aW9uID0gZm91bmRhdGlvbjtcclxuXHJcbi8vIFBvbHlmaWxsIGZvciByZXF1ZXN0QW5pbWF0aW9uRnJhbWVcclxuKGZ1bmN0aW9uKCkge1xyXG4gIGlmICghRGF0ZS5ub3cgfHwgIXdpbmRvdy5EYXRlLm5vdylcclxuICAgIHdpbmRvdy5EYXRlLm5vdyA9IERhdGUubm93ID0gZnVuY3Rpb24oKSB7IHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKTsgfTtcclxuXHJcbiAgdmFyIHZlbmRvcnMgPSBbJ3dlYmtpdCcsICdtb3onXTtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHZlbmRvcnMubGVuZ3RoICYmICF3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lOyArK2kpIHtcclxuICAgICAgdmFyIHZwID0gdmVuZG9yc1tpXTtcclxuICAgICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IHdpbmRvd1t2cCsnUmVxdWVzdEFuaW1hdGlvbkZyYW1lJ107XHJcbiAgICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9ICh3aW5kb3dbdnArJ0NhbmNlbEFuaW1hdGlvbkZyYW1lJ11cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfHwgd2luZG93W3ZwKydDYW5jZWxSZXF1ZXN0QW5pbWF0aW9uRnJhbWUnXSk7XHJcbiAgfVxyXG4gIGlmICgvaVAoYWR8aG9uZXxvZCkuKk9TIDYvLnRlc3Qod2luZG93Lm5hdmlnYXRvci51c2VyQWdlbnQpXHJcbiAgICB8fCAhd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fCAhd2luZG93LmNhbmNlbEFuaW1hdGlvbkZyYW1lKSB7XHJcbiAgICB2YXIgbGFzdFRpbWUgPSAwO1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XHJcbiAgICAgICAgdmFyIG5leHRUaW1lID0gTWF0aC5tYXgobGFzdFRpbWUgKyAxNiwgbm93KTtcclxuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW5jdGlvbigpIHsgY2FsbGJhY2sobGFzdFRpbWUgPSBuZXh0VGltZSk7IH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgbmV4dFRpbWUgLSBub3cpO1xyXG4gICAgfTtcclxuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSA9IGNsZWFyVGltZW91dDtcclxuICB9XHJcbiAgLyoqXHJcbiAgICogUG9seWZpbGwgZm9yIHBlcmZvcm1hbmNlLm5vdywgcmVxdWlyZWQgYnkgckFGXHJcbiAgICovXHJcbiAgaWYoIXdpbmRvdy5wZXJmb3JtYW5jZSB8fCAhd2luZG93LnBlcmZvcm1hbmNlLm5vdyl7XHJcbiAgICB3aW5kb3cucGVyZm9ybWFuY2UgPSB7XHJcbiAgICAgIHN0YXJ0OiBEYXRlLm5vdygpLFxyXG4gICAgICBub3c6IGZ1bmN0aW9uKCl7IHJldHVybiBEYXRlLm5vdygpIC0gdGhpcy5zdGFydDsgfVxyXG4gICAgfTtcclxuICB9XHJcbn0pKCk7XHJcbmlmICghRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQpIHtcclxuICBGdW5jdGlvbi5wcm90b3R5cGUuYmluZCA9IGZ1bmN0aW9uKG9UaGlzKSB7XHJcbiAgICBpZiAodHlwZW9mIHRoaXMgIT09ICdmdW5jdGlvbicpIHtcclxuICAgICAgLy8gY2xvc2VzdCB0aGluZyBwb3NzaWJsZSB0byB0aGUgRUNNQVNjcmlwdCA1XHJcbiAgICAgIC8vIGludGVybmFsIElzQ2FsbGFibGUgZnVuY3Rpb25cclxuICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignRnVuY3Rpb24ucHJvdG90eXBlLmJpbmQgLSB3aGF0IGlzIHRyeWluZyB0byBiZSBib3VuZCBpcyBub3QgY2FsbGFibGUnKTtcclxuICAgIH1cclxuXHJcbiAgICB2YXIgYUFyZ3MgICA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSksXHJcbiAgICAgICAgZlRvQmluZCA9IHRoaXMsXHJcbiAgICAgICAgZk5PUCAgICA9IGZ1bmN0aW9uKCkge30sXHJcbiAgICAgICAgZkJvdW5kICA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgcmV0dXJuIGZUb0JpbmQuYXBwbHkodGhpcyBpbnN0YW5jZW9mIGZOT1BcclxuICAgICAgICAgICAgICAgICA/IHRoaXNcclxuICAgICAgICAgICAgICAgICA6IG9UaGlzLFxyXG4gICAgICAgICAgICAgICAgIGFBcmdzLmNvbmNhdChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpKSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICBpZiAodGhpcy5wcm90b3R5cGUpIHtcclxuICAgICAgLy8gbmF0aXZlIGZ1bmN0aW9ucyBkb24ndCBoYXZlIGEgcHJvdG90eXBlXHJcbiAgICAgIGZOT1AucHJvdG90eXBlID0gdGhpcy5wcm90b3R5cGU7XHJcbiAgICB9XHJcbiAgICBmQm91bmQucHJvdG90eXBlID0gbmV3IGZOT1AoKTtcclxuXHJcbiAgICByZXR1cm4gZkJvdW5kO1xyXG4gIH07XHJcbn1cclxuLy8gUG9seWZpbGwgdG8gZ2V0IHRoZSBuYW1lIG9mIGEgZnVuY3Rpb24gaW4gSUU5XHJcbmZ1bmN0aW9uIGZ1bmN0aW9uTmFtZShmbikge1xyXG4gIGlmIChGdW5jdGlvbi5wcm90b3R5cGUubmFtZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICB2YXIgZnVuY05hbWVSZWdleCA9IC9mdW5jdGlvblxccyhbXihdezEsfSlcXCgvO1xyXG4gICAgdmFyIHJlc3VsdHMgPSAoZnVuY05hbWVSZWdleCkuZXhlYygoZm4pLnRvU3RyaW5nKCkpO1xyXG4gICAgcmV0dXJuIChyZXN1bHRzICYmIHJlc3VsdHMubGVuZ3RoID4gMSkgPyByZXN1bHRzWzFdLnRyaW0oKSA6IFwiXCI7XHJcbiAgfVxyXG4gIGVsc2UgaWYgKGZuLnByb3RvdHlwZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICByZXR1cm4gZm4uY29uc3RydWN0b3IubmFtZTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICByZXR1cm4gZm4ucHJvdG90eXBlLmNvbnN0cnVjdG9yLm5hbWU7XHJcbiAgfVxyXG59XHJcbmZ1bmN0aW9uIHBhcnNlVmFsdWUoc3RyKXtcclxuICBpZigvdHJ1ZS8udGVzdChzdHIpKSByZXR1cm4gdHJ1ZTtcclxuICBlbHNlIGlmKC9mYWxzZS8udGVzdChzdHIpKSByZXR1cm4gZmFsc2U7XHJcbiAgZWxzZSBpZighaXNOYU4oc3RyICogMSkvKiAmJiB0eXBlb2YgKHN0ciAqIDEpID09PSBcIm51bWJlclwiKi8pIHJldHVybiBwYXJzZUZsb2F0KHN0cik7XHJcbiAgcmV0dXJuIHN0cjtcclxufVxyXG4vLyBDb252ZXJ0IFBhc2NhbENhc2UgdG8ga2ViYWItY2FzZVxyXG4vLyBUaGFuayB5b3U6IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzg5NTU1ODBcclxuZnVuY3Rpb24gaHlwaGVuYXRlKHN0cikge1xyXG4gIHJldHVybiBzdHIucmVwbGFjZSgvKFthLXpdKShbQS1aXSkvZywgJyQxLSQyJykudG9Mb3dlckNhc2UoKTtcclxufVxyXG5cclxufShqUXVlcnkpO1xyXG4iLCIhZnVuY3Rpb24oRm91bmRhdGlvbiwgd2luZG93KXtcclxuICAvKipcclxuICAgKiBDb21wYXJlcyB0aGUgZGltZW5zaW9ucyBvZiBhbiBlbGVtZW50IHRvIGEgY29udGFpbmVyIGFuZCBkZXRlcm1pbmVzIGNvbGxpc2lvbiBldmVudHMgd2l0aCBjb250YWluZXIuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHRlc3QgZm9yIGNvbGxpc2lvbnMuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IHBhcmVudCAtIGpRdWVyeSBvYmplY3QgdG8gdXNlIGFzIGJvdW5kaW5nIGNvbnRhaW5lci5cclxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGxyT25seSAtIHNldCB0byB0cnVlIHRvIGNoZWNrIGxlZnQgYW5kIHJpZ2h0IHZhbHVlcyBvbmx5LlxyXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gdGJPbmx5IC0gc2V0IHRvIHRydWUgdG8gY2hlY2sgdG9wIGFuZCBib3R0b20gdmFsdWVzIG9ubHkuXHJcbiAgICogQGRlZmF1bHQgaWYgbm8gcGFyZW50IG9iamVjdCBwYXNzZWQsIGRldGVjdHMgY29sbGlzaW9ucyB3aXRoIGB3aW5kb3dgLlxyXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSAtIHRydWUgaWYgY29sbGlzaW9uIGZyZWUsIGZhbHNlIGlmIGEgY29sbGlzaW9uIGluIGFueSBkaXJlY3Rpb24uXHJcbiAgICovXHJcbiAgdmFyIEltTm90VG91Y2hpbmdZb3UgPSBmdW5jdGlvbihlbGVtZW50LCBwYXJlbnQsIGxyT25seSwgdGJPbmx5KXtcclxuICAgIHZhciBlbGVEaW1zID0gR2V0RGltZW5zaW9ucyhlbGVtZW50KSxcclxuICAgICAgICB0b3AsIGJvdHRvbSwgbGVmdCwgcmlnaHQ7XHJcblxyXG4gICAgaWYocGFyZW50KXtcclxuICAgICAgdmFyIHBhckRpbXMgPSBHZXREaW1lbnNpb25zKHBhcmVudCk7XHJcblxyXG4gICAgICBib3R0b20gPSAoZWxlRGltcy5vZmZzZXQudG9wICsgZWxlRGltcy5oZWlnaHQgPD0gcGFyRGltcy5oZWlnaHQgKyBwYXJEaW1zLm9mZnNldC50b3ApO1xyXG4gICAgICB0b3AgICAgPSAoZWxlRGltcy5vZmZzZXQudG9wID49IHBhckRpbXMub2Zmc2V0LnRvcCk7XHJcbiAgICAgIGxlZnQgICA9IChlbGVEaW1zLm9mZnNldC5sZWZ0ID49IHBhckRpbXMub2Zmc2V0LmxlZnQpO1xyXG4gICAgICByaWdodCAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCArIGVsZURpbXMud2lkdGggPD0gcGFyRGltcy53aWR0aCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgYm90dG9tID0gKGVsZURpbXMub2Zmc2V0LnRvcCArIGVsZURpbXMuaGVpZ2h0IDw9IGVsZURpbXMud2luZG93RGltcy5oZWlnaHQgKyBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCk7XHJcbiAgICAgIHRvcCAgICA9IChlbGVEaW1zLm9mZnNldC50b3AgPj0gZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC50b3ApO1xyXG4gICAgICBsZWZ0ICAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCA+PSBlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LmxlZnQpO1xyXG4gICAgICByaWdodCAgPSAoZWxlRGltcy5vZmZzZXQubGVmdCArIGVsZURpbXMud2lkdGggPD0gZWxlRGltcy53aW5kb3dEaW1zLndpZHRoKTtcclxuICAgIH1cclxuICAgIHZhciBhbGxEaXJzID0gW2JvdHRvbSwgdG9wLCBsZWZ0LCByaWdodF07XHJcblxyXG4gICAgaWYobHJPbmx5KXsgcmV0dXJuIGxlZnQgPT09IHJpZ2h0ID09PSB0cnVlOyB9XHJcbiAgICBpZih0Yk9ubHkpeyByZXR1cm4gdG9wID09PSBib3R0b20gPT09IHRydWU7IH1cclxuXHJcbiAgICByZXR1cm4gYWxsRGlycy5pbmRleE9mKGZhbHNlKSA9PT0gLTE7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogVXNlcyBuYXRpdmUgbWV0aG9kcyB0byByZXR1cm4gYW4gb2JqZWN0IG9mIGRpbWVuc2lvbiB2YWx1ZXMuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtqUXVlcnkgfHwgSFRNTH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3Qgb3IgRE9NIGVsZW1lbnQgZm9yIHdoaWNoIHRvIGdldCB0aGUgZGltZW5zaW9ucy4gQ2FuIGJlIGFueSBlbGVtZW50IG90aGVyIHRoYXQgZG9jdW1lbnQgb3Igd2luZG93LlxyXG4gICAqIEByZXR1cm5zIHtPYmplY3R9IC0gbmVzdGVkIG9iamVjdCBvZiBpbnRlZ2VyIHBpeGVsIHZhbHVlc1xyXG4gICAqIFRPRE8gLSBpZiBlbGVtZW50IGlzIHdpbmRvdywgcmV0dXJuIG9ubHkgdGhvc2UgdmFsdWVzLlxyXG4gICAqL1xyXG4gIHZhciBHZXREaW1lbnNpb25zID0gZnVuY3Rpb24oZWxlbSwgdGVzdCl7XHJcbiAgICBlbGVtID0gZWxlbS5sZW5ndGggPyBlbGVtWzBdIDogZWxlbTtcclxuXHJcbiAgICBpZihlbGVtID09PSB3aW5kb3cgfHwgZWxlbSA9PT0gZG9jdW1lbnQpeyB0aHJvdyBuZXcgRXJyb3IoXCJJJ20gc29ycnksIERhdmUuIEknbSBhZnJhaWQgSSBjYW4ndCBkbyB0aGF0LlwiKTsgfVxyXG5cclxuICAgIHZhciByZWN0ID0gZWxlbS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKSxcclxuICAgICAgICBwYXJSZWN0ID0gZWxlbS5wYXJlbnROb2RlLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgICAgIHdpblJlY3QgPSBkb2N1bWVudC5ib2R5LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLFxyXG4gICAgICAgIHdpblkgPSB3aW5kb3cucGFnZVlPZmZzZXQsXHJcbiAgICAgICAgd2luWCA9IHdpbmRvdy5wYWdlWE9mZnNldDtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICB3aWR0aDogcmVjdC53aWR0aCxcclxuICAgICAgaGVpZ2h0OiByZWN0LmhlaWdodCxcclxuICAgICAgb2Zmc2V0OiB7XHJcbiAgICAgICAgdG9wOiByZWN0LnRvcCArIHdpblksXHJcbiAgICAgICAgbGVmdDogcmVjdC5sZWZ0ICsgd2luWFxyXG4gICAgICB9LFxyXG4gICAgICBwYXJlbnREaW1zOiB7XHJcbiAgICAgICAgd2lkdGg6IHBhclJlY3Qud2lkdGgsXHJcbiAgICAgICAgaGVpZ2h0OiBwYXJSZWN0LmhlaWdodCxcclxuICAgICAgICBvZmZzZXQ6IHtcclxuICAgICAgICAgIHRvcDogcGFyUmVjdC50b3AgKyB3aW5ZLFxyXG4gICAgICAgICAgbGVmdDogcGFyUmVjdC5sZWZ0ICsgd2luWFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgICAgd2luZG93RGltczoge1xyXG4gICAgICAgIHdpZHRoOiB3aW5SZWN0LndpZHRoLFxyXG4gICAgICAgIGhlaWdodDogd2luUmVjdC5oZWlnaHQsXHJcbiAgICAgICAgb2Zmc2V0OiB7XHJcbiAgICAgICAgICB0b3A6IHdpblksXHJcbiAgICAgICAgICBsZWZ0OiB3aW5YXHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyBhbiBvYmplY3Qgb2YgdG9wIGFuZCBsZWZ0IGludGVnZXIgcGl4ZWwgdmFsdWVzIGZvciBkeW5hbWljYWxseSByZW5kZXJlZCBlbGVtZW50cyxcclxuICAgKiBzdWNoIGFzOiBUb29sdGlwLCBSZXZlYWwsIGFuZCBEcm9wZG93blxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQgYmVpbmcgcG9zaXRpb25lZC5cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gYW5jaG9yIC0galF1ZXJ5IG9iamVjdCBmb3IgdGhlIGVsZW1lbnQncyBhbmNob3IgcG9pbnQuXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBvc2l0aW9uIC0gYSBzdHJpbmcgcmVsYXRpbmcgdG8gdGhlIGRlc2lyZWQgcG9zaXRpb24gb2YgdGhlIGVsZW1lbnQsIHJlbGF0aXZlIHRvIGl0J3MgYW5jaG9yXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHZPZmZzZXQgLSBpbnRlZ2VyIHBpeGVsIHZhbHVlIG9mIGRlc2lyZWQgdmVydGljYWwgc2VwYXJhdGlvbiBiZXR3ZWVuIGFuY2hvciBhbmQgZWxlbWVudC5cclxuICAgKiBAcGFyYW0ge051bWJlcn0gaE9mZnNldCAtIGludGVnZXIgcGl4ZWwgdmFsdWUgb2YgZGVzaXJlZCBob3Jpem9udGFsIHNlcGFyYXRpb24gYmV0d2VlbiBhbmNob3IgYW5kIGVsZW1lbnQuXHJcbiAgICogQHBhcmFtIHtCb29sZWFufSBpc092ZXJmbG93IC0gaWYgYSBjb2xsaXNpb24gZXZlbnQgaXMgZGV0ZWN0ZWQsIHNldHMgdG8gdHJ1ZSB0byBkZWZhdWx0IHRoZSBlbGVtZW50IHRvIGZ1bGwgd2lkdGggLSBhbnkgZGVzaXJlZCBvZmZzZXQuXHJcbiAgICogVE9ETyBhbHRlci9yZXdyaXRlIHRvIHdvcmsgd2l0aCBgZW1gIHZhbHVlcyBhcyB3ZWxsL2luc3RlYWQgb2YgcGl4ZWxzXHJcbiAgICovXHJcbiAgdmFyIEdldE9mZnNldHMgPSBmdW5jdGlvbihlbGVtZW50LCBhbmNob3IsIHBvc2l0aW9uLCB2T2Zmc2V0LCBoT2Zmc2V0LCBpc092ZXJmbG93KXtcclxuICAgIHZhciAkZWxlRGltcyA9IEdldERpbWVuc2lvbnMoZWxlbWVudCksXHJcbiAgICAvLyB2YXIgJGVsZURpbXMgPSBHZXREaW1lbnNpb25zKGVsZW1lbnQpLFxyXG4gICAgICAgICRhbmNob3JEaW1zID0gYW5jaG9yID8gR2V0RGltZW5zaW9ucyhhbmNob3IpIDogbnVsbDtcclxuICAgICAgICAvLyAkYW5jaG9yRGltcyA9IGFuY2hvciA/IEdldERpbWVuc2lvbnMoYW5jaG9yKSA6IG51bGw7XHJcbiAgICBzd2l0Y2gocG9zaXRpb24pe1xyXG4gICAgICBjYXNlICd0b3AnOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCxcclxuICAgICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ2xlZnQnOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxyXG4gICAgICAgICAgdG9wOiAkYW5jaG9yRGltcy5vZmZzZXQudG9wXHJcbiAgICAgICAgfTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAncmlnaHQnOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCxcclxuICAgICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ2NlbnRlciB0b3AnOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBsZWZ0OiAoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcclxuICAgICAgICAgIHRvcDogJGFuY2hvckRpbXMub2Zmc2V0LnRvcCAtICgkZWxlRGltcy5oZWlnaHQgKyB2T2Zmc2V0KVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ2NlbnRlciBib3R0b20nOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBsZWZ0OiBpc092ZXJmbG93ID8gaE9mZnNldCA6ICgoJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQgKyAoJGFuY2hvckRpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSksXHJcbiAgICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XHJcbiAgICAgICAgfTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgY2FzZSAnY2VudGVyIGxlZnQnOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCAtICgkZWxlRGltcy53aWR0aCArIGhPZmZzZXQpLFxyXG4gICAgICAgICAgdG9wOiAoJGFuY2hvckRpbXMub2Zmc2V0LnRvcCArICgkYW5jaG9yRGltcy5oZWlnaHQgLyAyKSkgLSAoJGVsZURpbXMuaGVpZ2h0IC8gMilcclxuICAgICAgICB9O1xyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICBjYXNlICdjZW50ZXIgcmlnaHQnOlxyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICBsZWZ0OiAkYW5jaG9yRGltcy5vZmZzZXQubGVmdCArICRhbmNob3JEaW1zLndpZHRoICsgaE9mZnNldCArIDEsXHJcbiAgICAgICAgICB0b3A6ICgkYW5jaG9yRGltcy5vZmZzZXQudG9wICsgKCRhbmNob3JEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ2NlbnRlcic6XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLm9mZnNldC5sZWZ0ICsgKCRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLyAyKSkgLSAoJGVsZURpbXMud2lkdGggLyAyKSxcclxuICAgICAgICAgIHRvcDogKCRlbGVEaW1zLndpbmRvd0RpbXMub2Zmc2V0LnRvcCArICgkZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCAvIDIpKSAtICgkZWxlRGltcy5oZWlnaHQgLyAyKVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ3JldmVhbCc6XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgIGxlZnQ6ICgkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoIC0gJGVsZURpbXMud2lkdGgpIC8gMixcclxuICAgICAgICAgIHRvcDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wICsgdk9mZnNldFxyXG4gICAgICAgIH07XHJcbiAgICAgIGNhc2UgJ3JldmVhbCBmdWxsJzpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgbGVmdDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQubGVmdCxcclxuICAgICAgICAgIHRvcDogJGVsZURpbXMud2luZG93RGltcy5vZmZzZXQudG9wXHJcbiAgICAgICAgfTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgZGVmYXVsdDpcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgbGVmdDogJGFuY2hvckRpbXMub2Zmc2V0LmxlZnQsXHJcbiAgICAgICAgICB0b3A6ICRhbmNob3JEaW1zLm9mZnNldC50b3AgKyAkYW5jaG9yRGltcy5oZWlnaHQgKyB2T2Zmc2V0XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuICB9O1xyXG4gIEZvdW5kYXRpb24uQm94ID0ge1xyXG4gICAgSW1Ob3RUb3VjaGluZ1lvdTogSW1Ob3RUb3VjaGluZ1lvdSxcclxuICAgIEdldERpbWVuc2lvbnM6IEdldERpbWVuc2lvbnMsXHJcbiAgICBHZXRPZmZzZXRzOiBHZXRPZmZzZXRzXHJcbiAgfTtcclxufSh3aW5kb3cuRm91bmRhdGlvbiwgd2luZG93KTtcclxuIiwiLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcclxuICogVGhpcyB1dGlsIHdhcyBjcmVhdGVkIGJ5IE1hcml1cyBPbGJlcnR6ICpcclxuICogUGxlYXNlIHRoYW5rIE1hcml1cyBvbiBHaXRIdWIgL293bGJlcnR6ICpcclxuICogb3IgdGhlIHdlYiBodHRwOi8vd3d3Lm1hcml1c29sYmVydHouZGUvICpcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICpcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuIWZ1bmN0aW9uKCQsIEZvdW5kYXRpb24pe1xyXG4gICd1c2Ugc3RyaWN0JztcclxuICBGb3VuZGF0aW9uLktleWJvYXJkID0ge307XHJcblxyXG4gIHZhciBrZXlDb2RlcyA9IHtcclxuICAgIDk6ICdUQUInLFxyXG4gICAgMTM6ICdFTlRFUicsXHJcbiAgICAyNzogJ0VTQ0FQRScsXHJcbiAgICAzMjogJ1NQQUNFJyxcclxuICAgIDM3OiAnQVJST1dfTEVGVCcsXHJcbiAgICAzODogJ0FSUk9XX1VQJyxcclxuICAgIDM5OiAnQVJST1dfUklHSFQnLFxyXG4gICAgNDA6ICdBUlJPV19ET1dOJ1xyXG4gIH07XHJcblxyXG4gIC8vIGNvbnN0YW50cyBmb3IgZWFzaWVyIGNvbXBhcmluZyBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcclxuICB2YXIga2V5cyA9IChmdW5jdGlvbihrY3MpIHtcclxuICAgIHZhciBrID0ge307XHJcbiAgICBmb3IgKHZhciBrYyBpbiBrY3MpIGtba2NzW2tjXV0gPSBrY3Nba2NdO1xyXG4gICAgcmV0dXJuIGs7XHJcbiAgfSkoa2V5Q29kZXMpO1xyXG5cclxuICBGb3VuZGF0aW9uLktleWJvYXJkLmtleXMgPSBrZXlzO1xyXG5cclxuICAvKipcclxuICAgKiBQYXJzZXMgdGhlIChrZXlib2FyZCkgZXZlbnQgYW5kIHJldHVybnMgYSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIGl0cyBrZXlcclxuICAgKiBDYW4gYmUgdXNlZCBsaWtlIEZvdW5kYXRpb24ucGFyc2VLZXkoZXZlbnQpID09PSBGb3VuZGF0aW9uLmtleXMuU1BBQ0VcclxuICAgKiBAcGFyYW0ge0V2ZW50fSBldmVudCAtIHRoZSBldmVudCBnZW5lcmF0ZWQgYnkgdGhlIGV2ZW50IGhhbmRsZXJcclxuICAgKiBAcmV0dXJuIFN0cmluZyBrZXkgLSBTdHJpbmcgdGhhdCByZXByZXNlbnRzIHRoZSBrZXkgcHJlc3NlZFxyXG4gICAqL1xyXG4gIHZhciBwYXJzZUtleSA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICB2YXIga2V5ID0ga2V5Q29kZXNbZXZlbnQud2hpY2ggfHwgZXZlbnQua2V5Q29kZV0gfHwgU3RyaW5nLmZyb21DaGFyQ29kZShldmVudC53aGljaCkudG9VcHBlckNhc2UoKTtcclxuICAgIGlmIChldmVudC5zaGlmdEtleSkga2V5ID0gJ1NISUZUXycgKyBrZXk7XHJcbiAgICBpZiAoZXZlbnQuY3RybEtleSkga2V5ID0gJ0NUUkxfJyArIGtleTtcclxuICAgIGlmIChldmVudC5hbHRLZXkpIGtleSA9ICdBTFRfJyArIGtleTtcclxuICAgIHJldHVybiBrZXk7XHJcbiAgfTtcclxuICBGb3VuZGF0aW9uLktleWJvYXJkLnBhcnNlS2V5ID0gcGFyc2VLZXk7XHJcblxyXG5cclxuICAvLyBwbGFpbiBjb21tYW5kcyBwZXIgY29tcG9uZW50IGdvIGhlcmUsIGx0ciBhbmQgcnRsIGFyZSBtZXJnZWQgYmFzZWQgb24gb3JpZW50YXRpb25cclxuICB2YXIgY29tbWFuZHMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyB0aGUgZ2l2ZW4gKGtleWJvYXJkKSBldmVudFxyXG4gICAqIEBwYXJhbSB7RXZlbnR9IGV2ZW50IC0gdGhlIGV2ZW50IGdlbmVyYXRlZCBieSB0aGUgZXZlbnQgaGFuZGxlclxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCwgZS5nLiBTbGlkZXIgb3IgUmV2ZWFsXHJcbiAgICogQHBhcmFtIHtPYmplY3RzfSBmdW5jdGlvbnMgLSBjb2xsZWN0aW9uIG9mIGZ1bmN0aW9ucyB0aGF0IGFyZSB0byBiZSBleGVjdXRlZFxyXG4gICAqL1xyXG4gIHZhciBoYW5kbGVLZXkgPSBmdW5jdGlvbihldmVudCwgY29tcG9uZW50LCBmdW5jdGlvbnMpIHtcclxuICAgIHZhciBjb21tYW5kTGlzdCA9IGNvbW1hbmRzW0ZvdW5kYXRpb24uZ2V0Rm5OYW1lKGNvbXBvbmVudCldLFxyXG4gICAgICBrZXlDb2RlID0gcGFyc2VLZXkoZXZlbnQpLFxyXG4gICAgICBjbWRzLFxyXG4gICAgICBjb21tYW5kLFxyXG4gICAgICBmbjtcclxuICAgIGlmICghY29tbWFuZExpc3QpIHJldHVybiBjb25zb2xlLndhcm4oJ0NvbXBvbmVudCBub3QgZGVmaW5lZCEnKTtcclxuXHJcbiAgICBpZiAodHlwZW9mIGNvbW1hbmRMaXN0Lmx0ciA9PT0gJ3VuZGVmaW5lZCcpIHsgLy8gdGhpcyBjb21wb25lbnQgZG9lcyBub3QgZGlmZmVyZW50aWF0ZSBiZXR3ZWVuIGx0ciBhbmQgcnRsXHJcbiAgICAgICAgY21kcyA9IGNvbW1hbmRMaXN0OyAvLyB1c2UgcGxhaW4gbGlzdFxyXG4gICAgfSBlbHNlIHsgLy8gbWVyZ2UgbHRyIGFuZCBydGw6IGlmIGRvY3VtZW50IGlzIHJ0bCwgcnRsIG92ZXJ3cml0ZXMgbHRyIGFuZCB2aWNlIHZlcnNhXHJcbiAgICAgICAgaWYgKEZvdW5kYXRpb24ucnRsKCkpIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QubHRyLCBjb21tYW5kTGlzdC5ydGwpO1xyXG5cclxuICAgICAgICBlbHNlIGNtZHMgPSAkLmV4dGVuZCh7fSwgY29tbWFuZExpc3QucnRsLCBjb21tYW5kTGlzdC5sdHIpO1xyXG4gICAgfVxyXG4gICAgY29tbWFuZCA9IGNtZHNba2V5Q29kZV07XHJcblxyXG5cclxuICAgIGZuID0gZnVuY3Rpb25zW2NvbW1hbmRdO1xyXG4gICAgaWYgKGZuICYmIHR5cGVvZiBmbiA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdpdGggY29udGV4dCBvZiB0aGUgY29tcG9uZW50IGlmIGV4aXN0c1xyXG4gICAgICAgIGZuLmFwcGx5KGNvbXBvbmVudCk7XHJcbiAgICAgICAgaWYgKGZ1bmN0aW9ucy5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMuaGFuZGxlZCA9PT0gJ2Z1bmN0aW9uJykgeyAvLyBleGVjdXRlIGZ1bmN0aW9uIHdoZW4gZXZlbnQgd2FzIGhhbmRsZWRcclxuICAgICAgICAgICAgZnVuY3Rpb25zLmhhbmRsZWQuYXBwbHkoY29tcG9uZW50KTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIGlmIChmdW5jdGlvbnMudW5oYW5kbGVkIHx8IHR5cGVvZiBmdW5jdGlvbnMudW5oYW5kbGVkID09PSAnZnVuY3Rpb24nKSB7IC8vIGV4ZWN1dGUgZnVuY3Rpb24gd2hlbiBldmVudCB3YXMgbm90IGhhbmRsZWRcclxuICAgICAgICAgICAgZnVuY3Rpb25zLnVuaGFuZGxlZC5hcHBseShjb21wb25lbnQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG4gIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5ID0gaGFuZGxlS2V5O1xyXG5cclxuICAvKipcclxuICAgKiBGaW5kcyBhbGwgZm9jdXNhYmxlIGVsZW1lbnRzIHdpdGhpbiB0aGUgZ2l2ZW4gYCRlbGVtZW50YFxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gc2VhcmNoIHdpdGhpblxyXG4gICAqIEByZXR1cm4ge2pRdWVyeX0gJGZvY3VzYWJsZSAtIGFsbCBmb2N1c2FibGUgZWxlbWVudHMgd2l0aGluIGAkZWxlbWVudGBcclxuICAgKi9cclxuICB2YXIgZmluZEZvY3VzYWJsZSA9IGZ1bmN0aW9uKCRlbGVtZW50KSB7XHJcbiAgICByZXR1cm4gJGVsZW1lbnQuZmluZCgnYVtocmVmXSwgYXJlYVtocmVmXSwgaW5wdXQ6bm90KFtkaXNhYmxlZF0pLCBzZWxlY3Q6bm90KFtkaXNhYmxlZF0pLCB0ZXh0YXJlYTpub3QoW2Rpc2FibGVkXSksIGJ1dHRvbjpub3QoW2Rpc2FibGVkXSksIGlmcmFtZSwgb2JqZWN0LCBlbWJlZCwgKlt0YWJpbmRleF0sICpbY29udGVudGVkaXRhYmxlXScpLmZpbHRlcihmdW5jdGlvbigpIHtcclxuICAgICAgaWYgKCEkKHRoaXMpLmlzKCc6dmlzaWJsZScpIHx8ICQodGhpcykuYXR0cigndGFiaW5kZXgnKSA8IDApIHsgcmV0dXJuIGZhbHNlOyB9IC8vb25seSBoYXZlIHZpc2libGUgZWxlbWVudHMgYW5kIHRob3NlIHRoYXQgaGF2ZSBhIHRhYmluZGV4IGdyZWF0ZXIgb3IgZXF1YWwgMFxyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH0pO1xyXG4gIH07XHJcbiAgRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlID0gZmluZEZvY3VzYWJsZTtcclxuXHJcbiAgLyoqXHJcbiAgICogUmV0dXJucyB0aGUgY29tcG9uZW50IG5hbWUgbmFtZVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBjb21wb25lbnQgLSBGb3VuZGF0aW9uIGNvbXBvbmVudCwgZS5nLiBTbGlkZXIgb3IgUmV2ZWFsXHJcbiAgICogQHJldHVybiBTdHJpbmcgY29tcG9uZW50TmFtZVxyXG4gICAqL1xyXG5cclxuICB2YXIgcmVnaXN0ZXIgPSBmdW5jdGlvbihjb21wb25lbnROYW1lLCBjbWRzKSB7XHJcbiAgICBjb21tYW5kc1tjb21wb25lbnROYW1lXSA9IGNtZHM7XHJcbiAgfTtcclxuICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyID0gcmVnaXN0ZXI7XHJcbn0oalF1ZXJ5LCB3aW5kb3cuRm91bmRhdGlvbik7XHJcbiIsIiFmdW5jdGlvbigkLCBGb3VuZGF0aW9uKSB7XHJcblxyXG4vLyBEZWZhdWx0IHNldCBvZiBtZWRpYSBxdWVyaWVzXHJcbnZhciBkZWZhdWx0UXVlcmllcyA9IHtcclxuICAnZGVmYXVsdCcgOiAnb25seSBzY3JlZW4nLFxyXG4gIGxhbmRzY2FwZSA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcclxuICBwb3J0cmFpdCA6ICdvbmx5IHNjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBwb3J0cmFpdCknLFxyXG4gIHJldGluYSA6ICdvbmx5IHNjcmVlbiBhbmQgKC13ZWJraXQtbWluLWRldmljZS1waXhlbC1yYXRpbzogMiksJyArXHJcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tLW1vei1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xyXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAoLW8tbWluLWRldmljZS1waXhlbC1yYXRpbzogMi8xKSwnICtcclxuICAgICdvbmx5IHNjcmVlbiBhbmQgKG1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCcgK1xyXG4gICAgJ29ubHkgc2NyZWVuIGFuZCAobWluLXJlc29sdXRpb246IDE5MmRwaSksJyArXHJcbiAgICAnb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMmRwcHgpJ1xyXG59O1xyXG5cclxudmFyIE1lZGlhUXVlcnkgPSB7XHJcbiAgcXVlcmllczogW10sXHJcbiAgY3VycmVudDogJycsXHJcblxyXG4gIC8qKlxyXG4gICAqIENoZWNrcyBpZiB0aGUgc2NyZWVuIGlzIGF0IGxlYXN0IGFzIHdpZGUgYXMgYSBicmVha3BvaW50LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBzaXplIC0gTmFtZSBvZiB0aGUgYnJlYWtwb2ludCB0byBjaGVjay5cclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gYHRydWVgIGlmIHRoZSBicmVha3BvaW50IG1hdGNoZXMsIGBmYWxzZWAgaWYgaXQncyBzbWFsbGVyLlxyXG4gICAqL1xyXG4gIGF0TGVhc3Q6IGZ1bmN0aW9uKHNpemUpIHtcclxuICAgIHZhciBxdWVyeSA9IHRoaXMuZ2V0KHNpemUpO1xyXG5cclxuICAgIGlmIChxdWVyeSkge1xyXG4gICAgICByZXR1cm4gd2luZG93Lm1hdGNoTWVkaWEocXVlcnkpLm1hdGNoZXM7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEdldHMgdGhlIG1lZGlhIHF1ZXJ5IG9mIGEgYnJlYWtwb2ludC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2l6ZSAtIE5hbWUgb2YgdGhlIGJyZWFrcG9pbnQgdG8gZ2V0LlxyXG4gICAqIEByZXR1cm5zIHtTdHJpbmd8bnVsbH0gLSBUaGUgbWVkaWEgcXVlcnkgb2YgdGhlIGJyZWFrcG9pbnQsIG9yIGBudWxsYCBpZiB0aGUgYnJlYWtwb2ludCBkb2Vzbid0IGV4aXN0LlxyXG4gICAqL1xyXG4gIGdldDogZnVuY3Rpb24oc2l6ZSkge1xyXG4gICAgZm9yICh2YXIgaSBpbiB0aGlzLnF1ZXJpZXMpIHtcclxuICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW2ldO1xyXG4gICAgICBpZiAoc2l6ZSA9PT0gcXVlcnkubmFtZSkgcmV0dXJuIHF1ZXJ5LnZhbHVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBudWxsO1xyXG4gIH0sXHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBtZWRpYSBxdWVyeSBoZWxwZXIsIGJ5IGV4dHJhY3RpbmcgdGhlIGJyZWFrcG9pbnQgbGlzdCBmcm9tIHRoZSBDU1MgYW5kIGFjdGl2YXRpbmcgdGhlIGJyZWFrcG9pbnQgd2F0Y2hlci5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF9pbml0OiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuICAgIHZhciBleHRyYWN0ZWRTdHlsZXMgPSAkKCcuZm91bmRhdGlvbi1tcScpLmNzcygnZm9udC1mYW1pbHknKTtcclxuICAgIHZhciBuYW1lZFF1ZXJpZXM7XHJcblxyXG4gICAgbmFtZWRRdWVyaWVzID0gcGFyc2VTdHlsZVRvT2JqZWN0KGV4dHJhY3RlZFN0eWxlcyk7XHJcblxyXG4gICAgZm9yICh2YXIga2V5IGluIG5hbWVkUXVlcmllcykge1xyXG4gICAgICBzZWxmLnF1ZXJpZXMucHVzaCh7XHJcbiAgICAgICAgbmFtZToga2V5LFxyXG4gICAgICAgIHZhbHVlOiAnb25seSBzY3JlZW4gYW5kIChtaW4td2lkdGg6ICcgKyBuYW1lZFF1ZXJpZXNba2V5XSArICcpJ1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLmN1cnJlbnQgPSB0aGlzLl9nZXRDdXJyZW50U2l6ZSgpO1xyXG5cclxuICAgIHRoaXMuX3dhdGNoZXIoKTtcclxuXHJcbiAgICAvLyBFeHRlbmQgZGVmYXVsdCBxdWVyaWVzXHJcbiAgICAvLyBuYW1lZFF1ZXJpZXMgPSAkLmV4dGVuZChkZWZhdWx0UXVlcmllcywgbmFtZWRRdWVyaWVzKTtcclxuICB9LFxyXG5cclxuICAvKipcclxuICAgKiBHZXRzIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQgbmFtZSBieSB0ZXN0aW5nIGV2ZXJ5IGJyZWFrcG9pbnQgYW5kIHJldHVybmluZyB0aGUgbGFzdCBvbmUgdG8gbWF0Y2ggKHRoZSBiaWdnZXN0IG9uZSkuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcmV0dXJucyB7U3RyaW5nfSBOYW1lIG9mIHRoZSBjdXJyZW50IGJyZWFrcG9pbnQuXHJcbiAgICovXHJcbiAgX2dldEN1cnJlbnRTaXplOiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBtYXRjaGVkO1xyXG5cclxuICAgIGZvciAodmFyIGkgaW4gdGhpcy5xdWVyaWVzKSB7XHJcbiAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpXTtcclxuXHJcbiAgICAgIGlmICh3aW5kb3cubWF0Y2hNZWRpYShxdWVyeS52YWx1ZSkubWF0Y2hlcykge1xyXG4gICAgICAgIG1hdGNoZWQgPSBxdWVyeTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmKHR5cGVvZiBtYXRjaGVkID09PSAnb2JqZWN0Jykge1xyXG4gICAgICByZXR1cm4gbWF0Y2hlZC5uYW1lO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgcmV0dXJuIG1hdGNoZWQ7XHJcbiAgICB9XHJcbiAgfSxcclxuXHJcbiAgLyoqXHJcbiAgICogQWN0aXZhdGVzIHRoZSBicmVha3BvaW50IHdhdGNoZXIsIHdoaWNoIGZpcmVzIGFuIGV2ZW50IG9uIHRoZSB3aW5kb3cgd2hlbmV2ZXIgdGhlIGJyZWFrcG9pbnQgY2hhbmdlcy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIF93YXRjaGVyOiBmdW5jdGlvbigpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuemYubWVkaWFxdWVyeScsIGZ1bmN0aW9uKCkge1xyXG4gICAgICB2YXIgbmV3U2l6ZSA9IF90aGlzLl9nZXRDdXJyZW50U2l6ZSgpO1xyXG5cclxuICAgICAgaWYgKG5ld1NpemUgIT09IF90aGlzLmN1cnJlbnQpIHtcclxuICAgICAgICAvLyBCcm9hZGNhc3QgdGhlIG1lZGlhIHF1ZXJ5IGNoYW5nZSBvbiB0aGUgd2luZG93XHJcbiAgICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIFtuZXdTaXplLCBfdGhpcy5jdXJyZW50XSk7XHJcblxyXG4gICAgICAgIC8vIENoYW5nZSB0aGUgY3VycmVudCBtZWRpYSBxdWVyeVxyXG4gICAgICAgIF90aGlzLmN1cnJlbnQgPSBuZXdTaXplO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcblxyXG5Gb3VuZGF0aW9uLk1lZGlhUXVlcnkgPSBNZWRpYVF1ZXJ5O1xyXG5cclxuLy8gbWF0Y2hNZWRpYSgpIHBvbHlmaWxsIC0gVGVzdCBhIENTUyBtZWRpYSB0eXBlL3F1ZXJ5IGluIEpTLlxyXG4vLyBBdXRob3JzICYgY29weXJpZ2h0IChjKSAyMDEyOiBTY290dCBKZWhsLCBQYXVsIElyaXNoLCBOaWNob2xhcyBaYWthcywgRGF2aWQgS25pZ2h0LiBEdWFsIE1JVC9CU0QgbGljZW5zZVxyXG53aW5kb3cubWF0Y2hNZWRpYSB8fCAod2luZG93Lm1hdGNoTWVkaWEgPSBmdW5jdGlvbigpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8vIEZvciBicm93c2VycyB0aGF0IHN1cHBvcnQgbWF0Y2hNZWRpdW0gYXBpIHN1Y2ggYXMgSUUgOSBhbmQgd2Via2l0XHJcbiAgdmFyIHN0eWxlTWVkaWEgPSAod2luZG93LnN0eWxlTWVkaWEgfHwgd2luZG93Lm1lZGlhKTtcclxuXHJcbiAgLy8gRm9yIHRob3NlIHRoYXQgZG9uJ3Qgc3VwcG9ydCBtYXRjaE1lZGl1bVxyXG4gIGlmICghc3R5bGVNZWRpYSkge1xyXG4gICAgdmFyIHN0eWxlICAgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzdHlsZScpLFxyXG4gICAgc2NyaXB0ICAgICAgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF0sXHJcbiAgICBpbmZvICAgICAgICA9IG51bGw7XHJcblxyXG4gICAgc3R5bGUudHlwZSAgPSAndGV4dC9jc3MnO1xyXG4gICAgc3R5bGUuaWQgICAgPSAnbWF0Y2htZWRpYWpzLXRlc3QnO1xyXG5cclxuICAgIHNjcmlwdC5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzdHlsZSwgc2NyaXB0KTtcclxuXHJcbiAgICAvLyAnc3R5bGUuY3VycmVudFN0eWxlJyBpcyB1c2VkIGJ5IElFIDw9IDggYW5kICd3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZScgZm9yIGFsbCBvdGhlciBicm93c2Vyc1xyXG4gICAgaW5mbyA9ICgnZ2V0Q29tcHV0ZWRTdHlsZScgaW4gd2luZG93KSAmJiB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShzdHlsZSwgbnVsbCkgfHwgc3R5bGUuY3VycmVudFN0eWxlO1xyXG5cclxuICAgIHN0eWxlTWVkaWEgPSB7XHJcbiAgICAgIG1hdGNoTWVkaXVtOiBmdW5jdGlvbihtZWRpYSkge1xyXG4gICAgICAgIHZhciB0ZXh0ID0gJ0BtZWRpYSAnICsgbWVkaWEgKyAneyAjbWF0Y2htZWRpYWpzLXRlc3QgeyB3aWR0aDogMXB4OyB9IH0nO1xyXG5cclxuICAgICAgICAvLyAnc3R5bGUuc3R5bGVTaGVldCcgaXMgdXNlZCBieSBJRSA8PSA4IGFuZCAnc3R5bGUudGV4dENvbnRlbnQnIGZvciBhbGwgb3RoZXIgYnJvd3NlcnNcclxuICAgICAgICBpZiAoc3R5bGUuc3R5bGVTaGVldCkge1xyXG4gICAgICAgICAgc3R5bGUuc3R5bGVTaGVldC5jc3NUZXh0ID0gdGV4dDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgc3R5bGUudGV4dENvbnRlbnQgPSB0ZXh0O1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gVGVzdCBpZiBtZWRpYSBxdWVyeSBpcyB0cnVlIG9yIGZhbHNlXHJcbiAgICAgICAgcmV0dXJuIGluZm8ud2lkdGggPT09ICcxcHgnO1xyXG4gICAgICB9XHJcbiAgICB9O1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGZ1bmN0aW9uKG1lZGlhKSB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICBtYXRjaGVzOiBzdHlsZU1lZGlhLm1hdGNoTWVkaXVtKG1lZGlhIHx8ICdhbGwnKSxcclxuICAgICAgbWVkaWE6IG1lZGlhIHx8ICdhbGwnXHJcbiAgICB9O1xyXG4gIH07XHJcbn0oKSk7XHJcblxyXG4vLyBUaGFuayB5b3U6IGh0dHBzOi8vZ2l0aHViLmNvbS9zaW5kcmVzb3JodXMvcXVlcnktc3RyaW5nXHJcbmZ1bmN0aW9uIHBhcnNlU3R5bGVUb09iamVjdChzdHIpIHtcclxuICB2YXIgc3R5bGVPYmplY3QgPSB7fTtcclxuXHJcbiAgaWYgKHR5cGVvZiBzdHIgIT09ICdzdHJpbmcnKSB7XHJcbiAgICByZXR1cm4gc3R5bGVPYmplY3Q7XHJcbiAgfVxyXG5cclxuICBzdHIgPSBzdHIudHJpbSgpLnNsaWNlKDEsIC0xKTsgLy8gYnJvd3NlcnMgcmUtcXVvdGUgc3RyaW5nIHN0eWxlIHZhbHVlc1xyXG5cclxuICBpZiAoIXN0cikge1xyXG4gICAgcmV0dXJuIHN0eWxlT2JqZWN0O1xyXG4gIH1cclxuXHJcbiAgc3R5bGVPYmplY3QgPSBzdHIuc3BsaXQoJyYnKS5yZWR1Y2UoZnVuY3Rpb24ocmV0LCBwYXJhbSkge1xyXG4gICAgdmFyIHBhcnRzID0gcGFyYW0ucmVwbGFjZSgvXFwrL2csICcgJykuc3BsaXQoJz0nKTtcclxuICAgIHZhciBrZXkgPSBwYXJ0c1swXTtcclxuICAgIHZhciB2YWwgPSBwYXJ0c1sxXTtcclxuICAgIGtleSA9IGRlY29kZVVSSUNvbXBvbmVudChrZXkpO1xyXG5cclxuICAgIC8vIG1pc3NpbmcgYD1gIHNob3VsZCBiZSBgbnVsbGA6XHJcbiAgICAvLyBodHRwOi8vdzMub3JnL1RSLzIwMTIvV0QtdXJsLTIwMTIwNTI0LyNjb2xsZWN0LXVybC1wYXJhbWV0ZXJzXHJcbiAgICB2YWwgPSB2YWwgPT09IHVuZGVmaW5lZCA/IG51bGwgOiBkZWNvZGVVUklDb21wb25lbnQodmFsKTtcclxuXHJcbiAgICBpZiAoIXJldC5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XHJcbiAgICAgIHJldFtrZXldID0gdmFsO1xyXG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KHJldFtrZXldKSkge1xyXG4gICAgICByZXRba2V5XS5wdXNoKHZhbCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXRba2V5XSA9IFtyZXRba2V5XSwgdmFsXTtcclxuICAgIH1cclxuICAgIHJldHVybiByZXQ7XHJcbiAgfSwge30pO1xyXG5cclxuICByZXR1cm4gc3R5bGVPYmplY3Q7XHJcbn1cclxuXHJcbn0oalF1ZXJ5LCBGb3VuZGF0aW9uKTtcclxuIiwiLyoqXHJcbiAqIE1vdGlvbiBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5tb3Rpb25cclxuICovXHJcbiFmdW5jdGlvbigkLCBGb3VuZGF0aW9uKSB7XHJcblxyXG52YXIgaW5pdENsYXNzZXMgICA9IFsnbXVpLWVudGVyJywgJ211aS1sZWF2ZSddO1xyXG52YXIgYWN0aXZlQ2xhc3NlcyA9IFsnbXVpLWVudGVyLWFjdGl2ZScsICdtdWktbGVhdmUtYWN0aXZlJ107XHJcblxyXG5mdW5jdGlvbiBhbmltYXRlKGlzSW4sIGVsZW1lbnQsIGFuaW1hdGlvbiwgY2IpIHtcclxuICBlbGVtZW50ID0gJChlbGVtZW50KS5lcSgwKTtcclxuXHJcbiAgaWYgKCFlbGVtZW50Lmxlbmd0aCkgcmV0dXJuO1xyXG5cclxuICB2YXIgaW5pdENsYXNzID0gaXNJbiA/IGluaXRDbGFzc2VzWzBdIDogaW5pdENsYXNzZXNbMV07XHJcbiAgdmFyIGFjdGl2ZUNsYXNzID0gaXNJbiA/IGFjdGl2ZUNsYXNzZXNbMF0gOiBhY3RpdmVDbGFzc2VzWzFdO1xyXG5cclxuICAvLyBTZXQgdXAgdGhlIGFuaW1hdGlvblxyXG4gIHJlc2V0KCk7XHJcbiAgZWxlbWVudC5hZGRDbGFzcyhhbmltYXRpb24pXHJcbiAgICAgICAgIC5jc3MoJ3RyYW5zaXRpb24nLCAnbm9uZScpO1xyXG4gICAgICAgIC8vICAuYWRkQ2xhc3MoaW5pdENsYXNzKTtcclxuICAvLyBpZihpc0luKSBlbGVtZW50LnNob3coKTtcclxuICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XHJcbiAgICBlbGVtZW50LmFkZENsYXNzKGluaXRDbGFzcyk7XHJcbiAgICBpZiAoaXNJbikgZWxlbWVudC5zaG93KCk7XHJcbiAgfSk7XHJcbiAgLy8gU3RhcnQgdGhlIGFuaW1hdGlvblxyXG4gIHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcclxuICAgIGVsZW1lbnRbMF0ub2Zmc2V0V2lkdGg7XHJcbiAgICBlbGVtZW50LmNzcygndHJhbnNpdGlvbicsICcnKTtcclxuICAgIGVsZW1lbnQuYWRkQ2xhc3MoYWN0aXZlQ2xhc3MpO1xyXG4gIH0pO1xyXG4gIC8vIE1vdmUoNTAwLCBlbGVtZW50LCBmdW5jdGlvbigpe1xyXG4gIC8vICAgLy8gZWxlbWVudFswXS5vZmZzZXRXaWR0aDtcclxuICAvLyAgIGVsZW1lbnQuY3NzKCd0cmFuc2l0aW9uJywgJycpO1xyXG4gIC8vICAgZWxlbWVudC5hZGRDbGFzcyhhY3RpdmVDbGFzcyk7XHJcbiAgLy8gfSk7XHJcblxyXG4gIC8vIENsZWFuIHVwIHRoZSBhbmltYXRpb24gd2hlbiBpdCBmaW5pc2hlc1xyXG4gIGVsZW1lbnQub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZChlbGVtZW50KSwgZmluaXNoKTsvLy5vbmUoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBmaW5pc2gpO1xyXG5cclxuICAvLyBIaWRlcyB0aGUgZWxlbWVudCAoZm9yIG91dCBhbmltYXRpb25zKSwgcmVzZXRzIHRoZSBlbGVtZW50LCBhbmQgcnVucyBhIGNhbGxiYWNrXHJcbiAgZnVuY3Rpb24gZmluaXNoKCkge1xyXG4gICAgaWYgKCFpc0luKSBlbGVtZW50LmhpZGUoKTtcclxuICAgIHJlc2V0KCk7XHJcbiAgICBpZiAoY2IpIGNiLmFwcGx5KGVsZW1lbnQpO1xyXG4gIH1cclxuXHJcbiAgLy8gUmVzZXRzIHRyYW5zaXRpb25zIGFuZCByZW1vdmVzIG1vdGlvbi1zcGVjaWZpYyBjbGFzc2VzXHJcbiAgZnVuY3Rpb24gcmVzZXQoKSB7XHJcbiAgICBlbGVtZW50WzBdLnN0eWxlLnRyYW5zaXRpb25EdXJhdGlvbiA9IDA7XHJcbiAgICBlbGVtZW50LnJlbW92ZUNsYXNzKGluaXRDbGFzcyArICcgJyArIGFjdGl2ZUNsYXNzICsgJyAnICsgYW5pbWF0aW9uKTtcclxuICB9XHJcbn1cclxuXHJcbnZhciBNb3Rpb24gPSB7XHJcbiAgYW5pbWF0ZUluOiBmdW5jdGlvbihlbGVtZW50LCBhbmltYXRpb24sIC8qZHVyYXRpb24sKi8gY2IpIHtcclxuICAgIGFuaW1hdGUodHJ1ZSwgZWxlbWVudCwgYW5pbWF0aW9uLCBjYik7XHJcbiAgfSxcclxuXHJcbiAgYW5pbWF0ZU91dDogZnVuY3Rpb24oZWxlbWVudCwgYW5pbWF0aW9uLCAvKmR1cmF0aW9uLCovIGNiKSB7XHJcbiAgICBhbmltYXRlKGZhbHNlLCBlbGVtZW50LCBhbmltYXRpb24sIGNiKTtcclxuICB9XHJcbn07XHJcblxyXG52YXIgTW92ZSA9IGZ1bmN0aW9uKGR1cmF0aW9uLCBlbGVtLCBmbil7XHJcbiAgdmFyIGFuaW0sIHByb2csIHN0YXJ0ID0gbnVsbDtcclxuICAvLyBjb25zb2xlLmxvZygnY2FsbGVkJyk7XHJcblxyXG4gIGZ1bmN0aW9uIG1vdmUodHMpe1xyXG4gICAgaWYoIXN0YXJ0KSBzdGFydCA9IHdpbmRvdy5wZXJmb3JtYW5jZS5ub3coKTtcclxuICAgIC8vIGNvbnNvbGUubG9nKHN0YXJ0LCB0cyk7XHJcbiAgICBwcm9nID0gdHMgLSBzdGFydDtcclxuICAgIGZuLmFwcGx5KGVsZW0pO1xyXG5cclxuICAgIGlmKHByb2cgPCBkdXJhdGlvbil7IGFuaW0gPSB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKG1vdmUsIGVsZW0pOyB9XHJcbiAgICBlbHNle1xyXG4gICAgICB3aW5kb3cuY2FuY2VsQW5pbWF0aW9uRnJhbWUoYW5pbSk7XHJcbiAgICAgIGVsZW0udHJpZ2dlcignZmluaXNoZWQuemYuYW5pbWF0ZScsIFtlbGVtXSkudHJpZ2dlckhhbmRsZXIoJ2ZpbmlzaGVkLnpmLmFuaW1hdGUnLCBbZWxlbV0pO1xyXG4gICAgfVxyXG4gIH1cclxuICBhbmltID0gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShtb3ZlKTtcclxufTtcclxuXHJcbkZvdW5kYXRpb24uTW92ZSA9IE1vdmU7XHJcbkZvdW5kYXRpb24uTW90aW9uID0gTW90aW9uO1xyXG5cclxufShqUXVlcnksIEZvdW5kYXRpb24pO1xyXG4iLCIhZnVuY3Rpb24oJCwgRm91bmRhdGlvbil7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIEZvdW5kYXRpb24uTmVzdCA9IHtcclxuICAgIEZlYXRoZXI6IGZ1bmN0aW9uKG1lbnUsIHR5cGUpe1xyXG4gICAgICBtZW51LmF0dHIoJ3JvbGUnLCAnbWVudWJhcicpO1xyXG4gICAgICB0eXBlID0gdHlwZSB8fCAnemYnO1xyXG4gICAgICB2YXIgaXRlbXMgPSBtZW51LmZpbmQoJ2xpJykuYXR0cih7J3JvbGUnOiAnbWVudWl0ZW0nfSksXHJcbiAgICAgICAgICBzdWJNZW51Q2xhc3MgPSAnaXMtJyArIHR5cGUgKyAnLXN1Ym1lbnUnLFxyXG4gICAgICAgICAgc3ViSXRlbUNsYXNzID0gc3ViTWVudUNsYXNzICsgJy1pdGVtJyxcclxuICAgICAgICAgIGhhc1N1YkNsYXNzID0gJ2lzLScgKyB0eXBlICsgJy1zdWJtZW51LXBhcmVudCc7XHJcbiAgICAgIG1lbnUuZmluZCgnYTpmaXJzdCcpLmF0dHIoJ3RhYmluZGV4JywgMCk7XHJcbiAgICAgIGl0ZW1zLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICB2YXIgJGl0ZW0gPSAkKHRoaXMpLFxyXG4gICAgICAgICAgICAkc3ViID0gJGl0ZW0uY2hpbGRyZW4oJ3VsJyk7XHJcbiAgICAgICAgaWYoJHN1Yi5sZW5ndGgpe1xyXG4gICAgICAgICAgJGl0ZW0uYWRkQ2xhc3MoJ2hhcy1zdWJtZW51ICcgKyBoYXNTdWJDbGFzcylcclxuICAgICAgICAgICAgICAgLmF0dHIoe1xyXG4gICAgICAgICAgICAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAnYXJpYS1zZWxlY3RlZCc6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgJ2FyaWEtbGFiZWwnOiAkaXRlbS5jaGlsZHJlbignYTpmaXJzdCcpLnRleHQoKVxyXG4gICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICRzdWIuYWRkQ2xhc3MoJ3N1Ym1lbnUgJyArIHN1Yk1lbnVDbGFzcylcclxuICAgICAgICAgICAgICAuYXR0cih7XHJcbiAgICAgICAgICAgICAgICAnZGF0YS1zdWJtZW51JzogJycsXHJcbiAgICAgICAgICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgJ3JvbGUnOiAnbWVudSdcclxuICAgICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYoJGl0ZW0ucGFyZW50KCdbZGF0YS1zdWJtZW51XScpLmxlbmd0aCl7XHJcbiAgICAgICAgICAkaXRlbS5hZGRDbGFzcygnaXMtc3VibWVudS1pdGVtICcgKyBzdWJJdGVtQ2xhc3MpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH0sXHJcbiAgICBCdXJuOiBmdW5jdGlvbihtZW51LCB0eXBlKXtcclxuICAgICAgdmFyIGl0ZW1zID0gbWVudS5maW5kKCdsaScpLnJlbW92ZUF0dHIoJ3RhYmluZGV4JyksXHJcbiAgICAgICAgICBzdWJNZW51Q2xhc3MgPSAnaXMtJyArIHR5cGUgKyAnLXN1Ym1lbnUnLFxyXG4gICAgICAgICAgc3ViSXRlbUNsYXNzID0gc3ViTWVudUNsYXNzICsgJy1pdGVtJyxcclxuICAgICAgICAgIGhhc1N1YkNsYXNzID0gJ2lzLScgKyB0eXBlICsgJy1zdWJtZW51LXBhcmVudCc7XHJcblxyXG4gICAgICAvLyBtZW51LmZpbmQoJy5pcy1hY3RpdmUnKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJyk7XHJcbiAgICAgIG1lbnUuZmluZCgnKicpXHJcbiAgICAgIC8vIG1lbnUuZmluZCgnLicgKyBzdWJNZW51Q2xhc3MgKyAnLCAuJyArIHN1Ykl0ZW1DbGFzcyArICcsIC5pcy1hY3RpdmUsIC5oYXMtc3VibWVudSwgLmlzLXN1Ym1lbnUtaXRlbSwgLnN1Ym1lbnUsIFtkYXRhLXN1Ym1lbnVdJylcclxuICAgICAgICAgIC5yZW1vdmVDbGFzcyhzdWJNZW51Q2xhc3MgKyAnICcgKyBzdWJJdGVtQ2xhc3MgKyAnICcgKyBoYXNTdWJDbGFzcyArICcgaGFzLXN1Ym1lbnUgaXMtc3VibWVudS1pdGVtIHN1Ym1lbnUgaXMtYWN0aXZlJylcclxuICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXN1Ym1lbnUnKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XHJcblxyXG4gICAgICAvLyBjb25zb2xlLmxvZyggICAgICBtZW51LmZpbmQoJy4nICsgc3ViTWVudUNsYXNzICsgJywgLicgKyBzdWJJdGVtQ2xhc3MgKyAnLCAuaGFzLXN1Ym1lbnUsIC5pcy1zdWJtZW51LWl0ZW0sIC5zdWJtZW51LCBbZGF0YS1zdWJtZW51XScpXHJcbiAgICAgIC8vICAgICAgICAgICAucmVtb3ZlQ2xhc3Moc3ViTWVudUNsYXNzICsgJyAnICsgc3ViSXRlbUNsYXNzICsgJyBoYXMtc3VibWVudSBpcy1zdWJtZW51LWl0ZW0gc3VibWVudScpXHJcbiAgICAgIC8vICAgICAgICAgICAucmVtb3ZlQXR0cignZGF0YS1zdWJtZW51JykpO1xyXG4gICAgICAvLyBpdGVtcy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIC8vICAgdmFyICRpdGVtID0gJCh0aGlzKSxcclxuICAgICAgLy8gICAgICAgJHN1YiA9ICRpdGVtLmNoaWxkcmVuKCd1bCcpO1xyXG4gICAgICAvLyAgIGlmKCRpdGVtLnBhcmVudCgnW2RhdGEtc3VibWVudV0nKS5sZW5ndGgpe1xyXG4gICAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2lzLXN1Ym1lbnUtaXRlbSAnICsgc3ViSXRlbUNsYXNzKTtcclxuICAgICAgLy8gICB9XHJcbiAgICAgIC8vICAgaWYoJHN1Yi5sZW5ndGgpe1xyXG4gICAgICAvLyAgICAgJGl0ZW0ucmVtb3ZlQ2xhc3MoJ2hhcy1zdWJtZW51Jyk7XHJcbiAgICAgIC8vICAgICAkc3ViLnJlbW92ZUNsYXNzKCdzdWJtZW51ICcgKyBzdWJNZW51Q2xhc3MpLnJlbW92ZUF0dHIoJ2RhdGEtc3VibWVudScpO1xyXG4gICAgICAvLyAgIH1cclxuICAgICAgLy8gfSk7XHJcbiAgICB9XHJcbiAgfTtcclxufShqUXVlcnksIHdpbmRvdy5Gb3VuZGF0aW9uKTtcclxuIiwiIWZ1bmN0aW9uKCQsIEZvdW5kYXRpb24pe1xyXG4gICd1c2Ugc3RyaWN0JztcclxuICB2YXIgVGltZXIgPSBmdW5jdGlvbihlbGVtLCBvcHRpb25zLCBjYil7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgIGR1cmF0aW9uID0gb3B0aW9ucy5kdXJhdGlvbiwvL29wdGlvbnMgaXMgYW4gb2JqZWN0IGZvciBlYXNpbHkgYWRkaW5nIGZlYXR1cmVzIGxhdGVyLlxyXG4gICAgICAgIG5hbWVTcGFjZSA9IE9iamVjdC5rZXlzKGVsZW0uZGF0YSgpKVswXSB8fCAndGltZXInLFxyXG4gICAgICAgIHJlbWFpbiA9IC0xLFxyXG4gICAgICAgIHN0YXJ0LFxyXG4gICAgICAgIHRpbWVyO1xyXG5cclxuICAgIHRoaXMucmVzdGFydCA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIHJlbWFpbiA9IC0xO1xyXG4gICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xyXG4gICAgICB0aGlzLnN0YXJ0KCk7XHJcbiAgICB9O1xyXG5cclxuICAgIHRoaXMuc3RhcnQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAvLyBpZighZWxlbS5kYXRhKCdwYXVzZWQnKSl7IHJldHVybiBmYWxzZTsgfS8vbWF5YmUgaW1wbGVtZW50IHRoaXMgc2FuaXR5IGNoZWNrIGlmIHVzZWQgZm9yIG90aGVyIHRoaW5ncy5cclxuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgICAgcmVtYWluID0gcmVtYWluIDw9IDAgPyBkdXJhdGlvbiA6IHJlbWFpbjtcclxuICAgICAgZWxlbS5kYXRhKCdwYXVzZWQnLCBmYWxzZSk7XHJcbiAgICAgIHN0YXJ0ID0gRGF0ZS5ub3coKTtcclxuICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgaWYob3B0aW9ucy5pbmZpbml0ZSl7XHJcbiAgICAgICAgICBfdGhpcy5yZXN0YXJ0KCk7Ly9yZXJ1biB0aGUgdGltZXIuXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNiKCk7XHJcbiAgICAgIH0sIHJlbWFpbik7XHJcbiAgICAgIGVsZW0udHJpZ2dlcigndGltZXJzdGFydC56Zi4nICsgbmFtZVNwYWNlKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5wYXVzZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgIC8vaWYoZWxlbS5kYXRhKCdwYXVzZWQnKSl7IHJldHVybiBmYWxzZTsgfS8vbWF5YmUgaW1wbGVtZW50IHRoaXMgc2FuaXR5IGNoZWNrIGlmIHVzZWQgZm9yIG90aGVyIHRoaW5ncy5cclxuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgICAgZWxlbS5kYXRhKCdwYXVzZWQnLCB0cnVlKTtcclxuICAgICAgdmFyIGVuZCA9IERhdGUubm93KCk7XHJcbiAgICAgIHJlbWFpbiA9IHJlbWFpbiAtIChlbmQgLSBzdGFydCk7XHJcbiAgICAgIGVsZW0udHJpZ2dlcigndGltZXJwYXVzZWQuemYuJyArIG5hbWVTcGFjZSk7XHJcbiAgICB9O1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogUnVucyBhIGNhbGxiYWNrIGZ1bmN0aW9uIHdoZW4gaW1hZ2VzIGFyZSBmdWxseSBsb2FkZWQuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGltYWdlcyAtIEltYWdlKHMpIHRvIGNoZWNrIGlmIGxvYWRlZC5cclxuICAgKiBAcGFyYW0ge0Z1bmN9IGNhbGxiYWNrIC0gRnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIGltYWdlIGlzIGZ1bGx5IGxvYWRlZC5cclxuICAgKi9cclxuICB2YXIgb25JbWFnZXNMb2FkZWQgPSBmdW5jdGlvbihpbWFnZXMsIGNhbGxiYWNrKXtcclxuICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICB1bmxvYWRlZCA9IGltYWdlcy5sZW5ndGg7XHJcblxyXG4gICAgaWYgKHVubG9hZGVkID09PSAwKSB7XHJcbiAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIHNpbmdsZUltYWdlTG9hZGVkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHVubG9hZGVkLS07XHJcbiAgICAgIGlmICh1bmxvYWRlZCA9PT0gMCkge1xyXG4gICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gICAgaW1hZ2VzLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgIGlmICh0aGlzLmNvbXBsZXRlKSB7XHJcbiAgICAgICAgc2luZ2xlSW1hZ2VMb2FkZWQoKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIGlmICh0eXBlb2YgdGhpcy5uYXR1cmFsV2lkdGggIT09ICd1bmRlZmluZWQnICYmIHRoaXMubmF0dXJhbFdpZHRoID4gMCkge1xyXG4gICAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgJCh0aGlzKS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIHNpbmdsZUltYWdlTG9hZGVkKCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIEZvdW5kYXRpb24uVGltZXIgPSBUaW1lcjtcclxuICBGb3VuZGF0aW9uLm9uSW1hZ2VzTG9hZGVkID0gb25JbWFnZXNMb2FkZWQ7XHJcbn0oalF1ZXJ5LCB3aW5kb3cuRm91bmRhdGlvbik7XHJcbiIsIi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuLy8qKldvcmsgaW5zcGlyZWQgYnkgbXVsdGlwbGUganF1ZXJ5IHN3aXBlIHBsdWdpbnMqKlxyXG4vLyoqRG9uZSBieSBZb2hhaSBBcmFyYXQgKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcbi8vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuKGZ1bmN0aW9uKCQpIHtcclxuXHJcbiAgJC5zcG90U3dpcGUgPSB7XHJcbiAgICB2ZXJzaW9uOiAnMS4wLjAnLFxyXG4gICAgZW5hYmxlZDogJ29udG91Y2hzdGFydCcgaW4gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxyXG4gICAgcHJldmVudERlZmF1bHQ6IHRydWUsXHJcbiAgICBtb3ZlVGhyZXNob2xkOiA3NSxcclxuICAgIHRpbWVUaHJlc2hvbGQ6IDIwMFxyXG4gIH07XHJcblxyXG4gIHZhciAgIHN0YXJ0UG9zWCxcclxuICAgICAgICBzdGFydFBvc1ksXHJcbiAgICAgICAgc3RhcnRUaW1lLFxyXG4gICAgICAgIGVsYXBzZWRUaW1lLFxyXG4gICAgICAgIGlzTW92aW5nID0gZmFsc2U7XHJcblxyXG4gIGZ1bmN0aW9uIG9uVG91Y2hFbmQoKSB7XHJcbiAgICAvLyAgYWxlcnQodGhpcyk7XHJcbiAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlKTtcclxuICAgIHRoaXMucmVtb3ZlRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kKTtcclxuICAgIGlzTW92aW5nID0gZmFsc2U7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBvblRvdWNoTW92ZShlKSB7XHJcbiAgICBpZiAoJC5zcG90U3dpcGUucHJldmVudERlZmF1bHQpIHsgZS5wcmV2ZW50RGVmYXVsdCgpOyB9XHJcbiAgICBpZihpc01vdmluZykge1xyXG4gICAgICB2YXIgeCA9IGUudG91Y2hlc1swXS5wYWdlWDtcclxuICAgICAgdmFyIHkgPSBlLnRvdWNoZXNbMF0ucGFnZVk7XHJcbiAgICAgIHZhciBkeCA9IHN0YXJ0UG9zWCAtIHg7XHJcbiAgICAgIHZhciBkeSA9IHN0YXJ0UG9zWSAtIHk7XHJcbiAgICAgIHZhciBkaXI7XHJcbiAgICAgIGVsYXBzZWRUaW1lID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydFRpbWU7XHJcbiAgICAgIGlmKE1hdGguYWJzKGR4KSA+PSAkLnNwb3RTd2lwZS5tb3ZlVGhyZXNob2xkICYmIGVsYXBzZWRUaW1lIDw9ICQuc3BvdFN3aXBlLnRpbWVUaHJlc2hvbGQpIHtcclxuICAgICAgICBkaXIgPSBkeCA+IDAgPyAnbGVmdCcgOiAncmlnaHQnO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2UgaWYoTWF0aC5hYnMoZHkpID49ICQuc3BvdFN3aXBlLm1vdmVUaHJlc2hvbGQgJiYgZWxhcHNlZFRpbWUgPD0gJC5zcG90U3dpcGUudGltZVRocmVzaG9sZCkge1xyXG4gICAgICAgIGRpciA9IGR5ID4gMCA/ICdkb3duJyA6ICd1cCc7XHJcbiAgICAgIH1cclxuICAgICAgaWYoZGlyKSB7XHJcbiAgICAgICAgb25Ub3VjaEVuZC5jYWxsKHRoaXMpO1xyXG4gICAgICAgICQodGhpcykudHJpZ2dlcignc3dpcGUnLCBkaXIpLnRyaWdnZXIoJ3N3aXBlJyArIGRpcik7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG9uVG91Y2hTdGFydChlKSB7XHJcbiAgICBpZiAoZS50b3VjaGVzLmxlbmd0aCA9PSAxKSB7XHJcbiAgICAgIHN0YXJ0UG9zWCA9IGUudG91Y2hlc1swXS5wYWdlWDtcclxuICAgICAgc3RhcnRQb3NZID0gZS50b3VjaGVzWzBdLnBhZ2VZO1xyXG4gICAgICBpc01vdmluZyA9IHRydWU7XHJcbiAgICAgIHN0YXJ0VGltZSA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xyXG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoJ3RvdWNobW92ZScsIG9uVG91Y2hNb3ZlLCBmYWxzZSk7XHJcbiAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hlbmQnLCBvblRvdWNoRW5kLCBmYWxzZSk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBpbml0KCkge1xyXG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyICYmIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcigndG91Y2hzdGFydCcsIG9uVG91Y2hTdGFydCwgZmFsc2UpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gdGVhcmRvd24oKSB7XHJcbiAgICB0aGlzLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ3RvdWNoc3RhcnQnLCBvblRvdWNoU3RhcnQpO1xyXG4gIH1cclxuXHJcbiAgJC5ldmVudC5zcGVjaWFsLnN3aXBlID0geyBzZXR1cDogaW5pdCB9O1xyXG5cclxuICAkLmVhY2goWydsZWZ0JywgJ3VwJywgJ2Rvd24nLCAncmlnaHQnXSwgZnVuY3Rpb24gKCkge1xyXG4gICAgJC5ldmVudC5zcGVjaWFsWydzd2lwZScgKyB0aGlzXSA9IHsgc2V0dXA6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICQodGhpcykub24oJ3N3aXBlJywgJC5ub29wKTtcclxuICAgIH0gfTtcclxuICB9KTtcclxufSkoalF1ZXJ5KTtcclxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICogTWV0aG9kIGZvciBhZGRpbmcgcHN1ZWRvIGRyYWcgZXZlbnRzIHRvIGVsZW1lbnRzICpcclxuICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cclxuIWZ1bmN0aW9uKCQpe1xyXG4gICQuZm4uYWRkVG91Y2ggPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy5lYWNoKGZ1bmN0aW9uKGksZWwpe1xyXG4gICAgICAkKGVsKS5iaW5kKCd0b3VjaHN0YXJ0IHRvdWNobW92ZSB0b3VjaGVuZCB0b3VjaGNhbmNlbCcsZnVuY3Rpb24oKXtcclxuICAgICAgICAvL3dlIHBhc3MgdGhlIG9yaWdpbmFsIGV2ZW50IG9iamVjdCBiZWNhdXNlIHRoZSBqUXVlcnkgZXZlbnRcclxuICAgICAgICAvL29iamVjdCBpcyBub3JtYWxpemVkIHRvIHczYyBzcGVjcyBhbmQgZG9lcyBub3QgcHJvdmlkZSB0aGUgVG91Y2hMaXN0XHJcbiAgICAgICAgaGFuZGxlVG91Y2goZXZlbnQpO1xyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBoYW5kbGVUb3VjaCA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICAgICAgdmFyIHRvdWNoZXMgPSBldmVudC5jaGFuZ2VkVG91Y2hlcyxcclxuICAgICAgICAgIGZpcnN0ID0gdG91Y2hlc1swXSxcclxuICAgICAgICAgIGV2ZW50VHlwZXMgPSB7XHJcbiAgICAgICAgICAgIHRvdWNoc3RhcnQ6ICdtb3VzZWRvd24nLFxyXG4gICAgICAgICAgICB0b3VjaG1vdmU6ICdtb3VzZW1vdmUnLFxyXG4gICAgICAgICAgICB0b3VjaGVuZDogJ21vdXNldXAnXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgdHlwZSA9IGV2ZW50VHlwZXNbZXZlbnQudHlwZV07XHJcblxyXG4gICAgICB2YXIgc2ltdWxhdGVkRXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnTW91c2VFdmVudCcpO1xyXG4gICAgICBzaW11bGF0ZWRFdmVudC5pbml0TW91c2VFdmVudCh0eXBlLCB0cnVlLCB0cnVlLCB3aW5kb3csIDEsIGZpcnN0LnNjcmVlblgsIGZpcnN0LnNjcmVlblksIGZpcnN0LmNsaWVudFgsIGZpcnN0LmNsaWVudFksIGZhbHNlLCBmYWxzZSwgZmFsc2UsIGZhbHNlLCAwLypsZWZ0Ki8sIG51bGwpO1xyXG4gICAgICBmaXJzdC50YXJnZXQuZGlzcGF0Y2hFdmVudChzaW11bGF0ZWRFdmVudCk7XHJcbiAgICB9O1xyXG4gIH07XHJcbn0oalF1ZXJ5KTtcclxuXHJcblxyXG4vLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuLy8qKkZyb20gdGhlIGpRdWVyeSBNb2JpbGUgTGlicmFyeSoqXHJcbi8vKipuZWVkIHRvIHJlY3JlYXRlIGZ1bmN0aW9uYWxpdHkqKlxyXG4vLyoqYW5kIHRyeSB0byBpbXByb3ZlIGlmIHBvc3NpYmxlKipcclxuLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcblxyXG4vKiBSZW1vdmluZyB0aGUgalF1ZXJ5IGZ1bmN0aW9uICoqKipcclxuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXHJcblxyXG4oZnVuY3Rpb24oICQsIHdpbmRvdywgdW5kZWZpbmVkICkge1xyXG5cclxuXHR2YXIgJGRvY3VtZW50ID0gJCggZG9jdW1lbnQgKSxcclxuXHRcdC8vIHN1cHBvcnRUb3VjaCA9ICQubW9iaWxlLnN1cHBvcnQudG91Y2gsXHJcblx0XHR0b3VjaFN0YXJ0RXZlbnQgPSAndG91Y2hzdGFydCcvL3N1cHBvcnRUb3VjaCA/IFwidG91Y2hzdGFydFwiIDogXCJtb3VzZWRvd25cIixcclxuXHRcdHRvdWNoU3RvcEV2ZW50ID0gJ3RvdWNoZW5kJy8vc3VwcG9ydFRvdWNoID8gXCJ0b3VjaGVuZFwiIDogXCJtb3VzZXVwXCIsXHJcblx0XHR0b3VjaE1vdmVFdmVudCA9ICd0b3VjaG1vdmUnLy9zdXBwb3J0VG91Y2ggPyBcInRvdWNobW92ZVwiIDogXCJtb3VzZW1vdmVcIjtcclxuXHJcblx0Ly8gc2V0dXAgbmV3IGV2ZW50IHNob3J0Y3V0c1xyXG5cdCQuZWFjaCggKCBcInRvdWNoc3RhcnQgdG91Y2htb3ZlIHRvdWNoZW5kIFwiICtcclxuXHRcdFwic3dpcGUgc3dpcGVsZWZ0IHN3aXBlcmlnaHRcIiApLnNwbGl0KCBcIiBcIiApLCBmdW5jdGlvbiggaSwgbmFtZSApIHtcclxuXHJcblx0XHQkLmZuWyBuYW1lIF0gPSBmdW5jdGlvbiggZm4gKSB7XHJcblx0XHRcdHJldHVybiBmbiA/IHRoaXMuYmluZCggbmFtZSwgZm4gKSA6IHRoaXMudHJpZ2dlciggbmFtZSApO1xyXG5cdFx0fTtcclxuXHJcblx0XHQvLyBqUXVlcnkgPCAxLjhcclxuXHRcdGlmICggJC5hdHRyRm4gKSB7XHJcblx0XHRcdCQuYXR0ckZuWyBuYW1lIF0gPSB0cnVlO1xyXG5cdFx0fVxyXG5cdH0pO1xyXG5cclxuXHRmdW5jdGlvbiB0cmlnZ2VyQ3VzdG9tRXZlbnQoIG9iaiwgZXZlbnRUeXBlLCBldmVudCwgYnViYmxlICkge1xyXG5cdFx0dmFyIG9yaWdpbmFsVHlwZSA9IGV2ZW50LnR5cGU7XHJcblx0XHRldmVudC50eXBlID0gZXZlbnRUeXBlO1xyXG5cdFx0aWYgKCBidWJibGUgKSB7XHJcblx0XHRcdCQuZXZlbnQudHJpZ2dlciggZXZlbnQsIHVuZGVmaW5lZCwgb2JqICk7XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHQkLmV2ZW50LmRpc3BhdGNoLmNhbGwoIG9iaiwgZXZlbnQgKTtcclxuXHRcdH1cclxuXHRcdGV2ZW50LnR5cGUgPSBvcmlnaW5hbFR5cGU7XHJcblx0fVxyXG5cclxuXHQvLyBhbHNvIGhhbmRsZXMgdGFwaG9sZFxyXG5cclxuXHQvLyBBbHNvIGhhbmRsZXMgc3dpcGVsZWZ0LCBzd2lwZXJpZ2h0XHJcblx0JC5ldmVudC5zcGVjaWFsLnN3aXBlID0ge1xyXG5cclxuXHRcdC8vIE1vcmUgdGhhbiB0aGlzIGhvcml6b250YWwgZGlzcGxhY2VtZW50LCBhbmQgd2Ugd2lsbCBzdXBwcmVzcyBzY3JvbGxpbmcuXHJcblx0XHRzY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkOiAzMCxcclxuXHJcblx0XHQvLyBNb3JlIHRpbWUgdGhhbiB0aGlzLCBhbmQgaXQgaXNuJ3QgYSBzd2lwZS5cclxuXHRcdGR1cmF0aW9uVGhyZXNob2xkOiAxMDAwLFxyXG5cclxuXHRcdC8vIFN3aXBlIGhvcml6b250YWwgZGlzcGxhY2VtZW50IG11c3QgYmUgbW9yZSB0aGFuIHRoaXMuXHJcblx0XHRob3Jpem9udGFsRGlzdGFuY2VUaHJlc2hvbGQ6IHdpbmRvdy5kZXZpY2VQaXhlbFJhdGlvID49IDIgPyAxNSA6IDMwLFxyXG5cclxuXHRcdC8vIFN3aXBlIHZlcnRpY2FsIGRpc3BsYWNlbWVudCBtdXN0IGJlIGxlc3MgdGhhbiB0aGlzLlxyXG5cdFx0dmVydGljYWxEaXN0YW5jZVRocmVzaG9sZDogd2luZG93LmRldmljZVBpeGVsUmF0aW8gPj0gMiA/IDE1IDogMzAsXHJcblxyXG5cdFx0Z2V0TG9jYXRpb246IGZ1bmN0aW9uICggZXZlbnQgKSB7XHJcblx0XHRcdHZhciB3aW5QYWdlWCA9IHdpbmRvdy5wYWdlWE9mZnNldCxcclxuXHRcdFx0XHR3aW5QYWdlWSA9IHdpbmRvdy5wYWdlWU9mZnNldCxcclxuXHRcdFx0XHR4ID0gZXZlbnQuY2xpZW50WCxcclxuXHRcdFx0XHR5ID0gZXZlbnQuY2xpZW50WTtcclxuXHJcblx0XHRcdGlmICggZXZlbnQucGFnZVkgPT09IDAgJiYgTWF0aC5mbG9vciggeSApID4gTWF0aC5mbG9vciggZXZlbnQucGFnZVkgKSB8fFxyXG5cdFx0XHRcdGV2ZW50LnBhZ2VYID09PSAwICYmIE1hdGguZmxvb3IoIHggKSA+IE1hdGguZmxvb3IoIGV2ZW50LnBhZ2VYICkgKSB7XHJcblxyXG5cdFx0XHRcdC8vIGlPUzQgY2xpZW50WC9jbGllbnRZIGhhdmUgdGhlIHZhbHVlIHRoYXQgc2hvdWxkIGhhdmUgYmVlblxyXG5cdFx0XHRcdC8vIGluIHBhZ2VYL3BhZ2VZLiBXaGlsZSBwYWdlWC9wYWdlLyBoYXZlIHRoZSB2YWx1ZSAwXHJcblx0XHRcdFx0eCA9IHggLSB3aW5QYWdlWDtcclxuXHRcdFx0XHR5ID0geSAtIHdpblBhZ2VZO1xyXG5cdFx0XHR9IGVsc2UgaWYgKCB5IDwgKCBldmVudC5wYWdlWSAtIHdpblBhZ2VZKSB8fCB4IDwgKCBldmVudC5wYWdlWCAtIHdpblBhZ2VYICkgKSB7XHJcblxyXG5cdFx0XHRcdC8vIFNvbWUgQW5kcm9pZCBicm93c2VycyBoYXZlIHRvdGFsbHkgYm9ndXMgdmFsdWVzIGZvciBjbGllbnRYL1lcclxuXHRcdFx0XHQvLyB3aGVuIHNjcm9sbGluZy96b29taW5nIGEgcGFnZS4gRGV0ZWN0YWJsZSBzaW5jZSBjbGllbnRYL2NsaWVudFlcclxuXHRcdFx0XHQvLyBzaG91bGQgbmV2ZXIgYmUgc21hbGxlciB0aGFuIHBhZ2VYL3BhZ2VZIG1pbnVzIHBhZ2Ugc2Nyb2xsXHJcblx0XHRcdFx0eCA9IGV2ZW50LnBhZ2VYIC0gd2luUGFnZVg7XHJcblx0XHRcdFx0eSA9IGV2ZW50LnBhZ2VZIC0gd2luUGFnZVk7XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0eDogeCxcclxuXHRcdFx0XHR5OiB5XHJcblx0XHRcdH07XHJcblx0XHR9LFxyXG5cclxuXHRcdHN0YXJ0OiBmdW5jdGlvbiggZXZlbnQgKSB7XHJcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cclxuXHRcdFx0XHRcdGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1sgMCBdIDogZXZlbnQsXHJcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdFx0dGltZTogKCBuZXcgRGF0ZSgpICkuZ2V0VGltZSgpLFxyXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdLFxyXG5cdFx0XHRcdFx0XHRvcmlnaW46ICQoIGV2ZW50LnRhcmdldCApXHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0fSxcclxuXHJcblx0XHRzdG9wOiBmdW5jdGlvbiggZXZlbnQgKSB7XHJcblx0XHRcdHZhciBkYXRhID0gZXZlbnQub3JpZ2luYWxFdmVudC50b3VjaGVzID9cclxuXHRcdFx0XHRcdGV2ZW50Lm9yaWdpbmFsRXZlbnQudG91Y2hlc1sgMCBdIDogZXZlbnQsXHJcblx0XHRcdFx0bG9jYXRpb24gPSAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZ2V0TG9jYXRpb24oIGRhdGEgKTtcclxuXHRcdFx0cmV0dXJuIHtcclxuXHRcdFx0XHRcdFx0dGltZTogKCBuZXcgRGF0ZSgpICkuZ2V0VGltZSgpLFxyXG5cdFx0XHRcdFx0XHRjb29yZHM6IFsgbG9jYXRpb24ueCwgbG9jYXRpb24ueSBdXHJcblx0XHRcdFx0XHR9O1xyXG5cdFx0fSxcclxuXHJcblx0XHRoYW5kbGVTd2lwZTogZnVuY3Rpb24oIHN0YXJ0LCBzdG9wLCB0aGlzT2JqZWN0LCBvcmlnVGFyZ2V0ICkge1xyXG5cdFx0XHRpZiAoIHN0b3AudGltZSAtIHN0YXJ0LnRpbWUgPCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZHVyYXRpb25UaHJlc2hvbGQgJiZcclxuXHRcdFx0XHRNYXRoLmFicyggc3RhcnQuY29vcmRzWyAwIF0gLSBzdG9wLmNvb3Jkc1sgMCBdICkgPiAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuaG9yaXpvbnRhbERpc3RhbmNlVGhyZXNob2xkICYmXHJcblx0XHRcdFx0TWF0aC5hYnMoIHN0YXJ0LmNvb3Jkc1sgMSBdIC0gc3RvcC5jb29yZHNbIDEgXSApIDwgJC5ldmVudC5zcGVjaWFsLnN3aXBlLnZlcnRpY2FsRGlzdGFuY2VUaHJlc2hvbGQgKSB7XHJcblx0XHRcdFx0dmFyIGRpcmVjdGlvbiA9IHN0YXJ0LmNvb3Jkc1swXSA+IHN0b3AuY29vcmRzWyAwIF0gPyBcInN3aXBlbGVmdFwiIDogXCJzd2lwZXJpZ2h0XCI7XHJcblxyXG5cdFx0XHRcdHRyaWdnZXJDdXN0b21FdmVudCggdGhpc09iamVjdCwgXCJzd2lwZVwiLCAkLkV2ZW50KCBcInN3aXBlXCIsIHsgdGFyZ2V0OiBvcmlnVGFyZ2V0LCBzd2lwZXN0YXJ0OiBzdGFydCwgc3dpcGVzdG9wOiBzdG9wIH0pLCB0cnVlICk7XHJcblx0XHRcdFx0dHJpZ2dlckN1c3RvbUV2ZW50KCB0aGlzT2JqZWN0LCBkaXJlY3Rpb24sJC5FdmVudCggZGlyZWN0aW9uLCB7IHRhcmdldDogb3JpZ1RhcmdldCwgc3dpcGVzdGFydDogc3RhcnQsIHN3aXBlc3RvcDogc3RvcCB9ICksIHRydWUgKTtcclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gZmFsc2U7XHJcblxyXG5cdFx0fSxcclxuXHJcblx0XHQvLyBUaGlzIHNlcnZlcyBhcyBhIGZsYWcgdG8gZW5zdXJlIHRoYXQgYXQgbW9zdCBvbmUgc3dpcGUgZXZlbnQgZXZlbnQgaXNcclxuXHRcdC8vIGluIHdvcmsgYXQgYW55IGdpdmVuIHRpbWVcclxuXHRcdGV2ZW50SW5Qcm9ncmVzczogZmFsc2UsXHJcblxyXG5cdFx0c2V0dXA6IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHR2YXIgZXZlbnRzLFxyXG5cdFx0XHRcdHRoaXNPYmplY3QgPSB0aGlzLFxyXG5cdFx0XHRcdCR0aGlzID0gJCggdGhpc09iamVjdCApLFxyXG5cdFx0XHRcdGNvbnRleHQgPSB7fTtcclxuXHJcblx0XHRcdC8vIFJldHJpZXZlIHRoZSBldmVudHMgZGF0YSBmb3IgdGhpcyBlbGVtZW50IGFuZCBhZGQgdGhlIHN3aXBlIGNvbnRleHRcclxuXHRcdFx0ZXZlbnRzID0gJC5kYXRhKCB0aGlzLCBcIm1vYmlsZS1ldmVudHNcIiApO1xyXG5cdFx0XHRpZiAoICFldmVudHMgKSB7XHJcblx0XHRcdFx0ZXZlbnRzID0geyBsZW5ndGg6IDAgfTtcclxuXHRcdFx0XHQkLmRhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiLCBldmVudHMgKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRldmVudHMubGVuZ3RoKys7XHJcblx0XHRcdGV2ZW50cy5zd2lwZSA9IGNvbnRleHQ7XHJcblxyXG5cdFx0XHRjb250ZXh0LnN0YXJ0ID0gZnVuY3Rpb24oIGV2ZW50ICkge1xyXG5cclxuXHRcdFx0XHQvLyBCYWlsIGlmIHdlJ3JlIGFscmVhZHkgd29ya2luZyBvbiBhIHN3aXBlIGV2ZW50XHJcblx0XHRcdFx0aWYgKCAkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzICkge1xyXG5cdFx0XHRcdFx0cmV0dXJuO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gdHJ1ZTtcclxuXHJcblx0XHRcdFx0dmFyIHN0b3AsXHJcblx0XHRcdFx0XHRzdGFydCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdGFydCggZXZlbnQgKSxcclxuXHRcdFx0XHRcdG9yaWdUYXJnZXQgPSBldmVudC50YXJnZXQsXHJcblx0XHRcdFx0XHRlbWl0dGVkID0gZmFsc2U7XHJcblxyXG5cdFx0XHRcdGNvbnRleHQubW92ZSA9IGZ1bmN0aW9uKCBldmVudCApIHtcclxuXHRcdFx0XHRcdGlmICggIXN0YXJ0IHx8IGV2ZW50LmlzRGVmYXVsdFByZXZlbnRlZCgpICkge1xyXG5cdFx0XHRcdFx0XHRyZXR1cm47XHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0c3RvcCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zdG9wKCBldmVudCApO1xyXG5cdFx0XHRcdFx0aWYgKCAhZW1pdHRlZCApIHtcclxuXHRcdFx0XHRcdFx0ZW1pdHRlZCA9ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5oYW5kbGVTd2lwZSggc3RhcnQsIHN0b3AsIHRoaXNPYmplY3QsIG9yaWdUYXJnZXQgKTtcclxuXHRcdFx0XHRcdFx0aWYgKCBlbWl0dGVkICkge1xyXG5cclxuXHRcdFx0XHRcdFx0XHQvLyBSZXNldCB0aGUgY29udGV4dCB0byBtYWtlIHdheSBmb3IgdGhlIG5leHQgc3dpcGUgZXZlbnRcclxuXHRcdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdC8vIHByZXZlbnQgc2Nyb2xsaW5nXHJcblx0XHRcdFx0XHRpZiAoIE1hdGguYWJzKCBzdGFydC5jb29yZHNbIDAgXSAtIHN0b3AuY29vcmRzWyAwIF0gKSA+ICQuZXZlbnQuc3BlY2lhbC5zd2lwZS5zY3JvbGxTdXByZXNzaW9uVGhyZXNob2xkICkge1xyXG5cdFx0XHRcdFx0XHRldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH07XHJcblxyXG5cdFx0XHRcdGNvbnRleHQuc3RvcCA9IGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRcdFx0XHRlbWl0dGVkID0gdHJ1ZTtcclxuXHJcblx0XHRcdFx0XHRcdC8vIFJlc2V0IHRoZSBjb250ZXh0IHRvIG1ha2Ugd2F5IGZvciB0aGUgbmV4dCBzd2lwZSBldmVudFxyXG5cdFx0XHRcdFx0XHQkLmV2ZW50LnNwZWNpYWwuc3dpcGUuZXZlbnRJblByb2dyZXNzID0gZmFsc2U7XHJcblx0XHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKTtcclxuXHRcdFx0XHRcdFx0Y29udGV4dC5tb3ZlID0gbnVsbDtcclxuXHRcdFx0XHR9O1xyXG5cclxuXHRcdFx0XHQkZG9jdW1lbnQub24oIHRvdWNoTW92ZUV2ZW50LCBjb250ZXh0Lm1vdmUgKVxyXG5cdFx0XHRcdFx0Lm9uZSggdG91Y2hTdG9wRXZlbnQsIGNvbnRleHQuc3RvcCApO1xyXG5cdFx0XHR9O1xyXG5cdFx0XHQkdGhpcy5vbiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XHJcblx0XHR9LFxyXG5cclxuXHRcdHRlYXJkb3duOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0dmFyIGV2ZW50cywgY29udGV4dDtcclxuXHJcblx0XHRcdGV2ZW50cyA9ICQuZGF0YSggdGhpcywgXCJtb2JpbGUtZXZlbnRzXCIgKTtcclxuXHRcdFx0aWYgKCBldmVudHMgKSB7XHJcblx0XHRcdFx0Y29udGV4dCA9IGV2ZW50cy5zd2lwZTtcclxuXHRcdFx0XHRkZWxldGUgZXZlbnRzLnN3aXBlO1xyXG5cdFx0XHRcdGV2ZW50cy5sZW5ndGgtLTtcclxuXHRcdFx0XHRpZiAoIGV2ZW50cy5sZW5ndGggPT09IDAgKSB7XHJcblx0XHRcdFx0XHQkLnJlbW92ZURhdGEoIHRoaXMsIFwibW9iaWxlLWV2ZW50c1wiICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAoIGNvbnRleHQgKSB7XHJcblx0XHRcdFx0aWYgKCBjb250ZXh0LnN0YXJ0ICkge1xyXG5cdFx0XHRcdFx0JCggdGhpcyApLm9mZiggdG91Y2hTdGFydEV2ZW50LCBjb250ZXh0LnN0YXJ0ICk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGlmICggY29udGV4dC5tb3ZlICkge1xyXG5cdFx0XHRcdFx0JGRvY3VtZW50Lm9mZiggdG91Y2hNb3ZlRXZlbnQsIGNvbnRleHQubW92ZSApO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRpZiAoIGNvbnRleHQuc3RvcCApIHtcclxuXHRcdFx0XHRcdCRkb2N1bWVudC5vZmYoIHRvdWNoU3RvcEV2ZW50LCBjb250ZXh0LnN0b3AgKTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9O1xyXG5cdCQuZWFjaCh7XHJcblx0XHRzd2lwZWxlZnQ6IFwic3dpcGUubGVmdFwiLFxyXG5cdFx0c3dpcGVyaWdodDogXCJzd2lwZS5yaWdodFwiXHJcblx0fSwgZnVuY3Rpb24oIGV2ZW50LCBzb3VyY2VFdmVudCApIHtcclxuXHJcblx0XHQkLmV2ZW50LnNwZWNpYWxbIGV2ZW50IF0gPSB7XHJcblx0XHRcdHNldHVwOiBmdW5jdGlvbigpIHtcclxuXHRcdFx0XHQkKCB0aGlzICkuYmluZCggc291cmNlRXZlbnQsICQubm9vcCApO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHR0ZWFyZG93bjogZnVuY3Rpb24oKSB7XHJcblx0XHRcdFx0JCggdGhpcyApLnVuYmluZCggc291cmNlRXZlbnQgKTtcclxuXHRcdFx0fVxyXG5cdFx0fTtcclxuXHR9KTtcclxufSkoIGpRdWVyeSwgdGhpcyApO1xyXG4qL1xyXG4iLCIhZnVuY3Rpb24oRm91bmRhdGlvbiwgJCkge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuICAvLyBFbGVtZW50cyB3aXRoIFtkYXRhLW9wZW5dIHdpbGwgcmV2ZWFsIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxyXG4gICQoZG9jdW1lbnQpLm9uKCdjbGljay56Zi50cmlnZ2VyJywgJ1tkYXRhLW9wZW5dJywgZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgaWQgPSAkKHRoaXMpLmRhdGEoJ29wZW4nKTtcclxuICAgICQoJyMnICsgaWQpLnRyaWdnZXJIYW5kbGVyKCdvcGVuLnpmLnRyaWdnZXInLCBbJCh0aGlzKV0pO1xyXG4gIH0pO1xyXG5cclxuICAvLyBFbGVtZW50cyB3aXRoIFtkYXRhLWNsb3NlXSB3aWxsIGNsb3NlIGEgcGx1Z2luIHRoYXQgc3VwcG9ydHMgaXQgd2hlbiBjbGlja2VkLlxyXG4gIC8vIElmIHVzZWQgd2l0aG91dCBhIHZhbHVlIG9uIFtkYXRhLWNsb3NlXSwgdGhlIGV2ZW50IHdpbGwgYnViYmxlLCBhbGxvd2luZyBpdCB0byBjbG9zZSBhIHBhcmVudCBjb21wb25lbnQuXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtY2xvc2VdJywgZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgaWQgPSAkKHRoaXMpLmRhdGEoJ2Nsb3NlJyk7XHJcbiAgICBpZiAoaWQpIHtcclxuICAgICAgJCgnIycgKyBpZCkudHJpZ2dlckhhbmRsZXIoJ2Nsb3NlLnpmLnRyaWdnZXInLCBbJCh0aGlzKV0pO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgICQodGhpcykudHJpZ2dlcignY2xvc2UuemYudHJpZ2dlcicpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBFbGVtZW50cyB3aXRoIFtkYXRhLXRvZ2dsZV0gd2lsbCB0b2dnbGUgYSBwbHVnaW4gdGhhdCBzdXBwb3J0cyBpdCB3aGVuIGNsaWNrZWQuXHJcbiAgJChkb2N1bWVudCkub24oJ2NsaWNrLnpmLnRyaWdnZXInLCAnW2RhdGEtdG9nZ2xlXScsIGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIGlkID0gJCh0aGlzKS5kYXRhKCd0b2dnbGUnKTtcclxuICAgICQoJyMnICsgaWQpLnRyaWdnZXJIYW5kbGVyKCd0b2dnbGUuemYudHJpZ2dlcicsIFskKHRoaXMpXSk7XHJcbiAgfSk7XHJcblxyXG4gIC8vIEVsZW1lbnRzIHdpdGggW2RhdGEtY2xvc2FibGVdIHdpbGwgcmVzcG9uZCB0byBjbG9zZS56Zi50cmlnZ2VyIGV2ZW50cy5cclxuICAkKGRvY3VtZW50KS5vbignY2xvc2UuemYudHJpZ2dlcicsICdbZGF0YS1jbG9zYWJsZV0nLCBmdW5jdGlvbigpIHtcclxuICAgIHZhciBhbmltYXRpb24gPSAkKHRoaXMpLmRhdGEoJ2Nsb3NhYmxlJykgfHwgJ2ZhZGUtb3V0JztcclxuICAgIGlmKEZvdW5kYXRpb24uTW90aW9uKXtcclxuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCgkKHRoaXMpLCBhbmltYXRpb24sIGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICQodGhpcykudHJpZ2dlcignY2xvc2VkLnpmJyk7XHJcbiAgICAgIH0pO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgICQodGhpcykuZmFkZU91dCgpLnRyaWdnZXIoJ2Nsb3NlZC56ZicpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICB2YXIgTXV0YXRpb25PYnNlcnZlciA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgcHJlZml4ZXMgPSBbJ1dlYktpdCcsICdNb3onLCAnTycsICdNcycsICcnXTtcclxuICAgIGZvciAodmFyIGk9MDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIGlmIChwcmVmaXhlc1tpXSArICdNdXRhdGlvbk9ic2VydmVyJyBpbiB3aW5kb3cpIHtcclxuICAgICAgICByZXR1cm4gd2luZG93W3ByZWZpeGVzW2ldICsgJ011dGF0aW9uT2JzZXJ2ZXInXTtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH0oKSk7XHJcblxyXG5cclxuICB2YXIgY2hlY2tMaXN0ZW5lcnMgPSBmdW5jdGlvbigpe1xyXG4gICAgZXZlbnRzTGlzdGVuZXIoKTtcclxuICAgIHJlc2l6ZUxpc3RlbmVyKCk7XHJcbiAgICBzY3JvbGxMaXN0ZW5lcigpO1xyXG4gICAgY2xvc2VtZUxpc3RlbmVyKCk7XHJcbiAgfTtcclxuICAvKipcclxuICAqIEZpcmVzIG9uY2UgYWZ0ZXIgYWxsIG90aGVyIHNjcmlwdHMgaGF2ZSBsb2FkZWRcclxuICAqIEBmdW5jdGlvblxyXG4gICogQHByaXZhdGVcclxuICAqL1xyXG4gICQod2luZG93KS5sb2FkKGZ1bmN0aW9uKCl7XHJcbiAgICBjaGVja0xpc3RlbmVycygpO1xyXG4gIH0pO1xyXG5cclxuICAvLyoqKioqKioqIG9ubHkgZmlyZXMgdGhpcyBmdW5jdGlvbiBvbmNlIG9uIGxvYWQsIGlmIHRoZXJlJ3Mgc29tZXRoaW5nIHRvIHdhdGNoICoqKioqKioqXHJcbiAgdmFyIGNsb3NlbWVMaXN0ZW5lciA9IGZ1bmN0aW9uKHBsdWdpbk5hbWUpe1xyXG4gICAgdmFyIHlldGlCb3hlcyA9ICQoJ1tkYXRhLXlldGktYm94XScpLFxyXG4gICAgICAgIHBsdWdOYW1lcyA9IFsnZHJvcGRvd24nLCAndG9vbHRpcCcsICdyZXZlYWwnXTtcclxuXHJcbiAgICBpZihwbHVnaW5OYW1lKXtcclxuICAgICAgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdzdHJpbmcnKXtcclxuICAgICAgICBwbHVnTmFtZXMucHVzaChwbHVnaW5OYW1lKTtcclxuICAgICAgfWVsc2UgaWYodHlwZW9mIHBsdWdpbk5hbWUgPT09ICdvYmplY3QnICYmIHR5cGVvZiBwbHVnaW5OYW1lWzBdID09PSAnc3RyaW5nJyl7XHJcbiAgICAgICAgcGx1Z05hbWVzLmNvbmNhdChwbHVnaW5OYW1lKTtcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignUGx1Z2luIG5hbWVzIG11c3QgYmUgc3RyaW5ncycpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBpZih5ZXRpQm94ZXMubGVuZ3RoKXtcclxuICAgICAgdmFyIGxpc3RlbmVycyA9IHBsdWdOYW1lcy5tYXAoZnVuY3Rpb24obmFtZSl7XHJcbiAgICAgICAgcmV0dXJuICdjbG9zZW1lLnpmLicgKyBuYW1lO1xyXG4gICAgICB9KS5qb2luKCcgJyk7XHJcblxyXG4gICAgICAkKHdpbmRvdykub2ZmKGxpc3RlbmVycykub24obGlzdGVuZXJzLCBmdW5jdGlvbihlLCBwbHVnaW5JZCl7XHJcbiAgICAgICAgdmFyIHBsdWdpbiA9IGUubmFtZXNwYWNlLnNwbGl0KCcuJylbMF07XHJcbiAgICAgICAgdmFyIHBsdWdpbnMgPSAkKCdbZGF0YS0nICsgcGx1Z2luICsgJ10nKS5ub3QoJ1tkYXRhLXlldGktYm94PVwiJyArIHBsdWdpbklkICsgJ1wiXScpO1xyXG5cclxuICAgICAgICBwbHVnaW5zLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgICAgIHZhciBfdGhpcyA9ICQodGhpcyk7XHJcblxyXG4gICAgICAgICAgX3RoaXMudHJpZ2dlckhhbmRsZXIoJ2Nsb3NlLnpmLnRyaWdnZXInLCBbX3RoaXNdKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxuICB2YXIgcmVzaXplTGlzdGVuZXIgPSBmdW5jdGlvbihkZWJvdW5jZSl7XHJcbiAgICB2YXIgdGltZXIsXHJcbiAgICAgICAgJG5vZGVzID0gJCgnW2RhdGEtcmVzaXplXScpO1xyXG4gICAgaWYoJG5vZGVzLmxlbmd0aCl7XHJcbiAgICAgICQod2luZG93KS5vZmYoJ3Jlc2l6ZS56Zi50cmlnZ2VyJylcclxuICAgICAgLm9uKCdyZXNpemUuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxyXG5cclxuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxyXG4gICAgICAgICAgICAkbm9kZXMuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgcmVzaXplIGV2ZW50XHJcbiAgICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInJlc2l6ZVwiKTtcclxuICAgICAgICB9LCBkZWJvdW5jZSB8fCAxMCk7Ly9kZWZhdWx0IHRpbWUgdG8gZW1pdCByZXNpemUgZXZlbnRcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxuICB2YXIgc2Nyb2xsTGlzdGVuZXIgPSBmdW5jdGlvbihkZWJvdW5jZSl7XHJcbiAgICB2YXIgdGltZXIsXHJcbiAgICAgICAgJG5vZGVzID0gJCgnW2RhdGEtc2Nyb2xsXScpO1xyXG4gICAgaWYoJG5vZGVzLmxlbmd0aCl7XHJcbiAgICAgICQod2luZG93KS5vZmYoJ3Njcm9sbC56Zi50cmlnZ2VyJylcclxuICAgICAgLm9uKCdzY3JvbGwuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIGlmKHRpbWVyKXsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxyXG5cclxuICAgICAgICB0aW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICBpZighTXV0YXRpb25PYnNlcnZlcil7Ly9mYWxsYmFjayBmb3IgSUUgOVxyXG4gICAgICAgICAgICAkbm9kZXMuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICQodGhpcykudHJpZ2dlckhhbmRsZXIoJ3Njcm9sbG1lLnpmLnRyaWdnZXInKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgc2Nyb2xsIGV2ZW50XHJcbiAgICAgICAgICAkbm9kZXMuYXR0cignZGF0YS1ldmVudHMnLCBcInNjcm9sbFwiKTtcclxuICAgICAgICB9LCBkZWJvdW5jZSB8fCAxMCk7Ly9kZWZhdWx0IHRpbWUgdG8gZW1pdCBzY3JvbGwgZXZlbnRcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvLyBmdW5jdGlvbiBkb21NdXRhdGlvbk9ic2VydmVyKGRlYm91bmNlKSB7XHJcbiAgLy8gICAvLyAhISEgVGhpcyBpcyBjb21pbmcgc29vbiBhbmQgbmVlZHMgbW9yZSB3b3JrOyBub3QgYWN0aXZlICAhISEgLy9cclxuICAvLyAgIHZhciB0aW1lcixcclxuICAvLyAgIG5vZGVzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtbXV0YXRlXScpO1xyXG4gIC8vICAgLy9cclxuICAvLyAgIGlmIChub2Rlcy5sZW5ndGgpIHtcclxuICAvLyAgICAgLy8gdmFyIE11dGF0aW9uT2JzZXJ2ZXIgPSAoZnVuY3Rpb24gKCkge1xyXG4gIC8vICAgICAvLyAgIHZhciBwcmVmaXhlcyA9IFsnV2ViS2l0JywgJ01veicsICdPJywgJ01zJywgJyddO1xyXG4gIC8vICAgICAvLyAgIGZvciAodmFyIGk9MDsgaSA8IHByZWZpeGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgLy8gICAgIC8vICAgICBpZiAocHJlZml4ZXNbaV0gKyAnTXV0YXRpb25PYnNlcnZlcicgaW4gd2luZG93KSB7XHJcbiAgLy8gICAgIC8vICAgICAgIHJldHVybiB3aW5kb3dbcHJlZml4ZXNbaV0gKyAnTXV0YXRpb25PYnNlcnZlciddO1xyXG4gIC8vICAgICAvLyAgICAgfVxyXG4gIC8vICAgICAvLyAgIH1cclxuICAvLyAgICAgLy8gICByZXR1cm4gZmFsc2U7XHJcbiAgLy8gICAgIC8vIH0oKSk7XHJcbiAgLy9cclxuICAvL1xyXG4gIC8vICAgICAvL2ZvciB0aGUgYm9keSwgd2UgbmVlZCB0byBsaXN0ZW4gZm9yIGFsbCBjaGFuZ2VzIGVmZmVjdGluZyB0aGUgc3R5bGUgYW5kIGNsYXNzIGF0dHJpYnV0ZXNcclxuICAvLyAgICAgdmFyIGJvZHlPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGJvZHlNdXRhdGlvbik7XHJcbiAgLy8gICAgIGJvZHlPYnNlcnZlci5vYnNlcnZlKGRvY3VtZW50LmJvZHksIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTp0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6W1wic3R5bGVcIiwgXCJjbGFzc1wiXX0pO1xyXG4gIC8vXHJcbiAgLy9cclxuICAvLyAgICAgLy9ib2R5IGNhbGxiYWNrXHJcbiAgLy8gICAgIGZ1bmN0aW9uIGJvZHlNdXRhdGlvbihtdXRhdGUpIHtcclxuICAvLyAgICAgICAvL3RyaWdnZXIgYWxsIGxpc3RlbmluZyBlbGVtZW50cyBhbmQgc2lnbmFsIGEgbXV0YXRpb24gZXZlbnRcclxuICAvLyAgICAgICBpZiAodGltZXIpIHsgY2xlYXJUaW1lb3V0KHRpbWVyKTsgfVxyXG4gIC8vXHJcbiAgLy8gICAgICAgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gIC8vICAgICAgICAgYm9keU9ic2VydmVyLmRpc2Nvbm5lY3QoKTtcclxuICAvLyAgICAgICAgICQoJ1tkYXRhLW11dGF0ZV0nKS5hdHRyKCdkYXRhLWV2ZW50cycsXCJtdXRhdGVcIik7XHJcbiAgLy8gICAgICAgfSwgZGVib3VuY2UgfHwgMTUwKTtcclxuICAvLyAgICAgfVxyXG4gIC8vICAgfVxyXG4gIC8vIH1cclxuICB2YXIgZXZlbnRzTGlzdGVuZXIgPSBmdW5jdGlvbigpIHtcclxuICAgIGlmKCFNdXRhdGlvbk9ic2VydmVyKXsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICB2YXIgbm9kZXMgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1yZXNpemVdLCBbZGF0YS1zY3JvbGxdLCBbZGF0YS1tdXRhdGVdJyk7XHJcblxyXG4gICAgLy9lbGVtZW50IGNhbGxiYWNrXHJcbiAgICB2YXIgbGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbiA9IGZ1bmN0aW9uKG11dGF0aW9uUmVjb3Jkc0xpc3QpIHtcclxuICAgICAgdmFyICR0YXJnZXQgPSAkKG11dGF0aW9uUmVjb3Jkc0xpc3RbMF0udGFyZ2V0KTtcclxuICAgICAgLy90cmlnZ2VyIHRoZSBldmVudCBoYW5kbGVyIGZvciB0aGUgZWxlbWVudCBkZXBlbmRpbmcgb24gdHlwZVxyXG4gICAgICBzd2l0Y2ggKCR0YXJnZXQuYXR0cihcImRhdGEtZXZlbnRzXCIpKSB7XHJcblxyXG4gICAgICAgIGNhc2UgXCJyZXNpemVcIiA6XHJcbiAgICAgICAgJHRhcmdldC50cmlnZ2VySGFuZGxlcigncmVzaXplbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0XSk7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgIGNhc2UgXCJzY3JvbGxcIiA6XHJcbiAgICAgICAgJHRhcmdldC50cmlnZ2VySGFuZGxlcignc2Nyb2xsbWUuemYudHJpZ2dlcicsIFskdGFyZ2V0LCB3aW5kb3cucGFnZVlPZmZzZXRdKTtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgLy8gY2FzZSBcIm11dGF0ZVwiIDpcclxuICAgICAgICAvLyBjb25zb2xlLmxvZygnbXV0YXRlJywgJHRhcmdldCk7XHJcbiAgICAgICAgLy8gJHRhcmdldC50cmlnZ2VySGFuZGxlcignbXV0YXRlLnpmLnRyaWdnZXInKTtcclxuICAgICAgICAvL1xyXG4gICAgICAgIC8vIC8vbWFrZSBzdXJlIHdlIGRvbid0IGdldCBzdHVjayBpbiBhbiBpbmZpbml0ZSBsb29wIGZyb20gc2xvcHB5IGNvZGVpbmdcclxuICAgICAgICAvLyBpZiAoJHRhcmdldC5pbmRleCgnW2RhdGEtbXV0YXRlXScpID09ICQoXCJbZGF0YS1tdXRhdGVdXCIpLmxlbmd0aC0xKSB7XHJcbiAgICAgICAgLy8gICBkb21NdXRhdGlvbk9ic2VydmVyKCk7XHJcbiAgICAgICAgLy8gfVxyXG4gICAgICAgIC8vIGJyZWFrO1xyXG5cclxuICAgICAgICBkZWZhdWx0IDpcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgLy9ub3RoaW5nXHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZihub2Rlcy5sZW5ndGgpe1xyXG4gICAgICAvL2ZvciBlYWNoIGVsZW1lbnQgdGhhdCBuZWVkcyB0byBsaXN0ZW4gZm9yIHJlc2l6aW5nLCBzY3JvbGxpbmcsIChvciBjb21pbmcgc29vbiBtdXRhdGlvbikgYWRkIGEgc2luZ2xlIG9ic2VydmVyXHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDw9IG5vZGVzLmxlbmd0aC0xOyBpKyspIHtcclxuICAgICAgICB2YXIgZWxlbWVudE9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIobGlzdGVuaW5nRWxlbWVudHNNdXRhdGlvbik7XHJcbiAgICAgICAgZWxlbWVudE9ic2VydmVyLm9ic2VydmUobm9kZXNbaV0sIHsgYXR0cmlidXRlczogdHJ1ZSwgY2hpbGRMaXN0OiBmYWxzZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6ZmFsc2UsIGF0dHJpYnV0ZUZpbHRlcjpbXCJkYXRhLWV2ZW50c1wiXX0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cclxuXHJcbiAgLy8gW1BIXVxyXG4gIC8vIEZvdW5kYXRpb24uQ2hlY2tXYXRjaGVycyA9IGNoZWNrV2F0Y2hlcnM7XHJcbiAgRm91bmRhdGlvbi5JSGVhcllvdSA9IGNoZWNrTGlzdGVuZXJzO1xyXG4gIC8vIEZvdW5kYXRpb24uSVNlZVlvdSA9IHNjcm9sbExpc3RlbmVyO1xyXG4gIC8vIEZvdW5kYXRpb24uSUZlZWxZb3UgPSBjbG9zZW1lTGlzdGVuZXI7XHJcblxyXG59KHdpbmRvdy5Gb3VuZGF0aW9uLCB3aW5kb3cualF1ZXJ5KTtcclxuIiwiIWZ1bmN0aW9uKEZvdW5kYXRpb24sICQpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgQWJpZGUuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIEFiaWRlI2luaXRcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gYWRkIHRoZSB0cmlnZ2VyIHRvLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBmdW5jdGlvbiBBYmlkZShlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyAgPSAkLmV4dGVuZCh7fSwgQWJpZGUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuICAgIHRoaXMuJHdpbmRvdyAgPSAkKHdpbmRvdyk7XHJcbiAgICB0aGlzLm5hbWUgICAgID0gJ0FiaWRlJztcclxuICAgIHRoaXMuYXR0ciAgICAgPSAnZGF0YS1hYmlkZSc7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxyXG4gICAqL1xyXG4gIEFiaWRlLmRlZmF1bHRzID0ge1xyXG4gICAgdmFsaWRhdGVPbjogJ2ZpZWxkQ2hhbmdlJywgLy8gb3B0aW9uczogZmllbGRDaGFuZ2UsIG1hbnVhbCwgc3VibWl0XHJcbiAgICBsYWJlbEVycm9yQ2xhc3M6ICdpcy1pbnZhbGlkLWxhYmVsJyxcclxuICAgIGlucHV0RXJyb3JDbGFzczogJ2lzLWludmFsaWQtaW5wdXQnLFxyXG4gICAgZm9ybUVycm9yU2VsZWN0b3I6ICcuZm9ybS1lcnJvcicsXHJcbiAgICBmb3JtRXJyb3JDbGFzczogJ2lzLXZpc2libGUnLFxyXG4gICAgcGF0dGVybnM6IHtcclxuICAgICAgYWxwaGEgOiAvXlthLXpBLVpdKyQvLFxyXG4gICAgICBhbHBoYV9udW1lcmljIDogL15bYS16QS1aMC05XSskLyxcclxuICAgICAgaW50ZWdlciA6IC9eWy0rXT9cXGQrJC8sXHJcbiAgICAgIG51bWJlciA6IC9eWy0rXT9cXGQqKD86W1xcLlxcLF1cXGQrKT8kLyxcclxuXHJcbiAgICAgIC8vIGFtZXgsIHZpc2EsIGRpbmVyc1xyXG4gICAgICBjYXJkIDogL14oPzo0WzAtOV17MTJ9KD86WzAtOV17M30pP3w1WzEtNV1bMC05XXsxNH18Nig/OjAxMXw1WzAtOV1bMC05XSlbMC05XXsxMn18M1s0N11bMC05XXsxM318Myg/OjBbMC01XXxbNjhdWzAtOV0pWzAtOV17MTF9fCg/OjIxMzF8MTgwMHwzNVxcZHszfSlcXGR7MTF9KSQvLFxyXG4gICAgICBjdnYgOiAvXihbMC05XSl7Myw0fSQvLFxyXG5cclxuICAgICAgLy8gaHR0cDovL3d3dy53aGF0d2cub3JnL3NwZWNzL3dlYi1hcHBzL2N1cnJlbnQtd29yay9tdWx0aXBhZ2Uvc3RhdGVzLW9mLXRoZS10eXBlLWF0dHJpYnV0ZS5odG1sI3ZhbGlkLWUtbWFpbC1hZGRyZXNzXHJcbiAgICAgIGVtYWlsIDogL15bYS16QS1aMC05LiEjJCUmJyorXFwvPT9eX2B7fH1+LV0rQFthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPyg/OlxcLlthLXpBLVowLTldKD86W2EtekEtWjAtOS1dezAsNjF9W2EtekEtWjAtOV0pPykrJC8sXHJcblxyXG4gICAgICB1cmwgOiAvXihodHRwcz98ZnRwfGZpbGV8c3NoKTpcXC9cXC8oKCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OikqQCk/KCgoXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pXFwuKFxcZHxbMS05XVxcZHwxXFxkXFxkfDJbMC00XVxcZHwyNVswLTVdKVxcLihcXGR8WzEtOV1cXGR8MVxcZFxcZHwyWzAtNF1cXGR8MjVbMC01XSlcXC4oXFxkfFsxLTldXFxkfDFcXGRcXGR8MlswLTRdXFxkfDI1WzAtNV0pKXwoKChbYS16QS1aXXxcXGR8W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCgoW2EtekEtWl18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2EtekEtWl18XFxkfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSkpXFwuKSsoKFthLXpBLVpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoKFthLXpBLVpdfFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKShbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKSooW2EtekEtWl18W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pKSlcXC4/KSg6XFxkKik/KShcXC8oKChbYS16QS1aXXxcXGR8LXxcXC58X3x+fFtcXHUwMEEwLVxcdUQ3RkZcXHVGOTAwLVxcdUZEQ0ZcXHVGREYwLVxcdUZGRUZdKXwoJVtcXGRhLWZdezJ9KXxbIVxcJCYnXFwoXFwpXFwqXFwrLDs9XXw6fEApKyhcXC8oKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCkqKSopPyk/KFxcPygoKFthLXpBLVpdfFxcZHwtfFxcLnxffH58W1xcdTAwQTAtXFx1RDdGRlxcdUY5MDAtXFx1RkRDRlxcdUZERjAtXFx1RkZFRl0pfCglW1xcZGEtZl17Mn0pfFshXFwkJidcXChcXClcXCpcXCssOz1dfDp8QCl8W1xcdUUwMDAtXFx1RjhGRl18XFwvfFxcPykqKT8oXFwjKCgoW2EtekEtWl18XFxkfC18XFwufF98fnxbXFx1MDBBMC1cXHVEN0ZGXFx1RjkwMC1cXHVGRENGXFx1RkRGMC1cXHVGRkVGXSl8KCVbXFxkYS1mXXsyfSl8WyFcXCQmJ1xcKFxcKVxcKlxcKyw7PV18OnxAKXxcXC98XFw/KSopPyQvLFxyXG4gICAgICAvLyBhYmMuZGVcclxuICAgICAgZG9tYWluIDogL14oW2EtekEtWjAtOV0oW2EtekEtWjAtOVxcLV17MCw2MX1bYS16QS1aMC05XSk/XFwuKStbYS16QS1aXXsyLDh9JC8sXHJcblxyXG4gICAgICBkYXRldGltZSA6IC9eKFswLTJdWzAtOV17M30pXFwtKFswLTFdWzAtOV0pXFwtKFswLTNdWzAtOV0pVChbMC01XVswLTldKVxcOihbMC01XVswLTldKVxcOihbMC01XVswLTldKShafChbXFwtXFwrXShbMC0xXVswLTldKVxcOjAwKSkkLyxcclxuICAgICAgLy8gWVlZWS1NTS1ERFxyXG4gICAgICBkYXRlIDogLyg/OjE5fDIwKVswLTldezJ9LSg/Oig/OjBbMS05XXwxWzAtMl0pLSg/OjBbMS05XXwxWzAtOV18MlswLTldKXwoPzooPyEwMikoPzowWzEtOV18MVswLTJdKS0oPzozMCkpfCg/Oig/OjBbMTM1NzhdfDFbMDJdKS0zMSkpJC8sXHJcbiAgICAgIC8vIEhIOk1NOlNTXHJcbiAgICAgIHRpbWUgOiAvXigwWzAtOV18MVswLTldfDJbMC0zXSkoOlswLTVdWzAtOV0pezJ9JC8sXHJcbiAgICAgIGRhdGVJU08gOiAvXlxcZHs0fVtcXC9cXC1dXFxkezEsMn1bXFwvXFwtXVxcZHsxLDJ9JC8sXHJcbiAgICAgIC8vIE1NL0REL1lZWVlcclxuICAgICAgbW9udGhfZGF5X3llYXIgOiAvXigwWzEtOV18MVswMTJdKVstIFxcLy5dKDBbMS05XXxbMTJdWzAtOV18M1swMV0pWy0gXFwvLl1cXGR7NH0kLyxcclxuICAgICAgLy8gREQvTU0vWVlZWVxyXG4gICAgICBkYXlfbW9udGhfeWVhciA6IC9eKDBbMS05XXxbMTJdWzAtOV18M1swMV0pWy0gXFwvLl0oMFsxLTldfDFbMDEyXSlbLSBcXC8uXVxcZHs0fSQvLFxyXG5cclxuICAgICAgLy8gI0ZGRiBvciAjRkZGRkZGXHJcbiAgICAgIGNvbG9yIDogL14jPyhbYS1mQS1GMC05XXs2fXxbYS1mQS1GMC05XXszfSkkL1xyXG4gICAgfSxcclxuICAgIHZhbGlkYXRvcnM6IHtcclxuICAgICAgZXF1YWxUbzogZnVuY3Rpb24gKGVsLCByZXF1aXJlZCwgcGFyZW50KSB7XHJcbiAgICAgICAgdmFyIGZyb20gID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWwuZ2V0QXR0cmlidXRlKHRoaXMuYWRkX25hbWVzcGFjZSgnZGF0YS1lcXVhbHRvJykpKS52YWx1ZSxcclxuICAgICAgICAgICAgdG8gICAgPSBlbC52YWx1ZSxcclxuICAgICAgICAgICAgdmFsaWQgPSAoZnJvbSA9PT0gdG8pO1xyXG5cclxuICAgICAgICByZXR1cm4gdmFsaWQ7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG5cclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIEFiaWRlIHBsdWdpbiBhbmQgY2FsbHMgZnVuY3Rpb25zIHRvIGdldCBBYmlkZSBmdW5jdGlvbmluZyBvbiBsb2FkLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgQWJpZGUucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciBBYmlkZS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIEFiaWRlLnByb3RvdHlwZS5fZXZlbnRzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB0aGlzLiRlbGVtZW50XHJcbiAgICAgIC5vZmYoJy5hYmlkZScpXHJcbiAgICAgIC5vbigncmVzZXQuZm5kdG4uYWJpZGUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgc2VsZi5yZXNldEZvcm0oJCh0aGlzKSk7XHJcbiAgICAgIH0pXHJcbiAgICAgIC5vbignc3VibWl0LmZuZHRuLmFiaWRlJywgZnVuY3Rpb24oZSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBzZWxmLnZhbGlkYXRlRm9ybShzZWxmLiRlbGVtZW50KTtcclxuICAgICAgfSlcclxuICAgICAgLmZpbmQoJ2lucHV0LCB0ZXh0YXJlYSwgc2VsZWN0JylcclxuICAgICAgICAub2ZmKCcuYWJpZGUnKVxyXG4gICAgICAgIC5vbignYmx1ci5mbmR0bi5hYmlkZSBjaGFuZ2UuZm5kdG4uYWJpZGUnLCBmdW5jdGlvbiAoZSkge1xyXG4gICAgICAgICAgaWYgKHNlbGYub3B0aW9ucy52YWxpZGF0ZU9uID09PSAnZmllbGRDaGFuZ2UnKSB7XHJcbiAgICAgICAgICAgIHNlbGYudmFsaWRhdGVJbnB1dCgkKGUudGFyZ2V0KSwgc2VsZi4kZWxlbWVudCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBzZWxmLnZhbGlkYXRlRm9ybShzZWxmLiRlbGVtZW50KTtcclxuICAgICAgICB9KVxyXG4gICAgICAgIC5vbigna2V5ZG93bi5mbmR0bi5hYmlkZScsIGZ1bmN0aW9uIChlKSB7XHJcbiAgICAgICAgICAvLyBpZiAoc2V0dGluZ3MubGl2ZV92YWxpZGF0ZSA9PT0gdHJ1ZSAmJiBlLndoaWNoICE9IDkpIHtcclxuICAgICAgICAgIC8vICAgY2xlYXJUaW1lb3V0KHNlbGYudGltZXIpO1xyXG4gICAgICAgICAgLy8gICBzZWxmLnRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAvLyAgICAgc2VsZi52YWxpZGF0ZShbdGhpc10sIGUpO1xyXG4gICAgICAgICAgLy8gICB9LmJpbmQodGhpcyksIHNldHRpbmdzLnRpbWVvdXQpO1xyXG4gICAgICAgICAgLy8gfVxyXG4gICAgICAgICAgLy8gc2VsZi52YWxpZGF0ZUZvcm0oc2VsZi4kZWxlbWVudCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gIH0sXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgbmVjZXNzYXJ5IGZ1bmN0aW9ucyB0byB1cGRhdGUgQWJpZGUgdXBvbiBET00gY2hhbmdlXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBBYmlkZS5wcm90b3R5cGUuX3JlZmxvdyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogQ2hlY2tzIHdoZXRoZXIgb3Igbm90IGEgZm9ybSBlbGVtZW50IGhhcyB0aGUgcmVxdWlyZWQgYXR0cmlidXRlIGFuZCBpZiBpdCdzIGNoZWNrZWQgb3Igbm90XHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGNoZWNrIGZvciByZXF1aXJlZCBhdHRyaWJ1dGVcclxuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn0gQm9vbGVhbiB2YWx1ZSBkZXBlbmRzIG9uIHdoZXRoZXIgb3Igbm90IGF0dHJpYnV0ZSBpcyBjaGVja2VkIG9yIGVtcHR5XHJcbiAgICovXHJcbiAgQWJpZGUucHJvdG90eXBlLnJlcXVpcmVkQ2hlY2sgPSBmdW5jdGlvbigkZWwpIHtcclxuICAgIHN3aXRjaCAoJGVsWzBdLnR5cGUpIHtcclxuICAgICAgY2FzZSAndGV4dCc6XHJcbiAgICAgICAgaWYgKCRlbC5hdHRyKCdyZXF1aXJlZCcpICYmICEkZWwudmFsKCkpIHtcclxuICAgICAgICAgIC8vIHJlcXVpcmVtZW50IGNoZWNrIGRvZXMgbm90IHBhc3NcclxuICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGJyZWFrO1xyXG4gICAgICAgIGNhc2UgJ3Bhc3N3b3JkJzpcclxuICAgICAgICBpZiAoJGVsLmF0dHIoJ3JlcXVpcmVkJykgJiYgISRlbC52YWwoKSkge1xyXG4gICAgICAgICAgLy8gcmVxdWlyZW1lbnQgY2hlY2sgZG9lcyBub3QgcGFzc1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ2NoZWNrYm94JzpcclxuICAgICAgICBpZiAoJGVsLmF0dHIoJ3JlcXVpcmVkJykgJiYgISRlbC5pcygnOmNoZWNrZWQnKSkge1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGNhc2UgJ3JhZGlvJzpcclxuICAgICAgICBpZiAoJGVsLmF0dHIoJ3JlcXVpcmVkJykgJiYgISRlbC5pcygnOmNoZWNrZWQnKSkge1xyXG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgaWYgKCRlbC5hdHRyKCdyZXF1aXJlZCcpICYmICghJGVsLnZhbCgpIHx8ICEkZWwudmFsKCkubGVuZ3RoIHx8ICRlbC5pcygnOmVtcHR5JykpKSB7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIENoZWNrcyB3aGV0aGVyIG9yIG5vdCBhIGZvcm0gZWxlbWVudCBoYXMgdGhlIHJlcXVpcmVkIGF0dHJpYnV0ZSBhbmQgaWYgaXQncyBjaGVja2VkIG9yIG5vdFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBjaGVjayBmb3IgcmVxdWlyZWQgYXR0cmlidXRlXHJcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCBhdHRyaWJ1dGUgaXMgY2hlY2tlZCBvciBlbXB0eVxyXG4gICAqL1xyXG4gIEFiaWRlLnByb3RvdHlwZS5maW5kTGFiZWwgPSBmdW5jdGlvbigkZWwpIHtcclxuICAgIGlmICgkZWwubmV4dCgnbGFiZWwnKS5sZW5ndGgpIHtcclxuICAgICAgcmV0dXJuICRlbC5uZXh0KCdsYWJlbCcpO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiAkZWwuY2xvc2VzdCgnbGFiZWwnKTtcclxuICAgIH1cclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIEFkZHMgdGhlIENTUyBlcnJvciBjbGFzcyBhcyBzcGVjaWZpZWQgYnkgdGhlIEFiaWRlIHNldHRpbmdzIHRvIHRoZSBsYWJlbCwgaW5wdXQsIGFuZCB0aGUgZm9ybVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIGNsYXNzIHRvXHJcbiAgICovXHJcbiAgQWJpZGUucHJvdG90eXBlLmFkZEVycm9yQ2xhc3NlcyA9IGZ1bmN0aW9uKCRlbCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgICRsYWJlbCA9IHNlbGYuZmluZExhYmVsKCRlbCksXHJcbiAgICAgICAgJGZvcm1FcnJvciA9ICRlbC5uZXh0KHNlbGYub3B0aW9ucy5mb3JtRXJyb3JTZWxlY3RvcikgfHwgJGVsLmZpbmQoc2VsZi5vcHRpb25zLmZvcm1FcnJvclNlbGVjdG9yKTtcclxuXHJcbiAgICAvLyBsYWJlbFxyXG4gICAgaWYgKCRsYWJlbCkge1xyXG4gICAgICAkbGFiZWwuYWRkQ2xhc3Moc2VsZi5vcHRpb25zLmxhYmVsRXJyb3JDbGFzcyk7XHJcbiAgICB9XHJcbiAgICAvLyBmb3JtIGVycm9yXHJcbiAgICBpZiAoJGZvcm1FcnJvcikge1xyXG4gICAgICAkZm9ybUVycm9yLmFkZENsYXNzKHNlbGYub3B0aW9ucy5mb3JtRXJyb3JDbGFzcyk7XHJcbiAgICB9XHJcbiAgICAvLyBpbnB1dFxyXG4gICAgJGVsLmFkZENsYXNzKHNlbGYub3B0aW9ucy5pbnB1dEVycm9yQ2xhc3MpO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogUmVtb3ZlcyBDU1MgZXJyb3IgY2xhc3MgYXMgc3BlY2lmaWVkIGJ5IHRoZSBBYmlkZSBzZXR0aW5ncyBmcm9tIHRoZSBsYWJlbCwgaW5wdXQsIGFuZCB0aGUgZm9ybVxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byByZW1vdmUgdGhlIGNsYXNzIGZyb21cclxuICAgKi9cclxuICBBYmlkZS5wcm90b3R5cGUucmVtb3ZlRXJyb3JDbGFzc2VzID0gZnVuY3Rpb24oJGVsKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgJGxhYmVsID0gc2VsZi5maW5kTGFiZWwoJGVsKSxcclxuICAgICAgICAkZm9ybUVycm9yID0gJGVsLm5leHQoc2VsZi5vcHRpb25zLmZvcm1FcnJvclNlbGVjdG9yKSB8fCAkZWwuZmluZChzZWxmLm9wdGlvbnMuZm9ybUVycm9yU2VsZWN0b3IpO1xyXG4gICAgLy8gbGFiZWxcclxuICAgIGlmICgkbGFiZWwgJiYgJGxhYmVsLmhhc0NsYXNzKHNlbGYub3B0aW9ucy5sYWJlbEVycm9yQ2xhc3MpKSB7XHJcbiAgICAgICRsYWJlbC5yZW1vdmVDbGFzcyhzZWxmLm9wdGlvbnMubGFiZWxFcnJvckNsYXNzKTtcclxuICAgIH1cclxuICAgIC8vIGZvcm0gZXJyb3JcclxuICAgIGlmICgkZm9ybUVycm9yICYmICRmb3JtRXJyb3IuaGFzQ2xhc3Moc2VsZi5vcHRpb25zLmZvcm1FcnJvckNsYXNzKSkge1xyXG4gICAgICAkZm9ybUVycm9yLnJlbW92ZUNsYXNzKHNlbGYub3B0aW9ucy5mb3JtRXJyb3JDbGFzcyk7XHJcbiAgICB9XHJcbiAgICAvLyBpbnB1dFxyXG4gICAgaWYgKCRlbC5oYXNDbGFzcyhzZWxmLm9wdGlvbnMuaW5wdXRFcnJvckNsYXNzKSkge1xyXG4gICAgICAkZWwucmVtb3ZlQ2xhc3Moc2VsZi5vcHRpb25zLmlucHV0RXJyb3JDbGFzcyk7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBHb2VzIHRocm91Z2ggYSBmb3JtIHRvIGZpbmQgaW5wdXRzIGFuZCBwcm9jZWVkcyB0byB2YWxpZGF0ZSB0aGVtIGluIHdheXMgc3BlY2lmaWMgdG8gdGhlaXIgdHlwZVxyXG4gICAqIEBmaXJlcyBBYmlkZSNpbnZhbGlkXHJcbiAgICogQGZpcmVzIEFiaWRlI3ZhbGlkXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIHZhbGlkYXRlLCBzaG91bGQgYmUgYW4gSFRNTCBpbnB1dFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBmb3JtIC0galF1ZXJ5IG9iamVjdCBvZiB0aGUgZW50aXJlIGZvcm0gdG8gZmluZCB0aGUgdmFyaW91cyBpbnB1dCBlbGVtZW50c1xyXG4gICAqL1xyXG4gIEFiaWRlLnByb3RvdHlwZS52YWxpZGF0ZUlucHV0ID0gZnVuY3Rpb24oJGVsLCAkZm9ybSkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzLFxyXG4gICAgICAgIHRleHRJbnB1dCA9ICRmb3JtLmZpbmQoJ2lucHV0W3R5cGU9XCJ0ZXh0XCJdJyksXHJcbiAgICAgICAgcGFzc3dvcmRJbnB1dCA9ICRmb3JtLmZpbmQoJ2lucHV0W3R5cGU9XCJwYXNzd29yZFwiXScpLFxyXG4gICAgICAgIGNoZWNrSW5wdXQgPSAkZm9ybS5maW5kKCdpbnB1dFt0eXBlPVwiY2hlY2tib3hcIl0nKSxcclxuICAgICAgICBsYWJlbCxcclxuICAgICAgICByYWRpb0dyb3VwTmFtZTtcclxuXHJcbiAgICBpZiAoJGVsWzBdLnR5cGUgPT09ICd0ZXh0Jykge1xyXG4gICAgICBpZiAoIXNlbGYucmVxdWlyZWRDaGVjaygkZWwpIHx8ICFzZWxmLnZhbGlkYXRlVGV4dCgkZWwpKSB7XHJcbiAgICAgICAgc2VsZi5hZGRFcnJvckNsYXNzZXMoJGVsKTtcclxuICAgICAgICAkZWwudHJpZ2dlcignaW52YWxpZC5mbmR0bi5hYmlkZScsICRlbFswXSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgc2VsZi5yZW1vdmVFcnJvckNsYXNzZXMoJGVsKTtcclxuICAgICAgICAkZWwudHJpZ2dlcigndmFsaWQuZm5kdG4uYWJpZGUnLCAkZWxbMF0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICBlbHNlIGlmICgkZWxbMF0udHlwZSA9PT0gJ3JhZGlvJykge1xyXG4gICAgICByYWRpb0dyb3VwTmFtZSA9ICRlbC5hdHRyKCduYW1lJyk7XHJcbiAgICAgIGxhYmVsID0gJGVsLnNpYmxpbmdzKCdsYWJlbCcpO1xyXG5cclxuICAgICAgaWYgKHNlbGYudmFsaWRhdGVSYWRpbyhyYWRpb0dyb3VwTmFtZSkpIHtcclxuICAgICAgICAkKGxhYmVsKS5lYWNoKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKCQodGhpcykuaGFzQ2xhc3Moc2VsZi5vcHRpb25zLmxhYmVsRXJyb3JDbGFzcykpIHtcclxuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcyhzZWxmLm9wdGlvbnMubGFiZWxFcnJvckNsYXNzKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgICAgICAkZWwudHJpZ2dlcigndmFsaWQuZm5kdG4uYWJpZGUnLCAkZWxbMF0pO1xyXG4gICAgICB9XHJcbiAgICAgIGVsc2Uge1xyXG4gICAgICAgICQobGFiZWwpLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKHNlbGYub3B0aW9ucy5sYWJlbEVycm9yQ2xhc3MpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgICRlbC50cmlnZ2VyKCdpbnZhbGlkLmZuZHRuLmFiaWRlJywgJGVsWzBdKTtcclxuICAgICAgfTtcclxuICAgIH1cclxuICAgIGVsc2UgaWYgKCRlbFswXS50eXBlID09PSAnY2hlY2tib3gnKSB7XHJcbiAgICAgIGlmICghc2VsZi5yZXF1aXJlZENoZWNrKCRlbCkpIHtcclxuICAgICAgICBzZWxmLmFkZEVycm9yQ2xhc3NlcygkZWwpO1xyXG4gICAgICAgICRlbC50cmlnZ2VyKCdpbnZhbGlkLmZuZHRuLmFiaWRlJywgJGVsWzBdKTtcclxuICAgICAgfVxyXG4gICAgICBlbHNlIHtcclxuICAgICAgICBzZWxmLnJlbW92ZUVycm9yQ2xhc3NlcygkZWwpO1xyXG4gICAgICAgICRlbC50cmlnZ2VyKCd2YWxpZC5mbmR0bi5hYmlkZScsICRlbFswXSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAoIXNlbGYucmVxdWlyZWRDaGVjaygkZWwpIHx8ICFzZWxmLnZhbGlkYXRlVGV4dCgkZWwpKSB7XHJcbiAgICAgICAgc2VsZi5hZGRFcnJvckNsYXNzZXMoJGVsKTtcclxuICAgICAgICAkZWwudHJpZ2dlcignaW52YWxpZC5mbmR0bi5hYmlkZScsICRlbFswXSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgc2VsZi5yZW1vdmVFcnJvckNsYXNzZXMoJGVsKTtcclxuICAgICAgICAkZWwudHJpZ2dlcigndmFsaWQuZm5kdG4uYWJpZGUnLCAkZWxbMF0pO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBHb2VzIHRocm91Z2ggYSBmb3JtIGFuZCBpZiB0aGVyZSBhcmUgYW55IGludmFsaWQgaW5wdXRzLCBpdCB3aWxsIGRpc3BsYXkgdGhlIGZvcm0gZXJyb3IgZWxlbWVudFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byB2YWxpZGF0ZSwgc2hvdWxkIGJlIGEgZm9ybSBIVE1MIGVsZW1lbnRcclxuICAgKi9cclxuICBBYmlkZS5wcm90b3R5cGUudmFsaWRhdGVGb3JtID0gZnVuY3Rpb24oJGZvcm0pIHtcclxuICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICBpbnB1dHMgPSAkZm9ybS5maW5kKCdpbnB1dCcpLFxyXG4gICAgICAgIGlucHV0Q291bnQgPSAkZm9ybS5maW5kKCdpbnB1dCcpLmxlbmd0aCxcclxuICAgICAgICBjb3VudGVyID0gMDtcclxuXHJcbiAgICB3aGlsZSAoY291bnRlciA8IGlucHV0Q291bnQpIHtcclxuICAgICAgc2VsZi52YWxpZGF0ZUlucHV0KCQoaW5wdXRzW2NvdW50ZXJdKSwgJGZvcm0pO1xyXG4gICAgICBjb3VudGVyKys7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gd2hhdCBhcmUgYWxsIHRoZSB0aGluZ3MgdGhhdCBjYW4gZ28gd3Jvbmcgd2l0aCBhIGZvcm0/XHJcbiAgICBpZiAoJGZvcm0uZmluZCgnLmZvcm0tZXJyb3IuaXMtdmlzaWJsZScpLmxlbmd0aCB8fCAkZm9ybS5maW5kKCcuaXMtaW52YWxpZC1sYWJlbCcpLmxlbmd0aCkge1xyXG4gICAgICAkZm9ybS5maW5kKCdbZGF0YS1hYmlkZS1lcnJvcl0nKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAkZm9ybS5maW5kKCdbZGF0YS1hYmlkZS1lcnJvcl0nKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogRGV0ZXJtaW5lcyB3aGV0aGVyIG9yIGEgbm90IGEgdGV4dCBpbnB1dCBpcyB2YWxpZCBiYXNlZCBvbiB0aGUgcGF0dGVybnMgc3BlY2lmaWVkIGluIHRoZSBhdHRyaWJ1dGVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdmFsaWRhdGUsIHNob3VsZCBiZSBhIHRleHQgaW5wdXQgSFRNTCBlbGVtZW50XHJcbiAgICogQHJldHVybnMge0Jvb2xlYW59IEJvb2xlYW4gdmFsdWUgZGVwZW5kcyBvbiB3aGV0aGVyIG9yIG5vdCB0aGUgaW5wdXQgdmFsdWUgbWF0Y2hlcyB0aGUgcGF0dGVybiBzcGVjaWZpZWRcclxuICAgKi9cclxuICBBYmlkZS5wcm90b3R5cGUudmFsaWRhdGVUZXh0ID0gZnVuY3Rpb24oJGVsKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXMsXHJcbiAgICAgICAgdmFsaWQgPSBmYWxzZSxcclxuICAgICAgICBwYXR0ZXJuTGliID0gdGhpcy5vcHRpb25zLnBhdHRlcm5zLFxyXG4gICAgICAgIGlucHV0VGV4dCA9ICQoJGVsKS52YWwoKSxcclxuICAgICAgICAvLyBtYXliZSBoYXZlIGEgZGlmZmVyZW50IHdheSBvZiBwYXJzaW5nIHRoaXMgYmMgcGVvcGxlIG1pZ2h0IHVzZSB0eXBlXHJcbiAgICAgICAgcGF0dGVybiA9ICQoJGVsKS5hdHRyKCdwYXR0ZXJuJyk7XHJcblxyXG4gICAgLy8gaWYgdGhlcmUncyBubyB2YWx1ZSwgdGhlbiByZXR1cm4gdHJ1ZVxyXG4gICAgLy8gc2luY2UgcmVxdWlyZWQgY2hlY2sgaGFzIGFscmVhZHkgYmVlbiBkb25lXHJcbiAgICBpZiAoaW5wdXRUZXh0Lmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBpZiAoaW5wdXRUZXh0Lm1hdGNoKHBhdHRlcm5MaWJbcGF0dGVybl0pKSB7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgb3IgYSBub3QgYSByYWRpbyBpbnB1dCBpcyB2YWxpZCBiYXNlZCBvbiB3aGV0aGVyIG9yIG5vdCBpdCBpcyByZXF1aXJlZCBhbmQgc2VsZWN0ZWRcclxuICAgKiBAcGFyYW0ge1N0cmluZ30gZ3JvdXAgLSBBIHN0cmluZyB0aGF0IHNwZWNpZmllcyB0aGUgbmFtZSBvZiBhIHJhZGlvIGJ1dHRvbiBncm91cFxyXG4gICAqIEByZXR1cm5zIHtCb29sZWFufSBCb29sZWFuIHZhbHVlIGRlcGVuZHMgb24gd2hldGhlciBvciBub3QgYXQgbGVhc3Qgb25lIHJhZGlvIGlucHV0IGhhcyBiZWVuIHNlbGVjdGVkIChpZiBpdCdzIHJlcXVpcmVkKVxyXG4gICAqL1xyXG4gIEFiaWRlLnByb3RvdHlwZS52YWxpZGF0ZVJhZGlvID0gZnVuY3Rpb24oZ3JvdXApIHtcclxuICAgIHZhciBzZWxmID0gdGhpcyxcclxuICAgICAgICBsYWJlbHMgPSAkKCc6cmFkaW9bbmFtZT1cIicgKyBncm91cCArICdcIl0nKS5zaWJsaW5ncygnbGFiZWwnKSxcclxuICAgICAgICBjb3VudGVyID0gMDtcclxuICAgIC8vIGdvIHRocm91Z2ggZWFjaCByYWRpbyBidXR0b25cclxuICAgICQoJzpyYWRpb1tuYW1lPVwiJyArIGdyb3VwICsgJ1wiXScpLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgIC8vIHB1dCB0aGVtIHRocm91Z2ggdGhlIHJlcXVpcmVkIGNoZWNrcG9pbnRcclxuICAgICAgaWYgKCFzZWxmLnJlcXVpcmVkQ2hlY2soJCh0aGlzKSkpIHtcclxuICAgICAgICAvLyBpZiBhdCBsZWFzdCBvbmUgZG9lc24ndCBwYXNzLCBhZGQgYSB0YWxseSB0byB0aGUgY291bnRlclxyXG4gICAgICAgIGNvdW50ZXIrKztcclxuICAgICAgfVxyXG4gICAgICAvLyBpZiBhdCBsZWFzdCBvbmUgaXMgY2hlY2tlZFxyXG4gICAgICAvLyByZXNldCB0aGUgY291bnRlclxyXG4gICAgICBpZiAoJCh0aGlzKS5pcygnOmNoZWNrZWQnKSkge1xyXG4gICAgICAgIGNvdW50ZXIgPSAwO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoY291bnRlciA+IDApIHtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgQWJpZGUucHJvdG90eXBlLm1hdGNoVmFsaWRhdGlvbiA9IGZ1bmN0aW9uKHZhbCwgdmFsaWRhdGlvbikge1xyXG5cclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIFJlc2V0cyBmb3JtIGlucHV0cyBhbmQgc3R5bGVzXHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICRmb3JtIC0gQSBqUXVlcnkgb2JqZWN0IHRoYXQgc2hvdWxkIGJlIGFuIEhUTUwgZm9ybSBlbGVtZW50XHJcbiAgICovXHJcbiAgQWJpZGUucHJvdG90eXBlLnJlc2V0Rm9ybSA9IGZ1bmN0aW9uKCRmb3JtKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICB2YXIgaW52YWxpZEF0dHIgPSAnZGF0YS1pbnZhbGlkJztcclxuICAgIC8vIHJlbW92ZSBkYXRhIGF0dHJpYnV0ZXNcclxuICAgICQoJ1snICsgc2VsZi5pbnZhbGlkQXR0ciArICddJywgJGZvcm0pLnJlbW92ZUF0dHIoaW52YWxpZEF0dHIpO1xyXG4gICAgLy8gcmVtb3ZlIHN0eWxlc1xyXG4gICAgJCgnLicgKyBzZWxmLm9wdGlvbnMubGFiZWxFcnJvckNsYXNzLCAkZm9ybSkubm90KCdzbWFsbCcpLnJlbW92ZUNsYXNzKHNlbGYub3B0aW9ucy5sYWJlbEVycm9yQ2xhc3MpO1xyXG4gICAgJCgnLicgKyBzZWxmLm9wdGlvbnMuaW5wdXRFcnJvckNsYXNzLCAkZm9ybSkubm90KCdzbWFsbCcpLnJlbW92ZUNsYXNzKHNlbGYub3B0aW9ucy5pbnB1dEVycm9yQ2xhc3MpO1xyXG4gICAgJCgnLmZvcm0tZXJyb3IuaXMtdmlzaWJsZScpLnJlbW92ZUNsYXNzKCdpcy12aXNpYmxlJyk7XHJcbiAgICAkZm9ybS5maW5kKCdbZGF0YS1hYmlkZS1lcnJvcl0nKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xyXG4gICAgJCgnOmlucHV0JywgJGZvcm0pLm5vdCgnOmJ1dHRvbiwgOnN1Ym1pdCwgOnJlc2V0LCA6aGlkZGVuLCBbZGF0YS1hYmlkZS1pZ25vcmVdJykudmFsKCcnKS5yZW1vdmVBdHRyKGludmFsaWRBdHRyKTtcclxuICB9O1xyXG4gIEFiaWRlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKXtcclxuICAgIC8vVE9ETyB0aGlzLi4uXHJcbiAgfTtcclxuXHJcbiAgRm91bmRhdGlvbi5wbHVnaW4oQWJpZGUsICdBYmlkZScpO1xyXG5cclxuICAvLyBFeHBvcnRzIGZvciBBTUQvQnJvd3NlcmlmeVxyXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBBYmlkZTtcclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgIGRlZmluZShbJ2ZvdW5kYXRpb24nXSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBBYmlkZTtcclxuICAgIH0pO1xyXG5cclxufShGb3VuZGF0aW9uLCBqUXVlcnkpO1xyXG4iLCIvKipcclxuICogQWNjb3JkaW9uIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmFjY29yZGlvblxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uXHJcbiAqL1xyXG4hZnVuY3Rpb24oJCwgRm91bmRhdGlvbikge1xyXG4gICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBhY2NvcmRpb24uXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIEFjY29yZGlvbiNpbml0XHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byBhbiBhY2NvcmRpb24uXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gQWNjb3JkaW9uKGVsZW1lbnQsIG9wdGlvbnMpe1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgQWNjb3JkaW9uLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdBY2NvcmRpb24nLCB7XHJcbiAgICAgICdFTlRFUic6ICd0b2dnbGUnLFxyXG4gICAgICAnU1BBQ0UnOiAndG9nZ2xlJyxcclxuICAgICAgJ0FSUk9XX0RPV04nOiAnbmV4dCcsXHJcbiAgICAgICdBUlJPV19VUCc6ICdwcmV2aW91cydcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgQWNjb3JkaW9uLmRlZmF1bHRzID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBBbW91bnQgb2YgdGltZSB0byBhbmltYXRlIHRoZSBvcGVuaW5nIG9mIGFuIGFjY29yZGlvbiBwYW5lLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgMjUwXHJcbiAgICAgKi9cclxuICAgIHNsaWRlU3BlZWQ6IDI1MCxcclxuICAgIC8qKlxyXG4gICAgICogQWxsb3cgdGhlIGFjY29yZGlvbiB0byBoYXZlIG11bHRpcGxlIG9wZW4gcGFuZXMuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAgICovXHJcbiAgICBtdWx0aUV4cGFuZDogZmFsc2UsXHJcbiAgICAvKipcclxuICAgICAqIEFsbG93IHRoZSBhY2NvcmRpb24gdG8gY2xvc2UgYWxsIHBhbmVzLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgICAqL1xyXG4gICAgYWxsb3dBbGxDbG9zZWQ6IGZhbHNlXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGFjY29yZGlvbiBieSBhbmltYXRpbmcgdGhlIHByZXNldCBhY3RpdmUgcGFuZShzKS5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIEFjY29yZGlvbi5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cigncm9sZScsICd0YWJsaXN0Jyk7XHJcbiAgICB0aGlzLiR0YWJzID0gdGhpcy4kZWxlbWVudC5jaGlsZHJlbignbGknKTtcclxuICAgIGlmICh0aGlzLiR0YWJzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgIHRoaXMuJHRhYnMgPSB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1hY2NvcmRpb24taXRlbV0nKTtcclxuICAgIH1cclxuICAgIHRoaXMuJHRhYnMuZWFjaChmdW5jdGlvbihpZHgsIGVsKXtcclxuXHJcbiAgICAgIHZhciAkZWwgPSAkKGVsKSxcclxuICAgICAgICAgICRjb250ZW50ID0gJGVsLmZpbmQoJ1tkYXRhLXRhYi1jb250ZW50XScpLFxyXG4gICAgICAgICAgaWQgPSAkY29udGVudFswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdhY2NvcmRpb24nKSxcclxuICAgICAgICAgIGxpbmtJZCA9IGVsLmlkIHx8IGlkICsgJy1sYWJlbCc7XHJcblxyXG4gICAgICAkZWwuZmluZCgnYTpmaXJzdCcpLmF0dHIoe1xyXG4gICAgICAgICdhcmlhLWNvbnRyb2xzJzogaWQsXHJcbiAgICAgICAgJ3JvbGUnOiAndGFiJyxcclxuICAgICAgICAnaWQnOiBsaW5rSWQsXHJcbiAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBmYWxzZSxcclxuICAgICAgICAnYXJpYS1zZWxlY3RlZCc6IGZhbHNlXHJcbiAgICAgIH0pO1xyXG4gICAgICAkY29udGVudC5hdHRyKHsncm9sZSc6ICd0YWJwYW5lbCcsICdhcmlhLWxhYmVsbGVkYnknOiBsaW5rSWQsICdhcmlhLWhpZGRlbic6IHRydWUsICdpZCc6IGlkfSk7XHJcbiAgICB9KTtcclxuICAgIHZhciAkaW5pdEFjdGl2ZSA9IHRoaXMuJGVsZW1lbnQuZmluZCgnLmlzLWFjdGl2ZScpLmNoaWxkcmVuKCdbZGF0YS10YWItY29udGVudF0nKTtcclxuICAgIGlmKCRpbml0QWN0aXZlLmxlbmd0aCl7XHJcbiAgICAgIHRoaXMuZG93bigkaW5pdEFjdGl2ZSwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciBpdGVtcyB3aXRoaW4gdGhlIGFjY29yZGlvbi5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIEFjY29yZGlvbi5wcm90b3R5cGUuX2V2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICB0aGlzLiR0YWJzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgdmFyICRlbGVtID0gJCh0aGlzKTtcclxuICAgICAgdmFyICR0YWJDb250ZW50ID0gJGVsZW0uY2hpbGRyZW4oJ1tkYXRhLXRhYi1jb250ZW50XScpO1xyXG4gICAgICBpZiAoJHRhYkNvbnRlbnQubGVuZ3RoKSB7XHJcbiAgICAgICAgJGVsZW0uY2hpbGRyZW4oJ2EnKS5vZmYoJ2NsaWNrLnpmLmFjY29yZGlvbiBrZXlkb3duLnpmLmFjY29yZGlvbicpXHJcbiAgICAgICAgICAgICAgIC5vbignY2xpY2suemYuYWNjb3JkaW9uJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgLy8gJCh0aGlzKS5jaGlsZHJlbignYScpLm9uKCdjbGljay56Zi5hY2NvcmRpb24nLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICBpZiAoJGVsZW0uaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKSB7XHJcbiAgICAgICAgICAgIGlmKF90aGlzLm9wdGlvbnMuYWxsb3dBbGxDbG9zZWQgfHwgJGVsZW0uc2libGluZ3MoKS5oYXNDbGFzcygnaXMtYWN0aXZlJykpe1xyXG4gICAgICAgICAgICAgIF90aGlzLnVwKCR0YWJDb250ZW50KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIF90aGlzLmRvd24oJHRhYkNvbnRlbnQpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0pLm9uKCdrZXlkb3duLnpmLmFjY29yZGlvbicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgX3RoaXMsIHtcclxuICAgICAgICAgICAgdG9nZ2xlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICBfdGhpcy50b2dnbGUoJHRhYkNvbnRlbnQpO1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAkZWxlbS5uZXh0KCkuZmluZCgnYScpLmZvY3VzKCkudHJpZ2dlcignY2xpY2suemYuYWNjb3JkaW9uJyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAkZWxlbS5wcmV2KCkuZmluZCgnYScpLmZvY3VzKCkudHJpZ2dlcignY2xpY2suemYuYWNjb3JkaW9uJyk7XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBUb2dnbGVzIHRoZSBzZWxlY3RlZCBjb250ZW50IHBhbmUncyBvcGVuL2Nsb3NlIHN0YXRlLlxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkdGFyZ2V0IC0galF1ZXJ5IG9iamVjdCBvZiB0aGUgcGFuZSB0byB0b2dnbGUuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgQWNjb3JkaW9uLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbigkdGFyZ2V0KXtcclxuICAgIGlmKCR0YXJnZXQucGFyZW50KCkuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpKXtcclxuICAgICAgaWYodGhpcy5vcHRpb25zLmFsbG93QWxsQ2xvc2VkIHx8ICR0YXJnZXQucGFyZW50KCkuc2libGluZ3MoKS5oYXNDbGFzcygnaXMtYWN0aXZlJykpe1xyXG4gICAgICAgIHRoaXMudXAoJHRhcmdldCk7XHJcbiAgICAgIH1lbHNleyByZXR1cm47IH1cclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLmRvd24oJHRhcmdldCk7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBPcGVucyB0aGUgYWNjb3JkaW9uIHRhYiBkZWZpbmVkIGJ5IGAkdGFyZ2V0YC5cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIEFjY29yZGlvbiBwYW5lIHRvIG9wZW4uXHJcbiAgICogQHBhcmFtIHtCb29sZWFufSBmaXJzdFRpbWUgLSBmbGFnIHRvIGRldGVybWluZSBpZiByZWZsb3cgc2hvdWxkIGhhcHBlbi5cclxuICAgKiBAZmlyZXMgQWNjb3JkaW9uI2Rvd25cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBBY2NvcmRpb24ucHJvdG90eXBlLmRvd24gPSBmdW5jdGlvbigkdGFyZ2V0LCBmaXJzdFRpbWUpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICBpZighdGhpcy5vcHRpb25zLm11bHRpRXhwYW5kICYmICFmaXJzdFRpbWUpe1xyXG4gICAgICB2YXIgJGN1cnJlbnRBY3RpdmUgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKS5jaGlsZHJlbignW2RhdGEtdGFiLWNvbnRlbnRdJyk7XHJcbiAgICAgIGlmKCRjdXJyZW50QWN0aXZlLmxlbmd0aCl7XHJcbiAgICAgICAgdGhpcy51cCgkY3VycmVudEFjdGl2ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAkdGFyZ2V0XHJcbiAgICAgIC5hdHRyKCdhcmlhLWhpZGRlbicsIGZhbHNlKVxyXG4gICAgICAucGFyZW50KCdbZGF0YS10YWItY29udGVudF0nKVxyXG4gICAgICAuYWRkQmFjaygpXHJcbiAgICAgIC5wYXJlbnQoKS5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgLy8gRm91bmRhdGlvbi5Nb3ZlKF90aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKXtcclxuICAgICAgJHRhcmdldC5zbGlkZURvd24oX3RoaXMub3B0aW9ucy5zbGlkZVNwZWVkKTtcclxuICAgIC8vIH0pO1xyXG5cclxuICAgIC8vIGlmKCFmaXJzdFRpbWUpe1xyXG4gICAgLy8gICBGb3VuZGF0aW9uLl9yZWZsb3codGhpcy4kZWxlbWVudC5hdHRyKCdkYXRhLWFjY29yZGlvbicpKTtcclxuICAgIC8vIH1cclxuICAgICQoJyMnICsgJHRhcmdldC5hdHRyKCdhcmlhLWxhYmVsbGVkYnknKSkuYXR0cih7XHJcbiAgICAgICdhcmlhLWV4cGFuZGVkJzogdHJ1ZSxcclxuICAgICAgJ2FyaWEtc2VsZWN0ZWQnOiB0cnVlXHJcbiAgICB9KTtcclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgdGFiIGlzIGRvbmUgb3BlbmluZy5cclxuICAgICAqIEBldmVudCBBY2NvcmRpb24jZG93blxyXG4gICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ2Rvd24uemYuYWNjb3JkaW9uJywgWyR0YXJnZXRdKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDbG9zZXMgdGhlIHRhYiBkZWZpbmVkIGJ5IGAkdGFyZ2V0YC5cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJHRhcmdldCAtIEFjY29yZGlvbiB0YWIgdG8gY2xvc2UuXHJcbiAgICogQGZpcmVzIEFjY29yZGlvbiN1cFxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIEFjY29yZGlvbi5wcm90b3R5cGUudXAgPSBmdW5jdGlvbigkdGFyZ2V0KSB7XHJcbiAgICB2YXIgJGF1bnRzID0gJHRhcmdldC5wYXJlbnQoKS5zaWJsaW5ncygpLFxyXG4gICAgICAgIF90aGlzID0gdGhpcztcclxuICAgIHZhciBjYW5DbG9zZSA9IHRoaXMub3B0aW9ucy5tdWx0aUV4cGFuZCA/ICRhdW50cy5oYXNDbGFzcygnaXMtYWN0aXZlJykgOiAkdGFyZ2V0LnBhcmVudCgpLmhhc0NsYXNzKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICBpZighdGhpcy5vcHRpb25zLmFsbG93QWxsQ2xvc2VkICYmICFjYW5DbG9zZSl7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICAvLyBGb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQsICR0YXJnZXQsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICR0YXJnZXQuc2xpZGVVcChfdGhpcy5vcHRpb25zLnNsaWRlU3BlZWQpO1xyXG4gICAgLy8gfSk7XHJcblxyXG4gICAgJHRhcmdldC5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpXHJcbiAgICAgICAgICAgLnBhcmVudCgpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICAkKCcjJyArICR0YXJnZXQuYXR0cignYXJpYS1sYWJlbGxlZGJ5JykpLmF0dHIoe1xyXG4gICAgICdhcmlhLWV4cGFuZGVkJzogZmFsc2UsXHJcbiAgICAgJ2FyaWEtc2VsZWN0ZWQnOiBmYWxzZVxyXG4gICB9KTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIHRhYiBpcyBkb25lIGNvbGxhcHNpbmcgdXAuXHJcbiAgICAgKiBAZXZlbnQgQWNjb3JkaW9uI3VwXHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndXAuemYuYWNjb3JkaW9uJywgWyR0YXJnZXRdKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyBhbiBpbnN0YW5jZSBvZiBhbiBhY2NvcmRpb24uXHJcbiAgICogQGZpcmVzIEFjY29yZGlvbiNkZXN0cm95ZWRcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBBY2NvcmRpb24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtdGFiLWNvbnRlbnRdJykuc2xpZGVVcCgwKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XHJcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ2EnKS5vZmYoJy56Zi5hY2NvcmRpb24nKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfTtcclxuXHJcbiAgRm91bmRhdGlvbi5wbHVnaW4oQWNjb3JkaW9uLCAnQWNjb3JkaW9uJyk7XHJcbn0oalF1ZXJ5LCB3aW5kb3cuRm91bmRhdGlvbik7XHJcbiIsIi8qKlxyXG4gKiBBY2NvcmRpb25NZW51IG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmFjY29yZGlvbk1lbnVcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm5lc3RcclxuICovXHJcbiFmdW5jdGlvbigkKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGFuIGFjY29yZGlvbiBtZW51LlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2luaXRcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbiBtZW51LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBmdW5jdGlvbiBBY2NvcmRpb25NZW51KGVsZW1lbnQsIG9wdGlvbnMpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIEFjY29yZGlvbk1lbnUuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLk5lc3QuRmVhdGhlcih0aGlzLiRlbGVtZW50LCAnYWNjb3JkaW9uJyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdBY2NvcmRpb25NZW51Jywge1xyXG4gICAgICAnRU5URVInOiAndG9nZ2xlJyxcclxuICAgICAgJ1NQQUNFJzogJ3RvZ2dsZScsXHJcbiAgICAgICdBUlJPV19SSUdIVCc6ICdvcGVuJyxcclxuICAgICAgJ0FSUk9XX1VQJzogJ3VwJyxcclxuICAgICAgJ0FSUk9XX0RPV04nOiAnZG93bicsXHJcbiAgICAgICdBUlJPV19MRUZUJzogJ2Nsb3NlJyxcclxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZUFsbCcsXHJcbiAgICAgICdUQUInOiAnZG93bicsXHJcbiAgICAgICdTSElGVF9UQUInOiAndXAnXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIEFjY29yZGlvbk1lbnUuZGVmYXVsdHMgPSB7XHJcbiAgICAvKipcclxuICAgICAqIEFtb3VudCBvZiB0aW1lIHRvIGFuaW1hdGUgdGhlIG9wZW5pbmcgb2YgYSBzdWJtZW51IGluIG1zLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgMjUwXHJcbiAgICAgKi9cclxuICAgIHNsaWRlU3BlZWQ6IDI1MCxcclxuICAgIC8qKlxyXG4gICAgICogQWxsb3cgdGhlIG1lbnUgdG8gaGF2ZSBtdWx0aXBsZSBvcGVuIHBhbmVzLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAgICovXHJcbiAgICBtdWx0aU9wZW46IHRydWVcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgYWNjb3JkaW9uIG1lbnUgYnkgaGlkaW5nIGFsbCBuZXN0ZWQgbWVudXMuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBBY2NvcmRpb25NZW51LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLm5vdCgnLmlzLWFjdGl2ZScpLnNsaWRlVXAoMCk7Ly8uZmluZCgnYScpLmNzcygncGFkZGluZy1sZWZ0JywgJzFyZW0nKTtcclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XHJcbiAgICAgICdyb2xlJzogJ3RhYmxpc3QnLFxyXG4gICAgICAnYXJpYS1tdWx0aXNlbGVjdGFibGUnOiB0aGlzLm9wdGlvbnMubXVsdGlPcGVuXHJcbiAgICB9KTtcclxuXHJcbiAgICB0aGlzLiRtZW51TGlua3MgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5oYXMtc3VibWVudScpO1xyXG4gICAgdGhpcy4kbWVudUxpbmtzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgdmFyIGxpbmtJZCA9IHRoaXMuaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnYWNjLW1lbnUtbGluaycpLFxyXG4gICAgICAgICAgJGVsZW0gPSAkKHRoaXMpLFxyXG4gICAgICAgICAgJHN1YiA9ICRlbGVtLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLFxyXG4gICAgICAgICAgc3ViSWQgPSAkc3ViWzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ2FjYy1tZW51JyksXHJcbiAgICAgICAgICBpc0FjdGl2ZSA9ICRzdWIuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gICAgICAkZWxlbS5hdHRyKHtcclxuICAgICAgICAnYXJpYS1jb250cm9scyc6IHN1YklkLFxyXG4gICAgICAgICdhcmlhLWV4cGFuZGVkJzogaXNBY3RpdmUsXHJcbiAgICAgICAgJ2FyaWEtc2VsZWN0ZWQnOiBmYWxzZSxcclxuICAgICAgICAncm9sZSc6ICd0YWInLFxyXG4gICAgICAgICdpZCc6IGxpbmtJZFxyXG4gICAgICB9KTtcclxuICAgICAgJHN1Yi5hdHRyKHtcclxuICAgICAgICAnYXJpYS1sYWJlbGxlZGJ5JzogbGlua0lkLFxyXG4gICAgICAgICdhcmlhLWhpZGRlbic6ICFpc0FjdGl2ZSxcclxuICAgICAgICAncm9sZSc6ICd0YWJwYW5lbCcsXHJcbiAgICAgICAgJ2lkJzogc3ViSWRcclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuICAgIHZhciBpbml0UGFuZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1hY3RpdmUnKTtcclxuICAgIGlmKGluaXRQYW5lcy5sZW5ndGgpe1xyXG4gICAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgICBpbml0UGFuZXMuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgIF90aGlzLmRvd24oJCh0aGlzKSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSBtZW51LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgQWNjb3JkaW9uTWVudS5wcm90b3R5cGUuX2V2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ2xpJykuZWFjaChmdW5jdGlvbigpIHtcclxuICAgICAgdmFyICRzdWJtZW51ID0gJCh0aGlzKS5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKTtcclxuXHJcbiAgICAgIGlmICgkc3VibWVudS5sZW5ndGgpIHtcclxuICAgICAgICAkKHRoaXMpLmNoaWxkcmVuKCdhJykub2ZmKCdjbGljay56Zi5hY2NvcmRpb25tZW51Jykub24oJ2NsaWNrLnpmLmFjY29yZGlvbm1lbnUnLCBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcblxyXG4gICAgICAgICAgX3RoaXMudG9nZ2xlKCRzdWJtZW51KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSkub24oJ2tleWRvd24uemYuYWNjb3JkaW9ubWVudScsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgJGVsZW1lbnRzID0gJGVsZW1lbnQucGFyZW50KCd1bCcpLmNoaWxkcmVuKCdsaScpLFxyXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxyXG4gICAgICAgICAgJG5leHRFbGVtZW50LFxyXG4gICAgICAgICAgJHRhcmdldCA9ICRlbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpO1xyXG5cclxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmlzKCRlbGVtZW50KSkge1xyXG4gICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWF4KDAsIGktMSkpO1xyXG4gICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWluKGkrMSwgJGVsZW1lbnRzLmxlbmd0aC0xKSk7XHJcblxyXG4gICAgICAgICAgaWYgKCQodGhpcykuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdOnZpc2libGUnKS5sZW5ndGgpIHsgLy8gaGFzIG9wZW4gc3ViIG1lbnVcclxuICAgICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnQuZmluZCgnbGk6Zmlyc3QtY2hpbGQnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICgkKHRoaXMpLmlzKCc6Zmlyc3QtY2hpbGQnKSkgeyAvLyBpcyBmaXJzdCBlbGVtZW50IG9mIHN1YiBtZW51XHJcbiAgICAgICAgICAgICRwcmV2RWxlbWVudCA9ICRlbGVtZW50LnBhcmVudHMoJ2xpJykuZmlyc3QoKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoJHByZXZFbGVtZW50LmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XTp2aXNpYmxlJykubGVuZ3RoKSB7IC8vIGlmIHByZXZpb3VzIGVsZW1lbnQgaGFzIG9wZW4gc3ViIG1lbnVcclxuICAgICAgICAgICAgJHByZXZFbGVtZW50ID0gJHByZXZFbGVtZW50LmZpbmQoJ2xpOmxhc3QtY2hpbGQnKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIGlmICgkKHRoaXMpLmlzKCc6bGFzdC1jaGlsZCcpKSB7IC8vIGlzIGxhc3QgZWxlbWVudCBvZiBzdWIgbWVudVxyXG4gICAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkubmV4dCgnbGknKTtcclxuICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgX3RoaXMsIHtcclxuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICgkdGFyZ2V0LmlzKCc6aGlkZGVuJykpIHtcclxuICAgICAgICAgICAgX3RoaXMuZG93bigkdGFyZ2V0KTtcclxuICAgICAgICAgICAgJHRhcmdldC5maW5kKCdsaScpLmZpcnN0KCkuZm9jdXMoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICgkdGFyZ2V0Lmxlbmd0aCAmJiAhJHRhcmdldC5pcygnOmhpZGRlbicpKSB7IC8vIGNsb3NlIGFjdGl2ZSBzdWIgb2YgdGhpcyBpdGVtXHJcbiAgICAgICAgICAgIF90aGlzLnVwKCR0YXJnZXQpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICgkZWxlbWVudC5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7IC8vIGNsb3NlIGN1cnJlbnRseSBvcGVuIHN1YlxyXG4gICAgICAgICAgICBfdGhpcy51cCgkZWxlbWVudC5wYXJlbnQoJ1tkYXRhLXN1Ym1lbnVdJykpO1xyXG4gICAgICAgICAgICAkZWxlbWVudC5wYXJlbnRzKCdsaScpLmZpcnN0KCkuZm9jdXMoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICRwcmV2RWxlbWVudC5mb2N1cygpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZG93bjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAkbmV4dEVsZW1lbnQuZm9jdXMoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHRvZ2dsZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoJGVsZW1lbnQuY2hpbGRyZW4oJ1tkYXRhLXN1Ym1lbnVdJykubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIF90aGlzLnRvZ2dsZSgkZWxlbWVudC5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjbG9zZUFsbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBfdGhpcy5oaWRlQWxsKCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBoYW5kbGVkOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pOy8vLmF0dHIoJ3RhYmluZGV4JywgMCk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBDbG9zZXMgYWxsIHBhbmVzIG9mIHRoZSBtZW51LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIEFjY29yZGlvbk1lbnUucHJvdG90eXBlLmhpZGVBbGwgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLnNsaWRlVXAodGhpcy5vcHRpb25zLnNsaWRlU3BlZWQpO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogVG9nZ2xlcyB0aGUgb3Blbi9jbG9zZSBzdGF0ZSBvZiBhIHN1Ym1lbnUuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSB0aGUgc3VibWVudSB0byB0b2dnbGVcclxuICAgKi9cclxuICBBY2NvcmRpb25NZW51LnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbigkdGFyZ2V0KXtcclxuICAgIGlmKCEkdGFyZ2V0LmlzKCc6YW5pbWF0ZWQnKSkge1xyXG4gICAgICBpZiAoISR0YXJnZXQuaXMoJzpoaWRkZW4nKSkge1xyXG4gICAgICAgIHRoaXMudXAoJHRhcmdldCk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgdGhpcy5kb3duKCR0YXJnZXQpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBPcGVucyB0aGUgc3ViLW1lbnUgZGVmaW5lZCBieSBgJHRhcmdldGAuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBTdWItbWVudSB0byBvcGVuLlxyXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2Rvd25cclxuICAgKi9cclxuICBBY2NvcmRpb25NZW51LnByb3RvdHlwZS5kb3duID0gZnVuY3Rpb24oJHRhcmdldCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICBpZighdGhpcy5vcHRpb25zLm11bHRpT3Blbil7XHJcbiAgICAgIHRoaXMudXAodGhpcy4kZWxlbWVudC5maW5kKCcuaXMtYWN0aXZlJykubm90KCR0YXJnZXQucGFyZW50c1VudGlsKHRoaXMuJGVsZW1lbnQpLmFkZCgkdGFyZ2V0KSkpO1xyXG4gICAgfVxyXG5cclxuICAgICR0YXJnZXQuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpLmF0dHIoeydhcmlhLWhpZGRlbic6IGZhbHNlfSlcclxuICAgICAgLnBhcmVudCgnLmhhcy1zdWJtZW51JykuYXR0cih7J2FyaWEtZXhwYW5kZWQnOiB0cnVlLCAnYXJpYS1zZWxlY3RlZCc6IHRydWV9KTtcclxuXHJcbiAgICAgIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKXtcclxuICAgICAgICAkdGFyZ2V0LnNsaWRlRG93bihfdGhpcy5vcHRpb25zLnNsaWRlU3BlZWQpO1xyXG4gICAgICB9KTtcclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgbWVudSBpcyBkb25lIGNvbGxhcHNpbmcgdXAuXHJcbiAgICAgKiBAZXZlbnQgQWNjb3JkaW9uTWVudSNkb3duXHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignZG93bi56Zi5hY2NvcmRpb25NZW51JywgWyR0YXJnZXRdKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDbG9zZXMgdGhlIHN1Yi1tZW51IGRlZmluZWQgYnkgYCR0YXJnZXRgLiBBbGwgc3ViLW1lbnVzIGluc2lkZSB0aGUgdGFyZ2V0IHdpbGwgYmUgY2xvc2VkIGFzIHdlbGwuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBTdWItbWVudSB0byBjbG9zZS5cclxuICAgKiBAZmlyZXMgQWNjb3JkaW9uTWVudSN1cFxyXG4gICAqL1xyXG4gIEFjY29yZGlvbk1lbnUucHJvdG90eXBlLnVwID0gZnVuY3Rpb24oJHRhcmdldCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgJHRhcmdldCwgZnVuY3Rpb24oKXtcclxuICAgICAgJHRhcmdldC5zbGlkZVVwKF90aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCk7XHJcbiAgICB9KTtcclxuICAgICR0YXJnZXQuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKVxyXG4gICAgICAgICAgIC5maW5kKCdbZGF0YS1zdWJtZW51XScpLnNsaWRlVXAoMCkuYXR0cignYXJpYS1oaWRkZW4nLCB0cnVlKS5lbmQoKVxyXG4gICAgICAgICAgIC5wYXJlbnQoJy5oYXMtc3VibWVudScpXHJcbiAgICAgICAgICAgLmF0dHIoeydhcmlhLWV4cGFuZGVkJzogZmFsc2UsICdhcmlhLXNlbGVjdGVkJzogZmFsc2V9KTtcclxuICAgIC8vICR0YXJnZXQuc2xpZGVVcCh0aGlzLm9wdGlvbnMuc2xpZGVTcGVlZCwgZnVuY3Rpb24oKSB7XHJcbiAgICAvLyAgICR0YXJnZXQuZmluZCgnW2RhdGEtc3VibWVudV0nKS5zbGlkZVVwKDApLmF0dHIoJ2FyaWEtaGlkZGVuJywgdHJ1ZSk7XHJcbiAgICAvLyB9KS5hdHRyKCdhcmlhLWhpZGRlbicsIHRydWUpLnBhcmVudCgnLmhhcy1zdWJtZW51JykuYXR0cih7J2FyaWEtZXhwYW5kZWQnOiBmYWxzZSwgJ2FyaWEtc2VsZWN0ZWQnOiBmYWxzZX0pO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgbWVudSBpcyBkb25lIGNvbGxhcHNpbmcgdXAuXHJcbiAgICAgKiBAZXZlbnQgQWNjb3JkaW9uTWVudSN1cFxyXG4gICAgICovXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3VwLnpmLmFjY29yZGlvbk1lbnUnLCBbJHRhcmdldF0pO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFjY29yZGlvbiBtZW51LlxyXG4gICAqIEBmaXJlcyBBY2NvcmRpb25NZW51I2Rlc3Ryb3llZFxyXG4gICAqL1xyXG4gIEFjY29yZGlvbk1lbnUucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zdWJtZW51XScpLnNsaWRlRG93bigwKS5jc3MoJ2Rpc3BsYXknLCAnJyk7XHJcbiAgICB0aGlzLiRlbGVtZW50LmZpbmQoJ2EnKS5vZmYoJ2NsaWNrLnpmLmFjY29yZGlvbk1lbnUnKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnYWNjb3JkaW9uJyk7XHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfTtcclxuXHJcbiAgRm91bmRhdGlvbi5wbHVnaW4oQWNjb3JkaW9uTWVudSwgJ0FjY29yZGlvbk1lbnUnKTtcclxufShqUXVlcnksIHdpbmRvdy5Gb3VuZGF0aW9uKTtcclxuIiwiLyoqXHJcbiAqIERyaWxsZG93biBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5kcmlsbGRvd25cclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm5lc3RcclxuICovXHJcbiFmdW5jdGlvbigkLCBGb3VuZGF0aW9uKXtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBkcmlsbGRvd24gbWVudS5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbiBtZW51LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBmdW5jdGlvbiBEcmlsbGRvd24oZWxlbWVudCwgb3B0aW9ucyl7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBEcmlsbGRvd24uZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLk5lc3QuRmVhdGhlcih0aGlzLiRlbGVtZW50LCAnZHJpbGxkb3duJyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdEcmlsbGRvd24nLCB7XHJcbiAgICAgICdFTlRFUic6ICdvcGVuJyxcclxuICAgICAgJ1NQQUNFJzogJ29wZW4nLFxyXG4gICAgICAnQVJST1dfUklHSFQnOiAnbmV4dCcsXHJcbiAgICAgICdBUlJPV19VUCc6ICd1cCcsXHJcbiAgICAgICdBUlJPV19ET1dOJzogJ2Rvd24nLFxyXG4gICAgICAnQVJST1dfTEVGVCc6ICdwcmV2aW91cycsXHJcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxyXG4gICAgICAnVEFCJzogJ2Rvd24nLFxyXG4gICAgICAnU0hJRlRfVEFCJzogJ3VwJ1xyXG4gICAgfSk7XHJcbiAgfVxyXG4gIERyaWxsZG93bi5kZWZhdWx0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogTWFya3VwIHVzZWQgZm9yIEpTIGdlbmVyYXRlZCBiYWNrIGJ1dHRvbi4gUHJlcGVuZGVkIHRvIHN1Ym1lbnUgbGlzdHMgYW5kIGRlbGV0ZWQgb24gYGRlc3Ryb3lgIG1ldGhvZCwgJ2pzLWRyaWxsZG93bi1iYWNrJyBjbGFzcyByZXF1aXJlZC4gUmVtb3ZlIHRoZSBiYWNrc2xhc2ggKGBcXGApIGlmIGNvcHkgYW5kIHBhc3RpbmcuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnPFxcbGk+PFxcYT5CYWNrPFxcL2E+PFxcL2xpPidcclxuICAgICAqL1xyXG4gICAgYmFja0J1dHRvbjogJzxsaSBjbGFzcz1cImpzLWRyaWxsZG93bi1iYWNrXCI+PGE+QmFjazwvYT48L2xpPicsXHJcbiAgICAvKipcclxuICAgICAqIE1hcmt1cCB1c2VkIHRvIHdyYXAgZHJpbGxkb3duIG1lbnUuIFVzZSBhIGNsYXNzIG5hbWUgZm9yIGluZGVwZW5kZW50IHN0eWxpbmc7IHRoZSBKUyBhcHBsaWVkIGNsYXNzOiBgaXMtZHJpbGxkb3duYCBpcyByZXF1aXJlZC4gUmVtb3ZlIHRoZSBiYWNrc2xhc2ggKGBcXGApIGlmIGNvcHkgYW5kIHBhc3RpbmcuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnPFxcZGl2IGNsYXNzPVwiaXMtZHJpbGxkb3duXCI+PFxcL2Rpdj4nXHJcbiAgICAgKi9cclxuICAgIHdyYXBwZXI6ICc8ZGl2PjwvZGl2PicsXHJcbiAgICAvKipcclxuICAgICAqIEFsbG93IHRoZSBtZW51IHRvIHJldHVybiB0byByb290IGxpc3Qgb24gYm9keSBjbGljay5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIGNsb3NlT25DbGljazogZmFsc2VcclxuICAgIC8vIGhvbGRPcGVuOiBmYWxzZVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIGRyaWxsZG93biBieSBjcmVhdGluZyBqUXVlcnkgY29sbGVjdGlvbnMgb2YgZWxlbWVudHNcclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIERyaWxsZG93bi5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy4kc3VibWVudUFuY2hvcnMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2xpLmhhcy1zdWJtZW51Jyk7XHJcbiAgICB0aGlzLiRzdWJtZW51cyA9IHRoaXMuJHN1Ym1lbnVBbmNob3JzLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpO1xyXG4gICAgdGhpcy4kbWVudUl0ZW1zID0gdGhpcy4kZWxlbWVudC5maW5kKCdsaTp2aXNpYmxlJykubm90KCcuanMtZHJpbGxkb3duLWJhY2snKS5hdHRyKCdyb2xlJywgJ21lbnVpdGVtJyk7XHJcblxyXG4gICAgdGhpcy5fcHJlcGFyZU1lbnUoKTtcclxuXHJcbiAgICB0aGlzLl9rZXlib2FyZEV2ZW50cygpO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogcHJlcGFyZXMgZHJpbGxkb3duIG1lbnUgYnkgc2V0dGluZyBhdHRyaWJ1dGVzIHRvIGxpbmtzIGFuZCBlbGVtZW50c1xyXG4gICAqIHNldHMgYSBtaW4gaGVpZ2h0IHRvIHByZXZlbnQgY29udGVudCBqdW1waW5nXHJcbiAgICogd3JhcHMgdGhlIGVsZW1lbnQgaWYgbm90IGFscmVhZHkgd3JhcHBlZFxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgRHJpbGxkb3duLnByb3RvdHlwZS5fcHJlcGFyZU1lbnUgPSBmdW5jdGlvbigpe1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIC8vIGlmKCF0aGlzLm9wdGlvbnMuaG9sZE9wZW4pe1xyXG4gICAgLy8gICB0aGlzLl9tZW51TGlua0V2ZW50cygpO1xyXG4gICAgLy8gfVxyXG4gICAgdGhpcy4kc3VibWVudUFuY2hvcnMuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICB2YXIgJHN1YiA9ICQodGhpcyk7XHJcbiAgICAgIHZhciAkbGluayA9ICRzdWIuZmluZCgnYTpmaXJzdCcpO1xyXG4gICAgICAkbGluay5kYXRhKCdzYXZlZEhyZWYnLCAkbGluay5hdHRyKCdocmVmJykpLnJlbW92ZUF0dHIoJ2hyZWYnKTtcclxuICAgICAgJHN1Yi5jaGlsZHJlbignW2RhdGEtc3VibWVudV0nKVxyXG4gICAgICAgICAgLmF0dHIoe1xyXG4gICAgICAgICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxyXG4gICAgICAgICAgICAndGFiaW5kZXgnOiAwLFxyXG4gICAgICAgICAgICAncm9sZSc6ICdtZW51J1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIF90aGlzLl9ldmVudHMoJHN1Yik7XHJcbiAgICB9KTtcclxuICAgIHRoaXMuJHN1Ym1lbnVzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgdmFyICRtZW51ID0gJCh0aGlzKSxcclxuICAgICAgICAgICRiYWNrID0gJG1lbnUuZmluZCgnLmpzLWRyaWxsZG93bi1iYWNrJyk7XHJcbiAgICAgIGlmKCEkYmFjay5sZW5ndGgpe1xyXG4gICAgICAgICRtZW51LnByZXBlbmQoX3RoaXMub3B0aW9ucy5iYWNrQnV0dG9uKTtcclxuICAgICAgfVxyXG4gICAgICBfdGhpcy5fYmFjaygkbWVudSk7XHJcbiAgICB9KTtcclxuICAgIGlmKCF0aGlzLiRlbGVtZW50LnBhcmVudCgpLmhhc0NsYXNzKCdpcy1kcmlsbGRvd24nKSl7XHJcbiAgICAgIHRoaXMuJHdyYXBwZXIgPSAkKHRoaXMub3B0aW9ucy53cmFwcGVyKS5hZGRDbGFzcygnaXMtZHJpbGxkb3duJykuY3NzKHRoaXMuX2dldE1heERpbXMoKSk7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQud3JhcCh0aGlzLiR3cmFwcGVyKTtcclxuICAgIH1cclxuXHJcbiAgfTtcclxuICAvKipcclxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIHRvIGVsZW1lbnRzIGluIHRoZSBtZW51LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gdGhlIGN1cnJlbnQgbWVudSBpdGVtIHRvIGFkZCBoYW5kbGVycyB0by5cclxuICAgKi9cclxuICBEcmlsbGRvd24ucHJvdG90eXBlLl9ldmVudHMgPSBmdW5jdGlvbigkZWxlbSl7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgICRlbGVtLm9mZignY2xpY2suemYuZHJpbGxkb3duJylcclxuICAgIC5vbignY2xpY2suemYuZHJpbGxkb3duJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgIGlmKCQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCAnbGknKS5oYXNDbGFzcygnaXMtZHJpbGxkb3duLXN1Ym1lbnUtcGFyZW50Jykpe1xyXG4gICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBpZihlLnRhcmdldCAhPT0gZS5jdXJyZW50VGFyZ2V0LmZpcnN0RWxlbWVudENoaWxkKXtcclxuICAgICAgLy8gICByZXR1cm4gZmFsc2U7XHJcbiAgICAgIC8vIH1cclxuICAgICAgX3RoaXMuX3Nob3coJGVsZW0pO1xyXG5cclxuICAgICAgaWYoX3RoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spe1xyXG4gICAgICAgIHZhciAkYm9keSA9ICQoJ2JvZHknKS5ub3QoX3RoaXMuJHdyYXBwZXIpO1xyXG4gICAgICAgICRib2R5Lm9mZignLnpmLmRyaWxsZG93bicpLm9uKCdjbGljay56Zi5kcmlsbGRvd24nLCBmdW5jdGlvbihlKXtcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIF90aGlzLl9oaWRlQWxsKCk7XHJcbiAgICAgICAgICAkYm9keS5vZmYoJy56Zi5kcmlsbGRvd24nKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBBZGRzIGtleWRvd24gZXZlbnQgbGlzdGVuZXIgdG8gYGxpYCdzIGluIHRoZSBtZW51LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgRHJpbGxkb3duLnByb3RvdHlwZS5fa2V5Ym9hcmRFdmVudHMgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICB0aGlzLiRtZW51SXRlbXMuYWRkKHRoaXMuJGVsZW1lbnQuZmluZCgnLmpzLWRyaWxsZG93bi1iYWNrJykpLm9uKCdrZXlkb3duLnpmLmRyaWxsZG93bicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICB2YXIgJGVsZW1lbnQgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgJGVsZW1lbnRzID0gJGVsZW1lbnQucGFyZW50KCd1bCcpLmNoaWxkcmVuKCdsaScpLFxyXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxyXG4gICAgICAgICAgJG5leHRFbGVtZW50O1xyXG5cclxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmlzKCRlbGVtZW50KSkge1xyXG4gICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWF4KDAsIGktMSkpO1xyXG4gICAgICAgICAgJG5leHRFbGVtZW50ID0gJGVsZW1lbnRzLmVxKE1hdGgubWluKGkrMSwgJGVsZW1lbnRzLmxlbmd0aC0xKSk7XHJcbiAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgX3RoaXMsIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICgkZWxlbWVudC5pcyhfdGhpcy4kc3VibWVudUFuY2hvcnMpKSB7XHJcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtZW50KTtcclxuICAgICAgICAgICAgJGVsZW1lbnQub24oRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtZW50KSwgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAkZWxlbWVudC5maW5kKCd1bCBsaScpLmZpbHRlcihfdGhpcy4kbWVudUl0ZW1zKS5maXJzdCgpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHJldmlvdXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgX3RoaXMuX2hpZGUoJGVsZW1lbnQucGFyZW50KCd1bCcpKTtcclxuICAgICAgICAgICRlbGVtZW50LnBhcmVudCgndWwnKS5vbihGb3VuZGF0aW9uLnRyYW5zaXRpb25lbmQoJGVsZW1lbnQpLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICRlbGVtZW50LnBhcmVudCgndWwnKS5wYXJlbnQoJ2xpJykuZm9jdXMoKTtcclxuICAgICAgICAgICAgfSwgMSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHVwOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICRwcmV2RWxlbWVudC5mb2N1cygpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZG93bjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAkbmV4dEVsZW1lbnQuZm9jdXMoKTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIF90aGlzLl9iYWNrKCk7XHJcbiAgICAgICAgICAvL190aGlzLiRtZW51SXRlbXMuZmlyc3QoKS5mb2N1cygpOyAvLyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICghJGVsZW1lbnQuaXMoX3RoaXMuJG1lbnVJdGVtcykpIHsgLy8gbm90IG1lbnUgaXRlbSBtZWFucyBiYWNrIGJ1dHRvblxyXG4gICAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbWVudC5wYXJlbnQoJ3VsJykpO1xyXG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7JGVsZW1lbnQucGFyZW50KCd1bCcpLnBhcmVudCgnbGknKS5mb2N1cygpO30sIDEpO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICgkZWxlbWVudC5pcyhfdGhpcy4kc3VibWVudUFuY2hvcnMpKSB7XHJcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtZW50KTtcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyRlbGVtZW50LmZpbmQoJ3VsIGxpJykuZmlsdGVyKF90aGlzLiRtZW51SXRlbXMpLmZpcnN0KCkuZm9jdXMoKTt9LCAxKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7IC8vIGVuZCBrZXlib2FyZEFjY2Vzc1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENsb3NlcyBhbGwgb3BlbiBlbGVtZW50cywgYW5kIHJldHVybnMgdG8gcm9vdCBtZW51LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBmaXJlcyBEcmlsbGRvd24jY2xvc2VkXHJcbiAgICovXHJcbiAgRHJpbGxkb3duLnByb3RvdHlwZS5faGlkZUFsbCA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgJGVsZW0gPSB0aGlzLiRlbGVtZW50LmZpbmQoJy5pcy1kcmlsbGRvd24tc3ViLmlzLWFjdGl2ZScpLmFkZENsYXNzKCdpcy1jbG9zaW5nJyk7XHJcbiAgICAkZWxlbS5vbmUoRm91bmRhdGlvbi50cmFuc2l0aW9uZW5kKCRlbGVtKSwgZnVuY3Rpb24oZSl7XHJcbiAgICAgICRlbGVtLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUgaXMtY2xvc2luZycpO1xyXG4gICAgfSk7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgbWVudSBpcyBmdWxseSBjbG9zZWQuXHJcbiAgICAgICAgICogQGV2ZW50IERyaWxsZG93biNjbG9zZWRcclxuICAgICAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignY2xvc2VkLnpmLmRyaWxsZG93bicpO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lciBmb3IgZWFjaCBgYmFja2AgYnV0dG9uLCBhbmQgY2xvc2VzIG9wZW4gbWVudXMuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQGZpcmVzIERyaWxsZG93biNiYWNrXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRlbGVtIC0gdGhlIGN1cnJlbnQgc3ViLW1lbnUgdG8gYWRkIGBiYWNrYCBldmVudC5cclxuICAgKi9cclxuICBEcmlsbGRvd24ucHJvdG90eXBlLl9iYWNrID0gZnVuY3Rpb24oJGVsZW0pe1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgICRlbGVtLm9mZignY2xpY2suemYuZHJpbGxkb3duJyk7XHJcbiAgICAkZWxlbS5jaGlsZHJlbignLmpzLWRyaWxsZG93bi1iYWNrJylcclxuICAgICAgLm9uKCdjbGljay56Zi5kcmlsbGRvd24nLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIC8vIGNvbnNvbGUubG9nKCdtb3VzZXVwIG9uIGJhY2snKTtcclxuICAgICAgICBfdGhpcy5faGlkZSgkZWxlbSk7XHJcbiAgICAgIH0pO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lciB0byBtZW51IGl0ZW1zIHcvbyBzdWJtZW51cyB0byBjbG9zZSBvcGVuIG1lbnVzIG9uIGNsaWNrLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgRHJpbGxkb3duLnByb3RvdHlwZS5fbWVudUxpbmtFdmVudHMgPSBmdW5jdGlvbigpe1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMuJG1lbnVJdGVtcy5ub3QoJy5oYXMtc3VibWVudScpXHJcbiAgICAgICAgLm9mZignY2xpY2suemYuZHJpbGxkb3duJylcclxuICAgICAgICAub24oJ2NsaWNrLnpmLmRyaWxsZG93bicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgICAgLy8gZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgX3RoaXMuX2hpZGVBbGwoKTtcclxuICAgICAgICAgIH0sIDApO1xyXG4gICAgICB9KTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIE9wZW5zIGEgc3VibWVudS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgRHJpbGxkb3duI29wZW5cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW0gLSB0aGUgY3VycmVudCBlbGVtZW50IHdpdGggYSBzdWJtZW51IHRvIG9wZW4uXHJcbiAgICovXHJcbiAgRHJpbGxkb3duLnByb3RvdHlwZS5fc2hvdyA9IGZ1bmN0aW9uKCRlbGVtKXtcclxuICAgICRlbGVtLmNoaWxkcmVuKCdbZGF0YS1zdWJtZW51XScpLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ29wZW4uemYuZHJpbGxkb3duJywgWyRlbGVtXSk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBIaWRlcyBhIHN1Ym1lbnVcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgRHJpbGxkb3duI2hpZGVcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGVsZW0gLSB0aGUgY3VycmVudCBzdWItbWVudSB0byBoaWRlLlxyXG4gICAqL1xyXG4gIERyaWxsZG93bi5wcm90b3R5cGUuX2hpZGUgPSBmdW5jdGlvbigkZWxlbSl7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgJGVsZW0uYWRkQ2xhc3MoJ2lzLWNsb3NpbmcnKVxyXG4gICAgICAgICAub25lKEZvdW5kYXRpb24udHJhbnNpdGlvbmVuZCgkZWxlbSksIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgJGVsZW0ucmVtb3ZlQ2xhc3MoJ2lzLWFjdGl2ZSBpcy1jbG9zaW5nJyk7XHJcbiAgICAgICAgIH0pO1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBzdWJtZW51IGlzIGhhcyBjbG9zZWQuXHJcbiAgICAgKiBAZXZlbnQgRHJpbGxkb3duI2hpZGVcclxuICAgICAqL1xyXG4gICAgJGVsZW0udHJpZ2dlcignaGlkZS56Zi5kcmlsbGRvd24nLCBbJGVsZW1dKTtcclxuXHJcbiAgfTtcclxuICAvKipcclxuICAgKiBJdGVyYXRlcyB0aHJvdWdoIHRoZSBuZXN0ZWQgbWVudXMgdG8gY2FsY3VsYXRlIHRoZSBtaW4taGVpZ2h0LCBhbmQgbWF4LXdpZHRoIGZvciB0aGUgbWVudS5cclxuICAgKiBQcmV2ZW50cyBjb250ZW50IGp1bXBpbmcuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBEcmlsbGRvd24ucHJvdG90eXBlLl9nZXRNYXhEaW1zID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciBtYXggPSAwLCByZXN1bHQgPSB7fTtcclxuICAgIHRoaXMuJHN1Ym1lbnVzLmFkZCh0aGlzLiRlbGVtZW50KS5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIHZhciBudW1PZkVsZW1zID0gJCh0aGlzKS5jaGlsZHJlbignbGknKS5sZW5ndGg7XHJcbiAgICAgIG1heCA9IG51bU9mRWxlbXMgPiBtYXggPyBudW1PZkVsZW1zIDogbWF4O1xyXG4gICAgfSk7XHJcblxyXG4gICAgcmVzdWx0LmhlaWdodCA9IG1heCAqIHRoaXMuJG1lbnVJdGVtc1swXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS5oZWlnaHQgKyAncHgnO1xyXG4gICAgcmVzdWx0LndpZHRoID0gdGhpcy4kZWxlbWVudFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCArICdweCc7XHJcblxyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIHRoZSBEcmlsbGRvd24gTWVudVxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIERyaWxsZG93bi5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLl9oaWRlQWxsKCk7XHJcbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnZHJpbGxkb3duJyk7XHJcbiAgICB0aGlzLiRlbGVtZW50LnVud3JhcCgpXHJcbiAgICAgICAgICAgICAgICAgLmZpbmQoJy5qcy1kcmlsbGRvd24tYmFjaycpLnJlbW92ZSgpXHJcbiAgICAgICAgICAgICAgICAgLmVuZCgpLmZpbmQoJy5pcy1hY3RpdmUsIC5pcy1jbG9zaW5nLCAuaXMtZHJpbGxkb3duLXN1YicpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUgaXMtY2xvc2luZyBpcy1kcmlsbGRvd24tc3ViJylcclxuICAgICAgICAgICAgICAgICAuZW5kKCkuZmluZCgnW2RhdGEtc3VibWVudV0nKS5yZW1vdmVBdHRyKCdhcmlhLWhpZGRlbiB0YWJpbmRleCByb2xlJylcclxuICAgICAgICAgICAgICAgICAub2ZmKCcuemYuZHJpbGxkb3duJykuZW5kKCkub2ZmKCd6Zi5kcmlsbGRvd24nKTtcclxuICAgIHRoaXMuJGVsZW1lbnQuZmluZCgnYScpLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgdmFyICRsaW5rID0gJCh0aGlzKTtcclxuICAgICAgaWYoJGxpbmsuZGF0YSgnc2F2ZWRIcmVmJykpe1xyXG4gICAgICAgICRsaW5rLmF0dHIoJ2hyZWYnLCAkbGluay5kYXRhKCdzYXZlZEhyZWYnKSkucmVtb3ZlRGF0YSgnc2F2ZWRIcmVmJyk7XHJcbiAgICAgIH1lbHNleyByZXR1cm47IH1cclxuICAgIH0pO1xyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH07XHJcbiAgRm91bmRhdGlvbi5wbHVnaW4oRHJpbGxkb3duLCAnRHJpbGxkb3duJyk7XHJcbn0oalF1ZXJ5LCB3aW5kb3cuRm91bmRhdGlvbik7XHJcbiIsIi8qKlxyXG4gKiBEcm9wZG93biBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5kcm9wZG93blxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XHJcbiAqL1xyXG4hZnVuY3Rpb24oJCwgRm91bmRhdGlvbil7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBkcm9wZG93bi5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbiBtZW51LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBmdW5jdGlvbiBEcm9wZG93bihlbGVtZW50LCBvcHRpb25zKXtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIERyb3Bkb3duLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcbiAgICB0aGlzLl9pbml0KCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0Ryb3Bkb3duJywge1xyXG4gICAgICAnRU5URVInOiAnb3BlbicsXHJcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcclxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZScsXHJcbiAgICAgICdUQUInOiAndGFiX2ZvcndhcmQnLFxyXG4gICAgICAnU0hJRlRfVEFCJzogJ3RhYl9iYWNrd2FyZCdcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgRHJvcGRvd24uZGVmYXVsdHMgPSB7XHJcbiAgICAvKipcclxuICAgICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IG9wZW5pbmcgYSBzdWJtZW51IG9uIGhvdmVyIGV2ZW50LlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgMjUwXHJcbiAgICAgKi9cclxuICAgIGhvdmVyRGVsYXk6IDI1MCxcclxuICAgIC8qKlxyXG4gICAgICogQWxsb3cgc3VibWVudXMgdG8gb3BlbiBvbiBob3ZlciBldmVudHNcclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIGhvdmVyOiBmYWxzZSxcclxuICAgIC8qKlxyXG4gICAgICogRG9uJ3QgY2xvc2UgZHJvcGRvd24gd2hlbiBob3ZlcmluZyBvdmVyIGRyb3Bkb3duIHBhbmVcclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgaG92ZXJQYW5lOiBmYWxzZSxcclxuICAgIC8qKlxyXG4gICAgICogTnVtYmVyIG9mIHBpeGVscyBiZXR3ZWVuIHRoZSBkcm9wZG93biBwYW5lIGFuZCB0aGUgdHJpZ2dlcmluZyBlbGVtZW50IG9uIG9wZW4uXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAxXHJcbiAgICAgKi9cclxuICAgIHZPZmZzZXQ6IDEsXHJcbiAgICAvKipcclxuICAgICAqIE51bWJlciBvZiBwaXhlbHMgYmV0d2VlbiB0aGUgZHJvcGRvd24gcGFuZSBhbmQgdGhlIHRyaWdnZXJpbmcgZWxlbWVudCBvbiBvcGVuLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgMVxyXG4gICAgICovXHJcbiAgICBoT2Zmc2V0OiAxLFxyXG4gICAgLyoqXHJcbiAgICAgKiBDbGFzcyBhcHBsaWVkIHRvIGFkanVzdCBvcGVuIHBvc2l0aW9uLiBKUyB3aWxsIHRlc3QgYW5kIGZpbGwgdGhpcyBpbi5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICd0b3AnXHJcbiAgICAgKi9cclxuICAgIHBvc2l0aW9uQ2xhc3M6ICcnLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBbGxvdyB0aGUgcGx1Z2luIHRvIHRyYXAgZm9jdXMgdG8gdGhlIGRyb3Bkb3duIHBhbmUgaWYgb3BlbmVkIHdpdGgga2V5Ym9hcmQgY29tbWFuZHMuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAgICovXHJcbiAgICB0cmFwRm9jdXM6IGZhbHNlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBbGxvdyB0aGUgcGx1Z2luIHRvIHNldCBmb2N1cyB0byB0aGUgZmlyc3QgZm9jdXNhYmxlIGVsZW1lbnQgd2l0aGluIHRoZSBwYW5lLCByZWdhcmRsZXNzIG9mIG1ldGhvZCBvZiBvcGVuaW5nLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAgICovXHJcbiAgICBhdXRvRm9jdXM6IGZhbHNlXHJcbiAgfTtcclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luIGJ5IHNldHRpbmcvY2hlY2tpbmcgb3B0aW9ucyBhbmQgYXR0cmlidXRlcywgYWRkaW5nIGhlbHBlciB2YXJpYWJsZXMsIGFuZCBzYXZpbmcgdGhlIGFuY2hvci5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIERyb3Bkb3duLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgJGlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpO1xyXG5cclxuICAgIHRoaXMuJGFuY2hvciA9ICQoJ1tkYXRhLXRvZ2dsZT1cIicgKyAkaWQgKyAnXCJdJykgfHwgJCgnW2RhdGEtb3Blbj1cIicgKyAkaWQgKyAnXCJdJyk7XHJcbiAgICB0aGlzLiRhbmNob3IuYXR0cih7XHJcbiAgICAgICdhcmlhLWNvbnRyb2xzJzogJGlkLFxyXG4gICAgICAnZGF0YS1pcy1mb2N1cyc6IGZhbHNlLFxyXG4gICAgICAnZGF0YS15ZXRpLWJveCc6ICRpZCxcclxuICAgICAgJ2FyaWEtaGFzcG9wdXAnOiB0cnVlLFxyXG4gICAgICAnYXJpYS1leHBhbmRlZCc6IGZhbHNlXHJcbiAgICAgIC8vICdkYXRhLXJlc2l6ZSc6ICRpZFxyXG4gICAgfSk7XHJcblxyXG4gICAgdGhpcy5vcHRpb25zLnBvc2l0aW9uQ2xhc3MgPSB0aGlzLmdldFBvc2l0aW9uQ2xhc3MoKTtcclxuICAgIHRoaXMuY291bnRlciA9IDQ7XHJcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMgPSBbXTtcclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XHJcbiAgICAgICdhcmlhLWhpZGRlbic6ICd0cnVlJyxcclxuICAgICAgJ2RhdGEteWV0aS1ib3gnOiAkaWQsXHJcbiAgICAgICdkYXRhLXJlc2l6ZSc6ICRpZCxcclxuICAgICAgJ2FyaWEtbGFiZWxsZWRieSc6IHRoaXMuJGFuY2hvclswXS5pZCB8fCBGb3VuZGF0aW9uLkdldFlvRGlnaXRzKDYsICdkZC1hbmNob3InKVxyXG4gICAgfSk7XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIEhlbHBlciBmdW5jdGlvbiB0byBkZXRlcm1pbmUgY3VycmVudCBvcmllbnRhdGlvbiBvZiBkcm9wZG93biBwYW5lLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEByZXR1cm5zIHtTdHJpbmd9IHBvc2l0aW9uIC0gc3RyaW5nIHZhbHVlIG9mIGEgcG9zaXRpb24gY2xhc3MuXHJcbiAgICovXHJcbiAgRHJvcGRvd24ucHJvdG90eXBlLmdldFBvc2l0aW9uQ2xhc3MgPSBmdW5jdGlvbigpe1xyXG4gICAgdmFyIHBvc2l0aW9uID0gdGhpcy4kZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goLyh0b3B8bGVmdHxyaWdodCkvZyk7XHJcbiAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiA/IHBvc2l0aW9uWzBdIDogJyc7XHJcbiAgICByZXR1cm4gcG9zaXRpb247XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBBZGp1c3RzIHRoZSBkcm9wZG93biBwYW5lcyBvcmllbnRhdGlvbiBieSBhZGRpbmcvcmVtb3ZpbmcgcG9zaXRpb25pbmcgY2xhc3Nlcy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwb3NpdGlvbiAtIHBvc2l0aW9uIGNsYXNzIHRvIHJlbW92ZS5cclxuICAgKi9cclxuICBEcm9wZG93bi5wcm90b3R5cGUuX3JlcG9zaXRpb24gPSBmdW5jdGlvbihwb3NpdGlvbil7XHJcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMucHVzaChwb3NpdGlvbiA/IHBvc2l0aW9uIDogJ2JvdHRvbScpO1xyXG4gICAgLy9kZWZhdWx0LCB0cnkgc3dpdGNoaW5nIHRvIG9wcG9zaXRlIHNpZGVcclxuICAgIGlmKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCd0b3AnKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxyXG4gICAgICAgICAgLmFkZENsYXNzKCdyaWdodCcpO1xyXG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pXHJcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2xlZnQnKTtcclxuICAgIH1cclxuXHJcbiAgICAvL2lmIGRlZmF1bHQgY2hhbmdlIGRpZG4ndCB3b3JrLCB0cnkgYm90dG9tIG9yIGxlZnQgZmlyc3RcclxuICAgIGVsc2UgaWYoIXBvc2l0aW9uICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigndG9wJykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuYWRkQ2xhc3MoJ2xlZnQnKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxyXG4gICAgICAgICAgLmFkZENsYXNzKCdsZWZ0Jyk7XHJcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAncmlnaHQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSl7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xyXG4gICAgfVxyXG4gICAgLy9pZiBub3RoaW5nIGNsZWFyZWQsIHNldCB0byBib3R0b21cclxuICAgIGVsc2V7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jbGFzc0NoYW5nZWQgPSB0cnVlO1xyXG4gICAgdGhpcy5jb3VudGVyLS07XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBhbmQgb3JpZW50YXRpb24gb2YgdGhlIGRyb3Bkb3duIHBhbmUsIGNoZWNrcyBmb3IgY29sbGlzaW9ucy5cclxuICAgKiBSZWN1cnNpdmVseSBjYWxscyBpdHNlbGYgaWYgYSBjb2xsaXNpb24gaXMgZGV0ZWN0ZWQsIHdpdGggYSBuZXcgcG9zaXRpb24gY2xhc3MuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBEcm9wZG93bi5wcm90b3R5cGUuX3NldFBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMuJGFuY2hvci5hdHRyKCdhcmlhLWV4cGFuZGVkJykgPT09ICdmYWxzZScpeyByZXR1cm4gZmFsc2U7IH1cclxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuZ2V0UG9zaXRpb25DbGFzcygpLFxyXG4gICAgICAgICRlbGVEaW1zID0gRm91bmRhdGlvbi5Cb3guR2V0RGltZW5zaW9ucyh0aGlzLiRlbGVtZW50KSxcclxuICAgICAgICAkYW5jaG9yRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy4kYW5jaG9yKSxcclxuICAgICAgICBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgZGlyZWN0aW9uID0gKHBvc2l0aW9uID09PSAnbGVmdCcgPyAnbGVmdCcgOiAoKHBvc2l0aW9uID09PSAncmlnaHQnKSA/ICdsZWZ0JyA6ICd0b3AnKSksXHJcbiAgICAgICAgcGFyYW0gPSAoZGlyZWN0aW9uID09PSAndG9wJykgPyAnaGVpZ2h0JyA6ICd3aWR0aCcsXHJcbiAgICAgICAgb2Zmc2V0ID0gKHBhcmFtID09PSAnaGVpZ2h0JykgPyB0aGlzLm9wdGlvbnMudk9mZnNldCA6IHRoaXMub3B0aW9ucy5oT2Zmc2V0O1xyXG5cclxuICAgIGlmKCgkZWxlRGltcy53aWR0aCA+PSAkZWxlRGltcy53aW5kb3dEaW1zLndpZHRoKSB8fCAoIXRoaXMuY291bnRlciAmJiAhRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLiRlbGVtZW50KSkpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJGFuY2hvciwgJ2NlbnRlciBib3R0b20nLCB0aGlzLm9wdGlvbnMudk9mZnNldCwgdGhpcy5vcHRpb25zLmhPZmZzZXQsIHRydWUpKS5jc3Moe1xyXG4gICAgICAgICd3aWR0aCc6ICRlbGVEaW1zLndpbmRvd0RpbXMud2lkdGggLSAodGhpcy5vcHRpb25zLmhPZmZzZXQgKiAyKSxcclxuICAgICAgICAnaGVpZ2h0JzogJ2F1dG8nXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IHRydWU7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLiRlbGVtZW50Lm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIHRoaXMuJGFuY2hvciwgcG9zaXRpb24sIHRoaXMub3B0aW9ucy52T2Zmc2V0LCB0aGlzLm9wdGlvbnMuaE9mZnNldCkpO1xyXG5cclxuICAgIHdoaWxlKCFGb3VuZGF0aW9uLkJveC5JbU5vdFRvdWNoaW5nWW91KHRoaXMuJGVsZW1lbnQpICYmIHRoaXMuY291bnRlcil7XHJcbiAgICAgIHRoaXMuX3JlcG9zaXRpb24ocG9zaXRpb24pO1xyXG4gICAgICB0aGlzLl9zZXRQb3NpdGlvbigpO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIGVsZW1lbnQgdXRpbGl6aW5nIHRoZSB0cmlnZ2VycyB1dGlsaXR5IGxpYnJhcnkuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBEcm9wZG93bi5wcm90b3R5cGUuX2V2ZW50cyA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdGhpcy4kZWxlbWVudC5vbih7XHJcbiAgICAgICdvcGVuLnpmLnRyaWdnZXInOiB0aGlzLm9wZW4uYmluZCh0aGlzKSxcclxuICAgICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXHJcbiAgICAgICd0b2dnbGUuemYudHJpZ2dlcic6IHRoaXMudG9nZ2xlLmJpbmQodGhpcyksXHJcbiAgICAgICdyZXNpemVtZS56Zi50cmlnZ2VyJzogdGhpcy5fc2V0UG9zaXRpb24uYmluZCh0aGlzKVxyXG4gICAgfSk7XHJcblxyXG4gICAgaWYodGhpcy5vcHRpb25zLmhvdmVyKXtcclxuICAgICAgdGhpcy4kYW5jaG9yLm9mZignbW91c2VlbnRlci56Zi5kcm9wZG93biBtb3VzZWxlYXZlLnpmLmRyb3Bkb3duJylcclxuICAgICAgICAgIC5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bicsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgX3RoaXMudGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICBfdGhpcy5vcGVuKCk7XHJcbiAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5kYXRhKCdob3ZlcicsIHRydWUpO1xyXG4gICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xyXG4gICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBjbGVhclRpbWVvdXQoX3RoaXMudGltZW91dCk7XHJcbiAgICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcclxuICAgICAgICAgICAgICBfdGhpcy4kYW5jaG9yLmRhdGEoJ2hvdmVyJywgZmFsc2UpO1xyXG4gICAgICAgICAgICB9LCBfdGhpcy5vcHRpb25zLmhvdmVyRGVsYXkpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIGlmKHRoaXMub3B0aW9ucy5ob3ZlclBhbmUpe1xyXG4gICAgICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdtb3VzZWVudGVyLnpmLmRyb3Bkb3duIG1vdXNlbGVhdmUuemYuZHJvcGRvd24nKVxyXG4gICAgICAgICAgICAub24oJ21vdXNlZW50ZXIuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgfSkub24oJ21vdXNlbGVhdmUuemYuZHJvcGRvd24nLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcclxuICAgICAgICAgICAgICBfdGhpcy50aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgX3RoaXMuY2xvc2UoKTtcclxuICAgICAgICAgICAgICAgIF90aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInLCBmYWxzZSk7XHJcbiAgICAgICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHRoaXMuJGFuY2hvci5hZGQodGhpcy4kZWxlbWVudCkub24oJ2tleWRvd24uemYuZHJvcGRvd24nLCBmdW5jdGlvbihlKSB7XHJcblxyXG4gICAgICB2YXIgJHRhcmdldCA9ICQodGhpcyksXHJcbiAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKF90aGlzLiRlbGVtZW50KTtcclxuXHJcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsIF90aGlzLCB7XHJcbiAgICAgICAgdGFiX2ZvcndhcmQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKHRoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXModmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKC0xKSkpIHsgLy8gbGVmdCBtb2RhbCBkb3dud2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gZmlyc3QgZWxlbWVudFxyXG4gICAgICAgICAgICBpZiAodGhpcy5vcHRpb25zLnRyYXBGb2N1cykgeyAvLyBpZiBmb2N1cyBzaGFsbCBiZSB0cmFwcGVkXHJcbiAgICAgICAgICAgICAgdmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKDApLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB9IGVsc2UgeyAvLyBpZiBmb2N1cyBpcyBub3QgdHJhcHBlZCwgY2xvc2UgZHJvcGRvd24gb24gZm9jdXMgb3V0XHJcbiAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICB0YWJfYmFja3dhcmQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKHRoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXModmlzaWJsZUZvY3VzYWJsZUVsZW1lbnRzLmVxKDApKSB8fCB0aGlzLiRlbGVtZW50LmlzKCc6Zm9jdXMnKSkgeyAvLyBsZWZ0IG1vZGFsIHVwd2FyZHMsIHNldHRpbmcgZm9jdXMgdG8gbGFzdCBlbGVtZW50XHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMudHJhcEZvY3VzKSB7IC8vIGlmIGZvY3VzIHNoYWxsIGJlIHRyYXBwZWRcclxuICAgICAgICAgICAgICB2aXNpYmxlRm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpLmZvY3VzKCk7XHJcbiAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB9IGVsc2UgeyAvLyBpZiBmb2N1cyBpcyBub3QgdHJhcHBlZCwgY2xvc2UgZHJvcGRvd24gb24gZm9jdXMgb3V0XHJcbiAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBvcGVuOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICgkdGFyZ2V0LmlzKF90aGlzLiRhbmNob3IpKSB7XHJcbiAgICAgICAgICAgIF90aGlzLm9wZW4oKTtcclxuICAgICAgICAgICAgX3RoaXMuJGVsZW1lbnQuYXR0cigndGFiaW5kZXgnLCAtMSkuZm9jdXMoKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY2xvc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgX3RoaXMuY2xvc2UoKTtcclxuICAgICAgICAgIF90aGlzLiRhbmNob3IuZm9jdXMoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBPcGVucyB0aGUgZHJvcGRvd24gcGFuZSwgYW5kIGZpcmVzIGEgYnViYmxpbmcgZXZlbnQgdG8gY2xvc2Ugb3RoZXIgZHJvcGRvd25zLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBmaXJlcyBEcm9wZG93biNjbG9zZW1lXHJcbiAgICogQGZpcmVzIERyb3Bkb3duI3Nob3dcclxuICAgKi9cclxuICBEcm9wZG93bi5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uKCl7XHJcbiAgICAvLyB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB0byBjbG9zZSBvdGhlciBvcGVuIGRyb3Bkb3duc1xyXG4gICAgICogQGV2ZW50IERyb3Bkb3duI2Nsb3NlbWVcclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZW1lLnpmLmRyb3Bkb3duJywgdGhpcy4kZWxlbWVudC5hdHRyKCdpZCcpKTtcclxuICAgIHRoaXMuJGFuY2hvci5hZGRDbGFzcygnaG92ZXInKVxyXG4gICAgICAgIC5hdHRyKHsnYXJpYS1leHBhbmRlZCc6IHRydWV9KTtcclxuICAgIC8vIHRoaXMuJGVsZW1lbnQvKi5zaG93KCkqLztcclxuICAgIHRoaXMuX3NldFBvc2l0aW9uKCk7XHJcbiAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKCdpcy1vcGVuJylcclxuICAgICAgICAuYXR0cih7J2FyaWEtaGlkZGVuJzogZmFsc2V9KTtcclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMuYXV0b0ZvY3VzKXtcclxuICAgICAgdmFyICRmb2N1c2FibGUgPSBGb3VuZGF0aW9uLktleWJvYXJkLmZpbmRGb2N1c2FibGUodGhpcy4kZWxlbWVudCk7XHJcbiAgICAgIGlmKCRmb2N1c2FibGUubGVuZ3RoKXtcclxuICAgICAgICAkZm9jdXNhYmxlLmVxKDApLmZvY3VzKCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyBvbmNlIHRoZSBkcm9wZG93biBpcyB2aXNpYmxlLlxyXG4gICAgICogQGV2ZW50IERyb3Bkb3duI3Nob3dcclxuICAgICAqL1xyXG4gICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi5kcm9wZG93bicsIFt0aGlzLiRlbGVtZW50XSk7XHJcbiAgICAvL3doeSBkb2VzIHRoaXMgbm90IHdvcmsgY29ycmVjdGx5IGZvciB0aGlzIHBsdWdpbj9cclxuICAgIC8vIEZvdW5kYXRpb24ucmVmbG93KHRoaXMuJGVsZW1lbnQsICdkcm9wZG93bicpO1xyXG4gICAgLy8gRm91bmRhdGlvbi5fcmVmbG93KHRoaXMuJGVsZW1lbnQuYXR0cignZGF0YS1kcm9wZG93bicpKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBDbG9zZXMgdGhlIG9wZW4gZHJvcGRvd24gcGFuZS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgRHJvcGRvd24jaGlkZVxyXG4gICAqL1xyXG4gIERyb3Bkb3duLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICBpZighdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKXtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcygnaXMtb3BlbicpXHJcbiAgICAgICAgLmF0dHIoeydhcmlhLWhpZGRlbic6IHRydWV9KTtcclxuXHJcbiAgICB0aGlzLiRhbmNob3IucmVtb3ZlQ2xhc3MoJ2hvdmVyJylcclxuICAgICAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKTtcclxuXHJcbiAgICBpZih0aGlzLmNsYXNzQ2hhbmdlZCl7XHJcbiAgICAgIHZhciBjdXJQb3NpdGlvbkNsYXNzID0gdGhpcy5nZXRQb3NpdGlvbkNsYXNzKCk7XHJcbiAgICAgIGlmKGN1clBvc2l0aW9uQ2xhc3Mpe1xyXG4gICAgICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoY3VyUG9zaXRpb25DbGFzcyk7XHJcbiAgICAgIH1cclxuICAgICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMucG9zaXRpb25DbGFzcylcclxuICAgICAgICAgIC8qLmhpZGUoKSovLmNzcyh7aGVpZ2h0OiAnJywgd2lkdGg6ICcnfSk7XHJcbiAgICAgIHRoaXMuY2xhc3NDaGFuZ2VkID0gZmFsc2U7XHJcbiAgICAgIHRoaXMuY291bnRlciA9IDQ7XHJcbiAgICAgIHRoaXMudXNlZFBvc2l0aW9ucy5sZW5ndGggPSAwO1xyXG4gICAgfVxyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdoaWRlLnpmLmRyb3Bkb3duJywgW3RoaXMuJGVsZW1lbnRdKTtcclxuICAgIC8vIEZvdW5kYXRpb24ucmVmbG93KHRoaXMuJGVsZW1lbnQsICdkcm9wZG93bicpO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogVG9nZ2xlcyB0aGUgZHJvcGRvd24gcGFuZSdzIHZpc2liaWxpdHkuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgRHJvcGRvd24ucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICBpZih0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpe1xyXG4gICAgICBpZih0aGlzLiRhbmNob3IuZGF0YSgnaG92ZXInKSkgcmV0dXJuO1xyXG4gICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5vcGVuKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBEZXN0cm95cyB0aGUgZHJvcGRvd24uXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgRHJvcGRvd24ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyJykuaGlkZSgpO1xyXG4gICAgdGhpcy4kYW5jaG9yLm9mZignLnpmLmRyb3Bkb3duJyk7XHJcblxyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH07XHJcblxyXG4gIEZvdW5kYXRpb24ucGx1Z2luKERyb3Bkb3duLCAnRHJvcGRvd24nKTtcclxufShqUXVlcnksIHdpbmRvdy5Gb3VuZGF0aW9uKTtcclxuIiwiLyoqXHJcbiAqIERyb3Bkb3duTWVudSBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5kcm9wZG93bi1tZW51XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5ib3hcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5uZXN0XHJcbiAqL1xyXG4hZnVuY3Rpb24oJCwgRm91bmRhdGlvbil7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIERyb3Bkb3duTWVudS5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgRHJvcGRvd25NZW51I2luaXRcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGEgZHJvcGRvd24gbWVudS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gRHJvcGRvd25NZW51KGVsZW1lbnQsIG9wdGlvbnMpe1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgRHJvcGRvd25NZW51LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5OZXN0LkZlYXRoZXIodGhpcy4kZWxlbWVudCwgJ2Ryb3Bkb3duJyk7XHJcbiAgICB0aGlzLl9pbml0KCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ0Ryb3Bkb3duTWVudScsIHtcclxuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxyXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXHJcbiAgICAgICdBUlJPV19SSUdIVCc6ICduZXh0JyxcclxuICAgICAgJ0FSUk9XX1VQJzogJ3VwJyxcclxuICAgICAgJ0FSUk9XX0RPV04nOiAnZG93bicsXHJcbiAgICAgICdBUlJPV19MRUZUJzogJ3ByZXZpb3VzJyxcclxuICAgICAgJ0VTQ0FQRSc6ICdjbG9zZSdcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogRGVmYXVsdCBzZXR0aW5ncyBmb3IgcGx1Z2luXHJcbiAgICovXHJcbiAgRHJvcGRvd25NZW51LmRlZmF1bHRzID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBEaXNhbGxvd3MgaG92ZXIgZXZlbnRzIGZyb20gb3BlbmluZyBzdWJtZW51c1xyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgICAqL1xyXG4gICAgZGlzYWJsZUhvdmVyOiBmYWxzZSxcclxuICAgIC8qKlxyXG4gICAgICogQWxsb3cgYSBzdWJtZW51IHRvIGF1dG9tYXRpY2FsbHkgY2xvc2Ugb24gYSBtb3VzZWxlYXZlIGV2ZW50LCBpZiBub3QgY2xpY2tlZCBvcGVuLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAgICovXHJcbiAgICBhdXRvY2xvc2U6IHRydWUsXHJcbiAgICAvKipcclxuICAgICAqIEFtb3VudCBvZiB0aW1lIHRvIGRlbGF5IG9wZW5pbmcgYSBzdWJtZW51IG9uIGhvdmVyIGV2ZW50LlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgNTBcclxuICAgICAqL1xyXG4gICAgaG92ZXJEZWxheTogNTAsXHJcbiAgICAvKipcclxuICAgICAqIEFsbG93IGEgc3VibWVudSB0byBvcGVuL3JlbWFpbiBvcGVuIG9uIHBhcmVudCBjbGljayBldmVudC4gQWxsb3dzIGN1cnNvciB0byBtb3ZlIGF3YXkgZnJvbSBtZW51LlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAgICovXHJcbiAgICBjbGlja09wZW46IGZhbHNlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBbW91bnQgb2YgdGltZSB0byBkZWxheSBjbG9zaW5nIGEgc3VibWVudSBvbiBhIG1vdXNlbGVhdmUgZXZlbnQuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSA1MDBcclxuICAgICAqL1xyXG5cclxuICAgIGNsb3NpbmdUaW1lOiA1MDAsXHJcbiAgICAvKipcclxuICAgICAqIFBvc2l0aW9uIG9mIHRoZSBtZW51IHJlbGF0aXZlIHRvIHdoYXQgZGlyZWN0aW9uIHRoZSBzdWJtZW51cyBzaG91bGQgb3Blbi4gSGFuZGxlZCBieSBKUy5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICdsZWZ0J1xyXG4gICAgICovXHJcbiAgICBhbGlnbm1lbnQ6ICdsZWZ0JyxcclxuICAgIC8qKlxyXG4gICAgICogQWxsb3cgY2xpY2tzIG9uIHRoZSBib2R5IHRvIGNsb3NlIGFueSBvcGVuIHN1Ym1lbnVzLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAgICovXHJcbiAgICBjbG9zZU9uQ2xpY2s6IHRydWUsXHJcbiAgICAvKipcclxuICAgICAqIENsYXNzIGFwcGxpZWQgdG8gdmVydGljYWwgb3JpZW50ZWQgbWVudXMsIEZvdW5kYXRpb24gZGVmYXVsdCBpcyBgdmVydGljYWxgLiBVcGRhdGUgdGhpcyBpZiB1c2luZyB5b3VyIG93biBjbGFzcy5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICd2ZXJ0aWNhbCdcclxuICAgICAqL1xyXG4gICAgdmVydGljYWxDbGFzczogJ3ZlcnRpY2FsJyxcclxuICAgIC8qKlxyXG4gICAgICogQ2xhc3MgYXBwbGllZCB0byByaWdodC1zaWRlIG9yaWVudGVkIG1lbnVzLCBGb3VuZGF0aW9uIGRlZmF1bHQgaXMgYGFsaWduLXJpZ2h0YC4gVXBkYXRlIHRoaXMgaWYgdXNpbmcgeW91ciBvd24gY2xhc3MuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnYWxpZ24tcmlnaHQnXHJcbiAgICAgKi9cclxuICAgIHJpZ2h0Q2xhc3M6ICdhbGlnbi1yaWdodCcsXHJcbiAgICAvKipcclxuICAgICAqIEJvb2xlYW4gdG8gZm9yY2Ugb3ZlcmlkZSB0aGUgY2xpY2tpbmcgb2YgbGlua3MgdG8gcGVyZm9ybSBkZWZhdWx0IGFjdGlvbiwgb24gc2Vjb25kIHRvdWNoIGV2ZW50IGZvciBtb2JpbGUuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAgICovXHJcbiAgICBmb3JjZUZvbGxvdzogdHJ1ZVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIHBsdWdpbiwgYW5kIGNhbGxzIF9wcmVwYXJlTWVudVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgRHJvcGRvd25NZW51LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgc3VicyA9IHRoaXMuJGVsZW1lbnQuZmluZCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKTtcclxuICAgIHRoaXMuJGVsZW1lbnQuY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpLmFkZENsYXNzKCdmaXJzdC1zdWInKTtcclxuXHJcbiAgICB0aGlzLiRtZW51SXRlbXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tyb2xlPVwibWVudWl0ZW1cIl0nKTtcclxuICAgIHRoaXMuJHRhYnMgPSB0aGlzLiRlbGVtZW50LmNoaWxkcmVuKCdbcm9sZT1cIm1lbnVpdGVtXCJdJyk7XHJcbiAgICB0aGlzLmlzVmVydCA9IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3ModGhpcy5vcHRpb25zLnZlcnRpY2FsQ2xhc3MpO1xyXG4gICAgdGhpcy4kdGFicy5maW5kKCd1bC5pcy1kcm9wZG93bi1zdWJtZW51JykuYWRkQ2xhc3ModGhpcy5vcHRpb25zLnZlcnRpY2FsQ2xhc3MpO1xyXG5cclxuICAgIGlmKHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3ModGhpcy5vcHRpb25zLnJpZ2h0Q2xhc3MpIHx8IHRoaXMub3B0aW9ucy5hbGlnbm1lbnQgPT09ICdyaWdodCcpe1xyXG4gICAgICB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID0gJ3JpZ2h0JztcclxuICAgICAgc3Vicy5hZGRDbGFzcygnaXMtbGVmdC1hcnJvdyBvcGVucy1sZWZ0Jyk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgc3Vicy5hZGRDbGFzcygnaXMtcmlnaHQtYXJyb3cgb3BlbnMtcmlnaHQnKTtcclxuICAgIH1cclxuICAgIGlmKCF0aGlzLmlzVmVydCl7XHJcbiAgICAgIHRoaXMuJHRhYnMuZmlsdGVyKCcuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5yZW1vdmVDbGFzcygnaXMtcmlnaHQtYXJyb3cgaXMtbGVmdC1hcnJvdyBvcGVucy1yaWdodCBvcGVucy1sZWZ0JylcclxuICAgICAgICAgIC5hZGRDbGFzcygnaXMtZG93bi1hcnJvdycpO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jaGFuZ2VkID0gZmFsc2U7XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIGVsZW1lbnRzIHdpdGhpbiB0aGUgbWVudVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgRHJvcGRvd25NZW51LnByb3RvdHlwZS5fZXZlbnRzID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgaGFzVG91Y2ggPSAnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3cgfHwgKHR5cGVvZiB3aW5kb3cub250b3VjaHN0YXJ0ICE9PSAndW5kZWZpbmVkJyksXHJcbiAgICAgICAgcGFyQ2xhc3MgPSAnaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnLFxyXG4gICAgICAgIGRlbGF5O1xyXG5cclxuICAgIGlmKHRoaXMub3B0aW9ucy5jbGlja09wZW4gfHwgaGFzVG91Y2gpe1xyXG4gICAgICB0aGlzLiRtZW51SXRlbXMub24oJ2NsaWNrLnpmLmRyb3Bkb3dubWVudSB0b3VjaHN0YXJ0LnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIHZhciAkZWxlbSA9ICQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCAnLicgKyBwYXJDbGFzcyksXHJcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKSxcclxuICAgICAgICAgICAgaGFzQ2xpY2tlZCA9ICRlbGVtLmF0dHIoJ2RhdGEtaXMtY2xpY2snKSA9PT0gJ3RydWUnLFxyXG4gICAgICAgICAgICAkc3ViID0gJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51Jyk7XHJcblxyXG4gICAgICAgIGlmKGhhc1N1Yil7XHJcbiAgICAgICAgICBpZihoYXNDbGlja2VkKXtcclxuICAgICAgICAgICAgaWYoIV90aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrIHx8ICghX3RoaXMub3B0aW9ucy5jbGlja09wZW4gJiYgIWhhc1RvdWNoKSB8fCAoX3RoaXMub3B0aW9ucy5mb3JjZUZvbGxvdyAmJiBoYXNUb3VjaCkpeyByZXR1cm47IH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICBfdGhpcy5faGlkZSgkZWxlbSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH1lbHNle1xyXG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICAgIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICAgIF90aGlzLl9zaG93KCRlbGVtLmNoaWxkcmVuKCcuaXMtZHJvcGRvd24tc3VibWVudScpKTtcclxuICAgICAgICAgICAgJGVsZW0uYWRkKCRlbGVtLnBhcmVudHNVbnRpbChfdGhpcy4kZWxlbWVudCwgJy4nICsgcGFyQ2xhc3MpKS5hdHRyKCdkYXRhLWlzLWNsaWNrJywgdHJ1ZSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2V7IHJldHVybjsgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZighdGhpcy5vcHRpb25zLmRpc2FibGVIb3Zlcil7XHJcbiAgICAgIHRoaXMuJG1lbnVJdGVtcy5vbignbW91c2VlbnRlci56Zi5kcm9wZG93bm1lbnUnLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xyXG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKTtcclxuXHJcbiAgICAgICAgaWYoaGFzU3ViKXtcclxuICAgICAgICAgIGNsZWFyVGltZW91dChkZWxheSk7XHJcbiAgICAgICAgICBkZWxheSA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgX3RoaXMuX3Nob3coJGVsZW0uY2hpbGRyZW4oJy5pcy1kcm9wZG93bi1zdWJtZW51JykpO1xyXG4gICAgICAgICAgfSwgX3RoaXMub3B0aW9ucy5ob3ZlckRlbGF5KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLmRyb3Bkb3dubWVudScsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXHJcbiAgICAgICAgICAgIGhhc1N1YiA9ICRlbGVtLmhhc0NsYXNzKHBhckNsYXNzKTtcclxuICAgICAgICBpZihoYXNTdWIgJiYgX3RoaXMub3B0aW9ucy5hdXRvY2xvc2Upe1xyXG4gICAgICAgICAgaWYoJGVsZW0uYXR0cignZGF0YS1pcy1jbGljaycpID09PSAndHJ1ZScgJiYgX3RoaXMub3B0aW9ucy5jbGlja09wZW4peyByZXR1cm4gZmFsc2U7IH1cclxuXHJcbiAgICAgICAgICAvLyBjbGVhclRpbWVvdXQoZGVsYXkpO1xyXG4gICAgICAgICAgZGVsYXkgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIF90aGlzLl9oaWRlKCRlbGVtKTtcclxuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuY2xvc2luZ1RpbWUpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICB0aGlzLiRtZW51SXRlbXMub24oJ2tleWRvd24uemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSl7XHJcbiAgICAgIHZhciAkZWxlbWVudCA9ICQoZS50YXJnZXQpLnBhcmVudHNVbnRpbCgndWwnLCAnW3JvbGU9XCJtZW51aXRlbVwiXScpLFxyXG4gICAgICAgICAgaXNUYWIgPSBfdGhpcy4kdGFicy5pbmRleCgkZWxlbWVudCkgPiAtMSxcclxuICAgICAgICAgICRlbGVtZW50cyA9IGlzVGFiID8gX3RoaXMuJHRhYnMgOiAkZWxlbWVudC5zaWJsaW5ncygnbGknKS5hZGQoJGVsZW1lbnQpLFxyXG4gICAgICAgICAgJHByZXZFbGVtZW50LFxyXG4gICAgICAgICAgJG5leHRFbGVtZW50O1xyXG5cclxuICAgICAgJGVsZW1lbnRzLmVhY2goZnVuY3Rpb24oaSkge1xyXG4gICAgICAgIGlmICgkKHRoaXMpLmlzKCRlbGVtZW50KSkge1xyXG4gICAgICAgICAgJHByZXZFbGVtZW50ID0gJGVsZW1lbnRzLmVxKGktMSk7XHJcbiAgICAgICAgICAkbmV4dEVsZW1lbnQgPSAkZWxlbWVudHMuZXEoaSsxKTtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgdmFyIG5leHRTaWJsaW5nID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCEkZWxlbWVudC5pcygnOmxhc3QtY2hpbGQnKSkgJG5leHRFbGVtZW50LmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcclxuICAgICAgfSwgcHJldlNpYmxpbmcgPSBmdW5jdGlvbigpIHtcclxuICAgICAgICAkcHJldkVsZW1lbnQuY2hpbGRyZW4oJ2E6Zmlyc3QnKS5mb2N1cygpO1xyXG4gICAgICB9LCBvcGVuU3ViID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyICRzdWIgPSAkZWxlbWVudC5jaGlsZHJlbigndWwuaXMtZHJvcGRvd24tc3VibWVudScpO1xyXG4gICAgICAgIGlmKCRzdWIubGVuZ3RoKXtcclxuICAgICAgICAgIF90aGlzLl9zaG93KCRzdWIpO1xyXG4gICAgICAgICAgJGVsZW1lbnQuZmluZCgnbGkgPiBhOmZpcnN0JykuZm9jdXMoKTtcclxuICAgICAgICB9ZWxzZXsgcmV0dXJuOyB9XHJcbiAgICAgIH0sIGNsb3NlU3ViID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgLy9pZiAoJGVsZW1lbnQuaXMoJzpmaXJzdC1jaGlsZCcpKSB7XHJcbiAgICAgICAgdmFyIGNsb3NlID0gJGVsZW1lbnQucGFyZW50KCd1bCcpLnBhcmVudCgnbGknKTtcclxuICAgICAgICAgIGNsb3NlLmNoaWxkcmVuKCdhOmZpcnN0JykuZm9jdXMoKTtcclxuICAgICAgICAgIF90aGlzLl9oaWRlKGNsb3NlKTtcclxuICAgICAgICAvL31cclxuICAgICAgfTtcclxuICAgICAgdmFyIGZ1bmN0aW9ucyA9IHtcclxuICAgICAgICBvcGVuOiBvcGVuU3ViLFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIF90aGlzLl9oaWRlKF90aGlzLiRlbGVtZW50KTtcclxuICAgICAgICAgIF90aGlzLiRtZW51SXRlbXMuZmluZCgnYTpmaXJzdCcpLmZvY3VzKCk7IC8vIGZvY3VzIHRvIGZpcnN0IGVsZW1lbnRcclxuICAgICAgICB9LFxyXG4gICAgICAgIGhhbmRsZWQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICB9XHJcbiAgICAgIH07XHJcblxyXG4gICAgICBpZiAoaXNUYWIpIHtcclxuICAgICAgICBpZiAoX3RoaXMudmVydGljYWwpIHsgLy8gdmVydGljYWwgbWVudVxyXG4gICAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcpIHsgLy8gbGVmdCBhbGlnbmVkXHJcbiAgICAgICAgICAgICQuZXh0ZW5kKGZ1bmN0aW9ucywge1xyXG4gICAgICAgICAgICAgIGRvd246IG5leHRTaWJsaW5nLFxyXG4gICAgICAgICAgICAgIHVwOiBwcmV2U2libGluZyxcclxuICAgICAgICAgICAgICBuZXh0OiBvcGVuU3ViLFxyXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBjbG9zZVN1YlxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgIH0gZWxzZSB7IC8vIHJpZ2h0IGFsaWduZWRcclxuICAgICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XHJcbiAgICAgICAgICAgICAgZG93bjogbmV4dFNpYmxpbmcsXHJcbiAgICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nLFxyXG4gICAgICAgICAgICAgIG5leHQ6IGNsb3NlU3ViLFxyXG4gICAgICAgICAgICAgIHByZXZpb3VzOiBvcGVuU3ViXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7IC8vIGhvcml6b250YWwgbWVudVxyXG4gICAgICAgICAgJC5leHRlbmQoZnVuY3Rpb25zLCB7XHJcbiAgICAgICAgICAgIG5leHQ6IG5leHRTaWJsaW5nLFxyXG4gICAgICAgICAgICBwcmV2aW91czogcHJldlNpYmxpbmcsXHJcbiAgICAgICAgICAgIGRvd246IG9wZW5TdWIsXHJcbiAgICAgICAgICAgIHVwOiBjbG9zZVN1YlxyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGVsc2UgeyAvLyBub3QgdGFicyAtPiBvbmUgc3ViXHJcbiAgICAgICAgaWYgKF90aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcpIHsgLy8gbGVmdCBhbGlnbmVkXHJcbiAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcclxuICAgICAgICAgICAgbmV4dDogb3BlblN1YixcclxuICAgICAgICAgICAgcHJldmlvdXM6IGNsb3NlU3ViLFxyXG4gICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcclxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2UgeyAvLyByaWdodCBhbGlnbmVkXHJcbiAgICAgICAgICAkLmV4dGVuZChmdW5jdGlvbnMsIHtcclxuICAgICAgICAgICAgbmV4dDogY2xvc2VTdWIsXHJcbiAgICAgICAgICAgIHByZXZpb3VzOiBvcGVuU3ViLFxyXG4gICAgICAgICAgICBkb3duOiBuZXh0U2libGluZyxcclxuICAgICAgICAgICAgdXA6IHByZXZTaWJsaW5nXHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgX3RoaXMsIGZ1bmN0aW9ucyk7XHJcblxyXG4gICAgfSk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBBZGRzIGFuIGV2ZW50IGhhbmRsZXIgdG8gdGhlIGJvZHkgdG8gY2xvc2UgYW55IGRyb3Bkb3ducyBvbiBhIGNsaWNrLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgRHJvcGRvd25NZW51LnByb3RvdHlwZS5fYWRkQm9keUhhbmRsZXIgPSBmdW5jdGlvbigpe1xyXG4gICAgdmFyICRib2R5ID0gJChkb2N1bWVudC5ib2R5KSxcclxuICAgICAgICBfdGhpcyA9IHRoaXM7XHJcbiAgICAkYm9keS5vZmYoJ21vdXNldXAuemYuZHJvcGRvd25tZW51IHRvdWNoZW5kLnpmLmRyb3Bkb3dubWVudScpXHJcbiAgICAgICAgIC5vbignbW91c2V1cC56Zi5kcm9wZG93bm1lbnUgdG91Y2hlbmQuemYuZHJvcGRvd25tZW51JywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICAgdmFyICRsaW5rID0gX3RoaXMuJGVsZW1lbnQuZmluZChlLnRhcmdldCk7XHJcbiAgICAgICAgICAgaWYoJGxpbmsubGVuZ3RoKXsgcmV0dXJuOyB9XHJcblxyXG4gICAgICAgICAgIF90aGlzLl9oaWRlKCk7XHJcbiAgICAgICAgICAgJGJvZHkub2ZmKCdtb3VzZXVwLnpmLmRyb3Bkb3dubWVudSB0b3VjaGVuZC56Zi5kcm9wZG93bm1lbnUnKTtcclxuICAgICAgICAgfSk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBPcGVucyBhIGRyb3Bkb3duIHBhbmUsIGFuZCBjaGVja3MgZm9yIGNvbGxpc2lvbnMgZmlyc3QuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICRzdWIgLSB1bCBlbGVtZW50IHRoYXQgaXMgYSBzdWJtZW51IHRvIHNob3dcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBmaXJlcyBEcm9wZG93bk1lbnUjc2hvd1xyXG4gICAqL1xyXG4gIERyb3Bkb3duTWVudS5wcm90b3R5cGUuX3Nob3cgPSBmdW5jdGlvbigkc3ViKXtcclxuICAgIHZhciBpZHggPSB0aGlzLiR0YWJzLmluZGV4KHRoaXMuJHRhYnMuZmlsdGVyKGZ1bmN0aW9uKGksIGVsKXtcclxuICAgICAgcmV0dXJuICQoZWwpLmZpbmQoJHN1YikubGVuZ3RoID4gMDtcclxuICAgIH0pKTtcclxuICAgIHZhciAkc2licyA9ICRzdWIucGFyZW50KCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpLnNpYmxpbmdzKCdsaS5pcy1kcm9wZG93bi1zdWJtZW51LXBhcmVudCcpO1xyXG4gICAgdGhpcy5faGlkZSgkc2licywgaWR4KTtcclxuICAgICRzdWIuY3NzKCd2aXNpYmlsaXR5JywgJ2hpZGRlbicpLmFkZENsYXNzKCdqcy1kcm9wZG93bi1hY3RpdmUnKS5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pXHJcbiAgICAgICAgLnBhcmVudCgnbGkuaXMtZHJvcGRvd24tc3VibWVudS1wYXJlbnQnKS5hZGRDbGFzcygnaXMtYWN0aXZlJylcclxuICAgICAgICAuYXR0cih7J2FyaWEtc2VsZWN0ZWQnOiB0cnVlLCAnYXJpYS1leHBhbmRlZCc6IHRydWV9KTtcclxuICAgIHZhciBjbGVhciA9IEZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UoJHN1YiwgbnVsbCwgdHJ1ZSk7XHJcbiAgICBpZighY2xlYXIpe1xyXG4gICAgICB2YXIgb2xkQ2xhc3MgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcgPyAnLXJpZ2h0JyA6ICctbGVmdCcsXHJcbiAgICAgICAgICAkcGFyZW50TGkgPSAkc3ViLnBhcmVudCgnLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50Jyk7XHJcbiAgICAgICRwYXJlbnRMaS5yZW1vdmVDbGFzcygnb3BlbnMnICsgb2xkQ2xhc3MpLmFkZENsYXNzKCdvcGVucy0nICsgdGhpcy5vcHRpb25zLmFsaWdubWVudCk7XHJcbiAgICAgIGNsZWFyID0gRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSgkc3ViLCBudWxsLCB0cnVlKTtcclxuICAgICAgaWYoIWNsZWFyKXtcclxuICAgICAgICAkcGFyZW50TGkucmVtb3ZlQ2xhc3MoJ29wZW5zLScgKyB0aGlzLm9wdGlvbnMuYWxpZ25tZW50KS5hZGRDbGFzcygnb3BlbnMtaW5uZXInKTtcclxuICAgICAgfVxyXG4gICAgICB0aGlzLmNoYW5nZWQgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgJHN1Yi5jc3MoJ3Zpc2liaWxpdHknLCAnJyk7XHJcbiAgICBpZih0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKXsgdGhpcy5fYWRkQm9keUhhbmRsZXIoKTsgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBuZXcgZHJvcGRvd24gcGFuZSBpcyB2aXNpYmxlLlxyXG4gICAgICogQGV2ZW50IERyb3Bkb3duTWVudSNzaG93XHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi5kcm9wZG93bm1lbnUnLCBbJHN1Yl0pO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogSGlkZXMgYSBzaW5nbGUsIGN1cnJlbnRseSBvcGVuIGRyb3Bkb3duIHBhbmUsIGlmIHBhc3NlZCBhIHBhcmFtZXRlciwgb3RoZXJ3aXNlLCBoaWRlcyBldmVyeXRoaW5nLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkZWxlbSAtIGVsZW1lbnQgd2l0aCBhIHN1Ym1lbnUgdG8gaGlkZVxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSBpbmRleCBvZiB0aGUgJHRhYnMgY29sbGVjdGlvbiB0byBoaWRlXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBEcm9wZG93bk1lbnUucHJvdG90eXBlLl9oaWRlID0gZnVuY3Rpb24oJGVsZW0sIGlkeCl7XHJcbiAgICB2YXIgJHRvQ2xvc2U7XHJcbiAgICBpZigkZWxlbSAmJiAkZWxlbS5sZW5ndGgpe1xyXG4gICAgICAkdG9DbG9zZSA9ICRlbGVtO1xyXG4gICAgfWVsc2UgaWYoaWR4ICE9PSB1bmRlZmluZWQpe1xyXG4gICAgICAkdG9DbG9zZSA9IHRoaXMuJHRhYnMubm90KGZ1bmN0aW9uKGksIGVsKXtcclxuICAgICAgICByZXR1cm4gaSA9PT0gaWR4O1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIGVsc2V7XHJcbiAgICAgICR0b0Nsb3NlID0gdGhpcy4kZWxlbWVudDtcclxuICAgIH1cclxuICAgIHZhciBzb21ldGhpbmdUb0Nsb3NlID0gJHRvQ2xvc2UuaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpIHx8ICR0b0Nsb3NlLmZpbmQoJy5pcy1hY3RpdmUnKS5sZW5ndGggPiAwO1xyXG5cclxuICAgIGlmKHNvbWV0aGluZ1RvQ2xvc2Upe1xyXG4gICAgICAkdG9DbG9zZS5maW5kKCdsaS5pcy1hY3RpdmUnKS5hZGQoJHRvQ2xvc2UpLmF0dHIoe1xyXG4gICAgICAgICdhcmlhLXNlbGVjdGVkJzogZmFsc2UsXHJcbiAgICAgICAgJ2FyaWEtZXhwYW5kZWQnOiBmYWxzZSxcclxuICAgICAgICAnZGF0YS1pcy1jbGljayc6IGZhbHNlXHJcbiAgICAgIH0pLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICAgICR0b0Nsb3NlLmZpbmQoJ3VsLmpzLWRyb3Bkb3duLWFjdGl2ZScpLmF0dHIoe1xyXG4gICAgICAgICdhcmlhLWhpZGRlbic6IHRydWVcclxuICAgICAgfSkucmVtb3ZlQ2xhc3MoJ2pzLWRyb3Bkb3duLWFjdGl2ZScpO1xyXG5cclxuICAgICAgaWYodGhpcy5jaGFuZ2VkIHx8ICR0b0Nsb3NlLmZpbmQoJ29wZW5zLWlubmVyJykubGVuZ3RoKXtcclxuICAgICAgICB2YXIgb2xkQ2xhc3MgPSB0aGlzLm9wdGlvbnMuYWxpZ25tZW50ID09PSAnbGVmdCcgPyAncmlnaHQnIDogJ2xlZnQnO1xyXG4gICAgICAgICR0b0Nsb3NlLmZpbmQoJ2xpLmlzLWRyb3Bkb3duLXN1Ym1lbnUtcGFyZW50JykuYWRkKCR0b0Nsb3NlKVxyXG4gICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdvcGVucy1pbm5lciBvcGVucy0nICsgdGhpcy5vcHRpb25zLmFsaWdubWVudClcclxuICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnb3BlbnMtJyArIG9sZENsYXNzKTtcclxuICAgICAgICB0aGlzLmNoYW5nZWQgPSBmYWxzZTtcclxuICAgICAgfVxyXG4gICAgICAvKipcclxuICAgICAgICogRmlyZXMgd2hlbiB0aGUgb3BlbiBtZW51cyBhcmUgY2xvc2VkLlxyXG4gICAgICAgKiBAZXZlbnQgRHJvcGRvd25NZW51I2hpZGVcclxuICAgICAgICovXHJcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignaGlkZS56Zi5kcm9wZG93bm1lbnUnLCBbJHRvQ2xvc2VdKTtcclxuICAgIH1cclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIHRoZSBwbHVnaW4uXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgRHJvcGRvd25NZW51LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuJG1lbnVJdGVtcy5vZmYoJy56Zi5kcm9wZG93bm1lbnUnKS5yZW1vdmVBdHRyKCdkYXRhLWlzLWNsaWNrJylcclxuICAgICAgICAucmVtb3ZlQ2xhc3MoJ2lzLXJpZ2h0LWFycm93IGlzLWxlZnQtYXJyb3cgaXMtZG93bi1hcnJvdyBvcGVucy1yaWdodCBvcGVucy1sZWZ0IG9wZW5zLWlubmVyJyk7XHJcbiAgICBGb3VuZGF0aW9uLk5lc3QuQnVybih0aGlzLiRlbGVtZW50LCAnZHJvcGRvd24nKTtcclxuICAgIEZvdW5kYXRpb24udW5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9O1xyXG5cclxuICBGb3VuZGF0aW9uLnBsdWdpbihEcm9wZG93bk1lbnUsICdEcm9wZG93bk1lbnUnKTtcclxufShqUXVlcnksIHdpbmRvdy5Gb3VuZGF0aW9uKTtcclxuIiwiIWZ1bmN0aW9uKEZvdW5kYXRpb24sICQpIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgRXF1YWxpemVyLlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjaW5pdFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIEVxdWFsaXplcihlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyAgPSAkLmV4dGVuZCh7fSwgRXF1YWxpemVyLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcbiAgICB0aGlzLiR3aW5kb3cgID0gJCh3aW5kb3cpO1xyXG4gICAgdGhpcy5uYW1lICAgICA9ICdlcXVhbGl6ZXInO1xyXG4gICAgdGhpcy5hdHRyICAgICA9ICdkYXRhLWVxdWFsaXplcic7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIERlZmF1bHQgc2V0dGluZ3MgZm9yIHBsdWdpblxyXG4gICAqL1xyXG4gIEVxdWFsaXplci5kZWZhdWx0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlIGhlaWdodCBlcXVhbGl6YXRpb24gd2hlbiBzdGFja2VkIG9uIHNtYWxsZXIgc2NyZWVucy5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgZXF1YWxpemVPblN0YWNrOiB0cnVlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBbW91bnQgb2YgdGltZSwgaW4gbXMsIHRvIGRlYm91bmNlIHRoZSBzaXplIGNoZWNraW5nL2VxdWFsaXphdGlvbi4gTG93ZXIgdGltZXMgbWVhbiBzbW9vdGhlciB0cmFuc2l0aW9ucy9sZXNzIHBlcmZvcm1hbmNlIG9uIG1vYmlsZS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIDUwXHJcbiAgICAgKi9cclxuICAgIHRocm90dGxlSW50ZXJ2YWw6IDUwXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIEVxdWFsaXplciBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgZXF1YWxpemVyIGZ1bmN0aW9uaW5nIG9uIGxvYWQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBFcXVhbGl6ZXIucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLl9yZWZsb3coKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIEVxdWFsaXplci5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIEVxdWFsaXplci5wcm90b3R5cGUuX2V2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuJHdpbmRvd1xyXG4gICAgICAub2ZmKCcuZXF1YWxpemVyJylcclxuICAgICAgLm9uKCdyZXNpemUuZm5kdG4uZXF1YWxpemVyJywgRm91bmRhdGlvbi51dGlsLnRocm90dGxlKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBzZWxmLl9yZWZsb3coKTtcclxuICAgICAgfSwgc2VsZi5vcHRpb25zLnRocm90dGxlSW50ZXJ2YWwpKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBBIG5vb3AgdmVyc2lvbiBmb3IgdGhlIHBsdWdpblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgRXF1YWxpemVyLnByb3RvdHlwZS5fa2lsbHN3aXRjaCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgcmV0dXJuO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgbmVjZXNzYXJ5IGZ1bmN0aW9ucyB0byB1cGRhdGUgRXF1YWxpemVyIHVwb24gRE9NIGNoYW5nZVxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgRXF1YWxpemVyLnByb3RvdHlwZS5fcmVmbG93ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgJCgnWycgKyB0aGlzLmF0dHIgKyAnXScpLmVhY2goZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciAkZXFQYXJlbnQgICAgICAgPSAkKHRoaXMpLFxyXG4gICAgICAgICAgYWRqdXN0ZWRIZWlnaHRzID0gW10sXHJcbiAgICAgICAgICAkaW1hZ2VzID0gJGVxUGFyZW50LmZpbmQoJ2ltZycpO1xyXG5cclxuICAgICAgaWYgKCRpbWFnZXMubGVuZ3RoKSB7XHJcbiAgICAgICAgRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZCgkaW1hZ2VzLCBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGFkanVzdGVkSGVpZ2h0cyA9IHNlbGYuZ2V0SGVpZ2h0cygkZXFQYXJlbnQpO1xyXG4gICAgICAgICAgc2VsZi5hcHBseUhlaWdodCgkZXFQYXJlbnQsIGFkanVzdGVkSGVpZ2h0cyk7XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgICAgZWxzZSB7XHJcbiAgICAgICAgYWRqdXN0ZWRIZWlnaHRzID0gc2VsZi5nZXRIZWlnaHRzKCRlcVBhcmVudCk7XHJcbiAgICAgICAgc2VsZi5hcHBseUhlaWdodCgkZXFQYXJlbnQsIGFkanVzdGVkSGVpZ2h0cyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogRmluZHMgdGhlIG91dGVyIGhlaWdodHMgb2YgY2hpbGRyZW4gY29udGFpbmVkIHdpdGhpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IGFuZCByZXR1cm5zIHRoZW0gaW4gYW4gYXJyYXlcclxuICAgKiBAcGFyYW0ge09iamVjdH0gJGVxUGFyZW50IEEgalF1ZXJ5IGluc3RhbmNlIG9mIGFuIEVxdWFsaXplciBjb250YWluZXJcclxuICAgKiBAcmV0dXJucyB7QXJyYXl9IGhlaWdodHMgQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lclxyXG4gICAqL1xyXG4gIEVxdWFsaXplci5wcm90b3R5cGUuZ2V0SGVpZ2h0cyA9IGZ1bmN0aW9uKCRlcVBhcmVudCkge1xyXG4gICAgdmFyIGVxR3JvdXBOYW1lID0gJGVxUGFyZW50LmRhdGEoJ2VxdWFsaXplcicpLFxyXG4gICAgICAgIGVxR3JvdXAgICAgID0gZXFHcm91cE5hbWUgPyAkZXFQYXJlbnQuZmluZCgnWycgKyB0aGlzLmF0dHIgKyAnLXdhdGNoPVwiJyArIGVxR3JvdXBOYW1lICsgJ1wiXTp2aXNpYmxlJykgOiAkZXFQYXJlbnQuZmluZCgnWycgKyB0aGlzLmF0dHIgKyAnLXdhdGNoXTp2aXNpYmxlJyksXHJcbiAgICAgICAgaGVpZ2h0cztcclxuXHJcbiAgICBlcUdyb3VwLmhlaWdodCgnaW5oZXJpdCcpO1xyXG4gICAgaGVpZ2h0cyA9IGVxR3JvdXAubWFwKGZ1bmN0aW9uICgpIHsgcmV0dXJuICQodGhpcykub3V0ZXJIZWlnaHQoZmFsc2UpO30pLmdldCgpO1xyXG4gICAgXHJcbiAgICByZXR1cm4gaGVpZ2h0cztcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIENoYW5nZXMgdGhlIENTUyBoZWlnaHQgcHJvcGVydHkgb2YgZWFjaCBjaGlsZCBpbiBhbiBFcXVhbGl6ZXIgcGFyZW50IHRvIG1hdGNoIHRoZSB0YWxsZXN0XHJcbiAgICogQHBhcmFtIHtPYmplY3R9ICRlcVBhcmVudCAtIEEgalF1ZXJ5IGluc3RhbmNlIG9mIGFuIEVxdWFsaXplciBjb250YWluZXJcclxuICAgKiBAcGFyYW0ge2FycmF5fSBoZWlnaHRzIC0gQW4gYXJyYXkgb2YgaGVpZ2h0cyBvZiBjaGlsZHJlbiB3aXRoaW4gRXF1YWxpemVyIGNvbnRhaW5lclxyXG4gICAqIEBmaXJlcyBFcXVhbGl6ZXIjcHJlRXF1YWxpemVkXHJcbiAgICogQGZpcmVzIEVxdWFsaXplciNwb3N0RXF1YWxpemVkXHJcbiAgICovXHJcbiAgRXF1YWxpemVyLnByb3RvdHlwZS5hcHBseUhlaWdodCA9IGZ1bmN0aW9uKCRlcVBhcmVudCwgaGVpZ2h0cykge1xyXG4gICAgdmFyIGVxR3JvdXBOYW1lID0gJGVxUGFyZW50LmRhdGEoJ2VxdWFsaXplcicpLFxyXG4gICAgICAgIGVxR3JvdXAgICAgID0gZXFHcm91cE5hbWUgPyAkZXFQYXJlbnQuZmluZCgnWycrdGhpcy5hdHRyKyctd2F0Y2g9XCInK2VxR3JvdXBOYW1lKydcIl06dmlzaWJsZScpIDogJGVxUGFyZW50LmZpbmQoJ1snK3RoaXMuYXR0cisnLXdhdGNoXTp2aXNpYmxlJyksXHJcbiAgICAgICAgbWF4ICAgICAgICAgPSBNYXRoLm1heC5hcHBseShudWxsLCBoZWlnaHRzKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIGJlZm9yZSB0aGUgaGVpZ2h0cyBhcmUgYXBwbGllZFxyXG4gICAgICogQGV2ZW50IEVxdWFsaXplciNwcmVFcXVhbGl6ZWRcclxuICAgICAqL1xyXG4gICAgJGVxUGFyZW50LnRyaWdnZXIoJ3ByZUVxdWFsaXplZC56Zi5FcXVhbGl6ZXInKTtcclxuXHJcbiAgICAvLyBmb3Igbm93LCBhcHBseSB0aGUgbWF4IGhlaWdodCBmb3VuZCBpbiB0aGUgYXJyYXlcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZXFHcm91cC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAkKGVxR3JvdXBbaV0pLmNzcygnaGVpZ2h0JywgbWF4KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIGhlaWdodHMgaGF2ZSBiZWVuIGFwcGxpZWRcclxuICAgICAqIEBldmVudCBFcXVhbGl6ZXIjcG9zdEVxdWFsaXplZFxyXG4gICAgICovXHJcbiAgICAkZXFQYXJlbnQudHJpZ2dlcigncG9zdEVxdWFsaXplZC56Zi5FcXVhbGl6ZXInKTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIEVxdWFsaXplci5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBFcXVhbGl6ZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xyXG4gICAgLy9UT0RPIHRoaXMuXHJcbiAgfTtcclxuXHJcbiAgRm91bmRhdGlvbi5wbHVnaW4oRXF1YWxpemVyLCAnRXF1YWxpemVyJyk7XHJcblxyXG4gIC8vIEV4cG9ydHMgZm9yIEFNRC9Ccm93c2VyaWZ5XHJcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IEVxdWFsaXplcjtcclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgIGRlZmluZShbJ2ZvdW5kYXRpb24nXSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBFcXVhbGl6ZXI7XHJcbiAgICB9KTtcclxuXHJcbn0oRm91bmRhdGlvbiwgalF1ZXJ5KTtcclxuIiwiLyoqXHJcbiAqIEludGVyY2hhbmdlIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLmludGVyY2hhbmdlXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubWVkaWFRdWVyeVxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRpbWVyQW5kSW1hZ2VMb2FkZXJcclxuICovXHJcbiFmdW5jdGlvbihGb3VuZGF0aW9uLCAkKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIEludGVyY2hhbmdlLlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBJbnRlcmNoYW5nZSNpbml0XHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gSW50ZXJjaGFuZ2UoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgSW50ZXJjaGFuZ2UuZGVmYXVsdHMsIG9wdGlvbnMpO1xyXG4gICAgdGhpcy5ydWxlcyA9IFtdO1xyXG4gICAgdGhpcy5jdXJyZW50UGF0aCA9ICcnO1xyXG5cclxuICAgIHRoaXMuX2luaXQoKTtcclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cclxuICAgKi9cclxuICBJbnRlcmNoYW5nZS5kZWZhdWx0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogUnVsZXMgdG8gYmUgYXBwbGllZCB0byBJbnRlcmNoYW5nZSBlbGVtZW50cy4gU2V0IHdpdGggdGhlIGBkYXRhLWludGVyY2hhbmdlYCBhcnJheSBub3RhdGlvbi5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqL1xyXG4gICAgcnVsZXM6IG51bGxcclxuICB9O1xyXG5cclxuICBJbnRlcmNoYW5nZS5TUEVDSUFMX1FVRVJJRVMgPSB7XHJcbiAgICAnbGFuZHNjYXBlJzogJ3NjcmVlbiBhbmQgKG9yaWVudGF0aW9uOiBsYW5kc2NhcGUpJyxcclxuICAgICdwb3J0cmFpdCc6ICdzY3JlZW4gYW5kIChvcmllbnRhdGlvbjogcG9ydHJhaXQpJyxcclxuICAgICdyZXRpbmEnOiAnb25seSBzY3JlZW4gYW5kICgtd2Via2l0LW1pbi1kZXZpY2UtcGl4ZWwtcmF0aW86IDIpLCBvbmx5IHNjcmVlbiBhbmQgKG1pbi0tbW96LWRldmljZS1waXhlbC1yYXRpbzogMiksIG9ubHkgc2NyZWVuIGFuZCAoLW8tbWluLWRldmljZS1waXhlbC1yYXRpbzogMi8xKSwgb25seSBzY3JlZW4gYW5kIChtaW4tZGV2aWNlLXBpeGVsLXJhdGlvOiAyKSwgb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMTkyZHBpKSwgb25seSBzY3JlZW4gYW5kIChtaW4tcmVzb2x1dGlvbjogMmRwcHgpJ1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBJbnRlcmNoYW5nZSBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgaW50ZXJjaGFuZ2UgZnVuY3Rpb25pbmcgb24gbG9hZC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIEludGVyY2hhbmdlLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy5fYWRkQnJlYWtwb2ludHMoKTtcclxuICAgIHRoaXMuX2dlbmVyYXRlUnVsZXMoKTtcclxuICAgIHRoaXMuX3JlZmxvdygpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgSW50ZXJjaGFuZ2UuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBJbnRlcmNoYW5nZS5wcm90b3R5cGUuX2V2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgJCh3aW5kb3cpLm9uKCdyZXNpemUuZm5kdG4uaW50ZXJjaGFuZ2UnLCBGb3VuZGF0aW9uLnV0aWwudGhyb3R0bGUodGhpcy5fcmVmbG93LmJpbmQodGhpcyksIDUwKSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2FsbHMgbmVjZXNzYXJ5IGZ1bmN0aW9ucyB0byB1cGRhdGUgSW50ZXJjaGFuZ2UgdXBvbiBET00gY2hhbmdlXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBJbnRlcmNoYW5nZS5wcm90b3R5cGUuX3JlZmxvdyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIG1hdGNoO1xyXG5cclxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHJ1bGUsIGJ1dCBvbmx5IHNhdmUgdGhlIGxhc3QgbWF0Y2hcclxuICAgIGZvciAodmFyIGkgaW4gdGhpcy5ydWxlcykge1xyXG4gICAgICB2YXIgcnVsZSA9IHRoaXMucnVsZXNbaV07XHJcblxyXG4gICAgICBpZiAod2luZG93Lm1hdGNoTWVkaWEocnVsZS5xdWVyeSkubWF0Y2hlcykge1xyXG4gICAgICAgIG1hdGNoID0gcnVsZTtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChtYXRjaCkge1xyXG4gICAgICB0aGlzLnJlcGxhY2UobWF0Y2gucGF0aCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogR2V0cyB0aGUgRm91bmRhdGlvbiBicmVha3BvaW50cyBhbmQgYWRkcyB0aGVtIHRvIHRoZSBJbnRlcmNoYW5nZS5TUEVDSUFMX1FVRVJJRVMgb2JqZWN0LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgSW50ZXJjaGFuZ2UucHJvdG90eXBlLl9hZGRCcmVha3BvaW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgZm9yICh2YXIgaSBpbiBGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllcykge1xyXG4gICAgICB2YXIgcXVlcnkgPSBGb3VuZGF0aW9uLk1lZGlhUXVlcnkucXVlcmllc1tpXTtcclxuICAgICAgSW50ZXJjaGFuZ2UuU1BFQ0lBTF9RVUVSSUVTW3F1ZXJ5Lm5hbWVdID0gcXVlcnkudmFsdWU7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2tzIHRoZSBJbnRlcmNoYW5nZSBlbGVtZW50IGZvciB0aGUgcHJvdmlkZWQgbWVkaWEgcXVlcnkgKyBjb250ZW50IHBhaXJpbmdzXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge09iamVjdH0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdGhhdCBpcyBhbiBJbnRlcmNoYW5nZSBpbnN0YW5jZVxyXG4gICAqIEByZXR1cm5zIHtBcnJheX0gc2NlbmFyaW9zIC0gQXJyYXkgb2Ygb2JqZWN0cyB0aGF0IGhhdmUgJ21xJyBhbmQgJ3BhdGgnIGtleXMgd2l0aCBjb3JyZXNwb25kaW5nIGtleXNcclxuICAgKi9cclxuICBJbnRlcmNoYW5nZS5wcm90b3R5cGUuX2dlbmVyYXRlUnVsZXMgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBydWxlc0xpc3QgPSBbXTtcclxuICAgIHZhciBydWxlcztcclxuXHJcbiAgICBpZiAodGhpcy5vcHRpb25zLnJ1bGVzKSB7XHJcbiAgICAgIHJ1bGVzID0gdGhpcy5vcHRpb25zLnJ1bGVzO1xyXG4gICAgfVxyXG4gICAgZWxzZSB7XHJcbiAgICAgIHJ1bGVzID0gdGhpcy4kZWxlbWVudC5kYXRhKCdpbnRlcmNoYW5nZScpLm1hdGNoKC9cXFsuKj9cXF0vZyk7XHJcbiAgICB9XHJcblxyXG4gICAgZm9yICh2YXIgaSBpbiBydWxlcykge1xyXG4gICAgICB2YXIgcnVsZSA9IHJ1bGVzW2ldLnNsaWNlKDEsIC0xKS5zcGxpdCgnLCAnKTtcclxuICAgICAgdmFyIHBhdGggPSBydWxlLnNsaWNlKDAsIC0xKS5qb2luKCcnKTtcclxuICAgICAgdmFyIHF1ZXJ5ID0gcnVsZVtydWxlLmxlbmd0aCAtIDFdO1xyXG5cclxuICAgICAgaWYgKEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeV0pIHtcclxuICAgICAgICBxdWVyeSA9IEludGVyY2hhbmdlLlNQRUNJQUxfUVVFUklFU1txdWVyeV07XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIHJ1bGVzTGlzdC5wdXNoKHtcclxuICAgICAgICBwYXRoOiBwYXRoLFxyXG4gICAgICAgIHF1ZXJ5OiBxdWVyeVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJ1bGVzID0gcnVsZXNMaXN0O1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZSB0aGUgYHNyY2AgcHJvcGVydHkgb2YgYW4gaW1hZ2UsIG9yIGNoYW5nZSB0aGUgSFRNTCBvZiBhIGNvbnRhaW5lciwgdG8gdGhlIHNwZWNpZmllZCBwYXRoLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwYXJhbSB7U3RyaW5nfSBwYXRoIC0gUGF0aCB0byB0aGUgaW1hZ2Ugb3IgSFRNTCBwYXJ0aWFsLlxyXG4gICAqIEBmaXJlcyBJbnRlcmNoYW5nZSNyZXBsYWNlZFxyXG4gICAqL1xyXG4gIEludGVyY2hhbmdlLnByb3RvdHlwZS5yZXBsYWNlID0gZnVuY3Rpb24ocGF0aCkge1xyXG4gICAgaWYgKHRoaXMuY3VycmVudFBhdGggPT09IHBhdGgpIHJldHVybjtcclxuXHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIC8vIFJlcGxhY2luZyBpbWFnZXNcclxuICAgIGlmICh0aGlzLiRlbGVtZW50WzBdLm5vZGVOYW1lID09PSAnSU1HJykge1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ3NyYycsIHBhdGgpLmxvYWQoZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgX3RoaXMuJGVsZW1lbnQudHJpZ2dlcigncmVwbGFjZWQuemYuaW50ZXJjaGFuZ2UnKTtcclxuICAgICAgICBfdGhpcy5jdXJyZW50UGF0aCA9IHBhdGg7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgLy8gUmVwbGFjaW5nIGJhY2tncm91bmQgaW1hZ2VzXHJcbiAgICBlbHNlIGlmIChwYXRoLm1hdGNoKC9cXC4oZ2lmfGpwZ3xqcGVnfHRpZmZ8cG5nKShbPyNdLiopPy9pKSkge1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmNzcyh7ICdiYWNrZ3JvdW5kLWltYWdlJzogJ3VybCgnK3BhdGgrJyknIH0pO1xyXG4gICAgfVxyXG4gICAgLy8gUmVwbGFjaW5nIEhUTUxcclxuICAgIGVsc2Uge1xyXG4gICAgICAkLmdldChwYXRoLCBmdW5jdGlvbihyZXNwb25zZSkge1xyXG4gICAgICAgIF90aGlzLiRlbGVtZW50Lmh0bWwocmVzcG9uc2UpO1xyXG4gICAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3JlcGxhY2VkLnpmLmludGVyY2hhbmdlJyk7XHJcbiAgICAgICAgX3RoaXMuY3VycmVudFBhdGggPSBwYXRoO1xyXG4gICAgICB9KTtcclxuICAgIH1cclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGludGVyY2hhbmdlLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIEludGVyY2hhbmdlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKXtcclxuICAgIC8vVE9ETyB0aGlzLlxyXG4gIH07XHJcbiAgRm91bmRhdGlvbi5wbHVnaW4oSW50ZXJjaGFuZ2UsICdJbnRlcmNoYW5nZScpO1xyXG5cclxuICAvLyBFeHBvcnRzIGZvciBBTUQvQnJvd3NlcmlmeVxyXG4gIGlmICh0eXBlb2YgbW9kdWxlICE9PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgIT09ICd1bmRlZmluZWQnKVxyXG4gICAgbW9kdWxlLmV4cG9ydHMgPSBJbnRlcmNoYW5nZTtcclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgIGRlZmluZShbJ2ZvdW5kYXRpb24nXSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBJbnRlcmNoYW5nZTtcclxuICAgIH0pO1xyXG5cclxufShGb3VuZGF0aW9uLCBqUXVlcnkpO1xyXG4iLCIvKipcclxuICogTWFnZWxsYW4gbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ubWFnZWxsYW5cclxuICovXHJcbiFmdW5jdGlvbihGb3VuZGF0aW9uLCAkKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIE1hZ2VsbGFuLlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBmaXJlcyBNYWdlbGxhbiNpbml0XHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGFkZCB0aGUgdHJpZ2dlciB0by5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIE92ZXJyaWRlcyB0byB0aGUgZGVmYXVsdCBwbHVnaW4gc2V0dGluZ3MuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gTWFnZWxsYW4oZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgID0gJC5leHRlbmQoe30sIE1hZ2VsbGFuLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBEZWZhdWx0IHNldHRpbmdzIGZvciBwbHVnaW5cclxuICAgKi9cclxuICBNYWdlbGxhbi5kZWZhdWx0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogQW1vdW50IG9mIHRpbWUsIGluIG1zLCB0aGUgYW5pbWF0ZWQgc2Nyb2xsaW5nIHNob3VsZCB0YWtlIGJldHdlZW4gbG9jYXRpb25zLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgNTAwXHJcbiAgICAgKi9cclxuICAgIGFuaW1hdGlvbkR1cmF0aW9uOiA1MDAsXHJcbiAgICAvKipcclxuICAgICAqIEFuaW1hdGlvbiBzdHlsZSB0byB1c2Ugd2hlbiBzY3JvbGxpbmcgYmV0d2VlbiBsb2NhdGlvbnMuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnZWFzZS1pbi1vdXQnXHJcbiAgICAgKi9cclxuICAgIGFuaW1hdGlvbkVhc2luZzogJ2xpbmVhcicsXHJcbiAgICAvKipcclxuICAgICAqIE51bWJlciBvZiBwaXhlbHMgdG8gdXNlIGFzIGEgbWFya2VyIGZvciBsb2NhdGlvbiBjaGFuZ2VzLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgNTBcclxuICAgICAqL1xyXG4gICAgdGhyZXNob2xkOiA1MCxcclxuICAgIC8qKlxyXG4gICAgICogQ2xhc3MgYXBwbGllZCB0byB0aGUgYWN0aXZlIGxvY2F0aW9ucyBsaW5rIG9uIHRoZSBtYWdlbGxhbiBjb250YWluZXIuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnYWN0aXZlJ1xyXG4gICAgICovXHJcbiAgICBhY3RpdmVDbGFzczogJ2FjdGl2ZScsXHJcbiAgICAvKipcclxuICAgICAqIEFsbG93cyB0aGUgc2NyaXB0IHRvIG1hbmlwdWxhdGUgdGhlIHVybCBvZiB0aGUgY3VycmVudCBwYWdlLCBhbmQgaWYgc3VwcG9ydGVkLCBhbHRlciB0aGUgaGlzdG9yeS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgZGVlcExpbmtpbmc6IGZhbHNlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBOdW1iZXIgb2YgcGl4ZWxzIHRvIG9mZnNldCB0aGUgc2Nyb2xsIG9mIHRoZSBwYWdlIG9uIGl0ZW0gY2xpY2sgaWYgdXNpbmcgYSBzdGlja3kgbmF2IGJhci5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIDI1XHJcbiAgICAgKi9cclxuICAgIGJhck9mZnNldDogMFxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBNYWdlbGxhbiBwbHVnaW4gYW5kIGNhbGxzIGZ1bmN0aW9ucyB0byBnZXQgZXF1YWxpemVyIGZ1bmN0aW9uaW5nIG9uIGxvYWQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBNYWdlbGxhbi5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBpZCA9IHRoaXMuJGVsZW1lbnRbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnbWFnZWxsYW4nKSxcclxuICAgICAgICBfdGhpcyA9IHRoaXM7XHJcbiAgICB0aGlzLiR0YXJnZXRzID0gJCgnW2RhdGEtbWFnZWxsYW4tdGFyZ2V0XScpO1xyXG4gICAgdGhpcy4kbGlua3MgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2EnKTtcclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cih7XHJcbiAgICAgICdkYXRhLXJlc2l6ZSc6IGlkLFxyXG4gICAgICAnZGF0YS1zY3JvbGwnOiBpZCxcclxuICAgICAgJ2lkJzogaWRcclxuICAgIH0pO1xyXG4gICAgdGhpcy4kYWN0aXZlID0gJCgpO1xyXG4gICAgdGhpcy5zY3JvbGxQb3MgPSBwYXJzZUludCh3aW5kb3cucGFnZVlPZmZzZXQsIDEwKTtcclxuXHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIENhbGN1bGF0ZXMgYW4gYXJyYXkgb2YgcGl4ZWwgdmFsdWVzIHRoYXQgYXJlIHRoZSBkZW1hcmNhdGlvbiBsaW5lcyBiZXR3ZWVuIGxvY2F0aW9ucyBvbiB0aGUgcGFnZS5cclxuICAgKiBDYW4gYmUgaW52b2tlZCBpZiBuZXcgZWxlbWVudHMgYXJlIGFkZGVkIG9yIHRoZSBzaXplIG9mIGEgbG9jYXRpb24gY2hhbmdlcy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBNYWdlbGxhbi5wcm90b3R5cGUuY2FsY1BvaW50cyA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgIGJvZHkgPSBkb2N1bWVudC5ib2R5LFxyXG4gICAgICAgIGh0bWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XHJcblxyXG4gICAgdGhpcy5wb2ludHMgPSBbXTtcclxuICAgIHRoaXMud2luSGVpZ2h0ID0gTWF0aC5yb3VuZChNYXRoLm1heCh3aW5kb3cuaW5uZXJIZWlnaHQsIGh0bWwuY2xpZW50SGVpZ2h0KSk7XHJcbiAgICB0aGlzLmRvY0hlaWdodCA9IE1hdGgucm91bmQoTWF0aC5tYXgoYm9keS5zY3JvbGxIZWlnaHQsIGJvZHkub2Zmc2V0SGVpZ2h0LCBodG1sLmNsaWVudEhlaWdodCwgaHRtbC5zY3JvbGxIZWlnaHQsIGh0bWwub2Zmc2V0SGVpZ2h0KSk7XHJcblxyXG4gICAgdGhpcy4kdGFyZ2V0cy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIHZhciAkdGFyID0gJCh0aGlzKSxcclxuICAgICAgICAgIHB0ID0gTWF0aC5yb3VuZCgkdGFyLm9mZnNldCgpLnRvcCAtIF90aGlzLm9wdGlvbnMudGhyZXNob2xkKTtcclxuICAgICAgJHRhci50YXJnZXRQb2ludCA9IHB0O1xyXG4gICAgICBfdGhpcy5wb2ludHMucHVzaChwdCk7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIGV2ZW50cyBmb3IgTWFnZWxsYW4uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBNYWdlbGxhbi5wcm90b3R5cGUuX2V2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcyxcclxuICAgICAgICAkYm9keSA9ICQoJ2h0bWwsIGJvZHknKSxcclxuICAgICAgICBvcHRzID0ge1xyXG4gICAgICAgICAgZHVyYXRpb246IF90aGlzLm9wdGlvbnMuYW5pbWF0aW9uRHVyYXRpb24sXHJcbiAgICAgICAgICBlYXNpbmc6ICAgX3RoaXMub3B0aW9ucy5hbmltYXRpb25FYXNpbmdcclxuICAgICAgICB9O1xyXG5cclxuICAgICQod2luZG93KS5vbmUoJ2xvYWQnLCBmdW5jdGlvbigpe1xyXG4gICAgICBfdGhpcy5jYWxjUG9pbnRzKCk7XHJcbiAgICAgIF90aGlzLl91cGRhdGVBY3RpdmUoKTtcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQub24oe1xyXG4gICAgICAncmVzaXplbWUuemYudHJpZ2dlcic6IHRoaXMucmVmbG93LmJpbmQodGhpcyksXHJcbiAgICAgICdzY3JvbGxtZS56Zi50cmlnZ2VyJzogdGhpcy5fdXBkYXRlQWN0aXZlLmJpbmQodGhpcylcclxuICAgIH0pLm9uKCdjbGljay56Zi5tYWdlbGxhbicsICdhW2hyZWZePVwiI1wiXScsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgdmFyIGFycml2YWwgICA9IHRoaXMuZ2V0QXR0cmlidXRlKCdocmVmJyksXHJcbiAgICAgICAgICAgIHNjcm9sbFBvcyA9ICQoYXJyaXZhbCkub2Zmc2V0KCkudG9wIC0gX3RoaXMub3B0aW9ucy50aHJlc2hvbGQgLyAyIC0gX3RoaXMub3B0aW9ucy5iYXJPZmZzZXQ7XHJcblxyXG4gICAgICAgIC8vIHJlcXVlc3RBbmltYXRpb25GcmFtZSBpcyBkaXNhYmxlZCBmb3IgdGhpcyBwbHVnaW4gY3VycmVudGx5XHJcbiAgICAgICAgLy8gRm91bmRhdGlvbi5Nb3ZlKF90aGlzLm9wdGlvbnMuYW5pbWF0aW9uRHVyYXRpb24sICRib2R5LCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgJGJvZHkuc3RvcCh0cnVlKS5hbmltYXRlKHtcclxuICAgICAgICAgICAgc2Nyb2xsVG9wOiBzY3JvbGxQb3NcclxuICAgICAgICAgIH0sIG9wdHMpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAvLyB9KTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIENhbGxzIG5lY2Vzc2FyeSBmdW5jdGlvbnMgdG8gdXBkYXRlIE1hZ2VsbGFuIHVwb24gRE9NIGNoYW5nZVxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIE1hZ2VsbGFuLnByb3RvdHlwZS5yZWZsb3cgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy5jYWxjUG9pbnRzKCk7XHJcbiAgICB0aGlzLl91cGRhdGVBY3RpdmUoKTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIFVwZGF0ZXMgdGhlIHZpc2liaWxpdHkgb2YgYW4gYWN0aXZlIGxvY2F0aW9uIGxpbmssIGFuZCB1cGRhdGVzIHRoZSB1cmwgaGFzaCBmb3IgdGhlIHBhZ2UsIGlmIGRlZXBMaW5raW5nIGVuYWJsZWQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgTWFnZWxsYW4jdXBkYXRlXHJcbiAgICovXHJcbiAgTWFnZWxsYW4ucHJvdG90eXBlLl91cGRhdGVBY3RpdmUgPSBmdW5jdGlvbigvKmV2dCwgZWxlbSwgc2Nyb2xsUG9zKi8pe1xyXG4gICAgdmFyIHdpblBvcyA9IC8qc2Nyb2xsUG9zIHx8Ki8gcGFyc2VJbnQod2luZG93LnBhZ2VZT2Zmc2V0LCAxMCksXHJcbiAgICAgICAgY3VySWR4O1xyXG5cclxuICAgIGlmKHdpblBvcyArIHRoaXMud2luSGVpZ2h0ID09PSB0aGlzLmRvY0hlaWdodCl7IGN1cklkeCA9IHRoaXMucG9pbnRzLmxlbmd0aCAtIDE7IH1cclxuICAgIGVsc2UgaWYod2luUG9zIDwgdGhpcy5wb2ludHNbMF0peyBjdXJJZHggPSAwOyB9XHJcbiAgICBlbHNle1xyXG4gICAgICB2YXIgaXNEb3duID0gdGhpcy5zY3JvbGxQb3MgPCB3aW5Qb3MsXHJcbiAgICAgICAgICBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgICBjdXJWaXNpYmxlID0gdGhpcy5wb2ludHMuZmlsdGVyKGZ1bmN0aW9uKHAsIGkpe1xyXG4gICAgICAgICAgICByZXR1cm4gaXNEb3duID8gcCA8PSB3aW5Qb3MgOiBwIC0gX3RoaXMub3B0aW9ucy50aHJlc2hvbGQgPD0gd2luUG9zOy8vJiYgd2luUG9zID49IF90aGlzLnBvaW50c1tpIC0xXSAtIF90aGlzLm9wdGlvbnMudGhyZXNob2xkO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIGN1cklkeCA9IGN1clZpc2libGUubGVuZ3RoID8gY3VyVmlzaWJsZS5sZW5ndGggLSAxIDogMDtcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLiRhY3RpdmUucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcclxuICAgIHRoaXMuJGFjdGl2ZSA9IHRoaXMuJGxpbmtzLmVxKGN1cklkeCkuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKTtcclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMuZGVlcExpbmtpbmcpe1xyXG4gICAgICB2YXIgaGFzaCA9IHRoaXMuJGFjdGl2ZVswXS5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcclxuICAgICAgaWYod2luZG93Lmhpc3RvcnkucHVzaFN0YXRlKXtcclxuICAgICAgICB3aW5kb3cuaGlzdG9yeS5wdXNoU3RhdGUobnVsbCwgbnVsbCwgaGFzaCk7XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5oYXNoID0gaGFzaDtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuc2Nyb2xsUG9zID0gd2luUG9zO1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIG1hZ2VsbGFuIGlzIGZpbmlzaGVkIHVwZGF0aW5nIHRvIHRoZSBuZXcgYWN0aXZlIGVsZW1lbnQuXHJcbiAgICAgKiBAZXZlbnQgTWFnZWxsYW4jdXBkYXRlXHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndXBkYXRlLnpmLm1hZ2VsbGFuJywgW3RoaXMuJGFjdGl2ZV0pO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgTWFnZWxsYW4gYW5kIHJlc2V0cyB0aGUgdXJsIG9mIHRoZSB3aW5kb3cuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgTWFnZWxsYW4ucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJy56Zi50cmlnZ2VyIC56Zi5tYWdlbGxhbicpXHJcbiAgICAgICAgLmZpbmQoJy4nICsgdGhpcy5vcHRpb25zLmFjdGl2ZUNsYXNzKS5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuYWN0aXZlQ2xhc3MpO1xyXG5cclxuICAgIGlmKHRoaXMub3B0aW9ucy5kZWVwTGlua2luZyl7XHJcbiAgICAgIHZhciBoYXNoID0gdGhpcy4kYWN0aXZlWzBdLmdldEF0dHJpYnV0ZSgnaHJlZicpO1xyXG4gICAgICB3aW5kb3cubG9jYXRpb24uaGFzaC5yZXBsYWNlKGhhc2gsICcnKTtcclxuICAgIH1cclxuXHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfTtcclxuICBGb3VuZGF0aW9uLnBsdWdpbihNYWdlbGxhbiwgJ01hZ2VsbGFuJyk7XHJcblxyXG4gIC8vIEV4cG9ydHMgZm9yIEFNRC9Ccm93c2VyaWZ5XHJcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IE1hZ2VsbGFuO1xyXG4gIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nKVxyXG4gICAgZGVmaW5lKFsnZm91bmRhdGlvbiddLCBmdW5jdGlvbigpIHtcclxuICAgICAgcmV0dXJuIE1hZ2VsbGFuO1xyXG4gICAgfSk7XHJcblxyXG59KEZvdW5kYXRpb24sIGpRdWVyeSk7XHJcbiIsIi8qKlxyXG4gKiBPZmZDYW52YXMgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24ub2ZmY2FudmFzXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cclxuICovXHJcbiFmdW5jdGlvbigkLCBGb3VuZGF0aW9uKSB7XHJcblxyXG4ndXNlIHN0cmljdCc7XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBvZmYtY2FudmFzIHdyYXBwZXIuXHJcbiAqIEBjbGFzc1xyXG4gKiBAZmlyZXMgT2ZmQ2FudmFzI2luaXRcclxuICogQHBhcmFtIHtPYmplY3R9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGluaXRpYWxpemUuXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICovXHJcbmZ1bmN0aW9uIE9mZkNhbnZhcyhlbGVtZW50LCBvcHRpb25zKSB7XHJcbiAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIE9mZkNhbnZhcy5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG4gIHRoaXMuJGxhc3RUcmlnZ2VyID0gJCgpO1xyXG5cclxuICB0aGlzLl9pbml0KCk7XHJcbiAgdGhpcy5fZXZlbnRzKCk7XHJcblxyXG4gIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbn1cclxuXHJcbk9mZkNhbnZhcy5kZWZhdWx0cyA9IHtcclxuICAvKipcclxuICAgKiBBbGxvdyB0aGUgdXNlciB0byBjbGljayBvdXRzaWRlIG9mIHRoZSBtZW51IHRvIGNsb3NlIGl0LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICovXHJcbiAgY2xvc2VPbkNsaWNrOiB0cnVlLFxyXG4gIC8qKlxyXG4gICAqIEFtb3VudCBvZiB0aW1lIGluIG1zIHRoZSBvcGVuIGFuZCBjbG9zZSB0cmFuc2l0aW9uIHJlcXVpcmVzLiBJZiBub25lIHNlbGVjdGVkLCBwdWxscyBmcm9tIGJvZHkgc3R5bGUuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIDUwMFxyXG4gICAqL1xyXG4gIHRyYW5zaXRpb25UaW1lOiAwLFxyXG4gIC8qKlxyXG4gICAqIERpcmVjdGlvbiB0aGUgb2ZmY2FudmFzIG9wZW5zIGZyb20uIERldGVybWluZXMgY2xhc3MgYXBwbGllZCB0byBib2R5LlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBsZWZ0XHJcbiAgICovXHJcbiAgcG9zaXRpb246ICdsZWZ0JyxcclxuICAvKipcclxuICAgKiBGb3JjZSB0aGUgcGFnZSB0byBzY3JvbGwgdG8gdG9wIG9uIG9wZW4uXHJcbiAgICovXHJcbiAgZm9yY2VUb3A6IHRydWUsXHJcbiAgLyoqXHJcbiAgICogQWxsb3cgdGhlIG9mZmNhbnZhcyB0byBiZSBzdGlja3kgd2hpbGUgb3Blbi4gRG9lcyBub3RoaW5nIGlmIFNhc3Mgb3B0aW9uIGAkbWFpbmNvbnRlbnQtcHJldmVudC1zY3JvbGwgPT09IHRydWVgLlxyXG4gICAqIFBlcmZvcm1hbmNlIGluIFNhZmFyaSBPU1gvaU9TIGlzIG5vdCBncmVhdC5cclxuICAgKi9cclxuICAvLyBpc1N0aWNreTogZmFsc2UsXHJcbiAgLyoqXHJcbiAgICogQWxsb3cgdGhlIG9mZmNhbnZhcyB0byByZW1haW4gb3BlbiBmb3IgY2VydGFpbiBicmVha3BvaW50cy4gQ2FuIGJlIHVzZWQgd2l0aCBgaXNTdGlja3lgLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSBmYWxzZVxyXG4gICAqL1xyXG4gIGlzUmV2ZWFsZWQ6IGZhbHNlLFxyXG4gIC8qKlxyXG4gICAqIEJyZWFrcG9pbnQgYXQgd2hpY2ggdG8gcmV2ZWFsLiBKUyB3aWxsIHVzZSBhIFJlZ0V4cCB0byB0YXJnZXQgc3RhbmRhcmQgY2xhc3NlcywgaWYgY2hhbmdpbmcgY2xhc3NuYW1lcywgcGFzcyB5b3VyIGNsYXNzIEBgcmV2ZWFsQ2xhc3NgLlxyXG4gICAqIEBvcHRpb25cclxuICAgKiBAZXhhbXBsZSByZXZlYWwtZm9yLWxhcmdlXHJcbiAgICovXHJcbiAgcmV2ZWFsT246IG51bGwsXHJcbiAgLyoqXHJcbiAgICogRm9yY2UgZm9jdXMgdG8gdGhlIG9mZmNhbnZhcyBvbiBvcGVuLiBJZiB0cnVlLCB3aWxsIGZvY3VzIHRoZSBvcGVuaW5nIHRyaWdnZXIgb24gY2xvc2UuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlIHRydWVcclxuICAgKi9cclxuICBhdXRvRm9jdXM6IHRydWUsXHJcbiAgLyoqXHJcbiAgICogQ2xhc3MgdXNlZCB0byBmb3JjZSBhbiBvZmZjYW52YXMgdG8gcmVtYWluIG9wZW4uIEZvdW5kYXRpb24gZGVmYXVsdHMgZm9yIHRoaXMgYXJlIGByZXZlYWwtZm9yLWxhcmdlYCAmIGByZXZlYWwtZm9yLW1lZGl1bWAuXHJcbiAgICogQG9wdGlvblxyXG4gICAqIFRPRE8gaW1wcm92ZSB0aGUgcmVnZXggdGVzdGluZyBmb3IgdGhpcy5cclxuICAgKiBAZXhhbXBsZSByZXZlYWwtZm9yLWxhcmdlXHJcbiAgICovXHJcbiAgcmV2ZWFsQ2xhc3M6ICdyZXZlYWwtZm9yLSdcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplcyB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGJ5IGFkZGluZyB0aGUgZXhpdCBvdmVybGF5IChpZiBuZWVkZWQpLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHByaXZhdGVcclxuICovXHJcbk9mZkNhbnZhcy5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgaWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJyk7XHJcblxyXG4gIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xyXG5cclxuICAvLyBGaW5kIHRyaWdnZXJzIHRoYXQgYWZmZWN0IHRoaXMgZWxlbWVudCBhbmQgYWRkIGFyaWEtZXhwYW5kZWQgdG8gdGhlbVxyXG4gICQoZG9jdW1lbnQpXHJcbiAgICAuZmluZCgnW2RhdGEtb3Blbj1cIicraWQrJ1wiXSwgW2RhdGEtY2xvc2U9XCInK2lkKydcIl0sIFtkYXRhLXRvZ2dsZT1cIicraWQrJ1wiXScpXHJcbiAgICAuYXR0cignYXJpYS1leHBhbmRlZCcsICdmYWxzZScpXHJcbiAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcclxuXHJcbiAgLy8gQWRkIGEgY2xvc2UgdHJpZ2dlciBvdmVyIHRoZSBib2R5IGlmIG5lY2Vzc2FyeVxyXG4gIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkNsaWNrKXtcclxuICAgIGlmKCQoJy5qcy1vZmYtY2FudmFzLWV4aXQnKS5sZW5ndGgpe1xyXG4gICAgICB0aGlzLiRleGl0ZXIgPSAkKCcuanMtb2ZmLWNhbnZhcy1leGl0Jyk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdmFyIGV4aXRlciA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICBleGl0ZXIuc2V0QXR0cmlidXRlKCdjbGFzcycsICdqcy1vZmYtY2FudmFzLWV4aXQnKTtcclxuICAgICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy1jb250ZW50XScpLmFwcGVuZChleGl0ZXIpO1xyXG5cclxuICAgICAgdGhpcy4kZXhpdGVyID0gJChleGl0ZXIpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQgPSB0aGlzLm9wdGlvbnMuaXNSZXZlYWxlZCB8fCBuZXcgUmVnRXhwKHRoaXMub3B0aW9ucy5yZXZlYWxDbGFzcywgJ2cnKS50ZXN0KHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lKTtcclxuXHJcbiAgaWYodGhpcy5vcHRpb25zLmlzUmV2ZWFsZWQpe1xyXG4gICAgdGhpcy5vcHRpb25zLnJldmVhbE9uID0gdGhpcy5vcHRpb25zLnJldmVhbE9uIHx8IHRoaXMuJGVsZW1lbnRbMF0uY2xhc3NOYW1lLm1hdGNoKC8ocmV2ZWFsLWZvci1tZWRpdW18cmV2ZWFsLWZvci1sYXJnZSkvZylbMF0uc3BsaXQoJy0nKVsyXTtcclxuICAgIHRoaXMuX3NldE1RQ2hlY2tlcigpO1xyXG4gIH1cclxuICBpZighdGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lKXtcclxuICAgIHRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSA9IHBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUoJCgnW2RhdGEtb2ZmLWNhbnZhcy13cmFwcGVyXScpWzBdKS50cmFuc2l0aW9uRHVyYXRpb24pICogMTAwMDtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQWRkcyBldmVudCBoYW5kbGVycyB0byB0aGUgb2ZmLWNhbnZhcyB3cmFwcGVyIGFuZCB0aGUgZXhpdCBvdmVybGF5LlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHByaXZhdGVcclxuICovXHJcbk9mZkNhbnZhcy5wcm90b3R5cGUuX2V2ZW50cyA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuJGVsZW1lbnQub24oe1xyXG4gICAgJ29wZW4uemYudHJpZ2dlcic6IHRoaXMub3Blbi5iaW5kKHRoaXMpLFxyXG4gICAgJ2Nsb3NlLnpmLnRyaWdnZXInOiB0aGlzLmNsb3NlLmJpbmQodGhpcyksXHJcbiAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxyXG4gICAgJ2tleWRvd24uemYub2ZmY2FudmFzJzogdGhpcy5faGFuZGxlS2V5Ym9hcmQuYmluZCh0aGlzKVxyXG4gIH0pO1xyXG5cclxuICBpZiAodGhpcy4kZXhpdGVyLmxlbmd0aCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMuJGV4aXRlci5vbih7J2NsaWNrLnpmLm9mZmNhbnZhcyc6IHRoaXMuY2xvc2UuYmluZCh0aGlzKX0pO1xyXG4gIH1cclxufTtcclxuLyoqXHJcbiAqIEFwcGxpZXMgZXZlbnQgbGlzdGVuZXIgZm9yIGVsZW1lbnRzIHRoYXQgd2lsbCByZXZlYWwgYXQgY2VydGFpbiBicmVha3BvaW50cy5cclxuICogQHByaXZhdGVcclxuICovXHJcbk9mZkNhbnZhcy5wcm90b3R5cGUuX3NldE1RQ2hlY2tlciA9IGZ1bmN0aW9uKCl7XHJcbiAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbigpe1xyXG4gICAgaWYoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3QoX3RoaXMub3B0aW9ucy5yZXZlYWxPbikpe1xyXG4gICAgICBfdGhpcy5yZXZlYWwodHJ1ZSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgX3RoaXMucmV2ZWFsKGZhbHNlKTtcclxuICAgIH1cclxuICB9KS5vbmUoJ2xvYWQuemYub2ZmY2FudmFzJywgZnVuY3Rpb24oKXtcclxuICAgIGlmKEZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KF90aGlzLm9wdGlvbnMucmV2ZWFsT24pKXtcclxuICAgICAgX3RoaXMucmV2ZWFsKHRydWUpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG4vKipcclxuICogSGFuZGxlcyB0aGUgcmV2ZWFsaW5nL2hpZGluZyB0aGUgb2ZmLWNhbnZhcyBhdCBicmVha3BvaW50cywgbm90IHRoZSBzYW1lIGFzIG9wZW4uXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gaXNSZXZlYWxlZCAtIHRydWUgaWYgZWxlbWVudCBzaG91bGQgYmUgcmV2ZWFsZWQuXHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuT2ZmQ2FudmFzLnByb3RvdHlwZS5yZXZlYWwgPSBmdW5jdGlvbihpc1JldmVhbGVkKXtcclxuICB2YXIgJGNsb3NlciA9IHRoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtY2xvc2VdJyk7XHJcbiAgaWYoaXNSZXZlYWxlZCl7XHJcbiAgICAvLyBpZighdGhpcy5vcHRpb25zLmZvcmNlVG9wKXtcclxuICAgIC8vICAgdmFyIHNjcm9sbFBvcyA9IHBhcnNlSW50KHdpbmRvdy5wYWdlWU9mZnNldCk7XHJcbiAgICAvLyAgIHRoaXMuJGVsZW1lbnRbMF0uc3R5bGUudHJhbnNmb3JtID0gJ3RyYW5zbGF0ZSgwLCcgKyBzY3JvbGxQb3MgKyAncHgpJztcclxuICAgIC8vIH1cclxuICAgIC8vIGlmKHRoaXMub3B0aW9ucy5pc1N0aWNreSl7IHRoaXMuX3N0aWNrKCk7IH1cclxuICAgIGlmKCRjbG9zZXIubGVuZ3RoKXsgJGNsb3Nlci5oaWRlKCk7IH1cclxuICB9ZWxzZXtcclxuICAgIC8vIGlmKHRoaXMub3B0aW9ucy5pc1N0aWNreSB8fCAhdGhpcy5vcHRpb25zLmZvcmNlVG9wKXtcclxuICAgIC8vICAgdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAnJztcclxuICAgIC8vICAgJCh3aW5kb3cpLm9mZignc2Nyb2xsLnpmLm9mZmNhbnZhcycpO1xyXG4gICAgLy8gfVxyXG4gICAgaWYoJGNsb3Nlci5sZW5ndGgpe1xyXG4gICAgICAkY2xvc2VyLnNob3coKTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogT3BlbnMgdGhlIG9mZi1jYW52YXMgbWVudS5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBldmVudCAtIEV2ZW50IG9iamVjdCBwYXNzZWQgZnJvbSBsaXN0ZW5lci5cclxuICogQHBhcmFtIHtqUXVlcnl9IHRyaWdnZXIgLSBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBvZmYtY2FudmFzIHRvIG9wZW4uXHJcbiAqIEBmaXJlcyBPZmZDYW52YXMjb3BlbmVkXHJcbiAqL1xyXG5PZmZDYW52YXMucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbihldmVudCwgdHJpZ2dlcikge1xyXG4gIGlmICh0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpeyByZXR1cm47IH1cclxuICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAkYm9keSA9ICQoZG9jdW1lbnQuYm9keSk7XHJcbiAgJCgnYm9keScpLnNjcm9sbFRvcCgwKTtcclxuICAvLyB3aW5kb3cucGFnZVlPZmZzZXQgPSAwO1xyXG5cclxuICAvLyBpZighdGhpcy5vcHRpb25zLmZvcmNlVG9wKXtcclxuICAvLyAgIHZhciBzY3JvbGxQb3MgPSBwYXJzZUludCh3aW5kb3cucGFnZVlPZmZzZXQpO1xyXG4gIC8vICAgdGhpcy4kZWxlbWVudFswXS5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHNjcm9sbFBvcyArICdweCknO1xyXG4gIC8vICAgaWYodGhpcy4kZXhpdGVyLmxlbmd0aCl7XHJcbiAgLy8gICAgIHRoaXMuJGV4aXRlclswXS5zdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHNjcm9sbFBvcyArICdweCknO1xyXG4gIC8vICAgfVxyXG4gIC8vIH1cclxuICAvKipcclxuICAgKiBGaXJlcyB3aGVuIHRoZSBvZmYtY2FudmFzIG1lbnUgb3BlbnMuXHJcbiAgICogQGV2ZW50IE9mZkNhbnZhcyNvcGVuZWRcclxuICAgKi9cclxuICBGb3VuZGF0aW9uLk1vdmUodGhpcy5vcHRpb25zLnRyYW5zaXRpb25UaW1lLCB0aGlzLiRlbGVtZW50LCBmdW5jdGlvbigpe1xyXG4gICAgJCgnW2RhdGEtb2ZmLWNhbnZhcy13cmFwcGVyXScpLmFkZENsYXNzKCdpcy1vZmYtY2FudmFzLW9wZW4gaXMtb3Blbi0nKyBfdGhpcy5vcHRpb25zLnBvc2l0aW9uKTtcclxuXHJcbiAgICBfdGhpcy4kZWxlbWVudFxyXG4gICAgICAuYWRkQ2xhc3MoJ2lzLW9wZW4nKVxyXG4gICAgICAuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKVxyXG4gICAgICAudHJpZ2dlcignb3BlbmVkLnpmLm9mZmNhbnZhcycpO1xyXG5cclxuICAgIC8vIGlmKF90aGlzLm9wdGlvbnMuaXNTdGlja3kpe1xyXG4gICAgLy8gICBfdGhpcy5fc3RpY2soKTtcclxuICAgIC8vIH1cclxuICB9KTtcclxuICBpZih0cmlnZ2VyKXtcclxuICAgIHRoaXMuJGxhc3RUcmlnZ2VyID0gdHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ3RydWUnKTtcclxuICB9XHJcbiAgaWYodGhpcy5vcHRpb25zLmF1dG9Gb2N1cyl7XHJcbiAgICB0aGlzLiRlbGVtZW50Lm9uZSgnZmluaXNoZWQuemYuYW5pbWF0ZScsIGZ1bmN0aW9uKCl7XHJcbiAgICAgIF90aGlzLiRlbGVtZW50LmZpbmQoJ2EsIGJ1dHRvbicpLmVxKDApLmZvY3VzKCk7XHJcbiAgICB9KTtcclxuICB9XHJcbn07XHJcbi8qKlxyXG4gKiBBbGxvd3MgdGhlIG9mZmNhbnZhcyB0byBhcHBlYXIgc3RpY2t5IHV0aWxpemluZyB0cmFuc2xhdGUgcHJvcGVydGllcy5cclxuICogQHByaXZhdGVcclxuICovXHJcbi8vIE9mZkNhbnZhcy5wcm90b3R5cGUuX3N0aWNrID0gZnVuY3Rpb24oKXtcclxuLy8gICB2YXIgZWxTdHlsZSA9IHRoaXMuJGVsZW1lbnRbMF0uc3R5bGU7XHJcbi8vXHJcbi8vICAgaWYodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayl7XHJcbi8vICAgICB2YXIgZXhpdFN0eWxlID0gdGhpcy4kZXhpdGVyWzBdLnN0eWxlO1xyXG4vLyAgIH1cclxuLy9cclxuLy8gICAkKHdpbmRvdykub24oJ3Njcm9sbC56Zi5vZmZjYW52YXMnLCBmdW5jdGlvbihlKXtcclxuLy8gICAgIGNvbnNvbGUubG9nKGUpO1xyXG4vLyAgICAgdmFyIHBhZ2VZID0gd2luZG93LnBhZ2VZT2Zmc2V0O1xyXG4vLyAgICAgZWxTdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHBhZ2VZICsgJ3B4KSc7XHJcbi8vICAgICBpZihleGl0U3R5bGUgIT09IHVuZGVmaW5lZCl7IGV4aXRTdHlsZS50cmFuc2Zvcm0gPSAndHJhbnNsYXRlKDAsJyArIHBhZ2VZICsgJ3B4KSc7IH1cclxuLy8gICB9KTtcclxuLy8gICAvLyB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3N0dWNrLnpmLm9mZmNhbnZhcycpO1xyXG4vLyB9O1xyXG4vKipcclxuICogQ2xvc2VzIHRoZSBvZmYtY2FudmFzIG1lbnUuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAZmlyZXMgT2ZmQ2FudmFzI2Nsb3NlZFxyXG4gKi9cclxuT2ZmQ2FudmFzLnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmKCF0aGlzLiRlbGVtZW50Lmhhc0NsYXNzKCdpcy1vcGVuJykpeyByZXR1cm47IH1cclxuXHJcbiAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgIEZvdW5kYXRpb24uTW92ZSh0aGlzLm9wdGlvbnMudHJhbnNpdGlvblRpbWUsIHRoaXMuJGVsZW1lbnQsIGZ1bmN0aW9uKCl7XHJcbiAgICAkKCdbZGF0YS1vZmYtY2FudmFzLXdyYXBwZXJdJykucmVtb3ZlQ2xhc3MoJ2lzLW9mZi1jYW52YXMtb3BlbiBpcy1vcGVuLScrX3RoaXMub3B0aW9ucy5wb3NpdGlvbik7XHJcblxyXG4gICAgX3RoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2lzLW9wZW4nKTtcclxuICAgIC8vIEZvdW5kYXRpb24uX3JlZmxvdygpO1xyXG4gIH0pO1xyXG4gIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpXHJcbiAgICAvKipcclxuICAgICAqIEZpcmVzIHdoZW4gdGhlIG9mZi1jYW52YXMgbWVudSBvcGVucy5cclxuICAgICAqIEBldmVudCBPZmZDYW52YXMjY2xvc2VkXHJcbiAgICAgKi9cclxuICAgICAgLnRyaWdnZXIoJ2Nsb3NlZC56Zi5vZmZjYW52YXMnKTtcclxuICAvLyBpZihfdGhpcy5vcHRpb25zLmlzU3RpY2t5IHx8ICFfdGhpcy5vcHRpb25zLmZvcmNlVG9wKXtcclxuICAvLyAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAvLyAgICAgX3RoaXMuJGVsZW1lbnRbMF0uc3R5bGUudHJhbnNmb3JtID0gJyc7XHJcbiAgLy8gICAgICQod2luZG93KS5vZmYoJ3Njcm9sbC56Zi5vZmZjYW52YXMnKTtcclxuICAvLyAgIH0sIHRoaXMub3B0aW9ucy50cmFuc2l0aW9uVGltZSk7XHJcbiAgLy8gfVxyXG5cclxuICB0aGlzLiRsYXN0VHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJywgJ2ZhbHNlJyk7XHJcbn07XHJcblxyXG4vKipcclxuICogVG9nZ2xlcyB0aGUgb2ZmLWNhbnZhcyBtZW51IG9wZW4gb3IgY2xvc2VkLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHBhcmFtIHtPYmplY3R9IGV2ZW50IC0gRXZlbnQgb2JqZWN0IHBhc3NlZCBmcm9tIGxpc3RlbmVyLlxyXG4gKiBAcGFyYW0ge2pRdWVyeX0gdHJpZ2dlciAtIGVsZW1lbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIG9mZi1jYW52YXMgdG8gb3Blbi5cclxuICovXHJcbk9mZkNhbnZhcy5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24oZXZlbnQsIHRyaWdnZXIpIHtcclxuICBpZiAodGhpcy4kZWxlbWVudC5oYXNDbGFzcygnaXMtb3BlbicpKSB7XHJcbiAgICB0aGlzLmNsb3NlKGV2ZW50LCB0cmlnZ2VyKTtcclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICB0aGlzLm9wZW4oZXZlbnQsIHRyaWdnZXIpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBIYW5kbGVzIGtleWJvYXJkIGlucHV0IHdoZW4gZGV0ZWN0ZWQuIFdoZW4gdGhlIGVzY2FwZSBrZXkgaXMgcHJlc3NlZCwgdGhlIG9mZi1jYW52YXMgbWVudSBjbG9zZXMsIGFuZCBmb2N1cyBpcyByZXN0b3JlZCB0byB0aGUgZWxlbWVudCB0aGF0IG9wZW5lZCB0aGUgbWVudS5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5PZmZDYW52YXMucHJvdG90eXBlLl9oYW5kbGVLZXlib2FyZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgaWYgKGV2ZW50LndoaWNoICE9PSAyNykgcmV0dXJuO1xyXG5cclxuICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcclxuICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gIHRoaXMuY2xvc2UoKTtcclxuICB0aGlzLiRsYXN0VHJpZ2dlci5mb2N1cygpO1xyXG59O1xyXG4vKipcclxuICogRGVzdHJveXMgdGhlIG9mZmNhbnZhcyBwbHVnaW4uXHJcbiAqIEBmdW5jdGlvblxyXG4gKi9cclxuT2ZmQ2FudmFzLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKXtcclxuICAvL1RPRE8gbWFrZSB0aGlzLi4uXHJcbn07XHJcblxyXG5Gb3VuZGF0aW9uLnBsdWdpbihPZmZDYW52YXMsICdPZmZDYW52YXMnKTtcclxuXHJcbn0oalF1ZXJ5LCBGb3VuZGF0aW9uKTtcclxuIiwiLyoqXHJcbiAqIE9yYml0IG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLm9yYml0XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwua2V5Ym9hcmRcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50aW1lckFuZEltYWdlTG9hZGVyXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudG91Y2hcclxuICovXHJcbiFmdW5jdGlvbigkLCBGb3VuZGF0aW9uKXtcclxuICAndXNlIHN0cmljdCc7XHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhbiBvcmJpdCBjYXJvdXNlbC5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbiBtZW51LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBmdW5jdGlvbiBPcmJpdChlbGVtZW50LCBvcHRpb25zKXtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIE9yYml0LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdPcmJpdCcsIHtcclxuICAgICAgICAnbHRyJzoge1xyXG4gICAgICAgICAgJ0FSUk9XX1JJR0hUJzogJ25leHQnLFxyXG4gICAgICAgICAgJ0FSUk9XX0xFRlQnOiAncHJldmlvdXMnXHJcbiAgICAgICAgfSxcclxuICAgICAgICAncnRsJzoge1xyXG4gICAgICAgICAgJ0FSUk9XX0xFRlQnOiAnbmV4dCcsXHJcbiAgICAgICAgICAnQVJST1dfUklHSFQnOiAncHJldmlvdXMnXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIE9yYml0LmRlZmF1bHRzID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBUZWxscyB0aGUgSlMgdG8gbG9hZEJ1bGxldHMuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICAgKi9cclxuICAgIGJ1bGxldHM6IHRydWUsXHJcbiAgICAvKipcclxuICAgICAqIFRlbGxzIHRoZSBKUyB0byBhcHBseSBldmVudCBsaXN0ZW5lcnMgdG8gbmF2IGJ1dHRvbnNcclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgbmF2QnV0dG9uczogdHJ1ZSxcclxuICAgIC8qKlxyXG4gICAgICogbW90aW9uLXVpIGFuaW1hdGlvbiBjbGFzcyB0byBhcHBseVxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgJ3NsaWRlLWluLXJpZ2h0J1xyXG4gICAgICovXHJcbiAgICBhbmltSW5Gcm9tUmlnaHQ6ICdzbGlkZS1pbi1yaWdodCcsXHJcbiAgICAvKipcclxuICAgICAqIG1vdGlvbi11aSBhbmltYXRpb24gY2xhc3MgdG8gYXBwbHlcclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICdzbGlkZS1vdXQtcmlnaHQnXHJcbiAgICAgKi9cclxuICAgIGFuaW1PdXRUb1JpZ2h0OiAnc2xpZGUtb3V0LXJpZ2h0JyxcclxuICAgIC8qKlxyXG4gICAgICogbW90aW9uLXVpIGFuaW1hdGlvbiBjbGFzcyB0byBhcHBseVxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgJ3NsaWRlLWluLWxlZnQnXHJcbiAgICAgKlxyXG4gICAgICovXHJcbiAgICBhbmltSW5Gcm9tTGVmdDogJ3NsaWRlLWluLWxlZnQnLFxyXG4gICAgLyoqXHJcbiAgICAgKiBtb3Rpb24tdWkgYW5pbWF0aW9uIGNsYXNzIHRvIGFwcGx5XHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnc2xpZGUtb3V0LWxlZnQnXHJcbiAgICAgKi9cclxuICAgIGFuaW1PdXRUb0xlZnQ6ICdzbGlkZS1vdXQtbGVmdCcsXHJcbiAgICAvKipcclxuICAgICAqIEFsbG93cyBPcmJpdCB0byBhdXRvbWF0aWNhbGx5IGFuaW1hdGUgb24gcGFnZSBsb2FkLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAgICovXHJcbiAgICBhdXRvUGxheTogdHJ1ZSxcclxuICAgIC8qKlxyXG4gICAgICogQW1vdW50IG9mIHRpbWUsIGluIG1zLCBiZXR3ZWVuIHNsaWRlIHRyYW5zaXRpb25zXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSA1MDAwXHJcbiAgICAgKi9cclxuICAgIHRpbWVyRGVsYXk6IDUwMDAsXHJcbiAgICAvKipcclxuICAgICAqIEFsbG93cyBPcmJpdCB0byBpbmZpbml0ZWx5IGxvb3AgdGhyb3VnaCB0aGUgc2xpZGVzXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICAgKi9cclxuICAgIGluZmluaXRlV3JhcDogdHJ1ZSxcclxuICAgIC8qKlxyXG4gICAgICogQWxsb3dzIHRoZSBPcmJpdCBzbGlkZXMgdG8gYmluZCB0byBzd2lwZSBldmVudHMgZm9yIG1vYmlsZSwgcmVxdWlyZXMgYW4gYWRkaXRpb25hbCB1dGlsIGxpYnJhcnlcclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgc3dpcGU6IHRydWUsXHJcbiAgICAvKipcclxuICAgICAqIEFsbG93cyB0aGUgdGltaW5nIGZ1bmN0aW9uIHRvIHBhdXNlIGFuaW1hdGlvbiBvbiBob3Zlci5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgcGF1c2VPbkhvdmVyOiB0cnVlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBbGxvd3MgT3JiaXQgdG8gYmluZCBrZXlib2FyZCBldmVudHMgdG8gdGhlIHNsaWRlciwgdG8gYW5pbWF0ZSBmcmFtZXMgd2l0aCBhcnJvdyBrZXlzXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICAgKi9cclxuICAgIGFjY2Vzc2libGU6IHRydWUsXHJcbiAgICAvKipcclxuICAgICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGNvbnRhaW5lciBvZiBPcmJpdFxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgJ29yYml0LWNvbnRhaW5lcidcclxuICAgICAqL1xyXG4gICAgY29udGFpbmVyQ2xhc3M6ICdvcmJpdC1jb250YWluZXInLFxyXG4gICAgLyoqXHJcbiAgICAgKiBDbGFzcyBhcHBsaWVkIHRvIGluZGl2aWR1YWwgc2xpZGVzLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgJ29yYml0LXNsaWRlJ1xyXG4gICAgICovXHJcbiAgICBzbGlkZUNsYXNzOiAnb3JiaXQtc2xpZGUnLFxyXG4gICAgLyoqXHJcbiAgICAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSBidWxsZXQgY29udGFpbmVyLiBZb3UncmUgd2VsY29tZS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICdvcmJpdC1idWxsZXRzJ1xyXG4gICAgICovXHJcbiAgICBib3hPZkJ1bGxldHM6ICdvcmJpdC1idWxsZXRzJyxcclxuICAgIC8qKlxyXG4gICAgICogQ2xhc3MgYXBwbGllZCB0byB0aGUgYG5leHRgIG5hdmlnYXRpb24gYnV0dG9uLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgJ29yYml0LW5leHQnXHJcbiAgICAgKi9cclxuICAgIG5leHRDbGFzczogJ29yYml0LW5leHQnLFxyXG4gICAgLyoqXHJcbiAgICAgKiBDbGFzcyBhcHBsaWVkIHRvIHRoZSBgcHJldmlvdXNgIG5hdmlnYXRpb24gYnV0dG9uLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgJ29yYml0LXByZXZpb3VzJ1xyXG4gICAgICovXHJcbiAgICBwcmV2Q2xhc3M6ICdvcmJpdC1wcmV2aW91cycsXHJcbiAgICAvKipcclxuICAgICAqIEJvb2xlYW4gdG8gZmxhZyB0aGUganMgdG8gdXNlIG1vdGlvbiB1aSBjbGFzc2VzIG9yIG5vdC4gRGVmYXVsdCB0byB0cnVlIGZvciBiYWNrd2FyZHMgY29tcGF0YWJpbGl0eS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgdXNlTVVJOiB0cnVlXHJcbiAgfTtcclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgcGx1Z2luIGJ5IGNyZWF0aW5nIGpRdWVyeSBjb2xsZWN0aW9ucywgc2V0dGluZyBhdHRyaWJ1dGVzLCBhbmQgc3RhcnRpbmcgdGhlIGFuaW1hdGlvbi5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIE9yYml0LnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLiR3cmFwcGVyID0gdGhpcy4kZWxlbWVudC5maW5kKCcuJyArIHRoaXMub3B0aW9ucy5jb250YWluZXJDbGFzcyk7XHJcbiAgICB0aGlzLiRzbGlkZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy4nICsgdGhpcy5vcHRpb25zLnNsaWRlQ2xhc3MpO1xyXG4gICAgdmFyICRpbWFnZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2ltZycpLFxyXG4gICAgICAgIGluaXRBY3RpdmUgPSB0aGlzLiRzbGlkZXMuZmlsdGVyKCcuaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgaWYoIWluaXRBY3RpdmUubGVuZ3RoKXtcclxuICAgICAgdGhpcy4kc2xpZGVzLmVxKDApLmFkZENsYXNzKCdpcy1hY3RpdmUnKTtcclxuICAgIH1cclxuICAgIGlmKCF0aGlzLm9wdGlvbnMudXNlTVVJKXtcclxuICAgICAgdGhpcy4kc2xpZGVzLmFkZENsYXNzKCduby1tb3Rpb251aScpO1xyXG4gICAgfVxyXG4gICAgaWYoJGltYWdlcy5sZW5ndGgpe1xyXG4gICAgICBGb3VuZGF0aW9uLm9uSW1hZ2VzTG9hZGVkKCRpbWFnZXMsIHRoaXMuX3ByZXBhcmVGb3JPcmJpdC5iaW5kKHRoaXMpKTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLl9wcmVwYXJlRm9yT3JiaXQoKTsvL2hlaGVcclxuICAgIH1cclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMuYnVsbGV0cyl7XHJcbiAgICAgIHRoaXMuX2xvYWRCdWxsZXRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fZXZlbnRzKCk7XHJcblxyXG4gICAgaWYodGhpcy5vcHRpb25zLmF1dG9QbGF5KXtcclxuICAgICAgdGhpcy5nZW9TeW5jKCk7XHJcbiAgICB9XHJcbiAgICBpZih0aGlzLm9wdGlvbnMuYWNjZXNzaWJsZSl7IC8vIGFsbG93IHdyYXBwZXIgdG8gYmUgZm9jdXNhYmxlIHRvIGVuYWJsZSBhcnJvdyBuYXZpZ2F0aW9uXHJcbiAgICAgIHRoaXMuJHdyYXBwZXIuYXR0cigndGFiaW5kZXgnLCAwKTtcclxuICAgIH1cclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBqUXVlcnkgY29sbGVjdGlvbiBvZiBidWxsZXRzLCBpZiB0aGV5IGFyZSBiZWluZyB1c2VkLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgT3JiaXQucHJvdG90eXBlLl9sb2FkQnVsbGV0cyA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLiRidWxsZXRzID0gdGhpcy4kZWxlbWVudC5maW5kKCcuJyArIHRoaXMub3B0aW9ucy5ib3hPZkJ1bGxldHMpLmZpbmQoJ2J1dHRvbicpO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogU2V0cyBhIGB0aW1lcmAgb2JqZWN0IG9uIHRoZSBvcmJpdCwgYW5kIHN0YXJ0cyB0aGUgY291bnRlciBmb3IgdGhlIG5leHQgc2xpZGUuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgT3JiaXQucHJvdG90eXBlLmdlb1N5bmMgPSBmdW5jdGlvbigpe1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMudGltZXIgPSBuZXcgRm91bmRhdGlvbi5UaW1lcihcclxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuJGVsZW1lbnQsXHJcbiAgICAgICAgICAgICAgICAgICAgICB7ZHVyYXRpb246IHRoaXMub3B0aW9ucy50aW1lckRlbGF5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgIGluZmluaXRlOiBmYWxzZX0sXHJcbiAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5jaGFuZ2VTbGlkZSh0cnVlKTtcclxuICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgdGhpcy50aW1lci5zdGFydCgpO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogU2V0cyB3cmFwcGVyIGFuZCBzbGlkZSBoZWlnaHRzIGZvciB0aGUgb3JiaXQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBPcmJpdC5wcm90b3R5cGUuX3ByZXBhcmVGb3JPcmJpdCA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdGhpcy5fc2V0V3JhcHBlckhlaWdodChmdW5jdGlvbihtYXgpe1xyXG4gICAgICBfdGhpcy5fc2V0U2xpZGVIZWlnaHQobWF4KTtcclxuICAgIH0pO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogQ2FsdWxhdGVzIHRoZSBoZWlnaHQgb2YgZWFjaCBzbGlkZSBpbiB0aGUgY29sbGVjdGlvbiwgYW5kIHVzZXMgdGhlIHRhbGxlc3Qgb25lIGZvciB0aGUgd3JhcHBlciBoZWlnaHQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZmlyZSB3aGVuIGNvbXBsZXRlLlxyXG4gICAqL1xyXG4gIE9yYml0LnByb3RvdHlwZS5fc2V0V3JhcHBlckhlaWdodCA9IGZ1bmN0aW9uKGNiKXsvL3Jld3JpdGUgdGhpcyB0byBgZm9yYCBsb29wXHJcbiAgICB2YXIgbWF4ID0gMCwgdGVtcCwgY291bnRlciA9IDA7XHJcblxyXG4gICAgdGhpcy4kc2xpZGVzLmVhY2goZnVuY3Rpb24oKXtcclxuICAgICAgdGVtcCA9IHRoaXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xyXG4gICAgICAkKHRoaXMpLmF0dHIoJ2RhdGEtc2xpZGUnLCBjb3VudGVyKTtcclxuXHJcbiAgICAgIGlmKGNvdW50ZXIpey8vaWYgbm90IHRoZSBmaXJzdCBzbGlkZSwgc2V0IGNzcyBwb3NpdGlvbiBhbmQgZGlzcGxheSBwcm9wZXJ0eVxyXG4gICAgICAgICQodGhpcykuY3NzKHsncG9zaXRpb24nOiAncmVsYXRpdmUnLCAnZGlzcGxheSc6ICdub25lJ30pO1xyXG4gICAgICB9XHJcbiAgICAgIG1heCA9IHRlbXAgPiBtYXggPyB0ZW1wIDogbWF4O1xyXG4gICAgICBjb3VudGVyKys7XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZihjb3VudGVyID09PSB0aGlzLiRzbGlkZXMubGVuZ3RoKXtcclxuICAgICAgdGhpcy4kd3JhcHBlci5jc3MoeydoZWlnaHQnOiBtYXh9KTsvL29ubHkgY2hhbmdlIHRoZSB3cmFwcGVyIGhlaWdodCBwcm9wZXJ0eSBvbmNlLlxyXG4gICAgICBjYihtYXgpOy8vZmlyZSBjYWxsYmFjayB3aXRoIG1heCBoZWlnaHQgZGltZW5zaW9uLlxyXG4gICAgfVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgbWF4LWhlaWdodCBvZiBlYWNoIHNsaWRlLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgT3JiaXQucHJvdG90eXBlLl9zZXRTbGlkZUhlaWdodCA9IGZ1bmN0aW9uKGhlaWdodCl7XHJcbiAgICB0aGlzLiRzbGlkZXMuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAkKHRoaXMpLmNzcygnbWF4LWhlaWdodCcsIGhlaWdodCk7XHJcbiAgICB9KTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIGJhc2ljYWxseSBldmVyeXRoaW5nIHdpdGhpbiB0aGUgZWxlbWVudC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIE9yYml0LnByb3RvdHlwZS5fZXZlbnRzID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgIC8vKipOb3cgdXNpbmcgY3VzdG9tIGV2ZW50IC0gdGhhbmtzIHRvOioqXHJcbiAgICAvLyoqICAgICAgWW9oYWkgQXJhcmF0IG9mIFRvcm9udG8gICAgICAqKlxyXG4gICAgLy8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcclxuICAgIGlmKHRoaXMub3B0aW9ucy5zd2lwZSl7XHJcbiAgICAgIHRoaXMuJHNsaWRlcy5vZmYoJ3N3aXBlbGVmdC56Zi5vcmJpdCBzd2lwZXJpZ2h0LnpmLm9yYml0JylcclxuICAgICAgLm9uKCdzd2lwZWxlZnQuemYub3JiaXQnLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgX3RoaXMuY2hhbmdlU2xpZGUodHJ1ZSk7XHJcbiAgICAgIH0pLm9uKCdzd2lwZXJpZ2h0LnpmLm9yYml0JywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKGZhbHNlKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICAvLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxyXG5cclxuICAgIGlmKHRoaXMub3B0aW9ucy5hdXRvUGxheSl7XHJcbiAgICAgIHRoaXMuJHNsaWRlcy5vbignY2xpY2suemYub3JiaXQnLCBmdW5jdGlvbigpe1xyXG4gICAgICAgIF90aGlzLiRlbGVtZW50LmRhdGEoJ2NsaWNrZWRPbicsIF90aGlzLiRlbGVtZW50LmRhdGEoJ2NsaWNrZWRPbicpID8gZmFsc2UgOiB0cnVlKTtcclxuICAgICAgICBfdGhpcy50aW1lcltfdGhpcy4kZWxlbWVudC5kYXRhKCdjbGlja2VkT24nKSA/ICdwYXVzZScgOiAnc3RhcnQnXSgpO1xyXG4gICAgICB9KTtcclxuICAgICAgaWYodGhpcy5vcHRpb25zLnBhdXNlT25Ib3Zlcil7XHJcbiAgICAgICAgdGhpcy4kZWxlbWVudC5vbignbW91c2VlbnRlci56Zi5vcmJpdCcsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICBfdGhpcy50aW1lci5wYXVzZSgpO1xyXG4gICAgICAgIH0pLm9uKCdtb3VzZWxlYXZlLnpmLm9yYml0JywgZnVuY3Rpb24oKXtcclxuICAgICAgICAgIGlmKCFfdGhpcy4kZWxlbWVudC5kYXRhKCdjbGlja2VkT24nKSl7XHJcbiAgICAgICAgICAgIF90aGlzLnRpbWVyLnN0YXJ0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMubmF2QnV0dG9ucyl7XHJcbiAgICAgIHZhciAkY29udHJvbHMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy4nICsgdGhpcy5vcHRpb25zLm5leHRDbGFzcyArICcsIC4nICsgdGhpcy5vcHRpb25zLnByZXZDbGFzcyk7XHJcbiAgICAgICRjb250cm9scy5hdHRyKCd0YWJpbmRleCcsIDApXHJcbiAgICAgICAgLy9hbHNvIG5lZWQgdG8gaGFuZGxlIGVudGVyL3JldHVybiBhbmQgc3BhY2ViYXIga2V5IHByZXNzZXNcclxuICAgICAgICAgICAgICAgLm9uKCdjbGljay56Zi5vcmJpdCB0b3VjaGVuZC56Zi5vcmJpdCcsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgX3RoaXMuY2hhbmdlU2xpZGUoJCh0aGlzKS5oYXNDbGFzcyhfdGhpcy5vcHRpb25zLm5leHRDbGFzcykpO1xyXG4gICAgICAgICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMuYnVsbGV0cyl7XHJcbiAgICAgIHRoaXMuJGJ1bGxldHMub24oJ2NsaWNrLnpmLm9yYml0IHRvdWNoZW5kLnpmLm9yYml0JywgZnVuY3Rpb24oKXtcclxuICAgICAgICBpZigvaXMtYWN0aXZlL2cudGVzdCh0aGlzLmNsYXNzTmFtZSkpeyByZXR1cm4gZmFsc2U7IH0vL2lmIHRoaXMgaXMgYWN0aXZlLCBraWNrIG91dCBvZiBmdW5jdGlvbi5cclxuICAgICAgICB2YXIgaWR4ID0gJCh0aGlzKS5kYXRhKCdzbGlkZScpLFxyXG4gICAgICAgICAgICBsdHIgPSBpZHggPiBfdGhpcy4kc2xpZGVzLmZpbHRlcignLmlzLWFjdGl2ZScpLmRhdGEoJ3NsaWRlJyksXHJcbiAgICAgICAgICAgICRzbGlkZSA9IF90aGlzLiRzbGlkZXMuZXEoaWR4KTtcclxuXHJcbiAgICAgICAgX3RoaXMuY2hhbmdlU2xpZGUobHRyLCAkc2xpZGUsIGlkeCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuJHdyYXBwZXIuYWRkKHRoaXMuJGJ1bGxldHMpLm9uKCdrZXlkb3duLnpmLm9yYml0JywgZnVuY3Rpb24oZSl7XHJcbiAgICAgIC8vIGhhbmRsZSBrZXlib2FyZCBldmVudCB3aXRoIGtleWJvYXJkIHV0aWxcclxuICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgX3RoaXMsIHtcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIF90aGlzLmNoYW5nZVNsaWRlKHRydWUpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgcHJldmlvdXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgX3RoaXMuY2hhbmdlU2xpZGUoZmFsc2UpO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7IC8vIGlmIGJ1bGxldCBpcyBmb2N1c2VkLCBtYWtlIHN1cmUgZm9jdXMgbW92ZXNcclxuICAgICAgICAgIGlmICgkKGUudGFyZ2V0KS5pcyhfdGhpcy4kYnVsbGV0cykpIHtcclxuICAgICAgICAgICAgX3RoaXMuJGJ1bGxldHMuZmlsdGVyKCcuaXMtYWN0aXZlJykuZm9jdXMoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfSk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBDaGFuZ2VzIHRoZSBjdXJyZW50IHNsaWRlIHRvIGEgbmV3IG9uZS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IGlzTFRSIC0gZmxhZyBpZiB0aGUgc2xpZGUgc2hvdWxkIG1vdmUgbGVmdCB0byByaWdodC5cclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gY2hvc2VuU2xpZGUgLSB0aGUgalF1ZXJ5IGVsZW1lbnQgb2YgdGhlIHNsaWRlIHRvIHNob3cgbmV4dCwgaWYgb25lIGlzIHNlbGVjdGVkLlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSB0aGUgaW5kZXggb2YgdGhlIG5ldyBzbGlkZSBpbiBpdHMgY29sbGVjdGlvbiwgaWYgb25lIGNob3Nlbi5cclxuICAgKiBAZmlyZXMgT3JiaXQjc2xpZGVjaGFuZ2VcclxuICAgKi9cclxuICBPcmJpdC5wcm90b3R5cGUuY2hhbmdlU2xpZGUgPSBmdW5jdGlvbihpc0xUUiwgY2hvc2VuU2xpZGUsIGlkeCl7XHJcbiAgICB2YXIgJGN1clNsaWRlID0gdGhpcy4kc2xpZGVzLmZpbHRlcignLmlzLWFjdGl2ZScpLmVxKDApO1xyXG5cclxuICAgIGlmKC9tdWkvZy50ZXN0KCRjdXJTbGlkZVswXS5jbGFzc05hbWUpKXsgcmV0dXJuIGZhbHNlOyB9Ly9pZiB0aGUgc2xpZGUgaXMgY3VycmVudGx5IGFuaW1hdGluZywga2ljayBvdXQgb2YgdGhlIGZ1bmN0aW9uXHJcblxyXG4gICAgdmFyICRmaXJzdFNsaWRlID0gdGhpcy4kc2xpZGVzLmZpcnN0KCksXHJcbiAgICAgICAgJGxhc3RTbGlkZSA9IHRoaXMuJHNsaWRlcy5sYXN0KCksXHJcbiAgICAgICAgZGlySW4gPSBpc0xUUiA/ICdSaWdodCcgOiAnTGVmdCcsXHJcbiAgICAgICAgZGlyT3V0ID0gaXNMVFIgPyAnTGVmdCcgOiAnUmlnaHQnLFxyXG4gICAgICAgIF90aGlzID0gdGhpcyxcclxuICAgICAgICAkbmV3U2xpZGU7XHJcblxyXG4gICAgaWYoIWNob3NlblNsaWRlKXsvL21vc3Qgb2YgdGhlIHRpbWUsIHRoaXMgd2lsbCBiZSBhdXRvIHBsYXllZCBvciBjbGlja2VkIGZyb20gdGhlIG5hdkJ1dHRvbnMuXHJcbiAgICAgICRuZXdTbGlkZSA9IGlzTFRSID8gLy9pZiB3cmFwcGluZyBlbmFibGVkLCBjaGVjayB0byBzZWUgaWYgdGhlcmUgaXMgYSBgbmV4dGAgb3IgYHByZXZgIHNpYmxpbmcsIGlmIG5vdCwgc2VsZWN0IHRoZSBmaXJzdCBvciBsYXN0IHNsaWRlIHRvIGZpbGwgaW4uIGlmIHdyYXBwaW5nIG5vdCBlbmFibGVkLCBhdHRlbXB0IHRvIHNlbGVjdCBgbmV4dGAgb3IgYHByZXZgLCBpZiB0aGVyZSdzIG5vdGhpbmcgdGhlcmUsIHRoZSBmdW5jdGlvbiB3aWxsIGtpY2sgb3V0IG9uIG5leHQgc3RlcC4gQ1JBWlkgTkVTVEVEIFRFUk5BUklFUyEhISEhXHJcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMub3B0aW9ucy5pbmZpbml0ZVdyYXAgPyAkY3VyU2xpZGUubmV4dCgnLicgKyB0aGlzLm9wdGlvbnMuc2xpZGVDbGFzcykubGVuZ3RoID8gJGN1clNsaWRlLm5leHQoJy4nICsgdGhpcy5vcHRpb25zLnNsaWRlQ2xhc3MpIDogJGZpcnN0U2xpZGUgOiAkY3VyU2xpZGUubmV4dCgnLicgKyB0aGlzLm9wdGlvbnMuc2xpZGVDbGFzcykpLy9waWNrIG5leHQgc2xpZGUgaWYgbW92aW5nIGxlZnQgdG8gcmlnaHRcclxuICAgICAgICAgICAgICAgICAgICA6XHJcbiAgICAgICAgICAgICAgICAgICAgKHRoaXMub3B0aW9ucy5pbmZpbml0ZVdyYXAgPyAkY3VyU2xpZGUucHJldignLicgKyB0aGlzLm9wdGlvbnMuc2xpZGVDbGFzcykubGVuZ3RoID8gJGN1clNsaWRlLnByZXYoJy4nICsgdGhpcy5vcHRpb25zLnNsaWRlQ2xhc3MpIDogJGxhc3RTbGlkZSA6ICRjdXJTbGlkZS5wcmV2KCcuJyArIHRoaXMub3B0aW9ucy5zbGlkZUNsYXNzKSk7Ly9waWNrIHByZXYgc2xpZGUgaWYgbW92aW5nIHJpZ2h0IHRvIGxlZnRcclxuICAgIH1lbHNle1xyXG4gICAgICAkbmV3U2xpZGUgPSBjaG9zZW5TbGlkZTtcclxuICAgIH1cclxuICAgIGlmKCRuZXdTbGlkZS5sZW5ndGgpe1xyXG4gICAgICBpZih0aGlzLm9wdGlvbnMuYnVsbGV0cyl7XHJcbiAgICAgICAgaWR4ID0gaWR4IHx8IHRoaXMuJHNsaWRlcy5pbmRleCgkbmV3U2xpZGUpOy8vZ3JhYiBpbmRleCB0byB1cGRhdGUgYnVsbGV0c1xyXG4gICAgICAgIHRoaXMuX3VwZGF0ZUJ1bGxldHMoaWR4KTtcclxuICAgICAgfVxyXG4gICAgICBpZih0aGlzLm9wdGlvbnMudXNlTVVJKXtcclxuXHJcbiAgICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZUluKFxyXG4gICAgICAgICAgJG5ld1NsaWRlLmFkZENsYXNzKCdpcy1hY3RpdmUnKS5jc3Moeydwb3NpdGlvbic6ICdhYnNvbHV0ZScsICd0b3AnOiAwfSksXHJcbiAgICAgICAgICB0aGlzLm9wdGlvbnNbJ2FuaW1JbkZyb20nICsgZGlySW5dLFxyXG4gICAgICAgICAgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgJG5ld1NsaWRlLmNzcyh7J3Bvc2l0aW9uJzogJ3JlbGF0aXZlJywgJ2Rpc3BsYXknOiAnYmxvY2snfSlcclxuICAgICAgICAgICAgICAgICAgICAgLmF0dHIoJ2FyaWEtbGl2ZScsICdwb2xpdGUnKTtcclxuICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KFxyXG4gICAgICAgICAgJGN1clNsaWRlLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKSxcclxuICAgICAgICAgIHRoaXMub3B0aW9uc1snYW5pbU91dFRvJyArIGRpck91dF0sXHJcbiAgICAgICAgICBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAkY3VyU2xpZGUucmVtb3ZlQXR0cignYXJpYS1saXZlJyk7XHJcbiAgICAgICAgICAgIGlmKF90aGlzLm9wdGlvbnMuYXV0b1BsYXkpe1xyXG4gICAgICAgICAgICAgIF90aGlzLnRpbWVyLnJlc3RhcnQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvL2RvIHN0dWZmP1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgICRjdXJTbGlkZS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlIGlzLWluJykucmVtb3ZlQXR0cignYXJpYS1saXZlJykuaGlkZSgpO1xyXG4gICAgICAgICRuZXdTbGlkZS5hZGRDbGFzcygnaXMtYWN0aXZlIGlzLWluJykuYXR0cignYXJpYS1saXZlJywgJ3BvbGl0ZScpLnNob3coKTtcclxuICAgICAgICBpZih0aGlzLm9wdGlvbnMuYXV0b1BsYXkpe1xyXG4gICAgICAgICAgdGhpcy50aW1lci5yZXN0YXJ0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBUcmlnZ2VycyB3aGVuIHRoZSBzbGlkZSBoYXMgZmluaXNoZWQgYW5pbWF0aW5nIGluLlxyXG4gICAgICAgKiBAZXZlbnQgT3JiaXQjc2xpZGVjaGFuZ2VcclxuICAgICAgICovXHJcbiAgICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2xpZGVjaGFuZ2UuemYub3JiaXQnLCBbJG5ld1NsaWRlXSk7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBVcGRhdGVzIHRoZSBhY3RpdmUgc3RhdGUgb2YgdGhlIGJ1bGxldHMsIGlmIGRpc3BsYXllZC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBpZHggLSB0aGUgaW5kZXggb2YgdGhlIGN1cnJlbnQgc2xpZGUuXHJcbiAgICovXHJcbiAgT3JiaXQucHJvdG90eXBlLl91cGRhdGVCdWxsZXRzID0gZnVuY3Rpb24oaWR4KXtcclxuICAgIHZhciAkb2xkQnVsbGV0ID0gdGhpcy4kZWxlbWVudC5maW5kKCcuJyArIHRoaXMub3B0aW9ucy5ib3hPZkJ1bGxldHMpXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZmluZCgnLmlzLWFjdGl2ZScpLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKS5ibHVyKCksXHJcbiAgICAgICAgc3BhbiA9ICRvbGRCdWxsZXQuZmluZCgnc3BhbjpsYXN0JykuZGV0YWNoKCksXHJcbiAgICAgICAgJG5ld0J1bGxldCA9IHRoaXMuJGJ1bGxldHMuZXEoaWR4KS5hZGRDbGFzcygnaXMtYWN0aXZlJykuYXBwZW5kKHNwYW4pO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgdGhlIGNhcm91c2VsIGFuZCBoaWRlcyB0aGUgZWxlbWVudC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBPcmJpdC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCl7XHJcbiAgICBkZWxldGUgdGhpcy50aW1lcjtcclxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYub3JiaXQnKS5maW5kKCcqJykub2ZmKCcuemYub3JiaXQnKS5lbmQoKS5oaWRlKCk7XHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfTtcclxuXHJcbiAgRm91bmRhdGlvbi5wbHVnaW4oT3JiaXQsICdPcmJpdCcpO1xyXG5cclxufShqUXVlcnksIHdpbmRvdy5Gb3VuZGF0aW9uKTtcclxuIiwiLyoqXHJcbiAqIFJlc3BvbnNpdmVNZW51IG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJlc3BvbnNpdmVNZW51XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYWNjb3JkaW9uTWVudVxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmRyaWxsZG93blxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmRyb3Bkb3duLW1lbnVcclxuICovXHJcbiFmdW5jdGlvbihGb3VuZGF0aW9uLCAkKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvLyBUaGUgcGx1Z2luIG1hdGNoZXMgdGhlIHBsdWdpbiBjbGFzc2VzIHdpdGggdGhlc2UgcGx1Z2luIGluc3RhbmNlcy5cclxuICB2YXIgTWVudVBsdWdpbnMgPSB7XHJcbiAgICBkcm9wZG93bjoge1xyXG4gICAgICBjc3NDbGFzczogJ2Ryb3Bkb3duJyxcclxuICAgICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydkcm9wZG93bi1tZW51J10gfHwgbnVsbFxyXG4gICAgfSxcclxuICAgIGRyaWxsZG93bjoge1xyXG4gICAgICBjc3NDbGFzczogJ2RyaWxsZG93bicsXHJcbiAgICAgIHBsdWdpbjogRm91bmRhdGlvbi5fcGx1Z2luc1snZHJpbGxkb3duJ10gfHwgbnVsbFxyXG4gICAgfSxcclxuICAgIGFjY29yZGlvbjoge1xyXG4gICAgICBjc3NDbGFzczogJ2FjY29yZGlvbi1tZW51JyxcclxuICAgICAgcGx1Z2luOiBGb3VuZGF0aW9uLl9wbHVnaW5zWydhY2NvcmRpb24tbWVudSddIHx8IG51bGxcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvLyBbUEhdIE1lZGlhIHF1ZXJpZXNcclxuICB2YXIgcGhNZWRpYSA9IHtcclxuICAgIHNtYWxsOiAnKG1pbi13aWR0aDogMHB4KScsXHJcbiAgICBtZWRpdW06ICcobWluLXdpZHRoOiA2NDBweCknXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlcyBhIG5ldyBpbnN0YW5jZSBvZiBhIHJlc3BvbnNpdmUgbWVudS5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgUmVzcG9uc2l2ZU1lbnUjaW5pdFxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIGludG8gYSBkcm9wZG93biBtZW51LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBmdW5jdGlvbiBSZXNwb25zaXZlTWVudShlbGVtZW50KSB7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gJChlbGVtZW50KTtcclxuICAgIHRoaXMucnVsZXMgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3Jlc3BvbnNpdmUtbWVudScpO1xyXG4gICAgdGhpcy5jdXJyZW50TXEgPSBudWxsO1xyXG4gICAgdGhpcy5jdXJyZW50UGx1Z2luID0gbnVsbDtcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgUmVzcG9uc2l2ZU1lbnUuZGVmYXVsdHMgPSB7fTtcclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgdGhlIE1lbnUgYnkgcGFyc2luZyB0aGUgY2xhc3NlcyBmcm9tIHRoZSAnZGF0YS1SZXNwb25zaXZlTWVudScgYXR0cmlidXRlIG9uIHRoZSBlbGVtZW50LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgUmVzcG9uc2l2ZU1lbnUucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgcnVsZXNUcmVlID0ge307XHJcblxyXG4gICAgLy8gUGFyc2UgcnVsZXMgZnJvbSBcImNsYXNzZXNcIiBpbiBkYXRhIGF0dHJpYnV0ZVxyXG4gICAgdmFyIHJ1bGVzID0gdGhpcy5ydWxlcy5zcGxpdCgnICcpO1xyXG5cclxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBldmVyeSBydWxlIGZvdW5kXHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJ1bGVzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHZhciBydWxlID0gcnVsZXNbaV0uc3BsaXQoJy0nKTtcclxuICAgICAgdmFyIHJ1bGVTaXplID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVswXSA6ICdzbWFsbCc7XHJcbiAgICAgIHZhciBydWxlUGx1Z2luID0gcnVsZS5sZW5ndGggPiAxID8gcnVsZVsxXSA6IHJ1bGVbMF07XHJcblxyXG4gICAgICBpZiAoTWVudVBsdWdpbnNbcnVsZVBsdWdpbl0gIT09IG51bGwpIHtcclxuICAgICAgICBydWxlc1RyZWVbcnVsZVNpemVdID0gTWVudVBsdWdpbnNbcnVsZVBsdWdpbl07XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnJ1bGVzID0gcnVsZXNUcmVlO1xyXG5cclxuICAgIGlmICghJC5pc0VtcHR5T2JqZWN0KHJ1bGVzVHJlZSkpIHtcclxuICAgICAgdGhpcy5fY2hlY2tNZWRpYVF1ZXJpZXMoKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyBldmVudHMgZm9yIHRoZSBNZW51LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgUmVzcG9uc2l2ZU1lbnUucHJvdG90eXBlLl9ldmVudHMgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCBmdW5jdGlvbigpIHtcclxuICAgICAgX3RoaXMuX2NoZWNrTWVkaWFRdWVyaWVzKCk7XHJcbiAgICB9KTtcclxuICAgIC8vICQod2luZG93KS5vbigncmVzaXplLnpmLlJlc3BvbnNpdmVNZW51JywgZnVuY3Rpb24oKSB7XHJcbiAgICAvLyAgIF90aGlzLl9jaGVja01lZGlhUXVlcmllcygpO1xyXG4gICAgLy8gfSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2hlY2tzIHRoZSBjdXJyZW50IHNjcmVlbiB3aWR0aCBhZ2FpbnN0IGF2YWlsYWJsZSBtZWRpYSBxdWVyaWVzLiBJZiB0aGUgbWVkaWEgcXVlcnkgaGFzIGNoYW5nZWQsIGFuZCB0aGUgcGx1Z2luIG5lZWRlZCBoYXMgY2hhbmdlZCwgdGhlIHBsdWdpbnMgd2lsbCBzd2FwIG91dC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIFJlc3BvbnNpdmVNZW51LnByb3RvdHlwZS5fY2hlY2tNZWRpYVF1ZXJpZXMgPSBmdW5jdGlvbigpIHtcclxuICAgIHZhciBtYXRjaGVkTXEsIF90aGlzID0gdGhpcztcclxuICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCBlYWNoIHJ1bGUgYW5kIGZpbmQgdGhlIGxhc3QgbWF0Y2hpbmcgcnVsZVxyXG4gICAgJC5lYWNoKHRoaXMucnVsZXMsIGZ1bmN0aW9uKGtleSkge1xyXG4gICAgICBpZiAoRm91bmRhdGlvbi5NZWRpYVF1ZXJ5LmF0TGVhc3Qoa2V5KSkge1xyXG4gICAgICAgIG1hdGNoZWRNcSA9IGtleTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gTm8gbWF0Y2g/IE5vIGRpY2VcclxuICAgIGlmICghbWF0Y2hlZE1xKSByZXR1cm47XHJcblxyXG4gICAgLy8gUGx1Z2luIGFscmVhZHkgaW5pdGlhbGl6ZWQ/IFdlIGdvb2RcclxuICAgIGlmICh0aGlzLmN1cnJlbnRQbHVnaW4gaW5zdGFuY2VvZiB0aGlzLnJ1bGVzW21hdGNoZWRNcV0ucGx1Z2luKSByZXR1cm47XHJcblxyXG4gICAgLy8gUmVtb3ZlIGV4aXN0aW5nIHBsdWdpbi1zcGVjaWZpYyBDU1MgY2xhc3Nlc1xyXG4gICAgJC5lYWNoKE1lbnVQbHVnaW5zLCBmdW5jdGlvbihrZXksIHZhbHVlKSB7XHJcbiAgICAgIF90aGlzLiRlbGVtZW50LnJlbW92ZUNsYXNzKHZhbHVlLmNzc0NsYXNzKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIEFkZCB0aGUgQ1NTIGNsYXNzIGZvciB0aGUgbmV3IHBsdWdpblxyXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLnJ1bGVzW21hdGNoZWRNcV0uY3NzQ2xhc3MpO1xyXG5cclxuICAgIC8vIENyZWF0ZSBhbiBpbnN0YW5jZSBvZiB0aGUgbmV3IHBsdWdpblxyXG4gICAgaWYgKHRoaXMuY3VycmVudFBsdWdpbikgdGhpcy5jdXJyZW50UGx1Z2luLmRlc3Ryb3koKTtcclxuICAgIHRoaXMuY3VycmVudFBsdWdpbiA9IG5ldyB0aGlzLnJ1bGVzW21hdGNoZWRNcV0ucGx1Z2luKHRoaXMuJGVsZW1lbnQsIHt9KTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyB0aGUgaW5zdGFuY2Ugb2YgdGhlIGN1cnJlbnQgcGx1Z2luIG9uIHRoaXMgZWxlbWVudCwgYXMgd2VsbCBhcyB0aGUgd2luZG93IHJlc2l6ZSBoYW5kbGVyIHRoYXQgc3dpdGNoZXMgdGhlIHBsdWdpbnMgb3V0LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIFJlc3BvbnNpdmVNZW51LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLmN1cnJlbnRQbHVnaW4uZGVzdHJveSgpO1xyXG4gICAgJCh3aW5kb3cpLm9mZignLnpmLlJlc3BvbnNpdmVNZW51Jyk7XHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfTtcclxuICBGb3VuZGF0aW9uLnBsdWdpbihSZXNwb25zaXZlTWVudSwgJ1Jlc3BvbnNpdmVNZW51Jyk7XHJcblxyXG59KEZvdW5kYXRpb24sIGpRdWVyeSk7XHJcbiIsIi8qKlxyXG4gKiBSZXNwb25zaXZlVG9nZ2xlIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJlc3BvbnNpdmVUb2dnbGVcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XHJcbiAqL1xyXG4hZnVuY3Rpb24oJCwgRm91bmRhdGlvbikge1xyXG5cclxuJ3VzZSBzdHJpY3QnO1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgVGFiIEJhci5cclxuICogQGNsYXNzXHJcbiAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI2luaXRcclxuICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGF0dGFjaCB0YWIgYmFyIGZ1bmN0aW9uYWxpdHkgdG8uXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICovXHJcbmZ1bmN0aW9uIFJlc3BvbnNpdmVUb2dnbGUoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gIHRoaXMuJGVsZW1lbnQgPSAkKGVsZW1lbnQpO1xyXG4gIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBSZXNwb25zaXZlVG9nZ2xlLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gIHRoaXMuX2luaXQoKTtcclxuICB0aGlzLl9ldmVudHMoKTtcclxuXHJcbiAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxufVxyXG5cclxuUmVzcG9uc2l2ZVRvZ2dsZS5kZWZhdWx0cyA9IHtcclxuICAvKipcclxuICAgKiBUaGUgYnJlYWtwb2ludCBhZnRlciB3aGljaCB0aGUgbWVudSBpcyBhbHdheXMgc2hvd24sIGFuZCB0aGUgdGFiIGJhciBpcyBoaWRkZW4uXHJcbiAgICogQG9wdGlvblxyXG4gICAqIEBleGFtcGxlICdtZWRpdW0nXHJcbiAgICovXHJcbiAgaGlkZUZvcjogJ21lZGl1bSdcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplcyB0aGUgdGFiIGJhciBieSBmaW5kaW5nIHRoZSB0YXJnZXQgZWxlbWVudCwgdG9nZ2xpbmcgZWxlbWVudCwgYW5kIHJ1bm5pbmcgdXBkYXRlKCkuXHJcbiAqIEBmdW5jdGlvblxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuUmVzcG9uc2l2ZVRvZ2dsZS5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgdGFyZ2V0SUQgPSB0aGlzLiRlbGVtZW50LmRhdGEoJ3Jlc3BvbnNpdmUtdG9nZ2xlJyk7XHJcbiAgaWYgKCF0YXJnZXRJRCkge1xyXG4gICAgY29uc29sZS5lcnJvcignWW91ciB0YWIgYmFyIG5lZWRzIGFuIElEIG9mIGEgTWVudSBhcyB0aGUgdmFsdWUgb2YgZGF0YS10YWItYmFyLicpO1xyXG4gIH1cclxuXHJcbiAgdGhpcy4kdGFyZ2V0TWVudSA9ICQoJyMnK3RhcmdldElEKTtcclxuICB0aGlzLiR0b2dnbGVyID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS10b2dnbGVdJyk7XHJcblxyXG4gIHRoaXMuX3VwZGF0ZSgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgbmVjZXNzYXJ5IGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgdGFiIGJhciB0byB3b3JrLlxyXG4gKiBAZnVuY3Rpb25cclxuICogQHByaXZhdGVcclxuICovXHJcblJlc3BvbnNpdmVUb2dnbGUucHJvdG90eXBlLl9ldmVudHMgPSBmdW5jdGlvbigpIHtcclxuICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAkKHdpbmRvdykub24oJ2NoYW5nZWQuemYubWVkaWFxdWVyeScsIHRoaXMuX3VwZGF0ZS5iaW5kKHRoaXMpKTtcclxuXHJcbiAgdGhpcy4kdG9nZ2xlci5vbignY2xpY2suemYucmVzcG9uc2l2ZVRvZ2dsZScsIHRoaXMudG9nZ2xlTWVudS5iaW5kKHRoaXMpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgdGhlIGN1cnJlbnQgbWVkaWEgcXVlcnkgdG8gZGV0ZXJtaW5lIGlmIHRoZSB0YWIgYmFyIHNob3VsZCBiZSB2aXNpYmxlIG9yIGhpZGRlbi5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5SZXNwb25zaXZlVG9nZ2xlLnByb3RvdHlwZS5fdXBkYXRlID0gZnVuY3Rpb24oKSB7XHJcbiAgLy8gTW9iaWxlXHJcbiAgaWYgKCFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuaGlkZUZvcikpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQuc2hvdygpO1xyXG4gICAgdGhpcy4kdGFyZ2V0TWVudS5oaWRlKCk7XHJcbiAgfVxyXG5cclxuICAvLyBEZXNrdG9wXHJcbiAgZWxzZSB7XHJcbiAgICB0aGlzLiRlbGVtZW50LmhpZGUoKTtcclxuICAgIHRoaXMuJHRhcmdldE1lbnUuc2hvdygpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBUb2dnbGVzIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyLiBUaGUgdG9nZ2xlIG9ubHkgaGFwcGVucyBpZiB0aGUgc2NyZWVuIGlzIHNtYWxsIGVub3VnaCB0byBhbGxvdyBpdC5cclxuICogQGZ1bmN0aW9uXHJcbiAqIEBmaXJlcyBSZXNwb25zaXZlVG9nZ2xlI3RvZ2dsZWRcclxuICovXHJcblJlc3BvbnNpdmVUb2dnbGUucHJvdG90eXBlLnRvZ2dsZU1lbnUgPSBmdW5jdGlvbigpIHtcclxuICBpZiAoIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5oaWRlRm9yKSkge1xyXG4gICAgdGhpcy4kdGFyZ2V0TWVudS50b2dnbGUoMCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBlbGVtZW50IGF0dGFjaGVkIHRvIHRoZSB0YWIgYmFyIHRvZ2dsZXMuXHJcbiAgICAgKiBAZXZlbnQgUmVzcG9uc2l2ZVRvZ2dsZSN0b2dnbGVkXHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcigndG9nZ2xlZC56Zi5yZXNwb25zaXZlVG9nZ2xlJyk7XHJcbiAgfVxyXG59O1xyXG5SZXNwb25zaXZlVG9nZ2xlLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKXtcclxuICAvL1RPRE8gdGhpcy4uLlxyXG59O1xyXG5Gb3VuZGF0aW9uLnBsdWdpbihSZXNwb25zaXZlVG9nZ2xlLCAnUmVzcG9uc2l2ZVRvZ2dsZScpO1xyXG5cclxufShqUXVlcnksIEZvdW5kYXRpb24pO1xyXG4iLCIvKipcclxuICogUmV2ZWFsIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnJldmVhbFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwubW90aW9uIGlmIHVzaW5nIGFuaW1hdGlvbnNcclxuICovXHJcbiFmdW5jdGlvbihGb3VuZGF0aW9uLCAkKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFJldmVhbC5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gdXNlIGZvciB0aGUgbW9kYWwuXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBvcHRpb25hbCBwYXJhbWV0ZXJzLlxyXG4gICAqL1xyXG5cclxuICBmdW5jdGlvbiBSZXZlYWwoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgUmV2ZWFsLmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcbiAgICB0aGlzLl9pbml0KCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ1JldmVhbCcsIHtcclxuICAgICAgJ0VOVEVSJzogJ29wZW4nLFxyXG4gICAgICAnU1BBQ0UnOiAnb3BlbicsXHJcbiAgICAgICdFU0NBUEUnOiAnY2xvc2UnLFxyXG4gICAgICAnVEFCJzogJ3RhYl9mb3J3YXJkJyxcclxuICAgICAgJ1NISUZUX1RBQic6ICd0YWJfYmFja3dhcmQnXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIFJldmVhbC5kZWZhdWx0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogTW90aW9uLVVJIGNsYXNzIHRvIHVzZSBmb3IgYW5pbWF0ZWQgZWxlbWVudHMuIElmIG5vbmUgdXNlZCwgZGVmYXVsdHMgdG8gc2ltcGxlIHNob3cvaGlkZS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICdzbGlkZS1pbi1sZWZ0J1xyXG4gICAgICovXHJcbiAgICBhbmltYXRpb25JbjogJycsXHJcbiAgICAvKipcclxuICAgICAqIE1vdGlvbi1VSSBjbGFzcyB0byB1c2UgZm9yIGFuaW1hdGVkIGVsZW1lbnRzLiBJZiBub25lIHVzZWQsIGRlZmF1bHRzIHRvIHNpbXBsZSBzaG93L2hpZGUuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnc2xpZGUtb3V0LXJpZ2h0J1xyXG4gICAgICovXHJcbiAgICBhbmltYXRpb25PdXQ6ICcnLFxyXG4gICAgLyoqXHJcbiAgICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIG9wZW5pbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgMTBcclxuICAgICAqL1xyXG4gICAgc2hvd0RlbGF5OiAwLFxyXG4gICAgLyoqXHJcbiAgICAgKiBUaW1lLCBpbiBtcywgdG8gZGVsYXkgdGhlIGNsb3Npbmcgb2YgYSBtb2RhbCBhZnRlciBhIGNsaWNrIGlmIG5vIGFuaW1hdGlvbiB1c2VkLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgMTBcclxuICAgICAqL1xyXG4gICAgaGlkZURlbGF5OiAwLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBbGxvd3MgYSBjbGljayBvbiB0aGUgYm9keS9vdmVybGF5IHRvIGNsb3NlIHRoZSBtb2RhbC5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgY2xvc2VPbkNsaWNrOiB0cnVlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGNsb3NlIGlmIHRoZSB1c2VyIHByZXNzZXMgdGhlIGBFU0NBUEVgIGtleS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgY2xvc2VPbkVzYzogdHJ1ZSxcclxuICAgIC8qKlxyXG4gICAgICogSWYgdHJ1ZSwgYWxsb3dzIG11bHRpcGxlIG1vZGFscyB0byBiZSBkaXNwbGF5ZWQgYXQgb25jZS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIG11bHRpcGxlT3BlbmVkOiBmYWxzZSxcclxuICAgIC8qKlxyXG4gICAgICogRGlzdGFuY2UsIGluIHBpeGVscywgdGhlIG1vZGFsIHNob3VsZCBwdXNoIGRvd24gZnJvbSB0aGUgdG9wIG9mIHRoZSBzY3JlZW4uXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAxMDBcclxuICAgICAqL1xyXG4gICAgdk9mZnNldDogMTAwLFxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXN0YW5jZSwgaW4gcGl4ZWxzLCB0aGUgbW9kYWwgc2hvdWxkIHB1c2ggaW4gZnJvbSB0aGUgc2lkZSBvZiB0aGUgc2NyZWVuLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgMFxyXG4gICAgICovXHJcbiAgICBoT2Zmc2V0OiAwLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBbGxvd3MgdGhlIG1vZGFsIHRvIGJlIGZ1bGxzY3JlZW4sIGNvbXBsZXRlbHkgYmxvY2tpbmcgb3V0IHRoZSByZXN0IG9mIHRoZSB2aWV3LiBKUyBjaGVja3MgZm9yIHRoaXMgYXMgd2VsbC5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIGZ1bGxTY3JlZW46IGZhbHNlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBQZXJjZW50YWdlIG9mIHNjcmVlbiBoZWlnaHQgdGhlIG1vZGFsIHNob3VsZCBwdXNoIHVwIGZyb20gdGhlIGJvdHRvbSBvZiB0aGUgdmlldy5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIDEwXHJcbiAgICAgKi9cclxuICAgIGJ0bU9mZnNldFBjdDogMTAsXHJcbiAgICAvKipcclxuICAgICAqIEFsbG93cyB0aGUgbW9kYWwgdG8gZ2VuZXJhdGUgYW4gb3ZlcmxheSBkaXYsIHdoaWNoIHdpbGwgY292ZXIgdGhlIHZpZXcgd2hlbiBtb2RhbCBvcGVucy5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgb3ZlcmxheTogdHJ1ZSxcclxuICAgIC8qKlxyXG4gICAgICogQWxsb3dzIHRoZSBtb2RhbCB0byByZW1vdmUgYW5kIHJlaW5qZWN0IG1hcmt1cCBvbiBjbG9zZS4gU2hvdWxkIGJlIHRydWUgaWYgdXNpbmcgdmlkZW8gZWxlbWVudHMgdy9vIHVzaW5nIHByb3ZpZGVyJ3MgYXBpLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgICAqL1xyXG4gICAgcmVzZXRPbkNsb3NlOiBmYWxzZVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBtb2RhbCBieSBhZGRpbmcgdGhlIG92ZXJsYXkgYW5kIGNsb3NlIGJ1dHRvbnMsIChpZiBzZWxlY3RlZCkuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBSZXZlYWwucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuaWQgPSB0aGlzLiRlbGVtZW50LmF0dHIoJ2lkJyk7XHJcbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XHJcblxyXG4gICAgdGhpcy4kYW5jaG9yID0gJCgnW2RhdGEtb3Blbj1cIicgKyB0aGlzLmlkICsgJ1wiXScpLmxlbmd0aCA/ICQoJ1tkYXRhLW9wZW49XCInICsgdGhpcy5pZCArICdcIl0nKSA6ICQoJ1tkYXRhLXRvZ2dsZT1cIicgKyB0aGlzLmlkICsgJ1wiXScpO1xyXG5cclxuICAgIGlmKHRoaXMuJGFuY2hvci5sZW5ndGgpe1xyXG4gICAgICB2YXIgYW5jaG9ySWQgPSB0aGlzLiRhbmNob3JbMF0uaWQgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAncmV2ZWFsJyk7XHJcblxyXG4gICAgICB0aGlzLiRhbmNob3IuYXR0cih7XHJcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiB0aGlzLmlkLFxyXG4gICAgICAgICdpZCc6IGFuY2hvcklkLFxyXG4gICAgICAgICdhcmlhLWhhc3BvcHVwJzogdHJ1ZSxcclxuICAgICAgICAndGFiaW5kZXgnOiAwXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmF0dHIoeydhcmlhLWxhYmVsbGVkYnknOiBhbmNob3JJZH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIHRoaXMub3B0aW9ucy5mdWxsU2NyZWVuID0gdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZnVsbCcpO1xyXG4gICAgaWYodGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4gfHwgdGhpcy4kZWxlbWVudC5oYXNDbGFzcygnZnVsbCcpKXtcclxuICAgICAgdGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4gPSB0cnVlO1xyXG4gICAgICB0aGlzLm9wdGlvbnMub3ZlcmxheSA9IGZhbHNlO1xyXG4gICAgfVxyXG4gICAgaWYodGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgIXRoaXMuJG92ZXJsYXkpe1xyXG4gICAgICB0aGlzLiRvdmVybGF5ID0gdGhpcy5fbWFrZU92ZXJsYXkodGhpcy5pZCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHtcclxuICAgICAgICAncm9sZSc6ICdkaWFsb2cnLFxyXG4gICAgICAgICdhcmlhLWhpZGRlbic6IHRydWUsXHJcbiAgICAgICAgJ2RhdGEteWV0aS1ib3gnOiB0aGlzLmlkLFxyXG4gICAgICAgICdkYXRhLXJlc2l6ZSc6IHRoaXMuaWRcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYW4gb3ZlcmxheSBkaXYgdG8gZGlzcGxheSBiZWhpbmQgdGhlIG1vZGFsLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgUmV2ZWFsLnByb3RvdHlwZS5fbWFrZU92ZXJsYXkgPSBmdW5jdGlvbihpZCl7XHJcbiAgICB2YXIgJG92ZXJsYXkgPSAkKCc8ZGl2PjwvZGl2PicpXHJcbiAgICAgICAgICAgICAgICAgICAgLmFkZENsYXNzKCdyZXZlYWwtb3ZlcmxheScpXHJcbiAgICAgICAgICAgICAgICAgICAgLmF0dHIoeyd0YWJpbmRleCc6IC0xLCAnYXJpYS1oaWRkZW4nOiB0cnVlfSlcclxuICAgICAgICAgICAgICAgICAgICAuYXBwZW5kVG8oJ2JvZHknKTtcclxuICAgIGlmKHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spe1xyXG4gICAgICAkb3ZlcmxheS5hdHRyKHtcclxuICAgICAgICAnZGF0YS1jbG9zZSc6IGlkXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuICRvdmVybGF5O1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBtb2RhbC5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIFJldmVhbC5wcm90b3R5cGUuX2V2ZW50cyA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQub24oe1xyXG4gICAgICAnb3Blbi56Zi50cmlnZ2VyJzogdGhpcy5vcGVuLmJpbmQodGhpcyksXHJcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5jbG9zZS5iaW5kKHRoaXMpLFxyXG4gICAgICAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxyXG4gICAgICAncmVzaXplbWUuemYudHJpZ2dlcic6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgaWYoX3RoaXMuJGVsZW1lbnQuaXMoJzp2aXNpYmxlJykpe1xyXG4gICAgICAgICAgX3RoaXMuX3NldFBvc2l0aW9uKGZ1bmN0aW9uKCl7fSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICBpZih0aGlzLiRhbmNob3IubGVuZ3RoKXtcclxuICAgICAgdGhpcy4kYW5jaG9yLm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIGlmKGUud2hpY2ggPT09IDEzIHx8IGUud2hpY2ggPT09IDMyKXtcclxuICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgICBfdGhpcy5vcGVuKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgaWYodGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiB0aGlzLm9wdGlvbnMub3ZlcmxheSl7XHJcbiAgICAgIHRoaXMuJG92ZXJsYXkub2ZmKCcuemYucmV2ZWFsJykub24oJ2NsaWNrLnpmLnJldmVhbCcsIHRoaXMuY2xvc2UuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiB0aGUgbW9kYWwgYmVmb3JlIG9wZW5pbmdcclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIGEgY2FsbGJhY2sgZnVuY3Rpb24gdG8gZXhlY3V0ZSB3aGVuIHBvc2l0aW9uaW5nIGlzIGNvbXBsZXRlLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgUmV2ZWFsLnByb3RvdHlwZS5fc2V0UG9zaXRpb24gPSBmdW5jdGlvbihjYil7XHJcbiAgICB2YXIgZWxlRGltcyA9IEZvdW5kYXRpb24uQm94LkdldERpbWVuc2lvbnModGhpcy4kZWxlbWVudCk7XHJcbiAgICB2YXIgZWxlUG9zID0gdGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4gPyAncmV2ZWFsIGZ1bGwnIDogKGVsZURpbXMuaGVpZ2h0ID49ICgwLjUgKiBlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0KSkgPyAncmV2ZWFsJyA6ICdjZW50ZXInO1xyXG5cclxuICAgIGlmKGVsZVBvcyA9PT0gJ3JldmVhbCBmdWxsJyl7XHJcbiAgICAgIC8vc2V0IHRvIGZ1bGwgaGVpZ2h0L3dpZHRoXHJcbiAgICAgIHRoaXMuJGVsZW1lbnRcclxuICAgICAgICAgIC5vZmZzZXQoRm91bmRhdGlvbi5Cb3guR2V0T2Zmc2V0cyh0aGlzLiRlbGVtZW50LCBudWxsLCBlbGVQb3MsIHRoaXMub3B0aW9ucy52T2Zmc2V0KSlcclxuICAgICAgICAgIC5jc3Moe1xyXG4gICAgICAgICAgICAnaGVpZ2h0JzogZWxlRGltcy53aW5kb3dEaW1zLmhlaWdodCxcclxuICAgICAgICAgICAgJ3dpZHRoJzogZWxlRGltcy53aW5kb3dEaW1zLndpZHRoXHJcbiAgICAgICAgICB9KTtcclxuICAgIH1lbHNlIGlmKCFGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCgnbWVkaXVtJykgfHwgIUZvdW5kYXRpb24uQm94LkltTm90VG91Y2hpbmdZb3UodGhpcy4kZWxlbWVudCwgbnVsbCwgdHJ1ZSwgZmFsc2UpKXtcclxuICAgICAgLy9pZiBzbWFsbGVyIHRoYW4gbWVkaXVtLCByZXNpemUgdG8gMTAwJSB3aWR0aCBtaW51cyBhbnkgY3VzdG9tIEwvUiBtYXJnaW5cclxuICAgICAgdGhpcy4kZWxlbWVudFxyXG4gICAgICAgICAgLmNzcyh7XHJcbiAgICAgICAgICAgICd3aWR0aCc6IGVsZURpbXMud2luZG93RGltcy53aWR0aCAtICh0aGlzLm9wdGlvbnMuaE9mZnNldCAqIDIpXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIG51bGwsICdjZW50ZXInLCB0aGlzLm9wdGlvbnMudk9mZnNldCwgdGhpcy5vcHRpb25zLmhPZmZzZXQpKTtcclxuICAgICAgLy9mbGFnIGEgYm9vbGVhbiBzbyB3ZSBjYW4gcmVzZXQgdGhlIHNpemUgYWZ0ZXIgdGhlIGVsZW1lbnQgaXMgY2xvc2VkLlxyXG4gICAgICB0aGlzLmNoYW5nZWRTaXplID0gdHJ1ZTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLiRlbGVtZW50XHJcbiAgICAgICAgICAuY3NzKHtcclxuICAgICAgICAgICAgJ21heC1oZWlnaHQnOiBlbGVEaW1zLndpbmRvd0RpbXMuaGVpZ2h0IC0gKHRoaXMub3B0aW9ucy52T2Zmc2V0ICogKHRoaXMub3B0aW9ucy5idG1PZmZzZXRQY3QgLyAxMDAgKyAxKSksXHJcbiAgICAgICAgICAgICd3aWR0aCc6ICcnXHJcbiAgICAgICAgICB9KVxyXG4gICAgICAgICAgLm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMuJGVsZW1lbnQsIG51bGwsIGVsZVBvcywgdGhpcy5vcHRpb25zLnZPZmZzZXQpKTtcclxuICAgICAgICAgIC8vdGhlIG1heCBoZWlnaHQgYmFzZWQgb24gYSBwZXJjZW50YWdlIG9mIHZlcnRpY2FsIG9mZnNldCBwbHVzIHZlcnRpY2FsIG9mZnNldFxyXG4gICAgfVxyXG5cclxuICAgIGNiKCk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogT3BlbnMgdGhlIG1vZGFsIGNvbnRyb2xsZWQgYnkgYHRoaXMuJGFuY2hvcmAsIGFuZCBjbG9zZXMgYWxsIG90aGVycyBieSBkZWZhdWx0LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBmaXJlcyBSZXZlYWwjY2xvc2VBbGxcclxuICAgKiBAZmlyZXMgUmV2ZWFsI29wZW5cclxuICAgKi9cclxuICBSZXZlYWwucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbigpe1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMuaXNBY3RpdmUgPSB0cnVlO1xyXG4gICAgLy9tYWtlIGVsZW1lbnQgaW52aXNpYmxlLCBidXQgcmVtb3ZlIGRpc3BsYXk6IG5vbmUgc28gd2UgY2FuIGdldCBzaXplIGFuZCBwb3NpdGlvbmluZ1xyXG4gICAgdGhpcy4kZWxlbWVudFxyXG4gICAgICAgIC5jc3Moeyd2aXNpYmlsaXR5JzogJ2hpZGRlbid9KVxyXG4gICAgICAgIC5zaG93KClcclxuICAgICAgICAuc2Nyb2xsVG9wKDApO1xyXG5cclxuICAgIHRoaXMuX3NldFBvc2l0aW9uKGZ1bmN0aW9uKCl7XHJcbiAgICAgIF90aGlzLiRlbGVtZW50LmhpZGUoKVxyXG4gICAgICAgICAgICAgICAgICAgLmNzcyh7J3Zpc2liaWxpdHknOiAnJ30pO1xyXG4gICAgICBpZighX3RoaXMub3B0aW9ucy5tdWx0aXBsZU9wZW5lZCl7XHJcbiAgICAgICAgLyoqXHJcbiAgICAgICAgICogRmlyZXMgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBtb2RhbCBvcGVucy5cclxuICAgICAgICAgKiBDbG9zZXMgYW55IG90aGVyIG1vZGFscyB0aGF0IGFyZSBjdXJyZW50bHkgb3BlblxyXG4gICAgICAgICAqIEBldmVudCBSZXZlYWwjY2xvc2VBbGxcclxuICAgICAgICAgKi9cclxuICAgICAgICBfdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZW1lLnpmLnJldmVhbCcsIF90aGlzLmlkKTtcclxuICAgICAgfVxyXG4gICAgICBpZihfdGhpcy5vcHRpb25zLmFuaW1hdGlvbkluKXtcclxuICAgICAgICBpZihfdGhpcy5vcHRpb25zLm92ZXJsYXkpe1xyXG4gICAgICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZUluKF90aGlzLiRvdmVybGF5LCAnZmFkZS1pbicsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbihfdGhpcy4kZWxlbWVudCwgX3RoaXMub3B0aW9ucy5hbmltYXRpb25JbiwgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICBfdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZShfdGhpcy4kZWxlbWVudCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlSW4oX3RoaXMuJGVsZW1lbnQsIF90aGlzLm9wdGlvbnMuYW5pbWF0aW9uSW4sIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzID0gRm91bmRhdGlvbi5LZXlib2FyZC5maW5kRm9jdXNhYmxlKF90aGlzLiRlbGVtZW50KTtcclxuICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgaWYoX3RoaXMub3B0aW9ucy5vdmVybGF5KXtcclxuICAgICAgICAgIF90aGlzLiRvdmVybGF5LnNob3coMCwgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgX3RoaXMuJGVsZW1lbnQuc2hvdyhfdGhpcy5vcHRpb25zLnNob3dEZWxheSwgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIF90aGlzLiRlbGVtZW50LnNob3coX3RoaXMub3B0aW9ucy5zaG93RGVsYXksIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvLyBoYW5kbGUgYWNjZXNzaWJpbGl0eVxyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZX0pLmF0dHIoJ3RhYmluZGV4JywgLTEpLmZvY3VzKClcclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgbW9kYWwgaGFzIHN1Y2Nlc3NmdWxseSBvcGVuZWQuXHJcbiAgICAgKiBAZXZlbnQgUmV2ZWFsI29wZW5cclxuICAgICAqL1xyXG4gICAgICAgICAgICAgICAgIC50cmlnZ2VyKCdvcGVuLnpmLnJldmVhbCcpO1xyXG5cclxuICAgICQoJ2JvZHknKS5hZGRDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKVxyXG4gICAgICAgICAgICAgLmF0dHIoeydhcmlhLWhpZGRlbic6ICh0aGlzLm9wdGlvbnMub3ZlcmxheSB8fCB0aGlzLm9wdGlvbnMuZnVsbFNjcmVlbikgPyB0cnVlIDogZmFsc2V9KTtcclxuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgX3RoaXMuX2V4dHJhSGFuZGxlcnMoKTtcclxuICAgICAgLy8gRm91bmRhdGlvbi5yZWZsb3coKTtcclxuICAgIH0sIDApO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXh0cmEgZXZlbnQgaGFuZGxlcnMgZm9yIHRoZSBib2R5IGFuZCB3aW5kb3cgaWYgbmVjZXNzYXJ5LlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgUmV2ZWFsLnByb3RvdHlwZS5fZXh0cmFIYW5kbGVycyA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdGhpcy5mb2N1c2FibGVFbGVtZW50cyA9IEZvdW5kYXRpb24uS2V5Ym9hcmQuZmluZEZvY3VzYWJsZSh0aGlzLiRlbGVtZW50KTtcclxuXHJcbiAgICBpZighdGhpcy5vcHRpb25zLm92ZXJsYXkgJiYgdGhpcy5vcHRpb25zLmNsb3NlT25DbGljayAmJiAhdGhpcy5vcHRpb25zLmZ1bGxTY3JlZW4pe1xyXG4gICAgICAkKCdib2R5Jykub24oJ2NsaWNrLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIC8vIGlmKClcclxuICAgICAgICAgIF90aGlzLmNsb3NlKCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYodGhpcy5vcHRpb25zLmNsb3NlT25Fc2Mpe1xyXG4gICAgICAkKHdpbmRvdykub24oJ2tleWRvd24uemYucmV2ZWFsJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgRm91bmRhdGlvbi5LZXlib2FyZC5oYW5kbGVLZXkoZSwgX3RoaXMsIHtcclxuICAgICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jbG9zZU9uRXNjKSB7XHJcbiAgICAgICAgICAgICAgdGhpcy5jbG9zZSgpO1xyXG4gICAgICAgICAgICAgIHRoaXMuJGFuY2hvci5mb2N1cygpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgaWYgKF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzLmxlbmd0aCA9PT0gMCkgeyAvLyBubyBmb2N1c2FibGUgZWxlbWVudHMgaW5zaWRlIHRoZSBtb2RhbCBhdCBhbGwsIHByZXZlbnQgdGFiYmluZyBpbiBnZW5lcmFsXHJcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBsb2NrIGZvY3VzIHdpdGhpbiBtb2RhbCB3aGlsZSB0YWJiaW5nXHJcbiAgICB0aGlzLiRlbGVtZW50Lm9uKCdrZXlkb3duLnpmLnJldmVhbCcsIGZ1bmN0aW9uKGUpIHtcclxuICAgICAgdmFyICR0YXJnZXQgPSAkKHRoaXMpO1xyXG4gICAgICAvLyBoYW5kbGUga2V5Ym9hcmQgZXZlbnQgd2l0aCBrZXlib2FyZCB1dGlsXHJcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsIF90aGlzLCB7XHJcbiAgICAgICAgdGFiX2ZvcndhcmQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgaWYgKHRoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXMoX3RoaXMuZm9jdXNhYmxlRWxlbWVudHMuZXEoLTEpKSkgeyAvLyBsZWZ0IG1vZGFsIGRvd253YXJkcywgc2V0dGluZyBmb2N1cyB0byBmaXJzdCBlbGVtZW50XHJcbiAgICAgICAgICAgIF90aGlzLmZvY3VzYWJsZUVsZW1lbnRzLmVxKDApLmZvY3VzKCk7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIHRhYl9iYWNrd2FyZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAodGhpcy4kZWxlbWVudC5maW5kKCc6Zm9jdXMnKS5pcyhfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5lcSgwKSkgfHwgdGhpcy4kZWxlbWVudC5pcygnOmZvY3VzJykpIHsgLy8gbGVmdCBtb2RhbCB1cHdhcmRzLCBzZXR0aW5nIGZvY3VzIHRvIGxhc3QgZWxlbWVudFxyXG4gICAgICAgICAgICBfdGhpcy5mb2N1c2FibGVFbGVtZW50cy5lcSgtMSkuZm9jdXMoKTtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBpZiAoX3RoaXMuJGVsZW1lbnQuZmluZCgnOmZvY3VzJykuaXMoX3RoaXMuJGVsZW1lbnQuZmluZCgnW2RhdGEtY2xvc2VdJykpKSB7XHJcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7IC8vIHNldCBmb2N1cyBiYWNrIHRvIGFuY2hvciBpZiBjbG9zZSBidXR0b24gaGFzIGJlZW4gYWN0aXZhdGVkXHJcbiAgICAgICAgICAgICAgX3RoaXMuJGFuY2hvci5mb2N1cygpO1xyXG4gICAgICAgICAgICB9LCAxKTtcclxuICAgICAgICAgIH0gZWxzZSBpZiAoJHRhcmdldC5pcyhfdGhpcy5mb2N1c2FibGVFbGVtZW50cykpIHsgLy8gZG9udCd0IHRyaWdnZXIgaWYgYWN1YWwgZWxlbWVudCBoYXMgZm9jdXMgKGkuZS4gaW5wdXRzLCBsaW5rcywgLi4uKVxyXG4gICAgICAgICAgICB0aGlzLm9wZW4oKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNsb3NlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuY2xvc2VPbkVzYykge1xyXG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICAgICAgICAgIHRoaXMuJGFuY2hvci5mb2N1cygpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9KTtcclxuXHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2xvc2VzIHRoZSBtb2RhbC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgUmV2ZWFsI2Nsb3NlZFxyXG4gICAqL1xyXG4gIFJldmVhbC5wcm90b3R5cGUuY2xvc2UgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYoIXRoaXMuaXNBY3RpdmUgfHwgIXRoaXMuJGVsZW1lbnQuaXMoJzp2aXNpYmxlJykpe1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIGlmKHRoaXMub3B0aW9ucy5hbmltYXRpb25PdXQpe1xyXG4gICAgICBGb3VuZGF0aW9uLk1vdGlvbi5hbmltYXRlT3V0KHRoaXMuJGVsZW1lbnQsIHRoaXMub3B0aW9ucy5hbmltYXRpb25PdXQsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgaWYoX3RoaXMub3B0aW9ucy5vdmVybGF5KXtcclxuICAgICAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVPdXQoX3RoaXMuJG92ZXJsYXksICdmYWRlLW91dCcsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuaGlkZShfdGhpcy5vcHRpb25zLmhpZGVEZWxheSwgZnVuY3Rpb24oKXtcclxuICAgICAgICBpZihfdGhpcy5vcHRpb25zLm92ZXJsYXkpe1xyXG4gICAgICAgICAgX3RoaXMuJG92ZXJsYXkuaGlkZSgwLCBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuICAgIC8vY29uZGl0aW9uYWxzIHRvIHJlbW92ZSBleHRyYSBldmVudCBsaXN0ZW5lcnMgYWRkZWQgb24gb3BlblxyXG4gICAgaWYodGhpcy5vcHRpb25zLmNsb3NlT25Fc2Mpe1xyXG4gICAgICAkKHdpbmRvdykub2ZmKCdrZXlkb3duLnpmLnJldmVhbCcpO1xyXG4gICAgfVxyXG4gICAgaWYoIXRoaXMub3B0aW9ucy5vdmVybGF5ICYmIHRoaXMub3B0aW9ucy5jbG9zZU9uQ2xpY2spe1xyXG4gICAgICAkKCdib2R5Jykub2ZmKCdjbGljay56Zi5yZXZlYWwnKTtcclxuICAgIH1cclxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCdrZXlkb3duLnpmLnJldmVhbCcpO1xyXG5cclxuICAgIC8vaWYgdGhlIG1vZGFsIGNoYW5nZWQgc2l6ZSwgcmVzZXQgaXRcclxuICAgIGlmKHRoaXMuY2hhbmdlZFNpemUpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmNzcyh7XHJcbiAgICAgICAgJ2hlaWdodCc6ICcnLFxyXG4gICAgICAgICd3aWR0aCc6ICcnXHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygnaXMtcmV2ZWFsLW9wZW4nKS5hdHRyKHsnYXJpYS1oaWRkZW4nOiBmYWxzZSwgJ3RhYmluZGV4JzogJyd9KTtcclxuXHJcbiAgICAvKipcclxuICAgICogUmVzZXRzIHRoZSBtb2RhbCBjb250ZW50XHJcbiAgICAqIFRoaXMgcHJldmVudHMgYSBydW5uaW5nIHZpZGVvIHRvIGtlZXAgZ29pbmcgaW4gdGhlIGJhY2tncm91bmRcclxuICAgICovXHJcbiAgICBpZih0aGlzLm9wdGlvbnMucmVzZXRPbkNsb3NlKSB7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQuaHRtbCh0aGlzLiRlbGVtZW50Lmh0bWwoKSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xyXG4gICAgdGhpcy4kZWxlbWVudC5hdHRyKHsnYXJpYS1oaWRkZW4nOiB0cnVlfSlcclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgbW9kYWwgaXMgZG9uZSBjbG9zaW5nLlxyXG4gICAgICogQGV2ZW50IFJldmVhbCNjbG9zZWRcclxuICAgICAqL1xyXG4gICAgICAgICAgICAgICAgIC50cmlnZ2VyKCdjbG9zZWQuemYucmV2ZWFsJyk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBUb2dnbGVzIHRoZSBvcGVuL2Nsb3NlZCBzdGF0ZSBvZiBhIG1vZGFsLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIFJldmVhbC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24oKXtcclxuICAgIGlmKHRoaXMuaXNBY3RpdmUpe1xyXG4gICAgICB0aGlzLmNsb3NlKCk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgdGhpcy5vcGVuKCk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgYSBtb2RhbC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBSZXZlYWwucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpIHtcclxuICAgIGlmKHRoaXMub3B0aW9ucy5vdmVybGF5KXtcclxuICAgICAgdGhpcy4kb3ZlcmxheS5oaWRlKCkub2ZmKCkucmVtb3ZlKCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLiRlbGVtZW50LmhpZGUoKTtcclxuICAgIHRoaXMuJGFuY2hvci5vZmYoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfTtcclxuXHJcbiAgRm91bmRhdGlvbi5wbHVnaW4oUmV2ZWFsLCAnUmV2ZWFsJyk7XHJcblxyXG4gIC8vIEV4cG9ydHMgZm9yIEFNRC9Ccm93c2VyaWZ5XHJcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFJldmVhbDtcclxuICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJylcclxuICAgIGRlZmluZShbJ2ZvdW5kYXRpb24nXSwgZnVuY3Rpb24oKSB7XHJcbiAgICAgIHJldHVybiBSZXZlYWw7XHJcbiAgICB9KTtcclxuXHJcbn0oRm91bmRhdGlvbiwgalF1ZXJ5KTtcclxuIiwiLyoqXHJcbiAqIFNsaWRlciBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi5zbGlkZXJcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tb3Rpb25cclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC50cmlnZ2Vyc1xyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLmtleWJvYXJkXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudG91Y2hcclxuICovXHJcbiFmdW5jdGlvbigkLCBGb3VuZGF0aW9uKXtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgYSBkcmlsbGRvd24gbWVudS5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gZWxlbWVudCAtIGpRdWVyeSBvYmplY3QgdG8gbWFrZSBpbnRvIGFuIGFjY29yZGlvbiBtZW51LlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBmdW5jdGlvbiBTbGlkZXIoZWxlbWVudCwgb3B0aW9ucyl7XHJcbiAgICB0aGlzLiRlbGVtZW50ID0gZWxlbWVudDtcclxuICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBTbGlkZXIuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcblxyXG4gICAgRm91bmRhdGlvbi5yZWdpc3RlclBsdWdpbih0aGlzKTtcclxuICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQucmVnaXN0ZXIoJ1NsaWRlcicsIHtcclxuICAgICAgJ2x0cic6IHtcclxuICAgICAgICAnQVJST1dfUklHSFQnOiAnaW5jcmVhc2UnLFxyXG4gICAgICAgICdBUlJPV19VUCc6ICdpbmNyZWFzZScsXHJcbiAgICAgICAgJ0FSUk9XX0RPV04nOiAnZGVjcmVhc2UnLFxyXG4gICAgICAgICdBUlJPV19MRUZUJzogJ2RlY3JlYXNlJyxcclxuICAgICAgICAnU0hJRlRfQVJST1dfUklHSFQnOiAnaW5jcmVhc2VfZmFzdCcsXHJcbiAgICAgICAgJ1NISUZUX0FSUk9XX1VQJzogJ2luY3JlYXNlX2Zhc3QnLFxyXG4gICAgICAgICdTSElGVF9BUlJPV19ET1dOJzogJ2RlY3JlYXNlX2Zhc3QnLFxyXG4gICAgICAgICdTSElGVF9BUlJPV19MRUZUJzogJ2RlY3JlYXNlX2Zhc3QnXHJcbiAgICAgIH0sXHJcbiAgICAgICdydGwnOiB7XHJcbiAgICAgICAgJ0FSUk9XX0xFRlQnOiAnaW5jcmVhc2UnLFxyXG4gICAgICAgICdBUlJPV19SSUdIVCc6ICdkZWNyZWFzZScsXHJcbiAgICAgICAgJ1NISUZUX0FSUk9XX0xFRlQnOiAnaW5jcmVhc2VfZmFzdCcsXHJcbiAgICAgICAgJ1NISUZUX0FSUk9XX1JJR0hUJzogJ2RlY3JlYXNlX2Zhc3QnXHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgU2xpZGVyLmRlZmF1bHRzID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBNaW5pbXVtIHZhbHVlIGZvciB0aGUgc2xpZGVyIHNjYWxlLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgMFxyXG4gICAgICovXHJcbiAgICBzdGFydDogMCxcclxuICAgIC8qKlxyXG4gICAgICogTWF4aW11bSB2YWx1ZSBmb3IgdGhlIHNsaWRlciBzY2FsZS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIDEwMFxyXG4gICAgICovXHJcbiAgICBlbmQ6IDEwMCxcclxuICAgIC8qKlxyXG4gICAgICogTWluaW11bSB2YWx1ZSBjaGFuZ2UgcGVyIGNoYW5nZSBldmVudC4gTm90IEN1cnJlbnRseSBJbXBsZW1lbnRlZCFcclxuXHJcbiAgICAgKi9cclxuICAgIHN0ZXA6IDEsXHJcbiAgICAvKipcclxuICAgICAqIFZhbHVlIGF0IHdoaWNoIHRoZSBoYW5kbGUvaW5wdXQgKihsZWZ0IGhhbmRsZS9maXJzdCBpbnB1dCkqIHNob3VsZCBiZSBzZXQgdG8gb24gaW5pdGlhbGl6YXRpb24uXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAwXHJcbiAgICAgKi9cclxuICAgIGluaXRpYWxTdGFydDogMCxcclxuICAgIC8qKlxyXG4gICAgICogVmFsdWUgYXQgd2hpY2ggdGhlIHJpZ2h0IGhhbmRsZS9zZWNvbmQgaW5wdXQgc2hvdWxkIGJlIHNldCB0byBvbiBpbml0aWFsaXphdGlvbi5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIDEwMFxyXG4gICAgICovXHJcbiAgICBpbml0aWFsRW5kOiAxMDAsXHJcbiAgICAvKipcclxuICAgICAqIEFsbG93cyB0aGUgaW5wdXQgdG8gYmUgbG9jYXRlZCBvdXRzaWRlIHRoZSBjb250YWluZXIgYW5kIHZpc2libGUuIFNldCB0byBieSB0aGUgSlNcclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIGJpbmRpbmc6IGZhbHNlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBbGxvd3MgdGhlIHVzZXIgdG8gY2xpY2svdGFwIG9uIHRoZSBzbGlkZXIgYmFyIHRvIHNlbGVjdCBhIHZhbHVlLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgdHJ1ZVxyXG4gICAgICovXHJcbiAgICBjbGlja1NlbGVjdDogdHJ1ZSxcclxuICAgIC8qKlxyXG4gICAgICogU2V0IHRvIHRydWUgYW5kIHVzZSB0aGUgYHZlcnRpY2FsYCBjbGFzcyB0byBjaGFuZ2UgYWxpZ25tZW50IHRvIHZlcnRpY2FsLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgICAqL1xyXG4gICAgdmVydGljYWw6IGZhbHNlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBbGxvd3MgdGhlIHVzZXIgdG8gZHJhZyB0aGUgc2xpZGVyIGhhbmRsZShzKSB0byBzZWxlY3QgYSB2YWx1ZS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgZHJhZ2dhYmxlOiB0cnVlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXNhYmxlcyB0aGUgc2xpZGVyIGFuZCBwcmV2ZW50cyBldmVudCBsaXN0ZW5lcnMgZnJvbSBiZWluZyBhcHBsaWVkLiBEb3VibGUgY2hlY2tlZCBieSBKUyB3aXRoIGBkaXNhYmxlZENsYXNzYC5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIGRpc2FibGVkOiBmYWxzZSxcclxuICAgIC8qKlxyXG4gICAgICogQWxsb3dzIHRoZSB1c2Ugb2YgdHdvIGhhbmRsZXMuIERvdWJsZSBjaGVja2VkIGJ5IHRoZSBKUy4gQ2hhbmdlcyBzb21lIGxvZ2ljIGhhbmRsaW5nLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgICAqL1xyXG4gICAgZG91YmxlU2lkZWQ6IGZhbHNlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBQb3RlbnRpYWwgZnV0dXJlIGZlYXR1cmUuXHJcbiAgICAgKi9cclxuICAgIC8vIHN0ZXBzOiAxMDAsXHJcbiAgICAvKipcclxuICAgICAqIE51bWJlciBvZiBkZWNpbWFsIHBsYWNlcyB0aGUgcGx1Z2luIHNob3VsZCBnbyB0byBmb3IgZmxvYXRpbmcgcG9pbnQgcHJlY2lzaW9uLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgMlxyXG4gICAgICovXHJcbiAgICBkZWNpbWFsOiAyLFxyXG4gICAgLyoqXHJcbiAgICAgKiBUaW1lIGRlbGF5IGZvciBkcmFnZ2VkIGVsZW1lbnRzLlxyXG4gICAgICovXHJcbiAgICAvLyBkcmFnRGVsYXk6IDAsXHJcbiAgICAvKipcclxuICAgICAqIFRpbWUsIGluIG1zLCB0byBhbmltYXRlIHRoZSBtb3ZlbWVudCBvZiBhIHNsaWRlciBoYW5kbGUgaWYgdXNlciBjbGlja3MvdGFwcyBvbiB0aGUgYmFyLiBOZWVkcyB0byBiZSBtYW51YWxseSBzZXQgaWYgdXBkYXRpbmcgdGhlIHRyYW5zaXRpb24gdGltZSBpbiB0aGUgU2FzcyBzZXR0aW5ncy5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIDIwMFxyXG4gICAgICovXHJcbiAgICBtb3ZlVGltZTogMjAwLC8vdXBkYXRlIHRoaXMgaWYgY2hhbmdpbmcgdGhlIHRyYW5zaXRpb24gdGltZSBpbiB0aGUgc2Fzc1xyXG4gICAgLyoqXHJcbiAgICAgKiBDbGFzcyBhcHBsaWVkIHRvIGRpc2FibGVkIHNsaWRlcnMuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnZGlzYWJsZWQnXHJcbiAgICAgKi9cclxuICAgIGRpc2FibGVkQ2xhc3M6ICdkaXNhYmxlZCdcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIEluaXRpbGl6ZXMgdGhlIHBsdWdpbiBieSByZWFkaW5nL3NldHRpbmcgYXR0cmlidXRlcywgY3JlYXRpbmcgY29sbGVjdGlvbnMgYW5kIHNldHRpbmcgdGhlIGluaXRpYWwgcG9zaXRpb24gb2YgdGhlIGhhbmRsZShzKS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIFNsaWRlci5wcm90b3R5cGUuX2luaXQgPSBmdW5jdGlvbigpe1xyXG4gICAgdGhpcy5pbnB1dHMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ2lucHV0Jyk7XHJcbiAgICB0aGlzLmhhbmRsZXMgPSB0aGlzLiRlbGVtZW50LmZpbmQoJ1tkYXRhLXNsaWRlci1oYW5kbGVdJyk7XHJcblxyXG4gICAgdGhpcy4kaGFuZGxlID0gdGhpcy5oYW5kbGVzLmVxKDApO1xyXG4gICAgdGhpcy4kaW5wdXQgPSB0aGlzLmlucHV0cy5sZW5ndGggPyB0aGlzLmlucHV0cy5lcSgwKSA6ICQoJyMnICsgdGhpcy4kaGFuZGxlLmF0dHIoJ2FyaWEtY29udHJvbHMnKSk7XHJcbiAgICB0aGlzLiRmaWxsID0gdGhpcy4kZWxlbWVudC5maW5kKCdbZGF0YS1zbGlkZXItZmlsbF0nKS5jc3ModGhpcy5vcHRpb25zLnZlcnRpY2FsID8gJ2hlaWdodCcgOiAnd2lkdGgnLCAwKTtcclxuXHJcbiAgICB2YXIgaXNEYmwgPSBmYWxzZSxcclxuICAgICAgICBfdGhpcyA9IHRoaXM7XHJcbiAgICBpZih0aGlzLm9wdGlvbnMuZGlzYWJsZWQgfHwgdGhpcy4kZWxlbWVudC5oYXNDbGFzcyh0aGlzLm9wdGlvbnMuZGlzYWJsZWRDbGFzcykpe1xyXG4gICAgICB0aGlzLm9wdGlvbnMuZGlzYWJsZWQgPSB0cnVlO1xyXG4gICAgICB0aGlzLiRlbGVtZW50LmFkZENsYXNzKHRoaXMub3B0aW9ucy5kaXNhYmxlZENsYXNzKTtcclxuICAgIH1cclxuICAgIGlmKCF0aGlzLmlucHV0cy5sZW5ndGgpe1xyXG4gICAgICB0aGlzLmlucHV0cyA9ICQoKS5hZGQodGhpcy4kaW5wdXQpO1xyXG4gICAgICB0aGlzLm9wdGlvbnMuYmluZGluZyA9IHRydWU7XHJcbiAgICB9XHJcbiAgICB0aGlzLl9zZXRJbml0QXR0cigwKTtcclxuICAgIHRoaXMuX2V2ZW50cyh0aGlzLiRoYW5kbGUpO1xyXG5cclxuICAgIGlmKHRoaXMuaGFuZGxlc1sxXSl7XHJcbiAgICAgIHRoaXMub3B0aW9ucy5kb3VibGVTaWRlZCA9IHRydWU7XHJcbiAgICAgIHRoaXMuJGhhbmRsZTIgPSB0aGlzLmhhbmRsZXMuZXEoMSk7XHJcbiAgICAgIHRoaXMuJGlucHV0MiA9IHRoaXMuaW5wdXRzLmxlbmd0aCA/IHRoaXMuaW5wdXRzLmVxKDEpIDogJCgnIycgKyB0aGlzLiRoYW5kbGUyLmF0dHIoJ2FyaWEtY29udHJvbHMnKSk7XHJcblxyXG4gICAgICBpZighdGhpcy5pbnB1dHNbMV0pe1xyXG4gICAgICAgIHRoaXMuaW5wdXRzID0gdGhpcy5pbnB1dHMuYWRkKHRoaXMuJGlucHV0Mik7XHJcbiAgICAgIH1cclxuICAgICAgaXNEYmwgPSB0cnVlO1xyXG5cclxuICAgICAgdGhpcy5fc2V0SGFuZGxlUG9zKHRoaXMuJGhhbmRsZSwgdGhpcy5vcHRpb25zLmluaXRpYWxTdGFydCwgdHJ1ZSwgZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgX3RoaXMuX3NldEhhbmRsZVBvcyhfdGhpcy4kaGFuZGxlMiwgX3RoaXMub3B0aW9ucy5pbml0aWFsRW5kKTtcclxuICAgICAgfSk7XHJcbiAgICAgIC8vIHRoaXMuJGhhbmRsZS50cmlnZ2VySGFuZGxlcignY2xpY2suemYuc2xpZGVyJyk7XHJcbiAgICAgIHRoaXMuX3NldEluaXRBdHRyKDEpO1xyXG4gICAgICB0aGlzLl9ldmVudHModGhpcy4kaGFuZGxlMik7XHJcbiAgICB9XHJcblxyXG4gICAgaWYoIWlzRGJsKXtcclxuICAgICAgdGhpcy5fc2V0SGFuZGxlUG9zKHRoaXMuJGhhbmRsZSwgdGhpcy5vcHRpb25zLmluaXRpYWxTdGFydCwgdHJ1ZSk7XHJcbiAgICB9XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBTZXRzIHRoZSBwb3NpdGlvbiBvZiB0aGUgc2VsZWN0ZWQgaGFuZGxlIGFuZCBmaWxsIGJhci5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkaG5kbCAtIHRoZSBzZWxlY3RlZCBoYW5kbGUgdG8gbW92ZS5cclxuICAgKiBAcGFyYW0ge051bWJlcn0gbG9jYXRpb24gLSBmbG9hdGluZyBwb2ludCBiZXR3ZWVuIHRoZSBzdGFydCBhbmQgZW5kIHZhbHVlcyBvZiB0aGUgc2xpZGVyIGJhci5cclxuICAgKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYiAtIGNhbGxiYWNrIGZ1bmN0aW9uIHRvIGZpcmUgb24gY29tcGxldGlvbi5cclxuICAgKiBAZmlyZXMgU2xpZGVyI21vdmVkXHJcbiAgICovXHJcbiAgU2xpZGVyLnByb3RvdHlwZS5fc2V0SGFuZGxlUG9zID0gZnVuY3Rpb24oJGhuZGwsIGxvY2F0aW9uLCBub0ludmVydCwgY2Ipe1xyXG4gIC8vbWlnaHQgbmVlZCB0byBhbHRlciB0aGF0IHNsaWdodGx5IGZvciBiYXJzIHRoYXQgd2lsbCBoYXZlIG9kZCBudW1iZXIgc2VsZWN0aW9ucy5cclxuICAgIGxvY2F0aW9uID0gcGFyc2VGbG9hdChsb2NhdGlvbik7Ly9vbiBpbnB1dCBjaGFuZ2UgZXZlbnRzLCBjb252ZXJ0IHN0cmluZyB0byBudW1iZXIuLi5ncnVtYmxlLlxyXG4gICAgLy8gcHJldmVudCBzbGlkZXIgZnJvbSBydW5uaW5nIG91dCBvZiBib3VuZHNcclxuICAgIGlmKGxvY2F0aW9uIDwgdGhpcy5vcHRpb25zLnN0YXJ0KXsgbG9jYXRpb24gPSB0aGlzLm9wdGlvbnMuc3RhcnQ7IH1cclxuICAgIGVsc2UgaWYobG9jYXRpb24gPiB0aGlzLm9wdGlvbnMuZW5kKXsgbG9jYXRpb24gPSB0aGlzLm9wdGlvbnMuZW5kOyB9XHJcblxyXG4gICAgdmFyIGlzRGJsID0gdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkLFxyXG4gICAgICAgIGNhbGxiYWNrID0gY2IgfHwgbnVsbDtcclxuXHJcbiAgICBpZihpc0RibCl7XHJcbiAgICAgIGlmKHRoaXMuaGFuZGxlcy5pbmRleCgkaG5kbCkgPT09IDApe1xyXG4gICAgICAgIHZhciBoMlZhbCA9IHBhcnNlRmxvYXQodGhpcy4kaGFuZGxlMi5hdHRyKCdhcmlhLXZhbHVlbm93JykpO1xyXG4gICAgICAgIGxvY2F0aW9uID0gbG9jYXRpb24gPj0gaDJWYWwgPyBoMlZhbCAtIHRoaXMub3B0aW9ucy5zdGVwIDogbG9jYXRpb247XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBoMVZhbCA9IHBhcnNlRmxvYXQodGhpcy4kaGFuZGxlLmF0dHIoJ2FyaWEtdmFsdWVub3cnKSk7XHJcbiAgICAgICAgbG9jYXRpb24gPSBsb2NhdGlvbiA8PSBoMVZhbCA/IGgxVmFsICsgdGhpcy5vcHRpb25zLnN0ZXAgOiBsb2NhdGlvbjtcclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmKHRoaXMub3B0aW9ucy52ZXJ0aWNhbCAmJiAhbm9JbnZlcnQpe1xyXG4gICAgICBsb2NhdGlvbiA9IHRoaXMub3B0aW9ucy5lbmQgLSBsb2NhdGlvbjtcclxuICAgIH1cclxuICAgIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgdmVydCA9IHRoaXMub3B0aW9ucy52ZXJ0aWNhbCxcclxuICAgICAgICBoT3JXID0gdmVydCA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcclxuICAgICAgICBsT3JUID0gdmVydCA/ICd0b3AnIDogJ2xlZnQnLFxyXG4gICAgICAgIGhhbGZPZkhhbmRsZSA9ICRobmRsWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpW2hPclddIC8gMixcclxuICAgICAgICBlbGVtRGltID0gdGhpcy4kZWxlbWVudFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVtoT3JXXSxcclxuICAgICAgICBwY3RPZkJhciA9IHBlcmNlbnQobG9jYXRpb24sIHRoaXMub3B0aW9ucy5lbmQpLnRvRml4ZWQoMiksXHJcbiAgICAgICAgcHhUb01vdmUgPSAoZWxlbURpbSAtIGhhbGZPZkhhbmRsZSkgKiBwY3RPZkJhcixcclxuICAgICAgICBtb3ZlbWVudCA9IChwZXJjZW50KHB4VG9Nb3ZlLCBlbGVtRGltKSAqIDEwMCkudG9GaXhlZCh0aGlzLm9wdGlvbnMuZGVjaW1hbCksXHJcbiAgICAgICAgbG9jYXRpb24gPSBsb2NhdGlvbiA+IDAgPyBwYXJzZUZsb2F0KGxvY2F0aW9uLnRvRml4ZWQodGhpcy5vcHRpb25zLmRlY2ltYWwpKSA6IDAsXHJcbiAgICAgICAgYW5pbSwgcHJvZywgc3RhcnQgPSBudWxsLCBjc3MgPSB7fTtcclxuXHJcbiAgICB0aGlzLl9zZXRWYWx1ZXMoJGhuZGwsIGxvY2F0aW9uKTtcclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMuZG91YmxlU2lkZWQpey8vdXBkYXRlIHRvIGNhbGN1bGF0ZSBiYXNlZCBvbiB2YWx1ZXMgc2V0IHRvIHJlc3BlY3RpdmUgaW5wdXRzPz9cclxuICAgICAgdmFyIGlzTGVmdEhuZGwgPSB0aGlzLmhhbmRsZXMuaW5kZXgoJGhuZGwpID09PSAwLFxyXG4gICAgICAgICAgZGltLFxyXG4gICAgICAgICAgaWR4ID0gdGhpcy5oYW5kbGVzLmluZGV4KCRobmRsKTtcclxuXHJcbiAgICAgIGlmKGlzTGVmdEhuZGwpe1xyXG4gICAgICAgIGNzc1tsT3JUXSA9IChwY3RPZkJhciA+IDAgPyBwY3RPZkJhciAqIDEwMCA6IDApICsgJyUnOy8vXHJcbiAgICAgICAgZGltID0gLypNYXRoLmFicyovKChwZXJjZW50KHRoaXMuJGhhbmRsZTIucG9zaXRpb24oKVtsT3JUXSArIGhhbGZPZkhhbmRsZSwgZWxlbURpbSkgLSBwYXJzZUZsb2F0KHBjdE9mQmFyKSkgKiAxMDApLnRvRml4ZWQodGhpcy5vcHRpb25zLmRlY2ltYWwpICsgJyUnO1xyXG4gICAgICAgIGNzc1snbWluLScgKyBoT3JXXSA9IGRpbTtcclxuICAgICAgICBpZihjYiAmJiB0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpeyBjYigpOyB9XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHZhciBoYW5kbGVMZWZ0ID0gcGFyc2VGbG9hdCh0aGlzLiRoYW5kbGVbMF0uc3R5bGUubGVmdCk7XHJcbiAgICAgICAgbG9jYXRpb24gPSAobG9jYXRpb24gPCAxMDAgPyBsb2NhdGlvbiA6IDEwMCkgLSAoIWlzTmFOKGhhbmRsZUxlZnQpID8gaGFuZGxlTGVmdCA6IHRoaXMub3B0aW9ucy5lbmQgLSBsb2NhdGlvbik7XHJcbiAgICAgICAgY3NzWydtaW4tJyArIGhPclddID0gbG9jYXRpb24gKyAnJSc7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0aGlzLiRlbGVtZW50Lm9uZSgnZmluaXNoZWQuemYuYW5pbWF0ZScsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgX3RoaXMuYW5pbUNvbXBsZXRlID0gdHJ1ZTtcclxuICAgICAgICAgICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICAgICAgICAgKiBGaXJlcyB3aGVuIHRoZSBoYW5kbGUgaXMgZG9uZSBtb3ZpbmcuXHJcbiAgICAgICAgICAgICAgICAgICAgICogQGV2ZW50IFNsaWRlciNtb3ZlZFxyXG4gICAgICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgICAgIF90aGlzLiRlbGVtZW50LnRyaWdnZXIoJ21vdmVkLnpmLnNsaWRlcicsIFskaG5kbF0pO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICB2YXIgbW92ZVRpbWUgPSBfdGhpcy4kZWxlbWVudC5kYXRhKCdkcmFnZ2luZycpID8gMTAwMC82MCA6IF90aGlzLm9wdGlvbnMubW92ZVRpbWU7XHJcbiAgICAvKnZhciBtb3ZlID0gbmV3ICovRm91bmRhdGlvbi5Nb3ZlKG1vdmVUaW1lLCAkaG5kbCwgZnVuY3Rpb24oKXtcclxuICAgICAgJGhuZGwuY3NzKGxPclQsIG1vdmVtZW50ICsgJyUnKTtcclxuICAgICAgaWYoIV90aGlzLm9wdGlvbnMuZG91YmxlU2lkZWQpe1xyXG4gICAgICAgIF90aGlzLiRmaWxsLmNzcyhoT3JXLCBwY3RPZkJhciAqIDEwMCArICclJyk7XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIF90aGlzLiRmaWxsLmNzcyhjc3MpO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8vIG1vdmUuZG8oKTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGluaXRpYWwgYXR0cmlidXRlIGZvciB0aGUgc2xpZGVyIGVsZW1lbnQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge051bWJlcn0gaWR4IC0gaW5kZXggb2YgdGhlIGN1cnJlbnQgaGFuZGxlL2lucHV0IHRvIHVzZS5cclxuICAgKi9cclxuICBTbGlkZXIucHJvdG90eXBlLl9zZXRJbml0QXR0ciA9IGZ1bmN0aW9uKGlkeCl7XHJcbiAgICB2YXIgaWQgPSB0aGlzLmlucHV0cy5lcShpZHgpLmF0dHIoJ2lkJykgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAnc2xpZGVyJyk7XHJcbiAgICB0aGlzLmlucHV0cy5lcShpZHgpLmF0dHIoe1xyXG4gICAgICAnaWQnOiBpZCxcclxuICAgICAgJ21heCc6IHRoaXMub3B0aW9ucy5lbmQsXHJcbiAgICAgICdtaW4nOiB0aGlzLm9wdGlvbnMuc3RhcnRcclxuXHJcbiAgICB9KTtcclxuICAgIHRoaXMuaGFuZGxlcy5lcShpZHgpLmF0dHIoe1xyXG4gICAgICAncm9sZSc6ICdzbGlkZXInLFxyXG4gICAgICAnYXJpYS1jb250cm9scyc6IGlkLFxyXG4gICAgICAnYXJpYS12YWx1ZW1heCc6IHRoaXMub3B0aW9ucy5lbmQsXHJcbiAgICAgICdhcmlhLXZhbHVlbWluJzogdGhpcy5vcHRpb25zLnN0YXJ0LFxyXG4gICAgICAnYXJpYS12YWx1ZW5vdyc6IGlkeCA9PT0gMCA/IHRoaXMub3B0aW9ucy5pbml0aWFsU3RhcnQgOiB0aGlzLm9wdGlvbnMuaW5pdGlhbEVuZCxcclxuICAgICAgJ2FyaWEtb3JpZW50YXRpb24nOiB0aGlzLm9wdGlvbnMudmVydGljYWwgPyAndmVydGljYWwnIDogJ2hvcml6b250YWwnLFxyXG4gICAgICAndGFiaW5kZXgnOiAwXHJcbiAgICB9KTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGlucHV0IGFuZCBgYXJpYS12YWx1ZW5vd2AgdmFsdWVzIGZvciB0aGUgc2xpZGVyIGVsZW1lbnQuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge2pRdWVyeX0gJGhhbmRsZSAtIHRoZSBjdXJyZW50bHkgc2VsZWN0ZWQgaGFuZGxlLlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgLSBmbG9hdGluZyBwb2ludCBvZiB0aGUgbmV3IHZhbHVlLlxyXG4gICAqL1xyXG4gIFNsaWRlci5wcm90b3R5cGUuX3NldFZhbHVlcyA9IGZ1bmN0aW9uKCRoYW5kbGUsIHZhbCl7XHJcbiAgICB2YXIgaWR4ID0gdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkID8gdGhpcy5oYW5kbGVzLmluZGV4KCRoYW5kbGUpIDogMDtcclxuICAgIHRoaXMuaW5wdXRzLmVxKGlkeCkudmFsKHZhbCk7XHJcbiAgICAkaGFuZGxlLmF0dHIoJ2FyaWEtdmFsdWVub3cnLCB2YWwpO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogSGFuZGxlcyBldmVudHMgb24gdGhlIHNsaWRlciBlbGVtZW50LlxyXG4gICAqIENhbGN1bGF0ZXMgdGhlIG5ldyBsb2NhdGlvbiBvZiB0aGUgY3VycmVudCBoYW5kbGUuXHJcbiAgICogSWYgdGhlcmUgYXJlIHR3byBoYW5kbGVzIGFuZCB0aGUgYmFyIHdhcyBjbGlja2VkLCBpdCBkZXRlcm1pbmVzIHdoaWNoIGhhbmRsZSB0byBtb3ZlLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IGUgLSB0aGUgYGV2ZW50YCBvYmplY3QgcGFzc2VkIGZyb20gdGhlIGxpc3RlbmVyLlxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkaGFuZGxlIC0gdGhlIGN1cnJlbnQgaGFuZGxlIHRvIGNhbGN1bGF0ZSBmb3IsIGlmIHNlbGVjdGVkLlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSB2YWwgLSBmbG9hdGluZyBwb2ludCBudW1iZXIgZm9yIHRoZSBuZXcgdmFsdWUgb2YgdGhlIHNsaWRlci5cclxuICAgKi9cclxuICBTbGlkZXIucHJvdG90eXBlLl9oYW5kbGVFdmVudCA9IGZ1bmN0aW9uKGUsICRoYW5kbGUsIHZhbCl7XHJcbiAgICB2YXIgdmFsdWUsIGhhc1ZhbDtcclxuICAgIGlmKCF2YWwpey8vY2xpY2sgb3IgZHJhZyBldmVudHNcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgICAgdmVydGljYWwgPSB0aGlzLm9wdGlvbnMudmVydGljYWwsXHJcbiAgICAgICAgICBwYXJhbSA9IHZlcnRpY2FsID8gJ2hlaWdodCcgOiAnd2lkdGgnLFxyXG4gICAgICAgICAgZGlyZWN0aW9uID0gdmVydGljYWwgPyAndG9wJyA6ICdsZWZ0JyxcclxuICAgICAgICAgIHBhZ2VYWSA9IHZlcnRpY2FsID8gZS5wYWdlWSA6IGUucGFnZVgsXHJcbiAgICAgICAgICBoYWxmT2ZIYW5kbGUgPSB0aGlzLiRoYW5kbGVbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbcGFyYW1dIC8gMixcclxuICAgICAgICAgIGJhckRpbSA9IHRoaXMuJGVsZW1lbnRbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClbcGFyYW1dLFxyXG4gICAgICAgICAgYmFyT2Zmc2V0ID0gKHRoaXMuJGVsZW1lbnQub2Zmc2V0KClbZGlyZWN0aW9uXSAtICBwYWdlWFkpLFxyXG4gICAgICAgICAgYmFyWFkgPSBiYXJPZmZzZXQgPiAwID8gLWhhbGZPZkhhbmRsZSA6IChiYXJPZmZzZXQgLSBoYWxmT2ZIYW5kbGUpIDwgLWJhckRpbSA/IGJhckRpbSA6IE1hdGguYWJzKGJhck9mZnNldCksLy9pZiB0aGUgY3Vyc29yIHBvc2l0aW9uIGlzIGxlc3MgdGhhbiBvciBncmVhdGVyIHRoYW4gdGhlIGVsZW1lbnRzIGJvdW5kaW5nIGNvb3JkaW5hdGVzLCBzZXQgY29vcmRpbmF0ZXMgd2l0aGluIHRob3NlIGJvdW5kc1xyXG4gICAgICAgICAgLy8gZWxlRGltID0gdGhpcy4kZWxlbWVudFswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKVtwYXJhbV0sXHJcbiAgICAgICAgICBvZmZzZXRQY3QgPSBwZXJjZW50KGJhclhZLCBiYXJEaW0pO1xyXG4gICAgICB2YWx1ZSA9ICh0aGlzLm9wdGlvbnMuZW5kIC0gdGhpcy5vcHRpb25zLnN0YXJ0KSAqIG9mZnNldFBjdDtcclxuICAgICAgaGFzVmFsID0gZmFsc2U7XHJcblxyXG4gICAgICBpZighJGhhbmRsZSl7Ly9maWd1cmUgb3V0IHdoaWNoIGhhbmRsZSBpdCBpcywgcGFzcyBpdCB0byB0aGUgbmV4dCBmdW5jdGlvbi5cclxuICAgICAgICB2YXIgZmlyc3RIbmRsUG9zID0gYWJzUG9zaXRpb24odGhpcy4kaGFuZGxlLCBkaXJlY3Rpb24sIGJhclhZLCBwYXJhbSksXHJcbiAgICAgICAgICAgIHNlY25kSG5kbFBvcyA9IGFic1Bvc2l0aW9uKHRoaXMuJGhhbmRsZTIsIGRpcmVjdGlvbiwgYmFyWFksIHBhcmFtKTtcclxuICAgICAgICAgICAgJGhhbmRsZSA9IGZpcnN0SG5kbFBvcyA8PSBzZWNuZEhuZGxQb3MgPyB0aGlzLiRoYW5kbGUgOiB0aGlzLiRoYW5kbGUyO1xyXG4gICAgICB9XHJcblxyXG4gICAgfWVsc2V7Ly9jaGFuZ2UgZXZlbnQgb24gaW5wdXRcclxuICAgICAgdmFsdWUgPSB2YWw7XHJcbiAgICAgIGhhc1ZhbCA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fc2V0SGFuZGxlUG9zKCRoYW5kbGUsIHZhbHVlLCBoYXNWYWwpO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogQWRkcyBldmVudCBsaXN0ZW5lcnMgdG8gdGhlIHNsaWRlciBlbGVtZW50cy5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSAkaGFuZGxlIC0gdGhlIGN1cnJlbnQgaGFuZGxlIHRvIGFwcGx5IGxpc3RlbmVycyB0by5cclxuICAgKi9cclxuICBTbGlkZXIucHJvdG90eXBlLl9ldmVudHMgPSBmdW5jdGlvbigkaGFuZGxlKXtcclxuICAgIGlmKHRoaXMub3B0aW9ucy5kaXNhYmxlZCl7IHJldHVybiBmYWxzZTsgfVxyXG5cclxuICAgIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgY3VySGFuZGxlLFxyXG4gICAgICAgIHRpbWVyO1xyXG5cclxuICAgICAgdGhpcy5pbnB1dHMub2ZmKCdjaGFuZ2UuemYuc2xpZGVyJykub24oJ2NoYW5nZS56Zi5zbGlkZXInLCBmdW5jdGlvbihlKXtcclxuICAgICAgICB2YXIgaWR4ID0gX3RoaXMuaW5wdXRzLmluZGV4KCQodGhpcykpO1xyXG4gICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlLCBfdGhpcy5oYW5kbGVzLmVxKGlkeCksICQodGhpcykudmFsKCkpO1xyXG4gICAgICB9KTtcclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMuY2xpY2tTZWxlY3Qpe1xyXG4gICAgICB0aGlzLiRlbGVtZW50Lm9mZignY2xpY2suemYuc2xpZGVyJykub24oJ2NsaWNrLnpmLnNsaWRlcicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIGlmKF90aGlzLiRlbGVtZW50LmRhdGEoJ2RyYWdnaW5nJykpeyByZXR1cm4gZmFsc2U7IH1cclxuICAgICAgICBfdGhpcy5hbmltQ29tcGxldGUgPSBmYWxzZTtcclxuICAgICAgICBpZihfdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkKXtcclxuICAgICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlKTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlLCBfdGhpcy4kaGFuZGxlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKHRoaXMub3B0aW9ucy5kcmFnZ2FibGUpe1xyXG4gICAgICB0aGlzLmhhbmRsZXMuYWRkVG91Y2goKTtcclxuICAgICAgLy8gdmFyIGN1ckhhbmRsZSxcclxuICAgICAgLy8gICAgIHRpbWVyLFxyXG4gICAgICB2YXIgJGJvZHkgPSAkKCdib2R5Jyk7XHJcbiAgICAgICRoYW5kbGVcclxuICAgICAgICAub2ZmKCdtb3VzZWRvd24uemYuc2xpZGVyJylcclxuICAgICAgICAub24oJ21vdXNlZG93bi56Zi5zbGlkZXInLCBmdW5jdGlvbihlKXtcclxuICAgICAgICAgICRoYW5kbGUuYWRkQ2xhc3MoJ2lzLWRyYWdnaW5nJyk7XHJcbiAgICAgICAgICBfdGhpcy4kZmlsbC5hZGRDbGFzcygnaXMtZHJhZ2dpbmcnKTsvL1xyXG4gICAgICAgICAgX3RoaXMuJGVsZW1lbnQuZGF0YSgnZHJhZ2dpbmcnLCB0cnVlKTtcclxuICAgICAgICAgIF90aGlzLmFuaW1Db21wbGV0ZSA9IGZhbHNlO1xyXG4gICAgICAgICAgY3VySGFuZGxlID0gJChlLmN1cnJlbnRUYXJnZXQpO1xyXG5cclxuICAgICAgICAgICRib2R5Lm9uKCdtb3VzZW1vdmUuemYuc2xpZGVyJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBfdGhpcy5faGFuZGxlRXZlbnQoZSwgY3VySGFuZGxlKTtcclxuICAgICAgICAgICAgLy8gfSwgX3RoaXMub3B0aW9ucy5kcmFnRGVsYXkpO1xyXG4gICAgICAgICAgfSkub24oJ21vdXNldXAuemYuc2xpZGVyJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICAgIC8vIGNsZWFyVGltZW91dCh0aW1lcik7XHJcbiAgICAgICAgICAgIF90aGlzLmFuaW1Db21wbGV0ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIF90aGlzLl9oYW5kbGVFdmVudChlLCBjdXJIYW5kbGUpO1xyXG4gICAgICAgICAgICAkaGFuZGxlLnJlbW92ZUNsYXNzKCdpcy1kcmFnZ2luZycpO1xyXG4gICAgICAgICAgICBfdGhpcy4kZmlsbC5yZW1vdmVDbGFzcygnaXMtZHJhZ2dpbmcnKTtcclxuICAgICAgICAgICAgX3RoaXMuJGVsZW1lbnQuZGF0YSgnZHJhZ2dpbmcnLCBmYWxzZSk7XHJcbiAgICAgICAgICAgIC8vIEZvdW5kYXRpb24ucmVmbG93KF90aGlzLiRlbGVtZW50LCAnc2xpZGVyJyk7XHJcbiAgICAgICAgICAgICRib2R5Lm9mZignbW91c2Vtb3ZlLnpmLnNsaWRlciBtb3VzZXVwLnpmLnNsaWRlcicpO1xyXG4gICAgICAgICAgfSk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgJGhhbmRsZS5vZmYoJ2tleWRvd24uemYuc2xpZGVyJykub24oJ2tleWRvd24uemYuc2xpZGVyJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgIHZhciBpZHggPSBfdGhpcy5vcHRpb25zLmRvdWJsZVNpZGVkID8gX3RoaXMuaGFuZGxlcy5pbmRleCgkKHRoaXMpKSA6IDAsXHJcbiAgICAgICAgb2xkVmFsdWUgPSBwYXJzZUZsb2F0KF90aGlzLmlucHV0cy5lcShpZHgpLnZhbCgpKSxcclxuICAgICAgICBuZXdWYWx1ZTtcclxuXHJcbiAgICAgIHZhciBfJGhhbmRsZSA9ICQodGhpcyk7XHJcblxyXG4gICAgICAvLyBoYW5kbGUga2V5Ym9hcmQgZXZlbnQgd2l0aCBrZXlib2FyZCB1dGlsXHJcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsIF90aGlzLCB7XHJcbiAgICAgICAgZGVjcmVhc2U6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgbmV3VmFsdWUgPSBvbGRWYWx1ZSAtIF90aGlzLm9wdGlvbnMuc3RlcDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGluY3JlYXNlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIG5ld1ZhbHVlID0gb2xkVmFsdWUgKyBfdGhpcy5vcHRpb25zLnN0ZXA7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBkZWNyZWFzZV9mYXN0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIG5ld1ZhbHVlID0gb2xkVmFsdWUgLSBfdGhpcy5vcHRpb25zLnN0ZXAgKiAxMDtcclxuICAgICAgICB9LFxyXG4gICAgICAgIGluY3JlYXNlX2Zhc3Q6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgbmV3VmFsdWUgPSBvbGRWYWx1ZSArIF90aGlzLm9wdGlvbnMuc3RlcCAqIDEwO1xyXG4gICAgICAgIH0sXHJcbiAgICAgICAgaGFuZGxlZDogZnVuY3Rpb24oKSB7IC8vIG9ubHkgc2V0IGhhbmRsZSBwb3Mgd2hlbiBldmVudCB3YXMgaGFuZGxlZCBzcGVjaWFsbHlcclxuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgIF90aGlzLl9zZXRIYW5kbGVQb3MoXyRoYW5kbGUsIG5ld1ZhbHVlLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgICAvKmlmIChuZXdWYWx1ZSkgeyAvLyBpZiBwcmVzc2VkIGtleSBoYXMgc3BlY2lhbCBmdW5jdGlvbiwgdXBkYXRlIHZhbHVlXHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIF90aGlzLl9zZXRIYW5kbGVQb3MoXyRoYW5kbGUsIG5ld1ZhbHVlKTtcclxuICAgICAgfSovXHJcbiAgICB9KTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIHRoZSBzbGlkZXIgcGx1Z2luLlxyXG4gICAqL1xyXG4gICBTbGlkZXIucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xyXG4gICAgIHRoaXMuaGFuZGxlcy5vZmYoJy56Zi5zbGlkZXInKTtcclxuICAgICB0aGlzLmlucHV0cy5vZmYoJy56Zi5zbGlkZXInKTtcclxuICAgICB0aGlzLiRlbGVtZW50Lm9mZignLnpmLnNsaWRlcicpO1xyXG5cclxuICAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgIH07XHJcblxyXG4gIEZvdW5kYXRpb24ucGx1Z2luKFNsaWRlciwgJ1NsaWRlcicpO1xyXG5cclxuICBmdW5jdGlvbiBwZXJjZW50KGZyYWMsIG51bSl7XHJcbiAgICByZXR1cm4gKGZyYWMgLyBudW0pO1xyXG4gIH1cclxuICBmdW5jdGlvbiBhYnNQb3NpdGlvbigkaGFuZGxlLCBkaXIsIGNsaWNrUG9zLCBwYXJhbSl7XHJcbiAgICByZXR1cm4gTWF0aC5hYnMoKCRoYW5kbGUucG9zaXRpb24oKVtkaXJdICsgKCRoYW5kbGVbcGFyYW1dKCkgLyAyKSkgLSBjbGlja1Bvcyk7XHJcbiAgfVxyXG59KGpRdWVyeSwgd2luZG93LkZvdW5kYXRpb24pO1xyXG5cclxuLy8qKioqKioqKip0aGlzIGlzIGluIGNhc2Ugd2UgZ28gdG8gc3RhdGljLCBhYnNvbHV0ZSBwb3NpdGlvbnMgaW5zdGVhZCBvZiBkeW5hbWljIHBvc2l0aW9uaW5nKioqKioqKipcclxuLy8gdGhpcy5zZXRTdGVwcyhmdW5jdGlvbigpe1xyXG4vLyAgIF90aGlzLl9ldmVudHMoKTtcclxuLy8gICB2YXIgaW5pdFN0YXJ0ID0gX3RoaXMub3B0aW9ucy5wb3NpdGlvbnNbX3RoaXMub3B0aW9ucy5pbml0aWFsU3RhcnQgLSAxXSB8fCBudWxsO1xyXG4vLyAgIHZhciBpbml0RW5kID0gX3RoaXMub3B0aW9ucy5pbml0aWFsRW5kID8gX3RoaXMub3B0aW9ucy5wb3NpdGlvbltfdGhpcy5vcHRpb25zLmluaXRpYWxFbmQgLSAxXSA6IG51bGw7XHJcbi8vICAgaWYoaW5pdFN0YXJ0IHx8IGluaXRFbmQpe1xyXG4vLyAgICAgX3RoaXMuX2hhbmRsZUV2ZW50KGluaXRTdGFydCwgaW5pdEVuZCk7XHJcbi8vICAgfVxyXG4vLyB9KTtcclxuXHJcbi8vKioqKioqKioqKip0aGUgb3RoZXIgcGFydCBvZiBhYnNvbHV0ZSBwb3NpdGlvbnMqKioqKioqKioqKioqXHJcbi8vIFNsaWRlci5wcm90b3R5cGUuc2V0U3RlcHMgPSBmdW5jdGlvbihjYil7XHJcbi8vICAgdmFyIHBvc0NoYW5nZSA9IHRoaXMuJGVsZW1lbnQub3V0ZXJXaWR0aCgpIC8gdGhpcy5vcHRpb25zLnN0ZXBzO1xyXG4vLyAgIHZhciBjb3VudGVyID0gMFxyXG4vLyAgIHdoaWxlKGNvdW50ZXIgPCB0aGlzLm9wdGlvbnMuc3RlcHMpe1xyXG4vLyAgICAgaWYoY291bnRlcil7XHJcbi8vICAgICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbnMucHVzaCh0aGlzLm9wdGlvbnMucG9zaXRpb25zW2NvdW50ZXIgLSAxXSArIHBvc0NoYW5nZSk7XHJcbi8vICAgICB9ZWxzZXtcclxuLy8gICAgICAgdGhpcy5vcHRpb25zLnBvc2l0aW9ucy5wdXNoKHBvc0NoYW5nZSk7XHJcbi8vICAgICB9XHJcbi8vICAgICBjb3VudGVyKys7XHJcbi8vICAgfVxyXG4vLyAgIGNiKCk7XHJcbi8vIH07XHJcbiIsIi8qKlxyXG4gKiBTdGlja3kgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24uc3RpY2t5XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5tZWRpYVF1ZXJ5XHJcbiAqL1xyXG4hZnVuY3Rpb24oJCwgRm91bmRhdGlvbil7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgc3RpY2t5IHRoaW5nLlxyXG4gICAqIEBjbGFzc1xyXG4gICAqIEBwYXJhbSB7alF1ZXJ5fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBtYWtlIHN0aWNreS5cclxuICAgKiBAcGFyYW0ge09iamVjdH0gb3B0aW9ucyAtIG9wdGlvbnMgb2JqZWN0IHBhc3NlZCB3aGVuIGNyZWF0aW5nIHRoZSBlbGVtZW50IHByb2dyYW1tYXRpY2FsbHkuXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gU3RpY2t5KGVsZW1lbnQsIG9wdGlvbnMpe1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgU3RpY2t5LmRlZmF1bHRzLCB0aGlzLiRlbGVtZW50LmRhdGEoKSwgb3B0aW9ucyk7XHJcblxyXG4gICAgdGhpcy5faW5pdCgpO1xyXG5cclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfVxyXG4gIFN0aWNreS5kZWZhdWx0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogQ3VzdG9taXphYmxlIGNvbnRhaW5lciB0ZW1wbGF0ZS4gQWRkIHlvdXIgb3duIGNsYXNzZXMgZm9yIHN0eWxpbmcgYW5kIHNpemluZy5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICc8ZGl2IGRhdGEtc3RpY2t5LWNvbnRhaW5lciBjbGFzcz1cInNtYWxsLTYgY29sdW1uc1wiPjwvZGl2PidcclxuICAgICAqL1xyXG4gICAgY29udGFpbmVyOiAnPGRpdiBkYXRhLXN0aWNreS1jb250YWluZXI+PC9kaXY+JyxcclxuICAgIC8qKlxyXG4gICAgICogTG9jYXRpb24gaW4gdGhlIHZpZXcgdGhlIGVsZW1lbnQgc3RpY2tzIHRvLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgJ3RvcCdcclxuICAgICAqL1xyXG4gICAgc3RpY2tUbzogJ3RvcCcsXHJcbiAgICAvKipcclxuICAgICAqIElmIGFuY2hvcmVkIHRvIGEgc2luZ2xlIGVsZW1lbnQsIHRoZSBpZCBvZiB0aGF0IGVsZW1lbnQuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnZXhhbXBsZUlkJ1xyXG4gICAgICovXHJcbiAgICBhbmNob3I6ICcnLFxyXG4gICAgLyoqXHJcbiAgICAgKiBJZiB1c2luZyBtb3JlIHRoYW4gb25lIGVsZW1lbnQgYXMgYW5jaG9yIHBvaW50cywgdGhlIGlkIG9mIHRoZSB0b3AgYW5jaG9yLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgJ2V4YW1wbGVJZDp0b3AnXHJcbiAgICAgKi9cclxuICAgIHRvcEFuY2hvcjogJycsXHJcbiAgICAvKipcclxuICAgICAqIElmIHVzaW5nIG1vcmUgdGhhbiBvbmUgZWxlbWVudCBhcyBhbmNob3IgcG9pbnRzLCB0aGUgaWQgb2YgdGhlIGJvdHRvbSBhbmNob3IuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnZXhhbXBsZUlkOmJvdHRvbSdcclxuICAgICAqL1xyXG4gICAgYnRtQW5jaG9yOiAnJyxcclxuICAgIC8qKlxyXG4gICAgICogTWFyZ2luLCBpbiBgZW1gJ3MgdG8gYXBwbHkgdG8gdGhlIHRvcCBvZiB0aGUgZWxlbWVudCB3aGVuIGl0IGJlY29tZXMgc3RpY2t5LlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgMVxyXG4gICAgICovXHJcbiAgICBtYXJnaW5Ub3A6IDEsXHJcbiAgICAvKipcclxuICAgICAqIE1hcmdpbiwgaW4gYGVtYCdzIHRvIGFwcGx5IHRvIHRoZSBib3R0b20gb2YgdGhlIGVsZW1lbnQgd2hlbiBpdCBiZWNvbWVzIHN0aWNreS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIDFcclxuICAgICAqL1xyXG4gICAgbWFyZ2luQm90dG9tOiAxLFxyXG4gICAgLyoqXHJcbiAgICAgKiBCcmVha3BvaW50IHN0cmluZyB0aGF0IGlzIHRoZSBtaW5pbXVtIHNjcmVlbiBzaXplIGFuIGVsZW1lbnQgc2hvdWxkIGJlY29tZSBzdGlja3kuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnbWVkaXVtJ1xyXG4gICAgICovXHJcbiAgICBzdGlja3lPbjogJ21lZGl1bScsXHJcbiAgICAvKipcclxuICAgICAqIENsYXNzIGFwcGxpZWQgdG8gc3RpY2t5IGVsZW1lbnQsIGFuZCByZW1vdmVkIG9uIGRlc3RydWN0aW9uLiBGb3VuZGF0aW9uIGRlZmF1bHRzIHRvIGBzdGlja3lgLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgJ3N0aWNreSdcclxuICAgICAqL1xyXG4gICAgc3RpY2t5Q2xhc3M6ICdzdGlja3knLFxyXG4gICAgLyoqXHJcbiAgICAgKiBDbGFzcyBhcHBsaWVkIHRvIHN0aWNreSBjb250YWluZXIuIEZvdW5kYXRpb24gZGVmYXVsdHMgdG8gYHN0aWNreS1jb250YWluZXJgLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgJ3N0aWNreS1jb250YWluZXInXHJcbiAgICAgKi9cclxuICAgIGNvbnRhaW5lckNsYXNzOiAnc3RpY2t5LWNvbnRhaW5lcicsXHJcbiAgICAvKipcclxuICAgICAqIE51bWJlciBvZiBzY3JvbGwgZXZlbnRzIGJldHdlZW4gdGhlIHBsdWdpbidzIHJlY2FsY3VsYXRpbmcgc3RpY2t5IHBvaW50cy4gU2V0dGluZyBpdCB0byBgMGAgd2lsbCBjYXVzZSBpdCB0byByZWNhbGMgZXZlcnkgc2Nyb2xsIGV2ZW50LCBzZXR0aW5nIGl0IHRvIGAtMWAgd2lsbCBwcmV2ZW50IHJlY2FsYyBvbiBzY3JvbGwuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSA1MFxyXG4gICAgICovXHJcbiAgICBjaGVja0V2ZXJ5OiAtMVxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSBzdGlja3kgZWxlbWVudCBieSBhZGRpbmcgY2xhc3NlcywgZ2V0dGluZy9zZXR0aW5nIGRpbWVuc2lvbnMsIGJyZWFrcG9pbnRzIGFuZCBhdHRyaWJ1dGVzXHJcbiAgICogQWxzbyB0cmlnZ2VyZWQgYnkgRm91bmRhdGlvbi5fcmVmbG93XHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBTdGlja3kucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciAkcGFyZW50ID0gdGhpcy4kZWxlbWVudC5wYXJlbnQoJ1tkYXRhLXN0aWNreS1jb250YWluZXJdJyksXHJcbiAgICAgICAgaWQgPSB0aGlzLiRlbGVtZW50WzBdLmlkIHx8IEZvdW5kYXRpb24uR2V0WW9EaWdpdHMoNiwgJ3N0aWNreScpLFxyXG4gICAgICAgIF90aGlzID0gdGhpcztcclxuXHJcbiAgICBpZighJHBhcmVudC5sZW5ndGgpe1xyXG4gICAgICB0aGlzLndhc1dyYXBwZWQgPSB0cnVlO1xyXG4gICAgfVxyXG4gICAgdGhpcy4kY29udGFpbmVyID0gJHBhcmVudC5sZW5ndGggPyAkcGFyZW50IDogJCh0aGlzLm9wdGlvbnMuY29udGFpbmVyKS53cmFwSW5uZXIodGhpcy4kZWxlbWVudCk7XHJcbiAgICB0aGlzLiRjb250YWluZXIuYWRkQ2xhc3ModGhpcy5vcHRpb25zLmNvbnRhaW5lckNsYXNzKTtcclxuXHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5hZGRDbGFzcyh0aGlzLm9wdGlvbnMuc3RpY2t5Q2xhc3MpXHJcbiAgICAgICAgICAgICAgICAgLmF0dHIoeydkYXRhLXJlc2l6ZSc6IGlkfSk7XHJcblxyXG4gICAgdGhpcy5zY3JvbGxDb3VudCA9IHRoaXMub3B0aW9ucy5jaGVja0V2ZXJ5O1xyXG4gICAgdGhpcy5pc1N0dWNrID0gZmFsc2U7XHJcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLm9wdGlvbnMuYW5jaG9yLCB0aGlzLm9wdGlvbnMudG9wQW5jaG9yKTtcclxuICAgIGlmKHRoaXMub3B0aW9ucy50b3BBbmNob3IgIT09ICcnKXtcclxuICAgICAgdGhpcy5fcGFyc2VQb2ludHMoKTtcclxuICAgICAgLy8gY29uc29sZS5sb2codGhpcy5wb2ludHNbMF0pO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuJGFuY2hvciA9IHRoaXMub3B0aW9ucy5hbmNob3IgPyAkKCcjJyArIHRoaXMub3B0aW9ucy5hbmNob3IpIDogJChkb2N1bWVudC5ib2R5KTtcclxuICAgIH1cclxuXHJcblxyXG4gICAgdGhpcy5fc2V0U2l6ZXMoZnVuY3Rpb24oKXtcclxuICAgICAgX3RoaXMuX2NhbGMoZmFsc2UpO1xyXG4gICAgfSk7XHJcbiAgICB0aGlzLl9ldmVudHMoaWQuc3BsaXQoJy0nKS5yZXZlcnNlKCkuam9pbignLScpKTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIElmIHVzaW5nIG11bHRpcGxlIGVsZW1lbnRzIGFzIGFuY2hvcnMsIGNhbGN1bGF0ZXMgdGhlIHRvcCBhbmQgYm90dG9tIHBpeGVsIHZhbHVlcyB0aGUgc3RpY2t5IHRoaW5nIHNob3VsZCBzdGljayBhbmQgdW5zdGljayBvbi5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIFN0aWNreS5wcm90b3R5cGUuX3BhcnNlUG9pbnRzID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciB0b3AgPSB0aGlzLm9wdGlvbnMudG9wQW5jaG9yLFxyXG4gICAgICAgIGJ0bSA9IHRoaXMub3B0aW9ucy5idG1BbmNob3IsXHJcbiAgICAgICAgcHRzID0gW3RvcCwgYnRtXSxcclxuICAgICAgICBicmVha3MgPSB7fTtcclxuICAgIGZvcih2YXIgaSA9IDAsIGxlbiA9IHB0cy5sZW5ndGg7IGkgPCBsZW4gJiYgcHRzW2ldOyBpKyspe1xyXG4gICAgICB2YXIgcHQ7XHJcbiAgICAgIGlmKHR5cGVvZiBwdHNbaV0gPT09ICdudW1iZXInKXtcclxuICAgICAgICBwdCA9IHB0c1tpXTtcclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgdmFyIHBsYWNlID0gcHRzW2ldLnNwbGl0KCc6JyksXHJcbiAgICAgICAgICAgIGFuY2hvciA9ICQoJyMnICsgcGxhY2VbMF0pO1xyXG5cclxuICAgICAgICBwdCA9IGFuY2hvci5vZmZzZXQoKS50b3A7XHJcbiAgICAgICAgaWYocGxhY2VbMV0gJiYgcGxhY2VbMV0udG9Mb3dlckNhc2UoKSA9PT0gJ2JvdHRvbScpe1xyXG4gICAgICAgICAgcHQgKz0gYW5jaG9yWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgICAgYnJlYWtzW2ldID0gcHQ7XHJcbiAgICB9XHJcbiAgICAgIC8vIGNvbnNvbGUubG9nKGJyZWFrcyk7XHJcbiAgICB0aGlzLnBvaW50cyA9IGJyZWFrcztcclxuICAgIHJldHVybjtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGV2ZW50IGhhbmRsZXJzIGZvciB0aGUgc2Nyb2xsaW5nIGVsZW1lbnQuXHJcbiAgICogQHByaXZhdGVcclxuICAgKiBAcGFyYW0ge1N0cmluZ30gaWQgLSBwc3VlZG8tcmFuZG9tIGlkIGZvciB1bmlxdWUgc2Nyb2xsIGV2ZW50IGxpc3RlbmVyLlxyXG4gICAqL1xyXG4gIFN0aWNreS5wcm90b3R5cGUuX2V2ZW50cyA9IGZ1bmN0aW9uKGlkKXtcclxuICAgIC8vIGNvbnNvbGUubG9nKCdjYWxsZWQnKTtcclxuICAgIHZhciBfdGhpcyA9IHRoaXMsXHJcbiAgICAgICAgc2Nyb2xsTGlzdGVuZXIgPSAnc2Nyb2xsLnpmLicgKyBpZDtcclxuICAgIGlmKHRoaXMuaXNPbil7IHJldHVybjsgfVxyXG4gICAgaWYodGhpcy5jYW5TdGljayl7XHJcbiAgICAgIHRoaXMuaXNPbiA9IHRydWU7XHJcbiAgICAgIC8vIHRoaXMuJGFuY2hvci5vZmYoJ2NoYW5nZS56Zi5zdGlja3knKVxyXG4gICAgICAvLyAgICAgICAgICAgICAub24oJ2NoYW5nZS56Zi5zdGlja3knLCBmdW5jdGlvbigpe1xyXG4gICAgICAvLyAgICAgICAgICAgICAgIF90aGlzLl9zZXRTaXplcyhmdW5jdGlvbigpe1xyXG4gICAgICAvLyAgICAgICAgICAgICAgICAgX3RoaXMuX2NhbGMoZmFsc2UpO1xyXG4gICAgICAvLyAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAvLyAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICQod2luZG93KS5vZmYoc2Nyb2xsTGlzdGVuZXIpXHJcbiAgICAgICAgICAgICAgIC5vbihzY3JvbGxMaXN0ZW5lciwgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICAgICAgICAgaWYoX3RoaXMuc2Nyb2xsQ291bnQgPT09IDApe1xyXG4gICAgICAgICAgICAgICAgICAgX3RoaXMuc2Nyb2xsQ291bnQgPSBfdGhpcy5vcHRpb25zLmNoZWNrRXZlcnk7XHJcbiAgICAgICAgICAgICAgICAgICBfdGhpcy5fc2V0U2l6ZXMoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2NhbGMoZmFsc2UsIHdpbmRvdy5wYWdlWU9mZnNldCk7XHJcbiAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgICAgICAgICAgIF90aGlzLnNjcm9sbENvdW50LS07XHJcbiAgICAgICAgICAgICAgICAgICBfdGhpcy5fY2FsYyhmYWxzZSwgd2luZG93LnBhZ2VZT2Zmc2V0KTtcclxuICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKVxyXG4gICAgICAgICAgICAgICAgIC5vbigncmVzaXplbWUuemYudHJpZ2dlcicsIGZ1bmN0aW9uKGUsIGVsKXtcclxuICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX3NldFNpemVzKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2NhbGMoZmFsc2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIGlmKF90aGlzLmNhblN0aWNrKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgIGlmKCFfdGhpcy5pc09uKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RoaXMuX2V2ZW50cyhpZCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYoX3RoaXMuaXNPbil7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICBfdGhpcy5fcGF1c2VMaXN0ZW5lcnMoc2Nyb2xsTGlzdGVuZXIpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICB9KTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBSZW1vdmVzIGV2ZW50IGhhbmRsZXJzIGZvciBzY3JvbGwgYW5kIGNoYW5nZSBldmVudHMgb24gYW5jaG9yLlxyXG4gICAqIEBmaXJlcyBTdGlja3kjcGF1c2VcclxuICAgKiBAcGFyYW0ge1N0cmluZ30gc2Nyb2xsTGlzdGVuZXIgLSB1bmlxdWUsIG5hbWVzcGFjZWQgc2Nyb2xsIGxpc3RlbmVyIGF0dGFjaGVkIHRvIGB3aW5kb3dgXHJcbiAgICovXHJcbiAgU3RpY2t5LnByb3RvdHlwZS5fcGF1c2VMaXN0ZW5lcnMgPSBmdW5jdGlvbihzY3JvbGxMaXN0ZW5lcil7XHJcbiAgICB0aGlzLmlzT24gPSBmYWxzZTtcclxuICAgIC8vIHRoaXMuJGFuY2hvci5vZmYoJ2NoYW5nZS56Zi5zdGlja3knKTtcclxuICAgICQod2luZG93KS5vZmYoc2Nyb2xsTGlzdGVuZXIpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgd2hlbiB0aGUgcGx1Z2luIGlzIHBhdXNlZCBkdWUgdG8gcmVzaXplIGV2ZW50IHNocmlua2luZyB0aGUgdmlldy5cclxuICAgICAqIEBldmVudCBTdGlja3kjcGF1c2VcclxuICAgICAqIEBwcml2YXRlXHJcbiAgICAgKi9cclxuICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ3BhdXNlLnpmLnN0aWNreScpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIENhbGxlZCBvbiBldmVyeSBgc2Nyb2xsYCBldmVudCBhbmQgb24gYF9pbml0YFxyXG4gICAqIGZpcmVzIGZ1bmN0aW9ucyBiYXNlZCBvbiBib29sZWFucyBhbmQgY2FjaGVkIHZhbHVlc1xyXG4gICAqIEBwYXJhbSB7Qm9vbGVhbn0gY2hlY2tTaXplcyAtIHRydWUgaWYgcGx1Z2luIHNob3VsZCByZWNhbGN1bGF0ZSBzaXplcyBhbmQgYnJlYWtwb2ludHMuXHJcbiAgICogQHBhcmFtIHtOdW1iZXJ9IHNjcm9sbCAtIGN1cnJlbnQgc2Nyb2xsIHBvc2l0aW9uIHBhc3NlZCBmcm9tIHNjcm9sbCBldmVudCBjYiBmdW5jdGlvbi4gSWYgbm90IHBhc3NlZCwgZGVmYXVsdHMgdG8gYHdpbmRvdy5wYWdlWU9mZnNldGAuXHJcbiAgICovXHJcbiAgU3RpY2t5LnByb3RvdHlwZS5fY2FsYyA9IGZ1bmN0aW9uKGNoZWNrU2l6ZXMsIHNjcm9sbCl7XHJcbiAgICBpZihjaGVja1NpemVzKXsgdGhpcy5fc2V0U2l6ZXMoKTsgfVxyXG5cclxuICAgIGlmKCF0aGlzLmNhblN0aWNrKXtcclxuICAgICAgaWYodGhpcy5pc1N0dWNrKXtcclxuICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3kodHJ1ZSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKCFzY3JvbGwpeyBzY3JvbGwgPSB3aW5kb3cucGFnZVlPZmZzZXQ7IH1cclxuXHJcbiAgICBpZihzY3JvbGwgPj0gdGhpcy50b3BQb2ludCl7XHJcbiAgICAgIGlmKHNjcm9sbCA8PSB0aGlzLmJvdHRvbVBvaW50KXtcclxuICAgICAgICBpZighdGhpcy5pc1N0dWNrKXtcclxuICAgICAgICAgIHRoaXMuX3NldFN0aWNreSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfWVsc2V7XHJcbiAgICAgICAgaWYodGhpcy5pc1N0dWNrKXtcclxuICAgICAgICAgIHRoaXMuX3JlbW92ZVN0aWNreShmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9ZWxzZXtcclxuICAgICAgaWYodGhpcy5pc1N0dWNrKXtcclxuICAgICAgICB0aGlzLl9yZW1vdmVTdGlja3kodHJ1ZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIENhdXNlcyB0aGUgJGVsZW1lbnQgdG8gYmVjb21lIHN0dWNrLlxyXG4gICAqIEFkZHMgYHBvc2l0aW9uOiBmaXhlZDtgLCBhbmQgaGVscGVyIGNsYXNzZXMuXHJcbiAgICogQGZpcmVzIFN0aWNreSNzdHVja3RvXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBTdGlja3kucHJvdG90eXBlLl9zZXRTdGlja3kgPSBmdW5jdGlvbigpe1xyXG4gICAgdmFyIHN0aWNrVG8gPSB0aGlzLm9wdGlvbnMuc3RpY2tUbyxcclxuICAgICAgICBtcmduID0gc3RpY2tUbyA9PT0gJ3RvcCcgPyAnbWFyZ2luVG9wJyA6ICdtYXJnaW5Cb3R0b20nLFxyXG4gICAgICAgIG5vdFN0dWNrVG8gPSBzdGlja1RvID09PSAndG9wJyA/ICdib3R0b20nIDogJ3RvcCcsXHJcbiAgICAgICAgY3NzID0ge307XHJcblxyXG4gICAgY3NzW21yZ25dID0gdGhpcy5vcHRpb25zW21yZ25dICsgJ2VtJztcclxuICAgIGNzc1tzdGlja1RvXSA9IDA7XHJcbiAgICBjc3Nbbm90U3R1Y2tUb10gPSAnYXV0byc7XHJcbiAgICBjc3NbJ2xlZnQnXSA9IHRoaXMuJGNvbnRhaW5lci5vZmZzZXQoKS5sZWZ0ICsgcGFyc2VJbnQod2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy4kY29udGFpbmVyWzBdKVtcInBhZGRpbmctbGVmdFwiXSwgMTApO1xyXG4gICAgdGhpcy5pc1N0dWNrID0gdHJ1ZTtcclxuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2lzLWFuY2hvcmVkIGlzLWF0LScgKyBub3RTdHVja1RvKVxyXG4gICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnaXMtc3R1Y2sgaXMtYXQtJyArIHN0aWNrVG8pXHJcbiAgICAgICAgICAgICAgICAgLmNzcyhjc3MpXHJcbiAgICAgICAgICAgICAgICAgLyoqXHJcbiAgICAgICAgICAgICAgICAgICogRmlyZXMgd2hlbiB0aGUgJGVsZW1lbnQgaGFzIGJlY29tZSBgcG9zaXRpb246IGZpeGVkO2BcclxuICAgICAgICAgICAgICAgICAgKiBOYW1lc3BhY2VkIHRvIGB0b3BgIG9yIGBib3R0b21gLlxyXG4gICAgICAgICAgICAgICAgICAqIEBldmVudCBTdGlja3kjc3R1Y2t0b1xyXG4gICAgICAgICAgICAgICAgICAqL1xyXG4gICAgICAgICAgICAgICAgIC50cmlnZ2VyKCdzdGlja3kuemYuc3R1Y2t0bzonICsgc3RpY2tUbyk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQ2F1c2VzIHRoZSAkZWxlbWVudCB0byBiZWNvbWUgdW5zdHVjay5cclxuICAgKiBSZW1vdmVzIGBwb3NpdGlvbjogZml4ZWQ7YCwgYW5kIGhlbHBlciBjbGFzc2VzLlxyXG4gICAqIEFkZHMgb3RoZXIgaGVscGVyIGNsYXNzZXMuXHJcbiAgICogQHBhcmFtIHtCb29sZWFufSBpc1RvcCAtIHRlbGxzIHRoZSBmdW5jdGlvbiBpZiB0aGUgJGVsZW1lbnQgc2hvdWxkIGFuY2hvciB0byB0aGUgdG9wIG9yIGJvdHRvbSBvZiBpdHMgJGFuY2hvciBlbGVtZW50LlxyXG4gICAqIEBmaXJlcyBTdGlja3kjdW5zdHVja2Zyb21cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIFN0aWNreS5wcm90b3R5cGUuX3JlbW92ZVN0aWNreSA9IGZ1bmN0aW9uKGlzVG9wKXtcclxuICAgIHZhciBzdGlja1RvID0gdGhpcy5vcHRpb25zLnN0aWNrVG8sXHJcbiAgICAgICAgc3RpY2tUb1RvcCA9IHN0aWNrVG8gPT09ICd0b3AnLFxyXG4gICAgICAgIGNzcyA9IHt9LFxyXG4gICAgICAgIGFuY2hvclB0ID0gKHRoaXMucG9pbnRzID8gdGhpcy5wb2ludHNbMV0gLSB0aGlzLnBvaW50c1swXSA6IHRoaXMuYW5jaG9ySGVpZ2h0KSAtIHRoaXMuZWxlbUhlaWdodCxcclxuICAgICAgICBtcmduID0gc3RpY2tUb1RvcCA/ICdtYXJnaW5Ub3AnIDogJ21hcmdpbkJvdHRvbScsXHJcbiAgICAgICAgbm90U3R1Y2tUbyA9IHN0aWNrVG9Ub3AgPyAnYm90dG9tJyA6ICd0b3AnLFxyXG4gICAgICAgIHRvcE9yQm90dG9tID0gaXNUb3AgPyAndG9wJyA6ICdib3R0b20nO1xyXG5cclxuICAgIGNzc1ttcmduXSA9IDA7XHJcblxyXG4gICAgaWYoKGlzVG9wICYmICFzdGlja1RvVG9wKSB8fCAoc3RpY2tUb1RvcCAmJiAhaXNUb3ApKXtcclxuICAgICAgY3NzW3N0aWNrVG9dID0gYW5jaG9yUHQ7XHJcbiAgICAgIGNzc1tub3RTdHVja1RvXSA9IDA7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgY3NzW3N0aWNrVG9dID0gMDtcclxuICAgICAgY3NzW25vdFN0dWNrVG9dID0gYW5jaG9yUHQ7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGNzc1snbGVmdCddID0gJyc7XHJcbiAgICB0aGlzLmlzU3R1Y2sgPSBmYWxzZTtcclxuICAgIHRoaXMuJGVsZW1lbnQucmVtb3ZlQ2xhc3MoJ2lzLXN0dWNrIGlzLWF0LScgKyBzdGlja1RvKVxyXG4gICAgICAgICAgICAgICAgIC5hZGRDbGFzcygnaXMtYW5jaG9yZWQgaXMtYXQtJyArIHRvcE9yQm90dG9tKVxyXG4gICAgICAgICAgICAgICAgIC5jc3MoY3NzKVxyXG4gICAgICAgICAgICAgICAgIC8qKlxyXG4gICAgICAgICAgICAgICAgICAqIEZpcmVzIHdoZW4gdGhlICRlbGVtZW50IGhhcyBiZWNvbWUgYW5jaG9yZWQuXHJcbiAgICAgICAgICAgICAgICAgICogTmFtZXNwYWNlZCB0byBgdG9wYCBvciBgYm90dG9tYC5cclxuICAgICAgICAgICAgICAgICAgKiBAZXZlbnQgU3RpY2t5I3Vuc3R1Y2tmcm9tXHJcbiAgICAgICAgICAgICAgICAgICovXHJcbiAgICAgICAgICAgICAgICAgLnRyaWdnZXIoJ3N0aWNreS56Zi51bnN0dWNrZnJvbTonICsgdG9wT3JCb3R0b20pO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlICRlbGVtZW50IGFuZCAkY29udGFpbmVyIHNpemVzIGZvciBwbHVnaW4uXHJcbiAgICogQ2FsbHMgYF9zZXRCcmVha1BvaW50c2AuXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0byBmaXJlIG9uIGNvbXBsZXRpb24gb2YgYF9zZXRCcmVha1BvaW50c2AuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBTdGlja3kucHJvdG90eXBlLl9zZXRTaXplcyA9IGZ1bmN0aW9uKGNiKXtcclxuICAgIHRoaXMuY2FuU3RpY2sgPSBGb3VuZGF0aW9uLk1lZGlhUXVlcnkuYXRMZWFzdCh0aGlzLm9wdGlvbnMuc3RpY2t5T24pO1xyXG4gICAgaWYoIXRoaXMuY2FuU3RpY2speyBjYigpOyB9XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzLFxyXG4gICAgICAgIG5ld0VsZW1XaWR0aCA9IHRoaXMuJGNvbnRhaW5lclswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKS53aWR0aCxcclxuICAgICAgICBjb21wID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy4kY29udGFpbmVyWzBdKSxcclxuICAgICAgICBwZG5nID0gcGFyc2VJbnQoY29tcFsncGFkZGluZy1yaWdodCddLCAxMCk7XHJcblxyXG4gICAgLy8gY29uc29sZS5sb2codGhpcy4kYW5jaG9yKTtcclxuICAgIGlmKHRoaXMuJGFuY2hvciAmJiB0aGlzLiRhbmNob3IubGVuZ3RoKXtcclxuICAgICAgdGhpcy5hbmNob3JIZWlnaHQgPSB0aGlzLiRhbmNob3JbMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkuaGVpZ2h0O1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuX3BhcnNlUG9pbnRzKCk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5jc3Moe1xyXG4gICAgICAnbWF4LXdpZHRoJzogbmV3RWxlbVdpZHRoIC0gcGRuZyArICdweCdcclxuICAgIH0pO1xyXG5cclxuICAgIHZhciBuZXdDb250YWluZXJIZWlnaHQgPSB0aGlzLiRlbGVtZW50WzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodCB8fCB0aGlzLmNvbnRhaW5lckhlaWdodDtcclxuICAgIHRoaXMuY29udGFpbmVySGVpZ2h0ID0gbmV3Q29udGFpbmVySGVpZ2h0O1xyXG4gICAgdGhpcy4kY29udGFpbmVyLmNzcyh7XHJcbiAgICAgIGhlaWdodDogbmV3Q29udGFpbmVySGVpZ2h0XHJcbiAgICB9KTtcclxuICAgIHRoaXMuZWxlbUhlaWdodCA9IG5ld0NvbnRhaW5lckhlaWdodDtcclxuXHJcbiAgXHRpZiAodGhpcy5pc1N0dWNrKSB7XHJcbiAgXHRcdHRoaXMuJGVsZW1lbnQuY3NzKHtcImxlZnRcIjp0aGlzLiRjb250YWluZXIub2Zmc2V0KCkubGVmdCArIHBhcnNlSW50KGNvbXBbJ3BhZGRpbmctbGVmdCddLCAxMCl9KTtcclxuICBcdH1cclxuXHJcbiAgICB0aGlzLl9zZXRCcmVha1BvaW50cyhuZXdDb250YWluZXJIZWlnaHQsIGZ1bmN0aW9uKCl7XHJcbiAgICAgIGlmKGNiKXsgY2IoKTsgfVxyXG4gICAgfSk7XHJcblxyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogU2V0cyB0aGUgdXBwZXIgYW5kIGxvd2VyIGJyZWFrcG9pbnRzIGZvciB0aGUgZWxlbWVudCB0byBiZWNvbWUgc3RpY2t5L3Vuc3RpY2t5LlxyXG4gICAqIEBwYXJhbSB7TnVtYmVyfSBlbGVtSGVpZ2h0IC0gcHggdmFsdWUgZm9yIHN0aWNreS4kZWxlbWVudCBoZWlnaHQsIGNhbGN1bGF0ZWQgYnkgYF9zZXRTaXplc2AuXHJcbiAgICogQHBhcmFtIHtGdW5jdGlvbn0gY2IgLSBvcHRpb25hbCBjYWxsYmFjayBmdW5jdGlvbiB0byBiZSBjYWxsZWQgb24gY29tcGxldGlvbi5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIFN0aWNreS5wcm90b3R5cGUuX3NldEJyZWFrUG9pbnRzID0gZnVuY3Rpb24oZWxlbUhlaWdodCwgY2Ipe1xyXG4gICAgaWYoIXRoaXMuY2FuU3RpY2spe1xyXG4gICAgICBpZihjYil7IGNiKCk7IH1cclxuICAgICAgZWxzZXsgcmV0dXJuIGZhbHNlOyB9XHJcbiAgICB9XHJcbiAgICB2YXIgbVRvcCA9IGVtQ2FsYyh0aGlzLm9wdGlvbnMubWFyZ2luVG9wKSxcclxuICAgICAgICBtQnRtID0gZW1DYWxjKHRoaXMub3B0aW9ucy5tYXJnaW5Cb3R0b20pLFxyXG4gICAgICAgIHRvcFBvaW50ID0gdGhpcy5wb2ludHMgPyB0aGlzLnBvaW50c1swXSA6IHRoaXMuJGFuY2hvci5vZmZzZXQoKS50b3AsXHJcbiAgICAgICAgYm90dG9tUG9pbnQgPSB0aGlzLnBvaW50cyA/IHRoaXMucG9pbnRzWzFdIDogdG9wUG9pbnQgKyB0aGlzLmFuY2hvckhlaWdodCxcclxuICAgICAgICAvLyB0b3BQb2ludCA9IHRoaXMuJGFuY2hvci5vZmZzZXQoKS50b3AgfHwgdGhpcy5wb2ludHNbMF0sXHJcbiAgICAgICAgLy8gYm90dG9tUG9pbnQgPSB0b3BQb2ludCArIHRoaXMuYW5jaG9ySGVpZ2h0IHx8IHRoaXMucG9pbnRzWzFdLFxyXG4gICAgICAgIHdpbkhlaWdodCA9IHdpbmRvdy5pbm5lckhlaWdodDtcclxuXHJcbiAgICBpZih0aGlzLm9wdGlvbnMuc3RpY2tUbyA9PT0gJ3RvcCcpe1xyXG4gICAgICB0b3BQb2ludCAtPSBtVG9wO1xyXG4gICAgICBib3R0b21Qb2ludCAtPSAoZWxlbUhlaWdodCArIG1Ub3ApO1xyXG4gICAgfWVsc2UgaWYodGhpcy5vcHRpb25zLnN0aWNrVG8gPT09ICdib3R0b20nKXtcclxuICAgICAgdG9wUG9pbnQgLT0gKHdpbkhlaWdodCAtIChlbGVtSGVpZ2h0ICsgbUJ0bSkpO1xyXG4gICAgICBib3R0b21Qb2ludCAtPSAod2luSGVpZ2h0IC0gbUJ0bSk7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgLy90aGlzIHdvdWxkIGJlIHRoZSBzdGlja1RvOiBib3RoIG9wdGlvbi4uLiB0cmlja3lcclxuICAgIH1cclxuXHJcbiAgICB0aGlzLnRvcFBvaW50ID0gdG9wUG9pbnQ7XHJcbiAgICB0aGlzLmJvdHRvbVBvaW50ID0gYm90dG9tUG9pbnQ7XHJcblxyXG4gICAgaWYoY2IpeyBjYigpOyB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgdGhlIGN1cnJlbnQgc3RpY2t5IGVsZW1lbnQuXHJcbiAgICogUmVzZXRzIHRoZSBlbGVtZW50IHRvIHRoZSB0b3AgcG9zaXRpb24gZmlyc3QuXHJcbiAgICogUmVtb3ZlcyBldmVudCBsaXN0ZW5lcnMsIEpTLWFkZGVkIGNzcyBwcm9wZXJ0aWVzIGFuZCBjbGFzc2VzLCBhbmQgdW53cmFwcyB0aGUgJGVsZW1lbnQgaWYgdGhlIEpTIGFkZGVkIHRoZSAkY29udGFpbmVyLlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIFN0aWNreS5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLl9yZW1vdmVTdGlja3kodHJ1ZSk7XHJcblxyXG4gICAgdGhpcy4kZWxlbWVudC5yZW1vdmVDbGFzcyh0aGlzLm9wdGlvbnMuc3RpY2t5Q2xhc3MgKyAnIGlzLWFuY2hvcmVkIGlzLWF0LXRvcCcpXHJcbiAgICAgICAgICAgICAgICAgLmNzcyh7XHJcbiAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcnLFxyXG4gICAgICAgICAgICAgICAgICAgdG9wOiAnJyxcclxuICAgICAgICAgICAgICAgICAgIGJvdHRvbTogJycsXHJcbiAgICAgICAgICAgICAgICAgICAnbWF4LXdpZHRoJzogJydcclxuICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgIC5vZmYoJ3Jlc2l6ZW1lLnpmLnRyaWdnZXInKTtcclxuXHJcbiAgICB0aGlzLiRhbmNob3Iub2ZmKCdjaGFuZ2UuemYuc3RpY2t5Jyk7XHJcbiAgICAkKHdpbmRvdykub2ZmKCdzY3JvbGwuemYuc3RpY2t5Jyk7XHJcblxyXG4gICAgaWYodGhpcy53YXNXcmFwcGVkKXtcclxuICAgICAgdGhpcy4kZWxlbWVudC51bndyYXAoKTtcclxuICAgIH1lbHNle1xyXG4gICAgICB0aGlzLiRjb250YWluZXIucmVtb3ZlQ2xhc3ModGhpcy5vcHRpb25zLmNvbnRhaW5lckNsYXNzKVxyXG4gICAgICAgICAgICAgICAgICAgICAuY3NzKHtcclxuICAgICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6ICcnXHJcbiAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGNhbGN1bGF0ZSBlbSB2YWx1ZXNcclxuICAgKiBAcGFyYW0gTnVtYmVyIHtlbX0gLSBudW1iZXIgb2YgZW0ncyB0byBjYWxjdWxhdGUgaW50byBwaXhlbHNcclxuICAgKi9cclxuICBmdW5jdGlvbiBlbUNhbGMoZW0pe1xyXG4gICAgcmV0dXJuIHBhcnNlSW50KHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmJvZHksIG51bGwpLmZvbnRTaXplLCAxMCkgKiBlbTtcclxuICB9XHJcbiAgRm91bmRhdGlvbi5wbHVnaW4oU3RpY2t5LCAnU3RpY2t5Jyk7XHJcbn0oalF1ZXJ5LCB3aW5kb3cuRm91bmRhdGlvbik7XHJcbiIsIi8qKlxyXG4gKiBUYWJzIG1vZHVsZS5cclxuICogQG1vZHVsZSBmb3VuZGF0aW9uLnRhYnNcclxuICogQHJlcXVpcmVzIGZvdW5kYXRpb24udXRpbC5rZXlib2FyZFxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLnRpbWVyQW5kSW1hZ2VMb2FkZXIgaWYgdGFicyBjb250YWluIGltYWdlc1xyXG4gKi9cclxuIWZ1bmN0aW9uKCQsIEZvdW5kYXRpb24pIHtcclxuICAndXNlIHN0cmljdCc7XHJcblxyXG4gIC8qKlxyXG4gICAqIENyZWF0ZXMgYSBuZXcgaW5zdGFuY2Ugb2YgdGFicy5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgVGFicyNpbml0XHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIG1ha2UgaW50byB0YWJzLlxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zIC0gT3ZlcnJpZGVzIHRvIHRoZSBkZWZhdWx0IHBsdWdpbiBzZXR0aW5ncy5cclxuICAgKi9cclxuICBmdW5jdGlvbiBUYWJzKGVsZW1lbnQsIG9wdGlvbnMpe1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgVGFicy5kZWZhdWx0cywgdGhpcy4kZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG5cclxuICAgIHRoaXMuX2luaXQoKTtcclxuICAgIEZvdW5kYXRpb24ucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgICBGb3VuZGF0aW9uLktleWJvYXJkLnJlZ2lzdGVyKCdUYWJzJywge1xyXG4gICAgICAnRU5URVInOiAnb3BlbicsXHJcbiAgICAgICdTUEFDRSc6ICdvcGVuJyxcclxuICAgICAgJ0FSUk9XX1JJR0hUJzogJ25leHQnLFxyXG4gICAgICAnQVJST1dfVVAnOiAncHJldmlvdXMnLFxyXG4gICAgICAnQVJST1dfRE9XTic6ICduZXh0JyxcclxuICAgICAgJ0FSUk9XX0xFRlQnOiAncHJldmlvdXMnXHJcbiAgICAgIC8vICdUQUInOiAnbmV4dCcsXHJcbiAgICAgIC8vICdTSElGVF9UQUInOiAncHJldmlvdXMnXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIFRhYnMuZGVmYXVsdHMgPSB7XHJcbiAgICAvLyAvKipcclxuICAgIC8vICAqIEFsbG93cyB0aGUgSlMgdG8gYWx0ZXIgdGhlIHVybCBvZiB0aGUgd2luZG93LiBOb3QgeWV0IGltcGxlbWVudGVkLlxyXG4gICAgLy8gICovXHJcbiAgICAvLyBkZWVwTGlua2luZzogZmFsc2UsXHJcbiAgICAvLyAvKipcclxuICAgIC8vICAqIElmIGRlZXBMaW5raW5nIGlzIGVuYWJsZWQsIGFsbG93cyB0aGUgd2luZG93IHRvIHNjcm9sbCB0byBjb250ZW50IGlmIHdpbmRvdyBpcyBsb2FkZWQgd2l0aCBhIGhhc2ggaW5jbHVkaW5nIGEgdGFiLXBhbmUgaWRcclxuICAgIC8vICAqL1xyXG4gICAgLy8gc2Nyb2xsVG9Db250ZW50OiBmYWxzZSxcclxuICAgIC8qKlxyXG4gICAgICogQWxsb3dzIHRoZSB3aW5kb3cgdG8gc2Nyb2xsIHRvIGNvbnRlbnQgb2YgYWN0aXZlIHBhbmUgb24gbG9hZCBpZiBzZXQgdG8gdHJ1ZS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIGF1dG9Gb2N1czogZmFsc2UsXHJcbiAgICAvKipcclxuICAgICAqIEFsbG93cyBrZXlib2FyZCBpbnB1dCB0byAnd3JhcCcgYXJvdW5kIHRoZSB0YWIgbGlua3MuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSB0cnVlXHJcbiAgICAgKi9cclxuICAgIHdyYXBPbktleXM6IHRydWUsXHJcbiAgICAvKipcclxuICAgICAqIEFsbG93cyB0aGUgdGFiIGNvbnRlbnQgcGFuZXMgdG8gbWF0Y2ggaGVpZ2h0cyBpZiBzZXQgdG8gdHJ1ZS5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIG1hdGNoSGVpZ2h0OiBmYWxzZSxcclxuICAgIC8qKlxyXG4gICAgICogQ2xhc3MgYXBwbGllZCB0byBgbGlgJ3MgaW4gdGFiIGxpbmsgbGlzdC5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICd0YWJzLXRpdGxlJ1xyXG4gICAgICovXHJcbiAgICBsaW5rQ2xhc3M6ICd0YWJzLXRpdGxlJyxcclxuICAgIC8vIGNvbnRlbnRDbGFzczogJ3RhYnMtY29udGVudCcsXHJcbiAgICAvKipcclxuICAgICAqIENsYXNzIGFwcGxpZWQgdG8gdGhlIGNvbnRlbnQgY29udGFpbmVycy5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICd0YWJzLXBhbmVsJ1xyXG4gICAgICovXHJcbiAgICBwYW5lbENsYXNzOiAndGFicy1wYW5lbCdcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgdGFicyBieSBzaG93aW5nIGFuZCBmb2N1c2luZyAoaWYgYXV0b0ZvY3VzPXRydWUpIHRoZSBwcmVzZXQgYWN0aXZlIHRhYi5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIFRhYnMucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcblxyXG4gICAgdGhpcy4kdGFiVGl0bGVzID0gdGhpcy4kZWxlbWVudC5maW5kKCcuJyArIHRoaXMub3B0aW9ucy5saW5rQ2xhc3MpO1xyXG4gICAgdGhpcy4kdGFiQ29udGVudCA9ICQoJ1tkYXRhLXRhYnMtY29udGVudD1cIicgKyB0aGlzLiRlbGVtZW50WzBdLmlkICsgJ1wiXScpO1xyXG5cclxuICAgIHRoaXMuJHRhYlRpdGxlcy5lYWNoKGZ1bmN0aW9uKCl7XHJcbiAgICAgIHZhciAkZWxlbSA9ICQodGhpcyksXHJcbiAgICAgICAgICAkbGluayA9ICRlbGVtLmZpbmQoJ2EnKSxcclxuICAgICAgICAgIGlzQWN0aXZlID0gJGVsZW0uaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpLFxyXG4gICAgICAgICAgaGFzaCA9ICRsaW5rLmF0dHIoJ2hyZWYnKS5zbGljZSgxKSxcclxuICAgICAgICAgIGxpbmtJZCA9IGhhc2ggKyAnLWxhYmVsJyxcclxuICAgICAgICAgICR0YWJDb250ZW50ID0gJChoYXNoKTtcclxuXHJcbiAgICAgICRlbGVtLmF0dHIoeydyb2xlJzogJ3ByZXNlbnRhdGlvbid9KTtcclxuXHJcbiAgICAgICRsaW5rLmF0dHIoe1xyXG4gICAgICAgICdyb2xlJzogJ3RhYicsXHJcbiAgICAgICAgJ2FyaWEtY29udHJvbHMnOiBoYXNoLFxyXG4gICAgICAgICdhcmlhLXNlbGVjdGVkJzogaXNBY3RpdmUsXHJcbiAgICAgICAgJ2lkJzogbGlua0lkXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgJHRhYkNvbnRlbnQuYXR0cih7XHJcbiAgICAgICAgJ3JvbGUnOiAndGFicGFuZWwnLFxyXG4gICAgICAgICdhcmlhLWhpZGRlbic6ICFpc0FjdGl2ZSxcclxuICAgICAgICAnYXJpYS1sYWJlbGxlZGJ5JzogbGlua0lkXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgaWYoaXNBY3RpdmUgJiYgX3RoaXMub3B0aW9ucy5hdXRvRm9jdXMpe1xyXG4gICAgICAgICRsaW5rLmZvY3VzKCk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gICAgaWYodGhpcy5vcHRpb25zLm1hdGNoSGVpZ2h0KXtcclxuICAgICAgdmFyICRpbWFnZXMgPSB0aGlzLiR0YWJDb250ZW50LmZpbmQoJ2ltZycpO1xyXG4gICAgICBpZigkaW1hZ2VzLmxlbmd0aCl7XHJcbiAgICAgICAgRm91bmRhdGlvbi5vbkltYWdlc0xvYWRlZCgkaW1hZ2VzLCB0aGlzLl9zZXRIZWlnaHQuYmluZCh0aGlzKSk7XHJcbiAgICAgIH1lbHNle1xyXG4gICAgICAgIHRoaXMuX3NldEhlaWdodCgpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIEFkZHMgZXZlbnQgaGFuZGxlcnMgZm9yIGl0ZW1zIHdpdGhpbiB0aGUgdGFicy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gICBUYWJzLnByb3RvdHlwZS5fZXZlbnRzID0gZnVuY3Rpb24oKXtcclxuICAgIHRoaXMuX2FkZEtleUhhbmRsZXIoKTtcclxuICAgIHRoaXMuX2FkZENsaWNrSGFuZGxlcigpO1xyXG4gICAgaWYodGhpcy5vcHRpb25zLm1hdGNoSGVpZ2h0KXtcclxuICAgICAgJCh3aW5kb3cpLm9uKCdjaGFuZ2VkLnpmLm1lZGlhcXVlcnknLCB0aGlzLl9zZXRIZWlnaHQuYmluZCh0aGlzKSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBjbGljayBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSB0YWJzLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgVGFicy5wcm90b3R5cGUuX2FkZENsaWNrSGFuZGxlciA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgX3RoaXMgPSB0aGlzO1xyXG4gICAgdGhpcy4kZWxlbWVudC5vZmYoJ2NsaWNrLnpmLnRhYnMnKVxyXG4gICAgICAgICAgICAgICAgICAgLm9uKCdjbGljay56Zi50YWJzJywgJy4nICsgdGhpcy5vcHRpb25zLmxpbmtDbGFzcywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgICAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgICAgICAgICAgICAgICAgaWYoJCh0aGlzKS5oYXNDbGFzcygnaXMtYWN0aXZlJykpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICBfdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCQodGhpcykpO1xyXG4gICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBrZXlib2FyZCBldmVudCBoYW5kbGVycyBmb3IgaXRlbXMgd2l0aGluIHRoZSB0YWJzLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgVGFicy5wcm90b3R5cGUuX2FkZEtleUhhbmRsZXIgPSBmdW5jdGlvbigpe1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHZhciAkZmlyc3RUYWIgPSBfdGhpcy4kZWxlbWVudC5maW5kKCdsaTpmaXJzdC1vZi10eXBlJyk7XHJcbiAgICB2YXIgJGxhc3RUYWIgPSBfdGhpcy4kZWxlbWVudC5maW5kKCdsaTpsYXN0LW9mLXR5cGUnKTtcclxuXHJcbiAgICB0aGlzLiR0YWJUaXRsZXMub2ZmKCdrZXlkb3duLnpmLnRhYnMnKS5vbigna2V5ZG93bi56Zi50YWJzJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgIGlmKGUud2hpY2ggPT09IDkpIHJldHVybjtcclxuICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcclxuICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgdmFyICRlbGVtZW50ID0gJCh0aGlzKSxcclxuICAgICAgICAkZWxlbWVudHMgPSAkZWxlbWVudC5wYXJlbnQoJ3VsJykuY2hpbGRyZW4oJ2xpJyksXHJcbiAgICAgICAgJHByZXZFbGVtZW50LFxyXG4gICAgICAgICRuZXh0RWxlbWVudDtcclxuXHJcbiAgICAgICRlbGVtZW50cy5lYWNoKGZ1bmN0aW9uKGkpIHtcclxuICAgICAgICBpZiAoJCh0aGlzKS5pcygkZWxlbWVudCkpIHtcclxuICAgICAgICAgIGlmIChfdGhpcy5vcHRpb25zLndyYXBPbktleXMpIHtcclxuICAgICAgICAgICAgJHByZXZFbGVtZW50ID0gaSA9PT0gMCA/ICRlbGVtZW50cy5sYXN0KCkgOiAkZWxlbWVudHMuZXEoaS0xKTtcclxuICAgICAgICAgICAgJG5leHRFbGVtZW50ID0gaSA9PT0gJGVsZW1lbnRzLmxlbmd0aCAtMSA/ICRlbGVtZW50cy5maXJzdCgpIDogJGVsZW1lbnRzLmVxKGkrMSk7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAkcHJldkVsZW1lbnQgPSAkZWxlbWVudHMuZXEoTWF0aC5tYXgoMCwgaS0xKSk7XHJcbiAgICAgICAgICAgICRuZXh0RWxlbWVudCA9ICRlbGVtZW50cy5lcShNYXRoLm1pbihpKzEsICRlbGVtZW50cy5sZW5ndGgtMSkpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICAvLyBoYW5kbGUga2V5Ym9hcmQgZXZlbnQgd2l0aCBrZXlib2FyZCB1dGlsXHJcbiAgICAgIEZvdW5kYXRpb24uS2V5Ym9hcmQuaGFuZGxlS2V5KGUsIF90aGlzLCB7XHJcbiAgICAgICAgb3BlbjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAkZWxlbWVudC5maW5kKCdbcm9sZT1cInRhYlwiXScpLmZvY3VzKCk7XHJcbiAgICAgICAgICBfdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCRlbGVtZW50KTtcclxuICAgICAgICB9LFxyXG4gICAgICAgIHByZXZpb3VzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICRwcmV2RWxlbWVudC5maW5kKCdbcm9sZT1cInRhYlwiXScpLmZvY3VzKCk7XHJcbiAgICAgICAgICBfdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCRwcmV2RWxlbWVudCk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICBuZXh0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgICRuZXh0RWxlbWVudC5maW5kKCdbcm9sZT1cInRhYlwiXScpLmZvY3VzKCk7XHJcbiAgICAgICAgICBfdGhpcy5faGFuZGxlVGFiQ2hhbmdlKCRuZXh0RWxlbWVudCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG5cclxuICAvKipcclxuICAgKiBPcGVucyB0aGUgdGFiIGAkdGFyZ2V0Q29udGVudGAgZGVmaW5lZCBieSBgJHRhcmdldGAuXHJcbiAgICogQHBhcmFtIHtqUXVlcnl9ICR0YXJnZXQgLSBUYWIgdG8gb3Blbi5cclxuICAgKiBAZmlyZXMgVGFicyNjaGFuZ2VcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBUYWJzLnByb3RvdHlwZS5faGFuZGxlVGFiQ2hhbmdlID0gZnVuY3Rpb24oJHRhcmdldCl7XHJcbiAgICB2YXIgJHRhYkxpbmsgPSAkdGFyZ2V0LmZpbmQoJ1tyb2xlPVwidGFiXCJdJyksXHJcbiAgICAgICAgaGFzaCA9ICR0YWJMaW5rLmF0dHIoJ2hyZWYnKSxcclxuICAgICAgICAkdGFyZ2V0Q29udGVudCA9ICQoaGFzaCksXHJcblxyXG4gICAgICAgICRvbGRUYWIgPSB0aGlzLiRlbGVtZW50LmZpbmQoJy4nICsgdGhpcy5vcHRpb25zLmxpbmtDbGFzcyArICcuaXMtYWN0aXZlJylcclxuICAgICAgICAgICAgICAgICAgLnJlbW92ZUNsYXNzKCdpcy1hY3RpdmUnKS5maW5kKCdbcm9sZT1cInRhYlwiXScpXHJcbiAgICAgICAgICAgICAgICAgIC5hdHRyKHsnYXJpYS1zZWxlY3RlZCc6ICdmYWxzZSd9KS5hdHRyKCdocmVmJyk7XHJcblxyXG4gICAgJCgkb2xkVGFiKS5yZW1vdmVDbGFzcygnaXMtYWN0aXZlJykuYXR0cih7J2FyaWEtaGlkZGVuJzogJ3RydWUnfSk7XHJcblxyXG4gICAgJHRhcmdldC5hZGRDbGFzcygnaXMtYWN0aXZlJyk7XHJcblxyXG4gICAgJHRhYkxpbmsuYXR0cih7J2FyaWEtc2VsZWN0ZWQnOiAndHJ1ZSd9KTtcclxuXHJcbiAgICAkdGFyZ2V0Q29udGVudFxyXG4gICAgICAuYWRkQ2xhc3MoJ2lzLWFjdGl2ZScpXHJcbiAgICAgIC5hdHRyKHsnYXJpYS1oaWRkZW4nOiAnZmFsc2UnfSk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSBwbHVnaW4gaGFzIHN1Y2Nlc3NmdWxseSBjaGFuZ2VkIHRhYnMuXHJcbiAgICAgKiBAZXZlbnQgVGFicyNjaGFuZ2VcclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjaGFuZ2UuemYudGFicycsIFskdGFyZ2V0XSk7XHJcbiAgICAvLyBGb3VuZGF0aW9uLnJlZmxvdyh0aGlzLiRlbGVtZW50LCAndGFicycpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFB1YmxpYyBtZXRob2QgZm9yIHNlbGVjdGluZyBhIGNvbnRlbnQgcGFuZSB0byBkaXNwbGF5LlxyXG4gICAqIEBwYXJhbSB7alF1ZXJ5IHwgU3RyaW5nfSBlbGVtIC0galF1ZXJ5IG9iamVjdCBvciBzdHJpbmcgb2YgdGhlIGlkIG9mIHRoZSBwYW5lIHRvIGRpc3BsYXkuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgVGFicy5wcm90b3R5cGUuc2VsZWN0VGFiID0gZnVuY3Rpb24oZWxlbSl7XHJcbiAgICB2YXIgaWRTdHI7XHJcbiAgICBpZih0eXBlb2YgZWxlbSA9PT0gJ29iamVjdCcpe1xyXG4gICAgICBpZFN0ciA9IGVsZW1bMF0uaWQ7XHJcbiAgICB9ZWxzZXtcclxuICAgICAgaWRTdHIgPSBlbGVtO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKGlkU3RyLmluZGV4T2YoJyMnKSA8IDApe1xyXG4gICAgICBpZFN0ciA9ICcjJyArIGlkU3RyO1xyXG4gICAgfVxyXG4gICAgdmFyICR0YXJnZXQgPSB0aGlzLiR0YWJUaXRsZXMuZmluZCgnW2hyZWY9XCInICsgaWRTdHIgKyAnXCJdJykucGFyZW50KCcuJyArIHRoaXMub3B0aW9ucy5saW5rQ2xhc3MpO1xyXG5cclxuICAgIHRoaXMuX2hhbmRsZVRhYkNoYW5nZSgkdGFyZ2V0KTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIFNldHMgdGhlIGhlaWdodCBvZiBlYWNoIHBhbmVsIHRvIHRoZSBoZWlnaHQgb2YgdGhlIHRhbGxlc3QgcGFuZWwuXHJcbiAgICogSWYgZW5hYmxlZCBpbiBvcHRpb25zLCBnZXRzIGNhbGxlZCBvbiBtZWRpYSBxdWVyeSBjaGFuZ2UuXHJcbiAgICogSWYgbG9hZGluZyBjb250ZW50IHZpYSBleHRlcm5hbCBzb3VyY2UsIGNhbiBiZSBjYWxsZWQgZGlyZWN0bHkgb3Igd2l0aCBfcmVmbG93LlxyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgVGFicy5wcm90b3R5cGUuX3NldEhlaWdodCA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgbWF4ID0gMDtcclxuICAgIHRoaXMuJHRhYkNvbnRlbnQuZmluZCgnLicgKyB0aGlzLm9wdGlvbnMucGFuZWxDbGFzcylcclxuICAgICAgICAgICAgICAgICAgICAuY3NzKCdoZWlnaHQnLCAnJylcclxuICAgICAgICAgICAgICAgICAgICAuZWFjaChmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgdmFyIHBhbmVsID0gJCh0aGlzKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBpc0FjdGl2ZSA9IHBhbmVsLmhhc0NsYXNzKCdpcy1hY3RpdmUnKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICBpZighaXNBY3RpdmUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYW5lbC5jc3Moeyd2aXNpYmlsaXR5JzogJ2hpZGRlbicsICdkaXNwbGF5JzogJ2Jsb2NrJ30pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgdmFyIHRlbXAgPSB0aGlzLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpLmhlaWdodDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICBpZighaXNBY3RpdmUpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwYW5lbC5jc3Moeyd2aXNpYmlsaXR5JzogJycsICdkaXNwbGF5JzogJyd9KTtcclxuICAgICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICBtYXggPSB0ZW1wID4gbWF4ID8gdGVtcCA6IG1heDtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgICAgIC5jc3MoJ2hlaWdodCcsIG1heCArICdweCcpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIERlc3Ryb3lzIGFuIGluc3RhbmNlIG9mIGFuIHRhYnMuXHJcbiAgICogQGZpcmVzIFRhYnMjZGVzdHJveWVkXHJcbiAgICovXHJcbiAgVGFicy5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpcy4kZWxlbWVudC5maW5kKCcuJyArIHRoaXMub3B0aW9ucy5saW5rQ2xhc3MpXHJcbiAgICAgICAgICAgICAgICAgLm9mZignLnpmLnRhYnMnKS5oaWRlKCkuZW5kKClcclxuICAgICAgICAgICAgICAgICAuZmluZCgnLicgKyB0aGlzLm9wdGlvbnMucGFuZWxDbGFzcylcclxuICAgICAgICAgICAgICAgICAuaGlkZSgpO1xyXG4gICAgaWYodGhpcy5vcHRpb25zLm1hdGNoSGVpZ2h0KXtcclxuICAgICAgJCh3aW5kb3cpLm9mZignY2hhbmdlZC56Zi5tZWRpYXF1ZXJ5Jyk7XHJcbiAgICB9XHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfTtcclxuXHJcbiAgRm91bmRhdGlvbi5wbHVnaW4oVGFicywgJ1RhYnMnKTtcclxuXHJcbiAgZnVuY3Rpb24gY2hlY2tDbGFzcygkZWxlbSl7XHJcbiAgICByZXR1cm4gJGVsZW0uaGFzQ2xhc3MoJ2lzLWFjdGl2ZScpO1xyXG4gIH1cclxufShqUXVlcnksIHdpbmRvdy5Gb3VuZGF0aW9uKTtcclxuIiwiLyoqXHJcbiAqIFRvZ2dsZXIgbW9kdWxlLlxyXG4gKiBAbW9kdWxlIGZvdW5kYXRpb24udG9nZ2xlclxyXG4gKiBAcmVxdWlyZXMgZm91bmRhdGlvbi51dGlsLm1vdGlvblxyXG4gKi9cclxuXHJcbiFmdW5jdGlvbihGb3VuZGF0aW9uLCAkKSB7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIFRvZ2dsZXIuXHJcbiAgICogQGNsYXNzXHJcbiAgICogQGZpcmVzIFRvZ2dsZXIjaW5pdFxyXG4gICAqIEBwYXJhbSB7T2JqZWN0fSBlbGVtZW50IC0galF1ZXJ5IG9iamVjdCB0byBhZGQgdGhlIHRyaWdnZXIgdG8uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBPdmVycmlkZXMgdG8gdGhlIGRlZmF1bHQgcGx1Z2luIHNldHRpbmdzLlxyXG4gICAqL1xyXG4gIGZ1bmN0aW9uIFRvZ2dsZXIoZWxlbWVudCwgb3B0aW9ucykge1xyXG4gICAgdGhpcy4kZWxlbWVudCA9IGVsZW1lbnQ7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgVG9nZ2xlci5kZWZhdWx0cywgZWxlbWVudC5kYXRhKCksIG9wdGlvbnMpO1xyXG4gICAgdGhpcy5jbGFzc05hbWUgPSAnJztcclxuXHJcbiAgICB0aGlzLl9pbml0KCk7XHJcbiAgICB0aGlzLl9ldmVudHMoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgVG9nZ2xlci5kZWZhdWx0cyA9IHtcclxuICAgIC8qKlxyXG4gICAgICogVGVsbHMgdGhlIHBsdWdpbiBpZiB0aGUgZWxlbWVudCBzaG91bGQgYW5pbWF0ZWQgd2hlbiB0b2dnbGVkLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgZmFsc2VcclxuICAgICAqL1xyXG4gICAgYW5pbWF0ZTogZmFsc2VcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBJbml0aWFsaXplcyB0aGUgVG9nZ2xlciBwbHVnaW4gYnkgcGFyc2luZyB0aGUgdG9nZ2xlIGNsYXNzIGZyb20gZGF0YS10b2dnbGVyLCBvciBhbmltYXRpb24gY2xhc3NlcyBmcm9tIGRhdGEtYW5pbWF0ZS5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIFRvZ2dsZXIucHJvdG90eXBlLl9pbml0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICB2YXIgaW5wdXQ7XHJcbiAgICAvLyBQYXJzZSBhbmltYXRpb24gY2xhc3NlcyBpZiB0aGV5IHdlcmUgc2V0XHJcbiAgICBpZiAodGhpcy5vcHRpb25zLmFuaW1hdGUpIHtcclxuICAgICAgaW5wdXQgPSB0aGlzLm9wdGlvbnMuYW5pbWF0ZS5zcGxpdCgnICcpO1xyXG5cclxuICAgICAgdGhpcy5hbmltYXRpb25JbiA9IGlucHV0WzBdO1xyXG4gICAgICB0aGlzLmFuaW1hdGlvbk91dCA9IGlucHV0WzFdIHx8IG51bGw7XHJcbiAgICB9XHJcbiAgICAvLyBPdGhlcndpc2UsIHBhcnNlIHRvZ2dsZSBjbGFzc1xyXG4gICAgZWxzZSB7XHJcbiAgICAgIGlucHV0ID0gdGhpcy4kZWxlbWVudC5kYXRhKCd0b2dnbGVyJyk7XHJcbiAgICAgIC8vIEFsbG93IGZvciBhIC4gYXQgdGhlIGJlZ2lubmluZyBvZiB0aGUgc3RyaW5nXHJcbiAgICAgIHRoaXMuY2xhc3NOYW1lID0gaW5wdXRbMF0gPT09ICcuJyA/IGlucHV0LnNsaWNlKDEpIDogaW5wdXQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQWRkIEFSSUEgYXR0cmlidXRlcyB0byB0cmlnZ2Vyc1xyXG4gICAgdmFyIGlkID0gdGhpcy4kZWxlbWVudFswXS5pZDtcclxuICAgICQoJ1tkYXRhLW9wZW49XCInK2lkKydcIl0sIFtkYXRhLWNsb3NlPVwiJytpZCsnXCJdLCBbZGF0YS10b2dnbGU9XCInK2lkKydcIl0nKVxyXG4gICAgICAuYXR0cignYXJpYS1jb250cm9scycsIGlkKTtcclxuICAgIC8vIElmIHRoZSB0YXJnZXQgaXMgaGlkZGVuLCBhZGQgYXJpYS1oaWRkZW5cclxuICAgIHRoaXMuJGVsZW1lbnQuYXR0cignYXJpYS1leHBhbmRlZCcsIHRoaXMuJGVsZW1lbnQuaXMoJzpoaWRkZW4nKSA/IGZhbHNlIDogdHJ1ZSk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogSW5pdGlhbGl6ZXMgZXZlbnRzIGZvciB0aGUgdG9nZ2xlIHRyaWdnZXIuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBUb2dnbGVyLnByb3RvdHlwZS5fZXZlbnRzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50Lm9mZigndG9nZ2xlLnpmLnRyaWdnZXInKS5vbigndG9nZ2xlLnpmLnRyaWdnZXInLCB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBUb2dnbGVzIHRoZSB0YXJnZXQgY2xhc3Mgb24gdGhlIHRhcmdldCBlbGVtZW50LiBBbiBldmVudCBpcyBmaXJlZCBmcm9tIHRoZSBvcmlnaW5hbCB0cmlnZ2VyIGRlcGVuZGluZyBvbiBpZiB0aGUgcmVzdWx0YW50IHN0YXRlIHdhcyBcIm9uXCIgb3IgXCJvZmZcIi5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKiBAZmlyZXMgVG9nZ2xlciNvblxyXG4gICAqIEBmaXJlcyBUb2dnbGVyI29mZlxyXG4gICAqL1xyXG4gIFRvZ2dsZXIucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdGhpc1sgdGhpcy5vcHRpb25zLmFuaW1hdGUgPyAnX3RvZ2dsZUFuaW1hdGUnIDogJ190b2dnbGVDbGFzcyddKCk7XHJcbiAgfTtcclxuXHJcbiAgVG9nZ2xlci5wcm90b3R5cGUuX3RvZ2dsZUNsYXNzID0gZnVuY3Rpb24oKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50LnRvZ2dsZUNsYXNzKHRoaXMuY2xhc3NOYW1lKTtcclxuXHJcbiAgICB2YXIgaXNPbiA9IHRoaXMuJGVsZW1lbnQuaGFzQ2xhc3ModGhpcy5jbGFzc05hbWUpO1xyXG4gICAgaWYgKGlzT24pIHtcclxuICAgICAgLyoqXHJcbiAgICAgICAqIEZpcmVzIGlmIHRoZSB0YXJnZXQgZWxlbWVudCBoYXMgdGhlIGNsYXNzIGFmdGVyIGEgdG9nZ2xlLlxyXG4gICAgICAgKiBAZXZlbnQgVG9nZ2xlciNvblxyXG4gICAgICAgKi9cclxuICAgICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdvbi56Zi50b2dnbGVyJyk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgLyoqXHJcbiAgICAgICAqIEZpcmVzIGlmIHRoZSB0YXJnZXQgZWxlbWVudCBkb2VzIG5vdCBoYXZlIHRoZSBjbGFzcyBhZnRlciBhIHRvZ2dsZS5cclxuICAgICAgICogQGV2ZW50IFRvZ2dsZXIjb2ZmXHJcbiAgICAgICAqL1xyXG4gICAgICB0aGlzLiRlbGVtZW50LnRyaWdnZXIoJ29mZi56Zi50b2dnbGVyJyk7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy5fdXBkYXRlQVJJQShpc09uKTtcclxuICB9O1xyXG5cclxuICBUb2dnbGVyLnByb3RvdHlwZS5fdG9nZ2xlQW5pbWF0ZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuXHJcbiAgICBpZiAodGhpcy4kZWxlbWVudC5pcygnOmhpZGRlbicpKSB7XHJcbiAgICAgIEZvdW5kYXRpb24uTW90aW9uLmFuaW1hdGVJbih0aGlzLiRlbGVtZW50LCB0aGlzLmFuaW1hdGlvbkluLCBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnRyaWdnZXIoJ29uLnpmLnRvZ2dsZXInKTtcclxuICAgICAgICBfdGhpcy5fdXBkYXRlQVJJQSh0cnVlKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgICBlbHNlIHtcclxuICAgICAgRm91bmRhdGlvbi5Nb3Rpb24uYW5pbWF0ZU91dCh0aGlzLiRlbGVtZW50LCB0aGlzLmFuaW1hdGlvbk91dCwgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdvZmYuemYudG9nZ2xlcicpO1xyXG4gICAgICAgIF90aGlzLl91cGRhdGVBUklBKGZhbHNlKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgVG9nZ2xlci5wcm90b3R5cGUuX3VwZGF0ZUFSSUEgPSBmdW5jdGlvbihpc09uKSB7XHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBpc09uID8gdHJ1ZSA6IGZhbHNlKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBEZXN0cm95cyB0aGUgaW5zdGFuY2Ugb2YgVG9nZ2xlciBvbiB0aGUgZWxlbWVudC5cclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBUb2dnbGVyLnByb3RvdHlwZS5kZXN0cm95PSBmdW5jdGlvbigpIHtcclxuICAgIHRoaXMuJGVsZW1lbnQub2ZmKCcuemYudG9nZ2xlcicpO1xyXG4gICAgRm91bmRhdGlvbi51bnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH07XHJcblxyXG4gIEZvdW5kYXRpb24ucGx1Z2luKFRvZ2dsZXIsICdUb2dnbGVyJyk7XHJcblxyXG4gIC8vIEV4cG9ydHMgZm9yIEFNRC9Ccm93c2VyaWZ5XHJcbiAgaWYgKHR5cGVvZiBtb2R1bGUgIT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiBtb2R1bGUuZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpXHJcbiAgICBtb2R1bGUuZXhwb3J0cyA9IFRvZ2dsZXI7XHJcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicpXHJcbiAgICBkZWZpbmUoWydmb3VuZGF0aW9uJ10sIGZ1bmN0aW9uKCkge1xyXG4gICAgICByZXR1cm4gVG9nZ2xlcjtcclxuICAgIH0pO1xyXG5cclxufShGb3VuZGF0aW9uLCBqUXVlcnkpO1xyXG4iLCIvKipcclxuICogVG9vbHRpcCBtb2R1bGUuXHJcbiAqIEBtb2R1bGUgZm91bmRhdGlvbi50b29sdGlwXHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwuYm94XHJcbiAqIEByZXF1aXJlcyBmb3VuZGF0aW9uLnV0aWwudHJpZ2dlcnNcclxuICovXHJcbiFmdW5jdGlvbigkLCBkb2N1bWVudCwgRm91bmRhdGlvbil7XHJcbiAgJ3VzZSBzdHJpY3QnO1xyXG5cclxuICAvKipcclxuICAgKiBDcmVhdGVzIGEgbmV3IGluc3RhbmNlIG9mIGEgVG9vbHRpcC5cclxuICAgKiBAY2xhc3NcclxuICAgKiBAZmlyZXMgVG9vbHRpcCNpbml0XHJcbiAgICogQHBhcmFtIHtqUXVlcnl9IGVsZW1lbnQgLSBqUXVlcnkgb2JqZWN0IHRvIGF0dGFjaCBhIHRvb2x0aXAgdG8uXHJcbiAgICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnMgLSBvYmplY3QgdG8gZXh0ZW5kIHRoZSBkZWZhdWx0IGNvbmZpZ3VyYXRpb24uXHJcbiAgICovXHJcbiAgZnVuY3Rpb24gVG9vbHRpcChlbGVtZW50LCBvcHRpb25zKXtcclxuICAgIHRoaXMuJGVsZW1lbnQgPSBlbGVtZW50O1xyXG4gICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIFRvb2x0aXAuZGVmYXVsdHMsIHRoaXMuJGVsZW1lbnQuZGF0YSgpLCBvcHRpb25zKTtcclxuXHJcbiAgICB0aGlzLmlzQWN0aXZlID0gZmFsc2U7XHJcbiAgICB0aGlzLmlzQ2xpY2sgPSBmYWxzZTtcclxuICAgIHRoaXMuX2luaXQoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnJlZ2lzdGVyUGx1Z2luKHRoaXMpO1xyXG4gIH1cclxuXHJcbiAgVG9vbHRpcC5kZWZhdWx0cyA9IHtcclxuICAgIGRpc2FibGVGb3JUb3VjaDogZmFsc2UsXHJcbiAgICAvKipcclxuICAgICAqIFRpbWUsIGluIG1zLCBiZWZvcmUgYSB0b29sdGlwIHNob3VsZCBvcGVuIG9uIGhvdmVyLlxyXG4gICAgICogQG9wdGlvblxyXG4gICAgICogQGV4YW1wbGUgMjAwXHJcbiAgICAgKi9cclxuICAgIGhvdmVyRGVsYXk6IDIwMCxcclxuICAgIC8qKlxyXG4gICAgICogVGltZSwgaW4gbXMsIGEgdG9vbHRpcCBzaG91bGQgdGFrZSB0byBmYWRlIGludG8gdmlldy5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIDE1MFxyXG4gICAgICovXHJcbiAgICBmYWRlSW5EdXJhdGlvbjogMTUwLFxyXG4gICAgLyoqXHJcbiAgICAgKiBUaW1lLCBpbiBtcywgYSB0b29sdGlwIHNob3VsZCB0YWtlIHRvIGZhZGUgb3V0IG9mIHZpZXcuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAxNTBcclxuICAgICAqL1xyXG4gICAgZmFkZU91dER1cmF0aW9uOiAxNTAsXHJcbiAgICAvKipcclxuICAgICAqIERpc2FibGVzIGhvdmVyIGV2ZW50cyBmcm9tIG9wZW5pbmcgdGhlIHRvb2x0aXAgaWYgc2V0IHRvIHRydWVcclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIGZhbHNlXHJcbiAgICAgKi9cclxuICAgIGRpc2FibGVIb3ZlcjogZmFsc2UsXHJcbiAgICAvKipcclxuICAgICAqIE9wdGlvbmFsIGFkZHRpb25hbCBjbGFzc2VzIHRvIGFwcGx5IHRvIHRoZSB0b29sdGlwIHRlbXBsYXRlIG9uIGluaXQuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnbXktY29vbC10aXAtY2xhc3MnXHJcbiAgICAgKi9cclxuICAgIHRlbXBsYXRlQ2xhc3NlczogJycsXHJcbiAgICAvKipcclxuICAgICAqIE5vbi1vcHRpb25hbCBjbGFzcyBhZGRlZCB0byB0b29sdGlwIHRlbXBsYXRlcy4gRm91bmRhdGlvbiBkZWZhdWx0IGlzICd0b29sdGlwJy5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICd0b29sdGlwJ1xyXG4gICAgICovXHJcbiAgICB0b29sdGlwQ2xhc3M6ICd0b29sdGlwJyxcclxuICAgIC8qKlxyXG4gICAgICogQ2xhc3MgYXBwbGllZCB0byB0aGUgdG9vbHRpcCBhbmNob3IgZWxlbWVudC5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICdoYXMtdGlwJ1xyXG4gICAgICovXHJcbiAgICB0cmlnZ2VyQ2xhc3M6ICdoYXMtdGlwJyxcclxuICAgIC8qKlxyXG4gICAgICogTWluaW11bSBicmVha3BvaW50IHNpemUgYXQgd2hpY2ggdG8gb3BlbiB0aGUgdG9vbHRpcC5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICdzbWFsbCdcclxuICAgICAqL1xyXG4gICAgc2hvd09uOiAnc21hbGwnLFxyXG4gICAgLyoqXHJcbiAgICAgKiBDdXN0b20gdGVtcGxhdGUgdG8gYmUgdXNlZCB0byBnZW5lcmF0ZSBtYXJrdXAgZm9yIHRvb2x0aXAuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAnPGRpdiBjbGFzcz1cInRvb2x0aXBcIj48L2Rpdj4nXHJcbiAgICAgKi9cclxuICAgIHRlbXBsYXRlOiAnJyxcclxuICAgIC8qKlxyXG4gICAgICogVGV4dCBkaXNwbGF5ZWQgaW4gdGhlIHRvb2x0aXAgdGVtcGxhdGUgb24gb3Blbi5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICdTb21lIGNvb2wgc3BhY2UgZmFjdCBoZXJlLidcclxuICAgICAqL1xyXG4gICAgdGlwVGV4dDogJycsXHJcbiAgICB0b3VjaENsb3NlVGV4dDogJ1RhcCB0byBjbG9zZS4nLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBbGxvd3MgdGhlIHRvb2x0aXAgdG8gcmVtYWluIG9wZW4gaWYgdHJpZ2dlcmVkIHdpdGggYSBjbGljayBvciB0b3VjaCBldmVudC5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIHRydWVcclxuICAgICAqL1xyXG4gICAgY2xpY2tPcGVuOiB0cnVlLFxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGRpdGlvbmFsIHBvc2l0aW9uaW5nIGNsYXNzZXMsIHNldCBieSB0aGUgSlNcclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlICd0b3AnXHJcbiAgICAgKi9cclxuICAgIHBvc2l0aW9uQ2xhc3M6ICcnLFxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXN0YW5jZSwgaW4gcGl4ZWxzLCB0aGUgdGVtcGxhdGUgc2hvdWxkIHB1c2ggYXdheSBmcm9tIHRoZSBhbmNob3Igb24gdGhlIFkgYXhpcy5cclxuICAgICAqIEBvcHRpb25cclxuICAgICAqIEBleGFtcGxlIDEwXHJcbiAgICAgKi9cclxuICAgIHZPZmZzZXQ6IDEwLFxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXN0YW5jZSwgaW4gcGl4ZWxzLCB0aGUgdGVtcGxhdGUgc2hvdWxkIHB1c2ggYXdheSBmcm9tIHRoZSBhbmNob3Igb24gdGhlIFggYXhpcywgaWYgYWxpZ25lZCB0byBhIHNpZGUuXHJcbiAgICAgKiBAb3B0aW9uXHJcbiAgICAgKiBAZXhhbXBsZSAxMlxyXG4gICAgICovXHJcbiAgICBoT2Zmc2V0OiAxMlxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEluaXRpYWxpemVzIHRoZSB0b29sdGlwIGJ5IHNldHRpbmcgdGhlIGNyZWF0aW5nIHRoZSB0aXAgZWxlbWVudCwgYWRkaW5nIGl0J3MgdGV4dCwgc2V0dGluZyBwcml2YXRlIHZhcmlhYmxlcyBhbmQgc2V0dGluZyBhdHRyaWJ1dGVzIG9uIHRoZSBhbmNob3IuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBUb29sdGlwLnByb3RvdHlwZS5faW5pdCA9IGZ1bmN0aW9uKCl7XHJcbiAgICB2YXIgZWxlbUlkID0gdGhpcy4kZWxlbWVudC5hdHRyKCdhcmlhLWRlc2NyaWJlZGJ5JykgfHwgRm91bmRhdGlvbi5HZXRZb0RpZ2l0cyg2LCAndG9vbHRpcCcpO1xyXG5cclxuICAgIHRoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzID0gdGhpcy5fZ2V0UG9zaXRpb25DbGFzcyh0aGlzLiRlbGVtZW50KTtcclxuICAgIHRoaXMub3B0aW9ucy50aXBUZXh0ID0gdGhpcy5vcHRpb25zLnRpcFRleHQgfHwgdGhpcy4kZWxlbWVudC5hdHRyKCd0aXRsZScpO1xyXG4gICAgdGhpcy50ZW1wbGF0ZSA9IHRoaXMub3B0aW9ucy50ZW1wbGF0ZSA/ICQodGhpcy5vcHRpb25zLnRlbXBsYXRlKSA6IHRoaXMuX2J1aWxkVGVtcGxhdGUoZWxlbUlkKTtcclxuXHJcbiAgICB0aGlzLnRlbXBsYXRlLmFwcGVuZFRvKGRvY3VtZW50LmJvZHkpXHJcbiAgICAgICAgLnRleHQodGhpcy5vcHRpb25zLnRpcFRleHQpXHJcbiAgICAgICAgLmhpZGUoKTtcclxuXHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoe1xyXG4gICAgICAndGl0bGUnOiAnJyxcclxuICAgICAgJ2FyaWEtZGVzY3JpYmVkYnknOiBlbGVtSWQsXHJcbiAgICAgICdkYXRhLXlldGktYm94JzogZWxlbUlkLFxyXG4gICAgICAnZGF0YS10b2dnbGUnOiBlbGVtSWQsXHJcbiAgICAgICdkYXRhLXJlc2l6ZSc6IGVsZW1JZFxyXG4gICAgfSkuYWRkQ2xhc3ModGhpcy50cmlnZ2VyQ2xhc3MpO1xyXG5cclxuICAgIC8vaGVscGVyIHZhcmlhYmxlcyB0byB0cmFjayBtb3ZlbWVudCBvbiBjb2xsaXNpb25zXHJcbiAgICB0aGlzLnVzZWRQb3NpdGlvbnMgPSBbXTtcclxuICAgIHRoaXMuY291bnRlciA9IDQ7XHJcbiAgICB0aGlzLmNsYXNzQ2hhbmdlZCA9IGZhbHNlO1xyXG5cclxuICAgIHRoaXMuX2V2ZW50cygpO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEdyYWJzIHRoZSBjdXJyZW50IHBvc2l0aW9uaW5nIGNsYXNzLCBpZiBwcmVzZW50LCBhbmQgcmV0dXJucyB0aGUgdmFsdWUgb3IgYW4gZW1wdHkgc3RyaW5nLlxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgVG9vbHRpcC5wcm90b3R5cGUuX2dldFBvc2l0aW9uQ2xhc3MgPSBmdW5jdGlvbihlbGVtZW50KXtcclxuICAgIGlmKCFlbGVtZW50KXsgcmV0dXJuICcnOyB9XHJcbiAgICAvLyB2YXIgcG9zaXRpb24gPSBlbGVtZW50LmF0dHIoJ2NsYXNzJykubWF0Y2goL3RvcHxsZWZ0fHJpZ2h0L2cpO1xyXG4gICAgdmFyIHBvc2l0aW9uID0gZWxlbWVudFswXS5jbGFzc05hbWUubWF0Y2goLyh0b3B8bGVmdHxyaWdodCkvZyk7XHJcbiAgICAgICAgcG9zaXRpb24gPSBwb3NpdGlvbiA/IHBvc2l0aW9uWzBdIDogJyc7XHJcbiAgICByZXR1cm4gcG9zaXRpb247XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBidWlsZHMgdGhlIHRvb2x0aXAgZWxlbWVudCwgYWRkcyBhdHRyaWJ1dGVzLCBhbmQgcmV0dXJucyB0aGUgdGVtcGxhdGUuXHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBUb29sdGlwLnByb3RvdHlwZS5fYnVpbGRUZW1wbGF0ZSA9IGZ1bmN0aW9uKGlkKXtcclxuICAgIHZhciB0ZW1wbGF0ZUNsYXNzZXMgPSAodGhpcy5vcHRpb25zLnRvb2x0aXBDbGFzcyArICcgJyArIHRoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzKS50cmltKCk7XHJcbiAgICB2YXIgJHRlbXBsYXRlID0gICQoJzxkaXY+PC9kaXY+JykuYWRkQ2xhc3ModGVtcGxhdGVDbGFzc2VzKS5hdHRyKHtcclxuICAgICAgJ3JvbGUnOiAndG9vbHRpcCcsXHJcbiAgICAgICdhcmlhLWhpZGRlbic6IHRydWUsXHJcbiAgICAgICdkYXRhLWlzLWFjdGl2ZSc6IGZhbHNlLFxyXG4gICAgICAnZGF0YS1pcy1mb2N1cyc6IGZhbHNlLFxyXG4gICAgICAnaWQnOiBpZFxyXG4gICAgfSk7XHJcbiAgICByZXR1cm4gJHRlbXBsYXRlO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIEZ1bmN0aW9uIHRoYXQgZ2V0cyBjYWxsZWQgaWYgYSBjb2xsaXNpb24gZXZlbnQgaXMgZGV0ZWN0ZWQuXHJcbiAgICogQHBhcmFtIHtTdHJpbmd9IHBvc2l0aW9uIC0gcG9zaXRpb25pbmcgY2xhc3MgdG8gdHJ5XHJcbiAgICogQHByaXZhdGVcclxuICAgKi9cclxuICBUb29sdGlwLnByb3RvdHlwZS5fcmVwb3NpdGlvbiA9IGZ1bmN0aW9uKHBvc2l0aW9uKXtcclxuICAgIHRoaXMudXNlZFBvc2l0aW9ucy5wdXNoKHBvc2l0aW9uID8gcG9zaXRpb24gOiAnYm90dG9tJyk7XHJcblxyXG4gICAgLy9kZWZhdWx0LCB0cnkgc3dpdGNoaW5nIHRvIG9wcG9zaXRlIHNpZGVcclxuICAgIGlmKCFwb3NpdGlvbiAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ3RvcCcpIDwgMCkpe1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLmFkZENsYXNzKCd0b3AnKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAnbGVmdCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdyaWdodCcpIDwgMCkpe1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxyXG4gICAgICAgICAgLmFkZENsYXNzKCdyaWdodCcpO1xyXG4gICAgfWVsc2UgaWYocG9zaXRpb24gPT09ICdyaWdodCcgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XHJcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pXHJcbiAgICAgICAgICAuYWRkQ2xhc3MoJ2xlZnQnKTtcclxuICAgIH1cclxuXHJcbiAgICAvL2lmIGRlZmF1bHQgY2hhbmdlIGRpZG4ndCB3b3JrLCB0cnkgYm90dG9tIG9yIGxlZnQgZmlyc3RcclxuICAgIGVsc2UgaWYoIXBvc2l0aW9uICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigndG9wJykgPiAtMSkgJiYgKHRoaXMudXNlZFBvc2l0aW9ucy5pbmRleE9mKCdsZWZ0JykgPCAwKSl7XHJcbiAgICAgIHRoaXMudGVtcGxhdGUuYWRkQ2xhc3MoJ2xlZnQnKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAndG9wJyAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpIDwgMCkpe1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKVxyXG4gICAgICAgICAgLmFkZENsYXNzKCdsZWZ0Jyk7XHJcbiAgICB9ZWxzZSBpZihwb3NpdGlvbiA9PT0gJ2xlZnQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZigncmlnaHQnKSA+IC0xKSAmJiAodGhpcy51c2VkUG9zaXRpb25zLmluZGV4T2YoJ2JvdHRvbScpIDwgMCkpe1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLnJlbW92ZUNsYXNzKHBvc2l0aW9uKTtcclxuICAgIH1lbHNlIGlmKHBvc2l0aW9uID09PSAncmlnaHQnICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignbGVmdCcpID4gLTEpICYmICh0aGlzLnVzZWRQb3NpdGlvbnMuaW5kZXhPZignYm90dG9tJykgPCAwKSl7XHJcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xyXG4gICAgfVxyXG4gICAgLy9pZiBub3RoaW5nIGNsZWFyZWQsIHNldCB0byBib3R0b21cclxuICAgIGVsc2V7XHJcbiAgICAgIHRoaXMudGVtcGxhdGUucmVtb3ZlQ2xhc3MocG9zaXRpb24pO1xyXG4gICAgfVxyXG4gICAgdGhpcy5jbGFzc0NoYW5nZWQgPSB0cnVlO1xyXG4gICAgdGhpcy5jb3VudGVyLS07XHJcblxyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIHNldHMgdGhlIHBvc2l0aW9uIGNsYXNzIG9mIGFuIGVsZW1lbnQgYW5kIHJlY3Vyc2l2ZWx5IGNhbGxzIGl0c2VsZiB1bnRpbCB0aGVyZSBhcmUgbm8gbW9yZSBwb3NzaWJsZSBwb3NpdGlvbnMgdG8gYXR0ZW1wdCwgb3IgdGhlIHRvb2x0aXAgZWxlbWVudCBpcyBubyBsb25nZXIgY29sbGlkaW5nLlxyXG4gICAqIGlmIHRoZSB0b29sdGlwIGlzIGxhcmdlciB0aGFuIHRoZSBzY3JlZW4gd2lkdGgsIGRlZmF1bHQgdG8gZnVsbCB3aWR0aCAtIGFueSB1c2VyIHNlbGVjdGVkIG1hcmdpblxyXG4gICAqIEBwcml2YXRlXHJcbiAgICovXHJcbiAgVG9vbHRpcC5wcm90b3R5cGUuX3NldFBvc2l0aW9uID0gZnVuY3Rpb24oKXtcclxuICAgIHZhciBwb3NpdGlvbiA9IHRoaXMuX2dldFBvc2l0aW9uQ2xhc3ModGhpcy50ZW1wbGF0ZSksXHJcbiAgICAgICAgJHRpcERpbXMgPSBGb3VuZGF0aW9uLkJveC5HZXREaW1lbnNpb25zKHRoaXMudGVtcGxhdGUpLFxyXG4gICAgICAgICRhbmNob3JEaW1zID0gRm91bmRhdGlvbi5Cb3guR2V0RGltZW5zaW9ucyh0aGlzLiRlbGVtZW50KSxcclxuICAgICAgICBkaXJlY3Rpb24gPSAocG9zaXRpb24gPT09ICdsZWZ0JyA/ICdsZWZ0JyA6ICgocG9zaXRpb24gPT09ICdyaWdodCcpID8gJ2xlZnQnIDogJ3RvcCcpKSxcclxuICAgICAgICBwYXJhbSA9IChkaXJlY3Rpb24gPT09ICd0b3AnKSA/ICdoZWlnaHQnIDogJ3dpZHRoJyxcclxuICAgICAgICBvZmZzZXQgPSAocGFyYW0gPT09ICdoZWlnaHQnKSA/IHRoaXMub3B0aW9ucy52T2Zmc2V0IDogdGhpcy5vcHRpb25zLmhPZmZzZXQsXHJcbiAgICAgICAgX3RoaXMgPSB0aGlzO1xyXG5cclxuICAgIGlmKCgkdGlwRGltcy53aWR0aCA+PSAkdGlwRGltcy53aW5kb3dEaW1zLndpZHRoKSB8fCAoIXRoaXMuY291bnRlciAmJiAhRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLnRlbXBsYXRlKSkpe1xyXG4gICAgICB0aGlzLnRlbXBsYXRlLm9mZnNldChGb3VuZGF0aW9uLkJveC5HZXRPZmZzZXRzKHRoaXMudGVtcGxhdGUsIHRoaXMuJGVsZW1lbnQsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcclxuICAgICAgLy8gdGhpcy4kZWxlbWVudC5vZmZzZXQoRm91bmRhdGlvbi5HZXRPZmZzZXRzKHRoaXMudGVtcGxhdGUsIHRoaXMuJGVsZW1lbnQsICdjZW50ZXIgYm90dG9tJywgdGhpcy5vcHRpb25zLnZPZmZzZXQsIHRoaXMub3B0aW9ucy5oT2Zmc2V0LCB0cnVlKSkuY3NzKHtcclxuICAgICAgICAnd2lkdGgnOiAkYW5jaG9yRGltcy53aW5kb3dEaW1zLndpZHRoIC0gKHRoaXMub3B0aW9ucy5oT2Zmc2V0ICogMiksXHJcbiAgICAgICAgJ2hlaWdodCc6ICdhdXRvJ1xyXG4gICAgICB9KTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMudGVtcGxhdGUub2Zmc2V0KEZvdW5kYXRpb24uQm94LkdldE9mZnNldHModGhpcy50ZW1wbGF0ZSwgdGhpcy4kZWxlbWVudCwnY2VudGVyICcgKyAocG9zaXRpb24gfHwgJ2JvdHRvbScpLCB0aGlzLm9wdGlvbnMudk9mZnNldCwgdGhpcy5vcHRpb25zLmhPZmZzZXQpKTtcclxuXHJcbiAgICB3aGlsZSghRm91bmRhdGlvbi5Cb3guSW1Ob3RUb3VjaGluZ1lvdSh0aGlzLnRlbXBsYXRlKSAmJiB0aGlzLmNvdW50ZXIpe1xyXG4gICAgICB0aGlzLl9yZXBvc2l0aW9uKHBvc2l0aW9uKTtcclxuICAgICAgdGhpcy5fc2V0UG9zaXRpb24oKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiByZXZlYWxzIHRoZSB0b29sdGlwLCBhbmQgZmlyZXMgYW4gZXZlbnQgdG8gY2xvc2UgYW55IG90aGVyIG9wZW4gdG9vbHRpcHMgb24gdGhlIHBhZ2VcclxuICAgKiBAZmlyZXMgQ2xvc2VtZSN0b29sdGlwXHJcbiAgICogQGZpcmVzIFRvb2x0aXAjc2hvd1xyXG4gICAqIEBmdW5jdGlvblxyXG4gICAqL1xyXG4gIFRvb2x0aXAucHJvdG90eXBlLnNob3cgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5vcHRpb25zLnNob3dPbiAhPT0gJ2FsbCcgJiYgIUZvdW5kYXRpb24uTWVkaWFRdWVyeS5hdExlYXN0KHRoaXMub3B0aW9ucy5zaG93T24pKXtcclxuICAgICAgLy8gY29uc29sZS5lcnJvcignVGhlIHNjcmVlbiBpcyB0b28gc21hbGwgdG8gZGlzcGxheSB0aGlzIHRvb2x0aXAnKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBfdGhpcyA9IHRoaXM7XHJcbiAgICB0aGlzLnRlbXBsYXRlLmNzcygndmlzaWJpbGl0eScsICdoaWRkZW4nKS5zaG93KCk7XHJcbiAgICB0aGlzLl9zZXRQb3NpdGlvbigpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRmlyZXMgdG8gY2xvc2UgYWxsIG90aGVyIG9wZW4gdG9vbHRpcHMgb24gdGhlIHBhZ2VcclxuICAgICAqIEBldmVudCBDbG9zZW1lI3Rvb2x0aXBcclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdjbG9zZW1lLnpmLnRvb2x0aXAnLCB0aGlzLnRlbXBsYXRlLmF0dHIoJ2lkJykpO1xyXG5cclxuXHJcbiAgICB0aGlzLnRlbXBsYXRlLmF0dHIoe1xyXG4gICAgICAnZGF0YS1pcy1hY3RpdmUnOiB0cnVlLFxyXG4gICAgICAnYXJpYS1oaWRkZW4nOiBmYWxzZVxyXG4gICAgfSk7XHJcbiAgICBfdGhpcy5pc0FjdGl2ZSA9IHRydWU7XHJcbiAgICAvLyBjb25zb2xlLmxvZyh0aGlzLnRlbXBsYXRlKTtcclxuICAgIHRoaXMudGVtcGxhdGUuc3RvcCgpLmhpZGUoKS5jc3MoJ3Zpc2liaWxpdHknLCAnJykuZmFkZUluKHRoaXMub3B0aW9ucy5mYWRlSW5EdXJhdGlvbiwgZnVuY3Rpb24oKXtcclxuICAgICAgLy9tYXliZSBkbyBzdHVmZj9cclxuICAgIH0pO1xyXG4gICAgLyoqXHJcbiAgICAgKiBGaXJlcyB3aGVuIHRoZSB0b29sdGlwIGlzIHNob3duXHJcbiAgICAgKiBAZXZlbnQgVG9vbHRpcCNzaG93XHJcbiAgICAgKi9cclxuICAgIHRoaXMuJGVsZW1lbnQudHJpZ2dlcignc2hvdy56Zi50b29sdGlwJyk7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogSGlkZXMgdGhlIGN1cnJlbnQgdG9vbHRpcCwgYW5kIHJlc2V0cyB0aGUgcG9zaXRpb25pbmcgY2xhc3MgaWYgaXQgd2FzIGNoYW5nZWQgZHVlIHRvIGNvbGxpc2lvblxyXG4gICAqIEBmaXJlcyBUb29sdGlwI2hpZGVcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBUb29sdGlwLnByb3RvdHlwZS5oaWRlID0gZnVuY3Rpb24oKXtcclxuICAgIC8vIGNvbnNvbGUubG9nKCdoaWRpbmcnLCB0aGlzLiRlbGVtZW50LmRhdGEoJ3lldGktYm94JykpO1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHRoaXMudGVtcGxhdGUuc3RvcCgpLmF0dHIoe1xyXG4gICAgICAnYXJpYS1oaWRkZW4nOiB0cnVlLFxyXG4gICAgICAnZGF0YS1pcy1hY3RpdmUnOiBmYWxzZVxyXG4gICAgfSkuZmFkZU91dCh0aGlzLm9wdGlvbnMuZmFkZU91dER1cmF0aW9uLCBmdW5jdGlvbigpe1xyXG4gICAgICBfdGhpcy5pc0FjdGl2ZSA9IGZhbHNlO1xyXG4gICAgICBfdGhpcy5pc0NsaWNrID0gZmFsc2U7XHJcbiAgICAgIGlmKF90aGlzLmNsYXNzQ2hhbmdlZCl7XHJcbiAgICAgICAgX3RoaXMudGVtcGxhdGVcclxuICAgICAgICAgICAgIC5yZW1vdmVDbGFzcyhfdGhpcy5fZ2V0UG9zaXRpb25DbGFzcyhfdGhpcy50ZW1wbGF0ZSkpXHJcbiAgICAgICAgICAgICAuYWRkQ2xhc3MoX3RoaXMub3B0aW9ucy5wb3NpdGlvbkNsYXNzKTtcclxuXHJcbiAgICAgICBfdGhpcy51c2VkUG9zaXRpb25zID0gW107XHJcbiAgICAgICBfdGhpcy5jb3VudGVyID0gNDtcclxuICAgICAgIF90aGlzLmNsYXNzQ2hhbmdlZCA9IGZhbHNlO1xyXG4gICAgICB9XHJcbiAgICB9KTtcclxuICAgIC8qKlxyXG4gICAgICogZmlyZXMgd2hlbiB0aGUgdG9vbHRpcCBpcyBoaWRkZW5cclxuICAgICAqIEBldmVudCBUb29sdGlwI2hpZGVcclxuICAgICAqL1xyXG4gICAgdGhpcy4kZWxlbWVudC50cmlnZ2VyKCdoaWRlLnpmLnRvb2x0aXAnKTtcclxuICB9O1xyXG5cclxuICAvKipcclxuICAgKiBhZGRzIGV2ZW50IGxpc3RlbmVycyBmb3IgdGhlIHRvb2x0aXAgYW5kIGl0cyBhbmNob3JcclxuICAgKiBUT0RPIGNvbWJpbmUgc29tZSBvZiB0aGUgbGlzdGVuZXJzIGxpa2UgZm9jdXMgYW5kIG1vdXNlZW50ZXIsIGV0Yy5cclxuICAgKiBAcHJpdmF0ZVxyXG4gICAqL1xyXG4gIFRvb2x0aXAucHJvdG90eXBlLl9ldmVudHMgPSBmdW5jdGlvbigpe1xyXG4gICAgdmFyIF90aGlzID0gdGhpcztcclxuICAgIHZhciAkdGVtcGxhdGUgPSB0aGlzLnRlbXBsYXRlO1xyXG4gICAgdmFyIGlzRm9jdXMgPSBmYWxzZTtcclxuXHJcbiAgICBpZighdGhpcy5vcHRpb25zLmRpc2FibGVIb3Zlcil7XHJcblxyXG4gICAgICB0aGlzLiRlbGVtZW50XHJcbiAgICAgIC5vbignbW91c2VlbnRlci56Zi50b29sdGlwJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgaWYoIV90aGlzLmlzQWN0aXZlKXtcclxuICAgICAgICAgIF90aGlzLnRpbWVvdXQgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIF90aGlzLnNob3coKTtcclxuICAgICAgICAgIH0sIF90aGlzLm9wdGlvbnMuaG92ZXJEZWxheSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KVxyXG4gICAgICAub24oJ21vdXNlbGVhdmUuemYudG9vbHRpcCcsIGZ1bmN0aW9uKGUpe1xyXG4gICAgICAgIGNsZWFyVGltZW91dChfdGhpcy50aW1lb3V0KTtcclxuICAgICAgICBpZighaXNGb2N1cyB8fCAoIV90aGlzLmlzQ2xpY2sgJiYgX3RoaXMub3B0aW9ucy5jbGlja09wZW4pKXtcclxuICAgICAgICAgIF90aGlzLmhpZGUoKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG4gICAgaWYodGhpcy5vcHRpb25zLmNsaWNrT3Blbil7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnQub24oJ21vdXNlZG93bi56Zi50b29sdGlwJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcclxuICAgICAgICBpZihfdGhpcy5pc0NsaWNrKXtcclxuICAgICAgICAgIF90aGlzLmhpZGUoKTtcclxuICAgICAgICAgIC8vIF90aGlzLmlzQ2xpY2sgPSBmYWxzZTtcclxuICAgICAgICB9ZWxzZXtcclxuICAgICAgICAgIF90aGlzLmlzQ2xpY2sgPSB0cnVlO1xyXG4gICAgICAgICAgaWYoKF90aGlzLm9wdGlvbnMuZGlzYWJsZUhvdmVyIHx8ICFfdGhpcy4kZWxlbWVudC5hdHRyKCd0YWJpbmRleCcpKSAmJiAhX3RoaXMuaXNBY3RpdmUpe1xyXG4gICAgICAgICAgICBfdGhpcy5zaG93KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBpZighdGhpcy5vcHRpb25zLmRpc2FibGVGb3JUb3VjaCl7XHJcbiAgICAgIHRoaXMuJGVsZW1lbnRcclxuICAgICAgLm9uKCd0YXAuemYudG9vbHRpcCB0b3VjaGVuZC56Zi50b29sdGlwJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgX3RoaXMuaXNBY3RpdmUgPyBfdGhpcy5oaWRlKCkgOiBfdGhpcy5zaG93KCk7XHJcbiAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIHRoaXMuJGVsZW1lbnQub24oe1xyXG4gICAgICAvLyAndG9nZ2xlLnpmLnRyaWdnZXInOiB0aGlzLnRvZ2dsZS5iaW5kKHRoaXMpLFxyXG4gICAgICAvLyAnY2xvc2UuemYudHJpZ2dlcic6IHRoaXMuaGlkZS5iaW5kKHRoaXMpXHJcbiAgICAgICdjbG9zZS56Zi50cmlnZ2VyJzogdGhpcy5oaWRlLmJpbmQodGhpcylcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuJGVsZW1lbnRcclxuICAgICAgLm9uKCdmb2N1cy56Zi50b29sdGlwJywgZnVuY3Rpb24oZSl7XHJcbiAgICAgICAgaXNGb2N1cyA9IHRydWU7XHJcbiAgICAgICAgY29uc29sZS5sb2coX3RoaXMuaXNDbGljayk7XHJcbiAgICAgICAgaWYoX3RoaXMuaXNDbGljayl7XHJcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfWVsc2V7XHJcbiAgICAgICAgICAvLyAkKHdpbmRvdylcclxuICAgICAgICAgIF90aGlzLnNob3coKTtcclxuICAgICAgICB9XHJcbiAgICAgIH0pXHJcblxyXG4gICAgICAub24oJ2ZvY3Vzb3V0LnpmLnRvb2x0aXAnLCBmdW5jdGlvbihlKXtcclxuICAgICAgICBpc0ZvY3VzID0gZmFsc2U7XHJcbiAgICAgICAgX3RoaXMuaXNDbGljayA9IGZhbHNlO1xyXG4gICAgICAgIF90aGlzLmhpZGUoKTtcclxuICAgICAgfSlcclxuXHJcbiAgICAgIC5vbigncmVzaXplbWUuemYudHJpZ2dlcicsIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgaWYoX3RoaXMuaXNBY3RpdmUpe1xyXG4gICAgICAgICAgX3RoaXMuX3NldFBvc2l0aW9uKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICB9O1xyXG4gIC8qKlxyXG4gICAqIGFkZHMgYSB0b2dnbGUgbWV0aG9kLCBpbiBhZGRpdGlvbiB0byB0aGUgc3RhdGljIHNob3coKSAmIGhpZGUoKSBmdW5jdGlvbnNcclxuICAgKiBAZnVuY3Rpb25cclxuICAgKi9cclxuICBUb29sdGlwLnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbigpe1xyXG4gICAgaWYodGhpcy5pc0FjdGl2ZSl7XHJcbiAgICAgIHRoaXMuaGlkZSgpO1xyXG4gICAgfWVsc2V7XHJcbiAgICAgIHRoaXMuc2hvdygpO1xyXG4gICAgfVxyXG4gIH07XHJcbiAgLyoqXHJcbiAgICogRGVzdHJveXMgYW4gaW5zdGFuY2Ugb2YgdG9vbHRpcCwgcmVtb3ZlcyB0ZW1wbGF0ZSBlbGVtZW50IGZyb20gdGhlIHZpZXcuXHJcbiAgICogQGZ1bmN0aW9uXHJcbiAgICovXHJcbiAgVG9vbHRpcC5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCl7XHJcbiAgICB0aGlzLiRlbGVtZW50LmF0dHIoJ3RpdGxlJywgdGhpcy50ZW1wbGF0ZS50ZXh0KCkpXHJcbiAgICAgICAgICAgICAgICAgLm9mZignLnpmLnRyaWdnZXIgLnpmLnRvb3RpcCcpXHJcbiAgICAgICAgICAgICAgICAvLyAgLnJlbW92ZUNsYXNzKCdoYXMtdGlwJylcclxuICAgICAgICAgICAgICAgICAucmVtb3ZlQXR0cignYXJpYS1kZXNjcmliZWRieScpXHJcbiAgICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEteWV0aS1ib3gnKVxyXG4gICAgICAgICAgICAgICAgIC5yZW1vdmVBdHRyKCdkYXRhLXRvZ2dsZScpXHJcbiAgICAgICAgICAgICAgICAgLnJlbW92ZUF0dHIoJ2RhdGEtcmVzaXplJyk7XHJcblxyXG4gICAgdGhpcy50ZW1wbGF0ZS5yZW1vdmUoKTtcclxuXHJcbiAgICBGb3VuZGF0aW9uLnVucmVnaXN0ZXJQbHVnaW4odGhpcyk7XHJcbiAgfTtcclxuICAvKipcclxuICAgKiBUT0RPIHV0aWxpemUgcmVzaXplIGV2ZW50IHRyaWdnZXJcclxuICAgKi9cclxuXHJcbiAgRm91bmRhdGlvbi5wbHVnaW4oVG9vbHRpcCwgJ1Rvb2x0aXAnKTtcclxufShqUXVlcnksIHdpbmRvdy5kb2N1bWVudCwgd2luZG93LkZvdW5kYXRpb24pO1xyXG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
