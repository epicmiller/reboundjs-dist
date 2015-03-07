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

      if (listening && _.indexOf(terminators, token.type.type) > -1 || _.indexOf(terminators, token.value) > -1) {
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

      var absoluteUrl = new RegExp("^(?:[a-z]+:)?//", "i"),
          router = this;

      // Convert our routeMappings to regexps and push to our handlers
      _.each(this.config.routeMapping, function (value, route) {
        if (!_.isRegExp(route)) route = router._routeToRegExp(route);
        router.config.handlers.unshift({ route: route, primaryRoute: value });
      }, this);

      // Navigate to route for any link with a relative href
      $(document).on("click", "a", function (e) {
        var path = e.target.getAttribute("href");

        // If path is not an absolute url, or blank, try and navigate to that route.
        if (path !== "#" && path !== "" && !absoluteUrl.test(path)) {
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
          console.log(this.defaults, this);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByb3BlcnR5LWNvbXBpbGVyL3Byb3BlcnR5LWNvbXBpbGVyLmpzIiwicmVib3VuZC1jb21waWxlci9yZWJvdW5kLWNvbXBpbGVyLmpzIiwicmVib3VuZC1jb21wb25lbnQvY29tcG9uZW50LmpzIiwicmVib3VuZC1kYXRhL2NvbGxlY3Rpb24uanMiLCJyZWJvdW5kLXByZWNvbXBpbGVyL3JlYm91bmQtcHJlY29tcGlsZXIuanMiLCJyZWJvdW5kLXJvdXRlci9yZWJvdW5kLXJvdXRlci5qcyIsInJ1bnRpbWUuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9oZWxwZXJzLmpzIiwicmVib3VuZC1kYXRhL2NvbXB1dGVkLXByb3BlcnR5LmpzIiwicHJvcGVydHktY29tcGlsZXIvdG9rZW5pemVyLmpzIiwicmVib3VuZC1jb21wb25lbnQvaG9va3MuanMiLCJyZWJvdW5kLWRhdGEvbW9kZWwuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9sYXp5LXZhbHVlLmpzIiwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YS5qcyIsInJlYm91bmQtY29tcG9uZW50L3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztNQUdPLFNBQVM7O0FBRWhCLE1BQUksa0JBQWtCLEdBQUcsRUFBRSxDQUFDOzs7O0FBSTVCLFdBQVMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUIsUUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDOztBQUVoQixRQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDOztBQUV2QyxRQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFOztBQUNyQixhQUFTLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFDbkMsTUFBTSxHQUFHLEVBQUU7UUFDWCxLQUFLO1FBQ0wsYUFBYSxHQUFHLEVBQUU7UUFDbEIsVUFBVSxHQUFHLEVBQUU7UUFDZixPQUFPLEdBQUcsRUFBRTtRQUNaLEtBQUssR0FBRyxLQUFLO1FBQ2IsU0FBUyxHQUFHLENBQUM7UUFDYixjQUFjLEdBQUcsQ0FBQztRQUNsQixZQUFZLEdBQUcsRUFBRTtRQUNqQixJQUFJO1FBQ0osS0FBSyxHQUFHLEVBQUU7UUFDVixJQUFJO1FBQ0osT0FBTztRQUNQLEtBQUssR0FBRyxFQUFFO1FBQ1YsV0FBVyxHQUFHLEVBQUU7UUFDaEIsV0FBVyxHQUFHLENBQUMsR0FBRyxFQUFDLEdBQUcsRUFBQyxJQUFJLEVBQUMsR0FBRyxFQUFDLEdBQUcsRUFBQyxJQUFJLEVBQUMsSUFBSSxFQUFDLEtBQUssRUFBQyxLQUFLLEVBQUMsSUFBSSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNqSCxPQUFFO0FBRUEsV0FBSyxHQUFHLFNBQVMsRUFBRSxDQUFDOztBQUVwQixVQUFHLEtBQUssQ0FBQyxLQUFLLEtBQUssTUFBTSxFQUFDO0FBQ3hCLGlCQUFTLEVBQUUsQ0FBQztBQUNaLG1CQUFXLEdBQUcsRUFBRSxDQUFDO09BQ2xCOzs7QUFHRCxVQUFHLEtBQUssQ0FBQyxLQUFLLEtBQUssS0FBSyxFQUFDO0FBQ3ZCLFlBQUksR0FBRyxTQUFTLEVBQUUsQ0FBQztBQUNuQixlQUFNLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFDO0FBQzlCLGNBQUksR0FBRyxTQUFTLEVBQUUsQ0FBQztTQUNwQjs7O0FBR0QsbUJBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQztPQUM5RTs7QUFFRCxVQUFHLEtBQUssQ0FBQyxLQUFLLEtBQUssT0FBTyxFQUFDO0FBQ3pCLFlBQUksR0FBRyxTQUFTLEVBQUUsQ0FBQztBQUNuQixlQUFNLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFDO0FBQzlCLGNBQUksR0FBRyxTQUFTLEVBQUUsQ0FBQztTQUNwQjs7QUFFRCxtQkFBVyxDQUFDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO09BQ3pDOztBQUVELFVBQUcsS0FBSyxDQUFDLEtBQUssS0FBSyxPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxRQUFRLEVBQUM7QUFDaEYsWUFBSSxHQUFHLFNBQVMsRUFBRSxDQUFDO0FBQ25CLFlBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEtBQUssR0FBRyxFQUFFLFdBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7T0FDdEQ7O0FBRUQsVUFBRyxLQUFLLENBQUMsS0FBSyxLQUFLLElBQUksRUFBQztBQUV0QixZQUFJLEdBQUcsU0FBUyxFQUFFLENBQUM7QUFDbkIsZUFBTSxDQUFDLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBQztBQUM5QixjQUFJLEdBQUcsU0FBUyxFQUFFLENBQUM7U0FDcEI7OztBQUdELG1CQUFXLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO09BRTNCOztBQUVELFVBQUcsS0FBSyxDQUFDLEtBQUssS0FBSyxPQUFPLElBQUksS0FBSyxDQUFDLEtBQUssS0FBSyxXQUFXLEVBQUM7QUFDeEQsbUJBQVcsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDMUIsWUFBSSxHQUFHLFNBQVMsRUFBRSxDQUFDO0FBQ25CLGFBQUssR0FBRyxFQUFFLENBQUM7QUFDWCxZQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDWixlQUFNLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLEdBQUcsRUFBQztBQUMzQixjQUFHLElBQUksQ0FBQyxLQUFLLEVBQUM7QUFDWixnQkFBRyxHQUFHLEdBQUMsQ0FBQyxLQUFLLENBQUMsRUFBQztBQUNiLG1CQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUN4QjtBQUNELGVBQUcsRUFBRSxDQUFDO1dBQ1A7QUFDRCxjQUFJLEdBQUcsU0FBUyxFQUFFLENBQUM7U0FDcEI7QUFDRCxtQkFBVyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztPQUN6Qjs7QUFFRCxVQUFHLFNBQVMsSUFBSSxDQUFDLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBQztBQUN2RyxtQkFBVyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsV0FBVyxFQUFFLFVBQVMsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN2RCxjQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDakIsZUFBSyxHQUFHLEFBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDO0FBQzlDLFdBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLFVBQVMsSUFBSSxFQUFDO0FBQzFCLGFBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLFVBQVMsR0FBRyxFQUFDO0FBQ3hCLHFCQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ25FLENBQUMsQ0FBQztXQUNKLENBQUMsQ0FBQztBQUNILGlCQUFPLE9BQU8sQ0FBQztTQUNoQixFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUNULHFCQUFhLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDO0FBQy9ELG1CQUFXLEdBQUcsRUFBRSxDQUFDO0FBQ2pCLGlCQUFTLEVBQUUsQ0FBQztPQUNiO0tBRUYsUUFBTyxLQUFLLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxHQUFHLEVBQUU7O0FBRW5DLFdBQU8sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLHlDQUF5QyxFQUFFLGFBQWEsQ0FBQyxDQUFDOzs7QUFHakcsV0FBTyxJQUFJLENBQUMsUUFBUSxHQUFHLGFBQWEsQ0FBQztHQUV0Qzs7bUJBRWMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFOzs7Ozs7OztNQ3JIZixlQUFlLDZCQUExQixPQUFPO01BQW9DLG1CQUFtQiw2QkFBbEMsV0FBVztNQUN2QyxLQUFLLDRCQUFMLEtBQUs7TUFDUCxTQUFTOztNQUNULE9BQU87O01BQ1AsS0FBSzs7QUFFWixXQUFTLE9BQU8sQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFDOztBQUUvQixXQUFPLEdBQUcsT0FBTyxJQUFJLEVBQUUsQ0FBQztBQUN4QixXQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDO0FBQ3hDLFdBQU8sQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUM7OztBQUdwQyxXQUFPLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ2xELFdBQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7OztBQUc1QyxRQUFJLElBQUksR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFO0FBQ2pDLGFBQU8sRUFBRSxPQUFPLENBQUMsT0FBTztBQUN4QixXQUFLLEVBQUUsT0FBTyxDQUFDLEtBQUs7S0FDckIsQ0FBQyxDQUFDOztBQUVILFFBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQzs7O0FBRzNCLFFBQUksQ0FBQyxNQUFNLEdBQUcsVUFBUyxJQUFJLEVBQUUsR0FBRyxFQUFFLE9BQU8sRUFBQzs7QUFFeEMsU0FBRyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUM7QUFDaEIsU0FBRyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztBQUNoQyxTQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO0FBQzVCLFNBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxJQUFJLFNBQVMsRUFBRSxDQUFDOzs7QUFHckMsU0FBRyxDQUFDLE9BQU8sR0FBRyxLQUFLLENBQUMsT0FBTyxFQUFFLEdBQUcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUMxQyxTQUFHLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDOzs7QUFHcEMsYUFBTyxHQUFHLE9BQU8sSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDOzs7QUFHbkMsYUFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FDekMsQ0FBQzs7QUFFRixXQUFPLENBQUMsZUFBZSxDQUFFLE9BQU8sQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRTdDLFdBQU8sSUFBSSxDQUFDO0dBRWI7O1VBRVEsT0FBTyxHQUFQLE9BQU87Ozs7Ozs7O01DakRULFNBQVM7O01BQ1QsS0FBSzs7TUFDTCxPQUFPOztNQUNQLENBQUM7O01BQ0MsS0FBSywyQkFBTCxLQUFLOzs7O0FBR2QsTUFBRyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsTUFBTSxtREFBbUQsQ0FBQzs7O0FBRy9FLFdBQVMsVUFBVSxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUM7QUFDNUIsUUFBRyxHQUFHLEtBQUssSUFBSSxFQUFFLE9BQU8sSUFBSSxDQUFDO0FBQzdCLFdBQU8sR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLEdBQUMsR0FBRyxDQUFDO0dBQ3JEOztBQUVELFdBQVMsY0FBYyxHQUFFO0FBQ3ZCLFFBQUksQ0FBQyxHQUFHLENBQUM7UUFBRSxHQUFHLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFDdkMsV0FBTyxJQUFJLENBQUMsY0FBYyxDQUFDO0FBQzNCLFNBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQ2hCLFVBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsTUFBTSxFQUFFLENBQUM7S0FDakM7QUFDRCxRQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7R0FDM0I7O0FBRUQsTUFBSSxHQUFHLEdBQUc7QUFDUixXQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU87QUFDeEIsU0FBSyxFQUFFLEtBQUs7R0FDYixDQUFDOztBQUVGLEtBQUcsQ0FBQyxPQUFPLEdBQUcsU0FBUyxPQUFPLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBQzs7QUFFM0MsV0FBTyxVQUFTLElBQUksRUFBRSxPQUFPLEVBQUM7O0FBRTVCLFVBQUksR0FBRyxHQUFHLE9BQU8sSUFBSSxFQUFFO1VBQ25CLGNBQWMsR0FBRyxJQUFJLENBQUMsRUFBRSxJQUFJLFFBQVEsQ0FBQyxJQUFJLENBQUM7QUFDOUMsU0FBRyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztBQUNoQyxTQUFHLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLElBQUksRUFBRSxDQUFDO0FBQzVCLFNBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsSUFBSSxJQUFJLFNBQVMsRUFBRSxDQUFDOzs7QUFHckMsU0FBRyxDQUFDLE9BQU8sR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZELFNBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDOzs7QUFHekMsYUFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsY0FBYyxDQUFDLENBQUM7S0FDL0MsQ0FBQztHQUNILENBQUM7OztBQUdGLE1BQUksU0FBUyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7O0FBRTNCLGVBQVcsRUFBRSxJQUFJOztBQUVqQixlQUFXLEVBQUUsVUFBUyxPQUFPLEVBQUM7QUFDNUIsYUFBTyxHQUFHLE9BQU8sS0FBSyxPQUFPLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUNwQyxPQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3JDLFVBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNuQyxVQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQztBQUNyQixVQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNsQixVQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNsQixVQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ3ZDLFVBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7OztBQU0zQyxVQUFJLENBQUMsR0FBRyxDQUFFLElBQUksQ0FBQyxRQUFRLElBQUksRUFBRSxFQUFHLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7QUFDbEQsVUFBSSxDQUFDLEdBQUcsQ0FBRSxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBRSxDQUFDOzs7QUFHL0IsVUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLENBQUM7Ozs7QUFJeEQsVUFBSSxDQUFDLE1BQU0sR0FBSSxDQUFDLENBQUMsUUFBUSxDQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRSxFQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFL0QsT0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVMsS0FBSyxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUM7QUFDNUMsWUFBRyxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUM7QUFBRSxnQkFBTSxxQ0FBcUMsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLDhCQUE4QixDQUFFO1NBQUU7QUFDN0gsWUFBRyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBQztBQUFFLGdCQUFNLG9CQUFvQixHQUFDLEtBQUssR0FBQywwQkFBMEIsR0FBRyxJQUFJLENBQUMsTUFBTSxHQUFHLGFBQWEsQ0FBRTtTQUFFO09BQ2xILEVBQUUsSUFBSSxDQUFDLENBQUM7Ozs7QUFJVCxVQUFJLENBQUMsRUFBRSxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksU0FBUyxDQUFDO0FBQ3RDLFVBQUksQ0FBQyxHQUFHLEdBQUcsQUFBQyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQzs7QUFFbkYsVUFBRyxDQUFDLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBQztBQUNwQyxZQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztPQUNqQzs7OztBQUlELFVBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBQztBQUFFLGNBQU0sNkJBQTZCLEdBQUcsSUFBSSxDQUFDLE1BQU0sR0FBRyxhQUFhLENBQUU7T0FBRTtBQUM5RyxVQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQztBQUNsRCxVQUFJLENBQUMsUUFBUSxHQUFHLEFBQUMsT0FBTyxJQUFJLENBQUMsUUFBUSxLQUFLLFFBQVEsR0FBSSxHQUFHLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDOzs7O0FBSWpHLFVBQUksQ0FBQyxFQUFFLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxPQUFPLEVBQUMsRUFBRSxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQzs7QUFFM0UsVUFBSSxDQUFDLFVBQVUsRUFBRSxDQUFDO0tBRW5COztBQUVELEtBQUMsRUFBRSxVQUFTLFFBQVEsRUFBRTtBQUNwQixVQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBQztBQUNYLGVBQU8sT0FBTyxDQUFDLEtBQUssQ0FBQywwQ0FBMEMsQ0FBQyxDQUFDO09BQ2xFO0FBQ0QsYUFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUNoQzs7O0FBR0QsV0FBTyxFQUFFLFVBQVMsU0FBUyxFQUFDO0FBQzFCLFVBQUcsSUFBSSxDQUFDLEVBQUUsRUFBQztBQUNULFNBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsQ0FBQztPQUMxQztBQUNELGNBQVEsQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0tBQ3pEOztBQUVELHFCQUFpQixFQUFFLFVBQVMsSUFBSSxFQUFFLEtBQUssRUFBQztBQUN0QyxVQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBQztBQUFFLGNBQU0seUJBQXlCLEdBQUcsSUFBSSxHQUFHLGdCQUFnQixHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO09BQUU7QUFDL0csYUFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztLQUNyQzs7QUFFRCxzQkFBa0IsRUFBRSxVQUFTLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFDLEVBa0JyRDs7O0FBR0QsYUFBUyxFQUFFLFVBQVMsSUFBSSxFQUFFLEtBQUssRUFBRSxVQUFVLEVBQUUsT0FBTyxFQUFDO0FBQ25ELFVBQUksWUFBWSxHQUFHLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsQ0FBQztBQUNySCxVQUFJLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRyxPQUFPOztBQUVoQyxVQUFJLElBQUksRUFBRSxPQUFPLENBQUM7QUFDbEIsV0FBSyxLQUFLLEtBQUssR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQ3RCLGdCQUFVLEtBQUssVUFBVSxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDaEMsYUFBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQzFCLE9BQUMsVUFBVSxDQUFDLE1BQU0sS0FBSyxPQUFPLEdBQUcsVUFBVSxDQUFBLEFBQUMsS0FBSyxVQUFVLEdBQUcsS0FBSyxDQUFBLEFBQUMsQ0FBQztBQUNyRSxVQUFJLENBQUMsU0FBUyxLQUFLLElBQUksQ0FBQyxTQUFTLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQzs7QUFFeEMsVUFBSSxBQUFDLElBQUksS0FBSyxPQUFPLElBQUksT0FBTyxDQUFDLGtCQUFrQixJQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUM7QUFDckYsWUFBSSxHQUFHLEtBQUssQ0FBQztBQUNiLGVBQU8sR0FBRyxLQUFLLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztPQUNyQyxNQUNJLElBQUcsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssUUFBUSxJQUFLLElBQUksS0FBSyxPQUFPLElBQUksT0FBTyxDQUFDLGNBQWMsQUFBQyxFQUFDO0FBQzFGLFlBQUksR0FBRyxVQUFVLENBQUM7QUFDbEIsZUFBTyxHQUFHLEVBQUUsQ0FBQztBQUNiLGVBQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7T0FDL0I7O0FBRUQsVUFBRyxDQUFDLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPOztBQUU3QixVQUFJLElBQUksR0FBRyxVQUFTLEdBQUcsRUFBQztBQUN0QixZQUFJLENBQUM7WUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQztBQUN4QixZQUFJLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUNoQyxhQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUNoQixjQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLFNBQVM7QUFDcEMsY0FBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzNCLGNBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDbkI7T0FDRixDQUFDO0FBQ0YsVUFBSSxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ25CLFVBQUksUUFBUSxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUM3QixVQUFJLEtBQUssR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0FBQ2xDLFVBQUksR0FBRyxFQUFFLE9BQU8sRUFBRSxJQUFJLEVBQUUsU0FBUyxDQUFDOzs7OztBQUtsQyxTQUFFO0FBQ0EsYUFBSSxHQUFHLElBQUksT0FBTyxFQUFDO0FBQ2pCLGNBQUksR0FBRyxDQUFDLFFBQVEsSUFBSSxRQUFRLElBQUksR0FBRyxDQUFBLEFBQUMsR0FBRyxHQUFHLENBQUEsQ0FBRSxPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztBQUM5SCxlQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsV0FBVyxFQUFDO0FBQ2pDLHFCQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN6QyxnQkFBRyxVQUFVLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxJQUFJLFVBQVUsQ0FBQyxJQUFJLEVBQUUsT0FBTyxDQUFDLEVBQUM7O0FBRXhELGtCQUFHLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN0RSxrQkFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUM1QztXQUNGO1NBQ0Y7T0FDRixRQUFPLE9BQU8sS0FBSyxJQUFJLEtBQUssT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUEsQUFBQyxFQUFDOzs7QUFHbkUsWUFBTSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDekMsVUFBSSxDQUFDLGNBQWMsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0tBQzFFOztHQUVGLENBQUMsQ0FBQzs7QUFFSCxXQUFTLENBQUMsTUFBTSxHQUFFLFVBQVMsVUFBVSxFQUFFLFdBQVcsRUFBRTtBQUNsRCxRQUFJLE1BQU0sR0FBRyxJQUFJO1FBQ2IsS0FBSztRQUNMLGVBQWUsR0FBRztBQUNoQixlQUFVLENBQUMsRUFBSyxhQUFjLENBQUMsRUFBRSxLQUFNLENBQUMsRUFBZ0IsS0FBTSxDQUFDLEVBQWMsS0FBTSxDQUFDO0FBQ3BGLGNBQVMsQ0FBQyxFQUFNLFFBQVMsQ0FBQyxFQUFPLE9BQVEsQ0FBQyxFQUFjLE9BQVEsQ0FBQyxFQUFZLEtBQU0sQ0FBQztBQUNwRixrQkFBYSxDQUFDLEVBQUUsU0FBVSxDQUFDLEVBQU0sUUFBUyxDQUFDLEVBQWEsaUJBQWtCLENBQUMsRUFBRSxTQUFVLENBQUM7QUFDeEYsYUFBUSxDQUFDLEVBQU8sWUFBYSxDQUFDLEVBQUcsbUJBQW9CLENBQUMsRUFBRSxVQUFXLENBQUMsRUFBUyxvQkFBcUIsQ0FBQztLQUNwRztRQUNELGdCQUFnQixHQUFHO0FBQ2pCLGNBQVMsQ0FBQyxFQUFNLFVBQVcsQ0FBQyxFQUFLLFVBQVcsQ0FBQyxFQUFFLFFBQVMsQ0FBQyxFQUFXLEtBQU0sQ0FBQztBQUMzRSxlQUFVLENBQUMsRUFBSyxhQUFjLENBQUMsRUFBRSxJQUFLLENBQUMsRUFBUSxpQkFBa0IsQ0FBQyxFQUFFLGtCQUFtQixDQUFDO0FBQ3hGLHdCQUFtQixDQUFDO0tBQ3JCLENBQUM7O0FBRU4sY0FBVSxDQUFDLFFBQVEsR0FBRyxFQUFFLENBQUM7OztBQUd6QixLQUFDLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxVQUFTLEtBQUssRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFDOztBQUdqRCxVQUFHLGdCQUFnQixDQUFDLEdBQUcsQ0FBQyxFQUFDO0FBQUUsZUFBTztPQUFFOzs7QUFHcEMsVUFBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE9BQU8sSUFBSSxLQUFLLENBQUMsV0FBVyxJQUFLLENBQUMsQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQUFBQyxFQUFDO0FBQ3RKLGtCQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUNqQyxlQUFPLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQztPQUN4Qjs7O0FBR0QsVUFBRyxlQUFlLENBQUMsR0FBRyxDQUFDLEVBQUM7QUFBRSxjQUFNLFNBQVMsR0FBRyxHQUFHLEdBQUcsZ0NBQWdDLEdBQUcsV0FBVyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUM7T0FBRTs7O0tBSWpILEVBQUUsSUFBSSxDQUFDLENBQUM7QUFKeUc7O0FBT2xILFFBQUksVUFBVSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLGFBQWEsQ0FBQyxFQUFFO0FBQ2xELFdBQUssR0FBRyxVQUFVLENBQUMsV0FBVyxDQUFDO0tBQ2hDLE1BQU07QUFDTCxXQUFLLEdBQUcsWUFBVTtBQUFFLGVBQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUM7T0FBRSxDQUFDO0tBQzdEOzs7QUFHRCxRQUFJLFNBQVMsR0FBRyxZQUFVO0FBQUUsVUFBSSxDQUFDLFdBQVcsR0FBRyxLQUFLLENBQUM7S0FBRSxDQUFDO0FBQ3hELGFBQVMsQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztBQUN2QyxTQUFLLENBQUMsU0FBUyxHQUFHLElBQUksU0FBUyxFQUFFLENBQUM7OztBQUdsQyxRQUFJLFVBQVUsRUFBQztBQUFFLE9BQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLFNBQVMsRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7S0FBRTs7O0FBR3RFLFNBQUssQ0FBQyxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQzs7QUFFbkMsV0FBTyxLQUFLLENBQUM7R0FDZCxDQUFDOztBQUVGLFdBQVMsQ0FBQyxRQUFRLEdBQUcsU0FBUyxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFO0FBQzdELFFBQUksTUFBTSxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUM7QUFDL0IsUUFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztBQUNoQyxRQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDOztBQUUxQixRQUFJLFNBQVMsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO0FBQ3RELFFBQUksS0FBSyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxFQUFFLENBQUMsQ0FBQzs7QUFFckQsU0FBSyxDQUFDLGVBQWUsR0FBRyxZQUFXO0FBQ2pDLFVBQUksQ0FBQyxhQUFhLEdBQUcsSUFBSSxTQUFTLENBQUM7QUFDakMsZ0JBQVEsRUFBRSxRQUFRO0FBQ2xCLGNBQU0sRUFBRSxJQUFJO0FBQ1osWUFBSSxFQUFFLE9BQU8sQ0FBQyxRQUFRO09BQ3ZCLENBQUMsQ0FBQztLQUNKLENBQUM7O0FBRUYsU0FBSyxDQUFDLGdCQUFnQixHQUFHLFlBQVc7QUFDbEMsWUFBTSxDQUFDLGdCQUFnQixJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0tBQzdFLENBQUM7O0FBRUYsU0FBSyxDQUFDLGdCQUFnQixHQUFHLFlBQVc7QUFDbEMsWUFBTSxDQUFDLGdCQUFnQixJQUFJLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBQzVFLFVBQUksQ0FBQyxhQUFhLENBQUMsWUFBWSxFQUFFLENBQUM7S0FDbkMsQ0FBQzs7QUFFRixTQUFLLENBQUMsd0JBQXdCLEdBQUcsVUFBUyxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRTtBQUNsRSxVQUFJLENBQUMsYUFBYSxDQUFDLGtCQUFrQixDQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUM7QUFDaEUsWUFBTSxDQUFDLHdCQUF3QixJQUFJLE1BQU0sQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO0tBQ3ZILENBQUM7O0FBRUYsV0FBTyxRQUFRLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0dBQzdELENBQUE7O0FBRUQsR0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLEVBQUUsVUFBVSxDQUFDLENBQUM7O21CQUVsQixTQUFTOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztNQzNTakIsS0FBSzs7TUFDTCxDQUFDOztBQUVSLFdBQVMsYUFBYSxDQUFDLFVBQVUsRUFBQztBQUNoQyxXQUFPLFlBQVU7QUFDZixhQUFPLFVBQVUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxHQUFHLEdBQUcsVUFBVSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQztLQUN6RixDQUFDO0dBQ0g7O0FBRUQsTUFBSSxVQUFVLEdBQUcsUUFBUSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUM7O0FBRTFDLGdCQUFZLEVBQUUsSUFBSTtBQUNsQixVQUFNLEVBQUUsSUFBSTs7QUFFWixTQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssSUFBSSxLQUFLOztBQUUxQixVQUFNLEVBQUUsWUFBVTtBQUFDLGFBQU8sRUFBRSxDQUFDO0tBQUM7O0FBRTlCLGVBQVcsRUFBRSxVQUFTLE1BQU0sRUFBRSxPQUFPLEVBQUM7QUFDcEMsWUFBTSxLQUFLLE1BQU0sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQ3hCLGFBQU8sS0FBSyxPQUFPLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUMxQixVQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUN0QixVQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNsQixVQUFJLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUM7OztBQUdwQyxVQUFJLENBQUMsU0FBUyxDQUFFLE9BQU8sQ0FBQyxNQUFNLElBQUksSUFBSSxDQUFFLENBQUM7QUFDekMsVUFBSSxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBRSxDQUFDO0FBQ3JDLFVBQUksQ0FBQyxNQUFNLEdBQUcsT0FBTyxDQUFDLElBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDOztBQUUxQyxjQUFRLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBRSxJQUFJLEVBQUUsU0FBUyxDQUFFLENBQUM7Ozs7O0FBSzdDLFVBQUksQ0FBQyxFQUFFLENBQUMsUUFBUSxFQUFFLFVBQVMsS0FBSyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUMsRUFFckQsQ0FBQyxDQUFDO0tBRUo7O0FBRUQsT0FBRyxFQUFFLFVBQVMsR0FBRyxFQUFFLE9BQU8sRUFBQzs7QUFHekIsVUFBRyxPQUFPLEdBQUcsSUFBSSxRQUFRLElBQUksT0FBTyxHQUFHLElBQUksUUFBUSxFQUFDO0FBQ2xELGVBQU8sUUFBUSxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLENBQUM7T0FDMUQ7OztBQUdELFVBQUksQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sS0FBSyxDQUFDLENBQUM7OztBQUdwQyxVQUFJLEtBQUssR0FBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQztVQUN6QixNQUFNLEdBQUcsSUFBSTtVQUNiLENBQUMsR0FBQyxLQUFLLENBQUMsTUFBTTtVQUNkLENBQUMsR0FBQyxDQUFDLENBQUM7QUFDSixhQUFPLEtBQUssT0FBTyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7O0FBRTlCLFVBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sR0FBRyxDQUFDO0FBQ25ELFVBQUcsR0FBRyxLQUFLLEVBQUUsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxPQUFPLE1BQU0sQ0FBQzs7QUFFbkQsVUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtBQUNwQixhQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRTs7QUFFdkIsY0FBRyxNQUFNLElBQUksTUFBTSxDQUFDLGtCQUFrQixJQUFJLE9BQU8sQ0FBQyxHQUFHLEVBQUUsT0FBTyxNQUFNLENBQUM7QUFDckUsY0FBRyxNQUFNLElBQUksTUFBTSxDQUFDLGtCQUFrQixFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDaEUsY0FBRyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsT0FBTyxNQUFNLENBQUM7QUFDNUQsY0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQ2pELElBQUcsTUFBTSxDQUFDLFlBQVksRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUN6RCxJQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FDeEQsSUFBRyxNQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDcEU7T0FDRjs7QUFFRCxVQUFHLE1BQU0sSUFBSSxNQUFNLENBQUMsa0JBQWtCLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxFQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7O0FBRWhGLGFBQU8sTUFBTSxDQUFDO0tBQ2Y7O0FBRUQsT0FBRyxFQUFFLFVBQVMsTUFBTSxFQUFFLE9BQU8sRUFBQztBQUM1QixVQUFJLFNBQVMsR0FBRyxFQUFFO1VBQ2QsT0FBTyxHQUFHO0FBQ1IsY0FBTSxFQUFFLElBQUk7QUFDWixZQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVE7QUFDbkIsWUFBSSxFQUFFLGFBQWEsQ0FBQyxJQUFJLENBQUM7QUFDekIsY0FBTSxFQUFFLElBQUk7T0FDYixDQUFDO0FBQ0YsYUFBTyxHQUFHLE9BQU8sSUFBSSxFQUFFOzs7QUFHM0IsWUFBTSxLQUFLLE1BQU0sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDOzs7QUFHeEIsVUFBRyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQ3BJLFVBQUcsQ0FBQyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxFQUFFLE9BQU8sT0FBTyxDQUFDLEtBQUssQ0FBQyxtR0FBbUcsQ0FBQyxDQUFDOzs7QUFHbEosWUFBTSxHQUFHLEFBQUMsTUFBTSxDQUFDLFlBQVksR0FBSSxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQzs7QUFFeEQsWUFBTSxHQUFHLEFBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxHQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsTUFBTSxDQUFDOzs7O0FBSWxELE9BQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFVBQVMsSUFBSSxFQUFFLEtBQUssRUFBQztBQUNsQyxZQUFHLElBQUksQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLEtBQUssS0FBSyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxTQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ25HLGlCQUFTLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDO0FBQ3RFLFlBQUksQ0FBQyxPQUFPLEtBQUssU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFBLEFBQUMsQ0FBQztPQUNuRCxFQUFFLElBQUksQ0FBQyxDQUFDOzs7QUFHVCxVQUFJLENBQUMsWUFBWSxLQUFLLElBQUksQ0FBQyxZQUFZLEdBQUcsU0FBUyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUEsQUFBQyxDQUFDOzs7QUFHaEUsYUFBTyxRQUFRLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsT0FBTyxDQUFDLENBQUM7S0FFekU7O0dBRUYsQ0FBQyxDQUFDOzttQkFFWSxVQUFVOzs7Ozs7Ozs7O01DdkhMLGVBQWUsYUFBMUIsT0FBTztNQUFvQyxtQkFBbUIsYUFBbEMsV0FBVzs7OztBQUdoRCxXQUFTLFNBQVMsQ0FBQyxHQUFHLEVBQUM7QUFDckIsV0FBTyxBQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBSSxjQUFjLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxrQ0FBa0MsRUFBRSxJQUFJLENBQUMsR0FBRyxNQUFNLEdBQUcsSUFBSSxDQUFDO0dBQ2pLOzs7QUFHRCxXQUFTLFFBQVEsQ0FBQyxHQUFHLEVBQUM7QUFDcEIsV0FBTyxBQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBSSxHQUFHLENBQUMsT0FBTyxDQUFDLGdDQUFnQyxFQUFFLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsTUFBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO0dBQ3RKOzs7QUFHRCxXQUFTLFdBQVcsQ0FBQyxHQUFHLEVBQUM7QUFDdkIsV0FBTyxHQUFHLENBQUMsT0FBTyxDQUFDLGtDQUFrQyxFQUFFLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyw4QkFBOEIsRUFBRSxNQUFNLENBQUMsQ0FBQztHQUM5Rzs7O0FBR0QsV0FBUyxPQUFPLENBQUMsR0FBRyxFQUFDO0FBQ25CLFdBQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxxREFBcUQsRUFBRSxJQUFJLENBQUMsQ0FBQztHQUNqRjs7O0FBR0QsV0FBUyxNQUFNLENBQUMsR0FBRyxFQUFDO0FBQ2xCLFdBQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxNQUFNLEVBQUUsR0FBRyxDQUFDLENBQUMsT0FBTyxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztHQUNoRTs7O0FBR0QsV0FBUyxjQUFjLENBQUMsR0FBRyxFQUFDO0FBQzFCLFdBQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxtREFBbUQsRUFBRSxJQUFJLENBQUMsQ0FBQztHQUMvRTs7QUFFRCxXQUFTLFlBQVksQ0FBQyxFQUFFLEVBQUU7QUFDeEIsUUFBSSxHQUFHLEdBQUcsRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3hCLE9BQUcsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDMUMsV0FBTyxVQUFTLElBQUksRUFBRTtBQUNwQixhQUFPLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLGdCQUFnQixFQUFFLFVBQVMsSUFBSSxFQUFFO0FBQ2hFLFlBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEIsZUFBTyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO09BQ3hCLENBQUMsQ0FBQztLQUNKLENBQUM7R0FDSDs7QUFFRCxNQUFJLGtCQUFrQixHQUFHLFlBQVksQ0FBQyxZQUFZO0FBQ2hELFdBQU8sQ0FBQyxZQUFXO0FBQ2pCLGFBQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUU7QUFDL0MsaUJBQVMsRUFBRSxPQUFPO0FBQ2xCLGdCQUFRLEVBQUUsU0FBUztBQUNuQixhQUFLLEVBQUUsUUFBUTtPQUNoQixDQUFDLENBQUM7S0FDSixDQUFBLEVBQUcsQ0FBQztHQUNOLENBQUMsQ0FBQzs7QUFFSCxXQUFTLFVBQVUsQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFDO0FBQy9CLFFBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUU7QUFDNUIsYUFBTyxPQUFPLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDLENBQUM7S0FDL0M7OztBQUdELE9BQUcsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRTFCLE9BQUcsR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRWxCLFdBQU8sR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO0FBQ3hCLFdBQU8sQ0FBQyxRQUFRLEdBQUcsT0FBTyxDQUFDLFFBQVEsSUFBSSxFQUFFLENBQUM7QUFDMUMsV0FBTyxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztBQUNsQyxXQUFPLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksRUFBRSxDQUFDOztBQUV4QyxRQUFJLFFBQVEsR0FBRyxHQUFHO1FBQ2QsS0FBSyxHQUFHLEVBQUU7UUFDVixNQUFNLEdBQUcsSUFBSTtRQUNiLElBQUksR0FBRyxFQUFFO1FBQ1QsU0FBUyxHQUFHLElBQUk7UUFDaEIsT0FBTyxHQUFHLEVBQUU7UUFDWixRQUFRO1FBQ1IsT0FBTztRQUNQLElBQUksR0FBRyxFQUFFLENBQUM7OztBQUdkLFFBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFDO0FBRWhFLGVBQVMsR0FBRyxLQUFLLENBQUM7O0FBRWxCLFVBQUksR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDcEIsV0FBSyxHQUFHLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN0QixjQUFRLEdBQUcsV0FBVyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQzVCLFlBQU0sR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7S0FFekI7Ozs7QUFJRCxRQUFJLFNBQVMsR0FBRyxvREFBb0Q7UUFDaEUsS0FBSyxDQUFDOztBQUVWLFdBQU8sQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQSxJQUFLLElBQUksRUFBRTtBQUMvQyxhQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzFCO0FBQ0QsV0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFTLFlBQVksRUFBRSxLQUFLLEVBQUM7QUFDM0MsVUFBSSxDQUFDLElBQUksQ0FBQyxJQUFHLEdBQUcsT0FBTyxDQUFDLFFBQVEsR0FBRyxZQUFZLEdBQUcsSUFBRyxDQUFDLENBQUM7S0FDeEQsQ0FBQyxDQUFDOzs7QUFHSCxZQUFRLEdBQUcsUUFBUSxDQUFDLE9BQU8sQ0FBQyx5Q0FBeUMsRUFBRSxFQUFFLENBQUMsQ0FBQzs7O0FBRzNFLFlBQVEsR0FBRyxRQUFRLENBQUMsS0FBSyxDQUFDLDBDQUEwQyxDQUFDLENBQUM7O0FBRXRFLFFBQUcsUUFBUSxFQUFDO0FBQ1YsY0FBUSxDQUFDLE9BQU8sQ0FBQyxVQUFTLE9BQU8sRUFBRSxLQUFLLEVBQUM7QUFDdkMsWUFBSSxDQUFDLElBQUksQ0FBQyxJQUFHLEdBQUcsT0FBTyxDQUFDLFFBQVEsR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDLDJDQUEyQyxFQUFFLElBQUksQ0FBQyxHQUFHLElBQUcsQ0FBQyxDQUFDO09BQzlHLENBQUMsQ0FBQztLQUNKOzs7QUFHRCxZQUFRLEdBQUcsRUFBRSxHQUFHLG1CQUFtQixDQUFDLFFBQVEsQ0FBQyxDQUFDOzs7QUFHOUMsUUFBRyxTQUFTLEVBQUM7QUFDWCxjQUFRLEdBQUcsNkJBQTZCLEdBQUMsUUFBUSxHQUFDLHVDQUFzQyxHQUFFLE9BQU8sQ0FBQyxJQUFJLEdBQUUsdUJBQXNCLENBQUM7S0FDaEk7O1NBRUc7QUFDRixjQUFRLEdBQUcsa0JBQWtCLENBQUM7QUFDNUIsWUFBSSxFQUFFLElBQUk7QUFDVixjQUFNLEVBQUUsTUFBTTtBQUNkLGFBQUssRUFBRSxLQUFLO0FBQ1osZ0JBQVEsRUFBRSxRQUFRO09BQ25CLENBQUMsQ0FBQztLQUNKOzs7QUFHRCxZQUFRLEdBQUcsV0FBVyxHQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsa0JBQWtCLEdBQUcsUUFBUSxHQUFHLEtBQUssQ0FBQzs7QUFFaEYsV0FBTyxRQUFRLENBQUM7R0FDakI7O1VBRVEsVUFBVSxHQUFWLFVBQVU7Ozs7Ozs7O01DeklaLENBQUM7OztBQUdSLE1BQUcsQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUFDO0FBQUUsVUFBTSxtREFBbUQsQ0FBQztHQUFFOzs7QUFHaEYsV0FBUyxnQkFBZ0IsQ0FBQyxPQUFPLEVBQUUsWUFBWSxFQUFFLFFBQVEsRUFBRTtBQUN6RCxRQUFJLFdBQVc7UUFBRSxZQUFZO1FBQUUsU0FBUztRQUFFLE1BQU0sR0FBRyxJQUFJLENBQUM7Ozs7O0FBS3hELFFBQUcsQ0FBQyxRQUFRLElBQUksSUFBSSxDQUFDLE9BQU8sRUFBQztBQUUzQixpQkFBVyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDOztBQUVsQyxPQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSxVQUFVLEtBQUssRUFBRSxHQUFHLEVBQUU7QUFFOUQsWUFBSSxNQUFNLEdBQUcsTUFBTSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQzs7O0FBR25ELGdCQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLFVBQVMsR0FBRyxFQUFDO0FBQUMsaUJBQU8sR0FBRyxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsS0FBSyxNQUFNLENBQUM7U0FBQyxDQUFDLENBQUM7OztBQUd4SCxlQUFPLE1BQU0sQ0FBRSxZQUFZLEdBQUcsR0FBRyxDQUFFLENBQUM7T0FFckMsQ0FBQyxDQUFDOzs7QUFHSCxVQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxZQUFZLEVBQUUsQ0FBQzs7O0FBRzFDLGdCQUFVLENBQUMsWUFBVTtBQUNuQixnQkFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLENBQUMsWUFBWSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FBQztPQUM5RSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0tBRVQ7OztBQUdELGdCQUFZLEdBQUcsSUFBSSxPQUFPLEVBQUUsQ0FBQztBQUM3QixnQkFBWSxDQUFDLE1BQU0sR0FBRyxZQUFZLENBQUM7OztBQUduQyxhQUFTLEdBQUcsQUFBQyxRQUFRLEdBQUksUUFBUSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsR0FBRyxRQUFRLENBQUMsb0JBQW9CLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDeEcsYUFBUyxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUM7QUFDekIsYUFBUyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQzs7O0FBR3BDLFlBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQzs7O0FBRzVCLEtBQUMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUUsVUFBVSxLQUFLLEVBQUUsR0FBRyxFQUFFOztBQUU5RCxVQUFJLGlCQUFpQixHQUFHLFlBQVksR0FBRyxHQUFHO1VBQ3RDLFlBQVksQ0FBQzs7QUFFakIsWUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQUksWUFBWTtBQUFFLG9CQUFZLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsYUFBYSxFQUFFLFNBQVMsQ0FBQyxDQUFDO09BQUUsQ0FBQzs7QUFFN0gsWUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDLENBQUM7S0FDbkQsRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFVCxRQUFHLENBQUMsUUFBUSxFQUFDO0FBQ1gsWUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxHQUFHLFlBQVksQ0FBQSxDQUFFLGFBQWEsQ0FBQztLQUNuRTs7O0FBR0QsV0FBTyxZQUFZLENBQUM7R0FDckI7OztBQUdELFdBQVMsY0FBYyxDQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsUUFBUSxFQUFFOztBQUd2RCxRQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO1FBQ3JGLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLFlBQVksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO1FBQ3ZGLFNBQVMsR0FBRyxLQUFLO1FBQ2pCLFFBQVEsR0FBRyxLQUFLO1FBQ2hCLFVBQVUsR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLE9BQU8sR0FBRyxNQUFNLENBQUM7UUFDdEQsU0FBUyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztRQUNwRCxNQUFNLEdBQUcsSUFBSTtRQUNiLE9BQU8sQ0FBQzs7O0FBR1YsUUFBRyxDQUFDLFVBQVUsRUFBQztBQUNiLGdCQUFVLEdBQUcsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUM1QyxnQkFBVSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7QUFDNUMsZ0JBQVUsQ0FBQyxZQUFZLENBQUMsS0FBSyxFQUFFLFlBQVksQ0FBQyxDQUFDO0FBQzdDLGdCQUFVLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQztBQUN4QyxnQkFBVSxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsT0FBTyxHQUFHLE1BQU0sQ0FBQyxDQUFDO0FBQ2hELGNBQVEsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3RDLE9BQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsTUFBTSxFQUFFLFVBQVMsS0FBSyxFQUFDO0FBQ3BDLFlBQUcsQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFBLElBQUssUUFBUSxFQUFDOztBQUVoQywwQkFBZ0IsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxDQUFDLENBQUM7Ozs7QUFJMUQsY0FBRyxDQUFDLFFBQVEsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLGtCQUFrQixFQUFDO0FBQy9DLG9CQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1dBQ3JEO0FBQ0QsY0FBRyxDQUFDLFFBQVEsRUFBQztBQUNYLGtCQUFNLENBQUMsTUFBTSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQztXQUN6QztBQUNELGtCQUFRLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUM7U0FDM0M7T0FDRixDQUFDLENBQUM7S0FDTjs7U0FFSTtBQUNILGdCQUFVLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3ZDLGVBQVMsR0FBRyxJQUFJLENBQUM7S0FDbEI7OztBQUdELFFBQUcsTUFBTSxDQUFDLE9BQU8sQ0FBQyxRQUFRLElBQUksQ0FBQyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUM7QUFDeEQsZUFBUyxHQUFHLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDN0MsZUFBUyxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUNsRCxlQUFTLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxHQUFHLEdBQUMsS0FBSyxHQUFDLEtBQUssQ0FBQyxDQUFDO0FBQy9DLGVBQVMsQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLE9BQU8sR0FBRyxLQUFLLENBQUMsQ0FBQztBQUM5QyxjQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNyQyxPQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxVQUFTLEtBQUssRUFBQzs7QUFFckMsZUFBTyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsVUFBUyxTQUFTLEVBQUM7QUFFbEMsY0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUEsS0FBTSxPQUFPLEdBQUcsU0FBUyxDQUFBLEFBQUMsSUFBSSxTQUFTLEVBQUM7O0FBR3pELDRCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQzs7O0FBRzFELGdCQUFHLENBQUMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsa0JBQWtCLEVBQUM7QUFDL0Msc0JBQVEsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUM7YUFDckQ7QUFDRCxnQkFBRyxDQUFDLFFBQVEsRUFBQztBQUNYLG9CQUFNLENBQUMsTUFBTSxDQUFDLGtCQUFrQixHQUFHLElBQUksQ0FBQzthQUN6Qzs7QUFFRCxvQkFBUSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1dBQzNDO1NBQ0YsQ0FBQyxDQUFDO09BQ0osQ0FBQyxDQUFDO0tBRU4sTUFDRzs7QUFFRixZQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsVUFBUyxTQUFTLEVBQUM7QUFFekMsWUFBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLENBQUEsS0FBTSxPQUFPLEdBQUcsU0FBUyxDQUFBLEFBQUMsSUFBSSxTQUFTLEVBQUM7O0FBR3pELDBCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxRQUFRLENBQUMsQ0FBQzs7O0FBRzFELGNBQUcsQ0FBQyxRQUFRLElBQUksTUFBTSxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsRUFBQztBQUMvQyxvQkFBUSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztXQUNyRDs7QUFFRCxjQUFHLENBQUMsUUFBUSxFQUFDO0FBQ1gsa0JBQU0sQ0FBQyxNQUFNLENBQUMsa0JBQWtCLEdBQUcsSUFBSSxDQUFDO1dBQ3pDO0FBQ0Qsa0JBQVEsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQztTQUMzQztPQUNGLENBQUMsQ0FBQztLQUNKOzs7O0FBS0w7O0FBRUU7QUFDRTs7OztBQUlGLDZCQUF3QixLQUFLLEVBQUU7QUFDN0I7OztBQUdBOzs7QUFHQSwrQkFBMEIsS0FBSyxHQUFJLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDOzs7QUFHakUsNENBQXFDLE9BQU8sRUFBRTtBQUM1QztBQUNFO0FBQ0E7Ozs7O0FBS0o7QUFDRTs7OztBQUlGO0FBQ0E7Ozs7QUFJRiwwQkFBcUIsT0FBTyxFQUFFOztBQUc1QixVQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLENBQUM7QUFDN0IsVUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDOztBQUUxQixVQUFJLFdBQVcsR0FBRyxJQUFJLE1BQU0sQ0FBQyxpQkFBaUIsRUFBRSxHQUFHLENBQUM7VUFDcEQsTUFBTSxHQUFHLElBQUksQ0FBQzs7O0FBR2QsT0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFlBQVksRUFBRSxVQUFTLEtBQUssRUFBRSxLQUFLLEVBQUM7QUFDckQsWUFBSSxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLEVBQUUsS0FBSyxHQUFHLE1BQU0sQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDN0QsY0FBTSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsS0FBSyxFQUFFLEtBQUssRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztPQUN2RSxFQUFFLElBQUksQ0FBQyxDQUFDOzs7QUFHVCxPQUFDLENBQUMsUUFBUSxDQUFDLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxHQUFHLEVBQUUsVUFBUyxDQUFDLEVBQUM7QUFFdEMsWUFBSSxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDLENBQUM7OztBQUd6QyxZQUFHLElBQUksS0FBSyxHQUFHLElBQUksSUFBSSxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUM7QUFDeEQsV0FBQyxDQUFDLGNBQWMsRUFBRSxDQUFDO0FBQ25CLGdCQUFNLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFDLE9BQU8sRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO1NBQ3hDO09BQ0YsQ0FBQyxDQUFDOzs7QUFHSCxPQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCLEVBQUUsVUFBUyxRQUFRLEVBQUUsS0FBSyxFQUFDO0FBQzVELHNCQUFjLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLFFBQVEsQ0FBQyxDQUFDO09BQ3JELENBQUMsQ0FBQzs7O0FBR0gsYUFBTyxDQUFDLFNBQVMsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQzs7O0FBRzFDLGNBQVEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO0FBQ3JCLGlCQUFTLEVBQUUsSUFBSTtBQUNmLFlBQUksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUk7T0FDdkIsQ0FBQyxDQUFDO0tBRUo7R0FDRixDQUFDLENBQUM7O21CQUVVLGFBQWE7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDOU81QixNQUFHLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFBRSxNQUFNLG1EQUFtRCxDQUFDO0FBQy9FLE1BQUcsQ0FBQyxNQUFNLENBQUMsT0FBTyxFQUFFLE1BQU0seUNBQXlDLENBQUM7Ozs7TUFJN0QsS0FBSzs7TUFDTCxPQUFPOztNQUNMLEtBQUssMkJBQUwsS0FBSztNQUFFLFVBQVUsMkJBQVYsVUFBVTtNQUFFLGdCQUFnQiwyQkFBaEIsZ0JBQWdCO01BQ3JDLFNBQVM7O01BQ1QsTUFBTTs7O0FBR2IsUUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEdBQUcsTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxRQUFRLENBQUMsSUFBSSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUM7OztBQUd6RyxNQUFJLE1BQU0sR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDLFNBQVMsQ0FBQzs7O0FBRzFELFFBQU0sQ0FBQyxPQUFPLEdBQUc7QUFDZixrQkFBYyxFQUFFLE9BQU8sQ0FBQyxjQUFjO0FBQ3RDLG1CQUFlLEVBQUUsT0FBTyxDQUFDLGVBQWU7QUFDeEMscUJBQWlCLEVBQUUsU0FBUyxDQUFDLFFBQVE7QUFDckMsU0FBSyxFQUFFLEtBQUs7QUFDWixjQUFVLEVBQUUsVUFBVTtBQUN0QixvQkFBZ0IsRUFBRSxnQkFBZ0I7QUFDbEMsYUFBUyxFQUFFLFNBQVM7R0FDckIsQ0FBQzs7O0FBR0YsTUFBRyxNQUFNLEVBQUUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxNQUFNLEdBQUcsSUFBSSxNQUFNLENBQUMsRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBQyxDQUFDLENBQUM7O21CQUU3RCxPQUFPOzs7Ozs7OztNQ3hDZixTQUFTOztNQUNULENBQUM7Ozs7O0FBR1IsTUFBSSxPQUFPLEdBQUksRUFBRTtNQUNiLFFBQVEsR0FBRyxFQUFFLENBQUM7O0FBRWxCLFNBQU8sQ0FBQyxlQUFlLEdBQUcsVUFBUyxJQUFJLEVBQUUsSUFBSSxFQUFDO0FBQzVDLFFBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxVQUFVLElBQUksT0FBTyxJQUFJLEtBQUssUUFBUSxFQUFDO0FBQ3JELGNBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLENBQUM7S0FDdkI7R0FDRixDQUFDOzs7QUFHRixTQUFPLENBQUMsWUFBWSxHQUFHLFVBQVMsSUFBSSxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUU7QUFFbEQsT0FBRyxHQUFHLEdBQUcsSUFBSSxFQUFFLENBQUM7O0FBRWhCLFFBQUksR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDOzs7QUFHNUIsUUFBRyxJQUFJLEtBQUssV0FBVyxFQUFFO0FBQUUsYUFBTyxJQUFJLENBQUMsU0FBUyxDQUFDO0tBQUU7QUFDbkQsUUFBRyxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQUUsYUFBTyxJQUFJLE1BQUcsQ0FBQztLQUFFO0FBQ3JDLFFBQUcsSUFBSSxLQUFLLFFBQVEsRUFBRTtBQUFFLGFBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQztLQUFFO0FBQzdDLFFBQUcsSUFBSSxLQUFLLE1BQU0sRUFBRTtBQUFFLGFBQU8sSUFBSSxDQUFDLElBQUksQ0FBQztLQUFFO0FBQ3pDLFFBQUcsSUFBSSxLQUFLLE1BQU0sRUFBRTtBQUFFLGFBQU8sSUFBSSxRQUFLLENBQUM7S0FBRTtBQUN6QyxRQUFHLElBQUksS0FBSyxTQUFTLEVBQUU7QUFBRSxhQUFPLElBQUksQ0FBQyxPQUFPLENBQUM7S0FBRTtBQUMvQyxRQUFHLElBQUksS0FBSyxRQUFRLEVBQUU7QUFBRSxhQUFPLElBQUksQ0FBQyxNQUFNLENBQUM7S0FBRTtBQUM3QyxRQUFHLElBQUksS0FBSyxJQUFJLEVBQUU7QUFBRSxhQUFPLElBQUksQ0FBQyxFQUFFLENBQUM7S0FBRTs7O0FBR3JDLFdBQU8sQUFBQyxHQUFHLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxPQUFPLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFLLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFLLENBQUM7R0FDakosQ0FBQzs7QUFFRixTQUFPLENBQUMsY0FBYyxHQUFHLFVBQVMsSUFBSSxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUM7QUFDdkQsUUFBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUM7QUFDbkIsYUFBTyxDQUFDLEtBQUssQ0FBQyxtREFBbUQsQ0FBQyxDQUFDO0FBQ25FLGFBQU87S0FDUjtBQUNELFFBQUcsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxFQUFDO0FBQ3pCLGFBQU8sQ0FBQyxLQUFLLENBQUMsdURBQXVELENBQUMsQ0FBQztBQUN2RSxhQUFPO0tBQ1I7QUFDRCxRQUFHLE9BQU8sQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEVBQUM7QUFDNUIsYUFBTyxDQUFDLEtBQUssQ0FBQyxvQkFBbUIsR0FBRyxJQUFJLEdBQUcsMkJBQTBCLENBQUMsQ0FBQztBQUN2RSxhQUFPO0tBQ1I7O0FBRUQsVUFBTSxHQUFHLEFBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsR0FBSSxNQUFNLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNqRCxZQUFRLENBQUMsUUFBUSxHQUFHLE1BQU0sQ0FBQzs7QUFFM0IsV0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLFFBQVEsQ0FBQztHQUUxQixDQUFDOzs7Ozs7QUFNRixTQUFPLENBQUMsRUFBRSxHQUFHLFVBQVMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFDO0FBQy9DLFFBQUksQ0FBQztRQUFFLFFBQVE7UUFBRSxRQUFRO1FBQUUsT0FBTztRQUM5QixTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQztRQUNyQixHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU07UUFDbkIsSUFBSSxHQUFHLElBQUksQ0FBQzs7O0FBR2hCLFFBQUcsR0FBRyxLQUFLLENBQUMsRUFBQztBQUNYLGNBQVEsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsY0FBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7QUFDM0IsYUFBTyxHQUFJLElBQUksQ0FBQyxFQUFFLElBQUksT0FBTyxDQUFDLE9BQU8sQUFBQyxDQUFDO0tBQ3hDOztTQUVJLElBQUcsR0FBRyxLQUFLLENBQUMsRUFBQztBQUNoQixjQUFRLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JCLGNBQVEsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsYUFBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7S0FDM0I7OztBQUdELEtBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxFQUFFLENBQUMsU0FBUyxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsVUFBUyxLQUFLLEVBQUM7QUFDdEQsV0FBSyxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUMsT0FBTyxDQUFDO0FBQ2hDLGFBQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7S0FDM0QsQ0FBQyxDQUFDO0dBQ0osQ0FBQzs7QUFFRixTQUFPLENBQUMsTUFBTSxHQUFHLFVBQVMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFDO0FBQ2pELFdBQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxJQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO0dBQzdDLENBQUM7O0FBRUYsU0FBTyxNQUFHLEdBQUcsVUFBUyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUM7QUFFL0MsUUFBSSxTQUFTLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDOztBQUUxQixRQUFHLFNBQVMsS0FBSyxTQUFTLEVBQUM7QUFDekIsYUFBTyxJQUFJLENBQUM7S0FDYjs7QUFFRCxRQUFHLFNBQVMsQ0FBQyxPQUFPLEVBQUM7QUFDbkIsZUFBUyxHQUFHLElBQUksQ0FBQztLQUNsQjs7O0FBR0QsUUFBRyxDQUFDLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxJQUFJLFNBQVMsQ0FBQyxZQUFZLEVBQUM7QUFDaEQsZUFBUyxHQUFHLFNBQVMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLEtBQUssQ0FBQztLQUM3Qzs7QUFFRCxRQUFHLFNBQVMsS0FBSyxNQUFNLEVBQUM7QUFBRSxlQUFTLEdBQUcsSUFBSSxDQUFDO0tBQUU7QUFDN0MsUUFBRyxTQUFTLEtBQUssT0FBTyxFQUFDO0FBQUUsZUFBUyxHQUFHLEtBQUssQ0FBQztLQUFFOzs7QUFHL0MsUUFBRyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBQztBQUNuQixhQUFPLEFBQUMsU0FBUyxHQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxBQUFDLENBQUM7S0FDckQ7OztBQUdELFFBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFDO0FBQzdDLGFBQU8sSUFBSSxDQUFDO0tBQ2I7O0FBRUQsV0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDOzs7QUFHMUMsUUFBRyxTQUFTLElBQUksT0FBTyxDQUFDLFFBQVEsRUFBQztBQUMvQixhQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsQ0FBQztLQUN0SCxNQUNJLElBQUcsQ0FBQyxTQUFTLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBQztBQUNwQyxhQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsQ0FBQztLQUNySDs7QUFFRCxXQUFPLEVBQUUsQ0FBQztHQUNYLENBQUM7Ozs7QUFJRixTQUFPLENBQUMsTUFBTSxHQUFHLFVBQVMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFDO0FBQ25ELFFBQUksU0FBUyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQzs7QUFFMUIsUUFBRyxTQUFTLEtBQUssU0FBUyxFQUFDO0FBQ3pCLGFBQU8sSUFBSSxDQUFDO0tBQ2I7O0FBRUQsUUFBRyxTQUFTLENBQUMsT0FBTyxFQUFDO0FBQ25CLGVBQVMsR0FBRyxJQUFJLENBQUM7S0FDbEI7OztBQUdELFFBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsSUFBSSxTQUFTLENBQUMsWUFBWSxFQUFDO0FBQ2hELGVBQVMsR0FBRyxTQUFTLENBQUMsTUFBTSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUM7S0FDN0M7OztBQUdELFFBQUcsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUM7QUFDbkIsYUFBTyxBQUFDLENBQUMsU0FBUyxHQUFJLE1BQU0sQ0FBQyxDQUFDLENBQUMsR0FBSyxNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxBQUFDLENBQUM7S0FDdEQ7OztBQUdELFFBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxhQUFhLEtBQUssU0FBUyxFQUFDO0FBQ2pELGFBQU8sSUFBSSxDQUFDO0tBQ2I7O0FBRUQsV0FBTyxDQUFDLFdBQVcsQ0FBQyxhQUFhLEdBQUcsU0FBUyxDQUFDOzs7QUFHOUMsUUFBRyxDQUFDLFNBQVMsSUFBSyxPQUFPLENBQUMsUUFBUSxFQUFDO0FBQ2pDLGFBQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFDO0tBQ3RILE1BQ0ksSUFBRyxTQUFTLElBQUksT0FBTyxDQUFDLE9BQU8sRUFBQztBQUNuQyxhQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUUsQ0FBQztLQUNySDs7QUFFRCxXQUFPLEVBQUUsQ0FBQztHQUNYLENBQUM7OztBQUdGLFdBQVMsU0FBUyxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUUsR0FBRyxFQUFFO0FBQ3RDLFFBQUksR0FBRyxJQUFJLElBQUksRUFBRTtBQUNmLFlBQU0sSUFBSSxTQUFTLENBQUMsdUNBQXVDLENBQUMsQ0FBQztLQUM5RDtBQUNELFFBQUksT0FBTyxTQUFTLEtBQUssVUFBVSxFQUFFO0FBQ25DLFlBQU0sSUFBSSxTQUFTLENBQUMsOEJBQThCLENBQUMsQ0FBQztLQUNyRDtBQUNELFFBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2QixRQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxLQUFLLENBQUMsQ0FBQztBQUMvQixRQUFJLE9BQU8sR0FBRyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDM0IsUUFBSSxLQUFLLENBQUM7O0FBRVYsU0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtBQUMvQixXQUFLLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hCLFVBQUksU0FBUyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUU7QUFDaEQsZUFBTyxDQUFDLENBQUM7T0FDVjtLQUNGO0FBQ0QsV0FBTyxDQUFDLENBQUMsQ0FBQztHQUNYOztBQUVELFNBQU8sQ0FBQyxJQUFJLEdBQUcsVUFBUyxNQUFNLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxHQUFHLEVBQUM7QUFFakQsUUFBRyxDQUFDLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUM7QUFBRSxhQUFPLENBQUMsSUFBSSxDQUFDLDZFQUE2RSxFQUFFLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQyxBQUFDLE9BQU8sSUFBSSxDQUFDO0tBQUU7O0FBRWpMLFFBQUksS0FBSyxHQUFHLEFBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLFlBQVksR0FBSSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUM7O0FBQy9ELFNBQUs7UUFBRSxHQUFHOztBQUNWLFlBQVE7O0FBQ1IsZ0JBQVksR0FBRyxVQUFTLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBQztBQUNqRCxhQUFPLE9BQU8sQ0FBQyxHQUFHLEtBQUssR0FBRyxDQUFDO0tBQzVCLENBQUM7OztBQUdOLFdBQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQzs7QUFFOUQsS0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsVUFBUyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBQztBQUVwQyxVQUFHLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLEVBQUM7QUFBRSxlQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLEdBQUcsRUFBRSx1QkFBdUIsQ0FBQyxDQUFDO09BQUU7O0FBRTNGLGNBQVEsR0FBRyxTQUFTLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLEVBQUUsWUFBWSxFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7Ozs7Ozs7Ozs7OztBQWF4RSxVQUFHLFFBQVEsS0FBSyxHQUFHLEVBQUM7O0FBR2xCLFlBQUksU0FBUyxHQUFHLElBQUksU0FBUyxDQUFDLFlBQVU7QUFDdEMsaUJBQU8sT0FBTyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUUsQUFBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFdBQVcsS0FBSyxDQUFDLEdBQUUsR0FBRyxHQUFDLE9BQU8sQ0FBQyxPQUFPLEVBQUcsT0FBTyxFQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsaUJBQWlCLElBQUksT0FBTyxDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1NBQ3hLLEVBQUUsRUFBQyxLQUFLLEVBQUUsT0FBTyxDQUFDLFdBQVcsRUFBQyxDQUFDLENBQUM7OztBQUdqQyxZQUFHLFFBQVEsR0FBRyxDQUFDLENBQUMsRUFBQztBQUNmLGlCQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztTQUNoRDs7O0FBR0QsWUFBRyxPQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsRUFBQztBQUNqQyxpQkFBTyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDM0M7OztBQUdELGVBQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQzs7O0FBR25ELGVBQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDO09BRS9DO0tBRUYsRUFBRSxJQUFJLENBQUMsQ0FBQzs7O0FBR1QsU0FBSyxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDckIsT0FBRyxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7QUFDNUMsU0FBSSxHQUFHLEVBQUUsS0FBSyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsRUFBQztBQUMzQixhQUFPLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUMzQzs7O0FBR0QsV0FBTyxJQUFJLENBQUM7R0FFYixDQUFDOztBQUVGLFNBQU8sUUFBSyxHQUFHLFVBQVMsTUFBTSxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsR0FBRyxFQUFDOztBQUdqRCxXQUFPLE9BQU8sQ0FBQyxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBRSxDQUFDO0dBRWhILENBQUM7O0FBRUYsU0FBTyxDQUFDLE9BQU8sR0FBRyxVQUFTLE1BQU0sRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBQztBQUNwRCxRQUFJLE9BQU8sR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDbEMsUUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLFVBQVUsRUFBRTtBQUNqQyxhQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQztLQUM3QztHQUVGLENBQUM7O21CQUVhLE9BQU87Ozs7Ozs7O01DeFJmLGdCQUFnQjs7TUFDaEIsQ0FBQzs7O0FBR1IsV0FBUyxVQUFVLENBQUMsR0FBRyxFQUFFLElBQUksRUFBQztBQUM1QixRQUFHLEdBQUcsS0FBSyxJQUFJLEVBQUUsT0FBTyxJQUFJLENBQUM7QUFDN0IsV0FBTyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFDLENBQUMsQ0FBQyxLQUFLLElBQUksR0FBQyxHQUFHLENBQUM7R0FDckQ7Ozs7O0FBS0QsV0FBUyxpQkFBaUIsR0FBRTtBQUMxQixRQUFJLENBQUMsR0FBRyxDQUFDO1FBQUUsR0FBRyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDO0FBQ3JDLFdBQU8sSUFBSSxDQUFDLGlCQUFpQixDQUFDO0FBQzlCLFNBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQ2hCLFVBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUM7S0FDN0I7QUFDRCxRQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUM7R0FDekI7O0FBRUQsTUFBSSxnQkFBZ0IsR0FBRyxVQUFTLElBQUksRUFBRSxPQUFPLEVBQUM7QUFFNUMsUUFBRyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLHlEQUF5RCxFQUFFLElBQUksRUFBRSxnQkFBZ0IsQ0FBQyxDQUFDO0FBQ2hJLFdBQU8sR0FBRyxPQUFPLElBQUksRUFBRSxDQUFDO0FBQ3hCLFFBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3pDLFFBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUN6QixRQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztBQUN2QixRQUFJLENBQUMsV0FBVyxHQUFHLEVBQUUsQ0FBQztBQUN0QixRQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNsQixRQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsQ0FBQztBQUNsQixRQUFJLENBQUMsVUFBVSxHQUFHLEtBQUssQ0FBQztBQUN4QixRQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQztBQUNwQixRQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztBQUNqQixLQUFDLENBQUMsT0FBTyxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDekMsUUFBSSxDQUFDLElBQUksR0FBRyxnQkFBZ0IsQ0FBQyxPQUFPLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7O0FBR3RELFFBQUksT0FBTyxHQUFHO0FBQ1osWUFBTSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUUsT0FBTyxDQUFDLE1BQU0sSUFBSSxJQUFJLENBQUU7QUFDaEQsVUFBSSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUUsT0FBTyxDQUFDLElBQUksSUFBSSxPQUFPLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBRTtBQUM1RCxVQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxPQUFPLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNO0tBQ2hELENBQUM7Ozs7OztBQU1GLFFBQUksQ0FBQyxLQUFLLEdBQUc7QUFDWCxXQUFLLEVBQUUsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUM7QUFDckMsZ0JBQVUsRUFBRSxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRSxFQUFFLE9BQU8sQ0FBQztBQUMvQyxXQUFLLEVBQUUsU0FBUztLQUNqQixDQUFDOztBQUVGLFFBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztHQUViLENBQUM7O0FBRUYsR0FBQyxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxTQUFTLEVBQUUsUUFBUSxDQUFDLE1BQU0sRUFBRTs7QUFFcEQsc0JBQWtCLEVBQUUsSUFBSTtBQUN4QixVQUFNLEVBQUUsSUFBSTtBQUNaLFVBQU0sRUFBRSxZQUFVO0FBQUUsYUFBTyxFQUFFLENBQUM7S0FBRTs7O0FBR2hDLGFBQVMsRUFBRSxZQUFVO0FBQ25CLFVBQUcsSUFBSSxDQUFDLE9BQU8sRUFBRSxPQUFPO0FBQ3hCLFVBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0FBQ3BCLFVBQUksQ0FBQyxPQUFPLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQzdCOzs7OztBQUtELGVBQVcsRUFBRSxVQUFTLElBQUksRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLE9BQU8sRUFBQztBQUNyRCxVQUFJLFlBQVksR0FBRyxFQUFFLE1BQU0sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDckgsVUFBSSxZQUFZLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFHLE9BQU87QUFDakQsV0FBSyxLQUFLLEtBQUssR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQ3RCLGdCQUFVLEtBQUssVUFBVSxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDaEMsYUFBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQzFCLFVBQUksQ0FBQyxPQUFPLEtBQUssSUFBSSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQ3BDLFVBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxLQUFLLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDaEQsT0FBQyxVQUFVLENBQUMsTUFBTSxLQUFLLE9BQU8sR0FBRyxVQUFVLENBQUEsQUFBQyxLQUFLLFVBQVUsR0FBRyxLQUFLLENBQUEsQUFBQyxDQUFDO0FBQ3JFLFVBQUksSUFBSSxHQUFHLFVBQVMsR0FBRyxFQUFDO0FBQ3RCLFlBQUksQ0FBQztZQUFFLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFDO0FBQ3hCLFlBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQ2hDLGFBQUksQ0FBQyxHQUFDLENBQUMsRUFBQyxDQUFDLEdBQUMsR0FBRyxFQUFDLENBQUMsRUFBRSxFQUFDO0FBQ2hCLGNBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsU0FBUztBQUNwQyxjQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDM0IsY0FBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztTQUNuQjtPQUNGO1VBQUUsSUFBSTtVQUFFLE1BQU0sQ0FBQztBQUNoQixZQUFNLEdBQUcsSUFBSSxHQUFHLFVBQVUsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFFLFFBQVEsQ0FBQyxDQUFDOzs7O0FBSXJFLFVBQUcsSUFBSSxLQUFLLE9BQU8sSUFBSSxPQUFPLENBQUMsa0JBQWtCLEVBQUM7QUFDaEQsU0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsa0JBQWtCLEVBQUUsVUFBUyxLQUFLLEVBQUUsR0FBRyxFQUFDO0FBQ3JELGdCQUFNLEdBQUcsSUFBSSxJQUFJLElBQUksSUFBSSxHQUFHLENBQUEsQUFBQyxHQUFHLEdBQUcsQ0FBQztBQUNwQyxXQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxjQUFjLEVBQUUsVUFBUyxVQUFVLEVBQUUsVUFBVSxFQUFDO0FBQzFELHNCQUFVLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxVQUFVLENBQUMsQ0FBQztXQUN2RSxFQUFFLElBQUksQ0FBQyxDQUFDO1NBQ1YsRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNWOzs7O1dBSUksSUFBRyxJQUFJLEtBQUssT0FBTyxJQUFJLE9BQU8sQ0FBQyxjQUFjLEVBQUM7QUFDakQsU0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFVBQVMsVUFBVSxFQUFFLFVBQVUsRUFBQztBQUMxRCxvQkFBVSxDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDdkUsRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNWOzs7O1dBSUksSUFBRyxJQUFJLEtBQUssS0FBSyxJQUFJLElBQUksS0FBSyxRQUFRLEVBQUM7QUFDMUMsU0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFVBQVMsVUFBVSxFQUFFLFVBQVUsRUFBQztBQUMxRCxjQUFJLFVBQVUsQ0FBQyxVQUFVLEVBQUUsTUFBTSxDQUFDLElBQUksVUFBVSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsRUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUMsQ0FBQztTQUM3RyxFQUFFLElBQUksQ0FBQyxDQUFDO09BQ1Y7OztXQUdJLElBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLEVBQUM7QUFDcEMsY0FBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDdEUsU0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsY0FBYyxFQUFFLFVBQVMsVUFBVSxFQUFFLFVBQVUsRUFBQztBQUMxRCxvQkFBVSxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsVUFBVSxDQUFDLENBQUM7U0FDdkUsRUFBRSxJQUFJLENBQUMsQ0FBQztPQUNWOztBQUVELFVBQUksQ0FBQztVQUFFLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQztBQUNqQyxXQUFJLENBQUMsR0FBQyxDQUFDLEVBQUMsQ0FBQyxHQUFDLEdBQUcsRUFBQyxDQUFDLEVBQUUsRUFBQztBQUNoQixZQUFJLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDO09BQzdCOzs7O0FBSUQsVUFBRyxDQUFDLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsVUFBVSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDcEcsYUFBTztLQUNSOzs7Ozs7QUFNRCxZQUFRLEVBQUUsVUFBUyxJQUFJLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxPQUFPLEVBQUM7QUFDbEQsVUFBSSxZQUFZLEdBQUcsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxJQUFJLEVBQUUsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDaEcsVUFBSSxDQUFDLElBQUksQ0FBQyxRQUFRLElBQUksWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRyxPQUFPO0FBQzlFLFdBQUssS0FBSyxLQUFLLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUN0QixnQkFBVSxLQUFLLFVBQVUsR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQ2hDLGFBQU8sS0FBSyxPQUFPLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUMxQixPQUFDLFVBQVUsQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsS0FBSyxPQUFPLEdBQUcsVUFBVSxDQUFBLEFBQUMsS0FBSyxVQUFVLEdBQUcsS0FBSyxDQUFBLEFBQUMsQ0FBQztBQUMvRixVQUFJLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDZixVQUFJLElBQUksR0FBRyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0FBQzVFLFVBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDOztBQUVuQyxVQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEVBQUUsT0FBTztBQUMvQixVQUFHLElBQUksS0FBSyxRQUFRLEVBQUUsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUMsS0FDakUsSUFBRyxJQUFJLEtBQUssT0FBTyxFQUFFLElBQUksQ0FBQyxLQUFLLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUNyRCxJQUFHLElBQUksS0FBSyxLQUFLLEVBQUcsSUFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQ2hELElBQUcsSUFBSSxLQUFLLFFBQVEsRUFBRyxJQUFJLENBQUMsTUFBTSxJQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLENBQUM7O0FBQUEsS0FFL0Q7Ozs7O0FBS0QsUUFBSSxFQUFFLFlBQVU7QUFDZCxVQUFJLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ3pCLFVBQUksT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDOUIsVUFBSSxDQUFDLGNBQWMsS0FBSyxJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7O0FBRWxELE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFTLElBQUksRUFBQztBQUM5QixZQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQ3RDLFlBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsa0JBQWtCLEVBQUUsT0FBTztBQUMzQyxXQUFHLENBQUMsRUFBRSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUM7T0FDakMsRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFVCxPQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsVUFBUyxJQUFJLEVBQUM7O0FBRTlCLFlBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsZUFBTSxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssU0FBUyxFQUFDO0FBQzNCLGlCQUFPLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQztBQUM3QixlQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7U0FDZjs7QUFFRCxZQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sRUFBRSxDQUFDLE9BQU8sQ0FBQyxhQUFhLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDekQsWUFBSSxHQUFHLElBQUksSUFBSSxJQUFJLElBQUksR0FBRyxDQUFBLEFBQUMsR0FBRyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDOzs7QUFHOUMsWUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsS0FBSyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7QUFDOUQsWUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7T0FDdEMsRUFBRSxJQUFJLENBQUMsQ0FBQzs7O0FBR1QsYUFBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0tBQ2xFOzs7QUFHRCxRQUFJLEVBQUUsWUFBVTtBQUNkLFVBQUksSUFBSSxHQUFHLEtBQUssQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUM7VUFDNUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMzQixhQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO0tBQ2xDOzs7Ozs7Ozs7O0FBVUQsU0FBSyxFQUFFLFVBQVMsT0FBTyxFQUFFLE1BQU0sRUFBQztBQUU5QixVQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLE9BQU87QUFDNUMsVUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7O0FBRXZCLFVBQUksS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztVQUNuQyxNQUFNLENBQUM7O0FBRVgsYUFBTyxLQUFLLE9BQU8sR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFBLEFBQUMsQ0FBQzs7Ozs7O0FBTXZDLE9BQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxVQUFTLEdBQUcsRUFBQztBQUM3QixZQUFJLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxFQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUMsQ0FBQyxDQUFDO0FBQy9DLFlBQUcsQ0FBQyxVQUFVLElBQUksQ0FBQyxVQUFVLENBQUMsa0JBQWtCLEVBQUUsT0FBTztBQUN6RCxZQUFHLFVBQVUsQ0FBQyxPQUFPLElBQUksVUFBVSxDQUFDLFVBQVUsS0FBSyxJQUFJLEVBQUM7QUFDdEQsb0JBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQztBQUNwQyxvQkFBVSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ25CLGNBQUcsVUFBVSxDQUFDLE9BQU8sRUFBRSxPQUFPLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDO1NBQ3ZEO0FBQ0QsZUFBTyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQzs7T0FFckMsRUFBRSxJQUFJLENBQUMsQ0FBQzs7QUFFVCxVQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxPQUFPOztBQUU1QixVQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDOztBQUVoRCxZQUFNLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLE1BQU0sQ0FBQyxDQUFDOzs7QUFHMUMsVUFBRyxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLEVBQUMsS0FBSyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUMsS0FDekUsSUFBRyxDQUFDLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sRUFBRSxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxFQUFDLEtBQUssRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDOzs7QUFHakcsVUFBRyxDQUFDLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUM7QUFDM0MsWUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUM7QUFDMUIsWUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUN6QyxZQUFJLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO09BQ3JCOztXQUVJLElBQUcsTUFBTSxDQUFDLFlBQVksRUFBQztBQUMxQixZQUFJLENBQUMsVUFBVSxHQUFHLFlBQVksQ0FBQztBQUMvQixZQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUN6QixZQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQztBQUNyQixZQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ2pCLFlBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7T0FDcEIsTUFDSSxJQUFHLE1BQU0sQ0FBQyxPQUFPLEVBQUM7QUFDckIsWUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUM7QUFDMUIsWUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7QUFDMUIsWUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsWUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUNuQixZQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO09BQ3BCLE1BQ0c7QUFDRixZQUFJLENBQUMsVUFBVSxHQUFHLE9BQU8sQ0FBQztBQUMxQixZQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3pDLFlBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7T0FDcEI7O0FBRUQsYUFBTyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7S0FDckI7Ozs7OztBQU1ELFNBQUssRUFBRSxVQUFTLE1BQU0sRUFBQztBQUNyQixVQUFJLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDMUIsVUFBRyxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxFQUFFLE9BQU87QUFDbEUsWUFBTSxDQUFDLElBQUksS0FBSyxNQUFNLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUEsQUFBQyxDQUFDO0FBQzFDLFlBQU0sQ0FBQyxJQUFJLEtBQUssTUFBTSxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsR0FBRyxDQUFBLEFBQUMsQ0FBQztBQUMxQyxZQUFNLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQyxHQUFHLENBQUM7QUFDeEIsVUFBSSxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7QUFDdkIsVUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsQ0FBQztLQUM3Qzs7O0FBR0QsT0FBRyxFQUFFLFVBQVMsR0FBRyxFQUFFLE9BQU8sRUFBQztBQUN6QixVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDekIsYUFBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQzFCLFVBQUcsSUFBSSxDQUFDLFVBQVUsS0FBSyxPQUFPLEVBQUUsT0FBTyxPQUFPLENBQUMsS0FBSyxDQUFDLHFCQUFxQixHQUFFLElBQUksQ0FBQyxJQUFJLEdBQUUsc0RBQXNELENBQUMsQ0FBQztBQUMvSSxhQUFPLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ2hDOzs7OztBQUtELE9BQUcsRUFBRSxVQUFTLEdBQUcsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFDO0FBQzlCLFVBQUcsSUFBSSxDQUFDLFVBQVUsS0FBSyxJQUFJLEVBQUUsT0FBTyxTQUFTLENBQUM7QUFDOUMsYUFBTyxLQUFLLE9BQU8sR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO0FBQzFCLFVBQUksS0FBSyxHQUFHLEdBQUcsQ0FBQztBQUNoQixVQUFJLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDekIsVUFBRyxJQUFJLENBQUMsVUFBVSxLQUFLLE9BQU8sRUFBQztBQUM3QixZQUFJLE9BQU8sR0FBRyxLQUFLLFFBQVEsRUFBRTtBQUMzQixlQUFLLEdBQUcsQUFBQyxHQUFHLENBQUMsT0FBTyxHQUFJLEdBQUcsQ0FBQyxVQUFVLEdBQUcsR0FBRyxDQUFDO0FBQzdDLGlCQUFPLEdBQUcsR0FBRyxDQUFDO1NBQ2YsTUFBTTtBQUNMLFdBQUMsS0FBSyxHQUFHLEVBQUUsQ0FBQSxDQUFFLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztTQUN6QjtPQUNGO0FBQ0QsVUFBRyxJQUFJLENBQUMsVUFBVSxLQUFLLE9BQU8sRUFBRSxPQUFPLEdBQUcsR0FBRyxJQUFJLEVBQUUsQ0FBQztBQUNwRCxXQUFLLEdBQUcsQUFBQyxLQUFLLElBQUksS0FBSyxDQUFDLGtCQUFrQixHQUFJLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRyxLQUFLLENBQUM7OztBQUdwRSxVQUFHLElBQUksQ0FBQyxVQUFVLEtBQUssT0FBTyxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxLQUFLLEtBQUssRUFBQztBQUMzRCxZQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7QUFDekIsWUFBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUM7O0FBRWhCLGNBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDbkUsY0FBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLEtBQUssQ0FBQztBQUMzQyxjQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDeEMsY0FBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLEdBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsVUFBVSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQzFELGlCQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztTQUMzQztPQUNGLE1BQ0ksSUFBRyxJQUFJLENBQUMsVUFBVSxLQUFLLE9BQU8sSUFBSSxPQUFPLENBQUMsS0FBSyxFQUFFLEdBQUcsR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQyxLQUNuRixJQUFHLElBQUksQ0FBQyxVQUFVLEtBQUssT0FBTyxFQUFFLEdBQUcsR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsQ0FBQztBQUNyRSxVQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxVQUFVLEdBQUcsS0FBSyxDQUFDOzs7QUFHdkMsT0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxFQUFFLFVBQVMsSUFBSSxFQUFDO0FBQUUsWUFBSSxJQUFJLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztPQUFFLENBQUMsQ0FBQzs7QUFFN0QsYUFBTyxHQUFHLENBQUM7S0FDWjs7O0FBR0QsU0FBSyxFQUFFLFlBQVU7QUFDZixVQUFHLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzlCLGFBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7S0FDcEM7OztBQUdELFNBQUssRUFBRSxVQUFTLEdBQUcsRUFBRSxPQUFPLEVBQUM7QUFDM0IsVUFBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsRUFBRSxPQUFPO0FBQ3JDLGFBQU8sS0FBSyxPQUFPLEdBQUcsRUFBRSxDQUFBLEFBQUMsQ0FBQztBQUMxQixhQUFPLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztBQUNyQixhQUFRLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0tBQ2hDOzs7QUFHRCxVQUFNLEVBQUUsWUFBVztBQUNqQixVQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDO0FBQ3pDLFVBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUN2QixVQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztBQUMzQixVQUFJLElBQUksR0FBRyxBQUFDLEdBQUcsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsR0FBSSxHQUFHLENBQUMsTUFBTSxFQUFFLEdBQUcsR0FBRyxDQUFDO0FBQ2xFLFVBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDO0FBQzVCLGFBQU8sSUFBSSxDQUFDO0tBQ2I7O0dBRUYsQ0FBQyxDQUFDOzttQkFFWSxnQkFBZ0I7Ozs7Ozs7Ozs7O0FDNVc3QixNQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7O0FBRWpCLE1BQUksT0FBTyxFQUFFLEtBQUssRUFBRSxRQUFRLEVBQUUsVUFBVSxDQUFDOztBQUV6QyxNQUFJLGNBQWMsR0FBRyxPQUFPLENBQUMsY0FBYyxHQUFHOzs7OztBQUs1QyxlQUFXLEVBQUUsQ0FBQzs7O0FBR2Qsb0JBQWdCLEVBQUUsS0FBSzs7O0FBR3ZCLHVCQUFtQixFQUFFLElBQUk7Ozs7O0FBS3pCLGtCQUFjLEVBQUUsS0FBSzs7O0FBR3JCLDhCQUEwQixFQUFFLEtBQUs7Ozs7O0FBS2pDLGFBQVMsRUFBRSxLQUFLOzs7Ozs7Ozs7OztBQVdoQixhQUFTLEVBQUUsSUFBSTs7Ozs7Ozs7O0FBU2YsVUFBTSxFQUFFLEtBQUs7Ozs7OztBQU1iLFdBQU8sRUFBRSxJQUFJOzs7QUFHYixjQUFVLEVBQUUsSUFBSTs7O0FBR2hCLG9CQUFnQixFQUFFLElBQUk7R0FDdkIsQ0FBQzs7QUFFRixXQUFTLFVBQVUsQ0FBQyxJQUFJLEVBQUU7QUFDeEIsV0FBTyxHQUFHLElBQUksSUFBSSxFQUFFLENBQUM7QUFDckIsU0FBSyxJQUFJLEdBQUcsSUFBSSxjQUFjLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsR0FBRyxDQUFDLEVBQ3JGLE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxjQUFjLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDckMsY0FBVSxHQUFHLE9BQU8sQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDOztBQUV4QyxhQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsSUFBSSxDQUFDLEdBQUcsY0FBYyxHQUFHLHFCQUFxQixDQUFDO0dBQy9FOzs7Ozs7OztBQVFELE1BQUksV0FBVyxHQUFHLE9BQU8sQ0FBQyxXQUFXLEdBQUcsVUFBUyxLQUFLLEVBQUUsTUFBTSxFQUFFO0FBQzlELFNBQUssSUFBSSxJQUFJLEdBQUcsQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLElBQUk7QUFDNUIsZUFBUyxDQUFDLFNBQVMsR0FBRyxHQUFHLENBQUM7QUFDMUIsVUFBSSxLQUFLLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztBQUNsQyxVQUFJLEtBQUssSUFBSSxLQUFLLENBQUMsS0FBSyxHQUFHLE1BQU0sRUFBRTtBQUNqQyxVQUFFLElBQUksQ0FBQztBQUNQLFdBQUcsR0FBRyxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7T0FDckMsTUFBTSxNQUFNO0tBQ2Q7QUFDRCxXQUFPLEVBQUMsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsTUFBTSxHQUFHLEdBQUcsRUFBQyxDQUFDO0dBQzNDLENBQUM7Ozs7Ozs7OztBQVNGLFNBQU8sQ0FBQyxRQUFRLEdBQUcsVUFBUyxJQUFJLEVBQUUsSUFBSSxFQUFFO21CQU10QyxVQUFrQixXQUFXLEVBQUU7QUFDN0IsYUFBTyxHQUFHLE1BQU0sQ0FBQztBQUNqQixlQUFTLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDdkIsT0FBQyxDQUFDLEtBQUssR0FBRyxRQUFRLENBQUMsQUFBQyxDQUFDLENBQUMsR0FBRyxHQUFHLE1BQU0sQ0FBQztBQUNuQyxPQUFDLENBQUMsUUFBUSxHQUFHLFdBQVcsQ0FBQyxBQUFDLENBQUMsQ0FBQyxNQUFNLEdBQUcsU0FBUyxDQUFDO0FBQy9DLE9BQUMsQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLEFBQUMsQ0FBQyxDQUFDLEtBQUssR0FBRyxNQUFNLENBQUM7QUFDbkMsYUFBTyxDQUFDLENBQUM7S0FDVjs7QUFaRCxTQUFLLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLEFBQUMsUUFBUSxHQUFHLEtBQUssQ0FBQyxNQUFNLENBQUM7QUFDOUMsY0FBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2pCLGtCQUFjLEVBQUUsQ0FBQzs7QUFFakIsUUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBU1gsWUFBUSxDQUFDLE1BQU0sR0FBRyxVQUFTLEdBQUcsRUFBRSxTQUFTLEVBQUU7QUFDekMsWUFBTSxHQUFHLEdBQUcsQ0FBQztBQUNiLFVBQUksT0FBTyxDQUFDLFNBQVMsRUFBRTtBQUNyQixrQkFBVSxHQUFHLENBQUMsQ0FBQztBQUNmLG9CQUFZLEdBQUcsU0FBUyxDQUFDLFNBQVMsR0FBRyxDQUFDLENBQUM7QUFDdkMsWUFBSSxLQUFLLENBQUM7QUFDVixlQUFPLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUEsSUFBSyxLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsRUFBRTtBQUMzRCxZQUFFLFVBQVUsQ0FBQztBQUNiLHNCQUFZLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDO1NBQzlDO09BQ0Y7QUFDRCxzQkFBZ0IsR0FBRyxTQUFTLENBQUM7QUFDN0IsZUFBUyxFQUFFLENBQUM7S0FDYixDQUFDO0FBQ0YsV0FBTyxRQUFRLENBQUM7R0FDakIsQ0FBQzs7Ozs7OztBQU9GLE1BQUksTUFBTSxDQUFDOzs7O0FBSVgsTUFBSSxRQUFRLEVBQUUsTUFBTSxDQUFDOzs7OztBQUtyQixNQUFJLFdBQVcsRUFBRSxTQUFTLENBQUM7Ozs7Ozs7Ozs7QUFVM0IsTUFBSSxPQUFPLEVBQUUsTUFBTSxDQUFDOzs7Ozs7Ozs7QUFTcEIsTUFBSSxnQkFBZ0IsQ0FBQzs7Ozs7O0FBTXJCLE1BQUksVUFBVSxFQUFFLFlBQVksQ0FBQzs7Ozs7QUFLN0IsTUFBSSxTQUFTLEVBQUUsT0FBTyxFQUFFLFVBQVUsQ0FBQzs7Ozs7OztBQU9uQyxNQUFJLFVBQVUsRUFBRSxNQUFNLEVBQUUsTUFBTSxDQUFDOzs7Ozs7OztBQVEvQixXQUFTLEtBQUssQ0FBQyxHQUFHLEVBQUUsT0FBTyxFQUFFO0FBQzNCLFFBQUksR0FBRyxHQUFHLFdBQVcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7QUFDbEMsV0FBTyxJQUFJLElBQUksR0FBRyxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQztBQUNwRCxRQUFJLEdBQUcsR0FBRyxJQUFJLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNuQyxPQUFHLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxBQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLEFBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxNQUFNLENBQUM7QUFDcEQsVUFBTSxHQUFHLENBQUM7R0FDWDs7OztBQUlELE1BQUksS0FBSyxHQUFHLEVBQUUsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7QUFjZixNQUFJLElBQUksR0FBRyxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUM7TUFBRSxPQUFPLEdBQUcsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDO01BQUUsT0FBTyxHQUFHLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQyxDQUFDO0FBQ2pGLE1BQUksS0FBSyxHQUFHLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQztNQUFFLElBQUksR0FBRyxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0FBZWpELE1BQUksTUFBTSxHQUFHLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBQztNQUFFLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLE1BQU0sR0FBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUMsQ0FBQztBQUMxRyxNQUFJLFNBQVMsR0FBRyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUM7TUFBRSxTQUFTLEdBQUcsRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFDO01BQUUsUUFBUSxHQUFHLEVBQUMsT0FBTyxFQUFFLFNBQVMsRUFBQyxDQUFDO0FBQzFHLE1BQUksR0FBRyxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFDO01BQUUsS0FBSyxHQUFHLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDckYsTUFBSSxRQUFRLEdBQUcsRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFDO01BQUUsSUFBSSxHQUFHLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFDO01BQUUsU0FBUyxHQUFHLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBQyxDQUFDO0FBQzlHLE1BQUksR0FBRyxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUMsQ0FBQztBQUMxRyxNQUFJLE1BQU0sR0FBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLElBQUksR0FBRyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUM7TUFBRSxJQUFJLEdBQUcsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUM7QUFDcEcsTUFBSSxJQUFJLEdBQUcsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDO01BQUUsTUFBTSxHQUFHLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBQyxDQUFDO0FBQ3pELE1BQUksTUFBTSxHQUFHLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFDO01BQUUsS0FBSyxHQUFHLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBQztNQUFFLElBQUksR0FBRyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ3BILE1BQUksS0FBSyxHQUFHLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBQyxDQUFDOzs7O0FBSTlCLE1BQUksS0FBSyxHQUFHLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDO01BQUUsS0FBSyxHQUFHLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDM0YsTUFBSSxNQUFNLEdBQUcsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUMsQ0FBQzs7Ozs7O0FBTWxELE1BQUksR0FBRyxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQzs7OztBQUl0RCxNQUFJLFlBQVksR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTTtBQUMvQyxjQUFVLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVE7QUFDakUsUUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUk7QUFDMUQsY0FBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU87QUFDdEUsV0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTTtBQUN2RSxXQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLO0FBQzlCLFVBQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUc7QUFDckUsZ0JBQVksRUFBRSxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUs7QUFDaEYsWUFBUSxFQUFFLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7QUFDN0QsVUFBTSxFQUFFLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7QUFDekQsWUFBUSxFQUFFLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsRUFBQyxDQUFDOzs7O0FBSW5GLE1BQUksU0FBUyxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDO01BQUUsU0FBUyxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ2hILE1BQUksT0FBTyxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUMsQ0FBQztBQUMxRixNQUFJLE1BQU0sR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLEtBQUssR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ2xGLE1BQUksTUFBTSxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDO01BQUUsSUFBSSxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBQztNQUFFLFNBQVMsR0FBRyxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUM7TUFBRSxTQUFTLEdBQUcsRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JySSxNQUFJLE1BQU0sR0FBRyxFQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLEdBQUcsR0FBRyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ3JGLE1BQUksT0FBTyxHQUFHLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDakQsTUFBSSxPQUFPLEdBQUcsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ3hHLE1BQUksVUFBVSxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDOUMsTUFBSSxXQUFXLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUMvQyxNQUFJLFVBQVUsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQzlDLE1BQUksV0FBVyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDL0MsTUFBSSxXQUFXLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUMvQyxNQUFJLFNBQVMsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQzdDLE1BQUksV0FBVyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDL0MsTUFBSSxTQUFTLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUM3QyxNQUFJLFFBQVEsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDMUQsTUFBSSxlQUFlLEdBQUcsRUFBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFB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SSxFQUFFLENBQUM7QUFDOUUsV0FBSyxDQUFDLEVBQVMsS0FBSyxFQUFFLENBQUMsRUFBYyxXQUFXLEVBQUUsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDLEVBQVEsTUFBTSxFQUFFLENBQUM7QUFDaEYsUUFBSSxFQUFFLENBQUMsRUFBUSxRQUFRLEVBQUUsQ0FBQyxFQUFXLE1BQU0sRUFBRSxDQUFDLEVBQU0sWUFBWSxFQUFFLENBQUMsRUFBSSxFQUFFLEVBQUUsQ0FBQztBQUM1RSxTQUFLLEVBQUUsQ0FBQyxFQUFPLEtBQUssRUFBRSxDQUFDLEVBQWMsSUFBSSxFQUFFLENBQUMsRUFBUyxRQUFRLEVBQUUsQ0FBQyxFQUFPLElBQUksRUFBRSxDQUFDO0FBQzlFLFlBQVEsRUFBRSxDQUFDLEVBQUksWUFBWSxFQUFFLENBQUMsRUFBTyxXQUFXLEVBQUUsQ0FBQyxFQUFFLFNBQVMsRUFBRSxDQUFDLEVBQU0sS0FBSyxFQUFFLENBQUM7QUFDL0UsVUFBTSxFQUFFLENBQUMsRUFBTSxRQUFRLEVBQUUsQ0FBQyxFQUFXLElBQUksRUFBRSxDQUFDLEVBQVMsTUFBTSxFQUFFLENBQUMsRUFBUyxRQUFRLEVBQUUsQ0FBQztBQUNsRixXQUFPLEVBQUUsQ0FBQyxFQUFLLE1BQU0sRUFBRSxDQUFDLEVBQWEsTUFBTSxFQUFFLENBQUMsRUFBTyxNQUFNLEVBQUUsQ0FBQyxFQUFTLFFBQVEsRUFBRSxDQUFDO0FBQ2xGLFdBQU8sRUFBRSxDQUFDLEVBQUssVUFBVSxFQUFFLENBQUMsRUFBUyxPQUFPLEVBQUUsQ0FBQyxFQUFNLFNBQVMsRUFBRSxDQUFDLEVBQU0sVUFBVSxFQUFFLENBQUM7QUFDcEYsV0FBTyxFQUFFLENBQUMsRUFBSyxNQUFNLEVBQUUsQ0FBQyxFQUFhLFdBQVcsRUFBRSxDQUFDLEVBQUUsV0FBVyxFQUFFLENBQUMsRUFBSSxVQUFVLEVBQUUsQ0FBQztBQUNwRixlQUFXLEVBQUUsQ0FBQyxFQUFDLFNBQVMsRUFBRSxDQUFDLEVBQVUsT0FBTyxFQUFFLENBQUMsRUFBTSxRQUFRLEVBQUUsQ0FBQyxFQUFP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ZmlsZSI6InJlYm91bmQucnVudGltZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFByb3BlcnR5IENvbXBpbGVyXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCB0b2tlbml6ZXIgZnJvbSBcInByb3BlcnR5LWNvbXBpbGVyL3Rva2VuaXplclwiO1xuXG52YXIgY29tcHV0ZWRQcm9wZXJ0aWVzID0gW107XG5cbi8vIFRPRE86IE1ha2UgdGhpcyBmYXJycnJyciBtb3JlIHJvYnVzdC4uLnZlcnkgbWluaW1hbCByaWdodCBub3dcblxuZnVuY3Rpb24gY29tcGlsZShwcm9wLCBuYW1lKXtcbiAgdmFyIG91dHB1dCA9IHt9O1xuXG4gIGlmKHByb3AuX19wYXJhbXMpIHJldHVybiBwcm9wLl9fcGFyYW1zO1xuXG4gIHZhciBzdHIgPSBwcm9wLnRvU3RyaW5nKCksIC8vLnJlcGxhY2UoLyg/OlxcL1xcKig/OltcXHNcXFNdKj8pXFwqXFwvKXwoPzooW1xccztdKStcXC9cXC8oPzouKikkKS9nbSwgJyQxJyksIC8vIFN0cmluZyByZXByZXNlbnRhdGlvbiBvZiBmdW5jdGlvbiBzYW5zIGNvbW1lbnRzXG4gICAgICBuZXh0VG9rZW4gPSB0b2tlbml6ZXIudG9rZW5pemUoc3RyKSxcbiAgICAgIHRva2VucyA9IFtdLFxuICAgICAgdG9rZW4sXG4gICAgICBmaW5pc2hlZFBhdGhzID0gW10sXG4gICAgICBuYW1lZFBhdGhzID0ge30sXG4gICAgICBvcGNvZGVzID0gW10sXG4gICAgICBuYW1lZCA9IGZhbHNlLFxuICAgICAgbGlzdGVuaW5nID0gMCxcbiAgICAgIGluU3ViQ29tcG9uZW50ID0gMCxcbiAgICAgIHN1YkNvbXBvbmVudCA9IFtdLFxuICAgICAgcm9vdCxcbiAgICAgIHBhdGhzID0gW10sXG4gICAgICBwYXRoLFxuICAgICAgdG1wUGF0aCxcbiAgICAgIGF0dHJzID0gW10sXG4gICAgICB3b3JraW5ncGF0aCA9IFtdLFxuICAgICAgdGVybWluYXRvcnMgPSBbJzsnLCcsJywnPT0nLCc+JywnPCcsJz49JywnPD0nLCc+PT0nLCc8PT0nLCchPScsJyE9PScsICc9PT0nLCAnJiYnLCAnfHwnLCAnKycsICctJywgJy8nLCAnKiddO1xuICBkb3tcblxuICAgIHRva2VuID0gbmV4dFRva2VuKCk7XG5cbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ3RoaXMnKXtcbiAgICAgIGxpc3RlbmluZysrO1xuICAgICAgd29ya2luZ3BhdGggPSBbXTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBoYW5kbGUgZ2V0cyBvbiBjb2xsZWN0aW9uc1xuICAgIGlmKHRva2VuLnZhbHVlID09PSAnZ2V0Jyl7XG4gICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB3aGlsZShfLmlzVW5kZWZpbmVkKHBhdGgudmFsdWUpKXtcbiAgICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXBsYWNlIGFueSBhY2Nlc3MgdG8gYSBjb2xsZWN0aW9uIHdpdGggdGhlIGdlbmVyaWMgQGVhY2ggcGxhY2Vob2xkZXIgYW5kIHB1c2ggZGVwZW5kYW5jeVxuICAgICAgd29ya2luZ3BhdGgucHVzaChwYXRoLnZhbHVlLnJlcGxhY2UoL1xcWy4rXFxdL2csIFwiLkBlYWNoXCIpLnJlcGxhY2UoL15cXC4vLCAnJykpO1xuICAgIH1cblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAncGx1Y2snKXtcbiAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIHdoaWxlKF8uaXNVbmRlZmluZWQocGF0aC52YWx1ZSkpe1xuICAgICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB9XG5cbiAgICAgIHdvcmtpbmdwYXRoLnB1c2goJ0BlYWNoLicgKyBwYXRoLnZhbHVlKTtcbiAgICB9XG5cbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ3NsaWNlJyB8fCB0b2tlbi52YWx1ZSA9PT0gJ2Nsb25lJyB8fCB0b2tlbi52YWx1ZSA9PT0gJ2ZpbHRlcicpe1xuICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgaWYocGF0aC50eXBlLnR5cGUgPT09ICcoJykgd29ya2luZ3BhdGgucHVzaCgnQGVhY2gnKTtcbiAgICB9XG5cbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ2F0Jyl7XG5cbiAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIHdoaWxlKF8uaXNVbmRlZmluZWQocGF0aC52YWx1ZSkpe1xuICAgICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB9XG4gICAgICAvLyB3b3JraW5ncGF0aFt3b3JraW5ncGF0aC5sZW5ndGggLTFdID0gd29ya2luZ3BhdGhbd29ya2luZ3BhdGgubGVuZ3RoIC0xXSArICdbJyArIHBhdGgudmFsdWUgKyAnXSc7XG4gICAgICAvLyB3b3JraW5ncGF0aC5wdXNoKCdbJyArIHBhdGgudmFsdWUgKyAnXScpO1xuICAgICAgd29ya2luZ3BhdGgucHVzaCgnQGVhY2gnKTtcblxuICAgIH1cblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAnd2hlcmUnIHx8IHRva2VuLnZhbHVlID09PSAnZmluZFdoZXJlJyl7XG4gICAgICB3b3JraW5ncGF0aC5wdXNoKCdAZWFjaCcpO1xuICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgYXR0cnMgPSBbXTtcbiAgICAgIHZhciBpdHIgPSAwO1xuICAgICAgd2hpbGUocGF0aC50eXBlLnR5cGUgIT09ICcpJyl7XG4gICAgICAgIGlmKHBhdGgudmFsdWUpe1xuICAgICAgICAgIGlmKGl0ciUyID09PSAwKXtcbiAgICAgICAgICAgIGF0dHJzLnB1c2gocGF0aC52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0cisrO1xuICAgICAgICB9XG4gICAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIH1cbiAgICAgIHdvcmtpbmdwYXRoLnB1c2goYXR0cnMpO1xuICAgIH1cblxuICAgIGlmKGxpc3RlbmluZyAmJiBfLmluZGV4T2YodGVybWluYXRvcnMsIHRva2VuLnR5cGUudHlwZSkgPiAtMSB8fCBfLmluZGV4T2YodGVybWluYXRvcnMsIHRva2VuLnZhbHVlKSA+IC0xKXtcbiAgICAgIHdvcmtpbmdwYXRoID0gXy5yZWR1Y2Uod29ya2luZ3BhdGgsIGZ1bmN0aW9uKG1lbW8sIHBhdGhzKXtcbiAgICAgICAgdmFyIG5ld01lbW8gPSBbXTtcbiAgICAgICAgcGF0aHMgPSAoIV8uaXNBcnJheShwYXRocykpID8gW3BhdGhzXSA6IHBhdGhzO1xuICAgICAgICBfLmVhY2gocGF0aHMsIGZ1bmN0aW9uKHBhdGgpe1xuICAgICAgICAgIF8uZWFjaChtZW1vLCBmdW5jdGlvbihtZW0pe1xuICAgICAgICAgICAgbmV3TWVtby5wdXNoKF8uY29tcGFjdChbbWVtLCBwYXRoXSkuam9pbignLicpLnJlcGxhY2UoJy5bJywgJ1snKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbmV3TWVtbztcbiAgICAgIH0sIFsnJ10pO1xuICAgICAgZmluaXNoZWRQYXRocyA9IF8uY29tcGFjdChfLnVuaW9uKGZpbmlzaGVkUGF0aHMsIHdvcmtpbmdwYXRoKSk7XG4gICAgICB3b3JraW5ncGF0aCA9IFtdO1xuICAgICAgbGlzdGVuaW5nLS07XG4gICAgfVxuXG4gIH0gd2hpbGUodG9rZW4uc3RhcnQgIT09IHRva2VuLmVuZCk7XG5cbiAgY29uc29sZS5sb2coJ0NPTVBVVEVEIFBST1BFUlRZJywgbmFtZSwgJ3JlZ2lzdGVyZWQgd2l0aCB0aGVzZSBkZXBlbmRhbmN5IHBhdGhzOicsIGZpbmlzaGVkUGF0aHMpO1xuXG4gIC8vIFJldHVybiB0aGUgZGVwZW5kYW5jaWVzIGxpc3RcbiAgcmV0dXJuIHByb3AuX19wYXJhbXMgPSBmaW5pc2hlZFBhdGhzO1xuXG59XG5cbmV4cG9ydCBkZWZhdWx0IHsgY29tcGlsZTogY29tcGlsZSB9OyIsIi8vIFJlYm91bmQgQ29tcGlsZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IHsgY29tcGlsZSBhcyBodG1sYmFyc0NvbXBpbGUsIGNvbXBpbGVTcGVjIGFzIGh0bWxiYXJzQ29tcGlsZVNwZWMgfSBmcm9tIFwiaHRtbGJhcnMtY29tcGlsZXIvY29tcGlsZXJcIjtcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcImh0bWxiYXJzLXV0aWwvb2JqZWN0LXV0aWxzXCI7XG5pbXBvcnQgRE9NSGVscGVyIGZyb20gXCJtb3JwaC9kb20taGVscGVyXCI7XG5pbXBvcnQgaGVscGVycyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaGVscGVyc1wiO1xuaW1wb3J0IGhvb2tzIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9ob29rc1wiO1xuXG5mdW5jdGlvbiBjb21waWxlKHN0cmluZywgb3B0aW9ucyl7XG4gIC8vIEVuc3VyZSB3ZSBoYXZlIGEgd2VsbC1mb3JtZWQgb2JqZWN0IGFzIHZhciBvcHRpb25zXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLmhlbHBlcnMgPSBvcHRpb25zLmhlbHBlcnMgfHwge307XG4gIG9wdGlvbnMuaG9va3MgPSBvcHRpb25zLmhvb2tzIHx8IHt9O1xuXG4gIC8vIE1lcmdlIG91ciBkZWZhdWx0IGhlbHBlcnMgd2l0aCB1c2VyIHByb3ZpZGVkIGhlbHBlcnNcbiAgb3B0aW9ucy5oZWxwZXJzID0gbWVyZ2UoaGVscGVycywgb3B0aW9ucy5oZWxwZXJzKTtcbiAgb3B0aW9ucy5ob29rcyA9IG1lcmdlKGhvb2tzLCBvcHRpb25zLmhvb2tzKTtcblxuICAvLyBDb21waWxlIG91ciB0ZW1wbGF0ZSBmdW5jdGlvblxuICB2YXIgZnVuYyA9IGh0bWxiYXJzQ29tcGlsZShzdHJpbmcsIHtcbiAgICBoZWxwZXJzOiBvcHRpb25zLmhlbHBlcnMsXG4gICAgaG9va3M6IG9wdGlvbnMuaG9va3NcbiAgfSk7XG5cbiAgZnVuYy5fcmVuZGVyID0gZnVuYy5yZW5kZXI7XG5cbiAgLy8gUmV0dXJuIGEgd3JhcHBlciBmdW5jdGlvbiB0aGF0IHdpbGwgbWVyZ2UgdXNlciBwcm92aWRlZCBoZWxwZXJzIHdpdGggb3VyIGRlZmF1bHRzXG4gIGZ1bmMucmVuZGVyID0gZnVuY3Rpb24oZGF0YSwgZW52LCBjb250ZXh0KXtcbiAgICAvLyBFbnN1cmUgd2UgaGF2ZSBhIHdlbGwtZm9ybWVkIG9iamVjdCBhcyB2YXIgb3B0aW9uc1xuICAgIGVudiA9IGVudiB8fCB7fTtcbiAgICBlbnYuaGVscGVycyA9IGVudi5oZWxwZXJzIHx8IHt9O1xuICAgIGVudi5ob29rcyA9IGVudi5ob29rcyB8fCB7fTtcbiAgICBlbnYuZG9tID0gZW52LmRvbSB8fCBuZXcgRE9NSGVscGVyKCk7XG5cbiAgICAvLyBNZXJnZSBvdXIgZGVmYXVsdCBoZWxwZXJzIGFuZCBob29rcyB3aXRoIHVzZXIgcHJvdmlkZWQgaGVscGVyc1xuICAgIGVudi5oZWxwZXJzID0gbWVyZ2UoaGVscGVycywgZW52LmhlbHBlcnMpO1xuICAgIGVudi5ob29rcyA9IG1lcmdlKGhvb2tzLCBlbnYuaG9va3MpO1xuXG4gICAgLy8gU2V0IGEgZGVmYXVsdCBjb250ZXh0IGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICBjb250ZXh0ID0gY29udGV4dCB8fCBkb2N1bWVudC5ib2R5O1xuXG4gICAgLy8gQ2FsbCBvdXIgZnVuYyB3aXRoIG1lcmdlZCBoZWxwZXJzIGFuZCBob29rc1xuICAgIHJldHVybiBmdW5jLl9yZW5kZXIoZGF0YSwgZW52LCBjb250ZXh0KTtcbiAgfTtcblxuICBoZWxwZXJzLnJlZ2lzdGVyUGFydGlhbCggb3B0aW9ucy5uYW1lLCBmdW5jKTtcblxuICByZXR1cm4gZnVuYztcblxufVxuXG5leHBvcnQgeyBjb21waWxlIH07XG4iLCIvLyBSZWJvdW5kIENvbXBvbmVudFxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgRE9NSGVscGVyIGZyb20gXCJtb3JwaC9kb20taGVscGVyXCI7XG5pbXBvcnQgaG9va3MgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hvb2tzXCI7XG5pbXBvcnQgaGVscGVycyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaGVscGVyc1wiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5pbXBvcnQgeyBNb2RlbCB9IGZyb20gXCJyZWJvdW5kLWRhdGEvcmVib3VuZC1kYXRhXCI7XG5cbi8vIElmIEJhY2tib25lIGhhc24ndCBiZWVuIHN0YXJ0ZWQgeWV0LCB0aHJvdyBlcnJvclxuaWYoIXdpbmRvdy5CYWNrYm9uZSkgdGhyb3cgXCJCYWNrYm9uZSBtdXN0IGJlIG9uIHRoZSBwYWdlIGZvciBSZWJvdW5kIHRvIGxvYWQuXCI7XG5cbi8vIFJldHVybnMgdHJ1ZSBpZiBgc3RyYCBzdGFydHMgd2l0aCBgdGVzdGBcbmZ1bmN0aW9uIHN0YXJ0c1dpdGgoc3RyLCB0ZXN0KXtcbiAgaWYoc3RyID09PSB0ZXN0KSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIHN0ci5zdWJzdHJpbmcoMCwgdGVzdC5sZW5ndGgrMSkgPT09IHRlc3QrJy4nO1xufVxuXG5mdW5jdGlvbiByZW5kZXJDYWxsYmFjaygpe1xuICB2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX3RvUmVuZGVyLmxlbmd0aDtcbiAgZGVsZXRlIHRoaXMuX3JlbmRlclRpbWVvdXQ7XG4gIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICB0aGlzLl90b1JlbmRlci5zaGlmdCgpLm5vdGlmeSgpO1xuICB9XG4gIHRoaXMuX3RvUmVuZGVyLmFkZGVkID0ge307XG59XG5cbnZhciBlbnYgPSB7XG4gIGhlbHBlcnM6IGhlbHBlcnMuaGVscGVycyxcbiAgaG9va3M6IGhvb2tzXG59O1xuXG5lbnYuaHlkcmF0ZSA9IGZ1bmN0aW9uIGh5ZHJhdGUoc3BlYywgb3B0aW9ucyl7XG4gIC8vIFJldHVybiBhIHdyYXBwZXIgZnVuY3Rpb24gdGhhdCB3aWxsIG1lcmdlIHVzZXIgcHJvdmlkZWQgaGVscGVycyBhbmQgaG9va3Mgd2l0aCBvdXIgZGVmYXVsdHNcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEsIG9wdGlvbnMpe1xuICAgIC8vIEVuc3VyZSB3ZSBoYXZlIGEgd2VsbC1mb3JtZWQgb2JqZWN0IGFzIHZhciBvcHRpb25zXG4gICAgdmFyIGVudiA9IG9wdGlvbnMgfHwge30sXG4gICAgICAgIGNvbnRleHRFbGVtZW50ID0gZGF0YS5lbCB8fCBkb2N1bWVudC5ib2R5O1xuICAgIGVudi5oZWxwZXJzID0gZW52LmhlbHBlcnMgfHwge307XG4gICAgZW52Lmhvb2tzID0gZW52Lmhvb2tzIHx8IHt9O1xuICAgIGVudi5kb20gPSBlbnYuZG9tIHx8IG5ldyBET01IZWxwZXIoKTtcblxuICAgIC8vIE1lcmdlIG91ciBkZWZhdWx0IGhlbHBlcnMgYW5kIGhvb2tzIHdpdGggdXNlciBwcm92aWRlZCBoZWxwZXJzXG4gICAgZW52LmhlbHBlcnMgPSBfLmRlZmF1bHRzKGVudi5oZWxwZXJzLCBoZWxwZXJzLmhlbHBlcnMpO1xuICAgIGVudi5ob29rcyA9IF8uZGVmYXVsdHMoZW52Lmhvb2tzLCBob29rcyk7XG5cbiAgICAvLyBDYWxsIG91ciBmdW5jIHdpdGggbWVyZ2VkIGhlbHBlcnMgYW5kIGhvb2tzXG4gICAgcmV0dXJuIHNwZWMucmVuZGVyKGRhdGEsIGVudiwgY29udGV4dEVsZW1lbnQpO1xuICB9O1xufTtcblxuLy8gTmV3IEJhY2tib25lIENvbXBvbmVudFxudmFyIENvbXBvbmVudCA9IE1vZGVsLmV4dGVuZCh7XG5cbiAgaXNDb21wb25lbnQ6IHRydWUsXG5cbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKG9wdGlvbnMpe1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIF8uYmluZEFsbCh0aGlzLCAnX19jYWxsT25Db21wb25lbnQnKTtcbiAgICB0aGlzLmNpZCA9IF8udW5pcXVlSWQoJ2NvbXBvbmVudCcpO1xuICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuICAgIHRoaXMuY2hhbmdlZCA9IHt9O1xuICAgIHRoaXMuaGVscGVycyA9IHt9O1xuICAgIHRoaXMuX19wYXJlbnRfXyA9IHRoaXMuX19yb290X18gPSB0aGlzO1xuICAgIHRoaXMubGlzdGVuVG8odGhpcywgJ2FsbCcsIHRoaXMuX29uQ2hhbmdlKTtcblxuICAgIC8vIFRha2Ugb3VyIHBhcnNlZCBkYXRhIGFuZCBhZGQgaXQgdG8gb3VyIGJhY2tib25lIGRhdGEgc3RydWN0dXJlLiBEb2VzIGEgZGVlcCBkZWZhdWx0cyBzZXQuXG4gICAgLy8gSW4gdGhlIG1vZGVsLCBwcmltYXRpdmVzIChhcnJheXMsIG9iamVjdHMsIGV0YykgYXJlIGNvbnZlcnRlZCB0byBCYWNrYm9uZSBPYmplY3RzXG4gICAgLy8gRnVuY3Rpb25zIGFyZSBjb21waWxlZCB0byBmaW5kIHRoZWlyIGRlcGVuZGFuY2llcyBhbmQgYWRkZWQgYXMgY29tcHV0ZWQgcHJvcGVydGllc1xuICAgIC8vIFNldCBvdXIgY29tcG9uZW50J3MgY29udGV4dCB3aXRoIHRoZSBwYXNzZWQgZGF0YSBtZXJnZWQgd2l0aCB0aGUgY29tcG9uZW50J3MgZGVmYXVsdHNcbiAgICB0aGlzLnNldCgodGhpcy5kZWZhdWx0cyB8fCB7fSksIHtkZWZhdWx0czogdHJ1ZX0pO1xuICAgIHRoaXMuc2V0KChvcHRpb25zLmRhdGEgfHwge30pKTtcblxuICAgIC8vIENhbGwgb24gY29tcG9uZW50IGlzIHVzZWQgYnkgdGhlIHt7b259fSBoZWxwZXIgdG8gY2FsbCBhbGwgZXZlbnQgY2FsbGJhY2tzIGluIHRoZSBzY29wZSBvZiB0aGUgY29tcG9uZW50XG4gICAgdGhpcy5oZWxwZXJzLl9fY2FsbE9uQ29tcG9uZW50ID0gdGhpcy5fX2NhbGxPbkNvbXBvbmVudDtcblxuXG4gICAgLy8gR2V0IGFueSBhZGRpdGlvbmFsIHJvdXRlcyBwYXNzZWQgaW4gZnJvbSBvcHRpb25zXG4gICAgdGhpcy5yb3V0ZXMgPSAgXy5kZWZhdWx0cygob3B0aW9ucy5yb3V0ZXMgfHwge30pLCB0aGlzLnJvdXRlcyk7XG4gICAgLy8gRW5zdXJlIHRoYXQgYWxsIHJvdXRlIGZ1bmN0aW9ucyBleGlzdFxuICAgIF8uZWFjaCh0aGlzLnJvdXRlcywgZnVuY3Rpb24odmFsdWUsIGtleSwgcm91dGVzKXtcbiAgICAgICAgaWYodHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyl7IHRocm93KCdGdW5jdGlvbiBuYW1lIHBhc3NlZCB0byByb3V0ZXMgaW4gICcgKyB0aGlzLl9fbmFtZSArICcgY29tcG9uZW50IG11c3QgYmUgYSBzdHJpbmchJyk7IH1cbiAgICAgICAgaWYoIXRoaXNbdmFsdWVdKXsgdGhyb3coJ0NhbGxiYWNrIGZ1bmN0aW9uICcrdmFsdWUrJyBkb2VzIG5vdCBleGlzdCBvbiB0aGUgICcgKyB0aGlzLl9fbmFtZSArICcgY29tcG9uZW50IScpOyB9XG4gICAgfSwgdGhpcyk7XG5cblxuICAgIC8vIFNldCBvdXIgb3V0bGV0IGFuZCB0ZW1wbGF0ZSBpZiB3ZSBoYXZlIG9uZVxuICAgIHRoaXMuZWwgPSBvcHRpb25zLm91dGxldCB8fCB1bmRlZmluZWQ7XG4gICAgdGhpcy4kZWwgPSAoXy5pc1VuZGVmaW5lZCh3aW5kb3cuQmFja2JvbmUuJCkpID8gZmFsc2UgOiB3aW5kb3cuQmFja2JvbmUuJCh0aGlzLmVsKTtcblxuICAgIGlmKF8uaXNGdW5jdGlvbih0aGlzLmNyZWF0ZWRDYWxsYmFjaykpe1xuICAgICAgdGhpcy5jcmVhdGVkQ2FsbGJhY2suY2FsbCh0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBUYWtlIG91ciBwcmVjb21waWxlZCB0ZW1wbGF0ZSBhbmQgaHlkcmF0ZXMgaXQuIFdoZW4gUmVib3VuZCBDb21waWxlciBpcyBpbmNsdWRlZCwgY2FuIGJlIGEgaGFuZGxlYmFycyB0ZW1wbGF0ZSBzdHJpbmcuXG4gICAgLy8gVE9ETzogQ2hlY2sgaWYgdGVtcGxhdGUgaXMgYSBzdHJpbmcsIGFuZCBpZiB0aGUgY29tcGlsZXIgZXhpc3RzIG9uIHRoZSBwYWdlLCBhbmQgY29tcGlsZSBpZiBuZWVkZWRcbiAgICBpZighb3B0aW9ucy50ZW1wbGF0ZSAmJiAhdGhpcy50ZW1wbGF0ZSl7IHRocm93KCdUZW1wbGF0ZSBtdXN0IHByb3ZpZGVkIGZvciAnICsgdGhpcy5fX25hbWUgKyAnIGNvbXBvbmVudCEnKTsgfVxuICAgIHRoaXMudGVtcGxhdGUgPSBvcHRpb25zLnRlbXBsYXRlIHx8IHRoaXMudGVtcGxhdGU7XG4gICAgdGhpcy50ZW1wbGF0ZSA9ICh0eXBlb2YgdGhpcy50ZW1wbGF0ZSA9PT0gJ29iamVjdCcpID8gZW52Lmh5ZHJhdGUodGhpcy50ZW1wbGF0ZSkgOiB0aGlzLnRlbXBsYXRlO1xuXG5cbiAgICAvLyBSZW5kZXIgb3VyIGRvbSBhbmQgcGxhY2UgdGhlIGRvbSBpbiBvdXIgY3VzdG9tIGVsZW1lbnRcbiAgICB0aGlzLmVsLmFwcGVuZENoaWxkKHRoaXMudGVtcGxhdGUodGhpcywge2hlbHBlcnM6IHRoaXMuaGVscGVyc30sIHRoaXMuZWwpKTtcblxuICAgIHRoaXMuaW5pdGlhbGl6ZSgpO1xuXG4gIH0sXG5cbiAgJDogZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICBpZighdGhpcy4kZWwpe1xuICAgICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ05vIERPTSBtYW5pcHVsYXRpb24gbGlicmFyeSBvbiB0aGUgcGFnZSEnKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuJGVsLmZpbmQoc2VsZWN0b3IpO1xuICB9LFxuXG4gIC8vIFRyaWdnZXIgYWxsIGV2ZW50cyBvbiBib3RoIHRoZSBjb21wb25lbnQgYW5kIHRoZSBlbGVtZW50XG4gIHRyaWdnZXI6IGZ1bmN0aW9uKGV2ZW50TmFtZSl7XG4gICAgaWYodGhpcy5lbCl7XG4gICAgICAkKHRoaXMuZWwpLnRyaWdnZXIoZXZlbnROYW1lLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgICBCYWNrYm9uZS5Nb2RlbC5wcm90b3R5cGUudHJpZ2dlci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuXG4gIF9fY2FsbE9uQ29tcG9uZW50OiBmdW5jdGlvbihuYW1lLCBldmVudCl7XG4gICAgaWYoIV8uaXNGdW5jdGlvbih0aGlzW25hbWVdKSl7IHRocm93IFwiRVJST1I6IE5vIG1ldGhvZCBuYW1lZCBcIiArIG5hbWUgKyBcIiBvbiBjb21wb25lbnQgXCIgKyB0aGlzLl9fbmFtZSArIFwiIVwiOyB9XG4gICAgcmV0dXJuIHRoaXNbbmFtZV0uY2FsbCh0aGlzLCBldmVudCk7XG4gIH0sXG5cbiAgX29uQXR0cmlidXRlQ2hhbmdlOiBmdW5jdGlvbihhdHRyTmFtZSwgb2xkVmFsLCBuZXdWYWwpe1xuICAgIC8vIENvbW1lbnRlZCBvdXQgYmVjYXVzZSB0cmFja2luZyBhdHRyaWJ1dGUgY2hhbmdlcyBhbmQgbWFraW5nIHN1cmUgdGhleSBkb250IGluZmluaXRlIGxvb3AgaXMgaGFyZC5cbiAgICAvLyBUT0RPOiBNYWtlIHdvcmsuXG4gICAgLy8gdHJ5eyBuZXdWYWwgPSBKU09OLnBhcnNlKG5ld1ZhbCk7IH0gY2F0Y2ggKGUpeyBuZXdWYWwgPSBuZXdWYWw7IH1cbiAgICAvL1xuICAgIC8vIC8vIGRhdGEgYXR0cmlidXRlcyBzaG91bGQgYmUgcmVmZXJhbmNlZCBieSB0aGVpciBjYW1lbCBjYXNlIG5hbWVcbiAgICAvLyBhdHRyTmFtZSA9IGF0dHJOYW1lLnJlcGxhY2UoL15kYXRhLS9nLCBcIlwiKS5yZXBsYWNlKC8tKFthLXpdKS9nLCBmdW5jdGlvbiAoZykgeyByZXR1cm4gZ1sxXS50b1VwcGVyQ2FzZSgpOyB9KTtcbiAgICAvL1xuICAgIC8vIG9sZFZhbCA9IHRoaXMuZ2V0KGF0dHJOYW1lKTtcbiAgICAvL1xuICAgIC8vIGlmKG5ld1ZhbCA9PT0gbnVsbCl7IHRoaXMudW5zZXQoYXR0ck5hbWUpOyB9XG4gICAgLy9cbiAgICAvLyAvLyBJZiBvbGRWYWwgaXMgYSBudW1iZXIsIGFuZCBuZXdWYWwgaXMgb25seSBudW1lcmljYWwsIHByZXNlcnZlIHR5cGVcbiAgICAvLyBpZihfLmlzTnVtYmVyKG9sZFZhbCkgJiYgXy5pc1N0cmluZyhuZXdWYWwpICYmIG5ld1ZhbC5tYXRjaCgvXlswLTldKiQvaSkpe1xuICAgIC8vICAgbmV3VmFsID0gcGFyc2VJbnQobmV3VmFsKTtcbiAgICAvLyB9XG4gICAgLy9cbiAgICAvLyBlbHNleyB0aGlzLnNldChhdHRyTmFtZSwgbmV3VmFsLCB7cXVpZXQ6IHRydWV9KTsgfVxuICB9LFxuXG5cbiAgX29uQ2hhbmdlOiBmdW5jdGlvbih0eXBlLCBtb2RlbCwgY29sbGVjdGlvbiwgb3B0aW9ucyl7XG4gICAgdmFyIHNob3J0Y2lyY3VpdCA9IHsgY2hhbmdlOiAxLCBzb3J0OiAxLCByZXF1ZXN0OiAxLCBkZXN0cm95OiAxLCBzeW5jOiAxLCBlcnJvcjogMSwgaW52YWxpZDogMSwgcm91dGU6IDEsIGRpcnR5OiAxIH07XG4gICAgaWYoIHNob3J0Y2lyY3VpdFt0eXBlXSApIHJldHVybjtcblxuICAgIHZhciBkYXRhLCBjaGFuZ2VkO1xuICAgIG1vZGVsIHx8IChtb2RlbCA9IHt9KTtcbiAgICBjb2xsZWN0aW9uIHx8IChjb2xsZWN0aW9uID0ge30pO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgIWNvbGxlY3Rpb24uaXNEYXRhICYmIChvcHRpb25zID0gY29sbGVjdGlvbikgJiYgKGNvbGxlY3Rpb24gPSBtb2RlbCk7XG4gICAgdGhpcy5fdG9SZW5kZXIgfHwgKHRoaXMuX3RvUmVuZGVyID0gW10pO1xuXG4gICAgaWYoICh0eXBlID09PSAncmVzZXQnICYmIG9wdGlvbnMucHJldmlvdXNBdHRyaWJ1dGVzKSB8fCB0eXBlLmluZGV4T2YoJ2NoYW5nZTonKSAhPT0gLTEpe1xuICAgICAgZGF0YSA9IG1vZGVsO1xuICAgICAgY2hhbmdlZCA9IG1vZGVsLmNoYW5nZWRBdHRyaWJ1dGVzKCk7XG4gICAgfVxuICAgIGVsc2UgaWYodHlwZSA9PT0gJ2FkZCcgfHwgdHlwZSA9PT0gJ3JlbW92ZScgfHwgKHR5cGUgPT09ICdyZXNldCcgJiYgb3B0aW9ucy5wcmV2aW91c01vZGVscykpe1xuICAgICAgZGF0YSA9IGNvbGxlY3Rpb247XG4gICAgICBjaGFuZ2VkID0ge307XG4gICAgICBjaGFuZ2VkW2RhdGEuX19wYXRoKCldID0gZGF0YTtcbiAgICB9XG5cbiAgICBpZighZGF0YSB8fCAhY2hhbmdlZCkgcmV0dXJuO1xuXG4gICAgdmFyIHB1c2ggPSBmdW5jdGlvbihhcnIpe1xuICAgICAgdmFyIGksIGxlbiA9IGFyci5sZW5ndGg7XG4gICAgICB0aGlzLmFkZGVkIHx8ICh0aGlzLmFkZGVkID0ge30pO1xuICAgICAgZm9yKGk9MDtpPGxlbjtpKyspe1xuICAgICAgICBpZih0aGlzLmFkZGVkW2FycltpXS5jaWRdKSBjb250aW51ZTtcbiAgICAgICAgdGhpcy5hZGRlZFthcnJbaV0uY2lkXSA9IDE7XG4gICAgICAgIHRoaXMucHVzaChhcnJbaV0pO1xuICAgICAgfVxuICAgIH07XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzO1xuICAgIHZhciBiYXNlUGF0aCA9IGRhdGEuX19wYXRoKCk7XG4gICAgdmFyIHBhcnRzID0gJC5zcGxpdFBhdGgoYmFzZVBhdGgpO1xuICAgIHZhciBrZXksIG9ic1BhdGgsIHBhdGgsIG9ic2VydmVycztcblxuICAgIC8vIEZvciBlYWNoIGNoYW5nZWQga2V5LCB3YWxrIGRvd24gdGhlIGRhdGEgdHJlZSBmcm9tIHRoZSByb290IHRvIHRoZSBkYXRhXG4gICAgLy8gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgZXZlbnQgYW5kIGFkZCBhbGwgcmVsZXZlbnQgY2FsbGJhY2tzIHRvIHRoaXNcbiAgICAvLyBvYmplY3QncyBfdG9SZW5kZXIgcXVldWUuXG4gICAgZG97XG4gICAgICBmb3Ioa2V5IGluIGNoYW5nZWQpe1xuICAgICAgICBwYXRoID0gKGJhc2VQYXRoICsgKGJhc2VQYXRoICYmICcuJykgKyBrZXkpLnJlcGxhY2UoY29udGV4dC5fX3BhdGgoKSwgJycpLnJlcGxhY2UoL1xcW1teXFxdXStcXF0vZywgXCIuQGVhY2hcIikucmVwbGFjZSgvXlxcLi8sICcnKTtcbiAgICAgICAgZm9yKG9ic1BhdGggaW4gY29udGV4dC5fX29ic2VydmVycyl7XG4gICAgICAgICAgb2JzZXJ2ZXJzID0gY29udGV4dC5fX29ic2VydmVyc1tvYnNQYXRoXTtcbiAgICAgICAgICBpZihzdGFydHNXaXRoKG9ic1BhdGgsIHBhdGgpIHx8IHN0YXJ0c1dpdGgocGF0aCwgb2JzUGF0aCkpe1xuICAgICAgICAgICAgLy8gSWYgdGhpcyBpcyBhIGNvbGxlY3Rpb24gZXZlbnQsIHRyaWdnZXIgZXZlcnl0aGluZywgb3RoZXJ3aXNlIG9ubHkgdHJpZ2dlciBwcm9wZXJ0eSBjaGFuZ2UgY2FsbGJhY2tzXG4gICAgICAgICAgICBpZihkYXRhLmlzQ29sbGVjdGlvbikgcHVzaC5jYWxsKHRoaXMuX3RvUmVuZGVyLCBvYnNlcnZlcnMuY29sbGVjdGlvbik7XG4gICAgICAgICAgICBwdXNoLmNhbGwodGhpcy5fdG9SZW5kZXIsIG9ic2VydmVycy5tb2RlbCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSB3aGlsZShjb250ZXh0ICE9PSBkYXRhICYmIChjb250ZXh0ID0gY29udGV4dC5nZXQocGFydHMuc2hpZnQoKSkpKVxuXG4gICAgLy8gUXVldWUgb3VyIHJlbmRlciBjYWxsYmFjayB0byBiZSBjYWxsZWQgYWZ0ZXIgdGhlIGN1cnJlbnQgY2FsbCBzdGFjayBoYXMgYmVlbiBleGhhdXN0ZWRcbiAgICB3aW5kb3cuY2xlYXJUaW1lb3V0KHRoaXMuX3JlbmRlclRpbWVvdXQpO1xuICAgIHRoaXMuX3JlbmRlclRpbWVvdXQgPSB3aW5kb3cuc2V0VGltZW91dChfLmJpbmQocmVuZGVyQ2FsbGJhY2ssIHRoaXMpLCAwKTtcbiAgfVxuXG59KTtcblxuQ29tcG9uZW50LmV4dGVuZD0gZnVuY3Rpb24ocHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpIHtcbiAgdmFyIHBhcmVudCA9IHRoaXMsXG4gICAgICBjaGlsZCxcbiAgICAgIHJlc2VydmVkTWV0aG9kcyA9IHtcbiAgICAgICAgJ3RyaWdnZXInOjEsICAgICdjb25zdHJ1Y3Rvcic6MSwgJ2dldCc6MSwgICAgICAgICAgICAgICAnc2V0JzoxLCAgICAgICAgICAgICAnaGFzJzoxLFxuICAgICAgICAnZXh0ZW5kJzoxLCAgICAgJ2VzY2FwZSc6MSwgICAgICAndW5zZXQnOjEsICAgICAgICAgICAgICdjbGVhcic6MSwgICAgICAgICAgICdjaWQnOjEsXG4gICAgICAgICdhdHRyaWJ1dGVzJzoxLCAnY2hhbmdlZCc6MSwgICAgICd0b0pTT04nOjEsICAgICAgICAgICAgJ3ZhbGlkYXRpb25FcnJvcic6MSwgJ2lzVmFsaWQnOjEsXG4gICAgICAgICdpc05ldyc6MSwgICAgICAnaGFzQ2hhbmdlZCc6MSwgICdjaGFuZ2VkQXR0cmlidXRlcyc6MSwgJ3ByZXZpb3VzJzoxLCAgICAgICAgJ3ByZXZpb3VzQXR0cmlidXRlcyc6MVxuICAgICAgfSxcbiAgICAgIGNvbmZpZ1Byb3BlcnRpZXMgPSB7XG4gICAgICAgICdyb3V0ZXMnOjEsICAgICAndGVtcGxhdGUnOjEsICAgICdkZWZhdWx0cyc6MSwgJ291dGxldCc6MSwgICAgICAgICAgJ3VybCc6MSxcbiAgICAgICAgJ3VybFJvb3QnOjEsICAgICdpZEF0dHJpYnV0ZSc6MSwgJ2lkJzoxLCAgICAgICAnY3JlYXRlZENhbGxiYWNrJzoxLCAnYXR0YWNoZWRDYWxsYmFjayc6MSxcbiAgICAgICAgJ2RldGFjaGVkQ2FsbGJhY2snOjFcbiAgICAgIH07XG5cbiAgcHJvdG9Qcm9wcy5kZWZhdWx0cyA9IHt9O1xuXG4gIC8vIEZvciBlYWNoIHByb3BlcnR5IHBhc3NlZCBpbnRvIG91ciBjb21wb25lbnQgYmFzZSBjbGFzc1xuICBfLmVhY2gocHJvdG9Qcm9wcywgZnVuY3Rpb24odmFsdWUsIGtleSwgcHJvdG9Qcm9wcyl7XG5cbiAgICAvLyBJZiBhIGNvbmZpZ3VyYXRpb24gcHJvcGVydHksIGlnbm9yZSBpdFxuICAgIGlmKGNvbmZpZ1Byb3BlcnRpZXNba2V5XSl7IHJldHVybjsgfVxuXG4gICAgLy8gSWYgYSBwcmltYXRpdmUgb3IgYmFja2JvbmUgdHlwZSBvYmplY3QsIG9yIGNvbXB1dGVkIHByb3BlcnR5IChmdW5jdGlvbiB3aGljaCB0YWtlcyBubyBhcmd1bWVudHMgYW5kIHJldHVybnMgYSB2YWx1ZSkgbW92ZSBpdCB0byBvdXIgZGVmYXVsdHNcbiAgICBpZighXy5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB2YWx1ZS5pc01vZGVsIHx8IHZhbHVlLmlzQ29tcG9uZW50IHx8IChfLmlzRnVuY3Rpb24odmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCAmJiB2YWx1ZS50b1N0cmluZygpLmluZGV4T2YoJ3JldHVybicpID4gLTEpKXtcbiAgICAgIHByb3RvUHJvcHMuZGVmYXVsdHNba2V5XSA9IHZhbHVlO1xuICAgICAgZGVsZXRlIHByb3RvUHJvcHNba2V5XTtcbiAgICB9XG5cbiAgICAvLyBJZiBhIHJlc2VydmVkIG1ldGhvZCwgeWVsbFxuICAgIGlmKHJlc2VydmVkTWV0aG9kc1trZXldKXsgdGhyb3cgXCJFUlJPUjogXCIgKyBrZXkgKyBcIiBpcyBhIHJlc2VydmVkIG1ldGhvZCBuYW1lIGluIFwiICsgc3RhdGljUHJvcHMuX19uYW1lICsgXCIhXCI7IH1cblxuICAgIC8vIEFsbCBvdGhlciB2YWx1ZXMgYXJlIGNvbXBvbmVudCBtZXRob2RzLCBsZWF2ZSB0aGVtIGJlIHVubGVzcyBhbHJlYWR5IGRlZmluZWQuXG5cbiAgfSwgdGhpcyk7XG5cbiAgLy8gSWYgZ2l2ZW4gYSBjb25zdHJ1Y3RvciwgdXNlIGl0LCBvdGhlcndpc2UgdXNlIHRoZSBkZWZhdWx0IG9uZSBkZWZpbmVkIGFib3ZlXG4gIGlmIChwcm90b1Byb3BzICYmIF8uaGFzKHByb3RvUHJvcHMsICdjb25zdHJ1Y3RvcicpKSB7XG4gICAgY2hpbGQgPSBwcm90b1Byb3BzLmNvbnN0cnVjdG9yO1xuICB9IGVsc2Uge1xuICAgIGNoaWxkID0gZnVuY3Rpb24oKXsgcmV0dXJuIHBhcmVudC5hcHBseSh0aGlzLCBhcmd1bWVudHMpOyB9O1xuICB9XG5cbiAgLy8gT3VyIGNsYXNzIHNob3VsZCBpbmhlcml0IGV2ZXJ5dGhpbmcgZnJvbSBpdHMgcGFyZW50LCBkZWZpbmVkIGFib3ZlXG4gIHZhciBTdXJyb2dhdGUgPSBmdW5jdGlvbigpeyB0aGlzLmNvbnN0cnVjdG9yID0gY2hpbGQ7IH07XG4gIFN1cnJvZ2F0ZS5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlO1xuICBjaGlsZC5wcm90b3R5cGUgPSBuZXcgU3Vycm9nYXRlKCk7XG5cbiAgLy8gRXh0ZW5kIG91ciBwcm90b3R5cGUgd2l0aCBhbnkgcmVtYWluaW5nIHByb3RvUHJvcHMsIG92ZXJyaXRpbmcgcHJlLWRlZmluZWQgb25lc1xuICBpZiAocHJvdG9Qcm9wcyl7IF8uZXh0ZW5kKGNoaWxkLnByb3RvdHlwZSwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpOyB9XG5cbiAgLy8gU2V0IG91ciBhbmNlc3RyeVxuICBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlO1xuXG4gIHJldHVybiBjaGlsZDtcbn07XG5cbkNvbXBvbmVudC5yZWdpc3RlciA9IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50KG5hbWUsIG9wdGlvbnMpIHtcbiAgdmFyIHNjcmlwdCA9IG9wdGlvbnMucHJvdG90eXBlO1xuICB2YXIgdGVtcGxhdGUgPSBvcHRpb25zLnRlbXBsYXRlO1xuICB2YXIgc3R5bGUgPSBvcHRpb25zLnN0eWxlO1xuXG4gIHZhciBjb21wb25lbnQgPSB0aGlzLmV4dGVuZChzY3JpcHQsIHsgX19uYW1lOiBuYW1lIH0pO1xuICB2YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSwge30pO1xuXG4gIHByb3RvLmNyZWF0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX19jb21wb25lbnRfXyA9IG5ldyBjb21wb25lbnQoe1xuICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgICAgb3V0bGV0OiB0aGlzLFxuICAgICAgZGF0YTogUmVib3VuZC5zZWVkRGF0YVxuICAgIH0pO1xuICB9O1xuXG4gIHByb3RvLmF0dGFjaGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICBzY3JpcHQuYXR0YWNoZWRDYWxsYmFjayAmJiBzY3JpcHQuYXR0YWNoZWRDYWxsYmFjay5jYWxsKHRoaXMuX19jb21wb25lbnRfXyk7XG4gIH07XG5cbiAgcHJvdG8uZGV0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgIHNjcmlwdC5kZXRhY2hlZENhbGxiYWNrICYmIHNjcmlwdC5kZXRhY2hlZENhbGxiYWNrLmNhbGwodGhpcy5fX2NvbXBvbmVudF9fKTtcbiAgICB0aGlzLl9fY29tcG9uZW50X18uZGVpbml0aWFsaXplKCk7XG4gIH07XG5cbiAgcHJvdG8uYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrID0gZnVuY3Rpb24oYXR0ck5hbWUsIG9sZFZhbCwgbmV3VmFsKSB7XG4gICAgdGhpcy5fX2NvbXBvbmVudF9fLl9vbkF0dHJpYnV0ZUNoYW5nZShhdHRyTmFtZSwgb2xkVmFsLCBuZXdWYWwpO1xuICAgIHNjcmlwdC5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgJiYgc2NyaXB0LmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjay5jYWxsKHRoaXMuX19jb21wb25lbnRfXywgYXR0ck5hbWUsIG9sZFZhbCwgbmV3VmFsKTtcbiAgfTtcblxuICByZXR1cm4gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KG5hbWUsIHsgcHJvdG90eXBlOiBwcm90byB9KTtcbn1cblxuXy5iaW5kQWxsKENvbXBvbmVudCwgJ3JlZ2lzdGVyJyk7XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBvbmVudDtcbiIsIi8vIFJlYm91bmQgQ29sbGVjdGlvblxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgTW9kZWwgZnJvbSBcInJlYm91bmQtZGF0YS9tb2RlbFwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cbmZ1bmN0aW9uIHBhdGhHZW5lcmF0b3IoY29sbGVjdGlvbil7XG4gIHJldHVybiBmdW5jdGlvbigpe1xuICAgIHJldHVybiBjb2xsZWN0aW9uLl9fcGF0aCgpICsgJ1snICsgY29sbGVjdGlvbi5pbmRleE9mKGNvbGxlY3Rpb24uX2J5SWRbdGhpcy5jaWRdKSArICddJztcbiAgfTtcbn1cblxudmFyIENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG5cbiAgaXNDb2xsZWN0aW9uOiB0cnVlLFxuICBpc0RhdGE6IHRydWUsXG5cbiAgbW9kZWw6IHRoaXMubW9kZWwgfHwgTW9kZWwsXG5cbiAgX19wYXRoOiBmdW5jdGlvbigpe3JldHVybiAnJzt9LFxuXG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihtb2RlbHMsIG9wdGlvbnMpe1xuICAgIG1vZGVscyB8fCAobW9kZWxzID0gW10pO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdGhpcy5fX29ic2VydmVycyA9IHt9O1xuICAgIHRoaXMuaGVscGVycyA9IHt9O1xuICAgIHRoaXMuY2lkID0gXy51bmlxdWVJZCgnY29sbGVjdGlvbicpO1xuXG4gICAgLy8gU2V0IGxpbmVhZ2VcbiAgICB0aGlzLnNldFBhcmVudCggb3B0aW9ucy5wYXJlbnQgfHwgdGhpcyApO1xuICAgIHRoaXMuc2V0Um9vdCggb3B0aW9ucy5yb290IHx8IHRoaXMgKTtcbiAgICB0aGlzLl9fcGF0aCA9IG9wdGlvbnMucGF0aCB8fCB0aGlzLl9fcGF0aDtcblxuICAgIEJhY2tib25lLkNvbGxlY3Rpb24uYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG4gICAgLy8gV2hlbiBhIG1vZGVsIGlzIHJlbW92ZWQgZnJvbSBpdHMgb3JpZ2luYWwgY29sbGVjdGlvbiwgZGVzdHJveSBpdFxuICAgIC8vIFRPRE86IEZpeCB0aGlzLiBDb21wdXRlZCBwcm9wZXJ0aWVzIG5vdyBzb21laG93IGFsbG93IGNvbGxlY3Rpb24gdG8gc2hhcmUgYSBtb2RlbC4gVGhleSBtYXkgYmUgcmVtb3ZlZCBmcm9tIG9uZSBidXQgbm90IHRoZSBvdGhlci4gVGhhdCBpcyBiYWQuXG4gICAgLy8gVGhlIGNsb25lID0gZmFsc2Ugb3B0aW9ucyBpcyB0aGUgY3VscHJpdC4gRmluZCBhIGJldHRlciB3YXkgdG8gY29weSBhbGwgb2YgdGhlIGNvbGxlY3Rpb25zIGN1c3RvbSBhdHRyaWJ1dGVzIG92ZXIgdG8gdGhlIGNsb25lLlxuICAgIHRoaXMub24oJ3JlbW92ZScsIGZ1bmN0aW9uKG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKXtcbiAgICAgIC8vIG1vZGVsLmRlaW5pdGlhbGl6ZSgpO1xuICAgIH0pO1xuXG4gIH0sXG5cbiAgZ2V0OiBmdW5jdGlvbihrZXksIG9wdGlvbnMpe1xuXG4gICAgLy8gSWYgdGhlIGtleSBpcyBhIG51bWJlciBvciBvYmplY3QsIGRlZmF1bHQgdG8gYmFja2JvbmUncyBjb2xsZWN0aW9uIGdldFxuICAgIGlmKHR5cGVvZiBrZXkgPT0gJ251bWJlcicgfHwgdHlwZW9mIGtleSA9PSAnb2JqZWN0Jyl7XG4gICAgICByZXR1cm4gQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0LmNhbGwodGhpcywga2V5KTtcbiAgICB9XG5cbiAgICAvLyBJZiBrZXkgaXMgbm90IGEgc3RyaW5nLCByZXR1cm4gdW5kZWZpbmVkXG4gICAgaWYgKCFfLmlzU3RyaW5nKGtleSkpIHJldHVybiB2b2lkIDA7XG5cbiAgICAvLyBTcGxpdCB0aGUgcGF0aCBhdCBhbGwgJy4nLCAnWycgYW5kICddJyBhbmQgZmluZCB0aGUgdmFsdWUgcmVmZXJhbmNlZC5cbiAgICB2YXIgcGFydHMgID0gJC5zcGxpdFBhdGgoa2V5KSxcbiAgICAgICAgcmVzdWx0ID0gdGhpcyxcbiAgICAgICAgbD1wYXJ0cy5sZW5ndGgsXG4gICAgICAgIGk9MDtcbiAgICAgICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICAgIGlmKF8uaXNVbmRlZmluZWQoa2V5KSB8fCBfLmlzTnVsbChrZXkpKSByZXR1cm4ga2V5O1xuICAgIGlmKGtleSA9PT0gJycgfHwgcGFydHMubGVuZ3RoID09PSAwKSByZXR1cm4gcmVzdWx0O1xuXG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAoIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIC8vIElmIHJldHVybmluZyByYXcsIGFsd2F5cyByZXR1cm4gdGhlIGZpcnN0IGNvbXB1dGVkIHByb3BlcnR5IGZvdW5kLiBJZiB1bmRlZmluZWQsIHlvdSdyZSBkb25lLlxuICAgICAgICBpZihyZXN1bHQgJiYgcmVzdWx0LmlzQ29tcHV0ZWRQcm9wZXJ0eSAmJiBvcHRpb25zLnJhdykgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgaWYocmVzdWx0ICYmIHJlc3VsdC5pc0NvbXB1dGVkUHJvcGVydHkpIHJlc3VsdCA9IHJlc3VsdC52YWx1ZSgpO1xuICAgICAgICBpZihfLmlzVW5kZWZpbmVkKHJlc3VsdCkgfHwgXy5pc051bGwocmVzdWx0KSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgaWYocGFydHNbaV0gPT09ICdAcGFyZW50JykgcmVzdWx0ID0gcmVzdWx0Ll9fcGFyZW50X187XG4gICAgICAgIGVsc2UgaWYocmVzdWx0LmlzQ29sbGVjdGlvbikgcmVzdWx0ID0gcmVzdWx0Lm1vZGVsc1twYXJ0c1tpXV07XG4gICAgICAgIGVsc2UgaWYocmVzdWx0LmlzTW9kZWwpIHJlc3VsdCA9IHJlc3VsdC5hdHRyaWJ1dGVzW3BhcnRzW2ldXTtcbiAgICAgICAgZWxzZSBpZihyZXN1bHQuaGFzT3duUHJvcGVydHkocGFydHNbaV0pKSByZXN1bHQgPSByZXN1bHRbcGFydHNbaV1dO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5ICYmICFvcHRpb25zLnJhdykgcmVzdWx0ID0gcmVzdWx0LnZhbHVlKCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuXG4gIHNldDogZnVuY3Rpb24obW9kZWxzLCBvcHRpb25zKXtcbiAgICB2YXIgbmV3TW9kZWxzID0gW10sXG4gICAgICAgIGxpbmVhZ2UgPSB7XG4gICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgIHJvb3Q6IHRoaXMuX19yb290X18sXG4gICAgICAgICAgcGF0aDogcGF0aEdlbmVyYXRvcih0aGlzKSxcbiAgICAgICAgICBzaWxlbnQ6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge30sXG5cbiAgICAvLyBJZiBubyBtb2RlbHMgcGFzc2VkLCBpbXBsaWVzIGFuIGVtcHR5IGFycmF5XG4gICAgbW9kZWxzIHx8IChtb2RlbHMgPSBbXSk7XG5cbiAgICAvLyBJZiBtb2RlbHMgaXMgYSBzdHJpbmcsIGNhbGwgc2V0IGF0IHRoYXQgcGF0aFxuICAgIGlmKF8uaXNTdHJpbmcobW9kZWxzKSkgcmV0dXJuIHRoaXMuZ2V0KCQuc3BsaXRQYXRoKG1vZGVscylbMF0pLnNldCgkLnNwbGl0UGF0aChtb2RlbHMpLnNwbGljZSgxLCBtb2RlbHMubGVuZ3RoKS5qb2luKCcuJyksIG9wdGlvbnMpO1xuICAgIGlmKCFfLmlzT2JqZWN0KG1vZGVscykpIHJldHVybiBjb25zb2xlLmVycm9yKCdDb2xsZWN0aW9uLnNldCBtdXN0IGJlIHBhc3NlZCBhIE1vZGVsLCBPYmplY3QsIGFycmF5IG9yIE1vZGVscyBhbmQgT2JqZWN0cywgb3IgYW5vdGhlciBDb2xsZWN0aW9uJyk7XG5cbiAgICAvLyBJZiBhbm90aGVyIGNvbGxlY3Rpb24sIHRyZWF0IGxpa2UgYW4gYXJyYXlcbiAgICBtb2RlbHMgPSAobW9kZWxzLmlzQ29sbGVjdGlvbikgPyBtb2RlbHMubW9kZWxzIDogbW9kZWxzO1xuICAgIC8vIEVuc3VyZSBtb2RlbHMgaXMgYW4gYXJyYXlcbiAgICBtb2RlbHMgPSAoIV8uaXNBcnJheShtb2RlbHMpKSA/IFttb2RlbHNdIDogbW9kZWxzO1xuXG4gICAgLy8gSWYgdGhlIG1vZGVsIGFscmVhZHkgZXhpc3RzIGluIHRoaXMgY29sbGVjdGlvbiwgb3Igd2UgYXJlIHRvbGQgbm90IHRvIGNsb25lIGl0LCBsZXQgQmFja2JvbmUgaGFuZGxlIHRoZSBtZXJnZVxuICAgIC8vIE90aGVyd2lzZSwgY3JlYXRlIG91ciBjb3B5IG9mIHRoaXMgbW9kZWwsIGdpdmUgdGhlbSB0aGUgc2FtZSBjaWQgc28gb3VyIGhlbHBlcnMgdHJlYXQgdGhlbSBhcyB0aGUgc2FtZSBvYmplY3RcbiAgICBfLmVhY2gobW9kZWxzLCBmdW5jdGlvbihkYXRhLCBpbmRleCl7XG4gICAgICBpZihkYXRhLmlzTW9kZWwgJiYgb3B0aW9ucy5jbG9uZSA9PT0gZmFsc2UgfHwgdGhpcy5fYnlJZFtkYXRhLmNpZF0pIHJldHVybiBuZXdNb2RlbHNbaW5kZXhdID0gZGF0YTtcbiAgICAgIG5ld01vZGVsc1tpbmRleF0gPSBuZXcgdGhpcy5tb2RlbChkYXRhLCBfLmRlZmF1bHRzKGxpbmVhZ2UsIG9wdGlvbnMpKTtcbiAgICAgIGRhdGEuaXNNb2RlbCAmJiAobmV3TW9kZWxzW2luZGV4XS5jaWQgPSBkYXRhLmNpZCk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICAvLyBFbnN1cmUgdGhhdCB0aGlzIGVsZW1lbnQgbm93IGtub3dzIHRoYXQgaXQgaGFzIGNoaWxkcmVuIG5vdy4gV2l0aG91dCB0aGlzIGN5Y2xpYyBkZXBlbmRhbmNpZXMgY2F1c2UgaXNzdWVzXG4gICAgdGhpcy5faGFzQW5jZXN0cnkgfHwgKHRoaXMuX2hhc0FuY2VzdHJ5ID0gbmV3TW9kZWxzLmxlbmd0aCA+IDApO1xuXG4gICAgLy8gQ2FsbCBvcmlnaW5hbCBzZXQgZnVuY3Rpb24gd2l0aCBtb2RlbCBkdXBsaWNhdGVzXG4gICAgcmV0dXJuIEJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLnNldC5jYWxsKHRoaXMsIG5ld01vZGVscywgb3B0aW9ucyk7XG5cbiAgfVxuXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgQ29sbGVjdGlvbjtcbiIsIi8vIFJlYm91bmQgUHJlY29tcGlsZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IHsgY29tcGlsZSBhcyBodG1sYmFyc0NvbXBpbGUsIGNvbXBpbGVTcGVjIGFzIGh0bWxiYXJzQ29tcGlsZVNwZWMgfSBmcm9tIFwiaHRtbGJhcnNcIjtcblxuLy8gUmVtb3ZlIHRoZSBjb250ZW50cyBvZiB0aGUgY29tcG9uZW50J3MgYHNjcmlwdGAgdGFnLlxuZnVuY3Rpb24gZ2V0U2NyaXB0KHN0cil7XG4gIHJldHVybiAoc3RyLmluZGV4T2YoJzxzY3JpcHQ+JykgPiAtMSAmJiBzdHIuaW5kZXhPZignPC9zY3JpcHQ+JykgPiAtMSkgPyAnKGZ1bmN0aW9uKCl7JyArIHN0ci5yZXBsYWNlKC8oLio8c2NyaXB0PikoLiopKDxcXC9zY3JpcHQ+LiopL2lnLCAnJDInKSArICd9KSgpJyA6ICd7fSc7XG59XG5cbi8vIFJlbW92ZSB0aGUgY29udGVudHMgb2YgdGhlIGNvbXBvbmVudCdzIGBzdHlsZWAgdGFnLlxuZnVuY3Rpb24gZ2V0U3R5bGUoc3RyKXtcbiAgcmV0dXJuIChzdHIuaW5kZXhPZignPHN0eWxlPicpID4gLTEgJiYgc3RyLmluZGV4T2YoJzwvc3R5bGU+JykgPiAtMSkgPyBzdHIucmVwbGFjZSgvKC4qPHN0eWxlPikoLiopKDxcXC9zdHlsZT4uKikvaWcsICckMicpLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKSA6ICcnO1xufVxuXG4vLyBSZW1vdmUgdGhlIGNvbnRlbnRzIG9mIHRoZSBjb21wb25lbnQncyBgdGVtcGxhdGVgIHRhZy5cbmZ1bmN0aW9uIGdldFRlbXBsYXRlKHN0cil7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvLio8dGVtcGxhdGU+KC4qKTxcXC90ZW1wbGF0ZT4uKi9naSwgJyQxJykucmVwbGFjZSgvKC4qKTxzdHlsZT4uKjxcXC9zdHlsZT4oLiopL2lnLCAnJDEkMicpO1xufVxuXG4vLyBHZXQgdGhlIGNvbXBvbmVudCdzIG5hbWUgZnJvbSBpdHMgYG5hbWVgIGF0dHJpYnV0ZS5cbmZ1bmN0aW9uIGdldE5hbWUoc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8uKjxlbGVtZW50W14+XSpuYW1lPShbXCInXSk/KFteJ1wiPlxcc10rKVxcMVtePD5dKj4uKi9pZywgJyQyJyk7XG59XG5cbi8vIE1pbmlmeSB0aGUgc3RyaW5nIHBhc3NlZCBpbiBieSByZXBsYWNpbmcgYWxsIHdoaXRlc3BhY2UuXG5mdW5jdGlvbiBtaW5pZnkoc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXHMrL2csICcgJykucmVwbGFjZSgvXFxufCg+KSAoPCkvZywgJyQxJDInKTtcbn1cblxuLy8gU3RyaXAgamF2YXNjcmlwdCBjb21tZW50c1xuZnVuY3Rpb24gcmVtb3ZlQ29tbWVudHMoc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8oPzpcXC9cXCooPzpbXFxzXFxTXSo/KVxcKlxcLyl8KD86KFtcXHNdKStcXC9cXC8oPzouKikkKS9nbSwgJyQxJyk7XG59XG5cbmZ1bmN0aW9uIHRlbXBsYXRlRnVuYyhmbikge1xuICB2YXIgc3JjID0gZm4udG9TdHJpbmcoKTtcbiAgc3JjID0gc3JjLnNsaWNlKHNyYy5pbmRleE9mKFwie1wiKSArIDEsIC0xKTtcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICByZXR1cm4gIWRhdGEgPyBzcmMgOiBzcmMucmVwbGFjZSgvKFxcJFthLXpBLVpdKykvZywgZnVuY3Rpb24oJHJlcCkge1xuICAgICAgdmFyIGtleSA9ICRyZXAuc2xpY2UoMSk7XG4gICAgICByZXR1cm4gZGF0YVtrZXldIHx8IFwiXCI7XG4gICAgfSk7XG4gIH07XG59XG5cbnZhciBDT01QT05FTlRfVEVNUExBVEUgPSB0ZW1wbGF0ZUZ1bmMoZnVuY3Rpb24gKCkge1xuICByZXR1cm4gKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiB3aW5kb3cuUmVib3VuZC5yZWdpc3RlckNvbXBvbmVudChcIiRuYW1lXCIsIHtcbiAgICAgIHByb3RvdHlwZTogJHNjcmlwdCxcbiAgICAgIHRlbXBsYXRlOiAkdGVtcGxhdGUsXG4gICAgICBzdHlsZTogXCIkc3R5bGVcIlxuICAgIH0pO1xuICB9KSgpO1xufSk7XG5cbmZ1bmN0aW9uIHByZWNvbXBpbGUoc3RyLCBvcHRpb25zKXtcbiAgaWYoICFzdHIgfHwgc3RyLmxlbmd0aCA9PT0gMCApe1xuICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdObyB0ZW1wbGF0ZSBwcm92aWRlZCEnKTtcbiAgfVxuXG4gIC8vIFJlbW92ZSBjb21tZW50c1xuICBzdHIgPSByZW1vdmVDb21tZW50cyhzdHIpO1xuICAvLyBNaW5pZnkgZXZlcnl0aGluZ1xuICBzdHIgPSBtaW5pZnkoc3RyKTtcblxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgb3B0aW9ucy5iYXNlRGVzdCA9IG9wdGlvbnMuYmFzZURlc3QgfHwgJyc7XG4gIG9wdGlvbnMubmFtZSA9IG9wdGlvbnMubmFtZSB8fCAnJztcbiAgb3B0aW9ucy5iYXNlVXJsID0gb3B0aW9ucy5iYXNlVXJsIHx8ICcnO1xuXG4gIHZhciB0ZW1wbGF0ZSA9IHN0cixcbiAgICAgIHN0eWxlID0gJycsXG4gICAgICBzY3JpcHQgPSAne30nLFxuICAgICAgbmFtZSA9ICcnLFxuICAgICAgaXNQYXJ0aWFsID0gdHJ1ZSxcbiAgICAgIGltcG9ydHMgPSBbXSxcbiAgICAgIHBhcnRpYWxzLFxuICAgICAgcmVxdWlyZSxcbiAgICAgIGRlcHMgPSBbXTtcblxuICAvLyBJZiB0aGUgZWxlbWVudCB0YWcgaXMgcHJlc2VudFxuICBpZihzdHIuaW5kZXhPZignPGVsZW1lbnQnKSA+IC0xICYmIHN0ci5pbmRleE9mKCc8L2VsZW1lbnQ+JykgPiAtMSl7XG5cbiAgICBpc1BhcnRpYWwgPSBmYWxzZTtcblxuICAgIG5hbWUgPSBnZXROYW1lKHN0cik7XG4gICAgc3R5bGUgPSBnZXRTdHlsZShzdHIpO1xuICAgIHRlbXBsYXRlID0gZ2V0VGVtcGxhdGUoc3RyKTtcbiAgICBzY3JpcHQgPSBnZXRTY3JpcHQoc3RyKTtcblxuICB9XG5cblxuICAvLyBBc3NlbXBsZSBvdXIgY29tcG9uZW50IGRlcGVuZGFuY2llcyBieSBmaW5kaW5nIGxpbmsgdGFncyBhbmQgcGFyc2luZyB0aGVpciBzcmNcbiAgdmFyIGltcG9ydHNyZSA9IC88bGluayBbXmhdKmhyZWY9KFsnXCJdPylcXC8/KFteLidcIl0qKS5odG1sXFwxW14+XSo+L2dpLFxuICAgICAgbWF0Y2g7XG5cbiAgd2hpbGUgKChtYXRjaCA9IGltcG9ydHNyZS5leGVjKHRlbXBsYXRlKSkgIT0gbnVsbCkge1xuICAgICAgaW1wb3J0cy5wdXNoKG1hdGNoWzJdKTtcbiAgfVxuICBpbXBvcnRzLmZvckVhY2goZnVuY3Rpb24oaW1wb3J0U3RyaW5nLCBpbmRleCl7XG4gICAgZGVwcy5wdXNoKCdcIicgKyBvcHRpb25zLmJhc2VEZXN0ICsgaW1wb3J0U3RyaW5nICsgJ1wiJyk7XG4gIH0pO1xuXG4gIC8vIFJlbW92ZSBsaW5rIHRhZ3MgZnJvbSB0ZW1wbGF0ZVxuICB0ZW1wbGF0ZSA9IHRlbXBsYXRlLnJlcGxhY2UoLzxsaW5rIC4qaHJlZj0oWydcIl0/KSguKikuaHRtbFxcMVtePl0qPi9naSwgJycpO1xuXG4gIC8vIEFzc2VtYmxlIG91ciBwYXJ0aWFsIGRlcGVuZGFuY2llc1xuICBwYXJ0aWFscyA9IHRlbXBsYXRlLm1hdGNoKC9cXHtcXHs+XFxzKj9bJ1wiXT8oW14nXCJ9XFxzXSopWydcIl0/XFxzKj9cXH1cXH0vZ2kpO1xuXG4gIGlmKHBhcnRpYWxzKXtcbiAgICBwYXJ0aWFscy5mb3JFYWNoKGZ1bmN0aW9uKHBhcnRpYWwsIGluZGV4KXtcbiAgICAgIGRlcHMucHVzaCgnXCInICsgb3B0aW9ucy5iYXNlRGVzdCArIHBhcnRpYWwucmVwbGFjZSgvXFx7XFx7PltcXHMqXT9bJ1wiXT8oW14nXCJdKilbJ1wiXT9bXFxzKl0/XFx9XFx9L2dpLCAnJDEnKSArICdcIicpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8gQ29tcGlsZVxuICB0ZW1wbGF0ZSA9ICcnICsgaHRtbGJhcnNDb21waWxlU3BlYyh0ZW1wbGF0ZSk7XG5cbiAgLy8gSWYgaXMgYSBwYXJ0aWFsXG4gIGlmKGlzUGFydGlhbCl7XG4gICAgdGVtcGxhdGUgPSAnKGZ1bmN0aW9uKCl7dmFyIHRlbXBsYXRlID0gJyt0ZW1wbGF0ZSsnXFxuIHdpbmRvdy5SZWJvdW5kLnJlZ2lzdGVyUGFydGlhbCggXCInKyBvcHRpb25zLm5hbWUgKydcIiwgdGVtcGxhdGUpO30pKCk7XFxuJztcbiAgfVxuICAvLyBFbHNlLCBpcyBhIGNvbXBvbmVudFxuICBlbHNle1xuICAgIHRlbXBsYXRlID0gQ09NUE9ORU5UX1RFTVBMQVRFKHtcbiAgICAgIG5hbWU6IG5hbWUsXG4gICAgICBzY3JpcHQ6IHNjcmlwdCxcbiAgICAgIHN0eWxlOiBzdHlsZSxcbiAgICAgIHRlbXBsYXRlOiB0ZW1wbGF0ZVxuICAgIH0pO1xuICB9XG5cbiAgLy8gV3JhcCBpbiBkZWZpbmVcbiAgdGVtcGxhdGUgPSBcImRlZmluZSggW1wiKyBkZXBzLmpvaW4oJywgJykgICtcIl0sIGZ1bmN0aW9uKCl7XFxuXCIgKyB0ZW1wbGF0ZSArICd9KTsnO1xuXG4gIHJldHVybiB0ZW1wbGF0ZTtcbn1cblxuZXhwb3J0IHsgcHJlY29tcGlsZSB9O1xuIiwiLy8gUmVib3VuZCBSb3V0ZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cbi8vIElmIEJhY2tib25lIGhhc24ndCBiZWVuIHN0YXJ0ZWQgeWV0LCB0aHJvdyBlcnJvclxuaWYoIXdpbmRvdy5CYWNrYm9uZSl7IHRocm93IFwiQmFja2JvbmUgbXVzdCBiZSBvbiB0aGUgcGFnZSBmb3IgUmVib3VuZCB0byBsb2FkLlwiOyB9XG5cbiAgLy8gQ2xlYW4gdXAgb2xkIHBhZ2UgY29tcG9uZW50IGFuZCBsb2FkIHJvdXRlcyBmcm9tIG91ciBuZXcgcGFnZSBjb21wb25lbnRcbiAgZnVuY3Rpb24gaW5zdGFsbFJlc291cmNlcyhQYWdlQXBwLCBwcmltYXJ5Um91dGUsIGlzR2xvYmFsKSB7XG4gICAgdmFyIG9sZFBhZ2VOYW1lLCBwYWdlSW5zdGFuY2UsIGNvbnRhaW5lciwgcm91dGVyID0gdGhpcztcblxuICAgIC8vIERlLWluaXRpYWxpemUgdGhlIHByZXZpb3VzIGFwcCBiZWZvcmUgcmVuZGVyaW5nIGEgbmV3IGFwcFxuICAgIC8vIFRoaXMgd2F5IHdlIGNhbiBlbnN1cmUgdGhhdCBldmVyeSBuZXcgcGFnZSBzdGFydHMgd2l0aCBhIGNsZWFuIHNsYXRlXG4gICAgLy8gVGhpcyBpcyBjcnVjaWFsIGZvciBzY2FsYWJpbGl0eSBvZiBhIHNpbmdsZSBwYWdlIGFwcC5cbiAgICBpZighaXNHbG9iYWwgJiYgdGhpcy5jdXJyZW50KXtcblxuICAgICAgb2xkUGFnZU5hbWUgPSB0aGlzLmN1cnJlbnQuX19uYW1lO1xuICAgICAgLy8gVW5zZXQgUHJldmlvdXMgQXBwbGljYXRpb24ncyBSb3V0ZXMuIEZvciBlYWNoIHJvdXRlIGluIHRoZSBwYWdlIGFwcDpcbiAgICAgIF8uZWFjaCh0aGlzLmN1cnJlbnQuX19jb21wb25lbnRfXy5yb3V0ZXMsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG5cbiAgICAgICAgdmFyIHJlZ0V4cCA9IHJvdXRlci5fcm91dGVUb1JlZ0V4cChrZXkpLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgLy8gUmVtb3ZlIHRoZSBoYW5kbGVyIGZyb20gb3VyIHJvdXRlIG9iamVjdFxuICAgICAgICBCYWNrYm9uZS5oaXN0b3J5LmhhbmRsZXJzID0gXy5maWx0ZXIoQmFja2JvbmUuaGlzdG9yeS5oYW5kbGVycywgZnVuY3Rpb24ob2JqKXtyZXR1cm4gb2JqLnJvdXRlLnRvU3RyaW5nKCkgIT09IHJlZ0V4cDt9KTtcblxuICAgICAgICAvLyBEZWxldGUgb3VyIHJlZmVyYW5jZSB0byB0aGUgcm91dGUncyBjYWxsYmFja1xuICAgICAgICBkZWxldGUgcm91dGVyWyAnX2Z1bmN0aW9uXycgKyBrZXkgXTtcblxuICAgICAgfSk7XG5cbiAgICAgIC8vIFVuLWhvb2sgRXZlbnQgQmluZGluZ3MsIERlbGV0ZSBPYmplY3RzXG4gICAgICB0aGlzLmN1cnJlbnQuX19jb21wb25lbnRfXy5kZWluaXRpYWxpemUoKTtcblxuICAgICAgLy8gRGlzYWJsZSBvbGQgY3NzIGlmIGl0IGV4aXN0c1xuICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChvbGRQYWdlTmFtZSArICctY3NzJykuc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsIHRydWUpO1xuICAgICAgfSwgNTAwKTtcblxuICAgIH1cblxuICAgIC8vIExvYWQgTmV3IFBhZ2VBcHAsIGdpdmUgaXQgaXQncyBuYW1lIHNvIHdlIGtub3cgd2hhdCBjc3MgdG8gcmVtb3ZlIHdoZW4gaXQgZGVpbml0aWFsaXplc1xuICAgIHBhZ2VJbnN0YW5jZSA9IG5ldyBQYWdlQXBwKCk7XG4gICAgcGFnZUluc3RhbmNlLl9fbmFtZSA9IHByaW1hcnlSb3V0ZTtcblxuICAgIC8vIEFkZCB0byBvdXIgcGFnZVxuICAgIGNvbnRhaW5lciA9IChpc0dsb2JhbCkgPyBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKGlzR2xvYmFsKSA6IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdjb250ZW50JylbMF07XG4gICAgY29udGFpbmVyLmlubmVySFRNTCA9ICcnO1xuICAgIGNvbnRhaW5lci5hcHBlbmRDaGlsZChwYWdlSW5zdGFuY2UpO1xuXG4gICAgLy8gTWFrZSBzdXJlIHdlJ3JlIGJhY2sgYXQgdGhlIHRvcCBvZiB0aGUgcGFnZVxuICAgIGRvY3VtZW50LmJvZHkuc2Nyb2xsVG9wID0gMDtcblxuICAgIC8vIEF1Z21lbnQgQXBwbGljYXRpb25Sb3V0ZXIgd2l0aCBuZXcgcm91dGVzIGZyb20gUGFnZUFwcFxuICAgIF8uZWFjaChwYWdlSW5zdGFuY2UuX19jb21wb25lbnRfXy5yb3V0ZXMsIGZ1bmN0aW9uICh2YWx1ZSwga2V5KSB7XG4gICAgICAvLyBHZW5lcmF0ZSBvdXIgcm91dGUgY2FsbGJhY2sncyBuZXcgbmFtZVxuICAgICAgdmFyIHJvdXRlRnVuY3Rpb25OYW1lID0gJ19mdW5jdGlvbl8nICsga2V5LFxuICAgICAgICAgIGZ1bmN0aW9uTmFtZTtcbiAgICAgIC8vIEFkZCB0aGUgbmV3IGNhbGxiYWNrIHJlZmVyYW5jZSBvbiB0byBvdXIgcm91dGVyXG4gICAgICByb3V0ZXJbcm91dGVGdW5jdGlvbk5hbWVdID0gIGZ1bmN0aW9uICgpIHsgcGFnZUluc3RhbmNlLl9fY29tcG9uZW50X19bdmFsdWVdLmFwcGx5KHBhZ2VJbnN0YW5jZS5fX2NvbXBvbmVudF9fLCBhcmd1bWVudHMpOyB9O1xuICAgICAgLy8gQWRkIHRoZSByb3V0ZSBoYW5kbGVyXG4gICAgICByb3V0ZXIucm91dGUoa2V5LCB2YWx1ZSwgdGhpc1tyb3V0ZUZ1bmN0aW9uTmFtZV0pO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgaWYoIWlzR2xvYmFsKXtcbiAgICAgIHdpbmRvdy5SZWJvdW5kLnBhZ2UgPSAodGhpcy5jdXJyZW50ID0gcGFnZUluc3RhbmNlKS5fX2NvbXBvbmVudF9fO1xuICAgIH1cblxuICAgIC8vIFJldHVybiBvdXIgbmV3bHkgaW5zdGFsbGVkIGFwcFxuICAgIHJldHVybiBwYWdlSW5zdGFuY2U7XG4gIH1cblxuICAvLyBGZXRjaGVzIFBhcmUgSFRNTCBhbmQgQ1NTXG4gIGZ1bmN0aW9uIGZldGNoUmVzb3VyY2VzKGFwcE5hbWUsIHByaW1hcnlSb3V0ZSwgaXNHbG9iYWwpIHtcblxuICAgIC8vIEV4cGVjdGluZyBNb2R1bGUgRGVmaW5pdGlvbiBhcyAnU2VhcmNoQXBwJyBXaGVyZSAnU2VhcmNoJyBhIFByaW1hcnkgUm91dGVcbiAgICB2YXIganNVcmwgPSB0aGlzLmNvbmZpZy5qc1BhdGgucmVwbGFjZSgvOnJvdXRlL2csIHByaW1hcnlSb3V0ZSkucmVwbGFjZSgvOmFwcC9nLCBhcHBOYW1lKSxcbiAgICAgICAgY3NzVXJsID0gdGhpcy5jb25maWcuY3NzUGF0aC5yZXBsYWNlKC86cm91dGUvZywgcHJpbWFyeVJvdXRlKS5yZXBsYWNlKC86YXBwL2csIGFwcE5hbWUpLFxuICAgICAgICBjc3NMb2FkZWQgPSBmYWxzZSxcbiAgICAgICAganNMb2FkZWQgPSBmYWxzZSxcbiAgICAgICAgY3NzRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFwcE5hbWUgKyAnLWNzcycpLFxuICAgICAgICBqc0VsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChhcHBOYW1lICsgJy1qcycpLFxuICAgICAgICByb3V0ZXIgPSB0aGlzLFxuICAgICAgICBQYWdlQXBwO1xuXG4gICAgICAvLyBPbmx5IExvYWQgQ1NTIElmIE5vdCBMb2FkZWQgQmVmb3JlXG4gICAgICBpZighY3NzRWxlbWVudCl7XG4gICAgICAgIGNzc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaW5rJyk7XG4gICAgICAgIGNzc0VsZW1lbnQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvY3NzJyk7XG4gICAgICAgIGNzc0VsZW1lbnQuc2V0QXR0cmlidXRlKCdyZWwnLCAnc3R5bGVzaGVldCcpO1xuICAgICAgICBjc3NFbGVtZW50LnNldEF0dHJpYnV0ZSgnaHJlZicsIGNzc1VybCk7XG4gICAgICAgIGNzc0VsZW1lbnQuc2V0QXR0cmlidXRlKCdpZCcsIGFwcE5hbWUgKyAnLWNzcycpO1xuICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGNzc0VsZW1lbnQpO1xuICAgICAgICAkKGNzc0VsZW1lbnQpLm9uKCdsb2FkJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgaWYoKGNzc0xvYWRlZCA9IHRydWUpICYmIGpzTG9hZGVkKXtcbiAgICAgICAgICAgICAgLy8gSW5zdGFsbCBUaGUgTG9hZGVkIFJlc291cmNlc1xuICAgICAgICAgICAgICBpbnN0YWxsUmVzb3VyY2VzLmNhbGwocm91dGVyLCBQYWdlQXBwLCBhcHBOYW1lLCBpc0dsb2JhbCk7XG5cbiAgICAgICAgICAgICAgLy8gUmUtdHJpZ2dlciByb3V0ZSBzbyB0aGUgbmV3bHkgYWRkZWQgcm91dGUgbWF5IGV4ZWN1dGUgaWYgdGhlcmUncyBhIHJvdXRlIG1hdGNoLlxuICAgICAgICAgICAgICAvLyBJZiBubyByb3V0ZXMgYXJlIG1hdGNoZWQsIGFwcCB3aWxsIGhpdCB3aWxkQ2FyZCByb3V0ZSB3aGljaCB3aWxsIHRoZW4gdHJpZ2dlciA0MDRcbiAgICAgICAgICAgICAgaWYoIWlzR2xvYmFsICYmIHJvdXRlci5jb25maWcudHJpZ2dlck9uRmlyc3RMb2FkKXtcbiAgICAgICAgICAgICAgICBCYWNrYm9uZS5oaXN0b3J5LmxvYWRVcmwoQmFja2JvbmUuaGlzdG9yeS5mcmFnbWVudCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgaWYoIWlzR2xvYmFsKXtcbiAgICAgICAgICAgICAgICByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICAvLyBJZiBpdCBoYXMgYmVlbiBsb2FkZWQgYmV2b3JlLCBlbmFibGUgaXRcbiAgICAgIGVsc2Uge1xuICAgICAgICBjc3NFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgICAgICAgY3NzTG9hZGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgaWYgcmVxdWlyZWpzIGlzIG5vdCBvbiB0aGUgcGFnZSwgbG9hZCB0aGUgZmlsZSBtYW51YWxseS4gSXQgYmV0dGVyIGNvbnRhaW4gYWxsIGl0cyBkZXBlbmRhbmNpZXMuXG4gICAgICBpZih3aW5kb3cucmVxdWlyZS5fZGVmaW5lZCB8fCBfLmlzVW5kZWZpbmVkKHdpbmRvdy5yZXF1aXJlKSl7XG4gICAgICAgICAganNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgICAganNFbGVtZW50LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2phdmFzY3JpcHQnKTtcbiAgICAgICAgICBqc0VsZW1lbnQuc2V0QXR0cmlidXRlKCdzcmMnLCAnLycranNVcmwrJy5qcycpO1xuICAgICAgICAgIGpzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2lkJywgYXBwTmFtZSArICctanMnKTtcbiAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGpzRWxlbWVudCk7XG4gICAgICAgICAgJChqc0VsZW1lbnQpLm9uKCdsb2FkJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgLy8gQU1EIFdpbGwgTWFuYWdlIERlcGVuZGFuY2llcyBGb3IgVXMuIExvYWQgVGhlIEFwcC5cbiAgICAgICAgICAgIHJlcXVpcmUoW2pzVXJsXSwgZnVuY3Rpb24oUGFnZUNsYXNzKXtcblxuICAgICAgICAgICAgICBpZigoanNMb2FkZWQgPSB0cnVlKSAmJiAoUGFnZUFwcCA9IFBhZ2VDbGFzcykgJiYgY3NzTG9hZGVkKXtcblxuICAgICAgICAgICAgICAgIC8vIEluc3RhbGwgVGhlIExvYWRlZCBSZXNvdXJjZXNcbiAgICAgICAgICAgICAgICBpbnN0YWxsUmVzb3VyY2VzLmNhbGwocm91dGVyLCBQYWdlQXBwLCBhcHBOYW1lLCBpc0dsb2JhbCk7XG4gICAgICAgICAgICAgICAgLy8gUmUtdHJpZ2dlciByb3V0ZSBzbyB0aGUgbmV3bHkgYWRkZWQgcm91dGUgbWF5IGV4ZWN1dGUgaWYgdGhlcmUncyBhIHJvdXRlIG1hdGNoLlxuICAgICAgICAgICAgICAgIC8vIElmIG5vIHJvdXRlcyBhcmUgbWF0Y2hlZCwgYXBwIHdpbGwgaGl0IHdpbGRDYXJkIHJvdXRlIHdoaWNoIHdpbGwgdGhlbiB0cmlnZ2VyIDQwNFxuICAgICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCAmJiByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCl7XG4gICAgICAgICAgICAgICAgICBCYWNrYm9uZS5oaXN0b3J5LmxvYWRVcmwoQmFja2JvbmUuaGlzdG9yeS5mcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCl7XG4gICAgICAgICAgICAgICAgICByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICAvLyBBTUQgV2lsbCBNYW5hZ2UgRGVwZW5kYW5jaWVzIEZvciBVcy4gTG9hZCBUaGUgQXBwLlxuICAgICAgICB3aW5kb3cucmVxdWlyZShbanNVcmxdLCBmdW5jdGlvbihQYWdlQ2xhc3Mpe1xuXG4gICAgICAgICAgaWYoKGpzTG9hZGVkID0gdHJ1ZSkgJiYgKFBhZ2VBcHAgPSBQYWdlQ2xhc3MpICYmIGNzc0xvYWRlZCl7XG5cbiAgICAgICAgICAgIC8vIEluc3RhbGwgVGhlIExvYWRlZCBSZXNvdXJjZXNcbiAgICAgICAgICAgIGluc3RhbGxSZXNvdXJjZXMuY2FsbChyb3V0ZXIsIFBhZ2VBcHAsIGFwcE5hbWUsIGlzR2xvYmFsKTtcbiAgICAgICAgICAgIC8vIFJlLXRyaWdnZXIgcm91dGUgc28gdGhlIG5ld2x5IGFkZGVkIHJvdXRlIG1heSBleGVjdXRlIGlmIHRoZXJlJ3MgYSByb3V0ZSBtYXRjaC5cbiAgICAgICAgICAgIC8vIElmIG5vIHJvdXRlcyBhcmUgbWF0Y2hlZCwgYXBwIHdpbGwgaGl0IHdpbGRDYXJkIHJvdXRlIHdoaWNoIHdpbGwgdGhlbiB0cmlnZ2VyIDQwNFxuICAgICAgICAgICAgaWYoIWlzR2xvYmFsICYmIHJvdXRlci5jb25maWcudHJpZ2dlck9uRmlyc3RMb2FkKXtcbiAgICAgICAgICAgICAgQmFja2JvbmUuaGlzdG9yeS5sb2FkVXJsKEJhY2tib25lLmhpc3RvcnkuZnJhZ21lbnQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZighaXNHbG9iYWwpe1xuICAgICAgICAgICAgICByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gIH1cblxuICAvLyBSZWJvdW5kUm91dGVyIENvbnN0cnVjdG9yXG4gIHZhciBSZWJvdW5kUm91dGVyID0gQmFja2JvbmUuUm91dGVyLmV4dGVuZCh7XG5cbiAgICByb3V0ZXM6IHtcbiAgICAgICcqcm91dGUnOiAnd2lsZGNhcmRSb3V0ZSdcbiAgICB9LFxuXG4gICAgLy8gQ2FsbGVkIHdoZW4gbm8gbWF0Y2hpbmcgcm91dGVzIGFyZSBmb3VuZC4gRXh0cmFjdHMgcm9vdCByb3V0ZSBhbmQgZmV0Y2hlcyBpdCByZXNvdXJjZXNcbiAgICB3aWxkY2FyZFJvdXRlOiBmdW5jdGlvbihyb3V0ZSkge1xuICAgICAgdmFyIGFwcE5hbWUsIHByaW1hcnlSb3V0ZTtcblxuICAgICAgLy8gSWYgZW1wdHkgcm91dGUgc2VudCwgcm91dGUgaG9tZVxuICAgICAgcm91dGUgPSByb3V0ZSB8fCAnJztcblxuICAgICAgLy8gR2V0IFJvb3Qgb2YgUm91dGVcbiAgICAgIGFwcE5hbWUgPSBwcmltYXJ5Um91dGUgPSAocm91dGUpID8gcm91dGUuc3BsaXQoJy8nKVswXSA6ICdpbmRleCc7XG5cbiAgICAgIC8vIEZpbmQgQW55IEN1c3RvbSBSb3V0ZSBNYXBwaW5nc1xuICAgICAgXy5hbnkodGhpcy5jb25maWcuaGFuZGxlcnMsIGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGhhbmRsZXIucm91dGUudGVzdChyb3V0ZSkpIHtcbiAgICAgICAgICBhcHBOYW1lID0gaGFuZGxlci5wcmltYXJ5Um91dGU7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBJZiBQYWdlIElzIEFscmVhZHkgTG9hZGVkIFRoZW4gVGhlIFJvdXRlIERvZXMgTm90IEV4aXN0LiA0MDQgYW5kIEV4aXQuXG4gICAgICBpZiAodGhpcy5jdXJyZW50ICYmIHRoaXMuY3VycmVudC5uYW1lID09PSBwcmltYXJ5Um91dGUpIHtcbiAgICAgICAgcmV0dXJuIEJhY2tib25lLmhpc3RvcnkubG9hZFVybCgnNDA0Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZldGNoIFJlc291cmNlc1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKFwibG9hZGluZ1wiKTtcbiAgICAgIGZldGNoUmVzb3VyY2VzLmNhbGwodGhpcywgYXBwTmFtZSwgcHJpbWFyeVJvdXRlKTtcbiAgICB9LFxuXG4gICAgLy8gT24gc3RhcnR1cCwgc2F2ZSBvdXIgY29uZmlnIG9iamVjdCBhbmQgc3RhcnQgdGhlIHJvdXRlclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgICAgLy8gU2F2ZSBvdXIgY29uZmlnIHJlZmVyYW5jZVxuICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zLmNvbmZpZztcbiAgICAgIHRoaXMuY29uZmlnLmhhbmRsZXJzID0gW107XG5cbiAgICAgIHZhciBhYnNvbHV0ZVVybCA9IG5ldyBSZWdFeHAoJ14oPzpbYS16XSs6KT8vLycsICdpJyksXG4gICAgICByb3V0ZXIgPSB0aGlzO1xuXG4gICAgICAvLyBDb252ZXJ0IG91ciByb3V0ZU1hcHBpbmdzIHRvIHJlZ2V4cHMgYW5kIHB1c2ggdG8gb3VyIGhhbmRsZXJzXG4gICAgICBfLmVhY2godGhpcy5jb25maWcucm91dGVNYXBwaW5nLCBmdW5jdGlvbih2YWx1ZSwgcm91dGUpe1xuICAgICAgICBpZiAoIV8uaXNSZWdFeHAocm91dGUpKSByb3V0ZSA9IHJvdXRlci5fcm91dGVUb1JlZ0V4cChyb3V0ZSk7XG4gICAgICAgIHJvdXRlci5jb25maWcuaGFuZGxlcnMudW5zaGlmdCh7IHJvdXRlOiByb3V0ZSwgcHJpbWFyeVJvdXRlOiB2YWx1ZSB9KTtcbiAgICAgIH0sIHRoaXMpO1xuXG4gICAgICAvLyBOYXZpZ2F0ZSB0byByb3V0ZSBmb3IgYW55IGxpbmsgd2l0aCBhIHJlbGF0aXZlIGhyZWZcbiAgICAgICQoZG9jdW1lbnQpLm9uKCdjbGljaycsICdhJywgZnVuY3Rpb24oZSl7XG5cbiAgICAgICAgdmFyIHBhdGggPSBlLnRhcmdldC5nZXRBdHRyaWJ1dGUoJ2hyZWYnKTtcblxuICAgICAgICAvLyBJZiBwYXRoIGlzIG5vdCBhbiBhYnNvbHV0ZSB1cmwsIG9yIGJsYW5rLCB0cnkgYW5kIG5hdmlnYXRlIHRvIHRoYXQgcm91dGUuXG4gICAgICAgIGlmKHBhdGggIT09ICcjJyAmJiBwYXRoICE9PSAnJyAmJiAhYWJzb2x1dGVVcmwudGVzdChwYXRoKSl7XG4gICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHJvdXRlci5uYXZpZ2F0ZShwYXRoLCB7dHJpZ2dlcjogdHJ1ZX0pO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgLy8gSW5zdGFsbCBvdXIgZ2xvYmFsIGNvbXBvbmVudHNcbiAgICAgIF8uZWFjaCh0aGlzLmNvbmZpZy5nbG9iYWxDb21wb25lbnRzLCBmdW5jdGlvbihzZWxlY3Rvciwgcm91dGUpe1xuICAgICAgICBmZXRjaFJlc291cmNlcy5jYWxsKHJvdXRlciwgcm91dGUsIHJvdXRlLCBzZWxlY3Rvcik7XG4gICAgICB9KTtcblxuICAgICAgLy8gTGV0IGFsbCBvZiBvdXIgY29tcG9uZW50cyBhbHdheXMgaGF2ZSByZWZlcmFuY2UgdG8gb3VyIHJvdXRlclxuICAgICAgUmVib3VuZC5Db21wb25lbnQucHJvdG90eXBlLnJvdXRlciA9IHRoaXM7XG5cbiAgICAgIC8vIFN0YXJ0IHRoZSBoaXN0b3J5XG4gICAgICBCYWNrYm9uZS5oaXN0b3J5LnN0YXJ0KHtcbiAgICAgICAgcHVzaFN0YXRlOiB0cnVlLFxuICAgICAgICByb290OiB0aGlzLmNvbmZpZy5yb290XG4gICAgICB9KTtcblxuICAgIH1cbiAgfSk7XG5cbmV4cG9ydCBkZWZhdWx0IFJlYm91bmRSb3V0ZXI7XG4iLCIvLyAgICAgUmVib3VuZC5qcyAwLjAuNDdcblxuLy8gICAgIChjKSAyMDE1IEFkYW0gTWlsbGVyXG4vLyAgICAgUmVib3VuZCBtYXkgYmUgZnJlZWx5IGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBNSVQgbGljZW5zZS5cbi8vICAgICBGb3IgYWxsIGRldGFpbHMgYW5kIGRvY3VtZW50YXRpb246XG4vLyAgICAgaHR0cDovL3JlYm91bmRqcy5jb21cblxuLy8gUmVib3VuZCBSdW50aW1lXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbi8vIElmIEJhY2tib25lIGlzbid0IHByZXNldCBvbiB0aGUgcGFnZSB5ZXQsIG9yIGlmIGB3aW5kb3cuUmVib3VuZGAgaXMgYWxyZWFkeVxuLy8gaW4gdXNlLCB0aHJvdyBhbiBlcnJvclxuaWYoIXdpbmRvdy5CYWNrYm9uZSkgdGhyb3cgXCJCYWNrYm9uZSBtdXN0IGJlIG9uIHRoZSBwYWdlIGZvciBSZWJvdW5kIHRvIGxvYWQuXCI7XG5pZighd2luZG93LlJlYm91bmQpIHRocm93IFwiR2xvYmFsIFJlYm91bmQgbmFtZXNwYWNlIGFscmVhZHkgdGFrZW4uXCI7XG5cbi8vIExvYWQgb3VyICoqVXRpbHMqKiwgaGVscGVyIGVudmlyb25tZW50LCAqKlJlYm91bmQgRGF0YSoqLFxuLy8gKipSZWJvdW5kIENvbXBvbmVudHMqKiBhbmQgdGhlICoqUmVib3VuZCBSb3V0ZXIqKlxuaW1wb3J0IHV0aWxzIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuaW1wb3J0IGhlbHBlcnMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hlbHBlcnNcIjtcbmltcG9ydCB7IE1vZGVsLCBDb2xsZWN0aW9uLCBDb21wdXRlZFByb3BlcnR5IH0gZnJvbSBcInJlYm91bmQtZGF0YS9yZWJvdW5kLWRhdGFcIjtcbmltcG9ydCBDb21wb25lbnQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2NvbXBvbmVudFwiO1xuaW1wb3J0IFJvdXRlciBmcm9tIFwicmVib3VuZC1yb3V0ZXIvcmVib3VuZC1yb3V0ZXJcIjtcblxuLy8gSWYgQmFja2JvbmUgZG9lc24ndCBoYXZlIGFuIGFqYXggbWV0aG9kIGZyb20gYW4gZXh0ZXJuYWwgRE9NIGxpYnJhcnksIHVzZSBvdXJzXG53aW5kb3cuQmFja2JvbmUuYWpheCA9IHdpbmRvdy5CYWNrYm9uZS4kICYmIHdpbmRvdy5CYWNrYm9uZS4kLmFqYXggJiYgd2luZG93LkJhY2tib25lLmFqYXggfHwgdXRpbHMuYWpheDtcblxuLy8gRmV0Y2ggUmVib3VuZCdzIENvbmZpZyBPYmplY3QgZnJvbSBSZWJvdW5kJ3MgYHNjcmlwdGAgdGFnXG52YXIgQ29uZmlnID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ1JlYm91bmQnKS5pbm5lckhUTUw7XG5cbi8vIENyZWF0ZSBHbG9iYWwgUmVib3VuZCBPYmplY3RcbndpbmRvdy5SZWJvdW5kID0ge1xuICByZWdpc3RlckhlbHBlcjogaGVscGVycy5yZWdpc3RlckhlbHBlcixcbiAgcmVnaXN0ZXJQYXJ0aWFsOiBoZWxwZXJzLnJlZ2lzdGVyUGFydGlhbCxcbiAgcmVnaXN0ZXJDb21wb25lbnQ6IENvbXBvbmVudC5yZWdpc3RlcixcbiAgTW9kZWw6IE1vZGVsLFxuICBDb2xsZWN0aW9uOiBDb2xsZWN0aW9uLFxuICBDb21wdXRlZFByb3BlcnR5OiBDb21wdXRlZFByb3BlcnR5LFxuICBDb21wb25lbnQ6IENvbXBvbmVudFxufTtcblxuLy8gU3RhcnQgdGhlIHJvdXRlciBpZiBhIGNvbmZpZyBvYmplY3QgaXMgcHJlc2V0XG5pZihDb25maWcpIHdpbmRvdy5SZWJvdW5kLnJvdXRlciA9IG5ldyBSb3V0ZXIoe2NvbmZpZzogSlNPTi5wYXJzZShDb25maWcpfSk7XG5cbmV4cG9ydCBkZWZhdWx0IFJlYm91bmQ7XG4iLCIvLyBSZWJvdW5kIEhlbHBlcnNcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IExhenlWYWx1ZSBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvbGF6eS12YWx1ZVwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cblxudmFyIGhlbHBlcnMgID0ge30sXG4gICAgcGFydGlhbHMgPSB7fTtcblxuaGVscGVycy5yZWdpc3RlclBhcnRpYWwgPSBmdW5jdGlvbihuYW1lLCBmdW5jKXtcbiAgaWYoZnVuYyAmJiBmdW5jLmlzSFRNTEJhcnMgJiYgdHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKXtcbiAgICBwYXJ0aWFsc1tuYW1lXSA9IGZ1bmM7XG4gIH1cbn07XG5cbi8vIGxvb2t1cEhlbHBlciByZXR1cm5zIHRoZSBnaXZlbiBmdW5jdGlvbiBmcm9tIHRoZSBoZWxwZXJzIG9iamVjdC4gTWFudWFsIGNoZWNrcyBwcmV2ZW50IHVzZXIgZnJvbSBvdmVycmlkaW5nIHJlc2VydmVkIHdvcmRzLlxuaGVscGVycy5sb29rdXBIZWxwZXIgPSBmdW5jdGlvbihuYW1lLCBlbnYsIGNvbnRleHQpIHtcblxuICBlbnYgPSBlbnYgfHwge307XG5cbiAgbmFtZSA9ICQuc3BsaXRQYXRoKG5hbWUpWzBdO1xuXG4gIC8vIElmIGEgcmVzZXJ2ZWQgaGVscGVycywgcmV0dXJuIGl0XG4gIGlmKG5hbWUgPT09ICdhdHRyaWJ1dGUnKSB7IHJldHVybiB0aGlzLmF0dHJpYnV0ZTsgfVxuICBpZihuYW1lID09PSAnaWYnKSB7IHJldHVybiB0aGlzLmlmOyB9XG4gIGlmKG5hbWUgPT09ICd1bmxlc3MnKSB7IHJldHVybiB0aGlzLnVubGVzczsgfVxuICBpZihuYW1lID09PSAnZWFjaCcpIHsgcmV0dXJuIHRoaXMuZWFjaDsgfVxuICBpZihuYW1lID09PSAnd2l0aCcpIHsgcmV0dXJuIHRoaXMud2l0aDsgfVxuICBpZihuYW1lID09PSAncGFydGlhbCcpIHsgcmV0dXJuIHRoaXMucGFydGlhbDsgfVxuICBpZihuYW1lID09PSAnbGVuZ3RoJykgeyByZXR1cm4gdGhpcy5sZW5ndGg7IH1cbiAgaWYobmFtZSA9PT0gJ29uJykgeyByZXR1cm4gdGhpcy5vbjsgfVxuXG4gIC8vIElmIG5vdCBhIHJlc2VydmVkIGhlbHBlciwgY2hlY2sgZW52LCB0aGVuIGdsb2JhbCBoZWxwZXJzLCBlbHNlIHJldHVybiBmYWxzZVxuICByZXR1cm4gKGVudi5oZWxwZXJzICYmIF8uaXNPYmplY3QoY29udGV4dCkgJiYgXy5pc09iamVjdChlbnYuaGVscGVyc1tjb250ZXh0LmNpZF0pICYmIGVudi5oZWxwZXJzW2NvbnRleHQuY2lkXVtuYW1lXSkgfHwgaGVscGVyc1tuYW1lXSB8fCBmYWxzZTtcbn07XG5cbmhlbHBlcnMucmVnaXN0ZXJIZWxwZXIgPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgcGFyYW1zKXtcbiAgaWYoIV8uaXNTdHJpbmcobmFtZSkpe1xuICAgIGNvbnNvbGUuZXJyb3IoJ05hbWUgcHJvdmlkZWQgdG8gcmVnaXN0ZXJIZWxwZXIgbXVzdCBiZSBhIHN0cmluZyEnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYoIV8uaXNGdW5jdGlvbihjYWxsYmFjaykpe1xuICAgIGNvbnNvbGUuZXJyb3IoJ0NhbGxiYWNrIHByb3ZpZGVkIHRvIHJlZ2llckhlbHBlciBtdXN0IGJlIGEgZnVuY3Rpb24hJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmKGhlbHBlcnMubG9va3VwSGVscGVyKG5hbWUpKXtcbiAgICBjb25zb2xlLmVycm9yKCdBIGhlbHBlciBjYWxsZWQgXCInICsgbmFtZSArICdcIiBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQhJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcGFyYW1zID0gKF8uaXNBcnJheShwYXJhbXMpKSA/IHBhcmFtcyA6IFtwYXJhbXNdO1xuICBjYWxsYmFjay5fX3BhcmFtcyA9IHBhcmFtcztcblxuICBoZWxwZXJzW25hbWVdID0gY2FsbGJhY2s7XG5cbn07XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIERlZmF1bHQgaGVscGVyc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmhlbHBlcnMub24gPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG4gIHZhciBpLCBjYWxsYmFjaywgZGVsZWdhdGUsIGVsZW1lbnQsXG4gICAgICBldmVudE5hbWUgPSBwYXJhbXNbMF0sXG4gICAgICBsZW4gPSBwYXJhbXMubGVuZ3RoLFxuICAgICAgZGF0YSA9IGhhc2g7XG5cbiAgLy8gQnkgZGVmYXVsdCBldmVyeXRoaW5nIGlzIGRlbGVnYXRlZCBvbiB0aGUgcGFyZW50IGNvbXBvbmVudFxuICBpZihsZW4gPT09IDIpe1xuICAgIGNhbGxiYWNrID0gcGFyYW1zWzFdO1xuICAgIGRlbGVnYXRlID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIGVsZW1lbnQgPSAodGhpcy5lbCB8fCBvcHRpb25zLmVsZW1lbnQpO1xuICB9XG4gIC8vIElmIGEgc2VsZWN0b3IgaXMgcHJvdmlkZWQsIGRlbGVnYXRlIG9uIHRoZSBoZWxwZXIncyBlbGVtZW50XG4gIGVsc2UgaWYobGVuID09PSAzKXtcbiAgICBjYWxsYmFjayA9IHBhcmFtc1syXTtcbiAgICBkZWxlZ2F0ZSA9IHBhcmFtc1sxXTtcbiAgICBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICB9XG5cbiAgLy8gQXR0YWNoIGV2ZW50XG4gICQoZWxlbWVudCkub24oZXZlbnROYW1lLCBkZWxlZ2F0ZSwgZGF0YSwgZnVuY3Rpb24oZXZlbnQpe1xuICAgIGV2ZW50LmNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQ7XG4gICAgcmV0dXJuIG9wdGlvbnMuaGVscGVycy5fX2NhbGxPbkNvbXBvbmVudChjYWxsYmFjaywgZXZlbnQpO1xuICB9KTtcbn07XG5cbmhlbHBlcnMubGVuZ3RoID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuICAgIHJldHVybiBwYXJhbXNbMF0gJiYgcGFyYW1zWzBdLmxlbmd0aCB8fCAwO1xufTtcblxuaGVscGVycy5pZiA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcblxuICB2YXIgY29uZGl0aW9uID0gcGFyYW1zWzBdO1xuXG4gIGlmKGNvbmRpdGlvbiA9PT0gdW5kZWZpbmVkKXtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmKGNvbmRpdGlvbi5pc01vZGVsKXtcbiAgICBjb25kaXRpb24gPSB0cnVlO1xuICB9XG5cbiAgLy8gSWYgb3VyIGNvbmRpdGlvbiBpcyBhbiBhcnJheSwgaGFuZGxlIHByb3Blcmx5XG4gIGlmKF8uaXNBcnJheShjb25kaXRpb24pIHx8IGNvbmRpdGlvbi5pc0NvbGxlY3Rpb24pe1xuICAgIGNvbmRpdGlvbiA9IGNvbmRpdGlvbi5sZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cblxuICBpZihjb25kaXRpb24gPT09ICd0cnVlJyl7IGNvbmRpdGlvbiA9IHRydWU7IH1cbiAgaWYoY29uZGl0aW9uID09PSAnZmFsc2UnKXsgY29uZGl0aW9uID0gZmFsc2U7IH1cblxuICAvLyBJZiBtb3JlIHRoYW4gb25lIHBhcmFtLCB0aGlzIGlzIG5vdCBhIGJsb2NrIGhlbHBlci4gRXZhbCBhcyBzdWNoLlxuICBpZihwYXJhbXMubGVuZ3RoID4gMSl7XG4gICAgcmV0dXJuIChjb25kaXRpb24pID8gcGFyYW1zWzFdIDogKCBwYXJhbXNbMl0gfHwgJycpO1xuICB9XG5cbiAgLy8gQ2hlY2sgb3VyIGNhY2hlLiBJZiB0aGUgdmFsdWUgaGFzbid0IGFjdHVhbGx5IGNoYW5nZWQsIGRvbid0IGV2YWx1YXRlLiBJbXBvcnRhbnQgZm9yIHJlLXJlbmRlcmluZyBvZiAjZWFjaCBoZWxwZXJzLlxuICBpZihvcHRpb25zLnBsYWNlaG9sZGVyLl9faWZDYWNoZSA9PT0gY29uZGl0aW9uKXtcbiAgICByZXR1cm4gbnVsbDsgLy8gUmV0dXJuIG51bGwgcHJldmVudCdzIHJlLXJlbmRpbmcgb2Ygb3VyIHBsYWNlaG9sZGVyLlxuICB9XG5cbiAgb3B0aW9ucy5wbGFjZWhvbGRlci5fX2lmQ2FjaGUgPSBjb25kaXRpb247XG5cbiAgLy8gUmVuZGVyIHRoZSBhcHJvcHJlYXRlIGJsb2NrIHN0YXRlbWVudFxuICBpZihjb25kaXRpb24gJiYgb3B0aW9ucy50ZW1wbGF0ZSl7XG4gICAgcmV0dXJuIG9wdGlvbnMudGVtcGxhdGUucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgb3B0aW9ucywgKG9wdGlvbnMubW9ycGguY29udGV4dHVhbEVsZW1lbnQgfHwgb3B0aW9ucy5tb3JwaC5lbGVtZW50KSk7XG4gIH1cbiAgZWxzZSBpZighY29uZGl0aW9uICYmIG9wdGlvbnMuaW52ZXJzZSl7XG4gICAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZS5yZW5kZXIob3B0aW9ucy5jb250ZXh0LCBvcHRpb25zLCAob3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCB8fCBvcHRpb25zLm1vcnBoLmVsZW1lbnQpKTtcbiAgfVxuXG4gIHJldHVybiAnJztcbn07XG5cblxuLy8gVE9ETzogUHJveHkgdG8gaWYgaGVscGVyIHdpdGggaW52ZXJ0ZWQgcGFyYW1zXG5oZWxwZXJzLnVubGVzcyA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcbiAgdmFyIGNvbmRpdGlvbiA9IHBhcmFtc1swXTtcblxuICBpZihjb25kaXRpb24gPT09IHVuZGVmaW5lZCl7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZihjb25kaXRpb24uaXNNb2RlbCl7XG4gICAgY29uZGl0aW9uID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIElmIG91ciBjb25kaXRpb24gaXMgYW4gYXJyYXksIGhhbmRsZSBwcm9wZXJseVxuICBpZihfLmlzQXJyYXkoY29uZGl0aW9uKSB8fCBjb25kaXRpb24uaXNDb2xsZWN0aW9uKXtcbiAgICBjb25kaXRpb24gPSBjb25kaXRpb24ubGVuZ3RoID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG5cbiAgLy8gSWYgbW9yZSB0aGFuIG9uZSBwYXJhbSwgdGhpcyBpcyBub3QgYSBibG9jayBoZWxwZXIuIEV2YWwgYXMgc3VjaC5cbiAgaWYocGFyYW1zLmxlbmd0aCA+IDEpe1xuICAgIHJldHVybiAoIWNvbmRpdGlvbikgPyBwYXJhbXNbMV0gOiAoIHBhcmFtc1syXSB8fCAnJyk7XG4gIH1cblxuICAvLyBDaGVjayBvdXIgY2FjaGUuIElmIHRoZSB2YWx1ZSBoYXNuJ3QgYWN0dWFsbHkgY2hhbmdlZCwgZG9uJ3QgZXZhbHVhdGUuIEltcG9ydGFudCBmb3IgcmUtcmVuZGVyaW5nIG9mICNlYWNoIGhlbHBlcnMuXG4gIGlmKG9wdGlvbnMucGxhY2Vob2xkZXIuX191bmxlc3NDYWNoZSA9PT0gY29uZGl0aW9uKXtcbiAgICByZXR1cm4gbnVsbDsgLy8gUmV0dXJuIG51bGwgcHJldmVudCdzIHJlLXJlbmRpbmcgb2Ygb3VyIHBsYWNlaG9sZGVyLlxuICB9XG5cbiAgb3B0aW9ucy5wbGFjZWhvbGRlci5fX3VubGVzc0NhY2hlID0gY29uZGl0aW9uO1xuXG4gIC8vIFJlbmRlciB0aGUgYXByb3ByZWF0ZSBibG9jayBzdGF0ZW1lbnRcbiAgaWYoIWNvbmRpdGlvbiAmJiAgb3B0aW9ucy50ZW1wbGF0ZSl7XG4gICAgcmV0dXJuIG9wdGlvbnMudGVtcGxhdGUucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgb3B0aW9ucywgKG9wdGlvbnMubW9ycGguY29udGV4dHVhbEVsZW1lbnQgfHwgb3B0aW9ucy5tb3JwaC5lbGVtZW50KSk7XG4gIH1cbiAgZWxzZSBpZihjb25kaXRpb24gJiYgb3B0aW9ucy5pbnZlcnNlKXtcbiAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIG9wdGlvbnMsIChvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50IHx8IG9wdGlvbnMubW9ycGguZWxlbWVudCkpO1xuICB9XG5cbiAgcmV0dXJuICcnO1xufTtcblxuLy8gR2l2ZW4gYW4gYXJyYXksIHByZWRpY2F0ZSBhbmQgb3B0aW9uYWwgZXh0cmEgdmFyaWFibGUsIGZpbmRzIHRoZSBpbmRleCBpbiB0aGUgYXJyYXkgd2hlcmUgcHJlZGljYXRlIGlzIHRydWVcbmZ1bmN0aW9uIGZpbmRJbmRleChhcnIsIHByZWRpY2F0ZSwgY2lkKSB7XG4gIGlmIChhcnIgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2ZpbmRJbmRleCBjYWxsZWQgb24gbnVsbCBvciB1bmRlZmluZWQnKTtcbiAgfVxuICBpZiAodHlwZW9mIHByZWRpY2F0ZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ByZWRpY2F0ZSBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuICB2YXIgbGlzdCA9IE9iamVjdChhcnIpO1xuICB2YXIgbGVuZ3RoID0gbGlzdC5sZW5ndGggPj4+IDA7XG4gIHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdO1xuICB2YXIgdmFsdWU7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhbHVlID0gbGlzdFtpXTtcbiAgICBpZiAocHJlZGljYXRlLmNhbGwodGhpc0FyZywgdmFsdWUsIGksIGxpc3QsIGNpZCkpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmhlbHBlcnMuZWFjaCA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcblxuICBpZihfLmlzTnVsbChwYXJhbXNbMF0pIHx8IF8uaXNVbmRlZmluZWQocGFyYW1zWzBdKSl7IGNvbnNvbGUud2FybignVW5kZWZpbmVkIHZhbHVlIHBhc3NlZCB0byBlYWNoIGhlbHBlciEgTWF5YmUgdHJ5IHByb3ZpZGluZyBhIGRlZmF1bHQgdmFsdWU/Jywgb3B0aW9ucy5jb250ZXh0KTsgcmV0dXJuIG51bGw7IH1cblxuICB2YXIgdmFsdWUgPSAocGFyYW1zWzBdLmlzQ29sbGVjdGlvbikgPyBwYXJhbXNbMF0ubW9kZWxzIDogcGFyYW1zWzBdLCAvLyBBY2NlcHRzIGNvbGxlY3Rpb25zIG9yIGFycmF5c1xuICAgICAgc3RhcnQsIGVuZCwgLy8gdXNlZCBiZWxvdyB0byByZW1vdmUgdHJhaWxpbmcganVuayBtb3JwaHMgZnJvbSB0aGUgZG9tXG4gICAgICBwb3NpdGlvbiwgLy8gU3RvcmVzIHRoZSBpdGVyYXRlZCBlbGVtZW50J3MgaW50ZWdlciBwb3NpdGlvbiBpbiB0aGUgZG9tIGxpc3RcbiAgICAgIGN1cnJlbnRNb2RlbCA9IGZ1bmN0aW9uKGVsZW1lbnQsIGluZGV4LCBhcnJheSwgY2lkKXtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQuY2lkID09PSBjaWQ7IC8vIFJldHVybnMgdHJ1ZSBpZiBjdXJyZW50bHkgb2JzZXJ2ZWQgZWxlbWVudCBpcyB0aGUgY3VycmVudCBtb2RlbC5cbiAgICAgIH07XG5cbiAgLy8gQ3JlYXRlIG91ciBtb3JwaCBhcnJheSBpZiBpdCBkb2VzbnQgZXhpc3RcbiAgb3B0aW9ucy5wbGFjZWhvbGRlci5tb3JwaHMgPSBvcHRpb25zLnBsYWNlaG9sZGVyLm1vcnBocyB8fCBbXTtcblxuICBfLmVhY2godmFsdWUsIGZ1bmN0aW9uKG9iaiwga2V5LCBsaXN0KXtcblxuICAgIGlmKCFfLmlzRnVuY3Rpb24ob2JqLnNldCkpeyByZXR1cm4gY29uc29sZS5lcnJvcignTW9kZWwgJywgb2JqLCAnaGFzIG5vIG1ldGhvZCAuc2V0KCkhJyk7IH1cblxuICAgIHBvc2l0aW9uID0gZmluZEluZGV4KG9wdGlvbnMucGxhY2Vob2xkZXIubW9ycGhzLCBjdXJyZW50TW9kZWwsIG9iai5jaWQpO1xuXG4gICAgLy8gVE9ETzogVGhlc2UgbmVlZCB0byBiZSByZS1hZGRlZCBpbiBhcyBkYXRhIGF0dHJpYnV0ZXNcbiAgICAvLyBFdmVuIGlmIHJlbmRlcmVkIGFscmVhZHksIHVwZGF0ZSBlYWNoIGVsZW1lbnQncyBpbmRleCwga2V5LCBmaXJzdCBhbmQgbGFzdCBpbiBjYXNlIG9mIG9yZGVyIGNoYW5nZXMgb3IgZWxlbWVudCByZW1vdmFsc1xuICAgIC8vIGlmKF8uaXNBcnJheSh2YWx1ZSkpe1xuICAgIC8vICAgb2JqLnNldCh7J0BpbmRleCc6IGtleSwgJ0BmaXJzdCc6IChrZXkgPT09IDApLCAnQGxhc3QnOiAoa2V5ID09PSB2YWx1ZS5sZW5ndGgtMSl9LCB7c2lsZW50OiB0cnVlfSk7XG4gICAgLy8gfVxuICAgIC8vXG4gICAgLy8gaWYoIV8uaXNBcnJheSh2YWx1ZSkgJiYgXy5pc09iamVjdCh2YWx1ZSkpe1xuICAgIC8vICAgb2JqLnNldCh7J0BrZXknIDoga2V5fSwge3NpbGVudDogdHJ1ZX0pO1xuICAgIC8vIH1cblxuICAgIC8vIElmIHRoaXMgbW9kZWwgaXMgbm90IHRoZSBtb3JwaCBlbGVtZW50IGF0IHRoaXMgaW5kZXhcbiAgICBpZihwb3NpdGlvbiAhPT0ga2V5KXtcblxuICAgICAgLy8gQ3JlYXRlIGEgbGF6eXZhbHVlIHdob3MgdmFsdWUgaXMgdGhlIGNvbnRlbnQgaW5zaWRlIG91ciBibG9jayBoZWxwZXIgcmVuZGVyZWQgaW4gdGhlIGNvbnRleHQgb2YgdGhpcyBjdXJyZW50IGxpc3Qgb2JqZWN0LiBSZXR1cm5zIHRoZSByZW5kZXJlZCBkb20gZm9yIHRoaXMgbGlzdCBlbGVtZW50LlxuICAgICAgdmFyIGxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKXtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMudGVtcGxhdGUucmVuZGVyKCgob3B0aW9ucy50ZW1wbGF0ZS5ibG9ja1BhcmFtcyA9PT0gMCk/b2JqOm9wdGlvbnMuY29udGV4dCksIG9wdGlvbnMsIChvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50IHx8IG9wdGlvbnMubW9ycGguZWxlbWVudCksIFtvYmpdKTtcbiAgICAgIH0sIHttb3JwaDogb3B0aW9ucy5wbGFjZWhvbGRlcn0pO1xuXG4gICAgICAvLyBJZiB0aGlzIG1vZGVsIGlzIHJlbmRlcmVkIHNvbWV3aGVyZSBlbHNlIGluIHRoZSBsaXN0LCBkZXN0cm95IGl0XG4gICAgICBpZihwb3NpdGlvbiA+IC0xKXtcbiAgICAgICAgb3B0aW9ucy5wbGFjZWhvbGRlci5tb3JwaHNbcG9zaXRpb25dLmRlc3Ryb3koKTtcbiAgICAgIH1cblxuICAgICAgLy8gRGVzdHJveSB0aGUgbW9ycGggd2UncmUgcmVwbGFjaW5nXG4gICAgICBpZihvcHRpb25zLnBsYWNlaG9sZGVyLm1vcnBoc1trZXldKXtcbiAgICAgICAgb3B0aW9ucy5wbGFjZWhvbGRlci5tb3JwaHNba2V5XS5kZXN0cm95KCk7XG4gICAgICB9XG5cbiAgICAgIC8vIEluc2VydCBvdXIgbmV3bHkgcmVuZGVyZWQgdmFsdWUgKGEgZG9jdW1lbnQgdHJlZSkgaW50byBvdXIgcGxhY2Vob2xkZXIgKHRoZSBjb250YWluaW5nIGVsZW1lbnQpIGF0IGl0cyByZXF1ZXN0ZWQgcG9zaXRpb24gKHdoZXJlIHdlIGN1cnJlbnRseSBhcmUgaW4gdGhlIG9iamVjdCBsaXN0KVxuICAgICAgb3B0aW9ucy5wbGFjZWhvbGRlci5pbnNlcnQoa2V5LCBsYXp5VmFsdWUudmFsdWUoKSk7XG5cbiAgICAgIC8vIExhYmVsIHRoZSBpbnNlcnRlZCBtb3JwaCBlbGVtZW50IHdpdGggdGhpcyBtb2RlbCdzIGNpZFxuICAgICAgb3B0aW9ucy5wbGFjZWhvbGRlci5tb3JwaHNba2V5XS5jaWQgPSBvYmouY2lkO1xuXG4gICAgfVxuXG4gIH0sIHRoaXMpO1xuXG4gIC8vIElmIGFueSBtb3JlIG1vcnBocyBhcmUgbGVmdCBvdmVyLCByZW1vdmUgdGhlbS4gV2UndmUgYWxyZWFkeSBnb25lIHRocm91Z2ggYWxsIHRoZSBtb2RlbHMuXG4gIHN0YXJ0ID0gdmFsdWUubGVuZ3RoO1xuICBlbmQgPSBvcHRpb25zLnBsYWNlaG9sZGVyLm1vcnBocy5sZW5ndGggLSAxO1xuICBmb3IoZW5kOyBzdGFydCA8PSBlbmQ7IGVuZC0tKXtcbiAgICBvcHRpb25zLnBsYWNlaG9sZGVyLm1vcnBoc1tlbmRdLmRlc3Ryb3koKTtcbiAgfVxuXG4gIC8vIFJldHVybiBudWxsIHByZXZlbnQncyByZS1yZW5kaW5nIG9mIG91ciBwbGFjZWhvbGRlci4gT3VyIHBsYWNlaG9sZGVyIChjb250YWluaW5nIGVsZW1lbnQpIG5vdyBoYXMgYWxsIHRoZSBkb20gd2UgbmVlZC5cbiAgcmV0dXJuIG51bGw7XG5cbn07XG5cbmhlbHBlcnMud2l0aCA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcblxuICAvLyBSZW5kZXIgdGhlIGNvbnRlbnQgaW5zaWRlIG91ciBibG9jayBoZWxwZXIgd2l0aCB0aGUgY29udGV4dCBvZiB0aGlzIG9iamVjdC4gUmV0dXJucyBhIGRvbSB0cmVlLlxuICByZXR1cm4gb3B0aW9ucy50ZW1wbGF0ZS5yZW5kZXIocGFyYW1zWzBdLCBvcHRpb25zLCAob3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCB8fCBvcHRpb25zLm1vcnBoLmVsZW1lbnQpKTtcblxufTtcblxuaGVscGVycy5wYXJ0aWFsID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuICB2YXIgcGFydGlhbCA9IHBhcnRpYWxzW3BhcmFtc1swXV07XG4gIGlmKCBwYXJ0aWFsICYmIHBhcnRpYWwuaXNIVE1MQmFycyApe1xuICAgIHJldHVybiBwYXJ0aWFsLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIGVudik7XG4gIH1cblxufTtcblxuZXhwb3J0IGRlZmF1bHQgaGVscGVycztcbiIsIi8vIFJlYm91bmQgQ29tcHV0ZWQgUHJvcGVydHlcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IHByb3BlcnR5Q29tcGlsZXIgZnJvbSBcInByb3BlcnR5LWNvbXBpbGVyL3Byb3BlcnR5LWNvbXBpbGVyXCI7XG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcblxuLy8gUmV0dXJucyB0cnVlIGlmIHN0ciBzdGFydHMgd2l0aCB0ZXN0XG5mdW5jdGlvbiBzdGFydHNXaXRoKHN0ciwgdGVzdCl7XG4gIGlmKHN0ciA9PT0gdGVzdCkgcmV0dXJuIHRydWU7XG4gIHJldHVybiBzdHIuc3Vic3RyaW5nKDAsIHRlc3QubGVuZ3RoKzEpID09PSB0ZXN0KycuJztcbn1cblxuXG4vLyBDYWxsZWQgYWZ0ZXIgY2FsbHN0YWNrIGlzIGV4YXVzdGVkIHRvIGNhbGwgYWxsIG9mIHRoaXMgY29tcHV0ZWQgcHJvcGVydHknc1xuLy8gZGVwZW5kYW50cyB0aGF0IG5lZWQgdG8gYmUgcmVjb21wdXRlZFxuZnVuY3Rpb24gcmVjb21wdXRlQ2FsbGJhY2soKXtcbiAgdmFyIGkgPSAwLCBsZW4gPSB0aGlzLl90b0NhbGwubGVuZ3RoO1xuICBkZWxldGUgdGhpcy5fcmVjb21wdXRlVGltZW91dDtcbiAgZm9yKGk9MDtpPGxlbjtpKyspe1xuICAgIHRoaXMuX3RvQ2FsbC5zaGlmdCgpLmNhbGwoKTtcbiAgfVxuICB0aGlzLl90b0NhbGwuYWRkZWQgPSB7fTtcbn1cblxudmFyIENvbXB1dGVkUHJvcGVydHkgPSBmdW5jdGlvbihwcm9wLCBvcHRpb25zKXtcblxuICBpZighXy5pc0Z1bmN0aW9uKHByb3ApKSByZXR1cm4gY29uc29sZS5lcnJvcignQ29tcHV0ZWRQcm9wZXJ0eSBjb25zdHJ1Y3RvciBtdXN0IGJlIHBhc3NlZCBhIGZ1bmN0aW9uIScsIHByb3AsICdGb3VuZCBpbnN0ZWFkLicpO1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgdGhpcy5jaWQgPSBfLnVuaXF1ZUlkKCdjb21wdXRlZFByb3BldHknKTtcbiAgdGhpcy5uYW1lID0gb3B0aW9ucy5uYW1lO1xuICB0aGlzLnJldHVyblR5cGUgPSBudWxsO1xuICB0aGlzLl9fb2JzZXJ2ZXJzID0ge307XG4gIHRoaXMuaGVscGVycyA9IHt9O1xuICB0aGlzLndhaXRpbmcgPSB7fTtcbiAgdGhpcy5pc0NoYW5naW5nID0gZmFsc2U7XG4gIHRoaXMuaXNEaXJ0eSA9IHRydWU7XG4gIHRoaXMuZnVuYyA9IHByb3A7XG4gIF8uYmluZEFsbCh0aGlzLCAnb25Nb2RpZnknLCAnbWFya0RpcnR5Jyk7XG4gIHRoaXMuZGVwcyA9IHByb3BlcnR5Q29tcGlsZXIuY29tcGlsZShwcm9wLCB0aGlzLm5hbWUpO1xuXG4gIC8vIENyZWF0ZSBsaW5lYWdlIHRvIHBhc3MgdG8gb3VyIGNhY2hlIG9iamVjdHNcbiAgdmFyIGxpbmVhZ2UgPSB7XG4gICAgcGFyZW50OiB0aGlzLnNldFBhcmVudCggb3B0aW9ucy5wYXJlbnQgfHwgdGhpcyApLFxuICAgIHJvb3Q6IHRoaXMuc2V0Um9vdCggb3B0aW9ucy5yb290IHx8IG9wdGlvbnMucGFyZW50IHx8IHRoaXMgKSxcbiAgICBwYXRoOiB0aGlzLl9fcGF0aCA9IG9wdGlvbnMucGF0aCB8fCB0aGlzLl9fcGF0aFxuICB9O1xuXG4gIC8vIFJlc3VsdHMgQ2FjaGUgT2JqZWN0c1xuICAvLyBUaGVzZSBtb2RlbHMgd2lsbCBuZXZlciBiZSByZS1jcmVhdGVkIGZvciB0aGUgbGlmZXRpbWUgb2YgdGhlIENvbXB1dGVkIFByb2VwcnR5XG4gIC8vIE9uIFJlY29tcHV0ZSB0aGV5IGFyZSB1cGRhdGVkIHdpdGggbmV3IHZhbHVlcy5cbiAgLy8gT24gQ2hhbmdlIHRoZWlyIG5ldyB2YWx1ZXMgYXJlIHB1c2hlZCB0byB0aGUgb2JqZWN0IGl0IGlzIHRyYWNraW5nXG4gIHRoaXMuY2FjaGUgPSB7XG4gICAgbW9kZWw6IG5ldyBSZWJvdW5kLk1vZGVsKHt9LCBsaW5lYWdlKSxcbiAgICBjb2xsZWN0aW9uOiBuZXcgUmVib3VuZC5Db2xsZWN0aW9uKFtdLCBsaW5lYWdlKSxcbiAgICB2YWx1ZTogdW5kZWZpbmVkXG4gIH07XG5cbiAgdGhpcy53aXJlKCk7XG5cbn07XG5cbl8uZXh0ZW5kKENvbXB1dGVkUHJvcGVydHkucHJvdG90eXBlLCBCYWNrYm9uZS5FdmVudHMsIHtcblxuICBpc0NvbXB1dGVkUHJvcGVydHk6IHRydWUsXG4gIGlzRGF0YTogdHJ1ZSxcbiAgX19wYXRoOiBmdW5jdGlvbigpeyByZXR1cm4gJyc7IH0sXG5cblxuICBtYXJrRGlydHk6IGZ1bmN0aW9uKCl7XG4gICAgaWYodGhpcy5pc0RpcnR5KSByZXR1cm47XG4gICAgdGhpcy5pc0RpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLnRyaWdnZXIoJ2RpcnR5JywgdGhpcyk7XG4gIH0sXG5cbiAgLy8gQXR0YWNoZWQgdG8gbGlzdGVuIHRvIGFsbCBldmVudHMgd2hlcmUgdGhpcyBDb21wdXRlZCBQcm9wZXJ0eSdzIGRlcGVuZGFuY2llc1xuICAvLyBhcmUgc3RvcmVkLiBTZWUgd2lyZSgpLiBXaWxsIHJlLWV2YWx1YXRlIGFueSBjb21wdXRlZCBwcm9wZXJ0aWVzIHRoYXRcbiAgLy8gZGVwZW5kIG9uIHRoZSBjaGFuZ2VkIGRhdGEgdmFsdWUgd2hpY2ggdHJpZ2dlcmVkIHRoaXMgY2FsbGJhY2suXG4gIG9uUmVjb21wdXRlOiBmdW5jdGlvbih0eXBlLCBtb2RlbCwgY29sbGVjdGlvbiwgb3B0aW9ucyl7XG4gICAgdmFyIHNob3J0Y2lyY3VpdCA9IHsgY2hhbmdlOiAxLCBzb3J0OiAxLCByZXF1ZXN0OiAxLCBkZXN0cm95OiAxLCBzeW5jOiAxLCBlcnJvcjogMSwgaW52YWxpZDogMSwgcm91dGU6IDEsIGRpcnR5OiAxIH07XG4gICAgaWYoIHNob3J0Y2lyY3VpdFt0eXBlXSB8fCAhbW9kZWwuaXNEYXRhICkgcmV0dXJuO1xuICAgIG1vZGVsIHx8IChtb2RlbCA9IHt9KTtcbiAgICBjb2xsZWN0aW9uIHx8IChjb2xsZWN0aW9uID0ge30pO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdGhpcy5fdG9DYWxsIHx8ICh0aGlzLl90b0NhbGwgPSBbXSk7XG4gICAgdGhpcy5fdG9DYWxsLmFkZGVkIHx8ICh0aGlzLl90b0NhbGwuYWRkZWQgPSB7fSk7XG4gICAgIWNvbGxlY3Rpb24uaXNEYXRhICYmIChvcHRpb25zID0gY29sbGVjdGlvbikgJiYgKGNvbGxlY3Rpb24gPSBtb2RlbCk7XG4gICAgdmFyIHB1c2ggPSBmdW5jdGlvbihhcnIpe1xuICAgICAgdmFyIGksIGxlbiA9IGFyci5sZW5ndGg7XG4gICAgICB0aGlzLmFkZGVkIHx8ICh0aGlzLmFkZGVkID0ge30pO1xuICAgICAgZm9yKGk9MDtpPGxlbjtpKyspe1xuICAgICAgICBpZih0aGlzLmFkZGVkW2FycltpXS5jaWRdKSBjb250aW51ZTtcbiAgICAgICAgdGhpcy5hZGRlZFthcnJbaV0uY2lkXSA9IDE7XG4gICAgICAgIHRoaXMucHVzaChhcnJbaV0pO1xuICAgICAgfVxuICAgIH0sIHBhdGgsIHZlY3RvcjtcbiAgICB2ZWN0b3IgPSBwYXRoID0gY29sbGVjdGlvbi5fX3BhdGgoKS5yZXBsYWNlKC9cXC4/XFxbLipcXF0vaWcsICcuQGVhY2gnKTtcblxuICAgIC8vIElmIGEgcmVzZXQgZXZlbnQgb24gYSBNb2RlbCwgY2hlY2sgZm9yIGNvbXB1dGVkIHByb3BlcnRpZXMgdGhhdCBkZXBlbmRcbiAgICAvLyBvbiBlYWNoIGNoYW5nZWQgYXR0cmlidXRlJ3MgZnVsbCBwYXRoLlxuICAgIGlmKHR5cGUgPT09ICdyZXNldCcgJiYgb3B0aW9ucy5wcmV2aW91c0F0dHJpYnV0ZXMpe1xuICAgICAgXy5lYWNoKG9wdGlvbnMucHJldmlvdXNBdHRyaWJ1dGVzLCBmdW5jdGlvbih2YWx1ZSwga2V5KXtcbiAgICAgICAgdmVjdG9yID0gcGF0aCArIChwYXRoICYmICcuJykgKyBrZXk7XG4gICAgICAgIF8uZWFjaCh0aGlzLl9fY29tcHV0ZWREZXBzLCBmdW5jdGlvbihkZXBlbmRhbnRzLCBkZXBlbmRhbmN5KXtcbiAgICAgICAgICBzdGFydHNXaXRoKHZlY3RvciwgZGVwZW5kYW5jeSkgJiYgcHVzaC5jYWxsKHRoaXMuX3RvQ2FsbCwgZGVwZW5kYW50cyk7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLy8gSWYgYSByZXNldCBldmVudCBvbiBhIENvbGxjdGlvbiwgY2hlY2sgZm9yIGNvbXB1dGVkIHByb3BlcnRpZXMgdGhhdCBkZXBlbmRcbiAgICAvLyBvbiBhbnl0aGluZyBpbnNpZGUgdGhhdCBjb2xsZWN0aW9uLlxuICAgIGVsc2UgaWYodHlwZSA9PT0gJ3Jlc2V0JyAmJiBvcHRpb25zLnByZXZpb3VzTW9kZWxzKXtcbiAgICAgIF8uZWFjaCh0aGlzLl9fY29tcHV0ZWREZXBzLCBmdW5jdGlvbihkZXBlbmRhbnRzLCBkZXBlbmRhbmN5KXtcbiAgICAgICAgc3RhcnRzV2l0aChkZXBlbmRhbmN5LCB2ZWN0b3IpICYmIHB1c2guY2FsbCh0aGlzLl90b0NhbGwsIGRlcGVuZGFudHMpO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLy8gSWYgYW4gYWRkIG9yIHJlbW92ZSBldmVudCwgY2hlY2sgZm9yIGNvbXB1dGVkIHByb3BlcnRpZXMgdGhhdCBkZXBlbmQgb25cbiAgICAvLyBhbnl0aGluZyBpbnNpZGUgdGhhdCBjb2xsZWN0aW9uIG9yIHRoYXQgY29udGFpbnMgdGhhdCBjb2xsZWN0aW9uLlxuICAgIGVsc2UgaWYodHlwZSA9PT0gJ2FkZCcgfHwgdHlwZSA9PT0gJ3JlbW92ZScpe1xuICAgICAgXy5lYWNoKHRoaXMuX19jb21wdXRlZERlcHMsIGZ1bmN0aW9uKGRlcGVuZGFudHMsIGRlcGVuZGFuY3kpe1xuICAgICAgICBpZiggc3RhcnRzV2l0aChkZXBlbmRhbmN5LCB2ZWN0b3IpIHx8IHN0YXJ0c1dpdGgodmVjdG9yLCBkZXBlbmRhbmN5KSApIHB1c2guY2FsbCh0aGlzLl90b0NhbGwsIGRlcGVuZGFudHMpOztcbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8vIElmIGEgY2hhbmdlIGV2ZW50LCB0cmlnZ2VyIGFueXRoaW5nIHRoYXQgZGVwZW5kcyBvbiB0aGF0IGNoYW5nZWQgcGF0aC5cbiAgICBlbHNlIGlmKHR5cGUuaW5kZXhPZignY2hhbmdlOicpID09PSAwKXtcbiAgICAgIHZlY3RvciA9IHR5cGUucmVwbGFjZSgnY2hhbmdlOicsICcnKS5yZXBsYWNlKC9cXC4/XFxbLipcXF0vaWcsICcuQGVhY2gnKTtcbiAgICAgIF8uZWFjaCh0aGlzLl9fY29tcHV0ZWREZXBzLCBmdW5jdGlvbihkZXBlbmRhbnRzLCBkZXBlbmRhbmN5KXtcbiAgICAgICAgc3RhcnRzV2l0aCh2ZWN0b3IsIGRlcGVuZGFuY3kpICYmIHB1c2guY2FsbCh0aGlzLl90b0NhbGwsIGRlcGVuZGFudHMpO1xuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgdmFyIGksIGxlbiA9IHRoaXMuX3RvQ2FsbC5sZW5ndGg7XG4gICAgZm9yKGk9MDtpPGxlbjtpKyspe1xuICAgICAgdGhpcy5fdG9DYWxsW2ldLm1hcmtEaXJ0eSgpO1xuICAgIH1cblxuICAgIC8vIE5vdGlmaWVzIGFsbCBjb21wdXRlZCBwcm9wZXJ0aWVzIGluIHRoZSBkZXBlbmRhbnRzIGFycmF5IHRvIHJlY29tcHV0ZS5cbiAgICAvLyBNYXJrcyBldmVyeW9uZSBhcyBkaXJ0eSBhbmQgdGhlbiBjYWxscyB0aGVtLlxuICAgIGlmKCF0aGlzLl9yZWNvbXB1dGVUaW1lb3V0KSB0aGlzLl9yZWNvbXB1dGVUaW1lb3V0ID0gc2V0VGltZW91dChfLmJpbmQocmVjb21wdXRlQ2FsbGJhY2ssIHRoaXMpLCAwKTtcbiAgICByZXR1cm47XG4gIH0sXG5cblxuICAvLyBDYWxsZWQgd2hlbiBhIENvbXB1dGVkIFByb3BlcnR5J3MgYWN0aXZlIGNhY2hlIG9iamVjdCBjaGFuZ2VzLlxuICAvLyBQdXNoZXMgYW55IGNoYW5nZXMgdG8gQ29tcHV0ZWQgUHJvcGVydHkgdGhhdCByZXR1cm5zIGEgZGF0YSBvYmplY3QgYmFjayB0b1xuICAvLyB0aGUgb3JpZ2luYWwgb2JqZWN0LlxuICBvbk1vZGlmeTogZnVuY3Rpb24odHlwZSwgbW9kZWwsIGNvbGxlY3Rpb24sIG9wdGlvbnMpe1xuICAgIHZhciBzaG9ydGNpcmN1aXQgPSB7IHNvcnQ6IDEsIHJlcXVlc3Q6IDEsIGRlc3Ryb3k6IDEsIHN5bmM6IDEsIGVycm9yOiAxLCBpbnZhbGlkOiAxLCByb3V0ZTogMSB9O1xuICAgIGlmKCAhdGhpcy50cmFja2luZyB8fCBzaG9ydGNpcmN1aXRbdHlwZV0gfHwgfnR5cGUuaW5kZXhPZignY2hhbmdlOicpICkgcmV0dXJuO1xuICAgIG1vZGVsIHx8IChtb2RlbCA9IHt9KTtcbiAgICBjb2xsZWN0aW9uIHx8IChjb2xsZWN0aW9uID0ge30pO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgIWNvbGxlY3Rpb24uaXNEYXRhICYmIF8uaXNPYmplY3QoY29sbGVjdGlvbikgJiYgKG9wdGlvbnMgPSBjb2xsZWN0aW9uKSAmJiAoY29sbGVjdGlvbiA9IG1vZGVsKTtcbiAgICB2YXIgc3JjID0gdGhpcztcbiAgICB2YXIgcGF0aCA9IGNvbGxlY3Rpb24uX19wYXRoKCkucmVwbGFjZShzcmMuX19wYXRoKCksICcnKS5yZXBsYWNlKC9eXFwuLywgJycpO1xuICAgIHZhciBkZXN0ID0gdGhpcy50cmFja2luZy5nZXQocGF0aCk7XG5cbiAgICBpZihfLmlzVW5kZWZpbmVkKGRlc3QpKSByZXR1cm47XG4gICAgaWYodHlwZSA9PT0gJ2NoYW5nZScpIGRlc3Quc2V0ICYmIGRlc3Quc2V0KG1vZGVsLmNoYW5nZWRBdHRyaWJ1dGVzKCkpO1xuICAgIGVsc2UgaWYodHlwZSA9PT0gJ3Jlc2V0JykgZGVzdC5yZXNldCAmJiBkZXN0LnJlc2V0KG1vZGVsKTtcbiAgICBlbHNlIGlmKHR5cGUgPT09ICdhZGQnKSAgZGVzdC5hZGQgJiYgZGVzdC5hZGQobW9kZWwpO1xuICAgIGVsc2UgaWYodHlwZSA9PT0gJ3JlbW92ZScpICBkZXN0LnJlbW92ZSAmJiBkZXN0LnJlbW92ZShtb2RlbCk7XG4gICAgLy8gVE9ETzogQWRkIHNvcnRcbiAgfSxcblxuICAvLyBBZGRzIGEgbGl0ZW5lciB0byB0aGUgcm9vdCBvYmplY3QgYW5kIHRlbGxzIGl0IHdoYXQgcHJvcGVydGllcyB0aGlzXG4gIC8vIENvbXB1dGVkIFByb3BlcnR5IGRlcGVuZCBvbi5cbiAgLy8gVGhlIGxpc3RlbmVyIHdpbGwgcmUtY29tcHV0ZSB0aGlzIENvbXB1dGVkIFByb3BlcnR5IHdoZW4gYW55IGFyZSBjaGFuZ2VkLlxuICB3aXJlOiBmdW5jdGlvbigpe1xuICAgIHZhciByb290ID0gdGhpcy5fX3Jvb3RfXztcbiAgICB2YXIgY29udGV4dCA9IHRoaXMuX19wYXJlbnRfXztcbiAgICByb290Ll9fY29tcHV0ZWREZXBzIHx8IChyb290Ll9fY29tcHV0ZWREZXBzID0ge30pO1xuXG4gICAgXy5lYWNoKHRoaXMuZGVwcywgZnVuY3Rpb24ocGF0aCl7XG4gICAgICB2YXIgZGVwID0gcm9vdC5nZXQocGF0aCwge3JhdzogdHJ1ZX0pO1xuICAgICAgaWYoIWRlcCB8fCAhZGVwLmlzQ29tcHV0ZWRQcm9wZXJ0eSkgcmV0dXJuO1xuICAgICAgZGVwLm9uKCdkaXJ0eScsIHRoaXMubWFya0RpcnR5KTtcbiAgICB9LCB0aGlzKTtcblxuICAgIF8uZWFjaCh0aGlzLmRlcHMsIGZ1bmN0aW9uKHBhdGgpe1xuICAgICAgLy8gRmluZCBhY3R1YWwgcGF0aCBmcm9tIHJlbGF0aXZlIHBhdGhzXG4gICAgICB2YXIgc3BsaXQgPSAkLnNwbGl0UGF0aChwYXRoKTtcbiAgICAgIHdoaWxlKHNwbGl0WzBdID09PSAnQHBhcmVudCcpe1xuICAgICAgICBjb250ZXh0ID0gY29udGV4dC5fX3BhcmVudF9fO1xuICAgICAgICBzcGxpdC5zaGlmdCgpO1xuICAgICAgfVxuXG4gICAgICBwYXRoID0gY29udGV4dC5fX3BhdGgoKS5yZXBsYWNlKC9cXC4/XFxbLipcXF0vaWcsICcuQGVhY2gnKTtcbiAgICAgIHBhdGggPSBwYXRoICsgKHBhdGggJiYgJy4nKSArIHNwbGl0LmpvaW4oJy4nKTtcblxuICAgICAgLy8gQWRkIG91cnNlbHZlcyBhcyBkZXBlbmRhbnRzXG4gICAgICByb290Ll9fY29tcHV0ZWREZXBzW3BhdGhdIHx8IChyb290Ll9fY29tcHV0ZWREZXBzW3BhdGhdID0gW10pO1xuICAgICAgcm9vdC5fX2NvbXB1dGVkRGVwc1twYXRoXS5wdXNoKHRoaXMpO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgLy8gRW5zdXJlIHdlIG9ubHkgaGF2ZSBvbmUgbGlzdGVuZXIgcGVyIE1vZGVsIGF0IGEgdGltZS5cbiAgICBjb250ZXh0Lm9mZignYWxsJywgdGhpcy5vblJlY29tcHV0ZSkub24oJ2FsbCcsIHRoaXMub25SZWNvbXB1dGUpO1xuICB9LFxuXG4gIC8vIENhbGwgdGhpcyBjb21wdXRlZCBwcm9wZXJ0eSBsaWtlIHlvdSB3b3VsZCB3aXRoIEZ1bmN0aW9uLmNhbGwoKVxuICBjYWxsOiBmdW5jdGlvbigpe1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgY29udGV4dCA9IGFyZ3Muc2hpZnQoKTtcbiAgICByZXR1cm4gdGhpcy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgfSxcblxuICAvLyBDYWxsIHRoaXMgY29tcHV0ZWQgcHJvcGVydHkgbGlrZSB5b3Ugd291bGQgd2l0aCBGdW5jdGlvbi5hcHBseSgpXG4gIC8vIE9ubHkgcHJvcGVydGllcyB0aGF0IGFyZSBtYXJrZWQgYXMgZGlydHkgYW5kIGFyZSBub3QgYWxyZWFkeSBjb21wdXRpbmdcbiAgLy8gdGhlbXNlbHZlcyBhcmUgZXZhbHVhdGVkIHRvIHByZXZlbnQgY3ljbGljIGNhbGxiYWNrcy4gSWYgYW55IGRlcGVuZGFudHNcbiAgLy8gYXJlbid0IGZpbmlzaGVkIGNvbXB1dGVkaW5nLCB3ZSBhZGQgb3Vyc2VsdmVkIHRvIHRoZWlyIHdhaXRpbmcgbGlzdC5cbiAgLy8gVmFuaWxsYSBvYmplY3RzIHJldHVybmVkIGZyb20gdGhlIGZ1bmN0aW9uIGFyZSBwcm9tb3RlZCB0byBSZWJvdW5kIE9iamVjdHMuXG4gIC8vIFRoZW4sIHNldCB0aGUgcHJvcGVyIHJldHVybiB0eXBlIGZvciBmdXR1cmUgZmV0Y2hlcyBmcm9tIHRoZSBjYWNoZSBhbmQgc2V0XG4gIC8vIHRoZSBuZXcgY29tcHV0ZWQgdmFsdWUuIFRyYWNrIGNoYW5nZXMgdG8gdGhlIGNhY2hlIHRvIHB1c2ggaXQgYmFjayB1cCB0b1xuICAvLyB0aGUgb3JpZ2luYWwgb2JqZWN0IGFuZCByZXR1cm4gdGhlIHZhbHVlLlxuICBhcHBseTogZnVuY3Rpb24oY29udGV4dCwgcGFyYW1zKXtcblxuICAgIGlmKCF0aGlzLmlzRGlydHkgfHwgdGhpcy5pc0NoYW5naW5nKSByZXR1cm47XG4gICAgdGhpcy5pc0NoYW5naW5nID0gdHJ1ZTtcblxuICAgIHZhciB2YWx1ZSA9IHRoaXMuY2FjaGVbdGhpcy5yZXR1cm5UeXBlXSxcbiAgICAgICAgcmVzdWx0O1xuXG4gICAgY29udGV4dCB8fCAoY29udGV4dCA9IHRoaXMuX19wYXJlbnRfXyk7XG5cbiAgICAvLyBDaGVjayBhbGwgb2Ygb3VyIGRlcGVuZGFuY2llcyB0byBzZWUgaWYgdGhleSBhcmUgZXZhbHVhdGluZy5cbiAgICAvLyBJZiB3ZSBoYXZlIGEgZGVwZW5kYW5jeSB0aGF0IGlzIGRpcnR5IGFuZCB0aGlzIGlzbnQgaXRzIGZpcnN0IHJ1bixcbiAgICAvLyBMZXQgdGhpcyBkZXBlbmRhbmN5IGtub3cgdGhhdCB3ZSBhcmUgd2FpdGluZyBmb3IgaXQuXG4gICAgLy8gSXQgd2lsbCByZS1ydW4gdGhpcyBDb21wdXRlZCBQcm9wZXJ0eSBhZnRlciBpdCBmaW5pc2hlcy5cbiAgICBfLmVhY2godGhpcy5kZXBzLCBmdW5jdGlvbihkZXApe1xuICAgICAgdmFyIGRlcGVuZGFuY3kgPSBjb250ZXh0LmdldChkZXAsIHtyYXc6IHRydWV9KTtcbiAgICAgIGlmKCFkZXBlbmRhbmN5IHx8ICFkZXBlbmRhbmN5LmlzQ29tcHV0ZWRQcm9wZXJ0eSkgcmV0dXJuO1xuICAgICAgaWYoZGVwZW5kYW5jeS5pc0RpcnR5ICYmIGRlcGVuZGFuY3kucmV0dXJuVHlwZSAhPT0gbnVsbCl7XG4gICAgICAgIGRlcGVuZGFuY3kud2FpdGluZ1t0aGlzLmNpZF0gPSB0aGlzO1xuICAgICAgICBkZXBlbmRhbmN5LmFwcGx5KCk7IC8vIFRyeSB0byByZS1ldmFsdWF0ZSB0aGlzIGRlcGVuZGFuY3kgaWYgaXQgaXMgZGlydHlcbiAgICAgICAgaWYoZGVwZW5kYW5jeS5pc0RpcnR5KSByZXR1cm4gdGhpcy5pc0NoYW5naW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBkZWxldGUgZGVwZW5kYW5jeS53YWl0aW5nW3RoaXMuY2lkXTtcbiAgICAgIC8vIFRPRE86IFRoZXJlIGNhbiBiZSBhIGNoZWNrIGhlcmUgbG9va2luZyBmb3IgY3ljbGljIGRlcGVuZGFuY2llcy5cbiAgICB9LCB0aGlzKTtcblxuICAgIGlmKCF0aGlzLmlzQ2hhbmdpbmcpIHJldHVybjtcblxuICAgIHRoaXMuc3RvcExpc3RlbmluZyh2YWx1ZSwgJ2FsbCcsIHRoaXMub25Nb2RpZnkpO1xuXG4gICAgcmVzdWx0ID0gdGhpcy5mdW5jLmFwcGx5KGNvbnRleHQsIHBhcmFtcyk7XG5cbiAgICAvLyBQcm9tb3RlIHZhbmlsbGEgb2JqZWN0cyB0byBSZWJvdW5kIERhdGEga2VlcGluZyB0aGUgc2FtZSBvcmlnaW5hbCBvYmplY3RzXG4gICAgaWYoXy5pc0FycmF5KHJlc3VsdCkpIHJlc3VsdCA9IG5ldyBSZWJvdW5kLkNvbGxlY3Rpb24ocmVzdWx0LCB7Y2xvbmU6IGZhbHNlfSk7XG4gICAgZWxzZSBpZihfLmlzT2JqZWN0KHJlc3VsdCkgJiYgIXJlc3VsdC5pc0RhdGEpIHJlc3VsdCA9IG5ldyBSZWJvdW5kLk1vZGVsKHJlc3VsdCwge2Nsb25lOiBmYWxzZX0pO1xuXG4gICAgLy8gSWYgcmVzdWx0IGlzIHVuZGVmaW5lZCwgcmVzZXQgb3VyIGNhY2hlIGl0ZW1cbiAgICBpZihfLmlzVW5kZWZpbmVkKHJlc3VsdCkgfHwgXy5pc051bGwocmVzdWx0KSl7XG4gICAgICB0aGlzLnJldHVyblR5cGUgPSAndmFsdWUnO1xuICAgICAgdGhpcy5pc0NvbGxlY3Rpb24gPSB0aGlzLmlzTW9kZWwgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2V0KHVuZGVmaW5lZCk7XG4gICAgfVxuICAgIC8vIFNldCByZXN1bHQgYW5kIHJldHVybiB0eXBlcywgYmluZCBldmVudHNcbiAgICBlbHNlIGlmKHJlc3VsdC5pc0NvbGxlY3Rpb24pe1xuICAgICAgdGhpcy5yZXR1cm5UeXBlID0gJ2NvbGxlY3Rpb24nO1xuICAgICAgdGhpcy5pc0NvbGxlY3Rpb24gPSB0cnVlO1xuICAgICAgdGhpcy5pc01vZGVsID0gZmFsc2U7XG4gICAgICB0aGlzLnNldChyZXN1bHQpO1xuICAgICAgdGhpcy50cmFjayhyZXN1bHQpO1xuICAgIH1cbiAgICBlbHNlIGlmKHJlc3VsdC5pc01vZGVsKXtcbiAgICAgIHRoaXMucmV0dXJuVHlwZSA9ICdtb2RlbCc7XG4gICAgICB0aGlzLmlzQ29sbGVjdGlvbiA9IGZhbHNlO1xuICAgICAgdGhpcy5pc01vZGVsID0gdHJ1ZTtcbiAgICAgIHRoaXMucmVzZXQocmVzdWx0KTtcbiAgICAgIHRoaXMudHJhY2socmVzdWx0KTtcbiAgICB9XG4gICAgZWxzZXtcbiAgICAgIHRoaXMucmV0dXJuVHlwZSA9ICd2YWx1ZSc7XG4gICAgICB0aGlzLmlzQ29sbGVjdGlvbiA9IHRoaXMuaXNNb2RlbCA9IGZhbHNlO1xuICAgICAgdGhpcy5yZXNldChyZXN1bHQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnZhbHVlKCk7XG4gIH0sXG5cbiAgLy8gV2hlbiB3ZSByZWNlaXZlIGEgbmV3IG1vZGVsIHRvIHNldCBpbiBvdXIgY2FjaGUsIHVuYmluZCB0aGUgdHJhY2tlciBmcm9tXG4gIC8vIHRoZSBwcmV2aW91cyBjYWNoZSBvYmplY3QsIHN5bmMgdGhlIG9iamVjdHMnIGNpZHMgc28gaGVscGVycyB0aGluayB0aGV5XG4gIC8vIGFyZSB0aGUgc2FtZSBvYmplY3QsIHNhdmUgYSByZWZlcmFuY2UgdG8gdGhlIG9iamVjdCB3ZSBhcmUgdHJhY2tpbmcsXG4gIC8vIGFuZCByZS1iaW5kIG91ciBvbk1vZGlmeSBob29rLlxuICB0cmFjazogZnVuY3Rpb24ob2JqZWN0KXtcbiAgICB2YXIgdGFyZ2V0ID0gdGhpcy52YWx1ZSgpO1xuICAgIGlmKCFvYmplY3QgfHwgIXRhcmdldCB8fCAhdGFyZ2V0LmlzRGF0YSB8fCAhb2JqZWN0LmlzRGF0YSkgcmV0dXJuO1xuICAgIHRhcmdldC5fY2lkIHx8ICh0YXJnZXQuX2NpZCA9IHRhcmdldC5jaWQpO1xuICAgIG9iamVjdC5fY2lkIHx8IChvYmplY3QuX2NpZCA9IG9iamVjdC5jaWQpO1xuICAgIHRhcmdldC5jaWQgPSBvYmplY3QuY2lkO1xuICAgIHRoaXMudHJhY2tpbmcgPSBvYmplY3Q7XG4gICAgdGhpcy5saXN0ZW5Ubyh0YXJnZXQsICdhbGwnLCB0aGlzLm9uTW9kaWZ5KTtcbiAgfSxcblxuICAvLyBHZXQgZnJvbSB0aGUgQ29tcHV0ZWQgUHJvcGVydHkncyBjYWNoZVxuICBnZXQ6IGZ1bmN0aW9uKGtleSwgb3B0aW9ucyl7XG4gICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZSgpO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgaWYodGhpcy5yZXR1cm5UeXBlID09PSAndmFsdWUnKSByZXR1cm4gY29uc29sZS5lcnJvcignQ2FsbGVkIGdldCBvbiB0aGUgYCcrIHRoaXMubmFtZSArJ2AgY29tcHV0ZWQgcHJvcGVydHkgd2hpY2ggcmV0dXJucyBhIHByaW1pdGl2ZSB2YWx1ZS4nKTtcbiAgICByZXR1cm4gdmFsdWUuZ2V0KGtleSwgb3B0aW9ucyk7XG4gIH0sXG5cbiAgLy8gU2V0IHRoZSBDb21wdXRlZCBQcm9wZXJ0eSdzIGNhY2hlIHRvIGEgbmV3IHZhbHVlIGFuZCB0cmlnZ2VyIGFwcHJvcHJlYXRlIGV2ZW50cy5cbiAgLy8gQ2hhbmdlcyB3aWxsIHByb3BhZ2F0ZSBiYWNrIHRvIHRoZSBvcmlnaW5hbCBvYmplY3QgaWYgYSBSZWJvdW5kIERhdGEgT2JqZWN0IGFuZCByZS1jb21wdXRlLlxuICAvLyBJZiBDb21wdXRlZCBQcm9wZXJ0eSByZXR1cm5zIGEgdmFsdWUsIGFsbCBkb3duc3RyZWFtIGRlcGVuZGFuY2llcyB3aWxsIHJlLWNvbXB1dGUuXG4gIHNldDogZnVuY3Rpb24oa2V5LCB2YWwsIG9wdGlvbnMpe1xuICAgIGlmKHRoaXMucmV0dXJuVHlwZSA9PT0gbnVsbCkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHZhciBhdHRycyA9IGtleTtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlKCk7XG4gICAgaWYodGhpcy5yZXR1cm5UeXBlID09PSAnbW9kZWwnKXtcbiAgICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgICBhdHRycyA9IChrZXkuaXNNb2RlbCkgPyBrZXkuYXR0cmlidXRlcyA6IGtleTtcbiAgICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIChhdHRycyA9IHt9KVtrZXldID0gdmFsO1xuICAgICAgfVxuICAgIH1cbiAgICBpZih0aGlzLnJldHVyblR5cGUgIT09ICdtb2RlbCcpIG9wdGlvbnMgPSB2YWwgfHwge307XG4gICAgYXR0cnMgPSAoYXR0cnMgJiYgYXR0cnMuaXNDb21wdXRlZFByb3BlcnR5KSA/IGF0dHJzLnZhbHVlKCkgOiBhdHRycztcblxuICAgIC8vIElmIGEgbmV3IHZhbHVlLCBzZXQgaXQgYW5kIHRyaWdnZXIgZXZlbnRzXG4gICAgaWYodGhpcy5yZXR1cm5UeXBlID09PSAndmFsdWUnICYmIHRoaXMuY2FjaGUudmFsdWUgIT09IGF0dHJzKXtcbiAgICAgIHRoaXMuY2FjaGUudmFsdWUgPSBhdHRycztcbiAgICAgIGlmKCFvcHRpb25zLnF1aWV0KXtcbiAgICAgICAgLy8gSWYgc2V0IHdhcyBjYWxsZWQgbm90IHRocm91Z2ggY29tcHV0ZWRQcm9wZXJ0eS5jYWxsKCksIHRoaXMgaXMgYSBmcmVzaCBuZXcgZXZlbnQgYnVyc3QuXG4gICAgICAgIGlmKCF0aGlzLmlzRGlydHkgJiYgIXRoaXMuaXNDaGFuZ2luZykgdGhpcy5fX3BhcmVudF9fLmNoYW5nZWQgPSB7fTtcbiAgICAgICAgdGhpcy5fX3BhcmVudF9fLmNoYW5nZWRbdGhpcy5uYW1lXSA9IGF0dHJzO1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ2NoYW5nZScsIHRoaXMuX19wYXJlbnRfXyk7XG4gICAgICAgIHRoaXMudHJpZ2dlcignY2hhbmdlOicrdGhpcy5uYW1lLCB0aGlzLl9fcGFyZW50X18sIGF0dHJzKTtcbiAgICAgICAgZGVsZXRlIHRoaXMuX19wYXJlbnRfXy5jaGFuZ2VkW3RoaXMubmFtZV07XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYodGhpcy5yZXR1cm5UeXBlICE9PSAndmFsdWUnICYmIG9wdGlvbnMucmVzZXQpIGtleSA9IHZhbHVlLnJlc2V0KGF0dHJzLCBvcHRpb25zKTtcbiAgICBlbHNlIGlmKHRoaXMucmV0dXJuVHlwZSAhPT0gJ3ZhbHVlJykga2V5ID0gdmFsdWUuc2V0KGF0dHJzLCBvcHRpb25zKTtcbiAgICB0aGlzLmlzRGlydHkgPSB0aGlzLmlzQ2hhbmdpbmcgPSBmYWxzZTtcblxuICAgIC8vIENhbGwgYWxsIHJlYW1pbmluZyBjb21wdXRlZCBwcm9wZXJ0aWVzIHdhaXRpbmcgZm9yIHRoaXMgdmFsdWUgdG8gcmVzb2x2ZS5cbiAgICBfLmVhY2godGhpcy53YWl0aW5nLCBmdW5jdGlvbihwcm9wKXsgcHJvcCAmJiBwcm9wLmNhbGwoKTsgfSk7XG5cbiAgICByZXR1cm4ga2V5O1xuICB9LFxuXG4gIC8vIFJldHVybiB0aGUgY3VycmVudCB2YWx1ZSBmcm9tIHRoZSBjYWNoZSwgcnVubmluZyBpZiBkaXJ0eS5cbiAgdmFsdWU6IGZ1bmN0aW9uKCl7XG4gICAgaWYodGhpcy5pc0RpcnR5KSB0aGlzLmFwcGx5KCk7XG4gICAgcmV0dXJuIHRoaXMuY2FjaGVbdGhpcy5yZXR1cm5UeXBlXTtcbiAgfSxcblxuICAvLyBSZXNldCB0aGUgY3VycmVudCB2YWx1ZSBpbiB0aGUgY2FjaGUsIHJ1bm5pbmcgaWYgZmlyc3QgcnVuLlxuICByZXNldDogZnVuY3Rpb24ob2JqLCBvcHRpb25zKXtcbiAgICBpZihfLmlzTnVsbCh0aGlzLnJldHVyblR5cGUpKSByZXR1cm47IC8vIEZpcnN0IHJ1blxuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgb3B0aW9ucy5yZXNldCA9IHRydWU7XG4gICAgcmV0dXJuICB0aGlzLnNldChvYmosIG9wdGlvbnMpO1xuICB9LFxuXG4gIC8vIEN5Y2xpYyBkZXBlbmRhbmN5IHNhZmUgdG9KU09OIG1ldGhvZC5cbiAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5faXNTZXJpYWxpemluZykgcmV0dXJuIHRoaXMuY2lkO1xuICAgIHZhciB2YWwgPSB0aGlzLnZhbHVlKCk7XG4gICAgdGhpcy5faXNTZXJpYWxpemluZyA9IHRydWU7XG4gICAgdmFyIGpzb24gPSAodmFsICYmIF8uaXNGdW5jdGlvbih2YWwudG9KU09OKSkgPyB2YWwudG9KU09OKCkgOiB2YWw7XG4gICAgdGhpcy5faXNTZXJpYWxpemluZyA9IGZhbHNlO1xuICAgIHJldHVybiBqc29uO1xuICB9XG5cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBDb21wdXRlZFByb3BlcnR5O1xuIiwiLypqc2hpbnQgLVcwNTQgKi9cbi8vIGpzaGludCBpZ25vcmU6IHN0YXJ0XG5cbiAgLy8gQSBzZWNvbmQgb3B0aW9uYWwgYXJndW1lbnQgY2FuIGJlIGdpdmVuIHRvIGZ1cnRoZXIgY29uZmlndXJlXG4gIC8vIHRoZSBwYXJzZXIgcHJvY2Vzcy4gVGhlc2Ugb3B0aW9ucyBhcmUgcmVjb2duaXplZDpcblxuICB2YXIgZXhwb3J0cyA9IHt9O1xuXG4gIHZhciBvcHRpb25zLCBpbnB1dCwgaW5wdXRMZW4sIHNvdXJjZUZpbGU7XG5cbiAgdmFyIGRlZmF1bHRPcHRpb25zID0gZXhwb3J0cy5kZWZhdWx0T3B0aW9ucyA9IHtcbiAgICAvLyBgZWNtYVZlcnNpb25gIGluZGljYXRlcyB0aGUgRUNNQVNjcmlwdCB2ZXJzaW9uIHRvIHBhcnNlLiBNdXN0XG4gICAgLy8gYmUgZWl0aGVyIDMsIG9yIDUsIG9yIDYuIFRoaXMgaW5mbHVlbmNlcyBzdXBwb3J0IGZvciBzdHJpY3RcbiAgICAvLyBtb2RlLCB0aGUgc2V0IG9mIHJlc2VydmVkIHdvcmRzLCBzdXBwb3J0IGZvciBnZXR0ZXJzIGFuZFxuICAgIC8vIHNldHRlcnMgYW5kIG90aGVyIGZlYXR1cmVzLiBFUzYgc3VwcG9ydCBpcyBvbmx5IHBhcnRpYWwuXG4gICAgZWNtYVZlcnNpb246IDUsXG4gICAgLy8gVHVybiBvbiBgc3RyaWN0U2VtaWNvbG9uc2AgdG8gcHJldmVudCB0aGUgcGFyc2VyIGZyb20gZG9pbmdcbiAgICAvLyBhdXRvbWF0aWMgc2VtaWNvbG9uIGluc2VydGlvbi5cbiAgICBzdHJpY3RTZW1pY29sb25zOiBmYWxzZSxcbiAgICAvLyBXaGVuIGBhbGxvd1RyYWlsaW5nQ29tbWFzYCBpcyBmYWxzZSwgdGhlIHBhcnNlciB3aWxsIG5vdCBhbGxvd1xuICAgIC8vIHRyYWlsaW5nIGNvbW1hcyBpbiBhcnJheSBhbmQgb2JqZWN0IGxpdGVyYWxzLlxuICAgIGFsbG93VHJhaWxpbmdDb21tYXM6IHRydWUsXG4gICAgLy8gQnkgZGVmYXVsdCwgcmVzZXJ2ZWQgd29yZHMgYXJlIG5vdCBlbmZvcmNlZC4gRW5hYmxlXG4gICAgLy8gYGZvcmJpZFJlc2VydmVkYCB0byBlbmZvcmNlIHRoZW0uIFdoZW4gdGhpcyBvcHRpb24gaGFzIHRoZVxuICAgIC8vIHZhbHVlIFwiZXZlcnl3aGVyZVwiLCByZXNlcnZlZCB3b3JkcyBhbmQga2V5d29yZHMgY2FuIGFsc28gbm90IGJlXG4gICAgLy8gdXNlZCBhcyBwcm9wZXJ0eSBuYW1lcy5cbiAgICBmb3JiaWRSZXNlcnZlZDogZmFsc2UsXG4gICAgLy8gV2hlbiBlbmFibGVkLCBhIHJldHVybiBhdCB0aGUgdG9wIGxldmVsIGlzIG5vdCBjb25zaWRlcmVkIGFuXG4gICAgLy8gZXJyb3IuXG4gICAgYWxsb3dSZXR1cm5PdXRzaWRlRnVuY3Rpb246IGZhbHNlLFxuICAgIC8vIFdoZW4gYGxvY2F0aW9uc2AgaXMgb24sIGBsb2NgIHByb3BlcnRpZXMgaG9sZGluZyBvYmplY3RzIHdpdGhcbiAgICAvLyBgc3RhcnRgIGFuZCBgZW5kYCBwcm9wZXJ0aWVzIGluIGB7bGluZSwgY29sdW1ufWAgZm9ybSAod2l0aFxuICAgIC8vIGxpbmUgYmVpbmcgMS1iYXNlZCBhbmQgY29sdW1uIDAtYmFzZWQpIHdpbGwgYmUgYXR0YWNoZWQgdG8gdGhlXG4gICAgLy8gbm9kZXMuXG4gICAgbG9jYXRpb25zOiBmYWxzZSxcbiAgICAvLyBBIGZ1bmN0aW9uIGNhbiBiZSBwYXNzZWQgYXMgYG9uQ29tbWVudGAgb3B0aW9uLCB3aGljaCB3aWxsXG4gICAgLy8gY2F1c2UgQWNvcm4gdG8gY2FsbCB0aGF0IGZ1bmN0aW9uIHdpdGggYChibG9jaywgdGV4dCwgc3RhcnQsXG4gICAgLy8gZW5kKWAgcGFyYW1ldGVycyB3aGVuZXZlciBhIGNvbW1lbnQgaXMgc2tpcHBlZC4gYGJsb2NrYCBpcyBhXG4gICAgLy8gYm9vbGVhbiBpbmRpY2F0aW5nIHdoZXRoZXIgdGhpcyBpcyBhIGJsb2NrIChgLyogKi9gKSBjb21tZW50LFxuICAgIC8vIGB0ZXh0YCBpcyB0aGUgY29udGVudCBvZiB0aGUgY29tbWVudCwgYW5kIGBzdGFydGAgYW5kIGBlbmRgIGFyZVxuICAgIC8vIGNoYXJhY3RlciBvZmZzZXRzIHRoYXQgZGVub3RlIHRoZSBzdGFydCBhbmQgZW5kIG9mIHRoZSBjb21tZW50LlxuICAgIC8vIFdoZW4gdGhlIGBsb2NhdGlvbnNgIG9wdGlvbiBpcyBvbiwgdHdvIG1vcmUgcGFyYW1ldGVycyBhcmVcbiAgICAvLyBwYXNzZWQsIHRoZSBmdWxsIGB7bGluZSwgY29sdW1ufWAgbG9jYXRpb25zIG9mIHRoZSBzdGFydCBhbmRcbiAgICAvLyBlbmQgb2YgdGhlIGNvbW1lbnRzLiBOb3RlIHRoYXQgeW91IGFyZSBub3QgYWxsb3dlZCB0byBjYWxsIHRoZVxuICAgIC8vIHBhcnNlciBmcm9tIHRoZSBjYWxsYmFja+KAlHRoYXQgd2lsbCBjb3JydXB0IGl0cyBpbnRlcm5hbCBzdGF0ZS5cbiAgICBvbkNvbW1lbnQ6IG51bGwsXG4gICAgLy8gTm9kZXMgaGF2ZSB0aGVpciBzdGFydCBhbmQgZW5kIGNoYXJhY3RlcnMgb2Zmc2V0cyByZWNvcmRlZCBpblxuICAgIC8vIGBzdGFydGAgYW5kIGBlbmRgIHByb3BlcnRpZXMgKGRpcmVjdGx5IG9uIHRoZSBub2RlLCByYXRoZXIgdGhhblxuICAgIC8vIHRoZSBgbG9jYCBvYmplY3QsIHdoaWNoIGhvbGRzIGxpbmUvY29sdW1uIGRhdGEuIFRvIGFsc28gYWRkIGFcbiAgICAvLyBbc2VtaS1zdGFuZGFyZGl6ZWRdW3JhbmdlXSBgcmFuZ2VgIHByb3BlcnR5IGhvbGRpbmcgYSBgW3N0YXJ0LFxuICAgIC8vIGVuZF1gIGFycmF5IHdpdGggdGhlIHNhbWUgbnVtYmVycywgc2V0IHRoZSBgcmFuZ2VzYCBvcHRpb24gdG9cbiAgICAvLyBgdHJ1ZWAuXG4gICAgLy9cbiAgICAvLyBbcmFuZ2VdOiBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD03NDU2NzhcbiAgICByYW5nZXM6IGZhbHNlLFxuICAgIC8vIEl0IGlzIHBvc3NpYmxlIHRvIHBhcnNlIG11bHRpcGxlIGZpbGVzIGludG8gYSBzaW5nbGUgQVNUIGJ5XG4gICAgLy8gcGFzc2luZyB0aGUgdHJlZSBwcm9kdWNlZCBieSBwYXJzaW5nIHRoZSBmaXJzdCBmaWxlIGFzXG4gICAgLy8gYHByb2dyYW1gIG9wdGlvbiBpbiBzdWJzZXF1ZW50IHBhcnNlcy4gVGhpcyB3aWxsIGFkZCB0aGVcbiAgICAvLyB0b3BsZXZlbCBmb3JtcyBvZiB0aGUgcGFyc2VkIGZpbGUgdG8gdGhlIGBQcm9ncmFtYCAodG9wKSBub2RlXG4gICAgLy8gb2YgYW4gZXhpc3RpbmcgcGFyc2UgdHJlZS5cbiAgICBwcm9ncmFtOiBudWxsLFxuICAgIC8vIFdoZW4gYGxvY2F0aW9uc2AgaXMgb24sIHlvdSBjYW4gcGFzcyB0aGlzIHRvIHJlY29yZCB0aGUgc291cmNlXG4gICAgLy8gZmlsZSBpbiBldmVyeSBub2RlJ3MgYGxvY2Agb2JqZWN0LlxuICAgIHNvdXJjZUZpbGU6IG51bGwsXG4gICAgLy8gVGhpcyB2YWx1ZSwgaWYgZ2l2ZW4sIGlzIHN0b3JlZCBpbiBldmVyeSBub2RlLCB3aGV0aGVyXG4gICAgLy8gYGxvY2F0aW9uc2AgaXMgb24gb3Igb2ZmLlxuICAgIGRpcmVjdFNvdXJjZUZpbGU6IG51bGxcbiAgfTtcblxuICBmdW5jdGlvbiBzZXRPcHRpb25zKG9wdHMpIHtcbiAgICBvcHRpb25zID0gb3B0cyB8fCB7fTtcbiAgICBmb3IgKHZhciBvcHQgaW4gZGVmYXVsdE9wdGlvbnMpIGlmICghT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9wdGlvbnMsIG9wdCkpXG4gICAgICBvcHRpb25zW29wdF0gPSBkZWZhdWx0T3B0aW9uc1tvcHRdO1xuICAgIHNvdXJjZUZpbGUgPSBvcHRpb25zLnNvdXJjZUZpbGUgfHwgbnVsbDtcblxuICAgIGlzS2V5d29yZCA9IG9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiA/IGlzRWNtYTZLZXl3b3JkIDogaXNFY21hNUFuZExlc3NLZXl3b3JkO1xuICB9XG5cbiAgLy8gVGhlIGBnZXRMaW5lSW5mb2AgZnVuY3Rpb24gaXMgbW9zdGx5IHVzZWZ1bCB3aGVuIHRoZVxuICAvLyBgbG9jYXRpb25zYCBvcHRpb24gaXMgb2ZmIChmb3IgcGVyZm9ybWFuY2UgcmVhc29ucykgYW5kIHlvdVxuICAvLyB3YW50IHRvIGZpbmQgdGhlIGxpbmUvY29sdW1uIHBvc2l0aW9uIGZvciBhIGdpdmVuIGNoYXJhY3RlclxuICAvLyBvZmZzZXQuIGBpbnB1dGAgc2hvdWxkIGJlIHRoZSBjb2RlIHN0cmluZyB0aGF0IHRoZSBvZmZzZXQgcmVmZXJzXG4gIC8vIGludG8uXG5cbiAgdmFyIGdldExpbmVJbmZvID0gZXhwb3J0cy5nZXRMaW5lSW5mbyA9IGZ1bmN0aW9uKGlucHV0LCBvZmZzZXQpIHtcbiAgICBmb3IgKHZhciBsaW5lID0gMSwgY3VyID0gMDs7KSB7XG4gICAgICBsaW5lQnJlYWsubGFzdEluZGV4ID0gY3VyO1xuICAgICAgdmFyIG1hdGNoID0gbGluZUJyZWFrLmV4ZWMoaW5wdXQpO1xuICAgICAgaWYgKG1hdGNoICYmIG1hdGNoLmluZGV4IDwgb2Zmc2V0KSB7XG4gICAgICAgICsrbGluZTtcbiAgICAgICAgY3VyID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG4gICAgICB9IGVsc2UgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiB7bGluZTogbGluZSwgY29sdW1uOiBvZmZzZXQgLSBjdXJ9O1xuICB9O1xuXG4gIC8vIEFjb3JuIGlzIG9yZ2FuaXplZCBhcyBhIHRva2VuaXplciBhbmQgYSByZWN1cnNpdmUtZGVzY2VudCBwYXJzZXIuXG4gIC8vIFRoZSBgdG9rZW5pemVgIGV4cG9ydCBwcm92aWRlcyBhbiBpbnRlcmZhY2UgdG8gdGhlIHRva2VuaXplci5cbiAgLy8gQmVjYXVzZSB0aGUgdG9rZW5pemVyIGlzIG9wdGltaXplZCBmb3IgYmVpbmcgZWZmaWNpZW50bHkgdXNlZCBieVxuICAvLyB0aGUgQWNvcm4gcGFyc2VyIGl0c2VsZiwgdGhpcyBpbnRlcmZhY2UgaXMgc29tZXdoYXQgY3J1ZGUgYW5kIG5vdFxuICAvLyB2ZXJ5IG1vZHVsYXIuIFBlcmZvcm1pbmcgYW5vdGhlciBwYXJzZSBvciBjYWxsIHRvIGB0b2tlbml6ZWAgd2lsbFxuICAvLyByZXNldCB0aGUgaW50ZXJuYWwgc3RhdGUsIGFuZCBpbnZhbGlkYXRlIGV4aXN0aW5nIHRva2VuaXplcnMuXG5cbiAgZXhwb3J0cy50b2tlbml6ZSA9IGZ1bmN0aW9uKGlucHQsIG9wdHMpIHtcbiAgICBpbnB1dCA9IFN0cmluZyhpbnB0KTsgaW5wdXRMZW4gPSBpbnB1dC5sZW5ndGg7XG4gICAgc2V0T3B0aW9ucyhvcHRzKTtcbiAgICBpbml0VG9rZW5TdGF0ZSgpO1xuXG4gICAgdmFyIHQgPSB7fTtcbiAgICBmdW5jdGlvbiBnZXRUb2tlbihmb3JjZVJlZ2V4cCkge1xuICAgICAgbGFzdEVuZCA9IHRva0VuZDtcbiAgICAgIHJlYWRUb2tlbihmb3JjZVJlZ2V4cCk7XG4gICAgICB0LnN0YXJ0ID0gdG9rU3RhcnQ7IHQuZW5kID0gdG9rRW5kO1xuICAgICAgdC5zdGFydExvYyA9IHRva1N0YXJ0TG9jOyB0LmVuZExvYyA9IHRva0VuZExvYztcbiAgICAgIHQudHlwZSA9IHRva1R5cGU7IHQudmFsdWUgPSB0b2tWYWw7XG4gICAgICByZXR1cm4gdDtcbiAgICB9XG4gICAgZ2V0VG9rZW4uanVtcFRvID0gZnVuY3Rpb24ocG9zLCByZUFsbG93ZWQpIHtcbiAgICAgIHRva1BvcyA9IHBvcztcbiAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgICB0b2tDdXJMaW5lID0gMTtcbiAgICAgICAgdG9rTGluZVN0YXJ0ID0gbGluZUJyZWFrLmxhc3RJbmRleCA9IDA7XG4gICAgICAgIHZhciBtYXRjaDtcbiAgICAgICAgd2hpbGUgKChtYXRjaCA9IGxpbmVCcmVhay5leGVjKGlucHV0KSkgJiYgbWF0Y2guaW5kZXggPCBwb3MpIHtcbiAgICAgICAgICArK3Rva0N1ckxpbmU7XG4gICAgICAgICAgdG9rTGluZVN0YXJ0ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHRva1JlZ2V4cEFsbG93ZWQgPSByZUFsbG93ZWQ7XG4gICAgICBza2lwU3BhY2UoKTtcbiAgICB9O1xuICAgIHJldHVybiBnZXRUb2tlbjtcbiAgfTtcblxuICAvLyBTdGF0ZSBpcyBrZXB0IGluIChjbG9zdXJlLSlnbG9iYWwgdmFyaWFibGVzLiBXZSBhbHJlYWR5IHNhdyB0aGVcbiAgLy8gYG9wdGlvbnNgLCBgaW5wdXRgLCBhbmQgYGlucHV0TGVuYCB2YXJpYWJsZXMgYWJvdmUuXG5cbiAgLy8gVGhlIGN1cnJlbnQgcG9zaXRpb24gb2YgdGhlIHRva2VuaXplciBpbiB0aGUgaW5wdXQuXG5cbiAgdmFyIHRva1BvcztcblxuICAvLyBUaGUgc3RhcnQgYW5kIGVuZCBvZmZzZXRzIG9mIHRoZSBjdXJyZW50IHRva2VuLlxuXG4gIHZhciB0b2tTdGFydCwgdG9rRW5kO1xuXG4gIC8vIFdoZW4gYG9wdGlvbnMubG9jYXRpb25zYCBpcyB0cnVlLCB0aGVzZSBob2xkIG9iamVjdHNcbiAgLy8gY29udGFpbmluZyB0aGUgdG9rZW5zIHN0YXJ0IGFuZCBlbmQgbGluZS9jb2x1bW4gcGFpcnMuXG5cbiAgdmFyIHRva1N0YXJ0TG9jLCB0b2tFbmRMb2M7XG5cbiAgLy8gVGhlIHR5cGUgYW5kIHZhbHVlIG9mIHRoZSBjdXJyZW50IHRva2VuLiBUb2tlbiB0eXBlcyBhcmUgb2JqZWN0cyxcbiAgLy8gbmFtZWQgYnkgdmFyaWFibGVzIGFnYWluc3Qgd2hpY2ggdGhleSBjYW4gYmUgY29tcGFyZWQsIGFuZFxuICAvLyBob2xkaW5nIHByb3BlcnRpZXMgdGhhdCBkZXNjcmliZSB0aGVtIChpbmRpY2F0aW5nLCBmb3IgZXhhbXBsZSxcbiAgLy8gdGhlIHByZWNlZGVuY2Ugb2YgYW4gaW5maXggb3BlcmF0b3IsIGFuZCB0aGUgb3JpZ2luYWwgbmFtZSBvZiBhXG4gIC8vIGtleXdvcmQgdG9rZW4pLiBUaGUga2luZCBvZiB2YWx1ZSB0aGF0J3MgaGVsZCBpbiBgdG9rVmFsYCBkZXBlbmRzXG4gIC8vIG9uIHRoZSB0eXBlIG9mIHRoZSB0b2tlbi4gRm9yIGxpdGVyYWxzLCBpdCBpcyB0aGUgbGl0ZXJhbCB2YWx1ZSxcbiAgLy8gZm9yIG9wZXJhdG9ycywgdGhlIG9wZXJhdG9yIG5hbWUsIGFuZCBzbyBvbi5cblxuICB2YXIgdG9rVHlwZSwgdG9rVmFsO1xuXG4gIC8vIEludGVyYWwgc3RhdGUgZm9yIHRoZSB0b2tlbml6ZXIuIFRvIGRpc3Rpbmd1aXNoIGJldHdlZW4gZGl2aXNpb25cbiAgLy8gb3BlcmF0b3JzIGFuZCByZWd1bGFyIGV4cHJlc3Npb25zLCBpdCByZW1lbWJlcnMgd2hldGhlciB0aGUgbGFzdFxuICAvLyB0b2tlbiB3YXMgb25lIHRoYXQgaXMgYWxsb3dlZCB0byBiZSBmb2xsb3dlZCBieSBhbiBleHByZXNzaW9uLlxuICAvLyAoSWYgaXQgaXMsIGEgc2xhc2ggaXMgcHJvYmFibHkgYSByZWdleHAsIGlmIGl0IGlzbid0IGl0J3MgYVxuICAvLyBkaXZpc2lvbiBvcGVyYXRvci4gU2VlIHRoZSBgcGFyc2VTdGF0ZW1lbnRgIGZ1bmN0aW9uIGZvciBhXG4gIC8vIGNhdmVhdC4pXG5cbiAgdmFyIHRva1JlZ2V4cEFsbG93ZWQ7XG5cbiAgLy8gV2hlbiBgb3B0aW9ucy5sb2NhdGlvbnNgIGlzIHRydWUsIHRoZXNlIGFyZSB1c2VkIHRvIGtlZXBcbiAgLy8gdHJhY2sgb2YgdGhlIGN1cnJlbnQgbGluZSwgYW5kIGtub3cgd2hlbiBhIG5ldyBsaW5lIGhhcyBiZWVuXG4gIC8vIGVudGVyZWQuXG5cbiAgdmFyIHRva0N1ckxpbmUsIHRva0xpbmVTdGFydDtcblxuICAvLyBUaGVzZSBzdG9yZSB0aGUgcG9zaXRpb24gb2YgdGhlIHByZXZpb3VzIHRva2VuLCB3aGljaCBpcyB1c2VmdWxcbiAgLy8gd2hlbiBmaW5pc2hpbmcgYSBub2RlIGFuZCBhc3NpZ25pbmcgaXRzIGBlbmRgIHBvc2l0aW9uLlxuXG4gIHZhciBsYXN0U3RhcnQsIGxhc3RFbmQsIGxhc3RFbmRMb2M7XG5cbiAgLy8gVGhpcyBpcyB0aGUgcGFyc2VyJ3Mgc3RhdGUuIGBpbkZ1bmN0aW9uYCBpcyB1c2VkIHRvIHJlamVjdFxuICAvLyBgcmV0dXJuYCBzdGF0ZW1lbnRzIG91dHNpZGUgb2YgZnVuY3Rpb25zLCBgbGFiZWxzYCB0byB2ZXJpZnkgdGhhdFxuICAvLyBgYnJlYWtgIGFuZCBgY29udGludWVgIGhhdmUgc29tZXdoZXJlIHRvIGp1bXAgdG8sIGFuZCBgc3RyaWN0YFxuICAvLyBpbmRpY2F0ZXMgd2hldGhlciBzdHJpY3QgbW9kZSBpcyBvbi5cblxuICB2YXIgaW5GdW5jdGlvbiwgbGFiZWxzLCBzdHJpY3Q7XG5cbiAgLy8gVGhpcyBmdW5jdGlvbiBpcyB1c2VkIHRvIHJhaXNlIGV4Y2VwdGlvbnMgb24gcGFyc2UgZXJyb3JzLiBJdFxuICAvLyB0YWtlcyBhbiBvZmZzZXQgaW50ZWdlciAoaW50byB0aGUgY3VycmVudCBgaW5wdXRgKSB0byBpbmRpY2F0ZVxuICAvLyB0aGUgbG9jYXRpb24gb2YgdGhlIGVycm9yLCBhdHRhY2hlcyB0aGUgcG9zaXRpb24gdG8gdGhlIGVuZFxuICAvLyBvZiB0aGUgZXJyb3IgbWVzc2FnZSwgYW5kIHRoZW4gcmFpc2VzIGEgYFN5bnRheEVycm9yYCB3aXRoIHRoYXRcbiAgLy8gbWVzc2FnZS5cblxuICBmdW5jdGlvbiByYWlzZShwb3MsIG1lc3NhZ2UpIHtcbiAgICB2YXIgbG9jID0gZ2V0TGluZUluZm8oaW5wdXQsIHBvcyk7XG4gICAgbWVzc2FnZSArPSBcIiAoXCIgKyBsb2MubGluZSArIFwiOlwiICsgbG9jLmNvbHVtbiArIFwiKVwiO1xuICAgIHZhciBlcnIgPSBuZXcgU3ludGF4RXJyb3IobWVzc2FnZSk7XG4gICAgZXJyLnBvcyA9IHBvczsgZXJyLmxvYyA9IGxvYzsgZXJyLnJhaXNlZEF0ID0gdG9rUG9zO1xuICAgIHRocm93IGVycjtcbiAgfVxuXG4gIC8vIFJldXNlZCBlbXB0eSBhcnJheSBhZGRlZCBmb3Igbm9kZSBmaWVsZHMgdGhhdCBhcmUgYWx3YXlzIGVtcHR5LlxuXG4gIHZhciBlbXB0eSA9IFtdO1xuXG4gIC8vICMjIFRva2VuIHR5cGVzXG5cbiAgLy8gVGhlIGFzc2lnbm1lbnQgb2YgZmluZS1ncmFpbmVkLCBpbmZvcm1hdGlvbi1jYXJyeWluZyB0eXBlIG9iamVjdHNcbiAgLy8gYWxsb3dzIHRoZSB0b2tlbml6ZXIgdG8gc3RvcmUgdGhlIGluZm9ybWF0aW9uIGl0IGhhcyBhYm91dCBhXG4gIC8vIHRva2VuIGluIGEgd2F5IHRoYXQgaXMgdmVyeSBjaGVhcCBmb3IgdGhlIHBhcnNlciB0byBsb29rIHVwLlxuXG4gIC8vIEFsbCB0b2tlbiB0eXBlIHZhcmlhYmxlcyBzdGFydCB3aXRoIGFuIHVuZGVyc2NvcmUsIHRvIG1ha2UgdGhlbVxuICAvLyBlYXN5IHRvIHJlY29nbml6ZS5cblxuICAvLyBUaGVzZSBhcmUgdGhlIGdlbmVyYWwgdHlwZXMuIFRoZSBgdHlwZWAgcHJvcGVydHkgaXMgb25seSB1c2VkIHRvXG4gIC8vIG1ha2UgdGhlbSByZWNvZ25pemVhYmxlIHdoZW4gZGVidWdnaW5nLlxuXG4gIHZhciBfbnVtID0ge3R5cGU6IFwibnVtXCJ9LCBfcmVnZXhwID0ge3R5cGU6IFwicmVnZXhwXCJ9LCBfc3RyaW5nID0ge3R5cGU6IFwic3RyaW5nXCJ9O1xuICB2YXIgX25hbWUgPSB7dHlwZTogXCJuYW1lXCJ9LCBfZW9mID0ge3R5cGU6IFwiZW9mXCJ9O1xuXG4gIC8vIEtleXdvcmQgdG9rZW5zLiBUaGUgYGtleXdvcmRgIHByb3BlcnR5IChhbHNvIHVzZWQgaW4ga2V5d29yZC1saWtlXG4gIC8vIG9wZXJhdG9ycykgaW5kaWNhdGVzIHRoYXQgdGhlIHRva2VuIG9yaWdpbmF0ZWQgZnJvbSBhblxuICAvLyBpZGVudGlmaWVyLWxpa2Ugd29yZCwgd2hpY2ggaXMgdXNlZCB3aGVuIHBhcnNpbmcgcHJvcGVydHkgbmFtZXMuXG4gIC8vXG4gIC8vIFRoZSBgYmVmb3JlRXhwcmAgcHJvcGVydHkgaXMgdXNlZCB0byBkaXNhbWJpZ3VhdGUgYmV0d2VlbiByZWd1bGFyXG4gIC8vIGV4cHJlc3Npb25zIGFuZCBkaXZpc2lvbnMuIEl0IGlzIHNldCBvbiBhbGwgdG9rZW4gdHlwZXMgdGhhdCBjYW5cbiAgLy8gYmUgZm9sbG93ZWQgYnkgYW4gZXhwcmVzc2lvbiAodGh1cywgYSBzbGFzaCBhZnRlciB0aGVtIHdvdWxkIGJlIGFcbiAgLy8gcmVndWxhciBleHByZXNzaW9uKS5cbiAgLy9cbiAgLy8gYGlzTG9vcGAgbWFya3MgYSBrZXl3b3JkIGFzIHN0YXJ0aW5nIGEgbG9vcCwgd2hpY2ggaXMgaW1wb3J0YW50XG4gIC8vIHRvIGtub3cgd2hlbiBwYXJzaW5nIGEgbGFiZWwsIGluIG9yZGVyIHRvIGFsbG93IG9yIGRpc2FsbG93XG4gIC8vIGNvbnRpbnVlIGp1bXBzIHRvIHRoYXQgbGFiZWwuXG5cbiAgdmFyIF9icmVhayA9IHtrZXl3b3JkOiBcImJyZWFrXCJ9LCBfY2FzZSA9IHtrZXl3b3JkOiBcImNhc2VcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9jYXRjaCA9IHtrZXl3b3JkOiBcImNhdGNoXCJ9O1xuICB2YXIgX2NvbnRpbnVlID0ge2tleXdvcmQ6IFwiY29udGludWVcIn0sIF9kZWJ1Z2dlciA9IHtrZXl3b3JkOiBcImRlYnVnZ2VyXCJ9LCBfZGVmYXVsdCA9IHtrZXl3b3JkOiBcImRlZmF1bHRcIn07XG4gIHZhciBfZG8gPSB7a2V5d29yZDogXCJkb1wiLCBpc0xvb3A6IHRydWV9LCBfZWxzZSA9IHtrZXl3b3JkOiBcImVsc2VcIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfZmluYWxseSA9IHtrZXl3b3JkOiBcImZpbmFsbHlcIn0sIF9mb3IgPSB7a2V5d29yZDogXCJmb3JcIiwgaXNMb29wOiB0cnVlfSwgX2Z1bmN0aW9uID0ge2tleXdvcmQ6IFwiZnVuY3Rpb25cIn07XG4gIHZhciBfaWYgPSB7a2V5d29yZDogXCJpZlwifSwgX3JldHVybiA9IHtrZXl3b3JkOiBcInJldHVyblwiLCBiZWZvcmVFeHByOiB0cnVlfSwgX3N3aXRjaCA9IHtrZXl3b3JkOiBcInN3aXRjaFwifTtcbiAgdmFyIF90aHJvdyA9IHtrZXl3b3JkOiBcInRocm93XCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfdHJ5ID0ge2tleXdvcmQ6IFwidHJ5XCJ9LCBfdmFyID0ge2tleXdvcmQ6IFwidmFyXCJ9O1xuICB2YXIgX2xldCA9IHtrZXl3b3JkOiBcImxldFwifSwgX2NvbnN0ID0ge2tleXdvcmQ6IFwiY29uc3RcIn07XG4gIHZhciBfd2hpbGUgPSB7a2V5d29yZDogXCJ3aGlsZVwiLCBpc0xvb3A6IHRydWV9LCBfd2l0aCA9IHtrZXl3b3JkOiBcIndpdGhcIn0sIF9uZXcgPSB7a2V5d29yZDogXCJuZXdcIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfdGhpcyA9IHtrZXl3b3JkOiBcInRoaXNcIn07XG5cbiAgLy8gVGhlIGtleXdvcmRzIHRoYXQgZGVub3RlIHZhbHVlcy5cblxuICB2YXIgX251bGwgPSB7a2V5d29yZDogXCJudWxsXCIsIGF0b21WYWx1ZTogbnVsbH0sIF90cnVlID0ge2tleXdvcmQ6IFwidHJ1ZVwiLCBhdG9tVmFsdWU6IHRydWV9O1xuICB2YXIgX2ZhbHNlID0ge2tleXdvcmQ6IFwiZmFsc2VcIiwgYXRvbVZhbHVlOiBmYWxzZX07XG5cbiAgLy8gU29tZSBrZXl3b3JkcyBhcmUgdHJlYXRlZCBhcyByZWd1bGFyIG9wZXJhdG9ycy4gYGluYCBzb21ldGltZXNcbiAgLy8gKHdoZW4gcGFyc2luZyBgZm9yYCkgbmVlZHMgdG8gYmUgdGVzdGVkIGFnYWluc3Qgc3BlY2lmaWNhbGx5LCBzb1xuICAvLyB3ZSBhc3NpZ24gYSB2YXJpYWJsZSBuYW1lIHRvIGl0IGZvciBxdWljayBjb21wYXJpbmcuXG5cbiAgdmFyIF9pbiA9IHtrZXl3b3JkOiBcImluXCIsIGJpbm9wOiA3LCBiZWZvcmVFeHByOiB0cnVlfTtcblxuICAvLyBNYXAga2V5d29yZCBuYW1lcyB0byB0b2tlbiB0eXBlcy5cblxuICB2YXIga2V5d29yZFR5cGVzID0ge1wiYnJlYWtcIjogX2JyZWFrLCBcImNhc2VcIjogX2Nhc2UsIFwiY2F0Y2hcIjogX2NhdGNoLFxuICAgICAgICAgICAgICAgICAgICAgIFwiY29udGludWVcIjogX2NvbnRpbnVlLCBcImRlYnVnZ2VyXCI6IF9kZWJ1Z2dlciwgXCJkZWZhdWx0XCI6IF9kZWZhdWx0LFxuICAgICAgICAgICAgICAgICAgICAgIFwiZG9cIjogX2RvLCBcImVsc2VcIjogX2Vsc2UsIFwiZmluYWxseVwiOiBfZmluYWxseSwgXCJmb3JcIjogX2ZvcixcbiAgICAgICAgICAgICAgICAgICAgICBcImZ1bmN0aW9uXCI6IF9mdW5jdGlvbiwgXCJpZlwiOiBfaWYsIFwicmV0dXJuXCI6IF9yZXR1cm4sIFwic3dpdGNoXCI6IF9zd2l0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgXCJ0aHJvd1wiOiBfdGhyb3csIFwidHJ5XCI6IF90cnksIFwidmFyXCI6IF92YXIsIFwibGV0XCI6IF9sZXQsIFwiY29uc3RcIjogX2NvbnN0LFxuICAgICAgICAgICAgICAgICAgICAgIFwid2hpbGVcIjogX3doaWxlLCBcIndpdGhcIjogX3dpdGgsXG4gICAgICAgICAgICAgICAgICAgICAgXCJudWxsXCI6IF9udWxsLCBcInRydWVcIjogX3RydWUsIFwiZmFsc2VcIjogX2ZhbHNlLCBcIm5ld1wiOiBfbmV3LCBcImluXCI6IF9pbixcbiAgICAgICAgICAgICAgICAgICAgICBcImluc3RhbmNlb2ZcIjoge2tleXdvcmQ6IFwiaW5zdGFuY2VvZlwiLCBiaW5vcDogNywgYmVmb3JlRXhwcjogdHJ1ZX0sIFwidGhpc1wiOiBfdGhpcyxcbiAgICAgICAgICAgICAgICAgICAgICBcInR5cGVvZlwiOiB7a2V5d29yZDogXCJ0eXBlb2ZcIiwgcHJlZml4OiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfSxcbiAgICAgICAgICAgICAgICAgICAgICBcInZvaWRcIjoge2tleXdvcmQ6IFwidm9pZFwiLCBwcmVmaXg6IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9LFxuICAgICAgICAgICAgICAgICAgICAgIFwiZGVsZXRlXCI6IHtrZXl3b3JkOiBcImRlbGV0ZVwiLCBwcmVmaXg6IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9fTtcblxuICAvLyBQdW5jdHVhdGlvbiB0b2tlbiB0eXBlcy4gQWdhaW4sIHRoZSBgdHlwZWAgcHJvcGVydHkgaXMgcHVyZWx5IGZvciBkZWJ1Z2dpbmcuXG5cbiAgdmFyIF9icmFja2V0TCA9IHt0eXBlOiBcIltcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9icmFja2V0UiA9IHt0eXBlOiBcIl1cIn0sIF9icmFjZUwgPSB7dHlwZTogXCJ7XCIsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2JyYWNlUiA9IHt0eXBlOiBcIn1cIn0sIF9wYXJlbkwgPSB7dHlwZTogXCIoXCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfcGFyZW5SID0ge3R5cGU6IFwiKVwifTtcbiAgdmFyIF9jb21tYSA9IHt0eXBlOiBcIixcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9zZW1pID0ge3R5cGU6IFwiO1wiLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9jb2xvbiA9IHt0eXBlOiBcIjpcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9kb3QgPSB7dHlwZTogXCIuXCJ9LCBfZWxsaXBzaXMgPSB7dHlwZTogXCIuLi5cIn0sIF9xdWVzdGlvbiA9IHt0eXBlOiBcIj9cIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG5cbiAgLy8gT3BlcmF0b3JzLiBUaGVzZSBjYXJyeSBzZXZlcmFsIGtpbmRzIG9mIHByb3BlcnRpZXMgdG8gaGVscCB0aGVcbiAgLy8gcGFyc2VyIHVzZSB0aGVtIHByb3Blcmx5ICh0aGUgcHJlc2VuY2Ugb2YgdGhlc2UgcHJvcGVydGllcyBpc1xuICAvLyB3aGF0IGNhdGVnb3JpemVzIHRoZW0gYXMgb3BlcmF0b3JzKS5cbiAgLy9cbiAgLy8gYGJpbm9wYCwgd2hlbiBwcmVzZW50LCBzcGVjaWZpZXMgdGhhdCB0aGlzIG9wZXJhdG9yIGlzIGEgYmluYXJ5XG4gIC8vIG9wZXJhdG9yLCBhbmQgd2lsbCByZWZlciB0byBpdHMgcHJlY2VkZW5jZS5cbiAgLy9cbiAgLy8gYHByZWZpeGAgYW5kIGBwb3N0Zml4YCBtYXJrIHRoZSBvcGVyYXRvciBhcyBhIHByZWZpeCBvciBwb3N0Zml4XG4gIC8vIHVuYXJ5IG9wZXJhdG9yLiBgaXNVcGRhdGVgIHNwZWNpZmllcyB0aGF0IHRoZSBub2RlIHByb2R1Y2VkIGJ5XG4gIC8vIHRoZSBvcGVyYXRvciBzaG91bGQgYmUgb2YgdHlwZSBVcGRhdGVFeHByZXNzaW9uIHJhdGhlciB0aGFuXG4gIC8vIHNpbXBseSBVbmFyeUV4cHJlc3Npb24gKGArK2AgYW5kIGAtLWApLlxuICAvL1xuICAvLyBgaXNBc3NpZ25gIG1hcmtzIGFsbCBvZiBgPWAsIGArPWAsIGAtPWAgZXRjZXRlcmEsIHdoaWNoIGFjdCBhc1xuICAvLyBiaW5hcnkgb3BlcmF0b3JzIHdpdGggYSB2ZXJ5IGxvdyBwcmVjZWRlbmNlLCB0aGF0IHNob3VsZCByZXN1bHRcbiAgLy8gaW4gQXNzaWdubWVudEV4cHJlc3Npb24gbm9kZXMuXG5cbiAgdmFyIF9zbGFzaCA9IHtiaW5vcDogMTAsIGJlZm9yZUV4cHI6IHRydWV9LCBfZXEgPSB7aXNBc3NpZ246IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2Fzc2lnbiA9IHtpc0Fzc2lnbjogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfaW5jRGVjID0ge3Bvc3RmaXg6IHRydWUsIHByZWZpeDogdHJ1ZSwgaXNVcGRhdGU6IHRydWV9LCBfcHJlZml4ID0ge3ByZWZpeDogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfbG9naWNhbE9SID0ge2Jpbm9wOiAxLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9sb2dpY2FsQU5EID0ge2Jpbm9wOiAyLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9iaXR3aXNlT1IgPSB7Ymlub3A6IDMsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2JpdHdpc2VYT1IgPSB7Ymlub3A6IDQsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2JpdHdpc2VBTkQgPSB7Ymlub3A6IDUsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2VxdWFsaXR5ID0ge2Jpbm9wOiA2LCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9yZWxhdGlvbmFsID0ge2Jpbm9wOiA3LCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9iaXRTaGlmdCA9IHtiaW5vcDogOCwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfcGx1c01pbiA9IHtiaW5vcDogOSwgcHJlZml4OiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9tdWx0aXBseU1vZHVsbyA9IHtiaW5vcDogMTAsIGJlZm9yZUV4cHI6IHRydWV9O1xuXG4gIC8vIFByb3ZpZGUgYWNjZXNzIHRvIHRoZSB0b2tlbiB0eXBlcyBmb3IgZXh0ZXJuYWwgdXNlcnMgb2YgdGhlXG4gIC8vIHRva2VuaXplci5cblxuICBleHBvcnRzLnRva1R5cGVzID0ge2JyYWNrZXRMOiBfYnJhY2tldEwsIGJyYWNrZXRSOiBfYnJhY2tldFIsIGJyYWNlTDogX2JyYWNlTCwgYnJhY2VSOiBfYnJhY2VSLFxuICAgICAgICAgICAgICAgICAgICAgIHBhcmVuTDogX3BhcmVuTCwgcGFyZW5SOiBfcGFyZW5SLCBjb21tYTogX2NvbW1hLCBzZW1pOiBfc2VtaSwgY29sb246IF9jb2xvbixcbiAgICAgICAgICAgICAgICAgICAgICBkb3Q6IF9kb3QsIGVsbGlwc2lzOiBfZWxsaXBzaXMsIHF1ZXN0aW9uOiBfcXVlc3Rpb24sIHNsYXNoOiBfc2xhc2gsIGVxOiBfZXEsXG4gICAgICAgICAgICAgICAgICAgICAgbmFtZTogX25hbWUsIGVvZjogX2VvZiwgbnVtOiBfbnVtLCByZWdleHA6IF9yZWdleHAsIHN0cmluZzogX3N0cmluZ307XG4gIGZvciAodmFyIGt3IGluIGtleXdvcmRUeXBlcykgZXhwb3J0cy50b2tUeXBlc1tcIl9cIiArIGt3XSA9IGtleXdvcmRUeXBlc1trd107XG5cbiAgLy8gVGhpcyBpcyBhIHRyaWNrIHRha2VuIGZyb20gRXNwcmltYS4gSXQgdHVybnMgb3V0IHRoYXQsIG9uXG4gIC8vIG5vbi1DaHJvbWUgYnJvd3NlcnMsIHRvIGNoZWNrIHdoZXRoZXIgYSBzdHJpbmcgaXMgaW4gYSBzZXQsIGFcbiAgLy8gcHJlZGljYXRlIGNvbnRhaW5pbmcgYSBiaWcgdWdseSBgc3dpdGNoYCBzdGF0ZW1lbnQgaXMgZmFzdGVyIHRoYW5cbiAgLy8gYSByZWd1bGFyIGV4cHJlc3Npb24sIGFuZCBvbiBDaHJvbWUgdGhlIHR3byBhcmUgYWJvdXQgb24gcGFyLlxuICAvLyBUaGlzIGZ1bmN0aW9uIHVzZXMgYGV2YWxgIChub24tbGV4aWNhbCkgdG8gcHJvZHVjZSBzdWNoIGFcbiAgLy8gcHJlZGljYXRlIGZyb20gYSBzcGFjZS1zZXBhcmF0ZWQgc3RyaW5nIG9mIHdvcmRzLlxuICAvL1xuICAvLyBJdCBzdGFydHMgYnkgc29ydGluZyB0aGUgd29yZHMgYnkgbGVuZ3RoLlxuXG4gIGZ1bmN0aW9uIG1ha2VQcmVkaWNhdGUod29yZHMpIHtcbiAgICB3b3JkcyA9IHdvcmRzLnNwbGl0KFwiIFwiKTtcbiAgICB2YXIgZiA9IFwiXCIsIGNhdHMgPSBbXTtcbiAgICBvdXQ6IGZvciAodmFyIGkgPSAwOyBpIDwgd29yZHMubGVuZ3RoOyArK2kpIHtcbiAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgY2F0cy5sZW5ndGg7ICsrailcbiAgICAgICAgaWYgKGNhdHNbal1bMF0ubGVuZ3RoID09IHdvcmRzW2ldLmxlbmd0aCkge1xuICAgICAgICAgIGNhdHNbal0ucHVzaCh3b3Jkc1tpXSk7XG4gICAgICAgICAgY29udGludWUgb3V0O1xuICAgICAgICB9XG4gICAgICBjYXRzLnB1c2goW3dvcmRzW2ldXSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIGNvbXBhcmVUbyhhcnIpIHtcbiAgICAgIGlmIChhcnIubGVuZ3RoID09IDEpIHJldHVybiBmICs9IFwicmV0dXJuIHN0ciA9PT0gXCIgKyBKU09OLnN0cmluZ2lmeShhcnJbMF0pICsgXCI7XCI7XG4gICAgICBmICs9IFwic3dpdGNoKHN0cil7XCI7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGFyci5sZW5ndGg7ICsraSkgZiArPSBcImNhc2UgXCIgKyBKU09OLnN0cmluZ2lmeShhcnJbaV0pICsgXCI6XCI7XG4gICAgICBmICs9IFwicmV0dXJuIHRydWV9cmV0dXJuIGZhbHNlO1wiO1xuICAgIH1cblxuICAgIC8vIFdoZW4gdGhlcmUgYXJlIG1vcmUgdGhhbiB0aHJlZSBsZW5ndGggY2F0ZWdvcmllcywgYW4gb3V0ZXJcbiAgICAvLyBzd2l0Y2ggZmlyc3QgZGlzcGF0Y2hlcyBvbiB0aGUgbGVuZ3RocywgdG8gc2F2ZSBvbiBjb21wYXJpc29ucy5cblxuICAgIGlmIChjYXRzLmxlbmd0aCA+IDMpIHtcbiAgICAgIGNhdHMuc29ydChmdW5jdGlvbihhLCBiKSB7cmV0dXJuIGIubGVuZ3RoIC0gYS5sZW5ndGg7fSk7XG4gICAgICBmICs9IFwic3dpdGNoKHN0ci5sZW5ndGgpe1wiO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjYXRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHZhciBjYXQgPSBjYXRzW2ldO1xuICAgICAgICBmICs9IFwiY2FzZSBcIiArIGNhdFswXS5sZW5ndGggKyBcIjpcIjtcbiAgICAgICAgY29tcGFyZVRvKGNhdCk7XG4gICAgICB9XG4gICAgICBmICs9IFwifVwiO1xuXG4gICAgLy8gT3RoZXJ3aXNlLCBzaW1wbHkgZ2VuZXJhdGUgYSBmbGF0IGBzd2l0Y2hgIHN0YXRlbWVudC5cblxuICAgIH0gZWxzZSB7XG4gICAgICBjb21wYXJlVG8od29yZHMpO1xuICAgIH1cbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKFwic3RyXCIsIGYpO1xuICB9XG5cbiAgLy8gVGhlIEVDTUFTY3JpcHQgMyByZXNlcnZlZCB3b3JkIGxpc3QuXG5cbiAgdmFyIGlzUmVzZXJ2ZWRXb3JkMyA9IG1ha2VQcmVkaWNhdGUoXCJhYnN0cmFjdCBib29sZWFuIGJ5dGUgY2hhciBjbGFzcyBkb3VibGUgZW51bSBleHBvcnQgZXh0ZW5kcyBmaW5hbCBmbG9hdCBnb3RvIGltcGxlbWVudHMgaW1wb3J0IGludCBpbnRlcmZhY2UgbG9uZyBuYXRpdmUgcGFja2FnZSBwcml2YXRlIHByb3RlY3RlZCBwdWJsaWMgc2hvcnQgc3RhdGljIHN1cGVyIHN5bmNocm9uaXplZCB0aHJvd3MgdHJhbnNpZW50IHZvbGF0aWxlXCIpO1xuXG4gIC8vIEVDTUFTY3JpcHQgNSByZXNlcnZlZCB3b3Jkcy5cblxuICB2YXIgaXNSZXNlcnZlZFdvcmQ1ID0gbWFrZVByZWRpY2F0ZShcImNsYXNzIGVudW0gZXh0ZW5kcyBzdXBlciBjb25zdCBleHBvcnQgaW1wb3J0XCIpO1xuXG4gIC8vIFRoZSBhZGRpdGlvbmFsIHJlc2VydmVkIHdvcmRzIGluIHN0cmljdCBtb2RlLlxuXG4gIHZhciBpc1N0cmljdFJlc2VydmVkV29yZCA9IG1ha2VQcmVkaWNhdGUoXCJpbXBsZW1lbnRzIGludGVyZmFjZSBsZXQgcGFja2FnZSBwcml2YXRlIHByb3RlY3RlZCBwdWJsaWMgc3RhdGljIHlpZWxkXCIpO1xuXG4gIC8vIFRoZSBmb3JiaWRkZW4gdmFyaWFibGUgbmFtZXMgaW4gc3RyaWN0IG1vZGUuXG5cbiAgdmFyIGlzU3RyaWN0QmFkSWRXb3JkID0gbWFrZVByZWRpY2F0ZShcImV2YWwgYXJndW1lbnRzXCIpO1xuXG4gIC8vIEFuZCB0aGUga2V5d29yZHMuXG5cbiAgdmFyIGVjbWE1QW5kTGVzc0tleXdvcmRzID0gXCJicmVhayBjYXNlIGNhdGNoIGNvbnRpbnVlIGRlYnVnZ2VyIGRlZmF1bHQgZG8gZWxzZSBmaW5hbGx5IGZvciBmdW5jdGlvbiBpZiByZXR1cm4gc3dpdGNoIHRocm93IHRyeSB2YXIgd2hpbGUgd2l0aCBudWxsIHRydWUgZmFsc2UgaW5zdGFuY2VvZiB0eXBlb2Ygdm9pZCBkZWxldGUgbmV3IGluIHRoaXNcIjtcblxuICB2YXIgaXNFY21hNUFuZExlc3NLZXl3b3JkID0gbWFrZVByZWRpY2F0ZShlY21hNUFuZExlc3NLZXl3b3Jkcyk7XG5cbiAgdmFyIGlzRWNtYTZLZXl3b3JkID0gbWFrZVByZWRpY2F0ZShlY21hNUFuZExlc3NLZXl3b3JkcyArIFwiIGxldCBjb25zdFwiKTtcblxuICB2YXIgaXNLZXl3b3JkID0gaXNFY21hNUFuZExlc3NLZXl3b3JkO1xuXG4gIC8vICMjIENoYXJhY3RlciBjYXRlZ29yaWVzXG5cbiAgLy8gQmlnIHVnbHkgcmVndWxhciBleHByZXNzaW9ucyB0aGF0IG1hdGNoIGNoYXJhY3RlcnMgaW4gdGhlXG4gIC8vIHdoaXRlc3BhY2UsIGlkZW50aWZpZXIsIGFuZCBpZGVudGlmaWVyLXN0YXJ0IGNhdGVnb3JpZXMuIFRoZXNlXG4gIC8vIGFyZSBvbmx5IGFwcGxpZWQgd2hlbiBhIGNoYXJhY3RlciBpcyBmb3VuZCB0byBhY3R1YWxseSBoYXZlIGFcbiAgLy8gY29kZSBwb2ludCBhYm92ZSAxMjguXG5cbiAgdmFyIG5vbkFTQ0lJd2hpdGVzcGFjZSA9IC9bXFx1MTY4MFxcdTE4MGVcXHUyMDAwLVxcdTIwMGFcXHUyMDJmXFx1MjA1ZlxcdTMwMDBcXHVmZWZmXS87XG4gIHZhciBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzID0gXCJcXHhhYVxceGI1XFx4YmFcXHhjMC1cXHhkNlxceGQ4LVxceGY2XFx4ZjgtXFx1MDJjMVxcdTAyYzYtXFx1MDJkMVxcdTAyZTAtXFx1MDJlNFxcdTAyZWNcXHUwMmVlXFx1MDM3MC1cXHUwMzc0XFx1MDM3NlxcdTAzNzdcXHUwMzdhLVxcdTAzN2RcXHUwMzg2XFx1MDM4OC1cXHUwMzhhXFx1MDM4Y1xcdTAzOGUtXFx1MDNhMVxcdTAzYTMtXFx1MDNmNVxcdTAzZjctXFx1MDQ4MVxcdTA0OGEtXFx1MDUyN1xcdTA1MzEtXFx1MDU1NlxcdTA1NTlcXHUwNTYxLVxcdTA1ODdcXHUwNWQwLVxcdTA1ZWFcXHUwNWYwLVxcdTA1ZjJcXHUwNjIwLVxcdTA2NGFcXHUwNjZlXFx1MDY2ZlxcdTA2NzEtXFx1MDZkM1xcdTA2ZDVcXHUwNmU1XFx1MDZlNlxcdTA2ZWVcXHUwNmVmXFx1MDZmYS1cXHUwNmZjXFx1MDZmZlxcdTA3MTBcXHUwNzEyLVxcdTA3MmZcXHUwNzRkLVxcdTA3YTVcXHUwN2IxXFx1MDdjYS1cXHUwN2VhXFx1MDdmNFxcdTA3ZjVcXHUwN2ZhXFx1MDgwMC1cXHUwODE1XFx1MDgxYVxcdTA4MjRcXHUwODI4XFx1MDg0MC1cXHUwODU4XFx1MDhhMFxcdTA4YTItXFx1MDhhY1xcdTA5MDQtXFx1MDkzOVxcdTA5M2RcXHUwOTUwXFx1MDk1OC1cXHUwOTYxXFx1MDk3MS1cXHUwOTc3XFx1MDk3OS1cXHUwOTdmXFx1MDk4NS1cXHUwOThjXFx1MDk4ZlxcdTA5OTBcXHUwOTkzLVxcdTA5YThcXHUwOWFhLVxcdTA5YjBcXHUwOWIyXFx1MDliNi1cXHUwOWI5XFx1MDliZFxcdTA5Y2VcXHUwOWRjXFx1MDlkZFxcdTA5ZGYtXFx1MDllMVxcdTA5ZjBcXHUwOWYxXFx1MGEwNS1cXHUwYTBhXFx1MGEwZlxcdTBhMTBcXHUwYTEzLVxcdTBhMjhcXHUwYTJhLVxcdTBhMzBcXHUwYTMyXFx1MGEzM1xcdTBhMzVcXHUwYTM2XFx1MGEzOFxcdTBhMzlcXHUwYTU5LVxcdTBhNWNcXHUwYTVlXFx1MGE3Mi1cXHUwYTc0XFx1MGE4NS1cXHUwYThkXFx1MGE4Zi1cXHUwYTkxXFx1MGE5My1cXHUwYWE4XFx1MGFhYS1cXHUwYWIwXFx1MGFiMlxcdTBhYjNcXHUwYWI1LVxcdTBhYjlcXHUwYWJkXFx1MGFkMFxcdTBhZTBcXHUwYWUxXFx1MGIwNS1cXHUwYjBjXFx1MGIwZlxcdTBiMTBcXHUwYjEzLVxcdTBiMjhcXHUwYjJhLVxcdTBiMzBcXHUwYjMyXFx1MGIzM1xcdTBiMzUtXFx1MGIzOVxcdTBiM2RcXHUwYjVjXFx1MGI1ZFxcdTBiNWYtXFx1MGI2MVxcdTBiNzFcXHUwYjgzXFx1MGI4NS1cXHUwYjhhXFx1MGI4ZS1cXHUwYjkwXFx1MGI5Mi1cXHUwYjk1XFx1MGI5OVxcdTBiOWFcXHUwYjljXFx1MGI5ZVxcdTBiOWZcXHUwYmEzXFx1MGJhNFxcdTBiYTgtXFx1MGJhYVxcdTBiYWUtXFx1MGJiOVxcdTBiZDBcXHUwYzA1LVxcdTBjMGNcXHUwYzBlLVxcdTBjMTBcXHUwYzEyLVxcdTBjMjhcXHUwYzJhLVxcdTBjMzNcXHUwYzM1LVxcdTBjMzlcXHUwYzNkXFx1MGM1OFxcdTBjNTlcXHUwYzYwXFx1MGM2MVxcdTBjODUtXFx1MGM4Y1xcdTBjOGUtXFx1MGM5MFxcdTBjOTItXFx1MGNhOFxcdTBjYWEtXFx1MGNiM1xcdTBjYjUtXFx1MGNiOVxcdTBjYmRcXHUwY2RlXFx1MGNlMFxcdTBjZTFcXHUwY2YxXFx1MGNmMlxcdTBkMDUtXFx1MGQwY1xcdTBkMGUtXFx1MGQxMFxcdTBkMTItXFx1MGQzYVxcdTBkM2RcXHUwZDRlXFx1MGQ2MFxcdTBkNjFcXHUwZDdhLVxcdTBkN2ZcXHUwZDg1LVxcdTBkOTZcXHUwZDlhLVxcdTBkYjFcXHUwZGIzLVxcdTBkYmJcXHUwZGJkXFx1MGRjMC1cXHUwZGM2XFx1MGUwMS1cXHUwZTMwXFx1MGUzMlxcdTBlMzNcXHUwZTQwLVxcdTBlNDZcXHUwZTgxXFx1MGU4MlxcdTBlODRcXHUwZTg3XFx1MGU4OFxcdTBlOGFcXHUwZThkXFx1MGU5NC1cXHUwZTk3XFx1MGU5OS1cXHUwZTlmXFx1MGVhMS1cXHUwZWEzXFx1MGVhNVxcdTBlYTdcXHUwZWFhXFx1MGVhYlxcdTBlYWQtXFx1MGViMFxcdTBlYjJcXHUwZWIzXFx1MGViZFxcdTBlYzAtXFx1MGVjNFxcdTBlYzZcXHUwZWRjLVxcdTBlZGZcXHUwZjAwXFx1MGY0MC1cXHUwZjQ3XFx1MGY0OS1cXHUwZjZjXFx1MGY4OC1cXHUwZjhjXFx1MTAwMC1cXHUxMDJhXFx1MTAzZlxcdTEwNTAtXFx1MTA1NVxcdTEwNWEtXFx1MTA1ZFxcdTEwNjFcXHUxMDY1XFx1MTA2NlxcdTEwNmUtXFx1MTA3MFxcdTEwNzUtXFx1MTA4MVxcdTEwOGVcXHUxMGEwLVxcdTEwYzVcXHUxMGM3XFx1MTBjZFxcdTEwZDAtXFx1MTBmYVxcdTEwZmMtXFx1MTI0OFxcdTEyNGEtXFx1MTI0ZFxcdTEyNTAtXFx1MTI1NlxcdTEyNThcXHUxMjVhLVxcdTEyNWRcXHUxMjYwLVxcdTEyODhcXHUxMjhhLVxcdTEyOGRcXHUxMjkwLVxcdTEyYjBcXHUxMmIyLVxcdTEyYjVcXHUxMmI4LVxcdTEyYmVcXHUxMmMwXFx1MTJjMi1cXHUxMmM1XFx1MTJjOC1cXHUxMmQ2XFx1MTJkOC1cXHUxMzEwXFx1MTMxMi1cXHUxMzE1XFx1MTMxOC1cXHUxMzVhXFx1MTM4MC1cXHUxMzhmXFx1MTNhMC1cXHUxM2Y0XFx1MTQwMS1cXHUxNjZjXFx1MTY2Zi1cXHUxNjdmXFx1MTY4MS1cXHUxNjlhXFx1MTZhMC1cXHUxNmVhXFx1MTZlZS1cXHUxNmYwXFx1MTcwMC1cXHUxNzBjXFx1MTcwZS1cXHUxNzExXFx1MTcyMC1cXHUxNzMxXFx1MTc0MC1cXHUxNzUxXFx1MTc2MC1cXHUxNzZjXFx1MTc2ZS1cXHUxNzcwXFx1MTc4MC1cXHUxN2IzXFx1MTdkN1xcdTE3ZGNcXHUxODIwLVxcdTE4NzdcXHUxODgwLVxcdTE4YThcXHUxOGFhXFx1MThiMC1cXHUxOGY1XFx1MTkwMC1cXHUxOTFjXFx1MTk1MC1cXHUxOTZkXFx1MTk3MC1cXHUxOTc0XFx1MTk4MC1cXHUxOWFiXFx1MTljMS1cXHUxOWM3XFx1MWEwMC1cXHUxYTE2XFx1MWEyMC1cXHUxYTU0XFx1MWFhN1xcdTFiMDUtXFx1MWIzM1xcdTFiNDUtXFx1MWI0YlxcdTFiODMtXFx1MWJhMFxcdTFiYWVcXHUxYmFmXFx1MWJiYS1cXHUxYmU1XFx1MWMwMC1cXHUxYzIzXFx1MWM0ZC1cXHUxYzRmXFx1MWM1YS1cXHUxYzdkXFx1MWNlOS1cXHUxY2VjXFx1MWNlZS1cXHUxY2YxXFx1MWNmNVxcdTFjZjZcXHUxZDAwLVxcdTFkYmZcXHUxZTAwLVxcdTFmMTVcXHUxZjE4LVxcdTFmMWRcXHUxZjIwLVxcdTFmNDVcXHUxZjQ4LVxcdTFmNGRcXHUxZjUwLVxcdTFmNTdcXHUxZjU5XFx1MWY1YlxcdTFmNWRcXHUxZjVmLVxcdTFmN2RcXHUxZjgwLVxcdTFmYjRcXHUxZmI2LVxcdTFmYmNcXHUxZmJlXFx1MWZjMi1cXHUxZmM0XFx1MWZjNi1cXHUxZmNjXFx1MWZkMC1cXHUxZmQzXFx1MWZkNi1cXHUxZmRiXFx1MWZlMC1cXHUxZmVjXFx1MWZmMi1cXHUxZmY0XFx1MWZmNi1cXHUxZmZjXFx1MjA3MVxcdTIwN2ZcXHUyMDkwLVxcdTIwOWNcXHUyMTAyXFx1MjEwN1xcdTIxMGEtXFx1MjExM1xcdTIxMTVcXHUyMTE5LVxcdTIxMWRcXHUyMTI0XFx1MjEyNlxcdTIxMjhcXHUyMTJhLVxcdTIxMmRcXHUyMTJmLVxcdTIxMzlcXHUyMTNjLVxcdTIxM2ZcXHUyMTQ1LVxcdTIxNDlcXHUyMTRlXFx1MjE2MC1cXHUyMTg4XFx1MmMwMC1cXHUyYzJlXFx1MmMzMC1cXHUyYzVlXFx1MmM2MC1cXHUyY2U0XFx1MmNlYi1cXHUyY2VlXFx1MmNmMlxcdTJjZjNcXHUyZDAwLVxcdTJkMjVcXHUyZDI3XFx1MmQyZFxcdTJkMzAtXFx1MmQ2N1xcdTJkNmZcXHUyZDgwLVxcdTJkOTZcXHUyZGEwLVxcdTJkYTZcXHUyZGE4LVxcdTJkYWVcXHUyZGIwLVxcdTJkYjZcXHUyZGI4LVxcdTJkYmVcXHUyZGMwLVxcdTJkYzZcXHUyZGM4LVxcdTJkY2VcXHUyZGQwLVxcdTJkZDZcXHUyZGQ4LVxcdTJkZGVcXHUyZTJmXFx1MzAwNS1cXHUzMDA3XFx1MzAyMS1cXHUzMDI5XFx1MzAzMS1cXHUzMDM1XFx1MzAzOC1cXHUzMDNjXFx1MzA0MS1cXHUzMDk2XFx1MzA5ZC1cXHUzMDlmXFx1MzBhMS1cXHUzMGZhXFx1MzBmYy1cXHUzMGZmXFx1MzEwNS1cXHUzMTJkXFx1MzEzMS1cXHUzMThlXFx1MzFhMC1cXHUzMWJhXFx1MzFmMC1cXHUzMWZmXFx1MzQwMC1cXHU0ZGI1XFx1NGUwMC1cXHU5ZmNjXFx1YTAwMC1cXHVhNDhjXFx1YTRkMC1cXHVhNGZkXFx1YTUwMC1cXHVhNjBjXFx1YTYxMC1cXHVhNjFmXFx1YTYyYVxcdWE2MmJcXHVhNjQwLVxcdWE2NmVcXHVhNjdmLVxcdWE2OTdcXHVhNmEwLVxcdWE2ZWZcXHVhNzE3LVxcdWE3MWZcXHVhNzIyLVxcdWE3ODhcXHVhNzhiLVxcdWE3OGVcXHVhNzkwLVxcdWE3OTNcXHVhN2EwLVxcdWE3YWFcXHVhN2Y4LVxcdWE4MDFcXHVhODAzLVxcdWE4MDVcXHVhODA3LVxcdWE4MGFcXHVhODBjLVxcdWE4MjJcXHVhODQwLVxcdWE4NzNcXHVhODgyLVxcdWE4YjNcXHVhOGYyLVxcdWE4ZjdcXHVhOGZiXFx1YTkwYS1cXHVhOTI1XFx1YTkzMC1cXHVhOTQ2XFx1YTk2MC1cXHVhOTdjXFx1YTk4NC1cXHVhOWIyXFx1YTljZlxcdWFhMDAtXFx1YWEyOFxcdWFhNDAtXFx1YWE0MlxcdWFhNDQtXFx1YWE0YlxcdWFhNjAtXFx1YWE3NlxcdWFhN2FcXHVhYTgwLVxcdWFhYWZcXHVhYWIxXFx1YWFiNVxcdWFhYjZcXHVhYWI5LVxcdWFhYmRcXHVhYWMwXFx1YWFjMlxcdWFhZGItXFx1YWFkZFxcdWFhZTAtXFx1YWFlYVxcdWFhZjItXFx1YWFmNFxcdWFiMDEtXFx1YWIwNlxcdWFiMDktXFx1YWIwZVxcdWFiMTEtXFx1YWIxNlxcdWFiMjAtXFx1YWIyNlxcdWFiMjgtXFx1YWIyZVxcdWFiYzAtXFx1YWJlMlxcdWFjMDAtXFx1ZDdhM1xcdWQ3YjAtXFx1ZDdjNlxcdWQ3Y2ItXFx1ZDdmYlxcdWY5MDAtXFx1ZmE2ZFxcdWZhNzAtXFx1ZmFkOVxcdWZiMDAtXFx1ZmIwNlxcdWZiMTMtXFx1ZmIxN1xcdWZiMWRcXHVmYjFmLVxcdWZiMjhcXHVmYjJhLVxcdWZiMzZcXHVmYjM4LVxcdWZiM2NcXHVmYjNlXFx1ZmI0MFxcdWZiNDFcXHVmYjQzXFx1ZmI0NFxcdWZiNDYtXFx1ZmJiMVxcdWZiZDMtXFx1ZmQzZFxcdWZkNTAtXFx1ZmQ4ZlxcdWZkOTItXFx1ZmRjN1xcdWZkZjAtXFx1ZmRmYlxcdWZlNzAtXFx1ZmU3NFxcdWZlNzYtXFx1ZmVmY1xcdWZmMjEtXFx1ZmYzYVxcdWZmNDEtXFx1ZmY1YVxcdWZmNjYtXFx1ZmZiZVxcdWZmYzItXFx1ZmZjN1xcdWZmY2EtXFx1ZmZjZlxcdWZmZDItXFx1ZmZkN1xcdWZmZGEtXFx1ZmZkY1wiO1xuICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyQ2hhcnMgPSBcIlxcdTAzMDAtXFx1MDM2ZlxcdTA0ODMtXFx1MDQ4N1xcdTA1OTEtXFx1MDViZFxcdTA1YmZcXHUwNWMxXFx1MDVjMlxcdTA1YzRcXHUwNWM1XFx1MDVjN1xcdTA2MTAtXFx1MDYxYVxcdTA2MjAtXFx1MDY0OVxcdTA2NzItXFx1MDZkM1xcdTA2ZTctXFx1MDZlOFxcdTA2ZmItXFx1MDZmY1xcdTA3MzAtXFx1MDc0YVxcdTA4MDAtXFx1MDgxNFxcdTA4MWItXFx1MDgyM1xcdTA4MjUtXFx1MDgyN1xcdTA4MjktXFx1MDgyZFxcdTA4NDAtXFx1MDg1N1xcdTA4ZTQtXFx1MDhmZVxcdTA5MDAtXFx1MDkwM1xcdTA5M2EtXFx1MDkzY1xcdTA5M2UtXFx1MDk0ZlxcdTA5NTEtXFx1MDk1N1xcdTA5NjItXFx1MDk2M1xcdTA5NjYtXFx1MDk2ZlxcdTA5ODEtXFx1MDk4M1xcdTA5YmNcXHUwOWJlLVxcdTA5YzRcXHUwOWM3XFx1MDljOFxcdTA5ZDdcXHUwOWRmLVxcdTA5ZTBcXHUwYTAxLVxcdTBhMDNcXHUwYTNjXFx1MGEzZS1cXHUwYTQyXFx1MGE0N1xcdTBhNDhcXHUwYTRiLVxcdTBhNGRcXHUwYTUxXFx1MGE2Ni1cXHUwYTcxXFx1MGE3NVxcdTBhODEtXFx1MGE4M1xcdTBhYmNcXHUwYWJlLVxcdTBhYzVcXHUwYWM3LVxcdTBhYzlcXHUwYWNiLVxcdTBhY2RcXHUwYWUyLVxcdTBhZTNcXHUwYWU2LVxcdTBhZWZcXHUwYjAxLVxcdTBiMDNcXHUwYjNjXFx1MGIzZS1cXHUwYjQ0XFx1MGI0N1xcdTBiNDhcXHUwYjRiLVxcdTBiNGRcXHUwYjU2XFx1MGI1N1xcdTBiNWYtXFx1MGI2MFxcdTBiNjYtXFx1MGI2ZlxcdTBiODJcXHUwYmJlLVxcdTBiYzJcXHUwYmM2LVxcdTBiYzhcXHUwYmNhLVxcdTBiY2RcXHUwYmQ3XFx1MGJlNi1cXHUwYmVmXFx1MGMwMS1cXHUwYzAzXFx1MGM0Ni1cXHUwYzQ4XFx1MGM0YS1cXHUwYzRkXFx1MGM1NVxcdTBjNTZcXHUwYzYyLVxcdTBjNjNcXHUwYzY2LVxcdTBjNmZcXHUwYzgyXFx1MGM4M1xcdTBjYmNcXHUwY2JlLVxcdTBjYzRcXHUwY2M2LVxcdTBjYzhcXHUwY2NhLVxcdTBjY2RcXHUwY2Q1XFx1MGNkNlxcdTBjZTItXFx1MGNlM1xcdTBjZTYtXFx1MGNlZlxcdTBkMDJcXHUwZDAzXFx1MGQ0Ni1cXHUwZDQ4XFx1MGQ1N1xcdTBkNjItXFx1MGQ2M1xcdTBkNjYtXFx1MGQ2ZlxcdTBkODJcXHUwZDgzXFx1MGRjYVxcdTBkY2YtXFx1MGRkNFxcdTBkZDZcXHUwZGQ4LVxcdTBkZGZcXHUwZGYyXFx1MGRmM1xcdTBlMzQtXFx1MGUzYVxcdTBlNDAtXFx1MGU0NVxcdTBlNTAtXFx1MGU1OVxcdTBlYjQtXFx1MGViOVxcdTBlYzgtXFx1MGVjZFxcdTBlZDAtXFx1MGVkOVxcdTBmMThcXHUwZjE5XFx1MGYyMC1cXHUwZjI5XFx1MGYzNVxcdTBmMzdcXHUwZjM5XFx1MGY0MS1cXHUwZjQ3XFx1MGY3MS1cXHUwZjg0XFx1MGY4Ni1cXHUwZjg3XFx1MGY4ZC1cXHUwZjk3XFx1MGY5OS1cXHUwZmJjXFx1MGZjNlxcdTEwMDAtXFx1MTAyOVxcdTEwNDAtXFx1MTA0OVxcdTEwNjctXFx1MTA2ZFxcdTEwNzEtXFx1MTA3NFxcdTEwODItXFx1MTA4ZFxcdTEwOGYtXFx1MTA5ZFxcdTEzNWQtXFx1MTM1ZlxcdTE3MGUtXFx1MTcxMFxcdTE3MjAtXFx1MTczMFxcdTE3NDAtXFx1MTc1MFxcdTE3NzJcXHUxNzczXFx1MTc4MC1cXHUxN2IyXFx1MTdkZFxcdTE3ZTAtXFx1MTdlOVxcdTE4MGItXFx1MTgwZFxcdTE4MTAtXFx1MTgxOVxcdTE5MjAtXFx1MTkyYlxcdTE5MzAtXFx1MTkzYlxcdTE5NTEtXFx1MTk2ZFxcdTE5YjAtXFx1MTljMFxcdTE5YzgtXFx1MTljOVxcdTE5ZDAtXFx1MTlkOVxcdTFhMDAtXFx1MWExNVxcdTFhMjAtXFx1MWE1M1xcdTFhNjAtXFx1MWE3Y1xcdTFhN2YtXFx1MWE4OVxcdTFhOTAtXFx1MWE5OVxcdTFiNDYtXFx1MWI0YlxcdTFiNTAtXFx1MWI1OVxcdTFiNmItXFx1MWI3M1xcdTFiYjAtXFx1MWJiOVxcdTFiZTYtXFx1MWJmM1xcdTFjMDAtXFx1MWMyMlxcdTFjNDAtXFx1MWM0OVxcdTFjNWItXFx1MWM3ZFxcdTFjZDAtXFx1MWNkMlxcdTFkMDAtXFx1MWRiZVxcdTFlMDEtXFx1MWYxNVxcdTIwMGNcXHUyMDBkXFx1MjAzZlxcdTIwNDBcXHUyMDU0XFx1MjBkMC1cXHUyMGRjXFx1MjBlMVxcdTIwZTUtXFx1MjBmMFxcdTJkODEtXFx1MmQ5NlxcdTJkZTAtXFx1MmRmZlxcdTMwMjEtXFx1MzAyOFxcdTMwOTlcXHUzMDlhXFx1YTY0MC1cXHVhNjZkXFx1YTY3NC1cXHVhNjdkXFx1YTY5ZlxcdWE2ZjAtXFx1YTZmMVxcdWE3ZjgtXFx1YTgwMFxcdWE4MDZcXHVhODBiXFx1YTgyMy1cXHVhODI3XFx1YTg4MC1cXHVhODgxXFx1YThiNC1cXHVhOGM0XFx1YThkMC1cXHVhOGQ5XFx1YThmMy1cXHVhOGY3XFx1YTkwMC1cXHVhOTA5XFx1YTkyNi1cXHVhOTJkXFx1YTkzMC1cXHVhOTQ1XFx1YTk4MC1cXHVhOTgzXFx1YTliMy1cXHVhOWMwXFx1YWEwMC1cXHVhYTI3XFx1YWE0MC1cXHVhYTQxXFx1YWE0Yy1cXHVhYTRkXFx1YWE1MC1cXHVhYTU5XFx1YWE3YlxcdWFhZTAtXFx1YWFlOVxcdWFhZjItXFx1YWFmM1xcdWFiYzAtXFx1YWJlMVxcdWFiZWNcXHVhYmVkXFx1YWJmMC1cXHVhYmY5XFx1ZmIyMC1cXHVmYjI4XFx1ZmUwMC1cXHVmZTBmXFx1ZmUyMC1cXHVmZTI2XFx1ZmUzM1xcdWZlMzRcXHVmZTRkLVxcdWZlNGZcXHVmZjEwLVxcdWZmMTlcXHVmZjNmXCI7XG4gIHZhciBub25BU0NJSWlkZW50aWZpZXJTdGFydCA9IG5ldyBSZWdFeHAoXCJbXCIgKyBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzICsgXCJdXCIpO1xuICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyID0gbmV3IFJlZ0V4cChcIltcIiArIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0Q2hhcnMgKyBub25BU0NJSWlkZW50aWZpZXJDaGFycyArIFwiXVwiKTtcblxuICAvLyBXaGV0aGVyIGEgc2luZ2xlIGNoYXJhY3RlciBkZW5vdGVzIGEgbmV3bGluZS5cblxuICB2YXIgbmV3bGluZSA9IC9bXFxuXFxyXFx1MjAyOFxcdTIwMjldLztcblxuICAvLyBNYXRjaGVzIGEgd2hvbGUgbGluZSBicmVhayAod2hlcmUgQ1JMRiBpcyBjb25zaWRlcmVkIGEgc2luZ2xlXG4gIC8vIGxpbmUgYnJlYWspLiBVc2VkIHRvIGNvdW50IGxpbmVzLlxuXG4gIHZhciBsaW5lQnJlYWsgPSAvXFxyXFxufFtcXG5cXHJcXHUyMDI4XFx1MjAyOV0vZztcblxuICAvLyBUZXN0IHdoZXRoZXIgYSBnaXZlbiBjaGFyYWN0ZXIgY29kZSBzdGFydHMgYW4gaWRlbnRpZmllci5cblxuICB2YXIgaXNJZGVudGlmaWVyU3RhcnQgPSBleHBvcnRzLmlzSWRlbnRpZmllclN0YXJ0ID0gZnVuY3Rpb24oY29kZSkge1xuICAgIGlmIChjb2RlIDwgNjUpIHJldHVybiBjb2RlID09PSAzNjtcbiAgICBpZiAoY29kZSA8IDkxKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoY29kZSA8IDk3KSByZXR1cm4gY29kZSA9PT0gOTU7XG4gICAgaWYgKGNvZGUgPCAxMjMpcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGNvZGUgPj0gMHhhYSAmJiBub25BU0NJSWlkZW50aWZpZXJTdGFydC50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkpO1xuICB9O1xuXG4gIC8vIFRlc3Qgd2hldGhlciBhIGdpdmVuIGNoYXJhY3RlciBpcyBwYXJ0IG9mIGFuIGlkZW50aWZpZXIuXG5cbiAgdmFyIGlzSWRlbnRpZmllckNoYXIgPSBleHBvcnRzLmlzSWRlbnRpZmllckNoYXIgPSBmdW5jdGlvbihjb2RlKSB7XG4gICAgaWYgKGNvZGUgPCA0OCkgcmV0dXJuIGNvZGUgPT09IDM2O1xuICAgIGlmIChjb2RlIDwgNTgpIHJldHVybiB0cnVlO1xuICAgIGlmIChjb2RlIDwgNjUpIHJldHVybiBmYWxzZTtcbiAgICBpZiAoY29kZSA8IDkxKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoY29kZSA8IDk3KSByZXR1cm4gY29kZSA9PT0gOTU7XG4gICAgaWYgKGNvZGUgPCAxMjMpcmV0dXJuIHRydWU7XG4gICAgcmV0dXJuIGNvZGUgPj0gMHhhYSAmJiBub25BU0NJSWlkZW50aWZpZXIudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpKTtcbiAgfTtcblxuICAvLyAjIyBUb2tlbml6ZXJcblxuICAvLyBUaGVzZSBhcmUgdXNlZCB3aGVuIGBvcHRpb25zLmxvY2F0aW9uc2AgaXMgb24sIGZvciB0aGVcbiAgLy8gYHRva1N0YXJ0TG9jYCBhbmQgYHRva0VuZExvY2AgcHJvcGVydGllcy5cblxuICBmdW5jdGlvbiBQb3NpdGlvbigpIHtcbiAgICB0aGlzLmxpbmUgPSB0b2tDdXJMaW5lO1xuICAgIHRoaXMuY29sdW1uID0gdG9rUG9zIC0gdG9rTGluZVN0YXJ0O1xuICB9XG5cbiAgLy8gUmVzZXQgdGhlIHRva2VuIHN0YXRlLiBVc2VkIGF0IHRoZSBzdGFydCBvZiBhIHBhcnNlLlxuXG4gIGZ1bmN0aW9uIGluaXRUb2tlblN0YXRlKCkge1xuICAgIHRva0N1ckxpbmUgPSAxO1xuICAgIHRva1BvcyA9IHRva0xpbmVTdGFydCA9IDA7XG4gICAgdG9rUmVnZXhwQWxsb3dlZCA9IHRydWU7XG4gICAgc2tpcFNwYWNlKCk7XG4gIH1cblxuICAvLyBDYWxsZWQgYXQgdGhlIGVuZCBvZiBldmVyeSB0b2tlbi4gU2V0cyBgdG9rRW5kYCwgYHRva1ZhbGAsIGFuZFxuICAvLyBgdG9rUmVnZXhwQWxsb3dlZGAsIGFuZCBza2lwcyB0aGUgc3BhY2UgYWZ0ZXIgdGhlIHRva2VuLCBzbyB0aGF0XG4gIC8vIHRoZSBuZXh0IG9uZSdzIGB0b2tTdGFydGAgd2lsbCBwb2ludCBhdCB0aGUgcmlnaHQgcG9zaXRpb24uXG5cbiAgZnVuY3Rpb24gZmluaXNoVG9rZW4odHlwZSwgdmFsKSB7XG4gICAgdG9rRW5kID0gdG9rUG9zO1xuICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykgdG9rRW5kTG9jID0gbmV3IFBvc2l0aW9uO1xuICAgIHRva1R5cGUgPSB0eXBlO1xuICAgIHNraXBTcGFjZSgpO1xuICAgIHRva1ZhbCA9IHZhbDtcbiAgICB0b2tSZWdleHBBbGxvd2VkID0gdHlwZS5iZWZvcmVFeHByO1xuICB9XG5cbiAgZnVuY3Rpb24gc2tpcEJsb2NrQ29tbWVudCgpIHtcbiAgICB2YXIgc3RhcnRMb2MgPSBvcHRpb25zLm9uQ29tbWVudCAmJiBvcHRpb25zLmxvY2F0aW9ucyAmJiBuZXcgUG9zaXRpb247XG4gICAgdmFyIHN0YXJ0ID0gdG9rUG9zLCBlbmQgPSBpbnB1dC5pbmRleE9mKFwiKi9cIiwgdG9rUG9zICs9IDIpO1xuICAgIGlmIChlbmQgPT09IC0xKSByYWlzZSh0b2tQb3MgLSAyLCBcIlVudGVybWluYXRlZCBjb21tZW50XCIpO1xuICAgIHRva1BvcyA9IGVuZCArIDI7XG4gICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgICBsaW5lQnJlYWsubGFzdEluZGV4ID0gc3RhcnQ7XG4gICAgICB2YXIgbWF0Y2g7XG4gICAgICB3aGlsZSAoKG1hdGNoID0gbGluZUJyZWFrLmV4ZWMoaW5wdXQpKSAmJiBtYXRjaC5pbmRleCA8IHRva1Bvcykge1xuICAgICAgICArK3Rva0N1ckxpbmU7XG4gICAgICAgIHRva0xpbmVTdGFydCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAob3B0aW9ucy5vbkNvbW1lbnQpXG4gICAgICBvcHRpb25zLm9uQ29tbWVudCh0cnVlLCBpbnB1dC5zbGljZShzdGFydCArIDIsIGVuZCksIHN0YXJ0LCB0b2tQb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydExvYywgb3B0aW9ucy5sb2NhdGlvbnMgJiYgbmV3IFBvc2l0aW9uKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNraXBMaW5lQ29tbWVudCgpIHtcbiAgICB2YXIgc3RhcnQgPSB0b2tQb3M7XG4gICAgdmFyIHN0YXJ0TG9jID0gb3B0aW9ucy5vbkNvbW1lbnQgJiYgb3B0aW9ucy5sb2NhdGlvbnMgJiYgbmV3IFBvc2l0aW9uO1xuICAgIHZhciBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKz0yKTtcbiAgICB3aGlsZSAodG9rUG9zIDwgaW5wdXRMZW4gJiYgY2ggIT09IDEwICYmIGNoICE9PSAxMyAmJiBjaCAhPT0gODIzMiAmJiBjaCAhPT0gODIzMykge1xuICAgICAgKyt0b2tQb3M7XG4gICAgICBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMub25Db21tZW50KVxuICAgICAgb3B0aW9ucy5vbkNvbW1lbnQoZmFsc2UsIGlucHV0LnNsaWNlKHN0YXJ0ICsgMiwgdG9rUG9zKSwgc3RhcnQsIHRva1BvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0TG9jLCBvcHRpb25zLmxvY2F0aW9ucyAmJiBuZXcgUG9zaXRpb24pO1xuICB9XG5cbiAgLy8gQ2FsbGVkIGF0IHRoZSBzdGFydCBvZiB0aGUgcGFyc2UgYW5kIGFmdGVyIGV2ZXJ5IHRva2VuLiBTa2lwc1xuICAvLyB3aGl0ZXNwYWNlIGFuZCBjb21tZW50cywgYW5kLlxuXG4gIGZ1bmN0aW9uIHNraXBTcGFjZSgpIHtcbiAgICB3aGlsZSAodG9rUG9zIDwgaW5wdXRMZW4pIHtcbiAgICAgIHZhciBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICAgIGlmIChjaCA9PT0gMzIpIHsgLy8gJyAnXG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gMTMpIHtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgICAgICBpZiAobmV4dCA9PT0gMTApIHtcbiAgICAgICAgICArK3Rva1BvcztcbiAgICAgICAgfVxuICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnMpIHtcbiAgICAgICAgICArK3Rva0N1ckxpbmU7XG4gICAgICAgICAgdG9rTGluZVN0YXJ0ID0gdG9rUG9zO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSAxMCB8fCBjaCA9PT0gODIzMiB8fCBjaCA9PT0gODIzMykge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgICAgICAgKyt0b2tDdXJMaW5lO1xuICAgICAgICAgIHRva0xpbmVTdGFydCA9IHRva1BvcztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaCA+IDggJiYgY2ggPCAxNCkge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDQ3KSB7IC8vICcvJ1xuICAgICAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgICAgIGlmIChuZXh0ID09PSA0MikgeyAvLyAnKidcbiAgICAgICAgICBza2lwQmxvY2tDb21tZW50KCk7XG4gICAgICAgIH0gZWxzZSBpZiAobmV4dCA9PT0gNDcpIHsgLy8gJy8nXG4gICAgICAgICAgc2tpcExpbmVDb21tZW50KCk7XG4gICAgICAgIH0gZWxzZSBicmVhaztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDE2MCkgeyAvLyAnXFx4YTAnXG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgfSBlbHNlIGlmIChjaCA+PSA1NzYwICYmIG5vbkFTQ0lJd2hpdGVzcGFjZS50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpKSkge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vICMjIyBUb2tlbiByZWFkaW5nXG5cbiAgLy8gVGhpcyBpcyB0aGUgZnVuY3Rpb24gdGhhdCBpcyBjYWxsZWQgdG8gZmV0Y2ggdGhlIG5leHQgdG9rZW4uIEl0XG4gIC8vIGlzIHNvbWV3aGF0IG9ic2N1cmUsIGJlY2F1c2UgaXQgd29ya3MgaW4gY2hhcmFjdGVyIGNvZGVzIHJhdGhlclxuICAvLyB0aGFuIGNoYXJhY3RlcnMsIGFuZCBiZWNhdXNlIG9wZXJhdG9yIHBhcnNpbmcgaGFzIGJlZW4gaW5saW5lZFxuICAvLyBpbnRvIGl0LlxuICAvL1xuICAvLyBBbGwgaW4gdGhlIG5hbWUgb2Ygc3BlZWQuXG4gIC8vXG4gIC8vIFRoZSBgZm9yY2VSZWdleHBgIHBhcmFtZXRlciBpcyB1c2VkIGluIHRoZSBvbmUgY2FzZSB3aGVyZSB0aGVcbiAgLy8gYHRva1JlZ2V4cEFsbG93ZWRgIHRyaWNrIGRvZXMgbm90IHdvcmsuIFNlZSBgcGFyc2VTdGF0ZW1lbnRgLlxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9kb3QoKSB7XG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID49IDQ4ICYmIG5leHQgPD0gNTcpIHJldHVybiByZWFkTnVtYmVyKHRydWUpO1xuICAgIHZhciBuZXh0MiA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMik7XG4gICAgaWYgKG9wdGlvbnMuZWNtYVZlcnNpb24gPj0gNiAmJiBuZXh0ID09PSA0NiAmJiBuZXh0MiA9PT0gNDYpIHsgLy8gNDYgPSBkb3QgJy4nXG4gICAgICB0b2tQb3MgKz0gMztcbiAgICAgIHJldHVybiBmaW5pc2hUb2tlbihfZWxsaXBzaXMpO1xuICAgIH0gZWxzZSB7XG4gICAgICArK3Rva1BvcztcbiAgICAgIHJldHVybiBmaW5pc2hUb2tlbihfZG90KTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fc2xhc2goKSB7IC8vICcvJ1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAodG9rUmVnZXhwQWxsb3dlZCkgeysrdG9rUG9zOyByZXR1cm4gcmVhZFJlZ2V4cCgpO31cbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoX3NsYXNoLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9tdWx0X21vZHVsbygpIHsgLy8gJyUqJ1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoX211bHRpcGx5TW9kdWxvLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9waXBlX2FtcChjb2RlKSB7IC8vICd8JidcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IGNvZGUpIHJldHVybiBmaW5pc2hPcChjb2RlID09PSAxMjQgPyBfbG9naWNhbE9SIDogX2xvZ2ljYWxBTkQsIDIpO1xuICAgIGlmIChuZXh0ID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9hc3NpZ24sIDIpO1xuICAgIHJldHVybiBmaW5pc2hPcChjb2RlID09PSAxMjQgPyBfYml0d2lzZU9SIDogX2JpdHdpc2VBTkQsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX2NhcmV0KCkgeyAvLyAnXidcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKF9iaXR3aXNlWE9SLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9wbHVzX21pbihjb2RlKSB7IC8vICcrLSdcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IGNvZGUpIHtcbiAgICAgIGlmIChuZXh0ID09IDQ1ICYmIGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMikgPT0gNjIgJiZcbiAgICAgICAgICBuZXdsaW5lLnRlc3QoaW5wdXQuc2xpY2UobGFzdEVuZCwgdG9rUG9zKSkpIHtcbiAgICAgICAgLy8gQSBgLS0+YCBsaW5lIGNvbW1lbnRcbiAgICAgICAgdG9rUG9zICs9IDM7XG4gICAgICAgIHNraXBMaW5lQ29tbWVudCgpO1xuICAgICAgICBza2lwU3BhY2UoKTtcbiAgICAgICAgcmV0dXJuIHJlYWRUb2tlbigpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGZpbmlzaE9wKF9pbmNEZWMsIDIpO1xuICAgIH1cbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoX3BsdXNNaW4sIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX2x0X2d0KGNvZGUpIHsgLy8gJzw+J1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICB2YXIgc2l6ZSA9IDE7XG4gICAgaWYgKG5leHQgPT09IGNvZGUpIHtcbiAgICAgIHNpemUgPSBjb2RlID09PSA2MiAmJiBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09PSA2MiA/IDMgOiAyO1xuICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgc2l6ZSkgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgc2l6ZSArIDEpO1xuICAgICAgcmV0dXJuIGZpbmlzaE9wKF9iaXRTaGlmdCwgc2l6ZSk7XG4gICAgfVxuICAgIGlmIChuZXh0ID09IDMzICYmIGNvZGUgPT0gNjAgJiYgaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAyKSA9PSA0NSAmJlxuICAgICAgICBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDMpID09IDQ1KSB7XG4gICAgICAvLyBgPCEtLWAsIGFuIFhNTC1zdHlsZSBjb21tZW50IHRoYXQgc2hvdWxkIGJlIGludGVycHJldGVkIGFzIGEgbGluZSBjb21tZW50XG4gICAgICB0b2tQb3MgKz0gNDtcbiAgICAgIHNraXBMaW5lQ29tbWVudCgpO1xuICAgICAgc2tpcFNwYWNlKCk7XG4gICAgICByZXR1cm4gcmVhZFRva2VuKCk7XG4gICAgfVxuICAgIGlmIChuZXh0ID09PSA2MSlcbiAgICAgIHNpemUgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09PSA2MSA/IDMgOiAyO1xuICAgIHJldHVybiBmaW5pc2hPcChfcmVsYXRpb25hbCwgc2l6ZSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fZXFfZXhjbChjb2RlKSB7IC8vICc9ISdcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2VxdWFsaXR5LCBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09PSA2MSA/IDMgOiAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoY29kZSA9PT0gNjEgPyBfZXEgOiBfcHJlZml4LCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFRva2VuRnJvbUNvZGUoY29kZSkge1xuICAgIHN3aXRjaChjb2RlKSB7XG4gICAgICAvLyBUaGUgaW50ZXJwcmV0YXRpb24gb2YgYSBkb3QgZGVwZW5kcyBvbiB3aGV0aGVyIGl0IGlzIGZvbGxvd2VkXG4gICAgICAvLyBieSBhIGRpZ2l0IG9yIGFub3RoZXIgdHdvIGRvdHMuXG4gICAgY2FzZSA0NjogLy8gJy4nXG4gICAgICByZXR1cm4gcmVhZFRva2VuX2RvdCgpO1xuXG4gICAgICAvLyBQdW5jdHVhdGlvbiB0b2tlbnMuXG4gICAgY2FzZSA0MDogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfcGFyZW5MKTtcbiAgICBjYXNlIDQxOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9wYXJlblIpO1xuICAgIGNhc2UgNTk6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX3NlbWkpO1xuICAgIGNhc2UgNDQ6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX2NvbW1hKTtcbiAgICBjYXNlIDkxOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9icmFja2V0TCk7XG4gICAgY2FzZSA5MzogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfYnJhY2tldFIpO1xuICAgIGNhc2UgMTIzOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9icmFjZUwpO1xuICAgIGNhc2UgMTI1OiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9icmFjZVIpO1xuICAgIGNhc2UgNTg6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX2NvbG9uKTtcbiAgICBjYXNlIDYzOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9xdWVzdGlvbik7XG5cbiAgICAgIC8vICcweCcgaXMgYSBoZXhhZGVjaW1hbCBudW1iZXIuXG4gICAgY2FzZSA0ODogLy8gJzAnXG4gICAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgICBpZiAobmV4dCA9PT0gMTIwIHx8IG5leHQgPT09IDg4KSByZXR1cm4gcmVhZEhleE51bWJlcigpO1xuICAgICAgLy8gQW55dGhpbmcgZWxzZSBiZWdpbm5pbmcgd2l0aCBhIGRpZ2l0IGlzIGFuIGludGVnZXIsIG9jdGFsXG4gICAgICAvLyBudW1iZXIsIG9yIGZsb2F0LlxuICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICBjYXNlIDQ5OiBjYXNlIDUwOiBjYXNlIDUxOiBjYXNlIDUyOiBjYXNlIDUzOiBjYXNlIDU0OiBjYXNlIDU1OiBjYXNlIDU2OiBjYXNlIDU3OiAvLyAxLTlcbiAgICAgIHJldHVybiByZWFkTnVtYmVyKGZhbHNlKTtcblxuICAgICAgLy8gUXVvdGVzIHByb2R1Y2Ugc3RyaW5ncy5cbiAgICBjYXNlIDM0OiBjYXNlIDM5OiAvLyAnXCInLCBcIidcIlxuICAgICAgcmV0dXJuIHJlYWRTdHJpbmcoY29kZSk7XG5cbiAgICAvLyBPcGVyYXRvcnMgYXJlIHBhcnNlZCBpbmxpbmUgaW4gdGlueSBzdGF0ZSBtYWNoaW5lcy4gJz0nICg2MSkgaXNcbiAgICAvLyBvZnRlbiByZWZlcnJlZCB0by4gYGZpbmlzaE9wYCBzaW1wbHkgc2tpcHMgdGhlIGFtb3VudCBvZlxuICAgIC8vIGNoYXJhY3RlcnMgaXQgaXMgZ2l2ZW4gYXMgc2Vjb25kIGFyZ3VtZW50LCBhbmQgcmV0dXJucyBhIHRva2VuXG4gICAgLy8gb2YgdGhlIHR5cGUgZ2l2ZW4gYnkgaXRzIGZpcnN0IGFyZ3VtZW50LlxuXG4gICAgY2FzZSA0NzogLy8gJy8nXG4gICAgICByZXR1cm4gcmVhZFRva2VuX3NsYXNoKCk7XG5cbiAgICBjYXNlIDM3OiBjYXNlIDQyOiAvLyAnJSonXG4gICAgICByZXR1cm4gcmVhZFRva2VuX211bHRfbW9kdWxvKCk7XG5cbiAgICBjYXNlIDEyNDogY2FzZSAzODogLy8gJ3wmJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9waXBlX2FtcChjb2RlKTtcblxuICAgIGNhc2UgOTQ6IC8vICdeJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9jYXJldCgpO1xuXG4gICAgY2FzZSA0MzogY2FzZSA0NTogLy8gJystJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9wbHVzX21pbihjb2RlKTtcblxuICAgIGNhc2UgNjA6IGNhc2UgNjI6IC8vICc8PidcbiAgICAgIHJldHVybiByZWFkVG9rZW5fbHRfZ3QoY29kZSk7XG5cbiAgICBjYXNlIDYxOiBjYXNlIDMzOiAvLyAnPSEnXG4gICAgICByZXR1cm4gcmVhZFRva2VuX2VxX2V4Y2woY29kZSk7XG5cbiAgICBjYXNlIDEyNjogLy8gJ34nXG4gICAgICByZXR1cm4gZmluaXNoT3AoX3ByZWZpeCwgMSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuKGZvcmNlUmVnZXhwKSB7XG4gICAgaWYgKCFmb3JjZVJlZ2V4cCkgdG9rU3RhcnQgPSB0b2tQb3M7XG4gICAgZWxzZSB0b2tQb3MgPSB0b2tTdGFydCArIDE7XG4gICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB0b2tTdGFydExvYyA9IG5ldyBQb3NpdGlvbjtcbiAgICBpZiAoZm9yY2VSZWdleHApIHJldHVybiByZWFkUmVnZXhwKCk7XG4gICAgaWYgKHRva1BvcyA+PSBpbnB1dExlbikgcmV0dXJuIGZpbmlzaFRva2VuKF9lb2YpO1xuXG4gICAgdmFyIGNvZGUgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgLy8gSWRlbnRpZmllciBvciBrZXl3b3JkLiAnXFx1WFhYWCcgc2VxdWVuY2VzIGFyZSBhbGxvd2VkIGluXG4gICAgLy8gaWRlbnRpZmllcnMsIHNvICdcXCcgYWxzbyBkaXNwYXRjaGVzIHRvIHRoYXQuXG4gICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGNvZGUpIHx8IGNvZGUgPT09IDkyIC8qICdcXCcgKi8pIHJldHVybiByZWFkV29yZCgpO1xuXG4gICAgdmFyIHRvayA9IGdldFRva2VuRnJvbUNvZGUoY29kZSk7XG5cbiAgICBpZiAodG9rID09PSBmYWxzZSkge1xuICAgICAgLy8gSWYgd2UgYXJlIGhlcmUsIHdlIGVpdGhlciBmb3VuZCBhIG5vbi1BU0NJSSBpZGVudGlmaWVyXG4gICAgICAvLyBjaGFyYWN0ZXIsIG9yIHNvbWV0aGluZyB0aGF0J3MgZW50aXJlbHkgZGlzYWxsb3dlZC5cbiAgICAgIHZhciBjaCA9IFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSk7XG4gICAgICBpZiAoY2ggPT09IFwiXFxcXFwiIHx8IG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0LnRlc3QoY2gpKSByZXR1cm4gcmVhZFdvcmQoKTtcbiAgICAgIHJhaXNlKHRva1BvcywgXCJVbmV4cGVjdGVkIGNoYXJhY3RlciAnXCIgKyBjaCArIFwiJ1wiKTtcbiAgICB9XG4gICAgcmV0dXJuIHRvaztcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmlzaE9wKHR5cGUsIHNpemUpIHtcbiAgICB2YXIgc3RyID0gaW5wdXQuc2xpY2UodG9rUG9zLCB0b2tQb3MgKyBzaXplKTtcbiAgICB0b2tQb3MgKz0gc2l6ZTtcbiAgICBmaW5pc2hUb2tlbih0eXBlLCBzdHIpO1xuICB9XG5cbiAgLy8gUGFyc2UgYSByZWd1bGFyIGV4cHJlc3Npb24uIFNvbWUgY29udGV4dC1hd2FyZW5lc3MgaXMgbmVjZXNzYXJ5LFxuICAvLyBzaW5jZSBhICcvJyBpbnNpZGUgYSAnW10nIHNldCBkb2VzIG5vdCBlbmQgdGhlIGV4cHJlc3Npb24uXG5cbiAgZnVuY3Rpb24gcmVhZFJlZ2V4cCgpIHtcbiAgICB2YXIgY29udGVudCA9IFwiXCIsIGVzY2FwZWQsIGluQ2xhc3MsIHN0YXJ0ID0gdG9rUG9zO1xuICAgIGZvciAoOzspIHtcbiAgICAgIGlmICh0b2tQb3MgPj0gaW5wdXRMZW4pIHJhaXNlKHN0YXJ0LCBcIlVudGVybWluYXRlZCByZWd1bGFyIGV4cHJlc3Npb25cIik7XG4gICAgICB2YXIgY2ggPSBpbnB1dC5jaGFyQXQodG9rUG9zKTtcbiAgICAgIGlmIChuZXdsaW5lLnRlc3QoY2gpKSByYWlzZShzdGFydCwgXCJVbnRlcm1pbmF0ZWQgcmVndWxhciBleHByZXNzaW9uXCIpO1xuICAgICAgaWYgKCFlc2NhcGVkKSB7XG4gICAgICAgIGlmIChjaCA9PT0gXCJbXCIpIGluQ2xhc3MgPSB0cnVlO1xuICAgICAgICBlbHNlIGlmIChjaCA9PT0gXCJdXCIgJiYgaW5DbGFzcykgaW5DbGFzcyA9IGZhbHNlO1xuICAgICAgICBlbHNlIGlmIChjaCA9PT0gXCIvXCIgJiYgIWluQ2xhc3MpIGJyZWFrO1xuICAgICAgICBlc2NhcGVkID0gY2ggPT09IFwiXFxcXFwiO1xuICAgICAgfSBlbHNlIGVzY2FwZWQgPSBmYWxzZTtcbiAgICAgICsrdG9rUG9zO1xuICAgIH1cbiAgICB2YXIgY29udGVudCA9IGlucHV0LnNsaWNlKHN0YXJ0LCB0b2tQb3MpO1xuICAgICsrdG9rUG9zO1xuICAgIC8vIE5lZWQgdG8gdXNlIGByZWFkV29yZDFgIGJlY2F1c2UgJ1xcdVhYWFgnIHNlcXVlbmNlcyBhcmUgYWxsb3dlZFxuICAgIC8vIGhlcmUgKGRvbid0IGFzaykuXG4gICAgdmFyIG1vZHMgPSByZWFkV29yZDEoKTtcbiAgICBpZiAobW9kcyAmJiAhL15bZ21zaXldKiQvLnRlc3QobW9kcykpIHJhaXNlKHN0YXJ0LCBcIkludmFsaWQgcmVndWxhciBleHByZXNzaW9uIGZsYWdcIik7XG4gICAgdHJ5IHtcbiAgICAgIHZhciB2YWx1ZSA9IG5ldyBSZWdFeHAoY29udGVudCwgbW9kcyk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgaWYgKGUgaW5zdGFuY2VvZiBTeW50YXhFcnJvcikgcmFpc2Uoc3RhcnQsIFwiRXJyb3IgcGFyc2luZyByZWd1bGFyIGV4cHJlc3Npb246IFwiICsgZS5tZXNzYWdlKTtcbiAgICAgIHJhaXNlKGUpO1xuICAgIH1cbiAgICByZXR1cm4gZmluaXNoVG9rZW4oX3JlZ2V4cCwgdmFsdWUpO1xuICB9XG5cbiAgLy8gUmVhZCBhbiBpbnRlZ2VyIGluIHRoZSBnaXZlbiByYWRpeC4gUmV0dXJuIG51bGwgaWYgemVybyBkaWdpdHNcbiAgLy8gd2VyZSByZWFkLCB0aGUgaW50ZWdlciB2YWx1ZSBvdGhlcndpc2UuIFdoZW4gYGxlbmAgaXMgZ2l2ZW4sIHRoaXNcbiAgLy8gd2lsbCByZXR1cm4gYG51bGxgIHVubGVzcyB0aGUgaW50ZWdlciBoYXMgZXhhY3RseSBgbGVuYCBkaWdpdHMuXG5cbiAgZnVuY3Rpb24gcmVhZEludChyYWRpeCwgbGVuKSB7XG4gICAgdmFyIHN0YXJ0ID0gdG9rUG9zLCB0b3RhbCA9IDA7XG4gICAgZm9yICh2YXIgaSA9IDAsIGUgPSBsZW4gPT0gbnVsbCA/IEluZmluaXR5IDogbGVuOyBpIDwgZTsgKytpKSB7XG4gICAgICB2YXIgY29kZSA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKSwgdmFsO1xuICAgICAgaWYgKGNvZGUgPj0gOTcpIHZhbCA9IGNvZGUgLSA5NyArIDEwOyAvLyBhXG4gICAgICBlbHNlIGlmIChjb2RlID49IDY1KSB2YWwgPSBjb2RlIC0gNjUgKyAxMDsgLy8gQVxuICAgICAgZWxzZSBpZiAoY29kZSA+PSA0OCAmJiBjb2RlIDw9IDU3KSB2YWwgPSBjb2RlIC0gNDg7IC8vIDAtOVxuICAgICAgZWxzZSB2YWwgPSBJbmZpbml0eTtcbiAgICAgIGlmICh2YWwgPj0gcmFkaXgpIGJyZWFrO1xuICAgICAgKyt0b2tQb3M7XG4gICAgICB0b3RhbCA9IHRvdGFsICogcmFkaXggKyB2YWw7XG4gICAgfVxuICAgIGlmICh0b2tQb3MgPT09IHN0YXJ0IHx8IGxlbiAhPSBudWxsICYmIHRva1BvcyAtIHN0YXJ0ICE9PSBsZW4pIHJldHVybiBudWxsO1xuXG4gICAgcmV0dXJuIHRvdGFsO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZEhleE51bWJlcigpIHtcbiAgICB0b2tQb3MgKz0gMjsgLy8gMHhcbiAgICB2YXIgdmFsID0gcmVhZEludCgxNik7XG4gICAgaWYgKHZhbCA9PSBudWxsKSByYWlzZSh0b2tTdGFydCArIDIsIFwiRXhwZWN0ZWQgaGV4YWRlY2ltYWwgbnVtYmVyXCIpO1xuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykpKSByYWlzZSh0b2tQb3MsIFwiSWRlbnRpZmllciBkaXJlY3RseSBhZnRlciBudW1iZXJcIik7XG4gICAgcmV0dXJuIGZpbmlzaFRva2VuKF9udW0sIHZhbCk7XG4gIH1cblxuICAvLyBSZWFkIGFuIGludGVnZXIsIG9jdGFsIGludGVnZXIsIG9yIGZsb2F0aW5nLXBvaW50IG51bWJlci5cblxuICBmdW5jdGlvbiByZWFkTnVtYmVyKHN0YXJ0c1dpdGhEb3QpIHtcbiAgICB2YXIgc3RhcnQgPSB0b2tQb3MsIGlzRmxvYXQgPSBmYWxzZSwgb2N0YWwgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykgPT09IDQ4O1xuICAgIGlmICghc3RhcnRzV2l0aERvdCAmJiByZWFkSW50KDEwKSA9PT0gbnVsbCkgcmFpc2Uoc3RhcnQsIFwiSW52YWxpZCBudW1iZXJcIik7XG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKSA9PT0gNDYpIHtcbiAgICAgICsrdG9rUG9zO1xuICAgICAgcmVhZEludCgxMCk7XG4gICAgICBpc0Zsb2F0ID0gdHJ1ZTtcbiAgICB9XG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgaWYgKG5leHQgPT09IDY5IHx8IG5leHQgPT09IDEwMSkgeyAvLyAnZUUnXG4gICAgICBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCgrK3Rva1Bvcyk7XG4gICAgICBpZiAobmV4dCA9PT0gNDMgfHwgbmV4dCA9PT0gNDUpICsrdG9rUG9zOyAvLyAnKy0nXG4gICAgICBpZiAocmVhZEludCgxMCkgPT09IG51bGwpIHJhaXNlKHN0YXJ0LCBcIkludmFsaWQgbnVtYmVyXCIpO1xuICAgICAgaXNGbG9hdCA9IHRydWU7XG4gICAgfVxuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykpKSByYWlzZSh0b2tQb3MsIFwiSWRlbnRpZmllciBkaXJlY3RseSBhZnRlciBudW1iZXJcIik7XG5cbiAgICB2YXIgc3RyID0gaW5wdXQuc2xpY2Uoc3RhcnQsIHRva1BvcyksIHZhbDtcbiAgICBpZiAoaXNGbG9hdCkgdmFsID0gcGFyc2VGbG9hdChzdHIpO1xuICAgIGVsc2UgaWYgKCFvY3RhbCB8fCBzdHIubGVuZ3RoID09PSAxKSB2YWwgPSBwYXJzZUludChzdHIsIDEwKTtcbiAgICBlbHNlIGlmICgvWzg5XS8udGVzdChzdHIpIHx8IHN0cmljdCkgcmFpc2Uoc3RhcnQsIFwiSW52YWxpZCBudW1iZXJcIik7XG4gICAgZWxzZSB2YWwgPSBwYXJzZUludChzdHIsIDgpO1xuICAgIHJldHVybiBmaW5pc2hUb2tlbihfbnVtLCB2YWwpO1xuICB9XG5cbiAgLy8gUmVhZCBhIHN0cmluZyB2YWx1ZSwgaW50ZXJwcmV0aW5nIGJhY2tzbGFzaC1lc2NhcGVzLlxuXG4gIGZ1bmN0aW9uIHJlYWRTdHJpbmcocXVvdGUpIHtcbiAgICB0b2tQb3MrKztcbiAgICB2YXIgb3V0ID0gXCJcIjtcbiAgICBmb3IgKDs7KSB7XG4gICAgICBpZiAodG9rUG9zID49IGlucHV0TGVuKSByYWlzZSh0b2tTdGFydCwgXCJVbnRlcm1pbmF0ZWQgc3RyaW5nIGNvbnN0YW50XCIpO1xuICAgICAgdmFyIGNoID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgICAgaWYgKGNoID09PSBxdW90ZSkge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgICAgcmV0dXJuIGZpbmlzaFRva2VuKF9zdHJpbmcsIG91dCk7XG4gICAgICB9XG4gICAgICBpZiAoY2ggPT09IDkyKSB7IC8vICdcXCdcbiAgICAgICAgY2ggPSBpbnB1dC5jaGFyQ29kZUF0KCsrdG9rUG9zKTtcbiAgICAgICAgdmFyIG9jdGFsID0gL15bMC03XSsvLmV4ZWMoaW5wdXQuc2xpY2UodG9rUG9zLCB0b2tQb3MgKyAzKSk7XG4gICAgICAgIGlmIChvY3RhbCkgb2N0YWwgPSBvY3RhbFswXTtcbiAgICAgICAgd2hpbGUgKG9jdGFsICYmIHBhcnNlSW50KG9jdGFsLCA4KSA+IDI1NSkgb2N0YWwgPSBvY3RhbC5zbGljZSgwLCAtMSk7XG4gICAgICAgIGlmIChvY3RhbCA9PT0gXCIwXCIpIG9jdGFsID0gbnVsbDtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIGlmIChvY3RhbCkge1xuICAgICAgICAgIGlmIChzdHJpY3QpIHJhaXNlKHRva1BvcyAtIDIsIFwiT2N0YWwgbGl0ZXJhbCBpbiBzdHJpY3QgbW9kZVwiKTtcbiAgICAgICAgICBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChvY3RhbCwgOCkpO1xuICAgICAgICAgIHRva1BvcyArPSBvY3RhbC5sZW5ndGggLSAxO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN3aXRjaCAoY2gpIHtcbiAgICAgICAgICBjYXNlIDExMDogb3V0ICs9IFwiXFxuXCI7IGJyZWFrOyAvLyAnbicgLT4gJ1xcbidcbiAgICAgICAgICBjYXNlIDExNDogb3V0ICs9IFwiXFxyXCI7IGJyZWFrOyAvLyAncicgLT4gJ1xccidcbiAgICAgICAgICBjYXNlIDEyMDogb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUocmVhZEhleENoYXIoMikpOyBicmVhazsgLy8gJ3gnXG4gICAgICAgICAgY2FzZSAxMTc6IG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHJlYWRIZXhDaGFyKDQpKTsgYnJlYWs7IC8vICd1J1xuICAgICAgICAgIGNhc2UgODU6IG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHJlYWRIZXhDaGFyKDgpKTsgYnJlYWs7IC8vICdVJ1xuICAgICAgICAgIGNhc2UgMTE2OiBvdXQgKz0gXCJcXHRcIjsgYnJlYWs7IC8vICd0JyAtPiAnXFx0J1xuICAgICAgICAgIGNhc2UgOTg6IG91dCArPSBcIlxcYlwiOyBicmVhazsgLy8gJ2InIC0+ICdcXGInXG4gICAgICAgICAgY2FzZSAxMTg6IG91dCArPSBcIlxcdTAwMGJcIjsgYnJlYWs7IC8vICd2JyAtPiAnXFx1MDAwYidcbiAgICAgICAgICBjYXNlIDEwMjogb3V0ICs9IFwiXFxmXCI7IGJyZWFrOyAvLyAnZicgLT4gJ1xcZidcbiAgICAgICAgICBjYXNlIDQ4OiBvdXQgKz0gXCJcXDBcIjsgYnJlYWs7IC8vIDAgLT4gJ1xcMCdcbiAgICAgICAgICBjYXNlIDEzOiBpZiAoaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpID09PSAxMCkgKyt0b2tQb3M7IC8vICdcXHJcXG4nXG4gICAgICAgICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgICAgICAgIGNhc2UgMTA6IC8vICcgXFxuJ1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7IHRva0xpbmVTdGFydCA9IHRva1BvczsgKyt0b2tDdXJMaW5lOyB9XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OiBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7IGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGNoID09PSAxMyB8fCBjaCA9PT0gMTAgfHwgY2ggPT09IDgyMzIgfHwgY2ggPT09IDgyMzMpIHJhaXNlKHRva1N0YXJ0LCBcIlVudGVybWluYXRlZCBzdHJpbmcgY29uc3RhbnRcIik7XG4gICAgICAgIG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKTsgLy8gJ1xcJ1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBVc2VkIHRvIHJlYWQgY2hhcmFjdGVyIGVzY2FwZSBzZXF1ZW5jZXMgKCdcXHgnLCAnXFx1JywgJ1xcVScpLlxuXG4gIGZ1bmN0aW9uIHJlYWRIZXhDaGFyKGxlbikge1xuICAgIHZhciBuID0gcmVhZEludCgxNiwgbGVuKTtcbiAgICBpZiAobiA9PT0gbnVsbCkgcmFpc2UodG9rU3RhcnQsIFwiQmFkIGNoYXJhY3RlciBlc2NhcGUgc2VxdWVuY2VcIik7XG4gICAgcmV0dXJuIG47XG4gIH1cblxuICAvLyBVc2VkIHRvIHNpZ25hbCB0byBjYWxsZXJzIG9mIGByZWFkV29yZDFgIHdoZXRoZXIgdGhlIHdvcmRcbiAgLy8gY29udGFpbmVkIGFueSBlc2NhcGUgc2VxdWVuY2VzLiBUaGlzIGlzIG5lZWRlZCBiZWNhdXNlIHdvcmRzIHdpdGhcbiAgLy8gZXNjYXBlIHNlcXVlbmNlcyBtdXN0IG5vdCBiZSBpbnRlcnByZXRlZCBhcyBrZXl3b3Jkcy5cblxuICB2YXIgY29udGFpbnNFc2M7XG5cbiAgLy8gUmVhZCBhbiBpZGVudGlmaWVyLCBhbmQgcmV0dXJuIGl0IGFzIGEgc3RyaW5nLiBTZXRzIGBjb250YWluc0VzY2BcbiAgLy8gdG8gd2hldGhlciB0aGUgd29yZCBjb250YWluZWQgYSAnXFx1JyBlc2NhcGUuXG4gIC8vXG4gIC8vIE9ubHkgYnVpbGRzIHVwIHRoZSB3b3JkIGNoYXJhY3Rlci1ieS1jaGFyYWN0ZXIgd2hlbiBpdCBhY3R1YWxseVxuICAvLyBjb250YWluZWRzIGFuIGVzY2FwZSwgYXMgYSBtaWNyby1vcHRpbWl6YXRpb24uXG5cbiAgZnVuY3Rpb24gcmVhZFdvcmQxKCkge1xuICAgIGNvbnRhaW5zRXNjID0gZmFsc2U7XG4gICAgdmFyIHdvcmQsIGZpcnN0ID0gdHJ1ZSwgc3RhcnQgPSB0b2tQb3M7XG4gICAgZm9yICg7Oykge1xuICAgICAgdmFyIGNoID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgICAgaWYgKGlzSWRlbnRpZmllckNoYXIoY2gpKSB7XG4gICAgICAgIGlmIChjb250YWluc0VzYykgd29yZCArPSBpbnB1dC5jaGFyQXQodG9rUG9zKTtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSA5MikgeyAvLyBcIlxcXCJcbiAgICAgICAgaWYgKCFjb250YWluc0VzYykgd29yZCA9IGlucHV0LnNsaWNlKHN0YXJ0LCB0b2tQb3MpO1xuICAgICAgICBjb250YWluc0VzYyA9IHRydWU7XG4gICAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KCsrdG9rUG9zKSAhPSAxMTcpIC8vIFwidVwiXG4gICAgICAgICAgcmFpc2UodG9rUG9zLCBcIkV4cGVjdGluZyBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZSBcXFxcdVhYWFhcIik7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgICB2YXIgZXNjID0gcmVhZEhleENoYXIoNCk7XG4gICAgICAgIHZhciBlc2NTdHIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGVzYyk7XG4gICAgICAgIGlmICghZXNjU3RyKSByYWlzZSh0b2tQb3MgLSAxLCBcIkludmFsaWQgVW5pY29kZSBlc2NhcGVcIik7XG4gICAgICAgIGlmICghKGZpcnN0ID8gaXNJZGVudGlmaWVyU3RhcnQoZXNjKSA6IGlzSWRlbnRpZmllckNoYXIoZXNjKSkpXG4gICAgICAgICAgcmFpc2UodG9rUG9zIC0gNCwgXCJJbnZhbGlkIFVuaWNvZGUgZXNjYXBlXCIpO1xuICAgICAgICB3b3JkICs9IGVzY1N0cjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgZmlyc3QgPSBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIGNvbnRhaW5zRXNjID8gd29yZCA6IGlucHV0LnNsaWNlKHN0YXJ0LCB0b2tQb3MpO1xuICB9XG5cbiAgLy8gUmVhZCBhbiBpZGVudGlmaWVyIG9yIGtleXdvcmQgdG9rZW4uIFdpbGwgY2hlY2sgZm9yIHJlc2VydmVkXG4gIC8vIHdvcmRzIHdoZW4gbmVjZXNzYXJ5LlxuXG4gIGZ1bmN0aW9uIHJlYWRXb3JkKCkge1xuICAgIHZhciB3b3JkID0gcmVhZFdvcmQxKCk7XG4gICAgdmFyIHR5cGUgPSBfbmFtZTtcbiAgICBpZiAoIWNvbnRhaW5zRXNjICYmIGlzS2V5d29yZCh3b3JkKSlcbiAgICAgIHR5cGUgPSBrZXl3b3JkVHlwZXNbd29yZF07XG4gICAgcmV0dXJuIGZpbmlzaFRva2VuKHR5cGUsIHdvcmQpO1xuICB9XG5cblxuZXhwb3J0IGRlZmF1bHQgeyB0b2tlbml6ZTogZXhwb3J0cy50b2tlbml6ZSB9OyIsIi8vIFJlYm91bmQgSG9va3Ncbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IExhenlWYWx1ZSBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvbGF6eS12YWx1ZVwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5pbXBvcnQgaGVscGVycyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaGVscGVyc1wiO1xuXG52YXIgaG9va3MgPSB7fSxcbiAgICBhdHRyaWJ1dGVzID0geyAgYWJicjogMSwgICAgICBcImFjY2VwdC1jaGFyc2V0XCI6IDEsICAgYWNjZXB0OiAxLCAgICAgIGFjY2Vzc2tleTogMSwgICAgIGFjdGlvbjogMSxcbiAgICAgICAgICAgICAgICAgICAgYWxpZ246IDEsICAgICAgYWxpbms6IDEsICAgICAgICAgICAgIGFsdDogMSwgICAgICAgICBhcmNoaXZlOiAxLCAgICAgICBheGlzOiAxLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAxLCBiZ2NvbG9yOiAxLCAgICAgICAgICAgYm9yZGVyOiAxLCAgICAgIGNlbGxwYWRkaW5nOiAxLCAgIGNlbGxzcGFjaW5nOiAxLFxuICAgICAgICAgICAgICAgICAgICBjaGFyOiAxLCAgICAgICBjaGFyb2ZmOiAxLCAgICAgICAgICAgY2hhcnNldDogMSwgICAgIGNoZWNrZWQ6IDEsICAgICAgIGNpdGU6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzOiAxLCAgICAgIGNsYXNzaWQ6IDEsICAgICAgICAgICBjbGVhcjogMSwgICAgICAgY29kZTogMSwgICAgICAgICAgY29kZWJhc2U6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNvZGV0eXBlOiAxLCAgIGNvbG9yOiAxLCAgICAgICAgICAgICBjb2xzOiAxLCAgICAgICAgY29sc3BhbjogMSwgICAgICAgY29tcGFjdDogMSxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogMSwgICAgY29vcmRzOiAxLCAgICAgICAgICAgIGRhdGE6IDEsICAgICAgICBkYXRldGltZTogMSwgICAgICBkZWNsYXJlOiAxLFxuICAgICAgICAgICAgICAgICAgICBkZWZlcjogMSwgICAgICBkaXI6IDEsICAgICAgICAgICAgICAgZGlzYWJsZWQ6IDEsICAgIGVuY3R5cGU6IDEsICAgICAgIGZhY2U6IDEsXG4gICAgICAgICAgICAgICAgICAgIGZvcjogMSwgICAgICAgIGZyYW1lOiAxLCAgICAgICAgICAgICBmcmFtZWJvcmRlcjogMSwgaGVhZGVyczogMSwgICAgICAgaGVpZ2h0OiAxLFxuICAgICAgICAgICAgICAgICAgICBocmVmOiAxLCAgICAgICBocmVmbGFuZzogMSwgICAgICAgICAgaHNwYWNlOiAxLCAgICAgXCJodHRwLWVxdWl2XCI6IDEsICAgaWQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIGlzbWFwOiAxLCAgICAgIGxhYmVsOiAxLCAgICAgICAgICAgICBsYW5nOiAxLCAgICAgICAgbGFuZ3VhZ2U6IDEsICAgICAgbGluazogMSxcbiAgICAgICAgICAgICAgICAgICAgbG9uZ2Rlc2M6IDEsICAgbWFyZ2luaGVpZ2h0OiAxLCAgICAgIG1hcmdpbndpZHRoOiAxLCBtYXhsZW5ndGg6IDEsICAgICBtZWRpYTogMSxcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAxLCAgICAgbXVsdGlwbGU6IDEsICAgICAgICAgIG5hbWU6IDEsICAgICAgICBub2hyZWY6IDEsICAgICAgICBub3Jlc2l6ZTogMSxcbiAgICAgICAgICAgICAgICAgICAgbm9zaGFkZTogMSwgICAgbm93cmFwOiAxLCAgICAgICAgICAgIG9iamVjdDogMSwgICAgICBvbmJsdXI6IDEsICAgICAgICBvbmNoYW5nZTogMSxcbiAgICAgICAgICAgICAgICAgICAgb25jbGljazogMSwgICAgb25kYmxjbGljazogMSwgICAgICAgIG9uZm9jdXM6IDEsICAgICBvbmtleWRvd246IDEsICAgICBvbmtleXByZXNzOiAxLFxuICAgICAgICAgICAgICAgICAgICBvbmtleXVwOiAxLCAgICBvbmxvYWQ6IDEsICAgICAgICAgICAgb25tb3VzZWRvd246IDEsIG9ubW91c2Vtb3ZlOiAxLCAgIG9ubW91c2VvdXQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIG9ubW91c2VvdmVyOiAxLG9ubW91c2V1cDogMSwgICAgICAgICBvbnJlc2V0OiAxLCAgICAgb25zZWxlY3Q6IDEsICAgICAgb25zdWJtaXQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIG9udW5sb2FkOiAxLCAgIHByb2ZpbGU6IDEsICAgICAgICAgICBwcm9tcHQ6IDEsICAgICAgcmVhZG9ubHk6IDEsICAgICAgcmVsOiAxLFxuICAgICAgICAgICAgICAgICAgICByZXY6IDEsICAgICAgICByb3dzOiAxLCAgICAgICAgICAgICAgcm93c3BhbjogMSwgICAgIHJ1bGVzOiAxLCAgICAgICAgIHNjaGVtZTogMSxcbiAgICAgICAgICAgICAgICAgICAgc2NvcGU6IDEsICAgICAgc2Nyb2xsaW5nOiAxLCAgICAgICAgIHNlbGVjdGVkOiAxLCAgICBzaGFwZTogMSwgICAgICAgICBzaXplOiAxLFxuICAgICAgICAgICAgICAgICAgICBzcGFuOiAxLCAgICAgICBzcmM6IDEsICAgICAgICAgICAgICAgc3RhbmRieTogMSwgICAgIHN0YXJ0OiAxLCAgICAgICAgIHN0eWxlOiAxLFxuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiAxLCAgICB0YWJpbmRleDogMSwgICAgICAgICAgdGFyZ2V0OiAxLCAgICAgIHRleHQ6IDEsICAgICAgICAgIHRpdGxlOiAxLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAxLCAgICAgICB1c2VtYXA6IDEsICAgICAgICAgICAgdmFsaWduOiAxLCAgICAgIHZhbHVlOiAxLCAgICAgICAgIHZhbHVldHlwZTogMSxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogMSwgICAgdmxpbms6IDEsICAgICAgICAgICAgIHZzcGFjZTogMSwgICAgICB3aWR0aDogMSAgfTtcblxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBIb29rIFV0aWxzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLy8gR2l2ZW4gYW4gb2JqZWN0IChjb250ZXh0KSBhbmQgYSBwYXRoLCBjcmVhdGUgYSBMYXp5VmFsdWUgb2JqZWN0IHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2Ygb2JqZWN0IGF0IGNvbnRleHQgYW5kIGFkZCBpdCBhcyBhbiBvYnNlcnZlciBvZiB0aGUgY29udGV4dC5cbmZ1bmN0aW9uIHN0cmVhbVByb3BlcnR5KGNvbnRleHQsIHBhdGgpIHtcblxuICAvLyBMYXp5IHZhbHVlIHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2YgY29udGV4dC5wYXRoXG4gIHZhciBsYXp5VmFsdWUgPSBuZXcgTGF6eVZhbHVlKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBjb250ZXh0LmdldChwYXRoKTtcbiAgfSwge2NvbnRleHQ6IGNvbnRleHR9KTtcblxuICAvLyBTYXZlIG91ciBwYXRoIHNvIHBhcmVudCBsYXp5dmFsdWVzIGNhbiBrbm93IHRoZSBkYXRhIHZhciBvciBoZWxwZXIgdGhleSBhcmUgZ2V0dGluZyBpbmZvIGZyb21cbiAgbGF6eVZhbHVlLnBhdGggPSBwYXRoO1xuXG4gIC8vIFNhdmUgdGhlIG9ic2VydmVyIGF0IHRoaXMgcGF0aFxuICBsYXp5VmFsdWUuYWRkT2JzZXJ2ZXIocGF0aCwgY29udGV4dCk7XG5cbiAgcmV0dXJuIGxhenlWYWx1ZTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0SGVscGVyKGVsLCBwYXRoLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudiwgaGVscGVyKSB7XG4gIHZhciBsYXp5VmFsdWU7XG5cbiAgLy8gRXh0ZW5kIG9wdGlvbnMgd2l0aCB0aGUgaGVscGVyJ3MgY29udGFpbmVpbmcgTW9ycGggZWxlbWVudC4gVXNlZCBieSBzdHJlYW1pZnkgdG8gdHJhY2sgZGF0YSBvYnNlcnZlcnNcbiAgb3B0aW9ucy5tb3JwaCA9IG9wdGlvbnMucGxhY2Vob2xkZXIgPSBlbCAmJiAhZWwudGFnTmFtZSAmJiBlbCB8fCBmYWxzZTsgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5lbGVtZW50ID0gZWwgJiYgZWwudGFnTmFtZSAmJiBlbCB8fCBmYWxzZTsgICAgICAvLyBGSVhNRTogdGhpcyBraW5kYSBzdWNrc1xuXG4gIC8vIEV4dGVuZCBvcHRpb25zIHdpdGggaG9va3MgYW5kIGhlbHBlcnMgZm9yIGFueSBzdWJzZXF1ZW50IGNhbGxzIGZyb20gYSBsYXp5dmFsdWVcbiAgb3B0aW9ucy5wYXJhbXMgPSBwYXJhbXM7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5ob29rcyA9IGVudi5ob29rczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5oZWxwZXJzID0gZW52LmhlbHBlcnM7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5jb250ZXh0ID0gY29udGV4dDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5kb20gPSBlbnYuZG9tOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5wYXRoID0gcGF0aDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5oYXNoID0gaGFzaCB8fCBbXTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcblxuICAvLyBDcmVhdGUgYSBsYXp5IHZhbHVlIHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2Ygb3VyIGV2YWx1YXRlZCBoZWxwZXIuXG4gIG9wdGlvbnMubGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpIHtcbiAgICB2YXIgcGxhaW5QYXJhbXMgPSBbXSxcbiAgICAgICAgcGxhaW5IYXNoID0ge30sXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgcmVscGF0aCA9ICQuc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgICBmaXJzdCwgcmVzdDtcbiAgICAgICAgcmVscGF0aC5zaGlmdCgpO1xuICAgICAgICByZWxwYXRoID0gcmVscGF0aC5qb2luKCcuJyk7XG5cbiAgICAgICAgcmVzdCA9ICQuc3BsaXRQYXRoKHJlbHBhdGgpO1xuICAgICAgICBmaXJzdCA9IHJlc3Quc2hpZnQoKTtcbiAgICAgICAgcmVzdCA9IHJlc3Quam9pbignLicpO1xuXG4gICAgLy8gQXNzZW1ibGUgb3VyIGFyZ3MgYW5kIGhhc2ggdmFyaWFibGVzLiBGb3IgZWFjaCBsYXp5dmFsdWUgcGFyYW0sIHB1c2ggdGhlIGxhenlWYWx1ZSdzIHZhbHVlIHNvIGhlbHBlcnMgd2l0aCBubyBjb25jZXB0IG9mIGxhenl2YWx1ZXMuXG4gICAgXy5lYWNoKHBhcmFtcywgZnVuY3Rpb24ocGFyYW0sIGluZGV4KXtcbiAgICAgIHBsYWluUGFyYW1zLnB1c2goKCAocGFyYW0gJiYgcGFyYW0uaXNMYXp5VmFsdWUpID8gcGFyYW0udmFsdWUoKSA6IHBhcmFtICkpO1xuICAgIH0pO1xuICAgIF8uZWFjaChoYXNoLCBmdW5jdGlvbihoYXNoLCBrZXkpe1xuICAgICAgcGxhaW5IYXNoW2tleV0gPSAoaGFzaCAmJiBoYXNoLmlzTGF6eVZhbHVlKSA/IGhhc2gudmFsdWUoKSA6IGhhc2g7XG4gICAgfSk7XG5cbiAgICAvLyBDYWxsIG91ciBoZWxwZXIgZnVuY3Rpb25zIHdpdGggb3VyIGFzc2VtYmxlZCBhcmdzLlxuICAgIHJlc3VsdCA9IGhlbHBlci5hcHBseSgoY29udGV4dC5fX3Jvb3RfXyB8fCBjb250ZXh0KSwgW3BsYWluUGFyYW1zLCBwbGFpbkhhc2gsIG9wdGlvbnMsIGVudl0pO1xuXG4gICAgaWYocmVzdWx0ICYmIHJlbHBhdGgpe1xuICAgICAgcmV0dXJuIHJlc3VsdC5nZXQocmVscGF0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSwge21vcnBoOiBvcHRpb25zLm1vcnBofSk7XG5cbiAgb3B0aW9ucy5sYXp5VmFsdWUucGF0aCA9IHBhdGg7XG5cbiAgLy8gRm9yIGVhY2ggcGFyYW0gcGFzc2VkIHRvIG91ciBoZWxwZXIsIGFkZCBpdCB0byBvdXIgaGVscGVyJ3MgZGVwZW5kYW50IGxpc3QuIEhlbHBlciB3aWxsIHJlLWV2YWx1YXRlIHdoZW4gb25lIGNoYW5nZXMuXG4gIHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBpZiAobm9kZSAmJiBub2RlLmlzTGF6eVZhbHVlKSB7XG4gICAgICBvcHRpb25zLmxhenlWYWx1ZS5hZGREZXBlbmRlbnRWYWx1ZShub2RlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvcHRpb25zLmxhenlWYWx1ZTtcbn1cblxuLy8gR2l2ZW4gYSByb290IGVsZW1lbnQsIGNsZWFucyBhbGwgb2YgdGhlIG1vcnBoIGxhenlWYWx1ZXMgZm9yIGEgZ2l2ZW4gc3VidHJlZVxuZnVuY3Rpb24gY2xlYW5TdWJ0cmVlKG11dGF0aW9ucywgb2JzZXJ2ZXIpe1xuICAvLyBGb3IgZWFjaCBtdXRhdGlvbiBvYnNlcnZlZCwgaWYgdGhlcmUgYXJlIG5vZGVzIHJlbW92ZWQsIGRlc3Ryb3kgYWxsIGFzc29jaWF0ZWQgbGF6eVZhbHVlc1xuICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihtdXRhdGlvbikge1xuICAgIGlmKG11dGF0aW9uLnJlbW92ZWROb2Rlcyl7XG4gICAgICBfLmVhY2gobXV0YXRpb24ucmVtb3ZlZE5vZGVzLCBmdW5jdGlvbihub2RlLCBpbmRleCl7XG4gICAgICAgICQobm9kZSkud2Fsa1RoZURPTShmdW5jdGlvbihuKXtcbiAgICAgICAgICBpZihuLl9fbGF6eVZhbHVlICYmIG4uX19sYXp5VmFsdWUuZGVzdHJveSgpKXtcbiAgICAgICAgICAgIG4uX19sYXp5VmFsdWUuZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgc3VidHJlZU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY2xlYW5TdWJ0cmVlKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRGVmYXVsdCBIb29rc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmhvb2tzLmdldCA9IGZ1bmN0aW9uIGdldChlbnYsIGNvbnRleHQsIHBhdGgpe1xuICBjb250ZXh0LmJsb2NrUGFyYW1zIHx8IChjb250ZXh0LmJsb2NrUGFyYW1zID0ge30pO1xuICBpZihwYXRoID09PSAndGhpcycpeyBwYXRoID0gJyc7IH1cbiAgLy8gY29udGV4dCA9IChjb250ZXh0LmJsb2NrUGFyYW1zLmhhcyhwYXRoKSkgPyBjb250ZXh0LmJsb2NrUGFyYW1zIDogY29udGV4dDtcbiAgcmV0dXJuIHN0cmVhbVByb3BlcnR5KGNvbnRleHQsIHBhdGgpO1xufTtcblxuaG9va3Muc2V0ID0gZnVuY3Rpb24gc2V0KGVudiwgY29udGV4dCwgbmFtZSwgdmFsdWUpe1xuICBjb250ZXh0LmJsb2NrUGFyYW1zIHx8IChjb250ZXh0LmJsb2NrUGFyYW1zID0ge30pO1xuICAvLyBjb250ZXh0LmJsb2NrUGFyYW1zLnNldChuYW1lLCB2YWx1ZSk7XG59O1xuXG5cbmhvb2tzLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdChlbnYsIHBhcmFtcykge1xuXG4gIGlmKHBhcmFtcy5sZW5ndGggPT09IDEpe1xuICAgIHJldHVybiBwYXJhbXNbMF07XG4gIH1cblxuICB2YXIgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSBcIlwiO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJhbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YWx1ZSArPSAocGFyYW1zW2ldLmlzTGF6eVZhbHVlKSA/IHBhcmFtc1tpXS52YWx1ZSgpIDogcGFyYW1zW2ldO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfSwge2NvbnRleHQ6IHBhcmFtc1swXS5jb250ZXh0fSk7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJhbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYocGFyYW1zW2ldLmlzTGF6eVZhbHVlKSB7XG4gICAgICBsYXp5VmFsdWUuYWRkRGVwZW5kZW50VmFsdWUocGFyYW1zW2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbGF6eVZhbHVlO1xuXG59O1xuXG5ob29rcy5zdWJleHByID0gZnVuY3Rpb24gc3ViZXhwcihlbnYsIGNvbnRleHQsIGhlbHBlck5hbWUsIHBhcmFtcywgaGFzaCkge1xuXG4gIHZhciBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihoZWxwZXJOYW1lLCBlbnYsIGNvbnRleHQpLFxuICBsYXp5VmFsdWU7XG5cbiAgaWYgKGhlbHBlcikge1xuICAgIC8vIEFic3RyYWN0cyBvdXIgaGVscGVyIHRvIHByb3ZpZGUgYSBoYW5kbGViYXJzIHR5cGUgaW50ZXJmYWNlLiBDb25zdHJ1Y3RzIG91ciBMYXp5VmFsdWUuXG4gICAgbGF6eVZhbHVlID0gY29uc3RydWN0SGVscGVyKGZhbHNlLCBoZWxwZXJOYW1lLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIHt9LCBlbnYsIGhlbHBlcik7XG4gIH0gZWxzZSB7XG4gICAgbGF6eVZhbHVlID0gc3RyZWFtUHJvcGVydHkoY29udGV4dCwgaGVscGVyTmFtZSk7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHBhcmFtcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZihwYXJhbXNbaV0uaXNMYXp5VmFsdWUpIHtcbiAgICAgIGxhenlWYWx1ZS5hZGREZXBlbmRlbnRWYWx1ZShwYXJhbXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsYXp5VmFsdWU7XG59O1xuXG5ob29rcy5ibG9jayA9IGZ1bmN0aW9uIGJsb2NrKGVudiwgbW9ycGgsIGNvbnRleHQsIHBhdGgsIHBhcmFtcywgaGFzaCwgdGVtcGxhdGUsIGludmVyc2Upe1xuICB2YXIgb3B0aW9ucyA9IHtcbiAgICBtb3JwaDogbW9ycGgsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgIGludmVyc2U6IGludmVyc2VcbiAgfTtcblxuICB2YXIgbGF6eVZhbHVlLFxuICB2YWx1ZSxcbiAgb2JzZXJ2ZXIgPSBzdWJ0cmVlT2JzZXJ2ZXIsXG4gIGhlbHBlciA9IGhlbHBlcnMubG9va3VwSGVscGVyKHBhdGgsIGVudiwgY29udGV4dCk7XG5cbiAgaWYoIV8uaXNGdW5jdGlvbihoZWxwZXIpKXtcbiAgICByZXR1cm4gY29uc29sZS5lcnJvcihwYXRoICsgJyBpcyBub3QgYSB2YWxpZCBoZWxwZXIhJyk7XG4gIH1cblxuICAvLyBBYnN0cmFjdHMgb3VyIGhlbHBlciB0byBwcm92aWRlIGEgaGFuZGxlYmFycyB0eXBlIGludGVyZmFjZS4gQ29uc3RydWN0cyBvdXIgTGF6eVZhbHVlLlxuICBsYXp5VmFsdWUgPSBjb25zdHJ1Y3RIZWxwZXIobW9ycGgsIHBhdGgsIGNvbnRleHQsIHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52LCBoZWxwZXIpO1xuXG4gIC8vIElmIHdlIGhhdmUgb3VyIGxhenkgdmFsdWUsIHVwZGF0ZSBvdXIgZG9tLlxuICAvLyBtb3JwaCBpcyBhIG1vcnBoIGVsZW1lbnQgcmVwcmVzZW50aW5nIG91ciBkb20gbm9kZVxuICBpZiAobGF6eVZhbHVlKSB7XG4gICAgbGF6eVZhbHVlLm9uTm90aWZ5KGZ1bmN0aW9uKGxhenlWYWx1ZSkge1xuICAgICAgdmFyIHZhbCA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuICAgICAgdmFsID0gKF8uaXNVbmRlZmluZWQodmFsKSkgPyAnJyA6IHZhbDtcbiAgICAgIGlmKCFfLmlzTnVsbCh2YWwpKXtcbiAgICAgICAgbW9ycGguc2V0Q29udGVudCh2YWwpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFsdWUgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICB2YWx1ZSA9IChfLmlzVW5kZWZpbmVkKHZhbHVlKSkgPyAnJyA6IHZhbHVlO1xuICAgIGlmKCFfLmlzTnVsbCh2YWx1ZSkpeyBtb3JwaC5hcHBlbmQodmFsdWUpOyB9XG5cbiAgICAgIC8vIE9ic2VydmUgdGhpcyBjb250ZW50IG1vcnBoJ3MgcGFyZW50J3MgY2hpbGRyZW4uXG4gICAgICAvLyBXaGVuIHRoZSBtb3JwaCBlbGVtZW50J3MgY29udGFpbmluZyBlbGVtZW50IChtb3JwaCkgaXMgcmVtb3ZlZCwgY2xlYW4gdXAgdGhlIGxhenl2YWx1ZS5cbiAgICAgIC8vIFRpbWVvdXQgZGVsYXkgaGFjayB0byBnaXZlIG91dCBkb20gYSBjaGFuZ2UgdG8gZ2V0IHRoZWlyIHBhcmVudFxuICAgICAgaWYobW9ycGguX3BhcmVudCl7XG4gICAgICAgIG1vcnBoLl9wYXJlbnQuX19sYXp5VmFsdWUgPSBsYXp5VmFsdWU7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICBpZihtb3JwaC5jb250ZXh0dWFsRWxlbWVudCl7XG4gICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKG1vcnBoLmNvbnRleHR1YWxFbGVtZW50LCB7IGF0dHJpYnV0ZXM6IGZhbHNlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgMCk7XG4gICAgICB9XG5cbiAgICB9XG5cbn07XG5cbmhvb2tzLmlubGluZSA9IGZ1bmN0aW9uIGlubGluZShlbnYsIG1vcnBoLCBjb250ZXh0LCBwYXRoLCBwYXJhbXMsIGhhc2gpIHtcblxuICB2YXIgbGF6eVZhbHVlLFxuICB2YWx1ZSxcbiAgb2JzZXJ2ZXIgPSBzdWJ0cmVlT2JzZXJ2ZXIsXG4gIGhlbHBlciA9IGhlbHBlcnMubG9va3VwSGVscGVyKHBhdGgsIGVudiwgY29udGV4dCk7XG5cbiAgaWYoIV8uaXNGdW5jdGlvbihoZWxwZXIpKXtcbiAgICByZXR1cm4gY29uc29sZS5lcnJvcihwYXRoICsgJyBpcyBub3QgYSB2YWxpZCBoZWxwZXIhJyk7XG4gIH1cblxuICAvLyBBYnN0cmFjdHMgb3VyIGhlbHBlciB0byBwcm92aWRlIGEgaGFuZGxlYmFycyB0eXBlIGludGVyZmFjZS4gQ29uc3RydWN0cyBvdXIgTGF6eVZhbHVlLlxuICBsYXp5VmFsdWUgPSBjb25zdHJ1Y3RIZWxwZXIobW9ycGgsIHBhdGgsIGNvbnRleHQsIHBhcmFtcywgaGFzaCwge30sIGVudiwgaGVscGVyKTtcblxuICAvLyBJZiB3ZSBoYXZlIG91ciBsYXp5IHZhbHVlLCB1cGRhdGUgb3VyIGRvbS5cbiAgLy8gbW9ycGggaXMgYSBtb3JwaCBlbGVtZW50IHJlcHJlc2VudGluZyBvdXIgZG9tIG5vZGVcbiAgaWYgKGxhenlWYWx1ZSkge1xuICAgIGxhenlWYWx1ZS5vbk5vdGlmeShmdW5jdGlvbihsYXp5VmFsdWUpIHtcbiAgICAgIHZhciB2YWwgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICAgIHZhbCA9IChfLmlzVW5kZWZpbmVkKHZhbCkpID8gJycgOiB2YWw7XG4gICAgICBpZighXy5pc051bGwodmFsKSl7XG4gICAgICAgIG1vcnBoLnNldENvbnRlbnQodmFsKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHZhbHVlID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgdmFsdWUgPSAoXy5pc1VuZGVmaW5lZCh2YWx1ZSkpID8gJycgOiB2YWx1ZTtcbiAgICBpZighXy5pc051bGwodmFsdWUpKXsgbW9ycGguYXBwZW5kKHZhbHVlKTsgfVxuXG4gICAgICAvLyBPYnNlcnZlIHRoaXMgY29udGVudCBtb3JwaCdzIHBhcmVudCdzIGNoaWxkcmVuLlxuICAgICAgLy8gV2hlbiB0aGUgbW9ycGggZWxlbWVudCdzIGNvbnRhaW5pbmcgZWxlbWVudCAobW9ycGgpIGlzIHJlbW92ZWQsIGNsZWFuIHVwIHRoZSBsYXp5dmFsdWUuXG4gICAgICAvLyBUaW1lb3V0IGRlbGF5IGhhY2sgdG8gZ2l2ZSBvdXQgZG9tIGEgY2hhbmdlIHRvIGdldCB0aGVpciBwYXJlbnRcbiAgICAgIGlmKG1vcnBoLl9wYXJlbnQpe1xuICAgICAgICBtb3JwaC5fcGFyZW50Ll9fbGF6eVZhbHVlID0gbGF6eVZhbHVlO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgaWYobW9ycGguY29udGV4dHVhbEVsZW1lbnQpe1xuICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShtb3JwaC5jb250ZXh0dWFsRWxlbWVudCwgeyBhdHRyaWJ1dGVzOiBmYWxzZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTogdHJ1ZSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDApO1xuICAgICAgfVxuXG4gICAgfVxuICB9O1xuXG5ob29rcy5jb250ZW50ID0gZnVuY3Rpb24gY29udGVudChlbnYsIG1vcnBoLCBjb250ZXh0LCBwYXRoKSB7XG5cbiAgdmFyIGxhenlWYWx1ZSxcbiAgICAgIHZhbHVlLFxuICAgICAgb2JzZXJ2ZXIgPSBzdWJ0cmVlT2JzZXJ2ZXIsXG4gICAgICBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihwYXRoLCBlbnYsIGNvbnRleHQpO1xuXG4gIGxhenlWYWx1ZSA9IHN0cmVhbVByb3BlcnR5KGNvbnRleHQsIHBhdGgpO1xuXG4gIC8vIElmIHdlIGhhdmUgb3VyIGxhenkgdmFsdWUsIHVwZGF0ZSBvdXIgZG9tLlxuICAvLyBtb3JwaCBpcyBhIG1vcnBoIGVsZW1lbnQgcmVwcmVzZW50aW5nIG91ciBkb20gbm9kZVxuICBpZiAobGF6eVZhbHVlKSB7XG4gICAgbGF6eVZhbHVlLm9uTm90aWZ5KGZ1bmN0aW9uKGxhenlWYWx1ZSkge1xuICAgICAgdmFyIHZhbCA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuICAgICAgdmFsID0gKF8uaXNVbmRlZmluZWQodmFsKSkgPyAnJyA6IHZhbDtcbiAgICAgIGlmKCFfLmlzTnVsbCh2YWwpKXtcbiAgICAgICAgbW9ycGguc2V0Q29udGVudCh2YWwpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFsdWUgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICB2YWx1ZSA9IChfLmlzVW5kZWZpbmVkKHZhbHVlKSkgPyAnJyA6IHZhbHVlO1xuICAgIGlmKCFfLmlzTnVsbCh2YWx1ZSkpeyBtb3JwaC5hcHBlbmQodmFsdWUpOyB9XG5cbiAgICAvLyBPYnNlcnZlIHRoaXMgY29udGVudCBtb3JwaCdzIHBhcmVudCdzIGNoaWxkcmVuLlxuICAgIC8vIFdoZW4gdGhlIG1vcnBoIGVsZW1lbnQncyBjb250YWluaW5nIGVsZW1lbnQgKG1vcnBoKSBpcyByZW1vdmVkLCBjbGVhbiB1cCB0aGUgbGF6eXZhbHVlLlxuICAgIC8vIFRpbWVvdXQgZGVsYXkgaGFjayB0byBnaXZlIG91dCBkb20gYSBjaGFuZ2UgdG8gZ2V0IHRoZWlyIHBhcmVudFxuICAgIGlmKG1vcnBoLl9wYXJlbnQpe1xuICAgICAgbW9ycGguX3BhcmVudC5fX2xhenlWYWx1ZSA9IGxhenlWYWx1ZTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgaWYobW9ycGguY29udGV4dHVhbEVsZW1lbnQpe1xuICAgICAgICAgIG9ic2VydmVyLm9ic2VydmUobW9ycGguY29udGV4dHVhbEVsZW1lbnQsIHsgYXR0cmlidXRlczogZmFsc2UsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sIDApO1xuICAgIH1cblxuICB9XG59O1xuXG4vLyBIYW5kbGUgbW9ycGhzIGluIGVsZW1lbnQgdGFnc1xuLy8gVE9ETzogaGFuZGxlIGR5bmFtaWMgYXR0cmlidXRlIG5hbWVzP1xuaG9va3MuZWxlbWVudCA9IGZ1bmN0aW9uIGVsZW1lbnQoZW52LCBkb21FbGVtZW50LCBjb250ZXh0LCBwYXRoLCBwYXJhbXMsIGhhc2gpIHtcbiAgdmFyIGhlbHBlciA9IGhlbHBlcnMubG9va3VwSGVscGVyKHBhdGgsIGVudiwgY29udGV4dCksXG4gICAgICBsYXp5VmFsdWUsXG4gICAgICB2YWx1ZTtcblxuICBpZiAoaGVscGVyKSB7XG4gICAgLy8gQWJzdHJhY3RzIG91ciBoZWxwZXIgdG8gcHJvdmlkZSBhIGhhbmRsZWJhcnMgdHlwZSBpbnRlcmZhY2UuIENvbnN0cnVjdHMgb3VyIExhenlWYWx1ZS5cbiAgICBsYXp5VmFsdWUgPSBjb25zdHJ1Y3RIZWxwZXIoZG9tRWxlbWVudCwgcGF0aCwgY29udGV4dCwgcGFyYW1zLCBoYXNoLCB7fSwgZW52LCBoZWxwZXIpO1xuICB9IGVsc2Uge1xuICAgIGxhenlWYWx1ZSA9IHN0cmVhbVByb3BlcnR5KGNvbnRleHQsIHBhdGgpO1xuICB9XG5cbiAgLy8gV2hlbiB3ZSBoYXZlIG91ciBsYXp5IHZhbHVlIHJ1biBpdCBhbmQgc3RhcnQgbGlzdGVuaW5nIGZvciB1cGRhdGVzLlxuICBsYXp5VmFsdWUub25Ob3RpZnkoZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgbGF6eVZhbHVlLnZhbHVlKCk7XG4gIH0pO1xuXG4gIHZhbHVlID0gbGF6eVZhbHVlLnZhbHVlKCk7XG5cbn07XG5ob29rcy5hdHRyaWJ1dGUgPSBmdW5jdGlvbiBhdHRyaWJ1dGUoZW52LCBhdHRyTW9ycGgsIGRvbUVsZW1lbnQsIG5hbWUsIHZhbHVlKXtcblxuICB2YXIgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsID0gdmFsdWUudmFsdWUoKSxcbiAgICBjaGVja2JveENoYW5nZSxcbiAgICB0eXBlID0gZG9tRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLFxuXG4gICAgaW5wdXRUeXBlcyA9IHsgICdudWxsJzogdHJ1ZSwgICd0ZXh0Jzp0cnVlLCAgICdlbWFpbCc6dHJ1ZSwgICdwYXNzd29yZCc6dHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ3NlYXJjaCc6dHJ1ZSwgJ3VybCc6dHJ1ZSwgICAgJ3RlbCc6dHJ1ZSwgICAgJ2hpZGRlbic6dHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ251bWJlcic6dHJ1ZSwgJ2NvbG9yJzogdHJ1ZSwgJ2RhdGUnOiB0cnVlLCAgJ2RhdGV0aW1lJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGV0aW1lLWxvY2FsOic6IHRydWUsICAgICAgJ21vbnRoJzogdHJ1ZSwgJ3JhbmdlJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ3RpbWUnOiB0cnVlLCAgJ3dlZWsnOiB0cnVlXG4gICAgICAgICAgICAgICAgICB9LFxuICAgIGF0dHI7XG5cbiAgICAvLyBJZiBpcyBhIHRleHQgaW5wdXQgZWxlbWVudCdzIHZhbHVlIHByb3Agd2l0aCBvbmx5IG9uZSB2YXJpYWJsZSwgd2lyZSBkZWZhdWx0IGV2ZW50c1xuICAgIGlmKCBkb21FbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgJiYgaW5wdXRUeXBlc1t0eXBlXSAmJiBuYW1lID09PSAndmFsdWUnICl7XG5cbiAgICAgIC8vIElmIG91ciBzcGVjaWFsIGlucHV0IGV2ZW50cyBoYXZlIG5vdCBiZWVuIGJvdW5kIHlldCwgYmluZCB0aGVtIGFuZCBzZXQgZmxhZ1xuICAgICAgaWYoIWxhenlWYWx1ZS5pbnB1dE9ic2VydmVyKXtcblxuICAgICAgICAkKGRvbUVsZW1lbnQpLm9uKCdjaGFuZ2UgaW5wdXQgcHJvcGVydHljaGFuZ2UnLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgdmFsdWUuc2V0KHZhbHVlLnBhdGgsIHRoaXMudmFsdWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBsYXp5VmFsdWUuaW5wdXRPYnNlcnZlciA9IHRydWU7XG5cbiAgICAgIH1cblxuICAgICAgLy8gU2V0IHRoZSBhdHRyaWJ1dGUgb24gb3VyIGVsZW1lbnQgZm9yIHZpc3VhbCByZWZlcmFuY2VcbiAgICAgIChfLmlzVW5kZWZpbmVkKHZhbCkpID8gZG9tRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSkgOiBkb21FbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCB2YWwpO1xuXG4gICAgICBhdHRyID0gdmFsO1xuXG4gICAgICByZXR1cm4gKGRvbUVsZW1lbnQudmFsdWUgIT09IFN0cmluZyhhdHRyKSkgPyBkb21FbGVtZW50LnZhbHVlID0gKGF0dHIgfHwgJycpIDogYXR0cjtcbiAgICB9XG5cbiAgICBlbHNlIGlmKCBkb21FbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgJiYgKHR5cGUgPT09ICdjaGVja2JveCcgfHwgdHlwZSA9PT0gJ3JhZGlvJykgJiYgbmFtZSA9PT0gJ2NoZWNrZWQnICl7XG5cbiAgICAgIC8vIElmIG91ciBzcGVjaWFsIGlucHV0IGV2ZW50cyBoYXZlIG5vdCBiZWVuIGJvdW5kIHlldCwgYmluZCB0aGVtIGFuZCBzZXQgZmxhZ1xuICAgICAgaWYoIWxhenlWYWx1ZS5ldmVudHNCb3VuZCl7XG5cbiAgICAgICAgJChkb21FbGVtZW50KS5vbignY2hhbmdlIHByb3BlcnR5Y2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgIHZhbHVlLnNldCh2YWx1ZS5wYXRoLCAoKHRoaXMuY2hlY2tlZCkgPyB0cnVlIDogZmFsc2UpLCB7cXVpZXQ6IHRydWV9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGF6eVZhbHVlLmV2ZW50c0JvdW5kID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0IHRoZSBhdHRyaWJ1dGUgb24gb3VyIGVsZW1lbnQgZm9yIHZpc3VhbCByZWZlcmFuY2VcbiAgICAgICghdmFsKSA/IGRvbUVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpIDogZG9tRWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsKTtcblxuICAgICAgcmV0dXJuIGRvbUVsZW1lbnQuY2hlY2tlZCA9ICh2YWwpID8gdHJ1ZSA6IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIF8uaXNTdHJpbmcodmFsKSAmJiAodmFsID0gdmFsLnRyaW0oKSk7XG4gICAgICB2YWwgfHwgKHZhbCA9IHVuZGVmaW5lZCk7XG4gICAgICBpZihfLmlzVW5kZWZpbmVkKHZhbCkpe1xuICAgICAgICBkb21FbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIGRvbUVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbDtcblxuICB9LCB7YXR0ck1vcnBoOiBhdHRyTW9ycGh9KTtcblxuICB2YWx1ZS5vbk5vdGlmeShmdW5jdGlvbigpe1xuICAgIGxhenlWYWx1ZS52YWx1ZSgpO1xuICB9KTtcbiAgbGF6eVZhbHVlLmFkZERlcGVuZGVudFZhbHVlKHZhbHVlKTtcblxuICByZXR1cm4gbGF6eVZhbHVlLnZhbHVlKCk7XG5cbn07XG5cbmhvb2tzLmNvbXBvbmVudCA9IGZ1bmN0aW9uKGVudiwgbW9ycGgsIGNvbnRleHQsIHRhZ05hbWUsIGNvbnRleHREYXRhLCB0ZW1wbGF0ZSkge1xuXG4gIHZhciBjb21wb25lbnQsXG4gICAgICBlbGVtZW50LFxuICAgICAgb3V0bGV0LFxuICAgICAgcGxhaW5EYXRhID0ge30sXG4gICAgICBjb21wb25lbnREYXRhID0ge30sXG4gICAgICBsYXp5VmFsdWUsXG4gICAgICB2YWx1ZTtcblxuICAvLyBDcmVhdGUgYSBsYXp5IHZhbHVlIHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2Ygb3VyIGV2YWx1YXRlZCBjb21wb25lbnQuXG4gIGxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBDcmVhdGUgYSBwbGFpbiBkYXRhIG9iamVjdCBmcm9tIHRoZSBsYXp5dmFsdWVzL3ZhbHVlcyBwYXNzZWQgdG8gb3VyIGNvbXBvbmVudFxuICAgIF8uZWFjaChjb250ZXh0RGF0YSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgcGxhaW5EYXRhW2tleV0gPSAodmFsdWUuaXNMYXp5VmFsdWUpID8gdmFsdWUudmFsdWUoKSA6IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgLy8gRm9yIGVhY2ggcGFyYW0gcGFzc2VkIHRvIG91ciBzaGFyZWQgY29tcG9uZW50LCBhZGQgaXQgdG8gb3VyIGN1c3RvbSBlbGVtZW50XG4gICAgLy8gVE9ETzogdGhlcmUgaGFzIHRvIGJlIGEgYmV0dGVyIHdheSB0byBnZXQgc2VlZCBkYXRhIHRvIGVsZW1lbnQgaW5zdGFuY2VzXG4gICAgLy8gR2xvYmFsIHNlZWQgZGF0YSBpcyBjb25zdW1lZCBieSBlbGVtZW50IGFzIGl0cyBjcmVhdGVkLiBUaGlzIGlzIG5vdCBzY29wZWQgYW5kIHZlcnkgZHVtYi5cbiAgICBSZWJvdW5kLnNlZWREYXRhID0gcGxhaW5EYXRhO1xuICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICAgIFJlYm91bmQuc2VlZERhdGEgPSB7fTtcbiAgICBjb21wb25lbnQgPSBlbGVtZW50Ll9fY29tcG9uZW50X187XG5cbiAgICAvLyBGb3IgZWFjaCBsYXp5IHBhcmFtIHBhc3NlZCB0byBvdXIgY29tcG9uZW50LCBjcmVhdGUgaXRzIGxhenlWYWx1ZVxuICAgIF8uZWFjaChwbGFpbkRhdGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgIGlmKGNvbnRleHREYXRhW2tleV0gJiYgY29udGV4dERhdGFba2V5XS5pc0xhenlWYWx1ZSl7XG4gICAgICAgIGNvbXBvbmVudERhdGFba2V5XSA9IHN0cmVhbVByb3BlcnR5KGNvbXBvbmVudCwga2V5KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFNldCB1cCB0d28gd2F5IGJpbmRpbmcgYmV0d2VlbiBjb21wb25lbnQgYW5kIG9yaWdpbmFsIGNvbnRleHQgZm9yIG5vbi1kYXRhIGF0dHJpYnV0ZXNcbiAgICAvLyBTeW5jaW5nIGJldHdlZW4gbW9kZWxzIGFuZCBjb2xsZWN0aW9ucyBwYXNzZWQgYXJlIGhhbmRsZWQgaW4gbW9kZWwgYW5kIGNvbGxlY3Rpb25cbiAgICBfLmVhY2goIGNvbXBvbmVudERhdGEsIGZ1bmN0aW9uKGNvbXBvbmVudERhdGFWYWx1ZSwga2V5KXtcblxuICAgICAgLy8gVE9ETzogTWFrZSB0aGlzIHN5bmMgd29yayB3aXRoIGNvbXBsZXggYXJndW1lbnRzIHdpdGggbW9yZSB0aGFuIG9uZSBjaGlsZFxuICAgICAgaWYoY29udGV4dERhdGFba2V5XS5jaGlsZHJlbiA9PT0gbnVsbCl7XG4gICAgICAgIC8vIEZvciBlYWNoIGxhenkgcGFyYW0gcGFzc2VkIHRvIG91ciBjb21wb25lbnQsIGhhdmUgaXQgdXBkYXRlIHRoZSBvcmlnaW5hbCBjb250ZXh0IHdoZW4gY2hhbmdlZC5cbiAgICAgICAgY29tcG9uZW50RGF0YVZhbHVlLm9uTm90aWZ5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgY29udGV4dERhdGFba2V5XS5zZXQoY29udGV4dERhdGFba2V5XS5wYXRoLCBjb21wb25lbnREYXRhVmFsdWUudmFsdWUoKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgZWFjaCBsYXp5IHBhcmFtIHBhc3NlZCB0byBvdXIgY29tcG9uZW50LCBoYXZlIGl0IHVwZGF0ZSB0aGUgY29tcG9uZW50IHdoZW4gY2hhbmdlZC5cbiAgICAgIGNvbnRleHREYXRhW2tleV0ub25Ob3RpZnkoZnVuY3Rpb24oKXtcbiAgICAgICAgY29tcG9uZW50RGF0YVZhbHVlLnNldChrZXksIGNvbnRleHREYXRhW2tleV0udmFsdWUoKSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gU2VlZCB0aGUgY2FjaGVcbiAgICAgIGNvbXBvbmVudERhdGFWYWx1ZS52YWx1ZSgpO1xuXG4gICAgICAvLyBOb3RpZnkgdGhlIGNvbXBvbmVudCdzIGxhenl2YWx1ZSB3aGVuIG91ciBtb2RlbCB1cGRhdGVzXG4gICAgICBjb250ZXh0RGF0YVtrZXldLmFkZE9ic2VydmVyKGNvbnRleHREYXRhW2tleV0ucGF0aCwgY29udGV4dCk7XG4gICAgICBjb21wb25lbnREYXRhVmFsdWUuYWRkT2JzZXJ2ZXIoa2V5LCBjb21wb25lbnQpO1xuXG4gICAgfSk7XG5cbiAgICAvLyAvLyBGb3IgZWFjaCBjaGFuZ2Ugb24gb3VyIGNvbXBvbmVudCwgdXBkYXRlIHRoZSBzdGF0ZXMgb2YgdGhlIG9yaWdpbmFsIGNvbnRleHQgYW5kIHRoZSBlbGVtZW50J3MgcHJvZXBydGllcy5cbiAgICBjb21wb25lbnQubGlzdGVuVG8oY29tcG9uZW50LCAnY2hhbmdlJywgZnVuY3Rpb24obW9kZWwpe1xuICAgICAgdmFyIGpzb24gPSBjb21wb25lbnQudG9KU09OKCk7XG5cbiAgICAgIGlmKF8uaXNTdHJpbmcoanNvbikpIHJldHVybjsgLy8gSWYgaXMgYSBzdHJpbmcsIHRoaXMgbW9kZWwgaXMgc2VyYWxpemluZyBhbHJlYWR5XG5cbiAgICAgIC8vIFNldCB0aGUgcHJvcGVydGllcyBvbiBvdXIgZWxlbWVudCBmb3IgdmlzdWFsIHJlZmVyYW5jZSBpZiB3ZSBhcmUgb24gYSB0b3AgbGV2ZWwgYXR0cmlidXRlXG4gICAgICBfLmVhY2goanNvbiwgZnVuY3Rpb24odmFsdWUsIGtleSl7XG4gICAgICAgIC8vIFRPRE86IEN1cnJlbnRseSwgc2hvd2luZyBvYmplY3RzIGFzIHByb3BlcnRpZXMgb24gdGhlIGN1c3RvbSBlbGVtZW50IGNhdXNlcyBwcm9ibGVtcy5cbiAgICAgICAgLy8gTGlua2VkIG1vZGVscyBiZXR3ZWVuIHRoZSBjb250ZXh0IGFuZCBjb21wb25lbnQgYmVjb21lIHRoZSBzYW1lIGV4YWN0IG1vZGVsIGFuZCBhbGwgaGVsbCBicmVha3MgbG9vc2UuXG4gICAgICAgIC8vIEZpbmQgYSB3YXkgdG8gcmVtZWR5IHRoaXMuIFVudGlsIHRoZW4sIGRvbid0IHNob3cgb2JqZWN0cy5cbiAgICAgICAgaWYoKF8uaXNPYmplY3QodmFsdWUpKSl7IHJldHVybjsgfVxuICAgICAgICB2YWx1ZSA9IChfLmlzT2JqZWN0KHZhbHVlKSkgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICB0cnl7IChhdHRyaWJ1dGVzW2tleV0pID8gZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSkgOiBlbGVtZW50LmRhdGFzZXRba2V5XSA9IHZhbHVlOyB9XG4gICAgICAgICAgY2F0Y2goZSl7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKiogVGhlIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayBvbiBvdXIgY3VzdG9tIGVsZW1lbnQgdXBkYXRlcyB0aGUgY29tcG9uZW50J3MgZGF0YS4gKiovXG5cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4gICAgRW5kIGRhdGEgZGVwZW5kYW5jeSBjaGFpblxuXG4gICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIFRPRE86IGJyZWFrIHRoaXMgb3V0IGludG8gaXRzIG93biBmdW5jdGlvblxuICAgIC8vIFNldCB0aGUgcHJvcGVydGllcyBvbiBvdXIgZWxlbWVudCBmb3IgdmlzdWFsIHJlZmVyYW5jZSBpZiB3ZSBhcmUgb24gYSB0b3AgbGV2ZWwgYXR0cmlidXRlXG4gICAgdmFyIGNvbXBqc29uID0gY29tcG9uZW50LnRvSlNPTigpO1xuICAgIF8uZWFjaChjb21wanNvbiwgZnVuY3Rpb24odmFsdWUsIGtleSl7XG4gICAgICAvLyBUT0RPOiBDdXJyZW50bHksIHNob3dpbmcgb2JqZWN0cyBhcyBwcm9wZXJ0aWVzIG9uIHRoZSBjdXN0b20gZWxlbWVudCBjYXVzZXMgcHJvYmxlbXMuIExpbmtlZCBtb2RlbHMgYmV0d2VlbiB0aGUgY29udGV4dCBhbmQgY29tcG9uZW50IGJlY29tZSB0aGUgc2FtZSBleGFjdCBtb2RlbCBhbmQgYWxsIGhlbGwgYnJlYWtzIGxvb3NlLiBGaW5kIGEgd2F5IHRvIHJlbWVkeSB0aGlzLiBVbnRpbCB0aGVuLCBkb24ndCBzaG93IG9iamVjdHMuXG4gICAgICBpZigoXy5pc09iamVjdCh2YWx1ZSkpKXsgcmV0dXJuOyB9XG4gICAgICB2YWx1ZSA9IChfLmlzT2JqZWN0KHZhbHVlKSkgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgIGlmKCFfLmlzTnVsbCh2YWx1ZSkgJiYgIV8uaXNVbmRlZmluZWQodmFsdWUpKXtcbiAgICAgICAgdHJ5eyAoYXR0cmlidXRlc1trZXldKSA/IGVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpIDogZWxlbWVudC5kYXRhc2V0W2tleV0gPSB2YWx1ZTsgfVxuICAgICAgICBjYXRjaChlKXtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgLy8gSWYgYW4gb3V0bGV0IG1hcmtlciBpcyBwcmVzZW50IGluIGNvbXBvbmVudCdzIHRlbXBsYXRlLCBhbmQgYSB0ZW1wbGF0ZSBpcyBwcm92aWRlZCwgcmVuZGVyIGl0IGludG8gPGNvbnRlbnQ+XG4gICAgb3V0bGV0ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29udGVudCcpWzBdO1xuICAgIGlmKHRlbXBsYXRlICYmIF8uaXNFbGVtZW50KG91dGxldCkpe1xuICAgICAgb3V0bGV0LmFwcGVuZENoaWxkKHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBlbnYsIG91dGxldCkpO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgbmV3IGVsZW1lbnQuXG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH0sIHttb3JwaDogbW9ycGh9KTtcblxuXG5cbiAgLy8gSWYgd2UgaGF2ZSBvdXIgbGF6eSB2YWx1ZSwgdXBkYXRlIG91ciBkb20uXG4gIC8vIG1vcnBoIGlzIGEgbW9ycGggZWxlbWVudCByZXByZXNlbnRpbmcgb3VyIGRvbSBub2RlXG4gIGlmIChsYXp5VmFsdWUpIHtcbiAgICBsYXp5VmFsdWUub25Ob3RpZnkoZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgICB2YXIgdmFsID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCl7IG1vcnBoLnNldENvbnRlbnQodmFsKTsgfVxuICAgIH0pO1xuXG4gICAgdmFsdWUgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICBpZih2YWx1ZSAhPT0gdW5kZWZpbmVkKXsgbW9ycGguYXBwZW5kKHZhbHVlKTsgfVxuICB9XG59O1xuXG4vLyByZWdpc3RlckhlbHBlciBpcyBhIHB1YmxpY2FsbHkgYXZhaWxhYmxlIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIGEgaGVscGVyIHdpdGggSFRNTEJhcnNcblxuZXhwb3J0IGRlZmF1bHQgaG9va3M7XG4iLCIvLyBSZWJvdW5kIE1vZGVsXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFJlYm91bmQgKipNb2RlbHMqKiBhcmUgdGhlIGJhc2ljIGRhdGEgb2JqZWN0IGluIHRoZSBmcmFtZXdvcmsg4oCUIGZyZXF1ZW50bHlcbi8vIHJlcHJlc2VudGluZyBhIHJvdyBpbiBhIHRhYmxlIGluIGEgZGF0YWJhc2Ugb24geW91ciBzZXJ2ZXIuIFRoZSBpbmhlcml0IGZyb21cbi8vIEJhY2tib25lIE1vZGVscyBhbmQgaGF2ZSBhbGwgb2YgdGhlIHNhbWUgdXNlZnVsIG1ldGhvZHMgeW91IGFyZSB1c2VkIHRvIGZvclxuLy8gcGVyZm9ybWluZyBjb21wdXRhdGlvbnMgYW5kIHRyYW5zZm9ybWF0aW9ucyBvbiB0aGF0IGRhdGEuIFJlYm91bmQgYXVnbWVudHNcbi8vIEJhY2tib25lIE1vZGVscyBieSBlbmFibGluZyBkZWVwIGRhdGEgbmVzdGluZy4gWW91IGNhbiBub3cgaGF2ZSAqKlJlYm91bmQgQ29sbGVjdGlvbnMqKlxuLy8gYW5kICoqUmVib3VuZCBDb21wdXRlZCBQcm9wZXJ0aWVzKiogYXMgcHJvcGVydGllcyBvZiB0aGUgTW9kZWwuXG5cbmltcG9ydCBDb21wdXRlZFByb3BlcnR5IGZyb20gXCJyZWJvdW5kLWRhdGEvY29tcHV0ZWQtcHJvcGVydHlcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG4vLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsIGdlbmVyYXRlcyBhIHBhdGggY29uc3RydWN0ZWQgZnJvbSBpdHNcbi8vIHBhcmVudCdzIHBhdGggYW5kIHRoZSBrZXkgaXQgaXMgYXNzaWduZWQgdG8uIEtlZXBzIHVzIGZyb20gcmUtbmFtaW5nIGNoaWxkcmVuXG4vLyB3aGVuIHBhcmVudHMgY2hhbmdlLlxuZnVuY3Rpb24gcGF0aEdlbmVyYXRvcihwYXJlbnQsIGtleSl7XG4gIHJldHVybiBmdW5jdGlvbigpe1xuICAgIHZhciBwYXRoID0gcGFyZW50Ll9fcGF0aCgpO1xuICAgIHJldHVybiBwYXRoICsgKChwYXRoID09PSAnJykgPyAnJyA6ICcuJykgKyBrZXk7XG4gIH07XG59XG5cbnZhciBNb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XG4gIC8vIFNldCB0aGlzIG9iamVjdCdzIGRhdGEgdHlwZXNcbiAgaXNNb2RlbDogdHJ1ZSxcbiAgaXNEYXRhOiB0cnVlLFxuXG4gIC8vIEEgbWV0aG9kIHRoYXQgcmV0dXJucyBhIHJvb3QgcGF0aCBieSBkZWZhdWx0LiBNZWFudCB0byBiZSBvdmVycmlkZGVuIG9uXG4gIC8vIGluc3RhbnRpYXRpb24uXG4gIF9fcGF0aDogZnVuY3Rpb24oKXsgcmV0dXJuICcnOyB9LFxuXG4gIC8vIENyZWF0ZSBhIG5ldyBNb2RlbCB3aXRoIHRoZSBzcGVjaWZpZWQgYXR0cmlidXRlcy4gVGhlIE1vZGVsJ3MgbGluZWFnZSBpcyBzZXRcbiAgLy8gdXAgaGVyZSB0byBrZWVwIHRyYWNrIG9mIGl0J3MgcGxhY2UgaW4gdGhlIGRhdGEgdHJlZS5cbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGF0dHJpYnV0ZXMsIG9wdGlvbnMpe1xuICAgIGF0dHJpYnV0ZXMgfHwgKGF0dHJpYnV0ZXMgPSB7fSk7XG4gICAgYXR0cmlidXRlcy5pc01vZGVsICYmIChhdHRyaWJ1dGVzID0gYXR0cmlidXRlcy5hdHRyaWJ1dGVzKTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHRoaXMuaGVscGVycyA9IHt9O1xuICAgIHRoaXMuZGVmYXVsdHMgPSB0aGlzLmRlZmF1bHRzIHx8IHt9O1xuICAgIHRoaXMuc2V0UGFyZW50KCBvcHRpb25zLnBhcmVudCB8fCB0aGlzICk7XG4gICAgdGhpcy5zZXRSb290KCBvcHRpb25zLnJvb3QgfHwgdGhpcyApO1xuICAgIHRoaXMuX19wYXRoID0gb3B0aW9ucy5wYXRoIHx8IHRoaXMuX19wYXRoO1xuICAgIEJhY2tib25lLk1vZGVsLmNhbGwoIHRoaXMsIGF0dHJpYnV0ZXMsIG9wdGlvbnMgKTtcbiAgfSxcblxuICAvLyBOZXcgY29udmVuaWVuY2UgZnVuY3Rpb24gdG8gdG9nZ2xlIGJvb2xlYW4gdmFsdWVzIGluIHRoZSBNb2RlbC5cbiAgdG9nZ2xlOiBmdW5jdGlvbihhdHRyLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgPyBfLmNsb25lKG9wdGlvbnMpIDoge307XG4gICAgdmFyIHZhbCA9IHRoaXMuZ2V0KGF0dHIpO1xuICAgIGlmKCFfLmlzQm9vbGVhbih2YWwpKSBjb25zb2xlLmVycm9yKCdUcmllZCB0byB0b2dnbGUgbm9uLWJvb2xlYW4gdmFsdWUgJyArIGF0dHIgKychJywgdGhpcyk7XG4gICAgcmV0dXJuIHRoaXMuc2V0KGF0dHIsICF2YWwsIG9wdGlvbnMpO1xuICB9LFxuXG4gIC8vIE1vZGVsIFJlc2V0IGRvZXMgYSBkZWVwIHJlc2V0IG9uIHRoZSBkYXRhIHRyZWUgc3RhcnRpbmcgYXQgdGhpcyBNb2RlbC5cbiAgLy8gQSBgcHJldmlvdXNBdHRyaWJ1dGVzYCBwcm9wZXJ0eSBpcyBzZXQgb24gdGhlIGBvcHRpb25zYCBwcm9wZXJ0eSB3aXRoIHRoZSBNb2RlbCdzXG4gIC8vIG9sZCB2YWx1ZXMuXG4gIHJlc2V0OiBmdW5jdGlvbihvYmosIG9wdGlvbnMpe1xuICAgIHZhciBjaGFuZ2VkID0ge30sIGtleSwgdmFsdWU7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBvcHRpb25zLnJlc2V0ID0gdHJ1ZTtcbiAgICBvYmogPSAob2JqICYmIG9iai5pc01vZGVsICYmIG9iai5hdHRyaWJ1dGVzKSB8fCBvYmogfHwge307XG4gICAgb3B0aW9ucy5wcmV2aW91c0F0dHJpYnV0ZXMgPSBfLmNsb25lKHRoaXMuYXR0cmlidXRlcyk7XG5cbiAgICAvLyBJdGVyYXRlIG92ZXIgdGhlIE1vZGVsJ3MgYXR0cmlidXRlczpcbiAgICAvLyAtIElmIHRoZSBwcm9wZXJ0eSBpcyB0aGUgYGlkQXR0cmlidXRlYCwgc2tpcC5cbiAgICAvLyAtIElmIHRoZSBwcm9wZXJ0eSBpcyBhIGBNb2RlbGAsIGBDb2xsZWN0aW9uYCwgb3IgYENvbXB1dGVkUHJvcGVydHlgLCByZXNldCBpdC5cbiAgICAvLyAtIElmIHRoZSBwYXNzZWQgb2JqZWN0IGhhcyB0aGUgcHJvcGVydHksIHNldCBpdCB0byB0aGUgbmV3IHZhbHVlLlxuICAgIC8vIC0gSWYgdGhlIE1vZGVsIGhhcyBhIGRlZmF1bHQgdmFsdWUgZm9yIHRoaXMgcHJvcGVydHksIHNldCBpdCBiYWNrIHRvIGRlZmF1bHQuXG4gICAgLy8gLSBPdGhlcndpc2UsIHVuc2V0IHRoZSBhdHRyaWJ1dGUuXG4gICAgZm9yKGtleSBpbiB0aGlzLmF0dHJpYnV0ZXMpe1xuICAgICAgdmFsdWUgPSB0aGlzLmF0dHJpYnV0ZXNba2V5XTtcbiAgICAgIGlmKHZhbHVlID09PSBvYmpba2V5XSkgY29udGludWU7XG4gICAgICBlbHNlIGlmKF8uaXNVbmRlZmluZWQodmFsdWUpKSBvYmpba2V5XSAmJiAoY2hhbmdlZFtrZXldID0gb2JqW2tleV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSB0aGlzLmlkQXR0cmlidXRlKSBjb250aW51ZTtcbiAgICAgIGVsc2UgaWYgKHZhbHVlLmlzQ29sbGVjdGlvbiB8fCB2YWx1ZS5pc01vZGVsIHx8IHZhbHVlLmlzQ29tcHV0ZWRQcm9wZXJ0eSl7XG4gICAgICAgIHZhbHVlLnJlc2V0KChvYmpba2V5XXx8W10pLCB7c2lsZW50OiB0cnVlfSk7XG4gICAgICAgIGlmKHZhbHVlLmlzQ29sbGVjdGlvbikgY2hhbmdlZFtrZXldID0gW107XG4gICAgICAgIGVsc2UgaWYodmFsdWUuaXNNb2RlbCAmJiB2YWx1ZS5pc0NvbXB1dGVkUHJvcGVydHkpIGNoYW5nZWRba2V5XSA9IHZhbHVlLmNhY2hlLm1vZGVsLmNoYW5nZWQ7XG4gICAgICAgIGVsc2UgaWYodmFsdWUuaXNNb2RlbCkgY2hhbmdlZFtrZXldID0gdmFsdWUuY2hhbmdlZFxuICAgICAgfVxuICAgICAgZWxzZSBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkpeyBjaGFuZ2VkW2tleV0gPSBvYmpba2V5XTsgfVxuICAgICAgZWxzZSBpZiAodGhpcy5kZWZhdWx0cy5oYXNPd25Qcm9wZXJ0eShrZXkpICYmICFfLmlzRnVuY3Rpb24odGhpcy5kZWZhdWx0c1trZXldKSl7XG4gICAgICAgIGNvbnNvbGUubG9nKHRoaXMuZGVmYXVsdHMsIHRoaXMpO1xuICAgICAgICBjaGFuZ2VkW2tleV0gPSBvYmpba2V5XSA9IHRoaXMuZGVmYXVsdHNba2V5XTtcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIGNoYW5nZWRba2V5XSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy51bnNldChrZXksIHtzaWxlbnQ6IHRydWV9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQW55IHVuc2V0IGNoYW5nZWQgdmFsdWVzIHdpbGwgYmUgc2V0IHRvIG9ialtrZXldXG4gICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqKXtcbiAgICAgIGNoYW5nZWRba2V5XSA9IGNoYW5nZWRba2V5XSB8fCBvYmpba2V5XTtcbiAgICB9KTtcblxuICAgIC8vIFJlc2V0IG91ciBtb2RlbFxuICAgIG9iaiA9IHRoaXMuc2V0KG9iaiwgXy5leHRlbmQoe30sIG9wdGlvbnMsIHtzaWxlbnQ6IHRydWUsIHJlc2V0OiBmYWxzZX0pKTtcblxuICAgIC8vIFRyaWdnZXIgY3VzdG9tIHJlc2V0IGV2ZW50XG4gICAgdGhpcy5jaGFuZ2VkID0gY2hhbmdlZDtcbiAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB0aGlzLnRyaWdnZXIoJ3Jlc2V0JywgdGhpcywgb3B0aW9ucyk7XG5cbiAgICAvLyBSZXR1cm4gbmV3IHZhbHVlc1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgLy8gKipNb2RlbC5HZXQqKiBpcyBvdmVycmlkZGVuIHRvIHByb3ZpZGUgc3VwcG9ydCBmb3IgZ2V0dGluZyBmcm9tIGEgZGVlcCBkYXRhIHRyZWUuXG4gIC8vIGBrZXlgIG1heSBub3cgYmUgYW55IHZhbGlkIGpzb24tbGlrZSBpZGVudGlmaWVyLiBFeDogYG9iai5jb2xsWzNdLnZhbHVlYC5cbiAgLy8gSXQgbmVlZHMgdG8gdHJhdmVyc2UgYE1vZGVsc2AsIGBDb2xsZWN0aW9uc2AgYW5kIGBDb21wdXRlZCBQcm9wZXJ0aWVzYCB0b1xuICAvLyBmaW5kIHRoZSBjb3JyZWN0IHZhbHVlLlxuICAvLyAtIElmIGtleSBpcyB1bmRlZmluZWQsIHJldHVybiBgdW5kZWZpbmVkYC5cbiAgLy8gLSBJZiBrZXkgaXMgZW1wdHkgc3RyaW5nLCByZXR1cm4gYHRoaXNgLlxuICAvL1xuICAvLyBGb3IgZWFjaCBwYXJ0OlxuICAvLyAtIElmIGEgYENvbXB1dGVkIFByb3BlcnR5YCBhbmQgYG9wdGlvbnMucmF3YCBpcyB0cnVlLCByZXR1cm4gaXQuXG4gIC8vIC0gSWYgYSBgQ29tcHV0ZWQgUHJvcGVydHlgIHRyYXZlcnNlIHRvIGl0cyB2YWx1ZS5cbiAgLy8gLSBJZiBub3Qgc2V0LCByZXR1cm4gaXRzIGZhbHN5IHZhbHVlLlxuICAvLyAtIElmIGEgYE1vZGVsYCwgYENvbGxlY3Rpb25gLCBvciBwcmltaXRpdmUgdmFsdWUsIHRyYXZlcnNlIHRvIGl0LlxuICBnZXQ6IGZ1bmN0aW9uKGtleSwgb3B0aW9ucyl7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgcGFydHMgID0gJC5zcGxpdFBhdGgoa2V5KSxcbiAgICAgICAgcmVzdWx0ID0gdGhpcyxcbiAgICAgICAgaSwgbD1wYXJ0cy5sZW5ndGg7XG5cbiAgICBpZihfLmlzVW5kZWZpbmVkKGtleSkgfHwgXy5pc051bGwoa2V5KSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBpZihrZXkgPT09ICcnIHx8IHBhcnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJlc3VsdDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5ICYmIG9wdGlvbnMucmF3KSByZXR1cm4gcmVzdWx0O1xuICAgICAgaWYocmVzdWx0ICYmIHJlc3VsdC5pc0NvbXB1dGVkUHJvcGVydHkpIHJlc3VsdCA9IHJlc3VsdC52YWx1ZSgpO1xuICAgICAgaWYoXy5pc1VuZGVmaW5lZChyZXN1bHQpIHx8IF8uaXNOdWxsKHJlc3VsdCkpIHJldHVybiByZXN1bHQ7XG4gICAgICBpZihwYXJ0c1tpXSA9PT0gJ0BwYXJlbnQnKSByZXN1bHQgPSByZXN1bHQuX19wYXJlbnRfXztcbiAgICAgIGVsc2UgaWYocmVzdWx0LmlzQ29sbGVjdGlvbikgcmVzdWx0ID0gcmVzdWx0Lm1vZGVsc1twYXJ0c1tpXV07XG4gICAgICBlbHNlIGlmKHJlc3VsdC5pc01vZGVsKSByZXN1bHQgPSByZXN1bHQuYXR0cmlidXRlc1twYXJ0c1tpXV07XG4gICAgICBlbHNlIGlmKHJlc3VsdCAmJiByZXN1bHQuaGFzT3duUHJvcGVydHkocGFydHNbaV0pKSByZXN1bHQgPSByZXN1bHRbcGFydHNbaV1dO1xuICAgIH1cblxuICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5ICYmICFvcHRpb25zLnJhdykgcmVzdWx0ID0gcmVzdWx0LnZhbHVlKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuXG4gIC8vICoqTW9kZWwuU2V0KiogaXMgb3ZlcnJpZGRlbiB0byBwcm92aWRlIHN1cHBvcnQgZm9yIGdldHRpbmcgZnJvbSBhIGRlZXAgZGF0YSB0cmVlLlxuICAvLyBga2V5YCBtYXkgbm93IGJlIGFueSB2YWxpZCBqc29uLWxpa2UgaWRlbnRpZmllci4gRXg6IGBvYmouY29sbFszXS52YWx1ZWAuXG4gIC8vIEl0IG5lZWRzIHRvIHRyYXZlcnNlIGBNb2RlbHNgLCBgQ29sbGVjdGlvbnNgIGFuZCBgQ29tcHV0ZWQgUHJvcGVydGllc2AgdG9cbiAgLy8gZmluZCB0aGUgY29ycmVjdCB2YWx1ZSB0byBjYWxsIHRoZSBvcmlnaW5hbCBgQmFja2JvbmUuU2V0YCBvbi5cbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbCwgb3B0aW9ucyl7XG5cbiAgICB2YXIgYXR0cnMsIGF0dHIsIG5ld0tleSwgdGFyZ2V0LCBkZXN0aW5hdGlvbiwgcHJvcHMgPSBbXSwgbGluZWFnZTtcblxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgYXR0cnMgPSAoa2V5LmlzTW9kZWwpID8ga2V5LmF0dHJpYnV0ZXMgOiBrZXk7XG4gICAgICBvcHRpb25zID0gdmFsO1xuICAgIH1cbiAgICBlbHNlIChhdHRycyA9IHt9KVtrZXldID0gdmFsO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG5cbiAgICAvLyBJZiByZXNldCBvcHRpb24gcGFzc2VkLCBkbyBhIHJlc2V0LiBJZiBub3RoaW5nIHBhc3NlZCwgcmV0dXJuLlxuICAgIGlmKG9wdGlvbnMucmVzZXQgPT09IHRydWUpIHJldHVybiB0aGlzLnJlc2V0KGF0dHJzLCBvcHRpb25zKTtcbiAgICBpZihvcHRpb25zLmRlZmF1bHRzID09PSB0cnVlKSB0aGlzLmRlZmF1bHRzID0gYXR0cnM7XG4gICAgaWYoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuO1xuXG4gICAgLy8gRm9yIGVhY2ggYXR0cmlidXRlIHBhc3NlZDpcbiAgICBmb3Ioa2V5IGluIGF0dHJzKXtcbiAgICAgIHZhciB2YWwgPSBhdHRyc1trZXldLFxuICAgICAgICAgIHBhdGhzID0gJC5zcGxpdFBhdGgoa2V5KSxcbiAgICAgICAgICBhdHRyICA9IHBhdGhzLnBvcCgpIHx8ICcnOyAgICAgICAgICAgLy8gVGhlIGtleSAgICAgICAgZXg6IGZvb1swXS5iYXIgLS0+IGJhclxuICAgICAgICAgIHRhcmdldCA9IHRoaXMuZ2V0KHBhdGhzLmpvaW4oJy4nKSksICAvLyBUaGUgZWxlbWVudCAgICBleDogZm9vLmJhci5iYXogLS0+IGZvby5iYXJcbiAgICAgICAgICBsaW5lYWdlO1xuXG4gICAgICAvLyBJZiB0YXJnZXQgY3VycmVudGx5IGRvZXNudCBleGlzdCwgY29uc3RydWN0IGl0cyB0cmVlXG4gICAgICBpZihfLmlzVW5kZWZpbmVkKHRhcmdldCkpe1xuICAgICAgICB0YXJnZXQgPSB0aGlzO1xuICAgICAgICBfLmVhY2gocGF0aHMsIGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgICAgICB2YXIgdG1wID0gdGFyZ2V0LmdldCh2YWx1ZSk7XG4gICAgICAgICAgaWYoXy5pc1VuZGVmaW5lZCh0bXApKSB0bXAgPSB0YXJnZXQuc2V0KHZhbHVlLCB7fSkuZ2V0KHZhbHVlKTtcbiAgICAgICAgICB0YXJnZXQgPSB0bXA7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGUgb2xkIHZhbHVlIG9mIGBhdHRyYCBpbiBgdGFyZ2V0YFxuICAgICAgdmFyIGRlc3RpbmF0aW9uID0gdGFyZ2V0LmdldChhdHRyLCB7cmF3OiB0cnVlfSkgfHwge307XG5cbiAgICAgIC8vIENyZWF0ZSB0aGlzIG5ldyBvYmplY3QncyBsaW5lYWdlLlxuICAgICAgbGluZWFnZSA9IHtcbiAgICAgICAgbmFtZToga2V5LFxuICAgICAgICBwYXJlbnQ6IHRhcmdldCxcbiAgICAgICAgcm9vdDogdGhpcy5fX3Jvb3RfXyxcbiAgICAgICAgcGF0aDogcGF0aEdlbmVyYXRvcih0YXJnZXQsIGtleSksXG4gICAgICAgIHNpbGVudDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdHM6IG9wdGlvbnMuZGVmYXVsdHNcbiAgICAgIH1cbiAgICAgIC8vIC0gSWYgdmFsIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYCwgc2V0IHRvIGRlZmF1bHQgdmFsdWUuXG4gICAgICAvLyAtIElmIHZhbCBpcyBhIGBDb21wdXRlZCBQcm9wZXJ0eWAsIGdldCBpdHMgY3VycmVudCBjYWNoZSBvYmplY3QuXG4gICAgICAvLyAtIElmIHZhbCBpcyBgbnVsbGAsIHNldCB0byBkZWZhdWx0IHZhbHVlIG9yIChmYWxsYmFjayBgdW5kZWZpbmVkYCkuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyBmdW5jdGlvbiBpcyB0aGUgc2FtZSBhcyB0aGUgY3VycmVudCBjb21wdXRlZCBwcm9wZXJ0eSwgY29udGludWUuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyB2YWx1ZSBpcyBhIGBGdW5jdGlvbmAsIHR1cm4gaXQgaW50byBhIGBDb21wdXRlZCBQcm9wZXJ0eWAuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyBpcyBnb2luZyB0byBiZSBhIGN5Y2xpY2FsIGRlcGVuZGFuY3ksIHVzZSB0aGUgb3JpZ2luYWwgb2JqZWN0LCBkb24ndCBtYWtlIGEgY29weS5cbiAgICAgIC8vIC0gRWxzZSBJZiB1cGRhdGluZyBhbiBleGlzdGluZyBvYmplY3Qgd2l0aCBpdHMgcmVzcGVjdGl2ZSBkYXRhIHR5cGUsIGxldCBCYWNrYm9uZSBoYW5kbGUgdGhlIG1lcmdlLlxuICAgICAgLy8gLSBFbHNlIElmIHRoaXMgdmFsdWUgaXMgYSBgTW9kZWxgIG9yIGBDb2xsZWN0aW9uYCwgY3JlYXRlIGEgbmV3IGNvcHkgb2YgaXQgdXNpbmcgaXRzIGNvbnN0cnVjdG9yLCBwcmVzZXJ2aW5nIGl0cyBkZWZhdWx0cyB3aGlsZSBlbnN1cmluZyBubyBzaGFyZWQgbWVtb3J5IGJldHdlZW4gb2JqZWN0cy5cbiAgICAgIC8vIC0gRWxzZSBJZiB0aGlzIHZhbHVlIGlzIGFuIGBBcnJheWAsIHR1cm4gaXQgaW50byBhIGBDb2xsZWN0aW9uYC5cbiAgICAgIC8vIC0gRWxzZSBJZiB0aGlzIHZhbHVlIGlzIGEgYE9iamVjdGAsIHR1cm4gaXQgaW50byBhIGBNb2RlbGAuXG4gICAgICAvLyAtIEVsc2UgdmFsIGlzIGEgcHJpbWl0aXZlIHZhbHVlLCBzZXQgaXQgYWNjb3JkaW5nbHkuXG5cblxuXG4gICAgICBpZihfLmlzTnVsbCh2YWwpIHx8IF8uaXNVbmRlZmluZWQodmFsKSkgdmFsID0gdGhpcy5kZWZhdWx0c1trZXldO1xuICAgICAgaWYodmFsICYmIHZhbC5pc0NvbXB1dGVkUHJvcGVydHkpIHZhbCA9IHZhbC52YWx1ZSgpO1xuICAgICAgZWxzZSBpZihfLmlzTnVsbCh2YWwpIHx8IF8uaXNVbmRlZmluZWQodmFsKSkgdmFsID0gdW5kZWZpbmVkO1xuICAgICAgZWxzZSBpZihkZXN0aW5hdGlvbi5pc0NvbXB1dGVkUHJvcGVydHkgJiYgZGVzdGluYXRpb24uZnVuYyA9PT0gdmFsKSBjb250aW51ZTtcbiAgICAgIGVsc2UgaWYoXy5pc0Z1bmN0aW9uKHZhbCkpIHZhbCA9IG5ldyBDb21wdXRlZFByb3BlcnR5KHZhbCwgbGluZWFnZSk7XG4gICAgICBlbHNlIGlmKHZhbC5pc0RhdGEgJiYgdGFyZ2V0Lmhhc1BhcmVudCh2YWwpKSB2YWwgPSB2YWw7XG4gICAgICBlbHNlIGlmKCBkZXN0aW5hdGlvbi5pc0NvbXB1dGVkUHJvcGVydHkgfHxcbiAgICAgICAgICAgICAgKCBkZXN0aW5hdGlvbi5pc0NvbGxlY3Rpb24gJiYgKCBfLmlzQXJyYXkodmFsKSB8fCB2YWwuaXNDb2xsZWN0aW9uICkpIHx8XG4gICAgICAgICAgICAgICggZGVzdGluYXRpb24uaXNNb2RlbCAmJiAoIF8uaXNPYmplY3QodmFsKSB8fCB2YWwuaXNNb2RlbCApKSl7XG4gICAgICAgIGRlc3RpbmF0aW9uLnNldCh2YWwsIG9wdGlvbnMpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYodmFsLmlzRGF0YSAmJiBvcHRpb25zLmNsb25lICE9PSBmYWxzZSkgdmFsID0gbmV3IHZhbC5jb25zdHJ1Y3Rvcih2YWwuYXR0cmlidXRlcyB8fCB2YWwubW9kZWxzLCBsaW5lYWdlKTtcbiAgICAgIGVsc2UgaWYoXy5pc0FycmF5KHZhbCkpIHZhbCA9IG5ldyBSZWJvdW5kLkNvbGxlY3Rpb24odmFsLCBsaW5lYWdlKTsgLy8gVE9ETzogUmVtb3ZlIGdsb2JhbCByZWZlcmFuY2VcbiAgICAgIGVsc2UgaWYoXy5pc09iamVjdCh2YWwpKSB2YWwgPSBuZXcgTW9kZWwodmFsLCBsaW5lYWdlKTtcblxuICAgICAgLy8gSWYgdmFsIGlzIGEgZGF0YSBvYmplY3QsIGxldCB0aGlzIG9iamVjdCBrbm93IGl0IGlzIG5vdyBhIHBhcmVudFxuICAgICAgdGhpcy5faGFzQW5jZXN0cnkgPSAodmFsICYmIHZhbC5pc0RhdGEgfHwgZmFsc2UpO1xuXG4gICAgICAvLyBTZXQgdGhlIHZhbHVlXG4gICAgICBCYWNrYm9uZS5Nb2RlbC5wcm90b3R5cGUuc2V0LmNhbGwodGFyZ2V0LCBhdHRyLCB2YWwsIG9wdGlvbnMpOyAvLyBUT0RPOiBFdmVudCBjbGVhbnVwIHdoZW4gcmVwbGFjaW5nIGEgbW9kZWwgb3IgY29sbGVjdGlvbiB3aXRoIGFub3RoZXIgdmFsdWVcblxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcztcblxuICB9LFxuXG4gIC8vIFJlY3Vyc2l2ZSBgdG9KU09OYCBmdW5jdGlvbiB0cmF2ZXJzZXMgdGhlIGRhdGEgdHJlZSByZXR1cm5pbmcgYSBKU09OIG9iamVjdC5cbiAgLy8gSWYgdGhlcmUgYXJlIGFueSBjeWNsaWMgZGVwZW5kYW5jaWVzIHRoZSBvYmplY3QncyBgY2lkYCBpcyB1c2VkIGluc3RlYWQgb2YgbG9vcGluZyBpbmZpbml0ZWx5LlxuICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuX2lzU2VyaWFsaXppbmcpIHJldHVybiB0aGlzLmlkIHx8IHRoaXMuY2lkO1xuICAgICAgdGhpcy5faXNTZXJpYWxpemluZyA9IHRydWU7XG4gICAgICB2YXIganNvbiA9IF8uY2xvbmUodGhpcy5hdHRyaWJ1dGVzKTtcbiAgICAgIF8uZWFjaChqc29uLCBmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICAgIGlmKCBfLmlzTnVsbCh2YWx1ZSkgfHwgXy5pc1VuZGVmaW5lZCh2YWx1ZSkgKXsgcmV0dXJuOyB9XG4gICAgICAgICAgXy5pc0Z1bmN0aW9uKHZhbHVlLnRvSlNPTikgJiYgKGpzb25bbmFtZV0gPSB2YWx1ZS50b0pTT04oKSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2lzU2VyaWFsaXppbmcgPSBmYWxzZTtcbiAgICAgIHJldHVybiBqc29uO1xuICB9XG5cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBNb2RlbDtcbiIsIi8vIFJlYm91bmQgTGF6eSBWYWx1ZVxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgTklMID0gZnVuY3Rpb24gTklMKCl7fSxcbiAgICBFTVBUWV9BUlJBWSA9IFtdO1xuXG5mdW5jdGlvbiBMYXp5VmFsdWUoZm4sIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KVxuICB0aGlzLmNpZCA9IF8udW5pcXVlSWQoJ2xhenlWYWx1ZScpO1xuICB0aGlzLnZhbHVlRm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0IHx8IG51bGw7XG4gIHRoaXMubW9ycGggPSBvcHRpb25zLm1vcnBoIHx8IG51bGw7XG4gIHRoaXMuYXR0ck1vcnBoID0gb3B0aW9ucy5hdHRyTW9ycGggfHwgbnVsbDtcbiAgXy5iaW5kQWxsKHRoaXMsICd2YWx1ZScsICdzZXQnLCAnYWRkRGVwZW5kZW50VmFsdWUnLCAnYWRkT2JzZXJ2ZXInLCAnbm90aWZ5JywgJ29uTm90aWZ5JywgJ2Rlc3Ryb3knKTtcbn1cblxuTGF6eVZhbHVlLnByb3RvdHlwZSA9IHtcbiAgaXNMYXp5VmFsdWU6IHRydWUsXG4gIHBhcmVudDogbnVsbCwgLy8gVE9ETzogaXMgcGFyZW50IGV2ZW4gbmVlZGVkPyBjb3VsZCBiZSBtb2RlbGVkIGFzIGEgc3Vic2NyaWJlclxuICBjaGlsZHJlbjogbnVsbCxcbiAgb2JzZXJ2ZXJzOiBudWxsLFxuICBjYWNoZTogTklMLFxuICB2YWx1ZUZuOiBudWxsLFxuICBzdWJzY3JpYmVyczogbnVsbCwgLy8gVE9ETzogZG8gd2UgbmVlZCBtdWx0aXBsZSBzdWJzY3JpYmVycz9cbiAgX2NoaWxkVmFsdWVzOiBudWxsLCAvLyBqdXN0IGZvciByZXVzaW5nIHRoZSBhcnJheSwgbWlnaHQgbm90IHdvcmsgd2VsbCBpZiBjaGlsZHJlbi5sZW5ndGggY2hhbmdlcyBhZnRlciBjb21wdXRhdGlvblxuXG4gIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FjaGUgPSB0aGlzLmNhY2hlO1xuICAgIGlmIChjYWNoZSAhPT0gTklMKSB7IHJldHVybiBjYWNoZTsgfVxuXG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgIHZhciBjaGlsZCxcbiAgICAgICAgICB2YWx1ZXMgPSB0aGlzLl9jaGlsZFZhbHVlcyB8fCBuZXcgQXJyYXkoY2hpbGRyZW4ubGVuZ3RoKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgdmFsdWVzW2ldID0gKGNoaWxkICYmIGNoaWxkLmlzTGF6eVZhbHVlKSA/IGNoaWxkLnZhbHVlKCkgOiBjaGlsZDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuY2FjaGUgPSB0aGlzLnZhbHVlRm4odmFsdWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuY2FjaGUgPSB0aGlzLnZhbHVlRm4oRU1QVFlfQVJSQVkpO1xuICAgIH1cbiAgfSxcblxuICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUsIG9wdGlvbnMpe1xuICAgIGlmKHRoaXMuY29udGV4dCl7XG4gICAgICByZXR1cm4gdGhpcy5jb250ZXh0LnNldChrZXksIHZhbHVlLCBvcHRpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cbiAgYWRkRGVwZW5kZW50VmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcbiAgICBpZiAoIWNoaWxkcmVuKSB7XG4gICAgICBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW4gPSBbdmFsdWVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaGlsZHJlbi5wdXNoKHZhbHVlKTtcbiAgICB9XG5cbiAgICBpZiAodmFsdWUgJiYgdmFsdWUuaXNMYXp5VmFsdWUpIHsgdmFsdWUucGFyZW50ID0gdGhpczsgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgYWRkT2JzZXJ2ZXI6IGZ1bmN0aW9uKHBhdGgsIGNvbnRleHQpIHtcbiAgICB2YXIgb2JzZXJ2ZXJzID0gdGhpcy5vYnNlcnZlcnMgfHwgKHRoaXMub2JzZXJ2ZXJzID0gW10pLFxuICAgICAgICBwb3NpdGlvbiwgcmVzO1xuXG4gICAgaWYoIV8uaXNPYmplY3QoY29udGV4dCkgfHwgIV8uaXNTdHJpbmcocGF0aCkpIHJldHVybiBjb25zb2xlLmVycm9yKCdFcnJvciBhZGRpbmcgb2JzZXJ2ZXIgZm9yJywgY29udGV4dCwgcGF0aCk7XG5cbiAgICAvLyBFbnN1cmUgX29ic2VydmVycyBleGlzdHMgYW5kIGlzIGFuIG9iamVjdFxuICAgIGNvbnRleHQuX19vYnNlcnZlcnMgPSBjb250ZXh0Ll9fb2JzZXJ2ZXJzIHx8IHt9O1xuICAgIC8vIEVuc3VyZSBfX29ic2VydmVyc1twYXRoXSBleGlzdHMgYW5kIGlzIGFuIGFycmF5XG4gICAgY29udGV4dC5fX29ic2VydmVyc1twYXRoXSA9IGNvbnRleHQuX19vYnNlcnZlcnNbcGF0aF0gfHwge2NvbGxlY3Rpb246IFtdLCBtb2RlbDogW119O1xuXG4gICAgLy8gU2F2ZSB0aGUgdHlwZSBvZiBvYmplY3QgZXZlbnRzIHRoaXMgb2JzZXJ2ZXIgaXMgZm9yXG4gICAgcmVzID0gY29udGV4dC5nZXQodGhpcy5wYXRoKTtcbiAgICByZXMgPSAocmVzICYmIHJlcy5pc0NvbGxlY3Rpb24pID8gJ2NvbGxlY3Rpb24nIDogJ21vZGVsJztcblxuICAgIC8vIEFkZCBvdXIgY2FsbGJhY2ssIHNhdmUgdGhlIHBvc2l0aW9uIGl0IGlzIGJlaW5nIGluc2VydGVkIHNvIHdlIGNhbiBnYXJiYWdlIGNvbGxlY3QgbGF0ZXIuXG4gICAgcG9zaXRpb24gPSBjb250ZXh0Ll9fb2JzZXJ2ZXJzW3BhdGhdW3Jlc10ucHVzaCh0aGlzKSAtIDE7XG5cbiAgICAvLyBMYXp5dmFsdWUgbmVlZHMgcmVmZXJhbmNlIHRvIGl0cyBvYnNlcnZlcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBvbiBkZXN0cm95XG4gICAgb2JzZXJ2ZXJzLnB1c2goe2NvbnRleHQ6IGNvbnRleHQsIHBhdGg6IHBhdGgsIGluZGV4OiBwb3NpdGlvbn0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbm90aWZ5OiBmdW5jdGlvbihzZW5kZXIpIHtcbiAgICAvLyBUT0RPOiBUaGlzIGNoZWNrIHdvbid0IGJlIG5lY2Vzc2FyeSBvbmNlIHJlbW92ZWQgRE9NIGhhcyBiZWVuIGNsZWFuZWQgb2YgYW55IGJpbmRpbmdzLiBcbiAgICAvLyBJZiB0aGlzIGxhenlWYWx1ZSdzIG1vcnBoIGRvZXMgbm90IGhhdmUgYW4gaW1tZWRpYXRlIHBhcmVudE5vZGUsIGl0IGhhcyBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgZG9tIHRyZWUuIERlc3Ryb3kgaXQuXG4gICAgLy8gUmlnaHQgbm93LCBET00gdGhhdCBjb250YWlucyBtb3JwaHMgdGhyb3cgYW4gZXJyb3IgaWYgaXQgaXMgcmVtb3ZlZCBieSBhbm90aGVyIGxhenl2YWx1ZSBiZWZvcmUgdGhvc2UgbW9ycGhzIHJlLWV2YWx1YXRlLlxuICAgIGlmKHRoaXMubW9ycGggJiYgdGhpcy5tb3JwaC5zdGFydCAmJiAhdGhpcy5tb3JwaC5zdGFydC5wYXJlbnROb2RlKSByZXR1cm4gdGhpcy5kZXN0cm95KCk7XG4gICAgdmFyIGNhY2hlID0gdGhpcy5jYWNoZSxcbiAgICAgICAgcGFyZW50LFxuICAgICAgICBzdWJzY3JpYmVycztcblxuICAgIGlmIChjYWNoZSAhPT0gTklMKSB7XG4gICAgICBwYXJlbnQgPSB0aGlzLnBhcmVudDtcbiAgICAgIHN1YnNjcmliZXJzID0gdGhpcy5zdWJzY3JpYmVycztcbiAgICAgIGNhY2hlID0gdGhpcy5jYWNoZSA9IE5JTDtcbiAgICAgIGlmIChwYXJlbnQpIHsgcGFyZW50Lm5vdGlmeSh0aGlzKTsgfVxuICAgICAgaWYgKCFzdWJzY3JpYmVycykgeyByZXR1cm47IH1cbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gc3Vic2NyaWJlcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIHN1YnNjcmliZXJzW2ldKHRoaXMpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcblxuICBvbk5vdGlmeTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICB2YXIgc3Vic2NyaWJlcnMgPSB0aGlzLnN1YnNjcmliZXJzIHx8ICh0aGlzLnN1YnNjcmliZXJzID0gW10pO1xuICAgIHN1YnNjcmliZXJzLnB1c2goY2FsbGJhY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGRlc3Ryb3k6IGZ1bmN0aW9uKCkge1xuICAgIF8uZWFjaCh0aGlzLmNoaWxkcmVuLCBmdW5jdGlvbihjaGlsZCl7XG4gICAgICBpZiAoY2hpbGQgJiYgY2hpbGQuaXNMYXp5VmFsdWUpeyBjaGlsZC5kZXN0cm95KCk7IH1cbiAgICB9KTtcbiAgICBfLmVhY2godGhpcy5zdWJzY3JpYmVycywgZnVuY3Rpb24oc3Vic2NyaWJlcil7XG4gICAgICBpZiAoc3Vic2NyaWJlciAmJiBzdWJzY3JpYmVyLmlzTGF6eVZhbHVlKXsgc3Vic2NyaWJlci5kZXN0cm95KCk7IH1cbiAgICB9KTtcblxuICAgIHRoaXMucGFyZW50ID0gdGhpcy5jaGlsZHJlbiA9IHRoaXMuY2FjaGUgPSB0aGlzLnZhbHVlRm4gPSB0aGlzLnN1YnNjcmliZXJzID0gdGhpcy5fY2hpbGRWYWx1ZXMgPSBudWxsO1xuXG4gICAgXy5lYWNoKHRoaXMub2JzZXJ2ZXJzLCBmdW5jdGlvbihvYnNlcnZlcil7XG4gICAgICBpZihfLmlzT2JqZWN0KG9ic2VydmVyLmNvbnRleHQuX19vYnNlcnZlcnNbb2JzZXJ2ZXIucGF0aF0pKXtcbiAgICAgICAgZGVsZXRlIG9ic2VydmVyLmNvbnRleHQuX19vYnNlcnZlcnNbb2JzZXJ2ZXIucGF0aF1bb2JzZXJ2ZXIuaW5kZXhdO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5vYnNlcnZlcnMgPSBudWxsO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBMYXp5VmFsdWU7XG4iLCIvLyBSZWJvdW5kIERhdGFcbi8vIC0tLS0tLS0tLS0tLS0tLS1cbi8vIFRoZXNlIGFyZSBtZXRob2RzIGluaGVyaXRlZCBieSBhbGwgUmVib3VuZCBkYXRhIHR5cGVzIOKAkyAqKk1vZGVscyoqLFxuLy8gKipDb2xsZWN0aW9ucyoqIGFuZCAqKkNvbXB1dGVkIFByb3BlcnRpZXMqKiDigJMgYW5kIGNvbnRyb2wgdHJlZSBhbmNlc3RyeVxuLy8gdHJhY2tpbmcsIGRlZXAgZXZlbnQgcHJvcGFnYXRpb24gYW5kIHRyZWUgZGVzdHJ1Y3Rpb24uXG5cbmltcG9ydCBNb2RlbCBmcm9tIFwicmVib3VuZC1kYXRhL21vZGVsXCI7XG5pbXBvcnQgQ29sbGVjdGlvbiBmcm9tIFwicmVib3VuZC1kYXRhL2NvbGxlY3Rpb25cIjtcbmltcG9ydCBDb21wdXRlZFByb3BlcnR5IGZyb20gXCJyZWJvdW5kLWRhdGEvY29tcHV0ZWQtcHJvcGVydHlcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG52YXIgc2hhcmVkTWV0aG9kcyA9IHtcbiAgLy8gV2hlbiBhIGNoYW5nZSBldmVudCBwcm9wYWdhdGVzIHVwIHRoZSB0cmVlIGl0IG1vZGlmaWVzIHRoZSBwYXRoIHBhcnQgb2ZcbiAgLy8gYGNoYW5nZTo8cGF0aD5gIHRvIHJlZmxlY3QgdGhlIGZ1bGx5IHF1YWxpZmllZCBwYXRoIHJlbGF0aXZlIHRvIHRoYXQgb2JqZWN0LlxuICAvLyBFeDogV291bGQgdHJpZ2dlciBgY2hhbmdlOnZhbGAsIGBjaGFuZ2U6WzBdLnZhbGAsIGBjaGFuZ2U6YXJyWzBdLnZhbGAgYW5kIGBvYmouYXJyWzBdLnZhbGBcbiAgLy8gb24gZWFjaCBwYXJlbnQgYXMgaXQgaXMgcHJvcGFnYXRlZCB1cCB0aGUgdHJlZS5cbiAgcHJvcGFnYXRlRXZlbnQ6IGZ1bmN0aW9uKHR5cGUsIG1vZGVsKXtcbiAgICBpZih0aGlzLl9fcGFyZW50X18gPT09IHRoaXMgfHwgdHlwZSA9PT0gJ2RpcnR5JykgcmV0dXJuO1xuICAgIGlmKHR5cGUuaW5kZXhPZignY2hhbmdlOicpID09PSAwICYmIG1vZGVsLmlzTW9kZWwpe1xuICAgICAgaWYodGhpcy5pc0NvbGxlY3Rpb24gJiYgfnR5cGUuaW5kZXhPZignY2hhbmdlOlsnKSkgcmV0dXJuO1xuICAgICAgdmFyIGtleSxcbiAgICAgICAgICBwYXRoID0gbW9kZWwuX19wYXRoKCkucmVwbGFjZSh0aGlzLl9fcGFyZW50X18uX19wYXRoKCksICcnKS5yZXBsYWNlKC9eXFwuLywgJycpLFxuICAgICAgICAgIGNoYW5nZWQgPSBtb2RlbC5jaGFuZ2VkQXR0cmlidXRlcygpO1xuXG4gICAgICBmb3Ioa2V5IGluIGNoYW5nZWQpe1xuICAgICAgICBhcmd1bWVudHNbMF0gPSAoJ2NoYW5nZTonICsgcGF0aCArIChwYXRoICYmICcuJykgKyBrZXkpOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgdGhpcy5fX3BhcmVudF9fLnRyaWdnZXIuYXBwbHkodGhpcy5fX3BhcmVudF9fLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3BhcmVudF9fLnRyaWdnZXIuYXBwbHkodGhpcy5fX3BhcmVudF9fLCBhcmd1bWVudHMpO1xuICB9LFxuXG4gIC8vIFNldCB0aGlzIGRhdGEgb2JqZWN0J3MgcGFyZW50IHRvIGBwYXJlbnRgIGFuZCwgYXMgbG9uZyBhcyBhIGRhdGEgb2JqZWN0IGlzXG4gIC8vIG5vdCBpdHMgb3duIHBhcmVudCwgcHJvcGFnYXRlIGV2ZXJ5IGV2ZW50IHRyaWdnZXJlZCBvbiBgdGhpc2AgdXAgdGhlIHRyZWUuXG4gIHNldFBhcmVudDogZnVuY3Rpb24ocGFyZW50KXtcbiAgICBpZih0aGlzLl9fcGFyZW50X18pIHRoaXMub2ZmKCdhbGwnLCB0aGlzLnByb3BhZ2F0ZUV2ZW50KTtcbiAgICB0aGlzLl9fcGFyZW50X18gPSBwYXJlbnQ7XG4gICAgdGhpcy5faGFzQW5jZXN0cnkgPSB0cnVlO1xuICAgIGlmKHBhcmVudCAhPT0gdGhpcykgdGhpcy5vbignYWxsJywgdGhpcy5fX3BhcmVudF9fLnByb3BhZ2F0ZUV2ZW50KTtcbiAgICByZXR1cm4gcGFyZW50O1xuICB9LFxuXG4gIC8vIFJlY3Vyc2l2ZWx5IHNldCBhIGRhdGEgdHJlZSdzIHJvb3QgZWxlbWVudCBzdGFydGluZyB3aXRoIGB0aGlzYCB0byB0aGUgZGVlcGVzdCBjaGlsZC5cbiAgLy8gVE9ETzogSSBkb250IGxpa2UgdGhpcyByZWN1cnNpdmVseSBzZXR0aW5nIGVsZW1lbnRzIHJvb3Qgd2hlbiBvbmUgZWxlbWVudCdzIHJvb3QgY2hhbmdlcy4gRml4IHRoaXMuXG4gIHNldFJvb3Q6IGZ1bmN0aW9uIChyb290KXtcbiAgICB2YXIgb2JqID0gdGhpcztcbiAgICBvYmouX19yb290X18gPSByb290O1xuICAgIHZhciB2YWwgPSBvYmoubW9kZWxzIHx8ICBvYmouYXR0cmlidXRlcyB8fCBvYmouY2FjaGU7XG4gICAgXy5lYWNoKHZhbCwgZnVuY3Rpb24odmFsdWUsIGtleSl7XG4gICAgICBpZih2YWx1ZSAmJiB2YWx1ZS5pc0RhdGEpe1xuICAgICAgICB2YWx1ZS5zZXRSb290KHJvb3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByb290O1xuICB9LFxuXG4gIC8vIFRlc3RzIHRvIHNlZSBpZiBgdGhpc2AgaGFzIGEgcGFyZW50IGBvYmpgLlxuICBoYXNQYXJlbnQ6IGZ1bmN0aW9uKG9iail7XG4gICAgdmFyIHRtcCA9IHRoaXM7XG4gICAgd2hpbGUodG1wICE9PSBvYmope1xuICAgICAgdG1wID0gdG1wLl9fcGFyZW50X187XG4gICAgICBpZihfLmlzVW5kZWZpbmVkKHRtcCkpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmKHRtcCA9PT0gb2JqKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmKHRtcC5fX3BhcmVudF9fID09PSB0bXApIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgLy8gRGUtaW5pdGlhbGl6ZXMgYSBkYXRhIHRyZWUgc3RhcnRpbmcgd2l0aCBgdGhpc2AgYW5kIHJlY3Vyc2l2ZWx5IGNhbGxpbmcgYGRlaW5pdGlhbGl6ZSgpYCBvbiBlYWNoIGNoaWxkLlxuICBkZWluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcblxuICAvLyBVbmRlbGVnYXRlIEJhY2tib25lIEV2ZW50cyBmcm9tIHRoaXMgZGF0YSBvYmplY3RcbiAgICBpZiAodGhpcy51bmRlbGVnYXRlRXZlbnRzKSB0aGlzLnVuZGVsZWdhdGVFdmVudHMoKTtcbiAgICBpZiAodGhpcy5zdG9wTGlzdGVuaW5nKSB0aGlzLnN0b3BMaXN0ZW5pbmcoKTtcbiAgICBpZiAodGhpcy5vZmYpIHRoaXMub2ZmKCk7XG5cbiAgLy8gRGVzdHJveSB0aGlzIGRhdGEgb2JqZWN0J3MgbGluZWFnZVxuICAgIGRlbGV0ZSB0aGlzLl9fcGFyZW50X187XG4gICAgZGVsZXRlIHRoaXMuX19yb290X187XG4gICAgZGVsZXRlIHRoaXMuX19wYXRoO1xuXG4gIC8vIElmIHRoZXJlIGlzIGEgZG9tIGVsZW1lbnQgYXNzb2NpYXRlZCB3aXRoIHRoaXMgZGF0YSBvYmplY3QsIGRlc3Ryb3kgYWxsIGxpc3RlbmVycyBhc3NvY2lhdGVkIHdpdGggaXQuXG4gIC8vIFJlbW92ZSBhbGwgZXZlbnQgbGlzdGVuZXJzIGZyb20gdGhpcyBkb20gZWxlbWVudCwgcmVjdXJzaXZlbHkgcmVtb3ZlIGVsZW1lbnQgbGF6eXZhbHVlcyxcbiAgLy8gYW5kIHRoZW4gcmVtb3ZlIHRoZSBlbGVtZW50IHJlZmVyYW5jZSBpdHNlbGYuXG4gICAgaWYodGhpcy5lbCl7XG4gICAgICBfLmVhY2godGhpcy5lbC5fX2xpc3RlbmVycywgZnVuY3Rpb24oaGFuZGxlciwgZXZlbnRUeXBlKXtcbiAgICAgICAgaWYgKHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcikgdGhpcy5lbC5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgaGFuZGxlciwgZmFsc2UpO1xuICAgICAgICBpZiAodGhpcy5lbC5kZXRhY2hFdmVudCkgdGhpcy5lbC5kZXRhY2hFdmVudCgnb24nK2V2ZW50VHlwZSwgaGFuZGxlcik7XG4gICAgICB9LCB0aGlzKTtcbiAgICAgICQodGhpcy5lbCkud2Fsa1RoZURPTShmdW5jdGlvbihlbCl7XG4gICAgICAgIGlmKGVsLl9fbGF6eVZhbHVlICYmIGVsLl9fbGF6eVZhbHVlLmRlc3Ryb3koKSkgbi5fX2xhenlWYWx1ZS5kZXN0cm95KCk7XG4gICAgICB9KTtcbiAgICAgIGRlbGV0ZSB0aGlzLmVsLl9fbGlzdGVuZXJzO1xuICAgICAgZGVsZXRlIHRoaXMuZWwuX19ldmVudHM7XG4gICAgICBkZWxldGUgdGhpcy4kZWw7XG4gICAgICBkZWxldGUgdGhpcy5lbDtcbiAgICB9XG5cbiAgLy8gQ2xlYW4gdXAgSG9vayBjYWxsYmFjayByZWZlcmVuY2VzXG4gICAgZGVsZXRlIHRoaXMuX19vYnNlcnZlcnM7XG5cbiAgLy8gTWFyayBhcyBkZWluaXRpYWxpemVkIHNvIHdlIGRvbid0IGxvb3Agb24gY3ljbGljIGRlcGVuZGFuY2llcy5cbiAgICB0aGlzLmRlaW5pdGlhbGl6ZWQgPSB0cnVlO1xuXG4gIC8vIERlc3Ryb3kgYWxsIGNoaWxkcmVuIG9mIHRoaXMgZGF0YSBvYmplY3QuXG4gIC8vIElmIGEgQ29sbGVjdGlvbiwgZGUtaW5pdCBhbGwgb2YgaXRzIE1vZGVscywgaWYgYSBNb2RlbCwgZGUtaW5pdCBhbGwgb2YgaXRzXG4gIC8vIEF0dHJpYnV0ZXMsIGlmIGEgQ29tcHV0ZWQgUHJvcGVydHksIGRlLWluaXQgaXRzIENhY2hlIG9iamVjdHMuXG4gICAgXy5lYWNoKHRoaXMubW9kZWxzLCBmdW5jdGlvbiAodmFsKSB7IHZhbCAmJiB2YWwuZGVpbml0aWFsaXplICYmIHZhbC5kZWluaXRpYWxpemUoKTsgfSk7XG4gICAgXy5lYWNoKHRoaXMuYXR0cmlidXRlcywgZnVuY3Rpb24gKHZhbCkgeyB2YWwgJiYgdmFsLmRlaW5pdGlhbGl6ZSAmJiB2YWwuZGVpbml0aWFsaXplKCk7fSk7XG4gICAgdGhpcy5jYWNoZSAmJiB0aGlzLmNhY2hlLmNvbGxlY3Rpb24uZGVpbml0aWFsaXplKCk7XG4gICAgdGhpcy5jYWNoZSAmJiB0aGlzLmNhY2hlLm1vZGVsLmRlaW5pdGlhbGl6ZSgpO1xuXG4gIH1cbn07XG5cbi8vIEV4dGVuZCBhbGwgb2YgdGhlICoqUmVib3VuZCBEYXRhKiogcHJvdG90eXBlcyB3aXRoIHRoZXNlIHNoYXJlZCBtZXRob2RzXG5fLmV4dGVuZChNb2RlbC5wcm90b3R5cGUsIHNoYXJlZE1ldGhvZHMpO1xuXy5leHRlbmQoQ29sbGVjdGlvbi5wcm90b3R5cGUsIHNoYXJlZE1ldGhvZHMpO1xuXy5leHRlbmQoQ29tcHV0ZWRQcm9wZXJ0eS5wcm90b3R5cGUsIHNoYXJlZE1ldGhvZHMpO1xuXG5leHBvcnQgeyBNb2RlbCwgQ29sbGVjdGlvbiwgQ29tcHV0ZWRQcm9wZXJ0eSB9O1xuIiwiLy8gUmVib3VuZCBVdGlsc1xuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgJCA9IGZ1bmN0aW9uKHF1ZXJ5KXtcbiAgcmV0dXJuIG5ldyB1dGlscyhxdWVyeSk7XG59O1xuXG52YXIgdXRpbHMgPSBmdW5jdGlvbihxdWVyeSl7XG4gIHZhciBpLCBzZWxlY3RvciA9IF8uaXNFbGVtZW50KHF1ZXJ5KSAmJiBbcXVlcnldIHx8IChxdWVyeSA9PT0gZG9jdW1lbnQpICYmIFtkb2N1bWVudF0gfHwgXy5pc1N0cmluZyhxdWVyeSkgJiYgcXVlcnlTZWxlY3RvckFsbChxdWVyeSkgfHwgW107XG4gIHRoaXMubGVuZ3RoID0gc2VsZWN0b3IubGVuZ3RoO1xuXG4gIC8vIEFkZCBzZWxlY3RvciB0byBvYmplY3QgZm9yIG1ldGhvZCBjaGFpbmluZ1xuICBmb3IgKGk9MDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHRoaXNbaV0gPSBzZWxlY3RvcltpXTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuZnVuY3Rpb24gcmV0dXJuRmFsc2UoKXtyZXR1cm4gZmFsc2U7fVxuZnVuY3Rpb24gcmV0dXJuVHJ1ZSgpe3JldHVybiB0cnVlO31cblxuJC5FdmVudCA9IGZ1bmN0aW9uKCBzcmMsIHByb3BzICkge1xuXHQvLyBBbGxvdyBpbnN0YW50aWF0aW9uIHdpdGhvdXQgdGhlICduZXcnIGtleXdvcmRcblx0aWYgKCAhKHRoaXMgaW5zdGFuY2VvZiAkLkV2ZW50KSApIHtcblx0XHRyZXR1cm4gbmV3ICQuRXZlbnQoIHNyYywgcHJvcHMgKTtcblx0fVxuXG5cdC8vIEV2ZW50IG9iamVjdFxuXHRpZiAoIHNyYyAmJiBzcmMudHlwZSApIHtcblx0XHR0aGlzLm9yaWdpbmFsRXZlbnQgPSBzcmM7XG5cdFx0dGhpcy50eXBlID0gc3JjLnR5cGU7XG5cblx0XHQvLyBFdmVudHMgYnViYmxpbmcgdXAgdGhlIGRvY3VtZW50IG1heSBoYXZlIGJlZW4gbWFya2VkIGFzIHByZXZlbnRlZFxuXHRcdC8vIGJ5IGEgaGFuZGxlciBsb3dlciBkb3duIHRoZSB0cmVlOyByZWZsZWN0IHRoZSBjb3JyZWN0IHZhbHVlLlxuXHRcdHRoaXMuaXNEZWZhdWx0UHJldmVudGVkID0gc3JjLmRlZmF1bHRQcmV2ZW50ZWQgfHxcblx0XHRcdFx0c3JjLmRlZmF1bHRQcmV2ZW50ZWQgPT09IHVuZGVmaW5lZCAmJlxuXHRcdFx0XHQvLyBTdXBwb3J0OiBBbmRyb2lkPDQuMFxuXHRcdFx0XHRzcmMucmV0dXJuVmFsdWUgPT09IGZhbHNlID9cblx0XHRcdHJldHVyblRydWUgOlxuXHRcdFx0cmV0dXJuRmFsc2U7XG5cblx0Ly8gRXZlbnQgdHlwZVxuXHR9IGVsc2Uge1xuXHRcdHRoaXMudHlwZSA9IHNyYztcblx0fVxuXG5cdC8vIFB1dCBleHBsaWNpdGx5IHByb3ZpZGVkIHByb3BlcnRpZXMgb250byB0aGUgZXZlbnQgb2JqZWN0XG5cdGlmICggcHJvcHMgKSB7XG5cdFx0Xy5leHRlbmQoIHRoaXMsIHByb3BzICk7XG5cdH1cblxuICAvLyBDb3B5IG92ZXIgYWxsIG9yaWdpbmFsIGV2ZW50IHByb3BlcnRpZXNcbiAgXy5leHRlbmQodGhpcywgXy5waWNrKCB0aGlzLm9yaWdpbmFsRXZlbnQsIFtcbiAgICAgIFwiYWx0S2V5XCIsIFwiYnViYmxlc1wiLCBcImNhbmNlbGFibGVcIiwgXCJjdHJsS2V5XCIsIFwiY3VycmVudFRhcmdldFwiLCBcImV2ZW50UGhhc2VcIixcbiAgICAgIFwibWV0YUtleVwiLCBcInJlbGF0ZWRUYXJnZXRcIiwgXCJzaGlmdEtleVwiLCBcInRhcmdldFwiLCBcInRpbWVTdGFtcFwiLCBcInZpZXdcIixcbiAgICAgIFwid2hpY2hcIiwgXCJjaGFyXCIsIFwiY2hhckNvZGVcIiwgXCJrZXlcIiwgXCJrZXlDb2RlXCIsIFwiYnV0dG9uXCIsIFwiYnV0dG9uc1wiLFxuICAgICAgXCJjbGllbnRYXCIsIFwiY2xpZW50WVwiLCBcIlwiLCBcIm9mZnNldFhcIiwgXCJvZmZzZXRZXCIsIFwicGFnZVhcIiwgXCJwYWdlWVwiLCBcInNjcmVlblhcIixcbiAgICAgIFwic2NyZWVuWVwiLCBcInRvRWxlbWVudFwiXG4gICAgXSkpO1xuXG5cdC8vIENyZWF0ZSBhIHRpbWVzdGFtcCBpZiBpbmNvbWluZyBldmVudCBkb2Vzbid0IGhhdmUgb25lXG5cdHRoaXMudGltZVN0YW1wID0gc3JjICYmIHNyYy50aW1lU3RhbXAgfHwgKG5ldyBEYXRlKCkpLmdldFRpbWUoKTtcblxuXHQvLyBNYXJrIGl0IGFzIGZpeGVkXG5cdHRoaXMuaXNFdmVudCA9IHRydWU7XG59O1xuXG4kLkV2ZW50LnByb3RvdHlwZSA9IHtcblx0Y29uc3RydWN0b3I6ICQuRXZlbnQsXG5cdGlzRGVmYXVsdFByZXZlbnRlZDogcmV0dXJuRmFsc2UsXG5cdGlzUHJvcGFnYXRpb25TdG9wcGVkOiByZXR1cm5GYWxzZSxcblx0aXNJbW1lZGlhdGVQcm9wYWdhdGlvblN0b3BwZWQ6IHJldHVybkZhbHNlLFxuXG5cdHByZXZlbnREZWZhdWx0OiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZSA9IHRoaXMub3JpZ2luYWxFdmVudDtcblxuXHRcdHRoaXMuaXNEZWZhdWx0UHJldmVudGVkID0gcmV0dXJuVHJ1ZTtcblxuXHRcdGlmICggZSAmJiBlLnByZXZlbnREZWZhdWx0ICkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblx0fSxcblx0c3RvcFByb3BhZ2F0aW9uOiBmdW5jdGlvbigpIHtcblx0XHR2YXIgZSA9IHRoaXMub3JpZ2luYWxFdmVudDtcblxuXHRcdHRoaXMuaXNQcm9wYWdhdGlvblN0b3BwZWQgPSByZXR1cm5UcnVlO1xuXG5cdFx0aWYgKCBlICYmIGUuc3RvcFByb3BhZ2F0aW9uICkge1xuXHRcdFx0ZS5zdG9wUHJvcGFnYXRpb24oKTtcblx0XHR9XG5cdH0sXG5cdHN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGUgPSB0aGlzLm9yaWdpbmFsRXZlbnQ7XG5cblx0XHR0aGlzLmlzSW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkID0gcmV0dXJuVHJ1ZTtcblxuXHRcdGlmICggZSAmJiBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbiApIHtcblx0XHRcdGUuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG5cdFx0fVxuXG5cdFx0dGhpcy5zdG9wUHJvcGFnYXRpb24oKTtcblx0fVxufTtcblxuXG51dGlscy5wcm90b3R5cGUgPSB7XG5cbiAgLy8gR2l2ZW4gYSB2YWxpZCBkYXRhIHBhdGgsIHNwbGl0IGl0IGludG8gYW4gYXJyYXkgb2YgaXRzIHBhcnRzLlxuICAvLyBleDogZm9vLmJhclswXS5iYXogLS0+IFsnZm9vJywgJ3ZhcicsICcwJywgJ2JheiddXG4gIHNwbGl0UGF0aDogZnVuY3Rpb24ocGF0aCl7XG4gICAgcGF0aCA9ICgnLicrcGF0aCsnLicpLnNwbGl0KC8oPzpcXC58XFxbfFxcXSkrLyk7XG4gICAgcGF0aC5wb3AoKTtcbiAgICBwYXRoLnNoaWZ0KCk7XG4gICAgcmV0dXJuIHBhdGg7XG4gIH0sXG5cbiAgLy8gQXBwbGllcyBmdW5jdGlvbiBgZnVuY2AgZGVwdGggZmlyc3QgdG8gZXZlcnkgbm9kZSBpbiB0aGUgc3VidHJlZSBzdGFydGluZyBmcm9tIGByb290YFxuICB3YWxrVGhlRE9NOiBmdW5jdGlvbihmdW5jKSB7XG4gICAgdmFyIGVsLCByb290LCBsZW4gPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZShsZW4tLSl7XG4gICAgICByb290ID0gdGhpc1tsZW5dO1xuICAgICAgZnVuYyhyb290KTtcbiAgICAgIHJvb3QgPSByb290LmZpcnN0Q2hpbGQ7XG4gICAgICB3aGlsZSAocm9vdCkge1xuICAgICAgICAgICQocm9vdCkud2Fsa1RoZURPTShmdW5jKTtcbiAgICAgICAgICByb290ID0gcm9vdC5uZXh0U2libGluZztcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLy8gRXZlbnRzIHJlZ2lzdHJ5LiBBbiBvYmplY3QgY29udGFpbmluZyBhbGwgZXZlbnRzIGJvdW5kIHRocm91Z2ggdGhpcyB1dGlsIHNoYXJlZCBhbW9uZyBhbGwgaW5zdGFuY2VzLlxuICBfZXZlbnRzOiB7fSxcblxuICAvLyBUYWtlcyB0aGUgdGFyZ2VkIHRoZSBldmVudCBmaXJlZCBvbiBhbmQgcmV0dXJucyBhbGwgY2FsbGJhY2tzIGZvciB0aGUgZGVsZWdhdGVkIGVsZW1lbnRcbiAgX2hhc0RlbGVnYXRlOiBmdW5jdGlvbih0YXJnZXQsIGRlbGVnYXRlLCBldmVudFR5cGUpe1xuICAgIHZhciBjYWxsYmFja3MgPSBbXTtcblxuICAgIC8vIEdldCBvdXIgY2FsbGJhY2tzXG4gICAgaWYodGFyZ2V0LmRlbGVnYXRlR3JvdXAgJiYgdGhpcy5fZXZlbnRzW3RhcmdldC5kZWxlZ2F0ZUdyb3VwXVtldmVudFR5cGVdKXtcbiAgICAgIF8uZWFjaCh0aGlzLl9ldmVudHNbdGFyZ2V0LmRlbGVnYXRlR3JvdXBdW2V2ZW50VHlwZV0sIGZ1bmN0aW9uKGNhbGxiYWNrc0xpc3QsIGRlbGVnYXRlSWQpe1xuICAgICAgICBpZihfLmlzQXJyYXkoY2FsbGJhY2tzTGlzdCkgJiYgKGRlbGVnYXRlSWQgPT09IGRlbGVnYXRlLmRlbGVnYXRlSWQgfHwgKCBkZWxlZ2F0ZS5tYXRjaGVzU2VsZWN0b3IgJiYgZGVsZWdhdGUubWF0Y2hlc1NlbGVjdG9yKGRlbGVnYXRlSWQpICkpICl7XG4gICAgICAgICAgY2FsbGJhY2tzID0gY2FsbGJhY2tzLmNvbmNhdChjYWxsYmFja3NMaXN0KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNhbGxiYWNrcztcbiAgfSxcblxuICAvLyBUcmlnZ2VycyBhbiBldmVudCBvbiBhIGdpdmVuIGRvbSBub2RlXG4gIHRyaWdnZXI6IGZ1bmN0aW9uKGV2ZW50TmFtZSwgb3B0aW9ucyl7XG4gICAgdmFyIGVsLCBsZW4gPSB0aGlzLmxlbmd0aDtcbiAgICB3aGlsZShsZW4tLSl7XG4gICAgICBlbCA9IHRoaXNbbGVuXTtcbiAgICAgIGlmIChkb2N1bWVudC5jcmVhdGVFdmVudCkge1xuICAgICAgICB2YXIgZXZlbnQgPSBkb2N1bWVudC5jcmVhdGVFdmVudCgnSFRNTEV2ZW50cycpO1xuICAgICAgICBldmVudC5pbml0RXZlbnQoZXZlbnROYW1lLCB0cnVlLCBmYWxzZSk7XG4gICAgICAgIGVsLmRpc3BhdGNoRXZlbnQoZXZlbnQpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZWwuZmlyZUV2ZW50KCdvbicrZXZlbnROYW1lKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgb2ZmOiBmdW5jdGlvbihldmVudFR5cGUsIGhhbmRsZXIpe1xuICAgIHZhciBlbCwgbGVuID0gdGhpcy5sZW5ndGgsIGV2ZW50Q291bnQ7XG5cbiAgICB3aGlsZShsZW4tLSl7XG5cbiAgICAgIGVsID0gdGhpc1tsZW5dO1xuICAgICAgZXZlbnRDb3VudCA9IDA7XG5cbiAgICAgIGlmKGVsLmRlbGVnYXRlR3JvdXApe1xuICAgICAgICBpZih0aGlzLl9ldmVudHNbZWwuZGVsZWdhdGVHcm91cF1bZXZlbnRUeXBlXSAmJiBfLmlzQXJyYXkodGhpcy5fZXZlbnRzW2VsLmRlbGVnYXRlR3JvdXBdW2V2ZW50VHlwZV1bZWwuZGVsZWdhdGVJZF0pKXtcbiAgICAgICAgICBfLmVhY2godGhpcy5fZXZlbnRzW2VsLmRlbGVnYXRlR3JvdXBdW2V2ZW50VHlwZV0sIGZ1bmN0aW9uKGRlbGVnYXRlLCBpbmRleCwgZGVsZWdhdGVMaXN0KXtcbiAgICAgICAgICAgIF8uZWFjaChkZWxlZ2F0ZUxpc3QsIGZ1bmN0aW9uKGNhbGxiYWNrLCBpbmRleCwgY2FsbGJhY2tMaXN0KXtcbiAgICAgICAgICAgICAgaWYoY2FsbGJhY2sgPT09IGhhbmRsZXIpe1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBjYWxsYmFja0xpc3RbaW5kZXhdO1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBldmVudENvdW50Kys7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiB0aGVyZSBhcmUgbm8gbW9yZSBvZiB0aGlzIGV2ZW50IHR5cGUgZGVsZWdhdGVkIGZvciB0aGlzIGdyb3VwLCByZW1vdmUgdGhlIGxpc3RlbmVyXG4gICAgICBpZiAoZXZlbnRDb3VudCA9PT0gMCAmJiBlbC5yZW1vdmVFdmVudExpc3RlbmVyKXtcbiAgICAgICAgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgIH1cbiAgICAgIGlmIChldmVudENvdW50ID09PSAwICYmIGVsLmRldGFjaEV2ZW50KXtcbiAgICAgICAgZWwuZGV0YWNoRXZlbnQoJ29uJytldmVudFR5cGUsIGhhbmRsZXIpO1xuICAgICAgfVxuXG4gICAgfVxuICB9LFxuXG4gIG9uOiBmdW5jdGlvbiAoZXZlbnROYW1lLCBkZWxlZ2F0ZSwgZGF0YSwgaGFuZGxlcikge1xuICAgIHZhciBlbCxcbiAgICAgICAgZXZlbnRzID0gdGhpcy5fZXZlbnRzLFxuICAgICAgICBsZW4gPSB0aGlzLmxlbmd0aCxcbiAgICAgICAgZXZlbnROYW1lcyA9IGV2ZW50TmFtZS5zcGxpdCgnICcpLFxuICAgICAgICBkZWxlZ2F0ZUlkLCBkZWxlZ2F0ZUdyb3VwO1xuXG4gICAgd2hpbGUobGVuLS0pe1xuICAgICAgZWwgPSB0aGlzW2xlbl07XG5cbiAgICAgIC8vIE5vcm1hbGl6ZSBkYXRhIGlucHV0XG4gICAgICBpZihfLmlzRnVuY3Rpb24oZGVsZWdhdGUpKXtcbiAgICAgICAgaGFuZGxlciA9IGRlbGVnYXRlO1xuICAgICAgICBkZWxlZ2F0ZSA9IGVsO1xuICAgICAgICBkYXRhID0ge307XG4gICAgICB9XG4gICAgICBpZihfLmlzRnVuY3Rpb24oZGF0YSkpe1xuICAgICAgICBoYW5kbGVyID0gZGF0YTtcbiAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgfVxuICAgICAgaWYoIV8uaXNTdHJpbmcoZGVsZWdhdGUpICYmICFfLmlzRWxlbWVudChkZWxlZ2F0ZSkpe1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRGVsZWdhdGUgdmFsdWUgcGFzc2VkIHRvIFJlYm91bmQncyAkLm9uIGlzIG5laXRoZXIgYW4gZWxlbWVudCBvciBjc3Mgc2VsZWN0b3JcIik7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZGVsZWdhdGVJZCA9IF8uaXNTdHJpbmcoZGVsZWdhdGUpID8gZGVsZWdhdGUgOiAoZGVsZWdhdGUuZGVsZWdhdGVJZCA9IGRlbGVnYXRlLmRlbGVnYXRlSWQgfHwgXy51bmlxdWVJZCgnZXZlbnQnKSk7XG4gICAgICBkZWxlZ2F0ZUdyb3VwID0gZWwuZGVsZWdhdGVHcm91cCA9IChlbC5kZWxlZ2F0ZUdyb3VwIHx8IF8udW5pcXVlSWQoJ2RlbGVnYXRlR3JvdXAnKSk7XG5cbiAgICAgIF8uZWFjaChldmVudE5hbWVzLCBmdW5jdGlvbihldmVudE5hbWUpe1xuXG4gICAgICAgIC8vIEVuc3VyZSBldmVudCBvYmogZXhpc3RhbmNlXG4gICAgICAgIGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXSA9IGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXSB8fCB7fTtcblxuICAgICAgICAvLyBUT0RPOiB0YWtlIG91dCBvZiBsb29wXG4gICAgICAgIHZhciBjYWxsYmFjayA9IGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgICAgdmFyIHRhcmdldCwgaSwgbGVuLCBldmVudExpc3QsIGNhbGxiYWNrcywgY2FsbGJhY2ssIGZhbHN5O1xuICAgICAgICAgICAgICBldmVudCA9IG5ldyAkLkV2ZW50KChldmVudCB8fCB3aW5kb3cuZXZlbnQpKTsgLy8gQ29udmVydCB0byBtdXRhYmxlIGV2ZW50XG4gICAgICAgICAgICAgIHRhcmdldCA9IGV2ZW50LnRhcmdldCB8fCBldmVudC5zcmNFbGVtZW50O1xuXG4gICAgICAgICAgICAgIC8vIFRyYXZlbCBmcm9tIHRhcmdldCB1cCB0byBwYXJlbnQgZmlyaW5nIGV2ZW50IG9uIGRlbGVnYXRlIHdoZW4gaXQgZXhpenRzXG4gICAgICAgICAgICAgIHdoaWxlKHRhcmdldCl7XG5cbiAgICAgICAgICAgICAgICAvLyBHZXQgYWxsIHNwZWNpZmllZCBjYWxsYmFja3MgKGVsZW1lbnQgc3BlY2lmaWMgYW5kIHNlbGVjdG9yIHNwZWNpZmllZClcbiAgICAgICAgICAgICAgICBjYWxsYmFja3MgPSAkLl9oYXNEZWxlZ2F0ZShlbCwgdGFyZ2V0LCBldmVudC50eXBlKTtcblxuICAgICAgICAgICAgICAgIGxlbiA9IGNhbGxiYWNrcy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgZm9yKGk9MDtpPGxlbjtpKyspe1xuICAgICAgICAgICAgICAgICAgZXZlbnQudGFyZ2V0ID0gZXZlbnQuc3JjRWxlbWVudCA9IHRhcmdldDsgICAgICAgICAgICAgICAvLyBBdHRhY2ggdGhpcyBsZXZlbCdzIHRhcmdldFxuICAgICAgICAgICAgICAgICAgZXZlbnQuZGF0YSA9IGNhbGxiYWNrc1tpXS5kYXRhOyAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBdHRhY2ggb3VyIGRhdGEgdG8gdGhlIGV2ZW50XG4gICAgICAgICAgICAgICAgICBldmVudC5yZXN1bHQgPSBjYWxsYmFja3NbaV0uY2FsbGJhY2suY2FsbChlbCwgZXZlbnQpOyAgIC8vIENhbGwgdGhlIGNhbGxiYWNrXG4gICAgICAgICAgICAgICAgICBmYWxzeSA9ICggZXZlbnQucmVzdWx0ID09PSBmYWxzZSApID8gdHJ1ZSA6IGZhbHN5OyAgICAgIC8vIElmIGFueSBjYWxsYmFjayByZXR1cm5zIGZhbHNlLCBsb2cgaXQgYXMgZmFsc3lcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBJZiBhbnkgb2YgdGhlIGNhbGxiYWNrcyByZXR1cm5lZCBmYWxzZSwgcHJldmVudCBkZWZhdWx0IGFuZCBzdG9wIHByb3BhZ2F0aW9uXG4gICAgICAgICAgICAgICAgaWYoZmFsc3kpe1xuICAgICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRhcmdldCA9IHRhcmdldC5wYXJlbnROb2RlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIC8vIElmIHRoaXMgaXMgdGhlIGZpcnN0IGV2ZW50IG9mIGl0cyB0eXBlLCBhZGQgdGhlIGV2ZW50IGhhbmRsZXJcbiAgICAgICAgLy8gQWRkRXZlbnRMaXN0ZW5lciBzdXBwb3J0cyBJRTkrXG4gICAgICAgIGlmKCFldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXSl7XG4gICAgICAgICAgLy8gSWYgZXZlbnQgaXMgZm9jdXMgb3IgYmx1ciwgdXNlIGNhcHR1cmUgdG8gYWxsb3cgZm9yIGV2ZW50IGRlbGVnYXRpb24uXG4gICAgICAgICAgZWwuYWRkRXZlbnRMaXN0ZW5lcihldmVudE5hbWUsIGNhbGxiYWNrLCAoZXZlbnROYW1lID09PSAnZm9jdXMnIHx8IGV2ZW50TmFtZSA9PT0gJ2JsdXInKSk7XG4gICAgICAgIH1cblxuXG4gICAgICAgIC8vIEFkZCBvdXIgbGlzdGVuZXJcbiAgICAgICAgZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV0gPSBldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXSB8fCB7fTtcbiAgICAgICAgZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV1bZGVsZWdhdGVJZF0gPSBldmVudHNbZGVsZWdhdGVHcm91cF1bZXZlbnROYW1lXVtkZWxlZ2F0ZUlkXSB8fCBbXTtcbiAgICAgICAgZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV1bZGVsZWdhdGVJZF0ucHVzaCh7Y2FsbGJhY2s6IGhhbmRsZXIsIGRhdGE6IGRhdGF9KTtcblxuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuICB9LFxuXG4gIGZsYXR0ZW46IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICB2YXIgcmVzdWx0ID0ge307XG4gICAgZnVuY3Rpb24gcmVjdXJzZSAoY3VyLCBwcm9wKSB7XG4gICAgICBpZiAoT2JqZWN0KGN1cikgIT09IGN1cikge1xuICAgICAgICByZXN1bHRbcHJvcF0gPSBjdXI7XG4gICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoY3VyKSkge1xuICAgICAgICBmb3IodmFyIGk9MCwgbD1jdXIubGVuZ3RoOyBpPGw7IGkrKylcbiAgICAgICAgICByZWN1cnNlKGN1cltpXSwgcHJvcCArIFwiW1wiICsgaSArIFwiXVwiKTtcbiAgICAgICAgICBpZiAobCA9PT0gMClcbiAgICAgICAgICAgIHJlc3VsdFtwcm9wXSA9IFtdO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgaXNFbXB0eSA9IHRydWU7XG4gICAgICAgICAgICBmb3IgKHZhciBwIGluIGN1cikge1xuICAgICAgICAgICAgICBpc0VtcHR5ID0gZmFsc2U7XG4gICAgICAgICAgICAgIHJlY3Vyc2UoY3VyW3BdLCBwcm9wID8gcHJvcCtcIi5cIitwIDogcCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaXNFbXB0eSAmJiBwcm9wKVxuICAgICAgICAgICAgICByZXN1bHRbcHJvcF0gPSB7fTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmVjdXJzZShkYXRhLCBcIlwiKTtcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuXG4gIC8vIGh0dHA6Ly9rcmFzaW1pcnRzb25ldi5jb20vYmxvZy9hcnRpY2xlL0Nyb3NzLWJyb3dzZXItaGFuZGxpbmctb2YtQWpheC1yZXF1ZXN0cy1pbi1hYnN1cmRqc1xuICBhamF4OiBmdW5jdGlvbihvcHMpIHtcbiAgICAgIGlmKHR5cGVvZiBvcHMgPT0gJ3N0cmluZycpIG9wcyA9IHsgdXJsOiBvcHMgfTtcbiAgICAgIG9wcy51cmwgPSBvcHMudXJsIHx8ICcnO1xuICAgICAgb3BzLmpzb24gPSBvcHMuanNvbiB8fCB0cnVlO1xuICAgICAgb3BzLm1ldGhvZCA9IG9wcy5tZXRob2QgfHwgJ2dldCc7XG4gICAgICBvcHMuZGF0YSA9IG9wcy5kYXRhIHx8IHt9O1xuICAgICAgdmFyIGdldFBhcmFtcyA9IGZ1bmN0aW9uKGRhdGEsIHVybCkge1xuICAgICAgICAgIHZhciBhcnIgPSBbXSwgc3RyO1xuICAgICAgICAgIGZvcih2YXIgbmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgIGFyci5wdXNoKG5hbWUgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoZGF0YVtuYW1lXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdHIgPSBhcnIuam9pbignJicpO1xuICAgICAgICAgIGlmKHN0ciAhPT0gJycpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHVybCA/ICh1cmwuaW5kZXhPZignPycpIDwgMCA/ICc/JyArIHN0ciA6ICcmJyArIHN0cikgOiBzdHI7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgIH07XG4gICAgICB2YXIgYXBpID0ge1xuICAgICAgICAgIGhvc3Q6IHt9LFxuICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG9wcykge1xuICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgIHRoaXMueGhyID0gbnVsbDtcbiAgICAgICAgICAgICAgaWYod2luZG93LkFjdGl2ZVhPYmplY3QpIHsgdGhpcy54aHIgPSBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTsgfVxuICAgICAgICAgICAgICBlbHNlIGlmKHdpbmRvdy5YTUxIdHRwUmVxdWVzdCkgeyB0aGlzLnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpOyB9XG4gICAgICAgICAgICAgIGlmKHRoaXMueGhyKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLnhoci5yZWFkeVN0YXRlID09IDQgJiYgc2VsZi54aHIuc3RhdHVzID09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gc2VsZi54aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZihvcHMuanNvbiA9PT0gdHJ1ZSAmJiB0eXBlb2YgSlNPTiAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZG9uZUNhbGxiYWNrICYmIHNlbGYuZG9uZUNhbGxiYWNrLmFwcGx5KHNlbGYuaG9zdCwgW3Jlc3VsdCwgc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3BzLnN1Y2Nlc3MgJiYgb3BzLnN1Y2Nlc3MuYXBwbHkoc2VsZi5ob3N0LCBbcmVzdWx0LCBzZWxmLnhocl0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihzZWxmLnhoci5yZWFkeVN0YXRlID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mYWlsQ2FsbGJhY2sgJiYgc2VsZi5mYWlsQ2FsbGJhY2suYXBwbHkoc2VsZi5ob3N0LCBbc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3BzLmVycm9yICYmIG9wcy5lcnJvci5hcHBseShzZWxmLmhvc3QsIFtzZWxmLnhocl0pO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBzZWxmLmFsd2F5c0NhbGxiYWNrICYmIHNlbGYuYWx3YXlzQ2FsbGJhY2suYXBwbHkoc2VsZi5ob3N0LCBbc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICBvcHMuY29tcGxldGUgJiYgb3BzLmNvbXBsZXRlLmFwcGx5KHNlbGYuaG9zdCwgW3NlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKG9wcy5tZXRob2QgPT0gJ2dldCcpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMueGhyLm9wZW4oXCJHRVRcIiwgb3BzLnVybCArIGdldFBhcmFtcyhvcHMuZGF0YSwgb3BzLnVybCksIHRydWUpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXJzKHtcbiAgICAgICAgICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLVdpdGgnOiAnWE1MSHR0cFJlcXVlc3QnXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMueGhyLm9wZW4ob3BzLm1ldGhvZCwgb3BzLnVybCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLnNldEhlYWRlcnMoe1xuICAgICAgICAgICAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAnQ29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKG9wcy5oZWFkZXJzICYmIHR5cGVvZiBvcHMuaGVhZGVycyA9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXJzKG9wcy5oZWFkZXJzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgb3BzLm1ldGhvZCA9PSAnZ2V0JyA/IHNlbGYueGhyLnNlbmQoKSA6IHNlbGYueGhyLnNlbmQoZ2V0UGFyYW1zKG9wcy5kYXRhKSk7XG4gICAgICAgICAgICAgIH0sIDIwKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMueGhyO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZG9uZTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgdGhpcy5kb25lQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBmYWlsOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICB0aGlzLmZhaWxDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFsd2F5czogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgdGhpcy5hbHdheXNDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldEhlYWRlcnM6IGZ1bmN0aW9uKGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgZm9yKHZhciBuYW1lIGluIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMueGhyICYmIHRoaXMueGhyLnNldFJlcXVlc3RIZWFkZXIobmFtZSwgaGVhZGVyc1tuYW1lXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGFwaS5wcm9jZXNzKG9wcyk7XG4gIH1cbn07XG5cbl8uZXh0ZW5kKCQsIHV0aWxzLnByb3RvdHlwZSk7XG5cblxuXG5leHBvcnQgZGVmYXVsdCAkO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
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
