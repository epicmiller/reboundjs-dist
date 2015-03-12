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
/*!
 * Shim for MutationObserver interface
 * Author: Graeme Yeates (github.com/megawac)
 * Repository: https://github.com/megawac/MutationObserver.js
 * License: WTFPL V2, 2004 (wtfpl.net).
 * Though credit and staring the repo will make me feel pretty, you can modify and redistribute as you please.
 * Attempts to follow spec (http://www.w3.org/TR/dom/#mutation-observers) as closely as possible for native javascript
 * See https://github.com/WebKit/webkit/blob/master/Source/WebCore/dom/MutationObserver.cpp for current webkit source c++ implementation
 */

/**
 * prefix bugs:
    -https://bugs.webkit.org/show_bug.cgi?id=85161
    -https://bugzilla.mozilla.org/show_bug.cgi?id=749920
*/
this.MutationObserver = this.MutationObserver || this.WebKitMutationObserver || (function(undefined) {
    "use strict";
    /**
     * @param {function(Array.<MutationRecord>, MutationObserver)} listener
     * @constructor
     */
    function MutationObserver(listener) {
        /**
         * @type {Array.<Object>}
         * @private
         */
        this._watched = [];
        /** @private */
        this._listener = listener;
    }

    /**
     * Start a recursive timeout function to check all items being observed for mutations
     * @type {MutationObserver} observer
     * @private
     */
    function startMutationChecker(observer) {
        (function check() {
            var mutations = observer.takeRecords();

            if (mutations.length) { //fire away
                //calling the listener with context is not spec but currently consistent with FF and WebKit
                observer._listener(mutations, observer);
            }
            /** @private */
            observer._timeout = setTimeout(check, MutationObserver._period);
        })();
    }

    /**
     * Period to check for mutations (~32 times/sec)
     * @type {number}
     * @expose
     */
    MutationObserver._period = 30 /*ms+runtime*/ ;

    /**
     * Exposed API
     * @expose
     * @final
     */
    MutationObserver.prototype = {
        /**
         * see http://dom.spec.whatwg.org/#dom-mutationobserver-observe
         * not going to throw here but going to follow the current spec config sets
         * @param {Node|null} $target
         * @param {Object|null} config : MutationObserverInit configuration dictionary
         * @expose
         * @return undefined
         */
        observe: function($target, config) {
            /**
             * Using slightly different names so closure can go ham
             * @type {!Object} : A custom mutation config
             */
            var settings = {
                attr: !! (config.attributes || config.attributeFilter || config.attributeOldValue),

                //some browsers are strict in their implementation that config.subtree and childList must be set together. We don't care - spec doesn't specify
                kids: !! config.childList,
                descendents: !! config.subtree,
                charData: !! (config.characterData || config.characterDataOldValue)
            };

            var watched = this._watched;

            //remove already observed target element from pool
            for (var i = 0; i < watched.length; i++) {
                if (watched[i].tar === $target) watched.splice(i, 1);
            }

            if (config.attributeFilter) {
                /**
                 * converts to a {key: true} dict for faster lookup
                 * @type {Object.<String,Boolean>}
                 */
                settings.afilter = reduce(config.attributeFilter, function(a, b) {
                    a[b] = true;
                    return a;
                }, {});
            }

            watched.push({
                tar: $target,
                fn: createMutationSearcher($target, settings)
            });

            //reconnect if not connected
            if (!this._timeout) {
                startMutationChecker(this);
            }
        },

        /**
         * Finds mutations since last check and empties the "record queue" i.e. mutations will only be found once
         * @expose
         * @return {Array.<MutationRecord>}
         */
        takeRecords: function() {
            var mutations = [];
            var watched = this._watched;

            for (var i = 0; i < watched.length; i++) {
                watched[i].fn(mutations);
            }

            return mutations;
        },

        /**
         * @expose
         * @return undefined
         */
        disconnect: function() {
            this._watched = []; //clear the stuff being observed
            clearTimeout(this._timeout); //ready for garbage collection
            /** @private */
            this._timeout = null;
        }
    };

    /**
     * Simple MutationRecord pseudoclass. No longer exposing as its not fully compliant
     * @param {Object} data
     * @return {Object} a MutationRecord
     */
    function MutationRecord(data) {
        var settings = { //technically these should be on proto so hasOwnProperty will return false for non explicitly props
            type: null,
            target: null,
            addedNodes: [],
            removedNodes: [],
            previousSibling: null,
            nextSibling: null,
            attributeName: null,
            attributeNamespace: null,
            oldValue: null
        };
        for (var prop in data) {
            if (has(settings, prop) && data[prop] !== undefined) settings[prop] = data[prop];
        }
        return settings;
    }

    /**
     * Creates a func to find all the mutations
     *
     * @param {Node} $target
     * @param {!Object} config : A custom mutation config
     */
    function createMutationSearcher($target, config) {
        /** type {Elestuct} */
        var $oldstate = clone($target, config); //create the cloned datastructure

        /**
         * consumes array of mutations we can push to
         *
         * @param {Array.<MutationRecord>} mutations
         */
        return function(mutations) {
            var olen = mutations.length;

            //Alright we check base level changes in attributes... easy
            if (config.attr && $oldstate.attr) {
                findAttributeMutations(mutations, $target, $oldstate.attr, config.afilter);
            }

            //check childlist or subtree for mutations
            if (config.kids || config.descendents) {
                searchSubtree(mutations, $target, $oldstate, config);
            }


            //reclone data structure if theres changes
            if (mutations.length !== olen) {
                /** type {Elestuct} */
                $oldstate = clone($target, config);
            }
        };
    }

    /* attributes + attributeFilter helpers */

    /**
     * fast helper to check to see if attributes object of an element has changed
     * doesnt handle the textnode case
     *
     * @param {Array.<MutationRecord>} mutations
     * @param {Node} $target
     * @param {Object.<string, string>} $oldstate : Custom attribute clone data structure from clone
     * @param {Object} filter
     */
    function findAttributeMutations(mutations, $target, $oldstate, filter) {
        var checked = {};
        var attributes = $target.attributes;
        var attr;
        var name;
        var i = attributes.length;
        while (i--) {
            attr = attributes[i];
            name = attr.name;
            if (!filter || has(filter, name)) {
                if (attr.value !== $oldstate[name]) {
                    //The pushing is redundant but gzips very nicely
                    mutations.push(MutationRecord({
                        type: "attributes",
                        target: $target,
                        attributeName: name,
                        oldValue: $oldstate[name],
                        attributeNamespace: attr.namespaceURI //in ie<8 it incorrectly will return undefined
                    }));
                }
                checked[name] = true;
            }
        }
        for (name in $oldstate) {
            if (!(checked[name])) {
                mutations.push(MutationRecord({
                    target: $target,
                    type: "attributes",
                    attributeName: name,
                    oldValue: $oldstate[name]
                }));
            }
        }
    }

    /**
     * searchSubtree: array of mutations so far, element, element clone, bool
     * synchronous dfs comparision of two nodes
     * This function is applied to any observed element with childList or subtree specified
     * Sorry this is kind of confusing as shit, tried to comment it a bit...
     * codereview.stackexchange.com/questions/38351 discussion of an earlier version of this func
     *
     * @param {Array} mutations
     * @param {Node} $target
     * @param {!Object} $oldstate : A custom cloned node from clone()
     * @param {!Object} config : A custom mutation config
     */
    function searchSubtree(mutations, $target, $oldstate, config) {
        /*
         * Helper to identify node rearrangment and stuff...
         * There is no gaurentee that the same node will be identified for both added and removed nodes
         * if the positions have been shuffled.
         * conflicts array will be emptied by end of operation
         */
        function resolveConflicts(conflicts, node, $kids, $oldkids, numAddedNodes) {
            // the distance between the first conflicting node and the last
            var distance = conflicts.length - 1;
            // prevents same conflict being resolved twice consider when two nodes switch places.
            // only one should be given a mutation event (note -~ is used as a math.ceil shorthand)
            var counter = -~((distance - numAddedNodes) / 2);
            var $cur;
            var oldstruct;
            var conflict;
            while((conflict = conflicts.pop())) {
                $cur = $kids[conflict.i];
                oldstruct = $oldkids[conflict.j];

                //attempt to determine if there was node rearrangement... won't gaurentee all matches
                //also handles case where added/removed nodes cause nodes to be identified as conflicts
                if (config.kids && counter && Math.abs(conflict.i - conflict.j) >= distance) {
                    mutations.push(MutationRecord({
                        type: "childList",
                        target: node,
                        addedNodes: [$cur],
                        removedNodes: [$cur],
                        // haha don't rely on this please
                        nextSibling: $cur.nextSibling,
                        previousSibling: $cur.previousSibling
                    }));
                    counter--; //found conflict
                }

                //Alright we found the resorted nodes now check for other types of mutations
                if (config.attr && oldstruct.attr) findAttributeMutations(mutations, $cur, oldstruct.attr, config.afilter);
                if (config.charData && $cur.nodeType === 3 && $cur.nodeValue !== oldstruct.charData) {
                    mutations.push(MutationRecord({
                        type: "characterData",
                        target: $cur,
                        oldValue: oldstruct.charData
                    }));
                }
                //now look @ subtree
                if (config.descendents) findMutations($cur, oldstruct);
            }
        }

        /**
         * Main worker. Finds and adds mutations if there are any
         * @param {Node} node
         * @param {!Object} old : A cloned data structure using internal clone
         */
        function findMutations(node, old) {
            var $kids = node.childNodes;
            var $oldkids = old.kids;
            var klen = $kids.length;
            // $oldkids will be undefined for text and comment nodes
            var olen = $oldkids ? $oldkids.length : 0;
            // if (!olen && !klen) return; //both empty; clearly no changes

            //we delay the intialization of these for marginal performance in the expected case (actually quite signficant on large subtrees when these would be otherwise unused)
            //map of checked element of ids to prevent registering the same conflict twice
            var map;
            //array of potential conflicts (ie nodes that may have been re arranged)
            var conflicts;
            var id; //element id from getElementId helper
            var idx; //index of a moved or inserted element

            var oldstruct;
            //current and old nodes
            var $cur;
            var $old;
            //track the number of added nodes so we can resolve conflicts more accurately
            var numAddedNodes = 0;

            //iterate over both old and current child nodes at the same time
            var i = 0, j = 0;
            //while there is still anything left in $kids or $oldkids (same as i < $kids.length || j < $oldkids.length;)
            while( i < klen || j < olen ) {
                //current and old nodes at the indexs
                $cur = $kids[i];
                oldstruct = $oldkids[j];
                $old = oldstruct && oldstruct.node;

                if ($cur === $old) { //expected case - optimized for this case
                    //check attributes as specified by config
                    if (config.attr && oldstruct.attr) /* oldstruct.attr instead of textnode check */findAttributeMutations(mutations, $cur, oldstruct.attr, config.afilter);
                    //check character data if set
                    if (config.charData && $cur.nodeType === 3 && $cur.nodeValue !== oldstruct.charData) {
                        mutations.push(MutationRecord({
                            type: "characterData",
                            target: $cur,
                            oldValue: oldstruct.charData
                        }));
                    }

                    //resolve conflicts; it will be undefined if there are no conflicts - otherwise an array
                    if (conflicts) resolveConflicts(conflicts, node, $kids, $oldkids, numAddedNodes);

                    //recurse on next level of children. Avoids the recursive call when there are no children left to iterate
                    if (config.descendents && ($cur.childNodes.length || oldstruct.kids && oldstruct.kids.length)) findMutations($cur, oldstruct);

                    i++;
                    j++;
                } else { //(uncommon case) lookahead until they are the same again or the end of children
                    if(!map) { //delayed initalization (big perf benefit)
                        map = {};
                        conflicts = [];
                    }
                    if ($cur) {
                        //check id is in the location map otherwise do a indexOf search
                        if (!(map[id = getElementId($cur)])) { //to prevent double checking
                            //mark id as found
                            map[id] = true;
                            //custom indexOf using comparitor checking oldkids[i].node === $cur
                            if ((idx = indexOfCustomNode($oldkids, $cur, j)) === -1) {
                                if (config.kids) {
                                    mutations.push(MutationRecord({
                                        type: "childList",
                                        target: node,
                                        addedNodes: [$cur], //$cur is a new node
                                        nextSibling: $cur.nextSibling,
                                        previousSibling: $cur.previousSibling
                                    }));
                                    numAddedNodes++;
                                }
                            } else {
                                conflicts.push({ //add conflict
                                    i: i,
                                    j: idx
                                });
                            }
                        }
                        i++;
                    }

                    if ($old &&
                       //special case: the changes may have been resolved: i and j appear congurent so we can continue using the expected case
                       $old !== $kids[i]
                    ) {
                        if (!(map[id = getElementId($old)])) {
                            map[id] = true;
                            if ((idx = indexOf($kids, $old, i)) === -1) {
                                if(config.kids) {
                                    mutations.push(MutationRecord({
                                        type: "childList",
                                        target: old.node,
                                        removedNodes: [$old],
                                        nextSibling: $oldkids[j + 1], //praise no indexoutofbounds exception
                                        previousSibling: $oldkids[j - 1]
                                    }));
                                    numAddedNodes--;
                                }
                            } else {
                                conflicts.push({
                                    i: idx,
                                    j: j
                                });
                            }
                        }
                        j++;
                    }
                }//end uncommon case
            }//end loop

            //resolve any remaining conflicts
            if (conflicts) resolveConflicts(conflicts, node, $kids, $oldkids, numAddedNodes);
        }
        findMutations($target, $oldstate);
    }

    /**
     * Utility
     * Cones a element into a custom data structure designed for comparision. https://gist.github.com/megawac/8201012
     *
     * @param {Node} $target
     * @param {!Object} config : A custom mutation config
     * @return {!Object} : Cloned data structure
     */
    function clone($target, config) {
        var recurse = true; // set true so childList we'll always check the first level
        return (function copy($target) {
            var isText = $target.nodeType === 3;
            var elestruct = {
                /** @type {Node} */
                node: $target
            };

            //is text or comemnt node
            if (isText || $target.nodeType === 8) {
                if (isText && config.charData) {
                    elestruct.charData = $target.nodeValue;
                }
            } else { //its either a element or document node (or something stupid)

                if(config.attr && recurse) { // add attr only if subtree is specified or top level
                    /**
                     * clone live attribute list to an object structure {name: val}
                     * @type {Object.<string, string>}
                     */
                    elestruct.attr = reduce($target.attributes, function(memo, attr) {
                        if (!config.afilter || config.afilter[attr.name]) {
                            memo[attr.name] = attr.value;
                        }
                        return memo;
                    }, {});
                }

                // whether we should iterate the children of $target node
                if(recurse && ((config.kids || config.charData) || (config.attr && config.descendents)) ) {
                    /** @type {Array.<!Object>} : Array of custom clone */
                    elestruct.kids = map($target.childNodes, copy);
                }

                recurse = config.descendents;
            }
            return elestruct;
        })($target);
    }

    /**
     * indexOf an element in a collection of custom nodes
     *
     * @param {NodeList} set
     * @param {!Object} $node : A custom cloned node
     * @param {number} idx : index to start the loop
     * @return {number}
     */
    function indexOfCustomNode(set, $node, idx) {
        return indexOf(set, $node, idx, JSCompiler_renameProperty("node"));
    }

    //using a non id (eg outerHTML or nodeValue) is extremely naive and will run into issues with nodes that may appear the same like <li></li>
    var counter = 1; //don't use 0 as id (falsy)
    /** @const */
    var expando = "mo_id";

    /**
     * Attempt to uniquely id an element for hashing. We could optimize this for legacy browsers but it hopefully wont be called enough to be a concern
     *
     * @param {Node} $ele
     * @return {(string|number)}
     */
    function getElementId($ele) {
        try {
            return $ele.id || ($ele[expando] = $ele[expando] || counter++);
        } catch (o_O) { //ie <8 will throw if you set an unknown property on a text node
            try {
                return $ele.nodeValue; //naive
            } catch (shitie) { //when text node is removed: https://gist.github.com/megawac/8355978 :(
                return counter++;
            }
        }
    }

    /**
     * **map** Apply a mapping function to each item of a set
     * @param {Array|NodeList} set
     * @param {Function} iterator
     */
    function map(set, iterator) {
        var results = [];
        for (var index = 0; index < set.length; index++) {
            results[index] = iterator(set[index], index, set);
        }
        return results;
    }

    /**
     * **Reduce** builds up a single result from a list of values
     * @param {Array|NodeList|NamedNodeMap} set
     * @param {Function} iterator
     * @param {*} [memo] Initial value of the memo.
     */
    function reduce(set, iterator, memo) {
        for (var index = 0; index < set.length; index++) {
            memo = iterator(memo, set[index], index, set);
        }
        return memo;
    }

    /**
     * **indexOf** find index of item in collection.
     * @param {Array|NodeList} set
     * @param {Object} item
     * @param {number} idx
     * @param {string} [prop] Property on set item to compare to item
     */
    function indexOf(set, item, idx, prop) {
        for (/*idx = ~~idx*/; idx < set.length; idx++) {//start idx is always given as this is internal
            if ((prop ? set[idx][prop] : set[idx]) === item) return idx;
        }
        return -1;
    }

    /**
     * @param {Object} obj
     * @param {(string|number)} prop
     * @return {boolean}
     */
    function has(obj, prop) {
        return obj[prop] !== undefined; //will be nicely inlined by gcc
    }

    // GCC hack see http://stackoverflow.com/a/23202438/1517919
    function JSCompiler_renameProperty(a) {
        return a;
    }

    return MutationObserver;
})(void 0);
(function(global){var to5Runtime=global.to5Runtime={};to5Runtime.inherits=function(subClass,superClass){if(typeof superClass!=="function"&&superClass!==null){throw new TypeError("Super expression must either be null or a function, not "+typeof superClass)}subClass.prototype=Object.create(superClass&&superClass.prototype,{constructor:{value:subClass,enumerable:false,writable:true,configurable:true}});if(superClass)subClass.__proto__=superClass};to5Runtime.defaults=function(obj,defaults){for(var key in defaults){if(obj[key]===undefined){obj[key]=defaults[key]}}return obj};to5Runtime.prototypeProperties=function(child,staticProps,instanceProps){if(staticProps)Object.defineProperties(child,staticProps);if(instanceProps)Object.defineProperties(child.prototype,instanceProps)};to5Runtime.applyConstructor=function(Constructor,args){var instance=Object.create(Constructor.prototype);var result=Constructor.apply(instance,args);return result!=null&&(typeof result=="object"||typeof result=="function")?result:instance};to5Runtime.taggedTemplateLiteral=function(strings,raw){return Object.freeze(Object.defineProperties(strings,{raw:{value:Object.freeze(raw)}}))};to5Runtime.interopRequire=function(obj){return obj&&(obj["default"]||obj)};to5Runtime.toArray=function(arr){return Array.isArray(arr)?arr:Array.from(arr)};to5Runtime.slicedToArray=function(arr,i){if(Array.isArray(arr)){return arr}else{var _arr=[];for(var _iterator=arr[Symbol.iterator](),_step;!(_step=_iterator.next()).done;){_arr.push(_step.value);if(i&&_arr.length===i)break}return _arr}};to5Runtime.objectWithoutProperties=function(obj,keys){var target={};for(var i in obj){if(keys.indexOf(i)>=0)continue;if(!Object.prototype.hasOwnProperty.call(obj,i))continue;target[i]=obj[i]}return target};to5Runtime.hasOwn=Object.prototype.hasOwnProperty;to5Runtime.slice=Array.prototype.slice;to5Runtime.bind=Function.prototype.bind;to5Runtime.defineProperty=function(obj,key,value){return Object.defineProperty(obj,key,{value:value,enumerable:true,configurable:true,writable:true})};to5Runtime.interopRequireWildcard=function(obj){return obj&&obj.constructor===Object?obj:{"default":obj}};to5Runtime._extends=function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source){target[key]=source[key]}}return target};to5Runtime.get=function get(object,property,receiver){var desc=Object.getOwnPropertyDescriptor(object,property);if(desc===undefined){var parent=Object.getPrototypeOf(object);if(parent===null){return undefined}else{return get(parent,property,receiver)}}else if("value"in desc&&desc.writable){return desc.value}else{var getter=desc.get;if(getter===undefined){return undefined}return getter.call(receiver)}}})(typeof global==="undefined"?self:global);
/*! (C) WebReflection Mit Style License */
(function(e,t,n,r){"use strict";function q(e,t){for(var n=0,r=e.length;n<r;n++)J(e[n],t)}function R(e){for(var t=0,n=e.length,r;t<n;t++)r=e[t],$(r,c[z(r)])}function U(e){return function(t){g.call(L,t)&&(J(t,e),q(t.querySelectorAll(h),e))}}function z(e){var t=e.getAttribute("is");return d.call(l,t?t.toUpperCase():e.nodeName)}function W(e){var t=e.currentTarget,n=e.attrChange,r=e.prevValue,i=e.newValue;t.attributeChangedCallback&&e.attrName!=="style"&&t.attributeChangedCallback(e.attrName,n===e.ADDITION?null:r,n===e.REMOVAL?null:i)}function X(e){var t=U(e);return function(e){t(e.target)}}function V(e,t){var n=this;O.call(n,e,t),B.call(n,{target:n})}function $(e,t){N(e,t),I?I.observe(e,_):(H&&(e.setAttribute=V,e[i]=F(e),e.addEventListener(u,B)),e.addEventListener(o,W)),e.createdCallback&&(e.created=!0,e.createdCallback(),e.created=!1)}function J(e,t){var n,r=z(e),i="attached",s="detached";-1<r&&(C(e,c[r]),r=0,t===i&&!e[i]?(e[s]=!1,e[i]=!0,r=1):t===s&&!e[s]&&(e[i]=!1,e[s]=!0,r=1),r&&(n=e[t+"Callback"])&&n.call(e))}if(r in t)return;var i="__"+r+(Math.random()*1e5>>0),s="extends",o="DOMAttrModified",u="DOMSubtreeModified",a=/^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/,f=["ANNOTATION-XML","COLOR-PROFILE","FONT-FACE","FONT-FACE-SRC","FONT-FACE-URI","FONT-FACE-FORMAT","FONT-FACE-NAME","MISSING-GLYPH"],l=[],c=[],h="",p=t.documentElement,d=l.indexOf||function(e){for(var t=this.length;t--&&this[t]!==e;);return t},v=n.prototype,m=v.hasOwnProperty,g=v.isPrototypeOf,y=n.defineProperty,b=n.getOwnPropertyDescriptor,w=n.getOwnPropertyNames,E=n.getPrototypeOf,S=n.setPrototypeOf,x=!!n.__proto__,T=n.create||function K(e){return e?(K.prototype=e,new K):this},N=S||(x?function(e,t){return e.__proto__=t,e}:w&&b?function(){function e(e,t){for(var n,r=w(t),i=0,s=r.length;i<s;i++)n=r[i],m.call(e,n)||y(e,n,b(t,n))}return function(t,n){do e(t,n);while(n=E(n));return t}}():function(e,t){for(var n in t)e[n]=t[n];return e}),C=S||x?function(e,t){g.call(t,e)||$(e,t)}:function(e,t){e[i]||(e[i]=n(!0),$(e,t))},k=e.MutationObserver||e.WebKitMutationObserver,L=(e.HTMLElement||e.Element||e.Node).prototype,A=L.cloneNode,O=L.setAttribute,M=t.createElement,_=k&&{attributes:!0,characterData:!0,attributeOldValue:!0},D=k||function(e){H=!1,p.removeEventListener(o,D)},P=!1,H=!0,B,j,F,I;k||(p.addEventListener(o,D),p.setAttribute(i,1),p.removeAttribute(i),H&&(B=function(e){var t=this,n,r,s;if(t===e.target){n=t[i],t[i]=r=F(t);for(s in r){if(!(s in n))return j(0,t,s,n[s],r[s],"ADDITION");if(r[s]!==n[s])return j(1,t,s,n[s],r[s],"MODIFICATION")}for(s in n)if(!(s in r))return j(2,t,s,n[s],r[s],"REMOVAL")}},j=function(e,t,n,r,i,s){var o={attrChange:e,currentTarget:t,attrName:n,prevValue:r,newValue:i};o[s]=e,W(o)},F=function(e){for(var t,n,r={},i=e.attributes,s=0,o=i.length;s<o;s++)t=i[s],n=t.name,n!=="setAttribute"&&(r[n]=t.value);return r})),t[r]=function(n,r){y=n.toUpperCase(),P||(P=!0,k?(I=function(e,t){function n(e,t){for(var n=0,r=e.length;n<r;t(e[n++]));}return new k(function(r){for(var i,s,o=0,u=r.length;o<u;o++)i=r[o],i.type==="childList"?(n(i.addedNodes,e),n(i.removedNodes,t)):(s=i.target,s.attributeChangedCallback&&i.attributeName!=="style"&&s.attributeChangedCallback(i.attributeName,i.oldValue,s.getAttribute(i.attributeName)))})}(U("attached"),U("detached")),I.observe(t,{childList:!0,subtree:!0})):(t.addEventListener("DOMNodeInserted",X("attached")),t.addEventListener("DOMNodeRemoved",X("detached"))),t.addEventListener("readystatechange",function(e){q(t.querySelectorAll(h),"attached")}),t.createElement=function(e,n){var r,i=M.apply(t,arguments);return n&&i.setAttribute("is",e=n.toLowerCase()),r=d.call(l,e.toUpperCase()),-1<r&&$(i,c[r]),i},L.cloneNode=function(e){var t=A.call(this,!!e),n=z(t);return-1<n&&$(t,c[n]),e&&R(t.querySelectorAll(h)),t});if(-1<d.call(l,y))throw new Error("A "+n+" type is already registered");if(!a.test(y)||-1<d.call(f,y))throw new Error("The type "+n+" is invalid");var i=function(){return t.createElement(p,u&&y)},o=r||v,u=m.call(o,s),p=u?r[s]:y,g=l.push(y)-1,y;return h=h.concat(h.length?",":"",u?p+'[is="'+n.toLowerCase()+'"]':p),i.prototype=c[g]=m.call(o,"prototype")?o.prototype:T(L),q(t.querySelectorAll(h),"attached"),i}})(window,document,Object,"registerElement");
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

    // Start custom elements observer if using polyfill
    if(window.CustomElements)
      window.CustomElements.observeDocument(document)

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
define("morph",
  ["./morph/morph","./morph/attr-morph","./morph/dom-helper","exports"],
  function(__dependency1__, __dependency2__, __dependency3__, __exports__) {
    "use strict";
    var Morph = __dependency1__["default"];
    var AttrMorph = __dependency2__["default"];
    var DOMHelper = __dependency3__["default"];

    __exports__.Morph = Morph;
    __exports__.AttrMorph = AttrMorph;
    __exports__.DOMHelper = DOMHelper;
  });
define("morph/attr-morph",
  ["./attr-morph/sanitize-attribute-value","./dom-helper/prop","./dom-helper/build-html-dom","../htmlbars-util","exports"],
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
        var sanitized = sanitizeAttributeValue(this.element, this.attrName, value);
        this._update(sanitized, this.namespace);
      } else {
        this._update(value, this.namespace);
      }
    };

    __exports__["default"] = AttrMorph;
  });
define("morph/attr-morph/sanitize-attribute-value",
  ["exports"],
  function(__exports__) {
    "use strict";
    /* jshint scripturl:true */

    var parsingNode;
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
    function sanitizeAttributeValue(element, attribute, value) {
      var tagName;

      if (!parsingNode) {
        parsingNode = document.createElement('a');
      }

      if (!element) {
        tagName = null;
      } else {
        tagName = element.tagName;
      }

      if (value && value.toHTML) {
        return value.toHTML();
      }

      if ((tagName === null || badTags[tagName]) && badAttributes[attribute]) {
        parsingNode.href = value;

        if (badProtocols[parsingNode.protocol] === true) {
          return 'unsafe:' + value;
        }
      }

      return value;
    }

    __exports__.sanitizeAttributeValue = sanitizeAttributeValue;
  });
define("morph/dom-helper",
  ["../morph/morph","../morph/attr-morph","./dom-helper/build-html-dom","./dom-helper/classes","./dom-helper/prop","exports"],
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
      if (!contextualElement && parent.nodeType === 1) {
        contextualElement = parent;
      }
      return new Morph(parent, start, end, this, contextualElement);
    };

    prototype.createUnsafeMorph = function(parent, start, end, contextualElement){
      var morph = this.createMorph(parent, start, end, contextualElement);
      morph.escaped = false;
      return morph;
    };

    // This helper is just to keep the templates good looking,
    // passing integers instead of element references.
    prototype.createMorphAt = function(parent, startIndex, endIndex, contextualElement){
      var start = startIndex === -1 ? null : this.childAtIndex(parent, startIndex),
          end = endIndex === -1 ? null : this.childAtIndex(parent, endIndex);
      return this.createMorph(parent, start, end, contextualElement);
    };

    prototype.createUnsafeMorphAt = function(parent, startIndex, endIndex, contextualElement) {
      var morph = this.createMorphAt(parent, startIndex, endIndex, contextualElement);
      morph.escaped = false;
      return morph;
    };

    prototype.insertMorphBefore = function(element, referenceChild, contextualElement) {
      var start = this.document.createTextNode('');
      var end = this.document.createTextNode('');
      element.insertBefore(start, referenceChild);
      element.insertBefore(end, referenceChild);
      return this.createMorph(element, start, end, contextualElement);
    };

    prototype.appendMorph = function(element, contextualElement) {
      var start = this.document.createTextNode('');
      var end = this.document.createTextNode('');
      element.appendChild(start);
      element.appendChild(end);
      return this.createMorph(element, start, end, contextualElement);
    };

    prototype.parseHTML = function(html, contextualElement) {
      if (interiorNamespace(contextualElement) === svgNamespace) {
        return buildSVGDOM(html, this);
      } else {
        var nodes = buildHTMLDOM(html, contextualElement, this);
        if (detectOmittedStartTag(html, contextualElement)) {
          var node = nodes[0];
          while (node && node.nodeType !== 1) {
            node = node.nextSibling;
          }
          return node.childNodes;
        } else {
          return nodes;
        }
      }
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
define("morph/dom-helper/build-html-dom",
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

    // IE8 create a selected attribute where they should only
    // create a property
    var createsSelectedAttribute = doc && (function(document) {
      var testEl = document.createElement('div');
      testEl.innerHTML = "<select><option></option></select>";
      return testEl.childNodes[0].childNodes[0].getAttribute('selected') === 'selected';
    })(doc);

    var detectAutoSelectedOption;
    if (createsSelectedAttribute) {
      detectAutoSelectedOption = (function(){
        var detectAutoSelectedOptionRegex = /<option[^>]*selected/;
        return function detectAutoSelectedOption(select, option, html) { //jshint ignore:line
          return select.selectedIndex === 0 &&
                 !detectAutoSelectedOptionRegex.test(html);
        };
      })();
    } else {
      detectAutoSelectedOption = function detectAutoSelectedOption(select, option, html) { //jshint ignore:line
        var selectedAttribute = option.getAttribute('selected');
        return select.selectedIndex === 0 && (
                 selectedAttribute === null ||
                 ( selectedAttribute !== '' && selectedAttribute.toLowerCase() !== 'selected' )
                );
      };
    }

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
        contextualElement = dom.cloneNode(contextualElement, false);
        scriptSafeInnerHTML(contextualElement, html);
        return contextualElement.childNodes;
      };
    } else {
      buildDOM = function buildDOM(html, contextualElement, dom){
        contextualElement = dom.cloneNode(contextualElement, false);
        contextualElement.innerHTML = html;
        return contextualElement.childNodes;
      };
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

    // When parsing innerHTML, the browser may set up DOM with some things
    // not desired. For example, with a select element context and option
    // innerHTML the first option will be marked selected.
    //
    // This method cleans up some of that, resetting those values back to
    // their defaults.
    //
    function buildSafeDOM(html, contextualElement, dom) {
      var childNodes = buildIESafeDOM(html, contextualElement, dom);

      if (contextualElement.tagName === 'SELECT') {
        // Walk child nodes
        for (var i = 0; childNodes[i]; i++) {
          // Find and process the first option child node
          if (childNodes[i].tagName === 'OPTION') {
            if (detectAutoSelectedOption(childNodes[i].parentNode, childNodes[i], html)) {
              // If the first node is selected but does not have an attribute,
              // presume it is not really selected.
              childNodes[i].parentNode.selectedIndex = -1;
            }
            break;
          }
        }
      }

      return childNodes;
    }

    var buildHTMLDOM;
    if (needsIntegrationPointFix) {
      buildHTMLDOM = function buildHTMLDOM(html, contextualElement, dom){
        if (svgHTMLIntegrationPoints[contextualElement.tagName]) {
          return buildSafeDOM(html, document.createElement('div'), dom);
        } else {
          return buildSafeDOM(html, contextualElement, dom);
        }
      };
    } else {
      buildHTMLDOM = buildSafeDOM;
    }

    __exports__.buildHTMLDOM = buildHTMLDOM;
  });
define("morph/dom-helper/classes",
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
define("morph/dom-helper/prop",
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
define("morph/morph",
  ["exports"],
  function(__exports__) {
    "use strict";
    var splice = Array.prototype.splice;

    function ensureStartEnd(start, end) {
      if (start === null || end === null) {
        throw new Error('a fragment parent must have boundary nodes in order to detect insertion');
      }
    }

    function ensureContext(contextualElement) {
      if (!contextualElement || contextualElement.nodeType !== 1) {
        throw new Error('An element node must be provided for a contextualElement, you provided ' +
                        (contextualElement ? 'nodeType ' + contextualElement.nodeType : 'nothing'));
      }
    }

    // TODO: this is an internal API, this should be an assert
    function Morph(parent, start, end, domHelper, contextualElement) {
      if (parent.nodeType === 11) {
        ensureStartEnd(start, end);
        this.element = null;
      } else {
        this.element = parent;
      }
      this._parent = parent;
      this.start = start;
      this.end = end;
      this.domHelper = domHelper;
      ensureContext(contextualElement);
      this.contextualElement = contextualElement;
      this.escaped = true;
      this.reset();
    }

    Morph.prototype.reset = function() {
      this.text = null;
      this.owner = null;
      this.morphs = null;
      this.before = null;
      this.after = null;
    };

    Morph.prototype.parent = function () {
      if (!this.element) {
        var parent = this.start.parentNode;
        if (this._parent !== parent) {
          this._parent = parent;
        }
        if (parent.nodeType === 1) {
          this.element = parent;
        }
      }
      return this._parent;
    };

    Morph.prototype.destroy = function () {
      if (this.owner) {
        this.owner.removeMorph(this);
      } else {
        clear(this.element || this.parent(), this.start, this.end);
      }
    };

    Morph.prototype.removeMorph = function (morph) {
      var morphs = this.morphs;
      for (var i=0, l=morphs.length; i<l; i++) {
        if (morphs[i] === morph) {
          this.replace(i, 1);
          break;
        }
      }
    };

    Morph.prototype.setContent = function (nodeOrString) {
      this._update(this.element || this.parent(), nodeOrString);
    };

    Morph.prototype.updateNode = function (node) {
      var parent = this.element || this.parent();
      if (!node) {
        return this._updateText(parent, '');
      }
      this._updateNode(parent, node);
    };

    Morph.prototype.updateText = function (text) {
      this._updateText(this.element || this.parent(), text);
    };

    Morph.prototype.updateHTML = function (html) {
      var parent = this.element || this.parent();
      if (!html) {
        return this._updateText(parent, '');
      }
      this._updateHTML(parent, html);
    };

    Morph.prototype._update = function (parent, nodeOrString) {
      if (nodeOrString === null || nodeOrString === undefined) {
        this._updateText(parent, '');
      } else if (typeof nodeOrString === 'string') {
        if (this.escaped) {
          this._updateText(parent, nodeOrString);
        } else {
          this._updateHTML(parent, nodeOrString);
        }
      } else if (nodeOrString.nodeType) {
        this._updateNode(parent, nodeOrString);
      } else if (nodeOrString.string) { // duck typed SafeString
        this._updateHTML(parent, nodeOrString.string);
      } else {
        this._updateText(parent, nodeOrString.toString());
      }
    };

    Morph.prototype._updateNode = function (parent, node) {
      if (this.text) {
        if (node.nodeType === 3) {
          this.text.nodeValue = node.nodeValue;
          return;
        } else {
          this.text = null;
        }
      }
      var start = this.start, end = this.end;
      clear(parent, start, end);
      parent.insertBefore(node, end);
      if (this.before !== null) {
        this.before.end = start.nextSibling;
      }
      if (this.after !== null) {
        this.after.start = end.previousSibling;
      }
    };

    Morph.prototype._updateText = function (parent, text) {
      if (this.text) {
        this.text.nodeValue = text;
        return;
      }
      var node = this.domHelper.createTextNode(text);
      this.text = node;
      clear(parent, this.start, this.end);
      parent.insertBefore(node, this.end);
      if (this.before !== null) {
        this.before.end = node;
      }
      if (this.after !== null) {
        this.after.start = node;
      }
    };

    Morph.prototype._updateHTML = function (parent, html) {
      var start = this.start, end = this.end;
      clear(parent, start, end);
      this.text = null;
      var childNodes = this.domHelper.parseHTML(html, this.contextualElement);
      appendChildren(parent, end, childNodes);
      if (this.before !== null) {
        this.before.end = start.nextSibling;
      }
      if (this.after !== null) {
        this.after.start = end.previousSibling;
      }
    };

    Morph.prototype.append = function (node) {
      if (this.morphs === null) {
        this.morphs = [];
      }
      var index = this.morphs.length;
      return this.insert(index, node);
    };

    Morph.prototype.insert = function (index, node) {
      if (this.morphs === null) {
        this.morphs = [];
      }
      var parent = this.element || this.parent();
      var morphs = this.morphs;
      var before = index > 0 ? morphs[index-1] : null;
      var after  = index < morphs.length ? morphs[index] : null;
      var start  = before === null ? this.start : (before.end === null ? parent.lastChild : before.end.previousSibling);
      var end    = after === null ? this.end : (after.start === null ? parent.firstChild : after.start.nextSibling);
      var morph  = new Morph(parent, start, end, this.domHelper, this.contextualElement);

      morph.owner = this;
      morph._update(parent, node);

      if (before !== null) {
        morph.before = before;
        before.end = start.nextSibling;
        before.after = morph;
      }

      if (after !== null) {
        morph.after = after;
        after.before = morph;
        after.start = end.previousSibling;
      }

      this.morphs.splice(index, 0, morph);
      return morph;
    };

    Morph.prototype.replace = function (index, removedLength, addedNodes) {
      if (this.morphs === null) {
        this.morphs = [];
      }
      var parent = this.element || this.parent();
      var morphs = this.morphs;
      var before = index > 0 ? morphs[index-1] : null;
      var after = index+removedLength < morphs.length ? morphs[index+removedLength] : null;
      var start = before === null ? this.start : (before.end === null ? parent.lastChild : before.end.previousSibling);
      var end   = after === null ? this.end : (after.start === null ? parent.firstChild : after.start.nextSibling);
      var addedLength = addedNodes === undefined ? 0 : addedNodes.length;
      var args, i, current;

      if (removedLength > 0) {
        clear(parent, start, end);
      }

      if (addedLength === 0) {
        if (before !== null) {
          before.after = after;
          before.end = end;
        }
        if (after !== null) {
          after.before = before;
          after.start = start;
        }
        morphs.splice(index, removedLength);
        return;
      }

      args = new Array(addedLength+2);
      if (addedLength > 0) {
        for (i=0; i<addedLength; i++) {
          args[i+2] = current = new Morph(parent, start, end, this.domHelper, this.contextualElement);
          current._update(parent, addedNodes[i]);
          current.owner = this;
          if (before !== null) {
            current.before = before;
            before.end = start.nextSibling;
            before.after = current;
          }
          before = current;
          start = end === null ? parent.lastChild : end.previousSibling;
        }
        if (after !== null) {
          current.after = after;
          after.before = current;
          after.start = end.previousSibling;
        }
      }

      args[0] = index;
      args[1] = removedLength;

      splice.apply(morphs, args);
    };

    function appendChildren(parent, end, nodeList) {
      var ref = end;
      var i = nodeList.length;
      var node;

      while (i--) {
        node = nodeList[i];
        parent.insertBefore(node, ref);
        ref = node;
      }
    }

    function clear(parent, start, end) {
      var current, previous;
      if (end === null) {
        current = parent.lastChild;
      } else {
        current = end.previousSibling;
      }

      while (current !== null && current !== start) {
        previous = current.previousSibling;
        parent.removeChild(current);
        current = previous;
      }
    }

    __exports__["default"] = Morph;
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
        terminators = [";", ",", "==", ">", "<", ">=", "<=", ">==", "<==", "!=", "!==", "===", "&&", "||", "+", "-", "/", "*"];
    do {
      token = nextToken();
      console.log(token.value, token.type.type);

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
define("rebound-compiler/rebound-compiler", ["exports", "htmlbars-compiler/compiler", "htmlbars-util/object-utils", "morph/dom-helper", "rebound-component/helpers", "rebound-component/hooks"], function (exports, _htmlbarsCompilerCompiler, _htmlbarsUtilObjectUtils, _morphDomHelper, _reboundComponentHelpers, _reboundComponentHooks) {
  "use strict";

  // Rebound Compiler
  // ----------------

  var htmlbarsCompile = _htmlbarsCompilerCompiler.compile;
  var htmlbarsCompileSpec = _htmlbarsCompilerCompiler.compileSpec;
  var merge = _htmlbarsUtilObjectUtils.merge;
  var DOMHelper = to5Runtime.interopRequire(_morphDomHelper);

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
define("rebound-component/component", ["exports", "module", "morph/dom-helper", "rebound-component/hooks", "rebound-component/helpers", "rebound-component/utils", "rebound-data/rebound-data"], function (exports, module, _morphDomHelper, _reboundComponentHooks, _reboundComponentHelpers, _reboundComponentUtils, _reboundDataReboundData) {
  "use strict";

  // Rebound Component
  // ----------------

  var DOMHelper = to5Runtime.interopRequire(_morphDomHelper);

  var hooks = to5Runtime.interopRequire(_reboundComponentHooks);

  var helpers = to5Runtime.interopRequire(_reboundComponentHelpers);

  var $ = to5Runtime.interopRequire(_reboundComponentUtils);

  var Model = _reboundDataReboundData.Model;


  // If Backbone hasn't been started yet, throw error
  if (!window.Backbone) throw "Backbone must be on the page for Rebound to load.";

  // Returns true if `str` starts with `test`
  function startsWith(str, test) {
    if (str === test) return true;
    return str.substring(0, test.length + 1) === test + ".";
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

  var env = {
    helpers: helpers.helpers,
    hooks: hooks
  };

  env.hydrate = function hydrate(spec, options) {
    // Return a wrapper function that will merge user provided helpers and hooks with our defaults
    return function (data, options) {
      // Ensure we have a well-formed object as var options
      var env = options || {},
          contextElement = data.el || document.body;
      env.helpers = env.helpers || {};
      env.hooks = env.hooks || {};
      env.dom = env.dom || new DOMHelper();

      // Merge our default helpers and hooks with user provided helpers
      env.helpers = _.defaults(env.helpers, helpers.helpers);
      env.hooks = _.defaults(env.hooks, hooks);

      // Call our func with merged helpers and hooks
      return spec.render(data, env, contextElement);
    };
  };

  // New Backbone Component
  var Component = Model.extend({

    isComponent: true,

    constructor: function (options) {
      options = options || (options = {});
      _.bindAll(this, "__callOnComponent");
      this.cid = _.uniqueId("component");
      this.attributes = {};
      this.changed = {};
      this.helpers = {};
      this.__parent__ = this.__root__ = this;
      this.listenTo(this, "all", this._onChange);

      // Take our parsed data and add it to our backbone data structure. Does a deep defaults set.
      // In the model, primatives (arrays, objects, etc) are converted to Backbone Objects
      // Functions are compiled to find their dependancies and added as computed properties
      // Set our component's context with the passed data merged with the component's defaults
      this.set(this.defaults || {}, { defaults: true });
      this.set(options.data || {});

      // Call on component is used by the {{on}} helper to call all event callbacks in the scope of the component
      this.helpers.__callOnComponent = this.__callOnComponent;


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


      // Set our outlet and template if we have one
      this.el = options.outlet || undefined;
      this.$el = _.isUndefined(window.Backbone.$) ? false : window.Backbone.$(this.el);

      if (_.isFunction(this.createdCallback)) {
        this.createdCallback.call(this);
      }

      // Take our precompiled template and hydrates it. When Rebound Compiler is included, can be a handlebars template string.
      // TODO: Check if template is a string, and if the compiler exists on the page, and compile if needed
      if (!options.template && !this.template) {
        throw "Template must provided for " + this.__name + " component!";
      }
      this.template = options.template || this.template;
      this.template = typeof this.template === "object" ? env.hydrate(this.template) : this.template;


      // Render our dom and place the dom in our custom element
      this.el.appendChild(this.template(this, { helpers: this.helpers }, this.el));

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

    __callOnComponent: function (name, event) {
      if (!_.isFunction(this[name])) {
        throw "ERROR: No method named " + name + " on component " + this.__name + "!";
      }
      return this[name].call(this, event);
    },

    _onAttributeChange: function (attrName, oldVal, newVal) {},


    _onChange: function (type, model, collection, options) {
      var shortcircuit = { change: 1, sort: 1, request: 1, destroy: 1, sync: 1, error: 1, invalid: 1, route: 1, dirty: 1 };
      if (shortcircuit[type]) return;

      var data, changed;
      model || (model = {});
      collection || (collection = {});
      options || (options = {});
      !collection.isData && (options = collection) && (collection = model);
      this._toRender || (this._toRender = []);

      if (type === "reset" && options.previousAttributes || type.indexOf("change:") !== -1) {
        data = model;
        changed = model.changedAttributes();
      } else if (type === "add" || type === "remove" || type === "reset" && options.previousModels) {
        data = collection;
        changed = {};
        changed[data.__path()] = data;
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
      var parts = $.splitPath(basePath);
      var key, obsPath, path, observers;

      // For each changed key, walk down the data tree from the root to the data
      // element that triggered the event and add all relevent callbacks to this
      // object's _toRender queue.
      do {
        for (key in changed) {
          path = (basePath + (basePath && ".") + key).replace(context.__path(), "").replace(/\[[^\]]+\]/g, ".@each").replace(/^\./, "");
          for (obsPath in context.__observers) {
            observers = context.__observers[obsPath];
            if (startsWith(obsPath, path) || startsWith(path, obsPath)) {
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

    protoProps.defaults = {};

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
    return str.indexOf("<script>") > -1 && str.indexOf("</script>") > -1 ? "(function(){" + str.replace(/(.*<script>)(.*)(<\/script>.*)/ig, "$2") + "})()" : "{}";
  }

  // Remove the contents of the component's `style` tag.
  function getStyle(str) {
    return str.indexOf("<style>") > -1 && str.indexOf("</style>") > -1 ? str.replace(/(.*<style>)(.*)(<\/style>.*)/ig, "$2").replace(/"/g, "\\\"") : "";
  }

  // Remove the contents of the component's `template` tag.
  function getTemplate(str) {
    return str.replace(/.*<template>(.*)<\/template>.*/gi, "$1").replace(/(.*)<style>.*<\/style>(.*)/ig, "$1$2");
  }

  // Get the component's name from its `name` attribute.
  function getName(str) {
    return str.replace(/.*<element[^>]*name=(["'])?([^'">\s]+)\1[^<>]*>.*/ig, "$2");
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
    str = removeComments(str);
    // Minify everything
    str = minify(str);

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

    if (!isGlobal) {
      window.Rebound.page = (this.current = pageInstance).__component__;
    }

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
    if (!cssElement) {
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
      cssElement.removeAttribute("disabled");
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
      window.require([jsUrl], function (PageClass) {
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
          router.navigate(path, { trigger: true });
        }
      });

      // Install our global components
      _.each(this.config.globalComponents, function (selector, route) {
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

  //     Rebound.js 0.0.47

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
  helpers.lookupHelper = function (name, env, context) {
    env = env || {};

    name = $.splitPath(name)[0];

    // If a reserved helpers, return it
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
    if (name === "with") {
      return this["with"];
    }
    if (name === "partial") {
      return this.partial;
    }
    if (name === "length") {
      return this.length;
    }
    if (name === "on") {
      return this.on;
    }

    // If not a reserved helper, check env, then global helpers, else return false
    return env.helpers && _.isObject(context) && _.isObject(env.helpers[context.cid]) && env.helpers[context.cid][name] || helpers[name] || false;
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
    $(element).on(eventName, delegate, data, function (event) {
      event.context = options.context;
      return options.helpers.__callOnComponent(callback, event);
    });
  };

  helpers.length = function (params, hash, options, env) {
    return params[0] && params[0].length || 0;
  };

  helpers["if"] = function (params, hash, options, env) {
    var condition = params[0];

    if (condition === undefined) {
      return null;
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
    if (options.placeholder.__ifCache === condition) {
      return null; // Return null prevent's re-rending of our placeholder.
    }

    options.placeholder.__ifCache = condition;

    // Render the apropreate block statement
    if (condition && options.template) {
      return options.template.render(options.context, options, options.morph.contextualElement || options.morph.element);
    } else if (!condition && options.inverse) {
      return options.inverse.render(options.context, options, options.morph.contextualElement || options.morph.element);
    }

    return "";
  };


  // TODO: Proxy to if helper with inverted params
  helpers.unless = function (params, hash, options, env) {
    var condition = params[0];

    if (condition === undefined) {
      return null;
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
    if (options.placeholder.__unlessCache === condition) {
      return null; // Return null prevent's re-rending of our placeholder.
    }

    options.placeholder.__unlessCache = condition;

    // Render the apropreate block statement
    if (!condition && options.template) {
      return options.template.render(options.context, options, options.morph.contextualElement || options.morph.element);
    } else if (condition && options.inverse) {
      return options.inverse.render(options.context, options, options.morph.contextualElement || options.morph.element);
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
    start,
        end,
        // used below to remove trailing junk morphs from the dom
    position,
        // Stores the iterated element's integer position in the dom list
    currentModel = function (element, index, array, cid) {
      return element.cid === cid; // Returns true if currently observed element is the current model.
    };

    // Create our morph array if it doesnt exist
    options.placeholder.morphs = options.placeholder.morphs || [];

    _.each(value, function (obj, key, list) {
      if (!_.isFunction(obj.set)) {
        return console.error("Model ", obj, "has no method .set()!");
      }

      position = findIndex(options.placeholder.morphs, currentModel, obj.cid);

      // TODO: These need to be re-added in as data attributes
      // Even if rendered already, update each element's index, key, first and last in case of order changes or element removals
      // if(_.isArray(value)){
      //   obj.set({'@index': key, '@first': (key === 0), '@last': (key === value.length-1)}, {silent: true});
      // }
      //
      // if(!_.isArray(value) && _.isObject(value)){
      //   obj.set({'@key' : key}, {silent: true});
      // }

      // If this model is not the morph element at this index
      if (position !== key) {
        // Create a lazyvalue whos value is the content inside our block helper rendered in the context of this current list object. Returns the rendered dom for this list element.
        var lazyValue = new LazyValue(function () {
          return options.template.render(options.template.blockParams === 0 ? obj : options.context, options, options.morph.contextualElement || options.morph.element, [obj]);
        }, { morph: options.placeholder });

        // If this model is rendered somewhere else in the list, destroy it
        if (position > -1) {
          options.placeholder.morphs[position].destroy();
        }

        // Destroy the morph we're replacing
        if (options.placeholder.morphs[key]) {
          options.placeholder.morphs[key].destroy();
        }

        // Insert our newly rendered value (a document tree) into our placeholder (the containing element) at its requested position (where we currently are in the object list)
        options.placeholder.insert(key, lazyValue.value());

        // Label the inserted morph element with this model's cid
        options.placeholder.morphs[key].cid = obj.cid;
      }
    }, this);

    // If any more morphs are left over, remove them. We've already gone through all the models.
    start = value.length;
    end = options.placeholder.morphs.length - 1;
    for (end; start <= end; end--) {
      options.placeholder.morphs[end].destroy();
    }

    // Return null prevent's re-rending of our placeholder. Our placeholder (containing element) now has all the dom we need.
    return null;
  };

  helpers["with"] = function (params, hash, options, env) {
    // Render the content inside our block helper with the context of this object. Returns a dom tree.
    return options.template.render(params[0], options, options.morph.contextualElement || options.morph.element);
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
      if (!this.isDirty || this.isChanging) return;
      this.isChanging = true;

      var value = this.cache[this.returnType],
          result;

      context || (context = this.__parent__);

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

      this.stopListening(value, "all", this.onModify);

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

  function constructHelper(el, path, context, params, hash, options, env, helper) {
    var lazyValue;

    // Extend options with the helper's containeing Morph element. Used by streamify to track data observers
    options.morph = options.placeholder = el && !el.tagName && el || false; // FIXME: this kinda sucks
    options.element = el && el.tagName && el || false; // FIXME: this kinda sucks

    // Extend options with hooks and helpers for any subsequent calls from a lazyvalue
    options.params = params; // FIXME: this kinda sucks
    options.hooks = env.hooks; // FIXME: this kinda sucks
    options.helpers = env.helpers; // FIXME: this kinda sucks
    options.context = context; // FIXME: this kinda sucks
    options.dom = env.dom; // FIXME: this kinda sucks
    options.path = path; // FIXME: this kinda sucks
    options.hash = hash || []; // FIXME: this kinda sucks

    // Create a lazy value that returns the value of our evaluated helper.
    options.lazyValue = new LazyValue(function () {
      var plainParams = [],
          plainHash = {},
          result,
          relpath = $.splitPath(path),
          first,
          rest;
      relpath.shift();
      relpath = relpath.join(".");

      rest = $.splitPath(relpath);
      first = rest.shift();
      rest = rest.join(".");

      // Assemble our args and hash variables. For each lazyvalue param, push the lazyValue's value so helpers with no concept of lazyvalues.
      _.each(params, function (param, index) {
        plainParams.push(param && param.isLazyValue ? param.value() : param);
      });
      _.each(hash, function (hash, key) {
        plainHash[key] = hash && hash.isLazyValue ? hash.value() : hash;
      });

      // Call our helper functions with our assembled args.
      result = helper.apply(context.__root__ || context, [plainParams, plainHash, options, env]);

      if (result && relpath) {
        return result.get(relpath);
      }

      return result;
    }, { morph: options.morph });

    options.lazyValue.path = path;

    // For each param passed to our helper, add it to our helper's dependant list. Helper will re-evaluate when one changes.
    params.forEach(function (node) {
      if (node && node.isLazyValue) {
        options.lazyValue.addDependentValue(node);
      }
    });

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
    context.blockParams || (context.blockParams = {});
    if (path === "this") {
      path = "";
    }
    // context = (context.blockParams.has(path)) ? context.blockParams : context;
    return streamProperty(context, path);
  };

  hooks.set = function set(env, context, name, value) {
    context.blockParams || (context.blockParams = {});
    // context.blockParams.set(name, value);
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
    var helper = helpers.lookupHelper(helperName, env, context),
        lazyValue;

    if (helper) {
      // Abstracts our helper to provide a handlebars type interface. Constructs our LazyValue.
      lazyValue = constructHelper(false, helperName, context, params, hash, {}, env, helper);
    } else {
      lazyValue = streamProperty(context, helperName);
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
        helper = helpers.lookupHelper(path, env, context);

    if (!_.isFunction(helper)) {
      return console.error(path + " is not a valid helper!");
    }

    // Abstracts our helper to provide a handlebars type interface. Constructs our LazyValue.
    lazyValue = constructHelper(morph, path, context, params, hash, options, env, helper);

    // If we have our lazy value, update our dom.
    // morph is a morph element representing our dom node
    if (lazyValue) {
      lazyValue.onNotify(function (lazyValue) {
        var val = lazyValue.value();
        val = _.isUndefined(val) ? "" : val;
        if (!_.isNull(val)) {
          morph.setContent(val);
        }
      });

      value = lazyValue.value();
      value = _.isUndefined(value) ? "" : value;
      if (!_.isNull(value)) {
        morph.append(value);
      }

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
    }
  };

  hooks.inline = function inline(env, morph, context, path, params, hash) {
    var lazyValue,
        value,
        observer = subtreeObserver,
        helper = helpers.lookupHelper(path, env, context);

    if (!_.isFunction(helper)) {
      return console.error(path + " is not a valid helper!");
    }

    // Abstracts our helper to provide a handlebars type interface. Constructs our LazyValue.
    lazyValue = constructHelper(morph, path, context, params, hash, {}, env, helper);

    // If we have our lazy value, update our dom.
    // morph is a morph element representing our dom node
    if (lazyValue) {
      lazyValue.onNotify(function (lazyValue) {
        var val = lazyValue.value();
        val = _.isUndefined(val) ? "" : val;
        if (!_.isNull(val)) {
          morph.setContent(val);
        }
      });

      value = lazyValue.value();
      value = _.isUndefined(value) ? "" : value;
      if (!_.isNull(value)) {
        morph.append(value);
      }

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
    }
  };

  hooks.content = function content(env, morph, context, path) {
    var lazyValue,
        value,
        observer = subtreeObserver,
        helper = helpers.lookupHelper(path, env, context);

    lazyValue = streamProperty(context, path);

    // If we have our lazy value, update our dom.
    // morph is a morph element representing our dom node
    if (lazyValue) {
      lazyValue.onNotify(function (lazyValue) {
        var val = lazyValue.value();
        val = _.isUndefined(val) ? "" : val;
        if (!_.isNull(val)) {
          morph.setContent(val);
        }
      });

      value = lazyValue.value();
      value = _.isUndefined(value) ? "" : value;
      if (!_.isNull(value)) {
        morph.append(value);
      }

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
    }
  };

  // Handle morphs in element tags
  // TODO: handle dynamic attribute names?
  hooks.element = function element(env, domElement, context, path, params, hash) {
    var helper = helpers.lookupHelper(path, env, context),
        lazyValue,
        value;

    if (helper) {
      // Abstracts our helper to provide a handlebars type interface. Constructs our LazyValue.
      lazyValue = constructHelper(domElement, path, context, params, hash, {}, env, helper);
    } else {
      lazyValue = streamProperty(context, path);
    }

    // When we have our lazy value run it and start listening for updates.
    lazyValue.onNotify(function (lazyValue) {
      lazyValue.value();
    });

    value = lazyValue.value();
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

    value.onNotify(function () {
      lazyValue.value();
    });
    lazyValue.addDependentValue(value);

    return lazyValue.value();
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
      Rebound.seedData = {};
      component = element.__component__;

      // For each lazy param passed to our component, create its lazyValue
      _.each(plainData, function (value, key) {
        if (contextData[key] && contextData[key].isLazyValue) {
          componentData[key] = streamProperty(component, key);
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
        // TODO: Currently, showing objects as properties on the custom element causes problems. Linked models between the context and component become the same exact model and all hell breaks loose. Find a way to remedy this. Until then, don't show objects.
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
        outlet.appendChild(template.render(context, env, outlet));
      }

      // Return the new element.
      return element;
    }, { morph: morph });



    // If we have our lazy value, update our dom.
    // morph is a morph element representing our dom node
    if (lazyValue) {
      lazyValue.onNotify(function (lazyValue) {
        var val = lazyValue.value();
        if (val !== undefined) {
          morph.setContent(val);
        }
      });

      value = lazyValue.value();
      if (value !== undefined) {
        morph.append(value);
      }
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
        // - If val is `null`, set to default value or (fallback `undefined`).
        // - Else If this function is the same as the current computed property, continue.
        // - Else If this value is a `Function`, turn it into a `Computed Property`.
        // - Else If this is going to be a cyclical dependancy, use the original object, don't make a copy.
        // - Else If updating an existing object with its respective data type, let Backbone handle the merge.
        // - Else If this value is a `Model` or `Collection`, create a new copy of it using its constructor, preserving its defaults while ensuring no shared memory between objects.
        // - Else If this value is an `Array`, turn it into a `Collection`.
        // - Else If this value is a `Object`, turn it into a `Model`.
        // - Else val is a primitive value, set it accordingly.



        if (_.isNull(val) || _.isUndefined(val)) val = this.defaults[key];
        if (val && val.isComputedProperty) val = val.value();else if (_.isNull(val) || _.isUndefined(val)) val = undefined;else if (destination.isComputedProperty && destination.func === val) continue;else if (_.isFunction(val)) val = new ComputedProperty(val, lineage);else if (val.isData && target.hasParent(val)) val = val;else if (destination.isComputedProperty || destination.isCollection && (_.isArray(val) || val.isCollection) || destination.isModel && (_.isObject(val) || val.isModel)) {
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
      if (this.morph && this.morph.start && !this.morph.start.parentNode) return this.destroy();
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
      // Undelegate Backbone Events from this data object
      if (this.undelegateEvents) this.undelegateEvents();
      if (this.stopListening) this.stopListening();
      if (this.off) this.off();

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
      _.each(this.attributes, function (val) {
        val && val.deinitialize && val.deinitialize();
      });
      this.cache && this.cache.collection.deinitialize();
      this.cache && this.cache.model.deinitialize();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByb3BlcnR5LWNvbXBpbGVyL3Byb3BlcnR5LWNvbXBpbGVyLmpzIiwicmVib3VuZC1jb21waWxlci9yZWJvdW5kLWNvbXBpbGVyLmpzIiwicmVib3VuZC1jb21wb25lbnQvY29tcG9uZW50LmpzIiwicmVib3VuZC1kYXRhL2NvbGxlY3Rpb24uanMiLCJyZWJvdW5kLXByZWNvbXBpbGVyL3JlYm91bmQtcHJlY29tcGlsZXIuanMiLCJyZWJvdW5kLXJvdXRlci9yZWJvdW5kLXJvdXRlci5qcyIsInJ1bnRpbWUuanMiLCJwcm9wZXJ0eS1jb21waWxlci90b2tlbml6ZXIuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9oZWxwZXJzLmpzIiwicmVib3VuZC1kYXRhL2NvbXB1dGVkLXByb3BlcnR5LmpzIiwicmVib3VuZC1jb21wb25lbnQvaG9va3MuanMiLCJyZWJvdW5kLWRhdGEvbW9kZWwuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9sYXp5LXZhbHVlLmpzIiwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YS5qcyIsInJlYm91bmQtY29tcG9uZW50L3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztNQUdPLFNBQVM7O0FBRWhCLE1BQUksa0JBQWtCLEdBQUcsRUFBRSxDQUFDOzs7O0FBSTVCLFdBQVMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUIsUUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDOztBQUVoQixRQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDOztBQUV2QyxRQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFOztBQUNyQixhQUFTLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFDbkMsTUFBTSxHQUFHLEVBQUU7UUFDWCxLQUFLO1FBQ0wsYUFBYSxHQUFHLEVBQUU7UUFDbEIsVUFBVSxHQUFHLEVBQUU7UUFDZixPQUFPLEdBQUcsRUFBRTtRQUNaLEtB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RSxJQUFJLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxPQUFPLEVBQUUsUUFBUSxFQUFDLENBQUM7QUFDMUcsTUFBSSxNQUFNLEdBQUcsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7TUFBRSxJQUFJLEdBQUcsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDO01BQUUsSUFBSSxHQUFHLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFDO0FBQ3BHLE1BQUksSUFBSSxHQUFHLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQztNQUFFLE1BQU0sR0FBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUMsQ0FBQztBQUN6RCxNQUFJLE1BQU0sR0FBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBQztNQUFFLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUM7TUFBRSxJQUFJLEdBQUcsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUNwSCxNQUFJLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUMsQ0FBQzs7OztBQUk5QixNQUFJLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBQztNQUFFLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBQyxDQUFDO0FBQzNGLE1BQUksTUFBTSxHQUFHLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFDLENBQUM7Ozs7OztBQU1sRCxNQUFJLEdBQUcsR0FBRyxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7Ozs7QUFJdEQsTUFBSSxZQUFZLEdBQUcsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU07QUFDL0MsY0FBVSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRO0FBQ2pFLFFBQUksRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxJQUFJO0FBQzFELGNBQVUsRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxPQUFPO0FBQ3RFLFdBQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU07QUFDdkUsV0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsS0FBSztBQUM5QixVQUFNLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHO0FBQ3JFLGdCQUFZLEVBQUUsRUFBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxFQUFFLE1BQU0sRUFBRSxLQUFLO0FBQ2hGLFlBQVEsRUFBRSxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDO0FBQzdELFVBQU0sRUFBRSxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDO0FBQ3pELFlBQVEsRUFBRSxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLEVBQUMsQ0FBQzs7OztBQUluRixNQUFJLFNBQVMsR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLFNBQVMsR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUNoSCxNQUFJLE9BQU8sR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFDLENBQUM7QUFDMUYsTUFBSSxNQUFNLEdBQUcsRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7TUFBRSxLQUFLLEdBQUcsRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUNsRixNQUFJLE1BQU0sR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLElBQUksR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUM7TUFBRSxTQUFTLEdBQUcsRUFBQyxJQUFJLEVBQUUsS0FBSyxFQUFDO01BQUUsU0FBUyxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQWtCckksTUFBSSxNQUFNLEdBQUcsRUFBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7TUFBRSxHQUFHLEdBQUcsRUFBQyxRQUFRLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUNyRixNQUFJLE9BQU8sR0FBRyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ2pELE1BQUksT0FBTyxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUN4RyxNQUFJLFVBQVUsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQzlDLE1BQUksV0FBVyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDL0MsTUFBSSxVQUFVLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUM5QyxNQUFJLFdBQVcsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQy9DLE1BQUksV0FBVyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDL0MsTUFBSSxTQUFTLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUM3QyxNQUFJLFdBQVcsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQy9DLE1BQUksU0FBUyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDN0MsTUFBSSxRQUFRLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQzFELE1BQUksZUFBZSxHQUFHLEVBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7Ozs7O0FBS3BELFNBQU8sQ0FBQyxRQUFRLEdBQUcsRUFBQyxRQUFRLEVBQUUsU0FBUyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTztBQUMxRSxVQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNO0FBQzNFLE9BQUcsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUc7QUFDM0UsUUFBSSxFQUFFLEtBQUssRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFDLENBQUM7QUFDekYsT0FBSyxJQUFJLEVBQUUsSUFBSSxZQUFZLEVBQUUsT0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDOzs7Ozs7Ozs7OztBQVczRSxXQUFTLGFBQWEsQ0FBQyxLQUFLLEVBQUU7b0JBVzVCLFVBQW1CLEdBQUcsRUFBRTtBQUN0QixVQUFJLEdBQUcsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxJQUFJLGlCQUFpQixHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ2xGLE9BQUMsSUFBSSxjQUFjLENBQUM7QUFDcEIsV0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLE9BQU8sR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztBQUNqRixPQUFDLElBQUksMkJBQTJCLENBQUM7S0FDbEM7O0FBZkQsU0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekIsUUFBSSxDQUFDLEdBQUcsRUFBRTtRQUFFLElBQUksR0FBRyxFQUFFLENBQUM7QUFDdEIsT0FBRyxFQUFFLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUFFO0FBQzFDLFdBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxFQUNsQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtBQUN4QyxZQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3ZCLGlCQUFTLEdBQUcsQ0FBQztPQUNkO0FBQ0gsVUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDdkI7Ozs7OztBQVdELFFBQUksSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7QUFDbkIsVUFBSSxDQUFDLElBQUksQ0FBQyxVQUFTLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFBQyxlQUFPLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztPQUFDLENBQUMsQ0FBQztBQUN4RCxPQUFDLElBQUkscUJBQXFCLENBQUM7QUFDM0IsV0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLEVBQUU7QUFDcEMsWUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2xCLFNBQUMsSUFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7QUFDbkMsaUJBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUNoQjtBQUNELE9BQUMsSUFBSSxHQUFHLENBQUM7OztLQUlWLE1BQU07QUFDTCxlQUFTLENBQUMsS0FBSyxDQUFDLENBQUM7S0FDbEI7QUFDRCxXQUFPLElBQUksUUFBUSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUMsQ0FBQztHQUMvQjs7OztBQUlELE1BQUksZUFBZSxHQUFHLGFBQWEsQ0FBQyxxTkFBcU4sQ0FBQyxDQUFDOzs7O0FBSTNQLE1BQUksZUFBZSxHQUFHLGFBQWEsQ0FBQyw4Q0FBOEMsQ0FBQyxDQUFDOzs7O0FBSXBGLE1BQUksb0JBQW9CLEdBQUcsYUFBYSxDQUFDLHdFQUF3RSxDQUFDLENBQUM7Ozs7QUFJbkgsTUFBSSxpQkFBaUIsR0FBRyxhQUFhLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzs7OztBQUl4RCxNQUFJLG9CQUFvQixHQUFHLDZLQUE2SyxDQUFDOztBQUV6TSxNQUFJLHFCQUFxQixHQUFHLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDOztBQUVoRSxNQUFJLGNBQWMsR0FBRyxhQUFhLENBQUMsb0JBQW9CLEdBQUcsWUFBWSxDQUFDLENBQUM7O0FBRXhFLE1BQUksU0FBUyxHQUFHLHFCQUFxQixDQUFDOzs7Ozs7Ozs7QUFTdEMsTUFBSSxrQkFBa0IsR0FBRyxxREFBcUQsQ0FBQztBQUMvRSxNQUFJLDRCQUE0QixHQUFHLGs1QkFBc21JLENBQUM7QUFDMW9JLE1BQUksdUJBQXVCLEdBQUcsaWVBQTBvRSxDQUFDO0FBQ3pxRSxNQUFJLHVCQUF1QixHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsR0FBRyw0QkFBNEIsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUNuRixNQUFJLGtCQUFrQixHQUFHLElBQUksTUFBTSxDQUFDLEdBQUcsR0FBRyw0QkFBNEIsR0FBRyx1QkFBdUIsR0FBRyxHQUFHLENBQUMsQ0FBQzs7OztBQUl4RyxNQUFJLE9BQU8sR0FBRyxvQkFBb0IsQ0FBQzs7Ozs7QUFLbkMsTUFBSSxTQUFTLEdBQUcsMEJBQTBCLENBQUM7Ozs7QUFJM0MsTUFBSSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsaUJBQWlCLEdBQUcsVUFBUyxJQUFJLEVBQUU7QUFDakUsUUFBSSxJQUFJLEdBQUcsRUFBRSxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNsQyxRQUFJLElBQUksR0FBRyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDM0IsUUFBSSxJQUFJLEdBQUcsRUFBRSxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNsQyxRQUFJLElBQUksR0FBRyxHQUFHLEVBQUMsT0FBTyxJQUFJLENBQUM7QUFDM0IsV0FBTyxJQUFJLElBQUksR0FBSSxJQUFJLHVCQUF1QixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7R0FDaEYsQ0FBQzs7OztBQUlGLE1BQUksZ0JBQWdCLEdBQUcsT0FBTyxDQUFDLGdCQUFnQixHQUFHLFVBQVMsSUFBSSxFQUFFO0FBQy9ELFFBQUksSUFBSSxHQUFHLEVBQUUsRUFBRSxPQUFPLElBQUksS0FBSyxFQUFFLENBQUM7QUFDbEMsUUFBSSxJQUFJLEdBQUcsRUFBRSxFQUFFLE9BQU8sSUFBSSxDQUFDO0FBQzNCLFFBQUksSUFBSSxHQUFHLEVBQUUsRUFBRSxPQUFPLEtBQUssQ0FBQztBQUM1QixRQUFJLElBQUksR0FBRyxFQUFFLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDM0IsUUFBSSxJQUFJLEdBQUcsRUFBRSxFQUFFLE9BQU8sSUFBSSxLQUFLLEVBQUUsQ0FBQztBQUNsQyxRQUFJLElBQUksR0FBRyxHQUFHLEVBQUMsT0FBTyxJQUFJLENBQUM7QUFDM0IsV0FBTyxJQUFJLElBQUksR0FBSSxJQUFJLGtCQUFrQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7R0FDM0UsQ0FBQzs7Ozs7OztBQU9GLFdBQVMsUUFBUSxHQUFHO0FBQ2xCLFFBQUksQ0FBQyxJQUFJLEdBQUcsVUFBVSxDQUFDO0FBQ3ZCLFFBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxHQUFHLFlBQVksQ0FBQztHQUNyQzs7OztBQUlELFdBQVMsY0FBYyxHQUFHO0FBQ3hCLGNBQVUsR0FBRyxDQUFDLENBQUM7QUFDZixVQUFNLEdBQUcsWUFBWSxHQUFHLENBQUMsQ0FBQztBQUMxQixvQkFBZ0IsR0FBRyxJQUFJLENBQUM7QUFDeEIsYUFBUyxFQUFFLENBQUM7R0FDYjs7Ozs7O0FBTUQsV0FBUyxXQUFXLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtBQUM5QixVQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ2hCLFFBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxTQUFTLEdBQUcsSUFBSSxRQUFRLEVBQUEsQ0FBQztBQUNoRCxXQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ2YsYUFBUyxFQUFFLENBQUM7QUFDWixVQUFNLEdBQUcsR0FBRyxDQUFDO0FBQ2Isb0JBQWdCLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztHQUNwQzs7QUFFRCxXQUFTLGdCQUFnQixHQUFHO0FBQzFCLFFBQUksUUFBUSxHQUFHLE9BQU8sQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJLFFBQVEsRUFBQSxDQUFDO0FBQ3RFLFFBQUksS0FBSyxHQUFHLE1BQU07UUFBRSxHQUFHLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBTSxJQUFJLENBQUMsQ0FBQyxDQUFDO0FBQzNELFFBQUksR0FBRyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLHNCQUFzQixDQUFDLENBQUM7QUFDMUQsVUFBTSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDakIsUUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO0FBQ3JCLGVBQVMsQ0FBQyxTQUFTLEdBQUcsS0FBSyxDQUFDO0FBQzVCLFVBQUksS0FBSyxDQUFDO0FBQ1YsYUFBTyxDQUFDLEtBQUssR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBLElBQUssS0FBSyxDQUFDLEtBQUssR0FBRyxNQUFNLEVBQUU7QUFDOUQsVUFBRSxVQUFVLENBQUM7QUFDYixvQkFBWSxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQztPQUM5QztLQUNGO0FBQ0QsUUFBSSxPQUFPLENBQUMsU0FBUyxFQUNuQixPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFDaEQsUUFBUSxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxRQUFRLEVBQUEsQ0FBQyxDQUFDO0dBQ2xFOztBQUVELFdBQVMsZUFBZSxHQUFHO0FBQ3pCLFFBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQztBQUNuQixRQUFJLFFBQVEsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxRQUFRLEVBQUEsQ0FBQztBQUN0RSxRQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sSUFBRSxDQUFDLENBQUMsQ0FBQztBQUNyQyxXQUFPLE1BQU0sR0FBRyxRQUFRLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxJQUFJLElBQUksRUFBRSxLQUFLLElBQUksRUFBRTtBQUNoRixRQUFFLE1BQU0sQ0FBQztBQUNULFFBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0tBQy9CO0FBQ0QsUUFBSSxPQUFPLENBQUMsU0FBUyxFQUNuQixPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFDcEQsUUFBUSxFQUFFLE9BQU8sQ0FBQyxTQUFTLElBQUksSUFBSSxRQUFRLEVBQUEsQ0FBQyxDQUFDO0dBQ2xFOzs7OztBQUtELFdBQVMsU0FBUyxHQUFHO0FBQ25CLFdBQU8sTUFBTSxHQUFHLFFBQVEsRUFBRTtBQUN4QixVQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLFVBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTs7QUFDYixVQUFFLE1BQU0sQ0FBQztPQUNWLE1BQU0sSUFBSSxFQUFFLEtBQUssRUFBRSxFQUFFO0FBQ3BCLFVBQUUsTUFBTSxDQUFDO0FBQ1QsWUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNwQyxZQUFJLElBQUksS0FBSyxFQUFFLEVBQUU7QUFDZixZQUFFLE1BQU0sQ0FBQztTQUNWO0FBQ0QsWUFBSSxPQUFPLENBQUMsU0FBUyxFQUFFO0FBQ3JCLFlBQUUsVUFBVSxDQUFDO0FBQ2Isc0JBQVksR0FBRyxNQUFNLENBQUM7U0FDdkI7T0FDRixNQUFNLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssSUFBSSxJQUFJLEVBQUUsS0FBSyxJQUFJLEVBQUU7QUFDbEQsVUFBRSxNQUFNLENBQUM7QUFDVCxZQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUU7QUFDckIsWUFBRSxVQUFVLENBQUM7QUFDYixzQkFBWSxHQUFHLE1BQU0sQ0FBQztTQUN2QjtPQUNGLE1BQU0sSUFBSSxFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLEVBQUU7QUFDNUIsVUFBRSxNQUFNLENBQUM7T0FDVixNQUFNLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTs7QUFDcEIsWUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsWUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFOztBQUNmLDBCQUFnQixFQUFFLENBQUM7U0FDcEIsTUFBTSxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUU7O0FBQ3RCLHlCQUFlLEVBQUUsQ0FBQztTQUNuQixNQUFNLE1BQU07T0FDZCxNQUFNLElBQUksRUFBRSxLQUFLLEdBQUcsRUFBRTs7QUFDckIsVUFBRSxNQUFNLENBQUM7T0FDVixNQUFNLElBQUksRUFBRSxJQUFJLElBQUksSUFBSSxrQkFBa0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFO0FBQ3pFLFVBQUUsTUFBTSxDQUFDO09BQ1YsTUFBTTtBQUNMLGNBQU07T0FDUDtLQUNGO0dBQ0Y7Ozs7Ozs7Ozs7Ozs7O0FBY0QsV0FBUyxhQUFhLEdBQUc7QUFDdkIsUUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsUUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLElBQUksSUFBSSxFQUFFLEVBQUUsT0FBTyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEQsUUFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDekMsUUFBSSxPQUFPLENBQUMsV0FBVyxJQUFJLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSxJQUFJLEtBQUssS0FBSyxFQUFFLEVBQUU7O0FBQzNELFlBQU0sSUFBSSxDQUFDLENBQUM7QUFDWixhQUFPLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztLQUMvQixNQUFNO0FBQ0wsUUFBRSxNQUFNLENBQUM7QUFDVCxhQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMxQjtHQUNGOztBQUVELFdBQVMsZUFBZSxHQUFHOztBQUN6QixRQUFJLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4QyxRQUFJLGdCQUFnQixFQUFFO0FBQUMsUUFBRSxNQUFNLENBQUMsQUFBQyxPQUFPLFVBQVUsRUFBRSxDQUFDO0tBQUM7QUFDdEQsUUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM3QyxXQUFPLFFBQVEsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDNUI7O0FBRUQsV0FBUyxxQkFBcUIsR0FBRzs7QUFDL0IsUUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsUUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM3QyxXQUFPLFFBQVEsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDckM7O0FBRUQsV0FBUyxrQkFBa0IsQ0FBQyxJQUFJLEVBQUU7O0FBQ2hDLFFBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLFFBQUksSUFBSSxLQUFLLElBQUksRUFBRSxPQUFPLFFBQVEsQ0FBQyxJQUFJLEtBQUssR0FBRyxHQUFHLFVBQVUsR0FBRyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDL0UsUUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLE9BQU8sUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM3QyxXQUFPLFFBQVEsQ0FBQyxJQUFJLEtBQUssR0FBRyxHQUFHLFVBQVUsR0FBRyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUM7R0FDN0Q7O0FBRUQsV0FBUyxlQUFlLEdBQUc7O0FBQ3pCLFFBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLFFBQUksSUFBSSxLQUFLLEVBQUUsRUFBRSxPQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDN0MsV0FBTyxRQUFRLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO0dBQ2pDOztBQUVELFdBQVMsa0JBQWtCLENBQUMsSUFBSSxFQUFFOztBQUNoQyxRQUFJLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4QyxRQUFJLElBQUksS0FBSyxJQUFJLEVBQUU7QUFDakIsVUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFDaEQsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsQ0FBQyxFQUFFOztBQUU5QyxjQUFNLElBQUksQ0FBQyxDQUFDO0FBQ1osdUJBQWUsRUFBRSxDQUFDO0FBQ2xCLGlCQUFTLEVBQUUsQ0FBQztBQUNaLGVBQU8sU0FBUyxFQUFFLENBQUM7T0FDcEI7QUFDRCxhQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxDQUFDLENBQUM7S0FDN0I7QUFDRCxRQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsT0FBTyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzdDLFdBQU8sUUFBUSxDQUFDLFFBQVEsRUFBRSxDQUFDLENBQUMsQ0FBQztHQUM5Qjs7QUFFRCxXQUFTLGVBQWUsQ0FBQyxJQUFJLEVBQUU7O0FBQzdCLFFBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3hDLFFBQUksSUFBSSxHQUFHLENBQUMsQ0FBQztBQUNiLFFBQUksSUFBSSxLQUFLLElBQUksRUFBRTtBQUNqQixVQUFJLEdBQUcsSUFBSSxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsRSxVQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxPQUFPLFFBQVEsQ0FBQyxPQUFPLEVBQUUsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQy9FLGFBQU8sUUFBUSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQztLQUNsQztBQUNELFFBQUksSUFBSSxJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsSUFDOUQsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxFQUFFOztBQUV0QyxZQUFNLElBQUksQ0FBQyxDQUFDO0FBQ1oscUJBQWUsRUFBRSxDQUFDO0FBQ2xCLGVBQVMsRUFBRSxDQUFDO0FBQ1osYUFBTyxTQUFTLEVBQUUsQ0FBQztLQUNwQjtBQUNELFFBQUksSUFBSSxLQUFLLEVBQUUsRUFDYixJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDckQsV0FBTyxRQUFRLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxDQUFDO0dBQ3BDOztBQUVELFdBQVMsaUJBQWlCLENBQUMsSUFBSSxFQUFFOztBQUMvQixRQUFJLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4QyxRQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsT0FBTyxRQUFRLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDekYsV0FBTyxRQUFRLENBQUMsSUFBSSxLQUFLLEVBQUUsR0FBRyxHQUFHLEdBQUcsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0dBQ2pEOztBQUVELFdBQVMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFO0FBQzlCLFlBQU8sSUFBSTs7O0FBR1gsV0FBSyxFQUFFOztBQUNMLGVBQU8sYUFBYSxFQUFFLENBQUM7O0FBQUE7QUFHekIsV0FBSyxFQUFFO0FBQUUsVUFBRSxNQUFNLENBQUMsQUFBQyxPQUFPLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUFBLEFBQy9DLFdBQUssRUFBRTtBQUFFLFVBQUUsTUFBTSxDQUFDLEFBQUMsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7QUFBQSxBQUMvQyxXQUFLLEVBQUU7QUFBRSxVQUFFLE1BQU0sQ0FBQyxBQUFDLE9BQU8sV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQUEsQUFDN0MsV0FBSyxFQUFFO0FBQUUsVUFBRSxNQUFNLENBQUMsQUFBQyxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUFBLEFBQzlDLFdBQUssRUFBRTtBQUFFLFVBQUUsTUFBTSxDQUFDLEFBQUMsT0FBTyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7QUFBQSxBQUNqRCxXQUFLLEVBQUU7QUFBRSxVQUFFLE1BQU0sQ0FBQyxBQUFDLE9BQU8sV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQUEsQUFDakQsV0FBSyxHQUFHO0FBQUUsVUFBRSxNQUFNLENBQUMsQUFBQyxPQUFPLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUFBLEFBQ2hELFdBQUssR0FBRztBQUFFLFVBQUUsTUFBTSxDQUFDLEFBQUMsT0FBTyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7QUFBQSxBQUNoRCxXQUFLLEVBQUU7QUFBRSxVQUFFLE1BQU0sQ0FBQyxBQUFDLE9BQU8sV0FBVyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQUEsQUFDOUMsV0FBSyxFQUFFO0FBQUUsVUFBRSxNQUFNLENBQUMsQUFBQyxPQUFPLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFBQTtBQUdqRCxXQUFLLEVBQUU7O0FBQ0wsWUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDeEMsWUFBSSxJQUFJLEtBQUssR0FBRyxJQUFJLElBQUksS0FBSyxFQUFFLEVBQUUsT0FBTyxhQUFhLEVBQUUsQ0FBQztBQUFBOzs7QUFJMUQsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7QUFBQyxBQUFDLFdBQUssRUFBRTtBQUFDLEFBQUMsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7QUFBQyxBQUFDLFdBQUssRUFBRTtBQUFDLEFBQUMsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7QUFBQyxBQUFDLFdBQUssRUFBRTs7QUFDN0UsZUFBTyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBQUE7QUFHM0IsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7O0FBQ2QsZUFBTyxVQUFVLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBQUE7Ozs7O0FBTzFCLFdBQUssRUFBRTs7QUFDTCxlQUFPLGVBQWUsRUFBRSxDQUFDOztBQUFBLEFBRTNCLFdBQUssRUFBRTtBQUFDLEFBQUMsV0FBSyxFQUFFOztBQUNkLGVBQU8scUJBQXFCLEVBQUUsQ0FBQzs7QUFBQSxBQUVqQyxXQUFLLEdBQUc7QUFBQyxBQUFDLFdBQUssRUFBRTs7QUFDZixlQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQyxDQUFDOztBQUFBLEFBRWxDLFdBQUssRUFBRTs7QUFDTCxlQUFPLGVBQWUsRUFBRSxDQUFDOztBQUFBLEFBRTNCLFdBQUssRUFBRTtBQUFDLEFBQUMsV0FBSyxFQUFFOztBQUNkLGVBQU8sa0JBQWtCLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBQUEsQUFFbEMsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7O0FBQ2QsZUFBTyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBQUEsQUFFL0IsV0FBSyxFQUFFO0FBQUMsQUFBQyxXQUFLLEVBQUU7O0FBQ2QsZUFBTyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFBQSxBQUVqQyxXQUFLLEdBQUc7O0FBQ04sZUFBTyxRQUFRLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQUEsS0FDN0I7O0FBRUQsV0FBTyxLQUFLLENBQUM7R0FDZDs7QUFFRCxXQUFTLFNBQVMsQ0FBQyxXQUFXLEVBQUU7QUFDOUIsUUFBSSxDQUFDLFdBQVcsRUFBRSxRQUFRLEdBQUcsTUFBTSxDQUFDLEtBQy9CLE1BQU0sR0FBRyxRQUFRLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLFFBQUksT0FBTyxDQUFDLFNBQVMsRUFBRSxXQUFXLEdBQUcsSUFBSSxRQUFRLEVBQUEsQ0FBQztBQUNsRCxRQUFJLFdBQVcsRUFBRSxPQUFPLFVBQVUsRUFBRSxDQUFDO0FBQ3JDLFFBQUksTUFBTSxJQUFJLFFBQVEsRUFBRSxPQUFPLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFakQsUUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7O0FBR3BDLFFBQUksaUJBQWlCLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLEVBQUUsVUFBQSxFQUFZLE9BQU8sUUFBUSxFQUFFLENBQUM7O0FBRXhFLFFBQUksR0FBRyxHQUFHLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVqQyxRQUFJLEdBQUcsS0FBSyxLQUFLLEVBQUU7OztBQUdqQixVQUFJLEVBQUUsR0FBRyxNQUFNLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25DLFVBQUksRUFBRSxLQUFLLElBQUksSUFBSSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsT0FBTyxRQUFRLEVBQUUsQ0FBQztBQUN2RSxXQUFLLENBQUMsTUFBTSxFQUFFLHdCQUF3QixHQUFHLEVBQUUsR0FBRyxHQUFHLENBQUMsQ0FBQztLQUNwRDtBQUNELFdBQU8sR0FBRyxDQUFDO0dBQ1o7O0FBRUQsV0FBUyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRTtBQUM1QixRQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUM7QUFDN0MsVUFBTSxJQUFJLElBQUksQ0FBQztBQUNmLGVBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDeEI7Ozs7O0FBS0QsV0FBUyxVQUFVLEdBQUc7QUFDcEIsUUFBSSxPQUFPLEdBQUcsRUFBRTtRQUFFLE9BQU87UUFBRSxPQUFPO1FBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQztBQUNuRCxhQUFTO0FBQ1AsVUFBSSxNQUFNLElBQUksUUFBUSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsaUNBQWlDLENBQUMsQ0FBQztBQUN4RSxVQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQzlCLFVBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLGlDQUFpQyxDQUFDLENBQUM7QUFDdEUsVUFBSSxDQUFDLE9BQU8sRUFBRTtBQUNaLFlBQUksRUFBRSxLQUFLLEdBQUcsRUFBRSxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQzFCLElBQUksRUFBRSxLQUFLLEdBQUcsSUFBSSxPQUFPLEVBQUUsT0FBTyxHQUFHLEtBQUssQ0FBQyxLQUMzQyxJQUFJLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsTUFBTTtBQUN2QyxlQUFPLEdBQUcsRUFBRSxLQUFLLElBQUksQ0FBQztPQUN2QixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDdkIsUUFBRSxNQUFNLENBQUM7S0FDVjtBQUNELFFBQUksT0FBTyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ3pDLE1BQUUsTUFBTSxDQUFDOzs7QUFHVCxRQUFJLElBQUksR0FBRyxTQUFTLEVBQUUsQ0FBQztBQUN2QixRQUFJLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxpQ0FBaUMsQ0FBQyxDQUFDO0FBQ3RGLFFBQUk7QUFDRixVQUFJLEtBQUssR0FBRyxJQUFJLE1BQU0sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDdkMsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNWLFVBQUksQ0FBQyxZQUFZLFdBQVcsRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLG9DQUFvQyxHQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM3RixXQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDVjtBQUNELFdBQU8sV0FBVyxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztHQUNwQzs7Ozs7O0FBTUQsV0FBUyxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRTtBQUMzQixRQUFJLEtBQUssR0FBRyxNQUFNO1FBQUUsS0FBSyxHQUFHLENBQUMsQ0FBQztBQUM5QixTQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsR0FBRyxJQUFJLElBQUksR0FBRyxRQUFRLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7QUFDNUQsVUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7VUFBRSxHQUFHLENBQUM7QUFDekMsVUFBSSxJQUFJLElBQUksRUFBRSxFQUFFLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQztXQUNoQyxJQUFJLElBQUksSUFBSSxFQUFFLEVBQUUsR0FBRyxHQUFHLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDO1dBQ3JDLElBQUksSUFBSSxJQUFJLEVBQUUsSUFBSSxJQUFJLElBQUksRUFBRSxFQUFFLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1dBQzlDLEdBQUcsR0FBRyxRQUFRLENBQUM7QUFDcEIsVUFBSSxHQUFHLElBQUksS0FBSyxFQUFFLE1BQU07QUFDeEIsUUFBRSxNQUFNLENBQUM7QUFDVCxXQUFLLEdBQUcsS0FBSyxHQUFHLEtBQUssR0FBRyxHQUFHLENBQUM7S0FDN0I7QUFDRCxRQUFJLE1BQU0sS0FBSyxLQUFLLElBQUksR0FBRyxJQUFJLElBQUksSUFBSSxNQUFNLEdBQUcsS0FBSyxLQUFLLEdBQUcsRUFBRSxPQUFPLElBQUksQ0FBQzs7QUFFM0UsV0FBTyxLQUFLLENBQUM7R0FDZDs7QUFFRCxXQUFTLGFBQWEsR0FBRztBQUN2QixVQUFNLElBQUksQ0FBQyxDQUFDO0FBQ1osUUFBSSxHQUFHLEdBQUcsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO0FBQ3RCLFFBQUksR0FBRyxJQUFJLElBQUksRUFBRSxLQUFLLENBQUMsUUFBUSxHQUFHLENBQUMsRUFBRSw2QkFBNkIsQ0FBQyxDQUFDO0FBQ3BFLFFBQUksaUJBQWlCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsa0NBQWtDLENBQUMsQ0FBQztBQUNuRyxXQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDL0I7Ozs7QUFJRCxXQUFTLFVBQVUsQ0FBQyxhQUFhLEVBQUU7QUFDakMsUUFBSSxLQUFLLEdBQUcsTUFBTTtRQUFFLE9BQU8sR0FBRyxLQUFLO1FBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzdFLFFBQUksQ0FBQyxhQUFhLElBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDM0UsUUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxLQUFLLEVBQUUsRUFBRTtBQUNuQyxRQUFFLE1BQU0sQ0FBQztBQUNULGFBQU8sQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUNaLGFBQU8sR0FBRyxJQUFJLENBQUM7S0FDaEI7QUFDRCxRQUFJLElBQUksR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3BDLFFBQUksSUFBSSxLQUFLLEVBQUUsSUFBSSxJQUFJLEtBQUssR0FBRyxFQUFFOztBQUMvQixVQUFJLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLFVBQUksSUFBSSxLQUFLLEVBQUUsSUFBSSxJQUFJLEtBQUssRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDO0FBQ3pDLFVBQUksT0FBTyxDQUFDLEVBQUUsQ0FBQyxLQUFLLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDekQsYUFBTyxHQUFHLElBQUksQ0FBQztLQUNoQjtBQUNELFFBQUksaUJBQWlCLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxNQUFNLEVBQUUsa0NBQWtDLENBQUMsQ0FBQzs7QUFFbkcsUUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDO1FBQUUsR0FBRyxDQUFDO0FBQzFDLFFBQUksT0FBTyxFQUFFLEdBQUcsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsS0FDOUIsSUFBSSxDQUFDLEtBQUssSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQyxLQUN4RCxJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksTUFBTSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQyxLQUMvRCxHQUFHLEdBQUcsUUFBUSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUM1QixXQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7R0FDL0I7Ozs7QUFJRCxXQUFTLFVBQVUsQ0FBQyxLQUFLLEVBQUU7QUFDekIsVUFBTSxFQUFFLENBQUM7QUFDVCxRQUFJLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDYixhQUFTO0FBQ1AsVUFBSSxNQUFNLElBQUksUUFBUSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsOEJBQThCLENBQUMsQ0FBQztBQUN4RSxVQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLFVBQUksRUFBRSxLQUFLLEtBQUssRUFBRTtBQUNoQixVQUFFLE1BQU0sQ0FBQztBQUNULGVBQU8sV0FBVyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztPQUNsQztBQUNELFVBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTs7QUFDYixVQUFFLEdBQUcsS0FBSyxDQUFDLFVBQVUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0FBQ2hDLFlBQUksS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDNUQsWUFBSSxLQUFLLEVBQUUsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUM1QixlQUFPLEtBQUssSUFBSSxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsRUFBRSxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyRSxZQUFJLEtBQUssS0FBSyxHQUFHLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQztBQUNoQyxVQUFFLE1BQU0sQ0FBQztBQUNULFlBQUksS0FBSyxFQUFFO0FBQ1QsY0FBSSxNQUFNLEVBQUUsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsOEJBQThCLENBQUMsQ0FBQztBQUM5RCxhQUFHLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsZ0JBQU0sSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztTQUM1QixNQUFNO0FBQ0wsa0JBQVEsRUFBRTtBQUNWLGlCQUFLLEdBQUc7QUFBRSxpQkFBRyxJQUFJLElBQUksQ0FBQyxBQUFDLE1BQU07QUFDN0IsaUJBQUssR0FBRztBQUFFLGlCQUFHLElBQUksSUFBSSxDQUFDLEFBQUMsTUFBTTtBQUM3QixpQkFBSyxHQUFHO0FBQUUsaUJBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUMsTUFBTTtBQUM1RCxpQkFBSyxHQUFHO0FBQUUsaUJBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUMsTUFBTTtBQUM1RCxpQkFBSyxFQUFFO0FBQUUsaUJBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEFBQUMsTUFBTTtBQUMzRCxpQkFBSyxHQUFHO0FBQUUsaUJBQUcsSUFBSSxJQUFJLENBQUMsQUFBQyxNQUFNO0FBQzdCLGlCQUFLLEVBQUU7QUFBRSxpQkFBRyxJQUFJLElBQUksQ0FBQyxBQUFDLE1BQU07QUFDNUIsaUJBQUssR0FBRztBQUFFLGlCQUFHLElBQUksUUFBUSxDQUFDLEFBQUMsTUFBTTtBQUNqQyxpQkFBSyxHQUFHO0FBQUUsaUJBQUcsSUFBSSxJQUFJLENBQUMsQUFBQyxNQUFNO0FBQzdCLGlCQUFLLEVBQUU7QUFBRSxpQkFBRyxJQUFJLFFBQUksQ0FBQyxBQUFDLE1BQU07QUFDNUIsaUJBQUssRUFBRTtBQUFFLGtCQUFJLEtBQUssQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsTUFBTSxDQUFDOztBQUV2RCxpQkFBSyxFQUFFOztBQUNMLGtCQUFJLE9BQU8sQ0FBQyxTQUFTLEVBQUU7QUFBRSw0QkFBWSxHQUFHLE1BQU0sQ0FBQyxBQUFDLEVBQUUsVUFBVSxDQUFDO2VBQUU7QUFDL0Qsb0JBQU07QUFBQSxBQUNSO0FBQVMsaUJBQUcsSUFBSSxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEFBQUMsTUFBTTtBQUFBLFdBQzlDO1NBQ0Y7T0FDRixNQUFNO0FBQ0wsWUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxLQUFLLElBQUksSUFBSSxFQUFFLEtBQUssSUFBSSxFQUFFLEtBQUssQ0FBQyxRQUFRLEVBQUUsOEJBQThCLENBQUMsQ0FBQztBQUMxRyxXQUFHLElBQUksTUFBTSxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsQ0FBQztBQUMvQixVQUFFLE1BQU0sQ0FBQztPQUNWO0tBQ0Y7R0FDRjs7OztBQUlELFdBQVMsV0FBVyxDQUFDLEdBQUcsRUFBRTtBQUN4QixRQUFJLENBQUMsR0FBRyxPQUFPLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ3pCLFFBQUksQ0FBQyxLQUFLLElBQUksRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLCtCQUErQixDQUFDLENBQUM7QUFDakUsV0FBTyxDQUFDLENBQUM7R0FDVjs7Ozs7O0FBTUQsTUFBSSxXQUFXLENBQUM7Ozs7Ozs7O0FBUWhCLFdBQVMsU0FBUyxHQUFHO0FBQ25CLGVBQVcsR0FBRyxLQUFLLENBQUM7QUFDcEIsUUFBSSxJQUFJO1FBQUUsS0FBSyxHQUFHLElBQUk7UUFBRSxLQUFLLEdBQUcsTUFBTSxDQUFDO0FBQ3ZDLGFBQVM7QUFDUCxVQUFJLEVBQUUsR0FBRyxLQUFLLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLFVBQUksZ0JBQWdCLENBQUMsRUFBRSxDQUFDLEVBQUU7QUFDeEIsWUFBSSxXQUFXLEVBQUUsSUFBSSxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDOUMsVUFBRSxNQUFNLENBQUM7T0FDVixNQUFNLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTs7QUFDcEIsWUFBSSxDQUFDLFdBQVcsRUFBRSxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDcEQsbUJBQVcsR0FBRyxJQUFJLENBQUM7QUFDbkIsWUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsTUFBTSxDQUFDLElBQUksR0FBRztBQUNuQyxlQUFLLENBQUMsTUFBTSxFQUFFLDJDQUEyQyxDQUFDLENBQUM7QUFDN0QsVUFBRSxNQUFNLENBQUM7QUFDVCxZQUFJLEdBQUcsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDekIsWUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0QyxZQUFJLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLHdCQUF3QixDQUFDLENBQUM7QUFDekQsWUFBSSxFQUFFLEtBQUssR0FBRyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsR0FBRyxnQkFBZ0IsQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLEVBQzNELEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLHdCQUF3QixDQUFDLENBQUM7QUFDOUMsWUFBSSxJQUFJLE1BQU0sQ0FBQztPQUNoQixNQUFNO0FBQ0wsY0FBTTtPQUNQO0FBQ0QsV0FBSyxHQUFHLEtBQUssQ0FBQztLQUNmO0FBQ0QsV0FBTyxXQUFXLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0dBQ3hEOzs7OztBQUtELFdBQVMsUUFBUSxHQUFHO0FBQ2xCLFFBQUksSUFBSSxHQUFHLFNBQVMsRUFBRSxDQUFDO0FBQ3ZCLFFBQUksSUFBSSxHQUFHLEtBQUssQ0FBQztBQUNqQixRQUFJLENBQUMsV0FBVyxJQUFJLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFDakMsSUFBSSxHQUFHLFlBQVksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM1QixXQUFPLFdBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7R0FDaEM7OzttQkFHWSxFQUFFLFFBQVEsRUFBRSxPQUFPLENBQUMsUUFBUSxFQUFFOzs7Ozs7OztNQzc1QnRDLFNBQVM7O01BQ1QsQ0FBQzs7Ozs7QUFHUixNQUFJLE9BQU8sR0FBSSxFQUFFO01BQ2IsUUFBUSxHQUFHLEVBQUUsQ0FBQzs7QUFFbEIsU0FBTyxDQUFDLGVBQWUsR0FBRyxVQUFTLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDNUMsUUFBRyxJQUFJLElBQUksSUFBSSxDQUFDLFVBQVUsSUFBSSxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUM7QUFDckQsY0FBUSxDQUFDLElBQUksQ0FBQyxHQUFHLElBQUksQ0FBQztLQUN2QjtHQUNGLENBQUM7OztBQUdGLFNBQU8sQ0FBQyxZQUFZLEdBQUcsVUFBUyxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBRTtBQUVsRCxPQUFHLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQzs7QUFFaEIsUUFBSSxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7OztBQUc1QixRQUFHLElBQUksS0FBSyxXQUFXLEVBQUU7QUFBRSxhQUFPLElBQUksQ0FBQyxTQUFTLENBQUM7S0FBRTtBQUNuRCxRQUFHLElBQUksS0FBSyxJQUFJLEVBQUU7QUFBRSxhQUFPLElBQUksTUFBRyxDQUFDO0tBQUU7QUFDckMsUUFBRyxJQUFJLEtBQUssUUFBUSxFQUFFO0FBQUUsYUFBTyxJQUFJLENBQUMsTUFBTSxDQUFDO0tBQUU7QUFDN0MsUUFBRyxJQUFJLEtBQUssTUFBTSxFQUFFO0FBQUUsYUFBTyxJQUFJLENBQUMsSUFBSSxDQUFDO0tBQUU7QUFDekMsUUFBRyxJQUFJLEtBQUssTUFBTSxFQUFFO0FBQUUsYUFBTyxJQUFJLFFBQUssQ0FBQztLQUFFO0FBQ3pDLFFBQUcsSUFBSSxLQUFLLFNBQVMsRUFBRTtBQUFFLGFBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQztLQUFFO0FBQy9DLFFBQUcsSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUFFLGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztLQUFFO0FBQzdDLFFBQUcsSUFBSSxLQUFLLElBQUksRUFBRTtBQUFFLGFBQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQztLQUFFOzs7QUFHckMsV0FBTyxBQUFDLEdBQUcsQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUssT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQztHQUNqSixDQUFDOztBQUVGLFNBQU8sQ0FBQyxjQUFjLEdBQUcsVUFBUyxJQUFJLEVBQUUsUUFBUSxFQUFFLE1BQU0sRUFBQztBQUN2RCxRQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBQztBQUNuQixhQUFPLENBQUMsS0FBSyxDQUFDLG1EQUFtRCxDQUFDLENBQUM7QUFDbkUsYUFBTztLQUNSO0FBQ0QsUUFBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUM7QUFDekIsYUFBTyxDQUFDLEtBQUssQ0FBQyx1REFBdUQsQ0FBQyxDQUFDO0FBQ3ZFLGFBQU87S0FDUjtBQUNELFFBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBQztBQUM1QixhQUFPLENBQUMsS0FBSyxDQUFDLG9CQUFtQixHQUFHLElBQUksR0FBRywyQkFBMEIsQ0FBQyxDQUFDO0FBQ3ZFLGFBQU87S0FDUjs7QUFFRCxVQUFNLEdBQUcsQUFBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFJLE1BQU0sR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2pELFlBQVEsQ0FBQyxRQUFRLEdBQUcsTUFBTSxDQUFDOztBQUUzQixXQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsUUFBUSxDQUFDO0dBRTFCLENBQUM7Ozs7OztBQU1GLFNBQU8sQ0FBQyxFQUFFLEdBQUcsVUFBUyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUM7QUFDL0MsUUFBSSxDQUFDO1FBQUUsUUFBUTtRQUFFLFFBQVE7UUFBRSxPQUFPO1FBQzlCLFNBQVMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3JCLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTTtRQUNuQixJQUFJLEdBQUcsSUFBSSxDQUFDOzs7QUFHaEIsUUFBRyxHQUFHLEtBQUssQ0FBQyxFQUFDO0FBQ1gsY0FBUSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixjQUFRLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztBQUMzQixhQUFPLEdBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxPQUFPLENBQUMsT0FBTyxBQUFDLENBQUM7S0FDeEM7O1NBRUksSUFBRyxHQUFHLEtBQUssQ0FBQyxFQUFDO0FBQ2hCLGNBQVEsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsY0FBUSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixhQUFPLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQztLQUMzQjs7O0FBR0QsS0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxVQUFTLEtBQUssRUFBQztBQUN0RCxXQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDaEMsYUFBTyxPQUFPLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLFFBQVEsRUFBRSxLQUFLLENBQUMsQ0FBQztLQUMzRCxDQUFDLENBQUM7R0FDSixDQUFDOztBQUVGLFNBQU8sQ0FBQyxNQUFNLEdBQUcsVUFBUyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUM7QUFDakQsV0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUM7R0FDN0MsQ0FBQzs7QUFFRixTQUFPLE1BQUcsR0FBRyxVQUFTLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBQztBQUUvQyxRQUFJLFNBQVMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7O0FBRTFCLFFBQUcsU0FBUyxLQUFLLFNBQVMsRUFBQztBQUN6QixhQUFPLElBQUksQ0FBQztLQUNiOztBQUVELFFBQUcsU0FBUyxDQUFDLE9BQU8sRUFBQztBQUNuQixlQUFTLEdBQUcsSUFBSSxDQUFDO0tBQ2xCOzs7QUFHRCxRQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLElBQUksU0FBUyxDQUFDLFlBQVksRUFBQztBQUNoRCxlQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsS0FBSyxDQUFDO0tBQzdDOztBQUVELFFBQUcsU0FBUyxLQUFLLE1BQU0sRUFBQztBQUFFLGVBQVMsR0FBRyxJQUFJLENBQUM7S0FBRTtBQUM3QyxRQUFHLFNBQVMsS0FBSyxPQUFPLEVBQUM7QUFBRSxlQUFTLEdBQUcsS0FBSyxDQUFDO0tBQUU7OztBQUcvQyxRQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFDO0FBQ25CLGFBQU8sQUFBQyxTQUFTLEdBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEFBQUMsQ0FBQztLQUNyRDs7O0FBR0QsUUFBRyxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUM7QUFDN0MsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxXQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7OztBQUcxQyxRQUFHLFNBQVMsSUFBSSxPQUFPLENBQUMsUUFBUSxFQUFDO0FBQy9CLGFBQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFDO0tBQ3RILE1BQ0ksSUFBRyxDQUFDLFNBQVMsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFDO0FBQ3BDLGFBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFDO0tBQ3JIOztBQUVELFdBQU8sRUFBRSxDQUFDO0dBQ1gsQ0FBQzs7OztBQUlGLFNBQU8sQ0FBQyxNQUFNLEdBQUcsVUFBUyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUM7QUFDbkQsUUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUUxQixRQUFHLFNBQVMsS0FBSyxTQUFTLEVBQUM7QUFDekIsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxRQUFHLFNBQVMsQ0FBQyxPQUFPLEVBQUM7QUFDbkIsZUFBUyxHQUFHLElBQUksQ0FBQztLQUNsQjs7O0FBR0QsUUFBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxZQUFZLEVBQUM7QUFDaEQsZUFBUyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztLQUM3Qzs7O0FBR0QsUUFBRyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBQztBQUNuQixhQUFPLEFBQUMsQ0FBQyxTQUFTLEdBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEFBQUMsQ0FBQztLQUN0RDs7O0FBR0QsUUFBRyxPQUFPLENBQUMsV0FBVyxDQUFDLGFBQWEsS0FBSyxTQUFTLEVBQUM7QUFDakQsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxXQUFPLENBQUMsV0FBVyxDQUFDLGFBQWEsR0FBRyxTQUFTLENBQUM7OztBQUc5QyxRQUFHLENBQUMsU0FBUyxJQUFLLE9BQU8sQ0FBQyxRQUFRLEVBQUM7QUFDakMsYUFBTyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRyxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLENBQUM7S0FDdEgsTUFDSSxJQUFHLFNBQVMsSUFBSSxPQUFPLENBQUMsT0FBTyxFQUFDO0FBQ25DLGFBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFDO0tBQ3JIOztBQUVELFdBQU8sRUFBRSxDQUFDO0dBQ1gsQ0FBQzs7O0FBR0YsV0FBUyxTQUFTLENBQUMsR0FBRyxFQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUU7QUFDdEMsUUFBSSxHQUFHLElBQUksSUFBSSxFQUFFO0FBQ2YsWUFBTSxJQUFJLFNBQVMsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFDO0tBQzlEO0FBQ0QsUUFBSSxPQUFPLFNBQVMsS0FBSyxVQUFVLEVBQUU7QUFDbkMsWUFBTSxJQUFJLFNBQVMsQ0FBQyw4QkFBOEIsQ0FBQyxDQUFDO0tBQ3JEO0FBQ0QsUUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3ZCLFFBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxDQUFDO0FBQy9CLFFBQUksT0FBTyxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUMzQixRQUFJLEtBQUssQ0FBQzs7QUFFVixTQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQy9CLFdBQUssR0FBRyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDaEIsVUFBSSxTQUFTLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRTtBQUNoRCxlQUFPLENBQUMsQ0FBQztPQUNWO0tBQ0Y7QUFDRCxXQUFPLENBQUMsQ0FBQyxDQUFDO0dBQ1g7O0FBRUQsU0FBTyxDQUFDLElBQUksR0FBRyxVQUFTLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBQztBQUVqRCxRQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBQztBQUFFLGFBQU8sQ0FBQyxJQUFJLENBQUMsNkVBQTZFLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEFBQUMsT0FBTyxJQUFJLENBQUM7S0FBRTs7QUFFakwsUUFBSSxLQUFLLEdBQUcsQUFBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsWUFBWSxHQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQzs7QUFDL0QsU0FBSztRQUFFLEdBQUc7O0FBQ1YsWUFBUTs7QUFDUixnQkFBWSxHQUFHLFVBQVMsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFDO0FBQ2pELGFBQU8sT0FBTyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUM7S0FDNUIsQ0FBQzs7O0FBR04sV0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDOztBQUU5RCxLQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxVQUFTLEdBQUcsRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFDO0FBRXBDLFVBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBQztBQUFFLGVBQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsR0FBRyxFQUFFLHVCQUF1QixDQUFDLENBQUM7T0FBRTs7QUFFM0YsY0FBUSxHQUFHLFNBQVMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxZQUFZLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7Ozs7Ozs7Ozs7O0FBYXhFLFVBQUcsUUFBUSxLQUFLLEdBQUcsRUFBQzs7QUFHbEIsWUFBSSxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsWUFBVTtBQUN0QyxpQkFBTyxPQUFPLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBRSxBQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsV0FBVyxLQUFLLENBQUMsR0FBRSxHQUFHLEdBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRyxPQUFPLEVBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7U0FDeEssRUFBRSxFQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsV0FBVyxFQUFDLENBQUMsQ0FBQzs7O0FBR2pDLFlBQUcsUUFBUSxHQUFHLENBQUMsQ0FBQyxFQUFDO0FBQ2YsaUJBQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO1NBQ2hEOzs7QUFHRCxZQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFDO0FBQ2pDLGlCQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUMzQzs7O0FBR0QsZUFBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDOzs7QUFHbkQsZUFBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUM7T0FFL0M7S0FFRixFQUFFLElBQUksQ0FBQyxDQUFDOzs7QUFHVCxTQUFLLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQztBQUNyQixPQUFHLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQztBQUM1QyxTQUFJLEdBQUcsRUFBRSxLQUFLLElBQUksR0FBRyxFQUFFLEdBQUcsRUFBRSxFQUFDO0FBQzNCLGFBQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSxDQUFDO0tBQzNDOzs7QUFHRCxXQUFPLElBQUksQ0FBQztHQUViLENBQUM7O0FBRUYsU0FBTyxRQUFLLEdBQUcsVUFBUyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUM7O0FBR2pELFdBQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRyxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFFLENBQUM7R0FFaEgsQ0FBQzs7QUFFRixTQUFPLENBQUMsT0FBTyxHQUFHLFVBQVMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFDO0FBQ3BELFFBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNsQyxRQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsVUFBVSxFQUFFO0FBQ2pDLGFBQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBQzdDO0dBRUYsQ0FBQzs7bUJBRWEsT0FBTzs7Ozs7Ozs7TUN4UmYsZ0JBQWdCOztNQUNoQixDQUFDOzs7QUFHUixXQUFTLFVBQVUsQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFDO0FBQzVCLFFBQUcsR0FBRyxLQUFLLElBQUksRUFBRSxPQUFPLElBQUksQ0FBQztBQUM3QixXQUFPLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLElBQUksQ0FBQyxNQUFNLEdBQUMsQ0FBQyxDQUFDLEtBQUssSUFBSSxHQUFDLEdBQUcsQ0FBQztHQUNyRDs7Ozs7QUFLRCxXQUFTLGlCQUFpQixHQUFFO0FBQzFCLFFBQUksQ0FBQyxHQUFHLENBQUM7UUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDckMsV0FBTyxJQUFJLENBQUMsaUJBQWlCLENBQUM7QUFDOUIsU0FBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxHQUFHLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFDaEIsVUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztLQUM3QjtBQUNELFFBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQztHQUN6Qjs7QUFFRCxNQUFJLGdCQUFnQixHQUFHLFVBQVMsSUFBSSxFQUFFLE9BQU8sRUFBQztBQUU1QyxRQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMseURBQXlELEVBQUUsSUFBSSxFQUFFLGdCQUFnQixDQUFDLENBQUM7QUFDaEksV0FBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7QUFDeEIsUUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLENBQUM7QUFDekMsUUFBSSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDO0FBQ3pCLFFBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3ZCLFFBQUksQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ3RCLFFBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFFBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFFBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO0FBQ3hCLFFBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFFBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2pCLEtBQUMsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLFVBQVUsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUN6QyxRQUFJLENBQUMsSUFBSSxHQUFHLGdCQUFnQixDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDOzs7QUFHdEQsUUFBSSxPQUFPLEdBQUc7QUFDWixZQUFNLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBRSxPQUFPLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBRTtBQUNoRCxVQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFFO0FBQzVELFVBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU07S0FDaEQsQ0FBQzs7Ozs7O0FBTUYsUUFBSSxDQUFDLEtBQUssR0FBRztBQUNYLFdBQUssRUFBRSxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQztBQUNyQyxnQkFBVSxFQUFFLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFLEVBQUUsT0FBTyxDQUFDO0FBQy9DLFdBQUssRUFBRSxTQUFTO0tBQ2pCLENBQUM7O0FBRUYsUUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0dBRWIsQ0FBQzs7QUFFRixHQUFDLENBQUMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxRQUFRLENBQUMsTUFBTSxFQUFFOztBQUVwRCxzQkFBa0IsRUFBRSxJQUFJO0FBQ3hCLFVBQU0sRUFBRSxJQUFJO0FBQ1osVUFBTSxFQUFFLFlBQVU7QUFBRSxhQUFPLEVBQUUsQ0FBQztLQUFFOzs7QUFHaEMsYUFBUyxFQUFFLFlBQVU7QUFDbkIsVUFBRyxJQUFJLENBQUMsT0FBTyxFQUFFLE9BQU87QUFDeEIsVUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsVUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDN0I7Ozs7O0FBS0QsZUFBVyxFQUFFLFVBQVMsSUFBSSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFDO0FBQ3JELFVBQUksWUFBWSxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQztBQUNySCxVQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUcsT0FBTztBQUNqRCxXQUFLLEtBQUssS0FBSyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDdEIsZ0JBQVUsS0FBSyxVQUFVLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUNoQyxhQUFPLEtBQUssT0FBTyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDMUIsVUFBSSxDQUFDLE9BQU8sS0FBSyxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDcEMsVUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUNoRCxPQUFDLFVBQVUsQ0FBQyxNQUFNLEtBQUssT0FBTyxHQUFHLFVBQVUsQ0FBQSxBQUFDLEtBQUssVUFBVSxHQUFHLEtBQUssQ0FBQSxBQUFDLENBQUM7QUFDckUsVUFBSSxJQUFJLEdBQUcsVUFBUyxHQUFHLEVBQUM7QUFDdEIsWUFBSSxDQUFDO1lBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7QUFDeEIsWUFBSSxDQUFDLEtBQUssS0FBSyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDaEMsYUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFDLENBQUMsR0FBQyxHQUFHLEVBQUMsQ0FBQyxFQUFFLEVBQUM7QUFDaEIsY0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFTO0FBQ3BDLGNBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMzQixjQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1NBQ25CO09BQ0Y7VUFBRSxJQUFJO1VBQUUsTUFBTSxDQUFDO0FBQ2hCLFlBQU0sR0FBRyxJQUFJLEdBQUcsVUFBVSxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7Ozs7QUFJckUsVUFBRyxJQUFJLEtBQUssT0FBTyxJQUFJLE9BQU8sQ0FBQyxrQkFBa0IsRUFBQztBQUNoRCxTQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxVQUFTLEtBQUssRUFBRSxHQUFHLEVBQUM7QUFDckQsZ0JBQU0sR0FBRyxJQUFJLElBQUksSUFBSSxJQUFJLEdBQUcsQ0FBQSxBQUFDLEdBQUcsR0FBRyxDQUFDO0FBQ3BDLFdBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxVQUFTLFVBQVUsRUFBRSxVQUFVLEVBQUM7QUFDMUQsc0JBQVUsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVUsQ0FBQyxDQUFDO1dBQ3ZFLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDVixFQUFFLElBQUksQ0FBQyxDQUFDO09BQ1Y7Ozs7V0FJSSxJQUFHLElBQUksS0FBSyxPQUFPLElBQUksT0FBTyxDQUFDLGNBQWMsRUFBQztBQUNqRCxTQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsVUFBUyxVQUFVLEVBQUUsVUFBVSxFQUFDO0FBQzFELG9CQUFVLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztTQUN2RSxFQUFFLElBQUksQ0FBQyxDQUFDO09BQ1Y7Ozs7V0FJSSxJQUFHLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLFFBQVEsRUFBQztBQUMxQyxTQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsVUFBUyxVQUFVLEVBQUUsVUFBVSxFQUFDO0FBQzFELGNBQUksVUFBVSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxFQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDO1NBQzdHLEVBQUUsSUFBSSxDQUFDLENBQUM7T0FDVjs7O1dBR0ksSUFBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsRUFBQztBQUNwQyxjQUFNLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN0RSxTQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsVUFBUyxVQUFVLEVBQUUsVUFBVSxFQUFDO0FBQzFELG9CQUFVLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztTQUN2RSxFQUFFLElBQUksQ0FBQyxDQUFDO09BQ1Y7O0FBRUQsVUFBSSxDQUFDO1VBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQ2pDLFdBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQ2hCLFlBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLENBQUM7T0FDN0I7Ozs7QUFJRCxVQUFHLENBQUMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNwRyxhQUFPO0tBQ1I7Ozs7OztBQU1ELFlBQVEsRUFBRSxVQUFTLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBQztBQUNsRCxVQUFJLFlBQVksR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQztBQUNoRyxVQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsSUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFHLE9BQU87QUFDOUUsV0FBSyxLQUFLLEtBQUssR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQ3RCLGdCQUFVLEtBQUssVUFBVSxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDaEMsYUFBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQzFCLE9BQUMsVUFBVSxDQUFDLE1BQU0sSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxLQUFLLE9BQU8sR0FBRyxVQUFVLENBQUEsQUFBQyxLQUFLLFVBQVUsR0FBRyxLQUFLLENBQUEsQUFBQyxDQUFDO0FBQy9GLFVBQUksR0FBRyxHQUFHLElBQUksQ0FBQztBQUNmLFVBQUksSUFBSSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDNUUsVUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7O0FBRW5DLFVBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsRUFBRSxPQUFPO0FBQy9CLFVBQUcsSUFBSSxLQUFLLFFBQVEsRUFBRSxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUMsQ0FBQyxLQUNqRSxJQUFHLElBQUksS0FBSyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQ3JELElBQUcsSUFBSSxLQUFLLEtBQUssRUFBRyxJQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUMsS0FDaEQsSUFBRyxJQUFJLEtBQUssUUFBUSxFQUFHLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQzs7QUFBQSxLQUUvRDs7Ozs7QUFLRCxRQUFJLEVBQUUsWUFBVTtBQUNkLFVBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUM7QUFDekIsVUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUM5QixVQUFJLENBQUMsY0FBYyxLQUFLLElBQUksQ0FBQyxjQUFjLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQzs7QUFFbEQsT0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsSUFBSSxFQUFDO0FBQzlCLFlBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUMsR0FBRyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDdEMsWUFBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsRUFBRSxPQUFPO0FBQzNDLFdBQUcsQ0FBQyxFQUFFLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztPQUNqQyxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUVULE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFTLElBQUksRUFBQzs7QUFFOUIsWUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM5QixlQUFNLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUM7QUFDM0IsaUJBQU8sR0FBRyxPQUFPLENBQUMsVUFBVSxDQUFDO0FBQzdCLGVBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUNmOztBQUVELFlBQUksR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUN6RCxZQUFJLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLENBQUEsQUFBQyxHQUFHLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7OztBQUc5QyxZQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUM5RCxZQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUN0QyxFQUFFLElBQUksQ0FBQyxDQUFDOzs7QUFHVCxhQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7S0FDbEU7OztBQUdELFFBQUksRUFBRSxZQUFVO0FBQ2QsVUFBSSxJQUFJLEdBQUcsS0FBSyxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQztVQUM1QyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzNCLGFBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDbEM7Ozs7Ozs7Ozs7QUFVRCxTQUFLLEVBQUUsVUFBUyxPQUFPLEVBQUUsTUFBTSxFQUFDO0FBRTlCLFVBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsT0FBTztBQUM1QyxVQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQzs7QUFFdkIsVUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDO1VBQ25DLE1BQU0sQ0FBQzs7QUFFWCxhQUFPLEtBQUssT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUEsQUFBQyxDQUFDOzs7Ozs7QUFNdkMsT0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsR0FBRyxFQUFDO0FBQzdCLFlBQUksVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLEVBQUMsR0FBRyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDL0MsWUFBRyxDQUFDLFVBQVUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsRUFBRSxPQUFPO0FBQ3pELFlBQUcsVUFBVSxDQUFDLE9BQU8sSUFBSSxVQUFVLENBQUMsVUFBVSxLQUFLLElBQUksRUFBQztBQUN0RCxvQkFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ3BDLG9CQUFVLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDbkIsY0FBRyxVQUFVLENBQUMsT0FBTyxFQUFFLE9BQU8sSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7U0FDdkQ7QUFDRCxlQUFPLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztPQUVyQyxFQUFFLElBQUksQ0FBQyxDQUFDOztBQUVULFVBQUcsQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU87O0FBRTVCLFVBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7O0FBRWhELFlBQU0sR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7OztBQUcxQyxVQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUUsTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxNQUFNLEVBQUUsRUFBQyxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQyxLQUN6RSxJQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7OztBQUdqRyxVQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBQztBQUMzQyxZQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQztBQUMxQixZQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3pDLFlBQUksQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUM7T0FDckI7O1dBRUksSUFBRyxNQUFNLENBQUMsWUFBWSxFQUFDO0FBQzFCLFlBQUksQ0FBQyxVQUFVLEdBQUcsWUFBWSxDQUFDO0FBQy9CLFlBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLFlBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLFlBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDakIsWUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztPQUNwQixNQUNJLElBQUcsTUFBTSxDQUFDLE9BQU8sRUFBQztBQUNyQixZQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQztBQUMxQixZQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztBQUMxQixZQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUNwQixZQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ25CLFlBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7T0FDcEIsTUFDRztBQUNGLFlBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDO0FBQzFCLFlBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUM7QUFDekMsWUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztPQUNwQjs7QUFFRCxhQUFPLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztLQUNyQjs7Ozs7O0FBTUQsU0FBSyxFQUFFLFVBQVMsTUFBTSxFQUFDO0FBQ3JCLFVBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMxQixVQUFHLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsT0FBTztBQUNsRSxZQUFNLENBQUMsSUFBSSxLQUFLLE1BQU0sQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQSxBQUFDLENBQUM7QUFDMUMsWUFBTSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUEsQUFBQyxDQUFDO0FBQzFDLFlBQU0sQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQztBQUN4QixVQUFJLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQztBQUN2QixVQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQzdDOzs7QUFHRCxPQUFHLEVBQUUsVUFBUyxHQUFHLEVBQUUsT0FBTyxFQUFDO0FBQ3pCLFVBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUN6QixhQUFPLEtBQUssT0FBTyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDMUIsVUFBRyxJQUFJLENBQUMsVUFBVSxLQUFLLE9BQU8sRUFBRSxPQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMscUJBQXFCLEdBQUUsSUFBSSxDQUFDLElBQUksR0FBRSxzREFBc0QsQ0FBQyxDQUFDO0FBQy9JLGFBQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDaEM7Ozs7O0FBS0QsT0FBRyxFQUFFLFVBQVMsR0FBRyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUM7QUFDOUIsVUFBRyxJQUFJLENBQUMsVUFBVSxLQUFLLElBQUksRUFBRSxPQUFPLFNBQVMsQ0FBQztBQUM5QyxhQUFPLEtBQUssT0FBTyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDMUIsVUFBSSxLQUFLLEdBQUcsR0FBRyxDQUFDO0FBQ2hCLFVBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUN6QixVQUFHLElBQUksQ0FBQyxVQUFVLEtBQUssT0FBTyxFQUFDO0FBQzdCLFlBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO0FBQzNCLGVBQUssR0FBRyxBQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUksR0FBRyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFDN0MsaUJBQU8sR0FBRyxHQUFHLENBQUM7U0FDZixNQUFNO0FBQ0wsV0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFBLENBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO1NBQ3pCO09BQ0Y7QUFDRCxVQUFHLElBQUksQ0FBQyxVQUFVLEtBQUssT0FBTyxFQUFFLE9BQU8sR0FBRyxHQUFHLElBQUksRUFBRSxDQUFDO0FBQ3BELFdBQUssR0FBRyxBQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsa0JBQWtCLEdBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLEtBQUssQ0FBQzs7O0FBR3BFLFVBQUcsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEtBQUssS0FBSyxFQUFDO0FBQzNELFlBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUN6QixZQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBQzs7QUFFaEIsY0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNuRSxjQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQzNDLGNBQUksQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN4QyxjQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxVQUFVLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDMUQsaUJBQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQzNDO09BQ0YsTUFDSSxJQUFHLElBQUksQ0FBQyxVQUFVLEtBQUssT0FBTyxJQUFJLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDLEtBQ25GLElBQUcsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPLEVBQUUsR0FBRyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3JFLFVBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUM7OztBQUd2QyxPQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBUyxJQUFJLEVBQUM7QUFBRSxZQUFJLElBQUksSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO09BQUUsQ0FBQyxDQUFDOztBQUU3RCxhQUFPLEdBQUcsQ0FBQztLQUNaOzs7QUFHRCxTQUFLLEVBQUUsWUFBVTtBQUNmLFVBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDOUIsYUFBTyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztLQUNwQzs7O0FBR0QsU0FBSyxFQUFFLFVBQVMsR0FBRyxFQUFFLE9BQU8sRUFBQztBQUMzQixVQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFLE9BQU87QUFDckMsYUFBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQzFCLGFBQU8sQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ3JCLGFBQVEsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDaEM7OztBQUdELFVBQU0sRUFBRSxZQUFXO0FBQ2pCLFVBQUksSUFBSSxDQUFDLGNBQWMsRUFBRSxPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7QUFDekMsVUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3ZCLFVBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFVBQUksSUFBSSxHQUFHLEFBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLENBQUM7QUFDbEUsVUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7QUFDNUIsYUFBTyxJQUFJLENBQUM7S0FDYjs7R0FFRixDQUFDLENBQUM7O21CQUVZLGdCQUFnQjs7Ozs7Ozs7TUMvV3hCLFNBQVM7O01BQ1QsQ0FBQzs7TUFDRCxPQUFPOztBQUVkLE1BQUksS0FBSyxHQUFHLEVBQUU7TUFDVixVQUFVLEdBQUcsRUFBRyxJQUFJLEVBQUUsQ0FBQyxFQUFPLGdCQUFnQixFQUFFLENBQUMsRUFBSSxNQUFNLEVBQUUsQ0FBQyxFQUFPLFNBQVMsRUFBRSxDQUFDLEVBQU0sTUFBTSxFQUFFLENBQUM7QUFDaEYsU0FBSyxFQUFFLENBQUMsRUFBTyxLQUFLLEVBQUUsQ0FBQyxFQUFjLEdBQUcsRUFBRSxDQUFDLEVBQVUsT0FBTyxFQUFFLENBQUMsRUFBUSxJQUFJLEVBQUUsQ0FBQztBQUM5RSxjQUFVLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQVksTUFBTSxFQUFFLENBQUMsRUFBTyxXQUFXLEVBQUUsQ0FBQyxFQUFJLFdBQVcsRUFBRSxDQUFDO0FBQ3JGLFFBQUksRUFBRSxDQUFDLEVBQVEsT0FBTyxFQUFFLENBQUMsRUFBWSxPQUFPLEVBQUUsQ0FBQyxFQUFNLE9BQU8sRUFBRSxDQUFDLEVBQVEsSUFBSSxFQUFFLENBQUM7QUFDOUUsYUFBTyxDQUFDLEVBQU8sT0FBTyxFQUFFLENBQUMsRUFBWSxLQUFLLEVBQUUsQ0FBQyxFQUFRLElBQUksRUFBRSxDQUFDLEVBQVcsUUFBUSxFQUFFLENBQUM7QUFDbEYsWUFBUSxFQUFFLENBQUMsRUFBSSxLQUFLLEVBQUUsQ0FBQyxFQUFjLElBQUksRUFBRSxDQUFDLEVBQVMsT0FBTyxFQUFFLENBQUMsRUFBUSxPQUFPLEVBQUUsQ0FBQztBQUNqRixXQUFPLEVBQUUsQ0FBQyxFQUFLLE1BQU0sRUFBRSxDQUFDLEVBQWEsSUFBSSxFQUFFLENBQUMsRUFBUyxRQUFRLEVBQUUsQ0FBQyxFQUFPLE9BQU8sRUFBRSxDQUFDO0FBQ2pGLFNBQUssRUFBRSxDQUFDLEVBQU8sR0FBRyxFQUFFLENBQUMsRUFBZ0IsUUFBUSxFQUFFLENBQUMsRUFBSyxPQUFPLEVBQUUsQ0FBQyxFQUFRLElBQUksRUFBRSxDQUFDO0FBQzlFLFdBQUssQ0FBQyxFQUFTLEtBQUssRUFBRSxDQUFDLEVBQWMsV0FBVyxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFRLE1BQU0sRUFBRSxDQUFDO0FBQ2hGLFFBQUksRUFBRSxDQUFDLEVBQVEsUUFBUSxFQUFFLENBQUMsRUFBVyxNQUFNLEVBQUUsQ0FBQyxFQUFNLFlBQVksRUFBRSxDQUFDLEVBQUksRUFBRSxFQUFFLENBQUM7QUFDNUUsU0FBSyxFQUFFLENBQUMsRUFBTyxLQUFLLEVBQUUsQ0FBQyxFQUFjLElBQUksRUFBRSxDQUFDLEVBQVMsUUFBUSxFQUFFLENBQUMsRUFBTyxJQUFJLEVBQUUsQ0FBQztBQUM5RSxZQUFRLEVBQUUsQ0FBQyxFQUFJLFlBQVksRUFBRSxDQUFDLEVBQU8sV0FBVyxFQUFFLENBQUMsRUFBRSxTQUFTLEVBQUUsQ0FBQyxFQUFNLEtBQUssRUFBRSxDQUFDO0FBQy9FLFVBQU0sRUFBRSxDQUFDLEVBQU0sUUFBUSxFQUFFLENBQUMsRUFBVyxJQUFJLEVBQUUsQ0FBQyxFQUFTLE1BQU0sRUFBRSxDQUFDLEVBQVMsUUFBUSxFQUFFLENBQUM7QUFDbEYsV0FBTyxFQUFFLENBQUMsRUFBSyxNQUFNLEVBQUUsQ0FBQyxFQUFhLE1BQU0sRUFBRSxDQUFDLEVBQU8sTUFBTSxFQUFFLENBQUMsRUFBUyxRQUFRLEVBQUUsQ0FBQztBQUNsRixXQUFPLEVBQUUsQ0FBQyxFQUFLLFVBQVUsRUFBRSxDQUFDLEVBQVMsT0FBTyxFQUFFLENBQUMsRUFBTSxTQUFTLEVBQUUsQ0FBQyxFQUFNLFVBQVUsRUFBRSxDQUFDO0FBQ3BGLFdBQU8sRUFBRSxDQUFDLEVBQUssTUFBTSxFQUFFLENBQUMsRUFBYSxXQUFXLEVBQUUsQ0FBQyxFQUFFLFdBQVcsRUFBRSxDQUFDLEVBQUksVUFBVSxFQUFFLENBQUM7QUFDcEYsZUFBVyxFQUFFLENBQUMsRUFBQyxTQUFTLEVBQUUsQ0FBQyxFQUFVLE9BQU8sRUFBRSxDQUFDLEVBQU0sUUFBUSxFQUFFLENBQUMsRUFBTyxRQUFRLEVBQUUsQ0FBQztBQUNsRixZQUFRLEVBQUUsQ0FBQyxFQUFJLE9BQU8sRUFBRSxDQUFDLEVBQVksTUFBTSxFQUFFLENBQUMsRUFBTyxRQUFRLEVBQUUsQ0FBQyxFQUFPLEdBQUcsRUFBRSxDQUFDO0FBQzdFLE9BQUcsRUFBRSxDQUFDLEVBQVMsSUFBSSxFQUFFLENBQUMsRUFBZSxPQUFPLEVBQUUsQ0FBQyxFQUFNLEtBQUssRUFBRSxDQUFDLEVBQVUsTUFBTSxFQUFFLENBQUM7QUFDaEYsU0FBSyxFQUFFLENBQUMsRUFBTyxTQUFTLEVBQUUsQ0FBQyxFQUFVLFFBQVEsRUFBRSxDQUFDLEVBQUssS0FBSyxFQUFFLENBQUMsRUFBVSxJQUFJLEVBQUUsQ0FBQztBQUM5RSxRQUFJLEVBQUUsQ0FBQyxFQUFRLEdBQUcsRUFBRSxDQUFDLEVBQWdCLE9BQU8sRUFBRSxDQUFDLEVBQU0sS0FBSyxFQUFFLENBQUMsRUFBVSxLQUFLLEVBQUUsQ0FBQztBQUMvRSxXQUFPLEVBQUUsQ0FBQyxFQUFLLFFBQVEsRUFBRSxDQUFDLEVBQVcsTUFBTSxFQUFFLENBQUMsRUFBTyxJQUFJLEVBQUUsQ0FBQyxFQUFXLEtBQUssRUFBRSxDQUFDO0FBQy9FLFFBQUksRUFBRSxDQUFDLEVBQVEsTUFBTSxFQUFFLENBQUMsRUFBYSxNQUFNLEVBQUUsQ0FBQyxFQUFPLEtBQUssRUFBRSxDQUFDLEVBQVUsU0FBUyxFQUFFLENBQUM7QUFDbkYsV0FBTyxFQUFFLENBQUMsRUFBSyxLQUFLLEVBQUUsQ0FBQyxFQUFjLE1BQU0sRUFBRSxDQUFDLEVBQU8sS0FBSyxFQUFFLENBQUMsRUFBRyxDQUFDOzs7Ozs7OztBQVFyRixXQUFTLGNBQWMsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFOztBQUdyQyxRQUFJLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxZQUFXO0FBQ3ZDLGFBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUMxQixFQUFFLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBQyxDQUFDLENBQUM7OztBQUd2QixhQUFTLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzs7O0FBR3RCLGFBQVMsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDOztBQUVyQyxXQUFPLFNBQVMsQ0FBQztHQUNsQjs7QUFFRCxXQUFTLGVBQWUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFO0FBQzlFLFFBQUksU0FBUyxDQUFDOzs7QUFHZCxXQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxXQUFXLEdBQUcsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLE9BQU8sSUFBSSxFQUFFLElBQUksS0FBSyxDQUFDO0FBQ3ZFLFdBQU8sQ0FBQyxPQUFPLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxPQUFPLElBQUksRUFBRSxJQUFJLEtBQUssQ0FBQzs7O0FBR2xELFdBQU8sQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0FBQ3hCLFdBQU8sQ0FBQyxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQztBQUMxQixXQUFPLENBQUMsT0FBTyxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUM7QUFDOUIsV0FBTyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDMUIsV0FBTyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO0FBQ3RCLFdBQU8sQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFdBQU8sQ0FBQyxJQUFJLEdBQUcsSUFBSSxJQUFJLEVBQUUsQ0FBQzs7O0FBRzFCLFdBQU8sQ0FBQyxTQUFTLEdBQUcsSUFBSSxTQUFTLENBQUMsWUFBVztBQUMzQyxVQUFJLFdBQVcsR0FBRyxFQUFFO1VBQ2hCLFNBQVMsR0FBRyxFQUFFO1VBQ2QsTUFBTTtVQUNOLE9BQU8sR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQztVQUMzQixLQUFLO1VBQUUsSUFBSSxDQUFDO0FBQ1osYUFBTyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2hCLGFBQU8sR0FBRyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUU1QixVQUFJLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUM1QixXQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3JCLFVBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7QUFHMUIsT0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsVUFBUyxLQUFLLEVBQUUsS0FBSyxFQUFDO0FBQ25DLG1CQUFXLENBQUMsSUFBSSxDQUFHLEFBQUMsS0FBSyxJQUFJLEtBQUssQ0FBQyxXQUFXLEdBQUksS0FBSyxDQUFDLEtBQUssRUFBRSxHQUFHLEtBQUssQ0FBRyxDQUFDO09BQzVFLENBQUMsQ0FBQztBQUNILE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsSUFBSSxFQUFFLEdBQUcsRUFBQztBQUM5QixpQkFBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEFBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxXQUFXLEdBQUksSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQztPQUNuRSxDQUFDLENBQUM7OztBQUdILFlBQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFFLE9BQU8sQ0FBQyxRQUFRLElBQUksT0FBTyxFQUFHLENBQUMsV0FBVyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQzs7QUFFN0YsVUFBRyxNQUFNLElBQUksT0FBTyxFQUFDO0FBQ25CLGVBQU8sTUFBTSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztPQUM1Qjs7QUFFRCxhQUFPLE1BQU0sQ0FBQztLQUNmLEVBQUUsRUFBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUssRUFBQyxDQUFDLENBQUM7O0FBRTNCLFdBQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzs7O0FBRzlCLFVBQU0sQ0FBQyxPQUFPLENBQUMsVUFBUyxJQUFJLEVBQUU7QUFDNUIsVUFBSSxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsRUFBRTtBQUM1QixlQUFPLENBQUMsU0FBUyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO09BQzNDO0tBQ0YsQ0FBQyxDQUFDOztBQUVILFdBQU8sT0FBTyxDQUFDLFNBQVMsQ0FBQztHQUMxQjs7O0FBR0QsV0FBUyxZQUFZLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBQzs7QUFFeEMsYUFBUyxDQUFDLE9BQU8sQ0FBQyxVQUFTLFFBQVEsRUFBRTtBQUNuQyxVQUFHLFFBQVEsQ0FBQyxZQUFZLEVBQUM7QUFDdkIsU0FBQyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsWUFBWSxFQUFFLFVBQVMsSUFBSSxFQUFFLEtBQUssRUFBQztBQUNqRCxXQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVMsQ0FBQyxFQUFDO0FBQzVCLGdCQUFHLENBQUMsQ0FBQyxXQUFXLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsRUFBQztBQUMxQyxlQUFDLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ3pCO1dBQ0YsQ0FBQyxDQUFDO1NBQ0osQ0FBQyxDQUFDO09BQ0o7S0FDRixDQUFDLENBQUM7R0FDSjs7QUFFRCxNQUFJLGVBQWUsR0FBRyxJQUFJLGdCQUFnQixDQUFDLFlBQVksQ0FBQyxDQUFDOzs7Ozs7QUFNekQsT0FBSyxDQUFDLEdBQUcsR0FBRyxTQUFTLEdBQUcsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBQztBQUMxQyxXQUFPLENBQUMsV0FBVyxLQUFLLE9BQU8sQ0FBQyxXQUFXLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUNsRCxRQUFHLElBQUksS0FBSyxNQUFNLEVBQUM7QUFBRSxVQUFJLEdBQUcsRUFBRSxDQUFDO0tBQUU7O0FBRWpDLFdBQU8sY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztHQUN0QyxDQUFDOztBQUVGLE9BQUssQ0FBQyxHQUFHLEdBQUcsU0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBQ2pELFdBQU8sQ0FBQyxXQUFXLEtBQUssT0FBTyxDQUFDLFdBQVcsR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDOztHQUVuRCxDQUFDOzs7QUFHRixPQUFLLENBQUMsTUFBTSxHQUFHLFNBQVMsTUFBTSxDQUFDLEdBQUcsRUFBRSxNQUFNLEVBQUU7QUFFMUMsUUFBRyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBQztBQUNyQixhQUFPLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztLQUNsQjs7QUFFRCxRQUFJLFNBQVMsR0FBRyxJQUFJLFNBQVMsQ0FBQyxZQUFXO0FBQ3ZDLFVBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQzs7QUFFZixXQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzdDLGFBQUssSUFBSSxBQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEdBQUksTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssRUFBRSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNsRTs7QUFFRCxhQUFPLEtBQUssQ0FBQztLQUNkLEVBQUUsRUFBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBQyxDQUFDLENBQUM7O0FBRWpDLFNBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDN0MsVUFBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFO0FBQ3hCLGlCQUFTLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDeEM7S0FDRjs7QUFFRCxXQUFPLFNBQVMsQ0FBQztHQUVsQixDQUFDOztBQUVGLE9BQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtBQUV2RSxRQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDO1FBQzNELFNBQVMsQ0FBQzs7QUFFVixRQUFJLE1BQU0sRUFBRTs7QUFFVixlQUFTLEdBQUcsZUFBZSxDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQztLQUN4RixNQUFNO0FBQ0wsZUFBUyxHQUFHLGNBQWMsQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7S0FDakQ7O0FBRUQsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUM3QyxVQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUU7QUFDeEIsaUJBQVMsQ0FBQyxpQkFBaUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUN4QztLQUNGOztBQUVELFdBQU8sU0FBUyxDQUFDO0dBQ2xCLENBQUM7O0FBRUYsT0FBSyxDQUFDLEtBQUssR0FBRyxTQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxRQUFRLEVBQUUsT0FBTyxFQUFDO0FBQ3RGLFFBQUksT0FBTyxHQUFHO0FBQ1osV0FBSyxFQUFFLEtBQUs7QUFDWixjQUFRLEVBQUUsUUFBUTtBQUNsQixhQUFPLEVBQUUsT0FBTztLQUNqQixDQUFDOztBQUVGLFFBQUksU0FBUztRQUNiLEtBQUs7UUFDTCxRQUFRLEdBQUcsZUFBZTtRQUMxQixNQUFNLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDOztBQUVsRCxRQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsRUFBQztBQUN2QixhQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLHlCQUF5QixDQUFDLENBQUM7S0FDeEQ7OztBQUdELGFBQVMsR0FBRyxlQUFlLENBQUMsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQyxDQUFDOzs7O0FBSXRGLFFBQUksU0FBUyxFQUFFO0FBQ2IsZUFBUyxDQUFDLFFBQVEsQ0FBQyxVQUFTLFNBQVMsRUFBRTtBQUNyQyxZQUFJLEdBQUcsR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDNUIsV0FBRyxHQUFHLEFBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBSSxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQ3RDLFlBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFDO0FBQ2hCLGVBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDdkI7T0FDRixDQUFDLENBQUM7O0FBRUgsV0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMxQixXQUFLLEdBQUcsQUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxHQUFJLEVBQUUsR0FBRyxLQUFLLENBQUM7QUFDNUMsVUFBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUM7QUFBRSxhQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO09BQUU7Ozs7O0FBSzFDLFVBQUcsS0FBSyxDQUFDLE9BQU8sRUFBQztBQUNmLGFBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxHQUFHLFNBQVMsQ0FBQztBQUN0QyxrQkFBVSxDQUFDLFlBQVU7QUFDbkIsY0FBRyxLQUFLLENBQUMsaUJBQWlCLEVBQUM7QUFDekIsb0JBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFFLGFBQWEsRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7V0FDeEg7U0FDRixFQUFFLENBQUMsQ0FBQyxDQUFDO09BQ1A7S0FFRjtHQUVKLENBQUM7O0FBRUYsT0FBSyxDQUFDLE1BQU0sR0FBRyxTQUFTLE1BQU0sQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtBQUV0RSxRQUFJLFNBQVM7UUFDYixLQUFLO1FBQ0wsUUFBUSxHQUFHLGVBQWU7UUFDMUIsTUFBTSxHQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQzs7QUFFbEQsUUFBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsTUFBTSxDQUFDLEVBQUM7QUFDdkIsYUFBTyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksR0FBRyx5QkFBeUIsQ0FBQyxDQUFDO0tBQ3hEOzs7QUFHRCxhQUFTLEdBQUcsZUFBZSxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQzs7OztBQUlqRixRQUFJLFNBQVMsRUFBRTtBQUNiLGVBQVMsQ0FBQyxRQUFRLENBQUMsVUFBUyxTQUFTLEVBQUU7QUFDckMsWUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzVCLFdBQUcsR0FBRyxBQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQztBQUN0QyxZQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBQztBQUNoQixlQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3ZCO09BQ0YsQ0FBQyxDQUFDOztBQUVILFdBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDMUIsV0FBSyxHQUFHLEFBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBSSxFQUFFLEdBQUcsS0FBSyxDQUFDO0FBQzVDLFVBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFDO0FBQUUsYUFBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUFFOzs7OztBQUsxQyxVQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUM7QUFDZixhQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7QUFDdEMsa0JBQVUsQ0FBQyxZQUFVO0FBQ25CLGNBQUcsS0FBSyxDQUFDLGlCQUFpQixFQUFDO0FBQ3pCLG9CQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1dBQ3hIO1NBQ0YsRUFBRSxDQUFDLENBQUMsQ0FBQztPQUNQO0tBRUY7R0FDRixDQUFDOztBQUVKLE9BQUssQ0FBQyxPQUFPLEdBQUcsU0FBUyxPQUFPLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFO0FBRTFELFFBQUksU0FBUztRQUNULEtBQUs7UUFDTCxRQUFRLEdBQUcsZUFBZTtRQUMxQixNQUFNLEdBQUcsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDOztBQUV0RCxhQUFTLEdBQUcsY0FBYyxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQzs7OztBQUkxQyxRQUFJLFNBQVMsRUFBRTtBQUNiLGVBQVMsQ0FBQyxRQUFRLENBQUMsVUFBUyxTQUFTLEVBQUU7QUFDckMsWUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzVCLFdBQUcsR0FBRyxBQUFDLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUksRUFBRSxHQUFHLEdBQUcsQ0FBQztBQUN0QyxZQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBQztBQUNoQixlQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ3ZCO09BQ0YsQ0FBQyxDQUFDOztBQUVILFdBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDMUIsV0FBSyxHQUFHLEFBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsR0FBSSxFQUFFLEdBQUcsS0FBSyxDQUFDO0FBQzVDLFVBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFDO0FBQUUsYUFBSyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUFFOzs7OztBQUs1QyxVQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUM7QUFDZixhQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUM7QUFDdEMsa0JBQVUsQ0FBQyxZQUFVO0FBQ25CLGNBQUcsS0FBSyxDQUFDLGlCQUFpQixFQUFDO0FBQ3pCLG9CQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBRSxhQUFhLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1dBQ3hIO1NBQ0YsRUFBRSxDQUFDLENBQUMsQ0FBQztPQUNQO0tBRUY7R0FDRixDQUFDOzs7O0FBSUYsT0FBSyxDQUFDLE9BQU8sR0FBRyxTQUFTLE9BQU8sQ0FBQyxHQUFHLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRTtBQUM3RSxRQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDO1FBQ2pELFNBQVM7UUFDVCxLQUFLLENBQUM7O0FBRVYsUUFBSSxNQUFNLEVBQUU7O0FBRVYsZUFBUyxHQUFHLGVBQWUsQ0FBQyxVQUFVLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDLENBQUM7S0FDdkYsTUFBTTtBQUNMLGVBQVMsR0FBRyxjQUFjLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzNDOzs7QUFHRCxhQUFTLENBQUMsUUFBUSxDQUFDLFVBQVMsU0FBUyxFQUFFO0FBQ3JDLGVBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztLQUNuQixDQUFDLENBQUM7O0FBRUgsU0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztHQUUzQixDQUFDO0FBQ0YsT0FBSyxDQUFDLFNBQVMsR0FBRyxTQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFDO0FBRTNFLFFBQUksU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLFlBQVc7QUFDdkMsVUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRTtVQUN2QixjQUFjO1VBQ2QsSUFBSSxHQUFHLFVBQVUsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDO1VBRXRDLFVBQVUsR0FBRyxFQUFHLE1BQU0sRUFBRSxJQUFJLEVBQUcsTUFBTyxJQUFJLEVBQUksT0FBUSxJQUFJLEVBQUcsVUFBVyxJQUFJO0FBQzVELGdCQUFTLElBQUksRUFBRSxLQUFNLElBQUksRUFBSyxLQUFNLElBQUksRUFBSyxRQUFTLElBQUk7QUFDMUQsZ0JBQVMsSUFBSSxFQUFFLE9BQVMsSUFBSSxFQUFFLE1BQVEsSUFBSSxFQUFHLFVBQVksSUFBSTtBQUM3RCx5QkFBaUIsRUFBRSxJQUFJLEVBQU8sT0FBUyxJQUFJLEVBQUUsT0FBUyxJQUFJO0FBQzFELGNBQVEsSUFBSSxFQUFHLE1BQVEsSUFBSTtPQUM1QjtVQUNmLElBQUksQ0FBQzs7O0FBR0wsVUFBSSxVQUFVLENBQUMsT0FBTyxLQUFLLE9BQU8sSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxLQUFLLE9BQU8sRUFBRTs7QUFHMUUsWUFBRyxDQUFDLFNBQVMsQ0FBQyxhQUFhLEVBQUM7QUFFMUIsV0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyw2QkFBNkIsRUFBRSxVQUFTLEtBQUssRUFBQztBQUM3RCxpQkFBSyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztXQUNuQyxDQUFDLENBQUM7O0FBRUgsbUJBQVMsQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDO1NBRWhDOzs7QUFHRCxBQUFDLFNBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUksVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQzs7QUFFN0YsWUFBSSxHQUFHLEdBQUcsQ0FBQzs7QUFFWCxlQUFPLEFBQUMsVUFBVSxDQUFDLEtBQUssS0FBSyxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUksVUFBVSxDQUFDLEtBQUssR0FBSSxJQUFJLElBQUksRUFBRSxBQUFDLEdBQUcsSUFBSSxDQUFDO09BQ3JGLE1BRUksSUFBSSxVQUFVLENBQUMsT0FBTyxLQUFLLE9BQU8sS0FBSyxJQUFJLEtBQUssVUFBVSxJQUFJLElBQUksS0FBSyxPQUFPLENBQUEsQUFBQyxJQUFJLElBQUksS0FBSyxTQUFTLEVBQUU7O0FBRzFHLFlBQUcsQ0FBQyxTQUFTLENBQUMsV0FBVyxFQUFDO0FBRXhCLFdBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLEVBQUUsVUFBUyxLQUFLLEVBQUM7QUFDdkQsaUJBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRyxBQUFDLElBQUksQ0FBQyxPQUFPLEdBQUksSUFBSSxHQUFHLEtBQUssRUFBRyxFQUFDLEtBQUssRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1dBQ3ZFLENBQUMsQ0FBQzs7QUFFSCxtQkFBUyxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7U0FDOUI7OztBQUdELEFBQUMsU0FBQyxHQUFHLEdBQUksVUFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsR0FBRyxVQUFVLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQzs7QUFFL0UsZUFBTyxVQUFVLENBQUMsT0FBTyxHQUFHLEFBQUMsR0FBRyxHQUFJLElBQUksR0FBRyxTQUFTLENBQUM7T0FDdEQsTUFFSTtBQUNILFNBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDdEMsV0FBRyxLQUFLLEdBQUcsR0FBRyxTQUFTLENBQUEsQUFBQyxDQUFDO0FBQ3pCLFlBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBQztBQUNwQixvQkFBVSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNsQyxNQUNHO0FBQ0Ysb0JBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO1NBQ3BDO09BQ0Y7O0FBRUQsYUFBTyxHQUFHLENBQUM7S0FFWixFQUFFLEVBQUMsU0FBUyxFQUFFLFNBQVMsRUFBQyxDQUFDLENBQUM7O0FBRTNCLFNBQUssQ0FBQyxRQUFRLENBQUMsWUFBVTtBQUN2QixlQUFTLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDbkIsQ0FBQyxDQUFDO0FBQ0gsYUFBUyxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUVuQyxXQUFPLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztHQUUxQixDQUFDOztBQUVGLE9BQUssQ0FBQyxTQUFTLEdBQUcsVUFBUyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRTtBQUU5RSxRQUFJLFNBQVM7UUFDVCxPQUFPO1FBQ1AsTUFBTTtRQUNOLFNBQVMsR0FBRyxFQUFFO1FBQ2QsYUFBYSxHQUFHLEVBQUU7UUFDbEIsU0FBUztRQUNULEtBQUssQ0FBQzs7O0FBR1YsYUFBUyxHQUFHLElBQUksU0FBUyxDQUFDLFlBQVc7O0FBR25DLE9BQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxFQUFFLFVBQVMsS0FBSyxFQUFFLEdBQUcsRUFBRTtBQUN2QyxpQkFBUyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEFBQUMsS0FBSyxDQUFDLFdBQVcsR0FBSSxLQUFLLENBQUMsS0FBSyxFQUFFLEdBQUcsS0FBSyxDQUFDO09BQzlELENBQUMsQ0FBQzs7Ozs7QUFLSCxhQUFPLENBQUMsUUFBUSxHQUFHLFNBQVMsQ0FBQztBQUM3QixhQUFPLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMxQyxhQUFPLENBQUMsUUFBUSxHQUFHLEVBQUUsQ0FBQztBQUN0QixlQUFTLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQzs7O0FBR2xDLE9BQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFVBQVMsS0FBSyxFQUFFLEdBQUcsRUFBRTtBQUNyQyxZQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsV0FBVyxFQUFDO0FBQ2xELHVCQUFhLENBQUMsR0FBRyxDQUFDLEdBQUcsY0FBYyxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsQ0FBQztTQUNyRDtPQUNGLENBQUMsQ0FBQzs7OztBQUlILE9BQUMsQ0FBQyxJQUFJLENBQUUsYUFBYSxFQUFFLFVBQVMsa0JBQWtCLEVBQUUsR0FBRyxFQUFDOztBQUd0RCxZQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFDOztBQUVwQyw0QkFBa0IsQ0FBQyxRQUFRLENBQUMsWUFBVTtBQUNwQyx1QkFBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLGtCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7V0FDekUsQ0FBQyxDQUFDO1NBQ0o7OztBQUdELG1CQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLFlBQVU7QUFDbEMsNEJBQWtCLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQztTQUN2RCxDQUFDLENBQUM7OztBQUdILDBCQUFrQixDQUFDLEtBQUssRUFBRSxDQUFDOzs7QUFHM0IsbUJBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM3RCwwQkFBa0IsQ0FBQyxXQUFXLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQyxDQUFDO09BRWhELENBQUMsQ0FBQzs7O0FBR0gsZUFBUyxDQUFDLFFBQVEsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFFLFVBQVMsS0FBSyxFQUFDO0FBQ3JELFlBQUksSUFBSSxHQUFHLFNBQVMsQ0FBQyxNQUFNLEVBQUUsQ0FBQzs7QUFFOUIsWUFBRyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU87OztBQUc1QixTQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFTLEtBQUssRUFBRSxHQUFHLEVBQUM7Ozs7QUFJL0IsY0FBSSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQUUsbUJBQU87V0FBRTtBQUNsQyxlQUFLLEdBQUcsQUFBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQzFELGNBQUc7QUFBRSxBQUFDLHNCQUFVLENBQUMsR0FBRyxDQUFDLEdBQUksT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLEVBQUUsS0FBSyxDQUFDLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUM7V0FBRSxDQUMzRixPQUFNLENBQUMsRUFBQztBQUNOLG1CQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztXQUMxQjtTQUNKLENBQUMsQ0FBQztPQUNKLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7O0FBY0gsVUFBSSxRQUFRLEdBQUcsU0FBUyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ2xDLE9BQUMsQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLFVBQVMsS0FBSyxFQUFFLEdBQUcsRUFBQzs7QUFFbkMsWUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQUUsaUJBQU87U0FBRTtBQUNsQyxhQUFLLEdBQUcsQUFBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxHQUFJLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQzVELFlBQUcsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBQztBQUMzQyxjQUFHO0FBQUUsQUFBQyxzQkFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFJLE9BQU8sQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxDQUFDO1dBQUUsQ0FDM0YsT0FBTSxDQUFDLEVBQUM7QUFDTixtQkFBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7V0FDMUI7U0FDRjtPQUNGLENBQUMsQ0FBQzs7OztBQUlILFlBQU0sR0FBRyxPQUFPLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEQsVUFBRyxRQUFRLElBQUksQ0FBQyxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBQztBQUNqQyxjQUFNLENBQUMsV0FBVyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLEdBQUcsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO09BQzNEOzs7QUFHRCxhQUFPLE9BQU8sQ0FBQztLQUNoQixFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7Ozs7OztBQU1uQixRQUFJLFNBQVMsRUFBRTtBQUNiLGVBQVMsQ0FBQyxRQUFRLENBQUMsVUFBUyxTQUFTLEVBQUU7QUFDckMsWUFBSSxHQUFHLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzVCLFlBQUcsR0FBRyxLQUFLLFNBQVMsRUFBQztBQUFFLGVBQUssQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7U0FBRTtPQUNoRCxDQUFDLENBQUM7O0FBRUgsV0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMxQixVQUFHLEtBQUssS0FBSyxTQUFTLEVBQUM7QUFBRSxhQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO09BQUU7S0FDaEQ7R0FDRixDQUFDOzs7O21CQUlhLEtBQUs7Ozs7Ozs7Ozs7Ozs7OztNQ3ppQmIsZ0JBQWdCOztNQUNoQixDQUFDOzs7OztBQUtSLFdBQVMsYUFBYSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUM7QUFDakMsV0FBTyxZQUFVO0FBQ2YsVUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQzNCLGFBQU8sSUFBSSxJQUFJLEFBQUMsSUFBSSxLQUFLLEVBQUUsR0FBSSxFQUFFLEdBQUcsR0FBRyxDQUFBLEFBQUMsR0FBRyxHQUFHLENBQUM7S0FDaEQsQ0FBQztHQUNIOztBQUVELE1BQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDOztBQUVoQyxXQUFPLEVBQUUsSUFBSTtBQUNiLFVBQU0sRUFBRSxJQUFJOzs7O0FBSVosVUFBTSxFQUFFLFlBQVU7QUFBRSxhQUFPLEVBQUUsQ0FBQztLQUFFOzs7O0FBSWhDLGVBQVcsRUFBRSxVQUFTLFVBQVUsRUFBRSxPQUFPLEVBQUM7QUFDeEMsZ0JBQVUsS0FBSyxVQUFVLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUNoQyxnQkFBVSxDQUFDLE9BQU8sS0FBSyxVQUFVLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQSxBQUFDLENBQUM7QUFDM0QsYUFBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQzFCLFVBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLFVBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7QUFDcEMsVUFBSSxDQUFDLFNBQVMsQ0FBRSxPQUFPLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBRSxDQUFDO0FBQ3pDLFVBQUksQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUUsQ0FBQztBQUNyQyxVQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQztBQUMxQyxjQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLE9BQU8sQ0FBRSxDQUFDO0tBQ2xEOzs7QUFHRCxVQUFNLEVBQUUsVUFBUyxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQzlCLGFBQU8sR0FBRyxPQUFPLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDMUMsVUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixVQUFHLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLG9DQUFvQyxHQUFHLElBQUksR0FBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDNUYsYUFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztLQUN0Qzs7Ozs7QUFLRCxTQUFLLEVBQUUsVUFBUyxHQUFHLEVBQUUsT0FBTyxFQUFDO0FBQzNCLFVBQUksT0FBTyxHQUFHLEVBQUU7VUFBRSxHQUFHO1VBQUUsS0FBSyxDQUFDO0FBQzdCLGFBQU8sS0FBSyxPQUFPLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUMxQixhQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztBQUNyQixTQUFHLEdBQUcsQUFBQyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sSUFBSSxHQUFHLENBQUMsVUFBVSxJQUFLLEdBQUcsSUFBSSxFQUFFLENBQUM7QUFDMUQsYUFBTyxDQUFDLGtCQUFrQixHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDOzs7Ozs7OztBQVF0RCxXQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFDO0FBQ3pCLGFBQUssR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzdCLFlBQUcsS0FBSyxLQUFLLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxTQUFTLEtBQzNCLElBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUMsR0FBRyxDQUFDLEtBQUssT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQSxBQUFDLENBQUMsS0FDL0QsSUFBSSxHQUFHLEtBQUssSUFBSSxDQUFDLFdBQVcsRUFBRSxTQUFTLEtBQ3ZDLElBQUksS0FBSyxDQUFDLFlBQVksSUFBSSxLQUFLLENBQUMsT0FBTyxJQUFJLEtBQUssQ0FBQyxrQkFBa0IsRUFBQztBQUN2RSxlQUFLLENBQUMsS0FBSyxDQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBRSxFQUFFLEVBQUcsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztBQUM1QyxjQUFHLEtBQUssQ0FBQyxZQUFZLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxLQUNwQyxJQUFHLEtBQUssQ0FBQyxPQUFPLElBQUksS0FBSyxDQUFDLGtCQUFrQixFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FDdkYsSUFBRyxLQUFLLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxLQUFLLENBQUMsT0FBTyxDQUFBO1NBQ3BELE1BQ0ksSUFBSSxHQUFHLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxFQUFDO0FBQUUsaUJBQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7U0FBRSxNQUN4RCxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUM7QUFDOUUsaUJBQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUM5QyxNQUNHO0FBQ0YsaUJBQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxTQUFTLENBQUM7QUFDekIsY0FBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsRUFBQyxNQUFNLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztTQUNqQztPQUNGLENBQUM7OztBQUdGLE9BQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLFVBQVMsS0FBSyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUM7QUFDbkMsZUFBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7T0FDekMsQ0FBQyxDQUFDOzs7QUFHSCxTQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLEVBQUUsT0FBTyxFQUFFLEVBQUMsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQyxDQUFDOzs7QUFHekUsVUFBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDdkIsVUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE9BQU8sQ0FBQyxDQUFDOzs7QUFHMUQsYUFBTyxHQUFHLENBQUM7S0FDWjs7Ozs7Ozs7Ozs7Ozs7QUFjRCxPQUFHLEVBQUUsVUFBUyxHQUFHLEVBQUUsT0FBTyxFQUFDO0FBQ3pCLGFBQU8sS0FBSyxPQUFPLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUMxQixVQUFJLEtBQUssR0FBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQztVQUN6QixNQUFNLEdBQUcsSUFBSTtVQUNiLENBQUM7VUFBRSxDQUFDLEdBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQzs7QUFFdEIsVUFBRyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxTQUFTLENBQUM7QUFDekQsVUFBRyxHQUFHLEtBQUssRUFBRSxJQUFJLEtBQUssQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLE9BQU8sTUFBTSxDQUFDOztBQUVuRCxXQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUN0QixZQUFHLE1BQU0sSUFBSSxNQUFNLENBQUMsa0JBQWtCLElBQUksT0FBTyxDQUFDLEdBQUcsRUFBRSxPQUFPLE1BQU0sQ0FBQztBQUNyRSxZQUFHLE1BQU0sSUFBSSxNQUFNLENBQUMsa0JBQWtCLEVBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNoRSxZQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxPQUFPLE1BQU0sQ0FBQztBQUM1RCxZQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxTQUFTLEVBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FDakQsSUFBRyxNQUFNLENBQUMsWUFBWSxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQ3pELElBQUcsTUFBTSxDQUFDLE9BQU8sRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUN4RCxJQUFHLE1BQU0sSUFBSSxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7T0FDOUU7O0FBRUQsVUFBRyxNQUFNLElBQUksTUFBTSxDQUFDLGtCQUFrQixJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ2hGLGFBQU8sTUFBTSxDQUFDO0tBQ2Y7Ozs7Ozs7QUFPRCxPQUFHLEVBQUUsVUFBUyxHQUFHLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBQztBQUU5QixVQUFJLEtBQUs7VUFBRSxJQUFJO1VBQUUsTUFBTTtVQUFFLE1BQU07VUFBRSxXQUFXO1VBQUUsS0FBSyxHQUFHLEVBQUU7VUFBRSxPQUFPLENBQUM7O0FBRWxFLFVBQUksT0FBTyxHQUFHLEtBQUssUUFBUSxFQUFFO0FBQzNCLGFBQUssR0FBRyxBQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUksR0FBRyxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFDN0MsZUFBTyxHQUFHLEdBQUcsQ0FBQztPQUNmLE1BQ0ksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFBLENBQUUsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDO0FBQzdCLGFBQU8sS0FBSyxPQUFPLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQzs7O0FBRzFCLFVBQUcsT0FBTyxDQUFDLEtBQUssS0FBSyxJQUFJLEVBQUUsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM3RCxVQUFHLE9BQU8sQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFLElBQUksQ0FBQyxRQUFRLEdBQUcsS0FBSyxDQUFDO0FBQ3BELFVBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxPQUFPOzs7QUFHNUIsV0FBSSxHQUFHLElBQUksS0FBSyxFQUFDO0FBQ2YsWUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQztZQUNoQixLQUFLLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUM7WUFDeEIsSUFBSSxHQUFJLEtBQUssQ0FBQyxHQUFHLEVBQUUsSUFBSSxFQUFFLENBQUM7QUFDMUIsY0FBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNsQyxlQUFPLENBQUM7OztBQUdaLFlBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBQztBQUN2QixnQkFBTSxHQUFHLElBQUksQ0FBQztBQUNkLFdBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVMsS0FBSyxFQUFDO0FBQzNCLGdCQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzVCLGdCQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEVBQUUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUM5RCxrQkFBTSxHQUFHLEdBQUcsQ0FBQztXQUNkLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDVjs7O0FBR0QsWUFBSSxXQUFXLEdBQUcsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsRUFBQyxHQUFHLEVBQUUsSUFBSSxFQUFDLENBQUMsSUFBSSxFQUFFLENBQUM7OztBQUd0RCxlQUFPLEdBQUc7QUFDUixjQUFJLEVBQUUsR0FBRztBQUNULGdCQUFNLEVBQUUsTUFBTTtBQUNkLGNBQUksRUFBRSxJQUFJLENBQUMsUUFBUTtBQUNuQixjQUFJLEVBQUUsYUFBYSxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUM7QUFDaEMsZ0JBQU0sRUFBRSxJQUFJO0FBQ1osa0JBQVEsRUFBRSxPQUFPLENBQUMsUUFBUTtTQUMzQixDQUFBOzs7Ozs7Ozs7Ozs7Ozs7QUFlRCxZQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqRSxZQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxHQUFHLEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxLQUMvQyxJQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsU0FBUyxDQUFDLEtBQ3hELElBQUcsV0FBVyxDQUFDLGtCQUFrQixJQUFJLFdBQVcsQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLFNBQVMsS0FDeEUsSUFBRyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLGdCQUFnQixDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQyxLQUMvRCxJQUFHLEdBQUcsQ0FBQyxNQUFNLElBQUksTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLEtBQ2xELElBQUksV0FBVyxDQUFDLGtCQUFrQixJQUM3QixXQUFXLENBQUMsWUFBWSxLQUFNLENBQUMsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLFlBQVksQ0FBQSxBQUFFLEFBQUMsSUFDbkUsV0FBVyxDQUFDLE9BQU8sS0FBTSxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUEsQUFBRSxBQUFDLEVBQUM7QUFDbkUscUJBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzlCLG1CQUFTO1NBQ1YsTUFDSSxJQUFHLEdBQUcsQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDLEtBQUssS0FBSyxLQUFLLEVBQUUsR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLEdBQUcsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLENBQUMsS0FDM0csSUFBRyxDQUFDLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO2FBQzlELElBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsRUFBRSxHQUFHLEdBQUcsSUFBSSxLQUFLLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDOzs7QUFHdkQsWUFBSSxDQUFDLFlBQVksR0FBSSxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sSUFBSSxLQUFLLEFBQUMsQ0FBQzs7O0FBR2pELGdCQUFRLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO09BRS9ELENBQUM7O0FBRUYsYUFBTyxJQUFJLENBQUM7S0FFYjs7OztBQUlELFVBQU0sRUFBRSxZQUFXO0FBQ2YsVUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLE9BQU8sSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQ3BELFVBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQzNCLFVBQUksSUFBSSxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3BDLE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsS0FBSyxFQUFFLElBQUksRUFBRTtBQUMvQixZQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUFFLGlCQUFPO1NBQUU7QUFDeEQsU0FBQyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQSxBQUFDLENBQUM7T0FDL0QsQ0FBQyxDQUFDO0FBQ0gsVUFBSSxDQUFDLGNBQWMsR0FBRyxLQUFLLENBQUM7QUFDNUIsYUFBTyxJQUFJLENBQUM7S0FDZjs7R0FFRixDQUFDLENBQUM7O21CQUVZLEtBQUs7Ozs7Ozs7O0FDeFBwQixNQUFJLEdBQUcsR0FBRyxTQUFTLEdBQUcsR0FBRSxFQUFFO01BQ3RCLFdBQVcsR0FBRyxFQUFFLENBQUM7O0FBRXJCLFdBQVMsU0FBUyxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUU7QUFDOUIsV0FBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFBO0FBQ3pCLFFBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNuQyxRQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNsQixRQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDO0FBQ3ZDLFFBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUM7QUFDbkMsUUFBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxJQUFJLElBQUksQ0FBQztBQUMzQyxLQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLG1CQUFtQixFQUFFLGFBQWEsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0dBQ3RHOztBQUVELFdBQVMsQ0FBQyxTQUFTLEdBQUc7QUFDcEIsZUFBVyxFQUFFLElBQUk7QUFDakIsVUFBTSxFQUFFLElBQUk7QUFDWixZQUFRLEVBQUUsSUFBSTtBQUNkLGFBQVMsRUFBRSxJQUFJO0FBQ2YsU0FBSyxFQUFFLEdBQUc7QUFDVixXQUFPLEVBQUUsSUFBSTtBQUNiLGVBQVcsRUFBRSxJQUFJO0FBQ2pCLGdCQUFZLEVBQUUsSUFBSTs7QUFFbEIsU0FBSyxFQUFFLFlBQVc7QUFDaEIsVUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztBQUN2QixVQUFJLEtBQUssS0FBSyxHQUFHLEVBQUU7QUFBRSxlQUFPLEtBQUssQ0FBQztPQUFFOztBQUVwQyxVQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQzdCLFVBQUksUUFBUSxFQUFFO0FBQ1osWUFBSSxLQUFLO1lBQ0wsTUFBTSxHQUFHLElBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxLQUFLLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFDOztBQUU3RCxhQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQy9DLGVBQUssR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsZ0JBQU0sQ0FBQyxDQUFDLENBQUMsR0FBRyxBQUFDLEtBQUssSUFBSSxLQUFLLENBQUMsV0FBVyxHQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxLQUFLLENBQUM7U0FDbEU7O0FBRUQsZUFBTyxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7T0FDMUMsTUFBTTtBQUNMLGVBQU8sSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxDQUFDO09BQy9DO0tBQ0Y7O0FBRUQsT0FBRyxFQUFFLFVBQVMsR0FBRyxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUM7QUFDaEMsVUFBRyxJQUFJLENBQUMsT0FBTyxFQUFDO0FBQ2QsZUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLE9BQU8sQ0FBQyxDQUFDO09BQzlDO0FBQ0QsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxxQkFBaUIsRUFBRSxVQUFTLEtBQUssRUFBRTtBQUNqQyxVQUFJLFFBQVEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQzdCLFVBQUksQ0FBQyxRQUFRLEVBQUU7QUFDYixnQkFBUSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUNwQyxNQUFNO0FBQ0wsZ0JBQVEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7T0FDdEI7O0FBRUQsVUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBRTtBQUFFLGFBQUssQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDO09BQUU7O0FBRXhELGFBQU8sSUFBSSxDQUFDO0tBQ2I7O0FBRUQsZUFBVyxFQUFFLFVBQVMsSUFBSSxFQUFFLE9BQU8sRUFBRTtBQUNuQyxVQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBLEFBQUM7VUFDbkQsUUFBUTtVQUFFLEdBQUcsQ0FBQzs7QUFFbEIsVUFBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQywyQkFBMkIsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7OztBQUcvRyxhQUFPLENBQUMsV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLElBQUksRUFBRSxDQUFDOztBQUVoRCxhQUFPLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksRUFBQyxVQUFVLEVBQUUsRUFBRSxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUMsQ0FBQzs7O0FBR3JGLFNBQUcsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUM3QixTQUFHLEdBQUcsQUFBQyxHQUFHLElBQUksR0FBRyxDQUFDLFlBQVksR0FBSSxZQUFZLEdBQUcsT0FBTyxDQUFDOzs7QUFHekQsY0FBUSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7O0FBR3pELGVBQVMsQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBQyxDQUFDLENBQUM7O0FBRWhFLGFBQU8sSUFBSSxDQUFDO0tBQ2I7O0FBRUQsVUFBTSxFQUFFLFVBQVMsTUFBTSxFQUFFOzs7O0FBSXZCLFVBQUcsSUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLFVBQVUsRUFBRSxPQUFPLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztBQUN6RixVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSztVQUNsQixNQUFNO1VBQ04sV0FBVyxDQUFDOztBQUVoQixVQUFJLEtBQUssS0FBSyxHQUFHLEVBQUU7QUFDakIsY0FBTSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUM7QUFDckIsbUJBQVcsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDO0FBQy9CLGFBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUN6QixZQUFJLE1BQU0sRUFBRTtBQUFFLGdCQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQUU7QUFDcEMsWUFBSSxDQUFDLFdBQVcsRUFBRTtBQUFFLGlCQUFPO1NBQUU7QUFDN0IsYUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLFdBQVcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUNsRCxxQkFBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ3RCO09BQ0Y7S0FDRjs7QUFFRCxZQUFRLEVBQUUsVUFBUyxRQUFRLEVBQUU7QUFDM0IsVUFBSSxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsS0FBSyxJQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDOUQsaUJBQVcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDM0IsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxXQUFPLEVBQUUsWUFBVztBQUNsQixPQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsVUFBUyxLQUFLLEVBQUM7QUFDbkMsWUFBSSxLQUFLLElBQUksS0FBSyxDQUFDLFdBQVcsRUFBQztBQUFFLGVBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUFFO09BQ3BELENBQUMsQ0FBQztBQUNILE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsRUFBRSxVQUFTLFVBQVUsRUFBQztBQUMzQyxZQUFJLFVBQVUsSUFBSSxVQUFVLENBQUMsV0FBVyxFQUFDO0FBQUUsb0JBQVUsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUFFO09BQ25FLENBQUMsQ0FBQzs7QUFFSCxVQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7O0FBRXRHLE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxVQUFTLFFBQVEsRUFBQztBQUN2QyxZQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUM7QUFDekQsaUJBQU8sUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUNwRTtPQUNGLENBQUMsQ0FBQzs7QUFFSCxVQUFJLENBQUMsU0FBUyxHQUFHLElBQUksQ0FBQztLQUN2QjtHQUNGLENBQUM7O21CQUVhLFNBQVM7Ozs7Ozs7Ozs7O01DbklqQixLQUFLOztNQUNMLFVBQVU7O01BQ1YsZ0JBQWdCOztNQUNoQixDQUFDOztBQUVSLE1BQUksYUFBYSxHQUFHOzs7OztBQUtsQixrQkFBYyxFQUFFLFVBQVMsSUFBSSxFQUFFLEtBQUssRUFBQztBQUNuQyxVQUFHLElBQUksQ0FBQyxVQUFVLEtBQUssSUFBSSxJQUFJLElBQUksS0FBSyxPQUFPLEVBQUUsT0FBTztBQUN4RCxVQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLEtBQUssQ0FBQyxPQUFPLEVBQUM7QUFDaEQsWUFBRyxJQUFJLENBQUMsWUFBWSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxPQUFPO0FBQzFELFlBQUksR0FBRztZQUNILElBQUksR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUM7WUFDOUUsT0FBTyxHQUFHLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDOztBQUV4QyxhQUFJLEdBQUcsSUFBSSxPQUFPLEVBQUM7QUFDakIsbUJBQVMsQ0FBQyxDQUFDLENBQUMsR0FBSSxTQUFTLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLENBQUEsQUFBQyxHQUFHLEdBQUcsQUFBQyxDQUFDO0FBQ3hELGNBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1NBQzNEO0FBQ0QsZUFBTztPQUNSO0FBQ0QsYUFBTyxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxTQUFTLENBQUMsQ0FBQztLQUNsRTs7OztBQUlELGFBQVMsRUFBRSxVQUFTLE1BQU0sRUFBQztBQUN6QixVQUFHLElBQUksQ0FBQyxVQUFVLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ3pELFVBQUksQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDO0FBQ3pCLFVBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3pCLFVBQUcsTUFBTSxLQUFLLElBQUksRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ25FLGFBQU8sTUFBTSxDQUFDO0tBQ2Y7Ozs7QUFJRCxXQUFPLEVBQUUsVUFBVSxJQUFJLEVBQUM7QUFDdEIsVUFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDO0FBQ2YsU0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDcEIsVUFBSSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sSUFBSyxHQUFHLENBQUMsVUFBVSxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUM7QUFDckQsT0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsVUFBUyxLQUFLLEVBQUUsR0FBRyxFQUFDO0FBQzlCLFlBQUcsS0FBSyxJQUFJLEtBQUssQ0FBQyxNQUFNLEVBQUM7QUFDdkIsZUFBSyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUNyQjtPQUNGLENBQUMsQ0FBQztBQUNILGFBQU8sSUFBSSxDQUFDO0tBQ2I7OztBQUdELGFBQVMsRUFBRSxVQUFTLEdBQUcsRUFBQztBQUN0QixVQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDZixhQUFNLEdBQUcsS0FBSyxHQUFHLEVBQUM7QUFDaEIsV0FBRyxHQUFHLEdBQUcsQ0FBQyxVQUFVLENBQUM7QUFDckIsWUFBRyxDQUFDLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sS0FBSyxDQUFDO0FBQ3BDLFlBQUcsR0FBRyxLQUFLLEdBQUcsRUFBRSxPQUFPLElBQUksQ0FBQztBQUM1QixZQUFHLEdBQUcsQ0FBQyxVQUFVLEtBQUssR0FBRyxFQUFFLE9BQU8sS0FBSyxDQUFDO09BQ3pDO0FBQ0QsYUFBTyxJQUFJLENBQUM7S0FDYjs7O0FBR0QsZ0JBQVksRUFBRSxZQUFZOztBQUd4QixVQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztBQUNuRCxVQUFJLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO0FBQzdDLFVBQUksSUFBSSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7OztBQUd6QixhQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDdkIsYUFBTyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ3JCLGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQzs7Ozs7QUFLbkIsVUFBRyxJQUFJLENBQUMsRUFBRSxFQUFDO0FBQ1QsU0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsRUFBRSxVQUFTLE9BQU8sRUFBRSxTQUFTLEVBQUM7QUFDdEQsY0FBSSxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQixFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN4RixjQUFJLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksR0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7U0FDdkUsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNULFNBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLFVBQVMsRUFBRSxFQUFDO0FBQ2hDLGNBQUcsRUFBRSxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDeEUsQ0FBQyxDQUFDO0FBQ0gsZUFBTyxJQUFJLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQztBQUMzQixlQUFPLElBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxDQUFDO0FBQ3hCLGVBQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQztBQUNoQixlQUFPLElBQUksQ0FBQyxFQUFFLENBQUM7T0FDaEI7OztBQUdELGFBQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQzs7O0FBR3hCLFVBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxDQUFDOzs7OztBQUsxQixPQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsVUFBVSxHQUFHLEVBQUU7QUFBRSxXQUFHLElBQUksR0FBRyxDQUFDLFlBQVksSUFBSSxHQUFHLENBQUMsWUFBWSxFQUFFLENBQUM7T0FBRSxDQUFDLENBQUM7QUFDdkYsT0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxFQUFFLFVBQVUsR0FBRyxFQUFFO0FBQUUsV0FBRyxJQUFJLEdBQUcsQ0FBQyxZQUFZLElBQUksR0FBRyxDQUFDLFlBQVksRUFBRSxDQUFDO09BQUMsQ0FBQyxDQUFDO0FBQzFGLFVBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxVQUFVLENBQUMsWUFBWSxFQUFFLENBQUM7QUFDbkQsVUFBSSxDQUFDLEtBQUssSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxZQUFZLEVBQUUsQ0FBQztLQUUvQztHQUNGLENBQUM7OztBQUdGLEdBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxhQUFhLENBQUMsQ0FBQztBQUN6QyxHQUFDLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7QUFDOUMsR0FBQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsYUFBYSxDQUFDLENBQUM7O1VBRTNDLEtBQUssR0FBTCxLQUFLO1VBQUUsVUFBVSxHQUFWLFVBQVU7VUFBRSxnQkFBZ0IsR0FBaEIsZ0JBQWdCOzs7Ozs7OztBQ3RINUMsTUFBSSxDQUFDLEdBQUcsVUFBUyxLQUFLLEVBQUM7QUFDckIsV0FBTyxJQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztHQUN6QixDQUFDOztBQUVGLE1BQUksS0FBSyxHQUFHLFVBQVMsS0FBSyxFQUFDO0FBQ3pCLFFBQUksQ0FBQztRQUFFLFFBQVEsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQUFBQyxLQUFLLEtBQUssUUFBUSxJQUFLLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7QUFDNUksUUFBSSxDQUFDLE1BQU0sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDOzs7QUFHOUIsU0FBSyxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQzVCLFVBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7S0FDekI7O0FBRUQsV0FBTyxJQUFJLENBQUM7R0FDYixDQUFDOztBQUVGLFdBQVMsV0FBVyxHQUFFO0FBQUMsV0FBTyxLQUFLLENBQUM7R0FBQztBQUNyQyxXQUFTLFVBQVUsR0FBRTtBQUFDLFdBQU8sSUFBSSxDQUFDO0dBQUM7O0FBRW5DLEdBQUMsQ0FBQyxLQUFLLEdBQUcsVUFBVSxHQUFHLEVBQUUsS0FBSyxFQUFHOztBQUVoQyxRQUFLLEVBQUUsSUFBSSxZQUFZLENBQUMsQ0FBQyxLQUFLLENBQUEsQUFBQyxFQUFHO0FBQ2pDLGFBQU8sSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFFLEdBQUcsRUFBRSxLQUFLLENBQUUsQ0FBQztLQUNqQzs7O0FBR0QsUUFBSyxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksRUFBRztBQUN0QixVQUFJLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQztBQUN6QixVQUFJLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUM7Ozs7QUFJckIsVUFBSSxDQUFDLGtCQUFrQixHQUFHLEdBQUcsQ0FBQyxnQkFBZ0IsSUFDNUMsR0FBRyxDQUFDLGdCQUFnQixLQUFLLFNBQVM7O0FBRWxDLFNBQUcsQ0FBQyxXQUFXLEtBQUssS0FBSyxHQUMxQixVQUFVLEdBQ1YsV0FBVyxDQUFDOzs7S0FHYixNQUFNO0FBQ04sVUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLENBQUM7S0FDaEI7OztBQUdELFFBQUssS0FBSyxFQUFHO0FBQ1osT0FBQyxDQUFDLE1BQU0sQ0FBRSxJQUFJLEVBQUUsS0FBSyxDQUFFLENBQUM7S0FDeEI7OztBQUdBLEtBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUUsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUN2QyxRQUFRLEVBQUUsU0FBUyxFQUFFLFlBQVksRUFBRSxTQUFTLEVBQUUsZUFBZSxFQUFFLFlBQVksRUFDM0UsU0FBUyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsUUFBUSxFQUFFLFdBQVcsRUFBRSxNQUFNLEVBQ3JFLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEtBQUssRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFDbEUsU0FBUyxFQUFFLFNBQVMsRUFBRSxFQUFFLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFDM0UsU0FBUyxFQUFFLFdBQVcsQ0FDdkIsQ0FBQyxDQUFDLENBQUM7OztBQUdQLFFBQUksQ0FBQyxTQUFTLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxTQUFTLElBQUksQUFBQyxJQUFJLElBQUksRUFBRSxDQUFFLE9BQU8sRUFBRSxDQUFDOzs7QUFHaEUsUUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7R0FDcEIsQ0FBQzs7QUFFRixHQUFDLENBQUMsS0FBSyxDQUFDLFNBQVMsR0FBRztBQUNuQixlQUFXLEVBQUUsQ0FBQyxDQUFDLEtBQUs7QUFDcEIsc0JBQWtCLEVBQUUsV0FBVztBQUMvQix3QkFBb0IsRUFBRSxXQUFXO0FBQ2pDLGlDQUE2QixFQUFFLFdBQVc7O0FBRTFDLGtCQUFjLEVBQUUsWUFBVztBQUMxQixVQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDOztBQUUzQixVQUFJLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDOztBQUVyQyxVQUFLLENBQUMsSUFBSSxDQUFDLENBQUMsY0FBYyxFQUFHO0FBQzVCLFNBQUMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztPQUNuQjtLQUNEO0FBQ0QsbUJBQWUsRUFBRSxZQUFXO0FBQzNCLFVBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7O0FBRTNCLFVBQUksQ0FBQyxvQkFBb0IsR0FBRyxVQUFVLENBQUM7O0FBRXZDLFVBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxlQUFlLEVBQUc7QUFDN0IsU0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDO09BQ3BCO0tBQ0Q7QUFDRCw0QkFBd0IsRUFBRSxZQUFXO0FBQ3BDLFVBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUM7O0FBRTNCLFVBQUksQ0FBQyw2QkFBNkIsR0FBRyxVQUFVLENBQUM7O0FBRWhELFVBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyx3QkFBd0IsRUFBRztBQUN0QyxTQUFDLENBQUMsd0JBQXdCLEVBQUUsQ0FBQztPQUM3Qjs7QUFFRCxVQUFJLENBQUMsZUFBZSxFQUFFLENBQUM7S0FDdkI7R0FDRCxDQUFDOzs7QUFHRixPQUFLLENBQUMsU0FBUyxHQUFHOzs7O0FBSWhCLGFBQVMsRUFBRSxVQUFTLElBQUksRUFBQztBQUN2QixVQUFJLEdBQUcsQ0FBQyxHQUFHLEdBQUMsSUFBSSxHQUFDLEdBQUcsQ0FBQSxDQUFFLEtBQUssQ0FBQyxlQUFlLENBQUMsQ0FBQztBQUM3QyxVQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDWCxVQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDYixhQUFPLElBQUksQ0FBQztLQUNiOzs7QUFHRCxjQUFVLEVBQUUsVUFBUyxJQUFJLEVBQUU7QUFDekIsVUFBSSxFQUFFO1VBQUUsSUFBSTtVQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQ2hDLGFBQU0sR0FBRyxFQUFFLEVBQUM7QUFDVixZQUFJLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNYLFlBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQ3ZCLGVBQU8sSUFBSSxFQUFFO0FBQ1QsV0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN6QixjQUFJLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztTQUMzQjtPQUNGO0tBQ0Y7OztBQUdELFdBQU8sRUFBRSxFQUFFOzs7QUFHWCxnQkFBWSxFQUFFLFVBQVMsTUFBTSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUM7QUFDakQsVUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDOzs7QUFHbkIsVUFBRyxNQUFNLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFDO0FBQ3ZFLFNBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsVUFBUyxhQUFhLEVBQUUsVUFBVSxFQUFDO0FBQ3ZGLGNBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLENBQUMsS0FBSyxVQUFVLEtBQUssUUFBUSxDQUFDLFVBQVUsSUFBTSxRQUFRLENBQUMsZUFBZSxJQUFJLFFBQVEsQ0FBQyxlQUFlLENBQUMsVUFBVSxDQUFDLENBQUUsQUFBQyxFQUFFO0FBQzNJLHFCQUFTLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQztXQUM3QztTQUNGLENBQUMsQ0FBQztPQUNKOztBQUVELGFBQU8sU0FBUyxDQUFDO0tBQ2xCOzs7QUFHRCxXQUFPLEVBQUUsVUFBUyxTQUFTLEVBQUUsT0FBTyxFQUFDO0FBQ25DLFVBQUksRUFBRTtVQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO0FBQzFCLGFBQU0sR0FBRyxFQUFFLEVBQUM7QUFDVixVQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2YsWUFBSSxRQUFRLENBQUMsV0FBVyxFQUFFO0FBQ3hCLGNBQUksS0FBSyxHQUFHLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLENBQUM7QUFDL0MsZUFBSyxDQUFDLFNBQVMsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3hDLFlBQUUsQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDekIsTUFBTTtBQUNMLFlBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFDLFNBQVMsQ0FBQyxDQUFDO1NBQzlCO09BQ0Y7S0FDRjs7QUFFRCxPQUFHLEVBQUUsVUFBUyxTQUFTLEVBQUUsT0FBTyxFQUFDO0FBQy9CLFVBQUksRUFBRTtVQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTTtVQUFFLFVBQVUsQ0FBQzs7QUFFdEMsYUFBTSxHQUFHLEVBQUUsRUFBQztBQUVWLFVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDZixrQkFBVSxHQUFHLENBQUMsQ0FBQzs7QUFFZixZQUFHLEVBQUUsQ0FBQyxhQUFhLEVBQUM7QUFDbEIsY0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFDO0FBQ2xILGFBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxFQUFFLENBQUMsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsVUFBUyxRQUFRLEVBQUUsS0FBSyxFQUFFLFlBQVksRUFBQztBQUN2RixlQUFDLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxVQUFTLFFBQVEsRUFBRSxLQUFLLEVBQUUsWUFBWSxFQUFDO0FBQzFELG9CQUFHLFFBQVEsS0FBSyxPQUFPLEVBQUM7QUFDdEIseUJBQU8sWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDO0FBQzNCLHlCQUFPO2lCQUNSO0FBQ0QsMEJBQVUsRUFBRSxDQUFDO2VBQ2QsQ0FBQyxDQUFDO2FBQ0osQ0FBQyxDQUFDO1dBQ0o7U0FDRjs7O0FBR0QsWUFBSSxVQUFVLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxtQkFBbUIsRUFBQztBQUM3QyxZQUFFLENBQUMsbUJBQW1CLENBQUMsU0FBUyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsQ0FBQztTQUNuRDtBQUNELFlBQUksVUFBVSxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxFQUFDO0FBQ3JDLFlBQUUsQ0FBQyxXQUFXLENBQUMsSUFBSSxHQUFDLFNBQVMsRUFBRSxPQUFPLENBQUMsQ0FBQztTQUN6QztPQUVGO0tBQ0Y7O0FBRUQsTUFBRSxFQUFFLFVBQVUsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQ2hELFVBQUksRUFBRTtVQUNGLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTztVQUNyQixHQUFHLEdBQUcsSUFBSSxDQUFDLE1BQU07VUFDakIsVUFBVSxHQUFHLFNBQVMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDO1VBQ2pDLFVBQVU7VUFBRSxhQUFhLENBQUM7O0FBRTlCLGFBQU0sR0FBRyxFQUFFLEVBQUM7QUFDVixVQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7QUFHZixZQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUM7QUFDeEIsaUJBQU8sR0FBRyxRQUFRLENBQUM7QUFDbkIsa0JBQVEsR0FBRyxFQUFFLENBQUM7QUFDZCxjQUFJLEdBQUcsRUFBRSxDQUFDO1NBQ1g7QUFDRCxZQUFHLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUM7QUFDcEIsaUJBQU8sR0FBRyxJQUFJLENBQUM7QUFDZixjQUFJLEdBQUcsRUFBRSxDQUFDO1NBQ1g7QUFDRCxZQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLEVBQUM7QUFDakQsaUJBQU8sQ0FBQyxLQUFLLENBQUMsK0VBQStFLENBQUMsQ0FBQztBQUMvRixpQkFBTyxLQUFLLENBQUM7U0FDZDs7QUFFRCxrQkFBVSxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsUUFBUSxHQUFJLFFBQVEsQ0FBQyxVQUFVLEdBQUcsUUFBUSxDQUFDLFVBQVUsSUFBSSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxBQUFDLENBQUM7QUFDbEgscUJBQWEsR0FBRyxFQUFFLENBQUMsYUFBYSxHQUFJLEVBQUUsQ0FBQyxhQUFhLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxlQUFlLENBQUMsQUFBQyxDQUFDOztBQUVyRixTQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxVQUFTLFNBQVMsRUFBQzs7QUFHcEMsZ0JBQU0sQ0FBQyxhQUFhLENBQUMsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFDOzs7QUFHcEQsY0FBSSxRQUFRLEdBQUcsVUFBUyxLQUFLLEVBQUM7QUFDeEIsZ0JBQUksTUFBTSxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxDQUFDO0FBQzFELGlCQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFFLEtBQUssSUFBSSxNQUFNLENBQUMsS0FBSyxDQUFFLENBQUM7QUFDN0Msa0JBQU0sR0FBRyxLQUFLLENBQUMsTUFBTSxJQUFJLEtBQUssQ0FBQyxVQUFVLENBQUM7OztBQUcxQyxtQkFBTSxNQUFNLEVBQUM7O0FBR1gsdUJBQVMsR0FBRyxDQUFDLENBQUMsWUFBWSxDQUFDLEVBQUUsRUFBRSxNQUFNLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVuRCxpQkFBRyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDdkIsbUJBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQ2hCLHFCQUFLLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxVQUFVLEdBQUcsTUFBTSxDQUFDO0FBQ3pDLHFCQUFLLENBQUMsSUFBSSxHQUFHLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDL0IscUJBQUssQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3JELHFCQUFLLEdBQUcsQUFBRSxLQUFLLENBQUMsTUFBTSxLQUFLLEtBQUssR0FBSyxJQUFJLEdBQUcsS0FBSyxDQUFDO2VBQ25EOzs7QUFHRCxrQkFBRyxLQUFLLEVBQUM7QUFDUCxxQkFBSyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ3ZCLHFCQUFLLENBQUMsZUFBZSxFQUFFLENBQUM7QUFDeEIsdUJBQU8sS0FBSyxDQUFDO2VBQ2Q7O0FBRUQsb0JBQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDO2FBQzVCO1dBQ0YsQ0FBQzs7OztBQUlOLGNBQUcsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUM7O0FBRW5DLGNBQUUsQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxFQUFHLFNBQVMsS0FBSyxPQUFPLElBQUksU0FBUyxLQUFLLE1BQU0sQ0FBRSxDQUFDO1dBQzNGOzs7O0FBSUQsZ0JBQU0sQ0FBQyxhQUFhLENBQUMsQ0FBQyxTQUFTLENBQUMsR0FBRyxNQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzFFLGdCQUFNLENBQUMsYUFBYSxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUNsRyxnQkFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLFFBQVEsRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7U0FFcEYsRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNWO0tBQ0Y7O0FBRUQsV0FBTyxFQUFFLFVBQVMsSUFBSSxFQUFFO29CQUV0QixVQUFrQixHQUFHLEVBQUUsSUFBSSxFQUFFO0FBQzNCLFlBQUksTUFBTSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEdBQUcsRUFBRTtBQUN2QixnQkFBTSxDQUFDLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUNwQixNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsRUFBRTtBQUM3QixlQUFJLElBQUksQ0FBQyxHQUFDLENBQUMsRUFBRSxDQUFDLEdBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUNqQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLElBQUksR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ3RDLGNBQUksQ0FBQyxLQUFLLENBQUMsRUFDVCxNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ25CLE1BQU07QUFDTCxjQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDbkIsZUFBSyxJQUFJLENBQUMsSUFBSSxHQUFHLEVBQUU7QUFDakIsbUJBQU8sR0FBRyxLQUFLLENBQUM7QUFDaEIsbUJBQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxHQUFHLElBQUksR0FBQyxHQUFHLEdBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1dBQ3hDO0FBQ0QsY0FBSSxPQUFPLElBQUksSUFBSSxFQUNqQixNQUFNLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO1NBQ25CO09BQ0Y7O0FBbEJQLFVBQUksTUFBTSxHQUFHLEVBQUUsQ0FBQztBQW1CVixhQUFPLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQ2xCLGFBQU8sTUFBTSxDQUFDO0tBQ2Y7OztBQUdQLFFBQUksRUFBRSxVQUFTLEdBQUcsRUFBRTtBQUNoQixVQUFHLE9BQU8sR0FBRyxJQUFJLFFBQVEsRUFBRSxHQUFHLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUM7QUFDOUMsU0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUUsQ0FBQztBQUN4QixTQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDO0FBQzVCLFNBQUcsQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUM7QUFDakMsU0FBRyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztBQUMxQixVQUFJLFNBQVMsR0FBRyxVQUFTLElBQUksRUFBRSxHQUFHLEVBQUU7QUFDaEMsWUFBSSxHQUFHLEdBQUcsRUFBRTtZQUFFLEdBQUcsQ0FBQztBQUNsQixhQUFJLElBQUksSUFBSSxJQUFJLElBQUksRUFBRTtBQUNsQixhQUFHLENBQUMsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHLEdBQUcsa0JBQWtCLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUN6RDtBQUNELFdBQUcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ3BCLFlBQUcsR0FBRyxLQUFLLEVBQUUsRUFBRTtBQUNYLGlCQUFPLEdBQUcsR0FBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLEdBQUksR0FBRyxDQUFDO1NBQ3JFO0FBQ0QsZUFBTyxFQUFFLENBQUM7T0FDYixDQUFDO0FBQ0YsVUFBSSxHQUFHLEdBQUc7QUFDTixZQUFJLEVBQUUsRUFBRTtBQUNSLGVBQU8sRUFBRSxVQUFTLEdBQUcsRUFBRTtBQUNuQixjQUFJLElBQUksR0FBRyxJQUFJLENBQUM7QUFDaEIsY0FBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsY0FBRyxNQUFNLENBQUMsYUFBYSxFQUFFO0FBQUUsZ0JBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxhQUFhLENBQUMsbUJBQW1CLENBQUMsQ0FBQztXQUFFLE1BQzFFLElBQUcsTUFBTSxDQUFDLGNBQWMsRUFBRTtBQUFFLGdCQUFJLENBQUMsR0FBRyxHQUFHLElBQUksY0FBYyxFQUFFLENBQUM7V0FBRTtBQUNuRSxjQUFHLElBQUksQ0FBQyxHQUFHLEVBQUU7QUFDVCxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxrQkFBa0IsR0FBRyxZQUFXO0FBQ3JDLGtCQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsVUFBVSxJQUFJLENBQUMsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sSUFBSSxHQUFHLEVBQUU7QUFDbkQsb0JBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsWUFBWSxDQUFDO0FBQ25DLG9CQUFHLEdBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxJQUFJLE9BQU8sSUFBSSxJQUFJLFdBQVcsRUFBRTtBQUNoRCx3QkFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7aUJBQy9CO0FBQ0Qsb0JBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUM1RSxtQkFBRyxDQUFDLE9BQU8sSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO2VBQ25FLE1BQU0sSUFBRyxJQUFJLENBQUMsR0FBRyxDQUFDLFVBQVUsSUFBSSxDQUFDLEVBQUU7QUFDaEMsb0JBQUksQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0FBQ3BFLG1CQUFHLENBQUMsS0FBSyxJQUFJLEdBQUcsQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztlQUN2RDtBQUNELGtCQUFJLENBQUMsY0FBYyxJQUFJLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUN4RSxpQkFBRyxDQUFDLFFBQVEsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDN0QsQ0FBQztXQUNMO0FBQ0QsY0FBRyxHQUFHLENBQUMsTUFBTSxJQUFJLEtBQUssRUFBRTtBQUNwQixnQkFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ25FLGdCQUFJLENBQUMsVUFBVSxDQUFDO0FBQ2QsZ0NBQWtCLEVBQUUsZ0JBQWdCO2FBQ3JDLENBQUMsQ0FBQztXQUNOLE1BQU07QUFDSCxnQkFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQ3pDLGdCQUFJLENBQUMsVUFBVSxDQUFDO0FBQ1osZ0NBQWtCLEVBQUUsZ0JBQWdCO0FBQ3BDLDRCQUFjLEVBQUUsbUNBQW1DO2FBQ3RELENBQUMsQ0FBQztXQUNOO0FBQ0QsY0FBRyxHQUFHLENBQUMsT0FBTyxJQUFJLE9BQU8sR0FBRyxDQUFDLE9BQU8sSUFBSSxRQUFRLEVBQUU7QUFDOUMsZ0JBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1dBQ2hDO0FBQ0Qsb0JBQVUsQ0FBQyxZQUFXO0FBQ2xCLGVBQUcsQ0FBQyxNQUFNLElBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1dBQzlFLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDUCxpQkFBTyxJQUFJLENBQUMsR0FBRyxDQUFDO1NBQ25CO0FBQ0QsWUFBSSxFQUFFLFVBQVMsUUFBUSxFQUFFO0FBQ3JCLGNBQUksQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDO0FBQzdCLGlCQUFPLElBQUksQ0FBQztTQUNmO0FBQ0QsWUFBSSxFQUFFLFVBQVMsUUFBUSxFQUFFO0FBQ3JCLGNBQUksQ0FBQyxZQUFZLEdBQUcsUUFBUSxDQUFDO0FBQzdCLGlCQUFPLElBQUksQ0FBQztTQUNmO0FBQ0QsY0FBTSxFQUFFLFVBQVMsUUFBUSxFQUFFO0FBQ3ZCLGNBQUksQ0FBQyxjQUFjLEdBQUcsUUFBUSxDQUFDO0FBQy9CLGlCQUFPLElBQUksQ0FBQztTQUNmO0FBQ0Qsa0JBQVUsRUFBRSxVQUFTLE9BQU8sRUFBRTtBQUMxQixlQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sRUFBRTtBQUNyQixnQkFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztXQUM5RDtTQUNKO09BQ0osQ0FBQztBQUNGLGFBQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUMzQjtHQUNGLENBQUM7O0FBRUYsR0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7O21CQUlkLENBQUMiLCJmaWxlIjoicmVib3VuZC5ydW50aW1lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gUHJvcGVydHkgQ29tcGlsZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IHRva2VuaXplciBmcm9tIFwicHJvcGVydHktY29tcGlsZXIvdG9rZW5pemVyXCI7XG5cbnZhciBjb21wdXRlZFByb3BlcnRpZXMgPSBbXTtcblxuLy8gVE9ETzogTWFrZSB0aGlzIGZhcnJycnJyIG1vcmUgcm9idXN0Li4udmVyeSBtaW5pbWFsIHJpZ2h0IG5vd1xuXG5mdW5jdGlvbiBjb21waWxlKHByb3AsIG5hbWUpe1xuICB2YXIgb3V0cHV0ID0ge307XG5cbiAgaWYocHJvcC5fX3BhcmFtcykgcmV0dXJuIHByb3AuX19wYXJhbXM7XG5cbiAgdmFyIHN0ciA9IHByb3AudG9TdHJpbmcoKSwgLy8ucmVwbGFjZSgvKD86XFwvXFwqKD86W1xcc1xcU10qPylcXCpcXC8pfCg/OihbXFxzO10pK1xcL1xcLyg/Oi4qKSQpL2dtLCAnJDEnKSwgLy8gU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGZ1bmN0aW9uIHNhbnMgY29tbWVudHNcbiAgICAgIG5leHRUb2tlbiA9IHRva2VuaXplci50b2tlbml6ZShzdHIpLFxuICAgICAgdG9rZW5zID0gW10sXG4gICAgICB0b2tlbixcbiAgICAgIGZpbmlzaGVkUGF0aHMgPSBbXSxcbiAgICAgIG5hbWVkUGF0aHMgPSB7fSxcbiAgICAgIG9wY29kZXMgPSBbXSxcbiAgICAgIG5hbWVkID0gZmFsc2UsXG4gICAgICBsaXN0ZW5pbmcgPSAwLFxuICAgICAgaW5TdWJDb21wb25lbnQgPSAwLFxuICAgICAgc3ViQ29tcG9uZW50ID0gW10sXG4gICAgICByb290LFxuICAgICAgcGF0aHMgPSBbXSxcbiAgICAgIHBhdGgsXG4gICAgICB0bXBQYXRoLFxuICAgICAgYXR0cnMgPSBbXSxcbiAgICAgIHdvcmtpbmdwYXRoID0gW10sXG4gICAgICB0ZXJtaW5hdG9ycyA9IFsnOycsJywnLCc9PScsJz4nLCc8JywnPj0nLCc8PScsJz49PScsJzw9PScsJyE9JywnIT09JywgJz09PScsICcmJicsICd8fCcsICcrJywgJy0nLCAnLycsICcqJ107XG4gIGRve1xuXG4gICAgdG9rZW4gPSBuZXh0VG9rZW4oKTtcbiAgICBjb25zb2xlLmxvZyh0b2tlbi52YWx1ZSwgdG9rZW4udHlwZS50eXBlKTtcblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAndGhpcycpe1xuICAgICAgbGlzdGVuaW5nKys7XG4gICAgICB3b3JraW5ncGF0aCA9IFtdO1xuICAgIH1cblxuICAgIC8vIFRPRE86IGhhbmRsZSBnZXRzIG9uIGNvbGxlY3Rpb25zXG4gICAgaWYodG9rZW4udmFsdWUgPT09ICdnZXQnKXtcbiAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIHdoaWxlKF8uaXNVbmRlZmluZWQocGF0aC52YWx1ZSkpe1xuICAgICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlcGxhY2UgYW55IGFjY2VzcyB0byBhIGNvbGxlY3Rpb24gd2l0aCB0aGUgZ2VuZXJpYyBAZWFjaCBwbGFjZWhvbGRlciBhbmQgcHVzaCBkZXBlbmRhbmN5XG4gICAgICB3b3JraW5ncGF0aC5wdXNoKHBhdGgudmFsdWUucmVwbGFjZSgvXFxbLitcXF0vZywgXCIuQGVhY2hcIikucmVwbGFjZSgvXlxcLi8sICcnKSk7XG4gICAgfVxuXG4gICAgaWYodG9rZW4udmFsdWUgPT09ICdwbHVjaycpe1xuICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgd2hpbGUoXy5pc1VuZGVmaW5lZChwYXRoLnZhbHVlKSl7XG4gICAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIH1cblxuICAgICAgd29ya2luZ3BhdGgucHVzaCgnQGVhY2guJyArIHBhdGgudmFsdWUpO1xuICAgIH1cblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAnc2xpY2UnIHx8IHRva2VuLnZhbHVlID09PSAnY2xvbmUnIHx8IHRva2VuLnZhbHVlID09PSAnZmlsdGVyJyl7XG4gICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICBpZihwYXRoLnR5cGUudHlwZSA9PT0gJygnKSB3b3JraW5ncGF0aC5wdXNoKCdAZWFjaCcpO1xuICAgIH1cblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAnYXQnKXtcblxuICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgd2hpbGUoXy5pc1VuZGVmaW5lZChwYXRoLnZhbHVlKSl7XG4gICAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIH1cbiAgICAgIC8vIHdvcmtpbmdwYXRoW3dvcmtpbmdwYXRoLmxlbmd0aCAtMV0gPSB3b3JraW5ncGF0aFt3b3JraW5ncGF0aC5sZW5ndGggLTFdICsgJ1snICsgcGF0aC52YWx1ZSArICddJztcbiAgICAgIC8vIHdvcmtpbmdwYXRoLnB1c2goJ1snICsgcGF0aC52YWx1ZSArICddJyk7XG4gICAgICB3b3JraW5ncGF0aC5wdXNoKCdAZWFjaCcpO1xuXG4gICAgfVxuXG4gICAgaWYodG9rZW4udmFsdWUgPT09ICd3aGVyZScgfHwgdG9rZW4udmFsdWUgPT09ICdmaW5kV2hlcmUnKXtcbiAgICAgIHdvcmtpbmdwYXRoLnB1c2goJ0BlYWNoJyk7XG4gICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICBhdHRycyA9IFtdO1xuICAgICAgdmFyIGl0ciA9IDA7XG4gICAgICB3aGlsZShwYXRoLnR5cGUudHlwZSAhPT0gJyknKXtcbiAgICAgICAgaWYocGF0aC52YWx1ZSl7XG4gICAgICAgICAgaWYoaXRyJTIgPT09IDApe1xuICAgICAgICAgICAgYXR0cnMucHVzaChwYXRoLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaXRyKys7XG4gICAgICAgIH1cbiAgICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgfVxuICAgICAgd29ya2luZ3BhdGgucHVzaChhdHRycyk7XG4gICAgfVxuXG4gICAgaWYobGlzdGVuaW5nICYmIChfLmluZGV4T2YodGVybWluYXRvcnMsIHRva2VuLnR5cGUudHlwZSkgPiAtMSB8fCBfLmluZGV4T2YodGVybWluYXRvcnMsIHRva2VuLnZhbHVlKSA+IC0xKSl7XG4gICAgICB3b3JraW5ncGF0aCA9IF8ucmVkdWNlKHdvcmtpbmdwYXRoLCBmdW5jdGlvbihtZW1vLCBwYXRocyl7XG4gICAgICAgIHZhciBuZXdNZW1vID0gW107XG4gICAgICAgIHBhdGhzID0gKCFfLmlzQXJyYXkocGF0aHMpKSA/IFtwYXRoc10gOiBwYXRocztcbiAgICAgICAgXy5lYWNoKHBhdGhzLCBmdW5jdGlvbihwYXRoKXtcbiAgICAgICAgICBfLmVhY2gobWVtbywgZnVuY3Rpb24obWVtKXtcbiAgICAgICAgICAgIG5ld01lbW8ucHVzaChfLmNvbXBhY3QoW21lbSwgcGF0aF0pLmpvaW4oJy4nKS5yZXBsYWNlKCcuWycsICdbJykpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ld01lbW87XG4gICAgICB9LCBbJyddKTtcbiAgICAgIGZpbmlzaGVkUGF0aHMgPSBfLmNvbXBhY3QoXy51bmlvbihmaW5pc2hlZFBhdGhzLCB3b3JraW5ncGF0aCkpO1xuICAgICAgd29ya2luZ3BhdGggPSBbXTtcbiAgICAgIGxpc3RlbmluZy0tO1xuICAgIH1cblxuICB9IHdoaWxlKHRva2VuLnN0YXJ0ICE9PSB0b2tlbi5lbmQpO1xuXG4gIGNvbnNvbGUubG9nKCdDT01QVVRFRCBQUk9QRVJUWScsIG5hbWUsICdyZWdpc3RlcmVkIHdpdGggdGhlc2UgZGVwZW5kYW5jeSBwYXRoczonLCBmaW5pc2hlZFBhdGhzKTtcblxuICAvLyBSZXR1cm4gdGhlIGRlcGVuZGFuY2llcyBsaXN0XG4gIHJldHVybiBwcm9wLl9fcGFyYW1zID0gZmluaXNoZWRQYXRocztcblxufVxuXG5leHBvcnQgZGVmYXVsdCB7IGNvbXBpbGU6IGNvbXBpbGUgfTsiLCIvLyBSZWJvdW5kIENvbXBpbGVyXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCB7IGNvbXBpbGUgYXMgaHRtbGJhcnNDb21waWxlLCBjb21waWxlU3BlYyBhcyBodG1sYmFyc0NvbXBpbGVTcGVjIH0gZnJvbSBcImh0bWxiYXJzLWNvbXBpbGVyL2NvbXBpbGVyXCI7XG5pbXBvcnQgeyBtZXJnZSB9IGZyb20gXCJodG1sYmFycy11dGlsL29iamVjdC11dGlsc1wiO1xuaW1wb3J0IERPTUhlbHBlciBmcm9tIFwibW9ycGgvZG9tLWhlbHBlclwiO1xuaW1wb3J0IGhlbHBlcnMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hlbHBlcnNcIjtcbmltcG9ydCBob29rcyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaG9va3NcIjtcblxuZnVuY3Rpb24gY29tcGlsZShzdHJpbmcsIG9wdGlvbnMpe1xuICAvLyBFbnN1cmUgd2UgaGF2ZSBhIHdlbGwtZm9ybWVkIG9iamVjdCBhcyB2YXIgb3B0aW9uc1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgb3B0aW9ucy5oZWxwZXJzID0gb3B0aW9ucy5oZWxwZXJzIHx8IHt9O1xuICBvcHRpb25zLmhvb2tzID0gb3B0aW9ucy5ob29rcyB8fCB7fTtcblxuICAvLyBNZXJnZSBvdXIgZGVmYXVsdCBoZWxwZXJzIHdpdGggdXNlciBwcm92aWRlZCBoZWxwZXJzXG4gIG9wdGlvbnMuaGVscGVycyA9IG1lcmdlKGhlbHBlcnMsIG9wdGlvbnMuaGVscGVycyk7XG4gIG9wdGlvbnMuaG9va3MgPSBtZXJnZShob29rcywgb3B0aW9ucy5ob29rcyk7XG5cbiAgLy8gQ29tcGlsZSBvdXIgdGVtcGxhdGUgZnVuY3Rpb25cbiAgdmFyIGZ1bmMgPSBodG1sYmFyc0NvbXBpbGUoc3RyaW5nLCB7XG4gICAgaGVscGVyczogb3B0aW9ucy5oZWxwZXJzLFxuICAgIGhvb2tzOiBvcHRpb25zLmhvb2tzXG4gIH0pO1xuXG4gIGZ1bmMuX3JlbmRlciA9IGZ1bmMucmVuZGVyO1xuXG4gIC8vIFJldHVybiBhIHdyYXBwZXIgZnVuY3Rpb24gdGhhdCB3aWxsIG1lcmdlIHVzZXIgcHJvdmlkZWQgaGVscGVycyB3aXRoIG91ciBkZWZhdWx0c1xuICBmdW5jLnJlbmRlciA9IGZ1bmN0aW9uKGRhdGEsIGVudiwgY29udGV4dCl7XG4gICAgLy8gRW5zdXJlIHdlIGhhdmUgYSB3ZWxsLWZvcm1lZCBvYmplY3QgYXMgdmFyIG9wdGlvbnNcbiAgICBlbnYgPSBlbnYgfHwge307XG4gICAgZW52LmhlbHBlcnMgPSBlbnYuaGVscGVycyB8fCB7fTtcbiAgICBlbnYuaG9va3MgPSBlbnYuaG9va3MgfHwge307XG4gICAgZW52LmRvbSA9IGVudi5kb20gfHwgbmV3IERPTUhlbHBlcigpO1xuXG4gICAgLy8gTWVyZ2Ugb3VyIGRlZmF1bHQgaGVscGVycyBhbmQgaG9va3Mgd2l0aCB1c2VyIHByb3ZpZGVkIGhlbHBlcnNcbiAgICBlbnYuaGVscGVycyA9IG1lcmdlKGhlbHBlcnMsIGVudi5oZWxwZXJzKTtcbiAgICBlbnYuaG9va3MgPSBtZXJnZShob29rcywgZW52Lmhvb2tzKTtcblxuICAgIC8vIFNldCBhIGRlZmF1bHQgY29udGV4dCBpZiBpdCBkb2Vzbid0IGV4aXN0XG4gICAgY29udGV4dCA9IGNvbnRleHQgfHwgZG9jdW1lbnQuYm9keTtcblxuICAgIC8vIENhbGwgb3VyIGZ1bmMgd2l0aCBtZXJnZWQgaGVscGVycyBhbmQgaG9va3NcbiAgICByZXR1cm4gZnVuYy5fcmVuZGVyKGRhdGEsIGVudiwgY29udGV4dCk7XG4gIH07XG5cbiAgaGVscGVycy5yZWdpc3RlclBhcnRpYWwoIG9wdGlvbnMubmFtZSwgZnVuYyk7XG5cbiAgcmV0dXJuIGZ1bmM7XG5cbn1cblxuZXhwb3J0IHsgY29tcGlsZSB9O1xuIiwiLy8gUmVib3VuZCBDb21wb25lbnRcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IERPTUhlbHBlciBmcm9tIFwibW9ycGgvZG9tLWhlbHBlclwiO1xuaW1wb3J0IGhvb2tzIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9ob29rc1wiO1xuaW1wb3J0IGhlbHBlcnMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hlbHBlcnNcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuaW1wb3J0IHsgTW9kZWwgfSBmcm9tIFwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YVwiO1xuXG4vLyBJZiBCYWNrYm9uZSBoYXNuJ3QgYmVlbiBzdGFydGVkIHlldCwgdGhyb3cgZXJyb3JcbmlmKCF3aW5kb3cuQmFja2JvbmUpIHRocm93IFwiQmFja2JvbmUgbXVzdCBiZSBvbiB0aGUgcGFnZSBmb3IgUmVib3VuZCB0byBsb2FkLlwiO1xuXG4vLyBSZXR1cm5zIHRydWUgaWYgYHN0cmAgc3RhcnRzIHdpdGggYHRlc3RgXG5mdW5jdGlvbiBzdGFydHNXaXRoKHN0ciwgdGVzdCl7XG4gIGlmKHN0ciA9PT0gdGVzdCkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBzdHIuc3Vic3RyaW5nKDAsIHRlc3QubGVuZ3RoKzEpID09PSB0ZXN0KycuJztcbn1cblxuZnVuY3Rpb24gcmVuZGVyQ2FsbGJhY2soKXtcbiAgdmFyIGkgPSAwLCBsZW4gPSB0aGlzLl90b1JlbmRlci5sZW5ndGg7XG4gIGRlbGV0ZSB0aGlzLl9yZW5kZXJUaW1lb3V0O1xuICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgdGhpcy5fdG9SZW5kZXIuc2hpZnQoKS5ub3RpZnkoKTtcbiAgfVxuICB0aGlzLl90b1JlbmRlci5hZGRlZCA9IHt9O1xufVxuXG52YXIgZW52ID0ge1xuICBoZWxwZXJzOiBoZWxwZXJzLmhlbHBlcnMsXG4gIGhvb2tzOiBob29rc1xufTtcblxuZW52Lmh5ZHJhdGUgPSBmdW5jdGlvbiBoeWRyYXRlKHNwZWMsIG9wdGlvbnMpe1xuICAvLyBSZXR1cm4gYSB3cmFwcGVyIGZ1bmN0aW9uIHRoYXQgd2lsbCBtZXJnZSB1c2VyIHByb3ZpZGVkIGhlbHBlcnMgYW5kIGhvb2tzIHdpdGggb3VyIGRlZmF1bHRzXG4gIHJldHVybiBmdW5jdGlvbihkYXRhLCBvcHRpb25zKXtcbiAgICAvLyBFbnN1cmUgd2UgaGF2ZSBhIHdlbGwtZm9ybWVkIG9iamVjdCBhcyB2YXIgb3B0aW9uc1xuICAgIHZhciBlbnYgPSBvcHRpb25zIHx8IHt9LFxuICAgICAgICBjb250ZXh0RWxlbWVudCA9IGRhdGEuZWwgfHwgZG9jdW1lbnQuYm9keTtcbiAgICBlbnYuaGVscGVycyA9IGVudi5oZWxwZXJzIHx8IHt9O1xuICAgIGVudi5ob29rcyA9IGVudi5ob29rcyB8fCB7fTtcbiAgICBlbnYuZG9tID0gZW52LmRvbSB8fCBuZXcgRE9NSGVscGVyKCk7XG5cbiAgICAvLyBNZXJnZSBvdXIgZGVmYXVsdCBoZWxwZXJzIGFuZCBob29rcyB3aXRoIHVzZXIgcHJvdmlkZWQgaGVscGVyc1xuICAgIGVudi5oZWxwZXJzID0gXy5kZWZhdWx0cyhlbnYuaGVscGVycywgaGVscGVycy5oZWxwZXJzKTtcbiAgICBlbnYuaG9va3MgPSBfLmRlZmF1bHRzKGVudi5ob29rcywgaG9va3MpO1xuXG4gICAgLy8gQ2FsbCBvdXIgZnVuYyB3aXRoIG1lcmdlZCBoZWxwZXJzIGFuZCBob29rc1xuICAgIHJldHVybiBzcGVjLnJlbmRlcihkYXRhLCBlbnYsIGNvbnRleHRFbGVtZW50KTtcbiAgfTtcbn07XG5cbi8vIE5ldyBCYWNrYm9uZSBDb21wb25lbnRcbnZhciBDb21wb25lbnQgPSBNb2RlbC5leHRlbmQoe1xuXG4gIGlzQ29tcG9uZW50OiB0cnVlLFxuXG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihvcHRpb25zKXtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBfLmJpbmRBbGwodGhpcywgJ19fY2FsbE9uQ29tcG9uZW50Jyk7XG4gICAgdGhpcy5jaWQgPSBfLnVuaXF1ZUlkKCdjb21wb25lbnQnKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLmNoYW5nZWQgPSB7fTtcbiAgICB0aGlzLmhlbHBlcnMgPSB7fTtcbiAgICB0aGlzLl9fcGFyZW50X18gPSB0aGlzLl9fcm9vdF9fID0gdGhpcztcbiAgICB0aGlzLmxpc3RlblRvKHRoaXMsICdhbGwnLCB0aGlzLl9vbkNoYW5nZSk7XG5cbiAgICAvLyBUYWtlIG91ciBwYXJzZWQgZGF0YSBhbmQgYWRkIGl0IHRvIG91ciBiYWNrYm9uZSBkYXRhIHN0cnVjdHVyZS4gRG9lcyBhIGRlZXAgZGVmYXVsdHMgc2V0LlxuICAgIC8vIEluIHRoZSBtb2RlbCwgcHJpbWF0aXZlcyAoYXJyYXlzLCBvYmplY3RzLCBldGMpIGFyZSBjb252ZXJ0ZWQgdG8gQmFja2JvbmUgT2JqZWN0c1xuICAgIC8vIEZ1bmN0aW9ucyBhcmUgY29tcGlsZWQgdG8gZmluZCB0aGVpciBkZXBlbmRhbmNpZXMgYW5kIGFkZGVkIGFzIGNvbXB1dGVkIHByb3BlcnRpZXNcbiAgICAvLyBTZXQgb3VyIGNvbXBvbmVudCdzIGNvbnRleHQgd2l0aCB0aGUgcGFzc2VkIGRhdGEgbWVyZ2VkIHdpdGggdGhlIGNvbXBvbmVudCdzIGRlZmF1bHRzXG4gICAgdGhpcy5zZXQoKHRoaXMuZGVmYXVsdHMgfHwge30pLCB7ZGVmYXVsdHM6IHRydWV9KTtcbiAgICB0aGlzLnNldCgob3B0aW9ucy5kYXRhIHx8IHt9KSk7XG5cbiAgICAvLyBDYWxsIG9uIGNvbXBvbmVudCBpcyB1c2VkIGJ5IHRoZSB7e29ufX0gaGVscGVyIHRvIGNhbGwgYWxsIGV2ZW50IGNhbGxiYWNrcyBpbiB0aGUgc2NvcGUgb2YgdGhlIGNvbXBvbmVudFxuICAgIHRoaXMuaGVscGVycy5fX2NhbGxPbkNvbXBvbmVudCA9IHRoaXMuX19jYWxsT25Db21wb25lbnQ7XG5cblxuICAgIC8vIEdldCBhbnkgYWRkaXRpb25hbCByb3V0ZXMgcGFzc2VkIGluIGZyb20gb3B0aW9uc1xuICAgIHRoaXMucm91dGVzID0gIF8uZGVmYXVsdHMoKG9wdGlvbnMucm91dGVzIHx8IHt9KSwgdGhpcy5yb3V0ZXMpO1xuICAgIC8vIEVuc3VyZSB0aGF0IGFsbCByb3V0ZSBmdW5jdGlvbnMgZXhpc3RcbiAgICBfLmVhY2godGhpcy5yb3V0ZXMsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIHJvdXRlcyl7XG4gICAgICAgIGlmKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpeyB0aHJvdygnRnVuY3Rpb24gbmFtZSBwYXNzZWQgdG8gcm91dGVzIGluICAnICsgdGhpcy5fX25hbWUgKyAnIGNvbXBvbmVudCBtdXN0IGJlIGEgc3RyaW5nIScpOyB9XG4gICAgICAgIGlmKCF0aGlzW3ZhbHVlXSl7IHRocm93KCdDYWxsYmFjayBmdW5jdGlvbiAnK3ZhbHVlKycgZG9lcyBub3QgZXhpc3Qgb24gdGhlICAnICsgdGhpcy5fX25hbWUgKyAnIGNvbXBvbmVudCEnKTsgfVxuICAgIH0sIHRoaXMpO1xuXG5cbiAgICAvLyBTZXQgb3VyIG91dGxldCBhbmQgdGVtcGxhdGUgaWYgd2UgaGF2ZSBvbmVcbiAgICB0aGlzLmVsID0gb3B0aW9ucy5vdXRsZXQgfHwgdW5kZWZpbmVkO1xuICAgIHRoaXMuJGVsID0gKF8uaXNVbmRlZmluZWQod2luZG93LkJhY2tib25lLiQpKSA/IGZhbHNlIDogd2luZG93LkJhY2tib25lLiQodGhpcy5lbCk7XG5cbiAgICBpZihfLmlzRnVuY3Rpb24odGhpcy5jcmVhdGVkQ2FsbGJhY2spKXtcbiAgICAgIHRoaXMuY3JlYXRlZENhbGxiYWNrLmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gVGFrZSBvdXIgcHJlY29tcGlsZWQgdGVtcGxhdGUgYW5kIGh5ZHJhdGVzIGl0LiBXaGVuIFJlYm91bmQgQ29tcGlsZXIgaXMgaW5jbHVkZWQsIGNhbiBiZSBhIGhhbmRsZWJhcnMgdGVtcGxhdGUgc3RyaW5nLlxuICAgIC8vIFRPRE86IENoZWNrIGlmIHRlbXBsYXRlIGlzIGEgc3RyaW5nLCBhbmQgaWYgdGhlIGNvbXBpbGVyIGV4aXN0cyBvbiB0aGUgcGFnZSwgYW5kIGNvbXBpbGUgaWYgbmVlZGVkXG4gICAgaWYoIW9wdGlvbnMudGVtcGxhdGUgJiYgIXRoaXMudGVtcGxhdGUpeyB0aHJvdygnVGVtcGxhdGUgbXVzdCBwcm92aWRlZCBmb3IgJyArIHRoaXMuX19uYW1lICsgJyBjb21wb25lbnQhJyk7IH1cbiAgICB0aGlzLnRlbXBsYXRlID0gb3B0aW9ucy50ZW1wbGF0ZSB8fCB0aGlzLnRlbXBsYXRlO1xuICAgIHRoaXMudGVtcGxhdGUgPSAodHlwZW9mIHRoaXMudGVtcGxhdGUgPT09ICdvYmplY3QnKSA/IGVudi5oeWRyYXRlKHRoaXMudGVtcGxhdGUpIDogdGhpcy50ZW1wbGF0ZTtcblxuXG4gICAgLy8gUmVuZGVyIG91ciBkb20gYW5kIHBsYWNlIHRoZSBkb20gaW4gb3VyIGN1c3RvbSBlbGVtZW50XG4gICAgdGhpcy5lbC5hcHBlbmRDaGlsZCh0aGlzLnRlbXBsYXRlKHRoaXMsIHtoZWxwZXJzOiB0aGlzLmhlbHBlcnN9LCB0aGlzLmVsKSk7XG5cbiAgICB0aGlzLmluaXRpYWxpemUoKTtcblxuICB9LFxuXG4gICQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgaWYoIXRoaXMuJGVsKXtcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdObyBET00gbWFuaXB1bGF0aW9uIGxpYnJhcnkgb24gdGhlIHBhZ2UhJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiRlbC5maW5kKHNlbGVjdG9yKTtcbiAgfSxcblxuICAvLyBUcmlnZ2VyIGFsbCBldmVudHMgb24gYm90aCB0aGUgY29tcG9uZW50IGFuZCB0aGUgZWxlbWVudFxuICB0cmlnZ2VyOiBmdW5jdGlvbihldmVudE5hbWUpe1xuICAgIGlmKHRoaXMuZWwpe1xuICAgICAgJCh0aGlzLmVsKS50cmlnZ2VyKGV2ZW50TmFtZSwgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLnRyaWdnZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcblxuICBfX2NhbGxPbkNvbXBvbmVudDogZnVuY3Rpb24obmFtZSwgZXZlbnQpe1xuICAgIGlmKCFfLmlzRnVuY3Rpb24odGhpc1tuYW1lXSkpeyB0aHJvdyBcIkVSUk9SOiBObyBtZXRob2QgbmFtZWQgXCIgKyBuYW1lICsgXCIgb24gY29tcG9uZW50IFwiICsgdGhpcy5fX25hbWUgKyBcIiFcIjsgfVxuICAgIHJldHVybiB0aGlzW25hbWVdLmNhbGwodGhpcywgZXZlbnQpO1xuICB9LFxuXG4gIF9vbkF0dHJpYnV0ZUNoYW5nZTogZnVuY3Rpb24oYXR0ck5hbWUsIG9sZFZhbCwgbmV3VmFsKXtcbiAgICAvLyBDb21tZW50ZWQgb3V0IGJlY2F1c2UgdHJhY2tpbmcgYXR0cmlidXRlIGNoYW5nZXMgYW5kIG1ha2luZyBzdXJlIHRoZXkgZG9udCBpbmZpbml0ZSBsb29wIGlzIGhhcmQuXG4gICAgLy8gVE9ETzogTWFrZSB3b3JrLlxuICAgIC8vIHRyeXsgbmV3VmFsID0gSlNPTi5wYXJzZShuZXdWYWwpOyB9IGNhdGNoIChlKXsgbmV3VmFsID0gbmV3VmFsOyB9XG4gICAgLy9cbiAgICAvLyAvLyBkYXRhIGF0dHJpYnV0ZXMgc2hvdWxkIGJlIHJlZmVyYW5jZWQgYnkgdGhlaXIgY2FtZWwgY2FzZSBuYW1lXG4gICAgLy8gYXR0ck5hbWUgPSBhdHRyTmFtZS5yZXBsYWNlKC9eZGF0YS0vZywgXCJcIikucmVwbGFjZSgvLShbYS16XSkvZywgZnVuY3Rpb24gKGcpIHsgcmV0dXJuIGdbMV0udG9VcHBlckNhc2UoKTsgfSk7XG4gICAgLy9cbiAgICAvLyBvbGRWYWwgPSB0aGlzLmdldChhdHRyTmFtZSk7XG4gICAgLy9cbiAgICAvLyBpZihuZXdWYWwgPT09IG51bGwpeyB0aGlzLnVuc2V0KGF0dHJOYW1lKTsgfVxuICAgIC8vXG4gICAgLy8gLy8gSWYgb2xkVmFsIGlzIGEgbnVtYmVyLCBhbmQgbmV3VmFsIGlzIG9ubHkgbnVtZXJpY2FsLCBwcmVzZXJ2ZSB0eXBlXG4gICAgLy8gaWYoXy5pc051bWJlcihvbGRWYWwpICYmIF8uaXNTdHJpbmcobmV3VmFsKSAmJiBuZXdWYWwubWF0Y2goL15bMC05XSokL2kpKXtcbiAgICAvLyAgIG5ld1ZhbCA9IHBhcnNlSW50KG5ld1ZhbCk7XG4gICAgLy8gfVxuICAgIC8vXG4gICAgLy8gZWxzZXsgdGhpcy5zZXQoYXR0ck5hbWUsIG5ld1ZhbCwge3F1aWV0OiB0cnVlfSk7IH1cbiAgfSxcblxuXG4gIF9vbkNoYW5nZTogZnVuY3Rpb24odHlwZSwgbW9kZWwsIGNvbGxlY3Rpb24sIG9wdGlvbnMpe1xuICAgIHZhciBzaG9ydGNpcmN1aXQgPSB7IGNoYW5nZTogMSwgc29ydDogMSwgcmVxdWVzdDogMSwgZGVzdHJveTogMSwgc3luYzogMSwgZXJyb3I6IDEsIGludmFsaWQ6IDEsIHJvdXRlOiAxLCBkaXJ0eTogMSB9O1xuICAgIGlmKCBzaG9ydGNpcmN1aXRbdHlwZV0gKSByZXR1cm47XG5cbiAgICB2YXIgZGF0YSwgY2hhbmdlZDtcbiAgICBtb2RlbCB8fCAobW9kZWwgPSB7fSk7XG4gICAgY29sbGVjdGlvbiB8fCAoY29sbGVjdGlvbiA9IHt9KTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgICFjb2xsZWN0aW9uLmlzRGF0YSAmJiAob3B0aW9ucyA9IGNvbGxlY3Rpb24pICYmIChjb2xsZWN0aW9uID0gbW9kZWwpO1xuICAgIHRoaXMuX3RvUmVuZGVyIHx8ICh0aGlzLl90b1JlbmRlciA9IFtdKTtcblxuICAgIGlmKCAodHlwZSA9PT0gJ3Jlc2V0JyAmJiBvcHRpb25zLnByZXZpb3VzQXR0cmlidXRlcykgfHwgdHlwZS5pbmRleE9mKCdjaGFuZ2U6JykgIT09IC0xKXtcbiAgICAgIGRhdGEgPSBtb2RlbDtcbiAgICAgIGNoYW5nZWQgPSBtb2RlbC5jaGFuZ2VkQXR0cmlidXRlcygpO1xuICAgIH1cbiAgICBlbHNlIGlmKHR5cGUgPT09ICdhZGQnIHx8IHR5cGUgPT09ICdyZW1vdmUnIHx8ICh0eXBlID09PSAncmVzZXQnICYmIG9wdGlvbnMucHJldmlvdXNNb2RlbHMpKXtcbiAgICAgIGRhdGEgPSBjb2xsZWN0aW9uO1xuICAgICAgY2hhbmdlZCA9IHt9O1xuICAgICAgY2hhbmdlZFtkYXRhLl9fcGF0aCgpXSA9IGRhdGE7XG4gICAgfVxuXG4gICAgaWYoIWRhdGEgfHwgIWNoYW5nZWQpIHJldHVybjtcblxuICAgIHZhciBwdXNoID0gZnVuY3Rpb24oYXJyKXtcbiAgICAgIHZhciBpLCBsZW4gPSBhcnIubGVuZ3RoO1xuICAgICAgdGhpcy5hZGRlZCB8fCAodGhpcy5hZGRlZCA9IHt9KTtcbiAgICAgIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICAgICAgaWYodGhpcy5hZGRlZFthcnJbaV0uY2lkXSkgY29udGludWU7XG4gICAgICAgIHRoaXMuYWRkZWRbYXJyW2ldLmNpZF0gPSAxO1xuICAgICAgICB0aGlzLnB1c2goYXJyW2ldKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBjb250ZXh0ID0gdGhpcztcbiAgICB2YXIgYmFzZVBhdGggPSBkYXRhLl9fcGF0aCgpO1xuICAgIHZhciBwYXJ0cyA9ICQuc3BsaXRQYXRoKGJhc2VQYXRoKTtcbiAgICB2YXIga2V5LCBvYnNQYXRoLCBwYXRoLCBvYnNlcnZlcnM7XG5cbiAgICAvLyBGb3IgZWFjaCBjaGFuZ2VkIGtleSwgd2FsayBkb3duIHRoZSBkYXRhIHRyZWUgZnJvbSB0aGUgcm9vdCB0byB0aGUgZGF0YVxuICAgIC8vIGVsZW1lbnQgdGhhdCB0cmlnZ2VyZWQgdGhlIGV2ZW50IGFuZCBhZGQgYWxsIHJlbGV2ZW50IGNhbGxiYWNrcyB0byB0aGlzXG4gICAgLy8gb2JqZWN0J3MgX3RvUmVuZGVyIHF1ZXVlLlxuICAgIGRve1xuICAgICAgZm9yKGtleSBpbiBjaGFuZ2VkKXtcbiAgICAgICAgcGF0aCA9IChiYXNlUGF0aCArIChiYXNlUGF0aCAmJiAnLicpICsga2V5KS5yZXBsYWNlKGNvbnRleHQuX19wYXRoKCksICcnKS5yZXBsYWNlKC9cXFtbXlxcXV0rXFxdL2csIFwiLkBlYWNoXCIpLnJlcGxhY2UoL15cXC4vLCAnJyk7XG4gICAgICAgIGZvcihvYnNQYXRoIGluIGNvbnRleHQuX19vYnNlcnZlcnMpe1xuICAgICAgICAgIG9ic2VydmVycyA9IGNvbnRleHQuX19vYnNlcnZlcnNbb2JzUGF0aF07XG4gICAgICAgICAgaWYoc3RhcnRzV2l0aChvYnNQYXRoLCBwYXRoKSB8fCBzdGFydHNXaXRoKHBhdGgsIG9ic1BhdGgpKXtcbiAgICAgICAgICAgIC8vIElmIHRoaXMgaXMgYSBjb2xsZWN0aW9uIGV2ZW50LCB0cmlnZ2VyIGV2ZXJ5dGhpbmcsIG90aGVyd2lzZSBvbmx5IHRyaWdnZXIgcHJvcGVydHkgY2hhbmdlIGNhbGxiYWNrc1xuICAgICAgICAgICAgaWYoZGF0YS5pc0NvbGxlY3Rpb24pIHB1c2guY2FsbCh0aGlzLl90b1JlbmRlciwgb2JzZXJ2ZXJzLmNvbGxlY3Rpb24pO1xuICAgICAgICAgICAgcHVzaC5jYWxsKHRoaXMuX3RvUmVuZGVyLCBvYnNlcnZlcnMubW9kZWwpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gd2hpbGUoY29udGV4dCAhPT0gZGF0YSAmJiAoY29udGV4dCA9IGNvbnRleHQuZ2V0KHBhcnRzLnNoaWZ0KCkpKSlcblxuICAgIC8vIFF1ZXVlIG91ciByZW5kZXIgY2FsbGJhY2sgdG8gYmUgY2FsbGVkIGFmdGVyIHRoZSBjdXJyZW50IGNhbGwgc3RhY2sgaGFzIGJlZW4gZXhoYXVzdGVkXG4gICAgd2luZG93LmNsZWFyVGltZW91dCh0aGlzLl9yZW5kZXJUaW1lb3V0KTtcbiAgICB0aGlzLl9yZW5kZXJUaW1lb3V0ID0gd2luZG93LnNldFRpbWVvdXQoXy5iaW5kKHJlbmRlckNhbGxiYWNrLCB0aGlzKSwgMCk7XG4gIH1cblxufSk7XG5cbkNvbXBvbmVudC5leHRlbmQ9IGZ1bmN0aW9uKHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gIHZhciBwYXJlbnQgPSB0aGlzLFxuICAgICAgY2hpbGQsXG4gICAgICByZXNlcnZlZE1ldGhvZHMgPSB7XG4gICAgICAgICd0cmlnZ2VyJzoxLCAgICAnY29uc3RydWN0b3InOjEsICdnZXQnOjEsICAgICAgICAgICAgICAgJ3NldCc6MSwgICAgICAgICAgICAgJ2hhcyc6MSxcbiAgICAgICAgJ2V4dGVuZCc6MSwgICAgICdlc2NhcGUnOjEsICAgICAgJ3Vuc2V0JzoxLCAgICAgICAgICAgICAnY2xlYXInOjEsICAgICAgICAgICAnY2lkJzoxLFxuICAgICAgICAnYXR0cmlidXRlcyc6MSwgJ2NoYW5nZWQnOjEsICAgICAndG9KU09OJzoxLCAgICAgICAgICAgICd2YWxpZGF0aW9uRXJyb3InOjEsICdpc1ZhbGlkJzoxLFxuICAgICAgICAnaXNOZXcnOjEsICAgICAgJ2hhc0NoYW5nZWQnOjEsICAnY2hhbmdlZEF0dHJpYnV0ZXMnOjEsICdwcmV2aW91cyc6MSwgICAgICAgICdwcmV2aW91c0F0dHJpYnV0ZXMnOjFcbiAgICAgIH0sXG4gICAgICBjb25maWdQcm9wZXJ0aWVzID0ge1xuICAgICAgICAncm91dGVzJzoxLCAgICAgJ3RlbXBsYXRlJzoxLCAgICAnZGVmYXVsdHMnOjEsICdvdXRsZXQnOjEsICAgICAgICAgICd1cmwnOjEsXG4gICAgICAgICd1cmxSb290JzoxLCAgICAnaWRBdHRyaWJ1dGUnOjEsICdpZCc6MSwgICAgICAgJ2NyZWF0ZWRDYWxsYmFjayc6MSwgJ2F0dGFjaGVkQ2FsbGJhY2snOjEsXG4gICAgICAgICdkZXRhY2hlZENhbGxiYWNrJzoxXG4gICAgICB9O1xuXG4gIHByb3RvUHJvcHMuZGVmYXVsdHMgPSB7fTtcblxuICAvLyBGb3IgZWFjaCBwcm9wZXJ0eSBwYXNzZWQgaW50byBvdXIgY29tcG9uZW50IGJhc2UgY2xhc3NcbiAgXy5lYWNoKHByb3RvUHJvcHMsIGZ1bmN0aW9uKHZhbHVlLCBrZXksIHByb3RvUHJvcHMpe1xuXG4gICAgLy8gSWYgYSBjb25maWd1cmF0aW9uIHByb3BlcnR5LCBpZ25vcmUgaXRcbiAgICBpZihjb25maWdQcm9wZXJ0aWVzW2tleV0peyByZXR1cm47IH1cblxuICAgIC8vIElmIGEgcHJpbWF0aXZlIG9yIGJhY2tib25lIHR5cGUgb2JqZWN0LCBvciBjb21wdXRlZCBwcm9wZXJ0eSAoZnVuY3Rpb24gd2hpY2ggdGFrZXMgbm8gYXJndW1lbnRzIGFuZCByZXR1cm5zIGEgdmFsdWUpIG1vdmUgaXQgdG8gb3VyIGRlZmF1bHRzXG4gICAgaWYoIV8uaXNGdW5jdGlvbih2YWx1ZSkgfHwgdmFsdWUuaXNNb2RlbCB8fCB2YWx1ZS5pc0NvbXBvbmVudCB8fCAoXy5pc0Z1bmN0aW9uKHZhbHVlKSAmJiB2YWx1ZS5sZW5ndGggPT09IDAgJiYgdmFsdWUudG9TdHJpbmcoKS5pbmRleE9mKCdyZXR1cm4nKSA+IC0xKSl7XG4gICAgICBwcm90b1Byb3BzLmRlZmF1bHRzW2tleV0gPSB2YWx1ZTtcbiAgICAgIGRlbGV0ZSBwcm90b1Byb3BzW2tleV07XG4gICAgfVxuXG4gICAgLy8gSWYgYSByZXNlcnZlZCBtZXRob2QsIHllbGxcbiAgICBpZihyZXNlcnZlZE1ldGhvZHNba2V5XSl7IHRocm93IFwiRVJST1I6IFwiICsga2V5ICsgXCIgaXMgYSByZXNlcnZlZCBtZXRob2QgbmFtZSBpbiBcIiArIHN0YXRpY1Byb3BzLl9fbmFtZSArIFwiIVwiOyB9XG5cbiAgICAvLyBBbGwgb3RoZXIgdmFsdWVzIGFyZSBjb21wb25lbnQgbWV0aG9kcywgbGVhdmUgdGhlbSBiZSB1bmxlc3MgYWxyZWFkeSBkZWZpbmVkLlxuXG4gIH0sIHRoaXMpO1xuXG4gIC8vIElmIGdpdmVuIGEgY29uc3RydWN0b3IsIHVzZSBpdCwgb3RoZXJ3aXNlIHVzZSB0aGUgZGVmYXVsdCBvbmUgZGVmaW5lZCBhYm92ZVxuICBpZiAocHJvdG9Qcm9wcyAmJiBfLmhhcyhwcm90b1Byb3BzLCAnY29uc3RydWN0b3InKSkge1xuICAgIGNoaWxkID0gcHJvdG9Qcm9wcy5jb25zdHJ1Y3RvcjtcbiAgfSBlbHNlIHtcbiAgICBjaGlsZCA9IGZ1bmN0aW9uKCl7IHJldHVybiBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfTtcbiAgfVxuXG4gIC8vIE91ciBjbGFzcyBzaG91bGQgaW5oZXJpdCBldmVyeXRoaW5nIGZyb20gaXRzIHBhcmVudCwgZGVmaW5lZCBhYm92ZVxuICB2YXIgU3Vycm9nYXRlID0gZnVuY3Rpb24oKXsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9O1xuICBTdXJyb2dhdGUucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTtcbiAgY2hpbGQucHJvdG90eXBlID0gbmV3IFN1cnJvZ2F0ZSgpO1xuXG4gIC8vIEV4dGVuZCBvdXIgcHJvdG90eXBlIHdpdGggYW55IHJlbWFpbmluZyBwcm90b1Byb3BzLCBvdmVycml0aW5nIHByZS1kZWZpbmVkIG9uZXNcbiAgaWYgKHByb3RvUHJvcHMpeyBfLmV4dGVuZChjaGlsZC5wcm90b3R5cGUsIHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKTsgfVxuXG4gIC8vIFNldCBvdXIgYW5jZXN0cnlcbiAgY2hpbGQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTtcblxuICByZXR1cm4gY2hpbGQ7XG59O1xuXG5Db21wb25lbnQucmVnaXN0ZXIgPSBmdW5jdGlvbiByZWdpc3RlckNvbXBvbmVudChuYW1lLCBvcHRpb25zKSB7XG4gIHZhciBzY3JpcHQgPSBvcHRpb25zLnByb3RvdHlwZTtcbiAgdmFyIHRlbXBsYXRlID0gb3B0aW9ucy50ZW1wbGF0ZTtcbiAgdmFyIHN0eWxlID0gb3B0aW9ucy5zdHlsZTtcblxuICB2YXIgY29tcG9uZW50ID0gdGhpcy5leHRlbmQoc2NyaXB0LCB7IF9fbmFtZTogbmFtZSB9KTtcbiAgdmFyIHByb3RvID0gT2JqZWN0LmNyZWF0ZShIVE1MRWxlbWVudC5wcm90b3R5cGUsIHt9KTtcblxuICBwcm90by5jcmVhdGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICB0aGlzLl9fY29tcG9uZW50X18gPSBuZXcgY29tcG9uZW50KHtcbiAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICAgIG91dGxldDogdGhpcyxcbiAgICAgIGRhdGE6IFJlYm91bmQuc2VlZERhdGFcbiAgICB9KTtcbiAgfTtcblxuICBwcm90by5hdHRhY2hlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgc2NyaXB0LmF0dGFjaGVkQ2FsbGJhY2sgJiYgc2NyaXB0LmF0dGFjaGVkQ2FsbGJhY2suY2FsbCh0aGlzLl9fY29tcG9uZW50X18pO1xuICB9O1xuXG4gIHByb3RvLmRldGFjaGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICBzY3JpcHQuZGV0YWNoZWRDYWxsYmFjayAmJiBzY3JpcHQuZGV0YWNoZWRDYWxsYmFjay5jYWxsKHRoaXMuX19jb21wb25lbnRfXyk7XG4gICAgdGhpcy5fX2NvbXBvbmVudF9fLmRlaW5pdGlhbGl6ZSgpO1xuICB9O1xuXG4gIHByb3RvLmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayA9IGZ1bmN0aW9uKGF0dHJOYW1lLCBvbGRWYWwsIG5ld1ZhbCkge1xuICAgIHRoaXMuX19jb21wb25lbnRfXy5fb25BdHRyaWJ1dGVDaGFuZ2UoYXR0ck5hbWUsIG9sZFZhbCwgbmV3VmFsKTtcbiAgICBzY3JpcHQuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrICYmIHNjcmlwdC5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2suY2FsbCh0aGlzLl9fY29tcG9uZW50X18sIGF0dHJOYW1lLCBvbGRWYWwsIG5ld1ZhbCk7XG4gIH07XG5cbiAgcmV0dXJuIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChuYW1lLCB7IHByb3RvdHlwZTogcHJvdG8gfSk7XG59XG5cbl8uYmluZEFsbChDb21wb25lbnQsICdyZWdpc3RlcicpO1xuXG5leHBvcnQgZGVmYXVsdCBDb21wb25lbnQ7XG4iLCIvLyBSZWJvdW5kIENvbGxlY3Rpb25cbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IE1vZGVsIGZyb20gXCJyZWJvdW5kLWRhdGEvbW9kZWxcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG5mdW5jdGlvbiBwYXRoR2VuZXJhdG9yKGNvbGxlY3Rpb24pe1xuICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICByZXR1cm4gY29sbGVjdGlvbi5fX3BhdGgoKSArICdbJyArIGNvbGxlY3Rpb24uaW5kZXhPZihjb2xsZWN0aW9uLl9ieUlkW3RoaXMuY2lkXSkgKyAnXSc7XG4gIH07XG59XG5cbnZhciBDb2xsZWN0aW9uID0gQmFja2JvbmUuQ29sbGVjdGlvbi5leHRlbmQoe1xuXG4gIGlzQ29sbGVjdGlvbjogdHJ1ZSxcbiAgaXNEYXRhOiB0cnVlLFxuXG4gIG1vZGVsOiB0aGlzLm1vZGVsIHx8IE1vZGVsLFxuXG4gIF9fcGF0aDogZnVuY3Rpb24oKXtyZXR1cm4gJyc7fSxcblxuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24obW9kZWxzLCBvcHRpb25zKXtcbiAgICBtb2RlbHMgfHwgKG1vZGVscyA9IFtdKTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHRoaXMuX19vYnNlcnZlcnMgPSB7fTtcbiAgICB0aGlzLmhlbHBlcnMgPSB7fTtcbiAgICB0aGlzLmNpZCA9IF8udW5pcXVlSWQoJ2NvbGxlY3Rpb24nKTtcblxuICAgIC8vIFNldCBsaW5lYWdlXG4gICAgdGhpcy5zZXRQYXJlbnQoIG9wdGlvbnMucGFyZW50IHx8IHRoaXMgKTtcbiAgICB0aGlzLnNldFJvb3QoIG9wdGlvbnMucm9vdCB8fCB0aGlzICk7XG4gICAgdGhpcy5fX3BhdGggPSBvcHRpb25zLnBhdGggfHwgdGhpcy5fX3BhdGg7XG5cbiAgICBCYWNrYm9uZS5Db2xsZWN0aW9uLmFwcGx5KCB0aGlzLCBhcmd1bWVudHMgKTtcblxuICAgIC8vIFdoZW4gYSBtb2RlbCBpcyByZW1vdmVkIGZyb20gaXRzIG9yaWdpbmFsIGNvbGxlY3Rpb24sIGRlc3Ryb3kgaXRcbiAgICAvLyBUT0RPOiBGaXggdGhpcy4gQ29tcHV0ZWQgcHJvcGVydGllcyBub3cgc29tZWhvdyBhbGxvdyBjb2xsZWN0aW9uIHRvIHNoYXJlIGEgbW9kZWwuIFRoZXkgbWF5IGJlIHJlbW92ZWQgZnJvbSBvbmUgYnV0IG5vdCB0aGUgb3RoZXIuIFRoYXQgaXMgYmFkLlxuICAgIC8vIFRoZSBjbG9uZSA9IGZhbHNlIG9wdGlvbnMgaXMgdGhlIGN1bHByaXQuIEZpbmQgYSBiZXR0ZXIgd2F5IHRvIGNvcHkgYWxsIG9mIHRoZSBjb2xsZWN0aW9ucyBjdXN0b20gYXR0cmlidXRlcyBvdmVyIHRvIHRoZSBjbG9uZS5cbiAgICB0aGlzLm9uKCdyZW1vdmUnLCBmdW5jdGlvbihtb2RlbCwgY29sbGVjdGlvbiwgb3B0aW9ucyl7XG4gICAgICAvLyBtb2RlbC5kZWluaXRpYWxpemUoKTtcbiAgICB9KTtcblxuICB9LFxuXG4gIGdldDogZnVuY3Rpb24oa2V5LCBvcHRpb25zKXtcblxuICAgIC8vIElmIHRoZSBrZXkgaXMgYSBudW1iZXIgb3Igb2JqZWN0LCBkZWZhdWx0IHRvIGJhY2tib25lJ3MgY29sbGVjdGlvbiBnZXRcbiAgICBpZih0eXBlb2Yga2V5ID09ICdudW1iZXInIHx8IHR5cGVvZiBrZXkgPT0gJ29iamVjdCcpe1xuICAgICAgcmV0dXJuIEJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLmdldC5jYWxsKHRoaXMsIGtleSk7XG4gICAgfVxuXG4gICAgLy8gSWYga2V5IGlzIG5vdCBhIHN0cmluZywgcmV0dXJuIHVuZGVmaW5lZFxuICAgIGlmICghXy5pc1N0cmluZyhrZXkpKSByZXR1cm4gdm9pZCAwO1xuXG4gICAgLy8gU3BsaXQgdGhlIHBhdGggYXQgYWxsICcuJywgJ1snIGFuZCAnXScgYW5kIGZpbmQgdGhlIHZhbHVlIHJlZmVyYW5jZWQuXG4gICAgdmFyIHBhcnRzICA9ICQuc3BsaXRQYXRoKGtleSksXG4gICAgICAgIHJlc3VsdCA9IHRoaXMsXG4gICAgICAgIGw9cGFydHMubGVuZ3RoLFxuICAgICAgICBpPTA7XG4gICAgICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG5cbiAgICBpZihfLmlzVW5kZWZpbmVkKGtleSkgfHwgXy5pc051bGwoa2V5KSkgcmV0dXJuIGtleTtcbiAgICBpZihrZXkgPT09ICcnIHx8IHBhcnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJlc3VsdDtcblxuICAgIGlmIChwYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKCBpID0gMDsgaSA8IGw7IGkrKykge1xuICAgICAgICAvLyBJZiByZXR1cm5pbmcgcmF3LCBhbHdheXMgcmV0dXJuIHRoZSBmaXJzdCBjb21wdXRlZCBwcm9wZXJ0eSBmb3VuZC4gSWYgdW5kZWZpbmVkLCB5b3UncmUgZG9uZS5cbiAgICAgICAgaWYocmVzdWx0ICYmIHJlc3VsdC5pc0NvbXB1dGVkUHJvcGVydHkgJiYgb3B0aW9ucy5yYXcpIHJldHVybiByZXN1bHQ7XG4gICAgICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5KSByZXN1bHQgPSByZXN1bHQudmFsdWUoKTtcbiAgICAgICAgaWYoXy5pc1VuZGVmaW5lZChyZXN1bHQpIHx8IF8uaXNOdWxsKHJlc3VsdCkpIHJldHVybiByZXN1bHQ7XG4gICAgICAgIGlmKHBhcnRzW2ldID09PSAnQHBhcmVudCcpIHJlc3VsdCA9IHJlc3VsdC5fX3BhcmVudF9fO1xuICAgICAgICBlbHNlIGlmKHJlc3VsdC5pc0NvbGxlY3Rpb24pIHJlc3VsdCA9IHJlc3VsdC5tb2RlbHNbcGFydHNbaV1dO1xuICAgICAgICBlbHNlIGlmKHJlc3VsdC5pc01vZGVsKSByZXN1bHQgPSByZXN1bHQuYXR0cmlidXRlc1twYXJ0c1tpXV07XG4gICAgICAgIGVsc2UgaWYocmVzdWx0Lmhhc093blByb3BlcnR5KHBhcnRzW2ldKSkgcmVzdWx0ID0gcmVzdWx0W3BhcnRzW2ldXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZihyZXN1bHQgJiYgcmVzdWx0LmlzQ29tcHV0ZWRQcm9wZXJ0eSAmJiAhb3B0aW9ucy5yYXcpIHJlc3VsdCA9IHJlc3VsdC52YWx1ZSgpO1xuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuICBzZXQ6IGZ1bmN0aW9uKG1vZGVscywgb3B0aW9ucyl7XG4gICAgdmFyIG5ld01vZGVscyA9IFtdLFxuICAgICAgICBsaW5lYWdlID0ge1xuICAgICAgICAgIHBhcmVudDogdGhpcyxcbiAgICAgICAgICByb290OiB0aGlzLl9fcm9vdF9fLFxuICAgICAgICAgIHBhdGg6IHBhdGhHZW5lcmF0b3IodGhpcyksXG4gICAgICAgICAgc2lsZW50OiB0cnVlXG4gICAgICAgIH07XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9LFxuXG4gICAgLy8gSWYgbm8gbW9kZWxzIHBhc3NlZCwgaW1wbGllcyBhbiBlbXB0eSBhcnJheVxuICAgIG1vZGVscyB8fCAobW9kZWxzID0gW10pO1xuXG4gICAgLy8gSWYgbW9kZWxzIGlzIGEgc3RyaW5nLCBjYWxsIHNldCBhdCB0aGF0IHBhdGhcbiAgICBpZihfLmlzU3RyaW5nKG1vZGVscykpIHJldHVybiB0aGlzLmdldCgkLnNwbGl0UGF0aChtb2RlbHMpWzBdKS5zZXQoJC5zcGxpdFBhdGgobW9kZWxzKS5zcGxpY2UoMSwgbW9kZWxzLmxlbmd0aCkuam9pbignLicpLCBvcHRpb25zKTtcbiAgICBpZighXy5pc09iamVjdChtb2RlbHMpKSByZXR1cm4gY29uc29sZS5lcnJvcignQ29sbGVjdGlvbi5zZXQgbXVzdCBiZSBwYXNzZWQgYSBNb2RlbCwgT2JqZWN0LCBhcnJheSBvciBNb2RlbHMgYW5kIE9iamVjdHMsIG9yIGFub3RoZXIgQ29sbGVjdGlvbicpO1xuXG4gICAgLy8gSWYgYW5vdGhlciBjb2xsZWN0aW9uLCB0cmVhdCBsaWtlIGFuIGFycmF5XG4gICAgbW9kZWxzID0gKG1vZGVscy5pc0NvbGxlY3Rpb24pID8gbW9kZWxzLm1vZGVscyA6IG1vZGVscztcbiAgICAvLyBFbnN1cmUgbW9kZWxzIGlzIGFuIGFycmF5XG4gICAgbW9kZWxzID0gKCFfLmlzQXJyYXkobW9kZWxzKSkgPyBbbW9kZWxzXSA6IG1vZGVscztcblxuICAgIC8vIElmIHRoZSBtb2RlbCBhbHJlYWR5IGV4aXN0cyBpbiB0aGlzIGNvbGxlY3Rpb24sIG9yIHdlIGFyZSB0b2xkIG5vdCB0byBjbG9uZSBpdCwgbGV0IEJhY2tib25lIGhhbmRsZSB0aGUgbWVyZ2VcbiAgICAvLyBPdGhlcndpc2UsIGNyZWF0ZSBvdXIgY29weSBvZiB0aGlzIG1vZGVsLCBnaXZlIHRoZW0gdGhlIHNhbWUgY2lkIHNvIG91ciBoZWxwZXJzIHRyZWF0IHRoZW0gYXMgdGhlIHNhbWUgb2JqZWN0XG4gICAgXy5lYWNoKG1vZGVscywgZnVuY3Rpb24oZGF0YSwgaW5kZXgpe1xuICAgICAgaWYoZGF0YS5pc01vZGVsICYmIG9wdGlvbnMuY2xvbmUgPT09IGZhbHNlIHx8IHRoaXMuX2J5SWRbZGF0YS5jaWRdKSByZXR1cm4gbmV3TW9kZWxzW2luZGV4XSA9IGRhdGE7XG4gICAgICBuZXdNb2RlbHNbaW5kZXhdID0gbmV3IHRoaXMubW9kZWwoZGF0YSwgXy5kZWZhdWx0cyhsaW5lYWdlLCBvcHRpb25zKSk7XG4gICAgICBkYXRhLmlzTW9kZWwgJiYgKG5ld01vZGVsc1tpbmRleF0uY2lkID0gZGF0YS5jaWQpO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgLy8gRW5zdXJlIHRoYXQgdGhpcyBlbGVtZW50IG5vdyBrbm93cyB0aGF0IGl0IGhhcyBjaGlsZHJlbiBub3cuIFdpdGhvdXQgdGhpcyBjeWNsaWMgZGVwZW5kYW5jaWVzIGNhdXNlIGlzc3Vlc1xuICAgIHRoaXMuX2hhc0FuY2VzdHJ5IHx8ICh0aGlzLl9oYXNBbmNlc3RyeSA9IG5ld01vZGVscy5sZW5ndGggPiAwKTtcblxuICAgIC8vIENhbGwgb3JpZ2luYWwgc2V0IGZ1bmN0aW9uIHdpdGggbW9kZWwgZHVwbGljYXRlc1xuICAgIHJldHVybiBCYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5zZXQuY2FsbCh0aGlzLCBuZXdNb2RlbHMsIG9wdGlvbnMpO1xuXG4gIH1cblxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IENvbGxlY3Rpb247XG4iLCIvLyBSZWJvdW5kIFByZWNvbXBpbGVyXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCB7IGNvbXBpbGUgYXMgaHRtbGJhcnNDb21waWxlLCBjb21waWxlU3BlYyBhcyBodG1sYmFyc0NvbXBpbGVTcGVjIH0gZnJvbSBcImh0bWxiYXJzXCI7XG5cbi8vIFJlbW92ZSB0aGUgY29udGVudHMgb2YgdGhlIGNvbXBvbmVudCdzIGBzY3JpcHRgIHRhZy5cbmZ1bmN0aW9uIGdldFNjcmlwdChzdHIpe1xuICByZXR1cm4gKHN0ci5pbmRleE9mKCc8c2NyaXB0PicpID4gLTEgJiYgc3RyLmluZGV4T2YoJzwvc2NyaXB0PicpID4gLTEpID8gJyhmdW5jdGlvbigpeycgKyBzdHIucmVwbGFjZSgvKC4qPHNjcmlwdD4pKC4qKSg8XFwvc2NyaXB0Pi4qKS9pZywgJyQyJykgKyAnfSkoKScgOiAne30nO1xufVxuXG4vLyBSZW1vdmUgdGhlIGNvbnRlbnRzIG9mIHRoZSBjb21wb25lbnQncyBgc3R5bGVgIHRhZy5cbmZ1bmN0aW9uIGdldFN0eWxlKHN0cil7XG4gIHJldHVybiAoc3RyLmluZGV4T2YoJzxzdHlsZT4nKSA+IC0xICYmIHN0ci5pbmRleE9mKCc8L3N0eWxlPicpID4gLTEpID8gc3RyLnJlcGxhY2UoLyguKjxzdHlsZT4pKC4qKSg8XFwvc3R5bGU+LiopL2lnLCAnJDInKS5yZXBsYWNlKC9cIi9nLCAnXFxcXFwiJykgOiAnJztcbn1cblxuLy8gUmVtb3ZlIHRoZSBjb250ZW50cyBvZiB0aGUgY29tcG9uZW50J3MgYHRlbXBsYXRlYCB0YWcuXG5mdW5jdGlvbiBnZXRUZW1wbGF0ZShzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLy4qPHRlbXBsYXRlPiguKik8XFwvdGVtcGxhdGU+LiovZ2ksICckMScpLnJlcGxhY2UoLyguKik8c3R5bGU+Lio8XFwvc3R5bGU+KC4qKS9pZywgJyQxJDInKTtcbn1cblxuLy8gR2V0IHRoZSBjb21wb25lbnQncyBuYW1lIGZyb20gaXRzIGBuYW1lYCBhdHRyaWJ1dGUuXG5mdW5jdGlvbiBnZXROYW1lKHN0cil7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvLio8ZWxlbWVudFtePl0qbmFtZT0oW1wiJ10pPyhbXidcIj5cXHNdKylcXDFbXjw+XSo+LiovaWcsICckMicpO1xufVxuXG4vLyBNaW5pZnkgdGhlIHN0cmluZyBwYXNzZWQgaW4gYnkgcmVwbGFjaW5nIGFsbCB3aGl0ZXNwYWNlLlxuZnVuY3Rpb24gbWluaWZ5KHN0cil7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXFxzKy9nLCAnICcpLnJlcGxhY2UoL1xcbnwoPikgKDwpL2csICckMSQyJyk7XG59XG5cbi8vIFN0cmlwIGphdmFzY3JpcHQgY29tbWVudHNcbmZ1bmN0aW9uIHJlbW92ZUNvbW1lbnRzKHN0cil7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvKD86XFwvXFwqKD86W1xcc1xcU10qPylcXCpcXC8pfCg/OihbXFxzXSkrXFwvXFwvKD86LiopJCkvZ20sICckMScpO1xufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZUZ1bmMoZm4pIHtcbiAgdmFyIHNyYyA9IGZuLnRvU3RyaW5nKCk7XG4gIHNyYyA9IHNyYy5zbGljZShzcmMuaW5kZXhPZihcIntcIikgKyAxLCAtMSk7XG4gIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgcmV0dXJuICFkYXRhID8gc3JjIDogc3JjLnJlcGxhY2UoLyhcXCRbYS16QS1aXSspL2csIGZ1bmN0aW9uKCRyZXApIHtcbiAgICAgIHZhciBrZXkgPSAkcmVwLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIGRhdGFba2V5XSB8fCBcIlwiO1xuICAgIH0pO1xuICB9O1xufVxuXG52YXIgQ09NUE9ORU5UX1RFTVBMQVRFID0gdGVtcGxhdGVGdW5jKGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIChmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gd2luZG93LlJlYm91bmQucmVnaXN0ZXJDb21wb25lbnQoXCIkbmFtZVwiLCB7XG4gICAgICBwcm90b3R5cGU6ICRzY3JpcHQsXG4gICAgICB0ZW1wbGF0ZTogJHRlbXBsYXRlLFxuICAgICAgc3R5bGU6IFwiJHN0eWxlXCJcbiAgICB9KTtcbiAgfSkoKTtcbn0pO1xuXG5mdW5jdGlvbiBwcmVjb21waWxlKHN0ciwgb3B0aW9ucyl7XG4gIGlmKCAhc3RyIHx8IHN0ci5sZW5ndGggPT09IDAgKXtcbiAgICByZXR1cm4gY29uc29sZS5lcnJvcignTm8gdGVtcGxhdGUgcHJvdmlkZWQhJyk7XG4gIH1cblxuICAvLyBSZW1vdmUgY29tbWVudHNcbiAgc3RyID0gcmVtb3ZlQ29tbWVudHMoc3RyKTtcbiAgLy8gTWluaWZ5IGV2ZXJ5dGhpbmdcbiAgc3RyID0gbWluaWZ5KHN0cik7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuYmFzZURlc3QgPSBvcHRpb25zLmJhc2VEZXN0IHx8ICcnO1xuICBvcHRpb25zLm5hbWUgPSBvcHRpb25zLm5hbWUgfHwgJyc7XG4gIG9wdGlvbnMuYmFzZVVybCA9IG9wdGlvbnMuYmFzZVVybCB8fCAnJztcblxuICB2YXIgdGVtcGxhdGUgPSBzdHIsXG4gICAgICBzdHlsZSA9ICcnLFxuICAgICAgc2NyaXB0ID0gJ3t9JyxcbiAgICAgIG5hbWUgPSAnJyxcbiAgICAgIGlzUGFydGlhbCA9IHRydWUsXG4gICAgICBpbXBvcnRzID0gW10sXG4gICAgICBwYXJ0aWFscyxcbiAgICAgIHJlcXVpcmUsXG4gICAgICBkZXBzID0gW107XG5cbiAgLy8gSWYgdGhlIGVsZW1lbnQgdGFnIGlzIHByZXNlbnRcbiAgaWYoc3RyLmluZGV4T2YoJzxlbGVtZW50JykgPiAtMSAmJiBzdHIuaW5kZXhPZignPC9lbGVtZW50PicpID4gLTEpe1xuXG4gICAgaXNQYXJ0aWFsID0gZmFsc2U7XG5cbiAgICBuYW1lID0gZ2V0TmFtZShzdHIpO1xuICAgIHN0eWxlID0gZ2V0U3R5bGUoc3RyKTtcbiAgICB0ZW1wbGF0ZSA9IGdldFRlbXBsYXRlKHN0cik7XG4gICAgc2NyaXB0ID0gZ2V0U2NyaXB0KHN0cik7XG5cbiAgfVxuXG5cbiAgLy8gQXNzZW1wbGUgb3VyIGNvbXBvbmVudCBkZXBlbmRhbmNpZXMgYnkgZmluZGluZyBsaW5rIHRhZ3MgYW5kIHBhcnNpbmcgdGhlaXIgc3JjXG4gIHZhciBpbXBvcnRzcmUgPSAvPGxpbmsgW15oXSpocmVmPShbJ1wiXT8pXFwvPyhbXi4nXCJdKikuaHRtbFxcMVtePl0qPi9naSxcbiAgICAgIG1hdGNoO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBpbXBvcnRzcmUuZXhlYyh0ZW1wbGF0ZSkpICE9IG51bGwpIHtcbiAgICAgIGltcG9ydHMucHVzaChtYXRjaFsyXSk7XG4gIH1cbiAgaW1wb3J0cy5mb3JFYWNoKGZ1bmN0aW9uKGltcG9ydFN0cmluZywgaW5kZXgpe1xuICAgIGRlcHMucHVzaCgnXCInICsgb3B0aW9ucy5iYXNlRGVzdCArIGltcG9ydFN0cmluZyArICdcIicpO1xuICB9KTtcblxuICAvLyBSZW1vdmUgbGluayB0YWdzIGZyb20gdGVtcGxhdGVcbiAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5yZXBsYWNlKC88bGluayAuKmhyZWY9KFsnXCJdPykoLiopLmh0bWxcXDFbXj5dKj4vZ2ksICcnKTtcblxuICAvLyBBc3NlbWJsZSBvdXIgcGFydGlhbCBkZXBlbmRhbmNpZXNcbiAgcGFydGlhbHMgPSB0ZW1wbGF0ZS5tYXRjaCgvXFx7XFx7Plxccyo/WydcIl0/KFteJ1wifVxcc10qKVsnXCJdP1xccyo/XFx9XFx9L2dpKTtcblxuICBpZihwYXJ0aWFscyl7XG4gICAgcGFydGlhbHMuZm9yRWFjaChmdW5jdGlvbihwYXJ0aWFsLCBpbmRleCl7XG4gICAgICBkZXBzLnB1c2goJ1wiJyArIG9wdGlvbnMuYmFzZURlc3QgKyBwYXJ0aWFsLnJlcGxhY2UoL1xce1xcez5bXFxzKl0/WydcIl0/KFteJ1wiXSopWydcIl0/W1xccypdP1xcfVxcfS9naSwgJyQxJykgKyAnXCInKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIENvbXBpbGVcbiAgdGVtcGxhdGUgPSAnJyArIGh0bWxiYXJzQ29tcGlsZVNwZWModGVtcGxhdGUpO1xuXG4gIC8vIElmIGlzIGEgcGFydGlhbFxuICBpZihpc1BhcnRpYWwpe1xuICAgIHRlbXBsYXRlID0gJyhmdW5jdGlvbigpe3ZhciB0ZW1wbGF0ZSA9ICcrdGVtcGxhdGUrJ1xcbiB3aW5kb3cuUmVib3VuZC5yZWdpc3RlclBhcnRpYWwoIFwiJysgb3B0aW9ucy5uYW1lICsnXCIsIHRlbXBsYXRlKTt9KSgpO1xcbic7XG4gIH1cbiAgLy8gRWxzZSwgaXMgYSBjb21wb25lbnRcbiAgZWxzZXtcbiAgICB0ZW1wbGF0ZSA9IENPTVBPTkVOVF9URU1QTEFURSh7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgc2NyaXB0OiBzY3JpcHQsXG4gICAgICBzdHlsZTogc3R5bGUsXG4gICAgICB0ZW1wbGF0ZTogdGVtcGxhdGVcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFdyYXAgaW4gZGVmaW5lXG4gIHRlbXBsYXRlID0gXCJkZWZpbmUoIFtcIisgZGVwcy5qb2luKCcsICcpICArXCJdLCBmdW5jdGlvbigpe1xcblwiICsgdGVtcGxhdGUgKyAnfSk7JztcblxuICByZXR1cm4gdGVtcGxhdGU7XG59XG5cbmV4cG9ydCB7IHByZWNvbXBpbGUgfTtcbiIsIi8vIFJlYm91bmQgUm91dGVyXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG4vLyBJZiBCYWNrYm9uZSBoYXNuJ3QgYmVlbiBzdGFydGVkIHlldCwgdGhyb3cgZXJyb3JcbmlmKCF3aW5kb3cuQmFja2JvbmUpeyB0aHJvdyBcIkJhY2tib25lIG11c3QgYmUgb24gdGhlIHBhZ2UgZm9yIFJlYm91bmQgdG8gbG9hZC5cIjsgfVxuXG4gIC8vIENsZWFuIHVwIG9sZCBwYWdlIGNvbXBvbmVudCBhbmQgbG9hZCByb3V0ZXMgZnJvbSBvdXIgbmV3IHBhZ2UgY29tcG9uZW50XG4gIGZ1bmN0aW9uIGluc3RhbGxSZXNvdXJjZXMoUGFnZUFwcCwgcHJpbWFyeVJvdXRlLCBpc0dsb2JhbCkge1xuICAgIHZhciBvbGRQYWdlTmFtZSwgcGFnZUluc3RhbmNlLCBjb250YWluZXIsIHJvdXRlciA9IHRoaXM7XG5cbiAgICAvLyBEZS1pbml0aWFsaXplIHRoZSBwcmV2aW91cyBhcHAgYmVmb3JlIHJlbmRlcmluZyBhIG5ldyBhcHBcbiAgICAvLyBUaGlzIHdheSB3ZSBjYW4gZW5zdXJlIHRoYXQgZXZlcnkgbmV3IHBhZ2Ugc3RhcnRzIHdpdGggYSBjbGVhbiBzbGF0ZVxuICAgIC8vIFRoaXMgaXMgY3J1Y2lhbCBmb3Igc2NhbGFiaWxpdHkgb2YgYSBzaW5nbGUgcGFnZSBhcHAuXG4gICAgaWYoIWlzR2xvYmFsICYmIHRoaXMuY3VycmVudCl7XG5cbiAgICAgIG9sZFBhZ2VOYW1lID0gdGhpcy5jdXJyZW50Ll9fbmFtZTtcbiAgICAgIC8vIFVuc2V0IFByZXZpb3VzIEFwcGxpY2F0aW9uJ3MgUm91dGVzLiBGb3IgZWFjaCByb3V0ZSBpbiB0aGUgcGFnZSBhcHA6XG4gICAgICBfLmVhY2godGhpcy5jdXJyZW50Ll9fY29tcG9uZW50X18ucm91dGVzLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuXG4gICAgICAgIHZhciByZWdFeHAgPSByb3V0ZXIuX3JvdXRlVG9SZWdFeHAoa2V5KS50b1N0cmluZygpO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgaGFuZGxlciBmcm9tIG91ciByb3V0ZSBvYmplY3RcbiAgICAgICAgQmFja2JvbmUuaGlzdG9yeS5oYW5kbGVycyA9IF8uZmlsdGVyKEJhY2tib25lLmhpc3RvcnkuaGFuZGxlcnMsIGZ1bmN0aW9uKG9iail7cmV0dXJuIG9iai5yb3V0ZS50b1N0cmluZygpICE9PSByZWdFeHA7fSk7XG5cbiAgICAgICAgLy8gRGVsZXRlIG91ciByZWZlcmFuY2UgdG8gdGhlIHJvdXRlJ3MgY2FsbGJhY2tcbiAgICAgICAgZGVsZXRlIHJvdXRlclsgJ19mdW5jdGlvbl8nICsga2V5IF07XG5cbiAgICAgIH0pO1xuXG4gICAgICAvLyBVbi1ob29rIEV2ZW50IEJpbmRpbmdzLCBEZWxldGUgT2JqZWN0c1xuICAgICAgdGhpcy5jdXJyZW50Ll9fY29tcG9uZW50X18uZGVpbml0aWFsaXplKCk7XG5cbiAgICAgIC8vIERpc2FibGUgb2xkIGNzcyBpZiBpdCBleGlzdHNcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQob2xkUGFnZU5hbWUgKyAnLWNzcycpLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAgIH0sIDUwMCk7XG5cbiAgICB9XG5cbiAgICAvLyBMb2FkIE5ldyBQYWdlQXBwLCBnaXZlIGl0IGl0J3MgbmFtZSBzbyB3ZSBrbm93IHdoYXQgY3NzIHRvIHJlbW92ZSB3aGVuIGl0IGRlaW5pdGlhbGl6ZXNcbiAgICBwYWdlSW5zdGFuY2UgPSBuZXcgUGFnZUFwcCgpO1xuICAgIHBhZ2VJbnN0YW5jZS5fX25hbWUgPSBwcmltYXJ5Um91dGU7XG5cbiAgICAvLyBBZGQgdG8gb3VyIHBhZ2VcbiAgICBjb250YWluZXIgPSAoaXNHbG9iYWwpID8gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihpc0dsb2JhbCkgOiBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29udGVudCcpWzBdO1xuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocGFnZUluc3RhbmNlKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB3ZSdyZSBiYWNrIGF0IHRoZSB0b3Agb2YgdGhlIHBhZ2VcbiAgICBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCA9IDA7XG5cbiAgICAvLyBBdWdtZW50IEFwcGxpY2F0aW9uUm91dGVyIHdpdGggbmV3IHJvdXRlcyBmcm9tIFBhZ2VBcHBcbiAgICBfLmVhY2gocGFnZUluc3RhbmNlLl9fY29tcG9uZW50X18ucm91dGVzLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgLy8gR2VuZXJhdGUgb3VyIHJvdXRlIGNhbGxiYWNrJ3MgbmV3IG5hbWVcbiAgICAgIHZhciByb3V0ZUZ1bmN0aW9uTmFtZSA9ICdfZnVuY3Rpb25fJyArIGtleSxcbiAgICAgICAgICBmdW5jdGlvbk5hbWU7XG4gICAgICAvLyBBZGQgdGhlIG5ldyBjYWxsYmFjayByZWZlcmFuY2Ugb24gdG8gb3VyIHJvdXRlclxuICAgICAgcm91dGVyW3JvdXRlRnVuY3Rpb25OYW1lXSA9ICBmdW5jdGlvbiAoKSB7IHBhZ2VJbnN0YW5jZS5fX2NvbXBvbmVudF9fW3ZhbHVlXS5hcHBseShwYWdlSW5zdGFuY2UuX19jb21wb25lbnRfXywgYXJndW1lbnRzKTsgfTtcbiAgICAgIC8vIEFkZCB0aGUgcm91dGUgaGFuZGxlclxuICAgICAgcm91dGVyLnJvdXRlKGtleSwgdmFsdWUsIHRoaXNbcm91dGVGdW5jdGlvbk5hbWVdKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIGlmKCFpc0dsb2JhbCl7XG4gICAgICB3aW5kb3cuUmVib3VuZC5wYWdlID0gKHRoaXMuY3VycmVudCA9IHBhZ2VJbnN0YW5jZSkuX19jb21wb25lbnRfXztcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gb3VyIG5ld2x5IGluc3RhbGxlZCBhcHBcbiAgICByZXR1cm4gcGFnZUluc3RhbmNlO1xuICB9XG5cbiAgLy8gRmV0Y2hlcyBQYXJlIEhUTUwgYW5kIENTU1xuICBmdW5jdGlvbiBmZXRjaFJlc291cmNlcyhhcHBOYW1lLCBwcmltYXJ5Um91dGUsIGlzR2xvYmFsKSB7XG5cbiAgICAvLyBFeHBlY3RpbmcgTW9kdWxlIERlZmluaXRpb24gYXMgJ1NlYXJjaEFwcCcgV2hlcmUgJ1NlYXJjaCcgYSBQcmltYXJ5IFJvdXRlXG4gICAgdmFyIGpzVXJsID0gdGhpcy5jb25maWcuanNQYXRoLnJlcGxhY2UoLzpyb3V0ZS9nLCBwcmltYXJ5Um91dGUpLnJlcGxhY2UoLzphcHAvZywgYXBwTmFtZSksXG4gICAgICAgIGNzc1VybCA9IHRoaXMuY29uZmlnLmNzc1BhdGgucmVwbGFjZSgvOnJvdXRlL2csIHByaW1hcnlSb3V0ZSkucmVwbGFjZSgvOmFwcC9nLCBhcHBOYW1lKSxcbiAgICAgICAgY3NzTG9hZGVkID0gZmFsc2UsXG4gICAgICAgIGpzTG9hZGVkID0gZmFsc2UsXG4gICAgICAgIGNzc0VsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcHBOYW1lICsgJy1jc3MnKSxcbiAgICAgICAganNFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXBwTmFtZSArICctanMnKSxcbiAgICAgICAgcm91dGVyID0gdGhpcyxcbiAgICAgICAgUGFnZUFwcDtcblxuICAgICAgLy8gT25seSBMb2FkIENTUyBJZiBOb3QgTG9hZGVkIEJlZm9yZVxuICAgICAgaWYoIWNzc0VsZW1lbnQpe1xuICAgICAgICBjc3NFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuICAgICAgICBjc3NFbGVtZW50LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgICAgICBjc3NFbGVtZW50LnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICAgICAgY3NzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBjc3NVcmwpO1xuICAgICAgICBjc3NFbGVtZW50LnNldEF0dHJpYnV0ZSgnaWQnLCBhcHBOYW1lICsgJy1jc3MnKTtcbiAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChjc3NFbGVtZW50KTtcbiAgICAgICAgJChjc3NFbGVtZW50KS5vbignbG9hZCcsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgIGlmKChjc3NMb2FkZWQgPSB0cnVlKSAmJiBqc0xvYWRlZCl7XG4gICAgICAgICAgICAgIC8vIEluc3RhbGwgVGhlIExvYWRlZCBSZXNvdXJjZXNcbiAgICAgICAgICAgICAgaW5zdGFsbFJlc291cmNlcy5jYWxsKHJvdXRlciwgUGFnZUFwcCwgYXBwTmFtZSwgaXNHbG9iYWwpO1xuXG4gICAgICAgICAgICAgIC8vIFJlLXRyaWdnZXIgcm91dGUgc28gdGhlIG5ld2x5IGFkZGVkIHJvdXRlIG1heSBleGVjdXRlIGlmIHRoZXJlJ3MgYSByb3V0ZSBtYXRjaC5cbiAgICAgICAgICAgICAgLy8gSWYgbm8gcm91dGVzIGFyZSBtYXRjaGVkLCBhcHAgd2lsbCBoaXQgd2lsZENhcmQgcm91dGUgd2hpY2ggd2lsbCB0aGVuIHRyaWdnZXIgNDA0XG4gICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCAmJiByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCl7XG4gICAgICAgICAgICAgICAgQmFja2JvbmUuaGlzdG9yeS5sb2FkVXJsKEJhY2tib25lLmhpc3RvcnkuZnJhZ21lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCl7XG4gICAgICAgICAgICAgICAgcm91dGVyLmNvbmZpZy50cmlnZ2VyT25GaXJzdExvYWQgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgLy8gSWYgaXQgaGFzIGJlZW4gbG9hZGVkIGJldm9yZSwgZW5hYmxlIGl0XG4gICAgICBlbHNlIHtcbiAgICAgICAgY3NzRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2Rpc2FibGVkJyk7XG4gICAgICAgIGNzc0xvYWRlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIElmIGlmIHJlcXVpcmVqcyBpcyBub3Qgb24gdGhlIHBhZ2UsIGxvYWQgdGhlIGZpbGUgbWFudWFsbHkuIEl0IGJldHRlciBjb250YWluIGFsbCBpdHMgZGVwZW5kYW5jaWVzLlxuICAgICAgaWYod2luZG93LnJlcXVpcmUuX2RlZmluZWQgfHwgXy5pc1VuZGVmaW5lZCh3aW5kb3cucmVxdWlyZSkpe1xuICAgICAgICAgIGpzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xuICAgICAgICAgIGpzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dC9qYXZhc2NyaXB0Jyk7XG4gICAgICAgICAganNFbGVtZW50LnNldEF0dHJpYnV0ZSgnc3JjJywgJy8nK2pzVXJsKycuanMnKTtcbiAgICAgICAgICBqc0VsZW1lbnQuc2V0QXR0cmlidXRlKCdpZCcsIGFwcE5hbWUgKyAnLWpzJyk7XG4gICAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChqc0VsZW1lbnQpO1xuICAgICAgICAgICQoanNFbGVtZW50KS5vbignbG9hZCcsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgIC8vIEFNRCBXaWxsIE1hbmFnZSBEZXBlbmRhbmNpZXMgRm9yIFVzLiBMb2FkIFRoZSBBcHAuXG4gICAgICAgICAgICByZXF1aXJlKFtqc1VybF0sIGZ1bmN0aW9uKFBhZ2VDbGFzcyl7XG5cbiAgICAgICAgICAgICAgaWYoKGpzTG9hZGVkID0gdHJ1ZSkgJiYgKFBhZ2VBcHAgPSBQYWdlQ2xhc3MpICYmIGNzc0xvYWRlZCl7XG5cbiAgICAgICAgICAgICAgICAvLyBJbnN0YWxsIFRoZSBMb2FkZWQgUmVzb3VyY2VzXG4gICAgICAgICAgICAgICAgaW5zdGFsbFJlc291cmNlcy5jYWxsKHJvdXRlciwgUGFnZUFwcCwgYXBwTmFtZSwgaXNHbG9iYWwpO1xuICAgICAgICAgICAgICAgIC8vIFJlLXRyaWdnZXIgcm91dGUgc28gdGhlIG5ld2x5IGFkZGVkIHJvdXRlIG1heSBleGVjdXRlIGlmIHRoZXJlJ3MgYSByb3V0ZSBtYXRjaC5cbiAgICAgICAgICAgICAgICAvLyBJZiBubyByb3V0ZXMgYXJlIG1hdGNoZWQsIGFwcCB3aWxsIGhpdCB3aWxkQ2FyZCByb3V0ZSB3aGljaCB3aWxsIHRoZW4gdHJpZ2dlciA0MDRcbiAgICAgICAgICAgICAgICBpZighaXNHbG9iYWwgJiYgcm91dGVyLmNvbmZpZy50cmlnZ2VyT25GaXJzdExvYWQpe1xuICAgICAgICAgICAgICAgICAgQmFja2JvbmUuaGlzdG9yeS5sb2FkVXJsKEJhY2tib25lLmhpc3RvcnkuZnJhZ21lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZighaXNHbG9iYWwpe1xuICAgICAgICAgICAgICAgICAgcm91dGVyLmNvbmZpZy50cmlnZ2VyT25GaXJzdExvYWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcblxuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgLy8gQU1EIFdpbGwgTWFuYWdlIERlcGVuZGFuY2llcyBGb3IgVXMuIExvYWQgVGhlIEFwcC5cbiAgICAgICAgd2luZG93LnJlcXVpcmUoW2pzVXJsXSwgZnVuY3Rpb24oUGFnZUNsYXNzKXtcblxuICAgICAgICAgIGlmKChqc0xvYWRlZCA9IHRydWUpICYmIChQYWdlQXBwID0gUGFnZUNsYXNzKSAmJiBjc3NMb2FkZWQpe1xuXG4gICAgICAgICAgICAvLyBJbnN0YWxsIFRoZSBMb2FkZWQgUmVzb3VyY2VzXG4gICAgICAgICAgICBpbnN0YWxsUmVzb3VyY2VzLmNhbGwocm91dGVyLCBQYWdlQXBwLCBhcHBOYW1lLCBpc0dsb2JhbCk7XG4gICAgICAgICAgICAvLyBSZS10cmlnZ2VyIHJvdXRlIHNvIHRoZSBuZXdseSBhZGRlZCByb3V0ZSBtYXkgZXhlY3V0ZSBpZiB0aGVyZSdzIGEgcm91dGUgbWF0Y2guXG4gICAgICAgICAgICAvLyBJZiBubyByb3V0ZXMgYXJlIG1hdGNoZWQsIGFwcCB3aWxsIGhpdCB3aWxkQ2FyZCByb3V0ZSB3aGljaCB3aWxsIHRoZW4gdHJpZ2dlciA0MDRcbiAgICAgICAgICAgIGlmKCFpc0dsb2JhbCAmJiByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCl7XG4gICAgICAgICAgICAgIEJhY2tib25lLmhpc3RvcnkubG9hZFVybChCYWNrYm9uZS5oaXN0b3J5LmZyYWdtZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoIWlzR2xvYmFsKXtcbiAgICAgICAgICAgICAgcm91dGVyLmNvbmZpZy50cmlnZ2VyT25GaXJzdExvYWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICB9XG5cbiAgLy8gUmVib3VuZFJvdXRlciBDb25zdHJ1Y3RvclxuICB2YXIgUmVib3VuZFJvdXRlciA9IEJhY2tib25lLlJvdXRlci5leHRlbmQoe1xuXG4gICAgcm91dGVzOiB7XG4gICAgICAnKnJvdXRlJzogJ3dpbGRjYXJkUm91dGUnXG4gICAgfSxcblxuICAgIC8vIENhbGxlZCB3aGVuIG5vIG1hdGNoaW5nIHJvdXRlcyBhcmUgZm91bmQuIEV4dHJhY3RzIHJvb3Qgcm91dGUgYW5kIGZldGNoZXMgaXQgcmVzb3VyY2VzXG4gICAgd2lsZGNhcmRSb3V0ZTogZnVuY3Rpb24ocm91dGUpIHtcbiAgICAgIHZhciBhcHBOYW1lLCBwcmltYXJ5Um91dGU7XG5cbiAgICAgIC8vIElmIGVtcHR5IHJvdXRlIHNlbnQsIHJvdXRlIGhvbWVcbiAgICAgIHJvdXRlID0gcm91dGUgfHwgJyc7XG5cbiAgICAgIC8vIEdldCBSb290IG9mIFJvdXRlXG4gICAgICBhcHBOYW1lID0gcHJpbWFyeVJvdXRlID0gKHJvdXRlKSA/IHJvdXRlLnNwbGl0KCcvJylbMF0gOiAnaW5kZXgnO1xuXG4gICAgICAvLyBGaW5kIEFueSBDdXN0b20gUm91dGUgTWFwcGluZ3NcbiAgICAgIF8uYW55KHRoaXMuY29uZmlnLmhhbmRsZXJzLCBmdW5jdGlvbihoYW5kbGVyKSB7XG4gICAgICAgIGlmIChoYW5kbGVyLnJvdXRlLnRlc3Qocm91dGUpKSB7XG4gICAgICAgICAgYXBwTmFtZSA9IGhhbmRsZXIucHJpbWFyeVJvdXRlO1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gSWYgUGFnZSBJcyBBbHJlYWR5IExvYWRlZCBUaGVuIFRoZSBSb3V0ZSBEb2VzIE5vdCBFeGlzdC4gNDA0IGFuZCBFeGl0LlxuICAgICAgaWYgKHRoaXMuY3VycmVudCAmJiB0aGlzLmN1cnJlbnQubmFtZSA9PT0gcHJpbWFyeVJvdXRlKSB7XG4gICAgICAgIHJldHVybiBCYWNrYm9uZS5oaXN0b3J5LmxvYWRVcmwoJzQwNCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBGZXRjaCBSZXNvdXJjZXNcbiAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LmFkZChcImxvYWRpbmdcIik7XG4gICAgICBmZXRjaFJlc291cmNlcy5jYWxsKHRoaXMsIGFwcE5hbWUsIHByaW1hcnlSb3V0ZSk7XG4gICAgfSxcblxuICAgIC8vIE9uIHN0YXJ0dXAsIHNhdmUgb3VyIGNvbmZpZyBvYmplY3QgYW5kIHN0YXJ0IHRoZSByb3V0ZXJcbiAgICBpbml0aWFsaXplOiBmdW5jdGlvbihvcHRpb25zKSB7XG5cbiAgICAgIC8vIFNhdmUgb3VyIGNvbmZpZyByZWZlcmFuY2VcbiAgICAgIHRoaXMuY29uZmlnID0gb3B0aW9ucy5jb25maWc7XG4gICAgICB0aGlzLmNvbmZpZy5oYW5kbGVycyA9IFtdO1xuXG4gICAgICB2YXIgcmVtb3RlVXJsID0gL14oW2Etel0rOil8XihcXC9cXC8pfF4oW15cXC9dK1xcLikvLFxuXG4gICAgICByb3V0ZXIgPSB0aGlzO1xuXG4gICAgICAvLyBDb252ZXJ0IG91ciByb3V0ZU1hcHBpbmdzIHRvIHJlZ2V4cHMgYW5kIHB1c2ggdG8gb3VyIGhhbmRsZXJzXG4gICAgICBfLmVhY2godGhpcy5jb25maWcucm91dGVNYXBwaW5nLCBmdW5jdGlvbih2YWx1ZSwgcm91dGUpe1xuICAgICAgICBpZiAoIV8uaXNSZWdFeHAocm91dGUpKSByb3V0ZSA9IHJvdXRlci5fcm91dGVUb1JlZ0V4cChyb3V0ZSk7XG4gICAgICAgIHJvdXRlci5jb25maWcuaGFuZGxlcnMudW5zaGlmdCh7IHJvdXRlOiByb3V0ZSwgcHJpbWFyeVJvdXRlOiB2YWx1ZSB9KTtcbiAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAvLyBOYXZpZ2F0ZSB0byByb3V0ZSBmb3IgYW55IGxpbmsgd2l0aCBhIHJlbGF0aXZlIGhyZWZcbiAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhJywgZnVuY3Rpb24oZSl7XG5cbiAgICAgICAgdmFyIHBhdGggPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcblxuICAgICAgICAvLyBJZiBwYXRoIGlzIG5vdCBhbiByZW1vdGUgdXJsLCBlbmRzIGluIC5bYS16XSwgb3IgYmxhbmssIHRyeSBhbmQgbmF2aWdhdGUgdG8gdGhhdCByb3V0ZS5cbiAgICAgICAgaWYoIHBhdGggJiYgcGF0aCAhPT0gJyMnICYmICFyZW1vdGVVcmwudGVzdChwYXRoKSApe1xuICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICByb3V0ZXIubmF2aWdhdGUocGF0aCwge3RyaWdnZXI6IHRydWV9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIEluc3RhbGwgb3VyIGdsb2JhbCBjb21wb25lbnRzXG4gICAgICBfLmVhY2godGhpcy5jb25maWcuZ2xvYmFsQ29tcG9uZW50cywgZnVuY3Rpb24oc2VsZWN0b3IsIHJvdXRlKXtcbiAgICAgICAgZmV0Y2hSZXNvdXJjZXMuY2FsbChyb3V0ZXIsIHJvdXRlLCByb3V0ZSwgc2VsZWN0b3IpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIExldCBhbGwgb2Ygb3VyIGNvbXBvbmVudHMgYWx3YXlzIGhhdmUgcmVmZXJhbmNlIHRvIG91ciByb3V0ZXJcbiAgICAgIFJlYm91bmQuQ29tcG9uZW50LnByb3RvdHlwZS5yb3V0ZXIgPSB0aGlzO1xuXG4gICAgICAvLyBTdGFydCB0aGUgaGlzdG9yeVxuICAgICAgQmFja2JvbmUuaGlzdG9yeS5zdGFydCh7XG4gICAgICAgIHB1c2hTdGF0ZTogdHJ1ZSxcbiAgICAgICAgcm9vdDogdGhpcy5jb25maWcucm9vdFxuICAgICAgfSk7XG5cbiAgICB9XG4gIH0pO1xuXG5leHBvcnQgZGVmYXVsdCBSZWJvdW5kUm91dGVyO1xuIiwiLy8gICAgIFJlYm91bmQuanMgMC4wLjQ3XG5cbi8vICAgICAoYykgMjAxNSBBZGFtIE1pbGxlclxuLy8gICAgIFJlYm91bmQgbWF5IGJlIGZyZWVseSBkaXN0cmlidXRlZCB1bmRlciB0aGUgTUlUIGxpY2Vuc2UuXG4vLyAgICAgRm9yIGFsbCBkZXRhaWxzIGFuZCBkb2N1bWVudGF0aW9uOlxuLy8gICAgIGh0dHA6Ly9yZWJvdW5kanMuY29tXG5cbi8vIFJlYm91bmQgUnVudGltZVxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBJZiBCYWNrYm9uZSBpc24ndCBwcmVzZXQgb24gdGhlIHBhZ2UgeWV0LCBvciBpZiBgd2luZG93LlJlYm91bmRgIGlzIGFscmVhZHlcbi8vIGluIHVzZSwgdGhyb3cgYW4gZXJyb3JcbmlmKCF3aW5kb3cuQmFja2JvbmUpIHRocm93IFwiQmFja2JvbmUgbXVzdCBiZSBvbiB0aGUgcGFnZSBmb3IgUmVib3VuZCB0byBsb2FkLlwiO1xuaWYoIXdpbmRvdy5SZWJvdW5kKSB0aHJvdyBcIkdsb2JhbCBSZWJvdW5kIG5hbWVzcGFjZSBhbHJlYWR5IHRha2VuLlwiO1xuXG4vLyBMb2FkIG91ciAqKlV0aWxzKiosIGhlbHBlciBlbnZpcm9ubWVudCwgKipSZWJvdW5kIERhdGEqKixcbi8vICoqUmVib3VuZCBDb21wb25lbnRzKiogYW5kIHRoZSAqKlJlYm91bmQgUm91dGVyKipcbmltcG9ydCB1dGlscyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcbmltcG9ydCBoZWxwZXJzIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9oZWxwZXJzXCI7XG5pbXBvcnQgeyBNb2RlbCwgQ29sbGVjdGlvbiwgQ29tcHV0ZWRQcm9wZXJ0eSB9IGZyb20gXCJyZWJvdW5kLWRhdGEvcmVib3VuZC1kYXRhXCI7XG5pbXBvcnQgQ29tcG9uZW50IGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9jb21wb25lbnRcIjtcbmltcG9ydCBSb3V0ZXIgZnJvbSBcInJlYm91bmQtcm91dGVyL3JlYm91bmQtcm91dGVyXCI7XG5cbi8vIElmIEJhY2tib25lIGRvZXNuJ3QgaGF2ZSBhbiBhamF4IG1ldGhvZCBmcm9tIGFuIGV4dGVybmFsIERPTSBsaWJyYXJ5LCB1c2Ugb3Vyc1xud2luZG93LkJhY2tib25lLmFqYXggPSB3aW5kb3cuQmFja2JvbmUuJCAmJiB3aW5kb3cuQmFja2JvbmUuJC5hamF4ICYmIHdpbmRvdy5CYWNrYm9uZS5hamF4IHx8IHV0aWxzLmFqYXg7XG5cbi8vIEZldGNoIFJlYm91bmQncyBDb25maWcgT2JqZWN0IGZyb20gUmVib3VuZCdzIGBzY3JpcHRgIHRhZ1xudmFyIENvbmZpZyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdSZWJvdW5kJykuaW5uZXJIVE1MO1xuXG4vLyBDcmVhdGUgR2xvYmFsIFJlYm91bmQgT2JqZWN0XG53aW5kb3cuUmVib3VuZCA9IHtcbiAgcmVnaXN0ZXJIZWxwZXI6IGhlbHBlcnMucmVnaXN0ZXJIZWxwZXIsXG4gIHJlZ2lzdGVyUGFydGlhbDogaGVscGVycy5yZWdpc3RlclBhcnRpYWwsXG4gIHJlZ2lzdGVyQ29tcG9uZW50OiBDb21wb25lbnQucmVnaXN0ZXIsXG4gIE1vZGVsOiBNb2RlbCxcbiAgQ29sbGVjdGlvbjogQ29sbGVjdGlvbixcbiAgQ29tcHV0ZWRQcm9wZXJ0eTogQ29tcHV0ZWRQcm9wZXJ0eSxcbiAgQ29tcG9uZW50OiBDb21wb25lbnRcbn07XG5cbi8vIFN0YXJ0IHRoZSByb3V0ZXIgaWYgYSBjb25maWcgb2JqZWN0IGlzIHByZXNldFxuaWYoQ29uZmlnKSB3aW5kb3cuUmVib3VuZC5yb3V0ZXIgPSBuZXcgUm91dGVyKHtjb25maWc6IEpTT04ucGFyc2UoQ29uZmlnKX0pO1xuXG5leHBvcnQgZGVmYXVsdCBSZWJvdW5kO1xuIiwiLypqc2hpbnQgLVcwNTQgKi9cbi8vIGpzaGludCBpZ25vcmU6IHN0YXJ0XG5cbiAgLy8gQSBzZWNvbmQgb3B0aW9uYWwgYXJndW1lbnQgY2FuIGJlIGdpdmVuIHRvIGZ1cnRoZXIgY29uZmlndXJlXG4gIC8vIHRoZSBwYXJzZXIgcHJvY2Vzcy4gVGhlc2Ugb3B0aW9ucyBhcmUgcmVjb2duaXplZDpcblxuICB2YXIgZXhwb3J0cyA9IHt9O1xuXG4gIHZhciBvcHRpb25zLCBpbnB1dCwgaW5wdXRMZW4sIHNvdXJjZUZpbGU7XG5cbiAgdmFyIGRlZmF1bHRPcHRpb25zID0gZXhwb3J0cy5kZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAvLyBgZWNtYVZlcnNpb25gIGluZGljYXRlcyB0aGUgRUNNQVNjcmlwdCB2ZXJzaW9uIHRvIHBhcnNlLiBNdXN0XG4gICAgLy8gYmUgZWl0aGVyIDMsIG9yIDUsIG9yIDYuIFRoaXMgaW5mbHVlbmNlcyBzdXBwb3J0IGZvciBzdHJpY3RcbiAgICAvLyBtb2RlLCB0aGUgc2V0IG9mIHJlc2VydmVkIHdvcmRzLCBzdXBwb3J0IGZvciBnZXR0ZXJzIGFuZFxuICAgIC8vIHNldHRlcnMgYW5kIG90aGVyIGZlYXR1cmVzLiBFUzYgc3VwcG9ydCBpcyBvbmx5IHBhcnRpYWwuXG4gICAgZWNtYVZlcnNpb246IDUsXG4gICAgLy8gVHVybiBvbiBgc3RyaWN0U2VtaWNvbG9uc2AgdG8gcHJldmVudCB0aGUgcGFyc2VyIGZyb20gZG9pbmdcbiAgICAvLyBhdXRvbWF0aWMgc2VtaWNvbG9uIGluc2VydGlvbi5cbiAgICBzdHJpY3RTZW1pY29sb25zOiBmYWxzZSxcbiAgICAvLyBXaGVuIGBhbGxvd1RyYWlsaW5nQ29tbWFzYCBpcyBmYWxzZSwgdGhlIHBhcnNlciB3aWxsIG5vdCBhbGxvd1xuICAgIC8vIHRyYWlsaW5nIGNvbW1hcyBpbiBhcnJheSBhbmQgb2JqZWN0IGxpdGVyYWxzLlxuICAgIGFsbG93VHJhaWxpbmdDb21tYXM6IHRydWUsXG4gICAgLy8gQnkgZGVmYXVsdCwgcmVzZXJ2ZWQgd29yZHMgYXJlIG5vdCBlbmZvcmNlZC4gRW5hYmxlXG4gICAgLy8gYGZvcmJpZFJlc2VydmVkYCB0byBlbmZvcmNlIHRoZW0uIFdoZW4gdGhpcyBvcHRpb24gaGFzIHRoZVxuICAgIC8vIHZhbHVlIFwiZXZlcnl3aGVyZVwiLCByZXNlcnZlZCB3b3JkcyBhbmQga2V5d29yZHMgY2FuIGFsc28gbm90IGJlXG4gICAgLy8gdXNlZCBhcyBwcm9wZXJ0eSBuYW1lcy5cbiAgICBmb3JiaWRSZXNlcnZlZDogZmFsc2UsXG4gICAgLy8gV2hlbiBlbmFibGVkLCBhIHJldHVybiBhdCB0aGUgdG9wIGxldmVsIGlzIG5vdCBjb25zaWRlcmVkIGFuXG4gICAgLy8gZXJyb3IuXG4gICAgYWxsb3dSZXR1cm5PdXRzaWRlRnVuY3Rpb246IGZhbHNlLFxuICAgIC8vIFdoZW4gYGxvY2F0aW9uc2AgaXMgb24sIGBsb2NgIHByb3BlcnRpZXMgaG9sZGluZyBvYmplY3RzIHdpdGhcbiAgICAvLyBgc3RhcnRgIGFuZCBgZW5kYCBwcm9wZXJ0aWVzIGluIGB7bGluZSwgY29sdW1ufWAgZm9ybSAod2l0aFxuICAgIC8vIGxpbmUgYmVpbmcgMS1iYXNlZCBhbmQgY29sdW1uIDAtYmFzZWQpIHdpbGwgYmUgYXR0YWNoZWQgdG8gdGhlXG4gICAgLy8gbm9kZXMuXG4gICAgbG9jYXRpb25zOiBmYWxzZSxcbiAgICAvLyBBIGZ1bmN0aW9uIGNhbiBiZSBwYXNzZWQgYXMgYG9uQ29tbWVudGAgb3B0aW9uLCB3aGljaCB3aWxsXG4gICAgLy8gY2F1c2UgQWNvcm4gdG8gY2FsbCB0aGF0IGZ1bmN0aW9uIHdpdGggYChibG9jaywgdGV4dCwgc3RhcnQsXG4gICAgLy8gZW5kKWAgcGFyYW1ldGVycyB3aGVuZXZlciBhIGNvbW1lbnQgaXMgc2tpcHBlZC4gYGJsb2NrYCBpcyBhXG4gICAgLy8gYm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdGhpcyBpcyBhIGJsb2NrIChgLyogKi9gKSBjb21tZW50LFxuICAgIC8vIGB0ZXh0YCBpcyB0aGUgY29udGVudCBvZiB0aGUgY29tbWVudCwgYW5kIGBzdGFydGAgYW5kIGBlbmRgIGFyZVxuICAgIC8vIGNoYXJhY3RlciBvZmZzZXRzIHRoYXQgZGVub3RlIHRoZSBzdGFydCBhbmQgZW5kIG9mIHRoZSBjb21tZW50LlxuICAgIC8vIFdoZW4gdGhlIGBsb2NhdGlvbnNgIG9wdGlvbiBpcyBvbiwgdHdvIG1vcmUgcGFyYW1ldGVycyBhcmVcbiAgICAvLyBwYXNzZWQsIHRoZSBmdWxsIGB7bGluZSwgY29sdW1ufWAgbG9jYXRpb25zIG9mIHRoZSBzdGFydCBhbmRcbiAgICAvLyBlbmQgb2YgdGhlIGNvbW1lbnRzLiBOb3RlIHRoYXQgeW91IGFyZSBub3QgYWxsb3dlZCB0byBjYWxsIHRoZVxuICAgIC8vIHBhcnNlciBmcm9tIHRoZSBjYWxsYmFja+KAlHRoYXQgd2lsbCBjb3JydXB0IGl0cyBpbnRlcm5hbCBzdGF0ZS5cbiAgICBvbkNvbW1lbnQ6IG51bGwsXG4gICAgLy8gTm9kZXMgaGF2ZSB0aGVpciBzdGFydCBhbmQgZW5kIGNoYXJhY3RlcnMgb2Zmc2V0cyByZWNvcmRlZCBpblxuICAgIC8vIGBzdGFydGAgYW5kIGBlbmRgIHByb3BlcnRpZXMgKGRpcmVjdGx5IG9uIHRoZSBub2RlLCByYXRoZXIgdGhhblxuICAgIC8vIHRoZSBgbG9jYCBvYmplY3QsIHdoaWNoIGhvbGRzIGxpbmUvY29sdW1uIGRhdGEuIFRvIGFsc28gYWRkIGFcbiAgICAvLyBbc2VtaS1zdGFuZGFyZGl6ZWRdW3JhbmdlXSBgcmFuZ2VgIHByb3BlcnR5IGhvbGRpbmcgYSBgW3N0YXJ0LFxuICAgIC8vIGVuZF1gIGFycmF5IHdpdGggdGhlIHNhbWUgbnVtYmVycywgc2V0IHRoZSBgcmFuZ2VzYCBvcHRpb24gdG9cbiAgICAvLyBgdHJ1ZWAuXG4gICAgLy9cbiAgICAvLyBbcmFuZ2VdOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD03NDU2NzhcbiAgICByYW5nZXM6IGZhbHNlLFxuICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRvIHBhcnNlIG11bHRpcGxlIGZpbGVzIGludG8gYSBzaW5nbGUgQVNUIGJ5XG4gICAgLy8gcGFzc2luZyB0aGUgdHJlZSBwcm9kdWNlZCBieSBwYXJzaW5nIHRoZSBmaXJzdCBmaWxlIGFzXG4gICAgLy8gYHByb2dyYW1gIG9wdGlvbiBpbiBzdWJzZXF1ZW50IHBhcnNlcy4gVGhpcyB3aWxsIGFkZCB0aGVcbiAgICAvLyB0b3BsZXZlbCBmb3JtcyBvZiB0aGUgcGFyc2VkIGZpbGUgdG8gdGhlIGBQcm9ncmFtYCAodG9wKSBub2RlXG4gICAgLy8gb2YgYW4gZXhpc3RpbmcgcGFyc2UgdHJlZS5cbiAgICBwcm9ncmFtOiBudWxsLFxuICAgIC8vIFdoZW4gYGxvY2F0aW9uc2AgaXMgb24sIHlvdSBjYW4gcGFzcyB0aGlzIHRvIHJlY29yZCB0aGUgc291cmNlXG4gICAgLy8gZmlsZSBpbiBldmVyeSBub2RlJ3MgYGxvY2Agb2JqZWN0LlxuICAgIHNvdXJjZUZpbGU6IG51bGwsXG4gICAgLy8gVGhpcyB2YWx1ZSwgaWYgZ2l2ZW4sIGlzIHN0b3JlZCBpbiBldmVyeSBub2RlLCB3aGV0aGVyXG4gICAgLy8gYGxvY2F0aW9uc2AgaXMgb24gb3Igb2ZmLlxuICAgIGRpcmVjdFNvdXJjZUZpbGU6IG51bGxcbiAgfTtcblxuICBmdW5jdGlvbiBzZXRPcHRpb25zKG9wdHMpIHtcbiAgICBvcHRpb25zID0gb3B0cyB8fCB7fTtcbiAgICBmb3IgKHZhciBvcHQgaW4gZGVmYXVsdE9wdGlvbnMpIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsIG9wdCkpXG4gICAgICBvcHRpb25zW29wdF0gPSBkZWZhdWx0T3B0aW9uc1tvcHRdO1xuICAgIHNvdXJjZUZpbGUgPSBvcHRpb25zLnNvdXJjZUZpbGUgfHwgbnVsbDtcblxuICAgIGlzS2V5d29yZCA9IG9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiA/IGlzRWNtYTZLZXl3b3JkIDogaXNFY21hNUFuZExlc3NLZXl3b3JkO1xuICB9XG5cbiAgLy8gVGhlIGBnZXRMaW5lSW5mb2AgZnVuY3Rpb24gaXMgbW9zdGx5IHVzZWZ1bCB3aGVuIHRoZVxuICAvLyBgbG9jYXRpb25zYCBvcHRpb24gaXMgb2ZmIChmb3IgcGVyZm9ybWFuY2UgcmVhc29ucykgYW5kIHlvdVxuICAvLyB3YW50IHRvIGZpbmQgdGhlIGxpbmUvY29sdW1uIHBvc2l0aW9uIGZvciBhIGdpdmVuIGNoYXJhY3RlclxuICAvLyBvZmZzZXQuIGBpbnB1dGAgc2hvdWxkIGJlIHRoZSBjb2RlIHN0cmluZyB0aGF0IHRoZSBvZmZzZXQgcmVmZXJzXG4gIC8vIGludG8uXG5cbiAgdmFyIGdldExpbmVJbmZvID0gZXhwb3J0cy5nZXRMaW5lSW5mbyA9IGZ1bmN0aW9uKGlucHV0LCBvZmZzZXQpIHtcbiAgICBmb3IgKHZhciBsaW5lID0gMSwgY3VyID0gMDs7KSB7XG4gICAgICBsaW5lQnJlYWsubGFzdEluZGV4ID0gY3VyO1xuICAgICAgdmFyIG1hdGNoID0gbGluZUJyZWFrLmV4ZWMoaW5wdXQpO1xuICAgICAgaWYgKG1hdGNoICYmIG1hdGNoLmluZGV4IDwgb2Zmc2V0KSB7XG4gICAgICAgICsrbGluZTtcbiAgICAgICAgY3VyID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG4gICAgICB9IGVsc2UgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiB7bGluZTogbGluZSwgY29sdW1uOiBvZmZzZXQgLSBjdXJ9O1xuICB9O1xuXG4gIC8vIEFjb3JuIGlzIG9yZ2FuaXplZCBhcyBhIHRva2VuaXplciBhbmQgYSByZWN1cnNpdmUtZGVzY2VudCBwYXJzZXIuXG4gIC8vIFRoZSBgdG9rZW5pemVgIGV4cG9ydCBwcm92aWRlcyBhbiBpbnRlcmZhY2UgdG8gdGhlIHRva2VuaXplci5cbiAgLy8gQmVjYXVzZSB0aGUgdG9rZW5pemVyIGlzIG9wdGltaXplZCBmb3IgYmVpbmcgZWZmaWNpZW50bHkgdXNlZCBieVxuICAvLyB0aGUgQWNvcm4gcGFyc2VyIGl0c2VsZiwgdGhpcyBpbnRlcmZhY2UgaXMgc29tZXdoYXQgY3J1ZGUgYW5kIG5vdFxuICAvLyB2ZXJ5IG1vZHVsYXIuIFBlcmZvcm1pbmcgYW5vdGhlciBwYXJzZSBvciBjYWxsIHRvIGB0b2tlbml6ZWAgd2lsbFxuICAvLyByZXNldCB0aGUgaW50ZXJuYWwgc3RhdGUsIGFuZCBpbnZhbGlkYXRlIGV4aXN0aW5nIHRva2VuaXplcnMuXG5cbiAgZXhwb3J0cy50b2tlbml6ZSA9IGZ1bmN0aW9uKGlucHQsIG9wdHMpIHtcbiAgICBpbnB1dCA9IFN0cmluZyhpbnB0KTsgaW5wdXRMZW4gPSBpbnB1dC5sZW5ndGg7XG4gICAgc2V0T3B0aW9ucyhvcHRzKTtcbiAgICBpbml0VG9rZW5TdGF0ZSgpO1xuXG4gICAgdmFyIHQgPSB7fTtcbiAgICBmdW5jdGlvbiBnZXRUb2tlbihmb3JjZVJlZ2V4cCkge1xuICAgICAgbGFzdEVuZCA9IHRva0VuZDtcbiAgICAgIHJlYWRUb2tlbihmb3JjZVJlZ2V4cCk7XG4gICAgICB0LnN0YXJ0ID0gdG9rU3RhcnQ7IHQuZW5kID0gdG9rRW5kO1xuICAgICAgdC5zdGFydExvYyA9IHRva1N0YXJ0TG9jOyB0LmVuZExvYyA9IHRva0VuZExvYztcbiAgICAgIHQudHlwZSA9IHRva1R5cGU7IHQudmFsdWUgPSB0b2tWYWw7XG4gICAgICByZXR1cm4gdDtcbiAgICB9XG4gICAgZ2V0VG9rZW4uanVtcFRvID0gZnVuY3Rpb24ocG9zLCByZUFsbG93ZWQpIHtcbiAgICAgIHRva1BvcyA9IHBvcztcbiAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgICB0b2tDdXJMaW5lID0gMTtcbiAgICAgICAgdG9rTGluZVN0YXJ0ID0gbGluZUJyZWFrLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIHZhciBtYXRjaDtcbiAgICAgICAgd2hpbGUgKChtYXRjaCA9IGxpbmVCcmVhay5leGVjKGlucHV0KSkgJiYgbWF0Y2guaW5kZXggPCBwb3MpIHtcbiAgICAgICAgICArK3Rva0N1ckxpbmU7XG4gICAgICAgICAgdG9rTGluZVN0YXJ0ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRva1JlZ2V4cEFsbG93ZWQgPSByZUFsbG93ZWQ7XG4gICAgICBza2lwU3BhY2UoKTtcbiAgICB9O1xuICAgIHJldHVybiBnZXRUb2tlbjtcbiAgfTtcblxuICAvLyBTdGF0ZSBpcyBrZXB0IGluIChjbG9zdXJlLSlnbG9iYWwgdmFyaWFibGVzLiBXZSBhbHJlYWR5IHNhdyB0aGVcbiAgLy8gYG9wdGlvbnNgLCBgaW5wdXRgLCBhbmQgYGlucHV0TGVuYCB2YXJpYWJsZXMgYWJvdmUuXG5cbiAgLy8gVGhlIGN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIHRva2VuaXplciBpbiB0aGUgaW5wdXQuXG5cbiAgdmFyIHRva1BvcztcblxuICAvLyBUaGUgc3RhcnQgYW5kIGVuZCBvZmZzZXRzIG9mIHRoZSBjdXJyZW50IHRva2VuLlxuXG4gIHZhciB0b2tTdGFydCwgdG9rRW5kO1xuXG4gIC8vIFdoZW4gYG9wdGlvbnMubG9jYXRpb25zYCBpcyB0cnVlLCB0aGVzZSBob2xkIG9iamVjdHNcbiAgLy8gY29udGFpbmluZyB0aGUgdG9rZW5zIHN0YXJ0IGFuZCBlbmQgbGluZS9jb2x1bW4gcGFpcnMuXG5cbiAgdmFyIHRva1N0YXJ0TG9jLCB0b2tFbmRMb2M7XG5cbiAgLy8gVGhlIHR5cGUgYW5kIHZhbHVlIG9mIHRoZSBjdXJyZW50IHRva2VuLiBUb2tlbiB0eXBlcyBhcmUgb2JqZWN0cyxcbiAgLy8gbmFtZWQgYnkgdmFyaWFibGVzIGFnYWluc3Qgd2hpY2ggdGhleSBjYW4gYmUgY29tcGFyZWQsIGFuZFxuICAvLyBob2xkaW5nIHByb3BlcnRpZXMgdGhhdCBkZXNjcmliZSB0aGVtIChpbmRpY2F0aW5nLCBmb3IgZXhhbXBsZSxcbiAgLy8gdGhlIHByZWNlZGVuY2Ugb2YgYW4gaW5maXggb3BlcmF0b3IsIGFuZCB0aGUgb3JpZ2luYWwgbmFtZSBvZiBhXG4gIC8vIGtleXdvcmQgdG9rZW4pLiBUaGUga2luZCBvZiB2YWx1ZSB0aGF0J3MgaGVsZCBpbiBgdG9rVmFsYCBkZXBlbmRzXG4gIC8vIG9uIHRoZSB0eXBlIG9mIHRoZSB0b2tlbi4gRm9yIGxpdGVyYWxzLCBpdCBpcyB0aGUgbGl0ZXJhbCB2YWx1ZSxcbiAgLy8gZm9yIG9wZXJhdG9ycywgdGhlIG9wZXJhdG9yIG5hbWUsIGFuZCBzbyBvbi5cblxuICB2YXIgdG9rVHlwZSwgdG9rVmFsO1xuXG4gIC8vIEludGVyYWwgc3RhdGUgZm9yIHRoZSB0b2tlbml6ZXIuIFRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gZGl2aXNpb25cbiAgLy8gb3BlcmF0b3JzIGFuZCByZWd1bGFyIGV4cHJlc3Npb25zLCBpdCByZW1lbWJlcnMgd2hldGhlciB0aGUgbGFzdFxuICAvLyB0b2tlbiB3YXMgb25lIHRoYXQgaXMgYWxsb3dlZCB0byBiZSBmb2xsb3dlZCBieSBhbiBleHByZXNzaW9uLlxuICAvLyAoSWYgaXQgaXMsIGEgc2xhc2ggaXMgcHJvYmFibHkgYSByZWdleHAsIGlmIGl0IGlzbid0IGl0J3MgYVxuICAvLyBkaXZpc2lvbiBvcGVyYXRvci4gU2VlIHRoZSBgcGFyc2VTdGF0ZW1lbnRgIGZ1bmN0aW9uIGZvciBhXG4gIC8vIGNhdmVhdC4pXG5cbiAgdmFyIHRva1JlZ2V4cEFsbG93ZWQ7XG5cbiAgLy8gV2hlbiBgb3B0aW9ucy5sb2NhdGlvbnNgIGlzIHRydWUsIHRoZXNlIGFyZSB1c2VkIHRvIGtlZXBcbiAgLy8gdHJhY2sgb2YgdGhlIGN1cnJlbnQgbGluZSwgYW5kIGtub3cgd2hlbiBhIG5ldyBsaW5lIGhhcyBiZWVuXG4gIC8vIGVudGVyZWQuXG5cbiAgdmFyIHRva0N1ckxpbmUsIHRva0xpbmVTdGFydDtcblxuICAvLyBUaGVzZSBzdG9yZSB0aGUgcG9zaXRpb24gb2YgdGhlIHByZXZpb3VzIHRva2VuLCB3aGljaCBpcyB1c2VmdWxcbiAgLy8gd2hlbiBmaW5pc2hpbmcgYSBub2RlIGFuZCBhc3NpZ25pbmcgaXRzIGBlbmRgIHBvc2l0aW9uLlxuXG4gIHZhciBsYXN0U3RhcnQsIGxhc3RFbmQsIGxhc3RFbmRMb2M7XG5cbiAgLy8gVGhpcyBpcyB0aGUgcGFyc2VyJ3Mgc3RhdGUuIGBpbkZ1bmN0aW9uYCBpcyB1c2VkIHRvIHJlamVjdFxuICAvLyBgcmV0dXJuYCBzdGF0ZW1lbnRzIG91dHNpZGUgb2YgZnVuY3Rpb25zLCBgbGFiZWxzYCB0byB2ZXJpZnkgdGhhdFxuICAvLyBgYnJlYWtgIGFuZCBgY29udGludWVgIGhhdmUgc29tZXdoZXJlIHRvIGp1bXAgdG8sIGFuZCBgc3RyaWN0YFxuICAvLyBpbmRpY2F0ZXMgd2hldGhlciBzdHJpY3QgbW9kZSBpcyBvbi5cblxuICB2YXIgaW5GdW5jdGlvbiwgbGFiZWxzLCBzdHJpY3Q7XG5cbiAgLy8gVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIHJhaXNlIGV4Y2VwdGlvbnMgb24gcGFyc2UgZXJyb3JzLiBJdFxuICAvLyB0YWtlcyBhbiBvZmZzZXQgaW50ZWdlciAoaW50byB0aGUgY3VycmVudCBgaW5wdXRgKSB0byBpbmRpY2F0ZVxuICAvLyB0aGUgbG9jYXRpb24gb2YgdGhlIGVycm9yLCBhdHRhY2hlcyB0aGUgcG9zaXRpb24gdG8gdGhlIGVuZFxuICAvLyBvZiB0aGUgZXJyb3IgbWVzc2FnZSwgYW5kIHRoZW4gcmFpc2VzIGEgYFN5bnRheEVycm9yYCB3aXRoIHRoYXRcbiAgLy8gbWVzc2FnZS5cblxuICBmdW5jdGlvbiByYWlzZShwb3MsIG1lc3NhZ2UpIHtcbiAgICB2YXIgbG9jID0gZ2V0TGluZUluZm8oaW5wdXQsIHBvcyk7XG4gICAgbWVzc2FnZSArPSBcIiAoXCIgKyBsb2MubGluZSArIFwiOlwiICsgbG9jLmNvbHVtbiArIFwiKVwiO1xuICAgIHZhciBlcnIgPSBuZXcgU3ludGF4RXJyb3IobWVzc2FnZSk7XG4gICAgZXJyLnBvcyA9IHBvczsgZXJyLmxvYyA9IGxvYzsgZXJyLnJhaXNlZEF0ID0gdG9rUG9zO1xuICAgIHRocm93IGVycjtcbiAgfVxuXG4gIC8vIFJldXNlZCBlbXB0eSBhcnJheSBhZGRlZCBmb3Igbm9kZSBmaWVsZHMgdGhhdCBhcmUgYWx3YXlzIGVtcHR5LlxuXG4gIHZhciBlbXB0eSA9IFtdO1xuXG4gIC8vICMjIFRva2VuIHR5cGVzXG5cbiAgLy8gVGhlIGFzc2lnbm1lbnQgb2YgZmluZS1ncmFpbmVkLCBpbmZvcm1hdGlvbi1jYXJyeWluZyB0eXBlIG9iamVjdHNcbiAgLy8gYWxsb3dzIHRoZSB0b2tlbml6ZXIgdG8gc3RvcmUgdGhlIGluZm9ybWF0aW9uIGl0IGhhcyBhYm91dCBhXG4gIC8vIHRva2VuIGluIGEgd2F5IHRoYXQgaXMgdmVyeSBjaGVhcCBmb3IgdGhlIHBhcnNlciB0byBsb29rIHVwLlxuXG4gIC8vIEFsbCB0b2tlbiB0eXBlIHZhcmlhYmxlcyBzdGFydCB3aXRoIGFuIHVuZGVyc2NvcmUsIHRvIG1ha2UgdGhlbVxuICAvLyBlYXN5IHRvIHJlY29nbml6ZS5cblxuICAvLyBUaGVzZSBhcmUgdGhlIGdlbmVyYWwgdHlwZXMuIFRoZSBgdHlwZWAgcHJvcGVydHkgaXMgb25seSB1c2VkIHRvXG4gIC8vIG1ha2UgdGhlbSByZWNvZ25pemVhYmxlIHdoZW4gZGVidWdnaW5nLlxuXG4gIHZhciBfbnVtID0ge3R5cGU6IFwibnVtXCJ9LCBfcmVnZXhwID0ge3R5cGU6IFwicmVnZXhwXCJ9LCBfc3RyaW5nID0ge3R5cGU6IFwic3RyaW5nXCJ9O1xuICB2YXIgX25hbWUgPSB7dHlwZTogXCJuYW1lXCJ9LCBfZW9mID0ge3R5cGU6IFwiZW9mXCJ9O1xuXG4gIC8vIEtleXdvcmQgdG9rZW5zLiBUaGUgYGtleXdvcmRgIHByb3BlcnR5IChhbHNvIHVzZWQgaW4ga2V5d29yZC1saWtlXG4gIC8vIG9wZXJhdG9ycykgaW5kaWNhdGVzIHRoYXQgdGhlIHRva2VuIG9yaWdpbmF0ZWQgZnJvbSBhblxuICAvLyBpZGVudGlmaWVyLWxpa2Ugd29yZCwgd2hpY2ggaXMgdXNlZCB3aGVuIHBhcnNpbmcgcHJvcGVydHkgbmFtZXMuXG4gIC8vXG4gIC8vIFRoZSBgYmVmb3JlRXhwcmAgcHJvcGVydHkgaXMgdXNlZCB0byBkaXNhbWJpZ3VhdGUgYmV0d2VlbiByZWd1bGFyXG4gIC8vIGV4cHJlc3Npb25zIGFuZCBkaXZpc2lvbnMuIEl0IGlzIHNldCBvbiBhbGwgdG9rZW4gdHlwZXMgdGhhdCBjYW5cbiAgLy8gYmUgZm9sbG93ZWQgYnkgYW4gZXhwcmVzc2lvbiAodGh1cywgYSBzbGFzaCBhZnRlciB0aGVtIHdvdWxkIGJlIGFcbiAgLy8gcmVndWxhciBleHByZXNzaW9uKS5cbiAgLy9cbiAgLy8gYGlzTG9vcGAgbWFya3MgYSBrZXl3b3JkIGFzIHN0YXJ0aW5nIGEgbG9vcCwgd2hpY2ggaXMgaW1wb3J0YW50XG4gIC8vIHRvIGtub3cgd2hlbiBwYXJzaW5nIGEgbGFiZWwsIGluIG9yZGVyIHRvIGFsbG93IG9yIGRpc2FsbG93XG4gIC8vIGNvbnRpbnVlIGp1bXBzIHRvIHRoYXQgbGFiZWwuXG5cbiAgdmFyIF9icmVhayA9IHtrZXl3b3JkOiBcImJyZWFrXCJ9LCBfY2FzZSA9IHtrZXl3b3JkOiBcImNhc2VcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9jYXRjaCA9IHtrZXl3b3JkOiBcImNhdGNoXCJ9O1xuICB2YXIgX2NvbnRpbnVlID0ge2tleXdvcmQ6IFwiY29udGludWVcIn0sIF9kZWJ1Z2dlciA9IHtrZXl3b3JkOiBcImRlYnVnZ2VyXCJ9LCBfZGVmYXVsdCA9IHtrZXl3b3JkOiBcImRlZmF1bHRcIn07XG4gIHZhciBfZG8gPSB7a2V5d29yZDogXCJkb1wiLCBpc0xvb3A6IHRydWV9LCBfZWxzZSA9IHtrZXl3b3JkOiBcImVsc2VcIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfZmluYWxseSA9IHtrZXl3b3JkOiBcImZpbmFsbHlcIn0sIF9mb3IgPSB7a2V5d29yZDogXCJmb3JcIiwgaXNMb29wOiB0cnVlfSwgX2Z1bmN0aW9uID0ge2tleXdvcmQ6IFwiZnVuY3Rpb25cIn07XG4gIHZhciBfaWYgPSB7a2V5d29yZDogXCJpZlwifSwgX3JldHVybiA9IHtrZXl3b3JkOiBcInJldHVyblwiLCBiZWZvcmVFeHByOiB0cnVlfSwgX3N3aXRjaCA9IHtrZXl3b3JkOiBcInN3aXRjaFwifTtcbiAgdmFyIF90aHJvdyA9IHtrZXl3b3JkOiBcInRocm93XCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfdHJ5ID0ge2tleXdvcmQ6IFwidHJ5XCJ9LCBfdmFyID0ge2tleXdvcmQ6IFwidmFyXCJ9O1xuICB2YXIgX2xldCA9IHtrZXl3b3JkOiBcImxldFwifSwgX2NvbnN0ID0ge2tleXdvcmQ6IFwiY29uc3RcIn07XG4gIHZhciBfd2hpbGUgPSB7a2V5d29yZDogXCJ3aGlsZVwiLCBpc0xvb3A6IHRydWV9LCBfd2l0aCA9IHtrZXl3b3JkOiBcIndpdGhcIn0sIF9uZXcgPSB7a2V5d29yZDogXCJuZXdcIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfdGhpcyA9IHtrZXl3b3JkOiBcInRoaXNcIn07XG5cbiAgLy8gVGhlIGtleXdvcmRzIHRoYXQgZGVub3RlIHZhbHVlcy5cblxuICB2YXIgX251bGwgPSB7a2V5d29yZDogXCJudWxsXCIsIGF0b21WYWx1ZTogbnVsbH0sIF90cnVlID0ge2tleXdvcmQ6IFwidHJ1ZVwiLCBhdG9tVmFsdWU6IHRydWV9O1xuICB2YXIgX2ZhbHNlID0ge2tleXdvcmQ6IFwiZmFsc2VcIiwgYXRvbVZhbHVlOiBmYWxzZX07XG5cbiAgLy8gU29tZSBrZXl3b3JkcyBhcmUgdHJlYXRlZCBhcyByZWd1bGFyIG9wZXJhdG9ycy4gYGluYCBzb21ldGltZXNcbiAgLy8gKHdoZW4gcGFyc2luZyBgZm9yYCkgbmVlZHMgdG8gYmUgdGVzdGVkIGFnYWluc3Qgc3BlY2lmaWNhbGx5LCBzb1xuICAvLyB3ZSBhc3NpZ24gYSB2YXJpYWJsZSBuYW1lIHRvIGl0IGZvciBxdWljayBjb21wYXJpbmcuXG5cbiAgdmFyIF9pbiA9IHtrZXl3b3JkOiBcImluXCIsIGJpbm9wOiA3LCBiZWZvcmVFeHByOiB0cnVlfTtcblxuICAvLyBNYXAga2V5d29yZCBuYW1lcyB0byB0b2tlbiB0eXBlcy5cblxuICB2YXIga2V5d29yZFR5cGVzID0ge1wiYnJlYWtcIjogX2JyZWFrLCBcImNhc2VcIjogX2Nhc2UsIFwiY2F0Y2hcIjogX2NhdGNoLFxuICAgICAgICAgICAgICAgICAgICAgIFwiY29udGludWVcIjogX2NvbnRpbnVlLCBcImRlYnVnZ2VyXCI6IF9kZWJ1Z2dlciwgXCJkZWZhdWx0XCI6IF9kZWZhdWx0LFxuICAgICAgICAgICAgICAgICAgICAgIFwiZG9cIjogX2RvLCBcImVsc2VcIjogX2Vsc2UsIFwiZmluYWxseVwiOiBfZmluYWxseSwgXCJmb3JcIjogX2ZvcixcbiAgICAgICAgICAgICAgICAgICAgICBcImZ1bmN0aW9uXCI6IF9mdW5jdGlvbiwgXCJpZlwiOiBfaWYsIFwicmV0dXJuXCI6IF9yZXR1cm4sIFwic3dpdGNoXCI6IF9zd2l0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgXCJ0aHJvd1wiOiBfdGhyb3csIFwidHJ5XCI6IF90cnksIFwidmFyXCI6IF92YXIsIFwibGV0XCI6IF9sZXQsIFwiY29uc3RcIjogX2NvbnN0LFxuICAgICAgICAgICAgICAgICAgICAgIFwid2hpbGVcIjogX3doaWxlLCBcIndpdGhcIjogX3dpdGgsXG4gICAgICAgICAgICAgICAgICAgICAgXCJudWxsXCI6IF9udWxsLCBcInRydWVcIjogX3RydWUsIFwiZmFsc2VcIjogX2ZhbHNlLCBcIm5ld1wiOiBfbmV3LCBcImluXCI6IF9pbixcbiAgICAgICAgICAgICAgICAgICAgICBcImluc3RhbmNlb2ZcIjoge2tleXdvcmQ6IFwiaW5zdGFuY2VvZlwiLCBiaW5vcDogNywgYmVmb3JlRXhwcjogdHJ1ZX0sIFwidGhpc1wiOiBfdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICBcInR5cGVvZlwiOiB7a2V5d29yZDogXCJ0eXBlb2ZcIiwgcHJlZml4OiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfSxcbiAgICAgICAgICAgICAgICAgICAgICBcInZvaWRcIjoge2tleXdvcmQ6IFwidm9pZFwiLCBwcmVmaXg6IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9LFxuICAgICAgICAgICAgICAgICAgICAgIFwiZGVsZXRlXCI6IHtrZXl3b3JkOiBcImRlbGV0ZVwiLCBwcmVmaXg6IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9fTtcblxuICAvLyBQdW5jdHVhdGlvbiB0b2tlbiB0eXBlcy4gQWdhaW4sIHRoZSBgdHlwZWAgcHJvcGVydHkgaXMgcHVyZWx5IGZvciBkZWJ1Z2dpbmcuXG5cbiAgdmFyIF9icmFja2V0TCA9IHt0eXBlOiBcIltcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9icmFja2V0UiA9IHt0eXBlOiBcIl1cIn0sIF9icmFjZUwgPSB7dHlwZTogXCJ7XCIsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2JyYWNlUiA9IHt0eXBlOiBcIn1cIn0sIF9wYXJlbkwgPSB7dHlwZTogXCIoXCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfcGFyZW5SID0ge3R5cGU6IFwiKVwifTtcbiAgdmFyIF9jb21tYSA9IHt0eXBlOiBcIixcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9zZW1pID0ge3R5cGU6IFwiO1wiLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9jb2xvbiA9IHt0eXBlOiBcIjpcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9kb3QgPSB7dHlwZTogXCIuXCJ9LCBfZWxsaXBzaXMgPSB7dHlwZTogXCIuLi5cIn0sIF9xdWVzdGlvbiA9IHt0eXBlOiBcIj9cIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG5cbiAgLy8gT3BlcmF0b3JzLiBUaGVzZSBjYXJyeSBzZXZlcmFsIGtpbmRzIG9mIHByb3BlcnRpZXMgdG8gaGVscCB0aGVcbiAgLy8gcGFyc2VyIHVzZSB0aGVtIHByb3Blcmx5ICh0aGUgcHJlc2VuY2Ugb2YgdGhlc2UgcHJvcGVydGllcyBpc1xuICAvLyB3aGF0IGNhdGVnb3JpemVzIHRoZW0gYXMgb3BlcmF0b3JzKS5cbiAgLy9cbiAgLy8gYGJpbm9wYCwgd2hlbiBwcmVzZW50LCBzcGVjaWZpZXMgdGhhdCB0aGlzIG9wZXJhdG9yIGlzIGEgYmluYXJ5XG4gIC8vIG9wZXJhdG9yLCBhbmQgd2lsbCByZWZlciB0byBpdHMgcHJlY2VkZW5jZS5cbiAgLy9cbiAgLy8gYHByZWZpeGAgYW5kIGBwb3N0Zml4YCBtYXJrIHRoZSBvcGVyYXRvciBhcyBhIHByZWZpeCBvciBwb3N0Zml4XG4gIC8vIHVuYXJ5IG9wZXJhdG9yLiBgaXNVcGRhdGVgIHNwZWNpZmllcyB0aGF0IHRoZSBub2RlIHByb2R1Y2VkIGJ5XG4gIC8vIHRoZSBvcGVyYXRvciBzaG91bGQgYmUgb2YgdHlwZSBVcGRhdGVFeHByZXNzaW9uIHJhdGhlciB0aGFuXG4gIC8vIHNpbXBseSBVbmFyeUV4cHJlc3Npb24gKGArK2AgYW5kIGAtLWApLlxuICAvL1xuICAvLyBgaXNBc3NpZ25gIG1hcmtzIGFsbCBvZiBgPWAsIGArPWAsIGAtPWAgZXRjZXRlcmEsIHdoaWNoIGFjdCBhc1xuICAvLyBiaW5hcnkgb3BlcmF0b3JzIHdpdGggYSB2ZXJ5IGxvdyBwcmVjZWRlbmNlLCB0aGF0IHNob3VsZCByZXN1bHRcbiAgLy8gaW4gQXNzaWdubWVudEV4cHJlc3Npb24gbm9kZXMuXG5cbiAgdmFyIF9zbGFzaCA9IHtiaW5vcDogMTAsIGJlZm9yZUV4cHI6IHRydWV9LCBfZXEgPSB7aXNBc3NpZ246IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2Fzc2lnbiA9IHtpc0Fzc2lnbjogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfaW5jRGVjID0ge3Bvc3RmaXg6IHRydWUsIHByZWZpeDogdHJ1ZSwgaXNVcGRhdGU6IHRydWV9LCBfcHJlZml4ID0ge3ByZWZpeDogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfbG9naWNhbE9SID0ge2Jpbm9wOiAxLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9sb2dpY2FsQU5EID0ge2Jpbm9wOiAyLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9iaXR3aXNlT1IgPSB7Ymlub3A6IDMsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2JpdHdpc2VYT1IgPSB7Ymlub3A6IDQsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2JpdHdpc2VBTkQgPSB7Ymlub3A6IDUsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2VxdWFsaXR5ID0ge2Jpbm9wOiA2LCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9yZWxhdGlvbmFsID0ge2Jpbm9wOiA3LCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9iaXRTaGlmdCA9IHtiaW5vcDogOCwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfcGx1c01pbiA9IHtiaW5vcDogOSwgcHJlZml4OiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9tdWx0aXBseU1vZHVsbyA9IHtiaW5vcDogMTAsIGJlZm9yZUV4cHI6IHRydWV9O1xuXG4gIC8vIFByb3ZpZGUgYWNjZXNzIHRvIHRoZSB0b2tlbiB0eXBlcyBmb3IgZXh0ZXJuYWwgdXNlcnMgb2YgdGhlXG4gIC8vIHRva2VuaXplci5cblxuICBleHBvcnRzLnRva1R5cGVzID0ge2JyYWNrZXRMOiBfYnJhY2tldEwsIGJyYWNrZXRSOiBfYnJhY2tldFIsIGJyYWNlTDogX2JyYWNlTCwgYnJhY2VSOiBfYnJhY2VSLFxuICAgICAgICAgICAgICAgICAgICAgIHBhcmVuTDogX3BhcmVuTCwgcGFyZW5SOiBfcGFyZW5SLCBjb21tYTogX2NvbW1hLCBzZW1pOiBfc2VtaSwgY29sb246IF9jb2xvbixcbiAgICAgICAgICAgICAgICAgICAgICBkb3Q6IF9kb3QsIGVsbGlwc2lzOiBfZWxsaXBzaXMsIHF1ZXN0aW9uOiBfcXVlc3Rpb24sIHNsYXNoOiBfc2xhc2gsIGVxOiBfZXEsXG4gICAgICAgICAgICAgICAgICAgICAgbmFtZTogX25hbWUsIGVvZjogX2VvZiwgbnVtOiBfbnVtLCByZWdleHA6IF9yZWdleHAsIHN0cmluZzogX3N0cmluZ307XG4gIGZvciAodmFyIGt3IGluIGtleXdvcmRUeXBlcykgZXhwb3J0cy50b2tUeXBlc1tcIl9cIiArIGt3XSA9IGtleXdvcmRUeXBlc1trd107XG5cbiAgLy8gVGhpcyBpcyBhIHRyaWNrIHRha2VuIGZyb20gRXNwcmltYS4gSXQgdHVybnMgb3V0IHRoYXQsIG9uXG4gIC8vIG5vbi1DaHJvbWUgYnJvd3NlcnMsIHRvIGNoZWNrIHdoZXRoZXIgYSBzdHJpbmcgaXMgaW4gYSBzZXQsIGFcbiAgLy8gcHJlZGljYXRlIGNvbnRhaW5pbmcgYSBiaWcgdWdseSBgc3dpdGNoYCBzdGF0ZW1lbnQgaXMgZmFzdGVyIHRoYW5cbiAgLy8gYSByZWd1bGFyIGV4cHJlc3Npb24sIGFuZCBvbiBDaHJvbWUgdGhlIHR3byBhcmUgYWJvdXQgb24gcGFyLlxuICAvLyBUaGlzIGZ1bmN0aW9uIHVzZXMgYGV2YWxgIChub24tbGV4aWNhbCkgdG8gcHJvZHVjZSBzdWNoIGFcbiAgLy8gcHJlZGljYXRlIGZyb20gYSBzcGFjZS1zZXBhcmF0ZWQgc3RyaW5nIG9mIHdvcmRzLlxuICAvL1xuICAvLyBJdCBzdGFydHMgYnkgc29ydGluZyB0aGUgd29yZHMgYnkgbGVuZ3RoLlxuXG4gIGZ1bmN0aW9uIG1ha2VQcmVkaWNhdGUod29yZHMpIHtcbiAgICB3b3JkcyA9IHdvcmRzLnNwbGl0KFwiIFwiKTtcbiAgICB2YXIgZiA9IFwiXCIsIGNhdHMgPSBbXTtcbiAgICBvdXQ6IGZvciAodmFyIGkgPSAwOyBpIDwgd29yZHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2F0cy5sZW5ndGg7ICsrailcbiAgICAgICAgaWYgKGNhdHNbal1bMF0ubGVuZ3RoID09IHdvcmRzW2ldLmxlbmd0aCkge1xuICAgICAgICAgIGNhdHNbal0ucHVzaCh3b3Jkc1tpXSk7XG4gICAgICAgICAgY29udGludWUgb3V0O1xuICAgICAgICB9XG4gICAgICBjYXRzLnB1c2goW3dvcmRzW2ldXSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNvbXBhcmVUbyhhcnIpIHtcbiAgICAgIGlmIChhcnIubGVuZ3RoID09IDEpIHJldHVybiBmICs9IFwicmV0dXJuIHN0ciA9PT0gXCIgKyBKU09OLnN0cmluZ2lmeShhcnJbMF0pICsgXCI7XCI7XG4gICAgICBmICs9IFwic3dpdGNoKHN0cil7XCI7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkgZiArPSBcImNhc2UgXCIgKyBKU09OLnN0cmluZ2lmeShhcnJbaV0pICsgXCI6XCI7XG4gICAgICBmICs9IFwicmV0dXJuIHRydWV9cmV0dXJuIGZhbHNlO1wiO1xuICAgIH1cblxuICAgIC8vIFdoZW4gdGhlcmUgYXJlIG1vcmUgdGhhbiB0aHJlZSBsZW5ndGggY2F0ZWdvcmllcywgYW4gb3V0ZXJcbiAgICAvLyBzd2l0Y2ggZmlyc3QgZGlzcGF0Y2hlcyBvbiB0aGUgbGVuZ3RocywgdG8gc2F2ZSBvbiBjb21wYXJpc29ucy5cblxuICAgIGlmIChjYXRzLmxlbmd0aCA+IDMpIHtcbiAgICAgIGNhdHMuc29ydChmdW5jdGlvbihhLCBiKSB7cmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7fSk7XG4gICAgICBmICs9IFwic3dpdGNoKHN0ci5sZW5ndGgpe1wiO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYXRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBjYXQgPSBjYXRzW2ldO1xuICAgICAgICBmICs9IFwiY2FzZSBcIiArIGNhdFswXS5sZW5ndGggKyBcIjpcIjtcbiAgICAgICAgY29tcGFyZVRvKGNhdCk7XG4gICAgICB9XG4gICAgICBmICs9IFwifVwiO1xuXG4gICAgLy8gT3RoZXJ3aXNlLCBzaW1wbHkgZ2VuZXJhdGUgYSBmbGF0IGBzd2l0Y2hgIHN0YXRlbWVudC5cblxuICAgIH0gZWxzZSB7XG4gICAgICBjb21wYXJlVG8od29yZHMpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKFwic3RyXCIsIGYpO1xuICB9XG5cbiAgLy8gVGhlIEVDTUFTY3JpcHQgMyByZXNlcnZlZCB3b3JkIGxpc3QuXG5cbiAgdmFyIGlzUmVzZXJ2ZWRXb3JkMyA9IG1ha2VQcmVkaWNhdGUoXCJhYnN0cmFjdCBib29sZWFuIGJ5dGUgY2hhciBjbGFzcyBkb3VibGUgZW51bSBleHBvcnQgZXh0ZW5kcyBmaW5hbCBmbG9hdCBnb3RvIGltcGxlbWVudHMgaW1wb3J0IGludCBpbnRlcmZhY2UgbG9uZyBuYXRpdmUgcGFja2FnZSBwcml2YXRlIHByb3RlY3RlZCBwdWJsaWMgc2hvcnQgc3RhdGljIHN1cGVyIHN5bmNocm9uaXplZCB0aHJvd3MgdHJhbnNpZW50IHZvbGF0aWxlXCIpO1xuXG4gIC8vIEVDTUFTY3JpcHQgNSByZXNlcnZlZCB3b3Jkcy5cblxuICB2YXIgaXNSZXNlcnZlZFdvcmQ1ID0gbWFrZVByZWRpY2F0ZShcImNsYXNzIGVudW0gZXh0ZW5kcyBzdXBlciBjb25zdCBleHBvcnQgaW1wb3J0XCIpO1xuXG4gIC8vIFRoZSBhZGRpdGlvbmFsIHJlc2VydmVkIHdvcmRzIGluIHN0cmljdCBtb2RlLlxuXG4gIHZhciBpc1N0cmljdFJlc2VydmVkV29yZCA9IG1ha2VQcmVkaWNhdGUoXCJpbXBsZW1lbnRzIGludGVyZmFjZSBsZXQgcGFja2FnZSBwcml2YXRlIHByb3RlY3RlZCBwdWJsaWMgc3RhdGljIHlpZWxkXCIpO1xuXG4gIC8vIFRoZSBmb3JiaWRkZW4gdmFyaWFibGUgbmFtZXMgaW4gc3RyaWN0IG1vZGUuXG5cbiAgdmFyIGlzU3RyaWN0QmFkSWRXb3JkID0gbWFrZVByZWRpY2F0ZShcImV2YWwgYXJndW1lbnRzXCIpO1xuXG4gIC8vIEFuZCB0aGUga2V5d29yZHMuXG5cbiAgdmFyIGVjbWE1QW5kTGVzc0tleXdvcmRzID0gXCJicmVhayBjYXNlIGNhdGNoIGNvbnRpbnVlIGRlYnVnZ2VyIGRlZmF1bHQgZG8gZWxzZSBmaW5hbGx5IGZvciBmdW5jdGlvbiBpZiByZXR1cm4gc3dpdGNoIHRocm93IHRyeSB2YXIgd2hpbGUgd2l0aCBudWxsIHRydWUgZmFsc2UgaW5zdGFuY2VvZiB0eXBlb2Ygdm9pZCBkZWxldGUgbmV3IGluIHRoaXNcIjtcblxuICB2YXIgaXNFY21hNUFuZExlc3NLZXl3b3JkID0gbWFrZVByZWRpY2F0ZShlY21hNUFuZExlc3NLZXl3b3Jkcyk7XG5cbiAgdmFyIGlzRWNtYTZLZXl3b3JkID0gbWFrZVByZWRpY2F0ZShlY21hNUFuZExlc3NLZXl3b3JkcyArIFwiIGxldCBjb25zdFwiKTtcblxuICB2YXIgaXNLZXl3b3JkID0gaXNFY21hNUFuZExlc3NLZXl3b3JkO1xuXG4gIC8vICMjIENoYXJhY3RlciBjYXRlZ29yaWVzXG5cbiAgLy8gQmlnIHVnbHkgcmVndWxhciBleHByZXNzaW9ucyB0aGF0IG1hdGNoIGNoYXJhY3RlcnMgaW4gdGhlXG4gIC8vIHdoaXRlc3BhY2UsIGlkZW50aWZpZXIsIGFuZCBpZGVudGlmaWVyLXN0YXJ0IGNhdGVnb3JpZXMuIFRoZXNlXG4gIC8vIGFyZSBvbmx5IGFwcGxpZWQgd2hlbiBhIGNoYXJhY3RlciBpcyBmb3VuZCB0byBhY3R1YWxseSBoYXZlIGFcbiAgLy8gY29kZSBwb2ludCBhYm92ZSAxMjguXG5cbiAgdmFyIG5vbkFTQ0lJd2hpdGVzcGFjZSA9IC9bXFx1MTY4MFxcdTE4MGVcXHUyMDAwLVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHVmZWZmXS87XG4gIHZhciBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzID0gXCJcXHhhYVxceGI1XFx4YmFcXHhjMC1cXHhkNlxceGQ4LVxceGY2XFx4ZjgtXFx1MDJjMVxcdTAyYzYtXFx1MDJkMVxcdTAyZTAtXFx1MDJlNFxcdTAyZWNcXHUwMmVlXFx1MDM3MC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdhLVxcdTAzN2RcXHUwMzg2XFx1MDM4OC1cXHUwMzhhXFx1MDM4Y1xcdTAzOGUtXFx1MDNhMVxcdTAzYTMtXFx1MDNmNVxcdTAzZjctXFx1MDQ4MVxcdTA0OGEtXFx1MDUyN1xcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNWQwLVxcdTA1ZWFcXHUwNWYwLVxcdTA1ZjJcXHUwNjIwLVxcdTA2NGFcXHUwNjZlXFx1MDY2ZlxcdTA2NzEtXFx1MDZkM1xcdTA2ZDVcXHUwNmU1XFx1MDZlNlxcdTA2ZWVcXHUwNmVmXFx1MDZmYS1cXHUwNmZjXFx1MDZmZlxcdTA3MTBcXHUwNzEyLVxcdTA3MmZcXHUwNzRkLVxcdTA3YTVcXHUwN2IxXFx1MDdjYS1cXHUwN2VhXFx1MDdmNFxcdTA3ZjVcXHUwN2ZhXFx1MDgwMC1cXHUwODE1XFx1MDgxYVxcdTA4MjRcXHUwODI4XFx1MDg0MC1cXHUwODU4XFx1MDhhMFxcdTA4YTItXFx1MDhhY1xcdTA5MDQtXFx1MDkzOVxcdTA5M2RcXHUwOTUwXFx1MDk1OC1cXHUwOTYxXFx1MDk3MS1cXHUwOTc3XFx1MDk3OS1cXHUwOTdmXFx1MDk4NS1cXHUwOThjXFx1MDk4ZlxcdTA5OTBcXHUwOTkzLVxcdTA5YThcXHUwOWFhLVxcdTA5YjBcXHUwOWIyXFx1MDliNi1cXHUwOWI5XFx1MDliZFxcdTA5Y2VcXHUwOWRjXFx1MDlkZFxcdTA5ZGYtXFx1MDllMVxcdTA5ZjBcXHUwOWYxXFx1MGEwNS1cXHUwYTBhXFx1MGEwZlxcdTBhMTBcXHUwYTEzLVxcdTBhMjhcXHUwYTJhLVxcdTBhMzBcXHUwYTMyXFx1MGEzM1xcdTBhMzVcXHUwYTM2XFx1MGEzOFxcdTBhMzlcXHUwYTU5LVxcdTBhNWNcXHUwYTVlXFx1MGE3Mi1cXHUwYTc0XFx1MGE4NS1cXHUwYThkXFx1MGE4Zi1cXHUwYTkxXFx1MGE5My1cXHUwYWE4XFx1MGFhYS1cXHUwYWIwXFx1MGFiMlxcdTBhYjNcXHUwYWI1LVxcdTBhYjlcXHUwYWJkXFx1MGFkMFxcdTBhZTBcXHUwYWUxXFx1MGIwNS1cXHUwYjBjXFx1MGIwZlxcdTBiMTBcXHUwYjEzLVxcdTBiMjhcXHUwYjJhLVxcdTBiMzBcXHUwYjMyXFx1MGIzM1xcdTBiMzUtXFx1MGIzOVxcdTBiM2RcXHUwYjVjXFx1MGI1ZFxcdTBiNWYtXFx1MGI2MVxcdTBiNzFcXHUwYjgzXFx1MGI4NS1cXHUwYjhhXFx1MGI4ZS1cXHUwYjkwXFx1MGI5Mi1cXHUwYjk1XFx1MGI5OVxcdTBiOWFcXHUwYjljXFx1MGI5ZVxcdTBiOWZcXHUwYmEzXFx1MGJhNFxcdTBiYTgtXFx1MGJhYVxcdTBiYWUtXFx1MGJiOVxcdTBiZDBcXHUwYzA1LVxcdTBjMGNcXHUwYzBlLVxcdTBjMTBcXHUwYzEyLVxcdTBjMjhcXHUwYzJhLVxcdTBjMzNcXHUwYzM1LVxcdTBjMzlcXHUwYzNkXFx1MGM1OFxcdTBjNTlcXHUwYzYwXFx1MGM2MVxcdTBjODUtXFx1MGM4Y1xcdTBjOGUtXFx1MGM5MFxcdTBjOTItXFx1MGNhOFxcdTBjYWEtXFx1MGNiM1xcdTBjYjUtXFx1MGNiOVxcdTBjYmRcXHUwY2RlXFx1MGNlMFxcdTBjZTFcXHUwY2YxXFx1MGNmMlxcdTBkMDUtXFx1MGQwY1xcdTBkMGUtXFx1MGQxMFxcdTBkMTItXFx1MGQzYVxcdTBkM2RcXHUwZDRlXFx1MGQ2MFxcdTBkNjFcXHUwZDdhLVxcdTBkN2ZcXHUwZDg1LVxcdTBkOTZcXHUwZDlhLVxcdTBkYjFcXHUwZGIzLVxcdTBkYmJcXHUwZGJkXFx1MGRjMC1cXHUwZGM2XFx1MGUwMS1cXHUwZTMwXFx1MGUzMlxcdTBlMzNcXHUwZTQwLVxcdTBlNDZcXHUwZTgxXFx1MGU4MlxcdTBlODRcXHUwZTg3XFx1MGU4OFxcdTBlOGFcXHUwZThkXFx1MGU5NC1cXHUwZTk3XFx1MGU5OS1cXHUwZTlmXFx1MGVhMS1cXHUwZWEzXFx1MGVhNVxcdTBlYTdcXHUwZWFhXFx1MGVhYlxcdTBlYWQtXFx1MGViMFxcdTBlYjJcXHUwZWIzXFx1MGViZFxcdTBlYzAtXFx1MGVjNFxcdTBlYzZcXHUwZWRjLVxcdTBlZGZcXHUwZjAwXFx1MGY0MC1cXHUwZjQ3XFx1MGY0OS1cXHUwZjZjXFx1MGY4OC1cXHUwZjhjXFx1MTAwMC1cXHUxMDJhXFx1MTAzZlxcdTEwNTAtXFx1MTA1NVxcdTEwNWEtXFx1MTA1ZFxcdTEwNjFcXHUxMDY1XFx1MTA2NlxcdTEwNmUtXFx1MTA3MFxcdTEwNzUtXFx1MTA4MVxcdTEwOGVcXHUxMGEwLVxcdTEwYzVcXHUxMGM3XFx1MTBjZFxcdTEwZDAtXFx1MTBmYVxcdTEwZmMtXFx1MTI0OFxcdTEyNGEtXFx1MTI0ZFxcdTEyNTAtXFx1MTI1NlxcdTEyNThcXHUxMjVhLVxcdTEyNWRcXHUxMjYwLVxcdTEyODhcXHUxMjhhLVxcdTEyOGRcXHUxMjkwLVxcdTEyYjBcXHUxMmIyLVxcdTEyYjVcXHUxMmI4LVxcdTEyYmVcXHUxMmMwXFx1MTJjMi1cXHUxMmM1XFx1MTJjOC1cXHUxMmQ2XFx1MTJkOC1cXHUxMzEwXFx1MTMxMi1cXHUxMzE1XFx1MTMxOC1cXHUxMzVhXFx1MTM4MC1cXHUxMzhmXFx1MTNhMC1cXHUxM2Y0XFx1MTQwMS1cXHUxNjZjXFx1MTY2Zi1cXHUxNjdmXFx1MTY4MS1cXHUxNjlhXFx1MTZhMC1cXHUxNmVhXFx1MTZlZS1cXHUxNmYwXFx1MTcwMC1cXHUxNzBjXFx1MTcwZS1cXHUxNzExXFx1MTcyMC1cXHUxNzMxXFx1MTc0MC1cXHUxNzUxXFx1MTc2MC1cXHUxNzZjXFx1MTc2ZS1cXHUxNzcwXFx1MTc4MC1cXHUxN2IzXFx1MTdkN1xcdTE3ZGNcXHUxODIwLVxcdTE4NzdcXHUxODgwLVxcdTE4YThcXHUxOGFhXFx1MThiMC1cXHUxOGY1XFx1MTkwMC1cXHUxOTFjXFx1MTk1MC1cXHUxOTZkXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOWFiXFx1MTljMS1cXHUxOWM3XFx1MWEwMC1cXHUxYTE2XFx1MWEyMC1cXHUxYTU0XFx1MWFhN1xcdTFiMDUtXFx1MWIzM1xcdTFiNDUtXFx1MWI0YlxcdTFiODMtXFx1MWJhMFxcdTFiYWVcXHUxYmFmXFx1MWJiYS1cXHUxYmU1XFx1MWMwMC1cXHUxYzIzXFx1MWM0ZC1cXHUxYzRmXFx1MWM1YS1cXHUxYzdkXFx1MWNlOS1cXHUxY2VjXFx1MWNlZS1cXHUxY2YxXFx1MWNmNVxcdTFjZjZcXHUxZDAwLVxcdTFkYmZcXHUxZTAwLVxcdTFmMTVcXHUxZjE4LVxcdTFmMWRcXHUxZjIwLVxcdTFmNDVcXHUxZjQ4LVxcdTFmNGRcXHUxZjUwLVxcdTFmNTdcXHUxZjU5XFx1MWY1YlxcdTFmNWRcXHUxZjVmLVxcdTFmN2RcXHUxZjgwLVxcdTFmYjRcXHUxZmI2LVxcdTFmYmNcXHUxZmJlXFx1MWZjMi1cXHUxZmM0XFx1MWZjNi1cXHUxZmNjXFx1MWZkMC1cXHUxZmQzXFx1MWZkNi1cXHUxZmRiXFx1MWZlMC1cXHUxZmVjXFx1MWZmMi1cXHUxZmY0XFx1MWZmNi1cXHUxZmZjXFx1MjA3MVxcdTIwN2ZcXHUyMDkwLVxcdTIwOWNcXHUyMTAyXFx1MjEwN1xcdTIxMGEtXFx1MjExM1xcdTIxMTVcXHUyMTE5LVxcdTIxMWRcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJhLVxcdTIxMmRcXHUyMTJmLVxcdTIxMzlcXHUyMTNjLVxcdTIxM2ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRlXFx1MjE2MC1cXHUyMTg4XFx1MmMwMC1cXHUyYzJlXFx1MmMzMC1cXHUyYzVlXFx1MmM2MC1cXHUyY2U0XFx1MmNlYi1cXHUyY2VlXFx1MmNmMlxcdTJjZjNcXHUyZDAwLVxcdTJkMjVcXHUyZDI3XFx1MmQyZFxcdTJkMzAtXFx1MmQ2N1xcdTJkNmZcXHUyZDgwLVxcdTJkOTZcXHUyZGEwLVxcdTJkYTZcXHUyZGE4LVxcdTJkYWVcXHUyZGIwLVxcdTJkYjZcXHUyZGI4LVxcdTJkYmVcXHUyZGMwLVxcdTJkYzZcXHUyZGM4LVxcdTJkY2VcXHUyZGQwLVxcdTJkZDZcXHUyZGQ4LVxcdTJkZGVcXHUyZTJmXFx1MzAwNS1cXHUzMDA3XFx1MzAyMS1cXHUzMDI5XFx1MzAzMS1cXHUzMDM1XFx1MzAzOC1cXHUzMDNjXFx1MzA0MS1cXHUzMDk2XFx1MzA5ZC1cXHUzMDlmXFx1MzBhMS1cXHUzMGZhXFx1MzBmYy1cXHUzMGZmXFx1MzEwNS1cXHUzMTJkXFx1MzEzMS1cXHUzMThlXFx1MzFhMC1cXHUzMWJhXFx1MzFmMC1cXHUzMWZmXFx1MzQwMC1cXHU0ZGI1XFx1NGUwMC1cXHU5ZmNjXFx1YTAwMC1cXHVhNDhjXFx1YTRkMC1cXHVhNGZkXFx1YTUwMC1cXHVhNjBjXFx1YTYxMC1cXHVhNjFmXFx1YTYyYVxcdWE2MmJcXHVhNjQwLVxcdWE2NmVcXHVhNjdmLVxcdWE2OTdcXHVhNmEwLVxcdWE2ZWZcXHVhNzE3LVxcdWE3MWZcXHVhNzIyLVxcdWE3ODhcXHVhNzhiLVxcdWE3OGVcXHVhNzkwLVxcdWE3OTNcXHVhN2EwLVxcdWE3YWFcXHVhN2Y4LVxcdWE4MDFcXHVhODAzLVxcdWE4MDVcXHVhODA3LVxcdWE4MGFcXHVhODBjLVxcdWE4MjJcXHVhODQwLVxcdWE4NzNcXHVhODgyLVxcdWE4YjNcXHVhOGYyLVxcdWE4ZjdcXHVhOGZiXFx1YTkwYS1cXHVhOTI1XFx1YTkzMC1cXHVhOTQ2XFx1YTk2MC1cXHVhOTdjXFx1YTk4NC1cXHVhOWIyXFx1YTljZlxcdWFhMDAtXFx1YWEyOFxcdWFhNDAtXFx1YWE0MlxcdWFhNDQtXFx1YWE0YlxcdWFhNjAtXFx1YWE3NlxcdWFhN2FcXHVhYTgwLVxcdWFhYWZcXHVhYWIxXFx1YWFiNVxcdWFhYjZcXHVhYWI5LVxcdWFhYmRcXHVhYWMwXFx1YWFjMlxcdWFhZGItXFx1YWFkZFxcdWFhZTAtXFx1YWFlYVxcdWFhZjItXFx1YWFmNFxcdWFiMDEtXFx1YWIwNlxcdWFiMDktXFx1YWIwZVxcdWFiMTEtXFx1YWIxNlxcdWFiMjAtXFx1YWIyNlxcdWFiMjgtXFx1YWIyZVxcdWFiYzAtXFx1YWJlMlxcdWFjMDAtXFx1ZDdhM1xcdWQ3YjAtXFx1ZDdjNlxcdWQ3Y2ItXFx1ZDdmYlxcdWY5MDAtXFx1ZmE2ZFxcdWZhNzAtXFx1ZmFkOVxcdWZiMDAtXFx1ZmIwNlxcdWZiMTMtXFx1ZmIxN1xcdWZiMWRcXHVmYjFmLVxcdWZiMjhcXHVmYjJhLVxcdWZiMzZcXHVmYjM4LVxcdWZiM2NcXHVmYjNlXFx1ZmI0MFxcdWZiNDFcXHVmYjQzXFx1ZmI0NFxcdWZiNDYtXFx1ZmJiMVxcdWZiZDMtXFx1ZmQzZFxcdWZkNTAtXFx1ZmQ4ZlxcdWZkOTItXFx1ZmRjN1xcdWZkZjAtXFx1ZmRmYlxcdWZlNzAtXFx1ZmU3NFxcdWZlNzYtXFx1ZmVmY1xcdWZmMjEtXFx1ZmYzYVxcdWZmNDEtXFx1ZmY1YVxcdWZmNjYtXFx1ZmZiZVxcdWZmYzItXFx1ZmZjN1xcdWZmY2EtXFx1ZmZjZlxcdWZmZDItXFx1ZmZkN1xcdWZmZGEtXFx1ZmZkY1wiO1xuICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyQ2hhcnMgPSBcIlxcdTAzMDAtXFx1MDM2ZlxcdTA0ODMtXFx1MDQ4N1xcdTA1OTEtXFx1MDViZFxcdTA1YmZcXHUwNWMxXFx1MDVjMlxcdTA1YzRcXHUwNWM1XFx1MDVjN1xcdTA2MTAtXFx1MDYxYVxcdTA2MjAtXFx1MDY0OVxcdTA2NzItXFx1MDZkM1xcdTA2ZTctXFx1MDZlOFxcdTA2ZmItXFx1MDZmY1xcdTA3MzAtXFx1MDc0YVxcdTA4MDAtXFx1MDgxNFxcdTA4MWItXFx1MDgyM1xcdTA4MjUtXFx1MDgyN1xcdTA4MjktXFx1MDgyZFxcdTA4NDAtXFx1MDg1N1xcdTA4ZTQtXFx1MDhmZVxcdTA5MDAtXFx1MDkwM1xcdTA5M2EtXFx1MDkzY1xcdTA5M2UtXFx1MDk0ZlxcdTA5NTEtXFx1MDk1N1xcdTA5NjItXFx1MDk2M1xcdTA5NjYtXFx1MDk2ZlxcdTA5ODEtXFx1MDk4M1xcdTA5YmNcXHUwOWJlLVxcdTA5YzRcXHUwOWM3XFx1MDljOFxcdTA5ZDdcXHUwOWRmLVxcdTA5ZTBcXHUwYTAxLVxcdTBhMDNcXHUwYTNjXFx1MGEzZS1cXHUwYTQyXFx1MGE0N1xcdTBhNDhcXHUwYTRiLVxcdTBhNGRcXHUwYTUxXFx1MGE2Ni1cXHUwYTcxXFx1MGE3NVxcdTBhODEtXFx1MGE4M1xcdTBhYmNcXHUwYWJlLVxcdTBhYzVcXHUwYWM3LVxcdTBhYzlcXHUwYWNiLVxcdTBhY2RcXHUwYWUyLVxcdTBhZTNcXHUwYWU2LVxcdTBhZWZcXHUwYjAxLVxcdTBiMDNcXHUwYjNjXFx1MGIzZS1cXHUwYjQ0XFx1MGI0N1xcdTBiNDhcXHUwYjRiLVxcdTBiNGRcXHUwYjU2XFx1MGI1N1xcdTBiNWYtXFx1MGI2MFxcdTBiNjYtXFx1MGI2ZlxcdTBiODJcXHUwYmJlLVxcdTBiYzJcXHUwYmM2LVxcdTBiYzhcXHUwYmNhLVxcdTBiY2RcXHUwYmQ3XFx1MGJlNi1cXHUwYmVmXFx1MGMwMS1cXHUwYzAzXFx1MGM0Ni1cXHUwYzQ4XFx1MGM0YS1cXHUwYzRkXFx1MGM1NVxcdTBjNTZcXHUwYzYyLVxcdTBjNjNcXHUwYzY2LVxcdTBjNmZcXHUwYzgyXFx1MGM4M1xcdTBjYmNcXHUwY2JlLVxcdTBjYzRcXHUwY2M2LVxcdTBjYzhcXHUwY2NhLVxcdTBjY2RcXHUwY2Q1XFx1MGNkNlxcdTBjZTItXFx1MGNlM1xcdTBjZTYtXFx1MGNlZlxcdTBkMDJcXHUwZDAzXFx1MGQ0Ni1cXHUwZDQ4XFx1MGQ1N1xcdTBkNjItXFx1MGQ2M1xcdTBkNjYtXFx1MGQ2ZlxcdTBkODJcXHUwZDgzXFx1MGRjYVxcdTBkY2YtXFx1MGRkNFxcdTBkZDZcXHUwZGQ4LVxcdTBkZGZcXHUwZGYyXFx1MGRmM1xcdTBlMzQtXFx1MGUzYVxcdTBlNDAtXFx1MGU0NVxcdTBlNTAtXFx1MGU1OVxcdTBlYjQtXFx1MGViOVxcdTBlYzgtXFx1MGVjZFxcdTBlZDAtXFx1MGVkOVxcdTBmMThcXHUwZjE5XFx1MGYyMC1cXHUwZjI5XFx1MGYzNVxcdTBmMzdcXHUwZjM5XFx1MGY0MS1cXHUwZjQ3XFx1MGY3MS1cXHUwZjg0XFx1MGY4Ni1cXHUwZjg3XFx1MGY4ZC1cXHUwZjk3XFx1MGY5OS1cXHUwZmJjXFx1MGZjNlxcdTEwMDAtXFx1MTAyOVxcdTEwNDAtXFx1MTA0OVxcdTEwNjctXFx1MTA2ZFxcdTEwNzEtXFx1MTA3NFxcdTEwODItXFx1MTA4ZFxcdTEwOGYtXFx1MTA5ZFxcdTEzNWQtXFx1MTM1ZlxcdTE3MGUtXFx1MTcxMFxcdTE3MjAtXFx1MTczMFxcdTE3NDAtXFx1MTc1MFxcdTE3NzJcXHUxNzczXFx1MTc4MC1cXHUxN2IyXFx1MTdkZFxcdTE3ZTAtXFx1MTdlOVxcdTE4MGItXFx1MTgwZFxcdTE4MTAtXFx1MTgxOVxcdTE5MjAtXFx1MTkyYlxcdTE5MzAtXFx1MTkzYlxcdTE5NTEtXFx1MTk2ZFxcdTE5YjAtXFx1MTljMFxcdTE5YzgtXFx1MTljOVxcdTE5ZDAtXFx1MTlkOVxcdTFhMDAtXFx1MWExNVxcdTFhMjAtXFx1MWE1M1xcdTFhNjAtXFx1MWE3Y1xcdTFhN2YtXFx1MWE4OVxcdTFhOTAtXFx1MWE5OVxcdTFiNDYtXFx1MWI0YlxcdTFiNTAtXFx1MWI1OVxcdTFiNmItXFx1MWI3M1xcdTFiYjAtXFx1MWJiOVxcdTFiZTYtXFx1MWJmM1xcdTFjMDAtXFx1MWMyMlxcdTFjNDAtXFx1MWM0OVxcdTFjNWItXFx1MWM3ZFxcdTFjZDAtXFx1MWNkMlxcdTFkMDAtXFx1MWRiZVxcdTFlMDEtXFx1MWYxNVxcdTIwMGNcXHUyMDBkXFx1MjAzZlxcdTIwNDBcXHUyMDU0XFx1MjBkMC1cXHUyMGRjXFx1MjBlMVxcdTIwZTUtXFx1MjBmMFxcdTJkODEtXFx1MmQ5NlxcdTJkZTAtXFx1MmRmZlxcdTMwMjEtXFx1MzAyOFxcdTMwOTlcXHUzMDlhXFx1YTY0MC1cXHVhNjZkXFx1YTY3NC1cXHVhNjdkXFx1YTY5ZlxcdWE2ZjAtXFx1YTZmMVxcdWE3ZjgtXFx1YTgwMFxcdWE4MDZcXHVhODBiXFx1YTgyMy1cXHVhODI3XFx1YTg4MC1cXHVhODgxXFx1YThiNC1cXHVhOGM0XFx1YThkMC1cXHVhOGQ5XFx1YThmMy1cXHVhOGY3XFx1YTkwMC1cXHVhOTA5XFx1YTkyNi1cXHVhOTJkXFx1YTkzMC1cXHVhOTQ1XFx1YTk4MC1cXHVhOTgzXFx1YTliMy1cXHVhOWMwXFx1YWEwMC1cXHVhYTI3XFx1YWE0MC1cXHVhYTQxXFx1YWE0Yy1cXHVhYTRkXFx1YWE1MC1cXHVhYTU5XFx1YWE3YlxcdWFhZTAtXFx1YWFlOVxcdWFhZjItXFx1YWFmM1xcdWFiYzAtXFx1YWJlMVxcdWFiZWNcXHVhYmVkXFx1YWJmMC1cXHVhYmY5XFx1ZmIyMC1cXHVmYjI4XFx1ZmUwMC1cXHVmZTBmXFx1ZmUyMC1cXHVmZTI2XFx1ZmUzM1xcdWZlMzRcXHVmZTRkLVxcdWZlNGZcXHVmZjEwLVxcdWZmMTlcXHVmZjNmXCI7XG4gIHZhciBub25BU0NJSWlkZW50aWZpZXJTdGFydCA9IG5ldyBSZWdFeHAoXCJbXCIgKyBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzICsgXCJdXCIpO1xuICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyID0gbmV3IFJlZ0V4cChcIltcIiArIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0Q2hhcnMgKyBub25BU0NJSWlkZW50aWZpZXJDaGFycyArIFwiXVwiKTtcblxuICAvLyBXaGV0aGVyIGEgc2luZ2xlIGNoYXJhY3RlciBkZW5vdGVzIGEgbmV3bGluZS5cblxuICB2YXIgbmV3bGluZSA9IC9bXFxuXFxyXFx1MjAyOFxcdTIwMjldLztcblxuICAvLyBNYXRjaGVzIGEgd2hvbGUgbGluZSBicmVhayAod2hlcmUgQ1JMRiBpcyBjb25zaWRlcmVkIGEgc2luZ2xlXG4gIC8vIGxpbmUgYnJlYWspLiBVc2VkIHRvIGNvdW50IGxpbmVzLlxuXG4gIHZhciBsaW5lQnJlYWsgPSAvXFxyXFxufFtcXG5cXHJcXHUyMDI4XFx1MjAyOV0vZztcblxuICAvLyBUZXN0IHdoZXRoZXIgYSBnaXZlbiBjaGFyYWN0ZXIgY29kZSBzdGFydHMgYW4gaWRlbnRpZmllci5cblxuICB2YXIgaXNJZGVudGlmaWVyU3RhcnQgPSBleHBvcnRzLmlzSWRlbnRpZmllclN0YXJ0ID0gZnVuY3Rpb24oY29kZSkge1xuICAgIGlmIChjb2RlIDwgNjUpIHJldHVybiBjb2RlID09PSAzNjtcbiAgICBpZiAoY29kZSA8IDkxKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoY29kZSA8IDk3KSByZXR1cm4gY29kZSA9PT0gOTU7XG4gICAgaWYgKGNvZGUgPCAxMjMpcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGNvZGUgPj0gMHhhYSAmJiBub25BU0NJSWlkZW50aWZpZXJTdGFydC50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkpO1xuICB9O1xuXG4gIC8vIFRlc3Qgd2hldGhlciBhIGdpdmVuIGNoYXJhY3RlciBpcyBwYXJ0IG9mIGFuIGlkZW50aWZpZXIuXG5cbiAgdmFyIGlzSWRlbnRpZmllckNoYXIgPSBleHBvcnRzLmlzSWRlbnRpZmllckNoYXIgPSBmdW5jdGlvbihjb2RlKSB7XG4gICAgaWYgKGNvZGUgPCA0OCkgcmV0dXJuIGNvZGUgPT09IDM2O1xuICAgIGlmIChjb2RlIDwgNTgpIHJldHVybiB0cnVlO1xuICAgIGlmIChjb2RlIDwgNjUpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoY29kZSA8IDkxKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoY29kZSA8IDk3KSByZXR1cm4gY29kZSA9PT0gOTU7XG4gICAgaWYgKGNvZGUgPCAxMjMpcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGNvZGUgPj0gMHhhYSAmJiBub25BU0NJSWlkZW50aWZpZXIudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpKTtcbiAgfTtcblxuICAvLyAjIyBUb2tlbml6ZXJcblxuICAvLyBUaGVzZSBhcmUgdXNlZCB3aGVuIGBvcHRpb25zLmxvY2F0aW9uc2AgaXMgb24sIGZvciB0aGVcbiAgLy8gYHRva1N0YXJ0TG9jYCBhbmQgYHRva0VuZExvY2AgcHJvcGVydGllcy5cblxuICBmdW5jdGlvbiBQb3NpdGlvbigpIHtcbiAgICB0aGlzLmxpbmUgPSB0b2tDdXJMaW5lO1xuICAgIHRoaXMuY29sdW1uID0gdG9rUG9zIC0gdG9rTGluZVN0YXJ0O1xuICB9XG5cbiAgLy8gUmVzZXQgdGhlIHRva2VuIHN0YXRlLiBVc2VkIGF0IHRoZSBzdGFydCBvZiBhIHBhcnNlLlxuXG4gIGZ1bmN0aW9uIGluaXRUb2tlblN0YXRlKCkge1xuICAgIHRva0N1ckxpbmUgPSAxO1xuICAgIHRva1BvcyA9IHRva0xpbmVTdGFydCA9IDA7XG4gICAgdG9rUmVnZXhwQWxsb3dlZCA9IHRydWU7XG4gICAgc2tpcFNwYWNlKCk7XG4gIH1cblxuICAvLyBDYWxsZWQgYXQgdGhlIGVuZCBvZiBldmVyeSB0b2tlbi4gU2V0cyBgdG9rRW5kYCwgYHRva1ZhbGAsIGFuZFxuICAvLyBgdG9rUmVnZXhwQWxsb3dlZGAsIGFuZCBza2lwcyB0aGUgc3BhY2UgYWZ0ZXIgdGhlIHRva2VuLCBzbyB0aGF0XG4gIC8vIHRoZSBuZXh0IG9uZSdzIGB0b2tTdGFydGAgd2lsbCBwb2ludCBhdCB0aGUgcmlnaHQgcG9zaXRpb24uXG5cbiAgZnVuY3Rpb24gZmluaXNoVG9rZW4odHlwZSwgdmFsKSB7XG4gICAgdG9rRW5kID0gdG9rUG9zO1xuICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykgdG9rRW5kTG9jID0gbmV3IFBvc2l0aW9uO1xuICAgIHRva1R5cGUgPSB0eXBlO1xuICAgIHNraXBTcGFjZSgpO1xuICAgIHRva1ZhbCA9IHZhbDtcbiAgICB0b2tSZWdleHBBbGxvd2VkID0gdHlwZS5iZWZvcmVFeHByO1xuICB9XG5cbiAgZnVuY3Rpb24gc2tpcEJsb2NrQ29tbWVudCgpIHtcbiAgICB2YXIgc3RhcnRMb2MgPSBvcHRpb25zLm9uQ29tbWVudCAmJiBvcHRpb25zLmxvY2F0aW9ucyAmJiBuZXcgUG9zaXRpb247XG4gICAgdmFyIHN0YXJ0ID0gdG9rUG9zLCBlbmQgPSBpbnB1dC5pbmRleE9mKFwiKi9cIiwgdG9rUG9zICs9IDIpO1xuICAgIGlmIChlbmQgPT09IC0xKSByYWlzZSh0b2tQb3MgLSAyLCBcIlVudGVybWluYXRlZCBjb21tZW50XCIpO1xuICAgIHRva1BvcyA9IGVuZCArIDI7XG4gICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgICBsaW5lQnJlYWsubGFzdEluZGV4ID0gc3RhcnQ7XG4gICAgICB2YXIgbWF0Y2g7XG4gICAgICB3aGlsZSAoKG1hdGNoID0gbGluZUJyZWFrLmV4ZWMoaW5wdXQpKSAmJiBtYXRjaC5pbmRleCA8IHRva1Bvcykge1xuICAgICAgICArK3Rva0N1ckxpbmU7XG4gICAgICAgIHRva0xpbmVTdGFydCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAob3B0aW9ucy5vbkNvbW1lbnQpXG4gICAgICBvcHRpb25zLm9uQ29tbWVudCh0cnVlLCBpbnB1dC5zbGljZShzdGFydCArIDIsIGVuZCksIHN0YXJ0LCB0b2tQb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydExvYywgb3B0aW9ucy5sb2NhdGlvbnMgJiYgbmV3IFBvc2l0aW9uKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNraXBMaW5lQ29tbWVudCgpIHtcbiAgICB2YXIgc3RhcnQgPSB0b2tQb3M7XG4gICAgdmFyIHN0YXJ0TG9jID0gb3B0aW9ucy5vbkNvbW1lbnQgJiYgb3B0aW9ucy5sb2NhdGlvbnMgJiYgbmV3IFBvc2l0aW9uO1xuICAgIHZhciBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKz0yKTtcbiAgICB3aGlsZSAodG9rUG9zIDwgaW5wdXRMZW4gJiYgY2ggIT09IDEwICYmIGNoICE9PSAxMyAmJiBjaCAhPT0gODIzMiAmJiBjaCAhPT0gODIzMykge1xuICAgICAgKyt0b2tQb3M7XG4gICAgICBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMub25Db21tZW50KVxuICAgICAgb3B0aW9ucy5vbkNvbW1lbnQoZmFsc2UsIGlucHV0LnNsaWNlKHN0YXJ0ICsgMiwgdG9rUG9zKSwgc3RhcnQsIHRva1BvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0TG9jLCBvcHRpb25zLmxvY2F0aW9ucyAmJiBuZXcgUG9zaXRpb24pO1xuICB9XG5cbiAgLy8gQ2FsbGVkIGF0IHRoZSBzdGFydCBvZiB0aGUgcGFyc2UgYW5kIGFmdGVyIGV2ZXJ5IHRva2VuLiBTa2lwc1xuICAvLyB3aGl0ZXNwYWNlIGFuZCBjb21tZW50cywgYW5kLlxuXG4gIGZ1bmN0aW9uIHNraXBTcGFjZSgpIHtcbiAgICB3aGlsZSAodG9rUG9zIDwgaW5wdXRMZW4pIHtcbiAgICAgIHZhciBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICAgIGlmIChjaCA9PT0gMzIpIHsgLy8gJyAnXG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gMTMpIHtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgICAgICBpZiAobmV4dCA9PT0gMTApIHtcbiAgICAgICAgICArK3Rva1BvcztcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnMpIHtcbiAgICAgICAgICArK3Rva0N1ckxpbmU7XG4gICAgICAgICAgdG9rTGluZVN0YXJ0ID0gdG9rUG9zO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSAxMCB8fCBjaCA9PT0gODIzMiB8fCBjaCA9PT0gODIzMykge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgICAgICAgKyt0b2tDdXJMaW5lO1xuICAgICAgICAgIHRva0xpbmVTdGFydCA9IHRva1BvcztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaCA+IDggJiYgY2ggPCAxNCkge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDQ3KSB7IC8vICcvJ1xuICAgICAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgICAgIGlmIChuZXh0ID09PSA0MikgeyAvLyAnKidcbiAgICAgICAgICBza2lwQmxvY2tDb21tZW50KCk7XG4gICAgICAgIH0gZWxzZSBpZiAobmV4dCA9PT0gNDcpIHsgLy8gJy8nXG4gICAgICAgICAgc2tpcExpbmVDb21tZW50KCk7XG4gICAgICAgIH0gZWxzZSBicmVhaztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDE2MCkgeyAvLyAnXFx4YTAnXG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgfSBlbHNlIGlmIChjaCA+PSA1NzYwICYmIG5vbkFTQ0lJd2hpdGVzcGFjZS50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpKSkge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vICMjIyBUb2tlbiByZWFkaW5nXG5cbiAgLy8gVGhpcyBpcyB0aGUgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgdG8gZmV0Y2ggdGhlIG5leHQgdG9rZW4uIEl0XG4gIC8vIGlzIHNvbWV3aGF0IG9ic2N1cmUsIGJlY2F1c2UgaXQgd29ya3MgaW4gY2hhcmFjdGVyIGNvZGVzIHJhdGhlclxuICAvLyB0aGFuIGNoYXJhY3RlcnMsIGFuZCBiZWNhdXNlIG9wZXJhdG9yIHBhcnNpbmcgaGFzIGJlZW4gaW5saW5lZFxuICAvLyBpbnRvIGl0LlxuICAvL1xuICAvLyBBbGwgaW4gdGhlIG5hbWUgb2Ygc3BlZWQuXG4gIC8vXG4gIC8vIFRoZSBgZm9yY2VSZWdleHBgIHBhcmFtZXRlciBpcyB1c2VkIGluIHRoZSBvbmUgY2FzZSB3aGVyZSB0aGVcbiAgLy8gYHRva1JlZ2V4cEFsbG93ZWRgIHRyaWNrIGRvZXMgbm90IHdvcmsuIFNlZSBgcGFyc2VTdGF0ZW1lbnRgLlxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9kb3QoKSB7XG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID49IDQ4ICYmIG5leHQgPD0gNTcpIHJldHVybiByZWFkTnVtYmVyKHRydWUpO1xuICAgIHZhciBuZXh0MiA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMik7XG4gICAgaWYgKG9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiBuZXh0ID09PSA0NiAmJiBuZXh0MiA9PT0gNDYpIHsgLy8gNDYgPSBkb3QgJy4nXG4gICAgICB0b2tQb3MgKz0gMztcbiAgICAgIHJldHVybiBmaW5pc2hUb2tlbihfZWxsaXBzaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICArK3Rva1BvcztcbiAgICAgIHJldHVybiBmaW5pc2hUb2tlbihfZG90KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fc2xhc2goKSB7IC8vICcvJ1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAodG9rUmVnZXhwQWxsb3dlZCkgeysrdG9rUG9zOyByZXR1cm4gcmVhZFJlZ2V4cCgpO31cbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoX3NsYXNoLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9tdWx0X21vZHVsbygpIHsgLy8gJyUqJ1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoX211bHRpcGx5TW9kdWxvLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9waXBlX2FtcChjb2RlKSB7IC8vICd8JidcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IGNvZGUpIHJldHVybiBmaW5pc2hPcChjb2RlID09PSAxMjQgPyBfbG9naWNhbE9SIDogX2xvZ2ljYWxBTkQsIDIpO1xuICAgIGlmIChuZXh0ID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9hc3NpZ24sIDIpO1xuICAgIHJldHVybiBmaW5pc2hPcChjb2RlID09PSAxMjQgPyBfYml0d2lzZU9SIDogX2JpdHdpc2VBTkQsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX2NhcmV0KCkgeyAvLyAnXidcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKF9iaXR3aXNlWE9SLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9wbHVzX21pbihjb2RlKSB7IC8vICcrLSdcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IGNvZGUpIHtcbiAgICAgIGlmIChuZXh0ID09IDQ1ICYmIGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMikgPT0gNjIgJiZcbiAgICAgICAgICBuZXdsaW5lLnRlc3QoaW5wdXQuc2xpY2UobGFzdEVuZCwgdG9rUG9zKSkpIHtcbiAgICAgICAgLy8gQSBgLS0+YCBsaW5lIGNvbW1lbnRcbiAgICAgICAgdG9rUG9zICs9IDM7XG4gICAgICAgIHNraXBMaW5lQ29tbWVudCgpO1xuICAgICAgICBza2lwU3BhY2UoKTtcbiAgICAgICAgcmV0dXJuIHJlYWRUb2tlbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbmlzaE9wKF9pbmNEZWMsIDIpO1xuICAgIH1cbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoX3BsdXNNaW4sIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX2x0X2d0KGNvZGUpIHsgLy8gJzw+J1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICB2YXIgc2l6ZSA9IDE7XG4gICAgaWYgKG5leHQgPT09IGNvZGUpIHtcbiAgICAgIHNpemUgPSBjb2RlID09PSA2MiAmJiBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09PSA2MiA/IDMgOiAyO1xuICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgc2l6ZSkgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgc2l6ZSArIDEpO1xuICAgICAgcmV0dXJuIGZpbmlzaE9wKF9iaXRTaGlmdCwgc2l6ZSk7XG4gICAgfVxuICAgIGlmIChuZXh0ID09IDMzICYmIGNvZGUgPT0gNjAgJiYgaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAyKSA9PSA0NSAmJlxuICAgICAgICBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDMpID09IDQ1KSB7XG4gICAgICAvLyBgPCEtLWAsIGFuIFhNTC1zdHlsZSBjb21tZW50IHRoYXQgc2hvdWxkIGJlIGludGVycHJldGVkIGFzIGEgbGluZSBjb21tZW50XG4gICAgICB0b2tQb3MgKz0gNDtcbiAgICAgIHNraXBMaW5lQ29tbWVudCgpO1xuICAgICAgc2tpcFNwYWNlKCk7XG4gICAgICByZXR1cm4gcmVhZFRva2VuKCk7XG4gICAgfVxuICAgIGlmIChuZXh0ID09PSA2MSlcbiAgICAgIHNpemUgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09PSA2MSA/IDMgOiAyO1xuICAgIHJldHVybiBmaW5pc2hPcChfcmVsYXRpb25hbCwgc2l6ZSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fZXFfZXhjbChjb2RlKSB7IC8vICc9ISdcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2VxdWFsaXR5LCBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09PSA2MSA/IDMgOiAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoY29kZSA9PT0gNjEgPyBfZXEgOiBfcHJlZml4LCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRva2VuRnJvbUNvZGUoY29kZSkge1xuICAgIHN3aXRjaChjb2RlKSB7XG4gICAgICAvLyBUaGUgaW50ZXJwcmV0YXRpb24gb2YgYSBkb3QgZGVwZW5kcyBvbiB3aGV0aGVyIGl0IGlzIGZvbGxvd2VkXG4gICAgICAvLyBieSBhIGRpZ2l0IG9yIGFub3RoZXIgdHdvIGRvdHMuXG4gICAgY2FzZSA0NjogLy8gJy4nXG4gICAgICByZXR1cm4gcmVhZFRva2VuX2RvdCgpO1xuXG4gICAgICAvLyBQdW5jdHVhdGlvbiB0b2tlbnMuXG4gICAgY2FzZSA0MDogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfcGFyZW5MKTtcbiAgICBjYXNlIDQxOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9wYXJlblIpO1xuICAgIGNhc2UgNTk6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX3NlbWkpO1xuICAgIGNhc2UgNDQ6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX2NvbW1hKTtcbiAgICBjYXNlIDkxOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9icmFja2V0TCk7XG4gICAgY2FzZSA5MzogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfYnJhY2tldFIpO1xuICAgIGNhc2UgMTIzOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9icmFjZUwpO1xuICAgIGNhc2UgMTI1OiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9icmFjZVIpO1xuICAgIGNhc2UgNTg6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX2NvbG9uKTtcbiAgICBjYXNlIDYzOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9xdWVzdGlvbik7XG5cbiAgICAgIC8vICcweCcgaXMgYSBoZXhhZGVjaW1hbCBudW1iZXIuXG4gICAgY2FzZSA0ODogLy8gJzAnXG4gICAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgICBpZiAobmV4dCA9PT0gMTIwIHx8IG5leHQgPT09IDg4KSByZXR1cm4gcmVhZEhleE51bWJlcigpO1xuICAgICAgLy8gQW55dGhpbmcgZWxzZSBiZWdpbm5pbmcgd2l0aCBhIGRpZ2l0IGlzIGFuIGludGVnZXIsIG9jdGFsXG4gICAgICAvLyBudW1iZXIsIG9yIGZsb2F0LlxuICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIDQ5OiBjYXNlIDUwOiBjYXNlIDUxOiBjYXNlIDUyOiBjYXNlIDUzOiBjYXNlIDU0OiBjYXNlIDU1OiBjYXNlIDU2OiBjYXNlIDU3OiAvLyAxLTlcbiAgICAgIHJldHVybiByZWFkTnVtYmVyKGZhbHNlKTtcblxuICAgICAgLy8gUXVvdGVzIHByb2R1Y2Ugc3RyaW5ncy5cbiAgICBjYXNlIDM0OiBjYXNlIDM5OiAvLyAnXCInLCBcIidcIlxuICAgICAgcmV0dXJuIHJlYWRTdHJpbmcoY29kZSk7XG5cbiAgICAvLyBPcGVyYXRvcnMgYXJlIHBhcnNlZCBpbmxpbmUgaW4gdGlueSBzdGF0ZSBtYWNoaW5lcy4gJz0nICg2MSkgaXNcbiAgICAvLyBvZnRlbiByZWZlcnJlZCB0by4gYGZpbmlzaE9wYCBzaW1wbHkgc2tpcHMgdGhlIGFtb3VudCBvZlxuICAgIC8vIGNoYXJhY3RlcnMgaXQgaXMgZ2l2ZW4gYXMgc2Vjb25kIGFyZ3VtZW50LCBhbmQgcmV0dXJucyBhIHRva2VuXG4gICAgLy8gb2YgdGhlIHR5cGUgZ2l2ZW4gYnkgaXRzIGZpcnN0IGFyZ3VtZW50LlxuXG4gICAgY2FzZSA0NzogLy8gJy8nXG4gICAgICByZXR1cm4gcmVhZFRva2VuX3NsYXNoKCk7XG5cbiAgICBjYXNlIDM3OiBjYXNlIDQyOiAvLyAnJSonXG4gICAgICByZXR1cm4gcmVhZFRva2VuX211bHRfbW9kdWxvKCk7XG5cbiAgICBjYXNlIDEyNDogY2FzZSAzODogLy8gJ3wmJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9waXBlX2FtcChjb2RlKTtcblxuICAgIGNhc2UgOTQ6IC8vICdeJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9jYXJldCgpO1xuXG4gICAgY2FzZSA0MzogY2FzZSA0NTogLy8gJystJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9wbHVzX21pbihjb2RlKTtcblxuICAgIGNhc2UgNjA6IGNhc2UgNjI6IC8vICc8PidcbiAgICAgIHJldHVybiByZWFkVG9rZW5fbHRfZ3QoY29kZSk7XG5cbiAgICBjYXNlIDYxOiBjYXNlIDMzOiAvLyAnPSEnXG4gICAgICByZXR1cm4gcmVhZFRva2VuX2VxX2V4Y2woY29kZSk7XG5cbiAgICBjYXNlIDEyNjogLy8gJ34nXG4gICAgICByZXR1cm4gZmluaXNoT3AoX3ByZWZpeCwgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuKGZvcmNlUmVnZXhwKSB7XG4gICAgaWYgKCFmb3JjZVJlZ2V4cCkgdG9rU3RhcnQgPSB0b2tQb3M7XG4gICAgZWxzZSB0b2tQb3MgPSB0b2tTdGFydCArIDE7XG4gICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB0b2tTdGFydExvYyA9IG5ldyBQb3NpdGlvbjtcbiAgICBpZiAoZm9yY2VSZWdleHApIHJldHVybiByZWFkUmVnZXhwKCk7XG4gICAgaWYgKHRva1BvcyA+PSBpbnB1dExlbikgcmV0dXJuIGZpbmlzaFRva2VuKF9lb2YpO1xuXG4gICAgdmFyIGNvZGUgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgLy8gSWRlbnRpZmllciBvciBrZXl3b3JkLiAnXFx1WFhYWCcgc2VxdWVuY2VzIGFyZSBhbGxvd2VkIGluXG4gICAgLy8gaWRlbnRpZmllcnMsIHNvICdcXCcgYWxzbyBkaXNwYXRjaGVzIHRvIHRoYXQuXG4gICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNvZGUpIHx8IGNvZGUgPT09IDkyIC8qICdcXCcgKi8pIHJldHVybiByZWFkV29yZCgpO1xuXG4gICAgdmFyIHRvayA9IGdldFRva2VuRnJvbUNvZGUoY29kZSk7XG5cbiAgICBpZiAodG9rID09PSBmYWxzZSkge1xuICAgICAgLy8gSWYgd2UgYXJlIGhlcmUsIHdlIGVpdGhlciBmb3VuZCBhIG5vbi1BU0NJSSBpZGVudGlmaWVyXG4gICAgICAvLyBjaGFyYWN0ZXIsIG9yIHNvbWV0aGluZyB0aGF0J3MgZW50aXJlbHkgZGlzYWxsb3dlZC5cbiAgICAgIHZhciBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiIHx8IG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0LnRlc3QoY2gpKSByZXR1cm4gcmVhZFdvcmQoKTtcbiAgICAgIHJhaXNlKHRva1BvcywgXCJVbmV4cGVjdGVkIGNoYXJhY3RlciAnXCIgKyBjaCArIFwiJ1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRvaztcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmlzaE9wKHR5cGUsIHNpemUpIHtcbiAgICB2YXIgc3RyID0gaW5wdXQuc2xpY2UodG9rUG9zLCB0b2tQb3MgKyBzaXplKTtcbiAgICB0b2tQb3MgKz0gc2l6ZTtcbiAgICBmaW5pc2hUb2tlbih0eXBlLCBzdHIpO1xuICB9XG5cbiAgLy8gUGFyc2UgYSByZWd1bGFyIGV4cHJlc3Npb24uIFNvbWUgY29udGV4dC1hd2FyZW5lc3MgaXMgbmVjZXNzYXJ5LFxuICAvLyBzaW5jZSBhICcvJyBpbnNpZGUgYSAnW10nIHNldCBkb2VzIG5vdCBlbmQgdGhlIGV4cHJlc3Npb24uXG5cbiAgZnVuY3Rpb24gcmVhZFJlZ2V4cCgpIHtcbiAgICB2YXIgY29udGVudCA9IFwiXCIsIGVzY2FwZWQsIGluQ2xhc3MsIHN0YXJ0ID0gdG9rUG9zO1xuICAgIGZvciAoOzspIHtcbiAgICAgIGlmICh0b2tQb3MgPj0gaW5wdXRMZW4pIHJhaXNlKHN0YXJ0LCBcIlVudGVybWluYXRlZCByZWd1bGFyIGV4cHJlc3Npb25cIik7XG4gICAgICB2YXIgY2ggPSBpbnB1dC5jaGFyQXQodG9rUG9zKTtcbiAgICAgIGlmIChuZXdsaW5lLnRlc3QoY2gpKSByYWlzZShzdGFydCwgXCJVbnRlcm1pbmF0ZWQgcmVndWxhciBleHByZXNzaW9uXCIpO1xuICAgICAgaWYgKCFlc2NhcGVkKSB7XG4gICAgICAgIGlmIChjaCA9PT0gXCJbXCIpIGluQ2xhc3MgPSB0cnVlO1xuICAgICAgICBlbHNlIGlmIChjaCA9PT0gXCJdXCIgJiYgaW5DbGFzcykgaW5DbGFzcyA9IGZhbHNlO1xuICAgICAgICBlbHNlIGlmIChjaCA9PT0gXCIvXCIgJiYgIWluQ2xhc3MpIGJyZWFrO1xuICAgICAgICBlc2NhcGVkID0gY2ggPT09IFwiXFxcXFwiO1xuICAgICAgfSBlbHNlIGVzY2FwZWQgPSBmYWxzZTtcbiAgICAgICsrdG9rUG9zO1xuICAgIH1cbiAgICB2YXIgY29udGVudCA9IGlucHV0LnNsaWNlKHN0YXJ0LCB0b2tQb3MpO1xuICAgICsrdG9rUG9zO1xuICAgIC8vIE5lZWQgdG8gdXNlIGByZWFkV29yZDFgIGJlY2F1c2UgJ1xcdVhYWFgnIHNlcXVlbmNlcyBhcmUgYWxsb3dlZFxuICAgIC8vIGhlcmUgKGRvbid0IGFzaykuXG4gICAgdmFyIG1vZHMgPSByZWFkV29yZDEoKTtcbiAgICBpZiAobW9kcyAmJiAhL15bZ21zaXldKiQvLnRlc3QobW9kcykpIHJhaXNlKHN0YXJ0LCBcIkludmFsaWQgcmVndWxhciBleHByZXNzaW9uIGZsYWdcIik7XG4gICAgdHJ5IHtcbiAgICAgIHZhciB2YWx1ZSA9IG5ldyBSZWdFeHAoY29udGVudCwgbW9kcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBTeW50YXhFcnJvcikgcmFpc2Uoc3RhcnQsIFwiRXJyb3IgcGFyc2luZyByZWd1bGFyIGV4cHJlc3Npb246IFwiICsgZS5tZXNzYWdlKTtcbiAgICAgIHJhaXNlKGUpO1xuICAgIH1cbiAgICByZXR1cm4gZmluaXNoVG9rZW4oX3JlZ2V4cCwgdmFsdWUpO1xuICB9XG5cbiAgLy8gUmVhZCBhbiBpbnRlZ2VyIGluIHRoZSBnaXZlbiByYWRpeC4gUmV0dXJuIG51bGwgaWYgemVybyBkaWdpdHNcbiAgLy8gd2VyZSByZWFkLCB0aGUgaW50ZWdlciB2YWx1ZSBvdGhlcndpc2UuIFdoZW4gYGxlbmAgaXMgZ2l2ZW4sIHRoaXNcbiAgLy8gd2lsbCByZXR1cm4gYG51bGxgIHVubGVzcyB0aGUgaW50ZWdlciBoYXMgZXhhY3RseSBgbGVuYCBkaWdpdHMuXG5cbiAgZnVuY3Rpb24gcmVhZEludChyYWRpeCwgbGVuKSB7XG4gICAgdmFyIHN0YXJ0ID0gdG9rUG9zLCB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDAsIGUgPSBsZW4gPT0gbnVsbCA/IEluZmluaXR5IDogbGVuOyBpIDwgZTsgKytpKSB7XG4gICAgICB2YXIgY29kZSA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKSwgdmFsO1xuICAgICAgaWYgKGNvZGUgPj0gOTcpIHZhbCA9IGNvZGUgLSA5NyArIDEwOyAvLyBhXG4gICAgICBlbHNlIGlmIChjb2RlID49IDY1KSB2YWwgPSBjb2RlIC0gNjUgKyAxMDsgLy8gQVxuICAgICAgZWxzZSBpZiAoY29kZSA+PSA0OCAmJiBjb2RlIDw9IDU3KSB2YWwgPSBjb2RlIC0gNDg7IC8vIDAtOVxuICAgICAgZWxzZSB2YWwgPSBJbmZpbml0eTtcbiAgICAgIGlmICh2YWwgPj0gcmFkaXgpIGJyZWFrO1xuICAgICAgKyt0b2tQb3M7XG4gICAgICB0b3RhbCA9IHRvdGFsICogcmFkaXggKyB2YWw7XG4gICAgfVxuICAgIGlmICh0b2tQb3MgPT09IHN0YXJ0IHx8IGxlbiAhPSBudWxsICYmIHRva1BvcyAtIHN0YXJ0ICE9PSBsZW4pIHJldHVybiBudWxsO1xuXG4gICAgcmV0dXJuIHRvdGFsO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEhleE51bWJlcigpIHtcbiAgICB0b2tQb3MgKz0gMjsgLy8gMHhcbiAgICB2YXIgdmFsID0gcmVhZEludCgxNik7XG4gICAgaWYgKHZhbCA9PSBudWxsKSByYWlzZSh0b2tTdGFydCArIDIsIFwiRXhwZWN0ZWQgaGV4YWRlY2ltYWwgbnVtYmVyXCIpO1xuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykpKSByYWlzZSh0b2tQb3MsIFwiSWRlbnRpZmllciBkaXJlY3RseSBhZnRlciBudW1iZXJcIik7XG4gICAgcmV0dXJuIGZpbmlzaFRva2VuKF9udW0sIHZhbCk7XG4gIH1cblxuICAvLyBSZWFkIGFuIGludGVnZXIsIG9jdGFsIGludGVnZXIsIG9yIGZsb2F0aW5nLXBvaW50IG51bWJlci5cblxuICBmdW5jdGlvbiByZWFkTnVtYmVyKHN0YXJ0c1dpdGhEb3QpIHtcbiAgICB2YXIgc3RhcnQgPSB0b2tQb3MsIGlzRmxvYXQgPSBmYWxzZSwgb2N0YWwgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykgPT09IDQ4O1xuICAgIGlmICghc3RhcnRzV2l0aERvdCAmJiByZWFkSW50KDEwKSA9PT0gbnVsbCkgcmFpc2Uoc3RhcnQsIFwiSW52YWxpZCBudW1iZXJcIik7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKSA9PT0gNDYpIHtcbiAgICAgICsrdG9rUG9zO1xuICAgICAgcmVhZEludCgxMCk7XG4gICAgICBpc0Zsb2F0ID0gdHJ1ZTtcbiAgICB9XG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgaWYgKG5leHQgPT09IDY5IHx8IG5leHQgPT09IDEwMSkgeyAvLyAnZUUnXG4gICAgICBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCgrK3Rva1Bvcyk7XG4gICAgICBpZiAobmV4dCA9PT0gNDMgfHwgbmV4dCA9PT0gNDUpICsrdG9rUG9zOyAvLyAnKy0nXG4gICAgICBpZiAocmVhZEludCgxMCkgPT09IG51bGwpIHJhaXNlKHN0YXJ0LCBcIkludmFsaWQgbnVtYmVyXCIpO1xuICAgICAgaXNGbG9hdCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykpKSByYWlzZSh0b2tQb3MsIFwiSWRlbnRpZmllciBkaXJlY3RseSBhZnRlciBudW1iZXJcIik7XG5cbiAgICB2YXIgc3RyID0gaW5wdXQuc2xpY2Uoc3RhcnQsIHRva1BvcyksIHZhbDtcbiAgICBpZiAoaXNGbG9hdCkgdmFsID0gcGFyc2VGbG9hdChzdHIpO1xuICAgIGVsc2UgaWYgKCFvY3RhbCB8fCBzdHIubGVuZ3RoID09PSAxKSB2YWwgPSBwYXJzZUludChzdHIsIDEwKTtcbiAgICBlbHNlIGlmICgvWzg5XS8udGVzdChzdHIpIHx8IHN0cmljdCkgcmFpc2Uoc3RhcnQsIFwiSW52YWxpZCBudW1iZXJcIik7XG4gICAgZWxzZSB2YWwgPSBwYXJzZUludChzdHIsIDgpO1xuICAgIHJldHVybiBmaW5pc2hUb2tlbihfbnVtLCB2YWwpO1xuICB9XG5cbiAgLy8gUmVhZCBhIHN0cmluZyB2YWx1ZSwgaW50ZXJwcmV0aW5nIGJhY2tzbGFzaC1lc2NhcGVzLlxuXG4gIGZ1bmN0aW9uIHJlYWRTdHJpbmcocXVvdGUpIHtcbiAgICB0b2tQb3MrKztcbiAgICB2YXIgb3V0ID0gXCJcIjtcbiAgICBmb3IgKDs7KSB7XG4gICAgICBpZiAodG9rUG9zID49IGlucHV0TGVuKSByYWlzZSh0b2tTdGFydCwgXCJVbnRlcm1pbmF0ZWQgc3RyaW5nIGNvbnN0YW50XCIpO1xuICAgICAgdmFyIGNoID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgICAgaWYgKGNoID09PSBxdW90ZSkge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgICAgcmV0dXJuIGZpbmlzaFRva2VuKF9zdHJpbmcsIG91dCk7XG4gICAgICB9XG4gICAgICBpZiAoY2ggPT09IDkyKSB7IC8vICdcXCdcbiAgICAgICAgY2ggPSBpbnB1dC5jaGFyQ29kZUF0KCsrdG9rUG9zKTtcbiAgICAgICAgdmFyIG9jdGFsID0gL15bMC03XSsvLmV4ZWMoaW5wdXQuc2xpY2UodG9rUG9zLCB0b2tQb3MgKyAzKSk7XG4gICAgICAgIGlmIChvY3RhbCkgb2N0YWwgPSBvY3RhbFswXTtcbiAgICAgICAgd2hpbGUgKG9jdGFsICYmIHBhcnNlSW50KG9jdGFsLCA4KSA+IDI1NSkgb2N0YWwgPSBvY3RhbC5zbGljZSgwLCAtMSk7XG4gICAgICAgIGlmIChvY3RhbCA9PT0gXCIwXCIpIG9jdGFsID0gbnVsbDtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIGlmIChvY3RhbCkge1xuICAgICAgICAgIGlmIChzdHJpY3QpIHJhaXNlKHRva1BvcyAtIDIsIFwiT2N0YWwgbGl0ZXJhbCBpbiBzdHJpY3QgbW9kZVwiKTtcbiAgICAgICAgICBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChvY3RhbCwgOCkpO1xuICAgICAgICAgIHRva1BvcyArPSBvY3RhbC5sZW5ndGggLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgICBjYXNlIDExMDogb3V0ICs9IFwiXFxuXCI7IGJyZWFrOyAvLyAnbicgLT4gJ1xcbidcbiAgICAgICAgICBjYXNlIDExNDogb3V0ICs9IFwiXFxyXCI7IGJyZWFrOyAvLyAncicgLT4gJ1xccidcbiAgICAgICAgICBjYXNlIDEyMDogb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUocmVhZEhleENoYXIoMikpOyBicmVhazsgLy8gJ3gnXG4gICAgICAgICAgY2FzZSAxMTc6IG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHJlYWRIZXhDaGFyKDQpKTsgYnJlYWs7IC8vICd1J1xuICAgICAgICAgIGNhc2UgODU6IG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHJlYWRIZXhDaGFyKDgpKTsgYnJlYWs7IC8vICdVJ1xuICAgICAgICAgIGNhc2UgMTE2OiBvdXQgKz0gXCJcXHRcIjsgYnJlYWs7IC8vICd0JyAtPiAnXFx0J1xuICAgICAgICAgIGNhc2UgOTg6IG91dCArPSBcIlxcYlwiOyBicmVhazsgLy8gJ2InIC0+ICdcXGInXG4gICAgICAgICAgY2FzZSAxMTg6IG91dCArPSBcIlxcdTAwMGJcIjsgYnJlYWs7IC8vICd2JyAtPiAnXFx1MDAwYidcbiAgICAgICAgICBjYXNlIDEwMjogb3V0ICs9IFwiXFxmXCI7IGJyZWFrOyAvLyAnZicgLT4gJ1xcZidcbiAgICAgICAgICBjYXNlIDQ4OiBvdXQgKz0gXCJcXDBcIjsgYnJlYWs7IC8vIDAgLT4gJ1xcMCdcbiAgICAgICAgICBjYXNlIDEzOiBpZiAoaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpID09PSAxMCkgKyt0b2tQb3M7IC8vICdcXHJcXG4nXG4gICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgIGNhc2UgMTA6IC8vICcgXFxuJ1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7IHRva0xpbmVTdGFydCA9IHRva1BvczsgKyt0b2tDdXJMaW5lOyB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OiBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7IGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNoID09PSAxMyB8fCBjaCA9PT0gMTAgfHwgY2ggPT09IDgyMzIgfHwgY2ggPT09IDgyMzMpIHJhaXNlKHRva1N0YXJ0LCBcIlVudGVybWluYXRlZCBzdHJpbmcgY29uc3RhbnRcIik7XG4gICAgICAgIG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKTsgLy8gJ1xcJ1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBVc2VkIHRvIHJlYWQgY2hhcmFjdGVyIGVzY2FwZSBzZXF1ZW5jZXMgKCdcXHgnLCAnXFx1JywgJ1xcVScpLlxuXG4gIGZ1bmN0aW9uIHJlYWRIZXhDaGFyKGxlbikge1xuICAgIHZhciBuID0gcmVhZEludCgxNiwgbGVuKTtcbiAgICBpZiAobiA9PT0gbnVsbCkgcmFpc2UodG9rU3RhcnQsIFwiQmFkIGNoYXJhY3RlciBlc2NhcGUgc2VxdWVuY2VcIik7XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICAvLyBVc2VkIHRvIHNpZ25hbCB0byBjYWxsZXJzIG9mIGByZWFkV29yZDFgIHdoZXRoZXIgdGhlIHdvcmRcbiAgLy8gY29udGFpbmVkIGFueSBlc2NhcGUgc2VxdWVuY2VzLiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIHdvcmRzIHdpdGhcbiAgLy8gZXNjYXBlIHNlcXVlbmNlcyBtdXN0IG5vdCBiZSBpbnRlcnByZXRlZCBhcyBrZXl3b3Jkcy5cblxuICB2YXIgY29udGFpbnNFc2M7XG5cbiAgLy8gUmVhZCBhbiBpZGVudGlmaWVyLCBhbmQgcmV0dXJuIGl0IGFzIGEgc3RyaW5nLiBTZXRzIGBjb250YWluc0VzY2BcbiAgLy8gdG8gd2hldGhlciB0aGUgd29yZCBjb250YWluZWQgYSAnXFx1JyBlc2NhcGUuXG4gIC8vXG4gIC8vIE9ubHkgYnVpbGRzIHVwIHRoZSB3b3JkIGNoYXJhY3Rlci1ieS1jaGFyYWN0ZXIgd2hlbiBpdCBhY3R1YWxseVxuICAvLyBjb250YWluZWRzIGFuIGVzY2FwZSwgYXMgYSBtaWNyby1vcHRpbWl6YXRpb24uXG5cbiAgZnVuY3Rpb24gcmVhZFdvcmQxKCkge1xuICAgIGNvbnRhaW5zRXNjID0gZmFsc2U7XG4gICAgdmFyIHdvcmQsIGZpcnN0ID0gdHJ1ZSwgc3RhcnQgPSB0b2tQb3M7XG4gICAgZm9yICg7Oykge1xuICAgICAgdmFyIGNoID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgICAgaWYgKGlzSWRlbnRpZmllckNoYXIoY2gpKSB7XG4gICAgICAgIGlmIChjb250YWluc0VzYykgd29yZCArPSBpbnB1dC5jaGFyQXQodG9rUG9zKTtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSA5MikgeyAvLyBcIlxcXCJcbiAgICAgICAgaWYgKCFjb250YWluc0VzYykgd29yZCA9IGlucHV0LnNsaWNlKHN0YXJ0LCB0b2tQb3MpO1xuICAgICAgICBjb250YWluc0VzYyA9IHRydWU7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KCsrdG9rUG9zKSAhPSAxMTcpIC8vIFwidVwiXG4gICAgICAgICAgcmFpc2UodG9rUG9zLCBcIkV4cGVjdGluZyBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZSBcXFxcdVhYWFhcIik7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgICB2YXIgZXNjID0gcmVhZEhleENoYXIoNCk7XG4gICAgICAgIHZhciBlc2NTdHIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGVzYyk7XG4gICAgICAgIGlmICghZXNjU3RyKSByYWlzZSh0b2tQb3MgLSAxLCBcIkludmFsaWQgVW5pY29kZSBlc2NhcGVcIik7XG4gICAgICAgIGlmICghKGZpcnN0ID8gaXNJZGVudGlmaWVyU3RhcnQoZXNjKSA6IGlzSWRlbnRpZmllckNoYXIoZXNjKSkpXG4gICAgICAgICAgcmFpc2UodG9rUG9zIC0gNCwgXCJJbnZhbGlkIFVuaWNvZGUgZXNjYXBlXCIpO1xuICAgICAgICB3b3JkICs9IGVzY1N0cjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRhaW5zRXNjID8gd29yZCA6IGlucHV0LnNsaWNlKHN0YXJ0LCB0b2tQb3MpO1xuICB9XG5cbiAgLy8gUmVhZCBhbiBpZGVudGlmaWVyIG9yIGtleXdvcmQgdG9rZW4uIFdpbGwgY2hlY2sgZm9yIHJlc2VydmVkXG4gIC8vIHdvcmRzIHdoZW4gbmVjZXNzYXJ5LlxuXG4gIGZ1bmN0aW9uIHJlYWRXb3JkKCkge1xuICAgIHZhciB3b3JkID0gcmVhZFdvcmQxKCk7XG4gICAgdmFyIHR5cGUgPSBfbmFtZTtcbiAgICBpZiAoIWNvbnRhaW5zRXNjICYmIGlzS2V5d29yZCh3b3JkKSlcbiAgICAgIHR5cGUgPSBrZXl3b3JkVHlwZXNbd29yZF07XG4gICAgcmV0dXJuIGZpbmlzaFRva2VuKHR5cGUsIHdvcmQpO1xuICB9XG5cblxuZXhwb3J0IGRlZmF1bHQgeyB0b2tlbml6ZTogZXhwb3J0cy50b2tlbml6ZSB9OyIsIi8vIFJlYm91bmQgSGVscGVyc1xuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgTGF6eVZhbHVlIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9sYXp5LXZhbHVlXCI7XG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcblxuXG52YXIgaGVscGVycyAgPSB7fSxcbiAgICBwYXJ0aWFscyA9IHt9O1xuXG5oZWxwZXJzLnJlZ2lzdGVyUGFydGlhbCA9IGZ1bmN0aW9uKG5hbWUsIGZ1bmMpe1xuICBpZihmdW5jICYmIGZ1bmMuaXNIVE1MQmFycyAmJiB0eXBlb2YgbmFtZSA9PT0gJ3N0cmluZycpe1xuICAgIHBhcnRpYWxzW25hbWVdID0gZnVuYztcbiAgfVxufTtcblxuLy8gbG9va3VwSGVscGVyIHJldHVybnMgdGhlIGdpdmVuIGZ1bmN0aW9uIGZyb20gdGhlIGhlbHBlcnMgb2JqZWN0LiBNYW51YWwgY2hlY2tzIHByZXZlbnQgdXNlciBmcm9tIG92ZXJyaWRpbmcgcmVzZXJ2ZWQgd29yZHMuXG5oZWxwZXJzLmxvb2t1cEhlbHBlciA9IGZ1bmN0aW9uKG5hbWUsIGVudiwgY29udGV4dCkge1xuXG4gIGVudiA9IGVudiB8fCB7fTtcblxuICBuYW1lID0gJC5zcGxpdFBhdGgobmFtZSlbMF07XG5cbiAgLy8gSWYgYSByZXNlcnZlZCBoZWxwZXJzLCByZXR1cm4gaXRcbiAgaWYobmFtZSA9PT0gJ2F0dHJpYnV0ZScpIHsgcmV0dXJuIHRoaXMuYXR0cmlidXRlOyB9XG4gIGlmKG5hbWUgPT09ICdpZicpIHsgcmV0dXJuIHRoaXMuaWY7IH1cbiAgaWYobmFtZSA9PT0gJ3VubGVzcycpIHsgcmV0dXJuIHRoaXMudW5sZXNzOyB9XG4gIGlmKG5hbWUgPT09ICdlYWNoJykgeyByZXR1cm4gdGhpcy5lYWNoOyB9XG4gIGlmKG5hbWUgPT09ICd3aXRoJykgeyByZXR1cm4gdGhpcy53aXRoOyB9XG4gIGlmKG5hbWUgPT09ICdwYXJ0aWFsJykgeyByZXR1cm4gdGhpcy5wYXJ0aWFsOyB9XG4gIGlmKG5hbWUgPT09ICdsZW5ndGgnKSB7IHJldHVybiB0aGlzLmxlbmd0aDsgfVxuICBpZihuYW1lID09PSAnb24nKSB7IHJldHVybiB0aGlzLm9uOyB9XG5cbiAgLy8gSWYgbm90IGEgcmVzZXJ2ZWQgaGVscGVyLCBjaGVjayBlbnYsIHRoZW4gZ2xvYmFsIGhlbHBlcnMsIGVsc2UgcmV0dXJuIGZhbHNlXG4gIHJldHVybiAoZW52LmhlbHBlcnMgJiYgXy5pc09iamVjdChjb250ZXh0KSAmJiBfLmlzT2JqZWN0KGVudi5oZWxwZXJzW2NvbnRleHQuY2lkXSkgJiYgZW52LmhlbHBlcnNbY29udGV4dC5jaWRdW25hbWVdKSB8fCBoZWxwZXJzW25hbWVdIHx8IGZhbHNlO1xufTtcblxuaGVscGVycy5yZWdpc3RlckhlbHBlciA9IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBwYXJhbXMpe1xuICBpZighXy5pc1N0cmluZyhuYW1lKSl7XG4gICAgY29uc29sZS5lcnJvcignTmFtZSBwcm92aWRlZCB0byByZWdpc3RlckhlbHBlciBtdXN0IGJlIGEgc3RyaW5nIScpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZighXy5pc0Z1bmN0aW9uKGNhbGxiYWNrKSl7XG4gICAgY29uc29sZS5lcnJvcignQ2FsbGJhY2sgcHJvdmlkZWQgdG8gcmVnaWVySGVscGVyIG11c3QgYmUgYSBmdW5jdGlvbiEnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYoaGVscGVycy5sb29rdXBIZWxwZXIobmFtZSkpe1xuICAgIGNvbnNvbGUuZXJyb3IoJ0EgaGVscGVyIGNhbGxlZCBcIicgKyBuYW1lICsgJ1wiIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCEnKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBwYXJhbXMgPSAoXy5pc0FycmF5KHBhcmFtcykpID8gcGFyYW1zIDogW3BhcmFtc107XG4gIGNhbGxiYWNrLl9fcGFyYW1zID0gcGFyYW1zO1xuXG4gIGhlbHBlcnNbbmFtZV0gPSBjYWxsYmFjaztcblxufTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRGVmYXVsdCBoZWxwZXJzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuaGVscGVycy5vbiA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcbiAgdmFyIGksIGNhbGxiYWNrLCBkZWxlZ2F0ZSwgZWxlbWVudCxcbiAgICAgIGV2ZW50TmFtZSA9IHBhcmFtc1swXSxcbiAgICAgIGxlbiA9IHBhcmFtcy5sZW5ndGgsXG4gICAgICBkYXRhID0gaGFzaDtcblxuICAvLyBCeSBkZWZhdWx0IGV2ZXJ5dGhpbmcgaXMgZGVsZWdhdGVkIG9uIHRoZSBwYXJlbnQgY29tcG9uZW50XG4gIGlmKGxlbiA9PT0gMil7XG4gICAgY2FsbGJhY2sgPSBwYXJhbXNbMV07XG4gICAgZGVsZWdhdGUgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgZWxlbWVudCA9ICh0aGlzLmVsIHx8IG9wdGlvbnMuZWxlbWVudCk7XG4gIH1cbiAgLy8gSWYgYSBzZWxlY3RvciBpcyBwcm92aWRlZCwgZGVsZWdhdGUgb24gdGhlIGhlbHBlcidzIGVsZW1lbnRcbiAgZWxzZSBpZihsZW4gPT09IDMpe1xuICAgIGNhbGxiYWNrID0gcGFyYW1zWzJdO1xuICAgIGRlbGVnYXRlID0gcGFyYW1zWzFdO1xuICAgIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gIH1cblxuICAvLyBBdHRhY2ggZXZlbnRcbiAgJChlbGVtZW50KS5vbihldmVudE5hbWUsIGRlbGVnYXRlLCBkYXRhLCBmdW5jdGlvbihldmVudCl7XG4gICAgZXZlbnQuY29udGV4dCA9IG9wdGlvbnMuY29udGV4dDtcbiAgICByZXR1cm4gb3B0aW9ucy5oZWxwZXJzLl9fY2FsbE9uQ29tcG9uZW50KGNhbGxiYWNrLCBldmVudCk7XG4gIH0pO1xufTtcblxuaGVscGVycy5sZW5ndGggPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG4gICAgcmV0dXJuIHBhcmFtc1swXSAmJiBwYXJhbXNbMF0ubGVuZ3RoIHx8IDA7XG59O1xuXG5oZWxwZXJzLmlmID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuXG4gIHZhciBjb25kaXRpb24gPSBwYXJhbXNbMF07XG5cbiAgaWYoY29uZGl0aW9uID09PSB1bmRlZmluZWQpe1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgaWYoY29uZGl0aW9uLmlzTW9kZWwpe1xuICAgIGNvbmRpdGlvbiA9IHRydWU7XG4gIH1cblxuICAvLyBJZiBvdXIgY29uZGl0aW9uIGlzIGFuIGFycmF5LCBoYW5kbGUgcHJvcGVybHlcbiAgaWYoXy5pc0FycmF5KGNvbmRpdGlvbikgfHwgY29uZGl0aW9uLmlzQ29sbGVjdGlvbil7XG4gICAgY29uZGl0aW9uID0gY29uZGl0aW9uLmxlbmd0aCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuXG4gIGlmKGNvbmRpdGlvbiA9PT0gJ3RydWUnKXsgY29uZGl0aW9uID0gdHJ1ZTsgfVxuICBpZihjb25kaXRpb24gPT09ICdmYWxzZScpeyBjb25kaXRpb24gPSBmYWxzZTsgfVxuXG4gIC8vIElmIG1vcmUgdGhhbiBvbmUgcGFyYW0sIHRoaXMgaXMgbm90IGEgYmxvY2sgaGVscGVyLiBFdmFsIGFzIHN1Y2guXG4gIGlmKHBhcmFtcy5sZW5ndGggPiAxKXtcbiAgICByZXR1cm4gKGNvbmRpdGlvbikgPyBwYXJhbXNbMV0gOiAoIHBhcmFtc1syXSB8fCAnJyk7XG4gIH1cblxuICAvLyBDaGVjayBvdXIgY2FjaGUuIElmIHRoZSB2YWx1ZSBoYXNuJ3QgYWN0dWFsbHkgY2hhbmdlZCwgZG9uJ3QgZXZhbHVhdGUuIEltcG9ydGFudCBmb3IgcmUtcmVuZGVyaW5nIG9mICNlYWNoIGhlbHBlcnMuXG4gIGlmKG9wdGlvbnMucGxhY2Vob2xkZXIuX19pZkNhY2hlID09PSBjb25kaXRpb24pe1xuICAgIHJldHVybiBudWxsOyAvLyBSZXR1cm4gbnVsbCBwcmV2ZW50J3MgcmUtcmVuZGluZyBvZiBvdXIgcGxhY2Vob2xkZXIuXG4gIH1cblxuICBvcHRpb25zLnBsYWNlaG9sZGVyLl9faWZDYWNoZSA9IGNvbmRpdGlvbjtcblxuICAvLyBSZW5kZXIgdGhlIGFwcm9wcmVhdGUgYmxvY2sgc3RhdGVtZW50XG4gIGlmKGNvbmRpdGlvbiAmJiBvcHRpb25zLnRlbXBsYXRlKXtcbiAgICByZXR1cm4gb3B0aW9ucy50ZW1wbGF0ZS5yZW5kZXIob3B0aW9ucy5jb250ZXh0LCBvcHRpb25zLCAob3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCB8fCBvcHRpb25zLm1vcnBoLmVsZW1lbnQpKTtcbiAgfVxuICBlbHNlIGlmKCFjb25kaXRpb24gJiYgb3B0aW9ucy5pbnZlcnNlKXtcbiAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIG9wdGlvbnMsIChvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50IHx8IG9wdGlvbnMubW9ycGguZWxlbWVudCkpO1xuICB9XG5cbiAgcmV0dXJuICcnO1xufTtcblxuXG4vLyBUT0RPOiBQcm94eSB0byBpZiBoZWxwZXIgd2l0aCBpbnZlcnRlZCBwYXJhbXNcbmhlbHBlcnMudW5sZXNzID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuICB2YXIgY29uZGl0aW9uID0gcGFyYW1zWzBdO1xuXG4gIGlmKGNvbmRpdGlvbiA9PT0gdW5kZWZpbmVkKXtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmKGNvbmRpdGlvbi5pc01vZGVsKXtcbiAgICBjb25kaXRpb24gPSB0cnVlO1xuICB9XG5cbiAgLy8gSWYgb3VyIGNvbmRpdGlvbiBpcyBhbiBhcnJheSwgaGFuZGxlIHByb3Blcmx5XG4gIGlmKF8uaXNBcnJheShjb25kaXRpb24pIHx8IGNvbmRpdGlvbi5pc0NvbGxlY3Rpb24pe1xuICAgIGNvbmRpdGlvbiA9IGNvbmRpdGlvbi5sZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cblxuICAvLyBJZiBtb3JlIHRoYW4gb25lIHBhcmFtLCB0aGlzIGlzIG5vdCBhIGJsb2NrIGhlbHBlci4gRXZhbCBhcyBzdWNoLlxuICBpZihwYXJhbXMubGVuZ3RoID4gMSl7XG4gICAgcmV0dXJuICghY29uZGl0aW9uKSA/IHBhcmFtc1sxXSA6ICggcGFyYW1zWzJdIHx8ICcnKTtcbiAgfVxuXG4gIC8vIENoZWNrIG91ciBjYWNoZS4gSWYgdGhlIHZhbHVlIGhhc24ndCBhY3R1YWxseSBjaGFuZ2VkLCBkb24ndCBldmFsdWF0ZS4gSW1wb3J0YW50IGZvciByZS1yZW5kZXJpbmcgb2YgI2VhY2ggaGVscGVycy5cbiAgaWYob3B0aW9ucy5wbGFjZWhvbGRlci5fX3VubGVzc0NhY2hlID09PSBjb25kaXRpb24pe1xuICAgIHJldHVybiBudWxsOyAvLyBSZXR1cm4gbnVsbCBwcmV2ZW50J3MgcmUtcmVuZGluZyBvZiBvdXIgcGxhY2Vob2xkZXIuXG4gIH1cblxuICBvcHRpb25zLnBsYWNlaG9sZGVyLl9fdW5sZXNzQ2FjaGUgPSBjb25kaXRpb247XG5cbiAgLy8gUmVuZGVyIHRoZSBhcHJvcHJlYXRlIGJsb2NrIHN0YXRlbWVudFxuICBpZighY29uZGl0aW9uICYmICBvcHRpb25zLnRlbXBsYXRlKXtcbiAgICByZXR1cm4gb3B0aW9ucy50ZW1wbGF0ZS5yZW5kZXIob3B0aW9ucy5jb250ZXh0LCBvcHRpb25zLCAob3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCB8fCBvcHRpb25zLm1vcnBoLmVsZW1lbnQpKTtcbiAgfVxuICBlbHNlIGlmKGNvbmRpdGlvbiAmJiBvcHRpb25zLmludmVyc2Upe1xuICAgIHJldHVybiBvcHRpb25zLmludmVyc2UucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgb3B0aW9ucywgKG9wdGlvbnMubW9ycGguY29udGV4dHVhbEVsZW1lbnQgfHwgb3B0aW9ucy5tb3JwaC5lbGVtZW50KSk7XG4gIH1cblxuICByZXR1cm4gJyc7XG59O1xuXG4vLyBHaXZlbiBhbiBhcnJheSwgcHJlZGljYXRlIGFuZCBvcHRpb25hbCBleHRyYSB2YXJpYWJsZSwgZmluZHMgdGhlIGluZGV4IGluIHRoZSBhcnJheSB3aGVyZSBwcmVkaWNhdGUgaXMgdHJ1ZVxuZnVuY3Rpb24gZmluZEluZGV4KGFyciwgcHJlZGljYXRlLCBjaWQpIHtcbiAgaWYgKGFyciA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZmluZEluZGV4IGNhbGxlZCBvbiBudWxsIG9yIHVuZGVmaW5lZCcpO1xuICB9XG4gIGlmICh0eXBlb2YgcHJlZGljYXRlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncHJlZGljYXRlIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB9XG4gIHZhciBsaXN0ID0gT2JqZWN0KGFycik7XG4gIHZhciBsZW5ndGggPSBsaXN0Lmxlbmd0aCA+Pj4gMDtcbiAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG4gIHZhciB2YWx1ZTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFsdWUgPSBsaXN0W2ldO1xuICAgIGlmIChwcmVkaWNhdGUuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaSwgbGlzdCwgY2lkKSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuaGVscGVycy5lYWNoID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuXG4gIGlmKF8uaXNOdWxsKHBhcmFtc1swXSkgfHwgXy5pc1VuZGVmaW5lZChwYXJhbXNbMF0pKXsgY29uc29sZS53YXJuKCdVbmRlZmluZWQgdmFsdWUgcGFzc2VkIHRvIGVhY2ggaGVscGVyISBNYXliZSB0cnkgcHJvdmlkaW5nIGEgZGVmYXVsdCB2YWx1ZT8nLCBvcHRpb25zLmNvbnRleHQpOyByZXR1cm4gbnVsbDsgfVxuXG4gIHZhciB2YWx1ZSA9IChwYXJhbXNbMF0uaXNDb2xsZWN0aW9uKSA/IHBhcmFtc1swXS5tb2RlbHMgOiBwYXJhbXNbMF0sIC8vIEFjY2VwdHMgY29sbGVjdGlvbnMgb3IgYXJyYXlzXG4gICAgICBzdGFydCwgZW5kLCAvLyB1c2VkIGJlbG93IHRvIHJlbW92ZSB0cmFpbGluZyBqdW5rIG1vcnBocyBmcm9tIHRoZSBkb21cbiAgICAgIHBvc2l0aW9uLCAvLyBTdG9yZXMgdGhlIGl0ZXJhdGVkIGVsZW1lbnQncyBpbnRlZ2VyIHBvc2l0aW9uIGluIHRoZSBkb20gbGlzdFxuICAgICAgY3VycmVudE1vZGVsID0gZnVuY3Rpb24oZWxlbWVudCwgaW5kZXgsIGFycmF5LCBjaWQpe1xuICAgICAgICByZXR1cm4gZWxlbWVudC5jaWQgPT09IGNpZDsgLy8gUmV0dXJucyB0cnVlIGlmIGN1cnJlbnRseSBvYnNlcnZlZCBlbGVtZW50IGlzIHRoZSBjdXJyZW50IG1vZGVsLlxuICAgICAgfTtcblxuICAvLyBDcmVhdGUgb3VyIG1vcnBoIGFycmF5IGlmIGl0IGRvZXNudCBleGlzdFxuICBvcHRpb25zLnBsYWNlaG9sZGVyLm1vcnBocyA9IG9wdGlvbnMucGxhY2Vob2xkZXIubW9ycGhzIHx8IFtdO1xuXG4gIF8uZWFjaCh2YWx1ZSwgZnVuY3Rpb24ob2JqLCBrZXksIGxpc3Qpe1xuXG4gICAgaWYoIV8uaXNGdW5jdGlvbihvYmouc2V0KSl7IHJldHVybiBjb25zb2xlLmVycm9yKCdNb2RlbCAnLCBvYmosICdoYXMgbm8gbWV0aG9kIC5zZXQoKSEnKTsgfVxuXG4gICAgcG9zaXRpb24gPSBmaW5kSW5kZXgob3B0aW9ucy5wbGFjZWhvbGRlci5tb3JwaHMsIGN1cnJlbnRNb2RlbCwgb2JqLmNpZCk7XG5cbiAgICAvLyBUT0RPOiBUaGVzZSBuZWVkIHRvIGJlIHJlLWFkZGVkIGluIGFzIGRhdGEgYXR0cmlidXRlc1xuICAgIC8vIEV2ZW4gaWYgcmVuZGVyZWQgYWxyZWFkeSwgdXBkYXRlIGVhY2ggZWxlbWVudCdzIGluZGV4LCBrZXksIGZpcnN0IGFuZCBsYXN0IGluIGNhc2Ugb2Ygb3JkZXIgY2hhbmdlcyBvciBlbGVtZW50IHJlbW92YWxzXG4gICAgLy8gaWYoXy5pc0FycmF5KHZhbHVlKSl7XG4gICAgLy8gICBvYmouc2V0KHsnQGluZGV4Jzoga2V5LCAnQGZpcnN0JzogKGtleSA9PT0gMCksICdAbGFzdCc6IChrZXkgPT09IHZhbHVlLmxlbmd0aC0xKX0sIHtzaWxlbnQ6IHRydWV9KTtcbiAgICAvLyB9XG4gICAgLy9cbiAgICAvLyBpZighXy5pc0FycmF5KHZhbHVlKSAmJiBfLmlzT2JqZWN0KHZhbHVlKSl7XG4gICAgLy8gICBvYmouc2V0KHsnQGtleScgOiBrZXl9LCB7c2lsZW50OiB0cnVlfSk7XG4gICAgLy8gfVxuXG4gICAgLy8gSWYgdGhpcyBtb2RlbCBpcyBub3QgdGhlIG1vcnBoIGVsZW1lbnQgYXQgdGhpcyBpbmRleFxuICAgIGlmKHBvc2l0aW9uICE9PSBrZXkpe1xuXG4gICAgICAvLyBDcmVhdGUgYSBsYXp5dmFsdWUgd2hvcyB2YWx1ZSBpcyB0aGUgY29udGVudCBpbnNpZGUgb3VyIGJsb2NrIGhlbHBlciByZW5kZXJlZCBpbiB0aGUgY29udGV4dCBvZiB0aGlzIGN1cnJlbnQgbGlzdCBvYmplY3QuIFJldHVybnMgdGhlIHJlbmRlcmVkIGRvbSBmb3IgdGhpcyBsaXN0IGVsZW1lbnQuXG4gICAgICB2YXIgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpe1xuICAgICAgICByZXR1cm4gb3B0aW9ucy50ZW1wbGF0ZS5yZW5kZXIoKChvcHRpb25zLnRlbXBsYXRlLmJsb2NrUGFyYW1zID09PSAwKT9vYmo6b3B0aW9ucy5jb250ZXh0KSwgb3B0aW9ucywgKG9wdGlvbnMubW9ycGguY29udGV4dHVhbEVsZW1lbnQgfHwgb3B0aW9ucy5tb3JwaC5lbGVtZW50KSwgW29ial0pO1xuICAgICAgfSwge21vcnBoOiBvcHRpb25zLnBsYWNlaG9sZGVyfSk7XG5cbiAgICAgIC8vIElmIHRoaXMgbW9kZWwgaXMgcmVuZGVyZWQgc29tZXdoZXJlIGVsc2UgaW4gdGhlIGxpc3QsIGRlc3Ryb3kgaXRcbiAgICAgIGlmKHBvc2l0aW9uID4gLTEpe1xuICAgICAgICBvcHRpb25zLnBsYWNlaG9sZGVyLm1vcnBoc1twb3NpdGlvbl0uZGVzdHJveSgpO1xuICAgICAgfVxuXG4gICAgICAvLyBEZXN0cm95IHRoZSBtb3JwaCB3ZSdyZSByZXBsYWNpbmdcbiAgICAgIGlmKG9wdGlvbnMucGxhY2Vob2xkZXIubW9ycGhzW2tleV0pe1xuICAgICAgICBvcHRpb25zLnBsYWNlaG9sZGVyLm1vcnBoc1trZXldLmRlc3Ryb3koKTtcbiAgICAgIH1cblxuICAgICAgLy8gSW5zZXJ0IG91ciBuZXdseSByZW5kZXJlZCB2YWx1ZSAoYSBkb2N1bWVudCB0cmVlKSBpbnRvIG91ciBwbGFjZWhvbGRlciAodGhlIGNvbnRhaW5pbmcgZWxlbWVudCkgYXQgaXRzIHJlcXVlc3RlZCBwb3NpdGlvbiAod2hlcmUgd2UgY3VycmVudGx5IGFyZSBpbiB0aGUgb2JqZWN0IGxpc3QpXG4gICAgICBvcHRpb25zLnBsYWNlaG9sZGVyLmluc2VydChrZXksIGxhenlWYWx1ZS52YWx1ZSgpKTtcblxuICAgICAgLy8gTGFiZWwgdGhlIGluc2VydGVkIG1vcnBoIGVsZW1lbnQgd2l0aCB0aGlzIG1vZGVsJ3MgY2lkXG4gICAgICBvcHRpb25zLnBsYWNlaG9sZGVyLm1vcnBoc1trZXldLmNpZCA9IG9iai5jaWQ7XG5cbiAgICB9XG5cbiAgfSwgdGhpcyk7XG5cbiAgLy8gSWYgYW55IG1vcmUgbW9ycGhzIGFyZSBsZWZ0IG92ZXIsIHJlbW92ZSB0aGVtLiBXZSd2ZSBhbHJlYWR5IGdvbmUgdGhyb3VnaCBhbGwgdGhlIG1vZGVscy5cbiAgc3RhcnQgPSB2YWx1ZS5sZW5ndGg7XG4gIGVuZCA9IG9wdGlvbnMucGxhY2Vob2xkZXIubW9ycGhzLmxlbmd0aCAtIDE7XG4gIGZvcihlbmQ7IHN0YXJ0IDw9IGVuZDsgZW5kLS0pe1xuICAgIG9wdGlvbnMucGxhY2Vob2xkZXIubW9ycGhzW2VuZF0uZGVzdHJveSgpO1xuICB9XG5cbiAgLy8gUmV0dXJuIG51bGwgcHJldmVudCdzIHJlLXJlbmRpbmcgb2Ygb3VyIHBsYWNlaG9sZGVyLiBPdXIgcGxhY2Vob2xkZXIgKGNvbnRhaW5pbmcgZWxlbWVudCkgbm93IGhhcyBhbGwgdGhlIGRvbSB3ZSBuZWVkLlxuICByZXR1cm4gbnVsbDtcblxufTtcblxuaGVscGVycy53aXRoID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuXG4gIC8vIFJlbmRlciB0aGUgY29udGVudCBpbnNpZGUgb3VyIGJsb2NrIGhlbHBlciB3aXRoIHRoZSBjb250ZXh0IG9mIHRoaXMgb2JqZWN0LiBSZXR1cm5zIGEgZG9tIHRyZWUuXG4gIHJldHVybiBvcHRpb25zLnRlbXBsYXRlLnJlbmRlcihwYXJhbXNbMF0sIG9wdGlvbnMsIChvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50IHx8IG9wdGlvbnMubW9ycGguZWxlbWVudCkpO1xuXG59O1xuXG5oZWxwZXJzLnBhcnRpYWwgPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG4gIHZhciBwYXJ0aWFsID0gcGFydGlhbHNbcGFyYW1zWzBdXTtcbiAgaWYoIHBhcnRpYWwgJiYgcGFydGlhbC5pc0hUTUxCYXJzICl7XG4gICAgcmV0dXJuIHBhcnRpYWwucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgZW52KTtcbiAgfVxuXG59O1xuXG5leHBvcnQgZGVmYXVsdCBoZWxwZXJzO1xuIiwiLy8gUmVib3VuZCBDb21wdXRlZCBQcm9wZXJ0eVxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgcHJvcGVydHlDb21waWxlciBmcm9tIFwicHJvcGVydHktY29tcGlsZXIvcHJvcGVydHktY29tcGlsZXJcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG4vLyBSZXR1cm5zIHRydWUgaWYgc3RyIHN0YXJ0cyB3aXRoIHRlc3RcbmZ1bmN0aW9uIHN0YXJ0c1dpdGgoc3RyLCB0ZXN0KXtcbiAgaWYoc3RyID09PSB0ZXN0KSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIHN0ci5zdWJzdHJpbmcoMCwgdGVzdC5sZW5ndGgrMSkgPT09IHRlc3QrJy4nO1xufVxuXG5cbi8vIENhbGxlZCBhZnRlciBjYWxsc3RhY2sgaXMgZXhhdXN0ZWQgdG8gY2FsbCBhbGwgb2YgdGhpcyBjb21wdXRlZCBwcm9wZXJ0eSdzXG4vLyBkZXBlbmRhbnRzIHRoYXQgbmVlZCB0byBiZSByZWNvbXB1dGVkXG5mdW5jdGlvbiByZWNvbXB1dGVDYWxsYmFjaygpe1xuICB2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX3RvQ2FsbC5sZW5ndGg7XG4gIGRlbGV0ZSB0aGlzLl9yZWNvbXB1dGVUaW1lb3V0O1xuICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgdGhpcy5fdG9DYWxsLnNoaWZ0KCkuY2FsbCgpO1xuICB9XG4gIHRoaXMuX3RvQ2FsbC5hZGRlZCA9IHt9O1xufVxuXG52YXIgQ29tcHV0ZWRQcm9wZXJ0eSA9IGZ1bmN0aW9uKHByb3AsIG9wdGlvbnMpe1xuXG4gIGlmKCFfLmlzRnVuY3Rpb24ocHJvcCkpIHJldHVybiBjb25zb2xlLmVycm9yKCdDb21wdXRlZFByb3BlcnR5IGNvbnN0cnVjdG9yIG11c3QgYmUgcGFzc2VkIGEgZnVuY3Rpb24hJywgcHJvcCwgJ0ZvdW5kIGluc3RlYWQuJyk7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLmNpZCA9IF8udW5pcXVlSWQoJ2NvbXB1dGVkUHJvcGV0eScpO1xuICB0aGlzLm5hbWUgPSBvcHRpb25zLm5hbWU7XG4gIHRoaXMucmV0dXJuVHlwZSA9IG51bGw7XG4gIHRoaXMuX19vYnNlcnZlcnMgPSB7fTtcbiAgdGhpcy5oZWxwZXJzID0ge307XG4gIHRoaXMud2FpdGluZyA9IHt9O1xuICB0aGlzLmlzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgdGhpcy5pc0RpcnR5ID0gdHJ1ZTtcbiAgdGhpcy5mdW5jID0gcHJvcDtcbiAgXy5iaW5kQWxsKHRoaXMsICdvbk1vZGlmeScsICdtYXJrRGlydHknKTtcbiAgdGhpcy5kZXBzID0gcHJvcGVydHlDb21waWxlci5jb21waWxlKHByb3AsIHRoaXMubmFtZSk7XG5cbiAgLy8gQ3JlYXRlIGxpbmVhZ2UgdG8gcGFzcyB0byBvdXIgY2FjaGUgb2JqZWN0c1xuICB2YXIgbGluZWFnZSA9IHtcbiAgICBwYXJlbnQ6IHRoaXMuc2V0UGFyZW50KCBvcHRpb25zLnBhcmVudCB8fCB0aGlzICksXG4gICAgcm9vdDogdGhpcy5zZXRSb290KCBvcHRpb25zLnJvb3QgfHwgb3B0aW9ucy5wYXJlbnQgfHwgdGhpcyApLFxuICAgIHBhdGg6IHRoaXMuX19wYXRoID0gb3B0aW9ucy5wYXRoIHx8IHRoaXMuX19wYXRoXG4gIH07XG5cbiAgLy8gUmVzdWx0cyBDYWNoZSBPYmplY3RzXG4gIC8vIFRoZXNlIG1vZGVscyB3aWxsIG5ldmVyIGJlIHJlLWNyZWF0ZWQgZm9yIHRoZSBsaWZldGltZSBvZiB0aGUgQ29tcHV0ZWQgUHJvZXBydHlcbiAgLy8gT24gUmVjb21wdXRlIHRoZXkgYXJlIHVwZGF0ZWQgd2l0aCBuZXcgdmFsdWVzLlxuICAvLyBPbiBDaGFuZ2UgdGhlaXIgbmV3IHZhbHVlcyBhcmUgcHVzaGVkIHRvIHRoZSBvYmplY3QgaXQgaXMgdHJhY2tpbmdcbiAgdGhpcy5jYWNoZSA9IHtcbiAgICBtb2RlbDogbmV3IFJlYm91bmQuTW9kZWwoe30sIGxpbmVhZ2UpLFxuICAgIGNvbGxlY3Rpb246IG5ldyBSZWJvdW5kLkNvbGxlY3Rpb24oW10sIGxpbmVhZ2UpLFxuICAgIHZhbHVlOiB1bmRlZmluZWRcbiAgfTtcblxuICB0aGlzLndpcmUoKTtcblxufTtcblxuXy5leHRlbmQoQ29tcHV0ZWRQcm9wZXJ0eS5wcm90b3R5cGUsIEJhY2tib25lLkV2ZW50cywge1xuXG4gIGlzQ29tcHV0ZWRQcm9wZXJ0eTogdHJ1ZSxcbiAgaXNEYXRhOiB0cnVlLFxuICBfX3BhdGg6IGZ1bmN0aW9uKCl7IHJldHVybiAnJzsgfSxcblxuXG4gIG1hcmtEaXJ0eTogZnVuY3Rpb24oKXtcbiAgICBpZih0aGlzLmlzRGlydHkpIHJldHVybjtcbiAgICB0aGlzLmlzRGlydHkgPSB0cnVlO1xuICAgIHRoaXMudHJpZ2dlcignZGlydHknLCB0aGlzKTtcbiAgfSxcblxuICAvLyBBdHRhY2hlZCB0byBsaXN0ZW4gdG8gYWxsIGV2ZW50cyB3aGVyZSB0aGlzIENvbXB1dGVkIFByb3BlcnR5J3MgZGVwZW5kYW5jaWVzXG4gIC8vIGFyZSBzdG9yZWQuIFNlZSB3aXJlKCkuIFdpbGwgcmUtZXZhbHVhdGUgYW55IGNvbXB1dGVkIHByb3BlcnRpZXMgdGhhdFxuICAvLyBkZXBlbmQgb24gdGhlIGNoYW5nZWQgZGF0YSB2YWx1ZSB3aGljaCB0cmlnZ2VyZWQgdGhpcyBjYWxsYmFjay5cbiAgb25SZWNvbXB1dGU6IGZ1bmN0aW9uKHR5cGUsIG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKXtcbiAgICB2YXIgc2hvcnRjaXJjdWl0ID0geyBjaGFuZ2U6IDEsIHNvcnQ6IDEsIHJlcXVlc3Q6IDEsIGRlc3Ryb3k6IDEsIHN5bmM6IDEsIGVycm9yOiAxLCBpbnZhbGlkOiAxLCByb3V0ZTogMSwgZGlydHk6IDEgfTtcbiAgICBpZiggc2hvcnRjaXJjdWl0W3R5cGVdIHx8ICFtb2RlbC5pc0RhdGEgKSByZXR1cm47XG4gICAgbW9kZWwgfHwgKG1vZGVsID0ge30pO1xuICAgIGNvbGxlY3Rpb24gfHwgKGNvbGxlY3Rpb24gPSB7fSk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB0aGlzLl90b0NhbGwgfHwgKHRoaXMuX3RvQ2FsbCA9IFtdKTtcbiAgICB0aGlzLl90b0NhbGwuYWRkZWQgfHwgKHRoaXMuX3RvQ2FsbC5hZGRlZCA9IHt9KTtcbiAgICAhY29sbGVjdGlvbi5pc0RhdGEgJiYgKG9wdGlvbnMgPSBjb2xsZWN0aW9uKSAmJiAoY29sbGVjdGlvbiA9IG1vZGVsKTtcbiAgICB2YXIgcHVzaCA9IGZ1bmN0aW9uKGFycil7XG4gICAgICB2YXIgaSwgbGVuID0gYXJyLmxlbmd0aDtcbiAgICAgIHRoaXMuYWRkZWQgfHwgKHRoaXMuYWRkZWQgPSB7fSk7XG4gICAgICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgICAgIGlmKHRoaXMuYWRkZWRbYXJyW2ldLmNpZF0pIGNvbnRpbnVlO1xuICAgICAgICB0aGlzLmFkZGVkW2FycltpXS5jaWRdID0gMTtcbiAgICAgICAgdGhpcy5wdXNoKGFycltpXSk7XG4gICAgICB9XG4gICAgfSwgcGF0aCwgdmVjdG9yO1xuICAgIHZlY3RvciA9IHBhdGggPSBjb2xsZWN0aW9uLl9fcGF0aCgpLnJlcGxhY2UoL1xcLj9cXFsuKlxcXS9pZywgJy5AZWFjaCcpO1xuXG4gICAgLy8gSWYgYSByZXNldCBldmVudCBvbiBhIE1vZGVsLCBjaGVjayBmb3IgY29tcHV0ZWQgcHJvcGVydGllcyB0aGF0IGRlcGVuZFxuICAgIC8vIG9uIGVhY2ggY2hhbmdlZCBhdHRyaWJ1dGUncyBmdWxsIHBhdGguXG4gICAgaWYodHlwZSA9PT0gJ3Jlc2V0JyAmJiBvcHRpb25zLnByZXZpb3VzQXR0cmlidXRlcyl7XG4gICAgICBfLmVhY2gob3B0aW9ucy5wcmV2aW91c0F0dHJpYnV0ZXMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuICAgICAgICB2ZWN0b3IgPSBwYXRoICsgKHBhdGggJiYgJy4nKSArIGtleTtcbiAgICAgICAgXy5lYWNoKHRoaXMuX19jb21wdXRlZERlcHMsIGZ1bmN0aW9uKGRlcGVuZGFudHMsIGRlcGVuZGFuY3kpe1xuICAgICAgICAgIHN0YXJ0c1dpdGgodmVjdG9yLCBkZXBlbmRhbmN5KSAmJiBwdXNoLmNhbGwodGhpcy5fdG9DYWxsLCBkZXBlbmRhbnRzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhIHJlc2V0IGV2ZW50IG9uIGEgQ29sbGN0aW9uLCBjaGVjayBmb3IgY29tcHV0ZWQgcHJvcGVydGllcyB0aGF0IGRlcGVuZFxuICAgIC8vIG9uIGFueXRoaW5nIGluc2lkZSB0aGF0IGNvbGxlY3Rpb24uXG4gICAgZWxzZSBpZih0eXBlID09PSAncmVzZXQnICYmIG9wdGlvbnMucHJldmlvdXNNb2RlbHMpe1xuICAgICAgXy5lYWNoKHRoaXMuX19jb21wdXRlZERlcHMsIGZ1bmN0aW9uKGRlcGVuZGFudHMsIGRlcGVuZGFuY3kpe1xuICAgICAgICBzdGFydHNXaXRoKGRlcGVuZGFuY3ksIHZlY3RvcikgJiYgcHVzaC5jYWxsKHRoaXMuX3RvQ2FsbCwgZGVwZW5kYW50cyk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhbiBhZGQgb3IgcmVtb3ZlIGV2ZW50LCBjaGVjayBmb3IgY29tcHV0ZWQgcHJvcGVydGllcyB0aGF0IGRlcGVuZCBvblxuICAgIC8vIGFueXRoaW5nIGluc2lkZSB0aGF0IGNvbGxlY3Rpb24gb3IgdGhhdCBjb250YWlucyB0aGF0IGNvbGxlY3Rpb24uXG4gICAgZWxzZSBpZih0eXBlID09PSAnYWRkJyB8fCB0eXBlID09PSAncmVtb3ZlJyl7XG4gICAgICBfLmVhY2godGhpcy5fX2NvbXB1dGVkRGVwcywgZnVuY3Rpb24oZGVwZW5kYW50cywgZGVwZW5kYW5jeSl7XG4gICAgICAgIGlmKCBzdGFydHNXaXRoKGRlcGVuZGFuY3ksIHZlY3RvcikgfHwgc3RhcnRzV2l0aCh2ZWN0b3IsIGRlcGVuZGFuY3kpICkgcHVzaC5jYWxsKHRoaXMuX3RvQ2FsbCwgZGVwZW5kYW50cyk7O1xuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLy8gSWYgYSBjaGFuZ2UgZXZlbnQsIHRyaWdnZXIgYW55dGhpbmcgdGhhdCBkZXBlbmRzIG9uIHRoYXQgY2hhbmdlZCBwYXRoLlxuICAgIGVsc2UgaWYodHlwZS5pbmRleE9mKCdjaGFuZ2U6JykgPT09IDApe1xuICAgICAgdmVjdG9yID0gdHlwZS5yZXBsYWNlKCdjaGFuZ2U6JywgJycpLnJlcGxhY2UoL1xcLj9cXFsuKlxcXS9pZywgJy5AZWFjaCcpO1xuICAgICAgXy5lYWNoKHRoaXMuX19jb21wdXRlZERlcHMsIGZ1bmN0aW9uKGRlcGVuZGFudHMsIGRlcGVuZGFuY3kpe1xuICAgICAgICBzdGFydHNXaXRoKHZlY3RvciwgZGVwZW5kYW5jeSkgJiYgcHVzaC5jYWxsKHRoaXMuX3RvQ2FsbCwgZGVwZW5kYW50cyk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICB2YXIgaSwgbGVuID0gdGhpcy5fdG9DYWxsLmxlbmd0aDtcbiAgICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgICB0aGlzLl90b0NhbGxbaV0ubWFya0RpcnR5KCk7XG4gICAgfVxuXG4gICAgLy8gTm90aWZpZXMgYWxsIGNvbXB1dGVkIHByb3BlcnRpZXMgaW4gdGhlIGRlcGVuZGFudHMgYXJyYXkgdG8gcmVjb21wdXRlLlxuICAgIC8vIE1hcmtzIGV2ZXJ5b25lIGFzIGRpcnR5IGFuZCB0aGVuIGNhbGxzIHRoZW0uXG4gICAgaWYoIXRoaXMuX3JlY29tcHV0ZVRpbWVvdXQpIHRoaXMuX3JlY29tcHV0ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KF8uYmluZChyZWNvbXB1dGVDYWxsYmFjaywgdGhpcyksIDApO1xuICAgIHJldHVybjtcbiAgfSxcblxuXG4gIC8vIENhbGxlZCB3aGVuIGEgQ29tcHV0ZWQgUHJvcGVydHkncyBhY3RpdmUgY2FjaGUgb2JqZWN0IGNoYW5nZXMuXG4gIC8vIFB1c2hlcyBhbnkgY2hhbmdlcyB0byBDb21wdXRlZCBQcm9wZXJ0eSB0aGF0IHJldHVybnMgYSBkYXRhIG9iamVjdCBiYWNrIHRvXG4gIC8vIHRoZSBvcmlnaW5hbCBvYmplY3QuXG4gIG9uTW9kaWZ5OiBmdW5jdGlvbih0eXBlLCBtb2RlbCwgY29sbGVjdGlvbiwgb3B0aW9ucyl7XG4gICAgdmFyIHNob3J0Y2lyY3VpdCA9IHsgc29ydDogMSwgcmVxdWVzdDogMSwgZGVzdHJveTogMSwgc3luYzogMSwgZXJyb3I6IDEsIGludmFsaWQ6IDEsIHJvdXRlOiAxIH07XG4gICAgaWYoICF0aGlzLnRyYWNraW5nIHx8IHNob3J0Y2lyY3VpdFt0eXBlXSB8fCB+dHlwZS5pbmRleE9mKCdjaGFuZ2U6JykgKSByZXR1cm47XG4gICAgbW9kZWwgfHwgKG1vZGVsID0ge30pO1xuICAgIGNvbGxlY3Rpb24gfHwgKGNvbGxlY3Rpb24gPSB7fSk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICAhY29sbGVjdGlvbi5pc0RhdGEgJiYgXy5pc09iamVjdChjb2xsZWN0aW9uKSAmJiAob3B0aW9ucyA9IGNvbGxlY3Rpb24pICYmIChjb2xsZWN0aW9uID0gbW9kZWwpO1xuICAgIHZhciBzcmMgPSB0aGlzO1xuICAgIHZhciBwYXRoID0gY29sbGVjdGlvbi5fX3BhdGgoKS5yZXBsYWNlKHNyYy5fX3BhdGgoKSwgJycpLnJlcGxhY2UoL15cXC4vLCAnJyk7XG4gICAgdmFyIGRlc3QgPSB0aGlzLnRyYWNraW5nLmdldChwYXRoKTtcblxuICAgIGlmKF8uaXNVbmRlZmluZWQoZGVzdCkpIHJldHVybjtcbiAgICBpZih0eXBlID09PSAnY2hhbmdlJykgZGVzdC5zZXQgJiYgZGVzdC5zZXQobW9kZWwuY2hhbmdlZEF0dHJpYnV0ZXMoKSk7XG4gICAgZWxzZSBpZih0eXBlID09PSAncmVzZXQnKSBkZXN0LnJlc2V0ICYmIGRlc3QucmVzZXQobW9kZWwpO1xuICAgIGVsc2UgaWYodHlwZSA9PT0gJ2FkZCcpICBkZXN0LmFkZCAmJiBkZXN0LmFkZChtb2RlbCk7XG4gICAgZWxzZSBpZih0eXBlID09PSAncmVtb3ZlJykgIGRlc3QucmVtb3ZlICYmIGRlc3QucmVtb3ZlKG1vZGVsKTtcbiAgICAvLyBUT0RPOiBBZGQgc29ydFxuICB9LFxuXG4gIC8vIEFkZHMgYSBsaXRlbmVyIHRvIHRoZSByb290IG9iamVjdCBhbmQgdGVsbHMgaXQgd2hhdCBwcm9wZXJ0aWVzIHRoaXNcbiAgLy8gQ29tcHV0ZWQgUHJvcGVydHkgZGVwZW5kIG9uLlxuICAvLyBUaGUgbGlzdGVuZXIgd2lsbCByZS1jb21wdXRlIHRoaXMgQ29tcHV0ZWQgUHJvcGVydHkgd2hlbiBhbnkgYXJlIGNoYW5nZWQuXG4gIHdpcmU6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHJvb3QgPSB0aGlzLl9fcm9vdF9fO1xuICAgIHZhciBjb250ZXh0ID0gdGhpcy5fX3BhcmVudF9fO1xuICAgIHJvb3QuX19jb21wdXRlZERlcHMgfHwgKHJvb3QuX19jb21wdXRlZERlcHMgPSB7fSk7XG5cbiAgICBfLmVhY2godGhpcy5kZXBzLCBmdW5jdGlvbihwYXRoKXtcbiAgICAgIHZhciBkZXAgPSByb290LmdldChwYXRoLCB7cmF3OiB0cnVlfSk7XG4gICAgICBpZighZGVwIHx8ICFkZXAuaXNDb21wdXRlZFByb3BlcnR5KSByZXR1cm47XG4gICAgICBkZXAub24oJ2RpcnR5JywgdGhpcy5tYXJrRGlydHkpO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgXy5lYWNoKHRoaXMuZGVwcywgZnVuY3Rpb24ocGF0aCl7XG4gICAgICAvLyBGaW5kIGFjdHVhbCBwYXRoIGZyb20gcmVsYXRpdmUgcGF0aHNcbiAgICAgIHZhciBzcGxpdCA9ICQuc3BsaXRQYXRoKHBhdGgpO1xuICAgICAgd2hpbGUoc3BsaXRbMF0gPT09ICdAcGFyZW50Jyl7XG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0Ll9fcGFyZW50X187XG4gICAgICAgIHNwbGl0LnNoaWZ0KCk7XG4gICAgICB9XG5cbiAgICAgIHBhdGggPSBjb250ZXh0Ll9fcGF0aCgpLnJlcGxhY2UoL1xcLj9cXFsuKlxcXS9pZywgJy5AZWFjaCcpO1xuICAgICAgcGF0aCA9IHBhdGggKyAocGF0aCAmJiAnLicpICsgc3BsaXQuam9pbignLicpO1xuXG4gICAgICAvLyBBZGQgb3Vyc2VsdmVzIGFzIGRlcGVuZGFudHNcbiAgICAgIHJvb3QuX19jb21wdXRlZERlcHNbcGF0aF0gfHwgKHJvb3QuX19jb21wdXRlZERlcHNbcGF0aF0gPSBbXSk7XG4gICAgICByb290Ll9fY29tcHV0ZWREZXBzW3BhdGhdLnB1c2godGhpcyk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICAvLyBFbnN1cmUgd2Ugb25seSBoYXZlIG9uZSBsaXN0ZW5lciBwZXIgTW9kZWwgYXQgYSB0aW1lLlxuICAgIGNvbnRleHQub2ZmKCdhbGwnLCB0aGlzLm9uUmVjb21wdXRlKS5vbignYWxsJywgdGhpcy5vblJlY29tcHV0ZSk7XG4gIH0sXG5cbiAgLy8gQ2FsbCB0aGlzIGNvbXB1dGVkIHByb3BlcnR5IGxpa2UgeW91IHdvdWxkIHdpdGggRnVuY3Rpb24uY2FsbCgpXG4gIGNhbGw6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICBjb250ZXh0ID0gYXJncy5zaGlmdCgpO1xuICAgIHJldHVybiB0aGlzLmFwcGx5KGNvbnRleHQsIGFyZ3MpO1xuICB9LFxuXG4gIC8vIENhbGwgdGhpcyBjb21wdXRlZCBwcm9wZXJ0eSBsaWtlIHlvdSB3b3VsZCB3aXRoIEZ1bmN0aW9uLmFwcGx5KClcbiAgLy8gT25seSBwcm9wZXJ0aWVzIHRoYXQgYXJlIG1hcmtlZCBhcyBkaXJ0eSBhbmQgYXJlIG5vdCBhbHJlYWR5IGNvbXB1dGluZ1xuICAvLyB0aGVtc2VsdmVzIGFyZSBldmFsdWF0ZWQgdG8gcHJldmVudCBjeWNsaWMgY2FsbGJhY2tzLiBJZiBhbnkgZGVwZW5kYW50c1xuICAvLyBhcmVuJ3QgZmluaXNoZWQgY29tcHV0ZWRpbmcsIHdlIGFkZCBvdXJzZWx2ZWQgdG8gdGhlaXIgd2FpdGluZyBsaXN0LlxuICAvLyBWYW5pbGxhIG9iamVjdHMgcmV0dXJuZWQgZnJvbSB0aGUgZnVuY3Rpb24gYXJlIHByb21vdGVkIHRvIFJlYm91bmQgT2JqZWN0cy5cbiAgLy8gVGhlbiwgc2V0IHRoZSBwcm9wZXIgcmV0dXJuIHR5cGUgZm9yIGZ1dHVyZSBmZXRjaGVzIGZyb20gdGhlIGNhY2hlIGFuZCBzZXRcbiAgLy8gdGhlIG5ldyBjb21wdXRlZCB2YWx1ZS4gVHJhY2sgY2hhbmdlcyB0byB0aGUgY2FjaGUgdG8gcHVzaCBpdCBiYWNrIHVwIHRvXG4gIC8vIHRoZSBvcmlnaW5hbCBvYmplY3QgYW5kIHJldHVybiB0aGUgdmFsdWUuXG4gIGFwcGx5OiBmdW5jdGlvbihjb250ZXh0LCBwYXJhbXMpe1xuXG4gICAgaWYoIXRoaXMuaXNEaXJ0eSB8fCB0aGlzLmlzQ2hhbmdpbmcpIHJldHVybjtcbiAgICB0aGlzLmlzQ2hhbmdpbmcgPSB0cnVlO1xuXG4gICAgdmFyIHZhbHVlID0gdGhpcy5jYWNoZVt0aGlzLnJldHVyblR5cGVdLFxuICAgICAgICByZXN1bHQ7XG5cbiAgICBjb250ZXh0IHx8IChjb250ZXh0ID0gdGhpcy5fX3BhcmVudF9fKTtcblxuICAgIC8vIENoZWNrIGFsbCBvZiBvdXIgZGVwZW5kYW5jaWVzIHRvIHNlZSBpZiB0aGV5IGFyZSBldmFsdWF0aW5nLlxuICAgIC8vIElmIHdlIGhhdmUgYSBkZXBlbmRhbmN5IHRoYXQgaXMgZGlydHkgYW5kIHRoaXMgaXNudCBpdHMgZmlyc3QgcnVuLFxuICAgIC8vIExldCB0aGlzIGRlcGVuZGFuY3kga25vdyB0aGF0IHdlIGFyZSB3YWl0aW5nIGZvciBpdC5cbiAgICAvLyBJdCB3aWxsIHJlLXJ1biB0aGlzIENvbXB1dGVkIFByb3BlcnR5IGFmdGVyIGl0IGZpbmlzaGVzLlxuICAgIF8uZWFjaCh0aGlzLmRlcHMsIGZ1bmN0aW9uKGRlcCl7XG4gICAgICB2YXIgZGVwZW5kYW5jeSA9IGNvbnRleHQuZ2V0KGRlcCwge3JhdzogdHJ1ZX0pO1xuICAgICAgaWYoIWRlcGVuZGFuY3kgfHwgIWRlcGVuZGFuY3kuaXNDb21wdXRlZFByb3BlcnR5KSByZXR1cm47XG4gICAgICBpZihkZXBlbmRhbmN5LmlzRGlydHkgJiYgZGVwZW5kYW5jeS5yZXR1cm5UeXBlICE9PSBudWxsKXtcbiAgICAgICAgZGVwZW5kYW5jeS53YWl0aW5nW3RoaXMuY2lkXSA9IHRoaXM7XG4gICAgICAgIGRlcGVuZGFuY3kuYXBwbHkoKTsgLy8gVHJ5IHRvIHJlLWV2YWx1YXRlIHRoaXMgZGVwZW5kYW5jeSBpZiBpdCBpcyBkaXJ0eVxuICAgICAgICBpZihkZXBlbmRhbmN5LmlzRGlydHkpIHJldHVybiB0aGlzLmlzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGRlbGV0ZSBkZXBlbmRhbmN5LndhaXRpbmdbdGhpcy5jaWRdO1xuICAgICAgLy8gVE9ETzogVGhlcmUgY2FuIGJlIGEgY2hlY2sgaGVyZSBsb29raW5nIGZvciBjeWNsaWMgZGVwZW5kYW5jaWVzLlxuICAgIH0sIHRoaXMpO1xuXG4gICAgaWYoIXRoaXMuaXNDaGFuZ2luZykgcmV0dXJuO1xuXG4gICAgdGhpcy5zdG9wTGlzdGVuaW5nKHZhbHVlLCAnYWxsJywgdGhpcy5vbk1vZGlmeSk7XG5cbiAgICByZXN1bHQgPSB0aGlzLmZ1bmMuYXBwbHkoY29udGV4dCwgcGFyYW1zKTtcblxuICAgIC8vIFByb21vdGUgdmFuaWxsYSBvYmplY3RzIHRvIFJlYm91bmQgRGF0YSBrZWVwaW5nIHRoZSBzYW1lIG9yaWdpbmFsIG9iamVjdHNcbiAgICBpZihfLmlzQXJyYXkocmVzdWx0KSkgcmVzdWx0ID0gbmV3IFJlYm91bmQuQ29sbGVjdGlvbihyZXN1bHQsIHtjbG9uZTogZmFsc2V9KTtcbiAgICBlbHNlIGlmKF8uaXNPYmplY3QocmVzdWx0KSAmJiAhcmVzdWx0LmlzRGF0YSkgcmVzdWx0ID0gbmV3IFJlYm91bmQuTW9kZWwocmVzdWx0LCB7Y2xvbmU6IGZhbHNlfSk7XG5cbiAgICAvLyBJZiByZXN1bHQgaXMgdW5kZWZpbmVkLCByZXNldCBvdXIgY2FjaGUgaXRlbVxuICAgIGlmKF8uaXNVbmRlZmluZWQocmVzdWx0KSB8fCBfLmlzTnVsbChyZXN1bHQpKXtcbiAgICAgIHRoaXMucmV0dXJuVHlwZSA9ICd2YWx1ZSc7XG4gICAgICB0aGlzLmlzQ29sbGVjdGlvbiA9IHRoaXMuaXNNb2RlbCA9IGZhbHNlO1xuICAgICAgdGhpcy5zZXQodW5kZWZpbmVkKTtcbiAgICB9XG4gICAgLy8gU2V0IHJlc3VsdCBhbmQgcmV0dXJuIHR5cGVzLCBiaW5kIGV2ZW50c1xuICAgIGVsc2UgaWYocmVzdWx0LmlzQ29sbGVjdGlvbil7XG4gICAgICB0aGlzLnJldHVyblR5cGUgPSAnY29sbGVjdGlvbic7XG4gICAgICB0aGlzLmlzQ29sbGVjdGlvbiA9IHRydWU7XG4gICAgICB0aGlzLmlzTW9kZWwgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2V0KHJlc3VsdCk7XG4gICAgICB0aGlzLnRyYWNrKHJlc3VsdCk7XG4gICAgfVxuICAgIGVsc2UgaWYocmVzdWx0LmlzTW9kZWwpe1xuICAgICAgdGhpcy5yZXR1cm5UeXBlID0gJ21vZGVsJztcbiAgICAgIHRoaXMuaXNDb2xsZWN0aW9uID0gZmFsc2U7XG4gICAgICB0aGlzLmlzTW9kZWwgPSB0cnVlO1xuICAgICAgdGhpcy5yZXNldChyZXN1bHQpO1xuICAgICAgdGhpcy50cmFjayhyZXN1bHQpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgdGhpcy5yZXR1cm5UeXBlID0gJ3ZhbHVlJztcbiAgICAgIHRoaXMuaXNDb2xsZWN0aW9uID0gdGhpcy5pc01vZGVsID0gZmFsc2U7XG4gICAgICB0aGlzLnJlc2V0KHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudmFsdWUoKTtcbiAgfSxcblxuICAvLyBXaGVuIHdlIHJlY2VpdmUgYSBuZXcgbW9kZWwgdG8gc2V0IGluIG91ciBjYWNoZSwgdW5iaW5kIHRoZSB0cmFja2VyIGZyb21cbiAgLy8gdGhlIHByZXZpb3VzIGNhY2hlIG9iamVjdCwgc3luYyB0aGUgb2JqZWN0cycgY2lkcyBzbyBoZWxwZXJzIHRoaW5rIHRoZXlcbiAgLy8gYXJlIHRoZSBzYW1lIG9iamVjdCwgc2F2ZSBhIHJlZmVyYW5jZSB0byB0aGUgb2JqZWN0IHdlIGFyZSB0cmFja2luZyxcbiAgLy8gYW5kIHJlLWJpbmQgb3VyIG9uTW9kaWZ5IGhvb2suXG4gIHRyYWNrOiBmdW5jdGlvbihvYmplY3Qpe1xuICAgIHZhciB0YXJnZXQgPSB0aGlzLnZhbHVlKCk7XG4gICAgaWYoIW9iamVjdCB8fCAhdGFyZ2V0IHx8ICF0YXJnZXQuaXNEYXRhIHx8ICFvYmplY3QuaXNEYXRhKSByZXR1cm47XG4gICAgdGFyZ2V0Ll9jaWQgfHwgKHRhcmdldC5fY2lkID0gdGFyZ2V0LmNpZCk7XG4gICAgb2JqZWN0Ll9jaWQgfHwgKG9iamVjdC5fY2lkID0gb2JqZWN0LmNpZCk7XG4gICAgdGFyZ2V0LmNpZCA9IG9iamVjdC5jaWQ7XG4gICAgdGhpcy50cmFja2luZyA9IG9iamVjdDtcbiAgICB0aGlzLmxpc3RlblRvKHRhcmdldCwgJ2FsbCcsIHRoaXMub25Nb2RpZnkpO1xuICB9LFxuXG4gIC8vIEdldCBmcm9tIHRoZSBDb21wdXRlZCBQcm9wZXJ0eSdzIGNhY2hlXG4gIGdldDogZnVuY3Rpb24oa2V5LCBvcHRpb25zKXtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlKCk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBpZih0aGlzLnJldHVyblR5cGUgPT09ICd2YWx1ZScpIHJldHVybiBjb25zb2xlLmVycm9yKCdDYWxsZWQgZ2V0IG9uIHRoZSBgJysgdGhpcy5uYW1lICsnYCBjb21wdXRlZCBwcm9wZXJ0eSB3aGljaCByZXR1cm5zIGEgcHJpbWl0aXZlIHZhbHVlLicpO1xuICAgIHJldHVybiB2YWx1ZS5nZXQoa2V5LCBvcHRpb25zKTtcbiAgfSxcblxuICAvLyBTZXQgdGhlIENvbXB1dGVkIFByb3BlcnR5J3MgY2FjaGUgdG8gYSBuZXcgdmFsdWUgYW5kIHRyaWdnZXIgYXBwcm9wcmVhdGUgZXZlbnRzLlxuICAvLyBDaGFuZ2VzIHdpbGwgcHJvcGFnYXRlIGJhY2sgdG8gdGhlIG9yaWdpbmFsIG9iamVjdCBpZiBhIFJlYm91bmQgRGF0YSBPYmplY3QgYW5kIHJlLWNvbXB1dGUuXG4gIC8vIElmIENvbXB1dGVkIFByb3BlcnR5IHJldHVybnMgYSB2YWx1ZSwgYWxsIGRvd25zdHJlYW0gZGVwZW5kYW5jaWVzIHdpbGwgcmUtY29tcHV0ZS5cbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbCwgb3B0aW9ucyl7XG4gICAgaWYodGhpcy5yZXR1cm5UeXBlID09PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdmFyIGF0dHJzID0ga2V5O1xuICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWUoKTtcbiAgICBpZih0aGlzLnJldHVyblR5cGUgPT09ICdtb2RlbCcpe1xuICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGF0dHJzID0gKGtleS5pc01vZGVsKSA/IGtleS5hdHRyaWJ1dGVzIDoga2V5O1xuICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGF0dHJzID0ge30pW2tleV0gPSB2YWw7XG4gICAgICB9XG4gICAgfVxuICAgIGlmKHRoaXMucmV0dXJuVHlwZSAhPT0gJ21vZGVsJykgb3B0aW9ucyA9IHZhbCB8fCB7fTtcbiAgICBhdHRycyA9IChhdHRycyAmJiBhdHRycy5pc0NvbXB1dGVkUHJvcGVydHkpID8gYXR0cnMudmFsdWUoKSA6IGF0dHJzO1xuXG4gICAgLy8gSWYgYSBuZXcgdmFsdWUsIHNldCBpdCBhbmQgdHJpZ2dlciBldmVudHNcbiAgICBpZih0aGlzLnJldHVyblR5cGUgPT09ICd2YWx1ZScgJiYgdGhpcy5jYWNoZS52YWx1ZSAhPT0gYXR0cnMpe1xuICAgICAgdGhpcy5jYWNoZS52YWx1ZSA9IGF0dHJzO1xuICAgICAgaWYoIW9wdGlvbnMucXVpZXQpe1xuICAgICAgICAvLyBJZiBzZXQgd2FzIGNhbGxlZCBub3QgdGhyb3VnaCBjb21wdXRlZFByb3BlcnR5LmNhbGwoKSwgdGhpcyBpcyBhIGZyZXNoIG5ldyBldmVudCBidXJzdC5cbiAgICAgICAgaWYoIXRoaXMuaXNEaXJ0eSAmJiAhdGhpcy5pc0NoYW5naW5nKSB0aGlzLl9fcGFyZW50X18uY2hhbmdlZCA9IHt9O1xuICAgICAgICB0aGlzLl9fcGFyZW50X18uY2hhbmdlZFt0aGlzLm5hbWVdID0gYXR0cnM7XG4gICAgICAgIHRoaXMudHJpZ2dlcignY2hhbmdlJywgdGhpcy5fX3BhcmVudF9fKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2U6Jyt0aGlzLm5hbWUsIHRoaXMuX19wYXJlbnRfXywgYXR0cnMpO1xuICAgICAgICBkZWxldGUgdGhpcy5fX3BhcmVudF9fLmNoYW5nZWRbdGhpcy5uYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZih0aGlzLnJldHVyblR5cGUgIT09ICd2YWx1ZScgJiYgb3B0aW9ucy5yZXNldCkga2V5ID0gdmFsdWUucmVzZXQoYXR0cnMsIG9wdGlvbnMpO1xuICAgIGVsc2UgaWYodGhpcy5yZXR1cm5UeXBlICE9PSAndmFsdWUnKSBrZXkgPSB2YWx1ZS5zZXQoYXR0cnMsIG9wdGlvbnMpO1xuICAgIHRoaXMuaXNEaXJ0eSA9IHRoaXMuaXNDaGFuZ2luZyA9IGZhbHNlO1xuXG4gICAgLy8gQ2FsbCBhbGwgcmVhbWluaW5nIGNvbXB1dGVkIHByb3BlcnRpZXMgd2FpdGluZyBmb3IgdGhpcyB2YWx1ZSB0byByZXNvbHZlLlxuICAgIF8uZWFjaCh0aGlzLndhaXRpbmcsIGZ1bmN0aW9uKHByb3ApeyBwcm9wICYmIHByb3AuY2FsbCgpOyB9KTtcblxuICAgIHJldHVybiBrZXk7XG4gIH0sXG5cbiAgLy8gUmV0dXJuIHRoZSBjdXJyZW50IHZhbHVlIGZyb20gdGhlIGNhY2hlLCBydW5uaW5nIGlmIGRpcnR5LlxuICB2YWx1ZTogZnVuY3Rpb24oKXtcbiAgICBpZih0aGlzLmlzRGlydHkpIHRoaXMuYXBwbHkoKTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZVt0aGlzLnJldHVyblR5cGVdO1xuICB9LFxuXG4gIC8vIFJlc2V0IHRoZSBjdXJyZW50IHZhbHVlIGluIHRoZSBjYWNoZSwgcnVubmluZyBpZiBmaXJzdCBydW4uXG4gIHJlc2V0OiBmdW5jdGlvbihvYmosIG9wdGlvbnMpe1xuICAgIGlmKF8uaXNOdWxsKHRoaXMucmV0dXJuVHlwZSkpIHJldHVybjsgLy8gRmlyc3QgcnVuXG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBvcHRpb25zLnJlc2V0ID0gdHJ1ZTtcbiAgICByZXR1cm4gIHRoaXMuc2V0KG9iaiwgb3B0aW9ucyk7XG4gIH0sXG5cbiAgLy8gQ3ljbGljIGRlcGVuZGFuY3kgc2FmZSB0b0pTT04gbWV0aG9kLlxuICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9pc1NlcmlhbGl6aW5nKSByZXR1cm4gdGhpcy5jaWQ7XG4gICAgdmFyIHZhbCA9IHRoaXMudmFsdWUoKTtcbiAgICB0aGlzLl9pc1NlcmlhbGl6aW5nID0gdHJ1ZTtcbiAgICB2YXIganNvbiA9ICh2YWwgJiYgXy5pc0Z1bmN0aW9uKHZhbC50b0pTT04pKSA/IHZhbC50b0pTT04oKSA6IHZhbDtcbiAgICB0aGlzLl9pc1NlcmlhbGl6aW5nID0gZmFsc2U7XG4gICAgcmV0dXJuIGpzb247XG4gIH1cblxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IENvbXB1dGVkUHJvcGVydHk7XG4iLCIvLyBSZWJvdW5kIEhvb2tzXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCBMYXp5VmFsdWUgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2xhenktdmFsdWVcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuaW1wb3J0IGhlbHBlcnMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hlbHBlcnNcIjtcblxudmFyIGhvb2tzID0ge30sXG4gICAgYXR0cmlidXRlcyA9IHsgIGFiYnI6IDEsICAgICAgXCJhY2NlcHQtY2hhcnNldFwiOiAxLCAgIGFjY2VwdDogMSwgICAgICBhY2Nlc3NrZXk6IDEsICAgICBhY3Rpb246IDEsXG4gICAgICAgICAgICAgICAgICAgIGFsaWduOiAxLCAgICAgIGFsaW5rOiAxLCAgICAgICAgICAgICBhbHQ6IDEsICAgICAgICAgYXJjaGl2ZTogMSwgICAgICAgYXhpczogMSxcbiAgICAgICAgICAgICAgICAgICAgYmFja2dyb3VuZDogMSwgYmdjb2xvcjogMSwgICAgICAgICAgIGJvcmRlcjogMSwgICAgICBjZWxscGFkZGluZzogMSwgICBjZWxsc3BhY2luZzogMSxcbiAgICAgICAgICAgICAgICAgICAgY2hhcjogMSwgICAgICAgY2hhcm9mZjogMSwgICAgICAgICAgIGNoYXJzZXQ6IDEsICAgICBjaGVja2VkOiAxLCAgICAgICBjaXRlOiAxLFxuICAgICAgICAgICAgICAgICAgICBjbGFzczogMSwgICAgICBjbGFzc2lkOiAxLCAgICAgICAgICAgY2xlYXI6IDEsICAgICAgIGNvZGU6IDEsICAgICAgICAgIGNvZGViYXNlOiAxLFxuICAgICAgICAgICAgICAgICAgICBjb2RldHlwZTogMSwgICBjb2xvcjogMSwgICAgICAgICAgICAgY29sczogMSwgICAgICAgIGNvbHNwYW46IDEsICAgICAgIGNvbXBhY3Q6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQ6IDEsICAgIGNvb3JkczogMSwgICAgICAgICAgICBkYXRhOiAxLCAgICAgICAgZGF0ZXRpbWU6IDEsICAgICAgZGVjbGFyZTogMSxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXI6IDEsICAgICAgZGlyOiAxLCAgICAgICAgICAgICAgIGRpc2FibGVkOiAxLCAgICBlbmN0eXBlOiAxLCAgICAgICBmYWNlOiAxLFxuICAgICAgICAgICAgICAgICAgICBmb3I6IDEsICAgICAgICBmcmFtZTogMSwgICAgICAgICAgICAgZnJhbWVib3JkZXI6IDEsIGhlYWRlcnM6IDEsICAgICAgIGhlaWdodDogMSxcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogMSwgICAgICAgaHJlZmxhbmc6IDEsICAgICAgICAgIGhzcGFjZTogMSwgICAgIFwiaHR0cC1lcXVpdlwiOiAxLCAgIGlkOiAxLFxuICAgICAgICAgICAgICAgICAgICBpc21hcDogMSwgICAgICBsYWJlbDogMSwgICAgICAgICAgICAgbGFuZzogMSwgICAgICAgIGxhbmd1YWdlOiAxLCAgICAgIGxpbms6IDEsXG4gICAgICAgICAgICAgICAgICAgIGxvbmdkZXNjOiAxLCAgIG1hcmdpbmhlaWdodDogMSwgICAgICBtYXJnaW53aWR0aDogMSwgbWF4bGVuZ3RoOiAxLCAgICAgbWVkaWE6IDEsXG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogMSwgICAgIG11bHRpcGxlOiAxLCAgICAgICAgICBuYW1lOiAxLCAgICAgICAgbm9ocmVmOiAxLCAgICAgICAgbm9yZXNpemU6IDEsXG4gICAgICAgICAgICAgICAgICAgIG5vc2hhZGU6IDEsICAgIG5vd3JhcDogMSwgICAgICAgICAgICBvYmplY3Q6IDEsICAgICAgb25ibHVyOiAxLCAgICAgICAgb25jaGFuZ2U6IDEsXG4gICAgICAgICAgICAgICAgICAgIG9uY2xpY2s6IDEsICAgIG9uZGJsY2xpY2s6IDEsICAgICAgICBvbmZvY3VzOiAxLCAgICAgb25rZXlkb3duOiAxLCAgICAgb25rZXlwcmVzczogMSxcbiAgICAgICAgICAgICAgICAgICAgb25rZXl1cDogMSwgICAgb25sb2FkOiAxLCAgICAgICAgICAgIG9ubW91c2Vkb3duOiAxLCBvbm1vdXNlbW92ZTogMSwgICBvbm1vdXNlb3V0OiAxLFxuICAgICAgICAgICAgICAgICAgICBvbm1vdXNlb3ZlcjogMSxvbm1vdXNldXA6IDEsICAgICAgICAgb25yZXNldDogMSwgICAgIG9uc2VsZWN0OiAxLCAgICAgIG9uc3VibWl0OiAxLFxuICAgICAgICAgICAgICAgICAgICBvbnVubG9hZDogMSwgICBwcm9maWxlOiAxLCAgICAgICAgICAgcHJvbXB0OiAxLCAgICAgIHJlYWRvbmx5OiAxLCAgICAgIHJlbDogMSxcbiAgICAgICAgICAgICAgICAgICAgcmV2OiAxLCAgICAgICAgcm93czogMSwgICAgICAgICAgICAgIHJvd3NwYW46IDEsICAgICBydWxlczogMSwgICAgICAgICBzY2hlbWU6IDEsXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlOiAxLCAgICAgIHNjcm9sbGluZzogMSwgICAgICAgICBzZWxlY3RlZDogMSwgICAgc2hhcGU6IDEsICAgICAgICAgc2l6ZTogMSxcbiAgICAgICAgICAgICAgICAgICAgc3BhbjogMSwgICAgICAgc3JjOiAxLCAgICAgICAgICAgICAgIHN0YW5kYnk6IDEsICAgICBzdGFydDogMSwgICAgICAgICBzdHlsZTogMSxcbiAgICAgICAgICAgICAgICAgICAgc3VtbWFyeTogMSwgICAgdGFiaW5kZXg6IDEsICAgICAgICAgIHRhcmdldDogMSwgICAgICB0ZXh0OiAxLCAgICAgICAgICB0aXRsZTogMSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogMSwgICAgICAgdXNlbWFwOiAxLCAgICAgICAgICAgIHZhbGlnbjogMSwgICAgICB2YWx1ZTogMSwgICAgICAgICB2YWx1ZXR5cGU6IDEsXG4gICAgICAgICAgICAgICAgICAgIHZlcnNpb246IDEsICAgIHZsaW5rOiAxLCAgICAgICAgICAgICB2c3BhY2U6IDEsICAgICAgd2lkdGg6IDEgIH07XG5cblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgSG9vayBVdGlsc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbi8vIEdpdmVuIGFuIG9iamVjdCAoY29udGV4dCkgYW5kIGEgcGF0aCwgY3JlYXRlIGEgTGF6eVZhbHVlIG9iamVjdCB0aGF0IHJldHVybnMgdGhlIHZhbHVlIG9mIG9iamVjdCBhdCBjb250ZXh0IGFuZCBhZGQgaXQgYXMgYW4gb2JzZXJ2ZXIgb2YgdGhlIGNvbnRleHQuXG5mdW5jdGlvbiBzdHJlYW1Qcm9wZXJ0eShjb250ZXh0LCBwYXRoKSB7XG5cbiAgLy8gTGF6eSB2YWx1ZSB0aGF0IHJldHVybnMgdGhlIHZhbHVlIG9mIGNvbnRleHQucGF0aFxuICB2YXIgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gY29udGV4dC5nZXQocGF0aCk7XG4gIH0sIHtjb250ZXh0OiBjb250ZXh0fSk7XG5cbiAgLy8gU2F2ZSBvdXIgcGF0aCBzbyBwYXJlbnQgbGF6eXZhbHVlcyBjYW4ga25vdyB0aGUgZGF0YSB2YXIgb3IgaGVscGVyIHRoZXkgYXJlIGdldHRpbmcgaW5mbyBmcm9tXG4gIGxhenlWYWx1ZS5wYXRoID0gcGF0aDtcblxuICAvLyBTYXZlIHRoZSBvYnNlcnZlciBhdCB0aGlzIHBhdGhcbiAgbGF6eVZhbHVlLmFkZE9ic2VydmVyKHBhdGgsIGNvbnRleHQpO1xuXG4gIHJldHVybiBsYXp5VmFsdWU7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdEhlbHBlcihlbCwgcGF0aCwgY29udGV4dCwgcGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYsIGhlbHBlcikge1xuICB2YXIgbGF6eVZhbHVlO1xuXG4gIC8vIEV4dGVuZCBvcHRpb25zIHdpdGggdGhlIGhlbHBlcidzIGNvbnRhaW5laW5nIE1vcnBoIGVsZW1lbnQuIFVzZWQgYnkgc3RyZWFtaWZ5IHRvIHRyYWNrIGRhdGEgb2JzZXJ2ZXJzXG4gIG9wdGlvbnMubW9ycGggPSBvcHRpb25zLnBsYWNlaG9sZGVyID0gZWwgJiYgIWVsLnRhZ05hbWUgJiYgZWwgfHwgZmFsc2U7IC8vIEZJWE1FOiB0aGlzIGtpbmRhIHN1Y2tzXG4gIG9wdGlvbnMuZWxlbWVudCA9IGVsICYmIGVsLnRhZ05hbWUgJiYgZWwgfHwgZmFsc2U7ICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcblxuICAvLyBFeHRlbmQgb3B0aW9ucyB3aXRoIGhvb2tzIGFuZCBoZWxwZXJzIGZvciBhbnkgc3Vic2VxdWVudCBjYWxscyBmcm9tIGEgbGF6eXZhbHVlXG4gIG9wdGlvbnMucGFyYW1zID0gcGFyYW1zOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiB0aGlzIGtpbmRhIHN1Y2tzXG4gIG9wdGlvbnMuaG9va3MgPSBlbnYuaG9va3M7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiB0aGlzIGtpbmRhIHN1Y2tzXG4gIG9wdGlvbnMuaGVscGVycyA9IGVudi5oZWxwZXJzOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiB0aGlzIGtpbmRhIHN1Y2tzXG4gIG9wdGlvbnMuY29udGV4dCA9IGNvbnRleHQ7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiB0aGlzIGtpbmRhIHN1Y2tzXG4gIG9wdGlvbnMuZG9tID0gZW52LmRvbTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiB0aGlzIGtpbmRhIHN1Y2tzXG4gIG9wdGlvbnMucGF0aCA9IHBhdGg7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiB0aGlzIGtpbmRhIHN1Y2tzXG4gIG9wdGlvbnMuaGFzaCA9IGhhc2ggfHwgW107ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEZJWE1FOiB0aGlzIGtpbmRhIHN1Y2tzXG5cbiAgLy8gQ3JlYXRlIGEgbGF6eSB2YWx1ZSB0aGF0IHJldHVybnMgdGhlIHZhbHVlIG9mIG91ciBldmFsdWF0ZWQgaGVscGVyLlxuICBvcHRpb25zLmxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHBsYWluUGFyYW1zID0gW10sXG4gICAgICAgIHBsYWluSGFzaCA9IHt9LFxuICAgICAgICByZXN1bHQsXG4gICAgICAgIHJlbHBhdGggPSAkLnNwbGl0UGF0aChwYXRoKSxcbiAgICAgICAgZmlyc3QsIHJlc3Q7XG4gICAgICAgIHJlbHBhdGguc2hpZnQoKTtcbiAgICAgICAgcmVscGF0aCA9IHJlbHBhdGguam9pbignLicpO1xuXG4gICAgICAgIHJlc3QgPSAkLnNwbGl0UGF0aChyZWxwYXRoKTtcbiAgICAgICAgZmlyc3QgPSByZXN0LnNoaWZ0KCk7XG4gICAgICAgIHJlc3QgPSByZXN0LmpvaW4oJy4nKTtcblxuICAgIC8vIEFzc2VtYmxlIG91ciBhcmdzIGFuZCBoYXNoIHZhcmlhYmxlcy4gRm9yIGVhY2ggbGF6eXZhbHVlIHBhcmFtLCBwdXNoIHRoZSBsYXp5VmFsdWUncyB2YWx1ZSBzbyBoZWxwZXJzIHdpdGggbm8gY29uY2VwdCBvZiBsYXp5dmFsdWVzLlxuICAgIF8uZWFjaChwYXJhbXMsIGZ1bmN0aW9uKHBhcmFtLCBpbmRleCl7XG4gICAgICBwbGFpblBhcmFtcy5wdXNoKCggKHBhcmFtICYmIHBhcmFtLmlzTGF6eVZhbHVlKSA/IHBhcmFtLnZhbHVlKCkgOiBwYXJhbSApKTtcbiAgICB9KTtcbiAgICBfLmVhY2goaGFzaCwgZnVuY3Rpb24oaGFzaCwga2V5KXtcbiAgICAgIHBsYWluSGFzaFtrZXldID0gKGhhc2ggJiYgaGFzaC5pc0xhenlWYWx1ZSkgPyBoYXNoLnZhbHVlKCkgOiBoYXNoO1xuICAgIH0pO1xuXG4gICAgLy8gQ2FsbCBvdXIgaGVscGVyIGZ1bmN0aW9ucyB3aXRoIG91ciBhc3NlbWJsZWQgYXJncy5cbiAgICByZXN1bHQgPSBoZWxwZXIuYXBwbHkoKGNvbnRleHQuX19yb290X18gfHwgY29udGV4dCksIFtwbGFpblBhcmFtcywgcGxhaW5IYXNoLCBvcHRpb25zLCBlbnZdKTtcblxuICAgIGlmKHJlc3VsdCAmJiByZWxwYXRoKXtcbiAgICAgIHJldHVybiByZXN1bHQuZ2V0KHJlbHBhdGgpO1xuICAgIH1cblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sIHttb3JwaDogb3B0aW9ucy5tb3JwaH0pO1xuXG4gIG9wdGlvbnMubGF6eVZhbHVlLnBhdGggPSBwYXRoO1xuXG4gIC8vIEZvciBlYWNoIHBhcmFtIHBhc3NlZCB0byBvdXIgaGVscGVyLCBhZGQgaXQgdG8gb3VyIGhlbHBlcidzIGRlcGVuZGFudCBsaXN0LiBIZWxwZXIgd2lsbCByZS1ldmFsdWF0ZSB3aGVuIG9uZSBjaGFuZ2VzLlxuICBwYXJhbXMuZm9yRWFjaChmdW5jdGlvbihub2RlKSB7XG4gICAgaWYgKG5vZGUgJiYgbm9kZS5pc0xhenlWYWx1ZSkge1xuICAgICAgb3B0aW9ucy5sYXp5VmFsdWUuYWRkRGVwZW5kZW50VmFsdWUobm9kZSk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4gb3B0aW9ucy5sYXp5VmFsdWU7XG59XG5cbi8vIEdpdmVuIGEgcm9vdCBlbGVtZW50LCBjbGVhbnMgYWxsIG9mIHRoZSBtb3JwaCBsYXp5VmFsdWVzIGZvciBhIGdpdmVuIHN1YnRyZWVcbmZ1bmN0aW9uIGNsZWFuU3VidHJlZShtdXRhdGlvbnMsIG9ic2VydmVyKXtcbiAgLy8gRm9yIGVhY2ggbXV0YXRpb24gb2JzZXJ2ZWQsIGlmIHRoZXJlIGFyZSBub2RlcyByZW1vdmVkLCBkZXN0cm95IGFsbCBhc3NvY2lhdGVkIGxhenlWYWx1ZXNcbiAgbXV0YXRpb25zLmZvckVhY2goZnVuY3Rpb24obXV0YXRpb24pIHtcbiAgICBpZihtdXRhdGlvbi5yZW1vdmVkTm9kZXMpe1xuICAgICAgXy5lYWNoKG11dGF0aW9uLnJlbW92ZWROb2RlcywgZnVuY3Rpb24obm9kZSwgaW5kZXgpe1xuICAgICAgICAkKG5vZGUpLndhbGtUaGVET00oZnVuY3Rpb24obil7XG4gICAgICAgICAgaWYobi5fX2xhenlWYWx1ZSAmJiBuLl9fbGF6eVZhbHVlLmRlc3Ryb3koKSl7XG4gICAgICAgICAgICBuLl9fbGF6eVZhbHVlLmRlc3Ryb3koKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfVxuICB9KTtcbn1cblxudmFyIHN1YnRyZWVPYnNlcnZlciA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKGNsZWFuU3VidHJlZSk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIERlZmF1bHQgSG9va3NcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5ob29rcy5nZXQgPSBmdW5jdGlvbiBnZXQoZW52LCBjb250ZXh0LCBwYXRoKXtcbiAgY29udGV4dC5ibG9ja1BhcmFtcyB8fCAoY29udGV4dC5ibG9ja1BhcmFtcyA9IHt9KTtcbiAgaWYocGF0aCA9PT0gJ3RoaXMnKXsgcGF0aCA9ICcnOyB9XG4gIC8vIGNvbnRleHQgPSAoY29udGV4dC5ibG9ja1BhcmFtcy5oYXMocGF0aCkpID8gY29udGV4dC5ibG9ja1BhcmFtcyA6IGNvbnRleHQ7XG4gIHJldHVybiBzdHJlYW1Qcm9wZXJ0eShjb250ZXh0LCBwYXRoKTtcbn07XG5cbmhvb2tzLnNldCA9IGZ1bmN0aW9uIHNldChlbnYsIGNvbnRleHQsIG5hbWUsIHZhbHVlKXtcbiAgY29udGV4dC5ibG9ja1BhcmFtcyB8fCAoY29udGV4dC5ibG9ja1BhcmFtcyA9IHt9KTtcbiAgLy8gY29udGV4dC5ibG9ja1BhcmFtcy5zZXQobmFtZSwgdmFsdWUpO1xufTtcblxuXG5ob29rcy5jb25jYXQgPSBmdW5jdGlvbiBjb25jYXQoZW52LCBwYXJhbXMpIHtcblxuICBpZihwYXJhbXMubGVuZ3RoID09PSAxKXtcbiAgICByZXR1cm4gcGFyYW1zWzBdO1xuICB9XG5cbiAgdmFyIGxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbHVlID0gXCJcIjtcblxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gcGFyYW1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgdmFsdWUgKz0gKHBhcmFtc1tpXS5pc0xhenlWYWx1ZSkgPyBwYXJhbXNbaV0udmFsdWUoKSA6IHBhcmFtc1tpXTtcbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWU7XG4gIH0sIHtjb250ZXh0OiBwYXJhbXNbMF0uY29udGV4dH0pO1xuXG4gIGZvciAodmFyIGkgPSAwLCBsID0gcGFyYW1zLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgIGlmKHBhcmFtc1tpXS5pc0xhenlWYWx1ZSkge1xuICAgICAgbGF6eVZhbHVlLmFkZERlcGVuZGVudFZhbHVlKHBhcmFtc1tpXSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGxhenlWYWx1ZTtcblxufTtcblxuaG9va3Muc3ViZXhwciA9IGZ1bmN0aW9uIHN1YmV4cHIoZW52LCBjb250ZXh0LCBoZWxwZXJOYW1lLCBwYXJhbXMsIGhhc2gpIHtcblxuICB2YXIgaGVscGVyID0gaGVscGVycy5sb29rdXBIZWxwZXIoaGVscGVyTmFtZSwgZW52LCBjb250ZXh0KSxcbiAgbGF6eVZhbHVlO1xuXG4gIGlmIChoZWxwZXIpIHtcbiAgICAvLyBBYnN0cmFjdHMgb3VyIGhlbHBlciB0byBwcm92aWRlIGEgaGFuZGxlYmFycyB0eXBlIGludGVyZmFjZS4gQ29uc3RydWN0cyBvdXIgTGF6eVZhbHVlLlxuICAgIGxhenlWYWx1ZSA9IGNvbnN0cnVjdEhlbHBlcihmYWxzZSwgaGVscGVyTmFtZSwgY29udGV4dCwgcGFyYW1zLCBoYXNoLCB7fSwgZW52LCBoZWxwZXIpO1xuICB9IGVsc2Uge1xuICAgIGxhenlWYWx1ZSA9IHN0cmVhbVByb3BlcnR5KGNvbnRleHQsIGhlbHBlck5hbWUpO1xuICB9XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJhbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYocGFyYW1zW2ldLmlzTGF6eVZhbHVlKSB7XG4gICAgICBsYXp5VmFsdWUuYWRkRGVwZW5kZW50VmFsdWUocGFyYW1zW2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbGF6eVZhbHVlO1xufTtcblxuaG9va3MuYmxvY2sgPSBmdW5jdGlvbiBibG9jayhlbnYsIG1vcnBoLCBjb250ZXh0LCBwYXRoLCBwYXJhbXMsIGhhc2gsIHRlbXBsYXRlLCBpbnZlcnNlKXtcbiAgdmFyIG9wdGlvbnMgPSB7XG4gICAgbW9ycGg6IG1vcnBoLFxuICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZSxcbiAgICBpbnZlcnNlOiBpbnZlcnNlXG4gIH07XG5cbiAgdmFyIGxhenlWYWx1ZSxcbiAgdmFsdWUsXG4gIG9ic2VydmVyID0gc3VidHJlZU9ic2VydmVyLFxuICBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihwYXRoLCBlbnYsIGNvbnRleHQpO1xuXG4gIGlmKCFfLmlzRnVuY3Rpb24oaGVscGVyKSl7XG4gICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IocGF0aCArICcgaXMgbm90IGEgdmFsaWQgaGVscGVyIScpO1xuICB9XG5cbiAgLy8gQWJzdHJhY3RzIG91ciBoZWxwZXIgdG8gcHJvdmlkZSBhIGhhbmRsZWJhcnMgdHlwZSBpbnRlcmZhY2UuIENvbnN0cnVjdHMgb3VyIExhenlWYWx1ZS5cbiAgbGF6eVZhbHVlID0gY29uc3RydWN0SGVscGVyKG1vcnBoLCBwYXRoLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudiwgaGVscGVyKTtcblxuICAvLyBJZiB3ZSBoYXZlIG91ciBsYXp5IHZhbHVlLCB1cGRhdGUgb3VyIGRvbS5cbiAgLy8gbW9ycGggaXMgYSBtb3JwaCBlbGVtZW50IHJlcHJlc2VudGluZyBvdXIgZG9tIG5vZGVcbiAgaWYgKGxhenlWYWx1ZSkge1xuICAgIGxhenlWYWx1ZS5vbk5vdGlmeShmdW5jdGlvbihsYXp5VmFsdWUpIHtcbiAgICAgIHZhciB2YWwgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICAgIHZhbCA9IChfLmlzVW5kZWZpbmVkKHZhbCkpID8gJycgOiB2YWw7XG4gICAgICBpZighXy5pc051bGwodmFsKSl7XG4gICAgICAgIG1vcnBoLnNldENvbnRlbnQodmFsKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhbHVlID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgdmFsdWUgPSAoXy5pc1VuZGVmaW5lZCh2YWx1ZSkpID8gJycgOiB2YWx1ZTtcbiAgICBpZighXy5pc051bGwodmFsdWUpKXsgbW9ycGguYXBwZW5kKHZhbHVlKTsgfVxuXG4gICAgICAvLyBPYnNlcnZlIHRoaXMgY29udGVudCBtb3JwaCdzIHBhcmVudCdzIGNoaWxkcmVuLlxuICAgICAgLy8gV2hlbiB0aGUgbW9ycGggZWxlbWVudCdzIGNvbnRhaW5pbmcgZWxlbWVudCAobW9ycGgpIGlzIHJlbW92ZWQsIGNsZWFuIHVwIHRoZSBsYXp5dmFsdWUuXG4gICAgICAvLyBUaW1lb3V0IGRlbGF5IGhhY2sgdG8gZ2l2ZSBvdXQgZG9tIGEgY2hhbmdlIHRvIGdldCB0aGVpciBwYXJlbnRcbiAgICAgIGlmKG1vcnBoLl9wYXJlbnQpe1xuICAgICAgICBtb3JwaC5fcGFyZW50Ll9fbGF6eVZhbHVlID0gbGF6eVZhbHVlO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgaWYobW9ycGguY29udGV4dHVhbEVsZW1lbnQpe1xuICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShtb3JwaC5jb250ZXh0dWFsRWxlbWVudCwgeyBhdHRyaWJ1dGVzOiBmYWxzZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTogdHJ1ZSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDApO1xuICAgICAgfVxuXG4gICAgfVxuXG59O1xuXG5ob29rcy5pbmxpbmUgPSBmdW5jdGlvbiBpbmxpbmUoZW52LCBtb3JwaCwgY29udGV4dCwgcGF0aCwgcGFyYW1zLCBoYXNoKSB7XG5cbiAgdmFyIGxhenlWYWx1ZSxcbiAgdmFsdWUsXG4gIG9ic2VydmVyID0gc3VidHJlZU9ic2VydmVyLFxuICBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihwYXRoLCBlbnYsIGNvbnRleHQpO1xuXG4gIGlmKCFfLmlzRnVuY3Rpb24oaGVscGVyKSl7XG4gICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IocGF0aCArICcgaXMgbm90IGEgdmFsaWQgaGVscGVyIScpO1xuICB9XG5cbiAgLy8gQWJzdHJhY3RzIG91ciBoZWxwZXIgdG8gcHJvdmlkZSBhIGhhbmRsZWJhcnMgdHlwZSBpbnRlcmZhY2UuIENvbnN0cnVjdHMgb3VyIExhenlWYWx1ZS5cbiAgbGF6eVZhbHVlID0gY29uc3RydWN0SGVscGVyKG1vcnBoLCBwYXRoLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIHt9LCBlbnYsIGhlbHBlcik7XG5cbiAgLy8gSWYgd2UgaGF2ZSBvdXIgbGF6eSB2YWx1ZSwgdXBkYXRlIG91ciBkb20uXG4gIC8vIG1vcnBoIGlzIGEgbW9ycGggZWxlbWVudCByZXByZXNlbnRpbmcgb3VyIGRvbSBub2RlXG4gIGlmIChsYXp5VmFsdWUpIHtcbiAgICBsYXp5VmFsdWUub25Ob3RpZnkoZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgICB2YXIgdmFsID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgICB2YWwgPSAoXy5pc1VuZGVmaW5lZCh2YWwpKSA/ICcnIDogdmFsO1xuICAgICAgaWYoIV8uaXNOdWxsKHZhbCkpe1xuICAgICAgICBtb3JwaC5zZXRDb250ZW50KHZhbCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB2YWx1ZSA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuICAgIHZhbHVlID0gKF8uaXNVbmRlZmluZWQodmFsdWUpKSA/ICcnIDogdmFsdWU7XG4gICAgaWYoIV8uaXNOdWxsKHZhbHVlKSl7IG1vcnBoLmFwcGVuZCh2YWx1ZSk7IH1cblxuICAgICAgLy8gT2JzZXJ2ZSB0aGlzIGNvbnRlbnQgbW9ycGgncyBwYXJlbnQncyBjaGlsZHJlbi5cbiAgICAgIC8vIFdoZW4gdGhlIG1vcnBoIGVsZW1lbnQncyBjb250YWluaW5nIGVsZW1lbnQgKG1vcnBoKSBpcyByZW1vdmVkLCBjbGVhbiB1cCB0aGUgbGF6eXZhbHVlLlxuICAgICAgLy8gVGltZW91dCBkZWxheSBoYWNrIHRvIGdpdmUgb3V0IGRvbSBhIGNoYW5nZSB0byBnZXQgdGhlaXIgcGFyZW50XG4gICAgICBpZihtb3JwaC5fcGFyZW50KXtcbiAgICAgICAgbW9ycGguX3BhcmVudC5fX2xhenlWYWx1ZSA9IGxhenlWYWx1ZTtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgIGlmKG1vcnBoLmNvbnRleHR1YWxFbGVtZW50KXtcbiAgICAgICAgICAgIG9ic2VydmVyLm9ic2VydmUobW9ycGguY29udGV4dHVhbEVsZW1lbnQsIHsgYXR0cmlidXRlczogZmFsc2UsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6IHRydWUgfSk7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAwKTtcbiAgICAgIH1cblxuICAgIH1cbiAgfTtcblxuaG9va3MuY29udGVudCA9IGZ1bmN0aW9uIGNvbnRlbnQoZW52LCBtb3JwaCwgY29udGV4dCwgcGF0aCkge1xuXG4gIHZhciBsYXp5VmFsdWUsXG4gICAgICB2YWx1ZSxcbiAgICAgIG9ic2VydmVyID0gc3VidHJlZU9ic2VydmVyLFxuICAgICAgaGVscGVyID0gaGVscGVycy5sb29rdXBIZWxwZXIocGF0aCwgZW52LCBjb250ZXh0KTtcblxuICBsYXp5VmFsdWUgPSBzdHJlYW1Qcm9wZXJ0eShjb250ZXh0LCBwYXRoKTtcblxuICAvLyBJZiB3ZSBoYXZlIG91ciBsYXp5IHZhbHVlLCB1cGRhdGUgb3VyIGRvbS5cbiAgLy8gbW9ycGggaXMgYSBtb3JwaCBlbGVtZW50IHJlcHJlc2VudGluZyBvdXIgZG9tIG5vZGVcbiAgaWYgKGxhenlWYWx1ZSkge1xuICAgIGxhenlWYWx1ZS5vbk5vdGlmeShmdW5jdGlvbihsYXp5VmFsdWUpIHtcbiAgICAgIHZhciB2YWwgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICAgIHZhbCA9IChfLmlzVW5kZWZpbmVkKHZhbCkpID8gJycgOiB2YWw7XG4gICAgICBpZighXy5pc051bGwodmFsKSl7XG4gICAgICAgIG1vcnBoLnNldENvbnRlbnQodmFsKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhbHVlID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgdmFsdWUgPSAoXy5pc1VuZGVmaW5lZCh2YWx1ZSkpID8gJycgOiB2YWx1ZTtcbiAgICBpZighXy5pc051bGwodmFsdWUpKXsgbW9ycGguYXBwZW5kKHZhbHVlKTsgfVxuXG4gICAgLy8gT2JzZXJ2ZSB0aGlzIGNvbnRlbnQgbW9ycGgncyBwYXJlbnQncyBjaGlsZHJlbi5cbiAgICAvLyBXaGVuIHRoZSBtb3JwaCBlbGVtZW50J3MgY29udGFpbmluZyBlbGVtZW50IChtb3JwaCkgaXMgcmVtb3ZlZCwgY2xlYW4gdXAgdGhlIGxhenl2YWx1ZS5cbiAgICAvLyBUaW1lb3V0IGRlbGF5IGhhY2sgdG8gZ2l2ZSBvdXQgZG9tIGEgY2hhbmdlIHRvIGdldCB0aGVpciBwYXJlbnRcbiAgICBpZihtb3JwaC5fcGFyZW50KXtcbiAgICAgIG1vcnBoLl9wYXJlbnQuX19sYXp5VmFsdWUgPSBsYXp5VmFsdWU7XG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmKG1vcnBoLmNvbnRleHR1YWxFbGVtZW50KXtcbiAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKG1vcnBoLmNvbnRleHR1YWxFbGVtZW50LCB7IGF0dHJpYnV0ZXM6IGZhbHNlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICAgICAgICB9XG4gICAgICB9LCAwKTtcbiAgICB9XG5cbiAgfVxufTtcblxuLy8gSGFuZGxlIG1vcnBocyBpbiBlbGVtZW50IHRhZ3Ncbi8vIFRPRE86IGhhbmRsZSBkeW5hbWljIGF0dHJpYnV0ZSBuYW1lcz9cbmhvb2tzLmVsZW1lbnQgPSBmdW5jdGlvbiBlbGVtZW50KGVudiwgZG9tRWxlbWVudCwgY29udGV4dCwgcGF0aCwgcGFyYW1zLCBoYXNoKSB7XG4gIHZhciBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihwYXRoLCBlbnYsIGNvbnRleHQpLFxuICAgICAgbGF6eVZhbHVlLFxuICAgICAgdmFsdWU7XG5cbiAgaWYgKGhlbHBlcikge1xuICAgIC8vIEFic3RyYWN0cyBvdXIgaGVscGVyIHRvIHByb3ZpZGUgYSBoYW5kbGViYXJzIHR5cGUgaW50ZXJmYWNlLiBDb25zdHJ1Y3RzIG91ciBMYXp5VmFsdWUuXG4gICAgbGF6eVZhbHVlID0gY29uc3RydWN0SGVscGVyKGRvbUVsZW1lbnQsIHBhdGgsIGNvbnRleHQsIHBhcmFtcywgaGFzaCwge30sIGVudiwgaGVscGVyKTtcbiAgfSBlbHNlIHtcbiAgICBsYXp5VmFsdWUgPSBzdHJlYW1Qcm9wZXJ0eShjb250ZXh0LCBwYXRoKTtcbiAgfVxuXG4gIC8vIFdoZW4gd2UgaGF2ZSBvdXIgbGF6eSB2YWx1ZSBydW4gaXQgYW5kIHN0YXJ0IGxpc3RlbmluZyBmb3IgdXBkYXRlcy5cbiAgbGF6eVZhbHVlLm9uTm90aWZ5KGZ1bmN0aW9uKGxhenlWYWx1ZSkge1xuICAgIGxhenlWYWx1ZS52YWx1ZSgpO1xuICB9KTtcblxuICB2YWx1ZSA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuXG59O1xuaG9va3MuYXR0cmlidXRlID0gZnVuY3Rpb24gYXR0cmlidXRlKGVudiwgYXR0ck1vcnBoLCBkb21FbGVtZW50LCBuYW1lLCB2YWx1ZSl7XG5cbiAgdmFyIGxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHZhbCA9IHZhbHVlLnZhbHVlKCksXG4gICAgY2hlY2tib3hDaGFuZ2UsXG4gICAgdHlwZSA9IGRvbUVsZW1lbnQuZ2V0QXR0cmlidXRlKFwidHlwZVwiKSxcblxuICAgIGlucHV0VHlwZXMgPSB7ICAnbnVsbCc6IHRydWUsICAndGV4dCc6dHJ1ZSwgICAnZW1haWwnOnRydWUsICAncGFzc3dvcmQnOnRydWUsXG4gICAgICAgICAgICAgICAgICAgICdzZWFyY2gnOnRydWUsICd1cmwnOnRydWUsICAgICd0ZWwnOnRydWUsICAgICdoaWRkZW4nOnRydWUsXG4gICAgICAgICAgICAgICAgICAgICdudW1iZXInOnRydWUsICdjb2xvcic6IHRydWUsICdkYXRlJzogdHJ1ZSwgICdkYXRldGltZSc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICdkYXRldGltZS1sb2NhbDonOiB0cnVlLCAgICAgICdtb250aCc6IHRydWUsICdyYW5nZSc6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICd0aW1lJzogdHJ1ZSwgICd3ZWVrJzogdHJ1ZVxuICAgICAgICAgICAgICAgICAgfSxcbiAgICBhdHRyO1xuXG4gICAgLy8gSWYgaXMgYSB0ZXh0IGlucHV0IGVsZW1lbnQncyB2YWx1ZSBwcm9wIHdpdGggb25seSBvbmUgdmFyaWFibGUsIHdpcmUgZGVmYXVsdCBldmVudHNcbiAgICBpZiggZG9tRWxlbWVudC50YWdOYW1lID09PSAnSU5QVVQnICYmIGlucHV0VHlwZXNbdHlwZV0gJiYgbmFtZSA9PT0gJ3ZhbHVlJyApe1xuXG4gICAgICAvLyBJZiBvdXIgc3BlY2lhbCBpbnB1dCBldmVudHMgaGF2ZSBub3QgYmVlbiBib3VuZCB5ZXQsIGJpbmQgdGhlbSBhbmQgc2V0IGZsYWdcbiAgICAgIGlmKCFsYXp5VmFsdWUuaW5wdXRPYnNlcnZlcil7XG5cbiAgICAgICAgJChkb21FbGVtZW50KS5vbignY2hhbmdlIGlucHV0IHByb3BlcnR5Y2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgIHZhbHVlLnNldCh2YWx1ZS5wYXRoLCB0aGlzLnZhbHVlKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGF6eVZhbHVlLmlucHV0T2JzZXJ2ZXIgPSB0cnVlO1xuXG4gICAgICB9XG5cbiAgICAgIC8vIFNldCB0aGUgYXR0cmlidXRlIG9uIG91ciBlbGVtZW50IGZvciB2aXN1YWwgcmVmZXJhbmNlXG4gICAgICAoXy5pc1VuZGVmaW5lZCh2YWwpKSA/IGRvbUVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpIDogZG9tRWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsKTtcblxuICAgICAgYXR0ciA9IHZhbDtcblxuICAgICAgcmV0dXJuIChkb21FbGVtZW50LnZhbHVlICE9PSBTdHJpbmcoYXR0cikpID8gZG9tRWxlbWVudC52YWx1ZSA9IChhdHRyIHx8ICcnKSA6IGF0dHI7XG4gICAgfVxuXG4gICAgZWxzZSBpZiggZG9tRWxlbWVudC50YWdOYW1lID09PSAnSU5QVVQnICYmICh0eXBlID09PSAnY2hlY2tib3gnIHx8IHR5cGUgPT09ICdyYWRpbycpICYmIG5hbWUgPT09ICdjaGVja2VkJyApe1xuXG4gICAgICAvLyBJZiBvdXIgc3BlY2lhbCBpbnB1dCBldmVudHMgaGF2ZSBub3QgYmVlbiBib3VuZCB5ZXQsIGJpbmQgdGhlbSBhbmQgc2V0IGZsYWdcbiAgICAgIGlmKCFsYXp5VmFsdWUuZXZlbnRzQm91bmQpe1xuXG4gICAgICAgICQoZG9tRWxlbWVudCkub24oJ2NoYW5nZSBwcm9wZXJ0eWNoYW5nZScsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICB2YWx1ZS5zZXQodmFsdWUucGF0aCwgKCh0aGlzLmNoZWNrZWQpID8gdHJ1ZSA6IGZhbHNlKSwge3F1aWV0OiB0cnVlfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxhenlWYWx1ZS5ldmVudHNCb3VuZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIC8vIFNldCB0aGUgYXR0cmlidXRlIG9uIG91ciBlbGVtZW50IGZvciB2aXN1YWwgcmVmZXJhbmNlXG4gICAgICAoIXZhbCkgPyBkb21FbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKSA6IGRvbUVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbCk7XG5cbiAgICAgIHJldHVybiBkb21FbGVtZW50LmNoZWNrZWQgPSAodmFsKSA/IHRydWUgOiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICBfLmlzU3RyaW5nKHZhbCkgJiYgKHZhbCA9IHZhbC50cmltKCkpO1xuICAgICAgdmFsIHx8ICh2YWwgPSB1bmRlZmluZWQpO1xuICAgICAgaWYoXy5pc1VuZGVmaW5lZCh2YWwpKXtcbiAgICAgICAgZG9tRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICBkb21FbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCB2YWwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB2YWw7XG5cbiAgfSwge2F0dHJNb3JwaDogYXR0ck1vcnBofSk7XG5cbiAgdmFsdWUub25Ob3RpZnkoZnVuY3Rpb24oKXtcbiAgICBsYXp5VmFsdWUudmFsdWUoKTtcbiAgfSk7XG4gIGxhenlWYWx1ZS5hZGREZXBlbmRlbnRWYWx1ZSh2YWx1ZSk7XG5cbiAgcmV0dXJuIGxhenlWYWx1ZS52YWx1ZSgpO1xuXG59O1xuXG5ob29rcy5jb21wb25lbnQgPSBmdW5jdGlvbihlbnYsIG1vcnBoLCBjb250ZXh0LCB0YWdOYW1lLCBjb250ZXh0RGF0YSwgdGVtcGxhdGUpIHtcblxuICB2YXIgY29tcG9uZW50LFxuICAgICAgZWxlbWVudCxcbiAgICAgIG91dGxldCxcbiAgICAgIHBsYWluRGF0YSA9IHt9LFxuICAgICAgY29tcG9uZW50RGF0YSA9IHt9LFxuICAgICAgbGF6eVZhbHVlLFxuICAgICAgdmFsdWU7XG5cbiAgLy8gQ3JlYXRlIGEgbGF6eSB2YWx1ZSB0aGF0IHJldHVybnMgdGhlIHZhbHVlIG9mIG91ciBldmFsdWF0ZWQgY29tcG9uZW50LlxuICBsYXp5VmFsdWUgPSBuZXcgTGF6eVZhbHVlKGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gQ3JlYXRlIGEgcGxhaW4gZGF0YSBvYmplY3QgZnJvbSB0aGUgbGF6eXZhbHVlcy92YWx1ZXMgcGFzc2VkIHRvIG91ciBjb21wb25lbnRcbiAgICBfLmVhY2goY29udGV4dERhdGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgIHBsYWluRGF0YVtrZXldID0gKHZhbHVlLmlzTGF6eVZhbHVlKSA/IHZhbHVlLnZhbHVlKCkgOiB2YWx1ZTtcbiAgICB9KTtcblxuICAgIC8vIEZvciBlYWNoIHBhcmFtIHBhc3NlZCB0byBvdXIgc2hhcmVkIGNvbXBvbmVudCwgYWRkIGl0IHRvIG91ciBjdXN0b20gZWxlbWVudFxuICAgIC8vIFRPRE86IHRoZXJlIGhhcyB0byBiZSBhIGJldHRlciB3YXkgdG8gZ2V0IHNlZWQgZGF0YSB0byBlbGVtZW50IGluc3RhbmNlc1xuICAgIC8vIEdsb2JhbCBzZWVkIGRhdGEgaXMgY29uc3VtZWQgYnkgZWxlbWVudCBhcyBpdHMgY3JlYXRlZC4gVGhpcyBpcyBub3Qgc2NvcGVkIGFuZCB2ZXJ5IGR1bWIuXG4gICAgUmVib3VuZC5zZWVkRGF0YSA9IHBsYWluRGF0YTtcbiAgICBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCh0YWdOYW1lKTtcbiAgICBSZWJvdW5kLnNlZWREYXRhID0ge307XG4gICAgY29tcG9uZW50ID0gZWxlbWVudC5fX2NvbXBvbmVudF9fO1xuXG4gICAgLy8gRm9yIGVhY2ggbGF6eSBwYXJhbSBwYXNzZWQgdG8gb3VyIGNvbXBvbmVudCwgY3JlYXRlIGl0cyBsYXp5VmFsdWVcbiAgICBfLmVhY2gocGxhaW5EYXRhLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICBpZihjb250ZXh0RGF0YVtrZXldICYmIGNvbnRleHREYXRhW2tleV0uaXNMYXp5VmFsdWUpe1xuICAgICAgICBjb21wb25lbnREYXRhW2tleV0gPSBzdHJlYW1Qcm9wZXJ0eShjb21wb25lbnQsIGtleSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTZXQgdXAgdHdvIHdheSBiaW5kaW5nIGJldHdlZW4gY29tcG9uZW50IGFuZCBvcmlnaW5hbCBjb250ZXh0IGZvciBub24tZGF0YSBhdHRyaWJ1dGVzXG4gICAgLy8gU3luY2luZyBiZXR3ZWVuIG1vZGVscyBhbmQgY29sbGVjdGlvbnMgcGFzc2VkIGFyZSBoYW5kbGVkIGluIG1vZGVsIGFuZCBjb2xsZWN0aW9uXG4gICAgXy5lYWNoKCBjb21wb25lbnREYXRhLCBmdW5jdGlvbihjb21wb25lbnREYXRhVmFsdWUsIGtleSl7XG5cbiAgICAgIC8vIFRPRE86IE1ha2UgdGhpcyBzeW5jIHdvcmsgd2l0aCBjb21wbGV4IGFyZ3VtZW50cyB3aXRoIG1vcmUgdGhhbiBvbmUgY2hpbGRcbiAgICAgIGlmKGNvbnRleHREYXRhW2tleV0uY2hpbGRyZW4gPT09IG51bGwpe1xuICAgICAgICAvLyBGb3IgZWFjaCBsYXp5IHBhcmFtIHBhc3NlZCB0byBvdXIgY29tcG9uZW50LCBoYXZlIGl0IHVwZGF0ZSB0aGUgb3JpZ2luYWwgY29udGV4dCB3aGVuIGNoYW5nZWQuXG4gICAgICAgIGNvbXBvbmVudERhdGFWYWx1ZS5vbk5vdGlmeShmdW5jdGlvbigpe1xuICAgICAgICAgIGNvbnRleHREYXRhW2tleV0uc2V0KGNvbnRleHREYXRhW2tleV0ucGF0aCwgY29tcG9uZW50RGF0YVZhbHVlLnZhbHVlKCkpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gRm9yIGVhY2ggbGF6eSBwYXJhbSBwYXNzZWQgdG8gb3VyIGNvbXBvbmVudCwgaGF2ZSBpdCB1cGRhdGUgdGhlIGNvbXBvbmVudCB3aGVuIGNoYW5nZWQuXG4gICAgICBjb250ZXh0RGF0YVtrZXldLm9uTm90aWZ5KGZ1bmN0aW9uKCl7XG4gICAgICAgIGNvbXBvbmVudERhdGFWYWx1ZS5zZXQoa2V5LCBjb250ZXh0RGF0YVtrZXldLnZhbHVlKCkpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFNlZWQgdGhlIGNhY2hlXG4gICAgICBjb21wb25lbnREYXRhVmFsdWUudmFsdWUoKTtcblxuICAgICAgLy8gTm90aWZ5IHRoZSBjb21wb25lbnQncyBsYXp5dmFsdWUgd2hlbiBvdXIgbW9kZWwgdXBkYXRlc1xuICAgICAgY29udGV4dERhdGFba2V5XS5hZGRPYnNlcnZlcihjb250ZXh0RGF0YVtrZXldLnBhdGgsIGNvbnRleHQpO1xuICAgICAgY29tcG9uZW50RGF0YVZhbHVlLmFkZE9ic2VydmVyKGtleSwgY29tcG9uZW50KTtcblxuICAgIH0pO1xuXG4gICAgLy8gLy8gRm9yIGVhY2ggY2hhbmdlIG9uIG91ciBjb21wb25lbnQsIHVwZGF0ZSB0aGUgc3RhdGVzIG9mIHRoZSBvcmlnaW5hbCBjb250ZXh0IGFuZCB0aGUgZWxlbWVudCdzIHByb2VwcnRpZXMuXG4gICAgY29tcG9uZW50Lmxpc3RlblRvKGNvbXBvbmVudCwgJ2NoYW5nZScsIGZ1bmN0aW9uKG1vZGVsKXtcbiAgICAgIHZhciBqc29uID0gY29tcG9uZW50LnRvSlNPTigpO1xuXG4gICAgICBpZihfLmlzU3RyaW5nKGpzb24pKSByZXR1cm47IC8vIElmIGlzIGEgc3RyaW5nLCB0aGlzIG1vZGVsIGlzIHNlcmFsaXppbmcgYWxyZWFkeVxuXG4gICAgICAvLyBTZXQgdGhlIHByb3BlcnRpZXMgb24gb3VyIGVsZW1lbnQgZm9yIHZpc3VhbCByZWZlcmFuY2UgaWYgd2UgYXJlIG9uIGEgdG9wIGxldmVsIGF0dHJpYnV0ZVxuICAgICAgXy5lYWNoKGpzb24sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuICAgICAgICAvLyBUT0RPOiBDdXJyZW50bHksIHNob3dpbmcgb2JqZWN0cyBhcyBwcm9wZXJ0aWVzIG9uIHRoZSBjdXN0b20gZWxlbWVudCBjYXVzZXMgcHJvYmxlbXMuXG4gICAgICAgIC8vIExpbmtlZCBtb2RlbHMgYmV0d2VlbiB0aGUgY29udGV4dCBhbmQgY29tcG9uZW50IGJlY29tZSB0aGUgc2FtZSBleGFjdCBtb2RlbCBhbmQgYWxsIGhlbGwgYnJlYWtzIGxvb3NlLlxuICAgICAgICAvLyBGaW5kIGEgd2F5IHRvIHJlbWVkeSB0aGlzLiBVbnRpbCB0aGVuLCBkb24ndCBzaG93IG9iamVjdHMuXG4gICAgICAgIGlmKChfLmlzT2JqZWN0KHZhbHVlKSkpeyByZXR1cm47IH1cbiAgICAgICAgdmFsdWUgPSAoXy5pc09iamVjdCh2YWx1ZSkpID8gSlNPTi5zdHJpbmdpZnkodmFsdWUpIDogdmFsdWU7XG4gICAgICAgICAgdHJ5eyAoYXR0cmlidXRlc1trZXldKSA/IGVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpIDogZWxlbWVudC5kYXRhc2V0W2tleV0gPSB2YWx1ZTsgfVxuICAgICAgICAgIGNhdGNoKGUpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqIFRoZSBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgb24gb3VyIGN1c3RvbSBlbGVtZW50IHVwZGF0ZXMgdGhlIGNvbXBvbmVudCdzIGRhdGEuICoqL1xuXG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuICAgIEVuZCBkYXRhIGRlcGVuZGFuY3kgY2hhaW5cblxuICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICAvLyBUT0RPOiBicmVhayB0aGlzIG91dCBpbnRvIGl0cyBvd24gZnVuY3Rpb25cbiAgICAvLyBTZXQgdGhlIHByb3BlcnRpZXMgb24gb3VyIGVsZW1lbnQgZm9yIHZpc3VhbCByZWZlcmFuY2UgaWYgd2UgYXJlIG9uIGEgdG9wIGxldmVsIGF0dHJpYnV0ZVxuICAgIHZhciBjb21wanNvbiA9IGNvbXBvbmVudC50b0pTT04oKTtcbiAgICBfLmVhY2goY29tcGpzb24sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuICAgICAgLy8gVE9ETzogQ3VycmVudGx5LCBzaG93aW5nIG9iamVjdHMgYXMgcHJvcGVydGllcyBvbiB0aGUgY3VzdG9tIGVsZW1lbnQgY2F1c2VzIHByb2JsZW1zLiBMaW5rZWQgbW9kZWxzIGJldHdlZW4gdGhlIGNvbnRleHQgYW5kIGNvbXBvbmVudCBiZWNvbWUgdGhlIHNhbWUgZXhhY3QgbW9kZWwgYW5kIGFsbCBoZWxsIGJyZWFrcyBsb29zZS4gRmluZCBhIHdheSB0byByZW1lZHkgdGhpcy4gVW50aWwgdGhlbiwgZG9uJ3Qgc2hvdyBvYmplY3RzLlxuICAgICAgaWYoKF8uaXNPYmplY3QodmFsdWUpKSl7IHJldHVybjsgfVxuICAgICAgdmFsdWUgPSAoXy5pc09iamVjdCh2YWx1ZSkpID8gSlNPTi5zdHJpbmdpZnkodmFsdWUpIDogdmFsdWU7XG4gICAgICBpZighXy5pc051bGwodmFsdWUpICYmICFfLmlzVW5kZWZpbmVkKHZhbHVlKSl7XG4gICAgICAgIHRyeXsgKGF0dHJpYnV0ZXNba2V5XSkgPyBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIHZhbHVlKSA6IGVsZW1lbnQuZGF0YXNldFtrZXldID0gdmFsdWU7IH1cbiAgICAgICAgY2F0Y2goZSl7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG5cblxuICAgIC8vIElmIGFuIG91dGxldCBtYXJrZXIgaXMgcHJlc2VudCBpbiBjb21wb25lbnQncyB0ZW1wbGF0ZSwgYW5kIGEgdGVtcGxhdGUgaXMgcHJvdmlkZWQsIHJlbmRlciBpdCBpbnRvIDxjb250ZW50PlxuICAgIG91dGxldCA9IGVsZW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvbnRlbnQnKVswXTtcbiAgICBpZih0ZW1wbGF0ZSAmJiBfLmlzRWxlbWVudChvdXRsZXQpKXtcbiAgICAgIG91dGxldC5hcHBlbmRDaGlsZCh0ZW1wbGF0ZS5yZW5kZXIoY29udGV4dCwgZW52LCBvdXRsZXQpKTtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIG5ldyBlbGVtZW50LlxuICAgIHJldHVybiBlbGVtZW50O1xuICB9LCB7bW9ycGg6IG1vcnBofSk7XG5cblxuXG4gIC8vIElmIHdlIGhhdmUgb3VyIGxhenkgdmFsdWUsIHVwZGF0ZSBvdXIgZG9tLlxuICAvLyBtb3JwaCBpcyBhIG1vcnBoIGVsZW1lbnQgcmVwcmVzZW50aW5nIG91ciBkb20gbm9kZVxuICBpZiAobGF6eVZhbHVlKSB7XG4gICAgbGF6eVZhbHVlLm9uTm90aWZ5KGZ1bmN0aW9uKGxhenlWYWx1ZSkge1xuICAgICAgdmFyIHZhbCA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuICAgICAgaWYodmFsICE9PSB1bmRlZmluZWQpeyBtb3JwaC5zZXRDb250ZW50KHZhbCk7IH1cbiAgICB9KTtcblxuICAgIHZhbHVlID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgaWYodmFsdWUgIT09IHVuZGVmaW5lZCl7IG1vcnBoLmFwcGVuZCh2YWx1ZSk7IH1cbiAgfVxufTtcblxuLy8gcmVnaXN0ZXJIZWxwZXIgaXMgYSBwdWJsaWNhbGx5IGF2YWlsYWJsZSBmdW5jdGlvbiB0byByZWdpc3RlciBhIGhlbHBlciB3aXRoIEhUTUxCYXJzXG5cbmV4cG9ydCBkZWZhdWx0IGhvb2tzO1xuIiwiLy8gUmVib3VuZCBNb2RlbFxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBSZWJvdW5kICoqTW9kZWxzKiogYXJlIHRoZSBiYXNpYyBkYXRhIG9iamVjdCBpbiB0aGUgZnJhbWV3b3JrIOKAlCBmcmVxdWVudGx5XG4vLyByZXByZXNlbnRpbmcgYSByb3cgaW4gYSB0YWJsZSBpbiBhIGRhdGFiYXNlIG9uIHlvdXIgc2VydmVyLiBUaGUgaW5oZXJpdCBmcm9tXG4vLyBCYWNrYm9uZSBNb2RlbHMgYW5kIGhhdmUgYWxsIG9mIHRoZSBzYW1lIHVzZWZ1bCBtZXRob2RzIHlvdSBhcmUgdXNlZCB0byBmb3Jcbi8vIHBlcmZvcm1pbmcgY29tcHV0YXRpb25zIGFuZCB0cmFuc2Zvcm1hdGlvbnMgb24gdGhhdCBkYXRhLiBSZWJvdW5kIGF1Z21lbnRzXG4vLyBCYWNrYm9uZSBNb2RlbHMgYnkgZW5hYmxpbmcgZGVlcCBkYXRhIG5lc3RpbmcuIFlvdSBjYW4gbm93IGhhdmUgKipSZWJvdW5kIENvbGxlY3Rpb25zKipcbi8vIGFuZCAqKlJlYm91bmQgQ29tcHV0ZWQgUHJvcGVydGllcyoqIGFzIHByb3BlcnRpZXMgb2YgdGhlIE1vZGVsLlxuXG5pbXBvcnQgQ29tcHV0ZWRQcm9wZXJ0eSBmcm9tIFwicmVib3VuZC1kYXRhL2NvbXB1dGVkLXByb3BlcnR5XCI7XG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcblxuLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkLCBnZW5lcmF0ZXMgYSBwYXRoIGNvbnN0cnVjdGVkIGZyb20gaXRzXG4vLyBwYXJlbnQncyBwYXRoIGFuZCB0aGUga2V5IGl0IGlzIGFzc2lnbmVkIHRvLiBLZWVwcyB1cyBmcm9tIHJlLW5hbWluZyBjaGlsZHJlblxuLy8gd2hlbiBwYXJlbnRzIGNoYW5nZS5cbmZ1bmN0aW9uIHBhdGhHZW5lcmF0b3IocGFyZW50LCBrZXkpe1xuICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICB2YXIgcGF0aCA9IHBhcmVudC5fX3BhdGgoKTtcbiAgICByZXR1cm4gcGF0aCArICgocGF0aCA9PT0gJycpID8gJycgOiAnLicpICsga2V5O1xuICB9O1xufVxuXG52YXIgTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuICAvLyBTZXQgdGhpcyBvYmplY3QncyBkYXRhIHR5cGVzXG4gIGlzTW9kZWw6IHRydWUsXG4gIGlzRGF0YTogdHJ1ZSxcblxuICAvLyBBIG1ldGhvZCB0aGF0IHJldHVybnMgYSByb290IHBhdGggYnkgZGVmYXVsdC4gTWVhbnQgdG8gYmUgb3ZlcnJpZGRlbiBvblxuICAvLyBpbnN0YW50aWF0aW9uLlxuICBfX3BhdGg6IGZ1bmN0aW9uKCl7IHJldHVybiAnJzsgfSxcblxuICAvLyBDcmVhdGUgYSBuZXcgTW9kZWwgd2l0aCB0aGUgc3BlY2lmaWVkIGF0dHJpYnV0ZXMuIFRoZSBNb2RlbCdzIGxpbmVhZ2UgaXMgc2V0XG4gIC8vIHVwIGhlcmUgdG8ga2VlcCB0cmFjayBvZiBpdCdzIHBsYWNlIGluIHRoZSBkYXRhIHRyZWUuXG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihhdHRyaWJ1dGVzLCBvcHRpb25zKXtcbiAgICBhdHRyaWJ1dGVzIHx8IChhdHRyaWJ1dGVzID0ge30pO1xuICAgIGF0dHJpYnV0ZXMuaXNNb2RlbCAmJiAoYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXMuYXR0cmlidXRlcyk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB0aGlzLmhlbHBlcnMgPSB7fTtcbiAgICB0aGlzLmRlZmF1bHRzID0gdGhpcy5kZWZhdWx0cyB8fCB7fTtcbiAgICB0aGlzLnNldFBhcmVudCggb3B0aW9ucy5wYXJlbnQgfHwgdGhpcyApO1xuICAgIHRoaXMuc2V0Um9vdCggb3B0aW9ucy5yb290IHx8IHRoaXMgKTtcbiAgICB0aGlzLl9fcGF0aCA9IG9wdGlvbnMucGF0aCB8fCB0aGlzLl9fcGF0aDtcbiAgICBCYWNrYm9uZS5Nb2RlbC5jYWxsKCB0aGlzLCBhdHRyaWJ1dGVzLCBvcHRpb25zICk7XG4gIH0sXG5cbiAgLy8gTmV3IGNvbnZlbmllbmNlIGZ1bmN0aW9uIHRvIHRvZ2dsZSBib29sZWFuIHZhbHVlcyBpbiB0aGUgTW9kZWwuXG4gIHRvZ2dsZTogZnVuY3Rpb24oYXR0ciwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zID8gXy5jbG9uZShvcHRpb25zKSA6IHt9O1xuICAgIHZhciB2YWwgPSB0aGlzLmdldChhdHRyKTtcbiAgICBpZighXy5pc0Jvb2xlYW4odmFsKSkgY29uc29sZS5lcnJvcignVHJpZWQgdG8gdG9nZ2xlIG5vbi1ib29sZWFuIHZhbHVlICcgKyBhdHRyICsnIScsIHRoaXMpO1xuICAgIHJldHVybiB0aGlzLnNldChhdHRyLCAhdmFsLCBvcHRpb25zKTtcbiAgfSxcblxuICAvLyBNb2RlbCBSZXNldCBkb2VzIGEgZGVlcCByZXNldCBvbiB0aGUgZGF0YSB0cmVlIHN0YXJ0aW5nIGF0IHRoaXMgTW9kZWwuXG4gIC8vIEEgYHByZXZpb3VzQXR0cmlidXRlc2AgcHJvcGVydHkgaXMgc2V0IG9uIHRoZSBgb3B0aW9uc2AgcHJvcGVydHkgd2l0aCB0aGUgTW9kZWwnc1xuICAvLyBvbGQgdmFsdWVzLlxuICByZXNldDogZnVuY3Rpb24ob2JqLCBvcHRpb25zKXtcbiAgICB2YXIgY2hhbmdlZCA9IHt9LCBrZXksIHZhbHVlO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgb3B0aW9ucy5yZXNldCA9IHRydWU7XG4gICAgb2JqID0gKG9iaiAmJiBvYmouaXNNb2RlbCAmJiBvYmouYXR0cmlidXRlcykgfHwgb2JqIHx8IHt9O1xuICAgIG9wdGlvbnMucHJldmlvdXNBdHRyaWJ1dGVzID0gXy5jbG9uZSh0aGlzLmF0dHJpYnV0ZXMpO1xuXG4gICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSBNb2RlbCdzIGF0dHJpYnV0ZXM6XG4gICAgLy8gLSBJZiB0aGUgcHJvcGVydHkgaXMgdGhlIGBpZEF0dHJpYnV0ZWAsIHNraXAuXG4gICAgLy8gLSBJZiB0aGUgcHJvcGVydHkgaXMgYSBgTW9kZWxgLCBgQ29sbGVjdGlvbmAsIG9yIGBDb21wdXRlZFByb3BlcnR5YCwgcmVzZXQgaXQuXG4gICAgLy8gLSBJZiB0aGUgcGFzc2VkIG9iamVjdCBoYXMgdGhlIHByb3BlcnR5LCBzZXQgaXQgdG8gdGhlIG5ldyB2YWx1ZS5cbiAgICAvLyAtIElmIHRoZSBNb2RlbCBoYXMgYSBkZWZhdWx0IHZhbHVlIGZvciB0aGlzIHByb3BlcnR5LCBzZXQgaXQgYmFjayB0byBkZWZhdWx0LlxuICAgIC8vIC0gT3RoZXJ3aXNlLCB1bnNldCB0aGUgYXR0cmlidXRlLlxuICAgIGZvcihrZXkgaW4gdGhpcy5hdHRyaWJ1dGVzKXtcbiAgICAgIHZhbHVlID0gdGhpcy5hdHRyaWJ1dGVzW2tleV07XG4gICAgICBpZih2YWx1ZSA9PT0gb2JqW2tleV0pIGNvbnRpbnVlO1xuICAgICAgZWxzZSBpZihfLmlzVW5kZWZpbmVkKHZhbHVlKSkgb2JqW2tleV0gJiYgKGNoYW5nZWRba2V5XSA9IG9ialtrZXldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gdGhpcy5pZEF0dHJpYnV0ZSkgY29udGludWU7XG4gICAgICBlbHNlIGlmICh2YWx1ZS5pc0NvbGxlY3Rpb24gfHwgdmFsdWUuaXNNb2RlbCB8fCB2YWx1ZS5pc0NvbXB1dGVkUHJvcGVydHkpe1xuICAgICAgICB2YWx1ZS5yZXNldCgob2JqW2tleV18fFtdKSwge3NpbGVudDogdHJ1ZX0pO1xuICAgICAgICBpZih2YWx1ZS5pc0NvbGxlY3Rpb24pIGNoYW5nZWRba2V5XSA9IFtdO1xuICAgICAgICBlbHNlIGlmKHZhbHVlLmlzTW9kZWwgJiYgdmFsdWUuaXNDb21wdXRlZFByb3BlcnR5KSBjaGFuZ2VkW2tleV0gPSB2YWx1ZS5jYWNoZS5tb2RlbC5jaGFuZ2VkO1xuICAgICAgICBlbHNlIGlmKHZhbHVlLmlzTW9kZWwpIGNoYW5nZWRba2V5XSA9IHZhbHVlLmNoYW5nZWRcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKXsgY2hhbmdlZFtrZXldID0gb2JqW2tleV07IH1cbiAgICAgIGVsc2UgaWYgKHRoaXMuZGVmYXVsdHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiAhXy5pc0Z1bmN0aW9uKHRoaXMuZGVmYXVsdHNba2V5XSkpe1xuICAgICAgICBjaGFuZ2VkW2tleV0gPSBvYmpba2V5XSA9IHRoaXMuZGVmYXVsdHNba2V5XTtcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIGNoYW5nZWRba2V5XSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy51bnNldChrZXksIHtzaWxlbnQ6IHRydWV9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQW55IHVuc2V0IGNoYW5nZWQgdmFsdWVzIHdpbGwgYmUgc2V0IHRvIG9ialtrZXldXG4gICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqKXtcbiAgICAgIGNoYW5nZWRba2V5XSA9IGNoYW5nZWRba2V5XSB8fCBvYmpba2V5XTtcbiAgICB9KTtcblxuICAgIC8vIFJlc2V0IG91ciBtb2RlbFxuICAgIG9iaiA9IHRoaXMuc2V0KG9iaiwgXy5leHRlbmQoe30sIG9wdGlvbnMsIHtzaWxlbnQ6IHRydWUsIHJlc2V0OiBmYWxzZX0pKTtcblxuICAgIC8vIFRyaWdnZXIgY3VzdG9tIHJlc2V0IGV2ZW50XG4gICAgdGhpcy5jaGFuZ2VkID0gY2hhbmdlZDtcbiAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB0aGlzLnRyaWdnZXIoJ3Jlc2V0JywgdGhpcywgb3B0aW9ucyk7XG5cbiAgICAvLyBSZXR1cm4gbmV3IHZhbHVlc1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgLy8gKipNb2RlbC5HZXQqKiBpcyBvdmVycmlkZGVuIHRvIHByb3ZpZGUgc3VwcG9ydCBmb3IgZ2V0dGluZyBmcm9tIGEgZGVlcCBkYXRhIHRyZWUuXG4gIC8vIGBrZXlgIG1heSBub3cgYmUgYW55IHZhbGlkIGpzb24tbGlrZSBpZGVudGlmaWVyLiBFeDogYG9iai5jb2xsWzNdLnZhbHVlYC5cbiAgLy8gSXQgbmVlZHMgdG8gdHJhdmVyc2UgYE1vZGVsc2AsIGBDb2xsZWN0aW9uc2AgYW5kIGBDb21wdXRlZCBQcm9wZXJ0aWVzYCB0b1xuICAvLyBmaW5kIHRoZSBjb3JyZWN0IHZhbHVlLlxuICAvLyAtIElmIGtleSBpcyB1bmRlZmluZWQsIHJldHVybiBgdW5kZWZpbmVkYC5cbiAgLy8gLSBJZiBrZXkgaXMgZW1wdHkgc3RyaW5nLCByZXR1cm4gYHRoaXNgLlxuICAvL1xuICAvLyBGb3IgZWFjaCBwYXJ0OlxuICAvLyAtIElmIGEgYENvbXB1dGVkIFByb3BlcnR5YCBhbmQgYG9wdGlvbnMucmF3YCBpcyB0cnVlLCByZXR1cm4gaXQuXG4gIC8vIC0gSWYgYSBgQ29tcHV0ZWQgUHJvcGVydHlgIHRyYXZlcnNlIHRvIGl0cyB2YWx1ZS5cbiAgLy8gLSBJZiBub3Qgc2V0LCByZXR1cm4gaXRzIGZhbHN5IHZhbHVlLlxuICAvLyAtIElmIGEgYE1vZGVsYCwgYENvbGxlY3Rpb25gLCBvciBwcmltaXRpdmUgdmFsdWUsIHRyYXZlcnNlIHRvIGl0LlxuICBnZXQ6IGZ1bmN0aW9uKGtleSwgb3B0aW9ucyl7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgcGFydHMgID0gJC5zcGxpdFBhdGgoa2V5KSxcbiAgICAgICAgcmVzdWx0ID0gdGhpcyxcbiAgICAgICAgaSwgbD1wYXJ0cy5sZW5ndGg7XG5cbiAgICBpZihfLmlzVW5kZWZpbmVkKGtleSkgfHwgXy5pc051bGwoa2V5KSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBpZihrZXkgPT09ICcnIHx8IHBhcnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJlc3VsdDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5ICYmIG9wdGlvbnMucmF3KSByZXR1cm4gcmVzdWx0O1xuICAgICAgaWYocmVzdWx0ICYmIHJlc3VsdC5pc0NvbXB1dGVkUHJvcGVydHkpIHJlc3VsdCA9IHJlc3VsdC52YWx1ZSgpO1xuICAgICAgaWYoXy5pc1VuZGVmaW5lZChyZXN1bHQpIHx8IF8uaXNOdWxsKHJlc3VsdCkpIHJldHVybiByZXN1bHQ7XG4gICAgICBpZihwYXJ0c1tpXSA9PT0gJ0BwYXJlbnQnKSByZXN1bHQgPSByZXN1bHQuX19wYXJlbnRfXztcbiAgICAgIGVsc2UgaWYocmVzdWx0LmlzQ29sbGVjdGlvbikgcmVzdWx0ID0gcmVzdWx0Lm1vZGVsc1twYXJ0c1tpXV07XG4gICAgICBlbHNlIGlmKHJlc3VsdC5pc01vZGVsKSByZXN1bHQgPSByZXN1bHQuYXR0cmlidXRlc1twYXJ0c1tpXV07XG4gICAgICBlbHNlIGlmKHJlc3VsdCAmJiByZXN1bHQuaGFzT3duUHJvcGVydHkocGFydHNbaV0pKSByZXN1bHQgPSByZXN1bHRbcGFydHNbaV1dO1xuICAgIH1cblxuICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5ICYmICFvcHRpb25zLnJhdykgcmVzdWx0ID0gcmVzdWx0LnZhbHVlKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuXG4gIC8vICoqTW9kZWwuU2V0KiogaXMgb3ZlcnJpZGRlbiB0byBwcm92aWRlIHN1cHBvcnQgZm9yIGdldHRpbmcgZnJvbSBhIGRlZXAgZGF0YSB0cmVlLlxuICAvLyBga2V5YCBtYXkgbm93IGJlIGFueSB2YWxpZCBqc29uLWxpa2UgaWRlbnRpZmllci4gRXg6IGBvYmouY29sbFszXS52YWx1ZWAuXG4gIC8vIEl0IG5lZWRzIHRvIHRyYXZlcnNlIGBNb2RlbHNgLCBgQ29sbGVjdGlvbnNgIGFuZCBgQ29tcHV0ZWQgUHJvcGVydGllc2AgdG9cbiAgLy8gZmluZCB0aGUgY29ycmVjdCB2YWx1ZSB0byBjYWxsIHRoZSBvcmlnaW5hbCBgQmFja2JvbmUuU2V0YCBvbi5cbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbCwgb3B0aW9ucyl7XG5cbiAgICB2YXIgYXR0cnMsIGF0dHIsIG5ld0tleSwgdGFyZ2V0LCBkZXN0aW5hdGlvbiwgcHJvcHMgPSBbXSwgbGluZWFnZTtcblxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgYXR0cnMgPSAoa2V5LmlzTW9kZWwpID8ga2V5LmF0dHJpYnV0ZXMgOiBrZXk7XG4gICAgICBvcHRpb25zID0gdmFsO1xuICAgIH1cbiAgICBlbHNlIChhdHRycyA9IHt9KVtrZXldID0gdmFsO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG5cbiAgICAvLyBJZiByZXNldCBvcHRpb24gcGFzc2VkLCBkbyBhIHJlc2V0LiBJZiBub3RoaW5nIHBhc3NlZCwgcmV0dXJuLlxuICAgIGlmKG9wdGlvbnMucmVzZXQgPT09IHRydWUpIHJldHVybiB0aGlzLnJlc2V0KGF0dHJzLCBvcHRpb25zKTtcbiAgICBpZihvcHRpb25zLmRlZmF1bHRzID09PSB0cnVlKSB0aGlzLmRlZmF1bHRzID0gYXR0cnM7XG4gICAgaWYoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuO1xuXG4gICAgLy8gRm9yIGVhY2ggYXR0cmlidXRlIHBhc3NlZDpcbiAgICBmb3Ioa2V5IGluIGF0dHJzKXtcbiAgICAgIHZhciB2YWwgPSBhdHRyc1trZXldLFxuICAgICAgICAgIHBhdGhzID0gJC5zcGxpdFBhdGgoa2V5KSxcbiAgICAgICAgICBhdHRyICA9IHBhdGhzLnBvcCgpIHx8ICcnOyAgICAgICAgICAgLy8gVGhlIGtleSAgICAgICAgZXg6IGZvb1swXS5iYXIgLS0+IGJhclxuICAgICAgICAgIHRhcmdldCA9IHRoaXMuZ2V0KHBhdGhzLmpvaW4oJy4nKSksICAvLyBUaGUgZWxlbWVudCAgICBleDogZm9vLmJhci5iYXogLS0+IGZvby5iYXJcbiAgICAgICAgICBsaW5lYWdlO1xuXG4gICAgICAvLyBJZiB0YXJnZXQgY3VycmVudGx5IGRvZXNudCBleGlzdCwgY29uc3RydWN0IGl0cyB0cmVlXG4gICAgICBpZihfLmlzVW5kZWZpbmVkKHRhcmdldCkpe1xuICAgICAgICB0YXJnZXQgPSB0aGlzO1xuICAgICAgICBfLmVhY2gocGF0aHMsIGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgICAgICB2YXIgdG1wID0gdGFyZ2V0LmdldCh2YWx1ZSk7XG4gICAgICAgICAgaWYoXy5pc1VuZGVmaW5lZCh0bXApKSB0bXAgPSB0YXJnZXQuc2V0KHZhbHVlLCB7fSkuZ2V0KHZhbHVlKTtcbiAgICAgICAgICB0YXJnZXQgPSB0bXA7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGUgb2xkIHZhbHVlIG9mIGBhdHRyYCBpbiBgdGFyZ2V0YFxuICAgICAgdmFyIGRlc3RpbmF0aW9uID0gdGFyZ2V0LmdldChhdHRyLCB7cmF3OiB0cnVlfSkgfHwge307XG5cbiAgICAgIC8vIENyZWF0ZSB0aGlzIG5ldyBvYmplY3QncyBsaW5lYWdlLlxuICAgICAgbGluZWFnZSA9IHtcbiAgICAgICAgbmFtZToga2V5LFxuICAgICAgICBwYXJlbnQ6IHRhcmdldCxcbiAgICAgICAgcm9vdDogdGhpcy5fX3Jvb3RfXyxcbiAgICAgICAgcGF0aDogcGF0aEdlbmVyYXRvcih0YXJnZXQsIGtleSksXG4gICAgICAgIHNpbGVudDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdHM6IG9wdGlvbnMuZGVmYXVsdHNcbiAgICAgIH1cbiAgICAgIC8vIC0gSWYgdmFsIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYCwgc2V0IHRvIGRlZmF1bHQgdmFsdWUuXG4gICAgICAvLyAtIElmIHZhbCBpcyBhIGBDb21wdXRlZCBQcm9wZXJ0eWAsIGdldCBpdHMgY3VycmVudCBjYWNoZSBvYmplY3QuXG4gICAgICAvLyAtIElmIHZhbCBpcyBgbnVsbGAsIHNldCB0byBkZWZhdWx0IHZhbHVlIG9yIChmYWxsYmFjayBgdW5kZWZpbmVkYCkuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyBmdW5jdGlvbiBpcyB0aGUgc2FtZSBhcyB0aGUgY3VycmVudCBjb21wdXRlZCBwcm9wZXJ0eSwgY29udGludWUuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyB2YWx1ZSBpcyBhIGBGdW5jdGlvbmAsIHR1cm4gaXQgaW50byBhIGBDb21wdXRlZCBQcm9wZXJ0eWAuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyBpcyBnb2luZyB0byBiZSBhIGN5Y2xpY2FsIGRlcGVuZGFuY3ksIHVzZSB0aGUgb3JpZ2luYWwgb2JqZWN0LCBkb24ndCBtYWtlIGEgY29weS5cbiAgICAgIC8vIC0gRWxzZSBJZiB1cGRhdGluZyBhbiBleGlzdGluZyBvYmplY3Qgd2l0aCBpdHMgcmVzcGVjdGl2ZSBkYXRhIHR5cGUsIGxldCBCYWNrYm9uZSBoYW5kbGUgdGhlIG1lcmdlLlxuICAgICAgLy8gLSBFbHNlIElmIHRoaXMgdmFsdWUgaXMgYSBgTW9kZWxgIG9yIGBDb2xsZWN0aW9uYCwgY3JlYXRlIGEgbmV3IGNvcHkgb2YgaXQgdXNpbmcgaXRzIGNvbnN0cnVjdG9yLCBwcmVzZXJ2aW5nIGl0cyBkZWZhdWx0cyB3aGlsZSBlbnN1cmluZyBubyBzaGFyZWQgbWVtb3J5IGJldHdlZW4gb2JqZWN0cy5cbiAgICAgIC8vIC0gRWxzZSBJZiB0aGlzIHZhbHVlIGlzIGFuIGBBcnJheWAsIHR1cm4gaXQgaW50byBhIGBDb2xsZWN0aW9uYC5cbiAgICAgIC8vIC0gRWxzZSBJZiB0aGlzIHZhbHVlIGlzIGEgYE9iamVjdGAsIHR1cm4gaXQgaW50byBhIGBNb2RlbGAuXG4gICAgICAvLyAtIEVsc2UgdmFsIGlzIGEgcHJpbWl0aXZlIHZhbHVlLCBzZXQgaXQgYWNjb3JkaW5nbHkuXG5cblxuXG4gICAgICBpZihfLmlzTnVsbCh2YWwpIHx8IF8uaXNVbmRlZmluZWQodmFsKSkgdmFsID0gdGhpcy5kZWZhdWx0c1trZXldO1xuICAgICAgaWYodmFsICYmIHZhbC5pc0NvbXB1dGVkUHJvcGVydHkpIHZhbCA9IHZhbC52YWx1ZSgpO1xuICAgICAgZWxzZSBpZihfLmlzTnVsbCh2YWwpIHx8IF8uaXNVbmRlZmluZWQodmFsKSkgdmFsID0gdW5kZWZpbmVkO1xuICAgICAgZWxzZSBpZihkZXN0aW5hdGlvbi5pc0NvbXB1dGVkUHJvcGVydHkgJiYgZGVzdGluYXRpb24uZnVuYyA9PT0gdmFsKSBjb250aW51ZTtcbiAgICAgIGVsc2UgaWYoXy5pc0Z1bmN0aW9uKHZhbCkpIHZhbCA9IG5ldyBDb21wdXRlZFByb3BlcnR5KHZhbCwgbGluZWFnZSk7XG4gICAgICBlbHNlIGlmKHZhbC5pc0RhdGEgJiYgdGFyZ2V0Lmhhc1BhcmVudCh2YWwpKSB2YWwgPSB2YWw7XG4gICAgICBlbHNlIGlmKCBkZXN0aW5hdGlvbi5pc0NvbXB1dGVkUHJvcGVydHkgfHxcbiAgICAgICAgICAgICAgKCBkZXN0aW5hdGlvbi5pc0NvbGxlY3Rpb24gJiYgKCBfLmlzQXJyYXkodmFsKSB8fCB2YWwuaXNDb2xsZWN0aW9uICkpIHx8XG4gICAgICAgICAgICAgICggZGVzdGluYXRpb24uaXNNb2RlbCAmJiAoIF8uaXNPYmplY3QodmFsKSB8fCB2YWwuaXNNb2RlbCApKSl7XG4gICAgICAgIGRlc3RpbmF0aW9uLnNldCh2YWwsIG9wdGlvbnMpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYodmFsLmlzRGF0YSAmJiBvcHRpb25zLmNsb25lICE9PSBmYWxzZSkgdmFsID0gbmV3IHZhbC5jb25zdHJ1Y3Rvcih2YWwuYXR0cmlidXRlcyB8fCB2YWwubW9kZWxzLCBsaW5lYWdlKTtcbiAgICAgIGVsc2UgaWYoXy5pc0FycmF5KHZhbCkpIHZhbCA9IG5ldyBSZWJvdW5kLkNvbGxlY3Rpb24odmFsLCBsaW5lYWdlKTsgLy8gVE9ETzogUmVtb3ZlIGdsb2JhbCByZWZlcmFuY2VcbiAgICAgIGVsc2UgaWYoXy5pc09iamVjdCh2YWwpKSB2YWwgPSBuZXcgTW9kZWwodmFsLCBsaW5lYWdlKTtcblxuICAgICAgLy8gSWYgdmFsIGlzIGEgZGF0YSBvYmplY3QsIGxldCB0aGlzIG9iamVjdCBrbm93IGl0IGlzIG5vdyBhIHBhcmVudFxuICAgICAgdGhpcy5faGFzQW5jZXN0cnkgPSAodmFsICYmIHZhbC5pc0RhdGEgfHwgZmFsc2UpO1xuXG4gICAgICAvLyBTZXQgdGhlIHZhbHVlXG4gICAgICBCYWNrYm9uZS5Nb2RlbC5wcm90b3R5cGUuc2V0LmNhbGwodGFyZ2V0LCBhdHRyLCB2YWwsIG9wdGlvbnMpOyAvLyBUT0RPOiBFdmVudCBjbGVhbnVwIHdoZW4gcmVwbGFjaW5nIGEgbW9kZWwgb3IgY29sbGVjdGlvbiB3aXRoIGFub3RoZXIgdmFsdWVcblxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcztcblxuICB9LFxuXG4gIC8vIFJlY3Vyc2l2ZSBgdG9KU09OYCBmdW5jdGlvbiB0cmF2ZXJzZXMgdGhlIGRhdGEgdHJlZSByZXR1cm5pbmcgYSBKU09OIG9iamVjdC5cbiAgLy8gSWYgdGhlcmUgYXJlIGFueSBjeWNsaWMgZGVwZW5kYW5jaWVzIHRoZSBvYmplY3QncyBgY2lkYCBpcyB1c2VkIGluc3RlYWQgb2YgbG9vcGluZyBpbmZpbml0ZWx5LlxuICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuX2lzU2VyaWFsaXppbmcpIHJldHVybiB0aGlzLmlkIHx8IHRoaXMuY2lkO1xuICAgICAgdGhpcy5faXNTZXJpYWxpemluZyA9IHRydWU7XG4gICAgICB2YXIganNvbiA9IF8uY2xvbmUodGhpcy5hdHRyaWJ1dGVzKTtcbiAgICAgIF8uZWFjaChqc29uLCBmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICAgIGlmKCBfLmlzTnVsbCh2YWx1ZSkgfHwgXy5pc1VuZGVmaW5lZCh2YWx1ZSkgKXsgcmV0dXJuOyB9XG4gICAgICAgICAgXy5pc0Z1bmN0aW9uKHZhbHVlLnRvSlNPTikgJiYgKGpzb25bbmFtZV0gPSB2YWx1ZS50b0pTT04oKSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2lzU2VyaWFsaXppbmcgPSBmYWxzZTtcbiAgICAgIHJldHVybiBqc29uO1xuICB9XG5cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBNb2RlbDtcbiIsIi8vIFJlYm91bmQgTGF6eSBWYWx1ZVxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgTklMID0gZnVuY3Rpb24gTklMKCl7fSxcbiAgICBFTVBUWV9BUlJBWSA9IFtdO1xuXG5mdW5jdGlvbiBMYXp5VmFsdWUoZm4sIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KVxuICB0aGlzLmNpZCA9IF8udW5pcXVlSWQoJ2xhenlWYWx1ZScpO1xuICB0aGlzLnZhbHVlRm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0IHx8IG51bGw7XG4gIHRoaXMubW9ycGggPSBvcHRpb25zLm1vcnBoIHx8IG51bGw7XG4gIHRoaXMuYXR0ck1vcnBoID0gb3B0aW9ucy5hdHRyTW9ycGggfHwgbnVsbDtcbiAgXy5iaW5kQWxsKHRoaXMsICd2YWx1ZScsICdzZXQnLCAnYWRkRGVwZW5kZW50VmFsdWUnLCAnYWRkT2JzZXJ2ZXInLCAnbm90aWZ5JywgJ29uTm90aWZ5JywgJ2Rlc3Ryb3knKTtcbn1cblxuTGF6eVZhbHVlLnByb3RvdHlwZSA9IHtcbiAgaXNMYXp5VmFsdWU6IHRydWUsXG4gIHBhcmVudDogbnVsbCwgLy8gVE9ETzogaXMgcGFyZW50IGV2ZW4gbmVlZGVkPyBjb3VsZCBiZSBtb2RlbGVkIGFzIGEgc3Vic2NyaWJlclxuICBjaGlsZHJlbjogbnVsbCxcbiAgb2JzZXJ2ZXJzOiBudWxsLFxuICBjYWNoZTogTklMLFxuICB2YWx1ZUZuOiBudWxsLFxuICBzdWJzY3JpYmVyczogbnVsbCwgLy8gVE9ETzogZG8gd2UgbmVlZCBtdWx0aXBsZSBzdWJzY3JpYmVycz9cbiAgX2NoaWxkVmFsdWVzOiBudWxsLCAvLyBqdXN0IGZvciByZXVzaW5nIHRoZSBhcnJheSwgbWlnaHQgbm90IHdvcmsgd2VsbCBpZiBjaGlsZHJlbi5sZW5ndGggY2hhbmdlcyBhZnRlciBjb21wdXRhdGlvblxuXG4gIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FjaGUgPSB0aGlzLmNhY2hlO1xuICAgIGlmIChjYWNoZSAhPT0gTklMKSB7IHJldHVybiBjYWNoZTsgfVxuXG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgIHZhciBjaGlsZCxcbiAgICAgICAgICB2YWx1ZXMgPSB0aGlzLl9jaGlsZFZhbHVlcyB8fCBuZXcgQXJyYXkoY2hpbGRyZW4ubGVuZ3RoKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgdmFsdWVzW2ldID0gKGNoaWxkICYmIGNoaWxkLmlzTGF6eVZhbHVlKSA/IGNoaWxkLnZhbHVlKCkgOiBjaGlsZDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuY2FjaGUgPSB0aGlzLnZhbHVlRm4odmFsdWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuY2FjaGUgPSB0aGlzLnZhbHVlRm4oRU1QVFlfQVJSQVkpO1xuICAgIH1cbiAgfSxcblxuICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUsIG9wdGlvbnMpe1xuICAgIGlmKHRoaXMuY29udGV4dCl7XG4gICAgICByZXR1cm4gdGhpcy5jb250ZXh0LnNldChrZXksIHZhbHVlLCBvcHRpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cbiAgYWRkRGVwZW5kZW50VmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcbiAgICBpZiAoIWNoaWxkcmVuKSB7XG4gICAgICBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW4gPSBbdmFsdWVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaGlsZHJlbi5wdXNoKHZhbHVlKTtcbiAgICB9XG5cbiAgICBpZiAodmFsdWUgJiYgdmFsdWUuaXNMYXp5VmFsdWUpIHsgdmFsdWUucGFyZW50ID0gdGhpczsgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgYWRkT2JzZXJ2ZXI6IGZ1bmN0aW9uKHBhdGgsIGNvbnRleHQpIHtcbiAgICB2YXIgb2JzZXJ2ZXJzID0gdGhpcy5vYnNlcnZlcnMgfHwgKHRoaXMub2JzZXJ2ZXJzID0gW10pLFxuICAgICAgICBwb3NpdGlvbiwgcmVzO1xuXG4gICAgaWYoIV8uaXNPYmplY3QoY29udGV4dCkgfHwgIV8uaXNTdHJpbmcocGF0aCkpIHJldHVybiBjb25zb2xlLmVycm9yKCdFcnJvciBhZGRpbmcgb2JzZXJ2ZXIgZm9yJywgY29udGV4dCwgcGF0aCk7XG5cbiAgICAvLyBFbnN1cmUgX29ic2VydmVycyBleGlzdHMgYW5kIGlzIGFuIG9iamVjdFxuICAgIGNvbnRleHQuX19vYnNlcnZlcnMgPSBjb250ZXh0Ll9fb2JzZXJ2ZXJzIHx8IHt9O1xuICAgIC8vIEVuc3VyZSBfX29ic2VydmVyc1twYXRoXSBleGlzdHMgYW5kIGlzIGFuIGFycmF5XG4gICAgY29udGV4dC5fX29ic2VydmVyc1twYXRoXSA9IGNvbnRleHQuX19vYnNlcnZlcnNbcGF0aF0gfHwge2NvbGxlY3Rpb246IFtdLCBtb2RlbDogW119O1xuXG4gICAgLy8gU2F2ZSB0aGUgdHlwZSBvZiBvYmplY3QgZXZlbnRzIHRoaXMgb2JzZXJ2ZXIgaXMgZm9yXG4gICAgcmVzID0gY29udGV4dC5nZXQodGhpcy5wYXRoKTtcbiAgICByZXMgPSAocmVzICYmIHJlcy5pc0NvbGxlY3Rpb24pID8gJ2NvbGxlY3Rpb24nIDogJ21vZGVsJztcblxuICAgIC8vIEFkZCBvdXIgY2FsbGJhY2ssIHNhdmUgdGhlIHBvc2l0aW9uIGl0IGlzIGJlaW5nIGluc2VydGVkIHNvIHdlIGNhbiBnYXJiYWdlIGNvbGxlY3QgbGF0ZXIuXG4gICAgcG9zaXRpb24gPSBjb250ZXh0Ll9fb2JzZXJ2ZXJzW3BhdGhdW3Jlc10ucHVzaCh0aGlzKSAtIDE7XG5cbiAgICAvLyBMYXp5dmFsdWUgbmVlZHMgcmVmZXJhbmNlIHRvIGl0cyBvYnNlcnZlcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBvbiBkZXN0cm95XG4gICAgb2JzZXJ2ZXJzLnB1c2goe2NvbnRleHQ6IGNvbnRleHQsIHBhdGg6IHBhdGgsIGluZGV4OiBwb3NpdGlvbn0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbm90aWZ5OiBmdW5jdGlvbihzZW5kZXIpIHtcbiAgICAvLyBUT0RPOiBUaGlzIGNoZWNrIHdvbid0IGJlIG5lY2Vzc2FyeSBvbmNlIHJlbW92ZWQgRE9NIGhhcyBiZWVuIGNsZWFuZWQgb2YgYW55IGJpbmRpbmdzLiBcbiAgICAvLyBJZiB0aGlzIGxhenlWYWx1ZSdzIG1vcnBoIGRvZXMgbm90IGhhdmUgYW4gaW1tZWRpYXRlIHBhcmVudE5vZGUsIGl0IGhhcyBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgZG9tIHRyZWUuIERlc3Ryb3kgaXQuXG4gICAgLy8gUmlnaHQgbm93LCBET00gdGhhdCBjb250YWlucyBtb3JwaHMgdGhyb3cgYW4gZXJyb3IgaWYgaXQgaXMgcmVtb3ZlZCBieSBhbm90aGVyIGxhenl2YWx1ZSBiZWZvcmUgdGhvc2UgbW9ycGhzIHJlLWV2YWx1YXRlLlxuICAgIGlmKHRoaXMubW9ycGggJiYgdGhpcy5tb3JwaC5zdGFydCAmJiAhdGhpcy5tb3JwaC5zdGFydC5wYXJlbnROb2RlKSByZXR1cm4gdGhpcy5kZXN0cm95KCk7XG4gICAgdmFyIGNhY2hlID0gdGhpcy5jYWNoZSxcbiAgICAgICAgcGFyZW50LFxuICAgICAgICBzdWJzY3JpYmVycztcblxuICAgIGlmIChjYWNoZSAhPT0gTklMKSB7XG4gICAgICBwYXJlbnQgPSB0aGlzLnBhcmVudDtcbiAgICAgIHN1YnNjcmliZXJzID0gdGhpcy5zdWJzY3JpYmVycztcbiAgICAgIGNhY2hlID0gdGhpcy5jYWNoZSA9IE5JTDtcbiAgICAgIGlmIChwYXJlbnQpIHsgcGFyZW50Lm5vdGlmeSh0aGlzKTsgfVxuICAgICAgaWYgKCFzdWJzY3JpYmVycykgeyByZXR1cm47IH1cbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gc3Vic2NyaWJlcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHN1YnNjcmliZXJzW2ldKHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBvbk5vdGlmeTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB2YXIgc3Vic2NyaWJlcnMgPSB0aGlzLnN1YnNjcmliZXJzIHx8ICh0aGlzLnN1YnNjcmliZXJzID0gW10pO1xuICAgIHN1YnNjcmliZXJzLnB1c2goY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCl7XG4gICAgICBpZiAoY2hpbGQgJiYgY2hpbGQuaXNMYXp5VmFsdWUpeyBjaGlsZC5kZXN0cm95KCk7IH1cbiAgICB9KTtcbiAgICBfLmVhY2godGhpcy5zdWJzY3JpYmVycywgZnVuY3Rpb24oc3Vic2NyaWJlcil7XG4gICAgICBpZiAoc3Vic2NyaWJlciAmJiBzdWJzY3JpYmVyLmlzTGF6eVZhbHVlKXsgc3Vic2NyaWJlci5kZXN0cm95KCk7IH1cbiAgICB9KTtcblxuICAgIHRoaXMucGFyZW50ID0gdGhpcy5jaGlsZHJlbiA9IHRoaXMuY2FjaGUgPSB0aGlzLnZhbHVlRm4gPSB0aGlzLnN1YnNjcmliZXJzID0gdGhpcy5fY2hpbGRWYWx1ZXMgPSBudWxsO1xuXG4gICAgXy5lYWNoKHRoaXMub2JzZXJ2ZXJzLCBmdW5jdGlvbihvYnNlcnZlcil7XG4gICAgICBpZihfLmlzT2JqZWN0KG9ic2VydmVyLmNvbnRleHQuX19vYnNlcnZlcnNbb2JzZXJ2ZXIucGF0aF0pKXtcbiAgICAgICAgZGVsZXRlIG9ic2VydmVyLmNvbnRleHQuX19vYnNlcnZlcnNbb2JzZXJ2ZXIucGF0aF1bb2JzZXJ2ZXIuaW5kZXhdO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5vYnNlcnZlcnMgPSBudWxsO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBMYXp5VmFsdWU7XG4iLCIvLyBSZWJvdW5kIERhdGFcbi8vIC0tLS0tLS0tLS0tLS0tLS1cbi8vIFRoZXNlIGFyZSBtZXRob2RzIGluaGVyaXRlZCBieSBhbGwgUmVib3VuZCBkYXRhIHR5cGVzIOKAkyAqKk1vZGVscyoqLFxuLy8gKipDb2xsZWN0aW9ucyoqIGFuZCAqKkNvbXB1dGVkIFByb3BlcnRpZXMqKiDigJMgYW5kIGNvbnRyb2wgdHJlZSBhbmNlc3RyeVxuLy8gdHJhY2tpbmcsIGRlZXAgZXZlbnQgcHJvcGFnYXRpb24gYW5kIHRyZWUgZGVzdHJ1Y3Rpb24uXG5cbmltcG9ydCBNb2RlbCBmcm9tIFwicmVib3VuZC1kYXRhL21vZGVsXCI7XG5pbXBvcnQgQ29sbGVjdGlvbiBmcm9tIFwicmVib3VuZC1kYXRhL2NvbGxlY3Rpb25cIjtcbmltcG9ydCBDb21wdXRlZFByb3BlcnR5IGZyb20gXCJyZWJvdW5kLWRhdGEvY29tcHV0ZWQtcHJvcGVydHlcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG52YXIgc2hhcmVkTWV0aG9kcyA9IHtcbiAgLy8gV2hlbiBhIGNoYW5nZSBldmVudCBwcm9wYWdhdGVzIHVwIHRoZSB0cmVlIGl0IG1vZGlmaWVzIHRoZSBwYXRoIHBhcnQgb2ZcbiAgLy8gYGNoYW5nZTo8cGF0aD5gIHRvIHJlZmxlY3QgdGhlIGZ1bGx5IHF1YWxpZmllZCBwYXRoIHJlbGF0aXZlIHRvIHRoYXQgb2JqZWN0LlxuICAvLyBFeDogV291bGQgdHJpZ2dlciBgY2hhbmdlOnZhbGAsIGBjaGFuZ2U6WzBdLnZhbGAsIGBjaGFuZ2U6YXJyWzBdLnZhbGAgYW5kIGBvYmouYXJyWzBdLnZhbGBcbiAgLy8gb24gZWFjaCBwYXJlbnQgYXMgaXQgaXMgcHJvcGFnYXRlZCB1cCB0aGUgdHJlZS5cbiAgcHJvcGFnYXRlRXZlbnQ6IGZ1bmN0aW9uKHR5cGUsIG1vZGVsKXtcbiAgICBpZih0aGlzLl9fcGFyZW50X18gPT09IHRoaXMgfHwgdHlwZSA9PT0gJ2RpcnR5JykgcmV0dXJuO1xuICAgIGlmKHR5cGUuaW5kZXhPZignY2hhbmdlOicpID09PSAwICYmIG1vZGVsLmlzTW9kZWwpe1xuICAgICAgaWYodGhpcy5pc0NvbGxlY3Rpb24gJiYgfnR5cGUuaW5kZXhPZignY2hhbmdlOlsnKSkgcmV0dXJuO1xuICAgICAgdmFyIGtleSxcbiAgICAgICAgICBwYXRoID0gbW9kZWwuX19wYXRoKCkucmVwbGFjZSh0aGlzLl9fcGFyZW50X18uX19wYXRoKCksICcnKS5yZXBsYWNlKC9eXFwuLywgJycpLFxuICAgICAgICAgIGNoYW5nZWQgPSBtb2RlbC5jaGFuZ2VkQXR0cmlidXRlcygpO1xuXG4gICAgICBmb3Ioa2V5IGluIGNoYW5nZWQpe1xuICAgICAgICBhcmd1bWVudHNbMF0gPSAoJ2NoYW5nZTonICsgcGF0aCArIChwYXRoICYmICcuJykgKyBrZXkpOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgdGhpcy5fX3BhcmVudF9fLnRyaWdnZXIuYXBwbHkodGhpcy5fX3BhcmVudF9fLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3BhcmVudF9fLnRyaWdnZXIuYXBwbHkodGhpcy5fX3BhcmVudF9fLCBhcmd1bWVudHMpO1xuICB9LFxuXG4gIC8vIFNldCB0aGlzIGRhdGEgb2JqZWN0J3MgcGFyZW50IHRvIGBwYXJlbnRgIGFuZCwgYXMgbG9uZyBhcyBhIGRhdGEgb2JqZWN0IGlzXG4gIC8vIG5vdCBpdHMgb3duIHBhcmVudCwgcHJvcGFnYXRlIGV2ZXJ5IGV2ZW50IHRyaWdnZXJlZCBvbiBgdGhpc2AgdXAgdGhlIHRyZWUuXG4gIHNldFBhcmVudDogZnVuY3Rpb24ocGFyZW50KXtcbiAgICBpZih0aGlzLl9fcGFyZW50X18pIHRoaXMub2ZmKCdhbGwnLCB0aGlzLnByb3BhZ2F0ZUV2ZW50KTtcbiAgICB0aGlzLl9fcGFyZW50X18gPSBwYXJlbnQ7XG4gICAgdGhpcy5faGFzQW5jZXN0cnkgPSB0cnVlO1xuICAgIGlmKHBhcmVudCAhPT0gdGhpcykgdGhpcy5vbignYWxsJywgdGhpcy5fX3BhcmVudF9fLnByb3BhZ2F0ZUV2ZW50KTtcbiAgICByZXR1cm4gcGFyZW50O1xuICB9LFxuXG4gIC8vIFJlY3Vyc2l2ZWx5IHNldCBhIGRhdGEgdHJlZSdzIHJvb3QgZWxlbWVudCBzdGFydGluZyB3aXRoIGB0aGlzYCB0byB0aGUgZGVlcGVzdCBjaGlsZC5cbiAgLy8gVE9ETzogSSBkb250IGxpa2UgdGhpcyByZWN1cnNpdmVseSBzZXR0aW5nIGVsZW1lbnRzIHJvb3Qgd2hlbiBvbmUgZWxlbWVudCdzIHJvb3QgY2hhbmdlcy4gRml4IHRoaXMuXG4gIHNldFJvb3Q6IGZ1bmN0aW9uIChyb290KXtcbiAgICB2YXIgb2JqID0gdGhpcztcbiAgICBvYmouX19yb290X18gPSByb290O1xuICAgIHZhciB2YWwgPSBvYmoubW9kZWxzIHx8ICBvYmouYXR0cmlidXRlcyB8fCBvYmouY2FjaGU7XG4gICAgXy5lYWNoKHZhbCwgZnVuY3Rpb24odmFsdWUsIGtleSl7XG4gICAgICBpZih2YWx1ZSAmJiB2YWx1ZS5pc0RhdGEpe1xuICAgICAgICB2YWx1ZS5zZXRSb290KHJvb3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByb290O1xuICB9LFxuXG4gIC8vIFRlc3RzIHRvIHNlZSBpZiBgdGhpc2AgaGFzIGEgcGFyZW50IGBvYmpgLlxuICBoYXNQYXJlbnQ6IGZ1bmN0aW9uKG9iail7XG4gICAgdmFyIHRtcCA9IHRoaXM7XG4gICAgd2hpbGUodG1wICE9PSBvYmope1xuICAgICAgdG1wID0gdG1wLl9fcGFyZW50X187XG4gICAgICBpZihfLmlzVW5kZWZpbmVkKHRtcCkpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmKHRtcCA9PT0gb2JqKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmKHRtcC5fX3BhcmVudF9fID09PSB0bXApIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgLy8gRGUtaW5pdGlhbGl6ZXMgYSBkYXRhIHRyZWUgc3RhcnRpbmcgd2l0aCBgdGhpc2AgYW5kIHJlY3Vyc2l2ZWx5IGNhbGxpbmcgYGRlaW5pdGlhbGl6ZSgpYCBvbiBlYWNoIGNoaWxkLlxuICBkZWluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcblxuICAvLyBVbmRlbGVnYXRlIEJhY2tib25lIEV2ZW50cyBmcm9tIHRoaXMgZGF0YSBvYmplY3RcbiAgICBpZiAodGhpcy51bmRlbGVnYXRlRXZlbnRzKSB0aGlzLnVuZGVsZWdhdGVFdmVudHMoKTtcbiAgICBpZiAodGhpcy5zdG9wTGlzdGVuaW5nKSB0aGlzLnN0b3BMaXN0ZW5pbmcoKTtcbiAgICBpZiAodGhpcy5vZmYpIHRoaXMub2ZmKCk7XG5cbiAgLy8gRGVzdHJveSB0aGlzIGRhdGEgb2JqZWN0J3MgbGluZWFnZVxuICAgIGRlbGV0ZSB0aGlzLl9fcGFyZW50X187XG4gICAgZGVsZXRlIHRoaXMuX19yb290X187XG4gICAgZGVsZXRlIHRoaXMuX19wYXRoO1xuXG4gIC8vIElmIHRoZXJlIGlzIGEgZG9tIGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoaXMgZGF0YSBvYmplY3QsIGRlc3Ryb3kgYWxsIGxpc3RlbmVycyBhc3NvY2lhdGVkIHdpdGggaXQuXG4gIC8vIFJlbW92ZSBhbGwgZXZlbnQgbGlzdGVuZXJzIGZyb20gdGhpcyBkb20gZWxlbWVudCwgcmVjdXJzaXZlbHkgcmVtb3ZlIGVsZW1lbnQgbGF6eXZhbHVlcyxcbiAgLy8gYW5kIHRoZW4gcmVtb3ZlIHRoZSBlbGVtZW50IHJlZmVyYW5jZSBpdHNlbGYuXG4gICAgaWYodGhpcy5lbCl7XG4gICAgICBfLmVhY2godGhpcy5lbC5fX2xpc3RlbmVycywgZnVuY3Rpb24oaGFuZGxlciwgZXZlbnRUeXBlKXtcbiAgICAgICAgaWYgKHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcikgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICBpZiAodGhpcy5lbC5kZXRhY2hFdmVudCkgdGhpcy5lbC5kZXRhY2hFdmVudCgnb24nK2V2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgICB9LCB0aGlzKTtcbiAgICAgICQodGhpcy5lbCkud2Fsa1RoZURPTShmdW5jdGlvbihlbCl7XG4gICAgICAgIGlmKGVsLl9fbGF6eVZhbHVlICYmIGVsLl9fbGF6eVZhbHVlLmRlc3Ryb3koKSkgbi5fX2xhenlWYWx1ZS5kZXN0cm95KCk7XG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZSB0aGlzLmVsLl9fbGlzdGVuZXJzO1xuICAgICAgZGVsZXRlIHRoaXMuZWwuX19ldmVudHM7XG4gICAgICBkZWxldGUgdGhpcy4kZWw7XG4gICAgICBkZWxldGUgdGhpcy5lbDtcbiAgICB9XG5cbiAgLy8gQ2xlYW4gdXAgSG9vayBjYWxsYmFjayByZWZlcmVuY2VzXG4gICAgZGVsZXRlIHRoaXMuX19vYnNlcnZlcnM7XG5cbiAgLy8gTWFyayBhcyBkZWluaXRpYWxpemVkIHNvIHdlIGRvbid0IGxvb3Agb24gY3ljbGljIGRlcGVuZGFuY2llcy5cbiAgICB0aGlzLmRlaW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gIC8vIERlc3Ryb3kgYWxsIGNoaWxkcmVuIG9mIHRoaXMgZGF0YSBvYmplY3QuXG4gIC8vIElmIGEgQ29sbGVjdGlvbiwgZGUtaW5pdCBhbGwgb2YgaXRzIE1vZGVscywgaWYgYSBNb2RlbCwgZGUtaW5pdCBhbGwgb2YgaXRzXG4gIC8vIEF0dHJpYnV0ZXMsIGlmIGEgQ29tcHV0ZWQgUHJvcGVydHksIGRlLWluaXQgaXRzIENhY2hlIG9iamVjdHMuXG4gICAgXy5lYWNoKHRoaXMubW9kZWxzLCBmdW5jdGlvbiAodmFsKSB7IHZhbCAmJiB2YWwuZGVpbml0aWFsaXplICYmIHZhbC5kZWluaXRpYWxpemUoKTsgfSk7XG4gICAgXy5lYWNoKHRoaXMuYXR0cmlidXRlcywgZnVuY3Rpb24gKHZhbCkgeyB2YWwgJiYgdmFsLmRlaW5pdGlhbGl6ZSAmJiB2YWwuZGVpbml0aWFsaXplKCk7fSk7XG4gICAgdGhpcy5jYWNoZSAmJiB0aGlzLmNhY2hlLmNvbGxlY3Rpb24uZGVpbml0aWFsaXplKCk7XG4gICAgdGhpcy5jYWNoZSAmJiB0aGlzLmNhY2hlLm1vZGVsLmRlaW5pdGlhbGl6ZSgpO1xuXG4gIH1cbn07XG5cbi8vIEV4dGVuZCBhbGwgb2YgdGhlICoqUmVib3VuZCBEYXRhKiogcHJvdG90eXBlcyB3aXRoIHRoZXNlIHNoYXJlZCBtZXRob2RzXG5fLmV4dGVuZChNb2RlbC5wcm90b3R5cGUsIHNoYXJlZE1ldGhvZHMpO1xuXy5leHRlbmQoQ29sbGVjdGlvbi5wcm90b3R5cGUsIHNoYXJlZE1ldGhvZHMpO1xuXy5leHRlbmQoQ29tcHV0ZWRQcm9wZXJ0eS5wcm90b3R5cGUsIHNoYXJlZE1ldGhvZHMpO1xuXG5leHBvcnQgeyBNb2RlbCwgQ29sbGVjdGlvbiwgQ29tcHV0ZWRQcm9wZXJ0eSB9O1xuIiwiLy8gUmVib3VuZCBVdGlsc1xuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgJCA9IGZ1bmN0aW9uKHF1ZXJ5KXtcbiAgcmV0dXJuIG5ldyB1dGlscyhxdWVyeSk7XG59O1xuXG52YXIgdXRpbHMgPSBmdW5jdGlvbihxdWVyeSl7XG4gIHZhciBpLCBzZWxlY3RvciA9IF8uaXNFbGVtZW50KHF1ZXJ5KSAmJiBbcXVlcnldIHx8IChxdWVyeSA9PT0gZG9jdW1lbnQpICYmIFtkb2N1bWVudF0gfHwgXy5pc1N0cmluZyhxdWVyeSkgJiYgcXVlcnlTZWxlY3RvckFsbChxdWVyeSkgfHwgW107XG4gIHRoaXMubGVuZ3RoID0gc2VsZWN0b3IubGVuZ3RoO1xuXG4gIC8vIEFkZCBzZWxlY3RvciB0byBvYmplY3QgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICBmb3IgKGk9MDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSBzZWxlY3RvcltpXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gcmV0dXJuRmFsc2UoKXtyZXR1cm4gZmFsc2U7fVxuZnVuY3Rpb24gcmV0dXJuVHJ1ZSgpe3JldHVybiB0cnVlO31cblxuJC5FdmVudCA9IGZ1bmN0aW9uKCBzcmMsIHByb3BzICkge1xuXHQvLyBBbGxvdyBpbnN0YW50aWF0aW9uIHdpdGhvdXQgdGhlICduZXcnIGtleXdvcmRcblx0aWYgKCAhKHRoaXMgaW5zdGFuY2VvZiAkLkV2ZW50KSApIHtcblx0XHRyZXR1cm4gbmV3ICQuRXZlbnQoIHNyYywgcHJvcHMgKTtcblx0fVxuXG5cdC8vIEV2ZW50IG9iamVjdFxuXHRpZiAoIHNyYyAmJiBzcmMudHlwZSApIHtcblx0XHR0aGlzLm9yaWdpbmFsRXZlbnQgPSBzcmM7XG5cdFx0dGhpcy50eXBlID0gc3JjLnR5cGU7XG5cblx0XHQvLyBFdmVudHMgYnViYmxpbmcgdXAgdGhlIGRvY3VtZW50IG1heSBoYXZlIGJlZW4gbWFya2VkIGFzIHByZXZlbnRlZFxuXHRcdC8vIGJ5IGEgaGFuZGxlciBsb3dlciBkb3duIHRoZSB0cmVlOyByZWZsZWN0IHRoZSBjb3JyZWN0IHZhbHVlLlxuXHRcdHRoaXMuaXNEZWZhdWx0UHJldmVudGVkID0gc3JjLmRlZmF1bHRQcmV2ZW50ZWQgfHxcblx0XHRcdFx0c3JjLmRlZmF1bHRQcmV2ZW50ZWQgPT09IHVuZGVmaW5lZCAmJlxuXHRcdFx0XHQvLyBTdXBwb3J0OiBBbmRyb2lkPDQuMFxuXHRcdFx0XHRzcmMucmV0dXJuVmFsdWUgPT09IGZhbHNlID9cblx0XHRcdHJldHVyblRydWUgOlxuXHRcdFx0cmV0dXJuRmFsc2U7XG5cblx0Ly8gRXZlbnQgdHlwZVxuXHR9IGVsc2Uge1xuXHRcdHRoaXMudHlwZSA9IHNyYztcblx0fVxuXG5cdC8vIFB1dCBleHBsaWNpdGx5IHByb3ZpZGVkIHByb3BlcnRpZXMgb250byB0aGUgZXZlbnQgb2JqZWN0XG5cdGlmICggcHJvcHMgKSB7XG5cdFx0Xy5leHRlbmQoIHRoaXMsIHByb3BzICk7XG5cdH1cblxuICAvLyBDb3B5IG92ZXIgYWxsIG9yaWdpbmFsIGV2ZW50IHByb3BlcnRpZXNcbiAgXy5leHRlbmQodGhpcywgXy5waWNrKCB0aGlzLm9yaWdpbmFsRXZlbnQsIFtcbiAgICAgIFwiYWx0S2V5XCIsIFwiYnViYmxlc1wiLCBcImNhbmNlbGFibGVcIiwgXCJjdHJsS2V5XCIsIFwiY3VycmVudFRhcmdldFwiLCBcImV2ZW50UGhhc2VcIixcbiAgICAgIFwibWV0YUtleVwiLCBcInJlbGF0ZWRUYXJnZXRcIiwgXCJzaGlmdEtleVwiLCBcInRhcmdldFwiLCBcInRpbWVTdGFtcFwiLCBcInZpZXdcIixcbiAgICAgIFwid2hpY2hcIiwgXCJjaGFyXCIsIFwiY2hhckNvZGVcIiwgXCJrZXlcIiwgXCJrZXlDb2RlXCIsIFwiYnV0dG9uXCIsIFwiYnV0dG9uc1wiLFxuICAgICAgXCJjbGllbnRYXCIsIFwiY2xpZW50WVwiLCBcIlwiLCBcIm9mZnNldFhcIiwgXCJvZmZzZXRZXCIsIFwicGFnZVhcIiwgXCJwYWdlWVwiLCBcInNjcmVlblhcIixcbiAgICAgIFwic2NyZWVuWVwiLCBcInRvRWxlbWVudFwiXG4gICAgXSkpO1xuXG5cdC8vIENyZWF0ZSBhIHRpbWVzdGFtcCBpZiBpbmNvbWluZyBldmVudCBkb2Vzbid0IGhhdmUgb25lXG5cdHRoaXMudGltZVN0YW1wID0gc3JjICYmIHNyYy50aW1lU3RhbXAgfHwgKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcblxuXHQvLyBNYXJrIGl0IGFzIGZpeGVkXG5cdHRoaXMuaXNFdmVudCA9IHRydWU7XG59O1xuXG4kLkV2ZW50LnByb3RvdHlwZSA9IHtcblx0Y29uc3RydWN0b3I6ICQuRXZlbnQsXG5cdGlzRGVmYXVsdFByZXZlbnRlZDogcmV0dXJuRmFsc2UsXG5cdGlzUHJvcGFnYXRpb25TdG9wcGVkOiByZXR1cm5GYWxzZSxcblx0aXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQ6IHJldHVybkZhbHNlLFxuXG5cdHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZSA9IHRoaXMub3JpZ2luYWxFdmVudDtcblxuXHRcdHRoaXMuaXNEZWZhdWx0UHJldmVudGVkID0gcmV0dXJuVHJ1ZTtcblxuXHRcdGlmICggZSAmJiBlLnByZXZlbnREZWZhdWx0ICkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblx0fSxcblx0c3RvcFByb3BhZ2F0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZSA9IHRoaXMub3JpZ2luYWxFdmVudDtcblxuXHRcdHRoaXMuaXNQcm9wYWdhdGlvblN0b3BwZWQgPSByZXR1cm5UcnVlO1xuXG5cdFx0aWYgKCBlICYmIGUuc3RvcFByb3BhZ2F0aW9uICkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9XG5cdH0sXG5cdHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGUgPSB0aGlzLm9yaWdpbmFsRXZlbnQ7XG5cblx0XHR0aGlzLmlzSW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gcmV0dXJuVHJ1ZTtcblxuXHRcdGlmICggZSAmJiBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiApIHtcblx0XHRcdGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5zdG9wUHJvcGFnYXRpb24oKTtcblx0fVxufTtcblxuXG51dGlscy5wcm90b3R5cGUgPSB7XG5cbiAgLy8gR2l2ZW4gYSB2YWxpZCBkYXRhIHBhdGgsIHNwbGl0IGl0IGludG8gYW4gYXJyYXkgb2YgaXRzIHBhcnRzLlxuICAvLyBleDogZm9vLmJhclswXS5iYXogLS0+IFsnZm9vJywgJ3ZhcicsICcwJywgJ2JheiddXG4gIHNwbGl0UGF0aDogZnVuY3Rpb24ocGF0aCl7XG4gICAgcGF0aCA9ICgnLicrcGF0aCsnLicpLnNwbGl0KC8oPzpcXC58XFxbfFxcXSkrLyk7XG4gICAgcGF0aC5wb3AoKTtcbiAgICBwYXRoLnNoaWZ0KCk7XG4gICAgcmV0dXJuIHBhdGg7XG4gIH0sXG5cbiAgLy8gQXBwbGllcyBmdW5jdGlvbiBgZnVuY2AgZGVwdGggZmlyc3QgdG8gZXZlcnkgbm9kZSBpbiB0aGUgc3VidHJlZSBzdGFydGluZyBmcm9tIGByb290YFxuICB3YWxrVGhlRE9NOiBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIGVsLCByb290LCBsZW4gPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZShsZW4tLSl7XG4gICAgICByb290ID0gdGhpc1tsZW5dO1xuICAgICAgZnVuYyhyb290KTtcbiAgICAgIHJvb3QgPSByb290LmZpcnN0Q2hpbGQ7XG4gICAgICB3aGlsZSAocm9vdCkge1xuICAgICAgICAgICQocm9vdCkud2Fsa1RoZURPTShmdW5jKTtcbiAgICAgICAgICByb290ID0gcm9vdC5uZXh0U2libGluZztcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gRXZlbnRzIHJlZ2lzdHJ5LiBBbiBvYmplY3QgY29udGFpbmluZyBhbGwgZXZlbnRzIGJvdW5kIHRocm91Z2ggdGhpcyB1dGlsIHNoYXJlZCBhbW9uZyBhbGwgaW5zdGFuY2VzLlxuICBfZXZlbnRzOiB7fSxcblxuICAvLyBUYWtlcyB0aGUgdGFyZ2VkIHRoZSBldmVudCBmaXJlZCBvbiBhbmQgcmV0dXJucyBhbGwgY2FsbGJhY2tzIGZvciB0aGUgZGVsZWdhdGVkIGVsZW1lbnRcbiAgX2hhc0RlbGVnYXRlOiBmdW5jdGlvbih0YXJnZXQsIGRlbGVnYXRlLCBldmVudFR5cGUpe1xuICAgIHZhciBjYWxsYmFja3MgPSBbXTtcblxuICAgIC8vIEdldCBvdXIgY2FsbGJhY2tzXG4gICAgaWYodGFyZ2V0LmRlbGVnYXRlR3JvdXAgJiYgdGhpcy5fZXZlbnRzW3RhcmdldC5kZWxlZ2F0ZUdyb3VwXVtldmVudFR5cGVdKXtcbiAgICAgIF8uZWFjaCh0aGlzLl9ldmVudHNbdGFyZ2V0LmRlbGVnYXRlR3JvdXBdW2V2ZW50VHlwZV0sIGZ1bmN0aW9uKGNhbGxiYWNrc0xpc3QsIGRlbGVnYXRlSWQpe1xuICAgICAgICBpZihfLmlzQXJyYXkoY2FsbGJhY2tzTGlzdCkgJiYgKGRlbGVnYXRlSWQgPT09IGRlbGVnYXRlLmRlbGVnYXRlSWQgfHwgKCBkZWxlZ2F0ZS5tYXRjaGVzU2VsZWN0b3IgJiYgZGVsZWdhdGUubWF0Y2hlc1NlbGVjdG9yKGRlbGVnYXRlSWQpICkpICl7XG4gICAgICAgICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLmNvbmNhdChjYWxsYmFja3NMaXN0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhbGxiYWNrcztcbiAgfSxcblxuICAvLyBUcmlnZ2VycyBhbiBldmVudCBvbiBhIGdpdmVuIGRvbSBub2RlXG4gIHRyaWdnZXI6IGZ1bmN0aW9uKGV2ZW50TmFtZSwgb3B0aW9ucyl7XG4gICAgdmFyIGVsLCBsZW4gPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZShsZW4tLSl7XG4gICAgICBlbCA9IHRoaXNbbGVuXTtcbiAgICAgIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCkge1xuICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnSFRNTEV2ZW50cycpO1xuICAgICAgICBldmVudC5pbml0RXZlbnQoZXZlbnROYW1lLCB0cnVlLCBmYWxzZSk7XG4gICAgICAgIGVsLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwuZmlyZUV2ZW50KCdvbicrZXZlbnROYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgb2ZmOiBmdW5jdGlvbihldmVudFR5cGUsIGhhbmRsZXIpe1xuICAgIHZhciBlbCwgbGVuID0gdGhpcy5sZW5ndGgsIGV2ZW50Q291bnQ7XG5cbiAgICB3aGlsZShsZW4tLSl7XG5cbiAgICAgIGVsID0gdGhpc1tsZW5dO1xuICAgICAgZXZlbnRDb3VudCA9IDA7XG5cbiAgICAgIGlmKGVsLmRlbGVnYXRlR3JvdXApe1xuICAgICAgICBpZih0aGlzLl9ldmVudHNbZWwuZGVsZWdhdGVHcm91cF1bZXZlbnRUeXBlXSAmJiBfLmlzQXJyYXkodGhpcy5fZXZlbnRzW2VsLmRlbGVnYXRlR3JvdXBdW2V2ZW50VHlwZV1bZWwuZGVsZWdhdGVJZF0pKXtcbiAgICAgICAgICBfLmVhY2godGhpcy5fZXZlbnRzW2VsLmRlbGVnYXRlR3JvdXBdW2V2ZW50VHlwZV0sIGZ1bmN0aW9uKGRlbGVnYXRlLCBpbmRleCwgZGVsZWdhdGVMaXN0KXtcbiAgICAgICAgICAgIF8uZWFjaChkZWxlZ2F0ZUxpc3QsIGZ1bmN0aW9uKGNhbGxiYWNrLCBpbmRleCwgY2FsbGJhY2tMaXN0KXtcbiAgICAgICAgICAgICAgaWYoY2FsbGJhY2sgPT09IGhhbmRsZXIpe1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWxsYmFja0xpc3RbaW5kZXhdO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBldmVudENvdW50Kys7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gbW9yZSBvZiB0aGlzIGV2ZW50IHR5cGUgZGVsZWdhdGVkIGZvciB0aGlzIGdyb3VwLCByZW1vdmUgdGhlIGxpc3RlbmVyXG4gICAgICBpZiAoZXZlbnRDb3VudCA9PT0gMCAmJiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKXtcbiAgICAgICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIGlmIChldmVudENvdW50ID09PSAwICYmIGVsLmRldGFjaEV2ZW50KXtcbiAgICAgICAgZWwuZGV0YWNoRXZlbnQoJ29uJytldmVudFR5cGUsIGhhbmRsZXIpO1xuICAgICAgfVxuXG4gICAgfVxuICB9LFxuXG4gIG9uOiBmdW5jdGlvbiAoZXZlbnROYW1lLCBkZWxlZ2F0ZSwgZGF0YSwgaGFuZGxlcikge1xuICAgIHZhciBlbCxcbiAgICAgICAgZXZlbnRzID0gdGhpcy5fZXZlbnRzLFxuICAgICAgICBsZW4gPSB0aGlzLmxlbmd0aCxcbiAgICAgICAgZXZlbnROYW1lcyA9IGV2ZW50TmFtZS5zcGxpdCgnICcpLFxuICAgICAgICBkZWxlZ2F0ZUlkLCBkZWxlZ2F0ZUdyb3VwO1xuXG4gICAgd2hpbGUobGVuLS0pe1xuICAgICAgZWwgPSB0aGlzW2xlbl07XG5cbiAgICAgIC8vIE5vcm1hbGl6ZSBkYXRhIGlucHV0XG4gICAgICBpZihfLmlzRnVuY3Rpb24oZGVsZWdhdGUpKXtcbiAgICAgICAgaGFuZGxlciA9IGRlbGVnYXRlO1xuICAgICAgICBkZWxlZ2F0ZSA9IGVsO1xuICAgICAgICBkYXRhID0ge307XG4gICAgICB9XG4gICAgICBpZihfLmlzRnVuY3Rpb24oZGF0YSkpe1xuICAgICAgICBoYW5kbGVyID0gZGF0YTtcbiAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgfVxuICAgICAgaWYoIV8uaXNTdHJpbmcoZGVsZWdhdGUpICYmICFfLmlzRWxlbWVudChkZWxlZ2F0ZSkpe1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRGVsZWdhdGUgdmFsdWUgcGFzc2VkIHRvIFJlYm91bmQncyAkLm9uIGlzIG5laXRoZXIgYW4gZWxlbWVudCBvciBjc3Mgc2VsZWN0b3JcIik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZGVsZWdhdGVJZCA9IF8uaXNTdHJpbmcoZGVsZWdhdGUpID8gZGVsZWdhdGUgOiAoZGVsZWdhdGUuZGVsZWdhdGVJZCA9IGRlbGVnYXRlLmRlbGVnYXRlSWQgfHwgXy51bmlxdWVJZCgnZXZlbnQnKSk7XG4gICAgICBkZWxlZ2F0ZUdyb3VwID0gZWwuZGVsZWdhdGVHcm91cCA9IChlbC5kZWxlZ2F0ZUdyb3VwIHx8IF8udW5pcXVlSWQoJ2RlbGVnYXRlR3JvdXAnKSk7XG5cbiAgICAgIF8uZWFjaChldmVudE5hbWVzLCBmdW5jdGlvbihldmVudE5hbWUpe1xuXG4gICAgICAgIC8vIEVuc3VyZSBldmVudCBvYmogZXhpc3RhbmNlXG4gICAgICAgIGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXSA9IGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXSB8fCB7fTtcblxuICAgICAgICAvLyBUT0RPOiB0YWtlIG91dCBvZiBsb29wXG4gICAgICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgdmFyIHRhcmdldCwgaSwgbGVuLCBldmVudExpc3QsIGNhbGxiYWNrcywgY2FsbGJhY2ssIGZhbHN5O1xuICAgICAgICAgICAgICBldmVudCA9IG5ldyAkLkV2ZW50KChldmVudCB8fCB3aW5kb3cuZXZlbnQpKTsgLy8gQ29udmVydCB0byBtdXRhYmxlIGV2ZW50XG4gICAgICAgICAgICAgIHRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5zcmNFbGVtZW50O1xuXG4gICAgICAgICAgICAgIC8vIFRyYXZlbCBmcm9tIHRhcmdldCB1cCB0byBwYXJlbnQgZmlyaW5nIGV2ZW50IG9uIGRlbGVnYXRlIHdoZW4gaXQgZXhpenRzXG4gICAgICAgICAgICAgIHdoaWxlKHRhcmdldCl7XG5cbiAgICAgICAgICAgICAgICAvLyBHZXQgYWxsIHNwZWNpZmllZCBjYWxsYmFja3MgKGVsZW1lbnQgc3BlY2lmaWMgYW5kIHNlbGVjdG9yIHNwZWNpZmllZClcbiAgICAgICAgICAgICAgICBjYWxsYmFja3MgPSAkLl9oYXNEZWxlZ2F0ZShlbCwgdGFyZ2V0LCBldmVudC50eXBlKTtcblxuICAgICAgICAgICAgICAgIGxlbiA9IGNhbGxiYWNrcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yKGk9MDtpPGxlbjtpKyspe1xuICAgICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0ID0gZXZlbnQuc3JjRWxlbWVudCA9IHRhcmdldDsgICAgICAgICAgICAgICAvLyBBdHRhY2ggdGhpcyBsZXZlbCdzIHRhcmdldFxuICAgICAgICAgICAgICAgICAgZXZlbnQuZGF0YSA9IGNhbGxiYWNrc1tpXS5kYXRhOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBdHRhY2ggb3VyIGRhdGEgdG8gdGhlIGV2ZW50XG4gICAgICAgICAgICAgICAgICBldmVudC5yZXN1bHQgPSBjYWxsYmFja3NbaV0uY2FsbGJhY2suY2FsbChlbCwgZXZlbnQpOyAgIC8vIENhbGwgdGhlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICBmYWxzeSA9ICggZXZlbnQucmVzdWx0ID09PSBmYWxzZSApID8gdHJ1ZSA6IGZhbHN5OyAgICAgIC8vIElmIGFueSBjYWxsYmFjayByZXR1cm5zIGZhbHNlLCBsb2cgaXQgYXMgZmFsc3lcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJZiBhbnkgb2YgdGhlIGNhbGxiYWNrcyByZXR1cm5lZCBmYWxzZSwgcHJldmVudCBkZWZhdWx0IGFuZCBzdG9wIHByb3BhZ2F0aW9uXG4gICAgICAgICAgICAgICAgaWYoZmFsc3kpe1xuICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGV2ZW50IG9mIGl0cyB0eXBlLCBhZGQgdGhlIGV2ZW50IGhhbmRsZXJcbiAgICAgICAgLy8gQWRkRXZlbnRMaXN0ZW5lciBzdXBwb3J0cyBJRTkrXG4gICAgICAgIGlmKCFldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXSl7XG4gICAgICAgICAgLy8gSWYgZXZlbnQgaXMgZm9jdXMgb3IgYmx1ciwgdXNlIGNhcHR1cmUgdG8gYWxsb3cgZm9yIGV2ZW50IGRlbGVnYXRpb24uXG4gICAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrLCAoZXZlbnROYW1lID09PSAnZm9jdXMnIHx8IGV2ZW50TmFtZSA9PT0gJ2JsdXInKSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIEFkZCBvdXIgbGlzdGVuZXJcbiAgICAgICAgZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV0gPSBldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXSB8fCB7fTtcbiAgICAgICAgZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV1bZGVsZWdhdGVJZF0gPSBldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXVtkZWxlZ2F0ZUlkXSB8fCBbXTtcbiAgICAgICAgZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV1bZGVsZWdhdGVJZF0ucHVzaCh7Y2FsbGJhY2s6IGhhbmRsZXIsIGRhdGE6IGRhdGF9KTtcblxuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuICB9LFxuXG4gIGZsYXR0ZW46IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZnVuY3Rpb24gcmVjdXJzZSAoY3VyLCBwcm9wKSB7XG4gICAgICBpZiAoT2JqZWN0KGN1cikgIT09IGN1cikge1xuICAgICAgICByZXN1bHRbcHJvcF0gPSBjdXI7XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoY3VyKSkge1xuICAgICAgICBmb3IodmFyIGk9MCwgbD1jdXIubGVuZ3RoOyBpPGw7IGkrKylcbiAgICAgICAgICByZWN1cnNlKGN1cltpXSwgcHJvcCArIFwiW1wiICsgaSArIFwiXVwiKTtcbiAgICAgICAgICBpZiAobCA9PT0gMClcbiAgICAgICAgICAgIHJlc3VsdFtwcm9wXSA9IFtdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaXNFbXB0eSA9IHRydWU7XG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIGN1cikge1xuICAgICAgICAgICAgICBpc0VtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICAgIHJlY3Vyc2UoY3VyW3BdLCBwcm9wID8gcHJvcCtcIi5cIitwIDogcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNFbXB0eSAmJiBwcm9wKVxuICAgICAgICAgICAgICByZXN1bHRbcHJvcF0gPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmVjdXJzZShkYXRhLCBcIlwiKTtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gIC8vIGh0dHA6Ly9rcmFzaW1pcnRzb25ldi5jb20vYmxvZy9hcnRpY2xlL0Nyb3NzLWJyb3dzZXItaGFuZGxpbmctb2YtQWpheC1yZXF1ZXN0cy1pbi1hYnN1cmRqc1xuICBhamF4OiBmdW5jdGlvbihvcHMpIHtcbiAgICAgIGlmKHR5cGVvZiBvcHMgPT0gJ3N0cmluZycpIG9wcyA9IHsgdXJsOiBvcHMgfTtcbiAgICAgIG9wcy51cmwgPSBvcHMudXJsIHx8ICcnO1xuICAgICAgb3BzLmpzb24gPSBvcHMuanNvbiB8fCB0cnVlO1xuICAgICAgb3BzLm1ldGhvZCA9IG9wcy5tZXRob2QgfHwgJ2dldCc7XG4gICAgICBvcHMuZGF0YSA9IG9wcy5kYXRhIHx8IHt9O1xuICAgICAgdmFyIGdldFBhcmFtcyA9IGZ1bmN0aW9uKGRhdGEsIHVybCkge1xuICAgICAgICAgIHZhciBhcnIgPSBbXSwgc3RyO1xuICAgICAgICAgIGZvcih2YXIgbmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgIGFyci5wdXNoKG5hbWUgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoZGF0YVtuYW1lXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdHIgPSBhcnIuam9pbignJicpO1xuICAgICAgICAgIGlmKHN0ciAhPT0gJycpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHVybCA/ICh1cmwuaW5kZXhPZignPycpIDwgMCA/ICc/JyArIHN0ciA6ICcmJyArIHN0cikgOiBzdHI7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgIH07XG4gICAgICB2YXIgYXBpID0ge1xuICAgICAgICAgIGhvc3Q6IHt9LFxuICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG9wcykge1xuICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgIHRoaXMueGhyID0gbnVsbDtcbiAgICAgICAgICAgICAgaWYod2luZG93LkFjdGl2ZVhPYmplY3QpIHsgdGhpcy54aHIgPSBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTsgfVxuICAgICAgICAgICAgICBlbHNlIGlmKHdpbmRvdy5YTUxIdHRwUmVxdWVzdCkgeyB0aGlzLnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpOyB9XG4gICAgICAgICAgICAgIGlmKHRoaXMueGhyKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLnhoci5yZWFkeVN0YXRlID09IDQgJiYgc2VsZi54aHIuc3RhdHVzID09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gc2VsZi54aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZihvcHMuanNvbiA9PT0gdHJ1ZSAmJiB0eXBlb2YgSlNPTiAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZG9uZUNhbGxiYWNrICYmIHNlbGYuZG9uZUNhbGxiYWNrLmFwcGx5KHNlbGYuaG9zdCwgW3Jlc3VsdCwgc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3BzLnN1Y2Nlc3MgJiYgb3BzLnN1Y2Nlc3MuYXBwbHkoc2VsZi5ob3N0LCBbcmVzdWx0LCBzZWxmLnhocl0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihzZWxmLnhoci5yZWFkeVN0YXRlID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mYWlsQ2FsbGJhY2sgJiYgc2VsZi5mYWlsQ2FsbGJhY2suYXBwbHkoc2VsZi5ob3N0LCBbc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3BzLmVycm9yICYmIG9wcy5lcnJvci5hcHBseShzZWxmLmhvc3QsIFtzZWxmLnhocl0pO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBzZWxmLmFsd2F5c0NhbGxiYWNrICYmIHNlbGYuYWx3YXlzQ2FsbGJhY2suYXBwbHkoc2VsZi5ob3N0LCBbc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICBvcHMuY29tcGxldGUgJiYgb3BzLmNvbXBsZXRlLmFwcGx5KHNlbGYuaG9zdCwgW3NlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKG9wcy5tZXRob2QgPT0gJ2dldCcpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMueGhyLm9wZW4oXCJHRVRcIiwgb3BzLnVybCArIGdldFBhcmFtcyhvcHMuZGF0YSwgb3BzLnVybCksIHRydWUpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXJzKHtcbiAgICAgICAgICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLVdpdGgnOiAnWE1MSHR0cFJlcXVlc3QnXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMueGhyLm9wZW4ob3BzLm1ldGhvZCwgb3BzLnVybCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLnNldEhlYWRlcnMoe1xuICAgICAgICAgICAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAnQ29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKG9wcy5oZWFkZXJzICYmIHR5cGVvZiBvcHMuaGVhZGVycyA9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXJzKG9wcy5oZWFkZXJzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgb3BzLm1ldGhvZCA9PSAnZ2V0JyA/IHNlbGYueGhyLnNlbmQoKSA6IHNlbGYueGhyLnNlbmQoZ2V0UGFyYW1zKG9wcy5kYXRhKSk7XG4gICAgICAgICAgICAgIH0sIDIwKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMueGhyO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZG9uZTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgdGhpcy5kb25lQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBmYWlsOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICB0aGlzLmZhaWxDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFsd2F5czogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgdGhpcy5hbHdheXNDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldEhlYWRlcnM6IGZ1bmN0aW9uKGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgZm9yKHZhciBuYW1lIGluIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMueGhyICYmIHRoaXMueGhyLnNldFJlcXVlc3RIZWFkZXIobmFtZSwgaGVhZGVyc1tuYW1lXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGFwaS5wcm9jZXNzKG9wcyk7XG4gIH1cbn07XG5cbl8uZXh0ZW5kKCQsIHV0aWxzLnByb3RvdHlwZSk7XG5cblxuXG5leHBvcnQgZGVmYXVsdCAkO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
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
