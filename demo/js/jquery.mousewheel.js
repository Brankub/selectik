/*! Copyright (c) 2013 Brandon Aaron (http://brandonaaron.net)
* Licensed under the MIT License (LICENSE.txt).
*
* Thanks to: http://adomas.org/javascript-mouse-wheel/ for some pointers.
* Thanks to: Mathias Bank(http://www.mathias-bank.de) for a scope bug fix.
* Thanks to: Seamus Leahy for adding deltaX and deltaY
*
* Version: 3.1.3
*
* Requires: 1.2.2+
*/
(function(c){"function"===typeof define&&define.amd?define(["jquery"],c):"object"===typeof exports?module.exports=c:c(jQuery)})(function(c){function m(b){var a=b||window.event,g=[].slice.call(arguments,1),d=0,e=0,h=0,f=0,f=0;b=c.event.fix(a);b.type="mousewheel";a.wheelDelta&&(d=a.wheelDelta);a.detail&&(d=-1*a.detail);a.deltaY&&(d=h=-1*a.deltaY);a.deltaX&&(e=a.deltaX,d=-1*e);void 0!==a.wheelDeltaY&&(h=a.wheelDeltaY);void 0!==a.wheelDeltaX&&(e=-1*a.wheelDeltaX);f=Math.abs(d);if(!l||f<l)l=f;f=Math.max(Math.abs(h), Math.abs(e));if(!k||f<k)k=f;a=0<d?"floor":"ceil";d=Math[a](d/l);e=Math[a](e/k);h=Math[a](h/k);g.unshift(b,d,e,h);return(c.event.dispatch||c.event.handle).apply(this,g)}var n=["wheel","mousewheel","DOMMouseScroll","MozMousePixelScroll"],g="onwheel"in document||9<=document.documentMode?["wheel"]:["mousewheel","DomMouseScroll","MozMousePixelScroll"],l,k;if(c.event.fixHooks)for(var p=n.length;p;)c.event.fixHooks[n[--p]]=c.event.mouseHooks;c.event.special.mousewheel={setup:function(){if(this.addEventListener)for(var b= g.length;b;)this.addEventListener(g[--b],m,!1);else this.onmousewheel=m},teardown:function(){if(this.removeEventListener)for(var b=g.length;b;)this.removeEventListener(g[--b],m,!1);else this.onmousewheel=null}};c.fn.extend({mousewheel:function(b){return b?this.bind("mousewheel",b):this.trigger("mousewheel")},unmousewheel:function(b){return this.unbind("mousewheel",b)}})});