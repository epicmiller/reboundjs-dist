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
    morph = options.placeholder.firstChildMorph,
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

    // For each item in this collection
    for (i = 0; i < value.length; i++) {
      obj = value[i];
      next = morph ? morph.nextMorph : null;

      // If this morph is the rendered version of this model, continue to the next one.
      if (morph && morph.cid == obj.cid) {
        morph = next;continue;
      }

      // Create a lazyvalue whos value is the content inside our block helper rendered in the context of this current list object. Returns the rendered dom for this list item.
      lazyValue = new LazyValue(function () {
        return options.template.render(obj, options, options.placeholder.contextualElement, [obj]);
      }, { morph: options.placeholder });

      // Insert our newly rendered value (a document tree) into our placeholder (the containing element) at its requested position (where we currently are in the object list)
      nmorph = options.placeholder.insertContentBeforeMorph(lazyValue.value(), morph);

      // Label the inserted morph element with this model's cid
      nmorph.cid = obj.cid;

      // Destroy the old morph that was here
      morph && morph.destroy();

      // Move on to the next morph
      morph = next;
    }

    // // If any more morphs are left over, remove them. We've already gone through all the models.
    while (morph) {
      next = morph.nextMorph;
      morph.destroy();
      morph = next;
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
        morph.appendContent(value);
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
        morph.appendContent(value);
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
        morph.appendContent(value);
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
        morph.appendContent(value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByb3BlcnR5LWNvbXBpbGVyL3Byb3BlcnR5LWNvbXBpbGVyLmpzIiwicmVib3VuZC1jb21waWxlci9yZWJvdW5kLWNvbXBpbGVyLmpzIiwicmVib3VuZC1jb21wb25lbnQvY29tcG9uZW50LmpzIiwicmVib3VuZC1kYXRhL2NvbGxlY3Rpb24uanMiLCJyZWJvdW5kLXByZWNvbXBpbGVyL3JlYm91bmQtcHJlY29tcGlsZXIuanMiLCJyZWJvdW5kLXJvdXRlci9yZWJvdW5kLXJvdXRlci5qcyIsInJ1bnRpbWUuanMiLCJwcm9wZXJ0eS1jb21waWxlci90b2tlbml6ZXIuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9oZWxwZXJzLmpzIiwicmVib3VuZC1kYXRhL2NvbXB1dGVkLXByb3BlcnR5LmpzIiwicmVib3VuZC1jb21wb25lbnQvaG9va3MuanMiLCJyZWJvdW5kLWRhdGEvbW9kZWwuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9sYXp5LXZhbHVlLmpzIiwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YS5qcyIsInJlYm91bmQtY29tcG9uZW50L3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztNQUdPLFNBQVM7O0FBRWhCLE1BQUksa0JBQWtCLEdBQUcsRUFBRSxDQUFDOzs7O0FBSTVCLFdBQVMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUIsUUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDOztBQUVoQixRQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDOztBQUV2QyxRQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFOztBQUNyQixhQUFTLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFDbkMsTUFBTSxHQUFHLEVBQUU7UUFDWCxLQUFLO1FBQ0wsYUFBYSxHQUFHLEVBQUU7UUFDbEIsVUFBVSxHQUFHLEVBQUU7UUFDZixPQUFPLEdBQUcsRUFBRTtRQUNaLEtB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LEdBQUcsRUFBQyxJQUFJLEVBQUUsUUFBUSxFQUFDO01BQUUsT0FBTyxHQUFHLEVBQUMsSUFBSSxFQUFFLFFBQVEsRUFBQyxDQUFDO0FBQ2pGLE1BQUksS0FBSyxHQUFHLEVBQUMsSUFBSSxFQUFFLE1BQU0sRUFBQztNQUFFLElBQUksR0FBRyxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7O0FBZWpELE1BQUksTUFBTSxHQUFHLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBQztNQUFFLEtBQUssR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLE1BQU0sR0FBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUMsQ0FBQztBQUMxRyxNQUFJLFNBQVMsR0FBRyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUM7TUFBRSxTQUFTLEdBQUcsRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFDO01BQUUsUUFBUSxHQUFHLEVBQUMsT0FBTyxFQUFFLFNBQVMsRUFBQyxDQUFDO0FBQzFHLE1BQUksR0FBRyxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFDO01BQUUsS0FBSyxHQUFHLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDckYsTUFBSSxRQUFRLEdBQUcsRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFDO01BQUUsSUFBSSxHQUFHLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFDO01BQUUsU0FBUyxHQUFHLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBQyxDQUFDO0FBQzlHLE1BQUksR0FBRyxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUMsQ0FBQztBQUMxRyxNQUFJLE1BQU0sR0FBRyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLElBQUksR0FBRyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUM7TUFBRSxJQUFJLEdBQUcsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUM7QUFDcEcsTUFBSSxJQUFJLEdBQUcsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFDO01BQUUsTUFBTSxHQUFHLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBQyxDQUFDO0FBQ3pELE1BQUksTUFBTSxHQUFHLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFDO01BQUUsS0FBSyxHQUFHLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBQztNQUFFLElBQUksR0FBRyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ3BILE1BQUksS0FBSyxHQUFHLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBQyxDQUFDOzs7O0FBSTlCLE1BQUksS0FBSyxHQUFHLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDO01BQUUsS0FBSyxHQUFHLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxTQUFTLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDM0YsTUFBSSxNQUFNLEdBQUcsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUMsQ0FBQzs7Ozs7O0FBTWxELE1BQUksR0FBRyxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQzs7OztBQUl0RCxNQUFJLFlBQVksR0FBRyxFQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTTtBQUMvQyxjQUFVLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxTQUFTLEVBQUUsU0FBUyxFQUFFLFFBQVE7QUFDakUsUUFBSSxFQUFFLEdBQUcsRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsS0FBSyxFQUFFLElBQUk7QUFDMUQsY0FBVSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLE9BQU87QUFDdEUsV0FBTyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsTUFBTTtBQUN2RSxXQUFPLEVBQUUsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLO0FBQzlCLFVBQU0sRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLEdBQUc7QUFDckUsZ0JBQVksRUFBRSxFQUFDLE9BQU8sRUFBRSxZQUFZLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLEVBQUUsTUFBTSxFQUFFLEtBQUs7QUFDaEYsWUFBUSxFQUFFLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7QUFDN0QsVUFBTSxFQUFFLEVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUM7QUFDekQsWUFBUSxFQUFFLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsRUFBQyxDQUFDOzs7O0FBSW5GLE1BQUksU0FBUyxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDO01BQUUsU0FBUyxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ2hILE1BQUksT0FBTyxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUMsQ0FBQztBQUMxRixNQUFJLE1BQU0sR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLEtBQUssR0FBRyxFQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ2xGLE1BQUksTUFBTSxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDO01BQUUsSUFBSSxHQUFHLEVBQUMsSUFBSSxFQUFFLEdBQUcsRUFBQztNQUFFLFNBQVMsR0FBRyxFQUFDLElBQUksRUFBRSxLQUFLLEVBQUM7TUFBRSxTQUFTLEdBQUcsRUFBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa0JySSxNQUFJLE1BQU0sR0FBRyxFQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQztNQUFFLEdBQUcsR0FBRyxFQUFDLFFBQVEsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ3JGLE1BQUksT0FBTyxHQUFHLEVBQUMsUUFBUSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDakQsTUFBSSxPQUFPLEdBQUcsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBQztNQUFFLE9BQU8sR0FBRyxFQUFDLE1BQU0sRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQ3hHLE1BQUksVUFBVSxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDOUMsTUFBSSxXQUFXLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUMvQyxNQUFJLFVBQVUsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQzlDLE1BQUksV0FBVyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDL0MsTUFBSSxXQUFXLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUMvQyxNQUFJLFNBQVMsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQzdDLE1BQUksV0FBVyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDL0MsTUFBSSxTQUFTLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUM3QyxNQUFJLFFBQVEsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDMUQsTUFBSSxlQUFlLEdBQUcsRUFBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQzs7Ozs7QUFLcEQsU0FBTyxDQUFDLFFBQVEsR0FBRyxFQUFDLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxPQUFPO0FBQzFFLFVBQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUUs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Q0FBQztTQUNmO0FBQ0Qsa0JBQVUsRUFBRSxVQUFTLE9BQU8sRUFBRTtBQUMxQixlQUFJLElBQUksSUFBSSxJQUFJLE9BQU8sRUFBRTtBQUNyQixnQkFBSSxDQUFDLEdBQUcsSUFBSSxJQUFJLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztXQUM5RDtTQUNKO09BQ0osQ0FBQztBQUNGLGFBQU8sR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztLQUMzQjtHQUNGLENBQUM7O0FBRUYsR0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLFNBQVMsQ0FBQyxDQUFDOzs7O21CQUlkLENBQUMiLCJmaWxlIjoicmVib3VuZC5ydW50aW1lLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8gUHJvcGVydHkgQ29tcGlsZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IHRva2VuaXplciBmcm9tIFwicHJvcGVydHktY29tcGlsZXIvdG9rZW5pemVyXCI7XG5cbnZhciBjb21wdXRlZFByb3BlcnRpZXMgPSBbXTtcblxuLy8gVE9ETzogTWFrZSB0aGlzIGZhcnJycnJyIG1vcmUgcm9idXN0Li4udmVyeSBtaW5pbWFsIHJpZ2h0IG5vd1xuXG5mdW5jdGlvbiBjb21waWxlKHByb3AsIG5hbWUpe1xuICB2YXIgb3V0cHV0ID0ge307XG5cbiAgaWYocHJvcC5fX3BhcmFtcykgcmV0dXJuIHByb3AuX19wYXJhbXM7XG5cbiAgdmFyIHN0ciA9IHByb3AudG9TdHJpbmcoKSwgLy8ucmVwbGFjZSgvKD86XFwvXFwqKD86W1xcc1xcU10qPylcXCpcXC8pfCg/OihbXFxzO10pK1xcL1xcLyg/Oi4qKSQpL2dtLCAnJDEnKSwgLy8gU3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIGZ1bmN0aW9uIHNhbnMgY29tbWVudHNcbiAgICAgIG5leHRUb2tlbiA9IHRva2VuaXplci50b2tlbml6ZShzdHIpLFxuICAgICAgdG9rZW5zID0gW10sXG4gICAgICB0b2tlbixcbiAgICAgIGZpbmlzaGVkUGF0aHMgPSBbXSxcbiAgICAgIG5hbWVkUGF0aHMgPSB7fSxcbiAgICAgIG9wY29kZXMgPSBbXSxcbiAgICAgIG5hbWVkID0gZmFsc2UsXG4gICAgICBsaXN0ZW5pbmcgPSAwLFxuICAgICAgaW5TdWJDb21wb25lbnQgPSAwLFxuICAgICAgc3ViQ29tcG9uZW50ID0gW10sXG4gICAgICByb290LFxuICAgICAgcGF0aHMgPSBbXSxcbiAgICAgIHBhdGgsXG4gICAgICB0bXBQYXRoLFxuICAgICAgYXR0cnMgPSBbXSxcbiAgICAgIHdvcmtpbmdwYXRoID0gW10sXG4gICAgICB0ZXJtaW5hdG9ycyA9IFsnOycsJywnLCc9PScsJz4nLCc8JywnPj0nLCc8PScsJz49PScsJzw9PScsJyE9JywnIT09JywgJz09PScsICcmJicsICd8fCcsICcrJywgJy0nLCAnLycsICcqJywgJ3snLCAnfSddO1xuICBkb3tcblxuICAgIHRva2VuID0gbmV4dFRva2VuKCk7XG5cbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ3RoaXMnKXtcbiAgICAgIGxpc3RlbmluZysrO1xuICAgICAgd29ya2luZ3BhdGggPSBbXTtcbiAgICB9XG5cbiAgICAvLyBUT0RPOiBoYW5kbGUgZ2V0cyBvbiBjb2xsZWN0aW9uc1xuICAgIGlmKHRva2VuLnZhbHVlID09PSAnZ2V0Jyl7XG4gICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB3aGlsZShfLmlzVW5kZWZpbmVkKHBhdGgudmFsdWUpKXtcbiAgICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXBsYWNlIGFueSBhY2Nlc3MgdG8gYSBjb2xsZWN0aW9uIHdpdGggdGhlIGdlbmVyaWMgQGVhY2ggcGxhY2Vob2xkZXIgYW5kIHB1c2ggZGVwZW5kYW5jeVxuICAgICAgd29ya2luZ3BhdGgucHVzaChwYXRoLnZhbHVlLnJlcGxhY2UoL1xcWy4rXFxdL2csIFwiLkBlYWNoXCIpLnJlcGxhY2UoL15cXC4vLCAnJykpO1xuICAgIH1cblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAncGx1Y2snKXtcbiAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIHdoaWxlKF8uaXNVbmRlZmluZWQocGF0aC52YWx1ZSkpe1xuICAgICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB9XG5cbiAgICAgIHdvcmtpbmdwYXRoLnB1c2goJ0BlYWNoLicgKyBwYXRoLnZhbHVlKTtcbiAgICB9XG5cbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ3NsaWNlJyB8fCB0b2tlbi52YWx1ZSA9PT0gJ2Nsb25lJyB8fCB0b2tlbi52YWx1ZSA9PT0gJ2ZpbHRlcicpe1xuICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgaWYocGF0aC50eXBlLnR5cGUgPT09ICcoJykgd29ya2luZ3BhdGgucHVzaCgnQGVhY2gnKTtcbiAgICB9XG5cbiAgICBpZih0b2tlbi52YWx1ZSA9PT0gJ2F0Jyl7XG5cbiAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIHdoaWxlKF8uaXNVbmRlZmluZWQocGF0aC52YWx1ZSkpe1xuICAgICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB9XG4gICAgICAvLyB3b3JraW5ncGF0aFt3b3JraW5ncGF0aC5sZW5ndGggLTFdID0gd29ya2luZ3BhdGhbd29ya2luZ3BhdGgubGVuZ3RoIC0xXSArICdbJyArIHBhdGgudmFsdWUgKyAnXSc7XG4gICAgICAvLyB3b3JraW5ncGF0aC5wdXNoKCdbJyArIHBhdGgudmFsdWUgKyAnXScpO1xuICAgICAgd29ya2luZ3BhdGgucHVzaCgnQGVhY2gnKTtcblxuICAgIH1cblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAnd2hlcmUnIHx8IHRva2VuLnZhbHVlID09PSAnZmluZFdoZXJlJyl7XG4gICAgICB3b3JraW5ncGF0aC5wdXNoKCdAZWFjaCcpO1xuICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgYXR0cnMgPSBbXTtcbiAgICAgIHZhciBpdHIgPSAwO1xuICAgICAgd2hpbGUocGF0aC50eXBlLnR5cGUgIT09ICcpJyl7XG4gICAgICAgIGlmKHBhdGgudmFsdWUpe1xuICAgICAgICAgIGlmKGl0ciUyID09PSAwKXtcbiAgICAgICAgICAgIGF0dHJzLnB1c2gocGF0aC52YWx1ZSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGl0cisrO1xuICAgICAgICB9XG4gICAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIH1cbiAgICAgIHdvcmtpbmdwYXRoLnB1c2goYXR0cnMpO1xuICAgIH1cblxuICAgIGlmKGxpc3RlbmluZyAmJiAoXy5pbmRleE9mKHRlcm1pbmF0b3JzLCB0b2tlbi50eXBlLnR5cGUpID4gLTEgfHwgXy5pbmRleE9mKHRlcm1pbmF0b3JzLCB0b2tlbi52YWx1ZSkgPiAtMSkpe1xuICAgICAgd29ya2luZ3BhdGggPSBfLnJlZHVjZSh3b3JraW5ncGF0aCwgZnVuY3Rpb24obWVtbywgcGF0aHMpe1xuICAgICAgICB2YXIgbmV3TWVtbyA9IFtdO1xuICAgICAgICBwYXRocyA9ICghXy5pc0FycmF5KHBhdGhzKSkgPyBbcGF0aHNdIDogcGF0aHM7XG4gICAgICAgIF8uZWFjaChwYXRocywgZnVuY3Rpb24ocGF0aCl7XG4gICAgICAgICAgXy5lYWNoKG1lbW8sIGZ1bmN0aW9uKG1lbSl7XG4gICAgICAgICAgICBuZXdNZW1vLnB1c2goXy5jb21wYWN0KFttZW0sIHBhdGhdKS5qb2luKCcuJykucmVwbGFjZSgnLlsnLCAnWycpKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBuZXdNZW1vO1xuICAgICAgfSwgWycnXSk7XG4gICAgICBmaW5pc2hlZFBhdGhzID0gXy5jb21wYWN0KF8udW5pb24oZmluaXNoZWRQYXRocywgd29ya2luZ3BhdGgpKTtcbiAgICAgIHdvcmtpbmdwYXRoID0gW107XG4gICAgICBsaXN0ZW5pbmctLTtcbiAgICB9XG5cbiAgfSB3aGlsZSh0b2tlbi5zdGFydCAhPT0gdG9rZW4uZW5kKTtcblxuICBjb25zb2xlLmxvZygnQ09NUFVURUQgUFJPUEVSVFknLCBuYW1lLCAncmVnaXN0ZXJlZCB3aXRoIHRoZXNlIGRlcGVuZGFuY3kgcGF0aHM6JywgZmluaXNoZWRQYXRocyk7XG5cbiAgLy8gUmV0dXJuIHRoZSBkZXBlbmRhbmNpZXMgbGlzdFxuICByZXR1cm4gcHJvcC5fX3BhcmFtcyA9IGZpbmlzaGVkUGF0aHM7XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgeyBjb21waWxlOiBjb21waWxlIH07IiwiLy8gUmVib3VuZCBDb21waWxlclxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgeyBjb21waWxlIGFzIGh0bWxiYXJzQ29tcGlsZSwgY29tcGlsZVNwZWMgYXMgaHRtbGJhcnNDb21waWxlU3BlYyB9IGZyb20gXCJodG1sYmFycy1jb21waWxlci9jb21waWxlclwiO1xuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwiaHRtbGJhcnMtdXRpbC9vYmplY3QtdXRpbHNcIjtcbmltcG9ydCBET01IZWxwZXIgZnJvbSBcImRvbS1oZWxwZXJcIjtcbmltcG9ydCBoZWxwZXJzIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9oZWxwZXJzXCI7XG5pbXBvcnQgaG9va3MgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hvb2tzXCI7XG5cbmZ1bmN0aW9uIGNvbXBpbGUoc3RyaW5nLCBvcHRpb25zKXtcbiAgLy8gRW5zdXJlIHdlIGhhdmUgYSB3ZWxsLWZvcm1lZCBvYmplY3QgYXMgdmFyIG9wdGlvbnNcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuaGVscGVycyA9IG9wdGlvbnMuaGVscGVycyB8fCB7fTtcbiAgb3B0aW9ucy5ob29rcyA9IG9wdGlvbnMuaG9va3MgfHwge307XG5cbiAgLy8gTWVyZ2Ugb3VyIGRlZmF1bHQgaGVscGVycyB3aXRoIHVzZXIgcHJvdmlkZWQgaGVscGVyc1xuICBvcHRpb25zLmhlbHBlcnMgPSBtZXJnZShoZWxwZXJzLCBvcHRpb25zLmhlbHBlcnMpO1xuICBvcHRpb25zLmhvb2tzID0gbWVyZ2UoaG9va3MsIG9wdGlvbnMuaG9va3MpO1xuXG4gIC8vIENvbXBpbGUgb3VyIHRlbXBsYXRlIGZ1bmN0aW9uXG4gIHZhciBmdW5jID0gaHRtbGJhcnNDb21waWxlKHN0cmluZywge1xuICAgIGhlbHBlcnM6IG9wdGlvbnMuaGVscGVycyxcbiAgICBob29rczogb3B0aW9ucy5ob29rc1xuICB9KTtcblxuICBmdW5jLl9yZW5kZXIgPSBmdW5jLnJlbmRlcjtcblxuICAvLyBSZXR1cm4gYSB3cmFwcGVyIGZ1bmN0aW9uIHRoYXQgd2lsbCBtZXJnZSB1c2VyIHByb3ZpZGVkIGhlbHBlcnMgd2l0aCBvdXIgZGVmYXVsdHNcbiAgZnVuYy5yZW5kZXIgPSBmdW5jdGlvbihkYXRhLCBlbnYsIGNvbnRleHQpe1xuICAgIC8vIEVuc3VyZSB3ZSBoYXZlIGEgd2VsbC1mb3JtZWQgb2JqZWN0IGFzIHZhciBvcHRpb25zXG4gICAgZW52ID0gZW52IHx8IHt9O1xuICAgIGVudi5oZWxwZXJzID0gZW52LmhlbHBlcnMgfHwge307XG4gICAgZW52Lmhvb2tzID0gZW52Lmhvb2tzIHx8IHt9O1xuICAgIGVudi5kb20gPSBlbnYuZG9tIHx8IG5ldyBET01IZWxwZXIoKTtcblxuICAgIC8vIE1lcmdlIG91ciBkZWZhdWx0IGhlbHBlcnMgYW5kIGhvb2tzIHdpdGggdXNlciBwcm92aWRlZCBoZWxwZXJzXG4gICAgZW52LmhlbHBlcnMgPSBtZXJnZShoZWxwZXJzLCBlbnYuaGVscGVycyk7XG4gICAgZW52Lmhvb2tzID0gbWVyZ2UoaG9va3MsIGVudi5ob29rcyk7XG5cbiAgICAvLyBTZXQgYSBkZWZhdWx0IGNvbnRleHQgaWYgaXQgZG9lc24ndCBleGlzdFxuICAgIGNvbnRleHQgPSBjb250ZXh0IHx8IGRvY3VtZW50LmJvZHk7XG5cbiAgICAvLyBDYWxsIG91ciBmdW5jIHdpdGggbWVyZ2VkIGhlbHBlcnMgYW5kIGhvb2tzXG4gICAgcmV0dXJuIGZ1bmMuX3JlbmRlcihkYXRhLCBlbnYsIGNvbnRleHQpO1xuICB9O1xuXG4gIGhlbHBlcnMucmVnaXN0ZXJQYXJ0aWFsKCBvcHRpb25zLm5hbWUsIGZ1bmMpO1xuXG4gIHJldHVybiBmdW5jO1xuXG59XG5cbmV4cG9ydCB7IGNvbXBpbGUgfTtcbiIsIi8vIFJlYm91bmQgQ29tcG9uZW50XG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCBET01IZWxwZXIgZnJvbSBcImRvbS1oZWxwZXJcIjtcbmltcG9ydCBob29rcyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaG9va3NcIjtcbmltcG9ydCBoZWxwZXJzIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9oZWxwZXJzXCI7XG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcbmltcG9ydCB7IE1vZGVsIH0gZnJvbSBcInJlYm91bmQtZGF0YS9yZWJvdW5kLWRhdGFcIjtcblxuLy8gSWYgQmFja2JvbmUgaGFzbid0IGJlZW4gc3RhcnRlZCB5ZXQsIHRocm93IGVycm9yXG5pZighd2luZG93LkJhY2tib25lKSB0aHJvdyBcIkJhY2tib25lIG11c3QgYmUgb24gdGhlIHBhZ2UgZm9yIFJlYm91bmQgdG8gbG9hZC5cIjtcblxuLy8gUmV0dXJucyB0cnVlIGlmIGBzdHJgIHN0YXJ0cyB3aXRoIGB0ZXN0YFxuZnVuY3Rpb24gc3RhcnRzV2l0aChzdHIsIHRlc3Qpe1xuICBpZihzdHIgPT09IHRlc3QpIHJldHVybiB0cnVlO1xuICByZXR1cm4gc3RyLnN1YnN0cmluZygwLCB0ZXN0Lmxlbmd0aCsxKSA9PT0gdGVzdCsnLic7XG59XG5cbmZ1bmN0aW9uIHJlbmRlckNhbGxiYWNrKCl7XG4gIHZhciBpID0gMCwgbGVuID0gdGhpcy5fdG9SZW5kZXIubGVuZ3RoO1xuICBkZWxldGUgdGhpcy5fcmVuZGVyVGltZW91dDtcbiAgZm9yKGk9MDtpPGxlbjtpKyspe1xuICAgIHRoaXMuX3RvUmVuZGVyLnNoaWZ0KCkubm90aWZ5KCk7XG4gIH1cbiAgdGhpcy5fdG9SZW5kZXIuYWRkZWQgPSB7fTtcbn1cblxudmFyIGVudiA9IHtcbiAgaGVscGVyczogaGVscGVycy5oZWxwZXJzLFxuICBob29rczogaG9va3Ncbn07XG5cbmVudi5oeWRyYXRlID0gZnVuY3Rpb24gaHlkcmF0ZShzcGVjLCBvcHRpb25zKXtcbiAgLy8gUmV0dXJuIGEgd3JhcHBlciBmdW5jdGlvbiB0aGF0IHdpbGwgbWVyZ2UgdXNlciBwcm92aWRlZCBoZWxwZXJzIGFuZCBob29rcyB3aXRoIG91ciBkZWZhdWx0c1xuICByZXR1cm4gZnVuY3Rpb24oZGF0YSwgb3B0aW9ucyl7XG4gICAgLy8gRW5zdXJlIHdlIGhhdmUgYSB3ZWxsLWZvcm1lZCBvYmplY3QgYXMgdmFyIG9wdGlvbnNcbiAgICB2YXIgZW52ID0gb3B0aW9ucyB8fCB7fSxcbiAgICAgICAgY29udGV4dEVsZW1lbnQgPSBkYXRhLmVsIHx8IGRvY3VtZW50LmJvZHk7XG4gICAgZW52LmhlbHBlcnMgPSBlbnYuaGVscGVycyB8fCB7fTtcbiAgICBlbnYuaG9va3MgPSBlbnYuaG9va3MgfHwge307XG4gICAgZW52LmRvbSA9IGVudi5kb20gfHwgbmV3IERPTUhlbHBlcigpO1xuXG4gICAgLy8gTWVyZ2Ugb3VyIGRlZmF1bHQgaGVscGVycyBhbmQgaG9va3Mgd2l0aCB1c2VyIHByb3ZpZGVkIGhlbHBlcnNcbiAgICBlbnYuaGVscGVycyA9IF8uZGVmYXVsdHMoZW52LmhlbHBlcnMsIGhlbHBlcnMuaGVscGVycyk7XG4gICAgZW52Lmhvb2tzID0gXy5kZWZhdWx0cyhlbnYuaG9va3MsIGhvb2tzKTtcblxuICAgIC8vIENhbGwgb3VyIGZ1bmMgd2l0aCBtZXJnZWQgaGVscGVycyBhbmQgaG9va3NcbiAgICByZXR1cm4gc3BlYy5yZW5kZXIoZGF0YSwgZW52LCBjb250ZXh0RWxlbWVudCk7XG4gIH07XG59O1xuXG4vLyBOZXcgQmFja2JvbmUgQ29tcG9uZW50XG52YXIgQ29tcG9uZW50ID0gTW9kZWwuZXh0ZW5kKHtcblxuICBpc0NvbXBvbmVudDogdHJ1ZSxcblxuICBjb25zdHJ1Y3RvcjogZnVuY3Rpb24ob3B0aW9ucyl7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgXy5iaW5kQWxsKHRoaXMsICdfX2NhbGxPbkNvbXBvbmVudCcpO1xuICAgIHRoaXMuY2lkID0gXy51bmlxdWVJZCgnY29tcG9uZW50Jyk7XG4gICAgdGhpcy5hdHRyaWJ1dGVzID0ge307XG4gICAgdGhpcy5jaGFuZ2VkID0ge307XG4gICAgdGhpcy5oZWxwZXJzID0ge307XG4gICAgdGhpcy5fX3BhcmVudF9fID0gdGhpcy5fX3Jvb3RfXyA9IHRoaXM7XG4gICAgdGhpcy5saXN0ZW5Ubyh0aGlzLCAnYWxsJywgdGhpcy5fb25DaGFuZ2UpO1xuXG4gICAgLy8gVGFrZSBvdXIgcGFyc2VkIGRhdGEgYW5kIGFkZCBpdCB0byBvdXIgYmFja2JvbmUgZGF0YSBzdHJ1Y3R1cmUuIERvZXMgYSBkZWVwIGRlZmF1bHRzIHNldC5cbiAgICAvLyBJbiB0aGUgbW9kZWwsIHByaW1hdGl2ZXMgKGFycmF5cywgb2JqZWN0cywgZXRjKSBhcmUgY29udmVydGVkIHRvIEJhY2tib25lIE9iamVjdHNcbiAgICAvLyBGdW5jdGlvbnMgYXJlIGNvbXBpbGVkIHRvIGZpbmQgdGhlaXIgZGVwZW5kYW5jaWVzIGFuZCBhZGRlZCBhcyBjb21wdXRlZCBwcm9wZXJ0aWVzXG4gICAgLy8gU2V0IG91ciBjb21wb25lbnQncyBjb250ZXh0IHdpdGggdGhlIHBhc3NlZCBkYXRhIG1lcmdlZCB3aXRoIHRoZSBjb21wb25lbnQncyBkZWZhdWx0c1xuICAgIHRoaXMuc2V0KCh0aGlzLmRlZmF1bHRzIHx8IHt9KSwge2RlZmF1bHRzOiB0cnVlfSk7XG4gICAgdGhpcy5zZXQoKG9wdGlvbnMuZGF0YSB8fCB7fSkpO1xuXG4gICAgLy8gQ2FsbCBvbiBjb21wb25lbnQgaXMgdXNlZCBieSB0aGUge3tvbn19IGhlbHBlciB0byBjYWxsIGFsbCBldmVudCBjYWxsYmFja3MgaW4gdGhlIHNjb3BlIG9mIHRoZSBjb21wb25lbnRcbiAgICB0aGlzLmhlbHBlcnMuX19jYWxsT25Db21wb25lbnQgPSB0aGlzLl9fY2FsbE9uQ29tcG9uZW50O1xuXG5cbiAgICAvLyBHZXQgYW55IGFkZGl0aW9uYWwgcm91dGVzIHBhc3NlZCBpbiBmcm9tIG9wdGlvbnNcbiAgICB0aGlzLnJvdXRlcyA9ICBfLmRlZmF1bHRzKChvcHRpb25zLnJvdXRlcyB8fCB7fSksIHRoaXMucm91dGVzKTtcbiAgICAvLyBFbnN1cmUgdGhhdCBhbGwgcm91dGUgZnVuY3Rpb25zIGV4aXN0XG4gICAgXy5lYWNoKHRoaXMucm91dGVzLCBmdW5jdGlvbih2YWx1ZSwga2V5LCByb3V0ZXMpe1xuICAgICAgICBpZih0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKXsgdGhyb3coJ0Z1bmN0aW9uIG5hbWUgcGFzc2VkIHRvIHJvdXRlcyBpbiAgJyArIHRoaXMuX19uYW1lICsgJyBjb21wb25lbnQgbXVzdCBiZSBhIHN0cmluZyEnKTsgfVxuICAgICAgICBpZighdGhpc1t2YWx1ZV0peyB0aHJvdygnQ2FsbGJhY2sgZnVuY3Rpb24gJyt2YWx1ZSsnIGRvZXMgbm90IGV4aXN0IG9uIHRoZSAgJyArIHRoaXMuX19uYW1lICsgJyBjb21wb25lbnQhJyk7IH1cbiAgICB9LCB0aGlzKTtcblxuXG4gICAgLy8gU2V0IG91ciBvdXRsZXQgYW5kIHRlbXBsYXRlIGlmIHdlIGhhdmUgb25lXG4gICAgdGhpcy5lbCA9IG9wdGlvbnMub3V0bGV0IHx8IHVuZGVmaW5lZDtcbiAgICB0aGlzLiRlbCA9IChfLmlzVW5kZWZpbmVkKHdpbmRvdy5CYWNrYm9uZS4kKSkgPyBmYWxzZSA6IHdpbmRvdy5CYWNrYm9uZS4kKHRoaXMuZWwpO1xuXG4gICAgaWYoXy5pc0Z1bmN0aW9uKHRoaXMuY3JlYXRlZENhbGxiYWNrKSl7XG4gICAgICB0aGlzLmNyZWF0ZWRDYWxsYmFjay5jYWxsKHRoaXMpO1xuICAgIH1cblxuICAgIC8vIFRha2Ugb3VyIHByZWNvbXBpbGVkIHRlbXBsYXRlIGFuZCBoeWRyYXRlcyBpdC4gV2hlbiBSZWJvdW5kIENvbXBpbGVyIGlzIGluY2x1ZGVkLCBjYW4gYmUgYSBoYW5kbGViYXJzIHRlbXBsYXRlIHN0cmluZy5cbiAgICAvLyBUT0RPOiBDaGVjayBpZiB0ZW1wbGF0ZSBpcyBhIHN0cmluZywgYW5kIGlmIHRoZSBjb21waWxlciBleGlzdHMgb24gdGhlIHBhZ2UsIGFuZCBjb21waWxlIGlmIG5lZWRlZFxuICAgIGlmKCFvcHRpb25zLnRlbXBsYXRlICYmICF0aGlzLnRlbXBsYXRlKXsgdGhyb3coJ1RlbXBsYXRlIG11c3QgcHJvdmlkZWQgZm9yICcgKyB0aGlzLl9fbmFtZSArICcgY29tcG9uZW50IScpOyB9XG4gICAgdGhpcy50ZW1wbGF0ZSA9IG9wdGlvbnMudGVtcGxhdGUgfHwgdGhpcy50ZW1wbGF0ZTtcbiAgICB0aGlzLnRlbXBsYXRlID0gKHR5cGVvZiB0aGlzLnRlbXBsYXRlID09PSAnb2JqZWN0JykgPyBlbnYuaHlkcmF0ZSh0aGlzLnRlbXBsYXRlKSA6IHRoaXMudGVtcGxhdGU7XG5cblxuICAgIC8vIFJlbmRlciBvdXIgZG9tIGFuZCBwbGFjZSB0aGUgZG9tIGluIG91ciBjdXN0b20gZWxlbWVudFxuICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy50ZW1wbGF0ZSh0aGlzLCB7aGVscGVyczogdGhpcy5oZWxwZXJzfSwgdGhpcy5lbCkpO1xuXG4gICAgdGhpcy5pbml0aWFsaXplKCk7XG5cbiAgfSxcblxuICAkOiBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgIGlmKCF0aGlzLiRlbCl7XG4gICAgICByZXR1cm4gY29uc29sZS5lcnJvcignTm8gRE9NIG1hbmlwdWxhdGlvbiBsaWJyYXJ5IG9uIHRoZSBwYWdlIScpO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy4kZWwuZmluZChzZWxlY3Rvcik7XG4gIH0sXG5cbiAgLy8gVHJpZ2dlciBhbGwgZXZlbnRzIG9uIGJvdGggdGhlIGNvbXBvbmVudCBhbmQgdGhlIGVsZW1lbnRcbiAgdHJpZ2dlcjogZnVuY3Rpb24oZXZlbnROYW1lKXtcbiAgICBpZih0aGlzLmVsKXtcbiAgICAgICQodGhpcy5lbCkudHJpZ2dlcihldmVudE5hbWUsIGFyZ3VtZW50cyk7XG4gICAgfVxuICAgIEJhY2tib25lLk1vZGVsLnByb3RvdHlwZS50cmlnZ2VyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gIH0sXG5cbiAgX19jYWxsT25Db21wb25lbnQ6IGZ1bmN0aW9uKG5hbWUsIGV2ZW50KXtcbiAgICBpZighXy5pc0Z1bmN0aW9uKHRoaXNbbmFtZV0pKXsgdGhyb3cgXCJFUlJPUjogTm8gbWV0aG9kIG5hbWVkIFwiICsgbmFtZSArIFwiIG9uIGNvbXBvbmVudCBcIiArIHRoaXMuX19uYW1lICsgXCIhXCI7IH1cbiAgICByZXR1cm4gdGhpc1tuYW1lXS5jYWxsKHRoaXMsIGV2ZW50KTtcbiAgfSxcblxuICBfb25BdHRyaWJ1dGVDaGFuZ2U6IGZ1bmN0aW9uKGF0dHJOYW1lLCBvbGRWYWwsIG5ld1ZhbCl7XG4gICAgLy8gQ29tbWVudGVkIG91dCBiZWNhdXNlIHRyYWNraW5nIGF0dHJpYnV0ZSBjaGFuZ2VzIGFuZCBtYWtpbmcgc3VyZSB0aGV5IGRvbnQgaW5maW5pdGUgbG9vcCBpcyBoYXJkLlxuICAgIC8vIFRPRE86IE1ha2Ugd29yay5cbiAgICAvLyB0cnl7IG5ld1ZhbCA9IEpTT04ucGFyc2UobmV3VmFsKTsgfSBjYXRjaCAoZSl7IG5ld1ZhbCA9IG5ld1ZhbDsgfVxuICAgIC8vXG4gICAgLy8gLy8gZGF0YSBhdHRyaWJ1dGVzIHNob3VsZCBiZSByZWZlcmFuY2VkIGJ5IHRoZWlyIGNhbWVsIGNhc2UgbmFtZVxuICAgIC8vIGF0dHJOYW1lID0gYXR0ck5hbWUucmVwbGFjZSgvXmRhdGEtL2csIFwiXCIpLnJlcGxhY2UoLy0oW2Etel0pL2csIGZ1bmN0aW9uIChnKSB7IHJldHVybiBnWzFdLnRvVXBwZXJDYXNlKCk7IH0pO1xuICAgIC8vXG4gICAgLy8gb2xkVmFsID0gdGhpcy5nZXQoYXR0ck5hbWUpO1xuICAgIC8vXG4gICAgLy8gaWYobmV3VmFsID09PSBudWxsKXsgdGhpcy51bnNldChhdHRyTmFtZSk7IH1cbiAgICAvL1xuICAgIC8vIC8vIElmIG9sZFZhbCBpcyBhIG51bWJlciwgYW5kIG5ld1ZhbCBpcyBvbmx5IG51bWVyaWNhbCwgcHJlc2VydmUgdHlwZVxuICAgIC8vIGlmKF8uaXNOdW1iZXIob2xkVmFsKSAmJiBfLmlzU3RyaW5nKG5ld1ZhbCkgJiYgbmV3VmFsLm1hdGNoKC9eWzAtOV0qJC9pKSl7XG4gICAgLy8gICBuZXdWYWwgPSBwYXJzZUludChuZXdWYWwpO1xuICAgIC8vIH1cbiAgICAvL1xuICAgIC8vIGVsc2V7IHRoaXMuc2V0KGF0dHJOYW1lLCBuZXdWYWwsIHtxdWlldDogdHJ1ZX0pOyB9XG4gIH0sXG5cblxuICBfb25DaGFuZ2U6IGZ1bmN0aW9uKHR5cGUsIG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKXtcbiAgICB2YXIgc2hvcnRjaXJjdWl0ID0geyBjaGFuZ2U6IDEsIHNvcnQ6IDEsIHJlcXVlc3Q6IDEsIGRlc3Ryb3k6IDEsIHN5bmM6IDEsIGVycm9yOiAxLCBpbnZhbGlkOiAxLCByb3V0ZTogMSwgZGlydHk6IDEgfTtcbiAgICBpZiggc2hvcnRjaXJjdWl0W3R5cGVdICkgcmV0dXJuO1xuXG4gICAgdmFyIGRhdGEsIGNoYW5nZWQ7XG4gICAgbW9kZWwgfHwgKG1vZGVsID0ge30pO1xuICAgIGNvbGxlY3Rpb24gfHwgKGNvbGxlY3Rpb24gPSB7fSk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICAhY29sbGVjdGlvbi5pc0RhdGEgJiYgKG9wdGlvbnMgPSBjb2xsZWN0aW9uKSAmJiAoY29sbGVjdGlvbiA9IG1vZGVsKTtcbiAgICB0aGlzLl90b1JlbmRlciB8fCAodGhpcy5fdG9SZW5kZXIgPSBbXSk7XG5cbiAgICBpZiggKHR5cGUgPT09ICdyZXNldCcgJiYgb3B0aW9ucy5wcmV2aW91c0F0dHJpYnV0ZXMpIHx8IHR5cGUuaW5kZXhPZignY2hhbmdlOicpICE9PSAtMSl7XG4gICAgICBkYXRhID0gbW9kZWw7XG4gICAgICBjaGFuZ2VkID0gbW9kZWwuY2hhbmdlZEF0dHJpYnV0ZXMoKTtcbiAgICB9XG4gICAgZWxzZSBpZih0eXBlID09PSAnYWRkJyB8fCB0eXBlID09PSAncmVtb3ZlJyB8fCAodHlwZSA9PT0gJ3Jlc2V0JyAmJiBvcHRpb25zLnByZXZpb3VzTW9kZWxzKSl7XG4gICAgICBkYXRhID0gY29sbGVjdGlvbjtcbiAgICAgIGNoYW5nZWQgPSB7fTtcbiAgICAgIGNoYW5nZWRbZGF0YS5fX3BhdGgoKV0gPSBkYXRhO1xuICAgIH1cblxuICAgIGlmKCFkYXRhIHx8ICFjaGFuZ2VkKSByZXR1cm47XG5cbiAgICB2YXIgcHVzaCA9IGZ1bmN0aW9uKGFycil7XG4gICAgICB2YXIgaSwgbGVuID0gYXJyLmxlbmd0aDtcbiAgICAgIHRoaXMuYWRkZWQgfHwgKHRoaXMuYWRkZWQgPSB7fSk7XG4gICAgICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgICAgIGlmKHRoaXMuYWRkZWRbYXJyW2ldLmNpZF0pIGNvbnRpbnVlO1xuICAgICAgICB0aGlzLmFkZGVkW2FycltpXS5jaWRdID0gMTtcbiAgICAgICAgdGhpcy5wdXNoKGFycltpXSk7XG4gICAgICB9XG4gICAgfTtcbiAgICB2YXIgY29udGV4dCA9IHRoaXM7XG4gICAgdmFyIGJhc2VQYXRoID0gZGF0YS5fX3BhdGgoKTtcbiAgICB2YXIgcGFydHMgPSAkLnNwbGl0UGF0aChiYXNlUGF0aCk7XG4gICAgdmFyIGtleSwgb2JzUGF0aCwgcGF0aCwgb2JzZXJ2ZXJzO1xuXG4gICAgLy8gRm9yIGVhY2ggY2hhbmdlZCBrZXksIHdhbGsgZG93biB0aGUgZGF0YSB0cmVlIGZyb20gdGhlIHJvb3QgdG8gdGhlIGRhdGFcbiAgICAvLyBlbGVtZW50IHRoYXQgdHJpZ2dlcmVkIHRoZSBldmVudCBhbmQgYWRkIGFsbCByZWxldmVudCBjYWxsYmFja3MgdG8gdGhpc1xuICAgIC8vIG9iamVjdCdzIF90b1JlbmRlciBxdWV1ZS5cbiAgICBkb3tcbiAgICAgIGZvcihrZXkgaW4gY2hhbmdlZCl7XG4gICAgICAgIHBhdGggPSAoYmFzZVBhdGggKyAoYmFzZVBhdGggJiYgJy4nKSArIGtleSkucmVwbGFjZShjb250ZXh0Ll9fcGF0aCgpLCAnJykucmVwbGFjZSgvXFxbW15cXF1dK1xcXS9nLCBcIi5AZWFjaFwiKS5yZXBsYWNlKC9eXFwuLywgJycpO1xuICAgICAgICBmb3Iob2JzUGF0aCBpbiBjb250ZXh0Ll9fb2JzZXJ2ZXJzKXtcbiAgICAgICAgICBvYnNlcnZlcnMgPSBjb250ZXh0Ll9fb2JzZXJ2ZXJzW29ic1BhdGhdO1xuICAgICAgICAgIGlmKHN0YXJ0c1dpdGgob2JzUGF0aCwgcGF0aCkgfHwgc3RhcnRzV2l0aChwYXRoLCBvYnNQYXRoKSl7XG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgY29sbGVjdGlvbiBldmVudCwgdHJpZ2dlciBldmVyeXRoaW5nLCBvdGhlcndpc2Ugb25seSB0cmlnZ2VyIHByb3BlcnR5IGNoYW5nZSBjYWxsYmFja3NcbiAgICAgICAgICAgIGlmKGRhdGEuaXNDb2xsZWN0aW9uKSBwdXNoLmNhbGwodGhpcy5fdG9SZW5kZXIsIG9ic2VydmVycy5jb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIHB1c2guY2FsbCh0aGlzLl90b1JlbmRlciwgb2JzZXJ2ZXJzLm1vZGVsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IHdoaWxlKGNvbnRleHQgIT09IGRhdGEgJiYgKGNvbnRleHQgPSBjb250ZXh0LmdldChwYXJ0cy5zaGlmdCgpKSkpXG5cbiAgICAvLyBRdWV1ZSBvdXIgcmVuZGVyIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhcyBiZWVuIGV4aGF1c3RlZFxuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5fcmVuZGVyVGltZW91dCk7XG4gICAgdGhpcy5fcmVuZGVyVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KF8uYmluZChyZW5kZXJDYWxsYmFjaywgdGhpcyksIDApO1xuICB9XG5cbn0pO1xuXG5Db21wb25lbnQuZXh0ZW5kPSBmdW5jdGlvbihwcm90b1Byb3BzLCBzdGF0aWNQcm9wcykge1xuICB2YXIgcGFyZW50ID0gdGhpcyxcbiAgICAgIGNoaWxkLFxuICAgICAgcmVzZXJ2ZWRNZXRob2RzID0ge1xuICAgICAgICAndHJpZ2dlcic6MSwgICAgJ2NvbnN0cnVjdG9yJzoxLCAnZ2V0JzoxLCAgICAgICAgICAgICAgICdzZXQnOjEsICAgICAgICAgICAgICdoYXMnOjEsXG4gICAgICAgICdleHRlbmQnOjEsICAgICAnZXNjYXBlJzoxLCAgICAgICd1bnNldCc6MSwgICAgICAgICAgICAgJ2NsZWFyJzoxLCAgICAgICAgICAgJ2NpZCc6MSxcbiAgICAgICAgJ2F0dHJpYnV0ZXMnOjEsICdjaGFuZ2VkJzoxLCAgICAgJ3RvSlNPTic6MSwgICAgICAgICAgICAndmFsaWRhdGlvbkVycm9yJzoxLCAnaXNWYWxpZCc6MSxcbiAgICAgICAgJ2lzTmV3JzoxLCAgICAgICdoYXNDaGFuZ2VkJzoxLCAgJ2NoYW5nZWRBdHRyaWJ1dGVzJzoxLCAncHJldmlvdXMnOjEsICAgICAgICAncHJldmlvdXNBdHRyaWJ1dGVzJzoxXG4gICAgICB9LFxuICAgICAgY29uZmlnUHJvcGVydGllcyA9IHtcbiAgICAgICAgJ3JvdXRlcyc6MSwgICAgICd0ZW1wbGF0ZSc6MSwgICAgJ2RlZmF1bHRzJzoxLCAnb3V0bGV0JzoxLCAgICAgICAgICAndXJsJzoxLFxuICAgICAgICAndXJsUm9vdCc6MSwgICAgJ2lkQXR0cmlidXRlJzoxLCAnaWQnOjEsICAgICAgICdjcmVhdGVkQ2FsbGJhY2snOjEsICdhdHRhY2hlZENhbGxiYWNrJzoxLFxuICAgICAgICAnZGV0YWNoZWRDYWxsYmFjayc6MVxuICAgICAgfTtcblxuICBwcm90b1Byb3BzLmRlZmF1bHRzID0ge307XG5cbiAgLy8gRm9yIGVhY2ggcHJvcGVydHkgcGFzc2VkIGludG8gb3VyIGNvbXBvbmVudCBiYXNlIGNsYXNzXG4gIF8uZWFjaChwcm90b1Byb3BzLCBmdW5jdGlvbih2YWx1ZSwga2V5LCBwcm90b1Byb3BzKXtcblxuICAgIC8vIElmIGEgY29uZmlndXJhdGlvbiBwcm9wZXJ0eSwgaWdub3JlIGl0XG4gICAgaWYoY29uZmlnUHJvcGVydGllc1trZXldKXsgcmV0dXJuOyB9XG5cbiAgICAvLyBJZiBhIHByaW1hdGl2ZSBvciBiYWNrYm9uZSB0eXBlIG9iamVjdCwgb3IgY29tcHV0ZWQgcHJvcGVydHkgKGZ1bmN0aW9uIHdoaWNoIHRha2VzIG5vIGFyZ3VtZW50cyBhbmQgcmV0dXJucyBhIHZhbHVlKSBtb3ZlIGl0IHRvIG91ciBkZWZhdWx0c1xuICAgIGlmKCFfLmlzRnVuY3Rpb24odmFsdWUpIHx8IHZhbHVlLmlzTW9kZWwgfHwgdmFsdWUuaXNDb21wb25lbnQgfHwgKF8uaXNGdW5jdGlvbih2YWx1ZSkgJiYgdmFsdWUubGVuZ3RoID09PSAwICYmIHZhbHVlLnRvU3RyaW5nKCkuaW5kZXhPZigncmV0dXJuJykgPiAtMSkpe1xuICAgICAgcHJvdG9Qcm9wcy5kZWZhdWx0c1trZXldID0gdmFsdWU7XG4gICAgICBkZWxldGUgcHJvdG9Qcm9wc1trZXldO1xuICAgIH1cblxuICAgIC8vIElmIGEgcmVzZXJ2ZWQgbWV0aG9kLCB5ZWxsXG4gICAgaWYocmVzZXJ2ZWRNZXRob2RzW2tleV0peyB0aHJvdyBcIkVSUk9SOiBcIiArIGtleSArIFwiIGlzIGEgcmVzZXJ2ZWQgbWV0aG9kIG5hbWUgaW4gXCIgKyBzdGF0aWNQcm9wcy5fX25hbWUgKyBcIiFcIjsgfVxuXG4gICAgLy8gQWxsIG90aGVyIHZhbHVlcyBhcmUgY29tcG9uZW50IG1ldGhvZHMsIGxlYXZlIHRoZW0gYmUgdW5sZXNzIGFscmVhZHkgZGVmaW5lZC5cblxuICB9LCB0aGlzKTtcblxuICAvLyBJZiBnaXZlbiBhIGNvbnN0cnVjdG9yLCB1c2UgaXQsIG90aGVyd2lzZSB1c2UgdGhlIGRlZmF1bHQgb25lIGRlZmluZWQgYWJvdmVcbiAgaWYgKHByb3RvUHJvcHMgJiYgXy5oYXMocHJvdG9Qcm9wcywgJ2NvbnN0cnVjdG9yJykpIHtcbiAgICBjaGlsZCA9IHByb3RvUHJvcHMuY29uc3RydWN0b3I7XG4gIH0gZWxzZSB7XG4gICAgY2hpbGQgPSBmdW5jdGlvbigpeyByZXR1cm4gcGFyZW50LmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7IH07XG4gIH1cblxuICAvLyBPdXIgY2xhc3Mgc2hvdWxkIGluaGVyaXQgZXZlcnl0aGluZyBmcm9tIGl0cyBwYXJlbnQsIGRlZmluZWQgYWJvdmVcbiAgdmFyIFN1cnJvZ2F0ZSA9IGZ1bmN0aW9uKCl7IHRoaXMuY29uc3RydWN0b3IgPSBjaGlsZDsgfTtcbiAgU3Vycm9nYXRlLnByb3RvdHlwZSA9IHBhcmVudC5wcm90b3R5cGU7XG4gIGNoaWxkLnByb3RvdHlwZSA9IG5ldyBTdXJyb2dhdGUoKTtcblxuICAvLyBFeHRlbmQgb3VyIHByb3RvdHlwZSB3aXRoIGFueSByZW1haW5pbmcgcHJvdG9Qcm9wcywgb3ZlcnJpdGluZyBwcmUtZGVmaW5lZCBvbmVzXG4gIGlmIChwcm90b1Byb3BzKXsgXy5leHRlbmQoY2hpbGQucHJvdG90eXBlLCBwcm90b1Byb3BzLCBzdGF0aWNQcm9wcyk7IH1cblxuICAvLyBTZXQgb3VyIGFuY2VzdHJ5XG4gIGNoaWxkLl9fc3VwZXJfXyA9IHBhcmVudC5wcm90b3R5cGU7XG5cbiAgcmV0dXJuIGNoaWxkO1xufTtcblxuQ29tcG9uZW50LnJlZ2lzdGVyID0gZnVuY3Rpb24gcmVnaXN0ZXJDb21wb25lbnQobmFtZSwgb3B0aW9ucykge1xuICB2YXIgc2NyaXB0ID0gb3B0aW9ucy5wcm90b3R5cGU7XG4gIHZhciB0ZW1wbGF0ZSA9IG9wdGlvbnMudGVtcGxhdGU7XG4gIHZhciBzdHlsZSA9IG9wdGlvbnMuc3R5bGU7XG5cbiAgdmFyIGNvbXBvbmVudCA9IHRoaXMuZXh0ZW5kKHNjcmlwdCwgeyBfX25hbWU6IG5hbWUgfSk7XG4gIHZhciBwcm90byA9IE9iamVjdC5jcmVhdGUoSFRNTEVsZW1lbnQucHJvdG90eXBlLCB7fSk7XG5cbiAgcHJvdG8uY3JlYXRlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5fX2NvbXBvbmVudF9fID0gbmV3IGNvbXBvbmVudCh7XG4gICAgICB0ZW1wbGF0ZTogdGVtcGxhdGUsXG4gICAgICBvdXRsZXQ6IHRoaXMsXG4gICAgICBkYXRhOiBSZWJvdW5kLnNlZWREYXRhXG4gICAgfSk7XG4gIH07XG5cbiAgcHJvdG8uYXR0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgIHNjcmlwdC5hdHRhY2hlZENhbGxiYWNrICYmIHNjcmlwdC5hdHRhY2hlZENhbGxiYWNrLmNhbGwodGhpcy5fX2NvbXBvbmVudF9fKTtcbiAgfTtcblxuICBwcm90by5kZXRhY2hlZENhbGxiYWNrID0gZnVuY3Rpb24oKSB7XG4gICAgc2NyaXB0LmRldGFjaGVkQ2FsbGJhY2sgJiYgc2NyaXB0LmRldGFjaGVkQ2FsbGJhY2suY2FsbCh0aGlzLl9fY29tcG9uZW50X18pO1xuICAgIHRoaXMuX19jb21wb25lbnRfXy5kZWluaXRpYWxpemUoKTtcbiAgfTtcblxuICBwcm90by5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgPSBmdW5jdGlvbihhdHRyTmFtZSwgb2xkVmFsLCBuZXdWYWwpIHtcbiAgICB0aGlzLl9fY29tcG9uZW50X18uX29uQXR0cmlidXRlQ2hhbmdlKGF0dHJOYW1lLCBvbGRWYWwsIG5ld1ZhbCk7XG4gICAgc2NyaXB0LmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayAmJiBzY3JpcHQuYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrLmNhbGwodGhpcy5fX2NvbXBvbmVudF9fLCBhdHRyTmFtZSwgb2xkVmFsLCBuZXdWYWwpO1xuICB9O1xuXG4gIHJldHVybiBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQobmFtZSwgeyBwcm90b3R5cGU6IHByb3RvIH0pO1xufVxuXG5fLmJpbmRBbGwoQ29tcG9uZW50LCAncmVnaXN0ZXInKTtcblxuZXhwb3J0IGRlZmF1bHQgQ29tcG9uZW50O1xuIiwiLy8gUmVib3VuZCBDb2xsZWN0aW9uXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCBNb2RlbCBmcm9tIFwicmVib3VuZC1kYXRhL21vZGVsXCI7XG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcblxuZnVuY3Rpb24gcGF0aEdlbmVyYXRvcihjb2xsZWN0aW9uKXtcbiAgcmV0dXJuIGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIGNvbGxlY3Rpb24uX19wYXRoKCkgKyAnWycgKyBjb2xsZWN0aW9uLmluZGV4T2YoY29sbGVjdGlvbi5fYnlJZFt0aGlzLmNpZF0pICsgJ10nO1xuICB9O1xufVxuXG52YXIgQ29sbGVjdGlvbiA9IEJhY2tib25lLkNvbGxlY3Rpb24uZXh0ZW5kKHtcblxuICBpc0NvbGxlY3Rpb246IHRydWUsXG4gIGlzRGF0YTogdHJ1ZSxcblxuICBtb2RlbDogdGhpcy5tb2RlbCB8fCBNb2RlbCxcblxuICBfX3BhdGg6IGZ1bmN0aW9uKCl7cmV0dXJuICcnO30sXG5cbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKG1vZGVscywgb3B0aW9ucyl7XG4gICAgbW9kZWxzIHx8IChtb2RlbHMgPSBbXSk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB0aGlzLl9fb2JzZXJ2ZXJzID0ge307XG4gICAgdGhpcy5oZWxwZXJzID0ge307XG4gICAgdGhpcy5jaWQgPSBfLnVuaXF1ZUlkKCdjb2xsZWN0aW9uJyk7XG5cbiAgICAvLyBTZXQgbGluZWFnZVxuICAgIHRoaXMuc2V0UGFyZW50KCBvcHRpb25zLnBhcmVudCB8fCB0aGlzICk7XG4gICAgdGhpcy5zZXRSb290KCBvcHRpb25zLnJvb3QgfHwgdGhpcyApO1xuICAgIHRoaXMuX19wYXRoID0gb3B0aW9ucy5wYXRoIHx8IHRoaXMuX19wYXRoO1xuXG4gICAgQmFja2JvbmUuQ29sbGVjdGlvbi5hcHBseSggdGhpcywgYXJndW1lbnRzICk7XG5cbiAgICAvLyBXaGVuIGEgbW9kZWwgaXMgcmVtb3ZlZCBmcm9tIGl0cyBvcmlnaW5hbCBjb2xsZWN0aW9uLCBkZXN0cm95IGl0XG4gICAgLy8gVE9ETzogRml4IHRoaXMuIENvbXB1dGVkIHByb3BlcnRpZXMgbm93IHNvbWVob3cgYWxsb3cgY29sbGVjdGlvbiB0byBzaGFyZSBhIG1vZGVsLiBUaGV5IG1heSBiZSByZW1vdmVkIGZyb20gb25lIGJ1dCBub3QgdGhlIG90aGVyLiBUaGF0IGlzIGJhZC5cbiAgICAvLyBUaGUgY2xvbmUgPSBmYWxzZSBvcHRpb25zIGlzIHRoZSBjdWxwcml0LiBGaW5kIGEgYmV0dGVyIHdheSB0byBjb3B5IGFsbCBvZiB0aGUgY29sbGVjdGlvbnMgY3VzdG9tIGF0dHJpYnV0ZXMgb3ZlciB0byB0aGUgY2xvbmUuXG4gICAgdGhpcy5vbigncmVtb3ZlJywgZnVuY3Rpb24obW9kZWwsIGNvbGxlY3Rpb24sIG9wdGlvbnMpe1xuICAgICAgLy8gbW9kZWwuZGVpbml0aWFsaXplKCk7XG4gICAgfSk7XG5cbiAgfSxcblxuICBnZXQ6IGZ1bmN0aW9uKGtleSwgb3B0aW9ucyl7XG5cbiAgICAvLyBJZiB0aGUga2V5IGlzIGEgbnVtYmVyIG9yIG9iamVjdCwgZGVmYXVsdCB0byBiYWNrYm9uZSdzIGNvbGxlY3Rpb24gZ2V0XG4gICAgaWYodHlwZW9mIGtleSA9PSAnbnVtYmVyJyB8fCB0eXBlb2Yga2V5ID09ICdvYmplY3QnKXtcbiAgICAgIHJldHVybiBCYWNrYm9uZS5Db2xsZWN0aW9uLnByb3RvdHlwZS5nZXQuY2FsbCh0aGlzLCBrZXkpO1xuICAgIH1cblxuICAgIC8vIElmIGtleSBpcyBub3QgYSBzdHJpbmcsIHJldHVybiB1bmRlZmluZWRcbiAgICBpZiAoIV8uaXNTdHJpbmcoa2V5KSkgcmV0dXJuIHZvaWQgMDtcblxuICAgIC8vIFNwbGl0IHRoZSBwYXRoIGF0IGFsbCAnLicsICdbJyBhbmQgJ10nIGFuZCBmaW5kIHRoZSB2YWx1ZSByZWZlcmFuY2VkLlxuICAgIHZhciBwYXJ0cyAgPSAkLnNwbGl0UGF0aChrZXkpLFxuICAgICAgICByZXN1bHQgPSB0aGlzLFxuICAgICAgICBsPXBhcnRzLmxlbmd0aCxcbiAgICAgICAgaT0wO1xuICAgICAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gICAgaWYoXy5pc1VuZGVmaW5lZChrZXkpIHx8IF8uaXNOdWxsKGtleSkpIHJldHVybiBrZXk7XG4gICAgaWYoa2V5ID09PSAnJyB8fCBwYXJ0cy5sZW5ndGggPT09IDApIHJldHVybiByZXN1bHQ7XG5cbiAgICBpZiAocGFydHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yICggaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgLy8gSWYgcmV0dXJuaW5nIHJhdywgYWx3YXlzIHJldHVybiB0aGUgZmlyc3QgY29tcHV0ZWQgcHJvcGVydHkgZm91bmQuIElmIHVuZGVmaW5lZCwgeW91J3JlIGRvbmUuXG4gICAgICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5ICYmIG9wdGlvbnMucmF3KSByZXR1cm4gcmVzdWx0O1xuICAgICAgICBpZihyZXN1bHQgJiYgcmVzdWx0LmlzQ29tcHV0ZWRQcm9wZXJ0eSkgcmVzdWx0ID0gcmVzdWx0LnZhbHVlKCk7XG4gICAgICAgIGlmKF8uaXNVbmRlZmluZWQocmVzdWx0KSB8fCBfLmlzTnVsbChyZXN1bHQpKSByZXR1cm4gcmVzdWx0O1xuICAgICAgICBpZihwYXJ0c1tpXSA9PT0gJ0BwYXJlbnQnKSByZXN1bHQgPSByZXN1bHQuX19wYXJlbnRfXztcbiAgICAgICAgZWxzZSBpZihyZXN1bHQuaXNDb2xsZWN0aW9uKSByZXN1bHQgPSByZXN1bHQubW9kZWxzW3BhcnRzW2ldXTtcbiAgICAgICAgZWxzZSBpZihyZXN1bHQuaXNNb2RlbCkgcmVzdWx0ID0gcmVzdWx0LmF0dHJpYnV0ZXNbcGFydHNbaV1dO1xuICAgICAgICBlbHNlIGlmKHJlc3VsdC5oYXNPd25Qcm9wZXJ0eShwYXJ0c1tpXSkpIHJlc3VsdCA9IHJlc3VsdFtwYXJ0c1tpXV07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYocmVzdWx0ICYmIHJlc3VsdC5pc0NvbXB1dGVkUHJvcGVydHkgJiYgIW9wdGlvbnMucmF3KSByZXN1bHQgPSByZXN1bHQudmFsdWUoKTtcblxuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cbiAgc2V0OiBmdW5jdGlvbihtb2RlbHMsIG9wdGlvbnMpe1xuICAgIHZhciBuZXdNb2RlbHMgPSBbXSxcbiAgICAgICAgbGluZWFnZSA9IHtcbiAgICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgICAgcm9vdDogdGhpcy5fX3Jvb3RfXyxcbiAgICAgICAgICBwYXRoOiBwYXRoR2VuZXJhdG9yKHRoaXMpLFxuICAgICAgICAgIHNpbGVudDogdHJ1ZVxuICAgICAgICB9O1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fSxcblxuICAgIC8vIElmIG5vIG1vZGVscyBwYXNzZWQsIGltcGxpZXMgYW4gZW1wdHkgYXJyYXlcbiAgICBtb2RlbHMgfHwgKG1vZGVscyA9IFtdKTtcblxuICAgIC8vIElmIG1vZGVscyBpcyBhIHN0cmluZywgY2FsbCBzZXQgYXQgdGhhdCBwYXRoXG4gICAgaWYoXy5pc1N0cmluZyhtb2RlbHMpKSByZXR1cm4gdGhpcy5nZXQoJC5zcGxpdFBhdGgobW9kZWxzKVswXSkuc2V0KCQuc3BsaXRQYXRoKG1vZGVscykuc3BsaWNlKDEsIG1vZGVscy5sZW5ndGgpLmpvaW4oJy4nKSwgb3B0aW9ucyk7XG4gICAgaWYoIV8uaXNPYmplY3QobW9kZWxzKSkgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0NvbGxlY3Rpb24uc2V0IG11c3QgYmUgcGFzc2VkIGEgTW9kZWwsIE9iamVjdCwgYXJyYXkgb3IgTW9kZWxzIGFuZCBPYmplY3RzLCBvciBhbm90aGVyIENvbGxlY3Rpb24nKTtcblxuICAgIC8vIElmIGFub3RoZXIgY29sbGVjdGlvbiwgdHJlYXQgbGlrZSBhbiBhcnJheVxuICAgIG1vZGVscyA9IChtb2RlbHMuaXNDb2xsZWN0aW9uKSA/IG1vZGVscy5tb2RlbHMgOiBtb2RlbHM7XG4gICAgLy8gRW5zdXJlIG1vZGVscyBpcyBhbiBhcnJheVxuICAgIG1vZGVscyA9ICghXy5pc0FycmF5KG1vZGVscykpID8gW21vZGVsc10gOiBtb2RlbHM7XG5cbiAgICAvLyBJZiB0aGUgbW9kZWwgYWxyZWFkeSBleGlzdHMgaW4gdGhpcyBjb2xsZWN0aW9uLCBvciB3ZSBhcmUgdG9sZCBub3QgdG8gY2xvbmUgaXQsIGxldCBCYWNrYm9uZSBoYW5kbGUgdGhlIG1lcmdlXG4gICAgLy8gT3RoZXJ3aXNlLCBjcmVhdGUgb3VyIGNvcHkgb2YgdGhpcyBtb2RlbCwgZ2l2ZSB0aGVtIHRoZSBzYW1lIGNpZCBzbyBvdXIgaGVscGVycyB0cmVhdCB0aGVtIGFzIHRoZSBzYW1lIG9iamVjdFxuICAgIF8uZWFjaChtb2RlbHMsIGZ1bmN0aW9uKGRhdGEsIGluZGV4KXtcbiAgICAgIGlmKGRhdGEuaXNNb2RlbCAmJiBvcHRpb25zLmNsb25lID09PSBmYWxzZSB8fCB0aGlzLl9ieUlkW2RhdGEuY2lkXSkgcmV0dXJuIG5ld01vZGVsc1tpbmRleF0gPSBkYXRhO1xuICAgICAgbmV3TW9kZWxzW2luZGV4XSA9IG5ldyB0aGlzLm1vZGVsKGRhdGEsIF8uZGVmYXVsdHMobGluZWFnZSwgb3B0aW9ucykpO1xuICAgICAgZGF0YS5pc01vZGVsICYmIChuZXdNb2RlbHNbaW5kZXhdLmNpZCA9IGRhdGEuY2lkKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIC8vIEVuc3VyZSB0aGF0IHRoaXMgZWxlbWVudCBub3cga25vd3MgdGhhdCBpdCBoYXMgY2hpbGRyZW4gbm93LiBXaXRob3V0IHRoaXMgY3ljbGljIGRlcGVuZGFuY2llcyBjYXVzZSBpc3N1ZXNcbiAgICB0aGlzLl9oYXNBbmNlc3RyeSB8fCAodGhpcy5faGFzQW5jZXN0cnkgPSBuZXdNb2RlbHMubGVuZ3RoID4gMCk7XG5cbiAgICAvLyBDYWxsIG9yaWdpbmFsIHNldCBmdW5jdGlvbiB3aXRoIG1vZGVsIGR1cGxpY2F0ZXNcbiAgICByZXR1cm4gQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuc2V0LmNhbGwodGhpcywgbmV3TW9kZWxzLCBvcHRpb25zKTtcblxuICB9XG5cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBDb2xsZWN0aW9uO1xuIiwiLy8gUmVib3VuZCBQcmVjb21waWxlclxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgeyBjb21waWxlIGFzIGh0bWxiYXJzQ29tcGlsZSwgY29tcGlsZVNwZWMgYXMgaHRtbGJhcnNDb21waWxlU3BlYyB9IGZyb20gXCJodG1sYmFyc1wiO1xuXG4vLyBSZW1vdmUgdGhlIGNvbnRlbnRzIG9mIHRoZSBjb21wb25lbnQncyBgc2NyaXB0YCB0YWcuXG5mdW5jdGlvbiBnZXRTY3JpcHQoc3RyKXtcbiAgcmV0dXJuIChzdHIuaW5kZXhPZignPHNjcmlwdD4nKSA+IC0xICYmIHN0ci5pbmRleE9mKCc8L3NjcmlwdD4nKSA+IC0xKSA/ICcoZnVuY3Rpb24oKXsnICsgc3RyLnJlcGxhY2UoLyguKjxzY3JpcHQ+KSguKikoPFxcL3NjcmlwdD4uKikvaWcsICckMicpICsgJ30pKCknIDogJ3t9Jztcbn1cblxuLy8gUmVtb3ZlIHRoZSBjb250ZW50cyBvZiB0aGUgY29tcG9uZW50J3MgYHN0eWxlYCB0YWcuXG5mdW5jdGlvbiBnZXRTdHlsZShzdHIpe1xuICByZXR1cm4gKHN0ci5pbmRleE9mKCc8c3R5bGU+JykgPiAtMSAmJiBzdHIuaW5kZXhPZignPC9zdHlsZT4nKSA+IC0xKSA/IHN0ci5yZXBsYWNlKC8oLio8c3R5bGU+KSguKikoPFxcL3N0eWxlPi4qKS9pZywgJyQyJykucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpIDogJyc7XG59XG5cbi8vIFJlbW92ZSB0aGUgY29udGVudHMgb2YgdGhlIGNvbXBvbmVudCdzIGB0ZW1wbGF0ZWAgdGFnLlxuZnVuY3Rpb24gZ2V0VGVtcGxhdGUoc3RyKXtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC8uKjx0ZW1wbGF0ZT4oLiopPFxcL3RlbXBsYXRlPi4qL2dpLCAnJDEnKS5yZXBsYWNlKC8oLiopPHN0eWxlPi4qPFxcL3N0eWxlPiguKikvaWcsICckMSQyJyk7XG59XG5cbi8vIEdldCB0aGUgY29tcG9uZW50J3MgbmFtZSBmcm9tIGl0cyBgbmFtZWAgYXR0cmlidXRlLlxuZnVuY3Rpb24gZ2V0TmFtZShzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLy4qPGVsZW1lbnRbXj5dKm5hbWU9KFtcIiddKT8oW14nXCI+XFxzXSspXFwxW148Pl0qPi4qL2lnLCAnJDInKTtcbn1cblxuLy8gTWluaWZ5IHRoZSBzdHJpbmcgcGFzc2VkIGluIGJ5IHJlcGxhY2luZyBhbGwgd2hpdGVzcGFjZS5cbmZ1bmN0aW9uIG1pbmlmeShzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1xccysvZywgJyAnKS5yZXBsYWNlKC9cXG58KD4pICg8KS9nLCAnJDEkMicpO1xufVxuXG4vLyBTdHJpcCBqYXZhc2NyaXB0IGNvbW1lbnRzXG5mdW5jdGlvbiByZW1vdmVDb21tZW50cyhzdHIpe1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyg/OlxcL1xcKig/OltcXHNcXFNdKj8pXFwqXFwvKXwoPzooW1xcc10pK1xcL1xcLyg/Oi4qKSQpL2dtLCAnJDEnKTtcbn1cblxuZnVuY3Rpb24gdGVtcGxhdGVGdW5jKGZuKSB7XG4gIHZhciBzcmMgPSBmbi50b1N0cmluZygpO1xuICBzcmMgPSBzcmMuc2xpY2Uoc3JjLmluZGV4T2YoXCJ7XCIpICsgMSwgLTEpO1xuICByZXR1cm4gZnVuY3Rpb24oZGF0YSkge1xuICAgIHJldHVybiAhZGF0YSA/IHNyYyA6IHNyYy5yZXBsYWNlKC8oXFwkW2EtekEtWl0rKS9nLCBmdW5jdGlvbigkcmVwKSB7XG4gICAgICB2YXIga2V5ID0gJHJlcC5zbGljZSgxKTtcbiAgICAgIHJldHVybiBkYXRhW2tleV0gfHwgXCJcIjtcbiAgICB9KTtcbiAgfTtcbn1cblxudmFyIENPTVBPTkVOVF9URU1QTEFURSA9IHRlbXBsYXRlRnVuYyhmdW5jdGlvbiAoKSB7XG4gIHJldHVybiAoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHdpbmRvdy5SZWJvdW5kLnJlZ2lzdGVyQ29tcG9uZW50KFwiJG5hbWVcIiwge1xuICAgICAgcHJvdG90eXBlOiAkc2NyaXB0LFxuICAgICAgdGVtcGxhdGU6ICR0ZW1wbGF0ZSxcbiAgICAgIHN0eWxlOiBcIiRzdHlsZVwiXG4gICAgfSk7XG4gIH0pKCk7XG59KTtcblxuZnVuY3Rpb24gcHJlY29tcGlsZShzdHIsIG9wdGlvbnMpe1xuICBpZiggIXN0ciB8fCBzdHIubGVuZ3RoID09PSAwICl7XG4gICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ05vIHRlbXBsYXRlIHByb3ZpZGVkIScpO1xuICB9XG5cbiAgLy8gUmVtb3ZlIGNvbW1lbnRzXG4gIHN0ciA9IHJlbW92ZUNvbW1lbnRzKHN0cik7XG4gIC8vIE1pbmlmeSBldmVyeXRoaW5nXG4gIHN0ciA9IG1pbmlmeShzdHIpO1xuXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICBvcHRpb25zLmJhc2VEZXN0ID0gb3B0aW9ucy5iYXNlRGVzdCB8fCAnJztcbiAgb3B0aW9ucy5uYW1lID0gb3B0aW9ucy5uYW1lIHx8ICcnO1xuICBvcHRpb25zLmJhc2VVcmwgPSBvcHRpb25zLmJhc2VVcmwgfHwgJyc7XG5cbiAgdmFyIHRlbXBsYXRlID0gc3RyLFxuICAgICAgc3R5bGUgPSAnJyxcbiAgICAgIHNjcmlwdCA9ICd7fScsXG4gICAgICBuYW1lID0gJycsXG4gICAgICBpc1BhcnRpYWwgPSB0cnVlLFxuICAgICAgaW1wb3J0cyA9IFtdLFxuICAgICAgcGFydGlhbHMsXG4gICAgICByZXF1aXJlLFxuICAgICAgZGVwcyA9IFtdO1xuXG4gIC8vIElmIHRoZSBlbGVtZW50IHRhZyBpcyBwcmVzZW50XG4gIGlmKHN0ci5pbmRleE9mKCc8ZWxlbWVudCcpID4gLTEgJiYgc3RyLmluZGV4T2YoJzwvZWxlbWVudD4nKSA+IC0xKXtcblxuICAgIGlzUGFydGlhbCA9IGZhbHNlO1xuXG4gICAgbmFtZSA9IGdldE5hbWUoc3RyKTtcbiAgICBzdHlsZSA9IGdldFN0eWxlKHN0cik7XG4gICAgdGVtcGxhdGUgPSBnZXRUZW1wbGF0ZShzdHIpO1xuICAgIHNjcmlwdCA9IGdldFNjcmlwdChzdHIpO1xuXG4gIH1cblxuXG4gIC8vIEFzc2VtcGxlIG91ciBjb21wb25lbnQgZGVwZW5kYW5jaWVzIGJ5IGZpbmRpbmcgbGluayB0YWdzIGFuZCBwYXJzaW5nIHRoZWlyIHNyY1xuICB2YXIgaW1wb3J0c3JlID0gLzxsaW5rIFteaF0qaHJlZj0oWydcIl0/KVxcLz8oW14uJ1wiXSopLmh0bWxcXDFbXj5dKj4vZ2ksXG4gICAgICBtYXRjaDtcblxuICB3aGlsZSAoKG1hdGNoID0gaW1wb3J0c3JlLmV4ZWModGVtcGxhdGUpKSAhPSBudWxsKSB7XG4gICAgICBpbXBvcnRzLnB1c2gobWF0Y2hbMl0pO1xuICB9XG4gIGltcG9ydHMuZm9yRWFjaChmdW5jdGlvbihpbXBvcnRTdHJpbmcsIGluZGV4KXtcbiAgICBkZXBzLnB1c2goJ1wiJyArIG9wdGlvbnMuYmFzZURlc3QgKyBpbXBvcnRTdHJpbmcgKyAnXCInKTtcbiAgfSk7XG5cbiAgLy8gUmVtb3ZlIGxpbmsgdGFncyBmcm9tIHRlbXBsYXRlXG4gIHRlbXBsYXRlID0gdGVtcGxhdGUucmVwbGFjZSgvPGxpbmsgLipocmVmPShbJ1wiXT8pKC4qKS5odG1sXFwxW14+XSo+L2dpLCAnJyk7XG5cbiAgLy8gQXNzZW1ibGUgb3VyIHBhcnRpYWwgZGVwZW5kYW5jaWVzXG4gIHBhcnRpYWxzID0gdGVtcGxhdGUubWF0Y2goL1xce1xcez5cXHMqP1snXCJdPyhbXidcIn1cXHNdKilbJ1wiXT9cXHMqP1xcfVxcfS9naSk7XG5cbiAgaWYocGFydGlhbHMpe1xuICAgIHBhcnRpYWxzLmZvckVhY2goZnVuY3Rpb24ocGFydGlhbCwgaW5kZXgpe1xuICAgICAgZGVwcy5wdXNoKCdcIicgKyBvcHRpb25zLmJhc2VEZXN0ICsgcGFydGlhbC5yZXBsYWNlKC9cXHtcXHs+W1xccypdP1snXCJdPyhbXidcIl0qKVsnXCJdP1tcXHMqXT9cXH1cXH0vZ2ksICckMScpICsgJ1wiJyk7XG4gICAgfSk7XG4gIH1cblxuICAvLyBDb21waWxlXG4gIHRlbXBsYXRlID0gJycgKyBodG1sYmFyc0NvbXBpbGVTcGVjKHRlbXBsYXRlKTtcblxuICAvLyBJZiBpcyBhIHBhcnRpYWxcbiAgaWYoaXNQYXJ0aWFsKXtcbiAgICB0ZW1wbGF0ZSA9ICcoZnVuY3Rpb24oKXt2YXIgdGVtcGxhdGUgPSAnK3RlbXBsYXRlKydcXG4gd2luZG93LlJlYm91bmQucmVnaXN0ZXJQYXJ0aWFsKCBcIicrIG9wdGlvbnMubmFtZSArJ1wiLCB0ZW1wbGF0ZSk7fSkoKTtcXG4nO1xuICB9XG4gIC8vIEVsc2UsIGlzIGEgY29tcG9uZW50XG4gIGVsc2V7XG4gICAgdGVtcGxhdGUgPSBDT01QT05FTlRfVEVNUExBVEUoe1xuICAgICAgbmFtZTogbmFtZSxcbiAgICAgIHNjcmlwdDogc2NyaXB0LFxuICAgICAgc3R5bGU6IHN0eWxlLFxuICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlXG4gICAgfSk7XG4gIH1cblxuICAvLyBXcmFwIGluIGRlZmluZVxuICB0ZW1wbGF0ZSA9IFwiZGVmaW5lKCBbXCIrIGRlcHMuam9pbignLCAnKSAgK1wiXSwgZnVuY3Rpb24oKXtcXG5cIiArIHRlbXBsYXRlICsgJ30pOyc7XG5cbiAgcmV0dXJuIHRlbXBsYXRlO1xufVxuXG5leHBvcnQgeyBwcmVjb21waWxlIH07XG4iLCIvLyBSZWJvdW5kIFJvdXRlclxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcblxuLy8gSWYgQmFja2JvbmUgaGFzbid0IGJlZW4gc3RhcnRlZCB5ZXQsIHRocm93IGVycm9yXG5pZighd2luZG93LkJhY2tib25lKXsgdGhyb3cgXCJCYWNrYm9uZSBtdXN0IGJlIG9uIHRoZSBwYWdlIGZvciBSZWJvdW5kIHRvIGxvYWQuXCI7IH1cblxuICAvLyBDbGVhbiB1cCBvbGQgcGFnZSBjb21wb25lbnQgYW5kIGxvYWQgcm91dGVzIGZyb20gb3VyIG5ldyBwYWdlIGNvbXBvbmVudFxuICBmdW5jdGlvbiBpbnN0YWxsUmVzb3VyY2VzKFBhZ2VBcHAsIHByaW1hcnlSb3V0ZSwgaXNHbG9iYWwpIHtcbiAgICB2YXIgb2xkUGFnZU5hbWUsIHBhZ2VJbnN0YW5jZSwgY29udGFpbmVyLCByb3V0ZXIgPSB0aGlzO1xuXG4gICAgLy8gRGUtaW5pdGlhbGl6ZSB0aGUgcHJldmlvdXMgYXBwIGJlZm9yZSByZW5kZXJpbmcgYSBuZXcgYXBwXG4gICAgLy8gVGhpcyB3YXkgd2UgY2FuIGVuc3VyZSB0aGF0IGV2ZXJ5IG5ldyBwYWdlIHN0YXJ0cyB3aXRoIGEgY2xlYW4gc2xhdGVcbiAgICAvLyBUaGlzIGlzIGNydWNpYWwgZm9yIHNjYWxhYmlsaXR5IG9mIGEgc2luZ2xlIHBhZ2UgYXBwLlxuICAgIGlmKCFpc0dsb2JhbCAmJiB0aGlzLmN1cnJlbnQpe1xuXG4gICAgICBvbGRQYWdlTmFtZSA9IHRoaXMuY3VycmVudC5fX25hbWU7XG4gICAgICAvLyBVbnNldCBQcmV2aW91cyBBcHBsaWNhdGlvbidzIFJvdXRlcy4gRm9yIGVhY2ggcm91dGUgaW4gdGhlIHBhZ2UgYXBwOlxuICAgICAgXy5lYWNoKHRoaXMuY3VycmVudC5fX2NvbXBvbmVudF9fLnJvdXRlcywgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcblxuICAgICAgICB2YXIgcmVnRXhwID0gcm91dGVyLl9yb3V0ZVRvUmVnRXhwKGtleSkudG9TdHJpbmcoKTtcblxuICAgICAgICAvLyBSZW1vdmUgdGhlIGhhbmRsZXIgZnJvbSBvdXIgcm91dGUgb2JqZWN0XG4gICAgICAgIEJhY2tib25lLmhpc3RvcnkuaGFuZGxlcnMgPSBfLmZpbHRlcihCYWNrYm9uZS5oaXN0b3J5LmhhbmRsZXJzLCBmdW5jdGlvbihvYmope3JldHVybiBvYmoucm91dGUudG9TdHJpbmcoKSAhPT0gcmVnRXhwO30pO1xuXG4gICAgICAgIC8vIERlbGV0ZSBvdXIgcmVmZXJhbmNlIHRvIHRoZSByb3V0ZSdzIGNhbGxiYWNrXG4gICAgICAgIGRlbGV0ZSByb3V0ZXJbICdfZnVuY3Rpb25fJyArIGtleSBdO1xuXG4gICAgICB9KTtcblxuICAgICAgLy8gVW4taG9vayBFdmVudCBCaW5kaW5ncywgRGVsZXRlIE9iamVjdHNcbiAgICAgIHRoaXMuY3VycmVudC5fX2NvbXBvbmVudF9fLmRlaW5pdGlhbGl6ZSgpO1xuXG4gICAgICAvLyBEaXNhYmxlIG9sZCBjc3MgaWYgaXQgZXhpc3RzXG4gICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKG9sZFBhZ2VOYW1lICsgJy1jc3MnKS5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgdHJ1ZSk7XG4gICAgICB9LCA1MDApO1xuXG4gICAgfVxuXG4gICAgLy8gTG9hZCBOZXcgUGFnZUFwcCwgZ2l2ZSBpdCBpdCdzIG5hbWUgc28gd2Uga25vdyB3aGF0IGNzcyB0byByZW1vdmUgd2hlbiBpdCBkZWluaXRpYWxpemVzXG4gICAgcGFnZUluc3RhbmNlID0gbmV3IFBhZ2VBcHAoKTtcbiAgICBwYWdlSW5zdGFuY2UuX19uYW1lID0gcHJpbWFyeVJvdXRlO1xuXG4gICAgLy8gQWRkIHRvIG91ciBwYWdlXG4gICAgY29udGFpbmVyID0gKGlzR2xvYmFsKSA/IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoaXNHbG9iYWwpIDogZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2NvbnRlbnQnKVswXTtcbiAgICBjb250YWluZXIuaW5uZXJIVE1MID0gJyc7XG4gICAgY29udGFpbmVyLmFwcGVuZENoaWxkKHBhZ2VJbnN0YW5jZSk7XG5cbiAgICAvLyBNYWtlIHN1cmUgd2UncmUgYmFjayBhdCB0aGUgdG9wIG9mIHRoZSBwYWdlXG4gICAgZG9jdW1lbnQuYm9keS5zY3JvbGxUb3AgPSAwO1xuXG4gICAgLy8gQXVnbWVudCBBcHBsaWNhdGlvblJvdXRlciB3aXRoIG5ldyByb3V0ZXMgZnJvbSBQYWdlQXBwXG4gICAgXy5lYWNoKHBhZ2VJbnN0YW5jZS5fX2NvbXBvbmVudF9fLnJvdXRlcywgZnVuY3Rpb24gKHZhbHVlLCBrZXkpIHtcbiAgICAgIC8vIEdlbmVyYXRlIG91ciByb3V0ZSBjYWxsYmFjaydzIG5ldyBuYW1lXG4gICAgICB2YXIgcm91dGVGdW5jdGlvbk5hbWUgPSAnX2Z1bmN0aW9uXycgKyBrZXksXG4gICAgICAgICAgZnVuY3Rpb25OYW1lO1xuICAgICAgLy8gQWRkIHRoZSBuZXcgY2FsbGJhY2sgcmVmZXJhbmNlIG9uIHRvIG91ciByb3V0ZXJcbiAgICAgIHJvdXRlcltyb3V0ZUZ1bmN0aW9uTmFtZV0gPSAgZnVuY3Rpb24gKCkgeyBwYWdlSW5zdGFuY2UuX19jb21wb25lbnRfX1t2YWx1ZV0uYXBwbHkocGFnZUluc3RhbmNlLl9fY29tcG9uZW50X18sIGFyZ3VtZW50cyk7IH07XG4gICAgICAvLyBBZGQgdGhlIHJvdXRlIGhhbmRsZXJcbiAgICAgIHJvdXRlci5yb3V0ZShrZXksIHZhbHVlLCB0aGlzW3JvdXRlRnVuY3Rpb25OYW1lXSk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICBpZighaXNHbG9iYWwpe1xuICAgICAgd2luZG93LlJlYm91bmQucGFnZSA9ICh0aGlzLmN1cnJlbnQgPSBwYWdlSW5zdGFuY2UpLl9fY29tcG9uZW50X187XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIG91ciBuZXdseSBpbnN0YWxsZWQgYXBwXG4gICAgcmV0dXJuIHBhZ2VJbnN0YW5jZTtcbiAgfVxuXG4gIC8vIEZldGNoZXMgUGFyZSBIVE1MIGFuZCBDU1NcbiAgZnVuY3Rpb24gZmV0Y2hSZXNvdXJjZXMoYXBwTmFtZSwgcHJpbWFyeVJvdXRlLCBpc0dsb2JhbCkge1xuXG4gICAgLy8gRXhwZWN0aW5nIE1vZHVsZSBEZWZpbml0aW9uIGFzICdTZWFyY2hBcHAnIFdoZXJlICdTZWFyY2gnIGEgUHJpbWFyeSBSb3V0ZVxuICAgIHZhciBqc1VybCA9IHRoaXMuY29uZmlnLmpzUGF0aC5yZXBsYWNlKC86cm91dGUvZywgcHJpbWFyeVJvdXRlKS5yZXBsYWNlKC86YXBwL2csIGFwcE5hbWUpLFxuICAgICAgICBjc3NVcmwgPSB0aGlzLmNvbmZpZy5jc3NQYXRoLnJlcGxhY2UoLzpyb3V0ZS9nLCBwcmltYXJ5Um91dGUpLnJlcGxhY2UoLzphcHAvZywgYXBwTmFtZSksXG4gICAgICAgIGNzc0xvYWRlZCA9IGZhbHNlLFxuICAgICAgICBqc0xvYWRlZCA9IGZhbHNlLFxuICAgICAgICBjc3NFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXBwTmFtZSArICctY3NzJyksXG4gICAgICAgIGpzRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFwcE5hbWUgKyAnLWpzJyksXG4gICAgICAgIHJvdXRlciA9IHRoaXMsXG4gICAgICAgIFBhZ2VBcHA7XG5cbiAgICAgIC8vIE9ubHkgTG9hZCBDU1MgSWYgTm90IExvYWRlZCBCZWZvcmVcbiAgICAgIGlmKCFjc3NFbGVtZW50KXtcbiAgICAgICAgY3NzRWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpbmsnKTtcbiAgICAgICAgY3NzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dC9jc3MnKTtcbiAgICAgICAgY3NzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3JlbCcsICdzdHlsZXNoZWV0Jyk7XG4gICAgICAgIGNzc0VsZW1lbnQuc2V0QXR0cmlidXRlKCdocmVmJywgY3NzVXJsKTtcbiAgICAgICAgY3NzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2lkJywgYXBwTmFtZSArICctY3NzJyk7XG4gICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoY3NzRWxlbWVudCk7XG4gICAgICAgICQoY3NzRWxlbWVudCkub24oJ2xvYWQnLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICBpZigoY3NzTG9hZGVkID0gdHJ1ZSkgJiYganNMb2FkZWQpe1xuICAgICAgICAgICAgICAvLyBJbnN0YWxsIFRoZSBMb2FkZWQgUmVzb3VyY2VzXG4gICAgICAgICAgICAgIGluc3RhbGxSZXNvdXJjZXMuY2FsbChyb3V0ZXIsIFBhZ2VBcHAsIGFwcE5hbWUsIGlzR2xvYmFsKTtcblxuICAgICAgICAgICAgICAvLyBSZS10cmlnZ2VyIHJvdXRlIHNvIHRoZSBuZXdseSBhZGRlZCByb3V0ZSBtYXkgZXhlY3V0ZSBpZiB0aGVyZSdzIGEgcm91dGUgbWF0Y2guXG4gICAgICAgICAgICAgIC8vIElmIG5vIHJvdXRlcyBhcmUgbWF0Y2hlZCwgYXBwIHdpbGwgaGl0IHdpbGRDYXJkIHJvdXRlIHdoaWNoIHdpbGwgdGhlbiB0cmlnZ2VyIDQwNFxuICAgICAgICAgICAgICBpZighaXNHbG9iYWwgJiYgcm91dGVyLmNvbmZpZy50cmlnZ2VyT25GaXJzdExvYWQpe1xuICAgICAgICAgICAgICAgIEJhY2tib25lLmhpc3RvcnkubG9hZFVybChCYWNrYm9uZS5oaXN0b3J5LmZyYWdtZW50KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZighaXNHbG9iYWwpe1xuICAgICAgICAgICAgICAgIHJvdXRlci5jb25maWcudHJpZ2dlck9uRmlyc3RMb2FkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIC8vIElmIGl0IGhhcyBiZWVuIGxvYWRlZCBiZXZvcmUsIGVuYWJsZSBpdFxuICAgICAgZWxzZSB7XG4gICAgICAgIGNzc0VsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCdkaXNhYmxlZCcpO1xuICAgICAgICBjc3NMb2FkZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBJZiBpZiByZXF1aXJlanMgaXMgbm90IG9uIHRoZSBwYWdlLCBsb2FkIHRoZSBmaWxlIG1hbnVhbGx5LiBJdCBiZXR0ZXIgY29udGFpbiBhbGwgaXRzIGRlcGVuZGFuY2llcy5cbiAgICAgIGlmKHdpbmRvdy5yZXF1aXJlLl9kZWZpbmVkIHx8IF8uaXNVbmRlZmluZWQod2luZG93LnJlcXVpcmUpKXtcbiAgICAgICAgICBqc0VsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKTtcbiAgICAgICAgICBqc0VsZW1lbnQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ3RleHQvamF2YXNjcmlwdCcpO1xuICAgICAgICAgIGpzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ3NyYycsICcvJytqc1VybCsnLmpzJyk7XG4gICAgICAgICAganNFbGVtZW50LnNldEF0dHJpYnV0ZSgnaWQnLCBhcHBOYW1lICsgJy1qcycpO1xuICAgICAgICAgIGRvY3VtZW50LmhlYWQuYXBwZW5kQ2hpbGQoanNFbGVtZW50KTtcbiAgICAgICAgICAkKGpzRWxlbWVudCkub24oJ2xvYWQnLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAvLyBBTUQgV2lsbCBNYW5hZ2UgRGVwZW5kYW5jaWVzIEZvciBVcy4gTG9hZCBUaGUgQXBwLlxuICAgICAgICAgICAgcmVxdWlyZShbanNVcmxdLCBmdW5jdGlvbihQYWdlQ2xhc3Mpe1xuXG4gICAgICAgICAgICAgIGlmKChqc0xvYWRlZCA9IHRydWUpICYmIChQYWdlQXBwID0gUGFnZUNsYXNzKSAmJiBjc3NMb2FkZWQpe1xuXG4gICAgICAgICAgICAgICAgLy8gSW5zdGFsbCBUaGUgTG9hZGVkIFJlc291cmNlc1xuICAgICAgICAgICAgICAgIGluc3RhbGxSZXNvdXJjZXMuY2FsbChyb3V0ZXIsIFBhZ2VBcHAsIGFwcE5hbWUsIGlzR2xvYmFsKTtcbiAgICAgICAgICAgICAgICAvLyBSZS10cmlnZ2VyIHJvdXRlIHNvIHRoZSBuZXdseSBhZGRlZCByb3V0ZSBtYXkgZXhlY3V0ZSBpZiB0aGVyZSdzIGEgcm91dGUgbWF0Y2guXG4gICAgICAgICAgICAgICAgLy8gSWYgbm8gcm91dGVzIGFyZSBtYXRjaGVkLCBhcHAgd2lsbCBoaXQgd2lsZENhcmQgcm91dGUgd2hpY2ggd2lsbCB0aGVuIHRyaWdnZXIgNDA0XG4gICAgICAgICAgICAgICAgaWYoIWlzR2xvYmFsICYmIHJvdXRlci5jb25maWcudHJpZ2dlck9uRmlyc3RMb2FkKXtcbiAgICAgICAgICAgICAgICAgIEJhY2tib25lLmhpc3RvcnkubG9hZFVybChCYWNrYm9uZS5oaXN0b3J5LmZyYWdtZW50KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYoIWlzR2xvYmFsKXtcbiAgICAgICAgICAgICAgICAgIHJvdXRlci5jb25maWcudHJpZ2dlck9uRmlyc3RMb2FkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5yZW1vdmUoJ2xvYWRpbmcnKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIC8vIEFNRCBXaWxsIE1hbmFnZSBEZXBlbmRhbmNpZXMgRm9yIFVzLiBMb2FkIFRoZSBBcHAuXG4gICAgICAgIHdpbmRvdy5yZXF1aXJlKFtqc1VybF0sIGZ1bmN0aW9uKFBhZ2VDbGFzcyl7XG5cbiAgICAgICAgICBpZigoanNMb2FkZWQgPSB0cnVlKSAmJiAoUGFnZUFwcCA9IFBhZ2VDbGFzcykgJiYgY3NzTG9hZGVkKXtcblxuICAgICAgICAgICAgLy8gSW5zdGFsbCBUaGUgTG9hZGVkIFJlc291cmNlc1xuICAgICAgICAgICAgaW5zdGFsbFJlc291cmNlcy5jYWxsKHJvdXRlciwgUGFnZUFwcCwgYXBwTmFtZSwgaXNHbG9iYWwpO1xuICAgICAgICAgICAgLy8gUmUtdHJpZ2dlciByb3V0ZSBzbyB0aGUgbmV3bHkgYWRkZWQgcm91dGUgbWF5IGV4ZWN1dGUgaWYgdGhlcmUncyBhIHJvdXRlIG1hdGNoLlxuICAgICAgICAgICAgLy8gSWYgbm8gcm91dGVzIGFyZSBtYXRjaGVkLCBhcHAgd2lsbCBoaXQgd2lsZENhcmQgcm91dGUgd2hpY2ggd2lsbCB0aGVuIHRyaWdnZXIgNDA0XG4gICAgICAgICAgICBpZighaXNHbG9iYWwgJiYgcm91dGVyLmNvbmZpZy50cmlnZ2VyT25GaXJzdExvYWQpe1xuICAgICAgICAgICAgICBCYWNrYm9uZS5oaXN0b3J5LmxvYWRVcmwoQmFja2JvbmUuaGlzdG9yeS5mcmFnbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmKCFpc0dsb2JhbCl7XG4gICAgICAgICAgICAgIHJvdXRlci5jb25maWcudHJpZ2dlck9uRmlyc3RMb2FkID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgfVxuXG4gIC8vIFJlYm91bmRSb3V0ZXIgQ29uc3RydWN0b3JcbiAgdmFyIFJlYm91bmRSb3V0ZXIgPSBCYWNrYm9uZS5Sb3V0ZXIuZXh0ZW5kKHtcblxuICAgIHJvdXRlczoge1xuICAgICAgJypyb3V0ZSc6ICd3aWxkY2FyZFJvdXRlJ1xuICAgIH0sXG5cbiAgICAvLyBDYWxsZWQgd2hlbiBubyBtYXRjaGluZyByb3V0ZXMgYXJlIGZvdW5kLiBFeHRyYWN0cyByb290IHJvdXRlIGFuZCBmZXRjaGVzIGl0IHJlc291cmNlc1xuICAgIHdpbGRjYXJkUm91dGU6IGZ1bmN0aW9uKHJvdXRlKSB7XG4gICAgICB2YXIgYXBwTmFtZSwgcHJpbWFyeVJvdXRlO1xuXG4gICAgICAvLyBJZiBlbXB0eSByb3V0ZSBzZW50LCByb3V0ZSBob21lXG4gICAgICByb3V0ZSA9IHJvdXRlIHx8ICcnO1xuXG4gICAgICAvLyBHZXQgUm9vdCBvZiBSb3V0ZVxuICAgICAgYXBwTmFtZSA9IHByaW1hcnlSb3V0ZSA9IChyb3V0ZSkgPyByb3V0ZS5zcGxpdCgnLycpWzBdIDogJ2luZGV4JztcblxuICAgICAgLy8gRmluZCBBbnkgQ3VzdG9tIFJvdXRlIE1hcHBpbmdzXG4gICAgICBfLmFueSh0aGlzLmNvbmZpZy5oYW5kbGVycywgZnVuY3Rpb24oaGFuZGxlcikge1xuICAgICAgICBpZiAoaGFuZGxlci5yb3V0ZS50ZXN0KHJvdXRlKSkge1xuICAgICAgICAgIGFwcE5hbWUgPSBoYW5kbGVyLnByaW1hcnlSb3V0ZTtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIC8vIElmIFBhZ2UgSXMgQWxyZWFkeSBMb2FkZWQgVGhlbiBUaGUgUm91dGUgRG9lcyBOb3QgRXhpc3QuIDQwNCBhbmQgRXhpdC5cbiAgICAgIGlmICh0aGlzLmN1cnJlbnQgJiYgdGhpcy5jdXJyZW50Lm5hbWUgPT09IHByaW1hcnlSb3V0ZSkge1xuICAgICAgICByZXR1cm4gQmFja2JvbmUuaGlzdG9yeS5sb2FkVXJsKCc0MDQnKTtcbiAgICAgIH1cblxuICAgICAgLy8gRmV0Y2ggUmVzb3VyY2VzXG4gICAgICBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5hZGQoXCJsb2FkaW5nXCIpO1xuICAgICAgZmV0Y2hSZXNvdXJjZXMuY2FsbCh0aGlzLCBhcHBOYW1lLCBwcmltYXJ5Um91dGUpO1xuICAgIH0sXG5cbiAgICAvLyBPbiBzdGFydHVwLCBzYXZlIG91ciBjb25maWcgb2JqZWN0IGFuZCBzdGFydCB0aGUgcm91dGVyXG4gICAgaW5pdGlhbGl6ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuXG4gICAgICAvLyBTYXZlIG91ciBjb25maWcgcmVmZXJhbmNlXG4gICAgICB0aGlzLmNvbmZpZyA9IG9wdGlvbnMuY29uZmlnO1xuICAgICAgdGhpcy5jb25maWcuaGFuZGxlcnMgPSBbXTtcblxuICAgICAgdmFyIHJlbW90ZVVybCA9IC9eKFthLXpdKzopfF4oXFwvXFwvKXxeKFteXFwvXStcXC4pLyxcblxuICAgICAgcm91dGVyID0gdGhpcztcblxuICAgICAgLy8gQ29udmVydCBvdXIgcm91dGVNYXBwaW5ncyB0byByZWdleHBzIGFuZCBwdXNoIHRvIG91ciBoYW5kbGVyc1xuICAgICAgXy5lYWNoKHRoaXMuY29uZmlnLnJvdXRlTWFwcGluZywgZnVuY3Rpb24odmFsdWUsIHJvdXRlKXtcbiAgICAgICAgaWYgKCFfLmlzUmVnRXhwKHJvdXRlKSkgcm91dGUgPSByb3V0ZXIuX3JvdXRlVG9SZWdFeHAocm91dGUpO1xuICAgICAgICByb3V0ZXIuY29uZmlnLmhhbmRsZXJzLnVuc2hpZnQoeyByb3V0ZTogcm91dGUsIHByaW1hcnlSb3V0ZTogdmFsdWUgfSk7XG4gICAgICB9LCB0aGlzKTtcblxuICAgICAgLy8gTmF2aWdhdGUgdG8gcm91dGUgZm9yIGFueSBsaW5rIHdpdGggYSByZWxhdGl2ZSBocmVmXG4gICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYScsIGZ1bmN0aW9uKGUpe1xuXG4gICAgICAgIHZhciBwYXRoID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG5cbiAgICAgICAgLy8gSWYgcGF0aCBpcyBub3QgYW4gcmVtb3RlIHVybCwgZW5kcyBpbiAuW2Etel0sIG9yIGJsYW5rLCB0cnkgYW5kIG5hdmlnYXRlIHRvIHRoYXQgcm91dGUuXG4gICAgICAgIGlmKCBwYXRoICYmIHBhdGggIT09ICcjJyAmJiAhcmVtb3RlVXJsLnRlc3QocGF0aCkgKXtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgcm91dGVyLm5hdmlnYXRlKHBhdGgsIHt0cmlnZ2VyOiB0cnVlfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBJbnN0YWxsIG91ciBnbG9iYWwgY29tcG9uZW50c1xuICAgICAgXy5lYWNoKHRoaXMuY29uZmlnLmdsb2JhbENvbXBvbmVudHMsIGZ1bmN0aW9uKHNlbGVjdG9yLCByb3V0ZSl7XG4gICAgICAgIGZldGNoUmVzb3VyY2VzLmNhbGwocm91dGVyLCByb3V0ZSwgcm91dGUsIHNlbGVjdG9yKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBMZXQgYWxsIG9mIG91ciBjb21wb25lbnRzIGFsd2F5cyBoYXZlIHJlZmVyYW5jZSB0byBvdXIgcm91dGVyXG4gICAgICBSZWJvdW5kLkNvbXBvbmVudC5wcm90b3R5cGUucm91dGVyID0gdGhpcztcblxuICAgICAgLy8gU3RhcnQgdGhlIGhpc3RvcnlcbiAgICAgIEJhY2tib25lLmhpc3Rvcnkuc3RhcnQoe1xuICAgICAgICBwdXNoU3RhdGU6IHRydWUsXG4gICAgICAgIHJvb3Q6IHRoaXMuY29uZmlnLnJvb3RcbiAgICAgIH0pO1xuXG4gICAgfVxuICB9KTtcblxuZXhwb3J0IGRlZmF1bHQgUmVib3VuZFJvdXRlcjtcbiIsIi8vICAgICBSZWJvdW5kLmpzIDAuMC40N1xuXG4vLyAgICAgKGMpIDIwMTUgQWRhbSBNaWxsZXJcbi8vICAgICBSZWJvdW5kIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuLy8gICAgIEZvciBhbGwgZGV0YWlscyBhbmQgZG9jdW1lbnRhdGlvbjpcbi8vICAgICBodHRwOi8vcmVib3VuZGpzLmNvbVxuXG4vLyBSZWJvdW5kIFJ1bnRpbWVcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuLy8gSWYgQmFja2JvbmUgaXNuJ3QgcHJlc2V0IG9uIHRoZSBwYWdlIHlldCwgb3IgaWYgYHdpbmRvdy5SZWJvdW5kYCBpcyBhbHJlYWR5XG4vLyBpbiB1c2UsIHRocm93IGFuIGVycm9yXG5pZighd2luZG93LkJhY2tib25lKSB0aHJvdyBcIkJhY2tib25lIG11c3QgYmUgb24gdGhlIHBhZ2UgZm9yIFJlYm91bmQgdG8gbG9hZC5cIjtcbmlmKCF3aW5kb3cuUmVib3VuZCkgdGhyb3cgXCJHbG9iYWwgUmVib3VuZCBuYW1lc3BhY2UgYWxyZWFkeSB0YWtlbi5cIjtcblxuLy8gTG9hZCBvdXIgKipVdGlscyoqLCBoZWxwZXIgZW52aXJvbm1lbnQsICoqUmVib3VuZCBEYXRhKiosXG4vLyAqKlJlYm91bmQgQ29tcG9uZW50cyoqIGFuZCB0aGUgKipSZWJvdW5kIFJvdXRlcioqXG5pbXBvcnQgdXRpbHMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5pbXBvcnQgaGVscGVycyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaGVscGVyc1wiO1xuaW1wb3J0IHsgTW9kZWwsIENvbGxlY3Rpb24sIENvbXB1dGVkUHJvcGVydHkgfSBmcm9tIFwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YVwiO1xuaW1wb3J0IENvbXBvbmVudCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvY29tcG9uZW50XCI7XG5pbXBvcnQgUm91dGVyIGZyb20gXCJyZWJvdW5kLXJvdXRlci9yZWJvdW5kLXJvdXRlclwiO1xuXG4vLyBJZiBCYWNrYm9uZSBkb2Vzbid0IGhhdmUgYW4gYWpheCBtZXRob2QgZnJvbSBhbiBleHRlcm5hbCBET00gbGlicmFyeSwgdXNlIG91cnNcbndpbmRvdy5CYWNrYm9uZS5hamF4ID0gd2luZG93LkJhY2tib25lLiQgJiYgd2luZG93LkJhY2tib25lLiQuYWpheCAmJiB3aW5kb3cuQmFja2JvbmUuYWpheCB8fCB1dGlscy5hamF4O1xuXG4vLyBGZXRjaCBSZWJvdW5kJ3MgQ29uZmlnIE9iamVjdCBmcm9tIFJlYm91bmQncyBgc2NyaXB0YCB0YWdcbnZhciBDb25maWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnUmVib3VuZCcpLmlubmVySFRNTDtcblxuLy8gQ3JlYXRlIEdsb2JhbCBSZWJvdW5kIE9iamVjdFxud2luZG93LlJlYm91bmQgPSB7XG4gIHJlZ2lzdGVySGVscGVyOiBoZWxwZXJzLnJlZ2lzdGVySGVscGVyLFxuICByZWdpc3RlclBhcnRpYWw6IGhlbHBlcnMucmVnaXN0ZXJQYXJ0aWFsLFxuICByZWdpc3RlckNvbXBvbmVudDogQ29tcG9uZW50LnJlZ2lzdGVyLFxuICBNb2RlbDogTW9kZWwsXG4gIENvbGxlY3Rpb246IENvbGxlY3Rpb24sXG4gIENvbXB1dGVkUHJvcGVydHk6IENvbXB1dGVkUHJvcGVydHksXG4gIENvbXBvbmVudDogQ29tcG9uZW50XG59O1xuXG4vLyBTdGFydCB0aGUgcm91dGVyIGlmIGEgY29uZmlnIG9iamVjdCBpcyBwcmVzZXRcbmlmKENvbmZpZykgd2luZG93LlJlYm91bmQucm91dGVyID0gbmV3IFJvdXRlcih7Y29uZmlnOiBKU09OLnBhcnNlKENvbmZpZyl9KTtcblxuZXhwb3J0IGRlZmF1bHQgUmVib3VuZDtcbiIsIi8qanNoaW50IC1XMDU0ICovXG4vLyBqc2hpbnQgaWdub3JlOiBzdGFydFxuXG4gIC8vIEEgc2Vjb25kIG9wdGlvbmFsIGFyZ3VtZW50IGNhbiBiZSBnaXZlbiB0byBmdXJ0aGVyIGNvbmZpZ3VyZVxuICAvLyB0aGUgcGFyc2VyIHByb2Nlc3MuIFRoZXNlIG9wdGlvbnMgYXJlIHJlY29nbml6ZWQ6XG5cbiAgdmFyIGV4cG9ydHMgPSB7fTtcblxuICB2YXIgb3B0aW9ucywgaW5wdXQsIGlucHV0TGVuLCBzb3VyY2VGaWxlO1xuXG4gIHZhciBkZWZhdWx0T3B0aW9ucyA9IGV4cG9ydHMuZGVmYXVsdE9wdGlvbnMgPSB7XG4gICAgLy8gYGVjbWFWZXJzaW9uYCBpbmRpY2F0ZXMgdGhlIEVDTUFTY3JpcHQgdmVyc2lvbiB0byBwYXJzZS4gTXVzdFxuICAgIC8vIGJlIGVpdGhlciAzLCBvciA1LCBvciA2LiBUaGlzIGluZmx1ZW5jZXMgc3VwcG9ydCBmb3Igc3RyaWN0XG4gICAgLy8gbW9kZSwgdGhlIHNldCBvZiByZXNlcnZlZCB3b3Jkcywgc3VwcG9ydCBmb3IgZ2V0dGVycyBhbmRcbiAgICAvLyBzZXR0ZXJzIGFuZCBvdGhlciBmZWF0dXJlcy4gRVM2IHN1cHBvcnQgaXMgb25seSBwYXJ0aWFsLlxuICAgIGVjbWFWZXJzaW9uOiA1LFxuICAgIC8vIFR1cm4gb24gYHN0cmljdFNlbWljb2xvbnNgIHRvIHByZXZlbnQgdGhlIHBhcnNlciBmcm9tIGRvaW5nXG4gICAgLy8gYXV0b21hdGljIHNlbWljb2xvbiBpbnNlcnRpb24uXG4gICAgc3RyaWN0U2VtaWNvbG9uczogZmFsc2UsXG4gICAgLy8gV2hlbiBgYWxsb3dUcmFpbGluZ0NvbW1hc2AgaXMgZmFsc2UsIHRoZSBwYXJzZXIgd2lsbCBub3QgYWxsb3dcbiAgICAvLyB0cmFpbGluZyBjb21tYXMgaW4gYXJyYXkgYW5kIG9iamVjdCBsaXRlcmFscy5cbiAgICBhbGxvd1RyYWlsaW5nQ29tbWFzOiB0cnVlLFxuICAgIC8vIEJ5IGRlZmF1bHQsIHJlc2VydmVkIHdvcmRzIGFyZSBub3QgZW5mb3JjZWQuIEVuYWJsZVxuICAgIC8vIGBmb3JiaWRSZXNlcnZlZGAgdG8gZW5mb3JjZSB0aGVtLiBXaGVuIHRoaXMgb3B0aW9uIGhhcyB0aGVcbiAgICAvLyB2YWx1ZSBcImV2ZXJ5d2hlcmVcIiwgcmVzZXJ2ZWQgd29yZHMgYW5kIGtleXdvcmRzIGNhbiBhbHNvIG5vdCBiZVxuICAgIC8vIHVzZWQgYXMgcHJvcGVydHkgbmFtZXMuXG4gICAgZm9yYmlkUmVzZXJ2ZWQ6IGZhbHNlLFxuICAgIC8vIFdoZW4gZW5hYmxlZCwgYSByZXR1cm4gYXQgdGhlIHRvcCBsZXZlbCBpcyBub3QgY29uc2lkZXJlZCBhblxuICAgIC8vIGVycm9yLlxuICAgIGFsbG93UmV0dXJuT3V0c2lkZUZ1bmN0aW9uOiBmYWxzZSxcbiAgICAvLyBXaGVuIGBsb2NhdGlvbnNgIGlzIG9uLCBgbG9jYCBwcm9wZXJ0aWVzIGhvbGRpbmcgb2JqZWN0cyB3aXRoXG4gICAgLy8gYHN0YXJ0YCBhbmQgYGVuZGAgcHJvcGVydGllcyBpbiBge2xpbmUsIGNvbHVtbn1gIGZvcm0gKHdpdGhcbiAgICAvLyBsaW5lIGJlaW5nIDEtYmFzZWQgYW5kIGNvbHVtbiAwLWJhc2VkKSB3aWxsIGJlIGF0dGFjaGVkIHRvIHRoZVxuICAgIC8vIG5vZGVzLlxuICAgIGxvY2F0aW9uczogZmFsc2UsXG4gICAgLy8gQSBmdW5jdGlvbiBjYW4gYmUgcGFzc2VkIGFzIGBvbkNvbW1lbnRgIG9wdGlvbiwgd2hpY2ggd2lsbFxuICAgIC8vIGNhdXNlIEFjb3JuIHRvIGNhbGwgdGhhdCBmdW5jdGlvbiB3aXRoIGAoYmxvY2ssIHRleHQsIHN0YXJ0LFxuICAgIC8vIGVuZClgIHBhcmFtZXRlcnMgd2hlbmV2ZXIgYSBjb21tZW50IGlzIHNraXBwZWQuIGBibG9ja2AgaXMgYVxuICAgIC8vIGJvb2xlYW4gaW5kaWNhdGluZyB3aGV0aGVyIHRoaXMgaXMgYSBibG9jayAoYC8qICovYCkgY29tbWVudCxcbiAgICAvLyBgdGV4dGAgaXMgdGhlIGNvbnRlbnQgb2YgdGhlIGNvbW1lbnQsIGFuZCBgc3RhcnRgIGFuZCBgZW5kYCBhcmVcbiAgICAvLyBjaGFyYWN0ZXIgb2Zmc2V0cyB0aGF0IGRlbm90ZSB0aGUgc3RhcnQgYW5kIGVuZCBvZiB0aGUgY29tbWVudC5cbiAgICAvLyBXaGVuIHRoZSBgbG9jYXRpb25zYCBvcHRpb24gaXMgb24sIHR3byBtb3JlIHBhcmFtZXRlcnMgYXJlXG4gICAgLy8gcGFzc2VkLCB0aGUgZnVsbCBge2xpbmUsIGNvbHVtbn1gIGxvY2F0aW9ucyBvZiB0aGUgc3RhcnQgYW5kXG4gICAgLy8gZW5kIG9mIHRoZSBjb21tZW50cy4gTm90ZSB0aGF0IHlvdSBhcmUgbm90IGFsbG93ZWQgdG8gY2FsbCB0aGVcbiAgICAvLyBwYXJzZXIgZnJvbSB0aGUgY2FsbGJhY2vigJR0aGF0IHdpbGwgY29ycnVwdCBpdHMgaW50ZXJuYWwgc3RhdGUuXG4gICAgb25Db21tZW50OiBudWxsLFxuICAgIC8vIE5vZGVzIGhhdmUgdGhlaXIgc3RhcnQgYW5kIGVuZCBjaGFyYWN0ZXJzIG9mZnNldHMgcmVjb3JkZWQgaW5cbiAgICAvLyBgc3RhcnRgIGFuZCBgZW5kYCBwcm9wZXJ0aWVzIChkaXJlY3RseSBvbiB0aGUgbm9kZSwgcmF0aGVyIHRoYW5cbiAgICAvLyB0aGUgYGxvY2Agb2JqZWN0LCB3aGljaCBob2xkcyBsaW5lL2NvbHVtbiBkYXRhLiBUbyBhbHNvIGFkZCBhXG4gICAgLy8gW3NlbWktc3RhbmRhcmRpemVkXVtyYW5nZV0gYHJhbmdlYCBwcm9wZXJ0eSBob2xkaW5nIGEgYFtzdGFydCxcbiAgICAvLyBlbmRdYCBhcnJheSB3aXRoIHRoZSBzYW1lIG51bWJlcnMsIHNldCB0aGUgYHJhbmdlc2Agb3B0aW9uIHRvXG4gICAgLy8gYHRydWVgLlxuICAgIC8vXG4gICAgLy8gW3JhbmdlXTogaHR0cHM6Ly9idWd6aWxsYS5tb3ppbGxhLm9yZy9zaG93X2J1Zy5jZ2k/aWQ9NzQ1Njc4XG4gICAgcmFuZ2VzOiBmYWxzZSxcbiAgICAvLyBJdCBpcyBwb3NzaWJsZSB0byBwYXJzZSBtdWx0aXBsZSBmaWxlcyBpbnRvIGEgc2luZ2xlIEFTVCBieVxuICAgIC8vIHBhc3NpbmcgdGhlIHRyZWUgcHJvZHVjZWQgYnkgcGFyc2luZyB0aGUgZmlyc3QgZmlsZSBhc1xuICAgIC8vIGBwcm9ncmFtYCBvcHRpb24gaW4gc3Vic2VxdWVudCBwYXJzZXMuIFRoaXMgd2lsbCBhZGQgdGhlXG4gICAgLy8gdG9wbGV2ZWwgZm9ybXMgb2YgdGhlIHBhcnNlZCBmaWxlIHRvIHRoZSBgUHJvZ3JhbWAgKHRvcCkgbm9kZVxuICAgIC8vIG9mIGFuIGV4aXN0aW5nIHBhcnNlIHRyZWUuXG4gICAgcHJvZ3JhbTogbnVsbCxcbiAgICAvLyBXaGVuIGBsb2NhdGlvbnNgIGlzIG9uLCB5b3UgY2FuIHBhc3MgdGhpcyB0byByZWNvcmQgdGhlIHNvdXJjZVxuICAgIC8vIGZpbGUgaW4gZXZlcnkgbm9kZSdzIGBsb2NgIG9iamVjdC5cbiAgICBzb3VyY2VGaWxlOiBudWxsLFxuICAgIC8vIFRoaXMgdmFsdWUsIGlmIGdpdmVuLCBpcyBzdG9yZWQgaW4gZXZlcnkgbm9kZSwgd2hldGhlclxuICAgIC8vIGBsb2NhdGlvbnNgIGlzIG9uIG9yIG9mZi5cbiAgICBkaXJlY3RTb3VyY2VGaWxlOiBudWxsXG4gIH07XG5cbiAgZnVuY3Rpb24gc2V0T3B0aW9ucyhvcHRzKSB7XG4gICAgb3B0aW9ucyA9IG9wdHMgfHwge307XG4gICAgZm9yICh2YXIgb3B0IGluIGRlZmF1bHRPcHRpb25zKSBpZiAoIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvcHRpb25zLCBvcHQpKVxuICAgICAgb3B0aW9uc1tvcHRdID0gZGVmYXVsdE9wdGlvbnNbb3B0XTtcbiAgICBzb3VyY2VGaWxlID0gb3B0aW9ucy5zb3VyY2VGaWxlIHx8IG51bGw7XG5cbiAgICBpc0tleXdvcmQgPSBvcHRpb25zLmVjbWFWZXJzaW9uID49IDYgPyBpc0VjbWE2S2V5d29yZCA6IGlzRWNtYTVBbmRMZXNzS2V5d29yZDtcbiAgfVxuXG4gIC8vIFRoZSBgZ2V0TGluZUluZm9gIGZ1bmN0aW9uIGlzIG1vc3RseSB1c2VmdWwgd2hlbiB0aGVcbiAgLy8gYGxvY2F0aW9uc2Agb3B0aW9uIGlzIG9mZiAoZm9yIHBlcmZvcm1hbmNlIHJlYXNvbnMpIGFuZCB5b3VcbiAgLy8gd2FudCB0byBmaW5kIHRoZSBsaW5lL2NvbHVtbiBwb3NpdGlvbiBmb3IgYSBnaXZlbiBjaGFyYWN0ZXJcbiAgLy8gb2Zmc2V0LiBgaW5wdXRgIHNob3VsZCBiZSB0aGUgY29kZSBzdHJpbmcgdGhhdCB0aGUgb2Zmc2V0IHJlZmVyc1xuICAvLyBpbnRvLlxuXG4gIHZhciBnZXRMaW5lSW5mbyA9IGV4cG9ydHMuZ2V0TGluZUluZm8gPSBmdW5jdGlvbihpbnB1dCwgb2Zmc2V0KSB7XG4gICAgZm9yICh2YXIgbGluZSA9IDEsIGN1ciA9IDA7Oykge1xuICAgICAgbGluZUJyZWFrLmxhc3RJbmRleCA9IGN1cjtcbiAgICAgIHZhciBtYXRjaCA9IGxpbmVCcmVhay5leGVjKGlucHV0KTtcbiAgICAgIGlmIChtYXRjaCAmJiBtYXRjaC5pbmRleCA8IG9mZnNldCkge1xuICAgICAgICArK2xpbmU7XG4gICAgICAgIGN1ciA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgfSBlbHNlIGJyZWFrO1xuICAgIH1cbiAgICByZXR1cm4ge2xpbmU6IGxpbmUsIGNvbHVtbjogb2Zmc2V0IC0gY3VyfTtcbiAgfTtcblxuICAvLyBBY29ybiBpcyBvcmdhbml6ZWQgYXMgYSB0b2tlbml6ZXIgYW5kIGEgcmVjdXJzaXZlLWRlc2NlbnQgcGFyc2VyLlxuICAvLyBUaGUgYHRva2VuaXplYCBleHBvcnQgcHJvdmlkZXMgYW4gaW50ZXJmYWNlIHRvIHRoZSB0b2tlbml6ZXIuXG4gIC8vIEJlY2F1c2UgdGhlIHRva2VuaXplciBpcyBvcHRpbWl6ZWQgZm9yIGJlaW5nIGVmZmljaWVudGx5IHVzZWQgYnlcbiAgLy8gdGhlIEFjb3JuIHBhcnNlciBpdHNlbGYsIHRoaXMgaW50ZXJmYWNlIGlzIHNvbWV3aGF0IGNydWRlIGFuZCBub3RcbiAgLy8gdmVyeSBtb2R1bGFyLiBQZXJmb3JtaW5nIGFub3RoZXIgcGFyc2Ugb3IgY2FsbCB0byBgdG9rZW5pemVgIHdpbGxcbiAgLy8gcmVzZXQgdGhlIGludGVybmFsIHN0YXRlLCBhbmQgaW52YWxpZGF0ZSBleGlzdGluZyB0b2tlbml6ZXJzLlxuXG4gIGV4cG9ydHMudG9rZW5pemUgPSBmdW5jdGlvbihpbnB0LCBvcHRzKSB7XG4gICAgaW5wdXQgPSBTdHJpbmcoaW5wdCk7IGlucHV0TGVuID0gaW5wdXQubGVuZ3RoO1xuICAgIHNldE9wdGlvbnMob3B0cyk7XG4gICAgaW5pdFRva2VuU3RhdGUoKTtcblxuICAgIHZhciB0ID0ge307XG4gICAgZnVuY3Rpb24gZ2V0VG9rZW4oZm9yY2VSZWdleHApIHtcbiAgICAgIGxhc3RFbmQgPSB0b2tFbmQ7XG4gICAgICByZWFkVG9rZW4oZm9yY2VSZWdleHApO1xuICAgICAgdC5zdGFydCA9IHRva1N0YXJ0OyB0LmVuZCA9IHRva0VuZDtcbiAgICAgIHQuc3RhcnRMb2MgPSB0b2tTdGFydExvYzsgdC5lbmRMb2MgPSB0b2tFbmRMb2M7XG4gICAgICB0LnR5cGUgPSB0b2tUeXBlOyB0LnZhbHVlID0gdG9rVmFsO1xuICAgICAgcmV0dXJuIHQ7XG4gICAgfVxuICAgIGdldFRva2VuLmp1bXBUbyA9IGZ1bmN0aW9uKHBvcywgcmVBbGxvd2VkKSB7XG4gICAgICB0b2tQb3MgPSBwb3M7XG4gICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnMpIHtcbiAgICAgICAgdG9rQ3VyTGluZSA9IDE7XG4gICAgICAgIHRva0xpbmVTdGFydCA9IGxpbmVCcmVhay5sYXN0SW5kZXggPSAwO1xuICAgICAgICB2YXIgbWF0Y2g7XG4gICAgICAgIHdoaWxlICgobWF0Y2ggPSBsaW5lQnJlYWsuZXhlYyhpbnB1dCkpICYmIG1hdGNoLmluZGV4IDwgcG9zKSB7XG4gICAgICAgICAgKyt0b2tDdXJMaW5lO1xuICAgICAgICAgIHRva0xpbmVTdGFydCA9IG1hdGNoLmluZGV4ICsgbWF0Y2hbMF0ubGVuZ3RoO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0b2tSZWdleHBBbGxvd2VkID0gcmVBbGxvd2VkO1xuICAgICAgc2tpcFNwYWNlKCk7XG4gICAgfTtcbiAgICByZXR1cm4gZ2V0VG9rZW47XG4gIH07XG5cbiAgLy8gU3RhdGUgaXMga2VwdCBpbiAoY2xvc3VyZS0pZ2xvYmFsIHZhcmlhYmxlcy4gV2UgYWxyZWFkeSBzYXcgdGhlXG4gIC8vIGBvcHRpb25zYCwgYGlucHV0YCwgYW5kIGBpbnB1dExlbmAgdmFyaWFibGVzIGFib3ZlLlxuXG4gIC8vIFRoZSBjdXJyZW50IHBvc2l0aW9uIG9mIHRoZSB0b2tlbml6ZXIgaW4gdGhlIGlucHV0LlxuXG4gIHZhciB0b2tQb3M7XG5cbiAgLy8gVGhlIHN0YXJ0IGFuZCBlbmQgb2Zmc2V0cyBvZiB0aGUgY3VycmVudCB0b2tlbi5cblxuICB2YXIgdG9rU3RhcnQsIHRva0VuZDtcblxuICAvLyBXaGVuIGBvcHRpb25zLmxvY2F0aW9uc2AgaXMgdHJ1ZSwgdGhlc2UgaG9sZCBvYmplY3RzXG4gIC8vIGNvbnRhaW5pbmcgdGhlIHRva2VucyBzdGFydCBhbmQgZW5kIGxpbmUvY29sdW1uIHBhaXJzLlxuXG4gIHZhciB0b2tTdGFydExvYywgdG9rRW5kTG9jO1xuXG4gIC8vIFRoZSB0eXBlIGFuZCB2YWx1ZSBvZiB0aGUgY3VycmVudCB0b2tlbi4gVG9rZW4gdHlwZXMgYXJlIG9iamVjdHMsXG4gIC8vIG5hbWVkIGJ5IHZhcmlhYmxlcyBhZ2FpbnN0IHdoaWNoIHRoZXkgY2FuIGJlIGNvbXBhcmVkLCBhbmRcbiAgLy8gaG9sZGluZyBwcm9wZXJ0aWVzIHRoYXQgZGVzY3JpYmUgdGhlbSAoaW5kaWNhdGluZywgZm9yIGV4YW1wbGUsXG4gIC8vIHRoZSBwcmVjZWRlbmNlIG9mIGFuIGluZml4IG9wZXJhdG9yLCBhbmQgdGhlIG9yaWdpbmFsIG5hbWUgb2YgYVxuICAvLyBrZXl3b3JkIHRva2VuKS4gVGhlIGtpbmQgb2YgdmFsdWUgdGhhdCdzIGhlbGQgaW4gYHRva1ZhbGAgZGVwZW5kc1xuICAvLyBvbiB0aGUgdHlwZSBvZiB0aGUgdG9rZW4uIEZvciBsaXRlcmFscywgaXQgaXMgdGhlIGxpdGVyYWwgdmFsdWUsXG4gIC8vIGZvciBvcGVyYXRvcnMsIHRoZSBvcGVyYXRvciBuYW1lLCBhbmQgc28gb24uXG5cbiAgdmFyIHRva1R5cGUsIHRva1ZhbDtcblxuICAvLyBJbnRlcmFsIHN0YXRlIGZvciB0aGUgdG9rZW5pemVyLiBUbyBkaXN0aW5ndWlzaCBiZXR3ZWVuIGRpdmlzaW9uXG4gIC8vIG9wZXJhdG9ycyBhbmQgcmVndWxhciBleHByZXNzaW9ucywgaXQgcmVtZW1iZXJzIHdoZXRoZXIgdGhlIGxhc3RcbiAgLy8gdG9rZW4gd2FzIG9uZSB0aGF0IGlzIGFsbG93ZWQgdG8gYmUgZm9sbG93ZWQgYnkgYW4gZXhwcmVzc2lvbi5cbiAgLy8gKElmIGl0IGlzLCBhIHNsYXNoIGlzIHByb2JhYmx5IGEgcmVnZXhwLCBpZiBpdCBpc24ndCBpdCdzIGFcbiAgLy8gZGl2aXNpb24gb3BlcmF0b3IuIFNlZSB0aGUgYHBhcnNlU3RhdGVtZW50YCBmdW5jdGlvbiBmb3IgYVxuICAvLyBjYXZlYXQuKVxuXG4gIHZhciB0b2tSZWdleHBBbGxvd2VkO1xuXG4gIC8vIFdoZW4gYG9wdGlvbnMubG9jYXRpb25zYCBpcyB0cnVlLCB0aGVzZSBhcmUgdXNlZCB0byBrZWVwXG4gIC8vIHRyYWNrIG9mIHRoZSBjdXJyZW50IGxpbmUsIGFuZCBrbm93IHdoZW4gYSBuZXcgbGluZSBoYXMgYmVlblxuICAvLyBlbnRlcmVkLlxuXG4gIHZhciB0b2tDdXJMaW5lLCB0b2tMaW5lU3RhcnQ7XG5cbiAgLy8gVGhlc2Ugc3RvcmUgdGhlIHBvc2l0aW9uIG9mIHRoZSBwcmV2aW91cyB0b2tlbiwgd2hpY2ggaXMgdXNlZnVsXG4gIC8vIHdoZW4gZmluaXNoaW5nIGEgbm9kZSBhbmQgYXNzaWduaW5nIGl0cyBgZW5kYCBwb3NpdGlvbi5cblxuICB2YXIgbGFzdFN0YXJ0LCBsYXN0RW5kLCBsYXN0RW5kTG9jO1xuXG4gIC8vIFRoaXMgaXMgdGhlIHBhcnNlcidzIHN0YXRlLiBgaW5GdW5jdGlvbmAgaXMgdXNlZCB0byByZWplY3RcbiAgLy8gYHJldHVybmAgc3RhdGVtZW50cyBvdXRzaWRlIG9mIGZ1bmN0aW9ucywgYGxhYmVsc2AgdG8gdmVyaWZ5IHRoYXRcbiAgLy8gYGJyZWFrYCBhbmQgYGNvbnRpbnVlYCBoYXZlIHNvbWV3aGVyZSB0byBqdW1wIHRvLCBhbmQgYHN0cmljdGBcbiAgLy8gaW5kaWNhdGVzIHdoZXRoZXIgc3RyaWN0IG1vZGUgaXMgb24uXG5cbiAgdmFyIGluRnVuY3Rpb24sIGxhYmVscywgc3RyaWN0O1xuXG4gIC8vIFRoaXMgZnVuY3Rpb24gaXMgdXNlZCB0byByYWlzZSBleGNlcHRpb25zIG9uIHBhcnNlIGVycm9ycy4gSXRcbiAgLy8gdGFrZXMgYW4gb2Zmc2V0IGludGVnZXIgKGludG8gdGhlIGN1cnJlbnQgYGlucHV0YCkgdG8gaW5kaWNhdGVcbiAgLy8gdGhlIGxvY2F0aW9uIG9mIHRoZSBlcnJvciwgYXR0YWNoZXMgdGhlIHBvc2l0aW9uIHRvIHRoZSBlbmRcbiAgLy8gb2YgdGhlIGVycm9yIG1lc3NhZ2UsIGFuZCB0aGVuIHJhaXNlcyBhIGBTeW50YXhFcnJvcmAgd2l0aCB0aGF0XG4gIC8vIG1lc3NhZ2UuXG5cbiAgZnVuY3Rpb24gcmFpc2UocG9zLCBtZXNzYWdlKSB7XG4gICAgdmFyIGxvYyA9IGdldExpbmVJbmZvKGlucHV0LCBwb3MpO1xuICAgIG1lc3NhZ2UgKz0gXCIgKFwiICsgbG9jLmxpbmUgKyBcIjpcIiArIGxvYy5jb2x1bW4gKyBcIilcIjtcbiAgICB2YXIgZXJyID0gbmV3IFN5bnRheEVycm9yKG1lc3NhZ2UpO1xuICAgIGVyci5wb3MgPSBwb3M7IGVyci5sb2MgPSBsb2M7IGVyci5yYWlzZWRBdCA9IHRva1BvcztcbiAgICB0aHJvdyBlcnI7XG4gIH1cblxuICAvLyBSZXVzZWQgZW1wdHkgYXJyYXkgYWRkZWQgZm9yIG5vZGUgZmllbGRzIHRoYXQgYXJlIGFsd2F5cyBlbXB0eS5cblxuICB2YXIgZW1wdHkgPSBbXTtcblxuICAvLyAjIyBUb2tlbiB0eXBlc1xuXG4gIC8vIFRoZSBhc3NpZ25tZW50IG9mIGZpbmUtZ3JhaW5lZCwgaW5mb3JtYXRpb24tY2FycnlpbmcgdHlwZSBvYmplY3RzXG4gIC8vIGFsbG93cyB0aGUgdG9rZW5pemVyIHRvIHN0b3JlIHRoZSBpbmZvcm1hdGlvbiBpdCBoYXMgYWJvdXQgYVxuICAvLyB0b2tlbiBpbiBhIHdheSB0aGF0IGlzIHZlcnkgY2hlYXAgZm9yIHRoZSBwYXJzZXIgdG8gbG9vayB1cC5cblxuICAvLyBBbGwgdG9rZW4gdHlwZSB2YXJpYWJsZXMgc3RhcnQgd2l0aCBhbiB1bmRlcnNjb3JlLCB0byBtYWtlIHRoZW1cbiAgLy8gZWFzeSB0byByZWNvZ25pemUuXG5cbiAgLy8gVGhlc2UgYXJlIHRoZSBnZW5lcmFsIHR5cGVzLiBUaGUgYHR5cGVgIHByb3BlcnR5IGlzIG9ubHkgdXNlZCB0b1xuICAvLyBtYWtlIHRoZW0gcmVjb2duaXplYWJsZSB3aGVuIGRlYnVnZ2luZy5cblxuICB2YXIgX251bSA9IHt0eXBlOiBcIm51bVwifSwgX3JlZ2V4cCA9IHt0eXBlOiBcInJlZ2V4cFwifSwgX3N0cmluZyA9IHt0eXBlOiBcInN0cmluZ1wifTtcbiAgdmFyIF9uYW1lID0ge3R5cGU6IFwibmFtZVwifSwgX2VvZiA9IHt0eXBlOiBcImVvZlwifTtcblxuICAvLyBLZXl3b3JkIHRva2Vucy4gVGhlIGBrZXl3b3JkYCBwcm9wZXJ0eSAoYWxzbyB1c2VkIGluIGtleXdvcmQtbGlrZVxuICAvLyBvcGVyYXRvcnMpIGluZGljYXRlcyB0aGF0IHRoZSB0b2tlbiBvcmlnaW5hdGVkIGZyb20gYW5cbiAgLy8gaWRlbnRpZmllci1saWtlIHdvcmQsIHdoaWNoIGlzIHVzZWQgd2hlbiBwYXJzaW5nIHByb3BlcnR5IG5hbWVzLlxuICAvL1xuICAvLyBUaGUgYGJlZm9yZUV4cHJgIHByb3BlcnR5IGlzIHVzZWQgdG8gZGlzYW1iaWd1YXRlIGJldHdlZW4gcmVndWxhclxuICAvLyBleHByZXNzaW9ucyBhbmQgZGl2aXNpb25zLiBJdCBpcyBzZXQgb24gYWxsIHRva2VuIHR5cGVzIHRoYXQgY2FuXG4gIC8vIGJlIGZvbGxvd2VkIGJ5IGFuIGV4cHJlc3Npb24gKHRodXMsIGEgc2xhc2ggYWZ0ZXIgdGhlbSB3b3VsZCBiZSBhXG4gIC8vIHJlZ3VsYXIgZXhwcmVzc2lvbikuXG4gIC8vXG4gIC8vIGBpc0xvb3BgIG1hcmtzIGEga2V5d29yZCBhcyBzdGFydGluZyBhIGxvb3AsIHdoaWNoIGlzIGltcG9ydGFudFxuICAvLyB0byBrbm93IHdoZW4gcGFyc2luZyBhIGxhYmVsLCBpbiBvcmRlciB0byBhbGxvdyBvciBkaXNhbGxvd1xuICAvLyBjb250aW51ZSBqdW1wcyB0byB0aGF0IGxhYmVsLlxuXG4gIHZhciBfYnJlYWsgPSB7a2V5d29yZDogXCJicmVha1wifSwgX2Nhc2UgPSB7a2V5d29yZDogXCJjYXNlXCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfY2F0Y2ggPSB7a2V5d29yZDogXCJjYXRjaFwifTtcbiAgdmFyIF9jb250aW51ZSA9IHtrZXl3b3JkOiBcImNvbnRpbnVlXCJ9LCBfZGVidWdnZXIgPSB7a2V5d29yZDogXCJkZWJ1Z2dlclwifSwgX2RlZmF1bHQgPSB7a2V5d29yZDogXCJkZWZhdWx0XCJ9O1xuICB2YXIgX2RvID0ge2tleXdvcmQ6IFwiZG9cIiwgaXNMb29wOiB0cnVlfSwgX2Vsc2UgPSB7a2V5d29yZDogXCJlbHNlXCIsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2ZpbmFsbHkgPSB7a2V5d29yZDogXCJmaW5hbGx5XCJ9LCBfZm9yID0ge2tleXdvcmQ6IFwiZm9yXCIsIGlzTG9vcDogdHJ1ZX0sIF9mdW5jdGlvbiA9IHtrZXl3b3JkOiBcImZ1bmN0aW9uXCJ9O1xuICB2YXIgX2lmID0ge2tleXdvcmQ6IFwiaWZcIn0sIF9yZXR1cm4gPSB7a2V5d29yZDogXCJyZXR1cm5cIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9zd2l0Y2ggPSB7a2V5d29yZDogXCJzd2l0Y2hcIn07XG4gIHZhciBfdGhyb3cgPSB7a2V5d29yZDogXCJ0aHJvd1wiLCBiZWZvcmVFeHByOiB0cnVlfSwgX3RyeSA9IHtrZXl3b3JkOiBcInRyeVwifSwgX3ZhciA9IHtrZXl3b3JkOiBcInZhclwifTtcbiAgdmFyIF9sZXQgPSB7a2V5d29yZDogXCJsZXRcIn0sIF9jb25zdCA9IHtrZXl3b3JkOiBcImNvbnN0XCJ9O1xuICB2YXIgX3doaWxlID0ge2tleXdvcmQ6IFwid2hpbGVcIiwgaXNMb29wOiB0cnVlfSwgX3dpdGggPSB7a2V5d29yZDogXCJ3aXRoXCJ9LCBfbmV3ID0ge2tleXdvcmQ6IFwibmV3XCIsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX3RoaXMgPSB7a2V5d29yZDogXCJ0aGlzXCJ9O1xuXG4gIC8vIFRoZSBrZXl3b3JkcyB0aGF0IGRlbm90ZSB2YWx1ZXMuXG5cbiAgdmFyIF9udWxsID0ge2tleXdvcmQ6IFwibnVsbFwiLCBhdG9tVmFsdWU6IG51bGx9LCBfdHJ1ZSA9IHtrZXl3b3JkOiBcInRydWVcIiwgYXRvbVZhbHVlOiB0cnVlfTtcbiAgdmFyIF9mYWxzZSA9IHtrZXl3b3JkOiBcImZhbHNlXCIsIGF0b21WYWx1ZTogZmFsc2V9O1xuXG4gIC8vIFNvbWUga2V5d29yZHMgYXJlIHRyZWF0ZWQgYXMgcmVndWxhciBvcGVyYXRvcnMuIGBpbmAgc29tZXRpbWVzXG4gIC8vICh3aGVuIHBhcnNpbmcgYGZvcmApIG5lZWRzIHRvIGJlIHRlc3RlZCBhZ2FpbnN0IHNwZWNpZmljYWxseSwgc29cbiAgLy8gd2UgYXNzaWduIGEgdmFyaWFibGUgbmFtZSB0byBpdCBmb3IgcXVpY2sgY29tcGFyaW5nLlxuXG4gIHZhciBfaW4gPSB7a2V5d29yZDogXCJpblwiLCBiaW5vcDogNywgYmVmb3JlRXhwcjogdHJ1ZX07XG5cbiAgLy8gTWFwIGtleXdvcmQgbmFtZXMgdG8gdG9rZW4gdHlwZXMuXG5cbiAgdmFyIGtleXdvcmRUeXBlcyA9IHtcImJyZWFrXCI6IF9icmVhaywgXCJjYXNlXCI6IF9jYXNlLCBcImNhdGNoXCI6IF9jYXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICBcImNvbnRpbnVlXCI6IF9jb250aW51ZSwgXCJkZWJ1Z2dlclwiOiBfZGVidWdnZXIsIFwiZGVmYXVsdFwiOiBfZGVmYXVsdCxcbiAgICAgICAgICAgICAgICAgICAgICBcImRvXCI6IF9kbywgXCJlbHNlXCI6IF9lbHNlLCBcImZpbmFsbHlcIjogX2ZpbmFsbHksIFwiZm9yXCI6IF9mb3IsXG4gICAgICAgICAgICAgICAgICAgICAgXCJmdW5jdGlvblwiOiBfZnVuY3Rpb24sIFwiaWZcIjogX2lmLCBcInJldHVyblwiOiBfcmV0dXJuLCBcInN3aXRjaFwiOiBfc3dpdGNoLFxuICAgICAgICAgICAgICAgICAgICAgIFwidGhyb3dcIjogX3Rocm93LCBcInRyeVwiOiBfdHJ5LCBcInZhclwiOiBfdmFyLCBcImxldFwiOiBfbGV0LCBcImNvbnN0XCI6IF9jb25zdCxcbiAgICAgICAgICAgICAgICAgICAgICBcIndoaWxlXCI6IF93aGlsZSwgXCJ3aXRoXCI6IF93aXRoLFxuICAgICAgICAgICAgICAgICAgICAgIFwibnVsbFwiOiBfbnVsbCwgXCJ0cnVlXCI6IF90cnVlLCBcImZhbHNlXCI6IF9mYWxzZSwgXCJuZXdcIjogX25ldywgXCJpblwiOiBfaW4sXG4gICAgICAgICAgICAgICAgICAgICAgXCJpbnN0YW5jZW9mXCI6IHtrZXl3b3JkOiBcImluc3RhbmNlb2ZcIiwgYmlub3A6IDcsIGJlZm9yZUV4cHI6IHRydWV9LCBcInRoaXNcIjogX3RoaXMsXG4gICAgICAgICAgICAgICAgICAgICAgXCJ0eXBlb2ZcIjoge2tleXdvcmQ6IFwidHlwZW9mXCIsIHByZWZpeDogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJ2b2lkXCI6IHtrZXl3b3JkOiBcInZvaWRcIiwgcHJlZml4OiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfSxcbiAgICAgICAgICAgICAgICAgICAgICBcImRlbGV0ZVwiOiB7a2V5d29yZDogXCJkZWxldGVcIiwgcHJlZml4OiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfX07XG5cbiAgLy8gUHVuY3R1YXRpb24gdG9rZW4gdHlwZXMuIEFnYWluLCB0aGUgYHR5cGVgIHByb3BlcnR5IGlzIHB1cmVseSBmb3IgZGVidWdnaW5nLlxuXG4gIHZhciBfYnJhY2tldEwgPSB7dHlwZTogXCJbXCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfYnJhY2tldFIgPSB7dHlwZTogXCJdXCJ9LCBfYnJhY2VMID0ge3R5cGU6IFwie1wiLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9icmFjZVIgPSB7dHlwZTogXCJ9XCJ9LCBfcGFyZW5MID0ge3R5cGU6IFwiKFwiLCBiZWZvcmVFeHByOiB0cnVlfSwgX3BhcmVuUiA9IHt0eXBlOiBcIilcIn07XG4gIHZhciBfY29tbWEgPSB7dHlwZTogXCIsXCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfc2VtaSA9IHt0eXBlOiBcIjtcIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfY29sb24gPSB7dHlwZTogXCI6XCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfZG90ID0ge3R5cGU6IFwiLlwifSwgX2VsbGlwc2lzID0ge3R5cGU6IFwiLi4uXCJ9LCBfcXVlc3Rpb24gPSB7dHlwZTogXCI/XCIsIGJlZm9yZUV4cHI6IHRydWV9O1xuXG4gIC8vIE9wZXJhdG9ycy4gVGhlc2UgY2Fycnkgc2V2ZXJhbCBraW5kcyBvZiBwcm9wZXJ0aWVzIHRvIGhlbHAgdGhlXG4gIC8vIHBhcnNlciB1c2UgdGhlbSBwcm9wZXJseSAodGhlIHByZXNlbmNlIG9mIHRoZXNlIHByb3BlcnRpZXMgaXNcbiAgLy8gd2hhdCBjYXRlZ29yaXplcyB0aGVtIGFzIG9wZXJhdG9ycykuXG4gIC8vXG4gIC8vIGBiaW5vcGAsIHdoZW4gcHJlc2VudCwgc3BlY2lmaWVzIHRoYXQgdGhpcyBvcGVyYXRvciBpcyBhIGJpbmFyeVxuICAvLyBvcGVyYXRvciwgYW5kIHdpbGwgcmVmZXIgdG8gaXRzIHByZWNlZGVuY2UuXG4gIC8vXG4gIC8vIGBwcmVmaXhgIGFuZCBgcG9zdGZpeGAgbWFyayB0aGUgb3BlcmF0b3IgYXMgYSBwcmVmaXggb3IgcG9zdGZpeFxuICAvLyB1bmFyeSBvcGVyYXRvci4gYGlzVXBkYXRlYCBzcGVjaWZpZXMgdGhhdCB0aGUgbm9kZSBwcm9kdWNlZCBieVxuICAvLyB0aGUgb3BlcmF0b3Igc2hvdWxkIGJlIG9mIHR5cGUgVXBkYXRlRXhwcmVzc2lvbiByYXRoZXIgdGhhblxuICAvLyBzaW1wbHkgVW5hcnlFeHByZXNzaW9uIChgKytgIGFuZCBgLS1gKS5cbiAgLy9cbiAgLy8gYGlzQXNzaWduYCBtYXJrcyBhbGwgb2YgYD1gLCBgKz1gLCBgLT1gIGV0Y2V0ZXJhLCB3aGljaCBhY3QgYXNcbiAgLy8gYmluYXJ5IG9wZXJhdG9ycyB3aXRoIGEgdmVyeSBsb3cgcHJlY2VkZW5jZSwgdGhhdCBzaG91bGQgcmVzdWx0XG4gIC8vIGluIEFzc2lnbm1lbnRFeHByZXNzaW9uIG5vZGVzLlxuXG4gIHZhciBfc2xhc2ggPSB7Ymlub3A6IDEwLCBiZWZvcmVFeHByOiB0cnVlfSwgX2VxID0ge2lzQXNzaWduOiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9hc3NpZ24gPSB7aXNBc3NpZ246IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2luY0RlYyA9IHtwb3N0Zml4OiB0cnVlLCBwcmVmaXg6IHRydWUsIGlzVXBkYXRlOiB0cnVlfSwgX3ByZWZpeCA9IHtwcmVmaXg6IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2xvZ2ljYWxPUiA9IHtiaW5vcDogMSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfbG9naWNhbEFORCA9IHtiaW5vcDogMiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfYml0d2lzZU9SID0ge2Jpbm9wOiAzLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9iaXR3aXNlWE9SID0ge2Jpbm9wOiA0LCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9iaXR3aXNlQU5EID0ge2Jpbm9wOiA1LCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9lcXVhbGl0eSA9IHtiaW5vcDogNiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfcmVsYXRpb25hbCA9IHtiaW5vcDogNywgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfYml0U2hpZnQgPSB7Ymlub3A6IDgsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX3BsdXNNaW4gPSB7Ymlub3A6IDksIHByZWZpeDogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfbXVsdGlwbHlNb2R1bG8gPSB7Ymlub3A6IDEwLCBiZWZvcmVFeHByOiB0cnVlfTtcblxuICAvLyBQcm92aWRlIGFjY2VzcyB0byB0aGUgdG9rZW4gdHlwZXMgZm9yIGV4dGVybmFsIHVzZXJzIG9mIHRoZVxuICAvLyB0b2tlbml6ZXIuXG5cbiAgZXhwb3J0cy50b2tUeXBlcyA9IHticmFja2V0TDogX2JyYWNrZXRMLCBicmFja2V0UjogX2JyYWNrZXRSLCBicmFjZUw6IF9icmFjZUwsIGJyYWNlUjogX2JyYWNlUixcbiAgICAgICAgICAgICAgICAgICAgICBwYXJlbkw6IF9wYXJlbkwsIHBhcmVuUjogX3BhcmVuUiwgY29tbWE6IF9jb21tYSwgc2VtaTogX3NlbWksIGNvbG9uOiBfY29sb24sXG4gICAgICAgICAgICAgICAgICAgICAgZG90OiBfZG90LCBlbGxpcHNpczogX2VsbGlwc2lzLCBxdWVzdGlvbjogX3F1ZXN0aW9uLCBzbGFzaDogX3NsYXNoLCBlcTogX2VxLFxuICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IF9uYW1lLCBlb2Y6IF9lb2YsIG51bTogX251bSwgcmVnZXhwOiBfcmVnZXhwLCBzdHJpbmc6IF9zdHJpbmd9O1xuICBmb3IgKHZhciBrdyBpbiBrZXl3b3JkVHlwZXMpIGV4cG9ydHMudG9rVHlwZXNbXCJfXCIgKyBrd10gPSBrZXl3b3JkVHlwZXNba3ddO1xuXG4gIC8vIFRoaXMgaXMgYSB0cmljayB0YWtlbiBmcm9tIEVzcHJpbWEuIEl0IHR1cm5zIG91dCB0aGF0LCBvblxuICAvLyBub24tQ2hyb21lIGJyb3dzZXJzLCB0byBjaGVjayB3aGV0aGVyIGEgc3RyaW5nIGlzIGluIGEgc2V0LCBhXG4gIC8vIHByZWRpY2F0ZSBjb250YWluaW5nIGEgYmlnIHVnbHkgYHN3aXRjaGAgc3RhdGVtZW50IGlzIGZhc3RlciB0aGFuXG4gIC8vIGEgcmVndWxhciBleHByZXNzaW9uLCBhbmQgb24gQ2hyb21lIHRoZSB0d28gYXJlIGFib3V0IG9uIHBhci5cbiAgLy8gVGhpcyBmdW5jdGlvbiB1c2VzIGBldmFsYCAobm9uLWxleGljYWwpIHRvIHByb2R1Y2Ugc3VjaCBhXG4gIC8vIHByZWRpY2F0ZSBmcm9tIGEgc3BhY2Utc2VwYXJhdGVkIHN0cmluZyBvZiB3b3Jkcy5cbiAgLy9cbiAgLy8gSXQgc3RhcnRzIGJ5IHNvcnRpbmcgdGhlIHdvcmRzIGJ5IGxlbmd0aC5cblxuICBmdW5jdGlvbiBtYWtlUHJlZGljYXRlKHdvcmRzKSB7XG4gICAgd29yZHMgPSB3b3Jkcy5zcGxpdChcIiBcIik7XG4gICAgdmFyIGYgPSBcIlwiLCBjYXRzID0gW107XG4gICAgb3V0OiBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmRzLmxlbmd0aDsgKytpKSB7XG4gICAgICBmb3IgKHZhciBqID0gMDsgaiA8IGNhdHMubGVuZ3RoOyArK2opXG4gICAgICAgIGlmIChjYXRzW2pdWzBdLmxlbmd0aCA9PSB3b3Jkc1tpXS5sZW5ndGgpIHtcbiAgICAgICAgICBjYXRzW2pdLnB1c2god29yZHNbaV0pO1xuICAgICAgICAgIGNvbnRpbnVlIG91dDtcbiAgICAgICAgfVxuICAgICAgY2F0cy5wdXNoKFt3b3Jkc1tpXV0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBjb21wYXJlVG8oYXJyKSB7XG4gICAgICBpZiAoYXJyLmxlbmd0aCA9PSAxKSByZXR1cm4gZiArPSBcInJldHVybiBzdHIgPT09IFwiICsgSlNPTi5zdHJpbmdpZnkoYXJyWzBdKSArIFwiO1wiO1xuICAgICAgZiArPSBcInN3aXRjaChzdHIpe1wiO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIGYgKz0gXCJjYXNlIFwiICsgSlNPTi5zdHJpbmdpZnkoYXJyW2ldKSArIFwiOlwiO1xuICAgICAgZiArPSBcInJldHVybiB0cnVlfXJldHVybiBmYWxzZTtcIjtcbiAgICB9XG5cbiAgICAvLyBXaGVuIHRoZXJlIGFyZSBtb3JlIHRoYW4gdGhyZWUgbGVuZ3RoIGNhdGVnb3JpZXMsIGFuIG91dGVyXG4gICAgLy8gc3dpdGNoIGZpcnN0IGRpc3BhdGNoZXMgb24gdGhlIGxlbmd0aHMsIHRvIHNhdmUgb24gY29tcGFyaXNvbnMuXG5cbiAgICBpZiAoY2F0cy5sZW5ndGggPiAzKSB7XG4gICAgICBjYXRzLnNvcnQoZnVuY3Rpb24oYSwgYikge3JldHVybiBiLmxlbmd0aCAtIGEubGVuZ3RoO30pO1xuICAgICAgZiArPSBcInN3aXRjaChzdHIubGVuZ3RoKXtcIjtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY2F0cy5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YXIgY2F0ID0gY2F0c1tpXTtcbiAgICAgICAgZiArPSBcImNhc2UgXCIgKyBjYXRbMF0ubGVuZ3RoICsgXCI6XCI7XG4gICAgICAgIGNvbXBhcmVUbyhjYXQpO1xuICAgICAgfVxuICAgICAgZiArPSBcIn1cIjtcblxuICAgIC8vIE90aGVyd2lzZSwgc2ltcGx5IGdlbmVyYXRlIGEgZmxhdCBgc3dpdGNoYCBzdGF0ZW1lbnQuXG5cbiAgICB9IGVsc2Uge1xuICAgICAgY29tcGFyZVRvKHdvcmRzKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbihcInN0clwiLCBmKTtcbiAgfVxuXG4gIC8vIFRoZSBFQ01BU2NyaXB0IDMgcmVzZXJ2ZWQgd29yZCBsaXN0LlxuXG4gIHZhciBpc1Jlc2VydmVkV29yZDMgPSBtYWtlUHJlZGljYXRlKFwiYWJzdHJhY3QgYm9vbGVhbiBieXRlIGNoYXIgY2xhc3MgZG91YmxlIGVudW0gZXhwb3J0IGV4dGVuZHMgZmluYWwgZmxvYXQgZ290byBpbXBsZW1lbnRzIGltcG9ydCBpbnQgaW50ZXJmYWNlIGxvbmcgbmF0aXZlIHBhY2thZ2UgcHJpdmF0ZSBwcm90ZWN0ZWQgcHVibGljIHNob3J0IHN0YXRpYyBzdXBlciBzeW5jaHJvbml6ZWQgdGhyb3dzIHRyYW5zaWVudCB2b2xhdGlsZVwiKTtcblxuICAvLyBFQ01BU2NyaXB0IDUgcmVzZXJ2ZWQgd29yZHMuXG5cbiAgdmFyIGlzUmVzZXJ2ZWRXb3JkNSA9IG1ha2VQcmVkaWNhdGUoXCJjbGFzcyBlbnVtIGV4dGVuZHMgc3VwZXIgY29uc3QgZXhwb3J0IGltcG9ydFwiKTtcblxuICAvLyBUaGUgYWRkaXRpb25hbCByZXNlcnZlZCB3b3JkcyBpbiBzdHJpY3QgbW9kZS5cblxuICB2YXIgaXNTdHJpY3RSZXNlcnZlZFdvcmQgPSBtYWtlUHJlZGljYXRlKFwiaW1wbGVtZW50cyBpbnRlcmZhY2UgbGV0IHBhY2thZ2UgcHJpdmF0ZSBwcm90ZWN0ZWQgcHVibGljIHN0YXRpYyB5aWVsZFwiKTtcblxuICAvLyBUaGUgZm9yYmlkZGVuIHZhcmlhYmxlIG5hbWVzIGluIHN0cmljdCBtb2RlLlxuXG4gIHZhciBpc1N0cmljdEJhZElkV29yZCA9IG1ha2VQcmVkaWNhdGUoXCJldmFsIGFyZ3VtZW50c1wiKTtcblxuICAvLyBBbmQgdGhlIGtleXdvcmRzLlxuXG4gIHZhciBlY21hNUFuZExlc3NLZXl3b3JkcyA9IFwiYnJlYWsgY2FzZSBjYXRjaCBjb250aW51ZSBkZWJ1Z2dlciBkZWZhdWx0IGRvIGVsc2UgZmluYWxseSBmb3IgZnVuY3Rpb24gaWYgcmV0dXJuIHN3aXRjaCB0aHJvdyB0cnkgdmFyIHdoaWxlIHdpdGggbnVsbCB0cnVlIGZhbHNlIGluc3RhbmNlb2YgdHlwZW9mIHZvaWQgZGVsZXRlIG5ldyBpbiB0aGlzXCI7XG5cbiAgdmFyIGlzRWNtYTVBbmRMZXNzS2V5d29yZCA9IG1ha2VQcmVkaWNhdGUoZWNtYTVBbmRMZXNzS2V5d29yZHMpO1xuXG4gIHZhciBpc0VjbWE2S2V5d29yZCA9IG1ha2VQcmVkaWNhdGUoZWNtYTVBbmRMZXNzS2V5d29yZHMgKyBcIiBsZXQgY29uc3RcIik7XG5cbiAgdmFyIGlzS2V5d29yZCA9IGlzRWNtYTVBbmRMZXNzS2V5d29yZDtcblxuICAvLyAjIyBDaGFyYWN0ZXIgY2F0ZWdvcmllc1xuXG4gIC8vIEJpZyB1Z2x5IHJlZ3VsYXIgZXhwcmVzc2lvbnMgdGhhdCBtYXRjaCBjaGFyYWN0ZXJzIGluIHRoZVxuICAvLyB3aGl0ZXNwYWNlLCBpZGVudGlmaWVyLCBhbmQgaWRlbnRpZmllci1zdGFydCBjYXRlZ29yaWVzLiBUaGVzZVxuICAvLyBhcmUgb25seSBhcHBsaWVkIHdoZW4gYSBjaGFyYWN0ZXIgaXMgZm91bmQgdG8gYWN0dWFsbHkgaGF2ZSBhXG4gIC8vIGNvZGUgcG9pbnQgYWJvdmUgMTI4LlxuXG4gIHZhciBub25BU0NJSXdoaXRlc3BhY2UgPSAvW1xcdTE2ODBcXHUxODBlXFx1MjAwMC1cXHUyMDBhXFx1MjAyZlxcdTIwNWZcXHUzMDAwXFx1ZmVmZl0vO1xuICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyA9IFwiXFx4YWFcXHhiNVxceGJhXFx4YzAtXFx4ZDZcXHhkOC1cXHhmNlxceGY4LVxcdTAyYzFcXHUwMmM2LVxcdTAyZDFcXHUwMmUwLVxcdTAyZTRcXHUwMmVjXFx1MDJlZVxcdTAzNzAtXFx1MDM3NFxcdTAzNzZcXHUwMzc3XFx1MDM3YS1cXHUwMzdkXFx1MDM4NlxcdTAzODgtXFx1MDM4YVxcdTAzOGNcXHUwMzhlLVxcdTAzYTFcXHUwM2EzLVxcdTAzZjVcXHUwM2Y3LVxcdTA0ODFcXHUwNDhhLVxcdTA1MjdcXHUwNTMxLVxcdTA1NTZcXHUwNTU5XFx1MDU2MS1cXHUwNTg3XFx1MDVkMC1cXHUwNWVhXFx1MDVmMC1cXHUwNWYyXFx1MDYyMC1cXHUwNjRhXFx1MDY2ZVxcdTA2NmZcXHUwNjcxLVxcdTA2ZDNcXHUwNmQ1XFx1MDZlNVxcdTA2ZTZcXHUwNmVlXFx1MDZlZlxcdTA2ZmEtXFx1MDZmY1xcdTA2ZmZcXHUwNzEwXFx1MDcxMi1cXHUwNzJmXFx1MDc0ZC1cXHUwN2E1XFx1MDdiMVxcdTA3Y2EtXFx1MDdlYVxcdTA3ZjRcXHUwN2Y1XFx1MDdmYVxcdTA4MDAtXFx1MDgxNVxcdTA4MWFcXHUwODI0XFx1MDgyOFxcdTA4NDAtXFx1MDg1OFxcdTA4YTBcXHUwOGEyLVxcdTA4YWNcXHUwOTA0LVxcdTA5MzlcXHUwOTNkXFx1MDk1MFxcdTA5NTgtXFx1MDk2MVxcdTA5NzEtXFx1MDk3N1xcdTA5NzktXFx1MDk3ZlxcdTA5ODUtXFx1MDk4Y1xcdTA5OGZcXHUwOTkwXFx1MDk5My1cXHUwOWE4XFx1MDlhYS1cXHUwOWIwXFx1MDliMlxcdTA5YjYtXFx1MDliOVxcdTA5YmRcXHUwOWNlXFx1MDlkY1xcdTA5ZGRcXHUwOWRmLVxcdTA5ZTFcXHUwOWYwXFx1MDlmMVxcdTBhMDUtXFx1MGEwYVxcdTBhMGZcXHUwYTEwXFx1MGExMy1cXHUwYTI4XFx1MGEyYS1cXHUwYTMwXFx1MGEzMlxcdTBhMzNcXHUwYTM1XFx1MGEzNlxcdTBhMzhcXHUwYTM5XFx1MGE1OS1cXHUwYTVjXFx1MGE1ZVxcdTBhNzItXFx1MGE3NFxcdTBhODUtXFx1MGE4ZFxcdTBhOGYtXFx1MGE5MVxcdTBhOTMtXFx1MGFhOFxcdTBhYWEtXFx1MGFiMFxcdTBhYjJcXHUwYWIzXFx1MGFiNS1cXHUwYWI5XFx1MGFiZFxcdTBhZDBcXHUwYWUwXFx1MGFlMVxcdTBiMDUtXFx1MGIwY1xcdTBiMGZcXHUwYjEwXFx1MGIxMy1cXHUwYjI4XFx1MGIyYS1cXHUwYjMwXFx1MGIzMlxcdTBiMzNcXHUwYjM1LVxcdTBiMzlcXHUwYjNkXFx1MGI1Y1xcdTBiNWRcXHUwYjVmLVxcdTBiNjFcXHUwYjcxXFx1MGI4M1xcdTBiODUtXFx1MGI4YVxcdTBiOGUtXFx1MGI5MFxcdTBiOTItXFx1MGI5NVxcdTBiOTlcXHUwYjlhXFx1MGI5Y1xcdTBiOWVcXHUwYjlmXFx1MGJhM1xcdTBiYTRcXHUwYmE4LVxcdTBiYWFcXHUwYmFlLVxcdTBiYjlcXHUwYmQwXFx1MGMwNS1cXHUwYzBjXFx1MGMwZS1cXHUwYzEwXFx1MGMxMi1cXHUwYzI4XFx1MGMyYS1cXHUwYzMzXFx1MGMzNS1cXHUwYzM5XFx1MGMzZFxcdTBjNThcXHUwYzU5XFx1MGM2MFxcdTBjNjFcXHUwYzg1LVxcdTBjOGNcXHUwYzhlLVxcdTBjOTBcXHUwYzkyLVxcdTBjYThcXHUwY2FhLVxcdTBjYjNcXHUwY2I1LVxcdTBjYjlcXHUwY2JkXFx1MGNkZVxcdTBjZTBcXHUwY2UxXFx1MGNmMVxcdTBjZjJcXHUwZDA1LVxcdTBkMGNcXHUwZDBlLVxcdTBkMTBcXHUwZDEyLVxcdTBkM2FcXHUwZDNkXFx1MGQ0ZVxcdTBkNjBcXHUwZDYxXFx1MGQ3YS1cXHUwZDdmXFx1MGQ4NS1cXHUwZDk2XFx1MGQ5YS1cXHUwZGIxXFx1MGRiMy1cXHUwZGJiXFx1MGRiZFxcdTBkYzAtXFx1MGRjNlxcdTBlMDEtXFx1MGUzMFxcdTBlMzJcXHUwZTMzXFx1MGU0MC1cXHUwZTQ2XFx1MGU4MVxcdTBlODJcXHUwZTg0XFx1MGU4N1xcdTBlODhcXHUwZThhXFx1MGU4ZFxcdTBlOTQtXFx1MGU5N1xcdTBlOTktXFx1MGU5ZlxcdTBlYTEtXFx1MGVhM1xcdTBlYTVcXHUwZWE3XFx1MGVhYVxcdTBlYWJcXHUwZWFkLVxcdTBlYjBcXHUwZWIyXFx1MGViM1xcdTBlYmRcXHUwZWMwLVxcdTBlYzRcXHUwZWM2XFx1MGVkYy1cXHUwZWRmXFx1MGYwMFxcdTBmNDAtXFx1MGY0N1xcdTBmNDktXFx1MGY2Y1xcdTBmODgtXFx1MGY4Y1xcdTEwMDAtXFx1MTAyYVxcdTEwM2ZcXHUxMDUwLVxcdTEwNTVcXHUxMDVhLVxcdTEwNWRcXHUxMDYxXFx1MTA2NVxcdTEwNjZcXHUxMDZlLVxcdTEwNzBcXHUxMDc1LVxcdTEwODFcXHUxMDhlXFx1MTBhMC1cXHUxMGM1XFx1MTBjN1xcdTEwY2RcXHUxMGQwLVxcdTEwZmFcXHUxMGZjLVxcdTEyNDhcXHUxMjRhLVxcdTEyNGRcXHUxMjUwLVxcdTEyNTZcXHUxMjU4XFx1MTI1YS1cXHUxMjVkXFx1MTI2MC1cXHUxMjg4XFx1MTI4YS1cXHUxMjhkXFx1MTI5MC1cXHUxMmIwXFx1MTJiMi1cXHUxMmI1XFx1MTJiOC1cXHUxMmJlXFx1MTJjMFxcdTEyYzItXFx1MTJjNVxcdTEyYzgtXFx1MTJkNlxcdTEyZDgtXFx1MTMxMFxcdTEzMTItXFx1MTMxNVxcdTEzMTgtXFx1MTM1YVxcdTEzODAtXFx1MTM4ZlxcdTEzYTAtXFx1MTNmNFxcdTE0MDEtXFx1MTY2Y1xcdTE2NmYtXFx1MTY3ZlxcdTE2ODEtXFx1MTY5YVxcdTE2YTAtXFx1MTZlYVxcdTE2ZWUtXFx1MTZmMFxcdTE3MDAtXFx1MTcwY1xcdTE3MGUtXFx1MTcxMVxcdTE3MjAtXFx1MTczMVxcdTE3NDAtXFx1MTc1MVxcdTE3NjAtXFx1MTc2Y1xcdTE3NmUtXFx1MTc3MFxcdTE3ODAtXFx1MTdiM1xcdTE3ZDdcXHUxN2RjXFx1MTgyMC1cXHUxODc3XFx1MTg4MC1cXHUxOGE4XFx1MThhYVxcdTE4YjAtXFx1MThmNVxcdTE5MDAtXFx1MTkxY1xcdTE5NTAtXFx1MTk2ZFxcdTE5NzAtXFx1MTk3NFxcdTE5ODAtXFx1MTlhYlxcdTE5YzEtXFx1MTljN1xcdTFhMDAtXFx1MWExNlxcdTFhMjAtXFx1MWE1NFxcdTFhYTdcXHUxYjA1LVxcdTFiMzNcXHUxYjQ1LVxcdTFiNGJcXHUxYjgzLVxcdTFiYTBcXHUxYmFlXFx1MWJhZlxcdTFiYmEtXFx1MWJlNVxcdTFjMDAtXFx1MWMyM1xcdTFjNGQtXFx1MWM0ZlxcdTFjNWEtXFx1MWM3ZFxcdTFjZTktXFx1MWNlY1xcdTFjZWUtXFx1MWNmMVxcdTFjZjVcXHUxY2Y2XFx1MWQwMC1cXHUxZGJmXFx1MWUwMC1cXHUxZjE1XFx1MWYxOC1cXHUxZjFkXFx1MWYyMC1cXHUxZjQ1XFx1MWY0OC1cXHUxZjRkXFx1MWY1MC1cXHUxZjU3XFx1MWY1OVxcdTFmNWJcXHUxZjVkXFx1MWY1Zi1cXHUxZjdkXFx1MWY4MC1cXHUxZmI0XFx1MWZiNi1cXHUxZmJjXFx1MWZiZVxcdTFmYzItXFx1MWZjNFxcdTFmYzYtXFx1MWZjY1xcdTFmZDAtXFx1MWZkM1xcdTFmZDYtXFx1MWZkYlxcdTFmZTAtXFx1MWZlY1xcdTFmZjItXFx1MWZmNFxcdTFmZjYtXFx1MWZmY1xcdTIwNzFcXHUyMDdmXFx1MjA5MC1cXHUyMDljXFx1MjEwMlxcdTIxMDdcXHUyMTBhLVxcdTIxMTNcXHUyMTE1XFx1MjExOS1cXHUyMTFkXFx1MjEyNFxcdTIxMjZcXHUyMTI4XFx1MjEyYS1cXHUyMTJkXFx1MjEyZi1cXHUyMTM5XFx1MjEzYy1cXHUyMTNmXFx1MjE0NS1cXHUyMTQ5XFx1MjE0ZVxcdTIxNjAtXFx1MjE4OFxcdTJjMDAtXFx1MmMyZVxcdTJjMzAtXFx1MmM1ZVxcdTJjNjAtXFx1MmNlNFxcdTJjZWItXFx1MmNlZVxcdTJjZjJcXHUyY2YzXFx1MmQwMC1cXHUyZDI1XFx1MmQyN1xcdTJkMmRcXHUyZDMwLVxcdTJkNjdcXHUyZDZmXFx1MmQ4MC1cXHUyZDk2XFx1MmRhMC1cXHUyZGE2XFx1MmRhOC1cXHUyZGFlXFx1MmRiMC1cXHUyZGI2XFx1MmRiOC1cXHUyZGJlXFx1MmRjMC1cXHUyZGM2XFx1MmRjOC1cXHUyZGNlXFx1MmRkMC1cXHUyZGQ2XFx1MmRkOC1cXHUyZGRlXFx1MmUyZlxcdTMwMDUtXFx1MzAwN1xcdTMwMjEtXFx1MzAyOVxcdTMwMzEtXFx1MzAzNVxcdTMwMzgtXFx1MzAzY1xcdTMwNDEtXFx1MzA5NlxcdTMwOWQtXFx1MzA5ZlxcdTMwYTEtXFx1MzBmYVxcdTMwZmMtXFx1MzBmZlxcdTMxMDUtXFx1MzEyZFxcdTMxMzEtXFx1MzE4ZVxcdTMxYTAtXFx1MzFiYVxcdTMxZjAtXFx1MzFmZlxcdTM0MDAtXFx1NGRiNVxcdTRlMDAtXFx1OWZjY1xcdWEwMDAtXFx1YTQ4Y1xcdWE0ZDAtXFx1YTRmZFxcdWE1MDAtXFx1YTYwY1xcdWE2MTAtXFx1YTYxZlxcdWE2MmFcXHVhNjJiXFx1YTY0MC1cXHVhNjZlXFx1YTY3Zi1cXHVhNjk3XFx1YTZhMC1cXHVhNmVmXFx1YTcxNy1cXHVhNzFmXFx1YTcyMi1cXHVhNzg4XFx1YTc4Yi1cXHVhNzhlXFx1YTc5MC1cXHVhNzkzXFx1YTdhMC1cXHVhN2FhXFx1YTdmOC1cXHVhODAxXFx1YTgwMy1cXHVhODA1XFx1YTgwNy1cXHVhODBhXFx1YTgwYy1cXHVhODIyXFx1YTg0MC1cXHVhODczXFx1YTg4Mi1cXHVhOGIzXFx1YThmMi1cXHVhOGY3XFx1YThmYlxcdWE5MGEtXFx1YTkyNVxcdWE5MzAtXFx1YTk0NlxcdWE5NjAtXFx1YTk3Y1xcdWE5ODQtXFx1YTliMlxcdWE5Y2ZcXHVhYTAwLVxcdWFhMjhcXHVhYTQwLVxcdWFhNDJcXHVhYTQ0LVxcdWFhNGJcXHVhYTYwLVxcdWFhNzZcXHVhYTdhXFx1YWE4MC1cXHVhYWFmXFx1YWFiMVxcdWFhYjVcXHVhYWI2XFx1YWFiOS1cXHVhYWJkXFx1YWFjMFxcdWFhYzJcXHVhYWRiLVxcdWFhZGRcXHVhYWUwLVxcdWFhZWFcXHVhYWYyLVxcdWFhZjRcXHVhYjAxLVxcdWFiMDZcXHVhYjA5LVxcdWFiMGVcXHVhYjExLVxcdWFiMTZcXHVhYjIwLVxcdWFiMjZcXHVhYjI4LVxcdWFiMmVcXHVhYmMwLVxcdWFiZTJcXHVhYzAwLVxcdWQ3YTNcXHVkN2IwLVxcdWQ3YzZcXHVkN2NiLVxcdWQ3ZmJcXHVmOTAwLVxcdWZhNmRcXHVmYTcwLVxcdWZhZDlcXHVmYjAwLVxcdWZiMDZcXHVmYjEzLVxcdWZiMTdcXHVmYjFkXFx1ZmIxZi1cXHVmYjI4XFx1ZmIyYS1cXHVmYjM2XFx1ZmIzOC1cXHVmYjNjXFx1ZmIzZVxcdWZiNDBcXHVmYjQxXFx1ZmI0M1xcdWZiNDRcXHVmYjQ2LVxcdWZiYjFcXHVmYmQzLVxcdWZkM2RcXHVmZDUwLVxcdWZkOGZcXHVmZDkyLVxcdWZkYzdcXHVmZGYwLVxcdWZkZmJcXHVmZTcwLVxcdWZlNzRcXHVmZTc2LVxcdWZlZmNcXHVmZjIxLVxcdWZmM2FcXHVmZjQxLVxcdWZmNWFcXHVmZjY2LVxcdWZmYmVcXHVmZmMyLVxcdWZmYzdcXHVmZmNhLVxcdWZmY2ZcXHVmZmQyLVxcdWZmZDdcXHVmZmRhLVxcdWZmZGNcIjtcbiAgdmFyIG5vbkFTQ0lJaWRlbnRpZmllckNoYXJzID0gXCJcXHUwMzAwLVxcdTAzNmZcXHUwNDgzLVxcdTA0ODdcXHUwNTkxLVxcdTA1YmRcXHUwNWJmXFx1MDVjMVxcdTA1YzJcXHUwNWM0XFx1MDVjNVxcdTA1YzdcXHUwNjEwLVxcdTA2MWFcXHUwNjIwLVxcdTA2NDlcXHUwNjcyLVxcdTA2ZDNcXHUwNmU3LVxcdTA2ZThcXHUwNmZiLVxcdTA2ZmNcXHUwNzMwLVxcdTA3NGFcXHUwODAwLVxcdTA4MTRcXHUwODFiLVxcdTA4MjNcXHUwODI1LVxcdTA4MjdcXHUwODI5LVxcdTA4MmRcXHUwODQwLVxcdTA4NTdcXHUwOGU0LVxcdTA4ZmVcXHUwOTAwLVxcdTA5MDNcXHUwOTNhLVxcdTA5M2NcXHUwOTNlLVxcdTA5NGZcXHUwOTUxLVxcdTA5NTdcXHUwOTYyLVxcdTA5NjNcXHUwOTY2LVxcdTA5NmZcXHUwOTgxLVxcdTA5ODNcXHUwOWJjXFx1MDliZS1cXHUwOWM0XFx1MDljN1xcdTA5YzhcXHUwOWQ3XFx1MDlkZi1cXHUwOWUwXFx1MGEwMS1cXHUwYTAzXFx1MGEzY1xcdTBhM2UtXFx1MGE0MlxcdTBhNDdcXHUwYTQ4XFx1MGE0Yi1cXHUwYTRkXFx1MGE1MVxcdTBhNjYtXFx1MGE3MVxcdTBhNzVcXHUwYTgxLVxcdTBhODNcXHUwYWJjXFx1MGFiZS1cXHUwYWM1XFx1MGFjNy1cXHUwYWM5XFx1MGFjYi1cXHUwYWNkXFx1MGFlMi1cXHUwYWUzXFx1MGFlNi1cXHUwYWVmXFx1MGIwMS1cXHUwYjAzXFx1MGIzY1xcdTBiM2UtXFx1MGI0NFxcdTBiNDdcXHUwYjQ4XFx1MGI0Yi1cXHUwYjRkXFx1MGI1NlxcdTBiNTdcXHUwYjVmLVxcdTBiNjBcXHUwYjY2LVxcdTBiNmZcXHUwYjgyXFx1MGJiZS1cXHUwYmMyXFx1MGJjNi1cXHUwYmM4XFx1MGJjYS1cXHUwYmNkXFx1MGJkN1xcdTBiZTYtXFx1MGJlZlxcdTBjMDEtXFx1MGMwM1xcdTBjNDYtXFx1MGM0OFxcdTBjNGEtXFx1MGM0ZFxcdTBjNTVcXHUwYzU2XFx1MGM2Mi1cXHUwYzYzXFx1MGM2Ni1cXHUwYzZmXFx1MGM4MlxcdTBjODNcXHUwY2JjXFx1MGNiZS1cXHUwY2M0XFx1MGNjNi1cXHUwY2M4XFx1MGNjYS1cXHUwY2NkXFx1MGNkNVxcdTBjZDZcXHUwY2UyLVxcdTBjZTNcXHUwY2U2LVxcdTBjZWZcXHUwZDAyXFx1MGQwM1xcdTBkNDYtXFx1MGQ0OFxcdTBkNTdcXHUwZDYyLVxcdTBkNjNcXHUwZDY2LVxcdTBkNmZcXHUwZDgyXFx1MGQ4M1xcdTBkY2FcXHUwZGNmLVxcdTBkZDRcXHUwZGQ2XFx1MGRkOC1cXHUwZGRmXFx1MGRmMlxcdTBkZjNcXHUwZTM0LVxcdTBlM2FcXHUwZTQwLVxcdTBlNDVcXHUwZTUwLVxcdTBlNTlcXHUwZWI0LVxcdTBlYjlcXHUwZWM4LVxcdTBlY2RcXHUwZWQwLVxcdTBlZDlcXHUwZjE4XFx1MGYxOVxcdTBmMjAtXFx1MGYyOVxcdTBmMzVcXHUwZjM3XFx1MGYzOVxcdTBmNDEtXFx1MGY0N1xcdTBmNzEtXFx1MGY4NFxcdTBmODYtXFx1MGY4N1xcdTBmOGQtXFx1MGY5N1xcdTBmOTktXFx1MGZiY1xcdTBmYzZcXHUxMDAwLVxcdTEwMjlcXHUxMDQwLVxcdTEwNDlcXHUxMDY3LVxcdTEwNmRcXHUxMDcxLVxcdTEwNzRcXHUxMDgyLVxcdTEwOGRcXHUxMDhmLVxcdTEwOWRcXHUxMzVkLVxcdTEzNWZcXHUxNzBlLVxcdTE3MTBcXHUxNzIwLVxcdTE3MzBcXHUxNzQwLVxcdTE3NTBcXHUxNzcyXFx1MTc3M1xcdTE3ODAtXFx1MTdiMlxcdTE3ZGRcXHUxN2UwLVxcdTE3ZTlcXHUxODBiLVxcdTE4MGRcXHUxODEwLVxcdTE4MTlcXHUxOTIwLVxcdTE5MmJcXHUxOTMwLVxcdTE5M2JcXHUxOTUxLVxcdTE5NmRcXHUxOWIwLVxcdTE5YzBcXHUxOWM4LVxcdTE5YzlcXHUxOWQwLVxcdTE5ZDlcXHUxYTAwLVxcdTFhMTVcXHUxYTIwLVxcdTFhNTNcXHUxYTYwLVxcdTFhN2NcXHUxYTdmLVxcdTFhODlcXHUxYTkwLVxcdTFhOTlcXHUxYjQ2LVxcdTFiNGJcXHUxYjUwLVxcdTFiNTlcXHUxYjZiLVxcdTFiNzNcXHUxYmIwLVxcdTFiYjlcXHUxYmU2LVxcdTFiZjNcXHUxYzAwLVxcdTFjMjJcXHUxYzQwLVxcdTFjNDlcXHUxYzViLVxcdTFjN2RcXHUxY2QwLVxcdTFjZDJcXHUxZDAwLVxcdTFkYmVcXHUxZTAxLVxcdTFmMTVcXHUyMDBjXFx1MjAwZFxcdTIwM2ZcXHUyMDQwXFx1MjA1NFxcdTIwZDAtXFx1MjBkY1xcdTIwZTFcXHUyMGU1LVxcdTIwZjBcXHUyZDgxLVxcdTJkOTZcXHUyZGUwLVxcdTJkZmZcXHUzMDIxLVxcdTMwMjhcXHUzMDk5XFx1MzA5YVxcdWE2NDAtXFx1YTY2ZFxcdWE2NzQtXFx1YTY3ZFxcdWE2OWZcXHVhNmYwLVxcdWE2ZjFcXHVhN2Y4LVxcdWE4MDBcXHVhODA2XFx1YTgwYlxcdWE4MjMtXFx1YTgyN1xcdWE4ODAtXFx1YTg4MVxcdWE4YjQtXFx1YThjNFxcdWE4ZDAtXFx1YThkOVxcdWE4ZjMtXFx1YThmN1xcdWE5MDAtXFx1YTkwOVxcdWE5MjYtXFx1YTkyZFxcdWE5MzAtXFx1YTk0NVxcdWE5ODAtXFx1YTk4M1xcdWE5YjMtXFx1YTljMFxcdWFhMDAtXFx1YWEyN1xcdWFhNDAtXFx1YWE0MVxcdWFhNGMtXFx1YWE0ZFxcdWFhNTAtXFx1YWE1OVxcdWFhN2JcXHVhYWUwLVxcdWFhZTlcXHVhYWYyLVxcdWFhZjNcXHVhYmMwLVxcdWFiZTFcXHVhYmVjXFx1YWJlZFxcdWFiZjAtXFx1YWJmOVxcdWZiMjAtXFx1ZmIyOFxcdWZlMDAtXFx1ZmUwZlxcdWZlMjAtXFx1ZmUyNlxcdWZlMzNcXHVmZTM0XFx1ZmU0ZC1cXHVmZTRmXFx1ZmYxMC1cXHVmZjE5XFx1ZmYzZlwiO1xuICB2YXIgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnQgPSBuZXcgUmVnRXhwKFwiW1wiICsgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyArIFwiXVwiKTtcbiAgdmFyIG5vbkFTQ0lJaWRlbnRpZmllciA9IG5ldyBSZWdFeHAoXCJbXCIgKyBub25BU0NJSWlkZW50aWZpZXJTdGFydENoYXJzICsgbm9uQVNDSUlpZGVudGlmaWVyQ2hhcnMgKyBcIl1cIik7XG5cbiAgLy8gV2hldGhlciBhIHNpbmdsZSBjaGFyYWN0ZXIgZGVub3RlcyBhIG5ld2xpbmUuXG5cbiAgdmFyIG5ld2xpbmUgPSAvW1xcblxcclxcdTIwMjhcXHUyMDI5XS87XG5cbiAgLy8gTWF0Y2hlcyBhIHdob2xlIGxpbmUgYnJlYWsgKHdoZXJlIENSTEYgaXMgY29uc2lkZXJlZCBhIHNpbmdsZVxuICAvLyBsaW5lIGJyZWFrKS4gVXNlZCB0byBjb3VudCBsaW5lcy5cblxuICB2YXIgbGluZUJyZWFrID0gL1xcclxcbnxbXFxuXFxyXFx1MjAyOFxcdTIwMjldL2c7XG5cbiAgLy8gVGVzdCB3aGV0aGVyIGEgZ2l2ZW4gY2hhcmFjdGVyIGNvZGUgc3RhcnRzIGFuIGlkZW50aWZpZXIuXG5cbiAgdmFyIGlzSWRlbnRpZmllclN0YXJ0ID0gZXhwb3J0cy5pc0lkZW50aWZpZXJTdGFydCA9IGZ1bmN0aW9uKGNvZGUpIHtcbiAgICBpZiAoY29kZSA8IDY1KSByZXR1cm4gY29kZSA9PT0gMzY7XG4gICAgaWYgKGNvZGUgPCA5MSkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGNvZGUgPCA5NykgcmV0dXJuIGNvZGUgPT09IDk1O1xuICAgIGlmIChjb2RlIDwgMTIzKXJldHVybiB0cnVlO1xuICAgIHJldHVybiBjb2RlID49IDB4YWEgJiYgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnQudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpKTtcbiAgfTtcblxuICAvLyBUZXN0IHdoZXRoZXIgYSBnaXZlbiBjaGFyYWN0ZXIgaXMgcGFydCBvZiBhbiBpZGVudGlmaWVyLlxuXG4gIHZhciBpc0lkZW50aWZpZXJDaGFyID0gZXhwb3J0cy5pc0lkZW50aWZpZXJDaGFyID0gZnVuY3Rpb24oY29kZSkge1xuICAgIGlmIChjb2RlIDwgNDgpIHJldHVybiBjb2RlID09PSAzNjtcbiAgICBpZiAoY29kZSA8IDU4KSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoY29kZSA8IDY1KSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKGNvZGUgPCA5MSkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGNvZGUgPCA5NykgcmV0dXJuIGNvZGUgPT09IDk1O1xuICAgIGlmIChjb2RlIDwgMTIzKXJldHVybiB0cnVlO1xuICAgIHJldHVybiBjb2RlID49IDB4YWEgJiYgbm9uQVNDSUlpZGVudGlmaWVyLnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSk7XG4gIH07XG5cbiAgLy8gIyMgVG9rZW5pemVyXG5cbiAgLy8gVGhlc2UgYXJlIHVzZWQgd2hlbiBgb3B0aW9ucy5sb2NhdGlvbnNgIGlzIG9uLCBmb3IgdGhlXG4gIC8vIGB0b2tTdGFydExvY2AgYW5kIGB0b2tFbmRMb2NgIHByb3BlcnRpZXMuXG5cbiAgZnVuY3Rpb24gUG9zaXRpb24oKSB7XG4gICAgdGhpcy5saW5lID0gdG9rQ3VyTGluZTtcbiAgICB0aGlzLmNvbHVtbiA9IHRva1BvcyAtIHRva0xpbmVTdGFydDtcbiAgfVxuXG4gIC8vIFJlc2V0IHRoZSB0b2tlbiBzdGF0ZS4gVXNlZCBhdCB0aGUgc3RhcnQgb2YgYSBwYXJzZS5cblxuICBmdW5jdGlvbiBpbml0VG9rZW5TdGF0ZSgpIHtcbiAgICB0b2tDdXJMaW5lID0gMTtcbiAgICB0b2tQb3MgPSB0b2tMaW5lU3RhcnQgPSAwO1xuICAgIHRva1JlZ2V4cEFsbG93ZWQgPSB0cnVlO1xuICAgIHNraXBTcGFjZSgpO1xuICB9XG5cbiAgLy8gQ2FsbGVkIGF0IHRoZSBlbmQgb2YgZXZlcnkgdG9rZW4uIFNldHMgYHRva0VuZGAsIGB0b2tWYWxgLCBhbmRcbiAgLy8gYHRva1JlZ2V4cEFsbG93ZWRgLCBhbmQgc2tpcHMgdGhlIHNwYWNlIGFmdGVyIHRoZSB0b2tlbiwgc28gdGhhdFxuICAvLyB0aGUgbmV4dCBvbmUncyBgdG9rU3RhcnRgIHdpbGwgcG9pbnQgYXQgdGhlIHJpZ2h0IHBvc2l0aW9uLlxuXG4gIGZ1bmN0aW9uIGZpbmlzaFRva2VuKHR5cGUsIHZhbCkge1xuICAgIHRva0VuZCA9IHRva1BvcztcbiAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnMpIHRva0VuZExvYyA9IG5ldyBQb3NpdGlvbjtcbiAgICB0b2tUeXBlID0gdHlwZTtcbiAgICBza2lwU3BhY2UoKTtcbiAgICB0b2tWYWwgPSB2YWw7XG4gICAgdG9rUmVnZXhwQWxsb3dlZCA9IHR5cGUuYmVmb3JlRXhwcjtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNraXBCbG9ja0NvbW1lbnQoKSB7XG4gICAgdmFyIHN0YXJ0TG9jID0gb3B0aW9ucy5vbkNvbW1lbnQgJiYgb3B0aW9ucy5sb2NhdGlvbnMgJiYgbmV3IFBvc2l0aW9uO1xuICAgIHZhciBzdGFydCA9IHRva1BvcywgZW5kID0gaW5wdXQuaW5kZXhPZihcIiovXCIsIHRva1BvcyArPSAyKTtcbiAgICBpZiAoZW5kID09PSAtMSkgcmFpc2UodG9rUG9zIC0gMiwgXCJVbnRlcm1pbmF0ZWQgY29tbWVudFwiKTtcbiAgICB0b2tQb3MgPSBlbmQgKyAyO1xuICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgbGluZUJyZWFrLmxhc3RJbmRleCA9IHN0YXJ0O1xuICAgICAgdmFyIG1hdGNoO1xuICAgICAgd2hpbGUgKChtYXRjaCA9IGxpbmVCcmVhay5leGVjKGlucHV0KSkgJiYgbWF0Y2guaW5kZXggPCB0b2tQb3MpIHtcbiAgICAgICAgKyt0b2tDdXJMaW5lO1xuICAgICAgICB0b2tMaW5lU3RhcnQgPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKG9wdGlvbnMub25Db21tZW50KVxuICAgICAgb3B0aW9ucy5vbkNvbW1lbnQodHJ1ZSwgaW5wdXQuc2xpY2Uoc3RhcnQgKyAyLCBlbmQpLCBzdGFydCwgdG9rUG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRMb2MsIG9wdGlvbnMubG9jYXRpb25zICYmIG5ldyBQb3NpdGlvbik7XG4gIH1cblxuICBmdW5jdGlvbiBza2lwTGluZUNvbW1lbnQoKSB7XG4gICAgdmFyIHN0YXJ0ID0gdG9rUG9zO1xuICAgIHZhciBzdGFydExvYyA9IG9wdGlvbnMub25Db21tZW50ICYmIG9wdGlvbnMubG9jYXRpb25zICYmIG5ldyBQb3NpdGlvbjtcbiAgICB2YXIgY2ggPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcys9Mik7XG4gICAgd2hpbGUgKHRva1BvcyA8IGlucHV0TGVuICYmIGNoICE9PSAxMCAmJiBjaCAhPT0gMTMgJiYgY2ggIT09IDgyMzIgJiYgY2ggIT09IDgyMzMpIHtcbiAgICAgICsrdG9rUG9zO1xuICAgICAgY2ggPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgfVxuICAgIGlmIChvcHRpb25zLm9uQ29tbWVudClcbiAgICAgIG9wdGlvbnMub25Db21tZW50KGZhbHNlLCBpbnB1dC5zbGljZShzdGFydCArIDIsIHRva1BvcyksIHN0YXJ0LCB0b2tQb3MsXG4gICAgICAgICAgICAgICAgICAgICAgICBzdGFydExvYywgb3B0aW9ucy5sb2NhdGlvbnMgJiYgbmV3IFBvc2l0aW9uKTtcbiAgfVxuXG4gIC8vIENhbGxlZCBhdCB0aGUgc3RhcnQgb2YgdGhlIHBhcnNlIGFuZCBhZnRlciBldmVyeSB0b2tlbi4gU2tpcHNcbiAgLy8gd2hpdGVzcGFjZSBhbmQgY29tbWVudHMsIGFuZC5cblxuICBmdW5jdGlvbiBza2lwU3BhY2UoKSB7XG4gICAgd2hpbGUgKHRva1BvcyA8IGlucHV0TGVuKSB7XG4gICAgICB2YXIgY2ggPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgICBpZiAoY2ggPT09IDMyKSB7IC8vICcgJ1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDEzKSB7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICAgICAgaWYgKG5leHQgPT09IDEwKSB7XG4gICAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgICAgICAgKyt0b2tDdXJMaW5lO1xuICAgICAgICAgIHRva0xpbmVTdGFydCA9IHRva1BvcztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gMTAgfHwgY2ggPT09IDgyMzIgfHwgY2ggPT09IDgyMzMpIHtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgICAgICsrdG9rQ3VyTGluZTtcbiAgICAgICAgICB0b2tMaW5lU3RhcnQgPSB0b2tQb3M7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2ggPiA4ICYmIGNoIDwgMTQpIHtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSA0NykgeyAvLyAnLydcbiAgICAgICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgICAgICBpZiAobmV4dCA9PT0gNDIpIHsgLy8gJyonXG4gICAgICAgICAgc2tpcEJsb2NrQ29tbWVudCgpO1xuICAgICAgICB9IGVsc2UgaWYgKG5leHQgPT09IDQ3KSB7IC8vICcvJ1xuICAgICAgICAgIHNraXBMaW5lQ29tbWVudCgpO1xuICAgICAgICB9IGVsc2UgYnJlYWs7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSAxNjApIHsgLy8gJ1xceGEwJ1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPj0gNTc2MCAmJiBub25BU0NJSXdoaXRlc3BhY2UudGVzdChTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKSkpIHtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyAjIyMgVG9rZW4gcmVhZGluZ1xuXG4gIC8vIFRoaXMgaXMgdGhlIGZ1bmN0aW9uIHRoYXQgaXMgY2FsbGVkIHRvIGZldGNoIHRoZSBuZXh0IHRva2VuLiBJdFxuICAvLyBpcyBzb21ld2hhdCBvYnNjdXJlLCBiZWNhdXNlIGl0IHdvcmtzIGluIGNoYXJhY3RlciBjb2RlcyByYXRoZXJcbiAgLy8gdGhhbiBjaGFyYWN0ZXJzLCBhbmQgYmVjYXVzZSBvcGVyYXRvciBwYXJzaW5nIGhhcyBiZWVuIGlubGluZWRcbiAgLy8gaW50byBpdC5cbiAgLy9cbiAgLy8gQWxsIGluIHRoZSBuYW1lIG9mIHNwZWVkLlxuICAvL1xuICAvLyBUaGUgYGZvcmNlUmVnZXhwYCBwYXJhbWV0ZXIgaXMgdXNlZCBpbiB0aGUgb25lIGNhc2Ugd2hlcmUgdGhlXG4gIC8vIGB0b2tSZWdleHBBbGxvd2VkYCB0cmljayBkb2VzIG5vdCB3b3JrLiBTZWUgYHBhcnNlU3RhdGVtZW50YC5cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fZG90KCkge1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAobmV4dCA+PSA0OCAmJiBuZXh0IDw9IDU3KSByZXR1cm4gcmVhZE51bWJlcih0cnVlKTtcbiAgICB2YXIgbmV4dDIgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpO1xuICAgIGlmIChvcHRpb25zLmVjbWFWZXJzaW9uID49IDYgJiYgbmV4dCA9PT0gNDYgJiYgbmV4dDIgPT09IDQ2KSB7IC8vIDQ2ID0gZG90ICcuJ1xuICAgICAgdG9rUG9zICs9IDM7XG4gICAgICByZXR1cm4gZmluaXNoVG9rZW4oX2VsbGlwc2lzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgKyt0b2tQb3M7XG4gICAgICByZXR1cm4gZmluaXNoVG9rZW4oX2RvdCk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX3NsYXNoKCkgeyAvLyAnLydcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKHRva1JlZ2V4cEFsbG93ZWQpIHsrK3Rva1BvczsgcmV0dXJuIHJlYWRSZWdleHAoKTt9XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKF9zbGFzaCwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fbXVsdF9tb2R1bG8oKSB7IC8vICclKidcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKF9tdWx0aXBseU1vZHVsbywgMSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fcGlwZV9hbXAoY29kZSkgeyAvLyAnfCYnXG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID09PSBjb2RlKSByZXR1cm4gZmluaXNoT3AoY29kZSA9PT0gMTI0ID8gX2xvZ2ljYWxPUiA6IF9sb2dpY2FsQU5ELCAyKTtcbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoY29kZSA9PT0gMTI0ID8gX2JpdHdpc2VPUiA6IF9iaXR3aXNlQU5ELCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9jYXJldCgpIHsgLy8gJ14nXG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9hc3NpZ24sIDIpO1xuICAgIHJldHVybiBmaW5pc2hPcChfYml0d2lzZVhPUiwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fcGx1c19taW4oY29kZSkgeyAvLyAnKy0nXG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID09PSBjb2RlKSB7XG4gICAgICBpZiAobmV4dCA9PSA0NSAmJiBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09IDYyICYmXG4gICAgICAgICAgbmV3bGluZS50ZXN0KGlucHV0LnNsaWNlKGxhc3RFbmQsIHRva1BvcykpKSB7XG4gICAgICAgIC8vIEEgYC0tPmAgbGluZSBjb21tZW50XG4gICAgICAgIHRva1BvcyArPSAzO1xuICAgICAgICBza2lwTGluZUNvbW1lbnQoKTtcbiAgICAgICAgc2tpcFNwYWNlKCk7XG4gICAgICAgIHJldHVybiByZWFkVG9rZW4oKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaW5pc2hPcChfaW5jRGVjLCAyKTtcbiAgICB9XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKF9wbHVzTWluLCAxKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9sdF9ndChjb2RlKSB7IC8vICc8PidcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgdmFyIHNpemUgPSAxO1xuICAgIGlmIChuZXh0ID09PSBjb2RlKSB7XG4gICAgICBzaXplID0gY29kZSA9PT0gNjIgJiYgaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAyKSA9PT0gNjIgPyAzIDogMjtcbiAgICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIHNpemUpID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9hc3NpZ24sIHNpemUgKyAxKTtcbiAgICAgIHJldHVybiBmaW5pc2hPcChfYml0U2hpZnQsIHNpemUpO1xuICAgIH1cbiAgICBpZiAobmV4dCA9PSAzMyAmJiBjb2RlID09IDYwICYmIGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMikgPT0gNDUgJiZcbiAgICAgICAgaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAzKSA9PSA0NSkge1xuICAgICAgLy8gYDwhLS1gLCBhbiBYTUwtc3R5bGUgY29tbWVudCB0aGF0IHNob3VsZCBiZSBpbnRlcnByZXRlZCBhcyBhIGxpbmUgY29tbWVudFxuICAgICAgdG9rUG9zICs9IDQ7XG4gICAgICBza2lwTGluZUNvbW1lbnQoKTtcbiAgICAgIHNraXBTcGFjZSgpO1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbigpO1xuICAgIH1cbiAgICBpZiAobmV4dCA9PT0gNjEpXG4gICAgICBzaXplID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAyKSA9PT0gNjEgPyAzIDogMjtcbiAgICByZXR1cm4gZmluaXNoT3AoX3JlbGF0aW9uYWwsIHNpemUpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX2VxX2V4Y2woY29kZSkgeyAvLyAnPSEnXG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9lcXVhbGl0eSwgaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAyKSA9PT0gNjEgPyAzIDogMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKGNvZGUgPT09IDYxID8gX2VxIDogX3ByZWZpeCwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiBnZXRUb2tlbkZyb21Db2RlKGNvZGUpIHtcbiAgICBzd2l0Y2goY29kZSkge1xuICAgICAgLy8gVGhlIGludGVycHJldGF0aW9uIG9mIGEgZG90IGRlcGVuZHMgb24gd2hldGhlciBpdCBpcyBmb2xsb3dlZFxuICAgICAgLy8gYnkgYSBkaWdpdCBvciBhbm90aGVyIHR3byBkb3RzLlxuICAgIGNhc2UgNDY6IC8vICcuJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9kb3QoKTtcblxuICAgICAgLy8gUHVuY3R1YXRpb24gdG9rZW5zLlxuICAgIGNhc2UgNDA6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX3BhcmVuTCk7XG4gICAgY2FzZSA0MTogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfcGFyZW5SKTtcbiAgICBjYXNlIDU5OiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9zZW1pKTtcbiAgICBjYXNlIDQ0OiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9jb21tYSk7XG4gICAgY2FzZSA5MTogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfYnJhY2tldEwpO1xuICAgIGNhc2UgOTM6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX2JyYWNrZXRSKTtcbiAgICBjYXNlIDEyMzogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfYnJhY2VMKTtcbiAgICBjYXNlIDEyNTogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfYnJhY2VSKTtcbiAgICBjYXNlIDU4OiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9jb2xvbik7XG4gICAgY2FzZSA2MzogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfcXVlc3Rpb24pO1xuXG4gICAgICAvLyAnMHgnIGlzIGEgaGV4YWRlY2ltYWwgbnVtYmVyLlxuICAgIGNhc2UgNDg6IC8vICcwJ1xuICAgICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgICAgaWYgKG5leHQgPT09IDEyMCB8fCBuZXh0ID09PSA4OCkgcmV0dXJuIHJlYWRIZXhOdW1iZXIoKTtcbiAgICAgIC8vIEFueXRoaW5nIGVsc2UgYmVnaW5uaW5nIHdpdGggYSBkaWdpdCBpcyBhbiBpbnRlZ2VyLCBvY3RhbFxuICAgICAgLy8gbnVtYmVyLCBvciBmbG9hdC5cbiAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgY2FzZSA0OTogY2FzZSA1MDogY2FzZSA1MTogY2FzZSA1MjogY2FzZSA1MzogY2FzZSA1NDogY2FzZSA1NTogY2FzZSA1NjogY2FzZSA1NzogLy8gMS05XG4gICAgICByZXR1cm4gcmVhZE51bWJlcihmYWxzZSk7XG5cbiAgICAgIC8vIFF1b3RlcyBwcm9kdWNlIHN0cmluZ3MuXG4gICAgY2FzZSAzNDogY2FzZSAzOTogLy8gJ1wiJywgXCInXCJcbiAgICAgIHJldHVybiByZWFkU3RyaW5nKGNvZGUpO1xuXG4gICAgLy8gT3BlcmF0b3JzIGFyZSBwYXJzZWQgaW5saW5lIGluIHRpbnkgc3RhdGUgbWFjaGluZXMuICc9JyAoNjEpIGlzXG4gICAgLy8gb2Z0ZW4gcmVmZXJyZWQgdG8uIGBmaW5pc2hPcGAgc2ltcGx5IHNraXBzIHRoZSBhbW91bnQgb2ZcbiAgICAvLyBjaGFyYWN0ZXJzIGl0IGlzIGdpdmVuIGFzIHNlY29uZCBhcmd1bWVudCwgYW5kIHJldHVybnMgYSB0b2tlblxuICAgIC8vIG9mIHRoZSB0eXBlIGdpdmVuIGJ5IGl0cyBmaXJzdCBhcmd1bWVudC5cblxuICAgIGNhc2UgNDc6IC8vICcvJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9zbGFzaCgpO1xuXG4gICAgY2FzZSAzNzogY2FzZSA0MjogLy8gJyUqJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9tdWx0X21vZHVsbygpO1xuXG4gICAgY2FzZSAxMjQ6IGNhc2UgMzg6IC8vICd8JidcbiAgICAgIHJldHVybiByZWFkVG9rZW5fcGlwZV9hbXAoY29kZSk7XG5cbiAgICBjYXNlIDk0OiAvLyAnXidcbiAgICAgIHJldHVybiByZWFkVG9rZW5fY2FyZXQoKTtcblxuICAgIGNhc2UgNDM6IGNhc2UgNDU6IC8vICcrLSdcbiAgICAgIHJldHVybiByZWFkVG9rZW5fcGx1c19taW4oY29kZSk7XG5cbiAgICBjYXNlIDYwOiBjYXNlIDYyOiAvLyAnPD4nXG4gICAgICByZXR1cm4gcmVhZFRva2VuX2x0X2d0KGNvZGUpO1xuXG4gICAgY2FzZSA2MTogY2FzZSAzMzogLy8gJz0hJ1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9lcV9leGNsKGNvZGUpO1xuXG4gICAgY2FzZSAxMjY6IC8vICd+J1xuICAgICAgcmV0dXJuIGZpbmlzaE9wKF9wcmVmaXgsIDEpO1xuICAgIH1cblxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbihmb3JjZVJlZ2V4cCkge1xuICAgIGlmICghZm9yY2VSZWdleHApIHRva1N0YXJ0ID0gdG9rUG9zO1xuICAgIGVsc2UgdG9rUG9zID0gdG9rU3RhcnQgKyAxO1xuICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykgdG9rU3RhcnRMb2MgPSBuZXcgUG9zaXRpb247XG4gICAgaWYgKGZvcmNlUmVnZXhwKSByZXR1cm4gcmVhZFJlZ2V4cCgpO1xuICAgIGlmICh0b2tQb3MgPj0gaW5wdXRMZW4pIHJldHVybiBmaW5pc2hUb2tlbihfZW9mKTtcblxuICAgIHZhciBjb2RlID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgIC8vIElkZW50aWZpZXIgb3Iga2V5d29yZC4gJ1xcdVhYWFgnIHNlcXVlbmNlcyBhcmUgYWxsb3dlZCBpblxuICAgIC8vIGlkZW50aWZpZXJzLCBzbyAnXFwnIGFsc28gZGlzcGF0Y2hlcyB0byB0aGF0LlxuICAgIGlmIChpc0lkZW50aWZpZXJTdGFydChjb2RlKSB8fCBjb2RlID09PSA5MiAvKiAnXFwnICovKSByZXR1cm4gcmVhZFdvcmQoKTtcblxuICAgIHZhciB0b2sgPSBnZXRUb2tlbkZyb21Db2RlKGNvZGUpO1xuXG4gICAgaWYgKHRvayA9PT0gZmFsc2UpIHtcbiAgICAgIC8vIElmIHdlIGFyZSBoZXJlLCB3ZSBlaXRoZXIgZm91bmQgYSBub24tQVNDSUkgaWRlbnRpZmllclxuICAgICAgLy8gY2hhcmFjdGVyLCBvciBzb21ldGhpbmcgdGhhdCdzIGVudGlyZWx5IGRpc2FsbG93ZWQuXG4gICAgICB2YXIgY2ggPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNvZGUpO1xuICAgICAgaWYgKGNoID09PSBcIlxcXFxcIiB8fCBub25BU0NJSWlkZW50aWZpZXJTdGFydC50ZXN0KGNoKSkgcmV0dXJuIHJlYWRXb3JkKCk7XG4gICAgICByYWlzZSh0b2tQb3MsIFwiVW5leHBlY3RlZCBjaGFyYWN0ZXIgJ1wiICsgY2ggKyBcIidcIik7XG4gICAgfVxuICAgIHJldHVybiB0b2s7XG4gIH1cblxuICBmdW5jdGlvbiBmaW5pc2hPcCh0eXBlLCBzaXplKSB7XG4gICAgdmFyIHN0ciA9IGlucHV0LnNsaWNlKHRva1BvcywgdG9rUG9zICsgc2l6ZSk7XG4gICAgdG9rUG9zICs9IHNpemU7XG4gICAgZmluaXNoVG9rZW4odHlwZSwgc3RyKTtcbiAgfVxuXG4gIC8vIFBhcnNlIGEgcmVndWxhciBleHByZXNzaW9uLiBTb21lIGNvbnRleHQtYXdhcmVuZXNzIGlzIG5lY2Vzc2FyeSxcbiAgLy8gc2luY2UgYSAnLycgaW5zaWRlIGEgJ1tdJyBzZXQgZG9lcyBub3QgZW5kIHRoZSBleHByZXNzaW9uLlxuXG4gIGZ1bmN0aW9uIHJlYWRSZWdleHAoKSB7XG4gICAgdmFyIGNvbnRlbnQgPSBcIlwiLCBlc2NhcGVkLCBpbkNsYXNzLCBzdGFydCA9IHRva1BvcztcbiAgICBmb3IgKDs7KSB7XG4gICAgICBpZiAodG9rUG9zID49IGlucHV0TGVuKSByYWlzZShzdGFydCwgXCJVbnRlcm1pbmF0ZWQgcmVndWxhciBleHByZXNzaW9uXCIpO1xuICAgICAgdmFyIGNoID0gaW5wdXQuY2hhckF0KHRva1Bvcyk7XG4gICAgICBpZiAobmV3bGluZS50ZXN0KGNoKSkgcmFpc2Uoc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTtcbiAgICAgIGlmICghZXNjYXBlZCkge1xuICAgICAgICBpZiAoY2ggPT09IFwiW1wiKSBpbkNsYXNzID0gdHJ1ZTtcbiAgICAgICAgZWxzZSBpZiAoY2ggPT09IFwiXVwiICYmIGluQ2xhc3MpIGluQ2xhc3MgPSBmYWxzZTtcbiAgICAgICAgZWxzZSBpZiAoY2ggPT09IFwiL1wiICYmICFpbkNsYXNzKSBicmVhaztcbiAgICAgICAgZXNjYXBlZCA9IGNoID09PSBcIlxcXFxcIjtcbiAgICAgIH0gZWxzZSBlc2NhcGVkID0gZmFsc2U7XG4gICAgICArK3Rva1BvcztcbiAgICB9XG4gICAgdmFyIGNvbnRlbnQgPSBpbnB1dC5zbGljZShzdGFydCwgdG9rUG9zKTtcbiAgICArK3Rva1BvcztcbiAgICAvLyBOZWVkIHRvIHVzZSBgcmVhZFdvcmQxYCBiZWNhdXNlICdcXHVYWFhYJyBzZXF1ZW5jZXMgYXJlIGFsbG93ZWRcbiAgICAvLyBoZXJlIChkb24ndCBhc2spLlxuICAgIHZhciBtb2RzID0gcmVhZFdvcmQxKCk7XG4gICAgaWYgKG1vZHMgJiYgIS9eW2dtc2l5XSokLy50ZXN0KG1vZHMpKSByYWlzZShzdGFydCwgXCJJbnZhbGlkIHJlZ3VsYXIgZXhwcmVzc2lvbiBmbGFnXCIpO1xuICAgIHRyeSB7XG4gICAgICB2YXIgdmFsdWUgPSBuZXcgUmVnRXhwKGNvbnRlbnQsIG1vZHMpO1xuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIGlmIChlIGluc3RhbmNlb2YgU3ludGF4RXJyb3IpIHJhaXNlKHN0YXJ0LCBcIkVycm9yIHBhcnNpbmcgcmVndWxhciBleHByZXNzaW9uOiBcIiArIGUubWVzc2FnZSk7XG4gICAgICByYWlzZShlKTtcbiAgICB9XG4gICAgcmV0dXJuIGZpbmlzaFRva2VuKF9yZWdleHAsIHZhbHVlKTtcbiAgfVxuXG4gIC8vIFJlYWQgYW4gaW50ZWdlciBpbiB0aGUgZ2l2ZW4gcmFkaXguIFJldHVybiBudWxsIGlmIHplcm8gZGlnaXRzXG4gIC8vIHdlcmUgcmVhZCwgdGhlIGludGVnZXIgdmFsdWUgb3RoZXJ3aXNlLiBXaGVuIGBsZW5gIGlzIGdpdmVuLCB0aGlzXG4gIC8vIHdpbGwgcmV0dXJuIGBudWxsYCB1bmxlc3MgdGhlIGludGVnZXIgaGFzIGV4YWN0bHkgYGxlbmAgZGlnaXRzLlxuXG4gIGZ1bmN0aW9uIHJlYWRJbnQocmFkaXgsIGxlbikge1xuICAgIHZhciBzdGFydCA9IHRva1BvcywgdG90YWwgPSAwO1xuICAgIGZvciAodmFyIGkgPSAwLCBlID0gbGVuID09IG51bGwgPyBJbmZpbml0eSA6IGxlbjsgaSA8IGU7ICsraSkge1xuICAgICAgdmFyIGNvZGUgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyksIHZhbDtcbiAgICAgIGlmIChjb2RlID49IDk3KSB2YWwgPSBjb2RlIC0gOTcgKyAxMDsgLy8gYVxuICAgICAgZWxzZSBpZiAoY29kZSA+PSA2NSkgdmFsID0gY29kZSAtIDY1ICsgMTA7IC8vIEFcbiAgICAgIGVsc2UgaWYgKGNvZGUgPj0gNDggJiYgY29kZSA8PSA1NykgdmFsID0gY29kZSAtIDQ4OyAvLyAwLTlcbiAgICAgIGVsc2UgdmFsID0gSW5maW5pdHk7XG4gICAgICBpZiAodmFsID49IHJhZGl4KSBicmVhaztcbiAgICAgICsrdG9rUG9zO1xuICAgICAgdG90YWwgPSB0b3RhbCAqIHJhZGl4ICsgdmFsO1xuICAgIH1cbiAgICBpZiAodG9rUG9zID09PSBzdGFydCB8fCBsZW4gIT0gbnVsbCAmJiB0b2tQb3MgLSBzdGFydCAhPT0gbGVuKSByZXR1cm4gbnVsbDtcblxuICAgIHJldHVybiB0b3RhbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRIZXhOdW1iZXIoKSB7XG4gICAgdG9rUG9zICs9IDI7IC8vIDB4XG4gICAgdmFyIHZhbCA9IHJlYWRJbnQoMTYpO1xuICAgIGlmICh2YWwgPT0gbnVsbCkgcmFpc2UodG9rU3RhcnQgKyAyLCBcIkV4cGVjdGVkIGhleGFkZWNpbWFsIG51bWJlclwiKTtcbiAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpKSkgcmFpc2UodG9rUG9zLCBcIklkZW50aWZpZXIgZGlyZWN0bHkgYWZ0ZXIgbnVtYmVyXCIpO1xuICAgIHJldHVybiBmaW5pc2hUb2tlbihfbnVtLCB2YWwpO1xuICB9XG5cbiAgLy8gUmVhZCBhbiBpbnRlZ2VyLCBvY3RhbCBpbnRlZ2VyLCBvciBmbG9hdGluZy1wb2ludCBudW1iZXIuXG5cbiAgZnVuY3Rpb24gcmVhZE51bWJlcihzdGFydHNXaXRoRG90KSB7XG4gICAgdmFyIHN0YXJ0ID0gdG9rUG9zLCBpc0Zsb2F0ID0gZmFsc2UsIG9jdGFsID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpID09PSA0ODtcbiAgICBpZiAoIXN0YXJ0c1dpdGhEb3QgJiYgcmVhZEludCgxMCkgPT09IG51bGwpIHJhaXNlKHN0YXJ0LCBcIkludmFsaWQgbnVtYmVyXCIpO1xuICAgIGlmIChpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykgPT09IDQ2KSB7XG4gICAgICArK3Rva1BvcztcbiAgICAgIHJlYWRJbnQoMTApO1xuICAgICAgaXNGbG9hdCA9IHRydWU7XG4gICAgfVxuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgIGlmIChuZXh0ID09PSA2OSB8fCBuZXh0ID09PSAxMDEpIHsgLy8gJ2VFJ1xuICAgICAgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQoKyt0b2tQb3MpO1xuICAgICAgaWYgKG5leHQgPT09IDQzIHx8IG5leHQgPT09IDQ1KSArK3Rva1BvczsgLy8gJystJ1xuICAgICAgaWYgKHJlYWRJbnQoMTApID09PSBudWxsKSByYWlzZShzdGFydCwgXCJJbnZhbGlkIG51bWJlclwiKTtcbiAgICAgIGlzRmxvYXQgPSB0cnVlO1xuICAgIH1cbiAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpKSkgcmFpc2UodG9rUG9zLCBcIklkZW50aWZpZXIgZGlyZWN0bHkgYWZ0ZXIgbnVtYmVyXCIpO1xuXG4gICAgdmFyIHN0ciA9IGlucHV0LnNsaWNlKHN0YXJ0LCB0b2tQb3MpLCB2YWw7XG4gICAgaWYgKGlzRmxvYXQpIHZhbCA9IHBhcnNlRmxvYXQoc3RyKTtcbiAgICBlbHNlIGlmICghb2N0YWwgfHwgc3RyLmxlbmd0aCA9PT0gMSkgdmFsID0gcGFyc2VJbnQoc3RyLCAxMCk7XG4gICAgZWxzZSBpZiAoL1s4OV0vLnRlc3Qoc3RyKSB8fCBzdHJpY3QpIHJhaXNlKHN0YXJ0LCBcIkludmFsaWQgbnVtYmVyXCIpO1xuICAgIGVsc2UgdmFsID0gcGFyc2VJbnQoc3RyLCA4KTtcbiAgICByZXR1cm4gZmluaXNoVG9rZW4oX251bSwgdmFsKTtcbiAgfVxuXG4gIC8vIFJlYWQgYSBzdHJpbmcgdmFsdWUsIGludGVycHJldGluZyBiYWNrc2xhc2gtZXNjYXBlcy5cblxuICBmdW5jdGlvbiByZWFkU3RyaW5nKHF1b3RlKSB7XG4gICAgdG9rUG9zKys7XG4gICAgdmFyIG91dCA9IFwiXCI7XG4gICAgZm9yICg7Oykge1xuICAgICAgaWYgKHRva1BvcyA+PSBpbnB1dExlbikgcmFpc2UodG9rU3RhcnQsIFwiVW50ZXJtaW5hdGVkIHN0cmluZyBjb25zdGFudFwiKTtcbiAgICAgIHZhciBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICAgIGlmIChjaCA9PT0gcXVvdGUpIHtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIHJldHVybiBmaW5pc2hUb2tlbihfc3RyaW5nLCBvdXQpO1xuICAgICAgfVxuICAgICAgaWYgKGNoID09PSA5MikgeyAvLyAnXFwnXG4gICAgICAgIGNoID0gaW5wdXQuY2hhckNvZGVBdCgrK3Rva1Bvcyk7XG4gICAgICAgIHZhciBvY3RhbCA9IC9eWzAtN10rLy5leGVjKGlucHV0LnNsaWNlKHRva1BvcywgdG9rUG9zICsgMykpO1xuICAgICAgICBpZiAob2N0YWwpIG9jdGFsID0gb2N0YWxbMF07XG4gICAgICAgIHdoaWxlIChvY3RhbCAmJiBwYXJzZUludChvY3RhbCwgOCkgPiAyNTUpIG9jdGFsID0gb2N0YWwuc2xpY2UoMCwgLTEpO1xuICAgICAgICBpZiAob2N0YWwgPT09IFwiMFwiKSBvY3RhbCA9IG51bGw7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgICBpZiAob2N0YWwpIHtcbiAgICAgICAgICBpZiAoc3RyaWN0KSByYWlzZSh0b2tQb3MgLSAyLCBcIk9jdGFsIGxpdGVyYWwgaW4gc3RyaWN0IG1vZGVcIik7XG4gICAgICAgICAgb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUocGFyc2VJbnQob2N0YWwsIDgpKTtcbiAgICAgICAgICB0b2tQb3MgKz0gb2N0YWwubGVuZ3RoIC0gMTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzd2l0Y2ggKGNoKSB7XG4gICAgICAgICAgY2FzZSAxMTA6IG91dCArPSBcIlxcblwiOyBicmVhazsgLy8gJ24nIC0+ICdcXG4nXG4gICAgICAgICAgY2FzZSAxMTQ6IG91dCArPSBcIlxcclwiOyBicmVhazsgLy8gJ3InIC0+ICdcXHInXG4gICAgICAgICAgY2FzZSAxMjA6IG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHJlYWRIZXhDaGFyKDIpKTsgYnJlYWs7IC8vICd4J1xuICAgICAgICAgIGNhc2UgMTE3OiBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShyZWFkSGV4Q2hhcig0KSk7IGJyZWFrOyAvLyAndSdcbiAgICAgICAgICBjYXNlIDg1OiBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShyZWFkSGV4Q2hhcig4KSk7IGJyZWFrOyAvLyAnVSdcbiAgICAgICAgICBjYXNlIDExNjogb3V0ICs9IFwiXFx0XCI7IGJyZWFrOyAvLyAndCcgLT4gJ1xcdCdcbiAgICAgICAgICBjYXNlIDk4OiBvdXQgKz0gXCJcXGJcIjsgYnJlYWs7IC8vICdiJyAtPiAnXFxiJ1xuICAgICAgICAgIGNhc2UgMTE4OiBvdXQgKz0gXCJcXHUwMDBiXCI7IGJyZWFrOyAvLyAndicgLT4gJ1xcdTAwMGInXG4gICAgICAgICAgY2FzZSAxMDI6IG91dCArPSBcIlxcZlwiOyBicmVhazsgLy8gJ2YnIC0+ICdcXGYnXG4gICAgICAgICAgY2FzZSA0ODogb3V0ICs9IFwiXFwwXCI7IGJyZWFrOyAvLyAwIC0+ICdcXDAnXG4gICAgICAgICAgY2FzZSAxMzogaWYgKGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKSA9PT0gMTApICsrdG9rUG9zOyAvLyAnXFxyXFxuJ1xuICAgICAgICAgIC8qIGZhbGxzIHRocm91Z2ggKi9cbiAgICAgICAgICBjYXNlIDEwOiAvLyAnIFxcbidcbiAgICAgICAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykgeyB0b2tMaW5lU3RhcnQgPSB0b2tQb3M7ICsrdG9rQ3VyTGluZTsgfVxuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDogb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpOyBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChjaCA9PT0gMTMgfHwgY2ggPT09IDEwIHx8IGNoID09PSA4MjMyIHx8IGNoID09PSA4MjMzKSByYWlzZSh0b2tTdGFydCwgXCJVbnRlcm1pbmF0ZWQgc3RyaW5nIGNvbnN0YW50XCIpO1xuICAgICAgICBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShjaCk7IC8vICdcXCdcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gVXNlZCB0byByZWFkIGNoYXJhY3RlciBlc2NhcGUgc2VxdWVuY2VzICgnXFx4JywgJ1xcdScsICdcXFUnKS5cblxuICBmdW5jdGlvbiByZWFkSGV4Q2hhcihsZW4pIHtcbiAgICB2YXIgbiA9IHJlYWRJbnQoMTYsIGxlbik7XG4gICAgaWYgKG4gPT09IG51bGwpIHJhaXNlKHRva1N0YXJ0LCBcIkJhZCBjaGFyYWN0ZXIgZXNjYXBlIHNlcXVlbmNlXCIpO1xuICAgIHJldHVybiBuO1xuICB9XG5cbiAgLy8gVXNlZCB0byBzaWduYWwgdG8gY2FsbGVycyBvZiBgcmVhZFdvcmQxYCB3aGV0aGVyIHRoZSB3b3JkXG4gIC8vIGNvbnRhaW5lZCBhbnkgZXNjYXBlIHNlcXVlbmNlcy4gVGhpcyBpcyBuZWVkZWQgYmVjYXVzZSB3b3JkcyB3aXRoXG4gIC8vIGVzY2FwZSBzZXF1ZW5jZXMgbXVzdCBub3QgYmUgaW50ZXJwcmV0ZWQgYXMga2V5d29yZHMuXG5cbiAgdmFyIGNvbnRhaW5zRXNjO1xuXG4gIC8vIFJlYWQgYW4gaWRlbnRpZmllciwgYW5kIHJldHVybiBpdCBhcyBhIHN0cmluZy4gU2V0cyBgY29udGFpbnNFc2NgXG4gIC8vIHRvIHdoZXRoZXIgdGhlIHdvcmQgY29udGFpbmVkIGEgJ1xcdScgZXNjYXBlLlxuICAvL1xuICAvLyBPbmx5IGJ1aWxkcyB1cCB0aGUgd29yZCBjaGFyYWN0ZXItYnktY2hhcmFjdGVyIHdoZW4gaXQgYWN0dWFsbHlcbiAgLy8gY29udGFpbmVkcyBhbiBlc2NhcGUsIGFzIGEgbWljcm8tb3B0aW1pemF0aW9uLlxuXG4gIGZ1bmN0aW9uIHJlYWRXb3JkMSgpIHtcbiAgICBjb250YWluc0VzYyA9IGZhbHNlO1xuICAgIHZhciB3b3JkLCBmaXJzdCA9IHRydWUsIHN0YXJ0ID0gdG9rUG9zO1xuICAgIGZvciAoOzspIHtcbiAgICAgIHZhciBjaCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICAgIGlmIChpc0lkZW50aWZpZXJDaGFyKGNoKSkge1xuICAgICAgICBpZiAoY29udGFpbnNFc2MpIHdvcmQgKz0gaW5wdXQuY2hhckF0KHRva1Bvcyk7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gOTIpIHsgLy8gXCJcXFwiXG4gICAgICAgIGlmICghY29udGFpbnNFc2MpIHdvcmQgPSBpbnB1dC5zbGljZShzdGFydCwgdG9rUG9zKTtcbiAgICAgICAgY29udGFpbnNFc2MgPSB0cnVlO1xuICAgICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdCgrK3Rva1BvcykgIT0gMTE3KSAvLyBcInVcIlxuICAgICAgICAgIHJhaXNlKHRva1BvcywgXCJFeHBlY3RpbmcgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2UgXFxcXHVYWFhYXCIpO1xuICAgICAgICArK3Rva1BvcztcbiAgICAgICAgdmFyIGVzYyA9IHJlYWRIZXhDaGFyKDQpO1xuICAgICAgICB2YXIgZXNjU3RyID0gU3RyaW5nLmZyb21DaGFyQ29kZShlc2MpO1xuICAgICAgICBpZiAoIWVzY1N0cikgcmFpc2UodG9rUG9zIC0gMSwgXCJJbnZhbGlkIFVuaWNvZGUgZXNjYXBlXCIpO1xuICAgICAgICBpZiAoIShmaXJzdCA/IGlzSWRlbnRpZmllclN0YXJ0KGVzYykgOiBpc0lkZW50aWZpZXJDaGFyKGVzYykpKVxuICAgICAgICAgIHJhaXNlKHRva1BvcyAtIDQsIFwiSW52YWxpZCBVbmljb2RlIGVzY2FwZVwiKTtcbiAgICAgICAgd29yZCArPSBlc2NTdHI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGZpcnN0ID0gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBjb250YWluc0VzYyA/IHdvcmQgOiBpbnB1dC5zbGljZShzdGFydCwgdG9rUG9zKTtcbiAgfVxuXG4gIC8vIFJlYWQgYW4gaWRlbnRpZmllciBvciBrZXl3b3JkIHRva2VuLiBXaWxsIGNoZWNrIGZvciByZXNlcnZlZFxuICAvLyB3b3JkcyB3aGVuIG5lY2Vzc2FyeS5cblxuICBmdW5jdGlvbiByZWFkV29yZCgpIHtcbiAgICB2YXIgd29yZCA9IHJlYWRXb3JkMSgpO1xuICAgIHZhciB0eXBlID0gX25hbWU7XG4gICAgaWYgKCFjb250YWluc0VzYyAmJiBpc0tleXdvcmQod29yZCkpXG4gICAgICB0eXBlID0ga2V5d29yZFR5cGVzW3dvcmRdO1xuICAgIHJldHVybiBmaW5pc2hUb2tlbih0eXBlLCB3b3JkKTtcbiAgfVxuXG5cbmV4cG9ydCBkZWZhdWx0IHsgdG9rZW5pemU6IGV4cG9ydHMudG9rZW5pemUgfTsiLCIvLyBSZWJvdW5kIEhlbHBlcnNcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IExhenlWYWx1ZSBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvbGF6eS12YWx1ZVwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cblxudmFyIGhlbHBlcnMgID0ge30sXG4gICAgcGFydGlhbHMgPSB7fTtcblxuaGVscGVycy5yZWdpc3RlclBhcnRpYWwgPSBmdW5jdGlvbihuYW1lLCBmdW5jKXtcbiAgaWYoZnVuYyAmJiBmdW5jLmlzSFRNTEJhcnMgJiYgdHlwZW9mIG5hbWUgPT09ICdzdHJpbmcnKXtcbiAgICBwYXJ0aWFsc1tuYW1lXSA9IGZ1bmM7XG4gIH1cbn07XG5cbi8vIGxvb2t1cEhlbHBlciByZXR1cm5zIHRoZSBnaXZlbiBmdW5jdGlvbiBmcm9tIHRoZSBoZWxwZXJzIG9iamVjdC4gTWFudWFsIGNoZWNrcyBwcmV2ZW50IHVzZXIgZnJvbSBvdmVycmlkaW5nIHJlc2VydmVkIHdvcmRzLlxuaGVscGVycy5sb29rdXBIZWxwZXIgPSBmdW5jdGlvbihuYW1lLCBlbnYsIGNvbnRleHQpIHtcblxuICBlbnYgPSBlbnYgfHwge307XG5cbiAgbmFtZSA9ICQuc3BsaXRQYXRoKG5hbWUpWzBdO1xuXG4gIC8vIElmIGEgcmVzZXJ2ZWQgaGVscGVycywgcmV0dXJuIGl0XG4gIGlmKG5hbWUgPT09ICdhdHRyaWJ1dGUnKSB7IHJldHVybiB0aGlzLmF0dHJpYnV0ZTsgfVxuICBpZihuYW1lID09PSAnaWYnKSB7IHJldHVybiB0aGlzLmlmOyB9XG4gIGlmKG5hbWUgPT09ICd1bmxlc3MnKSB7IHJldHVybiB0aGlzLnVubGVzczsgfVxuICBpZihuYW1lID09PSAnZWFjaCcpIHsgcmV0dXJuIHRoaXMuZWFjaDsgfVxuICBpZihuYW1lID09PSAnd2l0aCcpIHsgcmV0dXJuIHRoaXMud2l0aDsgfVxuICBpZihuYW1lID09PSAncGFydGlhbCcpIHsgcmV0dXJuIHRoaXMucGFydGlhbDsgfVxuICBpZihuYW1lID09PSAnbGVuZ3RoJykgeyByZXR1cm4gdGhpcy5sZW5ndGg7IH1cbiAgaWYobmFtZSA9PT0gJ29uJykgeyByZXR1cm4gdGhpcy5vbjsgfVxuXG4gIC8vIElmIG5vdCBhIHJlc2VydmVkIGhlbHBlciwgY2hlY2sgZW52LCB0aGVuIGdsb2JhbCBoZWxwZXJzLCBlbHNlIHJldHVybiBmYWxzZVxuICByZXR1cm4gKGVudi5oZWxwZXJzICYmIF8uaXNPYmplY3QoY29udGV4dCkgJiYgXy5pc09iamVjdChlbnYuaGVscGVyc1tjb250ZXh0LmNpZF0pICYmIGVudi5oZWxwZXJzW2NvbnRleHQuY2lkXVtuYW1lXSkgfHwgaGVscGVyc1tuYW1lXSB8fCBmYWxzZTtcbn07XG5cbmhlbHBlcnMucmVnaXN0ZXJIZWxwZXIgPSBmdW5jdGlvbihuYW1lLCBjYWxsYmFjaywgcGFyYW1zKXtcbiAgaWYoIV8uaXNTdHJpbmcobmFtZSkpe1xuICAgIGNvbnNvbGUuZXJyb3IoJ05hbWUgcHJvdmlkZWQgdG8gcmVnaXN0ZXJIZWxwZXIgbXVzdCBiZSBhIHN0cmluZyEnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYoIV8uaXNGdW5jdGlvbihjYWxsYmFjaykpe1xuICAgIGNvbnNvbGUuZXJyb3IoJ0NhbGxiYWNrIHByb3ZpZGVkIHRvIHJlZ2llckhlbHBlciBtdXN0IGJlIGEgZnVuY3Rpb24hJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmKGhlbHBlcnMubG9va3VwSGVscGVyKG5hbWUpKXtcbiAgICBjb25zb2xlLmVycm9yKCdBIGhlbHBlciBjYWxsZWQgXCInICsgbmFtZSArICdcIiBpcyBhbHJlYWR5IHJlZ2lzdGVyZWQhJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcGFyYW1zID0gKF8uaXNBcnJheShwYXJhbXMpKSA/IHBhcmFtcyA6IFtwYXJhbXNdO1xuICBjYWxsYmFjay5fX3BhcmFtcyA9IHBhcmFtcztcblxuICBoZWxwZXJzW25hbWVdID0gY2FsbGJhY2s7XG5cbn07XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIERlZmF1bHQgaGVscGVyc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmhlbHBlcnMub24gPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG4gIHZhciBpLCBjYWxsYmFjaywgZGVsZWdhdGUsIGVsZW1lbnQsXG4gICAgICBldmVudE5hbWUgPSBwYXJhbXNbMF0sXG4gICAgICBsZW4gPSBwYXJhbXMubGVuZ3RoLFxuICAgICAgZGF0YSA9IGhhc2g7XG5cbiAgLy8gQnkgZGVmYXVsdCBldmVyeXRoaW5nIGlzIGRlbGVnYXRlZCBvbiB0aGUgcGFyZW50IGNvbXBvbmVudFxuICBpZihsZW4gPT09IDIpe1xuICAgIGNhbGxiYWNrID0gcGFyYW1zWzFdO1xuICAgIGRlbGVnYXRlID0gb3B0aW9ucy5lbGVtZW50O1xuICAgIGVsZW1lbnQgPSAodGhpcy5lbCB8fCBvcHRpb25zLmVsZW1lbnQpO1xuICB9XG4gIC8vIElmIGEgc2VsZWN0b3IgaXMgcHJvdmlkZWQsIGRlbGVnYXRlIG9uIHRoZSBoZWxwZXIncyBlbGVtZW50XG4gIGVsc2UgaWYobGVuID09PSAzKXtcbiAgICBjYWxsYmFjayA9IHBhcmFtc1syXTtcbiAgICBkZWxlZ2F0ZSA9IHBhcmFtc1sxXTtcbiAgICBlbGVtZW50ID0gb3B0aW9ucy5lbGVtZW50O1xuICB9XG5cbiAgLy8gQXR0YWNoIGV2ZW50XG4gICQoZWxlbWVudCkub24oZXZlbnROYW1lLCBkZWxlZ2F0ZSwgZGF0YSwgZnVuY3Rpb24oZXZlbnQpe1xuICAgIGV2ZW50LmNvbnRleHQgPSBvcHRpb25zLmNvbnRleHQ7XG4gICAgcmV0dXJuIG9wdGlvbnMuaGVscGVycy5fX2NhbGxPbkNvbXBvbmVudChjYWxsYmFjaywgZXZlbnQpO1xuICB9KTtcbn07XG5cbmhlbHBlcnMubGVuZ3RoID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuICAgIHJldHVybiBwYXJhbXNbMF0gJiYgcGFyYW1zWzBdLmxlbmd0aCB8fCAwO1xufTtcblxuaGVscGVycy5pZiA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcblxuICB2YXIgY29uZGl0aW9uID0gcGFyYW1zWzBdO1xuXG4gIGlmKGNvbmRpdGlvbiA9PT0gdW5kZWZpbmVkKXtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGlmKGNvbmRpdGlvbi5pc01vZGVsKXtcbiAgICBjb25kaXRpb24gPSB0cnVlO1xuICB9XG5cbiAgLy8gSWYgb3VyIGNvbmRpdGlvbiBpcyBhbiBhcnJheSwgaGFuZGxlIHByb3Blcmx5XG4gIGlmKF8uaXNBcnJheShjb25kaXRpb24pIHx8IGNvbmRpdGlvbi5pc0NvbGxlY3Rpb24pe1xuICAgIGNvbmRpdGlvbiA9IGNvbmRpdGlvbi5sZW5ndGggPyB0cnVlIDogZmFsc2U7XG4gIH1cblxuICBpZihjb25kaXRpb24gPT09ICd0cnVlJyl7IGNvbmRpdGlvbiA9IHRydWU7IH1cbiAgaWYoY29uZGl0aW9uID09PSAnZmFsc2UnKXsgY29uZGl0aW9uID0gZmFsc2U7IH1cblxuICAvLyBJZiBtb3JlIHRoYW4gb25lIHBhcmFtLCB0aGlzIGlzIG5vdCBhIGJsb2NrIGhlbHBlci4gRXZhbCBhcyBzdWNoLlxuICBpZihwYXJhbXMubGVuZ3RoID4gMSl7XG4gICAgcmV0dXJuIChjb25kaXRpb24pID8gcGFyYW1zWzFdIDogKCBwYXJhbXNbMl0gfHwgJycpO1xuICB9XG5cbiAgLy8gQ2hlY2sgb3VyIGNhY2hlLiBJZiB0aGUgdmFsdWUgaGFzbid0IGFjdHVhbGx5IGNoYW5nZWQsIGRvbid0IGV2YWx1YXRlLiBJbXBvcnRhbnQgZm9yIHJlLXJlbmRlcmluZyBvZiAjZWFjaCBoZWxwZXJzLlxuICBpZihvcHRpb25zLnBsYWNlaG9sZGVyLl9faWZDYWNoZSA9PT0gY29uZGl0aW9uKXtcbiAgICByZXR1cm4gbnVsbDsgLy8gUmV0dXJuIG51bGwgcHJldmVudCdzIHJlLXJlbmRpbmcgb2Ygb3VyIHBsYWNlaG9sZGVyLlxuICB9XG5cbiAgb3B0aW9ucy5wbGFjZWhvbGRlci5fX2lmQ2FjaGUgPSBjb25kaXRpb247XG5cbiAgLy8gUmVuZGVyIHRoZSBhcHJvcHJlYXRlIGJsb2NrIHN0YXRlbWVudFxuICBpZihjb25kaXRpb24gJiYgb3B0aW9ucy50ZW1wbGF0ZSl7XG4gICAgcmV0dXJuIG9wdGlvbnMudGVtcGxhdGUucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgb3B0aW9ucywgKG9wdGlvbnMubW9ycGguY29udGV4dHVhbEVsZW1lbnQgfHwgb3B0aW9ucy5tb3JwaC5lbGVtZW50KSk7XG4gIH1cbiAgZWxzZSBpZighY29uZGl0aW9uICYmIG9wdGlvbnMuaW52ZXJzZSl7XG4gICAgcmV0dXJuIG9wdGlvbnMuaW52ZXJzZS5yZW5kZXIob3B0aW9ucy5jb250ZXh0LCBvcHRpb25zLCAob3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCB8fCBvcHRpb25zLm1vcnBoLmVsZW1lbnQpKTtcbiAgfVxuXG4gIHJldHVybiAnJztcbn07XG5cblxuLy8gVE9ETzogUHJveHkgdG8gaWYgaGVscGVyIHdpdGggaW52ZXJ0ZWQgcGFyYW1zXG5oZWxwZXJzLnVubGVzcyA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcbiAgdmFyIGNvbmRpdGlvbiA9IHBhcmFtc1swXTtcblxuICBpZihjb25kaXRpb24gPT09IHVuZGVmaW5lZCl7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBpZihjb25kaXRpb24uaXNNb2RlbCl7XG4gICAgY29uZGl0aW9uID0gdHJ1ZTtcbiAgfVxuXG4gIC8vIElmIG91ciBjb25kaXRpb24gaXMgYW4gYXJyYXksIGhhbmRsZSBwcm9wZXJseVxuICBpZihfLmlzQXJyYXkoY29uZGl0aW9uKSB8fCBjb25kaXRpb24uaXNDb2xsZWN0aW9uKXtcbiAgICBjb25kaXRpb24gPSBjb25kaXRpb24ubGVuZ3RoID8gdHJ1ZSA6IGZhbHNlO1xuICB9XG5cbiAgLy8gSWYgbW9yZSB0aGFuIG9uZSBwYXJhbSwgdGhpcyBpcyBub3QgYSBibG9jayBoZWxwZXIuIEV2YWwgYXMgc3VjaC5cbiAgaWYocGFyYW1zLmxlbmd0aCA+IDEpe1xuICAgIHJldHVybiAoIWNvbmRpdGlvbikgPyBwYXJhbXNbMV0gOiAoIHBhcmFtc1syXSB8fCAnJyk7XG4gIH1cblxuICAvLyBDaGVjayBvdXIgY2FjaGUuIElmIHRoZSB2YWx1ZSBoYXNuJ3QgYWN0dWFsbHkgY2hhbmdlZCwgZG9uJ3QgZXZhbHVhdGUuIEltcG9ydGFudCBmb3IgcmUtcmVuZGVyaW5nIG9mICNlYWNoIGhlbHBlcnMuXG4gIGlmKG9wdGlvbnMucGxhY2Vob2xkZXIuX191bmxlc3NDYWNoZSA9PT0gY29uZGl0aW9uKXtcbiAgICByZXR1cm4gbnVsbDsgLy8gUmV0dXJuIG51bGwgcHJldmVudCdzIHJlLXJlbmRpbmcgb2Ygb3VyIHBsYWNlaG9sZGVyLlxuICB9XG5cbiAgb3B0aW9ucy5wbGFjZWhvbGRlci5fX3VubGVzc0NhY2hlID0gY29uZGl0aW9uO1xuXG4gIC8vIFJlbmRlciB0aGUgYXByb3ByZWF0ZSBibG9jayBzdGF0ZW1lbnRcbiAgaWYoIWNvbmRpdGlvbiAmJiAgb3B0aW9ucy50ZW1wbGF0ZSl7XG4gICAgcmV0dXJuIG9wdGlvbnMudGVtcGxhdGUucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgb3B0aW9ucywgKG9wdGlvbnMubW9ycGguY29udGV4dHVhbEVsZW1lbnQgfHwgb3B0aW9ucy5tb3JwaC5lbGVtZW50KSk7XG4gIH1cbiAgZWxzZSBpZihjb25kaXRpb24gJiYgb3B0aW9ucy5pbnZlcnNlKXtcbiAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIG9wdGlvbnMsIChvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50IHx8IG9wdGlvbnMubW9ycGguZWxlbWVudCkpO1xuICB9XG5cbiAgcmV0dXJuICcnO1xufTtcblxuLy8gR2l2ZW4gYW4gYXJyYXksIHByZWRpY2F0ZSBhbmQgb3B0aW9uYWwgZXh0cmEgdmFyaWFibGUsIGZpbmRzIHRoZSBpbmRleCBpbiB0aGUgYXJyYXkgd2hlcmUgcHJlZGljYXRlIGlzIHRydWVcbmZ1bmN0aW9uIGZpbmRJbmRleChhcnIsIHByZWRpY2F0ZSwgY2lkKSB7XG4gIGlmIChhcnIgPT0gbnVsbCkge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2ZpbmRJbmRleCBjYWxsZWQgb24gbnVsbCBvciB1bmRlZmluZWQnKTtcbiAgfVxuICBpZiAodHlwZW9mIHByZWRpY2F0ZSAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3ByZWRpY2F0ZSBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcbiAgfVxuICB2YXIgbGlzdCA9IE9iamVjdChhcnIpO1xuICB2YXIgbGVuZ3RoID0gbGlzdC5sZW5ndGggPj4+IDA7XG4gIHZhciB0aGlzQXJnID0gYXJndW1lbnRzWzFdO1xuICB2YXIgdmFsdWU7XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgIHZhbHVlID0gbGlzdFtpXTtcbiAgICBpZiAocHJlZGljYXRlLmNhbGwodGhpc0FyZywgdmFsdWUsIGksIGxpc3QsIGNpZCkpIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gLTE7XG59XG5cbmhlbHBlcnMuZWFjaCA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcblxuICBpZihfLmlzTnVsbChwYXJhbXNbMF0pIHx8IF8uaXNVbmRlZmluZWQocGFyYW1zWzBdKSl7IGNvbnNvbGUud2FybignVW5kZWZpbmVkIHZhbHVlIHBhc3NlZCB0byBlYWNoIGhlbHBlciEgTWF5YmUgdHJ5IHByb3ZpZGluZyBhIGRlZmF1bHQgdmFsdWU/Jywgb3B0aW9ucy5jb250ZXh0KTsgcmV0dXJuIG51bGw7IH1cblxuICB2YXIgdmFsdWUgPSAocGFyYW1zWzBdLmlzQ29sbGVjdGlvbikgPyBwYXJhbXNbMF0ubW9kZWxzIDogcGFyYW1zWzBdLCAvLyBBY2NlcHRzIGNvbGxlY3Rpb25zIG9yIGFycmF5c1xuICAgICAgbW9ycGggPSBvcHRpb25zLnBsYWNlaG9sZGVyLmZpcnN0Q2hpbGRNb3JwaCwgb2JqLCBuZXh0LCBsYXp5VmFsdWUsIG5tb3JwaCwgaSwgIC8vIHVzZWQgYmVsb3cgdG8gcmVtb3ZlIHRyYWlsaW5nIGp1bmsgbW9ycGhzIGZyb20gdGhlIGRvbVxuICAgICAgcG9zaXRpb24sIC8vIFN0b3JlcyB0aGUgaXRlcmF0ZWQgZWxlbWVudCdzIGludGVnZXIgcG9zaXRpb24gaW4gdGhlIGRvbSBsaXN0XG4gICAgICBjdXJyZW50TW9kZWwgPSBmdW5jdGlvbihlbGVtZW50LCBpbmRleCwgYXJyYXksIGNpZCl7XG4gICAgICAgIHJldHVybiBlbGVtZW50LmNpZCA9PT0gY2lkOyAvLyBSZXR1cm5zIHRydWUgaWYgY3VycmVudGx5IG9ic2VydmVkIGVsZW1lbnQgaXMgdGhlIGN1cnJlbnQgbW9kZWwuXG4gICAgICB9O1xuXG4gIC8vIEZvciBlYWNoIGl0ZW0gaW4gdGhpcyBjb2xsZWN0aW9uXG4gIGZvcihpPTA7aSA8IHZhbHVlLmxlbmd0aDtpKyspe1xuICAgIG9iaiA9IHZhbHVlW2ldO1xuICAgIG5leHQgPSAobW9ycGgpID8gbW9ycGgubmV4dE1vcnBoIDogbnVsbDtcblxuICAgIC8vIElmIHRoaXMgbW9ycGggaXMgdGhlIHJlbmRlcmVkIHZlcnNpb24gb2YgdGhpcyBtb2RlbCwgY29udGludWUgdG8gdGhlIG5leHQgb25lLlxuICAgIGlmKG1vcnBoICYmIG1vcnBoLmNpZCA9PSBvYmouY2lkKXsgbW9ycGggPSBuZXh0OyBjb250aW51ZTsgfVxuXG4gICAgLy8gQ3JlYXRlIGEgbGF6eXZhbHVlIHdob3MgdmFsdWUgaXMgdGhlIGNvbnRlbnQgaW5zaWRlIG91ciBibG9jayBoZWxwZXIgcmVuZGVyZWQgaW4gdGhlIGNvbnRleHQgb2YgdGhpcyBjdXJyZW50IGxpc3Qgb2JqZWN0LiBSZXR1cm5zIHRoZSByZW5kZXJlZCBkb20gZm9yIHRoaXMgbGlzdCBpdGVtLlxuICAgIGxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKXtcbiAgICAgIHJldHVybiBvcHRpb25zLnRlbXBsYXRlLnJlbmRlcihvYmosIG9wdGlvbnMsIG9wdGlvbnMucGxhY2Vob2xkZXIuY29udGV4dHVhbEVsZW1lbnQsIFtvYmpdKTtcbiAgICB9LCB7bW9ycGg6IG9wdGlvbnMucGxhY2Vob2xkZXJ9KTtcblxuICAgIC8vIEluc2VydCBvdXIgbmV3bHkgcmVuZGVyZWQgdmFsdWUgKGEgZG9jdW1lbnQgdHJlZSkgaW50byBvdXIgcGxhY2Vob2xkZXIgKHRoZSBjb250YWluaW5nIGVsZW1lbnQpIGF0IGl0cyByZXF1ZXN0ZWQgcG9zaXRpb24gKHdoZXJlIHdlIGN1cnJlbnRseSBhcmUgaW4gdGhlIG9iamVjdCBsaXN0KVxuICAgIG5tb3JwaCA9IG9wdGlvbnMucGxhY2Vob2xkZXIuaW5zZXJ0Q29udGVudEJlZm9yZU1vcnBoKGxhenlWYWx1ZS52YWx1ZSgpLCBtb3JwaCk7XG5cbiAgICAvLyBMYWJlbCB0aGUgaW5zZXJ0ZWQgbW9ycGggZWxlbWVudCB3aXRoIHRoaXMgbW9kZWwncyBjaWRcbiAgICBubW9ycGguY2lkID0gb2JqLmNpZDtcblxuICAgIC8vIERlc3Ryb3kgdGhlIG9sZCBtb3JwaCB0aGF0IHdhcyBoZXJlXG4gICAgbW9ycGggJiYgbW9ycGguZGVzdHJveSgpO1xuXG4gICAgLy8gTW92ZSBvbiB0byB0aGUgbmV4dCBtb3JwaFxuICAgIG1vcnBoID0gbmV4dDtcbiAgfVxuXG4gIC8vIC8vIElmIGFueSBtb3JlIG1vcnBocyBhcmUgbGVmdCBvdmVyLCByZW1vdmUgdGhlbS4gV2UndmUgYWxyZWFkeSBnb25lIHRocm91Z2ggYWxsIHRoZSBtb2RlbHMuXG4gIHdoaWxlKG1vcnBoKXtcbiAgICBuZXh0ID0gbW9ycGgubmV4dE1vcnBoO1xuICAgIG1vcnBoLmRlc3Ryb3koKTtcbiAgICBtb3JwaCA9IG5leHQ7XG4gIH1cblxuICAvLyBSZXR1cm4gbnVsbCBwcmV2ZW50J3MgcmUtcmVuZGluZyBvZiBvdXIgcGxhY2Vob2xkZXIuIE91ciBwbGFjZWhvbGRlciAoY29udGFpbmluZyBlbGVtZW50KSBub3cgaGFzIGFsbCB0aGUgZG9tIHdlIG5lZWQuXG4gIHJldHVybiBudWxsO1xuXG59O1xuXG5oZWxwZXJzLndpdGggPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG5cbiAgLy8gUmVuZGVyIHRoZSBjb250ZW50IGluc2lkZSBvdXIgYmxvY2sgaGVscGVyIHdpdGggdGhlIGNvbnRleHQgb2YgdGhpcyBvYmplY3QuIFJldHVybnMgYSBkb20gdHJlZS5cbiAgcmV0dXJuIG9wdGlvbnMudGVtcGxhdGUucmVuZGVyKHBhcmFtc1swXSwgb3B0aW9ucywgKG9wdGlvbnMubW9ycGguY29udGV4dHVhbEVsZW1lbnQgfHwgb3B0aW9ucy5tb3JwaC5lbGVtZW50KSk7XG5cbn07XG5cbmhlbHBlcnMucGFydGlhbCA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcbiAgdmFyIHBhcnRpYWwgPSBwYXJ0aWFsc1twYXJhbXNbMF1dO1xuICBpZiggcGFydGlhbCAmJiBwYXJ0aWFsLmlzSFRNTEJhcnMgKXtcbiAgICByZXR1cm4gcGFydGlhbC5yZW5kZXIob3B0aW9ucy5jb250ZXh0LCBlbnYpO1xuICB9XG5cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGhlbHBlcnM7XG4iLCIvLyBSZWJvdW5kIENvbXB1dGVkIFByb3BlcnR5XG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCBwcm9wZXJ0eUNvbXBpbGVyIGZyb20gXCJwcm9wZXJ0eS1jb21waWxlci9wcm9wZXJ0eS1jb21waWxlclwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cbi8vIFJldHVybnMgdHJ1ZSBpZiBzdHIgc3RhcnRzIHdpdGggdGVzdFxuZnVuY3Rpb24gc3RhcnRzV2l0aChzdHIsIHRlc3Qpe1xuICBpZihzdHIgPT09IHRlc3QpIHJldHVybiB0cnVlO1xuICByZXR1cm4gc3RyLnN1YnN0cmluZygwLCB0ZXN0Lmxlbmd0aCsxKSA9PT0gdGVzdCsnLic7XG59XG5cblxuLy8gQ2FsbGVkIGFmdGVyIGNhbGxzdGFjayBpcyBleGF1c3RlZCB0byBjYWxsIGFsbCBvZiB0aGlzIGNvbXB1dGVkIHByb3BlcnR5J3Ncbi8vIGRlcGVuZGFudHMgdGhhdCBuZWVkIHRvIGJlIHJlY29tcHV0ZWRcbmZ1bmN0aW9uIHJlY29tcHV0ZUNhbGxiYWNrKCl7XG4gIHZhciBpID0gMCwgbGVuID0gdGhpcy5fdG9DYWxsLmxlbmd0aDtcbiAgZGVsZXRlIHRoaXMuX3JlY29tcHV0ZVRpbWVvdXQ7XG4gIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICB0aGlzLl90b0NhbGwuc2hpZnQoKS5jYWxsKCk7XG4gIH1cbiAgdGhpcy5fdG9DYWxsLmFkZGVkID0ge307XG59XG5cbnZhciBDb21wdXRlZFByb3BlcnR5ID0gZnVuY3Rpb24ocHJvcCwgb3B0aW9ucyl7XG5cbiAgaWYoIV8uaXNGdW5jdGlvbihwcm9wKSkgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0NvbXB1dGVkUHJvcGVydHkgY29uc3RydWN0b3IgbXVzdCBiZSBwYXNzZWQgYSBmdW5jdGlvbiEnLCBwcm9wLCAnRm91bmQgaW5zdGVhZC4nKTtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIHRoaXMuY2lkID0gXy51bmlxdWVJZCgnY29tcHV0ZWRQcm9wZXR5Jyk7XG4gIHRoaXMubmFtZSA9IG9wdGlvbnMubmFtZTtcbiAgdGhpcy5yZXR1cm5UeXBlID0gbnVsbDtcbiAgdGhpcy5fX29ic2VydmVycyA9IHt9O1xuICB0aGlzLmhlbHBlcnMgPSB7fTtcbiAgdGhpcy53YWl0aW5nID0ge307XG4gIHRoaXMuaXNDaGFuZ2luZyA9IGZhbHNlO1xuICB0aGlzLmlzRGlydHkgPSB0cnVlO1xuICB0aGlzLmZ1bmMgPSBwcm9wO1xuICBfLmJpbmRBbGwodGhpcywgJ29uTW9kaWZ5JywgJ21hcmtEaXJ0eScpO1xuICB0aGlzLmRlcHMgPSBwcm9wZXJ0eUNvbXBpbGVyLmNvbXBpbGUocHJvcCwgdGhpcy5uYW1lKTtcblxuICAvLyBDcmVhdGUgbGluZWFnZSB0byBwYXNzIHRvIG91ciBjYWNoZSBvYmplY3RzXG4gIHZhciBsaW5lYWdlID0ge1xuICAgIHBhcmVudDogdGhpcy5zZXRQYXJlbnQoIG9wdGlvbnMucGFyZW50IHx8IHRoaXMgKSxcbiAgICByb290OiB0aGlzLnNldFJvb3QoIG9wdGlvbnMucm9vdCB8fCBvcHRpb25zLnBhcmVudCB8fCB0aGlzICksXG4gICAgcGF0aDogdGhpcy5fX3BhdGggPSBvcHRpb25zLnBhdGggfHwgdGhpcy5fX3BhdGhcbiAgfTtcblxuICAvLyBSZXN1bHRzIENhY2hlIE9iamVjdHNcbiAgLy8gVGhlc2UgbW9kZWxzIHdpbGwgbmV2ZXIgYmUgcmUtY3JlYXRlZCBmb3IgdGhlIGxpZmV0aW1lIG9mIHRoZSBDb21wdXRlZCBQcm9lcHJ0eVxuICAvLyBPbiBSZWNvbXB1dGUgdGhleSBhcmUgdXBkYXRlZCB3aXRoIG5ldyB2YWx1ZXMuXG4gIC8vIE9uIENoYW5nZSB0aGVpciBuZXcgdmFsdWVzIGFyZSBwdXNoZWQgdG8gdGhlIG9iamVjdCBpdCBpcyB0cmFja2luZ1xuICB0aGlzLmNhY2hlID0ge1xuICAgIG1vZGVsOiBuZXcgUmVib3VuZC5Nb2RlbCh7fSwgbGluZWFnZSksXG4gICAgY29sbGVjdGlvbjogbmV3IFJlYm91bmQuQ29sbGVjdGlvbihbXSwgbGluZWFnZSksXG4gICAgdmFsdWU6IHVuZGVmaW5lZFxuICB9O1xuXG4gIHRoaXMud2lyZSgpO1xuXG59O1xuXG5fLmV4dGVuZChDb21wdXRlZFByb3BlcnR5LnByb3RvdHlwZSwgQmFja2JvbmUuRXZlbnRzLCB7XG5cbiAgaXNDb21wdXRlZFByb3BlcnR5OiB0cnVlLFxuICBpc0RhdGE6IHRydWUsXG4gIF9fcGF0aDogZnVuY3Rpb24oKXsgcmV0dXJuICcnOyB9LFxuXG5cbiAgbWFya0RpcnR5OiBmdW5jdGlvbigpe1xuICAgIGlmKHRoaXMuaXNEaXJ0eSkgcmV0dXJuO1xuICAgIHRoaXMuaXNEaXJ0eSA9IHRydWU7XG4gICAgdGhpcy50cmlnZ2VyKCdkaXJ0eScsIHRoaXMpO1xuICB9LFxuXG4gIC8vIEF0dGFjaGVkIHRvIGxpc3RlbiB0byBhbGwgZXZlbnRzIHdoZXJlIHRoaXMgQ29tcHV0ZWQgUHJvcGVydHkncyBkZXBlbmRhbmNpZXNcbiAgLy8gYXJlIHN0b3JlZC4gU2VlIHdpcmUoKS4gV2lsbCByZS1ldmFsdWF0ZSBhbnkgY29tcHV0ZWQgcHJvcGVydGllcyB0aGF0XG4gIC8vIGRlcGVuZCBvbiB0aGUgY2hhbmdlZCBkYXRhIHZhbHVlIHdoaWNoIHRyaWdnZXJlZCB0aGlzIGNhbGxiYWNrLlxuICBvblJlY29tcHV0ZTogZnVuY3Rpb24odHlwZSwgbW9kZWwsIGNvbGxlY3Rpb24sIG9wdGlvbnMpe1xuICAgIHZhciBzaG9ydGNpcmN1aXQgPSB7IGNoYW5nZTogMSwgc29ydDogMSwgcmVxdWVzdDogMSwgZGVzdHJveTogMSwgc3luYzogMSwgZXJyb3I6IDEsIGludmFsaWQ6IDEsIHJvdXRlOiAxLCBkaXJ0eTogMSB9O1xuICAgIGlmKCBzaG9ydGNpcmN1aXRbdHlwZV0gfHwgIW1vZGVsLmlzRGF0YSApIHJldHVybjtcbiAgICBtb2RlbCB8fCAobW9kZWwgPSB7fSk7XG4gICAgY29sbGVjdGlvbiB8fCAoY29sbGVjdGlvbiA9IHt9KTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHRoaXMuX3RvQ2FsbCB8fCAodGhpcy5fdG9DYWxsID0gW10pO1xuICAgIHRoaXMuX3RvQ2FsbC5hZGRlZCB8fCAodGhpcy5fdG9DYWxsLmFkZGVkID0ge30pO1xuICAgICFjb2xsZWN0aW9uLmlzRGF0YSAmJiAob3B0aW9ucyA9IGNvbGxlY3Rpb24pICYmIChjb2xsZWN0aW9uID0gbW9kZWwpO1xuICAgIHZhciBwdXNoID0gZnVuY3Rpb24oYXJyKXtcbiAgICAgIHZhciBpLCBsZW4gPSBhcnIubGVuZ3RoO1xuICAgICAgdGhpcy5hZGRlZCB8fCAodGhpcy5hZGRlZCA9IHt9KTtcbiAgICAgIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICAgICAgaWYodGhpcy5hZGRlZFthcnJbaV0uY2lkXSkgY29udGludWU7XG4gICAgICAgIHRoaXMuYWRkZWRbYXJyW2ldLmNpZF0gPSAxO1xuICAgICAgICB0aGlzLnB1c2goYXJyW2ldKTtcbiAgICAgIH1cbiAgICB9LCBwYXRoLCB2ZWN0b3I7XG4gICAgdmVjdG9yID0gcGF0aCA9IGNvbGxlY3Rpb24uX19wYXRoKCkucmVwbGFjZSgvXFwuP1xcWy4qXFxdL2lnLCAnLkBlYWNoJyk7XG5cbiAgICAvLyBJZiBhIHJlc2V0IGV2ZW50IG9uIGEgTW9kZWwsIGNoZWNrIGZvciBjb21wdXRlZCBwcm9wZXJ0aWVzIHRoYXQgZGVwZW5kXG4gICAgLy8gb24gZWFjaCBjaGFuZ2VkIGF0dHJpYnV0ZSdzIGZ1bGwgcGF0aC5cbiAgICBpZih0eXBlID09PSAncmVzZXQnICYmIG9wdGlvbnMucHJldmlvdXNBdHRyaWJ1dGVzKXtcbiAgICAgIF8uZWFjaChvcHRpb25zLnByZXZpb3VzQXR0cmlidXRlcywgZnVuY3Rpb24odmFsdWUsIGtleSl7XG4gICAgICAgIHZlY3RvciA9IHBhdGggKyAocGF0aCAmJiAnLicpICsga2V5O1xuICAgICAgICBfLmVhY2godGhpcy5fX2NvbXB1dGVkRGVwcywgZnVuY3Rpb24oZGVwZW5kYW50cywgZGVwZW5kYW5jeSl7XG4gICAgICAgICAgc3RhcnRzV2l0aCh2ZWN0b3IsIGRlcGVuZGFuY3kpICYmIHB1c2guY2FsbCh0aGlzLl90b0NhbGwsIGRlcGVuZGFudHMpO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8vIElmIGEgcmVzZXQgZXZlbnQgb24gYSBDb2xsY3Rpb24sIGNoZWNrIGZvciBjb21wdXRlZCBwcm9wZXJ0aWVzIHRoYXQgZGVwZW5kXG4gICAgLy8gb24gYW55dGhpbmcgaW5zaWRlIHRoYXQgY29sbGVjdGlvbi5cbiAgICBlbHNlIGlmKHR5cGUgPT09ICdyZXNldCcgJiYgb3B0aW9ucy5wcmV2aW91c01vZGVscyl7XG4gICAgICBfLmVhY2godGhpcy5fX2NvbXB1dGVkRGVwcywgZnVuY3Rpb24oZGVwZW5kYW50cywgZGVwZW5kYW5jeSl7XG4gICAgICAgIHN0YXJ0c1dpdGgoZGVwZW5kYW5jeSwgdmVjdG9yKSAmJiBwdXNoLmNhbGwodGhpcy5fdG9DYWxsLCBkZXBlbmRhbnRzKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIC8vIElmIGFuIGFkZCBvciByZW1vdmUgZXZlbnQsIGNoZWNrIGZvciBjb21wdXRlZCBwcm9wZXJ0aWVzIHRoYXQgZGVwZW5kIG9uXG4gICAgLy8gYW55dGhpbmcgaW5zaWRlIHRoYXQgY29sbGVjdGlvbiBvciB0aGF0IGNvbnRhaW5zIHRoYXQgY29sbGVjdGlvbi5cbiAgICBlbHNlIGlmKHR5cGUgPT09ICdhZGQnIHx8IHR5cGUgPT09ICdyZW1vdmUnKXtcbiAgICAgIF8uZWFjaCh0aGlzLl9fY29tcHV0ZWREZXBzLCBmdW5jdGlvbihkZXBlbmRhbnRzLCBkZXBlbmRhbmN5KXtcbiAgICAgICAgaWYoIHN0YXJ0c1dpdGgoZGVwZW5kYW5jeSwgdmVjdG9yKSB8fCBzdGFydHNXaXRoKHZlY3RvciwgZGVwZW5kYW5jeSkgKSBwdXNoLmNhbGwodGhpcy5fdG9DYWxsLCBkZXBlbmRhbnRzKTs7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhIGNoYW5nZSBldmVudCwgdHJpZ2dlciBhbnl0aGluZyB0aGF0IGRlcGVuZHMgb24gdGhhdCBjaGFuZ2VkIHBhdGguXG4gICAgZWxzZSBpZih0eXBlLmluZGV4T2YoJ2NoYW5nZTonKSA9PT0gMCl7XG4gICAgICB2ZWN0b3IgPSB0eXBlLnJlcGxhY2UoJ2NoYW5nZTonLCAnJykucmVwbGFjZSgvXFwuP1xcWy4qXFxdL2lnLCAnLkBlYWNoJyk7XG4gICAgICBfLmVhY2godGhpcy5fX2NvbXB1dGVkRGVwcywgZnVuY3Rpb24oZGVwZW5kYW50cywgZGVwZW5kYW5jeSl7XG4gICAgICAgIHN0YXJ0c1dpdGgodmVjdG9yLCBkZXBlbmRhbmN5KSAmJiBwdXNoLmNhbGwodGhpcy5fdG9DYWxsLCBkZXBlbmRhbnRzKTtcbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cblxuICAgIHZhciBpLCBsZW4gPSB0aGlzLl90b0NhbGwubGVuZ3RoO1xuICAgIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICAgIHRoaXMuX3RvQ2FsbFtpXS5tYXJrRGlydHkoKTtcbiAgICB9XG5cbiAgICAvLyBOb3RpZmllcyBhbGwgY29tcHV0ZWQgcHJvcGVydGllcyBpbiB0aGUgZGVwZW5kYW50cyBhcnJheSB0byByZWNvbXB1dGUuXG4gICAgLy8gTWFya3MgZXZlcnlvbmUgYXMgZGlydHkgYW5kIHRoZW4gY2FsbHMgdGhlbS5cbiAgICBpZighdGhpcy5fcmVjb21wdXRlVGltZW91dCkgdGhpcy5fcmVjb21wdXRlVGltZW91dCA9IHNldFRpbWVvdXQoXy5iaW5kKHJlY29tcHV0ZUNhbGxiYWNrLCB0aGlzKSwgMCk7XG4gICAgcmV0dXJuO1xuICB9LFxuXG5cbiAgLy8gQ2FsbGVkIHdoZW4gYSBDb21wdXRlZCBQcm9wZXJ0eSdzIGFjdGl2ZSBjYWNoZSBvYmplY3QgY2hhbmdlcy5cbiAgLy8gUHVzaGVzIGFueSBjaGFuZ2VzIHRvIENvbXB1dGVkIFByb3BlcnR5IHRoYXQgcmV0dXJucyBhIGRhdGEgb2JqZWN0IGJhY2sgdG9cbiAgLy8gdGhlIG9yaWdpbmFsIG9iamVjdC5cbiAgb25Nb2RpZnk6IGZ1bmN0aW9uKHR5cGUsIG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKXtcbiAgICB2YXIgc2hvcnRjaXJjdWl0ID0geyBzb3J0OiAxLCByZXF1ZXN0OiAxLCBkZXN0cm95OiAxLCBzeW5jOiAxLCBlcnJvcjogMSwgaW52YWxpZDogMSwgcm91dGU6IDEgfTtcbiAgICBpZiggIXRoaXMudHJhY2tpbmcgfHwgc2hvcnRjaXJjdWl0W3R5cGVdIHx8IH50eXBlLmluZGV4T2YoJ2NoYW5nZTonKSApIHJldHVybjtcbiAgICBtb2RlbCB8fCAobW9kZWwgPSB7fSk7XG4gICAgY29sbGVjdGlvbiB8fCAoY29sbGVjdGlvbiA9IHt9KTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgICFjb2xsZWN0aW9uLmlzRGF0YSAmJiBfLmlzT2JqZWN0KGNvbGxlY3Rpb24pICYmIChvcHRpb25zID0gY29sbGVjdGlvbikgJiYgKGNvbGxlY3Rpb24gPSBtb2RlbCk7XG4gICAgdmFyIHNyYyA9IHRoaXM7XG4gICAgdmFyIHBhdGggPSBjb2xsZWN0aW9uLl9fcGF0aCgpLnJlcGxhY2Uoc3JjLl9fcGF0aCgpLCAnJykucmVwbGFjZSgvXlxcLi8sICcnKTtcbiAgICB2YXIgZGVzdCA9IHRoaXMudHJhY2tpbmcuZ2V0KHBhdGgpO1xuXG4gICAgaWYoXy5pc1VuZGVmaW5lZChkZXN0KSkgcmV0dXJuO1xuICAgIGlmKHR5cGUgPT09ICdjaGFuZ2UnKSBkZXN0LnNldCAmJiBkZXN0LnNldChtb2RlbC5jaGFuZ2VkQXR0cmlidXRlcygpKTtcbiAgICBlbHNlIGlmKHR5cGUgPT09ICdyZXNldCcpIGRlc3QucmVzZXQgJiYgZGVzdC5yZXNldChtb2RlbCk7XG4gICAgZWxzZSBpZih0eXBlID09PSAnYWRkJykgIGRlc3QuYWRkICYmIGRlc3QuYWRkKG1vZGVsKTtcbiAgICBlbHNlIGlmKHR5cGUgPT09ICdyZW1vdmUnKSAgZGVzdC5yZW1vdmUgJiYgZGVzdC5yZW1vdmUobW9kZWwpO1xuICAgIC8vIFRPRE86IEFkZCBzb3J0XG4gIH0sXG5cbiAgLy8gQWRkcyBhIGxpdGVuZXIgdG8gdGhlIHJvb3Qgb2JqZWN0IGFuZCB0ZWxscyBpdCB3aGF0IHByb3BlcnRpZXMgdGhpc1xuICAvLyBDb21wdXRlZCBQcm9wZXJ0eSBkZXBlbmQgb24uXG4gIC8vIFRoZSBsaXN0ZW5lciB3aWxsIHJlLWNvbXB1dGUgdGhpcyBDb21wdXRlZCBQcm9wZXJ0eSB3aGVuIGFueSBhcmUgY2hhbmdlZC5cbiAgd2lyZTogZnVuY3Rpb24oKXtcbiAgICB2YXIgcm9vdCA9IHRoaXMuX19yb290X187XG4gICAgdmFyIGNvbnRleHQgPSB0aGlzLl9fcGFyZW50X187XG4gICAgcm9vdC5fX2NvbXB1dGVkRGVwcyB8fCAocm9vdC5fX2NvbXB1dGVkRGVwcyA9IHt9KTtcblxuICAgIF8uZWFjaCh0aGlzLmRlcHMsIGZ1bmN0aW9uKHBhdGgpe1xuICAgICAgdmFyIGRlcCA9IHJvb3QuZ2V0KHBhdGgsIHtyYXc6IHRydWV9KTtcbiAgICAgIGlmKCFkZXAgfHwgIWRlcC5pc0NvbXB1dGVkUHJvcGVydHkpIHJldHVybjtcbiAgICAgIGRlcC5vbignZGlydHknLCB0aGlzLm1hcmtEaXJ0eSk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICBfLmVhY2godGhpcy5kZXBzLCBmdW5jdGlvbihwYXRoKXtcbiAgICAgIC8vIEZpbmQgYWN0dWFsIHBhdGggZnJvbSByZWxhdGl2ZSBwYXRoc1xuICAgICAgdmFyIHNwbGl0ID0gJC5zcGxpdFBhdGgocGF0aCk7XG4gICAgICB3aGlsZShzcGxpdFswXSA9PT0gJ0BwYXJlbnQnKXtcbiAgICAgICAgY29udGV4dCA9IGNvbnRleHQuX19wYXJlbnRfXztcbiAgICAgICAgc3BsaXQuc2hpZnQoKTtcbiAgICAgIH1cblxuICAgICAgcGF0aCA9IGNvbnRleHQuX19wYXRoKCkucmVwbGFjZSgvXFwuP1xcWy4qXFxdL2lnLCAnLkBlYWNoJyk7XG4gICAgICBwYXRoID0gcGF0aCArIChwYXRoICYmICcuJykgKyBzcGxpdC5qb2luKCcuJyk7XG5cbiAgICAgIC8vIEFkZCBvdXJzZWx2ZXMgYXMgZGVwZW5kYW50c1xuICAgICAgcm9vdC5fX2NvbXB1dGVkRGVwc1twYXRoXSB8fCAocm9vdC5fX2NvbXB1dGVkRGVwc1twYXRoXSA9IFtdKTtcbiAgICAgIHJvb3QuX19jb21wdXRlZERlcHNbcGF0aF0ucHVzaCh0aGlzKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIC8vIEVuc3VyZSB3ZSBvbmx5IGhhdmUgb25lIGxpc3RlbmVyIHBlciBNb2RlbCBhdCBhIHRpbWUuXG4gICAgY29udGV4dC5vZmYoJ2FsbCcsIHRoaXMub25SZWNvbXB1dGUpLm9uKCdhbGwnLCB0aGlzLm9uUmVjb21wdXRlKTtcbiAgfSxcblxuICAvLyBDYWxsIHRoaXMgY29tcHV0ZWQgcHJvcGVydHkgbGlrZSB5b3Ugd291bGQgd2l0aCBGdW5jdGlvbi5jYWxsKClcbiAgY2FsbDogZnVuY3Rpb24oKXtcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgIGNvbnRleHQgPSBhcmdzLnNoaWZ0KCk7XG4gICAgcmV0dXJuIHRoaXMuYXBwbHkoY29udGV4dCwgYXJncyk7XG4gIH0sXG5cbiAgLy8gQ2FsbCB0aGlzIGNvbXB1dGVkIHByb3BlcnR5IGxpa2UgeW91IHdvdWxkIHdpdGggRnVuY3Rpb24uYXBwbHkoKVxuICAvLyBPbmx5IHByb3BlcnRpZXMgdGhhdCBhcmUgbWFya2VkIGFzIGRpcnR5IGFuZCBhcmUgbm90IGFscmVhZHkgY29tcHV0aW5nXG4gIC8vIHRoZW1zZWx2ZXMgYXJlIGV2YWx1YXRlZCB0byBwcmV2ZW50IGN5Y2xpYyBjYWxsYmFja3MuIElmIGFueSBkZXBlbmRhbnRzXG4gIC8vIGFyZW4ndCBmaW5pc2hlZCBjb21wdXRlZGluZywgd2UgYWRkIG91cnNlbHZlZCB0byB0aGVpciB3YWl0aW5nIGxpc3QuXG4gIC8vIFZhbmlsbGEgb2JqZWN0cyByZXR1cm5lZCBmcm9tIHRoZSBmdW5jdGlvbiBhcmUgcHJvbW90ZWQgdG8gUmVib3VuZCBPYmplY3RzLlxuICAvLyBUaGVuLCBzZXQgdGhlIHByb3BlciByZXR1cm4gdHlwZSBmb3IgZnV0dXJlIGZldGNoZXMgZnJvbSB0aGUgY2FjaGUgYW5kIHNldFxuICAvLyB0aGUgbmV3IGNvbXB1dGVkIHZhbHVlLiBUcmFjayBjaGFuZ2VzIHRvIHRoZSBjYWNoZSB0byBwdXNoIGl0IGJhY2sgdXAgdG9cbiAgLy8gdGhlIG9yaWdpbmFsIG9iamVjdCBhbmQgcmV0dXJuIHRoZSB2YWx1ZS5cbiAgYXBwbHk6IGZ1bmN0aW9uKGNvbnRleHQsIHBhcmFtcyl7XG5cbiAgICBpZighdGhpcy5pc0RpcnR5IHx8IHRoaXMuaXNDaGFuZ2luZykgcmV0dXJuO1xuICAgIHRoaXMuaXNDaGFuZ2luZyA9IHRydWU7XG5cbiAgICB2YXIgdmFsdWUgPSB0aGlzLmNhY2hlW3RoaXMucmV0dXJuVHlwZV0sXG4gICAgICAgIHJlc3VsdDtcblxuICAgIGNvbnRleHQgfHwgKGNvbnRleHQgPSB0aGlzLl9fcGFyZW50X18pO1xuXG4gICAgLy8gQ2hlY2sgYWxsIG9mIG91ciBkZXBlbmRhbmNpZXMgdG8gc2VlIGlmIHRoZXkgYXJlIGV2YWx1YXRpbmcuXG4gICAgLy8gSWYgd2UgaGF2ZSBhIGRlcGVuZGFuY3kgdGhhdCBpcyBkaXJ0eSBhbmQgdGhpcyBpc250IGl0cyBmaXJzdCBydW4sXG4gICAgLy8gTGV0IHRoaXMgZGVwZW5kYW5jeSBrbm93IHRoYXQgd2UgYXJlIHdhaXRpbmcgZm9yIGl0LlxuICAgIC8vIEl0IHdpbGwgcmUtcnVuIHRoaXMgQ29tcHV0ZWQgUHJvcGVydHkgYWZ0ZXIgaXQgZmluaXNoZXMuXG4gICAgXy5lYWNoKHRoaXMuZGVwcywgZnVuY3Rpb24oZGVwKXtcbiAgICAgIHZhciBkZXBlbmRhbmN5ID0gY29udGV4dC5nZXQoZGVwLCB7cmF3OiB0cnVlfSk7XG4gICAgICBpZighZGVwZW5kYW5jeSB8fCAhZGVwZW5kYW5jeS5pc0NvbXB1dGVkUHJvcGVydHkpIHJldHVybjtcbiAgICAgIGlmKGRlcGVuZGFuY3kuaXNEaXJ0eSAmJiBkZXBlbmRhbmN5LnJldHVyblR5cGUgIT09IG51bGwpe1xuICAgICAgICBkZXBlbmRhbmN5LndhaXRpbmdbdGhpcy5jaWRdID0gdGhpcztcbiAgICAgICAgZGVwZW5kYW5jeS5hcHBseSgpOyAvLyBUcnkgdG8gcmUtZXZhbHVhdGUgdGhpcyBkZXBlbmRhbmN5IGlmIGl0IGlzIGRpcnR5XG4gICAgICAgIGlmKGRlcGVuZGFuY3kuaXNEaXJ0eSkgcmV0dXJuIHRoaXMuaXNDaGFuZ2luZyA9IGZhbHNlO1xuICAgICAgfVxuICAgICAgZGVsZXRlIGRlcGVuZGFuY3kud2FpdGluZ1t0aGlzLmNpZF07XG4gICAgICAvLyBUT0RPOiBUaGVyZSBjYW4gYmUgYSBjaGVjayBoZXJlIGxvb2tpbmcgZm9yIGN5Y2xpYyBkZXBlbmRhbmNpZXMuXG4gICAgfSwgdGhpcyk7XG5cbiAgICBpZighdGhpcy5pc0NoYW5naW5nKSByZXR1cm47XG5cbiAgICB0aGlzLnN0b3BMaXN0ZW5pbmcodmFsdWUsICdhbGwnLCB0aGlzLm9uTW9kaWZ5KTtcblxuICAgIHJlc3VsdCA9IHRoaXMuZnVuYy5hcHBseShjb250ZXh0LCBwYXJhbXMpO1xuXG4gICAgLy8gUHJvbW90ZSB2YW5pbGxhIG9iamVjdHMgdG8gUmVib3VuZCBEYXRhIGtlZXBpbmcgdGhlIHNhbWUgb3JpZ2luYWwgb2JqZWN0c1xuICAgIGlmKF8uaXNBcnJheShyZXN1bHQpKSByZXN1bHQgPSBuZXcgUmVib3VuZC5Db2xsZWN0aW9uKHJlc3VsdCwge2Nsb25lOiBmYWxzZX0pO1xuICAgIGVsc2UgaWYoXy5pc09iamVjdChyZXN1bHQpICYmICFyZXN1bHQuaXNEYXRhKSByZXN1bHQgPSBuZXcgUmVib3VuZC5Nb2RlbChyZXN1bHQsIHtjbG9uZTogZmFsc2V9KTtcblxuICAgIC8vIElmIHJlc3VsdCBpcyB1bmRlZmluZWQsIHJlc2V0IG91ciBjYWNoZSBpdGVtXG4gICAgaWYoXy5pc1VuZGVmaW5lZChyZXN1bHQpIHx8IF8uaXNOdWxsKHJlc3VsdCkpe1xuICAgICAgdGhpcy5yZXR1cm5UeXBlID0gJ3ZhbHVlJztcbiAgICAgIHRoaXMuaXNDb2xsZWN0aW9uID0gdGhpcy5pc01vZGVsID0gZmFsc2U7XG4gICAgICB0aGlzLnNldCh1bmRlZmluZWQpO1xuICAgIH1cbiAgICAvLyBTZXQgcmVzdWx0IGFuZCByZXR1cm4gdHlwZXMsIGJpbmQgZXZlbnRzXG4gICAgZWxzZSBpZihyZXN1bHQuaXNDb2xsZWN0aW9uKXtcbiAgICAgIHRoaXMucmV0dXJuVHlwZSA9ICdjb2xsZWN0aW9uJztcbiAgICAgIHRoaXMuaXNDb2xsZWN0aW9uID0gdHJ1ZTtcbiAgICAgIHRoaXMuaXNNb2RlbCA9IGZhbHNlO1xuICAgICAgdGhpcy5zZXQocmVzdWx0KTtcbiAgICAgIHRoaXMudHJhY2socmVzdWx0KTtcbiAgICB9XG4gICAgZWxzZSBpZihyZXN1bHQuaXNNb2RlbCl7XG4gICAgICB0aGlzLnJldHVyblR5cGUgPSAnbW9kZWwnO1xuICAgICAgdGhpcy5pc0NvbGxlY3Rpb24gPSBmYWxzZTtcbiAgICAgIHRoaXMuaXNNb2RlbCA9IHRydWU7XG4gICAgICB0aGlzLnJlc2V0KHJlc3VsdCk7XG4gICAgICB0aGlzLnRyYWNrKHJlc3VsdCk7XG4gICAgfVxuICAgIGVsc2V7XG4gICAgICB0aGlzLnJldHVyblR5cGUgPSAndmFsdWUnO1xuICAgICAgdGhpcy5pc0NvbGxlY3Rpb24gPSB0aGlzLmlzTW9kZWwgPSBmYWxzZTtcbiAgICAgIHRoaXMucmVzZXQocmVzdWx0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy52YWx1ZSgpO1xuICB9LFxuXG4gIC8vIFdoZW4gd2UgcmVjZWl2ZSBhIG5ldyBtb2RlbCB0byBzZXQgaW4gb3VyIGNhY2hlLCB1bmJpbmQgdGhlIHRyYWNrZXIgZnJvbVxuICAvLyB0aGUgcHJldmlvdXMgY2FjaGUgb2JqZWN0LCBzeW5jIHRoZSBvYmplY3RzJyBjaWRzIHNvIGhlbHBlcnMgdGhpbmsgdGhleVxuICAvLyBhcmUgdGhlIHNhbWUgb2JqZWN0LCBzYXZlIGEgcmVmZXJhbmNlIHRvIHRoZSBvYmplY3Qgd2UgYXJlIHRyYWNraW5nLFxuICAvLyBhbmQgcmUtYmluZCBvdXIgb25Nb2RpZnkgaG9vay5cbiAgdHJhY2s6IGZ1bmN0aW9uKG9iamVjdCl7XG4gICAgdmFyIHRhcmdldCA9IHRoaXMudmFsdWUoKTtcbiAgICBpZighb2JqZWN0IHx8ICF0YXJnZXQgfHwgIXRhcmdldC5pc0RhdGEgfHwgIW9iamVjdC5pc0RhdGEpIHJldHVybjtcbiAgICB0YXJnZXQuX2NpZCB8fCAodGFyZ2V0Ll9jaWQgPSB0YXJnZXQuY2lkKTtcbiAgICBvYmplY3QuX2NpZCB8fCAob2JqZWN0Ll9jaWQgPSBvYmplY3QuY2lkKTtcbiAgICB0YXJnZXQuY2lkID0gb2JqZWN0LmNpZDtcbiAgICB0aGlzLnRyYWNraW5nID0gb2JqZWN0O1xuICAgIHRoaXMubGlzdGVuVG8odGFyZ2V0LCAnYWxsJywgdGhpcy5vbk1vZGlmeSk7XG4gIH0sXG5cbiAgLy8gR2V0IGZyb20gdGhlIENvbXB1dGVkIFByb3BlcnR5J3MgY2FjaGVcbiAgZ2V0OiBmdW5jdGlvbihrZXksIG9wdGlvbnMpe1xuICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWUoKTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIGlmKHRoaXMucmV0dXJuVHlwZSA9PT0gJ3ZhbHVlJykgcmV0dXJuIGNvbnNvbGUuZXJyb3IoJ0NhbGxlZCBnZXQgb24gdGhlIGAnKyB0aGlzLm5hbWUgKydgIGNvbXB1dGVkIHByb3BlcnR5IHdoaWNoIHJldHVybnMgYSBwcmltaXRpdmUgdmFsdWUuJyk7XG4gICAgcmV0dXJuIHZhbHVlLmdldChrZXksIG9wdGlvbnMpO1xuICB9LFxuXG4gIC8vIFNldCB0aGUgQ29tcHV0ZWQgUHJvcGVydHkncyBjYWNoZSB0byBhIG5ldyB2YWx1ZSBhbmQgdHJpZ2dlciBhcHByb3ByZWF0ZSBldmVudHMuXG4gIC8vIENoYW5nZXMgd2lsbCBwcm9wYWdhdGUgYmFjayB0byB0aGUgb3JpZ2luYWwgb2JqZWN0IGlmIGEgUmVib3VuZCBEYXRhIE9iamVjdCBhbmQgcmUtY29tcHV0ZS5cbiAgLy8gSWYgQ29tcHV0ZWQgUHJvcGVydHkgcmV0dXJucyBhIHZhbHVlLCBhbGwgZG93bnN0cmVhbSBkZXBlbmRhbmNpZXMgd2lsbCByZS1jb21wdXRlLlxuICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsLCBvcHRpb25zKXtcbiAgICBpZih0aGlzLnJldHVyblR5cGUgPT09IG51bGwpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgYXR0cnMgPSBrZXk7XG4gICAgdmFyIHZhbHVlID0gdGhpcy52YWx1ZSgpO1xuICAgIGlmKHRoaXMucmV0dXJuVHlwZSA9PT0gJ21vZGVsJyl7XG4gICAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgYXR0cnMgPSAoa2V5LmlzTW9kZWwpID8ga2V5LmF0dHJpYnV0ZXMgOiBrZXk7XG4gICAgICAgIG9wdGlvbnMgPSB2YWw7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAoYXR0cnMgPSB7fSlba2V5XSA9IHZhbDtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYodGhpcy5yZXR1cm5UeXBlICE9PSAnbW9kZWwnKSBvcHRpb25zID0gdmFsIHx8IHt9O1xuICAgIGF0dHJzID0gKGF0dHJzICYmIGF0dHJzLmlzQ29tcHV0ZWRQcm9wZXJ0eSkgPyBhdHRycy52YWx1ZSgpIDogYXR0cnM7XG5cbiAgICAvLyBJZiBhIG5ldyB2YWx1ZSwgc2V0IGl0IGFuZCB0cmlnZ2VyIGV2ZW50c1xuICAgIGlmKHRoaXMucmV0dXJuVHlwZSA9PT0gJ3ZhbHVlJyAmJiB0aGlzLmNhY2hlLnZhbHVlICE9PSBhdHRycyl7XG4gICAgICB0aGlzLmNhY2hlLnZhbHVlID0gYXR0cnM7XG4gICAgICBpZighb3B0aW9ucy5xdWlldCl7XG4gICAgICAgIC8vIElmIHNldCB3YXMgY2FsbGVkIG5vdCB0aHJvdWdoIGNvbXB1dGVkUHJvcGVydHkuY2FsbCgpLCB0aGlzIGlzIGEgZnJlc2ggbmV3IGV2ZW50IGJ1cnN0LlxuICAgICAgICBpZighdGhpcy5pc0RpcnR5ICYmICF0aGlzLmlzQ2hhbmdpbmcpIHRoaXMuX19wYXJlbnRfXy5jaGFuZ2VkID0ge307XG4gICAgICAgIHRoaXMuX19wYXJlbnRfXy5jaGFuZ2VkW3RoaXMubmFtZV0gPSBhdHRycztcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2UnLCB0aGlzLl9fcGFyZW50X18pO1xuICAgICAgICB0aGlzLnRyaWdnZXIoJ2NoYW5nZTonK3RoaXMubmFtZSwgdGhpcy5fX3BhcmVudF9fLCBhdHRycyk7XG4gICAgICAgIGRlbGV0ZSB0aGlzLl9fcGFyZW50X18uY2hhbmdlZFt0aGlzLm5hbWVdO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmKHRoaXMucmV0dXJuVHlwZSAhPT0gJ3ZhbHVlJyAmJiBvcHRpb25zLnJlc2V0KSBrZXkgPSB2YWx1ZS5yZXNldChhdHRycywgb3B0aW9ucyk7XG4gICAgZWxzZSBpZih0aGlzLnJldHVyblR5cGUgIT09ICd2YWx1ZScpIGtleSA9IHZhbHVlLnNldChhdHRycywgb3B0aW9ucyk7XG4gICAgdGhpcy5pc0RpcnR5ID0gdGhpcy5pc0NoYW5naW5nID0gZmFsc2U7XG5cbiAgICAvLyBDYWxsIGFsbCByZWFtaW5pbmcgY29tcHV0ZWQgcHJvcGVydGllcyB3YWl0aW5nIGZvciB0aGlzIHZhbHVlIHRvIHJlc29sdmUuXG4gICAgXy5lYWNoKHRoaXMud2FpdGluZywgZnVuY3Rpb24ocHJvcCl7IHByb3AgJiYgcHJvcC5jYWxsKCk7IH0pO1xuXG4gICAgcmV0dXJuIGtleTtcbiAgfSxcblxuICAvLyBSZXR1cm4gdGhlIGN1cnJlbnQgdmFsdWUgZnJvbSB0aGUgY2FjaGUsIHJ1bm5pbmcgaWYgZGlydHkuXG4gIHZhbHVlOiBmdW5jdGlvbigpe1xuICAgIGlmKHRoaXMuaXNEaXJ0eSkgdGhpcy5hcHBseSgpO1xuICAgIHJldHVybiB0aGlzLmNhY2hlW3RoaXMucmV0dXJuVHlwZV07XG4gIH0sXG5cbiAgLy8gUmVzZXQgdGhlIGN1cnJlbnQgdmFsdWUgaW4gdGhlIGNhY2hlLCBydW5uaW5nIGlmIGZpcnN0IHJ1bi5cbiAgcmVzZXQ6IGZ1bmN0aW9uKG9iaiwgb3B0aW9ucyl7XG4gICAgaWYoXy5pc051bGwodGhpcy5yZXR1cm5UeXBlKSkgcmV0dXJuOyAvLyBGaXJzdCBydW5cbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIG9wdGlvbnMucmVzZXQgPSB0cnVlO1xuICAgIHJldHVybiAgdGhpcy5zZXQob2JqLCBvcHRpb25zKTtcbiAgfSxcblxuICAvLyBDeWNsaWMgZGVwZW5kYW5jeSBzYWZlIHRvSlNPTiBtZXRob2QuXG4gIHRvSlNPTjogZnVuY3Rpb24oKSB7XG4gICAgaWYgKHRoaXMuX2lzU2VyaWFsaXppbmcpIHJldHVybiB0aGlzLmNpZDtcbiAgICB2YXIgdmFsID0gdGhpcy52YWx1ZSgpO1xuICAgIHRoaXMuX2lzU2VyaWFsaXppbmcgPSB0cnVlO1xuICAgIHZhciBqc29uID0gKHZhbCAmJiBfLmlzRnVuY3Rpb24odmFsLnRvSlNPTikpID8gdmFsLnRvSlNPTigpIDogdmFsO1xuICAgIHRoaXMuX2lzU2VyaWFsaXppbmcgPSBmYWxzZTtcbiAgICByZXR1cm4ganNvbjtcbiAgfVxuXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgQ29tcHV0ZWRQcm9wZXJ0eTtcbiIsIi8vIFJlYm91bmQgSG9va3Ncbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IExhenlWYWx1ZSBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvbGF6eS12YWx1ZVwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5pbXBvcnQgaGVscGVycyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaGVscGVyc1wiO1xuXG52YXIgaG9va3MgPSB7fSxcbiAgICBhdHRyaWJ1dGVzID0geyAgYWJicjogMSwgICAgICBcImFjY2VwdC1jaGFyc2V0XCI6IDEsICAgYWNjZXB0OiAxLCAgICAgIGFjY2Vzc2tleTogMSwgICAgIGFjdGlvbjogMSxcbiAgICAgICAgICAgICAgICAgICAgYWxpZ246IDEsICAgICAgYWxpbms6IDEsICAgICAgICAgICAgIGFsdDogMSwgICAgICAgICBhcmNoaXZlOiAxLCAgICAgICBheGlzOiAxLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZ3JvdW5kOiAxLCBiZ2NvbG9yOiAxLCAgICAgICAgICAgYm9yZGVyOiAxLCAgICAgIGNlbGxwYWRkaW5nOiAxLCAgIGNlbGxzcGFjaW5nOiAxLFxuICAgICAgICAgICAgICAgICAgICBjaGFyOiAxLCAgICAgICBjaGFyb2ZmOiAxLCAgICAgICAgICAgY2hhcnNldDogMSwgICAgIGNoZWNrZWQ6IDEsICAgICAgIGNpdGU6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNsYXNzOiAxLCAgICAgIGNsYXNzaWQ6IDEsICAgICAgICAgICBjbGVhcjogMSwgICAgICAgY29kZTogMSwgICAgICAgICAgY29kZWJhc2U6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNvZGV0eXBlOiAxLCAgIGNvbG9yOiAxLCAgICAgICAgICAgICBjb2xzOiAxLCAgICAgICAgY29sc3BhbjogMSwgICAgICAgY29tcGFjdDogMSxcbiAgICAgICAgICAgICAgICAgICAgY29udGVudDogMSwgICAgY29vcmRzOiAxLCAgICAgICAgICAgIGRhdGE6IDEsICAgICAgICBkYXRldGltZTogMSwgICAgICBkZWNsYXJlOiAxLFxuICAgICAgICAgICAgICAgICAgICBkZWZlcjogMSwgICAgICBkaXI6IDEsICAgICAgICAgICAgICAgZGlzYWJsZWQ6IDEsICAgIGVuY3R5cGU6IDEsICAgICAgIGZhY2U6IDEsXG4gICAgICAgICAgICAgICAgICAgIGZvcjogMSwgICAgICAgIGZyYW1lOiAxLCAgICAgICAgICAgICBmcmFtZWJvcmRlcjogMSwgaGVhZGVyczogMSwgICAgICAgaGVpZ2h0OiAxLFxuICAgICAgICAgICAgICAgICAgICBocmVmOiAxLCAgICAgICBocmVmbGFuZzogMSwgICAgICAgICAgaHNwYWNlOiAxLCAgICAgXCJodHRwLWVxdWl2XCI6IDEsICAgaWQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIGlzbWFwOiAxLCAgICAgIGxhYmVsOiAxLCAgICAgICAgICAgICBsYW5nOiAxLCAgICAgICAgbGFuZ3VhZ2U6IDEsICAgICAgbGluazogMSxcbiAgICAgICAgICAgICAgICAgICAgbG9uZ2Rlc2M6IDEsICAgbWFyZ2luaGVpZ2h0OiAxLCAgICAgIG1hcmdpbndpZHRoOiAxLCBtYXhsZW5ndGg6IDEsICAgICBtZWRpYTogMSxcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAxLCAgICAgbXVsdGlwbGU6IDEsICAgICAgICAgIG5hbWU6IDEsICAgICAgICBub2hyZWY6IDEsICAgICAgICBub3Jlc2l6ZTogMSxcbiAgICAgICAgICAgICAgICAgICAgbm9zaGFkZTogMSwgICAgbm93cmFwOiAxLCAgICAgICAgICAgIG9iamVjdDogMSwgICAgICBvbmJsdXI6IDEsICAgICAgICBvbmNoYW5nZTogMSxcbiAgICAgICAgICAgICAgICAgICAgb25jbGljazogMSwgICAgb25kYmxjbGljazogMSwgICAgICAgIG9uZm9jdXM6IDEsICAgICBvbmtleWRvd246IDEsICAgICBvbmtleXByZXNzOiAxLFxuICAgICAgICAgICAgICAgICAgICBvbmtleXVwOiAxLCAgICBvbmxvYWQ6IDEsICAgICAgICAgICAgb25tb3VzZWRvd246IDEsIG9ubW91c2Vtb3ZlOiAxLCAgIG9ubW91c2VvdXQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIG9ubW91c2VvdmVyOiAxLG9ubW91c2V1cDogMSwgICAgICAgICBvbnJlc2V0OiAxLCAgICAgb25zZWxlY3Q6IDEsICAgICAgb25zdWJtaXQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIG9udW5sb2FkOiAxLCAgIHByb2ZpbGU6IDEsICAgICAgICAgICBwcm9tcHQ6IDEsICAgICAgcmVhZG9ubHk6IDEsICAgICAgcmVsOiAxLFxuICAgICAgICAgICAgICAgICAgICByZXY6IDEsICAgICAgICByb3dzOiAxLCAgICAgICAgICAgICAgcm93c3BhbjogMSwgICAgIHJ1bGVzOiAxLCAgICAgICAgIHNjaGVtZTogMSxcbiAgICAgICAgICAgICAgICAgICAgc2NvcGU6IDEsICAgICAgc2Nyb2xsaW5nOiAxLCAgICAgICAgIHNlbGVjdGVkOiAxLCAgICBzaGFwZTogMSwgICAgICAgICBzaXplOiAxLFxuICAgICAgICAgICAgICAgICAgICBzcGFuOiAxLCAgICAgICBzcmM6IDEsICAgICAgICAgICAgICAgc3RhbmRieTogMSwgICAgIHN0YXJ0OiAxLCAgICAgICAgIHN0eWxlOiAxLFxuICAgICAgICAgICAgICAgICAgICBzdW1tYXJ5OiAxLCAgICB0YWJpbmRleDogMSwgICAgICAgICAgdGFyZ2V0OiAxLCAgICAgIHRleHQ6IDEsICAgICAgICAgIHRpdGxlOiAxLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAxLCAgICAgICB1c2VtYXA6IDEsICAgICAgICAgICAgdmFsaWduOiAxLCAgICAgIHZhbHVlOiAxLCAgICAgICAgIHZhbHVldHlwZTogMSxcbiAgICAgICAgICAgICAgICAgICAgdmVyc2lvbjogMSwgICAgdmxpbms6IDEsICAgICAgICAgICAgIHZzcGFjZTogMSwgICAgICB3aWR0aDogMSAgfTtcblxuXG4vKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuICAgICAgICBIb29rIFV0aWxzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLy8gR2l2ZW4gYW4gb2JqZWN0IChjb250ZXh0KSBhbmQgYSBwYXRoLCBjcmVhdGUgYSBMYXp5VmFsdWUgb2JqZWN0IHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2Ygb2JqZWN0IGF0IGNvbnRleHQgYW5kIGFkZCBpdCBhcyBhbiBvYnNlcnZlciBvZiB0aGUgY29udGV4dC5cbmZ1bmN0aW9uIHN0cmVhbVByb3BlcnR5KGNvbnRleHQsIHBhdGgpIHtcblxuICAvLyBMYXp5IHZhbHVlIHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2YgY29udGV4dC5wYXRoXG4gIHZhciBsYXp5VmFsdWUgPSBuZXcgTGF6eVZhbHVlKGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBjb250ZXh0LmdldChwYXRoKTtcbiAgfSwge2NvbnRleHQ6IGNvbnRleHR9KTtcblxuICAvLyBTYXZlIG91ciBwYXRoIHNvIHBhcmVudCBsYXp5dmFsdWVzIGNhbiBrbm93IHRoZSBkYXRhIHZhciBvciBoZWxwZXIgdGhleSBhcmUgZ2V0dGluZyBpbmZvIGZyb21cbiAgbGF6eVZhbHVlLnBhdGggPSBwYXRoO1xuXG4gIC8vIFNhdmUgdGhlIG9ic2VydmVyIGF0IHRoaXMgcGF0aFxuICBsYXp5VmFsdWUuYWRkT2JzZXJ2ZXIocGF0aCwgY29udGV4dCk7XG5cbiAgcmV0dXJuIGxhenlWYWx1ZTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0SGVscGVyKGVsLCBwYXRoLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudiwgaGVscGVyKSB7XG4gIHZhciBsYXp5VmFsdWU7XG5cbiAgLy8gRXh0ZW5kIG9wdGlvbnMgd2l0aCB0aGUgaGVscGVyJ3MgY29udGFpbmVpbmcgTW9ycGggZWxlbWVudC4gVXNlZCBieSBzdHJlYW1pZnkgdG8gdHJhY2sgZGF0YSBvYnNlcnZlcnNcbiAgb3B0aW9ucy5tb3JwaCA9IG9wdGlvbnMucGxhY2Vob2xkZXIgPSBlbCAmJiAhZWwudGFnTmFtZSAmJiBlbCB8fCBmYWxzZTsgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5lbGVtZW50ID0gZWwgJiYgZWwudGFnTmFtZSAmJiBlbCB8fCBmYWxzZTsgICAgICAvLyBGSVhNRTogdGhpcyBraW5kYSBzdWNrc1xuXG4gIC8vIEV4dGVuZCBvcHRpb25zIHdpdGggaG9va3MgYW5kIGhlbHBlcnMgZm9yIGFueSBzdWJzZXF1ZW50IGNhbGxzIGZyb20gYSBsYXp5dmFsdWVcbiAgb3B0aW9ucy5wYXJhbXMgPSBwYXJhbXM7ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5ob29rcyA9IGVudi5ob29rczsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5oZWxwZXJzID0gZW52LmhlbHBlcnM7ICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5jb250ZXh0ID0gY29udGV4dDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5kb20gPSBlbnYuZG9tOyAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5wYXRoID0gcGF0aDsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcbiAgb3B0aW9ucy5oYXNoID0gaGFzaCB8fCBbXTsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRklYTUU6IHRoaXMga2luZGEgc3Vja3NcblxuICAvLyBDcmVhdGUgYSBsYXp5IHZhbHVlIHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2Ygb3VyIGV2YWx1YXRlZCBoZWxwZXIuXG4gIG9wdGlvbnMubGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpIHtcbiAgICB2YXIgcGxhaW5QYXJhbXMgPSBbXSxcbiAgICAgICAgcGxhaW5IYXNoID0ge30sXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgcmVscGF0aCA9ICQuc3BsaXRQYXRoKHBhdGgpLFxuICAgICAgICBmaXJzdCwgcmVzdDtcbiAgICAgICAgcmVscGF0aC5zaGlmdCgpO1xuICAgICAgICByZWxwYXRoID0gcmVscGF0aC5qb2luKCcuJyk7XG5cbiAgICAgICAgcmVzdCA9ICQuc3BsaXRQYXRoKHJlbHBhdGgpO1xuICAgICAgICBmaXJzdCA9IHJlc3Quc2hpZnQoKTtcbiAgICAgICAgcmVzdCA9IHJlc3Quam9pbignLicpO1xuXG4gICAgLy8gQXNzZW1ibGUgb3VyIGFyZ3MgYW5kIGhhc2ggdmFyaWFibGVzLiBGb3IgZWFjaCBsYXp5dmFsdWUgcGFyYW0sIHB1c2ggdGhlIGxhenlWYWx1ZSdzIHZhbHVlIHNvIGhlbHBlcnMgd2l0aCBubyBjb25jZXB0IG9mIGxhenl2YWx1ZXMuXG4gICAgXy5lYWNoKHBhcmFtcywgZnVuY3Rpb24ocGFyYW0sIGluZGV4KXtcbiAgICAgIHBsYWluUGFyYW1zLnB1c2goKCAocGFyYW0gJiYgcGFyYW0uaXNMYXp5VmFsdWUpID8gcGFyYW0udmFsdWUoKSA6IHBhcmFtICkpO1xuICAgIH0pO1xuICAgIF8uZWFjaChoYXNoLCBmdW5jdGlvbihoYXNoLCBrZXkpe1xuICAgICAgcGxhaW5IYXNoW2tleV0gPSAoaGFzaCAmJiBoYXNoLmlzTGF6eVZhbHVlKSA/IGhhc2gudmFsdWUoKSA6IGhhc2g7XG4gICAgfSk7XG5cbiAgICAvLyBDYWxsIG91ciBoZWxwZXIgZnVuY3Rpb25zIHdpdGggb3VyIGFzc2VtYmxlZCBhcmdzLlxuICAgIHJlc3VsdCA9IGhlbHBlci5hcHBseSgoY29udGV4dC5fX3Jvb3RfXyB8fCBjb250ZXh0KSwgW3BsYWluUGFyYW1zLCBwbGFpbkhhc2gsIG9wdGlvbnMsIGVudl0pO1xuXG4gICAgaWYocmVzdWx0ICYmIHJlbHBhdGgpe1xuICAgICAgcmV0dXJuIHJlc3VsdC5nZXQocmVscGF0aCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSwge21vcnBoOiBvcHRpb25zLm1vcnBofSk7XG5cbiAgb3B0aW9ucy5sYXp5VmFsdWUucGF0aCA9IHBhdGg7XG5cbiAgLy8gRm9yIGVhY2ggcGFyYW0gcGFzc2VkIHRvIG91ciBoZWxwZXIsIGFkZCBpdCB0byBvdXIgaGVscGVyJ3MgZGVwZW5kYW50IGxpc3QuIEhlbHBlciB3aWxsIHJlLWV2YWx1YXRlIHdoZW4gb25lIGNoYW5nZXMuXG4gIHBhcmFtcy5mb3JFYWNoKGZ1bmN0aW9uKG5vZGUpIHtcbiAgICBpZiAobm9kZSAmJiBub2RlLmlzTGF6eVZhbHVlKSB7XG4gICAgICBvcHRpb25zLmxhenlWYWx1ZS5hZGREZXBlbmRlbnRWYWx1ZShub2RlKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiBvcHRpb25zLmxhenlWYWx1ZTtcbn1cblxuLy8gR2l2ZW4gYSByb290IGVsZW1lbnQsIGNsZWFucyBhbGwgb2YgdGhlIG1vcnBoIGxhenlWYWx1ZXMgZm9yIGEgZ2l2ZW4gc3VidHJlZVxuZnVuY3Rpb24gY2xlYW5TdWJ0cmVlKG11dGF0aW9ucywgb2JzZXJ2ZXIpe1xuICAvLyBGb3IgZWFjaCBtdXRhdGlvbiBvYnNlcnZlZCwgaWYgdGhlcmUgYXJlIG5vZGVzIHJlbW92ZWQsIGRlc3Ryb3kgYWxsIGFzc29jaWF0ZWQgbGF6eVZhbHVlc1xuICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihtdXRhdGlvbikge1xuICAgIGlmKG11dGF0aW9uLnJlbW92ZWROb2Rlcyl7XG4gICAgICBfLmVhY2gobXV0YXRpb24ucmVtb3ZlZE5vZGVzLCBmdW5jdGlvbihub2RlLCBpbmRleCl7XG4gICAgICAgICQobm9kZSkud2Fsa1RoZURPTShmdW5jdGlvbihuKXtcbiAgICAgICAgICBpZihuLl9fbGF6eVZhbHVlICYmIG4uX19sYXp5VmFsdWUuZGVzdHJveSgpKXtcbiAgICAgICAgICAgIG4uX19sYXp5VmFsdWUuZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgc3VidHJlZU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY2xlYW5TdWJ0cmVlKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRGVmYXVsdCBIb29rc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmhvb2tzLmdldCA9IGZ1bmN0aW9uIGdldChlbnYsIGNvbnRleHQsIHBhdGgpe1xuICBjb250ZXh0LmJsb2NrUGFyYW1zIHx8IChjb250ZXh0LmJsb2NrUGFyYW1zID0ge30pO1xuICBpZihwYXRoID09PSAndGhpcycpeyBwYXRoID0gJyc7IH1cbiAgLy8gY29udGV4dCA9IChjb250ZXh0LmJsb2NrUGFyYW1zLmhhcyhwYXRoKSkgPyBjb250ZXh0LmJsb2NrUGFyYW1zIDogY29udGV4dDtcbiAgcmV0dXJuIHN0cmVhbVByb3BlcnR5KGNvbnRleHQsIHBhdGgpO1xufTtcblxuaG9va3Muc2V0ID0gZnVuY3Rpb24gc2V0KGVudiwgY29udGV4dCwgbmFtZSwgdmFsdWUpe1xuICBjb250ZXh0LmJsb2NrUGFyYW1zIHx8IChjb250ZXh0LmJsb2NrUGFyYW1zID0ge30pO1xuICAvLyBjb250ZXh0LmJsb2NrUGFyYW1zLnNldChuYW1lLCB2YWx1ZSk7XG59O1xuXG5cbmhvb2tzLmNvbmNhdCA9IGZ1bmN0aW9uIGNvbmNhdChlbnYsIHBhcmFtcykge1xuXG4gIGlmKHBhcmFtcy5sZW5ndGggPT09IDEpe1xuICAgIHJldHVybiBwYXJhbXNbMF07XG4gIH1cblxuICB2YXIgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsdWUgPSBcIlwiO1xuXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJhbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICB2YWx1ZSArPSAocGFyYW1zW2ldLmlzTGF6eVZhbHVlKSA/IHBhcmFtc1tpXS52YWx1ZSgpIDogcGFyYW1zW2ldO1xuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZTtcbiAgfSwge2NvbnRleHQ6IHBhcmFtc1swXS5jb250ZXh0fSk7XG5cbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBwYXJhbXMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgaWYocGFyYW1zW2ldLmlzTGF6eVZhbHVlKSB7XG4gICAgICBsYXp5VmFsdWUuYWRkRGVwZW5kZW50VmFsdWUocGFyYW1zW2ldKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gbGF6eVZhbHVlO1xuXG59O1xuXG5ob29rcy5zdWJleHByID0gZnVuY3Rpb24gc3ViZXhwcihlbnYsIGNvbnRleHQsIGhlbHBlck5hbWUsIHBhcmFtcywgaGFzaCkge1xuXG4gIHZhciBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihoZWxwZXJOYW1lLCBlbnYsIGNvbnRleHQpLFxuICBsYXp5VmFsdWU7XG5cbiAgaWYgKGhlbHBlcikge1xuICAgIC8vIEFic3RyYWN0cyBvdXIgaGVscGVyIHRvIHByb3ZpZGUgYSBoYW5kbGViYXJzIHR5cGUgaW50ZXJmYWNlLiBDb25zdHJ1Y3RzIG91ciBMYXp5VmFsdWUuXG4gICAgbGF6eVZhbHVlID0gY29uc3RydWN0SGVscGVyKGZhbHNlLCBoZWxwZXJOYW1lLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIHt9LCBlbnYsIGhlbHBlcik7XG4gIH0gZWxzZSB7XG4gICAgbGF6eVZhbHVlID0gc3RyZWFtUHJvcGVydHkoY29udGV4dCwgaGVscGVyTmFtZSk7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHBhcmFtcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZihwYXJhbXNbaV0uaXNMYXp5VmFsdWUpIHtcbiAgICAgIGxhenlWYWx1ZS5hZGREZXBlbmRlbnRWYWx1ZShwYXJhbXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsYXp5VmFsdWU7XG59O1xuXG5ob29rcy5ibG9jayA9IGZ1bmN0aW9uIGJsb2NrKGVudiwgbW9ycGgsIGNvbnRleHQsIHBhdGgsIHBhcmFtcywgaGFzaCwgdGVtcGxhdGUsIGludmVyc2Upe1xuICB2YXIgb3B0aW9ucyA9IHtcbiAgICBtb3JwaDogbW9ycGgsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgIGludmVyc2U6IGludmVyc2VcbiAgfTtcblxuICB2YXIgbGF6eVZhbHVlLFxuICB2YWx1ZSxcbiAgb2JzZXJ2ZXIgPSBzdWJ0cmVlT2JzZXJ2ZXIsXG4gIGhlbHBlciA9IGhlbHBlcnMubG9va3VwSGVscGVyKHBhdGgsIGVudiwgY29udGV4dCk7XG5cbiAgaWYoIV8uaXNGdW5jdGlvbihoZWxwZXIpKXtcbiAgICByZXR1cm4gY29uc29sZS5lcnJvcihwYXRoICsgJyBpcyBub3QgYSB2YWxpZCBoZWxwZXIhJyk7XG4gIH1cblxuICAvLyBBYnN0cmFjdHMgb3VyIGhlbHBlciB0byBwcm92aWRlIGEgaGFuZGxlYmFycyB0eXBlIGludGVyZmFjZS4gQ29uc3RydWN0cyBvdXIgTGF6eVZhbHVlLlxuICBsYXp5VmFsdWUgPSBjb25zdHJ1Y3RIZWxwZXIobW9ycGgsIHBhdGgsIGNvbnRleHQsIHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52LCBoZWxwZXIpO1xuXG4gIC8vIElmIHdlIGhhdmUgb3VyIGxhenkgdmFsdWUsIHVwZGF0ZSBvdXIgZG9tLlxuICAvLyBtb3JwaCBpcyBhIG1vcnBoIGVsZW1lbnQgcmVwcmVzZW50aW5nIG91ciBkb20gbm9kZVxuICBpZiAobGF6eVZhbHVlKSB7XG4gICAgbGF6eVZhbHVlLm9uTm90aWZ5KGZ1bmN0aW9uKGxhenlWYWx1ZSkge1xuICAgICAgdmFyIHZhbCA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuICAgICAgdmFsID0gKF8uaXNVbmRlZmluZWQodmFsKSkgPyAnJyA6IHZhbDtcbiAgICAgIGlmKCFfLmlzTnVsbCh2YWwpKXtcbiAgICAgICAgbW9ycGguc2V0Q29udGVudCh2YWwpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFsdWUgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICB2YWx1ZSA9IChfLmlzVW5kZWZpbmVkKHZhbHVlKSkgPyAnJyA6IHZhbHVlO1xuICAgIGlmKCFfLmlzTnVsbCh2YWx1ZSkpeyBtb3JwaC5hcHBlbmRDb250ZW50KHZhbHVlKTsgfVxuXG4gICAgICAvLyBPYnNlcnZlIHRoaXMgY29udGVudCBtb3JwaCdzIHBhcmVudCdzIGNoaWxkcmVuLlxuICAgICAgLy8gV2hlbiB0aGUgbW9ycGggZWxlbWVudCdzIGNvbnRhaW5pbmcgZWxlbWVudCAobW9ycGgpIGlzIHJlbW92ZWQsIGNsZWFuIHVwIHRoZSBsYXp5dmFsdWUuXG4gICAgICAvLyBUaW1lb3V0IGRlbGF5IGhhY2sgdG8gZ2l2ZSBvdXQgZG9tIGEgY2hhbmdlIHRvIGdldCB0aGVpciBwYXJlbnRcbiAgICAgIGlmKG1vcnBoLl9wYXJlbnQpe1xuICAgICAgICBtb3JwaC5fcGFyZW50Ll9fbGF6eVZhbHVlID0gbGF6eVZhbHVlO1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgaWYobW9ycGguY29udGV4dHVhbEVsZW1lbnQpe1xuICAgICAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShtb3JwaC5jb250ZXh0dWFsRWxlbWVudCwgeyBhdHRyaWJ1dGVzOiBmYWxzZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTogdHJ1ZSB9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDApO1xuICAgICAgfVxuXG4gICAgfVxuXG59O1xuXG5ob29rcy5pbmxpbmUgPSBmdW5jdGlvbiBpbmxpbmUoZW52LCBtb3JwaCwgY29udGV4dCwgcGF0aCwgcGFyYW1zLCBoYXNoKSB7XG5cbiAgdmFyIGxhenlWYWx1ZSxcbiAgdmFsdWUsXG4gIG9ic2VydmVyID0gc3VidHJlZU9ic2VydmVyLFxuICBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihwYXRoLCBlbnYsIGNvbnRleHQpO1xuXG4gIGlmKCFfLmlzRnVuY3Rpb24oaGVscGVyKSl7XG4gICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IocGF0aCArICcgaXMgbm90IGEgdmFsaWQgaGVscGVyIScpO1xuICB9XG5cbiAgLy8gQWJzdHJhY3RzIG91ciBoZWxwZXIgdG8gcHJvdmlkZSBhIGhhbmRsZWJhcnMgdHlwZSBpbnRlcmZhY2UuIENvbnN0cnVjdHMgb3VyIExhenlWYWx1ZS5cbiAgbGF6eVZhbHVlID0gY29uc3RydWN0SGVscGVyKG1vcnBoLCBwYXRoLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIHt9LCBlbnYsIGhlbHBlcik7XG5cbiAgLy8gSWYgd2UgaGF2ZSBvdXIgbGF6eSB2YWx1ZSwgdXBkYXRlIG91ciBkb20uXG4gIC8vIG1vcnBoIGlzIGEgbW9ycGggZWxlbWVudCByZXByZXNlbnRpbmcgb3VyIGRvbSBub2RlXG4gIGlmIChsYXp5VmFsdWUpIHtcbiAgICBsYXp5VmFsdWUub25Ob3RpZnkoZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgICB2YXIgdmFsID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgICB2YWwgPSAoXy5pc1VuZGVmaW5lZCh2YWwpKSA/ICcnIDogdmFsO1xuICAgICAgaWYoIV8uaXNOdWxsKHZhbCkpe1xuICAgICAgICBtb3JwaC5zZXRDb250ZW50KHZhbCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB2YWx1ZSA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuICAgIHZhbHVlID0gKF8uaXNVbmRlZmluZWQodmFsdWUpKSA/ICcnIDogdmFsdWU7XG4gICAgaWYoIV8uaXNOdWxsKHZhbHVlKSl7IG1vcnBoLmFwcGVuZENvbnRlbnQodmFsdWUpOyB9XG5cbiAgICAgIC8vIE9ic2VydmUgdGhpcyBjb250ZW50IG1vcnBoJ3MgcGFyZW50J3MgY2hpbGRyZW4uXG4gICAgICAvLyBXaGVuIHRoZSBtb3JwaCBlbGVtZW50J3MgY29udGFpbmluZyBlbGVtZW50IChtb3JwaCkgaXMgcmVtb3ZlZCwgY2xlYW4gdXAgdGhlIGxhenl2YWx1ZS5cbiAgICAgIC8vIFRpbWVvdXQgZGVsYXkgaGFjayB0byBnaXZlIG91dCBkb20gYSBjaGFuZ2UgdG8gZ2V0IHRoZWlyIHBhcmVudFxuICAgICAgaWYobW9ycGguX3BhcmVudCl7XG4gICAgICAgIG1vcnBoLl9wYXJlbnQuX19sYXp5VmFsdWUgPSBsYXp5VmFsdWU7XG4gICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICBpZihtb3JwaC5jb250ZXh0dWFsRWxlbWVudCl7XG4gICAgICAgICAgICBvYnNlcnZlci5vYnNlcnZlKG1vcnBoLmNvbnRleHR1YWxFbGVtZW50LCB7IGF0dHJpYnV0ZXM6IGZhbHNlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgMCk7XG4gICAgICB9XG5cbiAgICB9XG4gIH07XG5cbmhvb2tzLmNvbnRlbnQgPSBmdW5jdGlvbiBjb250ZW50KGVudiwgbW9ycGgsIGNvbnRleHQsIHBhdGgpIHtcblxuICB2YXIgbGF6eVZhbHVlLFxuICAgICAgdmFsdWUsXG4gICAgICBvYnNlcnZlciA9IHN1YnRyZWVPYnNlcnZlcixcbiAgICAgIGhlbHBlciA9IGhlbHBlcnMubG9va3VwSGVscGVyKHBhdGgsIGVudiwgY29udGV4dCk7XG5cbiAgbGF6eVZhbHVlID0gc3RyZWFtUHJvcGVydHkoY29udGV4dCwgcGF0aCk7XG5cbiAgLy8gSWYgd2UgaGF2ZSBvdXIgbGF6eSB2YWx1ZSwgdXBkYXRlIG91ciBkb20uXG4gIC8vIG1vcnBoIGlzIGEgbW9ycGggZWxlbWVudCByZXByZXNlbnRpbmcgb3VyIGRvbSBub2RlXG4gIGlmIChsYXp5VmFsdWUpIHtcbiAgICBsYXp5VmFsdWUub25Ob3RpZnkoZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgICB2YXIgdmFsID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgICB2YWwgPSAoXy5pc1VuZGVmaW5lZCh2YWwpKSA/ICcnIDogdmFsO1xuICAgICAgaWYoIV8uaXNOdWxsKHZhbCkpe1xuICAgICAgICBtb3JwaC5zZXRDb250ZW50KHZhbCk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB2YWx1ZSA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuICAgIHZhbHVlID0gKF8uaXNVbmRlZmluZWQodmFsdWUpKSA/ICcnIDogdmFsdWU7XG4gICAgaWYoIV8uaXNOdWxsKHZhbHVlKSl7IG1vcnBoLmFwcGVuZENvbnRlbnQodmFsdWUpOyB9XG5cbiAgICAvLyBPYnNlcnZlIHRoaXMgY29udGVudCBtb3JwaCdzIHBhcmVudCdzIGNoaWxkcmVuLlxuICAgIC8vIFdoZW4gdGhlIG1vcnBoIGVsZW1lbnQncyBjb250YWluaW5nIGVsZW1lbnQgKG1vcnBoKSBpcyByZW1vdmVkLCBjbGVhbiB1cCB0aGUgbGF6eXZhbHVlLlxuICAgIC8vIFRpbWVvdXQgZGVsYXkgaGFjayB0byBnaXZlIG91dCBkb20gYSBjaGFuZ2UgdG8gZ2V0IHRoZWlyIHBhcmVudFxuICAgIGlmKG1vcnBoLl9wYXJlbnQpe1xuICAgICAgbW9ycGguX3BhcmVudC5fX2xhenlWYWx1ZSA9IGxhenlWYWx1ZTtcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgaWYobW9ycGguY29udGV4dHVhbEVsZW1lbnQpe1xuICAgICAgICAgIG9ic2VydmVyLm9ic2VydmUobW9ycGguY29udGV4dHVhbEVsZW1lbnQsIHsgYXR0cmlidXRlczogZmFsc2UsIGNoaWxkTGlzdDogdHJ1ZSwgY2hhcmFjdGVyRGF0YTogZmFsc2UsIHN1YnRyZWU6IHRydWUgfSk7XG4gICAgICAgIH1cbiAgICAgIH0sIDApO1xuICAgIH1cblxuICB9XG59O1xuXG4vLyBIYW5kbGUgbW9ycGhzIGluIGVsZW1lbnQgdGFnc1xuLy8gVE9ETzogaGFuZGxlIGR5bmFtaWMgYXR0cmlidXRlIG5hbWVzP1xuaG9va3MuZWxlbWVudCA9IGZ1bmN0aW9uIGVsZW1lbnQoZW52LCBkb21FbGVtZW50LCBjb250ZXh0LCBwYXRoLCBwYXJhbXMsIGhhc2gpIHtcbiAgdmFyIGhlbHBlciA9IGhlbHBlcnMubG9va3VwSGVscGVyKHBhdGgsIGVudiwgY29udGV4dCksXG4gICAgICBsYXp5VmFsdWUsXG4gICAgICB2YWx1ZTtcblxuICBpZiAoaGVscGVyKSB7XG4gICAgLy8gQWJzdHJhY3RzIG91ciBoZWxwZXIgdG8gcHJvdmlkZSBhIGhhbmRsZWJhcnMgdHlwZSBpbnRlcmZhY2UuIENvbnN0cnVjdHMgb3VyIExhenlWYWx1ZS5cbiAgICBsYXp5VmFsdWUgPSBjb25zdHJ1Y3RIZWxwZXIoZG9tRWxlbWVudCwgcGF0aCwgY29udGV4dCwgcGFyYW1zLCBoYXNoLCB7fSwgZW52LCBoZWxwZXIpO1xuICB9IGVsc2Uge1xuICAgIGxhenlWYWx1ZSA9IHN0cmVhbVByb3BlcnR5KGNvbnRleHQsIHBhdGgpO1xuICB9XG5cbiAgLy8gV2hlbiB3ZSBoYXZlIG91ciBsYXp5IHZhbHVlIHJ1biBpdCBhbmQgc3RhcnQgbGlzdGVuaW5nIGZvciB1cGRhdGVzLlxuICBsYXp5VmFsdWUub25Ob3RpZnkoZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgbGF6eVZhbHVlLnZhbHVlKCk7XG4gIH0pO1xuXG4gIHZhbHVlID0gbGF6eVZhbHVlLnZhbHVlKCk7XG5cbn07XG5ob29rcy5hdHRyaWJ1dGUgPSBmdW5jdGlvbiBhdHRyaWJ1dGUoZW52LCBhdHRyTW9ycGgsIGRvbUVsZW1lbnQsIG5hbWUsIHZhbHVlKXtcblxuICB2YXIgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpIHtcbiAgICB2YXIgdmFsID0gdmFsdWUudmFsdWUoKSxcbiAgICBjaGVja2JveENoYW5nZSxcbiAgICB0eXBlID0gZG9tRWxlbWVudC5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpLFxuXG4gICAgaW5wdXRUeXBlcyA9IHsgICdudWxsJzogdHJ1ZSwgICd0ZXh0Jzp0cnVlLCAgICdlbWFpbCc6dHJ1ZSwgICdwYXNzd29yZCc6dHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ3NlYXJjaCc6dHJ1ZSwgJ3VybCc6dHJ1ZSwgICAgJ3RlbCc6dHJ1ZSwgICAgJ2hpZGRlbic6dHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ251bWJlcic6dHJ1ZSwgJ2NvbG9yJzogdHJ1ZSwgJ2RhdGUnOiB0cnVlLCAgJ2RhdGV0aW1lJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ2RhdGV0aW1lLWxvY2FsOic6IHRydWUsICAgICAgJ21vbnRoJzogdHJ1ZSwgJ3JhbmdlJzogdHJ1ZSxcbiAgICAgICAgICAgICAgICAgICAgJ3RpbWUnOiB0cnVlLCAgJ3dlZWsnOiB0cnVlXG4gICAgICAgICAgICAgICAgICB9LFxuICAgIGF0dHI7XG5cbiAgICAvLyBJZiBpcyBhIHRleHQgaW5wdXQgZWxlbWVudCdzIHZhbHVlIHByb3Agd2l0aCBvbmx5IG9uZSB2YXJpYWJsZSwgd2lyZSBkZWZhdWx0IGV2ZW50c1xuICAgIGlmKCBkb21FbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgJiYgaW5wdXRUeXBlc1t0eXBlXSAmJiBuYW1lID09PSAndmFsdWUnICl7XG5cbiAgICAgIC8vIElmIG91ciBzcGVjaWFsIGlucHV0IGV2ZW50cyBoYXZlIG5vdCBiZWVuIGJvdW5kIHlldCwgYmluZCB0aGVtIGFuZCBzZXQgZmxhZ1xuICAgICAgaWYoIWxhenlWYWx1ZS5pbnB1dE9ic2VydmVyKXtcblxuICAgICAgICAkKGRvbUVsZW1lbnQpLm9uKCdjaGFuZ2UgaW5wdXQgcHJvcGVydHljaGFuZ2UnLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgdmFsdWUuc2V0KHZhbHVlLnBhdGgsIHRoaXMudmFsdWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICBsYXp5VmFsdWUuaW5wdXRPYnNlcnZlciA9IHRydWU7XG5cbiAgICAgIH1cblxuICAgICAgLy8gU2V0IHRoZSBhdHRyaWJ1dGUgb24gb3VyIGVsZW1lbnQgZm9yIHZpc3VhbCByZWZlcmFuY2VcbiAgICAgIChfLmlzVW5kZWZpbmVkKHZhbCkpID8gZG9tRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSkgOiBkb21FbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCB2YWwpO1xuXG4gICAgICBhdHRyID0gdmFsO1xuXG4gICAgICByZXR1cm4gKGRvbUVsZW1lbnQudmFsdWUgIT09IFN0cmluZyhhdHRyKSkgPyBkb21FbGVtZW50LnZhbHVlID0gKGF0dHIgfHwgJycpIDogYXR0cjtcbiAgICB9XG5cbiAgICBlbHNlIGlmKCBkb21FbGVtZW50LnRhZ05hbWUgPT09ICdJTlBVVCcgJiYgKHR5cGUgPT09ICdjaGVja2JveCcgfHwgdHlwZSA9PT0gJ3JhZGlvJykgJiYgbmFtZSA9PT0gJ2NoZWNrZWQnICl7XG5cbiAgICAgIC8vIElmIG91ciBzcGVjaWFsIGlucHV0IGV2ZW50cyBoYXZlIG5vdCBiZWVuIGJvdW5kIHlldCwgYmluZCB0aGVtIGFuZCBzZXQgZmxhZ1xuICAgICAgaWYoIWxhenlWYWx1ZS5ldmVudHNCb3VuZCl7XG5cbiAgICAgICAgJChkb21FbGVtZW50KS5vbignY2hhbmdlIHByb3BlcnR5Y2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgIHZhbHVlLnNldCh2YWx1ZS5wYXRoLCAoKHRoaXMuY2hlY2tlZCkgPyB0cnVlIDogZmFsc2UpLCB7cXVpZXQ6IHRydWV9KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGF6eVZhbHVlLmV2ZW50c0JvdW5kID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gU2V0IHRoZSBhdHRyaWJ1dGUgb24gb3VyIGVsZW1lbnQgZm9yIHZpc3VhbCByZWZlcmFuY2VcbiAgICAgICghdmFsKSA/IGRvbUVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKG5hbWUpIDogZG9tRWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsKTtcblxuICAgICAgcmV0dXJuIGRvbUVsZW1lbnQuY2hlY2tlZCA9ICh2YWwpID8gdHJ1ZSA6IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIF8uaXNTdHJpbmcodmFsKSAmJiAodmFsID0gdmFsLnRyaW0oKSk7XG4gICAgICB2YWwgfHwgKHZhbCA9IHVuZGVmaW5lZCk7XG4gICAgICBpZihfLmlzVW5kZWZpbmVkKHZhbCkpe1xuICAgICAgICBkb21FbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIGRvbUVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbDtcblxuICB9LCB7YXR0ck1vcnBoOiBhdHRyTW9ycGh9KTtcblxuICB2YWx1ZS5vbk5vdGlmeShmdW5jdGlvbigpe1xuICAgIGxhenlWYWx1ZS52YWx1ZSgpO1xuICB9KTtcbiAgbGF6eVZhbHVlLmFkZERlcGVuZGVudFZhbHVlKHZhbHVlKTtcblxuICByZXR1cm4gbGF6eVZhbHVlLnZhbHVlKCk7XG5cbn07XG5cbmhvb2tzLmNvbXBvbmVudCA9IGZ1bmN0aW9uKGVudiwgbW9ycGgsIGNvbnRleHQsIHRhZ05hbWUsIGNvbnRleHREYXRhLCB0ZW1wbGF0ZSkge1xuXG4gIHZhciBjb21wb25lbnQsXG4gICAgICBlbGVtZW50LFxuICAgICAgb3V0bGV0LFxuICAgICAgcGxhaW5EYXRhID0ge30sXG4gICAgICBjb21wb25lbnREYXRhID0ge30sXG4gICAgICBsYXp5VmFsdWUsXG4gICAgICB2YWx1ZTtcblxuICAvLyBDcmVhdGUgYSBsYXp5IHZhbHVlIHRoYXQgcmV0dXJucyB0aGUgdmFsdWUgb2Ygb3VyIGV2YWx1YXRlZCBjb21wb25lbnQuXG4gIGxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBDcmVhdGUgYSBwbGFpbiBkYXRhIG9iamVjdCBmcm9tIHRoZSBsYXp5dmFsdWVzL3ZhbHVlcyBwYXNzZWQgdG8gb3VyIGNvbXBvbmVudFxuICAgIF8uZWFjaChjb250ZXh0RGF0YSwgZnVuY3Rpb24odmFsdWUsIGtleSkge1xuICAgICAgcGxhaW5EYXRhW2tleV0gPSAodmFsdWUuaXNMYXp5VmFsdWUpID8gdmFsdWUudmFsdWUoKSA6IHZhbHVlO1xuICAgIH0pO1xuXG4gICAgLy8gRm9yIGVhY2ggcGFyYW0gcGFzc2VkIHRvIG91ciBzaGFyZWQgY29tcG9uZW50LCBhZGQgaXQgdG8gb3VyIGN1c3RvbSBlbGVtZW50XG4gICAgLy8gVE9ETzogdGhlcmUgaGFzIHRvIGJlIGEgYmV0dGVyIHdheSB0byBnZXQgc2VlZCBkYXRhIHRvIGVsZW1lbnQgaW5zdGFuY2VzXG4gICAgLy8gR2xvYmFsIHNlZWQgZGF0YSBpcyBjb25zdW1lZCBieSBlbGVtZW50IGFzIGl0cyBjcmVhdGVkLiBUaGlzIGlzIG5vdCBzY29wZWQgYW5kIHZlcnkgZHVtYi5cbiAgICBSZWJvdW5kLnNlZWREYXRhID0gcGxhaW5EYXRhO1xuICAgIGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KHRhZ05hbWUpO1xuICAgIFJlYm91bmQuc2VlZERhdGEgPSB7fTtcbiAgICBjb21wb25lbnQgPSBlbGVtZW50Ll9fY29tcG9uZW50X187XG5cbiAgICAvLyBGb3IgZWFjaCBsYXp5IHBhcmFtIHBhc3NlZCB0byBvdXIgY29tcG9uZW50LCBjcmVhdGUgaXRzIGxhenlWYWx1ZVxuICAgIF8uZWFjaChwbGFpbkRhdGEsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpIHtcbiAgICAgIGlmKGNvbnRleHREYXRhW2tleV0gJiYgY29udGV4dERhdGFba2V5XS5pc0xhenlWYWx1ZSl7XG4gICAgICAgIGNvbXBvbmVudERhdGFba2V5XSA9IHN0cmVhbVByb3BlcnR5KGNvbXBvbmVudCwga2V5KTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFNldCB1cCB0d28gd2F5IGJpbmRpbmcgYmV0d2VlbiBjb21wb25lbnQgYW5kIG9yaWdpbmFsIGNvbnRleHQgZm9yIG5vbi1kYXRhIGF0dHJpYnV0ZXNcbiAgICAvLyBTeW5jaW5nIGJldHdlZW4gbW9kZWxzIGFuZCBjb2xsZWN0aW9ucyBwYXNzZWQgYXJlIGhhbmRsZWQgaW4gbW9kZWwgYW5kIGNvbGxlY3Rpb25cbiAgICBfLmVhY2goIGNvbXBvbmVudERhdGEsIGZ1bmN0aW9uKGNvbXBvbmVudERhdGFWYWx1ZSwga2V5KXtcblxuICAgICAgLy8gVE9ETzogTWFrZSB0aGlzIHN5bmMgd29yayB3aXRoIGNvbXBsZXggYXJndW1lbnRzIHdpdGggbW9yZSB0aGFuIG9uZSBjaGlsZFxuICAgICAgaWYoY29udGV4dERhdGFba2V5XS5jaGlsZHJlbiA9PT0gbnVsbCl7XG4gICAgICAgIC8vIEZvciBlYWNoIGxhenkgcGFyYW0gcGFzc2VkIHRvIG91ciBjb21wb25lbnQsIGhhdmUgaXQgdXBkYXRlIHRoZSBvcmlnaW5hbCBjb250ZXh0IHdoZW4gY2hhbmdlZC5cbiAgICAgICAgY29tcG9uZW50RGF0YVZhbHVlLm9uTm90aWZ5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgY29udGV4dERhdGFba2V5XS5zZXQoY29udGV4dERhdGFba2V5XS5wYXRoLCBjb21wb25lbnREYXRhVmFsdWUudmFsdWUoKSk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICAvLyBGb3IgZWFjaCBsYXp5IHBhcmFtIHBhc3NlZCB0byBvdXIgY29tcG9uZW50LCBoYXZlIGl0IHVwZGF0ZSB0aGUgY29tcG9uZW50IHdoZW4gY2hhbmdlZC5cbiAgICAgIGNvbnRleHREYXRhW2tleV0ub25Ob3RpZnkoZnVuY3Rpb24oKXtcbiAgICAgICAgY29tcG9uZW50RGF0YVZhbHVlLnNldChrZXksIGNvbnRleHREYXRhW2tleV0udmFsdWUoKSk7XG4gICAgICB9KTtcblxuICAgICAgLy8gU2VlZCB0aGUgY2FjaGVcbiAgICAgIGNvbXBvbmVudERhdGFWYWx1ZS52YWx1ZSgpO1xuXG4gICAgICAvLyBOb3RpZnkgdGhlIGNvbXBvbmVudCdzIGxhenl2YWx1ZSB3aGVuIG91ciBtb2RlbCB1cGRhdGVzXG4gICAgICBjb250ZXh0RGF0YVtrZXldLmFkZE9ic2VydmVyKGNvbnRleHREYXRhW2tleV0ucGF0aCwgY29udGV4dCk7XG4gICAgICBjb21wb25lbnREYXRhVmFsdWUuYWRkT2JzZXJ2ZXIoa2V5LCBjb21wb25lbnQpO1xuXG4gICAgfSk7XG5cbiAgICAvLyAvLyBGb3IgZWFjaCBjaGFuZ2Ugb24gb3VyIGNvbXBvbmVudCwgdXBkYXRlIHRoZSBzdGF0ZXMgb2YgdGhlIG9yaWdpbmFsIGNvbnRleHQgYW5kIHRoZSBlbGVtZW50J3MgcHJvZXBydGllcy5cbiAgICBjb21wb25lbnQubGlzdGVuVG8oY29tcG9uZW50LCAnY2hhbmdlJywgZnVuY3Rpb24obW9kZWwpe1xuICAgICAgdmFyIGpzb24gPSBjb21wb25lbnQudG9KU09OKCk7XG5cbiAgICAgIGlmKF8uaXNTdHJpbmcoanNvbikpIHJldHVybjsgLy8gSWYgaXMgYSBzdHJpbmcsIHRoaXMgbW9kZWwgaXMgc2VyYWxpemluZyBhbHJlYWR5XG5cbiAgICAgIC8vIFNldCB0aGUgcHJvcGVydGllcyBvbiBvdXIgZWxlbWVudCBmb3IgdmlzdWFsIHJlZmVyYW5jZSBpZiB3ZSBhcmUgb24gYSB0b3AgbGV2ZWwgYXR0cmlidXRlXG4gICAgICBfLmVhY2goanNvbiwgZnVuY3Rpb24odmFsdWUsIGtleSl7XG4gICAgICAgIC8vIFRPRE86IEN1cnJlbnRseSwgc2hvd2luZyBvYmplY3RzIGFzIHByb3BlcnRpZXMgb24gdGhlIGN1c3RvbSBlbGVtZW50IGNhdXNlcyBwcm9ibGVtcy5cbiAgICAgICAgLy8gTGlua2VkIG1vZGVscyBiZXR3ZWVuIHRoZSBjb250ZXh0IGFuZCBjb21wb25lbnQgYmVjb21lIHRoZSBzYW1lIGV4YWN0IG1vZGVsIGFuZCBhbGwgaGVsbCBicmVha3MgbG9vc2UuXG4gICAgICAgIC8vIEZpbmQgYSB3YXkgdG8gcmVtZWR5IHRoaXMuIFVudGlsIHRoZW4sIGRvbid0IHNob3cgb2JqZWN0cy5cbiAgICAgICAgaWYoKF8uaXNPYmplY3QodmFsdWUpKSl7IHJldHVybjsgfVxuICAgICAgICB2YWx1ZSA9IChfLmlzT2JqZWN0KHZhbHVlKSkgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgICAgICB0cnl7IChhdHRyaWJ1dGVzW2tleV0pID8gZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCB2YWx1ZSkgOiBlbGVtZW50LmRhdGFzZXRba2V5XSA9IHZhbHVlOyB9XG4gICAgICAgICAgY2F0Y2goZSl7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvKiogVGhlIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayBvbiBvdXIgY3VzdG9tIGVsZW1lbnQgdXBkYXRlcyB0aGUgY29tcG9uZW50J3MgZGF0YS4gKiovXG5cblxuICAvKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKlxuXG4gICAgRW5kIGRhdGEgZGVwZW5kYW5jeSBjaGFpblxuXG4gICoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cblxuICAgIC8vIFRPRE86IGJyZWFrIHRoaXMgb3V0IGludG8gaXRzIG93biBmdW5jdGlvblxuICAgIC8vIFNldCB0aGUgcHJvcGVydGllcyBvbiBvdXIgZWxlbWVudCBmb3IgdmlzdWFsIHJlZmVyYW5jZSBpZiB3ZSBhcmUgb24gYSB0b3AgbGV2ZWwgYXR0cmlidXRlXG4gICAgdmFyIGNvbXBqc29uID0gY29tcG9uZW50LnRvSlNPTigpO1xuICAgIF8uZWFjaChjb21wanNvbiwgZnVuY3Rpb24odmFsdWUsIGtleSl7XG4gICAgICAvLyBUT0RPOiBDdXJyZW50bHksIHNob3dpbmcgb2JqZWN0cyBhcyBwcm9wZXJ0aWVzIG9uIHRoZSBjdXN0b20gZWxlbWVudCBjYXVzZXMgcHJvYmxlbXMuIExpbmtlZCBtb2RlbHMgYmV0d2VlbiB0aGUgY29udGV4dCBhbmQgY29tcG9uZW50IGJlY29tZSB0aGUgc2FtZSBleGFjdCBtb2RlbCBhbmQgYWxsIGhlbGwgYnJlYWtzIGxvb3NlLiBGaW5kIGEgd2F5IHRvIHJlbWVkeSB0aGlzLiBVbnRpbCB0aGVuLCBkb24ndCBzaG93IG9iamVjdHMuXG4gICAgICBpZigoXy5pc09iamVjdCh2YWx1ZSkpKXsgcmV0dXJuOyB9XG4gICAgICB2YWx1ZSA9IChfLmlzT2JqZWN0KHZhbHVlKSkgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgIGlmKCFfLmlzTnVsbCh2YWx1ZSkgJiYgIV8uaXNVbmRlZmluZWQodmFsdWUpKXtcbiAgICAgICAgdHJ5eyAoYXR0cmlidXRlc1trZXldKSA/IGVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpIDogZWxlbWVudC5kYXRhc2V0W2tleV0gPSB2YWx1ZTsgfVxuICAgICAgICBjYXRjaChlKXtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgLy8gSWYgYW4gb3V0bGV0IG1hcmtlciBpcyBwcmVzZW50IGluIGNvbXBvbmVudCdzIHRlbXBsYXRlLCBhbmQgYSB0ZW1wbGF0ZSBpcyBwcm92aWRlZCwgcmVuZGVyIGl0IGludG8gPGNvbnRlbnQ+XG4gICAgb3V0bGV0ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29udGVudCcpWzBdO1xuICAgIGlmKHRlbXBsYXRlICYmIF8uaXNFbGVtZW50KG91dGxldCkpe1xuICAgICAgb3V0bGV0LmFwcGVuZENoaWxkKHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBlbnYsIG91dGxldCkpO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgbmV3IGVsZW1lbnQuXG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH0sIHttb3JwaDogbW9ycGh9KTtcblxuXG5cbiAgLy8gSWYgd2UgaGF2ZSBvdXIgbGF6eSB2YWx1ZSwgdXBkYXRlIG91ciBkb20uXG4gIC8vIG1vcnBoIGlzIGEgbW9ycGggZWxlbWVudCByZXByZXNlbnRpbmcgb3VyIGRvbSBub2RlXG4gIGlmIChsYXp5VmFsdWUpIHtcbiAgICBsYXp5VmFsdWUub25Ob3RpZnkoZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgICB2YXIgdmFsID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgICBpZih2YWwgIT09IHVuZGVmaW5lZCl7IG1vcnBoLnNldENvbnRlbnQodmFsKTsgfVxuICAgIH0pO1xuXG4gICAgdmFsdWUgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICBpZih2YWx1ZSAhPT0gdW5kZWZpbmVkKXsgbW9ycGguYXBwZW5kQ29udGVudCh2YWx1ZSk7IH1cbiAgfVxufTtcblxuLy8gcmVnaXN0ZXJIZWxwZXIgaXMgYSBwdWJsaWNhbGx5IGF2YWlsYWJsZSBmdW5jdGlvbiB0byByZWdpc3RlciBhIGhlbHBlciB3aXRoIEhUTUxCYXJzXG5cbmV4cG9ydCBkZWZhdWx0IGhvb2tzO1xuIiwiLy8gUmVib3VuZCBNb2RlbFxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG4vLyBSZWJvdW5kICoqTW9kZWxzKiogYXJlIHRoZSBiYXNpYyBkYXRhIG9iamVjdCBpbiB0aGUgZnJhbWV3b3JrIOKAlCBmcmVxdWVudGx5XG4vLyByZXByZXNlbnRpbmcgYSByb3cgaW4gYSB0YWJsZSBpbiBhIGRhdGFiYXNlIG9uIHlvdXIgc2VydmVyLiBUaGUgaW5oZXJpdCBmcm9tXG4vLyBCYWNrYm9uZSBNb2RlbHMgYW5kIGhhdmUgYWxsIG9mIHRoZSBzYW1lIHVzZWZ1bCBtZXRob2RzIHlvdSBhcmUgdXNlZCB0byBmb3Jcbi8vIHBlcmZvcm1pbmcgY29tcHV0YXRpb25zIGFuZCB0cmFuc2Zvcm1hdGlvbnMgb24gdGhhdCBkYXRhLiBSZWJvdW5kIGF1Z21lbnRzXG4vLyBCYWNrYm9uZSBNb2RlbHMgYnkgZW5hYmxpbmcgZGVlcCBkYXRhIG5lc3RpbmcuIFlvdSBjYW4gbm93IGhhdmUgKipSZWJvdW5kIENvbGxlY3Rpb25zKipcbi8vIGFuZCAqKlJlYm91bmQgQ29tcHV0ZWQgUHJvcGVydGllcyoqIGFzIHByb3BlcnRpZXMgb2YgdGhlIE1vZGVsLlxuXG5pbXBvcnQgQ29tcHV0ZWRQcm9wZXJ0eSBmcm9tIFwicmVib3VuZC1kYXRhL2NvbXB1dGVkLXByb3BlcnR5XCI7XG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcblxuLy8gUmV0dXJucyBhIGZ1bmN0aW9uIHRoYXQsIHdoZW4gY2FsbGVkLCBnZW5lcmF0ZXMgYSBwYXRoIGNvbnN0cnVjdGVkIGZyb20gaXRzXG4vLyBwYXJlbnQncyBwYXRoIGFuZCB0aGUga2V5IGl0IGlzIGFzc2lnbmVkIHRvLiBLZWVwcyB1cyBmcm9tIHJlLW5hbWluZyBjaGlsZHJlblxuLy8gd2hlbiBwYXJlbnRzIGNoYW5nZS5cbmZ1bmN0aW9uIHBhdGhHZW5lcmF0b3IocGFyZW50LCBrZXkpe1xuICByZXR1cm4gZnVuY3Rpb24oKXtcbiAgICB2YXIgcGF0aCA9IHBhcmVudC5fX3BhdGgoKTtcbiAgICByZXR1cm4gcGF0aCArICgocGF0aCA9PT0gJycpID8gJycgOiAnLicpICsga2V5O1xuICB9O1xufVxuXG52YXIgTW9kZWwgPSBCYWNrYm9uZS5Nb2RlbC5leHRlbmQoe1xuICAvLyBTZXQgdGhpcyBvYmplY3QncyBkYXRhIHR5cGVzXG4gIGlzTW9kZWw6IHRydWUsXG4gIGlzRGF0YTogdHJ1ZSxcblxuICAvLyBBIG1ldGhvZCB0aGF0IHJldHVybnMgYSByb290IHBhdGggYnkgZGVmYXVsdC4gTWVhbnQgdG8gYmUgb3ZlcnJpZGRlbiBvblxuICAvLyBpbnN0YW50aWF0aW9uLlxuICBfX3BhdGg6IGZ1bmN0aW9uKCl7IHJldHVybiAnJzsgfSxcblxuICAvLyBDcmVhdGUgYSBuZXcgTW9kZWwgd2l0aCB0aGUgc3BlY2lmaWVkIGF0dHJpYnV0ZXMuIFRoZSBNb2RlbCdzIGxpbmVhZ2UgaXMgc2V0XG4gIC8vIHVwIGhlcmUgdG8ga2VlcCB0cmFjayBvZiBpdCdzIHBsYWNlIGluIHRoZSBkYXRhIHRyZWUuXG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihhdHRyaWJ1dGVzLCBvcHRpb25zKXtcbiAgICBhdHRyaWJ1dGVzIHx8IChhdHRyaWJ1dGVzID0ge30pO1xuICAgIGF0dHJpYnV0ZXMuaXNNb2RlbCAmJiAoYXR0cmlidXRlcyA9IGF0dHJpYnV0ZXMuYXR0cmlidXRlcyk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB0aGlzLmhlbHBlcnMgPSB7fTtcbiAgICB0aGlzLmRlZmF1bHRzID0gdGhpcy5kZWZhdWx0cyB8fCB7fTtcbiAgICB0aGlzLnNldFBhcmVudCggb3B0aW9ucy5wYXJlbnQgfHwgdGhpcyApO1xuICAgIHRoaXMuc2V0Um9vdCggb3B0aW9ucy5yb290IHx8IHRoaXMgKTtcbiAgICB0aGlzLl9fcGF0aCA9IG9wdGlvbnMucGF0aCB8fCB0aGlzLl9fcGF0aDtcbiAgICBCYWNrYm9uZS5Nb2RlbC5jYWxsKCB0aGlzLCBhdHRyaWJ1dGVzLCBvcHRpb25zICk7XG4gIH0sXG5cbiAgLy8gTmV3IGNvbnZlbmllbmNlIGZ1bmN0aW9uIHRvIHRvZ2dsZSBib29sZWFuIHZhbHVlcyBpbiB0aGUgTW9kZWwuXG4gIHRvZ2dsZTogZnVuY3Rpb24oYXR0ciwgb3B0aW9ucykge1xuICAgIG9wdGlvbnMgPSBvcHRpb25zID8gXy5jbG9uZShvcHRpb25zKSA6IHt9O1xuICAgIHZhciB2YWwgPSB0aGlzLmdldChhdHRyKTtcbiAgICBpZighXy5pc0Jvb2xlYW4odmFsKSkgY29uc29sZS5lcnJvcignVHJpZWQgdG8gdG9nZ2xlIG5vbi1ib29sZWFuIHZhbHVlICcgKyBhdHRyICsnIScsIHRoaXMpO1xuICAgIHJldHVybiB0aGlzLnNldChhdHRyLCAhdmFsLCBvcHRpb25zKTtcbiAgfSxcblxuICAvLyBNb2RlbCBSZXNldCBkb2VzIGEgZGVlcCByZXNldCBvbiB0aGUgZGF0YSB0cmVlIHN0YXJ0aW5nIGF0IHRoaXMgTW9kZWwuXG4gIC8vIEEgYHByZXZpb3VzQXR0cmlidXRlc2AgcHJvcGVydHkgaXMgc2V0IG9uIHRoZSBgb3B0aW9uc2AgcHJvcGVydHkgd2l0aCB0aGUgTW9kZWwnc1xuICAvLyBvbGQgdmFsdWVzLlxuICByZXNldDogZnVuY3Rpb24ob2JqLCBvcHRpb25zKXtcbiAgICB2YXIgY2hhbmdlZCA9IHt9LCBrZXksIHZhbHVlO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgb3B0aW9ucy5yZXNldCA9IHRydWU7XG4gICAgb2JqID0gKG9iaiAmJiBvYmouaXNNb2RlbCAmJiBvYmouYXR0cmlidXRlcykgfHwgb2JqIHx8IHt9O1xuICAgIG9wdGlvbnMucHJldmlvdXNBdHRyaWJ1dGVzID0gXy5jbG9uZSh0aGlzLmF0dHJpYnV0ZXMpO1xuXG4gICAgLy8gSXRlcmF0ZSBvdmVyIHRoZSBNb2RlbCdzIGF0dHJpYnV0ZXM6XG4gICAgLy8gLSBJZiB0aGUgcHJvcGVydHkgaXMgdGhlIGBpZEF0dHJpYnV0ZWAsIHNraXAuXG4gICAgLy8gLSBJZiB0aGUgcHJvcGVydHkgaXMgYSBgTW9kZWxgLCBgQ29sbGVjdGlvbmAsIG9yIGBDb21wdXRlZFByb3BlcnR5YCwgcmVzZXQgaXQuXG4gICAgLy8gLSBJZiB0aGUgcGFzc2VkIG9iamVjdCBoYXMgdGhlIHByb3BlcnR5LCBzZXQgaXQgdG8gdGhlIG5ldyB2YWx1ZS5cbiAgICAvLyAtIElmIHRoZSBNb2RlbCBoYXMgYSBkZWZhdWx0IHZhbHVlIGZvciB0aGlzIHByb3BlcnR5LCBzZXQgaXQgYmFjayB0byBkZWZhdWx0LlxuICAgIC8vIC0gT3RoZXJ3aXNlLCB1bnNldCB0aGUgYXR0cmlidXRlLlxuICAgIGZvcihrZXkgaW4gdGhpcy5hdHRyaWJ1dGVzKXtcbiAgICAgIHZhbHVlID0gdGhpcy5hdHRyaWJ1dGVzW2tleV07XG4gICAgICBpZih2YWx1ZSA9PT0gb2JqW2tleV0pIGNvbnRpbnVlO1xuICAgICAgZWxzZSBpZihfLmlzVW5kZWZpbmVkKHZhbHVlKSkgb2JqW2tleV0gJiYgKGNoYW5nZWRba2V5XSA9IG9ialtrZXldKTtcbiAgICAgIGVsc2UgaWYgKGtleSA9PT0gdGhpcy5pZEF0dHJpYnV0ZSkgY29udGludWU7XG4gICAgICBlbHNlIGlmICh2YWx1ZS5pc0NvbGxlY3Rpb24gfHwgdmFsdWUuaXNNb2RlbCB8fCB2YWx1ZS5pc0NvbXB1dGVkUHJvcGVydHkpe1xuICAgICAgICB2YWx1ZS5yZXNldCgob2JqW2tleV18fFtdKSwge3NpbGVudDogdHJ1ZX0pO1xuICAgICAgICBpZih2YWx1ZS5pc0NvbGxlY3Rpb24pIGNoYW5nZWRba2V5XSA9IFtdO1xuICAgICAgICBlbHNlIGlmKHZhbHVlLmlzTW9kZWwgJiYgdmFsdWUuaXNDb21wdXRlZFByb3BlcnR5KSBjaGFuZ2VkW2tleV0gPSB2YWx1ZS5jYWNoZS5tb2RlbC5jaGFuZ2VkO1xuICAgICAgICBlbHNlIGlmKHZhbHVlLmlzTW9kZWwpIGNoYW5nZWRba2V5XSA9IHZhbHVlLmNoYW5nZWRcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKXsgY2hhbmdlZFtrZXldID0gb2JqW2tleV07IH1cbiAgICAgIGVsc2UgaWYgKHRoaXMuZGVmYXVsdHMuaGFzT3duUHJvcGVydHkoa2V5KSAmJiAhXy5pc0Z1bmN0aW9uKHRoaXMuZGVmYXVsdHNba2V5XSkpe1xuICAgICAgICBjaGFuZ2VkW2tleV0gPSBvYmpba2V5XSA9IHRoaXMuZGVmYXVsdHNba2V5XTtcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIGNoYW5nZWRba2V5XSA9IHVuZGVmaW5lZDtcbiAgICAgICAgdGhpcy51bnNldChrZXksIHtzaWxlbnQ6IHRydWV9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gQW55IHVuc2V0IGNoYW5nZWQgdmFsdWVzIHdpbGwgYmUgc2V0IHRvIG9ialtrZXldXG4gICAgXy5lYWNoKG9iaiwgZnVuY3Rpb24odmFsdWUsIGtleSwgb2JqKXtcbiAgICAgIGNoYW5nZWRba2V5XSA9IGNoYW5nZWRba2V5XSB8fCBvYmpba2V5XTtcbiAgICB9KTtcblxuICAgIC8vIFJlc2V0IG91ciBtb2RlbFxuICAgIG9iaiA9IHRoaXMuc2V0KG9iaiwgXy5leHRlbmQoe30sIG9wdGlvbnMsIHtzaWxlbnQ6IHRydWUsIHJlc2V0OiBmYWxzZX0pKTtcblxuICAgIC8vIFRyaWdnZXIgY3VzdG9tIHJlc2V0IGV2ZW50XG4gICAgdGhpcy5jaGFuZ2VkID0gY2hhbmdlZDtcbiAgICBpZiAoIW9wdGlvbnMuc2lsZW50KSB0aGlzLnRyaWdnZXIoJ3Jlc2V0JywgdGhpcywgb3B0aW9ucyk7XG5cbiAgICAvLyBSZXR1cm4gbmV3IHZhbHVlc1xuICAgIHJldHVybiBvYmo7XG4gIH0sXG5cbiAgLy8gKipNb2RlbC5HZXQqKiBpcyBvdmVycmlkZGVuIHRvIHByb3ZpZGUgc3VwcG9ydCBmb3IgZ2V0dGluZyBmcm9tIGEgZGVlcCBkYXRhIHRyZWUuXG4gIC8vIGBrZXlgIG1heSBub3cgYmUgYW55IHZhbGlkIGpzb24tbGlrZSBpZGVudGlmaWVyLiBFeDogYG9iai5jb2xsWzNdLnZhbHVlYC5cbiAgLy8gSXQgbmVlZHMgdG8gdHJhdmVyc2UgYE1vZGVsc2AsIGBDb2xsZWN0aW9uc2AgYW5kIGBDb21wdXRlZCBQcm9wZXJ0aWVzYCB0b1xuICAvLyBmaW5kIHRoZSBjb3JyZWN0IHZhbHVlLlxuICAvLyAtIElmIGtleSBpcyB1bmRlZmluZWQsIHJldHVybiBgdW5kZWZpbmVkYC5cbiAgLy8gLSBJZiBrZXkgaXMgZW1wdHkgc3RyaW5nLCByZXR1cm4gYHRoaXNgLlxuICAvL1xuICAvLyBGb3IgZWFjaCBwYXJ0OlxuICAvLyAtIElmIGEgYENvbXB1dGVkIFByb3BlcnR5YCBhbmQgYG9wdGlvbnMucmF3YCBpcyB0cnVlLCByZXR1cm4gaXQuXG4gIC8vIC0gSWYgYSBgQ29tcHV0ZWQgUHJvcGVydHlgIHRyYXZlcnNlIHRvIGl0cyB2YWx1ZS5cbiAgLy8gLSBJZiBub3Qgc2V0LCByZXR1cm4gaXRzIGZhbHN5IHZhbHVlLlxuICAvLyAtIElmIGEgYE1vZGVsYCwgYENvbGxlY3Rpb25gLCBvciBwcmltaXRpdmUgdmFsdWUsIHRyYXZlcnNlIHRvIGl0LlxuICBnZXQ6IGZ1bmN0aW9uKGtleSwgb3B0aW9ucyl7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB2YXIgcGFydHMgID0gJC5zcGxpdFBhdGgoa2V5KSxcbiAgICAgICAgcmVzdWx0ID0gdGhpcyxcbiAgICAgICAgaSwgbD1wYXJ0cy5sZW5ndGg7XG5cbiAgICBpZihfLmlzVW5kZWZpbmVkKGtleSkgfHwgXy5pc051bGwoa2V5KSkgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICBpZihrZXkgPT09ICcnIHx8IHBhcnRzLmxlbmd0aCA9PT0gMCkgcmV0dXJuIHJlc3VsdDtcblxuICAgIGZvciAoaSA9IDA7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5ICYmIG9wdGlvbnMucmF3KSByZXR1cm4gcmVzdWx0O1xuICAgICAgaWYocmVzdWx0ICYmIHJlc3VsdC5pc0NvbXB1dGVkUHJvcGVydHkpIHJlc3VsdCA9IHJlc3VsdC52YWx1ZSgpO1xuICAgICAgaWYoXy5pc1VuZGVmaW5lZChyZXN1bHQpIHx8IF8uaXNOdWxsKHJlc3VsdCkpIHJldHVybiByZXN1bHQ7XG4gICAgICBpZihwYXJ0c1tpXSA9PT0gJ0BwYXJlbnQnKSByZXN1bHQgPSByZXN1bHQuX19wYXJlbnRfXztcbiAgICAgIGVsc2UgaWYocmVzdWx0LmlzQ29sbGVjdGlvbikgcmVzdWx0ID0gcmVzdWx0Lm1vZGVsc1twYXJ0c1tpXV07XG4gICAgICBlbHNlIGlmKHJlc3VsdC5pc01vZGVsKSByZXN1bHQgPSByZXN1bHQuYXR0cmlidXRlc1twYXJ0c1tpXV07XG4gICAgICBlbHNlIGlmKHJlc3VsdCAmJiByZXN1bHQuaGFzT3duUHJvcGVydHkocGFydHNbaV0pKSByZXN1bHQgPSByZXN1bHRbcGFydHNbaV1dO1xuICAgIH1cblxuICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5ICYmICFvcHRpb25zLnJhdykgcmVzdWx0ID0gcmVzdWx0LnZhbHVlKCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfSxcblxuXG4gIC8vICoqTW9kZWwuU2V0KiogaXMgb3ZlcnJpZGRlbiB0byBwcm92aWRlIHN1cHBvcnQgZm9yIGdldHRpbmcgZnJvbSBhIGRlZXAgZGF0YSB0cmVlLlxuICAvLyBga2V5YCBtYXkgbm93IGJlIGFueSB2YWxpZCBqc29uLWxpa2UgaWRlbnRpZmllci4gRXg6IGBvYmouY29sbFszXS52YWx1ZWAuXG4gIC8vIEl0IG5lZWRzIHRvIHRyYXZlcnNlIGBNb2RlbHNgLCBgQ29sbGVjdGlvbnNgIGFuZCBgQ29tcHV0ZWQgUHJvcGVydGllc2AgdG9cbiAgLy8gZmluZCB0aGUgY29ycmVjdCB2YWx1ZSB0byBjYWxsIHRoZSBvcmlnaW5hbCBgQmFja2JvbmUuU2V0YCBvbi5cbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbCwgb3B0aW9ucyl7XG5cbiAgICB2YXIgYXR0cnMsIGF0dHIsIG5ld0tleSwgdGFyZ2V0LCBkZXN0aW5hdGlvbiwgcHJvcHMgPSBbXSwgbGluZWFnZTtcblxuICAgIGlmICh0eXBlb2Yga2V5ID09PSAnb2JqZWN0Jykge1xuICAgICAgYXR0cnMgPSAoa2V5LmlzTW9kZWwpID8ga2V5LmF0dHJpYnV0ZXMgOiBrZXk7XG4gICAgICBvcHRpb25zID0gdmFsO1xuICAgIH1cbiAgICBlbHNlIChhdHRycyA9IHt9KVtrZXldID0gdmFsO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG5cbiAgICAvLyBJZiByZXNldCBvcHRpb24gcGFzc2VkLCBkbyBhIHJlc2V0LiBJZiBub3RoaW5nIHBhc3NlZCwgcmV0dXJuLlxuICAgIGlmKG9wdGlvbnMucmVzZXQgPT09IHRydWUpIHJldHVybiB0aGlzLnJlc2V0KGF0dHJzLCBvcHRpb25zKTtcbiAgICBpZihvcHRpb25zLmRlZmF1bHRzID09PSB0cnVlKSB0aGlzLmRlZmF1bHRzID0gYXR0cnM7XG4gICAgaWYoXy5pc0VtcHR5KGF0dHJzKSkgcmV0dXJuO1xuXG4gICAgLy8gRm9yIGVhY2ggYXR0cmlidXRlIHBhc3NlZDpcbiAgICBmb3Ioa2V5IGluIGF0dHJzKXtcbiAgICAgIHZhciB2YWwgPSBhdHRyc1trZXldLFxuICAgICAgICAgIHBhdGhzID0gJC5zcGxpdFBhdGgoa2V5KSxcbiAgICAgICAgICBhdHRyICA9IHBhdGhzLnBvcCgpIHx8ICcnOyAgICAgICAgICAgLy8gVGhlIGtleSAgICAgICAgZXg6IGZvb1swXS5iYXIgLS0+IGJhclxuICAgICAgICAgIHRhcmdldCA9IHRoaXMuZ2V0KHBhdGhzLmpvaW4oJy4nKSksICAvLyBUaGUgZWxlbWVudCAgICBleDogZm9vLmJhci5iYXogLS0+IGZvby5iYXJcbiAgICAgICAgICBsaW5lYWdlO1xuXG4gICAgICAvLyBJZiB0YXJnZXQgY3VycmVudGx5IGRvZXNudCBleGlzdCwgY29uc3RydWN0IGl0cyB0cmVlXG4gICAgICBpZihfLmlzVW5kZWZpbmVkKHRhcmdldCkpe1xuICAgICAgICB0YXJnZXQgPSB0aGlzO1xuICAgICAgICBfLmVhY2gocGF0aHMsIGZ1bmN0aW9uKHZhbHVlKXtcbiAgICAgICAgICB2YXIgdG1wID0gdGFyZ2V0LmdldCh2YWx1ZSk7XG4gICAgICAgICAgaWYoXy5pc1VuZGVmaW5lZCh0bXApKSB0bXAgPSB0YXJnZXQuc2V0KHZhbHVlLCB7fSkuZ2V0KHZhbHVlKTtcbiAgICAgICAgICB0YXJnZXQgPSB0bXA7XG4gICAgICAgIH0sIHRoaXMpO1xuICAgICAgfVxuXG4gICAgICAvLyBUaGUgb2xkIHZhbHVlIG9mIGBhdHRyYCBpbiBgdGFyZ2V0YFxuICAgICAgdmFyIGRlc3RpbmF0aW9uID0gdGFyZ2V0LmdldChhdHRyLCB7cmF3OiB0cnVlfSkgfHwge307XG5cbiAgICAgIC8vIENyZWF0ZSB0aGlzIG5ldyBvYmplY3QncyBsaW5lYWdlLlxuICAgICAgbGluZWFnZSA9IHtcbiAgICAgICAgbmFtZToga2V5LFxuICAgICAgICBwYXJlbnQ6IHRhcmdldCxcbiAgICAgICAgcm9vdDogdGhpcy5fX3Jvb3RfXyxcbiAgICAgICAgcGF0aDogcGF0aEdlbmVyYXRvcih0YXJnZXQsIGtleSksXG4gICAgICAgIHNpbGVudDogdHJ1ZSxcbiAgICAgICAgZGVmYXVsdHM6IG9wdGlvbnMuZGVmYXVsdHNcbiAgICAgIH1cbiAgICAgIC8vIC0gSWYgdmFsIGlzIGBudWxsYCBvciBgdW5kZWZpbmVkYCwgc2V0IHRvIGRlZmF1bHQgdmFsdWUuXG4gICAgICAvLyAtIElmIHZhbCBpcyBhIGBDb21wdXRlZCBQcm9wZXJ0eWAsIGdldCBpdHMgY3VycmVudCBjYWNoZSBvYmplY3QuXG4gICAgICAvLyAtIElmIHZhbCBpcyBgbnVsbGAsIHNldCB0byBkZWZhdWx0IHZhbHVlIG9yIChmYWxsYmFjayBgdW5kZWZpbmVkYCkuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyBmdW5jdGlvbiBpcyB0aGUgc2FtZSBhcyB0aGUgY3VycmVudCBjb21wdXRlZCBwcm9wZXJ0eSwgY29udGludWUuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyB2YWx1ZSBpcyBhIGBGdW5jdGlvbmAsIHR1cm4gaXQgaW50byBhIGBDb21wdXRlZCBQcm9wZXJ0eWAuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyBpcyBnb2luZyB0byBiZSBhIGN5Y2xpY2FsIGRlcGVuZGFuY3ksIHVzZSB0aGUgb3JpZ2luYWwgb2JqZWN0LCBkb24ndCBtYWtlIGEgY29weS5cbiAgICAgIC8vIC0gRWxzZSBJZiB1cGRhdGluZyBhbiBleGlzdGluZyBvYmplY3Qgd2l0aCBpdHMgcmVzcGVjdGl2ZSBkYXRhIHR5cGUsIGxldCBCYWNrYm9uZSBoYW5kbGUgdGhlIG1lcmdlLlxuICAgICAgLy8gLSBFbHNlIElmIHRoaXMgdmFsdWUgaXMgYSBgTW9kZWxgIG9yIGBDb2xsZWN0aW9uYCwgY3JlYXRlIGEgbmV3IGNvcHkgb2YgaXQgdXNpbmcgaXRzIGNvbnN0cnVjdG9yLCBwcmVzZXJ2aW5nIGl0cyBkZWZhdWx0cyB3aGlsZSBlbnN1cmluZyBubyBzaGFyZWQgbWVtb3J5IGJldHdlZW4gb2JqZWN0cy5cbiAgICAgIC8vIC0gRWxzZSBJZiB0aGlzIHZhbHVlIGlzIGFuIGBBcnJheWAsIHR1cm4gaXQgaW50byBhIGBDb2xsZWN0aW9uYC5cbiAgICAgIC8vIC0gRWxzZSBJZiB0aGlzIHZhbHVlIGlzIGEgYE9iamVjdGAsIHR1cm4gaXQgaW50byBhIGBNb2RlbGAuXG4gICAgICAvLyAtIEVsc2UgdmFsIGlzIGEgcHJpbWl0aXZlIHZhbHVlLCBzZXQgaXQgYWNjb3JkaW5nbHkuXG5cblxuXG4gICAgICBpZihfLmlzTnVsbCh2YWwpIHx8IF8uaXNVbmRlZmluZWQodmFsKSkgdmFsID0gdGhpcy5kZWZhdWx0c1trZXldO1xuICAgICAgaWYodmFsICYmIHZhbC5pc0NvbXB1dGVkUHJvcGVydHkpIHZhbCA9IHZhbC52YWx1ZSgpO1xuICAgICAgZWxzZSBpZihfLmlzTnVsbCh2YWwpIHx8IF8uaXNVbmRlZmluZWQodmFsKSkgdmFsID0gdW5kZWZpbmVkO1xuICAgICAgZWxzZSBpZihkZXN0aW5hdGlvbi5pc0NvbXB1dGVkUHJvcGVydHkgJiYgZGVzdGluYXRpb24uZnVuYyA9PT0gdmFsKSBjb250aW51ZTtcbiAgICAgIGVsc2UgaWYoXy5pc0Z1bmN0aW9uKHZhbCkpIHZhbCA9IG5ldyBDb21wdXRlZFByb3BlcnR5KHZhbCwgbGluZWFnZSk7XG4gICAgICBlbHNlIGlmKHZhbC5pc0RhdGEgJiYgdGFyZ2V0Lmhhc1BhcmVudCh2YWwpKSB2YWwgPSB2YWw7XG4gICAgICBlbHNlIGlmKCBkZXN0aW5hdGlvbi5pc0NvbXB1dGVkUHJvcGVydHkgfHxcbiAgICAgICAgICAgICAgKCBkZXN0aW5hdGlvbi5pc0NvbGxlY3Rpb24gJiYgKCBfLmlzQXJyYXkodmFsKSB8fCB2YWwuaXNDb2xsZWN0aW9uICkpIHx8XG4gICAgICAgICAgICAgICggZGVzdGluYXRpb24uaXNNb2RlbCAmJiAoIF8uaXNPYmplY3QodmFsKSB8fCB2YWwuaXNNb2RlbCApKSl7XG4gICAgICAgIGRlc3RpbmF0aW9uLnNldCh2YWwsIG9wdGlvbnMpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYodmFsLmlzRGF0YSAmJiBvcHRpb25zLmNsb25lICE9PSBmYWxzZSkgdmFsID0gbmV3IHZhbC5jb25zdHJ1Y3Rvcih2YWwuYXR0cmlidXRlcyB8fCB2YWwubW9kZWxzLCBsaW5lYWdlKTtcbiAgICAgIGVsc2UgaWYoXy5pc0FycmF5KHZhbCkpIHZhbCA9IG5ldyBSZWJvdW5kLkNvbGxlY3Rpb24odmFsLCBsaW5lYWdlKTsgLy8gVE9ETzogUmVtb3ZlIGdsb2JhbCByZWZlcmFuY2VcbiAgICAgIGVsc2UgaWYoXy5pc09iamVjdCh2YWwpKSB2YWwgPSBuZXcgTW9kZWwodmFsLCBsaW5lYWdlKTtcblxuICAgICAgLy8gSWYgdmFsIGlzIGEgZGF0YSBvYmplY3QsIGxldCB0aGlzIG9iamVjdCBrbm93IGl0IGlzIG5vdyBhIHBhcmVudFxuICAgICAgdGhpcy5faGFzQW5jZXN0cnkgPSAodmFsICYmIHZhbC5pc0RhdGEgfHwgZmFsc2UpO1xuXG4gICAgICAvLyBTZXQgdGhlIHZhbHVlXG4gICAgICBCYWNrYm9uZS5Nb2RlbC5wcm90b3R5cGUuc2V0LmNhbGwodGFyZ2V0LCBhdHRyLCB2YWwsIG9wdGlvbnMpOyAvLyBUT0RPOiBFdmVudCBjbGVhbnVwIHdoZW4gcmVwbGFjaW5nIGEgbW9kZWwgb3IgY29sbGVjdGlvbiB3aXRoIGFub3RoZXIgdmFsdWVcblxuICAgIH07XG5cbiAgICByZXR1cm4gdGhpcztcblxuICB9LFxuXG4gIC8vIFJlY3Vyc2l2ZSBgdG9KU09OYCBmdW5jdGlvbiB0cmF2ZXJzZXMgdGhlIGRhdGEgdHJlZSByZXR1cm5pbmcgYSBKU09OIG9iamVjdC5cbiAgLy8gSWYgdGhlcmUgYXJlIGFueSBjeWNsaWMgZGVwZW5kYW5jaWVzIHRoZSBvYmplY3QncyBgY2lkYCBpcyB1c2VkIGluc3RlYWQgb2YgbG9vcGluZyBpbmZpbml0ZWx5LlxuICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHRoaXMuX2lzU2VyaWFsaXppbmcpIHJldHVybiB0aGlzLmlkIHx8IHRoaXMuY2lkO1xuICAgICAgdGhpcy5faXNTZXJpYWxpemluZyA9IHRydWU7XG4gICAgICB2YXIganNvbiA9IF8uY2xvbmUodGhpcy5hdHRyaWJ1dGVzKTtcbiAgICAgIF8uZWFjaChqc29uLCBmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICAgIGlmKCBfLmlzTnVsbCh2YWx1ZSkgfHwgXy5pc1VuZGVmaW5lZCh2YWx1ZSkgKXsgcmV0dXJuOyB9XG4gICAgICAgICAgXy5pc0Z1bmN0aW9uKHZhbHVlLnRvSlNPTikgJiYgKGpzb25bbmFtZV0gPSB2YWx1ZS50b0pTT04oKSk7XG4gICAgICB9KTtcbiAgICAgIHRoaXMuX2lzU2VyaWFsaXppbmcgPSBmYWxzZTtcbiAgICAgIHJldHVybiBqc29uO1xuICB9XG5cbn0pO1xuXG5leHBvcnQgZGVmYXVsdCBNb2RlbDtcbiIsIi8vIFJlYm91bmQgTGF6eSBWYWx1ZVxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgTklMID0gZnVuY3Rpb24gTklMKCl7fSxcbiAgICBFTVBUWV9BUlJBWSA9IFtdO1xuXG5mdW5jdGlvbiBMYXp5VmFsdWUoZm4sIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KVxuICB0aGlzLmNpZCA9IF8udW5pcXVlSWQoJ2xhenlWYWx1ZScpO1xuICB0aGlzLnZhbHVlRm4gPSBmbjtcbiAgdGhpcy5jb250ZXh0ID0gb3B0aW9ucy5jb250ZXh0IHx8IG51bGw7XG4gIHRoaXMubW9ycGggPSBvcHRpb25zLm1vcnBoIHx8IG51bGw7XG4gIHRoaXMuYXR0ck1vcnBoID0gb3B0aW9ucy5hdHRyTW9ycGggfHwgbnVsbDtcbiAgXy5iaW5kQWxsKHRoaXMsICd2YWx1ZScsICdzZXQnLCAnYWRkRGVwZW5kZW50VmFsdWUnLCAnYWRkT2JzZXJ2ZXInLCAnbm90aWZ5JywgJ29uTm90aWZ5JywgJ2Rlc3Ryb3knKTtcbn1cblxuTGF6eVZhbHVlLnByb3RvdHlwZSA9IHtcbiAgaXNMYXp5VmFsdWU6IHRydWUsXG4gIHBhcmVudDogbnVsbCwgLy8gVE9ETzogaXMgcGFyZW50IGV2ZW4gbmVlZGVkPyBjb3VsZCBiZSBtb2RlbGVkIGFzIGEgc3Vic2NyaWJlclxuICBjaGlsZHJlbjogbnVsbCxcbiAgb2JzZXJ2ZXJzOiBudWxsLFxuICBjYWNoZTogTklMLFxuICB2YWx1ZUZuOiBudWxsLFxuICBzdWJzY3JpYmVyczogbnVsbCwgLy8gVE9ETzogZG8gd2UgbmVlZCBtdWx0aXBsZSBzdWJzY3JpYmVycz9cbiAgX2NoaWxkVmFsdWVzOiBudWxsLCAvLyBqdXN0IGZvciByZXVzaW5nIHRoZSBhcnJheSwgbWlnaHQgbm90IHdvcmsgd2VsbCBpZiBjaGlsZHJlbi5sZW5ndGggY2hhbmdlcyBhZnRlciBjb21wdXRhdGlvblxuXG4gIHZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FjaGUgPSB0aGlzLmNhY2hlO1xuICAgIGlmIChjYWNoZSAhPT0gTklMKSB7IHJldHVybiBjYWNoZTsgfVxuXG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcbiAgICBpZiAoY2hpbGRyZW4pIHtcbiAgICAgIHZhciBjaGlsZCxcbiAgICAgICAgICB2YWx1ZXMgPSB0aGlzLl9jaGlsZFZhbHVlcyB8fCBuZXcgQXJyYXkoY2hpbGRyZW4ubGVuZ3RoKTtcblxuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBjaGlsZHJlbi5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgY2hpbGQgPSBjaGlsZHJlbltpXTtcbiAgICAgICAgdmFsdWVzW2ldID0gKGNoaWxkICYmIGNoaWxkLmlzTGF6eVZhbHVlKSA/IGNoaWxkLnZhbHVlKCkgOiBjaGlsZDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRoaXMuY2FjaGUgPSB0aGlzLnZhbHVlRm4odmFsdWVzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRoaXMuY2FjaGUgPSB0aGlzLnZhbHVlRm4oRU1QVFlfQVJSQVkpO1xuICAgIH1cbiAgfSxcblxuICBzZXQ6IGZ1bmN0aW9uKGtleSwgdmFsdWUsIG9wdGlvbnMpe1xuICAgIGlmKHRoaXMuY29udGV4dCl7XG4gICAgICByZXR1cm4gdGhpcy5jb250ZXh0LnNldChrZXksIHZhbHVlLCBvcHRpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG4gIH0sXG5cbiAgYWRkRGVwZW5kZW50VmFsdWU6IGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgdmFyIGNoaWxkcmVuID0gdGhpcy5jaGlsZHJlbjtcbiAgICBpZiAoIWNoaWxkcmVuKSB7XG4gICAgICBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW4gPSBbdmFsdWVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBjaGlsZHJlbi5wdXNoKHZhbHVlKTtcbiAgICB9XG5cbiAgICBpZiAodmFsdWUgJiYgdmFsdWUuaXNMYXp5VmFsdWUpIHsgdmFsdWUucGFyZW50ID0gdGhpczsgfVxuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgYWRkT2JzZXJ2ZXI6IGZ1bmN0aW9uKHBhdGgsIGNvbnRleHQpIHtcbiAgICB2YXIgb2JzZXJ2ZXJzID0gdGhpcy5vYnNlcnZlcnMgfHwgKHRoaXMub2JzZXJ2ZXJzID0gW10pLFxuICAgICAgICBwb3NpdGlvbiwgcmVzO1xuXG4gICAgaWYoIV8uaXNPYmplY3QoY29udGV4dCkgfHwgIV8uaXNTdHJpbmcocGF0aCkpIHJldHVybiBjb25zb2xlLmVycm9yKCdFcnJvciBhZGRpbmcgb2JzZXJ2ZXIgZm9yJywgY29udGV4dCwgcGF0aCk7XG5cbiAgICAvLyBFbnN1cmUgX29ic2VydmVycyBleGlzdHMgYW5kIGlzIGFuIG9iamVjdFxuICAgIGNvbnRleHQuX19vYnNlcnZlcnMgPSBjb250ZXh0Ll9fb2JzZXJ2ZXJzIHx8IHt9O1xuICAgIC8vIEVuc3VyZSBfX29ic2VydmVyc1twYXRoXSBleGlzdHMgYW5kIGlzIGFuIGFycmF5XG4gICAgY29udGV4dC5fX29ic2VydmVyc1twYXRoXSA9IGNvbnRleHQuX19vYnNlcnZlcnNbcGF0aF0gfHwge2NvbGxlY3Rpb246IFtdLCBtb2RlbDogW119O1xuXG4gICAgLy8gU2F2ZSB0aGUgdHlwZSBvZiBvYmplY3QgZXZlbnRzIHRoaXMgb2JzZXJ2ZXIgaXMgZm9yXG4gICAgcmVzID0gY29udGV4dC5nZXQodGhpcy5wYXRoKTtcbiAgICByZXMgPSAocmVzICYmIHJlcy5pc0NvbGxlY3Rpb24pID8gJ2NvbGxlY3Rpb24nIDogJ21vZGVsJztcblxuICAgIC8vIEFkZCBvdXIgY2FsbGJhY2ssIHNhdmUgdGhlIHBvc2l0aW9uIGl0IGlzIGJlaW5nIGluc2VydGVkIHNvIHdlIGNhbiBnYXJiYWdlIGNvbGxlY3QgbGF0ZXIuXG4gICAgcG9zaXRpb24gPSBjb250ZXh0Ll9fb2JzZXJ2ZXJzW3BhdGhdW3Jlc10ucHVzaCh0aGlzKSAtIDE7XG5cbiAgICAvLyBMYXp5dmFsdWUgbmVlZHMgcmVmZXJhbmNlIHRvIGl0cyBvYnNlcnZlcnMgdG8gcmVtb3ZlIGxpc3RlbmVycyBvbiBkZXN0cm95XG4gICAgb2JzZXJ2ZXJzLnB1c2goe2NvbnRleHQ6IGNvbnRleHQsIHBhdGg6IHBhdGgsIGluZGV4OiBwb3NpdGlvbn0pO1xuXG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgbm90aWZ5OiBmdW5jdGlvbihzZW5kZXIpIHtcbiAgICAvLyBUT0RPOiBUaGlzIGNoZWNrIHdvbid0IGJlIG5lY2Vzc2FyeSBvbmNlIHJlbW92ZWQgRE9NIGhhcyBiZWVuIGNsZWFuZWQgb2YgYW55IGJpbmRpbmdzLlxuICAgIC8vIElmIHRoaXMgbGF6eVZhbHVlJ3MgbW9ycGggZG9lcyBub3QgaGF2ZSBhbiBpbW1lZGlhdGUgcGFyZW50Tm9kZSwgaXQgaGFzIGJlZW4gcmVtb3ZlZCBmcm9tIHRoZSBkb20gdHJlZS4gRGVzdHJveSBpdC5cbiAgICAvLyBSaWdodCBub3csIERPTSB0aGF0IGNvbnRhaW5zIG1vcnBocyB0aHJvdyBhbiBlcnJvciBpZiBpdCBpcyByZW1vdmVkIGJ5IGFub3RoZXIgbGF6eXZhbHVlIGJlZm9yZSB0aG9zZSBtb3JwaHMgcmUtZXZhbHVhdGUuXG4gICAgaWYodGhpcy5tb3JwaCAmJiB0aGlzLm1vcnBoLmZpcnN0Tm9kZSAmJiAhdGhpcy5tb3JwaC5maXJzdE5vZGUucGFyZW50Tm9kZSkgcmV0dXJuIHRoaXMuZGVzdHJveSgpO1xuICAgIHZhciBjYWNoZSA9IHRoaXMuY2FjaGUsXG4gICAgICAgIHBhcmVudCxcbiAgICAgICAgc3Vic2NyaWJlcnM7XG5cbiAgICBpZiAoY2FjaGUgIT09IE5JTCkge1xuICAgICAgcGFyZW50ID0gdGhpcy5wYXJlbnQ7XG4gICAgICBzdWJzY3JpYmVycyA9IHRoaXMuc3Vic2NyaWJlcnM7XG4gICAgICBjYWNoZSA9IHRoaXMuY2FjaGUgPSBOSUw7XG4gICAgICBpZiAocGFyZW50KSB7IHBhcmVudC5ub3RpZnkodGhpcyk7IH1cbiAgICAgIGlmICghc3Vic2NyaWJlcnMpIHsgcmV0dXJuOyB9XG4gICAgICBmb3IgKHZhciBpID0gMCwgbCA9IHN1YnNjcmliZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuICAgICAgICBzdWJzY3JpYmVyc1tpXSh0aGlzKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgb25Ob3RpZnk6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgdmFyIHN1YnNjcmliZXJzID0gdGhpcy5zdWJzY3JpYmVycyB8fCAodGhpcy5zdWJzY3JpYmVycyA9IFtdKTtcbiAgICBzdWJzY3JpYmVycy5wdXNoKGNhbGxiYWNrKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfSxcblxuICBkZXN0cm95OiBmdW5jdGlvbigpIHtcbiAgICBfLmVhY2godGhpcy5jaGlsZHJlbiwgZnVuY3Rpb24oY2hpbGQpe1xuICAgICAgaWYgKGNoaWxkICYmIGNoaWxkLmlzTGF6eVZhbHVlKXsgY2hpbGQuZGVzdHJveSgpOyB9XG4gICAgfSk7XG4gICAgXy5lYWNoKHRoaXMuc3Vic2NyaWJlcnMsIGZ1bmN0aW9uKHN1YnNjcmliZXIpe1xuICAgICAgaWYgKHN1YnNjcmliZXIgJiYgc3Vic2NyaWJlci5pc0xhenlWYWx1ZSl7IHN1YnNjcmliZXIuZGVzdHJveSgpOyB9XG4gICAgfSk7XG5cbiAgICB0aGlzLnBhcmVudCA9IHRoaXMuY2hpbGRyZW4gPSB0aGlzLmNhY2hlID0gdGhpcy52YWx1ZUZuID0gdGhpcy5zdWJzY3JpYmVycyA9IHRoaXMuX2NoaWxkVmFsdWVzID0gbnVsbDtcblxuICAgIF8uZWFjaCh0aGlzLm9ic2VydmVycywgZnVuY3Rpb24ob2JzZXJ2ZXIpe1xuICAgICAgaWYoXy5pc09iamVjdChvYnNlcnZlci5jb250ZXh0Ll9fb2JzZXJ2ZXJzW29ic2VydmVyLnBhdGhdKSl7XG4gICAgICAgIGRlbGV0ZSBvYnNlcnZlci5jb250ZXh0Ll9fb2JzZXJ2ZXJzW29ic2VydmVyLnBhdGhdW29ic2VydmVyLmluZGV4XTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHRoaXMub2JzZXJ2ZXJzID0gbnVsbDtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgTGF6eVZhbHVlO1xuIiwiLy8gUmVib3VuZCBEYXRhXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG4vLyBUaGVzZSBhcmUgbWV0aG9kcyBpbmhlcml0ZWQgYnkgYWxsIFJlYm91bmQgZGF0YSB0eXBlcyDigJMgKipNb2RlbHMqKixcbi8vICoqQ29sbGVjdGlvbnMqKiBhbmQgKipDb21wdXRlZCBQcm9wZXJ0aWVzKiog4oCTIGFuZCBjb250cm9sIHRyZWUgYW5jZXN0cnlcbi8vIHRyYWNraW5nLCBkZWVwIGV2ZW50IHByb3BhZ2F0aW9uIGFuZCB0cmVlIGRlc3RydWN0aW9uLlxuXG5pbXBvcnQgTW9kZWwgZnJvbSBcInJlYm91bmQtZGF0YS9tb2RlbFwiO1xuaW1wb3J0IENvbGxlY3Rpb24gZnJvbSBcInJlYm91bmQtZGF0YS9jb2xsZWN0aW9uXCI7XG5pbXBvcnQgQ29tcHV0ZWRQcm9wZXJ0eSBmcm9tIFwicmVib3VuZC1kYXRhL2NvbXB1dGVkLXByb3BlcnR5XCI7XG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcblxudmFyIHNoYXJlZE1ldGhvZHMgPSB7XG4gIC8vIFdoZW4gYSBjaGFuZ2UgZXZlbnQgcHJvcGFnYXRlcyB1cCB0aGUgdHJlZSBpdCBtb2RpZmllcyB0aGUgcGF0aCBwYXJ0IG9mXG4gIC8vIGBjaGFuZ2U6PHBhdGg+YCB0byByZWZsZWN0IHRoZSBmdWxseSBxdWFsaWZpZWQgcGF0aCByZWxhdGl2ZSB0byB0aGF0IG9iamVjdC5cbiAgLy8gRXg6IFdvdWxkIHRyaWdnZXIgYGNoYW5nZTp2YWxgLCBgY2hhbmdlOlswXS52YWxgLCBgY2hhbmdlOmFyclswXS52YWxgIGFuZCBgb2JqLmFyclswXS52YWxgXG4gIC8vIG9uIGVhY2ggcGFyZW50IGFzIGl0IGlzIHByb3BhZ2F0ZWQgdXAgdGhlIHRyZWUuXG4gIHByb3BhZ2F0ZUV2ZW50OiBmdW5jdGlvbih0eXBlLCBtb2RlbCl7XG4gICAgaWYodGhpcy5fX3BhcmVudF9fID09PSB0aGlzIHx8IHR5cGUgPT09ICdkaXJ0eScpIHJldHVybjtcbiAgICBpZih0eXBlLmluZGV4T2YoJ2NoYW5nZTonKSA9PT0gMCAmJiBtb2RlbC5pc01vZGVsKXtcbiAgICAgIGlmKHRoaXMuaXNDb2xsZWN0aW9uICYmIH50eXBlLmluZGV4T2YoJ2NoYW5nZTpbJykpIHJldHVybjtcbiAgICAgIHZhciBrZXksXG4gICAgICAgICAgcGF0aCA9IG1vZGVsLl9fcGF0aCgpLnJlcGxhY2UodGhpcy5fX3BhcmVudF9fLl9fcGF0aCgpLCAnJykucmVwbGFjZSgvXlxcLi8sICcnKSxcbiAgICAgICAgICBjaGFuZ2VkID0gbW9kZWwuY2hhbmdlZEF0dHJpYnV0ZXMoKTtcblxuICAgICAgZm9yKGtleSBpbiBjaGFuZ2VkKXtcbiAgICAgICAgYXJndW1lbnRzWzBdID0gKCdjaGFuZ2U6JyArIHBhdGggKyAocGF0aCAmJiAnLicpICsga2V5KTsgLy8ganNoaW50IGlnbm9yZTpsaW5lXG4gICAgICAgIHRoaXMuX19wYXJlbnRfXy50cmlnZ2VyLmFwcGx5KHRoaXMuX19wYXJlbnRfXywgYXJndW1lbnRzKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX19wYXJlbnRfXy50cmlnZ2VyLmFwcGx5KHRoaXMuX19wYXJlbnRfXywgYXJndW1lbnRzKTtcbiAgfSxcblxuICAvLyBTZXQgdGhpcyBkYXRhIG9iamVjdCdzIHBhcmVudCB0byBgcGFyZW50YCBhbmQsIGFzIGxvbmcgYXMgYSBkYXRhIG9iamVjdCBpc1xuICAvLyBub3QgaXRzIG93biBwYXJlbnQsIHByb3BhZ2F0ZSBldmVyeSBldmVudCB0cmlnZ2VyZWQgb24gYHRoaXNgIHVwIHRoZSB0cmVlLlxuICBzZXRQYXJlbnQ6IGZ1bmN0aW9uKHBhcmVudCl7XG4gICAgaWYodGhpcy5fX3BhcmVudF9fKSB0aGlzLm9mZignYWxsJywgdGhpcy5wcm9wYWdhdGVFdmVudCk7XG4gICAgdGhpcy5fX3BhcmVudF9fID0gcGFyZW50O1xuICAgIHRoaXMuX2hhc0FuY2VzdHJ5ID0gdHJ1ZTtcbiAgICBpZihwYXJlbnQgIT09IHRoaXMpIHRoaXMub24oJ2FsbCcsIHRoaXMuX19wYXJlbnRfXy5wcm9wYWdhdGVFdmVudCk7XG4gICAgcmV0dXJuIHBhcmVudDtcbiAgfSxcblxuICAvLyBSZWN1cnNpdmVseSBzZXQgYSBkYXRhIHRyZWUncyByb290IGVsZW1lbnQgc3RhcnRpbmcgd2l0aCBgdGhpc2AgdG8gdGhlIGRlZXBlc3QgY2hpbGQuXG4gIC8vIFRPRE86IEkgZG9udCBsaWtlIHRoaXMgcmVjdXJzaXZlbHkgc2V0dGluZyBlbGVtZW50cyByb290IHdoZW4gb25lIGVsZW1lbnQncyByb290IGNoYW5nZXMuIEZpeCB0aGlzLlxuICBzZXRSb290OiBmdW5jdGlvbiAocm9vdCl7XG4gICAgdmFyIG9iaiA9IHRoaXM7XG4gICAgb2JqLl9fcm9vdF9fID0gcm9vdDtcbiAgICB2YXIgdmFsID0gb2JqLm1vZGVscyB8fCAgb2JqLmF0dHJpYnV0ZXMgfHwgb2JqLmNhY2hlO1xuICAgIF8uZWFjaCh2YWwsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuICAgICAgaWYodmFsdWUgJiYgdmFsdWUuaXNEYXRhKXtcbiAgICAgICAgdmFsdWUuc2V0Um9vdChyb290KTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICByZXR1cm4gcm9vdDtcbiAgfSxcblxuICAvLyBUZXN0cyB0byBzZWUgaWYgYHRoaXNgIGhhcyBhIHBhcmVudCBgb2JqYC5cbiAgaGFzUGFyZW50OiBmdW5jdGlvbihvYmope1xuICAgIHZhciB0bXAgPSB0aGlzO1xuICAgIHdoaWxlKHRtcCAhPT0gb2JqKXtcbiAgICAgIHRtcCA9IHRtcC5fX3BhcmVudF9fO1xuICAgICAgaWYoXy5pc1VuZGVmaW5lZCh0bXApKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZih0bXAgPT09IG9iaikgcmV0dXJuIHRydWU7XG4gICAgICBpZih0bXAuX19wYXJlbnRfXyA9PT0gdG1wKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiB0cnVlO1xuICB9LFxuXG4gIC8vIERlLWluaXRpYWxpemVzIGEgZGF0YSB0cmVlIHN0YXJ0aW5nIHdpdGggYHRoaXNgIGFuZCByZWN1cnNpdmVseSBjYWxsaW5nIGBkZWluaXRpYWxpemUoKWAgb24gZWFjaCBjaGlsZC5cbiAgZGVpbml0aWFsaXplOiBmdW5jdGlvbiAoKSB7XG5cbiAgLy8gVW5kZWxlZ2F0ZSBCYWNrYm9uZSBFdmVudHMgZnJvbSB0aGlzIGRhdGEgb2JqZWN0XG4gICAgaWYgKHRoaXMudW5kZWxlZ2F0ZUV2ZW50cykgdGhpcy51bmRlbGVnYXRlRXZlbnRzKCk7XG4gICAgaWYgKHRoaXMuc3RvcExpc3RlbmluZykgdGhpcy5zdG9wTGlzdGVuaW5nKCk7XG4gICAgaWYgKHRoaXMub2ZmKSB0aGlzLm9mZigpO1xuXG4gIC8vIERlc3Ryb3kgdGhpcyBkYXRhIG9iamVjdCdzIGxpbmVhZ2VcbiAgICBkZWxldGUgdGhpcy5fX3BhcmVudF9fO1xuICAgIGRlbGV0ZSB0aGlzLl9fcm9vdF9fO1xuICAgIGRlbGV0ZSB0aGlzLl9fcGF0aDtcblxuICAvLyBJZiB0aGVyZSBpcyBhIGRvbSBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGlzIGRhdGEgb2JqZWN0LCBkZXN0cm95IGFsbCBsaXN0ZW5lcnMgYXNzb2NpYXRlZCB3aXRoIGl0LlxuICAvLyBSZW1vdmUgYWxsIGV2ZW50IGxpc3RlbmVycyBmcm9tIHRoaXMgZG9tIGVsZW1lbnQsIHJlY3Vyc2l2ZWx5IHJlbW92ZSBlbGVtZW50IGxhenl2YWx1ZXMsXG4gIC8vIGFuZCB0aGVuIHJlbW92ZSB0aGUgZWxlbWVudCByZWZlcmFuY2UgaXRzZWxmLlxuICAgIGlmKHRoaXMuZWwpe1xuICAgICAgXy5lYWNoKHRoaXMuZWwuX19saXN0ZW5lcnMsIGZ1bmN0aW9uKGhhbmRsZXIsIGV2ZW50VHlwZSl7XG4gICAgICAgIGlmICh0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIpIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgaWYgKHRoaXMuZWwuZGV0YWNoRXZlbnQpIHRoaXMuZWwuZGV0YWNoRXZlbnQoJ29uJytldmVudFR5cGUsIGhhbmRsZXIpO1xuICAgICAgfSwgdGhpcyk7XG4gICAgICAkKHRoaXMuZWwpLndhbGtUaGVET00oZnVuY3Rpb24oZWwpe1xuICAgICAgICBpZihlbC5fX2xhenlWYWx1ZSAmJiBlbC5fX2xhenlWYWx1ZS5kZXN0cm95KCkpIG4uX19sYXp5VmFsdWUuZGVzdHJveSgpO1xuICAgICAgfSk7XG4gICAgICBkZWxldGUgdGhpcy5lbC5fX2xpc3RlbmVycztcbiAgICAgIGRlbGV0ZSB0aGlzLmVsLl9fZXZlbnRzO1xuICAgICAgZGVsZXRlIHRoaXMuJGVsO1xuICAgICAgZGVsZXRlIHRoaXMuZWw7XG4gICAgfVxuXG4gIC8vIENsZWFuIHVwIEhvb2sgY2FsbGJhY2sgcmVmZXJlbmNlc1xuICAgIGRlbGV0ZSB0aGlzLl9fb2JzZXJ2ZXJzO1xuXG4gIC8vIE1hcmsgYXMgZGVpbml0aWFsaXplZCBzbyB3ZSBkb24ndCBsb29wIG9uIGN5Y2xpYyBkZXBlbmRhbmNpZXMuXG4gICAgdGhpcy5kZWluaXRpYWxpemVkID0gdHJ1ZTtcblxuICAvLyBEZXN0cm95IGFsbCBjaGlsZHJlbiBvZiB0aGlzIGRhdGEgb2JqZWN0LlxuICAvLyBJZiBhIENvbGxlY3Rpb24sIGRlLWluaXQgYWxsIG9mIGl0cyBNb2RlbHMsIGlmIGEgTW9kZWwsIGRlLWluaXQgYWxsIG9mIGl0c1xuICAvLyBBdHRyaWJ1dGVzLCBpZiBhIENvbXB1dGVkIFByb3BlcnR5LCBkZS1pbml0IGl0cyBDYWNoZSBvYmplY3RzLlxuICAgIF8uZWFjaCh0aGlzLm1vZGVscywgZnVuY3Rpb24gKHZhbCkgeyB2YWwgJiYgdmFsLmRlaW5pdGlhbGl6ZSAmJiB2YWwuZGVpbml0aWFsaXplKCk7IH0pO1xuICAgIF8uZWFjaCh0aGlzLmF0dHJpYnV0ZXMsIGZ1bmN0aW9uICh2YWwpIHsgdmFsICYmIHZhbC5kZWluaXRpYWxpemUgJiYgdmFsLmRlaW5pdGlhbGl6ZSgpO30pO1xuICAgIHRoaXMuY2FjaGUgJiYgdGhpcy5jYWNoZS5jb2xsZWN0aW9uLmRlaW5pdGlhbGl6ZSgpO1xuICAgIHRoaXMuY2FjaGUgJiYgdGhpcy5jYWNoZS5tb2RlbC5kZWluaXRpYWxpemUoKTtcblxuICB9XG59O1xuXG4vLyBFeHRlbmQgYWxsIG9mIHRoZSAqKlJlYm91bmQgRGF0YSoqIHByb3RvdHlwZXMgd2l0aCB0aGVzZSBzaGFyZWQgbWV0aG9kc1xuXy5leHRlbmQoTW9kZWwucHJvdG90eXBlLCBzaGFyZWRNZXRob2RzKTtcbl8uZXh0ZW5kKENvbGxlY3Rpb24ucHJvdG90eXBlLCBzaGFyZWRNZXRob2RzKTtcbl8uZXh0ZW5kKENvbXB1dGVkUHJvcGVydHkucHJvdG90eXBlLCBzaGFyZWRNZXRob2RzKTtcblxuZXhwb3J0IHsgTW9kZWwsIENvbGxlY3Rpb24sIENvbXB1dGVkUHJvcGVydHkgfTtcbiIsIi8vIFJlYm91bmQgVXRpbHNcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxudmFyICQgPSBmdW5jdGlvbihxdWVyeSl7XG4gIHJldHVybiBuZXcgdXRpbHMocXVlcnkpO1xufTtcblxudmFyIHV0aWxzID0gZnVuY3Rpb24ocXVlcnkpe1xuICB2YXIgaSwgc2VsZWN0b3IgPSBfLmlzRWxlbWVudChxdWVyeSkgJiYgW3F1ZXJ5XSB8fCAocXVlcnkgPT09IGRvY3VtZW50KSAmJiBbZG9jdW1lbnRdIHx8IF8uaXNTdHJpbmcocXVlcnkpICYmIHF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpIHx8IFtdO1xuICB0aGlzLmxlbmd0aCA9IHNlbGVjdG9yLmxlbmd0aDtcblxuICAvLyBBZGQgc2VsZWN0b3IgdG8gb2JqZWN0IGZvciBtZXRob2QgY2hhaW5pbmdcbiAgZm9yIChpPTA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gc2VsZWN0b3JbaV07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uIHJldHVybkZhbHNlKCl7cmV0dXJuIGZhbHNlO31cbmZ1bmN0aW9uIHJldHVyblRydWUoKXtyZXR1cm4gdHJ1ZTt9XG5cbiQuRXZlbnQgPSBmdW5jdGlvbiggc3JjLCBwcm9wcyApIHtcblx0Ly8gQWxsb3cgaW5zdGFudGlhdGlvbiB3aXRob3V0IHRoZSAnbmV3JyBrZXl3b3JkXG5cdGlmICggISh0aGlzIGluc3RhbmNlb2YgJC5FdmVudCkgKSB7XG5cdFx0cmV0dXJuIG5ldyAkLkV2ZW50KCBzcmMsIHByb3BzICk7XG5cdH1cblxuXHQvLyBFdmVudCBvYmplY3Rcblx0aWYgKCBzcmMgJiYgc3JjLnR5cGUgKSB7XG5cdFx0dGhpcy5vcmlnaW5hbEV2ZW50ID0gc3JjO1xuXHRcdHRoaXMudHlwZSA9IHNyYy50eXBlO1xuXG5cdFx0Ly8gRXZlbnRzIGJ1YmJsaW5nIHVwIHRoZSBkb2N1bWVudCBtYXkgaGF2ZSBiZWVuIG1hcmtlZCBhcyBwcmV2ZW50ZWRcblx0XHQvLyBieSBhIGhhbmRsZXIgbG93ZXIgZG93biB0aGUgdHJlZTsgcmVmbGVjdCB0aGUgY29ycmVjdCB2YWx1ZS5cblx0XHR0aGlzLmlzRGVmYXVsdFByZXZlbnRlZCA9IHNyYy5kZWZhdWx0UHJldmVudGVkIHx8XG5cdFx0XHRcdHNyYy5kZWZhdWx0UHJldmVudGVkID09PSB1bmRlZmluZWQgJiZcblx0XHRcdFx0Ly8gU3VwcG9ydDogQW5kcm9pZDw0LjBcblx0XHRcdFx0c3JjLnJldHVyblZhbHVlID09PSBmYWxzZSA/XG5cdFx0XHRyZXR1cm5UcnVlIDpcblx0XHRcdHJldHVybkZhbHNlO1xuXG5cdC8vIEV2ZW50IHR5cGVcblx0fSBlbHNlIHtcblx0XHR0aGlzLnR5cGUgPSBzcmM7XG5cdH1cblxuXHQvLyBQdXQgZXhwbGljaXRseSBwcm92aWRlZCBwcm9wZXJ0aWVzIG9udG8gdGhlIGV2ZW50IG9iamVjdFxuXHRpZiAoIHByb3BzICkge1xuXHRcdF8uZXh0ZW5kKCB0aGlzLCBwcm9wcyApO1xuXHR9XG5cbiAgLy8gQ29weSBvdmVyIGFsbCBvcmlnaW5hbCBldmVudCBwcm9wZXJ0aWVzXG4gIF8uZXh0ZW5kKHRoaXMsIF8ucGljayggdGhpcy5vcmlnaW5hbEV2ZW50LCBbXG4gICAgICBcImFsdEtleVwiLCBcImJ1YmJsZXNcIiwgXCJjYW5jZWxhYmxlXCIsIFwiY3RybEtleVwiLCBcImN1cnJlbnRUYXJnZXRcIiwgXCJldmVudFBoYXNlXCIsXG4gICAgICBcIm1ldGFLZXlcIiwgXCJyZWxhdGVkVGFyZ2V0XCIsIFwic2hpZnRLZXlcIiwgXCJ0YXJnZXRcIiwgXCJ0aW1lU3RhbXBcIiwgXCJ2aWV3XCIsXG4gICAgICBcIndoaWNoXCIsIFwiY2hhclwiLCBcImNoYXJDb2RlXCIsIFwia2V5XCIsIFwia2V5Q29kZVwiLCBcImJ1dHRvblwiLCBcImJ1dHRvbnNcIixcbiAgICAgIFwiY2xpZW50WFwiLCBcImNsaWVudFlcIiwgXCJcIiwgXCJvZmZzZXRYXCIsIFwib2Zmc2V0WVwiLCBcInBhZ2VYXCIsIFwicGFnZVlcIiwgXCJzY3JlZW5YXCIsXG4gICAgICBcInNjcmVlbllcIiwgXCJ0b0VsZW1lbnRcIlxuICAgIF0pKTtcblxuXHQvLyBDcmVhdGUgYSB0aW1lc3RhbXAgaWYgaW5jb21pbmcgZXZlbnQgZG9lc24ndCBoYXZlIG9uZVxuXHR0aGlzLnRpbWVTdGFtcCA9IHNyYyAmJiBzcmMudGltZVN0YW1wIHx8IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG5cblx0Ly8gTWFyayBpdCBhcyBmaXhlZFxuXHR0aGlzLmlzRXZlbnQgPSB0cnVlO1xufTtcblxuJC5FdmVudC5wcm90b3R5cGUgPSB7XG5cdGNvbnN0cnVjdG9yOiAkLkV2ZW50LFxuXHRpc0RlZmF1bHRQcmV2ZW50ZWQ6IHJldHVybkZhbHNlLFxuXHRpc1Byb3BhZ2F0aW9uU3RvcHBlZDogcmV0dXJuRmFsc2UsXG5cdGlzSW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkOiByZXR1cm5GYWxzZSxcblxuXHRwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGUgPSB0aGlzLm9yaWdpbmFsRXZlbnQ7XG5cblx0XHR0aGlzLmlzRGVmYXVsdFByZXZlbnRlZCA9IHJldHVyblRydWU7XG5cblx0XHRpZiAoIGUgJiYgZS5wcmV2ZW50RGVmYXVsdCApIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cdH0sXG5cdHN0b3BQcm9wYWdhdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGUgPSB0aGlzLm9yaWdpbmFsRXZlbnQ7XG5cblx0XHR0aGlzLmlzUHJvcGFnYXRpb25TdG9wcGVkID0gcmV0dXJuVHJ1ZTtcblxuXHRcdGlmICggZSAmJiBlLnN0b3BQcm9wYWdhdGlvbiApIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fVxuXHR9LFxuXHRzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlID0gdGhpcy5vcmlnaW5hbEV2ZW50O1xuXG5cdFx0dGhpcy5pc0ltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCA9IHJldHVyblRydWU7XG5cblx0XHRpZiAoIGUgJiYgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKSB7XG5cdFx0XHRlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXHRcdH1cblxuXHRcdHRoaXMuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdH1cbn07XG5cblxudXRpbHMucHJvdG90eXBlID0ge1xuXG4gIC8vIEdpdmVuIGEgdmFsaWQgZGF0YSBwYXRoLCBzcGxpdCBpdCBpbnRvIGFuIGFycmF5IG9mIGl0cyBwYXJ0cy5cbiAgLy8gZXg6IGZvby5iYXJbMF0uYmF6IC0tPiBbJ2ZvbycsICd2YXInLCAnMCcsICdiYXonXVxuICBzcGxpdFBhdGg6IGZ1bmN0aW9uKHBhdGgpe1xuICAgIHBhdGggPSAoJy4nK3BhdGgrJy4nKS5zcGxpdCgvKD86XFwufFxcW3xcXF0pKy8pO1xuICAgIHBhdGgucG9wKCk7XG4gICAgcGF0aC5zaGlmdCgpO1xuICAgIHJldHVybiBwYXRoO1xuICB9LFxuXG4gIC8vIEFwcGxpZXMgZnVuY3Rpb24gYGZ1bmNgIGRlcHRoIGZpcnN0IHRvIGV2ZXJ5IG5vZGUgaW4gdGhlIHN1YnRyZWUgc3RhcnRpbmcgZnJvbSBgcm9vdGBcbiAgd2Fsa1RoZURPTTogZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciBlbCwgcm9vdCwgbGVuID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUobGVuLS0pe1xuICAgICAgcm9vdCA9IHRoaXNbbGVuXTtcbiAgICAgIGZ1bmMocm9vdCk7XG4gICAgICByb290ID0gcm9vdC5maXJzdENoaWxkO1xuICAgICAgd2hpbGUgKHJvb3QpIHtcbiAgICAgICAgICAkKHJvb3QpLndhbGtUaGVET00oZnVuYyk7XG4gICAgICAgICAgcm9vdCA9IHJvb3QubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vIEV2ZW50cyByZWdpc3RyeS4gQW4gb2JqZWN0IGNvbnRhaW5pbmcgYWxsIGV2ZW50cyBib3VuZCB0aHJvdWdoIHRoaXMgdXRpbCBzaGFyZWQgYW1vbmcgYWxsIGluc3RhbmNlcy5cbiAgX2V2ZW50czoge30sXG5cbiAgLy8gVGFrZXMgdGhlIHRhcmdlZCB0aGUgZXZlbnQgZmlyZWQgb24gYW5kIHJldHVybnMgYWxsIGNhbGxiYWNrcyBmb3IgdGhlIGRlbGVnYXRlZCBlbGVtZW50XG4gIF9oYXNEZWxlZ2F0ZTogZnVuY3Rpb24odGFyZ2V0LCBkZWxlZ2F0ZSwgZXZlbnRUeXBlKXtcbiAgICB2YXIgY2FsbGJhY2tzID0gW107XG5cbiAgICAvLyBHZXQgb3VyIGNhbGxiYWNrc1xuICAgIGlmKHRhcmdldC5kZWxlZ2F0ZUdyb3VwICYmIHRoaXMuX2V2ZW50c1t0YXJnZXQuZGVsZWdhdGVHcm91cF1bZXZlbnRUeXBlXSl7XG4gICAgICBfLmVhY2godGhpcy5fZXZlbnRzW3RhcmdldC5kZWxlZ2F0ZUdyb3VwXVtldmVudFR5cGVdLCBmdW5jdGlvbihjYWxsYmFja3NMaXN0LCBkZWxlZ2F0ZUlkKXtcbiAgICAgICAgaWYoXy5pc0FycmF5KGNhbGxiYWNrc0xpc3QpICYmIChkZWxlZ2F0ZUlkID09PSBkZWxlZ2F0ZS5kZWxlZ2F0ZUlkIHx8ICggZGVsZWdhdGUubWF0Y2hlc1NlbGVjdG9yICYmIGRlbGVnYXRlLm1hdGNoZXNTZWxlY3RvcihkZWxlZ2F0ZUlkKSApKSApe1xuICAgICAgICAgIGNhbGxiYWNrcyA9IGNhbGxiYWNrcy5jb25jYXQoY2FsbGJhY2tzTGlzdCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBjYWxsYmFja3M7XG4gIH0sXG5cbiAgLy8gVHJpZ2dlcnMgYW4gZXZlbnQgb24gYSBnaXZlbiBkb20gbm9kZVxuICB0cmlnZ2VyOiBmdW5jdGlvbihldmVudE5hbWUsIG9wdGlvbnMpe1xuICAgIHZhciBlbCwgbGVuID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUobGVuLS0pe1xuICAgICAgZWwgPSB0aGlzW2xlbl07XG4gICAgICBpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnQpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKTtcbiAgICAgICAgZXZlbnQuaW5pdEV2ZW50KGV2ZW50TmFtZSwgdHJ1ZSwgZmFsc2UpO1xuICAgICAgICBlbC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLmZpcmVFdmVudCgnb24nK2V2ZW50TmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIG9mZjogZnVuY3Rpb24oZXZlbnRUeXBlLCBoYW5kbGVyKXtcbiAgICB2YXIgZWwsIGxlbiA9IHRoaXMubGVuZ3RoLCBldmVudENvdW50O1xuXG4gICAgd2hpbGUobGVuLS0pe1xuXG4gICAgICBlbCA9IHRoaXNbbGVuXTtcbiAgICAgIGV2ZW50Q291bnQgPSAwO1xuXG4gICAgICBpZihlbC5kZWxlZ2F0ZUdyb3VwKXtcbiAgICAgICAgaWYodGhpcy5fZXZlbnRzW2VsLmRlbGVnYXRlR3JvdXBdW2V2ZW50VHlwZV0gJiYgXy5pc0FycmF5KHRoaXMuX2V2ZW50c1tlbC5kZWxlZ2F0ZUdyb3VwXVtldmVudFR5cGVdW2VsLmRlbGVnYXRlSWRdKSl7XG4gICAgICAgICAgXy5lYWNoKHRoaXMuX2V2ZW50c1tlbC5kZWxlZ2F0ZUdyb3VwXVtldmVudFR5cGVdLCBmdW5jdGlvbihkZWxlZ2F0ZSwgaW5kZXgsIGRlbGVnYXRlTGlzdCl7XG4gICAgICAgICAgICBfLmVhY2goZGVsZWdhdGVMaXN0LCBmdW5jdGlvbihjYWxsYmFjaywgaW5kZXgsIGNhbGxiYWNrTGlzdCl7XG4gICAgICAgICAgICAgIGlmKGNhbGxiYWNrID09PSBoYW5kbGVyKXtcbiAgICAgICAgICAgICAgICBkZWxldGUgY2FsbGJhY2tMaXN0W2luZGV4XTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZXZlbnRDb3VudCsrO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG1vcmUgb2YgdGhpcyBldmVudCB0eXBlIGRlbGVnYXRlZCBmb3IgdGhpcyBncm91cCwgcmVtb3ZlIHRoZSBsaXN0ZW5lclxuICAgICAgaWYgKGV2ZW50Q291bnQgPT09IDAgJiYgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcil7XG4gICAgICAgIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICBpZiAoZXZlbnRDb3VudCA9PT0gMCAmJiBlbC5kZXRhY2hFdmVudCl7XG4gICAgICAgIGVsLmRldGFjaEV2ZW50KCdvbicrZXZlbnRUeXBlLCBoYW5kbGVyKTtcbiAgICAgIH1cblxuICAgIH1cbiAgfSxcblxuICBvbjogZnVuY3Rpb24gKGV2ZW50TmFtZSwgZGVsZWdhdGUsIGRhdGEsIGhhbmRsZXIpIHtcbiAgICB2YXIgZWwsXG4gICAgICAgIGV2ZW50cyA9IHRoaXMuX2V2ZW50cyxcbiAgICAgICAgbGVuID0gdGhpcy5sZW5ndGgsXG4gICAgICAgIGV2ZW50TmFtZXMgPSBldmVudE5hbWUuc3BsaXQoJyAnKSxcbiAgICAgICAgZGVsZWdhdGVJZCwgZGVsZWdhdGVHcm91cDtcblxuICAgIHdoaWxlKGxlbi0tKXtcbiAgICAgIGVsID0gdGhpc1tsZW5dO1xuXG4gICAgICAvLyBOb3JtYWxpemUgZGF0YSBpbnB1dFxuICAgICAgaWYoXy5pc0Z1bmN0aW9uKGRlbGVnYXRlKSl7XG4gICAgICAgIGhhbmRsZXIgPSBkZWxlZ2F0ZTtcbiAgICAgICAgZGVsZWdhdGUgPSBlbDtcbiAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgfVxuICAgICAgaWYoXy5pc0Z1bmN0aW9uKGRhdGEpKXtcbiAgICAgICAgaGFuZGxlciA9IGRhdGE7XG4gICAgICAgIGRhdGEgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmKCFfLmlzU3RyaW5nKGRlbGVnYXRlKSAmJiAhXy5pc0VsZW1lbnQoZGVsZWdhdGUpKXtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkRlbGVnYXRlIHZhbHVlIHBhc3NlZCB0byBSZWJvdW5kJ3MgJC5vbiBpcyBuZWl0aGVyIGFuIGVsZW1lbnQgb3IgY3NzIHNlbGVjdG9yXCIpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGRlbGVnYXRlSWQgPSBfLmlzU3RyaW5nKGRlbGVnYXRlKSA/IGRlbGVnYXRlIDogKGRlbGVnYXRlLmRlbGVnYXRlSWQgPSBkZWxlZ2F0ZS5kZWxlZ2F0ZUlkIHx8IF8udW5pcXVlSWQoJ2V2ZW50JykpO1xuICAgICAgZGVsZWdhdGVHcm91cCA9IGVsLmRlbGVnYXRlR3JvdXAgPSAoZWwuZGVsZWdhdGVHcm91cCB8fCBfLnVuaXF1ZUlkKCdkZWxlZ2F0ZUdyb3VwJykpO1xuXG4gICAgICBfLmVhY2goZXZlbnROYW1lcywgZnVuY3Rpb24oZXZlbnROYW1lKXtcblxuICAgICAgICAvLyBFbnN1cmUgZXZlbnQgb2JqIGV4aXN0YW5jZVxuICAgICAgICBldmVudHNbZGVsZWdhdGVHcm91cF0gPSBldmVudHNbZGVsZWdhdGVHcm91cF0gfHwge307XG5cbiAgICAgICAgLy8gVE9ETzogdGFrZSBvdXQgb2YgbG9vcFxuICAgICAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgIHZhciB0YXJnZXQsIGksIGxlbiwgZXZlbnRMaXN0LCBjYWxsYmFja3MsIGNhbGxiYWNrLCBmYWxzeTtcbiAgICAgICAgICAgICAgZXZlbnQgPSBuZXcgJC5FdmVudCgoZXZlbnQgfHwgd2luZG93LmV2ZW50KSk7IC8vIENvbnZlcnQgdG8gbXV0YWJsZSBldmVudFxuICAgICAgICAgICAgICB0YXJnZXQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuc3JjRWxlbWVudDtcblxuICAgICAgICAgICAgICAvLyBUcmF2ZWwgZnJvbSB0YXJnZXQgdXAgdG8gcGFyZW50IGZpcmluZyBldmVudCBvbiBkZWxlZ2F0ZSB3aGVuIGl0IGV4aXp0c1xuICAgICAgICAgICAgICB3aGlsZSh0YXJnZXQpe1xuXG4gICAgICAgICAgICAgICAgLy8gR2V0IGFsbCBzcGVjaWZpZWQgY2FsbGJhY2tzIChlbGVtZW50IHNwZWNpZmljIGFuZCBzZWxlY3RvciBzcGVjaWZpZWQpXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzID0gJC5faGFzRGVsZWdhdGUoZWwsIHRhcmdldCwgZXZlbnQudHlwZSk7XG5cbiAgICAgICAgICAgICAgICBsZW4gPSBjYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldCA9IGV2ZW50LnNyY0VsZW1lbnQgPSB0YXJnZXQ7ICAgICAgICAgICAgICAgLy8gQXR0YWNoIHRoaXMgbGV2ZWwncyB0YXJnZXRcbiAgICAgICAgICAgICAgICAgIGV2ZW50LmRhdGEgPSBjYWxsYmFja3NbaV0uZGF0YTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXR0YWNoIG91ciBkYXRhIHRvIHRoZSBldmVudFxuICAgICAgICAgICAgICAgICAgZXZlbnQucmVzdWx0ID0gY2FsbGJhY2tzW2ldLmNhbGxiYWNrLmNhbGwoZWwsIGV2ZW50KTsgICAvLyBDYWxsIHRoZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgICAgZmFsc3kgPSAoIGV2ZW50LnJlc3VsdCA9PT0gZmFsc2UgKSA/IHRydWUgOiBmYWxzeTsgICAgICAvLyBJZiBhbnkgY2FsbGJhY2sgcmV0dXJucyBmYWxzZSwgbG9nIGl0IGFzIGZhbHN5XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSWYgYW55IG9mIHRoZSBjYWxsYmFja3MgcmV0dXJuZWQgZmFsc2UsIHByZXZlbnQgZGVmYXVsdCBhbmQgc3RvcCBwcm9wYWdhdGlvblxuICAgICAgICAgICAgICAgIGlmKGZhbHN5KXtcbiAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBldmVudCBvZiBpdHMgdHlwZSwgYWRkIHRoZSBldmVudCBoYW5kbGVyXG4gICAgICAgIC8vIEFkZEV2ZW50TGlzdGVuZXIgc3VwcG9ydHMgSUU5K1xuICAgICAgICBpZighZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV0pe1xuICAgICAgICAgIC8vIElmIGV2ZW50IGlzIGZvY3VzIG9yIGJsdXIsIHVzZSBjYXB0dXJlIHRvIGFsbG93IGZvciBldmVudCBkZWxlZ2F0aW9uLlxuICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBjYWxsYmFjaywgKGV2ZW50TmFtZSA9PT0gJ2ZvY3VzJyB8fCBldmVudE5hbWUgPT09ICdibHVyJykpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyBBZGQgb3VyIGxpc3RlbmVyXG4gICAgICAgIGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdID0gZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV0gfHwge307XG4gICAgICAgIGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdW2RlbGVnYXRlSWRdID0gZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV1bZGVsZWdhdGVJZF0gfHwgW107XG4gICAgICAgIGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdW2RlbGVnYXRlSWRdLnB1c2goe2NhbGxiYWNrOiBoYW5kbGVyLCBkYXRhOiBkYXRhfSk7XG5cbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cbiAgfSxcblxuICBmbGF0dGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZ1bmN0aW9uIHJlY3Vyc2UgKGN1ciwgcHJvcCkge1xuICAgICAgaWYgKE9iamVjdChjdXIpICE9PSBjdXIpIHtcbiAgICAgICAgcmVzdWx0W3Byb3BdID0gY3VyO1xuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGN1cikpIHtcbiAgICAgICAgZm9yKHZhciBpPTAsIGw9Y3VyLmxlbmd0aDsgaTxsOyBpKyspXG4gICAgICAgICAgcmVjdXJzZShjdXJbaV0sIHByb3AgKyBcIltcIiArIGkgKyBcIl1cIik7XG4gICAgICAgICAgaWYgKGwgPT09IDApXG4gICAgICAgICAgICByZXN1bHRbcHJvcF0gPSBbXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGlzRW1wdHkgPSB0cnVlO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBjdXIpIHtcbiAgICAgICAgICAgICAgaXNFbXB0eSA9IGZhbHNlO1xuICAgICAgICAgICAgICByZWN1cnNlKGN1cltwXSwgcHJvcCA/IHByb3ArXCIuXCIrcCA6IHApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzRW1wdHkgJiYgcHJvcClcbiAgICAgICAgICAgICAgcmVzdWx0W3Byb3BdID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlY3Vyc2UoZGF0YSwgXCJcIik7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICAvLyBodHRwOi8va3Jhc2ltaXJ0c29uZXYuY29tL2Jsb2cvYXJ0aWNsZS9Dcm9zcy1icm93c2VyLWhhbmRsaW5nLW9mLUFqYXgtcmVxdWVzdHMtaW4tYWJzdXJkanNcbiAgYWpheDogZnVuY3Rpb24ob3BzKSB7XG4gICAgICBpZih0eXBlb2Ygb3BzID09ICdzdHJpbmcnKSBvcHMgPSB7IHVybDogb3BzIH07XG4gICAgICBvcHMudXJsID0gb3BzLnVybCB8fCAnJztcbiAgICAgIG9wcy5qc29uID0gb3BzLmpzb24gfHwgdHJ1ZTtcbiAgICAgIG9wcy5tZXRob2QgPSBvcHMubWV0aG9kIHx8ICdnZXQnO1xuICAgICAgb3BzLmRhdGEgPSBvcHMuZGF0YSB8fCB7fTtcbiAgICAgIHZhciBnZXRQYXJhbXMgPSBmdW5jdGlvbihkYXRhLCB1cmwpIHtcbiAgICAgICAgICB2YXIgYXJyID0gW10sIHN0cjtcbiAgICAgICAgICBmb3IodmFyIG5hbWUgaW4gZGF0YSkge1xuICAgICAgICAgICAgICBhcnIucHVzaChuYW1lICsgJz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KGRhdGFbbmFtZV0pKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgc3RyID0gYXJyLmpvaW4oJyYnKTtcbiAgICAgICAgICBpZihzdHIgIT09ICcnKSB7XG4gICAgICAgICAgICAgIHJldHVybiB1cmwgPyAodXJsLmluZGV4T2YoJz8nKSA8IDAgPyAnPycgKyBzdHIgOiAnJicgKyBzdHIpIDogc3RyO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICB9O1xuICAgICAgdmFyIGFwaSA9IHtcbiAgICAgICAgICBob3N0OiB7fSxcbiAgICAgICAgICBwcm9jZXNzOiBmdW5jdGlvbihvcHMpIHtcbiAgICAgICAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAgICAgICB0aGlzLnhociA9IG51bGw7XG4gICAgICAgICAgICAgIGlmKHdpbmRvdy5BY3RpdmVYT2JqZWN0KSB7IHRoaXMueGhyID0gbmV3IEFjdGl2ZVhPYmplY3QoJ01pY3Jvc29mdC5YTUxIVFRQJyk7IH1cbiAgICAgICAgICAgICAgZWxzZSBpZih3aW5kb3cuWE1MSHR0cFJlcXVlc3QpIHsgdGhpcy54aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTsgfVxuICAgICAgICAgICAgICBpZih0aGlzLnhocikge1xuICAgICAgICAgICAgICAgICAgdGhpcy54aHIub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgaWYoc2VsZi54aHIucmVhZHlTdGF0ZSA9PSA0ICYmIHNlbGYueGhyLnN0YXR1cyA9PSAyMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdCA9IHNlbGYueGhyLnJlc3BvbnNlVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgaWYob3BzLmpzb24gPT09IHRydWUgJiYgdHlwZW9mIEpTT04gIT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdCA9IEpTT04ucGFyc2UocmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRvbmVDYWxsYmFjayAmJiBzZWxmLmRvbmVDYWxsYmFjay5hcHBseShzZWxmLmhvc3QsIFtyZXN1bHQsIHNlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wcy5zdWNjZXNzICYmIG9wcy5zdWNjZXNzLmFwcGx5KHNlbGYuaG9zdCwgW3Jlc3VsdCwgc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYoc2VsZi54aHIucmVhZHlTdGF0ZSA9PSA0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZmFpbENhbGxiYWNrICYmIHNlbGYuZmFpbENhbGxiYWNrLmFwcGx5KHNlbGYuaG9zdCwgW3NlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9wcy5lcnJvciAmJiBvcHMuZXJyb3IuYXBwbHkoc2VsZi5ob3N0LCBbc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgc2VsZi5hbHdheXNDYWxsYmFjayAmJiBzZWxmLmFsd2F5c0NhbGxiYWNrLmFwcGx5KHNlbGYuaG9zdCwgW3NlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICAgICAgb3BzLmNvbXBsZXRlICYmIG9wcy5jb21wbGV0ZS5hcHBseShzZWxmLmhvc3QsIFtzZWxmLnhocl0pO1xuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZihvcHMubWV0aG9kID09ICdnZXQnKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhoci5vcGVuKFwiR0VUXCIsIG9wcy51cmwgKyBnZXRQYXJhbXMob3BzLmRhdGEsIG9wcy51cmwpLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVycyh7XG4gICAgICAgICAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0J1xuICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhoci5vcGVuKG9wcy5tZXRob2QsIG9wcy51cmwsIHRydWUpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXJzKHtcbiAgICAgICAgICAgICAgICAgICAgICAnWC1SZXF1ZXN0ZWQtV2l0aCc6ICdYTUxIdHRwUmVxdWVzdCcsXG4gICAgICAgICAgICAgICAgICAgICAgJ0NvbnRlbnQtdHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZihvcHMuaGVhZGVycyAmJiB0eXBlb2Ygb3BzLmhlYWRlcnMgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuc2V0SGVhZGVycyhvcHMuaGVhZGVycyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgIG9wcy5tZXRob2QgPT0gJ2dldCcgPyBzZWxmLnhoci5zZW5kKCkgOiBzZWxmLnhoci5zZW5kKGdldFBhcmFtcyhvcHMuZGF0YSkpO1xuICAgICAgICAgICAgICB9LCAyMCk7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLnhocjtcbiAgICAgICAgICB9LFxuICAgICAgICAgIGRvbmU6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIHRoaXMuZG9uZUNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZmFpbDogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgdGhpcy5mYWlsQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBhbHdheXM6IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICAgICAgICAgIHRoaXMuYWx3YXlzQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBzZXRIZWFkZXJzOiBmdW5jdGlvbihoZWFkZXJzKSB7XG4gICAgICAgICAgICAgIGZvcih2YXIgbmFtZSBpbiBoZWFkZXJzKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhociAmJiB0aGlzLnhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIGhlYWRlcnNbbmFtZV0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgfTtcbiAgICAgIHJldHVybiBhcGkucHJvY2VzcyhvcHMpO1xuICB9XG59O1xuXG5fLmV4dGVuZCgkLCB1dGlscy5wcm90b3R5cGUpO1xuXG5cblxuZXhwb3J0IGRlZmF1bHQgJDtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
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
