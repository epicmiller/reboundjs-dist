// jshint ignore: start
/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/
;if("document" in self&&!("classList" in document.createElement("_"))){(function(j){"use strict";if(!("Element" in j)){return}var a="classList",f="prototype",m=j.Element[f],b=Object,k=String[f].trim||function(){return this.replace(/^\s+|\s+$/g,"")},c=Array[f].indexOf||function(q){var p=0,o=this.length;for(;p<o;p++){if(p in this&&this[p]===q){return p}}return -1},n=function(o,p){this.name=o;this.code=DOMException[o];this.message=p},g=function(p,o){if(o===""){throw new n("SYNTAX_ERR","An invalid or illegal string was specified")}if(/\s/.test(o)){throw new n("INVALID_CHARACTER_ERR","String contains an invalid character")}return c.call(p,o)},d=function(s){var r=k.call(s.getAttribute("class")||""),q=r?r.split(/\s+/):[],p=0,o=q.length;for(;p<o;p++){this.push(q[p])}this._updateClassName=function(){s.setAttribute("class",this.toString())}},e=d[f]=[],i=function(){return new d(this)};n[f]=Error[f];e.item=function(o){return this[o]||null};e.contains=function(o){o+="";return g(this,o)!==-1};e.add=function(){var s=arguments,r=0,p=s.length,q,o=false;do{q=s[r]+"";if(g(this,q)===-1){this.push(q);o=true}}while(++r<p);if(o){this._updateClassName()}};e.remove=function(){var t=arguments,s=0,p=t.length,r,o=false;do{r=t[s]+"";var q=g(this,r);if(q!==-1){this.splice(q,1);o=true}}while(++s<p);if(o){this._updateClassName()}};e.toggle=function(p,q){p+="";var o=this.contains(p),r=o?q!==true&&"remove":q!==false&&"add";if(r){this[r](p)}return !o};e.toString=function(){return this.join(" ")};if(b.defineProperty){var l={get:i,enumerable:true,configurable:true};try{b.defineProperty(m,a,l)}catch(h){if(h.number===-2146823252){l.enumerable=false;b.defineProperty(m,a,l)}}}else{if(b[f].__defineGetter__){m.__defineGetter__(a,i)}}}(self))};
// IE8+ support of matchesSelector
this.Element && function(ElementPrototype) {
  ElementPrototype.matchesSelector = ElementPrototype.matchesSelector ||
  ElementPrototype.mozMatchesSelector ||
  ElementPrototype.msMatchesSelector ||
  ElementPrototype.oMatchesSelector ||
  ElementPrototype.webkitMatchesSelector ||
  function (selector) {
    var node = this, nodes = (node.parentNode || node.document).querySelectorAll(selector), i = -1;

    while (nodes[++i] && nodes[i] != node);

    return !!nodes[i];
  };
}(Element.prototype);
/**
 * @license
 * Copyright (c) 2014 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */
// @version 0.6.1
window.WebComponents=window.WebComponents||{},function(e){var t=e.flags||{},n="webcomponents.js",r=document.querySelector('script[src*="'+n+'"]');if(!t.noOpts){if(location.search.slice(1).split("&").forEach(function(e){e=e.split("="),e[0]&&(t[e[0]]=e[1]||!0)}),r)for(var o,i=0;o=r.attributes[i];i++)"src"!==o.name&&(t[o.name]=o.value||!0);if(t.log&&t.log.split){var a=t.log.split(",");t.log={},a.forEach(function(e){t.log[e]=!0})}else t.log={}}t.shadow=t.shadow||t.shadowdom||t.polyfill,t.shadow="native"===t.shadow?!1:t.shadow||!HTMLElement.prototype.createShadowRoot,t.register&&(window.CustomElements=window.CustomElements||{flags:{}},window.CustomElements.flags.register=t.register),e.flags=t}(WebComponents),function(e){"use strict";function t(e){return void 0!==h[e]}function n(){s.call(this),this._isInvalid=!0}function r(e){return""==e&&n.call(this),e.toLowerCase()}function o(e){var t=e.charCodeAt(0);return t>32&&127>t&&-1==[34,35,60,62,63,96].indexOf(t)?e:encodeURIComponent(e)}function i(e){var t=e.charCodeAt(0);return t>32&&127>t&&-1==[34,35,60,62,96].indexOf(t)?e:encodeURIComponent(e)}function a(e,a,s){function c(e){b.push(e)}var d=a||"scheme start",l=0,u="",_=!1,g=!1,b=[];e:for(;(e[l-1]!=p||0==l)&&!this._isInvalid;){var w=e[l];switch(d){case"scheme start":if(!w||!m.test(w)){if(a){c("Invalid scheme.");break e}u="",d="no scheme";continue}u+=w.toLowerCase(),d="scheme";break;case"scheme":if(w&&v.test(w))u+=w.toLowerCase();else{if(":"!=w){if(a){if(p==w)break e;c("Code point not allowed in scheme: "+w);break e}u="",l=0,d="no scheme";continue}if(this._scheme=u,u="",a)break e;t(this._scheme)&&(this._isRelative=!0),d="file"==this._scheme?"relative":this._isRelative&&s&&s._scheme==this._scheme?"relative or authority":this._isRelative?"authority first slash":"scheme data"}break;case"scheme data":"?"==w?(query="?",d="query"):"#"==w?(this._fragment="#",d="fragment"):p!=w&&"	"!=w&&"\n"!=w&&"\r"!=w&&(this._schemeData+=o(w));break;case"no scheme":if(s&&t(s._scheme)){d="relative";continue}c("Missing scheme."),n.call(this);break;case"relative or authority":if("/"!=w||"/"!=e[l+1]){c("Expected /, got: "+w),d="relative";continue}d="authority ignore slashes";break;case"relative":if(this._isRelative=!0,"file"!=this._scheme&&(this._scheme=s._scheme),p==w){this._host=s._host,this._port=s._port,this._path=s._path.slice(),this._query=s._query;break e}if("/"==w||"\\"==w)"\\"==w&&c("\\ is an invalid code point."),d="relative slash";else if("?"==w)this._host=s._host,this._port=s._port,this._path=s._path.slice(),this._query="?",d="query";else{if("#"!=w){var y=e[l+1],E=e[l+2];("file"!=this._scheme||!m.test(w)||":"!=y&&"|"!=y||p!=E&&"/"!=E&&"\\"!=E&&"?"!=E&&"#"!=E)&&(this._host=s._host,this._port=s._port,this._path=s._path.slice(),this._path.pop()),d="relative path";continue}this._host=s._host,this._port=s._port,this._path=s._path.slice(),this._query=s._query,this._fragment="#",d="fragment"}break;case"relative slash":if("/"!=w&&"\\"!=w){"file"!=this._scheme&&(this._host=s._host,this._port=s._port),d="relative path";continue}"\\"==w&&c("\\ is an invalid code point."),d="file"==this._scheme?"file host":"authority ignore slashes";break;case"authority first slash":if("/"!=w){c("Expected '/', got: "+w),d="authority ignore slashes";continue}d="authority second slash";break;case"authority second slash":if(d="authority ignore slashes","/"!=w){c("Expected '/', got: "+w);continue}break;case"authority ignore slashes":if("/"!=w&&"\\"!=w){d="authority";continue}c("Expected authority, got: "+w);break;case"authority":if("@"==w){_&&(c("@ already seen."),u+="%40"),_=!0;for(var L=0;L<u.length;L++){var M=u[L];if("	"!=M&&"\n"!=M&&"\r"!=M)if(":"!=M||null!==this._password){var T=o(M);null!==this._password?this._password+=T:this._username+=T}else this._password="";else c("Invalid whitespace in authority.")}u=""}else{if(p==w||"/"==w||"\\"==w||"?"==w||"#"==w){l-=u.length,u="",d="host";continue}u+=w}break;case"file host":if(p==w||"/"==w||"\\"==w||"?"==w||"#"==w){2!=u.length||!m.test(u[0])||":"!=u[1]&&"|"!=u[1]?0==u.length?d="relative path start":(this._host=r.call(this,u),u="",d="relative path start"):d="relative path";continue}"	"==w||"\n"==w||"\r"==w?c("Invalid whitespace in file host."):u+=w;break;case"host":case"hostname":if(":"!=w||g){if(p==w||"/"==w||"\\"==w||"?"==w||"#"==w){if(this._host=r.call(this,u),u="",d="relative path start",a)break e;continue}"	"!=w&&"\n"!=w&&"\r"!=w?("["==w?g=!0:"]"==w&&(g=!1),u+=w):c("Invalid code point in host/hostname: "+w)}else if(this._host=r.call(this,u),u="",d="port","hostname"==a)break e;break;case"port":if(/[0-9]/.test(w))u+=w;else{if(p==w||"/"==w||"\\"==w||"?"==w||"#"==w||a){if(""!=u){var N=parseInt(u,10);N!=h[this._scheme]&&(this._port=N+""),u=""}if(a)break e;d="relative path start";continue}"	"==w||"\n"==w||"\r"==w?c("Invalid code point in port: "+w):n.call(this)}break;case"relative path start":if("\\"==w&&c("'\\' not allowed in path."),d="relative path","/"!=w&&"\\"!=w)continue;break;case"relative path":if(p!=w&&"/"!=w&&"\\"!=w&&(a||"?"!=w&&"#"!=w))"	"!=w&&"\n"!=w&&"\r"!=w&&(u+=o(w));else{"\\"==w&&c("\\ not allowed in relative path.");var O;(O=f[u.toLowerCase()])&&(u=O),".."==u?(this._path.pop(),"/"!=w&&"\\"!=w&&this._path.push("")):"."==u&&"/"!=w&&"\\"!=w?this._path.push(""):"."!=u&&("file"==this._scheme&&0==this._path.length&&2==u.length&&m.test(u[0])&&"|"==u[1]&&(u=u[0]+":"),this._path.push(u)),u="","?"==w?(this._query="?",d="query"):"#"==w&&(this._fragment="#",d="fragment")}break;case"query":a||"#"!=w?p!=w&&"	"!=w&&"\n"!=w&&"\r"!=w&&(this._query+=i(w)):(this._fragment="#",d="fragment");break;case"fragment":p!=w&&"	"!=w&&"\n"!=w&&"\r"!=w&&(this._fragment+=w)}l++}}function s(){this._scheme="",this._schemeData="",this._username="",this._password=null,this._host="",this._port="",this._path=[],this._query="",this._fragment="",this._isInvalid=!1,this._isRelative=!1}function c(e,t){void 0===t||t instanceof c||(t=new c(String(t))),this._url=e,s.call(this);var n=e.replace(/^[ \t\r\n\f]+|[ \t\r\n\f]+$/g,"");a.call(this,n,null,t)}var d=!1;if(!e.forceJURL)try{var l=new URL("b","http://a");l.pathname="c%20d",d="http://a/c%20d"===l.href}catch(u){}if(!d){var h=Object.create(null);h.ftp=21,h.file=0,h.gopher=70,h.http=80,h.https=443,h.ws=80,h.wss=443;var f=Object.create(null);f["%2e"]=".",f[".%2e"]="..",f["%2e."]="..",f["%2e%2e"]="..";var p=void 0,m=/[a-zA-Z]/,v=/[a-zA-Z0-9\+\-\.]/;c.prototype={toString:function(){return this.href},get href(){if(this._isInvalid)return this._url;var e="";return(""!=this._username||null!=this._password)&&(e=this._username+(null!=this._password?":"+this._password:"")+"@"),this.protocol+(this._isRelative?"//"+e+this.host:"")+this.pathname+this._query+this._fragment},set href(e){s.call(this),a.call(this,e)},get protocol(){return this._scheme+":"},set protocol(e){this._isInvalid||a.call(this,e+":","scheme start")},get host(){return this._isInvalid?"":this._port?this._host+":"+this._port:this._host},set host(e){!this._isInvalid&&this._isRelative&&a.call(this,e,"host")},get hostname(){return this._host},set hostname(e){!this._isInvalid&&this._isRelative&&a.call(this,e,"hostname")},get port(){return this._port},set port(e){!this._isInvalid&&this._isRelative&&a.call(this,e,"port")},get pathname(){return this._isInvalid?"":this._isRelative?"/"+this._path.join("/"):this._schemeData},set pathname(e){!this._isInvalid&&this._isRelative&&(this._path=[],a.call(this,e,"relative path start"))},get search(){return this._isInvalid||!this._query||"?"==this._query?"":this._query},set search(e){!this._isInvalid&&this._isRelative&&(this._query="?","?"==e[0]&&(e=e.slice(1)),a.call(this,e,"query"))},get hash(){return this._isInvalid||!this._fragment||"#"==this._fragment?"":this._fragment},set hash(e){this._isInvalid||(this._fragment="#","#"==e[0]&&(e=e.slice(1)),a.call(this,e,"fragment"))},get origin(){var e;if(this._isInvalid||!this._scheme)return"";switch(this._scheme){case"data":case"file":case"javascript":case"mailto":return"null"}return e=this.host,e?this._scheme+"://"+e:""}};var _=e.URL;_&&(c.createObjectURL=function(e){return _.createObjectURL.apply(_,arguments)},c.revokeObjectURL=function(e){_.revokeObjectURL(e)}),e.URL=c}}(this),"undefined"==typeof WeakMap&&!function(){var e=Object.defineProperty,t=Date.now()%1e9,n=function(){this.name="__st"+(1e9*Math.random()>>>0)+(t++ +"__")};n.prototype={set:function(t,n){var r=t[this.name];return r&&r[0]===t?r[1]=n:e(t,this.name,{value:[t,n],writable:!0}),this},get:function(e){var t;return(t=e[this.name])&&t[0]===e?t[1]:void 0},"delete":function(e){var t=e[this.name];return t&&t[0]===e?(t[0]=t[1]=void 0,!0):!1},has:function(e){var t=e[this.name];return t?t[0]===e:!1}},window.WeakMap=n}(),function(e){function t(e){w.push(e),b||(b=!0,m(r))}function n(e){return window.ShadowDOMPolyfill&&window.ShadowDOMPolyfill.wrapIfNeeded(e)||e}function r(){b=!1;var e=w;w=[],e.sort(function(e,t){return e.uid_-t.uid_});var t=!1;e.forEach(function(e){var n=e.takeRecords();o(e),n.length&&(e.callback_(n,e),t=!0)}),t&&r()}function o(e){e.nodes_.forEach(function(t){var n=v.get(t);n&&n.forEach(function(t){t.observer===e&&t.removeTransientObservers()})})}function i(e,t){for(var n=e;n;n=n.parentNode){var r=v.get(n);if(r)for(var o=0;o<r.length;o++){var i=r[o],a=i.options;if(n===e||a.subtree){var s=t(a);s&&i.enqueue(s)}}}}function a(e){this.callback_=e,this.nodes_=[],this.records_=[],this.uid_=++y}function s(e,t){this.type=e,this.target=t,this.addedNodes=[],this.removedNodes=[],this.previousSibling=null,this.nextSibling=null,this.attributeName=null,this.attributeNamespace=null,this.oldValue=null}function c(e){var t=new s(e.type,e.target);return t.addedNodes=e.addedNodes.slice(),t.removedNodes=e.removedNodes.slice(),t.previousSibling=e.previousSibling,t.nextSibling=e.nextSibling,t.attributeName=e.attributeName,t.attributeNamespace=e.attributeNamespace,t.oldValue=e.oldValue,t}function d(e,t){return E=new s(e,t)}function l(e){return L?L:(L=c(E),L.oldValue=e,L)}function u(){E=L=void 0}function h(e){return e===L||e===E}function f(e,t){return e===t?e:L&&h(e)?L:null}function p(e,t,n){this.observer=e,this.target=t,this.options=n,this.transientObservedNodes=[]}var m,v=new WeakMap;if(/Trident|Edge/.test(navigator.userAgent))m=setTimeout;else if(window.setImmediate)m=window.setImmediate;else{var _=[],g=String(Math.random());window.addEventListener("message",function(e){if(e.data===g){var t=_;_=[],t.forEach(function(e){e()})}}),m=function(e){_.push(e),window.postMessage(g,"*")}}var b=!1,w=[],y=0;a.prototype={observe:function(e,t){if(e=n(e),!t.childList&&!t.attributes&&!t.characterData||t.attributeOldValue&&!t.attributes||t.attributeFilter&&t.attributeFilter.length&&!t.attributes||t.characterDataOldValue&&!t.characterData)throw new SyntaxError;var r=v.get(e);r||v.set(e,r=[]);for(var o,i=0;i<r.length;i++)if(r[i].observer===this){o=r[i],o.removeListeners(),o.options=t;break}o||(o=new p(this,e,t),r.push(o),this.nodes_.push(e)),o.addListeners()},disconnect:function(){this.nodes_.forEach(function(e){for(var t=v.get(e),n=0;n<t.length;n++){var r=t[n];if(r.observer===this){r.removeListeners(),t.splice(n,1);break}}},this),this.records_=[]},takeRecords:function(){var e=this.records_;return this.records_=[],e}};var E,L;p.prototype={enqueue:function(e){var n=this.observer.records_,r=n.length;if(n.length>0){var o=n[r-1],i=f(o,e);if(i)return void(n[r-1]=i)}else t(this.observer);n[r]=e},addListeners:function(){this.addListeners_(this.target)},addListeners_:function(e){var t=this.options;t.attributes&&e.addEventListener("DOMAttrModified",this,!0),t.characterData&&e.addEventListener("DOMCharacterDataModified",this,!0),t.childList&&e.addEventListener("DOMNodeInserted",this,!0),(t.childList||t.subtree)&&e.addEventListener("DOMNodeRemoved",this,!0)},removeListeners:function(){this.removeListeners_(this.target)},removeListeners_:function(e){var t=this.options;t.attributes&&e.removeEventListener("DOMAttrModified",this,!0),t.characterData&&e.removeEventListener("DOMCharacterDataModified",this,!0),t.childList&&e.removeEventListener("DOMNodeInserted",this,!0),(t.childList||t.subtree)&&e.removeEventListener("DOMNodeRemoved",this,!0)},addTransientObserver:function(e){if(e!==this.target){this.addListeners_(e),this.transientObservedNodes.push(e);var t=v.get(e);t||v.set(e,t=[]),t.push(this)}},removeTransientObservers:function(){var e=this.transientObservedNodes;this.transientObservedNodes=[],e.forEach(function(e){this.removeListeners_(e);for(var t=v.get(e),n=0;n<t.length;n++)if(t[n]===this){t.splice(n,1);break}},this)},handleEvent:function(e){switch(e.stopImmediatePropagation(),e.type){case"DOMAttrModified":var t=e.attrName,n=e.relatedNode.namespaceURI,r=e.target,o=new d("attributes",r);o.attributeName=t,o.attributeNamespace=n;var a=e.attrChange===MutationEvent.ADDITION?null:e.prevValue;i(r,function(e){return!e.attributes||e.attributeFilter&&e.attributeFilter.length&&-1===e.attributeFilter.indexOf(t)&&-1===e.attributeFilter.indexOf(n)?void 0:e.attributeOldValue?l(a):o});break;case"DOMCharacterDataModified":var r=e.target,o=d("characterData",r),a=e.prevValue;i(r,function(e){return e.characterData?e.characterDataOldValue?l(a):o:void 0});break;case"DOMNodeRemoved":this.addTransientObserver(e.target);case"DOMNodeInserted":var s,c,h=e.target;"DOMNodeInserted"===e.type?(s=[h],c=[]):(s=[],c=[h]);var f=h.previousSibling,p=h.nextSibling,o=d("childList",e.target.parentNode);o.addedNodes=s,o.removedNodes=c,o.previousSibling=f,o.nextSibling=p,i(e.relatedNode,function(e){return e.childList?o:void 0})}u()}},e.JsMutationObserver=a,e.MutationObserver||(e.MutationObserver=a)}(this),window.HTMLImports=window.HTMLImports||{flags:{}},function(e){function t(e,t){t=t||p,r(function(){i(e,t)},t)}function n(e){return"complete"===e.readyState||e.readyState===_}function r(e,t){if(n(t))e&&e();else{var o=function(){("complete"===t.readyState||t.readyState===_)&&(t.removeEventListener(g,o),r(e,t))};t.addEventListener(g,o)}}function o(e){e.target.__loaded=!0}function i(e,t){function n(){c==d&&e&&e({allImports:s,loadedImports:l,errorImports:u})}function r(e){o(e),l.push(this),c++,n()}function i(e){u.push(this),c++,n()}var s=t.querySelectorAll("link[rel=import]"),c=0,d=s.length,l=[],u=[];if(d)for(var h,f=0;d>f&&(h=s[f]);f++)a(h)?(c++,n()):(h.addEventListener("load",r),h.addEventListener("error",i));else n()}function a(e){return u?e.__loaded||e["import"]&&"loading"!==e["import"].readyState:e.__importParsed}function s(e){for(var t,n=0,r=e.length;r>n&&(t=e[n]);n++)c(t)&&d(t)}function c(e){return"link"===e.localName&&"import"===e.rel}function d(e){var t=e["import"];t?o({target:e}):(e.addEventListener("load",o),e.addEventListener("error",o))}var l="import",u=Boolean(l in document.createElement("link")),h=Boolean(window.ShadowDOMPolyfill),f=function(e){return h?ShadowDOMPolyfill.wrapIfNeeded(e):e},p=f(document),m={get:function(){var e=HTMLImports.currentScript||document.currentScript||("complete"!==document.readyState?document.scripts[document.scripts.length-1]:null);return f(e)},configurable:!0};Object.defineProperty(document,"_currentScript",m),Object.defineProperty(p,"_currentScript",m);var v=/Trident|Edge/.test(navigator.userAgent),_=v?"complete":"interactive",g="readystatechange";u&&(new MutationObserver(function(e){for(var t,n=0,r=e.length;r>n&&(t=e[n]);n++)t.addedNodes&&s(t.addedNodes)}).observe(document.head,{childList:!0}),function(){if("loading"===document.readyState)for(var e,t=document.querySelectorAll("link[rel=import]"),n=0,r=t.length;r>n&&(e=t[n]);n++)d(e)}()),t(function(e){HTMLImports.ready=!0,HTMLImports.readyTime=(new Date).getTime();var t=p.createEvent("CustomEvent");t.initCustomEvent("HTMLImportsLoaded",!0,!0,e),p.dispatchEvent(t)}),e.IMPORT_LINK_TYPE=l,e.useNative=u,e.rootDocument=p,e.whenReady=t,e.isIE=v}(HTMLImports),function(e){var t=[],n=function(e){t.push(e)},r=function(){t.forEach(function(t){t(e)})};e.addModule=n,e.initializeModules=r}(HTMLImports),HTMLImports.addModule(function(e){var t=/(url\()([^)]*)(\))/g,n=/(@import[\s]+(?!url\())([^;]*)(;)/g,r={resolveUrlsInStyle:function(e,t){var n=e.ownerDocument,r=n.createElement("a");return e.textContent=this.resolveUrlsInCssText(e.textContent,t,r),e},resolveUrlsInCssText:function(e,r,o){var i=this.replaceUrls(e,o,r,t);return i=this.replaceUrls(i,o,r,n)},replaceUrls:function(e,t,n,r){return e.replace(r,function(e,r,o,i){var a=o.replace(/["']/g,"");return n&&(a=new URL(a,n).href),t.href=a,a=t.href,r+"'"+a+"'"+i})}};e.path=r}),HTMLImports.addModule(function(e){var t={async:!0,ok:function(e){return e.status>=200&&e.status<300||304===e.status||0===e.status},load:function(n,r,o){var i=new XMLHttpRequest;return(e.flags.debug||e.flags.bust)&&(n+="?"+Math.random()),i.open("GET",n,t.async),i.addEventListener("readystatechange",function(e){if(4===i.readyState){var n=i.getResponseHeader("Location"),a=null;if(n)var a="/"===n.substr(0,1)?location.origin+n:n;r.call(o,!t.ok(i)&&i,i.response||i.responseText,a)}}),i.send(),i},loadDocument:function(e,t,n){this.load(e,t,n).responseType="document"}};e.xhr=t}),HTMLImports.addModule(function(e){var t=e.xhr,n=e.flags,r=function(e,t){this.cache={},this.onload=e,this.oncomplete=t,this.inflight=0,this.pending={}};r.prototype={addNodes:function(e){this.inflight+=e.length;for(var t,n=0,r=e.length;r>n&&(t=e[n]);n++)this.require(t);this.checkDone()},addNode:function(e){this.inflight++,this.require(e),this.checkDone()},require:function(e){var t=e.src||e.href;e.__nodeUrl=t,this.dedupe(t,e)||this.fetch(t,e)},dedupe:function(e,t){if(this.pending[e])return this.pending[e].push(t),!0;return this.cache[e]?(this.onload(e,t,this.cache[e]),this.tail(),!0):(this.pending[e]=[t],!1)},fetch:function(e,r){if(n.load&&console.log("fetch",e,r),e)if(e.match(/^data:/)){var o=e.split(","),i=o[0],a=o[1];a=i.indexOf(";base64")>-1?atob(a):decodeURIComponent(a),setTimeout(function(){this.receive(e,r,null,a)}.bind(this),0)}else{var s=function(t,n,o){this.receive(e,r,t,n,o)}.bind(this);t.load(e,s)}else setTimeout(function(){this.receive(e,r,{error:"href must be specified"},null)}.bind(this),0)},receive:function(e,t,n,r,o){this.cache[e]=r;for(var i,a=this.pending[e],s=0,c=a.length;c>s&&(i=a[s]);s++)this.onload(e,i,r,n,o),this.tail();this.pending[e]=null},tail:function(){--this.inflight,this.checkDone()},checkDone:function(){this.inflight||this.oncomplete()}},e.Loader=r}),HTMLImports.addModule(function(e){var t=function(e){this.addCallback=e,this.mo=new MutationObserver(this.handler.bind(this))};t.prototype={handler:function(e){for(var t,n=0,r=e.length;r>n&&(t=e[n]);n++)"childList"===t.type&&t.addedNodes.length&&this.addedNodes(t.addedNodes)},addedNodes:function(e){this.addCallback&&this.addCallback(e);for(var t,n=0,r=e.length;r>n&&(t=e[n]);n++)t.children&&t.children.length&&this.addedNodes(t.children)},observe:function(e){this.mo.observe(e,{childList:!0,subtree:!0})}},e.Observer=t}),HTMLImports.addModule(function(e){function t(e){return"link"===e.localName&&e.rel===l}function n(e){var t=r(e);return"data:text/javascript;charset=utf-8,"+encodeURIComponent(t)}function r(e){return e.textContent+o(e)}function o(e){var t=e.ownerDocument;t.__importedScripts=t.__importedScripts||0;var n=e.ownerDocument.baseURI,r=t.__importedScripts?"-"+t.__importedScripts:"";return t.__importedScripts++,"\n//# sourceURL="+n+r+".js\n"}function i(e){var t=e.ownerDocument.createElement("style");return t.textContent=e.textContent,a.resolveUrlsInStyle(t),t}var a=e.path,s=e.rootDocument,c=e.flags,d=e.isIE,l=e.IMPORT_LINK_TYPE,u="link[rel="+l+"]",h={documentSelectors:u,importsSelectors:[u,"link[rel=stylesheet]","style","script:not([type])",'script[type="text/javascript"]'].join(","),map:{link:"parseLink",script:"parseScript",style:"parseStyle"},dynamicElements:[],parseNext:function(){var e=this.nextToParse();e&&this.parse(e)},parse:function(e){if(this.isParsed(e))return void(c.parse&&console.log("[%s] is already parsed",e.localName));var t=this[this.map[e.localName]];t&&(this.markParsing(e),t.call(this,e))},parseDynamic:function(e,t){this.dynamicElements.push(e),t||this.parseNext()},markParsing:function(e){c.parse&&console.log("parsing",e),this.parsingElement=e},markParsingComplete:function(e){e.__importParsed=!0,this.markDynamicParsingComplete(e),e.__importElement&&(e.__importElement.__importParsed=!0,this.markDynamicParsingComplete(e.__importElement)),this.parsingElement=null,c.parse&&console.log("completed",e)},markDynamicParsingComplete:function(e){var t=this.dynamicElements.indexOf(e);t>=0&&this.dynamicElements.splice(t,1)},parseImport:function(e){if(HTMLImports.__importsParsingHook&&HTMLImports.__importsParsingHook(e),e["import"]&&(e["import"].__importParsed=!0),this.markParsingComplete(e),e.dispatchEvent(e.__resource&&!e.__error?new CustomEvent("load",{bubbles:!1}):new CustomEvent("error",{bubbles:!1})),e.__pending)for(var t;e.__pending.length;)t=e.__pending.shift(),t&&t({target:e});this.parseNext()},parseLink:function(e){t(e)?this.parseImport(e):(e.href=e.href,this.parseGeneric(e))},parseStyle:function(e){var t=e;e=i(e),t.__appliedElement=e,e.__importElement=t,this.parseGeneric(e)},parseGeneric:function(e){this.trackElement(e),this.addElementToDocument(e)},rootImportForElement:function(e){for(var t=e;t.ownerDocument.__importLink;)t=t.ownerDocument.__importLink;return t},addElementToDocument:function(e){var t=this.rootImportForElement(e.__importElement||e);t.parentNode.insertBefore(e,t)},trackElement:function(e,t){var n=this,r=function(r){t&&t(r),n.markParsingComplete(e),n.parseNext()};if(e.addEventListener("load",r),e.addEventListener("error",r),d&&"style"===e.localName){var o=!1;if(-1==e.textContent.indexOf("@import"))o=!0;else if(e.sheet){o=!0;for(var i,a=e.sheet.cssRules,s=a?a.length:0,c=0;s>c&&(i=a[c]);c++)i.type===CSSRule.IMPORT_RULE&&(o=o&&Boolean(i.styleSheet))}o&&e.dispatchEvent(new CustomEvent("load",{bubbles:!1}))}},parseScript:function(t){var r=document.createElement("script");r.__importElement=t,r.src=t.src?t.src:n(t),e.currentScript=t,this.trackElement(r,function(t){r.parentNode.removeChild(r),e.currentScript=null}),this.addElementToDocument(r)},nextToParse:function(){return this._mayParse=[],!this.parsingElement&&(this.nextToParseInDoc(s)||this.nextToParseDynamic())},nextToParseInDoc:function(e,n){if(e&&this._mayParse.indexOf(e)<0){this._mayParse.push(e);for(var r,o=e.querySelectorAll(this.parseSelectorsForNode(e)),i=0,a=o.length;a>i&&(r=o[i]);i++)if(!this.isParsed(r))return this.hasResource(r)?t(r)?this.nextToParseInDoc(r["import"],r):r:void 0}return n},nextToParseDynamic:function(){return this.dynamicElements[0]},parseSelectorsForNode:function(e){var t=e.ownerDocument||e;return t===s?this.documentSelectors:this.importsSelectors},isParsed:function(e){return e.__importParsed},needsDynamicParsing:function(e){return this.dynamicElements.indexOf(e)>=0},hasResource:function(e){return t(e)&&void 0===e["import"]?!1:!0}};e.parser=h,e.IMPORT_SELECTOR=u}),HTMLImports.addModule(function(e){function t(e){return n(e,a)}function n(e,t){return"link"===e.localName&&e.getAttribute("rel")===t}function r(e){return!!Object.getOwnPropertyDescriptor(e,"baseURI")}function o(e,t){var n=document.implementation.createHTMLDocument(a);n._URL=t;var o=n.createElement("base");o.setAttribute("href",t),n.baseURI||r(n)||Object.defineProperty(n,"baseURI",{value:t});var i=n.createElement("meta");return i.setAttribute("charset","utf-8"),n.head.appendChild(i),n.head.appendChild(o),n.body.innerHTML=e,window.HTMLTemplateElement&&HTMLTemplateElement.bootstrap&&HTMLTemplateElement.bootstrap(n),n}var i=e.flags,a=e.IMPORT_LINK_TYPE,s=e.IMPORT_SELECTOR,c=e.rootDocument,d=e.Loader,l=e.Observer,u=e.parser,h={documents:{},documentPreloadSelectors:s,importsPreloadSelectors:[s].join(","),loadNode:function(e){f.addNode(e)},loadSubtree:function(e){var t=this.marshalNodes(e);f.addNodes(t)},marshalNodes:function(e){return e.querySelectorAll(this.loadSelectorsForNode(e))},loadSelectorsForNode:function(e){var t=e.ownerDocument||e;return t===c?this.documentPreloadSelectors:this.importsPreloadSelectors},loaded:function(e,n,r,a,s){if(i.load&&console.log("loaded",e,n),n.__resource=r,n.__error=a,t(n)){var c=this.documents[e];void 0===c&&(c=a?null:o(r,s||e),c&&(c.__importLink=n,this.bootDocument(c)),this.documents[e]=c),n["import"]=c}u.parseNext()},bootDocument:function(e){this.loadSubtree(e),this.observer.observe(e),u.parseNext()},loadedAll:function(){u.parseNext()}},f=new d(h.loaded.bind(h),h.loadedAll.bind(h));if(h.observer=new l,!document.baseURI){var p={get:function(){var e=document.querySelector("base");return e?e.href:window.location.href},configurable:!0};Object.defineProperty(document,"baseURI",p),Object.defineProperty(c,"baseURI",p)}e.importer=h,e.importLoader=f}),HTMLImports.addModule(function(e){var t=e.parser,n=e.importer,r={added:function(e){for(var r,o,i,a,s=0,c=e.length;c>s&&(a=e[s]);s++)r||(r=a.ownerDocument,o=t.isParsed(r)),i=this.shouldLoadNode(a),i&&n.loadNode(a),this.shouldParseNode(a)&&o&&t.parseDynamic(a,i)},shouldLoadNode:function(e){return 1===e.nodeType&&o.call(e,n.loadSelectorsForNode(e))},shouldParseNode:function(e){return 1===e.nodeType&&o.call(e,t.parseSelectorsForNode(e))}};n.observer.addCallback=r.added.bind(r);var o=HTMLElement.prototype.matches||HTMLElement.prototype.matchesSelector||HTMLElement.prototype.webkitMatchesSelector||HTMLElement.prototype.mozMatchesSelector||HTMLElement.prototype.msMatchesSelector}),function(e){function t(){HTMLImports.importer.bootDocument(o)}var n=e.initializeModules,r=e.isIE;if(!e.useNative){r&&"function"!=typeof window.CustomEvent&&(window.CustomEvent=function(e,t){t=t||{};var n=document.createEvent("CustomEvent");return n.initCustomEvent(e,Boolean(t.bubbles),Boolean(t.cancelable),t.detail),n},window.CustomEvent.prototype=window.Event.prototype),n();var o=e.rootDocument;"complete"===document.readyState||"interactive"===document.readyState&&!window.attachEvent?t():document.addEventListener("DOMContentLoaded",t)}}(HTMLImports),window.CustomElements=window.CustomElements||{flags:{}},function(e){var t=e.flags,n=[],r=function(e){n.push(e)},o=function(){n.forEach(function(t){t(e)})};e.addModule=r,e.initializeModules=o,e.hasNative=Boolean(document.registerElement),e.useNative=!t.register&&e.hasNative&&!window.ShadowDOMPolyfill&&(!window.HTMLImports||HTMLImports.useNative)}(CustomElements),CustomElements.addModule(function(e){function t(e,t){n(e,function(e){return t(e)?!0:void r(e,t)}),r(e,t)}function n(e,t,r){var o=e.firstElementChild;if(!o)for(o=e.firstChild;o&&o.nodeType!==Node.ELEMENT_NODE;)o=o.nextSibling;for(;o;)t(o,r)!==!0&&n(o,t,r),o=o.nextElementSibling;return null}function r(e,n){for(var r=e.shadowRoot;r;)t(r,n),r=r.olderShadowRoot}function o(e,t){i(e,t,[])}function i(e,t,n){if(e=wrap(e),!(n.indexOf(e)>=0)){n.push(e);for(var r,o=e.querySelectorAll("link[rel="+a+"]"),s=0,c=o.length;c>s&&(r=o[s]);s++)r["import"]&&i(r["import"],t,n);t(e)}}var a=window.HTMLImports?HTMLImports.IMPORT_LINK_TYPE:"none";e.forDocumentTree=o,e.forSubtree=t}),CustomElements.addModule(function(e){function t(e){return n(e)||r(e)}function n(t){return e.upgrade(t)?!0:void s(t)}function r(e){w(e,function(e){return n(e)?!0:void 0})}function o(e){s(e),h(e)&&w(e,function(e){s(e)})}function i(e){M.push(e),L||(L=!0,setTimeout(a))}function a(){L=!1;for(var e,t=M,n=0,r=t.length;r>n&&(e=t[n]);n++)e();M=[]}function s(e){E?i(function(){c(e)}):c(e)}function c(e){e.__upgraded__&&(e.attachedCallback||e.detachedCallback)&&!e.__attached&&h(e)&&(e.__attached=!0,e.attachedCallback&&e.attachedCallback())}function d(e){l(e),w(e,function(e){l(e)})}function l(e){E?i(function(){u(e)}):u(e)}function u(e){e.__upgraded__&&(e.attachedCallback||e.detachedCallback)&&e.__attached&&!h(e)&&(e.__attached=!1,e.detachedCallback&&e.detachedCallback())}function h(e){for(var t=e,n=wrap(document);t;){if(t==n)return!0;t=t.parentNode||t.nodeType===Node.DOCUMENT_FRAGMENT_NODE&&t.host}}function f(e){if(e.shadowRoot&&!e.shadowRoot.__watched){b.dom&&console.log("watching shadow-root for: ",e.localName);for(var t=e.shadowRoot;t;)v(t),t=t.olderShadowRoot}}function p(e){if(b.dom){var n=e[0];if(n&&"childList"===n.type&&n.addedNodes&&n.addedNodes){for(var r=n.addedNodes[0];r&&r!==document&&!r.host;)r=r.parentNode;var o=r&&(r.URL||r._URL||r.host&&r.host.localName)||"";o=o.split("/?").shift().split("/").pop()}console.group("mutations (%d) [%s]",e.length,o||"")}e.forEach(function(e){"childList"===e.type&&(T(e.addedNodes,function(e){e.localName&&t(e)}),T(e.removedNodes,function(e){e.localName&&d(e)}))}),b.dom&&console.groupEnd()}function m(e){for(e=wrap(e),e||(e=wrap(document));e.parentNode;)e=e.parentNode;var t=e.__observer;t&&(p(t.takeRecords()),a())}function v(e){if(!e.__observer){var t=new MutationObserver(p);t.observe(e,{childList:!0,subtree:!0}),e.__observer=t}}function _(e){e=wrap(e),b.dom&&console.group("upgradeDocument: ",e.baseURI.split("/").pop()),t(e),v(e),b.dom&&console.groupEnd()}function g(e){y(e,_)}var b=e.flags,w=e.forSubtree,y=e.forDocumentTree,E=!window.MutationObserver||window.MutationObserver===window.JsMutationObserver;e.hasPolyfillMutations=E;var L=!1,M=[],T=Array.prototype.forEach.call.bind(Array.prototype.forEach),N=Element.prototype.createShadowRoot;N&&(Element.prototype.createShadowRoot=function(){var e=N.call(this);return CustomElements.watchShadow(this),e}),e.watchShadow=f,e.upgradeDocumentTree=g,e.upgradeSubtree=r,e.upgradeAll=t,e.attachedNode=o,e.takeRecords=m}),CustomElements.addModule(function(e){function t(t){if(!t.__upgraded__&&t.nodeType===Node.ELEMENT_NODE){var r=t.getAttribute("is"),o=e.getRegisteredDefinition(r||t.localName);if(o){if(r&&o.tag==t.localName)return n(t,o);if(!r&&!o["extends"])return n(t,o)}}}function n(t,n){return a.upgrade&&console.group("upgrade:",t.localName),n.is&&t.setAttribute("is",n.is),r(t,n),t.__upgraded__=!0,i(t),e.attachedNode(t),e.upgradeSubtree(t),a.upgrade&&console.groupEnd(),t}function r(e,t){Object.__proto__?e.__proto__=t.prototype:(o(e,t.prototype,t["native"]),e.__proto__=t.prototype)}function o(e,t,n){for(var r={},o=t;o!==n&&o!==HTMLElement.prototype;){for(var i,a=Object.getOwnPropertyNames(o),s=0;i=a[s];s++)r[i]||(Object.defineProperty(e,i,Object.getOwnPropertyDescriptor(o,i)),r[i]=1);o=Object.getPrototypeOf(o)}}function i(e){e.createdCallback&&e.createdCallback()}var a=e.flags;e.upgrade=t,e.upgradeWithDefinition=n,e.implementPrototype=r}),CustomElements.addModule(function(e){function t(t,r){var c=r||{};if(!t)throw new Error("document.registerElement: first argument `name` must not be empty");if(t.indexOf("-")<0)throw new Error("document.registerElement: first argument ('name') must contain a dash ('-'). Argument provided was '"+String(t)+"'.");if(o(t))throw new Error("Failed to execute 'registerElement' on 'Document': Registration failed for type '"+String(t)+"'. The type name is invalid.");if(d(t))throw new Error("DuplicateDefinitionError: a type with name '"+String(t)+"' is already registered");return c.prototype||(c.prototype=Object.create(HTMLElement.prototype)),c.__name=t.toLowerCase(),c.lifecycle=c.lifecycle||{},c.ancestry=i(c["extends"]),a(c),s(c),n(c.prototype),l(c.__name,c),c.ctor=u(c),c.ctor.prototype=c.prototype,c.prototype.constructor=c.ctor,e.ready&&_(document),c.ctor}function n(e){if(!e.setAttribute._polyfilled){var t=e.setAttribute;e.setAttribute=function(e,n){r.call(this,e,n,t)};var n=e.removeAttribute;e.removeAttribute=function(e){r.call(this,e,null,n)},e.setAttribute._polyfilled=!0}}function r(e,t,n){e=e.toLowerCase();var r=this.getAttribute(e);n.apply(this,arguments);var o=this.getAttribute(e);this.attributeChangedCallback&&o!==r&&this.attributeChangedCallback(e,r,o)}function o(e){for(var t=0;t<E.length;t++)if(e===E[t])return!0}function i(e){var t=d(e);return t?i(t["extends"]).concat([t]):[]}function a(e){for(var t,n=e["extends"],r=0;t=e.ancestry[r];r++)n=t.is&&t.tag;e.tag=n||e.__name,n&&(e.is=e.__name)}function s(e){if(!Object.__proto__){var t=HTMLElement.prototype;if(e.is){var n=document.createElement(e.tag),r=Object.getPrototypeOf(n);r===e.prototype&&(t=r)}for(var o,i=e.prototype;i&&i!==t;)o=Object.getPrototypeOf(i),
i.__proto__=o,i=o;e["native"]=t}}function c(e){return b(T(e.tag),e)}function d(e){return e?L[e.toLowerCase()]:void 0}function l(e,t){L[e]=t}function u(e){return function(){return c(e)}}function h(e,t,n){return e===M?f(t,n):N(e,t)}function f(e,t){var n=d(t||e);if(n){if(e==n.tag&&t==n.is)return new n.ctor;if(!t&&!n.is)return new n.ctor}var r;return t?(r=f(e),r.setAttribute("is",t),r):(r=T(e),e.indexOf("-")>=0&&w(r,HTMLElement),r)}function p(e,t){var n=e[t];e[t]=function(){var e=n.apply(this,arguments);return g(e),e}}var m,v=e.isIE11OrOlder,_=e.upgradeDocumentTree,g=e.upgradeAll,b=e.upgradeWithDefinition,w=e.implementPrototype,y=e.useNative,E=["annotation-xml","color-profile","font-face","font-face-src","font-face-uri","font-face-format","font-face-name","missing-glyph"],L={},M="http://www.w3.org/1999/xhtml",T=document.createElement.bind(document),N=document.createElementNS.bind(document);m=Object.__proto__||y?function(e,t){return e instanceof t}:function(e,t){for(var n=e;n;){if(n===t.prototype)return!0;n=n.__proto__}return!1},p(Node.prototype,"cloneNode"),p(document,"importNode"),v&&!function(){var e=document.importNode;document.importNode=function(){var t=e.apply(document,arguments);if(t.nodeType==t.DOCUMENT_FRAGMENT_NODE){var n=document.createDocumentFragment();return n.appendChild(t),n}return t}}(),document.registerElement=t,document.createElement=f,document.createElementNS=h,e.registry=L,e["instanceof"]=m,e.reservedTagList=E,e.getRegisteredDefinition=d,document.register=document.registerElement}),function(e){function t(){a(wrap(document)),window.HTMLImports&&(HTMLImports.__importsParsingHook=function(e){a(wrap(e["import"]))}),CustomElements.ready=!0,setTimeout(function(){CustomElements.readyTime=Date.now(),window.HTMLImports&&(CustomElements.elapsed=CustomElements.readyTime-HTMLImports.readyTime),document.dispatchEvent(new CustomEvent("WebComponentsReady",{bubbles:!0}))})}var n=e.useNative,r=e.initializeModules,o=/Trident/.test(navigator.userAgent);if(n){var i=function(){};e.watchShadow=i,e.upgrade=i,e.upgradeAll=i,e.upgradeDocumentTree=i,e.upgradeSubtree=i,e.takeRecords=i,e["instanceof"]=function(e,t){return e instanceof t}}else r();var a=e.upgradeDocumentTree;if(window.wrap||(window.ShadowDOMPolyfill?(window.wrap=ShadowDOMPolyfill.wrapIfNeeded,window.unwrap=ShadowDOMPolyfill.unwrapIfNeeded):window.wrap=window.unwrap=function(e){return e}),o&&"function"!=typeof window.CustomEvent&&(window.CustomEvent=function(e,t){t=t||{};var n=document.createEvent("CustomEvent");return n.initCustomEvent(e,Boolean(t.bubbles),Boolean(t.cancelable),t.detail),n},window.CustomEvent.prototype=window.Event.prototype),"complete"===document.readyState||e.flags.eager)t();else if("interactive"!==document.readyState||window.attachEvent||window.HTMLImports&&!window.HTMLImports.ready){var s=window.HTMLImports&&!HTMLImports.ready?"HTMLImportsLoaded":"DOMContentLoaded";window.addEventListener(s,t)}else t();e.isIE11OrOlder=o}(window.CustomElements),"undefined"==typeof HTMLTemplateElement&&!function(){var e="template";HTMLTemplateElement=function(){},HTMLTemplateElement.prototype=Object.create(HTMLElement.prototype),HTMLTemplateElement.decorate=function(e){if(!e.content){e.content=e.ownerDocument.createDocumentFragment();for(var t;t=e.firstChild;)e.content.appendChild(t)}},HTMLTemplateElement.bootstrap=function(t){for(var n,r=t.querySelectorAll(e),o=0,i=r.length;i>o&&(n=r[o]);o++)HTMLTemplateElement.decorate(n)},addEventListener("DOMContentLoaded",function(){HTMLTemplateElement.bootstrap(document)})}(),function(e){var t=document.createElement("style");t.textContent="body {transition: opacity ease-in 0.2s; } \nbody[unresolved] {opacity: 0; display: block; overflow: hidden; position: relative; } \n";var n=document.querySelector("head");n.insertBefore(t,n.firstChild)}(window.WebComponents);
(function(global){var to5Runtime=global.to5Runtime={};to5Runtime.inherits=function(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass)}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)subClass.__proto__=superClass};to5Runtime.defaults=function(obj,defaults){for(var key in defaults){if(obj[key]===undefined){obj[key]=defaults[key]}}return obj};to5Runtime.prototypeProperties=function(child,staticProps,instanceProps){if(staticProps)Object.defineProperties(child,staticProps);if(instanceProps)Object.defineProperties(child.prototype,instanceProps)};to5Runtime.applyConstructor=function(Constructor,args){var instance=Object.create(Constructor.prototype);var result=Constructor.apply(instance,args);return result!=null&&(typeof result=="object"||typeof result=="function")?result:instance};to5Runtime.taggedTemplateLiteral=function(strings,raw){return Object.freeze(Object.defineProperties(strings,{raw:{value:Object.freeze(raw)}}))};to5Runtime.interopRequire=function(obj){return obj&&(obj["default"]||obj)};to5Runtime.toArray=function(arr){return Array.isArray(arr)?arr:Array.from(arr)};to5Runtime.slicedToArray=function(arr,i){if(Array.isArray(arr)){return arr}else{var _arr=[];for(var _iterator=arr[Symbol.iterator](),_step;!(_step=_iterator.next()).done;){_arr.push(_step.value);if(i&&_arr.length===i)break}return _arr}};to5Runtime.objectWithoutProperties=function(obj,keys){var target={};for(var i in obj){if(keys.indexOf(i)>=0)continue;if(!Object.prototype.hasOwnProperty.call(obj,i))continue;target[i]=obj[i]}return target};to5Runtime.hasOwn=Object.prototype.hasOwnProperty;to5Runtime.slice=Array.prototype.slice;to5Runtime.bind=Function.prototype.bind;to5Runtime.defineProperty=function(obj,key,value){return Object.defineProperty(obj,key,{value:value,enumerable:true,configurable:true,writable:true})};to5Runtime.interopRequireWildcard=function(obj){return obj&&obj.constructor===Object?obj:{"default":obj}};to5Runtime._extends=function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source){target[key]=source[key]}}return target};to5Runtime.get=function get(object,property,receiver){var desc=Object.getOwnPropertyDescriptor(object,property);if(desc===undefined){var parent=Object.getPrototypeOf(object);if(parent===null){return undefined}else{return get(parent,property,receiver)}}else if("value"in desc&&desc.writable){return desc.value}else{var getter=desc.get;if(getter===undefined){return undefined}return getter.call(receiver)}}})(typeof global==="undefined"?self:global);
//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(root, factory) {

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    factory(root, exports, _);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var slice = array.slice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.1.2';

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;

      // Remove all callbacks for all events.
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }

      var names = name ? [name] : _.keys(this._events);
      for (var i = 0, length = names.length; i < length; i++) {
        name = names[i];

        // Bail out if there are no events stored.
        var events = this._events[name];
        if (!events) continue;

        // Remove all callbacks for this event.
        if (!callback && !context) {
          delete this._events[name];
          continue;
        }

        // Find any remaining events.
        var remaining = [];
        for (var j = 0, k = events.length; j < k; j++) {
          var event = events[j];
          if (
            callback && callback !== event.callback &&
            callback !== event.callback._callback ||
            context && context !== event.context
          ) {
            remaining.push(event);
          }
        }

        // Replace events if there are any remaining.  Otherwise, clean up.
        if (remaining.length) {
          this._events[name] = remaining;
        } else {
          delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, length = names.length; i < length; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0, length = changes.length; i < length; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true}, options);

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch' && !options.attrs) options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.stopListening();
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return !this.has(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit', 'chain', 'isEmpty'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    if (!_[method]) return;
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analogous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      options || (options = {});
      for (var i = 0, length = models.length; i < length; i++) {
        var model = models[i] = this.get(models[i]);
        if (!model) continue;
        var id = this.modelId(model.attributes);
        if (id != null) delete this._byId[id];
        delete this._byId[model.cid];
        var index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model, options);
      }
      return singular ? models[0] : models;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : models.slice();
      var id, model, attrs, existing, sort;
      var at = options.at;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (var i = 0, length = models.length; i < length; i++) {
        attrs = models[i];

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(attrs)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge && attrs !== existing) {
            attrs = this._isModel(attrs) ? attrs.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          this._addReference(model, options);
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (!model) continue;
        id = this.modelId(model.attributes);
        if (order && (model.isNew() || !modelMap[id])) order.push(model);
        modelMap[id] = true;
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (var i = 0, length = this.length; i < length; i++) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || (order && order.length)) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (var i = 0, length = toAdd.length; i < length; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (var i = 0, length = orderedModels.length; i < length; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        var addOpts = at != null ? _.clone(options) : options;
        for (var i = 0, length = toAdd.length; i < length; i++) {
          if (at != null) addOpts.index = at + i;
          (model = toAdd[i]).trigger('add', model, this, addOpts);
        }
        if (sort || (order && order.length)) this.trigger('sort', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, length = this.models.length; i < length; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      var id = this.modelId(this._isModel(obj) ? obj.attributes : obj);
      return this._byId[obj] || this._byId[id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    at: function(index) {
      if (index < 0) index += this.length;
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models, {
        model: this.model,
        comparator: this.comparator
      });
    },

    // Define how to uniquely identify models in the collection.
    modelId: function (attrs) {
      return attrs[this.model.prototype.idAttribute || 'id'];
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (this._isModel(attrs)) {
        if (!attrs.collection) attrs.collection = this;
        return attrs;
      }
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Method for checking whether an object should be considered a model for
    // the purposes of adding to the collection.
    _isModel: function (model) {
      return model instanceof Model;
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function(model, options) {
      this._byId[model.cid] = model;
      var id = this.modelId(model.attributes);
      if (id != null) this._byId[id] = model;
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model, options) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (event === 'change') {
        var prevId = this.modelId(model.previousAttributes());
        var id = this.modelId(model.attributes);
        if (prevId !== id) {
          if (prevId != null) delete this._byId[prevId];
          if (id != null) this._byId[id] = model;
        }
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample', 'partition'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    if (!_[method]) return;
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    if (!_[method]) return;
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this._removeElement();
      this.stopListening();
      return this;
    },

    // Remove this view's element from the document and all event listeners
    // attached to it. Exposed for subclasses using an alternative DOM
    // manipulation API.
    _removeElement: function() {
      this.$el.remove();
    },

    // Change the view's element (`this.el` property) and re-delegate the
    // view's events on the new element.
    setElement: function(element) {
      this.undelegateEvents();
      this._setElement(element);
      this.delegateEvents();
      return this;
    },

    // Creates the `this.el` and `this.$el` references for this view using the
    // given `el`. `el` can be a CSS selector or an HTML string, a jQuery
    // context or an element. Subclasses can override this to utilize an
    // alternative DOM manipulation API and are only required to set the
    // `this.el` property.
    _setElement: function(el) {
      this.$el = el instanceof Backbone.$ ? el : Backbone.$(el);
      this.el = this.$el[0];
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;
        var match = key.match(delegateEventSplitter);
        this.delegate(match[1], match[2], _.bind(method, this));
      }
      return this;
    },

    // Add a single event listener to the view's element (or a child element
    // using `selector`). This only works for delegate-able events: not `focus`,
    // `blur`, and not `change`, `submit`, and `reset` in Internet Explorer.
    delegate: function(eventName, selector, listener) {
      this.$el.on(eventName + '.delegateEvents' + this.cid, selector, listener);
    },

    // Clears all callbacks previously bound to the view by `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      if (this.$el) this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // A finer-grained `undelegateEvents` for removing a single delegated event.
    // `selector` and `listener` are both optional.
    undelegate: function(eventName, selector, listener) {
      this.$el.off(eventName + '.delegateEvents' + this.cid, selector, listener);
    },

    // Produces a DOM element to be assigned to your view. Exposed for
    // subclasses using an alternative DOM manipulation API.
    _createElement: function(tagName) {
      return document.createElement(tagName);
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        this.setElement(this._createElement(_.result(this, 'tagName')));
        this._setAttributes(attrs);
      } else {
        this.setElement(_.result(this, 'el'));
      }
    },

    // Set attributes from a hash on this view's element.  Exposed for
    // subclasses using an alternative DOM manipulation API.
    _setAttributes: function(attributes) {
      this.$el.attr(attributes);
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // Pass along `textStatus` and `errorThrown` from jQuery.
    var error = options.error;
    options.error = function(xhr, textStatus, errorThrown) {
      options.textStatus = textStatus;
      options.errorThrown = errorThrown;
      if (error) error.apply(this, arguments);
    };

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        if (router.execute(callback, args, name) !== false) {
          router.trigger.apply(router, ['route:' + name].concat(args));
          router.trigger('route', name, args);
          Backbone.history.trigger('route', router, name, args);
        }
      });
      return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function(callback, args, name) {
      if (callback) callback.apply(this, args);
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for stripping urls of hash.
  var pathStripper = /#.*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function() {
      var path = this.location.pathname.replace(/[^\/]$/, '$&/');
      return path === this.root && !this.getSearch();
    },

    // In IE6, the hash fragment and search params are incorrect if the
    // fragment contains `?`.
    getSearch: function() {
      var match = this.location.href.replace(/#.*/, '').match(/\?.+/);
      return match ? match[0] : '';
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the pathname and search params, without the root.
    getPath: function() {
      var path = decodeURI(this.location.pathname + this.getSearch());
      var root = this.root.slice(0, -1);
      if (!path.indexOf(root)) path = path.slice(root.length);
      return path.slice(1);
    },

    // Get the cross-browser normalized URL fragment from the path or hash.
    getFragment: function(fragment) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange) {
          fragment = this.getPath();
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error('Backbone.history has already been started');
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._hasHashChange   = 'onhashchange' in window;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      this.fragment         = this.getFragment();

      // Add a cross-platform `addEventListener` shim for older browsers.
      var addEventListener = window.addEventListener || function (eventName, listener) {
        return attachEvent('on' + eventName, listener);
      };

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      // Proxy an iframe to handle location events if the browser doesn't
      // support the `hashchange` event, HTML5 history, or the user wants
      // `hashChange` but not `pushState`.
      if (!this._hasHashChange && this._wantsHashChange && (!this._wantsPushState || !this._hasPushState)) {
        var iframe = document.createElement('iframe');
        iframe.src = 'javascript:0';
        iframe.style.display = 'none';
        iframe.tabIndex = -1;
        var body = document.body;
        // Using `appendChild` will throw on IE < 9 if the document is not ready.
        this.iframe = body.insertBefore(iframe, body.firstChild).contentWindow;
        this.navigate(this.fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        addEventListener('popstate', this.checkUrl, false);
      } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {
        addEventListener('hashchange', this.checkUrl, false);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          this.location.replace(this.root + '#' + this.getPath());
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot()) {
          this.navigate(this.getHash(), {replace: true});
        }

      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      // Add a cross-platform `removeEventListener` shim for older browsers.
      var removeEventListener = window.removeEventListener || function (eventName, listener) {
        return detachEvent('on' + eventName, listener);
      };

      // Remove window listeners.
      if (this._hasPushState) {
        removeEventListener('popstate', this.checkUrl, false);
      } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {
        removeEventListener('hashchange', this.checkUrl, false);
      }

      // Clean up the iframe if necessary.
      if (this.iframe) {
        document.body.removeChild(this.iframe.frameElement);
        this.iframe = null;
      }

      // Some environments will throw when clearing an undefined interval.
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getHash(this.iframe);
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      var url = this.root + (fragment = this.getFragment(fragment || ''));

      // Strip the hash and decode for matching.
      fragment = decodeURI(fragment.replace(pathStripper, ''));

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // Don't include a trailing slash on the root.
      if (fragment === '' && url !== '/') url = url.slice(0, -1);

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getHash(this.iframe))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;

}));

/** vim: et:ts=4:sw=4:sts=4
 * @license RequireJS 2.1.14 Copyright (c) 2010-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/requirejs for details
 */
//Not using strict: uneven strict support in browsers, #392, and causes
//problems with requirejs.exec()/transpiler plugins that may not be strict.
/*jslint regexp: true, nomen: true, sloppy: true */
/*global window, navigator, document, importScripts, setTimeout, opera */

var requirejs, require, define;
(function (global) {
    var req, s, head, baseElement, dataMain, src,
        interactiveScript, currentlyAddingScript, mainScript, subPath,
        version = '2.1.14',
        commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
        cjsRequireRegExp = /[^.]\s*require\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
        jsSuffixRegExp = /\.js$/,
        currDirRegExp = /^\.\//,
        op = Object.prototype,
        ostring = op.toString,
        hasOwn = op.hasOwnProperty,
        ap = Array.prototype,
        apsp = ap.splice,
        isBrowser = !!(typeof window !== 'undefined' && typeof navigator !== 'undefined' && window.document),
        isWebWorker = !isBrowser && typeof importScripts !== 'undefined',
        //PS3 indicates loaded and complete, but need to wait for complete
        //specifically. Sequence is 'loading', 'loaded', execution,
        // then 'complete'. The UA check is unfortunate, but not sure how
        //to feature test w/o causing perf issues.
        readyRegExp = isBrowser && navigator.platform === 'PLAYSTATION 3' ?
                      /^complete$/ : /^(complete|loaded)$/,
        defContextName = '_',
        //Oh the tragedy, detecting opera. See the usage of isOpera for reason.
        isOpera = typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
        contexts = {},
        cfg = {},
        globalDefQueue = [],
        useInteractive = false;

    function isFunction(it) {
        return ostring.call(it) === '[object Function]';
    }

    function isArray(it) {
        return ostring.call(it) === '[object Array]';
    }

    /**
     * Helper function for iterating over an array. If the func returns
     * a true value, it will break out of the loop.
     */
    function each(ary, func) {
        if (ary) {
            var i;
            for (i = 0; i < ary.length; i += 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    /**
     * Helper function for iterating over an array backwards. If the func
     * returns a true value, it will break out of the loop.
     */
    function eachReverse(ary, func) {
        if (ary) {
            var i;
            for (i = ary.length - 1; i > -1; i -= 1) {
                if (ary[i] && func(ary[i], i, ary)) {
                    break;
                }
            }
        }
    }

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    function getOwn(obj, prop) {
        return hasProp(obj, prop) && obj[prop];
    }

    /**
     * Cycles over properties in an object and calls a function for each
     * property value. If the function returns a truthy value, then the
     * iteration is stopped.
     */
    function eachProp(obj, func) {
        var prop;
        for (prop in obj) {
            if (hasProp(obj, prop)) {
                if (func(obj[prop], prop)) {
                    break;
                }
            }
        }
    }

    /**
     * Simple function to mix in properties from source into target,
     * but only if target does not already have a property of the same name.
     */
    function mixin(target, source, force, deepStringMixin) {
        if (source) {
            eachProp(source, function (value, prop) {
                if (force || !hasProp(target, prop)) {
                    if (deepStringMixin && typeof value === 'object' && value &&
                        !isArray(value) && !isFunction(value) &&
                        !(value instanceof RegExp)) {

                        if (!target[prop]) {
                            target[prop] = {};
                        }
                        mixin(target[prop], value, force, deepStringMixin);
                    } else {
                        target[prop] = value;
                    }
                }
            });
        }
        return target;
    }

    //Similar to Function.prototype.bind, but the 'this' object is specified
    //first, since it is easier to read/figure out what 'this' will be.
    function bind(obj, fn) {
        return function () {
            return fn.apply(obj, arguments);
        };
    }

    function scripts() {
        return document.getElementsByTagName('script');
    }

    function defaultOnError(err) {
        throw err;
    }

    //Allow getting a global that is expressed in
    //dot notation, like 'a.b.c'.
    function getGlobal(value) {
        if (!value) {
            return value;
        }
        var g = global;
        each(value.split('.'), function (part) {
            g = g[part];
        });
        return g;
    }

    /**
     * Constructs an error with a pointer to an URL with more information.
     * @param {String} id the error ID that maps to an ID on a web page.
     * @param {String} message human readable error.
     * @param {Error} [err] the original error, if there is one.
     *
     * @returns {Error}
     */
    function makeError(id, msg, err, requireModules) {
        var e = new Error(msg + '\nhttp://requirejs.org/docs/errors.html#' + id);
        e.requireType = id;
        e.requireModules = requireModules;
        if (err) {
            e.originalError = err;
        }
        return e;
    }

    if (typeof define !== 'undefined') {
        //If a define is already in play via another AMD loader,
        //do not overwrite.
        return;
    }

    if (typeof requirejs !== 'undefined') {
        if (isFunction(requirejs)) {
            //Do not overwrite an existing requirejs instance.
            return;
        }
        cfg = requirejs;
        requirejs = undefined;
    }

    //Allow for a require config object
    if (typeof require !== 'undefined' && !isFunction(require)) {
        //assume it is a config object.
        cfg = require;
        require = undefined;
    }

    function newContext(contextName) {
        var inCheckLoaded, Module, context, handlers,
            checkLoadedTimeoutId,
            config = {
                //Defaults. Do not set a default for map
                //config to speed up normalize(), which
                //will run faster if there is no default.
                waitSeconds: 7,
                baseUrl: './',
                paths: {},
                bundles: {},
                pkgs: {},
                shim: {},
                config: {}
            },
            registry = {},
            //registry of just enabled modules, to speed
            //cycle breaking code when lots of modules
            //are registered, but not activated.
            enabledRegistry = {},
            undefEvents = {},
            defQueue = [],
            defined = {},
            urlFetched = {},
            bundlesMap = {},
            requireCounter = 1,
            unnormalizedCounter = 1;

        /**
         * Trims the . and .. from an array of path segments.
         * It will keep a leading path segment if a .. will become
         * the first path segment, to help with module name lookups,
         * which act like paths, but can be remapped. But the end result,
         * all paths that use this function should look normalized.
         * NOTE: this method MODIFIES the input array.
         * @param {Array} ary the array of path segments.
         */
        function trimDots(ary) {
            var i, part;
            for (i = 0; i < ary.length; i++) {
                part = ary[i];
                if (part === '.') {
                    ary.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i == 1 && ary[2] === '..') || ary[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        ary.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
        }

        /**
         * Given a relative module name, like ./something, normalize it to
         * a real name that can be mapped to a path.
         * @param {String} name the relative name
         * @param {String} baseName a real name that the name arg is relative
         * to.
         * @param {Boolean} applyMap apply the map config to the value. Should
         * only be done if this normalization is for a dependency ID.
         * @returns {String} normalized name
         */
        function normalize(name, baseName, applyMap) {
            var pkgMain, mapValue, nameParts, i, j, nameSegment, lastIndex,
                foundMap, foundI, foundStarMap, starI, normalizedBaseParts,
                baseParts = (baseName && baseName.split('/')),
                map = config.map,
                starMap = map && map['*'];

            //Adjust any relative paths.
            if (name) {
                name = name.split('/');
                lastIndex = name.length - 1;

                // If wanting node ID compatibility, strip .js from end
                // of IDs. Have to do this here, and not in nameToUrl
                // because node allows either .js or non .js to map
                // to same file.
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                // Starts with a '.' so need the baseName
                if (name[0].charAt(0) === '.' && baseParts) {
                    //Convert baseName to array, and lop off the last part,
                    //so that . matches that 'directory' and not name of the baseName's
                    //module. For instance, baseName of 'one/two/three', maps to
                    //'one/two/three.js', but we want the directory, 'one/two' for
                    //this normalization.
                    normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                    name = normalizedBaseParts.concat(name);
                }

                trimDots(name);
                name = name.join('/');
            }

            //Apply map config if available.
            if (applyMap && map && (baseParts || starMap)) {
                nameParts = name.split('/');

                outerLoop: for (i = nameParts.length; i > 0; i -= 1) {
                    nameSegment = nameParts.slice(0, i).join('/');

                    if (baseParts) {
                        //Find the longest baseName segment match in the config.
                        //So, do joins on the biggest to smallest lengths of baseParts.
                        for (j = baseParts.length; j > 0; j -= 1) {
                            mapValue = getOwn(map, baseParts.slice(0, j).join('/'));

                            //baseName segment has config, find if it has one for
                            //this name.
                            if (mapValue) {
                                mapValue = getOwn(mapValue, nameSegment);
                                if (mapValue) {
                                    //Match, update name to the new value.
                                    foundMap = mapValue;
                                    foundI = i;
                                    break outerLoop;
                                }
                            }
                        }
                    }

                    //Check for a star map match, but just hold on to it,
                    //if there is a shorter segment match later in a matching
                    //config, then favor over this star map.
                    if (!foundStarMap && starMap && getOwn(starMap, nameSegment)) {
                        foundStarMap = getOwn(starMap, nameSegment);
                        starI = i;
                    }
                }

                if (!foundMap && foundStarMap) {
                    foundMap = foundStarMap;
                    foundI = starI;
                }

                if (foundMap) {
                    nameParts.splice(0, foundI, foundMap);
                    name = nameParts.join('/');
                }
            }

            // If the name points to a package's name, use
            // the package main instead.
            pkgMain = getOwn(config.pkgs, name);

            return pkgMain ? pkgMain : name;
        }

        function removeScript(name) {
            if (isBrowser) {
                each(scripts(), function (scriptNode) {
                    if (scriptNode.getAttribute('data-requiremodule') === name &&
                            scriptNode.getAttribute('data-requirecontext') === context.contextName) {
                        scriptNode.parentNode.removeChild(scriptNode);
                        return true;
                    }
                });
            }
        }

        function hasPathFallback(id) {
            var pathConfig = getOwn(config.paths, id);
            if (pathConfig && isArray(pathConfig) && pathConfig.length > 1) {
                //Pop off the first array value, since it failed, and
                //retry
                pathConfig.shift();
                context.require.undef(id);

                //Custom require that does not do map translation, since
                //ID is "absolute", already mapped/resolved.
                context.makeRequire(null, {
                    skipMap: true
                })([id]);

                return true;
            }
        }

        //Turns a plugin!resource to [plugin, resource]
        //with the plugin being undefined if the name
        //did not have a plugin prefix.
        function splitPrefix(name) {
            var prefix,
                index = name ? name.indexOf('!') : -1;
            if (index > -1) {
                prefix = name.substring(0, index);
                name = name.substring(index + 1, name.length);
            }
            return [prefix, name];
        }

        /**
         * Creates a module mapping that includes plugin prefix, module
         * name, and path. If parentModuleMap is provided it will
         * also normalize the name via require.normalize()
         *
         * @param {String} name the module name
         * @param {String} [parentModuleMap] parent module map
         * for the module name, used to resolve relative names.
         * @param {Boolean} isNormalized: is the ID already normalized.
         * This is true if this call is done for a define() module ID.
         * @param {Boolean} applyMap: apply the map config to the ID.
         * Should only be true if this map is for a dependency.
         *
         * @returns {Object}
         */
        function makeModuleMap(name, parentModuleMap, isNormalized, applyMap) {
            var url, pluginModule, suffix, nameParts,
                prefix = null,
                parentName = parentModuleMap ? parentModuleMap.name : null,
                originalName = name,
                isDefine = true,
                normalizedName = '';

            //If no name, then it means it is a require call, generate an
            //internal name.
            if (!name) {
                isDefine = false;
                name = '_@r' + (requireCounter += 1);
            }

            nameParts = splitPrefix(name);
            prefix = nameParts[0];
            name = nameParts[1];

            if (prefix) {
                prefix = normalize(prefix, parentName, applyMap);
                pluginModule = getOwn(defined, prefix);
            }

            //Account for relative paths if there is a base name.
            if (name) {
                if (prefix) {
                    if (pluginModule && pluginModule.normalize) {
                        //Plugin is loaded, use its normalize method.
                        normalizedName = pluginModule.normalize(name, function (name) {
                            return normalize(name, parentName, applyMap);
                        });
                    } else {
                        // If nested plugin references, then do not try to
                        // normalize, as it will not normalize correctly. This
                        // places a restriction on resourceIds, and the longer
                        // term solution is not to normalize until plugins are
                        // loaded and all normalizations to allow for async
                        // loading of a loader plugin. But for now, fixes the
                        // common uses. Details in #1131
                        normalizedName = name.indexOf('!') === -1 ?
                                         normalize(name, parentName, applyMap) :
                                         name;
                    }
                } else {
                    //A regular module.
                    normalizedName = normalize(name, parentName, applyMap);

                    //Normalized name may be a plugin ID due to map config
                    //application in normalize. The map config values must
                    //already be normalized, so do not need to redo that part.
                    nameParts = splitPrefix(normalizedName);
                    prefix = nameParts[0];
                    normalizedName = nameParts[1];
                    isNormalized = true;

                    url = context.nameToUrl(normalizedName);
                }
            }

            //If the id is a plugin id that cannot be determined if it needs
            //normalization, stamp it with a unique ID so two matching relative
            //ids that may conflict can be separate.
            suffix = prefix && !pluginModule && !isNormalized ?
                     '_unnormalized' + (unnormalizedCounter += 1) :
                     '';

            return {
                prefix: prefix,
                name: normalizedName,
                parentMap: parentModuleMap,
                unnormalized: !!suffix,
                url: url,
                originalName: originalName,
                isDefine: isDefine,
                id: (prefix ?
                        prefix + '!' + normalizedName :
                        normalizedName) + suffix
            };
        }

        function getModule(depMap) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (!mod) {
                mod = registry[id] = new context.Module(depMap);
            }

            return mod;
        }

        function on(depMap, name, fn) {
            var id = depMap.id,
                mod = getOwn(registry, id);

            if (hasProp(defined, id) &&
                    (!mod || mod.defineEmitComplete)) {
                if (name === 'defined') {
                    fn(defined[id]);
                }
            } else {
                mod = getModule(depMap);
                if (mod.error && name === 'error') {
                    fn(mod.error);
                } else {
                    mod.on(name, fn);
                }
            }
        }

        function onError(err, errback) {
            var ids = err.requireModules,
                notified = false;

            if (errback) {
                errback(err);
            } else {
                each(ids, function (id) {
                    var mod = getOwn(registry, id);
                    if (mod) {
                        //Set error on module, so it skips timeout checks.
                        mod.error = err;
                        if (mod.events.error) {
                            notified = true;
                            mod.emit('error', err);
                        }
                    }
                });

                if (!notified) {
                    req.onError(err);
                }
            }
        }

        /**
         * Internal method to transfer globalQueue items to this context's
         * defQueue.
         */
        function takeGlobalQueue() {
            //Push all the globalDefQueue items into the context's defQueue
            if (globalDefQueue.length) {
                //Array splice in the values since the context code has a
                //local var ref to defQueue, so cannot just reassign the one
                //on context.
                apsp.apply(defQueue,
                           [defQueue.length, 0].concat(globalDefQueue));
                globalDefQueue = [];
            }
        }

        handlers = {
            'require': function (mod) {
                if (mod.require) {
                    return mod.require;
                } else {
                    return (mod.require = context.makeRequire(mod.map));
                }
            },
            'exports': function (mod) {
                mod.usingExports = true;
                if (mod.map.isDefine) {
                    if (mod.exports) {
                        return (defined[mod.map.id] = mod.exports);
                    } else {
                        return (mod.exports = defined[mod.map.id] = {});
                    }
                }
            },
            'module': function (mod) {
                if (mod.module) {
                    return mod.module;
                } else {
                    return (mod.module = {
                        id: mod.map.id,
                        uri: mod.map.url,
                        config: function () {
                            return  getOwn(config.config, mod.map.id) || {};
                        },
                        exports: mod.exports || (mod.exports = {})
                    });
                }
            }
        };

        function cleanRegistry(id) {
            //Clean up machinery used for waiting modules.
            delete registry[id];
            delete enabledRegistry[id];
        }

        function breakCycle(mod, traced, processed) {
            var id = mod.map.id;

            if (mod.error) {
                mod.emit('error', mod.error);
            } else {
                traced[id] = true;
                each(mod.depMaps, function (depMap, i) {
                    var depId = depMap.id,
                        dep = getOwn(registry, depId);

                    //Only force things that have not completed
                    //being defined, so still in the registry,
                    //and only if it has not been matched up
                    //in the module already.
                    if (dep && !mod.depMatched[i] && !processed[depId]) {
                        if (getOwn(traced, depId)) {
                            mod.defineDep(i, defined[depId]);
                            mod.check(); //pass false?
                        } else {
                            breakCycle(dep, traced, processed);
                        }
                    }
                });
                processed[id] = true;
            }
        }

        function checkLoaded() {
            var err, usingPathFallback,
                waitInterval = config.waitSeconds * 1000,
                //It is possible to disable the wait interval by using waitSeconds of 0.
                expired = waitInterval && (context.startTime + waitInterval) < new Date().getTime(),
                noLoads = [],
                reqCalls = [],
                stillLoading = false,
                needCycleCheck = true;

            //Do not bother if this call was a result of a cycle break.
            if (inCheckLoaded) {
                return;
            }

            inCheckLoaded = true;

            //Figure out the state of all the modules.
            eachProp(enabledRegistry, function (mod) {
                var map = mod.map,
                    modId = map.id;

                //Skip things that are not enabled or in error state.
                if (!mod.enabled) {
                    return;
                }

                if (!map.isDefine) {
                    reqCalls.push(mod);
                }

                if (!mod.error) {
                    //If the module should be executed, and it has not
                    //been inited and time is up, remember it.
                    if (!mod.inited && expired) {
                        if (hasPathFallback(modId)) {
                            usingPathFallback = true;
                            stillLoading = true;
                        } else {
                            noLoads.push(modId);
                            removeScript(modId);
                        }
                    } else if (!mod.inited && mod.fetched && map.isDefine) {
                        stillLoading = true;
                        if (!map.prefix) {
                            //No reason to keep looking for unfinished
                            //loading. If the only stillLoading is a
                            //plugin resource though, keep going,
                            //because it may be that a plugin resource
                            //is waiting on a non-plugin cycle.
                            return (needCycleCheck = false);
                        }
                    }
                }
            });

            if (expired && noLoads.length) {
                //If wait time expired, throw error of unloaded modules.
                err = makeError('timeout', 'Load timeout for modules: ' + noLoads, null, noLoads);
                err.contextName = context.contextName;
                return onError(err);
            }

            //Not expired, check for a cycle.
            if (needCycleCheck) {
                each(reqCalls, function (mod) {
                    breakCycle(mod, {}, {});
                });
            }

            //If still waiting on loads, and the waiting load is something
            //other than a plugin resource, or there are still outstanding
            //scripts, then just try back later.
            if ((!expired || usingPathFallback) && stillLoading) {
                //Something is still waiting to load. Wait for it, but only
                //if a timeout is not already in effect.
                if ((isBrowser || isWebWorker) && !checkLoadedTimeoutId) {
                    checkLoadedTimeoutId = setTimeout(function () {
                        checkLoadedTimeoutId = 0;
                        checkLoaded();
                    }, 50);
                }
            }

            inCheckLoaded = false;
        }

        Module = function (map) {
            this.events = getOwn(undefEvents, map.id) || {};
            this.map = map;
            this.shim = getOwn(config.shim, map.id);
            this.depExports = [];
            this.depMaps = [];
            this.depMatched = [];
            this.pluginMaps = {};
            this.depCount = 0;

            /* this.exports this.factory
               this.depMaps = [],
               this.enabled, this.fetched
            */
        };

        Module.prototype = {
            init: function (depMaps, factory, errback, options) {
                options = options || {};

                //Do not do more inits if already done. Can happen if there
                //are multiple define calls for the same module. That is not
                //a normal, common case, but it is also not unexpected.
                if (this.inited) {
                    return;
                }

                this.factory = factory;

                if (errback) {
                    //Register for errors on this module.
                    this.on('error', errback);
                } else if (this.events.error) {
                    //If no errback already, but there are error listeners
                    //on this module, set up an errback to pass to the deps.
                    errback = bind(this, function (err) {
                        this.emit('error', err);
                    });
                }

                //Do a copy of the dependency array, so that
                //source inputs are not modified. For example
                //"shim" deps are passed in here directly, and
                //doing a direct modification of the depMaps array
                //would affect that config.
                this.depMaps = depMaps && depMaps.slice(0);

                this.errback = errback;

                //Indicate this module has be initialized
                this.inited = true;

                this.ignore = options.ignore;

                //Could have option to init this module in enabled mode,
                //or could have been previously marked as enabled. However,
                //the dependencies are not known until init is called. So
                //if enabled previously, now trigger dependencies as enabled.
                if (options.enabled || this.enabled) {
                    //Enable this module and dependencies.
                    //Will call this.check()
                    this.enable();
                } else {
                    this.check();
                }
            },

            defineDep: function (i, depExports) {
                //Because of cycles, defined callback for a given
                //export can be called more than once.
                if (!this.depMatched[i]) {
                    this.depMatched[i] = true;
                    this.depCount -= 1;
                    this.depExports[i] = depExports;
                }
            },

            fetch: function () {
                if (this.fetched) {
                    return;
                }
                this.fetched = true;

                context.startTime = (new Date()).getTime();

                var map = this.map;

                //If the manager is for a plugin managed resource,
                //ask the plugin to load it now.
                if (this.shim) {
                    context.makeRequire(this.map, {
                        enableBuildCallback: true
                    })(this.shim.deps || [], bind(this, function () {
                        return map.prefix ? this.callPlugin() : this.load();
                    }));
                } else {
                    //Regular dependency.
                    return map.prefix ? this.callPlugin() : this.load();
                }
            },

            load: function () {
                var url = this.map.url;

                //Regular dependency.
                if (!urlFetched[url]) {
                    urlFetched[url] = true;
                    context.load(this.map.id, url);
                }
            },

            /**
             * Checks if the module is ready to define itself, and if so,
             * define it.
             */
            check: function () {
                if (!this.enabled || this.enabling) {
                    return;
                }

                var err, cjsModule,
                    id = this.map.id,
                    depExports = this.depExports,
                    exports = this.exports,
                    factory = this.factory;

                if (!this.inited) {
                    this.fetch();
                } else if (this.error) {
                    this.emit('error', this.error);
                } else if (!this.defining) {
                    //The factory could trigger another require call
                    //that would result in checking this module to
                    //define itself again. If already in the process
                    //of doing that, skip this work.
                    this.defining = true;

                    if (this.depCount < 1 && !this.defined) {
                        if (isFunction(factory)) {
                            //If there is an error listener, favor passing
                            //to that instead of throwing an error. However,
                            //only do it for define()'d  modules. require
                            //errbacks should not be called for failures in
                            //their callbacks (#699). However if a global
                            //onError is set, use that.
                            if ((this.events.error && this.map.isDefine) ||
                                req.onError !== defaultOnError) {
                                try {
                                    exports = context.execCb(id, factory, depExports, exports);
                                } catch (e) {
                                    err = e;
                                }
                            } else {
                                exports = context.execCb(id, factory, depExports, exports);
                            }

                            // Favor return value over exports. If node/cjs in play,
                            // then will not have a return value anyway. Favor
                            // module.exports assignment over exports object.
                            if (this.map.isDefine && exports === undefined) {
                                cjsModule = this.module;
                                if (cjsModule) {
                                    exports = cjsModule.exports;
                                } else if (this.usingExports) {
                                    //exports already set the defined value.
                                    exports = this.exports;
                                }
                            }

                            if (err) {
                                err.requireMap = this.map;
                                err.requireModules = this.map.isDefine ? [this.map.id] : null;
                                err.requireType = this.map.isDefine ? 'define' : 'require';
                                return onError((this.error = err));
                            }

                        } else {
                            //Just a literal value
                            exports = factory;
                        }

                        this.exports = exports;

                        if (this.map.isDefine && !this.ignore) {
                            defined[id] = exports;

                            if (req.onResourceLoad) {
                                req.onResourceLoad(context, this.map, this.depMaps);
                            }
                        }

                        //Clean up
                        cleanRegistry(id);

                        this.defined = true;
                    }

                    //Finished the define stage. Allow calling check again
                    //to allow define notifications below in the case of a
                    //cycle.
                    this.defining = false;

                    if (this.defined && !this.defineEmitted) {
                        this.defineEmitted = true;
                        this.emit('defined', this.exports);
                        this.defineEmitComplete = true;
                    }

                }
            },

            callPlugin: function () {
                var map = this.map,
                    id = map.id,
                    //Map already normalized the prefix.
                    pluginMap = makeModuleMap(map.prefix);

                //Mark this as a dependency for this plugin, so it
                //can be traced for cycles.
                this.depMaps.push(pluginMap);

                on(pluginMap, 'defined', bind(this, function (plugin) {
                    var load, normalizedMap, normalizedMod,
                        bundleId = getOwn(bundlesMap, this.map.id),
                        name = this.map.name,
                        parentName = this.map.parentMap ? this.map.parentMap.name : null,
                        localRequire = context.makeRequire(map.parentMap, {
                            enableBuildCallback: true
                        });

                    //If current map is not normalized, wait for that
                    //normalized name to load instead of continuing.
                    if (this.map.unnormalized) {
                        //Normalize the ID if the plugin allows it.
                        if (plugin.normalize) {
                            name = plugin.normalize(name, function (name) {
                                return normalize(name, parentName, true);
                            }) || '';
                        }

                        //prefix and name should already be normalized, no need
                        //for applying map config again either.
                        normalizedMap = makeModuleMap(map.prefix + '!' + name,
                                                      this.map.parentMap);
                        on(normalizedMap,
                            'defined', bind(this, function (value) {
                                this.init([], function () { return value; }, null, {
                                    enabled: true,
                                    ignore: true
                                });
                            }));

                        normalizedMod = getOwn(registry, normalizedMap.id);
                        if (normalizedMod) {
                            //Mark this as a dependency for this plugin, so it
                            //can be traced for cycles.
                            this.depMaps.push(normalizedMap);

                            if (this.events.error) {
                                normalizedMod.on('error', bind(this, function (err) {
                                    this.emit('error', err);
                                }));
                            }
                            normalizedMod.enable();
                        }

                        return;
                    }

                    //If a paths config, then just load that file instead to
                    //resolve the plugin, as it is built into that paths layer.
                    if (bundleId) {
                        this.map.url = context.nameToUrl(bundleId);
                        this.load();
                        return;
                    }

                    load = bind(this, function (value) {
                        this.init([], function () { return value; }, null, {
                            enabled: true
                        });
                    });

                    load.error = bind(this, function (err) {
                        this.inited = true;
                        this.error = err;
                        err.requireModules = [id];

                        //Remove temp unnormalized modules for this module,
                        //since they will never be resolved otherwise now.
                        eachProp(registry, function (mod) {
                            if (mod.map.id.indexOf(id + '_unnormalized') === 0) {
                                cleanRegistry(mod.map.id);
                            }
                        });

                        onError(err);
                    });

                    //Allow plugins to load other code without having to know the
                    //context or how to 'complete' the load.
                    load.fromText = bind(this, function (text, textAlt) {
                        /*jslint evil: true */
                        var moduleName = map.name,
                            moduleMap = makeModuleMap(moduleName),
                            hasInteractive = useInteractive;

                        //As of 2.1.0, support just passing the text, to reinforce
                        //fromText only being called once per resource. Still
                        //support old style of passing moduleName but discard
                        //that moduleName in favor of the internal ref.
                        if (textAlt) {
                            text = textAlt;
                        }

                        //Turn off interactive script matching for IE for any define
                        //calls in the text, then turn it back on at the end.
                        if (hasInteractive) {
                            useInteractive = false;
                        }

                        //Prime the system by creating a module instance for
                        //it.
                        getModule(moduleMap);

                        //Transfer any config to this other module.
                        if (hasProp(config.config, id)) {
                            config.config[moduleName] = config.config[id];
                        }

                        try {
                            req.exec(text);
                        } catch (e) {
                            return onError(makeError('fromtexteval',
                                             'fromText eval for ' + id +
                                            ' failed: ' + e,
                                             e,
                                             [id]));
                        }

                        if (hasInteractive) {
                            useInteractive = true;
                        }

                        //Mark this as a dependency for the plugin
                        //resource
                        this.depMaps.push(moduleMap);

                        //Support anonymous modules.
                        context.completeLoad(moduleName);

                        //Bind the value of that module to the value for this
                        //resource ID.
                        localRequire([moduleName], load);
                    });

                    //Use parentName here since the plugin's name is not reliable,
                    //could be some weird string with no path that actually wants to
                    //reference the parentName's path.
                    plugin.load(map.name, localRequire, load, config);
                }));

                context.enable(pluginMap, this);
                this.pluginMaps[pluginMap.id] = pluginMap;
            },

            enable: function () {
                enabledRegistry[this.map.id] = this;
                this.enabled = true;

                //Set flag mentioning that the module is enabling,
                //so that immediate calls to the defined callbacks
                //for dependencies do not trigger inadvertent load
                //with the depCount still being zero.
                this.enabling = true;

                //Enable each dependency
                each(this.depMaps, bind(this, function (depMap, i) {
                    var id, mod, handler;

                    if (typeof depMap === 'string') {
                        //Dependency needs to be converted to a depMap
                        //and wired up to this module.
                        depMap = makeModuleMap(depMap,
                                               (this.map.isDefine ? this.map : this.map.parentMap),
                                               false,
                                               !this.skipMap);
                        this.depMaps[i] = depMap;

                        handler = getOwn(handlers, depMap.id);

                        if (handler) {
                            this.depExports[i] = handler(this);
                            return;
                        }

                        this.depCount += 1;

                        on(depMap, 'defined', bind(this, function (depExports) {
                            this.defineDep(i, depExports);
                            this.check();
                        }));

                        if (this.errback) {
                            on(depMap, 'error', bind(this, this.errback));
                        }
                    }

                    id = depMap.id;
                    mod = registry[id];

                    //Skip special modules like 'require', 'exports', 'module'
                    //Also, don't call enable if it is already enabled,
                    //important in circular dependency cases.
                    if (!hasProp(handlers, id) && mod && !mod.enabled) {
                        context.enable(depMap, this);
                    }
                }));

                //Enable each plugin that is used in
                //a dependency
                eachProp(this.pluginMaps, bind(this, function (pluginMap) {
                    var mod = getOwn(registry, pluginMap.id);
                    if (mod && !mod.enabled) {
                        context.enable(pluginMap, this);
                    }
                }));

                this.enabling = false;

                this.check();
            },

            on: function (name, cb) {
                var cbs = this.events[name];
                if (!cbs) {
                    cbs = this.events[name] = [];
                }
                cbs.push(cb);
            },

            emit: function (name, evt) {
                each(this.events[name], function (cb) {
                    cb(evt);
                });
                if (name === 'error') {
                    //Now that the error handler was triggered, remove
                    //the listeners, since this broken Module instance
                    //can stay around for a while in the registry.
                    delete this.events[name];
                }
            }
        };

        function callGetModule(args) {
            //Skip modules already defined.
            if (!hasProp(defined, args[0])) {
                getModule(makeModuleMap(args[0], null, true)).init(args[1], args[2]);
            }
        }

        function removeListener(node, func, name, ieName) {
            //Favor detachEvent because of IE9
            //issue, see attachEvent/addEventListener comment elsewhere
            //in this file.
            if (node.detachEvent && !isOpera) {
                //Probably IE. If not it will throw an error, which will be
                //useful to know.
                if (ieName) {
                    node.detachEvent(ieName, func);
                }
            } else {
                node.removeEventListener(name, func, false);
            }
        }

        /**
         * Given an event from a script node, get the requirejs info from it,
         * and then removes the event listeners on the node.
         * @param {Event} evt
         * @returns {Object}
         */
        function getScriptData(evt) {
            //Using currentTarget instead of target for Firefox 2.0's sake. Not
            //all old browsers will be supported, but this one was easy enough
            //to support and still makes sense.
            var node = evt.currentTarget || evt.srcElement;

            //Remove the listeners once here.
            removeListener(node, context.onScriptLoad, 'load', 'onreadystatechange');
            removeListener(node, context.onScriptError, 'error');

            return {
                node: node,
                id: node && node.getAttribute('data-requiremodule')
            };
        }

        function intakeDefines() {
            var args;

            //Any defined modules in the global queue, intake them now.
            takeGlobalQueue();

            //Make sure any remaining defQueue items get properly processed.
            while (defQueue.length) {
                args = defQueue.shift();
                if (args[0] === null) {
                    return onError(makeError('mismatch', 'Mismatched anonymous define() module: ' + args[args.length - 1]));
                } else {
                    //args are id, deps, factory. Should be normalized by the
                    //define() function.
                    callGetModule(args);
                }
            }
        }

        context = {
            config: config,
            contextName: contextName,
            registry: registry,
            defined: defined,
            urlFetched: urlFetched,
            defQueue: defQueue,
            Module: Module,
            makeModuleMap: makeModuleMap,
            nextTick: req.nextTick,
            onError: onError,

            /**
             * Set a configuration for the context.
             * @param {Object} cfg config object to integrate.
             */
            configure: function (cfg) {
                //Make sure the baseUrl ends in a slash.
                if (cfg.baseUrl) {
                    if (cfg.baseUrl.charAt(cfg.baseUrl.length - 1) !== '/') {
                        cfg.baseUrl += '/';
                    }
                }

                //Save off the paths since they require special processing,
                //they are additive.
                var shim = config.shim,
                    objs = {
                        paths: true,
                        bundles: true,
                        config: true,
                        map: true
                    };

                eachProp(cfg, function (value, prop) {
                    if (objs[prop]) {
                        if (!config[prop]) {
                            config[prop] = {};
                        }
                        mixin(config[prop], value, true, true);
                    } else {
                        config[prop] = value;
                    }
                });

                //Reverse map the bundles
                if (cfg.bundles) {
                    eachProp(cfg.bundles, function (value, prop) {
                        each(value, function (v) {
                            if (v !== prop) {
                                bundlesMap[v] = prop;
                            }
                        });
                    });
                }

                //Merge shim
                if (cfg.shim) {
                    eachProp(cfg.shim, function (value, id) {
                        //Normalize the structure
                        if (isArray(value)) {
                            value = {
                                deps: value
                            };
                        }
                        if ((value.exports || value.init) && !value.exportsFn) {
                            value.exportsFn = context.makeShimExports(value);
                        }
                        shim[id] = value;
                    });
                    config.shim = shim;
                }

                //Adjust packages if necessary.
                if (cfg.packages) {
                    each(cfg.packages, function (pkgObj) {
                        var location, name;

                        pkgObj = typeof pkgObj === 'string' ? { name: pkgObj } : pkgObj;

                        name = pkgObj.name;
                        location = pkgObj.location;
                        if (location) {
                            config.paths[name] = pkgObj.location;
                        }

                        //Save pointer to main module ID for pkg name.
                        //Remove leading dot in main, so main paths are normalized,
                        //and remove any trailing .js, since different package
                        //envs have different conventions: some use a module name,
                        //some use a file name.
                        config.pkgs[name] = pkgObj.name + '/' + (pkgObj.main || 'main')
                                     .replace(currDirRegExp, '')
                                     .replace(jsSuffixRegExp, '');
                    });
                }

                //If there are any "waiting to execute" modules in the registry,
                //update the maps for them, since their info, like URLs to load,
                //may have changed.
                eachProp(registry, function (mod, id) {
                    //If module already has init called, since it is too
                    //late to modify them, and ignore unnormalized ones
                    //since they are transient.
                    if (!mod.inited && !mod.map.unnormalized) {
                        mod.map = makeModuleMap(id);
                    }
                });

                //If a deps array or a config callback is specified, then call
                //require with those args. This is useful when require is defined as a
                //config object before require.js is loaded.
                if (cfg.deps || cfg.callback) {
                    context.require(cfg.deps || [], cfg.callback);
                }
            },

            makeShimExports: function (value) {
                function fn() {
                    var ret;
                    if (value.init) {
                        ret = value.init.apply(global, arguments);
                    }
                    return ret || (value.exports && getGlobal(value.exports));
                }
                return fn;
            },

            makeRequire: function (relMap, options) {
                options = options || {};

                function localRequire(deps, callback, errback) {
                    var id, map, requireMod;

                    if (options.enableBuildCallback && callback && isFunction(callback)) {
                        callback.__requireJsBuild = true;
                    }

                    if (typeof deps === 'string') {
                        if (isFunction(callback)) {
                            //Invalid call
                            return onError(makeError('requireargs', 'Invalid require call'), errback);
                        }

                        //If require|exports|module are requested, get the
                        //value for them from the special handlers. Caveat:
                        //this only works while module is being defined.
                        if (relMap && hasProp(handlers, deps)) {
                            return handlers[deps](registry[relMap.id]);
                        }

                        //Synchronous access to one module. If require.get is
                        //available (as in the Node adapter), prefer that.
                        if (req.get) {
                            return req.get(context, deps, relMap, localRequire);
                        }

                        //Normalize module name, if it contains . or ..
                        map = makeModuleMap(deps, relMap, false, true);
                        id = map.id;

                        if (!hasProp(defined, id)) {
                            return onError(makeError('notloaded', 'Module name "' +
                                        id +
                                        '" has not been loaded yet for context: ' +
                                        contextName +
                                        (relMap ? '' : '. Use require([])')));
                        }
                        return defined[id];
                    }

                    //Grab defines waiting in the global queue.
                    intakeDefines();

                    //Mark all the dependencies as needing to be loaded.
                    context.nextTick(function () {
                        //Some defines could have been added since the
                        //require call, collect them.
                        intakeDefines();

                        requireMod = getModule(makeModuleMap(null, relMap));

                        //Store if map config should be applied to this require
                        //call for dependencies.
                        requireMod.skipMap = options.skipMap;

                        requireMod.init(deps, callback, errback, {
                            enabled: true
                        });

                        checkLoaded();
                    });

                    return localRequire;
                }

                mixin(localRequire, {
                    isBrowser: isBrowser,

                    /**
                     * Converts a module name + .extension into an URL path.
                     * *Requires* the use of a module name. It does not support using
                     * plain URLs like nameToUrl.
                     */
                    toUrl: function (moduleNamePlusExt) {
                        var ext,
                            index = moduleNamePlusExt.lastIndexOf('.'),
                            segment = moduleNamePlusExt.split('/')[0],
                            isRelative = segment === '.' || segment === '..';

                        //Have a file extension alias, and it is not the
                        //dots from a relative path.
                        if (index !== -1 && (!isRelative || index > 1)) {
                            ext = moduleNamePlusExt.substring(index, moduleNamePlusExt.length);
                            moduleNamePlusExt = moduleNamePlusExt.substring(0, index);
                        }

                        return context.nameToUrl(normalize(moduleNamePlusExt,
                                                relMap && relMap.id, true), ext,  true);
                    },

                    defined: function (id) {
                        return hasProp(defined, makeModuleMap(id, relMap, false, true).id);
                    },

                    specified: function (id) {
                        id = makeModuleMap(id, relMap, false, true).id;
                        return hasProp(defined, id) || hasProp(registry, id);
                    }
                });

                //Only allow undef on top level require calls
                if (!relMap) {
                    localRequire.undef = function (id) {
                        //Bind any waiting define() calls to this context,
                        //fix for #408
                        takeGlobalQueue();

                        var map = makeModuleMap(id, relMap, true),
                            mod = getOwn(registry, id);

                        removeScript(id);

                        delete defined[id];
                        delete urlFetched[map.url];
                        delete undefEvents[id];

                        //Clean queued defines too. Go backwards
                        //in array so that the splices do not
                        //mess up the iteration.
                        eachReverse(defQueue, function(args, i) {
                            if(args[0] === id) {
                                defQueue.splice(i, 1);
                            }
                        });

                        if (mod) {
                            //Hold on to listeners in case the
                            //module will be attempted to be reloaded
                            //using a different config.
                            if (mod.events.defined) {
                                undefEvents[id] = mod.events;
                            }

                            cleanRegistry(id);
                        }
                    };
                }

                return localRequire;
            },

            /**
             * Called to enable a module if it is still in the registry
             * awaiting enablement. A second arg, parent, the parent module,
             * is passed in for context, when this method is overridden by
             * the optimizer. Not shown here to keep code compact.
             */
            enable: function (depMap) {
                var mod = getOwn(registry, depMap.id);
                if (mod) {
                    getModule(depMap).enable();
                }
            },

            /**
             * Internal method used by environment adapters to complete a load event.
             * A load event could be a script load or just a load pass from a synchronous
             * load call.
             * @param {String} moduleName the name of the module to potentially complete.
             */
            completeLoad: function (moduleName) {
                var found, args, mod,
                    shim = getOwn(config.shim, moduleName) || {},
                    shExports = shim.exports;

                takeGlobalQueue();

                while (defQueue.length) {
                    args = defQueue.shift();
                    if (args[0] === null) {
                        args[0] = moduleName;
                        //If already found an anonymous module and bound it
                        //to this name, then this is some other anon module
                        //waiting for its completeLoad to fire.
                        if (found) {
                            break;
                        }
                        found = true;
                    } else if (args[0] === moduleName) {
                        //Found matching define call for this script!
                        found = true;
                    }

                    callGetModule(args);
                }

                //Do this after the cycle of callGetModule in case the result
                //of those calls/init calls changes the registry.
                mod = getOwn(registry, moduleName);

                if (!found && !hasProp(defined, moduleName) && mod && !mod.inited) {
                    if (config.enforceDefine && (!shExports || !getGlobal(shExports))) {
                        if (hasPathFallback(moduleName)) {
                            return;
                        } else {
                            return onError(makeError('nodefine',
                                             'No define call for ' + moduleName,
                                             null,
                                             [moduleName]));
                        }
                    } else {
                        //A script that does not call define(), so just simulate
                        //the call for it.
                        callGetModule([moduleName, (shim.deps || []), shim.exportsFn]);
                    }
                }

                checkLoaded();
            },

            /**
             * Converts a module name to a file path. Supports cases where
             * moduleName may actually be just an URL.
             * Note that it **does not** call normalize on the moduleName,
             * it is assumed to have already been normalized. This is an
             * internal API, not a public one. Use toUrl for the public API.
             */
            nameToUrl: function (moduleName, ext, skipExt) {
                var paths, syms, i, parentModule, url,
                    parentPath, bundleId,
                    pkgMain = getOwn(config.pkgs, moduleName);

                if (pkgMain) {
                    moduleName = pkgMain;
                }

                bundleId = getOwn(bundlesMap, moduleName);

                if (bundleId) {
                    return context.nameToUrl(bundleId, ext, skipExt);
                }

                //If a colon is in the URL, it indicates a protocol is used and it is just
                //an URL to a file, or if it starts with a slash, contains a query arg (i.e. ?)
                //or ends with .js, then assume the user meant to use an url and not a module id.
                //The slash is important for protocol-less URLs as well as full paths.
                if (req.jsExtRegExp.test(moduleName)) {
                    //Just a plain path, not module name lookup, so just return it.
                    //Add extension if it is included. This is a bit wonky, only non-.js things pass
                    //an extension, this method probably needs to be reworked.
                    url = moduleName + (ext || '');
                } else {
                    //A module that needs to be converted to a path.
                    paths = config.paths;

                    syms = moduleName.split('/');
                    //For each module name segment, see if there is a path
                    //registered for it. Start with most specific name
                    //and work up from it.
                    for (i = syms.length; i > 0; i -= 1) {
                        parentModule = syms.slice(0, i).join('/');

                        parentPath = getOwn(paths, parentModule);
                        if (parentPath) {
                            //If an array, it means there are a few choices,
                            //Choose the one that is desired
                            if (isArray(parentPath)) {
                                parentPath = parentPath[0];
                            }
                            syms.splice(0, i, parentPath);
                            break;
                        }
                    }

                    //Join the path parts together, then figure out if baseUrl is needed.
                    url = syms.join('/');
                    url += (ext || (/^data\:|\?/.test(url) || skipExt ? '' : '.js'));
                    url = (url.charAt(0) === '/' || url.match(/^[\w\+\.\-]+:/) ? '' : config.baseUrl) + url;
                }

                return config.urlArgs ? url +
                                        ((url.indexOf('?') === -1 ? '?' : '&') +
                                         config.urlArgs) : url;
            },

            //Delegates to req.load. Broken out as a separate function to
            //allow overriding in the optimizer.
            load: function (id, url) {
                req.load(context, id, url);
            },

            /**
             * Executes a module callback function. Broken out as a separate function
             * solely to allow the build system to sequence the files in the built
             * layer in the right sequence.
             *
             * @private
             */
            execCb: function (name, callback, args, exports) {
                return callback.apply(exports, args);
            },

            /**
             * callback for script loads, used to check status of loading.
             *
             * @param {Event} evt the event from the browser for the script
             * that was loaded.
             */
            onScriptLoad: function (evt) {
                //Using currentTarget instead of target for Firefox 2.0's sake. Not
                //all old browsers will be supported, but this one was easy enough
                //to support and still makes sense.
                if (evt.type === 'load' ||
                        (readyRegExp.test((evt.currentTarget || evt.srcElement).readyState))) {
                    //Reset interactive script so a script node is not held onto for
                    //to long.
                    interactiveScript = null;

                    //Pull out the name of the module and the context.
                    var data = getScriptData(evt);
                    context.completeLoad(data.id);
                }
            },

            /**
             * Callback for script errors.
             */
            onScriptError: function (evt) {
                var data = getScriptData(evt);
                if (!hasPathFallback(data.id)) {
                    return onError(makeError('scripterror', 'Script error for: ' + data.id, evt, [data.id]));
                }
            }
        };

        context.require = context.makeRequire();
        return context;
    }

    /**
     * Main entry point.
     *
     * If the only argument to require is a string, then the module that
     * is represented by that string is fetched for the appropriate context.
     *
     * If the first argument is an array, then it will be treated as an array
     * of dependency string names to fetch. An optional function callback can
     * be specified to execute when all of those dependencies are available.
     *
     * Make a local req variable to help Caja compliance (it assumes things
     * on a require that are not standardized), and to give a short
     * name for minification/local scope use.
     */
    req = requirejs = function (deps, callback, errback, optional) {

        //Find the right context, use default
        var context, config,
            contextName = defContextName;

        // Determine if have config object in the call.
        if (!isArray(deps) && typeof deps !== 'string') {
            // deps is a config object
            config = deps;
            if (isArray(callback)) {
                // Adjust args if there are dependencies
                deps = callback;
                callback = errback;
                errback = optional;
            } else {
                deps = [];
            }
        }

        if (config && config.context) {
            contextName = config.context;
        }

        context = getOwn(contexts, contextName);
        if (!context) {
            context = contexts[contextName] = req.s.newContext(contextName);
        }

        if (config) {
            context.configure(config);
        }

        return context.require(deps, callback, errback);
    };

    /**
     * Support require.config() to make it easier to cooperate with other
     * AMD loaders on globally agreed names.
     */
    req.config = function (config) {
        return req(config);
    };

    /**
     * Execute something after the current tick
     * of the event loop. Override for other envs
     * that have a better solution than setTimeout.
     * @param  {Function} fn function to execute later.
     */
    req.nextTick = typeof setTimeout !== 'undefined' ? function (fn) {
        setTimeout(fn, 4);
    } : function (fn) { fn(); };

    /**
     * Export require as a global, but only if it does not already exist.
     */
    if (!require) {
        require = req;
    }

    req.version = version;

    //Used to filter out dependencies that are already paths.
    req.jsExtRegExp = /^\/|:|\?|\.js$/;
    req.isBrowser = isBrowser;
    s = req.s = {
        contexts: contexts,
        newContext: newContext
    };

    //Create default context.
    req({});

    //Exports some context-sensitive methods on global require.
    each([
        'toUrl',
        'undef',
        'defined',
        'specified'
    ], function (prop) {
        //Reference from contexts instead of early binding to default context,
        //so that during builds, the latest instance of the default context
        //with its config gets used.
        req[prop] = function () {
            var ctx = contexts[defContextName];
            return ctx.require[prop].apply(ctx, arguments);
        };
    });

    if (isBrowser) {
        head = s.head = document.getElementsByTagName('head')[0];
        //If BASE tag is in play, using appendChild is a problem for IE6.
        //When that browser dies, this can be removed. Details in this jQuery bug:
        //http://dev.jquery.com/ticket/2709
        baseElement = document.getElementsByTagName('base')[0];
        if (baseElement) {
            head = s.head = baseElement.parentNode;
        }
    }

    /**
     * Any errors that require explicitly generates will be passed to this
     * function. Intercept/override it if you want custom error handling.
     * @param {Error} err the error object.
     */
    req.onError = defaultOnError;

    /**
     * Creates the node for the load command. Only used in browser envs.
     */
    req.createNode = function (config, moduleName, url) {
        var node = config.xhtml ?
                document.createElementNS('http://www.w3.org/1999/xhtml', 'html:script') :
                document.createElement('script');
        node.type = config.scriptType || 'text/javascript';
        node.charset = 'utf-8';
        node.async = true;
        return node;
    };

    /**
     * Does the request to load a module for the browser case.
     * Make this a separate function to allow other environments
     * to override it.
     *
     * @param {Object} context the require context to find state.
     * @param {String} moduleName the name of the module.
     * @param {Object} url the URL to the module.
     */
    req.load = function (context, moduleName, url) {
        var config = (context && context.config) || {},
            node;
        if (isBrowser) {
            //In the browser so use a script tag
            node = req.createNode(config, moduleName, url);

            node.setAttribute('data-requirecontext', context.contextName);
            node.setAttribute('data-requiremodule', moduleName);

            //Set up load listener. Test attachEvent first because IE9 has
            //a subtle issue in its addEventListener and script onload firings
            //that do not match the behavior of all other browsers with
            //addEventListener support, which fire the onload event for a
            //script right after the script execution. See:
            //https://connect.microsoft.com/IE/feedback/details/648057/script-onload-event-is-not-fired-immediately-after-script-execution
            //UNFORTUNATELY Opera implements attachEvent but does not follow the script
            //script execution mode.
            if (node.attachEvent &&
                    //Check if node.attachEvent is artificially added by custom script or
                    //natively supported by browser
                    //read https://github.com/jrburke/requirejs/issues/187
                    //if we can NOT find [native code] then it must NOT natively supported.
                    //in IE8, node.attachEvent does not have toString()
                    //Note the test for "[native code" with no closing brace, see:
                    //https://github.com/jrburke/requirejs/issues/273
                    !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                    !isOpera) {
                //Probably IE. IE (at least 6-8) do not fire
                //script onload right after executing the script, so
                //we cannot tie the anonymous define call to a name.
                //However, IE reports the script as being in 'interactive'
                //readyState at the time of the define call.
                useInteractive = true;

                node.attachEvent('onreadystatechange', context.onScriptLoad);
                //It would be great to add an error handler here to catch
                //404s in IE9+. However, onreadystatechange will fire before
                //the error handler, so that does not help. If addEventListener
                //is used, then IE will fire error before load, but we cannot
                //use that pathway given the connect.microsoft.com issue
                //mentioned above about not doing the 'script execute,
                //then fire the script load event listener before execute
                //next script' that other browsers do.
                //Best hope: IE10 fixes the issues,
                //and then destroys all installs of IE 6-9.
                //node.attachEvent('onerror', context.onScriptError);
            } else {
                node.addEventListener('load', context.onScriptLoad, false);
                node.addEventListener('error', context.onScriptError, false);
            }
            node.src = url;

            //For some cache cases in IE 6-8, the script executes before the end
            //of the appendChild execution, so to tie an anonymous define
            //call to the module name (which is stored on the node), hold on
            //to a reference to this node, but clear after the DOM insertion.
            currentlyAddingScript = node;
            if (baseElement) {
                head.insertBefore(node, baseElement);
            } else {
                head.appendChild(node);
            }
            currentlyAddingScript = null;

            return node;
        } else if (isWebWorker) {
            try {
                //In a web worker, use importScripts. This is not a very
                //efficient use of importScripts, importScripts will block until
                //its script is downloaded and evaluated. However, if web workers
                //are in play, the expectation that a build has been done so that
                //only one script needs to be loaded anyway. This may need to be
                //reevaluated if other use cases become common.
                importScripts(url);

                //Account for anonymous modules
                context.completeLoad(moduleName);
            } catch (e) {
                context.onError(makeError('importscripts',
                                'importScripts failed for ' +
                                    moduleName + ' at ' + url,
                                e,
                                [moduleName]));
            }
        }
    };

    function getInteractiveScript() {
        if (interactiveScript && interactiveScript.readyState === 'interactive') {
            return interactiveScript;
        }

        eachReverse(scripts(), function (script) {
            if (script.readyState === 'interactive') {
                return (interactiveScript = script);
            }
        });
        return interactiveScript;
    }

    //Look for a data-main script attribute, which could also adjust the baseUrl.
    if (isBrowser && !cfg.skipDataMain) {
        //Figure out baseUrl. Get it from the script tag with require.js in it.
        eachReverse(scripts(), function (script) {
            //Set the 'head' where we can append children by
            //using the script's parent.
            if (!head) {
                head = script.parentNode;
            }

            //Look for a data-main attribute to set main script for the page
            //to load. If it is there, the path to data main becomes the
            //baseUrl, if it is not already set.
            dataMain = script.getAttribute('data-main');
            if (dataMain) {
                //Preserve dataMain in case it is a path (i.e. contains '?')
                mainScript = dataMain;

                //Set final baseUrl if there is not already an explicit one.
                if (!cfg.baseUrl) {
                    //Pull off the directory of data-main for use as the
                    //baseUrl.
                    src = mainScript.split('/');
                    mainScript = src.pop();
                    subPath = src.length ? src.join('/')  + '/' : './';

                    cfg.baseUrl = subPath;
                }

                //Strip off any trailing .js since mainScript is now
                //like a module name.
                mainScript = mainScript.replace(jsSuffixRegExp, '');

                 //If mainScript is still a path, fall back to dataMain
                if (req.jsExtRegExp.test(mainScript)) {
                    mainScript = dataMain;
                }

                //Put the data-main script in the files to load.
                cfg.deps = cfg.deps ? cfg.deps.concat(mainScript) : [mainScript];

                return true;
            }
        });
    }

    /**
     * The function that handles definitions of modules. Differs from
     * require() in that a string for the module should be the first argument,
     * and the function to execute after dependencies are loaded should
     * return a value to define the module corresponding to the first argument's
     * name.
     */
    define = function (name, deps, callback) {
        var node, context;

        //Allow for anonymous modules
        if (typeof name !== 'string') {
            //Adjust args appropriately
            callback = deps;
            deps = name;
            name = null;
        }

        //This module may not have dependencies
        if (!isArray(deps)) {
            callback = deps;
            deps = null;
        }

        //If no name, and callback is a function, then figure out if it a
        //CommonJS thing with dependencies.
        if (!deps && isFunction(callback)) {
            deps = [];
            //Remove comments from the callback string,
            //look for require calls, and pull them into the dependencies,
            //but only if there are function args.
            if (callback.length) {
                callback
                    .toString()
                    .replace(commentRegExp, '')
                    .replace(cjsRequireRegExp, function (match, dep) {
                        deps.push(dep);
                    });

                //May be a CommonJS thing even without require calls, but still
                //could use exports, and module. Avoid doing exports and module
                //work though if it just needs require.
                //REQUIRES the function to expect the CommonJS variables in the
                //order listed below.
                deps = (callback.length === 1 ? ['require'] : ['require', 'exports', 'module']).concat(deps);
            }
        }

        //If in IE 6-8 and hit an anonymous define() call, do the interactive
        //work.
        if (useInteractive) {
            node = currentlyAddingScript || getInteractiveScript();
            if (node) {
                if (!name) {
                    name = node.getAttribute('data-requiremodule');
                }
                context = contexts[node.getAttribute('data-requirecontext')];
            }
        }

        //Always save off evaluating the def call until the script onload handler.
        //This allows multiple modules to be in a file without prematurely
        //tracing dependencies, and allows for anonymous module support,
        //where the module name is not known until the script onload event
        //occurs. If no context, use the global queue, and get it processed
        //in the onscript load callback.
        (context ? context.defQueue : globalDefQueue).push([name, deps, callback]);
    };

    define.amd = {
        jQuery: true
    };


    /**
     * Executes the text. Normally just uses eval, but can be modified
     * to use a better, environment-specific call. Only used for transpiling
     * loader plugins, not for plain JS modules.
     * @param {String} text the text to execute/evaluate.
     */
    req.exec = function (text) {
        /*jslint evil: true */
        return eval(text);
    };

    //Set up with config info.
    req(cfg);
}(this));

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        //Allow using this built library as an AMD module
        //in another project. That other project will only
        //see this AMD call, not the internal modules in
        //the closure below.
        define('Rebound', factory);
    } else {
        //Browser globals case. Just assign the
        //result to a property on the global.
        root.Rebound = factory();
    }
}(this, function () {

    //almond, and your modules will be inlined here

/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("htmlbars-util",
  ["./htmlbars-util/safe-string","./htmlbars-util/handlebars/utils","./htmlbars-util/namespaces","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var SafeString = __dependency1__["default"];
    var escapeExpression = __dependency2__.escapeExpression;
    var getAttrNamespace = __dependency3__.getAttrNamespace;

    __exports__.SafeString = SafeString;
    __exports__.escapeExpression = escapeExpression;
    __exports__.getAttrNamespace = getAttrNamespace;
  });
define("htmlbars-util/array-utils",
  ["exports"],
  function(__exports__) {
    "use strict";
    function forEach(array, callback, binding) {
      var i, l;
      if (binding === undefined) {
        for (i = 0, l = array.length; i < l; i++) {
          callback(array[i], i, array);
        }
      } else {
        for (i = 0, l = array.length; i < l; i++) {
          callback.call(binding, array[i], i, array);
        }
      }
    }

    __exports__.forEach = forEach;function map(array, callback) {
      var output = [];
      var i, l;

      for (i = 0, l = array.length; i < l; i++) {
        output.push(callback(array[i], i, array));
      }

      return output;
    }

    __exports__.map = map;var getIdx;
    if (Array.prototype.indexOf) {
      getIdx = function(array, obj, from){
        return array.indexOf(obj, from);
      };
    } else {
      getIdx = function(array, obj, from) {
        if (from === undefined || from === null) {
          from = 0;
        } else if (from < 0) {
          from = Math.max(0, array.length + from);
        }
        for (var i = from, l= array.length; i < l; i++) {
          if (array[i] === obj) {
            return i;
          }
        }
        return -1;
      };
    }

    var indexOfArray = getIdx;
    __exports__.indexOfArray = indexOfArray;
  });
define("htmlbars-util/handlebars/safe-string",
  ["exports"],
  function(__exports__) {
    "use strict";
    // Build out our basic SafeString type
    function SafeString(string) {
      this.string = string;
    }

    SafeString.prototype.toString = SafeString.prototype.toHTML = function() {
      return "" + this.string;
    };

    __exports__["default"] = SafeString;
  });
define("htmlbars-util/handlebars/utils",
  ["./safe-string","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    /*jshint -W004 */
    var SafeString = __dependency1__["default"];

    var escape = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#x27;",
      "`": "&#x60;"
    };

    var badChars = /[&<>"'`]/g;
    var possible = /[&<>"'`]/;

    function escapeChar(chr) {
      return escape[chr];
    }

    function extend(obj /* , ...source */) {
      for (var i = 1; i < arguments.length; i++) {
        for (var key in arguments[i]) {
          if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
            obj[key] = arguments[i][key];
          }
        }
      }

      return obj;
    }

    __exports__.extend = extend;var toString = Object.prototype.toString;
    __exports__.toString = toString;
    // Sourced from lodash
    // https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
    var isFunction = function(value) {
      return typeof value === 'function';
    };
    // fallback for older versions of Chrome and Safari
    /* istanbul ignore next */
    if (isFunction(/x/)) {
      isFunction = function(value) {
        return typeof value === 'function' && toString.call(value) === '[object Function]';
      };
    }
    var isFunction;
    __exports__.isFunction = isFunction;
    /* istanbul ignore next */
    var isArray = Array.isArray || function(value) {
      return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
    };
    __exports__.isArray = isArray;

    function escapeExpression(string) {
      // don't escape SafeStrings, since they're already safe
      if (string && string.toHTML) {
        return string.toHTML();
      } else if (string == null) {
        return "";
      } else if (!string) {
        return string + '';
      }

      // Force a string conversion as this will be done by the append regardless and
      // the regex test will do this transparently behind the scenes, causing issues if
      // an object's to string has escaped characters in it.
      string = "" + string;

      if(!possible.test(string)) { return string; }
      return string.replace(badChars, escapeChar);
    }

    __exports__.escapeExpression = escapeExpression;function isEmpty(value) {
      if (!value && value !== 0) {
        return true;
      } else if (isArray(value) && value.length === 0) {
        return true;
      } else {
        return false;
      }
    }

    __exports__.isEmpty = isEmpty;function appendContextPath(contextPath, id) {
      return (contextPath ? contextPath + '.' : '') + id;
    }

    __exports__.appendContextPath = appendContextPath;
  });
define("htmlbars-util/namespaces",
  ["exports"],
  function(__exports__) {
    "use strict";
    // ref http://dev.w3.org/html5/spec-LC/namespaces.html
    var defaultNamespaces = {
      html: 'http://www.w3.org/1999/xhtml',
      mathml: 'http://www.w3.org/1998/Math/MathML',
      svg: 'http://www.w3.org/2000/svg',
      xlink: 'http://www.w3.org/1999/xlink',
      xml: 'http://www.w3.org/XML/1998/namespace'
    };

    function getAttrNamespace(attrName) {
      var namespace;

      var colonIndex = attrName.indexOf(':');
      if (colonIndex !== -1) {
        var prefix = attrName.slice(0, colonIndex);
        namespace = defaultNamespaces[prefix];
      }

      return namespace || null;
    }

    __exports__.getAttrNamespace = getAttrNamespace;
  });
define("htmlbars-util/object-utils",
  ["exports"],
  function(__exports__) {
    "use strict";
    function merge(options, defaults) {
      for (var prop in defaults) {
        if (options.hasOwnProperty(prop)) { continue; }
        options[prop] = defaults[prop];
      }
      return options;
    }

    __exports__.merge = merge;
  });
define("htmlbars-util/quoting",
  ["exports"],
  function(__exports__) {
    "use strict";
    function escapeString(str) {
      str = str.replace(/\\/g, "\\\\");
      str = str.replace(/"/g, '\\"');
      str = str.replace(/\n/g, "\\n");
      return str;
    }

    __exports__.escapeString = escapeString;

    function string(str) {
      return '"' + escapeString(str) + '"';
    }

    __exports__.string = string;

    function array(a) {
      return "[" + a + "]";
    }

    __exports__.array = array;

    function hash(pairs) {
      return "{" + pairs.join(", ") + "}";
    }

    __exports__.hash = hash;function repeat(chars, times) {
      var str = "";
      while (times--) {
        str += chars;
      }
      return str;
    }

    __exports__.repeat = repeat;
  });
define("htmlbars-util/safe-string",
  ["./handlebars/safe-string","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var SafeString = __dependency1__["default"];

    __exports__["default"] = SafeString;
  });
define("dom-helper",
  ["./morph-range","./morph-attr","./dom-helper/build-html-dom","./dom-helper/classes","./dom-helper/prop","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var Morph = __dependency1__["default"];
    var AttrMorph = __dependency2__["default"];
    var buildHTMLDOM = __dependency3__.buildHTMLDOM;
    var svgNamespace = __dependency3__.svgNamespace;
    var svgHTMLIntegrationPoints = __dependency3__.svgHTMLIntegrationPoints;
    var addClasses = __dependency4__.addClasses;
    var removeClasses = __dependency4__.removeClasses;
    var normalizeProperty = __dependency5__.normalizeProperty;
    var isAttrRemovalValue = __dependency5__.isAttrRemovalValue;

    var doc = typeof document === 'undefined' ? false : document;

    var deletesBlankTextNodes = doc && (function(document){
      var element = document.createElement('div');
      element.appendChild( document.createTextNode('') );
      var clonedElement = element.cloneNode(true);
      return clonedElement.childNodes.length === 0;
    })(doc);

    var ignoresCheckedAttribute = doc && (function(document){
      var element = document.createElement('input');
      element.setAttribute('checked', 'checked');
      var clonedElement = element.cloneNode(false);
      return !clonedElement.checked;
    })(doc);

    var canRemoveSvgViewBoxAttribute = doc && (doc.createElementNS ? (function(document){
      var element = document.createElementNS(svgNamespace, 'svg');
      element.setAttribute('viewBox', '0 0 100 100');
      element.removeAttribute('viewBox');
      return !element.getAttribute('viewBox');
    })(doc) : true);

    var canClone = doc && (function(document){
      var element = document.createElement('div');
      element.appendChild( document.createTextNode(' '));
      element.appendChild( document.createTextNode(' '));
      var clonedElement = element.cloneNode(true);
      return clonedElement.childNodes[0].nodeValue === ' ';
    })(doc);

    // This is not the namespace of the element, but of
    // the elements inside that elements.
    function interiorNamespace(element){
      if (
        element &&
        element.namespaceURI === svgNamespace &&
        !svgHTMLIntegrationPoints[element.tagName]
      ) {
        return svgNamespace;
      } else {
        return null;
      }
    }

    // The HTML spec allows for "omitted start tags". These tags are optional
    // when their intended child is the first thing in the parent tag. For
    // example, this is a tbody start tag:
    //
    // <table>
    //   <tbody>
    //     <tr>
    //
    // The tbody may be omitted, and the browser will accept and render:
    //
    // <table>
    //   <tr>
    //
    // However, the omitted start tag will still be added to the DOM. Here
    // we test the string and context to see if the browser is about to
    // perform this cleanup.
    //
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/syntax.html#optional-tags
    // describes which tags are omittable. The spec for tbody and colgroup
    // explains this behavior:
    //
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/tables.html#the-tbody-element
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/tables.html#the-colgroup-element
    //

    var omittedStartTagChildTest = /<([\w:]+)/;
    function detectOmittedStartTag(string, contextualElement){
      // Omitted start tags are only inside table tags.
      if (contextualElement.tagName === 'TABLE') {
        var omittedStartTagChildMatch = omittedStartTagChildTest.exec(string);
        if (omittedStartTagChildMatch) {
          var omittedStartTagChild = omittedStartTagChildMatch[1];
          // It is already asserted that the contextual element is a table
          // and not the proper start tag. Just see if a tag was omitted.
          return omittedStartTagChild === 'tr' ||
                 omittedStartTagChild === 'col';
        }
      }
    }

    function buildSVGDOM(html, dom){
      var div = dom.document.createElement('div');
      div.innerHTML = '<svg>'+html+'</svg>';
      return div.firstChild.childNodes;
    }

    /*
     * A class wrapping DOM functions to address environment compatibility,
     * namespaces, contextual elements for morph un-escaped content
     * insertion.
     *
     * When entering a template, a DOMHelper should be passed:
     *
     *   template(context, { hooks: hooks, dom: new DOMHelper() });
     *
     * TODO: support foreignObject as a passed contextual element. It has
     * a namespace (svg) that does not match its internal namespace
     * (xhtml).
     *
     * @class DOMHelper
     * @constructor
     * @param {HTMLDocument} _document The document DOM methods are proxied to
     */
    function DOMHelper(_document){
      this.document = _document || document;
      if (!this.document) {
        throw new Error("A document object must be passed to the DOMHelper, or available on the global scope");
      }
      this.canClone = canClone;
      this.namespace = null;
    }

    var prototype = DOMHelper.prototype;
    prototype.constructor = DOMHelper;

    prototype.getElementById = function(id, rootNode) {
      rootNode = rootNode || this.document;
      return rootNode.getElementById(id);
    };

    prototype.insertBefore = function(element, childElement, referenceChild) {
      return element.insertBefore(childElement, referenceChild);
    };

    prototype.appendChild = function(element, childElement) {
      return element.appendChild(childElement);
    };

    prototype.childAt = function(element, indices) {
      var child = element;

      for (var i = 0; i < indices.length; i++) {
        child = child.childNodes.item(indices[i]);
      }

      return child;
    };

    // Note to a Fellow Implementor:
    // Ahh, accessing a child node at an index. Seems like it should be so simple,
    // doesn't it? Unfortunately, this particular method has caused us a surprising
    // amount of pain. As you'll note below, this method has been modified to walk
    // the linked list of child nodes rather than access the child by index
    // directly, even though there are two (2) APIs in the DOM that do this for us.
    // If you're thinking to yourself, "What an oversight! What an opportunity to
    // optimize this code!" then to you I say: stop! For I have a tale to tell.
    //
    // First, this code must be compatible with simple-dom for rendering on the
    // server where there is no real DOM. Previously, we accessed a child node
    // directly via `element.childNodes[index]`. While we *could* in theory do a
    // full-fidelity simulation of a live `childNodes` array, this is slow,
    // complicated and error-prone.
    //
    // "No problem," we thought, "we'll just use the similar
    // `childNodes.item(index)` API." Then, we could just implement our own `item`
    // method in simple-dom and walk the child node linked list there, allowing
    // us to retain the performance advantages of the (surely optimized) `item()`
    // API in the browser.
    //
    // Unfortunately, an enterprising soul named Samy Alzahrani discovered that in
    // IE8, accessing an item out-of-bounds via `item()` causes an exception where
    // other browsers return null. This necessitated a... check of
    // `childNodes.length`, bringing us back around to having to support a
    // full-fidelity `childNodes` array!
    //
    // Worst of all, Kris Selden investigated how browsers are actualy implemented
    // and discovered that they're all linked lists under the hood anyway. Accessing
    // `childNodes` requires them to allocate a new live collection backed by that
    // linked list, which is itself a rather expensive operation. Our assumed
    // optimization had backfired! That is the danger of magical thinking about
    // the performance of native implementations.
    //
    // And this, my friends, is why the following implementation just walks the
    // linked list, as surprised as that may make you. Please ensure you understand
    // the above before changing this and submitting a PR.
    //
    // Tom Dale, January 18th, 2015, Portland OR
    prototype.childAtIndex = function(element, index) {
      var node = element.firstChild;

      for (var idx = 0; node && idx < index; idx++) {
        node = node.nextSibling;
      }

      return node;
    };

    prototype.appendText = function(element, text) {
      return element.appendChild(this.document.createTextNode(text));
    };

    prototype.setAttribute = function(element, name, value) {
      element.setAttribute(name, String(value));
    };

    prototype.setAttributeNS = function(element, namespace, name, value) {
      element.setAttributeNS(namespace, name, String(value));
    };

    if (canRemoveSvgViewBoxAttribute){
      prototype.removeAttribute = function(element, name) {
        element.removeAttribute(name);
      };
    } else {
      prototype.removeAttribute = function(element, name) {
        if (element.tagName === 'svg' && name === 'viewBox') {
          element.setAttribute(name, null);
        } else {
          element.removeAttribute(name);
        }
      };
    }

    prototype.setPropertyStrict = function(element, name, value) {
      element[name] = value;
    };

    prototype.setProperty = function(element, name, value, namespace) {
      var lowercaseName = name.toLowerCase();
      if (element.namespaceURI === svgNamespace || lowercaseName === 'style') {
        if (isAttrRemovalValue(value)) {
          element.removeAttribute(name);
        } else {
          if (namespace) {
            element.setAttributeNS(namespace, name, value);
          } else {
            element.setAttribute(name, value);
          }
        }
      } else {
        var normalized = normalizeProperty(element, name);
        if (normalized) {
          element[normalized] = value;
        } else {
          if (isAttrRemovalValue(value)) {
            element.removeAttribute(name);
          } else {
            if (namespace && element.setAttributeNS) {
              element.setAttributeNS(namespace, name, value);
            } else {
              element.setAttribute(name, value);
            }
          }
        }
      }
    };

    if (doc && doc.createElementNS) {
      // Only opt into namespace detection if a contextualElement
      // is passed.
      prototype.createElement = function(tagName, contextualElement) {
        var namespace = this.namespace;
        if (contextualElement) {
          if (tagName === 'svg') {
            namespace = svgNamespace;
          } else {
            namespace = interiorNamespace(contextualElement);
          }
        }
        if (namespace) {
          return this.document.createElementNS(namespace, tagName);
        } else {
          return this.document.createElement(tagName);
        }
      };
      prototype.setAttributeNS = function(element, namespace, name, value) {
        element.setAttributeNS(namespace, name, String(value));
      };
    } else {
      prototype.createElement = function(tagName) {
        return this.document.createElement(tagName);
      };
      prototype.setAttributeNS = function(element, namespace, name, value) {
        element.setAttribute(name, String(value));
      };
    }

    prototype.addClasses = addClasses;
    prototype.removeClasses = removeClasses;

    prototype.setNamespace = function(ns) {
      this.namespace = ns;
    };

    prototype.detectNamespace = function(element) {
      this.namespace = interiorNamespace(element);
    };

    prototype.createDocumentFragment = function(){
      return this.document.createDocumentFragment();
    };

    prototype.createTextNode = function(text){
      return this.document.createTextNode(text);
    };

    prototype.createComment = function(text){
      return this.document.createComment(text);
    };

    prototype.repairClonedNode = function(element, blankChildTextNodes, isChecked){
      if (deletesBlankTextNodes && blankChildTextNodes.length > 0) {
        for (var i=0, len=blankChildTextNodes.length;i<len;i++){
          var textNode = this.document.createTextNode(''),
              offset = blankChildTextNodes[i],
              before = this.childAtIndex(element, offset);
          if (before) {
            element.insertBefore(textNode, before);
          } else {
            element.appendChild(textNode);
          }
        }
      }
      if (ignoresCheckedAttribute && isChecked) {
        element.setAttribute('checked', 'checked');
      }
    };

    prototype.cloneNode = function(element, deep){
      var clone = element.cloneNode(!!deep);
      return clone;
    };

    prototype.createAttrMorph = function(element, attrName, namespace){
      return new AttrMorph(element, attrName, this, namespace);
    };

    prototype.createUnsafeAttrMorph = function(element, attrName, namespace){
      var morph = this.createAttrMorph(element, attrName, namespace);
      morph.escaped = false;
      return morph;
    };

    prototype.createMorph = function(parent, start, end, contextualElement){
      if (contextualElement && contextualElement.nodeType === 11) {
        throw new Error("Cannot pass a fragment as the contextual element to createMorph");
      }

      if (!contextualElement && parent.nodeType === 1) {
        contextualElement = parent;
      }
      var morph = new Morph(this, contextualElement);
      morph.firstNode = start;
      morph.lastNode = end;
      morph.state = {};
      morph.isDirty = true;
      return morph;
    };

    prototype.createUnsafeMorph = function(parent, start, end, contextualElement){
      var morph = this.createMorph(parent, start, end, contextualElement);
      morph.parseTextAsHTML = true;
      return morph;
    };

    // This helper is just to keep the templates good looking,
    // passing integers instead of element references.
    prototype.createMorphAt = function(parent, startIndex, endIndex, contextualElement){
      var single = startIndex === endIndex;
      var start = this.childAtIndex(parent, startIndex);
      var end = single ? start : this.childAtIndex(parent, endIndex);
      return this.createMorph(parent, start, end, contextualElement);
    };

    prototype.createUnsafeMorphAt = function(parent, startIndex, endIndex, contextualElement) {
      var morph = this.createMorphAt(parent, startIndex, endIndex, contextualElement);
      morph.parseTextAsHTML = true;
      return morph;
    };

    prototype.insertMorphBefore = function(element, referenceChild, contextualElement) {
      var insertion = this.document.createComment('');
      element.insertBefore(insertion, referenceChild);
      return this.createMorph(element, insertion, insertion, contextualElement);
    };

    prototype.appendMorph = function(element, contextualElement) {
      var insertion = this.document.createComment('');
      element.appendChild(insertion);
      return this.createMorph(element, insertion, insertion, contextualElement);
    };

    prototype.insertBoundary = function(fragment, index) {
      // this will always be null or firstChild
      var child = index === null ? null : this.childAtIndex(fragment, index);
      this.insertBefore(fragment, this.createTextNode(''), child);
    };

    prototype.parseHTML = function(html, contextualElement) {
      var childNodes;

      if (interiorNamespace(contextualElement) === svgNamespace) {
        childNodes = buildSVGDOM(html, this);
      } else {
        var nodes = buildHTMLDOM(html, contextualElement, this);
        if (detectOmittedStartTag(html, contextualElement)) {
          var node = nodes[0];
          while (node && node.nodeType !== 1) {
            node = node.nextSibling;
          }
          childNodes = node.childNodes;
        } else {
          childNodes = nodes;
        }
      }

      // Copy node list to a fragment.
      var fragment = this.document.createDocumentFragment();

      if (childNodes && childNodes.length > 0) {
        var currentNode = childNodes[0];

        // We prepend an <option> to <select> boxes to absorb any browser bugs
        // related to auto-select behavior. Skip past it.
        if (contextualElement.tagName === 'SELECT') {
          currentNode = currentNode.nextSibling;
        }

        while (currentNode) {
          var tempNode = currentNode;
          currentNode = currentNode.nextSibling;

          fragment.appendChild(tempNode);
        }
      }

      return fragment;
    };

    var parsingNode;

    // Used to determine whether a URL needs to be sanitized.
    prototype.protocolForURL = function(url) {
      if (!parsingNode) {
        parsingNode = this.document.createElement('a');
      }

      parsingNode.href = url;
      return parsingNode.protocol;
    };

    __exports__["default"] = DOMHelper;
  });
define("dom-helper/build-html-dom",
  ["exports"],
  function(__exports__) {
    "use strict";
    /* global XMLSerializer:false */
    var svgHTMLIntegrationPoints = {foreignObject: 1, desc: 1, title: 1};
    __exports__.svgHTMLIntegrationPoints = svgHTMLIntegrationPoints;var svgNamespace = 'http://www.w3.org/2000/svg';
    __exports__.svgNamespace = svgNamespace;
    var doc = typeof document === 'undefined' ? false : document;

    // Safari does not like using innerHTML on SVG HTML integration
    // points (desc/title/foreignObject).
    var needsIntegrationPointFix = doc && (function(document) {
      if (document.createElementNS === undefined) {
        return;
      }
      // In FF title will not accept innerHTML.
      var testEl = document.createElementNS(svgNamespace, 'title');
      testEl.innerHTML = "<div></div>";
      return testEl.childNodes.length === 0 || testEl.childNodes[0].nodeType !== 1;
    })(doc);

    // Internet Explorer prior to 9 does not allow setting innerHTML if the first element
    // is a "zero-scope" element. This problem can be worked around by making
    // the first node an invisible text node. We, like Modernizr, use &shy;
    var needsShy = doc && (function(document) {
      var testEl = document.createElement('div');
      testEl.innerHTML = "<div></div>";
      testEl.firstChild.innerHTML = "<script><\/script>";
      return testEl.firstChild.innerHTML === '';
    })(doc);

    // IE 8 (and likely earlier) likes to move whitespace preceeding
    // a script tag to appear after it. This means that we can
    // accidentally remove whitespace when updating a morph.
    var movesWhitespace = doc && (function(document) {
      var testEl = document.createElement('div');
      testEl.innerHTML = "Test: <script type='text/x-placeholder'><\/script>Value";
      return testEl.childNodes[0].nodeValue === 'Test:' &&
              testEl.childNodes[2].nodeValue === ' Value';
    })(doc);

    var tagNamesRequiringInnerHTMLFix = doc && (function(document) {
      var tagNamesRequiringInnerHTMLFix;
      // IE 9 and earlier don't allow us to set innerHTML on col, colgroup, frameset,
      // html, style, table, tbody, tfoot, thead, title, tr. Detect this and add
      // them to an initial list of corrected tags.
      //
      // Here we are only dealing with the ones which can have child nodes.
      //
      var tableNeedsInnerHTMLFix;
      var tableInnerHTMLTestElement = document.createElement('table');
      try {
        tableInnerHTMLTestElement.innerHTML = '<tbody></tbody>';
      } catch (e) {
      } finally {
        tableNeedsInnerHTMLFix = (tableInnerHTMLTestElement.childNodes.length === 0);
      }
      if (tableNeedsInnerHTMLFix) {
        tagNamesRequiringInnerHTMLFix = {
          colgroup: ['table'],
          table: [],
          tbody: ['table'],
          tfoot: ['table'],
          thead: ['table'],
          tr: ['table', 'tbody']
        };
      }

      // IE 8 doesn't allow setting innerHTML on a select tag. Detect this and
      // add it to the list of corrected tags.
      //
      var selectInnerHTMLTestElement = document.createElement('select');
      selectInnerHTMLTestElement.innerHTML = '<option></option>';
      if (!selectInnerHTMLTestElement.childNodes[0]) {
        tagNamesRequiringInnerHTMLFix = tagNamesRequiringInnerHTMLFix || {};
        tagNamesRequiringInnerHTMLFix.select = [];
      }
      return tagNamesRequiringInnerHTMLFix;
    })(doc);

    function scriptSafeInnerHTML(element, html) {
      // without a leading text node, IE will drop a leading script tag.
      html = '&shy;'+html;

      element.innerHTML = html;

      var nodes = element.childNodes;

      // Look for &shy; to remove it.
      var shyElement = nodes[0];
      while (shyElement.nodeType === 1 && !shyElement.nodeName) {
        shyElement = shyElement.firstChild;
      }
      // At this point it's the actual unicode character.
      if (shyElement.nodeType === 3 && shyElement.nodeValue.charAt(0) === "\u00AD") {
        var newValue = shyElement.nodeValue.slice(1);
        if (newValue.length) {
          shyElement.nodeValue = shyElement.nodeValue.slice(1);
        } else {
          shyElement.parentNode.removeChild(shyElement);
        }
      }

      return nodes;
    }

    function buildDOMWithFix(html, contextualElement){
      var tagName = contextualElement.tagName;

      // Firefox versions < 11 do not have support for element.outerHTML.
      var outerHTML = contextualElement.outerHTML || new XMLSerializer().serializeToString(contextualElement);
      if (!outerHTML) {
        throw "Can't set innerHTML on "+tagName+" in this browser";
      }

      html = fixSelect(html, contextualElement);

      var wrappingTags = tagNamesRequiringInnerHTMLFix[tagName.toLowerCase()];

      var startTag = outerHTML.match(new RegExp("<"+tagName+"([^>]*)>", 'i'))[0];
      var endTag = '</'+tagName+'>';

      var wrappedHTML = [startTag, html, endTag];

      var i = wrappingTags.length;
      var wrappedDepth = 1 + i;
      while(i--) {
        wrappedHTML.unshift('<'+wrappingTags[i]+'>');
        wrappedHTML.push('</'+wrappingTags[i]+'>');
      }

      var wrapper = document.createElement('div');
      scriptSafeInnerHTML(wrapper, wrappedHTML.join(''));
      var element = wrapper;
      while (wrappedDepth--) {
        element = element.firstChild;
        while (element && element.nodeType !== 1) {
          element = element.nextSibling;
        }
      }
      while (element && element.tagName !== tagName) {
        element = element.nextSibling;
      }
      return element ? element.childNodes : [];
    }

    var buildDOM;
    if (needsShy) {
      buildDOM = function buildDOM(html, contextualElement, dom){
        html = fixSelect(html, contextualElement);

        contextualElement = dom.cloneNode(contextualElement, false);
        scriptSafeInnerHTML(contextualElement, html);
        return contextualElement.childNodes;
      };
    } else {
      buildDOM = function buildDOM(html, contextualElement, dom){
        html = fixSelect(html, contextualElement);

        contextualElement = dom.cloneNode(contextualElement, false);
        contextualElement.innerHTML = html;
        return contextualElement.childNodes;
      };
    }

    function fixSelect(html, contextualElement) {
      if (contextualElement.tagName === 'SELECT') {
        html = "<option></option>" + html;
      }

      return html;
    }

    var buildIESafeDOM;
    if (tagNamesRequiringInnerHTMLFix || movesWhitespace) {
      buildIESafeDOM = function buildIESafeDOM(html, contextualElement, dom) {
        // Make a list of the leading text on script nodes. Include
        // script tags without any whitespace for easier processing later.
        var spacesBefore = [];
        var spacesAfter = [];
        if (typeof html === 'string') {
          html = html.replace(/(\s*)(<script)/g, function(match, spaces, tag) {
            spacesBefore.push(spaces);
            return tag;
          });

          html = html.replace(/(<\/script>)(\s*)/g, function(match, tag, spaces) {
            spacesAfter.push(spaces);
            return tag;
          });
        }

        // Fetch nodes
        var nodes;
        if (tagNamesRequiringInnerHTMLFix[contextualElement.tagName.toLowerCase()]) {
          // buildDOMWithFix uses string wrappers for problematic innerHTML.
          nodes = buildDOMWithFix(html, contextualElement);
        } else {
          nodes = buildDOM(html, contextualElement, dom);
        }

        // Build a list of script tags, the nodes themselves will be
        // mutated as we add test nodes.
        var i, j, node, nodeScriptNodes;
        var scriptNodes = [];
        for (i=0;i<nodes.length;i++) {
          node=nodes[i];
          if (node.nodeType !== 1) {
            continue;
          }
          if (node.tagName === 'SCRIPT') {
            scriptNodes.push(node);
          } else {
            nodeScriptNodes = node.getElementsByTagName('script');
            for (j=0;j<nodeScriptNodes.length;j++) {
              scriptNodes.push(nodeScriptNodes[j]);
            }
          }
        }

        // Walk the script tags and put back their leading text nodes.
        var scriptNode, textNode, spaceBefore, spaceAfter;
        for (i=0;i<scriptNodes.length;i++) {
          scriptNode = scriptNodes[i];
          spaceBefore = spacesBefore[i];
          if (spaceBefore && spaceBefore.length > 0) {
            textNode = dom.document.createTextNode(spaceBefore);
            scriptNode.parentNode.insertBefore(textNode, scriptNode);
          }

          spaceAfter = spacesAfter[i];
          if (spaceAfter && spaceAfter.length > 0) {
            textNode = dom.document.createTextNode(spaceAfter);
            scriptNode.parentNode.insertBefore(textNode, scriptNode.nextSibling);
          }
        }

        return nodes;
      };
    } else {
      buildIESafeDOM = buildDOM;
    }

    var buildHTMLDOM;
    if (needsIntegrationPointFix) {
      buildHTMLDOM = function buildHTMLDOM(html, contextualElement, dom){
        if (svgHTMLIntegrationPoints[contextualElement.tagName]) {
          return buildIESafeDOM(html, document.createElement('div'), dom);
        } else {
          return buildIESafeDOM(html, contextualElement, dom);
        }
      };
    } else {
      buildHTMLDOM = buildIESafeDOM;
    }

    __exports__.buildHTMLDOM = buildHTMLDOM;
  });
define("dom-helper/classes",
  ["exports"],
  function(__exports__) {
    "use strict";
    var doc = typeof document === 'undefined' ? false : document;

    // PhantomJS has a broken classList. See https://github.com/ariya/phantomjs/issues/12782
    var canClassList = doc && (function(){
      var d = document.createElement('div');
      if (!d.classList) {
        return false;
      }
      d.classList.add('boo');
      d.classList.add('boo', 'baz');
      return (d.className === 'boo baz');
    })();

    function buildClassList(element) {
      var classString = (element.getAttribute('class') || '');
      return classString !== '' && classString !== ' ' ? classString.split(' ') : [];
    }

    function intersect(containingArray, valuesArray) {
      var containingIndex = 0;
      var containingLength = containingArray.length;
      var valuesIndex = 0;
      var valuesLength = valuesArray.length;

      var intersection = new Array(valuesLength);

      // TODO: rewrite this loop in an optimal manner
      for (;containingIndex<containingLength;containingIndex++) {
        valuesIndex = 0;
        for (;valuesIndex<valuesLength;valuesIndex++) {
          if (valuesArray[valuesIndex] === containingArray[containingIndex]) {
            intersection[valuesIndex] = containingIndex;
            break;
          }
        }
      }

      return intersection;
    }

    function addClassesViaAttribute(element, classNames) {
      var existingClasses = buildClassList(element);

      var indexes = intersect(existingClasses, classNames);
      var didChange = false;

      for (var i=0, l=classNames.length; i<l; i++) {
        if (indexes[i] === undefined) {
          didChange = true;
          existingClasses.push(classNames[i]);
        }
      }

      if (didChange) {
        element.setAttribute('class', existingClasses.length > 0 ? existingClasses.join(' ') : '');
      }
    }

    function removeClassesViaAttribute(element, classNames) {
      var existingClasses = buildClassList(element);

      var indexes = intersect(classNames, existingClasses);
      var didChange = false;
      var newClasses = [];

      for (var i=0, l=existingClasses.length; i<l; i++) {
        if (indexes[i] === undefined) {
          newClasses.push(existingClasses[i]);
        } else {
          didChange = true;
        }
      }

      if (didChange) {
        element.setAttribute('class', newClasses.length > 0 ? newClasses.join(' ') : '');
      }
    }

    var addClasses, removeClasses;
    if (canClassList) {
      addClasses = function addClasses(element, classNames) {
        if (element.classList) {
          if (classNames.length === 1) {
            element.classList.add(classNames[0]);
          } else if (classNames.length === 2) {
            element.classList.add(classNames[0], classNames[1]);
          } else {
            element.classList.add.apply(element.classList, classNames);
          }
        } else {
          addClassesViaAttribute(element, classNames);
        }
      };
      removeClasses = function removeClasses(element, classNames) {
        if (element.classList) {
          if (classNames.length === 1) {
            element.classList.remove(classNames[0]);
          } else if (classNames.length === 2) {
            element.classList.remove(classNames[0], classNames[1]);
          } else {
            element.classList.remove.apply(element.classList, classNames);
          }
        } else {
          removeClassesViaAttribute(element, classNames);
        }
      };
    } else {
      addClasses = addClassesViaAttribute;
      removeClasses = removeClassesViaAttribute;
    }

    __exports__.addClasses = addClasses;
    __exports__.removeClasses = removeClasses;
  });
define("dom-helper/prop",
  ["exports"],
  function(__exports__) {
    "use strict";
    function isAttrRemovalValue(value) {
      return value === null || value === undefined;
    }

    __exports__.isAttrRemovalValue = isAttrRemovalValue;// TODO should this be an o_create kind of thing?
    var propertyCaches = {};
    __exports__.propertyCaches = propertyCaches;
    function normalizeProperty(element, attrName) {
      var tagName = element.tagName;
      var key;
      var cache = propertyCaches[tagName];
      if (!cache) {
        // TODO should this be an o_create kind of thing?
        cache = {};
        for (key in element) {
          cache[key.toLowerCase()] = key;
        }
        propertyCaches[tagName] = cache;
      }

      // presumes that the attrName has been lowercased.
      return cache[attrName];
    }

    __exports__.normalizeProperty = normalizeProperty;
  });
define("morph-attr",
  ["./morph-attr/sanitize-attribute-value","./dom-helper/prop","./dom-helper/build-html-dom","./htmlbars-util","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var sanitizeAttributeValue = __dependency1__.sanitizeAttributeValue;
    var isAttrRemovalValue = __dependency2__.isAttrRemovalValue;
    var normalizeProperty = __dependency2__.normalizeProperty;
    var svgNamespace = __dependency3__.svgNamespace;
    var getAttrNamespace = __dependency4__.getAttrNamespace;

    function updateProperty(value) {
      this.domHelper.setPropertyStrict(this.element, this.attrName, value);
    }

    function updateAttribute(value) {
      if (isAttrRemovalValue(value)) {
        this.domHelper.removeAttribute(this.element, this.attrName);
      } else {
        this.domHelper.setAttribute(this.element, this.attrName, value);
      }
    }

    function updateAttributeNS(value) {
      if (isAttrRemovalValue(value)) {
        this.domHelper.removeAttribute(this.element, this.attrName);
      } else {
        this.domHelper.setAttributeNS(this.element, this.namespace, this.attrName, value);
      }
    }

    function AttrMorph(element, attrName, domHelper, namespace) {
      this.element = element;
      this.domHelper = domHelper;
      this.namespace = namespace !== undefined ? namespace : getAttrNamespace(attrName);
      this.escaped = true;

      var normalizedAttrName = normalizeProperty(this.element, attrName);
      if (this.namespace) {
        this._update = updateAttributeNS;
        this.attrName = attrName;
      } else {
        if (element.namespaceURI === svgNamespace || attrName === 'style' || !normalizedAttrName) {
          this.attrName = attrName;
          this._update = updateAttribute;
        } else {
          this.attrName = normalizedAttrName;
          this._update = updateProperty;
        }
      }
    }

    AttrMorph.prototype.setContent = function (value) {
      if (this.escaped) {
        var sanitized = sanitizeAttributeValue(this.domHelper, this.element, this.attrName, value);
        this._update(sanitized, this.namespace);
      } else {
        this._update(value, this.namespace);
      }
    };

    __exports__["default"] = AttrMorph;

    __exports__.sanitizeAttributeValue = sanitizeAttributeValue;
  });
define("morph-attr/sanitize-attribute-value",
  ["exports"],
  function(__exports__) {
    "use strict";
    /* jshint scripturl:true */

    var badProtocols = {
      'javascript:': true,
      'vbscript:': true
    };

    var badTags = {
      'A': true,
      'BODY': true,
      'LINK': true,
      'IMG': true,
      'IFRAME': true
    };

    var badAttributes = {
      'href': true,
      'src': true,
      'background': true
    };
    __exports__.badAttributes = badAttributes;
    function sanitizeAttributeValue(dom, element, attribute, value) {
      var tagName;

      if (!element) {
        tagName = null;
      } else {
        tagName = element.tagName;
      }

      if (value && value.toHTML) {
        return value.toHTML();
      }

      if ((tagName === null || badTags[tagName]) && badAttributes[attribute]) {
        var protocol = dom.protocolForURL(value);
        if (badProtocols[protocol] === true) {
          return 'unsafe:' + value;
        }
      }

      return value;
    }

    __exports__.sanitizeAttributeValue = sanitizeAttributeValue;
  });
define("dom-helper",
  ["./morph-range","./morph-attr","./dom-helper/build-html-dom","./dom-helper/classes","./dom-helper/prop","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __dependency5__, __exports__) {
    "use strict";
    var Morph = __dependency1__["default"];
    var AttrMorph = __dependency2__["default"];
    var buildHTMLDOM = __dependency3__.buildHTMLDOM;
    var svgNamespace = __dependency3__.svgNamespace;
    var svgHTMLIntegrationPoints = __dependency3__.svgHTMLIntegrationPoints;
    var addClasses = __dependency4__.addClasses;
    var removeClasses = __dependency4__.removeClasses;
    var normalizeProperty = __dependency5__.normalizeProperty;
    var isAttrRemovalValue = __dependency5__.isAttrRemovalValue;

    var doc = typeof document === 'undefined' ? false : document;

    var deletesBlankTextNodes = doc && (function(document){
      var element = document.createElement('div');
      element.appendChild( document.createTextNode('') );
      var clonedElement = element.cloneNode(true);
      return clonedElement.childNodes.length === 0;
    })(doc);

    var ignoresCheckedAttribute = doc && (function(document){
      var element = document.createElement('input');
      element.setAttribute('checked', 'checked');
      var clonedElement = element.cloneNode(false);
      return !clonedElement.checked;
    })(doc);

    var canRemoveSvgViewBoxAttribute = doc && (doc.createElementNS ? (function(document){
      var element = document.createElementNS(svgNamespace, 'svg');
      element.setAttribute('viewBox', '0 0 100 100');
      element.removeAttribute('viewBox');
      return !element.getAttribute('viewBox');
    })(doc) : true);

    var canClone = doc && (function(document){
      var element = document.createElement('div');
      element.appendChild( document.createTextNode(' '));
      element.appendChild( document.createTextNode(' '));
      var clonedElement = element.cloneNode(true);
      return clonedElement.childNodes[0].nodeValue === ' ';
    })(doc);

    // This is not the namespace of the element, but of
    // the elements inside that elements.
    function interiorNamespace(element){
      if (
        element &&
        element.namespaceURI === svgNamespace &&
        !svgHTMLIntegrationPoints[element.tagName]
      ) {
        return svgNamespace;
      } else {
        return null;
      }
    }

    // The HTML spec allows for "omitted start tags". These tags are optional
    // when their intended child is the first thing in the parent tag. For
    // example, this is a tbody start tag:
    //
    // <table>
    //   <tbody>
    //     <tr>
    //
    // The tbody may be omitted, and the browser will accept and render:
    //
    // <table>
    //   <tr>
    //
    // However, the omitted start tag will still be added to the DOM. Here
    // we test the string and context to see if the browser is about to
    // perform this cleanup.
    //
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/syntax.html#optional-tags
    // describes which tags are omittable. The spec for tbody and colgroup
    // explains this behavior:
    //
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/tables.html#the-tbody-element
    // http://www.whatwg.org/specs/web-apps/current-work/multipage/tables.html#the-colgroup-element
    //

    var omittedStartTagChildTest = /<([\w:]+)/;
    function detectOmittedStartTag(string, contextualElement){
      // Omitted start tags are only inside table tags.
      if (contextualElement.tagName === 'TABLE') {
        var omittedStartTagChildMatch = omittedStartTagChildTest.exec(string);
        if (omittedStartTagChildMatch) {
          var omittedStartTagChild = omittedStartTagChildMatch[1];
          // It is already asserted that the contextual element is a table
          // and not the proper start tag. Just see if a tag was omitted.
          return omittedStartTagChild === 'tr' ||
                 omittedStartTagChild === 'col';
        }
      }
    }

    function buildSVGDOM(html, dom){
      var div = dom.document.createElement('div');
      div.innerHTML = '<svg>'+html+'</svg>';
      return div.firstChild.childNodes;
    }

    /*
     * A class wrapping DOM functions to address environment compatibility,
     * namespaces, contextual elements for morph un-escaped content
     * insertion.
     *
     * When entering a template, a DOMHelper should be passed:
     *
     *   template(context, { hooks: hooks, dom: new DOMHelper() });
     *
     * TODO: support foreignObject as a passed contextual element. It has
     * a namespace (svg) that does not match its internal namespace
     * (xhtml).
     *
     * @class DOMHelper
     * @constructor
     * @param {HTMLDocument} _document The document DOM methods are proxied to
     */
    function DOMHelper(_document){
      this.document = _document || document;
      if (!this.document) {
        throw new Error("A document object must be passed to the DOMHelper, or available on the global scope");
      }
      this.canClone = canClone;
      this.namespace = null;
    }

    var prototype = DOMHelper.prototype;
    prototype.constructor = DOMHelper;

    prototype.getElementById = function(id, rootNode) {
      rootNode = rootNode || this.document;
      return rootNode.getElementById(id);
    };

    prototype.insertBefore = function(element, childElement, referenceChild) {
      return element.insertBefore(childElement, referenceChild);
    };

    prototype.appendChild = function(element, childElement) {
      return element.appendChild(childElement);
    };

    prototype.childAt = function(element, indices) {
      var child = element;

      for (var i = 0; i < indices.length; i++) {
        child = child.childNodes.item(indices[i]);
      }

      return child;
    };

    // Note to a Fellow Implementor:
    // Ahh, accessing a child node at an index. Seems like it should be so simple,
    // doesn't it? Unfortunately, this particular method has caused us a surprising
    // amount of pain. As you'll note below, this method has been modified to walk
    // the linked list of child nodes rather than access the child by index
    // directly, even though there are two (2) APIs in the DOM that do this for us.
    // If you're thinking to yourself, "What an oversight! What an opportunity to
    // optimize this code!" then to you I say: stop! For I have a tale to tell.
    //
    // First, this code must be compatible with simple-dom for rendering on the
    // server where there is no real DOM. Previously, we accessed a child node
    // directly via `element.childNodes[index]`. While we *could* in theory do a
    // full-fidelity simulation of a live `childNodes` array, this is slow,
    // complicated and error-prone.
    //
    // "No problem," we thought, "we'll just use the similar
    // `childNodes.item(index)` API." Then, we could just implement our own `item`
    // method in simple-dom and walk the child node linked list there, allowing
    // us to retain the performance advantages of the (surely optimized) `item()`
    // API in the browser.
    //
    // Unfortunately, an enterprising soul named Samy Alzahrani discovered that in
    // IE8, accessing an item out-of-bounds via `item()` causes an exception where
    // other browsers return null. This necessitated a... check of
    // `childNodes.length`, bringing us back around to having to support a
    // full-fidelity `childNodes` array!
    //
    // Worst of all, Kris Selden investigated how browsers are actualy implemented
    // and discovered that they're all linked lists under the hood anyway. Accessing
    // `childNodes` requires them to allocate a new live collection backed by that
    // linked list, which is itself a rather expensive operation. Our assumed
    // optimization had backfired! That is the danger of magical thinking about
    // the performance of native implementations.
    //
    // And this, my friends, is why the following implementation just walks the
    // linked list, as surprised as that may make you. Please ensure you understand
    // the above before changing this and submitting a PR.
    //
    // Tom Dale, January 18th, 2015, Portland OR
    prototype.childAtIndex = function(element, index) {
      var node = element.firstChild;

      for (var idx = 0; node && idx < index; idx++) {
        node = node.nextSibling;
      }

      return node;
    };

    prototype.appendText = function(element, text) {
      return element.appendChild(this.document.createTextNode(text));
    };

    prototype.setAttribute = function(element, name, value) {
      element.setAttribute(name, String(value));
    };

    prototype.setAttributeNS = function(element, namespace, name, value) {
      element.setAttributeNS(namespace, name, String(value));
    };

    if (canRemoveSvgViewBoxAttribute){
      prototype.removeAttribute = function(element, name) {
        element.removeAttribute(name);
      };
    } else {
      prototype.removeAttribute = function(element, name) {
        if (element.tagName === 'svg' && name === 'viewBox') {
          element.setAttribute(name, null);
        } else {
          element.removeAttribute(name);
        }
      };
    }

    prototype.setPropertyStrict = function(element, name, value) {
      element[name] = value;
    };

    prototype.setProperty = function(element, name, value, namespace) {
      var lowercaseName = name.toLowerCase();
      if (element.namespaceURI === svgNamespace || lowercaseName === 'style') {
        if (isAttrRemovalValue(value)) {
          element.removeAttribute(name);
        } else {
          if (namespace) {
            element.setAttributeNS(namespace, name, value);
          } else {
            element.setAttribute(name, value);
          }
        }
      } else {
        var normalized = normalizeProperty(element, name);
        if (normalized) {
          element[normalized] = value;
        } else {
          if (isAttrRemovalValue(value)) {
            element.removeAttribute(name);
          } else {
            if (namespace && element.setAttributeNS) {
              element.setAttributeNS(namespace, name, value);
            } else {
              element.setAttribute(name, value);
            }
          }
        }
      }
    };

    if (doc && doc.createElementNS) {
      // Only opt into namespace detection if a contextualElement
      // is passed.
      prototype.createElement = function(tagName, contextualElement) {
        var namespace = this.namespace;
        if (contextualElement) {
          if (tagName === 'svg') {
            namespace = svgNamespace;
          } else {
            namespace = interiorNamespace(contextualElement);
          }
        }
        if (namespace) {
          return this.document.createElementNS(namespace, tagName);
        } else {
          return this.document.createElement(tagName);
        }
      };
      prototype.setAttributeNS = function(element, namespace, name, value) {
        element.setAttributeNS(namespace, name, String(value));
      };
    } else {
      prototype.createElement = function(tagName) {
        return this.document.createElement(tagName);
      };
      prototype.setAttributeNS = function(element, namespace, name, value) {
        element.setAttribute(name, String(value));
      };
    }

    prototype.addClasses = addClasses;
    prototype.removeClasses = removeClasses;

    prototype.setNamespace = function(ns) {
      this.namespace = ns;
    };

    prototype.detectNamespace = function(element) {
      this.namespace = interiorNamespace(element);
    };

    prototype.createDocumentFragment = function(){
      return this.document.createDocumentFragment();
    };

    prototype.createTextNode = function(text){
      return this.document.createTextNode(text);
    };

    prototype.createComment = function(text){
      return this.document.createComment(text);
    };

    prototype.repairClonedNode = function(element, blankChildTextNodes, isChecked){
      if (deletesBlankTextNodes && blankChildTextNodes.length > 0) {
        for (var i=0, len=blankChildTextNodes.length;i<len;i++){
          var textNode = this.document.createTextNode(''),
              offset = blankChildTextNodes[i],
              before = this.childAtIndex(element, offset);
          if (before) {
            element.insertBefore(textNode, before);
          } else {
            element.appendChild(textNode);
          }
        }
      }
      if (ignoresCheckedAttribute && isChecked) {
        element.setAttribute('checked', 'checked');
      }
    };

    prototype.cloneNode = function(element, deep){
      var clone = element.cloneNode(!!deep);
      return clone;
    };

    prototype.createAttrMorph = function(element, attrName, namespace){
      return new AttrMorph(element, attrName, this, namespace);
    };

    prototype.createUnsafeAttrMorph = function(element, attrName, namespace){
      var morph = this.createAttrMorph(element, attrName, namespace);
      morph.escaped = false;
      return morph;
    };

    prototype.createMorph = function(parent, start, end, contextualElement){
      if (contextualElement && contextualElement.nodeType === 11) {
        throw new Error("Cannot pass a fragment as the contextual element to createMorph");
      }

      if (!contextualElement && parent.nodeType === 1) {
        contextualElement = parent;
      }
      var morph = new Morph(this, contextualElement);
      morph.firstNode = start;
      morph.lastNode = end;
      morph.state = {};
      morph.isDirty = true;
      return morph;
    };

    prototype.createUnsafeMorph = function(parent, start, end, contextualElement){
      var morph = this.createMorph(parent, start, end, contextualElement);
      morph.parseTextAsHTML = true;
      return morph;
    };

    // This helper is just to keep the templates good looking,
    // passing integers instead of element references.
    prototype.createMorphAt = function(parent, startIndex, endIndex, contextualElement){
      var single = startIndex === endIndex;
      var start = this.childAtIndex(parent, startIndex);
      var end = single ? start : this.childAtIndex(parent, endIndex);
      return this.createMorph(parent, start, end, contextualElement);
    };

    prototype.createUnsafeMorphAt = function(parent, startIndex, endIndex, contextualElement) {
      var morph = this.createMorphAt(parent, startIndex, endIndex, contextualElement);
      morph.parseTextAsHTML = true;
      return morph;
    };

    prototype.insertMorphBefore = function(element, referenceChild, contextualElement) {
      var insertion = this.document.createComment('');
      element.insertBefore(insertion, referenceChild);
      return this.createMorph(element, insertion, insertion, contextualElement);
    };

    prototype.appendMorph = function(element, contextualElement) {
      var insertion = this.document.createComment('');
      element.appendChild(insertion);
      return this.createMorph(element, insertion, insertion, contextualElement);
    };

    prototype.insertBoundary = function(fragment, index) {
      // this will always be null or firstChild
      var child = index === null ? null : this.childAtIndex(fragment, index);
      this.insertBefore(fragment, this.createTextNode(''), child);
    };

    prototype.parseHTML = function(html, contextualElement) {
      var childNodes;

      if (interiorNamespace(contextualElement) === svgNamespace) {
        childNodes = buildSVGDOM(html, this);
      } else {
        var nodes = buildHTMLDOM(html, contextualElement, this);
        if (detectOmittedStartTag(html, contextualElement)) {
          var node = nodes[0];
          while (node && node.nodeType !== 1) {
            node = node.nextSibling;
          }
          childNodes = node.childNodes;
        } else {
          childNodes = nodes;
        }
      }

      // Copy node list to a fragment.
      var fragment = this.document.createDocumentFragment();

      if (childNodes && childNodes.length > 0) {
        var currentNode = childNodes[0];

        // We prepend an <option> to <select> boxes to absorb any browser bugs
        // related to auto-select behavior. Skip past it.
        if (contextualElement.tagName === 'SELECT') {
          currentNode = currentNode.nextSibling;
        }

        while (currentNode) {
          var tempNode = currentNode;
          currentNode = currentNode.nextSibling;

          fragment.appendChild(tempNode);
        }
      }

      return fragment;
    };

    var parsingNode;

    // Used to determine whether a URL needs to be sanitized.
    prototype.protocolForURL = function(url) {
      if (!parsingNode) {
        parsingNode = this.document.createElement('a');
      }

      parsingNode.href = url;
      return parsingNode.protocol;
    };

    __exports__["default"] = DOMHelper;
  });
define("dom-helper/build-html-dom",
  ["exports"],
  function(__exports__) {
    "use strict";
    /* global XMLSerializer:false */
    var svgHTMLIntegrationPoints = {foreignObject: 1, desc: 1, title: 1};
    __exports__.svgHTMLIntegrationPoints = svgHTMLIntegrationPoints;var svgNamespace = 'http://www.w3.org/2000/svg';
    __exports__.svgNamespace = svgNamespace;
    var doc = typeof document === 'undefined' ? false : document;

    // Safari does not like using innerHTML on SVG HTML integration
    // points (desc/title/foreignObject).
    var needsIntegrationPointFix = doc && (function(document) {
      if (document.createElementNS === undefined) {
        return;
      }
      // In FF title will not accept innerHTML.
      var testEl = document.createElementNS(svgNamespace, 'title');
      testEl.innerHTML = "<div></div>";
      return testEl.childNodes.length === 0 || testEl.childNodes[0].nodeType !== 1;
    })(doc);

    // Internet Explorer prior to 9 does not allow setting innerHTML if the first element
    // is a "zero-scope" element. This problem can be worked around by making
    // the first node an invisible text node. We, like Modernizr, use &shy;
    var needsShy = doc && (function(document) {
      var testEl = document.createElement('div');
      testEl.innerHTML = "<div></div>";
      testEl.firstChild.innerHTML = "<script><\/script>";
      return testEl.firstChild.innerHTML === '';
    })(doc);

    // IE 8 (and likely earlier) likes to move whitespace preceeding
    // a script tag to appear after it. This means that we can
    // accidentally remove whitespace when updating a morph.
    var movesWhitespace = doc && (function(document) {
      var testEl = document.createElement('div');
      testEl.innerHTML = "Test: <script type='text/x-placeholder'><\/script>Value";
      return testEl.childNodes[0].nodeValue === 'Test:' &&
              testEl.childNodes[2].nodeValue === ' Value';
    })(doc);

    var tagNamesRequiringInnerHTMLFix = doc && (function(document) {
      var tagNamesRequiringInnerHTMLFix;
      // IE 9 and earlier don't allow us to set innerHTML on col, colgroup, frameset,
      // html, style, table, tbody, tfoot, thead, title, tr. Detect this and add
      // them to an initial list of corrected tags.
      //
      // Here we are only dealing with the ones which can have child nodes.
      //
      var tableNeedsInnerHTMLFix;
      var tableInnerHTMLTestElement = document.createElement('table');
      try {
        tableInnerHTMLTestElement.innerHTML = '<tbody></tbody>';
      } catch (e) {
      } finally {
        tableNeedsInnerHTMLFix = (tableInnerHTMLTestElement.childNodes.length === 0);
      }
      if (tableNeedsInnerHTMLFix) {
        tagNamesRequiringInnerHTMLFix = {
          colgroup: ['table'],
          table: [],
          tbody: ['table'],
          tfoot: ['table'],
          thead: ['table'],
          tr: ['table', 'tbody']
        };
      }

      // IE 8 doesn't allow setting innerHTML on a select tag. Detect this and
      // add it to the list of corrected tags.
      //
      var selectInnerHTMLTestElement = document.createElement('select');
      selectInnerHTMLTestElement.innerHTML = '<option></option>';
      if (!selectInnerHTMLTestElement.childNodes[0]) {
        tagNamesRequiringInnerHTMLFix = tagNamesRequiringInnerHTMLFix || {};
        tagNamesRequiringInnerHTMLFix.select = [];
      }
      return tagNamesRequiringInnerHTMLFix;
    })(doc);

    function scriptSafeInnerHTML(element, html) {
      // without a leading text node, IE will drop a leading script tag.
      html = '&shy;'+html;

      element.innerHTML = html;

      var nodes = element.childNodes;

      // Look for &shy; to remove it.
      var shyElement = nodes[0];
      while (shyElement.nodeType === 1 && !shyElement.nodeName) {
        shyElement = shyElement.firstChild;
      }
      // At this point it's the actual unicode character.
      if (shyElement.nodeType === 3 && shyElement.nodeValue.charAt(0) === "\u00AD") {
        var newValue = shyElement.nodeValue.slice(1);
        if (newValue.length) {
          shyElement.nodeValue = shyElement.nodeValue.slice(1);
        } else {
          shyElement.parentNode.removeChild(shyElement);
        }
      }

      return nodes;
    }

    function buildDOMWithFix(html, contextualElement){
      var tagName = contextualElement.tagName;

      // Firefox versions < 11 do not have support for element.outerHTML.
      var outerHTML = contextualElement.outerHTML || new XMLSerializer().serializeToString(contextualElement);
      if (!outerHTML) {
        throw "Can't set innerHTML on "+tagName+" in this browser";
      }

      html = fixSelect(html, contextualElement);

      var wrappingTags = tagNamesRequiringInnerHTMLFix[tagName.toLowerCase()];

      var startTag = outerHTML.match(new RegExp("<"+tagName+"([^>]*)>", 'i'))[0];
      var endTag = '</'+tagName+'>';

      var wrappedHTML = [startTag, html, endTag];

      var i = wrappingTags.length;
      var wrappedDepth = 1 + i;
      while(i--) {
        wrappedHTML.unshift('<'+wrappingTags[i]+'>');
        wrappedHTML.push('</'+wrappingTags[i]+'>');
      }

      var wrapper = document.createElement('div');
      scriptSafeInnerHTML(wrapper, wrappedHTML.join(''));
      var element = wrapper;
      while (wrappedDepth--) {
        element = element.firstChild;
        while (element && element.nodeType !== 1) {
          element = element.nextSibling;
        }
      }
      while (element && element.tagName !== tagName) {
        element = element.nextSibling;
      }
      return element ? element.childNodes : [];
    }

    var buildDOM;
    if (needsShy) {
      buildDOM = function buildDOM(html, contextualElement, dom){
        html = fixSelect(html, contextualElement);

        contextualElement = dom.cloneNode(contextualElement, false);
        scriptSafeInnerHTML(contextualElement, html);
        return contextualElement.childNodes;
      };
    } else {
      buildDOM = function buildDOM(html, contextualElement, dom){
        html = fixSelect(html, contextualElement);

        contextualElement = dom.cloneNode(contextualElement, false);
        contextualElement.innerHTML = html;
        return contextualElement.childNodes;
      };
    }

    function fixSelect(html, contextualElement) {
      if (contextualElement.tagName === 'SELECT') {
        html = "<option></option>" + html;
      }

      return html;
    }

    var buildIESafeDOM;
    if (tagNamesRequiringInnerHTMLFix || movesWhitespace) {
      buildIESafeDOM = function buildIESafeDOM(html, contextualElement, dom) {
        // Make a list of the leading text on script nodes. Include
        // script tags without any whitespace for easier processing later.
        var spacesBefore = [];
        var spacesAfter = [];
        if (typeof html === 'string') {
          html = html.replace(/(\s*)(<script)/g, function(match, spaces, tag) {
            spacesBefore.push(spaces);
            return tag;
          });

          html = html.replace(/(<\/script>)(\s*)/g, function(match, tag, spaces) {
            spacesAfter.push(spaces);
            return tag;
          });
        }

        // Fetch nodes
        var nodes;
        if (tagNamesRequiringInnerHTMLFix[contextualElement.tagName.toLowerCase()]) {
          // buildDOMWithFix uses string wrappers for problematic innerHTML.
          nodes = buildDOMWithFix(html, contextualElement);
        } else {
          nodes = buildDOM(html, contextualElement, dom);
        }

        // Build a list of script tags, the nodes themselves will be
        // mutated as we add test nodes.
        var i, j, node, nodeScriptNodes;
        var scriptNodes = [];
        for (i=0;i<nodes.length;i++) {
          node=nodes[i];
          if (node.nodeType !== 1) {
            continue;
          }
          if (node.tagName === 'SCRIPT') {
            scriptNodes.push(node);
          } else {
            nodeScriptNodes = node.getElementsByTagName('script');
            for (j=0;j<nodeScriptNodes.length;j++) {
              scriptNodes.push(nodeScriptNodes[j]);
            }
          }
        }

        // Walk the script tags and put back their leading text nodes.
        var scriptNode, textNode, spaceBefore, spaceAfter;
        for (i=0;i<scriptNodes.length;i++) {
          scriptNode = scriptNodes[i];
          spaceBefore = spacesBefore[i];
          if (spaceBefore && spaceBefore.length > 0) {
            textNode = dom.document.createTextNode(spaceBefore);
            scriptNode.parentNode.insertBefore(textNode, scriptNode);
          }

          spaceAfter = spacesAfter[i];
          if (spaceAfter && spaceAfter.length > 0) {
            textNode = dom.document.createTextNode(spaceAfter);
            scriptNode.parentNode.insertBefore(textNode, scriptNode.nextSibling);
          }
        }

        return nodes;
      };
    } else {
      buildIESafeDOM = buildDOM;
    }

    var buildHTMLDOM;
    if (needsIntegrationPointFix) {
      buildHTMLDOM = function buildHTMLDOM(html, contextualElement, dom){
        if (svgHTMLIntegrationPoints[contextualElement.tagName]) {
          return buildIESafeDOM(html, document.createElement('div'), dom);
        } else {
          return buildIESafeDOM(html, contextualElement, dom);
        }
      };
    } else {
      buildHTMLDOM = buildIESafeDOM;
    }

    __exports__.buildHTMLDOM = buildHTMLDOM;
  });
define("dom-helper/classes",
  ["exports"],
  function(__exports__) {
    "use strict";
    var doc = typeof document === 'undefined' ? false : document;

    // PhantomJS has a broken classList. See https://github.com/ariya/phantomjs/issues/12782
    var canClassList = doc && (function(){
      var d = document.createElement('div');
      if (!d.classList) {
        return false;
      }
      d.classList.add('boo');
      d.classList.add('boo', 'baz');
      return (d.className === 'boo baz');
    })();

    function buildClassList(element) {
      var classString = (element.getAttribute('class') || '');
      return classString !== '' && classString !== ' ' ? classString.split(' ') : [];
    }

    function intersect(containingArray, valuesArray) {
      var containingIndex = 0;
      var containingLength = containingArray.length;
      var valuesIndex = 0;
      var valuesLength = valuesArray.length;

      var intersection = new Array(valuesLength);

      // TODO: rewrite this loop in an optimal manner
      for (;containingIndex<containingLength;containingIndex++) {
        valuesIndex = 0;
        for (;valuesIndex<valuesLength;valuesIndex++) {
          if (valuesArray[valuesIndex] === containingArray[containingIndex]) {
            intersection[valuesIndex] = containingIndex;
            break;
          }
        }
      }

      return intersection;
    }

    function addClassesViaAttribute(element, classNames) {
      var existingClasses = buildClassList(element);

      var indexes = intersect(existingClasses, classNames);
      var didChange = false;

      for (var i=0, l=classNames.length; i<l; i++) {
        if (indexes[i] === undefined) {
          didChange = true;
          existingClasses.push(classNames[i]);
        }
      }

      if (didChange) {
        element.setAttribute('class', existingClasses.length > 0 ? existingClasses.join(' ') : '');
      }
    }

    function removeClassesViaAttribute(element, classNames) {
      var existingClasses = buildClassList(element);

      var indexes = intersect(classNames, existingClasses);
      var didChange = false;
      var newClasses = [];

      for (var i=0, l=existingClasses.length; i<l; i++) {
        if (indexes[i] === undefined) {
          newClasses.push(existingClasses[i]);
        } else {
          didChange = true;
        }
      }

      if (didChange) {
        element.setAttribute('class', newClasses.length > 0 ? newClasses.join(' ') : '');
      }
    }

    var addClasses, removeClasses;
    if (canClassList) {
      addClasses = function addClasses(element, classNames) {
        if (element.classList) {
          if (classNames.length === 1) {
            element.classList.add(classNames[0]);
          } else if (classNames.length === 2) {
            element.classList.add(classNames[0], classNames[1]);
          } else {
            element.classList.add.apply(element.classList, classNames);
          }
        } else {
          addClassesViaAttribute(element, classNames);
        }
      };
      removeClasses = function removeClasses(element, classNames) {
        if (element.classList) {
          if (classNames.length === 1) {
            element.classList.remove(classNames[0]);
          } else if (classNames.length === 2) {
            element.classList.remove(classNames[0], classNames[1]);
          } else {
            element.classList.remove.apply(element.classList, classNames);
          }
        } else {
          removeClassesViaAttribute(element, classNames);
        }
      };
    } else {
      addClasses = addClassesViaAttribute;
      removeClasses = removeClassesViaAttribute;
    }

    __exports__.addClasses = addClasses;
    __exports__.removeClasses = removeClasses;
  });
define("dom-helper/prop",
  ["exports"],
  function(__exports__) {
    "use strict";
    function isAttrRemovalValue(value) {
      return value === null || value === undefined;
    }

    __exports__.isAttrRemovalValue = isAttrRemovalValue;// TODO should this be an o_create kind of thing?
    var propertyCaches = {};
    __exports__.propertyCaches = propertyCaches;
    function normalizeProperty(element, attrName) {
      var tagName = element.tagName;
      var key;
      var cache = propertyCaches[tagName];
      if (!cache) {
        // TODO should this be an o_create kind of thing?
        cache = {};
        for (key in element) {
          cache[key.toLowerCase()] = key;
        }
        propertyCaches[tagName] = cache;
      }

      // presumes that the attrName has been lowercased.
      return cache[attrName];
    }

    __exports__.normalizeProperty = normalizeProperty;
  });
define("morph-attr",
  ["./morph-attr/sanitize-attribute-value","./dom-helper/prop","./dom-helper/build-html-dom","./htmlbars-util","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __dependency4__, __exports__) {
    "use strict";
    var sanitizeAttributeValue = __dependency1__.sanitizeAttributeValue;
    var isAttrRemovalValue = __dependency2__.isAttrRemovalValue;
    var normalizeProperty = __dependency2__.normalizeProperty;
    var svgNamespace = __dependency3__.svgNamespace;
    var getAttrNamespace = __dependency4__.getAttrNamespace;

    function updateProperty(value) {
      this.domHelper.setPropertyStrict(this.element, this.attrName, value);
    }

    function updateAttribute(value) {
      if (isAttrRemovalValue(value)) {
        this.domHelper.removeAttribute(this.element, this.attrName);
      } else {
        this.domHelper.setAttribute(this.element, this.attrName, value);
      }
    }

    function updateAttributeNS(value) {
      if (isAttrRemovalValue(value)) {
        this.domHelper.removeAttribute(this.element, this.attrName);
      } else {
        this.domHelper.setAttributeNS(this.element, this.namespace, this.attrName, value);
      }
    }

    function AttrMorph(element, attrName, domHelper, namespace) {
      this.element = element;
      this.domHelper = domHelper;
      this.namespace = namespace !== undefined ? namespace : getAttrNamespace(attrName);
      this.escaped = true;

      var normalizedAttrName = normalizeProperty(this.element, attrName);
      if (this.namespace) {
        this._update = updateAttributeNS;
        this.attrName = attrName;
      } else {
        if (element.namespaceURI === svgNamespace || attrName === 'style' || !normalizedAttrName) {
          this.attrName = attrName;
          this._update = updateAttribute;
        } else {
          this.attrName = normalizedAttrName;
          this._update = updateProperty;
        }
      }
    }

    AttrMorph.prototype.setContent = function (value) {
      if (this.escaped) {
        var sanitized = sanitizeAttributeValue(this.domHelper, this.element, this.attrName, value);
        this._update(sanitized, this.namespace);
      } else {
        this._update(value, this.namespace);
      }
    };

    __exports__["default"] = AttrMorph;

    __exports__.sanitizeAttributeValue = sanitizeAttributeValue;
  });
define("morph-attr/sanitize-attribute-value",
  ["exports"],
  function(__exports__) {
    "use strict";
    /* jshint scripturl:true */

    var badProtocols = {
      'javascript:': true,
      'vbscript:': true
    };

    var badTags = {
      'A': true,
      'BODY': true,
      'LINK': true,
      'IMG': true,
      'IFRAME': true
    };

    var badAttributes = {
      'href': true,
      'src': true,
      'background': true
    };
    __exports__.badAttributes = badAttributes;
    function sanitizeAttributeValue(dom, element, attribute, value) {
      var tagName;

      if (!element) {
        tagName = null;
      } else {
        tagName = element.tagName;
      }

      if (value && value.toHTML) {
        return value.toHTML();
      }

      if ((tagName === null || badTags[tagName]) && badAttributes[attribute]) {
        var protocol = dom.protocolForURL(value);
        if (badProtocols[protocol] === true) {
          return 'unsafe:' + value;
        }
      }

      return value;
    }

    __exports__.sanitizeAttributeValue = sanitizeAttributeValue;
  });
define("morph-range",
  ["./morph-range/utils","exports"],
  function(__dependency1__, __exports__) {
    "use strict";
    var clear = __dependency1__.clear;
    var insertBefore = __dependency1__.insertBefore;

    function Morph(domHelper, contextualElement) {
      this.domHelper = domHelper;
      // context if content if current content is detached
      this.contextualElement = contextualElement;

      // flag to force text to setContent to be treated as html
      this.parseTextAsHTML = false;

      this.firstNode = null;
      this.lastNode  = null;

      // morph graph
      this.parentMorph     = null;
      this.firstChildMorph = null;
      this.lastChildMorph  = null;

      this.previousMorph = null;
      this.nextMorph = null;
    }

    Morph.prototype.setContent = function Morph$setContent(content) {
      if (content === null || content === undefined) {
        return this.clear();
      }

      var type = typeof content;
      switch (type) {
        case 'string':
          if (this.parseTextAsHTML) {
            return this.setHTML(content);
          }
          return this.setText(content);
        case 'object':
          if (typeof content.nodeType === 'number') {
            return this.setNode(content);
          }
          /* Handlebars.SafeString */
          if (typeof content.string === 'string') {
            return this.setHTML(content.string);
          }
          if (this.parseTextAsHTML) {
            return this.setHTML(content.toString());
          }
          /* falls through */
        case 'boolean':
        case 'number':
          return this.setText(content.toString());
        default:
          throw new TypeError('unsupported content');
      }
    };

    Morph.prototype.clear = function Morph$clear() {
      return this.setNode(this.domHelper.createComment(''));
    };

    Morph.prototype.setText = function Morph$setText(text) {
      var firstNode = this.firstNode;
      var lastNode = this.lastNode;

      if (firstNode &&
          lastNode === firstNode &&
          firstNode.nodeType === 3) {
        firstNode.nodeValue = text;
        return firstNode;
      }

      return this.setNode(
        text ? this.domHelper.createTextNode(text) : this.domHelper.createComment('')
      );
    };

    Morph.prototype.setNode = function Morph$setNode(newNode) {
      var firstNode, lastNode;
      switch (newNode.nodeType) {
        case 3:
          firstNode = newNode;
          lastNode = newNode;
          break;
        case 11:
          firstNode = newNode.firstChild;
          lastNode = newNode.lastChild;
          if (firstNode === null) {
            firstNode = this.domHelper.createComment('');
            newNode.appendChild(firstNode);
            lastNode = firstNode;
          }
          break;
        default:
          firstNode = newNode;
          lastNode = newNode;
          break;
      }

      var previousFirstNode = this.firstNode;
      if (previousFirstNode !== null) {

        var parentNode = previousFirstNode.parentNode;
        insertBefore(parentNode, firstNode, lastNode, previousFirstNode);
        clear(parentNode, previousFirstNode, this.lastNode);
      }

      this.firstNode = firstNode;
      this.lastNode  = lastNode;

      if (this.parentMorph) {
        syncFirstNode(this);
        syncLastNode(this);
      }

      return newNode;
    };

    function syncFirstNode(_morph) {
      var morph = _morph;
      var parentMorph;
      while (parentMorph = morph.parentMorph) {
        if (morph !== parentMorph.firstChildMorph) {
          break;
        }
        if (morph.firstNode === parentMorph.firstNode) {
          break;
        }

        parentMorph.firstNode = morph.firstNode;

        morph = parentMorph;
      }
    }

    function syncLastNode(_morph) {
      var morph = _morph;
      var parentMorph;
      while (parentMorph = morph.parentMorph) {
        if (morph !== parentMorph.lastChildMorph) {
          break;
        }
        if (morph.lastNode === parentMorph.lastNode) {
          break;
        }

        parentMorph.lastNode = morph.lastNode;

        morph = parentMorph;
      }
    }

    // return morph content to an undifferentiated state
    // drops knowledge that the node has content.
    // this is for rerender, I need to test, but basically
    // the idea is to leave the content, but allow render again
    // without appending, so n
    Morph.prototype.reset = function Morph$reset() {
      this.firstChildMorph = null;
      this.lastChildMorph = null;
    };

    Morph.prototype.destroy = function Morph$destroy() {
      var parentMorph = this.parentMorph;
      var previousMorph = this.previousMorph;
      var nextMorph = this.nextMorph;
      var firstNode = this.firstNode;
      var lastNode = this.lastNode;
      var parentNode = firstNode && firstNode.parentNode;

      if (previousMorph) {
        if (nextMorph) {
          previousMorph.nextMorph = nextMorph;
          nextMorph.previousMorph = previousMorph;
        } else {
          previousMorph.nextMorph = null;
          if (parentMorph) { parentMorph.lastChildMorph = previousMorph; }
        }
      } else {
        if (nextMorph) {
          nextMorph.previousMorph = null;
          if (parentMorph) { parentMorph.firstChildMorph = nextMorph; }
        } else if (parentMorph) {
          parentMorph.lastChildMorph = parentMorph.firstChildMorph = null;
        }
      }

      this.parentMorph = null;
      this.firstNode = null;
      this.lastNode = null;

      if (parentMorph) {
        if (!parentMorph.firstChildMorph) {
          // list is empty
          parentMorph.clear();
          return;
        } else {
          syncFirstNode(parentMorph.firstChildMorph);
          syncLastNode(parentMorph.lastChildMorph);
        }
      }

      clear(parentNode, firstNode, lastNode);
    };

    Morph.prototype.setHTML = function(text) {
      var fragment = this.domHelper.parseHTML(text, this.contextualElement);
      return this.setNode(fragment);
    };

    Morph.prototype.appendContent = function(content) {
      return this.insertContentBeforeMorph(content, null);
    };

    Morph.prototype.insertContentBeforeMorph = function (content, referenceMorph) {
      var morph = new Morph(this.domHelper, this.contextualElement);
      morph.setContent(content);
      this.insertBeforeMorph(morph, referenceMorph);
      return morph;
    };

    Morph.prototype.appendMorph = function(morph) {
      this.insertBeforeMorph(morph, null);
    };

    Morph.prototype.insertBeforeMorph = function(morph, referenceMorph) {
      if (referenceMorph && referenceMorph.parentMorph !== this) {
        throw new Error('The morph before which the new morph is to be inserted is not a child of this morph.');
      }

      morph.parentMorph = this;

      var parentNode = this.firstNode.parentNode;

      insertBefore(
        parentNode,
        morph.firstNode,
        morph.lastNode,
        referenceMorph ? referenceMorph.firstNode : this.lastNode.nextSibling
      );

      // was not in list mode replace current content
      if (!this.firstChildMorph) {
        clear(parentNode, this.firstNode, this.lastNode);
      }

      var previousMorph = referenceMorph ? referenceMorph.previousMorph : this.lastChildMorph;
      if (previousMorph) {
        previousMorph.nextMorph = morph;
        morph.previousMorph = previousMorph;
      } else {
        this.firstChildMorph = morph;
      }

      if (referenceMorph) {
        referenceMorph.previousMorph = morph;
        morph.nextMorph = referenceMorph;
      } else {
        this.lastChildMorph = morph;
      }

      syncFirstNode(this.firstChildMorph);
      syncLastNode(this.lastChildMorph);
    };

    __exports__["default"] = Morph;
  });
define("morph-range.umd",
  ["./morph-range"],
  function(__dependency1__) {
    "use strict";
    var Morph = __dependency1__["default"];

    (function (root, factory) {
      if (typeof define === 'function' && define.amd) {
        define([], factory);
      } else if (typeof exports === 'object') {
        module.exports = factory();
      } else {
        root.Morph = factory();
      }
    }(this, function () {
      return Morph;
    }));
  });
define("morph-range/utils",
  ["exports"],
  function(__exports__) {
    "use strict";
    // inclusive of both nodes
    function clear(parentNode, firstNode, lastNode) {
      if (!parentNode) { return; }

      var node = firstNode;
      var nextNode;
      do {
        nextNode = node.nextSibling;
        parentNode.removeChild(node);
        if (node === lastNode) {
          break;
        }
        node = nextNode;
      } while (node);
    }

    __exports__.clear = clear;function insertBefore(parentNode, firstNode, lastNode, _refNode) {
      var node = lastNode;
      var refNode = _refNode;
      var prevNode;
      do {
        prevNode = node.previousSibling;
        parentNode.insertBefore(node, refNode);
        if (node === firstNode) {
          break;
        }
        refNode = node;
        node = prevNode;
      } while (node);
    }

    __exports__.insertBefore = insertBefore;
  });
define("property-compiler/property-compiler", ["exports", "module", "property-compiler/tokenizer"], function (exports, module, _propertyCompilerTokenizer) {
  "use strict";

  // Property Compiler
  // ----------------

  var tokenizer = to5Runtime.interopRequire(_propertyCompilerTokenizer);

  var computedProperties = [];

  // TODO: Make this farrrrrr more robust...very minimal right now

  function compile(prop, name) {
    var output = {};

    if (prop.__params) return prop.__params;

    var str = prop.toString(),
        //.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1'), // String representation of function sans comments
    nextToken = tokenizer.tokenize(str),
        tokens = [],
        token,
        finishedPaths = [],
        namedPaths = {},
        opcodes = [],
        named = false,
        listening = 0,
        inSubComponent = 0,
        subComponent = [],
        root,
        paths = [],
        path,
        tmpPath,
        attrs = [],
        workingpath = [],
        terminators = [";", ",", "==", ">", "<", ">=", "<=", ">==", "<==", "!=", "!==", "===", "&&", "||", "+", "-", "/", "*", "{", "}"];
    do {
      token = nextToken();

      if (token.value === "this") {
        listening++;
        workingpath = [];
      }

      // TODO: handle gets on collections
      if (token.value === "get") {
        path = nextToken();
        while (_.isUndefined(path.value)) {
          path = nextToken();
        }

        // Replace any access to a collection with the generic @each placeholder and push dependancy
        workingpath.push(path.value.replace(/\[.+\]/g, ".@each").replace(/^\./, ""));
      }

      if (token.value === "pluck") {
        path = nextToken();
        while (_.isUndefined(path.value)) {
          path = nextToken();
        }

        workingpath.push("@each." + path.value);
      }

      if (token.value === "slice" || token.value === "clone" || token.value === "filter") {
        path = nextToken();
        if (path.type.type === "(") workingpath.push("@each");
      }

      if (token.value === "at") {
        path = nextToken();
        while (_.isUndefined(path.value)) {
          path = nextToken();
        }
        // workingpath[workingpath.length -1] = workingpath[workingpath.length -1] + '[' + path.value + ']';
        // workingpath.push('[' + path.value + ']');
        workingpath.push("@each");
      }

      if (token.value === "where" || token.value === "findWhere") {
        workingpath.push("@each");
        path = nextToken();
        attrs = [];
        var itr = 0;
        while (path.type.type !== ")") {
          if (path.value) {
            if (itr % 2 === 0) {
              attrs.push(path.value);
            }
            itr++;
          }
          path = nextToken();
        }
        workingpath.push(attrs);
      }

      if (listening && (_.indexOf(terminators, token.type.type) > -1 || _.indexOf(terminators, token.value) > -1)) {
        workingpath = _.reduce(workingpath, function (memo, paths) {
          var newMemo = [];
          paths = !_.isArray(paths) ? [paths] : paths;
          _.each(paths, function (path) {
            _.each(memo, function (mem) {
              newMemo.push(_.compact([mem, path]).join(".").replace(".[", "["));
            });
          });
          return newMemo;
        }, [""]);
        finishedPaths = _.compact(_.union(finishedPaths, workingpath));
        workingpath = [];
        listening--;
      }
    } while (token.start !== token.end);

    console.log("COMPUTED PROPERTY", name, "registered with these dependancy paths:", finishedPaths);

    // Return the dependancies list
    return prop.__params = finishedPaths;
  }

  module.exports = { compile: compile };
});
define("rebound-component/component", ["exports", "module", "dom-helper", "rebound-component/hooks", "rebound-component/helpers", "rebound-component/utils", "rebound-data/rebound-data"], function (exports, module, _domHelper, _reboundComponentHooks, _reboundComponentHelpers, _reboundComponentUtils, _reboundDataReboundData) {
  "use strict";

  // Rebound Component
  // ----------------

  var DOMHelper = to5Runtime.interopRequire(_domHelper);

  var hooks = to5Runtime.interopRequire(_reboundComponentHooks);

  var helpers = to5Runtime.interopRequire(_reboundComponentHelpers);

  var $ = to5Runtime.interopRequire(_reboundComponentUtils);

  var Model = _reboundDataReboundData.Model;



  // If Backbone hasn't been started yet, throw error
  if (!window.Backbone) throw "Backbone must be on the page for Rebound to load.";

  // Returns true if `str` starts with `test`
  function startsWith(str, test) {
    if (str === test) return true;
    str = $.splitPath(str);
    test = $.splitPath(test);
    while (test[0] && str[0]) {
      if (str[0] !== test[0] && str[0] !== "@each" && test[0] !== "@each") return false;
      test.shift();
      str.shift();
    }
    return true;
  }

  function renderCallback() {
    var i = 0,
        len = this._toRender.length;
    delete this._renderTimeout;
    for (i = 0; i < len; i++) {
      this._toRender.shift().notify();
    }
    this._toRender.added = {};
  }

  function hydrate(spec, options) {
    // Return a wrapper function that will merge user provided helpers and hooks with our defaults
    return function (data, options) {
      // Rebound's default environment
      // The application environment is propagated down each render call and
      // augmented with helpers as it goes
      var env = {
        helpers: helpers.helpers,
        hooks: hooks,
        dom: new DOMHelper(),
        useFragmentCache: true
      };

      // Ensure we have a contextual element to pass to render
      var contextElement = data.el || document.body;

      // Merge our default helpers and hooks with user provided helpers
      env.helpers = _.defaults(options.helpers || {}, env.helpers);
      env.hooks = _.defaults(options.hooks || {}, env.hooks);

      // Call our func with merged helpers and hooks
      return spec.render(data, env, contextElement);
    };
  };


  // New Backbone Component
  var Component = Model.extend({

    isComponent: true,

    _callOnComponent: function (name, event) {
      if (!_.isFunction(this[name])) {
        throw "ERROR: No method named " + name + " on component " + this.__name + "!";
      }
      return this[name].call(this, event);
    },

    _listenToService: function (key, service) {
      var _this = this;
      var self = this;
      this.listenTo(service, "all", function (type, model, value, options) {
        var attr,
            path = model.__path(),
            changed;
        if (type.indexOf("change:") === 0) {
          changed = model.changedAttributes();
          for (attr in changed) {
            // TODO: Modifying arguments array is bad. change this
            type = "change:" + key + "." + path + (path && ".") + attr; // jshint ignore:line
            options.service = key;
            _this.trigger.call(_this, type, model, value, options);
          }
          return;
        }
        return _this.trigger.call(_this, type, model, value, options);
      });
    },

    deinitialize: function () {
      var _this2 = this;
      if (this.consumers.length) return;
      _.each(this.services, function (service, key) {
        _.each(service.consumers, function (consumer, index) {
          if (consumer.component === _this2) service.consumers.splice(index, 1);
        });
      });
      delete this.services;
      Rebound.Model.prototype.deinitialize.apply(this, arguments);
    },

    // Set is overridden on components to accept components as a valid input type.
    // Components set on other Components are mixed in as a shared object. {raw: true}
    // It also marks itself as a consumer of this component
    set: function (key, val, options) {
      var attrs, attr, serviceOptions;
      if (typeof key === "object") {
        attrs = key.isModel ? key.attributes : key;
        options = val;
      } else (attrs = {})[key] = val;
      options || (options = {});

      // If reset option passed, do a reset. If nothing passed, return.
      if (options.reset === true) return this.reset(attrs, options);
      if (options.defaults === true) this.defaults = attrs;
      if (_.isEmpty(attrs)) return;

      // For each attribute passed:
      for (key in attrs) {
        attr = attrs[key];
        if (attr && attr.isComponent) {
          serviceOptions || (serviceOptions = _.defaults(_.clone(options), { raw: true }));
          attr.consumers.push({ key: key, component: this });
          this.services[key] = attr;
          this._listenToService(key, attr);
          Rebound.Model.prototype.set.call(this, key, attr, serviceOptions);
        }
        Rebound.Model.prototype.set.call(this, key, attr, options);
      }
      return this;
    },

    constructor: function (options) {
      var key,
          attr,
          self = this;
      options = options || (options = {});
      _.bindAll(this, "_callOnComponent", "_listenToService");
      this.cid = _.uniqueId("component");
      this.attributes = {};
      this.changed = {};
      this.helpers = {};
      this.consumers = [];
      this.services = {};
      this.__parent__ = this.__root__ = this;
      this.listenTo(this, "all", this._onChange);

      // Take our parsed data and add it to our backbone data structure. Does a deep defaults set.
      // In the model, primatives (arrays, objects, etc) are converted to Backbone Objects
      // Functions are compiled to find their dependancies and added as computed properties
      // Set our component's context with the passed data merged with the component's defaults
      this.set(this.defaults || {});
      this.set(options.data || {});

      // Call on component is used by the {{on}} helper to call all event callbacks in the scope of the component
      this.helpers._callOnComponent = this._callOnComponent;


      // Get any additional routes passed in from options
      this.routes = _.defaults(options.routes || {}, this.routes);
      // Ensure that all route functions exist
      _.each(this.routes, function (value, key, routes) {
        if (typeof value !== "string") {
          throw "Function name passed to routes in  " + this.__name + " component must be a string!";
        }
        if (!this[value]) {
          throw "Callback function " + value + " does not exist on the  " + this.__name + " component!";
        }
      }, this);

      // Our Component is fully created now, but not rendered. Call created callback.
      if (_.isFunction(this.createdCallback)) {
        this.createdCallback.call(this);
      }

      // Set our outlet and template if we have them
      this.el = options.outlet || document.createDocumentFragment();
      this.$el = _.isUndefined(window.Backbone.$) ? false : window.Backbone.$(this.el);
      this.template = options.template || this.template;

      // Take our precompiled template and hydrates it. When Rebound Compiler is included, can be a handlebars template string.
      // TODO: Check if template is a string, and if the compiler exists on the page, and compile if needed
      if (this.template) {
        this.template = typeof this.template === "object" ? hydrate(this.template) : this.template;

        // Render our dom and place the dom in our custom element
        // Template accepts [data, options, contextualElement]
        this.el.appendChild(this.template(this, { helpers: this.helpers }, this.el));

        // Add active class to this newly rendered template's link elements that require it
        $(this.el).markLinks();
      }

      this.initialize();
    },

    $: function (selector) {
      if (!this.$el) {
        return console.error("No DOM manipulation library on the page!");
      }
      return this.$el.find(selector);
    },

    // Trigger all events on both the component and the element
    trigger: function (eventName) {
      if (this.el) {
        $(this.el).trigger(eventName, arguments);
      }
      Backbone.Model.prototype.trigger.apply(this, arguments);
    },

    _onAttributeChange: function (attrName, oldVal, newVal) {},


    _onChange: function (type, model, collection, options) {
      var shortcircuit = { change: 1, sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1, dirty: 1 };
      if (shortcircuit[type]) return;

      var data, changed;
      model || (model = {});
      collection || (collection = {});
      options || (options = {});
      !collection.isData && type.indexOf("change:") === -1 && (options = collection) && (collection = model);
      this._toRender || (this._toRender = []);

      if (type === "reset" && options.previousAttributes || type.indexOf("change:") !== -1) {
        data = model;
        changed = model.changedAttributes();
      } else if (type === "add" || type === "remove" || type === "reset" && options.previousModels) {
        data = collection;
        changed = {
          "@each": data
        };
      }

      if (!data || !changed) return;

      var push = function (arr) {
        var i,
            len = arr.length;
        this.added || (this.added = {});
        for (i = 0; i < len; i++) {
          if (this.added[arr[i].cid]) continue;
          this.added[arr[i].cid] = 1;
          this.push(arr[i]);
        }
      };
      var context = this;
      var basePath = data.__path();
      // If this event came from within a service, include the service key in the base path
      if (options.service) basePath = options.service + "." + basePath;
      var parts = $.splitPath(basePath);
      var key, obsPath, path, observers;

      // For each changed key, walk down the data tree from the root to the data
      // element that triggered the event and add all relevent callbacks to this
      // object's _toRender queue.
      do {
        for (key in changed) {
          path = (basePath + (basePath && key && ".") + key).replace(context.__path(), "").replace(/\[[^\]]+\]/g, ".@each").replace(/^\./, "");
          for (obsPath in context.__observers) {
            observers = context.__observers[obsPath];
            if (startsWith(obsPath, path)) {
              // If this is a collection event, trigger everything, otherwise only trigger property change callbacks
              if (data.isCollection) push.call(this._toRender, observers.collection);
              push.call(this._toRender, observers.model);
            }
          }
        }
      } while (context !== data && (context = context.get(parts.shift())));

      // Queue our render callback to be called after the current call stack has been exhausted
      window.clearTimeout(this._renderTimeout);
      this._renderTimeout = window.setTimeout(_.bind(renderCallback, this), 0);
    }

  });


  Component.extend = function (protoProps, staticProps) {
    var parent = this,
        child,
        reservedMethods = {
      trigger: 1, constructor: 1, get: 1, set: 1, has: 1,
      extend: 1, escape: 1, unset: 1, clear: 1, cid: 1,
      attributes: 1, changed: 1, toJSON: 1, validationError: 1, isValid: 1,
      isNew: 1, hasChanged: 1, changedAttributes: 1, previous: 1, previousAttributes: 1
    },
        configProperties = {
      routes: 1, template: 1, defaults: 1, outlet: 1, url: 1,
      urlRoot: 1, idAttribute: 1, id: 1, createdCallback: 1, attachedCallback: 1,
      detachedCallback: 1
    };

    protoProps || (protoProps = {});
    staticProps || (staticProps = {});
    protoProps.defaults = {};
    // staticProps.services = {};

    // If given a constructor, use it, otherwise use the default one defined above
    if (protoProps && _.has(protoProps, "constructor")) {
      child = protoProps.constructor;
    } else {
      child = function () {
        return parent.apply(this, arguments);
      };
    }

    // Our class should inherit everything from its parent, defined above
    var Surrogate = function () {
      this.constructor = child;
    };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate();

    // For each property passed into our component base class
    _.each(protoProps, function (value, key, protoProps) {
      // If a configuration property, ignore it
      if (configProperties[key]) {
        return;
      }

      // If a primative or backbone type object, or computed property (function which takes no arguments and returns a value) move it to our defaults
      if (!_.isFunction(value) || value.isModel || value.isComponent || _.isFunction(value) && value.length === 0 && value.toString().indexOf("return") > -1) {
        protoProps.defaults[key] = value;
        delete protoProps[key];
      }

      // If a reserved method, yell
      if (reservedMethods[key]) {
        throw "ERROR: " + key + " is a reserved method name in " + staticProps.__name + "!";
      }

      // All other values are component methods, leave them be unless already defined.
    }, this);

    // Extend our prototype with any remaining protoProps, overriting pre-defined ones
    if (protoProps) {
      _.extend(child.prototype, protoProps, staticProps);
    }

    // Set our ancestry
    child.__super__ = parent.prototype;

    return child;
  };

  Component.register = function registerComponent(name, options) {
    var script = options.prototype;
    var template = options.template;
    var style = options.style;

    var component = this.extend(script, { __name: name });
    var proto = Object.create(HTMLElement.prototype, {});

    proto.createdCallback = function () {
      this.__component__ = new component({
        template: template,
        outlet: this,
        data: Rebound.seedData
      });
    };

    proto.attachedCallback = function () {
      script.attachedCallback && script.attachedCallback.call(this.__component__);
    };

    proto.detachedCallback = function () {
      script.detachedCallback && script.detachedCallback.call(this.__component__);
      this.__component__.deinitialize();
    };

    proto.attributeChangedCallback = function (attrName, oldVal, newVal) {
      this.__component__._onAttributeChange(attrName, oldVal, newVal);
      script.attributeChangedCallback && script.attributeChangedCallback.call(this.__component__, attrName, oldVal, newVal);
    };

    return document.registerElement(name, { prototype: proto });
  };

  _.bindAll(Component, "register");

  module.exports = Component;
});

// Commented out because tracking attribute changes and making sure they dont infinite loop is hard.
// TODO: Make work.
// try{ newVal = JSON.parse(newVal); } catch (e){ newVal = newVal; }
//
// // data attributes should be referanced by their camel case name
// attrName = attrName.replace(/^data-/g, "").replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
//
// oldVal = this.get(attrName);
//
// if(newVal === null){ this.unset(attrName); }
//
// // If oldVal is a number, and newVal is only numerical, preserve type
// if(_.isNumber(oldVal) && _.isString(newVal) && newVal.match(/^[0-9]*$/i)){
//   newVal = parseInt(newVal);
// }
//
// else{ this.set(attrName, newVal, {quiet: true}); }
define("rebound-data/collection", ["exports", "module", "rebound-data/model", "rebound-component/utils"], function (exports, module, _reboundDataModel, _reboundComponentUtils) {
  "use strict";

  // Rebound Collection
  // ----------------

  var Model = to5Runtime.interopRequire(_reboundDataModel);

  var $ = to5Runtime.interopRequire(_reboundComponentUtils);

  function pathGenerator(collection) {
    return function () {
      return collection.__path() + "[" + collection.indexOf(collection._byId[this.cid]) + "]";
    };
  }

  var Collection = Backbone.Collection.extend({

    isCollection: true,
    isData: true,

    model: this.model || Model,

    __path: function () {
      return "";
    },

    constructor: function (models, options) {
      models || (models = []);
      options || (options = {});
      this.__observers = {};
      this.helpers = {};
      this.cid = _.uniqueId("collection");

      // Set lineage
      this.setParent(options.parent || this);
      this.setRoot(options.root || this);
      this.__path = options.path || this.__path;

      Backbone.Collection.apply(this, arguments);

      // When a model is removed from its original collection, destroy it
      // TODO: Fix this. Computed properties now somehow allow collection to share a model. They may be removed from one but not the other. That is bad.
      // The clone = false options is the culprit. Find a better way to copy all of the collections custom attributes over to the clone.
      this.on("remove", function (model, collection, options) {});
    },

    get: function (key, options) {
      // If the key is a number or object, default to backbone's collection get
      if (typeof key == "number" || typeof key == "object") {
        return Backbone.Collection.prototype.get.call(this, key);
      }

      // If key is not a string, return undefined
      if (!_.isString(key)) return void 0;

      // Split the path at all '.', '[' and ']' and find the value referanced.
      var parts = $.splitPath(key),
          result = this,
          l = parts.length,
          i = 0;
      options || (options = {});

      if (_.isUndefined(key) || _.isNull(key)) return key;
      if (key === "" || parts.length === 0) return result;

      if (parts.length > 0) {
        for (i = 0; i < l; i++) {
          // If returning raw, always return the first computed property found. If undefined, you're done.
          if (result && result.isComputedProperty && options.raw) return result;
          if (result && result.isComputedProperty) result = result.value();
          if (_.isUndefined(result) || _.isNull(result)) return result;
          if (parts[i] === "@parent") result = result.__parent__;else if (result.isCollection) result = result.models[parts[i]];else if (result.isModel) result = result.attributes[parts[i]];else if (result.hasOwnProperty(parts[i])) result = result[parts[i]];
        }
      }

      if (result && result.isComputedProperty && !options.raw) result = result.value();

      return result;
    },

    set: function (models, options) {
      var newModels = [],
          lineage = {
        parent: this,
        root: this.__root__,
        path: pathGenerator(this),
        silent: true
      };
      options = options || {},

      // If no models passed, implies an empty array
      models || (models = []);

      // If models is a string, call set at that path
      if (_.isString(models)) return this.get($.splitPath(models)[0]).set($.splitPath(models).splice(1, models.length).join("."), options);
      if (!_.isObject(models)) return console.error("Collection.set must be passed a Model, Object, array or Models and Objects, or another Collection");

      // If another collection, treat like an array
      models = models.isCollection ? models.models : models;
      // Ensure models is an array
      models = !_.isArray(models) ? [models] : models;

      // If the model already exists in this collection, or we are told not to clone it, let Backbone handle the merge
      // Otherwise, create our copy of this model, give them the same cid so our helpers treat them as the same object
      _.each(models, function (data, index) {
        if (data.isModel && options.clone === false || this._byId[data.cid]) return newModels[index] = data;
        newModels[index] = new this.model(data, _.defaults(lineage, options));
        data.isModel && (newModels[index].cid = data.cid);
      }, this);

      // Ensure that this element now knows that it has children now. Without this cyclic dependancies cause issues
      this._hasAncestry || (this._hasAncestry = newModels.length > 0);

      // Call original set function with model duplicates
      return Backbone.Collection.prototype.set.call(this, newModels, options);
    }

  });

  module.exports = Collection;
});

// model.deinitialize();
define("rebound-precompiler/rebound-precompiler", ["exports", "htmlbars"], function (exports, _htmlbars) {
  "use strict";

  // Rebound Precompiler
  // ----------------

  var htmlbarsCompile = _htmlbars.compile;
  var htmlbarsCompileSpec = _htmlbars.compileSpec;


  // Remove the contents of the component's `script` tag.
  function getScript(str) {
    return str.indexOf("<script>") > -1 && str.indexOf("</script>") > -1 ? "(function(){" + str.replace(/([^]*<script>)([^]*)(<\/script>[^]*)/ig, "$2") + "})()" : "{}";
  }

  // Remove the contents of the component's `style` tag.
  function getStyle(str) {
    return str.indexOf("<style>") > -1 && str.indexOf("</style>") > -1 ? str.replace(/([^]*<style>)([^]*)(<\/style>[^]*)/ig, "$2").replace(/"/g, "\\\"") : "";
  }

  // Remove the contents of the component's `template` tag.
  function getTemplate(str) {
    return str.indexOf("<template>") > -1 && str.indexOf("</template>") > -1 ? str.replace(/[^]*<template>([^]*)<\/template>[^]*/gi, "$1").replace(/([^]*)<style>[^]*<\/style>([^]*)/ig, "$1$2") : "";
  }

  // Get the component's name from its `name` attribute.
  function getName(str) {
    return str.replace(/[^]*<element[^>]*name=(["'])?([^'">\s]+)\1[^<>]*>[^]*/ig, "$2");
  }

  // Minify the string passed in by replacing all whitespace.
  function minify(str) {
    return str.replace(/\s+/g, " ").replace(/\n|(>) (<)/g, "$1$2");
  }

  // Strip javascript comments
  function removeComments(str) {
    return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s])+\/\/(?:.*)$)/gm, "$1");
  }

  function templateFunc(fn) {
    var src = fn.toString();
    src = src.slice(src.indexOf("{") + 1, -1);
    return function (data) {
      return !data ? src : src.replace(/(\$[a-zA-Z]+)/g, function ($rep) {
        var key = $rep.slice(1);
        return data[key] || "";
      });
    };
  }

  var COMPONENT_TEMPLATE = templateFunc(function () {
    return (function () {
      return window.Rebound.registerComponent("$name", {
        prototype: $script,
        template: $template,
        style: "$style"
      });
    })();
  });

  function precompile(str, options) {
    if (!str || str.length === 0) {
      return console.error("No template provided!");
    }

    // Remove comments
    // str = removeComments(str);
    // Minify everything
    // str = minify(str);

    options = options || {};
    options.baseDest = options.baseDest || "";
    options.name = options.name || "";
    options.baseUrl = options.baseUrl || "";

    var template = str,
        style = "",
        script = "{}",
        name = "",
        isPartial = true,
        imports = [],
        partials,
        require,
        deps = [];

    // If the element tag is present
    if (str.indexOf("<element") > -1 && str.indexOf("</element>") > -1) {
      isPartial = false;

      name = getName(str);
      style = getStyle(str);
      template = getTemplate(str);
      script = getScript(str);
    }


    // Assemple our component dependancies by finding link tags and parsing their src
    var importsre = /<link [^h]*href=(['"]?)\/?([^.'"]*).html\1[^>]*>/gi,
        match;

    while ((match = importsre.exec(template)) != null) {
      imports.push(match[2]);
    }
    imports.forEach(function (importString, index) {
      deps.push("\"" + options.baseDest + importString + "\"");
    });

    // Remove link tags from template
    template = template.replace(/<link .*href=(['"]?)(.*).html\1[^>]*>/gi, "");

    // Assemble our partial dependancies
    partials = template.match(/\{\{>\s*?['"]?([^'"}\s]*)['"]?\s*?\}\}/gi);

    if (partials) {
      partials.forEach(function (partial, index) {
        deps.push("\"" + options.baseDest + partial.replace(/\{\{>[\s*]?['"]?([^'"]*)['"]?[\s*]?\}\}/gi, "$1") + "\"");
      });
    }

    // Compile
    template = "" + htmlbarsCompileSpec(template);

    // If is a partial
    if (isPartial) {
      template = "(function(){var template = " + template + "\n window.Rebound.registerPartial( \"" + options.name + "\", template);})();\n";
    }
    // Else, is a component
    else {
      template = COMPONENT_TEMPLATE({
        name: name,
        script: script,
        style: style,
        template: template
      });
    }

    // Wrap in define
    template = "define( [" + deps.join(", ") + "], function(){\n" + template + "});";

    return template;
  }

  exports.precompile = precompile;
});
define("rebound-router/rebound-router", ["exports", "module", "rebound-component/utils"], function (exports, module, _reboundComponentUtils) {
  "use strict";

  // Rebound Router
  // ----------------

  var $ = to5Runtime.interopRequire(_reboundComponentUtils);

  // If Backbone hasn't been started yet, throw error
  if (!window.Backbone) {
    throw "Backbone must be on the page for Rebound to load.";
  }

  // Clean up old page component and load routes from our new page component
  function installResources(PageApp, primaryRoute, isGlobal) {
    var oldPageName,
        pageInstance,
        container,
        router = this;

    // De-initialize the previous app before rendering a new app
    // This way we can ensure that every new page starts with a clean slate
    // This is crucial for scalability of a single page app.
    if (!isGlobal && this.current) {
      oldPageName = this.current.__name;
      // Unset Previous Application's Routes. For each route in the page app:
      _.each(this.current.__component__.routes, function (value, key) {
        var regExp = router._routeToRegExp(key).toString();

        // Remove the handler from our route object
        Backbone.history.handlers = _.filter(Backbone.history.handlers, function (obj) {
          return obj.route.toString() !== regExp;
        });

        // Delete our referance to the route's callback
        delete router["_function_" + key];
      });

      // Un-hook Event Bindings, Delete Objects
      this.current.__component__.deinitialize();

      // Disable old css if it exists
      setTimeout(function () {
        document.getElementById(oldPageName + "-css").setAttribute("disabled", true);
      }, 500);
    }

    // Load New PageApp, give it it's name so we know what css to remove when it deinitializes
    pageInstance = new PageApp();
    pageInstance.__name = primaryRoute;

    // Add to our page
    container = isGlobal ? document.querySelector(isGlobal) : document.getElementsByTagName("content")[0];
    container.innerHTML = "";
    container.appendChild(pageInstance);

    // Make sure we're back at the top of the page
    document.body.scrollTop = 0;

    // Augment ApplicationRouter with new routes from PageApp
    _.each(pageInstance.__component__.routes, function (value, key) {
      // Generate our route callback's new name
      var routeFunctionName = "_function_" + key,
          functionName;
      // Add the new callback referance on to our router
      router[routeFunctionName] = function () {
        pageInstance.__component__[value].apply(pageInstance.__component__, arguments);
      };
      // Add the route handler
      router.route(key, value, this[routeFunctionName]);
    }, this);

    var name = isGlobal ? primaryRoute : "page";
    if (!isGlobal) this.current = pageInstance;
    if (window.Rebound.services[name].isService) window.Rebound.services[name].hydrate(pageInstance.__component__);
    window.Rebound.services[name] = pageInstance.__component__;

    // Return our newly installed app
    return pageInstance;
  }

  // Fetches Pare HTML and CSS
  function fetchResources(appName, primaryRoute, isGlobal) {
    // Expecting Module Definition as 'SearchApp' Where 'Search' a Primary Route
    var jsUrl = this.config.jsPath.replace(/:route/g, primaryRoute).replace(/:app/g, appName),
        cssUrl = this.config.cssPath.replace(/:route/g, primaryRoute).replace(/:app/g, appName),
        cssLoaded = false,
        jsLoaded = false,
        cssElement = document.getElementById(appName + "-css"),
        jsElement = document.getElementById(appName + "-js"),
        router = this,
        PageApp;

    // Only Load CSS If Not Loaded Before
    if (cssElement === null) {
      cssElement = document.createElement("link");
      cssElement.setAttribute("type", "text/css");
      cssElement.setAttribute("rel", "stylesheet");
      cssElement.setAttribute("href", cssUrl);
      cssElement.setAttribute("id", appName + "-css");
      document.head.appendChild(cssElement);
      $(cssElement).on("load", function (event) {
        if ((cssLoaded = true) && jsLoaded) {
          // Install The Loaded Resources
          installResources.call(router, PageApp, appName, isGlobal);

          // Re-trigger route so the newly added route may execute if there's a route match.
          // If no routes are matched, app will hit wildCard route which will then trigger 404
          if (!isGlobal && router.config.triggerOnFirstLoad) {
            Backbone.history.loadUrl(Backbone.history.fragment);
          }
          if (!isGlobal) {
            router.config.triggerOnFirstLoad = true;
          }
          document.body.classList.remove("loading");
        }
      });
    }
    // If it has been loaded bevore, enable it
    else {
      cssElement && cssElement.removeAttribute("disabled");
      cssLoaded = true;
    }

    // If if requirejs is not on the page, load the file manually. It better contain all its dependancies.
    if (window.require._defined || _.isUndefined(window.require)) {
      jsElement = document.createElement("script");
      jsElement.setAttribute("type", "text/javascript");
      jsElement.setAttribute("src", "/" + jsUrl + ".js");
      jsElement.setAttribute("id", appName + "-js");
      document.head.appendChild(jsElement);
      $(jsElement).on("load", function (event) {
        // AMD Will Manage Dependancies For Us. Load The App.
        require([jsUrl], function (PageClass) {
          if ((jsLoaded = true) && (PageApp = PageClass) && cssLoaded) {
            // Install The Loaded Resources
            installResources.call(router, PageApp, appName, isGlobal);
            // Re-trigger route so the newly added route may execute if there's a route match.
            // If no routes are matched, app will hit wildCard route which will then trigger 404
            if (!isGlobal && router.config.triggerOnFirstLoad) {
              Backbone.history.loadUrl(Backbone.history.fragment);
            }
            if (!isGlobal) {
              router.config.triggerOnFirstLoad = true;
            }

            document.body.classList.remove("loading");
          }
        });
      });
    } else {
      // AMD Will Manage Dependancies For Us. Load The App.
      return window.require([jsUrl], function (PageClass) {
        if ((jsLoaded = true) && (PageApp = PageClass) && cssLoaded) {
          // Install The Loaded Resources
          installResources.call(router, PageApp, appName, isGlobal);
          // Re-trigger route so the newly added route may execute if there's a route match.
          // If no routes are matched, app will hit wildCard route which will then trigger 404
          if (!isGlobal && router.config.triggerOnFirstLoad) {
            Backbone.history.loadUrl(Backbone.history.fragment);
          }

          if (!isGlobal) {
            router.config.triggerOnFirstLoad = true;
          }
          document.body.classList.remove("loading");
        }
      });
    }
  }

  // Services keep track of their consumers. LazyComponent are placeholders
  // for services that haven't loaded yet. A LazyComponent mimics the api of a
  // real service/component (they are the same), and when the service finally
  // loads, its ```hydrate``` method is called. All consumers of the service will
  // have the now fully loaded service set, the LazyService will transfer all of
  // its consumers over to the fully loaded service, and then destroy itself.
  function LazyComponent() {
    this.isService = true;
    this.isComponent = true;
    this.isModel = true;
    this.attributes = {};
    this.consumers = [];
    this.set = this.on = this.off = function () {
      return 1;
    };
    this.get = function (path) {
      return path ? undefined : this;
    };
    this.hydrate = function (service) {
      _.each(this.consumers, function (consumer) {
        var component = consumer.component,
            key = consumer.key;
        if (component.attributes && component.set) component.set(key, service);
        if (component.services) component.services[key] = service;
        if (component.defaults) component.defaults[key] = service;
      });
      service.consumers = this.consumers;
      delete this.consumers;
    };
  }

  // ReboundRouter Constructor
  var ReboundRouter = Backbone.Router.extend({

    routes: {
      "*route": "wildcardRoute"
    },

    // Called when no matching routes are found. Extracts root route and fetches it resources
    wildcardRoute: function (route) {
      var appName, primaryRoute;

      // If empty route sent, route home
      route = route || "";

      // Get Root of Route
      appName = primaryRoute = route ? route.split("/")[0] : "index";

      // Find Any Custom Route Mappings
      _.any(this.config.handlers, function (handler) {
        if (handler.route.test(route)) {
          appName = handler.primaryRoute;
          return true;
        }
      });

      // If Page Is Already Loaded Then The Route Does Not Exist. 404 and Exit.
      if (this.current && this.current.name === primaryRoute) {
        return Backbone.history.loadUrl("404");
      }

      // Fetch Resources
      document.body.classList.add("loading");
      fetchResources.call(this, appName, primaryRoute);
    },

    // On startup, save our config object and start the router
    initialize: function (options) {
      // Save our config referance
      this.config = options.config;
      this.config.handlers = [];

      var remoteUrl = /^([a-z]+:)|^(\/\/)|^([^\/]+\.)/,
          router = this;

      // Convert our routeMappings to regexps and push to our handlers
      _.each(this.config.routeMapping, function (value, route) {
        if (!_.isRegExp(route)) route = router._routeToRegExp(route);
        router.config.handlers.unshift({ route: route, primaryRoute: value });
      }, this);

      // Navigate to route for any link with a relative href
      $(document).on("click", "a", function (e) {
        var path = e.target.getAttribute("href");

        // If path is not an remote url, ends in .[a-z], or blank, try and navigate to that route.
        if (path && path !== "#" && !remoteUrl.test(path)) {
          e.preventDefault();
          if (path !== "/" + Backbone.history.fragment) $(document).unMarkLinks();
          router.navigate(path, { trigger: true });
        }
      });

      Backbone.history.on("route", function (route, params) {
        $(document).markLinks();
      });

      Rebound.services.page = new LazyComponent();

      // Install our global components
      _.each(this.config.services, function (selector, route) {
        Rebound.services[route] = new LazyComponent();
        fetchResources.call(router, route, route, selector);
      });

      // Let all of our components always have referance to our router
      Rebound.Component.prototype.router = this;

      // Start the history
      Backbone.history.start({
        pushState: true,
        root: this.config.root
      });
    }
  });

  module.exports = ReboundRouter;
});
define("runtime", ["exports", "module", "rebound-component/utils", "rebound-component/helpers", "rebound-data/rebound-data", "rebound-component/component", "rebound-router/rebound-router"], function (exports, module, _reboundComponentUtils, _reboundComponentHelpers, _reboundDataReboundData, _reboundComponentComponent, _reboundRouterReboundRouter) {
  "use strict";

  //     Rebound.js 0.0.60

  //     (c) 2015 Adam Miller
  //     Rebound may be freely distributed under the MIT license.
  //     For all details and documentation:
  //     http://reboundjs.com

  // Rebound Runtime
  // ----------------

  // If Backbone isn't preset on the page yet, or if `window.Rebound` is already
  // in use, throw an error
  if (!window.Backbone) throw "Backbone must be on the page for Rebound to load.";
  if (!window.Rebound) throw "Global Rebound namespace already taken.";

  // Load our **Utils**, helper environment, **Rebound Data**,
  // **Rebound Components** and the **Rebound Router**
  var utils = to5Runtime.interopRequire(_reboundComponentUtils);

  var helpers = to5Runtime.interopRequire(_reboundComponentHelpers);

  var Model = _reboundDataReboundData.Model;
  var Collection = _reboundDataReboundData.Collection;
  var ComputedProperty = _reboundDataReboundData.ComputedProperty;
  var Component = to5Runtime.interopRequire(_reboundComponentComponent);

  var Router = to5Runtime.interopRequire(_reboundRouterReboundRouter);

  // If Backbone doesn't have an ajax method from an external DOM library, use ours
  window.Backbone.ajax = window.Backbone.$ && window.Backbone.$.ajax && window.Backbone.ajax || utils.ajax;

  // Fetch Rebound's Config Object from Rebound's `script` tag
  var Config = document.getElementById("Rebound").innerHTML;

  // Create Global Rebound Object
  window.Rebound = {
    services: {},
    registerHelper: helpers.registerHelper,
    registerPartial: helpers.registerPartial,
    registerComponent: Component.register,
    Model: Model,
    Collection: Collection,
    ComputedProperty: ComputedProperty,
    Component: Component
  };

  // Start the router if a config object is preset
  if (Config) window.Rebound.router = new Router({ config: JSON.parse(Config) });

  module.exports = Rebound;
});
define("rebound-compiler/rebound-compiler", ["exports", "htmlbars-compiler/compiler", "htmlbars-util/object-utils", "dom-helper", "rebound-component/helpers", "rebound-component/hooks"], function (exports, _htmlbarsCompilerCompiler, _htmlbarsUtilObjectUtils, _domHelper, _reboundComponentHelpers, _reboundComponentHooks) {
  "use strict";

  // Rebound Compiler
  // ----------------

  var htmlbarsCompile = _htmlbarsCompilerCompiler.compile;
  var htmlbarsCompileSpec = _htmlbarsCompilerCompiler.compileSpec;
  var merge = _htmlbarsUtilObjectUtils.merge;
  var DOMHelper = to5Runtime.interopRequire(_domHelper);

  var helpers = to5Runtime.interopRequire(_reboundComponentHelpers);

  var hooks = to5Runtime.interopRequire(_reboundComponentHooks);

  function compile(string, options) {
    // Ensure we have a well-formed object as var options
    options = options || {};
    options.helpers = options.helpers || {};
    options.hooks = options.hooks || {};

    // Merge our default helpers with user provided helpers
    options.helpers = merge(helpers, options.helpers);
    options.hooks = merge(hooks, options.hooks);

    // Compile our template function
    var func = htmlbarsCompile(string, {
      helpers: options.helpers,
      hooks: options.hooks
    });

    func._render = func.render;

    // Return a wrapper function that will merge user provided helpers with our defaults
    func.render = function (data, env, context) {
      // Ensure we have a well-formed object as var options
      env = env || {};
      env.helpers = env.helpers || {};
      env.hooks = env.hooks || {};
      env.dom = env.dom || new DOMHelper();

      // Merge our default helpers and hooks with user provided helpers
      env.helpers = merge(helpers, env.helpers);
      env.hooks = merge(hooks, env.hooks);

      // Set a default context if it doesn't exist
      context = context || document.body;

      // Call our func with merged helpers and hooks
      return func._render(data, env, context);
    };

    helpers.registerPartial(options.name, func);

    return func;
  }

  exports.compile = compile;
});
define("property-compiler/tokenizer", ["exports", "module"], function (exports, module) {
  "use strict";

  /*jshint -W054 */
  // jshint ignore: start

  // A second optional argument can be given to further configure
  // the parser process. These options are recognized:

  var exports = {};

  var options, input, inputLen, sourceFile;

  var defaultOptions = exports.defaultOptions = {
    // `ecmaVersion` indicates the ECMAScript version to parse. Must
    // be either 3, or 5, or 6. This influences support for strict
    // mode, the set of reserved words, support for getters and
    // setters and other features. ES6 support is only partial.
    ecmaVersion: 5,
    // Turn on `strictSemicolons` to prevent the parser from doing
    // automatic semicolon insertion.
    strictSemicolons: false,
    // When `allowTrailingCommas` is false, the parser will not allow
    // trailing commas in array and object literals.
    allowTrailingCommas: true,
    // By default, reserved words are not enforced. Enable
    // `forbidReserved` to enforce them. When this option has the
    // value "everywhere", reserved words and keywords can also not be
    // used as property names.
    forbidReserved: false,
    // When enabled, a return at the top level is not considered an
    // error.
    allowReturnOutsideFunction: false,
    // When `locations` is on, `loc` properties holding objects with
    // `start` and `end` properties in `{line, column}` form (with
    // line being 1-based and column 0-based) will be attached to the
    // nodes.
    locations: false,
    // A function can be passed as `onComment` option, which will
    // cause Acorn to call that function with `(block, text, start,
    // end)` parameters whenever a comment is skipped. `block` is a
    // boolean indicating whether this is a block (`/* */`) comment,
    // `text` is the content of the comment, and `start` and `end` are
    // character offsets that denote the start and end of the comment.
    // When the `locations` option is on, two more parameters are
    // passed, the full `{line, column}` locations of the start and
    // end of the comments. Note that you are not allowed to call the
    // parser from the callback—that will corrupt its internal state.
    onComment: null,
    // Nodes have their start and end characters offsets recorded in
    // `start` and `end` properties (directly on the node, rather than
    // the `loc` object, which holds line/column data. To also add a
    // [semi-standardized][range] `range` property holding a `[start,
    // end]` array with the same numbers, set the `ranges` option to
    // `true`.
    //
    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
    ranges: false,
    // It is possible to parse multiple files into a single AST by
    // passing the tree produced by parsing the first file as
    // `program` option in subsequent parses. This will add the
    // toplevel forms of the parsed file to the `Program` (top) node
    // of an existing parse tree.
    program: null,
    // When `locations` is on, you can pass this to record the source
    // file in every node's `loc` object.
    sourceFile: null,
    // This value, if given, is stored in every node, whether
    // `locations` is on or off.
    directSourceFile: null
  };

  function setOptions(opts) {
    options = opts || {};
    for (var opt in defaultOptions) if (!Object.prototype.hasOwnProperty.call(options, opt)) options[opt] = defaultOptions[opt];
    sourceFile = options.sourceFile || null;

    isKeyword = options.ecmaVersion >= 6 ? isEcma6Keyword : isEcma5AndLessKeyword;
  }

  // The `getLineInfo` function is mostly useful when the
  // `locations` option is off (for performance reasons) and you
  // want to find the line/column position for a given character
  // offset. `input` should be the code string that the offset refers
  // into.

  var getLineInfo = exports.getLineInfo = function (input, offset) {
    for (var line = 1, cur = 0;;) {
      lineBreak.lastIndex = cur;
      var match = lineBreak.exec(input);
      if (match && match.index < offset) {
        ++line;
        cur = match.index + match[0].length;
      } else break;
    }
    return { line: line, column: offset - cur };
  };

  // Acorn is organized as a tokenizer and a recursive-descent parser.
  // The `tokenize` export provides an interface to the tokenizer.
  // Because the tokenizer is optimized for being efficiently used by
  // the Acorn parser itself, this interface is somewhat crude and not
  // very modular. Performing another parse or call to `tokenize` will
  // reset the internal state, and invalidate existing tokenizers.

  exports.tokenize = function (inpt, opts) {
    var getToken = function (forceRegexp) {
      lastEnd = tokEnd;
      readToken(forceRegexp);
      t.start = tokStart;t.end = tokEnd;
      t.startLoc = tokStartLoc;t.endLoc = tokEndLoc;
      t.type = tokType;t.value = tokVal;
      return t;
    };

    input = String(inpt);inputLen = input.length;
    setOptions(opts);
    initTokenState();

    var t = {};
    getToken.jumpTo = function (pos, reAllowed) {
      tokPos = pos;
      if (options.locations) {
        tokCurLine = 1;
        tokLineStart = lineBreak.lastIndex = 0;
        var match;
        while ((match = lineBreak.exec(input)) && match.index < pos) {
          ++tokCurLine;
          tokLineStart = match.index + match[0].length;
        }
      }
      tokRegexpAllowed = reAllowed;
      skipSpace();
    };
    return getToken;
  };

  // State is kept in (closure-)global variables. We already saw the
  // `options`, `input`, and `inputLen` variables above.

  // The current position of the tokenizer in the input.

  var tokPos;

  // The start and end offsets of the current token.

  var tokStart, tokEnd;

  // When `options.locations` is true, these hold objects
  // containing the tokens start and end line/column pairs.

  var tokStartLoc, tokEndLoc;

  // The type and value of the current token. Token types are objects,
  // named by variables against which they can be compared, and
  // holding properties that describe them (indicating, for example,
  // the precedence of an infix operator, and the original name of a
  // keyword token). The kind of value that's held in `tokVal` depends
  // on the type of the token. For literals, it is the literal value,
  // for operators, the operator name, and so on.

  var tokType, tokVal;

  // Interal state for the tokenizer. To distinguish between division
  // operators and regular expressions, it remembers whether the last
  // token was one that is allowed to be followed by an expression.
  // (If it is, a slash is probably a regexp, if it isn't it's a
  // division operator. See the `parseStatement` function for a
  // caveat.)

  var tokRegexpAllowed;

  // When `options.locations` is true, these are used to keep
  // track of the current line, and know when a new line has been
  // entered.

  var tokCurLine, tokLineStart;

  // These store the position of the previous token, which is useful
  // when finishing a node and assigning its `end` position.

  var lastStart, lastEnd, lastEndLoc;

  // This is the parser's state. `inFunction` is used to reject
  // `return` statements outside of functions, `labels` to verify that
  // `break` and `continue` have somewhere to jump to, and `strict`
  // indicates whether strict mode is on.

  var inFunction, labels, strict;

  // This function is used to raise exceptions on parse errors. It
  // takes an offset integer (into the current `input`) to indicate
  // the location of the error, attaches the position to the end
  // of the error message, and then raises a `SyntaxError` with that
  // message.

  function raise(pos, message) {
    var loc = getLineInfo(input, pos);
    message += " (" + loc.line + ":" + loc.column + ")";
    var err = new SyntaxError(message);
    err.pos = pos;err.loc = loc;err.raisedAt = tokPos;
    throw err;
  }

  // Reused empty array added for node fields that are always empty.

  var empty = [];

  // ## Token types

  // The assignment of fine-grained, information-carrying type objects
  // allows the tokenizer to store the information it has about a
  // token in a way that is very cheap for the parser to look up.

  // All token type variables start with an underscore, to make them
  // easy to recognize.

  // These are the general types. The `type` property is only used to
  // make them recognizeable when debugging.

  var _num = { type: "num" },
      _regexp = { type: "regexp" },
      _string = { type: "string" };
  var _name = { type: "name" },
      _eof = { type: "eof" };

  // Keyword tokens. The `keyword` property (also used in keyword-like
  // operators) indicates that the token originated from an
  // identifier-like word, which is used when parsing property names.
  //
  // The `beforeExpr` property is used to disambiguate between regular
  // expressions and divisions. It is set on all token types that can
  // be followed by an expression (thus, a slash after them would be a
  // regular expression).
  //
  // `isLoop` marks a keyword as starting a loop, which is important
  // to know when parsing a label, in order to allow or disallow
  // continue jumps to that label.

  var _break = { keyword: "break" },
      _case = { keyword: "case", beforeExpr: true },
      _catch = { keyword: "catch" };
  var _continue = { keyword: "continue" },
      _debugger = { keyword: "debugger" },
      _default = { keyword: "default" };
  var _do = { keyword: "do", isLoop: true },
      _else = { keyword: "else", beforeExpr: true };
  var _finally = { keyword: "finally" },
      _for = { keyword: "for", isLoop: true },
      _function = { keyword: "function" };
  var _if = { keyword: "if" },
      _return = { keyword: "return", beforeExpr: true },
      _switch = { keyword: "switch" };
  var _throw = { keyword: "throw", beforeExpr: true },
      _try = { keyword: "try" },
      _var = { keyword: "var" };
  var _let = { keyword: "let" },
      _const = { keyword: "const" };
  var _while = { keyword: "while", isLoop: true },
      _with = { keyword: "with" },
      _new = { keyword: "new", beforeExpr: true };
  var _this = { keyword: "this" };

  // The keywords that denote values.

  var _null = { keyword: "null", atomValue: null },
      _true = { keyword: "true", atomValue: true };
  var _false = { keyword: "false", atomValue: false };

  // Some keywords are treated as regular operators. `in` sometimes
  // (when parsing `for`) needs to be tested against specifically, so
  // we assign a variable name to it for quick comparing.

  var _in = { keyword: "in", binop: 7, beforeExpr: true };

  // Map keyword names to token types.

  var keywordTypes = { "break": _break, "case": _case, "catch": _catch,
    "continue": _continue, "debugger": _debugger, "default": _default,
    "do": _do, "else": _else, "finally": _finally, "for": _for,
    "function": _function, "if": _if, "return": _return, "switch": _switch,
    "throw": _throw, "try": _try, "var": _var, "let": _let, "const": _const,
    "while": _while, "with": _with,
    "null": _null, "true": _true, "false": _false, "new": _new, "in": _in,
    "instanceof": { keyword: "instanceof", binop: 7, beforeExpr: true }, "this": _this,
    "typeof": { keyword: "typeof", prefix: true, beforeExpr: true },
    "void": { keyword: "void", prefix: true, beforeExpr: true },
    "delete": { keyword: "delete", prefix: true, beforeExpr: true } };

  // Punctuation token types. Again, the `type` property is purely for debugging.

  var _bracketL = { type: "[", beforeExpr: true },
      _bracketR = { type: "]" },
      _braceL = { type: "{", beforeExpr: true };
  var _braceR = { type: "}" },
      _parenL = { type: "(", beforeExpr: true },
      _parenR = { type: ")" };
  var _comma = { type: ",", beforeExpr: true },
      _semi = { type: ";", beforeExpr: true };
  var _colon = { type: ":", beforeExpr: true },
      _dot = { type: "." },
      _ellipsis = { type: "..." },
      _question = { type: "?", beforeExpr: true };

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator. `isUpdate` specifies that the node produced by
  // the operator should be of type UpdateExpression rather than
  // simply UnaryExpression (`++` and `--`).
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  var _slash = { binop: 10, beforeExpr: true },
      _eq = { isAssign: true, beforeExpr: true };
  var _assign = { isAssign: true, beforeExpr: true };
  var _incDec = { postfix: true, prefix: true, isUpdate: true },
      _prefix = { prefix: true, beforeExpr: true };
  var _logicalOR = { binop: 1, beforeExpr: true };
  var _logicalAND = { binop: 2, beforeExpr: true };
  var _bitwiseOR = { binop: 3, beforeExpr: true };
  var _bitwiseXOR = { binop: 4, beforeExpr: true };
  var _bitwiseAND = { binop: 5, beforeExpr: true };
  var _equality = { binop: 6, beforeExpr: true };
  var _relational = { binop: 7, beforeExpr: true };
  var _bitShift = { binop: 8, beforeExpr: true };
  var _plusMin = { binop: 9, prefix: true, beforeExpr: true };
  var _multiplyModulo = { binop: 10, beforeExpr: true };

  // Provide access to the token types for external users of the
  // tokenizer.

  exports.tokTypes = { bracketL: _bracketL, bracketR: _bracketR, braceL: _braceL, braceR: _braceR,
    parenL: _parenL, parenR: _parenR, comma: _comma, semi: _semi, colon: _colon,
    dot: _dot, ellipsis: _ellipsis, question: _question, slash: _slash, eq: _eq,
    name: _name, eof: _eof, num: _num, regexp: _regexp, string: _string };
  for (var kw in keywordTypes) exports.tokTypes["_" + kw] = keywordTypes[kw];

  // This is a trick taken from Esprima. It turns out that, on
  // non-Chrome browsers, to check whether a string is in a set, a
  // predicate containing a big ugly `switch` statement is faster than
  // a regular expression, and on Chrome the two are about on par.
  // This function uses `eval` (non-lexical) to produce such a
  // predicate from a space-separated string of words.
  //
  // It starts by sorting the words by length.

  function makePredicate(words) {
    var compareTo = function (arr) {
      if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
      f += "switch(str){";
      for (var i = 0; i < arr.length; ++i) f += "case " + JSON.stringify(arr[i]) + ":";
      f += "return true}return false;";
    };

    words = words.split(" ");
    var f = "",
        cats = [];
    out: for (var i = 0; i < words.length; ++i) {
      for (var j = 0; j < cats.length; ++j) if (cats[j][0].length == words[i].length) {
        cats[j].push(words[i]);
        continue out;
      }
      cats.push([words[i]]);
    }


    // When there are more than three length categories, an outer
    // switch first dispatches on the lengths, to save on comparisons.

    if (cats.length > 3) {
      cats.sort(function (a, b) {
        return b.length - a.length;
      });
      f += "switch(str.length){";
      for (var i = 0; i < cats.length; ++i) {
        var cat = cats[i];
        f += "case " + cat[0].length + ":";
        compareTo(cat);
      }
      f += "}";

      // Otherwise, simply generate a flat `switch` statement.
    } else {
      compareTo(words);
    }
    return new Function("str", f);
  }

  // The ECMAScript 3 reserved word list.

  var isReservedWord3 = makePredicate("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile");

  // ECMAScript 5 reserved words.

  var isReservedWord5 = makePredicate("class enum extends super const export import");

  // The additional reserved words in strict mode.

  var isStrictReservedWord = makePredicate("implements interface let package private protected public static yield");

  // The forbidden variable names in strict mode.

  var isStrictBadIdWord = makePredicate("eval arguments");

  // And the keywords.

  var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

  var isEcma5AndLessKeyword = makePredicate(ecma5AndLessKeywords);

  var isEcma6Keyword = makePredicate(ecma5AndLessKeywords + " let const");

  var isKeyword = isEcma5AndLessKeyword;

  // ## Character categories

  // Big ugly regular expressions that match characters in the
  // whitespace, identifier, and identifier-start categories. These
  // are only applied when a character is found to actually have a
  // code point above 128.

  var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
  var nonASCIIidentifierStartChars = "ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԧԱ-Ֆՙա-ևא-תװ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠࢢ-ࢬऄ-हऽॐक़-ॡॱ-ॷॹ-ॿঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-ళవ-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡೱೲഅ-ഌഎ-ഐഒ-ഺഽൎൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛰᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤜᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᳵᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕℙ-ℝℤΩℨK-ℭℯ-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞⸯ々-〇〡-〩〱-〵〸-〼ぁ-ゖゝ-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚗꚠ-ꛯꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞓꞠ-Ɦꟸ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꪀ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ";
  var nonASCIIidentifierChars = "̀-ͯ҃-֑҇-ׇֽֿׁׂׅׄؐ-ؚؠ-ىٲ-ۓۧ-ۨۻ-ۼܰ-݊ࠀ-ࠔࠛ-ࠣࠥ-ࠧࠩ-࠭ࡀ-ࡗࣤ-ࣾऀ-ःऺ-़ा-ॏ॑-ॗॢ-ॣ०-९ঁ-ঃ়া-ৄেৈৗয়-ৠਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑ੦-ੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢ-ૣ૦-૯ଁ-ଃ଼ା-ୄେୈୋ-୍ୖୗୟ-ୠ୦-୯ஂா-ூெ-ைொ-்ௗ௦-௯ఁ-ఃె-ైొ-్ౕౖౢ-ౣ౦-౯ಂಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢ-ೣ೦-೯ംഃെ-ൈൗൢ-ൣ൦-൯ංඃ්ා-ුූෘ-ෟෲෳิ-ฺเ-ๅ๐-๙ິ-ູ່-ໍ໐-໙༘༙༠-༩༹༵༷ཁ-ཇཱ-྄྆-྇ྍ-ྗྙ-ྼ࿆က-ဩ၀-၉ၧ-ၭၱ-ၴႂ-ႍႏ-ႝ፝-፟ᜎ-ᜐᜠ-ᜰᝀ-ᝐᝲᝳក-ឲ៝០-៩᠋-᠍᠐-᠙ᤠ-ᤫᤰ-᤻ᥑ-ᥭᦰ-ᧀᧈ-ᧉ᧐-᧙ᨀ-ᨕᨠ-ᩓ᩠-᩿᩼-᪉᪐-᪙ᭆ-ᭋ᭐-᭙᭫-᭳᮰-᮹᯦-᯳ᰀ-ᰢ᱀-᱉ᱛ-ᱽ᳐-᳒ᴀ-ᶾḁ-ἕ‌‍‿⁀⁔⃐-⃥⃜⃡-⃰ⶁ-ⶖⷠ-ⷿ〡-〨゙゚Ꙁ-ꙭꙴ-꙽ꚟ꛰-꛱ꟸ-ꠀ꠆ꠋꠣ-ꠧꢀ-ꢁꢴ-꣄꣐-꣙ꣳ-ꣷ꤀-꤉ꤦ-꤭ꤰ-ꥅꦀ-ꦃ꦳-꧀ꨀ-ꨧꩀ-ꩁꩌ-ꩍ꩐-꩙ꩻꫠ-ꫩꫲ-ꫳꯀ-ꯡ꯬꯭꯰-꯹ﬠ-ﬨ︀-️︠-︦︳︴﹍-﹏０-９＿";
  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

  // Whether a single character denotes a newline.

  var newline = /[\n\r\u2028\u2029]/;

  // Matches a whole line break (where CRLF is considered a single
  // line break). Used to count lines.

  var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;

  // Test whether a given character code starts an identifier.

  var isIdentifierStart = exports.isIdentifierStart = function (code) {
    if (code < 65) return code === 36;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123) return true;
    return code >= 170 && nonASCIIidentifierStart.test(String.fromCharCode(code));
  };

  // Test whether a given character is part of an identifier.

  var isIdentifierChar = exports.isIdentifierChar = function (code) {
    if (code < 48) return code === 36;
    if (code < 58) return true;
    if (code < 65) return false;
    if (code < 91) return true;
    if (code < 97) return code === 95;
    if (code < 123) return true;
    return code >= 170 && nonASCIIidentifier.test(String.fromCharCode(code));
  };

  // ## Tokenizer

  // These are used when `options.locations` is on, for the
  // `tokStartLoc` and `tokEndLoc` properties.

  function Position() {
    this.line = tokCurLine;
    this.column = tokPos - tokLineStart;
  }

  // Reset the token state. Used at the start of a parse.

  function initTokenState() {
    tokCurLine = 1;
    tokPos = tokLineStart = 0;
    tokRegexpAllowed = true;
    skipSpace();
  }

  // Called at the end of every token. Sets `tokEnd`, `tokVal`, and
  // `tokRegexpAllowed`, and skips the space after the token, so that
  // the next one's `tokStart` will point at the right position.

  function finishToken(type, val) {
    tokEnd = tokPos;
    if (options.locations) tokEndLoc = new Position();
    tokType = type;
    skipSpace();
    tokVal = val;
    tokRegexpAllowed = type.beforeExpr;
  }

  function skipBlockComment() {
    var startLoc = options.onComment && options.locations && new Position();
    var start = tokPos,
        end = input.indexOf("*/", tokPos += 2);
    if (end === -1) raise(tokPos - 2, "Unterminated comment");
    tokPos = end + 2;
    if (options.locations) {
      lineBreak.lastIndex = start;
      var match;
      while ((match = lineBreak.exec(input)) && match.index < tokPos) {
        ++tokCurLine;
        tokLineStart = match.index + match[0].length;
      }
    }
    if (options.onComment) options.onComment(true, input.slice(start + 2, end), start, tokPos, startLoc, options.locations && new Position());
  }

  function skipLineComment() {
    var start = tokPos;
    var startLoc = options.onComment && options.locations && new Position();
    var ch = input.charCodeAt(tokPos += 2);
    while (tokPos < inputLen && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
      ++tokPos;
      ch = input.charCodeAt(tokPos);
    }
    if (options.onComment) options.onComment(false, input.slice(start + 2, tokPos), start, tokPos, startLoc, options.locations && new Position());
  }

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  function skipSpace() {
    while (tokPos < inputLen) {
      var ch = input.charCodeAt(tokPos);
      if (ch === 32) {
        // ' '
        ++tokPos;
      } else if (ch === 13) {
        ++tokPos;
        var next = input.charCodeAt(tokPos);
        if (next === 10) {
          ++tokPos;
        }
        if (options.locations) {
          ++tokCurLine;
          tokLineStart = tokPos;
        }
      } else if (ch === 10 || ch === 8232 || ch === 8233) {
        ++tokPos;
        if (options.locations) {
          ++tokCurLine;
          tokLineStart = tokPos;
        }
      } else if (ch > 8 && ch < 14) {
        ++tokPos;
      } else if (ch === 47) {
        // '/'
        var next = input.charCodeAt(tokPos + 1);
        if (next === 42) {
          // '*'
          skipBlockComment();
        } else if (next === 47) {
          // '/'
          skipLineComment();
        } else break;
      } else if (ch === 160) {
        // '\xa0'
        ++tokPos;
      } else if (ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
        ++tokPos;
      } else {
        break;
      }
    }
  }

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //
  // The `forceRegexp` parameter is used in the one case where the
  // `tokRegexpAllowed` trick does not work. See `parseStatement`.

  function readToken_dot() {
    var next = input.charCodeAt(tokPos + 1);
    if (next >= 48 && next <= 57) return readNumber(true);
    var next2 = input.charCodeAt(tokPos + 2);
    if (options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
      // 46 = dot '.'
      tokPos += 3;
      return finishToken(_ellipsis);
    } else {
      ++tokPos;
      return finishToken(_dot);
    }
  }

  function readToken_slash() {
    // '/'
    var next = input.charCodeAt(tokPos + 1);
    if (tokRegexpAllowed) {
      ++tokPos;return readRegexp();
    }
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_slash, 1);
  }

  function readToken_mult_modulo() {
    // '%*'
    var next = input.charCodeAt(tokPos + 1);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_multiplyModulo, 1);
  }

  function readToken_pipe_amp(code) {
    // '|&'
    var next = input.charCodeAt(tokPos + 1);
    if (next === code) return finishOp(code === 124 ? _logicalOR : _logicalAND, 2);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(code === 124 ? _bitwiseOR : _bitwiseAND, 1);
  }

  function readToken_caret() {
    // '^'
    var next = input.charCodeAt(tokPos + 1);
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_bitwiseXOR, 1);
  }

  function readToken_plus_min(code) {
    // '+-'
    var next = input.charCodeAt(tokPos + 1);
    if (next === code) {
      if (next == 45 && input.charCodeAt(tokPos + 2) == 62 && newline.test(input.slice(lastEnd, tokPos))) {
        // A `-->` line comment
        tokPos += 3;
        skipLineComment();
        skipSpace();
        return readToken();
      }
      return finishOp(_incDec, 2);
    }
    if (next === 61) return finishOp(_assign, 2);
    return finishOp(_plusMin, 1);
  }

  function readToken_lt_gt(code) {
    // '<>'
    var next = input.charCodeAt(tokPos + 1);
    var size = 1;
    if (next === code) {
      size = code === 62 && input.charCodeAt(tokPos + 2) === 62 ? 3 : 2;
      if (input.charCodeAt(tokPos + size) === 61) return finishOp(_assign, size + 1);
      return finishOp(_bitShift, size);
    }
    if (next == 33 && code == 60 && input.charCodeAt(tokPos + 2) == 45 && input.charCodeAt(tokPos + 3) == 45) {
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      tokPos += 4;
      skipLineComment();
      skipSpace();
      return readToken();
    }
    if (next === 61) size = input.charCodeAt(tokPos + 2) === 61 ? 3 : 2;
    return finishOp(_relational, size);
  }

  function readToken_eq_excl(code) {
    // '=!'
    var next = input.charCodeAt(tokPos + 1);
    if (next === 61) return finishOp(_equality, input.charCodeAt(tokPos + 2) === 61 ? 3 : 2);
    return finishOp(code === 61 ? _eq : _prefix, 1);
  }

  function getTokenFromCode(code) {
    switch (code) {
      // The interpretation of a dot depends on whether it is followed
      // by a digit or another two dots.
      case 46:
        // '.'
        return readToken_dot();

      // Punctuation tokens.
      case 40:
        ++tokPos;return finishToken(_parenL);
      case 41:
        ++tokPos;return finishToken(_parenR);
      case 59:
        ++tokPos;return finishToken(_semi);
      case 44:
        ++tokPos;return finishToken(_comma);
      case 91:
        ++tokPos;return finishToken(_bracketL);
      case 93:
        ++tokPos;return finishToken(_bracketR);
      case 123:
        ++tokPos;return finishToken(_braceL);
      case 125:
        ++tokPos;return finishToken(_braceR);
      case 58:
        ++tokPos;return finishToken(_colon);
      case 63:
        ++tokPos;return finishToken(_question);

      // '0x' is a hexadecimal number.
      case 48:
        // '0'
        var next = input.charCodeAt(tokPos + 1);
        if (next === 120 || next === 88) return readHexNumber();
      // Anything else beginning with a digit is an integer, octal
      // number, or float.
      /* falls through */
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        // 1-9
        return readNumber(false);

      // Quotes produce strings.
      case 34:
      case 39:
        // '"', "'"
        return readString(code);

      // Operators are parsed inline in tiny state machines. '=' (61) is
      // often referred to. `finishOp` simply skips the amount of
      // characters it is given as second argument, and returns a token
      // of the type given by its first argument.

      case 47:
        // '/'
        return readToken_slash();

      case 37:
      case 42:
        // '%*'
        return readToken_mult_modulo();

      case 124:
      case 38:
        // '|&'
        return readToken_pipe_amp(code);

      case 94:
        // '^'
        return readToken_caret();

      case 43:
      case 45:
        // '+-'
        return readToken_plus_min(code);

      case 60:
      case 62:
        // '<>'
        return readToken_lt_gt(code);

      case 61:
      case 33:
        // '=!'
        return readToken_eq_excl(code);

      case 126:
        // '~'
        return finishOp(_prefix, 1);
    }

    return false;
  }

  function readToken(forceRegexp) {
    if (!forceRegexp) tokStart = tokPos;else tokPos = tokStart + 1;
    if (options.locations) tokStartLoc = new Position();
    if (forceRegexp) return readRegexp();
    if (tokPos >= inputLen) return finishToken(_eof);

    var code = input.charCodeAt(tokPos);
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code) || code === 92 /* '\' */) return readWord();

    var tok = getTokenFromCode(code);

    if (tok === false) {
      // If we are here, we either found a non-ASCII identifier
      // character, or something that's entirely disallowed.
      var ch = String.fromCharCode(code);
      if (ch === "\\" || nonASCIIidentifierStart.test(ch)) return readWord();
      raise(tokPos, "Unexpected character '" + ch + "'");
    }
    return tok;
  }

  function finishOp(type, size) {
    var str = input.slice(tokPos, tokPos + size);
    tokPos += size;
    finishToken(type, str);
  }

  // Parse a regular expression. Some context-awareness is necessary,
  // since a '/' inside a '[]' set does not end the expression.

  function readRegexp() {
    var content = "",
        escaped,
        inClass,
        start = tokPos;
    for (;;) {
      if (tokPos >= inputLen) raise(start, "Unterminated regular expression");
      var ch = input.charAt(tokPos);
      if (newline.test(ch)) raise(start, "Unterminated regular expression");
      if (!escaped) {
        if (ch === "[") inClass = true;else if (ch === "]" && inClass) inClass = false;else if (ch === "/" && !inClass) break;
        escaped = ch === "\\";
      } else escaped = false;
      ++tokPos;
    }
    var content = input.slice(start, tokPos);
    ++tokPos;
    // Need to use `readWord1` because '\uXXXX' sequences are allowed
    // here (don't ask).
    var mods = readWord1();
    if (mods && !/^[gmsiy]*$/.test(mods)) raise(start, "Invalid regular expression flag");
    try {
      var value = new RegExp(content, mods);
    } catch (e) {
      if (e instanceof SyntaxError) raise(start, "Error parsing regular expression: " + e.message);
      raise(e);
    }
    return finishToken(_regexp, value);
  }

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  function readInt(radix, len) {
    var start = tokPos,
        total = 0;
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      var code = input.charCodeAt(tokPos),
          val;
      if (code >= 97) val = code - 97 + 10; // a
      else if (code >= 65) val = code - 65 + 10; // A
      else if (code >= 48 && code <= 57) val = code - 48; // 0-9
      else val = Infinity;
      if (val >= radix) break;
      ++tokPos;
      total = total * radix + val;
    }
    if (tokPos === start || len != null && tokPos - start !== len) return null;

    return total;
  }

  function readHexNumber() {
    tokPos += 2; // 0x
    var val = readInt(16);
    if (val == null) raise(tokStart + 2, "Expected hexadecimal number");
    if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");
    return finishToken(_num, val);
  }

  // Read an integer, octal integer, or floating-point number.

  function readNumber(startsWithDot) {
    var start = tokPos,
        isFloat = false,
        octal = input.charCodeAt(tokPos) === 48;
    if (!startsWithDot && readInt(10) === null) raise(start, "Invalid number");
    if (input.charCodeAt(tokPos) === 46) {
      ++tokPos;
      readInt(10);
      isFloat = true;
    }
    var next = input.charCodeAt(tokPos);
    if (next === 69 || next === 101) {
      // 'eE'
      next = input.charCodeAt(++tokPos);
      if (next === 43 || next === 45) ++tokPos; // '+-'
      if (readInt(10) === null) raise(start, "Invalid number");
      isFloat = true;
    }
    if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");

    var str = input.slice(start, tokPos),
        val;
    if (isFloat) val = parseFloat(str);else if (!octal || str.length === 1) val = parseInt(str, 10);else if (/[89]/.test(str) || strict) raise(start, "Invalid number");else val = parseInt(str, 8);
    return finishToken(_num, val);
  }

  // Read a string value, interpreting backslash-escapes.

  function readString(quote) {
    tokPos++;
    var out = "";
    for (;;) {
      if (tokPos >= inputLen) raise(tokStart, "Unterminated string constant");
      var ch = input.charCodeAt(tokPos);
      if (ch === quote) {
        ++tokPos;
        return finishToken(_string, out);
      }
      if (ch === 92) {
        // '\'
        ch = input.charCodeAt(++tokPos);
        var octal = /^[0-7]+/.exec(input.slice(tokPos, tokPos + 3));
        if (octal) octal = octal[0];
        while (octal && parseInt(octal, 8) > 255) octal = octal.slice(0, -1);
        if (octal === "0") octal = null;
        ++tokPos;
        if (octal) {
          if (strict) raise(tokPos - 2, "Octal literal in strict mode");
          out += String.fromCharCode(parseInt(octal, 8));
          tokPos += octal.length - 1;
        } else {
          switch (ch) {
            case 110:
              out += "\n";break; // 'n' -> '\n'
            case 114:
              out += "\r";break; // 'r' -> '\r'
            case 120:
              out += String.fromCharCode(readHexChar(2));break; // 'x'
            case 117:
              out += String.fromCharCode(readHexChar(4));break; // 'u'
            case 85:
              out += String.fromCharCode(readHexChar(8));break; // 'U'
            case 116:
              out += "\t";break; // 't' -> '\t'
            case 98:
              out += "\b";break; // 'b' -> '\b'
            case 118:
              out += "\u000b";break; // 'v' -> '\u000b'
            case 102:
              out += "\f";break; // 'f' -> '\f'
            case 48:
              out += "\u0000";break; // 0 -> '\0'
            case 13:
              if (input.charCodeAt(tokPos) === 10) ++tokPos; // '\r\n'
            /* falls through */
            case 10:
              // ' \n'
              if (options.locations) {
                tokLineStart = tokPos;++tokCurLine;
              }
              break;
            default:
              out += String.fromCharCode(ch);break;
          }
        }
      } else {
        if (ch === 13 || ch === 10 || ch === 8232 || ch === 8233) raise(tokStart, "Unterminated string constant");
        out += String.fromCharCode(ch); // '\'
        ++tokPos;
      }
    }
  }

  // Used to read character escape sequences ('\x', '\u', '\U').

  function readHexChar(len) {
    var n = readInt(16, len);
    if (n === null) raise(tokStart, "Bad character escape sequence");
    return n;
  }

  // Used to signal to callers of `readWord1` whether the word
  // contained any escape sequences. This is needed because words with
  // escape sequences must not be interpreted as keywords.

  var containsEsc;

  // Read an identifier, and return it as a string. Sets `containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Only builds up the word character-by-character when it actually
  // containeds an escape, as a micro-optimization.

  function readWord1() {
    containsEsc = false;
    var word,
        first = true,
        start = tokPos;
    for (;;) {
      var ch = input.charCodeAt(tokPos);
      if (isIdentifierChar(ch)) {
        if (containsEsc) word += input.charAt(tokPos);
        ++tokPos;
      } else if (ch === 92) {
        // "\"
        if (!containsEsc) word = input.slice(start, tokPos);
        containsEsc = true;
        if (input.charCodeAt(++tokPos) != 117) // "u"
          raise(tokPos, "Expecting Unicode escape sequence \\uXXXX");
        ++tokPos;
        var esc = readHexChar(4);
        var escStr = String.fromCharCode(esc);
        if (!escStr) raise(tokPos - 1, "Invalid Unicode escape");
        if (!(first ? isIdentifierStart(esc) : isIdentifierChar(esc))) raise(tokPos - 4, "Invalid Unicode escape");
        word += escStr;
      } else {
        break;
      }
      first = false;
    }
    return containsEsc ? word : input.slice(start, tokPos);
  }

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

  function readWord() {
    var word = readWord1();
    var type = _name;
    if (!containsEsc && isKeyword(word)) type = keywordTypes[word];
    return finishToken(type, word);
  }


  module.exports = { tokenize: exports.tokenize };
});
define("rebound-component/helpers", ["exports", "module", "rebound-component/lazy-value", "rebound-component/utils"], function (exports, module, _reboundComponentLazyValue, _reboundComponentUtils) {
  "use strict";

  // Rebound Helpers
  // ----------------

  var LazyValue = to5Runtime.interopRequire(_reboundComponentLazyValue);

  var $ = to5Runtime.interopRequire(_reboundComponentUtils);




  var helpers = {},
      partials = {};

  helpers.registerPartial = function (name, func) {
    if (func && func.isHTMLBars && typeof name === "string") {
      partials[name] = func;
    }
  };

  // lookupHelper returns the given function from the helpers object. Manual checks prevent user from overriding reserved words.
  helpers.lookupHelper = function (name, env) {
    env && env.helpers || (env = { helpers: {} });
    // If a reserved helper, return it
    if (name === "attribute") {
      return this.attribute;
    }
    if (name === "if") {
      return this["if"];
    }
    if (name === "unless") {
      return this.unless;
    }
    if (name === "each") {
      return this.each;
    }
    if (name === "partial") {
      return this.partial;
    }
    if (name === "on") {
      return this.on;
    }
    if (name === "debugger") {
      return this["debugger"];
    }
    if (name === "log") {
      return this.log;
    }

    // If not a reserved helper, check env, then global helpers, else return false
    return env.helpers[name] || helpers[name] || false;
  };

  helpers.registerHelper = function (name, callback, params) {
    if (!_.isString(name)) {
      console.error("Name provided to registerHelper must be a string!");
      return;
    }
    if (!_.isFunction(callback)) {
      console.error("Callback provided to regierHelper must be a function!");
      return;
    }
    if (helpers.lookupHelper(name)) {
      console.error("A helper called \"" + name + "\" is already registered!");
      return;
    }

    params = _.isArray(params) ? params : [params];
    callback.__params = params;

    helpers[name] = callback;
  };

  /*******************************
          Default helpers
  ********************************/

  helpers["debugger"] = function (params, hash, options, env) {
    debugger;
    return "";
  };

  helpers.log = function (params, hash, options, env) {
    console.log.apply(console, params);
    return "";
  };

  helpers.on = function (params, hash, options, env) {
    var i,
        callback,
        delegate,
        element,
        eventName = params[0],
        len = params.length,
        data = hash;

    // By default everything is delegated on the parent component
    if (len === 2) {
      callback = params[1];
      delegate = options.element;
      element = this.el || options.element;
    }
    // If a selector is provided, delegate on the helper's element
    else if (len === 3) {
      callback = params[2];
      delegate = params[1];
      element = options.element;
    }

    // Attach event
    $(element).on(eventName, delegate, hash, function (event) {
      return env.helpers._callOnComponent(callback, event);
    });
  };

  helpers.length = function (params, hash, options, env) {
    return params[0] && params[0].length || 0;
  };

  helpers["if"] = function (params, hash, options, env) {
    var condition = params[0];

    if (condition === undefined || condition === null) {
      condition = false;
    }

    if (condition.isModel) {
      condition = true;
    }

    // If our condition is an array, handle properly
    if (_.isArray(condition) || condition.isCollection) {
      condition = condition.length ? true : false;
    }

    if (condition === "true") {
      condition = true;
    }
    if (condition === "false") {
      condition = false;
    }

    // If more than one param, this is not a block helper. Eval as such.
    if (params.length > 1) {
      return condition ? params[1] : params[2] || "";
    }

    // Check our cache. If the value hasn't actually changed, don't evaluate. Important for re-rendering of #each helpers.
    if (options.morph.__ifCache === condition) {
      return null; // Return null prevent's re-rending of our placeholder.
    }

    options.morph.__ifCache = condition;

    // Render the apropreate block statement
    if (condition && options.template) {
      return options.template.render(options.context, env, options.morph.contextualElement);
    } else if (!condition && options.inverse) {
      return options.inverse.render(options.context, env, options.morph.contextualElement);
    }

    return "";
  };


  // TODO: Proxy to if helper with inverted params
  helpers.unless = function (params, hash, options, env) {
    var condition = params[0];

    if (condition === undefined || condition === null) {
      condition = false;
    }

    if (condition.isModel) {
      condition = true;
    }

    // If our condition is an array, handle properly
    if (_.isArray(condition) || condition.isCollection) {
      condition = condition.length ? true : false;
    }

    // If more than one param, this is not a block helper. Eval as such.
    if (params.length > 1) {
      return !condition ? params[1] : params[2] || "";
    }

    // Check our cache. If the value hasn't actually changed, don't evaluate. Important for re-rendering of #each helpers.
    if (options.morph.__unlessCache === condition) {
      return null; // Return null prevent's re-rending of our placeholder.
    }

    options.morph.__unlessCache = condition;

    // Render the apropreate block statement
    if (!condition && options.template) {
      return options.template.render(options.context, env, options.morph.contextualElement);
    } else if (condition && options.inverse) {
      return options.inverse.render(options.context, env, options.morph.contextualElement);
    }

    return "";
  };

  // Given an array, predicate and optional extra variable, finds the index in the array where predicate is true
  function findIndex(arr, predicate, cid) {
    if (arr == null) {
      throw new TypeError("findIndex called on null or undefined");
    }
    if (typeof predicate !== "function") {
      throw new TypeError("predicate must be a function");
    }
    var list = Object(arr);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list, cid)) {
        return i;
      }
    }
    return -1;
  }

  helpers.each = function (params, hash, options, env) {
    if (_.isNull(params[0]) || _.isUndefined(params[0])) {
      console.warn("Undefined value passed to each helper! Maybe try providing a default value?", options.context);return null;
    }

    var value = params[0].isCollection ? params[0].models : params[0],
        // Accepts collections or arrays
    morph = options.morph.firstChildMorph,
        obj,
        next,
        lazyValue,
        nmorph,
        i,
        // used below to remove trailing junk morphs from the dom
    position,
        // Stores the iterated element's integer position in the dom list
    currentModel = function (element, index, array, cid) {
      return element.cid === cid; // Returns true if currently observed element is the current model.
    };

    if ((!_.isArray(value) || value.length === 0) && options.inverse) {
      return options.inverse.render(options.context, env, options.morph.contextualElement);
    }

    // For each item in this collection
    for (i = 0; i < value.length; i++) {
      obj = value[i];
      next = morph ? morph.nextMorph : null;

      // If this morph is the rendered version of this model, continue to the next one.
      if (morph && morph.cid == obj.cid) {
        morph = next;continue;
      }

      nmorph = options.morph.insertContentBeforeMorph("", morph);

      // Create a lazyvalue whos value is the content inside our block helper rendered in the context of this current list object. Returns the rendered dom for this list item.
      lazyValue = new LazyValue(function () {
        return options.template.render(options.context, env, options.morph.contextualElement, [obj]);
      }, { morph: options.morph });

      // Insert our newly rendered value (a document tree) into our placeholder (the containing element) at its requested position (where we currently are in the object list)
      nmorph.setContent(lazyValue.value());

      // Label the inserted morph element with this model's cid
      nmorph.cid = obj.cid;

      // Destroy the old morph that was here
      morph && morph.destroy();

      // Move on to the next morph
      morph = next;
    }

    // If any more morphs are left over, remove them. We've already gone through all the models.
    while (morph) {
      next = morph.nextMorph;
      morph.destroy();
      morph = next;
    }

    // Return null prevent's re-rending of our placeholder. Our placeholder (containing element) now has all the dom we need.
    return null;
  };

  helpers.partial = function (params, hash, options, env) {
    var partial = partials[params[0]];
    if (partial && partial.isHTMLBars) {
      return partial.render(options.context, env);
    }
  };

  module.exports = helpers;
});
define("rebound-data/computed-property", ["exports", "module", "property-compiler/property-compiler", "rebound-component/utils"], function (exports, module, _propertyCompilerPropertyCompiler, _reboundComponentUtils) {
  "use strict";

  // Rebound Computed Property
  // ----------------

  var propertyCompiler = to5Runtime.interopRequire(_propertyCompilerPropertyCompiler);

  var $ = to5Runtime.interopRequire(_reboundComponentUtils);

  // Returns true if str starts with test
  function startsWith(str, test) {
    if (str === test) return true;
    return str.substring(0, test.length + 1) === test + ".";
  }


  // Called after callstack is exausted to call all of this computed property's
  // dependants that need to be recomputed
  function recomputeCallback() {
    var i = 0,
        len = this._toCall.length;
    delete this._recomputeTimeout;
    for (i = 0; i < len; i++) {
      this._toCall.shift().call();
    }
    this._toCall.added = {};
  }

  var ComputedProperty = function (prop, options) {
    if (!_.isFunction(prop)) return console.error("ComputedProperty constructor must be passed a function!", prop, "Found instead.");
    options = options || {};
    this.cid = _.uniqueId("computedPropety");
    this.name = options.name;
    this.returnType = null;
    this.__observers = {};
    this.helpers = {};
    this.waiting = {};
    this.isChanging = false;
    this.isDirty = true;
    this.func = prop;
    _.bindAll(this, "onModify", "markDirty");
    this.deps = propertyCompiler.compile(prop, this.name);

    // Create lineage to pass to our cache objects
    var lineage = {
      parent: this.setParent(options.parent || this),
      root: this.setRoot(options.root || options.parent || this),
      path: this.__path = options.path || this.__path
    };

    // Results Cache Objects
    // These models will never be re-created for the lifetime of the Computed Proeprty
    // On Recompute they are updated with new values.
    // On Change their new values are pushed to the object it is tracking
    this.cache = {
      model: new Rebound.Model({}, lineage),
      collection: new Rebound.Collection([], lineage),
      value: undefined
    };

    this.wire();
  };

  _.extend(ComputedProperty.prototype, Backbone.Events, {

    isComputedProperty: true,
    isData: true,
    __path: function () {
      return "";
    },


    markDirty: function () {
      if (this.isDirty) return;
      this.isDirty = true;
      this.trigger("dirty", this);
    },

    // Attached to listen to all events where this Computed Property's dependancies
    // are stored. See wire(). Will re-evaluate any computed properties that
    // depend on the changed data value which triggered this callback.
    onRecompute: function (type, model, collection, options) {
      var shortcircuit = { change: 1, sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1, dirty: 1 };
      if (shortcircuit[type] || !model.isData) return;
      model || (model = {});
      collection || (collection = {});
      options || (options = {});
      this._toCall || (this._toCall = []);
      this._toCall.added || (this._toCall.added = {});
      !collection.isData && (options = collection) && (collection = model);
      var push = function (arr) {
        var i,
            len = arr.length;
        this.added || (this.added = {});
        for (i = 0; i < len; i++) {
          if (this.added[arr[i].cid]) continue;
          this.added[arr[i].cid] = 1;
          this.push(arr[i]);
        }
      },
          path,
          vector;
      vector = path = collection.__path().replace(/\.?\[.*\]/ig, ".@each");

      // If a reset event on a Model, check for computed properties that depend
      // on each changed attribute's full path.
      if (type === "reset" && options.previousAttributes) {
        _.each(options.previousAttributes, function (value, key) {
          vector = path + (path && ".") + key;
          _.each(this.__computedDeps, function (dependants, dependancy) {
            startsWith(vector, dependancy) && push.call(this._toCall, dependants);
          }, this);
        }, this);
      }

      // If a reset event on a Collction, check for computed properties that depend
      // on anything inside that collection.
      else if (type === "reset" && options.previousModels) {
        _.each(this.__computedDeps, function (dependants, dependancy) {
          startsWith(dependancy, vector) && push.call(this._toCall, dependants);
        }, this);
      }

      // If an add or remove event, check for computed properties that depend on
      // anything inside that collection or that contains that collection.
      else if (type === "add" || type === "remove") {
        _.each(this.__computedDeps, function (dependants, dependancy) {
          if (startsWith(dependancy, vector) || startsWith(vector, dependancy)) push.call(this._toCall, dependants);;
        }, this);
      }

      // If a change event, trigger anything that depends on that changed path.
      else if (type.indexOf("change:") === 0) {
        vector = type.replace("change:", "").replace(/\.?\[.*\]/ig, ".@each");
        _.each(this.__computedDeps, function (dependants, dependancy) {
          startsWith(vector, dependancy) && push.call(this._toCall, dependants);
        }, this);
      }

      var i,
          len = this._toCall.length;
      for (i = 0; i < len; i++) {
        this._toCall[i].markDirty();
      }

      // Notifies all computed properties in the dependants array to recompute.
      // Marks everyone as dirty and then calls them.
      if (!this._recomputeTimeout) this._recomputeTimeout = setTimeout(_.bind(recomputeCallback, this), 0);
      return;
    },


    // Called when a Computed Property's active cache object changes.
    // Pushes any changes to Computed Property that returns a data object back to
    // the original object.
    onModify: function (type, model, collection, options) {
      var shortcircuit = { sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1 };
      if (!this.tracking || shortcircuit[type] || ~type.indexOf("change:")) return;
      model || (model = {});
      collection || (collection = {});
      options || (options = {});
      !collection.isData && _.isObject(collection) && (options = collection) && (collection = model);
      var src = this;
      var path = collection.__path().replace(src.__path(), "").replace(/^\./, "");
      var dest = this.tracking.get(path);

      if (_.isUndefined(dest)) return;
      if (type === "change") dest.set && dest.set(model.changedAttributes());else if (type === "reset") dest.reset && dest.reset(model);else if (type === "add") dest.add && dest.add(model);else if (type === "remove") dest.remove && dest.remove(model);
      // TODO: Add sort
    },

    // Adds a litener to the root object and tells it what properties this
    // Computed Property depend on.
    // The listener will re-compute this Computed Property when any are changed.
    wire: function () {
      var root = this.__root__;
      var context = this.__parent__;
      root.__computedDeps || (root.__computedDeps = {});

      _.each(this.deps, function (path) {
        var dep = root.get(path, { raw: true });
        if (!dep || !dep.isComputedProperty) return;
        dep.on("dirty", this.markDirty);
      }, this);

      _.each(this.deps, function (path) {
        // Find actual path from relative paths
        var split = $.splitPath(path);
        while (split[0] === "@parent") {
          context = context.__parent__;
          split.shift();
        }

        path = context.__path().replace(/\.?\[.*\]/ig, ".@each");
        path = path + (path && ".") + split.join(".");

        // Add ourselves as dependants
        root.__computedDeps[path] || (root.__computedDeps[path] = []);
        root.__computedDeps[path].push(this);
      }, this);

      // Ensure we only have one listener per Model at a time.
      context.off("all", this.onRecompute).on("all", this.onRecompute);
    },

    unwire: function () {
      var root = this.__root__;
      var context = this.__parent__;

      _.each(this.deps, function (path) {
        var dep = root.get(path, { raw: true });
        if (!dep || !dep.isComputedProperty) return;
        dep.off("dirty", this.markDirty);
      }, this);

      context.off("all", this.onRecompute);
    },

    // Call this computed property like you would with Function.call()
    call: function () {
      var args = Array.prototype.slice.call(arguments),
          context = args.shift();
      return this.apply(context, args);
    },

    // Call this computed property like you would with Function.apply()
    // Only properties that are marked as dirty and are not already computing
    // themselves are evaluated to prevent cyclic callbacks. If any dependants
    // aren't finished computeding, we add ourselved to their waiting list.
    // Vanilla objects returned from the function are promoted to Rebound Objects.
    // Then, set the proper return type for future fetches from the cache and set
    // the new computed value. Track changes to the cache to push it back up to
    // the original object and return the value.
    apply: function (context, params) {
      context || (context = this.__parent__);

      if (!this.isDirty || this.isChanging || !context) return;
      this.isChanging = true;

      var value = this.cache[this.returnType],
          result;

      // Check all of our dependancies to see if they are evaluating.
      // If we have a dependancy that is dirty and this isnt its first run,
      // Let this dependancy know that we are waiting for it.
      // It will re-run this Computed Property after it finishes.
      _.each(this.deps, function (dep) {
        var dependancy = context.get(dep, { raw: true });
        if (!dependancy || !dependancy.isComputedProperty) return;
        if (dependancy.isDirty && dependancy.returnType !== null) {
          dependancy.waiting[this.cid] = this;
          dependancy.apply(); // Try to re-evaluate this dependancy if it is dirty
          if (dependancy.isDirty) return this.isChanging = false;
        }
        delete dependancy.waiting[this.cid];
        // TODO: There can be a check here looking for cyclic dependancies.
      }, this);

      if (!this.isChanging) return;

      if (this.returnType !== "value") this.stopListening(value, "all", this.onModify);

      result = this.func.apply(context, params);

      // Promote vanilla objects to Rebound Data keeping the same original objects
      if (_.isArray(result)) result = new Rebound.Collection(result, { clone: false });else if (_.isObject(result) && !result.isData) result = new Rebound.Model(result, { clone: false });

      // If result is undefined, reset our cache item
      if (_.isUndefined(result) || _.isNull(result)) {
        this.returnType = "value";
        this.isCollection = this.isModel = false;
        this.set(undefined);
      }
      // Set result and return types, bind events
      else if (result.isCollection) {
        this.returnType = "collection";
        this.isCollection = true;
        this.isModel = false;
        this.set(result);
        this.track(result);
      } else if (result.isModel) {
        this.returnType = "model";
        this.isCollection = false;
        this.isModel = true;
        this.reset(result);
        this.track(result);
      } else {
        this.returnType = "value";
        this.isCollection = this.isModel = false;
        this.reset(result);
      }

      return this.value();
    },

    // When we receive a new model to set in our cache, unbind the tracker from
    // the previous cache object, sync the objects' cids so helpers think they
    // are the same object, save a referance to the object we are tracking,
    // and re-bind our onModify hook.
    track: function (object) {
      var target = this.value();
      if (!object || !target || !target.isData || !object.isData) return;
      target._cid || (target._cid = target.cid);
      object._cid || (object._cid = object.cid);
      target.cid = object.cid;
      this.tracking = object;
      this.listenTo(target, "all", this.onModify);
    },

    // Get from the Computed Property's cache
    get: function (key, options) {
      var value = this.value();
      options || (options = {});
      if (this.returnType === "value") return console.error("Called get on the `" + this.name + "` computed property which returns a primitive value.");
      return value.get(key, options);
    },

    // Set the Computed Property's cache to a new value and trigger appropreate events.
    // Changes will propagate back to the original object if a Rebound Data Object and re-compute.
    // If Computed Property returns a value, all downstream dependancies will re-compute.
    set: function (key, val, options) {
      if (this.returnType === null) return undefined;
      options || (options = {});
      var attrs = key;
      var value = this.value();
      if (this.returnType === "model") {
        if (typeof key === "object") {
          attrs = key.isModel ? key.attributes : key;
          options = val;
        } else {
          (attrs = {})[key] = val;
        }
      }
      if (this.returnType !== "model") options = val || {};
      attrs = attrs && attrs.isComputedProperty ? attrs.value() : attrs;

      // If a new value, set it and trigger events
      if (this.returnType === "value" && this.cache.value !== attrs) {
        this.cache.value = attrs;
        if (!options.quiet) {
          // If set was called not through computedProperty.call(), this is a fresh new event burst.
          if (!this.isDirty && !this.isChanging) this.__parent__.changed = {};
          this.__parent__.changed[this.name] = attrs;
          this.trigger("change", this.__parent__);
          this.trigger("change:" + this.name, this.__parent__, attrs);
          delete this.__parent__.changed[this.name];
        }
      } else if (this.returnType !== "value" && options.reset) key = value.reset(attrs, options);else if (this.returnType !== "value") key = value.set(attrs, options);
      this.isDirty = this.isChanging = false;

      // Call all reamining computed properties waiting for this value to resolve.
      _.each(this.waiting, function (prop) {
        prop && prop.call();
      });

      return key;
    },

    // Return the current value from the cache, running if dirty.
    value: function () {
      if (this.isDirty) this.apply();
      return this.cache[this.returnType];
    },

    // Reset the current value in the cache, running if first run.
    reset: function (obj, options) {
      if (_.isNull(this.returnType)) return; // First run
      options || (options = {});
      options.reset = true;
      return this.set(obj, options);
    },

    // Cyclic dependancy safe toJSON method.
    toJSON: function () {
      if (this._isSerializing) return this.cid;
      var val = this.value();
      this._isSerializing = true;
      var json = val && _.isFunction(val.toJSON) ? val.toJSON() : val;
      this._isSerializing = false;
      return json;
    }

  });

  module.exports = ComputedProperty;
});
define("rebound-component/hooks", ["exports", "module", "rebound-component/lazy-value", "rebound-component/utils", "rebound-component/helpers"], function (exports, module, _reboundComponentLazyValue, _reboundComponentUtils, _reboundComponentHelpers) {
  "use strict";

  // Rebound Hooks
  // ----------------

  var LazyValue = to5Runtime.interopRequire(_reboundComponentLazyValue);

  var $ = to5Runtime.interopRequire(_reboundComponentUtils);

  var helpers = to5Runtime.interopRequire(_reboundComponentHelpers);

  var hooks = {},
      attributes = { abbr: 1, "accept-charset": 1, accept: 1, accesskey: 1, action: 1,
    align: 1, alink: 1, alt: 1, archive: 1, axis: 1,
    background: 1, bgcolor: 1, border: 1, cellpadding: 1, cellspacing: 1,
    char: 1, charoff: 1, charset: 1, checked: 1, cite: 1,
    "class": 1, classid: 1, clear: 1, code: 1, codebase: 1,
    codetype: 1, color: 1, cols: 1, colspan: 1, compact: 1,
    content: 1, coords: 1, data: 1, datetime: 1, declare: 1,
    defer: 1, dir: 1, disabled: 1, enctype: 1, face: 1,
    "for": 1, frame: 1, frameborder: 1, headers: 1, height: 1,
    href: 1, hreflang: 1, hspace: 1, "http-equiv": 1, id: 1,
    ismap: 1, label: 1, lang: 1, language: 1, link: 1,
    longdesc: 1, marginheight: 1, marginwidth: 1, maxlength: 1, media: 1,
    method: 1, multiple: 1, name: 1, nohref: 1, noresize: 1,
    noshade: 1, nowrap: 1, object: 1, onblur: 1, onchange: 1,
    onclick: 1, ondblclick: 1, onfocus: 1, onkeydown: 1, onkeypress: 1,
    onkeyup: 1, onload: 1, onmousedown: 1, onmousemove: 1, onmouseout: 1,
    onmouseover: 1, onmouseup: 1, onreset: 1, onselect: 1, onsubmit: 1,
    onunload: 1, profile: 1, prompt: 1, readonly: 1, rel: 1,
    rev: 1, rows: 1, rowspan: 1, rules: 1, scheme: 1,
    scope: 1, scrolling: 1, selected: 1, shape: 1, size: 1,
    span: 1, src: 1, standby: 1, start: 1, style: 1,
    summary: 1, tabindex: 1, target: 1, text: 1, title: 1,
    type: 1, usemap: 1, valign: 1, value: 1, valuetype: 1,
    version: 1, vlink: 1, vspace: 1, width: 1 };


  /*******************************
          Hook Utils
  ********************************/

  // Given an object (context) and a path, create a LazyValue object that returns the value of object at context and add it as an observer of the context.
  function streamProperty(context, path) {
    // Lazy value that returns the value of context.path
    var lazyValue = new LazyValue(function () {
      return context.get(path);
    }, { context: context });

    // Save our path so parent lazyvalues can know the data var or helper they are getting info from
    lazyValue.path = path;

    // Save the observer at this path
    lazyValue.addObserver(path, context);

    return lazyValue;
  }

  function constructHelper(morph, path, context, params, hash, options, env, helper) {
    var key;
    // Extend options with the helper's containeing Morph element. Used by streamify to track data observers
    options.morph = morph;
    options.element = morph;
    options.path = path;
    options.context = context;

    // Ensure env and block params don't share memory with other helpers
    env = _.clone(env);
    if (env.blockParams) env.blockParams = _.clone(env.blockParams);

    // Create a lazy value that returns the value of our evaluated helper.
    options.lazyValue = new LazyValue(function () {
      var plainParams = [],
          plainHash = {};

      // Assemble our args and hash variables. For each lazyvalue param, push the lazyValue's value so helpers with no concept of lazyvalues.
      _.each(params, function (param, index) {
        plainParams.push(param && param.isLazyValue ? param.value() : param);
      });
      _.each(hash, function (hash, key) {
        plainHash[key] = hash && hash.isLazyValue ? hash.value() : hash;
      });

      // Call our helper functions with our assembled args.
      return helper.apply(context.__root__ || context, [plainParams, plainHash, options, env]);
    }, { morph: options.morph });

    options.lazyValue.path = path;

    // For each param or hash value passed to our helper, add it to our helper's dependant list. Helper will re-evaluate when one changes.
    params.forEach(function (param) {
      if (param && param.isLazyValue) {
        options.lazyValue.addDependentValue(param);
      }
    });
    for (key in hash) {
      if (hash[key] && hash[key].isLazyValue) {
        options.lazyValue.addDependentValue(hash[key]);
      }
    }

    return options.lazyValue;
  }

  // Given a root element, cleans all of the morph lazyValues for a given subtree
  function cleanSubtree(mutations, observer) {
    // For each mutation observed, if there are nodes removed, destroy all associated lazyValues
    mutations.forEach(function (mutation) {
      if (mutation.removedNodes) {
        _.each(mutation.removedNodes, function (node, index) {
          $(node).walkTheDOM(function (n) {
            if (n.__lazyValue && n.__lazyValue.destroy()) {
              n.__lazyValue.destroy();
            }
          });
        });
      }
    });
  }

  var subtreeObserver = new MutationObserver(cleanSubtree);

  /*******************************
          Default Hooks
  ********************************/

  hooks.get = function get(env, context, path) {
    if (path === "this") path = "";
    var key,
        rest = $.splitPath(path),
        first = rest.shift();

    // If this path referances a block param, use that as the context instead.
    if (env.blockParams && env.blockParams[first]) {
      context = env.blockParams[first];
      path = rest.join(".");
    }

    return streamProperty(context, path);
  };

  hooks.set = function set(env, context, name, value) {
    env.blockParams || (env.blockParams = {});
    env.blockParams[name] = value;
  };


  hooks.concat = function concat(env, params) {
    if (params.length === 1) {
      return params[0];
    }

    var lazyValue = new LazyValue(function () {
      var value = "";

      for (var i = 0, l = params.length; i < l; i++) {
        value += params[i].isLazyValue ? params[i].value() : params[i];
      }

      return value;
    }, { context: params[0].context });

    for (var i = 0, l = params.length; i < l; i++) {
      if (params[i].isLazyValue) {
        lazyValue.addDependentValue(params[i]);
      }
    }

    return lazyValue;
  };

  hooks.subexpr = function subexpr(env, context, helperName, params, hash) {
    var helper = helpers.lookupHelper(helperName, env),
        lazyValue;

    if (helper) {
      lazyValue = constructHelper(false, helperName, context, params, hash, {}, env, helper);
    } else {
      lazyValue = hooks.get(env, context, helperName);
    }

    for (var i = 0, l = params.length; i < l; i++) {
      if (params[i].isLazyValue) {
        lazyValue.addDependentValue(params[i]);
      }
    }

    return lazyValue;
  };

  hooks.block = function block(env, morph, context, path, params, hash, template, inverse) {
    var options = {
      morph: morph,
      template: template,
      inverse: inverse
    };

    var lazyValue,
        value,
        observer = subtreeObserver,
        helper = helpers.lookupHelper(path, env);

    if (!_.isFunction(helper)) {
      return console.error(path + " is not a valid helper!");
    }

    // Abstracts our helper to provide a handlebars type interface. Constructs our LazyValue.
    lazyValue = constructHelper(morph, path, context, params, hash, options, env, helper);

    var renderHook = function (lazyValue) {
      var val = lazyValue.value();
      val = _.isUndefined(val) ? "" : val;
      if (!_.isNull(val)) {
        morph.setContent(val);
      }
    };
    lazyValue.onNotify(renderHook);
    renderHook(lazyValue);

    // Observe this content morph's parent's children.
    // When the morph element's containing element (morph) is removed, clean up the lazyvalue.
    // Timeout delay hack to give out dom a change to get their parent
    if (morph._parent) {
      morph._parent.__lazyValue = lazyValue;
      setTimeout(function () {
        if (morph.contextualElement) {
          observer.observe(morph.contextualElement, { attributes: false, childList: true, characterData: false, subtree: true });
        }
      }, 0);
    }
  };

  hooks.inline = function inline(env, morph, context, path, params, hash) {
    var lazyValue,
        value,
        observer = subtreeObserver,
        helper = helpers.lookupHelper(path, env);

    if (!_.isFunction(helper)) {
      return console.error(path + " is not a valid helper!");
    }

    // Abstracts our helper to provide a handlebars type interface. Constructs our LazyValue.
    lazyValue = constructHelper(morph, path, context, params, hash, {}, env, helper);

    var renderHook = function (lazyValue) {
      var val = lazyValue.value();
      val = _.isUndefined(val) ? "" : val;
      if (!_.isNull(val)) {
        morph.setContent(val);
      }
    };

    // If we have our lazy value, update our dom.
    // morph is a morph element representing our dom node
    lazyValue.onNotify(renderHook);
    renderHook(lazyValue);

    // Observe this content morph's parent's children.
    // When the morph element's containing element (morph) is removed, clean up the lazyvalue.
    // Timeout delay hack to give out dom a change to get their parent
    if (morph._parent) {
      morph._parent.__lazyValue = lazyValue;
      setTimeout(function () {
        if (morph.contextualElement) {
          observer.observe(morph.contextualElement, { attributes: false, childList: true, characterData: false, subtree: true });
        }
      }, 0);
    }
  };

  hooks.content = function content(env, morph, context, path) {
    var lazyValue,
        value,
        observer = subtreeObserver,
        helper = helpers.lookupHelper(path, env);

    if (helper) {
      lazyValue = constructHelper(morph, path, context, [], {}, {}, env, helper);
    } else {
      lazyValue = hooks.get(env, context, path);
    }

    var renderHook = function (lazyValue) {
      var val = lazyValue.value();
      val = _.isUndefined(val) ? "" : val;
      if (!_.isNull(val)) morph.setContent(val);
    };

    // If we have our lazy value, update our dom.
    // morph is a morph element representing our dom node
    lazyValue.onNotify(renderHook);
    renderHook(lazyValue);

    // Observe this content morph's parent's children.
    // When the morph element's containing element (morph) is removed, clean up the lazyvalue.
    // Timeout delay hack to give out dom a change to get their parent
    if (morph._parent) {
      morph._parent.__lazyValue = lazyValue;
      setTimeout(function () {
        if (morph.contextualElement) {
          observer.observe(morph.contextualElement, { attributes: false, childList: true, characterData: false, subtree: true });
        }
      }, 0);
    }
  };

  // Handle morphs in element tags
  // TODO: handle dynamic attribute names?
  hooks.element = function element(env, domElement, context, path, params, hash) {
    var helper = helpers.lookupHelper(path, env),
        lazyValue,
        value;

    if (helper) {
      // Abstracts our helper to provide a handlebars type interface. Constructs our LazyValue.
      lazyValue = constructHelper(domElement, path, context, params, hash, {}, env, helper);
    } else {
      lazyValue = hooks.get(env, context, path);
    }

    var renderHook = function (lazyValue) {
      lazyValue.value();
    };

    // When we have our lazy value run it and start listening for updates.
    lazyValue.onNotify(renderHook);
    renderHook(lazyValue);
  };
  hooks.attribute = function attribute(env, attrMorph, domElement, name, value) {
    var lazyValue = new LazyValue(function () {
      var val = value.value(),
          checkboxChange,
          type = domElement.getAttribute("type"),
          inputTypes = { "null": true, text: true, email: true, password: true,
        search: true, url: true, tel: true, hidden: true,
        number: true, color: true, date: true, datetime: true,
        "datetime-local:": true, month: true, range: true,
        time: true, week: true
      },
          attr;

      // If is a text input element's value prop with only one variable, wire default events
      if (domElement.tagName === "INPUT" && inputTypes[type] && name === "value") {
        // If our special input events have not been bound yet, bind them and set flag
        if (!lazyValue.inputObserver) {
          $(domElement).on("change input propertychange", function (event) {
            value.set(value.path, this.value);
          });

          lazyValue.inputObserver = true;
        }

        // Set the attribute on our element for visual referance
        _.isUndefined(val) ? domElement.removeAttribute(name) : domElement.setAttribute(name, val);

        attr = val;

        return domElement.value !== String(attr) ? domElement.value = attr || "" : attr;
      } else if (domElement.tagName === "INPUT" && (type === "checkbox" || type === "radio") && name === "checked") {
        // If our special input events have not been bound yet, bind them and set flag
        if (!lazyValue.eventsBound) {
          $(domElement).on("change propertychange", function (event) {
            value.set(value.path, this.checked ? true : false, { quiet: true });
          });

          lazyValue.eventsBound = true;
        }

        // Set the attribute on our element for visual referance
        !val ? domElement.removeAttribute(name) : domElement.setAttribute(name, val);

        return domElement.checked = val ? true : undefined;
      }

      // Special case for link elements with dynamic classes.
      // If the router has assigned it a truthy 'active' property, ensure that the extra class is present on re-render.
      else if (domElement.tagName === "A" && name === "class") {
        if (_.isUndefined(val)) {
          domElement.active ? domElement.setAttribute("class", "active") : domElement.classList.remove("class");
        } else {
          domElement.setAttribute(name, val + (domElement.active ? " active" : ""));
        }
      } else {
        _.isString(val) && (val = val.trim());
        val || (val = undefined);
        if (_.isUndefined(val)) {
          domElement.removeAttribute(name);
        } else {
          domElement.setAttribute(name, val);
        }
      }

      return val;
    }, { attrMorph: attrMorph });

    var renderHook = function () {
      lazyValue.value();
    };

    value.onNotify(renderHook);
    lazyValue.addDependentValue(value);
    renderHook();
  };

  hooks.component = function (env, morph, context, tagName, contextData, template) {
    var component,
        element,
        outlet,
        plainData = {},
        componentData = {},
        lazyValue,
        value;

    // Create a lazy value that returns the value of our evaluated component.
    lazyValue = new LazyValue(function () {
      // Create a plain data object from the lazyvalues/values passed to our component
      _.each(contextData, function (value, key) {
        plainData[key] = value.isLazyValue ? value.value() : value;
      });

      // For each param passed to our shared component, add it to our custom element
      // TODO: there has to be a better way to get seed data to element instances
      // Global seed data is consumed by element as its created. This is not scoped and very dumb.
      Rebound.seedData = plainData;
      element = document.createElement(tagName);
      delete Rebound.seedData;
      component = element.__component__;

      // For each lazy param passed to our component, create its lazyValue
      _.each(plainData, function (value, key) {
        if (contextData[key] && contextData[key].isLazyValue) {
          componentData[key] = hooks.get(env, component, key);
        }
      });

      // Set up two way binding between component and original context for non-data attributes
      // Syncing between models and collections passed are handled in model and collection
      _.each(componentData, function (componentDataValue, key) {
        // TODO: Make this sync work with complex arguments with more than one child
        if (contextData[key].children === null) {
          // For each lazy param passed to our component, have it update the original context when changed.
          componentDataValue.onNotify(function () {
            contextData[key].set(contextData[key].path, componentDataValue.value());
          });
        }

        // For each lazy param passed to our component, have it update the component when changed.
        contextData[key].onNotify(function () {
          componentDataValue.set(key, contextData[key].value());
        });

        // Seed the cache
        componentDataValue.value();

        // Notify the component's lazyvalue when our model updates
        contextData[key].addObserver(contextData[key].path, context);
        componentDataValue.addObserver(key, component);
      });

      // // For each change on our component, update the states of the original context and the element's proeprties.
      component.listenTo(component, "change", function (model) {
        var json = component.toJSON();

        if (_.isString(json)) return; // If is a string, this model is seralizing already

        // Set the properties on our element for visual referance if we are on a top level attribute
        _.each(json, function (value, key) {
          // TODO: Currently, showing objects as properties on the custom element causes problems.
          // Linked models between the context and component become the same exact model and all hell breaks loose.
          // Find a way to remedy this. Until then, don't show objects.
          if (_.isObject(value)) {
            return;
          }
          value = _.isObject(value) ? JSON.stringify(value) : value;
          try {
            attributes[key] ? element.setAttribute(key, value) : element.dataset[key] = value;
          } catch (e) {
            console.error(e.message);
          }
        });
      });

      /** The attributeChangedCallback on our custom element updates the component's data. **/


      /*******************************************************
         End data dependancy chain
       *******************************************************/


      // TODO: break this out into its own function
      // Set the properties on our element for visual referance if we are on a top level attribute
      var compjson = component.toJSON();
      _.each(compjson, function (value, key) {
        // TODO: Currently, showing objects as properties on the custom element causes problems.
        // Linked models between the context and component become the same exact model and all hell breaks loose.
        // Find a way to remedy this. Until then, don't show objects.
        if (_.isObject(value)) {
          return;
        }
        value = _.isObject(value) ? JSON.stringify(value) : value;
        if (!_.isNull(value) && !_.isUndefined(value)) {
          try {
            attributes[key] ? element.setAttribute(key, value) : element.dataset[key] = value;
          } catch (e) {
            console.error(e.message);
          }
        }
      });


      // If an outlet marker is present in component's template, and a template is provided, render it into <content>
      outlet = element.getElementsByTagName("content")[0];
      if (template && _.isElement(outlet)) {
        outlet.innerHTML = "";
        outlet.appendChild(template.render(context, env, outlet));
      }

      // Return the new element.
      return element;
    }, { morph: morph });

    var renderHook = function (lazyValue) {
      var val = lazyValue.value();
      if (val !== undefined) {
        morph.setContent(val);
      }
    };

    // If we have our lazy value, update our dom.
    // morph is a morph element representing our dom node
    if (lazyValue) {
      lazyValue.onNotify(renderHook);
      renderHook(lazyValue);
    }
  };

  // registerHelper is a publically available function to register a helper with HTMLBars

  module.exports = hooks;
});
define("rebound-data/model", ["exports", "module", "rebound-data/computed-property", "rebound-component/utils"], function (exports, module, _reboundDataComputedProperty, _reboundComponentUtils) {
  "use strict";

  // Rebound Model
  // ----------------

  // Rebound **Models** are the basic data object in the framework — frequently
  // representing a row in a table in a database on your server. The inherit from
  // Backbone Models and have all of the same useful methods you are used to for
  // performing computations and transformations on that data. Rebound augments
  // Backbone Models by enabling deep data nesting. You can now have **Rebound Collections**
  // and **Rebound Computed Properties** as properties of the Model.

  var ComputedProperty = to5Runtime.interopRequire(_reboundDataComputedProperty);

  var $ = to5Runtime.interopRequire(_reboundComponentUtils);

  // Returns a function that, when called, generates a path constructed from its
  // parent's path and the key it is assigned to. Keeps us from re-naming children
  // when parents change.
  function pathGenerator(parent, key) {
    return function () {
      var path = parent.__path();
      return path + (path === "" ? "" : ".") + key;
    };
  }

  var Model = Backbone.Model.extend({
    // Set this object's data types
    isModel: true,
    isData: true,

    // A method that returns a root path by default. Meant to be overridden on
    // instantiation.
    __path: function () {
      return "";
    },

    // Create a new Model with the specified attributes. The Model's lineage is set
    // up here to keep track of it's place in the data tree.
    constructor: function (attributes, options) {
      attributes || (attributes = {});
      attributes.isModel && (attributes = attributes.attributes);
      options || (options = {});
      this.helpers = {};
      this.defaults = this.defaults || {};
      this.setParent(options.parent || this);
      this.setRoot(options.root || this);
      this.__path = options.path || this.__path;
      Backbone.Model.call(this, attributes, options);
    },

    // New convenience function to toggle boolean values in the Model.
    toggle: function (attr, options) {
      options = options ? _.clone(options) : {};
      var val = this.get(attr);
      if (!_.isBoolean(val)) console.error("Tried to toggle non-boolean value " + attr + "!", this);
      return this.set(attr, !val, options);
    },

    // Model Reset does a deep reset on the data tree starting at this Model.
    // A `previousAttributes` property is set on the `options` property with the Model's
    // old values.
    reset: function (obj, options) {
      var changed = {},
          key,
          value;
      options || (options = {});
      options.reset = true;
      obj = obj && obj.isModel && obj.attributes || obj || {};
      options.previousAttributes = _.clone(this.attributes);

      // Iterate over the Model's attributes:
      // - If the property is the `idAttribute`, skip.
      // - If the property is a `Model`, `Collection`, or `ComputedProperty`, reset it.
      // - If the passed object has the property, set it to the new value.
      // - If the Model has a default value for this property, set it back to default.
      // - Otherwise, unset the attribute.
      for (key in this.attributes) {
        value = this.attributes[key];
        if (value === obj[key]) continue;else if (_.isUndefined(value)) obj[key] && (changed[key] = obj[key]);else if (key === this.idAttribute) continue;else if (value.isCollection || value.isModel || value.isComputedProperty) {
          value.reset(obj[key] || [], { silent: true });
          if (value.isCollection) changed[key] = [];else if (value.isModel && value.isComputedProperty) changed[key] = value.cache.model.changed;else if (value.isModel) changed[key] = value.changed;
        } else if (obj.hasOwnProperty(key)) {
          changed[key] = obj[key];
        } else if (this.defaults.hasOwnProperty(key) && !_.isFunction(this.defaults[key])) {
          changed[key] = obj[key] = this.defaults[key];
        } else {
          changed[key] = undefined;
          this.unset(key, { silent: true });
        }
      };

      // Any unset changed values will be set to obj[key]
      _.each(obj, function (value, key, obj) {
        changed[key] = changed[key] || obj[key];
      });

      // Reset our model
      obj = this.set(obj, _.extend({}, options, { silent: true, reset: false }));

      // Trigger custom reset event
      this.changed = changed;
      if (!options.silent) this.trigger("reset", this, options);

      // Return new values
      return obj;
    },

    // **Model.Get** is overridden to provide support for getting from a deep data tree.
    // `key` may now be any valid json-like identifier. Ex: `obj.coll[3].value`.
    // It needs to traverse `Models`, `Collections` and `Computed Properties` to
    // find the correct value.
    // - If key is undefined, return `undefined`.
    // - If key is empty string, return `this`.
    //
    // For each part:
    // - If a `Computed Property` and `options.raw` is true, return it.
    // - If a `Computed Property` traverse to its value.
    // - If not set, return its falsy value.
    // - If a `Model`, `Collection`, or primitive value, traverse to it.
    get: function (key, options) {
      options || (options = {});
      var parts = $.splitPath(key),
          result = this,
          i,
          l = parts.length;

      if (_.isUndefined(key) || _.isNull(key)) return undefined;
      if (key === "" || parts.length === 0) return result;

      for (i = 0; i < l; i++) {
        if (result && result.isComputedProperty && options.raw) return result;
        if (result && result.isComputedProperty) result = result.value();
        if (_.isUndefined(result) || _.isNull(result)) return result;
        if (parts[i] === "@parent") result = result.__parent__;else if (result.isCollection) result = result.models[parts[i]];else if (result.isModel) result = result.attributes[parts[i]];else if (result && result.hasOwnProperty(parts[i])) result = result[parts[i]];
      }

      if (result && result.isComputedProperty && !options.raw) result = result.value();
      return result;
    },


    // **Model.Set** is overridden to provide support for getting from a deep data tree.
    // `key` may now be any valid json-like identifier. Ex: `obj.coll[3].value`.
    // It needs to traverse `Models`, `Collections` and `Computed Properties` to
    // find the correct value to call the original `Backbone.Set` on.
    set: function (key, val, options) {
      var attrs,
          attr,
          newKey,
          target,
          destination,
          props = [],
          lineage;

      if (typeof key === "object") {
        attrs = key.isModel ? key.attributes : key;
        options = val;
      } else (attrs = {})[key] = val;
      options || (options = {});

      // If reset option passed, do a reset. If nothing passed, return.
      if (options.reset === true) return this.reset(attrs, options);
      if (options.defaults === true) this.defaults = attrs;
      if (_.isEmpty(attrs)) return;

      // For each attribute passed:
      for (key in attrs) {
        var val = attrs[key],
            paths = $.splitPath(key),
            attr = paths.pop() || ""; // The key        ex: foo[0].bar --> bar
        target = this.get(paths.join(".")), // The element    ex: foo.bar.baz --> foo.bar
        lineage;

        // If target currently doesnt exist, construct its tree
        if (_.isUndefined(target)) {
          target = this;
          _.each(paths, function (value) {
            var tmp = target.get(value);
            if (_.isUndefined(tmp)) tmp = target.set(value, {}).get(value);
            target = tmp;
          }, this);
        }

        // The old value of `attr` in `target`
        var destination = target.get(attr, { raw: true }) || {};

        // Create this new object's lineage.
        lineage = {
          name: key,
          parent: target,
          root: this.__root__,
          path: pathGenerator(target, key),
          silent: true,
          defaults: options.defaults
        };
        // - If val is `null` or `undefined`, set to default value.
        // - If val is a `Computed Property`, get its current cache object.
        // - If val (default value or evaluated computed property) is `null`, set to default value or (fallback `undefined`).
        // - Else If `{raw: true}` option is passed, set the exact object that was passed. No promotion to a Rebound Data object.
        // - Else If this function is the same as the current computed property, continue.
        // - Else If this value is a `Function`, turn it into a `Computed Property`.
        // - Else If this is going to be a cyclical dependancy, use the original object, don't make a copy.
        // - Else If updating an existing object with its respective data type, let Backbone handle the merge.
        // - Else If this value is a `Model` or `Collection`, create a new copy of it using its constructor, preserving its defaults while ensuring no shared memory between objects.
        // - Else If this value is an `Array`, turn it into a `Collection`.
        // - Else If this value is a `Object`, turn it into a `Model`.
        // - Else val is a primitive value, set it accordingly.



        if (_.isNull(val) || _.isUndefined(val)) val = this.defaults[key];
        if (val && val.isComputedProperty) val = val.value();
        if (_.isNull(val) || _.isUndefined(val)) val = undefined;else if (options.raw === true) val = val;else if (destination.isComputedProperty && destination.func === val) continue;else if (_.isFunction(val)) val = new ComputedProperty(val, lineage);else if (val.isData && target.hasParent(val)) val = val;else if (destination.isComputedProperty || destination.isCollection && (_.isArray(val) || val.isCollection) || destination.isModel && (_.isObject(val) || val.isModel)) {
          destination.set(val, options);
          continue;
        } else if (val.isData && options.clone !== false) val = new val.constructor(val.attributes || val.models, lineage);else if (_.isArray(val)) val = new Rebound.Collection(val, lineage); // TODO: Remove global referance
        else if (_.isObject(val)) val = new Model(val, lineage);

        // If val is a data object, let this object know it is now a parent
        this._hasAncestry = val && val.isData || false;

        // Set the value
        Backbone.Model.prototype.set.call(target, attr, val, options); // TODO: Event cleanup when replacing a model or collection with another value
      };

      return this;
    },

    // Recursive `toJSON` function traverses the data tree returning a JSON object.
    // If there are any cyclic dependancies the object's `cid` is used instead of looping infinitely.
    toJSON: function () {
      if (this._isSerializing) return this.id || this.cid;
      this._isSerializing = true;
      var json = _.clone(this.attributes);
      _.each(json, function (value, name) {
        if (_.isNull(value) || _.isUndefined(value)) {
          return;
        }
        _.isFunction(value.toJSON) && (json[name] = value.toJSON());
      });
      this._isSerializing = false;
      return json;
    }

  });

  module.exports = Model;
});
define("rebound-component/lazy-value", ["exports", "module"], function (exports, module) {
  "use strict";

  // Rebound Lazy Value
  // ----------------

  var NIL = function NIL() {},
      EMPTY_ARRAY = [];

  function LazyValue(fn, options) {
    options || (options = {});
    this.cid = _.uniqueId("lazyValue");
    this.valueFn = fn;
    this.context = options.context || null;
    this.morph = options.morph || null;
    this.attrMorph = options.attrMorph || null;
    _.bindAll(this, "value", "set", "addDependentValue", "addObserver", "notify", "onNotify", "destroy");
  }

  LazyValue.prototype = {
    isLazyValue: true,
    parent: null, // TODO: is parent even needed? could be modeled as a subscriber
    children: null,
    observers: null,
    cache: NIL,
    valueFn: null,
    subscribers: null, // TODO: do we need multiple subscribers?
    _childValues: null, // just for reusing the array, might not work well if children.length changes after computation

    value: function () {
      var cache = this.cache;
      if (cache !== NIL) {
        return cache;
      }

      var children = this.children;
      if (children) {
        var child,
            values = this._childValues || new Array(children.length);

        for (var i = 0, l = children.length; i < l; i++) {
          child = children[i];
          values[i] = child && child.isLazyValue ? child.value() : child;
        }

        return this.cache = this.valueFn(values);
      } else {
        return this.cache = this.valueFn(EMPTY_ARRAY);
      }
    },

    set: function (key, value, options) {
      if (this.context) {
        return this.context.set(key, value, options);
      }
      return null;
    },

    addDependentValue: function (value) {
      var children = this.children;
      if (!children) {
        children = this.children = [value];
      } else {
        children.push(value);
      }

      if (value && value.isLazyValue) {
        value.parent = this;
      }

      return this;
    },

    addObserver: function (path, context) {
      var observers = this.observers || (this.observers = []),
          position,
          res;

      if (!_.isObject(context) || !_.isString(path)) return console.error("Error adding observer for", context, path);

      // Ensure _observers exists and is an object
      context.__observers = context.__observers || {};
      // Ensure __observers[path] exists and is an array
      context.__observers[path] = context.__observers[path] || { collection: [], model: [] };

      // Save the type of object events this observer is for
      res = context.get(this.path);
      res = res && res.isCollection ? "collection" : "model";

      // Add our callback, save the position it is being inserted so we can garbage collect later.
      position = context.__observers[path][res].push(this) - 1;

      // Lazyvalue needs referance to its observers to remove listeners on destroy
      observers.push({ context: context, path: path, index: position });

      return this;
    },

    notify: function (sender) {
      // TODO: This check won't be necessary once removed DOM has been cleaned of any bindings.
      // If this lazyValue's morph does not have an immediate parentNode, it has been removed from the dom tree. Destroy it.
      // Right now, DOM that contains morphs throw an error if it is removed by another lazyvalue before those morphs re-evaluate.
      if (this.morph && this.morph.firstNode && !this.morph.firstNode.parentNode) return this.destroy();
      var cache = this.cache,
          parent,
          subscribers;

      if (cache !== NIL) {
        parent = this.parent;
        subscribers = this.subscribers;
        cache = this.cache = NIL;
        if (parent) {
          parent.notify(this);
        }
        if (!subscribers) {
          return;
        }
        for (var i = 0, l = subscribers.length; i < l; i++) {
          subscribers[i](this);
        }
      }
    },

    onNotify: function (callback) {
      var subscribers = this.subscribers || (this.subscribers = []);
      subscribers.push(callback);
      return this;
    },

    destroy: function () {
      _.each(this.children, function (child) {
        if (child && child.isLazyValue) {
          child.destroy();
        }
      });
      _.each(this.subscribers, function (subscriber) {
        if (subscriber && subscriber.isLazyValue) {
          subscriber.destroy();
        }
      });

      this.parent = this.children = this.cache = this.valueFn = this.subscribers = this._childValues = null;

      _.each(this.observers, function (observer) {
        if (_.isObject(observer.context.__observers[observer.path])) {
          delete observer.context.__observers[observer.path][observer.index];
        }
      });

      this.observers = null;
    }
  };

  module.exports = LazyValue;
});
define("rebound-data/rebound-data", ["exports", "rebound-data/model", "rebound-data/collection", "rebound-data/computed-property", "rebound-component/utils"], function (exports, _reboundDataModel, _reboundDataCollection, _reboundDataComputedProperty, _reboundComponentUtils) {
  "use strict";

  // Rebound Data
  // ----------------
  // These are methods inherited by all Rebound data types – **Models**,
  // **Collections** and **Computed Properties** – and control tree ancestry
  // tracking, deep event propagation and tree destruction.

  var Model = to5Runtime.interopRequire(_reboundDataModel);

  var Collection = to5Runtime.interopRequire(_reboundDataCollection);

  var ComputedProperty = to5Runtime.interopRequire(_reboundDataComputedProperty);

  var $ = to5Runtime.interopRequire(_reboundComponentUtils);

  var sharedMethods = {
    // When a change event propagates up the tree it modifies the path part of
    // `change:<path>` to reflect the fully qualified path relative to that object.
    // Ex: Would trigger `change:val`, `change:[0].val`, `change:arr[0].val` and `obj.arr[0].val`
    // on each parent as it is propagated up the tree.
    propagateEvent: function (type, model) {
      if (this.__parent__ === this || type === "dirty") return;
      if (type.indexOf("change:") === 0 && model.isModel) {
        if (this.isCollection && ~type.indexOf("change:[")) return;
        var key,
            path = model.__path().replace(this.__parent__.__path(), "").replace(/^\./, ""),
            changed = model.changedAttributes();

        for (key in changed) {
          // TODO: Modifying arguments array is bad. change this
          arguments[0] = "change:" + path + (path && ".") + key; // jshint ignore:line
          this.__parent__.trigger.apply(this.__parent__, arguments);
        }
        return;
      }
      return this.__parent__.trigger.apply(this.__parent__, arguments);
    },

    // Set this data object's parent to `parent` and, as long as a data object is
    // not its own parent, propagate every event triggered on `this` up the tree.
    setParent: function (parent) {
      if (this.__parent__) this.off("all", this.propagateEvent);
      this.__parent__ = parent;
      this._hasAncestry = true;
      if (parent !== this) this.on("all", this.__parent__.propagateEvent);
      return parent;
    },

    // Recursively set a data tree's root element starting with `this` to the deepest child.
    // TODO: I dont like this recursively setting elements root when one element's root changes. Fix this.
    setRoot: function (root) {
      var obj = this;
      obj.__root__ = root;
      var val = obj.models || obj.attributes || obj.cache;
      _.each(val, function (value, key) {
        if (value && value.isData) {
          value.setRoot(root);
        }
      });
      return root;
    },

    // Tests to see if `this` has a parent `obj`.
    hasParent: function (obj) {
      var tmp = this;
      while (tmp !== obj) {
        tmp = tmp.__parent__;
        if (_.isUndefined(tmp)) return false;
        if (tmp === obj) return true;
        if (tmp.__parent__ === tmp) return false;
      }
      return true;
    },

    // De-initializes a data tree starting with `this` and recursively calling `deinitialize()` on each child.
    deinitialize: function () {
      var _this = this;


      // Undelegate Backbone Events from this data object
      if (this.undelegateEvents) this.undelegateEvents();
      if (this.stopListening) this.stopListening();
      if (this.off) this.off();
      if (this.unwire) this.unwire();

      // Destroy this data object's lineage
      delete this.__parent__;
      delete this.__root__;
      delete this.__path;

      // If there is a dom element associated with this data object, destroy all listeners associated with it.
      // Remove all event listeners from this dom element, recursively remove element lazyvalues,
      // and then remove the element referance itself.
      if (this.el) {
        _.each(this.el.__listeners, function (handler, eventType) {
          if (this.el.removeEventListener) this.el.removeEventListener(eventType, handler, false);
          if (this.el.detachEvent) this.el.detachEvent("on" + eventType, handler);
        }, this);
        $(this.el).walkTheDOM(function (el) {
          if (el.__lazyValue && el.__lazyValue.destroy()) n.__lazyValue.destroy();
        });
        delete this.el.__listeners;
        delete this.el.__events;
        delete this.$el;
        delete this.el;
      }

      // Clean up Hook callback references
      delete this.__observers;

      // Mark as deinitialized so we don't loop on cyclic dependancies.
      this.deinitialized = true;

      // Destroy all children of this data object.
      // If a Collection, de-init all of its Models, if a Model, de-init all of its
      // Attributes, if a Computed Property, de-init its Cache objects.
      _.each(this.models, function (val) {
        val && val.deinitialize && val.deinitialize();
      });
      this.models && (this.models.length = 0);
      _.each(this.attributes, function (val, key) {
        delete _this.attributes[key];val && val.deinitialize && val.deinitialize();
      });
      if (this.cache) {
        this.cache.collection.deinitialize();
        this.cache.model.deinitialize();
      }
    }
  };

  // Extend all of the **Rebound Data** prototypes with these shared methods
  _.extend(Model.prototype, sharedMethods);
  _.extend(Collection.prototype, sharedMethods);
  _.extend(ComputedProperty.prototype, sharedMethods);

  exports.Model = Model;
  exports.Collection = Collection;
  exports.ComputedProperty = ComputedProperty;
});
define("rebound-component/utils", ["exports", "module"], function (exports, module) {
  "use strict";

  // Rebound Utils
  // ----------------

  var $ = function (query) {
    return new utils(query);
  };

  var utils = function (query) {
    var i,
        selector = _.isElement(query) && [query] || query === document && [document] || _.isString(query) && querySelectorAll(query) || [];
    this.length = selector.length;

    // Add selector to object for method chaining
    for (i = 0; i < this.length; i++) {
      this[i] = selector[i];
    }

    return this;
  };

  function returnFalse() {
    return false;
  }
  function returnTrue() {
    return true;
  }

  $.Event = function (src, props) {
    // Allow instantiation without the 'new' keyword
    if (!(this instanceof $.Event)) {
      return new $.Event(src, props);
    }

    // Event object
    if (src && src.type) {
      this.originalEvent = src;
      this.type = src.type;

      // Events bubbling up the document may have been marked as prevented
      // by a handler lower down the tree; reflect the correct value.
      this.isDefaultPrevented = src.defaultPrevented || src.defaultPrevented === undefined &&
      // Support: Android<4.0
      src.returnValue === false ? returnTrue : returnFalse;

      // Event type
    } else {
      this.type = src;
    }

    // Put explicitly provided properties onto the event object
    if (props) {
      _.extend(this, props);
    }

    // Copy over all original event properties
    _.extend(this, _.pick(this.originalEvent, ["altKey", "bubbles", "cancelable", "ctrlKey", "currentTarget", "eventPhase", "metaKey", "relatedTarget", "shiftKey", "target", "timeStamp", "view", "which", "char", "charCode", "key", "keyCode", "button", "buttons", "clientX", "clientY", "", "offsetX", "offsetY", "pageX", "pageY", "screenX", "screenY", "toElement"]));

    // Create a timestamp if incoming event doesn't have one
    this.timeStamp = src && src.timeStamp || new Date().getTime();

    // Mark it as fixed
    this.isEvent = true;
  };

  $.Event.prototype = {
    constructor: $.Event,
    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse,

    preventDefault: function () {
      var e = this.originalEvent;

      this.isDefaultPrevented = returnTrue;

      if (e && e.preventDefault) {
        e.preventDefault();
      }
    },
    stopPropagation: function () {
      var e = this.originalEvent;

      this.isPropagationStopped = returnTrue;

      if (e && e.stopPropagation) {
        e.stopPropagation();
      }
    },
    stopImmediatePropagation: function () {
      var e = this.originalEvent;

      this.isImmediatePropagationStopped = returnTrue;

      if (e && e.stopImmediatePropagation) {
        e.stopImmediatePropagation();
      }

      this.stopPropagation();
    }
  };


  utils.prototype = {

    // Given a valid data path, split it into an array of its parts.
    // ex: foo.bar[0].baz --> ['foo', 'var', '0', 'baz']
    splitPath: function (path) {
      path = ("." + path + ".").split(/(?:\.|\[|\])+/);
      path.pop();
      path.shift();
      return path;
    },

    // Applies function `func` depth first to every node in the subtree starting from `root`
    walkTheDOM: function (func) {
      var el,
          root,
          len = this.length;
      while (len--) {
        root = this[len];
        func(root);
        root = root.firstChild;
        while (root) {
          $(root).walkTheDOM(func);
          root = root.nextSibling;
        }
      }
    },

    // Events registry. An object containing all events bound through this util shared among all instances.
    _events: {},

    // Takes the targed the event fired on and returns all callbacks for the delegated element
    _hasDelegate: function (target, delegate, eventType) {
      var callbacks = [];

      // Get our callbacks
      if (target.delegateGroup && this._events[target.delegateGroup][eventType]) {
        _.each(this._events[target.delegateGroup][eventType], function (callbacksList, delegateId) {
          if (_.isArray(callbacksList) && (delegateId === delegate.delegateId || delegate.matchesSelector && delegate.matchesSelector(delegateId))) {
            callbacks = callbacks.concat(callbacksList);
          }
        });
      }

      return callbacks;
    },

    // Triggers an event on a given dom node
    trigger: function (eventName, options) {
      var el,
          len = this.length;
      while (len--) {
        el = this[len];
        if (document.createEvent) {
          var event = document.createEvent("HTMLEvents");
          event.initEvent(eventName, true, false);
          el.dispatchEvent(event);
        } else {
          el.fireEvent("on" + eventName);
        }
      }
    },

    off: function (eventType, handler) {
      var el,
          len = this.length,
          eventCount;

      while (len--) {
        el = this[len];
        eventCount = 0;

        if (el.delegateGroup) {
          if (this._events[el.delegateGroup][eventType] && _.isArray(this._events[el.delegateGroup][eventType][el.delegateId])) {
            _.each(this._events[el.delegateGroup][eventType], function (delegate, index, delegateList) {
              _.each(delegateList, function (callback, index, callbackList) {
                if (callback === handler) {
                  delete callbackList[index];
                  return;
                }
                eventCount++;
              });
            });
          }
        }

        // If there are no more of this event type delegated for this group, remove the listener
        if (eventCount === 0 && el.removeEventListener) {
          el.removeEventListener(eventType, handler, false);
        }
        if (eventCount === 0 && el.detachEvent) {
          el.detachEvent("on" + eventType, handler);
        }
      }
    },

    on: function (eventName, delegate, data, handler) {
      var el,
          events = this._events,
          len = this.length,
          eventNames = eventName.split(" "),
          delegateId,
          delegateGroup;

      while (len--) {
        el = this[len];

        // Normalize data input
        if (_.isFunction(delegate)) {
          handler = delegate;
          delegate = el;
          data = {};
        }
        if (_.isFunction(data)) {
          handler = data;
          data = {};
        }
        if (!_.isString(delegate) && !_.isElement(delegate)) {
          console.error("Delegate value passed to Rebound's $.on is neither an element or css selector");
          return false;
        }

        delegateId = _.isString(delegate) ? delegate : delegate.delegateId = delegate.delegateId || _.uniqueId("event");
        delegateGroup = el.delegateGroup = el.delegateGroup || _.uniqueId("delegateGroup");

        _.each(eventNames, function (eventName) {
          // Ensure event obj existance
          events[delegateGroup] = events[delegateGroup] || {};

          // TODO: take out of loop
          var callback = function (event) {
            var target, i, len, eventList, callbacks, callback, falsy;
            event = new $.Event(event || window.event); // Convert to mutable event
            target = event.target || event.srcElement;

            // Travel from target up to parent firing event on delegate when it exizts
            while (target) {
              // Get all specified callbacks (element specific and selector specified)
              callbacks = $._hasDelegate(el, target, event.type);

              len = callbacks.length;
              for (i = 0; i < len; i++) {
                event.target = event.srcElement = target; // Attach this level's target
                event.data = callbacks[i].data; // Attach our data to the event
                event.result = callbacks[i].callback.call(el, event); // Call the callback
                falsy = event.result === false ? true : falsy; // If any callback returns false, log it as falsy
              }

              // If any of the callbacks returned false, prevent default and stop propagation
              if (falsy) {
                event.preventDefault();
                event.stopPropagation();
                return false;
              }

              target = target.parentNode;
            }
          };

          // If this is the first event of its type, add the event handler
          // AddEventListener supports IE9+
          if (!events[delegateGroup][eventName]) {
            // If event is focus or blur, use capture to allow for event delegation.
            el.addEventListener(eventName, callback, eventName === "focus" || eventName === "blur");
          }


          // Add our listener
          events[delegateGroup][eventName] = events[delegateGroup][eventName] || {};
          events[delegateGroup][eventName][delegateId] = events[delegateGroup][eventName][delegateId] || [];
          events[delegateGroup][eventName][delegateId].push({ callback: handler, data: data });
        }, this);
      }
    },

    flatten: function (data) {
      var recurse = function (cur, prop) {
        if (Object(cur) !== cur) {
          result[prop] = cur;
        } else if (Array.isArray(cur)) {
          for (var i = 0, l = cur.length; i < l; i++) recurse(cur[i], prop + "[" + i + "]");
          if (l === 0) result[prop] = [];
        } else {
          var isEmpty = true;
          for (var p in cur) {
            isEmpty = false;
            recurse(cur[p], prop ? prop + "." + p : p);
          }
          if (isEmpty && prop) result[prop] = {};
        }
      };

      var result = {};
      recurse(data, "");
      return result;
    },

    unMarkLinks: function () {
      var links = this[0].querySelectorAll("a[href=\"/" + Backbone.history.fragment + "\"]");
      for (var i = 0; i < links.length; i++) {
        links.item(i).classList.remove("active");
        links.item(i).active = false;
      }
    },
    markLinks: function () {
      var links = this[0].querySelectorAll("a[href=\"/" + Backbone.history.fragment + "\"]");
      for (var i = 0; i < links.length; i++) {
        links.item(i).classList.add("active");
        links.item(i).active = true;
      }
    },

    // http://krasimirtsonev.com/blog/article/Cross-browser-handling-of-Ajax-requests-in-absurdjs
    ajax: function (ops) {
      if (typeof ops == "string") ops = { url: ops };
      ops.url = ops.url || "";
      ops.json = ops.json || true;
      ops.method = ops.method || "get";
      ops.data = ops.data || {};
      var getParams = function (data, url) {
        var arr = [],
            str;
        for (var name in data) {
          arr.push(name + "=" + encodeURIComponent(data[name]));
        }
        str = arr.join("&");
        if (str !== "") {
          return url ? url.indexOf("?") < 0 ? "?" + str : "&" + str : str;
        }
        return "";
      };
      var api = {
        host: {},
        process: function (ops) {
          var self = this;
          this.xhr = null;
          if (window.ActiveXObject) {
            this.xhr = new ActiveXObject("Microsoft.XMLHTTP");
          } else if (window.XMLHttpRequest) {
            this.xhr = new XMLHttpRequest();
          }
          if (this.xhr) {
            this.xhr.onreadystatechange = function () {
              if (self.xhr.readyState == 4 && self.xhr.status == 200) {
                var result = self.xhr.responseText;
                if (ops.json === true && typeof JSON != "undefined") {
                  result = JSON.parse(result);
                }
                self.doneCallback && self.doneCallback.apply(self.host, [result, self.xhr]);
                ops.success && ops.success.apply(self.host, [result, self.xhr]);
              } else if (self.xhr.readyState == 4) {
                self.failCallback && self.failCallback.apply(self.host, [self.xhr]);
                ops.error && ops.error.apply(self.host, [self.xhr]);
              }
              self.alwaysCallback && self.alwaysCallback.apply(self.host, [self.xhr]);
              ops.complete && ops.complete.apply(self.host, [self.xhr]);
            };
          }
          if (ops.method == "get") {
            this.xhr.open("GET", ops.url + getParams(ops.data, ops.url), true);
            this.setHeaders({
              "X-Requested-With": "XMLHttpRequest"
            });
          } else {
            this.xhr.open(ops.method, ops.url, true);
            this.setHeaders({
              "X-Requested-With": "XMLHttpRequest",
              "Content-type": "application/x-www-form-urlencoded"
            });
          }
          if (ops.headers && typeof ops.headers == "object") {
            this.setHeaders(ops.headers);
          }
          setTimeout(function () {
            ops.method == "get" ? self.xhr.send() : self.xhr.send(getParams(ops.data));
          }, 20);
          return this.xhr;
        },
        done: function (callback) {
          this.doneCallback = callback;
          return this;
        },
        fail: function (callback) {
          this.failCallback = callback;
          return this;
        },
        always: function (callback) {
          this.alwaysCallback = callback;
          return this;
        },
        setHeaders: function (headers) {
          for (var name in headers) {
            this.xhr && this.xhr.setRequestHeader(name, headers[name]);
          }
        }
      };
      return api.process(ops);
    }
  };

  _.extend($, utils.prototype);



  module.exports = $;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByb3BlcnR5LWNvbXBpbGVyL3Byb3BlcnR5LWNvbXBpbGVyLmpzIiwicmVib3VuZC1jb21wb25lbnQvY29tcG9uZW50LmpzIiwicmVib3VuZC1kYXRhL2NvbGxlY3Rpb24uanMiLCJyZWJvdW5kLXByZWNvbXBpbGVyL3JlYm91bmQtcHJlY29tcGlsZXIuanMiLCJyZWJvdW5kLXJvdXRlci9yZWJvdW5kLXJvdXRlci5qcyIsInJ1bnRpbWUuanMiLCJyZWJvdW5kLWNvbXBpbGVyL3JlYm91bmQtY29tcGlsZXIuanMiLCJwcm9wZXJ0eS1jb21waWxlci90b2tlbml6ZXIuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9oZWxwZXJzLmpzIiwicmVib3VuZC1kYXRhL2NvbXB1dGVkLXByb3BlcnR5LmpzIiwicmVib3VuZC1jb21wb25lbnQvaG9va3MuanMiLCJyZWJvdW5kLWRhdGEvbW9kZWwuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9sYXp5LXZhbHVlLmpzIiwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YS5qcyIsInJlYm91bmQtY29tcG9uZW50L3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztNQUdPLFNBQVM7O0FBRWhCLE1BQUksa0JBQWtCLEdBQUcsRUFBRSxDQUFDOzs7O0FBSTVCLFdBQVMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUIsUUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDOztBQUVoQixRQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDOztBQUV2QyxRQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFOztBQUNyQixhQUFTLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFDbkMsTUFBTSxHQUFHLEVBQUU7UUFDWCxLQUFLO1FBQ0wsYUFBYSxHQUFHLEVBQUU7UUFDbEIsVUFBVSxHQUFHLEVBQUU7UUFDZixPQUFPLEdBQUcsRUFBRTtRQUNaLEtB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QUcsR0FBRyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBQztNQUFFLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ3JGLE1BQUksUUFBUSxHQUFHLEVBQUMsT0FBTyxFQUFFLFNBQVMsRUFBQztNQUFFLElBQUksR0FBRyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBQztNQUFFLFNBQVMsR0FBRyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUMsQ0FBQztBQUM5RyxNQUFJLEdBQUcsR0FBRyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFDLENBQUM7QUFDMUcsTUFBSSxNQUFNLEdBQUcsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7TUFBRSxJQUFJLEdBQUcsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDO01BQUUsSUFBSSxHQUFHLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFDO0FBQ3BHLE1BQUksSUFBSSxHQUFHLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQztNQUFFLE1BQU0sR0FBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUMsQ0FBQztBQUN6RCxNQUFJLE1BQU0sR0FBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBQztNQUFFLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUM7TUFBRSxJQUFJLEdBQUcsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUNwSCxNQUFJLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUMsQ0FBQzs7OztBQUk5QixNQUFJLEtB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UyxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCckksTUFBSSxNQUFNLEdBQUcsRUFBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7TUFBRSxHQUFHLEdBQUcsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUNyRixNQUFJLE9BQU8sR0FBRyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ2pELE1BQUksT0FBTyxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUN4RyxNQUFJLFVBQVUsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQzlDLE1BQUksV0FBVyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDL0MsTUFBSSxVQUFVLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUM5QyxNQUFJLFdBQVcsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQy9DLE1BQUksV0FBVyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDL0MsTUFBSSxTQUFTLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUM3QyxNQUFJLFdBQVcsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQy9DLE1BQUksU0FBUyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDN0MsTUFBSSxRQUFRLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQzFELE1BQUksZUFBZSxHQUFHLEVBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7Ozs7O0FBS3BELFNBQU8sQ0FBQyxRQUFRLEdBQUcsRUFBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTztBQUMxRSxVQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNO0FBQzNFLE9BQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUc7QUFDM0UsUUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFDLENBQUM7QUFDekYsT0FBSyxJQUFJLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDOzs7Ozs7Ozs7OztBQVczRSxXQUFTLGFBQWEsQ0FBQyxLQUFLLEVBQUU7b0JBVzVCLFVBQW1CLEdBQUcsRUFBRTtBQUN0QixVQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ2xGLE9BQUMsSUFBSSxjQUFjLENBQUM7QUFDcEIsV0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNqRixPQUFDLElBQUksMkJBQTJCLENBQUM7S0FDbEM7O0FBZkQsU0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekIsUUFBSSxDQUFDLEdBQUcsRUFBRTtRQUFFLElBQUksR0FBRyxFQUFFLENBQUM7QUFDdEIsT0FBRyxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO0FBQzFDLFdBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUNsQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtBQUN4QyxZQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLGlCQUFTLEdBQUcsQ0FBQztPQUNkO0FBQ0gsVUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkI7Ozs7OztBQVdELFFBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDbkIsVUFBSSxDQUFDLElBQUksQ0FBQyxVQUFTLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFBQyxlQUFPLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztPQUFDLENBQUMsQ0FBQztBQUN4RCxPQUFDLElBQUkscUJBQXFCLENBQUM7QUFDM0IsV0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7QUFDcEMsWUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLFNBQUMsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7QUFDbkMsaUJBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUNoQjtBQUNELE9BQUMsSUFBSSxHQUFHLENBQUM7OztLQUlWLE1BQU07QUFDTCxlQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbEI7QUFDRCxXQUFPLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztHQUMvQjs7OztBQUlELE1BQUksZUFBZSxHQUFHLGFBQWEsQ0FBQyxxTkFBcU4sQ0FBQyxDQUFDOzs7O0FBSTNQLE1BQUksZUFBZSxHQUFHLGFBQWEsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDOzs7O0FBSXBGLE1BQUksb0JBQW9CLEdBQUcsYUFBYSxDQUFDLHdFQUF3RSxDQUFDLENBQUM7Ozs7QUFJbkgsTUFBSSxpQkFBaUIsR0FBRyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7OztBQUl4RCxNQUFJLG9CQUFvQixHQUFHLDZLQUE2SyxDQUFDOztBQUV6TSxNQUFJLHFCQUFxQixHQUFHLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDOztBQUVoRSxNQUFJLGNBQWMsR0FBRyxhQUFhLENBQUMsb0JBQW9CLEdBQUcsWUFBWSxDQUFDLENBQUM7O0FBRXhFLE1BQUksU0FBUyxHQUFHLHFCQUFxQixDQUFDOzs7Ozs7Ozs7QUFTdEMsTUFBSSxrQkFBa0IsR0FBRyxxREFBcUQsQ0FBQztBQUMvRSxNQUFJLDRCQUE0QixHQUFHLGs1QkFBc21JLENBQUM7QUFDMW9JLE1BQUksdUJBQXVCLEdBQUcsaWVBQTBvRSxDQUFDO0FBQ3pxRSxNQUFJLHVCQUF1QixHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsR0FBRyw0QkFBNEIsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUNuRixNQUFJLGtCQUFrQixHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsR0FBRyw0QkFBNEIsR0FBRyx1QkFBdUIsR0FBRyxHQUFHLENBQUMsQ0FBQzs7OztBQUl4RyxNQUFJLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQzs7Ozs7QUFLbkMsTUFBSSxTQUFTLEdBQUcsMEJBQTBCLENBQUM7Ozs7QUFJM0MsTUFBSSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsaUJBQWlCLEdBQUcsVUFBUyxJQUFJLEVBQUU7QUFDakUsUUFBSSxJQUFJLEdBQUcsRUFBRSxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNsQyxRQUFJLElBQUksR0FBRyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDM0IsUUFBSSxJQUFJLEdBQUcsRUFBRSxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNsQyxRQUFJLElBQUksR0FBRyxHQUFHLEVBQUMsT0FBTyxJQUFJLENBQUM7QUFDM0IsV0FBTyxJQUFJLElBQUksR0FBSSxJQUFJLHVCQUF1QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7R0FDaEYsQ0FBQzs7OztBQUlGLE1BQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixHQUFHLFVBQVMsSUFBSSxFQUFFO0FBQy9ELFFBQUksSUFBSSxHQUFHLEVBQUUsRUFBRSxPQUFPLElBQUksS0FBSyxFQUFFLENBQUM7QUFDbEMsUUFBSSxJQUFJLEdBQUcsRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDO0FBQzNCLFFBQUksSUFBSSxHQUFHLEVBQUUsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUM1QixRQUFJLElBQUksR0FBRyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDM0IsUUFBSSxJQUFJLEdBQUcsRUFBRSxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNsQyxRQUFJLElBQUksR0FBRyxHQUFHLEVBQUMsT0FBTyxJQUFJLENBQUM7QUFDM0IsV0FBTyxJQUFJLElBQUksR0FBSSxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7R0FDM0UsQ0FBQzs7Ozs7OztBQU9GLFdBQVMsUUFBUSxHQUFHO0FBQ2xCLFFBQUksQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO0FBQ3ZCLFFBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxHQUFHLFlBQVksQ0FBQztHQUNyQzs7OztBQUlELFdBQVMsY0FBYyxHQUFHO0FBQ3hCLGNBQVUsR0FBRyxDQUFDLENBQUM7QUFDZixVQUFNLEdBQUcsWUFBWSxHQUFHLENBQUMsQ0FBQztBQUMxQixvQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDeEIsYUFBUyxFQUFFLENBQUM7R0FDYjs7Ozs7O0FBTUQsV0FBUyxXQUFXLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtBQUM5QixVQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ2hCLFFBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxTQUFTLEdBQUcsSUFBSSxRQUFRLEVBQUEsQ0FBQztBQUNoRCxXQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ2YsYUFBUyxFQUFFLENBQUM7QUFDWixVQUFNLEdBQUcsR0FBRyxDQUFDO0FBQ2Isb0JBQWdCLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztHQUNwQzs7QUFFRCxXQUFTLGdCQUFnQixHQUFHO0FBQzFCLFFBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJLFFBQVEsRUFBQSxDQUFDO0FBQ3RFLFFBQUksS0FBSyxHQUFHLE1BQU07UUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzNELFFBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLHNCQUFzQixDQUFDLENBQUM7QUFDMUQsVUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDakIsUUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO0FBQ3JCLGVBQVMsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO0FBQzVCLFVBQUksS0FBSyxDQUFDO0FBQ1YsYUFBTyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBLElBQUssS0FBSyxDQUFDLEtBQUssR0FBRyxNQUFNLEVBQUU7QUFDOUQsVUFBRSxVQUFVLENBQUM7QUFDYixvQkFBWSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztPQUM5QztLQUNGO0FBQ0QsUUFBSSxPQUFPLENBQUMsU0FBUyxFQUNuQixPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFDaEQsUUFBUSxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxRQUFRLEVBQUEsQ0FBQyxDQUFDO0dBQ2xFOztBQUVELFdBQVMsZUFBZSxHQUFHO0FBQ3pCLFFBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQztBQUNuQixRQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxRQUFRLEVBQUEsQ0FBQztBQUN0RSxRQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBRSxDQUFDLENBQUMsQ0FBQztBQUNyQyxXQUFPLE1BQU0sR0FBRyxRQUFRLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtBQUNoRixRQUFFLE1BQU0sQ0FBQztBQUNULFFBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQy9CO0FBQ0QsUUFBSSxPQUFPLENBQUMsU0FBUyxFQUNuQixPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFDcEQsUUFBUSxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxRQUFRLEVBQUEsQ0FBQyxDQUFDO0dBQ2xFOzs7OztBQUtELFdBQVMsU0FBUyxHQUFHO0FBQ25CLFdBQU8sTUFBTSxHQUFHLFFBQVEsRUFBRTtBQUN4QixVQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLFVBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTs7QUFDYixVQUFFLE1BQU0sQ0FBQztPQUNWLE1BQU0sSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO0FBQ3BCLFVBQUUsTUFBTSxDQUFDO0FBQ1QsWUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNwQyxZQUFJLElBQUksS0FBSyxFQUFFLEVBQUU7QUFDZixZQUFFLE1BQU0sQ0FBQztTQUNWO0FBQ0QsWUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO0FBQ3JCLFlBQUUsVUFBVSxDQUFDO0FBQ2Isc0JBQVksR0FBRyxNQUFNLENBQUM7U0FDdkI7T0FDRixNQUFNLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssSUFBSSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUU7QUFDbEQsVUFBRSxNQUFNLENBQUM7QUFDVCxZQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUU7QUFDckIsWUFBRSxVQUFVLENBQUM7QUFDYixzQkFBWSxHQUFHLE1BQU0sQ0FBQztTQUN2QjtPQUNGLE1BQU0sSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7QUFDNUIsVUFBRSxNQUFNLENBQUM7T0FDVixNQUFNLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTs7QUFDcEIsWUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsWUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFOztBQUNmLDBCQUFnQixFQUFFLENBQUM7U0FDcEIsTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUU7O0FBQ3RCLHlCQUFlLEVBQUUsQ0FBQztTQUNuQixNQUFNLE1BQU07T0FDZCxNQUFNLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTs7QUFDckIsVUFBRSxNQUFNLENBQUM7T0FDVixNQUFNLElBQUksRUFBRSxJQUFJLElBQUksSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO0FBQ3pFLFVBQUUsTUFBTSxDQUFDO09BQ1YsTUFBTTtBQUNMLGNBQU07T0FDUDtLQUNGO0dBQ0Y7Ozs7Ozs7Ozs7Ozs7O0FBY0QsV0FBUyxhQUFhLEdBQUc7QUFDdkIsUUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsUUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLEVBQUUsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEQsUUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDekMsUUFBSSxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSxJQUFJLEtBQUssS0FBSyxFQUFFLEVBQUU7O0FBQzNELFlBQU0sSUFBSSxDQUFDLENBQUM7QUFDWixhQUFPLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUMvQixNQUFNO0FBQ0wsUUFBRSxNQUFNLENBQUM7QUFDVCxhQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMxQjtHQUNGOztBQUVELFdBQVMsZUFBZSxHQUFHOztBQUN6QixRQUFJLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4QyxRQUFJLGdCQUFnQixFQUFFO0FBQUMsUUFBRSxNQUFNLENBQUMsQUFBQyxPQUFPLFVBQVUsRUFBRSxDQUFDO0tBQUM7QUFDdEQsUUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM3QyxXQUFPLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDNUI7O0FBRUQsV0FBUyxxQkFBcUIsR0FBRzs7QUFDL0IsUUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsUUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM3QyxXQUFPLFFBQVEsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDckM7O0FBRUQsV0FBUyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUU7O0FBQ2hDLFFBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLFFBQUksSUFBSSxLQUFLLElBQUksRUFBRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLEtBQUssR0FBRyxHQUFHLFVBQVUsR0FBRyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0UsUUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM3QyxXQUFPLFFBQVEsQ0FBQyxJQUFJLEtBQUssR0FBRyxHQUFHLFVBQVUsR0FBRyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDN0Q7O0FBRUQsV0FBUyxlQUFlLEdBQUc7O0FBQ3pCLFFBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLFFBQUksSUFBSSxLQUFLLEVBQUUsRUFBRSxPQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDN0MsV0FBTyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO0dBQ2pDOztBQUVELFdBQVMsa0JBQWtCLENBQUMsSUFBSSxFQUFFOztBQUNoQyxRQUFJLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4QyxRQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDakIsVUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFDaEQsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFOztBQUU5QyxjQUFNLElBQUksQ0FBQyxDQUFDO0FBQ1osdUJBQWUsRUFBRSxDQUFDO0FBQ2xCLGlCQUFTLEVBQUUsQ0FBQztBQUNaLGVBQU8sU0FBUyxFQUFFLENBQUM7T0FDcEI7QUFDRCxhQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDN0I7QUFDRCxRQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzdDLFdBQU8sUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztHQUM5Qjs7QUFFRCxXQUFTLGVBQWUsQ0FBQyxJQUFJLEVBQUU7O0FBQzdCLFFBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLFFBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNiLFFBQUksSUFBSSxLQUFLLElBQUksRUFBRTtBQUNqQixVQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsRSxVQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQy9FLGFBQU8sUUFBUSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNsQztBQUNELFFBQUksSUFBSSxJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFDOUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFOztBQUV0QyxZQUFNLElBQUksQ0FBQyxDQUFDO0FBQ1oscUJBQWUsRUFBRSxDQUFDO0FBQ2xCLGVBQVMsRUFBRSxDQUFDO0FBQ1osYUFBTyxTQUFTLEVBQUUsQ0FBQztLQUNwQjtBQUNELFFBQUksSUFBSSxLQUFLLEVBQUUsRUFDYixJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDckQsV0FBTyxRQUFRLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQ3BDOztBQUVELFdBQVMsaUJBQWlCLENBQUMsSUFBSSxFQUFFOztBQUMvQixRQUFJLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4QyxRQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsT0FBTyxRQUFRLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDekYsV0FBTyxRQUFRLENBQUMsSUFBSSxLQUFLLEVBQUUsR0FBRyxHQUFHLEdBQUcsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0dBQ2pEOztBQUVELFdBQVMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFO0FBQzlCLFlBQU8sSUFBSTs7O0FBR1gsV0FBSyxFQUFFOztBQUNMLGVBQU8sYUFBYSxFQUFFLENBQUM7O0FBQUE7QUFHekIsV0FBSyxFQUFFO0FBQUUsVUFBRSxNQUFNLENBQUMsQUFBQyxPQUFPLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUFBLEFBQy9DLFdBQUssRUFBRTtBQUFFLFVBQUUsTUFBTSxDQUFDLEFBQUMsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7QUFBQSxBQUMvQyxXQUFLLEVBQUU7QUFBRSxVQUFFLE1BQU0sQ0FBQyxBQUFDLE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQUEsQUFDN0MsV0FBSyxFQUFFO0FBQUUsVUFBRSxNQUFNLENBQUMsQUFBQyxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUFBLEFBQzlDLFdBQUssRUFBRTtBQUFFLFVBQUUsTUFBTSxDQUFDLEFBQUMsT0FBTyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7QUFBQSxBQUNqRCxXQUFLLEVBQUU7QUFBRSxVQUFFLE1BQU0sQ0FBQyxBQUFDLE9BQU8sV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQUEsQUFDakQsV0FBSyxHQUFHO0FBQUUsVUFBRSxNQUFNLENBQUMsQUFBQyxPQUFPLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUFBLEFBQ2hELFdBQUssR0FBRztBQUFFLFVBQUUsTUFBTSxDQUFDLEFBQUMsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7QUFBQSxBQUNoRCxXQUFLLEVBQUU7QUFBRSxVQUFFLE1BQU0sQ0FBQyxBQUFDLE9BQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQUEsQUFDOUMsV0FBSyxFQUFFO0FBQUUsVUFBRSxNQUFNLENBQUMsQUFBQyxPQUFPLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFBQTtBQUdqRCxXQUFLLEVBQUU7O0FBQ0wsWUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsWUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsT0FBTyxhQUFhLEVBQUUsQ0FBQztBQUFBOzs7QUFJMUQsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7QUFBQyxBQUFDLFdBQUssRUFBRTtBQUFDLEFBQUMsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7QUFBQyxBQUFDLFdBQUssRUFBRTtBQUFDLEFBQUMsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7QUFBQyxBQUFDLFdBQUssRUFBRTs7QUFDN0UsZUFBTyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBQUE7QUFHM0IsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7O0FBQ2QsZUFBTyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBQUE7Ozs7O0FBTzFCLFdBQUssRUFBRTs7QUFDTCxlQUFPLGVBQWUsRUFBRSxDQUFDOztBQUFBLEFBRTNCLFdBQUssRUFBRTtBQUFDLEFBQUMsV0FBSyxFQUFFOztBQUNkLGVBQU8scUJBQXFCLEVBQUUsQ0FBQzs7QUFBQSxBQUVqQyxXQUFLLEdBQUc7QUFBQyxBQUFDLFdBQUssRUFBRTs7QUFDZixlQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDOztBQUFBLEFBRWxDLFdBQUssRUFBRTs7QUFDTCxlQUFPLGVBQWUsRUFBRSxDQUFDOztBQUFBLEFBRTNCLFdBQUssRUFBRTtBQUFDLEFBQUMsV0FBSyxFQUFFOztBQUNkLGVBQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBQUEsQUFFbEMsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7O0FBQ2QsZUFBTyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBQUEsQUFFL0IsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7O0FBQ2QsZUFBTyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFBQSxBQUVqQyxXQUFLLEdBQUc7O0FBQ04sZUFBTyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQUEsS0FDN0I7O0FBRUQsV0FBTyxLQUFLLENBQUM7R0FDZDs7QUFFRCxXQUFTLFNBQVMsQ0FBQyxXQUFXLEVBQUU7QUFDOUIsUUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFRLEdBQUcsTUFBTSxDQUFDLEtBQy9CLE1BQU0sR0FBRyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLFFBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxXQUFXLEdBQUcsSUFBSSxRQUFRLEVBQUEsQ0FBQztBQUNsRCxRQUFJLFdBQVcsRUFBRSxPQUFPLFVBQVUsRUFBRSxDQUFDO0FBQ3JDLFFBQUksTUFBTSxJQUFJLFFBQVEsRUFBRSxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFakQsUUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7O0FBR3BDLFFBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLEVBQUUsVUFBQSxFQUFZLE9BQU8sUUFBUSxFQUFFLENBQUM7O0FBRXhFLFFBQUksR0FBRyxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVqQyxRQUFJLEdBQUcsS0FBSyxLQUFLLEVBQUU7OztBQUdqQixVQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25DLFVBQUksRUFBRSxLQUFLLElBQUksSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxRQUFRLEVBQUUsQ0FBQztBQUN2RSxXQUFLLENBQUMsTUFBTSxFQUFFLHdCQUF3QixHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztLQUNwRDtBQUNELFdBQU8sR0FBRyxDQUFDO0dBQ1o7O0FBRUQsV0FBUyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRTtBQUM1QixRQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDN0MsVUFBTSxJQUFJLElBQUksQ0FBQztBQUNmLGVBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDeEI7Ozs7O0FBS0QsV0FBUyxVQUFVLEdBQUc7QUFDcEIsUUFBSSxPQUFPLEdBQUcsRUFBRTtRQUFFLE9BQU87UUFBRSxPQUFPO1FBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQztBQUNuRCxhQUFTO0FBQ1AsVUFBSSxNQUFNLElBQUksUUFBUSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztBQUN4RSxVQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFVBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLGlDQUFpQyxDQUFDLENBQUM7QUFDdEUsVUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNaLFlBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQzFCLElBQUksRUFBRSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsT0FBTyxHQUFHLEtBQUssQ0FBQyxLQUMzQyxJQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTTtBQUN2QyxlQUFPLEdBQUcsRUFBRSxLQUFLLElBQUksQ0FBQztPQUN2QixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDdkIsUUFBRSxNQUFNLENBQUM7S0FDVjtBQUNELFFBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3pDLE1BQUUsTUFBTSxDQUFDOzs7QUFHVCxRQUFJLElBQUksR0FBRyxTQUFTLEVBQUUsQ0FBQztBQUN2QixRQUFJLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO0FBQ3RGLFFBQUk7QUFDRixVQUFJLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdkMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNWLFVBQUksQ0FBQyxZQUFZLFdBQVcsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLG9DQUFvQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM3RixXQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDVjtBQUNELFdBQU8sV0FBVyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztHQUNwQzs7Ozs7O0FBTUQsV0FBUyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtBQUMzQixRQUFJLEtBQUssR0FBRyxNQUFNO1FBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUM5QixTQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxRQUFRLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7QUFDNUQsVUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7VUFBRSxHQUFHLENBQUM7QUFDekMsVUFBSSxJQUFJLElBQUksRUFBRSxFQUFFLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztXQUNoQyxJQUFJLElBQUksSUFBSSxFQUFFLEVBQUUsR0FBRyxHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1dBQ3JDLElBQUksSUFBSSxJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxFQUFFLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1dBQzlDLEdBQUcsR0FBRyxRQUFRLENBQUM7QUFDcEIsVUFBSSxHQUFHLElBQUksS0FBSyxFQUFFLE1BQU07QUFDeEIsUUFBRSxNQUFNLENBQUM7QUFDVCxXQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUM7S0FDN0I7QUFDRCxRQUFJLE1BQU0sS0FBSyxLQUFLLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxNQUFNLEdBQUcsS0FBSyxLQUFLLEdBQUcsRUFBRSxPQUFPLElBQUksQ0FBQzs7QUFFM0UsV0FBTyxLQUFLLENBQUM7R0FDZDs7QUFFRCxXQUFTLGFBQWEsR0FBRztBQUN2QixVQUFNLElBQUksQ0FBQyxDQUFDO0FBQ1osUUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3RCLFFBQUksR0FBRyxJQUFJLElBQUksRUFBRSxLQUFLLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0FBQ3BFLFFBQUksaUJBQWlCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztBQUNuRyxXQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDL0I7Ozs7QUFJRCxXQUFTLFVBQVUsQ0FBQyxhQUFhLEVBQUU7QUFDakMsUUFBSSxLQUFLLEdBQUcsTUFBTTtRQUFFLE9BQU8sR0FBRyxLQUFLO1FBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzdFLFFBQUksQ0FBQyxhQUFhLElBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDM0UsUUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsRUFBRTtBQUNuQyxRQUFFLE1BQU0sQ0FBQztBQUNULGFBQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNaLGFBQU8sR0FBRyxJQUFJLENBQUM7S0FDaEI7QUFDRCxRQUFJLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BDLFFBQUksSUFBSSxLQUFLLEVBQUUsSUFBSSxJQUFJLEtBQUssR0FBRyxFQUFFOztBQUMvQixVQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLFVBQUksSUFBSSxLQUFLLEVBQUUsSUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDO0FBQ3pDLFVBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDekQsYUFBTyxHQUFHLElBQUksQ0FBQztLQUNoQjtBQUNELFFBQUksaUJBQWlCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsa0NBQWtDLENBQUMsQ0FBQzs7QUFFbkcsUUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDO1FBQUUsR0FBRyxDQUFDO0FBQzFDLFFBQUksT0FBTyxFQUFFLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsS0FDOUIsSUFBSSxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUN4RCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxLQUMvRCxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM1QixXQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDL0I7Ozs7QUFJRCxXQUFTLFVBQVUsQ0FBQyxLQUFLLEVBQUU7QUFDekIsVUFBTSxFQUFFLENBQUM7QUFDVCxRQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDYixhQUFTO0FBQ1AsVUFBSSxNQUFNLElBQUksUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsOEJBQThCLENBQUMsQ0FBQztBQUN4RSxVQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLFVBQUksRUFBRSxLQUFLLEtBQUssRUFBRTtBQUNoQixVQUFFLE1BQU0sQ0FBQztBQUNULGVBQU8sV0FBVyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztPQUNsQztBQUNELFVBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTs7QUFDYixVQUFFLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2hDLFlBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUQsWUFBSSxLQUFLLEVBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixlQUFPLEtBQUssSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyRSxZQUFJLEtBQUssS0FBSyxHQUFHLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQztBQUNoQyxVQUFFLE1BQU0sQ0FBQztBQUNULFlBQUksS0FBSyxFQUFFO0FBQ1QsY0FBSSxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsOEJBQThCLENBQUMsQ0FBQztBQUM5RCxhQUFHLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsZ0JBQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztTQUM1QixNQUFNO0FBQ0wsa0JBQVEsRUFBRTtBQUNWLGlCQUFLLEdBQUc7QUFBRSxpQkFBRyxJQUFJLElBQUksQ0FBQyxBQUFDLE1BQU07QUFDN0IsaUJBQUssR0FBRztBQUFFLGlCQUFHLElBQUksSUFBSSxDQUFDLEFBQUMsTUFBTTtBQUM3QixpQkFBSyxHQUFHO0FBQUUsaUJBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUMsTUFBTTtBQUM1RCxpQkFBSyxHQUFHO0FBQUUsaUJBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUMsTUFBTTtBQUM1RCxpQkFBSyxFQUFFO0FBQUUsaUJBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUMsTUFBTTtBQUMzRCxpQkFBSyxHQUFHO0FBQUUsaUJBQUcsSUFBSSxJQUFJLENBQUMsQUFBQyxNQUFNO0FBQzdCLGlCQUFLLEVBQUU7QUFBRSxpQkFBRyxJQUFJLElBQUksQ0FBQyxBQUFDLE1BQU07QUFDNUIsaUJBQUssR0FBRztBQUFFLGlCQUFHLElBQUksUUFBUSxDQUFDLEFBQUMsTUFBTTtBQUNqQyxpQkFBSyxHQUFHO0FBQUUsaUJBQUcsSUFBSSxJQUFJLENBQUMsQUFBQyxNQUFNO0FBQzdCLGlCQUFLLEVBQUU7QUFBRSxpQkFBRyxJQUFJLFFBQUksQ0FBQyxBQUFDLE1BQU07QUFDNUIsaUJBQUssRUFBRTtBQUFFLGtCQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDOztBQUV2RCxpQkFBSyxFQUFFOztBQUNMLGtCQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUU7QUFBRSw0QkFBWSxHQUFHLE1BQU0sQ0FBQyxBQUFDLEVBQUUsVUFBVSxDQUFDO2VBQUU7QUFDL0Qsb0JBQU07QUFBQSxBQUNSO0FBQVMsaUJBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEFBQUMsTUFBTTtBQUFBLFdBQzlDO1NBQ0Y7T0FDRixNQUFNO0FBQ0wsWUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsOEJBQThCLENBQUMsQ0FBQztBQUMxRyxXQUFHLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMvQixVQUFFLE1BQU0sQ0FBQztPQUNWO0tBQ0Y7R0FDRjs7OztBQUlELFdBQVMsV0FBVyxDQUFDLEdBQUcsRUFBRTtBQUN4QixRQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLFFBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLCtCQUErQixDQUFDLENBQUM7QUFDakUsV0FBTyxDQUFDLENBQUM7R0FDVjs7Ozs7O0FBTUQsTUFBSSxXQUFXLENBQUM7Ozs7Ozs7O0FBUWhCLFdBQVMsU0FBUyxHQUFHO0FBQ25CLGVBQVcsR0FBRyxLQUFLLENBQUM7QUFDcEIsUUFBSSxJQUFJO1FBQUUsS0FBSyxHQUFHLElBQUk7UUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDO0FBQ3ZDLGFBQVM7QUFDUCxVQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLFVBQUksZ0JBQWdCLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDeEIsWUFBSSxXQUFXLEVBQUUsSUFBSSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUMsVUFBRSxNQUFNLENBQUM7T0FDVixNQUFNLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTs7QUFDcEIsWUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDcEQsbUJBQVcsR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRztBQUNuQyxlQUFLLENBQUMsTUFBTSxFQUFFLDJDQUEyQyxDQUFDLENBQUM7QUFDN0QsVUFBRSxNQUFNLENBQUM7QUFDVCxZQUFJLEdBQUcsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsWUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0QyxZQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLHdCQUF3QixDQUFDLENBQUM7QUFDekQsWUFBSSxFQUFFLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEVBQzNELEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLHdCQUF3QixDQUFDLENBQUM7QUFDOUMsWUFBSSxJQUFJLE1BQU0sQ0FBQztPQUNoQixNQUFNO0FBQ0wsY0FBTTtPQUNQO0FBQ0QsV0FBSyxHQUFHLEtBQUssQ0FBQztLQUNmO0FBQ0QsV0FBTyxXQUFXLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0dBQ3hEOzs7OztBQUtELFdBQVMsUUFBUSxHQUFHO0FBQ2xCLFFBQUksSUFBSSxHQUFHLFNBQVMsRUFBRSxDQUFDO0FBQ3ZCLFFBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNqQixRQUFJLENBQUMsV0FBVyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFDakMsSUFBSSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QixXQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDaEM7OzttQkFHWSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFOzs7Ozs7OztNQzc1QnRDLFNBQVM7O01BQ1QsQ0FBQzs7Ozs7QUFHUixNQUFJLE9BQU8sR0FBSSxFQUFFO01BQ2IsUUFBUSxHQUFHLEVBQUUsQ0FBQzs7QUFFbEIsU0FBTyxDQUFDLGVBQWUsR0FBRyxVQUFTLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDNUMsUUFBRyxJQUFJLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUM7QUFDckQsY0FBUSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztLQUN2QjtHQUNGLENBQUM7OztBQUdGLFNBQU8sQ0FBQyxZQUFZLEdBQUcsVUFBUyxJQUFJLEVBQUUsR0FBRyxFQUFFO0FBQ3pDLEFBQUMsT0FBRyxJQUFJLEdBQUcsQ0FBQyxPQUFPLEtBQU0sR0FBRyxHQUFHLEVBQUMsT0FBTyxFQUFDLEVBQUUsRUFBQyxDQUFBLEFBQUMsQ0FBQzs7QUFFN0MsUUFBRyxJQUFJLEtBQUssV0FBVyxFQUFFO0FBQUUsYUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0tBQUU7QUFDbkQsUUFBRyxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQUUsYUFBTyxJQUFJLE1BQUcsQ0FBQztLQUFFO0FBQ3JDLFFBQUcsSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUFFLGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztLQUFFO0FBQzdDLFFBQUcsSUFBSSxLQUFLLE1BQU0sRUFBRTtBQUFFLGFBQU8sSUFBSSxDQUFDLElBQUksQ0FBQztLQUFFO0FBQ3pDLFFBQUcsSUFBSSxLQUFLLFNBQVMsRUFBRTtBQUFFLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztLQUFFO0FBQy9DLFFBQUcsSUFBSSxLQUFLLElBQUksRUFBRTtBQUFFLGFBQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztLQUFFO0FBQ3JDLFFBQUcsSUFBSSxLQUFLLFVBQVUsRUFBRTtBQUFFLGFBQU8sSUFBSSxZQUFTLENBQUM7S0FBRTtBQUNqRCxRQUFHLElBQUksS0FBSyxLQUFLLEVBQUU7QUFBRSxhQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7S0FBRTs7O0FBR3ZDLFdBQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksS0FBSyxDQUFDO0dBQ3BELENBQUM7O0FBRUYsU0FBTyxDQUFDLGNBQWMsR0FBRyxVQUFTLElBQUksRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFDO0FBQ3ZELFFBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFDO0FBQ25CLGFBQU8sQ0FBQyxLQUFLLENBQUMsbURBQW1ELENBQUMsQ0FBQztBQUNuRSxhQUFPO0tBQ1I7QUFDRCxRQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsRUFBQztBQUN6QixhQUFPLENBQUMsS0FBSyxDQUFDLHVEQUF1RCxDQUFDLENBQUM7QUFDdkUsYUFBTztLQUNSO0FBQ0QsUUFBRyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFDO0FBQzVCLGFBQU8sQ0FBQyxLQUFLLENBQUMsb0JBQW1CLEdBQUcsSUFBSSxHQUFHLDJCQUEwQixDQUFDLENBQUM7QUFDdkUsYUFBTztLQUNSOztBQUVELFVBQU0sR0FBRyxBQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUksTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakQsWUFBUSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7O0FBRTNCLFdBQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxRQUFRLENBQUM7R0FFMUIsQ0FBQzs7Ozs7O0FBTUYsU0FBTyxZQUFTLEdBQUcsVUFBUyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUM7QUFDckQsYUFBUztBQUNULFdBQU8sRUFBRSxDQUFDO0dBQ1gsQ0FBQTs7QUFFRCxTQUFPLENBQUMsR0FBRyxHQUFHLFVBQVMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFDO0FBQ2hELFdBQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUNuQyxXQUFPLEVBQUUsQ0FBQztHQUNYLENBQUE7O0FBRUQsU0FBTyxDQUFDLEVBQUUsR0FBRyxVQUFTLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBQztBQUMvQyxRQUFJLENBQUM7UUFBRSxRQUFRO1FBQUUsUUFBUTtRQUFFLE9BQU87UUFDOUIsU0FBUyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7UUFDckIsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNO1FBQ25CLElBQUksR0FBRyxJQUFJLENBQUM7OztBQUdoQixRQUFHLEdBQUcsS0FBSyxDQUFDLEVBQUM7QUFDWCxjQUFRLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLGNBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0FBQzNCLGFBQU8sR0FBSSxJQUFJLENBQUMsRUFBRSxJQUFJLE9BQU8sQ0FBQyxPQUFPLEFBQUMsQ0FBQztLQUN4Qzs7U0FFSSxJQUFHLEdBQUcsS0FBSyxDQUFDLEVBQUM7QUFDaEIsY0FBUSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixjQUFRLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLGFBQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0tBQzNCOzs7QUFHRCxLQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVMsS0FBSyxFQUFDO0FBQ3RELGFBQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDdEQsQ0FBQyxDQUFDO0dBQ0osQ0FBQzs7QUFFRixTQUFPLENBQUMsTUFBTSxHQUFHLFVBQVMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFdBQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO0dBQzdDLENBQUM7O0FBRUYsU0FBTyxNQUFHLEdBQUcsVUFBUyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUM7QUFFL0MsUUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUUxQixRQUFHLFNBQVMsS0FBSyxTQUFTLElBQUksU0FBUyxLQUFLLElBQUksRUFBQztBQUMvQyxlQUFTLEdBQUcsS0FBSyxDQUFDO0tBQ25COztBQUVELFFBQUcsU0FBUyxDQUFDLE9BQU8sRUFBQztBQUNuQixlQUFTLEdBQUcsSUFBSSxDQUFDO0tBQ2xCOzs7QUFHRCxRQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksU0FBUyxDQUFDLFlBQVksRUFBQztBQUNoRCxlQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDO0tBQzdDOztBQUVELFFBQUcsU0FBUyxLQUFLLE1BQU0sRUFBQztBQUFFLGVBQVMsR0FBRyxJQUFJLENBQUM7S0FBRTtBQUM3QyxRQUFHLFNBQVMsS0FBSyxPQUFPLEVBQUM7QUFBRSxlQUFTLEdBQUcsS0FBSyxDQUFDO0tBQUU7OztBQUcvQyxRQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDO0FBQ25CLGFBQU8sQUFBQyxTQUFTLEdBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEFBQUMsQ0FBQztLQUNyRDs7O0FBR0QsUUFBRyxPQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUM7QUFDdkMsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxXQUFPLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7OztBQUdwQyxRQUFHLFNBQVMsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFDO0FBQy9CLGFBQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3ZGLE1BQ0ksSUFBRyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFDO0FBQ3BDLGFBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3RGOztBQUVELFdBQU8sRUFBRSxDQUFDO0dBQ1gsQ0FBQzs7OztBQUlGLFNBQU8sQ0FBQyxNQUFNLEdBQUcsVUFBUyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUM7QUFDbkQsUUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUUxQixRQUFHLFNBQVMsS0FBSyxTQUFTLElBQUksU0FBUyxLQUFLLElBQUksRUFBQztBQUMvQyxlQUFTLEdBQUcsS0FBSyxDQUFDO0tBQ25COztBQUVELFFBQUcsU0FBUyxDQUFDLE9BQU8sRUFBQztBQUNuQixlQUFTLEdBQUcsSUFBSSxDQUFDO0tBQ2xCOzs7QUFHRCxRQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksU0FBUyxDQUFDLFlBQVksRUFBQztBQUNoRCxlQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDO0tBQzdDOzs7QUFHRCxRQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDO0FBQ25CLGFBQU8sQUFBQyxDQUFDLFNBQVMsR0FBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLEdBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQUFBQyxDQUFDO0tBQ3REOzs7QUFHRCxRQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxLQUFLLFNBQVMsRUFBQztBQUMzQyxhQUFPLElBQUksQ0FBQztLQUNiOztBQUVELFdBQU8sQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLFNBQVMsQ0FBQzs7O0FBR3hDLFFBQUcsQ0FBQyxTQUFTLElBQUssT0FBTyxDQUFDLFFBQVEsRUFBQztBQUNqQyxhQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztLQUN2RixNQUNJLElBQUcsU0FBUyxJQUFJLE9BQU8sQ0FBQyxPQUFPLEVBQUM7QUFDbkMsYUFBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDdEY7O0FBRUQsV0FBTyxFQUFFLENBQUM7R0FDWCxDQUFDOzs7QUFHRixXQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLEdBQUcsRUFBRTtBQUN0QyxRQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUU7QUFDZixZQUFNLElBQUksU0FBUyxDQUFDLHVDQUF1QyxDQUFDLENBQUM7S0FDOUQ7QUFDRCxRQUFJLE9BQU8sU0FBUyxLQUFLLFVBQVUsRUFBRTtBQUNuQyxZQUFNLElBQUksU0FBUyxDQUFDLDhCQUE4QixDQUFDLENBQUM7S0FDckQ7QUFDRCxRQUFJLElBQUksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDdkIsUUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLENBQUM7QUFDL0IsUUFBSSxPQUFPLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNCLFFBQUksS0FBSyxDQUFDOztBQUVWLFNBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDL0IsV0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNoQixVQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ2hELGVBQU8sQ0FBQyxDQUFDO09BQ1Y7S0FDRjtBQUNELFdBQU8sQ0FBQyxDQUFDLENBQUM7R0FDWDs7QUFFRCxTQUFPLENBQUMsSUFBSSxHQUFHLFVBQVMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFDO0FBRWpELFFBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFDO0FBQUUsYUFBTyxDQUFDLElBQUksQ0FBQyw2RUFBNkUsRUFBRSxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUMsQUFBQyxPQUFPLElBQUksQ0FBQztLQUFFOztBQUVqTCxRQUFJLEtBQUssR0FBRyxBQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxZQUFZLEdBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDOztBQUMvRCxTQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxlQUFlO1FBQUUsR0FBRztRQUFFLElBQUk7UUFBRSxTQUFTO1FBQUUsTUFBTTtRQUFFLENBQUM7O0FBQ3RFLFlBQVE7O0FBQ1IsZ0JBQVksR0FBRyxVQUFTLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBQztBQUNqRCxhQUFPLE9BQU8sQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDO0tBQzVCLENBQUM7O0FBRU4sUUFBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQSxJQUFLLE9BQU8sQ0FBQyxPQUFPLEVBQUM7QUFDOUQsYUFBTyxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7S0FDdEY7OztBQUdELFNBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUUsRUFBQztBQUMzQixTQUFHLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2YsVUFBSSxHQUFHLEFBQUMsS0FBSyxHQUFJLEtBQUssQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDOzs7QUFHeEMsVUFBRyxLQUFLLElBQUksS0FBSyxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxFQUFDO0FBQUUsYUFBSyxHQUFHLElBQUksQ0FBQyxBQUFDLFNBQVM7T0FBRTs7QUFFNUQsWUFBTSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsd0JBQXdCLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDOzs7QUFHM0QsZUFBUyxHQUFHLElBQUksU0FBUyxDQUFDLFlBQVU7QUFDbEMsZUFBTyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztPQUM5RixFQUFFLEVBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUMsQ0FBQyxDQUFDOzs7QUFHM0IsWUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQzs7O0FBR3JDLFlBQU0sQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQzs7O0FBR3JCLFdBQUssSUFBSSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7OztBQUd6QixXQUFLLEdBQUcsSUFBSSxDQUFDO0tBQ2Q7OztBQUdELFdBQU0sS0FBSyxFQUFDO0FBQ1YsVUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUM7QUFDdkIsV0FBSyxDQUFDLE9BQU8sRUFBRSxDQUFDO0FBQ2hCLFdBQUssR0FBRyxJQUFJLENBQUM7S0FDZDs7O0FBR0QsV0FBTyxJQUFJLENBQUM7R0FFYixDQUFDOztBQUVGLFNBQU8sQ0FBQyxPQUFPLEdBQUcsVUFBUyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUM7QUFDcEQsUUFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xDLFFBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFVLEVBQUU7QUFDakMsYUFBTyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUM7S0FDN0M7R0FFRixDQUFDOzttQkFFYSxPQUFPOzs7Ozs7OztNQ3ZRZixnQkFBZ0I7O01BQ2hCLENBQUM7OztBQUdSLFdBQVMsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUM7QUFDNUIsUUFBRyxHQUFHLEtBQUssSUFBSSxFQUFFLE9BQU8sSUFBSSxDQUFDO0FBQzdCLFdBQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEdBQUMsR0FBRyxDQUFDO0dBQ3JEOzs7OztBQUtELFdBQVMsaUJBQWlCLEdBQUU7QUFDMUIsUUFBSSxDQUFDLEdBQUcsQ0FBQztRQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUNyQyxXQUFPLElBQUksQ0FBQyxpQkFBaUIsQ0FBQztBQUM5QixTQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUNoQixVQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDO0tBQzdCO0FBQ0QsUUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFDO0dBQ3pCOztBQUVELE1BQUksZ0JBQWdCLEdBQUcsVUFBUyxJQUFJLEVBQUUsT0FBTyxFQUFDO0FBRTVDLFFBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyx5REFBeUQsRUFBRSxJQUFJLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztBQUNoSSxXQUFPLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztBQUN4QixRQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN6QyxRQUFJLENBQUMsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUM7QUFDekIsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDdkIsUUFBSSxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUM7QUFDdEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDbEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDbEIsUUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7QUFDeEIsUUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsUUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDakIsS0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsVUFBVSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3pDLFFBQUksQ0FBQyxJQUFJLEdBQUcsZ0JBQWdCLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7OztBQUd0RCxRQUFJLE9BQU8sR0FBRztBQUNaLFlBQU0sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFFO0FBQ2hELFVBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFFLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUU7QUFDNUQsVUFBSSxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTTtLQUNoRCxDQUFDOzs7Ozs7QUFNRixRQUFJLENBQUMsS0FBSyxHQUFHO0FBQ1gsV0FBSyxFQUFFLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDO0FBQ3JDLGdCQUFVLEVBQUUsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUM7QUFDL0MsV0FBSyxFQUFFLFNBQVM7S0FDakIsQ0FBQzs7QUFFRixRQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7R0FFYixDQUFDOztBQUVGLEdBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxNQUFNLEVBQUU7O0FBRXBELHNCQUFrQixFQUFFLElBQUk7QUFDeEIsVUFBTSxFQUFFLElBQUk7QUFDWixVQUFNLEVBQUUsWUFBVTtBQUFFLGFBQU8sRUFBRSxDQUFDO0tBQUU7OztBQUdoQyxhQUFTLEVBQUUsWUFBVTtBQUNuQixVQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTztBQUN4QixVQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUNwQixVQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztLQUM3Qjs7Ozs7QUFLRCxlQUFXLEVBQUUsVUFBUyxJQUFJLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUM7QUFDckQsVUFBSSxZQUFZLEdBQUcsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO0FBQ3JILFVBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRyxPQUFPO0FBQ2pELFdBQUssS0FBSyxLQUFLLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUN0QixnQkFBVSxLQUFLLFVBQVUsR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQ2hDLGFBQU8sS0FBSyxPQUFPLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUMxQixVQUFJLENBQUMsT0FBTyxLQUFLLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUNwQyxVQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQ2hELE9BQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxPQUFPLEdBQUcsVUFBVSxDQUFBLEFBQUMsS0FBSyxVQUFVLEdBQUcsS0FBSyxDQUFBLEFBQUMsQ0FBQztBQUNyRSxVQUFJLElBQUksR0FBRyxVQUFTLEdBQUcsRUFBQztBQUN0QixZQUFJLENBQUM7WUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUN4QixZQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUNoQyxhQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUNoQixjQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVM7QUFDcEMsY0FBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLGNBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDbkI7T0FDRjtVQUFFLElBQUk7VUFBRSxNQUFNLENBQUM7QUFDaEIsWUFBTSxHQUFHLElBQUksR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQzs7OztBQUlyRSxVQUFHLElBQUksS0FBSyxPQUFPLElBQUksT0FBTyxDQUFDLGtCQUFrQixFQUFDO0FBQ2hELFNBQUMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGtCQUFrQixFQUFFLFVBQVMsS0FBSyxFQUFFLEdBQUcsRUFBQztBQUNyRCxnQkFBTSxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxDQUFBLEFBQUMsR0FBRyxHQUFHLENBQUM7QUFDcEMsV0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFVBQVMsVUFBVSxFQUFFLFVBQVUsRUFBQztBQUMxRCxzQkFBVSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7V0FDdkUsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNWLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDVjs7OztXQUlJLElBQUcsSUFBSSxLQUFLLE9BQU8sSUFBSSxPQUFPLENBQUMsY0FBYyxFQUFDO0FBQ2pELFNBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxVQUFTLFVBQVUsRUFBRSxVQUFVLEVBQUM7QUFDMUQsb0JBQVUsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ3ZFLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDVjs7OztXQUlJLElBQUcsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssUUFBUSxFQUFDO0FBQzFDLFNBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxVQUFTLFVBQVUsRUFBRSxVQUFVLEVBQUM7QUFDMUQsY0FBSSxVQUFVLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLFVBQVUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLEVBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDN0csRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNWOzs7V0FHSSxJQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFDO0FBQ3BDLGNBQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3RFLFNBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxVQUFTLFVBQVUsRUFBRSxVQUFVLEVBQUM7QUFDMUQsb0JBQVUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1NBQ3ZFLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDVjs7QUFFRCxVQUFJLENBQUM7VUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDakMsV0FBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxHQUFHLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFDaEIsWUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLEVBQUUsQ0FBQztPQUM3Qjs7OztBQUlELFVBQUcsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixHQUFHLFVBQVUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQ3BHLGFBQU87S0FDUjs7Ozs7O0FBTUQsWUFBUSxFQUFFLFVBQVMsSUFBSSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFDO0FBQ2xELFVBQUksWUFBWSxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDO0FBQ2hHLFVBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxJQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUcsT0FBTztBQUM5RSxXQUFLLEtBQUssS0FBSyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDdEIsZ0JBQVUsS0FBSyxVQUFVLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUNoQyxhQUFPLEtBQUssT0FBTyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDMUIsT0FBQyxVQUFVLENBQUMsTUFBTSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssT0FBTyxHQUFHLFVBQVUsQ0FBQSxBQUFDLEtBQUssVUFBVSxHQUFHLEtBQUssQ0FBQSxBQUFDLENBQUM7QUFDL0YsVUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQ2YsVUFBSSxJQUFJLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM1RSxVQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFbkMsVUFBRyxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU87QUFDL0IsVUFBRyxJQUFJLEtBQUssUUFBUSxFQUFFLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDLEtBQ2pFLElBQUcsSUFBSSxLQUFLLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsS0FDckQsSUFBRyxJQUFJLEtBQUssS0FBSyxFQUFHLElBQUksQ0FBQyxHQUFHLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUNoRCxJQUFHLElBQUksS0FBSyxRQUFRLEVBQUcsSUFBSSxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUFBLEtBRS9EOzs7OztBQUtELFFBQUksRUFBRSxZQUFVO0FBQ2QsVUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUN6QixVQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQzlCLFVBQUksQ0FBQyxjQUFjLEtBQUssSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDOztBQUVsRCxPQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBUyxJQUFJLEVBQUM7QUFDOUIsWUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUN0QyxZQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLE9BQU87QUFDM0MsV0FBRyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDO09BQ2pDLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRVQsT0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsSUFBSSxFQUFDOztBQUU5QixZQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzlCLGVBQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBQztBQUMzQixpQkFBTyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUM7QUFDN0IsZUFBSyxDQUFDLEtBQUssRUFBRSxDQUFDO1NBQ2Y7O0FBRUQsWUFBSSxHQUFHLE9BQU8sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQ3pELFlBQUksR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQSxBQUFDLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7O0FBRzlDLFlBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEtBQUssSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQzlELFlBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO09BQ3RDLEVBQUUsSUFBSSxDQUFDLENBQUM7OztBQUdULGFBQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztLQUNsRTs7QUFFRCxVQUFNLEVBQUUsWUFBVTtBQUNoQixVQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ3pCLFVBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7O0FBRTlCLE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFTLElBQUksRUFBQztBQUM5QixZQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQ3RDLFlBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsT0FBTztBQUMzQyxXQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7T0FDbEMsRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFVCxhQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDdEM7OztBQUdELFFBQUksRUFBRSxZQUFVO0FBQ2QsVUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztVQUM1QyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzNCLGFBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDbEM7Ozs7Ozs7Ozs7QUFVRCxTQUFLLEVBQUUsVUFBUyxPQUFPLEVBQUUsTUFBTSxFQUFDO0FBRTlCLGFBQU8sS0FBSyxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQSxBQUFDLENBQUM7O0FBRXZDLFVBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxPQUFPLEVBQUUsT0FBTztBQUN4RCxVQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQzs7QUFFdkIsVUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1VBQ25DLE1BQU0sQ0FBQzs7Ozs7O0FBTVgsT0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsR0FBRyxFQUFDO0FBQzdCLFlBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUMsR0FBRyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDL0MsWUFBRyxDQUFDLFVBQVUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxPQUFPO0FBQ3pELFlBQUcsVUFBVSxDQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsVUFBVSxLQUFLLElBQUksRUFBQztBQUN0RCxvQkFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3BDLG9CQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDbkIsY0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLE9BQU8sSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7U0FDdkQ7QUFDRCxlQUFPLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztPQUVyQyxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUVULFVBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU87O0FBRTVCLFVBQUcsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQzs7QUFFaEYsWUFBTSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQzs7O0FBRzFDLFVBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsVUFBVSxDQUFDLE1BQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDLEtBQ3pFLElBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQzs7O0FBR2pHLFVBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFDO0FBQzNDLFlBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDO0FBQzFCLFlBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDekMsWUFBSSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQztPQUNyQjs7V0FFSSxJQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUM7QUFDMUIsWUFBSSxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUM7QUFDL0IsWUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDekIsWUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDckIsWUFBSSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqQixZQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO09BQ3BCLE1BQ0ksSUFBRyxNQUFNLENBQUMsT0FBTyxFQUFDO0FBQ3JCLFlBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDO0FBQzFCLFlBQUksQ0FBQyxZQUFZLEdBQUcsS0FBSyxDQUFDO0FBQzFCLFlBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFlBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDbkIsWUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztPQUNwQixNQUNHO0FBQ0YsWUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUM7QUFDMUIsWUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUN6QyxZQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO09BQ3BCOztBQUVELGFBQU8sSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0tBQ3JCOzs7Ozs7QUFNRCxTQUFLLEVBQUUsVUFBUyxNQUFNLEVBQUM7QUFDckIsVUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzFCLFVBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxPQUFPO0FBQ2xFLFlBQU0sQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBLEFBQUMsQ0FBQztBQUMxQyxZQUFNLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQSxBQUFDLENBQUM7QUFDMUMsWUFBTSxDQUFDLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDO0FBQ3hCLFVBQUksQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDO0FBQ3ZCLFVBQUksQ0FBQyxRQUFRLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7S0FDN0M7OztBQUdELE9BQUcsRUFBRSxVQUFTLEdBQUcsRUFBRSxPQUFPLEVBQUM7QUFDekIsVUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3pCLGFBQU8sS0FBSyxPQUFPLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUMxQixVQUFHLElBQUksQ0FBQyxVQUFVLEtBQUssT0FBTyxFQUFFLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsR0FBRSxJQUFJLENBQUMsSUFBSSxHQUFFLHNEQUFzRCxDQUFDLENBQUM7QUFDL0ksYUFBTyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNoQzs7Ozs7QUFLRCxPQUFHLEVBQUUsVUFBUyxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBQztBQUM5QixVQUFHLElBQUksQ0FBQyxVQUFVLEtBQUssSUFBSSxFQUFFLE9BQU8sU0FBUyxDQUFDO0FBQzlDLGFBQU8sS0FBSyxPQUFPLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUMxQixVQUFJLEtBQUssR0FBRyxHQUFHLENBQUM7QUFDaEIsVUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3pCLFVBQUcsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPLEVBQUM7QUFDN0IsWUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7QUFDM0IsZUFBSyxHQUFHLEFBQUMsR0FBRyxDQUFDLE9BQU8sR0FBSSxHQUFHLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUM3QyxpQkFBTyxHQUFHLEdBQUcsQ0FBQztTQUNmLE1BQU07QUFDTCxXQUFDLEtBQUssR0FBRyxFQUFFLENBQUEsQ0FBRSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDekI7T0FDRjtBQUNELFVBQUcsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPLEVBQUUsT0FBTyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUM7QUFDcEQsV0FBSyxHQUFHLEFBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsR0FBSSxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsS0FBSyxDQUFDOzs7QUFHcEUsVUFBRyxJQUFJLENBQUMsVUFBVSxLQUFLLE9BQU8sSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxLQUFLLEVBQUM7QUFDM0QsWUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQ3pCLFlBQUcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFDOztBQUVoQixjQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ25FLGNBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDM0MsY0FBSSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3hDLGNBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxHQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUMxRCxpQkFBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDM0M7T0FDRixNQUNJLElBQUcsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPLElBQUksT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUMsS0FDbkYsSUFBRyxJQUFJLENBQUMsVUFBVSxLQUFLLE9BQU8sRUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDckUsVUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQzs7O0FBR3ZDLE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFTLElBQUksRUFBQztBQUFFLFlBQUksSUFBSSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7T0FBRSxDQUFDLENBQUM7O0FBRTdELGFBQU8sR0FBRyxDQUFDO0tBQ1o7OztBQUdELFNBQUssRUFBRSxZQUFVO0FBQ2YsVUFBRyxJQUFJLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUM5QixhQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0tBQ3BDOzs7QUFHRCxTQUFLLEVBQUUsVUFBUyxHQUFHLEVBQUUsT0FBTyxFQUFDO0FBQzNCLFVBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUUsT0FBTztBQUNyQyxhQUFPLEtBQUssT0FBTyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDMUIsYUFBTyxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDckIsYUFBUSxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUNoQzs7O0FBR0QsVUFBTSxFQUFFLFlBQVc7QUFDakIsVUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUN6QyxVQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDdkIsVUFBSSxDQUFDLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFDM0IsVUFBSSxJQUFJLEdBQUcsQUFBQyxHQUFHLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEdBQUksR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsQ0FBQztBQUNsRSxVQUFJLENBQUMsY0FBYyxHQUFHLEtBQUssQ0FBQztBQUM1QixhQUFPLElBQUksQ0FBQztLQUNiOztHQUVGLENBQUMsQ0FBQzs7bUJBRVksZ0JBQWdCOzs7Ozs7OztNQzVYeEIsU0FBUzs7TUFDVCxDQUFDOztNQUNELE9BQU87O0FBRWQsTUFBSSxLQUFLLEdBQUcsRUFBRTtNQUNWLFVBQVUsR0FBRyxFQUFHLElBQUksRUFBRSxDQUFDLEVBQU8sZ0JBQWdCLEVBQUUsQ0FBQyxFQUFJLE1BQU0sRUFBRSxDQUFDLEVBQU8sU0FBUyxFQUFFLENBQUMsRUFBTSxNQUFNLEVBQUUsQ0FBQztBQUNoRixTQUFLLEVBQUUsQ0FBQyxFQUFPLEtBQUssRUFBRSxDQUFDLEVBQWMsR0FBRyxFQUFFLENBQUMsRUFBVSxPQUFPLEVBQUUsQ0FBQyxFQUFRLElBQUksRUFBRSxDQUFDO0FBQzlFLGNBQVUsRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBWSxNQUFNLEVBQUUsQ0FBQyxFQUFPLFdBQVcsRUFBRSxDQUFDLEVBQUksV0FBVyxFQUFFLENBQUM7QUFDckYsUUFBSSxFQUFFLENBQUMsRUFBUSxPQUFPLEVBQUUsQ0FBQyxFQUFZLE9BQU8sRUFBRSxDQUFDLEVBQU0sT0FBTyxFQUFFLENBQUMsRUFBUSxJQUFJLEVBQUUsQ0FBQztBQUM5RSxhQUFPLENBQUMsRUFBTyxPQUFPLEVBQUUsQ0FBQyxFQUFZLEtBQUssRUFBRSxDQUFDLEVBQVEsSUFBSSxFQUFFLENBQUMsRUFBVyxRQUFRLEVBQUUsQ0FBQztBQUNsRixZQUFRLEVBQUUsQ0FBQyxFQUFJLEtBQUssRUFBRSxDQUFDLEVBQWMsSUFBSSxFQUFFLENBQUMsRUFBUyxPQUFPLEVBQUUsQ0FBQyxFQUFRLE9BQU8sRUFBRSxDQUFDO0FBQ2pGLFdBQU8sRUFBRSxDQUFDLEVBQUssTUFBTSxFQUFFLENBQUMsRUFBYSxJQUFJLEVBQUUsQ0FBQyxFQUFTLFFBQVEsRUFBRSxDQUFDLEVBQU8sT0FBTyxFQUFFLENBQUM7QUFDakYsU0FBSyxFQUFFLENBQUMsRUFBTyxHQUFHLEVBQUUsQ0FBQyxFQUFnQixRQUFRLEVBQUUsQ0FBQyxFQUFLLE9BQU8sRUFBRSxDQUFDLEVBQVEsSUFBSSxFQUFFLENBQUM7QUFDOUUsV0FBSyxDQUFDLEVBQVMsS0FBSyxFQUFFLENBQUMsRUFBYyxXQUFXLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQVEsTUFBTSxFQUFFLENBQUM7QUFDaEYsUUFBSSxFQUFFLENBQUMsRUFBUSxRQUFRLEVBQUUsQ0FBQyxFQUFXLE1BQU0sRUFBRSxDQUFDLEVBQU0sWUFBWSxFQUFFLENBQUMsRUFBSSxFQUFFLEVBQUUsQ0FBQztBQUM1RSxTQUFLLEVBQUUsQ0FBQyxFQUFPLEtBQUssRUFBRSxDQUFDLEVBQWMsSUFBSSxFQUFFLENBQUMsRUFBUyxRQUFRLEVBQUUsQ0FBQyxFQUFPLElBQUksRUFBRSxDQUFDO0FBQzlFLFlBQVEsRUFBRSxDQUFDLEVBQUksWUFBWSxFQUFFLENBQUMsRUFBTyxXQUFXLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQU0sS0FBSyxFQUFFLENBQUM7QUFDL0UsVUFBTSxFQUFFLENBQUMsRUFBTSxRQUFRLEVBQUUsQ0FBQyxFQUFXLElBQUksRUFBRSxDQUFDLEVBQVMsTUFBTSxFQUFFLENBQUMsRUFBUyxRQUFRLEVBQUUsQ0FBQztBQUNsRixXQUFPLEVBQUUsQ0FBQyxFQUFLLE1BQU0sRUFBRSxDQUFDLEVBQWEsTUFBTSxFQUFFLENBQUMsRUFBTyxNQUFNLEVBQUUsQ0FBQyxFQUFTLFFBQVEsRUFBRSxDQUFDO0FBQ2xGLFdBQU8sRUFBRSxDQUFDLEVBQUssVUFBVSxFQUFFLENBQUMsRUFBUyxPQUFPLEVBQUUsQ0FBQyxFQUFNLFNBQVMsRUFBRSxDQUFDLEVBQU0sVUFBVSxFQUFFLENBQUM7QUFDcEYsV0FBTyxFQUFFLENBQUMsRUFBSyxNQUFNLEVBQUUsQ0FBQyxFQUFhLFdBQVcsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBSSxVQUFVLEVBQUUsQ0FBQztBQUNwRixlQUFXLEVBQUUsQ0FBQyxFQUFDLFNBQVMsRUFBRSxDQUFDLEVBQVUsT0FBTyxFQUFFLENBQUMsRUFBTSxRQUFRLEVBQUUsQ0FBQyxFQUFPLFFBQVEsRUFBRSxDQUFDO0FBQ2xGLFlBQVEsRUFBRSxDQUFDLEVBQUksT0FBTyxFQUFFLENBQUMsRUFBWSxNQUFNLEVBQUUsQ0FBQyxFQUFPLFFBQVEsRUFBRSxDQUFDLEVBQU8sR0FBRyxFQUFFLENBQUM7QUFDN0UsT0FBRyxFQUFFLENBQUMsRUFBUyxJQUFJLEVBQUUsQ0FBQyxFQUFlLE9BQU8sRUFBRSxDQUFDLEVBQU0sS0FBSyxFQUFFLENBQUMsRUFBVSxNQUFNLEVBQUUsQ0FBQztBQUNoRixTQUFLLEVBQUUsQ0FBQyxFQUFPLFNBQVMsRUFBRSxDQUFDLEVBQVUsUUFBUSxFQUFFLENBQUMsRUFBSyxLQUFLLEVBQUUsQ0FBQyxFQUFVLElBQUksRUFBRSxDQUFDO0FBQzlFLFFBQUksRUFBRSxDQUFDLEVBQVEsR0FBRyxFQUFFLENBQUMsRUFBZ0IsT0FBTyxFQUFFLENBQUMsRUFBTSxLQUFLLEVBQUUsQ0FBQyxFQUFVLEtBQUssRUFBRSxDQUFDO0FBQy9FLFdBQU8sRUFBRSxDQUFDLEVBQUssUUFBUSxFQUFFLENBQUMsRUFBVyxNQUFNLEVBQUUsQ0FBQyxFQUFPLElBQUksRUFBRSxDQUFDLEVBQVcsS0FBSyxFQUFFLENBQUM7QUFDL0UsUUFBSSxFQUFFLENBQUMsRUFBUSxNQUFNLEVBQUUsQ0FBQyxFQUFhLE1BQU0sRUFBRSxDQUFDLEVBQU8sS0FBSyxFQUFFLENBQUMsRUFBVSxTQUFTLEVBQUUsQ0FBQztBQUNuRixXQUFPLEVBQUUsQ0FBQyxFQUFLLEtBQUssRUFBRSxDQUFDLEVBQWMsTUFBTSxFQUFFLENBQUMsRUFBTyxLQUFLLEVBQUUsQ0FBQyxFQUFHLENBQUM7Ozs7Ozs7O0FBUXJGLFdBQVMsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUU7O0FBR3JDLFFBQUksU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLFlBQVc7QUFDdkMsYUFBTyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0tBQzFCLEVBQUUsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQzs7O0FBR3ZCLGFBQVMsQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDOzs7QUFHdEIsYUFBUyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7O0FBRXJDLFdBQU8sU0FBUyxDQUFDO0dBQ2xCOztBQUVELFdBQVMsZUFBZSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUU7QUFDakYsUUFBSSxHQUFHLENBQUM7O0FBRVIsV0FBTyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDdEIsV0FBTyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDeEIsV0FBTyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7QUFDcEIsV0FBTyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7OztBQUcxQixPQUFHLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuQixRQUFHLEdBQUcsQ0FBQyxXQUFXLEVBQUUsR0FBRyxDQUFDLFdBQVcsR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsQ0FBQzs7O0FBRy9ELFdBQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsWUFBVTtBQUMxQyxVQUFJLFdBQVcsR0FBRyxFQUFFO1VBQ2hCLFNBQVMsR0FBRyxFQUFFLENBQUM7OztBQUduQixPQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxVQUFTLEtBQUssRUFBRSxLQUFLLEVBQUM7QUFDbkMsbUJBQVcsQ0FBQyxJQUFJLENBQUcsQUFBQyxLQUFLLElBQUksS0FBSyxDQUFDLFdBQVcsR0FBSSxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsS0FBSyxDQUFHLENBQUM7T0FDNUUsQ0FBQyxDQUFDO0FBQ0gsT0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBUyxJQUFJLEVBQUUsR0FBRyxFQUFDO0FBQzlCLGlCQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQUFBQyxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsR0FBSSxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDO09BQ25FLENBQUMsQ0FBQzs7O0FBR0gsYUFBTyxNQUFNLENBQUMsS0FBSyxDQUFFLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxFQUFHLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztLQUU1RixFQUFFLEVBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxLQUFLLEVBQUMsQ0FBQyxDQUFDOztBQUUzQixXQUFPLENBQUMsU0FBUyxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7OztBQUc5QixVQUFNLENBQUMsT0FBTyxDQUFDLFVBQVMsS0FBSyxFQUFFO0FBQzdCLFVBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxXQUFXLEVBQUM7QUFBRSxlQUFPLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO09BQUU7S0FDL0UsQ0FBQyxDQUFDO0FBQ0gsU0FBSSxHQUFHLElBQUksSUFBSSxFQUFDO0FBQ2QsVUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsRUFBQztBQUFFLGVBQU8sQ0FBQyxTQUFTLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7T0FBRTtLQUMzRjs7QUFFRCxXQUFPLE9BQU8sQ0FBQyxTQUFTLENBQUM7R0FDMUI7OztBQUdELFdBQVMsWUFBWSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUM7O0FBRXhDLGFBQVMsQ0FBQyxPQUFPLENBQUMsVUFBUyxRQUFRLEVBQUU7QUFDbkMsVUFBRyxRQUFRLENBQUMsWUFBWSxFQUFDO0FBQ3ZCLFNBQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxVQUFTLElBQUksRUFBRSxLQUFLLEVBQUM7QUFDakQsV0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxVQUFTLENBQUMsRUFBQztBQUM1QixnQkFBRyxDQUFDLENBQUMsV0FBVyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLEVBQUM7QUFDMUMsZUFBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUN6QjtXQUNGLENBQUMsQ0FBQztTQUNKLENBQUMsQ0FBQztPQUNKO0tBQ0YsQ0FBQyxDQUFDO0dBQ0o7O0FBRUQsTUFBSSxlQUFlLEdBQUcsSUFBSSxnQkFBZ0IsQ0FBQyxZQUFZLENBQUMsQ0FBQzs7Ozs7O0FBTXpELE9BQUssQ0FBQyxHQUFHLEdBQUcsU0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUM7QUFDMUMsUUFBRyxJQUFJLEtBQUssTUFBTSxFQUFFLElBQUksR0FBRyxFQUFFLENBQUM7QUFDOUIsUUFBSSxHQUFHO1FBQ0gsSUFBSSxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDO1FBQ3hCLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7OztBQUd6QixRQUFHLEdBQUcsQ0FBQyxXQUFXLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBQztBQUMzQyxhQUFPLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNqQyxVQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUN2Qjs7QUFFRCxXQUFPLGNBQWMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDdEMsQ0FBQzs7QUFFRixPQUFLLENBQUMsR0FBRyxHQUFHLFNBQVMsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUNqRCxPQUFHLENBQUMsV0FBVyxLQUFLLEdBQUcsQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUMxQyxPQUFHLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztHQUMvQixDQUFDOzs7QUFHRixPQUFLLENBQUMsTUFBTSxHQUFHLFNBQVMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUU7QUFFMUMsUUFBRyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBQztBQUNyQixhQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsQjs7QUFFRCxRQUFJLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxZQUFXO0FBQ3ZDLFVBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQzs7QUFFZixXQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzdDLGFBQUssSUFBSSxBQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNsRTs7QUFFRCxhQUFPLEtBQUssQ0FBQztLQUNkLEVBQUUsRUFBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLENBQUM7O0FBRWpDLFNBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDN0MsVUFBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFO0FBQ3hCLGlCQUFTLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDeEM7S0FDRjs7QUFFRCxXQUFPLFNBQVMsQ0FBQztHQUVsQixDQUFDOztBQUVGLE9BQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtBQUV2RSxRQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUM7UUFDbEQsU0FBUyxDQUFDOztBQUVWLFFBQUksTUFBTSxFQUFFO0FBQ1YsZUFBUyxHQUFHLGVBQWUsQ0FBQyxLQUFLLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDeEYsTUFBTTtBQUNMLGVBQVMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDakQ7O0FBRUQsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM3QyxVQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUU7QUFDeEIsaUJBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUN4QztLQUNGOztBQUVELFdBQU8sU0FBUyxDQUFDO0dBQ2xCLENBQUM7O0FBRUYsT0FBSyxDQUFDLEtBQUssR0FBRyxTQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFDO0FBQ3RGLFFBQUksT0FBTyxHQUFHO0FBQ1osV0FBSyxFQUFFLEtBQUs7QUFDWixjQUFRLEVBQUUsUUFBUTtBQUNsQixhQUFPLEVBQUUsT0FBTztLQUNqQixDQUFDOztBQUVGLFFBQUksU0FBUztRQUNULEtBQUs7UUFDTCxRQUFRLEdBQUcsZUFBZTtRQUMxQixNQUFNLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7O0FBRTdDLFFBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxFQUFDO0FBQ3ZCLGFBQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLEdBQUcseUJBQXlCLENBQUMsQ0FBQztLQUN4RDs7O0FBR0QsYUFBUyxHQUFHLGVBQWUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7O0FBRXRGLFFBQUksVUFBVSxHQUFHLFVBQVMsU0FBUyxFQUFFO0FBQ25DLFVBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUM1QixTQUFHLEdBQUcsQUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFJLEVBQUUsR0FBRyxHQUFHLENBQUM7QUFDdEMsVUFBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUM7QUFDaEIsYUFBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUN2QjtLQUNGLENBQUE7QUFDRCxhQUFTLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQy9CLGNBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7Ozs7QUFLdEIsUUFBRyxLQUFLLENBQUMsT0FBTyxFQUFDO0FBQ2YsV0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO0FBQ3RDLGdCQUFVLENBQUMsWUFBVTtBQUNuQixZQUFHLEtBQUssQ0FBQyxpQkFBaUIsRUFBQztBQUN6QixrQkFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUN4SDtPQUNGLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDUDtHQUNGLENBQUM7O0FBRUYsT0FBSyxDQUFDLE1BQU0sR0FBRyxTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtBQUV0RSxRQUFJLFNBQVM7UUFDYixLQUFLO1FBQ0wsUUFBUSxHQUFHLGVBQWU7UUFDMUIsTUFBTSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDOztBQUV6QyxRQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBQztBQUN2QixhQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLHlCQUF5QixDQUFDLENBQUM7S0FDeEQ7OztBQUdELGFBQVMsR0FBRyxlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDOztBQUVqRixRQUFJLFVBQVUsR0FBRyxVQUFTLFNBQVMsRUFBRTtBQUNuQyxVQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDNUIsU0FBRyxHQUFHLEFBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBSSxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQ3RDLFVBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFDO0FBQ2hCLGFBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7T0FDdkI7S0FDRixDQUFBOzs7O0FBSUQsYUFBUyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMvQixjQUFVLENBQUMsU0FBUyxDQUFDLENBQUE7Ozs7O0FBS3JCLFFBQUcsS0FBSyxDQUFDLE9BQU8sRUFBQztBQUNmLFdBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztBQUN0QyxnQkFBVSxDQUFDLFlBQVU7QUFDbkIsWUFBRyxLQUFLLENBQUMsaUJBQWlCLEVBQUM7QUFDekIsa0JBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7U0FDeEg7T0FDRixFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQ1A7R0FFRixDQUFDOztBQUVGLE9BQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO0FBRTFELFFBQUksU0FBUztRQUNULEtBQUs7UUFDTCxRQUFRLEdBQUcsZUFBZTtRQUMxQixNQUFNLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7O0FBRTdDLFFBQUksTUFBTSxFQUFFO0FBQ1YsZUFBUyxHQUFHLGVBQWUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUFFLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDNUUsTUFBTTtBQUNMLGVBQVMsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDM0M7O0FBRUQsUUFBSSxVQUFVLEdBQUcsVUFBUyxTQUFTLEVBQUU7QUFDbkMsVUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzVCLFNBQUcsR0FBRyxBQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQztBQUN0QyxVQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxLQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzFDLENBQUE7Ozs7QUFJRCxhQUFTLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQy9CLGNBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7Ozs7QUFLdEIsUUFBRyxLQUFLLENBQUMsT0FBTyxFQUFDO0FBQ2YsV0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEdBQUcsU0FBUyxDQUFDO0FBQ3RDLGdCQUFVLENBQUMsWUFBVTtBQUNuQixZQUFHLEtBQUssQ0FBQyxpQkFBaUIsRUFBQztBQUN6QixrQkFBUSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsRUFBRSxVQUFVLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztTQUN4SDtPQUNGLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDUDtHQUVGLENBQUM7Ozs7T0FJRyxDQUFDLE9BQU8sR0FBRyxTQUFTLE9BQU8sQ0FBQyxHQUFHLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtBQUM3RSxRQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUM7UUFDeEMsU0FBUztRQUNULEtBQUssQ0FBQzs7QUFFVixRQUFJLE1BQU0sRUFBRTs7QUFFVixlQUFTLEdBQUcsZUFBZSxDQUFDLFVBQVUsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUN2RixNQUFNO0FBQ0wsZUFBUyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztLQUMzQzs7QUFFRCxRQUFJLFVBQVUsR0FBRyxVQUFTLFNBQVMsRUFBRTtBQUNuQyxlQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDbkIsQ0FBQTs7O0FBR0QsYUFBUyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUMvQixjQUFVLENBQUMsU0FBUyxDQUFDLENBQUM7R0FFdkIsQ0FBQztBQUNGLE9BQUssQ0FBQyxTQUFTLEdBQUcsU0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBQztBQUUzRSxRQUFJLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxZQUFXO0FBQ3ZDLFVBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUU7VUFDdkIsY0FBYztVQUNkLElBQUksR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDLE1BQU0sQ0FBQztVQUV0QyxVQUFVLEdBQUcsRUFBRyxNQUFNLEVBQUUsSUFBSSxFQUFHLE1BQU8sSUFBSSxFQUFJLE9BQVEsSUFBSSxFQUFHLFVBQVcsSUFBSTtBQUM1RCxnQkFBUyxJQUFJLEVBQUUsS0FBTSxJQUFJLEVBQUssS0FBTSxJQUFJLEVBQUssUUFBUyxJQUFJO0FBQzFELGdCQUFTLElBQUksRUFBRSxPQUFTLElBQUksRUFBRSxNQUFRLElBQUksRUFBRyxVQUFZLElBQUk7QUFDN0QseUJBQWlCLEVBQUUsSUFBSSxFQUFPLE9BQVMsSUFBSSxFQUFFLE9BQVMsSUFBSTtBQUMxRCxjQUFRLElBQUksRUFBRyxNQUFRLElBQUk7T0FDNUI7VUFDZixJQUFJLENBQUM7OztBQUdMLFVBQUksVUFBVSxDQUFDLE9BQU8sS0FBSyxPQUFPLElBQUksVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUU7O0FBRzFFLFlBQUcsQ0FBQyxTQUFTLENBQUMsYUFBYSxFQUFDO0FBRTFCLFdBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsNkJBQTZCLEVBQUUsVUFBUyxLQUFLLEVBQUM7QUFDN0QsaUJBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7V0FDbkMsQ0FBQyxDQUFDOztBQUVILG1CQUFTLENBQUMsYUFBYSxHQUFHLElBQUksQ0FBQztTQUVoQzs7O0FBR0QsQUFBQyxTQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFJLFVBQVUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7O0FBRTdGLFlBQUksR0FBRyxHQUFHLENBQUM7O0FBRVgsZUFBTyxBQUFDLFVBQVUsQ0FBQyxLQUFLLEtBQUssTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFJLFVBQVUsQ0FBQyxLQUFLLEdBQUksSUFBSSxJQUFJLEVBQUUsQUFBQyxHQUFHLElBQUksQ0FBQztPQUNyRixNQUVJLElBQUksVUFBVSxDQUFDLE9BQU8sS0FBSyxPQUFPLEtBQUssSUFBSSxLQUFLLFVBQVUsSUFBSSxJQUFJLEtBQUssT0FBTyxDQUFBLEFBQUMsSUFBSSxJQUFJLEtBQUssU0FBUyxFQUFFOztBQUcxRyxZQUFHLENBQUMsU0FBUyxDQUFDLFdBQVcsRUFBQztBQUV4QixXQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLHVCQUF1QixFQUFFLFVBQVMsS0FBSyxFQUFDO0FBQ3ZELGlCQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUcsQUFBQyxJQUFJLENBQUMsT0FBTyxHQUFJLElBQUksR0FBRyxLQUFLLEVBQUcsRUFBQyxLQUFLLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztXQUN2RSxDQUFDLENBQUM7O0FBRUgsbUJBQVMsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1NBQzlCOzs7QUFHRCxBQUFDLFNBQUMsR0FBRyxHQUFJLFVBQVUsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLEdBQUcsVUFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7O0FBRS9FLGVBQU8sVUFBVSxDQUFDLE9BQU8sR0FBRyxBQUFDLEdBQUcsR0FBSSxJQUFJLEdBQUcsU0FBUyxDQUFDO09BQ3REOzs7O1dBSUksSUFBSSxVQUFVLENBQUMsT0FBTyxLQUFLLEdBQUcsSUFBSSxJQUFJLEtBQUssT0FBTyxFQUFFO0FBQ3ZELFlBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBQztBQUNwQixvQkFBVSxDQUFDLE1BQU0sR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUMsR0FBRyxVQUFVLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztTQUN2RyxNQUNHO0FBQ0Ysb0JBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxHQUFHLFNBQVMsR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDLENBQUM7U0FDM0U7T0FDRixNQUVJO0FBQ0gsU0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUN0QyxXQUFHLEtBQUssR0FBRyxHQUFHLFNBQVMsQ0FBQSxBQUFDLENBQUM7QUFDekIsWUFBRyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFDO0FBQ3BCLG9CQUFVLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2xDLE1BQ0c7QUFDRixvQkFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7U0FDcEM7T0FDRjs7QUFFRCxhQUFPLEdBQUcsQ0FBQztLQUVaLEVBQUUsRUFBQyxTQUFTLEVBQUUsU0FBUyxFQUFDLENBQUMsQ0FBQzs7QUFFM0IsUUFBSSxVQUFVLEdBQUcsWUFBVTtBQUN6QixlQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDbkIsQ0FBQTs7QUFFRCxTQUFLLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzNCLGFBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNuQyxjQUFVLEVBQUUsQ0FBQztHQUNkLENBQUM7O0FBRUYsT0FBSyxDQUFDLFNBQVMsR0FBRyxVQUFTLEdBQUcsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLEVBQUUsUUFBUSxFQUFFO0FBRTlFLFFBQUksU0FBUztRQUNULE9BQU87UUFDUCxNQUFNO1FBQ04sU0FBUyxHQUFHLEVBQUU7UUFDZCxhQUFhLEdBQUcsRUFBRTtRQUNsQixTQUFTO1FBQ1QsS0FBSyxDQUFDOzs7QUFHVixhQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsWUFBVzs7QUFHbkMsT0FBQyxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsVUFBUyxLQUFLLEVBQUUsR0FBRyxFQUFFO0FBQ3ZDLGlCQUFTLENBQUMsR0FBRyxDQUFDLEdBQUcsQUFBQyxLQUFLLENBQUMsV0FBVyxHQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxLQUFLLENBQUM7T0FDOUQsQ0FBQyxDQUFDOzs7OztBQUtILGFBQU8sQ0FBQyxRQUFRLEdBQUcsU0FBUyxDQUFDO0FBQzdCLGFBQU8sR0FBRyxRQUFRLENBQUMsYUFBYSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQzFDLGFBQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQztBQUN4QixlQUFTLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQzs7O0FBR2xDLE9BQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVMsS0FBSyxFQUFFLEdBQUcsRUFBRTtBQUNyQyxZQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxFQUFDO0FBQ2xELHVCQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3JEO09BQ0YsQ0FBQyxDQUFDOzs7O0FBSUgsT0FBQyxDQUFDLElBQUksQ0FBRSxhQUFhLEVBQUUsVUFBUyxrQkFBa0IsRUFBRSxHQUFHLEVBQUM7O0FBR3RELFlBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUM7O0FBRXBDLDRCQUFrQixDQUFDLFFBQVEsQ0FBQyxZQUFVO0FBQ3BDLHVCQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztXQUN6RSxDQUFDLENBQUM7U0FDSjs7O0FBR0QsbUJBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBVTtBQUNsQyw0QkFBa0IsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1NBQ3ZELENBQUMsQ0FBQzs7O0FBR0gsMEJBQWtCLENBQUMsS0FBSyxFQUFFLENBQUM7OztBQUczQixtQkFBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzdELDBCQUFrQixDQUFDLFdBQVcsQ0FBQyxHQUFHLEVBQUUsU0FBUyxDQUFDLENBQUM7T0FFaEQsQ0FBQyxDQUFDOzs7QUFHSCxlQUFTLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxRQUFRLEVBQUUsVUFBUyxLQUFLLEVBQUM7QUFDckQsWUFBSSxJQUFJLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDOztBQUU5QixZQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTzs7O0FBRzVCLFNBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsS0FBSyxFQUFFLEdBQUcsRUFBQzs7OztBQUkvQixjQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFBRSxtQkFBTztXQUFFO0FBQ2xDLGVBQUssR0FBRyxBQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUM7QUFDMUQsY0FBRztBQUFFLEFBQUMsc0JBQVUsQ0FBQyxHQUFHLENBQUMsR0FBSSxPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztXQUFFLENBQzNGLE9BQU0sQ0FBQyxFQUFDO0FBQ04sbUJBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1dBQzFCO1NBQ0osQ0FBQyxDQUFDO09BQ0osQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7QUFjSCxVQUFJLFFBQVEsR0FBRyxTQUFTLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDbEMsT0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBUyxLQUFLLEVBQUUsR0FBRyxFQUFDOzs7O0FBSW5DLFlBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUFFLGlCQUFPO1NBQUU7QUFDbEMsYUFBSyxHQUFHLEFBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsR0FBSSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUM1RCxZQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsS0FBSyxDQUFDLEVBQUM7QUFDM0MsY0FBRztBQUFFLEFBQUMsc0JBQVUsQ0FBQyxHQUFHLENBQUMsR0FBSSxPQUFPLENBQUMsWUFBWSxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztXQUFFLENBQzNGLE9BQU0sQ0FBQyxFQUFDO0FBQ04sbUJBQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1dBQzFCO1NBQ0Y7T0FDRixDQUFDLENBQUM7Ozs7QUFJSCxZQUFNLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3BELFVBQUcsUUFBUSxJQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUM7QUFDakMsY0FBTSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDdEIsY0FBTSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQztPQUMzRDs7O0FBR0QsYUFBTyxPQUFPLENBQUM7S0FDaEIsRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDOztBQUVuQixRQUFJLFVBQVUsR0FBRyxVQUFTLFNBQVMsRUFBRTtBQUNuQyxVQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDNUIsVUFBRyxHQUFHLEtBQUssU0FBUyxFQUFDO0FBQUUsYUFBSyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUFFO0tBQ2hELENBQUE7Ozs7QUFJRCxRQUFJLFNBQVMsRUFBRTtBQUNiLGVBQVMsQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDL0IsZ0JBQVUsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUN2QjtHQUNGLENBQUM7Ozs7bUJBSWEsS0FBSzs7Ozs7Ozs7Ozs7Ozs7O01DaGlCYixnQkFBZ0I7O01BQ2hCLENBQUM7Ozs7O0FBS1IsV0FBUyxhQUFhLENBQUMsTUFBTSxFQUFFLEdBQUcsRUFBQztBQUNqQyxXQUFPLFlBQVU7QUFDZixVQUFJLElBQUksR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDM0IsYUFBTyxJQUFJLElBQUksQUFBQyxJQUFJLEtBQUssRUFBRSxHQUFJLEVBQUUsR0FBRyxHQUFHLENBQUEsQUFBQyxHQUFHLEdBQUcsQ0FBQztLQUNoRCxDQUFDO0dBQ0g7O0FBRUQsTUFBSSxLQUFLLEdBQUcsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7O0FBRWhDLFdBQU8sRUFBRSxJQUFJO0FBQ2IsVUFBTSxFQUFFLElBQUk7Ozs7QUFJWixVQUFNLEVBQUUsWUFBVTtBQUFFLGFBQU8sRUFBRSxDQUFDO0tBQUU7Ozs7QUFJaEMsZUFBVyxFQUFFLFVBQVMsVUFBVSxFQUFFLE9BQU8sRUFBQztBQUN4QyxnQkFBVSxLQUFLLFVBQVUsR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQ2hDLGdCQUFVLENBQUMsT0FBTyxLQUFLLFVBQVUsR0FBRyxVQUFVLENBQUMsVUFBVSxDQUFBLEFBQUMsQ0FBQztBQUMzRCxhQUFPLEtBQUssT0FBTyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDMUIsVUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDbEIsVUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxJQUFJLEVBQUUsQ0FBQztBQUNwQyxVQUFJLENBQUMsU0FBUyxDQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFFLENBQUM7QUFDekMsVUFBSSxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBRSxDQUFDO0FBQ3JDLFVBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzFDLGNBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsT0FBTyxDQUFFLENBQUM7S0FDbEQ7OztBQUdELFVBQU0sRUFBRSxVQUFTLElBQUksRUFBRSxPQUFPLEVBQUU7QUFDOUIsYUFBTyxHQUFHLE9BQU8sR0FBRyxDQUFDLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUMxQyxVQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3pCLFVBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsb0NBQW9DLEdBQUcsSUFBSSxHQUFFLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUM1RixhQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ3RDOzs7OztBQUtELFNBQUssRUFBRSxVQUFTLEdBQUcsRUFBRSxPQUFPLEVBQUM7QUFDM0IsVUFBSSxPQUFPLEdBQUcsRUFBRTtVQUFFLEdBQUc7VUFBRSxLQUFLLENBQUM7QUFDN0IsYUFBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQzFCLGFBQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLFNBQUcsR0FBRyxBQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxVQUFVLElBQUssR0FBRyxJQUFJLEVBQUUsQ0FBQztBQUMxRCxhQUFPLENBQUMsa0JBQWtCLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7Ozs7Ozs7O0FBUXRELFdBQUksR0FBRyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUM7QUFDekIsYUFBSyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDN0IsWUFBRyxLQUFLLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVMsS0FDM0IsSUFBRyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFBLEFBQUMsQ0FBQyxLQUMvRCxJQUFJLEdBQUcsS0FBSyxJQUFJLENBQUMsV0FBVyxFQUFFLFNBQVMsS0FDdkMsSUFBSSxLQUFLLENBQUMsWUFBWSxJQUFJLEtBQUssQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLGtCQUFrQixFQUFDO0FBQ3ZFLGVBQUssQ0FBQyxLQUFLLENBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBRyxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQzlDLGNBQUcsS0FBSyxDQUFDLFlBQVksRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLEtBQ3BDLElBQUcsS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUN2RixJQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUE7U0FDcEQsTUFDSSxJQUFJLEdBQUcsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLEVBQUM7QUFBRSxpQkFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUFFLE1BQ3hELElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQztBQUM5RSxpQkFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzlDLE1BQ0c7QUFDRixpQkFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLFNBQVMsQ0FBQztBQUN6QixjQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1NBQ2pDO09BQ0YsQ0FBQzs7O0FBR0YsT0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBUyxLQUFLLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBQztBQUNuQyxlQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUN6QyxDQUFDLENBQUM7OztBQUdILFNBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDLENBQUM7OztBQUd6RSxVQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQztBQUN2QixVQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsT0FBTyxDQUFDLENBQUM7OztBQUcxRCxhQUFPLEdBQUcsQ0FBQztLQUNaOzs7Ozs7Ozs7Ozs7OztBQWNELE9BQUcsRUFBRSxVQUFTLEdBQUcsRUFBRSxPQUFPLEVBQUM7QUFDekIsYUFBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQzFCLFVBQUksS0FBSyxHQUFJLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDO1VBQ3pCLE1BQU0sR0FBRyxJQUFJO1VBQ2IsQ0FBQztVQUFFLENBQUMsR0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDOztBQUV0QixVQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLFNBQVMsQ0FBQztBQUN6RCxVQUFHLEdBQUcsS0FBSyxFQUFFLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsT0FBTyxNQUFNLENBQUM7O0FBRW5ELFdBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ3RCLFlBQUcsTUFBTSxJQUFJLE1BQU0sQ0FBQyxrQkFBa0IsSUFBSSxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sTUFBTSxDQUFDO0FBQ3JFLFlBQUcsTUFBTSxJQUFJLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2hFLFlBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sTUFBTSxDQUFDO0FBQzVELFlBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLFNBQVMsRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUNqRCxJQUFHLE1BQU0sQ0FBQyxZQUFZLEVBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FDekQsSUFBRyxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQ3hELElBQUcsTUFBTSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUM5RTs7QUFFRCxVQUFHLE1BQU0sSUFBSSxNQUFNLENBQUMsa0JBQWtCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDaEYsYUFBTyxNQUFNLENBQUM7S0FDZjs7Ozs7OztBQU9ELE9BQUcsRUFBRSxVQUFTLEdBQUcsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFDO0FBRTlCLFVBQUksS0FBSztVQUFFLElBQUk7VUFBRSxNQUFNO1VBQUUsTUFBTTtVQUFFLFdBQVc7VUFBRSxLQUFLLEdBQUcsRUFBRTtVQUFFLE9BQU8sQ0FBQzs7QUFFbEUsVUFBSSxPQUFPLEdBQUcsS0FBSyxRQUFRLEVBQUU7QUFDM0IsYUFBSyxHQUFHLEFBQUMsR0FBRyxDQUFDLE9BQU8sR0FBSSxHQUFHLENBQUMsVUFBVSxHQUFHLEdBQUcsQ0FBQztBQUM3QyxlQUFPLEdBQUcsR0FBRyxDQUFDO09BQ2YsTUFDSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUEsQ0FBRSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUM7QUFDN0IsYUFBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDOzs7QUFHMUIsVUFBRyxPQUFPLENBQUMsS0FBSyxLQUFLLElBQUksRUFBRSxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzdELFVBQUcsT0FBTyxDQUFDLFFBQVEsS0FBSyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsR0FBRyxLQUFLLENBQUM7QUFDcEQsVUFBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFLE9BQU87OztBQUc1QixXQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUM7QUFDZixZQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDO1lBQ2hCLEtBQUssR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQztZQUN4QixJQUFJLEdBQUksS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQztBQUMxQixjQUFNLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2xDLGVBQU8sQ0FBQzs7O0FBR1osWUFBRyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFDO0FBQ3ZCLGdCQUFNLEdBQUcsSUFBSSxDQUFDO0FBQ2QsV0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBUyxLQUFLLEVBQUM7QUFDM0IsZ0JBQUksR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDNUIsZ0JBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzlELGtCQUFNLEdBQUcsR0FBRyxDQUFDO1dBQ2QsRUFBRSxJQUFJLENBQUMsQ0FBQztTQUNWOzs7QUFHRCxZQUFJLFdBQVcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7O0FBR3RELGVBQU8sR0FBRztBQUNSLGNBQUksRUFBRSxHQUFHO0FBQ1QsZ0JBQU0sRUFBRSxNQUFNO0FBQ2QsY0FBSSxFQUFFLElBQUksQ0FBQyxRQUFRO0FBQ25CLGNBQUksRUFBRSxhQUFhLENBQUMsTUFBTSxFQUFFLEdBQUcsQ0FBQztBQUNoQyxnQkFBTSxFQUFFLElBQUk7QUFDWixrQkFBUSxFQUFFLE9BQU8sQ0FBQyxRQUFRO1NBQzNCLENBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7QUFnQkQsWUFBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakUsWUFBRyxHQUFHLElBQUksR0FBRyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDcEQsWUFBRyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLFNBQVMsQ0FBQyxLQUNuRCxJQUFHLE9BQU8sQ0FBQyxHQUFHLEtBQUssSUFBSSxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FDbkMsSUFBRyxXQUFXLENBQUMsa0JBQWtCLElBQUksV0FBVyxDQUFDLElBQUksS0FBSyxHQUFHLEVBQUUsU0FBUyxLQUN4RSxJQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksZ0JBQWdCLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEtBQy9ELElBQUcsR0FBRyxDQUFDLE1BQU0sSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsS0FDbEQsSUFBSSxXQUFXLENBQUMsa0JBQWtCLElBQzdCLFdBQVcsQ0FBQyxZQUFZLEtBQU0sQ0FBQyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsWUFBWSxDQUFBLEFBQUUsQUFBQyxJQUNuRSxXQUFXLENBQUMsT0FBTyxLQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQSxBQUFFLEFBQUMsRUFBQztBQUNuRSxxQkFBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7QUFDOUIsbUJBQVM7U0FDVixNQUNJLElBQUcsR0FBRyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsS0FBSyxLQUFLLEtBQUssRUFBRSxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxVQUFVLElBQUksR0FBRyxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsQ0FBQyxLQUMzRyxJQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7YUFDOUQsSUFBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7OztBQUd2RCxZQUFJLENBQUMsWUFBWSxHQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLEtBQUssQUFBQyxDQUFDOzs7QUFHakQsZ0JBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7T0FFL0QsQ0FBQzs7QUFFRixhQUFPLElBQUksQ0FBQztLQUViOzs7O0FBSUQsVUFBTSxFQUFFLFlBQVc7QUFDakIsVUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQ3BELFVBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFVBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3BDLE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsS0FBSyxFQUFFLElBQUksRUFBRTtBQUMvQixZQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUFFLGlCQUFPO1NBQUU7QUFDeEQsU0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQSxBQUFDLENBQUM7T0FDL0QsQ0FBQyxDQUFDO0FBQ0gsVUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7QUFDNUIsYUFBTyxJQUFJLENBQUM7S0FDYjs7R0FFRixDQUFDLENBQUM7O21CQUVZLEtBQUs7Ozs7Ozs7O0FDMVBwQixNQUFJLEdBQUcsR0FBRyxTQUFTLEdBQUcsR0FBRSxFQUFFO01BQ3RCLFdBQVcsR0FBRyxFQUFFLENBQUM7O0FBRXJCLFdBQVMsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUU7QUFDOUIsV0FBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFBO0FBQ3pCLFFBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNuQyxRQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNsQixRQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDO0FBQ3ZDLFFBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUM7QUFDbkMsUUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQztBQUMzQyxLQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQ3RHOztBQUVELFdBQVMsQ0FBQyxTQUFTLEdBQUc7QUFDcEIsZUFBVyxFQUFFLElBQUk7QUFDakIsVUFBTSxFQUFFLElBQUk7QUFDWixZQUFRLEVBQUUsSUFBSTtBQUNkLGFBQVMsRUFBRSxJQUFJO0FBQ2YsU0FBSyxFQUFFLEdBQUc7QUFDVixXQUFPLEVBQUUsSUFBSTtBQUNiLGVBQVcsRUFBRSxJQUFJO0FBQ2pCLGdCQUFZLEVBQUUsSUFBSTs7QUFFbEIsU0FBSyxFQUFFLFlBQVc7QUFDaEIsVUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN2QixVQUFJLEtBQUssS0FBSyxHQUFHLEVBQUU7QUFBRSxlQUFPLEtBQUssQ0FBQztPQUFFOztBQUVwQyxVQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQzdCLFVBQUksUUFBUSxFQUFFO0FBQ1osWUFBSSxLQUFLO1lBQ0wsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU3RCxhQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQy9DLGVBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsZ0JBQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxBQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsV0FBVyxHQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxLQUFLLENBQUM7U0FDbEU7O0FBRUQsZUFBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7T0FDMUMsTUFBTTtBQUNMLGVBQU8sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO09BQy9DO0tBQ0Y7O0FBRUQsT0FBRyxFQUFFLFVBQVMsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUM7QUFDaEMsVUFBRyxJQUFJLENBQUMsT0FBTyxFQUFDO0FBQ2QsZUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO09BQzlDO0FBQ0QsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxxQkFBaUIsRUFBRSxVQUFTLEtBQUssRUFBRTtBQUNqQyxVQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQzdCLFVBQUksQ0FBQyxRQUFRLEVBQUU7QUFDYixnQkFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUNwQyxNQUFNO0FBQ0wsZ0JBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDdEI7O0FBRUQsVUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRTtBQUFFLGFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO09BQUU7O0FBRXhELGFBQU8sSUFBSSxDQUFDO0tBQ2I7O0FBRUQsZUFBVyxFQUFFLFVBQVMsSUFBSSxFQUFFLE9BQU8sRUFBRTtBQUNuQyxVQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBLEFBQUM7VUFDbkQsUUFBUTtVQUFFLEdBQUcsQ0FBQzs7QUFFbEIsVUFBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7OztBQUcvRyxhQUFPLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDOztBQUVoRCxhQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUMsQ0FBQzs7O0FBR3JGLFNBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QixTQUFHLEdBQUcsQUFBQyxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksR0FBSSxZQUFZLEdBQUcsT0FBTyxDQUFDOzs7QUFHekQsY0FBUSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7O0FBR3pELGVBQVMsQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBQyxDQUFDLENBQUM7O0FBRWhFLGFBQU8sSUFBSSxDQUFDO0tBQ2I7O0FBRUQsVUFBTSxFQUFFLFVBQVMsTUFBTSxFQUFFOzs7O0FBSXZCLFVBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLFVBQVUsRUFBRSxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUNqRyxVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSztVQUNsQixNQUFNO1VBQ04sV0FBVyxDQUFDOztBQUVoQixVQUFJLEtBQUssS0FBSyxHQUFHLEVBQUU7QUFDakIsY0FBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDckIsbUJBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQy9CLGFBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUN6QixZQUFJLE1BQU0sRUFBRTtBQUFFLGdCQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQUU7QUFDcEMsWUFBSSxDQUFDLFdBQVcsRUFBRTtBQUFFLGlCQUFPO1NBQUU7QUFDN0IsYUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNsRCxxQkFBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3RCO09BQ0Y7S0FDRjs7QUFFRCxZQUFRLEVBQUUsVUFBUyxRQUFRLEVBQUU7QUFDM0IsVUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDOUQsaUJBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0IsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxXQUFPLEVBQUUsWUFBVztBQUNsQixPQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBUyxLQUFLLEVBQUM7QUFDbkMsWUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBQztBQUFFLGVBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUFFO09BQ3BELENBQUMsQ0FBQztBQUNILE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUFTLFVBQVUsRUFBQztBQUMzQyxZQUFJLFVBQVUsSUFBSSxVQUFVLENBQUMsV0FBVyxFQUFDO0FBQUUsb0JBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUFFO09BQ25FLENBQUMsQ0FBQzs7QUFFSCxVQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7O0FBRXRHLE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFTLFFBQVEsRUFBQztBQUN2QyxZQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUM7QUFDekQsaUJBQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNwRTtPQUNGLENBQUMsQ0FBQzs7QUFFSCxVQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztLQUN2QjtHQUNGLENBQUM7O21CQUVhLFNBQVM7Ozs7Ozs7Ozs7O01DbklqQixLQUFLOztNQUNMLFVBQVU7O01BQ1YsZ0JBQWdCOztNQUNoQixDQUFDOztBQUVSLE1BQUksYUFBYSxHQUFHOzs7OztBQUtsQixrQkFBYyxFQUFFLFVBQVMsSUFBSSxFQUFFLEtBQUssRUFBQztBQUNuQyxVQUFHLElBQUksQ0FBQyxVQUFVLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUUsT0FBTztBQUN4RCxVQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUM7QUFDaEQsWUFBRyxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxPQUFPO0FBQzFELFlBQUksR0FBRztZQUNILElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDOUUsT0FBTyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDOztBQUV4QyxhQUFJLEdBQUcsSUFBSSxPQUFPLEVBQUM7O0FBRWpCLG1CQUFTLENBQUMsQ0FBQyxDQUFDLEdBQUksU0FBUyxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxDQUFBLEFBQUMsR0FBRyxHQUFHLEFBQUMsQ0FBQztBQUN4RCxjQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztTQUMzRDtBQUNELGVBQU87T0FDUjtBQUNELGFBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsU0FBUyxDQUFDLENBQUM7S0FDbEU7Ozs7QUFJRCxhQUFTLEVBQUUsVUFBUyxNQUFNLEVBQUM7QUFDekIsVUFBRyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUN6RCxVQUFJLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQztBQUN6QixVQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUN6QixVQUFHLE1BQU0sS0FBSyxJQUFJLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNuRSxhQUFPLE1BQU0sQ0FBQztLQUNmOzs7O0FBSUQsV0FBTyxFQUFFLFVBQVUsSUFBSSxFQUFDO0FBQ3RCLFVBQUksR0FBRyxHQUFHLElBQUksQ0FBQztBQUNmLFNBQUcsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFVBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLElBQUssR0FBRyxDQUFDLFVBQVUsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDO0FBQ3JELE9BQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVMsS0FBSyxFQUFFLEdBQUcsRUFBQztBQUM5QixZQUFHLEtBQUssSUFBSSxLQUFLLENBQUMsTUFBTSxFQUFDO0FBQ3ZCLGVBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7U0FDckI7T0FDRixDQUFDLENBQUM7QUFDSCxhQUFPLElBQUksQ0FBQztLQUNiOzs7QUFHRCxhQUFTLEVBQUUsVUFBUyxHQUFHLEVBQUM7QUFDdEIsVUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQ2YsYUFBTSxHQUFHLEtBQUssR0FBRyxFQUFDO0FBQ2hCLFdBQUcsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDO0FBQ3JCLFlBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUNwQyxZQUFHLEdBQUcsS0FBSyxHQUFHLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDNUIsWUFBRyxHQUFHLENBQUMsVUFBVSxLQUFLLEdBQUcsRUFBRSxPQUFPLEtBQUssQ0FBQztPQUN6QztBQUNELGFBQU8sSUFBSSxDQUFDO0tBQ2I7OztBQUdELGdCQUFZLEVBQUUsWUFBWTs7Ozs7QUFHeEIsVUFBSSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixFQUFFLENBQUM7QUFDbkQsVUFBSSxJQUFJLENBQUMsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQztBQUM3QyxVQUFJLElBQUksQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ3pCLFVBQUksSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUM7OztBQUcvQixhQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDdkIsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ3JCLGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQzs7Ozs7QUFLbkIsVUFBRyxJQUFJLENBQUMsRUFBRSxFQUFDO0FBQ1QsU0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxVQUFTLE9BQU8sRUFBRSxTQUFTLEVBQUM7QUFDdEQsY0FBSSxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN4RixjQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksR0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDdkUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNULFNBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVMsRUFBRSxFQUFDO0FBQ2hDLGNBQUcsRUFBRSxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDeEUsQ0FBQyxDQUFDO0FBQ0gsZUFBTyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQztBQUMzQixlQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDO0FBQ3hCLGVBQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNoQixlQUFPLElBQUksQ0FBQyxFQUFFLENBQUM7T0FDaEI7OztBQUdELGFBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQzs7O0FBR3hCLFVBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDOzs7OztBQUsxQixPQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsVUFBUyxHQUFHLEVBQUM7QUFBRSxXQUFHLElBQUksR0FBRyxDQUFDLFlBQVksSUFBSSxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUM7T0FBRSxDQUFDLENBQUM7QUFDckYsVUFBSSxDQUFDLE1BQU0sS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUEsQUFBQyxDQUFDO0FBQ3hDLE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxVQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUs7QUFBRSxlQUFPLE1BQUssVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEFBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxZQUFZLElBQUksR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO09BQUUsQ0FBQyxDQUFDO0FBQ3ZILFVBQUcsSUFBSSxDQUFDLEtBQUssRUFBQztBQUNaLFlBQUksQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLFlBQVksRUFBRSxDQUFDO0FBQ3JDLFlBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDO09BQ2pDO0tBQ0Y7R0FDRixDQUFDOzs7QUFHRixHQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDekMsR0FBQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQzlDLEdBQUMsQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLGFBQWEsQ0FBQyxDQUFDOztVQUUzQyxLQUFLLEdBQUwsS0FBSztVQUFFLFVBQVUsR0FBVixVQUFVO1VBQUUsZ0JBQWdCLEdBQWhCLGdCQUFnQjs7Ozs7Ozs7QUMxSDVDLE1BQUksQ0FBQyxHQUFHLFVBQVMsS0FBSyxFQUFDO0FBQ3JCLFdBQU8sSUFBSSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDekIsQ0FBQzs7QUFFRixNQUFJLEtBQUssR0FBRyxVQUFTLEtBQUssRUFBQztBQUN6QixRQUFJLENBQUM7UUFBRSxRQUFRLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEFBQUMsS0FBSyxLQUFLLFFBQVEsSUFBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzVJLFFBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sQ0FBQzs7O0FBRzlCLFNBQUssQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM1QixVQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ3pCOztBQUVELFdBQU8sSUFBSSxDQUFDO0dBQ2IsQ0FBQzs7QUFFRixXQUFTLFdBQVcsR0FBRTtBQUFDLFdBQU8sS0FBSyxDQUFDO0dBQUM7QUFDckMsV0FBUyxVQUFVLEdBQUU7QUFBQyxXQUFPLElBQUksQ0FBQztHQUFDOztBQUVuQyxHQUFDLENBQUMsS0FBSyxHQUFHLFVBQVUsR0FBRyxFQUFFLEtBQUssRUFBRzs7QUFFaEMsUUFBSyxFQUFFLElBQUksWUFBWSxDQUFDLENBQUMsS0FBSyxDQUFBLEFBQUMsRUFBRztBQUNqQyxhQUFPLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBRSxHQUFHLEVBQUUsS0FBSyxDQUFFLENBQUM7S0FDakM7OztBQUdELFFBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxJQUFJLEVBQUc7QUFDdEIsVUFBSSxDQUFDLGFBQWEsR0FBRyxHQUFHLENBQUM7QUFDekIsVUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDOzs7O0FBSXJCLFVBQUksQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLENBQUMsZ0JBQWdCLElBQzVDLEdBQUcsQ0FBQyxnQkFBZ0IsS0FBSyxTQUFTOztBQUVsQyxTQUFHLENBQUMsV0FBVyxLQUFLLEtBQUssR0FDMUIsVUFBVSxHQUNWLFdBQVcsQ0FBQzs7O0tBR2IsTUFBTTtBQUNOLFVBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO0tBQ2hCOzs7QUFHRCxRQUFLLEtBQUssRUFBRztBQUNaLE9BQUMsQ0FBQyxNQUFNLENBQUUsSUFBSSxFQUFFLEtBQUssQ0FBRSxDQUFDO0tBQ3hCOzs7QUFHQSxLQUFDLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFFLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FDdkMsUUFBUSxFQUFFLFNBQVMsRUFBRSxZQUFZLEVBQUUsU0FBUyxFQUFFLGVBQWUsRUFBRSxZQUFZLEVBQzNFLFNBQVMsRUFBRSxlQUFlLEVBQUUsVUFBVSxFQUFFLFFBQVEsRUFBRSxXQUFXLEVBQUUsTUFBTSxFQUNyRSxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQ2xFLFNBQVMsRUFBRSxTQUFTLEVBQUUsRUFBRSxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQzNFLFNBQVMsRUFBRSxXQUFXLENBQ3ZCLENBQUMsQ0FBQyxDQUFDOzs7QUFHUCxRQUFJLENBQUMsU0FBUyxHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsU0FBUyxJQUFJLEFBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBRSxPQUFPLEVBQUUsQ0FBQzs7O0FBR2hFLFFBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0dBQ3BCLENBQUM7O0FBRUYsR0FBQyxDQUFDLEtBQUssQ0FBQyxTQUFTLEdBQUc7QUFDbkIsZUFBVyxFQUFFLENBQUMsQ0FBQyxLQUFLO0FBQ3BCLHNCQUFrQixFQUFFLFdBQVc7QUFDL0Isd0JBQW9CLEVBQUUsV0FBVztBQUNqQyxpQ0FBNkIsRUFBRSxXQUFXOztBQUUxQyxrQkFBYyxFQUFFLFlBQVc7QUFDMUIsVUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQzs7QUFFM0IsVUFBSSxDQUFDLGtCQUFrQixHQUFHLFVBQVUsQ0FBQzs7QUFFckMsVUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLGNBQWMsRUFBRztBQUM1QixTQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7T0FDbkI7S0FDRDtBQUNELG1CQUFlLEVBQUUsWUFBVztBQUMzQixVQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDOztBQUUzQixVQUFJLENBQUMsb0JBQW9CLEdBQUcsVUFBVSxDQUFDOztBQUV2QyxVQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsZUFBZSxFQUFHO0FBQzdCLFNBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQztPQUNwQjtLQUNEO0FBQ0QsNEJBQXdCLEVBQUUsWUFBVztBQUNwQyxVQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDOztBQUUzQixVQUFJLENBQUMsNkJBQTZCLEdBQUcsVUFBVSxDQUFDOztBQUVoRCxVQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsd0JBQXdCLEVBQUc7QUFDdEMsU0FBQyxDQUFDLHdCQUF3QixFQUFFLENBQUM7T0FDN0I7O0FBRUQsVUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO0tBQ3ZCO0dBQ0QsQ0FBQzs7O0FBR0YsT0FBSyxDQUFDLFNBQVMsR0FBRzs7OztBQUloQixhQUFTLEVBQUUsVUFBUyxJQUFJLEVBQUM7QUFDdkIsVUFBSSxHQUFHLENBQUMsR0FBRyxHQUFDLElBQUksR0FBQyxHQUFHLENBQUEsQ0FBRSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDN0MsVUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsVUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2IsYUFBTyxJQUFJLENBQUM7S0FDYjs7O0FBR0QsY0FBVSxFQUFFLFVBQVMsSUFBSSxFQUFFO0FBQ3pCLFVBQUksRUFBRTtVQUFFLElBQUk7VUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUNoQyxhQUFNLEdBQUcsRUFBRSxFQUFDO0FBQ1YsWUFBSSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqQixZQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDWCxZQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUN2QixlQUFPLElBQUksRUFBRTtBQUNULFdBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDekIsY0FBSSxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUM7U0FDM0I7T0FDRjtLQUNGOzs7QUFHRCxXQUFPLEVBQUUsRUFBRTs7O0FBR1gsZ0JBQVksRUFBRSxVQUFTLE1BQU0sRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFDO0FBQ2pELFVBQUksU0FBUyxHQUFHLEVBQUUsQ0FBQzs7O0FBR25CLFVBQUcsTUFBTSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsRUFBQztBQUN2RSxTQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLFVBQVMsYUFBYSxFQUFFLFVBQVUsRUFBQztBQUN2RixjQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLEtBQUssVUFBVSxLQUFLLFFBQVEsQ0FBQyxVQUFVLElBQU0sUUFBUSxDQUFDLGVBQWUsSUFBSSxRQUFRLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFFLEFBQUMsRUFBRTtBQUMzSSxxQkFBUyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUM7V0FDN0M7U0FDRixDQUFDLENBQUM7T0FDSjs7QUFFRCxhQUFPLFNBQVMsQ0FBQztLQUNsQjs7O0FBR0QsV0FBTyxFQUFFLFVBQVMsU0FBUyxFQUFFLE9BQU8sRUFBQztBQUNuQyxVQUFJLEVBQUU7VUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUMxQixhQUFNLEdBQUcsRUFBRSxFQUFDO0FBQ1YsVUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNmLFlBQUksUUFBUSxDQUFDLFdBQVcsRUFBRTtBQUN4QixjQUFJLEtBQUssR0FBRyxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQy9DLGVBQUssQ0FBQyxTQUFTLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN4QyxZQUFFLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3pCLE1BQU07QUFDTCxZQUFFLENBQUMsU0FBUyxDQUFDLElBQUksR0FBQyxTQUFTLENBQUMsQ0FBQztTQUM5QjtPQUNGO0tBQ0Y7O0FBRUQsT0FBRyxFQUFFLFVBQVMsU0FBUyxFQUFFLE9BQU8sRUFBQztBQUMvQixVQUFJLEVBQUU7VUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU07VUFBRSxVQUFVLENBQUM7O0FBRXRDLGFBQU0sR0FBRyxFQUFFLEVBQUM7QUFFVixVQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2Ysa0JBQVUsR0FBRyxDQUFDLENBQUM7O0FBRWYsWUFBRyxFQUFFLENBQUMsYUFBYSxFQUFDO0FBQ2xCLGNBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBQztBQUNsSCxhQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLFVBQVMsUUFBUSxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUM7QUFDdkYsZUFBQyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsVUFBUyxRQUFRLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBQztBQUMxRCxvQkFBRyxRQUFRLEtBQUssT0FBTyxFQUFDO0FBQ3RCLHlCQUFPLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUMzQix5QkFBTztpQkFDUjtBQUNELDBCQUFVLEVBQUUsQ0FBQztlQUNkLENBQUMsQ0FBQzthQUNKLENBQUMsQ0FBQztXQUNKO1NBQ0Y7OztBQUdELFlBQUksVUFBVSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLEVBQUM7QUFDN0MsWUFBRSxDQUFDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDbkQ7QUFDRCxZQUFJLFVBQVUsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLFdBQVcsRUFBQztBQUNyQyxZQUFFLENBQUMsV0FBVyxDQUFDLElBQUksR0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDekM7T0FFRjtLQUNGOztBQUVELE1BQUUsRUFBRSxVQUFVLFNBQVMsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRTtBQUNoRCxVQUFJLEVBQUU7VUFDRixNQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU87VUFDckIsR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNO1VBQ2pCLFVBQVUsR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQztVQUNqQyxVQUFVO1VBQUUsYUFBYSxDQUFDOztBQUU5QixhQUFNLEdBQUcsRUFBRSxFQUFDO0FBQ1YsVUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7O0FBR2YsWUFBRyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFDO0FBQ3hCLGlCQUFPLEdBQUcsUUFBUSxDQUFDO0FBQ25CLGtCQUFRLEdBQUcsRUFBRSxDQUFDO0FBQ2QsY0FBSSxHQUFHLEVBQUUsQ0FBQztTQUNYO0FBQ0QsWUFBRyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxFQUFDO0FBQ3BCLGlCQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ2YsY0FBSSxHQUFHLEVBQUUsQ0FBQztTQUNYO0FBQ0QsWUFBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxFQUFDO0FBQ2pELGlCQUFPLENBQUMsS0FBSyxDQUFDLCtFQUErRSxDQUFDLENBQUM7QUFDL0YsaUJBQU8sS0FBSyxDQUFDO1NBQ2Q7O0FBRUQsa0JBQVUsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLFFBQVEsR0FBSSxRQUFRLENBQUMsVUFBVSxHQUFHLFFBQVEsQ0FBQyxVQUFVLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsQUFBQyxDQUFDO0FBQ2xILHFCQUFhLEdBQUcsRUFBRSxDQUFDLGFBQWEsR0FBSSxFQUFFLENBQUMsYUFBYSxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsZUFBZSxDQUFDLEFBQUMsQ0FBQzs7QUFFckYsU0FBQyxDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsVUFBUyxTQUFTLEVBQUM7O0FBR3BDLGdCQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsQ0FBQzs7O0FBR3BELGNBQUksUUFBUSxHQUFHLFVBQVMsS0FBSyxFQUFDO0FBQ3hCLGdCQUFJLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssQ0FBQztBQUMxRCxpQkFBSyxHQUFHLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBRSxLQUFLLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBRSxDQUFDO0FBQzdDLGtCQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDOzs7QUFHMUMsbUJBQU0sTUFBTSxFQUFDOztBQUdYLHVCQUFTLEdBQUcsQ0FBQyxDQUFDLFlBQVksQ0FBQyxFQUFFLEVBQUUsTUFBTSxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFbkQsaUJBQUcsR0FBRyxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQ3ZCLG1CQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUNoQixxQkFBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsVUFBVSxHQUFHLE1BQU0sQ0FBQztBQUN6QyxxQkFBSyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0FBQy9CLHFCQUFLLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUNyRCxxQkFBSyxHQUFHLEFBQUUsS0FBSyxDQUFDLE1BQU0sS0FBSyxLQUFLLEdBQUssSUFBSSxHQUFHLEtBQUssQ0FBQztlQUNuRDs7O0FBR0Qsa0JBQUcsS0FBSyxFQUFDO0FBQ1AscUJBQUssQ0FBQyxjQUFjLEVBQUUsQ0FBQztBQUN2QixxQkFBSyxDQUFDLGVBQWUsRUFBRSxDQUFDO0FBQ3hCLHVCQUFPLEtBQUssQ0FBQztlQUNkOztBQUVELG9CQUFNLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQzthQUM1QjtXQUNGLENBQUM7Ozs7QUFJTixjQUFHLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFDOztBQUVuQyxjQUFFLENBQUMsZ0JBQWdCLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRyxTQUFTLEtBQUssT0FBTyxJQUFJLFNBQVMsS0FBSyxNQUFNLENBQUUsQ0FBQztXQUMzRjs7OztBQUlELGdCQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUMxRSxnQkFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDbEcsZ0JBQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxRQUFRLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1NBRXBGLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDVjtLQUNGOztBQUVELFdBQU8sRUFBRSxVQUFTLElBQUksRUFBRTtvQkFFdEIsVUFBa0IsR0FBRyxFQUFFLElBQUksRUFBRTtBQUMzQixZQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLEVBQUU7QUFDdkIsZ0JBQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxHQUFHLENBQUM7U0FDcEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDN0IsZUFBSSxJQUFJLENBQUMsR0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFDakMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUN0QyxjQUFJLENBQUMsS0FBSyxDQUFDLEVBQ1QsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNuQixNQUFNO0FBQ0wsY0FBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ25CLGVBQUssSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFO0FBQ2pCLG1CQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ2hCLG1CQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLEdBQUMsR0FBRyxHQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztXQUN4QztBQUNELGNBQUksT0FBTyxJQUFJLElBQUksRUFDakIsTUFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQztTQUNuQjtPQUNGOztBQWxCUCxVQUFJLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFtQlYsYUFBTyxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNsQixhQUFPLE1BQU0sQ0FBQztLQUNmOztBQUVQLGVBQVcsRUFBRSxZQUFVO0FBQ3JCLFVBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxZQUFXLEdBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEdBQUMsS0FBSSxDQUFDLENBQUE7QUFDaEYsV0FBSSxJQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFDN0IsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ3pDLGFBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQztPQUM5QjtLQUNGO0FBQ0QsYUFBUyxFQUFFLFlBQVU7QUFDbkIsVUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLGdCQUFnQixDQUFDLFlBQVcsR0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsR0FBQyxLQUFJLENBQUMsQ0FBQztBQUNqRixXQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsS0FBSyxDQUFDLE1BQU0sRUFBQyxDQUFDLEVBQUUsRUFBQztBQUM3QixhQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDdEMsYUFBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO09BQzdCO0tBQ0Y7OztBQUdELFFBQUksRUFBRSxVQUFTLEdBQUcsRUFBRTtBQUNoQixVQUFHLE9BQU8sR0FBRyxJQUFJLFFBQVEsRUFBRSxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7QUFDOUMsU0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQztBQUN4QixTQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO0FBQzVCLFNBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUM7QUFDakMsU0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztBQUMxQixVQUFJLFNBQVMsR0FBRyxVQUFTLElBQUksRUFBRSxHQUFHLEVBQUU7QUFDaEMsWUFBSSxHQUFHLEdBQUcsRUFBRTtZQUFFLEdBQUcsQ0FBQztBQUNsQixhQUFJLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtBQUNsQixhQUFHLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN6RDtBQUNELFdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BCLFlBQUcsR0FBRyxLQUFLLEVBQUUsRUFBRTtBQUNYLGlCQUFPLEdBQUcsR0FBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUksR0FBRyxDQUFDO1NBQ3JFO0FBQ0QsZUFBTyxFQUFFLENBQUM7T0FDYixDQUFDO0FBQ0YsVUFBSSxHQUFHLEdBQUc7QUFDTixZQUFJLEVBQUUsRUFBRTtBQUNSLGVBQU8sRUFBRSxVQUFTLEdBQUcsRUFBRTtBQUNuQixjQUFJLElBQUksR0FBRyxJQUFJLENBQUM7QUFDaEIsY0FBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsY0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFO0FBQUUsZ0JBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQztXQUFFLE1BQzFFLElBQUcsTUFBTSxDQUFDLGNBQWMsRUFBRTtBQUFFLGdCQUFJLENBQUMsR0FBRyxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7V0FBRTtBQUNuRSxjQUFHLElBQUksQ0FBQyxHQUFHLEVBQUU7QUFDVCxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsR0FBRyxZQUFXO0FBQ3JDLGtCQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxHQUFHLEVBQUU7QUFDbkQsb0JBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDO0FBQ25DLG9CQUFHLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLE9BQU8sSUFBSSxJQUFJLFdBQVcsRUFBRTtBQUNoRCx3QkFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQy9CO0FBQ0Qsb0JBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM1RSxtQkFBRyxDQUFDLE9BQU8sSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2VBQ25FLE1BQU0sSUFBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxDQUFDLEVBQUU7QUFDaEMsb0JBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3BFLG1CQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztlQUN2RDtBQUNELGtCQUFJLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4RSxpQkFBRyxDQUFDLFFBQVEsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDN0QsQ0FBQztXQUNMO0FBQ0QsY0FBRyxHQUFHLENBQUMsTUFBTSxJQUFJLEtBQUssRUFBRTtBQUNwQixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ25FLGdCQUFJLENBQUMsVUFBVSxDQUFDO0FBQ2QsZ0NBQWtCLEVBQUUsZ0JBQWdCO2FBQ3JDLENBQUMsQ0FBQztXQUNOLE1BQU07QUFDSCxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3pDLGdCQUFJLENBQUMsVUFBVSxDQUFDO0FBQ1osZ0NBQWtCLEVBQUUsZ0JBQWdCO0FBQ3BDLDRCQUFjLEVBQUUsbUNBQW1DO2FBQ3RELENBQUMsQ0FBQztXQUNOO0FBQ0QsY0FBRyxHQUFHLENBQUMsT0FBTyxJQUFJLE9BQU8sR0FBRyxDQUFDLE9BQU8sSUFBSSxRQUFRLEVBQUU7QUFDOUMsZ0JBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1dBQ2hDO0FBQ0Qsb0JBQVUsQ0FBQyxZQUFXO0FBQ2xCLGVBQUcsQ0FBQyxNQUFNLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1dBQzlFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDUCxpQkFBTyxJQUFJLENBQUMsR0FBRyxDQUFDO1NBQ25CO0FBQ0QsWUFBSSxFQUFFLFVBQVMsUUFBUSxFQUFFO0FBQ3JCLGNBQUksQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDO0FBQzdCLGlCQUFPLElBQUksQ0FBQztTQUNmO0FBQ0QsWUFBSSxFQUFFLFVBQVMsUUFBUSxFQUFFO0FBQ3JCLGNBQUksQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDO0FBQzdCLGlCQUFPLElBQUksQ0FBQztTQUNmO0FBQ0QsY0FBTSxFQUFFLFVBQVMsUUFBUSxFQUFFO0FBQ3ZCLGNBQUksQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDO0FBQy9CLGlCQUFPLElBQUksQ0FBQztTQUNmO0FBQ0Qsa0JBQVUsRUFBRSxVQUFTLE9BQU8sRUFBRTtBQUMxQixlQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sRUFBRTtBQUNyQixnQkFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztXQUM5RDtTQUNKO09BQ0osQ0FBQztBQUNGLGFBQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUMzQjtHQUNGLENBQUM7O0FBRUYsR0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7O21CQUlkLENBQUMiLCJmaWxlIjoicmVib3VuZC5ydW50aW1lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gUHJvcGVydHkgQ29tcGlsZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IHRva2VuaXplciBmcm9tIFwicHJvcGVydHktY29tcGlsZXIvdG9rZW5pemVyXCI7XG5cbnZhciBjb21wdXRlZFByb3BlcnRpZXMgPSBbXTtcblxuLy8gVE9ETzogTWFrZSB0aGlzIGZhcnJycnJyIG1vcmUgcm9idXN0Li4udmVyeSBtaW5pbWFsIHJpZ2h0IG5vd1xuXG5mdW5jdGlvbiBjb21waWxlKHByb3AsIG5hbWUpe1xuICB2YXIgb3V0cHV0ID0ge307XG5cbiAgaWYocHJvcC5fX3BhcmFtcykgcmV0dXJuIHByb3AuX19wYXJhbXM7XG5cbiAgdmFyIHN0ciA9IHByb3AudG9TdHJpbmcoKSwgLy8ucmVwbGFjZSgvKD86XFwvXFwqKD86W1xcc1xcU10qPylcXCpcXC8pfCg/OihbXFxzO10pK1xcL1xcLyg/Oi4qKSQpL2dtLCAnJDEnKSwgLy8gU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGZ1bmN0aW9uIHNhbnMgY29tbWVudHNcbiAgICAgIG5leHRUb2tlbiA9IHRva2VuaXplci50b2tlbml6ZShzdHIpLFxuICAgICAgdG9rZW5zID0gW10sXG4gICAgICB0b2tlbixcbiAgICAgIGZpbmlzaGVkUGF0aHMgPSBbXSxcbiAgICAgIG5hbWVkUGF0aHMgPSB7fSxcbiAgICAgIG9wY29kZXMgPSBbXSxcbiAgICAgIG5hbWVkID0gZmFsc2UsXG4gICAgICBsaXN0ZW5pbmcgPSAwLFxuICAgICAgaW5TdWJDb21wb25lbnQgPSAwLFxuICAgICAgc3ViQ29tcG9uZW50ID0gW10sXG4gICAgICByb290LFxuICAgICAgcGF0aHMgPSBbXSxcbiAgICAgIHBhdGgsXG4gICAgICB0bXBQYXRoLFxuICAgICAgYXR0cnMgPSBbXSxcbiAgICAgIHdvcmtpbmdwYXRoID0gW10sXG4gICAgICB0ZXJtaW5hdG9ycyA9IFsnOycsJywnLCc9PScsJz4nLCc8JywnPj0nLCc8PScsJz49PScsJzw9PScsJyE9JywnIT09JywgJz09PScsICcmJicsICd8fCcsICcrJywgJy0nLCAnLycsICcqJywgJ3snLCAnfSddO1xuICBkb3tcblxuICAgIHRva2VuID0gbmV4dFRva2VuKCk7XG5cbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ3RoaXMnKXtcbiAgICAgIGxpc3RlbmluZysrO1xuICAgICAgd29ya2luZ3BhdGggPSBbXTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBoYW5kbGUgZ2V0cyBvbiBjb2xsZWN0aW9uc1xuICAgIGlmKHRva2VuLnZhbHVlID09PSAnZ2V0Jyl7XG4gICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB3aGlsZShfLmlzVW5kZWZpbmVkKHBhdGgudmFsdWUpKXtcbiAgICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXBsYWNlIGFueSBhY2Nlc3MgdG8gYSBjb2xsZWN0aW9uIHdpdGggdGhlIGdlbmVyaWMgQGVhY2ggcGxhY2Vob2xkZXIgYW5kIHB1c2ggZGVwZW5kYW5jeVxuICAgICAgd29ya2luZ3BhdGgucHVzaChwYXRoLnZhbHVlLnJlcGxhY2UoL1xcWy4rXFxdL2csIFwiLkBlYWNoXCIpLnJlcGxhY2UoL15cXC4vLCAnJykpO1xuICAgIH1cblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAncGx1Y2snKXtcbiAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIHdoaWxlKF8uaXNVbmRlZmluZWQocGF0aC52YWx1ZSkpe1xuICAgICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB9XG5cbiAgICAgIHdvcmtpbmdwYXRoLnB1c2goJ0BlYWNoLicgKyBwYXRoLnZhbHVlKTtcbiAgICB9XG5cbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ3NsaWNlJyB8fCB0b2tlbi52YWx1ZSA9PT0gJ2Nsb25lJyB8fCB0b2tlbi52YWx1ZSA9PT0gJ2ZpbHRlcicpe1xuICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgaWYocGF0aC50eXBlLnR5cGUgPT09ICcoJykgd29ya2luZ3BhdGgucHVzaCgnQGVhY2gnKTtcbiAgICB9XG5cbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ2F0Jyl7XG5cbiAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIHdoaWxlKF8uaXNVbmRlZmluZWQocGF0aC52YWx1ZSkpe1xuICAgICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB9XG4gICAgICAvLyB3b3JraW5ncGF0aFt3b3JraW5ncGF0aC5sZW5ndGggLTFdID0gd29ya2luZ3BhdGhbd29ya2luZ3BhdGgubGVuZ3RoIC0xXSArICdbJyArIHBhdGgudmFsdWUgKyAnXSc7XG4gICAgICAvLyB3b3JraW5ncGF0aC5wdXNoKCdbJyArIHBhdGgudmFsdWUgKyAnXScpO1xuICAgICAgd29ya2luZ3BhdGgucHVzaCgnQGVhY2gnKTtcblxuICAgIH1cblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAnd2hlcmUnIHx8IHRva2VuLnZhbHVlID09PSAnZmluZFdoZXJlJyl7XG4gICAgICB3b3JraW5ncGF0aC5wdXNoKCdAZWFjaCcpO1xuICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgYXR0cnMgPSBbXTtcbiAgICAgIHZhciBpdHIgPSAwO1xuICAgICAgd2hpbGUocGF0aC50eXBlLnR5cGUgIT09ICcpJyl7XG4gICAgICAgIGlmKHBhdGgudmFsdWUpe1xuICAgICAgICAgIGlmKGl0ciUyID09PSAwKXtcbiAgICAgICAgICAgIGF0dHJzLnB1c2gocGF0aC52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0cisrO1xuICAgICAgICB9XG4gICAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIH1cbiAgICAgIHdvcmtpbmdwYXRoLnB1c2goYXR0cnMpO1xuICAgIH1cblxuICAgIGlmKGxpc3RlbmluZyAmJiAoXy5pbmRleE9mKHRlcm1pbmF0b3JzLCB0b2tlbi50eXBlLnR5cGUpID4gLTEgfHwgXy5pbmRleE9mKHRlcm1pbmF0b3JzLCB0b2tlbi52YWx1ZSkgPiAtMSkpe1xuICAgICAgd29ya2luZ3BhdGggPSBfLnJlZHVjZSh3b3JraW5ncGF0aCwgZnVuY3Rpb24obWVtbywgcGF0aHMpe1xuICAgICAgICB2YXIgbmV3TWVtbyA9IFtdO1xuICAgICAgICBwYXRocyA9ICghXy5pc0FycmF5KHBhdGhzKSkgPyBbcGF0aHNdIDogcGF0aHM7XG4gICAgICAgIF8uZWFjaChwYXRocywgZnVuY3Rpb24ocGF0aCl7XG4gICAgICAgICAgXy5lYWNoKG1lbW8sIGZ1bmN0aW9uKG1lbSl7XG4gICAgICAgICAgICBuZXdNZW1vLnB1c2goXy5jb21wYWN0KFttZW0sIHBhdGhdKS5qb2luKCcuJykucmVwbGFjZSgnLlsnLCAnWycpKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZXdNZW1vO1xuICAgICAgfSwgWycnXSk7XG4gICAgICBmaW5pc2hlZFBhdGhzID0gXy5jb21wYWN0KF8udW5pb24oZmluaXNoZWRQYXRocywgd29ya2luZ3BhdGgpKTtcbiAgICAgIHdvcmtpbmdwYXRoID0gW107XG4gICAgICBsaXN0ZW5pbmctLTtcbiAgICB9XG5cbiAgfSB3aGlsZSh0b2tlbi5zdGFydCAhPT0gdG9rZW4uZW5kKTtcblxuICBjb25zb2xlLmxvZygnQ09NUFVURUQgUFJPUEVSVFknLCBuYW1lLCAncmVnaXN0ZXJlZCB3aXRoIHRoZXNlIGRlcGVuZGFuY3kgcGF0aHM6JywgZmluaXNoZWRQYXRocyk7XG5cbiAgLy8gUmV0dXJuIHRoZSBkZXBlbmRhbmNpZXMgbGlzdFxuICByZXR1cm4gcHJvcC5fX3BhcmFtcyA9IGZpbmlzaGVkUGF0aHM7XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgeyBjb21waWxlOiBjb21waWxlIH07IiwiLy8gUmVib3VuZCBDb21wb25lbnRcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IERPTUhlbHBlciBmcm9tIFwiZG9tLWhlbHBlclwiO1xuaW1wb3J0IGhvb2tzIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9ob29rc1wiO1xuaW1wb3J0IGhlbHBlcnMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hlbHBlcnNcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuaW1wb3J0IHsgTW9kZWwgfSBmcm9tIFwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YVwiO1xuXG5cbi8vIElmIEJhY2tib25lIGhhc24ndCBiZWVuIHN0YXJ0ZWQgeWV0LCB0aHJvdyBlcnJvclxuaWYoIXdpbmRvdy5CYWNrYm9uZSkgdGhyb3cgXCJCYWNrYm9uZSBtdXN0IGJlIG9uIHRoZSBwYWdlIGZvciBSZWJvdW5kIHRvIGxvYWQuXCI7XG5cbi8vIFJldHVybnMgdHJ1ZSBpZiBgc3RyYCBzdGFydHMgd2l0aCBgdGVzdGBcbmZ1bmN0aW9uIHN0YXJ0c1dpdGgoc3RyLCB0ZXN0KXtcbiAgaWYoc3RyID09PSB0ZXN0KSByZXR1cm4gdHJ1ZTtcbiAgc3RyID0gJC5zcGxpdFBhdGgoc3RyKTtcbiAgdGVzdCA9ICQuc3BsaXRQYXRoKHRlc3QpO1xuICB3aGlsZSh0ZXN0WzBdICYmIHN0clswXSl7XG4gICAgaWYoc3RyWzBdICE9PSB0ZXN0WzBdICYmIHN0clswXSAhPT0gJ0BlYWNoJyAmJiB0ZXN0WzBdICE9PSAnQGVhY2gnKSByZXR1cm4gZmFsc2U7XG4gICAgdGVzdC5zaGlmdCgpO1xuICAgIHN0ci5zaGlmdCgpO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiByZW5kZXJDYWxsYmFjaygpe1xuICB2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX3RvUmVuZGVyLmxlbmd0aDtcbiAgZGVsZXRlIHRoaXMuX3JlbmRlclRpbWVvdXQ7XG4gIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICB0aGlzLl90b1JlbmRlci5zaGlmdCgpLm5vdGlmeSgpO1xuICB9XG4gIHRoaXMuX3RvUmVuZGVyLmFkZGVkID0ge307XG59XG5cbmZ1bmN0aW9uIGh5ZHJhdGUoc3BlYywgb3B0aW9ucyl7XG4gIC8vIFJldHVybiBhIHdyYXBwZXIgZnVuY3Rpb24gdGhhdCB3aWxsIG1lcmdlIHVzZXIgcHJvdmlkZWQgaGVscGVycyBhbmQgaG9va3Mgd2l0aCBvdXIgZGVmYXVsdHNcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEsIG9wdGlvbnMpe1xuXG4gICAgLy8gUmVib3VuZCdzIGRlZmF1bHQgZW52aXJvbm1lbnRcbiAgICAvLyBUaGUgYXBwbGljYXRpb24gZW52aXJvbm1lbnQgaXMgcHJvcGFnYXRlZCBkb3duIGVhY2ggcmVuZGVyIGNhbGwgYW5kXG4gICAgLy8gYXVnbWVudGVkIHdpdGggaGVscGVycyBhcyBpdCBnb2VzXG4gICAgdmFyIGVudiA9IHtcbiAgICAgIGhlbHBlcnM6IGhlbHBlcnMuaGVscGVycyxcbiAgICAgIGhvb2tzOiBob29rcyxcbiAgICAgIGRvbTogbmV3IERPTUhlbHBlcigpLFxuICAgICAgdXNlRnJhZ21lbnRDYWNoZTogdHJ1ZVxuICAgIH07XG5cbiAgICAvLyBFbnN1cmUgd2UgaGF2ZSBhIGNvbnRleHR1YWwgZWxlbWVudCB0byBwYXNzIHRvIHJlbmRlclxuICAgIHZhciBjb250ZXh0RWxlbWVudCA9IGRhdGEuZWwgfHwgZG9jdW1lbnQuYm9keTtcblxuICAgIC8vIE1lcmdlIG91ciBkZWZhdWx0IGhlbHBlcnMgYW5kIGhvb2tzIHdpdGggdXNlciBwcm92aWRlZCBoZWxwZXJzXG4gICAgZW52LmhlbHBlcnMgPSBfLmRlZmF1bHRzKChvcHRpb25zLmhlbHBlcnMgfHwge30pLCBlbnYuaGVscGVycyk7XG4gICAgZW52Lmhvb2tzID0gXy5kZWZhdWx0cygob3B0aW9ucy5ob29rcyB8fCB7fSksIGVudi5ob29rcyk7XG5cbiAgICAvLyBDYWxsIG91ciBmdW5jIHdpdGggbWVyZ2VkIGhlbHBlcnMgYW5kIGhvb2tzXG4gICAgcmV0dXJuIHNwZWMucmVuZGVyKGRhdGEsIGVudiwgY29udGV4dEVsZW1lbnQpO1xuICB9O1xufTtcblxuXG4vLyBOZXcgQmFja2JvbmUgQ29tcG9uZW50XG52YXIgQ29tcG9uZW50ID0gTW9kZWwuZXh0ZW5kKHtcblxuICBpc0NvbXBvbmVudDogdHJ1ZSxcblxuICBfY2FsbE9uQ29tcG9uZW50OiBmdW5jdGlvbihuYW1lLCBldmVudCl7XG4gICAgaWYoIV8uaXNGdW5jdGlvbih0aGlzW25hbWVdKSl7IHRocm93IFwiRVJST1I6IE5vIG1ldGhvZCBuYW1lZCBcIiArIG5hbWUgKyBcIiBvbiBjb21wb25lbnQgXCIgKyB0aGlzLl9fbmFtZSArIFwiIVwiOyB9XG4gICAgcmV0dXJuIHRoaXNbbmFtZV0uY2FsbCh0aGlzLCBldmVudCk7XG4gIH0sXG5cbiAgX2xpc3RlblRvU2VydmljZTogZnVuY3Rpb24oa2V5LCBzZXJ2aWNlKXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5saXN0ZW5UbyhzZXJ2aWNlLCAnYWxsJywgKHR5cGUsIG1vZGVsLCB2YWx1ZSwgb3B0aW9ucykgPT4ge1xuICAgICAgdmFyIGF0dHIsXG4gICAgICAgICAgcGF0aCA9IG1vZGVsLl9fcGF0aCgpLFxuICAgICAgICAgIGNoYW5nZWQ7XG4gICAgICBpZih0eXBlLmluZGV4T2YoJ2NoYW5nZTonKSA9PT0gMCl7XG4gICAgICAgIGNoYW5nZWQgPSBtb2RlbC5jaGFuZ2VkQXR0cmlidXRlcygpO1xuICAgICAgICBmb3IoYXR0ciBpbiBjaGFuZ2VkKXtcbiAgICAgICAgICAvLyBUT0RPOiBNb2RpZnlpbmcgYXJndW1lbnRzIGFycmF5IGlzIGJhZC4gY2hhbmdlIHRoaXNcbiAgICAgICAgICB0eXBlID0gKCdjaGFuZ2U6JyArIGtleSArICcuJyArIHBhdGggKyAocGF0aCAmJiAnLicpICsgYXR0cik7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgICAgICAgIG9wdGlvbnMuc2VydmljZSA9IGtleTtcbiAgICAgICAgICB0aGlzLnRyaWdnZXIuY2FsbCh0aGlzLCB0eXBlLCBtb2RlbCwgdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIuY2FsbCh0aGlzLCB0eXBlLCBtb2RlbCwgdmFsdWUsIG9wdGlvbnMpO1xuICAgIH0pO1xuICB9LFxuXG4gIGRlaW5pdGlhbGl6ZTogZnVuY3Rpb24oKXtcbiAgICBpZih0aGlzLmNvbnN1bWVycy5sZW5ndGgpIHJldHVybjtcbiAgICBfLmVhY2godGhpcy5zZXJ2aWNlcywgKHNlcnZpY2UsIGtleSkgPT4ge1xuICAgICAgXy5lYWNoKHNlcnZpY2UuY29uc3VtZXJzLCAoY29uc3VtZXIsIGluZGV4KSA9PiB7XG4gICAgICAgIGlmKGNvbnN1bWVyLmNvbXBvbmVudCA9PT0gdGhpcykgc2VydmljZS5jb25zdW1lcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlbGV0ZSB0aGlzLnNlcnZpY2VzO1xuICAgIFJlYm91bmQuTW9kZWwucHJvdG90eXBlLmRlaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuXG4gIC8vIFNldCBpcyBvdmVycmlkZGVuIG9uIGNvbXBvbmVudHMgdG8gYWNjZXB0IGNvbXBvbmVudHMgYXMgYSB2YWxpZCBpbnB1dCB0eXBlLlxuICAvLyBDb21wb25lbnRzIHNldCBvbiBvdGhlciBDb21wb25lbnRzIGFyZSBtaXhlZCBpbiBhcyBhIHNoYXJlZCBvYmplY3QuIHtyYXc6IHRydWV9XG4gIC8vIEl0IGFsc28gbWFya3MgaXRzZWxmIGFzIGEgY29uc3VtZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbCwgb3B0aW9ucyl7XG4gICAgdmFyIGF0dHJzLCBhdHRyLCBzZXJ2aWNlT3B0aW9ucztcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGF0dHJzID0gKGtleS5pc01vZGVsKSA/IGtleS5hdHRyaWJ1dGVzIDoga2V5O1xuICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICB9IGVsc2UgKGF0dHJzID0ge30pW2tleV0gPSB2YWw7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICAgIC8vIElmIHJlc2V0IG9wdGlvbiBwYXNzZWQsIGRvIGEgcmVzZXQuIElmIG5vdGhpbmcgcGFzc2VkLCByZXR1cm4uXG4gICAgaWYob3B0aW9ucy5yZXNldCA9PT0gdHJ1ZSkgcmV0dXJuIHRoaXMucmVzZXQoYXR0cnMsIG9wdGlvbnMpO1xuICAgIGlmKG9wdGlvbnMuZGVmYXVsdHMgPT09IHRydWUpIHRoaXMuZGVmYXVsdHMgPSBhdHRycztcbiAgICBpZihfLmlzRW1wdHkoYXR0cnMpKSByZXR1cm47XG5cbiAgICAvLyBGb3IgZWFjaCBhdHRyaWJ1dGUgcGFzc2VkOlxuICAgIGZvcihrZXkgaW4gYXR0cnMpe1xuICAgICAgYXR0ciA9IGF0dHJzW2tleV07XG4gICAgICBpZihhdHRyICYmIGF0dHIuaXNDb21wb25lbnQpe1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucyB8fCAoc2VydmljZU9wdGlvbnMgPSBfLmRlZmF1bHRzKF8uY2xvbmUob3B0aW9ucyksIHtyYXc6IHRydWV9KSk7XG4gICAgICAgIGF0dHIuY29uc3VtZXJzLnB1c2goe2tleToga2V5LCBjb21wb25lbnQ6IHRoaXN9KTtcbiAgICAgICAgdGhpcy5zZXJ2aWNlc1trZXldID0gYXR0cjtcbiAgICAgICAgdGhpcy5fbGlzdGVuVG9TZXJ2aWNlKGtleSwgYXR0cik7XG4gICAgICAgIFJlYm91bmQuTW9kZWwucHJvdG90eXBlLnNldC5jYWxsKHRoaXMsIGtleSwgYXR0ciwgc2VydmljZU9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgUmVib3VuZC5Nb2RlbC5wcm90b3R5cGUuc2V0LmNhbGwodGhpcywga2V5LCBhdHRyLCBvcHRpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKG9wdGlvbnMpe1xuICAgIHZhciBrZXksIGF0dHIsIHNlbGYgPSB0aGlzO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIF8uYmluZEFsbCh0aGlzLCAnX2NhbGxPbkNvbXBvbmVudCcsICdfbGlzdGVuVG9TZXJ2aWNlJyk7XG4gICAgdGhpcy5jaWQgPSBfLnVuaXF1ZUlkKCdjb21wb25lbnQnKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLmNoYW5nZWQgPSB7fTtcbiAgICB0aGlzLmhlbHBlcnMgPSB7fTtcbiAgICB0aGlzLmNvbnN1bWVycyA9IFtdO1xuICAgIHRoaXMuc2VydmljZXMgPSB7fTtcbiAgICB0aGlzLl9fcGFyZW50X18gPSB0aGlzLl9fcm9vdF9fID0gdGhpcztcbiAgICB0aGlzLmxpc3RlblRvKHRoaXMsICdhbGwnLCB0aGlzLl9vbkNoYW5nZSk7XG5cbiAgICAvLyBUYWtlIG91ciBwYXJzZWQgZGF0YSBhbmQgYWRkIGl0IHRvIG91ciBiYWNrYm9uZSBkYXRhIHN0cnVjdHVyZS4gRG9lcyBhIGRlZXAgZGVmYXVsdHMgc2V0LlxuICAgIC8vIEluIHRoZSBtb2RlbCwgcHJpbWF0aXZlcyAoYXJyYXlzLCBvYmplY3RzLCBldGMpIGFyZSBjb252ZXJ0ZWQgdG8gQmFja2JvbmUgT2JqZWN0c1xuICAgIC8vIEZ1bmN0aW9ucyBhcmUgY29tcGlsZWQgdG8gZmluZCB0aGVpciBkZXBlbmRhbmNpZXMgYW5kIGFkZGVkIGFzIGNvbXB1dGVkIHByb3BlcnRpZXNcbiAgICAvLyBTZXQgb3VyIGNvbXBvbmVudCdzIGNvbnRleHQgd2l0aCB0aGUgcGFzc2VkIGRhdGEgbWVyZ2VkIHdpdGggdGhlIGNvbXBvbmVudCdzIGRlZmF1bHRzXG4gICAgdGhpcy5zZXQoKHRoaXMuZGVmYXVsdHMgfHwge30pKTtcbiAgICB0aGlzLnNldCgob3B0aW9ucy5kYXRhIHx8IHt9KSk7XG5cbiAgICAvLyBDYWxsIG9uIGNvbXBvbmVudCBpcyB1c2VkIGJ5IHRoZSB7e29ufX0gaGVscGVyIHRvIGNhbGwgYWxsIGV2ZW50IGNhbGxiYWNrcyBpbiB0aGUgc2NvcGUgb2YgdGhlIGNvbXBvbmVudFxuICAgIHRoaXMuaGVscGVycy5fY2FsbE9uQ29tcG9uZW50ID0gdGhpcy5fY2FsbE9uQ29tcG9uZW50O1xuXG5cbiAgICAvLyBHZXQgYW55IGFkZGl0aW9uYWwgcm91dGVzIHBhc3NlZCBpbiBmcm9tIG9wdGlvbnNcbiAgICB0aGlzLnJvdXRlcyA9ICBfLmRlZmF1bHRzKChvcHRpb25zLnJvdXRlcyB8fCB7fSksIHRoaXMucm91dGVzKTtcbiAgICAvLyBFbnN1cmUgdGhhdCBhbGwgcm91dGUgZnVuY3Rpb25zIGV4aXN0XG4gICAgXy5lYWNoKHRoaXMucm91dGVzLCBmdW5jdGlvbih2YWx1ZSwga2V5LCByb3V0ZXMpe1xuICAgICAgICBpZih0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKXsgdGhyb3coJ0Z1bmN0aW9uIG5hbWUgcGFzc2VkIHRvIHJvdXRlcyBpbiAgJyArIHRoaXMuX19uYW1lICsgJyBjb21wb25lbnQgbXVzdCBiZSBhIHN0cmluZyEnKTsgfVxuICAgICAgICBpZighdGhpc1t2YWx1ZV0peyB0aHJvdygnQ2FsbGJhY2sgZnVuY3Rpb24gJyt2YWx1ZSsnIGRvZXMgbm90IGV4aXN0IG9uIHRoZSAgJyArIHRoaXMuX19uYW1lICsgJyBjb21wb25lbnQhJyk7IH1cbiAgICB9LCB0aGlzKTtcblxuICAgIC8vIE91ciBDb21wb25lbnQgaXMgZnVsbHkgY3JlYXRlZCBub3csIGJ1dCBub3QgcmVuZGVyZWQuIENhbGwgY3JlYXRlZCBjYWxsYmFjay5cbiAgICBpZihfLmlzRnVuY3Rpb24odGhpcy5jcmVhdGVkQ2FsbGJhY2spKXtcbiAgICAgIHRoaXMuY3JlYXRlZENhbGxiYWNrLmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gU2V0IG91ciBvdXRsZXQgYW5kIHRlbXBsYXRlIGlmIHdlIGhhdmUgdGhlbVxuICAgIHRoaXMuZWwgPSBvcHRpb25zLm91dGxldCB8fCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdGhpcy4kZWwgPSAoXy5pc1VuZGVmaW5lZCh3aW5kb3cuQmFja2JvbmUuJCkpID8gZmFsc2UgOiB3aW5kb3cuQmFja2JvbmUuJCh0aGlzLmVsKTtcbiAgICB0aGlzLnRlbXBsYXRlID0gb3B0aW9ucy50ZW1wbGF0ZSB8fCB0aGlzLnRlbXBsYXRlO1xuXG4gICAgLy8gVGFrZSBvdXIgcHJlY29tcGlsZWQgdGVtcGxhdGUgYW5kIGh5ZHJhdGVzIGl0LiBXaGVuIFJlYm91bmQgQ29tcGlsZXIgaXMgaW5jbHVkZWQsIGNhbiBiZSBhIGhhbmRsZWJhcnMgdGVtcGxhdGUgc3RyaW5nLlxuICAgIC8vIFRPRE86IENoZWNrIGlmIHRlbXBsYXRlIGlzIGEgc3RyaW5nLCBhbmQgaWYgdGhlIGNvbXBpbGVyIGV4aXN0cyBvbiB0aGUgcGFnZSwgYW5kIGNvbXBpbGUgaWYgbmVlZGVkXG4gICAgaWYodGhpcy50ZW1wbGF0ZSl7XG4gICAgICB0aGlzLnRlbXBsYXRlID0gKHR5cGVvZiB0aGlzLnRlbXBsYXRlID09PSAnb2JqZWN0JykgPyBoeWRyYXRlKHRoaXMudGVtcGxhdGUpIDogdGhpcy50ZW1wbGF0ZTtcblxuICAgICAgLy8gUmVuZGVyIG91ciBkb20gYW5kIHBsYWNlIHRoZSBkb20gaW4gb3VyIGN1c3RvbSBlbGVtZW50XG4gICAgICAvLyBUZW1wbGF0ZSBhY2NlcHRzIFtkYXRhLCBvcHRpb25zLCBjb250ZXh0dWFsRWxlbWVudF1cbiAgICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy50ZW1wbGF0ZSh0aGlzLCB7aGVscGVyczogdGhpcy5oZWxwZXJzfSwgdGhpcy5lbCkpO1xuXG4gICAgICAvLyBBZGQgYWN0aXZlIGNsYXNzIHRvIHRoaXMgbmV3bHkgcmVuZGVyZWQgdGVtcGxhdGUncyBsaW5rIGVsZW1lbnRzIHRoYXQgcmVxdWlyZSBpdFxuICAgICAgJCh0aGlzLmVsKS5tYXJrTGlua3MoKTtcbiAgICB9XG5cbiAgICB0aGlzLmluaXRpYWxpemUoKTtcblxuICB9LFxuXG4gICQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgaWYoIXRoaXMuJGVsKXtcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdObyBET00gbWFuaXB1bGF0aW9uIGxpYnJhcnkgb24gdGhlIHBhZ2UhJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiRlbC5maW5kKHNlbGVjdG9yKTtcbiAgfSxcblxuICAvLyBUcmlnZ2VyIGFsbCBldmVudHMgb24gYm90aCB0aGUgY29tcG9uZW50IGFuZCB0aGUgZWxlbWVudFxuICB0cmlnZ2VyOiBmdW5jdGlvbihldmVudE5hbWUpe1xuICAgIGlmKHRoaXMuZWwpe1xuICAgICAgJCh0aGlzLmVsKS50cmlnZ2VyKGV2ZW50TmFtZSwgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLnRyaWdnZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcblxuICBfb25BdHRyaWJ1dGVDaGFuZ2U6IGZ1bmN0aW9uKGF0dHJOYW1lLCBvbGRWYWwsIG5ld1ZhbCl7XG4gICAgLy8gQ29tbWVudGVkIG91dCBiZWNhdXNlIHRyYWNraW5nIGF0dHJpYnV0ZSBjaGFuZ2VzIGFuZCBtYWtpbmcgc3VyZSB0aGV5IGRvbnQgaW5maW5pdGUgbG9vcCBpcyBoYXJkLlxuICAgIC8vIFRPRE86IE1ha2Ugd29yay5cbiAgICAvLyB0cnl7IG5ld1ZhbCA9IEpTT04ucGFyc2UobmV3VmFsKTsgfSBjYXRjaCAoZSl7IG5ld1ZhbCA9IG5ld1ZhbDsgfVxuICAgIC8vXG4gICAgLy8gLy8gZGF0YSBhdHRyaWJ1dGVzIHNob3VsZCBiZSByZWZlcmFuY2VkIGJ5IHRoZWlyIGNhbWVsIGNhc2UgbmFtZVxuICAgIC8vIGF0dHJOYW1lID0gYXR0ck5hbWUucmVwbGFjZSgvXmRhdGEtL2csIFwiXCIpLnJlcGxhY2UoLy0oW2Etel0pL2csIGZ1bmN0aW9uIChnKSB7IHJldHVybiBnWzFdLnRvVXBwZXJDYXNlKCk7IH0pO1xuICAgIC8vXG4gICAgLy8gb2xkVmFsID0gdGhpcy5nZXQoYXR0ck5hbWUpO1xuICAgIC8vXG4gICAgLy8gaWYobmV3VmFsID09PSBudWxsKXsgdGhpcy51bnNldChhdHRyTmFtZSk7IH1cbiAgICAvL1xuICAgIC8vIC8vIElmIG9sZFZhbCBpcyBhIG51bWJlciwgYW5kIG5ld1ZhbCBpcyBvbmx5IG51bWVyaWNhbCwgcHJlc2VydmUgdHlwZVxuICAgIC8vIGlmKF8uaXNOdW1iZXIob2xkVmFsKSAmJiBfLmlzU3RyaW5nKG5ld1ZhbCkgJiYgbmV3VmFsLm1hdGNoKC9eWzAtOV0qJC9pKSl7XG4gICAgLy8gICBuZXdWYWwgPSBwYXJzZUludChuZXdWYWwpO1xuICAgIC8vIH1cbiAgICAvL1xuICAgIC8vIGVsc2V7IHRoaXMuc2V0KGF0dHJOYW1lLCBuZXdWYWwsIHtxdWlldDogdHJ1ZX0pOyB9XG4gIH0sXG5cblxuICBfb25DaGFuZ2U6IGZ1bmN0aW9uKHR5cGUsIG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKXtcbiAgICB2YXIgc2hvcnRjaXJjdWl0ID0geyBjaGFuZ2U6IDEsIHNvcnQ6IDEsIHJlcXVlc3Q6IDEsIGRlc3Ryb3k6IDEsIHN5bmM6IDEsIGVycm9yOiAxLCBpbnZhbGlkOiAxLCByb3V0ZTogMSwgZGlydHk6IDEgfTtcbiAgICBpZiggc2hvcnRjaXJjdWl0W3R5cGVdICkgcmV0dXJuO1xuXG4gICAgdmFyIGRhdGEsIGNoYW5nZWQ7XG4gICAgbW9kZWwgfHwgKG1vZGVsID0ge30pO1xuICAgIGNvbGxlY3Rpb24gfHwgKGNvbGxlY3Rpb24gPSB7fSk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICAhY29sbGVjdGlvbi5pc0RhdGEgJiYgKHR5cGUuaW5kZXhPZignY2hhbmdlOicpID09PSAtMSkgJiYgKG9wdGlvbnMgPSBjb2xsZWN0aW9uKSAmJiAoY29sbGVjdGlvbiA9IG1vZGVsKTtcbiAgICB0aGlzLl90b1JlbmRlciB8fCAodGhpcy5fdG9SZW5kZXIgPSBbXSk7XG5cbiAgICBpZiggKHR5cGUgPT09ICdyZXNldCcgJiYgb3B0aW9ucy5wcmV2aW91c0F0dHJpYnV0ZXMpIHx8IHR5cGUuaW5kZXhPZignY2hhbmdlOicpICE9PSAtMSl7XG4gICAgICBkYXRhID0gbW9kZWw7XG4gICAgICBjaGFuZ2VkID0gbW9kZWwuY2hhbmdlZEF0dHJpYnV0ZXMoKTtcbiAgICB9XG4gICAgZWxzZSBpZih0eXBlID09PSAnYWRkJyB8fCB0eXBlID09PSAncmVtb3ZlJyB8fCAodHlwZSA9PT0gJ3Jlc2V0JyAmJiBvcHRpb25zLnByZXZpb3VzTW9kZWxzKSl7XG4gICAgICBkYXRhID0gY29sbGVjdGlvbjtcbiAgICAgIGNoYW5nZWQgPSB7XG4gICAgICAgICdAZWFjaCc6IGRhdGFcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYoIWRhdGEgfHwgIWNoYW5nZWQpIHJldHVybjtcblxuICAgIHZhciBwdXNoID0gZnVuY3Rpb24oYXJyKXtcbiAgICAgIHZhciBpLCBsZW4gPSBhcnIubGVuZ3RoO1xuICAgICAgdGhpcy5hZGRlZCB8fCAodGhpcy5hZGRlZCA9IHt9KTtcbiAgICAgIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICAgICAgaWYodGhpcy5hZGRlZFthcnJbaV0uY2lkXSkgY29udGludWU7XG4gICAgICAgIHRoaXMuYWRkZWRbYXJyW2ldLmNpZF0gPSAxO1xuICAgICAgICB0aGlzLnB1c2goYXJyW2ldKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBjb250ZXh0ID0gdGhpcztcbiAgICB2YXIgYmFzZVBhdGggPSBkYXRhLl9fcGF0aCgpO1xuICAgIC8vIElmIHRoaXMgZXZlbnQgY2FtZSBmcm9tIHdpdGhpbiBhIHNlcnZpY2UsIGluY2x1ZGUgdGhlIHNlcnZpY2Uga2V5IGluIHRoZSBiYXNlIHBhdGhcbiAgICBpZihvcHRpb25zLnNlcnZpY2UpIGJhc2VQYXRoID0gb3B0aW9ucy5zZXJ2aWNlICsgJy4nICsgYmFzZVBhdGg7XG4gICAgdmFyIHBhcnRzID0gJC5zcGxpdFBhdGgoYmFzZVBhdGgpO1xuICAgIHZhciBrZXksIG9ic1BhdGgsIHBhdGgsIG9ic2VydmVycztcblxuICAgIC8vIEZvciBlYWNoIGNoYW5nZWQga2V5LCB3YWxrIGRvd24gdGhlIGRhdGEgdHJlZSBmcm9tIHRoZSByb290IHRvIHRoZSBkYXRhXG4gICAgLy8gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgZXZlbnQgYW5kIGFkZCBhbGwgcmVsZXZlbnQgY2FsbGJhY2tzIHRvIHRoaXNcbiAgICAvLyBvYmplY3QncyBfdG9SZW5kZXIgcXVldWUuXG4gICAgZG97XG4gICAgICBmb3Ioa2V5IGluIGNoYW5nZWQpe1xuICAgICAgICBwYXRoID0gKGJhc2VQYXRoICsgKGJhc2VQYXRoICYmIGtleSAmJiAnLicpICsga2V5KS5yZXBsYWNlKGNvbnRleHQuX19wYXRoKCksICcnKS5yZXBsYWNlKC9cXFtbXlxcXV0rXFxdL2csIFwiLkBlYWNoXCIpLnJlcGxhY2UoL15cXC4vLCAnJyk7XG4gICAgICAgIGZvcihvYnNQYXRoIGluIGNvbnRleHQuX19vYnNlcnZlcnMpe1xuICAgICAgICAgIG9ic2VydmVycyA9IGNvbnRleHQuX19vYnNlcnZlcnNbb2JzUGF0aF07XG4gICAgICAgICAgaWYoc3RhcnRzV2l0aChvYnNQYXRoLCBwYXRoKSl7XG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgY29sbGVjdGlvbiBldmVudCwgdHJpZ2dlciBldmVyeXRoaW5nLCBvdGhlcndpc2Ugb25seSB0cmlnZ2VyIHByb3BlcnR5IGNoYW5nZSBjYWxsYmFja3NcbiAgICAgICAgICAgIGlmKGRhdGEuaXNDb2xsZWN0aW9uKSBwdXNoLmNhbGwodGhpcy5fdG9SZW5kZXIsIG9ic2VydmVycy5jb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIHB1c2guY2FsbCh0aGlzLl90b1JlbmRlciwgb2JzZXJ2ZXJzLm1vZGVsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IHdoaWxlKGNvbnRleHQgIT09IGRhdGEgJiYgKGNvbnRleHQgPSBjb250ZXh0LmdldChwYXJ0cy5zaGlmdCgpKSkpXG5cbiAgICAvLyBRdWV1ZSBvdXIgcmVuZGVyIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhcyBiZWVuIGV4aGF1c3RlZFxuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5fcmVuZGVyVGltZW91dCk7XG4gICAgdGhpcy5fcmVuZGVyVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KF8uYmluZChyZW5kZXJDYWxsYmFjaywgdGhpcyksIDApO1xuICB9XG5cbn0pO1xuXG5cbkNvbXBvbmVudC5leHRlbmQ9IGZ1bmN0aW9uKHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gIHZhciBwYXJlbnQgPSB0aGlzLFxuICAgICAgY2hpbGQsXG4gICAgICByZXNlcnZlZE1ldGhvZHMgPSB7XG4gICAgICAgICd0cmlnZ2VyJzoxLCAgICAnY29uc3RydWN0b3InOjEsICdnZXQnOjEsICAgICAgICAgICAgICAgJ3NldCc6MSwgICAgICAgICAgICAgJ2hhcyc6MSxcbiAgICAgICAgJ2V4dGVuZCc6MSwgICAgICdlc2NhcGUnOjEsICAgICAgJ3Vuc2V0JzoxLCAgICAgICAgICAgICAnY2xlYXInOjEsICAgICAgICAgICAnY2lkJzoxLFxuICAgICAgICAnYXR0cmlidXRlcyc6MSwgJ2NoYW5nZWQnOjEsICAgICAndG9KU09OJzoxLCAgICAgICAgICAgICd2YWxpZGF0aW9uRXJyb3InOjEsICdpc1ZhbGlkJzoxLFxuICAgICAgICAnaXNOZXcnOjEsICAgICAgJ2hhc0NoYW5nZWQnOjEsICAnY2hhbmdlZEF0dHJpYnV0ZXMnOjEsICdwcmV2aW91cyc6MSwgICAgICAgICdwcmV2aW91c0F0dHJpYnV0ZXMnOjFcbiAgICAgIH0sXG4gICAgICBjb25maWdQcm9wZXJ0aWVzID0ge1xuICAgICAgICAncm91dGVzJzoxLCAgICAgJ3RlbXBsYXRlJzoxLCAgICAnZGVmYXVsdHMnOjEsICdvdXRsZXQnOjEsICAgICAgICAgICd1cmwnOjEsXG4gICAgICAgICd1cmxSb290JzoxLCAgICAnaWRBdHRyaWJ1dGUnOjEsICdpZCc6MSwgICAgICAgJ2NyZWF0ZWRDYWxsYmFjayc6MSwgJ2F0dGFjaGVkQ2FsbGJhY2snOjEsXG4gICAgICAgICdkZXRhY2hlZENhbGxiYWNrJzoxXG4gICAgICB9O1xuXG4gIHByb3RvUHJvcHMgfHwgKHByb3RvUHJvcHMgPSB7fSk7XG4gIHN0YXRpY1Byb3BzIHx8IChzdGF0aWNQcm9wcyA9IHt9KTtcbiAgcHJvdG9Qcm9wcy5kZWZhdWx0cyA9IHt9O1xuICAvLyBzdGF0aWNQcm9wcy5zZXJ2aWNlcyA9IHt9O1xuXG4gIC8vIElmIGdpdmVuIGEgY29uc3RydWN0b3IsIHVzZSBpdCwgb3RoZXJ3aXNlIHVzZSB0aGUgZGVmYXVsdCBvbmUgZGVmaW5lZCBhYm92ZVxuICBpZiAocHJvdG9Qcm9wcyAmJiBfLmhhcyhwcm90b1Byb3BzLCAnY29uc3RydWN0b3InKSkge1xuICAgIGNoaWxkID0gcHJvdG9Qcm9wcy5jb25zdHJ1Y3RvcjtcbiAgfSBlbHNlIHtcbiAgICBjaGlsZCA9IGZ1bmN0aW9uKCl7IHJldHVybiBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfTtcbiAgfVxuXG4gIC8vIE91ciBjbGFzcyBzaG91bGQgaW5oZXJpdCBldmVyeXRoaW5nIGZyb20gaXRzIHBhcmVudCwgZGVmaW5lZCBhYm92ZVxuICB2YXIgU3Vycm9nYXRlID0gZnVuY3Rpb24oKXsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9O1xuICBTdXJyb2dhdGUucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTtcbiAgY2hpbGQucHJvdG90eXBlID0gbmV3IFN1cnJvZ2F0ZSgpO1xuXG4gIC8vIEZvciBlYWNoIHByb3BlcnR5IHBhc3NlZCBpbnRvIG91ciBjb21wb25lbnQgYmFzZSBjbGFzc1xuICBfLmVhY2gocHJvdG9Qcm9wcywgZnVuY3Rpb24odmFsdWUsIGtleSwgcHJvdG9Qcm9wcyl7XG5cbiAgICAvLyBJZiBhIGNvbmZpZ3VyYXRpb24gcHJvcGVydHksIGlnbm9yZSBpdFxuICAgIGlmKGNvbmZpZ1Byb3BlcnRpZXNba2V5XSl7IHJldHVybjsgfVxuXG4gICAgLy8gSWYgYSBwcmltYXRpdmUgb3IgYmFja2JvbmUgdHlwZSBvYmplY3QsIG9yIGNvbXB1dGVkIHByb3BlcnR5IChmdW5jdGlvbiB3aGljaCB0YWtlcyBubyBhcmd1bWVudHMgYW5kIHJldHVybnMgYSB2YWx1ZSkgbW92ZSBpdCB0byBvdXIgZGVmYXVsdHNcbiAgICBpZighXy5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB2YWx1ZS5pc01vZGVsIHx8IHZhbHVlLmlzQ29tcG9uZW50IHx8IChfLmlzRnVuY3Rpb24odmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCAmJiB2YWx1ZS50b1N0cmluZygpLmluZGV4T2YoJ3JldHVybicpID4gLTEpKXtcbiAgICAgIHByb3RvUHJvcHMuZGVmYXVsdHNba2V5XSA9IHZhbHVlO1xuICAgICAgZGVsZXRlIHByb3RvUHJvcHNba2V5XTtcbiAgICB9XG5cbiAgICAvLyBJZiBhIHJlc2VydmVkIG1ldGhvZCwgeWVsbFxuICAgIGlmKHJlc2VydmVkTWV0aG9kc1trZXldKXsgdGhyb3cgXCJFUlJPUjogXCIgKyBrZXkgKyBcIiBpcyBhIHJlc2VydmVkIG1ldGhvZCBuYW1lIGluIFwiICsgc3RhdGljUHJvcHMuX19uYW1lICsgXCIhXCI7IH1cblxuICAgIC8vIEFsbCBvdGhlciB2YWx1ZXMgYXJlIGNvbXBvbmVudCBtZXRob2RzLCBsZWF2ZSB0aGVtIGJlIHVubGVzcyBhbHJlYWR5IGRlZmluZWQuXG5cbiAgfSwgdGhpcyk7XG5cbiAgLy8gRXh0ZW5kIG91ciBwcm90b3R5cGUgd2l0aCBhbnkgcmVtYWluaW5nIHByb3RvUHJvcHMsIG92ZXJyaXRpbmcgcHJlLWRlZmluZWQgb25lc1xuICBpZiAocHJvdG9Qcm9wcyl7IF8uZXh0ZW5kKGNoaWxkLnByb3RvdHlwZSwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpOyB9XG5cbiAgLy8gU2V0IG91ciBhbmNlc3RyeVxuICBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlO1xuXG4gIHJldHVybiBjaGlsZDtcbn07XG5cbkNvbXBvbmVudC5yZWdpc3RlciA9IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50KG5hbWUsIG9wdGlvbnMpIHtcbiAgdmFyIHNjcmlwdCA9IG9wdGlvbnMucHJvdG90eXBlO1xuICB2YXIgdGVtcGxhdGUgPSBvcHRpb25zLnRlbXBsYXRlO1xuICB2YXIgc3R5bGUgPSBvcHRpb25zLnN0eWxlO1xuXG4gIHZhciBjb21wb25lbnQgPSB0aGlzLmV4dGVuZChzY3JpcHQsIHsgX19uYW1lOiBuYW1lIH0pO1xuICB2YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSwge30pO1xuXG4gIHByb3RvLmNyZWF0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX19jb21wb25lbnRfXyA9IG5ldyBjb21wb25lbnQoe1xuICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgICAgb3V0bGV0OiB0aGlzLFxuICAgICAgZGF0YTogUmVib3VuZC5zZWVkRGF0YVxuICAgIH0pO1xuICB9O1xuXG4gIHByb3RvLmF0dGFjaGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICBzY3JpcHQuYXR0YWNoZWRDYWxsYmFjayAmJiBzY3JpcHQuYXR0YWNoZWRDYWxsYmFjay5jYWxsKHRoaXMuX19jb21wb25lbnRfXyk7XG4gIH07XG5cbiAgcHJvdG8uZGV0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgIHNjcmlwdC5kZXRhY2hlZENhbGxiYWNrICYmIHNjcmlwdC5kZXRhY2hlZENhbGxiYWNrLmNhbGwodGhpcy5fX2NvbXBvbmVudF9fKTtcbiAgICB0aGlzLl9fY29tcG9uZW50X18uZGVpbml0aWFsaXplKCk7XG4gIH07XG5cbiAgcHJvdG8uYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrID0gZnVuY3Rpb24oYXR0ck5hbWUsIG9sZFZhbCwgbmV3VmFsKSB7XG4gICAgdGhpcy5fX2NvbXBvbmVudF9fLl9vbkF0dHJpYnV0ZUNoYW5nZShhdHRyTmFtZSwgb2xkVmFsLCBuZXdWYWwpO1xuICAgIHNjcmlwdC5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgJiYgc2NyaXB0LmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjay5jYWxsKHRoaXMuX19jb21wb25lbnRfXywgYXR0ck5hbWUsIG9sZFZhbCwgbmV3VmFsKTtcbiAgfTtcblxuICByZXR1cm4gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KG5hbWUsIHsgcHJvdG90eXBlOiBwcm90byB9KTtcbn1cblxuXy5iaW5kQWxsKENvbXBvbmVudCwgJ3JlZ2lzdGVyJyk7XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBvbmVudDtcbiIsIi8vIFJlYm91bmQgQ29sbGVjdGlvblxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgTW9kZWwgZnJvbSBcInJlYm91bmQtZGF0YS9tb2RlbFwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cbmZ1bmN0aW9uIHBhdGhHZW5lcmF0b3IoY29sbGVjdGlvbil7XG4gIHJldHVybiBmdW5jdGlvbigpe1xuICAgIHJldHVybiBjb2xsZWN0aW9uLl9fcGF0aCgpICsgJ1snICsgY29sbGVjdGlvbi5pbmRleE9mKGNvbGxlY3Rpb24uX2J5SWRbdGhpcy5jaWRdKSArICddJztcbiAgfTtcbn1cblxudmFyIENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG5cbiAgaXNDb2xsZWN0aW9uOiB0cnVlLFxuICBpc0RhdGE6IHRydWUsXG5cbiAgbW9kZWw6IHRoaXMubW9kZWwgfHwgTW9kZWwsXG5cbiAgX19wYXRoOiBmdW5jdGlvbigpe3JldHVybiAnJzt9LFxuXG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihtb2RlbHMsIG9wdGlvbnMpe1xuICAgIG1vZGVscyB8fCAobW9kZWxzID0gW10pO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdGhpcy5fX29ic2VydmVycyA9IHt9O1xuICAgIHRoaXMuaGVscGVycyA9IHt9O1xuICAgIHRoaXMuY2lkID0gXy51bmlxdWVJZCgnY29sbGVjdGlvbicpO1xuXG4gICAgLy8gU2V0IGxpbmVhZ2VcbiAgICB0aGlzLnNldFBhcmVudCggb3B0aW9ucy5wYXJlbnQgfHwgdGhpcyApO1xuICAgIHRoaXMuc2V0Um9vdCggb3B0aW9ucy5yb290IHx8IHRoaXMgKTtcbiAgICB0aGlzLl9fcGF0aCA9IG9wdGlvbnMucGF0aCB8fCB0aGlzLl9fcGF0aDtcblxuICAgIEJhY2tib25lLkNvbGxlY3Rpb24uYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG4gICAgLy8gV2hlbiBhIG1vZGVsIGlzIHJlbW92ZWQgZnJvbSBpdHMgb3JpZ2luYWwgY29sbGVjdGlvbiwgZGVzdHJveSBpdFxuICAgIC8vIFRPRE86IEZpeCB0aGlzLiBDb21wdXRlZCBwcm9wZXJ0aWVzIG5vdyBzb21laG93IGFsbG93IGNvbGxlY3Rpb24gdG8gc2hhcmUgYSBtb2RlbC4gVGhleSBtYXkgYmUgcmVtb3ZlZCBmcm9tIG9uZSBidXQgbm90IHRoZSBvdGhlci4gVGhhdCBpcyBiYWQuXG4gICAgLy8gVGhlIGNsb25lID0gZmFsc2Ugb3B0aW9ucyBpcyB0aGUgY3VscHJpdC4gRmluZCBhIGJldHRlciB3YXkgdG8gY29weSBhbGwgb2YgdGhlIGNvbGxlY3Rpb25zIGN1c3RvbSBhdHRyaWJ1dGVzIG92ZXIgdG8gdGhlIGNsb25lLlxuICAgIHRoaXMub24oJ3JlbW92ZScsIGZ1bmN0aW9uKG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKXtcbiAgICAgIC8vIG1vZGVsLmRlaW5pdGlhbGl6ZSgpO1xuICAgIH0pO1xuXG4gIH0sXG5cbiAgZ2V0OiBmdW5jdGlvbihrZXksIG9wdGlvbnMpe1xuXG4gICAgLy8gSWYgdGhlIGtleSBpcyBhIG51bWJlciBvciBvYmplY3QsIGRlZmF1bHQgdG8gYmFja2JvbmUncyBjb2xsZWN0aW9uIGdldFxuICAgIGlmKHR5cGVvZiBrZXkgPT0gJ251bWJlcicgfHwgdHlwZW9mIGtleSA9PSAnb2JqZWN0Jyl7XG4gICAgICByZXR1cm4gQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0LmNhbGwodGhpcywga2V5KTtcbiAgICB9XG5cbiAgICAvLyBJZiBrZXkgaXMgbm90IGEgc3RyaW5nLCByZXR1cm4gdW5kZWZpbmVkXG4gICAgaWYgKCFfLmlzU3RyaW5nKGtleSkpIHJldHVybiB2b2lkIDA7XG5cbiAgICAvLyBTcGxpdCB0aGUgcGF0aCBhdCBhbGwgJy4nLCAnWycgYW5kICddJyBhbmQgZmluZCB0aGUgdmFsdWUgcmVmZXJhbmNlZC5cbiAgICB2YXIgcGFydHMgID0gJC5zcGxpdFBhdGgoa2V5KSxcbiAgICAgICAgcmVzdWx0ID0gdGhpcyxcbiAgICAgICAgbD1wYXJ0cy5sZW5ndGgsXG4gICAgICAgIGk9MDtcbiAgICAgICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICAgIGlmKF8uaXNVbmRlZmluZWQoa2V5KSB8fCBfLmlzTnVsbChrZXkpKSByZXR1cm4ga2V5O1xuICAgIGlmKGtleSA9PT0gJycgfHwgcGFydHMubGVuZ3RoID09PSAwKSByZXR1cm4gcmVzdWx0O1xuXG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAoIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIC8vIElmIHJldHVybmluZyByYXcsIGFsd2F5cyByZXR1cm4gdGhlIGZpcnN0IGNvbXB1dGVkIHByb3BlcnR5IGZvdW5kLiBJZiB1bmRlZmluZWQsIHlvdSdyZSBkb25lLlxuICAgICAgICBpZihyZXN1bHQgJiYgcmVzdWx0LmlzQ29tcHV0ZWRQcm9wZXJ0eSAmJiBvcHRpb25zLnJhdykgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgaWYocmVzdWx0ICYmIHJlc3VsdC5pc0NvbXB1dGVkUHJvcGVydHkpIHJlc3VsdCA9IHJlc3VsdC52YWx1ZSgpO1xuICAgICAgICBpZihfLmlzVW5kZWZpbmVkKHJlc3VsdCkgfHwgXy5pc051bGwocmVzdWx0KSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgaWYocGFydHNbaV0gPT09ICdAcGFyZW50JykgcmVzdWx0ID0gcmVzdWx0Ll9fcGFyZW50X187XG4gICAgICAgIGVsc2UgaWYocmVzdWx0LmlzQ29sbGVjdGlvbikgcmVzdWx0ID0gcmVzdWx0Lm1vZGVsc1twYXJ0c1tpXV07XG4gICAgICAgIGVsc2UgaWYocmVzdWx0LmlzTW9kZWwpIHJlc3VsdCA9IHJlc3VsdC5hdHRyaWJ1dGVzW3BhcnRzW2ldXTtcbiAgICAgICAgZWxzZSBpZihyZXN1bHQuaGFzT3duUHJvcGVydHkocGFydHNbaV0pKSByZXN1bHQgPSByZXN1bHRbcGFydHNbaV1dO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5ICYmICFvcHRpb25zLnJhdykgcmVzdWx0ID0gcmVzdWx0LnZhbHVlKCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuXG4gIHNldDogZnVuY3Rpb24obW9kZWxzLCBvcHRpb25zKXtcbiAgICB2YXIgbmV3TW9kZWxzID0gW10sXG4gICAgICAgIGxpbmVhZ2UgPSB7XG4gICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgIHJvb3Q6IHRoaXMuX19yb290X18sXG4gICAgICAgICAgcGF0aDogcGF0aEdlbmVyYXRvcih0aGlzKSxcbiAgICAgICAgICBzaWxlbnQ6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge30sXG5cbiAgICAvLyBJZiBubyBtb2RlbHMgcGFzc2VkLCBpbXBsaWVzIGFuIGVtcHR5IGFycmF5XG4gICAgbW9kZWxzIHx8IChtb2RlbHMgPSBbXSk7XG5cbiAgICAvLyBJZiBtb2RlbHMgaXMgYSBzdHJpbmcsIGNhbGwgc2V0IGF0IHRoYXQgcGF0aFxuICAgIGlmKF8uaXNTdHJpbmcobW9kZWxzKSkgcmV0dXJuIHRoaXMuZ2V0KCQuc3BsaXRQYXRoKG1vZGVscylbMF0pLnNldCgkLnNwbGl0UGF0aChtb2RlbHMpLnNwbGljZSgxLCBtb2RlbHMubGVuZ3RoKS5qb2luKCcuJyksIG9wdGlvbnMpO1xuICAgIGlmKCFfLmlzT2JqZWN0KG1vZGVscykpIHJldHVybiBjb25zb2xlLmVycm9yKCdDb2xsZWN0aW9uLnNldCBtdXN0IGJlIHBhc3NlZCBhIE1vZGVsLCBPYmplY3QsIGFycmF5IG9yIE1vZGVscyBhbmQgT2JqZWN0cywgb3IgYW5vdGhlciBDb2xsZWN0aW9uJyk7XG5cbiAgICAvLyBJZiBhbm90aGVyIGNvbGxlY3Rpb24sIHRyZWF0IGxpa2UgYW4gYXJyYXlcbiAgICBtb2RlbHMgPSAobW9kZWxzLmlzQ29sbGVjdGlvbikgPyBtb2RlbHMubW9kZWxzIDogbW9kZWxzO1xuICAgIC8vIEVuc3VyZSBtb2RlbHMgaXMgYW4gYXJyYXlcbiAgICBtb2RlbHMgPSAoIV8uaXNBcnJheShtb2RlbHMpKSA/IFttb2RlbHNdIDogbW9kZWxzO1xuXG4gICAgLy8gSWYgdGhlIG1vZGVsIGFscmVhZHkgZXhpc3RzIGluIHRoaXMgY29sbGVjdGlvbiwgb3Igd2UgYXJlIHRvbGQgbm90IHRvIGNsb25lIGl0LCBsZXQgQmFja2JvbmUgaGFuZGxlIHRoZSBtZXJnZVxuICAgIC8vIE90aGVyd2lzZSwgY3JlYXRlIG91ciBjb3B5IG9mIHRoaXMgbW9kZWwsIGdpdmUgdGhlbSB0aGUgc2FtZSBjaWQgc28gb3VyIGhlbHBlcnMgdHJlYXQgdGhlbSBhcyB0aGUgc2FtZSBvYmplY3RcbiAgICBfLmVhY2gobW9kZWxzLCBmdW5jdGlvbihkYXRhLCBpbmRleCl7XG4gICAgICBpZihkYXRhLmlzTW9kZWwgJiYgb3B0aW9ucy5jbG9uZSA9PT0gZmFsc2UgfHwgdGhpcy5fYnlJZFtkYXRhLmNpZF0pIHJldHVybiBuZXdNb2RlbHNbaW5kZXhdID0gZGF0YTtcbiAgICAgIG5ld01vZGVsc1tpbmRleF0gPSBuZXcgdGhpcy5tb2RlbChkYXRhLCBfLmRlZmF1bHRzKGxpbmVhZ2UsIG9wdGlvbnMpKTtcbiAgICAgIGRhdGEuaXNNb2RlbCAmJiAobmV3TW9kZWxzW2luZGV4XS5jaWQgPSBkYXRhLmNpZCk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICAvLyBFbnN1cmUgdGhhdCB0aGlzIGVsZW1lbnQgbm93IGtub3dzIHRoYXQgaXQgaGFzIGNoaWxkcmVuIG5vdy4gV2l0aG91dCB0aGlzIGN5Y2xpYyBkZXBlbmRhbmNpZXMgY2F1c2UgaXNzdWVzXG4gICAgdGhpcy5faGFzQW5jZXN0cnkgfHwgKHRoaXMuX2hhc0FuY2VzdHJ5ID0gbmV3TW9kZWxzLmxlbmd0aCA+IDApO1xuXG4gICAgLy8gQ2FsbCBvcmlnaW5hbCBzZXQgZnVuY3Rpb24gd2l0aCBtb2RlbCBkdXBsaWNhdGVzXG4gICAgcmV0dXJuIEJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLnNldC5jYWxsKHRoaXMsIG5ld01vZGVscywgb3B0aW9ucyk7XG5cbiAgfVxuXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgQ29sbGVjdGlvbjtcbiIsIi8vIFJlYm91bmQgUHJlY29tcGlsZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IHsgY29tcGlsZSBhcyBodG1sYmFyc0NvbXBpbGUsIGNvbXBpbGVTcGVjIGFzIGh0bWxiYXJzQ29tcGlsZVNwZWMgfSBmcm9tIFwiaHRtbGJhcnNcIjtcblxuLy8gUmVtb3ZlIHRoZSBjb250ZW50cyBvZiB0aGUgY29tcG9uZW50J3MgYHNjcmlwdGAgdGFnLlxuZnVuY3Rpb24gZ2V0U2NyaXB0KHN0cikge1xuICByZXR1cm4gc3RyLmluZGV4T2YoXCI8c2NyaXB0PlwiKSA+IC0xICYmIHN0ci5pbmRleE9mKFwiPC9zY3JpcHQ+XCIpID4gLTEgPyBcIihmdW5jdGlvbigpe1wiICsgc3RyLnJlcGxhY2UoLyhbXl0qPHNjcmlwdD4pKFteXSopKDxcXC9zY3JpcHQ+W15dKikvaWcsIFwiJDJcIikgKyBcIn0pKClcIiA6IFwie31cIjtcbn1cblxuLy8gUmVtb3ZlIHRoZSBjb250ZW50cyBvZiB0aGUgY29tcG9uZW50J3MgYHN0eWxlYCB0YWcuXG5mdW5jdGlvbiBnZXRTdHlsZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5pbmRleE9mKFwiPHN0eWxlPlwiKSA+IC0xICYmIHN0ci5pbmRleE9mKFwiPC9zdHlsZT5cIikgPiAtMSA/IHN0ci5yZXBsYWNlKC8oW15dKjxzdHlsZT4pKFteXSopKDxcXC9zdHlsZT5bXl0qKS9pZywgXCIkMlwiKS5yZXBsYWNlKC9cIi9nLCBcIlxcXFxcXFwiXCIpIDogXCJcIjtcbn1cblxuLy8gUmVtb3ZlIHRoZSBjb250ZW50cyBvZiB0aGUgY29tcG9uZW50J3MgYHRlbXBsYXRlYCB0YWcuXG5mdW5jdGlvbiBnZXRUZW1wbGF0ZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5pbmRleE9mKFwiPHRlbXBsYXRlPlwiKSA+IC0xICYmIHN0ci5pbmRleE9mKFwiPC90ZW1wbGF0ZT5cIikgPiAtMSA/IHN0ci5yZXBsYWNlKC9bXl0qPHRlbXBsYXRlPihbXl0qKTxcXC90ZW1wbGF0ZT5bXl0qL2dpLCBcIiQxXCIpLnJlcGxhY2UoLyhbXl0qKTxzdHlsZT5bXl0qPFxcL3N0eWxlPihbXl0qKS9pZywgXCIkMSQyXCIpIDogXCJcIjtcbn1cblxuLy8gR2V0IHRoZSBjb21wb25lbnQncyBuYW1lIGZyb20gaXRzIGBuYW1lYCBhdHRyaWJ1dGUuXG5mdW5jdGlvbiBnZXROYW1lKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1teXSo8ZWxlbWVudFtePl0qbmFtZT0oW1wiJ10pPyhbXidcIj5cXHNdKylcXDFbXjw+XSo+W15dKi9pZywgXCIkMlwiKTtcbn1cblxuLy8gTWluaWZ5IHRoZSBzdHJpbmcgcGFzc2VkIGluIGJ5IHJlcGxhY2luZyBhbGwgd2hpdGVzcGFjZS5cbmZ1bmN0aW9uIG1pbmlmeShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS5yZXBsYWNlKC9cXG58KD4pICg8KS9nLCBcIiQxJDJcIik7XG59XG5cbi8vIFN0cmlwIGphdmFzY3JpcHQgY29tbWVudHNcbmZ1bmN0aW9uIHJlbW92ZUNvbW1lbnRzKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyg/OlxcL1xcKig/OltcXHNcXFNdKj8pXFwqXFwvKXwoPzooW1xcc10pK1xcL1xcLyg/Oi4qKSQpL2dtLCBcIiQxXCIpO1xufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZUZ1bmMoZm4pIHtcbiAgdmFyIHNyYyA9IGZuLnRvU3RyaW5nKCk7XG4gIHNyYyA9IHNyYy5zbGljZShzcmMuaW5kZXhPZihcIntcIikgKyAxLCAtMSk7XG4gIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgcmV0dXJuICFkYXRhID8gc3JjIDogc3JjLnJlcGxhY2UoLyhcXCRbYS16QS1aXSspL2csIGZ1bmN0aW9uKCRyZXApIHtcbiAgICAgIHZhciBrZXkgPSAkcmVwLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIGRhdGFba2V5XSB8fCBcIlwiO1xuICAgIH0pO1xuICB9O1xufVxuXG52YXIgQ09NUE9ORU5UX1RFTVBMQVRFID0gdGVtcGxhdGVGdW5jKGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIChmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gd2luZG93LlJlYm91bmQucmVnaXN0ZXJDb21wb25lbnQoXCIkbmFtZVwiLCB7XG4gICAgICBwcm90b3R5cGU6ICRzY3JpcHQsXG4gICAgICB0ZW1wbGF0ZTogJHRlbXBsYXRlLFxuICAgICAgc3R5bGU6IFwiJHN0eWxlXCJcbiAgICB9KTtcbiAgfSkoKTtcbn0pO1xuXG5mdW5jdGlvbiBwcmVjb21waWxlKHN0ciwgb3B0aW9ucyl7XG4gIGlmKCAhc3RyIHx8IHN0ci5sZW5ndGggPT09IDAgKXtcbiAgICByZXR1cm4gY29uc29sZS5lcnJvcignTm8gdGVtcGxhdGUgcHJvdmlkZWQhJyk7XG4gIH1cblxuICAvLyBSZW1vdmUgY29tbWVudHNcbiAgLy8gc3RyID0gcmVtb3ZlQ29tbWVudHMoc3RyKTtcbiAgLy8gTWluaWZ5IGV2ZXJ5dGhpbmdcbiAgLy8gc3RyID0gbWluaWZ5KHN0cik7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuYmFzZURlc3QgPSBvcHRpb25zLmJhc2VEZXN0IHx8ICcnO1xuICBvcHRpb25zLm5hbWUgPSBvcHRpb25zLm5hbWUgfHwgJyc7XG4gIG9wdGlvbnMuYmFzZVVybCA9IG9wdGlvbnMuYmFzZVVybCB8fCAnJztcblxuICB2YXIgdGVtcGxhdGUgPSBzdHIsXG4gICAgICBzdHlsZSA9ICcnLFxuICAgICAgc2NyaXB0ID0gJ3t9JyxcbiAgICAgIG5hbWUgPSAnJyxcbiAgICAgIGlzUGFydGlhbCA9IHRydWUsXG4gICAgICBpbXBvcnRzID0gW10sXG4gICAgICBwYXJ0aWFscyxcbiAgICAgIHJlcXVpcmUsXG4gICAgICBkZXBzID0gW107XG5cbiAgLy8gSWYgdGhlIGVsZW1lbnQgdGFnIGlzIHByZXNlbnRcbiAgaWYoc3RyLmluZGV4T2YoJzxlbGVtZW50JykgPiAtMSAmJiBzdHIuaW5kZXhPZignPC9lbGVtZW50PicpID4gLTEpe1xuXG4gICAgaXNQYXJ0aWFsID0gZmFsc2U7XG5cbiAgICBuYW1lID0gZ2V0TmFtZShzdHIpO1xuICAgIHN0eWxlID0gZ2V0U3R5bGUoc3RyKTtcbiAgICB0ZW1wbGF0ZSA9IGdldFRlbXBsYXRlKHN0cik7XG4gICAgc2NyaXB0ID0gZ2V0U2NyaXB0KHN0cik7XG5cbiAgfVxuXG5cbiAgLy8gQXNzZW1wbGUgb3VyIGNvbXBvbmVudCBkZXBlbmRhbmNpZXMgYnkgZmluZGluZyBsaW5rIHRhZ3MgYW5kIHBhcnNpbmcgdGhlaXIgc3JjXG4gIHZhciBpbXBvcnRzcmUgPSAvPGxpbmsgW15oXSpocmVmPShbJ1wiXT8pXFwvPyhbXi4nXCJdKikuaHRtbFxcMVtePl0qPi9naSxcbiAgICAgIG1hdGNoO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBpbXBvcnRzcmUuZXhlYyh0ZW1wbGF0ZSkpICE9IG51bGwpIHtcbiAgICAgIGltcG9ydHMucHVzaChtYXRjaFsyXSk7XG4gIH1cbiAgaW1wb3J0cy5mb3JFYWNoKGZ1bmN0aW9uKGltcG9ydFN0cmluZywgaW5kZXgpe1xuICAgIGRlcHMucHVzaCgnXCInICsgb3B0aW9ucy5iYXNlRGVzdCArIGltcG9ydFN0cmluZyArICdcIicpO1xuICB9KTtcblxuICAvLyBSZW1vdmUgbGluayB0YWdzIGZyb20gdGVtcGxhdGVcbiAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5yZXBsYWNlKC88bGluayAuKmhyZWY9KFsnXCJdPykoLiopLmh0bWxcXDFbXj5dKj4vZ2ksICcnKTtcblxuICAvLyBBc3NlbWJsZSBvdXIgcGFydGlhbCBkZXBlbmRhbmNpZXNcbiAgcGFydGlhbHMgPSB0ZW1wbGF0ZS5tYXRjaCgvXFx7XFx7Plxccyo/WydcIl0/KFteJ1wifVxcc10qKVsnXCJdP1xccyo/XFx9XFx9L2dpKTtcblxuICBpZihwYXJ0aWFscyl7XG4gICAgcGFydGlhbHMuZm9yRWFjaChmdW5jdGlvbihwYXJ0aWFsLCBpbmRleCl7XG4gICAgICBkZXBzLnB1c2goJ1wiJyArIG9wdGlvbnMuYmFzZURlc3QgKyBwYXJ0aWFsLnJlcGxhY2UoL1xce1xcez5bXFxzKl0/WydcIl0/KFteJ1wiXSopWydcIl0/W1xccypdP1xcfVxcfS9naSwgJyQxJykgKyAnXCInKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIENvbXBpbGVcbiAgdGVtcGxhdGUgPSAnJyArIGh0bWxiYXJzQ29tcGlsZVNwZWModGVtcGxhdGUpO1xuXG4gIC8vIElmIGlzIGEgcGFydGlhbFxuICBpZihpc1BhcnRpYWwpe1xuICAgIHRlbXBsYXRlID0gJyhmdW5jdGlvbigpe3ZhciB0ZW1wbGF0ZSA9ICcrdGVtcGxhdGUrJ1xcbiB3aW5kb3cuUmVib3VuZC5yZWdpc3RlclBhcnRpYWwoIFwiJysgb3B0aW9ucy5uYW1lICsnXCIsIHRlbXBsYXRlKTt9KSgpO1xcbic7XG4gIH1cbiAgLy8gRWxzZSwgaXMgYSBjb21wb25lbnRcbiAgZWxzZXtcbiAgICB0ZW1wbGF0ZSA9IENPTVBPTkVOVF9URU1QTEFURSh7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgc2NyaXB0OiBzY3JpcHQsXG4gICAgICBzdHlsZTogc3R5bGUsXG4gICAgICB0ZW1wbGF0ZTogdGVtcGxhdGVcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFdyYXAgaW4gZGVmaW5lXG4gIHRlbXBsYXRlID0gXCJkZWZpbmUoIFtcIisgZGVwcy5qb2luKCcsICcpICArXCJdLCBmdW5jdGlvbigpe1xcblwiICsgdGVtcGxhdGUgKyAnfSk7JztcblxuICByZXR1cm4gdGVtcGxhdGU7XG59XG5cbmV4cG9ydCB7IHByZWNvbXBpbGUgfTtcbiIsIi8vIFJlYm91bmQgUm91dGVyXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG4vLyBJZiBCYWNrYm9uZSBoYXNuJ3QgYmVlbiBzdGFydGVkIHlldCwgdGhyb3cgZXJyb3JcbmlmKCF3aW5kb3cuQmFja2JvbmUpeyB0aHJvdyBcIkJhY2tib25lIG11c3QgYmUgb24gdGhlIHBhZ2UgZm9yIFJlYm91bmQgdG8gbG9hZC5cIjsgfVxuXG4gIC8vIENsZWFuIHVwIG9sZCBwYWdlIGNvbXBvbmVudCBhbmQgbG9hZCByb3V0ZXMgZnJvbSBvdXIgbmV3IHBhZ2UgY29tcG9uZW50XG4gIGZ1bmN0aW9uIGluc3RhbGxSZXNvdXJjZXMoUGFnZUFwcCwgcHJpbWFyeVJvdXRlLCBpc0dsb2JhbCkge1xuICAgIHZhciBvbGRQYWdlTmFtZSwgcGFnZUluc3RhbmNlLCBjb250YWluZXIsIHJvdXRlciA9IHRoaXM7XG5cbiAgICAvLyBEZS1pbml0aWFsaXplIHRoZSBwcmV2aW91cyBhcHAgYmVmb3JlIHJlbmRlcmluZyBhIG5ldyBhcHBcbiAgICAvLyBUaGlzIHdheSB3ZSBjYW4gZW5zdXJlIHRoYXQgZXZlcnkgbmV3IHBhZ2Ugc3RhcnRzIHdpdGggYSBjbGVhbiBzbGF0ZVxuICAgIC8vIFRoaXMgaXMgY3J1Y2lhbCBmb3Igc2NhbGFiaWxpdHkgb2YgYSBzaW5nbGUgcGFnZSBhcHAuXG4gICAgaWYoIWlzR2xvYmFsICYmIHRoaXMuY3VycmVudCl7XG5cbiAgICAgIG9sZFBhZ2VOYW1lID0gdGhpcy5jdXJyZW50Ll9fbmFtZTtcbiAgICAgIC8vIFVuc2V0IFByZXZpb3VzIEFwcGxpY2F0aW9uJ3MgUm91dGVzLiBGb3IgZWFjaCByb3V0ZSBpbiB0aGUgcGFnZSBhcHA6XG4gICAgICBfLmVhY2godGhpcy5jdXJyZW50Ll9fY29tcG9uZW50X18ucm91dGVzLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuXG4gICAgICAgIHZhciByZWdFeHAgPSByb3V0ZXIuX3JvdXRlVG9SZWdFeHAoa2V5KS50b1N0cmluZygpO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgaGFuZGxlciBmcm9tIG91ciByb3V0ZSBvYmplY3RcbiAgICAgICAgQmFja2JvbmUuaGlzdG9yeS5oYW5kbGVycyA9IF8uZmlsdGVyKEJhY2tib25lLmhpc3RvcnkuaGFuZGxlcnMsIGZ1bmN0aW9uKG9iail7cmV0dXJuIG9iai5yb3V0ZS50b1N0cmluZygpICE9PSByZWdFeHA7fSk7XG5cbiAgICAgICAgLy8gRGVsZXRlIG91ciByZWZlcmFuY2UgdG8gdGhlIHJvdXRlJ3MgY2FsbGJhY2tcbiAgICAgICAgZGVsZXRlIHJvdXRlclsgJ19mdW5jdGlvbl8nICsga2V5IF07XG5cbiAgICAgIH0pO1xuXG4gICAgICAvLyBVbi1ob29rIEV2ZW50IEJpbmRpbmdzLCBEZWxldGUgT2JqZWN0c1xuICAgICAgdGhpcy5jdXJyZW50Ll9fY29tcG9uZW50X18uZGVpbml0aWFsaXplKCk7XG5cbiAgICAgIC8vIERpc2FibGUgb2xkIGNzcyBpZiBpdCBleGlzdHNcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQob2xkUGFnZU5hbWUgKyAnLWNzcycpLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAgIH0sIDUwMCk7XG5cbiAgICB9XG5cbiAgICAvLyBMb2FkIE5ldyBQYWdlQXBwLCBnaXZlIGl0IGl0J3MgbmFtZSBzbyB3ZSBrbm93IHdoYXQgY3NzIHRvIHJlbW92ZSB3aGVuIGl0IGRlaW5pdGlhbGl6ZXNcbiAgICBwYWdlSW5zdGFuY2UgPSBuZXcgUGFnZUFwcCgpO1xuICAgIHBhZ2VJbnN0YW5jZS5fX25hbWUgPSBwcmltYXJ5Um91dGU7XG5cbiAgICAvLyBBZGQgdG8gb3VyIHBhZ2VcbiAgICBjb250YWluZXIgPSAoaXNHbG9iYWwpID8gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihpc0dsb2JhbCkgOiBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29udGVudCcpWzBdO1xuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocGFnZUluc3RhbmNlKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB3ZSdyZSBiYWNrIGF0IHRoZSB0b3Agb2YgdGhlIHBhZ2VcbiAgICBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCA9IDA7XG5cbiAgICAvLyBBdWdtZW50IEFwcGxpY2F0aW9uUm91dGVyIHdpdGggbmV3IHJvdXRlcyBmcm9tIFBhZ2VBcHBcbiAgICBfLmVhY2gocGFnZUluc3RhbmNlLl9fY29tcG9uZW50X18ucm91dGVzLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgLy8gR2VuZXJhdGUgb3VyIHJvdXRlIGNhbGxiYWNrJ3MgbmV3IG5hbWVcbiAgICAgIHZhciByb3V0ZUZ1bmN0aW9uTmFtZSA9ICdfZnVuY3Rpb25fJyArIGtleSxcbiAgICAgICAgICBmdW5jdGlvbk5hbWU7XG4gICAgICAvLyBBZGQgdGhlIG5ldyBjYWxsYmFjayByZWZlcmFuY2Ugb24gdG8gb3VyIHJvdXRlclxuICAgICAgcm91dGVyW3JvdXRlRnVuY3Rpb25OYW1lXSA9ICBmdW5jdGlvbiAoKSB7IHBhZ2VJbnN0YW5jZS5fX2NvbXBvbmVudF9fW3ZhbHVlXS5hcHBseShwYWdlSW5zdGFuY2UuX19jb21wb25lbnRfXywgYXJndW1lbnRzKTsgfTtcbiAgICAgIC8vIEFkZCB0aGUgcm91dGUgaGFuZGxlclxuICAgICAgcm91dGVyLnJvdXRlKGtleSwgdmFsdWUsIHRoaXNbcm91dGVGdW5jdGlvbk5hbWVdKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHZhciBuYW1lID0gKGlzR2xvYmFsKSA/IHByaW1hcnlSb3V0ZSA6ICdwYWdlJztcbiAgICBpZighaXNHbG9iYWwpIHRoaXMuY3VycmVudCA9IHBhZ2VJbnN0YW5jZTtcbiAgICBpZih3aW5kb3cuUmVib3VuZC5zZXJ2aWNlc1tuYW1lXS5pc1NlcnZpY2UpXG4gICAgICB3aW5kb3cuUmVib3VuZC5zZXJ2aWNlc1tuYW1lXS5oeWRyYXRlKHBhZ2VJbnN0YW5jZS5fX2NvbXBvbmVudF9fKTtcbiAgICB3aW5kb3cuUmVib3VuZC5zZXJ2aWNlc1tuYW1lXSA9IHBhZ2VJbnN0YW5jZS5fX2NvbXBvbmVudF9fO1xuXG4gICAgLy8gUmV0dXJuIG91ciBuZXdseSBpbnN0YWxsZWQgYXBwXG4gICAgcmV0dXJuIHBhZ2VJbnN0YW5jZTtcbiAgfVxuXG4gIC8vIEZldGNoZXMgUGFyZSBIVE1MIGFuZCBDU1NcbiAgZnVuY3Rpb24gZmV0Y2hSZXNvdXJjZXMoYXBwTmFtZSwgcHJpbWFyeVJvdXRlLCBpc0dsb2JhbCkge1xuXG4gICAgLy8gRXhwZWN0aW5nIE1vZHVsZSBEZWZpbml0aW9uIGFzICdTZWFyY2hBcHAnIFdoZXJlICdTZWFyY2gnIGEgUHJpbWFyeSBSb3V0ZVxuICAgIHZhciBqc1VybCA9IHRoaXMuY29uZmlnLmpzUGF0aC5yZXBsYWNlKC86cm91dGUvZywgcHJpbWFyeVJvdXRlKS5yZXBsYWNlKC86YXBwL2csIGFwcE5hbWUpLFxuICAgICAgICBjc3NVcmwgPSB0aGlzLmNvbmZpZy5jc3NQYXRoLnJlcGxhY2UoLzpyb3V0ZS9nLCBwcmltYXJ5Um91dGUpLnJlcGxhY2UoLzphcHAvZywgYXBwTmFtZSksXG4gICAgICAgIGNzc0xvYWRlZCA9IGZhbHNlLFxuICAgICAgICBqc0xvYWRlZCA9IGZhbHNlLFxuICAgICAgICBjc3NFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXBwTmFtZSArICctY3NzJyksXG4gICAgICAgIGpzRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFwcE5hbWUgKyAnLWpzJyksXG4gICAgICAgIHJvdXRlciA9IHRoaXMsXG4gICAgICAgIFBhZ2VBcHA7XG5cbiAgICAgIC8vIE9ubHkgTG9hZCBDU1MgSWYgTm90IExvYWRlZCBCZWZvcmVcbiAgICAgIGlmKGNzc0VsZW1lbnQgPT09IG51bGwpe1xuICAgICAgICBjc3NFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuICAgICAgICBjc3NFbGVtZW50LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgICAgICBjc3NFbGVtZW50LnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICAgICAgY3NzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBjc3NVcmwpO1xuICAgICAgICBjc3NFbGVtZW50LnNldEF0dHJpYnV0ZSgnaWQnLCBhcHBOYW1lICsgJy1jc3MnKTtcbiAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChjc3NFbGVtZW50KTtcbiAgICAgICAgJChjc3NFbGVtZW50KS5vbignbG9hZCcsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgIGlmKChjc3NMb2FkZWQgPSB0cnVlKSAmJiBqc0xvYWRlZCl7XG4gICAgICAgICAgICAgIC8vIEluc3RhbGwgVGhlIExvYWRlZCBSZXNvdXJjZXNcbiAgICAgICAgICAgICAgaW5zdGFsbFJlc291cmNlcy5jYWxsKHJvdXRlciwgUGFnZUFwcCwgYXBwTmFtZSwgaXNHbG9iYWwpO1xuXG4gICAgICAgICAgICAgIC8vIFJlLXRyaWdnZXIgcm91dGUgc28gdGhlIG5ld2x5IGFkZGVkIHJvdXRlIG1heSBleGVjdXRlIGlmIHRoZXJlJ3MgYSByb3V0ZSBtYXRjaC5cbiAgICAgICAgICAgICAgLy8gSWYgbm8gcm91dGVzIGFyZSBtYXRjaGVkLCBhcHAgd2lsbCBoaXQgd2lsZENhcmQgcm91dGUgd2hpY2ggd2lsbCB0aGVuIHRyaWdnZXIgNDA0XG4gICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCAmJiByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCl7XG4gICAgICAgICAgICAgICAgQmFja2JvbmUuaGlzdG9yeS5sb2FkVXJsKEJhY2tib25lLmhpc3RvcnkuZnJhZ21lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCl7XG4gICAgICAgICAgICAgICAgcm91dGVyLmNvbmZpZy50cmlnZ2VyT25GaXJzdExvYWQgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgLy8gSWYgaXQgaGFzIGJlZW4gbG9hZGVkIGJldm9yZSwgZW5hYmxlIGl0XG4gICAgICBlbHNlIHtcbiAgICAgICAgY3NzRWxlbWVudCAmJiBjc3NFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgICAgICAgY3NzTG9hZGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgaWYgcmVxdWlyZWpzIGlzIG5vdCBvbiB0aGUgcGFnZSwgbG9hZCB0aGUgZmlsZSBtYW51YWxseS4gSXQgYmV0dGVyIGNvbnRhaW4gYWxsIGl0cyBkZXBlbmRhbmNpZXMuXG4gICAgICBpZih3aW5kb3cucmVxdWlyZS5fZGVmaW5lZCB8fCBfLmlzVW5kZWZpbmVkKHdpbmRvdy5yZXF1aXJlKSl7XG4gICAgICAgICAganNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgICAganNFbGVtZW50LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2phdmFzY3JpcHQnKTtcbiAgICAgICAgICBqc0VsZW1lbnQuc2V0QXR0cmlidXRlKCdzcmMnLCAnLycranNVcmwrJy5qcycpO1xuICAgICAgICAgIGpzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2lkJywgYXBwTmFtZSArICctanMnKTtcbiAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGpzRWxlbWVudCk7XG4gICAgICAgICAgJChqc0VsZW1lbnQpLm9uKCdsb2FkJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgLy8gQU1EIFdpbGwgTWFuYWdlIERlcGVuZGFuY2llcyBGb3IgVXMuIExvYWQgVGhlIEFwcC5cbiAgICAgICAgICAgIHJlcXVpcmUoW2pzVXJsXSwgZnVuY3Rpb24oUGFnZUNsYXNzKXtcblxuICAgICAgICAgICAgICBpZigoanNMb2FkZWQgPSB0cnVlKSAmJiAoUGFnZUFwcCA9IFBhZ2VDbGFzcykgJiYgY3NzTG9hZGVkKXtcblxuICAgICAgICAgICAgICAgIC8vIEluc3RhbGwgVGhlIExvYWRlZCBSZXNvdXJjZXNcbiAgICAgICAgICAgICAgICBpbnN0YWxsUmVzb3VyY2VzLmNhbGwocm91dGVyLCBQYWdlQXBwLCBhcHBOYW1lLCBpc0dsb2JhbCk7XG4gICAgICAgICAgICAgICAgLy8gUmUtdHJpZ2dlciByb3V0ZSBzbyB0aGUgbmV3bHkgYWRkZWQgcm91dGUgbWF5IGV4ZWN1dGUgaWYgdGhlcmUncyBhIHJvdXRlIG1hdGNoLlxuICAgICAgICAgICAgICAgIC8vIElmIG5vIHJvdXRlcyBhcmUgbWF0Y2hlZCwgYXBwIHdpbGwgaGl0IHdpbGRDYXJkIHJvdXRlIHdoaWNoIHdpbGwgdGhlbiB0cmlnZ2VyIDQwNFxuICAgICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCAmJiByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCl7XG4gICAgICAgICAgICAgICAgICBCYWNrYm9uZS5oaXN0b3J5LmxvYWRVcmwoQmFja2JvbmUuaGlzdG9yeS5mcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCl7XG4gICAgICAgICAgICAgICAgICByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICAvLyBBTUQgV2lsbCBNYW5hZ2UgRGVwZW5kYW5jaWVzIEZvciBVcy4gTG9hZCBUaGUgQXBwLlxuICAgICAgICByZXR1cm4gd2luZG93LnJlcXVpcmUoW2pzVXJsXSwgZnVuY3Rpb24oUGFnZUNsYXNzKXtcblxuICAgICAgICAgIGlmKChqc0xvYWRlZCA9IHRydWUpICYmIChQYWdlQXBwID0gUGFnZUNsYXNzKSAmJiBjc3NMb2FkZWQpe1xuXG4gICAgICAgICAgICAvLyBJbnN0YWxsIFRoZSBMb2FkZWQgUmVzb3VyY2VzXG4gICAgICAgICAgICBpbnN0YWxsUmVzb3VyY2VzLmNhbGwocm91dGVyLCBQYWdlQXBwLCBhcHBOYW1lLCBpc0dsb2JhbCk7XG4gICAgICAgICAgICAvLyBSZS10cmlnZ2VyIHJvdXRlIHNvIHRoZSBuZXdseSBhZGRlZCByb3V0ZSBtYXkgZXhlY3V0ZSBpZiB0aGVyZSdzIGEgcm91dGUgbWF0Y2guXG4gICAgICAgICAgICAvLyBJZiBubyByb3V0ZXMgYXJlIG1hdGNoZWQsIGFwcCB3aWxsIGhpdCB3aWxkQ2FyZCByb3V0ZSB3aGljaCB3aWxsIHRoZW4gdHJpZ2dlciA0MDRcbiAgICAgICAgICAgIGlmKCFpc0dsb2JhbCAmJiByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCl7XG4gICAgICAgICAgICAgIEJhY2tib25lLmhpc3RvcnkubG9hZFVybChCYWNrYm9uZS5oaXN0b3J5LmZyYWdtZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoIWlzR2xvYmFsKXtcbiAgICAgICAgICAgICAgcm91dGVyLmNvbmZpZy50cmlnZ2VyT25GaXJzdExvYWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICB9XG5cbiAgLy8gU2VydmljZXMga2VlcCB0cmFjayBvZiB0aGVpciBjb25zdW1lcnMuIExhenlDb21wb25lbnQgYXJlIHBsYWNlaG9sZGVyc1xuICAvLyBmb3Igc2VydmljZXMgdGhhdCBoYXZlbid0IGxvYWRlZCB5ZXQuIEEgTGF6eUNvbXBvbmVudCBtaW1pY3MgdGhlIGFwaSBvZiBhXG4gIC8vIHJlYWwgc2VydmljZS9jb21wb25lbnQgKHRoZXkgYXJlIHRoZSBzYW1lKSwgYW5kIHdoZW4gdGhlIHNlcnZpY2UgZmluYWxseVxuICAvLyBsb2FkcywgaXRzIGBgYGh5ZHJhdGVgYGAgbWV0aG9kIGlzIGNhbGxlZC4gQWxsIGNvbnN1bWVycyBvZiB0aGUgc2VydmljZSB3aWxsXG4gIC8vIGhhdmUgdGhlIG5vdyBmdWxseSBsb2FkZWQgc2VydmljZSBzZXQsIHRoZSBMYXp5U2VydmljZSB3aWxsIHRyYW5zZmVyIGFsbCBvZlxuICAvLyBpdHMgY29uc3VtZXJzIG92ZXIgdG8gdGhlIGZ1bGx5IGxvYWRlZCBzZXJ2aWNlLCBhbmQgdGhlbiBkZXN0cm95IGl0c2VsZi5cbiAgZnVuY3Rpb24gTGF6eUNvbXBvbmVudCgpe1xuICAgIHRoaXMuaXNTZXJ2aWNlID0gdHJ1ZTtcbiAgICB0aGlzLmlzQ29tcG9uZW50ID0gdHJ1ZTtcbiAgICB0aGlzLmlzTW9kZWwgPSB0cnVlO1xuICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuICAgIHRoaXMuY29uc3VtZXJzID0gW107XG4gICAgdGhpcy5zZXQgPSB0aGlzLm9uID0gdGhpcy5vZmYgPSBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIDE7XG4gICAgfTtcbiAgICB0aGlzLmdldCA9IGZ1bmN0aW9uKHBhdGgpe1xuICAgICAgcmV0dXJuIChwYXRoKSA/IHVuZGVmaW5lZCA6IHRoaXM7XG4gICAgfTtcbiAgICB0aGlzLmh5ZHJhdGUgPSBmdW5jdGlvbihzZXJ2aWNlKXtcbiAgICAgIF8uZWFjaCh0aGlzLmNvbnN1bWVycywgZnVuY3Rpb24oY29uc3VtZXIpe1xuICAgICAgICB2YXIgY29tcG9uZW50ID0gY29uc3VtZXIuY29tcG9uZW50LFxuICAgICAgICAgICAga2V5ID0gY29uc3VtZXIua2V5O1xuICAgICAgICBpZihjb21wb25lbnQuYXR0cmlidXRlcyAmJiBjb21wb25lbnQuc2V0KSBjb21wb25lbnQuc2V0KGtleSwgc2VydmljZSk7XG4gICAgICAgIGlmKGNvbXBvbmVudC5zZXJ2aWNlcykgY29tcG9uZW50LnNlcnZpY2VzW2tleV0gPSBzZXJ2aWNlO1xuICAgICAgICBpZihjb21wb25lbnQuZGVmYXVsdHMpIGNvbXBvbmVudC5kZWZhdWx0c1trZXldID0gc2VydmljZTtcbiAgICAgIH0pO1xuICAgICAgc2VydmljZS5jb25zdW1lcnMgPSB0aGlzLmNvbnN1bWVycztcbiAgICAgIGRlbGV0ZSB0aGlzLmNvbnN1bWVycztcbiAgICB9XG4gIH1cblxuICAvLyBSZWJvdW5kUm91dGVyIENvbnN0cnVjdG9yXG4gIHZhciBSZWJvdW5kUm91dGVyID0gQmFja2JvbmUuUm91dGVyLmV4dGVuZCh7XG5cbiAgICByb3V0ZXM6IHtcbiAgICAgICcqcm91dGUnOiAnd2lsZGNhcmRSb3V0ZSdcbiAgICB9LFxuXG4gICAgLy8gQ2FsbGVkIHdoZW4gbm8gbWF0Y2hpbmcgcm91dGVzIGFyZSBmb3VuZC4gRXh0cmFjdHMgcm9vdCByb3V0ZSBhbmQgZmV0Y2hlcyBpdCByZXNvdXJjZXNcbiAgICB3aWxkY2FyZFJvdXRlOiBmdW5jdGlvbihyb3V0ZSkge1xuICAgICAgdmFyIGFwcE5hbWUsIHByaW1hcnlSb3V0ZTtcblxuICAgICAgLy8gSWYgZW1wdHkgcm91dGUgc2VudCwgcm91dGUgaG9tZVxuICAgICAgcm91dGUgPSByb3V0ZSB8fCAnJztcblxuICAgICAgLy8gR2V0IFJvb3Qgb2YgUm91dGVcbiAgICAgIGFwcE5hbWUgPSBwcmltYXJ5Um91dGUgPSAocm91dGUpID8gcm91dGUuc3BsaXQoJy8nKVswXSA6ICdpbmRleCc7XG5cbiAgICAgIC8vIEZpbmQgQW55IEN1c3RvbSBSb3V0ZSBNYXBwaW5nc1xuICAgICAgXy5hbnkodGhpcy5jb25maWcuaGFuZGxlcnMsIGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGhhbmRsZXIucm91dGUudGVzdChyb3V0ZSkpIHtcbiAgICAgICAgICBhcHBOYW1lID0gaGFuZGxlci5wcmltYXJ5Um91dGU7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBJZiBQYWdlIElzIEFscmVhZHkgTG9hZGVkIFRoZW4gVGhlIFJvdXRlIERvZXMgTm90IEV4aXN0LiA0MDQgYW5kIEV4aXQuXG4gICAgICBpZiAodGhpcy5jdXJyZW50ICYmIHRoaXMuY3VycmVudC5uYW1lID09PSBwcmltYXJ5Um91dGUpIHtcbiAgICAgICAgcmV0dXJuIEJhY2tib25lLmhpc3RvcnkubG9hZFVybCgnNDA0Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZldGNoIFJlc291cmNlc1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKFwibG9hZGluZ1wiKTtcbiAgICAgIGZldGNoUmVzb3VyY2VzLmNhbGwodGhpcywgYXBwTmFtZSwgcHJpbWFyeVJvdXRlKTtcbiAgICB9LFxuXG4gICAgLy8gT24gc3RhcnR1cCwgc2F2ZSBvdXIgY29uZmlnIG9iamVjdCBhbmQgc3RhcnQgdGhlIHJvdXRlclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgICAgLy8gU2F2ZSBvdXIgY29uZmlnIHJlZmVyYW5jZVxuICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zLmNvbmZpZztcbiAgICAgIHRoaXMuY29uZmlnLmhhbmRsZXJzID0gW107XG5cbiAgICAgIHZhciByZW1vdGVVcmwgPSAvXihbYS16XSs6KXxeKFxcL1xcLyl8XihbXlxcL10rXFwuKS8sXG4gICAgICAgICAgcm91dGVyID0gdGhpcztcblxuICAgICAgLy8gQ29udmVydCBvdXIgcm91dGVNYXBwaW5ncyB0byByZWdleHBzIGFuZCBwdXNoIHRvIG91ciBoYW5kbGVyc1xuICAgICAgXy5lYWNoKHRoaXMuY29uZmlnLnJvdXRlTWFwcGluZywgZnVuY3Rpb24odmFsdWUsIHJvdXRlKXtcbiAgICAgICAgaWYgKCFfLmlzUmVnRXhwKHJvdXRlKSkgcm91dGUgPSByb3V0ZXIuX3JvdXRlVG9SZWdFeHAocm91dGUpO1xuICAgICAgICByb3V0ZXIuY29uZmlnLmhhbmRsZXJzLnVuc2hpZnQoeyByb3V0ZTogcm91dGUsIHByaW1hcnlSb3V0ZTogdmFsdWUgfSk7XG4gICAgICB9LCB0aGlzKTtcblxuICAgICAgLy8gTmF2aWdhdGUgdG8gcm91dGUgZm9yIGFueSBsaW5rIHdpdGggYSByZWxhdGl2ZSBocmVmXG4gICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYScsIGZ1bmN0aW9uKGUpe1xuXG4gICAgICAgIHZhciBwYXRoID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG5cbiAgICAgICAgLy8gSWYgcGF0aCBpcyBub3QgYW4gcmVtb3RlIHVybCwgZW5kcyBpbiAuW2Etel0sIG9yIGJsYW5rLCB0cnkgYW5kIG5hdmlnYXRlIHRvIHRoYXQgcm91dGUuXG4gICAgICAgIGlmKCBwYXRoICYmIHBhdGggIT09ICcjJyAmJiAhcmVtb3RlVXJsLnRlc3QocGF0aCkgKXtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaWYocGF0aCAhPT0gJy8nK0JhY2tib25lLmhpc3RvcnkuZnJhZ21lbnQpICQoZG9jdW1lbnQpLnVuTWFya0xpbmtzKCk7XG4gICAgICAgICAgcm91dGVyLm5hdmlnYXRlKHBhdGgsIHt0cmlnZ2VyOiB0cnVlfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBCYWNrYm9uZS5oaXN0b3J5Lm9uKCdyb3V0ZScsIGZ1bmN0aW9uKHJvdXRlLCBwYXJhbXMpe1xuICAgICAgICAkKGRvY3VtZW50KS5tYXJrTGlua3MoKTtcbiAgICAgIH0pO1xuXG4gICAgICBSZWJvdW5kLnNlcnZpY2VzLnBhZ2UgPSBuZXcgTGF6eUNvbXBvbmVudCgpO1xuXG4gICAgICAvLyBJbnN0YWxsIG91ciBnbG9iYWwgY29tcG9uZW50c1xuICAgICAgXy5lYWNoKHRoaXMuY29uZmlnLnNlcnZpY2VzLCBmdW5jdGlvbihzZWxlY3Rvciwgcm91dGUpe1xuICAgICAgICBSZWJvdW5kLnNlcnZpY2VzW3JvdXRlXSA9IG5ldyBMYXp5Q29tcG9uZW50KCk7XG4gICAgICAgIGZldGNoUmVzb3VyY2VzLmNhbGwocm91dGVyLCByb3V0ZSwgcm91dGUsIHNlbGVjdG9yKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBMZXQgYWxsIG9mIG91ciBjb21wb25lbnRzIGFsd2F5cyBoYXZlIHJlZmVyYW5jZSB0byBvdXIgcm91dGVyXG4gICAgICBSZWJvdW5kLkNvbXBvbmVudC5wcm90b3R5cGUucm91dGVyID0gdGhpcztcblxuICAgICAgLy8gU3RhcnQgdGhlIGhpc3RvcnlcbiAgICAgIEJhY2tib25lLmhpc3Rvcnkuc3RhcnQoe1xuICAgICAgICBwdXNoU3RhdGU6IHRydWUsXG4gICAgICAgIHJvb3Q6IHRoaXMuY29uZmlnLnJvb3RcbiAgICAgIH0pO1xuXG4gICAgfVxuICB9KTtcblxuZXhwb3J0IGRlZmF1bHQgUmVib3VuZFJvdXRlcjtcbiIsIi8vICAgICBSZWJvdW5kLmpzIDAuMC42MFxuXG4vLyAgICAgKGMpIDIwMTUgQWRhbSBNaWxsZXJcbi8vICAgICBSZWJvdW5kIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuLy8gICAgIEZvciBhbGwgZGV0YWlscyBhbmQgZG9jdW1lbnRhdGlvbjpcbi8vICAgICBodHRwOi8vcmVib3VuZGpzLmNvbVxuXG4vLyBSZWJvdW5kIFJ1bnRpbWVcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuLy8gSWYgQmFja2JvbmUgaXNuJ3QgcHJlc2V0IG9uIHRoZSBwYWdlIHlldCwgb3IgaWYgYHdpbmRvdy5SZWJvdW5kYCBpcyBhbHJlYWR5XG4vLyBpbiB1c2UsIHRocm93IGFuIGVycm9yXG5pZighd2luZG93LkJhY2tib25lKSB0aHJvdyBcIkJhY2tib25lIG11c3QgYmUgb24gdGhlIHBhZ2UgZm9yIFJlYm91bmQgdG8gbG9hZC5cIjtcbmlmKCF3aW5kb3cuUmVib3VuZCkgdGhyb3cgXCJHbG9iYWwgUmVib3VuZCBuYW1lc3BhY2UgYWxyZWFkeSB0YWtlbi5cIjtcblxuLy8gTG9hZCBvdXIgKipVdGlscyoqLCBoZWxwZXIgZW52aXJvbm1lbnQsICoqUmVib3VuZCBEYXRhKiosXG4vLyAqKlJlYm91bmQgQ29tcG9uZW50cyoqIGFuZCB0aGUgKipSZWJvdW5kIFJvdXRlcioqXG5pbXBvcnQgdXRpbHMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5pbXBvcnQgaGVscGVycyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaGVscGVyc1wiO1xuaW1wb3J0IHsgTW9kZWwsIENvbGxlY3Rpb24sIENvbXB1dGVkUHJvcGVydHkgfSBmcm9tIFwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YVwiO1xuaW1wb3J0IENvbXBvbmVudCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvY29tcG9uZW50XCI7XG5pbXBvcnQgUm91dGVyIGZyb20gXCJyZWJvdW5kLXJvdXRlci9yZWJvdW5kLXJvdXRlclwiO1xuXG4vLyBJZiBCYWNrYm9uZSBkb2Vzbid0IGhhdmUgYW4gYWpheCBtZXRob2QgZnJvbSBhbiBleHRlcm5hbCBET00gbGlicmFyeSwgdXNlIG91cnNcbndpbmRvdy5CYWNrYm9uZS5hamF4ID0gd2luZG93LkJhY2tib25lLiQgJiYgd2luZG93LkJhY2tib25lLiQuYWpheCAmJiB3aW5kb3cuQmFja2JvbmUuYWpheCB8fCB1dGlscy5hamF4O1xuXG4vLyBGZXRjaCBSZWJvdW5kJ3MgQ29uZmlnIE9iamVjdCBmcm9tIFJlYm91bmQncyBgc2NyaXB0YCB0YWdcbnZhciBDb25maWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnUmVib3VuZCcpLmlubmVySFRNTDtcblxuLy8gQ3JlYXRlIEdsb2JhbCBSZWJvdW5kIE9iamVjdFxud2luZG93LlJlYm91bmQgPSB7XG4gIHNlcnZpY2VzOiB7fSxcbiAgcmVnaXN0ZXJIZWxwZXI6IGhlbHBlcnMucmVnaXN0ZXJIZWxwZXIsXG4gIHJlZ2lzdGVyUGFydGlhbDogaGVscGVycy5yZWdpc3RlclBhcnRpYWwsXG4gIHJlZ2lzdGVyQ29tcG9uZW50OiBDb21wb25lbnQucmVnaXN0ZXIsXG4gIE1vZGVsOiBNb2RlbCxcbiAgQ29sbGVjdGlvbjogQ29sbGVjdGlvbixcbiAgQ29tcHV0ZWRQcm9wZXJ0eTogQ29tcHV0ZWRQcm9wZXJ0eSxcbiAgQ29tcG9uZW50OiBDb21wb25lbnRcbn07XG5cbi8vIFN0YXJ0IHRoZSByb3V0ZXIgaWYgYSBjb25maWcgb2JqZWN0IGlzIHByZXNldFxuaWYoQ29uZmlnKSB3aW5kb3cuUmVib3VuZC5yb3V0ZXIgPSBuZXcgUm91dGVyKHtjb25maWc6IEpTT04ucGFyc2UoQ29uZmlnKX0pO1xuXG5leHBvcnQgZGVmYXVsdCBSZWJvdW5kO1xuIiwiLy8gUmVib3VuZCBDb21waWxlclxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgeyBjb21waWxlIGFzIGh0bWxiYXJzQ29tcGlsZSwgY29tcGlsZVNwZWMgYXMgaHRtbGJhcnNDb21waWxlU3BlYyB9IGZyb20gXCJodG1sYmFycy1jb21waWxlci9jb21waWxlclwiO1xuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwiaHRtbGJhcnMtdXRpbC9vYmplY3QtdXRpbHNcIjtcbmltcG9ydCBET01IZWxwZXIgZnJvbSBcImRvbS1oZWxwZXJcIjtcbmltcG9ydCBoZWxwZXJzIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9oZWxwZXJzXCI7XG5pbXBvcnQgaG9va3MgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hvb2tzXCI7XG5cbmZ1bmN0aW9uIGNvbXBpbGUoc3RyaW5nLCBvcHRpb25zKXtcbiAgLy8gRW5zdXJlIHdlIGhhdmUgYSB3ZWxsLWZvcm1lZCBvYmplY3QgYXMgdmFyIG9wdGlvbnNcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuaGVscGVycyA9IG9wdGlvbnMuaGVscGVycyB8fCB7fTtcbiAgb3B0aW9ucy5ob29rcyA9IG9wdGlvbnMuaG9va3MgfHwge307XG5cbiAgLy8gTWVyZ2Ugb3VyIGRlZmF1bHQgaGVscGVycyB3aXRoIHVzZXIgcHJvdmlkZWQgaGVscGVyc1xuICBvcHRpb25zLmhlbHBlcnMgPSBtZXJnZShoZWxwZXJzLCBvcHRpb25zLmhlbHBlcnMpO1xuICBvcHRpb25zLmhvb2tzID0gbWVyZ2UoaG9va3MsIG9wdGlvbnMuaG9va3MpO1xuXG4gIC8vIENvbXBpbGUgb3VyIHRlbXBsYXRlIGZ1bmN0aW9uXG4gIHZhciBmdW5jID0gaHRtbGJhcnNDb21waWxlKHN0cmluZywge1xuICAgIGhlbHBlcnM6IG9wdGlvbnMuaGVscGVycyxcbiAgICBob29rczogb3B0aW9ucy5ob29rc1xuICB9KTtcblxuICBmdW5jLl9yZW5kZXIgPSBmdW5jLnJlbmRlcjtcblxuICAvLyBSZXR1cm4gYSB3cmFwcGVyIGZ1bmN0aW9uIHRoYXQgd2lsbCBtZXJnZSB1c2VyIHByb3ZpZGVkIGhlbHBlcnMgd2l0aCBvdXIgZGVmYXVsdHNcbiAgZnVuYy5yZW5kZXIgPSBmdW5jdGlvbihkYXRhLCBlbnYsIGNvbnRleHQpe1xuICAgIC8vIEVuc3VyZSB3ZSBoYXZlIGEgd2VsbC1mb3JtZWQgb2JqZWN0IGFzIHZhciBvcHRpb25zXG4gICAgZW52ID0gZW52IHx8IHt9O1xuICAgIGVudi5oZWxwZXJzID0gZW52LmhlbHBlcnMgfHwge307XG4gICAgZW52Lmhvb2tzID0gZW52Lmhvb2tzIHx8IHt9O1xuICAgIGVudi5kb20gPSBlbnYuZG9tIHx8IG5ldyBET01IZWxwZXIoKTtcblxuICAgIC8vIE1lcmdlIG91ciBkZWZhdWx0IGhlbHBlcnMgYW5kIGhvb2tzIHdpdGggdXNlciBwcm92aWRlZCBoZWxwZXJzXG4gICAgZW52LmhlbHBlcnMgPSBtZXJnZShoZWxwZXJzLCBlbnYuaGVscGVycyk7XG4gICAgZW52Lmhvb2tzID0gbWVyZ2UoaG9va3MsIGVudi5ob29rcyk7XG5cbiAgICAvLyBTZXQgYSBkZWZhdWx0IGNvbnRleHQgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IGRvY3VtZW50LmJvZHk7XG5cbiAgICAvLyBDYWxsIG91ciBmdW5jIHdpdGggbWVyZ2VkIGhlbHBlcnMgYW5kIGhvb2tzXG4gICAgcmV0dXJuIGZ1bmMuX3JlbmRlcihkYXRhLCBlbnYsIGNvbnRleHQpO1xuICB9O1xuXG4gIGhlbHBlcnMucmVnaXN0ZXJQYXJ0aWFsKCBvcHRpb25zLm5hbWUsIGZ1bmMpO1xuXG4gIHJldHVybiBmdW5jO1xuXG59XG5cbmV4cG9ydCB7IGNvbXBpbGUgfTtcbiIsIi8qanNoaW50IC1XMDU0ICovXG4vLyBqc2hpbnQgaWdub3JlOiBzdGFydFxuXG4gIC8vIEEgc2Vjb25kIG9wdGlvbmFsIGFyZ3VtZW50IGNhbiBiZSBnaXZlbiB0byBmdXJ0aGVyIGNvbmZpZ3VyZVxuICAvLyB0aGUgcGFyc2VyIHByb2Nlc3MuIFRoZXNlIG9wdGlvbnMgYXJlIHJlY29nbml6ZWQ6XG5cbiAgdmFyIGV4cG9ydHMgPSB7fTtcblxuICB2YXIgb3B0aW9ucywgaW5wdXQsIGlucHV0TGVuLCBzb3VyY2VGaWxlO1xuXG4gIHZhciBkZWZhdWx0T3B0aW9ucyA9IGV4cG9ydHMuZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgLy8gYGVjbWFWZXJzaW9uYCBpbmRpY2F0ZXMgdGhlIEVDTUFTY3JpcHQgdmVyc2lvbiB0byBwYXJzZS4gTXVzdFxuICAgIC8vIGJlIGVpdGhlciAzLCBvciA1LCBvciA2LiBUaGlzIGluZmx1ZW5jZXMgc3VwcG9ydCBmb3Igc3RyaWN0XG4gICAgLy8gbW9kZSwgdGhlIHNldCBvZiByZXNlcnZlZCB3b3Jkcywgc3VwcG9ydCBmb3IgZ2V0dGVycyBhbmRcbiAgICAvLyBzZXR0ZXJzIGFuZCBvdGhlciBmZWF0dXJlcy4gRVM2IHN1cHBvcnQgaXMgb25seSBwYXJ0aWFsLlxuICAgIGVjbWFWZXJzaW9uOiA1LFxuICAgIC8vIFR1cm4gb24gYHN0cmljdFNlbWljb2xvbnNgIHRvIHByZXZlbnQgdGhlIHBhcnNlciBmcm9tIGRvaW5nXG4gICAgLy8gYXV0b21hdGljIHNlbWljb2xvbiBpbnNlcnRpb24uXG4gICAgc3RyaWN0U2VtaWNvbG9uczogZmFsc2UsXG4gICAgLy8gV2hlbiBgYWxsb3dUcmFpbGluZ0NvbW1hc2AgaXMgZmFsc2UsIHRoZSBwYXJzZXIgd2lsbCBub3QgYWxsb3dcbiAgICAvLyB0cmFpbGluZyBjb21tYXMgaW4gYXJyYXkgYW5kIG9iamVjdCBsaXRlcmFscy5cbiAgICBhbGxvd1RyYWlsaW5nQ29tbWFzOiB0cnVlLFxuICAgIC8vIEJ5IGRlZmF1bHQsIHJlc2VydmVkIHdvcmRzIGFyZSBub3QgZW5mb3JjZWQuIEVuYWJsZVxuICAgIC8vIGBmb3JiaWRSZXNlcnZlZGAgdG8gZW5mb3JjZSB0aGVtLiBXaGVuIHRoaXMgb3B0aW9uIGhhcyB0aGVcbiAgICAvLyB2YWx1ZSBcImV2ZXJ5d2hlcmVcIiwgcmVzZXJ2ZWQgd29yZHMgYW5kIGtleXdvcmRzIGNhbiBhbHNvIG5vdCBiZVxuICAgIC8vIHVzZWQgYXMgcHJvcGVydHkgbmFtZXMuXG4gICAgZm9yYmlkUmVzZXJ2ZWQ6IGZhbHNlLFxuICAgIC8vIFdoZW4gZW5hYmxlZCwgYSByZXR1cm4gYXQgdGhlIHRvcCBsZXZlbCBpcyBub3QgY29uc2lkZXJlZCBhblxuICAgIC8vIGVycm9yLlxuICAgIGFsbG93UmV0dXJuT3V0c2lkZUZ1bmN0aW9uOiBmYWxzZSxcbiAgICAvLyBXaGVuIGBsb2NhdGlvbnNgIGlzIG9uLCBgbG9jYCBwcm9wZXJ0aWVzIGhvbGRpbmcgb2JqZWN0cyB3aXRoXG4gICAgLy8gYHN0YXJ0YCBhbmQgYGVuZGAgcHJvcGVydGllcyBpbiBge2xpbmUsIGNvbHVtbn1gIGZvcm0gKHdpdGhcbiAgICAvLyBsaW5lIGJlaW5nIDEtYmFzZWQgYW5kIGNvbHVtbiAwLWJhc2VkKSB3aWxsIGJlIGF0dGFjaGVkIHRvIHRoZVxuICAgIC8vIG5vZGVzLlxuICAgIGxvY2F0aW9uczogZmFsc2UsXG4gICAgLy8gQSBmdW5jdGlvbiBjYW4gYmUgcGFzc2VkIGFzIGBvbkNvbW1lbnRgIG9wdGlvbiwgd2hpY2ggd2lsbFxuICAgIC8vIGNhdXNlIEFjb3JuIHRvIGNhbGwgdGhhdCBmdW5jdGlvbiB3aXRoIGAoYmxvY2ssIHRleHQsIHN0YXJ0LFxuICAgIC8vIGVuZClgIHBhcmFtZXRlcnMgd2hlbmV2ZXIgYSBjb21tZW50IGlzIHNraXBwZWQuIGBibG9ja2AgaXMgYVxuICAgIC8vIGJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRoaXMgaXMgYSBibG9jayAoYC8qICovYCkgY29tbWVudCxcbiAgICAvLyBgdGV4dGAgaXMgdGhlIGNvbnRlbnQgb2YgdGhlIGNvbW1lbnQsIGFuZCBgc3RhcnRgIGFuZCBgZW5kYCBhcmVcbiAgICAvLyBjaGFyYWN0ZXIgb2Zmc2V0cyB0aGF0IGRlbm90ZSB0aGUgc3RhcnQgYW5kIGVuZCBvZiB0aGUgY29tbWVudC5cbiAgICAvLyBXaGVuIHRoZSBgbG9jYXRpb25zYCBvcHRpb24gaXMgb24sIHR3byBtb3JlIHBhcmFtZXRlcnMgYXJlXG4gICAgLy8gcGFzc2VkLCB0aGUgZnVsbCBge2xpbmUsIGNvbHVtbn1gIGxvY2F0aW9ucyBvZiB0aGUgc3RhcnQgYW5kXG4gICAgLy8gZW5kIG9mIHRoZSBjb21tZW50cy4gTm90ZSB0aGF0IHlvdSBhcmUgbm90IGFsbG93ZWQgdG8gY2FsbCB0aGVcbiAgICAvLyBwYXJzZXIgZnJvbSB0aGUgY2FsbGJhY2vigJR0aGF0IHdpbGwgY29ycnVwdCBpdHMgaW50ZXJuYWwgc3RhdGUuXG4gICAgb25Db21tZW50OiBudWxsLFxuICAgIC8vIE5vZGVzIGhhdmUgdGhlaXIgc3RhcnQgYW5kIGVuZCBjaGFyYWN0ZXJzIG9mZnNldHMgcmVjb3JkZWQgaW5cbiAgICAvLyBgc3RhcnRgIGFuZCBgZW5kYCBwcm9wZXJ0aWVzIChkaXJlY3RseSBvbiB0aGUgbm9kZSwgcmF0aGVyIHRoYW5cbiAgICAvLyB0aGUgYGxvY2Agb2JqZWN0LCB3aGljaCBob2xkcyBsaW5lL2NvbHVtbiBkYXRhLiBUbyBhbHNvIGFkZCBhXG4gICAgLy8gW3NlbWktc3RhbmRhcmRpemVkXVtyYW5nZV0gYHJhbmdlYCBwcm9wZXJ0eSBob2xkaW5nIGEgYFtzdGFydCxcbiAgICAvLyBlbmRdYCBhcnJheSB3aXRoIHRoZSBzYW1lIG51bWJlcnMsIHNldCB0aGUgYHJhbmdlc2Agb3B0aW9uIHRvXG4gICAgLy8gYHRydWVgLlxuICAgIC8vXG4gICAgLy8gW3JhbmdlXTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NzQ1Njc4XG4gICAgcmFuZ2VzOiBmYWxzZSxcbiAgICAvLyBJdCBpcyBwb3NzaWJsZSB0byBwYXJzZSBtdWx0aXBsZSBmaWxlcyBpbnRvIGEgc2luZ2xlIEFTVCBieVxuICAgIC8vIHBhc3NpbmcgdGhlIHRyZWUgcHJvZHVjZWQgYnkgcGFyc2luZyB0aGUgZmlyc3QgZmlsZSBhc1xuICAgIC8vIGBwcm9ncmFtYCBvcHRpb24gaW4gc3Vic2VxdWVudCBwYXJzZXMuIFRoaXMgd2lsbCBhZGQgdGhlXG4gICAgLy8gdG9wbGV2ZWwgZm9ybXMgb2YgdGhlIHBhcnNlZCBmaWxlIHRvIHRoZSBgUHJvZ3JhbWAgKHRvcCkgbm9kZVxuICAgIC8vIG9mIGFuIGV4aXN0aW5nIHBhcnNlIHRyZWUuXG4gICAgcHJvZ3JhbTogbnVsbCxcbiAgICAvLyBXaGVuIGBsb2NhdGlvbnNgIGlzIG9uLCB5b3UgY2FuIHBhc3MgdGhpcyB0byByZWNvcmQgdGhlIHNvdXJjZVxuICAgIC8vIGZpbGUgaW4gZXZlcnkgbm9kZSdzIGBsb2NgIG9iamVjdC5cbiAgICBzb3VyY2VGaWxlOiBudWxsLFxuICAgIC8vIFRoaXMgdmFsdWUsIGlmIGdpdmVuLCBpcyBzdG9yZWQgaW4gZXZlcnkgbm9kZSwgd2hldGhlclxuICAgIC8vIGBsb2NhdGlvbnNgIGlzIG9uIG9yIG9mZi5cbiAgICBkaXJlY3RTb3VyY2VGaWxlOiBudWxsXG4gIH07XG5cbiAgZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRzKSB7XG4gICAgb3B0aW9ucyA9IG9wdHMgfHwge307XG4gICAgZm9yICh2YXIgb3B0IGluIGRlZmF1bHRPcHRpb25zKSBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCBvcHQpKVxuICAgICAgb3B0aW9uc1tvcHRdID0gZGVmYXVsdE9wdGlvbnNbb3B0XTtcbiAgICBzb3VyY2VGaWxlID0gb3B0aW9ucy5zb3VyY2VGaWxlIHx8IG51bGw7XG5cbiAgICBpc0tleXdvcmQgPSBvcHRpb25zLmVjbWFWZXJzaW9uID49IDYgPyBpc0VjbWE2S2V5d29yZCA6IGlzRWNtYTVBbmRMZXNzS2V5d29yZDtcbiAgfVxuXG4gIC8vIFRoZSBgZ2V0TGluZUluZm9gIGZ1bmN0aW9uIGlzIG1vc3RseSB1c2VmdWwgd2hlbiB0aGVcbiAgLy8gYGxvY2F0aW9uc2Agb3B0aW9uIGlzIG9mZiAoZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMpIGFuZCB5b3VcbiAgLy8gd2FudCB0byBmaW5kIHRoZSBsaW5lL2NvbHVtbiBwb3NpdGlvbiBmb3IgYSBnaXZlbiBjaGFyYWN0ZXJcbiAgLy8gb2Zmc2V0LiBgaW5wdXRgIHNob3VsZCBiZSB0aGUgY29kZSBzdHJpbmcgdGhhdCB0aGUgb2Zmc2V0IHJlZmVyc1xuICAvLyBpbnRvLlxuXG4gIHZhciBnZXRMaW5lSW5mbyA9IGV4cG9ydHMuZ2V0TGluZUluZm8gPSBmdW5jdGlvbihpbnB1dCwgb2Zmc2V0KSB7XG4gICAgZm9yICh2YXIgbGluZSA9IDEsIGN1ciA9IDA7Oykge1xuICAgICAgbGluZUJyZWFrLmxhc3RJbmRleCA9IGN1cjtcbiAgICAgIHZhciBtYXRjaCA9IGxpbmVCcmVhay5leGVjKGlucHV0KTtcbiAgICAgIGlmIChtYXRjaCAmJiBtYXRjaC5pbmRleCA8IG9mZnNldCkge1xuICAgICAgICArK2xpbmU7XG4gICAgICAgIGN1ciA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgfSBlbHNlIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4ge2xpbmU6IGxpbmUsIGNvbHVtbjogb2Zmc2V0IC0gY3VyfTtcbiAgfTtcblxuICAvLyBBY29ybiBpcyBvcmdhbml6ZWQgYXMgYSB0b2tlbml6ZXIgYW5kIGEgcmVjdXJzaXZlLWRlc2NlbnQgcGFyc2VyLlxuICAvLyBUaGUgYHRva2VuaXplYCBleHBvcnQgcHJvdmlkZXMgYW4gaW50ZXJmYWNlIHRvIHRoZSB0b2tlbml6ZXIuXG4gIC8vIEJlY2F1c2UgdGhlIHRva2VuaXplciBpcyBvcHRpbWl6ZWQgZm9yIGJlaW5nIGVmZmljaWVudGx5IHVzZWQgYnlcbiAgLy8gdGhlIEFjb3JuIHBhcnNlciBpdHNlbGYsIHRoaXMgaW50ZXJmYWNlIGlzIHNvbWV3aGF0IGNydWRlIGFuZCBub3RcbiAgLy8gdmVyeSBtb2R1bGFyLiBQZXJmb3JtaW5nIGFub3RoZXIgcGFyc2Ugb3IgY2FsbCB0byBgdG9rZW5pemVgIHdpbGxcbiAgLy8gcmVzZXQgdGhlIGludGVybmFsIHN0YXRlLCBhbmQgaW52YWxpZGF0ZSBleGlzdGluZyB0b2tlbml6ZXJzLlxuXG4gIGV4cG9ydHMudG9rZW5pemUgPSBmdW5jdGlvbihpbnB0LCBvcHRzKSB7XG4gICAgaW5wdXQgPSBTdHJpbmcoaW5wdCk7IGlucHV0TGVuID0gaW5wdXQubGVuZ3RoO1xuICAgIHNldE9wdGlvbnMob3B0cyk7XG4gICAgaW5pdFRva2VuU3RhdGUoKTtcblxuICAgIHZhciB0ID0ge307XG4gICAgZnVuY3Rpb24gZ2V0VG9rZW4oZm9yY2VSZWdleHApIHtcbiAgICAgIGxhc3RFbmQgPSB0b2tFbmQ7XG4gICAgICByZWFkVG9rZW4oZm9yY2VSZWdleHApO1xuICAgICAgdC5zdGFydCA9IHRva1N0YXJ0OyB0LmVuZCA9IHRva0VuZDtcbiAgICAgIHQuc3RhcnRMb2MgPSB0b2tTdGFydExvYzsgdC5lbmRMb2MgPSB0b2tFbmRMb2M7XG4gICAgICB0LnR5cGUgPSB0b2tUeXBlOyB0LnZhbHVlID0gdG9rVmFsO1xuICAgICAgcmV0dXJuIHQ7XG4gICAgfVxuICAgIGdldFRva2VuLmp1bXBUbyA9IGZ1bmN0aW9uKHBvcywgcmVBbGxvd2VkKSB7XG4gICAgICB0b2tQb3MgPSBwb3M7XG4gICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnMpIHtcbiAgICAgICAgdG9rQ3VyTGluZSA9IDE7XG4gICAgICAgIHRva0xpbmVTdGFydCA9IGxpbmVCcmVhay5sYXN0SW5kZXggPSAwO1xuICAgICAgICB2YXIgbWF0Y2g7XG4gICAgICAgIHdoaWxlICgobWF0Y2ggPSBsaW5lQnJlYWsuZXhlYyhpbnB1dCkpICYmIG1hdGNoLmluZGV4IDwgcG9zKSB7XG4gICAgICAgICAgKyt0b2tDdXJMaW5lO1xuICAgICAgICAgIHRva0xpbmVTdGFydCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0b2tSZWdleHBBbGxvd2VkID0gcmVBbGxvd2VkO1xuICAgICAgc2tpcFNwYWNlKCk7XG4gICAgfTtcbiAgICByZXR1cm4gZ2V0VG9rZW47XG4gIH07XG5cbiAgLy8gU3RhdGUgaXMga2VwdCBpbiAoY2xvc3VyZS0pZ2xvYmFsIHZhcmlhYmxlcy4gV2UgYWxyZWFkeSBzYXcgdGhlXG4gIC8vIGBvcHRpb25zYCwgYGlucHV0YCwgYW5kIGBpbnB1dExlbmAgdmFyaWFibGVzIGFib3ZlLlxuXG4gIC8vIFRoZSBjdXJyZW50IHBvc2l0aW9uIG9mIHRoZSB0b2tlbml6ZXIgaW4gdGhlIGlucHV0LlxuXG4gIHZhciB0b2tQb3M7XG5cbiAgLy8gVGhlIHN0YXJ0IGFuZCBlbmQgb2Zmc2V0cyBvZiB0aGUgY3VycmVudCB0b2tlbi5cblxuICB2YXIgdG9rU3RhcnQsIHRva0VuZDtcblxuICAvLyBXaGVuIGBvcHRpb25zLmxvY2F0aW9uc2AgaXMgdHJ1ZSwgdGhlc2UgaG9sZCBvYmplY3RzXG4gIC8vIGNvbnRhaW5pbmcgdGhlIHRva2VucyBzdGFydCBhbmQgZW5kIGxpbmUvY29sdW1uIHBhaXJzLlxuXG4gIHZhciB0b2tTdGFydExvYywgdG9rRW5kTG9jO1xuXG4gIC8vIFRoZSB0eXBlIGFuZCB2YWx1ZSBvZiB0aGUgY3VycmVudCB0b2tlbi4gVG9rZW4gdHlwZXMgYXJlIG9iamVjdHMsXG4gIC8vIG5hbWVkIGJ5IHZhcmlhYmxlcyBhZ2FpbnN0IHdoaWNoIHRoZXkgY2FuIGJlIGNvbXBhcmVkLCBhbmRcbiAgLy8gaG9sZGluZyBwcm9wZXJ0aWVzIHRoYXQgZGVzY3JpYmUgdGhlbSAoaW5kaWNhdGluZywgZm9yIGV4YW1wbGUsXG4gIC8vIHRoZSBwcmVjZWRlbmNlIG9mIGFuIGluZml4IG9wZXJhdG9yLCBhbmQgdGhlIG9yaWdpbmFsIG5hbWUgb2YgYVxuICAvLyBrZXl3b3JkIHRva2VuKS4gVGhlIGtpbmQgb2YgdmFsdWUgdGhhdCdzIGhlbGQgaW4gYHRva1ZhbGAgZGVwZW5kc1xuICAvLyBvbiB0aGUgdHlwZSBvZiB0aGUgdG9rZW4uIEZvciBsaXRlcmFscywgaXQgaXMgdGhlIGxpdGVyYWwgdmFsdWUsXG4gIC8vIGZvciBvcGVyYXRvcnMsIHRoZSBvcGVyYXRvciBuYW1lLCBhbmQgc28gb24uXG5cbiAgdmFyIHRva1R5cGUsIHRva1ZhbDtcblxuICAvLyBJbnRlcmFsIHN0YXRlIGZvciB0aGUgdG9rZW5pemVyLiBUbyBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpdmlzaW9uXG4gIC8vIG9wZXJhdG9ycyBhbmQgcmVndWxhciBleHByZXNzaW9ucywgaXQgcmVtZW1iZXJzIHdoZXRoZXIgdGhlIGxhc3RcbiAgLy8gdG9rZW4gd2FzIG9uZSB0aGF0IGlzIGFsbG93ZWQgdG8gYmUgZm9sbG93ZWQgYnkgYW4gZXhwcmVzc2lvbi5cbiAgLy8gKElmIGl0IGlzLCBhIHNsYXNoIGlzIHByb2JhYmx5IGEgcmVnZXhwLCBpZiBpdCBpc24ndCBpdCdzIGFcbiAgLy8gZGl2aXNpb24gb3BlcmF0b3IuIFNlZSB0aGUgYHBhcnNlU3RhdGVtZW50YCBmdW5jdGlvbiBmb3IgYVxuICAvLyBjYXZlYXQuKVxuXG4gIHZhciB0b2tSZWdleHBBbGxvd2VkO1xuXG4gIC8vIFdoZW4gYG9wdGlvbnMubG9jYXRpb25zYCBpcyB0cnVlLCB0aGVzZSBhcmUgdXNlZCB0byBrZWVwXG4gIC8vIHRyYWNrIG9mIHRoZSBjdXJyZW50IGxpbmUsIGFuZCBrbm93IHdoZW4gYSBuZXcgbGluZSBoYXMgYmVlblxuICAvLyBlbnRlcmVkLlxuXG4gIHZhciB0b2tDdXJMaW5lLCB0b2tMaW5lU3RhcnQ7XG5cbiAgLy8gVGhlc2Ugc3RvcmUgdGhlIHBvc2l0aW9uIG9mIHRoZSBwcmV2aW91cyB0b2tlbiwgd2hpY2ggaXMgdXNlZnVsXG4gIC8vIHdoZW4gZmluaXNoaW5nIGEgbm9kZSBhbmQgYXNzaWduaW5nIGl0cyBgZW5kYCBwb3NpdGlvbi5cblxuICB2YXIgbGFzdFN0YXJ0LCBsYXN0RW5kLCBsYXN0RW5kTG9jO1xuXG4gIC8vIFRoaXMgaXMgdGhlIHBhcnNlcidzIHN0YXRlLiBgaW5GdW5jdGlvbmAgaXMgdXNlZCB0byByZWplY3RcbiAgLy8gYHJldHVybmAgc3RhdGVtZW50cyBvdXRzaWRlIG9mIGZ1bmN0aW9ucywgYGxhYmVsc2AgdG8gdmVyaWZ5IHRoYXRcbiAgLy8gYGJyZWFrYCBhbmQgYGNvbnRpbnVlYCBoYXZlIHNvbWV3aGVyZSB0byBqdW1wIHRvLCBhbmQgYHN0cmljdGBcbiAgLy8gaW5kaWNhdGVzIHdoZXRoZXIgc3RyaWN0IG1vZGUgaXMgb24uXG5cbiAgdmFyIGluRnVuY3Rpb24sIGxhYmVscywgc3RyaWN0O1xuXG4gIC8vIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byByYWlzZSBleGNlcHRpb25zIG9uIHBhcnNlIGVycm9ycy4gSXRcbiAgLy8gdGFrZXMgYW4gb2Zmc2V0IGludGVnZXIgKGludG8gdGhlIGN1cnJlbnQgYGlucHV0YCkgdG8gaW5kaWNhdGVcbiAgLy8gdGhlIGxvY2F0aW9uIG9mIHRoZSBlcnJvciwgYXR0YWNoZXMgdGhlIHBvc2l0aW9uIHRvIHRoZSBlbmRcbiAgLy8gb2YgdGhlIGVycm9yIG1lc3NhZ2UsIGFuZCB0aGVuIHJhaXNlcyBhIGBTeW50YXhFcnJvcmAgd2l0aCB0aGF0XG4gIC8vIG1lc3NhZ2UuXG5cbiAgZnVuY3Rpb24gcmFpc2UocG9zLCBtZXNzYWdlKSB7XG4gICAgdmFyIGxvYyA9IGdldExpbmVJbmZvKGlucHV0LCBwb3MpO1xuICAgIG1lc3NhZ2UgKz0gXCIgKFwiICsgbG9jLmxpbmUgKyBcIjpcIiArIGxvYy5jb2x1bW4gKyBcIilcIjtcbiAgICB2YXIgZXJyID0gbmV3IFN5bnRheEVycm9yKG1lc3NhZ2UpO1xuICAgIGVyci5wb3MgPSBwb3M7IGVyci5sb2MgPSBsb2M7IGVyci5yYWlzZWRBdCA9IHRva1BvcztcbiAgICB0aHJvdyBlcnI7XG4gIH1cblxuICAvLyBSZXVzZWQgZW1wdHkgYXJyYXkgYWRkZWQgZm9yIG5vZGUgZmllbGRzIHRoYXQgYXJlIGFsd2F5cyBlbXB0eS5cblxuICB2YXIgZW1wdHkgPSBbXTtcblxuICAvLyAjIyBUb2tlbiB0eXBlc1xuXG4gIC8vIFRoZSBhc3NpZ25tZW50IG9mIGZpbmUtZ3JhaW5lZCwgaW5mb3JtYXRpb24tY2FycnlpbmcgdHlwZSBvYmplY3RzXG4gIC8vIGFsbG93cyB0aGUgdG9rZW5pemVyIHRvIHN0b3JlIHRoZSBpbmZvcm1hdGlvbiBpdCBoYXMgYWJvdXQgYVxuICAvLyB0b2tlbiBpbiBhIHdheSB0aGF0IGlzIHZlcnkgY2hlYXAgZm9yIHRoZSBwYXJzZXIgdG8gbG9vayB1cC5cblxuICAvLyBBbGwgdG9rZW4gdHlwZSB2YXJpYWJsZXMgc3RhcnQgd2l0aCBhbiB1bmRlcnNjb3JlLCB0byBtYWtlIHRoZW1cbiAgLy8gZWFzeSB0byByZWNvZ25pemUuXG5cbiAgLy8gVGhlc2UgYXJlIHRoZSBnZW5lcmFsIHR5cGVzLiBUaGUgYHR5cGVgIHByb3BlcnR5IGlzIG9ubHkgdXNlZCB0b1xuICAvLyBtYWtlIHRoZW0gcmVjb2duaXplYWJsZSB3aGVuIGRlYnVnZ2luZy5cblxuICB2YXIgX251bSA9IHt0eXBlOiBcIm51bVwifSwgX3JlZ2V4cCA9IHt0eXBlOiBcInJlZ2V4cFwifSwgX3N0cmluZyA9IHt0eXBlOiBcInN0cmluZ1wifTtcbiAgdmFyIF9uYW1lID0ge3R5cGU6IFwibmFtZVwifSwgX2VvZiA9IHt0eXBlOiBcImVvZlwifTtcblxuICAvLyBLZXl3b3JkIHRva2Vucy4gVGhlIGBrZXl3b3JkYCBwcm9wZXJ0eSAoYWxzbyB1c2VkIGluIGtleXdvcmQtbGlrZVxuICAvLyBvcGVyYXRvcnMpIGluZGljYXRlcyB0aGF0IHRoZSB0b2tlbiBvcmlnaW5hdGVkIGZyb20gYW5cbiAgLy8gaWRlbnRpZmllci1saWtlIHdvcmQsIHdoaWNoIGlzIHVzZWQgd2hlbiBwYXJzaW5nIHByb3BlcnR5IG5hbWVzLlxuICAvL1xuICAvLyBUaGUgYGJlZm9yZUV4cHJgIHByb3BlcnR5IGlzIHVzZWQgdG8gZGlzYW1iaWd1YXRlIGJldHdlZW4gcmVndWxhclxuICAvLyBleHByZXNzaW9ucyBhbmQgZGl2aXNpb25zLiBJdCBpcyBzZXQgb24gYWxsIHRva2VuIHR5cGVzIHRoYXQgY2FuXG4gIC8vIGJlIGZvbGxvd2VkIGJ5IGFuIGV4cHJlc3Npb24gKHRodXMsIGEgc2xhc2ggYWZ0ZXIgdGhlbSB3b3VsZCBiZSBhXG4gIC8vIHJlZ3VsYXIgZXhwcmVzc2lvbikuXG4gIC8vXG4gIC8vIGBpc0xvb3BgIG1hcmtzIGEga2V5d29yZCBhcyBzdGFydGluZyBhIGxvb3AsIHdoaWNoIGlzIGltcG9ydGFudFxuICAvLyB0byBrbm93IHdoZW4gcGFyc2luZyBhIGxhYmVsLCBpbiBvcmRlciB0byBhbGxvdyBvciBkaXNhbGxvd1xuICAvLyBjb250aW51ZSBqdW1wcyB0byB0aGF0IGxhYmVsLlxuXG4gIHZhciBfYnJlYWsgPSB7a2V5d29yZDogXCJicmVha1wifSwgX2Nhc2UgPSB7a2V5d29yZDogXCJjYXNlXCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfY2F0Y2ggPSB7a2V5d29yZDogXCJjYXRjaFwifTtcbiAgdmFyIF9jb250aW51ZSA9IHtrZXl3b3JkOiBcImNvbnRpbnVlXCJ9LCBfZGVidWdnZXIgPSB7a2V5d29yZDogXCJkZWJ1Z2dlclwifSwgX2RlZmF1bHQgPSB7a2V5d29yZDogXCJkZWZhdWx0XCJ9O1xuICB2YXIgX2RvID0ge2tleXdvcmQ6IFwiZG9cIiwgaXNMb29wOiB0cnVlfSwgX2Vsc2UgPSB7a2V5d29yZDogXCJlbHNlXCIsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2ZpbmFsbHkgPSB7a2V5d29yZDogXCJmaW5hbGx5XCJ9LCBfZm9yID0ge2tleXdvcmQ6IFwiZm9yXCIsIGlzTG9vcDogdHJ1ZX0sIF9mdW5jdGlvbiA9IHtrZXl3b3JkOiBcImZ1bmN0aW9uXCJ9O1xuICB2YXIgX2lmID0ge2tleXdvcmQ6IFwiaWZcIn0sIF9yZXR1cm4gPSB7a2V5d29yZDogXCJyZXR1cm5cIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9zd2l0Y2ggPSB7a2V5d29yZDogXCJzd2l0Y2hcIn07XG4gIHZhciBfdGhyb3cgPSB7a2V5d29yZDogXCJ0aHJvd1wiLCBiZWZvcmVFeHByOiB0cnVlfSwgX3RyeSA9IHtrZXl3b3JkOiBcInRyeVwifSwgX3ZhciA9IHtrZXl3b3JkOiBcInZhclwifTtcbiAgdmFyIF9sZXQgPSB7a2V5d29yZDogXCJsZXRcIn0sIF9jb25zdCA9IHtrZXl3b3JkOiBcImNvbnN0XCJ9O1xuICB2YXIgX3doaWxlID0ge2tleXdvcmQ6IFwid2hpbGVcIiwgaXNMb29wOiB0cnVlfSwgX3dpdGggPSB7a2V5d29yZDogXCJ3aXRoXCJ9LCBfbmV3ID0ge2tleXdvcmQ6IFwibmV3XCIsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX3RoaXMgPSB7a2V5d29yZDogXCJ0aGlzXCJ9O1xuXG4gIC8vIFRoZSBrZXl3b3JkcyB0aGF0IGRlbm90ZSB2YWx1ZXMuXG5cbiAgdmFyIF9udWxsID0ge2tleXdvcmQ6IFwibnVsbFwiLCBhdG9tVmFsdWU6IG51bGx9LCBfdHJ1ZSA9IHtrZXl3b3JkOiBcInRydWVcIiwgYXRvbVZhbHVlOiB0cnVlfTtcbiAgdmFyIF9mYWxzZSA9IHtrZXl3b3JkOiBcImZhbHNlXCIsIGF0b21WYWx1ZTogZmFsc2V9O1xuXG4gIC8vIFNvbWUga2V5d29yZHMgYXJlIHRyZWF0ZWQgYXMgcmVndWxhciBvcGVyYXRvcnMuIGBpbmAgc29tZXRpbWVzXG4gIC8vICh3aGVuIHBhcnNpbmcgYGZvcmApIG5lZWRzIHRvIGJlIHRlc3RlZCBhZ2FpbnN0IHNwZWNpZmljYWxseSwgc29cbiAgLy8gd2UgYXNzaWduIGEgdmFyaWFibGUgbmFtZSB0byBpdCBmb3IgcXVpY2sgY29tcGFyaW5nLlxuXG4gIHZhciBfaW4gPSB7a2V5d29yZDogXCJpblwiLCBiaW5vcDogNywgYmVmb3JlRXhwcjogdHJ1ZX07XG5cbiAgLy8gTWFwIGtleXdvcmQgbmFtZXMgdG8gdG9rZW4gdHlwZXMuXG5cbiAgdmFyIGtleXdvcmRUeXBlcyA9IHtcImJyZWFrXCI6IF9icmVhaywgXCJjYXNlXCI6IF9jYXNlLCBcImNhdGNoXCI6IF9jYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICBcImNvbnRpbnVlXCI6IF9jb250aW51ZSwgXCJkZWJ1Z2dlclwiOiBfZGVidWdnZXIsIFwiZGVmYXVsdFwiOiBfZGVmYXVsdCxcbiAgICAgICAgICAgICAgICAgICAgICBcImRvXCI6IF9kbywgXCJlbHNlXCI6IF9lbHNlLCBcImZpbmFsbHlcIjogX2ZpbmFsbHksIFwiZm9yXCI6IF9mb3IsXG4gICAgICAgICAgICAgICAgICAgICAgXCJmdW5jdGlvblwiOiBfZnVuY3Rpb24sIFwiaWZcIjogX2lmLCBcInJldHVyblwiOiBfcmV0dXJuLCBcInN3aXRjaFwiOiBfc3dpdGNoLFxuICAgICAgICAgICAgICAgICAgICAgIFwidGhyb3dcIjogX3Rocm93LCBcInRyeVwiOiBfdHJ5LCBcInZhclwiOiBfdmFyLCBcImxldFwiOiBfbGV0LCBcImNvbnN0XCI6IF9jb25zdCxcbiAgICAgICAgICAgICAgICAgICAgICBcIndoaWxlXCI6IF93aGlsZSwgXCJ3aXRoXCI6IF93aXRoLFxuICAgICAgICAgICAgICAgICAgICAgIFwibnVsbFwiOiBfbnVsbCwgXCJ0cnVlXCI6IF90cnVlLCBcImZhbHNlXCI6IF9mYWxzZSwgXCJuZXdcIjogX25ldywgXCJpblwiOiBfaW4sXG4gICAgICAgICAgICAgICAgICAgICAgXCJpbnN0YW5jZW9mXCI6IHtrZXl3b3JkOiBcImluc3RhbmNlb2ZcIiwgYmlub3A6IDcsIGJlZm9yZUV4cHI6IHRydWV9LCBcInRoaXNcIjogX3RoaXMsXG4gICAgICAgICAgICAgICAgICAgICAgXCJ0eXBlb2ZcIjoge2tleXdvcmQ6IFwidHlwZW9mXCIsIHByZWZpeDogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJ2b2lkXCI6IHtrZXl3b3JkOiBcInZvaWRcIiwgcHJlZml4OiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfSxcbiAgICAgICAgICAgICAgICAgICAgICBcImRlbGV0ZVwiOiB7a2V5d29yZDogXCJkZWxldGVcIiwgcHJlZml4OiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfX07XG5cbiAgLy8gUHVuY3R1YXRpb24gdG9rZW4gdHlwZXMuIEFnYWluLCB0aGUgYHR5cGVgIHByb3BlcnR5IGlzIHB1cmVseSBmb3IgZGVidWdnaW5nLlxuXG4gIHZhciBfYnJhY2tldEwgPSB7dHlwZTogXCJbXCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfYnJhY2tldFIgPSB7dHlwZTogXCJdXCJ9LCBfYnJhY2VMID0ge3R5cGU6IFwie1wiLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9icmFjZVIgPSB7dHlwZTogXCJ9XCJ9LCBfcGFyZW5MID0ge3R5cGU6IFwiKFwiLCBiZWZvcmVFeHByOiB0cnVlfSwgX3BhcmVuUiA9IHt0eXBlOiBcIilcIn07XG4gIHZhciBfY29tbWEgPSB7dHlwZTogXCIsXCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfc2VtaSA9IHt0eXBlOiBcIjtcIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfY29sb24gPSB7dHlwZTogXCI6XCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfZG90ID0ge3R5cGU6IFwiLlwifSwgX2VsbGlwc2lzID0ge3R5cGU6IFwiLi4uXCJ9LCBfcXVlc3Rpb24gPSB7dHlwZTogXCI/XCIsIGJlZm9yZUV4cHI6IHRydWV9O1xuXG4gIC8vIE9wZXJhdG9ycy4gVGhlc2UgY2Fycnkgc2V2ZXJhbCBraW5kcyBvZiBwcm9wZXJ0aWVzIHRvIGhlbHAgdGhlXG4gIC8vIHBhcnNlciB1c2UgdGhlbSBwcm9wZXJseSAodGhlIHByZXNlbmNlIG9mIHRoZXNlIHByb3BlcnRpZXMgaXNcbiAgLy8gd2hhdCBjYXRlZ29yaXplcyB0aGVtIGFzIG9wZXJhdG9ycykuXG4gIC8vXG4gIC8vIGBiaW5vcGAsIHdoZW4gcHJlc2VudCwgc3BlY2lmaWVzIHRoYXQgdGhpcyBvcGVyYXRvciBpcyBhIGJpbmFyeVxuICAvLyBvcGVyYXRvciwgYW5kIHdpbGwgcmVmZXIgdG8gaXRzIHByZWNlZGVuY2UuXG4gIC8vXG4gIC8vIGBwcmVmaXhgIGFuZCBgcG9zdGZpeGAgbWFyayB0aGUgb3BlcmF0b3IgYXMgYSBwcmVmaXggb3IgcG9zdGZpeFxuICAvLyB1bmFyeSBvcGVyYXRvci4gYGlzVXBkYXRlYCBzcGVjaWZpZXMgdGhhdCB0aGUgbm9kZSBwcm9kdWNlZCBieVxuICAvLyB0aGUgb3BlcmF0b3Igc2hvdWxkIGJlIG9mIHR5cGUgVXBkYXRlRXhwcmVzc2lvbiByYXRoZXIgdGhhblxuICAvLyBzaW1wbHkgVW5hcnlFeHByZXNzaW9uIChgKytgIGFuZCBgLS1gKS5cbiAgLy9cbiAgLy8gYGlzQXNzaWduYCBtYXJrcyBhbGwgb2YgYD1gLCBgKz1gLCBgLT1gIGV0Y2V0ZXJhLCB3aGljaCBhY3QgYXNcbiAgLy8gYmluYXJ5IG9wZXJhdG9ycyB3aXRoIGEgdmVyeSBsb3cgcHJlY2VkZW5jZSwgdGhhdCBzaG91bGQgcmVzdWx0XG4gIC8vIGluIEFzc2lnbm1lbnRFeHByZXNzaW9uIG5vZGVzLlxuXG4gIHZhciBfc2xhc2ggPSB7Ymlub3A6IDEwLCBiZWZvcmVFeHByOiB0cnVlfSwgX2VxID0ge2lzQXNzaWduOiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9hc3NpZ24gPSB7aXNBc3NpZ246IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2luY0RlYyA9IHtwb3N0Zml4OiB0cnVlLCBwcmVmaXg6IHRydWUsIGlzVXBkYXRlOiB0cnVlfSwgX3ByZWZpeCA9IHtwcmVmaXg6IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2xvZ2ljYWxPUiA9IHtiaW5vcDogMSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfbG9naWNhbEFORCA9IHtiaW5vcDogMiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfYml0d2lzZU9SID0ge2Jpbm9wOiAzLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9iaXR3aXNlWE9SID0ge2Jpbm9wOiA0LCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9iaXR3aXNlQU5EID0ge2Jpbm9wOiA1LCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9lcXVhbGl0eSA9IHtiaW5vcDogNiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfcmVsYXRpb25hbCA9IHtiaW5vcDogNywgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfYml0U2hpZnQgPSB7Ymlub3A6IDgsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX3BsdXNNaW4gPSB7Ymlub3A6IDksIHByZWZpeDogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfbXVsdGlwbHlNb2R1bG8gPSB7Ymlub3A6IDEwLCBiZWZvcmVFeHByOiB0cnVlfTtcblxuICAvLyBQcm92aWRlIGFjY2VzcyB0byB0aGUgdG9rZW4gdHlwZXMgZm9yIGV4dGVybmFsIHVzZXJzIG9mIHRoZVxuICAvLyB0b2tlbml6ZXIuXG5cbiAgZXhwb3J0cy50b2tUeXBlcyA9IHticmFja2V0TDogX2JyYWNrZXRMLCBicmFja2V0UjogX2JyYWNrZXRSLCBicmFjZUw6IF9icmFjZUwsIGJyYWNlUjogX2JyYWNlUixcbiAgICAgICAgICAgICAgICAgICAgICBwYXJlbkw6IF9wYXJlbkwsIHBhcmVuUjogX3BhcmVuUiwgY29tbWE6IF9jb21tYSwgc2VtaTogX3NlbWksIGNvbG9uOiBfY29sb24sXG4gICAgICAgICAgICAgICAgICAgICAgZG90OiBfZG90LCBlbGxpcHNpczogX2VsbGlwc2lzLCBxdWVzdGlvbjogX3F1ZXN0aW9uLCBzbGFzaDogX3NsYXNoLCBlcTogX2VxLFxuICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IF9uYW1lLCBlb2Y6IF9lb2YsIG51bTogX251bSwgcmVnZXhwOiBfcmVnZXhwLCBzdHJpbmc6IF9zdHJpbmd9O1xuICBmb3IgKHZhciBrdyBpbiBrZXl3b3JkVHlwZXMpIGV4cG9ydHMudG9rVHlwZXNbXCJfXCIgKyBrd10gPSBrZXl3b3JkVHlwZXNba3ddO1xuXG4gIC8vIFRoaXMgaXMgYSB0cmljayB0YWtlbiBmcm9tIEVzcHJpbWEuIEl0IHR1cm5zIG91dCB0aGF0LCBvblxuICAvLyBub24tQ2hyb21lIGJyb3dzZXJzLCB0byBjaGVjayB3aGV0aGVyIGEgc3RyaW5nIGlzIGluIGEgc2V0LCBhXG4gIC8vIHByZWRpY2F0ZSBjb250YWluaW5nIGEgYmlnIHVnbHkgYHN3aXRjaGAgc3RhdGVtZW50IGlzIGZhc3RlciB0aGFuXG4gIC8vIGEgcmVndWxhciBleHByZXNzaW9uLCBhbmQgb24gQ2hyb21lIHRoZSB0d28gYXJlIGFib3V0IG9uIHBhci5cbiAgLy8gVGhpcyBmdW5jdGlvbiB1c2VzIGBldmFsYCAobm9uLWxleGljYWwpIHRvIHByb2R1Y2Ugc3VjaCBhXG4gIC8vIHByZWRpY2F0ZSBmcm9tIGEgc3BhY2Utc2VwYXJhdGVkIHN0cmluZyBvZiB3b3Jkcy5cbiAgLy9cbiAgLy8gSXQgc3RhcnRzIGJ5IHNvcnRpbmcgdGhlIHdvcmRzIGJ5IGxlbmd0aC5cblxuICBmdW5jdGlvbiBtYWtlUHJlZGljYXRlKHdvcmRzKSB7XG4gICAgd29yZHMgPSB3b3Jkcy5zcGxpdChcIiBcIik7XG4gICAgdmFyIGYgPSBcIlwiLCBjYXRzID0gW107XG4gICAgb3V0OiBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmRzLmxlbmd0aDsgKytpKSB7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNhdHMubGVuZ3RoOyArK2opXG4gICAgICAgIGlmIChjYXRzW2pdWzBdLmxlbmd0aCA9PSB3b3Jkc1tpXS5sZW5ndGgpIHtcbiAgICAgICAgICBjYXRzW2pdLnB1c2god29yZHNbaV0pO1xuICAgICAgICAgIGNvbnRpbnVlIG91dDtcbiAgICAgICAgfVxuICAgICAgY2F0cy5wdXNoKFt3b3Jkc1tpXV0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjb21wYXJlVG8oYXJyKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA9PSAxKSByZXR1cm4gZiArPSBcInJldHVybiBzdHIgPT09IFwiICsgSlNPTi5zdHJpbmdpZnkoYXJyWzBdKSArIFwiO1wiO1xuICAgICAgZiArPSBcInN3aXRjaChzdHIpe1wiO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIGYgKz0gXCJjYXNlIFwiICsgSlNPTi5zdHJpbmdpZnkoYXJyW2ldKSArIFwiOlwiO1xuICAgICAgZiArPSBcInJldHVybiB0cnVlfXJldHVybiBmYWxzZTtcIjtcbiAgICB9XG5cbiAgICAvLyBXaGVuIHRoZXJlIGFyZSBtb3JlIHRoYW4gdGhyZWUgbGVuZ3RoIGNhdGVnb3JpZXMsIGFuIG91dGVyXG4gICAgLy8gc3dpdGNoIGZpcnN0IGRpc3BhdGNoZXMgb24gdGhlIGxlbmd0aHMsIHRvIHNhdmUgb24gY29tcGFyaXNvbnMuXG5cbiAgICBpZiAoY2F0cy5sZW5ndGggPiAzKSB7XG4gICAgICBjYXRzLnNvcnQoZnVuY3Rpb24oYSwgYikge3JldHVybiBiLmxlbmd0aCAtIGEubGVuZ3RoO30pO1xuICAgICAgZiArPSBcInN3aXRjaChzdHIubGVuZ3RoKXtcIjtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2F0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgY2F0ID0gY2F0c1tpXTtcbiAgICAgICAgZiArPSBcImNhc2UgXCIgKyBjYXRbMF0ubGVuZ3RoICsgXCI6XCI7XG4gICAgICAgIGNvbXBhcmVUbyhjYXQpO1xuICAgICAgfVxuICAgICAgZiArPSBcIn1cIjtcblxuICAgIC8vIE90aGVyd2lzZSwgc2ltcGx5IGdlbmVyYXRlIGEgZmxhdCBgc3dpdGNoYCBzdGF0ZW1lbnQuXG5cbiAgICB9IGVsc2Uge1xuICAgICAgY29tcGFyZVRvKHdvcmRzKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcInN0clwiLCBmKTtcbiAgfVxuXG4gIC8vIFRoZSBFQ01BU2NyaXB0IDMgcmVzZXJ2ZWQgd29yZCBsaXN0LlxuXG4gIHZhciBpc1Jlc2VydmVkV29yZDMgPSBtYWtlUHJlZGljYXRlKFwiYWJzdHJhY3QgYm9vbGVhbiBieXRlIGNoYXIgY2xhc3MgZG91YmxlIGVudW0gZXhwb3J0IGV4dGVuZHMgZmluYWwgZmxvYXQgZ290byBpbXBsZW1lbnRzIGltcG9ydCBpbnQgaW50ZXJmYWNlIGxvbmcgbmF0aXZlIHBhY2thZ2UgcHJpdmF0ZSBwcm90ZWN0ZWQgcHVibGljIHNob3J0IHN0YXRpYyBzdXBlciBzeW5jaHJvbml6ZWQgdGhyb3dzIHRyYW5zaWVudCB2b2xhdGlsZVwiKTtcblxuICAvLyBFQ01BU2NyaXB0IDUgcmVzZXJ2ZWQgd29yZHMuXG5cbiAgdmFyIGlzUmVzZXJ2ZWRXb3JkNSA9IG1ha2VQcmVkaWNhdGUoXCJjbGFzcyBlbnVtIGV4dGVuZHMgc3VwZXIgY29uc3QgZXhwb3J0IGltcG9ydFwiKTtcblxuICAvLyBUaGUgYWRkaXRpb25hbCByZXNlcnZlZCB3b3JkcyBpbiBzdHJpY3QgbW9kZS5cblxuICB2YXIgaXNTdHJpY3RSZXNlcnZlZFdvcmQgPSBtYWtlUHJlZGljYXRlKFwiaW1wbGVtZW50cyBpbnRlcmZhY2UgbGV0IHBhY2thZ2UgcHJpdmF0ZSBwcm90ZWN0ZWQgcHVibGljIHN0YXRpYyB5aWVsZFwiKTtcblxuICAvLyBUaGUgZm9yYmlkZGVuIHZhcmlhYmxlIG5hbWVzIGluIHN0cmljdCBtb2RlLlxuXG4gIHZhciBpc1N0cmljdEJhZElkV29yZCA9IG1ha2VQcmVkaWNhdGUoXCJldmFsIGFyZ3VtZW50c1wiKTtcblxuICAvLyBBbmQgdGhlIGtleXdvcmRzLlxuXG4gIHZhciBlY21hNUFuZExlc3NLZXl3b3JkcyA9IFwiYnJlYWsgY2FzZSBjYXRjaCBjb250aW51ZSBkZWJ1Z2dlciBkZWZhdWx0IGRvIGVsc2UgZmluYWxseSBmb3IgZnVuY3Rpb24gaWYgcmV0dXJuIHN3aXRjaCB0aHJvdyB0cnkgdmFyIHdoaWxlIHdpdGggbnVsbCB0cnVlIGZhbHNlIGluc3RhbmNlb2YgdHlwZW9mIHZvaWQgZGVsZXRlIG5ldyBpbiB0aGlzXCI7XG5cbiAgdmFyIGlzRWNtYTVBbmRMZXNzS2V5d29yZCA9IG1ha2VQcmVkaWNhdGUoZWNtYTVBbmRMZXNzS2V5d29yZHMpO1xuXG4gIHZhciBpc0VjbWE2S2V5d29yZCA9IG1ha2VQcmVkaWNhdGUoZWNtYTVBbmRMZXNzS2V5d29yZHMgKyBcIiBsZXQgY29uc3RcIik7XG5cbiAgdmFyIGlzS2V5d29yZCA9IGlzRWNtYTVBbmRMZXNzS2V5d29yZDtcblxuICAvLyAjIyBDaGFyYWN0ZXIgY2F0ZWdvcmllc1xuXG4gIC8vIEJpZyB1Z2x5IHJlZ3VsYXIgZXhwcmVzc2lvbnMgdGhhdCBtYXRjaCBjaGFyYWN0ZXJzIGluIHRoZVxuICAvLyB3aGl0ZXNwYWNlLCBpZGVudGlmaWVyLCBhbmQgaWRlbnRpZmllci1zdGFydCBjYXRlZ29yaWVzLiBUaGVzZVxuICAvLyBhcmUgb25seSBhcHBsaWVkIHdoZW4gYSBjaGFyYWN0ZXIgaXMgZm91bmQgdG8gYWN0dWFsbHkgaGF2ZSBhXG4gIC8vIGNvZGUgcG9pbnQgYWJvdmUgMTI4LlxuXG4gIHZhciBub25BU0NJSXdoaXRlc3BhY2UgPSAvW1xcdTE2ODBcXHUxODBlXFx1MjAwMC1cXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1ZmVmZl0vO1xuICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyA9IFwiXFx4YWFcXHhiNVxceGJhXFx4YzAtXFx4ZDZcXHhkOC1cXHhmNlxceGY4LVxcdTAyYzFcXHUwMmM2LVxcdTAyZDFcXHUwMmUwLVxcdTAyZTRcXHUwMmVjXFx1MDJlZVxcdTAzNzAtXFx1MDM3NFxcdTAzNzZcXHUwMzc3XFx1MDM3YS1cXHUwMzdkXFx1MDM4NlxcdTAzODgtXFx1MDM4YVxcdTAzOGNcXHUwMzhlLVxcdTAzYTFcXHUwM2EzLVxcdTAzZjVcXHUwM2Y3LVxcdTA0ODFcXHUwNDhhLVxcdTA1MjdcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDVkMC1cXHUwNWVhXFx1MDVmMC1cXHUwNWYyXFx1MDYyMC1cXHUwNjRhXFx1MDY2ZVxcdTA2NmZcXHUwNjcxLVxcdTA2ZDNcXHUwNmQ1XFx1MDZlNVxcdTA2ZTZcXHUwNmVlXFx1MDZlZlxcdTA2ZmEtXFx1MDZmY1xcdTA2ZmZcXHUwNzEwXFx1MDcxMi1cXHUwNzJmXFx1MDc0ZC1cXHUwN2E1XFx1MDdiMVxcdTA3Y2EtXFx1MDdlYVxcdTA3ZjRcXHUwN2Y1XFx1MDdmYVxcdTA4MDAtXFx1MDgxNVxcdTA4MWFcXHUwODI0XFx1MDgyOFxcdTA4NDAtXFx1MDg1OFxcdTA4YTBcXHUwOGEyLVxcdTA4YWNcXHUwOTA0LVxcdTA5MzlcXHUwOTNkXFx1MDk1MFxcdTA5NTgtXFx1MDk2MVxcdTA5NzEtXFx1MDk3N1xcdTA5NzktXFx1MDk3ZlxcdTA5ODUtXFx1MDk4Y1xcdTA5OGZcXHUwOTkwXFx1MDk5My1cXHUwOWE4XFx1MDlhYS1cXHUwOWIwXFx1MDliMlxcdTA5YjYtXFx1MDliOVxcdTA5YmRcXHUwOWNlXFx1MDlkY1xcdTA5ZGRcXHUwOWRmLVxcdTA5ZTFcXHUwOWYwXFx1MDlmMVxcdTBhMDUtXFx1MGEwYVxcdTBhMGZcXHUwYTEwXFx1MGExMy1cXHUwYTI4XFx1MGEyYS1cXHUwYTMwXFx1MGEzMlxcdTBhMzNcXHUwYTM1XFx1MGEzNlxcdTBhMzhcXHUwYTM5XFx1MGE1OS1cXHUwYTVjXFx1MGE1ZVxcdTBhNzItXFx1MGE3NFxcdTBhODUtXFx1MGE4ZFxcdTBhOGYtXFx1MGE5MVxcdTBhOTMtXFx1MGFhOFxcdTBhYWEtXFx1MGFiMFxcdTBhYjJcXHUwYWIzXFx1MGFiNS1cXHUwYWI5XFx1MGFiZFxcdTBhZDBcXHUwYWUwXFx1MGFlMVxcdTBiMDUtXFx1MGIwY1xcdTBiMGZcXHUwYjEwXFx1MGIxMy1cXHUwYjI4XFx1MGIyYS1cXHUwYjMwXFx1MGIzMlxcdTBiMzNcXHUwYjM1LVxcdTBiMzlcXHUwYjNkXFx1MGI1Y1xcdTBiNWRcXHUwYjVmLVxcdTBiNjFcXHUwYjcxXFx1MGI4M1xcdTBiODUtXFx1MGI4YVxcdTBiOGUtXFx1MGI5MFxcdTBiOTItXFx1MGI5NVxcdTBiOTlcXHUwYjlhXFx1MGI5Y1xcdTBiOWVcXHUwYjlmXFx1MGJhM1xcdTBiYTRcXHUwYmE4LVxcdTBiYWFcXHUwYmFlLVxcdTBiYjlcXHUwYmQwXFx1MGMwNS1cXHUwYzBjXFx1MGMwZS1cXHUwYzEwXFx1MGMxMi1cXHUwYzI4XFx1MGMyYS1cXHUwYzMzXFx1MGMzNS1cXHUwYzM5XFx1MGMzZFxcdTBjNThcXHUwYzU5XFx1MGM2MFxcdTBjNjFcXHUwYzg1LVxcdTBjOGNcXHUwYzhlLVxcdTBjOTBcXHUwYzkyLVxcdTBjYThcXHUwY2FhLVxcdTBjYjNcXHUwY2I1LVxcdTBjYjlcXHUwY2JkXFx1MGNkZVxcdTBjZTBcXHUwY2UxXFx1MGNmMVxcdTBjZjJcXHUwZDA1LVxcdTBkMGNcXHUwZDBlLVxcdTBkMTBcXHUwZDEyLVxcdTBkM2FcXHUwZDNkXFx1MGQ0ZVxcdTBkNjBcXHUwZDYxXFx1MGQ3YS1cXHUwZDdmXFx1MGQ4NS1cXHUwZDk2XFx1MGQ5YS1cXHUwZGIxXFx1MGRiMy1cXHUwZGJiXFx1MGRiZFxcdTBkYzAtXFx1MGRjNlxcdTBlMDEtXFx1MGUzMFxcdTBlMzJcXHUwZTMzXFx1MGU0MC1cXHUwZTQ2XFx1MGU4MVxcdTBlODJcXHUwZTg0XFx1MGU4N1xcdTBlODhcXHUwZThhXFx1MGU4ZFxcdTBlOTQtXFx1MGU5N1xcdTBlOTktXFx1MGU5ZlxcdTBlYTEtXFx1MGVhM1xcdTBlYTVcXHUwZWE3XFx1MGVhYVxcdTBlYWJcXHUwZWFkLVxcdTBlYjBcXHUwZWIyXFx1MGViM1xcdTBlYmRcXHUwZWMwLVxcdTBlYzRcXHUwZWM2XFx1MGVkYy1cXHUwZWRmXFx1MGYwMFxcdTBmNDAtXFx1MGY0N1xcdTBmNDktXFx1MGY2Y1xcdTBmODgtXFx1MGY4Y1xcdTEwMDAtXFx1MTAyYVxcdTEwM2ZcXHUxMDUwLVxcdTEwNTVcXHUxMDVhLVxcdTEwNWRcXHUxMDYxXFx1MTA2NVxcdTEwNjZcXHUxMDZlLVxcdTEwNzBcXHUxMDc1LVxcdTEwODFcXHUxMDhlXFx1MTBhMC1cXHUxMGM1XFx1MTBjN1xcdTEwY2RcXHUxMGQwLVxcdTEwZmFcXHUxMGZjLVxcdTEyNDhcXHUxMjRhLVxcdTEyNGRcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1YS1cXHUxMjVkXFx1MTI2MC1cXHUxMjg4XFx1MTI4YS1cXHUxMjhkXFx1MTI5MC1cXHUxMmIwXFx1MTJiMi1cXHUxMmI1XFx1MTJiOC1cXHUxMmJlXFx1MTJjMFxcdTEyYzItXFx1MTJjNVxcdTEyYzgtXFx1MTJkNlxcdTEyZDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1YVxcdTEzODAtXFx1MTM4ZlxcdTEzYTAtXFx1MTNmNFxcdTE0MDEtXFx1MTY2Y1xcdTE2NmYtXFx1MTY3ZlxcdTE2ODEtXFx1MTY5YVxcdTE2YTAtXFx1MTZlYVxcdTE2ZWUtXFx1MTZmMFxcdTE3MDAtXFx1MTcwY1xcdTE3MGUtXFx1MTcxMVxcdTE3MjAtXFx1MTczMVxcdTE3NDAtXFx1MTc1MVxcdTE3NjAtXFx1MTc2Y1xcdTE3NmUtXFx1MTc3MFxcdTE3ODAtXFx1MTdiM1xcdTE3ZDdcXHUxN2RjXFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOGE4XFx1MThhYVxcdTE4YjAtXFx1MThmNVxcdTE5MDAtXFx1MTkxY1xcdTE5NTAtXFx1MTk2ZFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlhYlxcdTE5YzEtXFx1MTljN1xcdTFhMDAtXFx1MWExNlxcdTFhMjAtXFx1MWE1NFxcdTFhYTdcXHUxYjA1LVxcdTFiMzNcXHUxYjQ1LVxcdTFiNGJcXHUxYjgzLVxcdTFiYTBcXHUxYmFlXFx1MWJhZlxcdTFiYmEtXFx1MWJlNVxcdTFjMDAtXFx1MWMyM1xcdTFjNGQtXFx1MWM0ZlxcdTFjNWEtXFx1MWM3ZFxcdTFjZTktXFx1MWNlY1xcdTFjZWUtXFx1MWNmMVxcdTFjZjVcXHUxY2Y2XFx1MWQwMC1cXHUxZGJmXFx1MWUwMC1cXHUxZjE1XFx1MWYxOC1cXHUxZjFkXFx1MWYyMC1cXHUxZjQ1XFx1MWY0OC1cXHUxZjRkXFx1MWY1MC1cXHUxZjU3XFx1MWY1OVxcdTFmNWJcXHUxZjVkXFx1MWY1Zi1cXHUxZjdkXFx1MWY4MC1cXHUxZmI0XFx1MWZiNi1cXHUxZmJjXFx1MWZiZVxcdTFmYzItXFx1MWZjNFxcdTFmYzYtXFx1MWZjY1xcdTFmZDAtXFx1MWZkM1xcdTFmZDYtXFx1MWZkYlxcdTFmZTAtXFx1MWZlY1xcdTFmZjItXFx1MWZmNFxcdTFmZjYtXFx1MWZmY1xcdTIwNzFcXHUyMDdmXFx1MjA5MC1cXHUyMDljXFx1MjEwMlxcdTIxMDdcXHUyMTBhLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFkXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyYS1cXHUyMTJkXFx1MjEyZi1cXHUyMTM5XFx1MjEzYy1cXHUyMTNmXFx1MjE0NS1cXHUyMTQ5XFx1MjE0ZVxcdTIxNjAtXFx1MjE4OFxcdTJjMDAtXFx1MmMyZVxcdTJjMzAtXFx1MmM1ZVxcdTJjNjAtXFx1MmNlNFxcdTJjZWItXFx1MmNlZVxcdTJjZjJcXHUyY2YzXFx1MmQwMC1cXHUyZDI1XFx1MmQyN1xcdTJkMmRcXHUyZDMwLVxcdTJkNjdcXHUyZDZmXFx1MmQ4MC1cXHUyZDk2XFx1MmRhMC1cXHUyZGE2XFx1MmRhOC1cXHUyZGFlXFx1MmRiMC1cXHUyZGI2XFx1MmRiOC1cXHUyZGJlXFx1MmRjMC1cXHUyZGM2XFx1MmRjOC1cXHUyZGNlXFx1MmRkMC1cXHUyZGQ2XFx1MmRkOC1cXHUyZGRlXFx1MmUyZlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyOVxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzY1xcdTMwNDEtXFx1MzA5NlxcdTMwOWQtXFx1MzA5ZlxcdTMwYTEtXFx1MzBmYVxcdTMwZmMtXFx1MzBmZlxcdTMxMDUtXFx1MzEyZFxcdTMxMzEtXFx1MzE4ZVxcdTMxYTAtXFx1MzFiYVxcdTMxZjAtXFx1MzFmZlxcdTM0MDAtXFx1NGRiNVxcdTRlMDAtXFx1OWZjY1xcdWEwMDAtXFx1YTQ4Y1xcdWE0ZDAtXFx1YTRmZFxcdWE1MDAtXFx1YTYwY1xcdWE2MTAtXFx1YTYxZlxcdWE2MmFcXHVhNjJiXFx1YTY0MC1cXHVhNjZlXFx1YTY3Zi1cXHVhNjk3XFx1YTZhMC1cXHVhNmVmXFx1YTcxNy1cXHVhNzFmXFx1YTcyMi1cXHVhNzg4XFx1YTc4Yi1cXHVhNzhlXFx1YTc5MC1cXHVhNzkzXFx1YTdhMC1cXHVhN2FhXFx1YTdmOC1cXHVhODAxXFx1YTgwMy1cXHVhODA1XFx1YTgwNy1cXHVhODBhXFx1YTgwYy1cXHVhODIyXFx1YTg0MC1cXHVhODczXFx1YTg4Mi1cXHVhOGIzXFx1YThmMi1cXHVhOGY3XFx1YThmYlxcdWE5MGEtXFx1YTkyNVxcdWE5MzAtXFx1YTk0NlxcdWE5NjAtXFx1YTk3Y1xcdWE5ODQtXFx1YTliMlxcdWE5Y2ZcXHVhYTAwLVxcdWFhMjhcXHVhYTQwLVxcdWFhNDJcXHVhYTQ0LVxcdWFhNGJcXHVhYTYwLVxcdWFhNzZcXHVhYTdhXFx1YWE4MC1cXHVhYWFmXFx1YWFiMVxcdWFhYjVcXHVhYWI2XFx1YWFiOS1cXHVhYWJkXFx1YWFjMFxcdWFhYzJcXHVhYWRiLVxcdWFhZGRcXHVhYWUwLVxcdWFhZWFcXHVhYWYyLVxcdWFhZjRcXHVhYjAxLVxcdWFiMDZcXHVhYjA5LVxcdWFiMGVcXHVhYjExLVxcdWFiMTZcXHVhYjIwLVxcdWFiMjZcXHVhYjI4LVxcdWFiMmVcXHVhYmMwLVxcdWFiZTJcXHVhYzAwLVxcdWQ3YTNcXHVkN2IwLVxcdWQ3YzZcXHVkN2NiLVxcdWQ3ZmJcXHVmOTAwLVxcdWZhNmRcXHVmYTcwLVxcdWZhZDlcXHVmYjAwLVxcdWZiMDZcXHVmYjEzLVxcdWZiMTdcXHVmYjFkXFx1ZmIxZi1cXHVmYjI4XFx1ZmIyYS1cXHVmYjM2XFx1ZmIzOC1cXHVmYjNjXFx1ZmIzZVxcdWZiNDBcXHVmYjQxXFx1ZmI0M1xcdWZiNDRcXHVmYjQ2LVxcdWZiYjFcXHVmYmQzLVxcdWZkM2RcXHVmZDUwLVxcdWZkOGZcXHVmZDkyLVxcdWZkYzdcXHVmZGYwLVxcdWZkZmJcXHVmZTcwLVxcdWZlNzRcXHVmZTc2LVxcdWZlZmNcXHVmZjIxLVxcdWZmM2FcXHVmZjQxLVxcdWZmNWFcXHVmZjY2LVxcdWZmYmVcXHVmZmMyLVxcdWZmYzdcXHVmZmNhLVxcdWZmY2ZcXHVmZmQyLVxcdWZmZDdcXHVmZmRhLVxcdWZmZGNcIjtcbiAgdmFyIG5vbkFTQ0lJaWRlbnRpZmllckNoYXJzID0gXCJcXHUwMzAwLVxcdTAzNmZcXHUwNDgzLVxcdTA0ODdcXHUwNTkxLVxcdTA1YmRcXHUwNWJmXFx1MDVjMVxcdTA1YzJcXHUwNWM0XFx1MDVjNVxcdTA1YzdcXHUwNjEwLVxcdTA2MWFcXHUwNjIwLVxcdTA2NDlcXHUwNjcyLVxcdTA2ZDNcXHUwNmU3LVxcdTA2ZThcXHUwNmZiLVxcdTA2ZmNcXHUwNzMwLVxcdTA3NGFcXHUwODAwLVxcdTA4MTRcXHUwODFiLVxcdTA4MjNcXHUwODI1LVxcdTA4MjdcXHUwODI5LVxcdTA4MmRcXHUwODQwLVxcdTA4NTdcXHUwOGU0LVxcdTA4ZmVcXHUwOTAwLVxcdTA5MDNcXHUwOTNhLVxcdTA5M2NcXHUwOTNlLVxcdTA5NGZcXHUwOTUxLVxcdTA5NTdcXHUwOTYyLVxcdTA5NjNcXHUwOTY2LVxcdTA5NmZcXHUwOTgxLVxcdTA5ODNcXHUwOWJjXFx1MDliZS1cXHUwOWM0XFx1MDljN1xcdTA5YzhcXHUwOWQ3XFx1MDlkZi1cXHUwOWUwXFx1MGEwMS1cXHUwYTAzXFx1MGEzY1xcdTBhM2UtXFx1MGE0MlxcdTBhNDdcXHUwYTQ4XFx1MGE0Yi1cXHUwYTRkXFx1MGE1MVxcdTBhNjYtXFx1MGE3MVxcdTBhNzVcXHUwYTgxLVxcdTBhODNcXHUwYWJjXFx1MGFiZS1cXHUwYWM1XFx1MGFjNy1cXHUwYWM5XFx1MGFjYi1cXHUwYWNkXFx1MGFlMi1cXHUwYWUzXFx1MGFlNi1cXHUwYWVmXFx1MGIwMS1cXHUwYjAzXFx1MGIzY1xcdTBiM2UtXFx1MGI0NFxcdTBiNDdcXHUwYjQ4XFx1MGI0Yi1cXHUwYjRkXFx1MGI1NlxcdTBiNTdcXHUwYjVmLVxcdTBiNjBcXHUwYjY2LVxcdTBiNmZcXHUwYjgyXFx1MGJiZS1cXHUwYmMyXFx1MGJjNi1cXHUwYmM4XFx1MGJjYS1cXHUwYmNkXFx1MGJkN1xcdTBiZTYtXFx1MGJlZlxcdTBjMDEtXFx1MGMwM1xcdTBjNDYtXFx1MGM0OFxcdTBjNGEtXFx1MGM0ZFxcdTBjNTVcXHUwYzU2XFx1MGM2Mi1cXHUwYzYzXFx1MGM2Ni1cXHUwYzZmXFx1MGM4MlxcdTBjODNcXHUwY2JjXFx1MGNiZS1cXHUwY2M0XFx1MGNjNi1cXHUwY2M4XFx1MGNjYS1cXHUwY2NkXFx1MGNkNVxcdTBjZDZcXHUwY2UyLVxcdTBjZTNcXHUwY2U2LVxcdTBjZWZcXHUwZDAyXFx1MGQwM1xcdTBkNDYtXFx1MGQ0OFxcdTBkNTdcXHUwZDYyLVxcdTBkNjNcXHUwZDY2LVxcdTBkNmZcXHUwZDgyXFx1MGQ4M1xcdTBkY2FcXHUwZGNmLVxcdTBkZDRcXHUwZGQ2XFx1MGRkOC1cXHUwZGRmXFx1MGRmMlxcdTBkZjNcXHUwZTM0LVxcdTBlM2FcXHUwZTQwLVxcdTBlNDVcXHUwZTUwLVxcdTBlNTlcXHUwZWI0LVxcdTBlYjlcXHUwZWM4LVxcdTBlY2RcXHUwZWQwLVxcdTBlZDlcXHUwZjE4XFx1MGYxOVxcdTBmMjAtXFx1MGYyOVxcdTBmMzVcXHUwZjM3XFx1MGYzOVxcdTBmNDEtXFx1MGY0N1xcdTBmNzEtXFx1MGY4NFxcdTBmODYtXFx1MGY4N1xcdTBmOGQtXFx1MGY5N1xcdTBmOTktXFx1MGZiY1xcdTBmYzZcXHUxMDAwLVxcdTEwMjlcXHUxMDQwLVxcdTEwNDlcXHUxMDY3LVxcdTEwNmRcXHUxMDcxLVxcdTEwNzRcXHUxMDgyLVxcdTEwOGRcXHUxMDhmLVxcdTEwOWRcXHUxMzVkLVxcdTEzNWZcXHUxNzBlLVxcdTE3MTBcXHUxNzIwLVxcdTE3MzBcXHUxNzQwLVxcdTE3NTBcXHUxNzcyXFx1MTc3M1xcdTE3ODAtXFx1MTdiMlxcdTE3ZGRcXHUxN2UwLVxcdTE3ZTlcXHUxODBiLVxcdTE4MGRcXHUxODEwLVxcdTE4MTlcXHUxOTIwLVxcdTE5MmJcXHUxOTMwLVxcdTE5M2JcXHUxOTUxLVxcdTE5NmRcXHUxOWIwLVxcdTE5YzBcXHUxOWM4LVxcdTE5YzlcXHUxOWQwLVxcdTE5ZDlcXHUxYTAwLVxcdTFhMTVcXHUxYTIwLVxcdTFhNTNcXHUxYTYwLVxcdTFhN2NcXHUxYTdmLVxcdTFhODlcXHUxYTkwLVxcdTFhOTlcXHUxYjQ2LVxcdTFiNGJcXHUxYjUwLVxcdTFiNTlcXHUxYjZiLVxcdTFiNzNcXHUxYmIwLVxcdTFiYjlcXHUxYmU2LVxcdTFiZjNcXHUxYzAwLVxcdTFjMjJcXHUxYzQwLVxcdTFjNDlcXHUxYzViLVxcdTFjN2RcXHUxY2QwLVxcdTFjZDJcXHUxZDAwLVxcdTFkYmVcXHUxZTAxLVxcdTFmMTVcXHUyMDBjXFx1MjAwZFxcdTIwM2ZcXHUyMDQwXFx1MjA1NFxcdTIwZDAtXFx1MjBkY1xcdTIwZTFcXHUyMGU1LVxcdTIwZjBcXHUyZDgxLVxcdTJkOTZcXHUyZGUwLVxcdTJkZmZcXHUzMDIxLVxcdTMwMjhcXHUzMDk5XFx1MzA5YVxcdWE2NDAtXFx1YTY2ZFxcdWE2NzQtXFx1YTY3ZFxcdWE2OWZcXHVhNmYwLVxcdWE2ZjFcXHVhN2Y4LVxcdWE4MDBcXHVhODA2XFx1YTgwYlxcdWE4MjMtXFx1YTgyN1xcdWE4ODAtXFx1YTg4MVxcdWE4YjQtXFx1YThjNFxcdWE4ZDAtXFx1YThkOVxcdWE4ZjMtXFx1YThmN1xcdWE5MDAtXFx1YTkwOVxcdWE5MjYtXFx1YTkyZFxcdWE5MzAtXFx1YTk0NVxcdWE5ODAtXFx1YTk4M1xcdWE5YjMtXFx1YTljMFxcdWFhMDAtXFx1YWEyN1xcdWFhNDAtXFx1YWE0MVxcdWFhNGMtXFx1YWE0ZFxcdWFhNTAtXFx1YWE1OVxcdWFhN2JcXHVhYWUwLVxcdWFhZTlcXHVhYWYyLVxcdWFhZjNcXHVhYmMwLVxcdWFiZTFcXHVhYmVjXFx1YWJlZFxcdWFiZjAtXFx1YWJmOVxcdWZiMjAtXFx1ZmIyOFxcdWZlMDAtXFx1ZmUwZlxcdWZlMjAtXFx1ZmUyNlxcdWZlMzNcXHVmZTM0XFx1ZmU0ZC1cXHVmZTRmXFx1ZmYxMC1cXHVmZjE5XFx1ZmYzZlwiO1xuICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnQgPSBuZXcgUmVnRXhwKFwiW1wiICsgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyArIFwiXVwiKTtcbiAgdmFyIG5vbkFTQ0lJaWRlbnRpZmllciA9IG5ldyBSZWdFeHAoXCJbXCIgKyBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzICsgbm9uQVNDSUlpZGVudGlmaWVyQ2hhcnMgKyBcIl1cIik7XG5cbiAgLy8gV2hldGhlciBhIHNpbmdsZSBjaGFyYWN0ZXIgZGVub3RlcyBhIG5ld2xpbmUuXG5cbiAgdmFyIG5ld2xpbmUgPSAvW1xcblxcclxcdTIwMjhcXHUyMDI5XS87XG5cbiAgLy8gTWF0Y2hlcyBhIHdob2xlIGxpbmUgYnJlYWsgKHdoZXJlIENSTEYgaXMgY29uc2lkZXJlZCBhIHNpbmdsZVxuICAvLyBsaW5lIGJyZWFrKS4gVXNlZCB0byBjb3VudCBsaW5lcy5cblxuICB2YXIgbGluZUJyZWFrID0gL1xcclxcbnxbXFxuXFxyXFx1MjAyOFxcdTIwMjldL2c7XG5cbiAgLy8gVGVzdCB3aGV0aGVyIGEgZ2l2ZW4gY2hhcmFjdGVyIGNvZGUgc3RhcnRzIGFuIGlkZW50aWZpZXIuXG5cbiAgdmFyIGlzSWRlbnRpZmllclN0YXJ0ID0gZXhwb3J0cy5pc0lkZW50aWZpZXJTdGFydCA9IGZ1bmN0aW9uKGNvZGUpIHtcbiAgICBpZiAoY29kZSA8IDY1KSByZXR1cm4gY29kZSA9PT0gMzY7XG4gICAgaWYgKGNvZGUgPCA5MSkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGNvZGUgPCA5NykgcmV0dXJuIGNvZGUgPT09IDk1O1xuICAgIGlmIChjb2RlIDwgMTIzKXJldHVybiB0cnVlO1xuICAgIHJldHVybiBjb2RlID49IDB4YWEgJiYgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnQudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpKTtcbiAgfTtcblxuICAvLyBUZXN0IHdoZXRoZXIgYSBnaXZlbiBjaGFyYWN0ZXIgaXMgcGFydCBvZiBhbiBpZGVudGlmaWVyLlxuXG4gIHZhciBpc0lkZW50aWZpZXJDaGFyID0gZXhwb3J0cy5pc0lkZW50aWZpZXJDaGFyID0gZnVuY3Rpb24oY29kZSkge1xuICAgIGlmIChjb2RlIDwgNDgpIHJldHVybiBjb2RlID09PSAzNjtcbiAgICBpZiAoY29kZSA8IDU4KSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoY29kZSA8IDY1KSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGNvZGUgPCA5MSkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGNvZGUgPCA5NykgcmV0dXJuIGNvZGUgPT09IDk1O1xuICAgIGlmIChjb2RlIDwgMTIzKXJldHVybiB0cnVlO1xuICAgIHJldHVybiBjb2RlID49IDB4YWEgJiYgbm9uQVNDSUlpZGVudGlmaWVyLnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSk7XG4gIH07XG5cbiAgLy8gIyMgVG9rZW5pemVyXG5cbiAgLy8gVGhlc2UgYXJlIHVzZWQgd2hlbiBgb3B0aW9ucy5sb2NhdGlvbnNgIGlzIG9uLCBmb3IgdGhlXG4gIC8vIGB0b2tTdGFydExvY2AgYW5kIGB0b2tFbmRMb2NgIHByb3BlcnRpZXMuXG5cbiAgZnVuY3Rpb24gUG9zaXRpb24oKSB7XG4gICAgdGhpcy5saW5lID0gdG9rQ3VyTGluZTtcbiAgICB0aGlzLmNvbHVtbiA9IHRva1BvcyAtIHRva0xpbmVTdGFydDtcbiAgfVxuXG4gIC8vIFJlc2V0IHRoZSB0b2tlbiBzdGF0ZS4gVXNlZCBhdCB0aGUgc3RhcnQgb2YgYSBwYXJzZS5cblxuICBmdW5jdGlvbiBpbml0VG9rZW5TdGF0ZSgpIHtcbiAgICB0b2tDdXJMaW5lID0gMTtcbiAgICB0b2tQb3MgPSB0b2tMaW5lU3RhcnQgPSAwO1xuICAgIHRva1JlZ2V4cEFsbG93ZWQgPSB0cnVlO1xuICAgIHNraXBTcGFjZSgpO1xuICB9XG5cbiAgLy8gQ2FsbGVkIGF0IHRoZSBlbmQgb2YgZXZlcnkgdG9rZW4uIFNldHMgYHRva0VuZGAsIGB0b2tWYWxgLCBhbmRcbiAgLy8gYHRva1JlZ2V4cEFsbG93ZWRgLCBhbmQgc2tpcHMgdGhlIHNwYWNlIGFmdGVyIHRoZSB0b2tlbiwgc28gdGhhdFxuICAvLyB0aGUgbmV4dCBvbmUncyBgdG9rU3RhcnRgIHdpbGwgcG9pbnQgYXQgdGhlIHJpZ2h0IHBvc2l0aW9uLlxuXG4gIGZ1bmN0aW9uIGZpbmlzaFRva2VuKHR5cGUsIHZhbCkge1xuICAgIHRva0VuZCA9IHRva1BvcztcbiAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnMpIHRva0VuZExvYyA9IG5ldyBQb3NpdGlvbjtcbiAgICB0b2tUeXBlID0gdHlwZTtcbiAgICBza2lwU3BhY2UoKTtcbiAgICB0b2tWYWwgPSB2YWw7XG4gICAgdG9rUmVnZXhwQWxsb3dlZCA9IHR5cGUuYmVmb3JlRXhwcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNraXBCbG9ja0NvbW1lbnQoKSB7XG4gICAgdmFyIHN0YXJ0TG9jID0gb3B0aW9ucy5vbkNvbW1lbnQgJiYgb3B0aW9ucy5sb2NhdGlvbnMgJiYgbmV3IFBvc2l0aW9uO1xuICAgIHZhciBzdGFydCA9IHRva1BvcywgZW5kID0gaW5wdXQuaW5kZXhPZihcIiovXCIsIHRva1BvcyArPSAyKTtcbiAgICBpZiAoZW5kID09PSAtMSkgcmFpc2UodG9rUG9zIC0gMiwgXCJVbnRlcm1pbmF0ZWQgY29tbWVudFwiKTtcbiAgICB0b2tQb3MgPSBlbmQgKyAyO1xuICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgbGluZUJyZWFrLmxhc3RJbmRleCA9IHN0YXJ0O1xuICAgICAgdmFyIG1hdGNoO1xuICAgICAgd2hpbGUgKChtYXRjaCA9IGxpbmVCcmVhay5leGVjKGlucHV0KSkgJiYgbWF0Y2guaW5kZXggPCB0b2tQb3MpIHtcbiAgICAgICAgKyt0b2tDdXJMaW5lO1xuICAgICAgICB0b2tMaW5lU3RhcnQgPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9wdGlvbnMub25Db21tZW50KVxuICAgICAgb3B0aW9ucy5vbkNvbW1lbnQodHJ1ZSwgaW5wdXQuc2xpY2Uoc3RhcnQgKyAyLCBlbmQpLCBzdGFydCwgdG9rUG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRMb2MsIG9wdGlvbnMubG9jYXRpb25zICYmIG5ldyBQb3NpdGlvbik7XG4gIH1cblxuICBmdW5jdGlvbiBza2lwTGluZUNvbW1lbnQoKSB7XG4gICAgdmFyIHN0YXJ0ID0gdG9rUG9zO1xuICAgIHZhciBzdGFydExvYyA9IG9wdGlvbnMub25Db21tZW50ICYmIG9wdGlvbnMubG9jYXRpb25zICYmIG5ldyBQb3NpdGlvbjtcbiAgICB2YXIgY2ggPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcys9Mik7XG4gICAgd2hpbGUgKHRva1BvcyA8IGlucHV0TGVuICYmIGNoICE9PSAxMCAmJiBjaCAhPT0gMTMgJiYgY2ggIT09IDgyMzIgJiYgY2ggIT09IDgyMzMpIHtcbiAgICAgICsrdG9rUG9zO1xuICAgICAgY2ggPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLm9uQ29tbWVudClcbiAgICAgIG9wdGlvbnMub25Db21tZW50KGZhbHNlLCBpbnB1dC5zbGljZShzdGFydCArIDIsIHRva1BvcyksIHN0YXJ0LCB0b2tQb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydExvYywgb3B0aW9ucy5sb2NhdGlvbnMgJiYgbmV3IFBvc2l0aW9uKTtcbiAgfVxuXG4gIC8vIENhbGxlZCBhdCB0aGUgc3RhcnQgb2YgdGhlIHBhcnNlIGFuZCBhZnRlciBldmVyeSB0b2tlbi4gU2tpcHNcbiAgLy8gd2hpdGVzcGFjZSBhbmQgY29tbWVudHMsIGFuZC5cblxuICBmdW5jdGlvbiBza2lwU3BhY2UoKSB7XG4gICAgd2hpbGUgKHRva1BvcyA8IGlucHV0TGVuKSB7XG4gICAgICB2YXIgY2ggPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgICBpZiAoY2ggPT09IDMyKSB7IC8vICcgJ1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDEzKSB7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICAgICAgaWYgKG5leHQgPT09IDEwKSB7XG4gICAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgICAgICAgKyt0b2tDdXJMaW5lO1xuICAgICAgICAgIHRva0xpbmVTdGFydCA9IHRva1BvcztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gMTAgfHwgY2ggPT09IDgyMzIgfHwgY2ggPT09IDgyMzMpIHtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgICAgICsrdG9rQ3VyTGluZTtcbiAgICAgICAgICB0b2tMaW5lU3RhcnQgPSB0b2tQb3M7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2ggPiA4ICYmIGNoIDwgMTQpIHtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSA0NykgeyAvLyAnLydcbiAgICAgICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgICAgICBpZiAobmV4dCA9PT0gNDIpIHsgLy8gJyonXG4gICAgICAgICAgc2tpcEJsb2NrQ29tbWVudCgpO1xuICAgICAgICB9IGVsc2UgaWYgKG5leHQgPT09IDQ3KSB7IC8vICcvJ1xuICAgICAgICAgIHNraXBMaW5lQ29tbWVudCgpO1xuICAgICAgICB9IGVsc2UgYnJlYWs7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSAxNjApIHsgLy8gJ1xceGEwJ1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPj0gNTc2MCAmJiBub25BU0NJSXdoaXRlc3BhY2UudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKSkpIHtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyAjIyMgVG9rZW4gcmVhZGluZ1xuXG4gIC8vIFRoaXMgaXMgdGhlIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHRvIGZldGNoIHRoZSBuZXh0IHRva2VuLiBJdFxuICAvLyBpcyBzb21ld2hhdCBvYnNjdXJlLCBiZWNhdXNlIGl0IHdvcmtzIGluIGNoYXJhY3RlciBjb2RlcyByYXRoZXJcbiAgLy8gdGhhbiBjaGFyYWN0ZXJzLCBhbmQgYmVjYXVzZSBvcGVyYXRvciBwYXJzaW5nIGhhcyBiZWVuIGlubGluZWRcbiAgLy8gaW50byBpdC5cbiAgLy9cbiAgLy8gQWxsIGluIHRoZSBuYW1lIG9mIHNwZWVkLlxuICAvL1xuICAvLyBUaGUgYGZvcmNlUmVnZXhwYCBwYXJhbWV0ZXIgaXMgdXNlZCBpbiB0aGUgb25lIGNhc2Ugd2hlcmUgdGhlXG4gIC8vIGB0b2tSZWdleHBBbGxvd2VkYCB0cmljayBkb2VzIG5vdCB3b3JrLiBTZWUgYHBhcnNlU3RhdGVtZW50YC5cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fZG90KCkge1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAobmV4dCA+PSA0OCAmJiBuZXh0IDw9IDU3KSByZXR1cm4gcmVhZE51bWJlcih0cnVlKTtcbiAgICB2YXIgbmV4dDIgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpO1xuICAgIGlmIChvcHRpb25zLmVjbWFWZXJzaW9uID49IDYgJiYgbmV4dCA9PT0gNDYgJiYgbmV4dDIgPT09IDQ2KSB7IC8vIDQ2ID0gZG90ICcuJ1xuICAgICAgdG9rUG9zICs9IDM7XG4gICAgICByZXR1cm4gZmluaXNoVG9rZW4oX2VsbGlwc2lzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgKyt0b2tQb3M7XG4gICAgICByZXR1cm4gZmluaXNoVG9rZW4oX2RvdCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX3NsYXNoKCkgeyAvLyAnLydcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKHRva1JlZ2V4cEFsbG93ZWQpIHsrK3Rva1BvczsgcmV0dXJuIHJlYWRSZWdleHAoKTt9XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKF9zbGFzaCwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fbXVsdF9tb2R1bG8oKSB7IC8vICclKidcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKF9tdWx0aXBseU1vZHVsbywgMSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fcGlwZV9hbXAoY29kZSkgeyAvLyAnfCYnXG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID09PSBjb2RlKSByZXR1cm4gZmluaXNoT3AoY29kZSA9PT0gMTI0ID8gX2xvZ2ljYWxPUiA6IF9sb2dpY2FsQU5ELCAyKTtcbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoY29kZSA9PT0gMTI0ID8gX2JpdHdpc2VPUiA6IF9iaXR3aXNlQU5ELCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9jYXJldCgpIHsgLy8gJ14nXG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9hc3NpZ24sIDIpO1xuICAgIHJldHVybiBmaW5pc2hPcChfYml0d2lzZVhPUiwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fcGx1c19taW4oY29kZSkgeyAvLyAnKy0nXG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID09PSBjb2RlKSB7XG4gICAgICBpZiAobmV4dCA9PSA0NSAmJiBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09IDYyICYmXG4gICAgICAgICAgbmV3bGluZS50ZXN0KGlucHV0LnNsaWNlKGxhc3RFbmQsIHRva1BvcykpKSB7XG4gICAgICAgIC8vIEEgYC0tPmAgbGluZSBjb21tZW50XG4gICAgICAgIHRva1BvcyArPSAzO1xuICAgICAgICBza2lwTGluZUNvbW1lbnQoKTtcbiAgICAgICAgc2tpcFNwYWNlKCk7XG4gICAgICAgIHJldHVybiByZWFkVG9rZW4oKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaW5pc2hPcChfaW5jRGVjLCAyKTtcbiAgICB9XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKF9wbHVzTWluLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9sdF9ndChjb2RlKSB7IC8vICc8PidcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgdmFyIHNpemUgPSAxO1xuICAgIGlmIChuZXh0ID09PSBjb2RlKSB7XG4gICAgICBzaXplID0gY29kZSA9PT0gNjIgJiYgaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAyKSA9PT0gNjIgPyAzIDogMjtcbiAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIHNpemUpID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9hc3NpZ24sIHNpemUgKyAxKTtcbiAgICAgIHJldHVybiBmaW5pc2hPcChfYml0U2hpZnQsIHNpemUpO1xuICAgIH1cbiAgICBpZiAobmV4dCA9PSAzMyAmJiBjb2RlID09IDYwICYmIGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMikgPT0gNDUgJiZcbiAgICAgICAgaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAzKSA9PSA0NSkge1xuICAgICAgLy8gYDwhLS1gLCBhbiBYTUwtc3R5bGUgY29tbWVudCB0aGF0IHNob3VsZCBiZSBpbnRlcnByZXRlZCBhcyBhIGxpbmUgY29tbWVudFxuICAgICAgdG9rUG9zICs9IDQ7XG4gICAgICBza2lwTGluZUNvbW1lbnQoKTtcbiAgICAgIHNraXBTcGFjZSgpO1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbigpO1xuICAgIH1cbiAgICBpZiAobmV4dCA9PT0gNjEpXG4gICAgICBzaXplID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAyKSA9PT0gNjEgPyAzIDogMjtcbiAgICByZXR1cm4gZmluaXNoT3AoX3JlbGF0aW9uYWwsIHNpemUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX2VxX2V4Y2woY29kZSkgeyAvLyAnPSEnXG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9lcXVhbGl0eSwgaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAyKSA9PT0gNjEgPyAzIDogMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKGNvZGUgPT09IDYxID8gX2VxIDogX3ByZWZpeCwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUb2tlbkZyb21Db2RlKGNvZGUpIHtcbiAgICBzd2l0Y2goY29kZSkge1xuICAgICAgLy8gVGhlIGludGVycHJldGF0aW9uIG9mIGEgZG90IGRlcGVuZHMgb24gd2hldGhlciBpdCBpcyBmb2xsb3dlZFxuICAgICAgLy8gYnkgYSBkaWdpdCBvciBhbm90aGVyIHR3byBkb3RzLlxuICAgIGNhc2UgNDY6IC8vICcuJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9kb3QoKTtcblxuICAgICAgLy8gUHVuY3R1YXRpb24gdG9rZW5zLlxuICAgIGNhc2UgNDA6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX3BhcmVuTCk7XG4gICAgY2FzZSA0MTogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfcGFyZW5SKTtcbiAgICBjYXNlIDU5OiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9zZW1pKTtcbiAgICBjYXNlIDQ0OiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9jb21tYSk7XG4gICAgY2FzZSA5MTogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfYnJhY2tldEwpO1xuICAgIGNhc2UgOTM6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX2JyYWNrZXRSKTtcbiAgICBjYXNlIDEyMzogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfYnJhY2VMKTtcbiAgICBjYXNlIDEyNTogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfYnJhY2VSKTtcbiAgICBjYXNlIDU4OiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9jb2xvbik7XG4gICAgY2FzZSA2MzogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfcXVlc3Rpb24pO1xuXG4gICAgICAvLyAnMHgnIGlzIGEgaGV4YWRlY2ltYWwgbnVtYmVyLlxuICAgIGNhc2UgNDg6IC8vICcwJ1xuICAgICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgICAgaWYgKG5leHQgPT09IDEyMCB8fCBuZXh0ID09PSA4OCkgcmV0dXJuIHJlYWRIZXhOdW1iZXIoKTtcbiAgICAgIC8vIEFueXRoaW5nIGVsc2UgYmVnaW5uaW5nIHdpdGggYSBkaWdpdCBpcyBhbiBpbnRlZ2VyLCBvY3RhbFxuICAgICAgLy8gbnVtYmVyLCBvciBmbG9hdC5cbiAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgY2FzZSA0OTogY2FzZSA1MDogY2FzZSA1MTogY2FzZSA1MjogY2FzZSA1MzogY2FzZSA1NDogY2FzZSA1NTogY2FzZSA1NjogY2FzZSA1NzogLy8gMS05XG4gICAgICByZXR1cm4gcmVhZE51bWJlcihmYWxzZSk7XG5cbiAgICAgIC8vIFF1b3RlcyBwcm9kdWNlIHN0cmluZ3MuXG4gICAgY2FzZSAzNDogY2FzZSAzOTogLy8gJ1wiJywgXCInXCJcbiAgICAgIHJldHVybiByZWFkU3RyaW5nKGNvZGUpO1xuXG4gICAgLy8gT3BlcmF0b3JzIGFyZSBwYXJzZWQgaW5saW5lIGluIHRpbnkgc3RhdGUgbWFjaGluZXMuICc9JyAoNjEpIGlzXG4gICAgLy8gb2Z0ZW4gcmVmZXJyZWQgdG8uIGBmaW5pc2hPcGAgc2ltcGx5IHNraXBzIHRoZSBhbW91bnQgb2ZcbiAgICAvLyBjaGFyYWN0ZXJzIGl0IGlzIGdpdmVuIGFzIHNlY29uZCBhcmd1bWVudCwgYW5kIHJldHVybnMgYSB0b2tlblxuICAgIC8vIG9mIHRoZSB0eXBlIGdpdmVuIGJ5IGl0cyBmaXJzdCBhcmd1bWVudC5cblxuICAgIGNhc2UgNDc6IC8vICcvJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9zbGFzaCgpO1xuXG4gICAgY2FzZSAzNzogY2FzZSA0MjogLy8gJyUqJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9tdWx0X21vZHVsbygpO1xuXG4gICAgY2FzZSAxMjQ6IGNhc2UgMzg6IC8vICd8JidcbiAgICAgIHJldHVybiByZWFkVG9rZW5fcGlwZV9hbXAoY29kZSk7XG5cbiAgICBjYXNlIDk0OiAvLyAnXidcbiAgICAgIHJldHVybiByZWFkVG9rZW5fY2FyZXQoKTtcblxuICAgIGNhc2UgNDM6IGNhc2UgNDU6IC8vICcrLSdcbiAgICAgIHJldHVybiByZWFkVG9rZW5fcGx1c19taW4oY29kZSk7XG5cbiAgICBjYXNlIDYwOiBjYXNlIDYyOiAvLyAnPD4nXG4gICAgICByZXR1cm4gcmVhZFRva2VuX2x0X2d0KGNvZGUpO1xuXG4gICAgY2FzZSA2MTogY2FzZSAzMzogLy8gJz0hJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9lcV9leGNsKGNvZGUpO1xuXG4gICAgY2FzZSAxMjY6IC8vICd+J1xuICAgICAgcmV0dXJuIGZpbmlzaE9wKF9wcmVmaXgsIDEpO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbihmb3JjZVJlZ2V4cCkge1xuICAgIGlmICghZm9yY2VSZWdleHApIHRva1N0YXJ0ID0gdG9rUG9zO1xuICAgIGVsc2UgdG9rUG9zID0gdG9rU3RhcnQgKyAxO1xuICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykgdG9rU3RhcnRMb2MgPSBuZXcgUG9zaXRpb247XG4gICAgaWYgKGZvcmNlUmVnZXhwKSByZXR1cm4gcmVhZFJlZ2V4cCgpO1xuICAgIGlmICh0b2tQb3MgPj0gaW5wdXRMZW4pIHJldHVybiBmaW5pc2hUb2tlbihfZW9mKTtcblxuICAgIHZhciBjb2RlID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgIC8vIElkZW50aWZpZXIgb3Iga2V5d29yZC4gJ1xcdVhYWFgnIHNlcXVlbmNlcyBhcmUgYWxsb3dlZCBpblxuICAgIC8vIGlkZW50aWZpZXJzLCBzbyAnXFwnIGFsc28gZGlzcGF0Y2hlcyB0byB0aGF0LlxuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjb2RlKSB8fCBjb2RlID09PSA5MiAvKiAnXFwnICovKSByZXR1cm4gcmVhZFdvcmQoKTtcblxuICAgIHZhciB0b2sgPSBnZXRUb2tlbkZyb21Db2RlKGNvZGUpO1xuXG4gICAgaWYgKHRvayA9PT0gZmFsc2UpIHtcbiAgICAgIC8vIElmIHdlIGFyZSBoZXJlLCB3ZSBlaXRoZXIgZm91bmQgYSBub24tQVNDSUkgaWRlbnRpZmllclxuICAgICAgLy8gY2hhcmFjdGVyLCBvciBzb21ldGhpbmcgdGhhdCdzIGVudGlyZWx5IGRpc2FsbG93ZWQuXG4gICAgICB2YXIgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xuICAgICAgaWYgKGNoID09PSBcIlxcXFxcIiB8fCBub25BU0NJSWlkZW50aWZpZXJTdGFydC50ZXN0KGNoKSkgcmV0dXJuIHJlYWRXb3JkKCk7XG4gICAgICByYWlzZSh0b2tQb3MsIFwiVW5leHBlY3RlZCBjaGFyYWN0ZXIgJ1wiICsgY2ggKyBcIidcIik7XG4gICAgfVxuICAgIHJldHVybiB0b2s7XG4gIH1cblxuICBmdW5jdGlvbiBmaW5pc2hPcCh0eXBlLCBzaXplKSB7XG4gICAgdmFyIHN0ciA9IGlucHV0LnNsaWNlKHRva1BvcywgdG9rUG9zICsgc2l6ZSk7XG4gICAgdG9rUG9zICs9IHNpemU7XG4gICAgZmluaXNoVG9rZW4odHlwZSwgc3RyKTtcbiAgfVxuXG4gIC8vIFBhcnNlIGEgcmVndWxhciBleHByZXNzaW9uLiBTb21lIGNvbnRleHQtYXdhcmVuZXNzIGlzIG5lY2Vzc2FyeSxcbiAgLy8gc2luY2UgYSAnLycgaW5zaWRlIGEgJ1tdJyBzZXQgZG9lcyBub3QgZW5kIHRoZSBleHByZXNzaW9uLlxuXG4gIGZ1bmN0aW9uIHJlYWRSZWdleHAoKSB7XG4gICAgdmFyIGNvbnRlbnQgPSBcIlwiLCBlc2NhcGVkLCBpbkNsYXNzLCBzdGFydCA9IHRva1BvcztcbiAgICBmb3IgKDs7KSB7XG4gICAgICBpZiAodG9rUG9zID49IGlucHV0TGVuKSByYWlzZShzdGFydCwgXCJVbnRlcm1pbmF0ZWQgcmVndWxhciBleHByZXNzaW9uXCIpO1xuICAgICAgdmFyIGNoID0gaW5wdXQuY2hhckF0KHRva1Bvcyk7XG4gICAgICBpZiAobmV3bGluZS50ZXN0KGNoKSkgcmFpc2Uoc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTtcbiAgICAgIGlmICghZXNjYXBlZCkge1xuICAgICAgICBpZiAoY2ggPT09IFwiW1wiKSBpbkNsYXNzID0gdHJ1ZTtcbiAgICAgICAgZWxzZSBpZiAoY2ggPT09IFwiXVwiICYmIGluQ2xhc3MpIGluQ2xhc3MgPSBmYWxzZTtcbiAgICAgICAgZWxzZSBpZiAoY2ggPT09IFwiL1wiICYmICFpbkNsYXNzKSBicmVhaztcbiAgICAgICAgZXNjYXBlZCA9IGNoID09PSBcIlxcXFxcIjtcbiAgICAgIH0gZWxzZSBlc2NhcGVkID0gZmFsc2U7XG4gICAgICArK3Rva1BvcztcbiAgICB9XG4gICAgdmFyIGNvbnRlbnQgPSBpbnB1dC5zbGljZShzdGFydCwgdG9rUG9zKTtcbiAgICArK3Rva1BvcztcbiAgICAvLyBOZWVkIHRvIHVzZSBgcmVhZFdvcmQxYCBiZWNhdXNlICdcXHVYWFhYJyBzZXF1ZW5jZXMgYXJlIGFsbG93ZWRcbiAgICAvLyBoZXJlIChkb24ndCBhc2spLlxuICAgIHZhciBtb2RzID0gcmVhZFdvcmQxKCk7XG4gICAgaWYgKG1vZHMgJiYgIS9eW2dtc2l5XSokLy50ZXN0KG1vZHMpKSByYWlzZShzdGFydCwgXCJJbnZhbGlkIHJlZ3VsYXIgZXhwcmVzc2lvbiBmbGFnXCIpO1xuICAgIHRyeSB7XG4gICAgICB2YXIgdmFsdWUgPSBuZXcgUmVnRXhwKGNvbnRlbnQsIG1vZHMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgU3ludGF4RXJyb3IpIHJhaXNlKHN0YXJ0LCBcIkVycm9yIHBhcnNpbmcgcmVndWxhciBleHByZXNzaW9uOiBcIiArIGUubWVzc2FnZSk7XG4gICAgICByYWlzZShlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZpbmlzaFRva2VuKF9yZWdleHAsIHZhbHVlKTtcbiAgfVxuXG4gIC8vIFJlYWQgYW4gaW50ZWdlciBpbiB0aGUgZ2l2ZW4gcmFkaXguIFJldHVybiBudWxsIGlmIHplcm8gZGlnaXRzXG4gIC8vIHdlcmUgcmVhZCwgdGhlIGludGVnZXIgdmFsdWUgb3RoZXJ3aXNlLiBXaGVuIGBsZW5gIGlzIGdpdmVuLCB0aGlzXG4gIC8vIHdpbGwgcmV0dXJuIGBudWxsYCB1bmxlc3MgdGhlIGludGVnZXIgaGFzIGV4YWN0bHkgYGxlbmAgZGlnaXRzLlxuXG4gIGZ1bmN0aW9uIHJlYWRJbnQocmFkaXgsIGxlbikge1xuICAgIHZhciBzdGFydCA9IHRva1BvcywgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwLCBlID0gbGVuID09IG51bGwgPyBJbmZpbml0eSA6IGxlbjsgaSA8IGU7ICsraSkge1xuICAgICAgdmFyIGNvZGUgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyksIHZhbDtcbiAgICAgIGlmIChjb2RlID49IDk3KSB2YWwgPSBjb2RlIC0gOTcgKyAxMDsgLy8gYVxuICAgICAgZWxzZSBpZiAoY29kZSA+PSA2NSkgdmFsID0gY29kZSAtIDY1ICsgMTA7IC8vIEFcbiAgICAgIGVsc2UgaWYgKGNvZGUgPj0gNDggJiYgY29kZSA8PSA1NykgdmFsID0gY29kZSAtIDQ4OyAvLyAwLTlcbiAgICAgIGVsc2UgdmFsID0gSW5maW5pdHk7XG4gICAgICBpZiAodmFsID49IHJhZGl4KSBicmVhaztcbiAgICAgICsrdG9rUG9zO1xuICAgICAgdG90YWwgPSB0b3RhbCAqIHJhZGl4ICsgdmFsO1xuICAgIH1cbiAgICBpZiAodG9rUG9zID09PSBzdGFydCB8fCBsZW4gIT0gbnVsbCAmJiB0b2tQb3MgLSBzdGFydCAhPT0gbGVuKSByZXR1cm4gbnVsbDtcblxuICAgIHJldHVybiB0b3RhbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRIZXhOdW1iZXIoKSB7XG4gICAgdG9rUG9zICs9IDI7IC8vIDB4XG4gICAgdmFyIHZhbCA9IHJlYWRJbnQoMTYpO1xuICAgIGlmICh2YWwgPT0gbnVsbCkgcmFpc2UodG9rU3RhcnQgKyAyLCBcIkV4cGVjdGVkIGhleGFkZWNpbWFsIG51bWJlclwiKTtcbiAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpKSkgcmFpc2UodG9rUG9zLCBcIklkZW50aWZpZXIgZGlyZWN0bHkgYWZ0ZXIgbnVtYmVyXCIpO1xuICAgIHJldHVybiBmaW5pc2hUb2tlbihfbnVtLCB2YWwpO1xuICB9XG5cbiAgLy8gUmVhZCBhbiBpbnRlZ2VyLCBvY3RhbCBpbnRlZ2VyLCBvciBmbG9hdGluZy1wb2ludCBudW1iZXIuXG5cbiAgZnVuY3Rpb24gcmVhZE51bWJlcihzdGFydHNXaXRoRG90KSB7XG4gICAgdmFyIHN0YXJ0ID0gdG9rUG9zLCBpc0Zsb2F0ID0gZmFsc2UsIG9jdGFsID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpID09PSA0ODtcbiAgICBpZiAoIXN0YXJ0c1dpdGhEb3QgJiYgcmVhZEludCgxMCkgPT09IG51bGwpIHJhaXNlKHN0YXJ0LCBcIkludmFsaWQgbnVtYmVyXCIpO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykgPT09IDQ2KSB7XG4gICAgICArK3Rva1BvcztcbiAgICAgIHJlYWRJbnQoMTApO1xuICAgICAgaXNGbG9hdCA9IHRydWU7XG4gICAgfVxuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgIGlmIChuZXh0ID09PSA2OSB8fCBuZXh0ID09PSAxMDEpIHsgLy8gJ2VFJ1xuICAgICAgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQoKyt0b2tQb3MpO1xuICAgICAgaWYgKG5leHQgPT09IDQzIHx8IG5leHQgPT09IDQ1KSArK3Rva1BvczsgLy8gJystJ1xuICAgICAgaWYgKHJlYWRJbnQoMTApID09PSBudWxsKSByYWlzZShzdGFydCwgXCJJbnZhbGlkIG51bWJlclwiKTtcbiAgICAgIGlzRmxvYXQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpKSkgcmFpc2UodG9rUG9zLCBcIklkZW50aWZpZXIgZGlyZWN0bHkgYWZ0ZXIgbnVtYmVyXCIpO1xuXG4gICAgdmFyIHN0ciA9IGlucHV0LnNsaWNlKHN0YXJ0LCB0b2tQb3MpLCB2YWw7XG4gICAgaWYgKGlzRmxvYXQpIHZhbCA9IHBhcnNlRmxvYXQoc3RyKTtcbiAgICBlbHNlIGlmICghb2N0YWwgfHwgc3RyLmxlbmd0aCA9PT0gMSkgdmFsID0gcGFyc2VJbnQoc3RyLCAxMCk7XG4gICAgZWxzZSBpZiAoL1s4OV0vLnRlc3Qoc3RyKSB8fCBzdHJpY3QpIHJhaXNlKHN0YXJ0LCBcIkludmFsaWQgbnVtYmVyXCIpO1xuICAgIGVsc2UgdmFsID0gcGFyc2VJbnQoc3RyLCA4KTtcbiAgICByZXR1cm4gZmluaXNoVG9rZW4oX251bSwgdmFsKTtcbiAgfVxuXG4gIC8vIFJlYWQgYSBzdHJpbmcgdmFsdWUsIGludGVycHJldGluZyBiYWNrc2xhc2gtZXNjYXBlcy5cblxuICBmdW5jdGlvbiByZWFkU3RyaW5nKHF1b3RlKSB7XG4gICAgdG9rUG9zKys7XG4gICAgdmFyIG91dCA9IFwiXCI7XG4gICAgZm9yICg7Oykge1xuICAgICAgaWYgKHRva1BvcyA+PSBpbnB1dExlbikgcmFpc2UodG9rU3RhcnQsIFwiVW50ZXJtaW5hdGVkIHN0cmluZyBjb25zdGFudFwiKTtcbiAgICAgIHZhciBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICAgIGlmIChjaCA9PT0gcXVvdGUpIHtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIHJldHVybiBmaW5pc2hUb2tlbihfc3RyaW5nLCBvdXQpO1xuICAgICAgfVxuICAgICAgaWYgKGNoID09PSA5MikgeyAvLyAnXFwnXG4gICAgICAgIGNoID0gaW5wdXQuY2hhckNvZGVBdCgrK3Rva1Bvcyk7XG4gICAgICAgIHZhciBvY3RhbCA9IC9eWzAtN10rLy5leGVjKGlucHV0LnNsaWNlKHRva1BvcywgdG9rUG9zICsgMykpO1xuICAgICAgICBpZiAob2N0YWwpIG9jdGFsID0gb2N0YWxbMF07XG4gICAgICAgIHdoaWxlIChvY3RhbCAmJiBwYXJzZUludChvY3RhbCwgOCkgPiAyNTUpIG9jdGFsID0gb2N0YWwuc2xpY2UoMCwgLTEpO1xuICAgICAgICBpZiAob2N0YWwgPT09IFwiMFwiKSBvY3RhbCA9IG51bGw7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgICBpZiAob2N0YWwpIHtcbiAgICAgICAgICBpZiAoc3RyaWN0KSByYWlzZSh0b2tQb3MgLSAyLCBcIk9jdGFsIGxpdGVyYWwgaW4gc3RyaWN0IG1vZGVcIik7XG4gICAgICAgICAgb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQob2N0YWwsIDgpKTtcbiAgICAgICAgICB0b2tQb3MgKz0gb2N0YWwubGVuZ3RoIC0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICAgICAgY2FzZSAxMTA6IG91dCArPSBcIlxcblwiOyBicmVhazsgLy8gJ24nIC0+ICdcXG4nXG4gICAgICAgICAgY2FzZSAxMTQ6IG91dCArPSBcIlxcclwiOyBicmVhazsgLy8gJ3InIC0+ICdcXHInXG4gICAgICAgICAgY2FzZSAxMjA6IG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHJlYWRIZXhDaGFyKDIpKTsgYnJlYWs7IC8vICd4J1xuICAgICAgICAgIGNhc2UgMTE3OiBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShyZWFkSGV4Q2hhcig0KSk7IGJyZWFrOyAvLyAndSdcbiAgICAgICAgICBjYXNlIDg1OiBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShyZWFkSGV4Q2hhcig4KSk7IGJyZWFrOyAvLyAnVSdcbiAgICAgICAgICBjYXNlIDExNjogb3V0ICs9IFwiXFx0XCI7IGJyZWFrOyAvLyAndCcgLT4gJ1xcdCdcbiAgICAgICAgICBjYXNlIDk4OiBvdXQgKz0gXCJcXGJcIjsgYnJlYWs7IC8vICdiJyAtPiAnXFxiJ1xuICAgICAgICAgIGNhc2UgMTE4OiBvdXQgKz0gXCJcXHUwMDBiXCI7IGJyZWFrOyAvLyAndicgLT4gJ1xcdTAwMGInXG4gICAgICAgICAgY2FzZSAxMDI6IG91dCArPSBcIlxcZlwiOyBicmVhazsgLy8gJ2YnIC0+ICdcXGYnXG4gICAgICAgICAgY2FzZSA0ODogb3V0ICs9IFwiXFwwXCI7IGJyZWFrOyAvLyAwIC0+ICdcXDAnXG4gICAgICAgICAgY2FzZSAxMzogaWYgKGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKSA9PT0gMTApICsrdG9rUG9zOyAvLyAnXFxyXFxuJ1xuICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICBjYXNlIDEwOiAvLyAnIFxcbidcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykgeyB0b2tMaW5lU3RhcnQgPSB0b2tQb3M7ICsrdG9rQ3VyTGluZTsgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDogb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpOyBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjaCA9PT0gMTMgfHwgY2ggPT09IDEwIHx8IGNoID09PSA4MjMyIHx8IGNoID09PSA4MjMzKSByYWlzZSh0b2tTdGFydCwgXCJVbnRlcm1pbmF0ZWQgc3RyaW5nIGNvbnN0YW50XCIpO1xuICAgICAgICBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7IC8vICdcXCdcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gVXNlZCB0byByZWFkIGNoYXJhY3RlciBlc2NhcGUgc2VxdWVuY2VzICgnXFx4JywgJ1xcdScsICdcXFUnKS5cblxuICBmdW5jdGlvbiByZWFkSGV4Q2hhcihsZW4pIHtcbiAgICB2YXIgbiA9IHJlYWRJbnQoMTYsIGxlbik7XG4gICAgaWYgKG4gPT09IG51bGwpIHJhaXNlKHRva1N0YXJ0LCBcIkJhZCBjaGFyYWN0ZXIgZXNjYXBlIHNlcXVlbmNlXCIpO1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgLy8gVXNlZCB0byBzaWduYWwgdG8gY2FsbGVycyBvZiBgcmVhZFdvcmQxYCB3aGV0aGVyIHRoZSB3b3JkXG4gIC8vIGNvbnRhaW5lZCBhbnkgZXNjYXBlIHNlcXVlbmNlcy4gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSB3b3JkcyB3aXRoXG4gIC8vIGVzY2FwZSBzZXF1ZW5jZXMgbXVzdCBub3QgYmUgaW50ZXJwcmV0ZWQgYXMga2V5d29yZHMuXG5cbiAgdmFyIGNvbnRhaW5zRXNjO1xuXG4gIC8vIFJlYWQgYW4gaWRlbnRpZmllciwgYW5kIHJldHVybiBpdCBhcyBhIHN0cmluZy4gU2V0cyBgY29udGFpbnNFc2NgXG4gIC8vIHRvIHdoZXRoZXIgdGhlIHdvcmQgY29udGFpbmVkIGEgJ1xcdScgZXNjYXBlLlxuICAvL1xuICAvLyBPbmx5IGJ1aWxkcyB1cCB0aGUgd29yZCBjaGFyYWN0ZXItYnktY2hhcmFjdGVyIHdoZW4gaXQgYWN0dWFsbHlcbiAgLy8gY29udGFpbmVkcyBhbiBlc2NhcGUsIGFzIGEgbWljcm8tb3B0aW1pemF0aW9uLlxuXG4gIGZ1bmN0aW9uIHJlYWRXb3JkMSgpIHtcbiAgICBjb250YWluc0VzYyA9IGZhbHNlO1xuICAgIHZhciB3b3JkLCBmaXJzdCA9IHRydWUsIHN0YXJ0ID0gdG9rUG9zO1xuICAgIGZvciAoOzspIHtcbiAgICAgIHZhciBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICAgIGlmIChpc0lkZW50aWZpZXJDaGFyKGNoKSkge1xuICAgICAgICBpZiAoY29udGFpbnNFc2MpIHdvcmQgKz0gaW5wdXQuY2hhckF0KHRva1Bvcyk7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gOTIpIHsgLy8gXCJcXFwiXG4gICAgICAgIGlmICghY29udGFpbnNFc2MpIHdvcmQgPSBpbnB1dC5zbGljZShzdGFydCwgdG9rUG9zKTtcbiAgICAgICAgY29udGFpbnNFc2MgPSB0cnVlO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdCgrK3Rva1BvcykgIT0gMTE3KSAvLyBcInVcIlxuICAgICAgICAgIHJhaXNlKHRva1BvcywgXCJFeHBlY3RpbmcgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2UgXFxcXHVYWFhYXCIpO1xuICAgICAgICArK3Rva1BvcztcbiAgICAgICAgdmFyIGVzYyA9IHJlYWRIZXhDaGFyKDQpO1xuICAgICAgICB2YXIgZXNjU3RyID0gU3RyaW5nLmZyb21DaGFyQ29kZShlc2MpO1xuICAgICAgICBpZiAoIWVzY1N0cikgcmFpc2UodG9rUG9zIC0gMSwgXCJJbnZhbGlkIFVuaWNvZGUgZXNjYXBlXCIpO1xuICAgICAgICBpZiAoIShmaXJzdCA/IGlzSWRlbnRpZmllclN0YXJ0KGVzYykgOiBpc0lkZW50aWZpZXJDaGFyKGVzYykpKVxuICAgICAgICAgIHJhaXNlKHRva1BvcyAtIDQsIFwiSW52YWxpZCBVbmljb2RlIGVzY2FwZVwiKTtcbiAgICAgICAgd29yZCArPSBlc2NTdHI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBjb250YWluc0VzYyA/IHdvcmQgOiBpbnB1dC5zbGljZShzdGFydCwgdG9rUG9zKTtcbiAgfVxuXG4gIC8vIFJlYWQgYW4gaWRlbnRpZmllciBvciBrZXl3b3JkIHRva2VuLiBXaWxsIGNoZWNrIGZvciByZXNlcnZlZFxuICAvLyB3b3JkcyB3aGVuIG5lY2Vzc2FyeS5cblxuICBmdW5jdGlvbiByZWFkV29yZCgpIHtcbiAgICB2YXIgd29yZCA9IHJlYWRXb3JkMSgpO1xuICAgIHZhciB0eXBlID0gX25hbWU7XG4gICAgaWYgKCFjb250YWluc0VzYyAmJiBpc0tleXdvcmQod29yZCkpXG4gICAgICB0eXBlID0ga2V5d29yZFR5cGVzW3dvcmRdO1xuICAgIHJldHVybiBmaW5pc2hUb2tlbih0eXBlLCB3b3JkKTtcbiAgfVxuXG5cbmV4cG9ydCBkZWZhdWx0IHsgdG9rZW5pemU6IGV4cG9ydHMudG9rZW5pemUgfTsiLCIvLyBSZWJvdW5kIEhlbHBlcnNcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IExhenlWYWx1ZSBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvbGF6eS12YWx1ZVwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cblxudmFyIGhlbHBlcnMgID0ge30sXG4gICAgcGFydGlhbHMgPSB7fTtcblxuaGVscGVycy5yZWdpc3RlclBhcnRpYWwgPSBmdW5jdGlvbihuYW1lLCBmdW5jKXtcbiAgaWYoZnVuYyAmJiBmdW5jLmlzSFRNTEJhcnMgJiYgdHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKXtcbiAgICBwYXJ0aWFsc1tuYW1lXSA9IGZ1bmM7XG4gIH1cbn07XG5cbi8vIGxvb2t1cEhlbHBlciByZXR1cm5zIHRoZSBnaXZlbiBmdW5jdGlvbiBmcm9tIHRoZSBoZWxwZXJzIG9iamVjdC4gTWFudWFsIGNoZWNrcyBwcmV2ZW50IHVzZXIgZnJvbSBvdmVycmlkaW5nIHJlc2VydmVkIHdvcmRzLlxuaGVscGVycy5sb29rdXBIZWxwZXIgPSBmdW5jdGlvbihuYW1lLCBlbnYpIHtcbiAgKGVudiAmJiBlbnYuaGVscGVycykgfHwgKGVudiA9IHtoZWxwZXJzOnt9fSk7XG4gIC8vIElmIGEgcmVzZXJ2ZWQgaGVscGVyLCByZXR1cm4gaXRcbiAgaWYobmFtZSA9PT0gJ2F0dHJpYnV0ZScpIHsgcmV0dXJuIHRoaXMuYXR0cmlidXRlOyB9XG4gIGlmKG5hbWUgPT09ICdpZicpIHsgcmV0dXJuIHRoaXMuaWY7IH1cbiAgaWYobmFtZSA9PT0gJ3VubGVzcycpIHsgcmV0dXJuIHRoaXMudW5sZXNzOyB9XG4gIGlmKG5hbWUgPT09ICdlYWNoJykgeyByZXR1cm4gdGhpcy5lYWNoOyB9XG4gIGlmKG5hbWUgPT09ICdwYXJ0aWFsJykgeyByZXR1cm4gdGhpcy5wYXJ0aWFsOyB9XG4gIGlmKG5hbWUgPT09ICdvbicpIHsgcmV0dXJuIHRoaXMub247IH1cbiAgaWYobmFtZSA9PT0gJ2RlYnVnZ2VyJykgeyByZXR1cm4gdGhpcy5kZWJ1Z2dlcjsgfVxuICBpZihuYW1lID09PSAnbG9nJykgeyByZXR1cm4gdGhpcy5sb2c7IH1cblxuICAvLyBJZiBub3QgYSByZXNlcnZlZCBoZWxwZXIsIGNoZWNrIGVudiwgdGhlbiBnbG9iYWwgaGVscGVycywgZWxzZSByZXR1cm4gZmFsc2VcbiAgcmV0dXJuIGVudi5oZWxwZXJzW25hbWVdIHx8IGhlbHBlcnNbbmFtZV0gfHwgZmFsc2U7XG59O1xuXG5oZWxwZXJzLnJlZ2lzdGVySGVscGVyID0gZnVuY3Rpb24obmFtZSwgY2FsbGJhY2ssIHBhcmFtcyl7XG4gIGlmKCFfLmlzU3RyaW5nKG5hbWUpKXtcbiAgICBjb25zb2xlLmVycm9yKCdOYW1lIHByb3ZpZGVkIHRvIHJlZ2lzdGVySGVscGVyIG11c3QgYmUgYSBzdHJpbmchJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmKCFfLmlzRnVuY3Rpb24oY2FsbGJhY2spKXtcbiAgICBjb25zb2xlLmVycm9yKCdDYWxsYmFjayBwcm92aWRlZCB0byByZWdpZXJIZWxwZXIgbXVzdCBiZSBhIGZ1bmN0aW9uIScpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZihoZWxwZXJzLmxvb2t1cEhlbHBlcihuYW1lKSl7XG4gICAgY29uc29sZS5lcnJvcignQSBoZWxwZXIgY2FsbGVkIFwiJyArIG5hbWUgKyAnXCIgaXMgYWxyZWFkeSByZWdpc3RlcmVkIScpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHBhcmFtcyA9IChfLmlzQXJyYXkocGFyYW1zKSkgPyBwYXJhbXMgOiBbcGFyYW1zXTtcbiAgY2FsbGJhY2suX19wYXJhbXMgPSBwYXJhbXM7XG5cbiAgaGVscGVyc1tuYW1lXSA9IGNhbGxiYWNrO1xuXG59O1xuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBEZWZhdWx0IGhlbHBlcnNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5oZWxwZXJzLmRlYnVnZ2VyID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuICBkZWJ1Z2dlcjtcbiAgcmV0dXJuICcnO1xufVxuXG5oZWxwZXJzLmxvZyA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcbiAgY29uc29sZS5sb2cuYXBwbHkoY29uc29sZSwgcGFyYW1zKTtcbiAgcmV0dXJuICcnO1xufVxuXG5oZWxwZXJzLm9uID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuICB2YXIgaSwgY2FsbGJhY2ssIGRlbGVnYXRlLCBlbGVtZW50LFxuICAgICAgZXZlbnROYW1lID0gcGFyYW1zWzBdLFxuICAgICAgbGVuID0gcGFyYW1zLmxlbmd0aCxcbiAgICAgIGRhdGEgPSBoYXNoO1xuXG4gIC8vIEJ5IGRlZmF1bHQgZXZlcnl0aGluZyBpcyBkZWxlZ2F0ZWQgb24gdGhlIHBhcmVudCBjb21wb25lbnRcbiAgaWYobGVuID09PSAyKXtcbiAgICBjYWxsYmFjayA9IHBhcmFtc1sxXTtcbiAgICBkZWxlZ2F0ZSA9IG9wdGlvbnMuZWxlbWVudDtcbiAgICBlbGVtZW50ID0gKHRoaXMuZWwgfHwgb3B0aW9ucy5lbGVtZW50KTtcbiAgfVxuICAvLyBJZiBhIHNlbGVjdG9yIGlzIHByb3ZpZGVkLCBkZWxlZ2F0ZSBvbiB0aGUgaGVscGVyJ3MgZWxlbWVudFxuICBlbHNlIGlmKGxlbiA9PT0gMyl7XG4gICAgY2FsbGJhY2sgPSBwYXJhbXNbMl07XG4gICAgZGVsZWdhdGUgPSBwYXJhbXNbMV07XG4gICAgZWxlbWVudCA9IG9wdGlvbnMuZWxlbWVudDtcbiAgfVxuXG4gIC8vIEF0dGFjaCBldmVudFxuICAkKGVsZW1lbnQpLm9uKGV2ZW50TmFtZSwgZGVsZWdhdGUsIGhhc2gsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICByZXR1cm4gZW52LmhlbHBlcnMuX2NhbGxPbkNvbXBvbmVudChjYWxsYmFjaywgZXZlbnQpO1xuICB9KTtcbn07XG5cbmhlbHBlcnMubGVuZ3RoID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuICAgIHJldHVybiBwYXJhbXNbMF0gJiYgcGFyYW1zWzBdLmxlbmd0aCB8fCAwO1xufTtcblxuaGVscGVycy5pZiA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcblxuICB2YXIgY29uZGl0aW9uID0gcGFyYW1zWzBdO1xuXG4gIGlmKGNvbmRpdGlvbiA9PT0gdW5kZWZpbmVkIHx8IGNvbmRpdGlvbiA9PT0gbnVsbCl7XG4gICAgY29uZGl0aW9uID0gZmFsc2U7XG4gIH1cblxuICBpZihjb25kaXRpb24uaXNNb2RlbCl7XG4gICAgY29uZGl0aW9uID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIElmIG91ciBjb25kaXRpb24gaXMgYW4gYXJyYXksIGhhbmRsZSBwcm9wZXJseVxuICBpZihfLmlzQXJyYXkoY29uZGl0aW9uKSB8fCBjb25kaXRpb24uaXNDb2xsZWN0aW9uKXtcbiAgICBjb25kaXRpb24gPSBjb25kaXRpb24ubGVuZ3RoID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG5cbiAgaWYoY29uZGl0aW9uID09PSAndHJ1ZScpeyBjb25kaXRpb24gPSB0cnVlOyB9XG4gIGlmKGNvbmRpdGlvbiA9PT0gJ2ZhbHNlJyl7IGNvbmRpdGlvbiA9IGZhbHNlOyB9XG5cbiAgLy8gSWYgbW9yZSB0aGFuIG9uZSBwYXJhbSwgdGhpcyBpcyBub3QgYSBibG9jayBoZWxwZXIuIEV2YWwgYXMgc3VjaC5cbiAgaWYocGFyYW1zLmxlbmd0aCA+IDEpe1xuICAgIHJldHVybiAoY29uZGl0aW9uKSA/IHBhcmFtc1sxXSA6ICggcGFyYW1zWzJdIHx8ICcnKTtcbiAgfVxuXG4gIC8vIENoZWNrIG91ciBjYWNoZS4gSWYgdGhlIHZhbHVlIGhhc24ndCBhY3R1YWxseSBjaGFuZ2VkLCBkb24ndCBldmFsdWF0ZS4gSW1wb3J0YW50IGZvciByZS1yZW5kZXJpbmcgb2YgI2VhY2ggaGVscGVycy5cbiAgaWYob3B0aW9ucy5tb3JwaC5fX2lmQ2FjaGUgPT09IGNvbmRpdGlvbil7XG4gICAgcmV0dXJuIG51bGw7IC8vIFJldHVybiBudWxsIHByZXZlbnQncyByZS1yZW5kaW5nIG9mIG91ciBwbGFjZWhvbGRlci5cbiAgfVxuXG4gIG9wdGlvbnMubW9ycGguX19pZkNhY2hlID0gY29uZGl0aW9uO1xuXG4gIC8vIFJlbmRlciB0aGUgYXByb3ByZWF0ZSBibG9jayBzdGF0ZW1lbnRcbiAgaWYoY29uZGl0aW9uICYmIG9wdGlvbnMudGVtcGxhdGUpe1xuICAgIHJldHVybiBvcHRpb25zLnRlbXBsYXRlLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIGVudiwgb3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCk7XG4gIH1cbiAgZWxzZSBpZighY29uZGl0aW9uICYmIG9wdGlvbnMuaW52ZXJzZSl7XG4gICAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZS5yZW5kZXIob3B0aW9ucy5jb250ZXh0LCBlbnYsIG9wdGlvbnMubW9ycGguY29udGV4dHVhbEVsZW1lbnQpO1xuICB9XG5cbiAgcmV0dXJuICcnO1xufTtcblxuXG4vLyBUT0RPOiBQcm94eSB0byBpZiBoZWxwZXIgd2l0aCBpbnZlcnRlZCBwYXJhbXNcbmhlbHBlcnMudW5sZXNzID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuICB2YXIgY29uZGl0aW9uID0gcGFyYW1zWzBdO1xuXG4gIGlmKGNvbmRpdGlvbiA9PT0gdW5kZWZpbmVkIHx8IGNvbmRpdGlvbiA9PT0gbnVsbCl7XG4gICAgY29uZGl0aW9uID0gZmFsc2U7XG4gIH1cblxuICBpZihjb25kaXRpb24uaXNNb2RlbCl7XG4gICAgY29uZGl0aW9uID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIElmIG91ciBjb25kaXRpb24gaXMgYW4gYXJyYXksIGhhbmRsZSBwcm9wZXJseVxuICBpZihfLmlzQXJyYXkoY29uZGl0aW9uKSB8fCBjb25kaXRpb24uaXNDb2xsZWN0aW9uKXtcbiAgICBjb25kaXRpb24gPSBjb25kaXRpb24ubGVuZ3RoID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG5cbiAgLy8gSWYgbW9yZSB0aGFuIG9uZSBwYXJhbSwgdGhpcyBpcyBub3QgYSBibG9jayBoZWxwZXIuIEV2YWwgYXMgc3VjaC5cbiAgaWYocGFyYW1zLmxlbmd0aCA+IDEpe1xuICAgIHJldHVybiAoIWNvbmRpdGlvbikgPyBwYXJhbXNbMV0gOiAoIHBhcmFtc1syXSB8fCAnJyk7XG4gIH1cblxuICAvLyBDaGVjayBvdXIgY2FjaGUuIElmIHRoZSB2YWx1ZSBoYXNuJ3QgYWN0dWFsbHkgY2hhbmdlZCwgZG9uJ3QgZXZhbHVhdGUuIEltcG9ydGFudCBmb3IgcmUtcmVuZGVyaW5nIG9mICNlYWNoIGhlbHBlcnMuXG4gIGlmKG9wdGlvbnMubW9ycGguX191bmxlc3NDYWNoZSA9PT0gY29uZGl0aW9uKXtcbiAgICByZXR1cm4gbnVsbDsgLy8gUmV0dXJuIG51bGwgcHJldmVudCdzIHJlLXJlbmRpbmcgb2Ygb3VyIHBsYWNlaG9sZGVyLlxuICB9XG5cbiAgb3B0aW9ucy5tb3JwaC5fX3VubGVzc0NhY2hlID0gY29uZGl0aW9uO1xuXG4gIC8vIFJlbmRlciB0aGUgYXByb3ByZWF0ZSBibG9jayBzdGF0ZW1lbnRcbiAgaWYoIWNvbmRpdGlvbiAmJiAgb3B0aW9ucy50ZW1wbGF0ZSl7XG4gICAgcmV0dXJuIG9wdGlvbnMudGVtcGxhdGUucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgZW52LCBvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50KTtcbiAgfVxuICBlbHNlIGlmKGNvbmRpdGlvbiAmJiBvcHRpb25zLmludmVyc2Upe1xuICAgIHJldHVybiBvcHRpb25zLmludmVyc2UucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgZW52LCBvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50KTtcbiAgfVxuXG4gIHJldHVybiAnJztcbn07XG5cbi8vIEdpdmVuIGFuIGFycmF5LCBwcmVkaWNhdGUgYW5kIG9wdGlvbmFsIGV4dHJhIHZhcmlhYmxlLCBmaW5kcyB0aGUgaW5kZXggaW4gdGhlIGFycmF5IHdoZXJlIHByZWRpY2F0ZSBpcyB0cnVlXG5mdW5jdGlvbiBmaW5kSW5kZXgoYXJyLCBwcmVkaWNhdGUsIGNpZCkge1xuICBpZiAoYXJyID09IG51bGwpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdmaW5kSW5kZXggY2FsbGVkIG9uIG51bGwgb3IgdW5kZWZpbmVkJyk7XG4gIH1cbiAgaWYgKHR5cGVvZiBwcmVkaWNhdGUgIT09ICdmdW5jdGlvbicpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdwcmVkaWNhdGUgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG4gIH1cbiAgdmFyIGxpc3QgPSBPYmplY3QoYXJyKTtcbiAgdmFyIGxlbmd0aCA9IGxpc3QubGVuZ3RoID4+PiAwO1xuICB2YXIgdGhpc0FyZyA9IGFyZ3VtZW50c1sxXTtcbiAgdmFyIHZhbHVlO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICB2YWx1ZSA9IGxpc3RbaV07XG4gICAgaWYgKHByZWRpY2F0ZS5jYWxsKHRoaXNBcmcsIHZhbHVlLCBpLCBsaXN0LCBjaWQpKSB7XG4gICAgICByZXR1cm4gaTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIC0xO1xufVxuXG5oZWxwZXJzLmVhY2ggPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG5cbiAgaWYoXy5pc051bGwocGFyYW1zWzBdKSB8fCBfLmlzVW5kZWZpbmVkKHBhcmFtc1swXSkpeyBjb25zb2xlLndhcm4oJ1VuZGVmaW5lZCB2YWx1ZSBwYXNzZWQgdG8gZWFjaCBoZWxwZXIhIE1heWJlIHRyeSBwcm92aWRpbmcgYSBkZWZhdWx0IHZhbHVlPycsIG9wdGlvbnMuY29udGV4dCk7IHJldHVybiBudWxsOyB9XG5cbiAgdmFyIHZhbHVlID0gKHBhcmFtc1swXS5pc0NvbGxlY3Rpb24pID8gcGFyYW1zWzBdLm1vZGVscyA6IHBhcmFtc1swXSwgLy8gQWNjZXB0cyBjb2xsZWN0aW9ucyBvciBhcnJheXNcbiAgICAgIG1vcnBoID0gb3B0aW9ucy5tb3JwaC5maXJzdENoaWxkTW9ycGgsIG9iaiwgbmV4dCwgbGF6eVZhbHVlLCBubW9ycGgsIGksICAvLyB1c2VkIGJlbG93IHRvIHJlbW92ZSB0cmFpbGluZyBqdW5rIG1vcnBocyBmcm9tIHRoZSBkb21cbiAgICAgIHBvc2l0aW9uLCAvLyBTdG9yZXMgdGhlIGl0ZXJhdGVkIGVsZW1lbnQncyBpbnRlZ2VyIHBvc2l0aW9uIGluIHRoZSBkb20gbGlzdFxuICAgICAgY3VycmVudE1vZGVsID0gZnVuY3Rpb24oZWxlbWVudCwgaW5kZXgsIGFycmF5LCBjaWQpe1xuICAgICAgICByZXR1cm4gZWxlbWVudC5jaWQgPT09IGNpZDsgLy8gUmV0dXJucyB0cnVlIGlmIGN1cnJlbnRseSBvYnNlcnZlZCBlbGVtZW50IGlzIHRoZSBjdXJyZW50IG1vZGVsLlxuICAgICAgfTtcblxuICBpZigoIV8uaXNBcnJheSh2YWx1ZSkgfHwgdmFsdWUubGVuZ3RoID09PSAwKSAmJiBvcHRpb25zLmludmVyc2Upe1xuICAgIHJldHVybiBvcHRpb25zLmludmVyc2UucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgZW52LCBvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50KTtcbiAgfVxuXG4gIC8vIEZvciBlYWNoIGl0ZW0gaW4gdGhpcyBjb2xsZWN0aW9uXG4gIGZvcihpPTA7aSA8IHZhbHVlLmxlbmd0aDtpKyspe1xuICAgIG9iaiA9IHZhbHVlW2ldO1xuICAgIG5leHQgPSAobW9ycGgpID8gbW9ycGgubmV4dE1vcnBoIDogbnVsbDtcblxuICAgIC8vIElmIHRoaXMgbW9ycGggaXMgdGhlIHJlbmRlcmVkIHZlcnNpb24gb2YgdGhpcyBtb2RlbCwgY29udGludWUgdG8gdGhlIG5leHQgb25lLlxuICAgIGlmKG1vcnBoICYmIG1vcnBoLmNpZCA9PSBvYmouY2lkKXsgbW9ycGggPSBuZXh0OyBjb250aW51ZTsgfVxuXG4gICAgbm1vcnBoID0gb3B0aW9ucy5tb3JwaC5pbnNlcnRDb250ZW50QmVmb3JlTW9ycGgoJycsIG1vcnBoKTtcblxuICAgIC8vIENyZWF0ZSBhIGxhenl2YWx1ZSB3aG9zIHZhbHVlIGlzIHRoZSBjb250ZW50IGluc2lkZSBvdXIgYmxvY2sgaGVscGVyIHJlbmRlcmVkIGluIHRoZSBjb250ZXh0IG9mIHRoaXMgY3VycmVudCBsaXN0IG9iamVjdC4gUmV0dXJucyB0aGUgcmVuZGVyZWQgZG9tIGZvciB0aGlzIGxpc3QgaXRlbS5cbiAgICBsYXp5VmFsdWUgPSBuZXcgTGF6eVZhbHVlKGZ1bmN0aW9uKCl7XG4gICAgICByZXR1cm4gb3B0aW9ucy50ZW1wbGF0ZS5yZW5kZXIob3B0aW9ucy5jb250ZXh0LCBlbnYsIG9wdGlvbnMubW9ycGguY29udGV4dHVhbEVsZW1lbnQsIFtvYmpdKTtcbiAgICB9LCB7bW9ycGg6IG9wdGlvbnMubW9ycGh9KTtcblxuICAgIC8vIEluc2VydCBvdXIgbmV3bHkgcmVuZGVyZWQgdmFsdWUgKGEgZG9jdW1lbnQgdHJlZSkgaW50byBvdXIgcGxhY2Vob2xkZXIgKHRoZSBjb250YWluaW5nIGVsZW1lbnQpIGF0IGl0cyByZXF1ZXN0ZWQgcG9zaXRpb24gKHdoZXJlIHdlIGN1cnJlbnRseSBhcmUgaW4gdGhlIG9iamVjdCBsaXN0KVxuICAgIG5tb3JwaC5zZXRDb250ZW50KGxhenlWYWx1ZS52YWx1ZSgpKTtcblxuICAgIC8vIExhYmVsIHRoZSBpbnNlcnRlZCBtb3JwaCBlbGVtZW50IHdpdGggdGhpcyBtb2RlbCdzIGNpZFxuICAgIG5tb3JwaC5jaWQgPSBvYmouY2lkO1xuXG4gICAgLy8gRGVzdHJveSB0aGUgb2xkIG1vcnBoIHRoYXQgd2FzIGhlcmVcbiAgICBtb3JwaCAmJiBtb3JwaC5kZXN0cm95KCk7XG5cbiAgICAvLyBNb3ZlIG9uIHRvIHRoZSBuZXh0IG1vcnBoXG4gICAgbW9ycGggPSBuZXh0O1xuICB9XG5cbiAgLy8gSWYgYW55IG1vcmUgbW9ycGhzIGFyZSBsZWZ0IG92ZXIsIHJlbW92ZSB0aGVtLiBXZSd2ZSBhbHJlYWR5IGdvbmUgdGhyb3VnaCBhbGwgdGhlIG1vZGVscy5cbiAgd2hpbGUobW9ycGgpe1xuICAgIG5leHQgPSBtb3JwaC5uZXh0TW9ycGg7XG4gICAgbW9ycGguZGVzdHJveSgpO1xuICAgIG1vcnBoID0gbmV4dDtcbiAgfVxuXG4gIC8vIFJldHVybiBudWxsIHByZXZlbnQncyByZS1yZW5kaW5nIG9mIG91ciBwbGFjZWhvbGRlci4gT3VyIHBsYWNlaG9sZGVyIChjb250YWluaW5nIGVsZW1lbnQpIG5vdyBoYXMgYWxsIHRoZSBkb20gd2UgbmVlZC5cbiAgcmV0dXJuIG51bGw7XG5cbn07XG5cbmhlbHBlcnMucGFydGlhbCA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcbiAgdmFyIHBhcnRpYWwgPSBwYXJ0aWFsc1twYXJhbXNbMF1dO1xuICBpZiggcGFydGlhbCAmJiBwYXJ0aWFsLmlzSFRNTEJhcnMgKXtcbiAgICByZXR1cm4gcGFydGlhbC5yZW5kZXIob3B0aW9ucy5jb250ZXh0LCBlbnYpO1xuICB9XG5cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGhlbHBlcnM7XG4iLCIvLyBSZWJvdW5kIENvbXB1dGVkIFByb3BlcnR5XG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCBwcm9wZXJ0eUNvbXBpbGVyIGZyb20gXCJwcm9wZXJ0eS1jb21waWxlci9wcm9wZXJ0eS1jb21waWxlclwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cbi8vIFJldHVybnMgdHJ1ZSBpZiBzdHIgc3RhcnRzIHdpdGggdGVzdFxuZnVuY3Rpb24gc3RhcnRzV2l0aChzdHIsIHRlc3Qpe1xuICBpZihzdHIgPT09IHRlc3QpIHJldHVybiB0cnVlO1xuICByZXR1cm4gc3RyLnN1YnN0cmluZygwLCB0ZXN0Lmxlbmd0aCsxKSA9PT0gdGVzdCsnLic7XG59XG5cblxuLy8gQ2FsbGVkIGFmdGVyIGNhbGxzdGFjayBpcyBleGF1c3RlZCB0byBjYWxsIGFsbCBvZiB0aGlzIGNvbXB1dGVkIHByb3BlcnR5J3Ncbi8vIGRlcGVuZGFudHMgdGhhdCBuZWVkIHRvIGJlIHJlY29tcHV0ZWRcbmZ1bmN0aW9uIHJlY29tcHV0ZUNhbGxiYWNrKCl7XG4gIHZhciBpID0gMCwgbGVuID0gdGhpcy5fdG9DYWxsLmxlbmd0aDtcbiAgZGVsZXRlIHRoaXMuX3JlY29tcHV0ZVRpbWVvdXQ7XG4gIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICB0aGlzLl90b0NhbGwuc2hpZnQoKS5jYWxsKCk7XG4gIH1cbiAgdGhpcy5fdG9DYWxsLmFkZGVkID0ge307XG59XG5cbnZhciBDb21wdXRlZFByb3BlcnR5ID0gZnVuY3Rpb24ocHJvcCwgb3B0aW9ucyl7XG5cbiAgaWYoIV8uaXNGdW5jdGlvbihwcm9wKSkgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0NvbXB1dGVkUHJvcGVydHkgY29uc3RydWN0b3IgbXVzdCBiZSBwYXNzZWQgYSBmdW5jdGlvbiEnLCBwcm9wLCAnRm91bmQgaW5zdGVhZC4nKTtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMuY2lkID0gXy51bmlxdWVJZCgnY29tcHV0ZWRQcm9wZXR5Jyk7XG4gIHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgdGhpcy5yZXR1cm5UeXBlID0gbnVsbDtcbiAgdGhpcy5fX29ic2VydmVycyA9IHt9O1xuICB0aGlzLmhlbHBlcnMgPSB7fTtcbiAgdGhpcy53YWl0aW5nID0ge307XG4gIHRoaXMuaXNDaGFuZ2luZyA9IGZhbHNlO1xuICB0aGlzLmlzRGlydHkgPSB0cnVlO1xuICB0aGlzLmZ1bmMgPSBwcm9wO1xuICBfLmJpbmRBbGwodGhpcywgJ29uTW9kaWZ5JywgJ21hcmtEaXJ0eScpO1xuICB0aGlzLmRlcHMgPSBwcm9wZXJ0eUNvbXBpbGVyLmNvbXBpbGUocHJvcCwgdGhpcy5uYW1lKTtcblxuICAvLyBDcmVhdGUgbGluZWFnZSB0byBwYXNzIHRvIG91ciBjYWNoZSBvYmplY3RzXG4gIHZhciBsaW5lYWdlID0ge1xuICAgIHBhcmVudDogdGhpcy5zZXRQYXJlbnQoIG9wdGlvbnMucGFyZW50IHx8IHRoaXMgKSxcbiAgICByb290OiB0aGlzLnNldFJvb3QoIG9wdGlvbnMucm9vdCB8fCBvcHRpb25zLnBhcmVudCB8fCB0aGlzICksXG4gICAgcGF0aDogdGhpcy5fX3BhdGggPSBvcHRpb25zLnBhdGggfHwgdGhpcy5fX3BhdGhcbiAgfTtcblxuICAvLyBSZXN1bHRzIENhY2hlIE9iamVjdHNcbiAgLy8gVGhlc2UgbW9kZWxzIHdpbGwgbmV2ZXIgYmUgcmUtY3JlYXRlZCBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBDb21wdXRlZCBQcm9lcHJ0eVxuICAvLyBPbiBSZWNvbXB1dGUgdGhleSBhcmUgdXBkYXRlZCB3aXRoIG5ldyB2YWx1ZXMuXG4gIC8vIE9uIENoYW5nZSB0aGVpciBuZXcgdmFsdWVzIGFyZSBwdXNoZWQgdG8gdGhlIG9iamVjdCBpdCBpcyB0cmFja2luZ1xuICB0aGlzLmNhY2hlID0ge1xuICAgIG1vZGVsOiBuZXcgUmVib3VuZC5Nb2RlbCh7fSwgbGluZWFnZSksXG4gICAgY29sbGVjdGlvbjogbmV3IFJlYm91bmQuQ29sbGVjdGlvbihbXSwgbGluZWFnZSksXG4gICAgdmFsdWU6IHVuZGVmaW5lZFxuICB9O1xuXG4gIHRoaXMud2lyZSgpO1xuXG59O1xuXG5fLmV4dGVuZChDb21wdXRlZFByb3BlcnR5LnByb3RvdHlwZSwgQmFja2JvbmUuRXZlbnRzLCB7XG5cbiAgaXNDb21wdXRlZFByb3BlcnR5OiB0cnVlLFxuICBpc0RhdGE6IHRydWUsXG4gIF9fcGF0aDogZnVuY3Rpb24oKXsgcmV0dXJuICcnOyB9LFxuXG5cbiAgbWFya0RpcnR5OiBmdW5jdGlvbigpe1xuICAgIGlmKHRoaXMuaXNEaXJ0eSkgcmV0dXJuO1xuICAgIHRoaXMuaXNEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy50cmlnZ2VyKCdkaXJ0eScsIHRoaXMpO1xuICB9LFxuXG4gIC8vIEF0dGFjaGVkIHRvIGxpc3RlbiB0byBhbGwgZXZlbnRzIHdoZXJlIHRoaXMgQ29tcHV0ZWQgUHJvcGVydHkncyBkZXBlbmRhbmNpZXNcbiAgLy8gYXJlIHN0b3JlZC4gU2VlIHdpcmUoKS4gV2lsbCByZS1ldmFsdWF0ZSBhbnkgY29tcHV0ZWQgcHJvcGVydGllcyB0aGF0XG4gIC8vIGRlcGVuZCBvbiB0aGUgY2hhbmdlZCBkYXRhIHZhbHVlIHdoaWNoIHRyaWdnZXJlZCB0aGlzIGNhbGxiYWNrLlxuICBvblJlY29tcHV0ZTogZnVuY3Rpb24odHlwZSwgbW9kZWwsIGNvbGxlY3Rpb24sIG9wdGlvbnMpe1xuICAgIHZhciBzaG9ydGNpcmN1aXQgPSB7IGNoYW5nZTogMSwgc29ydDogMSwgcmVxdWVzdDogMSwgZGVzdHJveTogMSwgc3luYzogMSwgZXJyb3I6IDEsIGludmFsaWQ6IDEsIHJvdXRlOiAxLCBkaXJ0eTogMSB9O1xuICAgIGlmKCBzaG9ydGNpcmN1aXRbdHlwZV0gfHwgIW1vZGVsLmlzRGF0YSApIHJldHVybjtcbiAgICBtb2RlbCB8fCAobW9kZWwgPSB7fSk7XG4gICAgY29sbGVjdGlvbiB8fCAoY29sbGVjdGlvbiA9IHt9KTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHRoaXMuX3RvQ2FsbCB8fCAodGhpcy5fdG9DYWxsID0gW10pO1xuICAgIHRoaXMuX3RvQ2FsbC5hZGRlZCB8fCAodGhpcy5fdG9DYWxsLmFkZGVkID0ge30pO1xuICAgICFjb2xsZWN0aW9uLmlzRGF0YSAmJiAob3B0aW9ucyA9IGNvbGxlY3Rpb24pICYmIChjb2xsZWN0aW9uID0gbW9kZWwpO1xuICAgIHZhciBwdXNoID0gZnVuY3Rpb24oYXJyKXtcbiAgICAgIHZhciBpLCBsZW4gPSBhcnIubGVuZ3RoO1xuICAgICAgdGhpcy5hZGRlZCB8fCAodGhpcy5hZGRlZCA9IHt9KTtcbiAgICAgIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICAgICAgaWYodGhpcy5hZGRlZFthcnJbaV0uY2lkXSkgY29udGludWU7XG4gICAgICAgIHRoaXMuYWRkZWRbYXJyW2ldLmNpZF0gPSAxO1xuICAgICAgICB0aGlzLnB1c2goYXJyW2ldKTtcbiAgICAgIH1cbiAgICB9LCBwYXRoLCB2ZWN0b3I7XG4gICAgdmVjdG9yID0gcGF0aCA9IGNvbGxlY3Rpb24uX19wYXRoKCkucmVwbGFjZSgvXFwuP1xcWy4qXFxdL2lnLCAnLkBlYWNoJyk7XG5cbiAgICAvLyBJZiBhIHJlc2V0IGV2ZW50IG9uIGEgTW9kZWwsIGNoZWNrIGZvciBjb21wdXRlZCBwcm9wZXJ0aWVzIHRoYXQgZGVwZW5kXG4gICAgLy8gb24gZWFjaCBjaGFuZ2VkIGF0dHJpYnV0ZSdzIGZ1bGwgcGF0aC5cbiAgICBpZih0eXBlID09PSAncmVzZXQnICYmIG9wdGlvbnMucHJldmlvdXNBdHRyaWJ1dGVzKXtcbiAgICAgIF8uZWFjaChvcHRpb25zLnByZXZpb3VzQXR0cmlidXRlcywgZnVuY3Rpb24odmFsdWUsIGtleSl7XG4gICAgICAgIHZlY3RvciA9IHBhdGggKyAocGF0aCAmJiAnLicpICsga2V5O1xuICAgICAgICBfLmVhY2godGhpcy5fX2NvbXB1dGVkRGVwcywgZnVuY3Rpb24oZGVwZW5kYW50cywgZGVwZW5kYW5jeSl7XG4gICAgICAgICAgc3RhcnRzV2l0aCh2ZWN0b3IsIGRlcGVuZGFuY3kpICYmIHB1c2guY2FsbCh0aGlzLl90b0NhbGwsIGRlcGVuZGFudHMpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8vIElmIGEgcmVzZXQgZXZlbnQgb24gYSBDb2xsY3Rpb24sIGNoZWNrIGZvciBjb21wdXRlZCBwcm9wZXJ0aWVzIHRoYXQgZGVwZW5kXG4gICAgLy8gb24gYW55dGhpbmcgaW5zaWRlIHRoYXQgY29sbGVjdGlvbi5cbiAgICBlbHNlIGlmKHR5cGUgPT09ICdyZXNldCcgJiYgb3B0aW9ucy5wcmV2aW91c01vZGVscyl7XG4gICAgICBfLmVhY2godGhpcy5fX2NvbXB1dGVkRGVwcywgZnVuY3Rpb24oZGVwZW5kYW50cywgZGVwZW5kYW5jeSl7XG4gICAgICAgIHN0YXJ0c1dpdGgoZGVwZW5kYW5jeSwgdmVjdG9yKSAmJiBwdXNoLmNhbGwodGhpcy5fdG9DYWxsLCBkZXBlbmRhbnRzKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8vIElmIGFuIGFkZCBvciByZW1vdmUgZXZlbnQsIGNoZWNrIGZvciBjb21wdXRlZCBwcm9wZXJ0aWVzIHRoYXQgZGVwZW5kIG9uXG4gICAgLy8gYW55dGhpbmcgaW5zaWRlIHRoYXQgY29sbGVjdGlvbiBvciB0aGF0IGNvbnRhaW5zIHRoYXQgY29sbGVjdGlvbi5cbiAgICBlbHNlIGlmKHR5cGUgPT09ICdhZGQnIHx8IHR5cGUgPT09ICdyZW1vdmUnKXtcbiAgICAgIF8uZWFjaCh0aGlzLl9fY29tcHV0ZWREZXBzLCBmdW5jdGlvbihkZXBlbmRhbnRzLCBkZXBlbmRhbmN5KXtcbiAgICAgICAgaWYoIHN0YXJ0c1dpdGgoZGVwZW5kYW5jeSwgdmVjdG9yKSB8fCBzdGFydHNXaXRoKHZlY3RvciwgZGVwZW5kYW5jeSkgKSBwdXNoLmNhbGwodGhpcy5fdG9DYWxsLCBkZXBlbmRhbnRzKTs7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhIGNoYW5nZSBldmVudCwgdHJpZ2dlciBhbnl0aGluZyB0aGF0IGRlcGVuZHMgb24gdGhhdCBjaGFuZ2VkIHBhdGguXG4gICAgZWxzZSBpZih0eXBlLmluZGV4T2YoJ2NoYW5nZTonKSA9PT0gMCl7XG4gICAgICB2ZWN0b3IgPSB0eXBlLnJlcGxhY2UoJ2NoYW5nZTonLCAnJykucmVwbGFjZSgvXFwuP1xcWy4qXFxdL2lnLCAnLkBlYWNoJyk7XG4gICAgICBfLmVhY2godGhpcy5fX2NvbXB1dGVkRGVwcywgZnVuY3Rpb24oZGVwZW5kYW50cywgZGVwZW5kYW5jeSl7XG4gICAgICAgIHN0YXJ0c1dpdGgodmVjdG9yLCBkZXBlbmRhbmN5KSAmJiBwdXNoLmNhbGwodGhpcy5fdG9DYWxsLCBkZXBlbmRhbnRzKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIHZhciBpLCBsZW4gPSB0aGlzLl90b0NhbGwubGVuZ3RoO1xuICAgIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICAgIHRoaXMuX3RvQ2FsbFtpXS5tYXJrRGlydHkoKTtcbiAgICB9XG5cbiAgICAvLyBOb3RpZmllcyBhbGwgY29tcHV0ZWQgcHJvcGVydGllcyBpbiB0aGUgZGVwZW5kYW50cyBhcnJheSB0byByZWNvbXB1dGUuXG4gICAgLy8gTWFya3MgZXZlcnlvbmUgYXMgZGlydHkgYW5kIHRoZW4gY2FsbHMgdGhlbS5cbiAgICBpZighdGhpcy5fcmVjb21wdXRlVGltZW91dCkgdGhpcy5fcmVjb21wdXRlVGltZW91dCA9IHNldFRpbWVvdXQoXy5iaW5kKHJlY29tcHV0ZUNhbGxiYWNrLCB0aGlzKSwgMCk7XG4gICAgcmV0dXJuO1xuICB9LFxuXG5cbiAgLy8gQ2FsbGVkIHdoZW4gYSBDb21wdXRlZCBQcm9wZXJ0eSdzIGFjdGl2ZSBjYWNoZSBvYmplY3QgY2hhbmdlcy5cbiAgLy8gUHVzaGVzIGFueSBjaGFuZ2VzIHRvIENvbXB1dGVkIFByb3BlcnR5IHRoYXQgcmV0dXJucyBhIGRhdGEgb2JqZWN0IGJhY2sgdG9cbiAgLy8gdGhlIG9yaWdpbmFsIG9iamVjdC5cbiAgb25Nb2RpZnk6IGZ1bmN0aW9uKHR5cGUsIG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKXtcbiAgICB2YXIgc2hvcnRjaXJjdWl0ID0geyBzb3J0OiAxLCByZXF1ZXN0OiAxLCBkZXN0cm95OiAxLCBzeW5jOiAxLCBlcnJvcjogMSwgaW52YWxpZDogMSwgcm91dGU6IDEgfTtcbiAgICBpZiggIXRoaXMudHJhY2tpbmcgfHwgc2hvcnRjaXJjdWl0W3R5cGVdIHx8IH50eXBlLmluZGV4T2YoJ2NoYW5nZTonKSApIHJldHVybjtcbiAgICBtb2RlbCB8fCAobW9kZWwgPSB7fSk7XG4gICAgY29sbGVjdGlvbiB8fCAoY29sbGVjdGlvbiA9IHt9KTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgICFjb2xsZWN0aW9uLmlzRGF0YSAmJiBfLmlzT2JqZWN0KGNvbGxlY3Rpb24pICYmIChvcHRpb25zID0gY29sbGVjdGlvbikgJiYgKGNvbGxlY3Rpb24gPSBtb2RlbCk7XG4gICAgdmFyIHNyYyA9IHRoaXM7XG4gICAgdmFyIHBhdGggPSBjb2xsZWN0aW9uLl9fcGF0aCgpLnJlcGxhY2Uoc3JjLl9fcGF0aCgpLCAnJykucmVwbGFjZSgvXlxcLi8sICcnKTtcbiAgICB2YXIgZGVzdCA9IHRoaXMudHJhY2tpbmcuZ2V0KHBhdGgpO1xuXG4gICAgaWYoXy5pc1VuZGVmaW5lZChkZXN0KSkgcmV0dXJuO1xuICAgIGlmKHR5cGUgPT09ICdjaGFuZ2UnKSBkZXN0LnNldCAmJiBkZXN0LnNldChtb2RlbC5jaGFuZ2VkQXR0cmlidXRlcygpKTtcbiAgICBlbHNlIGlmKHR5cGUgPT09ICdyZXNldCcpIGRlc3QucmVzZXQgJiYgZGVzdC5yZXNldChtb2RlbCk7XG4gICAgZWxzZSBpZih0eXBlID09PSAnYWRkJykgIGRlc3QuYWRkICYmIGRlc3QuYWRkKG1vZGVsKTtcbiAgICBlbHNlIGlmKHR5cGUgPT09ICdyZW1vdmUnKSAgZGVzdC5yZW1vdmUgJiYgZGVzdC5yZW1vdmUobW9kZWwpO1xuICAgIC8vIFRPRE86IEFkZCBzb3J0XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGxpdGVuZXIgdG8gdGhlIHJvb3Qgb2JqZWN0IGFuZCB0ZWxscyBpdCB3aGF0IHByb3BlcnRpZXMgdGhpc1xuICAvLyBDb21wdXRlZCBQcm9wZXJ0eSBkZXBlbmQgb24uXG4gIC8vIFRoZSBsaXN0ZW5lciB3aWxsIHJlLWNvbXB1dGUgdGhpcyBDb21wdXRlZCBQcm9wZXJ0eSB3aGVuIGFueSBhcmUgY2hhbmdlZC5cbiAgd2lyZTogZnVuY3Rpb24oKXtcbiAgICB2YXIgcm9vdCA9IHRoaXMuX19yb290X187XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLl9fcGFyZW50X187XG4gICAgcm9vdC5fX2NvbXB1dGVkRGVwcyB8fCAocm9vdC5fX2NvbXB1dGVkRGVwcyA9IHt9KTtcblxuICAgIF8uZWFjaCh0aGlzLmRlcHMsIGZ1bmN0aW9uKHBhdGgpe1xuICAgICAgdmFyIGRlcCA9IHJvb3QuZ2V0KHBhdGgsIHtyYXc6IHRydWV9KTtcbiAgICAgIGlmKCFkZXAgfHwgIWRlcC5pc0NvbXB1dGVkUHJvcGVydHkpIHJldHVybjtcbiAgICAgIGRlcC5vbignZGlydHknLCB0aGlzLm1hcmtEaXJ0eSk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICBfLmVhY2godGhpcy5kZXBzLCBmdW5jdGlvbihwYXRoKXtcbiAgICAgIC8vIEZpbmQgYWN0dWFsIHBhdGggZnJvbSByZWxhdGl2ZSBwYXRoc1xuICAgICAgdmFyIHNwbGl0ID0gJC5zcGxpdFBhdGgocGF0aCk7XG4gICAgICB3aGlsZShzcGxpdFswXSA9PT0gJ0BwYXJlbnQnKXtcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQuX19wYXJlbnRfXztcbiAgICAgICAgc3BsaXQuc2hpZnQoKTtcbiAgICAgIH1cblxuICAgICAgcGF0aCA9IGNvbnRleHQuX19wYXRoKCkucmVwbGFjZSgvXFwuP1xcWy4qXFxdL2lnLCAnLkBlYWNoJyk7XG4gICAgICBwYXRoID0gcGF0aCArIChwYXRoICYmICcuJykgKyBzcGxpdC5qb2luKCcuJyk7XG5cbiAgICAgIC8vIEFkZCBvdXJzZWx2ZXMgYXMgZGVwZW5kYW50c1xuICAgICAgcm9vdC5fX2NvbXB1dGVkRGVwc1twYXRoXSB8fCAocm9vdC5fX2NvbXB1dGVkRGVwc1twYXRoXSA9IFtdKTtcbiAgICAgIHJvb3QuX19jb21wdXRlZERlcHNbcGF0aF0ucHVzaCh0aGlzKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIC8vIEVuc3VyZSB3ZSBvbmx5IGhhdmUgb25lIGxpc3RlbmVyIHBlciBNb2RlbCBhdCBhIHRpbWUuXG4gICAgY29udGV4dC5vZmYoJ2FsbCcsIHRoaXMub25SZWNvbXB1dGUpLm9uKCdhbGwnLCB0aGlzLm9uUmVjb21wdXRlKTtcbiAgfSxcblxuICB1bndpcmU6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHJvb3QgPSB0aGlzLl9fcm9vdF9fO1xuICAgIHZhciBjb250ZXh0ID0gdGhpcy5fX3BhcmVudF9fO1xuXG4gICAgXy5lYWNoKHRoaXMuZGVwcywgZnVuY3Rpb24ocGF0aCl7XG4gICAgICB2YXIgZGVwID0gcm9vdC5nZXQocGF0aCwge3JhdzogdHJ1ZX0pO1xuICAgICAgaWYoIWRlcCB8fCAhZGVwLmlzQ29tcHV0ZWRQcm9wZXJ0eSkgcmV0dXJuO1xuICAgICAgZGVwLm9mZignZGlydHknLCB0aGlzLm1hcmtEaXJ0eSk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICBjb250ZXh0Lm9mZignYWxsJywgdGhpcy5vblJlY29tcHV0ZSk7XG4gIH0sXG5cbiAgLy8gQ2FsbCB0aGlzIGNvbXB1dGVkIHByb3BlcnR5IGxpa2UgeW91IHdvdWxkIHdpdGggRnVuY3Rpb24uY2FsbCgpXG4gIGNhbGw6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICBjb250ZXh0ID0gYXJncy5zaGlmdCgpO1xuICAgIHJldHVybiB0aGlzLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICB9LFxuXG4gIC8vIENhbGwgdGhpcyBjb21wdXRlZCBwcm9wZXJ0eSBsaWtlIHlvdSB3b3VsZCB3aXRoIEZ1bmN0aW9uLmFwcGx5KClcbiAgLy8gT25seSBwcm9wZXJ0aWVzIHRoYXQgYXJlIG1hcmtlZCBhcyBkaXJ0eSBhbmQgYXJlIG5vdCBhbHJlYWR5IGNvbXB1dGluZ1xuICAvLyB0aGVtc2VsdmVzIGFyZSBldmFsdWF0ZWQgdG8gcHJldmVudCBjeWNsaWMgY2FsbGJhY2tzLiBJZiBhbnkgZGVwZW5kYW50c1xuICAvLyBhcmVuJ3QgZmluaXNoZWQgY29tcHV0ZWRpbmcsIHdlIGFkZCBvdXJzZWx2ZWQgdG8gdGhlaXIgd2FpdGluZyBsaXN0LlxuICAvLyBWYW5pbGxhIG9iamVjdHMgcmV0dXJuZWQgZnJvbSB0aGUgZnVuY3Rpb24gYXJlIHByb21vdGVkIHRvIFJlYm91bmQgT2JqZWN0cy5cbiAgLy8gVGhlbiwgc2V0IHRoZSBwcm9wZXIgcmV0dXJuIHR5cGUgZm9yIGZ1dHVyZSBmZXRjaGVzIGZyb20gdGhlIGNhY2hlIGFuZCBzZXRcbiAgLy8gdGhlIG5ldyBjb21wdXRlZCB2YWx1ZS4gVHJhY2sgY2hhbmdlcyB0byB0aGUgY2FjaGUgdG8gcHVzaCBpdCBiYWNrIHVwIHRvXG4gIC8vIHRoZSBvcmlnaW5hbCBvYmplY3QgYW5kIHJldHVybiB0aGUgdmFsdWUuXG4gIGFwcGx5OiBmdW5jdGlvbihjb250ZXh0LCBwYXJhbXMpe1xuXG4gICAgY29udGV4dCB8fCAoY29udGV4dCA9IHRoaXMuX19wYXJlbnRfXyk7XG5cbiAgICBpZighdGhpcy5pc0RpcnR5IHx8IHRoaXMuaXNDaGFuZ2luZyB8fCAhY29udGV4dCkgcmV0dXJuO1xuICAgIHRoaXMuaXNDaGFuZ2luZyA9IHRydWU7XG5cbiAgICB2YXIgdmFsdWUgPSB0aGlzLmNhY2hlW3RoaXMucmV0dXJuVHlwZV0sXG4gICAgICAgIHJlc3VsdDtcblxuICAgIC8vIENoZWNrIGFsbCBvZiBvdXIgZGVwZW5kYW5jaWVzIHRvIHNlZSBpZiB0aGV5IGFyZSBldmFsdWF0aW5nLlxuICAgIC8vIElmIHdlIGhhdmUgYSBkZXBlbmRhbmN5IHRoYXQgaXMgZGlydHkgYW5kIHRoaXMgaXNudCBpdHMgZmlyc3QgcnVuLFxuICAgIC8vIExldCB0aGlzIGRlcGVuZGFuY3kga25vdyB0aGF0IHdlIGFyZSB3YWl0aW5nIGZvciBpdC5cbiAgICAvLyBJdCB3aWxsIHJlLXJ1biB0aGlzIENvbXB1dGVkIFByb3BlcnR5IGFmdGVyIGl0IGZpbmlzaGVzLlxuICAgIF8uZWFjaCh0aGlzLmRlcHMsIGZ1bmN0aW9uKGRlcCl7XG4gICAgICB2YXIgZGVwZW5kYW5jeSA9IGNvbnRleHQuZ2V0KGRlcCwge3JhdzogdHJ1ZX0pO1xuICAgICAgaWYoIWRlcGVuZGFuY3kgfHwgIWRlcGVuZGFuY3kuaXNDb21wdXRlZFByb3BlcnR5KSByZXR1cm47XG4gICAgICBpZihkZXBlbmRhbmN5LmlzRGlydHkgJiYgZGVwZW5kYW5jeS5yZXR1cm5UeXBlICE9PSBudWxsKXtcbiAgICAgICAgZGVwZW5kYW5jeS53YWl0aW5nW3RoaXMuY2lkXSA9IHRoaXM7XG4gICAgICAgIGRlcGVuZGFuY3kuYXBwbHkoKTsgLy8gVHJ5IHRvIHJlLWV2YWx1YXRlIHRoaXMgZGVwZW5kYW5jeSBpZiBpdCBpcyBkaXJ0eVxuICAgICAgICBpZihkZXBlbmRhbmN5LmlzRGlydHkpIHJldHVybiB0aGlzLmlzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSBkZXBlbmRhbmN5LndhaXRpbmdbdGhpcy5jaWRdO1xuICAgICAgLy8gVE9ETzogVGhlcmUgY2FuIGJlIGEgY2hlY2sgaGVyZSBsb29raW5nIGZvciBjeWNsaWMgZGVwZW5kYW5jaWVzLlxuICAgIH0sIHRoaXMpO1xuXG4gICAgaWYoIXRoaXMuaXNDaGFuZ2luZykgcmV0dXJuO1xuXG4gICAgaWYodGhpcy5yZXR1cm5UeXBlICE9PSAndmFsdWUnKSB0aGlzLnN0b3BMaXN0ZW5pbmcodmFsdWUsICdhbGwnLCB0aGlzLm9uTW9kaWZ5KTtcblxuICAgIHJlc3VsdCA9IHRoaXMuZnVuYy5hcHBseShjb250ZXh0LCBwYXJhbXMpO1xuXG4gICAgLy8gUHJvbW90ZSB2YW5pbGxhIG9iamVjdHMgdG8gUmVib3VuZCBEYXRhIGtlZXBpbmcgdGhlIHNhbWUgb3JpZ2luYWwgb2JqZWN0c1xuICAgIGlmKF8uaXNBcnJheShyZXN1bHQpKSByZXN1bHQgPSBuZXcgUmVib3VuZC5Db2xsZWN0aW9uKHJlc3VsdCwge2Nsb25lOiBmYWxzZX0pO1xuICAgIGVsc2UgaWYoXy5pc09iamVjdChyZXN1bHQpICYmICFyZXN1bHQuaXNEYXRhKSByZXN1bHQgPSBuZXcgUmVib3VuZC5Nb2RlbChyZXN1bHQsIHtjbG9uZTogZmFsc2V9KTtcblxuICAgIC8vIElmIHJlc3VsdCBpcyB1bmRlZmluZWQsIHJlc2V0IG91ciBjYWNoZSBpdGVtXG4gICAgaWYoXy5pc1VuZGVmaW5lZChyZXN1bHQpIHx8IF8uaXNOdWxsKHJlc3VsdCkpe1xuICAgICAgdGhpcy5yZXR1cm5UeXBlID0gJ3ZhbHVlJztcbiAgICAgIHRoaXMuaXNDb2xsZWN0aW9uID0gdGhpcy5pc01vZGVsID0gZmFsc2U7XG4gICAgICB0aGlzLnNldCh1bmRlZmluZWQpO1xuICAgIH1cbiAgICAvLyBTZXQgcmVzdWx0IGFuZCByZXR1cm4gdHlwZXMsIGJpbmQgZXZlbnRzXG4gICAgZWxzZSBpZihyZXN1bHQuaXNDb2xsZWN0aW9uKXtcbiAgICAgIHRoaXMucmV0dXJuVHlwZSA9ICdjb2xsZWN0aW9uJztcbiAgICAgIHRoaXMuaXNDb2xsZWN0aW9uID0gdHJ1ZTtcbiAgICAgIHRoaXMuaXNNb2RlbCA9IGZhbHNlO1xuICAgICAgdGhpcy5zZXQocmVzdWx0KTtcbiAgICAgIHRoaXMudHJhY2socmVzdWx0KTtcbiAgICB9XG4gICAgZWxzZSBpZihyZXN1bHQuaXNNb2RlbCl7XG4gICAgICB0aGlzLnJldHVyblR5cGUgPSAnbW9kZWwnO1xuICAgICAgdGhpcy5pc0NvbGxlY3Rpb24gPSBmYWxzZTtcbiAgICAgIHRoaXMuaXNNb2RlbCA9IHRydWU7XG4gICAgICB0aGlzLnJlc2V0KHJlc3VsdCk7XG4gICAgICB0aGlzLnRyYWNrKHJlc3VsdCk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICB0aGlzLnJldHVyblR5cGUgPSAndmFsdWUnO1xuICAgICAgdGhpcy5pc0NvbGxlY3Rpb24gPSB0aGlzLmlzTW9kZWwgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVzZXQocmVzdWx0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy52YWx1ZSgpO1xuICB9LFxuXG4gIC8vIFdoZW4gd2UgcmVjZWl2ZSBhIG5ldyBtb2RlbCB0byBzZXQgaW4gb3VyIGNhY2hlLCB1bmJpbmQgdGhlIHRyYWNrZXIgZnJvbVxuICAvLyB0aGUgcHJldmlvdXMgY2FjaGUgb2JqZWN0LCBzeW5jIHRoZSBvYmplY3RzJyBjaWRzIHNvIGhlbHBlcnMgdGhpbmsgdGhleVxuICAvLyBhcmUgdGhlIHNhbWUgb2JqZWN0LCBzYXZlIGEgcmVmZXJhbmNlIHRvIHRoZSBvYmplY3Qgd2UgYXJlIHRyYWNraW5nLFxuICAvLyBhbmQgcmUtYmluZCBvdXIgb25Nb2RpZnkgaG9vay5cbiAgdHJhY2s6IGZ1bmN0aW9uKG9iamVjdCl7XG4gICAgdmFyIHRhcmdldCA9IHRoaXMudmFsdWUoKTtcbiAgICBpZighb2JqZWN0IHx8ICF0YXJnZXQgfHwgIXRhcmdldC5pc0RhdGEgfHwgIW9iamVjdC5pc0RhdGEpIHJldHVybjtcbiAgICB0YXJnZXQuX2NpZCB8fCAodGFyZ2V0Ll9jaWQgPSB0YXJnZXQuY2lkKTtcbiAgICBvYmplY3QuX2NpZCB8fCAob2JqZWN0Ll9jaWQgPSBvYmplY3QuY2lkKTtcbiAgICB0YXJnZXQuY2lkID0gb2JqZWN0LmNpZDtcbiAgICB0aGlzLnRyYWNraW5nID0gb2JqZWN0O1xuICAgIHRoaXMubGlzdGVuVG8odGFyZ2V0LCAnYWxsJywgdGhpcy5vbk1vZGlmeSk7XG4gIH0sXG5cbiAgLy8gR2V0IGZyb20gdGhlIENvbXB1dGVkIFByb3BlcnR5J3MgY2FjaGVcbiAgZ2V0OiBmdW5jdGlvbihrZXksIG9wdGlvbnMpe1xuICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWUoKTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIGlmKHRoaXMucmV0dXJuVHlwZSA9PT0gJ3ZhbHVlJykgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0NhbGxlZCBnZXQgb24gdGhlIGAnKyB0aGlzLm5hbWUgKydgIGNvbXB1dGVkIHByb3BlcnR5IHdoaWNoIHJldHVybnMgYSBwcmltaXRpdmUgdmFsdWUuJyk7XG4gICAgcmV0dXJuIHZhbHVlLmdldChrZXksIG9wdGlvbnMpO1xuICB9LFxuXG4gIC8vIFNldCB0aGUgQ29tcHV0ZWQgUHJvcGVydHkncyBjYWNoZSB0byBhIG5ldyB2YWx1ZSBhbmQgdHJpZ2dlciBhcHByb3ByZWF0ZSBldmVudHMuXG4gIC8vIENoYW5nZXMgd2lsbCBwcm9wYWdhdGUgYmFjayB0byB0aGUgb3JpZ2luYWwgb2JqZWN0IGlmIGEgUmVib3VuZCBEYXRhIE9iamVjdCBhbmQgcmUtY29tcHV0ZS5cbiAgLy8gSWYgQ29tcHV0ZWQgUHJvcGVydHkgcmV0dXJucyBhIHZhbHVlLCBhbGwgZG93bnN0cmVhbSBkZXBlbmRhbmNpZXMgd2lsbCByZS1jb21wdXRlLlxuICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsLCBvcHRpb25zKXtcbiAgICBpZih0aGlzLnJldHVyblR5cGUgPT09IG51bGwpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgYXR0cnMgPSBrZXk7XG4gICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZSgpO1xuICAgIGlmKHRoaXMucmV0dXJuVHlwZSA9PT0gJ21vZGVsJyl7XG4gICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgYXR0cnMgPSAoa2V5LmlzTW9kZWwpID8ga2V5LmF0dHJpYnV0ZXMgOiBrZXk7XG4gICAgICAgIG9wdGlvbnMgPSB2YWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoYXR0cnMgPSB7fSlba2V5XSA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYodGhpcy5yZXR1cm5UeXBlICE9PSAnbW9kZWwnKSBvcHRpb25zID0gdmFsIHx8IHt9O1xuICAgIGF0dHJzID0gKGF0dHJzICYmIGF0dHJzLmlzQ29tcHV0ZWRQcm9wZXJ0eSkgPyBhdHRycy52YWx1ZSgpIDogYXR0cnM7XG5cbiAgICAvLyBJZiBhIG5ldyB2YWx1ZSwgc2V0IGl0IGFuZCB0cmlnZ2VyIGV2ZW50c1xuICAgIGlmKHRoaXMucmV0dXJuVHlwZSA9PT0gJ3ZhbHVlJyAmJiB0aGlzLmNhY2hlLnZhbHVlICE9PSBhdHRycyl7XG4gICAgICB0aGlzLmNhY2hlLnZhbHVlID0gYXR0cnM7XG4gICAgICBpZighb3B0aW9ucy5xdWlldCl7XG4gICAgICAgIC8vIElmIHNldCB3YXMgY2FsbGVkIG5vdCB0aHJvdWdoIGNvbXB1dGVkUHJvcGVydHkuY2FsbCgpLCB0aGlzIGlzIGEgZnJlc2ggbmV3IGV2ZW50IGJ1cnN0LlxuICAgICAgICBpZighdGhpcy5pc0RpcnR5ICYmICF0aGlzLmlzQ2hhbmdpbmcpIHRoaXMuX19wYXJlbnRfXy5jaGFuZ2VkID0ge307XG4gICAgICAgIHRoaXMuX19wYXJlbnRfXy5jaGFuZ2VkW3RoaXMubmFtZV0gPSBhdHRycztcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2UnLCB0aGlzLl9fcGFyZW50X18pO1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ2NoYW5nZTonK3RoaXMubmFtZSwgdGhpcy5fX3BhcmVudF9fLCBhdHRycyk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9fcGFyZW50X18uY2hhbmdlZFt0aGlzLm5hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmKHRoaXMucmV0dXJuVHlwZSAhPT0gJ3ZhbHVlJyAmJiBvcHRpb25zLnJlc2V0KSBrZXkgPSB2YWx1ZS5yZXNldChhdHRycywgb3B0aW9ucyk7XG4gICAgZWxzZSBpZih0aGlzLnJldHVyblR5cGUgIT09ICd2YWx1ZScpIGtleSA9IHZhbHVlLnNldChhdHRycywgb3B0aW9ucyk7XG4gICAgdGhpcy5pc0RpcnR5ID0gdGhpcy5pc0NoYW5naW5nID0gZmFsc2U7XG5cbiAgICAvLyBDYWxsIGFsbCByZWFtaW5pbmcgY29tcHV0ZWQgcHJvcGVydGllcyB3YWl0aW5nIGZvciB0aGlzIHZhbHVlIHRvIHJlc29sdmUuXG4gICAgXy5lYWNoKHRoaXMud2FpdGluZywgZnVuY3Rpb24ocHJvcCl7IHByb3AgJiYgcHJvcC5jYWxsKCk7IH0pO1xuXG4gICAgcmV0dXJuIGtleTtcbiAgfSxcblxuICAvLyBSZXR1cm4gdGhlIGN1cnJlbnQgdmFsdWUgZnJvbSB0aGUgY2FjaGUsIHJ1bm5pbmcgaWYgZGlydHkuXG4gIHZhbHVlOiBmdW5jdGlvbigpe1xuICAgIGlmKHRoaXMuaXNEaXJ0eSkgdGhpcy5hcHBseSgpO1xuICAgIHJldHVybiB0aGlzLmNhY2hlW3RoaXMucmV0dXJuVHlwZV07XG4gIH0sXG5cbiAgLy8gUmVzZXQgdGhlIGN1cnJlbnQgdmFsdWUgaW4gdGhlIGNhY2hlLCBydW5uaW5nIGlmIGZpcnN0IHJ1bi5cbiAgcmVzZXQ6IGZ1bmN0aW9uKG9iaiwgb3B0aW9ucyl7XG4gICAgaWYoXy5pc051bGwodGhpcy5yZXR1cm5UeXBlKSkgcmV0dXJuOyAvLyBGaXJzdCBydW5cbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIG9wdGlvbnMucmVzZXQgPSB0cnVlO1xuICAgIHJldHVybiAgdGhpcy5zZXQob2JqLCBvcHRpb25zKTtcbiAgfSxcblxuICAvLyBDeWNsaWMgZGVwZW5kYW5jeSBzYWZlIHRvSlNPTiBtZXRob2QuXG4gIHRvSlNPTjogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2lzU2VyaWFsaXppbmcpIHJldHVybiB0aGlzLmNpZDtcbiAgICB2YXIgdmFsID0gdGhpcy52YWx1ZSgpO1xuICAgIHRoaXMuX2lzU2VyaWFsaXppbmcgPSB0cnVlO1xuICAgIHZhciBqc29uID0gKHZhbCAmJiBfLmlzRnVuY3Rpb24odmFsLnRvSlNPTikpID8gdmFsLnRvSlNPTigpIDogdmFsO1xuICAgIHRoaXMuX2lzU2VyaWFsaXppbmcgPSBmYWxzZTtcbiAgICByZXR1cm4ganNvbjtcbiAgfVxuXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgQ29tcHV0ZWRQcm9wZXJ0eTtcbiIsIi8vIFJlYm91bmQgSG9va3Ncbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IExhenlWYWx1ZSBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvbGF6eS12YWx1ZVwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5pbXBvcnQgaGVscGVycyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaGVscGVyc1wiO1xuXG52YXIgaG9va3MgPSB7fSxcbiAgICBhdHRyaWJ1dGVzID0geyAgYWJicjogMSwgICAgICBcImFjY2VwdC1jaGFyc2V0XCI6IDEsICAgYWNjZXB0OiAxLCAgICAgIGFjY2Vzc2tleTogMSwgICAgIGFjdGlvbjogMSxcbiAgICAgICAgICAgICAgICAgICAgYWxpZ246IDEsICAgICAgYWxpbms6IDEsICAgICAgICAgICAgIGFsdDogMSwgICAgICAgICBhcmNoaXZlOiAxLCAgICAgICBheGlzOiAxLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAxLCBiZ2NvbG9yOiAxLCAgICAgICAgICAgYm9yZGVyOiAxLCAgICAgIGNlbGxwYWRkaW5nOiAxLCAgIGNlbGxzcGFjaW5nOiAxLFxuICAgICAgICAgICAgICAgICAgICBjaGFyOiAxLCAgICAgICBjaGFyb2ZmOiAxLCAgICAgICAgICAgY2hhcnNldDogMSwgICAgIGNoZWNrZWQ6IDEsICAgICAgIGNpdGU6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzOiAxLCAgICAgIGNsYXNzaWQ6IDEsICAgICAgICAgICBjbGVhcjogMSwgICAgICAgY29kZTogMSwgICAgICAgICAgY29kZWJhc2U6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNvZGV0eXBlOiAxLCAgIGNvbG9yOiAxLCAgICAgICAgICAgICBjb2xzOiAxLCAgICAgICAgY29sc3BhbjogMSwgICAgICAgY29tcGFjdDogMSxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogMSwgICAgY29vcmRzOiAxLCAgICAgICAgICAgIGRhdGE6IDEsICAgICAgICBkYXRldGltZTogMSwgICAgICBkZWNsYXJlOiAxLFxuICAgICAgICAgICAgICAgICAgICBkZWZlcjogMSwgICAgICBkaXI6IDEsICAgICAgICAgICAgICAgZGlzYWJsZWQ6IDEsICAgIGVuY3R5cGU6IDEsICAgICAgIGZhY2U6IDEsXG4gICAgICAgICAgICAgICAgICAgIGZvcjogMSwgICAgICAgIGZyYW1lOiAxLCAgICAgICAgICAgICBmcmFtZWJvcmRlcjogMSwgaGVhZGVyczogMSwgICAgICAgaGVpZ2h0OiAxLFxuICAgICAgICAgICAgICAgICAgICBocmVmOiAxLCAgICAgICBocmVmbGFuZzogMSwgICAgICAgICAgaHNwYWNlOiAxLCAgICAgXCJodHRwLWVxdWl2XCI6IDEsICAgaWQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIGlzbWFwOiAxLCAgICAgIGxhYmVsOiAxLCAgICAgICAgICAgICBsYW5nOiAxLCAgICAgICAgbGFuZ3VhZ2U6IDEsICAgICAgbGluazogMSxcbiAgICAgICAgICAgICAgICAgICAgbG9uZ2Rlc2M6IDEsICAgbWFyZ2luaGVpZ2h0OiAxLCAgICAgIG1hcmdpbndpZHRoOiAxLCBtYXhsZW5ndGg6IDEsICAgICBtZWRpYTogMSxcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAxLCAgICAgbXVsdGlwbGU6IDEsICAgICAgICAgIG5hbWU6IDEsICAgICAgICBub2hyZWY6IDEsICAgICAgICBub3Jlc2l6ZTogMSxcbiAgICAgICAgICAgICAgICAgICAgbm9zaGFkZTogMSwgICAgbm93cmFwOiAxLCAgICAgICAgICAgIG9iamVjdDogMSwgICAgICBvbmJsdXI6IDEsICAgICAgICBvbmNoYW5nZTogMSxcbiAgICAgICAgICAgICAgICAgICAgb25jbGljazogMSwgICAgb25kYmxjbGljazogMSwgICAgICAgIG9uZm9jdXM6IDEsICAgICBvbmtleWRvd246IDEsICAgICBvbmtleXByZXNzOiAxLFxuICAgICAgICAgICAgICAgICAgICBvbmtleXVwOiAxLCAgICBvbmxvYWQ6IDEsICAgICAgICAgICAgb25tb3VzZWRvd246IDEsIG9ubW91c2Vtb3ZlOiAxLCAgIG9ubW91c2VvdXQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIG9ubW91c2VvdmVyOiAxLG9ubW91c2V1cDogMSwgICAgICAgICBvbnJlc2V0OiAxLCAgICAgb25zZWxlY3Q6IDEsICAgICAgb25zdWJtaXQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIG9udW5sb2FkOiAxLCAgIHByb2ZpbGU6IDEsICAgICAgICAgICBwcm9tcHQ6IDEsICAgICAgcmVhZG9ubHk6IDEsICAgICAgcmVsOiAxLFxuICAgICAgICAgICAgICAgICAgICByZXY6IDEsICAgICAgICByb3dzOiAxLCAgICAgICAgICAgICAgcm93c3BhbjogMSwgICAgIHJ1bGVzOiAxLCAgICAgICAgIHNjaGVtZTogMSxcbiAgICAgICAgICAgICAgICAgICAgc2NvcGU6IDEsICAgICAgc2Nyb2xsaW5nOiAxLCAgICAgICAgIHNlbGVjdGVkOiAxLCAgICBzaGFwZTogMSwgICAgICAgICBzaXplOiAxLFxuICAgICAgICAgICAgICAgICAgICBzcGFuOiAxLCAgICAgICBzcmM6IDEsICAgICAgICAgICAgICAgc3RhbmRieTogMSwgICAgIHN0YXJ0OiAxLCAgICAgICAgIHN0eWxlOiAxLFxuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiAxLCAgICB0YWJpbmRleDogMSwgICAgICAgICAgdGFyZ2V0OiAxLCAgICAgIHRleHQ6IDEsICAgICAgICAgIHRpdGxlOiAxLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAxLCAgICAgICB1c2VtYXA6IDEsICAgICAgICAgICAgdmFsaWduOiAxLCAgICAgIHZhbHVlOiAxLCAgICAgICAgIHZhbHVldHlwZTogMSxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogMSwgICAgdmxpbms6IDEsICAgICAgICAgICAgIHZzcGFjZTogMSwgICAgICB3aWR0aDogMSAgfTtcblxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBIb29rIFV0aWxzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLy8gR2l2ZW4gYW4gb2JqZWN0IChjb250ZXh0KSBhbmQgYSBwYXRoLCBjcmVhdGUgYSBMYXp5VmFsdWUgb2JqZWN0IHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2Ygb2JqZWN0IGF0IGNvbnRleHQgYW5kIGFkZCBpdCBhcyBhbiBvYnNlcnZlciBvZiB0aGUgY29udGV4dC5cbmZ1bmN0aW9uIHN0cmVhbVByb3BlcnR5KGNvbnRleHQsIHBhdGgpIHtcblxuICAvLyBMYXp5IHZhbHVlIHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2YgY29udGV4dC5wYXRoXG4gIHZhciBsYXp5VmFsdWUgPSBuZXcgTGF6eVZhbHVlKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBjb250ZXh0LmdldChwYXRoKTtcbiAgfSwge2NvbnRleHQ6IGNvbnRleHR9KTtcblxuICAvLyBTYXZlIG91ciBwYXRoIHNvIHBhcmVudCBsYXp5dmFsdWVzIGNhbiBrbm93IHRoZSBkYXRhIHZhciBvciBoZWxwZXIgdGhleSBhcmUgZ2V0dGluZyBpbmZvIGZyb21cbiAgbGF6eVZhbHVlLnBhdGggPSBwYXRoO1xuXG4gIC8vIFNhdmUgdGhlIG9ic2VydmVyIGF0IHRoaXMgcGF0aFxuICBsYXp5VmFsdWUuYWRkT2JzZXJ2ZXIocGF0aCwgY29udGV4dCk7XG5cbiAgcmV0dXJuIGxhenlWYWx1ZTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0SGVscGVyKG1vcnBoLCBwYXRoLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudiwgaGVscGVyKSB7XG4gIHZhciBrZXk7XG4gIC8vIEV4dGVuZCBvcHRpb25zIHdpdGggdGhlIGhlbHBlcidzIGNvbnRhaW5laW5nIE1vcnBoIGVsZW1lbnQuIFVzZWQgYnkgc3RyZWFtaWZ5IHRvIHRyYWNrIGRhdGEgb2JzZXJ2ZXJzXG4gIG9wdGlvbnMubW9ycGggPSBtb3JwaDtcbiAgb3B0aW9ucy5lbGVtZW50ID0gbW9ycGg7XG4gIG9wdGlvbnMucGF0aCA9IHBhdGg7XG4gIG9wdGlvbnMuY29udGV4dCA9IGNvbnRleHQ7XG5cbiAgLy8gRW5zdXJlIGVudiBhbmQgYmxvY2sgcGFyYW1zIGRvbid0IHNoYXJlIG1lbW9yeSB3aXRoIG90aGVyIGhlbHBlcnNcbiAgZW52ID0gXy5jbG9uZShlbnYpO1xuICBpZihlbnYuYmxvY2tQYXJhbXMpIGVudi5ibG9ja1BhcmFtcyA9IF8uY2xvbmUoZW52LmJsb2NrUGFyYW1zKTtcblxuICAvLyBDcmVhdGUgYSBsYXp5IHZhbHVlIHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2Ygb3VyIGV2YWx1YXRlZCBoZWxwZXIuXG4gIG9wdGlvbnMubGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpe1xuICAgIHZhciBwbGFpblBhcmFtcyA9IFtdLFxuICAgICAgICBwbGFpbkhhc2ggPSB7fTtcblxuICAgIC8vIEFzc2VtYmxlIG91ciBhcmdzIGFuZCBoYXNoIHZhcmlhYmxlcy4gRm9yIGVhY2ggbGF6eXZhbHVlIHBhcmFtLCBwdXNoIHRoZSBsYXp5VmFsdWUncyB2YWx1ZSBzbyBoZWxwZXJzIHdpdGggbm8gY29uY2VwdCBvZiBsYXp5dmFsdWVzLlxuICAgIF8uZWFjaChwYXJhbXMsIGZ1bmN0aW9uKHBhcmFtLCBpbmRleCl7XG4gICAgICBwbGFpblBhcmFtcy5wdXNoKCggKHBhcmFtICYmIHBhcmFtLmlzTGF6eVZhbHVlKSA/IHBhcmFtLnZhbHVlKCkgOiBwYXJhbSApKTtcbiAgICB9KTtcbiAgICBfLmVhY2goaGFzaCwgZnVuY3Rpb24oaGFzaCwga2V5KXtcbiAgICAgIHBsYWluSGFzaFtrZXldID0gKGhhc2ggJiYgaGFzaC5pc0xhenlWYWx1ZSkgPyBoYXNoLnZhbHVlKCkgOiBoYXNoO1xuICAgIH0pO1xuXG4gICAgLy8gQ2FsbCBvdXIgaGVscGVyIGZ1bmN0aW9ucyB3aXRoIG91ciBhc3NlbWJsZWQgYXJncy5cbiAgICByZXR1cm4gaGVscGVyLmFwcGx5KChjb250ZXh0Ll9fcm9vdF9fIHx8IGNvbnRleHQpLCBbcGxhaW5QYXJhbXMsIHBsYWluSGFzaCwgb3B0aW9ucywgZW52XSk7XG5cbiAgfSwge21vcnBoOiBvcHRpb25zLm1vcnBofSk7XG5cbiAgb3B0aW9ucy5sYXp5VmFsdWUucGF0aCA9IHBhdGg7XG5cbiAgLy8gRm9yIGVhY2ggcGFyYW0gb3IgaGFzaCB2YWx1ZSBwYXNzZWQgdG8gb3VyIGhlbHBlciwgYWRkIGl0IHRvIG91ciBoZWxwZXIncyBkZXBlbmRhbnQgbGlzdC4gSGVscGVyIHdpbGwgcmUtZXZhbHVhdGUgd2hlbiBvbmUgY2hhbmdlcy5cbiAgcGFyYW1zLmZvckVhY2goZnVuY3Rpb24ocGFyYW0pIHtcbiAgICBpZiAocGFyYW0gJiYgcGFyYW0uaXNMYXp5VmFsdWUpeyBvcHRpb25zLmxhenlWYWx1ZS5hZGREZXBlbmRlbnRWYWx1ZShwYXJhbSk7IH1cbiAgfSk7XG4gIGZvcihrZXkgaW4gaGFzaCl7XG4gICAgaWYgKGhhc2hba2V5XSAmJiBoYXNoW2tleV0uaXNMYXp5VmFsdWUpeyBvcHRpb25zLmxhenlWYWx1ZS5hZGREZXBlbmRlbnRWYWx1ZShoYXNoW2tleV0pOyB9XG4gIH1cblxuICByZXR1cm4gb3B0aW9ucy5sYXp5VmFsdWU7XG59XG5cbi8vIEdpdmVuIGEgcm9vdCBlbGVtZW50LCBjbGVhbnMgYWxsIG9mIHRoZSBtb3JwaCBsYXp5VmFsdWVzIGZvciBhIGdpdmVuIHN1YnRyZWVcbmZ1bmN0aW9uIGNsZWFuU3VidHJlZShtdXRhdGlvbnMsIG9ic2VydmVyKXtcbiAgLy8gRm9yIGVhY2ggbXV0YXRpb24gb2JzZXJ2ZWQsIGlmIHRoZXJlIGFyZSBub2RlcyByZW1vdmVkLCBkZXN0cm95IGFsbCBhc3NvY2lhdGVkIGxhenlWYWx1ZXNcbiAgbXV0YXRpb25zLmZvckVhY2goZnVuY3Rpb24obXV0YXRpb24pIHtcbiAgICBpZihtdXRhdGlvbi5yZW1vdmVkTm9kZXMpe1xuICAgICAgXy5lYWNoKG11dGF0aW9uLnJlbW92ZWROb2RlcywgZnVuY3Rpb24obm9kZSwgaW5kZXgpe1xuICAgICAgICAkKG5vZGUpLndhbGtUaGVET00oZnVuY3Rpb24obil7XG4gICAgICAgICAgaWYobi5fX2xhenlWYWx1ZSAmJiBuLl9fbGF6eVZhbHVlLmRlc3Ryb3koKSl7XG4gICAgICAgICAgICBuLl9fbGF6eVZhbHVlLmRlc3Ryb3koKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIHN1YnRyZWVPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGNsZWFuU3VidHJlZSk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIERlZmF1bHQgSG9va3NcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5ob29rcy5nZXQgPSBmdW5jdGlvbiBnZXQoZW52LCBjb250ZXh0LCBwYXRoKXtcbiAgaWYocGF0aCA9PT0gJ3RoaXMnKSBwYXRoID0gJyc7XG4gIHZhciBrZXksXG4gICAgICByZXN0ID0gJC5zcGxpdFBhdGgocGF0aCksXG4gICAgICBmaXJzdCA9IHJlc3Quc2hpZnQoKTtcblxuICAvLyBJZiB0aGlzIHBhdGggcmVmZXJhbmNlcyBhIGJsb2NrIHBhcmFtLCB1c2UgdGhhdCBhcyB0aGUgY29udGV4dCBpbnN0ZWFkLlxuICBpZihlbnYuYmxvY2tQYXJhbXMgJiYgZW52LmJsb2NrUGFyYW1zW2ZpcnN0XSl7XG4gICAgY29udGV4dCA9IGVudi5ibG9ja1BhcmFtc1tmaXJzdF07XG4gICAgcGF0aCA9IHJlc3Quam9pbignLicpO1xuICB9XG5cbiAgcmV0dXJuIHN0cmVhbVByb3BlcnR5KGNvbnRleHQsIHBhdGgpO1xufTtcblxuaG9va3Muc2V0ID0gZnVuY3Rpb24gc2V0KGVudiwgY29udGV4dCwgbmFtZSwgdmFsdWUpe1xuICBlbnYuYmxvY2tQYXJhbXMgfHwgKGVudi5ibG9ja1BhcmFtcyA9IHt9KTtcbiAgZW52LmJsb2NrUGFyYW1zW25hbWVdID0gdmFsdWU7XG59O1xuXG5cbmhvb2tzLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdChlbnYsIHBhcmFtcykge1xuXG4gIGlmKHBhcmFtcy5sZW5ndGggPT09IDEpe1xuICAgIHJldHVybiBwYXJhbXNbMF07XG4gIH1cblxuICB2YXIgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSBcIlwiO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJhbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YWx1ZSArPSAocGFyYW1zW2ldLmlzTGF6eVZhbHVlKSA/IHBhcmFtc1tpXS52YWx1ZSgpIDogcGFyYW1zW2ldO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfSwge2NvbnRleHQ6IHBhcmFtc1swXS5jb250ZXh0fSk7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJhbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYocGFyYW1zW2ldLmlzTGF6eVZhbHVlKSB7XG4gICAgICBsYXp5VmFsdWUuYWRkRGVwZW5kZW50VmFsdWUocGFyYW1zW2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbGF6eVZhbHVlO1xuXG59O1xuXG5ob29rcy5zdWJleHByID0gZnVuY3Rpb24gc3ViZXhwcihlbnYsIGNvbnRleHQsIGhlbHBlck5hbWUsIHBhcmFtcywgaGFzaCkge1xuXG4gIHZhciBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihoZWxwZXJOYW1lLCBlbnYpLFxuICBsYXp5VmFsdWU7XG5cbiAgaWYgKGhlbHBlcikge1xuICAgIGxhenlWYWx1ZSA9IGNvbnN0cnVjdEhlbHBlcihmYWxzZSwgaGVscGVyTmFtZSwgY29udGV4dCwgcGFyYW1zLCBoYXNoLCB7fSwgZW52LCBoZWxwZXIpO1xuICB9IGVsc2Uge1xuICAgIGxhenlWYWx1ZSA9IGhvb2tzLmdldChlbnYsIGNvbnRleHQsIGhlbHBlck5hbWUpO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJhbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYocGFyYW1zW2ldLmlzTGF6eVZhbHVlKSB7XG4gICAgICBsYXp5VmFsdWUuYWRkRGVwZW5kZW50VmFsdWUocGFyYW1zW2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbGF6eVZhbHVlO1xufTtcblxuaG9va3MuYmxvY2sgPSBmdW5jdGlvbiBibG9jayhlbnYsIG1vcnBoLCBjb250ZXh0LCBwYXRoLCBwYXJhbXMsIGhhc2gsIHRlbXBsYXRlLCBpbnZlcnNlKXtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgbW9ycGg6IG1vcnBoLFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICBpbnZlcnNlOiBpbnZlcnNlXG4gIH07XG5cbiAgdmFyIGxhenlWYWx1ZSxcbiAgICAgIHZhbHVlLFxuICAgICAgb2JzZXJ2ZXIgPSBzdWJ0cmVlT2JzZXJ2ZXIsXG4gICAgICBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihwYXRoLCBlbnYpO1xuXG4gIGlmKCFfLmlzRnVuY3Rpb24oaGVscGVyKSl7XG4gICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IocGF0aCArICcgaXMgbm90IGEgdmFsaWQgaGVscGVyIScpO1xuICB9XG5cbiAgLy8gQWJzdHJhY3RzIG91ciBoZWxwZXIgdG8gcHJvdmlkZSBhIGhhbmRsZWJhcnMgdHlwZSBpbnRlcmZhY2UuIENvbnN0cnVjdHMgb3VyIExhenlWYWx1ZS5cbiAgbGF6eVZhbHVlID0gY29uc3RydWN0SGVscGVyKG1vcnBoLCBwYXRoLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudiwgaGVscGVyKTtcblxuICB2YXIgcmVuZGVySG9vayA9IGZ1bmN0aW9uKGxhenlWYWx1ZSkge1xuICAgIHZhciB2YWwgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICB2YWwgPSAoXy5pc1VuZGVmaW5lZCh2YWwpKSA/ICcnIDogdmFsO1xuICAgIGlmKCFfLmlzTnVsbCh2YWwpKXtcbiAgICAgIG1vcnBoLnNldENvbnRlbnQodmFsKTtcbiAgICB9XG4gIH1cbiAgbGF6eVZhbHVlLm9uTm90aWZ5KHJlbmRlckhvb2spO1xuICByZW5kZXJIb29rKGxhenlWYWx1ZSk7XG5cbiAgLy8gT2JzZXJ2ZSB0aGlzIGNvbnRlbnQgbW9ycGgncyBwYXJlbnQncyBjaGlsZHJlbi5cbiAgLy8gV2hlbiB0aGUgbW9ycGggZWxlbWVudCdzIGNvbnRhaW5pbmcgZWxlbWVudCAobW9ycGgpIGlzIHJlbW92ZWQsIGNsZWFuIHVwIHRoZSBsYXp5dmFsdWUuXG4gIC8vIFRpbWVvdXQgZGVsYXkgaGFjayB0byBnaXZlIG91dCBkb20gYSBjaGFuZ2UgdG8gZ2V0IHRoZWlyIHBhcmVudFxuICBpZihtb3JwaC5fcGFyZW50KXtcbiAgICBtb3JwaC5fcGFyZW50Ll9fbGF6eVZhbHVlID0gbGF6eVZhbHVlO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIGlmKG1vcnBoLmNvbnRleHR1YWxFbGVtZW50KXtcbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShtb3JwaC5jb250ZXh0dWFsRWxlbWVudCwgeyBhdHRyaWJ1dGVzOiBmYWxzZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICB9LCAwKTtcbiAgfVxufTtcblxuaG9va3MuaW5saW5lID0gZnVuY3Rpb24gaW5saW5lKGVudiwgbW9ycGgsIGNvbnRleHQsIHBhdGgsIHBhcmFtcywgaGFzaCkge1xuXG4gIHZhciBsYXp5VmFsdWUsXG4gIHZhbHVlLFxuICBvYnNlcnZlciA9IHN1YnRyZWVPYnNlcnZlcixcbiAgaGVscGVyID0gaGVscGVycy5sb29rdXBIZWxwZXIocGF0aCwgZW52KTtcblxuICBpZighXy5pc0Z1bmN0aW9uKGhlbHBlcikpe1xuICAgIHJldHVybiBjb25zb2xlLmVycm9yKHBhdGggKyAnIGlzIG5vdCBhIHZhbGlkIGhlbHBlciEnKTtcbiAgfVxuXG4gIC8vIEFic3RyYWN0cyBvdXIgaGVscGVyIHRvIHByb3ZpZGUgYSBoYW5kbGViYXJzIHR5cGUgaW50ZXJmYWNlLiBDb25zdHJ1Y3RzIG91ciBMYXp5VmFsdWUuXG4gIGxhenlWYWx1ZSA9IGNvbnN0cnVjdEhlbHBlcihtb3JwaCwgcGF0aCwgY29udGV4dCwgcGFyYW1zLCBoYXNoLCB7fSwgZW52LCBoZWxwZXIpO1xuXG4gIHZhciByZW5kZXJIb29rID0gZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgdmFyIHZhbCA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuICAgIHZhbCA9IChfLmlzVW5kZWZpbmVkKHZhbCkpID8gJycgOiB2YWw7XG4gICAgaWYoIV8uaXNOdWxsKHZhbCkpe1xuICAgICAgbW9ycGguc2V0Q29udGVudCh2YWwpO1xuICAgIH1cbiAgfVxuXG4gIC8vIElmIHdlIGhhdmUgb3VyIGxhenkgdmFsdWUsIHVwZGF0ZSBvdXIgZG9tLlxuICAvLyBtb3JwaCBpcyBhIG1vcnBoIGVsZW1lbnQgcmVwcmVzZW50aW5nIG91ciBkb20gbm9kZVxuICBsYXp5VmFsdWUub25Ob3RpZnkocmVuZGVySG9vayk7XG4gIHJlbmRlckhvb2sobGF6eVZhbHVlKVxuXG4gIC8vIE9ic2VydmUgdGhpcyBjb250ZW50IG1vcnBoJ3MgcGFyZW50J3MgY2hpbGRyZW4uXG4gIC8vIFdoZW4gdGhlIG1vcnBoIGVsZW1lbnQncyBjb250YWluaW5nIGVsZW1lbnQgKG1vcnBoKSBpcyByZW1vdmVkLCBjbGVhbiB1cCB0aGUgbGF6eXZhbHVlLlxuICAvLyBUaW1lb3V0IGRlbGF5IGhhY2sgdG8gZ2l2ZSBvdXQgZG9tIGEgY2hhbmdlIHRvIGdldCB0aGVpciBwYXJlbnRcbiAgaWYobW9ycGguX3BhcmVudCl7XG4gICAgbW9ycGguX3BhcmVudC5fX2xhenlWYWx1ZSA9IGxhenlWYWx1ZTtcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICBpZihtb3JwaC5jb250ZXh0dWFsRWxlbWVudCl7XG4gICAgICAgIG9ic2VydmVyLm9ic2VydmUobW9ycGguY29udGV4dHVhbEVsZW1lbnQsIHsgYXR0cmlidXRlczogZmFsc2UsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6IHRydWUgfSk7XG4gICAgICB9XG4gICAgfSwgMCk7XG4gIH1cblxufTtcblxuaG9va3MuY29udGVudCA9IGZ1bmN0aW9uIGNvbnRlbnQoZW52LCBtb3JwaCwgY29udGV4dCwgcGF0aCkge1xuXG4gIHZhciBsYXp5VmFsdWUsXG4gICAgICB2YWx1ZSxcbiAgICAgIG9ic2VydmVyID0gc3VidHJlZU9ic2VydmVyLFxuICAgICAgaGVscGVyID0gaGVscGVycy5sb29rdXBIZWxwZXIocGF0aCwgZW52KTtcblxuICBpZiAoaGVscGVyKSB7XG4gICAgbGF6eVZhbHVlID0gY29uc3RydWN0SGVscGVyKG1vcnBoLCBwYXRoLCBjb250ZXh0LCBbXSwge30sIHt9LCBlbnYsIGhlbHBlcik7XG4gIH0gZWxzZSB7XG4gICAgbGF6eVZhbHVlID0gaG9va3MuZ2V0KGVudiwgY29udGV4dCwgcGF0aCk7XG4gIH1cblxuICB2YXIgcmVuZGVySG9vayA9IGZ1bmN0aW9uKGxhenlWYWx1ZSkge1xuICAgIHZhciB2YWwgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICB2YWwgPSAoXy5pc1VuZGVmaW5lZCh2YWwpKSA/ICcnIDogdmFsO1xuICAgIGlmKCFfLmlzTnVsbCh2YWwpKSBtb3JwaC5zZXRDb250ZW50KHZhbCk7XG4gIH1cblxuICAvLyBJZiB3ZSBoYXZlIG91ciBsYXp5IHZhbHVlLCB1cGRhdGUgb3VyIGRvbS5cbiAgLy8gbW9ycGggaXMgYSBtb3JwaCBlbGVtZW50IHJlcHJlc2VudGluZyBvdXIgZG9tIG5vZGVcbiAgbGF6eVZhbHVlLm9uTm90aWZ5KHJlbmRlckhvb2spO1xuICByZW5kZXJIb29rKGxhenlWYWx1ZSk7XG5cbiAgLy8gT2JzZXJ2ZSB0aGlzIGNvbnRlbnQgbW9ycGgncyBwYXJlbnQncyBjaGlsZHJlbi5cbiAgLy8gV2hlbiB0aGUgbW9ycGggZWxlbWVudCdzIGNvbnRhaW5pbmcgZWxlbWVudCAobW9ycGgpIGlzIHJlbW92ZWQsIGNsZWFuIHVwIHRoZSBsYXp5dmFsdWUuXG4gIC8vIFRpbWVvdXQgZGVsYXkgaGFjayB0byBnaXZlIG91dCBkb20gYSBjaGFuZ2UgdG8gZ2V0IHRoZWlyIHBhcmVudFxuICBpZihtb3JwaC5fcGFyZW50KXtcbiAgICBtb3JwaC5fcGFyZW50Ll9fbGF6eVZhbHVlID0gbGF6eVZhbHVlO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIGlmKG1vcnBoLmNvbnRleHR1YWxFbGVtZW50KXtcbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShtb3JwaC5jb250ZXh0dWFsRWxlbWVudCwgeyBhdHRyaWJ1dGVzOiBmYWxzZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICB9LCAwKTtcbiAgfVxuXG59O1xuXG4vLyBIYW5kbGUgbW9ycGhzIGluIGVsZW1lbnQgdGFnc1xuLy8gVE9ETzogaGFuZGxlIGR5bmFtaWMgYXR0cmlidXRlIG5hbWVzP1xuaG9va3MuZWxlbWVudCA9IGZ1bmN0aW9uIGVsZW1lbnQoZW52LCBkb21FbGVtZW50LCBjb250ZXh0LCBwYXRoLCBwYXJhbXMsIGhhc2gpIHtcbiAgdmFyIGhlbHBlciA9IGhlbHBlcnMubG9va3VwSGVscGVyKHBhdGgsIGVudiksXG4gICAgICBsYXp5VmFsdWUsXG4gICAgICB2YWx1ZTtcblxuICBpZiAoaGVscGVyKSB7XG4gICAgLy8gQWJzdHJhY3RzIG91ciBoZWxwZXIgdG8gcHJvdmlkZSBhIGhhbmRsZWJhcnMgdHlwZSBpbnRlcmZhY2UuIENvbnN0cnVjdHMgb3VyIExhenlWYWx1ZS5cbiAgICBsYXp5VmFsdWUgPSBjb25zdHJ1Y3RIZWxwZXIoZG9tRWxlbWVudCwgcGF0aCwgY29udGV4dCwgcGFyYW1zLCBoYXNoLCB7fSwgZW52LCBoZWxwZXIpO1xuICB9IGVsc2Uge1xuICAgIGxhenlWYWx1ZSA9IGhvb2tzLmdldChlbnYsIGNvbnRleHQsIHBhdGgpO1xuICB9XG5cbiAgdmFyIHJlbmRlckhvb2sgPSBmdW5jdGlvbihsYXp5VmFsdWUpIHtcbiAgICBsYXp5VmFsdWUudmFsdWUoKTtcbiAgfVxuXG4gIC8vIFdoZW4gd2UgaGF2ZSBvdXIgbGF6eSB2YWx1ZSBydW4gaXQgYW5kIHN0YXJ0IGxpc3RlbmluZyBmb3IgdXBkYXRlcy5cbiAgbGF6eVZhbHVlLm9uTm90aWZ5KHJlbmRlckhvb2spO1xuICByZW5kZXJIb29rKGxhenlWYWx1ZSk7XG5cbn07XG5ob29rcy5hdHRyaWJ1dGUgPSBmdW5jdGlvbiBhdHRyaWJ1dGUoZW52LCBhdHRyTW9ycGgsIGRvbUVsZW1lbnQsIG5hbWUsIHZhbHVlKXtcblxuICB2YXIgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsID0gdmFsdWUudmFsdWUoKSxcbiAgICBjaGVja2JveENoYW5nZSxcbiAgICB0eXBlID0gZG9tRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLFxuXG4gICAgaW5wdXRUeXBlcyA9IHsgICdudWxsJzogdHJ1ZSwgICd0ZXh0Jzp0cnVlLCAgICdlbWFpbCc6dHJ1ZSwgICdwYXNzd29yZCc6dHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ3NlYXJjaCc6dHJ1ZSwgJ3VybCc6dHJ1ZSwgICAgJ3RlbCc6dHJ1ZSwgICAgJ2hpZGRlbic6dHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ251bWJlcic6dHJ1ZSwgJ2NvbG9yJzogdHJ1ZSwgJ2RhdGUnOiB0cnVlLCAgJ2RhdGV0aW1lJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGV0aW1lLWxvY2FsOic6IHRydWUsICAgICAgJ21vbnRoJzogdHJ1ZSwgJ3JhbmdlJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ3RpbWUnOiB0cnVlLCAgJ3dlZWsnOiB0cnVlXG4gICAgICAgICAgICAgICAgICB9LFxuICAgIGF0dHI7XG5cbiAgICAvLyBJZiBpcyBhIHRleHQgaW5wdXQgZWxlbWVudCdzIHZhbHVlIHByb3Agd2l0aCBvbmx5IG9uZSB2YXJpYWJsZSwgd2lyZSBkZWZhdWx0IGV2ZW50c1xuICAgIGlmKCBkb21FbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgJiYgaW5wdXRUeXBlc1t0eXBlXSAmJiBuYW1lID09PSAndmFsdWUnICl7XG5cbiAgICAgIC8vIElmIG91ciBzcGVjaWFsIGlucHV0IGV2ZW50cyBoYXZlIG5vdCBiZWVuIGJvdW5kIHlldCwgYmluZCB0aGVtIGFuZCBzZXQgZmxhZ1xuICAgICAgaWYoIWxhenlWYWx1ZS5pbnB1dE9ic2VydmVyKXtcblxuICAgICAgICAkKGRvbUVsZW1lbnQpLm9uKCdjaGFuZ2UgaW5wdXQgcHJvcGVydHljaGFuZ2UnLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgdmFsdWUuc2V0KHZhbHVlLnBhdGgsIHRoaXMudmFsdWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBsYXp5VmFsdWUuaW5wdXRPYnNlcnZlciA9IHRydWU7XG5cbiAgICAgIH1cblxuICAgICAgLy8gU2V0IHRoZSBhdHRyaWJ1dGUgb24gb3VyIGVsZW1lbnQgZm9yIHZpc3VhbCByZWZlcmFuY2VcbiAgICAgIChfLmlzVW5kZWZpbmVkKHZhbCkpID8gZG9tRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSkgOiBkb21FbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCB2YWwpO1xuXG4gICAgICBhdHRyID0gdmFsO1xuXG4gICAgICByZXR1cm4gKGRvbUVsZW1lbnQudmFsdWUgIT09IFN0cmluZyhhdHRyKSkgPyBkb21FbGVtZW50LnZhbHVlID0gKGF0dHIgfHwgJycpIDogYXR0cjtcbiAgICB9XG5cbiAgICBlbHNlIGlmKCBkb21FbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgJiYgKHR5cGUgPT09ICdjaGVja2JveCcgfHwgdHlwZSA9PT0gJ3JhZGlvJykgJiYgbmFtZSA9PT0gJ2NoZWNrZWQnICl7XG5cbiAgICAgIC8vIElmIG91ciBzcGVjaWFsIGlucHV0IGV2ZW50cyBoYXZlIG5vdCBiZWVuIGJvdW5kIHlldCwgYmluZCB0aGVtIGFuZCBzZXQgZmxhZ1xuICAgICAgaWYoIWxhenlWYWx1ZS5ldmVudHNCb3VuZCl7XG5cbiAgICAgICAgJChkb21FbGVtZW50KS5vbignY2hhbmdlIHByb3BlcnR5Y2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgIHZhbHVlLnNldCh2YWx1ZS5wYXRoLCAoKHRoaXMuY2hlY2tlZCkgPyB0cnVlIDogZmFsc2UpLCB7cXVpZXQ6IHRydWV9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGF6eVZhbHVlLmV2ZW50c0JvdW5kID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0IHRoZSBhdHRyaWJ1dGUgb24gb3VyIGVsZW1lbnQgZm9yIHZpc3VhbCByZWZlcmFuY2VcbiAgICAgICghdmFsKSA/IGRvbUVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpIDogZG9tRWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsKTtcblxuICAgICAgcmV0dXJuIGRvbUVsZW1lbnQuY2hlY2tlZCA9ICh2YWwpID8gdHJ1ZSA6IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIGxpbmsgZWxlbWVudHMgd2l0aCBkeW5hbWljIGNsYXNzZXMuXG4gICAgLy8gSWYgdGhlIHJvdXRlciBoYXMgYXNzaWduZWQgaXQgYSB0cnV0aHkgJ2FjdGl2ZScgcHJvcGVydHksIGVuc3VyZSB0aGF0IHRoZSBleHRyYSBjbGFzcyBpcyBwcmVzZW50IG9uIHJlLXJlbmRlci5cbiAgICBlbHNlIGlmKCBkb21FbGVtZW50LnRhZ05hbWUgPT09ICdBJyAmJiBuYW1lID09PSAnY2xhc3MnICl7XG4gICAgICBpZihfLmlzVW5kZWZpbmVkKHZhbCkpe1xuICAgICAgICBkb21FbGVtZW50LmFjdGl2ZSA/IGRvbUVsZW1lbnQuc2V0QXR0cmlidXRlKCdjbGFzcycsICdhY3RpdmUnKSA6IGRvbUVsZW1lbnQuY2xhc3NMaXN0LnJlbW92ZSgnY2xhc3MnKTtcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIGRvbUVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbCArIChkb21FbGVtZW50LmFjdGl2ZSA/ICcgYWN0aXZlJyA6ICcnKSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICBfLmlzU3RyaW5nKHZhbCkgJiYgKHZhbCA9IHZhbC50cmltKCkpO1xuICAgICAgdmFsIHx8ICh2YWwgPSB1bmRlZmluZWQpO1xuICAgICAgaWYoXy5pc1VuZGVmaW5lZCh2YWwpKXtcbiAgICAgICAgZG9tRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICBkb21FbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCB2YWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB2YWw7XG5cbiAgfSwge2F0dHJNb3JwaDogYXR0ck1vcnBofSk7XG5cbiAgdmFyIHJlbmRlckhvb2sgPSBmdW5jdGlvbigpe1xuICAgIGxhenlWYWx1ZS52YWx1ZSgpO1xuICB9XG5cbiAgdmFsdWUub25Ob3RpZnkocmVuZGVySG9vayk7XG4gIGxhenlWYWx1ZS5hZGREZXBlbmRlbnRWYWx1ZSh2YWx1ZSk7XG4gIHJlbmRlckhvb2soKTtcbn07XG5cbmhvb2tzLmNvbXBvbmVudCA9IGZ1bmN0aW9uKGVudiwgbW9ycGgsIGNvbnRleHQsIHRhZ05hbWUsIGNvbnRleHREYXRhLCB0ZW1wbGF0ZSkge1xuXG4gIHZhciBjb21wb25lbnQsXG4gICAgICBlbGVtZW50LFxuICAgICAgb3V0bGV0LFxuICAgICAgcGxhaW5EYXRhID0ge30sXG4gICAgICBjb21wb25lbnREYXRhID0ge30sXG4gICAgICBsYXp5VmFsdWUsXG4gICAgICB2YWx1ZTtcblxuICAvLyBDcmVhdGUgYSBsYXp5IHZhbHVlIHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2Ygb3VyIGV2YWx1YXRlZCBjb21wb25lbnQuXG4gIGxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBDcmVhdGUgYSBwbGFpbiBkYXRhIG9iamVjdCBmcm9tIHRoZSBsYXp5dmFsdWVzL3ZhbHVlcyBwYXNzZWQgdG8gb3VyIGNvbXBvbmVudFxuICAgIF8uZWFjaChjb250ZXh0RGF0YSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgcGxhaW5EYXRhW2tleV0gPSAodmFsdWUuaXNMYXp5VmFsdWUpID8gdmFsdWUudmFsdWUoKSA6IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgLy8gRm9yIGVhY2ggcGFyYW0gcGFzc2VkIHRvIG91ciBzaGFyZWQgY29tcG9uZW50LCBhZGQgaXQgdG8gb3VyIGN1c3RvbSBlbGVtZW50XG4gICAgLy8gVE9ETzogdGhlcmUgaGFzIHRvIGJlIGEgYmV0dGVyIHdheSB0byBnZXQgc2VlZCBkYXRhIHRvIGVsZW1lbnQgaW5zdGFuY2VzXG4gICAgLy8gR2xvYmFsIHNlZWQgZGF0YSBpcyBjb25zdW1lZCBieSBlbGVtZW50IGFzIGl0cyBjcmVhdGVkLiBUaGlzIGlzIG5vdCBzY29wZWQgYW5kIHZlcnkgZHVtYi5cbiAgICBSZWJvdW5kLnNlZWREYXRhID0gcGxhaW5EYXRhO1xuICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICAgIGRlbGV0ZSBSZWJvdW5kLnNlZWREYXRhO1xuICAgIGNvbXBvbmVudCA9IGVsZW1lbnQuX19jb21wb25lbnRfXztcblxuICAgIC8vIEZvciBlYWNoIGxhenkgcGFyYW0gcGFzc2VkIHRvIG91ciBjb21wb25lbnQsIGNyZWF0ZSBpdHMgbGF6eVZhbHVlXG4gICAgXy5lYWNoKHBsYWluRGF0YSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgaWYoY29udGV4dERhdGFba2V5XSAmJiBjb250ZXh0RGF0YVtrZXldLmlzTGF6eVZhbHVlKXtcbiAgICAgICAgY29tcG9uZW50RGF0YVtrZXldID0gaG9va3MuZ2V0KGVudiwgY29tcG9uZW50LCBrZXkpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gU2V0IHVwIHR3byB3YXkgYmluZGluZyBiZXR3ZWVuIGNvbXBvbmVudCBhbmQgb3JpZ2luYWwgY29udGV4dCBmb3Igbm9uLWRhdGEgYXR0cmlidXRlc1xuICAgIC8vIFN5bmNpbmcgYmV0d2VlbiBtb2RlbHMgYW5kIGNvbGxlY3Rpb25zIHBhc3NlZCBhcmUgaGFuZGxlZCBpbiBtb2RlbCBhbmQgY29sbGVjdGlvblxuICAgIF8uZWFjaCggY29tcG9uZW50RGF0YSwgZnVuY3Rpb24oY29tcG9uZW50RGF0YVZhbHVlLCBrZXkpe1xuXG4gICAgICAvLyBUT0RPOiBNYWtlIHRoaXMgc3luYyB3b3JrIHdpdGggY29tcGxleCBhcmd1bWVudHMgd2l0aCBtb3JlIHRoYW4gb25lIGNoaWxkXG4gICAgICBpZihjb250ZXh0RGF0YVtrZXldLmNoaWxkcmVuID09PSBudWxsKXtcbiAgICAgICAgLy8gRm9yIGVhY2ggbGF6eSBwYXJhbSBwYXNzZWQgdG8gb3VyIGNvbXBvbmVudCwgaGF2ZSBpdCB1cGRhdGUgdGhlIG9yaWdpbmFsIGNvbnRleHQgd2hlbiBjaGFuZ2VkLlxuICAgICAgICBjb21wb25lbnREYXRhVmFsdWUub25Ob3RpZnkoZnVuY3Rpb24oKXtcbiAgICAgICAgICBjb250ZXh0RGF0YVtrZXldLnNldChjb250ZXh0RGF0YVtrZXldLnBhdGgsIGNvbXBvbmVudERhdGFWYWx1ZS52YWx1ZSgpKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZvciBlYWNoIGxhenkgcGFyYW0gcGFzc2VkIHRvIG91ciBjb21wb25lbnQsIGhhdmUgaXQgdXBkYXRlIHRoZSBjb21wb25lbnQgd2hlbiBjaGFuZ2VkLlxuICAgICAgY29udGV4dERhdGFba2V5XS5vbk5vdGlmeShmdW5jdGlvbigpe1xuICAgICAgICBjb21wb25lbnREYXRhVmFsdWUuc2V0KGtleSwgY29udGV4dERhdGFba2V5XS52YWx1ZSgpKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBTZWVkIHRoZSBjYWNoZVxuICAgICAgY29tcG9uZW50RGF0YVZhbHVlLnZhbHVlKCk7XG5cbiAgICAgIC8vIE5vdGlmeSB0aGUgY29tcG9uZW50J3MgbGF6eXZhbHVlIHdoZW4gb3VyIG1vZGVsIHVwZGF0ZXNcbiAgICAgIGNvbnRleHREYXRhW2tleV0uYWRkT2JzZXJ2ZXIoY29udGV4dERhdGFba2V5XS5wYXRoLCBjb250ZXh0KTtcbiAgICAgIGNvbXBvbmVudERhdGFWYWx1ZS5hZGRPYnNlcnZlcihrZXksIGNvbXBvbmVudCk7XG5cbiAgICB9KTtcblxuICAgIC8vIC8vIEZvciBlYWNoIGNoYW5nZSBvbiBvdXIgY29tcG9uZW50LCB1cGRhdGUgdGhlIHN0YXRlcyBvZiB0aGUgb3JpZ2luYWwgY29udGV4dCBhbmQgdGhlIGVsZW1lbnQncyBwcm9lcHJ0aWVzLlxuICAgIGNvbXBvbmVudC5saXN0ZW5Ubyhjb21wb25lbnQsICdjaGFuZ2UnLCBmdW5jdGlvbihtb2RlbCl7XG4gICAgICB2YXIganNvbiA9IGNvbXBvbmVudC50b0pTT04oKTtcblxuICAgICAgaWYoXy5pc1N0cmluZyhqc29uKSkgcmV0dXJuOyAvLyBJZiBpcyBhIHN0cmluZywgdGhpcyBtb2RlbCBpcyBzZXJhbGl6aW5nIGFscmVhZHlcblxuICAgICAgLy8gU2V0IHRoZSBwcm9wZXJ0aWVzIG9uIG91ciBlbGVtZW50IGZvciB2aXN1YWwgcmVmZXJhbmNlIGlmIHdlIGFyZSBvbiBhIHRvcCBsZXZlbCBhdHRyaWJ1dGVcbiAgICAgIF8uZWFjaChqc29uLCBmdW5jdGlvbih2YWx1ZSwga2V5KXtcbiAgICAgICAgLy8gVE9ETzogQ3VycmVudGx5LCBzaG93aW5nIG9iamVjdHMgYXMgcHJvcGVydGllcyBvbiB0aGUgY3VzdG9tIGVsZW1lbnQgY2F1c2VzIHByb2JsZW1zLlxuICAgICAgICAvLyBMaW5rZWQgbW9kZWxzIGJldHdlZW4gdGhlIGNvbnRleHQgYW5kIGNvbXBvbmVudCBiZWNvbWUgdGhlIHNhbWUgZXhhY3QgbW9kZWwgYW5kIGFsbCBoZWxsIGJyZWFrcyBsb29zZS5cbiAgICAgICAgLy8gRmluZCBhIHdheSB0byByZW1lZHkgdGhpcy4gVW50aWwgdGhlbiwgZG9uJ3Qgc2hvdyBvYmplY3RzLlxuICAgICAgICBpZigoXy5pc09iamVjdCh2YWx1ZSkpKXsgcmV0dXJuOyB9XG4gICAgICAgIHZhbHVlID0gKF8uaXNPYmplY3QodmFsdWUpKSA/IEpTT04uc3RyaW5naWZ5KHZhbHVlKSA6IHZhbHVlO1xuICAgICAgICAgIHRyeXsgKGF0dHJpYnV0ZXNba2V5XSkgPyBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKSA6IGVsZW1lbnQuZGF0YXNldFtrZXldID0gdmFsdWU7IH1cbiAgICAgICAgICBjYXRjaChlKXtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZS5tZXNzYWdlKTtcbiAgICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIC8qKiBUaGUgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrIG9uIG91ciBjdXN0b20gZWxlbWVudCB1cGRhdGVzIHRoZSBjb21wb25lbnQncyBkYXRhLiAqKi9cblxuXG4gIC8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG5cbiAgICBFbmQgZGF0YSBkZXBlbmRhbmN5IGNoYWluXG5cbiAgKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuXG4gICAgLy8gVE9ETzogYnJlYWsgdGhpcyBvdXQgaW50byBpdHMgb3duIGZ1bmN0aW9uXG4gICAgLy8gU2V0IHRoZSBwcm9wZXJ0aWVzIG9uIG91ciBlbGVtZW50IGZvciB2aXN1YWwgcmVmZXJhbmNlIGlmIHdlIGFyZSBvbiBhIHRvcCBsZXZlbCBhdHRyaWJ1dGVcbiAgICB2YXIgY29tcGpzb24gPSBjb21wb25lbnQudG9KU09OKCk7XG4gICAgXy5lYWNoKGNvbXBqc29uLCBmdW5jdGlvbih2YWx1ZSwga2V5KXtcbiAgICAgIC8vIFRPRE86IEN1cnJlbnRseSwgc2hvd2luZyBvYmplY3RzIGFzIHByb3BlcnRpZXMgb24gdGhlIGN1c3RvbSBlbGVtZW50IGNhdXNlcyBwcm9ibGVtcy5cbiAgICAgIC8vIExpbmtlZCBtb2RlbHMgYmV0d2VlbiB0aGUgY29udGV4dCBhbmQgY29tcG9uZW50IGJlY29tZSB0aGUgc2FtZSBleGFjdCBtb2RlbCBhbmQgYWxsIGhlbGwgYnJlYWtzIGxvb3NlLlxuICAgICAgLy8gRmluZCBhIHdheSB0byByZW1lZHkgdGhpcy4gVW50aWwgdGhlbiwgZG9uJ3Qgc2hvdyBvYmplY3RzLlxuICAgICAgaWYoKF8uaXNPYmplY3QodmFsdWUpKSl7IHJldHVybjsgfVxuICAgICAgdmFsdWUgPSAoXy5pc09iamVjdCh2YWx1ZSkpID8gSlNPTi5zdHJpbmdpZnkodmFsdWUpIDogdmFsdWU7XG4gICAgICBpZighXy5pc051bGwodmFsdWUpICYmICFfLmlzVW5kZWZpbmVkKHZhbHVlKSl7XG4gICAgICAgIHRyeXsgKGF0dHJpYnV0ZXNba2V5XSkgPyBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKSA6IGVsZW1lbnQuZGF0YXNldFtrZXldID0gdmFsdWU7IH1cbiAgICAgICAgY2F0Y2goZSl7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cblxuICAgIC8vIElmIGFuIG91dGxldCBtYXJrZXIgaXMgcHJlc2VudCBpbiBjb21wb25lbnQncyB0ZW1wbGF0ZSwgYW5kIGEgdGVtcGxhdGUgaXMgcHJvdmlkZWQsIHJlbmRlciBpdCBpbnRvIDxjb250ZW50PlxuICAgIG91dGxldCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvbnRlbnQnKVswXTtcbiAgICBpZih0ZW1wbGF0ZSAmJiBfLmlzRWxlbWVudChvdXRsZXQpKXtcbiAgICAgIG91dGxldC5pbm5lckhUTUwgPSAnJztcbiAgICAgIG91dGxldC5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgZW52LCBvdXRsZXQpKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIG5ldyBlbGVtZW50LlxuICAgIHJldHVybiBlbGVtZW50O1xuICB9LCB7bW9ycGg6IG1vcnBofSk7XG5cbiAgdmFyIHJlbmRlckhvb2sgPSBmdW5jdGlvbihsYXp5VmFsdWUpIHtcbiAgICB2YXIgdmFsID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgaWYodmFsICE9PSB1bmRlZmluZWQpeyBtb3JwaC5zZXRDb250ZW50KHZhbCk7IH1cbiAgfVxuXG4gIC8vIElmIHdlIGhhdmUgb3VyIGxhenkgdmFsdWUsIHVwZGF0ZSBvdXIgZG9tLlxuICAvLyBtb3JwaCBpcyBhIG1vcnBoIGVsZW1lbnQgcmVwcmVzZW50aW5nIG91ciBkb20gbm9kZVxuICBpZiAobGF6eVZhbHVlKSB7XG4gICAgbGF6eVZhbHVlLm9uTm90aWZ5KHJlbmRlckhvb2spO1xuICAgIHJlbmRlckhvb2sobGF6eVZhbHVlKTtcbiAgfVxufTtcblxuLy8gcmVnaXN0ZXJIZWxwZXIgaXMgYSBwdWJsaWNhbGx5IGF2YWlsYWJsZSBmdW5jdGlvbiB0byByZWdpc3RlciBhIGhlbHBlciB3aXRoIEhUTUxCYXJzXG5cbmV4cG9ydCBkZWZhdWx0IGhvb2tzO1xuIiwiLy8gUmVib3VuZCBNb2RlbFxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBSZWJvdW5kICoqTW9kZWxzKiogYXJlIHRoZSBiYXNpYyBkYXRhIG9iamVjdCBpbiB0aGUgZnJhbWV3b3JrIOKAlCBmcmVxdWVudGx5XG4vLyByZXByZXNlbnRpbmcgYSByb3cgaW4gYSB0YWJsZSBpbiBhIGRhdGFiYXNlIG9uIHlvdXIgc2VydmVyLiBUaGUgaW5oZXJpdCBmcm9tXG4vLyBCYWNrYm9uZSBNb2RlbHMgYW5kIGhhdmUgYWxsIG9mIHRoZSBzYW1lIHVzZWZ1bCBtZXRob2RzIHlvdSBhcmUgdXNlZCB0byBmb3Jcbi8vIHBlcmZvcm1pbmcgY29tcHV0YXRpb25zIGFuZCB0cmFuc2Zvcm1hdGlvbnMgb24gdGhhdCBkYXRhLiBSZWJvdW5kIGF1Z21lbnRzXG4vLyBCYWNrYm9uZSBNb2RlbHMgYnkgZW5hYmxpbmcgZGVlcCBkYXRhIG5lc3RpbmcuIFlvdSBjYW4gbm93IGhhdmUgKipSZWJvdW5kIENvbGxlY3Rpb25zKipcbi8vIGFuZCAqKlJlYm91bmQgQ29tcHV0ZWQgUHJvcGVydGllcyoqIGFzIHByb3BlcnRpZXMgb2YgdGhlIE1vZGVsLlxuXG5pbXBvcnQgQ29tcHV0ZWRQcm9wZXJ0eSBmcm9tIFwicmVib3VuZC1kYXRhL2NvbXB1dGVkLXByb3BlcnR5XCI7XG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcblxuLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkLCBnZW5lcmF0ZXMgYSBwYXRoIGNvbnN0cnVjdGVkIGZyb20gaXRzXG4vLyBwYXJlbnQncyBwYXRoIGFuZCB0aGUga2V5IGl0IGlzIGFzc2lnbmVkIHRvLiBLZWVwcyB1cyBmcm9tIHJlLW5hbWluZyBjaGlsZHJlblxuLy8gd2hlbiBwYXJlbnRzIGNoYW5nZS5cbmZ1bmN0aW9uIHBhdGhHZW5lcmF0b3IocGFyZW50LCBrZXkpe1xuICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICB2YXIgcGF0aCA9IHBhcmVudC5fX3BhdGgoKTtcbiAgICByZXR1cm4gcGF0aCArICgocGF0aCA9PT0gJycpID8gJycgOiAnLicpICsga2V5O1xuICB9O1xufVxuXG52YXIgTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuICAvLyBTZXQgdGhpcyBvYmplY3QncyBkYXRhIHR5cGVzXG4gIGlzTW9kZWw6IHRydWUsXG4gIGlzRGF0YTogdHJ1ZSxcblxuICAvLyBBIG1ldGhvZCB0aGF0IHJldHVybnMgYSByb290IHBhdGggYnkgZGVmYXVsdC4gTWVhbnQgdG8gYmUgb3ZlcnJpZGRlbiBvblxuICAvLyBpbnN0YW50aWF0aW9uLlxuICBfX3BhdGg6IGZ1bmN0aW9uKCl7IHJldHVybiAnJzsgfSxcblxuICAvLyBDcmVhdGUgYSBuZXcgTW9kZWwgd2l0aCB0aGUgc3BlY2lmaWVkIGF0dHJpYnV0ZXMuIFRoZSBNb2RlbCdzIGxpbmVhZ2UgaXMgc2V0XG4gIC8vIHVwIGhlcmUgdG8ga2VlcCB0cmFjayBvZiBpdCdzIHBsYWNlIGluIHRoZSBkYXRhIHRyZWUuXG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihhdHRyaWJ1dGVzLCBvcHRpb25zKXtcbiAgICBhdHRyaWJ1dGVzIHx8IChhdHRyaWJ1dGVzID0ge30pO1xuICAgIGF0dHJpYnV0ZXMuaXNNb2RlbCAmJiAoYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXMuYXR0cmlidXRlcyk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB0aGlzLmhlbHBlcnMgPSB7fTtcbiAgICB0aGlzLmRlZmF1bHRzID0gdGhpcy5kZWZhdWx0cyB8fCB7fTtcbiAgICB0aGlzLnNldFBhcmVudCggb3B0aW9ucy5wYXJlbnQgfHwgdGhpcyApO1xuICAgIHRoaXMuc2V0Um9vdCggb3B0aW9ucy5yb290IHx8IHRoaXMgKTtcbiAgICB0aGlzLl9fcGF0aCA9IG9wdGlvbnMucGF0aCB8fCB0aGlzLl9fcGF0aDtcbiAgICBCYWNrYm9uZS5Nb2RlbC5jYWxsKCB0aGlzLCBhdHRyaWJ1dGVzLCBvcHRpb25zICk7XG4gIH0sXG5cbiAgLy8gTmV3IGNvbnZlbmllbmNlIGZ1bmN0aW9uIHRvIHRvZ2dsZSBib29sZWFuIHZhbHVlcyBpbiB0aGUgTW9kZWwuXG4gIHRvZ2dsZTogZnVuY3Rpb24oYXR0ciwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zID8gXy5jbG9uZShvcHRpb25zKSA6IHt9O1xuICAgIHZhciB2YWwgPSB0aGlzLmdldChhdHRyKTtcbiAgICBpZighXy5pc0Jvb2xlYW4odmFsKSkgY29uc29sZS5lcnJvcignVHJpZWQgdG8gdG9nZ2xlIG5vbi1ib29sZWFuIHZhbHVlICcgKyBhdHRyICsnIScsIHRoaXMpO1xuICAgIHJldHVybiB0aGlzLnNldChhdHRyLCAhdmFsLCBvcHRpb25zKTtcbiAgfSxcblxuICAvLyBNb2RlbCBSZXNldCBkb2VzIGEgZGVlcCByZXNldCBvbiB0aGUgZGF0YSB0cmVlIHN0YXJ0aW5nIGF0IHRoaXMgTW9kZWwuXG4gIC8vIEEgYHByZXZpb3VzQXR0cmlidXRlc2AgcHJvcGVydHkgaXMgc2V0IG9uIHRoZSBgb3B0aW9uc2AgcHJvcGVydHkgd2l0aCB0aGUgTW9kZWwnc1xuICAvLyBvbGQgdmFsdWVzLlxuICByZXNldDogZnVuY3Rpb24ob2JqLCBvcHRpb25zKXtcbiAgICB2YXIgY2hhbmdlZCA9IHt9LCBrZXksIHZhbHVlO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgb3B0aW9ucy5yZXNldCA9IHRydWU7XG4gICAgb2JqID0gKG9iaiAmJiBvYmouaXNNb2RlbCAmJiBvYmouYXR0cmlidXRlcykgfHwgb2JqIHx8IHt9O1xuICAgIG9wdGlvbnMucHJldmlvdXNBdHRyaWJ1dGVzID0gXy5jbG9uZSh0aGlzLmF0dHJpYnV0ZXMpO1xuXG4gICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSBNb2RlbCdzIGF0dHJpYnV0ZXM6XG4gICAgLy8gLSBJZiB0aGUgcHJvcGVydHkgaXMgdGhlIGBpZEF0dHJpYnV0ZWAsIHNraXAuXG4gICAgLy8gLSBJZiB0aGUgcHJvcGVydHkgaXMgYSBgTW9kZWxgLCBgQ29sbGVjdGlvbmAsIG9yIGBDb21wdXRlZFByb3BlcnR5YCwgcmVzZXQgaXQuXG4gICAgLy8gLSBJZiB0aGUgcGFzc2VkIG9iamVjdCBoYXMgdGhlIHByb3BlcnR5LCBzZXQgaXQgdG8gdGhlIG5ldyB2YWx1ZS5cbiAgICAvLyAtIElmIHRoZSBNb2RlbCBoYXMgYSBkZWZhdWx0IHZhbHVlIGZvciB0aGlzIHByb3BlcnR5LCBzZXQgaXQgYmFjayB0byBkZWZhdWx0LlxuICAgIC8vIC0gT3RoZXJ3aXNlLCB1bnNldCB0aGUgYXR0cmlidXRlLlxuICAgIGZvcihrZXkgaW4gdGhpcy5hdHRyaWJ1dGVzKXtcbiAgICAgIHZhbHVlID0gdGhpcy5hdHRyaWJ1dGVzW2tleV07XG4gICAgICBpZih2YWx1ZSA9PT0gb2JqW2tleV0pIGNvbnRpbnVlO1xuICAgICAgZWxzZSBpZihfLmlzVW5kZWZpbmVkKHZhbHVlKSkgb2JqW2tleV0gJiYgKGNoYW5nZWRba2V5XSA9IG9ialtrZXldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gdGhpcy5pZEF0dHJpYnV0ZSkgY29udGludWU7XG4gICAgICBlbHNlIGlmICh2YWx1ZS5pc0NvbGxlY3Rpb24gfHwgdmFsdWUuaXNNb2RlbCB8fCB2YWx1ZS5pc0NvbXB1dGVkUHJvcGVydHkpe1xuICAgICAgICB2YWx1ZS5yZXNldCgob2JqW2tleV0gfHwgW10pLCB7c2lsZW50OiB0cnVlfSk7XG4gICAgICAgIGlmKHZhbHVlLmlzQ29sbGVjdGlvbikgY2hhbmdlZFtrZXldID0gW107XG4gICAgICAgIGVsc2UgaWYodmFsdWUuaXNNb2RlbCAmJiB2YWx1ZS5pc0NvbXB1dGVkUHJvcGVydHkpIGNoYW5nZWRba2V5XSA9IHZhbHVlLmNhY2hlLm1vZGVsLmNoYW5nZWQ7XG4gICAgICAgIGVsc2UgaWYodmFsdWUuaXNNb2RlbCkgY2hhbmdlZFtrZXldID0gdmFsdWUuY2hhbmdlZFxuICAgICAgfVxuICAgICAgZWxzZSBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpeyBjaGFuZ2VkW2tleV0gPSBvYmpba2V5XTsgfVxuICAgICAgZWxzZSBpZiAodGhpcy5kZWZhdWx0cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmICFfLmlzRnVuY3Rpb24odGhpcy5kZWZhdWx0c1trZXldKSl7XG4gICAgICAgIGNoYW5nZWRba2V5XSA9IG9ialtrZXldID0gdGhpcy5kZWZhdWx0c1trZXldO1xuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgY2hhbmdlZFtrZXldID0gdW5kZWZpbmVkO1xuICAgICAgICB0aGlzLnVuc2V0KGtleSwge3NpbGVudDogdHJ1ZX0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBBbnkgdW5zZXQgY2hhbmdlZCB2YWx1ZXMgd2lsbCBiZSBzZXQgdG8gb2JqW2tleV1cbiAgICBfLmVhY2gob2JqLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBvYmope1xuICAgICAgY2hhbmdlZFtrZXldID0gY2hhbmdlZFtrZXldIHx8IG9ialtrZXldO1xuICAgIH0pO1xuXG4gICAgLy8gUmVzZXQgb3VyIG1vZGVsXG4gICAgb2JqID0gdGhpcy5zZXQob2JqLCBfLmV4dGVuZCh7fSwgb3B0aW9ucywge3NpbGVudDogdHJ1ZSwgcmVzZXQ6IGZhbHNlfSkpO1xuXG4gICAgLy8gVHJpZ2dlciBjdXN0b20gcmVzZXQgZXZlbnRcbiAgICB0aGlzLmNoYW5nZWQgPSBjaGFuZ2VkO1xuICAgIGlmICghb3B0aW9ucy5zaWxlbnQpIHRoaXMudHJpZ2dlcigncmVzZXQnLCB0aGlzLCBvcHRpb25zKTtcblxuICAgIC8vIFJldHVybiBuZXcgdmFsdWVzXG4gICAgcmV0dXJuIG9iajtcbiAgfSxcblxuICAvLyAqKk1vZGVsLkdldCoqIGlzIG92ZXJyaWRkZW4gdG8gcHJvdmlkZSBzdXBwb3J0IGZvciBnZXR0aW5nIGZyb20gYSBkZWVwIGRhdGEgdHJlZS5cbiAgLy8gYGtleWAgbWF5IG5vdyBiZSBhbnkgdmFsaWQganNvbi1saWtlIGlkZW50aWZpZXIuIEV4OiBgb2JqLmNvbGxbM10udmFsdWVgLlxuICAvLyBJdCBuZWVkcyB0byB0cmF2ZXJzZSBgTW9kZWxzYCwgYENvbGxlY3Rpb25zYCBhbmQgYENvbXB1dGVkIFByb3BlcnRpZXNgIHRvXG4gIC8vIGZpbmQgdGhlIGNvcnJlY3QgdmFsdWUuXG4gIC8vIC0gSWYga2V5IGlzIHVuZGVmaW5lZCwgcmV0dXJuIGB1bmRlZmluZWRgLlxuICAvLyAtIElmIGtleSBpcyBlbXB0eSBzdHJpbmcsIHJldHVybiBgdGhpc2AuXG4gIC8vXG4gIC8vIEZvciBlYWNoIHBhcnQ6XG4gIC8vIC0gSWYgYSBgQ29tcHV0ZWQgUHJvcGVydHlgIGFuZCBgb3B0aW9ucy5yYXdgIGlzIHRydWUsIHJldHVybiBpdC5cbiAgLy8gLSBJZiBhIGBDb21wdXRlZCBQcm9wZXJ0eWAgdHJhdmVyc2UgdG8gaXRzIHZhbHVlLlxuICAvLyAtIElmIG5vdCBzZXQsIHJldHVybiBpdHMgZmFsc3kgdmFsdWUuXG4gIC8vIC0gSWYgYSBgTW9kZWxgLCBgQ29sbGVjdGlvbmAsIG9yIHByaW1pdGl2ZSB2YWx1ZSwgdHJhdmVyc2UgdG8gaXQuXG4gIGdldDogZnVuY3Rpb24oa2V5LCBvcHRpb25zKXtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHZhciBwYXJ0cyAgPSAkLnNwbGl0UGF0aChrZXkpLFxuICAgICAgICByZXN1bHQgPSB0aGlzLFxuICAgICAgICBpLCBsPXBhcnRzLmxlbmd0aDtcblxuICAgIGlmKF8uaXNVbmRlZmluZWQoa2V5KSB8fCBfLmlzTnVsbChrZXkpKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIGlmKGtleSA9PT0gJycgfHwgcGFydHMubGVuZ3RoID09PSAwKSByZXR1cm4gcmVzdWx0O1xuXG4gICAgZm9yIChpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgaWYocmVzdWx0ICYmIHJlc3VsdC5pc0NvbXB1dGVkUHJvcGVydHkgJiYgb3B0aW9ucy5yYXcpIHJldHVybiByZXN1bHQ7XG4gICAgICBpZihyZXN1bHQgJiYgcmVzdWx0LmlzQ29tcHV0ZWRQcm9wZXJ0eSkgcmVzdWx0ID0gcmVzdWx0LnZhbHVlKCk7XG4gICAgICBpZihfLmlzVW5kZWZpbmVkKHJlc3VsdCkgfHwgXy5pc051bGwocmVzdWx0KSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgIGlmKHBhcnRzW2ldID09PSAnQHBhcmVudCcpIHJlc3VsdCA9IHJlc3VsdC5fX3BhcmVudF9fO1xuICAgICAgZWxzZSBpZihyZXN1bHQuaXNDb2xsZWN0aW9uKSByZXN1bHQgPSByZXN1bHQubW9kZWxzW3BhcnRzW2ldXTtcbiAgICAgIGVsc2UgaWYocmVzdWx0LmlzTW9kZWwpIHJlc3VsdCA9IHJlc3VsdC5hdHRyaWJ1dGVzW3BhcnRzW2ldXTtcbiAgICAgIGVsc2UgaWYocmVzdWx0ICYmIHJlc3VsdC5oYXNPd25Qcm9wZXJ0eShwYXJ0c1tpXSkpIHJlc3VsdCA9IHJlc3VsdFtwYXJ0c1tpXV07XG4gICAgfVxuXG4gICAgaWYocmVzdWx0ICYmIHJlc3VsdC5pc0NvbXB1dGVkUHJvcGVydHkgJiYgIW9wdGlvbnMucmF3KSByZXN1bHQgPSByZXN1bHQudmFsdWUoKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuXG5cbiAgLy8gKipNb2RlbC5TZXQqKiBpcyBvdmVycmlkZGVuIHRvIHByb3ZpZGUgc3VwcG9ydCBmb3IgZ2V0dGluZyBmcm9tIGEgZGVlcCBkYXRhIHRyZWUuXG4gIC8vIGBrZXlgIG1heSBub3cgYmUgYW55IHZhbGlkIGpzb24tbGlrZSBpZGVudGlmaWVyLiBFeDogYG9iai5jb2xsWzNdLnZhbHVlYC5cbiAgLy8gSXQgbmVlZHMgdG8gdHJhdmVyc2UgYE1vZGVsc2AsIGBDb2xsZWN0aW9uc2AgYW5kIGBDb21wdXRlZCBQcm9wZXJ0aWVzYCB0b1xuICAvLyBmaW5kIHRoZSBjb3JyZWN0IHZhbHVlIHRvIGNhbGwgdGhlIG9yaWdpbmFsIGBCYWNrYm9uZS5TZXRgIG9uLlxuICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsLCBvcHRpb25zKXtcblxuICAgIHZhciBhdHRycywgYXR0ciwgbmV3S2V5LCB0YXJnZXQsIGRlc3RpbmF0aW9uLCBwcm9wcyA9IFtdLCBsaW5lYWdlO1xuXG4gICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICBhdHRycyA9IChrZXkuaXNNb2RlbCkgPyBrZXkuYXR0cmlidXRlcyA6IGtleTtcbiAgICAgIG9wdGlvbnMgPSB2YWw7XG4gICAgfVxuICAgIGVsc2UgKGF0dHJzID0ge30pW2tleV0gPSB2YWw7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICAgIC8vIElmIHJlc2V0IG9wdGlvbiBwYXNzZWQsIGRvIGEgcmVzZXQuIElmIG5vdGhpbmcgcGFzc2VkLCByZXR1cm4uXG4gICAgaWYob3B0aW9ucy5yZXNldCA9PT0gdHJ1ZSkgcmV0dXJuIHRoaXMucmVzZXQoYXR0cnMsIG9wdGlvbnMpO1xuICAgIGlmKG9wdGlvbnMuZGVmYXVsdHMgPT09IHRydWUpIHRoaXMuZGVmYXVsdHMgPSBhdHRycztcbiAgICBpZihfLmlzRW1wdHkoYXR0cnMpKSByZXR1cm47XG5cbiAgICAvLyBGb3IgZWFjaCBhdHRyaWJ1dGUgcGFzc2VkOlxuICAgIGZvcihrZXkgaW4gYXR0cnMpe1xuICAgICAgdmFyIHZhbCA9IGF0dHJzW2tleV0sXG4gICAgICAgICAgcGF0aHMgPSAkLnNwbGl0UGF0aChrZXkpLFxuICAgICAgICAgIGF0dHIgID0gcGF0aHMucG9wKCkgfHwgJyc7ICAgICAgICAgICAvLyBUaGUga2V5ICAgICAgICBleDogZm9vWzBdLmJhciAtLT4gYmFyXG4gICAgICAgICAgdGFyZ2V0ID0gdGhpcy5nZXQocGF0aHMuam9pbignLicpKSwgIC8vIFRoZSBlbGVtZW50ICAgIGV4OiBmb28uYmFyLmJheiAtLT4gZm9vLmJhclxuICAgICAgICAgIGxpbmVhZ2U7XG5cbiAgICAgIC8vIElmIHRhcmdldCBjdXJyZW50bHkgZG9lc250IGV4aXN0LCBjb25zdHJ1Y3QgaXRzIHRyZWVcbiAgICAgIGlmKF8uaXNVbmRlZmluZWQodGFyZ2V0KSl7XG4gICAgICAgIHRhcmdldCA9IHRoaXM7XG4gICAgICAgIF8uZWFjaChwYXRocywgZnVuY3Rpb24odmFsdWUpe1xuICAgICAgICAgIHZhciB0bXAgPSB0YXJnZXQuZ2V0KHZhbHVlKTtcbiAgICAgICAgICBpZihfLmlzVW5kZWZpbmVkKHRtcCkpIHRtcCA9IHRhcmdldC5zZXQodmFsdWUsIHt9KS5nZXQodmFsdWUpO1xuICAgICAgICAgIHRhcmdldCA9IHRtcDtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICB9XG5cbiAgICAgIC8vIFRoZSBvbGQgdmFsdWUgb2YgYGF0dHJgIGluIGB0YXJnZXRgXG4gICAgICB2YXIgZGVzdGluYXRpb24gPSB0YXJnZXQuZ2V0KGF0dHIsIHtyYXc6IHRydWV9KSB8fCB7fTtcblxuICAgICAgLy8gQ3JlYXRlIHRoaXMgbmV3IG9iamVjdCdzIGxpbmVhZ2UuXG4gICAgICBsaW5lYWdlID0ge1xuICAgICAgICBuYW1lOiBrZXksXG4gICAgICAgIHBhcmVudDogdGFyZ2V0LFxuICAgICAgICByb290OiB0aGlzLl9fcm9vdF9fLFxuICAgICAgICBwYXRoOiBwYXRoR2VuZXJhdG9yKHRhcmdldCwga2V5KSxcbiAgICAgICAgc2lsZW50OiB0cnVlLFxuICAgICAgICBkZWZhdWx0czogb3B0aW9ucy5kZWZhdWx0c1xuICAgICAgfVxuICAgICAgLy8gLSBJZiB2YWwgaXMgYG51bGxgIG9yIGB1bmRlZmluZWRgLCBzZXQgdG8gZGVmYXVsdCB2YWx1ZS5cbiAgICAgIC8vIC0gSWYgdmFsIGlzIGEgYENvbXB1dGVkIFByb3BlcnR5YCwgZ2V0IGl0cyBjdXJyZW50IGNhY2hlIG9iamVjdC5cbiAgICAgIC8vIC0gSWYgdmFsIChkZWZhdWx0IHZhbHVlIG9yIGV2YWx1YXRlZCBjb21wdXRlZCBwcm9wZXJ0eSkgaXMgYG51bGxgLCBzZXQgdG8gZGVmYXVsdCB2YWx1ZSBvciAoZmFsbGJhY2sgYHVuZGVmaW5lZGApLlxuICAgICAgLy8gLSBFbHNlIElmIGB7cmF3OiB0cnVlfWAgb3B0aW9uIGlzIHBhc3NlZCwgc2V0IHRoZSBleGFjdCBvYmplY3QgdGhhdCB3YXMgcGFzc2VkLiBObyBwcm9tb3Rpb24gdG8gYSBSZWJvdW5kIERhdGEgb2JqZWN0LlxuICAgICAgLy8gLSBFbHNlIElmIHRoaXMgZnVuY3Rpb24gaXMgdGhlIHNhbWUgYXMgdGhlIGN1cnJlbnQgY29tcHV0ZWQgcHJvcGVydHksIGNvbnRpbnVlLlxuICAgICAgLy8gLSBFbHNlIElmIHRoaXMgdmFsdWUgaXMgYSBgRnVuY3Rpb25gLCB0dXJuIGl0IGludG8gYSBgQ29tcHV0ZWQgUHJvcGVydHlgLlxuICAgICAgLy8gLSBFbHNlIElmIHRoaXMgaXMgZ29pbmcgdG8gYmUgYSBjeWNsaWNhbCBkZXBlbmRhbmN5LCB1c2UgdGhlIG9yaWdpbmFsIG9iamVjdCwgZG9uJ3QgbWFrZSBhIGNvcHkuXG4gICAgICAvLyAtIEVsc2UgSWYgdXBkYXRpbmcgYW4gZXhpc3Rpbmcgb2JqZWN0IHdpdGggaXRzIHJlc3BlY3RpdmUgZGF0YSB0eXBlLCBsZXQgQmFja2JvbmUgaGFuZGxlIHRoZSBtZXJnZS5cbiAgICAgIC8vIC0gRWxzZSBJZiB0aGlzIHZhbHVlIGlzIGEgYE1vZGVsYCBvciBgQ29sbGVjdGlvbmAsIGNyZWF0ZSBhIG5ldyBjb3B5IG9mIGl0IHVzaW5nIGl0cyBjb25zdHJ1Y3RvciwgcHJlc2VydmluZyBpdHMgZGVmYXVsdHMgd2hpbGUgZW5zdXJpbmcgbm8gc2hhcmVkIG1lbW9yeSBiZXR3ZWVuIG9iamVjdHMuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyB2YWx1ZSBpcyBhbiBgQXJyYXlgLCB0dXJuIGl0IGludG8gYSBgQ29sbGVjdGlvbmAuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyB2YWx1ZSBpcyBhIGBPYmplY3RgLCB0dXJuIGl0IGludG8gYSBgTW9kZWxgLlxuICAgICAgLy8gLSBFbHNlIHZhbCBpcyBhIHByaW1pdGl2ZSB2YWx1ZSwgc2V0IGl0IGFjY29yZGluZ2x5LlxuXG5cblxuICAgICAgaWYoXy5pc051bGwodmFsKSB8fCBfLmlzVW5kZWZpbmVkKHZhbCkpIHZhbCA9IHRoaXMuZGVmYXVsdHNba2V5XTtcbiAgICAgIGlmKHZhbCAmJiB2YWwuaXNDb21wdXRlZFByb3BlcnR5KSB2YWwgPSB2YWwudmFsdWUoKTtcbiAgICAgIGlmKF8uaXNOdWxsKHZhbCkgfHwgXy5pc1VuZGVmaW5lZCh2YWwpKSB2YWwgPSB1bmRlZmluZWQ7XG4gICAgICBlbHNlIGlmKG9wdGlvbnMucmF3ID09PSB0cnVlKSB2YWwgPSB2YWw7XG4gICAgICBlbHNlIGlmKGRlc3RpbmF0aW9uLmlzQ29tcHV0ZWRQcm9wZXJ0eSAmJiBkZXN0aW5hdGlvbi5mdW5jID09PSB2YWwpIGNvbnRpbnVlO1xuICAgICAgZWxzZSBpZihfLmlzRnVuY3Rpb24odmFsKSkgdmFsID0gbmV3IENvbXB1dGVkUHJvcGVydHkodmFsLCBsaW5lYWdlKTtcbiAgICAgIGVsc2UgaWYodmFsLmlzRGF0YSAmJiB0YXJnZXQuaGFzUGFyZW50KHZhbCkpIHZhbCA9IHZhbDtcbiAgICAgIGVsc2UgaWYoIGRlc3RpbmF0aW9uLmlzQ29tcHV0ZWRQcm9wZXJ0eSB8fFxuICAgICAgICAgICAgICAoIGRlc3RpbmF0aW9uLmlzQ29sbGVjdGlvbiAmJiAoIF8uaXNBcnJheSh2YWwpIHx8IHZhbC5pc0NvbGxlY3Rpb24gKSkgfHxcbiAgICAgICAgICAgICAgKCBkZXN0aW5hdGlvbi5pc01vZGVsICYmICggXy5pc09iamVjdCh2YWwpIHx8IHZhbC5pc01vZGVsICkpKXtcbiAgICAgICAgZGVzdGluYXRpb24uc2V0KHZhbCwgb3B0aW9ucyk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgZWxzZSBpZih2YWwuaXNEYXRhICYmIG9wdGlvbnMuY2xvbmUgIT09IGZhbHNlKSB2YWwgPSBuZXcgdmFsLmNvbnN0cnVjdG9yKHZhbC5hdHRyaWJ1dGVzIHx8IHZhbC5tb2RlbHMsIGxpbmVhZ2UpO1xuICAgICAgZWxzZSBpZihfLmlzQXJyYXkodmFsKSkgdmFsID0gbmV3IFJlYm91bmQuQ29sbGVjdGlvbih2YWwsIGxpbmVhZ2UpOyAvLyBUT0RPOiBSZW1vdmUgZ2xvYmFsIHJlZmVyYW5jZVxuICAgICAgZWxzZSBpZihfLmlzT2JqZWN0KHZhbCkpIHZhbCA9IG5ldyBNb2RlbCh2YWwsIGxpbmVhZ2UpO1xuXG4gICAgICAvLyBJZiB2YWwgaXMgYSBkYXRhIG9iamVjdCwgbGV0IHRoaXMgb2JqZWN0IGtub3cgaXQgaXMgbm93IGEgcGFyZW50XG4gICAgICB0aGlzLl9oYXNBbmNlc3RyeSA9ICh2YWwgJiYgdmFsLmlzRGF0YSB8fCBmYWxzZSk7XG5cbiAgICAgIC8vIFNldCB0aGUgdmFsdWVcbiAgICAgIEJhY2tib25lLk1vZGVsLnByb3RvdHlwZS5zZXQuY2FsbCh0YXJnZXQsIGF0dHIsIHZhbCwgb3B0aW9ucyk7IC8vIFRPRE86IEV2ZW50IGNsZWFudXAgd2hlbiByZXBsYWNpbmcgYSBtb2RlbCBvciBjb2xsZWN0aW9uIHdpdGggYW5vdGhlciB2YWx1ZVxuXG4gICAgfTtcblxuICAgIHJldHVybiB0aGlzO1xuXG4gIH0sXG5cbiAgLy8gUmVjdXJzaXZlIGB0b0pTT05gIGZ1bmN0aW9uIHRyYXZlcnNlcyB0aGUgZGF0YSB0cmVlIHJldHVybmluZyBhIEpTT04gb2JqZWN0LlxuICAvLyBJZiB0aGVyZSBhcmUgYW55IGN5Y2xpYyBkZXBlbmRhbmNpZXMgdGhlIG9iamVjdCdzIGBjaWRgIGlzIHVzZWQgaW5zdGVhZCBvZiBsb29waW5nIGluZmluaXRlbHkuXG4gIHRvSlNPTjogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2lzU2VyaWFsaXppbmcpIHJldHVybiB0aGlzLmlkIHx8IHRoaXMuY2lkO1xuICAgIHRoaXMuX2lzU2VyaWFsaXppbmcgPSB0cnVlO1xuICAgIHZhciBqc29uID0gXy5jbG9uZSh0aGlzLmF0dHJpYnV0ZXMpO1xuICAgIF8uZWFjaChqc29uLCBmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICBpZiggXy5pc051bGwodmFsdWUpIHx8IF8uaXNVbmRlZmluZWQodmFsdWUpICl7IHJldHVybjsgfVxuICAgICAgICBfLmlzRnVuY3Rpb24odmFsdWUudG9KU09OKSAmJiAoanNvbltuYW1lXSA9IHZhbHVlLnRvSlNPTigpKTtcbiAgICB9KTtcbiAgICB0aGlzLl9pc1NlcmlhbGl6aW5nID0gZmFsc2U7XG4gICAgcmV0dXJuIGpzb247XG4gIH1cblxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IE1vZGVsO1xuIiwiLy8gUmVib3VuZCBMYXp5IFZhbHVlXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbnZhciBOSUwgPSBmdW5jdGlvbiBOSUwoKXt9LFxuICAgIEVNUFRZX0FSUkFZID0gW107XG5cbmZ1bmN0aW9uIExhenlWYWx1ZShmbiwgb3B0aW9ucykge1xuICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pXG4gIHRoaXMuY2lkID0gXy51bmlxdWVJZCgnbGF6eVZhbHVlJyk7XG4gIHRoaXMudmFsdWVGbiA9IGZuO1xuICB0aGlzLmNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQgfHwgbnVsbDtcbiAgdGhpcy5tb3JwaCA9IG9wdGlvbnMubW9ycGggfHwgbnVsbDtcbiAgdGhpcy5hdHRyTW9ycGggPSBvcHRpb25zLmF0dHJNb3JwaCB8fCBudWxsO1xuICBfLmJpbmRBbGwodGhpcywgJ3ZhbHVlJywgJ3NldCcsICdhZGREZXBlbmRlbnRWYWx1ZScsICdhZGRPYnNlcnZlcicsICdub3RpZnknLCAnb25Ob3RpZnknLCAnZGVzdHJveScpO1xufVxuXG5MYXp5VmFsdWUucHJvdG90eXBlID0ge1xuICBpc0xhenlWYWx1ZTogdHJ1ZSxcbiAgcGFyZW50OiBudWxsLCAvLyBUT0RPOiBpcyBwYXJlbnQgZXZlbiBuZWVkZWQ/IGNvdWxkIGJlIG1vZGVsZWQgYXMgYSBzdWJzY3JpYmVyXG4gIGNoaWxkcmVuOiBudWxsLFxuICBvYnNlcnZlcnM6IG51bGwsXG4gIGNhY2hlOiBOSUwsXG4gIHZhbHVlRm46IG51bGwsXG4gIHN1YnNjcmliZXJzOiBudWxsLCAvLyBUT0RPOiBkbyB3ZSBuZWVkIG11bHRpcGxlIHN1YnNjcmliZXJzP1xuICBfY2hpbGRWYWx1ZXM6IG51bGwsIC8vIGp1c3QgZm9yIHJldXNpbmcgdGhlIGFycmF5LCBtaWdodCBub3Qgd29yayB3ZWxsIGlmIGNoaWxkcmVuLmxlbmd0aCBjaGFuZ2VzIGFmdGVyIGNvbXB1dGF0aW9uXG5cbiAgdmFsdWU6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBjYWNoZSA9IHRoaXMuY2FjaGU7XG4gICAgaWYgKGNhY2hlICE9PSBOSUwpIHsgcmV0dXJuIGNhY2hlOyB9XG5cbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xuICAgIGlmIChjaGlsZHJlbikge1xuICAgICAgdmFyIGNoaWxkLFxuICAgICAgICAgIHZhbHVlcyA9IHRoaXMuX2NoaWxkVmFsdWVzIHx8IG5ldyBBcnJheShjaGlsZHJlbi5sZW5ndGgpO1xuXG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IGNoaWxkcmVuLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBjaGlsZCA9IGNoaWxkcmVuW2ldO1xuICAgICAgICB2YWx1ZXNbaV0gPSAoY2hpbGQgJiYgY2hpbGQuaXNMYXp5VmFsdWUpID8gY2hpbGQudmFsdWUoKSA6IGNoaWxkO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdGhpcy5jYWNoZSA9IHRoaXMudmFsdWVGbih2YWx1ZXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5jYWNoZSA9IHRoaXMudmFsdWVGbihFTVBUWV9BUlJBWSk7XG4gICAgfVxuICB9LFxuXG4gIHNldDogZnVuY3Rpb24oa2V5LCB2YWx1ZSwgb3B0aW9ucyl7XG4gICAgaWYodGhpcy5jb250ZXh0KXtcbiAgICAgIHJldHVybiB0aGlzLmNvbnRleHQuc2V0KGtleSwgdmFsdWUsIG9wdGlvbnMpO1xuICAgIH1cbiAgICByZXR1cm4gbnVsbDtcbiAgfSxcblxuICBhZGREZXBlbmRlbnRWYWx1ZTogZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuO1xuICAgIGlmICghY2hpbGRyZW4pIHtcbiAgICAgIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbiA9IFt2YWx1ZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNoaWxkcmVuLnB1c2godmFsdWUpO1xuICAgIH1cblxuICAgIGlmICh2YWx1ZSAmJiB2YWx1ZS5pc0xhenlWYWx1ZSkgeyB2YWx1ZS5wYXJlbnQgPSB0aGlzOyB9XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBhZGRPYnNlcnZlcjogZnVuY3Rpb24ocGF0aCwgY29udGV4dCkge1xuICAgIHZhciBvYnNlcnZlcnMgPSB0aGlzLm9ic2VydmVycyB8fCAodGhpcy5vYnNlcnZlcnMgPSBbXSksXG4gICAgICAgIHBvc2l0aW9uLCByZXM7XG5cbiAgICBpZighXy5pc09iamVjdChjb250ZXh0KSB8fCAhXy5pc1N0cmluZyhwYXRoKSkgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGFkZGluZyBvYnNlcnZlciBmb3InLCBjb250ZXh0LCBwYXRoKTtcblxuICAgIC8vIEVuc3VyZSBfb2JzZXJ2ZXJzIGV4aXN0cyBhbmQgaXMgYW4gb2JqZWN0XG4gICAgY29udGV4dC5fX29ic2VydmVycyA9IGNvbnRleHQuX19vYnNlcnZlcnMgfHwge307XG4gICAgLy8gRW5zdXJlIF9fb2JzZXJ2ZXJzW3BhdGhdIGV4aXN0cyBhbmQgaXMgYW4gYXJyYXlcbiAgICBjb250ZXh0Ll9fb2JzZXJ2ZXJzW3BhdGhdID0gY29udGV4dC5fX29ic2VydmVyc1twYXRoXSB8fCB7Y29sbGVjdGlvbjogW10sIG1vZGVsOiBbXX07XG5cbiAgICAvLyBTYXZlIHRoZSB0eXBlIG9mIG9iamVjdCBldmVudHMgdGhpcyBvYnNlcnZlciBpcyBmb3JcbiAgICByZXMgPSBjb250ZXh0LmdldCh0aGlzLnBhdGgpO1xuICAgIHJlcyA9IChyZXMgJiYgcmVzLmlzQ29sbGVjdGlvbikgPyAnY29sbGVjdGlvbicgOiAnbW9kZWwnO1xuXG4gICAgLy8gQWRkIG91ciBjYWxsYmFjaywgc2F2ZSB0aGUgcG9zaXRpb24gaXQgaXMgYmVpbmcgaW5zZXJ0ZWQgc28gd2UgY2FuIGdhcmJhZ2UgY29sbGVjdCBsYXRlci5cbiAgICBwb3NpdGlvbiA9IGNvbnRleHQuX19vYnNlcnZlcnNbcGF0aF1bcmVzXS5wdXNoKHRoaXMpIC0gMTtcblxuICAgIC8vIExhenl2YWx1ZSBuZWVkcyByZWZlcmFuY2UgdG8gaXRzIG9ic2VydmVycyB0byByZW1vdmUgbGlzdGVuZXJzIG9uIGRlc3Ryb3lcbiAgICBvYnNlcnZlcnMucHVzaCh7Y29udGV4dDogY29udGV4dCwgcGF0aDogcGF0aCwgaW5kZXg6IHBvc2l0aW9ufSk7XG5cbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBub3RpZnk6IGZ1bmN0aW9uKHNlbmRlcikge1xuICAgIC8vIFRPRE86IFRoaXMgY2hlY2sgd29uJ3QgYmUgbmVjZXNzYXJ5IG9uY2UgcmVtb3ZlZCBET00gaGFzIGJlZW4gY2xlYW5lZCBvZiBhbnkgYmluZGluZ3MuXG4gICAgLy8gSWYgdGhpcyBsYXp5VmFsdWUncyBtb3JwaCBkb2VzIG5vdCBoYXZlIGFuIGltbWVkaWF0ZSBwYXJlbnROb2RlLCBpdCBoYXMgYmVlbiByZW1vdmVkIGZyb20gdGhlIGRvbSB0cmVlLiBEZXN0cm95IGl0LlxuICAgIC8vIFJpZ2h0IG5vdywgRE9NIHRoYXQgY29udGFpbnMgbW9ycGhzIHRocm93IGFuIGVycm9yIGlmIGl0IGlzIHJlbW92ZWQgYnkgYW5vdGhlciBsYXp5dmFsdWUgYmVmb3JlIHRob3NlIG1vcnBocyByZS1ldmFsdWF0ZS5cbiAgICBpZih0aGlzLm1vcnBoICYmIHRoaXMubW9ycGguZmlyc3ROb2RlICYmICF0aGlzLm1vcnBoLmZpcnN0Tm9kZS5wYXJlbnROb2RlKSByZXR1cm4gdGhpcy5kZXN0cm95KCk7XG4gICAgdmFyIGNhY2hlID0gdGhpcy5jYWNoZSxcbiAgICAgICAgcGFyZW50LFxuICAgICAgICBzdWJzY3JpYmVycztcblxuICAgIGlmIChjYWNoZSAhPT0gTklMKSB7XG4gICAgICBwYXJlbnQgPSB0aGlzLnBhcmVudDtcbiAgICAgIHN1YnNjcmliZXJzID0gdGhpcy5zdWJzY3JpYmVycztcbiAgICAgIGNhY2hlID0gdGhpcy5jYWNoZSA9IE5JTDtcbiAgICAgIGlmIChwYXJlbnQpIHsgcGFyZW50Lm5vdGlmeSh0aGlzKTsgfVxuICAgICAgaWYgKCFzdWJzY3JpYmVycykgeyByZXR1cm47IH1cbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gc3Vic2NyaWJlcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHN1YnNjcmliZXJzW2ldKHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBvbk5vdGlmeTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB2YXIgc3Vic2NyaWJlcnMgPSB0aGlzLnN1YnNjcmliZXJzIHx8ICh0aGlzLnN1YnNjcmliZXJzID0gW10pO1xuICAgIHN1YnNjcmliZXJzLnB1c2goY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCl7XG4gICAgICBpZiAoY2hpbGQgJiYgY2hpbGQuaXNMYXp5VmFsdWUpeyBjaGlsZC5kZXN0cm95KCk7IH1cbiAgICB9KTtcbiAgICBfLmVhY2godGhpcy5zdWJzY3JpYmVycywgZnVuY3Rpb24oc3Vic2NyaWJlcil7XG4gICAgICBpZiAoc3Vic2NyaWJlciAmJiBzdWJzY3JpYmVyLmlzTGF6eVZhbHVlKXsgc3Vic2NyaWJlci5kZXN0cm95KCk7IH1cbiAgICB9KTtcblxuICAgIHRoaXMucGFyZW50ID0gdGhpcy5jaGlsZHJlbiA9IHRoaXMuY2FjaGUgPSB0aGlzLnZhbHVlRm4gPSB0aGlzLnN1YnNjcmliZXJzID0gdGhpcy5fY2hpbGRWYWx1ZXMgPSBudWxsO1xuXG4gICAgXy5lYWNoKHRoaXMub2JzZXJ2ZXJzLCBmdW5jdGlvbihvYnNlcnZlcil7XG4gICAgICBpZihfLmlzT2JqZWN0KG9ic2VydmVyLmNvbnRleHQuX19vYnNlcnZlcnNbb2JzZXJ2ZXIucGF0aF0pKXtcbiAgICAgICAgZGVsZXRlIG9ic2VydmVyLmNvbnRleHQuX19vYnNlcnZlcnNbb2JzZXJ2ZXIucGF0aF1bb2JzZXJ2ZXIuaW5kZXhdO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5vYnNlcnZlcnMgPSBudWxsO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBMYXp5VmFsdWU7XG4iLCIvLyBSZWJvdW5kIERhdGFcbi8vIC0tLS0tLS0tLS0tLS0tLS1cbi8vIFRoZXNlIGFyZSBtZXRob2RzIGluaGVyaXRlZCBieSBhbGwgUmVib3VuZCBkYXRhIHR5cGVzIOKAkyAqKk1vZGVscyoqLFxuLy8gKipDb2xsZWN0aW9ucyoqIGFuZCAqKkNvbXB1dGVkIFByb3BlcnRpZXMqKiDigJMgYW5kIGNvbnRyb2wgdHJlZSBhbmNlc3RyeVxuLy8gdHJhY2tpbmcsIGRlZXAgZXZlbnQgcHJvcGFnYXRpb24gYW5kIHRyZWUgZGVzdHJ1Y3Rpb24uXG5cbmltcG9ydCBNb2RlbCBmcm9tIFwicmVib3VuZC1kYXRhL21vZGVsXCI7XG5pbXBvcnQgQ29sbGVjdGlvbiBmcm9tIFwicmVib3VuZC1kYXRhL2NvbGxlY3Rpb25cIjtcbmltcG9ydCBDb21wdXRlZFByb3BlcnR5IGZyb20gXCJyZWJvdW5kLWRhdGEvY29tcHV0ZWQtcHJvcGVydHlcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG52YXIgc2hhcmVkTWV0aG9kcyA9IHtcbiAgLy8gV2hlbiBhIGNoYW5nZSBldmVudCBwcm9wYWdhdGVzIHVwIHRoZSB0cmVlIGl0IG1vZGlmaWVzIHRoZSBwYXRoIHBhcnQgb2ZcbiAgLy8gYGNoYW5nZTo8cGF0aD5gIHRvIHJlZmxlY3QgdGhlIGZ1bGx5IHF1YWxpZmllZCBwYXRoIHJlbGF0aXZlIHRvIHRoYXQgb2JqZWN0LlxuICAvLyBFeDogV291bGQgdHJpZ2dlciBgY2hhbmdlOnZhbGAsIGBjaGFuZ2U6WzBdLnZhbGAsIGBjaGFuZ2U6YXJyWzBdLnZhbGAgYW5kIGBvYmouYXJyWzBdLnZhbGBcbiAgLy8gb24gZWFjaCBwYXJlbnQgYXMgaXQgaXMgcHJvcGFnYXRlZCB1cCB0aGUgdHJlZS5cbiAgcHJvcGFnYXRlRXZlbnQ6IGZ1bmN0aW9uKHR5cGUsIG1vZGVsKXtcbiAgICBpZih0aGlzLl9fcGFyZW50X18gPT09IHRoaXMgfHwgdHlwZSA9PT0gJ2RpcnR5JykgcmV0dXJuO1xuICAgIGlmKHR5cGUuaW5kZXhPZignY2hhbmdlOicpID09PSAwICYmIG1vZGVsLmlzTW9kZWwpe1xuICAgICAgaWYodGhpcy5pc0NvbGxlY3Rpb24gJiYgfnR5cGUuaW5kZXhPZignY2hhbmdlOlsnKSkgcmV0dXJuO1xuICAgICAgdmFyIGtleSxcbiAgICAgICAgICBwYXRoID0gbW9kZWwuX19wYXRoKCkucmVwbGFjZSh0aGlzLl9fcGFyZW50X18uX19wYXRoKCksICcnKS5yZXBsYWNlKC9eXFwuLywgJycpLFxuICAgICAgICAgIGNoYW5nZWQgPSBtb2RlbC5jaGFuZ2VkQXR0cmlidXRlcygpO1xuXG4gICAgICBmb3Ioa2V5IGluIGNoYW5nZWQpe1xuICAgICAgICAvLyBUT0RPOiBNb2RpZnlpbmcgYXJndW1lbnRzIGFycmF5IGlzIGJhZC4gY2hhbmdlIHRoaXNcbiAgICAgICAgYXJndW1lbnRzWzBdID0gKCdjaGFuZ2U6JyArIHBhdGggKyAocGF0aCAmJiAnLicpICsga2V5KTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgIHRoaXMuX19wYXJlbnRfXy50cmlnZ2VyLmFwcGx5KHRoaXMuX19wYXJlbnRfXywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19wYXJlbnRfXy50cmlnZ2VyLmFwcGx5KHRoaXMuX19wYXJlbnRfXywgYXJndW1lbnRzKTtcbiAgfSxcblxuICAvLyBTZXQgdGhpcyBkYXRhIG9iamVjdCdzIHBhcmVudCB0byBgcGFyZW50YCBhbmQsIGFzIGxvbmcgYXMgYSBkYXRhIG9iamVjdCBpc1xuICAvLyBub3QgaXRzIG93biBwYXJlbnQsIHByb3BhZ2F0ZSBldmVyeSBldmVudCB0cmlnZ2VyZWQgb24gYHRoaXNgIHVwIHRoZSB0cmVlLlxuICBzZXRQYXJlbnQ6IGZ1bmN0aW9uKHBhcmVudCl7XG4gICAgaWYodGhpcy5fX3BhcmVudF9fKSB0aGlzLm9mZignYWxsJywgdGhpcy5wcm9wYWdhdGVFdmVudCk7XG4gICAgdGhpcy5fX3BhcmVudF9fID0gcGFyZW50O1xuICAgIHRoaXMuX2hhc0FuY2VzdHJ5ID0gdHJ1ZTtcbiAgICBpZihwYXJlbnQgIT09IHRoaXMpIHRoaXMub24oJ2FsbCcsIHRoaXMuX19wYXJlbnRfXy5wcm9wYWdhdGVFdmVudCk7XG4gICAgcmV0dXJuIHBhcmVudDtcbiAgfSxcblxuICAvLyBSZWN1cnNpdmVseSBzZXQgYSBkYXRhIHRyZWUncyByb290IGVsZW1lbnQgc3RhcnRpbmcgd2l0aCBgdGhpc2AgdG8gdGhlIGRlZXBlc3QgY2hpbGQuXG4gIC8vIFRPRE86IEkgZG9udCBsaWtlIHRoaXMgcmVjdXJzaXZlbHkgc2V0dGluZyBlbGVtZW50cyByb290IHdoZW4gb25lIGVsZW1lbnQncyByb290IGNoYW5nZXMuIEZpeCB0aGlzLlxuICBzZXRSb290OiBmdW5jdGlvbiAocm9vdCl7XG4gICAgdmFyIG9iaiA9IHRoaXM7XG4gICAgb2JqLl9fcm9vdF9fID0gcm9vdDtcbiAgICB2YXIgdmFsID0gb2JqLm1vZGVscyB8fCAgb2JqLmF0dHJpYnV0ZXMgfHwgb2JqLmNhY2hlO1xuICAgIF8uZWFjaCh2YWwsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuICAgICAgaWYodmFsdWUgJiYgdmFsdWUuaXNEYXRhKXtcbiAgICAgICAgdmFsdWUuc2V0Um9vdChyb290KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcm9vdDtcbiAgfSxcblxuICAvLyBUZXN0cyB0byBzZWUgaWYgYHRoaXNgIGhhcyBhIHBhcmVudCBgb2JqYC5cbiAgaGFzUGFyZW50OiBmdW5jdGlvbihvYmope1xuICAgIHZhciB0bXAgPSB0aGlzO1xuICAgIHdoaWxlKHRtcCAhPT0gb2JqKXtcbiAgICAgIHRtcCA9IHRtcC5fX3BhcmVudF9fO1xuICAgICAgaWYoXy5pc1VuZGVmaW5lZCh0bXApKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZih0bXAgPT09IG9iaikgcmV0dXJuIHRydWU7XG4gICAgICBpZih0bXAuX19wYXJlbnRfXyA9PT0gdG1wKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9LFxuXG4gIC8vIERlLWluaXRpYWxpemVzIGEgZGF0YSB0cmVlIHN0YXJ0aW5nIHdpdGggYHRoaXNgIGFuZCByZWN1cnNpdmVseSBjYWxsaW5nIGBkZWluaXRpYWxpemUoKWAgb24gZWFjaCBjaGlsZC5cbiAgZGVpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XG5cbiAgLy8gVW5kZWxlZ2F0ZSBCYWNrYm9uZSBFdmVudHMgZnJvbSB0aGlzIGRhdGEgb2JqZWN0XG4gICAgaWYgKHRoaXMudW5kZWxlZ2F0ZUV2ZW50cykgdGhpcy51bmRlbGVnYXRlRXZlbnRzKCk7XG4gICAgaWYgKHRoaXMuc3RvcExpc3RlbmluZykgdGhpcy5zdG9wTGlzdGVuaW5nKCk7XG4gICAgaWYgKHRoaXMub2ZmKSB0aGlzLm9mZigpO1xuICAgIGlmICh0aGlzLnVud2lyZSkgdGhpcy51bndpcmUoKTtcblxuICAvLyBEZXN0cm95IHRoaXMgZGF0YSBvYmplY3QncyBsaW5lYWdlXG4gICAgZGVsZXRlIHRoaXMuX19wYXJlbnRfXztcbiAgICBkZWxldGUgdGhpcy5fX3Jvb3RfXztcbiAgICBkZWxldGUgdGhpcy5fX3BhdGg7XG5cbiAgLy8gSWYgdGhlcmUgaXMgYSBkb20gZWxlbWVudCBhc3NvY2lhdGVkIHdpdGggdGhpcyBkYXRhIG9iamVjdCwgZGVzdHJveSBhbGwgbGlzdGVuZXJzIGFzc29jaWF0ZWQgd2l0aCBpdC5cbiAgLy8gUmVtb3ZlIGFsbCBldmVudCBsaXN0ZW5lcnMgZnJvbSB0aGlzIGRvbSBlbGVtZW50LCByZWN1cnNpdmVseSByZW1vdmUgZWxlbWVudCBsYXp5dmFsdWVzLFxuICAvLyBhbmQgdGhlbiByZW1vdmUgdGhlIGVsZW1lbnQgcmVmZXJhbmNlIGl0c2VsZi5cbiAgICBpZih0aGlzLmVsKXtcbiAgICAgIF8uZWFjaCh0aGlzLmVsLl9fbGlzdGVuZXJzLCBmdW5jdGlvbihoYW5kbGVyLCBldmVudFR5cGUpe1xuICAgICAgICBpZiAodGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKSB0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICAgIGlmICh0aGlzLmVsLmRldGFjaEV2ZW50KSB0aGlzLmVsLmRldGFjaEV2ZW50KCdvbicrZXZlbnRUeXBlLCBoYW5kbGVyKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgICAgJCh0aGlzLmVsKS53YWxrVGhlRE9NKGZ1bmN0aW9uKGVsKXtcbiAgICAgICAgaWYoZWwuX19sYXp5VmFsdWUgJiYgZWwuX19sYXp5VmFsdWUuZGVzdHJveSgpKSBuLl9fbGF6eVZhbHVlLmRlc3Ryb3koKTtcbiAgICAgIH0pO1xuICAgICAgZGVsZXRlIHRoaXMuZWwuX19saXN0ZW5lcnM7XG4gICAgICBkZWxldGUgdGhpcy5lbC5fX2V2ZW50cztcbiAgICAgIGRlbGV0ZSB0aGlzLiRlbDtcbiAgICAgIGRlbGV0ZSB0aGlzLmVsO1xuICAgIH1cblxuICAvLyBDbGVhbiB1cCBIb29rIGNhbGxiYWNrIHJlZmVyZW5jZXNcbiAgICBkZWxldGUgdGhpcy5fX29ic2VydmVycztcblxuICAvLyBNYXJrIGFzIGRlaW5pdGlhbGl6ZWQgc28gd2UgZG9uJ3QgbG9vcCBvbiBjeWNsaWMgZGVwZW5kYW5jaWVzLlxuICAgIHRoaXMuZGVpbml0aWFsaXplZCA9IHRydWU7XG5cbiAgLy8gRGVzdHJveSBhbGwgY2hpbGRyZW4gb2YgdGhpcyBkYXRhIG9iamVjdC5cbiAgLy8gSWYgYSBDb2xsZWN0aW9uLCBkZS1pbml0IGFsbCBvZiBpdHMgTW9kZWxzLCBpZiBhIE1vZGVsLCBkZS1pbml0IGFsbCBvZiBpdHNcbiAgLy8gQXR0cmlidXRlcywgaWYgYSBDb21wdXRlZCBQcm9wZXJ0eSwgZGUtaW5pdCBpdHMgQ2FjaGUgb2JqZWN0cy5cbiAgICBfLmVhY2godGhpcy5tb2RlbHMsIGZ1bmN0aW9uKHZhbCl7IHZhbCAmJiB2YWwuZGVpbml0aWFsaXplICYmIHZhbC5kZWluaXRpYWxpemUoKTsgfSk7XG4gICAgdGhpcy5tb2RlbHMgJiYgKHRoaXMubW9kZWxzLmxlbmd0aCA9IDApO1xuICAgIF8uZWFjaCh0aGlzLmF0dHJpYnV0ZXMsICh2YWwsIGtleSkgPT4geyBkZWxldGUgdGhpcy5hdHRyaWJ1dGVzW2tleV07IHZhbCAmJiB2YWwuZGVpbml0aWFsaXplICYmIHZhbC5kZWluaXRpYWxpemUoKTsgfSk7XG4gICAgaWYodGhpcy5jYWNoZSl7XG4gICAgICB0aGlzLmNhY2hlLmNvbGxlY3Rpb24uZGVpbml0aWFsaXplKCk7XG4gICAgICB0aGlzLmNhY2hlLm1vZGVsLmRlaW5pdGlhbGl6ZSgpO1xuICAgIH1cbiAgfVxufTtcblxuLy8gRXh0ZW5kIGFsbCBvZiB0aGUgKipSZWJvdW5kIERhdGEqKiBwcm90b3R5cGVzIHdpdGggdGhlc2Ugc2hhcmVkIG1ldGhvZHNcbl8uZXh0ZW5kKE1vZGVsLnByb3RvdHlwZSwgc2hhcmVkTWV0aG9kcyk7XG5fLmV4dGVuZChDb2xsZWN0aW9uLnByb3RvdHlwZSwgc2hhcmVkTWV0aG9kcyk7XG5fLmV4dGVuZChDb21wdXRlZFByb3BlcnR5LnByb3RvdHlwZSwgc2hhcmVkTWV0aG9kcyk7XG5cbmV4cG9ydCB7IE1vZGVsLCBDb2xsZWN0aW9uLCBDb21wdXRlZFByb3BlcnR5IH07XG4iLCIvLyBSZWJvdW5kIFV0aWxzXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbnZhciAkID0gZnVuY3Rpb24ocXVlcnkpe1xuICByZXR1cm4gbmV3IHV0aWxzKHF1ZXJ5KTtcbn07XG5cbnZhciB1dGlscyA9IGZ1bmN0aW9uKHF1ZXJ5KXtcbiAgdmFyIGksIHNlbGVjdG9yID0gXy5pc0VsZW1lbnQocXVlcnkpICYmIFtxdWVyeV0gfHwgKHF1ZXJ5ID09PSBkb2N1bWVudCkgJiYgW2RvY3VtZW50XSB8fCBfLmlzU3RyaW5nKHF1ZXJ5KSAmJiBxdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KSB8fCBbXTtcbiAgdGhpcy5sZW5ndGggPSBzZWxlY3Rvci5sZW5ndGg7XG5cbiAgLy8gQWRkIHNlbGVjdG9yIHRvIG9iamVjdCBmb3IgbWV0aG9kIGNoYWluaW5nXG4gIGZvciAoaT0wOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgdGhpc1tpXSA9IHNlbGVjdG9yW2ldO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5mdW5jdGlvbiByZXR1cm5GYWxzZSgpe3JldHVybiBmYWxzZTt9XG5mdW5jdGlvbiByZXR1cm5UcnVlKCl7cmV0dXJuIHRydWU7fVxuXG4kLkV2ZW50ID0gZnVuY3Rpb24oIHNyYywgcHJvcHMgKSB7XG5cdC8vIEFsbG93IGluc3RhbnRpYXRpb24gd2l0aG91dCB0aGUgJ25ldycga2V5d29yZFxuXHRpZiAoICEodGhpcyBpbnN0YW5jZW9mICQuRXZlbnQpICkge1xuXHRcdHJldHVybiBuZXcgJC5FdmVudCggc3JjLCBwcm9wcyApO1xuXHR9XG5cblx0Ly8gRXZlbnQgb2JqZWN0XG5cdGlmICggc3JjICYmIHNyYy50eXBlICkge1xuXHRcdHRoaXMub3JpZ2luYWxFdmVudCA9IHNyYztcblx0XHR0aGlzLnR5cGUgPSBzcmMudHlwZTtcblxuXHRcdC8vIEV2ZW50cyBidWJibGluZyB1cCB0aGUgZG9jdW1lbnQgbWF5IGhhdmUgYmVlbiBtYXJrZWQgYXMgcHJldmVudGVkXG5cdFx0Ly8gYnkgYSBoYW5kbGVyIGxvd2VyIGRvd24gdGhlIHRyZWU7IHJlZmxlY3QgdGhlIGNvcnJlY3QgdmFsdWUuXG5cdFx0dGhpcy5pc0RlZmF1bHRQcmV2ZW50ZWQgPSBzcmMuZGVmYXVsdFByZXZlbnRlZCB8fFxuXHRcdFx0XHRzcmMuZGVmYXVsdFByZXZlbnRlZCA9PT0gdW5kZWZpbmVkICYmXG5cdFx0XHRcdC8vIFN1cHBvcnQ6IEFuZHJvaWQ8NC4wXG5cdFx0XHRcdHNyYy5yZXR1cm5WYWx1ZSA9PT0gZmFsc2UgP1xuXHRcdFx0cmV0dXJuVHJ1ZSA6XG5cdFx0XHRyZXR1cm5GYWxzZTtcblxuXHQvLyBFdmVudCB0eXBlXG5cdH0gZWxzZSB7XG5cdFx0dGhpcy50eXBlID0gc3JjO1xuXHR9XG5cblx0Ly8gUHV0IGV4cGxpY2l0bHkgcHJvdmlkZWQgcHJvcGVydGllcyBvbnRvIHRoZSBldmVudCBvYmplY3Rcblx0aWYgKCBwcm9wcyApIHtcblx0XHRfLmV4dGVuZCggdGhpcywgcHJvcHMgKTtcblx0fVxuXG4gIC8vIENvcHkgb3ZlciBhbGwgb3JpZ2luYWwgZXZlbnQgcHJvcGVydGllc1xuICBfLmV4dGVuZCh0aGlzLCBfLnBpY2soIHRoaXMub3JpZ2luYWxFdmVudCwgW1xuICAgICAgXCJhbHRLZXlcIiwgXCJidWJibGVzXCIsIFwiY2FuY2VsYWJsZVwiLCBcImN0cmxLZXlcIiwgXCJjdXJyZW50VGFyZ2V0XCIsIFwiZXZlbnRQaGFzZVwiLFxuICAgICAgXCJtZXRhS2V5XCIsIFwicmVsYXRlZFRhcmdldFwiLCBcInNoaWZ0S2V5XCIsIFwidGFyZ2V0XCIsIFwidGltZVN0YW1wXCIsIFwidmlld1wiLFxuICAgICAgXCJ3aGljaFwiLCBcImNoYXJcIiwgXCJjaGFyQ29kZVwiLCBcImtleVwiLCBcImtleUNvZGVcIiwgXCJidXR0b25cIiwgXCJidXR0b25zXCIsXG4gICAgICBcImNsaWVudFhcIiwgXCJjbGllbnRZXCIsIFwiXCIsIFwib2Zmc2V0WFwiLCBcIm9mZnNldFlcIiwgXCJwYWdlWFwiLCBcInBhZ2VZXCIsIFwic2NyZWVuWFwiLFxuICAgICAgXCJzY3JlZW5ZXCIsIFwidG9FbGVtZW50XCJcbiAgICBdKSk7XG5cblx0Ly8gQ3JlYXRlIGEgdGltZXN0YW1wIGlmIGluY29taW5nIGV2ZW50IGRvZXNuJ3QgaGF2ZSBvbmVcblx0dGhpcy50aW1lU3RhbXAgPSBzcmMgJiYgc3JjLnRpbWVTdGFtcCB8fCAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuXG5cdC8vIE1hcmsgaXQgYXMgZml4ZWRcblx0dGhpcy5pc0V2ZW50ID0gdHJ1ZTtcbn07XG5cbiQuRXZlbnQucHJvdG90eXBlID0ge1xuXHRjb25zdHJ1Y3RvcjogJC5FdmVudCxcblx0aXNEZWZhdWx0UHJldmVudGVkOiByZXR1cm5GYWxzZSxcblx0aXNQcm9wYWdhdGlvblN0b3BwZWQ6IHJldHVybkZhbHNlLFxuXHRpc0ltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZDogcmV0dXJuRmFsc2UsXG5cblx0cHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlID0gdGhpcy5vcmlnaW5hbEV2ZW50O1xuXG5cdFx0dGhpcy5pc0RlZmF1bHRQcmV2ZW50ZWQgPSByZXR1cm5UcnVlO1xuXG5cdFx0aWYgKCBlICYmIGUucHJldmVudERlZmF1bHQgKSB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXHR9LFxuXHRzdG9wUHJvcGFnYXRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlID0gdGhpcy5vcmlnaW5hbEV2ZW50O1xuXG5cdFx0dGhpcy5pc1Byb3BhZ2F0aW9uU3RvcHBlZCA9IHJldHVyblRydWU7XG5cblx0XHRpZiAoIGUgJiYgZS5zdG9wUHJvcGFnYXRpb24gKSB7XG5cdFx0XHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRcdH1cblx0fSxcblx0c3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZSA9IHRoaXMub3JpZ2luYWxFdmVudDtcblxuXHRcdHRoaXMuaXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQgPSByZXR1cm5UcnVlO1xuXG5cdFx0aWYgKCBlICYmIGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uICkge1xuXHRcdFx0ZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblx0XHR9XG5cblx0XHR0aGlzLnN0b3BQcm9wYWdhdGlvbigpO1xuXHR9XG59O1xuXG5cbnV0aWxzLnByb3RvdHlwZSA9IHtcblxuICAvLyBHaXZlbiBhIHZhbGlkIGRhdGEgcGF0aCwgc3BsaXQgaXQgaW50byBhbiBhcnJheSBvZiBpdHMgcGFydHMuXG4gIC8vIGV4OiBmb28uYmFyWzBdLmJheiAtLT4gWydmb28nLCAndmFyJywgJzAnLCAnYmF6J11cbiAgc3BsaXRQYXRoOiBmdW5jdGlvbihwYXRoKXtcbiAgICBwYXRoID0gKCcuJytwYXRoKycuJykuc3BsaXQoLyg/OlxcLnxcXFt8XFxdKSsvKTtcbiAgICBwYXRoLnBvcCgpO1xuICAgIHBhdGguc2hpZnQoKTtcbiAgICByZXR1cm4gcGF0aDtcbiAgfSxcblxuICAvLyBBcHBsaWVzIGZ1bmN0aW9uIGBmdW5jYCBkZXB0aCBmaXJzdCB0byBldmVyeSBub2RlIGluIHRoZSBzdWJ0cmVlIHN0YXJ0aW5nIGZyb20gYHJvb3RgXG4gIHdhbGtUaGVET006IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICB2YXIgZWwsIHJvb3QsIGxlbiA9IHRoaXMubGVuZ3RoO1xuICAgIHdoaWxlKGxlbi0tKXtcbiAgICAgIHJvb3QgPSB0aGlzW2xlbl07XG4gICAgICBmdW5jKHJvb3QpO1xuICAgICAgcm9vdCA9IHJvb3QuZmlyc3RDaGlsZDtcbiAgICAgIHdoaWxlIChyb290KSB7XG4gICAgICAgICAgJChyb290KS53YWxrVGhlRE9NKGZ1bmMpO1xuICAgICAgICAgIHJvb3QgPSByb290Lm5leHRTaWJsaW5nO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICAvLyBFdmVudHMgcmVnaXN0cnkuIEFuIG9iamVjdCBjb250YWluaW5nIGFsbCBldmVudHMgYm91bmQgdGhyb3VnaCB0aGlzIHV0aWwgc2hhcmVkIGFtb25nIGFsbCBpbnN0YW5jZXMuXG4gIF9ldmVudHM6IHt9LFxuXG4gIC8vIFRha2VzIHRoZSB0YXJnZWQgdGhlIGV2ZW50IGZpcmVkIG9uIGFuZCByZXR1cm5zIGFsbCBjYWxsYmFja3MgZm9yIHRoZSBkZWxlZ2F0ZWQgZWxlbWVudFxuICBfaGFzRGVsZWdhdGU6IGZ1bmN0aW9uKHRhcmdldCwgZGVsZWdhdGUsIGV2ZW50VHlwZSl7XG4gICAgdmFyIGNhbGxiYWNrcyA9IFtdO1xuXG4gICAgLy8gR2V0IG91ciBjYWxsYmFja3NcbiAgICBpZih0YXJnZXQuZGVsZWdhdGVHcm91cCAmJiB0aGlzLl9ldmVudHNbdGFyZ2V0LmRlbGVnYXRlR3JvdXBdW2V2ZW50VHlwZV0pe1xuICAgICAgXy5lYWNoKHRoaXMuX2V2ZW50c1t0YXJnZXQuZGVsZWdhdGVHcm91cF1bZXZlbnRUeXBlXSwgZnVuY3Rpb24oY2FsbGJhY2tzTGlzdCwgZGVsZWdhdGVJZCl7XG4gICAgICAgIGlmKF8uaXNBcnJheShjYWxsYmFja3NMaXN0KSAmJiAoZGVsZWdhdGVJZCA9PT0gZGVsZWdhdGUuZGVsZWdhdGVJZCB8fCAoIGRlbGVnYXRlLm1hdGNoZXNTZWxlY3RvciAmJiBkZWxlZ2F0ZS5tYXRjaGVzU2VsZWN0b3IoZGVsZWdhdGVJZCkgKSkgKXtcbiAgICAgICAgICBjYWxsYmFja3MgPSBjYWxsYmFja3MuY29uY2F0KGNhbGxiYWNrc0xpc3QpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG5cbiAgICByZXR1cm4gY2FsbGJhY2tzO1xuICB9LFxuXG4gIC8vIFRyaWdnZXJzIGFuIGV2ZW50IG9uIGEgZ2l2ZW4gZG9tIG5vZGVcbiAgdHJpZ2dlcjogZnVuY3Rpb24oZXZlbnROYW1lLCBvcHRpb25zKXtcbiAgICB2YXIgZWwsIGxlbiA9IHRoaXMubGVuZ3RoO1xuICAgIHdoaWxlKGxlbi0tKXtcbiAgICAgIGVsID0gdGhpc1tsZW5dO1xuICAgICAgaWYgKGRvY3VtZW50LmNyZWF0ZUV2ZW50KSB7XG4gICAgICAgIHZhciBldmVudCA9IGRvY3VtZW50LmNyZWF0ZUV2ZW50KCdIVE1MRXZlbnRzJyk7XG4gICAgICAgIGV2ZW50LmluaXRFdmVudChldmVudE5hbWUsIHRydWUsIGZhbHNlKTtcbiAgICAgICAgZWwuZGlzcGF0Y2hFdmVudChldmVudCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBlbC5maXJlRXZlbnQoJ29uJytldmVudE5hbWUpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBvZmY6IGZ1bmN0aW9uKGV2ZW50VHlwZSwgaGFuZGxlcil7XG4gICAgdmFyIGVsLCBsZW4gPSB0aGlzLmxlbmd0aCwgZXZlbnRDb3VudDtcblxuICAgIHdoaWxlKGxlbi0tKXtcblxuICAgICAgZWwgPSB0aGlzW2xlbl07XG4gICAgICBldmVudENvdW50ID0gMDtcblxuICAgICAgaWYoZWwuZGVsZWdhdGVHcm91cCl7XG4gICAgICAgIGlmKHRoaXMuX2V2ZW50c1tlbC5kZWxlZ2F0ZUdyb3VwXVtldmVudFR5cGVdICYmIF8uaXNBcnJheSh0aGlzLl9ldmVudHNbZWwuZGVsZWdhdGVHcm91cF1bZXZlbnRUeXBlXVtlbC5kZWxlZ2F0ZUlkXSkpe1xuICAgICAgICAgIF8uZWFjaCh0aGlzLl9ldmVudHNbZWwuZGVsZWdhdGVHcm91cF1bZXZlbnRUeXBlXSwgZnVuY3Rpb24oZGVsZWdhdGUsIGluZGV4LCBkZWxlZ2F0ZUxpc3Qpe1xuICAgICAgICAgICAgXy5lYWNoKGRlbGVnYXRlTGlzdCwgZnVuY3Rpb24oY2FsbGJhY2ssIGluZGV4LCBjYWxsYmFja0xpc3Qpe1xuICAgICAgICAgICAgICBpZihjYWxsYmFjayA9PT0gaGFuZGxlcil7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGNhbGxiYWNrTGlzdFtpbmRleF07XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGV2ZW50Q291bnQrKztcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIHRoZXJlIGFyZSBubyBtb3JlIG9mIHRoaXMgZXZlbnQgdHlwZSBkZWxlZ2F0ZWQgZm9yIHRoaXMgZ3JvdXAsIHJlbW92ZSB0aGUgbGlzdGVuZXJcbiAgICAgIGlmIChldmVudENvdW50ID09PSAwICYmIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIpe1xuICAgICAgICBlbC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgfVxuICAgICAgaWYgKGV2ZW50Q291bnQgPT09IDAgJiYgZWwuZGV0YWNoRXZlbnQpe1xuICAgICAgICBlbC5kZXRhY2hFdmVudCgnb24nK2V2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgICB9XG5cbiAgICB9XG4gIH0sXG5cbiAgb246IGZ1bmN0aW9uIChldmVudE5hbWUsIGRlbGVnYXRlLCBkYXRhLCBoYW5kbGVyKSB7XG4gICAgdmFyIGVsLFxuICAgICAgICBldmVudHMgPSB0aGlzLl9ldmVudHMsXG4gICAgICAgIGxlbiA9IHRoaXMubGVuZ3RoLFxuICAgICAgICBldmVudE5hbWVzID0gZXZlbnROYW1lLnNwbGl0KCcgJyksXG4gICAgICAgIGRlbGVnYXRlSWQsIGRlbGVnYXRlR3JvdXA7XG5cbiAgICB3aGlsZShsZW4tLSl7XG4gICAgICBlbCA9IHRoaXNbbGVuXTtcblxuICAgICAgLy8gTm9ybWFsaXplIGRhdGEgaW5wdXRcbiAgICAgIGlmKF8uaXNGdW5jdGlvbihkZWxlZ2F0ZSkpe1xuICAgICAgICBoYW5kbGVyID0gZGVsZWdhdGU7XG4gICAgICAgIGRlbGVnYXRlID0gZWw7XG4gICAgICAgIGRhdGEgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmKF8uaXNGdW5jdGlvbihkYXRhKSl7XG4gICAgICAgIGhhbmRsZXIgPSBkYXRhO1xuICAgICAgICBkYXRhID0ge307XG4gICAgICB9XG4gICAgICBpZighXy5pc1N0cmluZyhkZWxlZ2F0ZSkgJiYgIV8uaXNFbGVtZW50KGRlbGVnYXRlKSl7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJEZWxlZ2F0ZSB2YWx1ZSBwYXNzZWQgdG8gUmVib3VuZCdzICQub24gaXMgbmVpdGhlciBhbiBlbGVtZW50IG9yIGNzcyBzZWxlY3RvclwiKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBkZWxlZ2F0ZUlkID0gXy5pc1N0cmluZyhkZWxlZ2F0ZSkgPyBkZWxlZ2F0ZSA6IChkZWxlZ2F0ZS5kZWxlZ2F0ZUlkID0gZGVsZWdhdGUuZGVsZWdhdGVJZCB8fCBfLnVuaXF1ZUlkKCdldmVudCcpKTtcbiAgICAgIGRlbGVnYXRlR3JvdXAgPSBlbC5kZWxlZ2F0ZUdyb3VwID0gKGVsLmRlbGVnYXRlR3JvdXAgfHwgXy51bmlxdWVJZCgnZGVsZWdhdGVHcm91cCcpKTtcblxuICAgICAgXy5lYWNoKGV2ZW50TmFtZXMsIGZ1bmN0aW9uKGV2ZW50TmFtZSl7XG5cbiAgICAgICAgLy8gRW5zdXJlIGV2ZW50IG9iaiBleGlzdGFuY2VcbiAgICAgICAgZXZlbnRzW2RlbGVnYXRlR3JvdXBdID0gZXZlbnRzW2RlbGVnYXRlR3JvdXBdIHx8IHt9O1xuXG4gICAgICAgIC8vIFRPRE86IHRha2Ugb3V0IG9mIGxvb3BcbiAgICAgICAgdmFyIGNhbGxiYWNrID0gZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgICB2YXIgdGFyZ2V0LCBpLCBsZW4sIGV2ZW50TGlzdCwgY2FsbGJhY2tzLCBjYWxsYmFjaywgZmFsc3k7XG4gICAgICAgICAgICAgIGV2ZW50ID0gbmV3ICQuRXZlbnQoKGV2ZW50IHx8IHdpbmRvdy5ldmVudCkpOyAvLyBDb252ZXJ0IHRvIG11dGFibGUgZXZlbnRcbiAgICAgICAgICAgICAgdGFyZ2V0ID0gZXZlbnQudGFyZ2V0IHx8IGV2ZW50LnNyY0VsZW1lbnQ7XG5cbiAgICAgICAgICAgICAgLy8gVHJhdmVsIGZyb20gdGFyZ2V0IHVwIHRvIHBhcmVudCBmaXJpbmcgZXZlbnQgb24gZGVsZWdhdGUgd2hlbiBpdCBleGl6dHNcbiAgICAgICAgICAgICAgd2hpbGUodGFyZ2V0KXtcblxuICAgICAgICAgICAgICAgIC8vIEdldCBhbGwgc3BlY2lmaWVkIGNhbGxiYWNrcyAoZWxlbWVudCBzcGVjaWZpYyBhbmQgc2VsZWN0b3Igc3BlY2lmaWVkKVxuICAgICAgICAgICAgICAgIGNhbGxiYWNrcyA9ICQuX2hhc0RlbGVnYXRlKGVsLCB0YXJnZXQsIGV2ZW50LnR5cGUpO1xuXG4gICAgICAgICAgICAgICAgbGVuID0gY2FsbGJhY2tzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgICAgICAgICAgICAgICBldmVudC50YXJnZXQgPSBldmVudC5zcmNFbGVtZW50ID0gdGFyZ2V0OyAgICAgICAgICAgICAgIC8vIEF0dGFjaCB0aGlzIGxldmVsJ3MgdGFyZ2V0XG4gICAgICAgICAgICAgICAgICBldmVudC5kYXRhID0gY2FsbGJhY2tzW2ldLmRhdGE7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEF0dGFjaCBvdXIgZGF0YSB0byB0aGUgZXZlbnRcbiAgICAgICAgICAgICAgICAgIGV2ZW50LnJlc3VsdCA9IGNhbGxiYWNrc1tpXS5jYWxsYmFjay5jYWxsKGVsLCBldmVudCk7ICAgLy8gQ2FsbCB0aGUgY2FsbGJhY2tcbiAgICAgICAgICAgICAgICAgIGZhbHN5ID0gKCBldmVudC5yZXN1bHQgPT09IGZhbHNlICkgPyB0cnVlIDogZmFsc3k7ICAgICAgLy8gSWYgYW55IGNhbGxiYWNrIHJldHVybnMgZmFsc2UsIGxvZyBpdCBhcyBmYWxzeVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIElmIGFueSBvZiB0aGUgY2FsbGJhY2tzIHJldHVybmVkIGZhbHNlLCBwcmV2ZW50IGRlZmF1bHQgYW5kIHN0b3AgcHJvcGFnYXRpb25cbiAgICAgICAgICAgICAgICBpZihmYWxzeSl7XG4gICAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGFyZ2V0ID0gdGFyZ2V0LnBhcmVudE5vZGU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgLy8gSWYgdGhpcyBpcyB0aGUgZmlyc3QgZXZlbnQgb2YgaXRzIHR5cGUsIGFkZCB0aGUgZXZlbnQgaGFuZGxlclxuICAgICAgICAvLyBBZGRFdmVudExpc3RlbmVyIHN1cHBvcnRzIElFOStcbiAgICAgICAgaWYoIWV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdKXtcbiAgICAgICAgICAvLyBJZiBldmVudCBpcyBmb2N1cyBvciBibHVyLCB1c2UgY2FwdHVyZSB0byBhbGxvdyBmb3IgZXZlbnQgZGVsZWdhdGlvbi5cbiAgICAgICAgICBlbC5hZGRFdmVudExpc3RlbmVyKGV2ZW50TmFtZSwgY2FsbGJhY2ssIChldmVudE5hbWUgPT09ICdmb2N1cycgfHwgZXZlbnROYW1lID09PSAnYmx1cicpKTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgLy8gQWRkIG91ciBsaXN0ZW5lclxuICAgICAgICBldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXSA9IGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdIHx8IHt9O1xuICAgICAgICBldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXVtkZWxlZ2F0ZUlkXSA9IGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdW2RlbGVnYXRlSWRdIHx8IFtdO1xuICAgICAgICBldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXVtkZWxlZ2F0ZUlkXS5wdXNoKHtjYWxsYmFjazogaGFuZGxlciwgZGF0YTogZGF0YX0pO1xuXG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG4gIH0sXG5cbiAgZmxhdHRlbjogZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciByZXN1bHQgPSB7fTtcbiAgICBmdW5jdGlvbiByZWN1cnNlIChjdXIsIHByb3ApIHtcbiAgICAgIGlmIChPYmplY3QoY3VyKSAhPT0gY3VyKSB7XG4gICAgICAgIHJlc3VsdFtwcm9wXSA9IGN1cjtcbiAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShjdXIpKSB7XG4gICAgICAgIGZvcih2YXIgaT0wLCBsPWN1ci5sZW5ndGg7IGk8bDsgaSsrKVxuICAgICAgICAgIHJlY3Vyc2UoY3VyW2ldLCBwcm9wICsgXCJbXCIgKyBpICsgXCJdXCIpO1xuICAgICAgICAgIGlmIChsID09PSAwKVxuICAgICAgICAgICAgcmVzdWx0W3Byb3BdID0gW107XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciBpc0VtcHR5ID0gdHJ1ZTtcbiAgICAgICAgICAgIGZvciAodmFyIHAgaW4gY3VyKSB7XG4gICAgICAgICAgICAgIGlzRW1wdHkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgcmVjdXJzZShjdXJbcF0sIHByb3AgPyBwcm9wK1wiLlwiK3AgOiBwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChpc0VtcHR5ICYmIHByb3ApXG4gICAgICAgICAgICAgIHJlc3VsdFtwcm9wXSA9IHt9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZWN1cnNlKGRhdGEsIFwiXCIpO1xuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH0sXG5cbiAgdW5NYXJrTGlua3M6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGxpbmtzID0gdGhpc1swXS5xdWVyeVNlbGVjdG9yQWxsKCdhW2hyZWY9XCIvJytCYWNrYm9uZS5oaXN0b3J5LmZyYWdtZW50KydcIl0nKVxuICAgIGZvcih2YXIgaT0wO2k8bGlua3MubGVuZ3RoO2krKyl7XG4gICAgICBsaW5rcy5pdGVtKGkpLmNsYXNzTGlzdC5yZW1vdmUoJ2FjdGl2ZScpO1xuICAgICAgbGlua3MuaXRlbShpKS5hY3RpdmUgPSBmYWxzZTtcbiAgICB9XG4gIH0sXG4gIG1hcmtMaW5rczogZnVuY3Rpb24oKXtcbiAgICB2YXIgbGlua3MgPSB0aGlzWzBdLnF1ZXJ5U2VsZWN0b3JBbGwoJ2FbaHJlZj1cIi8nK0JhY2tib25lLmhpc3RvcnkuZnJhZ21lbnQrJ1wiXScpO1xuICAgIGZvcih2YXIgaT0wO2k8bGlua3MubGVuZ3RoO2krKyl7XG4gICAgICBsaW5rcy5pdGVtKGkpLmNsYXNzTGlzdC5hZGQoJ2FjdGl2ZScpO1xuICAgICAgbGlua3MuaXRlbShpKS5hY3RpdmUgPSB0cnVlO1xuICAgIH1cbiAgfSxcblxuICAvLyBodHRwOi8va3Jhc2ltaXJ0c29uZXYuY29tL2Jsb2cvYXJ0aWNsZS9Dcm9zcy1icm93c2VyLWhhbmRsaW5nLW9mLUFqYXgtcmVxdWVzdHMtaW4tYWJzdXJkanNcbiAgYWpheDogZnVuY3Rpb24ob3BzKSB7XG4gICAgICBpZih0eXBlb2Ygb3BzID09ICdzdHJpbmcnKSBvcHMgPSB7IHVybDogb3BzIH07XG4gICAgICBvcHMudXJsID0gb3BzLnVybCB8fCAnJztcbiAgICAgIG9wcy5qc29uID0gb3BzLmpzb24gfHwgdHJ1ZTtcbiAgICAgIG9wcy5tZXRob2QgPSBvcHMubWV0aG9kIHx8ICdnZXQnO1xuICAgICAgb3BzLmRhdGEgPSBvcHMuZGF0YSB8fCB7fTtcbiAgICAgIHZhciBnZXRQYXJhbXMgPSBmdW5jdGlvbihkYXRhLCB1cmwpIHtcbiAgICAgICAgICB2YXIgYXJyID0gW10sIHN0cjtcbiAgICAgICAgICBmb3IodmFyIG5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICBhcnIucHVzaChuYW1lICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbbmFtZV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RyID0gYXJyLmpvaW4oJyYnKTtcbiAgICAgICAgICBpZihzdHIgIT09ICcnKSB7XG4gICAgICAgICAgICAgIHJldHVybiB1cmwgPyAodXJsLmluZGV4T2YoJz8nKSA8IDAgPyAnPycgKyBzdHIgOiAnJicgKyBzdHIpIDogc3RyO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9O1xuICAgICAgdmFyIGFwaSA9IHtcbiAgICAgICAgICBob3N0OiB7fSxcbiAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbihvcHMpIHtcbiAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICB0aGlzLnhociA9IG51bGw7XG4gICAgICAgICAgICAgIGlmKHdpbmRvdy5BY3RpdmVYT2JqZWN0KSB7IHRoaXMueGhyID0gbmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7IH1cbiAgICAgICAgICAgICAgZWxzZSBpZih3aW5kb3cuWE1MSHR0cFJlcXVlc3QpIHsgdGhpcy54aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTsgfVxuICAgICAgICAgICAgICBpZih0aGlzLnhocikge1xuICAgICAgICAgICAgICAgICAgdGhpcy54aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi54aHIucmVhZHlTdGF0ZSA9PSA0ICYmIHNlbGYueGhyLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHNlbGYueGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYob3BzLmpzb24gPT09IHRydWUgJiYgdHlwZW9mIEpTT04gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRvbmVDYWxsYmFjayAmJiBzZWxmLmRvbmVDYWxsYmFjay5hcHBseShzZWxmLmhvc3QsIFtyZXN1bHQsIHNlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wcy5zdWNjZXNzICYmIG9wcy5zdWNjZXNzLmFwcGx5KHNlbGYuaG9zdCwgW3Jlc3VsdCwgc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoc2VsZi54aHIucmVhZHlTdGF0ZSA9PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZmFpbENhbGxiYWNrICYmIHNlbGYuZmFpbENhbGxiYWNrLmFwcGx5KHNlbGYuaG9zdCwgW3NlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wcy5lcnJvciAmJiBvcHMuZXJyb3IuYXBwbHkoc2VsZi5ob3N0LCBbc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgc2VsZi5hbHdheXNDYWxsYmFjayAmJiBzZWxmLmFsd2F5c0NhbGxiYWNrLmFwcGx5KHNlbGYuaG9zdCwgW3NlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgb3BzLmNvbXBsZXRlICYmIG9wcy5jb21wbGV0ZS5hcHBseShzZWxmLmhvc3QsIFtzZWxmLnhocl0pO1xuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZihvcHMubWV0aG9kID09ICdnZXQnKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhoci5vcGVuKFwiR0VUXCIsIG9wcy51cmwgKyBnZXRQYXJhbXMob3BzLmRhdGEsIG9wcy51cmwpLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVycyh7XG4gICAgICAgICAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0J1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhoci5vcGVuKG9wcy5tZXRob2QsIG9wcy51cmwsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXJzKHtcbiAgICAgICAgICAgICAgICAgICAgICAnWC1SZXF1ZXN0ZWQtV2l0aCc6ICdYTUxIdHRwUmVxdWVzdCcsXG4gICAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZihvcHMuaGVhZGVycyAmJiB0eXBlb2Ygb3BzLmhlYWRlcnMgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVycyhvcHMuaGVhZGVycyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIG9wcy5tZXRob2QgPT0gJ2dldCcgPyBzZWxmLnhoci5zZW5kKCkgOiBzZWxmLnhoci5zZW5kKGdldFBhcmFtcyhvcHMuZGF0YSkpO1xuICAgICAgICAgICAgICB9LCAyMCk7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnhocjtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRvbmU6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIHRoaXMuZG9uZUNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZmFpbDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgdGhpcy5mYWlsQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhbHdheXM6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIHRoaXMuYWx3YXlzQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXRIZWFkZXJzOiBmdW5jdGlvbihoZWFkZXJzKSB7XG4gICAgICAgICAgICAgIGZvcih2YXIgbmFtZSBpbiBoZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhociAmJiB0aGlzLnhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIGhlYWRlcnNbbmFtZV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJldHVybiBhcGkucHJvY2VzcyhvcHMpO1xuICB9XG59O1xuXG5fLmV4dGVuZCgkLCB1dGlscy5wcm90b3R5cGUpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgJDtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
//The modules for your project will be inlined above
//this snippet. Ask almond to synchronously require the
//module value for 'main' here and return it as the
//value to use for the public API for the built file.

  return require(['runtime']);
}));

require.config({
    baseUrl: "/"
});

require(['Rebound']);
