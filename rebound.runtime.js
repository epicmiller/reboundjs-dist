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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInByb3BlcnR5LWNvbXBpbGVyL3Byb3BlcnR5LWNvbXBpbGVyLmpzIiwicmVib3VuZC1jb21waWxlci9yZWJvdW5kLWNvbXBpbGVyLmpzIiwicmVib3VuZC1jb21wb25lbnQvY29tcG9uZW50LmpzIiwicmVib3VuZC1kYXRhL2NvbGxlY3Rpb24uanMiLCJyZWJvdW5kLXByZWNvbXBpbGVyL3JlYm91bmQtcHJlY29tcGlsZXIuanMiLCJyZWJvdW5kLXJvdXRlci9yZWJvdW5kLXJvdXRlci5qcyIsInJ1bnRpbWUuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9oZWxwZXJzLmpzIiwicmVib3VuZC1kYXRhL2NvbXB1dGVkLXByb3BlcnR5LmpzIiwicHJvcGVydHktY29tcGlsZXIvdG9rZW5pemVyLmpzIiwicmVib3VuZC1jb21wb25lbnQvaG9va3MuanMiLCJyZWJvdW5kLWRhdGEvbW9kZWwuanMiLCJyZWJvdW5kLWNvbXBvbmVudC9sYXp5LXZhbHVlLmpzIiwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YS5qcyIsInJlYm91bmQtY29tcG9uZW50L3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztNQUdPLFNBQVM7O0FBRWhCLE1BQUksa0JBQWtCLEdBQUcsRUFBRSxDQUFDOzs7O0FBSTVCLFdBQVMsT0FBTyxDQUFDLElBQUksRUFBRSxJQUFJLEVBQUM7QUFDMUIsUUFBSSxNQUFNLEdBQUcsRUFBRSxDQUFDOztBQUVoQixRQUFHLElBQUksQ0FBQyxRQUFRLEVBQUUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDOztBQUV2QyxRQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsUUFBUSxFQUFFOztBQUNyQixhQUFTLEdBQUcsU0FBUyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUM7UUFDbkMsTUFBTSxHQUFHLEVBQUU7UUFDWCxLQUFLO1FBQ0wsYUFBYSxHQUFHLEVBQUU7UUFDbEIsVUFBVSxHQUFHLEVBQUU7UUFDZixPQUFPLEdBQUcsRUFBRTtRQUNaLEtB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TyxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDO01BQUUsTUFBTSxHQUFHLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBQyxDQUFDO0FBQzFHLE1BQUksU0FBUyxHQUFHLEVBQUMsT0FBTyxFQUFFLFVBQVUsRUFBQztNQUFFLFNBQVMsR0FBRyxFQUFDLE9BQU8sRUFBRSxVQUFVLEVBQUM7TUFBRSxRQUFRLEdBQUcsRUFBQyxPQUFPLEVBQUUsU0FBUyxFQUFDLENBQUM7QUFDMUcsTUFBSSxHQUFHLEdBQUcsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUM7TUFBRSxLQUFLLEdBQUcsRUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUNyRixNQUFJLFFBQVEsR0FBRyxFQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUM7TUFBRSxJQUFJLEdBQUcsRUFBQyxPQUFPLEVBQUUsS0FBSyxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUM7TUFBRSxTQUFTLEdBQUcsRUFBQyxPQUFPLEVBQUUsVUFBVSxFQUFDLENBQUM7QUFDOUcsTUFBSSxHQUFHLEdBQUcsRUFBQyxPQUFPLEVBQUUsSUFBSSxFQUFDO01BQUUsT0FBTyxHQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDO01BQUUsT0FBTyxHQUFHLEVBQUMsT0FBTyxFQUFFLFFBQVEsRUFBQyxDQUFDO0FBQzFHLE1BQUksTUFBTSxHQUFHLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDO01BQUUsSUFBSSxHQUFHLEVBQUMsT0FBTyxFQUFFLEtBQUssRUFBQztNQUFFLElBQUksR0FBRyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUMsQ0FBQztBQUNwRyxNQUFJLElBQUksR0FBRyxFQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUM7TUFBRSxNQUFNLEdBQUcsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFDLENBQUM7QUFDekQsTUFBSSxN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QUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUMvQyxNQUFJLFdBQVcsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQy9DLE1BQUksU0FBUyxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxVQUFVLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDN0MsTUFBSSxXQUFXLEdBQUcsRUFBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUMvQyxNQUFJLFNBQVMsR0FBRyxFQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDO0FBQzdDLE1BQUksUUFBUSxHQUFHLEVBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUMsQ0FBQztBQUMxRCxNQUFJLGVBQWUsR0FBRyxFQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsVUFBVSxFQUFFLElBQUksRUFBQyxDQUFDOzs7OztBQUtwRCxTQUFPLENBQUMsUUFBUSxHQUFHLEVBQUMsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU87QUFDMUUsVUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsTUFBTTtBQUMzRSxPQUFHLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxHQUFHO0FBQzNFLFFBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxPQUFPLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFB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T0FBTyxFQUFFO0FBQzFCLGVBQUksSUFBSSxJQUFJLElBQUksT0FBTyxFQUFFO0FBQ3JCLGdCQUFJLENBQUMsR0FBRyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1dBQzlEO1NBQ0o7T0FDSixDQUFDO0FBQ0YsYUFBTyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0tBQzNCO0dBQ0YsQ0FBQzs7QUFFRixHQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsU0FBUyxDQUFDLENBQUM7Ozs7bUJBSWQsQ0FBQyIsImZpbGUiOiJyZWJvdW5kLnJ1bnRpbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQcm9wZXJ0eSBDb21waWxlclxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgdG9rZW5pemVyIGZyb20gXCJwcm9wZXJ0eS1jb21waWxlci90b2tlbml6ZXJcIjtcblxudmFyIGNvbXB1dGVkUHJvcGVydGllcyA9IFtdO1xuXG4vLyBUT0RPOiBNYWtlIHRoaXMgZmFycnJycnIgbW9yZSByb2J1c3QuLi52ZXJ5IG1pbmltYWwgcmlnaHQgbm93XG5cbmZ1bmN0aW9uIGNvbXBpbGUocHJvcCwgbmFtZSl7XG4gIHZhciBvdXRwdXQgPSB7fTtcblxuICBpZihwcm9wLl9fcGFyYW1zKSByZXR1cm4gcHJvcC5fX3BhcmFtcztcblxuICB2YXIgc3RyID0gcHJvcC50b1N0cmluZygpLCAvLy5yZXBsYWNlKC8oPzpcXC9cXCooPzpbXFxzXFxTXSo/KVxcKlxcLyl8KD86KFtcXHM7XSkrXFwvXFwvKD86LiopJCkvZ20sICckMScpLCAvLyBTdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgZnVuY3Rpb24gc2FucyBjb21tZW50c1xuICAgICAgbmV4dFRva2VuID0gdG9rZW5pemVyLnRva2VuaXplKHN0ciksXG4gICAgICB0b2tlbnMgPSBbXSxcbiAgICAgIHRva2VuLFxuICAgICAgZmluaXNoZWRQYXRocyA9IFtdLFxuICAgICAgbmFtZWRQYXRocyA9IHt9LFxuICAgICAgb3Bjb2RlcyA9IFtdLFxuICAgICAgbmFtZWQgPSBmYWxzZSxcbiAgICAgIGxpc3RlbmluZyA9IDAsXG4gICAgICBpblN1YkNvbXBvbmVudCA9IDAsXG4gICAgICBzdWJDb21wb25lbnQgPSBbXSxcbiAgICAgIHJvb3QsXG4gICAgICBwYXRocyA9IFtdLFxuICAgICAgcGF0aCxcbiAgICAgIHRtcFBhdGgsXG4gICAgICBhdHRycyA9IFtdLFxuICAgICAgd29ya2luZ3BhdGggPSBbXSxcbiAgICAgIHRlcm1pbmF0b3JzID0gWyc7JywnLCcsJz09JywnPicsJzwnLCc+PScsJzw9JywnPj09JywnPD09JywnIT0nLCchPT0nLCAnPT09JywgJyYmJywgJ3x8JywgJysnLCAnLScsICcvJywgJyonLCAneycsICd9J107XG4gIGRve1xuXG4gICAgdG9rZW4gPSBuZXh0VG9rZW4oKTtcblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAndGhpcycpe1xuICAgICAgbGlzdGVuaW5nKys7XG4gICAgICB3b3JraW5ncGF0aCA9IFtdO1xuICAgIH1cblxuICAgIC8vIFRPRE86IGhhbmRsZSBnZXRzIG9uIGNvbGxlY3Rpb25zXG4gICAgaWYodG9rZW4udmFsdWUgPT09ICdnZXQnKXtcbiAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIHdoaWxlKF8uaXNVbmRlZmluZWQocGF0aC52YWx1ZSkpe1xuICAgICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICB9XG5cbiAgICAgIC8vIFJlcGxhY2UgYW55IGFjY2VzcyB0byBhIGNvbGxlY3Rpb24gd2l0aCB0aGUgZ2VuZXJpYyBAZWFjaCBwbGFjZWhvbGRlciBhbmQgcHVzaCBkZXBlbmRhbmN5XG4gICAgICB3b3JraW5ncGF0aC5wdXNoKHBhdGgudmFsdWUucmVwbGFjZSgvXFxbLitcXF0vZywgXCIuQGVhY2hcIikucmVwbGFjZSgvXlxcLi8sICcnKSk7XG4gICAgfVxuXG4gICAgaWYodG9rZW4udmFsdWUgPT09ICdwbHVjaycpe1xuICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgd2hpbGUoXy5pc1VuZGVmaW5lZChwYXRoLnZhbHVlKSl7XG4gICAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIH1cblxuICAgICAgd29ya2luZ3BhdGgucHVzaCgnQGVhY2guJyArIHBhdGgudmFsdWUpO1xuICAgIH1cblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAnc2xpY2UnIHx8IHRva2VuLnZhbHVlID09PSAnY2xvbmUnIHx8IHRva2VuLnZhbHVlID09PSAnZmlsdGVyJyl7XG4gICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICBpZihwYXRoLnR5cGUudHlwZSA9PT0gJygnKSB3b3JraW5ncGF0aC5wdXNoKCdAZWFjaCcpO1xuICAgIH1cblxuICAgIGlmKHRva2VuLnZhbHVlID09PSAnYXQnKXtcblxuICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgd2hpbGUoXy5pc1VuZGVmaW5lZChwYXRoLnZhbHVlKSl7XG4gICAgICAgIHBhdGggPSBuZXh0VG9rZW4oKTtcbiAgICAgIH1cbiAgICAgIC8vIHdvcmtpbmdwYXRoW3dvcmtpbmdwYXRoLmxlbmd0aCAtMV0gPSB3b3JraW5ncGF0aFt3b3JraW5ncGF0aC5sZW5ndGggLTFdICsgJ1snICsgcGF0aC52YWx1ZSArICddJztcbiAgICAgIC8vIHdvcmtpbmdwYXRoLnB1c2goJ1snICsgcGF0aC52YWx1ZSArICddJyk7XG4gICAgICB3b3JraW5ncGF0aC5wdXNoKCdAZWFjaCcpO1xuXG4gICAgfVxuXG4gICAgaWYodG9rZW4udmFsdWUgPT09ICd3aGVyZScgfHwgdG9rZW4udmFsdWUgPT09ICdmaW5kV2hlcmUnKXtcbiAgICAgIHdvcmtpbmdwYXRoLnB1c2goJ0BlYWNoJyk7XG4gICAgICBwYXRoID0gbmV4dFRva2VuKCk7XG4gICAgICBhdHRycyA9IFtdO1xuICAgICAgdmFyIGl0ciA9IDA7XG4gICAgICB3aGlsZShwYXRoLnR5cGUudHlwZSAhPT0gJyknKXtcbiAgICAgICAgaWYocGF0aC52YWx1ZSl7XG4gICAgICAgICAgaWYoaXRyJTIgPT09IDApe1xuICAgICAgICAgICAgYXR0cnMucHVzaChwYXRoLnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaXRyKys7XG4gICAgICAgIH1cbiAgICAgICAgcGF0aCA9IG5leHRUb2tlbigpO1xuICAgICAgfVxuICAgICAgd29ya2luZ3BhdGgucHVzaChhdHRycyk7XG4gICAgfVxuXG4gICAgaWYobGlzdGVuaW5nICYmIChfLmluZGV4T2YodGVybWluYXRvcnMsIHRva2VuLnR5cGUudHlwZSkgPiAtMSB8fCBfLmluZGV4T2YodGVybWluYXRvcnMsIHRva2VuLnZhbHVlKSA+IC0xKSl7XG4gICAgICB3b3JraW5ncGF0aCA9IF8ucmVkdWNlKHdvcmtpbmdwYXRoLCBmdW5jdGlvbihtZW1vLCBwYXRocyl7XG4gICAgICAgIHZhciBuZXdNZW1vID0gW107XG4gICAgICAgIHBhdGhzID0gKCFfLmlzQXJyYXkocGF0aHMpKSA/IFtwYXRoc10gOiBwYXRocztcbiAgICAgICAgXy5lYWNoKHBhdGhzLCBmdW5jdGlvbihwYXRoKXtcbiAgICAgICAgICBfLmVhY2gobWVtbywgZnVuY3Rpb24obWVtKXtcbiAgICAgICAgICAgIG5ld01lbW8ucHVzaChfLmNvbXBhY3QoW21lbSwgcGF0aF0pLmpvaW4oJy4nKS5yZXBsYWNlKCcuWycsICdbJykpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG5ld01lbW87XG4gICAgICB9LCBbJyddKTtcbiAgICAgIGZpbmlzaGVkUGF0aHMgPSBfLmNvbXBhY3QoXy51bmlvbihmaW5pc2hlZFBhdGhzLCB3b3JraW5ncGF0aCkpO1xuICAgICAgd29ya2luZ3BhdGggPSBbXTtcbiAgICAgIGxpc3RlbmluZy0tO1xuICAgIH1cblxuICB9IHdoaWxlKHRva2VuLnN0YXJ0ICE9PSB0b2tlbi5lbmQpO1xuXG4gIGNvbnNvbGUubG9nKCdDT01QVVRFRCBQUk9QRVJUWScsIG5hbWUsICdyZWdpc3RlcmVkIHdpdGggdGhlc2UgZGVwZW5kYW5jeSBwYXRoczonLCBmaW5pc2hlZFBhdGhzKTtcblxuICAvLyBSZXR1cm4gdGhlIGRlcGVuZGFuY2llcyBsaXN0XG4gIHJldHVybiBwcm9wLl9fcGFyYW1zID0gZmluaXNoZWRQYXRocztcblxufVxuXG5leHBvcnQgZGVmYXVsdCB7IGNvbXBpbGU6IGNvbXBpbGUgfTsiLCIvLyBSZWJvdW5kIENvbXBpbGVyXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCB7IGNvbXBpbGUgYXMgaHRtbGJhcnNDb21waWxlLCBjb21waWxlU3BlYyBhcyBodG1sYmFyc0NvbXBpbGVTcGVjIH0gZnJvbSBcImh0bWxiYXJzLWNvbXBpbGVyL2NvbXBpbGVyXCI7XG5pbXBvcnQgeyBtZXJnZSB9IGZyb20gXCJodG1sYmFycy11dGlsL29iamVjdC11dGlsc1wiO1xuaW1wb3J0IERPTUhlbHBlciBmcm9tIFwiZG9tLWhlbHBlclwiO1xuaW1wb3J0IGhlbHBlcnMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hlbHBlcnNcIjtcbmltcG9ydCBob29rcyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaG9va3NcIjtcblxuZnVuY3Rpb24gY29tcGlsZShzdHJpbmcsIG9wdGlvbnMpe1xuICAvLyBFbnN1cmUgd2UgaGF2ZSBhIHdlbGwtZm9ybWVkIG9iamVjdCBhcyB2YXIgb3B0aW9uc1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgb3B0aW9ucy5oZWxwZXJzID0gb3B0aW9ucy5oZWxwZXJzIHx8IHt9O1xuICBvcHRpb25zLmhvb2tzID0gb3B0aW9ucy5ob29rcyB8fCB7fTtcblxuICAvLyBNZXJnZSBvdXIgZGVmYXVsdCBoZWxwZXJzIHdpdGggdXNlciBwcm92aWRlZCBoZWxwZXJzXG4gIG9wdGlvbnMuaGVscGVycyA9IG1lcmdlKGhlbHBlcnMsIG9wdGlvbnMuaGVscGVycyk7XG4gIG9wdGlvbnMuaG9va3MgPSBtZXJnZShob29rcywgb3B0aW9ucy5ob29rcyk7XG5cbiAgLy8gQ29tcGlsZSBvdXIgdGVtcGxhdGUgZnVuY3Rpb25cbiAgdmFyIGZ1bmMgPSBodG1sYmFyc0NvbXBpbGUoc3RyaW5nLCB7XG4gICAgaGVscGVyczogb3B0aW9ucy5oZWxwZXJzLFxuICAgIGhvb2tzOiBvcHRpb25zLmhvb2tzXG4gIH0pO1xuXG4gIGZ1bmMuX3JlbmRlciA9IGZ1bmMucmVuZGVyO1xuXG4gIC8vIFJldHVybiBhIHdyYXBwZXIgZnVuY3Rpb24gdGhhdCB3aWxsIG1lcmdlIHVzZXIgcHJvdmlkZWQgaGVscGVycyB3aXRoIG91ciBkZWZhdWx0c1xuICBmdW5jLnJlbmRlciA9IGZ1bmN0aW9uKGRhdGEsIGVudiwgY29udGV4dCl7XG4gICAgLy8gRW5zdXJlIHdlIGhhdmUgYSB3ZWxsLWZvcm1lZCBvYmplY3QgYXMgdmFyIG9wdGlvbnNcbiAgICBlbnYgPSBlbnYgfHwge307XG4gICAgZW52LmhlbHBlcnMgPSBlbnYuaGVscGVycyB8fCB7fTtcbiAgICBlbnYuaG9va3MgPSBlbnYuaG9va3MgfHwge307XG4gICAgZW52LmRvbSA9IGVudi5kb20gfHwgbmV3IERPTUhlbHBlcigpO1xuXG4gICAgLy8gTWVyZ2Ugb3VyIGRlZmF1bHQgaGVscGVycyBhbmQgaG9va3Mgd2l0aCB1c2VyIHByb3ZpZGVkIGhlbHBlcnNcbiAgICBlbnYuaGVscGVycyA9IG1lcmdlKGhlbHBlcnMsIGVudi5oZWxwZXJzKTtcbiAgICBlbnYuaG9va3MgPSBtZXJnZShob29rcywgZW52Lmhvb2tzKTtcblxuICAgIC8vIFNldCBhIGRlZmF1bHQgY29udGV4dCBpZiBpdCBkb2Vzbid0IGV4aXN0XG4gICAgY29udGV4dCA9IGNvbnRleHQgfHwgZG9jdW1lbnQuYm9keTtcblxuICAgIC8vIENhbGwgb3VyIGZ1bmMgd2l0aCBtZXJnZWQgaGVscGVycyBhbmQgaG9va3NcbiAgICByZXR1cm4gZnVuYy5fcmVuZGVyKGRhdGEsIGVudiwgY29udGV4dCk7XG4gIH07XG5cbiAgaGVscGVycy5yZWdpc3RlclBhcnRpYWwoIG9wdGlvbnMubmFtZSwgZnVuYyk7XG5cbiAgcmV0dXJuIGZ1bmM7XG5cbn1cblxuZXhwb3J0IHsgY29tcGlsZSB9O1xuIiwiLy8gUmVib3VuZCBDb21wb25lbnRcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IERPTUhlbHBlciBmcm9tIFwiZG9tLWhlbHBlclwiO1xuaW1wb3J0IGhvb2tzIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9ob29rc1wiO1xuaW1wb3J0IGhlbHBlcnMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2hlbHBlcnNcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuaW1wb3J0IHsgTW9kZWwgfSBmcm9tIFwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YVwiO1xuXG5cbi8vIElmIEJhY2tib25lIGhhc24ndCBiZWVuIHN0YXJ0ZWQgeWV0LCB0aHJvdyBlcnJvclxuaWYoIXdpbmRvdy5CYWNrYm9uZSkgdGhyb3cgXCJCYWNrYm9uZSBtdXN0IGJlIG9uIHRoZSBwYWdlIGZvciBSZWJvdW5kIHRvIGxvYWQuXCI7XG5cbi8vIFJldHVybnMgdHJ1ZSBpZiBgc3RyYCBzdGFydHMgd2l0aCBgdGVzdGBcbmZ1bmN0aW9uIHN0YXJ0c1dpdGgoc3RyLCB0ZXN0KXtcbiAgaWYoc3RyID09PSB0ZXN0KSByZXR1cm4gdHJ1ZTtcbiAgc3RyID0gJC5zcGxpdFBhdGgoc3RyKTtcbiAgdGVzdCA9ICQuc3BsaXRQYXRoKHRlc3QpO1xuICB3aGlsZSh0ZXN0WzBdICYmIHN0clswXSl7XG4gICAgaWYoc3RyWzBdICE9PSB0ZXN0WzBdICYmIHN0clswXSAhPT0gJ0BlYWNoJyAmJiB0ZXN0WzBdICE9PSAnQGVhY2gnKSByZXR1cm4gZmFsc2U7XG4gICAgdGVzdC5zaGlmdCgpO1xuICAgIHN0ci5zaGlmdCgpO1xuICB9XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiByZW5kZXJDYWxsYmFjaygpe1xuICB2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX3RvUmVuZGVyLmxlbmd0aDtcbiAgZGVsZXRlIHRoaXMuX3JlbmRlclRpbWVvdXQ7XG4gIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICB0aGlzLl90b1JlbmRlci5zaGlmdCgpLm5vdGlmeSgpO1xuICB9XG4gIHRoaXMuX3RvUmVuZGVyLmFkZGVkID0ge307XG59XG5cbmZ1bmN0aW9uIGh5ZHJhdGUoc3BlYywgb3B0aW9ucyl7XG4gIC8vIFJldHVybiBhIHdyYXBwZXIgZnVuY3Rpb24gdGhhdCB3aWxsIG1lcmdlIHVzZXIgcHJvdmlkZWQgaGVscGVycyBhbmQgaG9va3Mgd2l0aCBvdXIgZGVmYXVsdHNcbiAgcmV0dXJuIGZ1bmN0aW9uKGRhdGEsIG9wdGlvbnMpe1xuXG4gICAgLy8gUmVib3VuZCdzIGRlZmF1bHQgZW52aXJvbm1lbnRcbiAgICAvLyBUaGUgYXBwbGljYXRpb24gZW52aXJvbm1lbnQgaXMgcHJvcGFnYXRlZCBkb3duIGVhY2ggcmVuZGVyIGNhbGwgYW5kXG4gICAgLy8gYXVnbWVudGVkIHdpdGggaGVscGVycyBhcyBpdCBnb2VzXG4gICAgdmFyIGVudiA9IHtcbiAgICAgIGhlbHBlcnM6IGhlbHBlcnMuaGVscGVycyxcbiAgICAgIGhvb2tzOiBob29rcyxcbiAgICAgIGRvbTogbmV3IERPTUhlbHBlcigpLFxuICAgICAgdXNlRnJhZ21lbnRDYWNoZTogdHJ1ZVxuICAgIH07XG5cbiAgICAvLyBFbnN1cmUgd2UgaGF2ZSBhIGNvbnRleHR1YWwgZWxlbWVudCB0byBwYXNzIHRvIHJlbmRlclxuICAgIHZhciBjb250ZXh0RWxlbWVudCA9IGRhdGEuZWwgfHwgZG9jdW1lbnQuYm9keTtcblxuICAgIC8vIE1lcmdlIG91ciBkZWZhdWx0IGhlbHBlcnMgYW5kIGhvb2tzIHdpdGggdXNlciBwcm92aWRlZCBoZWxwZXJzXG4gICAgZW52LmhlbHBlcnMgPSBfLmRlZmF1bHRzKChvcHRpb25zLmhlbHBlcnMgfHwge30pLCBlbnYuaGVscGVycyk7XG4gICAgZW52Lmhvb2tzID0gXy5kZWZhdWx0cygob3B0aW9ucy5ob29rcyB8fCB7fSksIGVudi5ob29rcyk7XG5cbiAgICAvLyBDYWxsIG91ciBmdW5jIHdpdGggbWVyZ2VkIGhlbHBlcnMgYW5kIGhvb2tzXG4gICAgcmV0dXJuIHNwZWMucmVuZGVyKGRhdGEsIGVudiwgY29udGV4dEVsZW1lbnQpO1xuICB9O1xufTtcblxuXG4vLyBOZXcgQmFja2JvbmUgQ29tcG9uZW50XG52YXIgQ29tcG9uZW50ID0gTW9kZWwuZXh0ZW5kKHtcblxuICBpc0NvbXBvbmVudDogdHJ1ZSxcblxuICBfY2FsbE9uQ29tcG9uZW50OiBmdW5jdGlvbihuYW1lLCBldmVudCl7XG4gICAgaWYoIV8uaXNGdW5jdGlvbih0aGlzW25hbWVdKSl7IHRocm93IFwiRVJST1I6IE5vIG1ldGhvZCBuYW1lZCBcIiArIG5hbWUgKyBcIiBvbiBjb21wb25lbnQgXCIgKyB0aGlzLl9fbmFtZSArIFwiIVwiOyB9XG4gICAgcmV0dXJuIHRoaXNbbmFtZV0uY2FsbCh0aGlzLCBldmVudCk7XG4gIH0sXG5cbiAgX2xpc3RlblRvU2VydmljZTogZnVuY3Rpb24oa2V5LCBzZXJ2aWNlKXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdGhpcy5saXN0ZW5UbyhzZXJ2aWNlLCAnYWxsJywgKHR5cGUsIG1vZGVsLCB2YWx1ZSwgb3B0aW9ucykgPT4ge1xuICAgICAgdmFyIGF0dHIsXG4gICAgICAgICAgcGF0aCA9IG1vZGVsLl9fcGF0aCgpLFxuICAgICAgICAgIGNoYW5nZWQ7XG4gICAgICBpZih0eXBlLmluZGV4T2YoJ2NoYW5nZTonKSA9PT0gMCl7XG4gICAgICAgIGNoYW5nZWQgPSBtb2RlbC5jaGFuZ2VkQXR0cmlidXRlcygpO1xuICAgICAgICBmb3IoYXR0ciBpbiBjaGFuZ2VkKXtcbiAgICAgICAgICAvLyBUT0RPOiBNb2RpZnlpbmcgYXJndW1lbnRzIGFycmF5IGlzIGJhZC4gY2hhbmdlIHRoaXNcbiAgICAgICAgICB0eXBlID0gKCdjaGFuZ2U6JyArIGtleSArICcuJyArIHBhdGggKyAocGF0aCAmJiAnLicpICsgYXR0cik7IC8vIGpzaGludCBpZ25vcmU6bGluZVxuICAgICAgICAgIG9wdGlvbnMuc2VydmljZSA9IGtleTtcbiAgICAgICAgICB0aGlzLnRyaWdnZXIuY2FsbCh0aGlzLCB0eXBlLCBtb2RlbCwgdmFsdWUsIG9wdGlvbnMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0aGlzLnRyaWdnZXIuY2FsbCh0aGlzLCB0eXBlLCBtb2RlbCwgdmFsdWUsIG9wdGlvbnMpO1xuICAgIH0pO1xuICB9LFxuXG4gIGRlaW5pdGlhbGl6ZTogZnVuY3Rpb24oKXtcbiAgICBpZih0aGlzLmNvbnN1bWVycy5sZW5ndGgpIHJldHVybjtcbiAgICBfLmVhY2godGhpcy5zZXJ2aWNlcywgKHNlcnZpY2UsIGtleSkgPT4ge1xuICAgICAgXy5lYWNoKHNlcnZpY2UuY29uc3VtZXJzLCAoY29uc3VtZXIsIGluZGV4KSA9PiB7XG4gICAgICAgIGlmKGNvbnN1bWVyLmNvbXBvbmVudCA9PT0gdGhpcykgc2VydmljZS5jb25zdW1lcnMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIGRlbGV0ZSB0aGlzLnNlcnZpY2VzO1xuICAgIFJlYm91bmQuTW9kZWwucHJvdG90eXBlLmRlaW5pdGlhbGl6ZS5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICB9LFxuXG4gIC8vIFNldCBpcyBvdmVycmlkZGVuIG9uIGNvbXBvbmVudHMgdG8gYWNjZXB0IGNvbXBvbmVudHMgYXMgYSB2YWxpZCBpbnB1dCB0eXBlLlxuICAvLyBDb21wb25lbnRzIHNldCBvbiBvdGhlciBDb21wb25lbnRzIGFyZSBtaXhlZCBpbiBhcyBhIHNoYXJlZCBvYmplY3QuIHtyYXc6IHRydWV9XG4gIC8vIEl0IGFsc28gbWFya3MgaXRzZWxmIGFzIGEgY29uc3VtZXIgb2YgdGhpcyBjb21wb25lbnRcbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbCwgb3B0aW9ucyl7XG4gICAgdmFyIGF0dHJzLCBhdHRyLCBzZXJ2aWNlT3B0aW9ucztcbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGF0dHJzID0gKGtleS5pc01vZGVsKSA/IGtleS5hdHRyaWJ1dGVzIDoga2V5O1xuICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICB9IGVsc2UgKGF0dHJzID0ge30pW2tleV0gPSB2YWw7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICAgIC8vIElmIHJlc2V0IG9wdGlvbiBwYXNzZWQsIGRvIGEgcmVzZXQuIElmIG5vdGhpbmcgcGFzc2VkLCByZXR1cm4uXG4gICAgaWYob3B0aW9ucy5yZXNldCA9PT0gdHJ1ZSkgcmV0dXJuIHRoaXMucmVzZXQoYXR0cnMsIG9wdGlvbnMpO1xuICAgIGlmKG9wdGlvbnMuZGVmYXVsdHMgPT09IHRydWUpIHRoaXMuZGVmYXVsdHMgPSBhdHRycztcbiAgICBpZihfLmlzRW1wdHkoYXR0cnMpKSByZXR1cm47XG5cbiAgICAvLyBGb3IgZWFjaCBhdHRyaWJ1dGUgcGFzc2VkOlxuICAgIGZvcihrZXkgaW4gYXR0cnMpe1xuICAgICAgYXR0ciA9IGF0dHJzW2tleV07XG4gICAgICBpZihhdHRyICYmIGF0dHIuaXNDb21wb25lbnQpe1xuICAgICAgICBzZXJ2aWNlT3B0aW9ucyB8fCAoc2VydmljZU9wdGlvbnMgPSBfLmRlZmF1bHRzKF8uY2xvbmUob3B0aW9ucyksIHtyYXc6IHRydWV9KSk7XG4gICAgICAgIGF0dHIuY29uc3VtZXJzLnB1c2goe2tleToga2V5LCBjb21wb25lbnQ6IHRoaXN9KTtcbiAgICAgICAgdGhpcy5zZXJ2aWNlc1trZXldID0gYXR0cjtcbiAgICAgICAgdGhpcy5fbGlzdGVuVG9TZXJ2aWNlKGtleSwgYXR0cik7XG4gICAgICAgIFJlYm91bmQuTW9kZWwucHJvdG90eXBlLnNldC5jYWxsKHRoaXMsIGtleSwgYXR0ciwgc2VydmljZU9wdGlvbnMpO1xuICAgICAgfVxuICAgICAgUmVib3VuZC5Nb2RlbC5wcm90b3R5cGUuc2V0LmNhbGwodGhpcywga2V5LCBhdHRyLCBvcHRpb25zKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKG9wdGlvbnMpe1xuICAgIHZhciBrZXksIGF0dHIsIHNlbGYgPSB0aGlzO1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIF8uYmluZEFsbCh0aGlzLCAnX2NhbGxPbkNvbXBvbmVudCcsICdfbGlzdGVuVG9TZXJ2aWNlJyk7XG4gICAgdGhpcy5jaWQgPSBfLnVuaXF1ZUlkKCdjb21wb25lbnQnKTtcbiAgICB0aGlzLmF0dHJpYnV0ZXMgPSB7fTtcbiAgICB0aGlzLmNoYW5nZWQgPSB7fTtcbiAgICB0aGlzLmhlbHBlcnMgPSB7fTtcbiAgICB0aGlzLmNvbnN1bWVycyA9IFtdO1xuICAgIHRoaXMuc2VydmljZXMgPSB7fTtcbiAgICB0aGlzLl9fcGFyZW50X18gPSB0aGlzLl9fcm9vdF9fID0gdGhpcztcbiAgICB0aGlzLmxpc3RlblRvKHRoaXMsICdhbGwnLCB0aGlzLl9vbkNoYW5nZSk7XG5cbiAgICAvLyBUYWtlIG91ciBwYXJzZWQgZGF0YSBhbmQgYWRkIGl0IHRvIG91ciBiYWNrYm9uZSBkYXRhIHN0cnVjdHVyZS4gRG9lcyBhIGRlZXAgZGVmYXVsdHMgc2V0LlxuICAgIC8vIEluIHRoZSBtb2RlbCwgcHJpbWF0aXZlcyAoYXJyYXlzLCBvYmplY3RzLCBldGMpIGFyZSBjb252ZXJ0ZWQgdG8gQmFja2JvbmUgT2JqZWN0c1xuICAgIC8vIEZ1bmN0aW9ucyBhcmUgY29tcGlsZWQgdG8gZmluZCB0aGVpciBkZXBlbmRhbmNpZXMgYW5kIGFkZGVkIGFzIGNvbXB1dGVkIHByb3BlcnRpZXNcbiAgICAvLyBTZXQgb3VyIGNvbXBvbmVudCdzIGNvbnRleHQgd2l0aCB0aGUgcGFzc2VkIGRhdGEgbWVyZ2VkIHdpdGggdGhlIGNvbXBvbmVudCdzIGRlZmF1bHRzXG4gICAgdGhpcy5zZXQoKHRoaXMuZGVmYXVsdHMgfHwge30pKTtcbiAgICB0aGlzLnNldCgob3B0aW9ucy5kYXRhIHx8IHt9KSk7XG5cbiAgICAvLyBDYWxsIG9uIGNvbXBvbmVudCBpcyB1c2VkIGJ5IHRoZSB7e29ufX0gaGVscGVyIHRvIGNhbGwgYWxsIGV2ZW50IGNhbGxiYWNrcyBpbiB0aGUgc2NvcGUgb2YgdGhlIGNvbXBvbmVudFxuICAgIHRoaXMuaGVscGVycy5fY2FsbE9uQ29tcG9uZW50ID0gdGhpcy5fY2FsbE9uQ29tcG9uZW50O1xuXG5cbiAgICAvLyBHZXQgYW55IGFkZGl0aW9uYWwgcm91dGVzIHBhc3NlZCBpbiBmcm9tIG9wdGlvbnNcbiAgICB0aGlzLnJvdXRlcyA9ICBfLmRlZmF1bHRzKChvcHRpb25zLnJvdXRlcyB8fCB7fSksIHRoaXMucm91dGVzKTtcbiAgICAvLyBFbnN1cmUgdGhhdCBhbGwgcm91dGUgZnVuY3Rpb25zIGV4aXN0XG4gICAgXy5lYWNoKHRoaXMucm91dGVzLCBmdW5jdGlvbih2YWx1ZSwga2V5LCByb3V0ZXMpe1xuICAgICAgICBpZih0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnKXsgdGhyb3coJ0Z1bmN0aW9uIG5hbWUgcGFzc2VkIHRvIHJvdXRlcyBpbiAgJyArIHRoaXMuX19uYW1lICsgJyBjb21wb25lbnQgbXVzdCBiZSBhIHN0cmluZyEnKTsgfVxuICAgICAgICBpZighdGhpc1t2YWx1ZV0peyB0aHJvdygnQ2FsbGJhY2sgZnVuY3Rpb24gJyt2YWx1ZSsnIGRvZXMgbm90IGV4aXN0IG9uIHRoZSAgJyArIHRoaXMuX19uYW1lICsgJyBjb21wb25lbnQhJyk7IH1cbiAgICB9LCB0aGlzKTtcblxuICAgIC8vIE91ciBDb21wb25lbnQgaXMgZnVsbHkgY3JlYXRlZCBub3csIGJ1dCBub3QgcmVuZGVyZWQuIENhbGwgY3JlYXRlZCBjYWxsYmFjay5cbiAgICBpZihfLmlzRnVuY3Rpb24odGhpcy5jcmVhdGVkQ2FsbGJhY2spKXtcbiAgICAgIHRoaXMuY3JlYXRlZENhbGxiYWNrLmNhbGwodGhpcyk7XG4gICAgfVxuXG4gICAgLy8gU2V0IG91ciBvdXRsZXQgYW5kIHRlbXBsYXRlIGlmIHdlIGhhdmUgdGhlbVxuICAgIHRoaXMuZWwgPSBvcHRpb25zLm91dGxldCB8fCBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgdGhpcy4kZWwgPSAoXy5pc1VuZGVmaW5lZCh3aW5kb3cuQmFja2JvbmUuJCkpID8gZmFsc2UgOiB3aW5kb3cuQmFja2JvbmUuJCh0aGlzLmVsKTtcbiAgICB0aGlzLnRlbXBsYXRlID0gb3B0aW9ucy50ZW1wbGF0ZSB8fCB0aGlzLnRlbXBsYXRlO1xuXG4gICAgLy8gVGFrZSBvdXIgcHJlY29tcGlsZWQgdGVtcGxhdGUgYW5kIGh5ZHJhdGVzIGl0LiBXaGVuIFJlYm91bmQgQ29tcGlsZXIgaXMgaW5jbHVkZWQsIGNhbiBiZSBhIGhhbmRsZWJhcnMgdGVtcGxhdGUgc3RyaW5nLlxuICAgIC8vIFRPRE86IENoZWNrIGlmIHRlbXBsYXRlIGlzIGEgc3RyaW5nLCBhbmQgaWYgdGhlIGNvbXBpbGVyIGV4aXN0cyBvbiB0aGUgcGFnZSwgYW5kIGNvbXBpbGUgaWYgbmVlZGVkXG4gICAgaWYodGhpcy50ZW1wbGF0ZSl7XG4gICAgICB0aGlzLnRlbXBsYXRlID0gKHR5cGVvZiB0aGlzLnRlbXBsYXRlID09PSAnb2JqZWN0JykgPyBoeWRyYXRlKHRoaXMudGVtcGxhdGUpIDogdGhpcy50ZW1wbGF0ZTtcblxuICAgICAgLy8gUmVuZGVyIG91ciBkb20gYW5kIHBsYWNlIHRoZSBkb20gaW4gb3VyIGN1c3RvbSBlbGVtZW50XG4gICAgICAvLyBUZW1wbGF0ZSBhY2NlcHRzIFtkYXRhLCBvcHRpb25zLCBjb250ZXh0dWFsRWxlbWVudF1cbiAgICAgIHRoaXMuZWwuYXBwZW5kQ2hpbGQodGhpcy50ZW1wbGF0ZSh0aGlzLCB7aGVscGVyczogdGhpcy5oZWxwZXJzfSwgdGhpcy5lbCkpO1xuXG4gICAgICAvLyBBZGQgYWN0aXZlIGNsYXNzIHRvIHRoaXMgbmV3bHkgcmVuZGVyZWQgdGVtcGxhdGUncyBsaW5rIGVsZW1lbnRzIHRoYXQgcmVxdWlyZSBpdFxuICAgICAgJCh0aGlzLmVsKS5tYXJrTGlua3MoKTtcbiAgICB9XG5cbiAgICB0aGlzLmluaXRpYWxpemUoKTtcblxuICB9LFxuXG4gICQ6IGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgaWYoIXRoaXMuJGVsKXtcbiAgICAgIHJldHVybiBjb25zb2xlLmVycm9yKCdObyBET00gbWFuaXB1bGF0aW9uIGxpYnJhcnkgb24gdGhlIHBhZ2UhJyk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLiRlbC5maW5kKHNlbGVjdG9yKTtcbiAgfSxcblxuICAvLyBUcmlnZ2VyIGFsbCBldmVudHMgb24gYm90aCB0aGUgY29tcG9uZW50IGFuZCB0aGUgZWxlbWVudFxuICB0cmlnZ2VyOiBmdW5jdGlvbihldmVudE5hbWUpe1xuICAgIGlmKHRoaXMuZWwpe1xuICAgICAgJCh0aGlzLmVsKS50cmlnZ2VyKGV2ZW50TmFtZSwgYXJndW1lbnRzKTtcbiAgICB9XG4gICAgQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLnRyaWdnZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgfSxcblxuICBfb25BdHRyaWJ1dGVDaGFuZ2U6IGZ1bmN0aW9uKGF0dHJOYW1lLCBvbGRWYWwsIG5ld1ZhbCl7XG4gICAgLy8gQ29tbWVudGVkIG91dCBiZWNhdXNlIHRyYWNraW5nIGF0dHJpYnV0ZSBjaGFuZ2VzIGFuZCBtYWtpbmcgc3VyZSB0aGV5IGRvbnQgaW5maW5pdGUgbG9vcCBpcyBoYXJkLlxuICAgIC8vIFRPRE86IE1ha2Ugd29yay5cbiAgICAvLyB0cnl7IG5ld1ZhbCA9IEpTT04ucGFyc2UobmV3VmFsKTsgfSBjYXRjaCAoZSl7IG5ld1ZhbCA9IG5ld1ZhbDsgfVxuICAgIC8vXG4gICAgLy8gLy8gZGF0YSBhdHRyaWJ1dGVzIHNob3VsZCBiZSByZWZlcmFuY2VkIGJ5IHRoZWlyIGNhbWVsIGNhc2UgbmFtZVxuICAgIC8vIGF0dHJOYW1lID0gYXR0ck5hbWUucmVwbGFjZSgvXmRhdGEtL2csIFwiXCIpLnJlcGxhY2UoLy0oW2Etel0pL2csIGZ1bmN0aW9uIChnKSB7IHJldHVybiBnWzFdLnRvVXBwZXJDYXNlKCk7IH0pO1xuICAgIC8vXG4gICAgLy8gb2xkVmFsID0gdGhpcy5nZXQoYXR0ck5hbWUpO1xuICAgIC8vXG4gICAgLy8gaWYobmV3VmFsID09PSBudWxsKXsgdGhpcy51bnNldChhdHRyTmFtZSk7IH1cbiAgICAvL1xuICAgIC8vIC8vIElmIG9sZFZhbCBpcyBhIG51bWJlciwgYW5kIG5ld1ZhbCBpcyBvbmx5IG51bWVyaWNhbCwgcHJlc2VydmUgdHlwZVxuICAgIC8vIGlmKF8uaXNOdW1iZXIob2xkVmFsKSAmJiBfLmlzU3RyaW5nKG5ld1ZhbCkgJiYgbmV3VmFsLm1hdGNoKC9eWzAtOV0qJC9pKSl7XG4gICAgLy8gICBuZXdWYWwgPSBwYXJzZUludChuZXdWYWwpO1xuICAgIC8vIH1cbiAgICAvL1xuICAgIC8vIGVsc2V7IHRoaXMuc2V0KGF0dHJOYW1lLCBuZXdWYWwsIHtxdWlldDogdHJ1ZX0pOyB9XG4gIH0sXG5cblxuICBfb25DaGFuZ2U6IGZ1bmN0aW9uKHR5cGUsIG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKXtcbiAgICB2YXIgc2hvcnRjaXJjdWl0ID0geyBjaGFuZ2U6IDEsIHNvcnQ6IDEsIHJlcXVlc3Q6IDEsIGRlc3Ryb3k6IDEsIHN5bmM6IDEsIGVycm9yOiAxLCBpbnZhbGlkOiAxLCByb3V0ZTogMSwgZGlydHk6IDEgfTtcbiAgICBpZiggc2hvcnRjaXJjdWl0W3R5cGVdICkgcmV0dXJuO1xuXG4gICAgdmFyIGRhdGEsIGNoYW5nZWQ7XG4gICAgbW9kZWwgfHwgKG1vZGVsID0ge30pO1xuICAgIGNvbGxlY3Rpb24gfHwgKGNvbGxlY3Rpb24gPSB7fSk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICAhY29sbGVjdGlvbi5pc0RhdGEgJiYgKHR5cGUuaW5kZXhPZignY2hhbmdlOicpID09PSAtMSkgJiYgKG9wdGlvbnMgPSBjb2xsZWN0aW9uKSAmJiAoY29sbGVjdGlvbiA9IG1vZGVsKTtcbiAgICB0aGlzLl90b1JlbmRlciB8fCAodGhpcy5fdG9SZW5kZXIgPSBbXSk7XG5cbiAgICBpZiggKHR5cGUgPT09ICdyZXNldCcgJiYgb3B0aW9ucy5wcmV2aW91c0F0dHJpYnV0ZXMpIHx8IHR5cGUuaW5kZXhPZignY2hhbmdlOicpICE9PSAtMSl7XG4gICAgICBkYXRhID0gbW9kZWw7XG4gICAgICBjaGFuZ2VkID0gbW9kZWwuY2hhbmdlZEF0dHJpYnV0ZXMoKTtcbiAgICB9XG4gICAgZWxzZSBpZih0eXBlID09PSAnYWRkJyB8fCB0eXBlID09PSAncmVtb3ZlJyB8fCAodHlwZSA9PT0gJ3Jlc2V0JyAmJiBvcHRpb25zLnByZXZpb3VzTW9kZWxzKSl7XG4gICAgICBkYXRhID0gY29sbGVjdGlvbjtcbiAgICAgIGNoYW5nZWQgPSB7XG4gICAgICAgICdAZWFjaCc6IGRhdGFcbiAgICAgIH07XG4gICAgfVxuXG4gICAgaWYoIWRhdGEgfHwgIWNoYW5nZWQpIHJldHVybjtcblxuICAgIHZhciBwdXNoID0gZnVuY3Rpb24oYXJyKXtcbiAgICAgIHZhciBpLCBsZW4gPSBhcnIubGVuZ3RoO1xuICAgICAgdGhpcy5hZGRlZCB8fCAodGhpcy5hZGRlZCA9IHt9KTtcbiAgICAgIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICAgICAgaWYodGhpcy5hZGRlZFthcnJbaV0uY2lkXSkgY29udGludWU7XG4gICAgICAgIHRoaXMuYWRkZWRbYXJyW2ldLmNpZF0gPSAxO1xuICAgICAgICB0aGlzLnB1c2goYXJyW2ldKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHZhciBjb250ZXh0ID0gdGhpcztcbiAgICB2YXIgYmFzZVBhdGggPSBkYXRhLl9fcGF0aCgpO1xuICAgIC8vIElmIHRoaXMgZXZlbnQgY2FtZSBmcm9tIHdpdGhpbiBhIHNlcnZpY2UsIGluY2x1ZGUgdGhlIHNlcnZpY2Uga2V5IGluIHRoZSBiYXNlIHBhdGhcbiAgICBpZihvcHRpb25zLnNlcnZpY2UpIGJhc2VQYXRoID0gb3B0aW9ucy5zZXJ2aWNlICsgJy4nICsgYmFzZVBhdGg7XG4gICAgdmFyIHBhcnRzID0gJC5zcGxpdFBhdGgoYmFzZVBhdGgpO1xuICAgIHZhciBrZXksIG9ic1BhdGgsIHBhdGgsIG9ic2VydmVycztcblxuICAgIC8vIEZvciBlYWNoIGNoYW5nZWQga2V5LCB3YWxrIGRvd24gdGhlIGRhdGEgdHJlZSBmcm9tIHRoZSByb290IHRvIHRoZSBkYXRhXG4gICAgLy8gZWxlbWVudCB0aGF0IHRyaWdnZXJlZCB0aGUgZXZlbnQgYW5kIGFkZCBhbGwgcmVsZXZlbnQgY2FsbGJhY2tzIHRvIHRoaXNcbiAgICAvLyBvYmplY3QncyBfdG9SZW5kZXIgcXVldWUuXG4gICAgZG97XG4gICAgICBmb3Ioa2V5IGluIGNoYW5nZWQpe1xuICAgICAgICBwYXRoID0gKGJhc2VQYXRoICsgKGJhc2VQYXRoICYmIGtleSAmJiAnLicpICsga2V5KS5yZXBsYWNlKGNvbnRleHQuX19wYXRoKCksICcnKS5yZXBsYWNlKC9cXFtbXlxcXV0rXFxdL2csIFwiLkBlYWNoXCIpLnJlcGxhY2UoL15cXC4vLCAnJyk7XG4gICAgICAgIGZvcihvYnNQYXRoIGluIGNvbnRleHQuX19vYnNlcnZlcnMpe1xuICAgICAgICAgIG9ic2VydmVycyA9IGNvbnRleHQuX19vYnNlcnZlcnNbb2JzUGF0aF07XG4gICAgICAgICAgaWYoc3RhcnRzV2l0aChvYnNQYXRoLCBwYXRoKSl7XG4gICAgICAgICAgICAvLyBJZiB0aGlzIGlzIGEgY29sbGVjdGlvbiBldmVudCwgdHJpZ2dlciBldmVyeXRoaW5nLCBvdGhlcndpc2Ugb25seSB0cmlnZ2VyIHByb3BlcnR5IGNoYW5nZSBjYWxsYmFja3NcbiAgICAgICAgICAgIGlmKGRhdGEuaXNDb2xsZWN0aW9uKSBwdXNoLmNhbGwodGhpcy5fdG9SZW5kZXIsIG9ic2VydmVycy5jb2xsZWN0aW9uKTtcbiAgICAgICAgICAgIHB1c2guY2FsbCh0aGlzLl90b1JlbmRlciwgb2JzZXJ2ZXJzLm1vZGVsKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IHdoaWxlKGNvbnRleHQgIT09IGRhdGEgJiYgKGNvbnRleHQgPSBjb250ZXh0LmdldChwYXJ0cy5zaGlmdCgpKSkpXG5cbiAgICAvLyBRdWV1ZSBvdXIgcmVuZGVyIGNhbGxiYWNrIHRvIGJlIGNhbGxlZCBhZnRlciB0aGUgY3VycmVudCBjYWxsIHN0YWNrIGhhcyBiZWVuIGV4aGF1c3RlZFxuICAgIHdpbmRvdy5jbGVhclRpbWVvdXQodGhpcy5fcmVuZGVyVGltZW91dCk7XG4gICAgdGhpcy5fcmVuZGVyVGltZW91dCA9IHdpbmRvdy5zZXRUaW1lb3V0KF8uYmluZChyZW5kZXJDYWxsYmFjaywgdGhpcyksIDApO1xuICB9XG5cbn0pO1xuXG5cbkNvbXBvbmVudC5leHRlbmQ9IGZ1bmN0aW9uKHByb3RvUHJvcHMsIHN0YXRpY1Byb3BzKSB7XG4gIHZhciBwYXJlbnQgPSB0aGlzLFxuICAgICAgY2hpbGQsXG4gICAgICByZXNlcnZlZE1ldGhvZHMgPSB7XG4gICAgICAgICd0cmlnZ2VyJzoxLCAgICAnY29uc3RydWN0b3InOjEsICdnZXQnOjEsICAgICAgICAgICAgICAgJ3NldCc6MSwgICAgICAgICAgICAgJ2hhcyc6MSxcbiAgICAgICAgJ2V4dGVuZCc6MSwgICAgICdlc2NhcGUnOjEsICAgICAgJ3Vuc2V0JzoxLCAgICAgICAgICAgICAnY2xlYXInOjEsICAgICAgICAgICAnY2lkJzoxLFxuICAgICAgICAnYXR0cmlidXRlcyc6MSwgJ2NoYW5nZWQnOjEsICAgICAndG9KU09OJzoxLCAgICAgICAgICAgICd2YWxpZGF0aW9uRXJyb3InOjEsICdpc1ZhbGlkJzoxLFxuICAgICAgICAnaXNOZXcnOjEsICAgICAgJ2hhc0NoYW5nZWQnOjEsICAnY2hhbmdlZEF0dHJpYnV0ZXMnOjEsICdwcmV2aW91cyc6MSwgICAgICAgICdwcmV2aW91c0F0dHJpYnV0ZXMnOjFcbiAgICAgIH0sXG4gICAgICBjb25maWdQcm9wZXJ0aWVzID0ge1xuICAgICAgICAncm91dGVzJzoxLCAgICAgJ3RlbXBsYXRlJzoxLCAgICAnZGVmYXVsdHMnOjEsICdvdXRsZXQnOjEsICAgICAgICAgICd1cmwnOjEsXG4gICAgICAgICd1cmxSb290JzoxLCAgICAnaWRBdHRyaWJ1dGUnOjEsICdpZCc6MSwgICAgICAgJ2NyZWF0ZWRDYWxsYmFjayc6MSwgJ2F0dGFjaGVkQ2FsbGJhY2snOjEsXG4gICAgICAgICdkZXRhY2hlZENhbGxiYWNrJzoxXG4gICAgICB9O1xuXG4gIHByb3RvUHJvcHMgfHwgKHByb3RvUHJvcHMgPSB7fSk7XG4gIHN0YXRpY1Byb3BzIHx8IChzdGF0aWNQcm9wcyA9IHt9KTtcbiAgcHJvdG9Qcm9wcy5kZWZhdWx0cyA9IHt9O1xuICAvLyBzdGF0aWNQcm9wcy5zZXJ2aWNlcyA9IHt9O1xuXG4gIC8vIElmIGdpdmVuIGEgY29uc3RydWN0b3IsIHVzZSBpdCwgb3RoZXJ3aXNlIHVzZSB0aGUgZGVmYXVsdCBvbmUgZGVmaW5lZCBhYm92ZVxuICBpZiAocHJvdG9Qcm9wcyAmJiBfLmhhcyhwcm90b1Byb3BzLCAnY29uc3RydWN0b3InKSkge1xuICAgIGNoaWxkID0gcHJvdG9Qcm9wcy5jb25zdHJ1Y3RvcjtcbiAgfSBlbHNlIHtcbiAgICBjaGlsZCA9IGZ1bmN0aW9uKCl7IHJldHVybiBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfTtcbiAgfVxuXG4gIC8vIE91ciBjbGFzcyBzaG91bGQgaW5oZXJpdCBldmVyeXRoaW5nIGZyb20gaXRzIHBhcmVudCwgZGVmaW5lZCBhYm92ZVxuICB2YXIgU3Vycm9nYXRlID0gZnVuY3Rpb24oKXsgdGhpcy5jb25zdHJ1Y3RvciA9IGNoaWxkOyB9O1xuICBTdXJyb2dhdGUucHJvdG90eXBlID0gcGFyZW50LnByb3RvdHlwZTtcbiAgY2hpbGQucHJvdG90eXBlID0gbmV3IFN1cnJvZ2F0ZSgpO1xuXG4gIC8vIEZvciBlYWNoIHByb3BlcnR5IHBhc3NlZCBpbnRvIG91ciBjb21wb25lbnQgYmFzZSBjbGFzc1xuICBfLmVhY2gocHJvdG9Qcm9wcywgZnVuY3Rpb24odmFsdWUsIGtleSwgcHJvdG9Qcm9wcyl7XG5cbiAgICAvLyBJZiBhIGNvbmZpZ3VyYXRpb24gcHJvcGVydHksIGlnbm9yZSBpdFxuICAgIGlmKGNvbmZpZ1Byb3BlcnRpZXNba2V5XSl7IHJldHVybjsgfVxuXG4gICAgLy8gSWYgYSBwcmltYXRpdmUgb3IgYmFja2JvbmUgdHlwZSBvYmplY3QsIG9yIGNvbXB1dGVkIHByb3BlcnR5IChmdW5jdGlvbiB3aGljaCB0YWtlcyBubyBhcmd1bWVudHMgYW5kIHJldHVybnMgYSB2YWx1ZSkgbW92ZSBpdCB0byBvdXIgZGVmYXVsdHNcbiAgICBpZighXy5pc0Z1bmN0aW9uKHZhbHVlKSB8fCB2YWx1ZS5pc01vZGVsIHx8IHZhbHVlLmlzQ29tcG9uZW50IHx8IChfLmlzRnVuY3Rpb24odmFsdWUpICYmIHZhbHVlLmxlbmd0aCA9PT0gMCAmJiB2YWx1ZS50b1N0cmluZygpLmluZGV4T2YoJ3JldHVybicpID4gLTEpKXtcbiAgICAgIHByb3RvUHJvcHMuZGVmYXVsdHNba2V5XSA9IHZhbHVlO1xuICAgICAgZGVsZXRlIHByb3RvUHJvcHNba2V5XTtcbiAgICB9XG5cbiAgICAvLyBJZiBhIHJlc2VydmVkIG1ldGhvZCwgeWVsbFxuICAgIGlmKHJlc2VydmVkTWV0aG9kc1trZXldKXsgdGhyb3cgXCJFUlJPUjogXCIgKyBrZXkgKyBcIiBpcyBhIHJlc2VydmVkIG1ldGhvZCBuYW1lIGluIFwiICsgc3RhdGljUHJvcHMuX19uYW1lICsgXCIhXCI7IH1cblxuICAgIC8vIEFsbCBvdGhlciB2YWx1ZXMgYXJlIGNvbXBvbmVudCBtZXRob2RzLCBsZWF2ZSB0aGVtIGJlIHVubGVzcyBhbHJlYWR5IGRlZmluZWQuXG5cbiAgfSwgdGhpcyk7XG5cbiAgLy8gRXh0ZW5kIG91ciBwcm90b3R5cGUgd2l0aCBhbnkgcmVtYWluaW5nIHByb3RvUHJvcHMsIG92ZXJyaXRpbmcgcHJlLWRlZmluZWQgb25lc1xuICBpZiAocHJvdG9Qcm9wcyl7IF8uZXh0ZW5kKGNoaWxkLnByb3RvdHlwZSwgcHJvdG9Qcm9wcywgc3RhdGljUHJvcHMpOyB9XG5cbiAgLy8gU2V0IG91ciBhbmNlc3RyeVxuICBjaGlsZC5fX3N1cGVyX18gPSBwYXJlbnQucHJvdG90eXBlO1xuXG4gIHJldHVybiBjaGlsZDtcbn07XG5cbkNvbXBvbmVudC5yZWdpc3RlciA9IGZ1bmN0aW9uIHJlZ2lzdGVyQ29tcG9uZW50KG5hbWUsIG9wdGlvbnMpIHtcbiAgdmFyIHNjcmlwdCA9IG9wdGlvbnMucHJvdG90eXBlO1xuICB2YXIgdGVtcGxhdGUgPSBvcHRpb25zLnRlbXBsYXRlO1xuICB2YXIgc3R5bGUgPSBvcHRpb25zLnN0eWxlO1xuXG4gIHZhciBjb21wb25lbnQgPSB0aGlzLmV4dGVuZChzY3JpcHQsIHsgX19uYW1lOiBuYW1lIH0pO1xuICB2YXIgcHJvdG8gPSBPYmplY3QuY3JlYXRlKEhUTUxFbGVtZW50LnByb3RvdHlwZSwge30pO1xuXG4gIHByb3RvLmNyZWF0ZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMuX19jb21wb25lbnRfXyA9IG5ldyBjb21wb25lbnQoe1xuICAgICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgICAgb3V0bGV0OiB0aGlzLFxuICAgICAgZGF0YTogUmVib3VuZC5zZWVkRGF0YVxuICAgIH0pO1xuICB9O1xuXG4gIHByb3RvLmF0dGFjaGVkQ2FsbGJhY2sgPSBmdW5jdGlvbigpIHtcbiAgICBzY3JpcHQuYXR0YWNoZWRDYWxsYmFjayAmJiBzY3JpcHQuYXR0YWNoZWRDYWxsYmFjay5jYWxsKHRoaXMuX19jb21wb25lbnRfXyk7XG4gIH07XG5cbiAgcHJvdG8uZGV0YWNoZWRDYWxsYmFjayA9IGZ1bmN0aW9uKCkge1xuICAgIHNjcmlwdC5kZXRhY2hlZENhbGxiYWNrICYmIHNjcmlwdC5kZXRhY2hlZENhbGxiYWNrLmNhbGwodGhpcy5fX2NvbXBvbmVudF9fKTtcbiAgICB0aGlzLl9fY29tcG9uZW50X18uZGVpbml0aWFsaXplKCk7XG4gIH07XG5cbiAgcHJvdG8uYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrID0gZnVuY3Rpb24oYXR0ck5hbWUsIG9sZFZhbCwgbmV3VmFsKSB7XG4gICAgdGhpcy5fX2NvbXBvbmVudF9fLl9vbkF0dHJpYnV0ZUNoYW5nZShhdHRyTmFtZSwgb2xkVmFsLCBuZXdWYWwpO1xuICAgIHNjcmlwdC5hdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgJiYgc2NyaXB0LmF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjay5jYWxsKHRoaXMuX19jb21wb25lbnRfXywgYXR0ck5hbWUsIG9sZFZhbCwgbmV3VmFsKTtcbiAgfTtcblxuICByZXR1cm4gZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KG5hbWUsIHsgcHJvdG90eXBlOiBwcm90byB9KTtcbn1cblxuXy5iaW5kQWxsKENvbXBvbmVudCwgJ3JlZ2lzdGVyJyk7XG5cbmV4cG9ydCBkZWZhdWx0IENvbXBvbmVudDtcbiIsIi8vIFJlYm91bmQgQ29sbGVjdGlvblxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgTW9kZWwgZnJvbSBcInJlYm91bmQtZGF0YS9tb2RlbFwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cbmZ1bmN0aW9uIHBhdGhHZW5lcmF0b3IoY29sbGVjdGlvbil7XG4gIHJldHVybiBmdW5jdGlvbigpe1xuICAgIHJldHVybiBjb2xsZWN0aW9uLl9fcGF0aCgpICsgJ1snICsgY29sbGVjdGlvbi5pbmRleE9mKGNvbGxlY3Rpb24uX2J5SWRbdGhpcy5jaWRdKSArICddJztcbiAgfTtcbn1cblxudmFyIENvbGxlY3Rpb24gPSBCYWNrYm9uZS5Db2xsZWN0aW9uLmV4dGVuZCh7XG5cbiAgaXNDb2xsZWN0aW9uOiB0cnVlLFxuICBpc0RhdGE6IHRydWUsXG5cbiAgbW9kZWw6IHRoaXMubW9kZWwgfHwgTW9kZWwsXG5cbiAgX19wYXRoOiBmdW5jdGlvbigpe3JldHVybiAnJzt9LFxuXG4gIGNvbnN0cnVjdG9yOiBmdW5jdGlvbihtb2RlbHMsIG9wdGlvbnMpe1xuICAgIG1vZGVscyB8fCAobW9kZWxzID0gW10pO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdGhpcy5fX29ic2VydmVycyA9IHt9O1xuICAgIHRoaXMuaGVscGVycyA9IHt9O1xuICAgIHRoaXMuY2lkID0gXy51bmlxdWVJZCgnY29sbGVjdGlvbicpO1xuXG4gICAgLy8gU2V0IGxpbmVhZ2VcbiAgICB0aGlzLnNldFBhcmVudCggb3B0aW9ucy5wYXJlbnQgfHwgdGhpcyApO1xuICAgIHRoaXMuc2V0Um9vdCggb3B0aW9ucy5yb290IHx8IHRoaXMgKTtcbiAgICB0aGlzLl9fcGF0aCA9IG9wdGlvbnMucGF0aCB8fCB0aGlzLl9fcGF0aDtcblxuICAgIEJhY2tib25lLkNvbGxlY3Rpb24uYXBwbHkoIHRoaXMsIGFyZ3VtZW50cyApO1xuXG4gICAgLy8gV2hlbiBhIG1vZGVsIGlzIHJlbW92ZWQgZnJvbSBpdHMgb3JpZ2luYWwgY29sbGVjdGlvbiwgZGVzdHJveSBpdFxuICAgIC8vIFRPRE86IEZpeCB0aGlzLiBDb21wdXRlZCBwcm9wZXJ0aWVzIG5vdyBzb21laG93IGFsbG93IGNvbGxlY3Rpb24gdG8gc2hhcmUgYSBtb2RlbC4gVGhleSBtYXkgYmUgcmVtb3ZlZCBmcm9tIG9uZSBidXQgbm90IHRoZSBvdGhlci4gVGhhdCBpcyBiYWQuXG4gICAgLy8gVGhlIGNsb25lID0gZmFsc2Ugb3B0aW9ucyBpcyB0aGUgY3VscHJpdC4gRmluZCBhIGJldHRlciB3YXkgdG8gY29weSBhbGwgb2YgdGhlIGNvbGxlY3Rpb25zIGN1c3RvbSBhdHRyaWJ1dGVzIG92ZXIgdG8gdGhlIGNsb25lLlxuICAgIHRoaXMub24oJ3JlbW92ZScsIGZ1bmN0aW9uKG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKXtcbiAgICAgIC8vIG1vZGVsLmRlaW5pdGlhbGl6ZSgpO1xuICAgIH0pO1xuXG4gIH0sXG5cbiAgZ2V0OiBmdW5jdGlvbihrZXksIG9wdGlvbnMpe1xuXG4gICAgLy8gSWYgdGhlIGtleSBpcyBhIG51bWJlciBvciBvYmplY3QsIGRlZmF1bHQgdG8gYmFja2JvbmUncyBjb2xsZWN0aW9uIGdldFxuICAgIGlmKHR5cGVvZiBrZXkgPT0gJ251bWJlcicgfHwgdHlwZW9mIGtleSA9PSAnb2JqZWN0Jyl7XG4gICAgICByZXR1cm4gQmFja2JvbmUuQ29sbGVjdGlvbi5wcm90b3R5cGUuZ2V0LmNhbGwodGhpcywga2V5KTtcbiAgICB9XG5cbiAgICAvLyBJZiBrZXkgaXMgbm90IGEgc3RyaW5nLCByZXR1cm4gdW5kZWZpbmVkXG4gICAgaWYgKCFfLmlzU3RyaW5nKGtleSkpIHJldHVybiB2b2lkIDA7XG5cbiAgICAvLyBTcGxpdCB0aGUgcGF0aCBhdCBhbGwgJy4nLCAnWycgYW5kICddJyBhbmQgZmluZCB0aGUgdmFsdWUgcmVmZXJhbmNlZC5cbiAgICB2YXIgcGFydHMgID0gJC5zcGxpdFBhdGgoa2V5KSxcbiAgICAgICAgcmVzdWx0ID0gdGhpcyxcbiAgICAgICAgbD1wYXJ0cy5sZW5ndGgsXG4gICAgICAgIGk9MDtcbiAgICAgICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcblxuICAgIGlmKF8uaXNVbmRlZmluZWQoa2V5KSB8fCBfLmlzTnVsbChrZXkpKSByZXR1cm4ga2V5O1xuICAgIGlmKGtleSA9PT0gJycgfHwgcGFydHMubGVuZ3RoID09PSAwKSByZXR1cm4gcmVzdWx0O1xuXG4gICAgaWYgKHBhcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAoIGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIC8vIElmIHJldHVybmluZyByYXcsIGFsd2F5cyByZXR1cm4gdGhlIGZpcnN0IGNvbXB1dGVkIHByb3BlcnR5IGZvdW5kLiBJZiB1bmRlZmluZWQsIHlvdSdyZSBkb25lLlxuICAgICAgICBpZihyZXN1bHQgJiYgcmVzdWx0LmlzQ29tcHV0ZWRQcm9wZXJ0eSAmJiBvcHRpb25zLnJhdykgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgaWYocmVzdWx0ICYmIHJlc3VsdC5pc0NvbXB1dGVkUHJvcGVydHkpIHJlc3VsdCA9IHJlc3VsdC52YWx1ZSgpO1xuICAgICAgICBpZihfLmlzVW5kZWZpbmVkKHJlc3VsdCkgfHwgXy5pc051bGwocmVzdWx0KSkgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgaWYocGFydHNbaV0gPT09ICdAcGFyZW50JykgcmVzdWx0ID0gcmVzdWx0Ll9fcGFyZW50X187XG4gICAgICAgIGVsc2UgaWYocmVzdWx0LmlzQ29sbGVjdGlvbikgcmVzdWx0ID0gcmVzdWx0Lm1vZGVsc1twYXJ0c1tpXV07XG4gICAgICAgIGVsc2UgaWYocmVzdWx0LmlzTW9kZWwpIHJlc3VsdCA9IHJlc3VsdC5hdHRyaWJ1dGVzW3BhcnRzW2ldXTtcbiAgICAgICAgZWxzZSBpZihyZXN1bHQuaGFzT3duUHJvcGVydHkocGFydHNbaV0pKSByZXN1bHQgPSByZXN1bHRbcGFydHNbaV1dO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5ICYmICFvcHRpb25zLnJhdykgcmVzdWx0ID0gcmVzdWx0LnZhbHVlKCk7XG5cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuXG4gIHNldDogZnVuY3Rpb24obW9kZWxzLCBvcHRpb25zKXtcbiAgICB2YXIgbmV3TW9kZWxzID0gW10sXG4gICAgICAgIGxpbmVhZ2UgPSB7XG4gICAgICAgICAgcGFyZW50OiB0aGlzLFxuICAgICAgICAgIHJvb3Q6IHRoaXMuX19yb290X18sXG4gICAgICAgICAgcGF0aDogcGF0aEdlbmVyYXRvcih0aGlzKSxcbiAgICAgICAgICBzaWxlbnQ6IHRydWVcbiAgICAgICAgfTtcbiAgICAgICAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge30sXG5cbiAgICAvLyBJZiBubyBtb2RlbHMgcGFzc2VkLCBpbXBsaWVzIGFuIGVtcHR5IGFycmF5XG4gICAgbW9kZWxzIHx8IChtb2RlbHMgPSBbXSk7XG5cbiAgICAvLyBJZiBtb2RlbHMgaXMgYSBzdHJpbmcsIGNhbGwgc2V0IGF0IHRoYXQgcGF0aFxuICAgIGlmKF8uaXNTdHJpbmcobW9kZWxzKSkgcmV0dXJuIHRoaXMuZ2V0KCQuc3BsaXRQYXRoKG1vZGVscylbMF0pLnNldCgkLnNwbGl0UGF0aChtb2RlbHMpLnNwbGljZSgxLCBtb2RlbHMubGVuZ3RoKS5qb2luKCcuJyksIG9wdGlvbnMpO1xuICAgIGlmKCFfLmlzT2JqZWN0KG1vZGVscykpIHJldHVybiBjb25zb2xlLmVycm9yKCdDb2xsZWN0aW9uLnNldCBtdXN0IGJlIHBhc3NlZCBhIE1vZGVsLCBPYmplY3QsIGFycmF5IG9yIE1vZGVscyBhbmQgT2JqZWN0cywgb3IgYW5vdGhlciBDb2xsZWN0aW9uJyk7XG5cbiAgICAvLyBJZiBhbm90aGVyIGNvbGxlY3Rpb24sIHRyZWF0IGxpa2UgYW4gYXJyYXlcbiAgICBtb2RlbHMgPSAobW9kZWxzLmlzQ29sbGVjdGlvbikgPyBtb2RlbHMubW9kZWxzIDogbW9kZWxzO1xuICAgIC8vIEVuc3VyZSBtb2RlbHMgaXMgYW4gYXJyYXlcbiAgICBtb2RlbHMgPSAoIV8uaXNBcnJheShtb2RlbHMpKSA/IFttb2RlbHNdIDogbW9kZWxzO1xuXG4gICAgLy8gSWYgdGhlIG1vZGVsIGFscmVhZHkgZXhpc3RzIGluIHRoaXMgY29sbGVjdGlvbiwgb3Igd2UgYXJlIHRvbGQgbm90IHRvIGNsb25lIGl0LCBsZXQgQmFja2JvbmUgaGFuZGxlIHRoZSBtZXJnZVxuICAgIC8vIE90aGVyd2lzZSwgY3JlYXRlIG91ciBjb3B5IG9mIHRoaXMgbW9kZWwsIGdpdmUgdGhlbSB0aGUgc2FtZSBjaWQgc28gb3VyIGhlbHBlcnMgdHJlYXQgdGhlbSBhcyB0aGUgc2FtZSBvYmplY3RcbiAgICBfLmVhY2gobW9kZWxzLCBmdW5jdGlvbihkYXRhLCBpbmRleCl7XG4gICAgICBpZihkYXRhLmlzTW9kZWwgJiYgb3B0aW9ucy5jbG9uZSA9PT0gZmFsc2UgfHwgdGhpcy5fYnlJZFtkYXRhLmNpZF0pIHJldHVybiBuZXdNb2RlbHNbaW5kZXhdID0gZGF0YTtcbiAgICAgIG5ld01vZGVsc1tpbmRleF0gPSBuZXcgdGhpcy5tb2RlbChkYXRhLCBfLmRlZmF1bHRzKGxpbmVhZ2UsIG9wdGlvbnMpKTtcbiAgICAgIGRhdGEuaXNNb2RlbCAmJiAobmV3TW9kZWxzW2luZGV4XS5jaWQgPSBkYXRhLmNpZCk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICAvLyBFbnN1cmUgdGhhdCB0aGlzIGVsZW1lbnQgbm93IGtub3dzIHRoYXQgaXQgaGFzIGNoaWxkcmVuIG5vdy4gV2l0aG91dCB0aGlzIGN5Y2xpYyBkZXBlbmRhbmNpZXMgY2F1c2UgaXNzdWVzXG4gICAgdGhpcy5faGFzQW5jZXN0cnkgfHwgKHRoaXMuX2hhc0FuY2VzdHJ5ID0gbmV3TW9kZWxzLmxlbmd0aCA+IDApO1xuXG4gICAgLy8gQ2FsbCBvcmlnaW5hbCBzZXQgZnVuY3Rpb24gd2l0aCBtb2RlbCBkdXBsaWNhdGVzXG4gICAgcmV0dXJuIEJhY2tib25lLkNvbGxlY3Rpb24ucHJvdG90eXBlLnNldC5jYWxsKHRoaXMsIG5ld01vZGVscywgb3B0aW9ucyk7XG5cbiAgfVxuXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgQ29sbGVjdGlvbjtcbiIsIi8vIFJlYm91bmQgUHJlY29tcGlsZXJcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuaW1wb3J0IHsgY29tcGlsZSBhcyBodG1sYmFyc0NvbXBpbGUsIGNvbXBpbGVTcGVjIGFzIGh0bWxiYXJzQ29tcGlsZVNwZWMgfSBmcm9tIFwiaHRtbGJhcnNcIjtcblxuLy8gUmVtb3ZlIHRoZSBjb250ZW50cyBvZiB0aGUgY29tcG9uZW50J3MgYHNjcmlwdGAgdGFnLlxuZnVuY3Rpb24gZ2V0U2NyaXB0KHN0cikge1xuICByZXR1cm4gc3RyLmluZGV4T2YoXCI8c2NyaXB0PlwiKSA+IC0xICYmIHN0ci5pbmRleE9mKFwiPC9zY3JpcHQ+XCIpID4gLTEgPyBcIihmdW5jdGlvbigpe1wiICsgc3RyLnJlcGxhY2UoLyhbXl0qPHNjcmlwdD4pKFteXSopKDxcXC9zY3JpcHQ+W15dKikvaWcsIFwiJDJcIikgKyBcIn0pKClcIiA6IFwie31cIjtcbn1cblxuLy8gUmVtb3ZlIHRoZSBjb250ZW50cyBvZiB0aGUgY29tcG9uZW50J3MgYHN0eWxlYCB0YWcuXG5mdW5jdGlvbiBnZXRTdHlsZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5pbmRleE9mKFwiPHN0eWxlPlwiKSA+IC0xICYmIHN0ci5pbmRleE9mKFwiPC9zdHlsZT5cIikgPiAtMSA/IHN0ci5yZXBsYWNlKC8oW15dKjxzdHlsZT4pKFteXSopKDxcXC9zdHlsZT5bXl0qKS9pZywgXCIkMlwiKS5yZXBsYWNlKC9cIi9nLCBcIlxcXFxcXFwiXCIpIDogXCJcIjtcbn1cblxuLy8gUmVtb3ZlIHRoZSBjb250ZW50cyBvZiB0aGUgY29tcG9uZW50J3MgYHRlbXBsYXRlYCB0YWcuXG5mdW5jdGlvbiBnZXRUZW1wbGF0ZShzdHIpIHtcbiAgcmV0dXJuIHN0ci5pbmRleE9mKFwiPHRlbXBsYXRlPlwiKSA+IC0xICYmIHN0ci5pbmRleE9mKFwiPC90ZW1wbGF0ZT5cIikgPiAtMSA/IHN0ci5yZXBsYWNlKC9bXl0qPHRlbXBsYXRlPihbXl0qKTxcXC90ZW1wbGF0ZT5bXl0qL2dpLCBcIiQxXCIpLnJlcGxhY2UoLyhbXl0qKTxzdHlsZT5bXl0qPFxcL3N0eWxlPihbXl0qKS9pZywgXCIkMSQyXCIpIDogXCJcIjtcbn1cblxuLy8gR2V0IHRoZSBjb21wb25lbnQncyBuYW1lIGZyb20gaXRzIGBuYW1lYCBhdHRyaWJ1dGUuXG5mdW5jdGlvbiBnZXROYW1lKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoL1teXSo8ZWxlbWVudFtePl0qbmFtZT0oW1wiJ10pPyhbXidcIj5cXHNdKylcXDFbXjw+XSo+W15dKi9pZywgXCIkMlwiKTtcbn1cblxuLy8gTWluaWZ5IHRoZSBzdHJpbmcgcGFzc2VkIGluIGJ5IHJlcGxhY2luZyBhbGwgd2hpdGVzcGFjZS5cbmZ1bmN0aW9uIG1pbmlmeShzdHIpIHtcbiAgcmV0dXJuIHN0ci5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKS5yZXBsYWNlKC9cXG58KD4pICg8KS9nLCBcIiQxJDJcIik7XG59XG5cbi8vIFN0cmlwIGphdmFzY3JpcHQgY29tbWVudHNcbmZ1bmN0aW9uIHJlbW92ZUNvbW1lbnRzKHN0cikge1xuICByZXR1cm4gc3RyLnJlcGxhY2UoLyg/OlxcL1xcKig/OltcXHNcXFNdKj8pXFwqXFwvKXwoPzooW1xcc10pK1xcL1xcLyg/Oi4qKSQpL2dtLCBcIiQxXCIpO1xufVxuXG5mdW5jdGlvbiB0ZW1wbGF0ZUZ1bmMoZm4pIHtcbiAgdmFyIHNyYyA9IGZuLnRvU3RyaW5nKCk7XG4gIHNyYyA9IHNyYy5zbGljZShzcmMuaW5kZXhPZihcIntcIikgKyAxLCAtMSk7XG4gIHJldHVybiBmdW5jdGlvbihkYXRhKSB7XG4gICAgcmV0dXJuICFkYXRhID8gc3JjIDogc3JjLnJlcGxhY2UoLyhcXCRbYS16QS1aXSspL2csIGZ1bmN0aW9uKCRyZXApIHtcbiAgICAgIHZhciBrZXkgPSAkcmVwLnNsaWNlKDEpO1xuICAgICAgcmV0dXJuIGRhdGFba2V5XSB8fCBcIlwiO1xuICAgIH0pO1xuICB9O1xufVxuXG52YXIgQ09NUE9ORU5UX1RFTVBMQVRFID0gdGVtcGxhdGVGdW5jKGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIChmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gd2luZG93LlJlYm91bmQucmVnaXN0ZXJDb21wb25lbnQoXCIkbmFtZVwiLCB7XG4gICAgICBwcm90b3R5cGU6ICRzY3JpcHQsXG4gICAgICB0ZW1wbGF0ZTogJHRlbXBsYXRlLFxuICAgICAgc3R5bGU6IFwiJHN0eWxlXCJcbiAgICB9KTtcbiAgfSkoKTtcbn0pO1xuXG5mdW5jdGlvbiBwcmVjb21waWxlKHN0ciwgb3B0aW9ucyl7XG4gIGlmKCAhc3RyIHx8IHN0ci5sZW5ndGggPT09IDAgKXtcbiAgICByZXR1cm4gY29uc29sZS5lcnJvcignTm8gdGVtcGxhdGUgcHJvdmlkZWQhJyk7XG4gIH1cblxuICAvLyBSZW1vdmUgY29tbWVudHNcbiAgLy8gc3RyID0gcmVtb3ZlQ29tbWVudHMoc3RyKTtcbiAgLy8gTWluaWZ5IGV2ZXJ5dGhpbmdcbiAgLy8gc3RyID0gbWluaWZ5KHN0cik7XG5cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIG9wdGlvbnMuYmFzZURlc3QgPSBvcHRpb25zLmJhc2VEZXN0IHx8ICcnO1xuICBvcHRpb25zLm5hbWUgPSBvcHRpb25zLm5hbWUgfHwgJyc7XG4gIG9wdGlvbnMuYmFzZVVybCA9IG9wdGlvbnMuYmFzZVVybCB8fCAnJztcblxuICB2YXIgdGVtcGxhdGUgPSBzdHIsXG4gICAgICBzdHlsZSA9ICcnLFxuICAgICAgc2NyaXB0ID0gJ3t9JyxcbiAgICAgIG5hbWUgPSAnJyxcbiAgICAgIGlzUGFydGlhbCA9IHRydWUsXG4gICAgICBpbXBvcnRzID0gW10sXG4gICAgICBwYXJ0aWFscyxcbiAgICAgIHJlcXVpcmUsXG4gICAgICBkZXBzID0gW107XG5cbiAgLy8gSWYgdGhlIGVsZW1lbnQgdGFnIGlzIHByZXNlbnRcbiAgaWYoc3RyLmluZGV4T2YoJzxlbGVtZW50JykgPiAtMSAmJiBzdHIuaW5kZXhPZignPC9lbGVtZW50PicpID4gLTEpe1xuXG4gICAgaXNQYXJ0aWFsID0gZmFsc2U7XG5cbiAgICBuYW1lID0gZ2V0TmFtZShzdHIpO1xuICAgIHN0eWxlID0gZ2V0U3R5bGUoc3RyKTtcbiAgICB0ZW1wbGF0ZSA9IGdldFRlbXBsYXRlKHN0cik7XG4gICAgc2NyaXB0ID0gZ2V0U2NyaXB0KHN0cik7XG5cbiAgfVxuXG5cbiAgLy8gQXNzZW1wbGUgb3VyIGNvbXBvbmVudCBkZXBlbmRhbmNpZXMgYnkgZmluZGluZyBsaW5rIHRhZ3MgYW5kIHBhcnNpbmcgdGhlaXIgc3JjXG4gIHZhciBpbXBvcnRzcmUgPSAvPGxpbmsgW15oXSpocmVmPShbJ1wiXT8pXFwvPyhbXi4nXCJdKikuaHRtbFxcMVtePl0qPi9naSxcbiAgICAgIG1hdGNoO1xuXG4gIHdoaWxlICgobWF0Y2ggPSBpbXBvcnRzcmUuZXhlYyh0ZW1wbGF0ZSkpICE9IG51bGwpIHtcbiAgICAgIGltcG9ydHMucHVzaChtYXRjaFsyXSk7XG4gIH1cbiAgaW1wb3J0cy5mb3JFYWNoKGZ1bmN0aW9uKGltcG9ydFN0cmluZywgaW5kZXgpe1xuICAgIGRlcHMucHVzaCgnXCInICsgb3B0aW9ucy5iYXNlRGVzdCArIGltcG9ydFN0cmluZyArICdcIicpO1xuICB9KTtcblxuICAvLyBSZW1vdmUgbGluayB0YWdzIGZyb20gdGVtcGxhdGVcbiAgdGVtcGxhdGUgPSB0ZW1wbGF0ZS5yZXBsYWNlKC88bGluayAuKmhyZWY9KFsnXCJdPykoLiopLmh0bWxcXDFbXj5dKj4vZ2ksICcnKTtcblxuICAvLyBBc3NlbWJsZSBvdXIgcGFydGlhbCBkZXBlbmRhbmNpZXNcbiAgcGFydGlhbHMgPSB0ZW1wbGF0ZS5tYXRjaCgvXFx7XFx7Plxccyo/WydcIl0/KFteJ1wifVxcc10qKVsnXCJdP1xccyo/XFx9XFx9L2dpKTtcblxuICBpZihwYXJ0aWFscyl7XG4gICAgcGFydGlhbHMuZm9yRWFjaChmdW5jdGlvbihwYXJ0aWFsLCBpbmRleCl7XG4gICAgICBkZXBzLnB1c2goJ1wiJyArIG9wdGlvbnMuYmFzZURlc3QgKyBwYXJ0aWFsLnJlcGxhY2UoL1xce1xcez5bXFxzKl0/WydcIl0/KFteJ1wiXSopWydcIl0/W1xccypdP1xcfVxcfS9naSwgJyQxJykgKyAnXCInKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIENvbXBpbGVcbiAgdGVtcGxhdGUgPSAnJyArIGh0bWxiYXJzQ29tcGlsZVNwZWModGVtcGxhdGUpO1xuXG4gIC8vIElmIGlzIGEgcGFydGlhbFxuICBpZihpc1BhcnRpYWwpe1xuICAgIHRlbXBsYXRlID0gJyhmdW5jdGlvbigpe3ZhciB0ZW1wbGF0ZSA9ICcrdGVtcGxhdGUrJ1xcbiB3aW5kb3cuUmVib3VuZC5yZWdpc3RlclBhcnRpYWwoIFwiJysgb3B0aW9ucy5uYW1lICsnXCIsIHRlbXBsYXRlKTt9KSgpO1xcbic7XG4gIH1cbiAgLy8gRWxzZSwgaXMgYSBjb21wb25lbnRcbiAgZWxzZXtcbiAgICB0ZW1wbGF0ZSA9IENPTVBPTkVOVF9URU1QTEFURSh7XG4gICAgICBuYW1lOiBuYW1lLFxuICAgICAgc2NyaXB0OiBzY3JpcHQsXG4gICAgICBzdHlsZTogc3R5bGUsXG4gICAgICB0ZW1wbGF0ZTogdGVtcGxhdGVcbiAgICB9KTtcbiAgfVxuXG4gIC8vIFdyYXAgaW4gZGVmaW5lXG4gIHRlbXBsYXRlID0gXCJkZWZpbmUoIFtcIisgZGVwcy5qb2luKCcsICcpICArXCJdLCBmdW5jdGlvbigpe1xcblwiICsgdGVtcGxhdGUgKyAnfSk7JztcblxuICByZXR1cm4gdGVtcGxhdGU7XG59XG5cbmV4cG9ydCB7IHByZWNvbXBpbGUgfTtcbiIsIi8vIFJlYm91bmQgUm91dGVyXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG4vLyBJZiBCYWNrYm9uZSBoYXNuJ3QgYmVlbiBzdGFydGVkIHlldCwgdGhyb3cgZXJyb3JcbmlmKCF3aW5kb3cuQmFja2JvbmUpeyB0aHJvdyBcIkJhY2tib25lIG11c3QgYmUgb24gdGhlIHBhZ2UgZm9yIFJlYm91bmQgdG8gbG9hZC5cIjsgfVxuXG4gIC8vIENsZWFuIHVwIG9sZCBwYWdlIGNvbXBvbmVudCBhbmQgbG9hZCByb3V0ZXMgZnJvbSBvdXIgbmV3IHBhZ2UgY29tcG9uZW50XG4gIGZ1bmN0aW9uIGluc3RhbGxSZXNvdXJjZXMoUGFnZUFwcCwgcHJpbWFyeVJvdXRlLCBpc0dsb2JhbCkge1xuICAgIHZhciBvbGRQYWdlTmFtZSwgcGFnZUluc3RhbmNlLCBjb250YWluZXIsIHJvdXRlciA9IHRoaXM7XG5cbiAgICAvLyBEZS1pbml0aWFsaXplIHRoZSBwcmV2aW91cyBhcHAgYmVmb3JlIHJlbmRlcmluZyBhIG5ldyBhcHBcbiAgICAvLyBUaGlzIHdheSB3ZSBjYW4gZW5zdXJlIHRoYXQgZXZlcnkgbmV3IHBhZ2Ugc3RhcnRzIHdpdGggYSBjbGVhbiBzbGF0ZVxuICAgIC8vIFRoaXMgaXMgY3J1Y2lhbCBmb3Igc2NhbGFiaWxpdHkgb2YgYSBzaW5nbGUgcGFnZSBhcHAuXG4gICAgaWYoIWlzR2xvYmFsICYmIHRoaXMuY3VycmVudCl7XG5cbiAgICAgIG9sZFBhZ2VOYW1lID0gdGhpcy5jdXJyZW50Ll9fbmFtZTtcbiAgICAgIC8vIFVuc2V0IFByZXZpb3VzIEFwcGxpY2F0aW9uJ3MgUm91dGVzLiBGb3IgZWFjaCByb3V0ZSBpbiB0aGUgcGFnZSBhcHA6XG4gICAgICBfLmVhY2godGhpcy5jdXJyZW50Ll9fY29tcG9uZW50X18ucm91dGVzLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuXG4gICAgICAgIHZhciByZWdFeHAgPSByb3V0ZXIuX3JvdXRlVG9SZWdFeHAoa2V5KS50b1N0cmluZygpO1xuXG4gICAgICAgIC8vIFJlbW92ZSB0aGUgaGFuZGxlciBmcm9tIG91ciByb3V0ZSBvYmplY3RcbiAgICAgICAgQmFja2JvbmUuaGlzdG9yeS5oYW5kbGVycyA9IF8uZmlsdGVyKEJhY2tib25lLmhpc3RvcnkuaGFuZGxlcnMsIGZ1bmN0aW9uKG9iail7cmV0dXJuIG9iai5yb3V0ZS50b1N0cmluZygpICE9PSByZWdFeHA7fSk7XG5cbiAgICAgICAgLy8gRGVsZXRlIG91ciByZWZlcmFuY2UgdG8gdGhlIHJvdXRlJ3MgY2FsbGJhY2tcbiAgICAgICAgZGVsZXRlIHJvdXRlclsgJ19mdW5jdGlvbl8nICsga2V5IF07XG5cbiAgICAgIH0pO1xuXG4gICAgICAvLyBVbi1ob29rIEV2ZW50IEJpbmRpbmdzLCBEZWxldGUgT2JqZWN0c1xuICAgICAgdGhpcy5jdXJyZW50Ll9fY29tcG9uZW50X18uZGVpbml0aWFsaXplKCk7XG5cbiAgICAgIC8vIERpc2FibGUgb2xkIGNzcyBpZiBpdCBleGlzdHNcbiAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQob2xkUGFnZU5hbWUgKyAnLWNzcycpLnNldEF0dHJpYnV0ZSgnZGlzYWJsZWQnLCB0cnVlKTtcbiAgICAgIH0sIDUwMCk7XG5cbiAgICB9XG5cbiAgICAvLyBMb2FkIE5ldyBQYWdlQXBwLCBnaXZlIGl0IGl0J3MgbmFtZSBzbyB3ZSBrbm93IHdoYXQgY3NzIHRvIHJlbW92ZSB3aGVuIGl0IGRlaW5pdGlhbGl6ZXNcbiAgICBwYWdlSW5zdGFuY2UgPSBuZXcgUGFnZUFwcCgpO1xuICAgIHBhZ2VJbnN0YW5jZS5fX25hbWUgPSBwcmltYXJ5Um91dGU7XG5cbiAgICAvLyBBZGQgdG8gb3VyIHBhZ2VcbiAgICBjb250YWluZXIgPSAoaXNHbG9iYWwpID8gZG9jdW1lbnQucXVlcnlTZWxlY3Rvcihpc0dsb2JhbCkgOiBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29udGVudCcpWzBdO1xuICAgIGNvbnRhaW5lci5pbm5lckhUTUwgPSAnJztcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQocGFnZUluc3RhbmNlKTtcblxuICAgIC8vIE1ha2Ugc3VyZSB3ZSdyZSBiYWNrIGF0IHRoZSB0b3Agb2YgdGhlIHBhZ2VcbiAgICBkb2N1bWVudC5ib2R5LnNjcm9sbFRvcCA9IDA7XG5cbiAgICAvLyBBdWdtZW50IEFwcGxpY2F0aW9uUm91dGVyIHdpdGggbmV3IHJvdXRlcyBmcm9tIFBhZ2VBcHBcbiAgICBfLmVhY2gocGFnZUluc3RhbmNlLl9fY29tcG9uZW50X18ucm91dGVzLCBmdW5jdGlvbiAodmFsdWUsIGtleSkge1xuICAgICAgLy8gR2VuZXJhdGUgb3VyIHJvdXRlIGNhbGxiYWNrJ3MgbmV3IG5hbWVcbiAgICAgIHZhciByb3V0ZUZ1bmN0aW9uTmFtZSA9ICdfZnVuY3Rpb25fJyArIGtleSxcbiAgICAgICAgICBmdW5jdGlvbk5hbWU7XG4gICAgICAvLyBBZGQgdGhlIG5ldyBjYWxsYmFjayByZWZlcmFuY2Ugb24gdG8gb3VyIHJvdXRlclxuICAgICAgcm91dGVyW3JvdXRlRnVuY3Rpb25OYW1lXSA9ICBmdW5jdGlvbiAoKSB7IHBhZ2VJbnN0YW5jZS5fX2NvbXBvbmVudF9fW3ZhbHVlXS5hcHBseShwYWdlSW5zdGFuY2UuX19jb21wb25lbnRfXywgYXJndW1lbnRzKTsgfTtcbiAgICAgIC8vIEFkZCB0aGUgcm91dGUgaGFuZGxlclxuICAgICAgcm91dGVyLnJvdXRlKGtleSwgdmFsdWUsIHRoaXNbcm91dGVGdW5jdGlvbk5hbWVdKTtcbiAgICB9LCB0aGlzKTtcblxuICAgIHZhciBuYW1lID0gKGlzR2xvYmFsKSA/IHByaW1hcnlSb3V0ZSA6ICdwYWdlJztcbiAgICBpZighaXNHbG9iYWwpIHRoaXMuY3VycmVudCA9IHBhZ2VJbnN0YW5jZTtcbiAgICBpZih3aW5kb3cuUmVib3VuZC5zZXJ2aWNlc1tuYW1lXS5pc1NlcnZpY2UpXG4gICAgICB3aW5kb3cuUmVib3VuZC5zZXJ2aWNlc1tuYW1lXS5oeWRyYXRlKHBhZ2VJbnN0YW5jZS5fX2NvbXBvbmVudF9fKTtcbiAgICB3aW5kb3cuUmVib3VuZC5zZXJ2aWNlc1tuYW1lXSA9IHBhZ2VJbnN0YW5jZS5fX2NvbXBvbmVudF9fO1xuXG4gICAgLy8gUmV0dXJuIG91ciBuZXdseSBpbnN0YWxsZWQgYXBwXG4gICAgcmV0dXJuIHBhZ2VJbnN0YW5jZTtcbiAgfVxuXG4gIC8vIEZldGNoZXMgUGFyZSBIVE1MIGFuZCBDU1NcbiAgZnVuY3Rpb24gZmV0Y2hSZXNvdXJjZXMoYXBwTmFtZSwgcHJpbWFyeVJvdXRlLCBpc0dsb2JhbCkge1xuXG4gICAgLy8gRXhwZWN0aW5nIE1vZHVsZSBEZWZpbml0aW9uIGFzICdTZWFyY2hBcHAnIFdoZXJlICdTZWFyY2gnIGEgUHJpbWFyeSBSb3V0ZVxuICAgIHZhciBqc1VybCA9IHRoaXMuY29uZmlnLmpzUGF0aC5yZXBsYWNlKC86cm91dGUvZywgcHJpbWFyeVJvdXRlKS5yZXBsYWNlKC86YXBwL2csIGFwcE5hbWUpLFxuICAgICAgICBjc3NVcmwgPSB0aGlzLmNvbmZpZy5jc3NQYXRoLnJlcGxhY2UoLzpyb3V0ZS9nLCBwcmltYXJ5Um91dGUpLnJlcGxhY2UoLzphcHAvZywgYXBwTmFtZSksXG4gICAgICAgIGNzc0xvYWRlZCA9IGZhbHNlLFxuICAgICAgICBqc0xvYWRlZCA9IGZhbHNlLFxuICAgICAgICBjc3NFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoYXBwTmFtZSArICctY3NzJyksXG4gICAgICAgIGpzRWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGFwcE5hbWUgKyAnLWpzJyksXG4gICAgICAgIHJvdXRlciA9IHRoaXMsXG4gICAgICAgIFBhZ2VBcHA7XG5cbiAgICAgIC8vIE9ubHkgTG9hZCBDU1MgSWYgTm90IExvYWRlZCBCZWZvcmVcbiAgICAgIGlmKGNzc0VsZW1lbnQgPT09IG51bGwpe1xuICAgICAgICBjc3NFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGluaycpO1xuICAgICAgICBjc3NFbGVtZW50LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpO1xuICAgICAgICBjc3NFbGVtZW50LnNldEF0dHJpYnV0ZSgncmVsJywgJ3N0eWxlc2hlZXQnKTtcbiAgICAgICAgY3NzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCBjc3NVcmwpO1xuICAgICAgICBjc3NFbGVtZW50LnNldEF0dHJpYnV0ZSgnaWQnLCBhcHBOYW1lICsgJy1jc3MnKTtcbiAgICAgICAgZG9jdW1lbnQuaGVhZC5hcHBlbmRDaGlsZChjc3NFbGVtZW50KTtcbiAgICAgICAgJChjc3NFbGVtZW50KS5vbignbG9hZCcsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICAgIGlmKChjc3NMb2FkZWQgPSB0cnVlKSAmJiBqc0xvYWRlZCl7XG4gICAgICAgICAgICAgIC8vIEluc3RhbGwgVGhlIExvYWRlZCBSZXNvdXJjZXNcbiAgICAgICAgICAgICAgaW5zdGFsbFJlc291cmNlcy5jYWxsKHJvdXRlciwgUGFnZUFwcCwgYXBwTmFtZSwgaXNHbG9iYWwpO1xuXG4gICAgICAgICAgICAgIC8vIFJlLXRyaWdnZXIgcm91dGUgc28gdGhlIG5ld2x5IGFkZGVkIHJvdXRlIG1heSBleGVjdXRlIGlmIHRoZXJlJ3MgYSByb3V0ZSBtYXRjaC5cbiAgICAgICAgICAgICAgLy8gSWYgbm8gcm91dGVzIGFyZSBtYXRjaGVkLCBhcHAgd2lsbCBoaXQgd2lsZENhcmQgcm91dGUgd2hpY2ggd2lsbCB0aGVuIHRyaWdnZXIgNDA0XG4gICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCAmJiByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCl7XG4gICAgICAgICAgICAgICAgQmFja2JvbmUuaGlzdG9yeS5sb2FkVXJsKEJhY2tib25lLmhpc3RvcnkuZnJhZ21lbnQpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCl7XG4gICAgICAgICAgICAgICAgcm91dGVyLmNvbmZpZy50cmlnZ2VyT25GaXJzdExvYWQgPSB0cnVlO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuY2xhc3NMaXN0LnJlbW92ZSgnbG9hZGluZycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgLy8gSWYgaXQgaGFzIGJlZW4gbG9hZGVkIGJldm9yZSwgZW5hYmxlIGl0XG4gICAgICBlbHNlIHtcbiAgICAgICAgY3NzRWxlbWVudCAmJiBjc3NFbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnZGlzYWJsZWQnKTtcbiAgICAgICAgY3NzTG9hZGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gSWYgaWYgcmVxdWlyZWpzIGlzIG5vdCBvbiB0aGUgcGFnZSwgbG9hZCB0aGUgZmlsZSBtYW51YWxseS4gSXQgYmV0dGVyIGNvbnRhaW4gYWxsIGl0cyBkZXBlbmRhbmNpZXMuXG4gICAgICBpZih3aW5kb3cucmVxdWlyZS5fZGVmaW5lZCB8fCBfLmlzVW5kZWZpbmVkKHdpbmRvdy5yZXF1aXJlKSl7XG4gICAgICAgICAganNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XG4gICAgICAgICAganNFbGVtZW50LnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2phdmFzY3JpcHQnKTtcbiAgICAgICAgICBqc0VsZW1lbnQuc2V0QXR0cmlidXRlKCdzcmMnLCAnLycranNVcmwrJy5qcycpO1xuICAgICAgICAgIGpzRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2lkJywgYXBwTmFtZSArICctanMnKTtcbiAgICAgICAgICBkb2N1bWVudC5oZWFkLmFwcGVuZENoaWxkKGpzRWxlbWVudCk7XG4gICAgICAgICAgJChqc0VsZW1lbnQpLm9uKCdsb2FkJywgZnVuY3Rpb24oZXZlbnQpe1xuICAgICAgICAgICAgLy8gQU1EIFdpbGwgTWFuYWdlIERlcGVuZGFuY2llcyBGb3IgVXMuIExvYWQgVGhlIEFwcC5cbiAgICAgICAgICAgIHJlcXVpcmUoW2pzVXJsXSwgZnVuY3Rpb24oUGFnZUNsYXNzKXtcblxuICAgICAgICAgICAgICBpZigoanNMb2FkZWQgPSB0cnVlKSAmJiAoUGFnZUFwcCA9IFBhZ2VDbGFzcykgJiYgY3NzTG9hZGVkKXtcblxuICAgICAgICAgICAgICAgIC8vIEluc3RhbGwgVGhlIExvYWRlZCBSZXNvdXJjZXNcbiAgICAgICAgICAgICAgICBpbnN0YWxsUmVzb3VyY2VzLmNhbGwocm91dGVyLCBQYWdlQXBwLCBhcHBOYW1lLCBpc0dsb2JhbCk7XG4gICAgICAgICAgICAgICAgLy8gUmUtdHJpZ2dlciByb3V0ZSBzbyB0aGUgbmV3bHkgYWRkZWQgcm91dGUgbWF5IGV4ZWN1dGUgaWYgdGhlcmUncyBhIHJvdXRlIG1hdGNoLlxuICAgICAgICAgICAgICAgIC8vIElmIG5vIHJvdXRlcyBhcmUgbWF0Y2hlZCwgYXBwIHdpbGwgaGl0IHdpbGRDYXJkIHJvdXRlIHdoaWNoIHdpbGwgdGhlbiB0cmlnZ2VyIDQwNFxuICAgICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCAmJiByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCl7XG4gICAgICAgICAgICAgICAgICBCYWNrYm9uZS5oaXN0b3J5LmxvYWRVcmwoQmFja2JvbmUuaGlzdG9yeS5mcmFnbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmKCFpc0dsb2JhbCl7XG4gICAgICAgICAgICAgICAgICByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgIH0pO1xuXG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICAvLyBBTUQgV2lsbCBNYW5hZ2UgRGVwZW5kYW5jaWVzIEZvciBVcy4gTG9hZCBUaGUgQXBwLlxuICAgICAgICByZXR1cm4gd2luZG93LnJlcXVpcmUoW2pzVXJsXSwgZnVuY3Rpb24oUGFnZUNsYXNzKXtcblxuICAgICAgICAgIGlmKChqc0xvYWRlZCA9IHRydWUpICYmIChQYWdlQXBwID0gUGFnZUNsYXNzKSAmJiBjc3NMb2FkZWQpe1xuXG4gICAgICAgICAgICAvLyBJbnN0YWxsIFRoZSBMb2FkZWQgUmVzb3VyY2VzXG4gICAgICAgICAgICBpbnN0YWxsUmVzb3VyY2VzLmNhbGwocm91dGVyLCBQYWdlQXBwLCBhcHBOYW1lLCBpc0dsb2JhbCk7XG4gICAgICAgICAgICAvLyBSZS10cmlnZ2VyIHJvdXRlIHNvIHRoZSBuZXdseSBhZGRlZCByb3V0ZSBtYXkgZXhlY3V0ZSBpZiB0aGVyZSdzIGEgcm91dGUgbWF0Y2guXG4gICAgICAgICAgICAvLyBJZiBubyByb3V0ZXMgYXJlIG1hdGNoZWQsIGFwcCB3aWxsIGhpdCB3aWxkQ2FyZCByb3V0ZSB3aGljaCB3aWxsIHRoZW4gdHJpZ2dlciA0MDRcbiAgICAgICAgICAgIGlmKCFpc0dsb2JhbCAmJiByb3V0ZXIuY29uZmlnLnRyaWdnZXJPbkZpcnN0TG9hZCl7XG4gICAgICAgICAgICAgIEJhY2tib25lLmhpc3RvcnkubG9hZFVybChCYWNrYm9uZS5oaXN0b3J5LmZyYWdtZW50KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYoIWlzR2xvYmFsKXtcbiAgICAgICAgICAgICAgcm91dGVyLmNvbmZpZy50cmlnZ2VyT25GaXJzdExvYWQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QucmVtb3ZlKCdsb2FkaW5nJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cblxuICB9XG5cbiAgLy8gU2VydmljZXMga2VlcCB0cmFjayBvZiB0aGVpciBjb25zdW1lcnMuIExhenlDb21wb25lbnQgYXJlIHBsYWNlaG9sZGVyc1xuICAvLyBmb3Igc2VydmljZXMgdGhhdCBoYXZlbid0IGxvYWRlZCB5ZXQuIEEgTGF6eUNvbXBvbmVudCBtaW1pY3MgdGhlIGFwaSBvZiBhXG4gIC8vIHJlYWwgc2VydmljZS9jb21wb25lbnQgKHRoZXkgYXJlIHRoZSBzYW1lKSwgYW5kIHdoZW4gdGhlIHNlcnZpY2UgZmluYWxseVxuICAvLyBsb2FkcywgaXRzIGBgYGh5ZHJhdGVgYGAgbWV0aG9kIGlzIGNhbGxlZC4gQWxsIGNvbnN1bWVycyBvZiB0aGUgc2VydmljZSB3aWxsXG4gIC8vIGhhdmUgdGhlIG5vdyBmdWxseSBsb2FkZWQgc2VydmljZSBzZXQsIHRoZSBMYXp5U2VydmljZSB3aWxsIHRyYW5zZmVyIGFsbCBvZlxuICAvLyBpdHMgY29uc3VtZXJzIG92ZXIgdG8gdGhlIGZ1bGx5IGxvYWRlZCBzZXJ2aWNlLCBhbmQgdGhlbiBkZXN0cm95IGl0c2VsZi5cbiAgZnVuY3Rpb24gTGF6eUNvbXBvbmVudCgpe1xuICAgIHRoaXMuaXNTZXJ2aWNlID0gdHJ1ZTtcbiAgICB0aGlzLmlzQ29tcG9uZW50ID0gdHJ1ZTtcbiAgICB0aGlzLmlzTW9kZWwgPSB0cnVlO1xuICAgIHRoaXMuYXR0cmlidXRlcyA9IHt9O1xuICAgIHRoaXMuY29uc3VtZXJzID0gW107XG4gICAgdGhpcy5zZXQgPSB0aGlzLm9uID0gdGhpcy5vZmYgPSBmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIDE7XG4gICAgfTtcbiAgICB0aGlzLmdldCA9IGZ1bmN0aW9uKHBhdGgpe1xuICAgICAgcmV0dXJuIChwYXRoKSA/IHVuZGVmaW5lZCA6IHRoaXM7XG4gICAgfTtcbiAgICB0aGlzLmh5ZHJhdGUgPSBmdW5jdGlvbihzZXJ2aWNlKXtcbiAgICAgIF8uZWFjaCh0aGlzLmNvbnN1bWVycywgZnVuY3Rpb24oY29uc3VtZXIpe1xuICAgICAgICB2YXIgY29tcG9uZW50ID0gY29uc3VtZXIuY29tcG9uZW50LFxuICAgICAgICAgICAga2V5ID0gY29uc3VtZXIua2V5O1xuICAgICAgICBpZihjb21wb25lbnQuYXR0cmlidXRlcyAmJiBjb21wb25lbnQuc2V0KSBjb21wb25lbnQuc2V0KGtleSwgc2VydmljZSk7XG4gICAgICAgIGlmKGNvbXBvbmVudC5zZXJ2aWNlcykgY29tcG9uZW50LnNlcnZpY2VzW2tleV0gPSBzZXJ2aWNlO1xuICAgICAgICBpZihjb21wb25lbnQuZGVmYXVsdHMpIGNvbXBvbmVudC5kZWZhdWx0c1trZXldID0gc2VydmljZTtcbiAgICAgIH0pO1xuICAgICAgc2VydmljZS5jb25zdW1lcnMgPSB0aGlzLmNvbnN1bWVycztcbiAgICAgIGRlbGV0ZSB0aGlzLmNvbnN1bWVycztcbiAgICB9XG4gIH1cblxuICAvLyBSZWJvdW5kUm91dGVyIENvbnN0cnVjdG9yXG4gIHZhciBSZWJvdW5kUm91dGVyID0gQmFja2JvbmUuUm91dGVyLmV4dGVuZCh7XG5cbiAgICByb3V0ZXM6IHtcbiAgICAgICcqcm91dGUnOiAnd2lsZGNhcmRSb3V0ZSdcbiAgICB9LFxuXG4gICAgLy8gQ2FsbGVkIHdoZW4gbm8gbWF0Y2hpbmcgcm91dGVzIGFyZSBmb3VuZC4gRXh0cmFjdHMgcm9vdCByb3V0ZSBhbmQgZmV0Y2hlcyBpdCByZXNvdXJjZXNcbiAgICB3aWxkY2FyZFJvdXRlOiBmdW5jdGlvbihyb3V0ZSkge1xuICAgICAgdmFyIGFwcE5hbWUsIHByaW1hcnlSb3V0ZTtcblxuICAgICAgLy8gSWYgZW1wdHkgcm91dGUgc2VudCwgcm91dGUgaG9tZVxuICAgICAgcm91dGUgPSByb3V0ZSB8fCAnJztcblxuICAgICAgLy8gR2V0IFJvb3Qgb2YgUm91dGVcbiAgICAgIGFwcE5hbWUgPSBwcmltYXJ5Um91dGUgPSAocm91dGUpID8gcm91dGUuc3BsaXQoJy8nKVswXSA6ICdpbmRleCc7XG5cbiAgICAgIC8vIEZpbmQgQW55IEN1c3RvbSBSb3V0ZSBNYXBwaW5nc1xuICAgICAgXy5hbnkodGhpcy5jb25maWcuaGFuZGxlcnMsIGZ1bmN0aW9uKGhhbmRsZXIpIHtcbiAgICAgICAgaWYgKGhhbmRsZXIucm91dGUudGVzdChyb3V0ZSkpIHtcbiAgICAgICAgICBhcHBOYW1lID0gaGFuZGxlci5wcmltYXJ5Um91dGU7XG4gICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICAvLyBJZiBQYWdlIElzIEFscmVhZHkgTG9hZGVkIFRoZW4gVGhlIFJvdXRlIERvZXMgTm90IEV4aXN0LiA0MDQgYW5kIEV4aXQuXG4gICAgICBpZiAodGhpcy5jdXJyZW50ICYmIHRoaXMuY3VycmVudC5uYW1lID09PSBwcmltYXJ5Um91dGUpIHtcbiAgICAgICAgcmV0dXJuIEJhY2tib25lLmhpc3RvcnkubG9hZFVybCgnNDA0Jyk7XG4gICAgICB9XG5cbiAgICAgIC8vIEZldGNoIFJlc291cmNlc1xuICAgICAgZG9jdW1lbnQuYm9keS5jbGFzc0xpc3QuYWRkKFwibG9hZGluZ1wiKTtcbiAgICAgIGZldGNoUmVzb3VyY2VzLmNhbGwodGhpcywgYXBwTmFtZSwgcHJpbWFyeVJvdXRlKTtcbiAgICB9LFxuXG4gICAgLy8gT24gc3RhcnR1cCwgc2F2ZSBvdXIgY29uZmlnIG9iamVjdCBhbmQgc3RhcnQgdGhlIHJvdXRlclxuICAgIGluaXRpYWxpemU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcblxuICAgICAgLy8gU2F2ZSBvdXIgY29uZmlnIHJlZmVyYW5jZVxuICAgICAgdGhpcy5jb25maWcgPSBvcHRpb25zLmNvbmZpZztcbiAgICAgIHRoaXMuY29uZmlnLmhhbmRsZXJzID0gW107XG5cbiAgICAgIHZhciByZW1vdGVVcmwgPSAvXihbYS16XSs6KXxeKFxcL1xcLyl8XihbXlxcL10rXFwuKS8sXG4gICAgICAgICAgcm91dGVyID0gdGhpcztcblxuICAgICAgLy8gQ29udmVydCBvdXIgcm91dGVNYXBwaW5ncyB0byByZWdleHBzIGFuZCBwdXNoIHRvIG91ciBoYW5kbGVyc1xuICAgICAgXy5lYWNoKHRoaXMuY29uZmlnLnJvdXRlTWFwcGluZywgZnVuY3Rpb24odmFsdWUsIHJvdXRlKXtcbiAgICAgICAgaWYgKCFfLmlzUmVnRXhwKHJvdXRlKSkgcm91dGUgPSByb3V0ZXIuX3JvdXRlVG9SZWdFeHAocm91dGUpO1xuICAgICAgICByb3V0ZXIuY29uZmlnLmhhbmRsZXJzLnVuc2hpZnQoeyByb3V0ZTogcm91dGUsIHByaW1hcnlSb3V0ZTogdmFsdWUgfSk7XG4gICAgICB9LCB0aGlzKTtcblxuICAgICAgLy8gTmF2aWdhdGUgdG8gcm91dGUgZm9yIGFueSBsaW5rIHdpdGggYSByZWxhdGl2ZSBocmVmXG4gICAgICAkKGRvY3VtZW50KS5vbignY2xpY2snLCAnYScsIGZ1bmN0aW9uKGUpe1xuXG4gICAgICAgIHZhciBwYXRoID0gZS50YXJnZXQuZ2V0QXR0cmlidXRlKCdocmVmJyk7XG5cbiAgICAgICAgLy8gSWYgcGF0aCBpcyBub3QgYW4gcmVtb3RlIHVybCwgZW5kcyBpbiAuW2Etel0sIG9yIGJsYW5rLCB0cnkgYW5kIG5hdmlnYXRlIHRvIHRoYXQgcm91dGUuXG4gICAgICAgIGlmKCBwYXRoICYmIHBhdGggIT09ICcjJyAmJiAhcmVtb3RlVXJsLnRlc3QocGF0aCkgKXtcbiAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaWYocGF0aCAhPT0gJy8nK0JhY2tib25lLmhpc3RvcnkuZnJhZ21lbnQpICQoZG9jdW1lbnQpLnVuTWFya0xpbmtzKCk7XG4gICAgICAgICAgcm91dGVyLm5hdmlnYXRlKHBhdGgsIHt0cmlnZ2VyOiB0cnVlfSk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBCYWNrYm9uZS5oaXN0b3J5Lm9uKCdyb3V0ZScsIGZ1bmN0aW9uKHJvdXRlLCBwYXJhbXMpe1xuICAgICAgICAkKGRvY3VtZW50KS5tYXJrTGlua3MoKTtcbiAgICAgIH0pO1xuXG4gICAgICBSZWJvdW5kLnNlcnZpY2VzLnBhZ2UgPSBuZXcgTGF6eUNvbXBvbmVudCgpO1xuXG4gICAgICAvLyBJbnN0YWxsIG91ciBnbG9iYWwgY29tcG9uZW50c1xuICAgICAgXy5lYWNoKHRoaXMuY29uZmlnLnNlcnZpY2VzLCBmdW5jdGlvbihzZWxlY3Rvciwgcm91dGUpe1xuICAgICAgICBSZWJvdW5kLnNlcnZpY2VzW3JvdXRlXSA9IG5ldyBMYXp5Q29tcG9uZW50KCk7XG4gICAgICAgIGZldGNoUmVzb3VyY2VzLmNhbGwocm91dGVyLCByb3V0ZSwgcm91dGUsIHNlbGVjdG9yKTtcbiAgICAgIH0pO1xuXG4gICAgICAvLyBMZXQgYWxsIG9mIG91ciBjb21wb25lbnRzIGFsd2F5cyBoYXZlIHJlZmVyYW5jZSB0byBvdXIgcm91dGVyXG4gICAgICBSZWJvdW5kLkNvbXBvbmVudC5wcm90b3R5cGUucm91dGVyID0gdGhpcztcblxuICAgICAgLy8gU3RhcnQgdGhlIGhpc3RvcnlcbiAgICAgIEJhY2tib25lLmhpc3Rvcnkuc3RhcnQoe1xuICAgICAgICBwdXNoU3RhdGU6IHRydWUsXG4gICAgICAgIHJvb3Q6IHRoaXMuY29uZmlnLnJvb3RcbiAgICAgIH0pO1xuXG4gICAgfVxuICB9KTtcblxuZXhwb3J0IGRlZmF1bHQgUmVib3VuZFJvdXRlcjtcbiIsIi8vICAgICBSZWJvdW5kLmpzIDAuMC42MFxuXG4vLyAgICAgKGMpIDIwMTUgQWRhbSBNaWxsZXJcbi8vICAgICBSZWJvdW5kIG1heSBiZSBmcmVlbHkgZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxuLy8gICAgIEZvciBhbGwgZGV0YWlscyBhbmQgZG9jdW1lbnRhdGlvbjpcbi8vICAgICBodHRwOi8vcmVib3VuZGpzLmNvbVxuXG4vLyBSZWJvdW5kIFJ1bnRpbWVcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxuLy8gSWYgQmFja2JvbmUgaXNuJ3QgcHJlc2V0IG9uIHRoZSBwYWdlIHlldCwgb3IgaWYgYHdpbmRvdy5SZWJvdW5kYCBpcyBhbHJlYWR5XG4vLyBpbiB1c2UsIHRocm93IGFuIGVycm9yXG5pZighd2luZG93LkJhY2tib25lKSB0aHJvdyBcIkJhY2tib25lIG11c3QgYmUgb24gdGhlIHBhZ2UgZm9yIFJlYm91bmQgdG8gbG9hZC5cIjtcbmlmKCF3aW5kb3cuUmVib3VuZCkgdGhyb3cgXCJHbG9iYWwgUmVib3VuZCBuYW1lc3BhY2UgYWxyZWFkeSB0YWtlbi5cIjtcblxuLy8gTG9hZCBvdXIgKipVdGlscyoqLCBoZWxwZXIgZW52aXJvbm1lbnQsICoqUmVib3VuZCBEYXRhKiosXG4vLyAqKlJlYm91bmQgQ29tcG9uZW50cyoqIGFuZCB0aGUgKipSZWJvdW5kIFJvdXRlcioqXG5pbXBvcnQgdXRpbHMgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5pbXBvcnQgaGVscGVycyBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvaGVscGVyc1wiO1xuaW1wb3J0IHsgTW9kZWwsIENvbGxlY3Rpb24sIENvbXB1dGVkUHJvcGVydHkgfSBmcm9tIFwicmVib3VuZC1kYXRhL3JlYm91bmQtZGF0YVwiO1xuaW1wb3J0IENvbXBvbmVudCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvY29tcG9uZW50XCI7XG5pbXBvcnQgUm91dGVyIGZyb20gXCJyZWJvdW5kLXJvdXRlci9yZWJvdW5kLXJvdXRlclwiO1xuXG4vLyBJZiBCYWNrYm9uZSBkb2Vzbid0IGhhdmUgYW4gYWpheCBtZXRob2QgZnJvbSBhbiBleHRlcm5hbCBET00gbGlicmFyeSwgdXNlIG91cnNcbndpbmRvdy5CYWNrYm9uZS5hamF4ID0gd2luZG93LkJhY2tib25lLiQgJiYgd2luZG93LkJhY2tib25lLiQuYWpheCAmJiB3aW5kb3cuQmFja2JvbmUuYWpheCB8fCB1dGlscy5hamF4O1xuXG4vLyBGZXRjaCBSZWJvdW5kJ3MgQ29uZmlnIE9iamVjdCBmcm9tIFJlYm91bmQncyBgc2NyaXB0YCB0YWdcbnZhciBDb25maWcgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnUmVib3VuZCcpLmlubmVySFRNTDtcblxuLy8gQ3JlYXRlIEdsb2JhbCBSZWJvdW5kIE9iamVjdFxud2luZG93LlJlYm91bmQgPSB7XG4gIHNlcnZpY2VzOiB7fSxcbiAgcmVnaXN0ZXJIZWxwZXI6IGhlbHBlcnMucmVnaXN0ZXJIZWxwZXIsXG4gIHJlZ2lzdGVyUGFydGlhbDogaGVscGVycy5yZWdpc3RlclBhcnRpYWwsXG4gIHJlZ2lzdGVyQ29tcG9uZW50OiBDb21wb25lbnQucmVnaXN0ZXIsXG4gIE1vZGVsOiBNb2RlbCxcbiAgQ29sbGVjdGlvbjogQ29sbGVjdGlvbixcbiAgQ29tcHV0ZWRQcm9wZXJ0eTogQ29tcHV0ZWRQcm9wZXJ0eSxcbiAgQ29tcG9uZW50OiBDb21wb25lbnRcbn07XG5cbi8vIFN0YXJ0IHRoZSByb3V0ZXIgaWYgYSBjb25maWcgb2JqZWN0IGlzIHByZXNldFxuaWYoQ29uZmlnKSB3aW5kb3cuUmVib3VuZC5yb3V0ZXIgPSBuZXcgUm91dGVyKHtjb25maWc6IEpTT04ucGFyc2UoQ29uZmlnKX0pO1xuXG5leHBvcnQgZGVmYXVsdCBSZWJvdW5kO1xuIiwiLy8gUmVib3VuZCBIZWxwZXJzXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbmltcG9ydCBMYXp5VmFsdWUgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L2xhenktdmFsdWVcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG5cbnZhciBoZWxwZXJzICA9IHt9LFxuICAgIHBhcnRpYWxzID0ge307XG5cbmhlbHBlcnMucmVnaXN0ZXJQYXJ0aWFsID0gZnVuY3Rpb24obmFtZSwgZnVuYyl7XG4gIGlmKGZ1bmMgJiYgZnVuYy5pc0hUTUxCYXJzICYmIHR5cGVvZiBuYW1lID09PSAnc3RyaW5nJyl7XG4gICAgcGFydGlhbHNbbmFtZV0gPSBmdW5jO1xuICB9XG59O1xuXG4vLyBsb29rdXBIZWxwZXIgcmV0dXJucyB0aGUgZ2l2ZW4gZnVuY3Rpb24gZnJvbSB0aGUgaGVscGVycyBvYmplY3QuIE1hbnVhbCBjaGVja3MgcHJldmVudCB1c2VyIGZyb20gb3ZlcnJpZGluZyByZXNlcnZlZCB3b3Jkcy5cbmhlbHBlcnMubG9va3VwSGVscGVyID0gZnVuY3Rpb24obmFtZSwgZW52KSB7XG4gIChlbnYgJiYgZW52LmhlbHBlcnMpIHx8IChlbnYgPSB7aGVscGVyczp7fX0pO1xuICAvLyBJZiBhIHJlc2VydmVkIGhlbHBlciwgcmV0dXJuIGl0XG4gIGlmKG5hbWUgPT09ICdhdHRyaWJ1dGUnKSB7IHJldHVybiB0aGlzLmF0dHJpYnV0ZTsgfVxuICBpZihuYW1lID09PSAnaWYnKSB7IHJldHVybiB0aGlzLmlmOyB9XG4gIGlmKG5hbWUgPT09ICd1bmxlc3MnKSB7IHJldHVybiB0aGlzLnVubGVzczsgfVxuICBpZihuYW1lID09PSAnZWFjaCcpIHsgcmV0dXJuIHRoaXMuZWFjaDsgfVxuICBpZihuYW1lID09PSAncGFydGlhbCcpIHsgcmV0dXJuIHRoaXMucGFydGlhbDsgfVxuICBpZihuYW1lID09PSAnb24nKSB7IHJldHVybiB0aGlzLm9uOyB9XG4gIGlmKG5hbWUgPT09ICdkZWJ1Z2dlcicpIHsgcmV0dXJuIHRoaXMuZGVidWdnZXI7IH1cbiAgaWYobmFtZSA9PT0gJ2xvZycpIHsgcmV0dXJuIHRoaXMubG9nOyB9XG5cbiAgLy8gSWYgbm90IGEgcmVzZXJ2ZWQgaGVscGVyLCBjaGVjayBlbnYsIHRoZW4gZ2xvYmFsIGhlbHBlcnMsIGVsc2UgcmV0dXJuIGZhbHNlXG4gIHJldHVybiBlbnYuaGVscGVyc1tuYW1lXSB8fCBoZWxwZXJzW25hbWVdIHx8IGZhbHNlO1xufTtcblxuaGVscGVycy5yZWdpc3RlckhlbHBlciA9IGZ1bmN0aW9uKG5hbWUsIGNhbGxiYWNrLCBwYXJhbXMpe1xuICBpZighXy5pc1N0cmluZyhuYW1lKSl7XG4gICAgY29uc29sZS5lcnJvcignTmFtZSBwcm92aWRlZCB0byByZWdpc3RlckhlbHBlciBtdXN0IGJlIGEgc3RyaW5nIScpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZighXy5pc0Z1bmN0aW9uKGNhbGxiYWNrKSl7XG4gICAgY29uc29sZS5lcnJvcignQ2FsbGJhY2sgcHJvdmlkZWQgdG8gcmVnaWVySGVscGVyIG11c3QgYmUgYSBmdW5jdGlvbiEnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYoaGVscGVycy5sb29rdXBIZWxwZXIobmFtZSkpe1xuICAgIGNvbnNvbGUuZXJyb3IoJ0EgaGVscGVyIGNhbGxlZCBcIicgKyBuYW1lICsgJ1wiIGlzIGFscmVhZHkgcmVnaXN0ZXJlZCEnKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBwYXJhbXMgPSAoXy5pc0FycmF5KHBhcmFtcykpID8gcGFyYW1zIDogW3BhcmFtc107XG4gIGNhbGxiYWNrLl9fcGFyYW1zID0gcGFyYW1zO1xuXG4gIGhlbHBlcnNbbmFtZV0gPSBjYWxsYmFjaztcblxufTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRGVmYXVsdCBoZWxwZXJzXG4qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuaGVscGVycy5kZWJ1Z2dlciA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcbiAgZGVidWdnZXI7XG4gIHJldHVybiAnJztcbn1cblxuaGVscGVycy5sb2cgPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG4gIGNvbnNvbGUubG9nLmFwcGx5KGNvbnNvbGUsIHBhcmFtcyk7XG4gIHJldHVybiAnJztcbn1cblxuaGVscGVycy5vbiA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcbiAgdmFyIGksIGNhbGxiYWNrLCBkZWxlZ2F0ZSwgZWxlbWVudCxcbiAgICAgIGV2ZW50TmFtZSA9IHBhcmFtc1swXSxcbiAgICAgIGxlbiA9IHBhcmFtcy5sZW5ndGgsXG4gICAgICBkYXRhID0gaGFzaDtcblxuICAvLyBCeSBkZWZhdWx0IGV2ZXJ5dGhpbmcgaXMgZGVsZWdhdGVkIG9uIHRoZSBwYXJlbnQgY29tcG9uZW50XG4gIGlmKGxlbiA9PT0gMil7XG4gICAgY2FsbGJhY2sgPSBwYXJhbXNbMV07XG4gICAgZGVsZWdhdGUgPSBvcHRpb25zLmVsZW1lbnQ7XG4gICAgZWxlbWVudCA9ICh0aGlzLmVsIHx8IG9wdGlvbnMuZWxlbWVudCk7XG4gIH1cbiAgLy8gSWYgYSBzZWxlY3RvciBpcyBwcm92aWRlZCwgZGVsZWdhdGUgb24gdGhlIGhlbHBlcidzIGVsZW1lbnRcbiAgZWxzZSBpZihsZW4gPT09IDMpe1xuICAgIGNhbGxiYWNrID0gcGFyYW1zWzJdO1xuICAgIGRlbGVnYXRlID0gcGFyYW1zWzFdO1xuICAgIGVsZW1lbnQgPSBvcHRpb25zLmVsZW1lbnQ7XG4gIH1cblxuICAvLyBBdHRhY2ggZXZlbnRcbiAgJChlbGVtZW50KS5vbihldmVudE5hbWUsIGRlbGVnYXRlLCBoYXNoLCBmdW5jdGlvbihldmVudCl7XG4gICAgcmV0dXJuIGVudi5oZWxwZXJzLl9jYWxsT25Db21wb25lbnQoY2FsbGJhY2ssIGV2ZW50KTtcbiAgfSk7XG59O1xuXG5oZWxwZXJzLmxlbmd0aCA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcbiAgICByZXR1cm4gcGFyYW1zWzBdICYmIHBhcmFtc1swXS5sZW5ndGggfHwgMDtcbn07XG5cbmhlbHBlcnMuaWYgPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG5cbiAgdmFyIGNvbmRpdGlvbiA9IHBhcmFtc1swXTtcblxuICBpZihjb25kaXRpb24gPT09IHVuZGVmaW5lZCB8fCBjb25kaXRpb24gPT09IG51bGwpe1xuICAgIGNvbmRpdGlvbiA9IGZhbHNlO1xuICB9XG5cbiAgaWYoY29uZGl0aW9uLmlzTW9kZWwpe1xuICAgIGNvbmRpdGlvbiA9IHRydWU7XG4gIH1cblxuICAvLyBJZiBvdXIgY29uZGl0aW9uIGlzIGFuIGFycmF5LCBoYW5kbGUgcHJvcGVybHlcbiAgaWYoXy5pc0FycmF5KGNvbmRpdGlvbikgfHwgY29uZGl0aW9uLmlzQ29sbGVjdGlvbil7XG4gICAgY29uZGl0aW9uID0gY29uZGl0aW9uLmxlbmd0aCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuXG4gIGlmKGNvbmRpdGlvbiA9PT0gJ3RydWUnKXsgY29uZGl0aW9uID0gdHJ1ZTsgfVxuICBpZihjb25kaXRpb24gPT09ICdmYWxzZScpeyBjb25kaXRpb24gPSBmYWxzZTsgfVxuXG4gIC8vIElmIG1vcmUgdGhhbiBvbmUgcGFyYW0sIHRoaXMgaXMgbm90IGEgYmxvY2sgaGVscGVyLiBFdmFsIGFzIHN1Y2guXG4gIGlmKHBhcmFtcy5sZW5ndGggPiAxKXtcbiAgICByZXR1cm4gKGNvbmRpdGlvbikgPyBwYXJhbXNbMV0gOiAoIHBhcmFtc1syXSB8fCAnJyk7XG4gIH1cblxuICAvLyBDaGVjayBvdXIgY2FjaGUuIElmIHRoZSB2YWx1ZSBoYXNuJ3QgYWN0dWFsbHkgY2hhbmdlZCwgZG9uJ3QgZXZhbHVhdGUuIEltcG9ydGFudCBmb3IgcmUtcmVuZGVyaW5nIG9mICNlYWNoIGhlbHBlcnMuXG4gIGlmKG9wdGlvbnMubW9ycGguX19pZkNhY2hlID09PSBjb25kaXRpb24pe1xuICAgIHJldHVybiBudWxsOyAvLyBSZXR1cm4gbnVsbCBwcmV2ZW50J3MgcmUtcmVuZGluZyBvZiBvdXIgcGxhY2Vob2xkZXIuXG4gIH1cblxuICBvcHRpb25zLm1vcnBoLl9faWZDYWNoZSA9IGNvbmRpdGlvbjtcblxuICAvLyBSZW5kZXIgdGhlIGFwcm9wcmVhdGUgYmxvY2sgc3RhdGVtZW50XG4gIGlmKGNvbmRpdGlvbiAmJiBvcHRpb25zLnRlbXBsYXRlKXtcbiAgICByZXR1cm4gb3B0aW9ucy50ZW1wbGF0ZS5yZW5kZXIob3B0aW9ucy5jb250ZXh0LCBlbnYsIG9wdGlvbnMubW9ycGguY29udGV4dHVhbEVsZW1lbnQpO1xuICB9XG4gIGVsc2UgaWYoIWNvbmRpdGlvbiAmJiBvcHRpb25zLmludmVyc2Upe1xuICAgIHJldHVybiBvcHRpb25zLmludmVyc2UucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgZW52LCBvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50KTtcbiAgfVxuXG4gIHJldHVybiAnJztcbn07XG5cblxuLy8gVE9ETzogUHJveHkgdG8gaWYgaGVscGVyIHdpdGggaW52ZXJ0ZWQgcGFyYW1zXG5oZWxwZXJzLnVubGVzcyA9IGZ1bmN0aW9uKHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52KXtcbiAgdmFyIGNvbmRpdGlvbiA9IHBhcmFtc1swXTtcblxuICBpZihjb25kaXRpb24gPT09IHVuZGVmaW5lZCB8fCBjb25kaXRpb24gPT09IG51bGwpe1xuICAgIGNvbmRpdGlvbiA9IGZhbHNlO1xuICB9XG5cbiAgaWYoY29uZGl0aW9uLmlzTW9kZWwpe1xuICAgIGNvbmRpdGlvbiA9IHRydWU7XG4gIH1cblxuICAvLyBJZiBvdXIgY29uZGl0aW9uIGlzIGFuIGFycmF5LCBoYW5kbGUgcHJvcGVybHlcbiAgaWYoXy5pc0FycmF5KGNvbmRpdGlvbikgfHwgY29uZGl0aW9uLmlzQ29sbGVjdGlvbil7XG4gICAgY29uZGl0aW9uID0gY29uZGl0aW9uLmxlbmd0aCA/IHRydWUgOiBmYWxzZTtcbiAgfVxuXG4gIC8vIElmIG1vcmUgdGhhbiBvbmUgcGFyYW0sIHRoaXMgaXMgbm90IGEgYmxvY2sgaGVscGVyLiBFdmFsIGFzIHN1Y2guXG4gIGlmKHBhcmFtcy5sZW5ndGggPiAxKXtcbiAgICByZXR1cm4gKCFjb25kaXRpb24pID8gcGFyYW1zWzFdIDogKCBwYXJhbXNbMl0gfHwgJycpO1xuICB9XG5cbiAgLy8gQ2hlY2sgb3VyIGNhY2hlLiBJZiB0aGUgdmFsdWUgaGFzbid0IGFjdHVhbGx5IGNoYW5nZWQsIGRvbid0IGV2YWx1YXRlLiBJbXBvcnRhbnQgZm9yIHJlLXJlbmRlcmluZyBvZiAjZWFjaCBoZWxwZXJzLlxuICBpZihvcHRpb25zLm1vcnBoLl9fdW5sZXNzQ2FjaGUgPT09IGNvbmRpdGlvbil7XG4gICAgcmV0dXJuIG51bGw7IC8vIFJldHVybiBudWxsIHByZXZlbnQncyByZS1yZW5kaW5nIG9mIG91ciBwbGFjZWhvbGRlci5cbiAgfVxuXG4gIG9wdGlvbnMubW9ycGguX191bmxlc3NDYWNoZSA9IGNvbmRpdGlvbjtcblxuICAvLyBSZW5kZXIgdGhlIGFwcm9wcmVhdGUgYmxvY2sgc3RhdGVtZW50XG4gIGlmKCFjb25kaXRpb24gJiYgIG9wdGlvbnMudGVtcGxhdGUpe1xuICAgIHJldHVybiBvcHRpb25zLnRlbXBsYXRlLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIGVudiwgb3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCk7XG4gIH1cbiAgZWxzZSBpZihjb25kaXRpb24gJiYgb3B0aW9ucy5pbnZlcnNlKXtcbiAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIGVudiwgb3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCk7XG4gIH1cblxuICByZXR1cm4gJyc7XG59O1xuXG4vLyBHaXZlbiBhbiBhcnJheSwgcHJlZGljYXRlIGFuZCBvcHRpb25hbCBleHRyYSB2YXJpYWJsZSwgZmluZHMgdGhlIGluZGV4IGluIHRoZSBhcnJheSB3aGVyZSBwcmVkaWNhdGUgaXMgdHJ1ZVxuZnVuY3Rpb24gZmluZEluZGV4KGFyciwgcHJlZGljYXRlLCBjaWQpIHtcbiAgaWYgKGFyciA9PSBudWxsKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZmluZEluZGV4IGNhbGxlZCBvbiBudWxsIG9yIHVuZGVmaW5lZCcpO1xuICB9XG4gIGlmICh0eXBlb2YgcHJlZGljYXRlICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcigncHJlZGljYXRlIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuICB9XG4gIHZhciBsaXN0ID0gT2JqZWN0KGFycik7XG4gIHZhciBsZW5ndGggPSBsaXN0Lmxlbmd0aCA+Pj4gMDtcbiAgdmFyIHRoaXNBcmcgPSBhcmd1bWVudHNbMV07XG4gIHZhciB2YWx1ZTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgdmFsdWUgPSBsaXN0W2ldO1xuICAgIGlmIChwcmVkaWNhdGUuY2FsbCh0aGlzQXJnLCB2YWx1ZSwgaSwgbGlzdCwgY2lkKSkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICB9XG4gIHJldHVybiAtMTtcbn1cblxuaGVscGVycy5lYWNoID0gZnVuY3Rpb24ocGFyYW1zLCBoYXNoLCBvcHRpb25zLCBlbnYpe1xuXG4gIGlmKF8uaXNOdWxsKHBhcmFtc1swXSkgfHwgXy5pc1VuZGVmaW5lZChwYXJhbXNbMF0pKXsgY29uc29sZS53YXJuKCdVbmRlZmluZWQgdmFsdWUgcGFzc2VkIHRvIGVhY2ggaGVscGVyISBNYXliZSB0cnkgcHJvdmlkaW5nIGEgZGVmYXVsdCB2YWx1ZT8nLCBvcHRpb25zLmNvbnRleHQpOyByZXR1cm4gbnVsbDsgfVxuXG4gIHZhciB2YWx1ZSA9IChwYXJhbXNbMF0uaXNDb2xsZWN0aW9uKSA/IHBhcmFtc1swXS5tb2RlbHMgOiBwYXJhbXNbMF0sIC8vIEFjY2VwdHMgY29sbGVjdGlvbnMgb3IgYXJyYXlzXG4gICAgICBtb3JwaCA9IG9wdGlvbnMubW9ycGguZmlyc3RDaGlsZE1vcnBoLCBvYmosIG5leHQsIGxhenlWYWx1ZSwgbm1vcnBoLCBpLCAgLy8gdXNlZCBiZWxvdyB0byByZW1vdmUgdHJhaWxpbmcganVuayBtb3JwaHMgZnJvbSB0aGUgZG9tXG4gICAgICBwb3NpdGlvbiwgLy8gU3RvcmVzIHRoZSBpdGVyYXRlZCBlbGVtZW50J3MgaW50ZWdlciBwb3NpdGlvbiBpbiB0aGUgZG9tIGxpc3RcbiAgICAgIGN1cnJlbnRNb2RlbCA9IGZ1bmN0aW9uKGVsZW1lbnQsIGluZGV4LCBhcnJheSwgY2lkKXtcbiAgICAgICAgcmV0dXJuIGVsZW1lbnQuY2lkID09PSBjaWQ7IC8vIFJldHVybnMgdHJ1ZSBpZiBjdXJyZW50bHkgb2JzZXJ2ZWQgZWxlbWVudCBpcyB0aGUgY3VycmVudCBtb2RlbC5cbiAgICAgIH07XG5cbiAgaWYoKCFfLmlzQXJyYXkodmFsdWUpIHx8IHZhbHVlLmxlbmd0aCA9PT0gMCkgJiYgb3B0aW9ucy5pbnZlcnNlKXtcbiAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlLnJlbmRlcihvcHRpb25zLmNvbnRleHQsIGVudiwgb3B0aW9ucy5tb3JwaC5jb250ZXh0dWFsRWxlbWVudCk7XG4gIH1cblxuICAvLyBGb3IgZWFjaCBpdGVtIGluIHRoaXMgY29sbGVjdGlvblxuICBmb3IoaT0wO2kgPCB2YWx1ZS5sZW5ndGg7aSsrKXtcbiAgICBvYmogPSB2YWx1ZVtpXTtcbiAgICBuZXh0ID0gKG1vcnBoKSA/IG1vcnBoLm5leHRNb3JwaCA6IG51bGw7XG5cbiAgICAvLyBJZiB0aGlzIG1vcnBoIGlzIHRoZSByZW5kZXJlZCB2ZXJzaW9uIG9mIHRoaXMgbW9kZWwsIGNvbnRpbnVlIHRvIHRoZSBuZXh0IG9uZS5cbiAgICBpZihtb3JwaCAmJiBtb3JwaC5jaWQgPT0gb2JqLmNpZCl7IG1vcnBoID0gbmV4dDsgY29udGludWU7IH1cblxuICAgIG5tb3JwaCA9IG9wdGlvbnMubW9ycGguaW5zZXJ0Q29udGVudEJlZm9yZU1vcnBoKCcnLCBtb3JwaCk7XG5cbiAgICAvLyBDcmVhdGUgYSBsYXp5dmFsdWUgd2hvcyB2YWx1ZSBpcyB0aGUgY29udGVudCBpbnNpZGUgb3VyIGJsb2NrIGhlbHBlciByZW5kZXJlZCBpbiB0aGUgY29udGV4dCBvZiB0aGlzIGN1cnJlbnQgbGlzdCBvYmplY3QuIFJldHVybnMgdGhlIHJlbmRlcmVkIGRvbSBmb3IgdGhpcyBsaXN0IGl0ZW0uXG4gICAgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpe1xuICAgICAgcmV0dXJuIG9wdGlvbnMudGVtcGxhdGUucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgZW52LCBvcHRpb25zLm1vcnBoLmNvbnRleHR1YWxFbGVtZW50LCBbb2JqXSk7XG4gICAgfSwge21vcnBoOiBvcHRpb25zLm1vcnBofSk7XG5cbiAgICAvLyBJbnNlcnQgb3VyIG5ld2x5IHJlbmRlcmVkIHZhbHVlIChhIGRvY3VtZW50IHRyZWUpIGludG8gb3VyIHBsYWNlaG9sZGVyICh0aGUgY29udGFpbmluZyBlbGVtZW50KSBhdCBpdHMgcmVxdWVzdGVkIHBvc2l0aW9uICh3aGVyZSB3ZSBjdXJyZW50bHkgYXJlIGluIHRoZSBvYmplY3QgbGlzdClcbiAgICBubW9ycGguc2V0Q29udGVudChsYXp5VmFsdWUudmFsdWUoKSk7XG5cbiAgICAvLyBMYWJlbCB0aGUgaW5zZXJ0ZWQgbW9ycGggZWxlbWVudCB3aXRoIHRoaXMgbW9kZWwncyBjaWRcbiAgICBubW9ycGguY2lkID0gb2JqLmNpZDtcblxuICAgIC8vIERlc3Ryb3kgdGhlIG9sZCBtb3JwaCB0aGF0IHdhcyBoZXJlXG4gICAgbW9ycGggJiYgbW9ycGguZGVzdHJveSgpO1xuXG4gICAgLy8gTW92ZSBvbiB0byB0aGUgbmV4dCBtb3JwaFxuICAgIG1vcnBoID0gbmV4dDtcbiAgfVxuXG4gIC8vIElmIGFueSBtb3JlIG1vcnBocyBhcmUgbGVmdCBvdmVyLCByZW1vdmUgdGhlbS4gV2UndmUgYWxyZWFkeSBnb25lIHRocm91Z2ggYWxsIHRoZSBtb2RlbHMuXG4gIHdoaWxlKG1vcnBoKXtcbiAgICBuZXh0ID0gbW9ycGgubmV4dE1vcnBoO1xuICAgIG1vcnBoLmRlc3Ryb3koKTtcbiAgICBtb3JwaCA9IG5leHQ7XG4gIH1cblxuICAvLyBSZXR1cm4gbnVsbCBwcmV2ZW50J3MgcmUtcmVuZGluZyBvZiBvdXIgcGxhY2Vob2xkZXIuIE91ciBwbGFjZWhvbGRlciAoY29udGFpbmluZyBlbGVtZW50KSBub3cgaGFzIGFsbCB0aGUgZG9tIHdlIG5lZWQuXG4gIHJldHVybiBudWxsO1xuXG59O1xuXG5oZWxwZXJzLnBhcnRpYWwgPSBmdW5jdGlvbihwYXJhbXMsIGhhc2gsIG9wdGlvbnMsIGVudil7XG4gIHZhciBwYXJ0aWFsID0gcGFydGlhbHNbcGFyYW1zWzBdXTtcbiAgaWYoIHBhcnRpYWwgJiYgcGFydGlhbC5pc0hUTUxCYXJzICl7XG4gICAgcmV0dXJuIHBhcnRpYWwucmVuZGVyKG9wdGlvbnMuY29udGV4dCwgZW52KTtcbiAgfVxuXG59O1xuXG5leHBvcnQgZGVmYXVsdCBoZWxwZXJzO1xuIiwiLy8gUmVib3VuZCBDb21wdXRlZCBQcm9wZXJ0eVxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgcHJvcGVydHlDb21waWxlciBmcm9tIFwicHJvcGVydHktY29tcGlsZXIvcHJvcGVydHktY29tcGlsZXJcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG4vLyBSZXR1cm5zIHRydWUgaWYgc3RyIHN0YXJ0cyB3aXRoIHRlc3RcbmZ1bmN0aW9uIHN0YXJ0c1dpdGgoc3RyLCB0ZXN0KXtcbiAgaWYoc3RyID09PSB0ZXN0KSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIHN0ci5zdWJzdHJpbmcoMCwgdGVzdC5sZW5ndGgrMSkgPT09IHRlc3QrJy4nO1xufVxuXG5cbi8vIENhbGxlZCBhZnRlciBjYWxsc3RhY2sgaXMgZXhhdXN0ZWQgdG8gY2FsbCBhbGwgb2YgdGhpcyBjb21wdXRlZCBwcm9wZXJ0eSdzXG4vLyBkZXBlbmRhbnRzIHRoYXQgbmVlZCB0byBiZSByZWNvbXB1dGVkXG5mdW5jdGlvbiByZWNvbXB1dGVDYWxsYmFjaygpe1xuICB2YXIgaSA9IDAsIGxlbiA9IHRoaXMuX3RvQ2FsbC5sZW5ndGg7XG4gIGRlbGV0ZSB0aGlzLl9yZWNvbXB1dGVUaW1lb3V0O1xuICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgdGhpcy5fdG9DYWxsLnNoaWZ0KCkuY2FsbCgpO1xuICB9XG4gIHRoaXMuX3RvQ2FsbC5hZGRlZCA9IHt9O1xufVxuXG52YXIgQ29tcHV0ZWRQcm9wZXJ0eSA9IGZ1bmN0aW9uKHByb3AsIG9wdGlvbnMpe1xuXG4gIGlmKCFfLmlzRnVuY3Rpb24ocHJvcCkpIHJldHVybiBjb25zb2xlLmVycm9yKCdDb21wdXRlZFByb3BlcnR5IGNvbnN0cnVjdG9yIG11c3QgYmUgcGFzc2VkIGEgZnVuY3Rpb24hJywgcHJvcCwgJ0ZvdW5kIGluc3RlYWQuJyk7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICB0aGlzLmNpZCA9IF8udW5pcXVlSWQoJ2NvbXB1dGVkUHJvcGV0eScpO1xuICB0aGlzLm5hbWUgPSBvcHRpb25zLm5hbWU7XG4gIHRoaXMucmV0dXJuVHlwZSA9IG51bGw7XG4gIHRoaXMuX19vYnNlcnZlcnMgPSB7fTtcbiAgdGhpcy5oZWxwZXJzID0ge307XG4gIHRoaXMud2FpdGluZyA9IHt9O1xuICB0aGlzLmlzQ2hhbmdpbmcgPSBmYWxzZTtcbiAgdGhpcy5pc0RpcnR5ID0gdHJ1ZTtcbiAgdGhpcy5mdW5jID0gcHJvcDtcbiAgXy5iaW5kQWxsKHRoaXMsICdvbk1vZGlmeScsICdtYXJrRGlydHknKTtcbiAgdGhpcy5kZXBzID0gcHJvcGVydHlDb21waWxlci5jb21waWxlKHByb3AsIHRoaXMubmFtZSk7XG5cbiAgLy8gQ3JlYXRlIGxpbmVhZ2UgdG8gcGFzcyB0byBvdXIgY2FjaGUgb2JqZWN0c1xuICB2YXIgbGluZWFnZSA9IHtcbiAgICBwYXJlbnQ6IHRoaXMuc2V0UGFyZW50KCBvcHRpb25zLnBhcmVudCB8fCB0aGlzICksXG4gICAgcm9vdDogdGhpcy5zZXRSb290KCBvcHRpb25zLnJvb3QgfHwgb3B0aW9ucy5wYXJlbnQgfHwgdGhpcyApLFxuICAgIHBhdGg6IHRoaXMuX19wYXRoID0gb3B0aW9ucy5wYXRoIHx8IHRoaXMuX19wYXRoXG4gIH07XG5cbiAgLy8gUmVzdWx0cyBDYWNoZSBPYmplY3RzXG4gIC8vIFRoZXNlIG1vZGVscyB3aWxsIG5ldmVyIGJlIHJlLWNyZWF0ZWQgZm9yIHRoZSBsaWZldGltZSBvZiB0aGUgQ29tcHV0ZWQgUHJvZXBydHlcbiAgLy8gT24gUmVjb21wdXRlIHRoZXkgYXJlIHVwZGF0ZWQgd2l0aCBuZXcgdmFsdWVzLlxuICAvLyBPbiBDaGFuZ2UgdGhlaXIgbmV3IHZhbHVlcyBhcmUgcHVzaGVkIHRvIHRoZSBvYmplY3QgaXQgaXMgdHJhY2tpbmdcbiAgdGhpcy5jYWNoZSA9IHtcbiAgICBtb2RlbDogbmV3IFJlYm91bmQuTW9kZWwoe30sIGxpbmVhZ2UpLFxuICAgIGNvbGxlY3Rpb246IG5ldyBSZWJvdW5kLkNvbGxlY3Rpb24oW10sIGxpbmVhZ2UpLFxuICAgIHZhbHVlOiB1bmRlZmluZWRcbiAgfTtcblxuICB0aGlzLndpcmUoKTtcblxufTtcblxuXy5leHRlbmQoQ29tcHV0ZWRQcm9wZXJ0eS5wcm90b3R5cGUsIEJhY2tib25lLkV2ZW50cywge1xuXG4gIGlzQ29tcHV0ZWRQcm9wZXJ0eTogdHJ1ZSxcbiAgaXNEYXRhOiB0cnVlLFxuICBfX3BhdGg6IGZ1bmN0aW9uKCl7IHJldHVybiAnJzsgfSxcblxuXG4gIG1hcmtEaXJ0eTogZnVuY3Rpb24oKXtcbiAgICBpZih0aGlzLmlzRGlydHkpIHJldHVybjtcbiAgICB0aGlzLmlzRGlydHkgPSB0cnVlO1xuICAgIHRoaXMudHJpZ2dlcignZGlydHknLCB0aGlzKTtcbiAgfSxcblxuICAvLyBBdHRhY2hlZCB0byBsaXN0ZW4gdG8gYWxsIGV2ZW50cyB3aGVyZSB0aGlzIENvbXB1dGVkIFByb3BlcnR5J3MgZGVwZW5kYW5jaWVzXG4gIC8vIGFyZSBzdG9yZWQuIFNlZSB3aXJlKCkuIFdpbGwgcmUtZXZhbHVhdGUgYW55IGNvbXB1dGVkIHByb3BlcnRpZXMgdGhhdFxuICAvLyBkZXBlbmQgb24gdGhlIGNoYW5nZWQgZGF0YSB2YWx1ZSB3aGljaCB0cmlnZ2VyZWQgdGhpcyBjYWxsYmFjay5cbiAgb25SZWNvbXB1dGU6IGZ1bmN0aW9uKHR5cGUsIG1vZGVsLCBjb2xsZWN0aW9uLCBvcHRpb25zKXtcbiAgICB2YXIgc2hvcnRjaXJjdWl0ID0geyBjaGFuZ2U6IDEsIHNvcnQ6IDEsIHJlcXVlc3Q6IDEsIGRlc3Ryb3k6IDEsIHN5bmM6IDEsIGVycm9yOiAxLCBpbnZhbGlkOiAxLCByb3V0ZTogMSwgZGlydHk6IDEgfTtcbiAgICBpZiggc2hvcnRjaXJjdWl0W3R5cGVdIHx8ICFtb2RlbC5pc0RhdGEgKSByZXR1cm47XG4gICAgbW9kZWwgfHwgKG1vZGVsID0ge30pO1xuICAgIGNvbGxlY3Rpb24gfHwgKGNvbGxlY3Rpb24gPSB7fSk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICB0aGlzLl90b0NhbGwgfHwgKHRoaXMuX3RvQ2FsbCA9IFtdKTtcbiAgICB0aGlzLl90b0NhbGwuYWRkZWQgfHwgKHRoaXMuX3RvQ2FsbC5hZGRlZCA9IHt9KTtcbiAgICAhY29sbGVjdGlvbi5pc0RhdGEgJiYgKG9wdGlvbnMgPSBjb2xsZWN0aW9uKSAmJiAoY29sbGVjdGlvbiA9IG1vZGVsKTtcbiAgICB2YXIgcHVzaCA9IGZ1bmN0aW9uKGFycil7XG4gICAgICB2YXIgaSwgbGVuID0gYXJyLmxlbmd0aDtcbiAgICAgIHRoaXMuYWRkZWQgfHwgKHRoaXMuYWRkZWQgPSB7fSk7XG4gICAgICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgICAgIGlmKHRoaXMuYWRkZWRbYXJyW2ldLmNpZF0pIGNvbnRpbnVlO1xuICAgICAgICB0aGlzLmFkZGVkW2FycltpXS5jaWRdID0gMTtcbiAgICAgICAgdGhpcy5wdXNoKGFycltpXSk7XG4gICAgICB9XG4gICAgfSwgcGF0aCwgdmVjdG9yO1xuICAgIHZlY3RvciA9IHBhdGggPSBjb2xsZWN0aW9uLl9fcGF0aCgpLnJlcGxhY2UoL1xcLj9cXFsuKlxcXS9pZywgJy5AZWFjaCcpO1xuXG4gICAgLy8gSWYgYSByZXNldCBldmVudCBvbiBhIE1vZGVsLCBjaGVjayBmb3IgY29tcHV0ZWQgcHJvcGVydGllcyB0aGF0IGRlcGVuZFxuICAgIC8vIG9uIGVhY2ggY2hhbmdlZCBhdHRyaWJ1dGUncyBmdWxsIHBhdGguXG4gICAgaWYodHlwZSA9PT0gJ3Jlc2V0JyAmJiBvcHRpb25zLnByZXZpb3VzQXR0cmlidXRlcyl7XG4gICAgICBfLmVhY2gob3B0aW9ucy5wcmV2aW91c0F0dHJpYnV0ZXMsIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuICAgICAgICB2ZWN0b3IgPSBwYXRoICsgKHBhdGggJiYgJy4nKSArIGtleTtcbiAgICAgICAgXy5lYWNoKHRoaXMuX19jb21wdXRlZERlcHMsIGZ1bmN0aW9uKGRlcGVuZGFudHMsIGRlcGVuZGFuY3kpe1xuICAgICAgICAgIHN0YXJ0c1dpdGgodmVjdG9yLCBkZXBlbmRhbmN5KSAmJiBwdXNoLmNhbGwodGhpcy5fdG9DYWxsLCBkZXBlbmRhbnRzKTtcbiAgICAgICAgfSwgdGhpcyk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhIHJlc2V0IGV2ZW50IG9uIGEgQ29sbGN0aW9uLCBjaGVjayBmb3IgY29tcHV0ZWQgcHJvcGVydGllcyB0aGF0IGRlcGVuZFxuICAgIC8vIG9uIGFueXRoaW5nIGluc2lkZSB0aGF0IGNvbGxlY3Rpb24uXG4gICAgZWxzZSBpZih0eXBlID09PSAncmVzZXQnICYmIG9wdGlvbnMucHJldmlvdXNNb2RlbHMpe1xuICAgICAgXy5lYWNoKHRoaXMuX19jb21wdXRlZERlcHMsIGZ1bmN0aW9uKGRlcGVuZGFudHMsIGRlcGVuZGFuY3kpe1xuICAgICAgICBzdGFydHNXaXRoKGRlcGVuZGFuY3ksIHZlY3RvcikgJiYgcHVzaC5jYWxsKHRoaXMuX3RvQ2FsbCwgZGVwZW5kYW50cyk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICAvLyBJZiBhbiBhZGQgb3IgcmVtb3ZlIGV2ZW50LCBjaGVjayBmb3IgY29tcHV0ZWQgcHJvcGVydGllcyB0aGF0IGRlcGVuZCBvblxuICAgIC8vIGFueXRoaW5nIGluc2lkZSB0aGF0IGNvbGxlY3Rpb24gb3IgdGhhdCBjb250YWlucyB0aGF0IGNvbGxlY3Rpb24uXG4gICAgZWxzZSBpZih0eXBlID09PSAnYWRkJyB8fCB0eXBlID09PSAncmVtb3ZlJyl7XG4gICAgICBfLmVhY2godGhpcy5fX2NvbXB1dGVkRGVwcywgZnVuY3Rpb24oZGVwZW5kYW50cywgZGVwZW5kYW5jeSl7XG4gICAgICAgIGlmKCBzdGFydHNXaXRoKGRlcGVuZGFuY3ksIHZlY3RvcikgfHwgc3RhcnRzV2l0aCh2ZWN0b3IsIGRlcGVuZGFuY3kpICkgcHVzaC5jYWxsKHRoaXMuX3RvQ2FsbCwgZGVwZW5kYW50cyk7O1xuICAgICAgfSwgdGhpcyk7XG4gICAgfVxuXG4gICAgLy8gSWYgYSBjaGFuZ2UgZXZlbnQsIHRyaWdnZXIgYW55dGhpbmcgdGhhdCBkZXBlbmRzIG9uIHRoYXQgY2hhbmdlZCBwYXRoLlxuICAgIGVsc2UgaWYodHlwZS5pbmRleE9mKCdjaGFuZ2U6JykgPT09IDApe1xuICAgICAgdmVjdG9yID0gdHlwZS5yZXBsYWNlKCdjaGFuZ2U6JywgJycpLnJlcGxhY2UoL1xcLj9cXFsuKlxcXS9pZywgJy5AZWFjaCcpO1xuICAgICAgXy5lYWNoKHRoaXMuX19jb21wdXRlZERlcHMsIGZ1bmN0aW9uKGRlcGVuZGFudHMsIGRlcGVuZGFuY3kpe1xuICAgICAgICBzdGFydHNXaXRoKHZlY3RvciwgZGVwZW5kYW5jeSkgJiYgcHVzaC5jYWxsKHRoaXMuX3RvQ2FsbCwgZGVwZW5kYW50cyk7XG4gICAgICB9LCB0aGlzKTtcbiAgICB9XG5cbiAgICB2YXIgaSwgbGVuID0gdGhpcy5fdG9DYWxsLmxlbmd0aDtcbiAgICBmb3IoaT0wO2k8bGVuO2krKyl7XG4gICAgICB0aGlzLl90b0NhbGxbaV0ubWFya0RpcnR5KCk7XG4gICAgfVxuXG4gICAgLy8gTm90aWZpZXMgYWxsIGNvbXB1dGVkIHByb3BlcnRpZXMgaW4gdGhlIGRlcGVuZGFudHMgYXJyYXkgdG8gcmVjb21wdXRlLlxuICAgIC8vIE1hcmtzIGV2ZXJ5b25lIGFzIGRpcnR5IGFuZCB0aGVuIGNhbGxzIHRoZW0uXG4gICAgaWYoIXRoaXMuX3JlY29tcHV0ZVRpbWVvdXQpIHRoaXMuX3JlY29tcHV0ZVRpbWVvdXQgPSBzZXRUaW1lb3V0KF8uYmluZChyZWNvbXB1dGVDYWxsYmFjaywgdGhpcyksIDApO1xuICAgIHJldHVybjtcbiAgfSxcblxuXG4gIC8vIENhbGxlZCB3aGVuIGEgQ29tcHV0ZWQgUHJvcGVydHkncyBhY3RpdmUgY2FjaGUgb2JqZWN0IGNoYW5nZXMuXG4gIC8vIFB1c2hlcyBhbnkgY2hhbmdlcyB0byBDb21wdXRlZCBQcm9wZXJ0eSB0aGF0IHJldHVybnMgYSBkYXRhIG9iamVjdCBiYWNrIHRvXG4gIC8vIHRoZSBvcmlnaW5hbCBvYmplY3QuXG4gIG9uTW9kaWZ5OiBmdW5jdGlvbih0eXBlLCBtb2RlbCwgY29sbGVjdGlvbiwgb3B0aW9ucyl7XG4gICAgdmFyIHNob3J0Y2lyY3VpdCA9IHsgc29ydDogMSwgcmVxdWVzdDogMSwgZGVzdHJveTogMSwgc3luYzogMSwgZXJyb3I6IDEsIGludmFsaWQ6IDEsIHJvdXRlOiAxIH07XG4gICAgaWYoICF0aGlzLnRyYWNraW5nIHx8IHNob3J0Y2lyY3VpdFt0eXBlXSB8fCB+dHlwZS5pbmRleE9mKCdjaGFuZ2U6JykgKSByZXR1cm47XG4gICAgbW9kZWwgfHwgKG1vZGVsID0ge30pO1xuICAgIGNvbGxlY3Rpb24gfHwgKGNvbGxlY3Rpb24gPSB7fSk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICAhY29sbGVjdGlvbi5pc0RhdGEgJiYgXy5pc09iamVjdChjb2xsZWN0aW9uKSAmJiAob3B0aW9ucyA9IGNvbGxlY3Rpb24pICYmIChjb2xsZWN0aW9uID0gbW9kZWwpO1xuICAgIHZhciBzcmMgPSB0aGlzO1xuICAgIHZhciBwYXRoID0gY29sbGVjdGlvbi5fX3BhdGgoKS5yZXBsYWNlKHNyYy5fX3BhdGgoKSwgJycpLnJlcGxhY2UoL15cXC4vLCAnJyk7XG4gICAgdmFyIGRlc3QgPSB0aGlzLnRyYWNraW5nLmdldChwYXRoKTtcblxuICAgIGlmKF8uaXNVbmRlZmluZWQoZGVzdCkpIHJldHVybjtcbiAgICBpZih0eXBlID09PSAnY2hhbmdlJykgZGVzdC5zZXQgJiYgZGVzdC5zZXQobW9kZWwuY2hhbmdlZEF0dHJpYnV0ZXMoKSk7XG4gICAgZWxzZSBpZih0eXBlID09PSAncmVzZXQnKSBkZXN0LnJlc2V0ICYmIGRlc3QucmVzZXQobW9kZWwpO1xuICAgIGVsc2UgaWYodHlwZSA9PT0gJ2FkZCcpICBkZXN0LmFkZCAmJiBkZXN0LmFkZChtb2RlbCk7XG4gICAgZWxzZSBpZih0eXBlID09PSAncmVtb3ZlJykgIGRlc3QucmVtb3ZlICYmIGRlc3QucmVtb3ZlKG1vZGVsKTtcbiAgICAvLyBUT0RPOiBBZGQgc29ydFxuICB9LFxuXG4gIC8vIEFkZHMgYSBsaXRlbmVyIHRvIHRoZSByb290IG9iamVjdCBhbmQgdGVsbHMgaXQgd2hhdCBwcm9wZXJ0aWVzIHRoaXNcbiAgLy8gQ29tcHV0ZWQgUHJvcGVydHkgZGVwZW5kIG9uLlxuICAvLyBUaGUgbGlzdGVuZXIgd2lsbCByZS1jb21wdXRlIHRoaXMgQ29tcHV0ZWQgUHJvcGVydHkgd2hlbiBhbnkgYXJlIGNoYW5nZWQuXG4gIHdpcmU6IGZ1bmN0aW9uKCl7XG4gICAgdmFyIHJvb3QgPSB0aGlzLl9fcm9vdF9fO1xuICAgIHZhciBjb250ZXh0ID0gdGhpcy5fX3BhcmVudF9fO1xuICAgIHJvb3QuX19jb21wdXRlZERlcHMgfHwgKHJvb3QuX19jb21wdXRlZERlcHMgPSB7fSk7XG5cbiAgICBfLmVhY2godGhpcy5kZXBzLCBmdW5jdGlvbihwYXRoKXtcbiAgICAgIHZhciBkZXAgPSByb290LmdldChwYXRoLCB7cmF3OiB0cnVlfSk7XG4gICAgICBpZighZGVwIHx8ICFkZXAuaXNDb21wdXRlZFByb3BlcnR5KSByZXR1cm47XG4gICAgICBkZXAub24oJ2RpcnR5JywgdGhpcy5tYXJrRGlydHkpO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgXy5lYWNoKHRoaXMuZGVwcywgZnVuY3Rpb24ocGF0aCl7XG4gICAgICAvLyBGaW5kIGFjdHVhbCBwYXRoIGZyb20gcmVsYXRpdmUgcGF0aHNcbiAgICAgIHZhciBzcGxpdCA9ICQuc3BsaXRQYXRoKHBhdGgpO1xuICAgICAgd2hpbGUoc3BsaXRbMF0gPT09ICdAcGFyZW50Jyl7XG4gICAgICAgIGNvbnRleHQgPSBjb250ZXh0Ll9fcGFyZW50X187XG4gICAgICAgIHNwbGl0LnNoaWZ0KCk7XG4gICAgICB9XG5cbiAgICAgIHBhdGggPSBjb250ZXh0Ll9fcGF0aCgpLnJlcGxhY2UoL1xcLj9cXFsuKlxcXS9pZywgJy5AZWFjaCcpO1xuICAgICAgcGF0aCA9IHBhdGggKyAocGF0aCAmJiAnLicpICsgc3BsaXQuam9pbignLicpO1xuXG4gICAgICAvLyBBZGQgb3Vyc2VsdmVzIGFzIGRlcGVuZGFudHNcbiAgICAgIHJvb3QuX19jb21wdXRlZERlcHNbcGF0aF0gfHwgKHJvb3QuX19jb21wdXRlZERlcHNbcGF0aF0gPSBbXSk7XG4gICAgICByb290Ll9fY29tcHV0ZWREZXBzW3BhdGhdLnB1c2godGhpcyk7XG4gICAgfSwgdGhpcyk7XG5cbiAgICAvLyBFbnN1cmUgd2Ugb25seSBoYXZlIG9uZSBsaXN0ZW5lciBwZXIgTW9kZWwgYXQgYSB0aW1lLlxuICAgIGNvbnRleHQub2ZmKCdhbGwnLCB0aGlzLm9uUmVjb21wdXRlKS5vbignYWxsJywgdGhpcy5vblJlY29tcHV0ZSk7XG4gIH0sXG5cbiAgdW53aXJlOiBmdW5jdGlvbigpe1xuICAgIHZhciByb290ID0gdGhpcy5fX3Jvb3RfXztcbiAgICB2YXIgY29udGV4dCA9IHRoaXMuX19wYXJlbnRfXztcblxuICAgIF8uZWFjaCh0aGlzLmRlcHMsIGZ1bmN0aW9uKHBhdGgpe1xuICAgICAgdmFyIGRlcCA9IHJvb3QuZ2V0KHBhdGgsIHtyYXc6IHRydWV9KTtcbiAgICAgIGlmKCFkZXAgfHwgIWRlcC5pc0NvbXB1dGVkUHJvcGVydHkpIHJldHVybjtcbiAgICAgIGRlcC5vZmYoJ2RpcnR5JywgdGhpcy5tYXJrRGlydHkpO1xuICAgIH0sIHRoaXMpO1xuXG4gICAgY29udGV4dC5vZmYoJ2FsbCcsIHRoaXMub25SZWNvbXB1dGUpO1xuICB9LFxuXG4gIC8vIENhbGwgdGhpcyBjb21wdXRlZCBwcm9wZXJ0eSBsaWtlIHlvdSB3b3VsZCB3aXRoIEZ1bmN0aW9uLmNhbGwoKVxuICBjYWxsOiBmdW5jdGlvbigpe1xuICAgIHZhciBhcmdzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgY29udGV4dCA9IGFyZ3Muc2hpZnQoKTtcbiAgICByZXR1cm4gdGhpcy5hcHBseShjb250ZXh0LCBhcmdzKTtcbiAgfSxcblxuICAvLyBDYWxsIHRoaXMgY29tcHV0ZWQgcHJvcGVydHkgbGlrZSB5b3Ugd291bGQgd2l0aCBGdW5jdGlvbi5hcHBseSgpXG4gIC8vIE9ubHkgcHJvcGVydGllcyB0aGF0IGFyZSBtYXJrZWQgYXMgZGlydHkgYW5kIGFyZSBub3QgYWxyZWFkeSBjb21wdXRpbmdcbiAgLy8gdGhlbXNlbHZlcyBhcmUgZXZhbHVhdGVkIHRvIHByZXZlbnQgY3ljbGljIGNhbGxiYWNrcy4gSWYgYW55IGRlcGVuZGFudHNcbiAgLy8gYXJlbid0IGZpbmlzaGVkIGNvbXB1dGVkaW5nLCB3ZSBhZGQgb3Vyc2VsdmVkIHRvIHRoZWlyIHdhaXRpbmcgbGlzdC5cbiAgLy8gVmFuaWxsYSBvYmplY3RzIHJldHVybmVkIGZyb20gdGhlIGZ1bmN0aW9uIGFyZSBwcm9tb3RlZCB0byBSZWJvdW5kIE9iamVjdHMuXG4gIC8vIFRoZW4sIHNldCB0aGUgcHJvcGVyIHJldHVybiB0eXBlIGZvciBmdXR1cmUgZmV0Y2hlcyBmcm9tIHRoZSBjYWNoZSBhbmQgc2V0XG4gIC8vIHRoZSBuZXcgY29tcHV0ZWQgdmFsdWUuIFRyYWNrIGNoYW5nZXMgdG8gdGhlIGNhY2hlIHRvIHB1c2ggaXQgYmFjayB1cCB0b1xuICAvLyB0aGUgb3JpZ2luYWwgb2JqZWN0IGFuZCByZXR1cm4gdGhlIHZhbHVlLlxuICBhcHBseTogZnVuY3Rpb24oY29udGV4dCwgcGFyYW1zKXtcblxuICAgIGNvbnRleHQgfHwgKGNvbnRleHQgPSB0aGlzLl9fcGFyZW50X18pO1xuXG4gICAgaWYoIXRoaXMuaXNEaXJ0eSB8fCB0aGlzLmlzQ2hhbmdpbmcgfHwgIWNvbnRleHQpIHJldHVybjtcbiAgICB0aGlzLmlzQ2hhbmdpbmcgPSB0cnVlO1xuXG4gICAgdmFyIHZhbHVlID0gdGhpcy5jYWNoZVt0aGlzLnJldHVyblR5cGVdLFxuICAgICAgICByZXN1bHQ7XG5cbiAgICAvLyBDaGVjayBhbGwgb2Ygb3VyIGRlcGVuZGFuY2llcyB0byBzZWUgaWYgdGhleSBhcmUgZXZhbHVhdGluZy5cbiAgICAvLyBJZiB3ZSBoYXZlIGEgZGVwZW5kYW5jeSB0aGF0IGlzIGRpcnR5IGFuZCB0aGlzIGlzbnQgaXRzIGZpcnN0IHJ1bixcbiAgICAvLyBMZXQgdGhpcyBkZXBlbmRhbmN5IGtub3cgdGhhdCB3ZSBhcmUgd2FpdGluZyBmb3IgaXQuXG4gICAgLy8gSXQgd2lsbCByZS1ydW4gdGhpcyBDb21wdXRlZCBQcm9wZXJ0eSBhZnRlciBpdCBmaW5pc2hlcy5cbiAgICBfLmVhY2godGhpcy5kZXBzLCBmdW5jdGlvbihkZXApe1xuICAgICAgdmFyIGRlcGVuZGFuY3kgPSBjb250ZXh0LmdldChkZXAsIHtyYXc6IHRydWV9KTtcbiAgICAgIGlmKCFkZXBlbmRhbmN5IHx8ICFkZXBlbmRhbmN5LmlzQ29tcHV0ZWRQcm9wZXJ0eSkgcmV0dXJuO1xuICAgICAgaWYoZGVwZW5kYW5jeS5pc0RpcnR5ICYmIGRlcGVuZGFuY3kucmV0dXJuVHlwZSAhPT0gbnVsbCl7XG4gICAgICAgIGRlcGVuZGFuY3kud2FpdGluZ1t0aGlzLmNpZF0gPSB0aGlzO1xuICAgICAgICBkZXBlbmRhbmN5LmFwcGx5KCk7IC8vIFRyeSB0byByZS1ldmFsdWF0ZSB0aGlzIGRlcGVuZGFuY3kgaWYgaXQgaXMgZGlydHlcbiAgICAgICAgaWYoZGVwZW5kYW5jeS5pc0RpcnR5KSByZXR1cm4gdGhpcy5pc0NoYW5naW5nID0gZmFsc2U7XG4gICAgICB9XG4gICAgICBkZWxldGUgZGVwZW5kYW5jeS53YWl0aW5nW3RoaXMuY2lkXTtcbiAgICAgIC8vIFRPRE86IFRoZXJlIGNhbiBiZSBhIGNoZWNrIGhlcmUgbG9va2luZyBmb3IgY3ljbGljIGRlcGVuZGFuY2llcy5cbiAgICB9LCB0aGlzKTtcblxuICAgIGlmKCF0aGlzLmlzQ2hhbmdpbmcpIHJldHVybjtcblxuICAgIGlmKHRoaXMucmV0dXJuVHlwZSAhPT0gJ3ZhbHVlJykgdGhpcy5zdG9wTGlzdGVuaW5nKHZhbHVlLCAnYWxsJywgdGhpcy5vbk1vZGlmeSk7XG5cbiAgICByZXN1bHQgPSB0aGlzLmZ1bmMuYXBwbHkoY29udGV4dCwgcGFyYW1zKTtcblxuICAgIC8vIFByb21vdGUgdmFuaWxsYSBvYmplY3RzIHRvIFJlYm91bmQgRGF0YSBrZWVwaW5nIHRoZSBzYW1lIG9yaWdpbmFsIG9iamVjdHNcbiAgICBpZihfLmlzQXJyYXkocmVzdWx0KSkgcmVzdWx0ID0gbmV3IFJlYm91bmQuQ29sbGVjdGlvbihyZXN1bHQsIHtjbG9uZTogZmFsc2V9KTtcbiAgICBlbHNlIGlmKF8uaXNPYmplY3QocmVzdWx0KSAmJiAhcmVzdWx0LmlzRGF0YSkgcmVzdWx0ID0gbmV3IFJlYm91bmQuTW9kZWwocmVzdWx0LCB7Y2xvbmU6IGZhbHNlfSk7XG5cbiAgICAvLyBJZiByZXN1bHQgaXMgdW5kZWZpbmVkLCByZXNldCBvdXIgY2FjaGUgaXRlbVxuICAgIGlmKF8uaXNVbmRlZmluZWQocmVzdWx0KSB8fCBfLmlzTnVsbChyZXN1bHQpKXtcbiAgICAgIHRoaXMucmV0dXJuVHlwZSA9ICd2YWx1ZSc7XG4gICAgICB0aGlzLmlzQ29sbGVjdGlvbiA9IHRoaXMuaXNNb2RlbCA9IGZhbHNlO1xuICAgICAgdGhpcy5zZXQodW5kZWZpbmVkKTtcbiAgICB9XG4gICAgLy8gU2V0IHJlc3VsdCBhbmQgcmV0dXJuIHR5cGVzLCBiaW5kIGV2ZW50c1xuICAgIGVsc2UgaWYocmVzdWx0LmlzQ29sbGVjdGlvbil7XG4gICAgICB0aGlzLnJldHVyblR5cGUgPSAnY29sbGVjdGlvbic7XG4gICAgICB0aGlzLmlzQ29sbGVjdGlvbiA9IHRydWU7XG4gICAgICB0aGlzLmlzTW9kZWwgPSBmYWxzZTtcbiAgICAgIHRoaXMuc2V0KHJlc3VsdCk7XG4gICAgICB0aGlzLnRyYWNrKHJlc3VsdCk7XG4gICAgfVxuICAgIGVsc2UgaWYocmVzdWx0LmlzTW9kZWwpe1xuICAgICAgdGhpcy5yZXR1cm5UeXBlID0gJ21vZGVsJztcbiAgICAgIHRoaXMuaXNDb2xsZWN0aW9uID0gZmFsc2U7XG4gICAgICB0aGlzLmlzTW9kZWwgPSB0cnVlO1xuICAgICAgdGhpcy5yZXNldChyZXN1bHQpO1xuICAgICAgdGhpcy50cmFjayhyZXN1bHQpO1xuICAgIH1cbiAgICBlbHNle1xuICAgICAgdGhpcy5yZXR1cm5UeXBlID0gJ3ZhbHVlJztcbiAgICAgIHRoaXMuaXNDb2xsZWN0aW9uID0gdGhpcy5pc01vZGVsID0gZmFsc2U7XG4gICAgICB0aGlzLnJlc2V0KHJlc3VsdCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMudmFsdWUoKTtcbiAgfSxcblxuICAvLyBXaGVuIHdlIHJlY2VpdmUgYSBuZXcgbW9kZWwgdG8gc2V0IGluIG91ciBjYWNoZSwgdW5iaW5kIHRoZSB0cmFja2VyIGZyb21cbiAgLy8gdGhlIHByZXZpb3VzIGNhY2hlIG9iamVjdCwgc3luYyB0aGUgb2JqZWN0cycgY2lkcyBzbyBoZWxwZXJzIHRoaW5rIHRoZXlcbiAgLy8gYXJlIHRoZSBzYW1lIG9iamVjdCwgc2F2ZSBhIHJlZmVyYW5jZSB0byB0aGUgb2JqZWN0IHdlIGFyZSB0cmFja2luZyxcbiAgLy8gYW5kIHJlLWJpbmQgb3VyIG9uTW9kaWZ5IGhvb2suXG4gIHRyYWNrOiBmdW5jdGlvbihvYmplY3Qpe1xuICAgIHZhciB0YXJnZXQgPSB0aGlzLnZhbHVlKCk7XG4gICAgaWYoIW9iamVjdCB8fCAhdGFyZ2V0IHx8ICF0YXJnZXQuaXNEYXRhIHx8ICFvYmplY3QuaXNEYXRhKSByZXR1cm47XG4gICAgdGFyZ2V0Ll9jaWQgfHwgKHRhcmdldC5fY2lkID0gdGFyZ2V0LmNpZCk7XG4gICAgb2JqZWN0Ll9jaWQgfHwgKG9iamVjdC5fY2lkID0gb2JqZWN0LmNpZCk7XG4gICAgdGFyZ2V0LmNpZCA9IG9iamVjdC5jaWQ7XG4gICAgdGhpcy50cmFja2luZyA9IG9iamVjdDtcbiAgICB0aGlzLmxpc3RlblRvKHRhcmdldCwgJ2FsbCcsIHRoaXMub25Nb2RpZnkpO1xuICB9LFxuXG4gIC8vIEdldCBmcm9tIHRoZSBDb21wdXRlZCBQcm9wZXJ0eSdzIGNhY2hlXG4gIGdldDogZnVuY3Rpb24oa2V5LCBvcHRpb25zKXtcbiAgICB2YXIgdmFsdWUgPSB0aGlzLnZhbHVlKCk7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBpZih0aGlzLnJldHVyblR5cGUgPT09ICd2YWx1ZScpIHJldHVybiBjb25zb2xlLmVycm9yKCdDYWxsZWQgZ2V0IG9uIHRoZSBgJysgdGhpcy5uYW1lICsnYCBjb21wdXRlZCBwcm9wZXJ0eSB3aGljaCByZXR1cm5zIGEgcHJpbWl0aXZlIHZhbHVlLicpO1xuICAgIHJldHVybiB2YWx1ZS5nZXQoa2V5LCBvcHRpb25zKTtcbiAgfSxcblxuICAvLyBTZXQgdGhlIENvbXB1dGVkIFByb3BlcnR5J3MgY2FjaGUgdG8gYSBuZXcgdmFsdWUgYW5kIHRyaWdnZXIgYXBwcm9wcmVhdGUgZXZlbnRzLlxuICAvLyBDaGFuZ2VzIHdpbGwgcHJvcGFnYXRlIGJhY2sgdG8gdGhlIG9yaWdpbmFsIG9iamVjdCBpZiBhIFJlYm91bmQgRGF0YSBPYmplY3QgYW5kIHJlLWNvbXB1dGUuXG4gIC8vIElmIENvbXB1dGVkIFByb3BlcnR5IHJldHVybnMgYSB2YWx1ZSwgYWxsIGRvd25zdHJlYW0gZGVwZW5kYW5jaWVzIHdpbGwgcmUtY29tcHV0ZS5cbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbCwgb3B0aW9ucyl7XG4gICAgaWYodGhpcy5yZXR1cm5UeXBlID09PSBudWxsKSByZXR1cm4gdW5kZWZpbmVkO1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdmFyIGF0dHJzID0ga2V5O1xuICAgIHZhciB2YWx1ZSA9IHRoaXMudmFsdWUoKTtcbiAgICBpZih0aGlzLnJldHVyblR5cGUgPT09ICdtb2RlbCcpe1xuICAgICAgaWYgKHR5cGVvZiBrZXkgPT09ICdvYmplY3QnKSB7XG4gICAgICAgIGF0dHJzID0gKGtleS5pc01vZGVsKSA/IGtleS5hdHRyaWJ1dGVzIDoga2V5O1xuICAgICAgICBvcHRpb25zID0gdmFsO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgKGF0dHJzID0ge30pW2tleV0gPSB2YWw7XG4gICAgICB9XG4gICAgfVxuICAgIGlmKHRoaXMucmV0dXJuVHlwZSAhPT0gJ21vZGVsJykgb3B0aW9ucyA9IHZhbCB8fCB7fTtcbiAgICBhdHRycyA9IChhdHRycyAmJiBhdHRycy5pc0NvbXB1dGVkUHJvcGVydHkpID8gYXR0cnMudmFsdWUoKSA6IGF0dHJzO1xuXG4gICAgLy8gSWYgYSBuZXcgdmFsdWUsIHNldCBpdCBhbmQgdHJpZ2dlciBldmVudHNcbiAgICBpZih0aGlzLnJldHVyblR5cGUgPT09ICd2YWx1ZScgJiYgdGhpcy5jYWNoZS52YWx1ZSAhPT0gYXR0cnMpe1xuICAgICAgdGhpcy5jYWNoZS52YWx1ZSA9IGF0dHJzO1xuICAgICAgaWYoIW9wdGlvbnMucXVpZXQpe1xuICAgICAgICAvLyBJZiBzZXQgd2FzIGNhbGxlZCBub3QgdGhyb3VnaCBjb21wdXRlZFByb3BlcnR5LmNhbGwoKSwgdGhpcyBpcyBhIGZyZXNoIG5ldyBldmVudCBidXJzdC5cbiAgICAgICAgaWYoIXRoaXMuaXNEaXJ0eSAmJiAhdGhpcy5pc0NoYW5naW5nKSB0aGlzLl9fcGFyZW50X18uY2hhbmdlZCA9IHt9O1xuICAgICAgICB0aGlzLl9fcGFyZW50X18uY2hhbmdlZFt0aGlzLm5hbWVdID0gYXR0cnM7XG4gICAgICAgIHRoaXMudHJpZ2dlcignY2hhbmdlJywgdGhpcy5fX3BhcmVudF9fKTtcbiAgICAgICAgdGhpcy50cmlnZ2VyKCdjaGFuZ2U6Jyt0aGlzLm5hbWUsIHRoaXMuX19wYXJlbnRfXywgYXR0cnMpO1xuICAgICAgICBkZWxldGUgdGhpcy5fX3BhcmVudF9fLmNoYW5nZWRbdGhpcy5uYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSBpZih0aGlzLnJldHVyblR5cGUgIT09ICd2YWx1ZScgJiYgb3B0aW9ucy5yZXNldCkga2V5ID0gdmFsdWUucmVzZXQoYXR0cnMsIG9wdGlvbnMpO1xuICAgIGVsc2UgaWYodGhpcy5yZXR1cm5UeXBlICE9PSAndmFsdWUnKSBrZXkgPSB2YWx1ZS5zZXQoYXR0cnMsIG9wdGlvbnMpO1xuICAgIHRoaXMuaXNEaXJ0eSA9IHRoaXMuaXNDaGFuZ2luZyA9IGZhbHNlO1xuXG4gICAgLy8gQ2FsbCBhbGwgcmVhbWluaW5nIGNvbXB1dGVkIHByb3BlcnRpZXMgd2FpdGluZyBmb3IgdGhpcyB2YWx1ZSB0byByZXNvbHZlLlxuICAgIF8uZWFjaCh0aGlzLndhaXRpbmcsIGZ1bmN0aW9uKHByb3ApeyBwcm9wICYmIHByb3AuY2FsbCgpOyB9KTtcblxuICAgIHJldHVybiBrZXk7XG4gIH0sXG5cbiAgLy8gUmV0dXJuIHRoZSBjdXJyZW50IHZhbHVlIGZyb20gdGhlIGNhY2hlLCBydW5uaW5nIGlmIGRpcnR5LlxuICB2YWx1ZTogZnVuY3Rpb24oKXtcbiAgICBpZih0aGlzLmlzRGlydHkpIHRoaXMuYXBwbHkoKTtcbiAgICByZXR1cm4gdGhpcy5jYWNoZVt0aGlzLnJldHVyblR5cGVdO1xuICB9LFxuXG4gIC8vIFJlc2V0IHRoZSBjdXJyZW50IHZhbHVlIGluIHRoZSBjYWNoZSwgcnVubmluZyBpZiBmaXJzdCBydW4uXG4gIHJlc2V0OiBmdW5jdGlvbihvYmosIG9wdGlvbnMpe1xuICAgIGlmKF8uaXNOdWxsKHRoaXMucmV0dXJuVHlwZSkpIHJldHVybjsgLy8gRmlyc3QgcnVuXG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBvcHRpb25zLnJlc2V0ID0gdHJ1ZTtcbiAgICByZXR1cm4gIHRoaXMuc2V0KG9iaiwgb3B0aW9ucyk7XG4gIH0sXG5cbiAgLy8gQ3ljbGljIGRlcGVuZGFuY3kgc2FmZSB0b0pTT04gbWV0aG9kLlxuICB0b0pTT046IGZ1bmN0aW9uKCkge1xuICAgIGlmICh0aGlzLl9pc1NlcmlhbGl6aW5nKSByZXR1cm4gdGhpcy5jaWQ7XG4gICAgdmFyIHZhbCA9IHRoaXMudmFsdWUoKTtcbiAgICB0aGlzLl9pc1NlcmlhbGl6aW5nID0gdHJ1ZTtcbiAgICB2YXIganNvbiA9ICh2YWwgJiYgXy5pc0Z1bmN0aW9uKHZhbC50b0pTT04pKSA/IHZhbC50b0pTT04oKSA6IHZhbDtcbiAgICB0aGlzLl9pc1NlcmlhbGl6aW5nID0gZmFsc2U7XG4gICAgcmV0dXJuIGpzb247XG4gIH1cblxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IENvbXB1dGVkUHJvcGVydHk7XG4iLCIvKmpzaGludCAtVzA1NCAqL1xuLy8ganNoaW50IGlnbm9yZTogc3RhcnRcblxuICAvLyBBIHNlY29uZCBvcHRpb25hbCBhcmd1bWVudCBjYW4gYmUgZ2l2ZW4gdG8gZnVydGhlciBjb25maWd1cmVcbiAgLy8gdGhlIHBhcnNlciBwcm9jZXNzLiBUaGVzZSBvcHRpb25zIGFyZSByZWNvZ25pemVkOlxuXG4gIHZhciBleHBvcnRzID0ge307XG5cbiAgdmFyIG9wdGlvbnMsIGlucHV0LCBpbnB1dExlbiwgc291cmNlRmlsZTtcblxuICB2YXIgZGVmYXVsdE9wdGlvbnMgPSBleHBvcnRzLmRlZmF1bHRPcHRpb25zID0ge1xuICAgIC8vIGBlY21hVmVyc2lvbmAgaW5kaWNhdGVzIHRoZSBFQ01BU2NyaXB0IHZlcnNpb24gdG8gcGFyc2UuIE11c3RcbiAgICAvLyBiZSBlaXRoZXIgMywgb3IgNSwgb3IgNi4gVGhpcyBpbmZsdWVuY2VzIHN1cHBvcnQgZm9yIHN0cmljdFxuICAgIC8vIG1vZGUsIHRoZSBzZXQgb2YgcmVzZXJ2ZWQgd29yZHMsIHN1cHBvcnQgZm9yIGdldHRlcnMgYW5kXG4gICAgLy8gc2V0dGVycyBhbmQgb3RoZXIgZmVhdHVyZXMuIEVTNiBzdXBwb3J0IGlzIG9ubHkgcGFydGlhbC5cbiAgICBlY21hVmVyc2lvbjogNSxcbiAgICAvLyBUdXJuIG9uIGBzdHJpY3RTZW1pY29sb25zYCB0byBwcmV2ZW50IHRoZSBwYXJzZXIgZnJvbSBkb2luZ1xuICAgIC8vIGF1dG9tYXRpYyBzZW1pY29sb24gaW5zZXJ0aW9uLlxuICAgIHN0cmljdFNlbWljb2xvbnM6IGZhbHNlLFxuICAgIC8vIFdoZW4gYGFsbG93VHJhaWxpbmdDb21tYXNgIGlzIGZhbHNlLCB0aGUgcGFyc2VyIHdpbGwgbm90IGFsbG93XG4gICAgLy8gdHJhaWxpbmcgY29tbWFzIGluIGFycmF5IGFuZCBvYmplY3QgbGl0ZXJhbHMuXG4gICAgYWxsb3dUcmFpbGluZ0NvbW1hczogdHJ1ZSxcbiAgICAvLyBCeSBkZWZhdWx0LCByZXNlcnZlZCB3b3JkcyBhcmUgbm90IGVuZm9yY2VkLiBFbmFibGVcbiAgICAvLyBgZm9yYmlkUmVzZXJ2ZWRgIHRvIGVuZm9yY2UgdGhlbS4gV2hlbiB0aGlzIG9wdGlvbiBoYXMgdGhlXG4gICAgLy8gdmFsdWUgXCJldmVyeXdoZXJlXCIsIHJlc2VydmVkIHdvcmRzIGFuZCBrZXl3b3JkcyBjYW4gYWxzbyBub3QgYmVcbiAgICAvLyB1c2VkIGFzIHByb3BlcnR5IG5hbWVzLlxuICAgIGZvcmJpZFJlc2VydmVkOiBmYWxzZSxcbiAgICAvLyBXaGVuIGVuYWJsZWQsIGEgcmV0dXJuIGF0IHRoZSB0b3AgbGV2ZWwgaXMgbm90IGNvbnNpZGVyZWQgYW5cbiAgICAvLyBlcnJvci5cbiAgICBhbGxvd1JldHVybk91dHNpZGVGdW5jdGlvbjogZmFsc2UsXG4gICAgLy8gV2hlbiBgbG9jYXRpb25zYCBpcyBvbiwgYGxvY2AgcHJvcGVydGllcyBob2xkaW5nIG9iamVjdHMgd2l0aFxuICAgIC8vIGBzdGFydGAgYW5kIGBlbmRgIHByb3BlcnRpZXMgaW4gYHtsaW5lLCBjb2x1bW59YCBmb3JtICh3aXRoXG4gICAgLy8gbGluZSBiZWluZyAxLWJhc2VkIGFuZCBjb2x1bW4gMC1iYXNlZCkgd2lsbCBiZSBhdHRhY2hlZCB0byB0aGVcbiAgICAvLyBub2Rlcy5cbiAgICBsb2NhdGlvbnM6IGZhbHNlLFxuICAgIC8vIEEgZnVuY3Rpb24gY2FuIGJlIHBhc3NlZCBhcyBgb25Db21tZW50YCBvcHRpb24sIHdoaWNoIHdpbGxcbiAgICAvLyBjYXVzZSBBY29ybiB0byBjYWxsIHRoYXQgZnVuY3Rpb24gd2l0aCBgKGJsb2NrLCB0ZXh0LCBzdGFydCxcbiAgICAvLyBlbmQpYCBwYXJhbWV0ZXJzIHdoZW5ldmVyIGEgY29tbWVudCBpcyBza2lwcGVkLiBgYmxvY2tgIGlzIGFcbiAgICAvLyBib29sZWFuIGluZGljYXRpbmcgd2hldGhlciB0aGlzIGlzIGEgYmxvY2sgKGAvKiAqL2ApIGNvbW1lbnQsXG4gICAgLy8gYHRleHRgIGlzIHRoZSBjb250ZW50IG9mIHRoZSBjb21tZW50LCBhbmQgYHN0YXJ0YCBhbmQgYGVuZGAgYXJlXG4gICAgLy8gY2hhcmFjdGVyIG9mZnNldHMgdGhhdCBkZW5vdGUgdGhlIHN0YXJ0IGFuZCBlbmQgb2YgdGhlIGNvbW1lbnQuXG4gICAgLy8gV2hlbiB0aGUgYGxvY2F0aW9uc2Agb3B0aW9uIGlzIG9uLCB0d28gbW9yZSBwYXJhbWV0ZXJzIGFyZVxuICAgIC8vIHBhc3NlZCwgdGhlIGZ1bGwgYHtsaW5lLCBjb2x1bW59YCBsb2NhdGlvbnMgb2YgdGhlIHN0YXJ0IGFuZFxuICAgIC8vIGVuZCBvZiB0aGUgY29tbWVudHMuIE5vdGUgdGhhdCB5b3UgYXJlIG5vdCBhbGxvd2VkIHRvIGNhbGwgdGhlXG4gICAgLy8gcGFyc2VyIGZyb20gdGhlIGNhbGxiYWNr4oCUdGhhdCB3aWxsIGNvcnJ1cHQgaXRzIGludGVybmFsIHN0YXRlLlxuICAgIG9uQ29tbWVudDogbnVsbCxcbiAgICAvLyBOb2RlcyBoYXZlIHRoZWlyIHN0YXJ0IGFuZCBlbmQgY2hhcmFjdGVycyBvZmZzZXRzIHJlY29yZGVkIGluXG4gICAgLy8gYHN0YXJ0YCBhbmQgYGVuZGAgcHJvcGVydGllcyAoZGlyZWN0bHkgb24gdGhlIG5vZGUsIHJhdGhlciB0aGFuXG4gICAgLy8gdGhlIGBsb2NgIG9iamVjdCwgd2hpY2ggaG9sZHMgbGluZS9jb2x1bW4gZGF0YS4gVG8gYWxzbyBhZGQgYVxuICAgIC8vIFtzZW1pLXN0YW5kYXJkaXplZF1bcmFuZ2VdIGByYW5nZWAgcHJvcGVydHkgaG9sZGluZyBhIGBbc3RhcnQsXG4gICAgLy8gZW5kXWAgYXJyYXkgd2l0aCB0aGUgc2FtZSBudW1iZXJzLCBzZXQgdGhlIGByYW5nZXNgIG9wdGlvbiB0b1xuICAgIC8vIGB0cnVlYC5cbiAgICAvL1xuICAgIC8vIFtyYW5nZV06IGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTc0NTY3OFxuICAgIHJhbmdlczogZmFsc2UsXG4gICAgLy8gSXQgaXMgcG9zc2libGUgdG8gcGFyc2UgbXVsdGlwbGUgZmlsZXMgaW50byBhIHNpbmdsZSBBU1QgYnlcbiAgICAvLyBwYXNzaW5nIHRoZSB0cmVlIHByb2R1Y2VkIGJ5IHBhcnNpbmcgdGhlIGZpcnN0IGZpbGUgYXNcbiAgICAvLyBgcHJvZ3JhbWAgb3B0aW9uIGluIHN1YnNlcXVlbnQgcGFyc2VzLiBUaGlzIHdpbGwgYWRkIHRoZVxuICAgIC8vIHRvcGxldmVsIGZvcm1zIG9mIHRoZSBwYXJzZWQgZmlsZSB0byB0aGUgYFByb2dyYW1gICh0b3ApIG5vZGVcbiAgICAvLyBvZiBhbiBleGlzdGluZyBwYXJzZSB0cmVlLlxuICAgIHByb2dyYW06IG51bGwsXG4gICAgLy8gV2hlbiBgbG9jYXRpb25zYCBpcyBvbiwgeW91IGNhbiBwYXNzIHRoaXMgdG8gcmVjb3JkIHRoZSBzb3VyY2VcbiAgICAvLyBmaWxlIGluIGV2ZXJ5IG5vZGUncyBgbG9jYCBvYmplY3QuXG4gICAgc291cmNlRmlsZTogbnVsbCxcbiAgICAvLyBUaGlzIHZhbHVlLCBpZiBnaXZlbiwgaXMgc3RvcmVkIGluIGV2ZXJ5IG5vZGUsIHdoZXRoZXJcbiAgICAvLyBgbG9jYXRpb25zYCBpcyBvbiBvciBvZmYuXG4gICAgZGlyZWN0U291cmNlRmlsZTogbnVsbFxuICB9O1xuXG4gIGZ1bmN0aW9uIHNldE9wdGlvbnMob3B0cykge1xuICAgIG9wdGlvbnMgPSBvcHRzIHx8IHt9O1xuICAgIGZvciAodmFyIG9wdCBpbiBkZWZhdWx0T3B0aW9ucykgaWYgKCFPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob3B0aW9ucywgb3B0KSlcbiAgICAgIG9wdGlvbnNbb3B0XSA9IGRlZmF1bHRPcHRpb25zW29wdF07XG4gICAgc291cmNlRmlsZSA9IG9wdGlvbnMuc291cmNlRmlsZSB8fCBudWxsO1xuXG4gICAgaXNLZXl3b3JkID0gb3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ID8gaXNFY21hNktleXdvcmQgOiBpc0VjbWE1QW5kTGVzc0tleXdvcmQ7XG4gIH1cblxuICAvLyBUaGUgYGdldExpbmVJbmZvYCBmdW5jdGlvbiBpcyBtb3N0bHkgdXNlZnVsIHdoZW4gdGhlXG4gIC8vIGBsb2NhdGlvbnNgIG9wdGlvbiBpcyBvZmYgKGZvciBwZXJmb3JtYW5jZSByZWFzb25zKSBhbmQgeW91XG4gIC8vIHdhbnQgdG8gZmluZCB0aGUgbGluZS9jb2x1bW4gcG9zaXRpb24gZm9yIGEgZ2l2ZW4gY2hhcmFjdGVyXG4gIC8vIG9mZnNldC4gYGlucHV0YCBzaG91bGQgYmUgdGhlIGNvZGUgc3RyaW5nIHRoYXQgdGhlIG9mZnNldCByZWZlcnNcbiAgLy8gaW50by5cblxuICB2YXIgZ2V0TGluZUluZm8gPSBleHBvcnRzLmdldExpbmVJbmZvID0gZnVuY3Rpb24oaW5wdXQsIG9mZnNldCkge1xuICAgIGZvciAodmFyIGxpbmUgPSAxLCBjdXIgPSAwOzspIHtcbiAgICAgIGxpbmVCcmVhay5sYXN0SW5kZXggPSBjdXI7XG4gICAgICB2YXIgbWF0Y2ggPSBsaW5lQnJlYWsuZXhlYyhpbnB1dCk7XG4gICAgICBpZiAobWF0Y2ggJiYgbWF0Y2guaW5kZXggPCBvZmZzZXQpIHtcbiAgICAgICAgKytsaW5lO1xuICAgICAgICBjdXIgPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgIH0gZWxzZSBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHtsaW5lOiBsaW5lLCBjb2x1bW46IG9mZnNldCAtIGN1cn07XG4gIH07XG5cbiAgLy8gQWNvcm4gaXMgb3JnYW5pemVkIGFzIGEgdG9rZW5pemVyIGFuZCBhIHJlY3Vyc2l2ZS1kZXNjZW50IHBhcnNlci5cbiAgLy8gVGhlIGB0b2tlbml6ZWAgZXhwb3J0IHByb3ZpZGVzIGFuIGludGVyZmFjZSB0byB0aGUgdG9rZW5pemVyLlxuICAvLyBCZWNhdXNlIHRoZSB0b2tlbml6ZXIgaXMgb3B0aW1pemVkIGZvciBiZWluZyBlZmZpY2llbnRseSB1c2VkIGJ5XG4gIC8vIHRoZSBBY29ybiBwYXJzZXIgaXRzZWxmLCB0aGlzIGludGVyZmFjZSBpcyBzb21ld2hhdCBjcnVkZSBhbmQgbm90XG4gIC8vIHZlcnkgbW9kdWxhci4gUGVyZm9ybWluZyBhbm90aGVyIHBhcnNlIG9yIGNhbGwgdG8gYHRva2VuaXplYCB3aWxsXG4gIC8vIHJlc2V0IHRoZSBpbnRlcm5hbCBzdGF0ZSwgYW5kIGludmFsaWRhdGUgZXhpc3RpbmcgdG9rZW5pemVycy5cblxuICBleHBvcnRzLnRva2VuaXplID0gZnVuY3Rpb24oaW5wdCwgb3B0cykge1xuICAgIGlucHV0ID0gU3RyaW5nKGlucHQpOyBpbnB1dExlbiA9IGlucHV0Lmxlbmd0aDtcbiAgICBzZXRPcHRpb25zKG9wdHMpO1xuICAgIGluaXRUb2tlblN0YXRlKCk7XG5cbiAgICB2YXIgdCA9IHt9O1xuICAgIGZ1bmN0aW9uIGdldFRva2VuKGZvcmNlUmVnZXhwKSB7XG4gICAgICBsYXN0RW5kID0gdG9rRW5kO1xuICAgICAgcmVhZFRva2VuKGZvcmNlUmVnZXhwKTtcbiAgICAgIHQuc3RhcnQgPSB0b2tTdGFydDsgdC5lbmQgPSB0b2tFbmQ7XG4gICAgICB0LnN0YXJ0TG9jID0gdG9rU3RhcnRMb2M7IHQuZW5kTG9jID0gdG9rRW5kTG9jO1xuICAgICAgdC50eXBlID0gdG9rVHlwZTsgdC52YWx1ZSA9IHRva1ZhbDtcbiAgICAgIHJldHVybiB0O1xuICAgIH1cbiAgICBnZXRUb2tlbi5qdW1wVG8gPSBmdW5jdGlvbihwb3MsIHJlQWxsb3dlZCkge1xuICAgICAgdG9rUG9zID0gcG9zO1xuICAgICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB7XG4gICAgICAgIHRva0N1ckxpbmUgPSAxO1xuICAgICAgICB0b2tMaW5lU3RhcnQgPSBsaW5lQnJlYWsubGFzdEluZGV4ID0gMDtcbiAgICAgICAgdmFyIG1hdGNoO1xuICAgICAgICB3aGlsZSAoKG1hdGNoID0gbGluZUJyZWFrLmV4ZWMoaW5wdXQpKSAmJiBtYXRjaC5pbmRleCA8IHBvcykge1xuICAgICAgICAgICsrdG9rQ3VyTGluZTtcbiAgICAgICAgICB0b2tMaW5lU3RhcnQgPSBtYXRjaC5pbmRleCArIG1hdGNoWzBdLmxlbmd0aDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdG9rUmVnZXhwQWxsb3dlZCA9IHJlQWxsb3dlZDtcbiAgICAgIHNraXBTcGFjZSgpO1xuICAgIH07XG4gICAgcmV0dXJuIGdldFRva2VuO1xuICB9O1xuXG4gIC8vIFN0YXRlIGlzIGtlcHQgaW4gKGNsb3N1cmUtKWdsb2JhbCB2YXJpYWJsZXMuIFdlIGFscmVhZHkgc2F3IHRoZVxuICAvLyBgb3B0aW9uc2AsIGBpbnB1dGAsIGFuZCBgaW5wdXRMZW5gIHZhcmlhYmxlcyBhYm92ZS5cblxuICAvLyBUaGUgY3VycmVudCBwb3NpdGlvbiBvZiB0aGUgdG9rZW5pemVyIGluIHRoZSBpbnB1dC5cblxuICB2YXIgdG9rUG9zO1xuXG4gIC8vIFRoZSBzdGFydCBhbmQgZW5kIG9mZnNldHMgb2YgdGhlIGN1cnJlbnQgdG9rZW4uXG5cbiAgdmFyIHRva1N0YXJ0LCB0b2tFbmQ7XG5cbiAgLy8gV2hlbiBgb3B0aW9ucy5sb2NhdGlvbnNgIGlzIHRydWUsIHRoZXNlIGhvbGQgb2JqZWN0c1xuICAvLyBjb250YWluaW5nIHRoZSB0b2tlbnMgc3RhcnQgYW5kIGVuZCBsaW5lL2NvbHVtbiBwYWlycy5cblxuICB2YXIgdG9rU3RhcnRMb2MsIHRva0VuZExvYztcblxuICAvLyBUaGUgdHlwZSBhbmQgdmFsdWUgb2YgdGhlIGN1cnJlbnQgdG9rZW4uIFRva2VuIHR5cGVzIGFyZSBvYmplY3RzLFxuICAvLyBuYW1lZCBieSB2YXJpYWJsZXMgYWdhaW5zdCB3aGljaCB0aGV5IGNhbiBiZSBjb21wYXJlZCwgYW5kXG4gIC8vIGhvbGRpbmcgcHJvcGVydGllcyB0aGF0IGRlc2NyaWJlIHRoZW0gKGluZGljYXRpbmcsIGZvciBleGFtcGxlLFxuICAvLyB0aGUgcHJlY2VkZW5jZSBvZiBhbiBpbmZpeCBvcGVyYXRvciwgYW5kIHRoZSBvcmlnaW5hbCBuYW1lIG9mIGFcbiAgLy8ga2V5d29yZCB0b2tlbikuIFRoZSBraW5kIG9mIHZhbHVlIHRoYXQncyBoZWxkIGluIGB0b2tWYWxgIGRlcGVuZHNcbiAgLy8gb24gdGhlIHR5cGUgb2YgdGhlIHRva2VuLiBGb3IgbGl0ZXJhbHMsIGl0IGlzIHRoZSBsaXRlcmFsIHZhbHVlLFxuICAvLyBmb3Igb3BlcmF0b3JzLCB0aGUgb3BlcmF0b3IgbmFtZSwgYW5kIHNvIG9uLlxuXG4gIHZhciB0b2tUeXBlLCB0b2tWYWw7XG5cbiAgLy8gSW50ZXJhbCBzdGF0ZSBmb3IgdGhlIHRva2VuaXplci4gVG8gZGlzdGluZ3Vpc2ggYmV0d2VlbiBkaXZpc2lvblxuICAvLyBvcGVyYXRvcnMgYW5kIHJlZ3VsYXIgZXhwcmVzc2lvbnMsIGl0IHJlbWVtYmVycyB3aGV0aGVyIHRoZSBsYXN0XG4gIC8vIHRva2VuIHdhcyBvbmUgdGhhdCBpcyBhbGxvd2VkIHRvIGJlIGZvbGxvd2VkIGJ5IGFuIGV4cHJlc3Npb24uXG4gIC8vIChJZiBpdCBpcywgYSBzbGFzaCBpcyBwcm9iYWJseSBhIHJlZ2V4cCwgaWYgaXQgaXNuJ3QgaXQncyBhXG4gIC8vIGRpdmlzaW9uIG9wZXJhdG9yLiBTZWUgdGhlIGBwYXJzZVN0YXRlbWVudGAgZnVuY3Rpb24gZm9yIGFcbiAgLy8gY2F2ZWF0LilcblxuICB2YXIgdG9rUmVnZXhwQWxsb3dlZDtcblxuICAvLyBXaGVuIGBvcHRpb25zLmxvY2F0aW9uc2AgaXMgdHJ1ZSwgdGhlc2UgYXJlIHVzZWQgdG8ga2VlcFxuICAvLyB0cmFjayBvZiB0aGUgY3VycmVudCBsaW5lLCBhbmQga25vdyB3aGVuIGEgbmV3IGxpbmUgaGFzIGJlZW5cbiAgLy8gZW50ZXJlZC5cblxuICB2YXIgdG9rQ3VyTGluZSwgdG9rTGluZVN0YXJ0O1xuXG4gIC8vIFRoZXNlIHN0b3JlIHRoZSBwb3NpdGlvbiBvZiB0aGUgcHJldmlvdXMgdG9rZW4sIHdoaWNoIGlzIHVzZWZ1bFxuICAvLyB3aGVuIGZpbmlzaGluZyBhIG5vZGUgYW5kIGFzc2lnbmluZyBpdHMgYGVuZGAgcG9zaXRpb24uXG5cbiAgdmFyIGxhc3RTdGFydCwgbGFzdEVuZCwgbGFzdEVuZExvYztcblxuICAvLyBUaGlzIGlzIHRoZSBwYXJzZXIncyBzdGF0ZS4gYGluRnVuY3Rpb25gIGlzIHVzZWQgdG8gcmVqZWN0XG4gIC8vIGByZXR1cm5gIHN0YXRlbWVudHMgb3V0c2lkZSBvZiBmdW5jdGlvbnMsIGBsYWJlbHNgIHRvIHZlcmlmeSB0aGF0XG4gIC8vIGBicmVha2AgYW5kIGBjb250aW51ZWAgaGF2ZSBzb21ld2hlcmUgdG8ganVtcCB0bywgYW5kIGBzdHJpY3RgXG4gIC8vIGluZGljYXRlcyB3aGV0aGVyIHN0cmljdCBtb2RlIGlzIG9uLlxuXG4gIHZhciBpbkZ1bmN0aW9uLCBsYWJlbHMsIHN0cmljdDtcblxuICAvLyBUaGlzIGZ1bmN0aW9uIGlzIHVzZWQgdG8gcmFpc2UgZXhjZXB0aW9ucyBvbiBwYXJzZSBlcnJvcnMuIEl0XG4gIC8vIHRha2VzIGFuIG9mZnNldCBpbnRlZ2VyIChpbnRvIHRoZSBjdXJyZW50IGBpbnB1dGApIHRvIGluZGljYXRlXG4gIC8vIHRoZSBsb2NhdGlvbiBvZiB0aGUgZXJyb3IsIGF0dGFjaGVzIHRoZSBwb3NpdGlvbiB0byB0aGUgZW5kXG4gIC8vIG9mIHRoZSBlcnJvciBtZXNzYWdlLCBhbmQgdGhlbiByYWlzZXMgYSBgU3ludGF4RXJyb3JgIHdpdGggdGhhdFxuICAvLyBtZXNzYWdlLlxuXG4gIGZ1bmN0aW9uIHJhaXNlKHBvcywgbWVzc2FnZSkge1xuICAgIHZhciBsb2MgPSBnZXRMaW5lSW5mbyhpbnB1dCwgcG9zKTtcbiAgICBtZXNzYWdlICs9IFwiIChcIiArIGxvYy5saW5lICsgXCI6XCIgKyBsb2MuY29sdW1uICsgXCIpXCI7XG4gICAgdmFyIGVyciA9IG5ldyBTeW50YXhFcnJvcihtZXNzYWdlKTtcbiAgICBlcnIucG9zID0gcG9zOyBlcnIubG9jID0gbG9jOyBlcnIucmFpc2VkQXQgPSB0b2tQb3M7XG4gICAgdGhyb3cgZXJyO1xuICB9XG5cbiAgLy8gUmV1c2VkIGVtcHR5IGFycmF5IGFkZGVkIGZvciBub2RlIGZpZWxkcyB0aGF0IGFyZSBhbHdheXMgZW1wdHkuXG5cbiAgdmFyIGVtcHR5ID0gW107XG5cbiAgLy8gIyMgVG9rZW4gdHlwZXNcblxuICAvLyBUaGUgYXNzaWdubWVudCBvZiBmaW5lLWdyYWluZWQsIGluZm9ybWF0aW9uLWNhcnJ5aW5nIHR5cGUgb2JqZWN0c1xuICAvLyBhbGxvd3MgdGhlIHRva2VuaXplciB0byBzdG9yZSB0aGUgaW5mb3JtYXRpb24gaXQgaGFzIGFib3V0IGFcbiAgLy8gdG9rZW4gaW4gYSB3YXkgdGhhdCBpcyB2ZXJ5IGNoZWFwIGZvciB0aGUgcGFyc2VyIHRvIGxvb2sgdXAuXG5cbiAgLy8gQWxsIHRva2VuIHR5cGUgdmFyaWFibGVzIHN0YXJ0IHdpdGggYW4gdW5kZXJzY29yZSwgdG8gbWFrZSB0aGVtXG4gIC8vIGVhc3kgdG8gcmVjb2duaXplLlxuXG4gIC8vIFRoZXNlIGFyZSB0aGUgZ2VuZXJhbCB0eXBlcy4gVGhlIGB0eXBlYCBwcm9wZXJ0eSBpcyBvbmx5IHVzZWQgdG9cbiAgLy8gbWFrZSB0aGVtIHJlY29nbml6ZWFibGUgd2hlbiBkZWJ1Z2dpbmcuXG5cbiAgdmFyIF9udW0gPSB7dHlwZTogXCJudW1cIn0sIF9yZWdleHAgPSB7dHlwZTogXCJyZWdleHBcIn0sIF9zdHJpbmcgPSB7dHlwZTogXCJzdHJpbmdcIn07XG4gIHZhciBfbmFtZSA9IHt0eXBlOiBcIm5hbWVcIn0sIF9lb2YgPSB7dHlwZTogXCJlb2ZcIn07XG5cbiAgLy8gS2V5d29yZCB0b2tlbnMuIFRoZSBga2V5d29yZGAgcHJvcGVydHkgKGFsc28gdXNlZCBpbiBrZXl3b3JkLWxpa2VcbiAgLy8gb3BlcmF0b3JzKSBpbmRpY2F0ZXMgdGhhdCB0aGUgdG9rZW4gb3JpZ2luYXRlZCBmcm9tIGFuXG4gIC8vIGlkZW50aWZpZXItbGlrZSB3b3JkLCB3aGljaCBpcyB1c2VkIHdoZW4gcGFyc2luZyBwcm9wZXJ0eSBuYW1lcy5cbiAgLy9cbiAgLy8gVGhlIGBiZWZvcmVFeHByYCBwcm9wZXJ0eSBpcyB1c2VkIHRvIGRpc2FtYmlndWF0ZSBiZXR3ZWVuIHJlZ3VsYXJcbiAgLy8gZXhwcmVzc2lvbnMgYW5kIGRpdmlzaW9ucy4gSXQgaXMgc2V0IG9uIGFsbCB0b2tlbiB0eXBlcyB0aGF0IGNhblxuICAvLyBiZSBmb2xsb3dlZCBieSBhbiBleHByZXNzaW9uICh0aHVzLCBhIHNsYXNoIGFmdGVyIHRoZW0gd291bGQgYmUgYVxuICAvLyByZWd1bGFyIGV4cHJlc3Npb24pLlxuICAvL1xuICAvLyBgaXNMb29wYCBtYXJrcyBhIGtleXdvcmQgYXMgc3RhcnRpbmcgYSBsb29wLCB3aGljaCBpcyBpbXBvcnRhbnRcbiAgLy8gdG8ga25vdyB3aGVuIHBhcnNpbmcgYSBsYWJlbCwgaW4gb3JkZXIgdG8gYWxsb3cgb3IgZGlzYWxsb3dcbiAgLy8gY29udGludWUganVtcHMgdG8gdGhhdCBsYWJlbC5cblxuICB2YXIgX2JyZWFrID0ge2tleXdvcmQ6IFwiYnJlYWtcIn0sIF9jYXNlID0ge2tleXdvcmQ6IFwiY2FzZVwiLCBiZWZvcmVFeHByOiB0cnVlfSwgX2NhdGNoID0ge2tleXdvcmQ6IFwiY2F0Y2hcIn07XG4gIHZhciBfY29udGludWUgPSB7a2V5d29yZDogXCJjb250aW51ZVwifSwgX2RlYnVnZ2VyID0ge2tleXdvcmQ6IFwiZGVidWdnZXJcIn0sIF9kZWZhdWx0ID0ge2tleXdvcmQ6IFwiZGVmYXVsdFwifTtcbiAgdmFyIF9kbyA9IHtrZXl3b3JkOiBcImRvXCIsIGlzTG9vcDogdHJ1ZX0sIF9lbHNlID0ge2tleXdvcmQ6IFwiZWxzZVwiLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9maW5hbGx5ID0ge2tleXdvcmQ6IFwiZmluYWxseVwifSwgX2ZvciA9IHtrZXl3b3JkOiBcImZvclwiLCBpc0xvb3A6IHRydWV9LCBfZnVuY3Rpb24gPSB7a2V5d29yZDogXCJmdW5jdGlvblwifTtcbiAgdmFyIF9pZiA9IHtrZXl3b3JkOiBcImlmXCJ9LCBfcmV0dXJuID0ge2tleXdvcmQ6IFwicmV0dXJuXCIsIGJlZm9yZUV4cHI6IHRydWV9LCBfc3dpdGNoID0ge2tleXdvcmQ6IFwic3dpdGNoXCJ9O1xuICB2YXIgX3Rocm93ID0ge2tleXdvcmQ6IFwidGhyb3dcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF90cnkgPSB7a2V5d29yZDogXCJ0cnlcIn0sIF92YXIgPSB7a2V5d29yZDogXCJ2YXJcIn07XG4gIHZhciBfbGV0ID0ge2tleXdvcmQ6IFwibGV0XCJ9LCBfY29uc3QgPSB7a2V5d29yZDogXCJjb25zdFwifTtcbiAgdmFyIF93aGlsZSA9IHtrZXl3b3JkOiBcIndoaWxlXCIsIGlzTG9vcDogdHJ1ZX0sIF93aXRoID0ge2tleXdvcmQ6IFwid2l0aFwifSwgX25ldyA9IHtrZXl3b3JkOiBcIm5ld1wiLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF90aGlzID0ge2tleXdvcmQ6IFwidGhpc1wifTtcblxuICAvLyBUaGUga2V5d29yZHMgdGhhdCBkZW5vdGUgdmFsdWVzLlxuXG4gIHZhciBfbnVsbCA9IHtrZXl3b3JkOiBcIm51bGxcIiwgYXRvbVZhbHVlOiBudWxsfSwgX3RydWUgPSB7a2V5d29yZDogXCJ0cnVlXCIsIGF0b21WYWx1ZTogdHJ1ZX07XG4gIHZhciBfZmFsc2UgPSB7a2V5d29yZDogXCJmYWxzZVwiLCBhdG9tVmFsdWU6IGZhbHNlfTtcblxuICAvLyBTb21lIGtleXdvcmRzIGFyZSB0cmVhdGVkIGFzIHJlZ3VsYXIgb3BlcmF0b3JzLiBgaW5gIHNvbWV0aW1lc1xuICAvLyAod2hlbiBwYXJzaW5nIGBmb3JgKSBuZWVkcyB0byBiZSB0ZXN0ZWQgYWdhaW5zdCBzcGVjaWZpY2FsbHksIHNvXG4gIC8vIHdlIGFzc2lnbiBhIHZhcmlhYmxlIG5hbWUgdG8gaXQgZm9yIHF1aWNrIGNvbXBhcmluZy5cblxuICB2YXIgX2luID0ge2tleXdvcmQ6IFwiaW5cIiwgYmlub3A6IDcsIGJlZm9yZUV4cHI6IHRydWV9O1xuXG4gIC8vIE1hcCBrZXl3b3JkIG5hbWVzIHRvIHRva2VuIHR5cGVzLlxuXG4gIHZhciBrZXl3b3JkVHlwZXMgPSB7XCJicmVha1wiOiBfYnJlYWssIFwiY2FzZVwiOiBfY2FzZSwgXCJjYXRjaFwiOiBfY2F0Y2gsXG4gICAgICAgICAgICAgICAgICAgICAgXCJjb250aW51ZVwiOiBfY29udGludWUsIFwiZGVidWdnZXJcIjogX2RlYnVnZ2VyLCBcImRlZmF1bHRcIjogX2RlZmF1bHQsXG4gICAgICAgICAgICAgICAgICAgICAgXCJkb1wiOiBfZG8sIFwiZWxzZVwiOiBfZWxzZSwgXCJmaW5hbGx5XCI6IF9maW5hbGx5LCBcImZvclwiOiBfZm9yLFxuICAgICAgICAgICAgICAgICAgICAgIFwiZnVuY3Rpb25cIjogX2Z1bmN0aW9uLCBcImlmXCI6IF9pZiwgXCJyZXR1cm5cIjogX3JldHVybiwgXCJzd2l0Y2hcIjogX3N3aXRjaCxcbiAgICAgICAgICAgICAgICAgICAgICBcInRocm93XCI6IF90aHJvdywgXCJ0cnlcIjogX3RyeSwgXCJ2YXJcIjogX3ZhciwgXCJsZXRcIjogX2xldCwgXCJjb25zdFwiOiBfY29uc3QsXG4gICAgICAgICAgICAgICAgICAgICAgXCJ3aGlsZVwiOiBfd2hpbGUsIFwid2l0aFwiOiBfd2l0aCxcbiAgICAgICAgICAgICAgICAgICAgICBcIm51bGxcIjogX251bGwsIFwidHJ1ZVwiOiBfdHJ1ZSwgXCJmYWxzZVwiOiBfZmFsc2UsIFwibmV3XCI6IF9uZXcsIFwiaW5cIjogX2luLFxuICAgICAgICAgICAgICAgICAgICAgIFwiaW5zdGFuY2VvZlwiOiB7a2V5d29yZDogXCJpbnN0YW5jZW9mXCIsIGJpbm9wOiA3LCBiZWZvcmVFeHByOiB0cnVlfSwgXCJ0aGlzXCI6IF90aGlzLFxuICAgICAgICAgICAgICAgICAgICAgIFwidHlwZW9mXCI6IHtrZXl3b3JkOiBcInR5cGVvZlwiLCBwcmVmaXg6IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9LFxuICAgICAgICAgICAgICAgICAgICAgIFwidm9pZFwiOiB7a2V5d29yZDogXCJ2b2lkXCIsIHByZWZpeDogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX0sXG4gICAgICAgICAgICAgICAgICAgICAgXCJkZWxldGVcIjoge2tleXdvcmQ6IFwiZGVsZXRlXCIsIHByZWZpeDogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX19O1xuXG4gIC8vIFB1bmN0dWF0aW9uIHRva2VuIHR5cGVzLiBBZ2FpbiwgdGhlIGB0eXBlYCBwcm9wZXJ0eSBpcyBwdXJlbHkgZm9yIGRlYnVnZ2luZy5cblxuICB2YXIgX2JyYWNrZXRMID0ge3R5cGU6IFwiW1wiLCBiZWZvcmVFeHByOiB0cnVlfSwgX2JyYWNrZXRSID0ge3R5cGU6IFwiXVwifSwgX2JyYWNlTCA9IHt0eXBlOiBcIntcIiwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfYnJhY2VSID0ge3R5cGU6IFwifVwifSwgX3BhcmVuTCA9IHt0eXBlOiBcIihcIiwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9wYXJlblIgPSB7dHlwZTogXCIpXCJ9O1xuICB2YXIgX2NvbW1hID0ge3R5cGU6IFwiLFwiLCBiZWZvcmVFeHByOiB0cnVlfSwgX3NlbWkgPSB7dHlwZTogXCI7XCIsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2NvbG9uID0ge3R5cGU6IFwiOlwiLCBiZWZvcmVFeHByOiB0cnVlfSwgX2RvdCA9IHt0eXBlOiBcIi5cIn0sIF9lbGxpcHNpcyA9IHt0eXBlOiBcIi4uLlwifSwgX3F1ZXN0aW9uID0ge3R5cGU6IFwiP1wiLCBiZWZvcmVFeHByOiB0cnVlfTtcblxuICAvLyBPcGVyYXRvcnMuIFRoZXNlIGNhcnJ5IHNldmVyYWwga2luZHMgb2YgcHJvcGVydGllcyB0byBoZWxwIHRoZVxuICAvLyBwYXJzZXIgdXNlIHRoZW0gcHJvcGVybHkgKHRoZSBwcmVzZW5jZSBvZiB0aGVzZSBwcm9wZXJ0aWVzIGlzXG4gIC8vIHdoYXQgY2F0ZWdvcml6ZXMgdGhlbSBhcyBvcGVyYXRvcnMpLlxuICAvL1xuICAvLyBgYmlub3BgLCB3aGVuIHByZXNlbnQsIHNwZWNpZmllcyB0aGF0IHRoaXMgb3BlcmF0b3IgaXMgYSBiaW5hcnlcbiAgLy8gb3BlcmF0b3IsIGFuZCB3aWxsIHJlZmVyIHRvIGl0cyBwcmVjZWRlbmNlLlxuICAvL1xuICAvLyBgcHJlZml4YCBhbmQgYHBvc3RmaXhgIG1hcmsgdGhlIG9wZXJhdG9yIGFzIGEgcHJlZml4IG9yIHBvc3RmaXhcbiAgLy8gdW5hcnkgb3BlcmF0b3IuIGBpc1VwZGF0ZWAgc3BlY2lmaWVzIHRoYXQgdGhlIG5vZGUgcHJvZHVjZWQgYnlcbiAgLy8gdGhlIG9wZXJhdG9yIHNob3VsZCBiZSBvZiB0eXBlIFVwZGF0ZUV4cHJlc3Npb24gcmF0aGVyIHRoYW5cbiAgLy8gc2ltcGx5IFVuYXJ5RXhwcmVzc2lvbiAoYCsrYCBhbmQgYC0tYCkuXG4gIC8vXG4gIC8vIGBpc0Fzc2lnbmAgbWFya3MgYWxsIG9mIGA9YCwgYCs9YCwgYC09YCBldGNldGVyYSwgd2hpY2ggYWN0IGFzXG4gIC8vIGJpbmFyeSBvcGVyYXRvcnMgd2l0aCBhIHZlcnkgbG93IHByZWNlZGVuY2UsIHRoYXQgc2hvdWxkIHJlc3VsdFxuICAvLyBpbiBBc3NpZ25tZW50RXhwcmVzc2lvbiBub2Rlcy5cblxuICB2YXIgX3NsYXNoID0ge2Jpbm9wOiAxMCwgYmVmb3JlRXhwcjogdHJ1ZX0sIF9lcSA9IHtpc0Fzc2lnbjogdHJ1ZSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfYXNzaWduID0ge2lzQXNzaWduOiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9pbmNEZWMgPSB7cG9zdGZpeDogdHJ1ZSwgcHJlZml4OiB0cnVlLCBpc1VwZGF0ZTogdHJ1ZX0sIF9wcmVmaXggPSB7cHJlZml4OiB0cnVlLCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9sb2dpY2FsT1IgPSB7Ymlub3A6IDEsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2xvZ2ljYWxBTkQgPSB7Ymlub3A6IDIsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2JpdHdpc2VPUiA9IHtiaW5vcDogMywgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfYml0d2lzZVhPUiA9IHtiaW5vcDogNCwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfYml0d2lzZUFORCA9IHtiaW5vcDogNSwgYmVmb3JlRXhwcjogdHJ1ZX07XG4gIHZhciBfZXF1YWxpdHkgPSB7Ymlub3A6IDYsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX3JlbGF0aW9uYWwgPSB7Ymlub3A6IDcsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX2JpdFNoaWZ0ID0ge2Jpbm9wOiA4LCBiZWZvcmVFeHByOiB0cnVlfTtcbiAgdmFyIF9wbHVzTWluID0ge2Jpbm9wOiA5LCBwcmVmaXg6IHRydWUsIGJlZm9yZUV4cHI6IHRydWV9O1xuICB2YXIgX211bHRpcGx5TW9kdWxvID0ge2Jpbm9wOiAxMCwgYmVmb3JlRXhwcjogdHJ1ZX07XG5cbiAgLy8gUHJvdmlkZSBhY2Nlc3MgdG8gdGhlIHRva2VuIHR5cGVzIGZvciBleHRlcm5hbCB1c2VycyBvZiB0aGVcbiAgLy8gdG9rZW5pemVyLlxuXG4gIGV4cG9ydHMudG9rVHlwZXMgPSB7YnJhY2tldEw6IF9icmFja2V0TCwgYnJhY2tldFI6IF9icmFja2V0UiwgYnJhY2VMOiBfYnJhY2VMLCBicmFjZVI6IF9icmFjZVIsXG4gICAgICAgICAgICAgICAgICAgICAgcGFyZW5MOiBfcGFyZW5MLCBwYXJlblI6IF9wYXJlblIsIGNvbW1hOiBfY29tbWEsIHNlbWk6IF9zZW1pLCBjb2xvbjogX2NvbG9uLFxuICAgICAgICAgICAgICAgICAgICAgIGRvdDogX2RvdCwgZWxsaXBzaXM6IF9lbGxpcHNpcywgcXVlc3Rpb246IF9xdWVzdGlvbiwgc2xhc2g6IF9zbGFzaCwgZXE6IF9lcSxcbiAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBfbmFtZSwgZW9mOiBfZW9mLCBudW06IF9udW0sIHJlZ2V4cDogX3JlZ2V4cCwgc3RyaW5nOiBfc3RyaW5nfTtcbiAgZm9yICh2YXIga3cgaW4ga2V5d29yZFR5cGVzKSBleHBvcnRzLnRva1R5cGVzW1wiX1wiICsga3ddID0ga2V5d29yZFR5cGVzW2t3XTtcblxuICAvLyBUaGlzIGlzIGEgdHJpY2sgdGFrZW4gZnJvbSBFc3ByaW1hLiBJdCB0dXJucyBvdXQgdGhhdCwgb25cbiAgLy8gbm9uLUNocm9tZSBicm93c2VycywgdG8gY2hlY2sgd2hldGhlciBhIHN0cmluZyBpcyBpbiBhIHNldCwgYVxuICAvLyBwcmVkaWNhdGUgY29udGFpbmluZyBhIGJpZyB1Z2x5IGBzd2l0Y2hgIHN0YXRlbWVudCBpcyBmYXN0ZXIgdGhhblxuICAvLyBhIHJlZ3VsYXIgZXhwcmVzc2lvbiwgYW5kIG9uIENocm9tZSB0aGUgdHdvIGFyZSBhYm91dCBvbiBwYXIuXG4gIC8vIFRoaXMgZnVuY3Rpb24gdXNlcyBgZXZhbGAgKG5vbi1sZXhpY2FsKSB0byBwcm9kdWNlIHN1Y2ggYVxuICAvLyBwcmVkaWNhdGUgZnJvbSBhIHNwYWNlLXNlcGFyYXRlZCBzdHJpbmcgb2Ygd29yZHMuXG4gIC8vXG4gIC8vIEl0IHN0YXJ0cyBieSBzb3J0aW5nIHRoZSB3b3JkcyBieSBsZW5ndGguXG5cbiAgZnVuY3Rpb24gbWFrZVByZWRpY2F0ZSh3b3Jkcykge1xuICAgIHdvcmRzID0gd29yZHMuc3BsaXQoXCIgXCIpO1xuICAgIHZhciBmID0gXCJcIiwgY2F0cyA9IFtdO1xuICAgIG91dDogZm9yICh2YXIgaSA9IDA7IGkgPCB3b3Jkcy5sZW5ndGg7ICsraSkge1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBjYXRzLmxlbmd0aDsgKytqKVxuICAgICAgICBpZiAoY2F0c1tqXVswXS5sZW5ndGggPT0gd29yZHNbaV0ubGVuZ3RoKSB7XG4gICAgICAgICAgY2F0c1tqXS5wdXNoKHdvcmRzW2ldKTtcbiAgICAgICAgICBjb250aW51ZSBvdXQ7XG4gICAgICAgIH1cbiAgICAgIGNhdHMucHVzaChbd29yZHNbaV1dKTtcbiAgICB9XG4gICAgZnVuY3Rpb24gY29tcGFyZVRvKGFycikge1xuICAgICAgaWYgKGFyci5sZW5ndGggPT0gMSkgcmV0dXJuIGYgKz0gXCJyZXR1cm4gc3RyID09PSBcIiArIEpTT04uc3RyaW5naWZ5KGFyclswXSkgKyBcIjtcIjtcbiAgICAgIGYgKz0gXCJzd2l0Y2goc3RyKXtcIjtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYXJyLmxlbmd0aDsgKytpKSBmICs9IFwiY2FzZSBcIiArIEpTT04uc3RyaW5naWZ5KGFycltpXSkgKyBcIjpcIjtcbiAgICAgIGYgKz0gXCJyZXR1cm4gdHJ1ZX1yZXR1cm4gZmFsc2U7XCI7XG4gICAgfVxuXG4gICAgLy8gV2hlbiB0aGVyZSBhcmUgbW9yZSB0aGFuIHRocmVlIGxlbmd0aCBjYXRlZ29yaWVzLCBhbiBvdXRlclxuICAgIC8vIHN3aXRjaCBmaXJzdCBkaXNwYXRjaGVzIG9uIHRoZSBsZW5ndGhzLCB0byBzYXZlIG9uIGNvbXBhcmlzb25zLlxuXG4gICAgaWYgKGNhdHMubGVuZ3RoID4gMykge1xuICAgICAgY2F0cy5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtyZXR1cm4gYi5sZW5ndGggLSBhLmxlbmd0aDt9KTtcbiAgICAgIGYgKz0gXCJzd2l0Y2goc3RyLmxlbmd0aCl7XCI7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGNhdHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgdmFyIGNhdCA9IGNhdHNbaV07XG4gICAgICAgIGYgKz0gXCJjYXNlIFwiICsgY2F0WzBdLmxlbmd0aCArIFwiOlwiO1xuICAgICAgICBjb21wYXJlVG8oY2F0KTtcbiAgICAgIH1cbiAgICAgIGYgKz0gXCJ9XCI7XG5cbiAgICAvLyBPdGhlcndpc2UsIHNpbXBseSBnZW5lcmF0ZSBhIGZsYXQgYHN3aXRjaGAgc3RhdGVtZW50LlxuXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbXBhcmVUbyh3b3Jkcyk7XG4gICAgfVxuICAgIHJldHVybiBuZXcgRnVuY3Rpb24oXCJzdHJcIiwgZik7XG4gIH1cblxuICAvLyBUaGUgRUNNQVNjcmlwdCAzIHJlc2VydmVkIHdvcmQgbGlzdC5cblxuICB2YXIgaXNSZXNlcnZlZFdvcmQzID0gbWFrZVByZWRpY2F0ZShcImFic3RyYWN0IGJvb2xlYW4gYnl0ZSBjaGFyIGNsYXNzIGRvdWJsZSBlbnVtIGV4cG9ydCBleHRlbmRzIGZpbmFsIGZsb2F0IGdvdG8gaW1wbGVtZW50cyBpbXBvcnQgaW50IGludGVyZmFjZSBsb25nIG5hdGl2ZSBwYWNrYWdlIHByaXZhdGUgcHJvdGVjdGVkIHB1YmxpYyBzaG9ydCBzdGF0aWMgc3VwZXIgc3luY2hyb25pemVkIHRocm93cyB0cmFuc2llbnQgdm9sYXRpbGVcIik7XG5cbiAgLy8gRUNNQVNjcmlwdCA1IHJlc2VydmVkIHdvcmRzLlxuXG4gIHZhciBpc1Jlc2VydmVkV29yZDUgPSBtYWtlUHJlZGljYXRlKFwiY2xhc3MgZW51bSBleHRlbmRzIHN1cGVyIGNvbnN0IGV4cG9ydCBpbXBvcnRcIik7XG5cbiAgLy8gVGhlIGFkZGl0aW9uYWwgcmVzZXJ2ZWQgd29yZHMgaW4gc3RyaWN0IG1vZGUuXG5cbiAgdmFyIGlzU3RyaWN0UmVzZXJ2ZWRXb3JkID0gbWFrZVByZWRpY2F0ZShcImltcGxlbWVudHMgaW50ZXJmYWNlIGxldCBwYWNrYWdlIHByaXZhdGUgcHJvdGVjdGVkIHB1YmxpYyBzdGF0aWMgeWllbGRcIik7XG5cbiAgLy8gVGhlIGZvcmJpZGRlbiB2YXJpYWJsZSBuYW1lcyBpbiBzdHJpY3QgbW9kZS5cblxuICB2YXIgaXNTdHJpY3RCYWRJZFdvcmQgPSBtYWtlUHJlZGljYXRlKFwiZXZhbCBhcmd1bWVudHNcIik7XG5cbiAgLy8gQW5kIHRoZSBrZXl3b3Jkcy5cblxuICB2YXIgZWNtYTVBbmRMZXNzS2V5d29yZHMgPSBcImJyZWFrIGNhc2UgY2F0Y2ggY29udGludWUgZGVidWdnZXIgZGVmYXVsdCBkbyBlbHNlIGZpbmFsbHkgZm9yIGZ1bmN0aW9uIGlmIHJldHVybiBzd2l0Y2ggdGhyb3cgdHJ5IHZhciB3aGlsZSB3aXRoIG51bGwgdHJ1ZSBmYWxzZSBpbnN0YW5jZW9mIHR5cGVvZiB2b2lkIGRlbGV0ZSBuZXcgaW4gdGhpc1wiO1xuXG4gIHZhciBpc0VjbWE1QW5kTGVzc0tleXdvcmQgPSBtYWtlUHJlZGljYXRlKGVjbWE1QW5kTGVzc0tleXdvcmRzKTtcblxuICB2YXIgaXNFY21hNktleXdvcmQgPSBtYWtlUHJlZGljYXRlKGVjbWE1QW5kTGVzc0tleXdvcmRzICsgXCIgbGV0IGNvbnN0XCIpO1xuXG4gIHZhciBpc0tleXdvcmQgPSBpc0VjbWE1QW5kTGVzc0tleXdvcmQ7XG5cbiAgLy8gIyMgQ2hhcmFjdGVyIGNhdGVnb3JpZXNcblxuICAvLyBCaWcgdWdseSByZWd1bGFyIGV4cHJlc3Npb25zIHRoYXQgbWF0Y2ggY2hhcmFjdGVycyBpbiB0aGVcbiAgLy8gd2hpdGVzcGFjZSwgaWRlbnRpZmllciwgYW5kIGlkZW50aWZpZXItc3RhcnQgY2F0ZWdvcmllcy4gVGhlc2VcbiAgLy8gYXJlIG9ubHkgYXBwbGllZCB3aGVuIGEgY2hhcmFjdGVyIGlzIGZvdW5kIHRvIGFjdHVhbGx5IGhhdmUgYVxuICAvLyBjb2RlIHBvaW50IGFib3ZlIDEyOC5cblxuICB2YXIgbm9uQVNDSUl3aGl0ZXNwYWNlID0gL1tcXHUxNjgwXFx1MTgwZVxcdTIwMDAtXFx1MjAwYVxcdTIwMmZcXHUyMDVmXFx1MzAwMFxcdWZlZmZdLztcbiAgdmFyIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0Q2hhcnMgPSBcIlxceGFhXFx4YjVcXHhiYVxceGMwLVxceGQ2XFx4ZDgtXFx4ZjZcXHhmOC1cXHUwMmMxXFx1MDJjNi1cXHUwMmQxXFx1MDJlMC1cXHUwMmU0XFx1MDJlY1xcdTAyZWVcXHUwMzcwLVxcdTAzNzRcXHUwMzc2XFx1MDM3N1xcdTAzN2EtXFx1MDM3ZFxcdTAzODZcXHUwMzg4LVxcdTAzOGFcXHUwMzhjXFx1MDM4ZS1cXHUwM2ExXFx1MDNhMy1cXHUwM2Y1XFx1MDNmNy1cXHUwNDgxXFx1MDQ4YS1cXHUwNTI3XFx1MDUzMS1cXHUwNTU2XFx1MDU1OVxcdTA1NjEtXFx1MDU4N1xcdTA1ZDAtXFx1MDVlYVxcdTA1ZjAtXFx1MDVmMlxcdTA2MjAtXFx1MDY0YVxcdTA2NmVcXHUwNjZmXFx1MDY3MS1cXHUwNmQzXFx1MDZkNVxcdTA2ZTVcXHUwNmU2XFx1MDZlZVxcdTA2ZWZcXHUwNmZhLVxcdTA2ZmNcXHUwNmZmXFx1MDcxMFxcdTA3MTItXFx1MDcyZlxcdTA3NGQtXFx1MDdhNVxcdTA3YjFcXHUwN2NhLVxcdTA3ZWFcXHUwN2Y0XFx1MDdmNVxcdTA3ZmFcXHUwODAwLVxcdTA4MTVcXHUwODFhXFx1MDgyNFxcdTA4MjhcXHUwODQwLVxcdTA4NThcXHUwOGEwXFx1MDhhMi1cXHUwOGFjXFx1MDkwNC1cXHUwOTM5XFx1MDkzZFxcdTA5NTBcXHUwOTU4LVxcdTA5NjFcXHUwOTcxLVxcdTA5NzdcXHUwOTc5LVxcdTA5N2ZcXHUwOTg1LVxcdTA5OGNcXHUwOThmXFx1MDk5MFxcdTA5OTMtXFx1MDlhOFxcdTA5YWEtXFx1MDliMFxcdTA5YjJcXHUwOWI2LVxcdTA5YjlcXHUwOWJkXFx1MDljZVxcdTA5ZGNcXHUwOWRkXFx1MDlkZi1cXHUwOWUxXFx1MDlmMFxcdTA5ZjFcXHUwYTA1LVxcdTBhMGFcXHUwYTBmXFx1MGExMFxcdTBhMTMtXFx1MGEyOFxcdTBhMmEtXFx1MGEzMFxcdTBhMzJcXHUwYTMzXFx1MGEzNVxcdTBhMzZcXHUwYTM4XFx1MGEzOVxcdTBhNTktXFx1MGE1Y1xcdTBhNWVcXHUwYTcyLVxcdTBhNzRcXHUwYTg1LVxcdTBhOGRcXHUwYThmLVxcdTBhOTFcXHUwYTkzLVxcdTBhYThcXHUwYWFhLVxcdTBhYjBcXHUwYWIyXFx1MGFiM1xcdTBhYjUtXFx1MGFiOVxcdTBhYmRcXHUwYWQwXFx1MGFlMFxcdTBhZTFcXHUwYjA1LVxcdTBiMGNcXHUwYjBmXFx1MGIxMFxcdTBiMTMtXFx1MGIyOFxcdTBiMmEtXFx1MGIzMFxcdTBiMzJcXHUwYjMzXFx1MGIzNS1cXHUwYjM5XFx1MGIzZFxcdTBiNWNcXHUwYjVkXFx1MGI1Zi1cXHUwYjYxXFx1MGI3MVxcdTBiODNcXHUwYjg1LVxcdTBiOGFcXHUwYjhlLVxcdTBiOTBcXHUwYjkyLVxcdTBiOTVcXHUwYjk5XFx1MGI5YVxcdTBiOWNcXHUwYjllXFx1MGI5ZlxcdTBiYTNcXHUwYmE0XFx1MGJhOC1cXHUwYmFhXFx1MGJhZS1cXHUwYmI5XFx1MGJkMFxcdTBjMDUtXFx1MGMwY1xcdTBjMGUtXFx1MGMxMFxcdTBjMTItXFx1MGMyOFxcdTBjMmEtXFx1MGMzM1xcdTBjMzUtXFx1MGMzOVxcdTBjM2RcXHUwYzU4XFx1MGM1OVxcdTBjNjBcXHUwYzYxXFx1MGM4NS1cXHUwYzhjXFx1MGM4ZS1cXHUwYzkwXFx1MGM5Mi1cXHUwY2E4XFx1MGNhYS1cXHUwY2IzXFx1MGNiNS1cXHUwY2I5XFx1MGNiZFxcdTBjZGVcXHUwY2UwXFx1MGNlMVxcdTBjZjFcXHUwY2YyXFx1MGQwNS1cXHUwZDBjXFx1MGQwZS1cXHUwZDEwXFx1MGQxMi1cXHUwZDNhXFx1MGQzZFxcdTBkNGVcXHUwZDYwXFx1MGQ2MVxcdTBkN2EtXFx1MGQ3ZlxcdTBkODUtXFx1MGQ5NlxcdTBkOWEtXFx1MGRiMVxcdTBkYjMtXFx1MGRiYlxcdTBkYmRcXHUwZGMwLVxcdTBkYzZcXHUwZTAxLVxcdTBlMzBcXHUwZTMyXFx1MGUzM1xcdTBlNDAtXFx1MGU0NlxcdTBlODFcXHUwZTgyXFx1MGU4NFxcdTBlODdcXHUwZTg4XFx1MGU4YVxcdTBlOGRcXHUwZTk0LVxcdTBlOTdcXHUwZTk5LVxcdTBlOWZcXHUwZWExLVxcdTBlYTNcXHUwZWE1XFx1MGVhN1xcdTBlYWFcXHUwZWFiXFx1MGVhZC1cXHUwZWIwXFx1MGViMlxcdTBlYjNcXHUwZWJkXFx1MGVjMC1cXHUwZWM0XFx1MGVjNlxcdTBlZGMtXFx1MGVkZlxcdTBmMDBcXHUwZjQwLVxcdTBmNDdcXHUwZjQ5LVxcdTBmNmNcXHUwZjg4LVxcdTBmOGNcXHUxMDAwLVxcdTEwMmFcXHUxMDNmXFx1MTA1MC1cXHUxMDU1XFx1MTA1YS1cXHUxMDVkXFx1MTA2MVxcdTEwNjVcXHUxMDY2XFx1MTA2ZS1cXHUxMDcwXFx1MTA3NS1cXHUxMDgxXFx1MTA4ZVxcdTEwYTAtXFx1MTBjNVxcdTEwYzdcXHUxMGNkXFx1MTBkMC1cXHUxMGZhXFx1MTBmYy1cXHUxMjQ4XFx1MTI0YS1cXHUxMjRkXFx1MTI1MC1cXHUxMjU2XFx1MTI1OFxcdTEyNWEtXFx1MTI1ZFxcdTEyNjAtXFx1MTI4OFxcdTEyOGEtXFx1MTI4ZFxcdTEyOTAtXFx1MTJiMFxcdTEyYjItXFx1MTJiNVxcdTEyYjgtXFx1MTJiZVxcdTEyYzBcXHUxMmMyLVxcdTEyYzVcXHUxMmM4LVxcdTEyZDZcXHUxMmQ4LVxcdTEzMTBcXHUxMzEyLVxcdTEzMTVcXHUxMzE4LVxcdTEzNWFcXHUxMzgwLVxcdTEzOGZcXHUxM2EwLVxcdTEzZjRcXHUxNDAxLVxcdTE2NmNcXHUxNjZmLVxcdTE2N2ZcXHUxNjgxLVxcdTE2OWFcXHUxNmEwLVxcdTE2ZWFcXHUxNmVlLVxcdTE2ZjBcXHUxNzAwLVxcdTE3MGNcXHUxNzBlLVxcdTE3MTFcXHUxNzIwLVxcdTE3MzFcXHUxNzQwLVxcdTE3NTFcXHUxNzYwLVxcdTE3NmNcXHUxNzZlLVxcdTE3NzBcXHUxNzgwLVxcdTE3YjNcXHUxN2Q3XFx1MTdkY1xcdTE4MjAtXFx1MTg3N1xcdTE4ODAtXFx1MThhOFxcdTE4YWFcXHUxOGIwLVxcdTE4ZjVcXHUxOTAwLVxcdTE5MWNcXHUxOTUwLVxcdTE5NmRcXHUxOTcwLVxcdTE5NzRcXHUxOTgwLVxcdTE5YWJcXHUxOWMxLVxcdTE5YzdcXHUxYTAwLVxcdTFhMTZcXHUxYTIwLVxcdTFhNTRcXHUxYWE3XFx1MWIwNS1cXHUxYjMzXFx1MWI0NS1cXHUxYjRiXFx1MWI4My1cXHUxYmEwXFx1MWJhZVxcdTFiYWZcXHUxYmJhLVxcdTFiZTVcXHUxYzAwLVxcdTFjMjNcXHUxYzRkLVxcdTFjNGZcXHUxYzVhLVxcdTFjN2RcXHUxY2U5LVxcdTFjZWNcXHUxY2VlLVxcdTFjZjFcXHUxY2Y1XFx1MWNmNlxcdTFkMDAtXFx1MWRiZlxcdTFlMDAtXFx1MWYxNVxcdTFmMTgtXFx1MWYxZFxcdTFmMjAtXFx1MWY0NVxcdTFmNDgtXFx1MWY0ZFxcdTFmNTAtXFx1MWY1N1xcdTFmNTlcXHUxZjViXFx1MWY1ZFxcdTFmNWYtXFx1MWY3ZFxcdTFmODAtXFx1MWZiNFxcdTFmYjYtXFx1MWZiY1xcdTFmYmVcXHUxZmMyLVxcdTFmYzRcXHUxZmM2LVxcdTFmY2NcXHUxZmQwLVxcdTFmZDNcXHUxZmQ2LVxcdTFmZGJcXHUxZmUwLVxcdTFmZWNcXHUxZmYyLVxcdTFmZjRcXHUxZmY2LVxcdTFmZmNcXHUyMDcxXFx1MjA3ZlxcdTIwOTAtXFx1MjA5Y1xcdTIxMDJcXHUyMTA3XFx1MjEwYS1cXHUyMTEzXFx1MjExNVxcdTIxMTktXFx1MjExZFxcdTIxMjRcXHUyMTI2XFx1MjEyOFxcdTIxMmEtXFx1MjEyZFxcdTIxMmYtXFx1MjEzOVxcdTIxM2MtXFx1MjEzZlxcdTIxNDUtXFx1MjE0OVxcdTIxNGVcXHUyMTYwLVxcdTIxODhcXHUyYzAwLVxcdTJjMmVcXHUyYzMwLVxcdTJjNWVcXHUyYzYwLVxcdTJjZTRcXHUyY2ViLVxcdTJjZWVcXHUyY2YyXFx1MmNmM1xcdTJkMDAtXFx1MmQyNVxcdTJkMjdcXHUyZDJkXFx1MmQzMC1cXHUyZDY3XFx1MmQ2ZlxcdTJkODAtXFx1MmQ5NlxcdTJkYTAtXFx1MmRhNlxcdTJkYTgtXFx1MmRhZVxcdTJkYjAtXFx1MmRiNlxcdTJkYjgtXFx1MmRiZVxcdTJkYzAtXFx1MmRjNlxcdTJkYzgtXFx1MmRjZVxcdTJkZDAtXFx1MmRkNlxcdTJkZDgtXFx1MmRkZVxcdTJlMmZcXHUzMDA1LVxcdTMwMDdcXHUzMDIxLVxcdTMwMjlcXHUzMDMxLVxcdTMwMzVcXHUzMDM4LVxcdTMwM2NcXHUzMDQxLVxcdTMwOTZcXHUzMDlkLVxcdTMwOWZcXHUzMGExLVxcdTMwZmFcXHUzMGZjLVxcdTMwZmZcXHUzMTA1LVxcdTMxMmRcXHUzMTMxLVxcdTMxOGVcXHUzMWEwLVxcdTMxYmFcXHUzMWYwLVxcdTMxZmZcXHUzNDAwLVxcdTRkYjVcXHU0ZTAwLVxcdTlmY2NcXHVhMDAwLVxcdWE0OGNcXHVhNGQwLVxcdWE0ZmRcXHVhNTAwLVxcdWE2MGNcXHVhNjEwLVxcdWE2MWZcXHVhNjJhXFx1YTYyYlxcdWE2NDAtXFx1YTY2ZVxcdWE2N2YtXFx1YTY5N1xcdWE2YTAtXFx1YTZlZlxcdWE3MTctXFx1YTcxZlxcdWE3MjItXFx1YTc4OFxcdWE3OGItXFx1YTc4ZVxcdWE3OTAtXFx1YTc5M1xcdWE3YTAtXFx1YTdhYVxcdWE3ZjgtXFx1YTgwMVxcdWE4MDMtXFx1YTgwNVxcdWE4MDctXFx1YTgwYVxcdWE4MGMtXFx1YTgyMlxcdWE4NDAtXFx1YTg3M1xcdWE4ODItXFx1YThiM1xcdWE4ZjItXFx1YThmN1xcdWE4ZmJcXHVhOTBhLVxcdWE5MjVcXHVhOTMwLVxcdWE5NDZcXHVhOTYwLVxcdWE5N2NcXHVhOTg0LVxcdWE5YjJcXHVhOWNmXFx1YWEwMC1cXHVhYTI4XFx1YWE0MC1cXHVhYTQyXFx1YWE0NC1cXHVhYTRiXFx1YWE2MC1cXHVhYTc2XFx1YWE3YVxcdWFhODAtXFx1YWFhZlxcdWFhYjFcXHVhYWI1XFx1YWFiNlxcdWFhYjktXFx1YWFiZFxcdWFhYzBcXHVhYWMyXFx1YWFkYi1cXHVhYWRkXFx1YWFlMC1cXHVhYWVhXFx1YWFmMi1cXHVhYWY0XFx1YWIwMS1cXHVhYjA2XFx1YWIwOS1cXHVhYjBlXFx1YWIxMS1cXHVhYjE2XFx1YWIyMC1cXHVhYjI2XFx1YWIyOC1cXHVhYjJlXFx1YWJjMC1cXHVhYmUyXFx1YWMwMC1cXHVkN2EzXFx1ZDdiMC1cXHVkN2M2XFx1ZDdjYi1cXHVkN2ZiXFx1ZjkwMC1cXHVmYTZkXFx1ZmE3MC1cXHVmYWQ5XFx1ZmIwMC1cXHVmYjA2XFx1ZmIxMy1cXHVmYjE3XFx1ZmIxZFxcdWZiMWYtXFx1ZmIyOFxcdWZiMmEtXFx1ZmIzNlxcdWZiMzgtXFx1ZmIzY1xcdWZiM2VcXHVmYjQwXFx1ZmI0MVxcdWZiNDNcXHVmYjQ0XFx1ZmI0Ni1cXHVmYmIxXFx1ZmJkMy1cXHVmZDNkXFx1ZmQ1MC1cXHVmZDhmXFx1ZmQ5Mi1cXHVmZGM3XFx1ZmRmMC1cXHVmZGZiXFx1ZmU3MC1cXHVmZTc0XFx1ZmU3Ni1cXHVmZWZjXFx1ZmYyMS1cXHVmZjNhXFx1ZmY0MS1cXHVmZjVhXFx1ZmY2Ni1cXHVmZmJlXFx1ZmZjMi1cXHVmZmM3XFx1ZmZjYS1cXHVmZmNmXFx1ZmZkMi1cXHVmZmQ3XFx1ZmZkYS1cXHVmZmRjXCI7XG4gIHZhciBub25BU0NJSWlkZW50aWZpZXJDaGFycyA9IFwiXFx1MDMwMC1cXHUwMzZmXFx1MDQ4My1cXHUwNDg3XFx1MDU5MS1cXHUwNWJkXFx1MDViZlxcdTA1YzFcXHUwNWMyXFx1MDVjNFxcdTA1YzVcXHUwNWM3XFx1MDYxMC1cXHUwNjFhXFx1MDYyMC1cXHUwNjQ5XFx1MDY3Mi1cXHUwNmQzXFx1MDZlNy1cXHUwNmU4XFx1MDZmYi1cXHUwNmZjXFx1MDczMC1cXHUwNzRhXFx1MDgwMC1cXHUwODE0XFx1MDgxYi1cXHUwODIzXFx1MDgyNS1cXHUwODI3XFx1MDgyOS1cXHUwODJkXFx1MDg0MC1cXHUwODU3XFx1MDhlNC1cXHUwOGZlXFx1MDkwMC1cXHUwOTAzXFx1MDkzYS1cXHUwOTNjXFx1MDkzZS1cXHUwOTRmXFx1MDk1MS1cXHUwOTU3XFx1MDk2Mi1cXHUwOTYzXFx1MDk2Ni1cXHUwOTZmXFx1MDk4MS1cXHUwOTgzXFx1MDliY1xcdTA5YmUtXFx1MDljNFxcdTA5YzdcXHUwOWM4XFx1MDlkN1xcdTA5ZGYtXFx1MDllMFxcdTBhMDEtXFx1MGEwM1xcdTBhM2NcXHUwYTNlLVxcdTBhNDJcXHUwYTQ3XFx1MGE0OFxcdTBhNGItXFx1MGE0ZFxcdTBhNTFcXHUwYTY2LVxcdTBhNzFcXHUwYTc1XFx1MGE4MS1cXHUwYTgzXFx1MGFiY1xcdTBhYmUtXFx1MGFjNVxcdTBhYzctXFx1MGFjOVxcdTBhY2ItXFx1MGFjZFxcdTBhZTItXFx1MGFlM1xcdTBhZTYtXFx1MGFlZlxcdTBiMDEtXFx1MGIwM1xcdTBiM2NcXHUwYjNlLVxcdTBiNDRcXHUwYjQ3XFx1MGI0OFxcdTBiNGItXFx1MGI0ZFxcdTBiNTZcXHUwYjU3XFx1MGI1Zi1cXHUwYjYwXFx1MGI2Ni1cXHUwYjZmXFx1MGI4MlxcdTBiYmUtXFx1MGJjMlxcdTBiYzYtXFx1MGJjOFxcdTBiY2EtXFx1MGJjZFxcdTBiZDdcXHUwYmU2LVxcdTBiZWZcXHUwYzAxLVxcdTBjMDNcXHUwYzQ2LVxcdTBjNDhcXHUwYzRhLVxcdTBjNGRcXHUwYzU1XFx1MGM1NlxcdTBjNjItXFx1MGM2M1xcdTBjNjYtXFx1MGM2ZlxcdTBjODJcXHUwYzgzXFx1MGNiY1xcdTBjYmUtXFx1MGNjNFxcdTBjYzYtXFx1MGNjOFxcdTBjY2EtXFx1MGNjZFxcdTBjZDVcXHUwY2Q2XFx1MGNlMi1cXHUwY2UzXFx1MGNlNi1cXHUwY2VmXFx1MGQwMlxcdTBkMDNcXHUwZDQ2LVxcdTBkNDhcXHUwZDU3XFx1MGQ2Mi1cXHUwZDYzXFx1MGQ2Ni1cXHUwZDZmXFx1MGQ4MlxcdTBkODNcXHUwZGNhXFx1MGRjZi1cXHUwZGQ0XFx1MGRkNlxcdTBkZDgtXFx1MGRkZlxcdTBkZjJcXHUwZGYzXFx1MGUzNC1cXHUwZTNhXFx1MGU0MC1cXHUwZTQ1XFx1MGU1MC1cXHUwZTU5XFx1MGViNC1cXHUwZWI5XFx1MGVjOC1cXHUwZWNkXFx1MGVkMC1cXHUwZWQ5XFx1MGYxOFxcdTBmMTlcXHUwZjIwLVxcdTBmMjlcXHUwZjM1XFx1MGYzN1xcdTBmMzlcXHUwZjQxLVxcdTBmNDdcXHUwZjcxLVxcdTBmODRcXHUwZjg2LVxcdTBmODdcXHUwZjhkLVxcdTBmOTdcXHUwZjk5LVxcdTBmYmNcXHUwZmM2XFx1MTAwMC1cXHUxMDI5XFx1MTA0MC1cXHUxMDQ5XFx1MTA2Ny1cXHUxMDZkXFx1MTA3MS1cXHUxMDc0XFx1MTA4Mi1cXHUxMDhkXFx1MTA4Zi1cXHUxMDlkXFx1MTM1ZC1cXHUxMzVmXFx1MTcwZS1cXHUxNzEwXFx1MTcyMC1cXHUxNzMwXFx1MTc0MC1cXHUxNzUwXFx1MTc3MlxcdTE3NzNcXHUxNzgwLVxcdTE3YjJcXHUxN2RkXFx1MTdlMC1cXHUxN2U5XFx1MTgwYi1cXHUxODBkXFx1MTgxMC1cXHUxODE5XFx1MTkyMC1cXHUxOTJiXFx1MTkzMC1cXHUxOTNiXFx1MTk1MS1cXHUxOTZkXFx1MTliMC1cXHUxOWMwXFx1MTljOC1cXHUxOWM5XFx1MTlkMC1cXHUxOWQ5XFx1MWEwMC1cXHUxYTE1XFx1MWEyMC1cXHUxYTUzXFx1MWE2MC1cXHUxYTdjXFx1MWE3Zi1cXHUxYTg5XFx1MWE5MC1cXHUxYTk5XFx1MWI0Ni1cXHUxYjRiXFx1MWI1MC1cXHUxYjU5XFx1MWI2Yi1cXHUxYjczXFx1MWJiMC1cXHUxYmI5XFx1MWJlNi1cXHUxYmYzXFx1MWMwMC1cXHUxYzIyXFx1MWM0MC1cXHUxYzQ5XFx1MWM1Yi1cXHUxYzdkXFx1MWNkMC1cXHUxY2QyXFx1MWQwMC1cXHUxZGJlXFx1MWUwMS1cXHUxZjE1XFx1MjAwY1xcdTIwMGRcXHUyMDNmXFx1MjA0MFxcdTIwNTRcXHUyMGQwLVxcdTIwZGNcXHUyMGUxXFx1MjBlNS1cXHUyMGYwXFx1MmQ4MS1cXHUyZDk2XFx1MmRlMC1cXHUyZGZmXFx1MzAyMS1cXHUzMDI4XFx1MzA5OVxcdTMwOWFcXHVhNjQwLVxcdWE2NmRcXHVhNjc0LVxcdWE2N2RcXHVhNjlmXFx1YTZmMC1cXHVhNmYxXFx1YTdmOC1cXHVhODAwXFx1YTgwNlxcdWE4MGJcXHVhODIzLVxcdWE4MjdcXHVhODgwLVxcdWE4ODFcXHVhOGI0LVxcdWE4YzRcXHVhOGQwLVxcdWE4ZDlcXHVhOGYzLVxcdWE4ZjdcXHVhOTAwLVxcdWE5MDlcXHVhOTI2LVxcdWE5MmRcXHVhOTMwLVxcdWE5NDVcXHVhOTgwLVxcdWE5ODNcXHVhOWIzLVxcdWE5YzBcXHVhYTAwLVxcdWFhMjdcXHVhYTQwLVxcdWFhNDFcXHVhYTRjLVxcdWFhNGRcXHVhYTUwLVxcdWFhNTlcXHVhYTdiXFx1YWFlMC1cXHVhYWU5XFx1YWFmMi1cXHVhYWYzXFx1YWJjMC1cXHVhYmUxXFx1YWJlY1xcdWFiZWRcXHVhYmYwLVxcdWFiZjlcXHVmYjIwLVxcdWZiMjhcXHVmZTAwLVxcdWZlMGZcXHVmZTIwLVxcdWZlMjZcXHVmZTMzXFx1ZmUzNFxcdWZlNGQtXFx1ZmU0ZlxcdWZmMTAtXFx1ZmYxOVxcdWZmM2ZcIjtcbiAgdmFyIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0ID0gbmV3IFJlZ0V4cChcIltcIiArIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0Q2hhcnMgKyBcIl1cIik7XG4gIHZhciBub25BU0NJSWlkZW50aWZpZXIgPSBuZXcgUmVnRXhwKFwiW1wiICsgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnRDaGFycyArIG5vbkFTQ0lJaWRlbnRpZmllckNoYXJzICsgXCJdXCIpO1xuXG4gIC8vIFdoZXRoZXIgYSBzaW5nbGUgY2hhcmFjdGVyIGRlbm90ZXMgYSBuZXdsaW5lLlxuXG4gIHZhciBuZXdsaW5lID0gL1tcXG5cXHJcXHUyMDI4XFx1MjAyOV0vO1xuXG4gIC8vIE1hdGNoZXMgYSB3aG9sZSBsaW5lIGJyZWFrICh3aGVyZSBDUkxGIGlzIGNvbnNpZGVyZWQgYSBzaW5nbGVcbiAgLy8gbGluZSBicmVhaykuIFVzZWQgdG8gY291bnQgbGluZXMuXG5cbiAgdmFyIGxpbmVCcmVhayA9IC9cXHJcXG58W1xcblxcclxcdTIwMjhcXHUyMDI5XS9nO1xuXG4gIC8vIFRlc3Qgd2hldGhlciBhIGdpdmVuIGNoYXJhY3RlciBjb2RlIHN0YXJ0cyBhbiBpZGVudGlmaWVyLlxuXG4gIHZhciBpc0lkZW50aWZpZXJTdGFydCA9IGV4cG9ydHMuaXNJZGVudGlmaWVyU3RhcnQgPSBmdW5jdGlvbihjb2RlKSB7XG4gICAgaWYgKGNvZGUgPCA2NSkgcmV0dXJuIGNvZGUgPT09IDM2O1xuICAgIGlmIChjb2RlIDwgOTEpIHJldHVybiB0cnVlO1xuICAgIGlmIChjb2RlIDwgOTcpIHJldHVybiBjb2RlID09PSA5NTtcbiAgICBpZiAoY29kZSA8IDEyMylyZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gY29kZSA+PSAweGFhICYmIG5vbkFTQ0lJaWRlbnRpZmllclN0YXJ0LnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKSk7XG4gIH07XG5cbiAgLy8gVGVzdCB3aGV0aGVyIGEgZ2l2ZW4gY2hhcmFjdGVyIGlzIHBhcnQgb2YgYW4gaWRlbnRpZmllci5cblxuICB2YXIgaXNJZGVudGlmaWVyQ2hhciA9IGV4cG9ydHMuaXNJZGVudGlmaWVyQ2hhciA9IGZ1bmN0aW9uKGNvZGUpIHtcbiAgICBpZiAoY29kZSA8IDQ4KSByZXR1cm4gY29kZSA9PT0gMzY7XG4gICAgaWYgKGNvZGUgPCA1OCkgcmV0dXJuIHRydWU7XG4gICAgaWYgKGNvZGUgPCA2NSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmIChjb2RlIDwgOTEpIHJldHVybiB0cnVlO1xuICAgIGlmIChjb2RlIDwgOTcpIHJldHVybiBjb2RlID09PSA5NTtcbiAgICBpZiAoY29kZSA8IDEyMylyZXR1cm4gdHJ1ZTtcbiAgICByZXR1cm4gY29kZSA+PSAweGFhICYmIG5vbkFTQ0lJaWRlbnRpZmllci50ZXN0KFN0cmluZy5mcm9tQ2hhckNvZGUoY29kZSkpO1xuICB9O1xuXG4gIC8vICMjIFRva2VuaXplclxuXG4gIC8vIFRoZXNlIGFyZSB1c2VkIHdoZW4gYG9wdGlvbnMubG9jYXRpb25zYCBpcyBvbiwgZm9yIHRoZVxuICAvLyBgdG9rU3RhcnRMb2NgIGFuZCBgdG9rRW5kTG9jYCBwcm9wZXJ0aWVzLlxuXG4gIGZ1bmN0aW9uIFBvc2l0aW9uKCkge1xuICAgIHRoaXMubGluZSA9IHRva0N1ckxpbmU7XG4gICAgdGhpcy5jb2x1bW4gPSB0b2tQb3MgLSB0b2tMaW5lU3RhcnQ7XG4gIH1cblxuICAvLyBSZXNldCB0aGUgdG9rZW4gc3RhdGUuIFVzZWQgYXQgdGhlIHN0YXJ0IG9mIGEgcGFyc2UuXG5cbiAgZnVuY3Rpb24gaW5pdFRva2VuU3RhdGUoKSB7XG4gICAgdG9rQ3VyTGluZSA9IDE7XG4gICAgdG9rUG9zID0gdG9rTGluZVN0YXJ0ID0gMDtcbiAgICB0b2tSZWdleHBBbGxvd2VkID0gdHJ1ZTtcbiAgICBza2lwU3BhY2UoKTtcbiAgfVxuXG4gIC8vIENhbGxlZCBhdCB0aGUgZW5kIG9mIGV2ZXJ5IHRva2VuLiBTZXRzIGB0b2tFbmRgLCBgdG9rVmFsYCwgYW5kXG4gIC8vIGB0b2tSZWdleHBBbGxvd2VkYCwgYW5kIHNraXBzIHRoZSBzcGFjZSBhZnRlciB0aGUgdG9rZW4sIHNvIHRoYXRcbiAgLy8gdGhlIG5leHQgb25lJ3MgYHRva1N0YXJ0YCB3aWxsIHBvaW50IGF0IHRoZSByaWdodCBwb3NpdGlvbi5cblxuICBmdW5jdGlvbiBmaW5pc2hUb2tlbih0eXBlLCB2YWwpIHtcbiAgICB0b2tFbmQgPSB0b2tQb3M7XG4gICAgaWYgKG9wdGlvbnMubG9jYXRpb25zKSB0b2tFbmRMb2MgPSBuZXcgUG9zaXRpb247XG4gICAgdG9rVHlwZSA9IHR5cGU7XG4gICAgc2tpcFNwYWNlKCk7XG4gICAgdG9rVmFsID0gdmFsO1xuICAgIHRva1JlZ2V4cEFsbG93ZWQgPSB0eXBlLmJlZm9yZUV4cHI7XG4gIH1cblxuICBmdW5jdGlvbiBza2lwQmxvY2tDb21tZW50KCkge1xuICAgIHZhciBzdGFydExvYyA9IG9wdGlvbnMub25Db21tZW50ICYmIG9wdGlvbnMubG9jYXRpb25zICYmIG5ldyBQb3NpdGlvbjtcbiAgICB2YXIgc3RhcnQgPSB0b2tQb3MsIGVuZCA9IGlucHV0LmluZGV4T2YoXCIqL1wiLCB0b2tQb3MgKz0gMik7XG4gICAgaWYgKGVuZCA9PT0gLTEpIHJhaXNlKHRva1BvcyAtIDIsIFwiVW50ZXJtaW5hdGVkIGNvbW1lbnRcIik7XG4gICAgdG9rUG9zID0gZW5kICsgMjtcbiAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnMpIHtcbiAgICAgIGxpbmVCcmVhay5sYXN0SW5kZXggPSBzdGFydDtcbiAgICAgIHZhciBtYXRjaDtcbiAgICAgIHdoaWxlICgobWF0Y2ggPSBsaW5lQnJlYWsuZXhlYyhpbnB1dCkpICYmIG1hdGNoLmluZGV4IDwgdG9rUG9zKSB7XG4gICAgICAgICsrdG9rQ3VyTGluZTtcbiAgICAgICAgdG9rTGluZVN0YXJ0ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChvcHRpb25zLm9uQ29tbWVudClcbiAgICAgIG9wdGlvbnMub25Db21tZW50KHRydWUsIGlucHV0LnNsaWNlKHN0YXJ0ICsgMiwgZW5kKSwgc3RhcnQsIHRva1BvcyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0TG9jLCBvcHRpb25zLmxvY2F0aW9ucyAmJiBuZXcgUG9zaXRpb24pO1xuICB9XG5cbiAgZnVuY3Rpb24gc2tpcExpbmVDb21tZW50KCkge1xuICAgIHZhciBzdGFydCA9IHRva1BvcztcbiAgICB2YXIgc3RhcnRMb2MgPSBvcHRpb25zLm9uQ29tbWVudCAmJiBvcHRpb25zLmxvY2F0aW9ucyAmJiBuZXcgUG9zaXRpb247XG4gICAgdmFyIGNoID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MrPTIpO1xuICAgIHdoaWxlICh0b2tQb3MgPCBpbnB1dExlbiAmJiBjaCAhPT0gMTAgJiYgY2ggIT09IDEzICYmIGNoICE9PSA4MjMyICYmIGNoICE9PSA4MjMzKSB7XG4gICAgICArK3Rva1BvcztcbiAgICAgIGNoID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5vbkNvbW1lbnQpXG4gICAgICBvcHRpb25zLm9uQ29tbWVudChmYWxzZSwgaW5wdXQuc2xpY2Uoc3RhcnQgKyAyLCB0b2tQb3MpLCBzdGFydCwgdG9rUG9zLFxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnRMb2MsIG9wdGlvbnMubG9jYXRpb25zICYmIG5ldyBQb3NpdGlvbik7XG4gIH1cblxuICAvLyBDYWxsZWQgYXQgdGhlIHN0YXJ0IG9mIHRoZSBwYXJzZSBhbmQgYWZ0ZXIgZXZlcnkgdG9rZW4uIFNraXBzXG4gIC8vIHdoaXRlc3BhY2UgYW5kIGNvbW1lbnRzLCBhbmQuXG5cbiAgZnVuY3Rpb24gc2tpcFNwYWNlKCkge1xuICAgIHdoaWxlICh0b2tQb3MgPCBpbnB1dExlbikge1xuICAgICAgdmFyIGNoID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpO1xuICAgICAgaWYgKGNoID09PSAzMikgeyAvLyAnICdcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICB9IGVsc2UgaWYgKGNoID09PSAxMykge1xuICAgICAgICArK3Rva1BvcztcbiAgICAgICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgICAgIGlmIChuZXh0ID09PSAxMCkge1xuICAgICAgICAgICsrdG9rUG9zO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvcHRpb25zLmxvY2F0aW9ucykge1xuICAgICAgICAgICsrdG9rQ3VyTGluZTtcbiAgICAgICAgICB0b2tMaW5lU3RhcnQgPSB0b2tQb3M7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDEwIHx8IGNoID09PSA4MjMyIHx8IGNoID09PSA4MjMzKSB7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnMpIHtcbiAgICAgICAgICArK3Rva0N1ckxpbmU7XG4gICAgICAgICAgdG9rTGluZVN0YXJ0ID0gdG9rUG9zO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGNoID4gOCAmJiBjaCA8IDE0KSB7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gNDcpIHsgLy8gJy8nXG4gICAgICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICAgICAgaWYgKG5leHQgPT09IDQyKSB7IC8vICcqJ1xuICAgICAgICAgIHNraXBCbG9ja0NvbW1lbnQoKTtcbiAgICAgICAgfSBlbHNlIGlmIChuZXh0ID09PSA0NykgeyAvLyAnLydcbiAgICAgICAgICBza2lwTGluZUNvbW1lbnQoKTtcbiAgICAgICAgfSBlbHNlIGJyZWFrO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gMTYwKSB7IC8vICdcXHhhMCdcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICB9IGVsc2UgaWYgKGNoID49IDU3NjAgJiYgbm9uQVNDSUl3aGl0ZXNwYWNlLnRlc3QoU3RyaW5nLmZyb21DaGFyQ29kZShjaCkpKSB7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gIyMjIFRva2VuIHJlYWRpbmdcblxuICAvLyBUaGlzIGlzIHRoZSBmdW5jdGlvbiB0aGF0IGlzIGNhbGxlZCB0byBmZXRjaCB0aGUgbmV4dCB0b2tlbi4gSXRcbiAgLy8gaXMgc29tZXdoYXQgb2JzY3VyZSwgYmVjYXVzZSBpdCB3b3JrcyBpbiBjaGFyYWN0ZXIgY29kZXMgcmF0aGVyXG4gIC8vIHRoYW4gY2hhcmFjdGVycywgYW5kIGJlY2F1c2Ugb3BlcmF0b3IgcGFyc2luZyBoYXMgYmVlbiBpbmxpbmVkXG4gIC8vIGludG8gaXQuXG4gIC8vXG4gIC8vIEFsbCBpbiB0aGUgbmFtZSBvZiBzcGVlZC5cbiAgLy9cbiAgLy8gVGhlIGBmb3JjZVJlZ2V4cGAgcGFyYW1ldGVyIGlzIHVzZWQgaW4gdGhlIG9uZSBjYXNlIHdoZXJlIHRoZVxuICAvLyBgdG9rUmVnZXhwQWxsb3dlZGAgdHJpY2sgZG9lcyBub3Qgd29yay4gU2VlIGBwYXJzZVN0YXRlbWVudGAuXG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX2RvdCgpIHtcbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMSk7XG4gICAgaWYgKG5leHQgPj0gNDggJiYgbmV4dCA8PSA1NykgcmV0dXJuIHJlYWROdW1iZXIodHJ1ZSk7XG4gICAgdmFyIG5leHQyID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAyKTtcbiAgICBpZiAob3B0aW9ucy5lY21hVmVyc2lvbiA+PSA2ICYmIG5leHQgPT09IDQ2ICYmIG5leHQyID09PSA0NikgeyAvLyA0NiA9IGRvdCAnLidcbiAgICAgIHRva1BvcyArPSAzO1xuICAgICAgcmV0dXJuIGZpbmlzaFRva2VuKF9lbGxpcHNpcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICsrdG9rUG9zO1xuICAgICAgcmV0dXJuIGZpbmlzaFRva2VuKF9kb3QpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9zbGFzaCgpIHsgLy8gJy8nXG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmICh0b2tSZWdleHBBbGxvd2VkKSB7Kyt0b2tQb3M7IHJldHVybiByZWFkUmVnZXhwKCk7fVxuICAgIGlmIChuZXh0ID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9hc3NpZ24sIDIpO1xuICAgIHJldHVybiBmaW5pc2hPcChfc2xhc2gsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX211bHRfbW9kdWxvKCkgeyAvLyAnJSonXG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIGlmIChuZXh0ID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9hc3NpZ24sIDIpO1xuICAgIHJldHVybiBmaW5pc2hPcChfbXVsdGlwbHlNb2R1bG8sIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX3BpcGVfYW1wKGNvZGUpIHsgLy8gJ3wmJ1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAobmV4dCA9PT0gY29kZSkgcmV0dXJuIGZpbmlzaE9wKGNvZGUgPT09IDEyNCA/IF9sb2dpY2FsT1IgOiBfbG9naWNhbEFORCwgMik7XG4gICAgaWYgKG5leHQgPT09IDYxKSByZXR1cm4gZmluaXNoT3AoX2Fzc2lnbiwgMik7XG4gICAgcmV0dXJuIGZpbmlzaE9wKGNvZGUgPT09IDEyNCA/IF9iaXR3aXNlT1IgOiBfYml0d2lzZUFORCwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fY2FyZXQoKSB7IC8vICdeJ1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCAyKTtcbiAgICByZXR1cm4gZmluaXNoT3AoX2JpdHdpc2VYT1IsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gcmVhZFRva2VuX3BsdXNfbWluKGNvZGUpIHsgLy8gJystJ1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAobmV4dCA9PT0gY29kZSkge1xuICAgICAgaWYgKG5leHQgPT0gNDUgJiYgaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAyKSA9PSA2MiAmJlxuICAgICAgICAgIG5ld2xpbmUudGVzdChpbnB1dC5zbGljZShsYXN0RW5kLCB0b2tQb3MpKSkge1xuICAgICAgICAvLyBBIGAtLT5gIGxpbmUgY29tbWVudFxuICAgICAgICB0b2tQb3MgKz0gMztcbiAgICAgICAgc2tpcExpbmVDb21tZW50KCk7XG4gICAgICAgIHNraXBTcGFjZSgpO1xuICAgICAgICByZXR1cm4gcmVhZFRva2VuKCk7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmluaXNoT3AoX2luY0RlYywgMik7XG4gICAgfVxuICAgIGlmIChuZXh0ID09PSA2MSkgcmV0dXJuIGZpbmlzaE9wKF9hc3NpZ24sIDIpO1xuICAgIHJldHVybiBmaW5pc2hPcChfcGx1c01pbiwgMSk7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW5fbHRfZ3QoY29kZSkgeyAvLyAnPD4nXG4gICAgdmFyIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDEpO1xuICAgIHZhciBzaXplID0gMTtcbiAgICBpZiAobmV4dCA9PT0gY29kZSkge1xuICAgICAgc2l6ZSA9IGNvZGUgPT09IDYyICYmIGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMikgPT09IDYyID8gMyA6IDI7XG4gICAgICBpZiAoaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyBzaXplKSA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfYXNzaWduLCBzaXplICsgMSk7XG4gICAgICByZXR1cm4gZmluaXNoT3AoX2JpdFNoaWZ0LCBzaXplKTtcbiAgICB9XG4gICAgaWYgKG5leHQgPT0gMzMgJiYgY29kZSA9PSA2MCAmJiBpbnB1dC5jaGFyQ29kZUF0KHRva1BvcyArIDIpID09IDQ1ICYmXG4gICAgICAgIGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMykgPT0gNDUpIHtcbiAgICAgIC8vIGA8IS0tYCwgYW4gWE1MLXN0eWxlIGNvbW1lbnQgdGhhdCBzaG91bGQgYmUgaW50ZXJwcmV0ZWQgYXMgYSBsaW5lIGNvbW1lbnRcbiAgICAgIHRva1BvcyArPSA0O1xuICAgICAgc2tpcExpbmVDb21tZW50KCk7XG4gICAgICBza2lwU3BhY2UoKTtcbiAgICAgIHJldHVybiByZWFkVG9rZW4oKTtcbiAgICB9XG4gICAgaWYgKG5leHQgPT09IDYxKVxuICAgICAgc2l6ZSA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMikgPT09IDYxID8gMyA6IDI7XG4gICAgcmV0dXJuIGZpbmlzaE9wKF9yZWxhdGlvbmFsLCBzaXplKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRUb2tlbl9lcV9leGNsKGNvZGUpIHsgLy8gJz0hJ1xuICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICBpZiAobmV4dCA9PT0gNjEpIHJldHVybiBmaW5pc2hPcChfZXF1YWxpdHksIGlucHV0LmNoYXJDb2RlQXQodG9rUG9zICsgMikgPT09IDYxID8gMyA6IDIpO1xuICAgIHJldHVybiBmaW5pc2hPcChjb2RlID09PSA2MSA/IF9lcSA6IF9wcmVmaXgsIDEpO1xuICB9XG5cbiAgZnVuY3Rpb24gZ2V0VG9rZW5Gcm9tQ29kZShjb2RlKSB7XG4gICAgc3dpdGNoKGNvZGUpIHtcbiAgICAgIC8vIFRoZSBpbnRlcnByZXRhdGlvbiBvZiBhIGRvdCBkZXBlbmRzIG9uIHdoZXRoZXIgaXQgaXMgZm9sbG93ZWRcbiAgICAgIC8vIGJ5IGEgZGlnaXQgb3IgYW5vdGhlciB0d28gZG90cy5cbiAgICBjYXNlIDQ2OiAvLyAnLidcbiAgICAgIHJldHVybiByZWFkVG9rZW5fZG90KCk7XG5cbiAgICAgIC8vIFB1bmN0dWF0aW9uIHRva2Vucy5cbiAgICBjYXNlIDQwOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9wYXJlbkwpO1xuICAgIGNhc2UgNDE6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX3BhcmVuUik7XG4gICAgY2FzZSA1OTogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfc2VtaSk7XG4gICAgY2FzZSA0NDogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfY29tbWEpO1xuICAgIGNhc2UgOTE6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX2JyYWNrZXRMKTtcbiAgICBjYXNlIDkzOiArK3Rva1BvczsgcmV0dXJuIGZpbmlzaFRva2VuKF9icmFja2V0Uik7XG4gICAgY2FzZSAxMjM6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX2JyYWNlTCk7XG4gICAgY2FzZSAxMjU6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX2JyYWNlUik7XG4gICAgY2FzZSA1ODogKyt0b2tQb3M7IHJldHVybiBmaW5pc2hUb2tlbihfY29sb24pO1xuICAgIGNhc2UgNjM6ICsrdG9rUG9zOyByZXR1cm4gZmluaXNoVG9rZW4oX3F1ZXN0aW9uKTtcblxuICAgICAgLy8gJzB4JyBpcyBhIGhleGFkZWNpbWFsIG51bWJlci5cbiAgICBjYXNlIDQ4OiAvLyAnMCdcbiAgICAgIHZhciBuZXh0ID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MgKyAxKTtcbiAgICAgIGlmIChuZXh0ID09PSAxMjAgfHwgbmV4dCA9PT0gODgpIHJldHVybiByZWFkSGV4TnVtYmVyKCk7XG4gICAgICAvLyBBbnl0aGluZyBlbHNlIGJlZ2lubmluZyB3aXRoIGEgZGlnaXQgaXMgYW4gaW50ZWdlciwgb2N0YWxcbiAgICAgIC8vIG51bWJlciwgb3IgZmxvYXQuXG4gICAgLyogZmFsbHMgdGhyb3VnaCAqL1xuICAgIGNhc2UgNDk6IGNhc2UgNTA6IGNhc2UgNTE6IGNhc2UgNTI6IGNhc2UgNTM6IGNhc2UgNTQ6IGNhc2UgNTU6IGNhc2UgNTY6IGNhc2UgNTc6IC8vIDEtOVxuICAgICAgcmV0dXJuIHJlYWROdW1iZXIoZmFsc2UpO1xuXG4gICAgICAvLyBRdW90ZXMgcHJvZHVjZSBzdHJpbmdzLlxuICAgIGNhc2UgMzQ6IGNhc2UgMzk6IC8vICdcIicsIFwiJ1wiXG4gICAgICByZXR1cm4gcmVhZFN0cmluZyhjb2RlKTtcblxuICAgIC8vIE9wZXJhdG9ycyBhcmUgcGFyc2VkIGlubGluZSBpbiB0aW55IHN0YXRlIG1hY2hpbmVzLiAnPScgKDYxKSBpc1xuICAgIC8vIG9mdGVuIHJlZmVycmVkIHRvLiBgZmluaXNoT3BgIHNpbXBseSBza2lwcyB0aGUgYW1vdW50IG9mXG4gICAgLy8gY2hhcmFjdGVycyBpdCBpcyBnaXZlbiBhcyBzZWNvbmQgYXJndW1lbnQsIGFuZCByZXR1cm5zIGEgdG9rZW5cbiAgICAvLyBvZiB0aGUgdHlwZSBnaXZlbiBieSBpdHMgZmlyc3QgYXJndW1lbnQuXG5cbiAgICBjYXNlIDQ3OiAvLyAnLydcbiAgICAgIHJldHVybiByZWFkVG9rZW5fc2xhc2goKTtcblxuICAgIGNhc2UgMzc6IGNhc2UgNDI6IC8vICclKidcbiAgICAgIHJldHVybiByZWFkVG9rZW5fbXVsdF9tb2R1bG8oKTtcblxuICAgIGNhc2UgMTI0OiBjYXNlIDM4OiAvLyAnfCYnXG4gICAgICByZXR1cm4gcmVhZFRva2VuX3BpcGVfYW1wKGNvZGUpO1xuXG4gICAgY2FzZSA5NDogLy8gJ14nXG4gICAgICByZXR1cm4gcmVhZFRva2VuX2NhcmV0KCk7XG5cbiAgICBjYXNlIDQzOiBjYXNlIDQ1OiAvLyAnKy0nXG4gICAgICByZXR1cm4gcmVhZFRva2VuX3BsdXNfbWluKGNvZGUpO1xuXG4gICAgY2FzZSA2MDogY2FzZSA2MjogLy8gJzw+J1xuICAgICAgcmV0dXJuIHJlYWRUb2tlbl9sdF9ndChjb2RlKTtcblxuICAgIGNhc2UgNjE6IGNhc2UgMzM6IC8vICc9ISdcbiAgICAgIHJldHVybiByZWFkVG9rZW5fZXFfZXhjbChjb2RlKTtcblxuICAgIGNhc2UgMTI2OiAvLyAnfidcbiAgICAgIHJldHVybiBmaW5pc2hPcChfcHJlZml4LCAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkVG9rZW4oZm9yY2VSZWdleHApIHtcbiAgICBpZiAoIWZvcmNlUmVnZXhwKSB0b2tTdGFydCA9IHRva1BvcztcbiAgICBlbHNlIHRva1BvcyA9IHRva1N0YXJ0ICsgMTtcbiAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnMpIHRva1N0YXJ0TG9jID0gbmV3IFBvc2l0aW9uO1xuICAgIGlmIChmb3JjZVJlZ2V4cCkgcmV0dXJuIHJlYWRSZWdleHAoKTtcbiAgICBpZiAodG9rUG9zID49IGlucHV0TGVuKSByZXR1cm4gZmluaXNoVG9rZW4oX2VvZik7XG5cbiAgICB2YXIgY29kZSA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICAvLyBJZGVudGlmaWVyIG9yIGtleXdvcmQuICdcXHVYWFhYJyBzZXF1ZW5jZXMgYXJlIGFsbG93ZWQgaW5cbiAgICAvLyBpZGVudGlmaWVycywgc28gJ1xcJyBhbHNvIGRpc3BhdGNoZXMgdG8gdGhhdC5cbiAgICBpZiAoaXNJZGVudGlmaWVyU3RhcnQoY29kZSkgfHwgY29kZSA9PT0gOTIgLyogJ1xcJyAqLykgcmV0dXJuIHJlYWRXb3JkKCk7XG5cbiAgICB2YXIgdG9rID0gZ2V0VG9rZW5Gcm9tQ29kZShjb2RlKTtcblxuICAgIGlmICh0b2sgPT09IGZhbHNlKSB7XG4gICAgICAvLyBJZiB3ZSBhcmUgaGVyZSwgd2UgZWl0aGVyIGZvdW5kIGEgbm9uLUFTQ0lJIGlkZW50aWZpZXJcbiAgICAgIC8vIGNoYXJhY3Rlciwgb3Igc29tZXRoaW5nIHRoYXQncyBlbnRpcmVseSBkaXNhbGxvd2VkLlxuICAgICAgdmFyIGNoID0gU3RyaW5nLmZyb21DaGFyQ29kZShjb2RlKTtcbiAgICAgIGlmIChjaCA9PT0gXCJcXFxcXCIgfHwgbm9uQVNDSUlpZGVudGlmaWVyU3RhcnQudGVzdChjaCkpIHJldHVybiByZWFkV29yZCgpO1xuICAgICAgcmFpc2UodG9rUG9zLCBcIlVuZXhwZWN0ZWQgY2hhcmFjdGVyICdcIiArIGNoICsgXCInXCIpO1xuICAgIH1cbiAgICByZXR1cm4gdG9rO1xuICB9XG5cbiAgZnVuY3Rpb24gZmluaXNoT3AodHlwZSwgc2l6ZSkge1xuICAgIHZhciBzdHIgPSBpbnB1dC5zbGljZSh0b2tQb3MsIHRva1BvcyArIHNpemUpO1xuICAgIHRva1BvcyArPSBzaXplO1xuICAgIGZpbmlzaFRva2VuKHR5cGUsIHN0cik7XG4gIH1cblxuICAvLyBQYXJzZSBhIHJlZ3VsYXIgZXhwcmVzc2lvbi4gU29tZSBjb250ZXh0LWF3YXJlbmVzcyBpcyBuZWNlc3NhcnksXG4gIC8vIHNpbmNlIGEgJy8nIGluc2lkZSBhICdbXScgc2V0IGRvZXMgbm90IGVuZCB0aGUgZXhwcmVzc2lvbi5cblxuICBmdW5jdGlvbiByZWFkUmVnZXhwKCkge1xuICAgIHZhciBjb250ZW50ID0gXCJcIiwgZXNjYXBlZCwgaW5DbGFzcywgc3RhcnQgPSB0b2tQb3M7XG4gICAgZm9yICg7Oykge1xuICAgICAgaWYgKHRva1BvcyA+PSBpbnB1dExlbikgcmFpc2Uoc3RhcnQsIFwiVW50ZXJtaW5hdGVkIHJlZ3VsYXIgZXhwcmVzc2lvblwiKTtcbiAgICAgIHZhciBjaCA9IGlucHV0LmNoYXJBdCh0b2tQb3MpO1xuICAgICAgaWYgKG5ld2xpbmUudGVzdChjaCkpIHJhaXNlKHN0YXJ0LCBcIlVudGVybWluYXRlZCByZWd1bGFyIGV4cHJlc3Npb25cIik7XG4gICAgICBpZiAoIWVzY2FwZWQpIHtcbiAgICAgICAgaWYgKGNoID09PSBcIltcIikgaW5DbGFzcyA9IHRydWU7XG4gICAgICAgIGVsc2UgaWYgKGNoID09PSBcIl1cIiAmJiBpbkNsYXNzKSBpbkNsYXNzID0gZmFsc2U7XG4gICAgICAgIGVsc2UgaWYgKGNoID09PSBcIi9cIiAmJiAhaW5DbGFzcykgYnJlYWs7XG4gICAgICAgIGVzY2FwZWQgPSBjaCA9PT0gXCJcXFxcXCI7XG4gICAgICB9IGVsc2UgZXNjYXBlZCA9IGZhbHNlO1xuICAgICAgKyt0b2tQb3M7XG4gICAgfVxuICAgIHZhciBjb250ZW50ID0gaW5wdXQuc2xpY2Uoc3RhcnQsIHRva1Bvcyk7XG4gICAgKyt0b2tQb3M7XG4gICAgLy8gTmVlZCB0byB1c2UgYHJlYWRXb3JkMWAgYmVjYXVzZSAnXFx1WFhYWCcgc2VxdWVuY2VzIGFyZSBhbGxvd2VkXG4gICAgLy8gaGVyZSAoZG9uJ3QgYXNrKS5cbiAgICB2YXIgbW9kcyA9IHJlYWRXb3JkMSgpO1xuICAgIGlmIChtb2RzICYmICEvXltnbXNpeV0qJC8udGVzdChtb2RzKSkgcmFpc2Uoc3RhcnQsIFwiSW52YWxpZCByZWd1bGFyIGV4cHJlc3Npb24gZmxhZ1wiKTtcbiAgICB0cnkge1xuICAgICAgdmFyIHZhbHVlID0gbmV3IFJlZ0V4cChjb250ZW50LCBtb2RzKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBpZiAoZSBpbnN0YW5jZW9mIFN5bnRheEVycm9yKSByYWlzZShzdGFydCwgXCJFcnJvciBwYXJzaW5nIHJlZ3VsYXIgZXhwcmVzc2lvbjogXCIgKyBlLm1lc3NhZ2UpO1xuICAgICAgcmFpc2UoZSk7XG4gICAgfVxuICAgIHJldHVybiBmaW5pc2hUb2tlbihfcmVnZXhwLCB2YWx1ZSk7XG4gIH1cblxuICAvLyBSZWFkIGFuIGludGVnZXIgaW4gdGhlIGdpdmVuIHJhZGl4LiBSZXR1cm4gbnVsbCBpZiB6ZXJvIGRpZ2l0c1xuICAvLyB3ZXJlIHJlYWQsIHRoZSBpbnRlZ2VyIHZhbHVlIG90aGVyd2lzZS4gV2hlbiBgbGVuYCBpcyBnaXZlbiwgdGhpc1xuICAvLyB3aWxsIHJldHVybiBgbnVsbGAgdW5sZXNzIHRoZSBpbnRlZ2VyIGhhcyBleGFjdGx5IGBsZW5gIGRpZ2l0cy5cblxuICBmdW5jdGlvbiByZWFkSW50KHJhZGl4LCBsZW4pIHtcbiAgICB2YXIgc3RhcnQgPSB0b2tQb3MsIHRvdGFsID0gMDtcbiAgICBmb3IgKHZhciBpID0gMCwgZSA9IGxlbiA9PSBudWxsID8gSW5maW5pdHkgOiBsZW47IGkgPCBlOyArK2kpIHtcbiAgICAgIHZhciBjb2RlID0gaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpLCB2YWw7XG4gICAgICBpZiAoY29kZSA+PSA5NykgdmFsID0gY29kZSAtIDk3ICsgMTA7IC8vIGFcbiAgICAgIGVsc2UgaWYgKGNvZGUgPj0gNjUpIHZhbCA9IGNvZGUgLSA2NSArIDEwOyAvLyBBXG4gICAgICBlbHNlIGlmIChjb2RlID49IDQ4ICYmIGNvZGUgPD0gNTcpIHZhbCA9IGNvZGUgLSA0ODsgLy8gMC05XG4gICAgICBlbHNlIHZhbCA9IEluZmluaXR5O1xuICAgICAgaWYgKHZhbCA+PSByYWRpeCkgYnJlYWs7XG4gICAgICArK3Rva1BvcztcbiAgICAgIHRvdGFsID0gdG90YWwgKiByYWRpeCArIHZhbDtcbiAgICB9XG4gICAgaWYgKHRva1BvcyA9PT0gc3RhcnQgfHwgbGVuICE9IG51bGwgJiYgdG9rUG9zIC0gc3RhcnQgIT09IGxlbikgcmV0dXJuIG51bGw7XG5cbiAgICByZXR1cm4gdG90YWw7XG4gIH1cblxuICBmdW5jdGlvbiByZWFkSGV4TnVtYmVyKCkge1xuICAgIHRva1BvcyArPSAyOyAvLyAweFxuICAgIHZhciB2YWwgPSByZWFkSW50KDE2KTtcbiAgICBpZiAodmFsID09IG51bGwpIHJhaXNlKHRva1N0YXJ0ICsgMiwgXCJFeHBlY3RlZCBoZXhhZGVjaW1hbCBudW1iZXJcIik7XG4gICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKSkpIHJhaXNlKHRva1BvcywgXCJJZGVudGlmaWVyIGRpcmVjdGx5IGFmdGVyIG51bWJlclwiKTtcbiAgICByZXR1cm4gZmluaXNoVG9rZW4oX251bSwgdmFsKTtcbiAgfVxuXG4gIC8vIFJlYWQgYW4gaW50ZWdlciwgb2N0YWwgaW50ZWdlciwgb3IgZmxvYXRpbmctcG9pbnQgbnVtYmVyLlxuXG4gIGZ1bmN0aW9uIHJlYWROdW1iZXIoc3RhcnRzV2l0aERvdCkge1xuICAgIHZhciBzdGFydCA9IHRva1BvcywgaXNGbG9hdCA9IGZhbHNlLCBvY3RhbCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKSA9PT0gNDg7XG4gICAgaWYgKCFzdGFydHNXaXRoRG90ICYmIHJlYWRJbnQoMTApID09PSBudWxsKSByYWlzZShzdGFydCwgXCJJbnZhbGlkIG51bWJlclwiKTtcbiAgICBpZiAoaW5wdXQuY2hhckNvZGVBdCh0b2tQb3MpID09PSA0Nikge1xuICAgICAgKyt0b2tQb3M7XG4gICAgICByZWFkSW50KDEwKTtcbiAgICAgIGlzRmxvYXQgPSB0cnVlO1xuICAgIH1cbiAgICB2YXIgbmV4dCA9IGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKTtcbiAgICBpZiAobmV4dCA9PT0gNjkgfHwgbmV4dCA9PT0gMTAxKSB7IC8vICdlRSdcbiAgICAgIG5leHQgPSBpbnB1dC5jaGFyQ29kZUF0KCsrdG9rUG9zKTtcbiAgICAgIGlmIChuZXh0ID09PSA0MyB8fCBuZXh0ID09PSA0NSkgKyt0b2tQb3M7IC8vICcrLSdcbiAgICAgIGlmIChyZWFkSW50KDEwKSA9PT0gbnVsbCkgcmFpc2Uoc3RhcnQsIFwiSW52YWxpZCBudW1iZXJcIik7XG4gICAgICBpc0Zsb2F0ID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGlzSWRlbnRpZmllclN0YXJ0KGlucHV0LmNoYXJDb2RlQXQodG9rUG9zKSkpIHJhaXNlKHRva1BvcywgXCJJZGVudGlmaWVyIGRpcmVjdGx5IGFmdGVyIG51bWJlclwiKTtcblxuICAgIHZhciBzdHIgPSBpbnB1dC5zbGljZShzdGFydCwgdG9rUG9zKSwgdmFsO1xuICAgIGlmIChpc0Zsb2F0KSB2YWwgPSBwYXJzZUZsb2F0KHN0cik7XG4gICAgZWxzZSBpZiAoIW9jdGFsIHx8IHN0ci5sZW5ndGggPT09IDEpIHZhbCA9IHBhcnNlSW50KHN0ciwgMTApO1xuICAgIGVsc2UgaWYgKC9bODldLy50ZXN0KHN0cikgfHwgc3RyaWN0KSByYWlzZShzdGFydCwgXCJJbnZhbGlkIG51bWJlclwiKTtcbiAgICBlbHNlIHZhbCA9IHBhcnNlSW50KHN0ciwgOCk7XG4gICAgcmV0dXJuIGZpbmlzaFRva2VuKF9udW0sIHZhbCk7XG4gIH1cblxuICAvLyBSZWFkIGEgc3RyaW5nIHZhbHVlLCBpbnRlcnByZXRpbmcgYmFja3NsYXNoLWVzY2FwZXMuXG5cbiAgZnVuY3Rpb24gcmVhZFN0cmluZyhxdW90ZSkge1xuICAgIHRva1BvcysrO1xuICAgIHZhciBvdXQgPSBcIlwiO1xuICAgIGZvciAoOzspIHtcbiAgICAgIGlmICh0b2tQb3MgPj0gaW5wdXRMZW4pIHJhaXNlKHRva1N0YXJ0LCBcIlVudGVybWluYXRlZCBzdHJpbmcgY29uc3RhbnRcIik7XG4gICAgICB2YXIgY2ggPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgICBpZiAoY2ggPT09IHF1b3RlKSB7XG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgICByZXR1cm4gZmluaXNoVG9rZW4oX3N0cmluZywgb3V0KTtcbiAgICAgIH1cbiAgICAgIGlmIChjaCA9PT0gOTIpIHsgLy8gJ1xcJ1xuICAgICAgICBjaCA9IGlucHV0LmNoYXJDb2RlQXQoKyt0b2tQb3MpO1xuICAgICAgICB2YXIgb2N0YWwgPSAvXlswLTddKy8uZXhlYyhpbnB1dC5zbGljZSh0b2tQb3MsIHRva1BvcyArIDMpKTtcbiAgICAgICAgaWYgKG9jdGFsKSBvY3RhbCA9IG9jdGFsWzBdO1xuICAgICAgICB3aGlsZSAob2N0YWwgJiYgcGFyc2VJbnQob2N0YWwsIDgpID4gMjU1KSBvY3RhbCA9IG9jdGFsLnNsaWNlKDAsIC0xKTtcbiAgICAgICAgaWYgKG9jdGFsID09PSBcIjBcIikgb2N0YWwgPSBudWxsO1xuICAgICAgICArK3Rva1BvcztcbiAgICAgICAgaWYgKG9jdGFsKSB7XG4gICAgICAgICAgaWYgKHN0cmljdCkgcmFpc2UodG9rUG9zIC0gMiwgXCJPY3RhbCBsaXRlcmFsIGluIHN0cmljdCBtb2RlXCIpO1xuICAgICAgICAgIG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHBhcnNlSW50KG9jdGFsLCA4KSk7XG4gICAgICAgICAgdG9rUG9zICs9IG9jdGFsLmxlbmd0aCAtIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3dpdGNoIChjaCkge1xuICAgICAgICAgIGNhc2UgMTEwOiBvdXQgKz0gXCJcXG5cIjsgYnJlYWs7IC8vICduJyAtPiAnXFxuJ1xuICAgICAgICAgIGNhc2UgMTE0OiBvdXQgKz0gXCJcXHJcIjsgYnJlYWs7IC8vICdyJyAtPiAnXFxyJ1xuICAgICAgICAgIGNhc2UgMTIwOiBvdXQgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShyZWFkSGV4Q2hhcigyKSk7IGJyZWFrOyAvLyAneCdcbiAgICAgICAgICBjYXNlIDExNzogb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUocmVhZEhleENoYXIoNCkpOyBicmVhazsgLy8gJ3UnXG4gICAgICAgICAgY2FzZSA4NTogb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUocmVhZEhleENoYXIoOCkpOyBicmVhazsgLy8gJ1UnXG4gICAgICAgICAgY2FzZSAxMTY6IG91dCArPSBcIlxcdFwiOyBicmVhazsgLy8gJ3QnIC0+ICdcXHQnXG4gICAgICAgICAgY2FzZSA5ODogb3V0ICs9IFwiXFxiXCI7IGJyZWFrOyAvLyAnYicgLT4gJ1xcYidcbiAgICAgICAgICBjYXNlIDExODogb3V0ICs9IFwiXFx1MDAwYlwiOyBicmVhazsgLy8gJ3YnIC0+ICdcXHUwMDBiJ1xuICAgICAgICAgIGNhc2UgMTAyOiBvdXQgKz0gXCJcXGZcIjsgYnJlYWs7IC8vICdmJyAtPiAnXFxmJ1xuICAgICAgICAgIGNhc2UgNDg6IG91dCArPSBcIlxcMFwiOyBicmVhazsgLy8gMCAtPiAnXFwwJ1xuICAgICAgICAgIGNhc2UgMTM6IGlmIChpbnB1dC5jaGFyQ29kZUF0KHRva1BvcykgPT09IDEwKSArK3Rva1BvczsgLy8gJ1xcclxcbidcbiAgICAgICAgICAvKiBmYWxscyB0aHJvdWdoICovXG4gICAgICAgICAgY2FzZSAxMDogLy8gJyBcXG4nXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5sb2NhdGlvbnMpIHsgdG9rTGluZVN0YXJ0ID0gdG9rUG9zOyArK3Rva0N1ckxpbmU7IH1cbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6IG91dCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGNoKTsgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAoY2ggPT09IDEzIHx8IGNoID09PSAxMCB8fCBjaCA9PT0gODIzMiB8fCBjaCA9PT0gODIzMykgcmFpc2UodG9rU3RhcnQsIFwiVW50ZXJtaW5hdGVkIHN0cmluZyBjb25zdGFudFwiKTtcbiAgICAgICAgb3V0ICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoY2gpOyAvLyAnXFwnXG4gICAgICAgICsrdG9rUG9zO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8vIFVzZWQgdG8gcmVhZCBjaGFyYWN0ZXIgZXNjYXBlIHNlcXVlbmNlcyAoJ1xceCcsICdcXHUnLCAnXFxVJykuXG5cbiAgZnVuY3Rpb24gcmVhZEhleENoYXIobGVuKSB7XG4gICAgdmFyIG4gPSByZWFkSW50KDE2LCBsZW4pO1xuICAgIGlmIChuID09PSBudWxsKSByYWlzZSh0b2tTdGFydCwgXCJCYWQgY2hhcmFjdGVyIGVzY2FwZSBzZXF1ZW5jZVwiKTtcbiAgICByZXR1cm4gbjtcbiAgfVxuXG4gIC8vIFVzZWQgdG8gc2lnbmFsIHRvIGNhbGxlcnMgb2YgYHJlYWRXb3JkMWAgd2hldGhlciB0aGUgd29yZFxuICAvLyBjb250YWluZWQgYW55IGVzY2FwZSBzZXF1ZW5jZXMuIFRoaXMgaXMgbmVlZGVkIGJlY2F1c2Ugd29yZHMgd2l0aFxuICAvLyBlc2NhcGUgc2VxdWVuY2VzIG11c3Qgbm90IGJlIGludGVycHJldGVkIGFzIGtleXdvcmRzLlxuXG4gIHZhciBjb250YWluc0VzYztcblxuICAvLyBSZWFkIGFuIGlkZW50aWZpZXIsIGFuZCByZXR1cm4gaXQgYXMgYSBzdHJpbmcuIFNldHMgYGNvbnRhaW5zRXNjYFxuICAvLyB0byB3aGV0aGVyIHRoZSB3b3JkIGNvbnRhaW5lZCBhICdcXHUnIGVzY2FwZS5cbiAgLy9cbiAgLy8gT25seSBidWlsZHMgdXAgdGhlIHdvcmQgY2hhcmFjdGVyLWJ5LWNoYXJhY3RlciB3aGVuIGl0IGFjdHVhbGx5XG4gIC8vIGNvbnRhaW5lZHMgYW4gZXNjYXBlLCBhcyBhIG1pY3JvLW9wdGltaXphdGlvbi5cblxuICBmdW5jdGlvbiByZWFkV29yZDEoKSB7XG4gICAgY29udGFpbnNFc2MgPSBmYWxzZTtcbiAgICB2YXIgd29yZCwgZmlyc3QgPSB0cnVlLCBzdGFydCA9IHRva1BvcztcbiAgICBmb3IgKDs7KSB7XG4gICAgICB2YXIgY2ggPSBpbnB1dC5jaGFyQ29kZUF0KHRva1Bvcyk7XG4gICAgICBpZiAoaXNJZGVudGlmaWVyQ2hhcihjaCkpIHtcbiAgICAgICAgaWYgKGNvbnRhaW5zRXNjKSB3b3JkICs9IGlucHV0LmNoYXJBdCh0b2tQb3MpO1xuICAgICAgICArK3Rva1BvcztcbiAgICAgIH0gZWxzZSBpZiAoY2ggPT09IDkyKSB7IC8vIFwiXFxcIlxuICAgICAgICBpZiAoIWNvbnRhaW5zRXNjKSB3b3JkID0gaW5wdXQuc2xpY2Uoc3RhcnQsIHRva1Bvcyk7XG4gICAgICAgIGNvbnRhaW5zRXNjID0gdHJ1ZTtcbiAgICAgICAgaWYgKGlucHV0LmNoYXJDb2RlQXQoKyt0b2tQb3MpICE9IDExNykgLy8gXCJ1XCJcbiAgICAgICAgICByYWlzZSh0b2tQb3MsIFwiRXhwZWN0aW5nIFVuaWNvZGUgZXNjYXBlIHNlcXVlbmNlIFxcXFx1WFhYWFwiKTtcbiAgICAgICAgKyt0b2tQb3M7XG4gICAgICAgIHZhciBlc2MgPSByZWFkSGV4Q2hhcig0KTtcbiAgICAgICAgdmFyIGVzY1N0ciA9IFN0cmluZy5mcm9tQ2hhckNvZGUoZXNjKTtcbiAgICAgICAgaWYgKCFlc2NTdHIpIHJhaXNlKHRva1BvcyAtIDEsIFwiSW52YWxpZCBVbmljb2RlIGVzY2FwZVwiKTtcbiAgICAgICAgaWYgKCEoZmlyc3QgPyBpc0lkZW50aWZpZXJTdGFydChlc2MpIDogaXNJZGVudGlmaWVyQ2hhcihlc2MpKSlcbiAgICAgICAgICByYWlzZSh0b2tQb3MgLSA0LCBcIkludmFsaWQgVW5pY29kZSBlc2NhcGVcIik7XG4gICAgICAgIHdvcmQgKz0gZXNjU3RyO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBmaXJzdCA9IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gY29udGFpbnNFc2MgPyB3b3JkIDogaW5wdXQuc2xpY2Uoc3RhcnQsIHRva1Bvcyk7XG4gIH1cblxuICAvLyBSZWFkIGFuIGlkZW50aWZpZXIgb3Iga2V5d29yZCB0b2tlbi4gV2lsbCBjaGVjayBmb3IgcmVzZXJ2ZWRcbiAgLy8gd29yZHMgd2hlbiBuZWNlc3NhcnkuXG5cbiAgZnVuY3Rpb24gcmVhZFdvcmQoKSB7XG4gICAgdmFyIHdvcmQgPSByZWFkV29yZDEoKTtcbiAgICB2YXIgdHlwZSA9IF9uYW1lO1xuICAgIGlmICghY29udGFpbnNFc2MgJiYgaXNLZXl3b3JkKHdvcmQpKVxuICAgICAgdHlwZSA9IGtleXdvcmRUeXBlc1t3b3JkXTtcbiAgICByZXR1cm4gZmluaXNoVG9rZW4odHlwZSwgd29yZCk7XG4gIH1cblxuXG5leHBvcnQgZGVmYXVsdCB7IHRva2VuaXplOiBleHBvcnRzLnRva2VuaXplIH07IiwiLy8gUmVib3VuZCBIb29rc1xuLy8gLS0tLS0tLS0tLS0tLS0tLVxuXG5pbXBvcnQgTGF6eVZhbHVlIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9sYXp5LXZhbHVlXCI7XG5pbXBvcnQgJCBmcm9tIFwicmVib3VuZC1jb21wb25lbnQvdXRpbHNcIjtcbmltcG9ydCBoZWxwZXJzIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC9oZWxwZXJzXCI7XG5cbnZhciBob29rcyA9IHt9LFxuICAgIGF0dHJpYnV0ZXMgPSB7ICBhYmJyOiAxLCAgICAgIFwiYWNjZXB0LWNoYXJzZXRcIjogMSwgICBhY2NlcHQ6IDEsICAgICAgYWNjZXNza2V5OiAxLCAgICAgYWN0aW9uOiAxLFxuICAgICAgICAgICAgICAgICAgICBhbGlnbjogMSwgICAgICBhbGluazogMSwgICAgICAgICAgICAgYWx0OiAxLCAgICAgICAgIGFyY2hpdmU6IDEsICAgICAgIGF4aXM6IDEsXG4gICAgICAgICAgICAgICAgICAgIGJhY2tncm91bmQ6IDEsIGJnY29sb3I6IDEsICAgICAgICAgICBib3JkZXI6IDEsICAgICAgY2VsbHBhZGRpbmc6IDEsICAgY2VsbHNwYWNpbmc6IDEsXG4gICAgICAgICAgICAgICAgICAgIGNoYXI6IDEsICAgICAgIGNoYXJvZmY6IDEsICAgICAgICAgICBjaGFyc2V0OiAxLCAgICAgY2hlY2tlZDogMSwgICAgICAgY2l0ZTogMSxcbiAgICAgICAgICAgICAgICAgICAgY2xhc3M6IDEsICAgICAgY2xhc3NpZDogMSwgICAgICAgICAgIGNsZWFyOiAxLCAgICAgICBjb2RlOiAxLCAgICAgICAgICBjb2RlYmFzZTogMSxcbiAgICAgICAgICAgICAgICAgICAgY29kZXR5cGU6IDEsICAgY29sb3I6IDEsICAgICAgICAgICAgIGNvbHM6IDEsICAgICAgICBjb2xzcGFuOiAxLCAgICAgICBjb21wYWN0OiAxLFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50OiAxLCAgICBjb29yZHM6IDEsICAgICAgICAgICAgZGF0YTogMSwgICAgICAgIGRhdGV0aW1lOiAxLCAgICAgIGRlY2xhcmU6IDEsXG4gICAgICAgICAgICAgICAgICAgIGRlZmVyOiAxLCAgICAgIGRpcjogMSwgICAgICAgICAgICAgICBkaXNhYmxlZDogMSwgICAgZW5jdHlwZTogMSwgICAgICAgZmFjZTogMSxcbiAgICAgICAgICAgICAgICAgICAgZm9yOiAxLCAgICAgICAgZnJhbWU6IDEsICAgICAgICAgICAgIGZyYW1lYm9yZGVyOiAxLCBoZWFkZXJzOiAxLCAgICAgICBoZWlnaHQ6IDEsXG4gICAgICAgICAgICAgICAgICAgIGhyZWY6IDEsICAgICAgIGhyZWZsYW5nOiAxLCAgICAgICAgICBoc3BhY2U6IDEsICAgICBcImh0dHAtZXF1aXZcIjogMSwgICBpZDogMSxcbiAgICAgICAgICAgICAgICAgICAgaXNtYXA6IDEsICAgICAgbGFiZWw6IDEsICAgICAgICAgICAgIGxhbmc6IDEsICAgICAgICBsYW5ndWFnZTogMSwgICAgICBsaW5rOiAxLFxuICAgICAgICAgICAgICAgICAgICBsb25nZGVzYzogMSwgICBtYXJnaW5oZWlnaHQ6IDEsICAgICAgbWFyZ2lud2lkdGg6IDEsIG1heGxlbmd0aDogMSwgICAgIG1lZGlhOiAxLFxuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6IDEsICAgICBtdWx0aXBsZTogMSwgICAgICAgICAgbmFtZTogMSwgICAgICAgIG5vaHJlZjogMSwgICAgICAgIG5vcmVzaXplOiAxLFxuICAgICAgICAgICAgICAgICAgICBub3NoYWRlOiAxLCAgICBub3dyYXA6IDEsICAgICAgICAgICAgb2JqZWN0OiAxLCAgICAgIG9uYmx1cjogMSwgICAgICAgIG9uY2hhbmdlOiAxLFxuICAgICAgICAgICAgICAgICAgICBvbmNsaWNrOiAxLCAgICBvbmRibGNsaWNrOiAxLCAgICAgICAgb25mb2N1czogMSwgICAgIG9ua2V5ZG93bjogMSwgICAgIG9ua2V5cHJlc3M6IDEsXG4gICAgICAgICAgICAgICAgICAgIG9ua2V5dXA6IDEsICAgIG9ubG9hZDogMSwgICAgICAgICAgICBvbm1vdXNlZG93bjogMSwgb25tb3VzZW1vdmU6IDEsICAgb25tb3VzZW91dDogMSxcbiAgICAgICAgICAgICAgICAgICAgb25tb3VzZW92ZXI6IDEsb25tb3VzZXVwOiAxLCAgICAgICAgIG9ucmVzZXQ6IDEsICAgICBvbnNlbGVjdDogMSwgICAgICBvbnN1Ym1pdDogMSxcbiAgICAgICAgICAgICAgICAgICAgb251bmxvYWQ6IDEsICAgcHJvZmlsZTogMSwgICAgICAgICAgIHByb21wdDogMSwgICAgICByZWFkb25seTogMSwgICAgICByZWw6IDEsXG4gICAgICAgICAgICAgICAgICAgIHJldjogMSwgICAgICAgIHJvd3M6IDEsICAgICAgICAgICAgICByb3dzcGFuOiAxLCAgICAgcnVsZXM6IDEsICAgICAgICAgc2NoZW1lOiAxLFxuICAgICAgICAgICAgICAgICAgICBzY29wZTogMSwgICAgICBzY3JvbGxpbmc6IDEsICAgICAgICAgc2VsZWN0ZWQ6IDEsICAgIHNoYXBlOiAxLCAgICAgICAgIHNpemU6IDEsXG4gICAgICAgICAgICAgICAgICAgIHNwYW46IDEsICAgICAgIHNyYzogMSwgICAgICAgICAgICAgICBzdGFuZGJ5OiAxLCAgICAgc3RhcnQ6IDEsICAgICAgICAgc3R5bGU6IDEsXG4gICAgICAgICAgICAgICAgICAgIHN1bW1hcnk6IDEsICAgIHRhYmluZGV4OiAxLCAgICAgICAgICB0YXJnZXQ6IDEsICAgICAgdGV4dDogMSwgICAgICAgICAgdGl0bGU6IDEsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IDEsICAgICAgIHVzZW1hcDogMSwgICAgICAgICAgICB2YWxpZ246IDEsICAgICAgdmFsdWU6IDEsICAgICAgICAgdmFsdWV0eXBlOiAxLFxuICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uOiAxLCAgICB2bGluazogMSwgICAgICAgICAgICAgdnNwYWNlOiAxLCAgICAgIHdpZHRoOiAxICB9O1xuXG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqXG4gICAgICAgIEhvb2sgVXRpbHNcbioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vLyBHaXZlbiBhbiBvYmplY3QgKGNvbnRleHQpIGFuZCBhIHBhdGgsIGNyZWF0ZSBhIExhenlWYWx1ZSBvYmplY3QgdGhhdCByZXR1cm5zIHRoZSB2YWx1ZSBvZiBvYmplY3QgYXQgY29udGV4dCBhbmQgYWRkIGl0IGFzIGFuIG9ic2VydmVyIG9mIHRoZSBjb250ZXh0LlxuZnVuY3Rpb24gc3RyZWFtUHJvcGVydHkoY29udGV4dCwgcGF0aCkge1xuXG4gIC8vIExhenkgdmFsdWUgdGhhdCByZXR1cm5zIHRoZSB2YWx1ZSBvZiBjb250ZXh0LnBhdGhcbiAgdmFyIGxhenlWYWx1ZSA9IG5ldyBMYXp5VmFsdWUoZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGNvbnRleHQuZ2V0KHBhdGgpO1xuICB9LCB7Y29udGV4dDogY29udGV4dH0pO1xuXG4gIC8vIFNhdmUgb3VyIHBhdGggc28gcGFyZW50IGxhenl2YWx1ZXMgY2FuIGtub3cgdGhlIGRhdGEgdmFyIG9yIGhlbHBlciB0aGV5IGFyZSBnZXR0aW5nIGluZm8gZnJvbVxuICBsYXp5VmFsdWUucGF0aCA9IHBhdGg7XG5cbiAgLy8gU2F2ZSB0aGUgb2JzZXJ2ZXIgYXQgdGhpcyBwYXRoXG4gIGxhenlWYWx1ZS5hZGRPYnNlcnZlcihwYXRoLCBjb250ZXh0KTtcblxuICByZXR1cm4gbGF6eVZhbHVlO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RIZWxwZXIobW9ycGgsIHBhdGgsIGNvbnRleHQsIHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52LCBoZWxwZXIpIHtcbiAgdmFyIGtleTtcbiAgLy8gRXh0ZW5kIG9wdGlvbnMgd2l0aCB0aGUgaGVscGVyJ3MgY29udGFpbmVpbmcgTW9ycGggZWxlbWVudC4gVXNlZCBieSBzdHJlYW1pZnkgdG8gdHJhY2sgZGF0YSBvYnNlcnZlcnNcbiAgb3B0aW9ucy5tb3JwaCA9IG1vcnBoO1xuICBvcHRpb25zLmVsZW1lbnQgPSBtb3JwaDtcbiAgb3B0aW9ucy5wYXRoID0gcGF0aDtcbiAgb3B0aW9ucy5jb250ZXh0ID0gY29udGV4dDtcblxuICAvLyBFbnN1cmUgZW52IGFuZCBibG9jayBwYXJhbXMgZG9uJ3Qgc2hhcmUgbWVtb3J5IHdpdGggb3RoZXIgaGVscGVyc1xuICBlbnYgPSBfLmNsb25lKGVudik7XG4gIGlmKGVudi5ibG9ja1BhcmFtcykgZW52LmJsb2NrUGFyYW1zID0gXy5jbG9uZShlbnYuYmxvY2tQYXJhbXMpO1xuXG4gIC8vIENyZWF0ZSBhIGxhenkgdmFsdWUgdGhhdCByZXR1cm5zIHRoZSB2YWx1ZSBvZiBvdXIgZXZhbHVhdGVkIGhlbHBlci5cbiAgb3B0aW9ucy5sYXp5VmFsdWUgPSBuZXcgTGF6eVZhbHVlKGZ1bmN0aW9uKCl7XG4gICAgdmFyIHBsYWluUGFyYW1zID0gW10sXG4gICAgICAgIHBsYWluSGFzaCA9IHt9O1xuXG4gICAgLy8gQXNzZW1ibGUgb3VyIGFyZ3MgYW5kIGhhc2ggdmFyaWFibGVzLiBGb3IgZWFjaCBsYXp5dmFsdWUgcGFyYW0sIHB1c2ggdGhlIGxhenlWYWx1ZSdzIHZhbHVlIHNvIGhlbHBlcnMgd2l0aCBubyBjb25jZXB0IG9mIGxhenl2YWx1ZXMuXG4gICAgXy5lYWNoKHBhcmFtcywgZnVuY3Rpb24ocGFyYW0sIGluZGV4KXtcbiAgICAgIHBsYWluUGFyYW1zLnB1c2goKCAocGFyYW0gJiYgcGFyYW0uaXNMYXp5VmFsdWUpID8gcGFyYW0udmFsdWUoKSA6IHBhcmFtICkpO1xuICAgIH0pO1xuICAgIF8uZWFjaChoYXNoLCBmdW5jdGlvbihoYXNoLCBrZXkpe1xuICAgICAgcGxhaW5IYXNoW2tleV0gPSAoaGFzaCAmJiBoYXNoLmlzTGF6eVZhbHVlKSA/IGhhc2gudmFsdWUoKSA6IGhhc2g7XG4gICAgfSk7XG5cbiAgICAvLyBDYWxsIG91ciBoZWxwZXIgZnVuY3Rpb25zIHdpdGggb3VyIGFzc2VtYmxlZCBhcmdzLlxuICAgIHJldHVybiBoZWxwZXIuYXBwbHkoKGNvbnRleHQuX19yb290X18gfHwgY29udGV4dCksIFtwbGFpblBhcmFtcywgcGxhaW5IYXNoLCBvcHRpb25zLCBlbnZdKTtcblxuICB9LCB7bW9ycGg6IG9wdGlvbnMubW9ycGh9KTtcblxuICBvcHRpb25zLmxhenlWYWx1ZS5wYXRoID0gcGF0aDtcblxuICAvLyBGb3IgZWFjaCBwYXJhbSBvciBoYXNoIHZhbHVlIHBhc3NlZCB0byBvdXIgaGVscGVyLCBhZGQgaXQgdG8gb3VyIGhlbHBlcidzIGRlcGVuZGFudCBsaXN0LiBIZWxwZXIgd2lsbCByZS1ldmFsdWF0ZSB3aGVuIG9uZSBjaGFuZ2VzLlxuICBwYXJhbXMuZm9yRWFjaChmdW5jdGlvbihwYXJhbSkge1xuICAgIGlmIChwYXJhbSAmJiBwYXJhbS5pc0xhenlWYWx1ZSl7IG9wdGlvbnMubGF6eVZhbHVlLmFkZERlcGVuZGVudFZhbHVlKHBhcmFtKTsgfVxuICB9KTtcbiAgZm9yKGtleSBpbiBoYXNoKXtcbiAgICBpZiAoaGFzaFtrZXldICYmIGhhc2hba2V5XS5pc0xhenlWYWx1ZSl7IG9wdGlvbnMubGF6eVZhbHVlLmFkZERlcGVuZGVudFZhbHVlKGhhc2hba2V5XSk7IH1cbiAgfVxuXG4gIHJldHVybiBvcHRpb25zLmxhenlWYWx1ZTtcbn1cblxuLy8gR2l2ZW4gYSByb290IGVsZW1lbnQsIGNsZWFucyBhbGwgb2YgdGhlIG1vcnBoIGxhenlWYWx1ZXMgZm9yIGEgZ2l2ZW4gc3VidHJlZVxuZnVuY3Rpb24gY2xlYW5TdWJ0cmVlKG11dGF0aW9ucywgb2JzZXJ2ZXIpe1xuICAvLyBGb3IgZWFjaCBtdXRhdGlvbiBvYnNlcnZlZCwgaWYgdGhlcmUgYXJlIG5vZGVzIHJlbW92ZWQsIGRlc3Ryb3kgYWxsIGFzc29jaWF0ZWQgbGF6eVZhbHVlc1xuICBtdXRhdGlvbnMuZm9yRWFjaChmdW5jdGlvbihtdXRhdGlvbikge1xuICAgIGlmKG11dGF0aW9uLnJlbW92ZWROb2Rlcyl7XG4gICAgICBfLmVhY2gobXV0YXRpb24ucmVtb3ZlZE5vZGVzLCBmdW5jdGlvbihub2RlLCBpbmRleCl7XG4gICAgICAgICQobm9kZSkud2Fsa1RoZURPTShmdW5jdGlvbihuKXtcbiAgICAgICAgICBpZihuLl9fbGF6eVZhbHVlICYmIG4uX19sYXp5VmFsdWUuZGVzdHJveSgpKXtcbiAgICAgICAgICAgIG4uX19sYXp5VmFsdWUuZGVzdHJveSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH0pO1xufVxuXG52YXIgc3VidHJlZU9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoY2xlYW5TdWJ0cmVlKTtcblxuLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcbiAgICAgICAgRGVmYXVsdCBIb29rc1xuKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKiovXG5cbmhvb2tzLmdldCA9IGZ1bmN0aW9uIGdldChlbnYsIGNvbnRleHQsIHBhdGgpe1xuICBpZihwYXRoID09PSAndGhpcycpIHBhdGggPSAnJztcbiAgdmFyIGtleSxcbiAgICAgIHJlc3QgPSAkLnNwbGl0UGF0aChwYXRoKSxcbiAgICAgIGZpcnN0ID0gcmVzdC5zaGlmdCgpO1xuXG4gIC8vIElmIHRoaXMgcGF0aCByZWZlcmFuY2VzIGEgYmxvY2sgcGFyYW0sIHVzZSB0aGF0IGFzIHRoZSBjb250ZXh0IGluc3RlYWQuXG4gIGlmKGVudi5ibG9ja1BhcmFtcyAmJiBlbnYuYmxvY2tQYXJhbXNbZmlyc3RdKXtcbiAgICBjb250ZXh0ID0gZW52LmJsb2NrUGFyYW1zW2ZpcnN0XTtcbiAgICBwYXRoID0gcmVzdC5qb2luKCcuJyk7XG4gIH1cblxuICByZXR1cm4gc3RyZWFtUHJvcGVydHkoY29udGV4dCwgcGF0aCk7XG59O1xuXG5ob29rcy5zZXQgPSBmdW5jdGlvbiBzZXQoZW52LCBjb250ZXh0LCBuYW1lLCB2YWx1ZSl7XG4gIGVudi5ibG9ja1BhcmFtcyB8fCAoZW52LmJsb2NrUGFyYW1zID0ge30pO1xuICBlbnYuYmxvY2tQYXJhbXNbbmFtZV0gPSB2YWx1ZTtcbn07XG5cblxuaG9va3MuY29uY2F0ID0gZnVuY3Rpb24gY29uY2F0KGVudiwgcGFyYW1zKSB7XG5cbiAgaWYocGFyYW1zLmxlbmd0aCA9PT0gMSl7XG4gICAgcmV0dXJuIHBhcmFtc1swXTtcbiAgfVxuXG4gIHZhciBsYXp5VmFsdWUgPSBuZXcgTGF6eVZhbHVlKGZ1bmN0aW9uKCkge1xuICAgIHZhciB2YWx1ZSA9IFwiXCI7XG5cbiAgICBmb3IgKHZhciBpID0gMCwgbCA9IHBhcmFtcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIHZhbHVlICs9IChwYXJhbXNbaV0uaXNMYXp5VmFsdWUpID8gcGFyYW1zW2ldLnZhbHVlKCkgOiBwYXJhbXNbaV07XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlO1xuICB9LCB7Y29udGV4dDogcGFyYW1zWzBdLmNvbnRleHR9KTtcblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHBhcmFtcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZihwYXJhbXNbaV0uaXNMYXp5VmFsdWUpIHtcbiAgICAgIGxhenlWYWx1ZS5hZGREZXBlbmRlbnRWYWx1ZShwYXJhbXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsYXp5VmFsdWU7XG5cbn07XG5cbmhvb2tzLnN1YmV4cHIgPSBmdW5jdGlvbiBzdWJleHByKGVudiwgY29udGV4dCwgaGVscGVyTmFtZSwgcGFyYW1zLCBoYXNoKSB7XG5cbiAgdmFyIGhlbHBlciA9IGhlbHBlcnMubG9va3VwSGVscGVyKGhlbHBlck5hbWUsIGVudiksXG4gIGxhenlWYWx1ZTtcblxuICBpZiAoaGVscGVyKSB7XG4gICAgbGF6eVZhbHVlID0gY29uc3RydWN0SGVscGVyKGZhbHNlLCBoZWxwZXJOYW1lLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIHt9LCBlbnYsIGhlbHBlcik7XG4gIH0gZWxzZSB7XG4gICAgbGF6eVZhbHVlID0gaG9va3MuZ2V0KGVudiwgY29udGV4dCwgaGVscGVyTmFtZSk7XG4gIH1cblxuICBmb3IgKHZhciBpID0gMCwgbCA9IHBhcmFtcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICBpZihwYXJhbXNbaV0uaXNMYXp5VmFsdWUpIHtcbiAgICAgIGxhenlWYWx1ZS5hZGREZXBlbmRlbnRWYWx1ZShwYXJhbXNbaV0pO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBsYXp5VmFsdWU7XG59O1xuXG5ob29rcy5ibG9jayA9IGZ1bmN0aW9uIGJsb2NrKGVudiwgbW9ycGgsIGNvbnRleHQsIHBhdGgsIHBhcmFtcywgaGFzaCwgdGVtcGxhdGUsIGludmVyc2Upe1xuICB2YXIgb3B0aW9ucyA9IHtcbiAgICBtb3JwaDogbW9ycGgsXG4gICAgdGVtcGxhdGU6IHRlbXBsYXRlLFxuICAgIGludmVyc2U6IGludmVyc2VcbiAgfTtcblxuICB2YXIgbGF6eVZhbHVlLFxuICAgICAgdmFsdWUsXG4gICAgICBvYnNlcnZlciA9IHN1YnRyZWVPYnNlcnZlcixcbiAgICAgIGhlbHBlciA9IGhlbHBlcnMubG9va3VwSGVscGVyKHBhdGgsIGVudik7XG5cbiAgaWYoIV8uaXNGdW5jdGlvbihoZWxwZXIpKXtcbiAgICByZXR1cm4gY29uc29sZS5lcnJvcihwYXRoICsgJyBpcyBub3QgYSB2YWxpZCBoZWxwZXIhJyk7XG4gIH1cblxuICAvLyBBYnN0cmFjdHMgb3VyIGhlbHBlciB0byBwcm92aWRlIGEgaGFuZGxlYmFycyB0eXBlIGludGVyZmFjZS4gQ29uc3RydWN0cyBvdXIgTGF6eVZhbHVlLlxuICBsYXp5VmFsdWUgPSBjb25zdHJ1Y3RIZWxwZXIobW9ycGgsIHBhdGgsIGNvbnRleHQsIHBhcmFtcywgaGFzaCwgb3B0aW9ucywgZW52LCBoZWxwZXIpO1xuXG4gIHZhciByZW5kZXJIb29rID0gZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgdmFyIHZhbCA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuICAgIHZhbCA9IChfLmlzVW5kZWZpbmVkKHZhbCkpID8gJycgOiB2YWw7XG4gICAgaWYoIV8uaXNOdWxsKHZhbCkpe1xuICAgICAgbW9ycGguc2V0Q29udGVudCh2YWwpO1xuICAgIH1cbiAgfVxuICBsYXp5VmFsdWUub25Ob3RpZnkocmVuZGVySG9vayk7XG4gIHJlbmRlckhvb2sobGF6eVZhbHVlKTtcblxuICAvLyBPYnNlcnZlIHRoaXMgY29udGVudCBtb3JwaCdzIHBhcmVudCdzIGNoaWxkcmVuLlxuICAvLyBXaGVuIHRoZSBtb3JwaCBlbGVtZW50J3MgY29udGFpbmluZyBlbGVtZW50IChtb3JwaCkgaXMgcmVtb3ZlZCwgY2xlYW4gdXAgdGhlIGxhenl2YWx1ZS5cbiAgLy8gVGltZW91dCBkZWxheSBoYWNrIHRvIGdpdmUgb3V0IGRvbSBhIGNoYW5nZSB0byBnZXQgdGhlaXIgcGFyZW50XG4gIGlmKG1vcnBoLl9wYXJlbnQpe1xuICAgIG1vcnBoLl9wYXJlbnQuX19sYXp5VmFsdWUgPSBsYXp5VmFsdWU7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgaWYobW9ycGguY29udGV4dHVhbEVsZW1lbnQpe1xuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKG1vcnBoLmNvbnRleHR1YWxFbGVtZW50LCB7IGF0dHJpYnV0ZXM6IGZhbHNlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICAgICAgfVxuICAgIH0sIDApO1xuICB9XG59O1xuXG5ob29rcy5pbmxpbmUgPSBmdW5jdGlvbiBpbmxpbmUoZW52LCBtb3JwaCwgY29udGV4dCwgcGF0aCwgcGFyYW1zLCBoYXNoKSB7XG5cbiAgdmFyIGxhenlWYWx1ZSxcbiAgdmFsdWUsXG4gIG9ic2VydmVyID0gc3VidHJlZU9ic2VydmVyLFxuICBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihwYXRoLCBlbnYpO1xuXG4gIGlmKCFfLmlzRnVuY3Rpb24oaGVscGVyKSl7XG4gICAgcmV0dXJuIGNvbnNvbGUuZXJyb3IocGF0aCArICcgaXMgbm90IGEgdmFsaWQgaGVscGVyIScpO1xuICB9XG5cbiAgLy8gQWJzdHJhY3RzIG91ciBoZWxwZXIgdG8gcHJvdmlkZSBhIGhhbmRsZWJhcnMgdHlwZSBpbnRlcmZhY2UuIENvbnN0cnVjdHMgb3VyIExhenlWYWx1ZS5cbiAgbGF6eVZhbHVlID0gY29uc3RydWN0SGVscGVyKG1vcnBoLCBwYXRoLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIHt9LCBlbnYsIGhlbHBlcik7XG5cbiAgdmFyIHJlbmRlckhvb2sgPSBmdW5jdGlvbihsYXp5VmFsdWUpIHtcbiAgICB2YXIgdmFsID0gbGF6eVZhbHVlLnZhbHVlKCk7XG4gICAgdmFsID0gKF8uaXNVbmRlZmluZWQodmFsKSkgPyAnJyA6IHZhbDtcbiAgICBpZighXy5pc051bGwodmFsKSl7XG4gICAgICBtb3JwaC5zZXRDb250ZW50KHZhbCk7XG4gICAgfVxuICB9XG5cbiAgLy8gSWYgd2UgaGF2ZSBvdXIgbGF6eSB2YWx1ZSwgdXBkYXRlIG91ciBkb20uXG4gIC8vIG1vcnBoIGlzIGEgbW9ycGggZWxlbWVudCByZXByZXNlbnRpbmcgb3VyIGRvbSBub2RlXG4gIGxhenlWYWx1ZS5vbk5vdGlmeShyZW5kZXJIb29rKTtcbiAgcmVuZGVySG9vayhsYXp5VmFsdWUpXG5cbiAgLy8gT2JzZXJ2ZSB0aGlzIGNvbnRlbnQgbW9ycGgncyBwYXJlbnQncyBjaGlsZHJlbi5cbiAgLy8gV2hlbiB0aGUgbW9ycGggZWxlbWVudCdzIGNvbnRhaW5pbmcgZWxlbWVudCAobW9ycGgpIGlzIHJlbW92ZWQsIGNsZWFuIHVwIHRoZSBsYXp5dmFsdWUuXG4gIC8vIFRpbWVvdXQgZGVsYXkgaGFjayB0byBnaXZlIG91dCBkb20gYSBjaGFuZ2UgdG8gZ2V0IHRoZWlyIHBhcmVudFxuICBpZihtb3JwaC5fcGFyZW50KXtcbiAgICBtb3JwaC5fcGFyZW50Ll9fbGF6eVZhbHVlID0gbGF6eVZhbHVlO1xuICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgIGlmKG1vcnBoLmNvbnRleHR1YWxFbGVtZW50KXtcbiAgICAgICAgb2JzZXJ2ZXIub2JzZXJ2ZShtb3JwaC5jb250ZXh0dWFsRWxlbWVudCwgeyBhdHRyaWJ1dGVzOiBmYWxzZSwgY2hpbGRMaXN0OiB0cnVlLCBjaGFyYWN0ZXJEYXRhOiBmYWxzZSwgc3VidHJlZTogdHJ1ZSB9KTtcbiAgICAgIH1cbiAgICB9LCAwKTtcbiAgfVxuXG59O1xuXG5ob29rcy5jb250ZW50ID0gZnVuY3Rpb24gY29udGVudChlbnYsIG1vcnBoLCBjb250ZXh0LCBwYXRoKSB7XG5cbiAgdmFyIGxhenlWYWx1ZSxcbiAgICAgIHZhbHVlLFxuICAgICAgb2JzZXJ2ZXIgPSBzdWJ0cmVlT2JzZXJ2ZXIsXG4gICAgICBoZWxwZXIgPSBoZWxwZXJzLmxvb2t1cEhlbHBlcihwYXRoLCBlbnYpO1xuXG4gIGlmIChoZWxwZXIpIHtcbiAgICBsYXp5VmFsdWUgPSBjb25zdHJ1Y3RIZWxwZXIobW9ycGgsIHBhdGgsIGNvbnRleHQsIFtdLCB7fSwge30sIGVudiwgaGVscGVyKTtcbiAgfSBlbHNlIHtcbiAgICBsYXp5VmFsdWUgPSBob29rcy5nZXQoZW52LCBjb250ZXh0LCBwYXRoKTtcbiAgfVxuXG4gIHZhciByZW5kZXJIb29rID0gZnVuY3Rpb24obGF6eVZhbHVlKSB7XG4gICAgdmFyIHZhbCA9IGxhenlWYWx1ZS52YWx1ZSgpO1xuICAgIHZhbCA9IChfLmlzVW5kZWZpbmVkKHZhbCkpID8gJycgOiB2YWw7XG4gICAgaWYoIV8uaXNOdWxsKHZhbCkpIG1vcnBoLnNldENvbnRlbnQodmFsKTtcbiAgfVxuXG4gIC8vIElmIHdlIGhhdmUgb3VyIGxhenkgdmFsdWUsIHVwZGF0ZSBvdXIgZG9tLlxuICAvLyBtb3JwaCBpcyBhIG1vcnBoIGVsZW1lbnQgcmVwcmVzZW50aW5nIG91ciBkb20gbm9kZVxuICBsYXp5VmFsdWUub25Ob3RpZnkocmVuZGVySG9vayk7XG4gIHJlbmRlckhvb2sobGF6eVZhbHVlKTtcblxuICAvLyBPYnNlcnZlIHRoaXMgY29udGVudCBtb3JwaCdzIHBhcmVudCdzIGNoaWxkcmVuLlxuICAvLyBXaGVuIHRoZSBtb3JwaCBlbGVtZW50J3MgY29udGFpbmluZyBlbGVtZW50IChtb3JwaCkgaXMgcmVtb3ZlZCwgY2xlYW4gdXAgdGhlIGxhenl2YWx1ZS5cbiAgLy8gVGltZW91dCBkZWxheSBoYWNrIHRvIGdpdmUgb3V0IGRvbSBhIGNoYW5nZSB0byBnZXQgdGhlaXIgcGFyZW50XG4gIGlmKG1vcnBoLl9wYXJlbnQpe1xuICAgIG1vcnBoLl9wYXJlbnQuX19sYXp5VmFsdWUgPSBsYXp5VmFsdWU7XG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xuICAgICAgaWYobW9ycGguY29udGV4dHVhbEVsZW1lbnQpe1xuICAgICAgICBvYnNlcnZlci5vYnNlcnZlKG1vcnBoLmNvbnRleHR1YWxFbGVtZW50LCB7IGF0dHJpYnV0ZXM6IGZhbHNlLCBjaGlsZExpc3Q6IHRydWUsIGNoYXJhY3RlckRhdGE6IGZhbHNlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuICAgICAgfVxuICAgIH0sIDApO1xuICB9XG5cbn07XG5cbi8vIEhhbmRsZSBtb3JwaHMgaW4gZWxlbWVudCB0YWdzXG4vLyBUT0RPOiBoYW5kbGUgZHluYW1pYyBhdHRyaWJ1dGUgbmFtZXM/XG5ob29rcy5lbGVtZW50ID0gZnVuY3Rpb24gZWxlbWVudChlbnYsIGRvbUVsZW1lbnQsIGNvbnRleHQsIHBhdGgsIHBhcmFtcywgaGFzaCkge1xuICB2YXIgaGVscGVyID0gaGVscGVycy5sb29rdXBIZWxwZXIocGF0aCwgZW52KSxcbiAgICAgIGxhenlWYWx1ZSxcbiAgICAgIHZhbHVlO1xuXG4gIGlmIChoZWxwZXIpIHtcbiAgICAvLyBBYnN0cmFjdHMgb3VyIGhlbHBlciB0byBwcm92aWRlIGEgaGFuZGxlYmFycyB0eXBlIGludGVyZmFjZS4gQ29uc3RydWN0cyBvdXIgTGF6eVZhbHVlLlxuICAgIGxhenlWYWx1ZSA9IGNvbnN0cnVjdEhlbHBlcihkb21FbGVtZW50LCBwYXRoLCBjb250ZXh0LCBwYXJhbXMsIGhhc2gsIHt9LCBlbnYsIGhlbHBlcik7XG4gIH0gZWxzZSB7XG4gICAgbGF6eVZhbHVlID0gaG9va3MuZ2V0KGVudiwgY29udGV4dCwgcGF0aCk7XG4gIH1cblxuICB2YXIgcmVuZGVySG9vayA9IGZ1bmN0aW9uKGxhenlWYWx1ZSkge1xuICAgIGxhenlWYWx1ZS52YWx1ZSgpO1xuICB9XG5cbiAgLy8gV2hlbiB3ZSBoYXZlIG91ciBsYXp5IHZhbHVlIHJ1biBpdCBhbmQgc3RhcnQgbGlzdGVuaW5nIGZvciB1cGRhdGVzLlxuICBsYXp5VmFsdWUub25Ob3RpZnkocmVuZGVySG9vayk7XG4gIHJlbmRlckhvb2sobGF6eVZhbHVlKTtcblxufTtcbmhvb2tzLmF0dHJpYnV0ZSA9IGZ1bmN0aW9uIGF0dHJpYnV0ZShlbnYsIGF0dHJNb3JwaCwgZG9tRWxlbWVudCwgbmFtZSwgdmFsdWUpe1xuXG4gIHZhciBsYXp5VmFsdWUgPSBuZXcgTGF6eVZhbHVlKGZ1bmN0aW9uKCkge1xuICAgIHZhciB2YWwgPSB2YWx1ZS52YWx1ZSgpLFxuICAgIGNoZWNrYm94Q2hhbmdlLFxuICAgIHR5cGUgPSBkb21FbGVtZW50LmdldEF0dHJpYnV0ZShcInR5cGVcIiksXG5cbiAgICBpbnB1dFR5cGVzID0geyAgJ251bGwnOiB0cnVlLCAgJ3RleHQnOnRydWUsICAgJ2VtYWlsJzp0cnVlLCAgJ3Bhc3N3b3JkJzp0cnVlLFxuICAgICAgICAgICAgICAgICAgICAnc2VhcmNoJzp0cnVlLCAndXJsJzp0cnVlLCAgICAndGVsJzp0cnVlLCAgICAnaGlkZGVuJzp0cnVlLFxuICAgICAgICAgICAgICAgICAgICAnbnVtYmVyJzp0cnVlLCAnY29sb3InOiB0cnVlLCAnZGF0ZSc6IHRydWUsICAnZGF0ZXRpbWUnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAnZGF0ZXRpbWUtbG9jYWw6JzogdHJ1ZSwgICAgICAnbW9udGgnOiB0cnVlLCAncmFuZ2UnOiB0cnVlLFxuICAgICAgICAgICAgICAgICAgICAndGltZSc6IHRydWUsICAnd2Vlayc6IHRydWVcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgYXR0cjtcblxuICAgIC8vIElmIGlzIGEgdGV4dCBpbnB1dCBlbGVtZW50J3MgdmFsdWUgcHJvcCB3aXRoIG9ubHkgb25lIHZhcmlhYmxlLCB3aXJlIGRlZmF1bHQgZXZlbnRzXG4gICAgaWYoIGRvbUVsZW1lbnQudGFnTmFtZSA9PT0gJ0lOUFVUJyAmJiBpbnB1dFR5cGVzW3R5cGVdICYmIG5hbWUgPT09ICd2YWx1ZScgKXtcblxuICAgICAgLy8gSWYgb3VyIHNwZWNpYWwgaW5wdXQgZXZlbnRzIGhhdmUgbm90IGJlZW4gYm91bmQgeWV0LCBiaW5kIHRoZW0gYW5kIHNldCBmbGFnXG4gICAgICBpZighbGF6eVZhbHVlLmlucHV0T2JzZXJ2ZXIpe1xuXG4gICAgICAgICQoZG9tRWxlbWVudCkub24oJ2NoYW5nZSBpbnB1dCBwcm9wZXJ0eWNoYW5nZScsIGZ1bmN0aW9uKGV2ZW50KXtcbiAgICAgICAgICB2YWx1ZS5zZXQodmFsdWUucGF0aCwgdGhpcy52YWx1ZSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGxhenlWYWx1ZS5pbnB1dE9ic2VydmVyID0gdHJ1ZTtcblxuICAgICAgfVxuXG4gICAgICAvLyBTZXQgdGhlIGF0dHJpYnV0ZSBvbiBvdXIgZWxlbWVudCBmb3IgdmlzdWFsIHJlZmVyYW5jZVxuICAgICAgKF8uaXNVbmRlZmluZWQodmFsKSkgPyBkb21FbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKSA6IGRvbUVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbCk7XG5cbiAgICAgIGF0dHIgPSB2YWw7XG5cbiAgICAgIHJldHVybiAoZG9tRWxlbWVudC52YWx1ZSAhPT0gU3RyaW5nKGF0dHIpKSA/IGRvbUVsZW1lbnQudmFsdWUgPSAoYXR0ciB8fCAnJykgOiBhdHRyO1xuICAgIH1cblxuICAgIGVsc2UgaWYoIGRvbUVsZW1lbnQudGFnTmFtZSA9PT0gJ0lOUFVUJyAmJiAodHlwZSA9PT0gJ2NoZWNrYm94JyB8fCB0eXBlID09PSAncmFkaW8nKSAmJiBuYW1lID09PSAnY2hlY2tlZCcgKXtcblxuICAgICAgLy8gSWYgb3VyIHNwZWNpYWwgaW5wdXQgZXZlbnRzIGhhdmUgbm90IGJlZW4gYm91bmQgeWV0LCBiaW5kIHRoZW0gYW5kIHNldCBmbGFnXG4gICAgICBpZighbGF6eVZhbHVlLmV2ZW50c0JvdW5kKXtcblxuICAgICAgICAkKGRvbUVsZW1lbnQpLm9uKCdjaGFuZ2UgcHJvcGVydHljaGFuZ2UnLCBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgdmFsdWUuc2V0KHZhbHVlLnBhdGgsICgodGhpcy5jaGVja2VkKSA/IHRydWUgOiBmYWxzZSksIHtxdWlldDogdHJ1ZX0pO1xuICAgICAgICB9KTtcblxuICAgICAgICBsYXp5VmFsdWUuZXZlbnRzQm91bmQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXQgdGhlIGF0dHJpYnV0ZSBvbiBvdXIgZWxlbWVudCBmb3IgdmlzdWFsIHJlZmVyYW5jZVxuICAgICAgKCF2YWwpID8gZG9tRWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUobmFtZSkgOiBkb21FbGVtZW50LnNldEF0dHJpYnV0ZShuYW1lLCB2YWwpO1xuXG4gICAgICByZXR1cm4gZG9tRWxlbWVudC5jaGVja2VkID0gKHZhbCkgPyB0cnVlIDogdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIC8vIFNwZWNpYWwgY2FzZSBmb3IgbGluayBlbGVtZW50cyB3aXRoIGR5bmFtaWMgY2xhc3Nlcy5cbiAgICAvLyBJZiB0aGUgcm91dGVyIGhhcyBhc3NpZ25lZCBpdCBhIHRydXRoeSAnYWN0aXZlJyBwcm9wZXJ0eSwgZW5zdXJlIHRoYXQgdGhlIGV4dHJhIGNsYXNzIGlzIHByZXNlbnQgb24gcmUtcmVuZGVyLlxuICAgIGVsc2UgaWYoIGRvbUVsZW1lbnQudGFnTmFtZSA9PT0gJ0EnICYmIG5hbWUgPT09ICdjbGFzcycgKXtcbiAgICAgIGlmKF8uaXNVbmRlZmluZWQodmFsKSl7XG4gICAgICAgIGRvbUVsZW1lbnQuYWN0aXZlID8gZG9tRWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2FjdGl2ZScpIDogZG9tRWxlbWVudC5jbGFzc0xpc3QucmVtb3ZlKCdjbGFzcycpO1xuICAgICAgfVxuICAgICAgZWxzZXtcbiAgICAgICAgZG9tRWxlbWVudC5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsICsgKGRvbUVsZW1lbnQuYWN0aXZlID8gJyBhY3RpdmUnIDogJycpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBlbHNlIHtcbiAgICAgIF8uaXNTdHJpbmcodmFsKSAmJiAodmFsID0gdmFsLnRyaW0oKSk7XG4gICAgICB2YWwgfHwgKHZhbCA9IHVuZGVmaW5lZCk7XG4gICAgICBpZihfLmlzVW5kZWZpbmVkKHZhbCkpe1xuICAgICAgICBkb21FbGVtZW50LnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgIH1cbiAgICAgIGVsc2V7XG4gICAgICAgIGRvbUVsZW1lbnQuc2V0QXR0cmlidXRlKG5hbWUsIHZhbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbDtcblxuICB9LCB7YXR0ck1vcnBoOiBhdHRyTW9ycGh9KTtcblxuICB2YXIgcmVuZGVySG9vayA9IGZ1bmN0aW9uKCl7XG4gICAgbGF6eVZhbHVlLnZhbHVlKCk7XG4gIH1cblxuICB2YWx1ZS5vbk5vdGlmeShyZW5kZXJIb29rKTtcbiAgbGF6eVZhbHVlLmFkZERlcGVuZGVudFZhbHVlKHZhbHVlKTtcbiAgcmVuZGVySG9vaygpO1xufTtcblxuaG9va3MuY29tcG9uZW50ID0gZnVuY3Rpb24oZW52LCBtb3JwaCwgY29udGV4dCwgdGFnTmFtZSwgY29udGV4dERhdGEsIHRlbXBsYXRlKSB7XG5cbiAgdmFyIGNvbXBvbmVudCxcbiAgICAgIGVsZW1lbnQsXG4gICAgICBvdXRsZXQsXG4gICAgICBwbGFpbkRhdGEgPSB7fSxcbiAgICAgIGNvbXBvbmVudERhdGEgPSB7fSxcbiAgICAgIGxhenlWYWx1ZSxcbiAgICAgIHZhbHVlO1xuXG4gIC8vIENyZWF0ZSBhIGxhenkgdmFsdWUgdGhhdCByZXR1cm5zIHRoZSB2YWx1ZSBvZiBvdXIgZXZhbHVhdGVkIGNvbXBvbmVudC5cbiAgbGF6eVZhbHVlID0gbmV3IExhenlWYWx1ZShmdW5jdGlvbigpIHtcblxuICAgIC8vIENyZWF0ZSBhIHBsYWluIGRhdGEgb2JqZWN0IGZyb20gdGhlIGxhenl2YWx1ZXMvdmFsdWVzIHBhc3NlZCB0byBvdXIgY29tcG9uZW50XG4gICAgXy5lYWNoKGNvbnRleHREYXRhLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICBwbGFpbkRhdGFba2V5XSA9ICh2YWx1ZS5pc0xhenlWYWx1ZSkgPyB2YWx1ZS52YWx1ZSgpIDogdmFsdWU7XG4gICAgfSk7XG5cbiAgICAvLyBGb3IgZWFjaCBwYXJhbSBwYXNzZWQgdG8gb3VyIHNoYXJlZCBjb21wb25lbnQsIGFkZCBpdCB0byBvdXIgY3VzdG9tIGVsZW1lbnRcbiAgICAvLyBUT0RPOiB0aGVyZSBoYXMgdG8gYmUgYSBiZXR0ZXIgd2F5IHRvIGdldCBzZWVkIGRhdGEgdG8gZWxlbWVudCBpbnN0YW5jZXNcbiAgICAvLyBHbG9iYWwgc2VlZCBkYXRhIGlzIGNvbnN1bWVkIGJ5IGVsZW1lbnQgYXMgaXRzIGNyZWF0ZWQuIFRoaXMgaXMgbm90IHNjb3BlZCBhbmQgdmVyeSBkdW1iLlxuICAgIFJlYm91bmQuc2VlZERhdGEgPSBwbGFpbkRhdGE7XG4gICAgZWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQodGFnTmFtZSk7XG4gICAgZGVsZXRlIFJlYm91bmQuc2VlZERhdGE7XG4gICAgY29tcG9uZW50ID0gZWxlbWVudC5fX2NvbXBvbmVudF9fO1xuXG4gICAgLy8gRm9yIGVhY2ggbGF6eSBwYXJhbSBwYXNzZWQgdG8gb3VyIGNvbXBvbmVudCwgY3JlYXRlIGl0cyBsYXp5VmFsdWVcbiAgICBfLmVhY2gocGxhaW5EYXRhLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICBpZihjb250ZXh0RGF0YVtrZXldICYmIGNvbnRleHREYXRhW2tleV0uaXNMYXp5VmFsdWUpe1xuICAgICAgICBjb21wb25lbnREYXRhW2tleV0gPSBob29rcy5nZXQoZW52LCBjb21wb25lbnQsIGtleSk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTZXQgdXAgdHdvIHdheSBiaW5kaW5nIGJldHdlZW4gY29tcG9uZW50IGFuZCBvcmlnaW5hbCBjb250ZXh0IGZvciBub24tZGF0YSBhdHRyaWJ1dGVzXG4gICAgLy8gU3luY2luZyBiZXR3ZWVuIG1vZGVscyBhbmQgY29sbGVjdGlvbnMgcGFzc2VkIGFyZSBoYW5kbGVkIGluIG1vZGVsIGFuZCBjb2xsZWN0aW9uXG4gICAgXy5lYWNoKCBjb21wb25lbnREYXRhLCBmdW5jdGlvbihjb21wb25lbnREYXRhVmFsdWUsIGtleSl7XG5cbiAgICAgIC8vIFRPRE86IE1ha2UgdGhpcyBzeW5jIHdvcmsgd2l0aCBjb21wbGV4IGFyZ3VtZW50cyB3aXRoIG1vcmUgdGhhbiBvbmUgY2hpbGRcbiAgICAgIGlmKGNvbnRleHREYXRhW2tleV0uY2hpbGRyZW4gPT09IG51bGwpe1xuICAgICAgICAvLyBGb3IgZWFjaCBsYXp5IHBhcmFtIHBhc3NlZCB0byBvdXIgY29tcG9uZW50LCBoYXZlIGl0IHVwZGF0ZSB0aGUgb3JpZ2luYWwgY29udGV4dCB3aGVuIGNoYW5nZWQuXG4gICAgICAgIGNvbXBvbmVudERhdGFWYWx1ZS5vbk5vdGlmeShmdW5jdGlvbigpe1xuICAgICAgICAgIGNvbnRleHREYXRhW2tleV0uc2V0KGNvbnRleHREYXRhW2tleV0ucGF0aCwgY29tcG9uZW50RGF0YVZhbHVlLnZhbHVlKCkpO1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgLy8gRm9yIGVhY2ggbGF6eSBwYXJhbSBwYXNzZWQgdG8gb3VyIGNvbXBvbmVudCwgaGF2ZSBpdCB1cGRhdGUgdGhlIGNvbXBvbmVudCB3aGVuIGNoYW5nZWQuXG4gICAgICBjb250ZXh0RGF0YVtrZXldLm9uTm90aWZ5KGZ1bmN0aW9uKCl7XG4gICAgICAgIGNvbXBvbmVudERhdGFWYWx1ZS5zZXQoa2V5LCBjb250ZXh0RGF0YVtrZXldLnZhbHVlKCkpO1xuICAgICAgfSk7XG5cbiAgICAgIC8vIFNlZWQgdGhlIGNhY2hlXG4gICAgICBjb21wb25lbnREYXRhVmFsdWUudmFsdWUoKTtcblxuICAgICAgLy8gTm90aWZ5IHRoZSBjb21wb25lbnQncyBsYXp5dmFsdWUgd2hlbiBvdXIgbW9kZWwgdXBkYXRlc1xuICAgICAgY29udGV4dERhdGFba2V5XS5hZGRPYnNlcnZlcihjb250ZXh0RGF0YVtrZXldLnBhdGgsIGNvbnRleHQpO1xuICAgICAgY29tcG9uZW50RGF0YVZhbHVlLmFkZE9ic2VydmVyKGtleSwgY29tcG9uZW50KTtcblxuICAgIH0pO1xuXG4gICAgLy8gLy8gRm9yIGVhY2ggY2hhbmdlIG9uIG91ciBjb21wb25lbnQsIHVwZGF0ZSB0aGUgc3RhdGVzIG9mIHRoZSBvcmlnaW5hbCBjb250ZXh0IGFuZCB0aGUgZWxlbWVudCdzIHByb2VwcnRpZXMuXG4gICAgY29tcG9uZW50Lmxpc3RlblRvKGNvbXBvbmVudCwgJ2NoYW5nZScsIGZ1bmN0aW9uKG1vZGVsKXtcbiAgICAgIHZhciBqc29uID0gY29tcG9uZW50LnRvSlNPTigpO1xuXG4gICAgICBpZihfLmlzU3RyaW5nKGpzb24pKSByZXR1cm47IC8vIElmIGlzIGEgc3RyaW5nLCB0aGlzIG1vZGVsIGlzIHNlcmFsaXppbmcgYWxyZWFkeVxuXG4gICAgICAvLyBTZXQgdGhlIHByb3BlcnRpZXMgb24gb3VyIGVsZW1lbnQgZm9yIHZpc3VhbCByZWZlcmFuY2UgaWYgd2UgYXJlIG9uIGEgdG9wIGxldmVsIGF0dHJpYnV0ZVxuICAgICAgXy5lYWNoKGpzb24sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuICAgICAgICAvLyBUT0RPOiBDdXJyZW50bHksIHNob3dpbmcgb2JqZWN0cyBhcyBwcm9wZXJ0aWVzIG9uIHRoZSBjdXN0b20gZWxlbWVudCBjYXVzZXMgcHJvYmxlbXMuXG4gICAgICAgIC8vIExpbmtlZCBtb2RlbHMgYmV0d2VlbiB0aGUgY29udGV4dCBhbmQgY29tcG9uZW50IGJlY29tZSB0aGUgc2FtZSBleGFjdCBtb2RlbCBhbmQgYWxsIGhlbGwgYnJlYWtzIGxvb3NlLlxuICAgICAgICAvLyBGaW5kIGEgd2F5IHRvIHJlbWVkeSB0aGlzLiBVbnRpbCB0aGVuLCBkb24ndCBzaG93IG9iamVjdHMuXG4gICAgICAgIGlmKChfLmlzT2JqZWN0KHZhbHVlKSkpeyByZXR1cm47IH1cbiAgICAgICAgdmFsdWUgPSAoXy5pc09iamVjdCh2YWx1ZSkpID8gSlNPTi5zdHJpbmdpZnkodmFsdWUpIDogdmFsdWU7XG4gICAgICAgICAgdHJ5eyAoYXR0cmlidXRlc1trZXldKSA/IGVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpIDogZWxlbWVudC5kYXRhc2V0W2tleV0gPSB2YWx1ZTsgfVxuICAgICAgICAgIGNhdGNoKGUpe1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLyoqIFRoZSBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2sgb24gb3VyIGN1c3RvbSBlbGVtZW50IHVwZGF0ZXMgdGhlIGNvbXBvbmVudCdzIGRhdGEuICoqL1xuXG5cbiAgLyoqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKipcblxuICAgIEVuZCBkYXRhIGRlcGVuZGFuY3kgY2hhaW5cblxuICAqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG5cbiAgICAvLyBUT0RPOiBicmVhayB0aGlzIG91dCBpbnRvIGl0cyBvd24gZnVuY3Rpb25cbiAgICAvLyBTZXQgdGhlIHByb3BlcnRpZXMgb24gb3VyIGVsZW1lbnQgZm9yIHZpc3VhbCByZWZlcmFuY2UgaWYgd2UgYXJlIG9uIGEgdG9wIGxldmVsIGF0dHJpYnV0ZVxuICAgIHZhciBjb21wanNvbiA9IGNvbXBvbmVudC50b0pTT04oKTtcbiAgICBfLmVhY2goY29tcGpzb24sIGZ1bmN0aW9uKHZhbHVlLCBrZXkpe1xuICAgICAgLy8gVE9ETzogQ3VycmVudGx5LCBzaG93aW5nIG9iamVjdHMgYXMgcHJvcGVydGllcyBvbiB0aGUgY3VzdG9tIGVsZW1lbnQgY2F1c2VzIHByb2JsZW1zLlxuICAgICAgLy8gTGlua2VkIG1vZGVscyBiZXR3ZWVuIHRoZSBjb250ZXh0IGFuZCBjb21wb25lbnQgYmVjb21lIHRoZSBzYW1lIGV4YWN0IG1vZGVsIGFuZCBhbGwgaGVsbCBicmVha3MgbG9vc2UuXG4gICAgICAvLyBGaW5kIGEgd2F5IHRvIHJlbWVkeSB0aGlzLiBVbnRpbCB0aGVuLCBkb24ndCBzaG93IG9iamVjdHMuXG4gICAgICBpZigoXy5pc09iamVjdCh2YWx1ZSkpKXsgcmV0dXJuOyB9XG4gICAgICB2YWx1ZSA9IChfLmlzT2JqZWN0KHZhbHVlKSkgPyBKU09OLnN0cmluZ2lmeSh2YWx1ZSkgOiB2YWx1ZTtcbiAgICAgIGlmKCFfLmlzTnVsbCh2YWx1ZSkgJiYgIV8uaXNVbmRlZmluZWQodmFsdWUpKXtcbiAgICAgICAgdHJ5eyAoYXR0cmlidXRlc1trZXldKSA/IGVsZW1lbnQuc2V0QXR0cmlidXRlKGtleSwgdmFsdWUpIDogZWxlbWVudC5kYXRhc2V0W2tleV0gPSB2YWx1ZTsgfVxuICAgICAgICBjYXRjaChlKXtcbiAgICAgICAgICBjb25zb2xlLmVycm9yKGUubWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgLy8gSWYgYW4gb3V0bGV0IG1hcmtlciBpcyBwcmVzZW50IGluIGNvbXBvbmVudCdzIHRlbXBsYXRlLCBhbmQgYSB0ZW1wbGF0ZSBpcyBwcm92aWRlZCwgcmVuZGVyIGl0IGludG8gPGNvbnRlbnQ+XG4gICAgb3V0bGV0ID0gZWxlbWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnY29udGVudCcpWzBdO1xuICAgIGlmKHRlbXBsYXRlICYmIF8uaXNFbGVtZW50KG91dGxldCkpe1xuICAgICAgb3V0bGV0LmlubmVySFRNTCA9ICcnO1xuICAgICAgb3V0bGV0LmFwcGVuZENoaWxkKHRlbXBsYXRlLnJlbmRlcihjb250ZXh0LCBlbnYsIG91dGxldCkpO1xuICAgIH1cblxuICAgIC8vIFJldHVybiB0aGUgbmV3IGVsZW1lbnQuXG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH0sIHttb3JwaDogbW9ycGh9KTtcblxuICB2YXIgcmVuZGVySG9vayA9IGZ1bmN0aW9uKGxhenlWYWx1ZSkge1xuICAgIHZhciB2YWwgPSBsYXp5VmFsdWUudmFsdWUoKTtcbiAgICBpZih2YWwgIT09IHVuZGVmaW5lZCl7IG1vcnBoLnNldENvbnRlbnQodmFsKTsgfVxuICB9XG5cbiAgLy8gSWYgd2UgaGF2ZSBvdXIgbGF6eSB2YWx1ZSwgdXBkYXRlIG91ciBkb20uXG4gIC8vIG1vcnBoIGlzIGEgbW9ycGggZWxlbWVudCByZXByZXNlbnRpbmcgb3VyIGRvbSBub2RlXG4gIGlmIChsYXp5VmFsdWUpIHtcbiAgICBsYXp5VmFsdWUub25Ob3RpZnkocmVuZGVySG9vayk7XG4gICAgcmVuZGVySG9vayhsYXp5VmFsdWUpO1xuICB9XG59O1xuXG4vLyByZWdpc3RlckhlbHBlciBpcyBhIHB1YmxpY2FsbHkgYXZhaWxhYmxlIGZ1bmN0aW9uIHRvIHJlZ2lzdGVyIGEgaGVscGVyIHdpdGggSFRNTEJhcnNcblxuZXhwb3J0IGRlZmF1bHQgaG9va3M7XG4iLCIvLyBSZWJvdW5kIE1vZGVsXG4vLyAtLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFJlYm91bmQgKipNb2RlbHMqKiBhcmUgdGhlIGJhc2ljIGRhdGEgb2JqZWN0IGluIHRoZSBmcmFtZXdvcmsg4oCUIGZyZXF1ZW50bHlcbi8vIHJlcHJlc2VudGluZyBhIHJvdyBpbiBhIHRhYmxlIGluIGEgZGF0YWJhc2Ugb24geW91ciBzZXJ2ZXIuIFRoZSBpbmhlcml0IGZyb21cbi8vIEJhY2tib25lIE1vZGVscyBhbmQgaGF2ZSBhbGwgb2YgdGhlIHNhbWUgdXNlZnVsIG1ldGhvZHMgeW91IGFyZSB1c2VkIHRvIGZvclxuLy8gcGVyZm9ybWluZyBjb21wdXRhdGlvbnMgYW5kIHRyYW5zZm9ybWF0aW9ucyBvbiB0aGF0IGRhdGEuIFJlYm91bmQgYXVnbWVudHNcbi8vIEJhY2tib25lIE1vZGVscyBieSBlbmFibGluZyBkZWVwIGRhdGEgbmVzdGluZy4gWW91IGNhbiBub3cgaGF2ZSAqKlJlYm91bmQgQ29sbGVjdGlvbnMqKlxuLy8gYW5kICoqUmVib3VuZCBDb21wdXRlZCBQcm9wZXJ0aWVzKiogYXMgcHJvcGVydGllcyBvZiB0aGUgTW9kZWwuXG5cbmltcG9ydCBDb21wdXRlZFByb3BlcnR5IGZyb20gXCJyZWJvdW5kLWRhdGEvY29tcHV0ZWQtcHJvcGVydHlcIjtcbmltcG9ydCAkIGZyb20gXCJyZWJvdW5kLWNvbXBvbmVudC91dGlsc1wiO1xuXG4vLyBSZXR1cm5zIGEgZnVuY3Rpb24gdGhhdCwgd2hlbiBjYWxsZWQsIGdlbmVyYXRlcyBhIHBhdGggY29uc3RydWN0ZWQgZnJvbSBpdHNcbi8vIHBhcmVudCdzIHBhdGggYW5kIHRoZSBrZXkgaXQgaXMgYXNzaWduZWQgdG8uIEtlZXBzIHVzIGZyb20gcmUtbmFtaW5nIGNoaWxkcmVuXG4vLyB3aGVuIHBhcmVudHMgY2hhbmdlLlxuZnVuY3Rpb24gcGF0aEdlbmVyYXRvcihwYXJlbnQsIGtleSl7XG4gIHJldHVybiBmdW5jdGlvbigpe1xuICAgIHZhciBwYXRoID0gcGFyZW50Ll9fcGF0aCgpO1xuICAgIHJldHVybiBwYXRoICsgKChwYXRoID09PSAnJykgPyAnJyA6ICcuJykgKyBrZXk7XG4gIH07XG59XG5cbnZhciBNb2RlbCA9IEJhY2tib25lLk1vZGVsLmV4dGVuZCh7XG4gIC8vIFNldCB0aGlzIG9iamVjdCdzIGRhdGEgdHlwZXNcbiAgaXNNb2RlbDogdHJ1ZSxcbiAgaXNEYXRhOiB0cnVlLFxuXG4gIC8vIEEgbWV0aG9kIHRoYXQgcmV0dXJucyBhIHJvb3QgcGF0aCBieSBkZWZhdWx0LiBNZWFudCB0byBiZSBvdmVycmlkZGVuIG9uXG4gIC8vIGluc3RhbnRpYXRpb24uXG4gIF9fcGF0aDogZnVuY3Rpb24oKXsgcmV0dXJuICcnOyB9LFxuXG4gIC8vIENyZWF0ZSBhIG5ldyBNb2RlbCB3aXRoIHRoZSBzcGVjaWZpZWQgYXR0cmlidXRlcy4gVGhlIE1vZGVsJ3MgbGluZWFnZSBpcyBzZXRcbiAgLy8gdXAgaGVyZSB0byBrZWVwIHRyYWNrIG9mIGl0J3MgcGxhY2UgaW4gdGhlIGRhdGEgdHJlZS5cbiAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKGF0dHJpYnV0ZXMsIG9wdGlvbnMpe1xuICAgIGF0dHJpYnV0ZXMgfHwgKGF0dHJpYnV0ZXMgPSB7fSk7XG4gICAgYXR0cmlidXRlcy5pc01vZGVsICYmIChhdHRyaWJ1dGVzID0gYXR0cmlidXRlcy5hdHRyaWJ1dGVzKTtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuICAgIHRoaXMuaGVscGVycyA9IHt9O1xuICAgIHRoaXMuZGVmYXVsdHMgPSB0aGlzLmRlZmF1bHRzIHx8IHt9O1xuICAgIHRoaXMuc2V0UGFyZW50KCBvcHRpb25zLnBhcmVudCB8fCB0aGlzICk7XG4gICAgdGhpcy5zZXRSb290KCBvcHRpb25zLnJvb3QgfHwgdGhpcyApO1xuICAgIHRoaXMuX19wYXRoID0gb3B0aW9ucy5wYXRoIHx8IHRoaXMuX19wYXRoO1xuICAgIEJhY2tib25lLk1vZGVsLmNhbGwoIHRoaXMsIGF0dHJpYnV0ZXMsIG9wdGlvbnMgKTtcbiAgfSxcblxuICAvLyBOZXcgY29udmVuaWVuY2UgZnVuY3Rpb24gdG8gdG9nZ2xlIGJvb2xlYW4gdmFsdWVzIGluIHRoZSBNb2RlbC5cbiAgdG9nZ2xlOiBmdW5jdGlvbihhdHRyLCBvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IG9wdGlvbnMgPyBfLmNsb25lKG9wdGlvbnMpIDoge307XG4gICAgdmFyIHZhbCA9IHRoaXMuZ2V0KGF0dHIpO1xuICAgIGlmKCFfLmlzQm9vbGVhbih2YWwpKSBjb25zb2xlLmVycm9yKCdUcmllZCB0byB0b2dnbGUgbm9uLWJvb2xlYW4gdmFsdWUgJyArIGF0dHIgKychJywgdGhpcyk7XG4gICAgcmV0dXJuIHRoaXMuc2V0KGF0dHIsICF2YWwsIG9wdGlvbnMpO1xuICB9LFxuXG4gIC8vIE1vZGVsIFJlc2V0IGRvZXMgYSBkZWVwIHJlc2V0IG9uIHRoZSBkYXRhIHRyZWUgc3RhcnRpbmcgYXQgdGhpcyBNb2RlbC5cbiAgLy8gQSBgcHJldmlvdXNBdHRyaWJ1dGVzYCBwcm9wZXJ0eSBpcyBzZXQgb24gdGhlIGBvcHRpb25zYCBwcm9wZXJ0eSB3aXRoIHRoZSBNb2RlbCdzXG4gIC8vIG9sZCB2YWx1ZXMuXG4gIHJlc2V0OiBmdW5jdGlvbihvYmosIG9wdGlvbnMpe1xuICAgIHZhciBjaGFuZ2VkID0ge30sIGtleSwgdmFsdWU7XG4gICAgb3B0aW9ucyB8fCAob3B0aW9ucyA9IHt9KTtcbiAgICBvcHRpb25zLnJlc2V0ID0gdHJ1ZTtcbiAgICBvYmogPSAob2JqICYmIG9iai5pc01vZGVsICYmIG9iai5hdHRyaWJ1dGVzKSB8fCBvYmogfHwge307XG4gICAgb3B0aW9ucy5wcmV2aW91c0F0dHJpYnV0ZXMgPSBfLmNsb25lKHRoaXMuYXR0cmlidXRlcyk7XG5cbiAgICAvLyBJdGVyYXRlIG92ZXIgdGhlIE1vZGVsJ3MgYXR0cmlidXRlczpcbiAgICAvLyAtIElmIHRoZSBwcm9wZXJ0eSBpcyB0aGUgYGlkQXR0cmlidXRlYCwgc2tpcC5cbiAgICAvLyAtIElmIHRoZSBwcm9wZXJ0eSBpcyBhIGBNb2RlbGAsIGBDb2xsZWN0aW9uYCwgb3IgYENvbXB1dGVkUHJvcGVydHlgLCByZXNldCBpdC5cbiAgICAvLyAtIElmIHRoZSBwYXNzZWQgb2JqZWN0IGhhcyB0aGUgcHJvcGVydHksIHNldCBpdCB0byB0aGUgbmV3IHZhbHVlLlxuICAgIC8vIC0gSWYgdGhlIE1vZGVsIGhhcyBhIGRlZmF1bHQgdmFsdWUgZm9yIHRoaXMgcHJvcGVydHksIHNldCBpdCBiYWNrIHRvIGRlZmF1bHQuXG4gICAgLy8gLSBPdGhlcndpc2UsIHVuc2V0IHRoZSBhdHRyaWJ1dGUuXG4gICAgZm9yKGtleSBpbiB0aGlzLmF0dHJpYnV0ZXMpe1xuICAgICAgdmFsdWUgPSB0aGlzLmF0dHJpYnV0ZXNba2V5XTtcbiAgICAgIGlmKHZhbHVlID09PSBvYmpba2V5XSkgY29udGludWU7XG4gICAgICBlbHNlIGlmKF8uaXNVbmRlZmluZWQodmFsdWUpKSBvYmpba2V5XSAmJiAoY2hhbmdlZFtrZXldID0gb2JqW2tleV0pO1xuICAgICAgZWxzZSBpZiAoa2V5ID09PSB0aGlzLmlkQXR0cmlidXRlKSBjb250aW51ZTtcbiAgICAgIGVsc2UgaWYgKHZhbHVlLmlzQ29sbGVjdGlvbiB8fCB2YWx1ZS5pc01vZGVsIHx8IHZhbHVlLmlzQ29tcHV0ZWRQcm9wZXJ0eSl7XG4gICAgICAgIHZhbHVlLnJlc2V0KChvYmpba2V5XSB8fCBbXSksIHtzaWxlbnQ6IHRydWV9KTtcbiAgICAgICAgaWYodmFsdWUuaXNDb2xsZWN0aW9uKSBjaGFuZ2VkW2tleV0gPSBbXTtcbiAgICAgICAgZWxzZSBpZih2YWx1ZS5pc01vZGVsICYmIHZhbHVlLmlzQ29tcHV0ZWRQcm9wZXJ0eSkgY2hhbmdlZFtrZXldID0gdmFsdWUuY2FjaGUubW9kZWwuY2hhbmdlZDtcbiAgICAgICAgZWxzZSBpZih2YWx1ZS5pc01vZGVsKSBjaGFuZ2VkW2tleV0gPSB2YWx1ZS5jaGFuZ2VkXG4gICAgICB9XG4gICAgICBlbHNlIGlmIChvYmouaGFzT3duUHJvcGVydHkoa2V5KSl7IGNoYW5nZWRba2V5XSA9IG9ialtrZXldOyB9XG4gICAgICBlbHNlIGlmICh0aGlzLmRlZmF1bHRzLmhhc093blByb3BlcnR5KGtleSkgJiYgIV8uaXNGdW5jdGlvbih0aGlzLmRlZmF1bHRzW2tleV0pKXtcbiAgICAgICAgY2hhbmdlZFtrZXldID0gb2JqW2tleV0gPSB0aGlzLmRlZmF1bHRzW2tleV07XG4gICAgICB9XG4gICAgICBlbHNle1xuICAgICAgICBjaGFuZ2VkW2tleV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIHRoaXMudW5zZXQoa2V5LCB7c2lsZW50OiB0cnVlfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIEFueSB1bnNldCBjaGFuZ2VkIHZhbHVlcyB3aWxsIGJlIHNldCB0byBvYmpba2V5XVxuICAgIF8uZWFjaChvYmosIGZ1bmN0aW9uKHZhbHVlLCBrZXksIG9iail7XG4gICAgICBjaGFuZ2VkW2tleV0gPSBjaGFuZ2VkW2tleV0gfHwgb2JqW2tleV07XG4gICAgfSk7XG5cbiAgICAvLyBSZXNldCBvdXIgbW9kZWxcbiAgICBvYmogPSB0aGlzLnNldChvYmosIF8uZXh0ZW5kKHt9LCBvcHRpb25zLCB7c2lsZW50OiB0cnVlLCByZXNldDogZmFsc2V9KSk7XG5cbiAgICAvLyBUcmlnZ2VyIGN1c3RvbSByZXNldCBldmVudFxuICAgIHRoaXMuY2hhbmdlZCA9IGNoYW5nZWQ7XG4gICAgaWYgKCFvcHRpb25zLnNpbGVudCkgdGhpcy50cmlnZ2VyKCdyZXNldCcsIHRoaXMsIG9wdGlvbnMpO1xuXG4gICAgLy8gUmV0dXJuIG5ldyB2YWx1ZXNcbiAgICByZXR1cm4gb2JqO1xuICB9LFxuXG4gIC8vICoqTW9kZWwuR2V0KiogaXMgb3ZlcnJpZGRlbiB0byBwcm92aWRlIHN1cHBvcnQgZm9yIGdldHRpbmcgZnJvbSBhIGRlZXAgZGF0YSB0cmVlLlxuICAvLyBga2V5YCBtYXkgbm93IGJlIGFueSB2YWxpZCBqc29uLWxpa2UgaWRlbnRpZmllci4gRXg6IGBvYmouY29sbFszXS52YWx1ZWAuXG4gIC8vIEl0IG5lZWRzIHRvIHRyYXZlcnNlIGBNb2RlbHNgLCBgQ29sbGVjdGlvbnNgIGFuZCBgQ29tcHV0ZWQgUHJvcGVydGllc2AgdG9cbiAgLy8gZmluZCB0aGUgY29ycmVjdCB2YWx1ZS5cbiAgLy8gLSBJZiBrZXkgaXMgdW5kZWZpbmVkLCByZXR1cm4gYHVuZGVmaW5lZGAuXG4gIC8vIC0gSWYga2V5IGlzIGVtcHR5IHN0cmluZywgcmV0dXJuIGB0aGlzYC5cbiAgLy9cbiAgLy8gRm9yIGVhY2ggcGFydDpcbiAgLy8gLSBJZiBhIGBDb21wdXRlZCBQcm9wZXJ0eWAgYW5kIGBvcHRpb25zLnJhd2AgaXMgdHJ1ZSwgcmV0dXJuIGl0LlxuICAvLyAtIElmIGEgYENvbXB1dGVkIFByb3BlcnR5YCB0cmF2ZXJzZSB0byBpdHMgdmFsdWUuXG4gIC8vIC0gSWYgbm90IHNldCwgcmV0dXJuIGl0cyBmYWxzeSB2YWx1ZS5cbiAgLy8gLSBJZiBhIGBNb2RlbGAsIGBDb2xsZWN0aW9uYCwgb3IgcHJpbWl0aXZlIHZhbHVlLCB0cmF2ZXJzZSB0byBpdC5cbiAgZ2V0OiBmdW5jdGlvbihrZXksIG9wdGlvbnMpe1xuICAgIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSk7XG4gICAgdmFyIHBhcnRzICA9ICQuc3BsaXRQYXRoKGtleSksXG4gICAgICAgIHJlc3VsdCA9IHRoaXMsXG4gICAgICAgIGksIGw9cGFydHMubGVuZ3RoO1xuXG4gICAgaWYoXy5pc1VuZGVmaW5lZChrZXkpIHx8IF8uaXNOdWxsKGtleSkpIHJldHVybiB1bmRlZmluZWQ7XG4gICAgaWYoa2V5ID09PSAnJyB8fCBwYXJ0cy5sZW5ndGggPT09IDApIHJldHVybiByZXN1bHQ7XG5cbiAgICBmb3IgKGkgPSAwOyBpIDwgbDsgaSsrKSB7XG4gICAgICBpZihyZXN1bHQgJiYgcmVzdWx0LmlzQ29tcHV0ZWRQcm9wZXJ0eSAmJiBvcHRpb25zLnJhdykgcmV0dXJuIHJlc3VsdDtcbiAgICAgIGlmKHJlc3VsdCAmJiByZXN1bHQuaXNDb21wdXRlZFByb3BlcnR5KSByZXN1bHQgPSByZXN1bHQudmFsdWUoKTtcbiAgICAgIGlmKF8uaXNVbmRlZmluZWQocmVzdWx0KSB8fCBfLmlzTnVsbChyZXN1bHQpKSByZXR1cm4gcmVzdWx0O1xuICAgICAgaWYocGFydHNbaV0gPT09ICdAcGFyZW50JykgcmVzdWx0ID0gcmVzdWx0Ll9fcGFyZW50X187XG4gICAgICBlbHNlIGlmKHJlc3VsdC5pc0NvbGxlY3Rpb24pIHJlc3VsdCA9IHJlc3VsdC5tb2RlbHNbcGFydHNbaV1dO1xuICAgICAgZWxzZSBpZihyZXN1bHQuaXNNb2RlbCkgcmVzdWx0ID0gcmVzdWx0LmF0dHJpYnV0ZXNbcGFydHNbaV1dO1xuICAgICAgZWxzZSBpZihyZXN1bHQgJiYgcmVzdWx0Lmhhc093blByb3BlcnR5KHBhcnRzW2ldKSkgcmVzdWx0ID0gcmVzdWx0W3BhcnRzW2ldXTtcbiAgICB9XG5cbiAgICBpZihyZXN1bHQgJiYgcmVzdWx0LmlzQ29tcHV0ZWRQcm9wZXJ0eSAmJiAhb3B0aW9ucy5yYXcpIHJlc3VsdCA9IHJlc3VsdC52YWx1ZSgpO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH0sXG5cblxuICAvLyAqKk1vZGVsLlNldCoqIGlzIG92ZXJyaWRkZW4gdG8gcHJvdmlkZSBzdXBwb3J0IGZvciBnZXR0aW5nIGZyb20gYSBkZWVwIGRhdGEgdHJlZS5cbiAgLy8gYGtleWAgbWF5IG5vdyBiZSBhbnkgdmFsaWQganNvbi1saWtlIGlkZW50aWZpZXIuIEV4OiBgb2JqLmNvbGxbM10udmFsdWVgLlxuICAvLyBJdCBuZWVkcyB0byB0cmF2ZXJzZSBgTW9kZWxzYCwgYENvbGxlY3Rpb25zYCBhbmQgYENvbXB1dGVkIFByb3BlcnRpZXNgIHRvXG4gIC8vIGZpbmQgdGhlIGNvcnJlY3QgdmFsdWUgdG8gY2FsbCB0aGUgb3JpZ2luYWwgYEJhY2tib25lLlNldGAgb24uXG4gIHNldDogZnVuY3Rpb24oa2V5LCB2YWwsIG9wdGlvbnMpe1xuXG4gICAgdmFyIGF0dHJzLCBhdHRyLCBuZXdLZXksIHRhcmdldCwgZGVzdGluYXRpb24sIHByb3BzID0gW10sIGxpbmVhZ2U7XG5cbiAgICBpZiAodHlwZW9mIGtleSA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGF0dHJzID0gKGtleS5pc01vZGVsKSA/IGtleS5hdHRyaWJ1dGVzIDoga2V5O1xuICAgICAgb3B0aW9ucyA9IHZhbDtcbiAgICB9XG4gICAgZWxzZSAoYXR0cnMgPSB7fSlba2V5XSA9IHZhbDtcbiAgICBvcHRpb25zIHx8IChvcHRpb25zID0ge30pO1xuXG4gICAgLy8gSWYgcmVzZXQgb3B0aW9uIHBhc3NlZCwgZG8gYSByZXNldC4gSWYgbm90aGluZyBwYXNzZWQsIHJldHVybi5cbiAgICBpZihvcHRpb25zLnJlc2V0ID09PSB0cnVlKSByZXR1cm4gdGhpcy5yZXNldChhdHRycywgb3B0aW9ucyk7XG4gICAgaWYob3B0aW9ucy5kZWZhdWx0cyA9PT0gdHJ1ZSkgdGhpcy5kZWZhdWx0cyA9IGF0dHJzO1xuICAgIGlmKF8uaXNFbXB0eShhdHRycykpIHJldHVybjtcblxuICAgIC8vIEZvciBlYWNoIGF0dHJpYnV0ZSBwYXNzZWQ6XG4gICAgZm9yKGtleSBpbiBhdHRycyl7XG4gICAgICB2YXIgdmFsID0gYXR0cnNba2V5XSxcbiAgICAgICAgICBwYXRocyA9ICQuc3BsaXRQYXRoKGtleSksXG4gICAgICAgICAgYXR0ciAgPSBwYXRocy5wb3AoKSB8fCAnJzsgICAgICAgICAgIC8vIFRoZSBrZXkgICAgICAgIGV4OiBmb29bMF0uYmFyIC0tPiBiYXJcbiAgICAgICAgICB0YXJnZXQgPSB0aGlzLmdldChwYXRocy5qb2luKCcuJykpLCAgLy8gVGhlIGVsZW1lbnQgICAgZXg6IGZvby5iYXIuYmF6IC0tPiBmb28uYmFyXG4gICAgICAgICAgbGluZWFnZTtcblxuICAgICAgLy8gSWYgdGFyZ2V0IGN1cnJlbnRseSBkb2VzbnQgZXhpc3QsIGNvbnN0cnVjdCBpdHMgdHJlZVxuICAgICAgaWYoXy5pc1VuZGVmaW5lZCh0YXJnZXQpKXtcbiAgICAgICAgdGFyZ2V0ID0gdGhpcztcbiAgICAgICAgXy5lYWNoKHBhdGhzLCBmdW5jdGlvbih2YWx1ZSl7XG4gICAgICAgICAgdmFyIHRtcCA9IHRhcmdldC5nZXQodmFsdWUpO1xuICAgICAgICAgIGlmKF8uaXNVbmRlZmluZWQodG1wKSkgdG1wID0gdGFyZ2V0LnNldCh2YWx1ZSwge30pLmdldCh2YWx1ZSk7XG4gICAgICAgICAgdGFyZ2V0ID0gdG1wO1xuICAgICAgICB9LCB0aGlzKTtcbiAgICAgIH1cblxuICAgICAgLy8gVGhlIG9sZCB2YWx1ZSBvZiBgYXR0cmAgaW4gYHRhcmdldGBcbiAgICAgIHZhciBkZXN0aW5hdGlvbiA9IHRhcmdldC5nZXQoYXR0ciwge3JhdzogdHJ1ZX0pIHx8IHt9O1xuXG4gICAgICAvLyBDcmVhdGUgdGhpcyBuZXcgb2JqZWN0J3MgbGluZWFnZS5cbiAgICAgIGxpbmVhZ2UgPSB7XG4gICAgICAgIG5hbWU6IGtleSxcbiAgICAgICAgcGFyZW50OiB0YXJnZXQsXG4gICAgICAgIHJvb3Q6IHRoaXMuX19yb290X18sXG4gICAgICAgIHBhdGg6IHBhdGhHZW5lcmF0b3IodGFyZ2V0LCBrZXkpLFxuICAgICAgICBzaWxlbnQ6IHRydWUsXG4gICAgICAgIGRlZmF1bHRzOiBvcHRpb25zLmRlZmF1bHRzXG4gICAgICB9XG4gICAgICAvLyAtIElmIHZhbCBpcyBgbnVsbGAgb3IgYHVuZGVmaW5lZGAsIHNldCB0byBkZWZhdWx0IHZhbHVlLlxuICAgICAgLy8gLSBJZiB2YWwgaXMgYSBgQ29tcHV0ZWQgUHJvcGVydHlgLCBnZXQgaXRzIGN1cnJlbnQgY2FjaGUgb2JqZWN0LlxuICAgICAgLy8gLSBJZiB2YWwgKGRlZmF1bHQgdmFsdWUgb3IgZXZhbHVhdGVkIGNvbXB1dGVkIHByb3BlcnR5KSBpcyBgbnVsbGAsIHNldCB0byBkZWZhdWx0IHZhbHVlIG9yIChmYWxsYmFjayBgdW5kZWZpbmVkYCkuXG4gICAgICAvLyAtIEVsc2UgSWYgYHtyYXc6IHRydWV9YCBvcHRpb24gaXMgcGFzc2VkLCBzZXQgdGhlIGV4YWN0IG9iamVjdCB0aGF0IHdhcyBwYXNzZWQuIE5vIHByb21vdGlvbiB0byBhIFJlYm91bmQgRGF0YSBvYmplY3QuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyBmdW5jdGlvbiBpcyB0aGUgc2FtZSBhcyB0aGUgY3VycmVudCBjb21wdXRlZCBwcm9wZXJ0eSwgY29udGludWUuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyB2YWx1ZSBpcyBhIGBGdW5jdGlvbmAsIHR1cm4gaXQgaW50byBhIGBDb21wdXRlZCBQcm9wZXJ0eWAuXG4gICAgICAvLyAtIEVsc2UgSWYgdGhpcyBpcyBnb2luZyB0byBiZSBhIGN5Y2xpY2FsIGRlcGVuZGFuY3ksIHVzZSB0aGUgb3JpZ2luYWwgb2JqZWN0LCBkb24ndCBtYWtlIGEgY29weS5cbiAgICAgIC8vIC0gRWxzZSBJZiB1cGRhdGluZyBhbiBleGlzdGluZyBvYmplY3Qgd2l0aCBpdHMgcmVzcGVjdGl2ZSBkYXRhIHR5cGUsIGxldCBCYWNrYm9uZSBoYW5kbGUgdGhlIG1lcmdlLlxuICAgICAgLy8gLSBFbHNlIElmIHRoaXMgdmFsdWUgaXMgYSBgTW9kZWxgIG9yIGBDb2xsZWN0aW9uYCwgY3JlYXRlIGEgbmV3IGNvcHkgb2YgaXQgdXNpbmcgaXRzIGNvbnN0cnVjdG9yLCBwcmVzZXJ2aW5nIGl0cyBkZWZhdWx0cyB3aGlsZSBlbnN1cmluZyBubyBzaGFyZWQgbWVtb3J5IGJldHdlZW4gb2JqZWN0cy5cbiAgICAgIC8vIC0gRWxzZSBJZiB0aGlzIHZhbHVlIGlzIGFuIGBBcnJheWAsIHR1cm4gaXQgaW50byBhIGBDb2xsZWN0aW9uYC5cbiAgICAgIC8vIC0gRWxzZSBJZiB0aGlzIHZhbHVlIGlzIGEgYE9iamVjdGAsIHR1cm4gaXQgaW50byBhIGBNb2RlbGAuXG4gICAgICAvLyAtIEVsc2UgdmFsIGlzIGEgcHJpbWl0aXZlIHZhbHVlLCBzZXQgaXQgYWNjb3JkaW5nbHkuXG5cblxuXG4gICAgICBpZihfLmlzTnVsbCh2YWwpIHx8IF8uaXNVbmRlZmluZWQodmFsKSkgdmFsID0gdGhpcy5kZWZhdWx0c1trZXldO1xuICAgICAgaWYodmFsICYmIHZhbC5pc0NvbXB1dGVkUHJvcGVydHkpIHZhbCA9IHZhbC52YWx1ZSgpO1xuICAgICAgaWYoXy5pc051bGwodmFsKSB8fCBfLmlzVW5kZWZpbmVkKHZhbCkpIHZhbCA9IHVuZGVmaW5lZDtcbiAgICAgIGVsc2UgaWYob3B0aW9ucy5yYXcgPT09IHRydWUpIHZhbCA9IHZhbDtcbiAgICAgIGVsc2UgaWYoZGVzdGluYXRpb24uaXNDb21wdXRlZFByb3BlcnR5ICYmIGRlc3RpbmF0aW9uLmZ1bmMgPT09IHZhbCkgY29udGludWU7XG4gICAgICBlbHNlIGlmKF8uaXNGdW5jdGlvbih2YWwpKSB2YWwgPSBuZXcgQ29tcHV0ZWRQcm9wZXJ0eSh2YWwsIGxpbmVhZ2UpO1xuICAgICAgZWxzZSBpZih2YWwuaXNEYXRhICYmIHRhcmdldC5oYXNQYXJlbnQodmFsKSkgdmFsID0gdmFsO1xuICAgICAgZWxzZSBpZiggZGVzdGluYXRpb24uaXNDb21wdXRlZFByb3BlcnR5IHx8XG4gICAgICAgICAgICAgICggZGVzdGluYXRpb24uaXNDb2xsZWN0aW9uICYmICggXy5pc0FycmF5KHZhbCkgfHwgdmFsLmlzQ29sbGVjdGlvbiApKSB8fFxuICAgICAgICAgICAgICAoIGRlc3RpbmF0aW9uLmlzTW9kZWwgJiYgKCBfLmlzT2JqZWN0KHZhbCkgfHwgdmFsLmlzTW9kZWwgKSkpe1xuICAgICAgICBkZXN0aW5hdGlvbi5zZXQodmFsLCBvcHRpb25zKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBlbHNlIGlmKHZhbC5pc0RhdGEgJiYgb3B0aW9ucy5jbG9uZSAhPT0gZmFsc2UpIHZhbCA9IG5ldyB2YWwuY29uc3RydWN0b3IodmFsLmF0dHJpYnV0ZXMgfHwgdmFsLm1vZGVscywgbGluZWFnZSk7XG4gICAgICBlbHNlIGlmKF8uaXNBcnJheSh2YWwpKSB2YWwgPSBuZXcgUmVib3VuZC5Db2xsZWN0aW9uKHZhbCwgbGluZWFnZSk7IC8vIFRPRE86IFJlbW92ZSBnbG9iYWwgcmVmZXJhbmNlXG4gICAgICBlbHNlIGlmKF8uaXNPYmplY3QodmFsKSkgdmFsID0gbmV3IE1vZGVsKHZhbCwgbGluZWFnZSk7XG5cbiAgICAgIC8vIElmIHZhbCBpcyBhIGRhdGEgb2JqZWN0LCBsZXQgdGhpcyBvYmplY3Qga25vdyBpdCBpcyBub3cgYSBwYXJlbnRcbiAgICAgIHRoaXMuX2hhc0FuY2VzdHJ5ID0gKHZhbCAmJiB2YWwuaXNEYXRhIHx8IGZhbHNlKTtcblxuICAgICAgLy8gU2V0IHRoZSB2YWx1ZVxuICAgICAgQmFja2JvbmUuTW9kZWwucHJvdG90eXBlLnNldC5jYWxsKHRhcmdldCwgYXR0ciwgdmFsLCBvcHRpb25zKTsgLy8gVE9ETzogRXZlbnQgY2xlYW51cCB3aGVuIHJlcGxhY2luZyBhIG1vZGVsIG9yIGNvbGxlY3Rpb24gd2l0aCBhbm90aGVyIHZhbHVlXG5cbiAgICB9O1xuXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgfSxcblxuICAvLyBSZWN1cnNpdmUgYHRvSlNPTmAgZnVuY3Rpb24gdHJhdmVyc2VzIHRoZSBkYXRhIHRyZWUgcmV0dXJuaW5nIGEgSlNPTiBvYmplY3QuXG4gIC8vIElmIHRoZXJlIGFyZSBhbnkgY3ljbGljIGRlcGVuZGFuY2llcyB0aGUgb2JqZWN0J3MgYGNpZGAgaXMgdXNlZCBpbnN0ZWFkIG9mIGxvb3BpbmcgaW5maW5pdGVseS5cbiAgdG9KU09OOiBmdW5jdGlvbigpIHtcbiAgICBpZiAodGhpcy5faXNTZXJpYWxpemluZykgcmV0dXJuIHRoaXMuaWQgfHwgdGhpcy5jaWQ7XG4gICAgdGhpcy5faXNTZXJpYWxpemluZyA9IHRydWU7XG4gICAgdmFyIGpzb24gPSBfLmNsb25lKHRoaXMuYXR0cmlidXRlcyk7XG4gICAgXy5lYWNoKGpzb24sIGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgIGlmKCBfLmlzTnVsbCh2YWx1ZSkgfHwgXy5pc1VuZGVmaW5lZCh2YWx1ZSkgKXsgcmV0dXJuOyB9XG4gICAgICAgIF8uaXNGdW5jdGlvbih2YWx1ZS50b0pTT04pICYmIChqc29uW25hbWVdID0gdmFsdWUudG9KU09OKCkpO1xuICAgIH0pO1xuICAgIHRoaXMuX2lzU2VyaWFsaXppbmcgPSBmYWxzZTtcbiAgICByZXR1cm4ganNvbjtcbiAgfVxuXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgTW9kZWw7XG4iLCIvLyBSZWJvdW5kIExhenkgVmFsdWVcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxudmFyIE5JTCA9IGZ1bmN0aW9uIE5JTCgpe30sXG4gICAgRU1QVFlfQVJSQVkgPSBbXTtcblxuZnVuY3Rpb24gTGF6eVZhbHVlKGZuLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgfHwgKG9wdGlvbnMgPSB7fSlcbiAgdGhpcy5jaWQgPSBfLnVuaXF1ZUlkKCdsYXp5VmFsdWUnKTtcbiAgdGhpcy52YWx1ZUZuID0gZm47XG4gIHRoaXMuY29udGV4dCA9IG9wdGlvbnMuY29udGV4dCB8fCBudWxsO1xuICB0aGlzLm1vcnBoID0gb3B0aW9ucy5tb3JwaCB8fCBudWxsO1xuICB0aGlzLmF0dHJNb3JwaCA9IG9wdGlvbnMuYXR0ck1vcnBoIHx8IG51bGw7XG4gIF8uYmluZEFsbCh0aGlzLCAndmFsdWUnLCAnc2V0JywgJ2FkZERlcGVuZGVudFZhbHVlJywgJ2FkZE9ic2VydmVyJywgJ25vdGlmeScsICdvbk5vdGlmeScsICdkZXN0cm95Jyk7XG59XG5cbkxhenlWYWx1ZS5wcm90b3R5cGUgPSB7XG4gIGlzTGF6eVZhbHVlOiB0cnVlLFxuICBwYXJlbnQ6IG51bGwsIC8vIFRPRE86IGlzIHBhcmVudCBldmVuIG5lZWRlZD8gY291bGQgYmUgbW9kZWxlZCBhcyBhIHN1YnNjcmliZXJcbiAgY2hpbGRyZW46IG51bGwsXG4gIG9ic2VydmVyczogbnVsbCxcbiAgY2FjaGU6IE5JTCxcbiAgdmFsdWVGbjogbnVsbCxcbiAgc3Vic2NyaWJlcnM6IG51bGwsIC8vIFRPRE86IGRvIHdlIG5lZWQgbXVsdGlwbGUgc3Vic2NyaWJlcnM/XG4gIF9jaGlsZFZhbHVlczogbnVsbCwgLy8ganVzdCBmb3IgcmV1c2luZyB0aGUgYXJyYXksIG1pZ2h0IG5vdCB3b3JrIHdlbGwgaWYgY2hpbGRyZW4ubGVuZ3RoIGNoYW5nZXMgYWZ0ZXIgY29tcHV0YXRpb25cblxuICB2YWx1ZTogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGNhY2hlID0gdGhpcy5jYWNoZTtcbiAgICBpZiAoY2FjaGUgIT09IE5JTCkgeyByZXR1cm4gY2FjaGU7IH1cblxuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW47XG4gICAgaWYgKGNoaWxkcmVuKSB7XG4gICAgICB2YXIgY2hpbGQsXG4gICAgICAgICAgdmFsdWVzID0gdGhpcy5fY2hpbGRWYWx1ZXMgfHwgbmV3IEFycmF5KGNoaWxkcmVuLmxlbmd0aCk7XG5cbiAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gY2hpbGRyZW4ubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICAgIGNoaWxkID0gY2hpbGRyZW5baV07XG4gICAgICAgIHZhbHVlc1tpXSA9IChjaGlsZCAmJiBjaGlsZC5pc0xhenlWYWx1ZSkgPyBjaGlsZC52YWx1ZSgpIDogY2hpbGQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0aGlzLmNhY2hlID0gdGhpcy52YWx1ZUZuKHZhbHVlcyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB0aGlzLmNhY2hlID0gdGhpcy52YWx1ZUZuKEVNUFRZX0FSUkFZKTtcbiAgICB9XG4gIH0sXG5cbiAgc2V0OiBmdW5jdGlvbihrZXksIHZhbHVlLCBvcHRpb25zKXtcbiAgICBpZih0aGlzLmNvbnRleHQpe1xuICAgICAgcmV0dXJuIHRoaXMuY29udGV4dC5zZXQoa2V5LCB2YWx1ZSwgb3B0aW9ucyk7XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9LFxuXG4gIGFkZERlcGVuZGVudFZhbHVlOiBmdW5jdGlvbih2YWx1ZSkge1xuICAgIHZhciBjaGlsZHJlbiA9IHRoaXMuY2hpbGRyZW47XG4gICAgaWYgKCFjaGlsZHJlbikge1xuICAgICAgY2hpbGRyZW4gPSB0aGlzLmNoaWxkcmVuID0gW3ZhbHVlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgY2hpbGRyZW4ucHVzaCh2YWx1ZSk7XG4gICAgfVxuXG4gICAgaWYgKHZhbHVlICYmIHZhbHVlLmlzTGF6eVZhbHVlKSB7IHZhbHVlLnBhcmVudCA9IHRoaXM7IH1cblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIGFkZE9ic2VydmVyOiBmdW5jdGlvbihwYXRoLCBjb250ZXh0KSB7XG4gICAgdmFyIG9ic2VydmVycyA9IHRoaXMub2JzZXJ2ZXJzIHx8ICh0aGlzLm9ic2VydmVycyA9IFtdKSxcbiAgICAgICAgcG9zaXRpb24sIHJlcztcblxuICAgIGlmKCFfLmlzT2JqZWN0KGNvbnRleHQpIHx8ICFfLmlzU3RyaW5nKHBhdGgpKSByZXR1cm4gY29uc29sZS5lcnJvcignRXJyb3IgYWRkaW5nIG9ic2VydmVyIGZvcicsIGNvbnRleHQsIHBhdGgpO1xuXG4gICAgLy8gRW5zdXJlIF9vYnNlcnZlcnMgZXhpc3RzIGFuZCBpcyBhbiBvYmplY3RcbiAgICBjb250ZXh0Ll9fb2JzZXJ2ZXJzID0gY29udGV4dC5fX29ic2VydmVycyB8fCB7fTtcbiAgICAvLyBFbnN1cmUgX19vYnNlcnZlcnNbcGF0aF0gZXhpc3RzIGFuZCBpcyBhbiBhcnJheVxuICAgIGNvbnRleHQuX19vYnNlcnZlcnNbcGF0aF0gPSBjb250ZXh0Ll9fb2JzZXJ2ZXJzW3BhdGhdIHx8IHtjb2xsZWN0aW9uOiBbXSwgbW9kZWw6IFtdfTtcblxuICAgIC8vIFNhdmUgdGhlIHR5cGUgb2Ygb2JqZWN0IGV2ZW50cyB0aGlzIG9ic2VydmVyIGlzIGZvclxuICAgIHJlcyA9IGNvbnRleHQuZ2V0KHRoaXMucGF0aCk7XG4gICAgcmVzID0gKHJlcyAmJiByZXMuaXNDb2xsZWN0aW9uKSA/ICdjb2xsZWN0aW9uJyA6ICdtb2RlbCc7XG5cbiAgICAvLyBBZGQgb3VyIGNhbGxiYWNrLCBzYXZlIHRoZSBwb3NpdGlvbiBpdCBpcyBiZWluZyBpbnNlcnRlZCBzbyB3ZSBjYW4gZ2FyYmFnZSBjb2xsZWN0IGxhdGVyLlxuICAgIHBvc2l0aW9uID0gY29udGV4dC5fX29ic2VydmVyc1twYXRoXVtyZXNdLnB1c2godGhpcykgLSAxO1xuXG4gICAgLy8gTGF6eXZhbHVlIG5lZWRzIHJlZmVyYW5jZSB0byBpdHMgb2JzZXJ2ZXJzIHRvIHJlbW92ZSBsaXN0ZW5lcnMgb24gZGVzdHJveVxuICAgIG9ic2VydmVycy5wdXNoKHtjb250ZXh0OiBjb250ZXh0LCBwYXRoOiBwYXRoLCBpbmRleDogcG9zaXRpb259KTtcblxuICAgIHJldHVybiB0aGlzO1xuICB9LFxuXG4gIG5vdGlmeTogZnVuY3Rpb24oc2VuZGVyKSB7XG4gICAgLy8gVE9ETzogVGhpcyBjaGVjayB3b24ndCBiZSBuZWNlc3Nhcnkgb25jZSByZW1vdmVkIERPTSBoYXMgYmVlbiBjbGVhbmVkIG9mIGFueSBiaW5kaW5ncy5cbiAgICAvLyBJZiB0aGlzIGxhenlWYWx1ZSdzIG1vcnBoIGRvZXMgbm90IGhhdmUgYW4gaW1tZWRpYXRlIHBhcmVudE5vZGUsIGl0IGhhcyBiZWVuIHJlbW92ZWQgZnJvbSB0aGUgZG9tIHRyZWUuIERlc3Ryb3kgaXQuXG4gICAgLy8gUmlnaHQgbm93LCBET00gdGhhdCBjb250YWlucyBtb3JwaHMgdGhyb3cgYW4gZXJyb3IgaWYgaXQgaXMgcmVtb3ZlZCBieSBhbm90aGVyIGxhenl2YWx1ZSBiZWZvcmUgdGhvc2UgbW9ycGhzIHJlLWV2YWx1YXRlLlxuICAgIGlmKHRoaXMubW9ycGggJiYgdGhpcy5tb3JwaC5maXJzdE5vZGUgJiYgIXRoaXMubW9ycGguZmlyc3ROb2RlLnBhcmVudE5vZGUpIHJldHVybiB0aGlzLmRlc3Ryb3koKTtcbiAgICB2YXIgY2FjaGUgPSB0aGlzLmNhY2hlLFxuICAgICAgICBwYXJlbnQsXG4gICAgICAgIHN1YnNjcmliZXJzO1xuXG4gICAgaWYgKGNhY2hlICE9PSBOSUwpIHtcbiAgICAgIHBhcmVudCA9IHRoaXMucGFyZW50O1xuICAgICAgc3Vic2NyaWJlcnMgPSB0aGlzLnN1YnNjcmliZXJzO1xuICAgICAgY2FjaGUgPSB0aGlzLmNhY2hlID0gTklMO1xuICAgICAgaWYgKHBhcmVudCkgeyBwYXJlbnQubm90aWZ5KHRoaXMpOyB9XG4gICAgICBpZiAoIXN1YnNjcmliZXJzKSB7IHJldHVybjsgfVxuICAgICAgZm9yICh2YXIgaSA9IDAsIGwgPSBzdWJzY3JpYmVycy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgICAgc3Vic2NyaWJlcnNbaV0odGhpcyk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIG9uTm90aWZ5OiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgIHZhciBzdWJzY3JpYmVycyA9IHRoaXMuc3Vic2NyaWJlcnMgfHwgKHRoaXMuc3Vic2NyaWJlcnMgPSBbXSk7XG4gICAgc3Vic2NyaWJlcnMucHVzaChjYWxsYmFjayk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH0sXG5cbiAgZGVzdHJveTogZnVuY3Rpb24oKSB7XG4gICAgXy5lYWNoKHRoaXMuY2hpbGRyZW4sIGZ1bmN0aW9uKGNoaWxkKXtcbiAgICAgIGlmIChjaGlsZCAmJiBjaGlsZC5pc0xhenlWYWx1ZSl7IGNoaWxkLmRlc3Ryb3koKTsgfVxuICAgIH0pO1xuICAgIF8uZWFjaCh0aGlzLnN1YnNjcmliZXJzLCBmdW5jdGlvbihzdWJzY3JpYmVyKXtcbiAgICAgIGlmIChzdWJzY3JpYmVyICYmIHN1YnNjcmliZXIuaXNMYXp5VmFsdWUpeyBzdWJzY3JpYmVyLmRlc3Ryb3koKTsgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5wYXJlbnQgPSB0aGlzLmNoaWxkcmVuID0gdGhpcy5jYWNoZSA9IHRoaXMudmFsdWVGbiA9IHRoaXMuc3Vic2NyaWJlcnMgPSB0aGlzLl9jaGlsZFZhbHVlcyA9IG51bGw7XG5cbiAgICBfLmVhY2godGhpcy5vYnNlcnZlcnMsIGZ1bmN0aW9uKG9ic2VydmVyKXtcbiAgICAgIGlmKF8uaXNPYmplY3Qob2JzZXJ2ZXIuY29udGV4dC5fX29ic2VydmVyc1tvYnNlcnZlci5wYXRoXSkpe1xuICAgICAgICBkZWxldGUgb2JzZXJ2ZXIuY29udGV4dC5fX29ic2VydmVyc1tvYnNlcnZlci5wYXRoXVtvYnNlcnZlci5pbmRleF07XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICB0aGlzLm9ic2VydmVycyA9IG51bGw7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IExhenlWYWx1ZTtcbiIsIi8vIFJlYm91bmQgRGF0YVxuLy8gLS0tLS0tLS0tLS0tLS0tLVxuLy8gVGhlc2UgYXJlIG1ldGhvZHMgaW5oZXJpdGVkIGJ5IGFsbCBSZWJvdW5kIGRhdGEgdHlwZXMg4oCTICoqTW9kZWxzKiosXG4vLyAqKkNvbGxlY3Rpb25zKiogYW5kICoqQ29tcHV0ZWQgUHJvcGVydGllcyoqIOKAkyBhbmQgY29udHJvbCB0cmVlIGFuY2VzdHJ5XG4vLyB0cmFja2luZywgZGVlcCBldmVudCBwcm9wYWdhdGlvbiBhbmQgdHJlZSBkZXN0cnVjdGlvbi5cblxuaW1wb3J0IE1vZGVsIGZyb20gXCJyZWJvdW5kLWRhdGEvbW9kZWxcIjtcbmltcG9ydCBDb2xsZWN0aW9uIGZyb20gXCJyZWJvdW5kLWRhdGEvY29sbGVjdGlvblwiO1xuaW1wb3J0IENvbXB1dGVkUHJvcGVydHkgZnJvbSBcInJlYm91bmQtZGF0YS9jb21wdXRlZC1wcm9wZXJ0eVwiO1xuaW1wb3J0ICQgZnJvbSBcInJlYm91bmQtY29tcG9uZW50L3V0aWxzXCI7XG5cbnZhciBzaGFyZWRNZXRob2RzID0ge1xuICAvLyBXaGVuIGEgY2hhbmdlIGV2ZW50IHByb3BhZ2F0ZXMgdXAgdGhlIHRyZWUgaXQgbW9kaWZpZXMgdGhlIHBhdGggcGFydCBvZlxuICAvLyBgY2hhbmdlOjxwYXRoPmAgdG8gcmVmbGVjdCB0aGUgZnVsbHkgcXVhbGlmaWVkIHBhdGggcmVsYXRpdmUgdG8gdGhhdCBvYmplY3QuXG4gIC8vIEV4OiBXb3VsZCB0cmlnZ2VyIGBjaGFuZ2U6dmFsYCwgYGNoYW5nZTpbMF0udmFsYCwgYGNoYW5nZTphcnJbMF0udmFsYCBhbmQgYG9iai5hcnJbMF0udmFsYFxuICAvLyBvbiBlYWNoIHBhcmVudCBhcyBpdCBpcyBwcm9wYWdhdGVkIHVwIHRoZSB0cmVlLlxuICBwcm9wYWdhdGVFdmVudDogZnVuY3Rpb24odHlwZSwgbW9kZWwpe1xuICAgIGlmKHRoaXMuX19wYXJlbnRfXyA9PT0gdGhpcyB8fCB0eXBlID09PSAnZGlydHknKSByZXR1cm47XG4gICAgaWYodHlwZS5pbmRleE9mKCdjaGFuZ2U6JykgPT09IDAgJiYgbW9kZWwuaXNNb2RlbCl7XG4gICAgICBpZih0aGlzLmlzQ29sbGVjdGlvbiAmJiB+dHlwZS5pbmRleE9mKCdjaGFuZ2U6WycpKSByZXR1cm47XG4gICAgICB2YXIga2V5LFxuICAgICAgICAgIHBhdGggPSBtb2RlbC5fX3BhdGgoKS5yZXBsYWNlKHRoaXMuX19wYXJlbnRfXy5fX3BhdGgoKSwgJycpLnJlcGxhY2UoL15cXC4vLCAnJyksXG4gICAgICAgICAgY2hhbmdlZCA9IG1vZGVsLmNoYW5nZWRBdHRyaWJ1dGVzKCk7XG5cbiAgICAgIGZvcihrZXkgaW4gY2hhbmdlZCl7XG4gICAgICAgIC8vIFRPRE86IE1vZGlmeWluZyBhcmd1bWVudHMgYXJyYXkgaXMgYmFkLiBjaGFuZ2UgdGhpc1xuICAgICAgICBhcmd1bWVudHNbMF0gPSAoJ2NoYW5nZTonICsgcGF0aCArIChwYXRoICYmICcuJykgKyBrZXkpOyAvLyBqc2hpbnQgaWdub3JlOmxpbmVcbiAgICAgICAgdGhpcy5fX3BhcmVudF9fLnRyaWdnZXIuYXBwbHkodGhpcy5fX3BhcmVudF9fLCBhcmd1bWVudHMpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICByZXR1cm4gdGhpcy5fX3BhcmVudF9fLnRyaWdnZXIuYXBwbHkodGhpcy5fX3BhcmVudF9fLCBhcmd1bWVudHMpO1xuICB9LFxuXG4gIC8vIFNldCB0aGlzIGRhdGEgb2JqZWN0J3MgcGFyZW50IHRvIGBwYXJlbnRgIGFuZCwgYXMgbG9uZyBhcyBhIGRhdGEgb2JqZWN0IGlzXG4gIC8vIG5vdCBpdHMgb3duIHBhcmVudCwgcHJvcGFnYXRlIGV2ZXJ5IGV2ZW50IHRyaWdnZXJlZCBvbiBgdGhpc2AgdXAgdGhlIHRyZWUuXG4gIHNldFBhcmVudDogZnVuY3Rpb24ocGFyZW50KXtcbiAgICBpZih0aGlzLl9fcGFyZW50X18pIHRoaXMub2ZmKCdhbGwnLCB0aGlzLnByb3BhZ2F0ZUV2ZW50KTtcbiAgICB0aGlzLl9fcGFyZW50X18gPSBwYXJlbnQ7XG4gICAgdGhpcy5faGFzQW5jZXN0cnkgPSB0cnVlO1xuICAgIGlmKHBhcmVudCAhPT0gdGhpcykgdGhpcy5vbignYWxsJywgdGhpcy5fX3BhcmVudF9fLnByb3BhZ2F0ZUV2ZW50KTtcbiAgICByZXR1cm4gcGFyZW50O1xuICB9LFxuXG4gIC8vIFJlY3Vyc2l2ZWx5IHNldCBhIGRhdGEgdHJlZSdzIHJvb3QgZWxlbWVudCBzdGFydGluZyB3aXRoIGB0aGlzYCB0byB0aGUgZGVlcGVzdCBjaGlsZC5cbiAgLy8gVE9ETzogSSBkb250IGxpa2UgdGhpcyByZWN1cnNpdmVseSBzZXR0aW5nIGVsZW1lbnRzIHJvb3Qgd2hlbiBvbmUgZWxlbWVudCdzIHJvb3QgY2hhbmdlcy4gRml4IHRoaXMuXG4gIHNldFJvb3Q6IGZ1bmN0aW9uIChyb290KXtcbiAgICB2YXIgb2JqID0gdGhpcztcbiAgICBvYmouX19yb290X18gPSByb290O1xuICAgIHZhciB2YWwgPSBvYmoubW9kZWxzIHx8ICBvYmouYXR0cmlidXRlcyB8fCBvYmouY2FjaGU7XG4gICAgXy5lYWNoKHZhbCwgZnVuY3Rpb24odmFsdWUsIGtleSl7XG4gICAgICBpZih2YWx1ZSAmJiB2YWx1ZS5pc0RhdGEpe1xuICAgICAgICB2YWx1ZS5zZXRSb290KHJvb3QpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiByb290O1xuICB9LFxuXG4gIC8vIFRlc3RzIHRvIHNlZSBpZiBgdGhpc2AgaGFzIGEgcGFyZW50IGBvYmpgLlxuICBoYXNQYXJlbnQ6IGZ1bmN0aW9uKG9iail7XG4gICAgdmFyIHRtcCA9IHRoaXM7XG4gICAgd2hpbGUodG1wICE9PSBvYmope1xuICAgICAgdG1wID0gdG1wLl9fcGFyZW50X187XG4gICAgICBpZihfLmlzVW5kZWZpbmVkKHRtcCkpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmKHRtcCA9PT0gb2JqKSByZXR1cm4gdHJ1ZTtcbiAgICAgIGlmKHRtcC5fX3BhcmVudF9fID09PSB0bXApIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG4gIH0sXG5cbiAgLy8gRGUtaW5pdGlhbGl6ZXMgYSBkYXRhIHRyZWUgc3RhcnRpbmcgd2l0aCBgdGhpc2AgYW5kIHJlY3Vyc2l2ZWx5IGNhbGxpbmcgYGRlaW5pdGlhbGl6ZSgpYCBvbiBlYWNoIGNoaWxkLlxuICBkZWluaXRpYWxpemU6IGZ1bmN0aW9uICgpIHtcblxuICAvLyBVbmRlbGVnYXRlIEJhY2tib25lIEV2ZW50cyBmcm9tIHRoaXMgZGF0YSBvYmplY3RcbiAgICBpZiAodGhpcy51bmRlbGVnYXRlRXZlbnRzKSB0aGlzLnVuZGVsZWdhdGVFdmVudHMoKTtcbiAgICBpZiAodGhpcy5zdG9wTGlzdGVuaW5nKSB0aGlzLnN0b3BMaXN0ZW5pbmcoKTtcbiAgICBpZiAodGhpcy5vZmYpIHRoaXMub2ZmKCk7XG4gICAgaWYgKHRoaXMudW53aXJlKSB0aGlzLnVud2lyZSgpO1xuXG4gIC8vIERlc3Ryb3kgdGhpcyBkYXRhIG9iamVjdCdzIGxpbmVhZ2VcbiAgICBkZWxldGUgdGhpcy5fX3BhcmVudF9fO1xuICAgIGRlbGV0ZSB0aGlzLl9fcm9vdF9fO1xuICAgIGRlbGV0ZSB0aGlzLl9fcGF0aDtcblxuICAvLyBJZiB0aGVyZSBpcyBhIGRvbSBlbGVtZW50IGFzc29jaWF0ZWQgd2l0aCB0aGlzIGRhdGEgb2JqZWN0LCBkZXN0cm95IGFsbCBsaXN0ZW5lcnMgYXNzb2NpYXRlZCB3aXRoIGl0LlxuICAvLyBSZW1vdmUgYWxsIGV2ZW50IGxpc3RlbmVycyBmcm9tIHRoaXMgZG9tIGVsZW1lbnQsIHJlY3Vyc2l2ZWx5IHJlbW92ZSBlbGVtZW50IGxhenl2YWx1ZXMsXG4gIC8vIGFuZCB0aGVuIHJlbW92ZSB0aGUgZWxlbWVudCByZWZlcmFuY2UgaXRzZWxmLlxuICAgIGlmKHRoaXMuZWwpe1xuICAgICAgXy5lYWNoKHRoaXMuZWwuX19saXN0ZW5lcnMsIGZ1bmN0aW9uKGhhbmRsZXIsIGV2ZW50VHlwZSl7XG4gICAgICAgIGlmICh0aGlzLmVsLnJlbW92ZUV2ZW50TGlzdGVuZXIpIHRoaXMuZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcbiAgICAgICAgaWYgKHRoaXMuZWwuZGV0YWNoRXZlbnQpIHRoaXMuZWwuZGV0YWNoRXZlbnQoJ29uJytldmVudFR5cGUsIGhhbmRsZXIpO1xuICAgICAgfSwgdGhpcyk7XG4gICAgICAkKHRoaXMuZWwpLndhbGtUaGVET00oZnVuY3Rpb24oZWwpe1xuICAgICAgICBpZihlbC5fX2xhenlWYWx1ZSAmJiBlbC5fX2xhenlWYWx1ZS5kZXN0cm95KCkpIG4uX19sYXp5VmFsdWUuZGVzdHJveSgpO1xuICAgICAgfSk7XG4gICAgICBkZWxldGUgdGhpcy5lbC5fX2xpc3RlbmVycztcbiAgICAgIGRlbGV0ZSB0aGlzLmVsLl9fZXZlbnRzO1xuICAgICAgZGVsZXRlIHRoaXMuJGVsO1xuICAgICAgZGVsZXRlIHRoaXMuZWw7XG4gICAgfVxuXG4gIC8vIENsZWFuIHVwIEhvb2sgY2FsbGJhY2sgcmVmZXJlbmNlc1xuICAgIGRlbGV0ZSB0aGlzLl9fb2JzZXJ2ZXJzO1xuXG4gIC8vIE1hcmsgYXMgZGVpbml0aWFsaXplZCBzbyB3ZSBkb24ndCBsb29wIG9uIGN5Y2xpYyBkZXBlbmRhbmNpZXMuXG4gICAgdGhpcy5kZWluaXRpYWxpemVkID0gdHJ1ZTtcblxuICAvLyBEZXN0cm95IGFsbCBjaGlsZHJlbiBvZiB0aGlzIGRhdGEgb2JqZWN0LlxuICAvLyBJZiBhIENvbGxlY3Rpb24sIGRlLWluaXQgYWxsIG9mIGl0cyBNb2RlbHMsIGlmIGEgTW9kZWwsIGRlLWluaXQgYWxsIG9mIGl0c1xuICAvLyBBdHRyaWJ1dGVzLCBpZiBhIENvbXB1dGVkIFByb3BlcnR5LCBkZS1pbml0IGl0cyBDYWNoZSBvYmplY3RzLlxuICAgIF8uZWFjaCh0aGlzLm1vZGVscywgZnVuY3Rpb24odmFsKXsgdmFsICYmIHZhbC5kZWluaXRpYWxpemUgJiYgdmFsLmRlaW5pdGlhbGl6ZSgpOyB9KTtcbiAgICB0aGlzLm1vZGVscyAmJiAodGhpcy5tb2RlbHMubGVuZ3RoID0gMCk7XG4gICAgXy5lYWNoKHRoaXMuYXR0cmlidXRlcywgKHZhbCwga2V5KSA9PiB7IGRlbGV0ZSB0aGlzLmF0dHJpYnV0ZXNba2V5XTsgdmFsICYmIHZhbC5kZWluaXRpYWxpemUgJiYgdmFsLmRlaW5pdGlhbGl6ZSgpOyB9KTtcbiAgICBpZih0aGlzLmNhY2hlKXtcbiAgICAgIHRoaXMuY2FjaGUuY29sbGVjdGlvbi5kZWluaXRpYWxpemUoKTtcbiAgICAgIHRoaXMuY2FjaGUubW9kZWwuZGVpbml0aWFsaXplKCk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBFeHRlbmQgYWxsIG9mIHRoZSAqKlJlYm91bmQgRGF0YSoqIHByb3RvdHlwZXMgd2l0aCB0aGVzZSBzaGFyZWQgbWV0aG9kc1xuXy5leHRlbmQoTW9kZWwucHJvdG90eXBlLCBzaGFyZWRNZXRob2RzKTtcbl8uZXh0ZW5kKENvbGxlY3Rpb24ucHJvdG90eXBlLCBzaGFyZWRNZXRob2RzKTtcbl8uZXh0ZW5kKENvbXB1dGVkUHJvcGVydHkucHJvdG90eXBlLCBzaGFyZWRNZXRob2RzKTtcblxuZXhwb3J0IHsgTW9kZWwsIENvbGxlY3Rpb24sIENvbXB1dGVkUHJvcGVydHkgfTtcbiIsIi8vIFJlYm91bmQgVXRpbHNcbi8vIC0tLS0tLS0tLS0tLS0tLS1cblxudmFyICQgPSBmdW5jdGlvbihxdWVyeSl7XG4gIHJldHVybiBuZXcgdXRpbHMocXVlcnkpO1xufTtcblxudmFyIHV0aWxzID0gZnVuY3Rpb24ocXVlcnkpe1xuICB2YXIgaSwgc2VsZWN0b3IgPSBfLmlzRWxlbWVudChxdWVyeSkgJiYgW3F1ZXJ5XSB8fCAocXVlcnkgPT09IGRvY3VtZW50KSAmJiBbZG9jdW1lbnRdIHx8IF8uaXNTdHJpbmcocXVlcnkpICYmIHF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpIHx8IFtdO1xuICB0aGlzLmxlbmd0aCA9IHNlbGVjdG9yLmxlbmd0aDtcblxuICAvLyBBZGQgc2VsZWN0b3IgdG8gb2JqZWN0IGZvciBtZXRob2QgY2hhaW5pbmdcbiAgZm9yIChpPTA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB0aGlzW2ldID0gc2VsZWN0b3JbaV07XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbmZ1bmN0aW9uIHJldHVybkZhbHNlKCl7cmV0dXJuIGZhbHNlO31cbmZ1bmN0aW9uIHJldHVyblRydWUoKXtyZXR1cm4gdHJ1ZTt9XG5cbiQuRXZlbnQgPSBmdW5jdGlvbiggc3JjLCBwcm9wcyApIHtcblx0Ly8gQWxsb3cgaW5zdGFudGlhdGlvbiB3aXRob3V0IHRoZSAnbmV3JyBrZXl3b3JkXG5cdGlmICggISh0aGlzIGluc3RhbmNlb2YgJC5FdmVudCkgKSB7XG5cdFx0cmV0dXJuIG5ldyAkLkV2ZW50KCBzcmMsIHByb3BzICk7XG5cdH1cblxuXHQvLyBFdmVudCBvYmplY3Rcblx0aWYgKCBzcmMgJiYgc3JjLnR5cGUgKSB7XG5cdFx0dGhpcy5vcmlnaW5hbEV2ZW50ID0gc3JjO1xuXHRcdHRoaXMudHlwZSA9IHNyYy50eXBlO1xuXG5cdFx0Ly8gRXZlbnRzIGJ1YmJsaW5nIHVwIHRoZSBkb2N1bWVudCBtYXkgaGF2ZSBiZWVuIG1hcmtlZCBhcyBwcmV2ZW50ZWRcblx0XHQvLyBieSBhIGhhbmRsZXIgbG93ZXIgZG93biB0aGUgdHJlZTsgcmVmbGVjdCB0aGUgY29ycmVjdCB2YWx1ZS5cblx0XHR0aGlzLmlzRGVmYXVsdFByZXZlbnRlZCA9IHNyYy5kZWZhdWx0UHJldmVudGVkIHx8XG5cdFx0XHRcdHNyYy5kZWZhdWx0UHJldmVudGVkID09PSB1bmRlZmluZWQgJiZcblx0XHRcdFx0Ly8gU3VwcG9ydDogQW5kcm9pZDw0LjBcblx0XHRcdFx0c3JjLnJldHVyblZhbHVlID09PSBmYWxzZSA/XG5cdFx0XHRyZXR1cm5UcnVlIDpcblx0XHRcdHJldHVybkZhbHNlO1xuXG5cdC8vIEV2ZW50IHR5cGVcblx0fSBlbHNlIHtcblx0XHR0aGlzLnR5cGUgPSBzcmM7XG5cdH1cblxuXHQvLyBQdXQgZXhwbGljaXRseSBwcm92aWRlZCBwcm9wZXJ0aWVzIG9udG8gdGhlIGV2ZW50IG9iamVjdFxuXHRpZiAoIHByb3BzICkge1xuXHRcdF8uZXh0ZW5kKCB0aGlzLCBwcm9wcyApO1xuXHR9XG5cbiAgLy8gQ29weSBvdmVyIGFsbCBvcmlnaW5hbCBldmVudCBwcm9wZXJ0aWVzXG4gIF8uZXh0ZW5kKHRoaXMsIF8ucGljayggdGhpcy5vcmlnaW5hbEV2ZW50LCBbXG4gICAgICBcImFsdEtleVwiLCBcImJ1YmJsZXNcIiwgXCJjYW5jZWxhYmxlXCIsIFwiY3RybEtleVwiLCBcImN1cnJlbnRUYXJnZXRcIiwgXCJldmVudFBoYXNlXCIsXG4gICAgICBcIm1ldGFLZXlcIiwgXCJyZWxhdGVkVGFyZ2V0XCIsIFwic2hpZnRLZXlcIiwgXCJ0YXJnZXRcIiwgXCJ0aW1lU3RhbXBcIiwgXCJ2aWV3XCIsXG4gICAgICBcIndoaWNoXCIsIFwiY2hhclwiLCBcImNoYXJDb2RlXCIsIFwia2V5XCIsIFwia2V5Q29kZVwiLCBcImJ1dHRvblwiLCBcImJ1dHRvbnNcIixcbiAgICAgIFwiY2xpZW50WFwiLCBcImNsaWVudFlcIiwgXCJcIiwgXCJvZmZzZXRYXCIsIFwib2Zmc2V0WVwiLCBcInBhZ2VYXCIsIFwicGFnZVlcIiwgXCJzY3JlZW5YXCIsXG4gICAgICBcInNjcmVlbllcIiwgXCJ0b0VsZW1lbnRcIlxuICAgIF0pKTtcblxuXHQvLyBDcmVhdGUgYSB0aW1lc3RhbXAgaWYgaW5jb21pbmcgZXZlbnQgZG9lc24ndCBoYXZlIG9uZVxuXHR0aGlzLnRpbWVTdGFtcCA9IHNyYyAmJiBzcmMudGltZVN0YW1wIHx8IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG5cblx0Ly8gTWFyayBpdCBhcyBmaXhlZFxuXHR0aGlzLmlzRXZlbnQgPSB0cnVlO1xufTtcblxuJC5FdmVudC5wcm90b3R5cGUgPSB7XG5cdGNvbnN0cnVjdG9yOiAkLkV2ZW50LFxuXHRpc0RlZmF1bHRQcmV2ZW50ZWQ6IHJldHVybkZhbHNlLFxuXHRpc1Byb3BhZ2F0aW9uU3RvcHBlZDogcmV0dXJuRmFsc2UsXG5cdGlzSW1tZWRpYXRlUHJvcGFnYXRpb25TdG9wcGVkOiByZXR1cm5GYWxzZSxcblxuXHRwcmV2ZW50RGVmYXVsdDogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGUgPSB0aGlzLm9yaWdpbmFsRXZlbnQ7XG5cblx0XHR0aGlzLmlzRGVmYXVsdFByZXZlbnRlZCA9IHJldHVyblRydWU7XG5cblx0XHRpZiAoIGUgJiYgZS5wcmV2ZW50RGVmYXVsdCApIHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHR9XG5cdH0sXG5cdHN0b3BQcm9wYWdhdGlvbjogZnVuY3Rpb24oKSB7XG5cdFx0dmFyIGUgPSB0aGlzLm9yaWdpbmFsRXZlbnQ7XG5cblx0XHR0aGlzLmlzUHJvcGFnYXRpb25TdG9wcGVkID0gcmV0dXJuVHJ1ZTtcblxuXHRcdGlmICggZSAmJiBlLnN0b3BQcm9wYWdhdGlvbiApIHtcblx0XHRcdGUuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdFx0fVxuXHR9LFxuXHRzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb246IGZ1bmN0aW9uKCkge1xuXHRcdHZhciBlID0gdGhpcy5vcmlnaW5hbEV2ZW50O1xuXG5cdFx0dGhpcy5pc0ltbWVkaWF0ZVByb3BhZ2F0aW9uU3RvcHBlZCA9IHJldHVyblRydWU7XG5cblx0XHRpZiAoIGUgJiYgZS5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24gKSB7XG5cdFx0XHRlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuXHRcdH1cblxuXHRcdHRoaXMuc3RvcFByb3BhZ2F0aW9uKCk7XG5cdH1cbn07XG5cblxudXRpbHMucHJvdG90eXBlID0ge1xuXG4gIC8vIEdpdmVuIGEgdmFsaWQgZGF0YSBwYXRoLCBzcGxpdCBpdCBpbnRvIGFuIGFycmF5IG9mIGl0cyBwYXJ0cy5cbiAgLy8gZXg6IGZvby5iYXJbMF0uYmF6IC0tPiBbJ2ZvbycsICd2YXInLCAnMCcsICdiYXonXVxuICBzcGxpdFBhdGg6IGZ1bmN0aW9uKHBhdGgpe1xuICAgIHBhdGggPSAoJy4nK3BhdGgrJy4nKS5zcGxpdCgvKD86XFwufFxcW3xcXF0pKy8pO1xuICAgIHBhdGgucG9wKCk7XG4gICAgcGF0aC5zaGlmdCgpO1xuICAgIHJldHVybiBwYXRoO1xuICB9LFxuXG4gIC8vIEFwcGxpZXMgZnVuY3Rpb24gYGZ1bmNgIGRlcHRoIGZpcnN0IHRvIGV2ZXJ5IG5vZGUgaW4gdGhlIHN1YnRyZWUgc3RhcnRpbmcgZnJvbSBgcm9vdGBcbiAgd2Fsa1RoZURPTTogZnVuY3Rpb24oZnVuYykge1xuICAgIHZhciBlbCwgcm9vdCwgbGVuID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUobGVuLS0pe1xuICAgICAgcm9vdCA9IHRoaXNbbGVuXTtcbiAgICAgIGZ1bmMocm9vdCk7XG4gICAgICByb290ID0gcm9vdC5maXJzdENoaWxkO1xuICAgICAgd2hpbGUgKHJvb3QpIHtcbiAgICAgICAgICAkKHJvb3QpLndhbGtUaGVET00oZnVuYyk7XG4gICAgICAgICAgcm9vdCA9IHJvb3QubmV4dFNpYmxpbmc7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIC8vIEV2ZW50cyByZWdpc3RyeS4gQW4gb2JqZWN0IGNvbnRhaW5pbmcgYWxsIGV2ZW50cyBib3VuZCB0aHJvdWdoIHRoaXMgdXRpbCBzaGFyZWQgYW1vbmcgYWxsIGluc3RhbmNlcy5cbiAgX2V2ZW50czoge30sXG5cbiAgLy8gVGFrZXMgdGhlIHRhcmdlZCB0aGUgZXZlbnQgZmlyZWQgb24gYW5kIHJldHVybnMgYWxsIGNhbGxiYWNrcyBmb3IgdGhlIGRlbGVnYXRlZCBlbGVtZW50XG4gIF9oYXNEZWxlZ2F0ZTogZnVuY3Rpb24odGFyZ2V0LCBkZWxlZ2F0ZSwgZXZlbnRUeXBlKXtcbiAgICB2YXIgY2FsbGJhY2tzID0gW107XG5cbiAgICAvLyBHZXQgb3VyIGNhbGxiYWNrc1xuICAgIGlmKHRhcmdldC5kZWxlZ2F0ZUdyb3VwICYmIHRoaXMuX2V2ZW50c1t0YXJnZXQuZGVsZWdhdGVHcm91cF1bZXZlbnRUeXBlXSl7XG4gICAgICBfLmVhY2godGhpcy5fZXZlbnRzW3RhcmdldC5kZWxlZ2F0ZUdyb3VwXVtldmVudFR5cGVdLCBmdW5jdGlvbihjYWxsYmFja3NMaXN0LCBkZWxlZ2F0ZUlkKXtcbiAgICAgICAgaWYoXy5pc0FycmF5KGNhbGxiYWNrc0xpc3QpICYmIChkZWxlZ2F0ZUlkID09PSBkZWxlZ2F0ZS5kZWxlZ2F0ZUlkIHx8ICggZGVsZWdhdGUubWF0Y2hlc1NlbGVjdG9yICYmIGRlbGVnYXRlLm1hdGNoZXNTZWxlY3RvcihkZWxlZ2F0ZUlkKSApKSApe1xuICAgICAgICAgIGNhbGxiYWNrcyA9IGNhbGxiYWNrcy5jb25jYXQoY2FsbGJhY2tzTGlzdCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBjYWxsYmFja3M7XG4gIH0sXG5cbiAgLy8gVHJpZ2dlcnMgYW4gZXZlbnQgb24gYSBnaXZlbiBkb20gbm9kZVxuICB0cmlnZ2VyOiBmdW5jdGlvbihldmVudE5hbWUsIG9wdGlvbnMpe1xuICAgIHZhciBlbCwgbGVuID0gdGhpcy5sZW5ndGg7XG4gICAgd2hpbGUobGVuLS0pe1xuICAgICAgZWwgPSB0aGlzW2xlbl07XG4gICAgICBpZiAoZG9jdW1lbnQuY3JlYXRlRXZlbnQpIHtcbiAgICAgICAgdmFyIGV2ZW50ID0gZG9jdW1lbnQuY3JlYXRlRXZlbnQoJ0hUTUxFdmVudHMnKTtcbiAgICAgICAgZXZlbnQuaW5pdEV2ZW50KGV2ZW50TmFtZSwgdHJ1ZSwgZmFsc2UpO1xuICAgICAgICBlbC5kaXNwYXRjaEV2ZW50KGV2ZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGVsLmZpcmVFdmVudCgnb24nK2V2ZW50TmFtZSk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIG9mZjogZnVuY3Rpb24oZXZlbnRUeXBlLCBoYW5kbGVyKXtcbiAgICB2YXIgZWwsIGxlbiA9IHRoaXMubGVuZ3RoLCBldmVudENvdW50O1xuXG4gICAgd2hpbGUobGVuLS0pe1xuXG4gICAgICBlbCA9IHRoaXNbbGVuXTtcbiAgICAgIGV2ZW50Q291bnQgPSAwO1xuXG4gICAgICBpZihlbC5kZWxlZ2F0ZUdyb3VwKXtcbiAgICAgICAgaWYodGhpcy5fZXZlbnRzW2VsLmRlbGVnYXRlR3JvdXBdW2V2ZW50VHlwZV0gJiYgXy5pc0FycmF5KHRoaXMuX2V2ZW50c1tlbC5kZWxlZ2F0ZUdyb3VwXVtldmVudFR5cGVdW2VsLmRlbGVnYXRlSWRdKSl7XG4gICAgICAgICAgXy5lYWNoKHRoaXMuX2V2ZW50c1tlbC5kZWxlZ2F0ZUdyb3VwXVtldmVudFR5cGVdLCBmdW5jdGlvbihkZWxlZ2F0ZSwgaW5kZXgsIGRlbGVnYXRlTGlzdCl7XG4gICAgICAgICAgICBfLmVhY2goZGVsZWdhdGVMaXN0LCBmdW5jdGlvbihjYWxsYmFjaywgaW5kZXgsIGNhbGxiYWNrTGlzdCl7XG4gICAgICAgICAgICAgIGlmKGNhbGxiYWNrID09PSBoYW5kbGVyKXtcbiAgICAgICAgICAgICAgICBkZWxldGUgY2FsbGJhY2tMaXN0W2luZGV4XTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgZXZlbnRDb3VudCsrO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gSWYgdGhlcmUgYXJlIG5vIG1vcmUgb2YgdGhpcyBldmVudCB0eXBlIGRlbGVnYXRlZCBmb3IgdGhpcyBncm91cCwgcmVtb3ZlIHRoZSBsaXN0ZW5lclxuICAgICAgaWYgKGV2ZW50Q291bnQgPT09IDAgJiYgZWwucmVtb3ZlRXZlbnRMaXN0ZW5lcil7XG4gICAgICAgIGVsLnJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRUeXBlLCBoYW5kbGVyLCBmYWxzZSk7XG4gICAgICB9XG4gICAgICBpZiAoZXZlbnRDb3VudCA9PT0gMCAmJiBlbC5kZXRhY2hFdmVudCl7XG4gICAgICAgIGVsLmRldGFjaEV2ZW50KCdvbicrZXZlbnRUeXBlLCBoYW5kbGVyKTtcbiAgICAgIH1cblxuICAgIH1cbiAgfSxcblxuICBvbjogZnVuY3Rpb24gKGV2ZW50TmFtZSwgZGVsZWdhdGUsIGRhdGEsIGhhbmRsZXIpIHtcbiAgICB2YXIgZWwsXG4gICAgICAgIGV2ZW50cyA9IHRoaXMuX2V2ZW50cyxcbiAgICAgICAgbGVuID0gdGhpcy5sZW5ndGgsXG4gICAgICAgIGV2ZW50TmFtZXMgPSBldmVudE5hbWUuc3BsaXQoJyAnKSxcbiAgICAgICAgZGVsZWdhdGVJZCwgZGVsZWdhdGVHcm91cDtcblxuICAgIHdoaWxlKGxlbi0tKXtcbiAgICAgIGVsID0gdGhpc1tsZW5dO1xuXG4gICAgICAvLyBOb3JtYWxpemUgZGF0YSBpbnB1dFxuICAgICAgaWYoXy5pc0Z1bmN0aW9uKGRlbGVnYXRlKSl7XG4gICAgICAgIGhhbmRsZXIgPSBkZWxlZ2F0ZTtcbiAgICAgICAgZGVsZWdhdGUgPSBlbDtcbiAgICAgICAgZGF0YSA9IHt9O1xuICAgICAgfVxuICAgICAgaWYoXy5pc0Z1bmN0aW9uKGRhdGEpKXtcbiAgICAgICAgaGFuZGxlciA9IGRhdGE7XG4gICAgICAgIGRhdGEgPSB7fTtcbiAgICAgIH1cbiAgICAgIGlmKCFfLmlzU3RyaW5nKGRlbGVnYXRlKSAmJiAhXy5pc0VsZW1lbnQoZGVsZWdhdGUpKXtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkRlbGVnYXRlIHZhbHVlIHBhc3NlZCB0byBSZWJvdW5kJ3MgJC5vbiBpcyBuZWl0aGVyIGFuIGVsZW1lbnQgb3IgY3NzIHNlbGVjdG9yXCIpO1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGRlbGVnYXRlSWQgPSBfLmlzU3RyaW5nKGRlbGVnYXRlKSA/IGRlbGVnYXRlIDogKGRlbGVnYXRlLmRlbGVnYXRlSWQgPSBkZWxlZ2F0ZS5kZWxlZ2F0ZUlkIHx8IF8udW5pcXVlSWQoJ2V2ZW50JykpO1xuICAgICAgZGVsZWdhdGVHcm91cCA9IGVsLmRlbGVnYXRlR3JvdXAgPSAoZWwuZGVsZWdhdGVHcm91cCB8fCBfLnVuaXF1ZUlkKCdkZWxlZ2F0ZUdyb3VwJykpO1xuXG4gICAgICBfLmVhY2goZXZlbnROYW1lcywgZnVuY3Rpb24oZXZlbnROYW1lKXtcblxuICAgICAgICAvLyBFbnN1cmUgZXZlbnQgb2JqIGV4aXN0YW5jZVxuICAgICAgICBldmVudHNbZGVsZWdhdGVHcm91cF0gPSBldmVudHNbZGVsZWdhdGVHcm91cF0gfHwge307XG5cbiAgICAgICAgLy8gVE9ETzogdGFrZSBvdXQgb2YgbG9vcFxuICAgICAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgIHZhciB0YXJnZXQsIGksIGxlbiwgZXZlbnRMaXN0LCBjYWxsYmFja3MsIGNhbGxiYWNrLCBmYWxzeTtcbiAgICAgICAgICAgICAgZXZlbnQgPSBuZXcgJC5FdmVudCgoZXZlbnQgfHwgd2luZG93LmV2ZW50KSk7IC8vIENvbnZlcnQgdG8gbXV0YWJsZSBldmVudFxuICAgICAgICAgICAgICB0YXJnZXQgPSBldmVudC50YXJnZXQgfHwgZXZlbnQuc3JjRWxlbWVudDtcblxuICAgICAgICAgICAgICAvLyBUcmF2ZWwgZnJvbSB0YXJnZXQgdXAgdG8gcGFyZW50IGZpcmluZyBldmVudCBvbiBkZWxlZ2F0ZSB3aGVuIGl0IGV4aXp0c1xuICAgICAgICAgICAgICB3aGlsZSh0YXJnZXQpe1xuXG4gICAgICAgICAgICAgICAgLy8gR2V0IGFsbCBzcGVjaWZpZWQgY2FsbGJhY2tzIChlbGVtZW50IHNwZWNpZmljIGFuZCBzZWxlY3RvciBzcGVjaWZpZWQpXG4gICAgICAgICAgICAgICAgY2FsbGJhY2tzID0gJC5faGFzRGVsZWdhdGUoZWwsIHRhcmdldCwgZXZlbnQudHlwZSk7XG5cbiAgICAgICAgICAgICAgICBsZW4gPSBjYWxsYmFja3MubGVuZ3RoO1xuICAgICAgICAgICAgICAgIGZvcihpPTA7aTxsZW47aSsrKXtcbiAgICAgICAgICAgICAgICAgIGV2ZW50LnRhcmdldCA9IGV2ZW50LnNyY0VsZW1lbnQgPSB0YXJnZXQ7ICAgICAgICAgICAgICAgLy8gQXR0YWNoIHRoaXMgbGV2ZWwncyB0YXJnZXRcbiAgICAgICAgICAgICAgICAgIGV2ZW50LmRhdGEgPSBjYWxsYmFja3NbaV0uZGF0YTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQXR0YWNoIG91ciBkYXRhIHRvIHRoZSBldmVudFxuICAgICAgICAgICAgICAgICAgZXZlbnQucmVzdWx0ID0gY2FsbGJhY2tzW2ldLmNhbGxiYWNrLmNhbGwoZWwsIGV2ZW50KTsgICAvLyBDYWxsIHRoZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgICAgZmFsc3kgPSAoIGV2ZW50LnJlc3VsdCA9PT0gZmFsc2UgKSA/IHRydWUgOiBmYWxzeTsgICAgICAvLyBJZiBhbnkgY2FsbGJhY2sgcmV0dXJucyBmYWxzZSwgbG9nIGl0IGFzIGZhbHN5XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gSWYgYW55IG9mIHRoZSBjYWxsYmFja3MgcmV0dXJuZWQgZmFsc2UsIHByZXZlbnQgZGVmYXVsdCBhbmQgc3RvcCBwcm9wYWdhdGlvblxuICAgICAgICAgICAgICAgIGlmKGZhbHN5KXtcbiAgICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0YXJnZXQgPSB0YXJnZXQucGFyZW50Tm9kZTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAvLyBJZiB0aGlzIGlzIHRoZSBmaXJzdCBldmVudCBvZiBpdHMgdHlwZSwgYWRkIHRoZSBldmVudCBoYW5kbGVyXG4gICAgICAgIC8vIEFkZEV2ZW50TGlzdGVuZXIgc3VwcG9ydHMgSUU5K1xuICAgICAgICBpZighZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV0pe1xuICAgICAgICAgIC8vIElmIGV2ZW50IGlzIGZvY3VzIG9yIGJsdXIsIHVzZSBjYXB0dXJlIHRvIGFsbG93IGZvciBldmVudCBkZWxlZ2F0aW9uLlxuICAgICAgICAgIGVsLmFkZEV2ZW50TGlzdGVuZXIoZXZlbnROYW1lLCBjYWxsYmFjaywgKGV2ZW50TmFtZSA9PT0gJ2ZvY3VzJyB8fCBldmVudE5hbWUgPT09ICdibHVyJykpO1xuICAgICAgICB9XG5cblxuICAgICAgICAvLyBBZGQgb3VyIGxpc3RlbmVyXG4gICAgICAgIGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdID0gZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV0gfHwge307XG4gICAgICAgIGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdW2RlbGVnYXRlSWRdID0gZXZlbnRzW2RlbGVnYXRlR3JvdXBdW2V2ZW50TmFtZV1bZGVsZWdhdGVJZF0gfHwgW107XG4gICAgICAgIGV2ZW50c1tkZWxlZ2F0ZUdyb3VwXVtldmVudE5hbWVdW2RlbGVnYXRlSWRdLnB1c2goe2NhbGxiYWNrOiBoYW5kbGVyLCBkYXRhOiBkYXRhfSk7XG5cbiAgICAgIH0sIHRoaXMpO1xuICAgIH1cbiAgfSxcblxuICBmbGF0dGVuOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgdmFyIHJlc3VsdCA9IHt9O1xuICAgIGZ1bmN0aW9uIHJlY3Vyc2UgKGN1ciwgcHJvcCkge1xuICAgICAgaWYgKE9iamVjdChjdXIpICE9PSBjdXIpIHtcbiAgICAgICAgcmVzdWx0W3Byb3BdID0gY3VyO1xuICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGN1cikpIHtcbiAgICAgICAgZm9yKHZhciBpPTAsIGw9Y3VyLmxlbmd0aDsgaTxsOyBpKyspXG4gICAgICAgICAgcmVjdXJzZShjdXJbaV0sIHByb3AgKyBcIltcIiArIGkgKyBcIl1cIik7XG4gICAgICAgICAgaWYgKGwgPT09IDApXG4gICAgICAgICAgICByZXN1bHRbcHJvcF0gPSBbXTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdmFyIGlzRW1wdHkgPSB0cnVlO1xuICAgICAgICAgICAgZm9yICh2YXIgcCBpbiBjdXIpIHtcbiAgICAgICAgICAgICAgaXNFbXB0eSA9IGZhbHNlO1xuICAgICAgICAgICAgICByZWN1cnNlKGN1cltwXSwgcHJvcCA/IHByb3ArXCIuXCIrcCA6IHApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGlzRW1wdHkgJiYgcHJvcClcbiAgICAgICAgICAgICAgcmVzdWx0W3Byb3BdID0ge307XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJlY3Vyc2UoZGF0YSwgXCJcIik7XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfSxcblxuICB1bk1hcmtMaW5rczogZnVuY3Rpb24oKXtcbiAgICB2YXIgbGlua3MgPSB0aGlzWzBdLnF1ZXJ5U2VsZWN0b3JBbGwoJ2FbaHJlZj1cIi8nK0JhY2tib25lLmhpc3RvcnkuZnJhZ21lbnQrJ1wiXScpXG4gICAgZm9yKHZhciBpPTA7aTxsaW5rcy5sZW5ndGg7aSsrKXtcbiAgICAgIGxpbmtzLml0ZW0oaSkuY2xhc3NMaXN0LnJlbW92ZSgnYWN0aXZlJyk7XG4gICAgICBsaW5rcy5pdGVtKGkpLmFjdGl2ZSA9IGZhbHNlO1xuICAgIH1cbiAgfSxcbiAgbWFya0xpbmtzOiBmdW5jdGlvbigpe1xuICAgIHZhciBsaW5rcyA9IHRoaXNbMF0ucXVlcnlTZWxlY3RvckFsbCgnYVtocmVmPVwiLycrQmFja2JvbmUuaGlzdG9yeS5mcmFnbWVudCsnXCJdJyk7XG4gICAgZm9yKHZhciBpPTA7aTxsaW5rcy5sZW5ndGg7aSsrKXtcbiAgICAgIGxpbmtzLml0ZW0oaSkuY2xhc3NMaXN0LmFkZCgnYWN0aXZlJyk7XG4gICAgICBsaW5rcy5pdGVtKGkpLmFjdGl2ZSA9IHRydWU7XG4gICAgfVxuICB9LFxuXG4gIC8vIGh0dHA6Ly9rcmFzaW1pcnRzb25ldi5jb20vYmxvZy9hcnRpY2xlL0Nyb3NzLWJyb3dzZXItaGFuZGxpbmctb2YtQWpheC1yZXF1ZXN0cy1pbi1hYnN1cmRqc1xuICBhamF4OiBmdW5jdGlvbihvcHMpIHtcbiAgICAgIGlmKHR5cGVvZiBvcHMgPT0gJ3N0cmluZycpIG9wcyA9IHsgdXJsOiBvcHMgfTtcbiAgICAgIG9wcy51cmwgPSBvcHMudXJsIHx8ICcnO1xuICAgICAgb3BzLmpzb24gPSBvcHMuanNvbiB8fCB0cnVlO1xuICAgICAgb3BzLm1ldGhvZCA9IG9wcy5tZXRob2QgfHwgJ2dldCc7XG4gICAgICBvcHMuZGF0YSA9IG9wcy5kYXRhIHx8IHt9O1xuICAgICAgdmFyIGdldFBhcmFtcyA9IGZ1bmN0aW9uKGRhdGEsIHVybCkge1xuICAgICAgICAgIHZhciBhcnIgPSBbXSwgc3RyO1xuICAgICAgICAgIGZvcih2YXIgbmFtZSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgIGFyci5wdXNoKG5hbWUgKyAnPScgKyBlbmNvZGVVUklDb21wb25lbnQoZGF0YVtuYW1lXSkpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBzdHIgPSBhcnIuam9pbignJicpO1xuICAgICAgICAgIGlmKHN0ciAhPT0gJycpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHVybCA/ICh1cmwuaW5kZXhPZignPycpIDwgMCA/ICc/JyArIHN0ciA6ICcmJyArIHN0cikgOiBzdHI7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiAnJztcbiAgICAgIH07XG4gICAgICB2YXIgYXBpID0ge1xuICAgICAgICAgIGhvc3Q6IHt9LFxuICAgICAgICAgIHByb2Nlc3M6IGZ1bmN0aW9uKG9wcykge1xuICAgICAgICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICAgICAgIHRoaXMueGhyID0gbnVsbDtcbiAgICAgICAgICAgICAgaWYod2luZG93LkFjdGl2ZVhPYmplY3QpIHsgdGhpcy54aHIgPSBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTsgfVxuICAgICAgICAgICAgICBlbHNlIGlmKHdpbmRvdy5YTUxIdHRwUmVxdWVzdCkgeyB0aGlzLnhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpOyB9XG4gICAgICAgICAgICAgIGlmKHRoaXMueGhyKSB7XG4gICAgICAgICAgICAgICAgICB0aGlzLnhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICBpZihzZWxmLnhoci5yZWFkeVN0YXRlID09IDQgJiYgc2VsZi54aHIuc3RhdHVzID09IDIwMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzdWx0ID0gc2VsZi54aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICBpZihvcHMuanNvbiA9PT0gdHJ1ZSAmJiB0eXBlb2YgSlNPTiAhPSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gSlNPTi5wYXJzZShyZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZG9uZUNhbGxiYWNrICYmIHNlbGYuZG9uZUNhbGxiYWNrLmFwcGx5KHNlbGYuaG9zdCwgW3Jlc3VsdCwgc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3BzLnN1Y2Nlc3MgJiYgb3BzLnN1Y2Nlc3MuYXBwbHkoc2VsZi5ob3N0LCBbcmVzdWx0LCBzZWxmLnhocl0pO1xuICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZihzZWxmLnhoci5yZWFkeVN0YXRlID09IDQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5mYWlsQ2FsbGJhY2sgJiYgc2VsZi5mYWlsQ2FsbGJhY2suYXBwbHkoc2VsZi5ob3N0LCBbc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb3BzLmVycm9yICYmIG9wcy5lcnJvci5hcHBseShzZWxmLmhvc3QsIFtzZWxmLnhocl0pO1xuICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICBzZWxmLmFsd2F5c0NhbGxiYWNrICYmIHNlbGYuYWx3YXlzQ2FsbGJhY2suYXBwbHkoc2VsZi5ob3N0LCBbc2VsZi54aHJdKTtcbiAgICAgICAgICAgICAgICAgICAgICBvcHMuY29tcGxldGUgJiYgb3BzLmNvbXBsZXRlLmFwcGx5KHNlbGYuaG9zdCwgW3NlbGYueGhyXSk7XG4gICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKG9wcy5tZXRob2QgPT0gJ2dldCcpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMueGhyLm9wZW4oXCJHRVRcIiwgb3BzLnVybCArIGdldFBhcmFtcyhvcHMuZGF0YSwgb3BzLnVybCksIHRydWUpO1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXJzKHtcbiAgICAgICAgICAgICAgICAgICAgJ1gtUmVxdWVzdGVkLVdpdGgnOiAnWE1MSHR0cFJlcXVlc3QnXG4gICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMueGhyLm9wZW4ob3BzLm1ldGhvZCwgb3BzLnVybCwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICB0aGlzLnNldEhlYWRlcnMoe1xuICAgICAgICAgICAgICAgICAgICAgICdYLVJlcXVlc3RlZC1XaXRoJzogJ1hNTEh0dHBSZXF1ZXN0JyxcbiAgICAgICAgICAgICAgICAgICAgICAnQ29udGVudC10eXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCdcbiAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGlmKG9wcy5oZWFkZXJzICYmIHR5cGVvZiBvcHMuaGVhZGVycyA9PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgICAgICAgdGhpcy5zZXRIZWFkZXJzKG9wcy5oZWFkZXJzKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgb3BzLm1ldGhvZCA9PSAnZ2V0JyA/IHNlbGYueGhyLnNlbmQoKSA6IHNlbGYueGhyLnNlbmQoZ2V0UGFyYW1zKG9wcy5kYXRhKSk7XG4gICAgICAgICAgICAgIH0sIDIwKTtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMueGhyO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgZG9uZTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgdGhpcy5kb25lQ2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBmYWlsOiBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgICAgICAgICB0aGlzLmZhaWxDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICB9LFxuICAgICAgICAgIGFsd2F5czogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgICAgICAgdGhpcy5hbHdheXNDYWxsYmFjayA9IGNhbGxiYWNrO1xuICAgICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgICB9LFxuICAgICAgICAgIHNldEhlYWRlcnM6IGZ1bmN0aW9uKGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgZm9yKHZhciBuYW1lIGluIGhlYWRlcnMpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMueGhyICYmIHRoaXMueGhyLnNldFJlcXVlc3RIZWFkZXIobmFtZSwgaGVhZGVyc1tuYW1lXSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICB9O1xuICAgICAgcmV0dXJuIGFwaS5wcm9jZXNzKG9wcyk7XG4gIH1cbn07XG5cbl8uZXh0ZW5kKCQsIHV0aWxzLnByb3RvdHlwZSk7XG5cblxuXG5leHBvcnQgZGVmYXVsdCAkO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
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
